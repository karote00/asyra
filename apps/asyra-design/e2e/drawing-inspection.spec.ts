import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { expect, test } from '@playwright/test'
import { prepareDesign } from '../server/design-preparation'
import { deliverPreparedDesign } from '../src/ai/prepared-design'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  getCoreDocumentDigest,
  getUndoHistoryDepth,
  getPersistedDocumentDigest,
  getPersistedDocumentCheckpoint
} from './test-utils'

test('large composition overview covers every corner while native regions preserve detail', async ({
  page
}, testInfo) => {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff']
  const design = prepareDesign({
    type: 'frame',
    name: 'Large inspection composition',
    width: 20000,
    height: 10000,
    fill: '#ffffff',
    children: colors.map((fill, index) => ({
      key: 'corner-' + index,
      type: 'rect',
      name: 'Corner ' + index,
      x: index % 2 ? 19000 : 0,
      y: index >= 2 ? 9000 : 0,
      width: 1000,
      height: 1000,
      fill
    }))
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({
      json: {
        batchId: 'large-inspection',
        actions: [
          {
            id: 'apply',
            name: 'apply_prepared_design',
            arguments: { design: deliverPreparedDesign(design) },
            summary: 'Create inspection drawing'
          }
        ]
      }
    })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.getByLabel('Message Agent').fill('Create the inspection drawing.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  const captures = await page.evaluate(async (id) => {
    const { inspectionApis } = await import('../src/common-apis/inspection')
    return {
      overview: inspectionApis.inspect(id),
      detail: inspectionApis.inspect(id, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000
      }),
      oversized: inspectionApis.inspect(id, undefined, 'detail')
    }
  }, design.entries[0].descriptor.id)
  expect(captures.overview).toMatchObject({
    available: true,
    partial: false,
    imageScope: 'overview'
  })
  expect(captures.detail).toMatchObject({
    available: true,
    partial: true,
    imageScope: 'region'
  })
  expect(captures.oversized.available).toBe(false)
  if (!captures.overview.image || !captures.detail.image)
    throw new Error('Missing capture')
  expect(captures.overview.image.width).toBe(1024)
  expect(captures.overview.image.height).toBe(512)
  expect(captures.detail.image.width).toBe(1000)
  expect(captures.detail.image.height).toBe(1000)
  const png = Buffer.from(
    captures.overview.image.dataUrl.split(',')[1],
    'base64'
  )
  const { data, info } = await sharp(png)
    .raw()
    .toBuffer({ resolveWithObject: true })
  const expected = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 0, 255]
  ]
  for (let index = 0; index < 4; index++) {
    const x = index % 2 ? 1000 : 24
    const y = index >= 2 ? 488 : 24
    const offset = (y * info.width + x) * info.channels
    expect([...data.subarray(offset, offset + 3)]).toEqual(expected[index])
  }
  await writeFile(testInfo.outputPath('large-overview.png'), png)
  await writeFile(
    testInfo.outputPath('native-region.png'),
    Buffer.from(captures.detail.image.dataUrl.split(',')[1], 'base64')
  )
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  expect(await getUndoHistoryDepth(page)).toBe(depth)
})

test('workspace overview preserves independent roots, visual order and read-only evidence through reload', async ({
  page
}, testInfo) => {
  const document = createTestDocumentIdentity()
  await page.goto(document.url)
  await waitForAppReady(page)
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { getActiveCollaborationHandle } =
          await import('../src/testing/runtime-access')
        return getActiveCollaborationHandle()?.getStatus()
      })
    )
    .toBe('connected')
  const ids = await page.evaluate(async () => {
    const { core, startDocumentPublicationCapture } =
      await import('../src/testing/runtime-access')
    startDocumentPublicationCapture('workspace-overview-publications')
    const { transactionApis, fillApis } = await import('../src/common-apis')
    return transactionApis.runTransaction(() => {
      const roots = core.createElementsInParent(
        [
          { type: 'rect', x: 0, y: 0, width: 400, height: 200 },
          { type: 'rect', x: 0, y: 0, width: 200, height: 200 },
          { type: 'rect', x: 100, y: 0, width: 200, height: 200 },
          {
            type: 'oval',
            x: 380,
            y: 60,
            width: 80,
            height: 40,
            rotation: Math.PI / 2
          },
          { type: 'rect', x: 0, y: 0, width: 200, height: 200, visible: false }
        ],
        core.getCurrentWorkspaceId()
      )
      const colors = ['#ffffff', '#ff0000', '#0000ff', '#00ff00', '#ffff00']
      roots.forEach((id, index) =>
        fillApis.updateFillsAtIndex([id], 0, { color: colors[index] })
      )
      return roots
    })
  })
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  try {
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(before)
  } catch (error) {
    const runtime = await page.evaluate(async () => {
      const { core, getActiveCollaborationHandle, readTestCapture } =
        await import('../src/testing/runtime-access')
      return {
        document: await core.save(),
        session: getActiveCollaborationHandle()?.getSessionState(),
        publications: readTestCapture('workspace-overview-publications')
      }
    })
    await testInfo.attach('workspace-overview-persistence', {
      body: JSON.stringify({
        runtime,
        checkpoint: await getPersistedDocumentCheckpoint(document.fileId)
      }),
      contentType: 'application/json'
    })
    throw error
  }
  const captured = await page.evaluate(async (ids) => {
    const {
      core,
      startSharedPublicationCapture,
      startDocumentPublicationCapture,
      readTestCapture,
      clearTestCapture
    } = await import('../src/testing/runtime-access')
    const { inspectionApis } = await import('../src/common-apis/inspection')
    const { createInspectionEvidence } =
      await import('../src/common-apis/inspection-evidence')
    const { selectionApis, viewportApis, transactionApis, fillApis } =
      await import('../src/common-apis')
    const workspace = core.getCurrentWorkspaceId()
    const owner = createInspectionEvidence()
    const capture = (id: string) =>
      owner.capture(() => inspectionApis.inspect(id), { elementId: id })
    startSharedPublicationCapture('workspace-inspection-shared')
    startDocumentPublicationCapture('workspace-inspection-document')
    const overview = await capture(workspace)
    const local = await capture(ids[1])
    const initialPublications = {
      shared: readTestCapture('workspace-inspection-shared').length,
      document: readTestCapture('workspace-inspection-document').length,
      undo: core.deps.factory.transact.undoStack.length
    }
    selectionApis.selectElements([ids[2]])
    viewportApis.zoomToCenter(0.75, 300, 200)
    viewportApis.panTo(-200, 80)
    clearTestCapture('workspace-inspection-shared')
    clearTestCapture('workspace-inspection-document')
    const selectedHistory = {
      undo: core.deps.factory.transact.undoStack.length,
      redo: core.deps.factory.transact.redoStack.length
    }
    const selected = inspectionApis.inspect(workspace)
    const unchanged = {
      roots: core.getElementChildren(workspace).elementIds,
      selection: core.getSelectedElementIds(),
      shared: readTestCapture('workspace-inspection-shared').length,
      document: readTestCapture('workspace-inspection-document').length,
      current: owner.isCurrent(overview.evidence),
      history: {
        undo: core.deps.factory.transact.undoStack.length,
        redo: core.deps.factory.transact.redoStack.length
      },
      coverage: owner.validate(overview.evidence, {
        requiredIds: ids.slice(0, 4),
        overviewIds: [workspace]
      })
    }
    transactionApis.runTransaction(() =>
      fillApis.updateFillsAtIndex([ids[2]], 0, { color: '#00ffff' })
    )
    const invalidation = {
      overview: owner.isCurrent(overview.evidence),
      local: owner.isCurrent(local.evidence)
    }
    // Restore the exact document through the existing history owner, not a rewrite.
    const { historyApis } = await import('../src/common-apis')
    await historyApis.undo()
    const structural = []
    for (const change of [
      () =>
        core.createElementInParent(
          { type: 'rect', x: 310, y: 10, width: 10, height: 10 },
          workspace
        ),
      () => core.removeSubtrees([ids[4]]),
      () =>
        core.moveElements({
          elementIds: [ids[2]],
          targetParentId: workspace,
          targetIndex: 1
        })
    ]) {
      const whole = await capture(workspace)
      const independent = await capture(ids[1])
      transactionApis.runTransaction(change)
      const after = {
        overview: owner.isCurrent(whole.evidence),
        local: owner.isCurrent(independent.evidence)
      }
      await historyApis.undo()
      const restored = await capture(workspace)
      await historyApis.redo()
      structural.push({
        ...after,
        afterRedo: owner.isCurrent(restored.evidence)
      })
      await historyApis.undo()
    }
    owner.dispose()
    return {
      overview,
      selected,
      unchanged,
      invalidation,
      initialPublications,
      structural,
      selectedHistory
    }
  }, ids)
  expect(captured.overview).toMatchObject({
    available: true,
    settlement: 'completed',
    imageScope: 'overview'
  })
  expect(captured.initialPublications).toEqual({
    shared: 0,
    document: 0,
    undo: depth
  })
  expect(captured.unchanged.history).toEqual(captured.selectedHistory)
  expect(captured.unchanged).toMatchObject({
    roots: ids,
    selection: [ids[2]],
    shared: 0,
    document: 0,
    current: true
  })
  expect(captured.invalidation).toEqual({ overview: false, local: true })
  expect(captured.structural).toEqual(
    Array.from({ length: 3 }, () => ({
      overview: false,
      local: true,
      afterRedo: false
    }))
  )
  expect(captured.unchanged.coverage).toMatchObject({
    current: true,
    coverage: { complete: true }
  })
  const image = captured.overview.image as {
    dataUrl: string
    width: number
    height: number
  }
  expect(captured.selected.image?.dataUrl).toEqual(image.dataUrl)
  expect(image).toMatchObject({ width: 1024, height: 512 })
  const png = Buffer.from(image.dataUrl.split(',')[1], 'base64')
  const { data, info } = await sharp(png)
    .raw()
    .toBuffer({ resolveWithObject: true })
  for (const [x, y, color] of [
    [50, 100, [255, 0, 0]],
    [150, 100, [0, 0, 255]],
    [360, 100, [0, 255, 0]],
    [360, 65, [0, 255, 0]],
    [345, 65, [255, 255, 255]],
    [390, 190, [255, 255, 255]]
  ] as const) {
    const offset =
      (Math.floor(y * 2.56) * info.width + Math.floor(x * 2.56)) * info.channels
    expect([...data.subarray(offset, offset + 3)]).toEqual(color)
  }
  await writeFile(testInfo.outputPath('workspace-overview.png'), png)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  expect(await getUndoHistoryDepth(page)).toBe(captured.selectedHistory.undo)
  const saved = await page.evaluate(async () => {
    const { core, getActiveCollaborationHandle } =
      await import('../src/testing/runtime-access')
    const handle = getActiveCollaborationHandle()
    if (!handle) throw new Error('Missing document persistence owner')
    await handle.confirmPersistence(new AbortController().signal)
    return core.save()
  })
  await expect
    .poll(() => getPersistedDocumentDigest(document.fileId))
    .toEqual(before)
  await page.reload()
  await waitForAppReady(page)
  const loaded = await page.evaluate(async () =>
    (await import('../src/testing/runtime-access')).core.save()
  )
  await testInfo.attach('workspace-capture-reload', {
    body: JSON.stringify({ saved, loaded }),
    contentType: 'application/json'
  })
  await expect.poll(() => getCoreDocumentDigest(page)).toEqual(before)
  const reloaded = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { inspectionApis } = await import('../src/common-apis/inspection')
    return inspectionApis.inspect(core.getCurrentWorkspaceId())
  })
  expect(reloaded.image?.dataUrl).toEqual(image.dataUrl)
})
