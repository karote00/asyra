import {
  defineBasicApi,
  apiString,
  apiNumber,
  apiPosition,
  apiObject,
  apiArray,
  apiIds,
  apiRecord
} from './basic-api-contracts'

const elementPropertyUpdatesSchema = apiArray(
  apiObject({ elementId: apiString, values: apiRecord })
)

const elementCreationDataSchema = {
  ...apiObject(
    {
      type: apiString,
      name: apiString,
      x: apiNumber,
      y: apiNumber,
      width: apiNumber,
      height: apiNumber,
      props: apiRecord
    },
    ['type', 'x', 'y']
  ),
  additionalProperties: true
}

const getCurrentWorkspaceIdApi = defineBasicApi({
  owner: 'core',
  method: 'getCurrentWorkspaceId',
  effect: 'read',
  parameters: []
})

const getCanonicalElementCountApi = defineBasicApi({
  owner: 'core',
  method: 'getCanonicalElementCount',
  effect: 'read',
  parameters: []
})

const getAllElementsBoundsApi = defineBasicApi({
  owner: 'core',
  method: 'getAllElementsBounds',
  effect: 'read',
  parameters: []
})

const getViewportPositionApi = defineBasicApi({
  owner: 'core',
  method: 'getViewportPosition',
  effect: 'read',
  parameters: []
})

const getViewportScaleApi = defineBasicApi({
  owner: 'core',
  method: 'getViewportScale',
  effect: 'read',
  parameters: []
})

const getSelectedElementIdsApi = defineBasicApi({
  owner: 'core',
  method: 'getSelectedElementIds',
  effect: 'read',
  parameters: []
})

const getUndoHistoryDepthApi = defineBasicApi({
  owner: 'core',
  method: 'getUndoHistoryDepth',
  effect: 'read',
  parameters: []
})

const getRegistrationsApi = defineBasicApi({
  owner: 'core',
  method: 'getRegistrations',
  effect: 'read',
  parameters: []
})

const getRegistrationRelationsApi = defineBasicApi({
  owner: 'core',
  method: 'getRegistrationRelations',
  effect: 'read',
  parameters: []
})

const getProjectedElementCountApi = defineBasicApi({
  owner: 'core',
  method: 'getProjectedElementCount',
  effect: 'read',
  parameters: []
})

const renderIsReadyApi = defineBasicApi({
  owner: 'core',
  method: 'renderIsReady',
  effect: 'read',
  parameters: []
})

const hasRenderEngineProviderApi = defineBasicApi({
  owner: 'core',
  method: 'hasRenderEngineProvider',
  effect: 'read',
  parameters: []
})

const isCompositionOpenApi = defineBasicApi({
  owner: 'core',
  method: 'isCompositionOpen',
  effect: 'read',
  parameters: []
})

const getRuntimeStateApi = defineBasicApi({
  owner: 'core',
  method: 'getRuntimeState',
  effect: 'read',
  parameters: []
})

const getElementDataApi = defineBasicApi({
  owner: 'core',
  method: 'getElementData',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }],
  description:
    'Returns detached canonical element data; property references are not resolved geometry.'
})

const getElementComputedDataApi = defineBasicApi({
  owner: 'core',
  method: 'getElementComputedData',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fields', schema: apiIds, optional: true }
  ],
  description:
    'Read only requested fields when possible; includes computed properties.'
})

const getAllElementDataApi = defineBasicApi({
  owner: 'core',
  method: 'getAllElementData',
  effect: 'read',
  parameters: [],
  description:
    'Full document read. Prefer getElementData/getElementComputedData for known IDs to avoid resending unchanged data.'
})

const getCanonicalOwnerSnapshotApi = defineBasicApi({
  owner: 'core',
  method: 'getCanonicalOwnerSnapshot',
  effect: 'read',
  parameters: [],
  description:
    'Full canonical owner snapshot; prefer scoped reads for ordinary edits.'
})

const getSystemContextSnapshotApi = defineBasicApi({
  owner: 'core',
  method: 'getSystemContextSnapshot',
  effect: 'read',
  parameters: []
})

const isContainerTypeApi = defineBasicApi({
  owner: 'core',
  method: 'isContainerType',
  effect: 'read',
  parameters: [{ name: 'type', schema: apiString }],
  description: 'Uses registered capabilities, including custom container types.'
})

const hasProjectedElementApi = defineBasicApi({
  owner: 'core',
  method: 'hasProjectedElement',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getElementIdAtClientPosApi = defineBasicApi({
  owner: 'core',
  method: 'getElementIdAtClientPos',
  effect: 'read',
  parameters: [{ name: 'clientPos', schema: apiPosition }]
})

const getMousePosInWorkspaceApi = defineBasicApi({
  owner: 'core',
  method: 'getMousePosInWorkspace',
  effect: 'read',
  parameters: [
    {
      name: 'mousePos',
      schema: apiObject({ clientX: apiNumber, clientY: apiNumber })
    }
  ]
})

const workspaceToCanvasApi = defineBasicApi({
  owner: 'core',
  method: 'workspaceToCanvas',
  effect: 'read',
  parameters: [{ name: 'workspacePosition', schema: apiPosition }]
})

const workspaceToElementLocalApi = defineBasicApi({
  owner: 'core',
  method: 'workspaceToElementLocal',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'workspacePosition', schema: apiPosition }
  ]
})

const elementLocalToWorkspaceApi = defineBasicApi({
  owner: 'core',
  method: 'elementLocalToWorkspace',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'localPosition', schema: apiPosition }
  ]
})

const elementSourceToWorkspaceApi = defineBasicApi({
  owner: 'core',
  method: 'elementSourceToWorkspace',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'sourcePosition', schema: apiPosition }
  ]
})

const workspaceToElementSourceApi = defineBasicApi({
  owner: 'core',
  method: 'workspaceToElementSource',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'workspacePosition', schema: apiPosition }
  ]
})

const getUIPropertyApi = defineBasicApi({
  owner: 'core',
  method: 'getUIProperty',
  effect: 'read',
  parameters: [{ name: 'key', schema: apiString }],
  description: 'Read a registered UI property value, not its observable.'
})

const getSystemPropertyApi = defineBasicApi({
  owner: 'core',
  method: 'getSystemProperty',
  effect: 'read',
  parameters: [{ name: 'key', schema: apiString }]
})

const hasSystemPropertyApi = defineBasicApi({
  owner: 'core',
  method: 'hasSystemProperty',
  effect: 'read',
  parameters: [{ name: 'key', schema: apiString }]
})

const getComponentPropertyRelationsApi = defineBasicApi({
  owner: 'core',
  method: 'getComponentPropertyRelations',
  effect: 'read',
  parameters: [{ name: 'componentType', schema: apiString }]
})

const getPropertyChildRelationsApi = defineBasicApi({
  owner: 'core',
  method: 'getPropertyChildRelations',
  effect: 'read',
  parameters: [{ name: 'parentPropertyType', schema: apiString }]
})

const createElementInParentApi = defineBasicApi({
  owner: 'core',
  method: 'createElementInParent',
  effect: 'write',
  parameters: [
    { name: 'data', schema: elementCreationDataSchema },
    { name: 'parentId', schema: apiString },
    { name: 'index', schema: { type: 'integer' }, optional: true }
  ],
  description:
    'Creates one element through the public Core owner. Use plural creation for a ready batch.'
})

const createElementsInParentApi = defineBasicApi({
  owner: 'core',
  method: 'createElementsInParent',
  effect: 'write',
  parameters: [
    { name: 'data', schema: apiArray(elementCreationDataSchema) },
    { name: 'parentId', schema: apiString },
    { name: 'index', schema: { type: 'integer' }, optional: true }
  ],
  description: 'Creates the supplied batch in order; returns stable IDs.'
})

const updateElementPropertiesApi = defineBasicApi({
  owner: 'core',
  method: 'updateElementProperties',
  effect: 'write',
  parameters: [{ name: 'updates', schema: elementPropertyUpdatesSchema }],
  description:
    'Plural canonical property updates. Use App vector APIs for anchor/handle editing so coordinate and geometry invariants are preserved.'
})

const patchElementPropertiesApi = defineBasicApi({
  owner: 'core',
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
  ],
  description:
    'Patch canonical property records without replacing unrelated records.'
})

const updatePropertyComponentsApi = defineBasicApi({
  owner: 'core',
  method: 'updatePropertyComponents',
  effect: 'write',
  parameters: [
    {
      name: 'updates',
      schema: apiArray(apiObject({ propertyId: apiString, values: apiRecord }))
    }
  ]
})

const updateElementDataApi = defineBasicApi({
  owner: 'core',
  method: 'updateElementData',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    {
      name: 'values',
      schema: apiObject(
        {
          name: apiString,
          visible: { type: 'boolean' },
          lock: { type: 'boolean' }
        },
        []
      )
    }
  ],
  description:
    'Update canonical element fields; property values belong to updateElementProperties.'
})

const removeSubtreeApi = defineBasicApi({
  owner: 'core',
  method: 'removeSubtree',
  effect: 'delete',
  parameters: [{ name: 'elementId', schema: apiString }],
  description: 'Deletes the selected subtree through the canonical owner.'
})

const selectElementsApi = defineBasicApi({
  owner: 'core',
  method: 'selectElements',
  effect: 'selection',
  parameters: [{ name: 'elementIds', schema: apiIds }]
})

const selectVectorPointsApi = defineBasicApi({
  owner: 'core',
  method: 'selectVectorPoints',
  effect: 'selection',
  parameters: [{ name: 'pointIds', schema: apiIds }],
  description:
    'Uses canonical encoded vector-point selection IDs; use App selection helpers when starting from element/point pairs.'
})

const selectVectorSegmentsApi = defineBasicApi({
  owner: 'core',
  method: 'selectVectorSegments',
  effect: 'selection',
  parameters: [{ name: 'segmentIds', schema: apiIds }]
})

const selectByChannelApi = defineBasicApi({
  owner: 'core',
  method: 'selectByChannel',
  effect: 'selection',
  parameters: [
    { name: 'channel', schema: apiString },
    { name: 'ids', schema: apiIds }
  ]
})

const saveApi = defineBasicApi({
  owner: 'core',
  method: 'save',
  effect: 'read',
  parameters: []
})

const propsSaveDataApi = defineBasicApi({
  owner: 'core',
  method: 'propsSaveData',
  effect: 'read',
  parameters: []
})

const sceneTreeSaveDataApi = defineBasicApi({
  owner: 'core',
  method: 'sceneTreeSaveData',
  effect: 'read',
  parameters: []
})

const getCanvasBoundsApi = defineBasicApi({
  owner: 'core',
  method: 'getCanvasBounds',
  effect: 'read',
  parameters: []
})

const measureElementContentBoundsApi = defineBasicApi({
  owner: 'core',
  method: 'measureElementContentBounds',
  effect: 'read',
  parameters: [{ name: 'elementIds', schema: apiIds }]
})

const getRegistrationApi = defineBasicApi({
  owner: 'core',
  method: 'getRegistration',
  effect: 'read',
  parameters: [
    { name: 'ref', schema: apiObject({ kind: apiString, key: apiString }) }
  ]
})

const hasSharedDataChannelApi = defineBasicApi({
  owner: 'core',
  method: 'hasSharedDataChannel',
  effect: 'read',
  parameters: [{ name: 'name', schema: apiString }]
})

const moveElementsApi = defineBasicApi({
  owner: 'core',
  method: 'moveElements',
  effect: 'write',
  parameters: [
    {
      name: 'request',
      schema: apiObject({
        elementIds: apiIds,
        targetParentId: apiString,
        targetIndex: { type: 'integer' }
      })
    }
  ],
  description:
    'Prefer hierarchy.moveElements in this app to maintain automatic group bounds.'
})

export const basicCoreApiContracts = [
  getCurrentWorkspaceIdApi,
  getCanonicalElementCountApi,
  getAllElementsBoundsApi,
  getViewportPositionApi,
  getViewportScaleApi,
  getSelectedElementIdsApi,
  getUndoHistoryDepthApi,
  getRegistrationsApi,
  getRegistrationRelationsApi,
  getProjectedElementCountApi,
  renderIsReadyApi,
  hasRenderEngineProviderApi,
  isCompositionOpenApi,
  getRuntimeStateApi,
  getElementDataApi,
  getElementComputedDataApi,
  getAllElementDataApi,
  getCanonicalOwnerSnapshotApi,
  getSystemContextSnapshotApi,
  isContainerTypeApi,
  hasProjectedElementApi,
  getElementIdAtClientPosApi,
  getMousePosInWorkspaceApi,
  workspaceToCanvasApi,
  workspaceToElementLocalApi,
  elementLocalToWorkspaceApi,
  elementSourceToWorkspaceApi,
  workspaceToElementSourceApi,
  getUIPropertyApi,
  getSystemPropertyApi,
  hasSystemPropertyApi,
  getComponentPropertyRelationsApi,
  getPropertyChildRelationsApi,
  createElementInParentApi,
  createElementsInParentApi,
  updateElementPropertiesApi,
  patchElementPropertiesApi,
  updatePropertyComponentsApi,
  updateElementDataApi,
  removeSubtreeApi,
  selectElementsApi,
  selectVectorPointsApi,
  selectVectorSegmentsApi,
  selectByChannelApi,
  saveApi,
  propsSaveDataApi,
  sceneTreeSaveDataApi,
  getCanvasBoundsApi,
  measureElementContentBoundsApi,
  getRegistrationApi,
  hasSharedDataChannelApi,
  moveElementsApi
]
