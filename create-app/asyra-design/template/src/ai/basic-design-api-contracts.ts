import {
  defineBasicApi,
  apiString,
  apiNumber,
  apiBoolean,
  apiPosition,
  apiObject,
  apiArray,
  apiIds,
  apiRecord
} from './basic-api-contracts'

const elementBoundsSchema = apiObject({
  x: apiNumber,
  y: apiNumber,
  width: apiNumber,
  height: apiNumber
})

const elementGeometrySchema = apiObject(
  { x: apiNumber, y: apiNumber, width: apiNumber, height: apiNumber },
  []
)

const elementCreationOptionsSchema = apiObject(
  {
    type: apiString,
    clientPosition: apiPosition,
    workspacePosition: apiPosition,
    parentId: apiString,
    parentWorkspaceOrigin: apiPosition,
    width: apiNumber,
    height: apiNumber,
    fills: apiArray(apiRecord),
    strokes: apiArray(apiRecord),
    points: apiRecord,
    segments: apiRecord,
    networks: apiRecord,
    closed: apiBoolean
  },
  ['type']
)

const elementMoveRequestSchema = apiObject({
  elementIds: apiIds,
  targetParentId: apiString,
  targetIndex: { type: 'integer' }
})

const isContainerTypeApi = defineBasicApi({
  owner: 'element',
  method: 'isContainerType',
  effect: 'read',
  parameters: [{ name: 'type', schema: apiString }]
})

const getElementTypeApi = defineBasicApi({
  owner: 'element',
  method: 'getElementType',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const isElementLockedApi = defineBasicApi({
  owner: 'element',
  method: 'isElementLocked',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const isElementVisibleApi = defineBasicApi({
  owner: 'element',
  method: 'isElementVisible',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getElementBoundsApi = defineBasicApi({
  owner: 'element',
  method: 'getElementBounds',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getElementClientBoundsApi = defineBasicApi({
  owner: 'element',
  method: 'getElementClientBounds',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getElementPositionApi = defineBasicApi({
  owner: 'element',
  method: 'getElementPosition',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getElementIdAtWorkspacePosApi = defineBasicApi({
  owner: 'element',
  method: 'getElementIdAtWorkspacePos',
  effect: 'read',
  parameters: [{ name: 'workspacePos', schema: apiPosition }]
})

const getElementIdAtClientPosApi = defineBasicApi({
  owner: 'element',
  method: 'getElementIdAtClientPos',
  effect: 'read',
  parameters: [{ name: 'clientPos', schema: apiPosition }]
})

const getRenderElementIdAtClientPosApi = defineBasicApi({
  owner: 'element',
  method: 'getRenderElementIdAtClientPos',
  effect: 'read',
  parameters: [{ name: 'clientPos', schema: apiPosition }]
})

const getMousePosInWorkspaceApi = defineBasicApi({
  owner: 'element',
  method: 'getMousePosInWorkspace',
  effect: 'read',
  parameters: [{ name: 'clientPos', schema: apiPosition }]
})

const getElementIdsInBoundsApi = defineBasicApi({
  owner: 'element',
  method: 'getElementIdsInBounds',
  effect: 'read',
  parameters: [{ name: 'bounds', schema: elementBoundsSchema }]
})

const isPointInsideElementApi = defineBasicApi({
  owner: 'element',
  method: 'isPointInsideElement',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'point', schema: apiPosition }
  ]
})

const getPositionInParentApi = defineBasicApi({
  owner: 'element',
  method: 'getPositionInParent',
  effect: 'read',
  parameters: [
    { name: 'parentId', schema: apiString },
    { name: 'workspacePosition', schema: apiPosition }
  ]
})

const setElementLockApi = defineBasicApi({
  owner: 'element',
  method: 'setElementLock',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'lock', schema: apiBoolean }
  ]
})

const setElementVisibleApi = defineBasicApi({
  owner: 'element',
  method: 'setElementVisible',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'visible', schema: apiBoolean }
  ]
})

const toggleElementLockApi = defineBasicApi({
  owner: 'element',
  method: 'toggleElementLock',
  effect: 'write',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const toggleElementVisibleApi = defineBasicApi({
  owner: 'element',
  method: 'toggleElementVisible',
  effect: 'write',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const resetElementSizeApi = defineBasicApi({
  owner: 'element',
  method: 'resetElementSize',
  effect: 'write',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const changeElementGeometryApi = defineBasicApi({
  owner: 'element',
  method: 'changeElementGeometry',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'geometry', schema: elementGeometrySchema }
  ]
})

const setElementPositionsApi = defineBasicApi({
  owner: 'element',
  method: 'setElementPositions',
  effect: 'write',
  parameters: [
    {
      name: 'positionsById',
      schema: { type: 'object', additionalProperties: apiPosition }
    }
  ]
})

const updateElementPropertiesApi = defineBasicApi({
  owner: 'element',
  method: 'updateElementProperties',
  effect: 'write',
  parameters: [
    { name: 'elementIds', schema: apiIds },
    { name: 'values', schema: apiRecord }
  ]
})

const patchElementPropertiesApi = defineBasicApi({
  owner: 'element',
  method: 'patchElementProperties',
  effect: 'write',
  parameters: [
    {
      name: 'patches',
      schema: apiArray(
        apiObject(
          {
            elementId: apiString,
            values: apiRecord,
            records: apiArray(
              apiObject({ key: apiString, set: apiRecord, remove: apiIds }, [
                'key'
              ])
            )
          },
          ['elementId', 'records']
        )
      )
    }
  ]
})

const createElementApi = defineBasicApi({
  owner: 'element',
  method: 'createElement',
  effect: 'write',
  parameters: [{ name: 'createOptions', schema: elementCreationOptionsSchema }],
  description:
    'Use workspacePosition for deterministic placement. Registered component types are supported.'
})

const createElementsApi = defineBasicApi({
  owner: 'element',
  method: 'createElements',
  effect: 'write',
  parameters: [
    { name: 'createOptions', schema: apiArray(elementCreationOptionsSchema) }
  ]
})

const createElementsInParentApi = defineBasicApi({
  owner: 'element',
  method: 'createElementsInParent',
  effect: 'write',
  parameters: [
    {
      name: 'descriptors',
      schema: apiArray({
        ...apiObject(
          {
            id: apiString,
            name: apiString,
            type: apiString,
            x: apiNumber,
            y: apiNumber,
            width: apiNumber,
            height: apiNumber,
            props: apiRecord
          },
          ['id', 'name', 'props', 'type', 'x', 'y']
        ),
        additionalProperties: true
      })
    },
    { name: 'parentId', schema: apiString }
  ]
})

const createVectorElementApi = defineBasicApi({
  owner: 'element',
  method: 'createVectorElement',
  effect: 'write',
  parameters: [{ name: 'createOptions', schema: elementCreationOptionsSchema }],
  description:
    'Use existing vector topology or ordinary vector construction inputs.'
})

const createVectorElementsInParentApi = defineBasicApi({
  owner: 'element',
  method: 'createVectorElementsInParent',
  effect: 'write',
  parameters: [
    { name: 'createOptions', schema: apiArray(elementCreationOptionsSchema) },
    { name: 'parentId', schema: apiString }
  ]
})

const deleteElementApi = defineBasicApi({
  owner: 'element',
  method: 'deleteElement',
  effect: 'delete',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getWorkspaceIdApi = defineBasicApi({
  owner: 'hierarchy',
  method: 'getWorkspaceId',
  effect: 'read',
  parameters: []
})

const getFlattenedElementIdsApi = defineBasicApi({
  owner: 'hierarchy',
  method: 'getFlattenedElementIds',
  effect: 'read',
  parameters: []
})

const getElementDataMapApi = defineBasicApi({
  owner: 'hierarchy',
  method: 'getElementDataMap',
  effect: 'read',
  parameters: []
})

const groupElementsApi = defineBasicApi({
  owner: 'hierarchy',
  method: 'groupElements',
  effect: 'write',
  parameters: [{ name: 'elementIds', schema: apiIds }]
})

const ungroupElementApi = defineBasicApi({
  owner: 'hierarchy',
  method: 'ungroupElement',
  effect: 'write',
  parameters: [{ name: 'groupId', schema: apiString }]
})

const moveElementsApi = defineBasicApi({
  owner: 'hierarchy',
  method: 'moveElements',
  effect: 'write',
  parameters: [{ name: 'request', schema: elementMoveRequestSchema }],
  description: 'Preserves App group-geometry behavior.'
})

const removeSubtreeApi = defineBasicApi({
  owner: 'hierarchy',
  method: 'removeSubtree',
  effect: 'delete',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getSelectedIdsApi = defineBasicApi({
  owner: 'selection',
  method: 'getSelectedIds',
  effect: 'read',
  parameters: []
})

const getVectorPointSelectionIdsApi = defineBasicApi({
  owner: 'selection',
  method: 'getVectorPointSelectionIds',
  effect: 'read',
  parameters: []
})

const getVectorSegmentSelectionIdsApi = defineBasicApi({
  owner: 'selection',
  method: 'getVectorSegmentSelectionIds',
  effect: 'read',
  parameters: []
})

const getSelectedVectorPointsApi = defineBasicApi({
  owner: 'selection',
  method: 'getSelectedVectorPoints',
  effect: 'read',
  parameters: []
})

const getSelectedVectorSegmentsApi = defineBasicApi({
  owner: 'selection',
  method: 'getSelectedVectorSegments',
  effect: 'read',
  parameters: []
})

const clearSelectionApi = defineBasicApi({
  owner: 'selection',
  method: 'clearSelection',
  effect: 'selection',
  parameters: []
})

const clearVectorPointSelectionApi = defineBasicApi({
  owner: 'selection',
  method: 'clearVectorPointSelection',
  effect: 'selection',
  parameters: []
})

const clearVectorSegmentSelectionApi = defineBasicApi({
  owner: 'selection',
  method: 'clearVectorSegmentSelection',
  effect: 'selection',
  parameters: []
})

const toggleSelectionApi = defineBasicApi({
  owner: 'selection',
  method: 'toggleSelection',
  effect: 'selection',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const selectElementsApi = defineBasicApi({
  owner: 'selection',
  method: 'selectElements',
  effect: 'selection',
  parameters: [{ name: 'elementIds', schema: apiIds }]
})

const selectVectorPointsApi = defineBasicApi({
  owner: 'selection',
  method: 'selectVectorPoints',
  effect: 'selection',
  parameters: [{ name: 'pointIds', schema: apiIds }]
})

const selectVectorSegmentsApi = defineBasicApi({
  owner: 'selection',
  method: 'selectVectorSegments',
  effect: 'selection',
  parameters: [{ name: 'segmentIds', schema: apiIds }]
})

const selectVectorPointApi = defineBasicApi({
  owner: 'selection',
  method: 'selectVectorPoint',
  effect: 'selection',
  parameters: [
    {
      name: 'point',
      schema: apiObject({ elementId: apiString, pointId: apiString })
    }
  ]
})

const selectVectorSegmentApi = defineBasicApi({
  owner: 'selection',
  method: 'selectVectorSegment',
  effect: 'selection',
  parameters: [
    {
      name: 'segment',
      schema: apiObject({ elementId: apiString, segmentId: apiString })
    }
  ]
})

const getScaleApi = defineBasicApi({
  owner: 'viewport',
  method: 'getScale',
  effect: 'read',
  parameters: []
})

const getPositionApi = defineBasicApi({
  owner: 'viewport',
  method: 'getPosition',
  effect: 'read',
  parameters: []
})

const getCanvasPositionFromWorkspaceApi = defineBasicApi({
  owner: 'viewport',
  method: 'getCanvasPositionFromWorkspace',
  effect: 'read',
  parameters: [{ name: 'workspacePos', schema: apiPosition }]
})

const zoomFitApi = defineBasicApi({
  owner: 'viewport',
  method: 'zoomFit',
  effect: 'viewport',
  parameters: []
})

const zoomToCenterApi = defineBasicApi({
  owner: 'viewport',
  method: 'zoomToCenter',
  effect: 'viewport',
  parameters: [
    { name: 'scale', schema: { type: 'number', exclusiveMinimum: 0 } },
    { name: 'centerX', schema: apiNumber },
    { name: 'centerY', schema: apiNumber }
  ]
})

const panToApi = defineBasicApi({
  owner: 'viewport',
  method: 'panTo',
  effect: 'viewport',
  parameters: [
    { name: 'x', schema: apiNumber },
    { name: 'y', schema: apiNumber }
  ]
})

const addFillApi = defineBasicApi({
  owner: 'fill',
  method: 'addFill',
  effect: 'write',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const removeFillApi = defineBasicApi({
  owner: 'fill',
  method: 'removeFill',
  effect: 'delete',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString }
  ]
})

const getFillByIdApi = defineBasicApi({
  owner: 'fill',
  method: 'getFillById',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString }
  ]
})

const getPrimaryFillColorApi = defineBasicApi({
  owner: 'fill',
  method: 'getPrimaryFillColor',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const updatePrimaryFillColorApi = defineBasicApi({
  owner: 'fill',
  method: 'updatePrimaryFillColor',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'color', schema: apiString }
  ]
})

const updatePrimaryFillColorsApi = defineBasicApi({
  owner: 'fill',
  method: 'updatePrimaryFillColors',
  effect: 'write',
  parameters: [
    {
      name: 'updates',
      schema: apiArray(apiObject({ elementId: apiString, color: apiString }))
    }
  ]
})

const updateFillFieldsApi = defineBasicApi({
  owner: 'fill',
  method: 'updateFillFields',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString },
    { name: 'currentFill', schema: apiRecord },
    { name: 'patch', schema: apiRecord }
  ],
  description:
    'Read the current fill immediately before patching; preserve unrelated fields.'
})

const updateFillFieldApi = defineBasicApi({
  owner: 'fill',
  method: 'updateFillField',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString },
    { name: 'currentFill', schema: apiRecord },
    { name: 'key', schema: apiString },
    { name: 'value', schema: {} }
  ]
})

const getGradientHandleHitAtClientPosApi = defineBasicApi({
  owner: 'fill',
  method: 'getGradientHandleHitAtClientPos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString },
    { name: 'clientPos', schema: apiPosition },
    { name: 'hitRadius', schema: apiNumber, optional: true }
  ],
  description: ''
})

const getGradientStopHitAtClientPosApi = defineBasicApi({
  owner: 'fill',
  method: 'getGradientStopHitAtClientPos',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString },
    { name: 'clientPos', schema: apiPosition },
    { name: 'hitSize', schema: apiNumber, optional: true }
  ],
  description: ''
})

const getCanvasBoundsApi = defineBasicApi({
  owner: 'fill',
  method: 'getCanvasBounds',
  effect: 'read',
  parameters: []
})

const getCanvasPositionFromClientApi = defineBasicApi({
  owner: 'fill',
  method: 'getCanvasPositionFromClient',
  effect: 'read',
  parameters: [{ name: 'clientPos', schema: apiPosition }]
})

const getGradientHandleGeometryApi = defineBasicApi({
  owner: 'fill',
  method: 'getGradientHandleGeometry',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString }
  ]
})

const getNextGradientForHandleWithDeltaApi = defineBasicApi({
  owner: 'fill',
  method: 'getNextGradientForHandleWithDelta',
  effect: 'read',
  parameters: [
    { name: 'baseGradient', schema: apiRecord },
    { name: 'handleIndex', schema: { enum: [0, 1] } },
    { name: 'width', schema: apiNumber },
    { name: 'height', schema: apiNumber },
    { name: 'delta', schema: apiPosition }
  ]
})

const getNextGradientForHandleAtClientPositionApi = defineBasicApi({
  owner: 'fill',
  method: 'getNextGradientForHandleAtClientPosition',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString },
    { name: 'handleIndex', schema: { enum: [0, 1] } },
    { name: 'clientPos', schema: apiPosition }
  ]
})

const updateGradientHandleAtClientPositionApi = defineBasicApi({
  owner: 'fill',
  method: 'updateGradientHandleAtClientPosition',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString },
    { name: 'handleIndex', schema: { enum: [0, 1] } },
    { name: 'clientPos', schema: apiPosition }
  ]
})

const getNextGradientForHandleWithWorkspaceDeltaApi = defineBasicApi({
  owner: 'fill',
  method: 'getNextGradientForHandleWithWorkspaceDelta',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString },
    { name: 'handleIndex', schema: { enum: [0, 1] } },
    { name: 'baseGradient', schema: apiRecord },
    { name: 'delta', schema: apiPosition }
  ]
})

const updateGradientHandleWithWorkspaceDeltaApi = defineBasicApi({
  owner: 'fill',
  method: 'updateGradientHandleWithWorkspaceDelta',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString },
    { name: 'handleIndex', schema: { enum: [0, 1] } },
    { name: 'baseGradient', schema: apiRecord },
    { name: 'delta', schema: apiPosition }
  ]
})

const addStrokeApi = defineBasicApi({
  owner: 'stroke',
  method: 'addStroke',
  effect: 'write',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const removeStrokeApi = defineBasicApi({
  owner: 'stroke',
  method: 'removeStroke',
  effect: 'delete',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'strokeId', schema: apiString }
  ]
})

const getPrimaryStrokeColorApi = defineBasicApi({
  owner: 'stroke',
  method: 'getPrimaryStrokeColor',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const updatePrimaryStrokeColorApi = defineBasicApi({
  owner: 'stroke',
  method: 'updatePrimaryStrokeColor',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'color', schema: apiString }
  ]
})

const updatePrimaryStrokeColorsApi = defineBasicApi({
  owner: 'stroke',
  method: 'updatePrimaryStrokeColors',
  effect: 'write',
  parameters: [
    {
      name: 'updates',
      schema: apiArray(apiObject({ elementId: apiString, color: apiString }))
    }
  ]
})

const updateStrokeFieldsApi = defineBasicApi({
  owner: 'stroke',
  method: 'updateStrokeFields',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'strokeId', schema: apiString },
    { name: 'currentStroke', schema: apiRecord },
    { name: 'patch', schema: apiRecord }
  ],
  description:
    'Read the current stroke immediately before patching; uses existing vector-bounds repair.'
})

const updateStrokeFieldApi = defineBasicApi({
  owner: 'stroke',
  method: 'updateStrokeField',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'strokeId', schema: apiString },
    { name: 'currentStroke', schema: apiRecord },
    { name: 'key', schema: apiString },
    { name: 'value', schema: {} }
  ]
})

export const basicDesignApiContracts = [
  isContainerTypeApi,
  getElementTypeApi,
  isElementLockedApi,
  isElementVisibleApi,
  getElementBoundsApi,
  getElementClientBoundsApi,
  getElementPositionApi,
  getElementIdAtWorkspacePosApi,
  getElementIdAtClientPosApi,
  getRenderElementIdAtClientPosApi,
  getMousePosInWorkspaceApi,
  getElementIdsInBoundsApi,
  isPointInsideElementApi,
  getPositionInParentApi,
  setElementLockApi,
  setElementVisibleApi,
  toggleElementLockApi,
  toggleElementVisibleApi,
  resetElementSizeApi,
  changeElementGeometryApi,
  setElementPositionsApi,
  updateElementPropertiesApi,
  patchElementPropertiesApi,
  createElementApi,
  createElementsApi,
  createElementsInParentApi,
  createVectorElementApi,
  createVectorElementsInParentApi,
  deleteElementApi,
  getWorkspaceIdApi,
  getFlattenedElementIdsApi,
  getElementDataMapApi,
  groupElementsApi,
  ungroupElementApi,
  moveElementsApi,
  removeSubtreeApi,
  getSelectedIdsApi,
  getVectorPointSelectionIdsApi,
  getVectorSegmentSelectionIdsApi,
  getSelectedVectorPointsApi,
  getSelectedVectorSegmentsApi,
  clearSelectionApi,
  clearVectorPointSelectionApi,
  clearVectorSegmentSelectionApi,
  toggleSelectionApi,
  selectElementsApi,
  selectVectorPointsApi,
  selectVectorSegmentsApi,
  selectVectorPointApi,
  selectVectorSegmentApi,
  getScaleApi,
  getPositionApi,
  getCanvasPositionFromWorkspaceApi,
  zoomFitApi,
  zoomToCenterApi,
  panToApi,
  addFillApi,
  removeFillApi,
  getFillByIdApi,
  getPrimaryFillColorApi,
  updatePrimaryFillColorApi,
  updatePrimaryFillColorsApi,
  updateFillFieldsApi,
  updateFillFieldApi,
  getGradientHandleHitAtClientPosApi,
  getGradientStopHitAtClientPosApi,
  getCanvasBoundsApi,
  getCanvasPositionFromClientApi,
  getGradientHandleGeometryApi,
  getNextGradientForHandleWithDeltaApi,
  getNextGradientForHandleAtClientPositionApi,
  updateGradientHandleAtClientPositionApi,
  getNextGradientForHandleWithWorkspaceDeltaApi,
  updateGradientHandleWithWorkspaceDeltaApi,
  addStrokeApi,
  removeStrokeApi,
  getPrimaryStrokeColorApi,
  updatePrimaryStrokeColorApi,
  updatePrimaryStrokeColorsApi,
  updateStrokeFieldsApi,
  updateStrokeFieldApi
]
