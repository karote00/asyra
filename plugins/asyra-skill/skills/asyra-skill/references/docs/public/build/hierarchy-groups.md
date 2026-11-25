<!-- Generated from docs/public/build/hierarchy-groups.md; edit the source and regenerate. External links may describe a newer revision. -->

# Build hierarchy and Group behavior

Scene Tree owns canonical parent, child order, identity, and subtree lifecycle.
Your app owns what grouping means to the product and how a command is exposed.
The official Preset supplies optional Group defaults and geometry adapters.

## Prerequisites

- registered container and child component definitions
- `@asyra/core` and `@asyra/scene-tree`
- `@asyra/preset` when using the official Group adapters
- one app common API and transaction boundary for hierarchy commands

## Ownership

Scene Tree validates parent membership, final target index, cycles, ordering,
identity, subtree removal, and restoration. Props Manager independently owns
property graphs. Core coordinates atomic cross-owner operations. Preset owns
official Group defaults and basic bounds/coordinate behavior. The app owns
command eligibility, selection policy, UI, and domain constraints.

## Public APIs

The generated Asyra Design common API composes these public surfaces:

- `groupElements(core, elementIds, options)` from `@asyra/preset`
- `ungroupElement(core, groupId, options)` from `@asyra/preset`
- `moveElementsWithGroupGeometry(core, request, options)` from
  `@asyra/preset`
- `core.removeSubtree(elementId, options)` wrapped by public
  `runTransaction(...)`
- `MoveHierarchyRequest`, `MoveHierarchyResult`, and `RemoveSubtreeResult` from
  `@asyra/utils`

Lower-level Scene Tree methods such as `moveElements(...)` retain canonical
owner semantics. Apps should use Core or their established app common API for
cross-owner work.

## Flow

1. Resolve selected ids and app command eligibility.
2. Enter one app transaction.
3. Submit an ID-based group, ungroup, move, or subtree request.
4. Let Scene Tree validate the complete request before the first mutation.
5. Preserve entity identity; moving is not delete-and-recreate.
6. Project canonical hierarchy into layers and UI after commit.
7. Replay the same owner evidence for rollback, Undo, Redo, and collaboration.

The generated app keeps this boundary in
<a href="https://github.com/karote00/asyra/blob/main/create-app/asyra-design/template/src/common-apis/hierarchy.ts" target="_blank" rel="noopener noreferrer">`src/common-apis/hierarchy.ts`</a>
and formal hierarchy tests beside that common API. The
[custom schema guide](custom-schema.md) explains the component/relation
prerequisite; the generated reference product owns the full hierarchy behavior
proof.

## Expected result

A valid operation preserves exact identity, one-parent membership, target child
order, and owner relations. A subtree removal/restoration retains original
parent, index, child order, raw data, and property relations. An invalid id,
cycle, stale replay artifact, or duplicate membership rejects the whole request
without a partial prefix.

When official Group Preset capability is not composed, the app may provide its
own registered container behavior; it must not call missing Preset adapters or
silently create a visually grouped but canonically flat result.

## Validate

```shell
yarn workspace @asyra/scene-tree test:local
yarn workspace @asyra/preset test:local
yarn test:workspaces:local
```

Test contiguous and non-contiguous moves, same-parent reorder, cross-parent
move, cycle rejection, group/ungroup, subtree delete/restore, rollback,
Undo/Redo, save/load, and collaboration replay.

## Forbidden shortcuts

- no direct `parentId` or `children` mutation
- no delete-and-recreate move
- no DOM order or render-layer order as canonical hierarchy
- no partial apply before complete request validation
- no app-specific grouping policy inside Scene Tree
- no visual patch that hides a canonical order failure

## Canonical sources

- <a href="https://github.com/karote00/asyra/blob/main/docs/ai/framework/packages/scene-tree.md" target="_blank" rel="noopener noreferrer">Scene Tree contract</a>
- <a href="https://github.com/karote00/asyra/blob/main/docs/ai/framework/packages/core.md" target="_blank" rel="noopener noreferrer">Core contract</a>
- <a href="https://github.com/karote00/asyra/blob/main/docs/ai/apps/asyra-design/features/group-interactions.md" target="_blank" rel="noopener noreferrer">Asyra Design Group behavior</a>
- <a href="https://github.com/karote00/asyra/blob/main/create-app/asyra-design/template/src/common-apis/hierarchy.ts" target="_blank" rel="noopener noreferrer">Generated app hierarchy API</a>

## Next

- [Read the Scene Tree guide](../reference/packages/scene-tree.md)
- <a href="https://github.com/karote00/asyra/blob/main/docs/public/cases/asyra-design.md" target="_blank" rel="noopener noreferrer">Study the complete Asyra Design product</a>
