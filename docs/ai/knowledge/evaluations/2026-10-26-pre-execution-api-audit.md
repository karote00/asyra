# Pre-execution API delivery audit - 2026-10-26

The audit enumerated actual runtime registrations and TypeScript-resolved owners, then directly inspected their declarations, dispatch and current implementations. Regex search was not used as the API audit.

Scope: 181 App actions (155 basic APIs and 26 composed actions), plus 201 local registry entries. The local registry includes basic APIs, so these counts are not additive unique capabilities. The permanent test enumerates the current registry automatically.

Coverage: every App action and local entry has malformed-input admission coverage. Each basic API has exact usage and batch-route admission coverage. Existing owner suites cover real success, no-op, partial failure, cancellation and history cases. Source inspection and boundary coverage do not prove every argument or internal branch. Local review substitutes pixel capture; live screenshots are separate evidence.

Confirmed corrections: early source-key diagnostics and retained repair; whole-criterion supersession admission and retained-image recovery; computed-field limits from the unchanged Core owner; required records in Core patch schemas; provisional first-visible guidance without mandatory Knowledge.

## Basic APIs

| API | Inputs | Public owner | Return and result semantics |
| --- | --- | --- | --- |
| `api_core_readElementPropertyTargets` | targets | `packages/core/src/core.ts:235` | `readonly PropertyTargetView[]`; value |
| `api_core_updateElementPropertyTargets` | updates | `packages/core/src/core.ts:236` | `PropertyMutationReceipt`; property-mutation |
| `api_core_updateSharedPropertySources` | updates | `packages/core/src/core.ts:237` | `PropertyMutationReceipt`; property-mutation |
| `api_core_resetElementPropertyOverrides` | updates | `packages/core/src/core.ts:238` | `PropertyMutationReceipt`; property-mutation |
| `api_core_detachElementPropertyTargets` | targets | `packages/core/src/core.ts:239` | `PropertyMutationReceipt`; property-mutation |
| `api_core_shareElementPropertyTargets` | updates | `packages/core/src/core.ts:240` | `PropertyMutationReceipt`; property-mutation |
| `api_core_getCurrentWorkspaceId` |  | `packages/core/src/core.ts:633` | `string`; value |
| `api_core_getCanonicalElementCount` |  | `packages/core/src/core.ts:650` | `number`; value |
| `api_core_getAllElementsBounds` |  | `packages/core/src/core.ts:270` | `Bounds  /  null`; value |
| `api_core_getViewportPosition` |  | `packages/core/src/core.ts:767` | `PositionData`; value |
| `api_core_getViewportScale` |  | `packages/core/src/core.ts:774` | `number`; value |
| `api_core_getSelectedElementIds` |  | `packages/core/src/core.ts:730` | `string[]`; value |
| `api_core_getUndoHistoryDepth` |  | `packages/core/src/core.ts:886` | `number`; value |
| `api_core_getRegistrations` |  | `packages/core/src/core.ts:1735` | `readonly RegistrationNodeMetadata[]`; value |
| `api_core_getRegistrationRelations` |  | `packages/core/src/core.ts:1739` | `readonly RegistrationRelationMetadata[]`; value |
| `api_core_getProjectedElementCount` |  | `packages/core/src/core.ts:866` | `number`; value |
| `api_core_hasRenderEngineProvider` |  | `packages/core/src/core.ts:994` | `boolean`; value |
| `api_core_isCompositionOpen` |  | `packages/core/src/core.ts:998` | `boolean`; value |
| `api_core_getRuntimeState` |  | `packages/core/src/core.ts:369` | `CoreRuntimeState`; value |
| `api_core_getElementData` | elementId | `packages/core/src/core.ts:587` | `ElementRawData  /  undefined`; value |
| `api_core_getElementMetadata` | elementId | `packages/core/src/core.ts:592` | `{ id: string; type: string; name: string; parentId: string; visible: boolean; lock: boolean; childCount: number; }  /  undefined`; value |
| `api_core_getElementChildren` | elementId, offset, limit | `packages/core/src/core.ts:610` | `{ available: boolean; elementIds: string[]; total: number; nextOffset: number  /  null; }`; value |
| `api_core_getElementComputedData` | elementId, fields | `packages/core/src/core.ts:257` | `Record<string, unknown>  /  undefined`; value |
| `api_core_getAllElementData` |  | `packages/core/src/core.ts:637` | `readonly Readonly<{ elementId: string; data: ElementRawData; computed: {}  /  ComputedAttrs; }>[]`; value |
| `api_core_getCanonicalOwnerSnapshot` |  | `packages/core/src/core.ts:658` | `{ props: PropsComponentRawData; sceneTree: SceneTreeRawData; }`; value |
| `api_core_getSystemContextSnapshot` |  | `packages/core/src/core.ts:734` | `SystemContextSnapshot`; value |
| `api_core_isContainerType` | type | `packages/core/src/core.ts:271` | `boolean`; value |
| `api_core_hasProjectedElement` | elementId | `packages/core/src/core.ts:870` | `boolean`; value |
| `api_core_getElementIdAtClientPos` | clientPos | `packages/core/src/core.ts:826` | `string  /  null`; value |
| `api_core_getMousePosInWorkspace` | mousePos | `packages/core/src/core.ts:778` | `Readonly<{ x: number; y: number; }>`; value |
| `api_core_workspaceToCanvas` | workspacePosition | `packages/core/src/core.ts:784` | `PositionData`; value |
| `api_core_workspaceToElementLocal` | elementId, workspacePosition | `packages/core/src/core.ts:830` | `PositionData  /  null`; value |
| `api_core_elementLocalToWorkspace` | elementId, localPosition | `packages/core/src/core.ts:839` | `PositionData  /  null`; value |
| `api_core_elementSourceToWorkspace` | elementId, sourcePosition | `packages/core/src/core.ts:848` | `PositionData  /  null`; value |
| `api_core_workspaceToElementSource` | elementId, workspacePosition | `packages/core/src/core.ts:857` | `PositionData  /  null`; value |
| `api_core_getUIProperty` | key | `packages/core/src/core.ts:280` | `T  /  undefined`; value |
| `api_core_getSystemProperty` | key | `packages/core/src/core.ts:287` | `T  /  undefined`; value |
| `api_core_hasSystemProperty` | key | `packages/core/src/core.ts:290` | `boolean`; value |
| `api_core_getComponentPropertyRelations` | componentType | `packages/core/src/core.ts:1630` | `readonly ComponentPropertyRelationMetadata[]`; value |
| `api_core_getPropertyChildRelations` | parentPropertyType | `packages/core/src/core.ts:1451` | `readonly PropertyChildRelationMetadata[]`; value |
| `api_core_createElementsInParent` | data, parentId, index | `packages/core/src/core.ts:255` | `readonly string[]`; created-items |
| `api_core_updateElementProperties` | updates | `packages/core/src/core.ts:241` | `PropertyMutationReceipt`; property-mutation |
| `api_core_patchElementProperties` | patches | `packages/core/src/core.ts:242` | `PropertyMutationReceipt`; property-mutation |
| `api_core_updatePropertyComponents` | updates | `packages/core/src/core.ts:234` | `PropertyMutationReceipt`; property-mutation |
| `api_core_updateElementData` | elementId, values | `packages/core/src/core.ts:712` | `boolean`; change-flag |
| `api_core_selectByChannel` | channel, ids | `packages/core/src/core.ts:272` | `void`; transient |
| `api_core_getCanvasBounds` |  | `packages/core/src/core.ts:763` | `DOMRect  /  null`; value |
| `api_core_measureElementContentBounds` | elementIds | `packages/core/src/core.ts:215` | `RenderContentMeasurement[]`; value |
| `api_core_getRegistration` | ref | `packages/core/src/core.ts:1731` | `RegistrationNodeMetadata  /  undefined`; value |
| `api_core_hasSharedDataChannel` | name | `packages/core/src/core.ts:1025` | `boolean`; value |
| `api_core_moveElements` | request | `packages/core/src/core.ts:258` | `MoveHierarchyResult`; moves |
| `api_element_getElementType` | elementId | `apps/asyra-design/src/common-apis/element/apis.ts:295` | `string  /  undefined`; value |
| `api_element_isElementLocked` | elementId | `apps/asyra-design/src/common-apis/element/apis.ts:299` | `boolean`; value |
| `api_element_isElementVisible` | elementId | `apps/asyra-design/src/common-apis/element/apis.ts:304` | `boolean`; value |
| `api_element_getElementBounds` | elementId | `apps/asyra-design/src/common-apis/element/apis.ts:365` | `Rect  /  null`; value |
| `api_element_getElementClientBounds` | elementId | `apps/asyra-design/src/common-apis/element/apis.ts:385` | `Rect  /  null`; value |
| `api_element_getElementPosition` | elementId | `apps/asyra-design/src/common-apis/element/apis.ts:427` | `PositionData  /  null`; value |
| `api_element_getElementIdAtWorkspacePos` | workspacePos | `apps/asyra-design/src/common-apis/element/apis.ts:254` | `string  /  null`; value |
| `api_element_getElementIdAtClientPos` | clientPos | `apps/asyra-design/src/common-apis/element/apis.ts:279` | `string  /  null`; value |
| `api_element_getRenderElementIdAtClientPos` | clientPos | `apps/asyra-design/src/common-apis/element/apis.ts:291` | `string  /  null`; value |
| `api_element_getMousePosInWorkspace` | clientPos | `apps/asyra-design/src/common-apis/element/apis.ts:503` | `Readonly<{ x: number; y: number; }>`; value |
| `api_element_getElementIdsInBounds` | bounds | `apps/asyra-design/src/common-apis/element/apis.ts:276` | `string[]`; value |
| `api_element_isPointInsideElement` | elementId, point | `apps/asyra-design/src/common-apis/element/apis.ts:482` | `boolean`; value |
| `api_element_getPositionInParent` | parentId, workspacePosition | `apps/asyra-design/src/common-apis/element/apis.ts:439` | `PositionData  /  null`; value |
| `api_element_setElementLock` | elementId, lock | `apps/asyra-design/src/common-apis/element/apis.ts:309` | `MutationReceipt<boolean>`; mutation-receipt |
| `api_element_setElementsVisible` | elementIds, visible | `apps/asyra-design/src/common-apis/element/apis.ts:325` | `ElementFlagResult[]`; status-items |
| `api_element_toggleElementLock` | elementId | `apps/asyra-design/src/common-apis/element/apis.ts:332` | `MutationReceipt<boolean>`; mutation-receipt |
| `api_element_toggleElementVisible` | elementId | `apps/asyra-design/src/common-apis/element/apis.ts:346` | `MutationReceipt<boolean>`; mutation-receipt |
| `api_element_resetElementSize` | elementId | `apps/asyra-design/src/common-apis/element/apis.ts:637` | `MutationReceipt<null>`; mutation-receipt |
| `api_element_changeElementGeometry` | elementId, geometry | `apps/asyra-design/src/common-apis/element/apis.ts:648` | `MutationReceipt<null>`; mutation-receipt |
| `api_element_setElementPositions` | positionsById | `apps/asyra-design/src/common-apis/element/apis.ts:671` | `MutationReceipt<null>`; mutation-receipt |
| `api_element_updateElementProperties` | elementIds, values | `apps/asyra-design/src/common-apis/element/apis.ts:745` | `PropertyMutationReceipt`; property-mutation |
| `api_element_patchElementProperties` | patches | `apps/asyra-design/src/common-apis/element/apis.ts:747` | `PropertyMutationReceipt`; property-mutation |
| `api_element_createElements` | createOptions | `apps/asyra-design/src/common-apis/element/apis.ts:530` | `readonly (string  /  null)[]`; created-items |
| `api_element_createElementsInParent` | descriptors, parentId | `apps/asyra-design/src/common-apis/element/apis.ts:510` | `readonly string[]  /  null`; created-items |
| `api_element_createVectorElementsInParent` | createOptions, parentId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2516` | `readonly string[]  /  null`; created-items |
| `api_element_deleteElements` | elementIds | `apps/asyra-design/src/common-apis/element/apis.ts:619` | `{ removed: { elementId: string; }[]; }`; removed |
| `api_hierarchy_getWorkspaceId` |  | `apps/asyra-design/src/common-apis/hierarchy.ts:18` | `string  /  null`; value |
| `api_hierarchy_getFlattenedElementIds` |  | `apps/asyra-design/src/common-apis/hierarchy.ts:25` | `string[]`; value |
| `api_hierarchy_getElementDataMap` |  | `apps/asyra-design/src/common-apis/hierarchy.ts:28` | `Record<string, Partial<ElementRawData>>`; value |
| `api_hierarchy_groupElements` | elementIds | `apps/asyra-design/src/common-apis/hierarchy.ts:33` | `GroupOperationResult`; grouped |
| `api_hierarchy_ungroupElement` | groupId | `apps/asyra-design/src/common-apis/hierarchy.ts:36` | `UngroupOperationResult`; ungrouped |
| `api_hierarchy_moveElements` | request | `apps/asyra-design/src/common-apis/hierarchy.ts:39` | `MoveHierarchyResult`; moves |
| `api_hierarchy_moveElementsRelative` | request | `apps/asyra-design/src/common-apis/hierarchy.ts:45` | `MoveHierarchyResult`; moves |
| `api_selection_getSelectedIds` |  | `apps/asyra-design/src/common-apis/selection.ts:47` | `string[]`; value |
| `api_selection_getVectorPointSelectionIds` |  | `apps/asyra-design/src/common-apis/selection.ts:51` | `string[]`; value |
| `api_selection_getVectorSegmentSelectionIds` |  | `apps/asyra-design/src/common-apis/selection.ts:55` | `string[]`; value |
| `api_selection_getSelectedVectorPoints` |  | `apps/asyra-design/src/common-apis/selection.ts:59` | `VectorSelectionRef[]`; value |
| `api_selection_getSelectedVectorSegments` |  | `apps/asyra-design/src/common-apis/selection.ts:66` | `VectorSegmentSelectionRef[]`; value |
| `api_selection_toggleSelection` | elementId | `apps/asyra-design/src/common-apis/selection.ts:83` | `void`; transient |
| `api_selection_selectElements` | elementIds | `apps/asyra-design/src/common-apis/selection.ts:94` | `void`; transient |
| `api_selection_selectVectorPoints` | pointIds | `apps/asyra-design/src/common-apis/selection.ts:105` | `void`; transient |
| `api_selection_selectVectorSegments` | segmentIds | `apps/asyra-design/src/common-apis/selection.ts:126` | `void`; transient |
| `api_selection_selectVectorPoint` | point | `apps/asyra-design/src/common-apis/selection.ts:109` | `void`; transient |
| `api_selection_selectVectorSegment` | segment | `apps/asyra-design/src/common-apis/selection.ts:130` | `void`; transient |
| `api_viewport_getScale` |  | `apps/asyra-design/src/common-apis/viewport.ts:20` | `number`; value |
| `api_viewport_getPosition` |  | `apps/asyra-design/src/common-apis/viewport.ts:27` | `PositionData`; value |
| `api_viewport_getCanvasPositionFromWorkspace` | workspacePos | `apps/asyra-design/src/common-apis/viewport.ts:41` | `PositionData`; value |
| `api_viewport_zoomFit` |  | `apps/asyra-design/src/common-apis/viewport.ts:84` | `void`; transient |
| `api_viewport_zoomToCenter` | scale, centerX, centerY | `apps/asyra-design/src/common-apis/viewport.ts:56` | `void`; transient |
| `api_viewport_panTo` | x, y | `apps/asyra-design/src/common-apis/viewport.ts:76` | `void`; transient |
| `api_fill_getFillById` | elementId, fillId | `apps/asyra-design/src/common-apis/fills.ts:319` | `FillAttrs  /  null`; value |
| `api_fill_getPrimaryFillColor` | elementId | `apps/asyra-design/src/common-apis/fills.ts:323` | `string  /  null`; value |
| `api_fill_updatePrimaryFillColors` | updates | `apps/asyra-design/src/common-apis/fills.ts:548` | `readonly ("changed"  /  "unchanged"  /  "unavailable")[]`; status-items |
| `api_fill_getFillTargetsAtIndex` | elementIds, index | `apps/asyra-design/src/common-apis/fills.ts:222` | `FillTarget[]`; value |
| `api_fill_addFills` | elementIds | `apps/asyra-design/src/common-apis/fills.ts:237` | `MutationReceipt<string[]>`; mutation-receipt |
| `api_fill_removeFills` | targets | `apps/asyra-design/src/common-apis/fills.ts:266` | `MutationReceipt<null>`; mutation-receipt |
| `api_fill_updateFillsAtIndex` | elementIds, index, patch | `apps/asyra-design/src/common-apis/fills.ts:609` | `MutationReceipt<null>`; mutation-receipt |
| `api_fill_shareFillAtIndex` | sourceElementId, elementIds, index | `apps/asyra-design/src/common-apis/fills.ts:630` | `MutationReceipt<null>`; mutation-receipt |
| `api_fill_detachFillsAtIndex` | elementIds, index | `apps/asyra-design/src/common-apis/fills.ts:658` | `MutationReceipt<null>`; mutation-receipt |
| `api_fill_updateFillFieldsBatch` | updates | `apps/asyra-design/src/common-apis/fills.ts:672` | `MutationReceipt<null>`; mutation-receipt |
| `api_fill_getGradientHandleHitAtClientPos` | elementId, fillId, clientPos, hitRadius | `apps/asyra-design/src/common-apis/fills.ts:431` | `{ handleIndex: GradientHandleIndex; }  /  null`; value |
| `api_fill_getGradientStopHitAtClientPos` | elementId, fillId, clientPos, hitSize | `apps/asyra-design/src/common-apis/fills.ts:458` | `{ stopIndex: number; }  /  null`; value |
| `api_fill_getCanvasBounds` |  | `apps/asyra-design/src/common-apis/fills.ts:300` | `DOMRect  /  null`; value |
| `api_fill_getCanvasPositionFromClient` | clientPos | `apps/asyra-design/src/common-apis/fills.ts:304` | `PositionData`; value |
| `api_fill_getGradientHandleGeometry` | elementId, fillId | `apps/asyra-design/src/common-apis/fills.ts:391` | `GradientHandleGeometry  /  null`; value |
| `api_fill_getNextGradientForHandleAtClientPosition` | elementId, fillId, handleIndex, clientPos | `apps/asyra-design/src/common-apis/fills.ts:328` | `{ gradientHandles: PositionData[]; gradientType: string; gradientStops: FillGradientStop[]; metadata?: Record<string, unknown>  /  undefined; }  /  null`; value |
| `api_fill_updateGradientHandleAtClientPosition` | elementId, fillId, handleIndex, clientPos | `apps/asyra-design/src/common-apis/fills.ts:517` | `MutationReceipt<null>  /  MutationReceipt<{ gradientHandles: PositionData[]; gradientType: string; gradientStops: FillGradientStop[]; metadata?: Record<...>  /  undefined; }>`; mutation-receipt |
| `api_stroke_addStroke` | elementId | `apps/asyra-design/src/common-apis/strokes.ts:136` | `MutationReceipt<string  /  null>`; mutation-receipt |
| `api_stroke_removeStroke` | elementId, strokeId | `apps/asyra-design/src/common-apis/strokes.ts:155` | `MutationReceipt<boolean>`; mutation-receipt |
| `api_stroke_getPrimaryStrokeColor` | elementId | `apps/asyra-design/src/common-apis/strokes.ts:197` | `string  /  null`; value |
| `api_stroke_updatePrimaryStrokeColors` | updates | `apps/asyra-design/src/common-apis/strokes.ts:202` | `readonly ("changed"  /  "unchanged"  /  "unavailable")[]`; status-items |
| `api_stroke_updateStrokeFieldsBatch` | updates | `apps/asyra-design/src/common-apis/strokes.ts:266` | `MutationReceipt<null>`; mutation-receipt |
| `api_element_getVectorAnchorPointAtWorkspacePos` | elementId, workspacePos, hitRadius | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1660` | `{ point: VectorAnchorPoint; index: number; }  /  null`; value |
| `api_element_getVectorEditablePointAtWorkspacePos` | elementId, workspacePos, hitRadius | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1683` | `VectorEditablePointHit  /  null`; value |
| `api_element_getVectorSegmentAtWorkspacePos` | elementId, workspacePos, hitRadius | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1786` | `string  /  null`; value |
| `api_element_getVectorSegmentHitAtWorkspacePos` | elementId, workspacePos, hitRadius | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1800` | `VectorSegmentHit  /  null`; value |
| `api_element_isPointNearVectorPathAtWorkspacePos` | elementId, workspacePos, hitRadius | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1849` | `boolean`; value |
| `api_element_getVectorAnchorPointAtClientPos` | elementId, clientPos | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1750` | `{ point: VectorAnchorPoint; index: number; }  /  null`; value |
| `api_element_getVectorEditablePointAtClientPos` | elementId, clientPos | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1768` | `VectorEditablePointHit  /  null`; value |
| `api_element_getVectorSegmentAtClientPos` | elementId, clientPos, hitRadius | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1809` | `string  /  null`; value |
| `api_element_getVectorSegmentHitAtClientPos` | elementId, clientPos, hitRadius | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1830` | `VectorSegmentHit  /  null`; value |
| `api_element_isPointNearVectorPathAtClientPos` | elementId, clientPos, hitRadius | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1863` | `boolean`; value |
| `api_element_getVectorAnchorPoints` | elementId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1586` | `VectorAnchorPoint[]`; value |
| `api_element_getVectorAnchorSubpaths` | elementId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1595` | `VectorAnchorSubpaths`; value |
| `api_element_getVectorTopology` | elementId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1604` | `VectorTopology`; value |
| `api_element_getVectorAnchorPointById` | elementId, pointId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1882` | `{ point: VectorAnchorPoint; index: number; }  /  null`; value |
| `api_element_getVectorAnchorEndpoint` | elementId, pointId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1949` | `{ networkId: string; pointId: string; side: VectorEndpointSide; }  /  null`; value |
| `api_element_getVectorAnchorContinuation` | elementId, pointId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1961` | `{ networkId: string; pointId: string; side: VectorEndpointSide; }  /  null`; value |
| `api_element_getVectorAnchorPointHandleMode` | elementId, pointId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2329` | `VectorHandleMode`; value |
| `api_element_updateVectorAnchorPointPosition` | elementId, pointId, position | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2190` | `MutationReceipt<true  /  { point: VectorAnchorPoint; index: number; }  /  null>`; mutation-receipt |
| `api_element_updateVectorAnchorPointType` | elementId, pointId, type | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2299` | `MutationReceipt<{ point: VectorAnchorPoint; index: number; }  /  null>`; mutation-receipt |
| `api_element_setVectorAnchorPointHandleMode` | elementId, pointId, mode | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2337` | `MutationReceipt<{ point: VectorAnchorPoint; index: number; }  /  null>`; mutation-receipt |
| `api_element_updateVectorAnchorPointHandlePosition` | elementId, pointId, target, position | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2370` | `MutationReceipt<true  /  { point: VectorAnchorPoint; index: number; }  /  null>`; mutation-receipt |
| `api_element_updateVectorAnchorPointHandles` | elementId, updates | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2423` | `MutationReceipt<null>`; mutation-receipt |
| `api_element_appendVectorAnchorPoint` | elementId, point, options | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1898` | `MutationReceipt<{ point: VectorAnchorPoint; index: number; }  /  null>`; mutation-receipt |
| `api_element_connectVectorAnchorEndpoints` | elementId, sourcePointId, targetPointId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1973` | `MutationReceipt<{ closed: boolean; }  /  null>`; mutation-receipt |
| `api_element_connectVectorAnchorPoints` | elementId, sourcePointId, targetPointId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2011` | `MutationReceipt<{ closed: boolean; }  /  null>`; mutation-receipt |
| `api_element_removeLastSinglePointSubpath` | elementId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2049` | `MutationReceipt<boolean>`; mutation-receipt |
| `api_element_removeVectorAnchorPoint` | elementId, pointId | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2073` | `MutationReceipt<boolean>`; mutation-receipt |
| `api_element_splitVectorSegmentAtWorkspacePos` | elementId, segmentId, workspacePos | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2102` | `MutationReceipt<{ point: VectorAnchorPoint; index: number; }  /  null>`; mutation-receipt |
| `api_element_setVectorClosed` | elementId, closed | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2174` | `MutationReceipt<null>`; mutation-receipt |
| `api_element_scaleVectorElementAroundCenter` | elementId, scale | `apps/asyra-design/src/common-apis/element/vector-apis.ts:1608` | `MutationReceipt<boolean>`; mutation-receipt |
| `api_element_setVectorElementPositions` | updates | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2231` | `MutationReceipt<readonly string[]>`; mutation-receipt |
| `api_element_createVectorElementFromSinglePoint` | pointId, position | `apps/asyra-design/src/common-apis/element/vector-apis.ts:2532` | `MutationReceipt<string  /  null>`; mutation-receipt |

## Composed App actions

| Action | Declared inputs | Actual execution owner |
| --- | --- | --- |
| `export_document` |  | `apps/asyra-design/src/ai/document-export.ts:117` |
| `download_document_export` | artifactId | `apps/asyra-design/src/ai/document-export.ts:189` |
| `release_document_export` | artifactId | `apps/asyra-design/src/ai/document-export.ts:213` |
| `report_outcome` | outcome, message | `apps/asyra-design/src/ai/actions.ts:1163` |
| `request_clarification` | question | `apps/asyra-design/src/ai/actions.ts:1102` |
| `request_drawing_detail_choice` |  | `apps/asyra-design/src/ai/actions.ts:949` |
| `insert_vector_composition` | artifactVersion, compositionRole, elementCount, groupBounds, groupDescriptor, parent, pointCount, roleToElementIds, skipped, slices | `apps/asyra-design/src/ai/actions.ts:311` |
| `update_composition_elements` | updates | `apps/asyra-design/src/ai/actions.ts:428` |
| `remove_ai_composition` | compositionId | `apps/asyra-design/src/ai/actions.ts:782` |
| `replace_vector_composition` | compositionId, drawing | `apps/asyra-design/src/ai/actions.ts:875` |
| `set_element_visibility` | elementId, visible | `apps/asyra-design/src/ai/actions.ts:996` |
| `select_elements` | elementIds | `apps/asyra-design/src/ai/actions.ts:1060` |
| `apply_prepared_design` | design, materialElementIds, attachmentEvidence, parentId, response | `apps/asyra-design/src/ai/design-actions.ts:156` |
| `apply_prepared_material` | rootId, updates | `apps/asyra-design/src/ai/prepared-material-action.ts:249` |
| `read_design_context` |  | `apps/asyra-design/src/ai/context-action.ts:207` |
| `resolve_design_targets` | scope, bounds, filter, expectedCount | `apps/asyra-design/src/ai/context-action.ts:316` |
| `release_design_context` | snapshotId | `apps/asyra-design/src/ai/context-action.ts:243` |
| `map_retained_fills` | mappings | `apps/asyra-design/src/ai/retained-fill-action.ts:166` |
| `update_design_element` | elementId, name, properties, fillColor, strokeColor | `apps/asyra-design/src/ai/design-edit-action.ts:83` |
| `organize_design` | operation, elementIds, name, index | `apps/asyra-design/src/ai/organization-action.ts:43` |
| `arrange_design` | operation, axis, elementIds, alignment, gap | `apps/asyra-design/src/ai/arrangement-action.ts:45` |
| `review_design` | elementId, measurementTargets | `apps/asyra-design/src/ai/review-action.ts:110` |
| `apply_prescribed_positions` | evidence, positions | `apps/asyra-design/src/ai/prescribed-position-action.ts:46` |
| `inspect_drawing` | elementId, view, region | `apps/asyra-design/src/ai/inspection.ts:46` |
| `read_design_attachment` | parentId | `apps/asyra-design/src/ai/inspection.ts:195` |
| `validate_inspection_evidence` | measurementTargets, scope, evidence | `apps/asyra-design/src/ai/inspection.ts:137` |

## Additional local entries

| Tool | Declared inputs |
| --- | --- |
| `prepare_material_revision` | artifactId, field, definition |
| `prepare_design` | draft, materialSourceId, repair |
| `retain_design_targets` | targets |
| `release_design_artifacts` | artifactIds |
| `read_design_checks` | view, offset, limit, revision, includePassed, ids |
| `verify_design_checks` | requestId, checks |
| `repair_design_checks` | requestId, checks, policy |
| `review_prepared_design` | referenceUses, artifactId, criterionIds, previousArtifactId, parentId, keys |
| `describe_design_apis` | registryRevision, offset, view, inputScope, schemaPaths, operation, operations, category, includeSchemas, refresh, refreshReason, names, query, contentPage |
| `execute_design_batch` | operations, inspection, response, message |
| `define_design_criteria` | phase, method, references, referenceImageIndexes, criteria, structureCriteria, detailRequired, deferredDetails, facts, factBindings, dependencyChanges |
| `record_design_facts` | phase, facts, sourceCorrections, dependencyChanges, factBindings |
| `record_design_calculations` | calculations |
| `select_design_references` | referenceImageIndexes, requirementRevision, referenceDecisions |
| `review_drawing` | phase, inspectionIds, inspections, checks, bindChecks, deferredDetails, deferredChecks, final |
| `export_document` | arguments, inspection, message |
| `download_document_export` | arguments, inspection, message |
| `release_document_export` | arguments, inspection, message |
| `insert_vector_composition` | arguments, inspection, message |
| `update_composition_elements` | arguments, inspection, message |
| `remove_ai_composition` | arguments, inspection, message |
| `replace_vector_composition` | arguments, inspection, message |
| `select_elements` | arguments, inspection, message |
| `apply_prepared_design` | arguments, inspection, message |
| `apply_prepared_material` | arguments, inspection, message |
| `read_design_context` | arguments, inspection, message |
| `resolve_design_targets` | arguments, inspection, message |
| `release_design_context` | arguments, inspection, message |
| `map_retained_fills` | arguments, inspection, message |
| `organize_design` | arguments, inspection, message |
| `arrange_design` | arguments, inspection, message |
| `review_design` | arguments, inspection, message |
| `apply_prescribed_positions` | arguments, inspection, message |
| `inspect_drawing` | arguments, inspection, message |
| `read_design_attachment` | arguments, inspection, message |
| `validate_inspection_evidence` | arguments, inspection, message |
| `prepare_and_apply_design` | draft, materialSourceId, repair, plan, reviewChecks, parentId, message, inspection, response, parts |
| `validate_reference_images` | attachmentIndexes |
| `review_vector_contours` | quality, imageArtifactId, pathIds |
| `apply_contour_refinements` | reviewId, proposalIds |
| `vectorize_image_layers` | attachmentIndex, background, colorTolerance, clipToBackground, foregroundColors |
| `vtracer` | attachmentIndex, plan |
| `analyze_vector_components` | imageArtifactId, pathIds |
| `import_reference_image` | refresh, candidateOffset, references, imageUrl, sourceUrl |
| `discover_knowledge` | ids, contexts |
| `read_knowledge` | ids, rehydrate, reuseFrom, contentPage, contexts |

## Limits

Void transient viewport/selection operations are not evidence of document mutation. Unobservable transaction settlement must not be converted to success. Provider-internal argument progress and service waits are outside the available public stream. Historical evidence remains unchanged. No claim is made that all App defects are eliminated.
