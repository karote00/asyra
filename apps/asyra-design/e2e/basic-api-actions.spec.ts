import { basicApiContracts } from '../src/ai/basic-api-catalog'
import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  createTestDocumentIdentity,
  captureBrowserErrors,
  getCapturedBrowserErrors,
  waitForAppReady,
  getUndoHistoryDepth,
  getPersistedDocumentCheckpoint,
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

test.describe('real registered basic actions', () => {
  for (const contract of basicApiContracts) {
    test(contract.name, async ({ page }) => {
      await page.goto(createTestDocumentIdentity().url)
      await waitForAppReady(page)
      const error = await page.evaluate(async (name) => {
        const { createBasicApiCases } =
          await import('../e2e/fixtures/basic-api-cases')
        const cases = await createBasicApiCases()
        try {
          await cases.run(name)
          return null
        } catch (error) {
          return error instanceof Error
            ? `${error.message} ${String(error.cause ?? '')}`
            : String(error)
        }
      }, contract.name)
      expect(error).toBeNull()
    })
  }
})

test('delivers canonical mutation scope through real history-group publication', async ({
  page
}) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const result = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { fillApis, transactionApis } = await import('../src/common-apis')
    const { createBasicApiActions } =
      await import('../src/ai/basic-api-actions')
    const { createAiTransactionRunner } = await import('../src/ai/transaction')
    const actions = createBasicApiActions()
    const runner = createAiTransactionRunner()
    const invoke = (name: string, args: Record<string, unknown>) =>
      runner.run('Scope proof', async (runMutation) => {
        const action = actions.find((entry) => entry.name === name)
        if (!action) throw new Error('Missing action')
        return action.execute(args, {
          signal: new AbortController().signal,
          runMutation
        }) as Promise<{
          value: { groupId: string }
          mutationScope: {
            complete: boolean
            elementIds: string[]
            removedElementIds: string[]
          }
        }>
      })
    const ids = transactionApis.runTransaction(() =>
      core.createElementsInParent(
        [0, 60, 120].map((x) => ({
          type: 'rect',
          x,
          y: 0,
          width: 40,
          height: 30
        })),
        core.getCurrentWorkspaceId()
      )
    )
    const [a, b, unrelated] = ids
    const plural = await invoke('api_core_updateElementProperties', {
      updates: [
        { elementId: a, values: { width: 50 } },
        { elementId: b, values: { width: 70 } }
      ]
    })
    transactionApis.runTransaction(() => {
      fillApis.addFills([a, b])
      fillApis.shareFillAtIndex(a, [b], 0)
    })
    const [{ fillId }] = fillApis.getFillTargetsAtIndex([a], 0)
    const shared = await invoke('api_core_updatePropertyComponents', {
      updates: [{ propertyId: fillId, values: { color: '#abcdef' } }]
    })
    const { createRetainedDesignContext } =
      await import('../src/common-apis/retained-design-context')
    const { observeDesignChanges } =
      await import('../src/common-apis/design-review')
    const { createRetainedFillAction } =
      await import('../src/ai/retained-fill-action')
    const queries = createRetainedDesignContext(core, observeDesignChanges)
    const mapped = await runner.run('Map shared fill', async (runMutation) => {
      try {
        return await createRetainedFillAction(queries).execute(
          {
            mappings: [
              {
                query: { scope: 'ids', elementIds: [a] },
                coordinateSpace: 'parent-local',
                axis: 'x',
                domain: [0, 200],
                index: 0,
                outside: 'clamp',
                stops: [
                  { at: 0, color: '#112233' },
                  { at: 1, color: '#112233' }
                ]
              }
            ]
          },
          { signal: new AbortController().signal, runMutation }
        )
      } finally {
        queries.dispose()
      }
    })
    const group = await invoke('api_hierarchy_groupElements', {
      elementIds: [a, b]
    })
    const groupId = group.value.groupId
    const ungroup = await invoke('api_hierarchy_ungroupElement', { groupId })
    const removed = await invoke('api_element_deleteElements', {
      elementIds: [a]
    })
    const empty = await invoke('api_element_createElements', {
      createOptions: []
    })
    const read = await invoke('api_core_getElementData', { elementId: b })
    return {
      a,
      b,
      unrelated,
      groupId,
      plural,
      shared,
      mapped,
      group,
      ungroup,
      removed,
      empty,
      read
    }
  })
  for (const receipt of [result.plural, result.shared]) {
    expect(receipt.mutationScope).toEqual({
      complete: true,
      elementIds: expect.arrayContaining([result.a, result.b]),
      removedElementIds: []
    })
    expect(receipt.mutationScope.elementIds).not.toContain(result.unrelated)
  }
  expect(result.mapped).toMatchObject({
    appliedCount: 1,
    mutationScope: {
      complete: true,
      elementIds: expect.arrayContaining([result.a, result.b]),
      removedElementIds: []
    }
  })
  expect(result.group.mutationScope.elementIds).toContain(result.groupId)
  expect(result.ungroup.mutationScope).toMatchObject({
    complete: true,
    elementIds: expect.arrayContaining([result.a, result.b]),
    removedElementIds: [result.groupId]
  })
  expect(result.removed.mutationScope.removedElementIds).toContain(result.a)
  expect(result.empty.mutationScope).toEqual({
    complete: true,
    elementIds: [],
    removedElementIds: []
  })
  expect(result.read).not.toHaveProperty('mutationScope')
})

for (const path of ['registered', 'canonical'] as const) {
  test(`retains structural children across real transaction publication and invalidates them after Undo - ${path}`, async ({
    page
  }, testInfo) => {
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await page.evaluate(async () => {
      const { startDocumentPublicationCapture } =
        await import('../src/testing/runtime-access')
      startDocumentPublicationCapture('structural-persistence')
    })
    const result = await page.evaluate(async (path) => {
      const { core } = await import('../src/testing/runtime-access')
      const { transactionApis, historyApis, hierarchyApis, elementApis } =
        await import('../src/common-apis')
      const { observeDesignChanges } =
        await import('../src/common-apis/design-review')
      const { createRetainedDesignContext } =
        await import('../src/common-apis/retained-design-context')
      const { createBasicApiActions } =
        await import('../src/ai/basic-api-actions')
      const { createAiTransactionRunner } =
        await import('../src/ai/transaction')
      const ids = transactionApis.runTransaction(() =>
        core.createElementsInParent(
          [
            { type: 'rect', x: 10, y: 10, width: 20, height: 20 },
            { type: 'rect', x: 50, y: 10, width: 20, height: 20 }
          ],
          core.getCurrentWorkspaceId()
        )
      )
      if (ids.some((id) => !id)) throw new Error('Fixture creation failed')
      const queries = createRetainedDesignContext(core, observeDesignChanges)
      const actions = createBasicApiActions(undefined, undefined, queries)
      const signal = new AbortController().signal
      const runner = createAiTransactionRunner()
      const group = actions.find(
        (action) => action.name === 'api_hierarchy_groupElements'
      )
      const edit = actions.find(
        (action) => action.name === 'api_element_setElementsVisible'
      )
      if (!group || !edit) throw new Error('Missing registered operations')
      try {
        const receipt = await runner.run(
          'Retained structural edit',
          async (runMutation) => {
            const context = { signal, runMutation }
            if (path === 'canonical') {
              if (!runMutation) throw new Error('Missing transaction owner')
              const value = await runMutation(() =>
                hierarchyApis.groupElements(ids)
              )
              if (!value) throw new Error('Grouping failed')
              const grouped = {
                value,
                retained: queries.retainReceipt(ids, { value }, signal)
              }
              await runMutation(() =>
                elementApis.setElementsVisible(ids, false)
              )
              return { grouped, edited: { status: 'complete' } }
            }
            const grouped = (await group.execute(
              { elementIds: ids },
              context
            )) as {
              retained: { snapshotId: string; leaseId: string; total: number }
              value: { groupId: string }
            }
            const edited = await edit.execute(
              { elementIds: grouped.retained, visible: false },
              context
            )
            return { grouped, edited }
          },
          { signal }
        )
        const full = queries.read(
          {
            scope: 'snapshot',
            snapshotId: receipt.grouped.retained.snapshotId,
            delivery: 'receipt'
          },
          signal
        )
        const checkpoint = queries.read(
          { scope: 'ids', elementIds: ids, fields: [], delivery: 'reference' },
          signal
        )
        const stale = () => {
          try {
            queries.get(checkpoint.snapshotId, checkpoint.leaseId, signal)
            return false
          } catch (error) {
            return error instanceof Error && /stale/.test(error.message)
          }
        }
        await historyApis.undo()
        const afterUndo = {
          stale: stale(),
          groupMissing: !core.getElementData(receipt.grouped.value.groupId),
          parents: ids.map((id) => core.getElementMetadata(id).parentId)
        }
        await historyApis.redo()
        const afterRedo = {
          stale: stale(),
          parents: ids.map((id) => core.getElementMetadata(id).parentId)
        }
        return {
          ids,
          ...receipt,
          full,
          afterUndo,
          afterRedo,
          workspace: core.getCurrentWorkspaceId()
        }
      } finally {
        queries.dispose()
      }
    }, path)
    const publicationEvidence = await page.evaluate(async () => {
      const { readTestCapture, readDocumentPublicationDecodeFailures } =
        await import('../src/testing/runtime-access')
      return {
        publications: readTestCapture('structural-persistence'),
        failures: readDocumentPublicationDecodeFailures(
          'structural-persistence'
        )
      }
    })
    const evidencePath = testInfo.outputPath('structural-publications.json')
    await writeFile(evidencePath, JSON.stringify(publicationEvidence, null, 2))
    await testInfo.attach('structural-publications.json', {
      path: evidencePath,
      contentType: 'application/json'
    })
    expect(publicationEvidence.failures).toEqual([])
    expect(result.grouped.retained.total).toBe(2)
    expect(result.edited).toMatchObject({ status: 'complete' })
    expect(result.full.receipt).toMatchObject({
      value: { elementIds: result.ids }
    })
    expect(result.afterUndo).toEqual({
      stale: true,
      groupMissing: true,
      parents: result.ids.map(() => result.workspace)
    })
    expect(result.afterRedo).toEqual({
      stale: true,
      parents: result.ids.map(() => result.grouped.value.groupId)
    })
  })
}

test('persists grouped structural actions and each history transition for a fresh load', async ({
  page,
  context,
  browser
}, testInfo) => {
  // Nine real three-second persistence windows plus independent page loads.
  test.setTimeout(120000)
  const identity = createTestDocumentIdentity()
  await page.goto(identity.url)
  await waitForAppReady(page)
  const fixture = await page.evaluate(async () => {
    const { core, startDocumentPublicationCapture } =
      await import('../src/testing/runtime-access')
    startDocumentPublicationCapture('save-reload')
    const { hierarchyApis, elementApis, transactionApis } =
      await import('../src/common-apis')
    const ids = transactionApis.runTransaction(() =>
      core.createElementsInParent(
        [
          { type: 'rect', x: 10, y: 20, width: 30, height: 40 },
          { type: 'rect', x: 70, y: 80, width: 50, height: 60 },
          { type: 'rect', x: 140, y: 20, width: 30, height: 40 }
        ],
        core.getCurrentWorkspaceId()
      )
    )
    if (ids.some((id) => !id)) throw new Error('Fixture creation failed')
    const nestedId = transactionApis.runTransaction(() => {
      const [parentId] = core.createElementsInParent(
        [{ type: 'group' }],
        core.getCurrentWorkspaceId()
      )
      if (!parentId) throw new Error('Missing second parent')
      const [childId] = core.createElementsInParent(
        [{ type: 'rect', width: 20, height: 20 }],
        parentId
      )
      if (!childId) throw new Error('Missing nested child')
      return childId
    })
    const { createAiTransactionRunner } = await import('../src/ai/transaction')
    const groupId = await createAiTransactionRunner().run(
      'Group and edit structural members',
      async (runMutation) => {
        if (!runMutation) throw new Error('Missing transaction owner')
        const result = await runMutation(() => hierarchyApis.groupElements(ids))
        if (!result) throw new Error('Grouping failed')
        await runMutation(() => elementApis.setElementsVisible(ids, false))
        return result.groupId
      }
    )
    return { ids, groupId, nestedId }
  })
  const peerContext = await browser.newContext()
  const peer = await peerContext.newPage()
  captureBrowserErrors(peer)
  await peer.goto(identity.url)
  await waitForAppReady(peer)
  let previousSequence = 0
  for (const operation of [
    'grouped',
    'undo',
    'redo',
    'ungroup',
    'undo',
    'redo',
    'delete',
    'undo',
    'redo'
  ] as const) {
    await test.step(`${operation} - durable acknowledgement and fresh reload`, async () => {
      await page.evaluate(
        async ({ operation, fixture }) => {
          const { historyApis, hierarchyApis, elementApis, transactionApis } =
            await import('../src/common-apis')
          if (operation === 'undo' || operation === 'redo')
            await historyApis[operation]()
          if (operation === 'ungroup')
            transactionApis.runTransaction(() =>
              hierarchyApis.ungroupElement(fixture.groupId)
            )
          if (operation === 'delete')
            transactionApis.runTransaction(() =>
              elementApis.deleteElements([
                fixture.ids[0],
                fixture.ids[2],
                fixture.nestedId
              ])
            )
        },
        { operation, fixture }
      )
      await expect
        .poll(() =>
          page.evaluate(async () => {
            const { getActiveCollaborationHandle } =
              await import('../src/testing/runtime-access')
            return getActiveCollaborationHandle()?.getSessionState().sync
          })
        )
        .toBe('synced')
      const receipt = await page.evaluate(async () => {
        const { getActiveCollaborationHandle } =
          await import('../src/testing/runtime-access')
        const session = getActiveCollaborationHandle()
        if (!session) throw new Error('Missing document session')
        return session.confirmPersistence(AbortSignal.timeout(10000))
      })
      expect(receipt.sequence).toBeGreaterThan(previousSequence)
      expect(receipt.durableSequence).toBeGreaterThanOrEqual(receipt.sequence)
      previousSequence = receipt.sequence
      const expected = await page.evaluate(async () =>
        (await import('../src/testing/runtime-access')).core.save()
      )
      const actual = await getPersistedDocumentCheckpoint(identity.fileId)
      const snapshotPath = testInfo.outputPath(
        `checkpoint-${receipt.sequence}.json`
      )
      await writeFile(
        snapshotPath,
        JSON.stringify(
          {
            operation,
            receipt,
            actual,
            expected,
            publications: await page.evaluate(async () =>
              (await import('../src/testing/runtime-access')).readTestCapture(
                'save-reload'
              )
            )
          },
          null,
          2
        )
      )
      await testInfo.attach(`checkpoint-${receipt.sequence}`, {
        path: snapshotPath,
        contentType: 'application/json'
      })
      expect(actual.checkpoint).toEqual(expected)
      await testInfo.attach(`peer-${receipt.sequence}`, {
        body: JSON.stringify({
          errors: getCapturedBrowserErrors(peer),
          state: await peer.evaluate(async () =>
            (await import('../src/testing/runtime-access'))
              .getActiveCollaborationHandle()
              ?.getSessionState()
          )
        }),
        contentType: 'application/json'
      })
      await expect
        .poll(() =>
          peer.evaluate(async () =>
            (await import('../src/testing/runtime-access')).core.save()
          )
        )
        .toEqual(expected)
      const fresh = await context.newPage()
      try {
        await fresh.goto(identity.url)
        await waitForAppReady(fresh)
        expect(
          await fresh.evaluate(async () =>
            (await import('../src/testing/runtime-access')).core.save()
          )
        ).toEqual(expected)
      } finally {
        await fresh.close()
      }
    })
  }
  await peerContext.close()
})
