import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { installNavigationWorkProbe } from './navigation-work-probe'
import { waitForAppReady } from './test-utils'
import { prepareLargeNavigationDocument } from './large-navigation-document'

test('preserves the full document while profiling navigation work', async ({
  page,
  baseURL
}, testInfo) => {
  test.skip(
    process.env.E2E_LARGE_DOCUMENT !== 'true',
    'Explicit large-document milestone'
  )
  test.setTimeout(240_000)
  const { identity, manifest } = await prepareLargeNavigationDocument(baseURL)

  await page.setViewportSize({ width: 1440, height: 1000 })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Profiler.enable')
  await installNavigationWorkProbe(page)
  await page.goto(identity.url)
  await waitForAppReady(page)
  await page.evaluate(async () => {
    const { viewportApis } = await import('../src/common-apis/viewport')
    viewportApis.zoomFit()
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
  })
  await page.screenshot({ path: testInfo.outputPath('full-fit-before.png') })
  await cdp.send('Profiler.start')
  const report = await page.evaluate(async () => {
    const { core, subscribeToDiagnosticCounters } =
      await import('../src/testing/runtime-access')
    const { viewportApis } = await import('../src/common-apis/viewport')
    const snapshot = await core.save()
    const before = JSON.stringify(snapshot)
    const counters: Record<string, number> = {}
    const unsubscribe = subscribeToDiagnosticCounters((name, value) => {
      counters[name] = (counters[name] ?? 0) + value
    })
    let publications = 0
    const unsubscribePublication = core.subscribeToSharedPublication(() => {
      publications += 1
    })
    const settle = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    const origin = viewportApis.getPosition()
    const scale = viewportApis.getScale()
    window.navigationGpuWork = {
      draws: 0,
      vertexUploadBytes: 0,
      uniformMatrices: 0
    }
    const samples: { phase: string; durationMs: number }[] = []
    try {
      for (const phase of ['pan', 'zoom'] as const) {
        for (let index = 0; index < 12; index++) {
          const start = performance.now()
          if (phase === 'pan')
            viewportApis.panTo(origin.x + index * 8, origin.y + index * 3)
          else viewportApis.zoomToCenter(scale * (1 + index * 0.025), 800, 500)
          await settle()
          samples.push({ phase, durationMs: performance.now() - start })
        }
      }
      viewportApis.zoomFit()
      await settle()
      const after = JSON.stringify(await core.save())
      return {
        samples,
        gpuWork: { ...window.navigationGpuWork },
        counters,
        publications,
        unchanged: before === after,
        elements: Object.keys(snapshot.sceneTree.elements).length - 1,
        userAgent: navigator.userAgent,
        dpr: devicePixelRatio
      }
    } finally {
      unsubscribe()
      unsubscribePublication()
    }
  })
  const profile = await cdp.send('Profiler.stop')
  await writeFile(
    testInfo.outputPath('navigation.cpuprofile'),
    JSON.stringify(profile.profile)
  )
  await writeFile(
    testInfo.outputPath('navigation.json'),
    JSON.stringify(report, null, 2)
  )
  await page.screenshot({ path: testInfo.outputPath('full-fit-after.png') })
  expect(report.elements).toBe(manifest.elements)
  expect(report.unchanged).toBe(true)
  expect(report.publications).toBe(0)
  expect(report.counters['computed-mirror-seed'] ?? 0).toBe(0)
  // Inspect the same persisted drawing through the real App at native scale.
  const bounds = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const result = core.getAllElementsBounds()
    if (!result) throw new Error('Loaded fixture has no bounds')
    return result
  })
  for (const fraction of [0.15, 0.5, 0.85]) {
    await page.evaluate(
      async ({ bounds, fraction }) => {
        const { viewportApis } = await import('../src/common-apis/viewport')
        viewportApis.zoomToCenter(1, 800, 500)
        viewportApis.panTo(
          800 - (bounds.minX + bounds.maxX) / 2,
          500 - (bounds.minY + (bounds.maxY - bounds.minY) * fraction)
        )
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
      },
      { bounds, fraction }
    )
    await page.screenshot({
      path: testInfo.outputPath(`native-detail-${fraction}.png`)
    })
  }
  const zoomBefore = await page.evaluate(async () =>
    (await import('../src/common-apis/viewport')).viewportApis.getScale()
  )
  await page.mouse.move(800, 500)
  await page.keyboard.down('Meta')
  await page.mouse.wheel(0, -100)
  await page.keyboard.up('Meta')
  await expect
    .poll(async () =>
      page.evaluate(async () =>
        (await import('../src/common-apis/viewport')).viewportApis.getScale()
      )
    )
    .toBeGreaterThan(zoomBefore)
  await page.evaluate(async () =>
    (await import('../src/common-apis/viewport')).viewportApis.zoomFit()
  )
  expect(errors).toEqual([])
})
