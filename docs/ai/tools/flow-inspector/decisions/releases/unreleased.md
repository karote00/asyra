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

## 2026-09-07 - Complete the bounded Phase 3 proof

- Admit explicit case-backed conditional handoffs before execution. Extend the
  existing six Factory obligations with five configuration-only negative
  transformations of captured production source and an exact recovery proof.
- Bind format-2 attempts to source/mapping/architecture/configuration versions,
  runner environment, and artifact fingerprints. Keep historical format-1
  records without inventing stronger provenance. Admit retained evidence once;
  repeated reads do not recapture source or recompute inventory/history ordering.
- Require explicit, exact-base review for test-name mapping changes; preserve
  all obligations and atomically retain each decision with its accepted revision.
  The first local baseline remains trusted. General evolution and protected CI
  accepted-base policy stay in Phase 4.
- Share actions and evidence between the original canvas and an attached CLI.
  Retain retry identities across restart, and verify named artifact contents
  before serving. Preserve all existing canvas geometry and static compatibility.
- Extend direct CI and permanent browser coverage to the full proof and mapping
  review. No new dependencies, Framework runtime changes, package version,
  remote hosting, source-writing agent, or connector is introduced.

## 2026-09-07 - Close Phase 3 independently of Phase 4

- Context: PR #165 merged the bounded Core Proof; all eight checks on its exact
  pre-merge HEAD succeeded. The existing plan also owns unfinished Phase 4.
- Decision: close only Phase 3 in
  [its completed record](../../plans/completed/flow-inspector-phase-3-core-proof-closeout.md).
  Retain the combined plan as active and `CORE_PROOF.md` as the living contract.
- Consequences: preserve all prior decisions and local-proof limitations.
  Required CI enforcement is still unproven: the effective GitHub main rules
  have no required status checks. Phase 4 must address that explicit gap.
- Release boundary: this closeout changes no version, Changeset, tag, or release.


## 2026-09-07 - Activate Phase 4 with an explicit delivery blocker

- Context: the merged Phase 3 proof remains limited to two Factory flows and six
  behavioral obligations. Its completed record and prior decisions stay intact.
- Decision: extend the living contract with immutable version history, explicit
  split/merge/retirement review, accepted-base CI evidence admission, common
  local actions, and baseline/time-bound manager snapshots on the original board.
  Actual negative runtime cases prove rejection and recovery; provider success
  cannot replace assertions or source provenance.
- Consequences: changed versions invalidate prior results; reported work,
  execution, verification and delivery remain separate. The effective GitHub
  `protect-main` ruleset lacks required status checks and independent verifier
  protection. The CI command is explicitly a trial and full Phase 4 remains open.
- Closeout decision: do not create a Phase 4 completed record or move this combined
  plan while mandatory enforcement is unverified. Follow the
  [operational guide](../../../../../../tools/flow-inspector/control-plane/README.md#github-enforcement-gap)
  for the necessary external setup and remaining acceptance evidence.
- Release boundary: no package version, dependency, tag, release, deployment, or
  Phase 5/6 capability is introduced.
