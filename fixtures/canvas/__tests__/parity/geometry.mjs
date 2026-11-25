export function topologyOperations() {
  const { api, equal, ok } = globalThis.parity
  const { topology: t, vector: v, vectorGeometry: geometry } = api
  const a = { x: 10, y: 10 }
  const b = { x: 40, y: 10 }
  const c = { x: 40, y: 40 }
  const empty = t.createEmptyVectorTopology()

  equal(Object.keys(empty.points), [])
  const one = t.createVectorTopologyFromSinglePoint('a', a)
  const line = t.appendAnchorPointToTopology(one, 'b', b)
  const tri = t.appendAnchorPointToTopology(line, 'c', c)

  ok(
    t.isVectorTopology(tri) && t.hasVectorTopologyData(tri),
    'canonical topology'
  )
  const [network] = t.getOrderedNetworks(tri)

  equal(network.pointIds, ['a', 'b', 'c'])
  equal(
    t.vectorTopologyToAnchorPoints(tri).map((p) => p.id),
    network.pointIds
  )
  equal(t.vectorTopologyToAnchorSubpaths(tri)[0].length, 3)
  equal(t.getAnchorEndpointInTopology(tri, 'a').side, 'start')
  equal(t.getAnchorContinuationInTopology(tri, 'c').pointId, 'c')
  equal(t.isClosedVectorTopology(tri), false)
  const segment = network.segmentIds[0]

  for (const [owner, add, move, remove, connect, join, split] of [
    [
      t,
      'appendAnchorPointToTopology',
      'updateAnchorPositionInTopology',
      'removeAnchorPointFromTopology',
      'connectAnchorEndpointsInTopology',
      'connectAnchorPointsInTopology',
      'splitSegmentInTopology'
    ],
    [
      geometry,
      'addPoint',
      'movePoint',
      'removePoint',
      'connectEndpoints',
      'connectAnchors',
      'splitSegment'
    ],
    [
      v,
      'insertPointAndRepairTopology',
      'translateAnchorAndHandles',
      'removePointAndRepairTopology',
      'connectEndpointsAndRepair',
      'connectAnchorPointsAndRepair',
      'splitSegmentAndRepairTopology'
    ]
  ]) {
    equal(owner[add](tri, 'd', { x: 10, y: 40 }).points.d.x, 10)
    equal(owner[move](tri, 'b', c).points.b.y, 40)
    ok(!owner[remove](tri, 'b').points.b, remove)
    const ends =
      owner === t
        ? ['a', 'c'].map((id) => t.getAnchorEndpointInTopology(tri, id))
        : ['a', 'c']

    ok(owner[connect](tri, ...ends).closed, connect)
    ok(owner[join](tri, 'a', 'c').closed, join)
    const divided = owner[split](tri, segment, { t: 0.5 })

    equal(divided.topology.points[divided.pointId].x, 25)
  }

  equal(t.isClosedVectorTopology(t.setTopologyClosed(tri, true)), true)
  const separate = t.appendAnchorPointToTopology(tri, 'd', a, {
    startNewSubpath: true
  })

  ok(
    !t.removeLastSinglePointSubpath(separate).points.d,
    'remove isolated subpath'
  )
  equal(t.toLocalTopology(tri, a).points.a.x, 0)
  equal(v.normalizeVectorTopology(tri, a).points.a.y, 0)
  equal(v.calculateVectorBounds(tri), { x: 10, y: 10, width: 30, height: 30 })
  equal(
    v.scaleVectorTopologyAroundCenter(tri, { scaleX: 2, scaleY: 1 }).points.a.x,
    -5
  )
  geometry.validate(tri)
  v.assertVectorTopologyConsistency(tri)
  const patch = geometry.buildPatch(tri)

  ok(v.isVectorComputedData(patch), 'computed vector')
  equal(Object.keys(v.buildVectorComputedPatch(tri).points).sort(), [
    'a',
    'b',
    'c'
  ])
  const smooth = t.setAnchorTypeInTopology(tri, 'b', 'smooth')

  equal(smooth.points.b.anchorType, 'smooth')
  const handle = { x: 45, y: 16 }

  for (const [owner, mode] of [
    [geometry, 'setHandleMode'],
    [v, 'setHandleModeAndRepair'],
    [t, 'setAnchorHandleModeInTopology']
  ]) {
    const next = owner[mode](smooth, 'b', 'mirror-angle')

    equal(v.getVectorAnchorHandleMode(next.points.b), 'mirror-angle')
  }

  for (const [owner, updater] of [
    [geometry, 'updateHandle'],
    [v, 'updateHandleWithMode']
  ]) {
    const result = owner[updater](smooth, 'b', 'outHandle', handle, 'none')

    ok(
      Object.values(result.points).some((p) => p.x === 45 && p.y === 16),
      updater
    )
  }

  const withHandle = t.setAnchorHandleInTopology(smooth, 'b', 'out', handle)

  ok(
    Object.values(withHandle.points).some((p) => p.x === 45),
    'handle edit'
  )
}

export function curves() {
  const {
    api: { vector: v },
    equal,
    ok
  } = globalThis.parity
  const curve = [0, 10, 20, 30].map((x) => ({ x, y: 5 }))

  equal(v.getCubicBezierSegmentBounds(...curve), {
    minX: 0,
    minY: 5,
    maxX: 30,
    maxY: 5
  })
  const target = { x: 15, y: 10 }
  const closest = v.getClosestPointOnCubicBezier(...curve, target)
  const projected = v.projectPointToCubicBezier(...curve, target)

  ok(
    Math.abs(closest.x - 15) < 0.1 && Math.abs(projected.t - 0.5) < 0.01,
    'curve projection'
  )
  equal(v.splitCubicBezierAtT(...curve, 0.5).splitPoint, { x: 15, y: 5 })
  const pair = {
    anchor: { x: 0, y: 0 },
    inHandle: { x: -10, y: 0 },
    outHandle: { x: 10, y: 0 },
    mode: 'mirror-angle-length'
  }

  equal(
    v.resolveHandleModeDragUpdate({
      ...pair,
      target: 'outHandle',
      position: { x: 0, y: 15 }
    }).nextIn,
    { x: 0, y: -15 }
  )
  const switched = v.resolveHandleModeSwitchUpdate({
    ...pair,
    inHandle: { x: -8, y: 3 }
  })

  ok(
    switched && Math.abs(switched.inHandle.x + switched.outHandle.x) < 1e-8,
    'mirrored handles'
  )
}

export function vectorEditing() {
  const {
    editor: e,
    api: { element: v, viewport },
    equal,
    ok,
    tx
  } = globalThis.parity
  const start = { x: 30, y: 40 },
    middle = { x: 90, y: 40 },
    end = { x: 90, y: 100 }
  const id = e.createPath([start, middle, end])
  const [a, b, c] = v.getVectorAnchorPoints(id)

  equal(v.getVectorAnchorSubpaths(id)[0].length, 3)
  const topology = v.getVectorTopology(id)
  const segment = Object.values(topology.segments).find(
    (s) => s.startId === a.id
  ).id

  equal(v.getVectorAnchorEndpoint(id, a.id).pointId, a.id)
  equal(v.getVectorAnchorContinuation(id, c.id).pointId, c.id)
  equal(v.getVectorAnchorPointById(id, b.id).point.id, b.id)
  for (const space of ['Workspace', 'Client']) {
    const asPoint = (p) =>
      space === 'Client' ? viewport.getCanvasPositionFromWorkspace(p) : p

    const at = asPoint(start),
      halfway = asPoint({ x: 60, y: 40 })

    equal(v['getVectorAnchorPointAt' + space + 'Pos'](id, at).point.id, a.id)
    ok(v['getVectorEditablePointAt' + space + 'Pos'](id, at), 'editable point')
    equal(v['getVectorSegmentAt' + space + 'Pos'](id, halfway), segment)
    ok(v['getVectorSegmentHitAt' + space + 'Pos'](id, halfway), 'segment hit')
    ok(v['isPointNearVectorPathAt' + space + 'Pos'](id, halfway), 'path hit')
  }

  tx(() => v.setVectorAnchorPointHandleMode(id, b.id, 'mirror-angle'))
  equal(v.getVectorAnchorPointHandleMode(id, b.id), 'mirror-angle')
  tx(() => v.updateVectorAnchorPointType(id, b.id, 'smooth'))
  tx(() =>
    v.updateVectorAnchorPointHandlePosition(id, b.id, 'outHandle', {
      x: 105,
      y: 48
    })
  )
  equal(v.getVectorAnchorPointById(id, b.id).point.outHandle, { x: 105, y: 48 })
  const split = tx(() =>
    v.splitVectorSegmentAtWorkspacePos(id, segment, { x: 60, y: 40 })
  ).value

  ok(
    split.point.id !== a.id && v.getVectorAnchorPoints(id).length === 4,
    'segment split'
  )
  tx(() => v.removeVectorAnchorPoint(id, split.point.id))
  equal(v.getVectorAnchorPoints(id).length, 3)
  const open = e.createPath([start, middle, end])
  const ends = e.getPath(open).anchors
  const closed = tx(() =>
    v.connectVectorAnchorEndpoints(open, ends[0].id, ends[2].id)
  )

  ok(
    closed.value.closed && Object.values(e.getPath(open).networks)[0].closed,
    'endpoint closure'
  )
  const second = e.createPath([start, middle, end])
  const anchors = e.getPath(second).anchors

  ok(
    e.connectAnchors(second, anchors[0].id, anchors[2].id),
    'workspace connection'
  )
  ok(Object.values(e.getPath(second).networks)[0].closed, 'workspace closure')
}
