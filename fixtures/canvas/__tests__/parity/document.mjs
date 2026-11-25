export async function documentEdits() {
  const {
    editor: e,
    api: { element: v, hierarchy: h, selection: s, viewport, history },
    equal,
    ok,
    tx
  } = globalThis.parity

  const spec = (x) => ({
    type: 'rect',
    workspacePosition: { x, y: 20 },
    width: 30,
    height: 20
  })

  const id = tx(() => v.createElement(spec(10)))
  const [b, c] = tx(() => v.createElements([spec(70), spec(130)]))

  equal(v.getElementType(id), 'rect')
  equal(v.getElementPosition(id), { x: 10, y: 20 })
  const root = h.getWorkspaceId()

  equal(v.getPositionInParent(root, { x: 5, y: 10 }), { x: 5, y: 10 })
  ok(
    v.getElementIdsInBounds({ x: 0, y: 0, width: 200, height: 80 }).includes(b),
    'intersection'
  )
  ok(v.isPointInsideElement(id, { x: 20, y: 25 }), 'inside rectangle')
  equal(v.getElementIdAtWorkspacePos({ x: 20, y: 25 }), id)
  const point = viewport.getCanvasPositionFromWorkspace({ x: 20, y: 25 })

  equal(v.getMousePosInWorkspace(point), { x: 20, y: 25 })
  await new Promise((resolve) =>
    globalThis.requestAnimationFrame(() =>
      globalThis.requestAnimationFrame(resolve)
    )
  )
  equal(v.getElementIdAtClientPos(point), id)
  equal(v.getRenderElementIdAtClientPos(point), id)
  ok(v.getElementClientBounds(id).width > 0, 'client bounds')
  equal(v.isContainerType('group'), true)
  equal(v.supportsSizeEdits('frame'), false)
  ok(v.hasSizeEdit({ width: 1 }), 'recognize size edit')
  v.requireSizeEditTarget(id, 'rect')
  tx(() => v.changeElementGeometry(id, { width: 48, height: 32 }))
  equal(v.getElementBounds(id).width, 48)
  tx(() => v.scaleElementAroundCenter(id, { scaleX: 2, scaleY: 1 }))
  equal(e.getElementProperties(id, ['scaleX']).scaleX, 2)
  tx(() => v.setElementPositions({ [id]: { x: 21, y: 33 } }))
  equal(v.getElementPosition(id), { x: 21, y: 33 })
  tx(() => v.setElementLock(id, true))
  equal(v.isElementLocked(id), true)
  tx(() => v.toggleElementLock(id))
  equal(v.isElementLocked(id), false)
  tx(() => v.setElementsVisible([b, c], false))
  equal(v.isElementVisible(b), false)
  tx(() => v.toggleElementVisible(b))
  tx(() => v.setElementVisible(c, true))
  equal(v.isElementVisible(b) && v.isElementVisible(c), true)
  tx(() => s.selectElements([id, b]))
  tx(() => s.toggleSelection(b))
  equal(s.getSelectedIds(), [id])
  tx(() => s.clearSelection())
  equal(s.getSelectedIds(), [])
  const group = tx(() => h.groupElements([id, b])).groupId

  equal(e.getLayers().elements[b].parentId, group)
  tx(() =>
    h.moveElements({ elementIds: [c], targetParentId: group, targetIndex: 0 })
  )
  equal(e.getLayers().elements[c].parentId, group)
  tx(() =>
    h.moveElementsRelative({ elementIds: [c], anchorId: b, placement: 'after' })
  )
  ok(
    h.getFlattenedElementIds().indexOf(c) >
      h.getFlattenedElementIds().indexOf(b),
    'sibling order'
  )
  tx(() => v.normalizeGroupGeometryForElements([id, b, c]))
  tx(() => h.ungroupElement(group))
  equal(e.getLayers().elements[b].parentId, root)
  tx(() => v.deleteElement(id))
  tx(() => v.deleteElements([b, c]))
  equal(e.getLayers().ids, [])
  await history.undo()
  ok(e.getLayers().ids.includes(c), 'undo batch delete')
  await history.redo()
  equal(e.getLayers().ids, [])
}

export async function contextAndSelection() {
  const {
    editor: e,
    api: { selection: s, systemContext: state },
    equal,
    ok,
    tx
  } = globalThis.parity
  const id = e.createPath([
    { x: 20, y: 20 },
    { x: 60, y: 60 }
  ])
  const path = e.getPath(id),
    point = { elementId: id, pointId: path.anchors[0].id, target: 'anchor' }
  const segment = { elementId: id, segmentId: Object.keys(path.segments)[0] }
  const area = {
    dragStart: { x: 0, y: 0 },
    dragCurrent: { x: 10, y: 20 },
    additive: false
  }

  tx(() => state.setAreaSelection(area))
  equal(state.getAreaSelection(), area)
  tx(() => state.clearAreaSelection())
  equal(state.getAreaSelection(), null)
  e.setTool('select')
  e.select([id])
  e.editPath(id)
  tx(() => state.enterPathEditingMode(id))
  equal(state.getPathEditingVectorId(), id)
  equal(state.getPathEditingMode(), true)
  for (const [field, value] of [
    ['PathEditingVectorId', id],
    ['PathEditingMode', true],
    ['PathEditingStartNewSubpath', true],
    ['HoveredVectorPoint', point],
    ['HoveredVectorSegment', segment],
    ['HoveredVectorSegmentInsertPoint', { ...segment, x: 12, y: 17 }]
  ]) {
    tx(() => state['set' + field](value))
    equal(state['get' + field](), value)
  }

  for (const [kind, ref] of [
    ['Point', point],
    ['Segment', segment]
  ]) {
    const token = s['encodeVector' + kind + 'SelectionId'](ref)

    equal(s['decodeVector' + kind + 'SelectionId'](token), ref)
    tx(() => s['selectVector' + kind](ref))
    let selected

    for (let frame = 0; frame < 60 && !selected; frame++) {
      selected = state['getSelectedVector' + kind]()
      if (!selected) {
        await new Promise((resolve) =>
          globalThis.requestAnimationFrame(resolve)
        )
      }
    }

    ok(selected, 'selected vector ' + kind)
    for (const key of Object.keys(ref)) {
      equal(selected[key], ref[key])
    }

    tx(() => s['clearVector' + kind + 'Selection']())
    equal(s['getSelectedVector' + kind + 's'](), [])
    tx(() => s['selectVector' + kind + 's']([token]))
    equal(s['getVector' + kind + 'SelectionIds'](), [token])
  }

  tx(() => state.clearVectorPointState())
  equal(state.getSelectedVectorPoint(), null)
  tx(() => state.exitPathEditingMode())
  equal(state.getPathEditingMode(), false)
  const rect = e.drawRectangle({ x: 0, y: 0, width: 50, height: 50 })
  const fill = { elementId: rect, fillId: e.addFill(rect) }

  for (const [field, value] of [
    ['ActiveGradientFill', fill],
    ['SelectedGradientHandle', { ...fill, handleIndex: 1 }],
    ['HoveredGradientHandle', { ...fill, handleIndex: 0 }]
  ]) {
    tx(() => state['set' + field](value))
    equal(state['get' + field](), value)
  }

  tx(() => state.clearGradientFillEditingState())
  equal(state.getActiveGradientFill(), null)
  tx(() => state.switchPrimaryTool('pen'))
  equal(e.getTool(), 'pen')
  tx(() => state.updateHoveredElementId(rect))
  ok(state.getSnapshot(), 'system snapshot')
}

export function appearance() {
  const {
    editor: e,
    api: { fills: f, strokes: s, gradient: g },
    ok,
    equal,
    tx
  } = globalThis.parity
  const [a, b] = [20, 120].map((x) =>
    e.drawRectangle({ x, y: 20, width: 80, height: 80 })
  )
  let id = tx(() => f.addFill(a))
  const added = tx(() => f.addFills([b])).value
  const other = added[0]
  const targets = [
    { elementId: a, fillId: id },
    { elementId: b, fillId: other }
  ]

  tx(() => f.updateFillField(a, id, 'opacity', 0.7))
  equal(f.getFillById(a, id).opacity, 0.7)
  tx(() => f.updateFillFields(a, id, { visible: false }))
  equal(f.getFillById(a, id).visible, false)
  tx(() =>
    f.updateFillFieldsBatch(
      targets.map((target) => ({ ...target, patch: { opacity: 0.45 } }))
    )
  )
  equal(f.getFillById(b, other).opacity, 0.45)
  const index = e
    .getElementProperties(a, ['fills'])
    .fills.findIndex((fill) => fill.id === id)

  equal(f.getFillTargetsAtIndex([a, b], index), targets)
  tx(() => f.updateFillsAtIndex([a, b], index, { color: '#335577' }))
  equal(f.getFillById(a, id).color, '#335577')
  tx(() => f.shareFillAtIndex(a, [b], index))
  tx(() => f.detachFillsAtIndex([b], index))
  tx(() => f.updatePrimaryFillColors([{ elementId: b, color: '#224466' }]))
  tx(() => f.updatePrimaryFillColor(a, '#335577'))
  equal(f.getPrimaryFillColor(b), '#224466')
  equal(f.getPrimaryFillColor(a), '#335577')
  const gradient = {
    gradientType: 'linear',
    gradientStops: [
      { position: 0, color: '#000000', opacity: 1 },
      { position: 1, color: '#ffffff', opacity: 1 }
    ],
    gradientHandles: [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ]
  }

  id = e.addFill(a)
  e.updateFill(a, id, { visible: true, kind: 'gradient', gradient })
  const handles = e.getGradientHandles(a, id)

  ok(
    handles,
    'gradient handles ' + JSON.stringify(e.getElementProperties(a, ['fills']))
  )
  const bounds = f.getCanvasBounds()

  ok(bounds.width > 0, 'canvas bounds')
  const pos = { x: handles[1].x + bounds.left, y: handles[1].y + bounds.top }

  equal(f.getCanvasPositionFromClient(pos, bounds), handles[1])
  ok(f.getGradientHandleGeometry(a, id), 'gradient geometry')
  ok(f.getGradientHandleHitAtClientPos(a, id, pos), 'gradient handle hit')
  const length = Math.hypot(
    handles[1].x - handles[0].x,
    handles[1].y - handles[0].y
  )
  const stop = {
    x:
      handles[0].x + bounds.left - ((handles[1].y - handles[0].y) * 8) / length,
    y: handles[0].y + bounds.top + ((handles[1].x - handles[0].x) * 8) / length
  }

  equal(f.getGradientStopHitAtClientPos(a, id, stop).stopIndex, 0)
  ok(
    g.isNonLinearGradient('radial') && !g.isNonLinearGradient('linear'),
    'gradient geometry mode'
  )
  equal(
    g.computeNextGradientForHandleWithDelta(gradient, 1, 80, 80, {
      x: -40,
      y: 0
    }).gradientHandles[1],
    { x: 0.5, y: 1 }
  )
  const dest = { x: pos.x - 20, y: pos.y - 10 }
  const next = f.getNextGradientForHandleAtClientPosition(a, id, 1, dest)

  tx(() => f.updateGradientHandleAtClientPosition(a, id, 1, dest))
  equal(f.getFillById(a, id).gradient.gradientHandles, next.gradientHandles)
  tx(() => f.removeFill(a, id))
  equal(f.getFillById(a, id), null)
  tx(() => f.removeFills(f.getFillTargetsAtIndex([b], index)))
  const stroke = tx(() => s.addStroke(a)).value

  tx(() => s.updateStrokeField(a, stroke, 'width', 7))
  tx(() => s.updateStrokeFields(a, stroke, { joinType: 'round' }))
  tx(() =>
    s.updateStrokeFieldsBatch([
      {
        elementId: a,
        strokeId: stroke,
        patch: { gap: 5, style: 'dashed', dash: 8 }
      }
    ])
  )
  const actual = e
    .getElementProperties(a, ['strokes'])
    .strokes.find((item) => item.id === stroke)

  equal(
    [actual.width, actual.joinType, actual.gap, actual.dash],
    [7, 'round', 5, 8]
  )
  tx(() => s.updatePrimaryStrokeColors([{ elementId: a, color: '#112233' }]))
  equal(s.getPrimaryStrokeColor(a), '#112233')
  tx(() => s.updatePrimaryStrokeColor(a, '#445566'))
  equal(s.getPrimaryStrokeColor(a), '#445566')
  tx(() => s.removeStroke(a, stroke))
  ok(
    !e
      .getElementProperties(a, ['strokes'])
      .strokes.some((item) => item.id === stroke),
    'stroke removed'
  )
}

export async function deleteSelectionWithFeatureSwitch() {
  const { editor, equal, ok } = globalThis.parity
  const id = editor.drawRectangle({ x: 25, y: 30, width: 75, height: 85 })

  editor.select([id])
  await editor.setDisabledFeatures(['deleteSelectedElement'])
  let denied

  try {
    editor.deleteSelectedElement()
  } catch (error) {
    denied = error.message
  }

  ok(
    denied?.includes('deleteSelectedElement'),
    'disabled delete reports the feature ID'
  )
  ok(
    editor.getLayers().ids.includes(id),
    'disabled delete preserves the selected object'
  )
  await editor.setDisabledFeatures([])
  editor.deleteSelectedElement()
  equal(editor.getLayers().ids.includes(id), false)
  await editor.undo()
  ok(editor.getLayers().ids.includes(id), 'undo restores the deleted object')
}
