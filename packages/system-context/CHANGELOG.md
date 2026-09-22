# @asyra/system-context

## 0.5.3

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

## 0.5.2

### Patch Changes

- Republish the affected Framework packages with publishable internal dependency
  ranges instead of monorepo-only `workspace:*` metadata.

## 0.5.1

### Patch Changes

- Exceptional synchronized patch release for the fixed 19-package Framework set.
- Updated dependencies
  - @asyra/utils@0.5.1

## 0.5.0

### Minor Changes

- Exceptional synchronized minor release for the fixed 19-package Framework set.

### Patch Changes

- Updated dependencies
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
