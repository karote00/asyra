import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  getUndoHistoryDepth,
  undo,
  redo
} from './test-utils'

for (const scenario of [
  'AI workspace',
  'AI translated container',
  'common API translated container'
] as const) {
  test(`reflects vector anchors and handles - ${scenario} - with Undo and Redo`, async ({
    page
  }, testInfo) => {
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    const fixture = await page.evaluate(async (scenario) => {
      const { elementApis, transactionApis } =
        await import('../src/common-apis')
      const elementId = transactionApis.runTransaction(() =>
        elementApis.createVectorElementFromSinglePoint('a', { x: 10, y: 20 })
      )
      if (!elementId) throw new Error('Vector creation failed')
      transactionApis.runTransaction(() => {
        elementApis.appendVectorAnchorPoint(elementId, {
          id: 'b',
          x: 60,
          y: 50,
          type: 'sharp',
          inHandle: null,
          outHandle: null
        })
        elementApis.updateVectorAnchorPointHandles(elementId, [
          { pointId: 'a', target: 'outHandle', position: { x: 20, y: 0 } },
          { pointId: 'b', target: 'inHandle', position: { x: 45, y: 70 } }
        ])
      })
      if (scenario !== 'AI workspace') {
        const { core } = await import('../src/testing/runtime-access')
        transactionApis.runTransaction(() => {
          const parentId = core.createElementInParent(
            { type: 'frame', x: 0, y: 0, width: 160, height: 100 },
            core.getCurrentWorkspaceId()
          )
          core.moveElements({
            elementIds: [elementId],
            targetParentId: parentId,
            targetIndex: 0
          })
          core.updateElementProperties([
            { elementId: parentId, values: { x: 200, y: 100 } }
          ])
        })
      }
      return { elementId, before: elementApis.getVectorAnchorPoints(elementId) }
    }, scenario)
    expect(fixture.before).toHaveLength(2)
    const mirror = (p: { x: number; y: number }) => ({ x: 100 - p.x, y: p.y })
    const actions = fixture.before.map((point, i) => ({
      id: `point-${i}`,
      name: 'api_element_updateVectorAnchorPointPosition',
      arguments: {
        elementId: fixture.elementId,
        pointId: point.id,
        position: mirror(point)
      },
      summary: 'Reflect vector anchors'
    }))
    const updates = fixture.before.flatMap((point) =>
      (['inHandle', 'outHandle'] as const).flatMap((target) =>
        point[target]
          ? [{ pointId: point.id, target, position: mirror(point[target]) }]
          : []
      )
    )
    await page.route('**/api/ai/action-batch', (route) =>
      route.fulfill({
        json: {
          batchId: 'reflect',
          actions: [
            ...actions,
            {
              id: 'handles',
              name: 'api_element_updateVectorAnchorPointHandles',
              arguments: { elementId: fixture.elementId, updates },
              summary: 'Reflect vector handles'
            }
          ]
        }
      })
    )
    const depth = await getUndoHistoryDepth(page)
    if (scenario.startsWith('AI')) {
      await page.getByRole('button', { name: 'Open Agent' }).click()
      await page
        .getByLabel('Message Agent')
        .fill('Reflect this vector horizontally')
      await page.getByRole('button', { name: 'Send', exact: true }).click()
      await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
        'data-outcome',
        'success'
      )
    } else {
      await page.evaluate(
        async ({ elementId, targets, updates }) => {
          const { elementApis, transactionApis } =
            await import('../src/common-apis')
          transactionApis.runTransaction(() => {
            targets.forEach(({ pointId, position }) =>
              elementApis.updateVectorAnchorPointPosition(
                elementId,
                pointId,
                position
              )
            )
            elementApis.updateVectorAnchorPointHandles(elementId, updates)
          })
        },
        {
          elementId: fixture.elementId,
          targets: actions.map(({ arguments: args }) => args),
          updates
        }
      )
    }
    const read = () =>
      page.evaluate(async (id) => {
        const { elementApis } = await import('../src/common-apis')
        return elementApis.getVectorAnchorPoints(id)
      }, fixture.elementId)
    const after = await read()
    const statePath = testInfo.outputPath('vector-reflection-state.json')
    await writeFile(
      statePath,
      JSON.stringify(
        {
          before: fixture.before,
          after,
          computed: await page.evaluate(async (id) => {
            const { core } = await import('../src/testing/runtime-access')
            return core.getElementComputedData(id)
          }, fixture.elementId)
        },
        null,
        2
      )
    )
    await testInfo.attach('vector-reflection-state', {
      contentType: 'application/json',
      path: statePath
    })
    const closePoints = (points: typeof fixture.before) =>
      points.map((point) => ({
        ...point,
        x: expect.closeTo(point.x, 10),
        y: expect.closeTo(point.y, 10),
        inHandle: point.inHandle
          ? {
              x: expect.closeTo(point.inHandle.x, 10),
              y: expect.closeTo(point.inHandle.y, 10)
            }
          : null,
        outHandle: point.outHandle
          ? {
              x: expect.closeTo(point.outHandle.x, 10),
              y: expect.closeTo(point.outHandle.y, 10)
            }
          : null
      }))
    expect(after).toEqual(
      closePoints(
        fixture.before.map((p) => ({
          ...p,
          ...mirror(p),
          inHandle: p.inHandle ? mirror(p.inHandle) : null,
          outHandle: p.outHandle ? mirror(p.outHandle) : null
        }))
      )
    )
    expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
    if (scenario.startsWith('AI'))
      await page.getByRole('button', { name: 'Close Agent panel' }).click()
    await undo(page)
    expect(await read()).toEqual(closePoints(fixture.before))
    await redo(page)
    expect(await read()).toEqual(closePoints(after))
    if (scenario === 'common API translated container') {
      const rollback = await page.evaluate(
        async ({ id, point }) => {
          const { elementApis, transactionApis } =
            await import('../src/common-apis')
          try {
            transactionApis.runTransaction(() => {
              elementApis.updateVectorAnchorPointPosition(id, point.id, {
                x: point.x + 25,
                y: point.y + 10
              })
              throw new Error('Intentional rollback')
            })
          } catch (error) {
            return error instanceof Error ? error.message : String(error)
          }
          return null
        },
        { id: fixture.elementId, point: after[0] }
      )
      expect(rollback).toBe('Intentional rollback')
      expect(await read()).toEqual(closePoints(after))
      expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
    }
    await expect(page.getByText('Vector 1', { exact: true })).toBeVisible()
    expect(
      await page.evaluate(
        async (id) =>
          (
            await import('../src/testing/runtime-access')
          ).core.hasProjectedElement(id),
        fixture.elementId
      )
    ).toBe(true)
    await page.keyboard.press('Meta+1')
    await page.screenshot({
      path: testInfo.outputPath('vector-reflection.png')
    })
  })
}
