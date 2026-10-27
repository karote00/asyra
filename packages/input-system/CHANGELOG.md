# @asyra/input-system

## Pending - Office input and spatial materials

```update-note
{
  "change": "office-input-and-spatial-materials",
  "owner": "Framework - @asyra/input-system",
  "summary": "Support held keyboard control or optional spatial material effects used by the Office preview, preserving existing defaults.",
  "sources": [
    "packages/input-system/src/__tests__/held-keyboard.test.ts",
    "packages/input-system/src/__tests__/input-system.test.ts",
    "packages/input-system/src/__tests__/runtime-reset.test.ts",
    "packages/input-system/src/event-mappings.ts",
    "packages/input-system/src/input-system.ts"
  ],
  "impact": "integration",
  "guides": [
    "docs/public/updates/held-input-and-spatial-materials-r1.md"
  ],
  "reason": "Optional APIs require explicit consumer registration and preservation of app-owned policies; see the adoption guide."
}
```

## 0.5.5

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
  - @asyra/utils@0.5.2
  - @asyra/reactive-events@0.5.4

## 0.5.4

### Patch Changes

- Republish the affected Framework packages with publishable internal dependency
  ranges instead of monorepo-only `workspace:*` metadata.
- Updated dependencies
  - @asyra/reactive-events@0.5.3

## 0.5.3

### Patch Changes

- Exceptional synchronized patch release for the fixed 19-package Framework set.
- Updated dependencies
  - @asyra/reactive-events@0.5.2
  - @asyra/utils@0.5.1

## 0.5.2

### Patch Changes

- c714696: Make InputSystem import and construction DOM-neutral, add explicit browser host
  and pointer-target lifecycle APIs, and provide symmetric listener cleanup.

## 0.5.1

### Patch Changes

- Updated dependencies [889f7b4]
  - @asyra/reactive-events@0.5.1

## 0.5.0

### Minor Changes

- Exceptional synchronized minor release for the fixed 19-package Framework set.

### Patch Changes

- Updated dependencies
  - @asyra/reactive-events@0.5.0
  - @asyra/utils@0.5.0

## 0.2.5

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/reactive-events@0.2.5
  - @asyra/utils@0.2.5

## 0.2.4

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/reactive-events@0.2.4
  - @asyra/utils@0.2.4

## 0.2.3

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/reactive-events@0.2.3
  - @asyra/utils@0.2.3

## 0.2.2

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/reactive-events@0.2.2
  - @asyra/utils@0.2.2

## 0.2.1

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/reactive-events@0.2.1
  - @asyra/utils@0.2.1
