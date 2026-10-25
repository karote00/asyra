# @asyra/core

## Pending ordinary creation result handoff

```update-note
{
  "change": "ordinary-creation-result-handoff",
  "owner": "Core creation results",
  "summary": "Forward the existing Scene Tree frozen ordered creation result through Core and App without redundant ID array copies; verify actual saved-input flows and immutable receipts.",
  "sources": [
    "packages/core/src/apis/create-apis.ts",
    "packages/core/src/apis/scene-tree.ts",
    "packages/core/src/__tests__/scene-tree-api.test.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Creation inputs, ordered IDs, frozen isolation, history and retained-source recovery are unchanged. No migration or new model exchange is required."
}
```

## Pending computed snapshot selection

```update-note
{
  "change": "computed-snapshot-selection",
  "owner": "Core computed reads",
  "summary": "Carry computed field selection to the existing snapshot owner before materialization, avoiding omitted-field copies while retaining detached full reads and mechanical evidence behavior.",
  "sources": [
    "packages/core/src/apis/scene-tree.ts",
    "packages/core/src/apis/create-apis.ts",
    "packages/core/src/__tests__/scene-tree-api.test.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Existing Core query inputs and outputs, persistence and transaction behavior are unchanged. No new cache, model exchange or migration is required."
}
```

## Pending metadata child counts

```update-note
{
  "change": "metadata-child-count",
  "owner": "Core metadata facade",
  "summary": "Read child counts from the canonical Group membership owner without materializing full child snapshots during scalar metadata reads.",
  "sources": [
    "packages/core/src/core.ts",
    "packages/core/src/__tests__/app-runtime-facade.test.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Existing public metadata values and membership ownership remain unchanged. No persisted format or consumer migration is required."
}
```

## 0.5.7

### Patch Changes

- 22883b1: Support owner-coordinated runtime replacement for applications such as Asyra Sim.
  Quiesce feature work before retiring runtime-owned state, subscriptions, input
  bindings, render resources, and registration graphs. Retain preset installation
  cleanup and prevent callbacks from a retired runtime from affecting its successor.

  Expose Core document-load preflight and validated renderer resizing through the
  public facade. Applications can validate a replacement document before retiring
  the active runtime, while ordinary document loading retains its existing history
  ownership contract.

- Updated dependencies [22883b1]
  - @asyra/factory@0.5.4
  - @asyra/feature-system@0.5.4
  - @asyra/input-system@0.5.5
  - @asyra/props-manager@0.5.4
  - @asyra/render@0.5.7
  - @asyra/scene-tree@0.5.4
  - @asyra/selection@0.5.3
  - @asyra/system-context@0.5.3
  - @asyra/ui-context@0.5.4
  - @asyra/utils@0.5.2
  - @asyra/persistence@0.5.3
  - @asyra/reactive-events@0.5.4

## 0.5.6

### Patch Changes

- Updated dependencies
  - @asyra/render@0.5.6

## 0.5.5

### Patch Changes

- Republish the affected Framework packages with publishable internal dependency
  ranges instead of monorepo-only `workspace:*` metadata.
- Updated dependencies
  - @asyra/factory@0.5.3
  - @asyra/feature-system@0.5.3
  - @asyra/input-system@0.5.4
  - @asyra/persistence@0.5.2
  - @asyra/props-manager@0.5.3
  - @asyra/reactive-events@0.5.3
  - @asyra/render@0.5.5
  - @asyra/scene-tree@0.5.3
  - @asyra/selection@0.5.2
  - @asyra/system-context@0.5.2
  - @asyra/ui-context@0.5.3

## 0.5.4

### Patch Changes

- Exceptional synchronized patch release for the fixed 19-package Framework set.
- Updated dependencies
  - @asyra/factory@0.5.2
  - @asyra/feature-system@0.5.2
  - @asyra/input-system@0.5.3
  - @asyra/persistence@0.5.1
  - @asyra/props-manager@0.5.2
  - @asyra/reactive-events@0.5.2
  - @asyra/render@0.5.3
  - @asyra/render-engine@0.5.1
  - @asyra/scene-tree@0.5.2
  - @asyra/selection@0.5.1
  - @asyra/system-context@0.5.1
  - @asyra/ui-context@0.5.2
  - @asyra/utils@0.5.1

## 0.5.3

### Patch Changes

- Updated dependencies [c714696]
  - @asyra/input-system@0.5.2

## 0.5.2

### Patch Changes

- Updated dependencies [889f7b4]
  - @asyra/factory@0.5.1
  - @asyra/props-manager@0.5.1
  - @asyra/reactive-events@0.5.1
  - @asyra/render@0.5.2
  - @asyra/scene-tree@0.5.1
  - @asyra/feature-system@0.5.1
  - @asyra/input-system@0.5.1
  - @asyra/ui-context@0.5.1

## 0.5.1

### Patch Changes

- 6559efc: Route app runtime and collaboration through Core, restore fast authoritative collaboration synchronization, and refresh the standalone Asyra Design template.

  Initialize document connection state at `none`, publish only actual state changes, and notify every connection transition except the initial `none` to `connected` transition.

- Updated dependencies [6559efc]
  - @asyra/render@0.5.1

## 0.5.0

### Minor Changes

- Exceptional synchronized minor release for the fixed 19-package Framework set.

### Patch Changes

- Updated dependencies
  - @asyra/factory@0.5.0
  - @asyra/feature-system@0.5.0
  - @asyra/input-system@0.5.0
  - @asyra/persistence@0.5.0
  - @asyra/props-manager@0.5.0
  - @asyra/reactive-events@0.5.0
  - @asyra/render@0.5.0
  - @asyra/render-engine@0.5.0
  - @asyra/scene-tree@0.5.0
  - @asyra/selection@0.5.0
  - @asyra/system-context@0.5.0
  - @asyra/ui-context@0.5.0
  - @asyra/utils@0.5.0

## 0.2.5

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/factory@0.2.5
  - @asyra/input-system@0.2.5
  - @asyra/interaction-core@0.2.5
  - @asyra/props-manager@0.2.5
  - @asyra/reactive-events@0.2.5
  - @asyra/render@0.2.5
  - @asyra/scene-tree@0.2.5
  - @asyra/selection@0.2.5
  - @asyra/system-context@0.2.5
  - @asyra/utils@0.2.5

## 0.2.4

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/factory@0.2.4
  - @asyra/input-system@0.2.4
  - @asyra/interaction-core@0.2.4
  - @asyra/props-manager@0.2.4
  - @asyra/reactive-events@0.2.4
  - @asyra/render@0.2.4
  - @asyra/scene-tree@0.2.4
  - @asyra/selection@0.2.4
  - @asyra/system-context@0.2.4
  - @asyra/utils@0.2.4

## 0.2.3

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/factory@0.2.3
  - @asyra/input-system@0.2.3
  - @asyra/interaction-core@0.2.3
  - @asyra/props-manager@0.2.3
  - @asyra/reactive-events@0.2.3
  - @asyra/render@0.2.3
  - @asyra/scene-tree@0.2.3
  - @asyra/selection@0.2.3
  - @asyra/system-context@0.2.3
  - @asyra/utils@0.2.3

## 0.2.2

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/factory@0.2.2
  - @asyra/input-system@0.2.2
  - @asyra/interaction-core@0.2.2
  - @asyra/props-manager@0.2.2
  - @asyra/reactive-events@0.2.2
  - @asyra/render@0.2.2
  - @asyra/scene-tree@0.2.2
  - @asyra/selection@0.2.2
  - @asyra/system-context@0.2.2
  - @asyra/utils@0.2.2

## 0.2.1

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/factory@0.2.1
  - @asyra/input-system@0.2.1
  - @asyra/interaction-core@0.2.1
  - @asyra/props-manager@0.2.1
  - @asyra/reactive-events@0.2.1
  - @asyra/render@0.2.1
  - @asyra/scene-tree@0.2.1
  - @asyra/selection@0.2.1
  - @asyra/system-context@0.2.1
  - @asyra/utils@0.2.1
