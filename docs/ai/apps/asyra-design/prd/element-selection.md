# PRD: Element Selection

## Problem

Users need predictable single-selection behavior from both canvas and layer/content list.

## Goals

- reliable select/deselect behavior
- direct drag-to-move for selected canvas elements
- consistent panel updates from selection state
- stable behavior with path editing context

## Functional Requirements

1. Click element on canvas -> select element.
2. Click locked element on canvas -> no selection change.
3. Click hidden element on canvas -> no selection change.
4. Click empty canvas -> clear selection.
5. Drag empty canvas -> area-select intersecting elements.
6. Click element row in contents panel -> select that element.
7. Click empty area in contents panel -> clear selection.
8. Shift-modified selection toggles element membership.
9. Path editing mode should keep focus and block regular selection start logic where applicable.
10. Hover state should resolve by visible element geometry hit-test on mouse
    move, and selection should consume that hover target.
11. Drag start on an already selected element in select mode should move selected element(s).
12. Drag move should ignore micro pointer jitter below app-defined movement threshold.
13. Drag start on an unselected unlocked element in select mode should select and move that element.
14. Shift-drag on empty canvas adds area selection to existing selection.
15. Area selection excludes locked or hidden elements.

## Constraints

- renderer geometry hit testing used by app (`elementApis.getElementIdAtClientPos`)
- selection feature wraps selection mutations in transaction boundary
- move behavior owns drag-to-position updates through `move-elements` feature and `elementApis.setElementPositions(...)`

## Success Criteria

- `selection.spec.ts` passes
- property panel visibility follows selection state correctly

## References

- `apps/asyra-design/src/features/selection/feature.ts`
- `apps/asyra-design/src/features/hover-element/index.ts`
- `apps/asyra-design/src/common-apis/selection.ts`
- `apps/asyra-design/src/common-apis/element/apis.ts`

## Container double-click selection

In Select mode, an unmodified double-click with exactly one selected container
selects the immediate child on the frontmost renderer-hit descendant's canonical
parent chain. Container eligibility uses the registered Core container capability,
including Group, Frame and custom Group-derived types. Repeated double-clicks
enter one level per gesture. The normal preceding click selects an unselected
outer container; no separate gesture timer or selection cache is needed.

Missing, stale or invalid hierarchy, a self/outside hit, a locked or hidden path,
an empty position, multiple selection, modifiers, other tools or active path
editing do not initiate drill-down. No descendant geometry or render ancestry
may substitute for canonical hierarchy. Successful drill-down consumes the event;
a selected vector can enter its existing path editing on a later double-click.
Selection is local UI state; the gesture does not mutate document geometry,
parentage, material, stored IDs or shared publication. Existing selection history
policy is retained.

Acceptance: executable hierarchy/feature tests plus real browser double-clicks
cover Group, Frame, custom inheritance, nested progression, overlapping children,
empty/no-op cases, vector editing, normal clicks, modifier selection and dragging.
