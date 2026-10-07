# Feature: Selection

## Sources

- `src/features/selection/feature.ts`

## Selection Feature

### Trigger

- event: `input.drag`
- mode: session (`onStart` used)
- priority: `5`
- exclusive: `false`

### Behavior

- active only when primary tool is `select`
- if path editing mode is active, selection by drag start is blocked
  - this prevents selecting non-editing elements while path editing is active
- if drag start is on an unlocked element (selected or not), move ownership is handled by `move-elements` (higher-priority exclusive feature)
- if drag start is inside the current selection bounds, move ownership is handled by `move-elements` (even if the hit-test target is unselected)
- resolves hovered element id from render hover state, and may confirm the
  drag-start target with renderer geometry hit testing
- locked or hidden elements are ignored for canvas click selection
- with Shift: toggle selection
- without Shift: replace selection
- drag start on empty canvas: begin area selection session
- drag update on empty canvas: update area selection bounds and immediately
  project the non-undoable preview selection set before pointer release
- drag end on empty canvas: select elements intersecting bounds (Shift toggles membership)
- area selection excludes locked or hidden elements
- click-only empty hit: clear selection

### Transaction handling

- session cancel policy is `commit-current`
- finite selection mutations use `runTransaction`; the drag session remains one
  outer transaction boundary
- user interruption clears runtime-only area-selection state through `onEnd`
  and commits the current selection as one undoable action
- handler failure or timeout uses `onCancel` cleanup and Factory reverses
  rollbackable canonical selection changes without creating undo history

## Path Editing Interaction

- selection flow calls path-editing cleanup when selection no longer matches editing vector
- keeps editing focus when selected vector remains the same single selection

## Container double-click

`selectContainerChild` uses `InputSystemEvents.INPUT_DOUBLE_CLICK` as an exclusive
one-shot Feature at priority 100, before vector editing at priority 90. It accepts
one selected registered container in Select mode with no modifiers or active path
editing. `elementApis.isContainerType` delegates to Core registration; no fixed
Group/Frame name list exists.

`resolveContainerChildAtClientPos` reads the renderer hit ID and canonical
hierarchy projection once per gesture. The hierarchy controller validates that
projection and walks parent IDs to find the immediate child of the selected
container. Missing, self/outside, locked, hidden or stale paths return null.
Successful `selectionApis.selectElements` consumes the event. No document writes,
new subscriptions, timers or retained hierarchy state are introduced. See the
selection PRD and BDD scenarios for interaction and acceptance requirements.
