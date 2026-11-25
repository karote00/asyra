export function preparedElements() {
  const {
    editor: e,
    api: { element: v, hierarchy: h },
    tx,
    equal,
    ok
  } = globalThis.parity
  const id = 'fixture-rect'
  const root = h.getWorkspaceId()

  equal(
    tx(() =>
      v.createElementsInParent(
        [
          {
            id,
            name: 'Box',
            type: 'rect',
            x: 30,
            y: 20,
            width: 80,
            height: 60,
            visible: true,
            lock: false,
            props: { position: id + '-position', dimension: id + '-dimension' },
            fills: [],
            strokes: []
          }
        ],
        root
      )
    ),
    [id]
  )
  ok(
    v.hasMovedBeyondThreshold({ x: 0, y: 0 }, { x: 8, y: 0 }, 4),
    'drag threshold crossed'
  )
  ok(
    !v.hasMovedBeyondThreshold({ x: 0, y: 0 }, { x: 1, y: 1 }, 4),
    'drag threshold not crossed'
  )
  tx(() => v.updateElementProperties([id], { width: 79 }))
  equal(e.getElementProperties(id, ['width']).width, 79)
  tx(() =>
    v.patchElementProperties([
      { elementId: id, values: { height: 41 }, records: [] }
    ])
  )
  equal(e.getElementProperties(id, ['height']).height, 41)
  tx(() => v.resetElementSize(id))
  const bounds = v.getElementBounds(id)

  ok(bounds.width === bounds.height && bounds.height !== 41, 'reset size')
  tx(() => h.removeSubtree(id))
  ok(!h.getFlattenedElementIds().includes(id), 'subtree removed')
}

export function vectorConstruction() {
  const {
    editor: e,
    api: {
      element: v,
      topology: t,
      vector,
      vectorGeometry: geometry,
      systemContext: state
    },
    equal,
    ok,
    tx
  } = globalThis.parity
  const a = { x: 20, y: 30 },
    b = { x: 100, y: 30 },
    c = { x: 100, y: 100 }
  const one = t.createVectorTopologyFromSinglePoint('a', a)
  const line = t.appendAnchorPointToTopology(one, 'b', b)
  const tri = t.appendAnchorPointToTopology(line, 'c', c)
  const options = { ...tri, type: 'vector' }
  const descriptor = vector.prepareVectorElementData(options)

  equal(descriptor.width, 80)
  const id = tx(() => v.createVectorElement(options))
  const otherTopology = t.appendAnchorPointToTopology(
    t.appendAnchorPointToTopology(
      t.createVectorTopologyFromSinglePoint('d', a),
      'e',
      b
    ),
    'f',
    c
  )
  const [other] = tx(() =>
    v.createVectorElementsInParent(
      [{ type: 'vector', ...otherTopology }],
      e.getLayers().workspaceId
    )
  )

  equal(e.getPath(other).anchors.length, 3)
  const continuation = {
    ...v.getVectorAnchorContinuation(id, 'a'),
    elementId: id
  }

  tx(() => state.setPathEditingContinuation(continuation))
  equal(state.getPathEditingContinuation(), continuation)
  tx(() => v.setVectorClosed(id, true))
  ok(Object.values(v.getVectorTopology(id).networks)[0].closed, 'closed vector')
  tx(() => v.updateVectorAnchorPointPosition(id, 'b', { x: 105, y: 32 }))
  equal(v.getVectorAnchorPointById(id, 'b').point.x, 105)
  tx(() =>
    v.updateVectorAnchorPointHandles(id, [
      { pointId: 'b', target: 'outHandle', position: { x: 117, y: 42 } }
    ])
  )
  equal(v.getVectorAnchorPointById(id, 'b').point.outHandle, { x: 117, y: 42 })
  const scaleBefore = e.getElementProperties(id, ['scaleX']).scaleX ?? 1

  tx(() => v.scaleVectorElementAroundCenter(id, { scaleX: 2, scaleY: 2 }))
  equal(e.getElementProperties(id, ['scaleX']).scaleX, scaleBefore * 2)
  tx(() => v.setVectorElementPosition(id, { x: 63, y: 47 }))
  equal(v.getElementPosition(id), { x: 63, y: 47 })
  tx(() =>
    v.setVectorElementPositions([
      { elementId: id, position: { x: 80, y: 51 } },
      { elementId: other, position: { x: 20, y: 30 } }
    ])
  )
  equal(v.getElementPosition(id), { x: 80, y: 51 })
  const result = tx(() => v.connectVectorAnchorPoints(other, 'd', 'f'))

  ok(result.changed && result.value.closed, 'closed second path')
  const solo = tx(() => v.createVectorElementFromSinglePoint('s', a)).value
  const anchor = {
    id: 'loose',
    type: 'sharp',
    inHandle: null,
    outHandle: null,
    ...b
  }

  tx(() => v.appendVectorAnchorPoint(solo, anchor, { startNewSubpath: true }))
  equal(v.getVectorAnchorSubpaths(solo).length, 2)
  tx(() => v.removeLastSinglePointSubpath(solo))
  equal(v.getVectorAnchorSubpaths(solo).length, 1)
  v.discardTransientVectorPreviews([id, other])
  ok(
    e.getLayers().ids.includes(other),
    'canonical vector survives preview cleanup'
  )
  for (const owner of [geometry, vector]) {
    equal(owner.updatePoint(tri, 'b', { position: c }).points.b.y, c.y)
  }

  const patch = vector.createVectorComputedPatchFromTopologyChange({
    previousComputed: geometry.buildPatch(line),
    previousTopology: line,
    nextTopology: tri
  })

  ok(Object.keys(patch).length > 0, 'computed changes')
  equal(
    vector.createValidatedVectorComputedPatchRequest({
      intent: null,
      elementId: id,
      operation: 'append-anchor',
      patch
    }),
    null
  )
}

export async function extensionServices() {
  const {
    editor: e,
    api: { renderLayer: r, inspection: i, transaction: t },
    equal,
    ok
  } = globalThis.parity
  let painted = 0

  r.registerRenderLayer({
    name: 'consumer-overlay',
    layer: {},
    zIndex: 50,

    shouldUpdate: () => true,

    update: () => {
      painted++

      return false
    }
  })
  e.drawRectangle({ x: 10, y: 20, width: 45, height: 35 })
  for (let n = 0; n < 8 && !painted; n++) {
    await new Promise((resolve) => globalThis.requestAnimationFrame(resolve))
  }

  ok(painted > 0, 'render update callback')
  equal(r.unregisterRenderLayer('consumer-overlay'), true)
  equal(r.unregisterRenderLayer('consumer-overlay'), false)
  const tracker = i.createInspectionDependencies({
    parent: (id) => (id === 'child' ? 'root' : undefined),

    region: () => ['child']
  })
  const receipt = tracker.capture(
    'root',
    { x: 0, y: 0, width: 100, height: 100 },
    1
  )

  ok(tracker.current(receipt), 'retained capture')
  tracker.release(receipt)
  equal(tracker.current(receipt), false)
  tracker.dispose()
  const evidence = i.createInspectionEvidence()
  const snapshot = await evidence.capture(() => ({ available: true }), {
    elementId: e.getLayers().workspaceId
  })

  ok(snapshot.available && snapshot.evidence, 'captured inspection evidence')
  evidence.dispose()
  let events = 0
  const off = i.observeInspectionChanges(() => events++)

  e.drawRectangle({ x: 80, y: 20, width: 45, height: 35 })
  off()
  ok(events > 0, 'inspection change subscription')
  const observations = []
  const offStatus = t.subscribeToTransactionStatus((event) =>
    observations.push(event)
  )

  t.startTransaction()
  t.updateTransaction({
    type: 'updateTransaction',
    eventName: 'consumer.annotation',
    payload: { title: 'sample' },
    options: { undoable: false, rollbackable: false, shared: false }
  })
  t.endTransaction()
  offStatus()
  ok(
    t.isTransactionBoundaryIdle() && observations.length > 0,
    'unrestricted transaction completed'
  )
  await e.setDisabledFeatures(['pen'])
  let rejected

  try {
    t.updateTransaction({ type: 'action', eventName: 'test', payload: null })
  } catch (error) {
    rejected = error.message
  }

  equal(rejected, 'Raw transaction events require unrestricted Design features')
}
