# Unreleased Flow Inspector Decisions

## 2026-09-07 - First bounded behavioral proof

- Implement a local Phase 3 checkpoint around two real Factory flows and six
  obligations mapped to the existing transaction Inspector. Keep the full
  contract-evolution, remote CI, agent, and integration roadmap deferred.
- Bind each result to captured source, scenario, required cases, and an immutable
  attempt. Require exact runner evidence and demonstrate cross-flow regression
  with a test-only transform of real Factory code and unchanged assertions.
- Expose the same controlled action service through CLI and a separate local
  board. Preserve the static schema/workspace and keep Framework runtimes free
  of tool dependencies. No new package, runtime, license, or publication change.
- Add direct CI negative proof and permanent browser verification; keep local
  evidence artifacts out of release packages and Git history.

## 2026-09-07 - Preserve the existing canvas

- Correct the checkpoint's separate-board decision: the existing workspace
  canvas remains the primary UI. Retain its renderer, cards, routes, navigation,
  controls, and detail panel; compose verification through card context actions
  and a collapsible detail section.
- The server loads the adapter only in its target documents. Static files remain
  independent. Evidence updates must not rebuild the graph or reset its viewport.
- Prove geometry, selection, filtering, target isolation, retained evidence,
  contract mismatch rejection, and negative/recovery behavior in the real canvas.
