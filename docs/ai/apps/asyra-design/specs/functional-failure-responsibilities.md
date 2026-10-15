# Design Functional Failure Responsibilities

## Scope

This observation profile identifies investigation entry points for the frozen
Stage A functional tests. Existing linked product specifications and public
owners remain authoritative. A mapped responsibility is not a proven root cause
or a claim that every assertion in an end-to-end case has that one cause.
The original failure/stack and declared implementation entries remain visible.
Six existing deletion cases retain the separate Design Deletion target.

The steps are independently callable product operations, not a synthetic sequence
through all features. Their terminal outcomes have no invented inter-feature
artifact handoffs. Source and evidence collection belong to the Control Plane,
not to this product architecture. Tests and observation records never drive
product state. No package or product gains a runtime dependency on this tool.

## start-editor

Compose the editor and expose its ready editable shell. Publish readiness only after Core starts; Reset reloads the selected document context. Failed startup remains unavailable; local-only mode must not start remote communication.

Authority: [Start and reset the editor](../ARCHITECTURE.md).

Implementation entry points:

- `apps/asyra-design/src/init/init-app.ts`
- `apps/asyra-design/src/render-app/index.tsx`
- `apps/asyra-design/src/controllers/app.ts`

- `apps/asyra-design/index.html`
- `apps/asyra-design/src/app/index.tsx`
- `apps/asyra-design/src/contents/contents-panel.tsx`
- `apps/asyra-design/src/properties/index.tsx`

- `apps/asyra-design/src/toolbar/index.tsx`
- `apps/asyra-design/src/toolbar/tool-button.tsx`
- `apps/asyra-design/src/toolbar/reset-stored-document.ts`
- `apps/asyra-design/src/toolbar/zoom.tsx`

## switch-tool

Route toolbar and keyboard tool selection through the App feature. Apply the selected tool and its path-editing transition through system context. Missing tool input does not change state.

Authority: [Switch the primary tool](../features/switch-primary-tool.md).

Implementation entry points:

- `apps/asyra-design/src/features/switch-primary-tool/index.ts`
- `apps/asyra-design/src/common-apis/system-context.ts`

- `apps/asyra-design/src/toolbar/tool-button.tsx`

## create-element

Create and update a rectangle or oval in one canonical pointer session. Resolve the parent, project pointer samples immediately and commit one History entry. Ineligible tool or invalid parent does not create an element; failed sessions roll back.

Authority: [Create an element gesture](../features/create-element.md).

Implementation entry points:

- `apps/asyra-design/src/features/create-element/feature.ts`
- `apps/asyra-design/src/common-apis/element/apis.ts`

## select-elements

Resolve click, area and Contents selection through App selection APIs. Use canonical target policy and project eligible selection without taking move ownership. Locked, hidden, stale and path-editing-ineligible targets do not become selected.

Authority: [Select elements](../features/selection.md).

Implementation entry points:

- `apps/asyra-design/src/features/selection/feature.ts`
- `apps/asyra-design/src/common-apis/selection.ts`
- `apps/asyra-design/src/controllers/canvas-hierarchy-target.ts`

- `apps/asyra-design/src/contents/contents-panel.tsx`
- `apps/asyra-design/src/contents/layer-selection.ts`

## hover-elements

Project eligible render hover events into App interaction state. Retain hover during dragging; otherwise resolve visible unlocked targets. Pointer leave clears eligible hover; drag-time events do not replace it.

Authority: [Resolve hover](../features/hover-element.md).

Implementation entry points:

- `apps/asyra-design/src/features/hover-element/index.ts`
- `apps/asyra-design/src/common-apis/system-context.ts`

## move-elements

Apply parent-local positions throughout one pointer gesture. Project immediate position updates and retain one gesture History entry. Shift, path editing, locked targets and sub-threshold motion do not mutate positions.

Authority: [Move elements](../features/move-elements.md).

Implementation entry points:

- `apps/asyra-design/src/features/move-elements/feature.ts`
- `apps/asyra-design/src/common-apis/element/apis.ts`

## delete-subtree

Delete a canonical element and its subtree through the App element API. Clear selection and delete eligible subtree in one transaction with ordinary persistence. Invalid selection or path editing does not delete a subtree.

Authority: [Delete a selected subtree](../features/delete-element.md).

Implementation entry points:

- `apps/asyra-design/src/features/delete-element/index.ts`
- `apps/asyra-design/src/common-apis/element/apis.ts`

## delete-vector-point

Remove the selected editable anchor through the canonical topology operation. Delete eligible anchors, split an interior path and clear point selection in one transaction. Missing editing vector, mode or selected anchor leaves topology unchanged.

Authority: [Delete a vector anchor](../features/delete-vector-point.md).

Implementation entry points:

- `apps/asyra-design/src/features/delete-vector-point/index.ts`
- `apps/asyra-design/src/common-apis/element/vector-apis.ts`

## replay-history

Route user Undo and Redo through the App History API. Replay the recorded action in the requested direction with its original grouping. Empty history and unavailable replay do not fabricate an action.

Authority: [Replay user actions](../features/undo-redo.md).

Implementation entry points:

- `apps/asyra-design/src/features/undo-redo/index.ts`
- `apps/asyra-design/src/common-apis/history.ts`
- `apps/asyra-design/src/common-apis/transaction.ts`

## edit-vector-path

Own pen continuation, anchor and segment editing sessions. Apply structural and handle edits through canonical vector operations; preserve editing selection. Invalid continuation and ineligible editing state do not fabricate geometry.

Authority: [Edit vector paths](../features/pen-tool.md).

Implementation entry points:

- `apps/asyra-design/src/features/pen-tool/feature.ts`
- `apps/asyra-design/src/features/path-editing-intents.ts`
- `apps/asyra-design/src/common-apis/element/vector-apis.ts`

## edit-properties

Project selected properties and route field edits through canonical App APIs. Display current selection and group an intended field interaction into one transaction. No selection exposes empty state; invalid field values do not create valid writes.

Authority: [Edit selected properties](../ARCHITECTURE.md).

Implementation entry points:

- `apps/asyra-design/src/properties/index.tsx`
- `apps/asyra-design/src/properties/interaction-transaction.ts`
- `apps/asyra-design/src/properties/position.tsx`
- `apps/asyra-design/src/properties/dimension.tsx`
- `apps/asyra-design/src/properties/rotation.tsx`
- `apps/asyra-design/src/properties/vector-point.tsx`

## edit-fills

Apply field-preserving fill and stroke edits with canonical property identity. Preserve unrelated fields, shared references and one intended interaction History entry. Invalid values reject; missing references and empty targets do not fabricate successful changes.

Authority: [Edit fills and strokes](../ARCHITECTURE.md).

Implementation entry points:

- `apps/asyra-design/src/common-apis/fills.ts`
- `apps/asyra-design/src/common-apis/property-patch.ts`
- `apps/asyra-design/src/properties/fills/use-fill-interactions.ts`
- `apps/asyra-design/src/properties/fills/use-gradient-interactions.ts`
- `apps/asyra-design/src/properties/strokes/use-stroke-interactions.ts`

## drag-gradient-handles

Convert canvas handle drags into normalized canonical gradient data. Use current transforms and retain unrestricted handle positions through one gesture. Absent editable gradient or invalid handle does not start a mutation.

Authority: [Drag gradient handles](../ARCHITECTURE.md).

Implementation entry points:

- `apps/asyra-design/src/features/gradient-fill-handles/feature.ts`
- `apps/asyra-design/src/common-apis/gradient-handle-geometry.ts`

## target-hierarchy

Resolve Group/Frame interaction targets and child-level selection. Use canonical hierarchy and registered container capabilities; preserve identity and child-local geometry. Stale, outside or ineligible paths do not select an invented child.

Authority: [Resolve hierarchy interactions](../features/group-interactions.md).

Implementation entry points:

- `apps/asyra-design/src/controllers/canvas-hierarchy-target.ts`
- `apps/asyra-design/src/features/selection/feature.ts`
- `apps/asyra-design/src/common-apis/hierarchy.ts`

## group-elements

Route explicit grouping through canonical hierarchy APIs. Group or ungroup the complete eligible selection in one user action. Ineligible membership rejects without partial canonical changes.

Authority: [Group and ungroup elements](../features/group-interactions.md).

Implementation entry points:

- `apps/asyra-design/src/features/group-elements/index.ts`
- `apps/asyra-design/src/common-apis/hierarchy.ts`

## move-layer-hierarchy

Resolve Layers pointer intent and commit one canonical move. Keep drag feedback local until valid release; retain canonical identities and final selection. Invalid source/drop, cancellation or lost capture creates no hierarchy request.

Authority: [Move Layers hierarchy](../features/move-elements.md).

Implementation entry points:

- `apps/asyra-design/src/features/layer-hierarchy-move/index.ts`
- `apps/asyra-design/src/controllers/layer-pointer-session.ts`
- `apps/asyra-design/src/controllers/layer-move-session.ts`
- `apps/asyra-design/src/common-apis/hierarchy.ts`

## navigate-viewport

Apply pan, zoom and fit through App viewport APIs. Use wheel modifiers and current visible viewport bounds to preserve canonical camera semantics. Empty fit content or invalid input does not invent bounds.

Authority: [Navigate the viewport](../features/viewport.md).

Implementation entry points:

- `apps/asyra-design/src/features/zoom/index.ts`
- `apps/asyra-design/src/features/pan/index.ts`
- `apps/asyra-design/src/features/zoom-fit/index.ts`
- `apps/asyra-design/src/common-apis/viewport.ts`

- `apps/asyra-design/src/toolbar/zoom.tsx`

## present-conversation

Retain conversation navigation, drafts, activity and composer context. Project current request state without canvas mutation from navigation or native text editing. Unavailable provider remains visible; empty or cancelled input cannot fabricate a successful response.

Authority: [Present the conversation](ai-conversation-experience.md).

Implementation entry points:

- `apps/asyra-design/src/app/ai-conversation-panel.tsx`
- `apps/asyra-design/src/app/ai-conversation-navigation.tsx`
- `apps/asyra-design/src/ai/conversation.ts`
- `apps/asyra-design/src/ai/activity-state.ts`

## execute-agent-request

Route a prepared request through App permission, action and transaction owners. Keep dependent actions in the intended History group and expose actual completion or partial failure. Denied, cancelled, unsupported or failed execution does not report completed drawing.

Authority: [Execute an Agent request](ai-execution-flow.md).

Implementation entry points:

- `apps/asyra-design/src/features/ai-agent/index.ts`
- `apps/asyra-design/src/ai/startup.ts`
- `apps/asyra-design/src/ai/transaction.ts`
- `apps/asyra-design/src/ai/design-actions.ts`

## invoke-basic-api

Execute only catalogued basic actions through their explicit public owner. Resolve declared owner/method/parameters and preserve read versus mutation semantics. Unregistered or unavailable methods reject; model-supplied method paths are never invoked.

Authority: [Invoke a registered public API](ai-execution-flow.md).

Implementation entry points:

- `apps/asyra-design/src/ai/basic-api-actions.ts`
- `apps/asyra-design/src/ai/basic-api-catalog.ts`
- `apps/asyra-design/src/ai/basic-api-results.ts`
- `apps/asyra-design/src/ai/basic-core-api-contracts.ts`
- `apps/asyra-design/src/ai/basic-design-api-contracts.ts`
- `apps/asyra-design/src/ai/basic-vector-api-contracts.ts`

## apply-prepared-design

Admit and apply prepared editable content through ordinary design actions. Preserve native component identity, hierarchy and ordered application within the intended action. Invalid or incomplete preparation cannot replace valid content as a successful result.

Authority: [Apply prepared design](design-preparation.md).

Implementation entry points:

- `apps/asyra-design/src/ai/prepared-design.ts`
- `apps/asyra-design/src/ai/prepared-design-admission.ts`
- `apps/asyra-design/src/ai/design-actions.ts`
- `apps/asyra-design/src/ai/design-edit-action.ts`
- `apps/asyra-design/server/design-preparation.ts`

## inspect-design

Capture canonical and rendered inspection evidence for the current design. Bind observations to current canonical content and keep overview distinct from native detail. Unavailable capture and stale evidence remain explicit rather than proving current geometry.

Authority: [Inspect current design](ai-execution-flow.md).

Implementation entry points:

- `apps/asyra-design/src/common-apis/inspection.ts`
- `apps/asyra-design/src/common-apis/inspection-evidence.ts`
- `apps/asyra-design/src/ai/inspection.ts`

## query-design-context

Resolve current region queries and retained edit selections through canonical indexes. Preserve current positions and invalidate retained queries when relevant canonical inputs change. Stale retained selection cannot authorize a new edit.

Authority: [Query bounded design context](ai-execution-flow.md).

Implementation entry points:

- `apps/asyra-design/src/common-apis/design-context.ts`
- `apps/asyra-design/src/common-apis/retained-design-context.ts`
- `apps/asyra-design/src/ai/context-action.ts`
- `apps/asyra-design/src/ai/retained-fill-action.ts`

## project-vector-geometry

Project canonical vector geometry and coverage to the renderer. Derive geometry and coverage from canonical vector topology without changing source data. Empty or degenerate topology does not fabricate valid visible coverage.

Authority: [Project vector geometry](../../../framework/packages/preset.md).

Implementation entry points:

- `packages/preset/src/components/vector.ts`
- `packages/preset/src/components/vector-compound-fill.ts`

## render-material

Render canonical mesh and gradient material commands through the concrete engine. Preserve ordered colors, stops, alpha and geometry across batching and camera changes. Empty or invalid material inputs do not become unrelated fallback imagery.

Authority: [Render native materials](../../../framework/packages/render-engine-pixi.md).

Implementation entry points:

- `packages/render-engine-pixi/src/mesh-material.ts`
- `packages/render-engine-pixi/src/mesh-material-batch.ts`
- `packages/render-engine-pixi/src/mesh-material-shader.ts`

## retain-navigation

Reuse camera-independent geometry while applying current navigation and local changes. Camera changes preserve canonical document identity and reuse unchanged geometry; edits invalidate affected projections. Missing renderer state remains unavailable rather than a valid profile.

Authority: [Retain navigation projections](../../../framework/packages/render.md).

Implementation entry points:

- `packages/render-engine-pixi/src/pixi-render-engine.ts`
- `packages/render-engine-pixi/src/pixi-batch-partitions.ts`

## edit-native-text

Apply editable native text with canonical save and replay behavior. Keep native text properties editable and retain them through save, Undo and Redo. Invalid text preparation does not silently rasterize editable content.

Authority: [Edit native text](editable-text.md).

Implementation entry points:

- `apps/asyra-design/src/properties/text.tsx`
- `apps/asyra-design/src/ai/design-actions.ts`

## show-session-status

Expose offline session state while preserving local editing and Reset. Show one initial unavailable-session notice and keep ordinary local editing usable. Unavailable transport does not mark the local editor unusable or fabricate remote persistence.

Authority: [Show document session status](socket-authoritative-document-session.md).

Implementation entry points:

- `apps/asyra-design/src/render-app/index.tsx`
- `apps/asyra-design/src/render-app/status-toast-stack.tsx`

## show-context-menu

Present eligible Group commands without mutation until an explicit command. Opening and closing the menu is read-only; an explicit eligible command uses the Group feature. Dismissal or unavailable command has no mutation.

Authority: [Present Group commands](../features/group-interactions.md).

Implementation entry points:

- `apps/asyra-design/src/app/group-context-menu.tsx`
- `apps/asyra-design/src/app/context-menu-session.ts`
- `apps/asyra-design/src/features/group-elements/index.ts`

## rollback-transaction

Reverse a failed transaction journal without creating committed History. Rejected validation restores owner-issued before state and preserves prior committed history. Non-rollbackable effects retain their explicit failure contract; no successful commit is fabricated.

Authority: [Rollback rejected mutations](../../../framework/packages/factory.md).

Implementation entry points:

- `packages/factory/src/data-transact.ts`

## group-history-members

Commit finite canonical members while retaining one open History group. Member transactions publish completed state before group closure; closure records one History action. A failed member cannot become a completed History action.

Authority: [Group finite History members](../../../framework/packages/factory.md).

Implementation entry points:

- `packages/factory/src/data-transact.ts`

## present-layer-hierarchy

Project canonical hierarchy as expandable Layers rows without changing document
structure. Row depth and visibility derive from canonical identities and local
expanded-container state. Disclosure changes only visibility; it does not delete,
reparent or move elements. Invalid canonical hierarchy is an explicit projection
error; non-container rows have no disclosure control.

Authority: [Canonical Layers projection](../features/group-interactions.md).

Implementation entry points:

- `apps/asyra-design/src/contents/contents-panel.tsx`
- `apps/asyra-design/src/contents/layer-hierarchy.ts`
- `apps/asyra-design/src/contents/Element.tsx`
- `apps/asyra-design/src/contents/GroupDisclosure.tsx`

## project-ui-membership

Project canonical scene membership into ordered UI rows. The Preset subscription
owns the derived parent/children index for one observer lifetime and the exact
published map and flat identities. Reuse unchanged rows across local mutations,
Undo and Redo; cold, replaced or invalidated sources rebuild before reuse. Preserve
canonical ordering and saved document content. Rendering and diagnostics do not
provide canonical membership or repair product state.

Authority: [Preset data-channel projection](../../../framework/packages/preset.md).

Implementation entry point:

- `packages/preset/src/subscriptions/data-channel.ts`
