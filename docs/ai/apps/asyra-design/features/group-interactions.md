# Feature: Group Interactions

## Sources

- `src/features/group-elements/index.ts`
- `src/controllers/group-commands.ts`
- `src/app/group-context-menu.tsx`
- `src/contents/layer-hierarchy.ts`

## Trigger

- event: `input.shortcut.group`
- visible commands: canvas Context Menu `Group` and `Ungroup` rows
- mode: one-shot execution
- priority: `100`
- exclusive: `true`

## Behavior

- `Meta/Ctrl+G` groups the current eligible sibling selection.
- `Meta/Ctrl+Shift+G` ungroups one selected official Group.
- Editable targets bypass the shortcut.
- One command owns one outer transaction, canonical hierarchy operation, undo
  commit, grouped publication, and post-operation selection.
- Group selects the created official Group; Ungroup selects the canonical
  children returned by Preset/Scene Tree, including the empty result.
- Layers rows are projected from canonical `flattenedElementIds` and
  `elementDataMap`; Container collapse state is UI-local. Disclosure eligibility uses the public `elementApis.isContainerType` query backed by Core registration, including Group, Frame and custom components registered with `isContainer`. The panel must not maintain its own container type allowlist. Disclosure eligibility does not change Group-only drag/drop admission.

## Boundaries

- The app owns command availability, selection intent, Context Menu routing,
  shortcuts, collapsed state, and visible row projection.
- The Layers/Contents header owns no Group or Ungroup command buttons.
- Preset owns the official Group operation adapter and basic 2D
  coordinate/bounds normalization.
- Scene Tree remains the only parent membership, child order, subtree, cycle,
  and hierarchy validation/mutation owner.
- Factory owns transaction, rollback, undo/redo, and grouped publication.
- Render projects the committed canonical hierarchy without fallback state.

## Non-Goals

- No second Group component registration.
- No Frame/custom-container grouping, auto-layout, resize/scaling, clipping,
  symbols, or Render-only hierarchy repair.
