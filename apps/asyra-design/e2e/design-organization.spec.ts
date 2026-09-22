import { expect, test } from '@playwright/test'
import { prepareDesign } from '../server/design-preparation'
import type { AiActionBatch } from '../src/ai/action-batch-protocol'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  getUndoHistoryDepth,
  getCoreDocumentDigest,
  getPersistedDocumentDigest,
  undo,
  redo
} from './test-utils'

test('Agent organization preserves artwork and each request is one durable Undo', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  const identity = createTestDocumentIdentity()
  const design = prepareDesign({
    name: 'Organization fixture',
    x: 60,
    y: 60,
    width: 600,
    height: 400,
    fill: '#f4f0e8',
    children: [
      {
        key: 'a',
        name: 'Card',
        type: 'rect',
        x: 30,
        y: 40,
        width: 120,
        height: 80,
        fill: '#285c4a'
      },
      {
        key: 'b',
        name: 'Badge',
        type: 'oval',
        x: 200,
        y: 60,
        width: 90,
        height: 90,
        fill: '#d29b53'
      },
      {
        key: 'c',
        name: 'Other card',
        type: 'rect',
        x: 380,
        y: 40,
        width: 140,
        height: 180,
        fill: '#789c8b'
      }
    ]
  })
  let actions: AiActionBatch['actions'] = [
    {
      id: 'create',
      name: 'apply_prepared_design',
      arguments: { design },
      summary: 'Create three shapes'
    }
  ]
  let requests = 0
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({ json: { batchId: `organization-${requests}`, actions } })
  )
  await page.goto(identity.url)
  await waitForAppReady(page)
  const send = async (text: string) => {
    const open = page.getByRole('button', { name: 'Open Agent' })
    if (await open.isVisible()) await open.click()
    await page.getByLabel('Message Agent').fill(text)
    requests++
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message')).toHaveCount(requests)
    await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
      'data-outcome',
      'success'
    )
  }
  await send('Create three editable shapes.')
  const readArtwork = () =>
    page.evaluate(
      async (ids) => {
        const { core } = await import('../src/testing/runtime-access')
        return ids.map((id) => {
          const raw = core.getElementData(id)
          const properties =
            core.getElementComputedData(id, [
              'x',
              'y',
              'width',
              'height',
              'fills'
            ]) ?? {}
          let x = Number(properties.x),
            y = Number(properties.y),
            parentId = raw?.parentId
          while (
            parentId &&
            core.getElementData(parentId)?.type !== 'workspace'
          ) {
            const parent =
              core.getElementComputedData(parentId, ['x', 'y']) ?? {}
            x += Number(parent.x)
            y += Number(parent.y)
            parentId = core.getElementData(parentId)?.parentId
          }
          return {
            id,
            type: raw?.type,
            x,
            y,
            width: properties.width,
            height: properties.height,
            fills: properties.fills
          }
        })
      },
      [design.keyToId.a, design.keyToId.b, design.keyToId.c]
    )
  const artwork = await readArtwork()
  const before = await getCoreDocumentDigest(page)
  const groupDepth = await getUndoHistoryDepth(page)
  actions = [
    {
      id: 'group',
      summary: 'Group the card and badge',
      name: 'organize_design',
      arguments: {
        operation: 'group',
        elementIds: [design.keyToId.b, design.keyToId.a],
        name: 'Primary artwork'
      }
    }
  ]
  await send('Group the card and badge as Primary artwork.')
  expect(await readArtwork()).toEqual(artwork)
  expect(await getUndoHistoryDepth(page)).toBe(groupDepth + 1)
  const group = await page.evaluate(async (id) => {
    const { core } = await import('../src/testing/runtime-access')
    const groupId = core.getElementData(id)?.parentId
    return groupId ? { id: groupId, ...core.getElementData(groupId) } : null
  }, design.keyToId.a)
  expect(group).toMatchObject({
    type: 'group',
    name: 'Primary artwork',
    children: [design.keyToId.a, design.keyToId.b]
  })
  if (!group) throw new Error('Missing group')
  const grouped = await getCoreDocumentDigest(page)
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(grouped)
  actions = [
    {
      id: 'ungroup',
      summary: 'Ungroup the artwork',
      name: 'organize_design',
      arguments: { operation: 'ungroup', elementIds: [group.id] }
    }
  ]
  const ungroupDepth = await getUndoHistoryDepth(page)
  await send('Ungroup Primary artwork, keeping all shapes.')
  expect(await readArtwork()).toEqual(artwork)
  expect(await getUndoHistoryDepth(page)).toBe(ungroupDepth + 1)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  actions = [
    {
      id: 'reorder',
      summary: 'Reorder the layers',
      name: 'organize_design',
      arguments: {
        operation: 'reorder',
        elementIds: [design.keyToId.c],
        index: 0
      }
    }
  ]
  const reorderDepth = await getUndoHistoryDepth(page)
  await send('Move Other card to the first layer position.')
  expect(await readArtwork()).toEqual(artwork)
  expect(await getUndoHistoryDepth(page)).toBe(reorderDepth + 1)
  const children = await page.evaluate(
    async (id) =>
      (await import('../src/testing/runtime-access')).core.getElementData(id)
        ?.children,
    design.rootId
  )
  expect(children).toEqual([
    design.keyToId.c,
    design.keyToId.a,
    design.keyToId.b
  ])
  actions = [
    {
      id: 'align',
      name: 'arrange_design',
      summary: 'Align the top edges',
      arguments: {
        operation: 'align',
        axis: 'vertical',
        alignment: 'start',
        elementIds: [design.keyToId.a, design.keyToId.b, design.keyToId.c]
      }
    }
  ]
  const beforeAlign = await getCoreDocumentDigest(page)
  const alignDepth = await getUndoHistoryDepth(page)
  await send('Align the top edges of all three shapes.')
  expect((await readArtwork()).map((item) => item.y)).toEqual([100, 100, 100])
  expect(await getUndoHistoryDepth(page)).toBe(alignDepth + 1)
  const aligned = await getCoreDocumentDigest(page)
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(beforeAlign)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(aligned)
  actions = [
    {
      id: 'space',
      name: 'arrange_design',
      summary: 'Space the shapes evenly',
      arguments: {
        operation: 'distribute',
        axis: 'horizontal',
        gap: 24,
        elementIds: [design.keyToId.c, design.keyToId.a, design.keyToId.b]
      }
    }
  ]
  const spaceDepth = await getUndoHistoryDepth(page)
  await send('Set the horizontal gaps between the shapes to 24 pixels.')
  const arrangedArtwork = await readArtwork()
  expect(arrangedArtwork.map((item) => item.x)).toEqual([90, 234, 348])
  expect(arrangedArtwork.map(({ x, y, ...item }) => item)).toEqual(
    artwork.map(({ x, y, ...item }) => item)
  )
  expect(await getUndoHistoryDepth(page)).toBe(spaceDepth + 1)
  const after = await getCoreDocumentDigest(page)
  await expect
    .poll(() => getPersistedDocumentDigest(identity.fileId), { timeout: 15000 })
    .toEqual(after)
  await page.reload()
  await waitForAppReady(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
  expect(await readArtwork()).toEqual(arrangedArtwork)
  await page.evaluate(async () =>
    (await import('../src/common-apis/viewport')).viewportApis.zoomFit()
  )
  await page.screenshot({
    path: testInfo.outputPath('organized-design.png'),
    fullPage: true
  })
})
