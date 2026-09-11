# Trusted Candidate Changeset Delivery - Bounded Closeout

Completed: 2026-09-11. Delivery: PR #180, `codex/flow-inspector-trusted-changeset`.
Rebased main: `5a20e5a8ddb290648e46379e8224700c59f5e733`.
Verified implementation: `cc7161d6a974015ba9129ac412b7606ea35ee759`.

## Completed boundary

The existing `prepare-pr-review` owner prepares one fixed `@asyra/factory`
patch Changeset from captured public package ownership. `deliver-github-review`
creates only the exact confirmed runtime source and owner metadata. The Board
separates source obligations, metadata validation and GitHub observations, while
API and CLI consume the same retained record and audit. The living owner
contracts and product cases remain in `PR_REVIEW.md` and the core-proof Inspector.

Candidate writes remain runtime-only. Complete source, metadata, ownership,
base, task/attempt and PR content bind confirmation. Dirty or stale inputs reject;
duplicates and restart retain one delivery; uncertain effects reconcile by query.
Neither metadata validation nor successful GitHub checks accept a baseline.

## Actual acceptance

The product adapter created normal test PR #189 from base `5a20e5a8` after
explicit confirmation. Task `8288b2d1-3d3e-4989-bb20-db6e079c9396`, attempt
`1e1fb80f-2030-463d-9bd2-4fd6c0ab9d57`, preview digest
`03902b346638842474c3ac4931eb01024c8e1278c96c1fa2a9951f095fb5abc8`.
Remote HEAD: `37fb440e7375c4542a3f65382d22c328960e7a8d`.

This was a deterministic demonstration, not model output: a comment in
`packages/factory/src/data-transact.ts` plus the trusted owner Changeset.
The remote inventory, both file contents, title, body and HEAD matched the
confirmed preview. All six real local sandbox obligations passed separately
from metadata validation. Duplicate confirmation and service restart retained
the exact record and audit without another PR.

All five checks passed on that unchanged HEAD: validate and release-readiness
in run `34602186418`, both E2E jobs in `34602186501`, and production-artifact-tests
in `34602186455` attempt 2. Attempt 1 of the production test timed out in the
existing Sim analysis budget (40/46 pairs); its unchanged-HEAD rerun passed.
No budget, gate or deployment setting was changed. The current main inherited
PR #186's production verification workflow. Historical PR #182's Vercel rate
limit failures remain recorded and are not relabeled as a pass.

The strict `FLOW_LIVE_REVIEW_REQUIRE_PASSED=1` Board test passed before and
after closing PR #189 at `2026-09-11T13:17:54Z`; `mergedAt` remains null.
It checked exact current HEAD success, six local obligations, metadata and
Board/API/CLI identity. Desktop 1600x1100, tablet 820x1180 and narrow 390x844
screenshots were inspected. Source, metadata and status remain readable;
the existing canvas and fixed narrow return control are preserved.
Accepted mapping remained unchanged through delivery, checks and closure.

## Formal validation and retained evidence

The rebased implementation passed 209 control-plane cases, 12 React cases,
100 static/package cases, nine offline Board cases, naming, typecheck and build.
Lint has zero errors and 79 existing warnings. The seven-run proof passed both
Factory flows, all five registered negative scenarios and six obligations.
The first Board invocation omitted its URL and could not start; the full
configured rerun passed. Transport faults, stale inputs and adversarial metadata
use permanent offline tests; no live timeout injection or merge is claimed.

Local evidence is retained under `tmp/rebase-180/`, including exact remote
content proof, duplicate/restart records, initial production failure and rerun,
strict live acceptance logs, closure and baseline preservation. Screenshots and
the shared record are under `tmp/flow-inspector/visual-review/github-live-8288b2d1-3d3e-4989-bb20-db6e079c9396/`.
The existing store remains `tmp/flow-inspector/runs`; fresh clones do not contain
live provenance. Reproduce retained review with the documented live Board test.

## Deferred and release boundary

This completes only trusted Changeset preparation and real candidate CI acceptance.
Full Phase 5/6, protected verifier/issuer, required-check protection, provider
reconciliation, ticket/team/hosting and checkout-independent dynamic execution
remain deferred. PR #185's workflow aggregation is separate and not included.
Unresolved provider request `98e706a5-ea09-4c6e-a1f5-57bd767b6c97` remains intact
in its original store; its task file SHA256 remains
`c3665a2a9327540998331674f98d4dbf4918867aa97d5374b316ee1093590038`.
No model request, release, version application, tag, merge or protection change
occurred. The implementation's existing tool patch record is separate from
closeout; closeout creates no additional Changeset. Review notification requires
all checks passing again on PR #180's final documentation-inclusive HEAD.
