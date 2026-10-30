import { writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { expect, test } from '@playwright/test'
import { prepareLargeNavigationDocument } from './large-navigation-document'
import { installNavigationWorkProbe } from './navigation-work-probe'
import { waitForAppReady } from './test-utils'

// Explicit local configuration only. Never turn these observations into CI FPS gates.
test('measures sustained native wheel pan and zoom on the full document', async ({
  page,
  baseURL
}, testInfo) => {
  test.skip(Boolean(process.env.CI), 'Local machine measurement only')
  test.setTimeout(180_000)
  const inputHz = Number(process.env.NAVIGATION_INPUT_HZ ?? 60)
  if (![60, 120].includes(inputHz))
    throw new Error('Navigation input cadence must be 60 or 120 Hz')
  const inputCount = inputHz * 5
  const deltaScale = 60 / inputHz
  const { identity, manifest } = await prepareLargeNavigationDocument(baseURL)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await installNavigationWorkProbe(page)
  await page.goto(identity.url)
  await waitForAppReady(page)
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const { core } = await import('../src/testing/runtime-access')
          return Object.keys(core.sceneTreeSaveData().elements).length - 1
        }),
      { timeout: 60_000 }
    )
    .toBe(manifest.elements)
  const cdp = await page.context().newCDPSession(page)
  const withProfiler = process.env.NAVIGATION_CPU_PROFILE === 'true'
  if (withProfiler) await cdp.send('Profiler.enable')
  const results = []

  for (const phase of ['idle', 'pan', 'zoom'] as const) {
    await page.evaluate(async () => {
      const { viewportApis } = await import('../src/common-apis/viewport')
      viewportApis.zoomFit()
    })
    await page.mouse.move(1000, 450)
    // Keep initialization and warmup out of the interaction measurement.
    await delay(500)
    if (phase === 'zoom') await page.keyboard.down('Meta')
    if (withProfiler && phase !== 'idle') await cdp.send('Profiler.start')
    const measurement = page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')
      const { viewportApis } = await import('../src/common-apis/viewport')
      const before = {
        position: viewportApis.getPosition(),
        scale: viewportApis.getScale()
      }
      let publications = 0
      const unsubscribe = core.subscribeToSharedPublication(() => {
        publications++
      })
      const inputs: { time: number; deltaX: number; deltaY: number }[] = []
      const onWheel = (event: WheelEvent) =>
        inputs.push({
          time: performance.now(),
          deltaX: event.deltaX,
          deltaY: event.deltaY
        })
      window.addEventListener('wheel', onWheel, {
        capture: true,
        passive: true
      })
      const longTasks: { start: number; duration: number }[] = []
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          longTasks.push({ start: entry.startTime, duration: entry.duration })
      })
      observer.observe({ type: 'longtask' })
      window.navigationGpuWork = {
        draws: 0,
        vertexUploadBytes: 0,
        uniformMatrices: 0
      }
      const samples: {
        time: number
        draws: number
        x: number
        y: number
        scale: number
      }[] = []
      // Read-only camera sampling. No direct viewport updates in this interval.
      const start = performance.now()
      await new Promise<void>((resolve) => {
        const frame = () => {
          const position = viewportApis.getPosition()
          samples.push({
            time: performance.now(),
            draws: window.navigationGpuWork.draws,
            x: position.x,
            y: position.y,
            scale: viewportApis.getScale()
          })
          if (performance.now() - start < 6500) requestAnimationFrame(frame)
          else resolve()
        }
        requestAnimationFrame(frame)
      })
      observer.disconnect()
      window.removeEventListener('wheel', onWheel, true)
      unsubscribe()
      return {
        before,
        inputs,
        samples,
        longTasks,
        publications,
        gpuWork: { ...window.navigationGpuWork },
        dpr: devicePixelRatio,
        viewport: { width: innerWidth, height: innerHeight },
        userAgent: navigator.userAgent
      }
    })
    // Native browser input at a fixed offered cadence, independent of rendering.
    // Record delivered events too: browser coalescing must not masquerade as FPS.
    const offered = []
    const started = performance.now()
    const pending: Promise<unknown>[] = []
    if (phase !== 'idle') {
      for (let index = 0; index < inputCount; index++) {
        await delay(
          Math.max(0, started + index * (1000 / inputHz) - performance.now())
        )
        const direction = index < inputCount / 2 ? 1 : -1
        offered.push(performance.now() - started)
        pending.push(
          cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseWheel',
            x: 1000,
            y: 450,
            deltaX: phase === 'pan' ? direction * 2 * deltaScale : 0,
            deltaY: (phase === 'pan' ? direction : -direction) * deltaScale,
            modifiers: phase === 'zoom' ? 4 : 0
          })
        )
      }
      await Promise.all(pending)
    }
    const report = await measurement
    if (phase === 'zoom') await page.keyboard.up('Meta')
    if (withProfiler && phase !== 'idle') {
      const { profile } = await cdp.send('Profiler.stop')
      await writeFile(
        testInfo.outputPath(`${phase}.cpuprofile`),
        JSON.stringify(profile)
      )
    }
    const first = report.inputs[0]?.time ?? report.samples[0].time
    const last =
      report.inputs.at(-1)?.time ?? report.samples.at(-1)?.time ?? first
    const active = report.samples.filter(
      (sample) => sample.time >= first && sample.time <= last
    )
    const intervals = active
      .slice(1)
      .map((sample, index) => sample.time - active[index].time)
      .sort((a, b) => a - b)
    const submitted = active.filter(
      (sample, index) => index > 0 && sample.draws > active[index - 1].draws
    )
    const cameraChanges = active.filter(
      (sample, index) =>
        index > 0 &&
        (sample.x !== active[index - 1].x ||
          sample.y !== active[index - 1].y ||
          sample.scale !== active[index - 1].scale)
    )
    if (active.length < 2) throw new Error('Insufficient active frame samples')
    const duration = active[active.length - 1].time - active[0].time
    const summary = {
      phase,
      inputHz,
      profiled: withProfiler,
      offeredEvents: offered.length,
      deliveredEvents: report.inputs.length,
      durationMs: duration,
      callbackHz: ((active.length - 1) * 1000) / duration,
      submittedFramesPerSecond: (submitted.length * 1000) / duration,
      cameraUpdatesPerSecond: (cameraChanges.length * 1000) / duration,
      frameIntervalP50Ms: intervals[Math.floor(intervals.length * 0.5)],
      frameIntervalP95Ms: intervals[Math.floor(intervals.length * 0.95)],
      frameIntervalMaxMs: intervals.at(-1),
      intervalsOver25Ms: intervals.filter((interval) => interval > 25).length,
      longTasks: report.longTasks.length,
      gpuWork: report.gpuWork
    }
    results.push({ summary, offered, ...report })
    await writeFile(
      testInfo.outputPath('continuous-navigation.json'),
      JSON.stringify(results, null, 2)
    )
    // eslint-disable-next-line no-console -- concise local measurement artifact
    console.log(JSON.stringify(summary))
    expect(report.publications).toBe(0)
    if (phase !== 'idle') {
      expect(report.inputs.length).toBeGreaterThan(1)
      expect(cameraChanges.length).toBeGreaterThan(1)
      if (phase === 'pan')
        expect(
          Math.max(
            ...active.map((sample) =>
              Math.abs(sample.x - report.before.position.x)
            )
          )
        ).toBeGreaterThan(100)
      else
        expect(
          Math.max(...active.map((sample) => sample.scale))
        ).toBeGreaterThan(report.before.scale * 2)
    }
  }
  expect(errors).toEqual([])
})
