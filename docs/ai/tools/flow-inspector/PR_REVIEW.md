# Bounded GitHub PR Review

## Activation and scope

Activated 2026-09-09 from merged PR #168. One local human, one configured GitHub
repository and one selected existing task attempt are supported. This is a
bounded Phase 6 slice, not full Phase 5 or Phase 6 completion. Dynamic execution
requires the Asyra checkout. The existing broker, two Factory flows and six
obligations retain authority. No model request is authorized by this slice.

## Candidate preview

From a concrete Inspector step, select an existing candidate and inspect its
baseline, task/attempt identity, exact before/after source and local verification.
The service-owned delivery policy selects repository and base; request data
cannot select commands, endpoints, credentials, files or policy. Preparation
requires a non-revoked, settled, passing latest attempt with actual allowed source
changes and unchanged accepted contract/revision. Recheck the captured baseline,
frozen verification inputs, report and candidate bytes against their retained
digests. Reject missing/failed evidence, changed source, extra candidate files,
symlinks and modifications outside the originally admitted runtime scope.

The trusted adapter requires a clean checkout and compares every captured source
input with the selected remote base tree. A different Git HEAD is not itself
source equivalence: all captured bytes and regular-file modes must agree. An
advanced base with different captured inputs rejects preparation. Preparation
freezes the exact remote base SHA; any subsequent base advancement rejects
confirmation, even if the changed file is unrelated. Never rebase or silently
update the selected preview. A fresh preview requires a new explicit preparation.

A durable preview contains repository, base name/SHA, deterministic candidate
branch, changed paths and digests, PR title/body and `draft: false`, task/attempt, source identities,
report digest and limitations. It creates no remote objects. Preview text is
review data, never authority. Ordinary reads reuse retained records without
source capture, GitHub polling or history reconstruction.

## Trusted delivery metadata

Activated 2026-09-09: delivery supports only existing Factory runtime source
owned by `packages/factory/package.json`, declaring public `@asyra/factory`,
and release type `patch`. Ownership must match the captured, verified manifest
and exact remote base; absent, conflicting or nested package ownership rejects.
Repository prose, candidate output and PR text cannot select policy. No arbitrary
package, release type, summary or metadata path is accepted from an action.

The review owner generates exactly one new `.changeset/flow-review-<task>-<attempt>.md`
with the fixed package patch entry and a bounded, truthful summary identifying
local candidate review. Demonstrations are labeled deterministic demonstrations,
not model output. The path must be absent from the base; no metadata overwrite
or symlink ancestor is allowed. Preparation writes only the existing delivery
record, never the candidate or checkout. Candidate writes remain runtime-only.

The complete preview separately presents candidate source changes and local
verification, then trusted Changeset content, package ownership, release type,
reason and metadata validation. Metadata validation establishes delivery policy
conformance only, never any of the six source obligations. Repository, base SHA,
branch, all source and metadata paths/bytes, PR title/body, task/attempt and both
validation identities participate in the explicit confirmation digest. Source,
metadata, policy, base or attempt changes require fresh preparation and confirmation.
Historical source-only records remain readable and queryable, but cannot authorize
new external writes without a current complete preview. Uncertain effects keep
query-only reconciliation even after policy changes.

The GitHub adapter validates the complete prepared metadata and writes exactly
the source changes plus that Changeset in one tree/commit. It never derives a
new summary or release decision from candidate or remote text. Board/API/CLI
consume the same retained preview and audit; ordinary reads generate no metadata,
recapture no source and perform no GitHub requests.

Permanent cases cover correct package/content and explicit confirmation;
missing/ambiguous ownership, unsupported release type, illegal path/content;
candidate Changeset/test/gate attempts; stale metadata/source/base/attempt;
dirty checkout, duplicate/retry/restart, uncertain successful timeout; shared
Board/API/CLI records; and unchanged baseline, two flows and six obligations.
Offline gates and desktop/tablet/narrow screenshot review must complete before
an exact live preview is approved. Live acceptance requires all checks to pass
on the actual candidate PR's latest HEAD, then closing that PR without merge.
No model request or provider reconciliation is activated.

## Confirmed delivery

The local owner requested ready-for-review PR creation for this slice so the
repository CI runs. Creation uses `draft: false`; it still grants no merge or
baseline acceptance authority. Older draft previews require fresh preparation;
their confirmation cannot authorize a different PR type.

Only an explicit local-human confirmation of the exact preview digest permits
remote writes. Revalidate current task/attempt, accepted revision, source bytes,
clean checkout and exact remote base before the first external effect. The
trusted GitHub delivery adapter creates only the frozen candidate content on a
new branch and a ready-for-review PR. It executes no candidate code or repository hooks;
it never changes the checkout, existing remote branches, tests, gates, mappings,
accepted history, protection, tags, releases or deployment configuration.

Persist intent and audit before each remote effect. Task/attempt identity owns
one delivery, with deterministic branch and PR identity. Once submitted, a
resumed task cannot replace that pinned attempt or create a second PR. Duplicate clicks and
restart reuse that record. A possibly successful timeout/network/server failure
retains `uncertain` and permits query-only reconciliation, never blind replay.
Absent remote observations cannot prove a timed-out request failed. Definite
authentication/permission/rate-limit failures remain visible; explicit retry is
allowed only when the adapter knows no effect was accepted. Partial branch
success is retained. Crash during an effect becomes uncertain on load. No
candidate, PR description, tool response or manual PR edit can grant authority.

Credentials remain indirect in the installed trusted gh interface. No credential
value or raw transport error enters records, logs, snapshots, source or UI.
Only fixed GitHub API operations under the configured repository are supported.
No arbitrary adapter registration is exposed through HTTP or CLI requests.

## Review observations

Delivery means `submitted-for-review` once the PR exists, not accepted,
merged or successfully delivered product work. Task execution, reported work,
local candidate verification, PR review state and accepted baseline are distinct.
Refresh explicitly reads open/closed/merged PR state and exact latest HEAD checks.
Checks bind their observed HEAD; a changed HEAD clears previous current checks
before fetching new ones. Failed refresh retains a stale/unknown observation,
never current passed. Check runs and commit statuses are GitHub observations,
not local six-obligation verification. A changed PR HEAD or base is visible as
outside the prepared identity, never imported into local candidate authority.
PR title/body edits cannot modify task scope. Repository checks remain separate observations. The trusted metadata policy below
prepares required Changesets without granting candidate metadata access. Closed or merged PRs and green
checks never accept the local baseline. Query-only reconciliation never creates
an extra branch or PR. No polling loop or inbound webhook is introduced.

Board, API and CLI read the same immutable delivery record and audit. Source diff,
local evidence and GitHub review open in new tabs. Desktop retains the existing
canvas and panels; tablet/narrow screens retain one primary region, fixed back
control, pan/zoom, keyboard focus, wrapping text and unfilled disclosure hover.

## Product cases and bounded DoD

Permanent offline tests precede implementation and cover:

- eligible preview, explicit exact confirmation, ready-for-review PR and unchanged baseline;
- no candidate, unknown/failed verification, changed source, scope escape,
  stale accepted revision, advanced base and dirty checkout with zero effects;
- duplicate confirmation, retry, restart, partial success and uncertain timeout
  reconciled by query without duplicate branch/PR creation;
- expired credentials, permission denial, rate limiting, network errors and
  secret exclusion;
- open/closed/merged PRs, changed HEAD, check invalidation, failed reads and
  externally edited PR content without local authority;
- Board/API/CLI identity and audit parity, zero-work ordinary reads, original
  provider dispatch blocking, two Factory flows and all six obligations;
- desktop, tablet and narrow Board preview/confirmation/status/source/evidence
  navigation with preserved canvas, focus, scrolling and pan/zoom.

Run focused owner tests, all control-plane tests, seven-run proof, package React
and static contracts, naming, lint, typecheck/build and maintained Board tests.
Inspect browser screenshots. Keep offline fixtures distinct from real GitHub
acceptance: only after offline completion present an exact candidate ready-for-review PR
preview to the user and obtain confirmation for the external acceptance case.
Retained historical provider evidence is read-only and must pass the same source
eligibility; never reconstruct it or dispatch a model to replace it.

Deliver a patch Changeset outside Framework bulk release, implementation PR and
all checks passing at its latest HEAD. Close only demonstrated bounded work;
uncompleted acceptance and deferred requirements remain visible.

## Deferred boundaries

Required-check protection, independent verifier/issuer, protected remote execution
and evidence transport, real merge refusal, provider reconciliation, hard token
or cost limits, ticket integration, multiple users/tenants, hosting, parallel
agents, deployment and checkout-independent dynamic execution remain deferred.
Existing unresolved provider requests remain intact and continue blocking provider
dispatch. A delivery record neither reconciles them nor authorizes a fresh store
to bypass the block. Deterministic offline candidates are explicitly labeled and
do not claim model provenance or independent protected verification.
