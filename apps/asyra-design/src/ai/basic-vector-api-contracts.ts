import {
  defineBasicApi,
  apiString,
  apiNumber,
  apiBoolean,
  apiPosition,
  apiObject,
  apiArray
} from './basic-api-contracts'

const vectorHandleTargetSchema = { enum: ['inHandle', 'outHandle'] }

const vectorHandleModeSchema = {
  enum: ['none', 'mirror-angle', 'mirror-angle-length']
}

const vectorAnchorTypeSchema = { enum: ['smooth', 'sharp'] }

const nullablePositionSchema = { anyOf: [apiPosition, { type: 'null' }] }

const vectorAnchorPointSchema = apiObject(
  {
    id: apiString,
    x: apiNumber,
    y: apiNumber,
    type: vectorAnchorTypeSchema,
    isMove: apiBoolean,
    inHandle: nullablePositionSchema,
    outHandle: nullablePositionSchema
  },
  ['id', 'x', 'y', 'type', 'inHandle', 'outHandle']
)

const vectorWorkspaceEditingDescription =
  'Anchor and handle positions are absolute workspace coordinates. Read current IDs before editing; a null/false result means no change was applied.'

const getVectorAnchorPointAtWorkspacePosApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorAnchorPointAtWorkspacePos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'workspacePos', schema: apiPosition },
    { name: 'hitRadius', schema: apiNumber, optional: true }
  ],
  description: 'Workspace coordinates and workspace hit radius.'
})

const getVectorEditablePointAtWorkspacePosApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorEditablePointAtWorkspacePos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'workspacePos', schema: apiPosition },
    { name: 'hitRadius', schema: apiNumber, optional: true }
  ],
  description: 'Workspace coordinates and workspace hit radius.'
})

const getVectorSegmentAtWorkspacePosApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorSegmentAtWorkspacePos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'workspacePos', schema: apiPosition },
    { name: 'hitRadius', schema: apiNumber, optional: true }
  ],
  description: 'Workspace coordinates and workspace hit radius.'
})

const getVectorSegmentHitAtWorkspacePosApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorSegmentHitAtWorkspacePos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'workspacePos', schema: apiPosition },
    { name: 'hitRadius', schema: apiNumber, optional: true }
  ],
  description: 'Workspace coordinates and workspace hit radius.'
})

const isPointNearVectorPathAtWorkspacePosApi = defineBasicApi({
  owner: 'element',
  method: 'isPointNearVectorPathAtWorkspacePos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'workspacePos', schema: apiPosition },
    { name: 'hitRadius', schema: apiNumber, optional: true }
  ],
  description: 'Workspace coordinates and workspace hit radius.'
})

const getVectorAnchorPointAtClientPosApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorAnchorPointAtClientPos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'clientPos', schema: apiPosition }
  ]
})

const getVectorEditablePointAtClientPosApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorEditablePointAtClientPos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'clientPos', schema: apiPosition }
  ]
})

const getVectorSegmentAtClientPosApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorSegmentAtClientPos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'clientPos', schema: apiPosition },
    { name: 'hitRadius', schema: apiNumber, optional: true }
  ],
  description: 'Client coordinates. Uses the existing viewport transform.'
})

const getVectorSegmentHitAtClientPosApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorSegmentHitAtClientPos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'clientPos', schema: apiPosition },
    { name: 'hitRadius', schema: apiNumber, optional: true }
  ],
  description: 'Client coordinates. Uses the existing viewport transform.'
})

const isPointNearVectorPathAtClientPosApi = defineBasicApi({
  owner: 'element',
  method: 'isPointNearVectorPathAtClientPos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'clientPos', schema: apiPosition },
    { name: 'hitRadius', schema: apiNumber, optional: true }
  ],
  description: 'Client coordinates. Uses the existing viewport transform.'
})

const getVectorAnchorPointsApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorAnchorPoints',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }],
  description:
    'Returns workspace anchors including absolute in/out handle positions and stable IDs.'
})

const getVectorAnchorSubpathsApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorAnchorSubpaths',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }],
  description: 'Returns subpaths with workspace anchors.'
})

const getVectorTopologyApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorTopology',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }],
  description:
    'Returns points, segments and networks in element-local coordinates. Do not pass these coordinates to workspace edit methods without converting.'
})

const getVectorAnchorPointByIdApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorAnchorPointById',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'pointId', schema: apiString }
  ],
  description: vectorWorkspaceEditingDescription
})

const getVectorAnchorEndpointApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorAnchorEndpoint',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'pointId', schema: apiString }
  ]
})

const getVectorAnchorContinuationApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorAnchorContinuation',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'pointId', schema: apiString }
  ]
})

const getVectorAnchorPointHandleModeApi = defineBasicApi({
  owner: 'element',
  method: 'getVectorAnchorPointHandleMode',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'pointId', schema: apiString }
  ]
})

const updateVectorAnchorPointPositionApi = defineBasicApi({
  owner: 'element',
  method: 'updateVectorAnchorPointPosition',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'pointId', schema: apiString },
    { name: 'position', schema: apiPosition }
  ],
  description:
    vectorWorkspaceEditingDescription +
    ' Moving an anchor also translates its handles; retain original coordinates when computing a batch.'
})

const updateVectorAnchorPointTypeApi = defineBasicApi({
  owner: 'element',
  method: 'updateVectorAnchorPointType',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'pointId', schema: apiString },
    { name: 'type', schema: vectorAnchorTypeSchema }
  ]
})

const setVectorAnchorPointHandleModeApi = defineBasicApi({
  owner: 'element',
  method: 'setVectorAnchorPointHandleMode',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'pointId', schema: apiString },
    { name: 'mode', schema: vectorHandleModeSchema }
  ]
})

const updateVectorAnchorPointHandlePositionApi = defineBasicApi({
  owner: 'element',
  method: 'updateVectorAnchorPointHandlePosition',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'pointId', schema: apiString },
    { name: 'target', schema: vectorHandleTargetSchema },
    { name: 'position', schema: apiPosition }
  ],
  description:
    vectorWorkspaceEditingDescription +
    ' Existing handle coupling mode remains authoritative.'
})

const updateVectorAnchorPointHandlesApi = defineBasicApi({
  owner: 'element',
  method: 'updateVectorAnchorPointHandles',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    {
      name: 'updates',
      schema: apiArray(
        apiObject(
          {
            pointId: apiString,
            target: vectorHandleTargetSchema,
            position: nullablePositionSchema,
            forceSmooth: apiBoolean
          },
          ['pointId', 'target', 'position']
        )
      )
    }
  ],
  description:
    vectorWorkspaceEditingDescription +
    ' Plural handle updates share one topology commit; null removes the specified handle.'
})

const appendVectorAnchorPointApi = defineBasicApi({
  owner: 'element',
  method: 'appendVectorAnchorPoint',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'point', schema: vectorAnchorPointSchema },
    {
      name: 'options',
      schema: apiObject(
        {
          startNewSubpath: apiBoolean,
          continuation: {
            anyOf: [
              apiObject({
                networkId: apiString,
                pointId: apiString,
                side: { enum: ['start', 'end'] }
              }),
              { type: 'null' }
            ]
          }
        },
        []
      ),
      optional: true
    }
  ],
  description: vectorWorkspaceEditingDescription
})

const connectVectorAnchorEndpointsApi = defineBasicApi({
  owner: 'element',
  method: 'connectVectorAnchorEndpoints',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'sourcePointId', schema: apiString },
    { name: 'targetPointId', schema: apiString }
  ]
})

const connectVectorAnchorPointsApi = defineBasicApi({
  owner: 'element',
  method: 'connectVectorAnchorPoints',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'sourcePointId', schema: apiString },
    { name: 'targetPointId', schema: apiString }
  ]
})

const removeLastSinglePointSubpathApi = defineBasicApi({
  owner: 'element',
  method: 'removeLastSinglePointSubpath',
  effect: 'delete',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const removeVectorAnchorPointApi = defineBasicApi({
  owner: 'element',
  method: 'removeVectorAnchorPoint',
  effect: 'delete',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'pointId', schema: apiString }
  ]
})

const splitVectorSegmentAtWorkspacePosApi = defineBasicApi({
  owner: 'element',
  method: 'splitVectorSegmentAtWorkspacePos',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'segmentId', schema: apiString },
    { name: 'workspacePos', schema: apiPosition }
  ],
  description: vectorWorkspaceEditingDescription
})

const setVectorClosedApi = defineBasicApi({
  owner: 'element',
  method: 'setVectorClosed',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'closed', schema: apiBoolean }
  ]
})

const scaleVectorElementAroundCenterApi = defineBasicApi({
  owner: 'element',
  method: 'scaleVectorElementAroundCenter',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    {
      name: 'scale',
      schema: apiObject({
        scaleX: { type: 'number', exclusiveMinimum: 0 },
        scaleY: { type: 'number', exclusiveMinimum: 0 }
      })
    }
  ],
  description:
    'Scales through the existing vector geometry API; this is not a substitute for arbitrary point edits.'
})

const setVectorElementPositionsApi = defineBasicApi({
  owner: 'element',
  method: 'setVectorElementPositions',
  effect: 'write',
  parameters: [
    {
      name: 'updates',
      schema: apiArray(
        apiObject({ elementId: apiString, position: apiPosition })
      )
    }
  ],
  description: 'Updates element positions, not anchor positions.'
})

const setVectorElementPositionApi = defineBasicApi({
  owner: 'element',
  method: 'setVectorElementPosition',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'position', schema: apiPosition }
  ],
  description: 'Updates element position, not anchor position.'
})

const createVectorElementFromSinglePointApi = defineBasicApi({
  owner: 'element',
  method: 'createVectorElementFromSinglePoint',
  effect: 'write',
  parameters: [
    { name: 'pointId', schema: apiString },
    { name: 'position', schema: apiPosition }
  ],
  description:
    'Creates an open vector through the existing API. Position is in workspace coordinates.'
})

export const basicVectorApiContracts = [
  getVectorAnchorPointAtWorkspacePosApi,
  getVectorEditablePointAtWorkspacePosApi,
  getVectorSegmentAtWorkspacePosApi,
  getVectorSegmentHitAtWorkspacePosApi,
  isPointNearVectorPathAtWorkspacePosApi,
  getVectorAnchorPointAtClientPosApi,
  getVectorEditablePointAtClientPosApi,
  getVectorSegmentAtClientPosApi,
  getVectorSegmentHitAtClientPosApi,
  isPointNearVectorPathAtClientPosApi,
  getVectorAnchorPointsApi,
  getVectorAnchorSubpathsApi,
  getVectorTopologyApi,
  getVectorAnchorPointByIdApi,
  getVectorAnchorEndpointApi,
  getVectorAnchorContinuationApi,
  getVectorAnchorPointHandleModeApi,
  updateVectorAnchorPointPositionApi,
  updateVectorAnchorPointTypeApi,
  setVectorAnchorPointHandleModeApi,
  updateVectorAnchorPointHandlePositionApi,
  updateVectorAnchorPointHandlesApi,
  appendVectorAnchorPointApi,
  connectVectorAnchorEndpointsApi,
  connectVectorAnchorPointsApi,
  removeLastSinglePointSubpathApi,
  removeVectorAnchorPointApi,
  splitVectorSegmentAtWorkspacePosApi,
  setVectorClosedApi,
  scaleVectorElementAroundCenterApi,
  setVectorElementPositionsApi,
  setVectorElementPositionApi,
  createVectorElementFromSinglePointApi
]
