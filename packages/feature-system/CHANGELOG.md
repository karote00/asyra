# @asyra/feature-system

## 0.5.4

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

## 0.5.3

### Patch Changes

- Republish the affected Framework packages with publishable internal dependency
  ranges instead of monorepo-only `workspace:*` metadata.
- Updated dependencies
  - @asyra/reactive-events@0.5.3

## 0.5.2

### Patch Changes

- Exceptional synchronized patch release for the fixed 19-package Framework set.
- Updated dependencies
  - @asyra/reactive-events@0.5.2
  - @asyra/utils@0.5.1

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
