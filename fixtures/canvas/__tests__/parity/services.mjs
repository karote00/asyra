export function textSessions() {
  const {
    editor: e,
    api: { text: t },
    equal,
    ok
  } = globalThis.parity
  const box = { x: 20, y: 20, width: 120, height: 45 }
  let changes = 0
  const off = t.subscribe(() => changes++)

  t.beginCreate(box, 'fixed')
  const session = t.getSnapshot()

  equal(session.bounds, box)
  ok(t.isCurrent(session), 'current text session')
  equal(t.measureTextBox(session.typography, box, 'Sample'), box)
  t.updateDraft('New text')
  equal(t.getDraftSnapshot().text, 'New text')
  t.finish('New text')
  const [id] = e.getLayers().ids

  equal(e.getElementProperties(id, ['text']).text, 'New text')
  t.beginEdit(id)
  t.updateDraft('discarded')
  t.cancel()
  equal(t.getSnapshot(), null)
  equal(e.getElementProperties(id, ['text']).text, 'New text')
  const second = t.createWorkspaceText(box, 'Second', 'fixed')

  equal(e.getElementProperties(second, ['text']).text, 'Second')
  equal(t.projectTextLayoutUpdate(id, { text: 'updated' }).text, 'updated')
  ok(changes >= 3, 'text changes')
  off()
}

export async function transactionsAndTools() {
  const {
    editor: e,
    api: { transaction: t, cursor, history, properties: p, viewport: v },
    equal,
    ok
  } = globalThis.parity

  ok(t.isTransactionBoundaryIdle(), 'idle before transaction')
  let changes = 0
  const off = t.subscribeToTransactionStatus(() => changes++)

  t.startTransaction()
  t.rollbackTransaction()
  ok(t.isTransactionBoundaryIdle(), 'rollback settled')
  t.startTransaction()
  t.configureSharedDeliverySequence({ mode: 'atomic', slices: [] })
  t.endTransaction()
  const group = t.startHistoryGroup()
  const id = t.updateHistoryGroup(group, () =>
    e.drawRectangle({ x: 20, y: 20, width: 50, height: 50 })
  )

  t.endHistoryGroup(group)
  ok(e.getLayers().ids.includes(id), 'grouped edit')
  await history.undo()
  ok(!e.getLayers().ids.includes(id), 'grouped undo')
  await history.redo()
  ok(e.getLayers().ids.includes(id), 'grouped redo')
  off()
  ok(changes > 0, 'transaction observer')
  v.panTo(7, 12)
  equal(v.getPosition(), { x: 7, y: 12 })
  v.zoomToCenter(1.4, 40, 30)
  ok(Math.abs(v.getScale() - 1.4) < 0.01, 'zoom')
  v.zoomFit()
  ok(v.getScale() > 0, 'zoom fit')
  const canvas = globalThis.document
    .querySelector('iframe')
    .contentDocument.querySelector('canvas')

  cursor.setCanvasCursor('crosshair')
  equal(canvas.style.cursor, 'crosshair')
  cursor.resetCanvasCursor()
  equal(canvas.style.cursor, 'default')
  equal(
    p.getChangedDefinedPatchEntries(['x', 'y'], { x: 3, y: 2 }, { x: 3, y: 5 }),
    [['y', 5]]
  )
  const token = Symbol('receipt')

  ok(
    p.mutationReceipt(token, { acceptedIds: [id], changed: true }).value ===
      token,
    'opaque receipt'
  )
}

export function designCommands() {
  const {
    editor: e,
    api: { design: d },
    equal,
    ok
  } = globalThis.parity
  const [a, b] = [10, 90].map((x) =>
    e.drawRectangle({ x, y: 30, width: 30, height: 40 })
  )

  for (const [i, edit] of [
    d.editDesignElement,
    d.createDesignElementEditor()
  ].entries()) {
    edit({ elementId: a, name: 'Updated ' + i })
    equal(e.getLayers().elements[a].name, 'Updated ' + i)
  }

  for (const [i, prepare] of [
    d.prepareDesignElementEdit,
    d.createDesignElementEditPreparer()
  ].entries()) {
    const apply = prepare({ elementId: b, name: 'Prepared ' + i })

    apply()
    equal(e.getLayers().elements[b].name, 'Prepared ' + i)
  }

  for (const [i, arrange] of [
    d.arrangeDesign,
    d.createDesignArranger()
  ].entries()) {
    e.moveElements({ [b]: { x: 110 + i, y: 35 } })
    arrange({
      operation: 'align',
      axis: 'horizontal',
      alignment: 'start',
      elementIds: [a, b]
    })
    equal(
      e.getElementProperties(b, ['x']).x,
      e.getElementProperties(a, ['x']).x
    )
  }

  for (const organize of [d.organizeDesign, d.createDesignOrganizer()]) {
    organize({ operation: 'group', elementIds: [a, b], name: 'Pair' })
    const parent = e.getLayers().elements[a].parentId

    equal(e.getLayers().elements[parent].name, 'Pair')
    e.select([parent])
    e.ungroup()
  }

  const query = {
    scope: 'ids',
    elementIds: [a, b],
    result: 'ids',
    expectedCount: 2
  }

  d.validateDesignContextQuery(query)
  d.validateDesignContextFilter({ type: 'rect' })
  d.assertDesignContextCount(2, 2)

  const metadata = (id) =>
    id === e.getLayers().workspaceId
      ? { type: 'workspace' }
      : e.getLayers().elements[id]

  ok(d.matchesDesignContextFilter(a, { type: 'rect' }, metadata), 'type filter')
  equal(d.requireEditableElement(a, metadata).type, 'rect')
  equal(d.readDesignContext(query).elementIds, [a, b])
  const source = {
    getCurrentWorkspaceId: () => e.getLayers().workspaceId,

    getSelectedElementIds: () => e.getSelection(),

    getElementMetadata: metadata,

    getElementComputedData: (id, fields) => e.getElementProperties(id, fields)
  }

  equal(d.createDesignContextReader(source)(query).elementIds, [a, b])
  const retained = d.createRetainedDesignContext(
    undefined,
    d.observeDesignChanges
  )

  try {
    equal(retained.read(query).elementIds, [a, b])
  } finally {
    retained.dispose()
  }
}

export async function sceneReview() {
  const {
    editor: e,
    api: { design: d, review: r, inspection },
    ok,
    equal
  } = globalThis.parity
  const id = e.drawRectangle({ x: 5, y: 5, width: 80, height: 60 })
  const root = e.getLayers().workspaceId
  const view = await inspection.inspect(id)

  ok(view.available, 'inspection image')
  const local = d.createDesignReviewer()

  try {
    const result = await local(id)

    ok(result.complete, 'reviewer completes')
  } finally {
    local.dispose()
  }

  const reviewed = await r.reviewDesign(root)

  ok(reviewed.complete, 'review completes')
  const snapshot = await r.capture(root)

  equal(snapshot.available, false)
  const retained = d.createDesignReviewer(undefined, undefined, true)
  const captured = await retained.capture(root, undefined, 'descendants')

  ok(captured.complete && captured.evidence, 'capture evidence')
  const stamp = captured.evidence

  ok(retained.owns(stamp), 'owned evidence')
  ok(retained.isCurrent(stamp), 'current evidence')
  equal((await retained.validate(stamp)).current, true)
  ok((await retained.coverage(stamp)).checks.length >= 1, 'covered checks')
  const reconciled = await retained.reconcile(stamp, [id])

  ok(
    reconciled.measurements.some((row) => row.elementId === id),
    'reconciled element'
  )
  equal(r.owns(stamp), false)
  equal((await r.validate(stamp)).current, false)
  equal(await r.coverage(stamp), undefined)
  equal((await r.reconcile(stamp, [id])).current, false)
  retained.dispose()
  r.dispose()
  ok(!r.isCurrent(stamp), 'disposed evidence')
}

export function groupedDocumentSnapshot() {
  const {
    editor: e,
    api: { hierarchy: h },
    equal
  } = globalThis.parity
  const ids = [20, 90].map((x) =>
    e.drawRectangle({ x, y: 20, width: 25, height: 40 })
  )

  e.select(ids)
  const group = e.group()

  const map = h.getElementDataMap()

  equal(map[ids[0]].parentId, group)
  map[group].children.length = 0
  equal(h.getElementDataMap()[group].children, ids)
}

export function gradientStopState() {
  const {
    editor: e,
    api: { systemContext: s },
    equal,
    tx
  } = globalThis.parity
  const id = e.drawRectangle({ x: 30, y: 40, width: 80, height: 60 })
  const fillId = e.addFill(id)

  e.updateFill(id, fillId, {
    kind: 'gradient',
    gradient: {
      gradientType: 'linear',
      gradientStops: [
        { position: 0, color: '#112233', opacity: 1 },
        { position: 1, color: '#ffffff', opacity: 1 }
      ],
      gradientHandles: [
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ]
    }
  })
  e.setActiveGradient(id, fillId)
  const stop = { elementId: id, fillId, stopIndex: 1 }
  const errors = []

  for (const key of ['HoveredGradientStop', 'SelectedGradientStop']) {
    tx(() => s['set' + key](stop))
    const actual = s['get' + key]()

    if (Object.keys(stop).some((field) => actual?.[field] !== stop[field])) {
      errors.push({ key, actual })
    }
  }

  equal(errors, [])
  const snapshot = s.getSnapshot()

  equal(snapshot.selectedGradientStop, stop)
  e.setActiveGradient(null, null)
  equal(s.getSelectedGradientStop(), null)
  equal(s.getHoveredGradientStop(), null)
  equal(snapshot.selectedGradientStop, stop)
}
