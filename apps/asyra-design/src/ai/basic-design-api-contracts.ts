import {
  FillColorFormats,
  FillKinds,
  StrokeStyles,
  StrokePositions,
  StrokeJoinTypes,
  StrokeCapTypes
} from '@asyra/utils'
import { VECTOR_TOKENS } from '@asyra/core'
import { type FillWritableKey } from '../constants/fills'
import { STROKE_PATCH_KEYS } from '../constants/strokes'
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
  targetIndex: { type: 'integer', minimum: 0 }
})

const getElementTypeApi = defineBasicApi({
  description:
    'Read the registered component type of a known element, not its container capability.',
  owner: 'element',
  method: 'getElementType',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const isElementLockedApi = defineBasicApi({
  description:
    'Read whether an element is locked; do not use as an existence check.',
  owner: 'element',
  method: 'isElementLocked',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const isElementVisibleApi = defineBasicApi({
  description:
    'Read the visibility flag, defaulting to visible; does not prove the element exists.',
  owner: 'element',
  method: 'isElementVisible',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getElementBoundsApi = defineBasicApi({
  description:
    'Read computed x, y, width and height; returns null if bounds are unavailable.',
  owner: 'element',
  method: 'getElementBounds',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getElementClientBoundsApi = defineBasicApi({
  description:
    'Read transformed bounds in browser client coordinates, including the canvas offset; returns null if unavailable.',
  owner: 'element',
  method: 'getElementClientBounds',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getElementPositionApi = defineBasicApi({
  description:
    'Read computed x and y for a known element; returns null when unavailable.',
  owner: 'element',
  method: 'getElementPosition',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getElementIdAtWorkspacePosApi = defineBasicApi({
  description:
    'Hit-test an element at workspace coordinates; returns an identity or null.',
  owner: 'element',
  method: 'getElementIdAtWorkspacePos',
  effect: 'read',
  parameters: [{ name: 'workspacePos', schema: apiPosition }]
})

const getElementIdAtClientPosApi = defineBasicApi({
  description:
    'Hit-test at browser client coordinates; uses current viewport conversion.',
  owner: 'element',
  method: 'getElementIdAtClientPos',
  effect: 'read',
  parameters: [{ name: 'clientPos', schema: apiPosition }]
})

const getRenderElementIdAtClientPosApi = defineBasicApi({
  description:
    'Hit-test the render projection at browser client coordinates; projection identity is not canonical document data.',
  owner: 'element',
  method: 'getRenderElementIdAtClientPos',
  effect: 'read',
  parameters: [{ name: 'clientPos', schema: apiPosition }]
})

const getMousePosInWorkspaceApi = defineBasicApi({
  description:
    'Convert a browser client position to workspace coordinates using the current viewport.',
  owner: 'element',
  method: 'getMousePosInWorkspace',
  effect: 'read',
  parameters: [{ name: 'clientPos', schema: apiPosition }]
})

const getElementIdsInBoundsApi = defineBasicApi({
  description:
    'Find visible workspace elements intersecting bounds; returns ordered identities.',
  owner: 'element',
  method: 'getElementIdsInBounds',
  effect: 'read',
  parameters: [{ name: 'bounds', schema: elementBoundsSchema }]
})

const isPointInsideElementApi = defineBasicApi({
  description:
    'Test a point against computed element bounds; returns a boolean, not a detailed path hit.',
  owner: 'element',
  method: 'isPointInsideElement',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'point', schema: apiPosition }
  ]
})

const getPositionInParentApi = defineBasicApi({
  description:
    'Convert a workspace position into the current Workspace or Group parent coordinates; returns null for unsupported parents. Core workspaceToElementLocal handles general element transforms.',
  owner: 'element',
  method: 'getPositionInParent',
  effect: 'read',
  parameters: [
    { name: 'parentId', schema: apiString },
    { name: 'workspacePosition', schema: apiPosition }
  ]
})

const setElementLockApi = defineBasicApi({
  description:
    'Set the desired lock state for a known element; false means unchanged or an invalid target.',
  owner: 'element',
  method: 'setElementLock',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'lock', schema: apiBoolean }
  ]
})

const setElementsVisibleApi = defineBasicApi({
  description:
    'Set visibility on all supplied elements in one canonical batch. Returns ordered changed/unchanged/unavailable statuses and reviewElementIds for confirmed available targets. Review scope is not visual acceptance. Use elementIds target references; no per-element action expansion.',
  owner: 'element',
  method: 'setElementsVisible',
  effect: 'write',
  resultKind: 'status-items',
  parameters: [
    { name: 'elementIds', schema: apiIds },
    { name: 'visible', schema: apiBoolean }
  ]
})

const toggleElementLockApi = defineBasicApi({
  description:
    'Invert the current lock state at the canonical owner; use setElementLock when the desired state is known.',
  owner: 'element',
  method: 'toggleElementLock',
  effect: 'write',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const toggleElementVisibleApi = defineBasicApi({
  description:
    'Invert current visibility at the canonical owner; use setElementsVisible when the desired state is known.',
  owner: 'element',
  method: 'toggleElementVisible',
  effect: 'write',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const resetElementSizeApi = defineBasicApi({
  description:
    'Reset an element to the App default size; use changeElementGeometry for explicit dimensions.',
  owner: 'element',
  method: 'resetElementSize',
  effect: 'write',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const changeElementGeometryApi = defineBasicApi({
  description:
    'Apply supplied new geometry fields through App normalization; omitted fields stay unchanged.',
  owner: 'element',
  method: 'changeElementGeometry',
  effect: 'write',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'geometry', schema: elementGeometrySchema }
  ]
})

const setElementPositionsApi = defineBasicApi({
  description:
    'Apply per-element new positions keyed by element ID in one transaction; App group geometry is normalized.',
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
  description:
    'Apply the same new property values to elementIds through App normalization; use patchElementProperties for independent fields or linked records.',
  owner: 'element',
  method: 'updateElementProperties',
  effect: 'write',
  parameters: [
    { name: 'elementIds', schema: apiIds },
    { name: 'values', schema: apiRecord }
  ]
})

const patchElementPropertiesApi = defineBasicApi({
  description:
    'Apply ordered per-element new value and record patches through App normalization; omitted fields stay unchanged.',
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

const createElementsApi = defineBasicApi({
  description:
    'Create an ordered array of component or vector descriptions, allowing different parents. Returns one ID or null per input in order; retain returned IDs.',
  owner: 'element',
  method: 'createElements',
  resultKind: 'created-items',
  effect: 'write',
  parameters: [
    { name: 'createOptions', schema: apiArray(elementCreationOptionsSchema) }
  ]
})

const createElementsInParentApi = defineBasicApi({
  description:
    'Create canonical descriptors under one parent in order. Returns ordered IDs or null when the parent argument is invalid.',
  owner: 'element',
  method: 'createElementsInParent',
  resultKind: 'created-items',
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

const createVectorElementsInParentApi = defineBasicApi({
  description:
    'Create vector descriptions under one parent in order; returns ordered IDs or null. Use createElements for mixed component types or parents.',
  owner: 'element',
  method: 'createVectorElementsInParent',
  resultKind: 'created-items',
  effect: 'write',
  parameters: [
    { name: 'createOptions', schema: apiArray(elementCreationOptionsSchema) },
    { name: 'parentId', schema: apiString }
  ]
})

const deleteElementApi = defineBasicApi({
  description:
    'Delete a non-Workspace element and its subtree; returns whether anything was removed.',
  owner: 'element',
  method: 'deleteElement',
  effect: 'delete',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getWorkspaceIdApi = defineBasicApi({
  description:
    'Read the current workspace identity from saved hierarchy data; use core.getCurrentWorkspaceId for direct current identity.',
  owner: 'hierarchy',
  method: 'getWorkspaceId',
  effect: 'read',
  parameters: []
})

const getFlattenedElementIdsApi = defineBasicApi({
  description:
    'Read the current flattened UI layer order; this is a UI projection, not a complete canonical tree query.',
  owner: 'hierarchy',
  method: 'getFlattenedElementIds',
  effect: 'read',
  parameters: []
})

const getElementDataMapApi = defineBasicApi({
  description:
    'Read the current UI layer data map; use canonical reads for authoritative element properties.',
  owner: 'hierarchy',
  method: 'getElementDataMap',
  effect: 'read',
  parameters: []
})

const groupElementsApi = defineBasicApi({
  description:
    'Group the supplied element IDs with App geometry preservation; returns grouping details.',
  owner: 'hierarchy',
  method: 'groupElements',
  effect: 'write',
  parameters: [{ name: 'elementIds', schema: apiIds }]
})

const ungroupElementApi = defineBasicApi({
  description:
    'Ungroup a container while preserving App child geometry; returns the resulting identities and removal result.',
  owner: 'hierarchy',
  method: 'ungroupElement',
  effect: 'write',
  parameters: [{ name: 'groupId', schema: apiString }]
})

const moveElementsApi = defineBasicApi({
  owner: 'hierarchy',
  method: 'moveElements',
  resultKind: 'moves',
  effect: 'write',
  parameters: [{ name: 'request', schema: elementMoveRequestSchema }],
  description:
    'Preserves App group-geometry behavior. Read the target parent children with core.getElementData first. targetIndex is a zero-based insertion index from 0 through the target child count excluding the moved elements; use that count to append. All moved elements must share a source parent. An oversized index is rejected, not clamped.'
})

const removeSubtreeApi = defineBasicApi({
  description:
    'Remove a canonical subtree in a transaction; returns removed identities for invalidating references.',
  owner: 'hierarchy',
  method: 'removeSubtree',
  resultKind: 'removed',
  effect: 'delete',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const getSelectedIdsApi = defineBasicApi({
  description: 'Read the current element selection IDs.',
  owner: 'selection',
  method: 'getSelectedIds',
  effect: 'read',
  parameters: []
})

const getVectorPointSelectionIdsApi = defineBasicApi({
  description:
    'Read encoded vector point selection IDs; use getSelectedVectorPoints for structured references.',
  owner: 'selection',
  method: 'getVectorPointSelectionIds',
  effect: 'read',
  parameters: []
})

const getVectorSegmentSelectionIdsApi = defineBasicApi({
  description:
    'Read encoded vector segment selection IDs; use getSelectedVectorSegments for structured references.',
  owner: 'selection',
  method: 'getVectorSegmentSelectionIds',
  effect: 'read',
  parameters: []
})

const getSelectedVectorPointsApi = defineBasicApi({
  description:
    'Read structured selected vector point references with element and point identity.',
  owner: 'selection',
  method: 'getSelectedVectorPoints',
  effect: 'read',
  parameters: []
})

const getSelectedVectorSegmentsApi = defineBasicApi({
  description:
    'Read structured selected vector segment references with element and segment identity.',
  owner: 'selection',
  method: 'getSelectedVectorSegments',
  effect: 'read',
  parameters: []
})

const toggleSelectionApi = defineBasicApi({
  description:
    'Toggle membership of one known element in the current selection; use selectElements for explicit replacement.',
  owner: 'selection',
  method: 'toggleSelection',
  effect: 'selection',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const selectElementsApi = defineBasicApi({
  description:
    'Replace the element selection with all supplied IDs at once; an empty array clears it.',
  owner: 'selection',
  method: 'selectElements',
  effect: 'selection',
  parameters: [{ name: 'elementIds', schema: apiIds }]
})

const selectVectorPointsApi = defineBasicApi({
  description:
    'Replace encoded vector point selection IDs; an empty array clears them.',
  owner: 'selection',
  method: 'selectVectorPoints',
  effect: 'selection',
  parameters: [{ name: 'pointIds', schema: apiIds }]
})

const selectVectorSegmentsApi = defineBasicApi({
  description:
    'Replace encoded vector segment selection IDs; an empty array clears them.',
  owner: 'selection',
  method: 'selectVectorSegments',
  effect: 'selection',
  parameters: [{ name: 'segmentIds', schema: apiIds }]
})

const selectVectorPointApi = defineBasicApi({
  description:
    'Select one structured point reference without asking the caller to encode its identity.',
  owner: 'selection',
  method: 'selectVectorPoint',
  effect: 'selection',
  parameters: [
    {
      name: 'point',
      schema: apiObject({
        elementId: apiString,
        pointId: apiString,
        target: { enum: Object.values(VECTOR_TOKENS.POINT.TARGET) }
      })
    }
  ]
})

const selectVectorSegmentApi = defineBasicApi({
  description:
    'Select one structured segment reference without asking the caller to encode its identity.',
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
  description: 'Read the current App zoom scale, with its configured default.',
  owner: 'viewport',
  method: 'getScale',
  effect: 'read',
  parameters: []
})

const getPositionApi = defineBasicApi({
  description:
    'Read the App viewport translation, with its configured default.',
  owner: 'viewport',
  method: 'getPosition',
  effect: 'read',
  parameters: []
})

const getCanvasPositionFromWorkspaceApi = defineBasicApi({
  description:
    'Convert workspace coordinates to canvas coordinates using current App zoom and translation.',
  owner: 'viewport',
  method: 'getCanvasPositionFromWorkspace',
  effect: 'read',
  parameters: [{ name: 'workspacePos', schema: apiPosition }]
})

const zoomFitApi = defineBasicApi({
  description:
    'Fit the canvas to current content only when the user requests navigation; this is not an automatic drawing step.',
  owner: 'viewport',
  method: 'zoomFit',
  effect: 'viewport',
  parameters: []
})

const zoomToCenterApi = defineBasicApi({
  description:
    'Set zoom around the supplied canvas center, preserving that focal point.',
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
  description:
    'Set the viewport translation to the supplied x and y; does not modify document geometry.',
  owner: 'viewport',
  method: 'panTo',
  effect: 'viewport',
  parameters: [
    { name: 'x', schema: apiNumber },
    { name: 'y', schema: apiNumber }
  ]
})

const getFillByIdApi = defineBasicApi({
  description:
    'Read one current Fill by known element and Fill IDs; use only when its values are needed for a calculation.',
  owner: 'fill',
  method: 'getFillById',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString }
  ]
})

const getPrimaryFillColorApi = defineBasicApi({
  description:
    'Read the first Fill color or null; this is not a complete Fill record.',
  owner: 'fill',
  method: 'getPrimaryFillColor',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const updatePrimaryFillColorsApi = defineBasicApi({
  description:
    'Recolor the primary Fill of each supplied element. Retains other fields; returns one boolean per input, false for unchanged or missing targets.',
  owner: 'fill',
  method: 'updatePrimaryFillColors',
  resultKind: 'boolean-items',
  effect: 'write',
  parameters: [
    {
      name: 'updates',
      schema: apiArray(apiObject({ elementId: apiString, color: apiString }))
    }
  ]
})

const fillGradientSchema = apiObject(
  {
    gradientType: {
      ...apiString,
      description:
        'Native gradient type, including linear, radial, angular or diamond.'
    },
    gradientHandles: apiArray(apiPosition),
    gradientStops: apiArray(
      apiObject({ position: apiNumber, color: apiString, opacity: apiNumber })
    ),
    metadata: apiRecord
  },
  ['gradientType', 'gradientHandles', 'gradientStops']
)

const fillPatchProperties = {
  kind: { enum: Object.values(FillKinds) },
  defaultColorFormat: { enum: Object.values(FillColorFormats) },
  colorFormat: { enum: Object.values(FillColorFormats) },
  color: apiString,
  opacity: apiNumber,
  visible: apiBoolean,
  gradient: {
    anyOf: [{ type: 'null' }, fillGradientSchema],
    description:
      'Replace the gradient value here, nested inside the Fill patch. Use null to clear it.'
  }
} satisfies Record<FillWritableKey, Record<string, unknown>>

const fillPatchSchema = apiObject(fillPatchProperties, [])

const fillTargetSchema = apiObject({ elementId: apiString, fillId: apiString })

const getFillTargetsAtIndexApi = defineBasicApi({
  owner: 'fill',
  method: 'getFillTargetsAtIndex',
  effect: 'read',
  parameters: [
    { name: 'elementIds', schema: apiIds },
    { name: 'index', schema: { type: 'integer', minimum: 0 } }
  ],
  description:
    'Resolve current Fill IDs at one row index for known elements. Returns only elementId/fillId targets; missing rows reject. Retain these IDs for edits rather than retrieving full Fill values.'
})

const addFillsApi = defineBasicApi({
  owner: 'fill',
  method: 'addFills',
  effect: 'write',
  parameters: [{ name: 'elementIds', schema: apiIds }],
  description:
    'Add one default Fill to each element in one canonical batch; returns the new Fill IDs in element order.'
})

const removeFillsApi = defineBasicApi({
  owner: 'fill',
  method: 'removeFills',
  effect: 'delete',
  parameters: [{ name: 'targets', schema: apiArray(fillTargetSchema) }],
  description: 'Remove the specified Fill records in one canonical batch.'
})

const fillRowIndexSchema = { type: 'integer', minimum: 0 }
const fillRowTargetsSchema = { ...apiIds, uniqueItems: true }
const updateFillsAtIndexApi = defineBasicApi({
  owner: 'fill',
  method: 'updateFillsAtIndex',
  effect: 'write',
  parameters: [
    { name: 'elementIds', schema: fillRowTargetsSchema },
    { name: 'index', schema: fillRowIndexSchema },
    {
      name: 'patch',
      schema: { anyOf: [fillPatchSchema, apiArray(fillPatchSchema)] }
    }
  ],
  description:
    'Apply new Fill fields to one row on unique element targets. Duplicate element IDs are invalid; they do not express sharing. patch is either one uniform patch or an array aligned exactly with elementIds in input order; arrays support different values per target without reading Fill IDs. Resolves child IDs inside the App; use prepared target references without reading or returning Fill IDs. Omitted fields and independent ownership are preserved. One plural canonical batch.'
})
const shareFillAtIndexApi = defineBasicApi({
  owner: 'fill',
  method: 'shareFillAtIndex',
  effect: 'write',
  parameters: [
    { name: 'sourceElementId', schema: apiString },
    { name: 'elementIds', schema: fillRowTargetsSchema },
    { name: 'index', schema: fillRowIndexSchema }
  ],
  description:
    'Explicitly link this Fill row on target elements to the source element’s same Fill property component. Later edits to that Fill affect every linked owner. Other rows remain unchanged. Use for intentionally shared styles, not merely equal colors; use updateFillsAtIndex for independent edits.'
})
const detachFillsAtIndexApi = defineBasicApi({
  owner: 'fill',
  method: 'detachFillsAtIndex',
  effect: 'write',
  parameters: [
    { name: 'elementIds', schema: fillRowTargetsSchema },
    { name: 'index', schema: fillRowIndexSchema }
  ],
  description:
    'Detach the chosen shared Fill row into independent property components using their current values; other rows retain their references. Subsequent edits no longer change the original shared Fill. Undo restores the links.'
})

const updateFillFieldsBatchApi = defineBasicApi({
  owner: 'fill',
  method: 'updateFillFieldsBatch',
  effect: 'write',
  parameters: [
    {
      name: 'updates',
      schema: apiArray(
        apiObject({
          elementId: apiString,
          fillId: apiString,
          patch: fillPatchSchema
        })
      )
    }
  ],
  description:
    'Update multiple Fill records in one atomic canonical batch using IDs and requested new fields only. Preserve omitted fields and independent values. No currentFill snapshots or full computed reads are required; invalid values reject the batch.'
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
  description:
    'Hit-test a gradient control at browser client coordinates; returns its control index or null.'
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
  description:
    'Hit-test a gradient control at browser client coordinates; returns its control index or null.'
})

const getCanvasBoundsApi = defineBasicApi({
  description:
    'Read the browser canvas bounds needed for pointer-coordinate conversion.',
  owner: 'fill',
  method: 'getCanvasBounds',
  effect: 'read',
  parameters: []
})

const getCanvasPositionFromClientApi = defineBasicApi({
  description:
    'Convert browser client coordinates to canvas coordinates by subtracting the canvas offset.',
  owner: 'fill',
  method: 'getCanvasPositionFromClient',
  effect: 'read',
  parameters: [{ name: 'clientPos', schema: apiPosition }]
})

const getGradientHandleGeometryApi = defineBasicApi({
  description:
    'Read current gradient handle geometry for interactive editing; returns null if the Fill or dimensions are unavailable.',
  owner: 'fill',
  method: 'getGradientHandleGeometry',
  effect: 'read',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'fillId', schema: apiString }
  ]
})

const getNextGradientForHandleAtClientPositionApi = defineBasicApi({
  description:
    'Calculate a new gradient for a handle at a browser client position using current owner data; does not write it.',
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
  description:
    'Move a gradient handle to a browser client position; reads required current geometry internally and returns the new gradient or null.',
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

const addStrokeApi = defineBasicApi({
  description:
    'Append a default Stroke to a known element; returns its new identity. Put all ready targets in the same execution batch.',
  owner: 'stroke',
  method: 'addStroke',
  effect: 'write',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const removeStrokeApi = defineBasicApi({
  description:
    'Remove a known Stroke from an element; other Strokes are preserved.',
  owner: 'stroke',
  method: 'removeStroke',
  effect: 'delete',
  parameters: [
    { name: 'elementId', schema: apiString },
    { name: 'strokeId', schema: apiString }
  ]
})

const getPrimaryStrokeColorApi = defineBasicApi({
  description:
    'Read the first Stroke color or null; this is not a complete Stroke record.',
  owner: 'stroke',
  method: 'getPrimaryStrokeColor',
  effect: 'read',
  parameters: [{ name: 'elementId', schema: apiString }]
})

const updatePrimaryStrokeColorsApi = defineBasicApi({
  description:
    'Recolor the primary Stroke of each supplied element. Retains other fields; returns one boolean per input, false for unchanged or missing targets.',
  owner: 'stroke',
  method: 'updatePrimaryStrokeColors',
  resultKind: 'boolean-items',
  effect: 'write',
  parameters: [
    {
      name: 'updates',
      schema: apiArray(apiObject({ elementId: apiString, color: apiString }))
    }
  ]
})

const strokePatchProperties = {
  style: { type: 'string', enum: Object.values(StrokeStyles) },
  position: { type: 'string', enum: Object.values(StrokePositions) },
  width: apiNumber,
  dash: apiNumber,
  gap: apiNumber,
  fill: apiRecord,
  joinType: { type: 'string', enum: Object.values(StrokeJoinTypes) },
  capType: { type: 'string', enum: Object.values(StrokeCapTypes) },
  miterAngle: apiNumber
} satisfies Record<(typeof STROKE_PATCH_KEYS)[number], Record<string, unknown>>

const updateStrokeFieldsBatchApi = defineBasicApi({
  owner: 'stroke',
  method: 'updateStrokeFieldsBatch',
  effect: 'write',
  parameters: [
    {
      name: 'updates',
      schema: apiArray(
        apiObject({
          elementId: apiString,
          strokeId: apiString,
          patch: apiObject(strokePatchProperties, [])
        })
      )
    }
  ],
  description:
    'Patch multiple existing Stroke records with requested new fields only. Validates all targets before writing; preserves omitted fields and canonical history.'
})

export const basicDesignApiContracts = [
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
  setElementsVisibleApi,
  toggleElementLockApi,
  toggleElementVisibleApi,
  resetElementSizeApi,
  changeElementGeometryApi,
  setElementPositionsApi,
  updateElementPropertiesApi,
  patchElementPropertiesApi,
  createElementsApi,
  createElementsInParentApi,
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
  getFillByIdApi,
  getPrimaryFillColorApi,
  updatePrimaryFillColorsApi,
  getFillTargetsAtIndexApi,
  addFillsApi,
  removeFillsApi,
  updateFillsAtIndexApi,
  shareFillAtIndexApi,
  detachFillsAtIndexApi,
  updateFillFieldsBatchApi,
  getGradientHandleHitAtClientPosApi,
  getGradientStopHitAtClientPosApi,
  getCanvasBoundsApi,
  getCanvasPositionFromClientApi,
  getGradientHandleGeometryApi,
  getNextGradientForHandleAtClientPositionApi,
  updateGradientHandleAtClientPositionApi,
  addStrokeApi,
  removeStrokeApi,
  getPrimaryStrokeColorApi,
  updatePrimaryStrokeColorsApi,
  updateStrokeFieldsBatchApi
]
