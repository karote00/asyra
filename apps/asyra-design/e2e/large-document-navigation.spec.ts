import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { installNavigationWorkProbe } from './navigation-work-probe'
import { waitForAppReady } from './test-utils'
import { prepareLargeNavigationDocument } from './large-navigation-document'

test('reuses incremental membership after loading the saved large document', async ({
  page,
  baseURL
}, testInfo) => {
  test.skip(
    process.env.E2E_LARGE_DOCUMENT !== 'true',
    'Explicit large-document milestone'
  )
  test.setTimeout(240_000)
  const { identity, manifest } = await prepareLargeNavigationDocument(baseURL)
  await page.goto(identity.url)
  await waitForAppReady(page)
  const report = await page.evaluate(async () => {
    const { core, elementApis, subscribeToDiagnosticCounters } =
      await import('../src/testing/runtime-access')
    const { UI_PROPERTIES } = await import('../src/constants')
    const { historyApis } = await import('../src/common-apis/history')
    const flat = () =>
      core.getUIProperty<string[]>(UI_PROPERTIES.FLATTENED_ELEMENT_IDS) ?? []
    const initial = [...flat()]
    const before = JSON.stringify(await core.save())
    const stages: Record<string, Record<string, number>> = {}
    let stage = 'cold'
    const unsubscribe = subscribeToDiagnosticCounters((name, value) => {
      const counters = (stages[stage] ??= {})
      counters[name] = (counters[name] ?? 0) + value
    })
    try {
      const create = (x: number) =>
        elementApis.createElement(
          {
            type: 'rect',
            clientPosition: { x, y: 120 },
            width: 8,
            height: 8
          },
          { undoable: true }
        )
      const first = create(400)
      stage = 'repeat'
      const second = create(420)
      if (!first || !second) {
        throw new Error('Large-document edit did not create both elements')
      }
      const created = [...flat()]
      stage = 'undo'
      await historyApis.undo()
      const undone = [...flat()]
      stage = 'redo'
      await historyApis.redo()
      const redone = [...flat()]
      stage = 'restore'
      await historyApis.undo()
      await historyApis.undo()
      return {
        stages,
        count: initial.length,
        createdOrder:
          JSON.stringify(created) ===
          JSON.stringify([...initial, first, second]),
        undoOrder:
          JSON.stringify(undone) === JSON.stringify([...initial, first]),
        redoOrder: JSON.stringify(redone) === JSON.stringify(created),
        restoredOrder: JSON.stringify(flat()) === JSON.stringify(initial),
        restoredDocument: JSON.stringify(await core.save()) === before
      }
    } finally {
      unsubscribe()
    }
  })
  await writeFile(
    testInfo.outputPath('large-membership.json'),
    JSON.stringify(report, null, 2)
  )
  expect(report.count).toBe(manifest.elements)
  expect(report.createdOrder).toBe(true)
  expect(report.undoOrder).toBe(true)
  expect(report.redoOrder).toBe(true)
  expect(report.restoredOrder).toBe(true)
  expect(report.restoredDocument).toBe(true)
  expect(report.stages.cold['ui-context-membership-prepare']).toBe(1)
  for (const stage of ['repeat', 'undo', 'redo']) {
    expect(report.stages[stage]['ui-context-membership-prepare'] ?? 0).toBe(0)
    expect(report.stages[stage]['ui-context-membership-row-read']).toBeLessThan(
      16
    )
  }
})

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
          if (phase === 'pan') {
            viewportApis.panTo(origin.x + index * 8, origin.y + index * 3)
          } else {
            viewportApis.zoomToCenter(scale * (1 + index * 0.025), 800, 500)
          }
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
    if (!result) {
      throw new Error('Loaded fixture has no bounds')
    }
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
