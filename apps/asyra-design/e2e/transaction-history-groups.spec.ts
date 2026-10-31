import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  createTestDocumentIdentity,
  getPersistedDocumentCheckpoint,
  createRectangle,
  waitForAppReady,
  undo,
  redo,
  getCoreDocumentDigest
} from './test-utils'

test('finite history members project nested hierarchy before the history group closes', async ({
  page,
  browser
}, testInfo) => {
  test.setTimeout(90000)
  const identity = createTestDocumentIdentity()
  await page.goto(identity.url)
  await waitForAppReady(page)
  await createRectangle(page, 0.25, 0.25)
  await createRectangle(page, 0.45, 0.45)
  const initial = await getCoreDocumentDigest(page)
  const peerContext = await browser.newContext()
  const peer = await peerContext.newPage()
  try {
    await peer.goto(identity.url)
    await waitForAppReady(peer)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(initial)
    const verifyDurableState = async (stage: string) => {
      const receipt = await page.evaluate(async () => {
        const { getActiveCollaborationHandle } =
          await import('../src/testing/runtime-access')
        const session = getActiveCollaborationHandle()
        if (!session) {
          throw new Error('Missing document session')
        }
        return session.confirmPersistence(AbortSignal.timeout(10000))
      })
      expect(receipt.durableSequence).toBeGreaterThanOrEqual(receipt.sequence)
      const expected = await page.evaluate(async () =>
        (await import('../src/testing/runtime-access')).core.save()
      )
      const actual = await getPersistedDocumentCheckpoint(identity.fileId)
      await testInfo.attach(`durable-${stage}`, {
        body: JSON.stringify({ receipt, expected, actual }),
        contentType: 'application/json'
      })
      expect(actual.checkpoint).toEqual(expected)
      await expect
        .poll(() => getCoreDocumentDigest(peer))
        .toEqual(await getCoreDocumentDigest(page))
    }

    await page.evaluate(async () => {
      const runtime = await import('../src/testing/runtime-access')
      runtime.startSharedPublicationCapture('history-source')
      runtime.startDocumentPublicationCapture('history-document')
    })
    const live = await page.evaluateHandle(async () => {
      const { core } = await import('../src/testing/runtime-access')
      const { hierarchyApis } = await import('../src/common-apis/hierarchy')
      const workspace = hierarchyApis.getWorkspaceId()
      if (!workspace) {
        throw new Error('Missing workspace')
      }
      const ids = [...(core.getElementData(workspace)?.children ?? [])]
      if (ids.length !== 2) {
        throw new Error('Expected two rectangles')
      }
      const immediate = { undoable: true, sharedDelivery: 'immediate' } as const
      const history = core.startHistoryGroup()
      const historyBefore = core.getUndoHistoryDepth()
      const drawing = core.updateHistoryGroup(history, () => {
        const body = hierarchyApis.groupElements([ids[0]], immediate)
        const detail = hierarchyApis.groupElements([ids[1]], immediate)
        hierarchyApis.moveElements({
          elementIds: [detail.groupId],
          targetParentId: body.groupId,
          targetIndex: 1
        })
        const members = hierarchyApis.ungroupElement(body.groupId, immediate)
        return hierarchyApis.groupElements(members.elementIds, immediate)
      })
      const bounds = core.getElementComputedData(drawing.groupId, [
        'x',
        'y',
        'width',
        'height'
      ])
      const image = core.captureElementSnapshot(drawing.groupId, 1024)
      const pendingDepth = core.getUndoHistoryDepth()
      const status = core.getHistoryGroupStatus(history)
      return {
        history,
        drawingId: drawing.groupId,
        leafIds: ids,
        bounds,
        image: {
          width: image.width,
          height: image.height,
          dataUrl: image.dataUrl
        },
        status,
        historyBefore,
        pendingDepth
      }
    })
    const result = await live.evaluate(({ history, ...result }) => result)
    expect(result.bounds?.width).toBeGreaterThan(0)
    expect(result.bounds?.height).toBeGreaterThan(0)
    expect(result.image.width).toBeGreaterThan(0)
    expect(result.image.height).toBeGreaterThan(0)
    expect(result.pendingDepth).toBe(result.historyBefore)
    expect(result.status).toMatchObject({ state: 'open', memberCount: 1 })
    await testInfo.attach('runtime-state', {
      body: JSON.stringify({
        url: page.url(),
        viewport: page.viewportSize(),
        ...result
      }),
      contentType: 'application/json'
    })
    await expect(
      page.getByTestId(`element-item-${result.leafIds[0]}`)
    ).toHaveAttribute('data-layer-depth', '1')
    await expect(
      page.getByTestId(`element-item-${result.leafIds[1]}`)
    ).toHaveAttribute('data-layer-depth', '2')
    await page.screenshot({ path: testInfo.outputPath('pending-group.png') })
    const grouped = await getCoreDocumentDigest(page)
    const finalDepth = await live.evaluate(async ({ history }) => {
      const { core } = await import('../src/testing/runtime-access')
      core.endHistoryGroup(history)
      return core.getUndoHistoryDepth()
    })
    const publicationPath = testInfo.outputPath('history-publications.json')
    await writeFile(
      publicationPath,
      JSON.stringify(
        await page.evaluate(async () => {
          const runtime = await import('../src/testing/runtime-access')
          return {
            source: runtime.readTestCapture('history-source'),
            document: runtime.readTestCapture('history-document')
          }
        })
      )
    )
    await testInfo.attach('history-publications', {
      path: publicationPath,
      contentType: 'application/json'
    })
    expect(finalDepth).toBe(result.historyBefore + 1)
    await verifyDurableState('grouped')
    await undo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(initial)
    await verifyDurableState('undo')
    await redo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(grouped)
    const restoredImage = await page.evaluate(async (id) => {
      const { core } = await import('../src/testing/runtime-access')
      return core.captureElementSnapshot(id, 1024).dataUrl
    }, result.drawingId)
    expect(restoredImage).toBe(result.image.dataUrl)
    await page.screenshot({ path: testInfo.outputPath('restored-group.png') })
    await verifyDurableState('redo')
    await live.dispose()
    await page.reload()
    await waitForAppReady(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(grouped)
    await page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')
      const { elementApis, transactionApis } =
        await import('../src/common-apis')
      const workspace = core.getCurrentWorkspaceId()
      const id = core.getElementData(workspace)?.children?.[0]
      if (!id) {
        throw new Error('Reloaded group missing')
      }
      transactionApis.runTransaction(() =>
        elementApis.setElementsVisible([id], false)
      )
    })
    await verifyDurableState('edit-after-reload')
    const edited = await getCoreDocumentDigest(page)
    await page.reload()
    await waitForAppReady(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(edited)
  } finally {
    await peerContext.close()
  }
})
