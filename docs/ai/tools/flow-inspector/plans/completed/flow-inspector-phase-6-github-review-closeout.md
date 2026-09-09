# Phase 6 GitHub PR Review - Bounded Closeout

Date: 2026-09-09. Initial base: merged PR #168, `cd9d4292e`.
Synchronized main: `0939c2fcc36cdf2710601a78f2f5d1d2dbf30f1b`.
Delivery: PR #177, branch `codex/flow-inspector-phase-6`.

## Completed boundary

The selected local owner can prepare an exact existing candidate preview,
explicitly confirm its GitHub PR, and refresh HEAD-bound review/check observations
through the existing broker. Board, API and CLI share the durable record and
audit. The trusted adapter alone owns fixed-repository GitHub operations;
candidate sandbox, formal verification, accepted mapping and provider dispatch
remain separate. The user changed creation from draft to ready for review so
repository CI runs. Older draft previews require fresh preparation.

This closes only the single-local-user, single-repository, single-candidate
review integration. It does not close full Phase 5 or Phase 6. GitHub submission
and successful checks cannot accept a baseline. The exact owner steps and
product cases remain in the living Inspector and `PR_REVIEW.md`.

## Actual GitHub acceptance

After offline validation and explicit user authorization, the product adapter
created ready-for-review PR #179 in `karote00/asyra`. Task
`f5b02c1b-93ee-4e12-86c9-b989c608dbf0`, attempt
`677e6026-9283-4606-8196-d495b47672d3`, owns branch
`codex/flow-review/f5b02c1b-93ee-4e12-86c9-b989c608dbf0/677e6026-9283-4606-8196-d495b47672d3`.
Its source HEAD is `9c2db82b4631d5f5478d5fba13960677e0578fab`; remote candidate
HEAD is `e793ca41c4fa7ab6ac5f799dbe69c344c9c883a0`.
Preview digest: `1c0a0c548f9dbbb2d60e3149de9a1a3b0601829bb0f18b428562849ffa88c9bd`.

The demonstration adapter added only `// Local candidate for human review` to
`packages/factory/src/data-transact.ts`, then the real local sandbox verifier
passed all six obligations. This is deterministic source evidence, not a new
model-produced candidate. The historical Sol candidate was read-only inspected;
its captured lockfile did not match current main, so it was not relabeled or
reconstructed as current evidence. No model request was made.

Repeated confirmation and an owned-service restart retained exactly one remote
PR and the same delivery/audit. Read-only GitHub query confirmed that identity.
Accepted mapping remained unchanged. Earlier base advancement correctly refused
the obsolete candidate before effects, preserving its records. The live Board
replay proved API/CLI identity and captured desktop 1600x1100, tablet 820x1180,
and narrow 390x844 source and status views; screenshots were inspected.

The candidate PR's actual CI run `34332746088` failed at Require Changeset
record. Its admitted scope cannot edit Changesets, tests or gates. The Board
therefore reports local verification passed and GitHub checks failed for the
same HEAD. This is a demonstrated review/check failure path, not a green
candidate-delivery or merge claim. The implementation PR has its own normal
package patch record. Neither PR is merged by this work.

Local artifacts remain in `tmp/flow-inspector/phase6/` and
`tmp/flow-inspector/visual-review/github-live-f5b02c1b-93ee-4e12-86c9-b989c608dbf0/`.
The live service uses the existing `tmp/flow-inspector/runs` store. Reproduce
read-only live replay with `FLOW_PROOF_URL`, `FLOW_REVIEW_REPOSITORY`,
`FLOW_PROOF_BROWSER_CHANNEL=chrome` and `FLOW_LIVE_REVIEW_TASK_ID` set to this
task, selecting `retained live GitHub review` in `board.test.cjs`.
A fresh clone runs formal offline fixtures; it does not recreate live provenance.

## Validation

The synchronized implementation passed 185 control-plane cases, 12 React cases,
100 static/package contracts, all nine applicable Board cases, and a separate
live GitHub replay before and after reading real CI failure. The two live-record
Board cases are opt-in; historical provider replay was not invoked for this slice.
The seven-run proof preserves two Factory flows, five negative scenarios and
six obligations. Naming, typecheck and build passed; lint has zero errors and
79 existing warnings. Latest implementation PR HEAD checks must pass before
review notification; candidate CI failure is reported separately.

Permanent cases cover ineligible/stale/dirty source, exact preview confirmation,
retries/restart/deduplication, uncertain effects and query-only reconciliation,
authentication/permission/rate limits/network errors, external PR edits,
open/closed/merged observations, HEAD/check invalidation and unchanged accepted
baseline. Only the open-PR creation/read/restart/check-failure path was exercised
against real GitHub. Closed/merged/HEAD-edit and transport faults use explicitly
offline fixtures; no live merge or fault-injection claim is made.

## Remaining boundaries

The historical unresolved provider request
`98e706a5-ea09-4c6e-a1f5-57bd767b6c97` remains intact in its original store and
continues blocking provider dispatch. Delivery does not reconcile it or authorize
a new provider store. Independent provider reconciliation, hard token/cost limits,
required-check protection, protected verifier/issuer and remote evidence transport,
real blocking-merge demonstration, ticket/team/tenant/hosting workflows and
checkout-independent dynamic service remain deferred.

Dynamic control-plane execution still requires Asyra. The existing package patch
Changeset stays outside Framework bulk release. Closeout applies no version,
tag, publication, protection or deployment change. Main synchronization affects
only this feature worktree; no original checkout or other server is changed.
