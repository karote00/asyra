import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { prepareLargeNavigationDocument } from './large-navigation-document'
import { waitForAppReady } from './test-utils'

interface LoadObservation {
  connectedAtMs?: number
  workerTimings: { atMs: number; phase: string; durationMs: number }[]
  workerCounters: { name: string; value: number }[]
  rasters: { width: number; height: number }[]
  longTasks: { start: number; duration: number }[]
}
declare global {
  interface Window {
    documentLoadObservation: LoadObservation
  }
}

test('loads the preserved full document through ordinary socket bootstrap', async ({
  page,
  baseURL
}, info) => {
  const { identity, manifest } = await prepareLargeNavigationDocument(baseURL)
  await page.setViewportSize({ width: 1728, height: 1000 })
  const errors: string[] = []
  const navigation: { url: string; at: number }[] = []
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame())
      navigation.push({ url: frame.url(), at: Date.now() })
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.addInitScript(() => {
    const observation: LoadObservation = {
      workerTimings: [],
      workerCounters: [],
      rasters: [],
      longTasks: []
    }
    window.documentLoadObservation = observation
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        observation.longTasks.push({
          start: entry.startTime,
          duration: entry.duration
        })
    }).observe({ type: 'longtask', buffered: true })
    const original = OffscreenCanvasRenderingContext2D.prototype.createImageData
    OffscreenCanvasRenderingContext2D.prototype.createImageData = function (
      ...args: Parameters<typeof original>
    ) {
      const image = Reflect.apply(original, this, args) as ImageData
      observation.rasters.push({ width: image.width, height: image.height })
      return image
    } as typeof original
    const NativeWorker = window.Worker
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options)
        this.addEventListener('message', (event) => {
          const data = event.data
          if (data?.type === 'connected' && data.bootstrap)
            observation.connectedAtMs = performance.now()
          if (data?.type === 'timing')
            observation.workerTimings.push({
              atMs: performance.now(),
              phase: data.phase,
              durationMs: data.durationMs
            })
          if (data?.type === 'diagnostic-counter')
            observation.workerCounters.push({
              name: data.name,
              value: data.value
            })
        })
      }
    }
  })
  const profileEnabled = process.env.LOAD_CPU_PROFILE === 'true'
  const cdp = profileEnabled
    ? await page.context().newCDPSession(page)
    : undefined
  if (cdp) {
    await cdp.send('Profiler.enable')
    await cdp.send('Profiler.start')
  }
  try {
    await page.goto(identity.url, { waitUntil: 'commit', timeout: 240_000 })
    await waitForAppReady(page)
    await expect
      .poll(
        () => {
          if (errors.length) throw new Error(errors[0])
          return page.evaluate(async () => {
            const { core } = await import('../src/testing/runtime-access')
            return {
              canonical: core.getCanonicalElementCount(),
              projected: core.getProjectedElementCount()
            }
          })
        },
        { timeout: 220_000, intervals: [250] }
      )
      .toEqual({ canonical: manifest.elements, projected: manifest.elements })
    const report = await page.evaluate(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
      return {
        ...window.documentLoadObservation,
        readyMs: performance.now(),
        userAgent: navigator.userAgent,
        dpr: devicePixelRatio
      }
    })
    await writeFile(
      info.outputPath('load.json'),
      JSON.stringify({ ...report, errors, manifest, profileEnabled }, null, 2)
    )
    // Serialization and screenshots happen after the timed load interval.
    const state = await page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')
      const saved = await core.save()
      const bytes = new TextEncoder().encode(JSON.stringify(saved))
      const digest = await crypto.subtle.digest('SHA-256', bytes)
      return {
        properties: Object.keys(saved.props).length,
        elements: Object.keys(saved.sceneTree.elements).length - 1,
        digest: Array.from(new Uint8Array(digest), (value) =>
          value.toString(16).padStart(2, '0')
        ).join('')
      }
    })
    await writeFile(
      info.outputPath('canonical.json'),
      JSON.stringify(state, null, 2)
    )
    expect(state.properties).toBe(manifest.properties)
    expect(state.elements).toBe(manifest.elements)
    await page.evaluate(async () =>
      (await import('../src/common-apis/viewport')).viewportApis.zoomFit()
    )
    await page.screenshot({ path: info.outputPath('loaded.png') })
    for (const fraction of [0.15, 0.5, 0.85]) {
      await page.evaluate(async (fraction) => {
        const { core } = await import('../src/testing/runtime-access')
        const { viewportApis } = await import('../src/common-apis/viewport')
        const bounds = core.getAllElementsBounds()
        if (!bounds) throw new Error('Document bounds missing')
        viewportApis.zoomToCenter(1, 800, 500)
        viewportApis.panTo(
          800 - (bounds.minX + bounds.maxX) / 2,
          500 - (bounds.minY + (bounds.maxY - bounds.minY) * fraction)
        )
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
      }, fraction)
      await page.screenshot({ path: info.outputPath(`detail-${fraction}.png`) })
    }
    expect(errors).toEqual([])
  } finally {
    await writeFile(
      info.outputPath('browser-errors.json'),
      JSON.stringify({ errors, navigation }, null, 2)
    )
    if (cdp) {
      const { profile } = await cdp.send('Profiler.stop')
      await writeFile(
        info.outputPath('load.cpuprofile'),
        JSON.stringify(profile)
      )
    }
  }
})
