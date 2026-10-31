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
      const elementId = transactionApis.runTransaction(
        () =>
          elementApis.createVectorElementFromSinglePoint('a', { x: 10, y: 20 })
            .value
      )
      if (!elementId) {
        throw new Error('Vector creation failed')
      }
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
    if (scenario.startsWith('AI')) {
      await page.getByRole('button', { name: 'Close Agent panel' }).click()
    }
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
      await page.waitForFunction(async () => {
        const { isBasicApiFixtureReady } =
          await import('../e2e/fixtures/basic-api-cases')
        return isBasicApiFixtureReady()
      })
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
        } finally {
          cases.dispose()
        }
      }, contract.name)
      expect(error).toBeNull()
    })
  }
})

test('delivers canonical mutation scope through real history-group publication', async ({
  page
}) => {
  const identity = createTestDocumentIdentity()
  await page.goto(identity.url)
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
        if (!action) {
          throw new Error('Missing action')
        }
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
    const mappedColors = [a, b].map(
      (id) => core.getElementComputedData(id, ['fills'])?.fills?.[0]?.color
    )
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
      mappedColors,
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
      elementIds: [result.a],
      removedElementIds: []
    }
  })
  expect(result.mappedColors).toEqual(['#112233', '#abcdef'])
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
  const saved = await page.evaluate(async () => {
    const { core, getActiveCollaborationHandle } =
      await import('../src/testing/runtime-access')
    const session = getActiveCollaborationHandle()
    if (!session) {
      throw new Error('Missing session')
    }
    const receipt = await session.confirmPersistence(AbortSignal.timeout(10000))
    return { receipt, document: await core.save() }
  })
  expect(saved.receipt.durableSequence).toBeGreaterThanOrEqual(
    saved.receipt.sequence
  )
  expect(
    (await getPersistedDocumentCheckpoint(identity.fileId)).checkpoint
  ).toEqual(saved.document)
  await page.reload()
  await waitForAppReady(page)
  expect(
    await page.evaluate(async () =>
      (await import('../src/testing/runtime-access')).core.save()
    )
  ).toEqual(saved.document)
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
      if (ids.some((id) => !id)) {
        throw new Error('Fixture creation failed')
      }
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
      if (!group || !edit) {
        throw new Error('Missing registered operations')
      }
      try {
        const receipt = await runner.run(
          'Retained structural edit',
          async (runMutation) => {
            const context = { signal, runMutation }
            if (path === 'canonical') {
              if (!runMutation) {
                throw new Error('Missing transaction owner')
              }
              const value = await runMutation(() =>
                hierarchyApis.groupElements(ids)
              )
              if (!value) {
                throw new Error('Grouping failed')
              }
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
    if (ids.some((id) => !id)) {
      throw new Error('Fixture creation failed')
    }
    const nestedId = transactionApis.runTransaction(() => {
      const [parentId] = core.createElementsInParent(
        [{ type: 'group' }],
        core.getCurrentWorkspaceId()
      )
      if (!parentId) {
        throw new Error('Missing second parent')
      }
      const [childId] = core.createElementsInParent(
        [{ type: 'rect', width: 20, height: 20 }],
        parentId
      )
      if (!childId) {
        throw new Error('Missing nested child')
      }
      return childId
    })
    const { createAiTransactionRunner } = await import('../src/ai/transaction')
    const groupId = await createAiTransactionRunner().run(
      'Group and edit structural members',
      async (runMutation) => {
        if (!runMutation) {
          throw new Error('Missing transaction owner')
        }
        const result = await runMutation(() => hierarchyApis.groupElements(ids))
        if (!result) {
          throw new Error('Grouping failed')
        }
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
          if (operation === 'undo' || operation === 'redo') {
            await historyApis[operation]()
          }
          if (operation === 'ungroup') {
            transactionApis.runTransaction(() =>
              hierarchyApis.ungroupElement(fixture.groupId)
            )
          }
          if (operation === 'delete') {
            transactionApis.runTransaction(() =>
              elementApis.deleteElements([
                fixture.ids[0],
                fixture.ids[2],
                fixture.nestedId
              ])
            )
          }
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
        if (!session) {
          throw new Error('Missing document session')
        }
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

test('exports immutable document bytes through the runtime and browser download without replacing durable save or history', async ({
  page,
  context
}, testInfo) => {
  test.setTimeout(90000)
  const identity = createTestDocumentIdentity()
  await page.goto(identity.url)
  await waitForAppReady(page)
  await page.evaluate(async () => {
    const { core, testRuntimeState } =
      await import('../src/testing/runtime-access')
    const { transactionApis } = await import('../src/common-apis')
    transactionApis.runTransaction(() =>
      core.createElementsInParent(
        [
          {
            type: 'rect',
            x: 10,
            y: 20,
            width: 100,
            height: 50,
            name: 'Exported shape'
          }
        ],
        core.getCurrentWorkspaceId()
      )
    )
    const { createAiStartup } = await import('../src/ai/startup')
    const { createAiConfirmationBroker } =
      await import('../src/ai/confirmation')
    const { createAiHistoryProjection } =
      await import('../src/common-apis/history')
    const startup = createAiStartup({
      createConfirmation: createAiConfirmationBroker,
      createHistory: createAiHistoryProjection,
      createProvider: () => ({
        requestActionBatch: async () => {
          const action = testRuntimeState.get<{
            name: string
            arguments: Record<string, unknown>
          }>('export-action')
          if (!action) {
            throw new Error('Missing explicit export action')
          }
          return {
            batchId: crypto.randomUUID(),
            actions: [
              {
                id: crypto.randomUUID(),
                ...action,
                summary: 'Explicit document export'
              }
            ]
          }
        }
      })
    })
    const { runtime } = startup
    testRuntimeState.set('export-startup', startup)
    testRuntimeState.set('export-runtime', runtime)
  })
  const depth = await getUndoHistoryDepth(page)
  const invoke = (name: string, args: Record<string, unknown> = {}) =>
    page.evaluate(
      async ({ name, args }) => {
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')
        testRuntimeState.set('export-action', { name, arguments: args })
        const runtime =
          testRuntimeState.get<
            import('@asyra/ai-agent-runtime').AiAgentRuntime
          >('export-runtime')
        if (!runtime) {
          throw new Error('Missing export runtime')
        }
        const result = await runtime.run({
          intent: 'Export this document',
          signal: AbortSignal.timeout(15000)
        })
        if (result.status !== 'executed') {
          throw new Error(JSON.stringify(result))
        }
        return result.actionResults[0].result as {
          artifact: { artifactId: string; bytes: number; sha256: string }
          released?: boolean
          delivery?: string
        }
      },
      { name, args }
    )
  let primaryFailure: unknown
  try {
    const before = await page.evaluate(async () =>
      (await import('../src/testing/runtime-access')).core.save()
    )
    const exported = await invoke('export_document')
    expect(exported.artifact.bytes).toBeGreaterThan(0)
    expect(JSON.stringify(exported).length).toBeLessThan(2048)
    const downloadPromise = page.waitForEvent('download')
    expect(
      (
        await invoke('download_document_export', {
          artifactId: exported.artifact.artifactId
        })
      ).delivery
    ).toBe('download-requested')
    const download = await downloadPromise
    const filePath = testInfo.outputPath(download.suggestedFilename())
    await download.saveAs(filePath)
    const { readFile } = await import('node:fs/promises')
    const { createHash } = await import('node:crypto')
    const bytes = await readFile(filePath)
    expect(bytes.byteLength).toBe(exported.artifact.bytes)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      exported.artifact.sha256
    )
    expect(JSON.parse(bytes.toString())).toEqual(before)
    expect(await getUndoHistoryDepth(page)).toBe(depth)
    await expect
      .poll(() =>
        page.evaluate(
          async () =>
            (await import('../src/testing/runtime-access'))
              .getActiveCollaborationHandle()
              ?.getSessionState().sync
        )
      )
      .toBe('synced')
    const persisted = await page.evaluate(async () => {
      const session = (
        await import('../src/testing/runtime-access')
      ).getActiveCollaborationHandle()
      if (!session) {
        throw new Error('Missing document session')
      }
      return session.confirmPersistence(AbortSignal.timeout(10000))
    })
    expect(persisted.durableSequence).toBeGreaterThanOrEqual(persisted.sequence)
    expect(
      (await getPersistedDocumentCheckpoint(identity.fileId)).checkpoint
    ).toEqual(before)
    const reopened = await context.newPage()
    try {
      await reopened.goto(identity.url)
      await waitForAppReady(reopened)
      expect(
        await reopened.evaluate(async () =>
          (await import('../src/testing/runtime-access')).core.save()
        )
      ).toEqual(before)
    } finally {
      await reopened.close()
    }
    expect(
      (
        await invoke('release_document_export', {
          artifactId: exported.artifact.artifactId
        })
      ).released
    ).toBe(true)
  } catch (error) {
    primaryFailure = error
    throw error
  } finally {
    await page
      .evaluate(async () => {
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')
        await testRuntimeState
          .get<import('@asyra/ai-agent-runtime').AiAgentRuntime>(
            'export-runtime'
          )
          ?.dispose()
        const startup =
          testRuntimeState.get<import('../src/ai/startup').AiStartup>(
            'export-startup'
          )
        startup?.history.dispose()
        startup?.confirmation.dispose()
        testRuntimeState.delete('export-startup')
        testRuntimeState.delete('export-runtime')
        testRuntimeState.delete('export-action')
      })
      .catch(async (error: unknown) => {
        if (!primaryFailure) {
          throw error
        }
        await testInfo.attach('export-cleanup-failure', {
          body: String(error),
          contentType: 'text/plain'
        })
      })
  }
})

test('exports and reloads a retained large document without delivering its body as a tool result', async ({
  page,
  context
}, testInfo) => {
  const path = process.env.E2E_EXPORT_DOCUMENT
  test.skip(
    !path,
    'Provide a project-local saved document for deterministic export replay.'
  )
  if (!path) {
    return
  }
  test.setTimeout(180000)
  const { resolve, relative, isAbsolute } = await import('node:path')
  const { readFile, appendFile } = await import('node:fs/promises')
  const { createReadStream } = await import('node:fs')
  const { createServer } = await import('node:http')
  const filePath = resolve(path)
  const within = relative(resolve(process.cwd(), '../..'), filePath)
  if (isAbsolute(within) || within === '..' || within.startsWith('../')) {
    throw new Error('Export replay must remain inside the project')
  }
  const downloadedPath = testInfo.outputPath('large-document.json')
  // Send document bytes through HTTP, never one oversized DevTools protocol frame.
  const fixtureServer = createServer((request, response) => {
    const original = request.url === '/source'
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Content-Type', 'application/json')
    if (original && filePath.endsWith('.gz')) {
      response.setHeader('Content-Encoding', 'gzip')
    }
    createReadStream(original ? filePath : downloadedPath)
      .on('error', () => response.destroy())
      .pipe(response)
  })
  await new Promise<void>((resolve) =>
    fixtureServer.listen(0, '127.0.0.1', resolve)
  )
  const address = fixtureServer.address()
  if (!address || typeof address === 'string') {
    throw new Error('Missing export fixture server')
  }
  const fixtureURL = `http://127.0.0.1:${address.port}`
  const stagesPath = testInfo.outputPath('export-stages.jsonl')
  await page.exposeFunction('recordExportReplayStage', (stage: string) =>
    appendFile(stagesPath, JSON.stringify({ stage, at: Date.now() }) + '\n')
  )
  try {
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    const metadata = await page.evaluate(async (url) => {
      const stage = (name: string) =>
        (
          window as unknown as {
            recordExportReplayStage(name: string): Promise<void>
          }
        ).recordExportReplayStage(name)
      const { core, getActiveCollaborationHandle, testRuntimeState } =
        await import('../src/testing/runtime-access')
      await getActiveCollaborationHandle()?.disconnect()
      await stage('source-read')
      const source = await (await fetch(url + '/source')).json()
      await stage('source-decoded')
      core.load(source)
      await stage('source-loaded')
      const { createDocumentExport } = await import('../src/ai/document-export')
      const owner = createDocumentExport()
      testRuntimeState.set('large-export-owner', owner)
      const action = owner.actions.find(
        (entry) => entry.name === 'export_document'
      )
      if (!action) {
        throw new Error('Missing export action')
      }
      const result = (await action.execute(
        {},
        { signal: AbortSignal.timeout(120000) }
      )) as { artifact: { artifactId: string; bytes: number; sha256: string } }
      await stage('exported')
      const canonical = new TextEncoder().encode(
        JSON.stringify(await core.save())
      )
      const digest = Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', canonical))
      )
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
      return {
        ...result.artifact,
        canonicalDigest: digest,
        receiptBytes: JSON.stringify(result).length
      }
    }, fixtureURL)
    expect(metadata.bytes).toBeGreaterThan(16 * 1024 * 1024)
    expect(metadata.receiptBytes).toBeLessThan(2048)
    expect(metadata.sha256).toBe(metadata.canonicalDigest)
    const downloadPromise = page.waitForEvent('download')
    await page.evaluate(async (artifactId) => {
      const { testRuntimeState } = await import('../src/testing/runtime-access')
      const owner =
        testRuntimeState.get<
          ReturnType<
            typeof import('../src/ai/document-export').createDocumentExport
          >
        >('large-export-owner')
      const download = owner?.actions.find(
        (entry) => entry.name === 'download_document_export'
      )
      if (!download) {
        throw new Error('Missing download action')
      }
      await download.execute(
        { artifactId },
        { signal: new AbortController().signal }
      )
    }, metadata.artifactId)
    await (await downloadPromise).saveAs(downloadedPath)
    const bytes = await readFile(downloadedPath)
    const { createHash } = await import('node:crypto')
    expect(bytes.byteLength).toBe(metadata.bytes)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      metadata.sha256
    )
    await page.evaluate(async () => {
      const { testRuntimeState } = await import('../src/testing/runtime-access')
      testRuntimeState.get<{ dispose(): void }>('large-export-owner')?.dispose()
      testRuntimeState.delete('large-export-owner')
    })
    // Closing the source page also releases its large render/document allocation.
    await page.close()
    const reopened = await context.newPage()
    try {
      await reopened.goto(createTestDocumentIdentity().url)
      await waitForAppReady(reopened)
      const reloadedDigest = await reopened.evaluate(async (url) => {
        const { core, getActiveCollaborationHandle } =
          await import('../src/testing/runtime-access')
        await getActiveCollaborationHandle()?.disconnect()
        core.load(await (await fetch(url + '/download')).json())
        const json = new TextEncoder().encode(JSON.stringify(await core.save()))
        return Array.from(
          new Uint8Array(await crypto.subtle.digest('SHA-256', json))
        )
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('')
      }, fixtureURL)
      expect(reloadedDigest).toBe(metadata.sha256)
      await testInfo.attach('export-delivery-metrics', {
        body: JSON.stringify(metadata),
        contentType: 'application/json'
      })
    } finally {
      await reopened.close()
    }
  } finally {
    fixtureServer.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      fixtureServer.close((error) => (error ? reject(error) : resolve()))
    )
  }
})

test('visibility receipts preserve unchanged and unavailable outcomes through history and durable reload', async ({
  page
}) => {
  const identity = createTestDocumentIdentity()
  await page.goto(identity.url)
  await waitForAppReady(page)
  const fixture = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { transactionApis } = await import('../src/common-apis')
    const workspaceId = core.getCurrentWorkspaceId()
    const ids = transactionApis.runTransaction(() =>
      core.createElementsInParent(
        [
          { type: 'rect', width: 20, height: 30, visible: true },
          { type: 'rect', x: 40, width: 20, height: 30, visible: true }
        ],
        workspaceId
      )
    )
    if (ids.length !== 2 || ids.some((id) => !id)) {
      throw new Error('Missing fixture')
    }
    return { id: ids[0], sibling: ids[1], workspaceId }
  })
  const invoke = (elementId: string, visible: boolean) =>
    page.evaluate(
      async (input) => {
        const { createAiActions, AiActionNames } =
          await import('../src/ai/actions')
        const { observeAiAction } = await import('../src/ai/runtime-input')
        const { createAiTransactionRunner } =
          await import('../src/ai/transaction')
        const action = createAiActions().find(
          (item) => item.name === AiActionNames.SET_ELEMENT_VISIBILITY
        )
        if (!action) {
          throw new Error('Visibility action missing')
        }
        return createAiTransactionRunner().run('Visibility', (runMutation) =>
          observeAiAction(action).execute(input, {
            runMutation,
            signal: new AbortController().signal
          })
        )
      },
      { elementId, visible }
    )
  const visible = (id: string) =>
    page.evaluate(
      async (id) =>
        (await import('../src/testing/runtime-access')).core.getElementData(id)
          ?.visible,
      id
    )
  const before = await getUndoHistoryDepth(page)
  expect(await invoke(fixture.id, false)).toMatchObject({
    status: 'complete',
    changed: true,
    toolOutcome: { status: 'success', settlement: 'completed' }
  })
  expect(await visible(fixture.id)).toBe(false)
  expect(await getUndoHistoryDepth(page)).toBe(before + 1)
  for (const id of [fixture.id, 'missing-visibility', fixture.workspaceId]) {
    const unavailable = id !== fixture.id
    expect(await invoke(id, false)).toMatchObject({
      changed: false,
      status: unavailable ? 'failed' : 'no-change',
      toolOutcome: {
        status: unavailable ? 'failed' : 'success',
        settlement: unavailable ? 'not-started' : 'completed'
      }
    })
    expect(await visible(fixture.id)).toBe(false)
    expect(await visible(fixture.sibling)).toBe(true)
    expect(await getUndoHistoryDepth(page)).toBe(before + 1)
  }
  await undo(page)
  expect(await visible(fixture.id)).toBe(true)
  await redo(page)
  expect(await visible(fixture.id)).toBe(false)
  expect(await invoke(fixture.id, true)).toMatchObject({
    status: 'complete',
    changed: true
  })
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          (await import('../src/testing/runtime-access'))
            .getActiveCollaborationHandle()
            ?.getSessionState().sync
      )
    )
    .toBe('synced')
  const expected = await page.evaluate(async () => {
    const { core, getActiveCollaborationHandle } =
      await import('../src/testing/runtime-access')
    const session = getActiveCollaborationHandle()
    if (!session) {
      throw new Error('Document session missing')
    }
    const receipt = await session.confirmPersistence(AbortSignal.timeout(10000))
    if (receipt.durableSequence < receipt.sequence) {
      throw new Error('Document changes were not durably persisted')
    }
    return core.save()
  })
  expect(
    (await getPersistedDocumentCheckpoint(identity.fileId)).checkpoint
  ).toEqual(expected)
  await page.reload()
  await waitForAppReady(page)
  expect(
    await page.evaluate(async () =>
      (await import('../src/testing/runtime-access')).core.save()
    )
  ).toEqual(expected)
  expect(await visible(fixture.id)).toBe(true)
  expect(await visible(fixture.sibling)).toBe(true)
})
