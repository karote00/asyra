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
  description:
    'Read the canonical current workspace identity without serializing the document.',
  owner: 'core',
  method: 'getCurrentWorkspaceId',
  effect: 'read',
  parameters: []
})

const getCanonicalElementCountApi = defineBasicApi({
  description:
    'Read the canonical element count for document diagnostics; does not enumerate element data.',
  owner: 'core',
  method: 'getCanonicalElementCount',
  effect: 'read',
  parameters: []
})

const getAllElementsBoundsApi = defineBasicApi({
  description:
    'Read overall element bounds; use for explicit framing or scope checks, not automatic navigation.',
  owner: 'core',
  method: 'getAllElementsBounds',
  effect: 'read',
  parameters: []
})

const getViewportPositionApi = defineBasicApi({
  description: 'Read the canonical viewport translation.',
  owner: 'core',
  method: 'getViewportPosition',
  effect: 'read',
  parameters: []
})

const getViewportScaleApi = defineBasicApi({
  description: 'Read the canonical viewport zoom scale.',
  owner: 'core',
  method: 'getViewportScale',
  effect: 'read',
  parameters: []
})

const getSelectedElementIdsApi = defineBasicApi({
  description: 'Read canonical element selection identities.',
  owner: 'core',
  method: 'getSelectedElementIds',
  effect: 'read',
  parameters: []
})

const getUndoHistoryDepthApi = defineBasicApi({
  description:
    'Read the Undo stack depth for diagnostics; does not change history.',
  owner: 'core',
  method: 'getUndoHistoryDepth',
  effect: 'read',
  parameters: []
})

const getRegistrationsApi = defineBasicApi({
  description:
    'Inspect registered framework definitions when the required capability is unknown; prefer getRegistration for one known definition.',
  owner: 'core',
  method: 'getRegistrations',
  effect: 'read',
  parameters: []
})

const getRegistrationRelationsApi = defineBasicApi({
  description:
    'Inspect registered component/property relationships; does not inspect document instances.',
  owner: 'core',
  method: 'getRegistrationRelations',
  effect: 'read',
  parameters: []
})

const getProjectedElementCountApi = defineBasicApi({
  description:
    'Read the render projection count for diagnostics; this is not the canonical element count.',
  owner: 'core',
  method: 'getProjectedElementCount',
  effect: 'read',
  parameters: []
})

const hasRenderEngineProviderApi = defineBasicApi({
  description:
    'Check whether a render engine provider is registered; this is a host diagnostic.',
  owner: 'core',
  method: 'hasRenderEngineProvider',
  effect: 'read',
  parameters: []
})

const isCompositionOpenApi = defineBasicApi({
  description:
    'Check framework composition lifecycle state; this does not indicate drawing completion.',
  owner: 'core',
  method: 'isCompositionOpen',
  effect: 'read',
  parameters: []
})

const getRuntimeStateApi = defineBasicApi({
  description:
    'Read framework runtime diagnostics; use narrow document reads for editing.',
  owner: 'core',
  method: 'getRuntimeState',
  effect: 'read',
  parameters: []
})

const getElementMetadataApi = defineBasicApi({
  owner: 'core',
  method: 'getElementMetadata',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }],
  description:
    'Read canonical identity, name, type, parent, visibility, lock and childCount without copying property data or children. Prefer read_design_context for multiple IDs.'
})

const getElementChildrenApi = defineBasicApi({
  owner: 'core',
  method: 'getElementChildren',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'offset', schema: { type: 'integer', minimum: 0 }, optional: true },
    { name: 'limit', schema: { type: 'integer', minimum: 1 }, optional: true }
  ],
  description:
    'Read a page of current direct child IDs with total and nextOffset; defaults to offset 0 and limit 50. Restart paging after hierarchy changes. For before/after placement use hierarchy.moveElementsRelative without reading siblings.'
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
    'Read only requested fields when possible. This is a computed projection, not a canonical write payload: linked records such as fills/strokes are expanded objects. Keep their IDs and use patchElementProperties records to edit them; do not write expanded records back through updateElementProperties.'
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
  description:
    'Read interaction system context; this is not canonical element data.',
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
  description:
    'Check whether an element has a render projection; canonical existence is a separate question.',
  owner: 'core',
  method: 'hasProjectedElement',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getElementIdAtClientPosApi = defineBasicApi({
  description:
    'Hit-test the projection at browser client coordinates; returns the hit identity.',
  owner: 'core',
  method: 'getElementIdAtClientPos',
  effect: 'read',
  parameters: [{ name: 'clientPos', schema: apiPosition }]
})

const getMousePosInWorkspaceApi = defineBasicApi({
  description:
    'Convert browser pointer coordinates into workspace coordinates.',
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
  description:
    'Convert workspace coordinates into canvas coordinates using the current viewport.',
  owner: 'core',
  method: 'workspaceToCanvas',
  effect: 'read',
  parameters: [{ name: 'workspacePosition', schema: apiPosition }]
})

const workspaceToElementLocalApi = defineBasicApi({
  description:
    'Convert a workspace position into a known element local coordinate space; returns null if the transform is unavailable.',
  owner: 'core',
  method: 'workspaceToElementLocal',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'workspacePosition', schema: apiPosition }
  ]
})

const elementLocalToWorkspaceApi = defineBasicApi({
  description:
    'Convert a known element local position into workspace coordinates; returns null if unavailable.',
  owner: 'core',
  method: 'elementLocalToWorkspace',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'localPosition', schema: apiPosition }
  ]
})

const elementSourceToWorkspaceApi = defineBasicApi({
  description:
    'Convert source geometry coordinates to workspace coordinates; do not confuse source with local coordinates.',
  owner: 'core',
  method: 'elementSourceToWorkspace',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'sourcePosition', schema: apiPosition }
  ]
})

const workspaceToElementSourceApi = defineBasicApi({
  description:
    'Convert workspace coordinates into source geometry coordinates for existing vector edits.',
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
  description:
    'Read a known registered system-property value; does not subscribe or modify it.',
  owner: 'core',
  method: 'getSystemProperty',
  effect: 'read',
  parameters: [{ name: 'key', schema: apiString }]
})

const hasSystemPropertyApi = defineBasicApi({
  description:
    'Check whether a system property is registered before reading an unknown key.',
  owner: 'core',
  method: 'hasSystemProperty',
  effect: 'read',
  parameters: [{ name: 'key', schema: apiString }]
})

const getComponentPropertyRelationsApi = defineBasicApi({
  description:
    'Read the property relationships registered for a component type, not a document instance.',
  owner: 'core',
  method: 'getComponentPropertyRelations',
  effect: 'read',
  parameters: [{ name: 'componentType', schema: apiString }]
})

const getPropertyChildRelationsApi = defineBasicApi({
  description:
    'Read registered child-property relationships for a property type.',
  owner: 'core',
  method: 'getPropertyChildRelations',
  effect: 'read',
  parameters: [{ name: 'parentPropertyType', schema: apiString }]
})

const createElementsInParentApi = defineBasicApi({
  owner: 'core',
  method: 'createElementsInParent',
  resultKind: 'created-items',
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
    'Plural canonical property value updates. Relationship lists such as fills/strokes contain reference IDs, not expanded computed objects. To edit linked records, use patchElementProperties records (one plural call for all targets), or the App fill/stroke APIs. Use App vector APIs for anchor/handle editing so coordinate and geometry invariants are preserved.'
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
          ['elementId']
        )
      )
    }
  ],
  description:
    'Plural patches of canonical property records without replacing unrelated records or relationship IDs. For fill changes use patches:[{elementId,records:[{key:"fills",set:{[fillId]:{color,gradient}}}]} with only the fields being changed; Reuse known fillId; if unknown, obtain it from getElementComputedData fields:["fills"]. Combine all ready targets into one patches array. Likewise use the registered property key and record IDs for other linked records.'
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
  ],
  description:
    'Plural updates of existing canonical property components by propertyId (not elementId). Use current component IDs; preserve relationship reference lists and patch linked records with patchElementProperties rather than copying computed projections.'
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
  resultKind: 'removed',
  effect: 'delete',
  parameters: [{ name: 'elementId', schema: apiString }],
  description: 'Deletes the selected subtree through the canonical owner.'
})

const selectByChannelApi = defineBasicApi({
  description:
    'Replace IDs in a registered selection channel; use typed selection operations for ordinary element or vector selection.',
  owner: 'core',
  method: 'selectByChannel',
  effect: 'selection',
  parameters: [
    { name: 'channel', schema: apiString },
    { name: 'ids', schema: apiIds }
  ]
})

const saveApi = defineBasicApi({
  description:
    'Produce the document save payload; use only when a full document export is needed, not to recover known IDs.',
  owner: 'core',
  method: 'save',
  effect: 'read',
  parameters: []
})

const propsSaveDataApi = defineBasicApi({
  description:
    'Serialize canonical property data for export or diagnostics; prefer narrow reads for editing.',
  owner: 'core',
  method: 'propsSaveData',
  effect: 'read',
  parameters: []
})

const sceneTreeSaveDataApi = defineBasicApi({
  description:
    'Serialize canonical hierarchy data for export or diagnostics; do not repeatedly fetch it to recover known IDs.',
  owner: 'core',
  method: 'sceneTreeSaveData',
  effect: 'read',
  parameters: []
})

const getCanvasBoundsApi = defineBasicApi({
  description:
    'Read browser canvas bounds for coordinate conversion; may be unavailable before rendering starts.',
  owner: 'core',
  method: 'getCanvasBounds',
  effect: 'read',
  parameters: []
})

const measureElementContentBoundsApi = defineBasicApi({
  description:
    'Measure content bounds for the supplied element IDs together; returns per-element measurements.',
  owner: 'core',
  method: 'measureElementContentBounds',
  effect: 'read',
  parameters: [{ name: 'elementIds', schema: apiIds }]
})

const getRegistrationApi = defineBasicApi({
  description:
    'Read one known framework registration; prefer this to enumerating all registrations.',
  owner: 'core',
  method: 'getRegistration',
  effect: 'read',
  parameters: [
    { name: 'ref', schema: apiObject({ kind: apiString, key: apiString }) }
  ]
})

const hasSharedDataChannelApi = defineBasicApi({
  description:
    'Check whether a named shared publication channel is registered; does not inspect document edits.',
  owner: 'core',
  method: 'hasSharedDataChannel',
  effect: 'read',
  parameters: [{ name: 'name', schema: apiString }]
})

const moveElementsApi = defineBasicApi({
  owner: 'core',
  method: 'moveElements',
  resultKind: 'moves',
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
  hasRenderEngineProviderApi,
  isCompositionOpenApi,
  getRuntimeStateApi,
  getElementDataApi,
  getElementMetadataApi,
  getElementChildrenApi,
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
  createElementsInParentApi,
  updateElementPropertiesApi,
  patchElementPropertiesApi,
  updatePropertyComponentsApi,
  updateElementDataApi,
  removeSubtreeApi,
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
