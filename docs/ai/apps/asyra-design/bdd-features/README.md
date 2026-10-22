# BDD Features (Asyra Design)

These are app behavior contracts in Gherkin format.

References:

- implementation: `apps/asyra-design/src/features/*`
- verification: `apps/asyra-design/e2e/*.spec.ts`

## Current Feature Contracts

- `tool-switching.feature`
- `element-creation.feature`
- `selection.feature`
- `delete-element.feature`
- `properties.feature`
- `text-properties.feature`
- `text-canvas.feature`
- `viewport-navigation.feature`
- `pen-tool.feature`
- `undo-redo.feature`
- `group-interactions.feature`
- `group-context-menu.feature`
- `ai-agent-runtime.feature`
- `ai-conversational-drawing.feature`

## Text verification

`text-properties.feature` records the completed text interface contract from
PR #348. Its browser evidence belongs to `e2e/text-properties.spec.ts`, with
native-text persistence coverage in `e2e/native-text.spec.ts`. Shared shape Fill
behavior remains covered by `e2e/fill-patch.spec.ts`.

`text-canvas.feature` was written before the standalone Canvas implementation.
Its browser verification is `e2e/text-canvas.spec.ts`; session, event ordering,
teardown and projection work counts are covered by the text Canvas common-API,
feature and editor unit suites. Full automatic sizing modes, mixed-selection
typography, and collaboration draft recovery UI remain outside this task.
