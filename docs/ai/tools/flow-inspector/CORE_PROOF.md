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
