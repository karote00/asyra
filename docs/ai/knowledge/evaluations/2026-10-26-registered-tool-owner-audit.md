# Registered tool ownership and identity allocation - 2026-10-26

This report covers the current follow-up, not a new model evaluation. The active
Task 3 plan owns the bounded scope. Earlier reports and provider recordings were
not changed. All project edits remain local; no push, CI inspection or model run
was performed for this follow-up.

## Source and verification boundary

- Base: `4cf053e7a8626aa3ea67f0f4e393e26812ab4300`, branch
  `codex/design-knowledge-evaluation`, with pre-existing dirty changes preserved.
- Runtime registrations: 156 basic APIs and 26 composed App actions. The native
  registry has 206 entries, including App wrappers; 29 names are native-only
  (25 service tools and four tool-library controls). The union is 211 names,
  not the sum of both registries.
- Registry enumeration and TypeScript AST extraction located each declaration,
  dispatch and implementation. Individual owner bodies and direct delegates were
  inspected without regex source searches. Dynamic user-authored recipes have
  authoring/invocation admission coverage; future arbitrary programs are not a
  finite audited tool inventory.
- The individual inventory below records source review and the applicable test
  boundary. It does not claim that every possible input or all external failures
  were executed. Generic malformed-input admission tests are explicitly separate
  from real-owner execution.
- Inspector contract digest:
  `5d2a80f8902c46bc5226cba2bd84b64f18dd96e2209ba7a9b8989a0519c73fab`.
  Final admission resolves the same 81 mapped cases and unchanged digest.
- Inspected owner files: 27. SHA-256 over sorted path, NUL, current file bytes, NUL: `704d63bcecded65038be7e92b8578e503c89564503d33cce0e644a632d7f58ea`.

## Findings and corrections

| Finding | Evidence | Correction | Limit |
| --- | --- | --- | --- |
| AI has no route to allocate from the existing counter | The original basic registry exposes no allocator; source keys are caller-owned strings | Add Core `allocateIds` through the existing counter, discovery and batch route | Allocation is optional and does not fix intentional reuse of one key for two objects |
| Geometry composition discards the canonical receipt | Scalar adapter was typed void; vector adapter projected only `.value`; real-owner scale 1 by 1 exposed false application | Consume actual changed/accepted/unavailable receipt and preserve legal no-op | No new geometry algorithm or speculative after-read |
| Prepared material claims complete on an unchanged write | Real identical second application returns changed=false from fill owner | Forward canonical receipt and refresh provenance only for accepted targets | Accepted target count is not changed-object count |
| Retained fill mapping claims complete and expands mutation scope on no-op | Real mapping repeated against current values returns unchanged | Preserve canonical status/changed/settlement and empty mutation scope on no-op | Existing owner aggregate changed flag does not enumerate changed subset within accepted IDs |
| Partial mapping can lose recovery identities if receipt retention fails | Formal partial-owner and retention-failure case | Compact fallback carries accepted and unavailable identities; no write replay | Receipt retention failure remains explicit |
| Some direct consumers still mock the former void contract | Two server harness failures and browser fixture inspection | Correct mocks/fixtures to canonical receipts, keeping original scope, byte and geometry assertions | Updating a mock is not evidence of a new owner fix |
| Earlier Core schema drift remains an important regression boundary | Required patch records and computed-field limits differ from their former declarations | Retain prior dirty fixes; strengthen actual nested required-member checks and exercise all basic APIs in browser | AST checks skip non-object union/reference branches and are not semantic verification |

The counter validates the complete ordered type list before committing any
advancement. It preserves registered prefixes, namespace and loaded positions;
rejects invalid, exhausted and ambiguous prefixes atomically; returns a frozen
ordered list; and makes no document or history entry. Empty input remains valid.
The AI receives allocation, not reset/update access to the counter. Issued source
keys and persisted document IDs are distinct; returned key-to-ID mappings remain
authoritative for subsequent document operations. Valid caller-authored keys stay
supported. No mandatory first-use lookup or schema preload was added.

Composed receipts use the existing explicit owner contract, not truthiness or a
post-write document comparison. Missing/malformed output is an output-contract
failure with the original evidence retained; it cannot certify success or replay
an operation. Diagnostic uncertainty about a malformed response remains explicit.
The three receipt bugs were formally reproduced with owners; this report does
not claim those exact no-op bugs occurred in the saved 101 run.

## What partial meant in the saved evaluation

Evidence directory: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1793022990110/`.
Drawing provider: `preserved-provider/d3b76a4b-99e1-4399-821e-8243fae49ca9.jsonl`.
Outer provider: `preserved-provider/1f0673f4-b85c-4152-8bef-4a0079174bd0.jsonl`.
Saved source digest: `c32d50158fd30c1d8a6a332965bc251327cce22e0a4c86f6281d7e2511e86c25`.
This source is separate from the current dirty worktree.

| Layer | Confirmed meaning | What it does not mean |
| --- | --- | --- |
| Final UI partial | Evaluation-report input requests `report_outcome` with `outcome=unsupported`. Conversation aggregation returns partial when unsupported coexists with complete operations | Not a completion percentage or proof that the picture was half finished |
| Tool partial at 157.571 s | Capture completed, but the selected unit scope had changed and required explicit revision supersession; visual binding/recording was not complete | Capture success is not successful evidence binding or visual acceptance |
| Final visual judgments | Four recorded criteria passed and no mechanical findings remained unresolved | Does not erase historical partial receipts or establish photographic fidelity |

The saved run contains 44 App calls: 43 successful and one partial, with no failed
or unknown App receipt in that tally. First frame was 94.442 s; work/report ended
at 410.319 s. The first submission was at 90.659 s, 12,668 bytes and 6,221 created
objects. These are historical measurements, not new results for counter allocation.

## Did the inspections help?

| Time after user request | Observed check or action | Interpretation |
| --- | --- | --- |
| 102.663 s | Overview capture | Evidence acquisition, not a visual verdict |
| 119.539 s | Representative material fails: uniform teal glass lacks reflective reading | Useful visual finding; five reflection elements follow at 157.473 s |
| 157.571 s | Overview/detail capture returns partial binding | A valid revision protection, with avoidable correction work; not a new material verdict |
| 162.734-169.101 s | Explicit supersession, revised crop and binding | Recovery retains existing overview evidence |
| 181.670 s | Material still judged diagrammatic with better contrast | Distinguishes improvement from final approval |
| 242.853-270.015 s | Detail crop is blank; overview rejects oversimplified crown and an occluding parapet | Blank framing provides no useful detail evidence; overview identifies actionable defects |
| 286.417-286.912 s | Four faces removed; 25 crown elements created | Actual correction after failed review |
| 313.122 s | Lower representative materials pass; upper matching remains | Local pass does not approve unrelated regions |
| 327.181-327.293 s | Upper reflection elements and hierarchy adjustment | Follow-up correction |
| 340.617-383.859 s | Multi-scale images, rebinding and final judgments | Recorded pass reasons accept editable vector readability, not photorealism |
| 390.206 s | No unresolved checks | Current store result, not proof all earlier calls were efficient |

Mechanical checks validate geometry, scope and evidence validity; the main AI
owns appearance judgments. Useful corrections and avoidable empty crops/binding
recovery coexist. The original blank-crop coordinate cause is not established by
this follow-up. Counter allocation and truthful receipts do not automatically
improve AI framing or eliminate all visual review iterations.

## Formal verification

| Gate | Result | Evidence and interpretation |
| --- | --- | --- |
| Initial real-owner regression | Failed before the receipt implementation | Existing no-op cases exposed falsely complete/application claims |
| Final server harness | 2,341 passed, 71 files, zero skipped | `tmp/identity-server-verified.log`; installed-native registration is tested without turn/start or inference; large saved-document case enabled |
| App action suite | 774 passed, 56 files | `tmp/identity-owner-app-tests.log`; followed by final affected-owner and server-consumer reruns |
| Final affected owners | 118 passed | `tmp/identity-owner-verified.log` |
| Counter owner | 20 passed | `tmp/identity-counter-final.log`; registered/custom types, namespaces, load, concurrent calls, malformed input and atomic exhaustion |
| Actual browser API suite | 165 passed plus one separately enabled large case | `tmp/identity-browser-apis.log`, `tmp/identity-browser-large.log`; all 156 registered basic APIs execute with actual owners; history and document export/reload cases included |
| Direct schema/owner agreement | 22 passed | Included in server harness; nested required members supplement existing parameter/result checks |
| Inspector architecture and routes | Two passed; 81 execution proofs passed in server harness | Same admitted digest; no claim of whole-plan completion |
| Production types | Passed | `tmp/identity-types-verified.log` |
| Scoped lint | Zero errors | Existing console warnings at Core and execution-proof diagnostics remain |
| Naming | 15 passed | `tmp/identity-naming-verified.log` |
| Release-update guidance | Passed | `tmp/identity-docs-verified.log`; semantic review remains separate |
| Task context and whitespace | Passed | Feature branch, selected Task 3 association, `git diff --check` |

The first broad server rerun found two obsolete void-return mocks. After correcting
the mocks and retaining their substantive assertions, the full harness passed.
The browser large-export test initially skipped without its fixture setting; the
same permanent test was then enabled with the saved document and passed. No
required case is being closed on that skipped result. Canonical files were frozen
while the browser runs executed. Owned services were cleaned up afterward.

## Individual basic API inventory

Each row was source-inspected through declaration, adapter and actual public owner.
`B` means its registered real-browser API case executed successfully, with the
suite's malformed/cancelled-input checks. `D` means its delivered usage route and
schema were tested. Those codes do not imply exhaustive edge-case coverage. Result
kinds are the existing declared interpretations, not guessed return statuses.

| API | Public owner | Return interpretation | Verification |
| --- | --- | --- | --- |
| `api_core_allocateIds` | `packages/core/src/core.ts` | `allocated-ids` | B, D |
| `api_core_readElementPropertyTargets` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_updateElementPropertyTargets` | `packages/core/src/core.ts` | `property-mutation` | B, D |
| `api_core_updateSharedPropertySources` | `packages/core/src/core.ts` | `property-mutation` | B, D |
| `api_core_resetElementPropertyOverrides` | `packages/core/src/core.ts` | `property-mutation` | B, D |
| `api_core_detachElementPropertyTargets` | `packages/core/src/core.ts` | `property-mutation` | B, D |
| `api_core_shareElementPropertyTargets` | `packages/core/src/core.ts` | `property-mutation` | B, D |
| `api_core_getCurrentWorkspaceId` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getCanonicalElementCount` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getAllElementsBounds` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getViewportPosition` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getViewportScale` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getSelectedElementIds` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getUndoHistoryDepth` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getRegistrations` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getRegistrationRelations` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getProjectedElementCount` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_hasRenderEngineProvider` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_isCompositionOpen` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getRuntimeState` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getElementData` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getElementMetadata` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getElementChildren` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getElementComputedData` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getAllElementData` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getCanonicalOwnerSnapshot` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getSystemContextSnapshot` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_isContainerType` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_hasProjectedElement` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getElementIdAtClientPos` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getMousePosInWorkspace` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_workspaceToCanvas` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_workspaceToElementLocal` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_elementLocalToWorkspace` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_elementSourceToWorkspace` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_workspaceToElementSource` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getUIProperty` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getSystemProperty` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_hasSystemProperty` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getComponentPropertyRelations` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getPropertyChildRelations` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_createElementsInParent` | `packages/core/src/core.ts` | `created-items` | B, D |
| `api_core_updateElementProperties` | `packages/core/src/core.ts` | `property-mutation` | B, D |
| `api_core_patchElementProperties` | `packages/core/src/core.ts` | `property-mutation` | B, D |
| `api_core_updatePropertyComponents` | `packages/core/src/core.ts` | `property-mutation` | B, D |
| `api_core_updateElementData` | `packages/core/src/core.ts` | `change-flag` | B, D |
| `api_core_selectByChannel` | `packages/core/src/core.ts` | `transient` | B, D |
| `api_core_getCanvasBounds` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_measureElementContentBounds` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_getRegistration` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_hasSharedDataChannel` | `packages/core/src/core.ts` | `value` | B, D |
| `api_core_moveElements` | `packages/core/src/core.ts` | `moves` | B, D |
| `api_element_getElementType` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_isElementLocked` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_isElementVisible` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_getElementBounds` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_getElementClientBounds` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_getElementPosition` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_getElementIdAtWorkspacePos` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_getElementIdAtClientPos` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_getRenderElementIdAtClientPos` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_getMousePosInWorkspace` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_getElementIdsInBounds` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_isPointInsideElement` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_getPositionInParent` | `apps/asyra-design/src/common-apis/element/apis.ts` | `value` | B, D |
| `api_element_setElementLock` | `apps/asyra-design/src/common-apis/element/apis.ts` | `mutation-receipt` | B, D |
| `api_element_setElementsVisible` | `apps/asyra-design/src/common-apis/element/apis.ts` | `status-items` | B, D |
| `api_element_toggleElementLock` | `apps/asyra-design/src/common-apis/element/apis.ts` | `mutation-receipt` | B, D |
| `api_element_toggleElementVisible` | `apps/asyra-design/src/common-apis/element/apis.ts` | `mutation-receipt` | B, D |
| `api_element_resetElementSize` | `apps/asyra-design/src/common-apis/element/apis.ts` | `mutation-receipt` | B, D |
| `api_element_changeElementGeometry` | `apps/asyra-design/src/common-apis/element/apis.ts` | `mutation-receipt` | B, D |
| `api_element_setElementPositions` | `apps/asyra-design/src/common-apis/element/apis.ts` | `mutation-receipt` | B, D |
| `api_element_updateElementProperties` | `apps/asyra-design/src/common-apis/element/apis.ts` | `property-mutation` | B, D |
| `api_element_patchElementProperties` | `apps/asyra-design/src/common-apis/element/apis.ts` | `property-mutation` | B, D |
| `api_element_createElements` | `apps/asyra-design/src/common-apis/element/apis.ts` | `created-items` | B, D |
| `api_element_createElementsInParent` | `apps/asyra-design/src/common-apis/element/apis.ts` | `created-items` | B, D |
| `api_element_createVectorElementsInParent` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `created-items` | B, D |
| `api_element_deleteElements` | `apps/asyra-design/src/common-apis/element/apis.ts` | `removed` | B, D |
| `api_element_getVectorAnchorPointAtWorkspacePos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorEditablePointAtWorkspacePos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorSegmentAtWorkspacePos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorSegmentHitAtWorkspacePos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_isPointNearVectorPathAtWorkspacePos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorAnchorPointAtClientPos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorEditablePointAtClientPos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorSegmentAtClientPos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorSegmentHitAtClientPos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_isPointNearVectorPathAtClientPos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorAnchorPoints` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorAnchorSubpaths` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorTopology` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorAnchorPointById` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorAnchorEndpoint` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorAnchorContinuation` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_getVectorAnchorPointHandleMode` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `value` | B, D |
| `api_element_updateVectorAnchorPointPosition` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_updateVectorAnchorPointType` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_setVectorAnchorPointHandleMode` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_updateVectorAnchorPointHandlePosition` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_updateVectorAnchorPointHandles` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_appendVectorAnchorPoint` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_connectVectorAnchorEndpoints` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_connectVectorAnchorPoints` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_removeLastSinglePointSubpath` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_removeVectorAnchorPoint` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_splitVectorSegmentAtWorkspacePos` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_setVectorClosed` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_scaleVectorElementAroundCenter` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_setVectorElementPositions` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_element_createVectorElementFromSinglePoint` | `apps/asyra-design/src/common-apis/element/vector-apis.ts` | `mutation-receipt` | B, D |
| `api_hierarchy_getWorkspaceId` | `apps/asyra-design/src/common-apis/hierarchy.ts` | `value` | B, D |
| `api_hierarchy_getFlattenedElementIds` | `apps/asyra-design/src/common-apis/hierarchy.ts` | `value` | B, D |
| `api_hierarchy_getElementDataMap` | `apps/asyra-design/src/common-apis/hierarchy.ts` | `value` | B, D |
| `api_hierarchy_groupElements` | `apps/asyra-design/src/common-apis/hierarchy.ts` | `grouped` | B, D |
| `api_hierarchy_ungroupElement` | `apps/asyra-design/src/common-apis/hierarchy.ts` | `ungrouped` | B, D |
| `api_hierarchy_moveElements` | `apps/asyra-design/src/common-apis/hierarchy.ts` | `moves` | B, D |
| `api_hierarchy_moveElementsRelative` | `apps/asyra-design/src/common-apis/hierarchy.ts` | `moves` | B, D |
| `api_selection_getSelectedIds` | `apps/asyra-design/src/common-apis/selection.ts` | `value` | B, D |
| `api_selection_getVectorPointSelectionIds` | `apps/asyra-design/src/common-apis/selection.ts` | `value` | B, D |
| `api_selection_getVectorSegmentSelectionIds` | `apps/asyra-design/src/common-apis/selection.ts` | `value` | B, D |
| `api_selection_getSelectedVectorPoints` | `apps/asyra-design/src/common-apis/selection.ts` | `value` | B, D |
| `api_selection_getSelectedVectorSegments` | `apps/asyra-design/src/common-apis/selection.ts` | `value` | B, D |
| `api_selection_toggleSelection` | `apps/asyra-design/src/common-apis/selection.ts` | `transient` | B, D |
| `api_selection_selectElements` | `apps/asyra-design/src/common-apis/selection.ts` | `transient` | B, D |
| `api_selection_selectVectorPoints` | `apps/asyra-design/src/common-apis/selection.ts` | `transient` | B, D |
| `api_selection_selectVectorSegments` | `apps/asyra-design/src/common-apis/selection.ts` | `transient` | B, D |
| `api_selection_selectVectorPoint` | `apps/asyra-design/src/common-apis/selection.ts` | `transient` | B, D |
| `api_selection_selectVectorSegment` | `apps/asyra-design/src/common-apis/selection.ts` | `transient` | B, D |
| `api_viewport_getScale` | `apps/asyra-design/src/common-apis/viewport.ts` | `value` | B, D |
| `api_viewport_getPosition` | `apps/asyra-design/src/common-apis/viewport.ts` | `value` | B, D |
| `api_viewport_getCanvasPositionFromWorkspace` | `apps/asyra-design/src/common-apis/viewport.ts` | `value` | B, D |
| `api_viewport_zoomFit` | `apps/asyra-design/src/common-apis/viewport.ts` | `transient` | B, D |
| `api_viewport_zoomToCenter` | `apps/asyra-design/src/common-apis/viewport.ts` | `transient` | B, D |
| `api_viewport_panTo` | `apps/asyra-design/src/common-apis/viewport.ts` | `transient` | B, D |
| `api_fill_getFillById` | `apps/asyra-design/src/common-apis/fills.ts` | `value` | B, D |
| `api_fill_getPrimaryFillColor` | `apps/asyra-design/src/common-apis/fills.ts` | `value` | B, D |
| `api_fill_updatePrimaryFillColors` | `apps/asyra-design/src/common-apis/fills.ts` | `status-items` | B, D |
| `api_fill_getFillTargetsAtIndex` | `apps/asyra-design/src/common-apis/fills.ts` | `value` | B, D |
| `api_fill_addFills` | `apps/asyra-design/src/common-apis/fills.ts` | `mutation-receipt` | B, D |
| `api_fill_removeFills` | `apps/asyra-design/src/common-apis/fills.ts` | `mutation-receipt` | B, D |
| `api_fill_updateFillsAtIndex` | `apps/asyra-design/src/common-apis/fills.ts` | `mutation-receipt` | B, D |
| `api_fill_shareFillAtIndex` | `apps/asyra-design/src/common-apis/fills.ts` | `mutation-receipt` | B, D |
| `api_fill_detachFillsAtIndex` | `apps/asyra-design/src/common-apis/fills.ts` | `mutation-receipt` | B, D |
| `api_fill_updateFillFieldsBatch` | `apps/asyra-design/src/common-apis/fills.ts` | `mutation-receipt` | B, D |
| `api_fill_getGradientHandleHitAtClientPos` | `apps/asyra-design/src/common-apis/fills.ts` | `value` | B, D |
| `api_fill_getGradientStopHitAtClientPos` | `apps/asyra-design/src/common-apis/fills.ts` | `value` | B, D |
| `api_fill_getCanvasBounds` | `apps/asyra-design/src/common-apis/fills.ts` | `value` | B, D |
| `api_fill_getCanvasPositionFromClient` | `apps/asyra-design/src/common-apis/fills.ts` | `value` | B, D |
| `api_fill_getGradientHandleGeometry` | `apps/asyra-design/src/common-apis/fills.ts` | `value` | B, D |
| `api_fill_getNextGradientForHandleAtClientPosition` | `apps/asyra-design/src/common-apis/fills.ts` | `value` | B, D |
| `api_fill_updateGradientHandleAtClientPosition` | `apps/asyra-design/src/common-apis/fills.ts` | `mutation-receipt` | B, D |
| `api_stroke_addStroke` | `apps/asyra-design/src/common-apis/strokes.ts` | `mutation-receipt` | B, D |
| `api_stroke_removeStroke` | `apps/asyra-design/src/common-apis/strokes.ts` | `mutation-receipt` | B, D |
| `api_stroke_getPrimaryStrokeColor` | `apps/asyra-design/src/common-apis/strokes.ts` | `value` | B, D |
| `api_stroke_updatePrimaryStrokeColors` | `apps/asyra-design/src/common-apis/strokes.ts` | `status-items` | B, D |
| `api_stroke_updateStrokeFieldsBatch` | `apps/asyra-design/src/common-apis/strokes.ts` | `mutation-receipt` | B, D |

## Individual composed action inventory

Each listed owner was read individually. `A` means the affected App action suite
and server integration suites passed; `M` means malformed input is rejected at the
real registered boundary. Only the three corrected receipt consumers and the
new allocation route carry the additional real-owner proofs described above.
Unchanged composition paths retain their existing dedicated integration tests;
this inventory does not turn a generic M case into a semantic proof.

| Action | Execution owner | Verification |
| --- | --- | --- |
| `export_document` | `apps/asyra-design/src/ai/document-export.ts` | A, M |
| `download_document_export` | `apps/asyra-design/src/ai/document-export.ts` | A, M |
| `release_document_export` | `apps/asyra-design/src/ai/document-export.ts` | A, M |
| `report_outcome` | `apps/asyra-design/src/ai/actions.ts` | A, M |
| `request_clarification` | `apps/asyra-design/src/ai/actions.ts` | A, M |
| `request_drawing_detail_choice` | `apps/asyra-design/src/ai/actions.ts` | A, M |
| `insert_vector_composition` | `apps/asyra-design/src/ai/actions.ts` | A, M |
| `update_composition_elements` | `apps/asyra-design/src/ai/actions.ts` | A, M |
| `remove_ai_composition` | `apps/asyra-design/src/ai/actions.ts` | A, M |
| `replace_vector_composition` | `apps/asyra-design/src/ai/actions.ts` | A, M |
| `set_element_visibility` | `apps/asyra-design/src/ai/actions.ts` | A, M |
| `select_elements` | `apps/asyra-design/src/ai/actions.ts` | A, M |
| `apply_prepared_design` | `apps/asyra-design/src/ai/design-actions.ts` | A, M |
| `apply_prepared_material` | `apps/asyra-design/src/ai/prepared-material-action.ts` | A, M |
| `read_design_context` | `apps/asyra-design/src/ai/context-action.ts` | A, M |
| `resolve_design_targets` | `apps/asyra-design/src/ai/context-action.ts` | A, M |
| `release_design_context` | `apps/asyra-design/src/ai/context-action.ts` | A, M |
| `map_retained_fills` | `apps/asyra-design/src/ai/retained-fill-action.ts` | A, M |
| `update_design_element` | `apps/asyra-design/src/ai/design-edit-action.ts` | A, M |
| `organize_design` | `apps/asyra-design/src/ai/organization-action.ts` | A, M |
| `arrange_design` | `apps/asyra-design/src/ai/arrangement-action.ts` | A, M |
| `review_design` | `apps/asyra-design/src/ai/review-action.ts` | A, M |
| `apply_prescribed_positions` | `apps/asyra-design/src/ai/prescribed-position-action.ts` | A, M |
| `inspect_drawing` | `apps/asyra-design/src/ai/inspection.ts` | A, M |
| `read_design_attachment` | `apps/asyra-design/src/ai/inspection.ts` | A, M |
| `validate_inspection_evidence` | `apps/asyra-design/src/ai/inspection.ts` | A, M |

## Individual native service and library inventory

Each registered handler, admission, output and recovery path was inspected through
its existing delegates. `S` means the relevant server harness passed; `M` means
native invocation rejects malformed input before dispatch. Actual online remote
services and AI decisions were not called. These are test boundaries, not a claim
that every possible downstream service response has been observed.

| Native tool | Entry owner | Verification |
| --- | --- | --- |
| `prepare_material_revision` | `apps/asyra-design/server/local-design-tools.ts` | S, M |
| `prepare_design` | `apps/asyra-design/server/local-design-tools.ts` | S, M |
| `retain_design_targets` | `apps/asyra-design/server/local-design-tools.ts` | S, M |
| `release_design_artifacts` | `apps/asyra-design/server/local-design-tools.ts` | S, M |
| `read_design_checks` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `verify_design_checks` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `repair_design_checks` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `review_prepared_design` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `describe_design_apis` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `execute_design_batch` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `define_design_criteria` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `record_design_facts` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `record_design_calculations` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `select_design_references` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `review_drawing` | `apps/asyra-design/server/local-operation-tools.ts` | S, M |
| `prepare_and_apply_design` | `apps/asyra-design/server/local-design-workflow.ts` | S, M |
| `validate_reference_images` | `apps/asyra-design/server/local-image-tools.ts` | S, M |
| `review_vector_contours` | `apps/asyra-design/server/local-image-tools.ts` | S, M |
| `apply_contour_refinements` | `apps/asyra-design/server/local-image-tools.ts` | S, M |
| `vectorize_image_layers` | `apps/asyra-design/server/local-image-tools.ts` | S, M |
| `vtracer` | `apps/asyra-design/server/local-image-tools.ts` | S, M |
| `analyze_vector_components` | `apps/asyra-design/server/local-image-tools.ts` | S, M |
| `import_reference_image` | `apps/asyra-design/server/local-reference-tools.ts` | S, M |
| `discover_knowledge` | `apps/asyra-design/server/local-knowledge.ts` | S, M |
| `read_knowledge` | `apps/asyra-design/server/local-knowledge.ts` | S, M |
| `submit_tool` | `apps/asyra-design/server/local-tool-library-tools.ts` | S, M |
| `invoke_tool` | `apps/asyra-design/server/local-tool-library-tools.ts` | S, M |
| `save_tool` | `apps/asyra-design/server/local-tool-library-tools.ts` | S, M |
| `manage_tool` | `apps/asyra-design/server/local-tool-library-tools.ts` | S, M |

## Remaining observation limits

- AI use of the new allocator and the changed receipt semantics has not been
  observed in a new model run. Local execution is verified; adoption is not.
- The existing counter is namespace/session owned. It does not promise global
  uniqueness against arbitrary manual strings, externally reset counters or all
  independent installations. Existing document validation remains authoritative.
- Explicit invalid-output diagnostics preserve uncertainty; they must not be
  relabeled successful merely to remove an uncertainty word.
- This bounded audit does not certify every future tool, user recipe, plugin or
  remote service response. Existing registry-driven tests and signature checks
  now cover the currently registered routes and reduce declaration drift.
- Visual quality and historical UI partial labeling are explained, not silently
  reclassified. The current task does not change evaluation-report semantics.
