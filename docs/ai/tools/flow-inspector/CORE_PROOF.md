# Flow Inspector Core Proof

## Scope

Phase 3 is implemented on 2026-09-07, extending its completed first checkpoint.
It verifies two real Factory flows in this repository and exposes their concrete
steps on a local board. It does not complete the full Control Plane roadmap.
Static schema version 2 and the static workspace remain read-only.

The supported flows are deferred transaction publication and immediate delivery
followed by cancellation. Both reuse the existing transaction Inspector's
`record-reversible-journal`, `finalize-transaction-state`, and
`settle-local-shared-projection` steps. Their semantics remain owned by
[Factory](../../framework/packages/factory.md) and the
[transaction contract](../../framework/plans/completed/transaction-atomicity-and-rollback-plan.md).
The tool never reimplements Factory, changes its runtime, or becomes its dependency.
The cancellation case explicitly selects `batchPublications: false` so its
forward publication crosses the existing Factory handoff before cancellation.

## Admission

The product-owned proof manifest names each flow's goal, its ordered selected
steps, the existing architecture source, the formal test file, and exact required
case names. The manifest is an explicit test mapping, not another architecture.
The selected slice must resolve every step and its owner, artifacts, routes,
conditions, bypasses, failure owner, and implementation boundary. External inputs
to the slice must be declared. Unknown steps, missing producers, contradictory
ownership, duplicate cases, empty requirements, and broken routes reject admission.
Preflight establishes structural readiness only, not behavioral correctness.

Mapping format 2 declares every incoming artifact route of the selected steps.
Each handoff identifies its architecture route, a `required` or `bypassed`
decision, and the same flow's behavioral cases that prove the decision. A bypass
also needs an explicit reason and a consumer with a declared bypass contract.
Unknown decisions, missing routes, inconsistent artifact producers/consumers,
duplicate routes, and unproved assumptions reject admission. Route predicates
remain architecture-owned; the tool does not interpret natural language as code
or claim to prove arbitrary plan feasibility. The selected commit flow requires
validation; direct rollback bypasses commit validation with its outcome case.

The admitted contract identifies the mapping and architecture by separate content
digests. It retains resolved route predicates and their case references, so
consumers do not reconstruct handoffs. The product-owned manifest also registers
the baseline and negative scenarios, exact expected failing case ids, and isolated
runtime transformations. Transformations may affect only the declared Factory
runtime source, never assertions or test discovery. All required case identities,
owners, goals, routes, scenarios, and source boundaries stay fixed during the
Phase 3 mapping-review action.

Each flow has three independent obligations: mutation-time journal isolation,
commit or inverse-replay outcome, and publication timing/compensation. Formal
Factory tests exercise its real public API and channel, observing outputs and
replay boundaries. Test configuration may change runtime code only for the
explicit negative demonstration; it must never change the assertions.

## Source and Evidence

Every attempt copies the declared Factory, Reactive Events, Utils, and Persistence source
closure plus test mapping, architecture, runner configuration, and package/lock
metadata into a task-owned snapshot under `tmp/flow-inspector/`. Symlinked inputs
are rejected. Vitest resolves those package imports to that snapshot's source;
undeclared project dependencies fail instead of using installed workspace output.
Installed third-party dependencies are reused; their lockfile and runner version
are recorded. This is a trusted local-development proof, not a sandbox for hostile
code or a verification of the entire dependency installation.

Evidence identifies the attempt, actor, scenario, selected flows, Git HEAD,
captured source digest, contract digest, runner version, and start/finish times.
The digest identifies the exact copied inputs, including uncommitted content;
Git HEAD alone is never presented as the tested source. Results describe that
snapshot, not deployment status or a continuously current working tree.

The source snapshot writes an immutable `source-manifest.json` containing each
copied path, size, and digest. Evidence also carries mapping, architecture,
runner-configuration, and lockfile digests. The runner records its Node version,
platform, architecture, and Vitest version; no environment secrets are copied.
The report artifact receives a content digest. Missing or mismatched provenance
cannot grant conformance. Reads and UI refreshes consume admitted records and
do not recapture source or revalidate the accumulated history inventory.

One invocation runs the required cases together. Results require exactly one
recognized observation per expected case, successful runner exit, and no suite
or runner error. Missing, duplicate, skipped, pending, malformed, unexpected,
and failed observations cannot pass. A successful wrapper is not evidence of
successful assertions. Infrastructure failures remain distinguishable from a
failed product obligation; the tool reports an observed failing obligation and
its contract owner, not an inferred universal root cause.

The negative scenario changes the built-in inverse's restoration value in the
isolated Factory source. The ordinary commit flow must still pass, while the
retained cancellation flow must fail its inverse/compensation obligations.
A subsequent baseline run must pass unchanged assertions. Negative proof is
successful only when those precise outcomes are observed, not on any error.

Phase 3 retains five applicable negative scenarios against these same assertions:
omitted inverse replay fails `cancel.outcome`; corrupt inverse handoff fails
`cancel.outcome` and `cancel.delivery`; premature immediate delivery fails
`deferred.delivery`; taking commit instead of rollback fails `cancel.outcome`
and `cancel.delivery`; omitted compensation fails `cancel.delivery`. Each runs
both flows, requires the exact failure set with no evidence/infrastructure error,
and preserves the unaffected obligations. The proof ends with a baseline on the
same captured input digest. Scenario names and expected failures are owned by the
manifest; runner, CLI, and board consume that registration.

## Controlled Actions and Retention

Registered verification, negative demonstrations, cancellation, mapping-diff
preparation, and explicit mapping acceptance/rejection are supported. CLI and HTTP
use the same action service and verifier. Unknown
actions, flows, scenarios, malformed bodies, and unauthorized requests are rejected
before creating a run or child process. The local server binds only to loopback,
checks Host and Origin, and requires a per-start capability for mutations.
It has no arbitrary command, path, upload, or external delivery endpoint.

The first opening of a new local store imports the trusted repository mapping as
its explicit initial baseline. Thereafter, verification requires the working
mapping and architecture to equal the accepted contract. Preparing a diff reads
only the registered mapping path and admits its candidate against the architecture.
Phase 3 permits test-name changes for existing obligation ids only. Deleting,
moving, adding, or changing an obligation, owner, route, goal, scenario, or source
boundary requires later contract-evolution work and is rejected here.

A review records its base revision, candidate digest, exact before/after mapping,
actor, and decision reason. Accept checks permission, the current base revision,
the exact candidate still on disk, and absence of an active runner. It atomically
persists the accepted mapping and decision together, then invalidates current
evidence projections. Reject preserves the accepted mapping. Neither action edits
the user's source or test file. Repeating the same decision is idempotent; a
conflicting or stale acceptance has no effect. A restart preserves accepted
mapping and pending/final decisions; incomplete temporary writes cannot accept a
candidate. This is local explicit review, not protected-main policy or a security
boundary against code running with the user's OS authority.

The service admits one run at a time. Every run has a bounded deadline and output
size. Cancellation and shutdown terminate the owned process group and await
settlement before another run starts. Timeouts, signals, spawn failures, and
missing reports are non-passing results. Child environments omit ambient secrets;
the runner leader terminates its group if its service owner abruptly dies.
trusted tests still execute with the user's OS authority. Source-writing agents,
network containment, token budgets, tickets, and PR mutation are unsupported.

New format-2 attempt records bind their request, mapping revision, contract,
source and runner provenance. Format-1 historical records remain readable with
their original values; they do not acquire the new provenance guarantees.
An attempt record contains its state and audit events in one atomically replaced
JSON file. A final record is immutable. Interrupted records are marked interrupted
when the store is reopened after obtaining exclusive ownership; restart cannot
turn them green. Late completion cannot overwrite another attempt. Persisted
records are validated when admitted from disk, not recomputed on every board read.
Versioned passes require a successful runner exit with no interruption, and
current-contract evidence must match its mapping and architecture versions.
Raw reports and the captured source are local
artifacts, never committed test results. Only explicit local cleanup removes them.

## Board

The existing workspace canvas is the board. Preserve its catalog, architecture
cards, routes, positions, zoom, lane filters, selection, and detail panel. Do not
replace it with a separate dashboard or duplicate cards for each test flow.
The control-plane server composes verification into that same workspace;
direct-open static entries remain read-only and independent of the server.

Supported cards expose a context menu and verification badges; the existing
detail panel shows linked flow goals, required cases, results, and actions.
The adapter projects only the selected flow's assessed cases onto matching
architecture steps. Other steps and other targets remain unverified. Selecting a
different flow, attempt, card, or target must not leak evidence across identities.
If the loaded canvas's selected step contracts differ from the admitted
verification steps, clear successful badges and disable launch until the
workspace is regenerated and reloaded.
Cards launch the related flow's verification and show its outcome and failures.
The all-flow button runs the complete supported set of two flows. A negative run
is prominently labeled and never counted as current successful evidence.
A newly selected failed attempt selects the first failing flow when the current
flow has no failures. It requests the viewer to fit that flow's failed cards
with padding through the existing bounded zoom owner. This happens once per
changed result; unchanged polling or refresh does not override subsequent manual
pan or zoom. Success and unknown evidence do not move the viewport.
Subsequent manual flow selection remains respected.
Confirmed failed cards are highlighted without changing their geometry. A
run-level failure alert remains visible independently of the selected card,
flow, or collapsed verification controls, with named actions to locate each
failed owner step. Recovery clears the alert and failed highlights.

Progress means observed verification progress, not task completion or deployment.
Untested steps remain unknown. Source identity and attempt history stay visible;
changing selection does not mutate or reinterpret evidence. Historical evidence
with a different contract digest stays in its original artifacts and cannot mark
the current cards as passed. A pending run can be
cancelled. A failed run can be followed by a baseline verification from the board.
The linked flow selector identifies potential cross-flow impact; failed assertions
identify confirmed violations. This proof protects only its declared obligations.

The scenario selector exposes all registered demonstrations. A collapsed mapping
review section prepares the current diff, selects retained reviews, and accepts
or rejects with an explicit reason through the action service. The source section
shows mapping revision and version, architecture/configuration versions, runner
environment, and named report/source-manifest links. These links open in a new
tab and verify the artifact digest before serving only that attempt's registered
file. No arbitrary filesystem URL is accepted. Work completion and delivery
remain explicitly untracked/not assessed; a verification pass cannot set them.

CLI commands may attach to a running loopback service with `--url`, sharing the
same requests and evidence instead of opening a competing store. An optional
UUID `requestId` makes a verification retry return its original attempt; conflicting
reuse is rejected, and caller-owned arrays are detached before asynchronous work.

The server URL is owned by `FLOW_PROOF_URL`, shared by the server and browser tests.
The server serves the existing committed workspace assets from an explicit
allowlist and loads the proof adapter only in its target documents. `/` serves
Overview; `/<catalog-slug>` serves the selected Inspector with the same workspace
shell and a server-supplied asset base and explicit path-routing marker. The
catalog route table is prepared once per server lifetime. Known trailing-slash
routes redirect to the canonical path. Unknown single-segment public pages return
HTTP 404 and the explicit workspace route error, never a default selected flow.
API and source/resource namespaces retain their existing request restrictions.
Legacy workspace hash links load the same shell and are canonicalized by the
workspace, since URL fragments are not sent to the server. It
preserves catalog-declared local source and documentation links as plain-text
read-only resources (including declared TypeScript test sources), without exposing
arbitrary repository files. Catalog-declared standalone HTML paths redirect to
the exact corresponding short workspace route. Document and source links open in a
new tab, so their restrictive frame policy does not replace or block the canvas. The adapter
uses the existing tool's theme; it does not own canvas geometry or rendering.
It observes completed graph DOM replacement to bind current cards, then updates
only evidence badges and its detail controls. Polling never rebuilds the graph
or its bindings, resets the viewport, or captures source. Target replacement
disconnects observers and cancels pending reads and timers. Idle views do not poll.
Source capture and test execution occur once per admitted action. No computation
cache or workspace watcher is added.

## Cases and Completion

- Baseline: both real flows and all six obligations pass.
- Negative: all five registered scenarios fail their exact declared obligations
  with no infrastructure errors; unaffected cases pass and a baseline recovers.
- Preflight: missing input producers, invalid owners/routes, unknown steps,
  duplicate/empty requirements, and missing case mappings reject admission.
  Every incoming conditional handoff requires a case-backed decision; bypasses
  need an explicit reason and unresolved routes cannot silently disappear.
- Evidence: zero-match, missing, duplicate, skipped, runner error, malformed
  report, mismatched provenance/environment, and successful wrappers or report
  summaries around failing cases reject completion. Persisted evidence cannot
  shrink the required inventory or conceal an unsuccessful execution.
- Actions: denial has no execution side effect; one request starts one runner;
  duplicate admission, timeout, cancellation, restart, and late completion are safe.
- Mapping: prepare has no acceptance side effect; explicit acceptance binds the
  exact base and candidate, rejection retains the accepted contract, stale review
  and obligation weakening are refused, and decisions survive interrupted writes.
- Retention: request retries reuse their original attempt across restart; repeated
  reads perform zero source/history reads, inventory recomputations, or history
  sorts. Named artifact routes verify the retained file's fingerprint.
- Browser: original canvas geometry, routes, controls and selection are retained;
  baseline, negative failure details, recovery, mapping acceptance/rejection,
  retained attempt identity, unsupported
  targets, and narrow layouts pass a permanent test and screenshot review.
  Verification updates cause zero graph replacements or binding reconstruction.
  Hosted root/short routes, legacy hash conversion, reload, back/forward, and
  explicit unknown-route errors preserve target identities and source links.
- CI runs the focused tests, baseline gate, and all five negative proofs as failing
  commands inside `validate`; existing static compatibility checks remain green.
- The PR's checks pass and the README provides reproducible local commands.

Remote required-check policy is a repository setting, not implied by this code.
The merged Phase 3 completion claim does not include general mapping evolution,
protected accepted-base policy, remote CI ingestion, or team sharing. The active
Phase 4 extension below has its own completion boundary.

## Phase 4 Activation - Operational Contract

Phase 4 is active work, not a completion claim. Its support boundary remains the
same two Factory flows and six obligations on Node.js 24, Vitest, and GitHub
Actions. No arbitrary repository coverage, source-writing agent, token budgets,
ticket synchronization, account system, or hosted tenancy is implied.

### Contract evolution

An accepted version is immutable. A draft comparison identifies rename, move,
content change, split, merge, deletion, missing selector, and unknown evidence.
Matching is deterministic by stable obligation identity and explicit successor
relations; ambiguous observations stay unresolved. No confidence score grants
permission. Rename/move preserve obligation identity; changed contract content
requires review and fresh proof. Splits and merges list exact predecessor and
successor ids and never erase history. Deletion without explicit retirement is
blocked. Retirement requires a separate capability, exact base/candidate
identity, a nonempty reason, and explicit removed obligation ids. Retired
versions remain readable; they cease current regression support only after the
recorded decision. A missing selector or unknown evidence cannot be accepted as
verified. Completed work and supported regression coverage are separate facts.

The version owner produces the immutable comparison and accepted history once
per action. API/CLI/board consume it without rescanning source on reads. Review
binds all evidence observations and successor/retirement inputs, not only the
candidate mapping digest. Changes invalidate prior conformance; no equivalence
shortcut preserves a green result after contract changes.

### Version verification references

A version may retain `verificationSource: {attemptId, repository, head,
sourceDigest, configurationDigest, descriptor}`. The descriptor is the source
owner's admitted `verificationSource`; the surrounding tuple binds the trusted
service attempt, repository, captured HEAD, full snapshot and actual execution
configuration. This reference contains no client-selected filesystem path. Only
that service and repository may resolve the attempt's retained artifacts.

The version owner consumes a service-admitted reference. Its structural and
contract checks do not make caller-supplied content authoritative: the service
must have completed source admission and execution-configuration binding before
passing the reference. The descriptor's contract/mapping/architecture identities
and five role paths must agree with the version's admitted contract; every
selector must match the descriptor's captured test path and byte digest. The
version owner neither rehashes manifests nor reads bytes. The reference is copied
into immutable candidate/accepted history and participates in the existing
candidate and exact-base fingerprints. On reload, the reference remains a
historical fact; replay requires fresh source-owner admission of the retained
artifacts through the same trusted repository boundary.

Verification-content changes must be visible in the comparison even when test
selectors are unchanged. Changes to the descriptor digest or actual execution
configuration use the existing `content-change` observation with
`subject: 'verification-source'` and the affected flow identities. A different
attempt or full snapshot reference with identical verification bytes changes
review identity without falsely claiming a behavior-content change. Acceptance
still requires the existing explicit reason, exact base/candidate, capability
and retirement authority; retaining a reference proves neither target integration
nor acceptance eligibility.

A candidate cannot silently remove a reference from a version that already has
one: acceptance is blocked, while an explicit rejection may retain its audit.
Malformed present references reject validation. Historical versions without the
field keep their existing standalone semantics and receive no new source
verification authority. Acquiring that authority requires an explicit reviewed
version with a valid reference; loading an old history or finding matching files
in the checkout never adds it. New authoritative target assessment and later
integration acceptance always require the retained verification-byte authority,
independently of whether older standalone version operations remain readable.

For new source-aware candidate proofs, version preparation uses that attempt's
retained admitted contract and verification descriptor. Its selector byte identity
comes from the admitted test-role entry; observed selectors still come from the
registered retained runner report. Do not reload mutable checkout metadata to
choose the candidate contract or verifier. Before the first reference handoff for
an attempt in this service lifetime, the source owner verifies its retained
ordinary bytes. The service retains the exact version-reference tuple privately
for reuse with the same immutable source admission, and clears it on close or
identity failure. This introduces no persistent verified flag.

On startup, references already retained in versions or reviews are resolved only
within this service's repository and fixed attempt directory. Match their full
repository/attempt/HEAD/source/configuration/descriptor tuple to the current
source admission and check each referenced attempt's bytes once. Missing or changed
source-tree bytes leave that reference unavailable for new handoffs while its
historical version remains readable. Existing missing or corrupt source-manifest
admission still rejects startup under the source-admission contract. Every new
reference handoff, later target resolver and producer must consult this service
availability, not merely the presence of a saved reference. Later composition
still verifies the bytes it uses.

A repeated preparation may reuse the immutable candidate from that same attempt,
but the version owner must compare it against the current exact history base and
requested relations. Return an existing review only when that full review identity
matches; a changed accepted base produces a new exact-base review or an explicit
availability error. A previously accepted or rejected review may remain readable
as historical replay; it cannot silently stand in for a new-base review or claim
current source availability. Replay and ordinary reads do not reread verifier bytes
or the report. Historical proofs without source-contract authority preserve their
existing standalone preparation behavior without adding a verification reference.
This service handoff does not change explicit version acceptance or target-baseline
acceptance requirements.

### Accepted-base CI

The aggregate must evaluate every obligation in the declared supported set,
including previously completed flows. Candidate removal or gate weakening is
compared with an independently selected accepted base. The candidate cannot
choose its own base, authorizations, verifier, assertions, or runner policy.
CI ingestion checks raw case discovery and outcomes, artifact fingerprints,
repository, base, candidate and actual integration revision, run/attempt identity,
source inventory, contract/configuration versions, and runner environment.
Provider success alone is never behavioral evidence. Duplicate deliveries reuse
one record; conflicting or older deliveries cannot replace newer truth.
Zero-match, skipped, missing, malformed, cancelled, timed-out and unknown results
all prevent acceptance. A failing assertion remains a confirmed violation even
when provenance errors also block delivery.

A protected GitHub check requires live verification of the effective rules,
required check identity, strict/up-to-date integration policy and executed
revision. A workflow file or locally green aggregate is insufficient. Missing
external protection must remain an explicit delivery blocker. Repository setting
changes require separately authorized administration; no app deployment setting
belongs to this phase.

### Shared operations and viewing

The existing action service remains the single admission and state owner for
board, API, CLI and CI. Cards keep test/CI execution, progress, errors, named
artifacts and retry in the existing canvas/detail surface. A manager projection
shows goals, supported capability, remaining concrete obligations, blockers and
potential versus confirmed downstream impact. Shared read-only snapshots bind
baseline identity and observation time, retain verification provenance, and
separate work completion, execution, verification and delivery. A developer's
mutable working tree never silently becomes a delivered team baseline.

### Phase 4 cases and bounded DoD

Permanent tests cover all eight drift classes; exact-base authorized acceptance,
retirement, retained history, stale/conflicting decisions and invalidation;
accepted-base removal and policy weakening; raw failing cases behind green
provider summaries; wrong/missing source and integration identities; aggregate
coverage, replay ordering, crash/retry semantics and repeated-read work counts.
Integration and browser tests prove common action results and preserve canvas
geometry/navigation/zoom. The reproducible trial includes baseline success,
intentional runtime violation, CI rejection and correction. Closeout requires
these gates, static compatibility, lint/naming/build, browser screenshot review,
and all checks on the PR's latest HEAD. An unverified required-check policy
blocks full Phase 4 completion and must not be relabeled DONE.

## Phase 5 Local Activation - 2026-09-08

The user separately activated [local isolated agent execution](AGENT_EXECUTION.md)
while retaining all deferred Phase 4 enforcement requirements. Earlier statements
that Phase 4 closeout did not activate Phase 5 remain historical facts. This new
decision grants no merge, publication, protection or Phase 6 authority.

## Bounded GitHub Review Activation - 2026-09-09

[PR Review](PR_REVIEW.md) independently activates one local owner, one configured
GitHub repository and one candidate review. The trusted delivery adapter uses
explicit preview confirmation; external observations do not admit CI evidence,
accept a local baseline or alter any of the six obligations. Earlier phase
exclusions above describe their original activation, not this later grant.

## Final workflow aggregation

The `flow-ci` GitHub job waits for `validate` and the reusable Design E2E
workflow, and runs even when a dependency fails. It consumes their completed
results; it does not analyze runtime source or execute a second test suite.
The existing Factory proof remains an independent producer. A successful
Factory job does not establish Design conformance.

The existing required check names `e2e-tests` and `collaboration-e2e-tests`
remain available as result-forwarding jobs after the reusable workflow settles.
Each requires its actual producer job's exported result to equal `success`;
failure, cancellation, skipping or absent output fails the forwarding check.
These jobs do not rerun tests or replace case evidence. They preserve existing
repository rules without changing protection or bypassing required checks.

The bounded Design mapping contains the existing single-element Delete case
and two collaboration Delete cases (connected windows and nested Group removal).
The workflow collects exact Playwright file, title, project, expected status,
and every attempt outcome. Missing, duplicate, skipped, interrupted, unexpected,
flaky, malformed or report-error results cannot pass. A known failed assertion
remains failed even when another required case was not reached by fail-fast.
Other Design flows remain outside this mapping, not implicitly verified.

Each producer envelope binds repository, base, PR HEAD, actual integration SHA,
run id and run attempt, plus the raw report SHA-256. The collector emits bounded
job outputs and a readable job summary after tests, including failed tests.
The final job validates identity and the exact fixed case inventory before
projecting pass, fail or unverified. Dependency failure also blocks the final
check even when the selected cases passed. Missing output after infrastructure
failure or cancellation remains unverified. No secret, raw stdout, screenshot,
trace, or arbitrary report text enters the bounded output.

This is observational CI integration, not a protected issuer. Workflow and
report bytes remain repository-controlled; digest integrity is not authenticity.
It grants neither accepted conformance nor delivery authorization and makes no
required-check protection claim. Existing Board PR observations can display
the final GitHub check and its summary link; this does not add Design badges
to the local Factory proof or alter accepted history.

Formal cases cover outcome classification, exact identity, malformed and missing
reports, inventory weakening, dependency failures and workflow ordering. Live
acceptance uses the same Delete runtime mutation as PR 183, then removes it and
requires a new successful final check on the corrected HEAD. Test PRs close
without merging; production changes are delivered separately.

## Flow targets and work decomposition

This bounded local slice supports one repository and one human. A development
target is distinct from a flow contract, work item, task, attempt and PR. The
multi-PR direction in PR 188 is not itself runtime capability. Full integration
assessment and explicit new-baseline acceptance remain separate future slices.

A target binds one admitted flow, a target contract revision (its content digest,
resolved from retained accepted versions or prepared contract-evolution reviews),
and an explicit accepted baseline `{revision, contractDigest}`. Creating a target
never accepts its target revision. Unknown revisions and flow references reject.
The target retains its complete obligation inventory, including unassigned pending
obligations. Existing accepted-flow protection and all six Factory gates remain.

For new source-authoritative targets, creation also selects `targetReviewId`,
the existing hash identity of an exact retained version review. The trusted
service's `getVersionReview(id, {requireAvailable})` supplies that immutable review and candidate
pair. It must match the requested id, target contract digest and a valid
service-admitted candidate verification reference. The target owner copies only
`targetVerification: {reviewId, candidateDigest}` into the immutable target;
`candidateDigest` is the version owner's fingerprint of the entire reviewed
candidate, including its exact verification source reference. The target owner
does not recompute that fingerprint or accept client-supplied candidates.

Missing or conflicting review/candidate/reference identities reject creation
before any revision write. Create-request replay, subsequent revisions, links
and admissions preserve this pin; later requests cannot supply a replacement.
On retained-state admission, resolve the same review and verify the pin and
contract again. A missing or changed review cannot be repaired by selecting a
newer review, a passing attempt or another candidate with the same contract
digest. A later review rejection leaves the historical pin intact: explicitly
admitted local development may continue against that frozen target, but review
status grants no acceptance permission and never changes its verification bytes.

The service admits each retained review's metadata through the version owner.
Require integer `baseRevision` within the retained history and select that exact
immutable history prefix, with its matching revision and last version. Invoke
`compareVersion` with the retained candidate and relations, then compare every
owner-produced review field, including id, base/candidate digests, changes,
blockers and relations. Do not recompute review fingerprints in the service or
substitute the latest base. Service-owned attempt and status fields are checked
separately. A changed owner field rejects admission rather than repairing history.
Retain the admitted pair privately for target resolution; startup and newly
prepared reviews establish it once, while get/list/replay perform no new review
admission or source-byte validation.

The target owner sets `requireAvailable: true` only for a new creation after its
existing exact-request replay check. Retained target loading sets it to `false`;
get/list and exact create replay do not call the resolver again. The service owns
availability enforcement inside that callback. It must not reconstruct target
request history or reject a historical replay through an earlier service precheck.

Review metadata integrity is separate from current source-byte availability.
Retained targets may load their exact admitted historical pair when its byte
reference has become unavailable, preserving the pin and readable history. Before
a new target creation with `targetReviewId`, the service must require that pair's
exact reference to be available in this service lifetime. No new target or later
producer gains authority from metadata alone. Target callback resolution does not
choose a newer or greener review. Public evolution review projections preserve
the version owner's `candidateDigest`; `candidateContractDigest` separately names
the contract digest and must not overwrite the reviewed-candidate identity.

Legacy targets without the pin retain their existing standalone behavior and
bytes. New authoritative source assessment reports their missing verification
authority instead of deriving a pin from current files or another review.
The accepted baseline remains separate. Its existing `acceptedBaseline.revision`
is the mapping revision, not an immutable version-history index. For authoritative
source assessment, a target additionally retains `acceptedVersion: {revision,
contractDigest}` from the trusted service's `getAcceptedVersion(revision?)`.
On a true new creation, omit the callback argument to select the current immutable
accepted-history version. The returned revision must be a positive integer and
its contract digest must equal the separately checked accepted mapping baseline.
Clients cannot supply this pin or its revision. Mapping revision 5 and version
revision 1 are valid distinct identities; equality must never be assumed.

The target owner retains the accepted-version pin both at the record top level
and as an owner-produced output in its first creation history entry, outside the
client request. Load requires matching presence and values in both locations,
forbids the field on later entries, and calls the trusted resolver with the saved
revision to check that exact retained version. Replacing only either copy with
another same-contract version rejects admission. This is the existing local audit
consistency boundary, not an independently protected-store claim. Creation replay
performs no version lookup; revise/link/admit preserve the original pin unchanged.

An older standalone consumer without the optional callback keeps creating
unpinned targets without new assessment authority. When the callback is
configured, missing, invalid or conflicting returned metadata rejects creation;
a saved pin always requires an exact resolver on load. Existing targets without
the pin stay readable and are never upgraded by a latest-version or digest search.
A configuration-only accepted version may share the contract digest of another
version: only the pinned history revision selects its verification reference.
Missing verification references or unavailable bytes block new assessment but do
not make the retained target unreadable. The target's verification reference
never substitutes for this accepted version's own bytes. Service selection and
assessment consumption of these pins remain subsequent owner slices.

Each work item has a stable UUID, title, one concrete step, nonempty obligation
IDs, exact promised scope text, explicit runtime file scope, and prerequisite
work IDs with nonempty required handoff descriptions. Every target obligation must
be assigned exactly once or explicitly listed as pending. Unknown steps, obligations,
files, prerequisites, missing coverage, overlapping responsibility and cycles
reject the entire decision without writing. Resolve overlap by revising assignments;
there is no override that grants shared arbitrary mutation authority.

Create and revise decisions require a UUID request identity, actor, reason and
expected target revision (zero for creation). Each successful decision appends a
full immutable revision and audit atomically in the existing exclusively owned
store. Exact replay returns its original decision; conflicting reuse and stale
writes reject. Changing scope requires an explicit revision and reason. An existing
work UUID cannot change its promise, step, files, obligations or prerequisites:
use a new work UUID for a changed commitment. Old commitments, task links and
historical failures remain readable in earlier revisions. Pending obligations
cannot be omitted, even after failure. Target flow/revision/baseline bindings are
immutable; a different target contract requires a distinct target.

Linking an existing admitted task is a revision decision. It requires matching
accepted baseline, complete concrete step contract, exact scope text (the task objective), exact
allowed files, and all promised obligations present in the task's retained
contract. A task may belong to only one work commitment across targets. Multiple
tasks may serve one commitment, and one target may contain multiple task/attempt/
PR records. Linking neither runs nor resumes a task and grants no new permission.
The original task scope and strict all-flow candidate verifier stay intact; linked task execution also requires the source admission below.
An evolved target incompatible with current task admission stays visibly limited;
it cannot use partial delivery to bypass that verifier.

Prerequisites always remain `unconfirmed` in this slice: linked tasks, passed
candidate checks and merged PRs do not prove their handoffs in the current source.
Dependent work displays `blocked`; allocation status and the complete target remain
`pending`. Source-admitted bounded assessments are exposed separately below. Task verification and PR observations are displayed under their original
identities, separately from work completion. No aggregation of different HEADs,
client conformance decision, automatic acceptance or dependency dispatch exists.

The target owner computes coverage once per revision, validates retained history
once at service startup, and produces detached task/review projections once per
requested target read. Board/API/CLI consume that projection without source reads,
remote calls, evidence assessment or rebuilding the graph. No cache is introduced.
The existing Board detail offers target creation, work editing, pending inventory,
explicit revision review, task linking and full historical audit. Desktop, tablet
and narrow layouts preserve the existing canvas, focus, fixed return and pan/zoom.

Bounded DoD: permanent owner tests cover three work items plus pending inventory,
invalid references, omissions, overlap, cycles, exact task compatibility, duplicate
and stale decisions, restart, failed-history retention, partial success and merged
but unconfirmed prerequisites. Service/API/CLI tests prove authorization and audit
parity; browser tests exercise actual creation/revision/linking at three viewports
with screenshot review. Existing control-plane, seven-run Factory proof, static,
React, naming, lint, typecheck/build and latest implementation PR CI must pass.
Offline fixtures are labeled and never replace live provider evidence. No model,
external test PR, provider reconciliation or new baseline is activated.


### Work admission before execution

A separate `admit` target decision reserves one task UUID for an unchanged work
commitment before execution. It requires the current target revision, actor,
reason and a retained completed baseline proof attempt from this store. The proof
must bind the same accepted revision/contract and contain all six passing
obligations. The owner pins its exact source digest and HEAD plus repository
identity; neither a PR observation nor a caller-supplied pass is eligible.
This initial source proof protects accepted behavior, not completion of new work.

The decision appends immutable admission and audit to the target history and
reserves the task link atomically. Admitted work cannot be removed or have its
promise replaced by an allocation revision. Other allocation changes remain
explicit revisions. Failed attempts and earlier admissions remain visible.
Existing historical links remain readable, but a linked task needs source-bound
admission before another execution. Unlinked legacy tasks retain their original
execution contract. Explicit admission of a retained task binds its original
snapshot; it does not overwrite its task or attempt history.

Task start supplies `workBinding: {targetId, workId, admissionId}`. The trusted
service resolves the decision; the task owner checks it before capture, after
capture and before every resumed attempt. Scope, actor, step, obligations,
accepted revision, repository and captured source must agree. A reserved task
cannot omit or substitute its binding. A stale, missing or changed relation
fails before adapter operations or provider reservations. Task identity replay
creates no new attempt. Existing provider dispatch blocks remain authoritative.

Prerequisites remain unconfirmed in this slice and therefore prevent admission
and execution. No prerequisite confirmation endpoint is introduced. This permits
independent work only; proving usable prerequisite behavior on an integrated
source is a later verification slice.

Board/API/CLI target detail exposes each admitted work's bounded `assessment` with its
exact task/attempt and candidate source identity. Unassigned obligations remain
in `pending`; admitted but unexecuted work is pending, incomplete evidence is
unknown, failed obligations remain failed, and a complete existing all-flow
candidate verdict may pass only its bounded work assessment. The target stays
pending regardless of individual passes, PR checks or merge. Historical linked
tasks without admission are observations only. Reads use retained records, never
capture source or assess raw evidence again.

Permanent cases must prove reservation and restart, immutable commitments,
prerequisite/scope/source/actor/identity rejection before execution, legacy-task
compatibility, failure then correction with retained attempts, no cross-HEAD
aggregation or automatic acceptance, and API/CLI parity. Existing security,
Factory proof and browser gates remain mandatory.


The Board's Prepare task action first records admission against the selected
completed baseline proof, then fills the existing task form with that reserved
binding. Missing or ineligible proof shows an error without starting work. The
form visibly identifies the prepared work; editing scope cannot bypass server
validation. Successful start consumes the prepared form binding. Unexecuted
reservations show their task UUID without a broken task-artifact link. Bounded
assessment updates preserve the existing work controls and keyboard focus.

## Target source assessment

This is the next multi-PR implementation contract, not a claim that the current
Board or task admission supports dependency execution. Until its producer and
consumer slices pass their gates, the existing unconfirmed-prerequisite and
pending-target behavior above remains the runtime boundary. The assessment owner
is `assess-target-source`; target allocation, candidate verification, source
capture, raw evidence assessment and accepted history keep their existing owners.

An explicit local assessment identifies a frozen target allocation revision, its
target contract, the current accepted revision, and one captured integration
source. Inputs come from the trusted local action service resolving retained
owner artifacts; a client may select their identities, never supply a passing
verdict. The assessment consumes admitted contracts, the target owner's frozen
commitments, a source snapshot and completed proof evidence. It neither executes
tests nor reads mutable source, fetches PRs, interprets handoff prose, starts tasks,
changes commitments or writes accepted history.

The result separates accepted-behavior preservation, each work promise and its
prerequisites, and whole-target integration. Each result retains the source,
accepted and target contract identities, allocation revision, required obligation
inventory, evidence references and concrete blockers. A passing work result is
labeled with that work's bounded obligations; it cannot stand for a passing flow.
All accepted obligations in the registered verification scope remain required.
Unknown impact uses that complete conservative scope, never an empty exemption.

### Assessment input and currentness

The internal `assessTargetSource` input is `{target, allocationRevision,
acceptedContract, targetContract, acceptedVerificationSourceDigest,
targetVerificationSourceDigest, sourceAdmission, proofRequests, current}`.
`target` is the target owner's immutable artifact. Select its exact history entry
whose `revision` equals `allocationRevision`; use that entry's frozen `state`,
the target's `obligations`, `id`, `targetRevision` and `acceptedBaseline`.
`targetContract.digest` must equal `target.targetRevision` and
`acceptedContract.digest` must equal `target.acceptedBaseline.contractDigest`.
The selected flow and obligation inventory must agree with the admitted target
contract. Missing, conflicting or ambiguous selections reject the request.
The assessor consumes this allocation; it does not rebuild coverage from tasks.

`sourceAdmission` is the source-owner-validated, service-owned artifact described
below. `proofRequests` is the trusted service's complete retained request
inventory for the selected assessment, not a client-selected list of green
results. The two required verification digests come from the exact accepted-version
and target-review references resolved by the service, never from contract digest
equality or current checkout bytes. Each entry contains `id`, `contractDigest`,
`verificationSourceDigest`, `flowIds`, and, when
available, `record` plus that record's `sourceAdmission`. The id binds the exact
attempt. The completed record must already have passed evidence-owner admission
against its own admitted contract and source artifact. This assessor consumes
those observations without calling raw assessment, stored-evidence validation or
source validation again. It compares the selected repository, HEAD and runtime
digest; each record still binds its own full snapshot digest and verification
identities. Its combined source admission and snapshot must both carry the
requested verification descriptor digest, with admitted contract, mapping,
architecture and actual configuration identities matching the record. Runtime-only
legacy admission cannot provide this authority. Distinct accepted and target full
snapshot digests are permitted.

A requested producer without a record, with an unfinished or error record, or
without admitted completed evidence contributes unknown results and concrete
blockers. Duplicate requests or more than one producer observation for the same
contract, verification identity and obligation cannot pass; retain any confirmed
failed observation.
Only when both contract and admitted verification-source digests are identical
may one request serve both roles; all runtime, full-source, configuration and
request bindings still apply. Same-contract versions with different verifier or
configuration bytes require distinct observations. Duplicate detection applies
within that exact contract and verification identity, not across different
verification bundles. Results and evidence references retain the selected
verification digest so the two roles remain distinguishable. Missing or mismatched
verification authority cannot be inferred from a green result. The service must
resolve both immutable version references independently before applying this
sharing rule; an available target reference never replaces a missing accepted
reference. This equivalence supports ordinary verification only, whose admitted
actual execution configuration equals its configuration-role entry. Derived
execution configurations require an explicit execution-identity contract before
using this sharing rule. A work
with no requested target-flow proof remains pending. This absence differs from
an explicitly unassigned obligation in the frozen `state.pending`; that inventory
keeps integration pending even if observations already exist. Accepted preservation
with no required proof is unknown, never an empty successful result.

`current` contains `targetId`, `allocationRevision`, `acceptedBaseline` and
`source: {repository, head, runtimeSourceDigest}` supplied by the trusted service.
Compare these against the selected artifacts to report `current` and concrete
staleness reasons. Changed current identities do not rewrite the historical
accepted, work or integration verdicts. Acceptance eligibility requires both a
complete passing integration verdict and current identities; an old passing
assessment cannot become current by relabeling its revision or source.

### Frozen target proof production

The local service method `startTargetProof({requestId, targetId,
allocationRevision, sourceAttemptId, role}, actor)` requires the existing `verify`
capability. The role is exactly `accepted` or `target`; the client supplies only
these identities, never contracts, source paths, reference descriptors, flow lists
or proof results. Select the exact retained target allocation entry and the
service-owned runtime admission for `sourceAttemptId`. Resolve the accepted role
through the target's `acceptedVersion` history revision, and the target role
through its exact `targetVerification` reviewed candidate. Each selected version's
own retained verification reference and contract must match that pin and be
available in this service. Legacy missing pins or references remain readable but
cannot start a new authoritative proof. Contract equality cannot replace either
version reference.

A new attempt uses mode `target-proof`, baseline scenario and the selected
contract's complete registered flow inventory for this conservative ordinary
producer slice. It durably retains the requested selection and exact selected
reference before dispatch. The source owner composes the selected runtime and
that frozen verification bundle into the new attempt's fixed source directory;
then the existing combined source admission, runner and evidence admission consume
its exact stored contract. No stage reads checkout verification bytes or treats
the current accepted contract as a replacement. This mode is neither an accepted
conformance run nor a candidate version review: ordinary baseline projections and
version preparation must not promote it. Producing this record alone does not
create a target assessment or acceptance eligibility.

`requestId` uses the existing attempt UUID identity. Authorize and validate the
request before side effects. Exact same-actor replay returns the original attempt
identity before idle or source-availability checks, with no lookup, composition or
runner repetition; changed selection or actor conflicts. New requests require an
idle service and available exact owner artifacts before saving an attempt. Once
admitted, a composition or byte-integrity failure settles that attempt as error
with audit and no passing evidence. Existing cancellation, timeout and close
semantics apply to the runner; restart marks unfinished attempts interrupted and
never restarts composition or execution automatically. Historical completed and
interrupted attempts retain their original selection and source identity. Reads
and replay consume retained artifacts without new validation work. Retained
completed target proofs are evidence-admitted against their own source-admitted
contract once on restart; missing or conflicting new authority fails closed under
the existing manifest admission rules.

### One source and distinct verification contracts

Every participating producer must bind the same repository, captured runtime
file inventory and content digests, and Git integration identity. Git HEAD alone
cannot identify dirty captured source. Accepted and developing contracts can have
different mapping, architecture, configuration and report identities; each
evidence record must match its own admitted verification contract while binding
the same captured runtime source. The source owner supplies that runtime identity;
this assessor cannot derive equivalence by deleting fields from a full snapshot
digest or trusting a caller's equality claim. Existing snapshot digests and
historical evidence are preserved. Evidence without the required runtime identity
is unavailable for a new assessment until a new producer run supplies it.

Required producers must settle before a result can pass. Missing, skipped,
duplicate, malformed or mismatched observations are unknown, with blockers;
confirmed obligation failures remain visible even alongside unavailable evidence.
A failure cannot be hidden by a second task, another producer or a later PR's
green status. Reassessment against a new source is a distinct result and preserves
the earlier result. Different sources, target revisions or accepted revisions
never combine into one integration pass. An assessment selected against a changed
source, allocation or accepted revision is stale; historical results retain their
original verdict and identity instead of being relabeled as current.

### Runtime identity producer contract

For this supported local slice, the source owner creates `runtimeSource` with
`format: 1`, `files` and `digest` from bytes already captured in the immutable
snapshot. Its complete inventory is every regular file recursively below
`packages/{factory,reactive-events,utils,persistence}/src` except `__tests__`
directories, those four packages' `package.json`, root `package.json`, and
`yarn.lock`. No caller supplies exclusions, roots or an alternative manifest.
Undeclared local package imports and unsupported source roots remain errors under
the existing capture policy. Verification-owned manifest, architecture, spec,
test and runner configuration files remain in the full snapshot manifest and
its existing digest; they do not become runtime-source files merely because a
proof references them. If a verification path overlaps the declared runtime
inventory, reject capture instead of excluding the runtime file.

Each runtime manifest entry has exactly `path`, `size`, `digest` in that key
order: a repository-relative slash path, captured byte length, and lowercase
SHA-256 of the bytes. Sort entries by code-unit path order, reject duplicate or
missing entries, and hash UTF-8 `JSON.stringify(files)` with SHA-256 for `digest`.
The owner constructs this once from the captured inventory without rereading
source. The trusted service binds the existing repository identity and snapshot
HEAD alongside this digest; the digest alone cannot equate repositories.
Old full snapshot digests remain unchanged and are not migrated into this field.

Execution configuration remains an authoritative verification input, not an
ignored difference. Every producer binds its full snapshot digest, admitted
contract/mapping/architecture identities, configuration digest, lockfile digest,
scenario and runner environment in addition to `runtimeSource.digest`. The
accepted contract's required execution configuration cannot be replaced by the
target's configuration. Different accepted and target test/config files are
permitted only under their separately admitted contracts; unknown configuration
or runtime resolution outside the captured closure blocks verification. Equal
runtime digests alone do not make a producer eligible or its result passing.

`capture-proof-source` owns construction and immutable manifest validation.
`execute-proof-run` copies the supplied runtime digest into its existing runner
identity as `runtimeSourceDigest`; it neither rediscovers files nor substitutes
a digest. `assess-proof-evidence` verifies that identity against the supplied
snapshot, alongside every existing provenance check, and retains the runtime
digest with its completed evidence. Its retained-evidence admission applies the
same binding before another owner can consume that evidence. A missing,
unsupported-format or mismatched new identity can never pass target assessment.
Existing records without `runtimeSource` retain their established standalone
proof behavior and original bytes; they are ineligible for target source
assessment and require a new run. New malformed identities are rejected, not
silently handled as historical records. Candidate snapshot construction must
follow this same source-owner contract before candidate evidence is eligible.

Implement and prove the source, runner and evidence producer handoffs before
implementing `assess-target-source`. Formal tests must bind real captured bytes
through the registered runner and existing assessor: changing runtime bytes,
package metadata or lockfile changes runtime identity; changing only separately
admitted verification inputs preserves runtime identity while changing the full
verification identity. Missing/forged runner bindings fail. Owner unit fixtures
can cover negative cases but cannot establish producer readiness or replace this
integration proof. No downstream consumer may hash a filtered full manifest as a
substitute for the source owner's artifact.

### Frozen verification source

The source owner also constructs `verificationSource` from the same captured
manifest. Format 1 contains `contractDigest`, `mappingVersion`,
`architectureVersion`, `roles`, `files` and `digest`, following `format` in that
key order. `roles` has exactly `manifest`, `architecture`, `spec`, `test`,
`configuration`, in that order, mapped to the corresponding paths of this
admitted contract. These five paths must be distinct canonical repository-relative
slash paths and must not overlap the runtime inventory. Reject aliases, duplicate
roles or paths and caller-provided replacement inventories. `files` contains
exactly the five captured entries with the same canonical path ordering and
`path`, `size`, `digest` shape as runtime entries. Hash the UTF-8 JSON serialization
of the canonical object before adding its `digest` field. This binds role-to-path
relationships, each byte fingerprint and the admitted contract identities.

Construction performs no additional source reads and makes no admission claim.
Source-owner validation requires the complete full snapshot manifest and its
original digest, the bound runtime identity, the exact admitted contract and the
exact verification projection. `validateSourceSnapshot` returns the detached
immutable runtime and verification descriptors after that one admission; it does
not read source again. Historical absence of `verificationSource` yields no
verification authority. Present malformed or unsupported descriptors reject;
neither a caller's digest nor current checkout files can complete them.

The descriptor is not the bytes and is not, by itself, a replayable bundle. A
service-owned attempt identity and full snapshot digest must locate the retained
immutable source tree and manifest. The version owner must retain the exact
verification descriptor reference, contract identities and attempt/full-source
identity in the reviewed version; they participate in its existing candidate and
exact-base decision fingerprints. Retain referenced source artifacts for that
version's lifetime. Missing or tampered artifacts make new assessments unavailable;
never replace them from a mutable checkout or rewrite the accepted history.
A historical version without sufficient recorded verification-byte authority
remains readable but cannot authorize a new authoritative producer. Recovery may
use an already recorded immutable source identity only when its existing evidence
actually binds all required bytes; matching contract or selector names alone does
not establish configuration authority.

Later source composition reads each selected runtime entry from its source-owner
snapshot and each verification entry from that version's own retained bundle,
checks actual bytes against every entry, and creates a new immutable snapshot.
It preserves the selected runtime digest while producing its own full snapshot
and execution-configuration identities. Missing entries are errors, never current
checkout fallbacks. Accepted and target producers may have genuinely different
verification test/configuration bytes while sharing the selected runtime; formal
positive cases must execute both through the real runner and evidence owner.

For ordinary verification, `composeSource(repositoryRoot, runDirectory,
runtimeInput, verificationInput, contract)` consumes two service-owned inputs.
Each input has `{sourceRoot, admission}`: `sourceRoot` is the fixed `source/`
child of that trusted attempt directory, and `admission` is the service-owned
artifact with its repository, attempt, HEAD and full-source tuple. It binds that
location to its already admitted source artifact; the verification artifact includes its admitted
verification descriptor and actual execution configuration. Neither input is a
client-selected directory or replacement manifest. Both belong to the same
authorized repository, although their attempts, HEADs and full source digests may
differ. The output HEAD comes only from the selected runtime source. The supplied
contract is the exact contract of the selected verification bundle.

Before composition, require ordinary configuration authority: the verification
artifact's actual configuration digest equals its descriptor's configuration
entry. Generated or derived configurations without their complete declared
execution closure are rejected, never stripped or relabeled as ordinary. The
source owner reads the selected runtime inventory and exact five verification
entries from those retained trees, checks safe paths, regular files, absence of
symlinks, byte sizes and hashes, and copies each verified entry once. No mutable
checkout read completes missing input. No cross-request byte cache is introduced.

Return a snapshot only after its full output manifest is complete. Construct its
descriptors from the verified bytes; its runtime digest must equal the selected
runtime artifact and its verification digest must equal the selected bundle.
Runtime supplies package metadata and lockfile, while verification supplies its
own configuration and contract metadata. The new full digest binds both. Failure
returns no usable snapshot and must prevent runner dispatch; a partial output is
never evidence or a source fallback. The output follows the existing runner and
evidence admission contracts. This source-owner operation alone does not select
versions, publish service assessment requests or grant baseline acceptance.

`verifyRetainedSource(repositoryRoot, input, contract)` applies the same source
owner checks without constructing another snapshot. It consumes the same trusted
`{sourceRoot, admission}` input, requires canonical absolute roots and the fixed
attempt location, and verifies the complete ordinary runtime and five-role
inventory against actual retained bytes. It reads each entry once, writes no
files or directories, returns `undefined` on success and throws on failure.
The service retains its original immutable admission artifact; this operation
does not create a persisted verified flag or a substitute source identity.
Its success supports only that reference-admission handoff. Later composition
still checks its actual input bytes again. Shared byte-validation logic must
preserve the read-only path and composition's existing no-overwrite and
non-aliasing guards; UI reads and request replay invoke neither operation.

These five roles do not enumerate all execution inputs. Candidate-generated
configuration and bootstrap files retain their existing full snapshot and derived
execution-configuration binding. A five-role descriptor cannot authorize arbitrary
wrappers or override that provenance. Composition and candidate handoff must bind
those generated inputs through their declared owner before claiming replayable
verification authority. The initial source constructor/validator slice does not
activate version retention, composition, service assessment or baseline acceptance.

### Source admission in the local service

The service admits a new runtime source once for each attempt and immutable
snapshot identity, before runner dispatch or raw/retained evidence assessment.
This admission depends only on the trusted attempt and captured source; completed
evidence is consumed later for persistence and projection and is never an
admission prerequisite. For a live capture it passes the already captured complete
file manifest to the source owner's admission API; it does not reopen
the manifest or source files. On restart it reads `source-manifest.json` once
from the service-owned attempt directory selected by the validated attempt UUID.
The saved `manifestPath` never selects that read. The existing safe-path,
regular-file, two-megabyte artifact bound and full snapshot fingerprint checks
apply before the source owner validates the runtime inventory against it.

A successful admission retains an immutable artifact binding attempt UUID,
repository identity, HEAD, full snapshot digest and the validated runtime source.
This artifact lives with the service's admitted attempt records and is discarded
on close. A changed attempt source identity cannot reuse an earlier admission;
failed admission leaves no usable artifact. The service passes the same admitted
artifact to raw and retained evidence admission. It is not a client-supplied pass,
new persisted conformance flag or source identity reconstructed by a projection.
Direct proof assessment with a complete captured snapshot can instead invoke the
same source owner at its own admission boundary. Retained proof without a full
manifest or a service-admitted artifact cannot gain new runtime conformance.

For new proof attempts, the service retains `sourceContract: {definition,
architectureDefinition}` from the contract it already admitted before capture.
This is server-owned attempt data, never a client contract selector. Live capture
uses that same admitted contract. Restart restores it through the contract owner
and checks the reconstructed contract digest, mapping and architecture identities
against the attempt and snapshot before source admission. The contract owner is
the only authority for interpreting the saved definitions; a stored admitted flag
or another version with a matching selector cannot replace that admission.

Presence is determined with `hasOwn(sourceContract)`. Present-but-null, malformed
or conflicting material rejects admission. Attempts interrupted or failed before
a snapshot is produced remain readable with no source authority; absence of an
unproduced artifact is not a completed pair mismatch. Once capture has produced
a snapshot, a new capture must pair this contract with its verification descriptor. With the pair present, the service calls
`validateSourceSnapshot` once for the complete full manifest, obtaining both
runtime and verification descriptors without a second runtime validation. Its
private immutable artifact additionally binds the admitted contract identities,
verification descriptor and snapshot execution `configurationDigest`; changed or
removed members invalidate the whole artifact. The existing live zero-read,
restart one-manifest-read and read/replay zero-validation requirements apply to
this combined admission too.

Historical attempts without `sourceContract` may retain their prior runtime-only
admission and readable evidence, even if a verification descriptor was recorded.
Their verification authority is unavailable: that descriptor is not declared
valid and cannot supply a version reference or authorize a new producer. Do not
repair missing authority from the checkout, a latest review or an arbitrary
contract with the same digest. This compatibility path does not turn a malformed
present new contract into historical absence, nor weaken runtime admission.

Combined manifest admission establishes descriptor binding, not the continued
availability or integrity of retained source-tree bytes. Before publishing a
replayable version reference or composing another producer, the source owner must
validate the retained execution inputs at the service-owned attempt location.
The manifest and source tree remain pinned by existing attempt retention; no new
cleanup action may discard a referenced bundle. This admission slice alone does
not enable version references, target review resolution or source composition.

Records with no `runtimeSource` retain their existing standalone behavior and
cause no new manifest read. Present-but-null, malformed or unsupported identities
are not historical absence. Current missing or corrupt source artifacts reject
admission; another run or a client assertion cannot repair that recorded source.
API/CLI/Board reads, request replay and unrelated state changes consume the
admitted artifact without file reads or repeated runtime manifest validation.
Formal service cases must prove live/restart counts, unchanged source identity
across replay, refusal of changed identity or unsafe/missing manifest, rejection
before runner dispatch, and cleanup after failed startup. This boundary does not
prove an independently protected store or enable baseline acceptance.

### Prerequisites and partial work

A work's required prerequisite is usable behavior on this same assessed source.
Its immutable handoff description is explanatory text, not an executable oracle.
The prerequisite and consumer steps must resolve to the target contract's admitted
architecture routes and case-backed required or bypassed handoff decisions. The
upstream promise's obligations and every applicable incoming route's proving cases
must pass on this source. An admitted bypass requires its existing reason and
case evidence; it is not a manual prerequisite confirmation. Missing or ambiguous
route coverage, unresolved references, cycles and overlapping obligation ownership
block the affected work. No natural-language inference or merged-PR shortcut
may fill a missing handoff.

An independent work can pass its promise when all its obligations and applicable
handoffs pass and accepted behavior is preserved, while explicitly pending future
obligations keep the target pending. A work whose required proof has not been requested is pending; a requested proof
with missing or unsettled evidence is unknown; failed required cases are failed.
These states describe proof execution on the selected source, not whether an
agent task ran. Already-present behavior may satisfy a commitment through current
formal source evidence without an agent task or a merged PR. Prerequisite
readiness is reported separately from the work's own evidence, and an unsatisfied
prerequisite blocks completion even when its own cases pass. Neither this result
nor PR delivery alone authorizes task execution; a later admission slice must
consume a current source-bound assessment before enabling dependent work.

Whole-target integration requires no pending obligations, all current commitments
and their handoffs proven on the same source, and passing accepted preservation.
It exposes acceptance eligibility only. The version owner must separately enforce
an explicit authorized exact-base decision, current integration evidence and
retirement authority before any baseline mutation. This first owner slice cannot
accept a baseline or change the current version owner's decision inputs.

### Lifetime, cases and completion

Compute one detached assessment per explicit request from immutable admitted
artifacts. The action service retains the completed result for projections; reads
and Board refreshes must not recapture source, rerun raw report assessment or
rebuild target coverage. The target owner supplies coverage from its existing
revision artifact. No computed cache is introduced. Retained records without a
new assessment remain readable and confer no new readiness; target, work, task,
attempt and accepted-history identities are not renamed or rewritten.

Permanent owner tests must cover: independent partial success with pending target;
accepted regression despite passing new work; missing and duplicate evidence;
case-backed prerequisite success and missing/bypassed-route refusal; mixed-source
and mixed-contract rejection; individually passing contributions with a failing
integration; complete eligible integration without baseline mutation; changed-base
and allocation staleness; and preservation of failed historical results. Include
valid empty pending inventory and invalid empty required evidence, plus work-count
assertions proving assessment consumes completed owner artifacts without source
reads or repeated raw assessment. Existing Factory obligations remain unchanged.

The owner gate is `control-plane/__tests__/target-evidence.test.cjs`; integration
consumers later prove admission and Board/API/CLI parity. Before the full plan can
close, run the existing complete control-plane, seven-run Factory proof, static,
React, consumer, naming, lint, typecheck/build and browser gates, inspect the three
viewports, and demonstrate offline multi-PR success and integration regression.
No new model request, external test PR, required-check enforcement or provider
reconciliation is implied.
