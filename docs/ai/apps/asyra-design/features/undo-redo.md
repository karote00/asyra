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
- During Factory Undo/Redo replay, new Undo/Redo shortcuts are ignored before
  Feature dispatch. They are not queued or replayed after settlement. Ordinary
  input keeps its existing behavior. The Core facade reads Factory state without
  a second busy flag; normal and failed settlement release it.
- The input mapping captures `detail.historyDirection` (`undo` or `redo`) when
  the shortcut is issued. Immediate execution consumes this immutable intent; later
  keyboard state or tool changes cannot reverse it. Missing or invalid direction
  performs no action. Model state is still read at normal Feature execution time.
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

## Immediate session interruption

History execution never enters the ordinary interaction queue. An idle command
starts immediately. During an active drag it uses the existing session
commit-current finalization, then replays Undo against that completed drag.
An already-running asynchronous session handler must settle before finalization;
queued unrelated interactions do not run ahead of history. Failed finalization
stops replay. Repeated history input during finalization or replay is not retained.
Ordinary mutations cannot interleave with the admitted operation. Runtime closure
prevents replay after teardown and waits for admitted work to settle.
