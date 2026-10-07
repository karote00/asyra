import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { createTestDocumentURL, waitForAppReady } from './test-utils'
import { prepareLargeNavigationDocument } from './large-navigation-document'

test('queries current regions and composes relative edits with Undo', async ({
  page
}) => {
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const result = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { transactionApis, hierarchyApis, historyApis } =
      await import('../src/common-apis')
    const { readDesignContext } =
      await import('../src/common-apis/design-context')
    const workspace = core.getCurrentWorkspaceId()
    const ids = transactionApis.runTransaction(() =>
      core.createElementsInParent(
        [
          { type: 'rect', x: 10, y: 20, width: 20, height: 20 },
          { type: 'rect', x: 100, y: 20, width: 20, height: 20 },
          { type: 'rect', x: 200, y: 20, width: 20, height: 20 }
        ],
        workspace
      )
    )
    const [a, b, c] = ids
    if (!a || !b || !c) throw new Error('Query fixture creation failed')
    const bounds = { x: 11, y: 21, width: 1, height: 1 }
    const query = () =>
      readDesignContext({
        scope: 'region',
        bounds,
        filter: { type: 'rect', parentId: workspace, locked: false }
      }).elements.map((e) => e.id)
    const before = query()
    transactionApis.runTransaction(() =>
      core.updateElementProperties([{ elementId: a, values: { x: 300 } }])
    )
    const after = query()
    await historyApis.undo()
    const undone = query()
    await historyApis.redo()
    const redone = query()
    transactionApis.runTransaction(() =>
      hierarchyApis.moveElementsRelative({
        elementIds: [a],
        anchorId: b,
        placement: 'after'
      })
    )
    const order = core.getElementChildren(workspace, 0, 20).elementIds
    await historyApis.undo()
    const orderUndone = core.getElementChildren(workspace, 0, 20).elementIds
    return { a, b, c, before, after, undone, redone, order, orderUndone }
  })
  expect(result.before).toEqual([result.a])
  expect(result.after).toEqual([])
  expect(result.undone).toEqual([result.a])
  expect(result.redone).toEqual([])
  expect(result.order).toEqual([result.b, result.a, result.c])
  expect(result.orderUndone).toEqual([result.a, result.b, result.c])
})

test('indexes the preserved full Taipei 101 without repeated document scans', async ({
  page,
  baseURL
}, info) => {
  test.skip(
    process.env.E2E_LARGE_DOCUMENT !== 'true',
    'Explicit large-document milestone'
  )
  test.setTimeout(240_000)
  const { identity, manifest } = await prepareLargeNavigationDocument(baseURL)
  await page.goto(identity.url)
  await waitForAppReady(page)
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const { core } = await import('../src/testing/runtime-access')
          return {
            canonical: core.getCanonicalElementCount(),
            projected: core.getProjectedElementCount()
          }
        }),
      { timeout: 220_000, intervals: [250] }
    )
    .toEqual({ canonical: manifest.elements, projected: manifest.elements })
  const report = await page.evaluate(async () => {
    const { core, subscribeToDiagnosticCounters } =
      await import('../src/testing/runtime-access')
    const { viewportApis } = await import('../src/common-apis/viewport')
    const ids = [...core.deps.sceneTree.getAllElements().keys()].filter(
      (id) => id !== core.getCurrentWorkspaceId()
    )
    const leafId = ids.find(
      (id) => core.getElementMetadata(id)?.childCount === 0
    )
    const node = leafId ? core.deps.render.getElementById(leafId) : undefined
    if (!node) throw new Error('Missing document projection')
    let workspace = node
    while (workspace.parent && workspace.label !== core.getCurrentWorkspaceId())
      workspace = workspace.parent
    const bounds = node.getBoundsRelativeTo(workspace)
    const region = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      width: 1,
      height: 1
    }
    const counts: Record<string, number> = {}
    const unsubscribe = subscribeToDiagnosticCounters((name, value) => {
      if (name.startsWith('region-query:'))
        counts[name] = (counts[name] ?? 0) + value
    })
    try {
      const first = core.getElementIdsInBounds(region)
      const build = { ...counts }
      for (const key of Object.keys(counts)) Reflect.deleteProperty(counts, key)
      const repeats = []
      for (let i = 0; i < 10; i++)
        repeats.push(core.getElementIdsInBounds(region))
      const repeat = { ...counts }
      for (const key of Object.keys(counts)) Reflect.deleteProperty(counts, key)
      const position = viewportApis.getPosition()
      viewportApis.panTo(position.x + 40, position.y + 20)
      const afterPan = core.getElementIdsInBounds(region)
      const pan = { ...counts }
      const oracle = ids.filter((id) => {
        const element = core.deps.render.getElementById(id)
        if (!element) return false
        let current = element
        while (current !== workspace) {
          if (!current.visible || !current.renderable) return false
          if (!current.parent) return false
          current = current.parent
        }
        const b = element.getBoundsRelativeTo(workspace)
        return (
          b.x <= region.x + region.width &&
          b.x + b.width >= region.x &&
          b.y <= region.y + region.height &&
          b.y + b.height >= region.y
        )
      })
      return {
        elements: ids.length,
        first,
        repeats,
        afterPan,
        oracle,
        build,
        repeat,
        pan,
        region
      }
    } finally {
      unsubscribe()
    }
  })
  await writeFile(
    info.outputPath('indexed-query.json'),
    JSON.stringify(report, null, 2)
  )
  expect([...report.first].sort()).toEqual(report.oracle.sort())
  expect(
    report.repeats.every(
      (ids) => JSON.stringify(ids) === JSON.stringify(report.first)
    )
  ).toBe(true)
  expect(report.afterPan).toEqual(report.first)
  expect(report.repeat['region-query:bounds-read']).toBe(0)
  expect(report.repeat['region-query:order-visit'] ?? 0).toBe(0)
  expect(report.pan['region-query:bounds-read']).toBe(0)
  expect(report.repeat['region-query:candidate-check'] / 10).toBeLessThan(
    report.elements
  )
})
