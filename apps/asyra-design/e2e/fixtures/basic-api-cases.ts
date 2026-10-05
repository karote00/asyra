import { DEFAULT_ELEMENT_SIZE } from '@asyra/utils'
import core from '../../src/contexts'
import {
  elementApis,
  fillApis,
  strokeApis,
  hierarchyApis,
  selectionApis,
  viewportApis,
  transactionApis
} from '../../src/common-apis'
import {
  SelectionChannels,
  encodeVectorPointSelectionId,
  encodeVectorSegmentSelectionId
} from '@asyra/preset'
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createAiTransactionRunner } from '../../src/ai/transaction'
import { operationInputIssue } from '../../server/operation-input-schema'

// Each heterogeneous result is checked by its explicit semantic oracle below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Value = any
const required = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined)
    throw new Error('Missing fixture value')
  return value
}
interface Case {
  input: Record<string, unknown>
  check: (value: Value) => void
  setup?: () => void
}
const equal = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
    )
}
const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message)
}
const includes = (actual: unknown, value: string) =>
  assert(
    JSON.stringify(actual)?.includes(value),
    `Missing ${value} in owner output`
  )
const defined = (v: unknown) =>
  assert(v !== null && v !== undefined, 'Expected usable owner value')

/** Real browser owners, explicit inputs and semantic oracles. No mocked API methods. */
export const createBasicApiCases = async () => {
  // Observe the real Render completion, not an unrelated browser animation frame.
  // Hit-test cases require drawn geometry but intentionally never move the pointer.
  const fixtureRendered = new Promise<void>((resolve) => {
    const unsubscribe = core.subscribeToFrameComplete(() => {
      unsubscribe()
      resolve()
    })
  })
  const workspace = core.getCurrentWorkspaceId()
  transactionApis.runTransaction(() => {
    core.createElementsInParent(
      [
        {
          id: 'case-rect',
          type: 'rect',
          name: 'Rectangle',
          x: 20,
          y: 30,
          width: 100,
          height: 80,
          fills: [
            {
              id: 'case-red',
              type: 'fill',
              color: '#112233',
              opacity: 1,
              visible: true
            }
          ]
        },
        {
          id: 'case-other',
          type: 'rect',
          name: 'Other',
          x: 160,
          y: 30,
          width: 60,
          height: 40,
          fills: [
            {
              id: 'case-blue',
              type: 'fill',
              color: '#445566',
              opacity: 1,
              visible: true
            }
          ]
        },
        {
          id: 'case-frame',
          type: 'frame',
          name: 'Frame',
          x: 300,
          y: 30,
          width: 100,
          height: 100
        }
      ],
      workspace
    )
  })
  const vector = required(
    elementApis.createVectorElementFromSinglePoint('case-a', {
      x: 20,
      y: 200
    })
  )
  elementApis.appendVectorAnchorPoint(vector, {
    id: 'case-b',
    x: 120,
    y: 200,
    type: 'sharp',
    inHandle: null,
    outHandle: null
  })
  elementApis.appendVectorAnchorPoint(
    vector,
    {
      id: 'case-c',
      x: 160,
      y: 250,
      type: 'sharp',
      inHandle: null,
      outHandle: null
    },
    { startNewSubpath: true }
  )
  const topology = required(elementApis.getVectorTopology(vector))
  const segment = Object.keys(topology.segments)[0]
  const group = hierarchyApis.groupElements(['case-other'])
  const groupId = group.groupId
  strokeApis.addStroke('case-rect')
  viewportApis.zoomToCenter(1, 0, 0)
  viewportApis.panTo(0, 0)
  await fixtureRendered
  const rect = 'case-rect',
    other = 'case-other',
    frame = 'case-frame'
  const point = { x: 70, y: 70 },
    anchor = { x: 20, y: 200 },
    middle = { x: 70, y: 200 }
  const bounds = () =>
    core.getElementComputedData(rect, ['x', 'y', 'width', 'height']) as Value
  const fill = () =>
    (core.getElementComputedData(rect, ['fills'])?.fills as Value[])[0]
  const stroke = () =>
    (core.getElementComputedData(rect, ['strokes'])?.strokes as Value[])[0]
  const client = (p: { x: number; y: number }) => {
    const canvas = core.workspaceToCanvas(p),
      box = required(core.getCanvasBounds())
    return { x: canvas.x + box.left, y: canvas.y + box.top }
  }
  const cases: Record<string, Case> = {}
  const add = (
    owner: string,
    method: string,
    input: Case['input'],
    check: Case['check'],
    setup?: Case['setup']
  ) => {
    const name = `api_${owner}_${method}`
    if (cases[name]) throw new Error(`Duplicate case: ${name}`)
    cases[name] = { input, check, setup }
  }
  const eq = (v: unknown) => (actual: unknown) => equal(actual, v)
  const has = (v: string) => (actual: unknown) => includes(actual, v)
  const geometry = (patch: Record<string, number>) => () => {
    for (const [k, v] of Object.entries(patch)) equal(bounds()[k], v)
  }
  const color = (expected: string) => () => equal(fill().color, expected)
  const removed = () => equal(core.getElementData(rect), undefined)
  const vectorPoint = (id: string) =>
    elementApis.getVectorAnchorPointById(vector, id)?.point as Value
  const vectorHas = (id: string) => () => defined(vectorPoint(id))
  const paintId = fill().id,
    strokeId = stroke().id
  const positionId = required(
    required(core.getElementData(rect)).props
  ).position
  const gradient = {
    gradientType: 'linear',
    gradientHandles: [
      { x: 0, y: 0.5 },
      { x: 1, y: 0.5 }
    ],
    gradientStops: [
      { position: 0, color: '#112233', opacity: 1 },
      { position: 1, color: '#aabbcc', opacity: 1 }
    ]
  }
  const setupGradient = () =>
    fillApis.updateFillsAtIndex([rect], 0, { kind: 'gradient', gradient })
  const gradientArgs = { elementId: rect, fillId: paintId }

  // Canonical reads and coordinate transforms.
  add('core', 'getCurrentWorkspaceId', {}, eq(workspace))
  add('core', 'getCanonicalElementCount', {}, (v) =>
    assert(v === 5, 'Missing seeded objects')
  )
  add('core', 'getAllElementsBounds', {}, (v) =>
    assert(v.maxX >= 400 && v.maxY >= 200, 'Bounds exclude fixture geometry')
  )
  add('core', 'getViewportPosition', {}, (v) => {
    assert(
      Number.isFinite(v.x) && Number.isFinite(v.y),
      'Invalid viewport position'
    )
  })
  add('core', 'getViewportScale', {}, (v) => assert(v > 0, 'Invalid scale'))
  add('core', 'getSelectedElementIds', {}, eq([rect]), () =>
    selectionApis.selectElements([rect])
  )
  add('core', 'getUndoHistoryDepth', {}, (v) =>
    assert(Number.isInteger(v) && v >= 0, 'Invalid history depth')
  )
  add('core', 'getRegistrations', {}, has('rect'))
  add('core', 'getRegistrationRelations', {}, has('position'))
  add('core', 'getProjectedElementCount', {}, (v) =>
    assert(v >= 5, 'Missing renderer projections')
  )
  add('core', 'hasRenderEngineProvider', {}, eq(true))
  add('core', 'isCompositionOpen', {}, eq(false))
  add('core', 'getRuntimeState', {}, defined)
  add('core', 'getElementData', { elementId: rect }, (v) => {
    equal(v.id, rect)
    equal(v.type, 'rect')
    assert(
      typeof v.props.position === 'string',
      'Missing canonical property identity'
    )
  })
  add(
    'core',
    'getElementComputedData',
    { elementId: rect, fields: ['width'] },
    (v) => {
      equal(v.width, 100)
      equal(v.fills, undefined)
    }
  )
  add('core', 'getAllElementData', {}, has(rect))
  add('core', 'getCanonicalOwnerSnapshot', {}, has(paintId))
  add('core', 'getSystemContextSnapshot', {}, defined)
  add('core', 'isContainerType', { type: 'frame' }, eq(true))
  add('core', 'hasProjectedElement', { elementId: rect }, eq(true))
  const hitRect = (value: unknown) => {
    assert(
      value === rect,
      JSON.stringify({
        expected: rect,
        actual: value,
        input: cases.api_core_getElementIdAtClientPos.input,
        client: client(point),
        canvas: core.getCanvasBounds(),
        viewport: core.getViewportPosition(),
        scale: core.getViewportScale(),
        rectangle: bounds(),
        projected: core.hasProjectedElement(rect)
      })
    )
  }
  add('core', 'getElementIdAtClientPos', { clientPos: client(point) }, hitRect)
  add(
    'core',
    'getMousePosInWorkspace',
    { mousePos: { clientX: client(point).x, clientY: client(point).y } },
    eq(point)
  )
  add(
    'core',
    'workspaceToCanvas',
    { workspacePosition: point },
    eq(core.workspaceToCanvas(point))
  )
  add(
    'core',
    'workspaceToElementLocal',
    { elementId: frame, workspacePosition: { x: 310, y: 40 } },
    eq({ x: 10, y: 10 })
  )
  add(
    'core',
    'elementLocalToWorkspace',
    { elementId: frame, localPosition: { x: 10, y: 10 } },
    eq({ x: 310, y: 40 })
  )
  add(
    'core',
    'elementSourceToWorkspace',
    { elementId: rect, sourcePosition: { x: 0, y: 0 } },
    eq({ x: 20, y: 30 })
  )
  add(
    'core',
    'workspaceToElementSource',
    { elementId: rect, workspacePosition: { x: 20, y: 30 } },
    eq({ x: 0, y: 0 })
  )
  add('core', 'getUIProperty', { key: 'width' }, defined, () =>
    selectionApis.selectElements([rect])
  )
  add('core', 'getSystemProperty', { key: 'missing-case-property' }, eq(null))
  add('core', 'hasSystemProperty', { key: 'missing-case-property' }, eq(false))
  add(
    'core',
    'getComponentPropertyRelations',
    { componentType: 'rect' },
    has('position')
  )
  add(
    'core',
    'getPropertyChildRelations',
    { parentPropertyType: 'fills' },
    has('fill')
  )
  add('core', 'save', {}, has(rect))
  add('core', 'propsSaveData', {}, has(paintId))
  add('core', 'sceneTreeSaveData', {}, has(rect))
  add('core', 'getCanvasBounds', {}, (v) =>
    assert(v.width > 0 && v.height > 0, 'Canvas has no bounds')
  )
  add('core', 'measureElementContentBounds', { elementIds: [rect] }, has(rect))
  add(
    'core',
    'getRegistration',
    { ref: { kind: 'component', key: 'rect' } },
    has('rect')
  )
  add('core', 'hasSharedDataChannel', { name: 'props' }, eq(true))

  add('element', 'getElementType', { elementId: rect }, eq('rect'))
  add('element', 'isElementLocked', { elementId: rect }, eq(false))
  add('element', 'isElementVisible', { elementId: rect }, eq(true))
  add('element', 'getElementBounds', { elementId: rect }, (v) => {
    equal(v.width, 100)
    equal(v.height, 80)
  })
  add('element', 'getElementClientBounds', { elementId: rect }, (v) => {
    assert(v.width > 0 && v.height > 0, 'Empty client bounds')
  })
  add(
    'element',
    'getElementPosition',
    { elementId: rect },
    eq({ x: 20, y: 30 })
  )
  add(
    'element',
    'getElementIdAtWorkspacePos',
    { workspacePos: point },
    eq(rect)
  )
  for (const method of [
    'getElementIdAtClientPos',
    'getRenderElementIdAtClientPos'
  ])
    add('element', method, { clientPos: client(point) }, hitRect)
  add(
    'element',
    'getMousePosInWorkspace',
    { clientPos: client(point) },
    eq(point)
  )
  add(
    'element',
    'getElementIdsInBounds',
    { bounds: { x: 10, y: 20, width: 120, height: 100 } },
    has(rect)
  )
  add('element', 'isPointInsideElement', { elementId: rect, point }, eq(true))
  add(
    'element',
    'getPositionInParent',
    { parentId: groupId, workspacePosition: { x: 170, y: 40 } },
    eq({ x: 10, y: 10 })
  )
  add('hierarchy', 'getWorkspaceId', {}, eq(workspace))
  add('hierarchy', 'getFlattenedElementIds', {}, has(rect))
  add('hierarchy', 'getElementDataMap', {}, has(rect))
  add('selection', 'getSelectedIds', {}, eq([rect]), () =>
    selectionApis.selectElements([rect])
  )
  const pointRef = {
      elementId: vector,
      pointId: 'case-a',
      target: 'anchor' as const
    },
    segmentRef = { elementId: vector, segmentId: segment }
  for (const [method, structured, encoded, select] of [
    [
      'getVectorPointSelectionIds',
      pointRef,
      encodeVectorPointSelectionId(pointRef),
      () => selectionApis.selectVectorPoint(pointRef)
    ],
    [
      'getVectorSegmentSelectionIds',
      segmentRef,
      encodeVectorSegmentSelectionId(segmentRef),
      () => selectionApis.selectVectorSegment(segmentRef)
    ],
    [
      'getSelectedVectorPoints',
      pointRef,
      pointRef,
      () => selectionApis.selectVectorPoint(pointRef)
    ],
    [
      'getSelectedVectorSegments',
      segmentRef,
      segmentRef,
      () => selectionApis.selectVectorSegment(segmentRef)
    ]
  ] as const) {
    void structured
    add('selection', method, {}, eq([encoded]), select)
  }
  add('viewport', 'getScale', {}, (v) => assert(v > 0, 'Invalid zoom'))
  add('viewport', 'getPosition', {}, defined)
  add(
    'viewport',
    'getCanvasPositionFromWorkspace',
    { workspacePos: point },
    eq(core.workspaceToCanvas(point))
  )
  add('fill', 'getFillById', gradientArgs, (v) => {
    equal(v.id, paintId)
    equal(v.color, '#112233')
  })
  add('fill', 'getPrimaryFillColor', { elementId: rect }, eq('#112233'))
  add(
    'fill',
    'getFillTargetsAtIndex',
    { elementIds: [rect], index: 0 },
    eq([{ elementId: rect, fillId: paintId }])
  )
  add('fill', 'getCanvasBounds', {}, (v) => assert(v.width > 0, 'No canvas'))
  add(
    'fill',
    'getCanvasPositionFromClient',
    { clientPos: client(point) },
    eq(core.workspaceToCanvas(point))
  )
  add('fill', 'getGradientHandleGeometry', gradientArgs, defined, setupGradient)
  add(
    'fill',
    'getGradientHandleHitAtClientPos',
    { ...gradientArgs, clientPos: client({ x: 20, y: 70 }), hitRadius: 8 },
    defined,
    setupGradient
  )
  add(
    'fill',
    'getGradientStopHitAtClientPos',
    { ...gradientArgs, clientPos: client({ x: 20, y: 86 }), hitSize: 16 },
    defined,
    setupGradient
  )
  add(
    'fill',
    'getNextGradientForHandleAtClientPosition',
    { ...gradientArgs, handleIndex: 0, clientPos: client({ x: 30, y: 70 }) },
    (v) =>
      assert(
        JSON.stringify(v) !== JSON.stringify(gradient),
        'Handle did not move'
      ),
    setupGradient
  )
  add('stroke', 'getPrimaryStrokeColor', { elementId: rect }, defined)

  for (const space of ['Workspace', 'Client'] as const) {
    const key = space === 'Workspace' ? 'workspacePos' : 'clientPos'
    const p = (v: typeof point) => (space === 'Workspace' ? v : client(v))
    for (const method of ['getVectorAnchorPoint', 'getVectorEditablePoint'])
      add(
        'element',
        `${method}At${space}Pos`,
        { elementId: vector, [key]: p(anchor) },
        has('case-a')
      )
    for (const method of ['getVectorSegment', 'getVectorSegmentHit'])
      add(
        'element',
        `${method}At${space}Pos`,
        { elementId: vector, [key]: p(middle), hitRadius: 8 },
        has(segment)
      )
    add(
      'element',
      `isPointNearVectorPathAt${space}Pos`,
      { elementId: vector, [key]: p(middle), hitRadius: 8 },
      eq(true)
    )
  }
  for (const method of [
    'getVectorAnchorPoints',
    'getVectorAnchorSubpaths',
    'getVectorTopology'
  ])
    add('element', method, { elementId: vector }, has('case-a'))
  add(
    'element',
    'getVectorAnchorPointById',
    { elementId: vector, pointId: 'case-a' },
    (v) => {
      equal(v.point.x, 20)
      equal(v.point.y, 200)
    }
  )
  add(
    'element',
    'getVectorAnchorEndpoint',
    { elementId: vector, pointId: 'case-a' },
    defined
  )
  add(
    'element',
    'getVectorAnchorContinuation',
    { elementId: vector, pointId: 'case-a' },
    defined
  )
  add(
    'element',
    'getVectorAnchorPointHandleMode',
    { elementId: vector, pointId: 'case-a' },
    eq('none')
  )

  // Writes assert resulting canonical fields, not a mock's call count.
  const creation = { type: 'rect', x: 450, y: 50, width: 40, height: 30 }
  const created = (ids: string[]) => {
    assert(ids.length === 1, 'Expected one created ID')
    equal(core.getElementComputedData(ids[0], ['width'])?.width, 40)
  }
  add(
    'core',
    'createElementsInParent',
    { data: [creation], parentId: workspace },
    created
  )
  add(
    'core',
    'updateElementProperties',
    { updates: [{ elementId: rect, values: { width: 150 } }] },
    geometry({ width: 150 })
  )
  const patches = [
    {
      elementId: rect,
      records: [{ key: 'fills', set: { [paintId]: { color: '#abcdef' } } }]
    }
  ]
  add('core', 'patchElementProperties', { patches }, color('#abcdef'))
  add(
    'core',
    'updatePropertyComponents',
    { updates: [{ propertyId: positionId, values: { x: 45 } }] },
    geometry({ x: 45 })
  )
  add(
    'core',
    'updateElementData',
    { elementId: rect, values: { name: 'Renamed' } },
    () => equal(core.getElementData(rect)?.name, 'Renamed')
  )
  add('core', 'removeSubtree', { elementId: rect }, removed)
  add(
    'core',
    'selectByChannel',
    { channel: SelectionChannels.ELEMENT, ids: [rect] },
    () => equal(core.getSelectedElementIds(), [rect])
  )
  const move = { elementIds: [rect], targetParentId: frame, targetIndex: 0 }
  const moved = () => equal(core.getElementData(rect)?.parentId, frame)
  add('core', 'moveElements', { request: move }, moved)
  add('element', 'setElementLock', { elementId: rect, lock: true }, () =>
    equal(core.getElementData(rect)?.lock, true)
  )
  add('element', 'toggleElementLock', { elementId: rect }, () =>
    equal(core.getElementData(rect)?.lock, true)
  )
  add(
    'element',
    'setElementsVisible',
    { elementIds: [rect, other], visible: false },
    () => {
      equal(core.getElementData(rect)?.visible, false)
      equal(core.getElementData(other)?.visible, false)
    }
  )
  add('element', 'toggleElementVisible', { elementId: rect }, () =>
    equal(core.getElementData(rect)?.visible, false)
  )
  add(
    'element',
    'resetElementSize',
    { elementId: rect },
    geometry({ width: DEFAULT_ELEMENT_SIZE, height: DEFAULT_ELEMENT_SIZE })
  )
  add(
    'element',
    'changeElementGeometry',
    { elementId: rect, geometry: { width: 150 } },
    geometry({ width: 150 })
  )
  add(
    'element',
    'setElementPositions',
    { positionsById: { [rect]: { x: 45, y: 55 } } },
    geometry({ x: 45, y: 55 })
  )
  add(
    'element',
    'updateElementProperties',
    { elementIds: [rect], values: { width: 150 } },
    geometry({ width: 150 })
  )
  add('element', 'patchElementProperties', { patches }, color('#abcdef'))
  add(
    'element',
    'createElements',
    {
      createOptions: [
        {
          type: 'rect',
          workspacePosition: { x: 450, y: 50 },
          width: 40,
          height: 30
        }
      ]
    },
    created
  )
  add(
    'element',
    'createElementsInParent',
    {
      descriptors: [
        {
          ...creation,
          id: 'case-created',
          name: 'Created',
          props: {
            position: 'case-created-position',
            dimension: 'case-created-dimension'
          }
        }
      ],
      parentId: workspace
    },
    created
  )
  add(
    'element',
    'createVectorElementsInParent',
    {
      createOptions: [
        {
          type: 'vector',
          workspacePosition: { x: 450, y: 50 },
          width: 40,
          height: 30,
          points: {
            p: {
              id: 'p',
              kind: 'anchor',
              x: 450,
              y: 50,
              anchorType: 'sharp',
              handleMode: 'none'
            }
          },
          segments: {},
          networks: {
            n: { id: 'n', pointIds: ['p'], segmentIds: [], closed: false }
          }
        }
      ],
      parentId: workspace
    },
    (ids) => {
      assert(ids.length === 1, 'No vector')
      equal(core.getElementData(ids[0])?.type, 'vector')
    }
  )
  add('element', 'deleteElement', { elementId: rect }, removed)
  add('hierarchy', 'groupElements', { elementIds: [rect, frame] }, () => {
    const parent = core.getElementData(rect)?.parentId
    assert(parent !== workspace, 'Ungrouped result')
    equal(parent, core.getElementData(frame)?.parentId)
  })
  add('hierarchy', 'ungroupElement', { groupId }, () =>
    equal(core.getElementData(other)?.parentId, workspace)
  )
  add('hierarchy', 'moveElements', { request: move }, moved)
  add('hierarchy', 'removeSubtree', { elementId: rect }, removed)
  add(
    'selection',
    'toggleSelection',
    { elementId: rect },
    () =>
      assert(
        core.getSelectedElementIds().includes(rect),
        'Target not selected'
      ),
    () => selectionApis.selectElements([])
  )
  add('selection', 'selectElements', { elementIds: [rect] }, () =>
    equal(core.getSelectedElementIds(), [rect])
  )
  const pointSelection = () =>
    equal(selectionApis.getSelectedVectorPoints(), [pointRef])
  const segmentSelection = () =>
    equal(selectionApis.getSelectedVectorSegments(), [segmentRef])
  add(
    'selection',
    'selectVectorPoints',
    { pointIds: [encodeVectorPointSelectionId(pointRef)] },
    pointSelection
  )
  add(
    'selection',
    'selectVectorSegments',
    { segmentIds: [encodeVectorSegmentSelectionId(segmentRef)] },
    segmentSelection
  )
  add('selection', 'selectVectorPoint', { point: pointRef }, pointSelection)
  add(
    'selection',
    'selectVectorSegment',
    { segment: segmentRef },
    segmentSelection
  )
  add('viewport', 'zoomFit', {}, () =>
    assert(viewportApis.getScale() > 0, 'Invalid fit scale')
  )
  add('viewport', 'zoomToCenter', { scale: 1.5, centerX: 0, centerY: 0 }, () =>
    equal(viewportApis.getScale(), 1.5)
  )
  add('viewport', 'panTo', { x: 100, y: 200 }, () =>
    equal(viewportApis.getPosition(), { x: 100, y: 200 })
  )
  add(
    'fill',
    'updatePrimaryFillColors',
    { updates: [{ elementId: rect, color: '#abcdef' }] },
    color('#abcdef')
  )
  add('fill', 'addFills', { elementIds: [rect] }, () =>
    equal(
      (core.getElementComputedData(rect, ['fills'])?.fills as Value[]).length,
      2
    )
  )
  add(
    'fill',
    'removeFills',
    { targets: [{ elementId: rect, fillId: paintId }] },
    () => equal(core.getElementComputedData(rect, ['fills'])?.fills, [])
  )
  add(
    'fill',
    'updateFillsAtIndex',
    { elementIds: [rect], index: 0, patch: { color: '#abcdef' } },
    color('#abcdef')
  )
  add(
    'fill',
    'shareFillAtIndex',
    { sourceElementId: rect, elementIds: [other], index: 0 },
    () =>
      equal(
        (core.getElementComputedData(other, ['fills'])?.fills as Value[])[0].id,
        paintId
      )
  )
  add('fill', 'detachFillsAtIndex', { elementIds: [rect], index: 0 }, () => {
    assert(fill().id !== paintId, 'Still shared')
    equal(fill().color, '#112233')
  })
  add(
    'fill',
    'updateFillFieldsBatch',
    {
      updates: [{ elementId: rect, fillId: paintId, patch: { opacity: 0.3 } }]
    },
    () => equal(fill().opacity, 0.3)
  )
  add(
    'fill',
    'updateGradientHandleAtClientPosition',
    { ...gradientArgs, handleIndex: 0, clientPos: client({ x: 30, y: 70 }) },
    () =>
      assert(
        fill().gradient.gradientHandles[0].x !== 0,
        'Handle did not change'
      ),
    setupGradient
  )
  add('stroke', 'addStroke', { elementId: rect }, () =>
    equal(
      (core.getElementComputedData(rect, ['strokes'])?.strokes as Value[])
        .length,
      2
    )
  )
  add('stroke', 'removeStroke', { elementId: rect, strokeId }, () =>
    equal(core.getElementComputedData(rect, ['strokes'])?.strokes, [])
  )
  add(
    'stroke',
    'updatePrimaryStrokeColors',
    { updates: [{ elementId: rect, color: '#abcdef' }] },
    () => equal(strokeApis.getPrimaryStrokeColor(rect), '#abcdef')
  )
  add(
    'stroke',
    'updateStrokeFieldsBatch',
    { updates: [{ elementId: rect, strokeId, patch: { width: 8 } }] },
    () => equal(stroke().width, 8)
  )
  const anchorArgs = { elementId: vector, pointId: 'case-a' }
  add(
    'element',
    'updateVectorAnchorPointPosition',
    { ...anchorArgs, position: { x: 30, y: 210 } },
    () => {
      equal(vectorPoint('case-a').x, 30)
      equal(vectorPoint('case-a').y, 210)
    }
  )
  add(
    'element',
    'updateVectorAnchorPointType',
    { ...anchorArgs, type: 'smooth' },
    () => equal(vectorPoint('case-a').type, 'smooth')
  )
  add(
    'element',
    'setVectorAnchorPointHandleMode',
    { ...anchorArgs, mode: 'mirror-angle' },
    () =>
      equal(
        elementApis.getVectorAnchorPointHandleMode(vector, 'case-a'),
        'mirror-angle'
      )
  )
  add(
    'element',
    'updateVectorAnchorPointHandlePosition',
    { ...anchorArgs, target: 'outHandle', position: { x: 40, y: 220 } },
    () => equal(vectorPoint('case-a').outHandle, { x: 40, y: 220 })
  )
  add(
    'element',
    'updateVectorAnchorPointHandles',
    {
      elementId: vector,
      updates: [
        { pointId: 'case-a', target: 'outHandle', position: { x: 40, y: 220 } }
      ]
    },
    () => equal(vectorPoint('case-a').outHandle, { x: 40, y: 220 })
  )
  add(
    'element',
    'appendVectorAnchorPoint',
    {
      elementId: vector,
      point: {
        id: 'case-d',
        x: 190,
        y: 250,
        type: 'sharp',
        inHandle: null,
        outHandle: null
      }
    },
    vectorHas('case-d')
  )
  for (const method of [
    'connectVectorAnchorEndpoints',
    'connectVectorAnchorPoints'
  ])
    add(
      'element',
      method,
      { elementId: vector, sourcePointId: 'case-b', targetPointId: 'case-c' },
      () =>
        assert(
          Object.keys(required(elementApis.getVectorTopology(vector)).segments)
            .length === 2,
          'Missing new connection'
        )
    )
  add('element', 'removeLastSinglePointSubpath', { elementId: vector }, () =>
    assert(!vectorPoint('case-c'), 'Last isolated point retained')
  )
  add(
    'element',
    'removeVectorAnchorPoint',
    { elementId: vector, pointId: 'case-b' },
    () => assert(!vectorPoint('case-b'), 'Deleted point retained')
  )
  add(
    'element',
    'splitVectorSegmentAtWorkspacePos',
    { elementId: vector, segmentId: segment, workspacePos: middle },
    () =>
      assert(
        elementApis.getVectorAnchorPoints(vector).length === 4,
        'No split anchor'
      )
  )
  add('element', 'setVectorClosed', { elementId: vector, closed: true }, () =>
    assert(
      Object.values(
        required(elementApis.getVectorTopology(vector)).networks
      ).every((network) => network.closed),
      'No closed subpath'
    )
  )
  add(
    'element',
    'scaleVectorElementAroundCenter',
    { elementId: vector, scale: { scaleX: 2, scaleY: 2 } },
    () => {
      const separation = vectorPoint('case-b').x - vectorPoint('case-a').x
      assert(
        separation === 200,
        `Expected scaled separation 200, received ${separation}`
      )
    }
  )
  add(
    'element',
    'setVectorElementPositions',
    { updates: [{ elementId: vector, position: { x: 50, y: 300 } }] },
    () => {
      const b = core.getElementComputedData(vector, ['x', 'y'])
      equal(b?.x, 50)
      equal(b?.y, 300)
    }
  )
  add(
    'element',
    'createVectorElementFromSinglePoint',
    { pointId: 'case-new', position: { x: 400, y: 300 } },
    (id) => {
      equal(core.getElementData(id)?.type, 'vector')
      equal(elementApis.getVectorAnchorPointById(id, 'case-new')?.point.x, 400)
    }
  )

  equal(Object.keys(cases).sort(), basicApiContracts.map((c) => c.name).sort())
  const actions = new Map(
    createBasicApiActions().map((action) => [action.name, action])
  )
  return {
    names: Object.keys(cases),
    async run(name: string) {
      // Restore viewport separately: canvas transform is interaction state.
      viewportApis.zoomToCenter(1, 0, 0)
      viewportApis.panTo(0, 0)
      const scenario = cases[name],
        action = required(actions.get(name))
      scenario.setup?.()
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      )
      const issue = operationInputIssue(scenario.input, action.inputSchema)
      assert(!issue, issue ?? '')
      assert(
        operationInputIssue(
          { ...scenario.input, unexpectedOldSnapshot: {} },
          action.inputSchema
        ),
        'Unknown input field admitted'
      )
      const signal = new AbortController().signal
      const result = (await createAiTransactionRunner().run(
        name,
        (runMutation) => action.execute(scenario.input, { signal, runMutation })
      )) as Value
      assert(
        result.status !== 'failed' && result.status !== 'partial',
        `Unusable receipt: ${JSON.stringify(result)}`
      )
      scenario.check(result.value)
      const aborted = new AbortController()
      aborted.abort()
      let rejected = false
      try {
        await action.execute(scenario.input, { signal: aborted.signal })
      } catch {
        rejected = true
      }
      assert(rejected, 'Cancelled invocation executed')
      return { name, status: result.status }
    }
  }
}
