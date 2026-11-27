import { expect, type Page } from '@playwright/test'
import {
  clickCanvas,
  createTestDocumentURL,
  getActiveTool,
  resetCanvas,
  waitForAppReady
} from './test-utils'

export async function verifyPenBeforeDisplayRefresh({ page }: { page: Page }) {
  await page.clock.install()
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  await resetCanvas(page)
  await page.keyboard.press('p')
  await expect.poll(() => getActiveTool(page)).toBe('pen')
  await clickCanvas(page, 0.3, 0.3)
  const initial = await page.evaluate(async () => {
    const { selectionApis } = await import('../src/common-apis/selection')

    return selectionApis.getSelectedVectorPoints()[0]
  })

  expect(initial?.target).toBe('anchor')
  // Let the initial selection paint with timers running, but keep the wall
  // time fixed so pauseAt remains valid across browser protocol round trips.
  const pauseTime = new Date()

  await page.clock.setFixedTime(pauseTime)
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { systemContextApis } =
          await import('../src/common-apis/system-context')

        return systemContextApis.getSelectedVectorPoint()?.pointId
      })
    )
    .toBe(initial.pointId)
  const pointIds = [initial.pointId]

  await page.clock.pauseAt(pauseTime)

  await page.evaluate(async () => {
    const { core, testRuntimeState } =
      await import('../src/testing/runtime-access')

    testRuntimeState.set('pen-frame-count', 0)
    testRuntimeState.set(
      'pen-frame-dispose',
      core.getPresetDependencies().render.subscribeToFrameComplete(() => {
        testRuntimeState.set(
          'pen-frame-count',
          (testRuntimeState.get<number>('pen-frame-count') ?? 0) + 1
        )
      })
    )
  })
  try {
    for (const [x, y] of [
      [0.45, 0.4],
      [0.58, 0.48]
    ]) {
      await clickCanvas(page, x, y)
      const observation = await page.evaluate(async () => {
        const { core, testRuntimeState } =
          await import('../src/testing/runtime-access')
        const { selectionApis, systemContextApis, elementApis } =
          await import('../src/common-apis')
        const vectorId = core.getSystemProperty<string>('pathEditingVectorId')

        if (!vectorId) {
          throw new Error('Pen must retain its canonical vector')
        }

        return {
          selected: selectionApis.getSelectedVectorPoints()[0],
          displayed: systemContextApis.getSelectedVectorPoint(),
          frames: testRuntimeState.get<number>('pen-frame-count'),
          continuation: core.getSystemProperty('pathEditingContinuation'),
          pointIds: elementApis
            .getVectorAnchorSubpaths(vectorId)
            .flat()
            .map((point) => point.id)
        }
      })

      expect(observation.selected?.target).toBe('anchor')
      expect(observation.selected.pointId).not.toBe(initial.pointId)
      pointIds.push(observation.selected.pointId)
      expect(observation.frames).toBe(0)
      expect(observation.displayed?.pointId).toBe(initial.pointId)
      expect(observation.continuation).toMatchObject({
        pointId: observation.selected.pointId,
        side: 'end'
      })
      expect(observation.pointIds).toEqual(pointIds)
    }
  } finally {
    await page.clock.setSystemTime(new Date())
    await page.clock.resume()
    await page.evaluate(async () => {
      const { testRuntimeState } = await import('../src/testing/runtime-access')

      testRuntimeState.get<() => void>('pen-frame-dispose')?.()
      testRuntimeState.delete('pen-frame-dispose')
      testRuntimeState.delete('pen-frame-count')
    })
  }

  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { systemContextApis } =
          await import('../src/common-apis/system-context')

        return systemContextApis.getSelectedVectorPoint()?.pointId
      })
    )
    .toBe(pointIds.at(-1))
}
