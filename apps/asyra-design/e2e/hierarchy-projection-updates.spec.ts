import { readPixiProofIdentity } from '../../../scripts/pixi-proof-identity.mjs'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect, test } from '@playwright/test'
import sharp from 'sharp'
import type { SharedPublication } from '@asyra/core/contracts'
import { createTestDocumentURL, waitForAppReady } from './test-utils'

interface ProjectionReviewState {
  a: string
  b: string
  stable: string
  inner: string
  source: string
  target: string
  handles: unknown[]
  publications?: readonly SharedPublication[]
}

test('reparented Groups keep live child geometry, style, order, visibility, history and remote replay', async ({
  page
}, testInfo) => {
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const ids = await page.evaluate(async () => {
    const {
      core,
      testRuntimeState,
      getActiveCollaborationHandle,
      startDocumentPublicationCapture
    } = await import('../src/testing/runtime-access')
    const { transactionApis, hierarchyApis, fillApis, viewportApis } =
      await import('../src/common-apis')

    await getActiveCollaborationHandle()?.dispose()
    const workspace = core.getCurrentWorkspaceId()
    const state = transactionApis.runTransaction(() => {
      const [a, b, stable] = core.createElementsInParent(
        [
          { type: 'rect', x: 0, y: 0, width: 80, height: 80 },
          { type: 'rect', x: 40, y: 0, width: 80, height: 80 },
          { type: 'rect', x: 200, y: 0, width: 60, height: 60 }
        ],
        workspace
      )

      fillApis.updateFillsAtIndex([a], 0, { color: '#ff0000' })
      fillApis.updateFillsAtIndex([b], 0, { color: '#0000ff' })
      fillApis.updateFillsAtIndex([stable], 0, { color: '#00ff00' })
      const inner = hierarchyApis.groupElements([a, b]).groupId
      const source = hierarchyApis.groupElements([inner, stable]).groupId
      const target = core.createElementInParent(
        { type: 'group', x: 400, y: 100, width: 0, height: 0 },
        workspace
      )

      return { a, b, stable, inner, source, target }
    })

    core.selectElements([], { undoable: false })
    viewportApis.zoomToCenter(2, 0, 0)
    viewportApis.panTo(320, 200)
    testRuntimeState.set('projection-review', {
      ...state,
      handles: [state.a, state.b, state.stable].map((id) =>
        core.deps.render.getElementById(id)?.getEngineHandle()
      )
    })
    startDocumentPublicationCapture('projection-review-publications')

    return state
  })
  const viewport = page.locator('#viewport-anchor')
  const states: unknown[] = []

  const capture = async (name: string) => {
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
    const state = await page.evaluate(async () => {
      const { core, testRuntimeState } =
        await import('../src/testing/runtime-access')
      const { readDesignContext } =
        await import('../src/common-apis/design-context')
      const { hierarchyApis } = await import('../src/common-apis')
      const review =
        testRuntimeState.get<ProjectionReviewState>('projection-review')

      if (!review) {
        throw new Error('Missing projection review')
      }

      return {
        queries: [5, 25, 60, 110].map((x) =>
          readDesignContext({
            scope: 'region',
            bounds: { x, y: 40, width: 1, height: 1 },
            filter: { type: 'rect' }
          }).elements.map((row) => row.id)
        ),
        order: core.getElementChildren(review.inner, 0, 10).elementIds,
        parent: core.getElementMetadata(review.inner)?.parentId,
        flattened: hierarchyApis.getFlattenedElementIds(),
        handlesPreserved: [review.a, review.b, review.stable].every(
          (id, index) =>
            core.deps.render.getElementById(id)?.getEngineHandle() ===
            review.handles[index]
        )
      }
    })

    states.push({ name, ...state })
    expect(state.handlesPreserved).toBe(true)
    const png = await viewport.screenshot({
      path: testInfo.outputPath(`${name}.png`)
    })
    const { data, info } = await sharp(png)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const anchor = await viewport.boundingBox()

    if (!anchor) {
      throw new Error('Missing visible viewport bounds')
    }

    // Workspace -> canvas -> visible viewport, with the fixed camera above.
    const pixel = (x: number) => {
      const offset =
        ((200 + 40 * 2 - anchor.y) * info.width + (320 + x * 2 - anchor.x)) * 3

      return [...data.subarray(offset, offset + 3)]
    }

    return { ...state, data, pixel }
  }

  const initial = await capture('initial')

  expect(initial.pixel(25)).toEqual([255, 0, 0])
  expect(initial.pixel(60)).toEqual([0, 0, 255])
  expect(initial.queries[0]).toEqual([ids.a])
  await page.evaluate(async (ids) => {
    const { hierarchyApis } = await import('../src/common-apis')

    hierarchyApis.moveElements({
      elementIds: [ids.inner],
      targetParentId: ids.target,
      targetIndex: 0
    })
  }, ids)
  const reparented = await capture('reparented')

  expect(reparented.data.equals(initial.data)).toBe(true)
  expect(reparented.parent).toBe(ids.target)
  await page.evaluate(async (ids) => {
    const { core } = await import('../src/testing/runtime-access')
    const { transactionApis, fillApis } = await import('../src/common-apis')

    transactionApis.runTransaction(() => {
      core.updateElementProperties([
        { elementId: ids.a, values: { x: 20, width: 100 } }
      ])
      fillApis.updateFillsAtIndex([ids.a], 0, { color: '#ffff00' })
    })
  }, ids)
  const edited = await capture('edited')

  expect(edited.pixel(5)).toEqual(initial.pixel(150))
  expect(edited.pixel(25)).toEqual([255, 255, 0])
  expect(edited.pixel(60)).toEqual([0, 0, 255])
  expect(edited.queries[0]).toEqual([])
  expect(edited.queries[1]).toEqual([ids.a])
  await page.evaluate(async (ids) => {
    const { hierarchyApis } = await import('../src/common-apis')

    hierarchyApis.moveElementsRelative({
      elementIds: [ids.a],
      anchorId: ids.b,
      placement: 'after'
    })
  }, ids)
  const reordered = await capture('reordered')

  expect(reordered.pixel(60)).toEqual([255, 255, 0])
  expect(reordered.pixel(110)).toEqual([255, 255, 0])
  expect(edited.queries[3]).toEqual(expect.arrayContaining([ids.a, ids.b]))
  expect(reordered.order).toEqual([ids.b, ids.a])
  expect(reordered.flattened.indexOf(ids.b)).toBeLessThan(
    reordered.flattened.indexOf(ids.a)
  )
  await page.evaluate(async (ids) => {
    const { core } = await import('../src/testing/runtime-access')
    const { transactionApis } = await import('../src/common-apis')

    transactionApis.runTransaction(() =>
      core.updateElementData(ids.inner, { visible: false })
    )
  }, ids)
  const hidden = await capture('hidden')

  expect(hidden.pixel(60)).toEqual(initial.pixel(150))
  expect(hidden.queries).toEqual([[], [], [], []])
  const count = await page.evaluate(async () => {
    const { readTestCapture, stopTestCapture, testRuntimeState } =
      await import('../src/testing/runtime-access')
    const review =
      testRuntimeState.get<ProjectionReviewState>('projection-review')

    if (!review) {
      throw new Error('Missing projection review')
    }

    review.publications = [
      ...readTestCapture('projection-review-publications')
    ] as SharedPublication[]
    stopTestCapture('projection-review-publications')

    return review.publications.length
  })

  expect(count).toBe(4)

  const history = async (method: 'undo' | 'redo') =>
    page.evaluate(async (method) => {
      const { historyApis } = await import('../src/common-apis')

      await historyApis[method]()
    }, method)

  for (const [name, expected] of [
    ['visibility', reordered],
    ['order', edited],
    ['edit', reparented],
    ['reparent', initial]
  ] as const) {
    await history('undo')
    const actual = await capture(`undo-${name}`)

    expect(actual.data.equals(expected.data)).toBe(true)
    expect(actual.queries).toEqual(expected.queries)
    expect(actual.parent).toBe(expected.parent)
    expect(actual.flattened).toEqual(expected.flattened)
  }

  for (const [name, expected] of [
    ['reparent', reparented],
    ['edit', edited],
    ['order', reordered],
    ['visibility', hidden]
  ] as const) {
    await history('redo')
    const actual = await capture(`redo-${name}`)

    expect(actual.data.equals(expected.data)).toBe(true)
    expect(actual.queries).toEqual(expected.queries)
    expect(actual.flattened).toEqual(expected.flattened)
  }

  for (let i = 0; i < 4; i++) {
    await history('undo')
  }

  await page.evaluate(async () => {
    const { startDocumentPublicationCapture } =
      await import('../src/testing/runtime-access')

    startDocumentPublicationCapture('projection-review-echo')
  })
  const remoteExpected = [reparented, edited, reordered, hidden]

  for (let index = 0; index < count; index++) {
    await page.evaluate(async (index) => {
      const { core, testRuntimeState } =
        await import('../src/testing/runtime-access')
      const { createPublicationProcessor } =
        await import('../src/collaboration/publication-processor')
      const review =
        testRuntimeState.get<ProjectionReviewState>('projection-review')

      if (!review?.publications) {
        throw new Error('Missing review publications')
      }

      const apply = createPublicationProcessor({
        decideRemotePublication: (publication) => publication,

        applyRemoteCanonicalChangeSlices: (input) =>
          core.applyRemoteCanonicalChangeSlices({
            origin: input.origin,
            slices: input.slices as Parameters<
              typeof core.applyRemoteCanonicalChangeSlices
            >[0]['slices']
          })
      })

      if (!(await apply(review.publications[index]))) {
        throw new Error('Rejected review publication')
      }
    }, index)
    const remote = await capture(`remote-${index}`)
    const expected = remoteExpected[index]

    expect(remote.data.equals(expected.data)).toBe(true)
    expect(remote.queries).toEqual(expected.queries)
    expect(remote.flattened).toEqual(expected.flattened)
    expect(remote.parent).toBe(expected.parent)
  }

  const echoes = await page.evaluate(async () => {
    const { readTestCapture, stopTestCapture } =
      await import('../src/testing/runtime-access')
    const echoes = readTestCapture('projection-review-echo').length

    stopTestCapture('projection-review-echo')

    return echoes
  })

  expect(echoes).toBe(0)
  writeFileSync(
    testInfo.outputPath('projection-review.json'),
    JSON.stringify({ ids, count, echoes, states }, null, 2)
  )
})

test('records accepted hierarchy and coordinate batches at immediate read barriers', async ({
  page
}, testInfo) => {
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const result = await page.evaluate(async () => {
    const { core, getActiveCollaborationHandle } =
      await import('../src/testing/runtime-access')
    const { hierarchyApis, transactionApis, historyApis } =
      await import('../src/common-apis')
    const {
      EventTypes,
      subscribeToAppliedEventBatches,
      subscribeToEventBatches
    } = await import('../e2e/hierarchy-handoff-probe')

    await getActiveCollaborationHandle()?.dispose()
    const workspace = core.getCurrentWorkspaceId()
    const ids = core.createElementsInParent(
      [
        { type: 'rect', x: 36, y: 64, width: 20, height: 30 },
        { type: 'rect', x: 92, y: 110, width: 30, height: 40 }
      ],
      workspace
    )

    core.deps.render.flushFrame()
    const handles = ids.map((id) =>
      core.deps.render.getElementById(id)?.getEngineHandle()
    )

    const read = () =>
      ids.map((id) => {
        const data = core.getElementComputedData(id, ['x', 'y'])
        const parentId = core.getElementMetadata(id)?.parentId
        let x = Number(data?.x),
          y = Number(data?.y)
        let parent = parentId

        while (parent && parent !== workspace) {
          const position = core.getElementComputedData(parent, ['x', 'y'])

          x += Number(position?.x)
          y += Number(position?.y)
          parent = core.getElementMetadata(parent)?.parentId
        }

        const node = core.deps.render.getElementById(id)

        if (!node) {
          throw new Error('Missing projection at read barrier')
        }

        let workspaceNode = node.parent

        while (workspaceNode && workspaceNode.label !== workspace) {
          workspaceNode = workspaceNode.parent
        }

        if (!workspaceNode) {
          throw new Error('Missing workspace projection')
        }

        const relative = node.getTransformRelativeTo(workspaceNode)

        return {
          id,
          parentId,
          local: [Number(data?.x), Number(data?.y)],
          canonicalWorld: [x, y],
          renderedWorld: [relative.tx, relative.ty]
        }
      })

    const initial = read()
    const batches: {
      types: string[]
      committed: number
      rows: ReturnType<typeof read>
    }[] = []
    let committed = 0

    const isProjectionEvent = (event: { type: string }) =>
      event.type === EventTypes.SCENE_TREE_CHANGED ||
      event.type === EventTypes.UPDATE_COMPUTED_DATA ||
      event.type === EventTypes.UPDATE_COMPUTED_DATA_PATCH

    const committedSubscription = subscribeToEventBatches((events) => {
      if (events.some(isProjectionEvent)) {
        committed++
      }
    })
    const appliedSubscription = subscribeToAppliedEventBatches((events) => {
      if (!events.some(isProjectionEvent)) {
        return
      }

      core.deps.render.flushFrame()
      batches.push({
        types: events.map((event) => event.type),
        committed,
        rows: read()
      })
    })
    let group = ''
    let beforeCommit = -1
    let finalInside: ReturnType<typeof read> = []

    try {
      transactionApis.runTransaction(() => {
        group = hierarchyApis.groupElements(ids).groupId
        core.deps.render.flushFrame()
        finalInside = read()
        beforeCommit = committed
      })
    } finally {
      appliedSubscription.unsubscribe()
      committedSubscription.unsubscribe()
    }

    const captured = core.deps.render.captureElementSnapshot(group)
    const after = read()

    await historyApis.undo()
    core.deps.render.flushFrame()
    const undone = read()

    await historyApis.redo()
    core.deps.render.flushFrame()
    const redone = read()
    let rejected = false

    try {
      transactionApis.runTransaction(() => {
        hierarchyApis.groupElements([group])
        core.deps.render.flushFrame()
        throw new Error('Rollback after an observed projection')
      })
    } catch {
      rejected = true
    }

    core.deps.render.flushFrame()

    return {
      initial,
      batches,
      beforeCommit,
      committed,
      finalInside,
      after,
      undone,
      redone,
      rejected,
      rolledBack: read(),
      snapshot: { width: captured.width, height: captured.height },
      handlesPreserved: ids.every(
        (id, index) =>
          core.deps.render.getElementById(id)?.getEngineHandle() ===
          handles[index]
      )
    }
  })

  const sdkIdentity = readPixiProofIdentity(
    await page.evaluate(
      `import('/e2e/fixtures/pixi-version.ts').then(module => module.pixiVersion)`
    )
  )

  const sourceHashes = [
    'packages/preset/src/components/group.ts',
    'packages/preset/src/subscriptions/data-channel.ts',
    'packages/render/src/stores/scene-tree.ts',
    'packages/reactive-events/src/event-bus.ts'
  ].map((file) => ({
    file,
    sha256: createHash('sha256')
      .update(readFileSync(new URL(`../../../${file}`, import.meta.url)))
      .digest('hex')
  }))

  writeFileSync(
    testInfo.outputPath('applied-handoff.json'),
    JSON.stringify({ ...result, sourceHashes, sdkIdentity }, null, 2)
  )
  expect(result.batches.map((batch) => batch.types)).toEqual([
    ['sceneTreeChanged'],
    ['sceneTreeChanged'],
    ['updateComputedData', 'updateComputedData']
  ])
  expect(result.beforeCommit).toBe(0)
  expect(result.committed).toBe(1)
  expect(result.handlesPreserved).toBe(true)
  expect(result.rejected).toBe(true)
  for (const batch of result.batches) {
    expect(batch.committed).toBe(0)
    for (const row of batch.rows) {
      expect(row.renderedWorld).toEqual(row.canonicalWorld)
    }
  }

  expect(
    result.batches.some(
      (batch) =>
        batch.rows[0].canonicalWorld[0] !== result.initial[0].canonicalWorld[0]
    )
  ).toBe(true)
  expect(result.finalInside).toEqual(result.after)
  expect(result.after.map((row) => row.renderedWorld)).toEqual(
    result.initial.map((row) => row.renderedWorld)
  )
  expect(result.undone).toEqual(result.initial)
  expect(result.redone).toEqual(result.after)
  expect(result.rolledBack).toEqual(result.after)
  expect(result.snapshot.width).toBeGreaterThan(0)
  expect(result.snapshot.height).toBeGreaterThan(0)
})

test('retired GPU owners preserve model restore and surviving ungroup children', async ({
  page
}, testInfo) => {
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  expect(
    await page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')
      const native = core.deps.render.app?.instance as {
        renderer: {
          renderPipes: { batch: { destroyInstructionSet?: unknown } }
        }
      }

      return typeof native.renderer.renderPipes.batch.destroyInstructionSet
    })
  ).toBe('function')
  const ids = await page.evaluate(async () => {
    const { core, testRuntimeState, getActiveCollaborationHandle } =
      await import('../src/testing/runtime-access')
    const { transactionApis, hierarchyApis, fillApis, viewportApis } =
      await import('../src/common-apis')

    await getActiveCollaborationHandle()?.dispose()
    const state = transactionApis.runTransaction(() => {
      const [a, b] = core.createElementsInParent(
        [
          { type: 'rect', x: 0, y: 0, width: 80, height: 80 },
          { type: 'rect', x: 40, y: 0, width: 80, height: 80 }
        ],
        core.getCurrentWorkspaceId()
      )

      fillApis.updateFillsAtIndex([a], 0, { color: '#ff0000' })
      fillApis.updateFillsAtIndex([b], 0, { color: '#0000ff' })
      const group = hierarchyApis.groupElements([a, b]).groupId

      return { a, b, group }
    })

    core.selectElements([], { undoable: false })
    viewportApis.zoomToCenter(2, 0, 0)
    viewportApis.panTo(320, 200)
    testRuntimeState.set(
      'lifetime-restore-models',
      [state.group, state.a, state.b].map((id) =>
        core.deps.sceneTree.getElementById(id)
      )
    )

    return state
  })

  const capture = async (name: string) => {
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )

    return page
      .locator('#viewport-anchor')
      .screenshot({ path: testInfo.outputPath(`${name}.png`) })
  }

  const initial = await capture('initial')

  await page.evaluate(async ({ group }) => {
    const { hierarchyApis } = await import('../src/common-apis')

    hierarchyApis.removeSubtree(group)
  }, ids)
  const removed = await capture('removed')

  expect(removed.equals(initial)).toBe(false)
  expect(
    await page.evaluate(async (ids) => {
      const { core, testRuntimeState } =
        await import('../src/testing/runtime-access')
      const models = testRuntimeState.get<unknown[]>('lifetime-restore-models')

      if (!models) {
        throw new Error('Missing retained canonical models')
      }

      return [ids.group, ids.a, ids.b].every(
        (id, index) =>
          !core.deps.sceneTree.getElementById(id) &&
          core.deps.sceneTree._deletedMap.get(id) === models[index] &&
          !core.deps.render.getElementById(id)
      )
    }, ids)
  ).toBe(true)

  for (let cycle = 0; cycle < 3; cycle++) {
    await page.evaluate(async () => {
      const { historyApis } = await import('../src/common-apis')

      await historyApis.undo()
    })
    expect((await capture(`restored-${cycle}`)).equals(initial)).toBe(true)
    expect(
      await page.evaluate(async (ids) => {
        const { core, testRuntimeState } =
          await import('../src/testing/runtime-access')
        const models = testRuntimeState.get<unknown[]>(
          'lifetime-restore-models'
        )

        if (!models) {
          throw new Error('Missing retained canonical models')
        }

        return [ids.group, ids.a, ids.b].every(
          (id, index) =>
            core.deps.sceneTree.getElementById(id) === models[index] &&
            !core.deps.sceneTree._deletedMap.has(id) &&
            Boolean(core.deps.render.getElementById(id)?.getEngineHandle())
        )
      }, ids)
    ).toBe(true)
    await page.evaluate(async () => {
      const { historyApis } = await import('../src/common-apis')

      await historyApis.redo()
    })
    expect((await capture(`deleted-again-${cycle}`)).equals(removed)).toBe(true)
  }

  await page.evaluate(async () => {
    const { historyApis } = await import('../src/common-apis')

    await historyApis.undo()
  })
  const surviving = await page.evaluate(async ({ a, b, group }) => {
    const { core } = await import('../src/testing/runtime-access')
    const { hierarchyApis } = await import('../src/common-apis')
    const handles = [a, b].map((id) =>
      core.deps.render.getElementById(id)?.getEngineHandle()
    )

    hierarchyApis.ungroupElement(group)

    return [a, b].every(
      (id, index) =>
        core.deps.render.getElementById(id)?.getEngineHandle() ===
        handles[index]
    )
  }, ids)

  expect(surviving).toBe(true)
  expect((await capture('ungrouped')).equals(initial)).toBe(true)
  await page.evaluate(async () => {
    const { historyApis } = await import('../src/common-apis')

    await historyApis.undo()
  })
  expect((await capture('regrouped')).equals(initial)).toBe(true)
})
