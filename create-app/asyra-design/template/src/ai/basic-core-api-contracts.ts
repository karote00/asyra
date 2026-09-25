import {
  defineBasicApi as define,
  apiString as id,
  apiNumber as number,
  apiPosition as position,
  apiObject as object,
  apiArray as array,
  apiIds as ids,
  apiRecord as record
} from './basic-api-contracts'

const propertyUpdates = array(object({ elementId: id, values: record }))
const createData = {
  ...object(
    {
      type: id,
      name: id,
      x: number,
      y: number,
      width: number,
      height: number,
      props: record
    },
    ['type', 'x', 'y']
  ),
  additionalProperties: true
}
export const basicCoreApiContracts = [
  ...[
    'getCurrentWorkspaceId',
    'getCanonicalElementCount',
    'getAllElementsBounds',
    'getViewportPosition',
    'getViewportScale',
    'getSelectedElementIds',
    'getUndoHistoryDepth',
    'getRegistrations',
    'getRegistrationRelations',
    'getProjectedElementCount',
    'renderIsReady',
    'hasRenderEngineProvider',
    'isCompositionOpen',
    'getRuntimeState'
  ].map((method) => define('core', method, 'read')),
  define(
    'core',
    'getElementData',
    'read',
    { elementId: id },
    'Returns detached canonical element data; property references are not resolved geometry.'
  ),
  define(
    'core',
    'getElementComputedData',
    'read',
    { elementId: id, fields: ids },
    'Read only requested fields when possible; includes computed properties.',
    ['fields']
  ),
  define(
    'core',
    'getAllElementData',
    'read',
    {},
    'Full document read. Prefer getElementData/getElementComputedData for known IDs to avoid resending unchanged data.'
  ),
  define(
    'core',
    'getCanonicalOwnerSnapshot',
    'read',
    {},
    'Full canonical owner snapshot; prefer scoped reads for ordinary edits.'
  ),
  define('core', 'getSystemContextSnapshot', 'read'),
  define(
    'core',
    'isContainerType',
    'read',
    { type: id },
    'Uses registered capabilities, including custom container types.'
  ),
  define('core', 'hasProjectedElement', 'read', { elementId: id }),
  define('core', 'getElementIdAtClientPos', 'read', { clientPos: position }),
  define('core', 'getMousePosInWorkspace', 'read', {
    mousePos: object({ clientX: number, clientY: number })
  }),
  define('core', 'workspaceToCanvas', 'read', { workspacePosition: position }),
  define('core', 'workspaceToElementLocal', 'read', {
    elementId: id,
    workspacePosition: position
  }),
  define('core', 'elementLocalToWorkspace', 'read', {
    elementId: id,
    localPosition: position
  }),
  define('core', 'elementSourceToWorkspace', 'read', {
    elementId: id,
    sourcePosition: position
  }),
  define('core', 'workspaceToElementSource', 'read', {
    elementId: id,
    workspacePosition: position
  }),
  define(
    'core',
    'getUIProperty',
    'read',
    { key: id },
    'Read a registered UI property value, not its observable.'
  ),
  define('core', 'getSystemProperty', 'read', { key: id }),
  define('core', 'hasSystemProperty', 'read', { key: id }),
  define('core', 'getComponentPropertyRelations', 'read', {
    componentType: id
  }),
  define('core', 'getPropertyChildRelations', 'read', {
    parentPropertyType: id
  }),
  define(
    'core',
    'createElementInParent',
    'write',
    { data: createData, parentId: id, index: { type: 'integer' } },
    'Creates one element through the public Core owner. Use plural creation for a ready batch.',
    ['index']
  ),
  define(
    'core',
    'createElementsInParent',
    'write',
    { data: array(createData), parentId: id, index: { type: 'integer' } },
    'Creates the supplied batch in order; returns stable IDs.',
    ['index']
  ),
  define(
    'core',
    'updateElementProperties',
    'write',
    { updates: propertyUpdates },
    'Plural canonical property updates. Use App vector APIs for anchor/handle editing so coordinate and geometry invariants are preserved.'
  ),
  define(
    'core',
    'patchElementProperties',
    'write',
    {
      patches: array(
        object(
          {
            elementId: id,
            values: record,
            records: array(
              object({ key: id, set: record, remove: ids }, ['key'])
            )
          },
          ['elementId', 'records']
        )
      )
    },
    'Patch canonical property records without replacing unrelated records.'
  ),
  define('core', 'updatePropertyComponents', 'write', {
    updates: array(object({ propertyId: id, values: record }))
  }),
  define(
    'core',
    'updateElementData',
    'write',
    {
      elementId: id,
      values: object(
        { name: id, visible: { type: 'boolean' }, lock: { type: 'boolean' } },
        []
      )
    },
    'Update canonical element fields; property values belong to updateElementProperties.'
  ),
  define(
    'core',
    'removeSubtree',
    'delete',
    { elementId: id },
    'Deletes the selected subtree through the canonical owner.'
  ),
  define('core', 'selectElements', 'selection', { elementIds: ids }),
  define(
    'core',
    'selectVectorPoints',
    'selection',
    { pointIds: ids },
    'Uses canonical encoded vector-point selection IDs; use App selection helpers when starting from element/point pairs.'
  ),
  define('core', 'selectVectorSegments', 'selection', { segmentIds: ids }),
  define('core', 'selectByChannel', 'selection', { channel: id, ids }),
  ...['save', 'propsSaveData', 'sceneTreeSaveData', 'getCanvasBounds'].map(
    (method) => define('core', method, 'read')
  ),
  define('core', 'measureElementContentBounds', 'read', { elementIds: ids }),
  define('core', 'getRegistration', 'read', {
    ref: object({ kind: id, key: id })
  }),
  define('core', 'hasSharedDataChannel', 'read', { name: id }),
  define(
    'core',
    'moveElements',
    'write',
    {
      request: object({
        elementIds: ids,
        targetParentId: id,
        targetIndex: { type: 'integer' }
      })
    },
    'Prefer hierarchy.moveElements in this app to maintain automatic group bounds.'
  )
]
