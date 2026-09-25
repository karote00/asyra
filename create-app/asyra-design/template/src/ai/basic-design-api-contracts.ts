import {
  defineBasicApi as define,
  apiString as id,
  apiNumber as number,
  apiBoolean as boolean,
  apiPosition as position,
  apiObject as object,
  apiArray as array,
  apiIds as ids,
  apiRecord as record
} from './basic-api-contracts'

const bounds = object({ x: number, y: number, width: number, height: number })
const geometry = object(
  { x: number, y: number, width: number, height: number },
  []
)
const createOptions = object(
  {
    type: id,
    clientPosition: position,
    workspacePosition: position,
    parentId: id,
    parentWorkspaceOrigin: position,
    width: number,
    height: number,
    fills: array(record),
    strokes: array(record),
    points: record,
    segments: record,
    networks: record,
    closed: boolean
  },
  ['type']
)
const move = object({
  elementIds: ids,
  targetParentId: id,
  targetIndex: { type: 'integer' }
})
export const basicDesignApiContracts = [
  define('element', 'isContainerType', 'read', { type: id }),
  ...[
    'getElementType',
    'isElementLocked',
    'isElementVisible',
    'getElementBounds',
    'getElementClientBounds',
    'getElementPosition'
  ].map((method) => define('element', method, 'read', { elementId: id })),
  define('element', 'getElementIdAtWorkspacePos', 'read', {
    workspacePos: position
  }),
  ...[
    'getElementIdAtClientPos',
    'getRenderElementIdAtClientPos',
    'getMousePosInWorkspace'
  ].map((method) => define('element', method, 'read', { clientPos: position })),
  define('element', 'getElementIdsInBounds', 'read', { bounds }),
  define('element', 'isPointInsideElement', 'read', {
    elementId: id,
    point: position
  }),
  define('element', 'getPositionInParent', 'read', {
    parentId: id,
    workspacePosition: position
  }),
  define('element', 'setElementLock', 'write', {
    elementId: id,
    lock: boolean
  }),
  define('element', 'setElementVisible', 'write', {
    elementId: id,
    visible: boolean
  }),
  ...['toggleElementLock', 'toggleElementVisible', 'resetElementSize'].map(
    (method) => define('element', method, 'write', { elementId: id })
  ),
  define('element', 'changeElementGeometry', 'write', {
    elementId: id,
    geometry
  }),
  define('element', 'setElementPositions', 'write', {
    positionsById: { type: 'object', additionalProperties: position }
  }),
  define('element', 'updateElementProperties', 'write', {
    elementIds: ids,
    values: record
  }),
  define('element', 'patchElementProperties', 'write', {
    patches: array(
      object(
        {
          elementId: id,
          values: record,
          records: array(object({ key: id, set: record, remove: ids }, ['key']))
        },
        ['elementId', 'records']
      )
    )
  }),
  define(
    'element',
    'createElement',
    'write',
    { createOptions },
    'Use workspacePosition for deterministic placement. Registered component types are supported.'
  ),
  define('element', 'createElements', 'write', {
    createOptions: array(createOptions)
  }),
  define('element', 'createElementsInParent', 'write', {
    descriptors: array({
      ...object(
        {
          id,
          name: id,
          type: id,
          x: number,
          y: number,
          width: number,
          height: number,
          props: record
        },
        ['id', 'name', 'props', 'type', 'x', 'y']
      ),
      additionalProperties: true
    }),
    parentId: id
  }),
  define(
    'element',
    'createVectorElement',
    'write',
    { createOptions },
    'Use existing vector topology or ordinary vector construction inputs.'
  ),
  define('element', 'createVectorElementsInParent', 'write', {
    createOptions: array(createOptions),
    parentId: id
  }),
  define('element', 'deleteElement', 'delete', { elementId: id }),
  ...['getWorkspaceId', 'getFlattenedElementIds', 'getElementDataMap'].map(
    (method) => define('hierarchy', method, 'read')
  ),
  define('hierarchy', 'groupElements', 'write', { elementIds: ids }),
  define('hierarchy', 'ungroupElement', 'write', { groupId: id }),
  define(
    'hierarchy',
    'moveElements',
    'write',
    { request: move },
    'Preserves App group-geometry behavior.'
  ),
  define('hierarchy', 'removeSubtree', 'delete', { elementId: id }),
  ...[
    'getSelectedIds',
    'getVectorPointSelectionIds',
    'getVectorSegmentSelectionIds',
    'getSelectedVectorPoints',
    'getSelectedVectorSegments'
  ].map((method) => define('selection', method, 'read')),
  ...[
    'clearSelection',
    'clearVectorPointSelection',
    'clearVectorSegmentSelection'
  ].map((method) => define('selection', method, 'selection')),
  define('selection', 'toggleSelection', 'selection', { elementId: id }),
  define('selection', 'selectElements', 'selection', { elementIds: ids }),
  define('selection', 'selectVectorPoints', 'selection', { pointIds: ids }),
  define('selection', 'selectVectorSegments', 'selection', { segmentIds: ids }),
  define('selection', 'selectVectorPoint', 'selection', {
    point: object({ elementId: id, pointId: id })
  }),
  define('selection', 'selectVectorSegment', 'selection', {
    segment: object({ elementId: id, segmentId: id })
  }),
  define('viewport', 'getScale', 'read'),
  define('viewport', 'getPosition', 'read'),
  define('viewport', 'getCanvasPositionFromWorkspace', 'read', {
    workspacePos: position
  }),
  define('viewport', 'zoomFit', 'viewport'),
  define('viewport', 'zoomToCenter', 'viewport', {
    scale: { type: 'number', exclusiveMinimum: 0 },
    centerX: number,
    centerY: number
  }),
  define('viewport', 'panTo', 'viewport', { x: number, y: number }),
  define('fill', 'addFill', 'write', { elementId: id }),
  define('fill', 'removeFill', 'delete', { elementId: id, fillId: id }),
  define('fill', 'getFillById', 'read', { elementId: id, fillId: id }),
  define('fill', 'getPrimaryFillColor', 'read', { elementId: id }),
  define('fill', 'updatePrimaryFillColor', 'write', {
    elementId: id,
    color: id
  }),
  define('fill', 'updatePrimaryFillColors', 'write', {
    updates: array(object({ elementId: id, color: id }))
  }),
  define(
    'fill',
    'updateFillFields',
    'write',
    { elementId: id, fillId: id, currentFill: record, patch: record },
    'Read the current fill immediately before patching; preserve unrelated fields.'
  ),
  define('fill', 'updateFillField', 'write', {
    elementId: id,
    fillId: id,
    currentFill: record,
    key: id,
    value: {}
  }),
  define(
    'fill',
    'getGradientHandleHitAtClientPos',
    'read',
    { elementId: id, fillId: id, clientPos: position, hitRadius: number },
    '',
    ['hitRadius']
  ),
  define(
    'fill',
    'getGradientStopHitAtClientPos',
    'read',
    { elementId: id, fillId: id, clientPos: position, hitSize: number },
    '',
    ['hitSize']
  ),
  define('fill', 'getCanvasBounds', 'read'),
  define('fill', 'getCanvasPositionFromClient', 'read', {
    clientPos: position
  }),
  define('fill', 'getGradientHandleGeometry', 'read', {
    elementId: id,
    fillId: id
  }),
  define('fill', 'getNextGradientForHandleWithDelta', 'read', {
    baseGradient: record,
    handleIndex: { enum: [0, 1] },
    width: number,
    height: number,
    delta: position
  }),
  ...[
    'getNextGradientForHandleAtClientPosition',
    'updateGradientHandleAtClientPosition'
  ].map((method) =>
    define('fill', method, method.startsWith('update') ? 'write' : 'read', {
      elementId: id,
      fillId: id,
      handleIndex: { enum: [0, 1] },
      clientPos: position
    })
  ),
  ...[
    'getNextGradientForHandleWithWorkspaceDelta',
    'updateGradientHandleWithWorkspaceDelta'
  ].map((method) =>
    define('fill', method, method.startsWith('update') ? 'write' : 'read', {
      elementId: id,
      fillId: id,
      handleIndex: { enum: [0, 1] },
      baseGradient: record,
      delta: position
    })
  ),
  define('stroke', 'addStroke', 'write', { elementId: id }),
  define('stroke', 'removeStroke', 'delete', { elementId: id, strokeId: id }),
  define('stroke', 'getPrimaryStrokeColor', 'read', { elementId: id }),
  define('stroke', 'updatePrimaryStrokeColor', 'write', {
    elementId: id,
    color: id
  }),
  define('stroke', 'updatePrimaryStrokeColors', 'write', {
    updates: array(object({ elementId: id, color: id }))
  }),
  define(
    'stroke',
    'updateStrokeFields',
    'write',
    { elementId: id, strokeId: id, currentStroke: record, patch: record },
    'Read the current stroke immediately before patching; uses existing vector-bounds repair.'
  ),
  define('stroke', 'updateStrokeField', 'write', {
    elementId: id,
    strokeId: id,
    currentStroke: record,
    key: id,
    value: {}
  })
]
