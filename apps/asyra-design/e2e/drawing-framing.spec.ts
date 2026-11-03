import { test, expect } from '@playwright/test'
import { createTestDocumentIdentity, waitForAppReady } from './test-utils'
import type { createDrawingFraming } from '../test-data/ai-drawing/drawing-framing.mjs'

type Framing = ReturnType<typeof createDrawingFraming>

test.use({ video: 'on', viewport: { width: 1920, height: 1080 } })

test('recording frames base tower spire and same-count movement without document edits', async ({
  page
}, testInfo) => {
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.goto(createTestDocumentIdentity().url + '&aiPerformance=profile')
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.evaluate(async () => {
    const { testRuntimeState } = await import('../src/testing/runtime-access')
    const { installDrawingFraming } =
      await import('../test-data/ai-drawing/drawing-framing.mjs')

    testRuntimeState.set('recording-framing', await installDrawingFraming())
    testRuntimeState.set('recording-elements', [] as string[])
  })

  for (const stage of [
    { name: 'base', x: 0, y: 0, width: 6000, height: 7000 },
    { name: 'tower', x: 1000, y: -35000, width: 4000, height: 35000 },
    { name: 'spire', x: 2700, y: -43900, width: 600, height: 8900 },
    { name: 'movement', x: 80000, y: -43900, width: 600, height: 8900 }
  ]) {
    await page.evaluate(async (stage) => {
      const { core, testRuntimeState } =
        await import('../src/testing/runtime-access')
      const { elementApis, transactionApis } =
        await import('../src/common-apis')
      const ids = testRuntimeState.get<string[]>('recording-elements')

      if (!ids) {
        throw new Error('Missing fixture state')
      }

      transactionApis.runTransaction(() => {
        if (stage.name === 'movement') {
          core.updateElementProperties([
            { elementId: ids[2], values: { x: stage.x } }
          ])
        } else {
          const id = elementApis.createElement({
            type: 'rect',
            workspacePosition: { x: stage.x, y: stage.y },
            width: stage.width,
            height: stage.height
          })

          if (!id) {
            throw new Error('Fixture creation failed')
          }

          ids.push(id)
        }
      })
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    }, stage)
    const before = await page.evaluate(async () => {
      const { core, getActiveAiDrawingPerformanceProfile } =
        await import('../src/testing/runtime-access')

      return {
        canonical:
          getActiveAiDrawingPerformanceProfile()?.readCanonicalOwnerSnapshot(),
        selection: core.getSelectedElementIds(),
        history: core.getUndoHistoryDepth()
      }
    })

    await expect
      .poll(() =>
        page.evaluate(async () => {
          const { testRuntimeState } =
            await import('../src/testing/runtime-access')

          return testRuntimeState.get<Framing>('recording-framing')?.tick()
            .status
        })
      )
      .toBe('fitted')
    const after = await page.evaluate(async () => {
      const { core, getActiveAiDrawingPerformanceProfile } =
        await import('../src/testing/runtime-access')
      const { viewportApis } = await import('../src/common-apis/viewport')
      const bounds = core.getAllElementsBounds()
      const area = document
        .getElementById('viewport-anchor')
        ?.getBoundingClientRect()

      if (!bounds || !area) {
        throw new Error('Missing drawing or viewport')
      }

      const low = viewportApis.getCanvasPositionFromWorkspace({
        x: bounds.minX,
        y: bounds.minY
      })
      const high = viewportApis.getCanvasPositionFromWorkspace({
        x: bounds.maxX,
        y: bounds.maxY
      })

      return {
        canonical:
          getActiveAiDrawingPerformanceProfile()?.readCanonicalOwnerSnapshot(),
        selection: core.getSelectedElementIds(),
        history: core.getUndoHistoryDepth(),
        visible:
          low.x >= area.x &&
          low.y >= area.y &&
          high.x <= area.right &&
          high.y <= area.bottom,
        count: core.getCanonicalElementCount()
      }
    })

    expect(before.canonical).toBeDefined()
    expect({
      canonical: after.canonical,
      selection: after.selection,
      history: after.history
    }).toEqual(before)
    expect(after.visible).toBe(true)
    if (stage.name === 'movement') {
      expect(after.count).toBe(3)
    }

    await page.screenshot({ path: testInfo.outputPath(stage.name + '.png') })
    await page.waitForTimeout(300) // Retain each settled composition in the process video.
  }

  await page.evaluate(async () => {
    const { testRuntimeState } = await import('../src/testing/runtime-access')

    testRuntimeState.get<Framing>('recording-framing')?.dispose()
  })
})
