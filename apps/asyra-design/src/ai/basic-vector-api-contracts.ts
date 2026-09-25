import {
  defineBasicApi as define,
  apiString as id,
  apiNumber as number,
  apiBoolean as boolean,
  apiPosition as position,
  apiObject as object,
  apiArray as array
} from './basic-api-contracts'

const target = { enum: ['inHandle', 'outHandle'] }
const mode = { enum: ['none', 'mirror-angle', 'mirror-angle-length'] }
const anchorType = { enum: ['smooth', 'sharp'] }
const nullablePosition = { anyOf: [position, { type: 'null' }] }
const point = object(
  {
    id,
    x: number,
    y: number,
    type: anchorType,
    isMove: boolean,
    inHandle: nullablePosition,
    outHandle: nullablePosition
  },
  ['id', 'x', 'y', 'type', 'inHandle', 'outHandle']
)
const note =
  'Anchor and handle positions are absolute workspace coordinates. Read current IDs before editing; a null/false result means no change was applied.'
export const basicVectorApiContracts = [
  ...[
    'getVectorAnchorPointAtWorkspacePos',
    'getVectorEditablePointAtWorkspacePos',
    'getVectorSegmentAtWorkspacePos',
    'getVectorSegmentHitAtWorkspacePos',
    'isPointNearVectorPathAtWorkspacePos'
  ].map((method) =>
    define(
      'element',
      method,
      'read',
      { elementId: id, workspacePos: position, hitRadius: number },
      'Workspace coordinates and workspace hit radius.',
      ['hitRadius']
    )
  ),
  ...[
    'getVectorAnchorPointAtClientPos',
    'getVectorEditablePointAtClientPos'
  ].map((method) =>
    define('element', method, 'read', { elementId: id, clientPos: position })
  ),
  ...[
    'getVectorSegmentAtClientPos',
    'getVectorSegmentHitAtClientPos',
    'isPointNearVectorPathAtClientPos'
  ].map((method) =>
    define(
      'element',
      method,
      'read',
      { elementId: id, clientPos: position, hitRadius: number },
      'Client coordinates. Uses the existing viewport transform.',
      ['hitRadius']
    )
  ),
  define(
    'element',
    'getVectorAnchorPoints',
    'read',
    { elementId: id },
    'Returns workspace anchors including absolute in/out handle positions and stable IDs.'
  ),
  define(
    'element',
    'getVectorAnchorSubpaths',
    'read',
    { elementId: id },
    'Returns subpaths with workspace anchors.'
  ),
  define(
    'element',
    'getVectorTopology',
    'read',
    { elementId: id },
    'Returns points, segments and networks in element-local coordinates. Do not pass these coordinates to workspace edit methods without converting.'
  ),
  define(
    'element',
    'getVectorAnchorPointById',
    'read',
    { elementId: id, pointId: id },
    note
  ),
  define('element', 'getVectorAnchorEndpoint', 'read', {
    elementId: id,
    pointId: id
  }),
  define('element', 'getVectorAnchorContinuation', 'read', {
    elementId: id,
    pointId: id
  }),
  define('element', 'getVectorAnchorPointHandleMode', 'read', {
    elementId: id,
    pointId: id
  }),
  define(
    'element',
    'updateVectorAnchorPointPosition',
    'write',
    { elementId: id, pointId: id, position },
    note +
      ' Moving an anchor also translates its handles; retain original coordinates when computing a batch.'
  ),
  define('element', 'updateVectorAnchorPointType', 'write', {
    elementId: id,
    pointId: id,
    type: anchorType
  }),
  define('element', 'setVectorAnchorPointHandleMode', 'write', {
    elementId: id,
    pointId: id,
    mode
  }),
  define(
    'element',
    'updateVectorAnchorPointHandlePosition',
    'write',
    { elementId: id, pointId: id, target, position },
    note + ' Existing handle coupling mode remains authoritative.'
  ),
  define(
    'element',
    'updateVectorAnchorPointHandles',
    'write',
    {
      elementId: id,
      updates: array(
        object(
          {
            pointId: id,
            target,
            position: nullablePosition,
            forceSmooth: boolean
          },
          ['pointId', 'target', 'position']
        )
      )
    },
    note +
      ' Plural handle updates share one topology commit; null removes the specified handle.'
  ),
  define(
    'element',
    'appendVectorAnchorPoint',
    'write',
    {
      elementId: id,
      point,
      options: object(
        {
          startNewSubpath: boolean,
          continuation: {
            anyOf: [
              object({
                networkId: id,
                pointId: id,
                side: { enum: ['start', 'end'] }
              }),
              { type: 'null' }
            ]
          }
        },
        []
      )
    },
    note,
    ['options']
  ),
  define('element', 'connectVectorAnchorEndpoints', 'write', {
    elementId: id,
    sourcePointId: id,
    targetPointId: id
  }),
  define('element', 'connectVectorAnchorPoints', 'write', {
    elementId: id,
    sourcePointId: id,
    targetPointId: id
  }),
  define('element', 'removeLastSinglePointSubpath', 'delete', {
    elementId: id
  }),
  define('element', 'removeVectorAnchorPoint', 'delete', {
    elementId: id,
    pointId: id
  }),
  define(
    'element',
    'splitVectorSegmentAtWorkspacePos',
    'write',
    { elementId: id, segmentId: id, workspacePos: position },
    note
  ),
  define('element', 'setVectorClosed', 'write', {
    elementId: id,
    closed: boolean
  }),
  define(
    'element',
    'scaleVectorElementAroundCenter',
    'write',
    {
      elementId: id,
      scale: object({
        scaleX: { type: 'number', exclusiveMinimum: 0 },
        scaleY: { type: 'number', exclusiveMinimum: 0 }
      })
    },
    'Scales through the existing vector geometry API; this is not a substitute for arbitrary point edits.'
  ),
  define(
    'element',
    'setVectorElementPositions',
    'write',
    { updates: array(object({ elementId: id, position })) },
    'Updates element positions, not anchor positions.'
  ),
  define(
    'element',
    'setVectorElementPosition',
    'write',
    { elementId: id, position },
    'Updates element position, not anchor position.'
  ),
  define(
    'element',
    'createVectorElementFromSinglePoint',
    'write',
    { pointId: id, position },
    'Creates an open vector through the existing API. Position is in workspace coordinates.'
  )
]
