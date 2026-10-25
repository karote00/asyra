# @asyra/utils

## Pending computed snapshot selection

```update-note
{
  "change": "computed-snapshot-selection",
  "owner": "Shared element observation contract",
  "summary": "Carry computed field selection to the existing snapshot owner before materialization, avoiding omitted-field copies while retaining detached full reads and mechanical evidence behavior.",
  "sources": [
    "packages/utils/src/sceneTree/instanceTypes.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Existing Core query inputs and outputs, persistence and transaction behavior are unchanged. No new cache, model exchange or migration is required."
}
```

## Pending - Office input and spatial materials

```update-note
{
  "change": "office-input-and-spatial-materials",
  "owner": "Framework - @asyra/utils",
  "summary": "Support held keyboard control or optional spatial material effects used by the Office preview, preserving existing defaults.",
  "sources": [
    "packages/utils/src/types/input-system.ts"
  ],
  "impact": "integration",
  "guides": [
    "docs/public/updates/held-input-and-spatial-materials-r1.md"
  ],
  "reason": "Optional APIs require explicit consumer registration and preservation of app-owned policies; see the adoption guide."
}
```

## 0.5.2

### Patch Changes

- 22883b1: Support owner-coordinated runtime replacement for applications such as Asyra Sim.
  Quiesce feature work before retiring runtime-owned state, subscriptions, input
  bindings, render resources, and registration graphs. Retain preset installation
  cleanup and prevent callbacks from a retired runtime from affecting its successor.

  Expose Core document-load preflight and validated renderer resizing through the
  public facade. Applications can validate a replacement document before retiring
  the active runtime, while ordinary document loading retains its existing history
  ownership contract.

## 0.5.1

### Patch Changes

- Exceptional synchronized patch release for the fixed 19-package Framework set.

## 0.5.0

### Minor Changes

- Exceptional synchronized minor release for the fixed 19-package Framework set.

## 0.2.5

### Patch Changes

- Auto-patch all packages.

## 0.2.4

### Patch Changes

- Auto-patch all packages.

## 0.2.3

### Patch Changes

- Auto-patch all packages.

## 0.2.2

### Patch Changes

- Auto-patch all packages.

## 0.2.1

### Patch Changes

- Auto-patch all packages.
