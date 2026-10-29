# @asyra/asyra-design

## Unreleased

- Keep the preparation-failure E2E switch disabled across recovery reloads,
  independent of whether the browser retains the instrumented module. Runtime
  behavior and test deadlines are unchanged.

```update-note
{
  "change": "recovery-fault-release-across-reloads",
  "owner": "@asyra/asyra-design",
  "summary": "Make recovery E2E fault release independent of module cache eviction.",
  "reason": "The old page initialization re-enabled the injected fault after recovery when an instrumented module remained available.",
  "impact": "no-action",
  "sources": ["apps/asyra-design/e2e/collaboration.spec.ts"],
  "guides": []
}
```

## 0.2.5

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/core@0.2.5
  - @asyra/design-system@0.2.5
  - @asyra/reactive-events@0.2.5
  - @asyra/ui-context@0.2.5
  - @asyra/utils@0.2.5

## 0.2.4

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/core@0.2.4
  - @asyra/design-system@0.2.4
  - @asyra/reactive-events@0.2.4
  - @asyra/ui-context@0.2.4
  - @asyra/utils@0.2.4

## 0.2.3

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/core@0.2.3
  - @asyra/design-system@0.2.3
  - @asyra/reactive-events@0.2.3
  - @asyra/ui-context@0.2.3
  - @asyra/utils@0.2.3

## 0.2.2

### Patch Changes

- Updated dependencies
  - @asyra/core@0.2.2
  - @asyra/design-system@0.2.2
  - @asyra/reactive-events@0.2.2
  - @asyra/ui-context@0.2.2
  - @asyra/utils@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies
  - @asyra/core@0.2.1
  - @asyra/design-system@0.2.1
  - @asyra/reactive-events@0.2.1
  - @asyra/ui-context@0.2.1
  - @asyra/utils@0.2.1
