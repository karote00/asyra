# Feature: Undo/Redo

## Source

- `src/features/undo-redo/index.ts`
- `src/common-apis/history.ts`

## Trigger

- event: `input.shortcut.undoredo`
- priority: `100`
- exclusive: `true`

## Behavior

- Shift + Undo shortcut -> redo
- Undo shortcut without Shift -> undo
- Ordinary history controls await the reusable framework
  render policy, whose default mode is `progressive`.
- Progressive replay preserves exact recorded progressive boundaries. For
  immediate source publications it keeps every publication ordered but
  coalesces completed projection into render slices with a default budget of
  1,024 distinct canonical ids; the complete operation remains one History
  transition and one outer transaction.
- An explicit `atomic` option skips intermediate host/paint yields for a bulk
  interaction whose next dependent mutation must wait for the complete
  canonical mutation and projection.
- An explicit Agent mutating turn correlates its committed canonical action id
  through the existing history projection. Completion messages remain in the
  conversation; no duplicate canvas Message Bar is mounted.
- Ordinary toolbar and keyboard Undo/Redo remain available. A later committed
  action or a second Undo invalidates older AI-specific correlation.

## Contract

User-visible action grouping depends on how each mutation path groups transactions.
When refactoring features/common APIs, keep intended undo granularity stable.

The AI projection observes canonical action/undo/redo events and invokes only
`historyApis`. It does not own or copy Factory's history stack, inverse events,
canonical snapshots, or replay patches. Failed, cancelled, denied,
provider-disabled, unsupported, and zero-mutation AI turns create no new
actionable history control. While a requested replay is pending, the projection
rejects a second request; its Undo/Redo direction changes only after the
canonical completion event. The App shell does not subscribe through a toast.
