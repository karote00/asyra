# AI Runtime Invocation and Profiler

Status: profiler migration and measured execution corrections implemented; local validation and user review are the delivery gates.
Base: `e633627719525a437c54f0ceab16073e22ade4e5` (merged PR #301).
Closeout owner: this conversation.

## Task - runtime profiler migration

Move existing Design AI recording, timing, payload retention, usage, analysis,
assessment and report machinery into `@asyra/ai-agent-runtime` in one coherent
migration. Provide shared invocation middleware so registered calls are observed
without each tool implementing its own logger. Connect Design as the first
consumer. Preserve canonical action resolution, permission, confirmation,
transaction settlement, cancellation and the selected model/effort.

The product is an execution profiler: individual calls and public transport
activity, causal parentage, input/output references, purpose provenance,
expectations, execution outcomes, correction/retry links and recording failures
are inspectable. A lifecycle interval covering a wait is not proof that the
activity within that wait is understood. Never label item-delivery intervals as
measured private model reasoning.

### Scope and exclusions

Runtime diagnostics and invocation surfaces, Design observation/dispatch adapters,
their direct formal tests, package exports/build inputs, current product docs and
Inspector proof are in scope. Existing projection, queue and record utilities are
reused. Domain tool execution, image acquisition, schema delivery optimization,
geometry, renderer policy, AI model settings and new AI drawing experiments are
excluded. No new dependencies, telemetry service, automatic uploads, automatic
mutation retries, or remote operations. Stop for a required change to canonical
mutation semantics or an unapproved dependency. No production implementation
before the reviewed flow and proof mapping are admitted.

## Migration inventory

- `local-ai-usage`: invocation identity, lifecycle, bounded summaries, usage and
  transport counters. Remove fixed provider/effort/purpose values from the shared
  owner; supply them from the adapter.
- `local-ai-records` and `local-execution-timing`: persisted events, payload writer,
  parser and exclusive interval analysis. Separate portable projection from Node
  storage. Preserve readable saved evidence rather than silently rewriting it.
- `local-tool-payload`: payload sanitization and digest. Share one contract;
  isolate Node hashing/storage from portable imports.
- `local-ai-evaluation` and `local-ai-assessment`: deterministic reports and
  explicit optional assessment. Inject domain selectors; no Design constants in
  Runtime. Assessment provider remains host-injected and has no drawing authority.
- `execution-report-cli`: move command implementation to the Runtime Node entry;
  Design retains only its command/configuration and optional provider wiring.
- `local-tool-invocation`, `local-action-observation`, provider trace calls:
  move generic observation into Runtime; retain Design's admission/failure policy
  and receipt interpretation at their actual owner. All public tool dispatches
  cross the shared invocation boundary; child work carries explicit parentage.
- Existing record, evaluation, assessment and CLI tests move with their owners;
  Design keeps real adapter/integration tests. Add a non-drawing consumer case.

## Reviewed architecture

1. **Compose**: host configures an instance-local profiler, storage adapter and
   middleware. Importing the package starts no I/O. Tool dispatch is a reusable
   package capability; `run()` remains the complete user-intent flow and its
   policies remain authoritative. A tool dispatcher does not grant mutation
   permission and cannot replace canonical action execution.
2. **Invoke**: existing registry/dispatch resolves a tool through an `invoke`
   entry. Middleware records even unknown-tool/admission failures. Work has one
   request ID, call ID and explicit parent/context. Exactly-once `next()` prevents
   middleware from executing a write twice. Preserve original results/errors.
3. **Observe**: producer adapters emit public transport, scheduling, invocation,
   app handoff and settlement events. Reuse actual scheduler/action boundaries;
   do not infer per-action CPU time from an aggregate browser exchange. Capture
   chunk timing/bytes and public notification detail with explicit redactions.
4. **Retain**: ordered events refer to independently saved sanitized payloads.
   Request-scoped ownership, asynchronous writes, explicit flush/failure,
   disposal and no implicit network export. Diagnostics never change execution.
5. **Analyze**: one offline projection produces causal calls, separate inclusive
   and exclusive timing, explicit waits and retry/correction relationships.
   Missing events, unmatched calls, dropped writes and unavailable activity
   reasons remain distinct. Provide a trace export and readable/JSON reports.
6. **Integrate**: Design supplies domain labels, outcomes, model settings and
   event producers. Delete superseded generic implementations; no duplicate log
   pipeline or forwarding-only compatibility modules.

### Design risks and resolutions

- Current App analysis imports Design tool constants. Moving it verbatim would
  couple every consumer to drawing. Replace those selectors with explicit host
  report policy, while generic call/outcome/timing analysis remains shared.
- Current record files combine Node persistence and portable parsing. Split at
  that existing boundary; root/browser exports must not pull Node built-ins.
- Current profile uses broad provider lifecycle as residual coverage. Preserve
  ownership accounting, but report activity visibility independently and retain
  transport events; zero uncovered time is never full diagnostic completeness.
- Existing native reasoning item start/end can arrive within a millisecond.
  Their receipt times are events only. Do not derive hidden compute durations.
- App actions already have policies and grouped Undo. Instrument those owners;
  introducing an alternate executable action route would be a blocking defect.
- Record input/output once at the owning boundary and link from projections.
  Prove serialization/work counts and listener cleanup, not just equal output.
- Why a call happened is caller-declared purpose or an actual program decision,
  with provenance. Missing purpose stays unavailable. No extra model calls to
  invent explanations. Explicit retry links never authorize replaying a write.

## Formal cases and completion gates

- Invocation success, thrown error, returned failure, unknown operation,
  admission rejection, cancellation, partial completion and nested/parallel calls.
- Middleware is unavoidable through the public dispatcher and cannot execute
  `next` twice. Observation failure preserves the original result/error.
- Browser/server correlation, delayed/chunked provider messages, retries and
  terminal transport failure produce distinct causally linked events.
- Context/payload secrets are redacted; full allowed tool data is retained outside
  compact summaries. Repeated projection does not recapture payloads.
- Parser flags missing/duplicate/unclosed events and distinguishes recording
  coverage from activity knowledge. Historical records remain explicitly limited.
- Non-drawing host uses the same exported recorder, dispatcher and report without
  importing Design. Browser entry has no Node or vendor dependency.
- Port existing formal tests without weakening assertions, then run Runtime full
  tests/build and Design diagnostic/provider/action integration tests, naming,
  import/public API checks, Inspector source-bound proof and routed local checks.
- Review only this bounded diff, direct consumers and declared cases. Do not
  start another Taipei 101 generation merely to prove deterministic logging.

## Step cards

Implementation cards follow admitted owner steps. The initial preparation slice
changes only this plan, the thin profiler contract and its Inspector/proof design.
Inputs: current source and the retained full-run evidence. Output: reviewed
migration and executable-case mapping. Failure owner: preparation. No production
changes until contracts and handoffs agree.

### Observe - shared profiler migration

- Contract: Design execution spec `Shared Runtime profiler`, `Execution recording`
  and `Execution evaluation`; Inspector `observe` owns the entire diagnostic
  pipeline, including portable Runtime and host producer handoffs.
- Inputs: existing dispatch callbacks, explicit invocation context, public provider
  events, receipts, sink configuration and host report policy.
- Outputs: unchanged execution results/errors plus local records and offline
  reports/traces. Bypass: disabled recording and unavailable provider fields.
- Contributors: registered host dispatch and optional non-authoritative observers.
  Forbidden: alternate mutation, hidden reasoning inference, telemetry, extra AI.
- Boundary: listed Runtime profiler/Node/invocation files and Design producer,
  policy, command and direct tests in the Inspector allowlist. Failure owner:
  `observe`; no cache is introduced.
- Cases: existing `observe.accounting`, new `observe.transport`, permanent
  invocation/record/evaluation/assessment/CLI cases and non-drawing composition.
- Gates: prove missing transport events fail before implementation, retain current
  owner baseline, Runtime tests/build, Design provider tests, import boundary and
  naming. Stop on canonical dispatch/settlement changes or a blocking mismatch.
- Design review: keep the dispatcher generic by injecting the existing executor;
  middleware has no registry, permission or transaction authority. Export
  `createAiInvoker` from Runtime; instances expose `invoke`. Preserve `run()` as
  the existing policy-enforced whole-request API. Node I/O is a separate entry.
  Host policy supplies Design-specific selectors; generic reports remain useful
  without any drawing tool. Existing saved record schema remains readable.

### Integration review - backend import contract

The full Design gate rejected the newly authorized Runtime imports because its
historical backend guard admitted only pure Group bounds. Admit only Runtime's
two public entries alongside that existing entry. Add bundle-graph proofs for
both entries: no other Framework execution owner or App dependency may enter;
only the explicit Node entry may retain Node built-ins. Keep the collaboration
and document backend bundle assertions unchanged. This is a direct migration
consumer test correction, with no production execution or bundler change.

### Capture proof source - authorized owner transfer

User authorization: include owner-transfer source composition validation. Extend
this task only to the source owner, its permanent tests and contract docs.

- Owner/failure owner: `capture-proof-source`, CORE_PROOF `Derived source
composition`, core-proof Inspector source admission/composition routes.
- Inputs: two trusted retained source admissions, exact chosen verification
  contract, verified current runtime bytes and captured workspace manifests.
- Output: unchanged runtime byte identity, original verification identity, and
  execution authority derived for that verifier from the current runtime graph.
- Conditions: scoped formats agree; every package, entry and source-input
  declaration required by the verifier resolves inside the same captured runtime
  inventory. Rebinding changes contract/step ownership only, not the package
  inventory or source definitions. No legacy upgrade or implicit extra capture.
- Contributors: source owner and existing captured manifest resolver. Forbidden:
  current checkout reads, historical runtime substitution, changed verifier bytes,
  descriptor-only admission, relaxed assertions or altered accepted evidence.
- Allowlist: snapshot.cjs, workspace-sources.test.cjs, snapshot.test.cjs and the
  directly affected CORE_PROOF/Inspector documentation; no runner policy change.
- Tests first: App-to-package owner transfer through ordinary and derived
  composition, unchanged runtime bytes and verifier files, one read per entry;
  reject missing owners, incompatible source inputs, altered bytes and mixed
  scope formats. Existing source/derived/consumer tests remain required.
- Review: recompute the selected verifier's closure using already checked current
  runtime bytes. Do not copy the old authority because manifests may differ.
  Preserve the source's original authority for validating its execution binding;
  derive a separate authority only after byte admission. Runtime identity remains
  bytes-only, as already required by the contract.
- Completion: source tests and direct consumers pass, then retry the real target
  assessment and run applicable local validation. Keep any genuine verifier
  incompatibility explicit; owner transfer cannot silently rewrite old tests.

Validation before this expansion: routed local run
`15e73318-7155-4887-affe-0c574232fbb2` passed all selected checks with
`sourceVerified=true`, including both Design E2E suites and render contracts.

Owner-transfer evidence: the two new composition regressions first failed with
`Runtime authority: contract scope mismatch`; source suites now pass, including
original derived-execution fingerprint work counts. A separate case verifies
rebinding a previously derived runtime without confusing its original execution
authority with the newly selected verifier authority.

Real assessment `9d850a51-04d2-4738-96fa-fbe85f467d3d` now executes both selected
contracts on one runtime digest. The current target passes all 13 cases. The
accepted verifier cannot load `../local-ai-usage`, because its frozen test imports
the private module removed by this migration. Its failure remains visible and
whole-target eligibility remains false. Source composition must not rewrite that
verifier or revive obsolete production adapters merely to turn the gate green.
The current proof ports those assertions to the public Runtime APIs. The user
clarified that a Flow is the current project contract, not a historical verifier
retention policy. The obsolete test imports are not a product regression.

### Current contract verification - authorized correction

Objective: current Flow nodes are verified by the current contract and its exact
associated tests. Remove obsolete verification requirements after intentional
contract changes. Historical records remain readable evidence only; no new
assessment dispatches an obsolete verifier or restores deleted private modules.
Discovery is bounded to target assessment, registered orchestration, version
acceptance and their direct work/review/Board consumers. No repository-wide Flow
rewrite, new dependencies, live drawing, renderer change or remote operation.

Reviewed design: introduce assessment format 3 to distinguish current-contract
verification from saved historical formats. New assessments dispatch only the
pinned current target verifier, validate its full obligation inventory, and derive
work/handoff/integration status from those observations. Contract changes remain
explicitly reviewed; missing or failing current tests cannot pass. Existing
format 1/2 records retain their original meaning and cannot authorize new baseline
acceptance. No test-entry aliases or old implementation compatibility adapters.

Step cards (execute sequentially):

1. `assess-target-source`: CORE_PROOF Current contract authority. Inputs are
   current admitted contract, exact verifier/source, complete producer inventory
   and frozen allocation; outputs complete contract, work and integration results.
   Old base identifies change/staleness only. Owner/failure owner target-evidence;
   files target-evidence.cjs and target-evidence.test.cjs. Test missing/failed,
   wrong-source, stale, removed obligations and successful updated verification.
2. `serve-proof-actions`: same spec, registered dispatch. Inputs selected current
   review and runtime; output one persisted target producer and truthful lifecycle.
   Files service.cjs and its tests. No historical verifier availability required
   for new dispatch. Exact replay/restart/cancellation and immutable past results
   remain required; tests count actual dispatches, not just output status.
3. Direct consumer steps `review-contract-evolution`, `manage-flow-target`,
   `prepare-pr-review`, `render-proof-board`: consume format-3 owner results;
   preserve exact source/actor/review/retirement and currentness checks. Their
   existing allowlisted implementation/tests and contract docs are the boundary.
   Remove accepted-preservation gates from new results and display current
   contract status. Failed, unavailable or stale current proofs cannot advance.

Allowed contributors are existing contract, source, evidence and target owners;
forbidden are client-supplied green verdicts, source substitution and old-test
shims. No cache. Gates: focused formal regressions fail first, naming, complete
Inspector suite/lint/build and applicable shared checks, then real Design target
assessment. Prior full Runtime/Design validation remains valid if those owners'
source does not change. Stop for an unrelated owner or a changed product policy
outside this explicitly authorized correction.

### Current contract correction - verification

- New format-3 assessments dispatch one current target verifier. Current cases,
  handoffs and work statuses drive complete integration. Historical format-1/2
  records remain read-only; they cannot authorize new baseline/work acceptance.
- The actual Design migration assessment
  `b3fb071d-abf1-4a01-9e6e-312691764fe6` passed all 13 current cases with one
  target producer. Exact current contract digest matched the checkout and was
  accepted locally by the explicit current-Flow update decision. No old private
  Design module was restored, and no historical verifier was executed.
- Permanent regressions cover removed historical private imports, current failing
  and missing tests, unexpected old producers, node-local failures, source/replay,
  cancellation/restart, explicit acceptance and untouched historical results.
- Complete control-plane suite: 485 cases, 483 passed, 2 existing conditional
  skips. The additional removed-private-module regression passed separately.
  Board E2E: 15 cases, 13 passed, 2 existing conditional skips. Inspector full
  lint/build/test and routed shared validation passed. Evidence lives under
  `tmp/ai-runtime-profiler/current-*`.
- Prior full Runtime/Design local validation remains applicable: no Runtime or
  Design implementation changed in this correction. The existing all-owner result
  is `tmp/local-validation/1479fc04-20b9-4b8a-8bd8-a51d3f6a6ce0/result.json`.
- Review stayed within current contract assessment, direct consumers and source
  ownership migration. No dependency, model, rendering or mutation policy changes.
  Remote delivery is separately authorized by the user's final PR/push request.

### Final self-review and delivery

- Reviewed invocation settlement, observer isolation, local payload retention,
  portable/Node import boundaries, Design dispatch integration, source ownership
  composition and current-contract acceptance. No unresolved blocking findings.
- Compared the full local validation's recorded file hashes with the current
  checkout: Runtime and Design inputs are unchanged. The later Inspector changes
  have their own complete owner, Board and shared validation above.
- The latest fetched `origin/main` remains the recorded base. Push and PR creation
  are authorized; merge is not. Remote CI and user review remain delivery gates.

## Task - measured execution corrections

Status: implemented and self-reviewed. Authorized by the user after the full 101 run on 2026-10-09.
This task extends the earlier profiler-only scope; it does not reopen its migration.

### Bounded contract and reviewed order

1. Canonical bulk subtree deletion: Scene prepares one combined removal, Core
   prepares orphan properties once, and ordinary owners retain deleted instances,
   release relationships and publish reversible evidence. App exposes plural
   deletion through its existing registered actions. Preserve invalid-input
   atomicity, shared properties, input ordering, Undo/Redo and remote replay.
2. Compact operation receipts: project structural acknowledgements using the
   declared result contract; retain identities and failures, with full evidence
   available explicitly. Canonical history evidence is never truncated.
3. Query-to-mutation handoff: consume exact region/filter results through the
   request-owned target resolver without returning complete metadata pages when
   only identities are needed. Preserve current mutation admission and explicit
   pagination/empty results; never silently widen a query.
4. Review-to-correction handoff: retain unresolved findings, their criterion and
   current scope, and expose that context to correction. Preserve fresh final
   whole-result review; do not cap reviews or reuse expired visual approvals.

The ordering is intentional: canonical deletion semantics precede its compact
receipt; query and review consumers then use those stable contracts. Existing
plural canonical removal only accepts leaf elements and old snapshots, so it
cannot be used as a subtree command. Reuse the existing prepared subtree artifact
and lifecycle, extending preparation to multiple non-overlapping roots with one
hierarchy/relation scan. Nested selected roots are included by their ancestor;
duplicate, missing and Workspace targets reject before writes. Each evidence
record retains the sequential parent order required by replay. Consecutive leaf
roots share the existing REMOVE_ELEMENTS evidence, avoiding repeated full sibling
arrays; nonempty containers retain existing subtree evidence. No new wire event
is introduced.

Discovery is limited to the recorded slow calls, deletion owners and direct
consumers, operation result contracts, request target resolver and review owner.
Allowed owners: Scene Tree, Core and their typed facades; Design common APIs,
registered action/schema/disposition, operation/query/review adapters; direct
formal tests and the existing execution spec/Inspector/proof mapping. Props
Manager changes only if shared deletion correctness or measured work demands it.
No rendering, reference acquisition, model/effort, artistic geometry, dependency
upgrade, global cleanup, push or another live generation is included.

Tests must prove work counts rather than machine time: 288 selected roots in a
large scene share one hierarchy preparation, relation inventory and property
graph preparation. Check nested groups, overlapping selection, unrelated and
shared property preservation, atomic failure, replay and canonical publication.
Then verify compact/full receipt parity, query identity handoff and stale review
evidence. Run focused gates, naming, affected package build/tests, Design checks
and the routed local validation at the completed slice. Stop a segment if
equivalence or an owner contract cannot be established; revise this bounded
design before continuing rather than adding a fallback.

### Apply - deletion step card

- Contract: execution spec Preparation and execution; Inspector apply.
- Inputs: admitted unique element IDs, current canonical scene/relations and
  ordinary event options. Outputs: removed identities, normal owner evidence
  and replay-retained instances. Empty input is inert; invalid input rejects.
- Contributors: registered App action, Core coordination, Scene and Props owners.
  Forbidden: direct renderer writes, AI-specific tombstones, skipped validation.
- Boundary: Scene preparation, Core facades, App element deletion and descriptors,
  direct tests. Failure owner remains canonical admission/apply. No cache.
- Cases/gates: combined work count, nested and shared deletion, stale prepared
  artifact, undo/redo and remote evidence equivalence; focused owner tests before
  downstream integration. Re-read apply contract before advancing.

### Apply - compact receipt step card

Deletion slice: Scene 66 cases, Core coordination/hierarchy/facade 49 cases,
App deletion/action 20 cases pass; builds pass. Shared property survival, mixed
leaf/container Undo/Redo and invalid batch atomicity are covered. Naming passes.

The apply owner projects only declared moves/removed results after execution.
Inputs are successful canonical receipts and their registered result kind; output
is compact identity evidence or explicit full evidence. Unknown, failed or
partial shapes stay unchanged. No canonical reread or mutation is permitted.
Boundary: local-operation-tools and direct tests/spec/Inspector. Test a large
structural result, full parity, empty result and failed/unknown preservation.
Do not replay a write to recover a response. No provider or renderer changes.

### Apply - region query handoff step card

Compact slice: 80 operation-tool tests pass, including full/compact structural
parity and preservation of failed output. The next apply segment consumes an
explicit region query as a batch target. The backend resolves complete IDs once
through registered read_design_context, then feeds the existing target resolver
and canonical mutation admission. Bounds/filter scope is never widened. All
operation shapes are checked before query dispatch. Queries select an identity
snapshot before any writes in the batch; subsequent mutation admission rechecks
current targets. No model callback, pagination loop or retained cross-call cache.
Inputs: region bounds/filter plus registered operation and new values. Outputs:
ordinary mutation receipt and query count. Missing/incomplete query data rejects
before mutation; empty matches report an explicit no-target preparation result.
Boundary: existing context reader/action, operation tools/batch and direct tests.
Cases: >200 region matches use one owner query and one plural write, no computed
reads/metadata response, malformed/partial/empty/cancelled query cannot write.

### Inspect - correction handoff step card

Region handoff: 115 operation/context tests pass, including >200 targets and
incomplete, empty and cancelled queries. Design typecheck passes.

Inspector inspect retains unresolved findings by criterion. Return their full
evidence, already-bound element IDs and the actual inspected target/region to
the caller; missing scope stays absent and inspection-local regions are not
invented workspace query bounds. Inputs are existing checks, independent findings,
bindings and admitted inspections. Output is diagnostic correction context, never
approval. Mutations retire current inspections; failed findings survive, stale
passes cannot clear them, and final acceptance still requires fresh complete
review. Boundary: local-design-review, operation adapter and direct formal tests.
Test failed review context and fresh/stale transitions before implementation.

### Measured-correction review and evidence

Bounded self-review checked Scene/Core tombstones, retained property roots,
canonical event replay, App catalog/dispositions, complete region-query admission,
compact/full output parity and fresh/stale visual review transitions. No provider
settings, renderer, reference acquisition or artistic decisions were changed.
The correction handoff reports actual inspection-local regions; it does not
reinterpret them as workspace bounds. Empty or incomplete region selection fails
before any mutation rather than applying a partial page.

Focused evidence: Scene 209 and Core 260 tests, Design general 456, AI 426,
server operation/review/flow 160 passed before the additional 288-property replay
case. Full routed local checks remain the final gate. The public documentation
source map/API index is regenerated from the new facade. Inspector's existing
contract test now checks the actual Runtime observe owner, nested spec headings
and the established spatial cache contract instead of obsolete blanket claims.

Current flow candidate `cb673f90-442c-4d90-b43e-c68be060a26e`, reviewed contract
`bcfedbfd3822f8bb3f2acbc3d0f1771ccfb70528dda23b0d40a0f0dbb57c2a3d`, target
`fe712b56-cb13-49f5-8239-f26d8dba2e23`, assessment
`de25e2a5-0f8d-4b27-86f0-dc3a25f58076` establish all 14 current mapped obligations
on one runtime source; eligibility is true. Real 101 wall-clock improvement is
not yet measured; these tests prove work counts and correctness, not model time.

The final local routing run passed dependencies, declarations, shared checks,
Design, the public documentation site, Office, Sim, Core and Asyra FieldScope before
the Inspector check found its generated workspace snapshot stale. Regenerate
that snapshot with the existing generator; no App or Framework runtime fix was
needed. Resume the failed/unrun owner checks plus checks selected by the exact
metadata/generated-artifact delta, preserving prior passing evidence only after
verifying its runtime inputs are byte-identical. The additional 288-property
reverse-selection replay case passes (20 hierarchy tests).

### Apply - E2E contract alignment

The final functional gate fails at `ai-conversation-flow.spec.ts:703`: an old
replacement scenario still clicks Approve after the canonical edit has already
settled. The current conversation spec and compose/apply contract require internal
undoable edits to execute directly. Align the three remaining approval interactions
in that same formal test file with this contract, asserting no confirmation after
settlement; preserve partial-result, original-state, missing-target and complete
Undo/Redo assertions. This is test-only correction within the existing App scope.
Run focused replacement/revision cases first, then the remaining functional and
render-contract gates; runtime source is unchanged.

### Final validation result - measured corrections

All applicable local obligations passed across the source-verified routed runs.
`53693fda-a70d-4051-8ee6-e7ce2ed08073` retains unchanged App/Core/Asyra FieldScope
passes; `1ca6f8de-2d29-4e53-bb63-12ad4f69cf5b` adds corrected Inspector,
remaining package/profile checks and collaboration E2E;
`1277588f-6ae8-4f22-8a80-442d21d6da0d` passes the final shared/Design checks,
functional E2E (390 executed, 5 expected-failure cases, zero flaky) and all three
render contracts. Failed runs remain preserved as evidence. The only subsequent
source edit is this validation summary. Runner-owned process groups are cleaned.
The focused replacement/revision cases also pass (3 cases).

The two validation corrections were generated Inspector catalog synchronization
and obsolete Approve interactions in formal E2E; neither changed production
behavior. Plan, current spec, BDD, Inspector and public API documentation are
synchronized. No known deferred contract drift within this bounded task.
No push or new live 101 generation was performed; actual 101 deletion wall time
remains unmeasured after this change.

## Task - reliable tool delivery and recovery

User authorization: 2026-10-09, after the full 101 run `196416d7-aca0-4d35-9dab-00c995683ae0`.
Continue in the existing feature worktree and preserve the measured-correction
changes. The root conversation owns this plan and closeout. This task supersedes
the original exclusion of reference acquisition/schema delivery only for the
bounded owners below. No push is authorized.

### Frozen scope and reviewed design

Outcome: correct, scoped definition recovery; diagnostic bounded reference
acquisition; source-identifiable Runtime records; tested query/edit and
review/correction handoffs. Fixed discovery: the retained run's exact lookup and
reference calls, their producer/consumer implementations and existing formal
tests. No repository-wide audit, model changes, renderer work, artistic repair,
new dependencies, arbitrary model callbacks or automatic mutation replay.

1. Compose: preserve the canonical registry and full schema route. Partial
   definition recovery must preserve its requested scope instead of requiring a
   full refresh. Return executable scoped lookup routes and distinguish initial,
   unchanged, changed-version and explicit recovery responses; record a supplied
   recovery reason or unknown, never infer model context. Provider transport
   forwards full text; native presentation is not proof of retained context.
   Document retaining parsed Code Mode values and forwarding only needed fields.
2. Prepare: preserve original bytes, DNS pinning, per-hop URL checks, byte/decode
   limits, cancellation, ordered per-source receipts and existing candidate
   failover. Transport reports structured stage/cause/status. Retry only a
   classified transient read once within the original deadline; permanent errors
   and cancellation do not retry. No negative cache or lower-resolution fallback.
3. Observe: host captures source identity once per invocation, then supplies it
   to the shared Runtime profiler including child review. Generic Node source
   capture is explicit/inert, source-scoped and failure-tolerant. Revision and
   dirty/untracked source fingerprint are separate. Missing upstream payloads
   explicitly retain unavailable provenance. Existing request/call/payload links
   correlate lookup and recovery without new model calls or invented reasoning.
4. Integration: retain all mapped flow obligations and extend exact scoped
   recovery, reference failover, source metadata and real region-query to plural
   mutation cases. Preserve deletion Undo/shared-property and fresh review gates.
   Run one complete headless 101 only after deterministic owner checks pass;
   original prompt/model/resolution, initial/final fit, final ten-second hold.

Public additions are neutral optional request/receipt metadata at their current
owners. No saved-document format changes. Runtime recorder accepts optional
source fingerprint; older evidence remains explicitly absent. Definition partial
results remain documentation, never executable substitute schemas. Current
canonical admission keeps all constraints. No claim of eliminating provider
internal waits or guaranteeing a generated drawing duration.

Feasibility review: existing lookup fragments, in-flight image reuse, candidate
resolver, source metadata slot, shared invoker and region target resolver provide
the necessary boundaries. The missing contracts are scoped refresh, classified
transport failures and automatic host source provenance. These are corrected at
their existing producers, not downstream in render or duplicated App logs.

### Compose - delivery recovery step card

Spec: Capability discovery and composition. Inspector: compose; failure owner
compose. Inputs: exact registered identity, current schema revision, requested
view/paths and optional declared recovery reason. Outputs: matching complete or
partial definitions, required local dependencies, explicit delivery provenance
and scoped recovery routes. Repeated full reads reuse the request-local version;
explicit refresh returns requested scope. No canvas dispatch, validation bypass,
model-retention claim, fixed API list or write retry. Boundary: local-operation-tools,
its direct tests, ai-domain-prompt and existing provider delivery tests. Formal
red/green cases: partial refresh without full retransmission; exact scoped route;
unknown-path failure followed by valid recovery; revision change; original full
schema and native forwarding parity. Gate: focused operation/provider tests and
naming. Stop on a need to modify vendor Code Mode.

### Prepare - acquisition recovery step card

Spec: Reference acquisition and redisplay. Inspector: prepare; failure owner
prepare. Inputs: public URLs, source declarations and abort signal. Outputs:
unchanged admitted bytes or structured stage/reason/status and bounded attempt
counts, reusable selected identity. Bypass: existing successful acquisition.
Contributors: existing DNS-pinned downloader and page resolver. Forbidden:
private networks, resolution reduction, credentials, inferred image suitability.
Boundary: reference-image-download, local-reference-tools and their formal tests.
Gates: network-status/timeout/format/size/DNS/redirect/cancellation cases, same
source attempt counts and existing original-byte/candidate-reuse contracts.

### Observe - source provenance step card

Spec: Shared Runtime profiler and Execution recording. Inspector: observe;
failure owner observe. Inputs: host-selected source roots/revision and public
provider metadata. Output: revision/fingerprint in request and child records,
explicit unavailable upstream input/output. Node capture is invoked at request
entry only; no per-tool scan, telemetry or diagnostic execution authority.
Boundary: Runtime Node source helper/exports, recorder/record projection and
formal tests; Design ai-model-provider/local-ai-provider and direct tests.
Gates: dirty/untracked/clean source identity, invocation capture count, read
failure preserves execution, child propagation and unchanged payload links.

### Integration and closure

Re-read compose/prepare/observe and connected apply/inspect contracts before
advancing. Update current spec, BDD and Inspector proof together. Run focused
red/green tests, Runtime/Design lint/build/tests, naming, source-bound flow proof
and routed local gates at the completed milestone. Preserve previous failures;
review only current diff/direct consumers and declared cases. The final single
101 recording reports ownership timing, work counts, recoveries, bytes and
unexercised paths honestly. Stop for scope expansion, missing required contract,
or exhausted subscription allowance; no credit-funded long run.

### Reliable delivery and recovery - completion evidence

The bounded implementation and one complete live run are complete locally.
Compose/prepare/observe were rechecked against the current flow; canonical
validation, original reference bytes, source ownership and connected review/apply
contracts remain intact. No push was performed.

- All 23 routed local gates passed with `sourceVerified=true` in
  `tmp/local-validation/c9cc0d9b-11b1-40b1-8c0e-8cfeafcf8b78/result.json`.
  Focused red/green evidence is retained under `tmp/tool-handoff-recovery`.
  Runtime has 149 passing tests; current flow has 16 passing cases.
- Current source candidate `e2d2c564-3598-451f-be8a-a977b24d80f8`, revision 7,
  target `06194fa7-2da0-4205-9e7a-e87c0312ef73` and assessment
  `4c90229a-e299-4466-929d-47a53f084ed0` are eligible, with same-source
  preservation verified.
- Live request `a1ee5461-d02f-46dc-be9d-57ab19375948` completed successfully in
  639.239 seconds; first visible geometry at 43.269 seconds, 17,212 document
  elements. It used the unchanged full-building prompt and gpt-6-astra medium,
  headless 1920 x 1080 recording, two fit operations and final ten-second hold.
- API lookup output was 87,592 bytes versus 159,607 previously. Region queries
  requested fills inside explicit bounds; plural deletion removed 13 artifact
  targets in 0.228 seconds. Final visual review retained a failed detail,
  accepted a later correction with fresh evidence, and completed normally.
- One HTTP 403 is recorded as a permanent response failure with one attempt;
  subsequent original-image acquisition succeeds. Live source revision and
  dirty fingerprint match both child reviews and the post-run capture. All
  290 referenced diagnostic payloads pass digest verification; no recording gap.
- The run still contains two corrected input rejections (missing fact
  dependencies and unknown schema path `/`) plus one nonexistent operation
  lookup. No successful scoped refresh or transient retry was needed in this
  live run; their evidence is the formal tests. Total drawing time increased by
  27.295 seconds with different generated work and two independent reviews;
  no general speedup or elimination of model input mistakes is claimed.
- Detailed timing, call payloads, trace, screenshots, native archive and video
  are in `tmp/full-101-tool-recovery-20261009`. Test services were stopped.

Decisions: keep full-schema recovery and strict known-path admission; retry only
classified transient reference reads once within the original deadline; retain
explicit unavailable upstream payloads instead of fabricated data; capture
source identity once at the host invocation boundary. No dependency, model,
rendering, reference-resolution or document-format change was introduced by this
bounded delivery/recovery step.

## Task - scoped review and reliable handoffs

Status: implemented and verified with scoped regression checks; not pushed. User-authorized extension on
2026-10-10 in the existing worktree; no push. Baseline is HEAD
`918653a96fb908c118db5346257a27d9e5b46f77` plus the validated dirty source
fingerprint `7fdd4e5aad0780c28e415410f5a5c38acb62eb978793f23c44adb7911cdd7676`.
The preceding tasks remain preserved. The retained full run is
`tmp/full-101-adaptive-fit-20261009`, request
`d97e93bd-e793-4581-9676-bca398f845e7`.

### Frozen scope and design review

Outcome: each AI tool advertises one understandable responsibility, evidence
updates invalidate only their real consumers, unresolved completion returns an
executable handoff, and document export can confirm the requested durable
version. Preserve canonical precision, current-image validation, source authority,
Undo, shared properties, cancellation and original image bytes.

Discovery is limited to that run's call payloads and the direct producers and
consumers of review/facts, API discovery, reference acquisition, prepared design,
batch mutations and document publication/durability. Review the registered tool
catalog for overlapping names and responsibilities; do not redesign unrelated
App/Core APIs. Use work-count tests and exact normal-caller traces rather than
fixed machine-time thresholds. Mutation families are these owners, direct tests,
current specs/BDD/Inspector and required generated contracts. No rendering,
model/effort change, new dependencies, fixed search sources, arbitrary JavaScript
callbacks, reduced resolution, data rounding or global compatibility aliases.

Reviewed order and feasibility:

1. Inspect: separate request criteria, source facts, derived calculation notes,
   reference selection and actual drawing review at discovery/dispatch. Reuse
   the current review state and canonical evidence validation, not parallel
   authorities. Derived notes may be corrected with evidence and retained source
   dependencies; they do not overwrite verified facts or certify the canvas.
   Do not turn a negligible documentation correction into a geometry change.
   Numerical precision remains unchanged; model guidance evaluates significance
   against requested tolerance, object scale and viewing scale, never a universal
   one-pixel rounding rule.
2. Inspect/compose handoff: identical facts, bindings and reference selection are
   no-ops. Unrelated additions do not expire accepted work. Real affected facts,
   bindings, references or canonical changes retain conservative validity checks.
   Return changed/invalidated identities, affected criteria and explicit next
   registered tool/required evidence. Never silently approve stale work or run
   mutation retries. Unknown impact is not a no-op.
3. Settle/durability: trace the existing outbox acceptance and backend sequence
   queue before adding an API. Distinguish drawing completion, accepted shared
   publication and durable checkpoint. Wait for the captured version through its
   owner; handle disconnect, conflict, failure, cancellation and document change.
   Do not compare element counts as a persistence proof or wait for unrelated
   future edits indefinitely.
4. Prepare/compose: inspect repeated draft construction, ordered parts, pattern
   use and definition deliveries from the recorded gaps. Reuse existing typed
   patterns and handles; remove proven repeated work with equivalence/count
   tests. No claim to eliminate private provider time. Inspect original-image
   failures and lookup deliveries; change only demonstrated defects, not source
   policy or deliberate full-schema recovery.
5. Apply: profile the normal multi-operation deletion and largest prepared
   batches at their canonical owners. Remove repeated shared work only with
   preservation tests for order, transaction/rollback, shared properties, receipts
   and current evidence. No merge of operations whose semantics depend on order.
6. Integrate: validate tool selection through schema admission, real dispatch,
   receipt and successor call for every changed tool. Run current source-bound
   flow proof and directly affected owner regression, type and lint checks. Do not
   run whole local CI; the user explicitly corrected that scope. Keep the existing
   successful behavior on this same source. A new live model run
   is not a substitute for deterministic regressions; this task does not require
   another paid complete-building generation.

Concrete discovery findings: record_design_review currently mixes four phases
and invalidates acceptance based on field presence rather than semantic change.
The live 0.8-pixel correction changed a narrative fact, not proven geometry. The
nine API queries requested different definitions/fragments; no identical lookup
repeat was found. The first reference failure was an explicit HTTP 403 with one
attempt and later successful alternatives, not an incorrect retry. These last
two findings do not authorize speculative caches; direct-owner regression gaps
and unnecessary schema overlap remain in scope. Backend persistence was queued
when the first snapshot was read; no data loss was established.

### Inspect - evidence responsibilities step card

Spec: Retained verified facts; Evidence and completion. Inspector: inspect,
connected compose/settle routes; failure owner inspect. Inputs are request-linked
criteria, admitted fact/source dependencies, canonical IDs and current evidence.
Outputs are typed evidence receipts, scoped invalidation and actionable pending
review. Repeated identical input bypasses invalidation. Only a true affected
change or unknown dependency footprint can require renewed approval. Contributors
are current review/fact stores and public canonical evidence validation. No
renderer, identity guesses, document edits, numeric rounding, private model data
or receipt-as-visual-proof is allowed. Boundary: local-design-facts/review,
operation tool registration/dispatch, their constants/prompt/presentation/direct
consumers and formal tests. Formal cases cover identical facts/bindings/reference
selection, unrelated additions, changed bound facts, missing dependencies,
atomic rejection, derived-note correction, concurrent evidence changes, strict
split-tool schemas and completion recovery. Existing source-fact replacement
protection, independent comparison and final evidence checks must still pass.

Stop the affected segment on missing owner capability or contradictory contract;
repair only inside this scope. Review the changed flow and admitted contract
before production edits. Each later owner gets its own short step card after
this step's focused gates pass. Final review stays within the frozen families.

### Inspect checkpoint and settle step card

The current source passes 413 evidence/dispatch/provider/evaluation/flow tests
(three opt-in live cases skipped). Negative proofs precede fact no-op, unknown
impact, split dispatch and deferred-scope corrections. A scoped data-only
correction retains unchanged visual approval; additional deferred work requests
full comparison. No numerical rounding is introduced.

Settle inputs: the current document session, local publication queue boundary,
server-applied sequence and document generation. Output: a durable receipt for
that captured sequence, or an explicit unavailable/local-only result distinct
from drawing completion. Reuse the socket request channel and persistence queue;
wait for its contiguous acknowledgement without changing its dirty-window cadence.
Do not block subsequent local publication behind the durability wait or include
future edits in the target. Cancellation, disconnect, Reset, conflict and backend
failure reject confirmation without rolling back accepted edits. No browser
snapshot save or element-count comparison. Implementation boundary: document
persistence queue, collaboration protocol/server/provider/lifecycle, final outcome
adapter and their formal tests/specs. Test first for captured-target completion,
future edits, cancellation, failure, generation validation and local-only status.
Names: confirmPersistence (session action), confirm-persistence (wire request),
whenDurable (queue observation), DocumentPersistenceReceipt (sequence proof).

### Apply - hierarchy validation work step card

Settle focused gates pass: persistence queue/protocol 79, browser/session/action
86 and the real socket/backend confirmation integration. The latter also sends
a successor publication during confirmation and rejects a wrong generation while
keeping the connection usable. No force flush or document snapshot write exists.

Apply discovery found repeated ancestor walks inside each canonical hierarchy
validation, before plural removal. Inputs/outputs and failures remain the existing
SceneTree hierarchy contract. Replace repeated ancestor queries with a local
parent map and completed-path set for this single validation only. Validate every
membership and parent before cycle detection; retain duplicate, missing parent,
missing child and cycle failures. No across-mutation cache or trusted-tree bypass.
Formal deep-chain work-count regression must fail first, then pass with existing
hierarchy, mutation, Undo and shared-property cases. Mutation scope is SceneTree's
validator, its formal tests and package documentation. This is the existing apply
step boundary; neither rendering nor the public API contract changes.

### Integration checkpoint

Evidence duties now have separate public tools: define_design_criteria,
record_design_facts, record_design_calculations, select_design_references and
review_drawing. The former multi-purpose review name is no longer registered.
The composed prepare/apply tool remains an intentional orchestrator over typed
owners; query, preparation, mutation and inspection still have separate contracts.
No source-selection policy, arbitrary callback execution or model configuration
was added. Derived notes retain exact values and valid source dependencies;
corrections do not rewrite source evidence or canvas geometry.

The recorded nine definition queries selected different definitions/fragments.
The reference acquisition failure was one HTTP 403 followed by a different
original source. Existing recovery and definition-delivery proofs remain required;
there is no evidence for an additional cache or retry policy in these two cases.
The plural removal API has no 64-target limit. Existing artifact, pattern and
region-handle reuse remain the preparation owners; operations with ordering
semantics are not silently merged.

The 120-group hierarchy regression counted 7,503 parent reads before the change;
it now requires fewer than 720 while also rejecting corruption introduced after
an earlier validation. The shared work belongs to one validation call, not a
retained cross-mutation cache. Queue and real-socket tests confirm the captured
sequence without waiting for future edits. Session tests also cover nonblocking
successor publication and immediate cancellation while an earlier publication
is pending. The cancellation test failed before its owner correction.

Current focused proofs pass: 250 evidence/dispatch/schema/flow/queue tests,
85 session/provider/action/runtime tests, 130 hierarchy/mutation tests, and the
real socket persistence integration. The current flow has 18 executable cases;
negative scenarios still detect missing tool registration, wrong execution owner
and stale evidence acceptance. Closure uses focused owner checks; the user did not request whole local CI. Its initial declaration failure was an unsupported Array.at in the new test,
now replaced with indexed access. Generated documentation was refreshed for the
changed source/spec hashes; the cancelled broad run is not a closure gate.

Final direct-consumer review found that an invalid source receipt named drawing
review as the next tool while its prose required source repair first. The new
regression fails on that mismatch and proves the complete fact-repair-to-review
handoff after correction. The receipt now directs record_design_facts before
review_drawing. The earlier routed run was cancelled so final evidence will cover
this correction too; completed gates remain diagnostic evidence, not final closure.

### Inspect - reference receipt correction

The full routed local validation was cancelled at the user's direction. Its
completed jobs are evidence only; do not restart it or claim that it passed.
No push is authorized. A complete 101 test means the agreed recorded drawing
run, not a repository CI run.

Final bounded review of the five changed evidence tools found reference selection
still delegates to fact recording and returns all source facts with phase=facts.
This violates the distinct-responsibility product contract. Correct only the
inspect owner, its dispatch, direct tests and matching current spec. The next
formal public-dispatch regression must prove that selecting references returns
selection/change/review state without source-fact payloads. Owner cases cover
unchanged acceptance, changed selection, invalid input, retained facts and recovery
when source facts are invalid. Keep composed criteria initialization intact;
remove the superseded facts route for reference selection. Reuse the same review
handoff builder so source repair remains prior to visual review.

Self-review: this is within the existing inspect implementation boundary. It
changes neither mutation, persistence nor reference acquisition. Naming belongs
to the request-local evidence owner. Verification is limited to evidence owner,
public dispatch, schema, prompt and flow proofs, plus affected TypeScript/lint
checks. Do not run unrelated workspace suites or a new live drawing for this
internal receipt correction.

### Scoped completion evidence

The public reference-selection regression failed before correction because the
reply was a fact-recording payload. Selection now has its own request-owner method
and returns indexes, change and review state only. Source repair and drawing
review share one handoff builder. Repeating an accepted selection has no next
review request; changed or empty selection invalidates comparison; malformed
selection leaves retained state intact. The old facts-phase selection route is
removed. Criteria initialization retains its supported composed reference input.

Final directly affected evidence/schema/dispatch/prompt/workflow checks: 233
passed. Earlier unchanged-owner evidence remains valid: session/provider/action
85, hierarchy/mutation 130, and real socket persistence integration 1 passed.
Server TypeScript passed; changed-file ESLint has zero errors and one existing
console warning; naming 15 and Inspector architecture 2 passed. Formatting and
Git whitespace checks passed. Current source-bound flow candidate
`e926d4fe-4dae-4241-82bc-1c57b71ac36a` passed all 18 cases; assessment
`20ab1fd4-3305-4678-99ab-fa22603de5c4` completed with eligible=true at accepted
revision 12. Evidence logs are under `tmp/completion-tool-responsibilities/`.

The broad run `7584d348-ccff-4588-a9c8-ba7797728d4a` is cancelled and its recorded
processes have exited. It is not reported as passed and was not restarted.
No new complete 101 drawing was generated for this correction task; no model-time
improvement is claimed. No commit or push was made. The next user-requested
complete 101 test remains the established recorded full drawing procedure,
including recording-only fit zoom and the ten-second completion hold.

## Task - coordinate and evidence handoffs

### Bounded contract

Correct the observed full-101 failures at their canonical owners: signed
projection/group admission, reference identity and verified provenance, immutable
value reuse, and accountable preparation/application/recording costs. Preserve
independent Fill editing, explicit shared property links, exact geometry, Undo,
recoverable tool failures and original reference bytes. User authorizes these
owners and their direct schema, prompt, spec, flow and regression consumers in
this worktree. Do not push, run full local CI, change rendering, choose the
viewpoint, or change the fixed model configuration.

Discovery is limited to the previous full-101 evidence and direct callers of
preparation, reference/fact/review handoffs and Runtime recording. Close after
focused permanent regressions, bounded review and one recorded complete 101 run
with a ten-second final hold, timings and the exact final reference images.

### Reviewed flow and execution order

1. Prepare: accept bounded signed projected/draft offsets. Existing Group bounds
   normalization moves the Group origin and subtracts it from children. Final
   Group children are nonnegative; world geometry stays identical. Preserve
   positive dimensions, vector-local rings and explicit Frame overflow findings.
2. Prepare/inspect: use the request image owner to resolve reference identity and
   immutable content. Verify registered attachment existence before accepting
   provenance or selection. Distinguish mechanical source validation from visual
   suitability; the model owns suitability. A provenance-only correction is
   explicit and invalidates affected review evidence without pretending the fact
   value changed. Retain actual final image bytes and identity for the report.
3. Prepare/apply: reuse immutable definitions and measurements in their valid
   lifetime. Equal independent values must remain independently editable;
   sharing requires an explicit link. Measure occurrences, unique values and
   expanded transport cost. Avoid duplicating derived work across handoffs.
4. Observe: Runtime owns generic recording and payload costs; App owners emit
   domain work counts and substep durations. Distinguish complete responsibility
   coverage from uninstrumented internal time. Preserve URL resource identity
   without exposing credentials or conflating transformation variants.
5. Execute one full live drawing with the established entire-101 prompt. Record
   first appearance, tool calls, failures/recovery, complete finish and selected
   reference bytes. Comparison is descriptive, not a promised speedup.

Self-review: normalization belongs before final group admission, not in the
camera or renderer. Source correctness cannot be inferred from HTTP success or
image dimensions. Deduplication must not change shared/independent editing.
Profiler serialization itself is work and must be visible without recursively
recording its own payload. These are independent owner slices with direct
handoffs; none requires broader CI or rendering changes.

### Step execution - prepare coordinates

Inputs: signed draft offsets and projected faces/patterns. Output: immutable
prepared geometry with nonnegative Group-relative child positions. Bypass:
advice/direct edits. Failure owner: prepare. Allowed boundary: construction,
preparation, their schemas/spec and formal tests; canonical scene writes and
camera invention are excluded. Prove failures first using signed face/pattern,
nested Group and Frame overflow cases, then verify exact world-coordinate
preservation, limits and unchanged input.

### Step execution - reference identity and provenance

Prepare owns acquisition and retained attachment identity; inspect consumes that
same identity for selection and source facts. Invalid indexes fail before state
changes. Explicit sourceCorrections change only citation/verification with a
reason, preserve the fact statement and dependency versions, and invalidate the
existing bound review through its current change callback. External source URLs
remain attributed model assertions, never mechanical truth approval. Regression
covers missing references, immutable identity and correction/content separation.

### Step execution - independent definition reuse

Prepare accepts explicit fillTemplates and fill.template references, distinct
from sharedFills and fill.shared links. One immutable template compilation per
preparation emits independent canonical Fill IDs for each use. The request
artifact lifetime and release remain unchanged. Measure template uses and
compilations in receipts; regression proves counts, fresh IDs, immutable values,
missing definitions, and existing explicit sharing. No automatic edit coupling.

### Step execution - recording and retained reference assets

Observe/Runtime owns payload serialization/hash/queue/write measurements and
content-addressed local binary evidence. Explicit App reference callbacks retain
original admitted bytes, returning an immutable digest/path in acquisition traces.
Redacted URL values retain a one-way resource-identity digest to distinguish
transform variants. No credentials, prompts or private reasoning are exposed.
Asset retention never determines drawing success. Tests prove exact byte reuse,
mutation isolation, secret redaction and cost receipts; failed I/O remains visible.
App apply emits transaction, selection and owner bookkeeping timing alongside
existing creation/yield timing. This does not change rendering or scheduling.

### Coordinate and evidence handoffs - completed verification

The bounded change and its single live run are complete. Focused evidence is in
`tmp/coordinate-evidence-handoffs/`: App owners 514 passed with three existing
conditional skips; application timing 42 passed; Runtime recording 39 passed.
Final affected slices, types, scoped lint, naming, build and formatting passed.
Current source candidate `6f49118f-81fa-48e0-b395-c8d51ff4f816` and assessment
`5ba8389c-9374-4f2d-a2a1-c117e6853330` passed all 18 flow cases, eligible true.
Counts from overlapping suites are not added together.

Full-run evidence: `tmp/full-101-coordinate-evidence-20261010/analysis-report.md`.
Request `fd4c00dc-4701-40a0-8e82-c4a35b9f8ecd` completed in 557.353 s after Send;
first content 37.220 s; final drawable count 18,731. Recording includes first,
bounds-change and final fit-zoom, then ten seconds. Original selected reference
assets 1, 4 and 6 were retained and digest-verified; reference 6 shows construction
activity and does not independently establish completed-building correctness.

Live reuse: 18,741 fill occurrences, 334 compiled definitions, 16,575 template
uses. Main payload serialization 1.126 s and write work 0.377 s are separately
observable and may overlap other owner intervals. Complete source/coordinate
regressions passed; the live run did not exercise provenance-only correction.
Three partial/failed image acquisitions and one genuinely degenerate face were
recovered. Structured result status, not only thrown-error events, is required
for an accurate failure report. No full local CI or remote push was performed.

## Task - coordinate contracts and reference suitability handoffs

Status: completed locally on 2026-10-10. Reference applicability, fact/evidence
handoffs and outcome reporting passed focused gates and one completed recorded
Taipei 101 run. The completed Group correction was preserved. No push or full
local CI. The model's remaining source-suitability omission is recorded below;
transport correctness is not a guarantee of semantic judgment.

### Objective and bounded contract

Prevent recurrence of legal-coordinate rejection, technically valid but unsuitable
reference promotion, unsupported claims of factual verification, and progress
reports that miss structured tool failures. Complete the existing producer to
consumer handoffs rather than adding independent verification systems.

The implementation proposal covers Design reference/fact/review schemas and prompt
contracts, request-owned image/fact/review state and their dispatch consumers; Runtime's
existing generic outcome projection and its reporting consumers; direct formal
regressions; relevant current specs and AI execution Inspector steps. Preset
coordinate helpers and the completed coordinate regressions are preserved baseline
dependencies. Group runtime, projection/admission validators and coordinate
documentation changes are excluded from this iteration. The user confirmed that
this correction is complete; do not reopen its audit or expand its tests without
a regression directly caused by the new in-scope changes.

Preserve canonical geometry, Group/Frame distinctions, original reference bytes,
independent versus shared Fill editing, current Undo and concurrent editing,
recoverable failures, cancellation, original fact evidence and model settings.
Exclude renderer optimization, downloads policy/site exceptions, camera/style
selection, automatic deletion of drawings or reference assets, new dependencies,
a cross-request retrieval service, global schema refactoring and timing promises.

Discovery is fixed to the latest full-run evidence and direct reference, fact,
review and profiler consumers already traced. Follow-on review
is limited to these handoffs and their regressions. Stop and revise this section
if the proposed data cannot cross an existing public boundary, a product mutation
would be hidden in a read, or an additional owner is required. Implementation closure requires the focused gates and full drawing observation below.

### Evidence and preserved baseline

Baseline evidence is `tmp/full-101-coordinate-evidence-20261010/` and the current
source, not a hypothetical future run. First content was 37.220 s; completion
557.353 s; drawable count 18,731. The authoritative report contains two partial
and two failed App calls among 51, including three reference acquisitions and a
truly degenerate face. Throw-only monitoring incorrectly reported zero failures.
The existing Runtime report already extracts structured outcomes.

Preset and preparation docs already describe world-preserving Group normalization.
The defective earlier preparation path checked nonnegative draft positions before
that normalization. The latest change fixed it and added signed/nested cases;
this stage preserves that fix and closes the contract/test handoff, not rewrites it.

The image owner already retains identities, decoding evidence and original bytes.
The latest final assessment consumed attachments 1, 4 and 6 because the model
selected them. Attachment 6 depicts construction activity, but its recorded fact
and selected-reference handoff contain no construction limitation. Mechanical
validation explicitly leaves suitability to visual assessment. This is the source
case to reproduce, not a requirement to detect cranes by filename or code rules.

### Reviewed end-to-end design

1. **Prepare coordinates.** Explicitly distinguish source-model coordinates,
   projected draft offsets in the declared placement frame, final normalized
   Group-child offsets, and world geometry. Signed input reaches the existing
   normalization owner before final child constraints apply. Relative coordinates
   alone do not imply nonnegative values or eager rebasing after every edit.
2. **Acquire and identify.** The existing image owner admits original bytes and
   returns immutable identity and mechanical validation. Acquisition success
   gives no semantic endorsement. Downloads and decoding are not repeated merely
   because a downstream consumer requests the same admitted evidence.
3. **Record suitability.** The model assesses the image against the actual user
   requirement. Extend the existing reference-selection/evidence responsibility
   to record a batch of decisions; do not add an obligatory independent model
   request or a parallel reference tool family. The tool validates and retains
   decision structure and scope, not the truth of visual judgments.
4. **Adopt facts and references.** A fact cites an admitted source and an explicit
   applicability decision. The selection owner resolves those identities and
   scopes. A rejected or undecided source remains available for investigation but
   cannot silently become accepted final evidence. Restricted evidence applies
   only to its declared criteria/regions. Retaining bytes is not selecting them.
5. **Inspect and repair locally.** Existing canvas inspections and spatial target
   queries receive exact target identity, coordinate space and current revision.
   Findings refer to the relevant source decision, criterion, canvas region and
   evidence. Existing plural APIs apply authorized corrections; reads do not
   mutate, and source observations do not authorize edits on their own.
6. **Review and report.** Existing independent visual review sees applicable
   references, limitations, provenance and current canvas evidence. Its coverage
   must not extend beyond supported scope. Runtime's existing outcome projection
   supplies both progress and final reports. App-specific evidence labels remain
   in Design; the generic recorder does not decide architectural suitability.

### Data and lifetime decisions

These are semantic fields, not final identifier names. Resolve exact naming and
wire/persistence ownership before the first implementation slice.

- A reference decision includes immutable reference identity, decision
  (pending, accepted, restricted or rejected), author/provenance, reason,
  requirement revision, applicable criterion IDs and explicit limitations.
  Source image regions, when supplied, are oriented original-image pixel bounds
  tied to that content identity. No guessed crop, resized surrogate or mandatory
  cropped-image pipeline is introduced.
- The model may submit selection and its decisions in one existing tool call.
  Decisions are request-owned structured state, not additional prose copied into
  every response. Unchanged submissions are no-ops. Decision changes invalidate
  only dependent facts/reviews using existing dependency mechanisms. Unknown
  coverage stays unresolved; the tool does not silently widen it.
- Full-image bytes remain retained even when rejected. An explicit later decision
  may supersede rejection with a reason and applicable evidence; do not permanently
  blacklist an image because one task could not use it. Current accepted usage
  and historical decisions must remain distinguishable in the profiler.
- Fact freshness and evidence assessment are separate concepts. Existing valid /
  invalidated behavior is dependency freshness, not a truth certificate. Resolve
  all current consumers before changing exposed labels. Preserve known facts and
  provenance-only correction semantics. Record who supplied verification and
  whether it is an assertion, mechanical check or model assessment.
- Text/URL citations remain source-attributed assertions unless an actual verifier
  produced supporting evidence. Image decisions do not mechanically verify URLs,
  exact dimensions, or building history. Facts citing several sources retain
  explicit applicability; one accepted source cannot automatically bless claims
  supported only by a rejected source.
- Canvas regions use the existing declared element-local or query coordinate
  contract. Source image regions use image pixels. They are linked by purpose
  and criterion, not assumed to share coordinates. Existing registered geometry
  APIs own any supported conversion to a spatial query frame.
- Retain request-local reuse and local diagnostic assets. Automatic reuse across
  requests/documents, new persistent libraries and RAG are excluded. An explicitly
  supplied retained image in a later request must be admitted for that request;
  prior applicability is not automatically approval for a different requirement.
- Saved trace versions and user files are not rewritten to relabel old evidence.
  Use the existing recording format/version contract where required. Absent
  semantic evidence remains unknown, never fabricated as passed.

### Implementation order and owner slices

**Preserved baseline - completed Group coordinate correction.**
The signed-coordinate fix, normalization behavior and existing regressions are
already complete. Preserve them; no additional Group implementation, coordinate
schema audit or documentation rewrite is planned. Existing tests serve only as
regression protection when relevant to the new changes.

**1. Reference applicability - prepare to inspect.**
Extend the request-owned reference-selection contract with batched, attributable
suitability decisions. Keep mechanical validation and original bytes at the image
owner. Validate unknown identity, incompatible scope, missing reason and revision
before changing selection. A completed-building task cannot accept a source whose
recorded decision rejects completed-building use. The model owns making that
judgment; there is no hardcoded crane detector or preferred source list.

**2. Fact freshness and local correction - inspect to apply.**
Separate freshness from evidence assessment across fact receipts, selection,
review context, App prompt and report labels. Carry source limitations into
criterion-bound final review. Reuse inspection IDs, region queries, prepared
target handles and explicit plural mutations. Revalidate targets after concurrent
changes; require fresh affected canvas evidence after a repair. No whole-child
scan, implicit geometry change, automatic semantic approval or repeated source
validation is introduced.

**3. Outcome consistency - observe and report consumers.**
Use existing `execution.status` / normalized outcome semantics for progress and
final summaries. First determine whether a production consumer is wrong or only
the local monitoring script was wrong; correct the actual consumer. Add a formal
fixture proving consistency rather than building another parser. A tool promise
resolving, a passed assertion, a usable result and an accepted visual assessment
are separate facts. Parent and child receipts must not double-count failures.
Missing evidence is unknown and cancellation is not silently successful.

**4. Integration and one complete drawing observation.**
After authorized implementation, complete focused gates and one full101 run using
the unchanged established prompt and model. Use headless original-resolution
recording, fit on first content, fit when aggregate bounds change, final fit and a
ten-second hold. Preserve failed/partial outcomes and exact final reference
identities and images. No automatic additional live run to obtain a better result.
Analyze per-call inputs/outputs and gaps; do not promise fewer seconds from a
single variable-output sample.

Before each production slice, update and admit its existing Inspector owner step
and direct routes, produce its execution card and prove the missing behavior in
formal tests first. Planning does not assert that these future contracts are
already admitted. Do not expand Flow Inspector tooling merely for this plan.

### Acceptance cases and focused gates

- Legal negative projected/draft offsets through nested Groups preserve world
  geometry; normalized children satisfy their output contract. Positive-only
  dimensions, invalid numbers, Frame overflow and local ring limits still fail
  at their proper owner. Current grouping/reparenting and Undo behavior persists.
- A decoded image with pending or rejected applicability cannot become final
  accepted evidence. A restricted region cannot support an unrelated criterion
  or full-building claim. Unknown reference identities and malformed regions
  reject before state mutation. Requirement changes invalidate applicability.
- The construction-photo case is a declared decision fixture: rejected for a
  completed-building requirement, selectable when explicitly appropriate to a
  construction-stage requirement. Tests verify decision propagation, not that a
  stub can recognize image semantics. Actual model reliability remains a live
  observation and is never claimed from deterministic mocks.
- Repeated validation/selection/fact reads reuse admitted decoding and identity.
  Assert decode, hash, selection-change and invalidation work counts as well as
  output equality. No repeated model assessment is required for unchanged input.
- Unknown, asserted and assessed evidence cannot appear as independently proven
  facts. A source-only correction preserves fact content and invalidates affected
  review. Unrelated accepted facts survive. Conflicting or incomplete support
  remains explicit rather than silently overwritten.
- Local source/canvas links preserve their distinct coordinates. Region selection
  resolves only current matching identities; direct-edit tasks require neither an
  invented root nor new drawing. A repair updates existing data through public
  batch APIs and retains unrelated objects and the intended Undo behavior.
- HTTP-level success with failed/partial business output is counted identically
  in progress and final reports. Parent/child duplication, recoverable rejection,
  cancellation, missing output and visual rejection are separate tested cases.
- Focused Design owner tests, Runtime outcome/report tests, affected source-bound
  flow cases, types, scoped lint, naming and changed-document formatting are the
  implementation gates. Add targeted App E2E only for changed canvas/selection
  handoffs; no broad local CI, unrelated workspace suites or timing thresholds.
- Final delivery includes implementation summary, test evidence, the one run's
  first/full timings and call outcomes, chosen and rejected reference decisions,
  unchanged final reference files, recording and explicitly remaining limitations.
  No push is authorized by this plan.

### Self-review findings and resolutions

- **Avoided semantic overclaim:** image decoding and dependency freshness cannot
  prove visual/factual correctness. Keep assessment provenance and limitations.
- **Avoided extra model latency:** record the model's existing decision in batch
  selection; use the current final assessment boundary, not an extra mandatory
  semantic call for every import or inspection.
- **Avoided duplicate state:** extend request reference/fact/review owners and
  Runtime outcome projection, rather than adding an App logger or source library.
- **Avoided coordinate regression:** normalize at the existing owner and test
  producer/consumer stages; do not generalize nonnegative output to every input.
- **Avoided blanket source rejection:** match suitability to requested use, while
  preserving rejected assets as evidence. Different requirements can legitimately
  lead to different decisions, with an explicit revision and reason.
- **Avoided false test confidence:** formal tests prove contracts and propagation;
  one live run observes model decisions but does not establish a general accuracy
  rate or guarantee that construction images will always be recognized.
- **Avoided scope expansion:** no new cross-request RAG, renderer, downloader,
  geometry engine, compulsory plan stage, whole-repository audit or dependency.

The inspected owners already provide identity, retention, scoped facts, region
queries, review invalidation and normalized outcomes. The proposal is feasible as
extensions at those boundaries; no new subsystem is required. Implementation
correctness and actual model behavior remain to be proven by the gates above.

### Execution card - reference applicability and evidence handoffs

- Owner: Design inspect step; image identity remains at the prepare/image owner.
- Inputs: retained image identities, existing criteria, batched model decisions,
  source assertions, inspection IDs and current canonical evidence.
- Output: attributable, requirement-bound applicability and evidence assessment,
  scoped correction/review context. No geometry mutations.
- Admission: update the current inspect flow and spec, review the exact routes,
  prove missing behavior in permanent review tests before implementation.
- Design: `referenceDecisions` extends selection. The owner stamps requirement
  revision and model provenance; identity is resolved from retained images.
  Decision edits require the current revision. Source pixel regions are validated
  against retained original metadata. Pending/rejected references stay retained
  but cannot enter comparison. Facts keep dependency status; their evidence
  assessment is a separate projection of all current cited decisions.
- Reuse: request-owned decisions; identical updates are no-ops. A changed decision
  invalidates only intersecting selected criteria and bound facts; original bytes,
  source assertions and unrelated review work remain retained.
- Tests: semantic restriction and rejection, stale revision, atomic admission,
  all-source eligibility, local-region handoff, requirement invalidation, no-op
  selection, existing source corrections and normalized Runtime outcome reports.
- Review: direct diff/consumers only; no Group edits or full local CI.

### Execution card - normalized outcome reporting

- Owner: Runtime observe projection; Design consumes its existing public report.
- Finding: the previous false zero-failure statement came from the local observer
  counting thrown errors only. Production `evaluateExecution` already handles
  semantic outcomes; no parallel status classifier or runtime rewrite is needed.
- Proof: extend the permanent receipt-outcome test to compare the same trace while
  in progress and after settlement, retaining partial/rejected/failed/unknown
  statuses and counting nested failures separately.
- Consumer: the recorded run uses `runExecutionReportCli` for progress and final
  counts. Capture the exact reference decisions from retained tool payloads.
- Prior inspect slice: six initial regressions failed before implementation;
  three additional handoff/no-op regressions failed before owner correction.
  Group implementation and coordinate validators remain unchanged in this slice.

### Live-run correction - admitted identity versus selected scope

The single full run exposed a valid mixed batch: adopt the building image and
reject an already imported logo without selecting that logo for comparison.
The new decision owner incorrectly searched only selected/previously selected
identities. This is an admission defect, not a bad model argument. Extend the
existing image identity resolver to validate cited decision IDs against all
request-retained attachments. Selection still controls comparison; rejecting an
image must not require selecting it. Keep atomic admission and unknown-ID errors.

Add a permanent failing review regression first. Preserve the ongoing recording
and runtime version until the one requested run settles, then apply this bounded
owner correction and run focused checks. Do not launch another model run to hide
the observed rejection. Report the live revision and post-run correction clearly.

The initial observation was interrupted after 200.855 s by an agent-edited test
file triggering Vite full-page reload. Preserve that failed setup observation
under `tmp/full-101-reference-applicability-20261010/`; it is not a completed
full test. The admitted-but-unselected regression failed before correction and
passed afterward. Restart once to obtain the requested complete run after all
source and formal gates settle. Freeze watched source throughout recording;
the harness now detects unexpected main-frame navigation rather than waiting
on a vanished conversation. No extra run is authorized for visual polish.

### Final evidence and bounded review

- Focused suite: 448 passed, three existing conditional skips across ten files;
  server types, scoped lint, naming and formatting passed. The 18 current flow
  cases passed on candidate `db4444de-72ba-4838-a74d-c4f9c61e6776`;
  `tmp/reference-complete-assessment.json` reports eligible before recording.
- Direct consumer review covered image identity admission, duplicate attachment
  aliases, requirement revisions, no-op/dependent invalidation, all-source fact
  eligibility, local correction context and changes during independent review.
  Permanent regressions failed before their owner corrections. No Group or
  projection-validator changes were made in this slice.
- Completed observation: request `cd91f183-7aea-457e-b6f7-251ab3621a2f`, evidence
  `tmp/full-101-reference-applicability-complete-20261010/`. First visible drawing
  52.307 s; UI completion 491.202 s; 23,894 drawable objects; final fit and
  ten-second hold completed. Original-size MP4 and document checkpoint retained.
  The interrupted initial attempt above remains separately identified.
- Runtime reports 42 App calls: 40 usable and two failed, both recovered. One
  reference page returned HTTP 403; one genuinely nonplanar face failed geometry
  admission and succeeded after corrected input. Four provider-native research
  events retain unknown semantic outcomes. Recorded owner coverage has no gap:
  provider 460.263 s, tools 3.251 s, App 26.593 s. Provider wait is not a claim
  about private model reasoning or service internals.
- Actual reuse: 23,883 fill occurrences compiled 73 definitions with 23,879
  template uses. Twelve successful preparation/application owner receipts are
  counted once, excluding composed receipt echoes. Four original image assets
  were retained; one batch selected three restricted images and rejected an
  unselected logo. No same-image redownload occurred. All 230 referenced main
  payloads and four reference assets passed digest checks.
- The final independent assessment consumed the exact three selected originals,
  their limitations and current facts, plus overview and local detail images.
  Source URLs remain assertions; image decisions remain model assessments.
  The 507 x 665 aerial image visibly contains construction cranes, but the model
  recorded only resolution/camera limitations. The independent review also
  missed that omission. This is an observed semantic-selection limitation, not
  evidence that mechanical image validation endorsed a completed-building state.
- Compared with the preceding completed run, completion was 66.151 s shorter,
  first content 15.087 s later, and App ownership 8.229 s higher with 27.6% more
  objects. This variable-output observation does not prove causal acceleration.
- Remaining observations include the 32,669-byte draft schema reply, selecting
  a logo from page metadata before rejecting it, and App application work for
  large batches. They are recorded for subsequent prioritization, not additional
  changes inside this bounded slice.
- `analysis-report.html`, `report.json`, `tool-timeline.csv`,
  `detailed-metrics.json` and `owner-work-totals.json` preserve timings, statuses,
  per-call input/output paths, reuse and exact final reference identities. Owned
  browser/services were closed; ports 3000, 4101 and 4201 were verified clear.

## Task - requested content and unobtrusive completion

Status: complete in the existing worktree. No push, full local CI or new live
model run. Preceding work and the completed Group fix are preserved.

Outcome: drawing instructions preserve requested scope without unsolicited
backgrounds or decorative additions; final review checks the same boundary.
Remove the duplicate completion/Undo overlay from the App shell. Conversation
results and ordinary Undo/Redo remain available. Other notifications are outside
scope; do not impose a global background ban or modify saved drawings.

Owner sequence and execution cards:

1. **Inspect guidance:** App prompt supplies the original scope to construction;
   independent visual assessment checks requested subject, necessary detail and
   unsupported additions. A requested scene/background and existing unrelated
   content remain valid. Allowed edits: domain prompt, visual assessment prompt,
   their direct tests, current spec and Inspector inspect contract. No canonical
   data filter or automatic deletion. Prove the missing guidance before editing.
2. **Settle presentation:** App shell owns whether the completion overlay mounts.
   Remove the component and obsolete wiring/tests; retain history projection and
   conversation messages. Allowed edits: App shell, direct App tests, obsolete
   overlay component/test, test script registration, the relevant conversation
   E2E, spec and settle contract. Formal regressions first prove a settled action
   mounts the unwanted overlay, then prove absence and ordinary Undo/Redo.

Self-review: Frame bounds do not require paint. Transparent isolated-object
output is guidance, not a restriction on requested scenes or existing documents.
Removal at composition avoids keeping a hidden subscription/timer. History is a
separate owner and needs no rewrite. Reuse current inspection/settlement routes.
Focused tests, types, lint/naming, relevant flow proof and one focused headless
conversation E2E with screenshot establish closure; no full 101 redraw is needed
for this presentation change. Stop if history behavior itself must change.

The direct documentation consumers are the Design Undo/Redo feature, PRD and API
surface; synchronize their obsolete Message Bar descriptions with this contract.
The focused E2E first captured an empty scene before asynchronous workspace
initialization, then compared Undo with the initialized workspace. Retained
before/after snapshots confirmed equal canonical drawing state once initialized.
Wait for the actual current workspace before recording the baseline, retain the
same complete digest comparison, and keep the diagnostic snapshots in the formal
test. No history production code changes are needed.

### Requested-content and completion validation

- Missing-scope prompt regressions failed before implementation; all 14 prompt
  and visual-assessment tests pass afterward. Guidance preserves requested
  scenes, necessary detail and unrelated existing content. It does not guarantee
  that a model will obey or automatically remove existing backgrounds.
- The App shell regression reproduced the unwanted completion overlay before
  removal. All 29 focused App, context-menu, history and presentation tests pass.
  Removed the unused overlay component, its obsolete tests and test registration.
- One focused headless conversation E2E passes with canonical document equality
  after Undo and Redo, retained failed-refinement drawing, and no duplicate
  overlay. Inspected its retained screenshot; canvas and conversation remain
  visible. Evidence: `tmp/completion-overlay-e2e-final.log`.
- App/server typecheck, scoped lint, formatting and 15 naming checks pass. Final
  review corrected the presentation file allocation to the Inspector settlement
  owner. No runtime owner or history behavior was changed to satisfy admission.
- The current 18 flow cases pass. Source candidate
  `9b3ed0dc-7f20-4eb0-bacc-6ce634793d2f` and target assessment
  `a3977172-47df-42dd-96f6-8b56e109ce97` preserve accepted behavior on the same
  source; the assessment is current and eligible. Evidence:
  `tmp/request-scope-final-assessment.json`.
- Only this task's diff and direct consumers were reviewed. No live 101/model
  rerun, full local CI, commit or push was performed.

## Task - concrete current activity

Status: completed in the existing profiler worktree. No push, full local CI or live
model run. Outcome: current activity states the actual work segment using the
existing model-authored tool message or action summary; lifecycle events remain
authoritative and no additional model request or reporting tool is introduced.

Bounded discovery follows provider progress, existing batch messages, runtime
transport, the App activity projection and their direct tests. Do not expand into
model reasoning, rendering, document mutations, scheduling or history changes.
No persisted or wire identity changes: reuse message, summary and existing tool
identities. The projection reads only turn progress, never canonical document
state; retain the existing per-turn projection lifetime without a new cache.

1. Compose step card: original intent and registered tool arguments enter the
   existing App prompt/provider. Ask for a short present-tense action and target
   in existing message/summary fields, using the conversation language. Forward
   bounded nonempty authored messages before generic labels. Missing/invalid
   descriptions use the existing activity label; never infer semantic edits from
   IDs or geometry. Public commentary/private reasoning remain outside this
   tool progress channel. Allowed files: ai-domain-prompt.ts,
   local-ai-provider.ts and their tests. Prove existing message delivery, bounds,
   observer isolation and language retention. Stop if a wire/schema change is
   required. Failure owner: compose.
2. Settle/presentation step card: consume ordered runtime progress and lifecycle
   state. Explicit descriptions split otherwise-coalesced research/drawing loops;
   internal phases and tool completion acknowledgements do not erase them.
   A later running task without a description returns to its generic label so
   stale task text is not attached to unrelated work. Terminal/stop/approval
   states override authored text. Current status and history share one entry.
   Allowed files: presentation.ts, ai-conversation-panel.tsx and direct unit/E2E
   tests. Prove provider and execution descriptions, repeated/changed tasks,
   non-English text, invalid descriptions, terminal states and narrow-panel
   wrapping. No React memo or second editable state. Failure owner: settle.

Self-review: the current transport already carries message up to 1000 characters
and action summary. The projection currently drops descriptions in named loops,
ignores execution phases inside them and accepts only ASCII execution summaries.
Correct those owners instead of adding polling, a classifier or another tool.
The model can describe its intent; this text is not proof that the edit succeeded.
Retain tool receipts and final outcome as the success authority. Focused unit,
provider, transport and panel tests, one headless streamed-status E2E, types,
scoped lint/naming, current flow proof and diff review are the closure gates.

Completion evidence for concrete current activity:

- Test-first failures reproduced dropped loop descriptions, ignored non-English
  summaries, rejected longer descriptions and stale terminal text. Prompt guidance
  failed its regression before implementation.
- Focused prompt/provider tests passed 169 cases with 3 existing conditional skips;
  presentation, panel and transport tests passed 76 cases. The provider regression
  confirms the authored message uses one existing model turn and excludes private
  commentary. No provider protocol or production transport change was required.
- Headless streamed-status E2E passed at 360px and 1280px. Screenshots were inspected
  for concrete Traditional Chinese descriptions and long unbroken text wrapping.
  The history position oracle now accounts for scroll offset in content coordinates;
  production scrolling behavior is unchanged.
- Typecheck passed. Scoped lint reported no errors and only existing no-console
  warnings. Naming passed 15 tests; Inspector architecture tests passed 2 cases.
- The current flow proof passed all 19 cases, including settle.activity. Candidate
  c407aa76-62b6-43f4-9248-49320d8c92d6 and accepted contract review
  b66b7ca14ba09a725b22fdec241386451e4c8f5f64111c939b619054f468f186
  produced assessment b7394d34-5b63-499a-956d-9bd6962325db with current=true and
  eligible=true. Existing behavior and the new case use the same source.
- Evidence is under tmp/current-activity-*.log and
  tmp/current-activity-final-assessment.json. E2E screenshots are under the
  current-activity test-result directories. Test services were cleaned up.
- Bounded review covered changed owners and direct consumers. Specific wording
  still depends on model-authored descriptions; generic activity remains valid
  when none is provided. Intent text never replaces receipts or terminal outcome.
  No full local CI, live 101 run, commit or push was performed for this task.

## Task - activity continuity and inspection handoff

Status: completed with focused validation. Continue in the existing profiler worktree. No push, full local
CI, dependency changes, language-policy changes or new live model run. Evidence:
tmp/full-101-current-activity-20261010/report.json and current-status-analysis.json.

Objective: retain the most recent concrete work description through generic
internal progress; safely compose requested captures and review without requiring
model code to manufacture inspection IDs from failed capture results. Existing
explicit inspection IDs remain a supported evidence-reuse input. No automatic
cropping, reduced native resolution, fabricated evidence or skipped requirements.

Bounded discovery follows the activity projection, registered inspection schema,
local operation inspection/review bridge and direct tests. Changes are limited to
these App owners, prompt/tool usage guidance, direct unit/integration/E2E tests,
and their current specs/flow. No Group, renderer, geometry or reference-download
changes. Stop for a required cross-package or protocol change.

Self-review: continuity belongs to the existing ordered progress projection, not
new UI state or timers. Generic registered labels are not new semantic work.
Review composition belongs to the existing inspect owner and reuses the registered
capture schema and handler. The server must check every capture receipt before
forming the review evidence set. A failed capture returns successful evidence IDs
plus exact failed targets and recovery instructions without calling the assessor;
retry can combine those IDs with corrected targets. Current-generation, coverage,
criteria, required native detail and post-assessment freshness checks still apply.

1. Settle step card: ordered public progress and lifecycle state enter
   presentation.ts. Keep concrete descriptions until a different concrete
   description or control/terminal state; generic internal execution summaries
   and phase notifications do not replace them. Preserve authored language,
   deduplication, raw events and one projection for current/history. No timers,
   polling, model call or canonical state. Allowed files: presentation.ts and
   its direct unit/panel/E2E/flow-proof tests. Product contract: conversation
   experience current activity. Failure owner: settle. Gates: failing regression,
   focused unit tests and streamed panel E2E including lifecycle transitions.
2. Inspect step card: review receives checks plus current inspectionIds and/or
   explicit inspection targets (elementId, view, target-local region). Reuse
   current capture/measurement/evidence owners to obtain each result once.
   Validate supplied IDs before captures, preserve unavailable target diagnostics,
   and never drop a required failed capture or invoke assessment on incomplete
   evidence. Reuse existing successful IDs on corrected retry. Apply existing
   generation and whole-request checks before and after assessment. Allowed
   files: local-operation-tools.ts, local-design-review.ts, schema-only inspection
   contract shared with src/ai/inspection.ts, ai-domain-prompt.ts, direct tests
   and specs. Failure owner: inspect. No renderer, fallback image or image
   suitability judgment. Gates: test-first success/mixed failure/retry/stale
   evidence/cancellation/schema cases, existing inspection and review suites,
   provider discovery tests and same-source flow proof.

Closure gates: scoped types/lint/naming, unit/integration suites above, headless
status E2E with screenshot inspection, current flow admission/assessment and
bounded diff/direct-consumer review. No full local CI or implicit new 101 run.

Completion evidence:

- Test-first reproduction: two status regressions and three composed-review
  regressions failed before implementation. A later transport-exception case
  also failed before its receipt-preserving correction.
- Presentation and panel tests: 56 passed. Inspection/review/schema/flow tests:
  238 passed. Provider and recoverable invocation tests: 179 passed, three
  existing conditional skips. Native schema conversion accepts both evidence
  forms and rejects malformed targets without relaxing admission.
- Headless streamed panel E2E: two passed (360px and 1280px). Screenshots were
  inspected for concrete status retention, wrapping and shared current/history
  content. Generic substeps add no replacement row after concrete work.
- Production App and AI server type checks passed. Scoped lint has zero errors
  and one pre-existing console warning in execution-flow-proof.test.ts. Naming
  passed. The broad tsconfig including unrelated source-test fixtures reported
  existing mock/API-shape errors; the formal production and server configurations
  passed. No unrelated fixture repair was made.
- Flow candidate 88144712-4248-4a5f-ab71-32bc8190b0b4 passed 20 cases. Accepted
  contract review bbc53209ba900079cdcbfe5508adf18fcb4178cae9f7c813f5f0a59f933f3375
  and target 03815edf-a2be-48d0-bb7e-6efea54815ff have same-source assessment
  b76b8539-9ef8-40a6-9548-fef37f67b246: current=true, eligible=true.
- Bounded review checked registered schema reuse, unchanged caller input,
  successful capture reuse, all/mixed failures, thrown capture errors,
  cancellation, current revision and preserved coverage/assessment checks.
  No renderer, reference acquisition, language policy or model settings changed.
- Evidence: tmp/activity-handoff-*.log/json; panel screenshots are under
  apps/asyra-design/test-results/ai-conversation-flow-current-activity outputs.
  Test-owned services exited; ports 3000, 4101 and 4201 have no listeners.
  No full local CI, live 101 request, commit or push was performed.

## Task - whole-request activity, query reuse and durable settlement

Status: implementation complete with scoped formal verification. No push.
The five review gaps below are binding implementation requirements. This follow-up supersedes the earlier activity closure claim for
real provider-to-panel handoffs; those focused tests did not exercise the actual
producer's generic messages. The current contract preserves concrete work across
generic progress. Historical validation evidence is retained, not treated as
proof that the full handoff works.

Association: this plan, this task, current conversation as closeout owner.
Base: e07bbd222c68e6806708fb450ac886dc47a07f4f on
codex/full-101-review-20261010 in the existing ai-runtime-profiler worktree.

### Bounded objective and evidence

Diagnose and plan corrections for current activity replacement, repeated context
reads, final persistence waiting and missing lifecycle records. Discovery is
limited to the recorded run, the four direct producer/consumer paths below,
their current specs/Inspector steps and formal tests. This task changes this
plan and the direct Runtime/App owners, public types, transport, tests, specs and
Inspector routes below. Local diagnostic evidence remains with the run. No full
local CI, new live model run or push. No new dependency or storage format.

Evidence root: tmp/full-101-merged-20261010. Read verified-timing.json,
call-details.json, retained input/output payloads, the saved backend document and
diagnosis/measured.json. Request: 6795a59b-7b95-47d4-b0cd-fb9b50dce7c2.

| Finding                                                    | Evidence and limit                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| System labels overwrite authored work                      | local-ai-provider.ts puts fixed labels such as Checking the requested details into message. The transport retains message and presentation.ts treats any bounded message as concrete work. Existing continuity fixtures omitted message on generic progress.                          |
| Unchanged query results are delivered again                | 105 read_design_context calls include 37 identical repeated pages for the same 7,248 objects, with no intervening mutation: 2,301,585 repeated output bytes. Two repeated root-bounds queries changed results and are not counted as redundant.                                       |
| Pagination repeats selection work                          | design-context.ts filters region candidates and reconstructs metadata per invocation before slicing the page. fields limits computed fields but does not remove the fixed row metadata. There is no retained revision-bound page result.                                              |
| Read-dependent edits lack a complete retained-data handoff | Following writes use thousands of IDs and distinct per-object fill patches. Existing region query targets handle uniform edits; created artifact keys already support some reuse. Those capabilities do not alone carry selected position columns through a varying fill calculation. |
| Durable batches repeat whole-document preparation          | document-materializer.ts invokes the reducer per publication. Every invocation copies both complete maps. The saved document has 36,221 elements, 851,204 properties, 1,196 publications and 36 durable batches.                                                                      |
| The recording lifetime ends too early                      | requestRecordedLocalAi finishes and flushes its profiler before the browser executes the final report_outcome persistence confirmation. App completion follows provider completion by 114.488 seconds outside that recorded root.                                                     |

The two 37-page scans each execute in about one second. These are not evidence
of 74 separate model reasoning rounds. Recorded tool-output bytes are not proof
of bytes inserted into model context. The model's reason for requesting a second
scan is not observable; the missing retained-result handoff is observable.

Offline feasibility probe using the actual reducer and saved 101 document:
eight ordered element-name updates took 4,163 ms with eight reducer calls and
518 ms with one call containing those same changes. A small instrumented fixture
counted eight versus one property-map enumerations. The checked result and input
immutability agree. This is not a replay of the original publications or proof
of equivalence for every change kind, and does not attribute all 114.488 seconds.
The store also serializes and writes a full checkpoint per durable batch.

Correct completion time is 1,045.855 seconds (17m25.855s), with first visible
content at 41.524 seconds. The recording harness noticed completion 30.918 seconds
late while reading a disappearing locator; that delay is not App runtime time.

### Proposed complete flow and owners

Runtime request start -> provider child invocation -> authored work/system
progress -> App query or mutation -> publication admission -> backend ordered
materialization -> checkpoint commit -> captured-sequence acknowledgement ->
final action/history settlement -> Runtime request terminal event.

1. **Activity semantics.** Keep generic tool/lifecycle labels separate from
   authored work through the provider, Runtime progress contract, transport and
   projection. Introduce an explicit discriminant at the owning progress type;
   do not infer provenance from English strings. Preserve supplied work messages
   instead of overriding them in specialized tool branches. Generic events still
   remain observable but do not replace the latest concrete work. Waiting for
   durable storage is an explicit lifecycle state, not stale drawing activity.
   Preserve authored language, call ordering, terminal/control precedence and
   current/history consistency. No model call, timer or polling is needed.
2. **Whole-request records.** The Runtime run owns the root lifetime; provider
   invocation is a child. Reuse Runtime recorder, invocation middleware, trace
   projection and local sink. App adapters contribute domain spans without
   creating a second profiler. Carry request/call identity and publication
   sequence ranges through browser, AI server, collaboration and persistence.
   Record final action, admission wait, durability wait and history settlement
   before closing the Runtime root. App conversation publication is a subsequent
   correlated host event; it does not rewrite the Runtime duration. Provider
   completion alone must never certify whole-request coverage. A lost client or stream produces an
   explicitly incomplete record, not synthetic completion.
3. **Durable batch work.** Preserve validated publication order, per-publication
   identity and existing transaction boundaries, but apply the ordered canonical
   changes to one working document per existing durable batch. Validate and
   commit the batch atomically, preserving the original checkpoint on any
   failure. Do not merge across queue transactions or alter sequence semantics.
   Keep the current storage format and checkpoint write/rename boundary. The
   captured sequence must actually become durable before success is returned.
4. **Retained query-to-write data.** Reuse created artifact identity and pattern
   membership when available; do not parse display names or guess object roles.
   For live spatial queries, the App query owner retains one ordered result with
   document/workspace identity, explicit coordinate space, dependency revision,
   selector and requested columns. Subsequent pages reference that result.
   Region edits remain direct region selection; hierarchy traversal must not
   replace the requested bounds. The server passes opaque result references to
   registered batch actions without returning thousands of rows to the model.
   Existing region target queries remain the route for uniform edits.
5. **Varying edits.** First reuse existing calculation/construction operators.
   Complete the typed handoff for the observed position-dependent fill case:
   selected current positions -> explicit normalization/mapping parameters ->
   per-target new fill values -> canonical batch write. AI chooses the mapping
   and visual intent; the owner computes values. Add only a bounded registered
   operator if no existing operator can express this case. Do not accept JS
   functions, callbacks, arbitrary eval or inferred artistic corrections.
   A read/export path remains available when actual reasoning needs the data.

Retained results have an explicit release/eviction lifetime and byte limit;
eviction returns a recoverable missing-result response. Mutation, Undo/Redo,
remote edits, hierarchy changes and Reset invalidate affected dependencies.
Viewport-only pan/zoom does not invalidate world-space results. Check freshness,
locks and existence at consumption; do not silently reselect or replay a stale
mutation. Keep immutable creation membership separate from mutable current
positions/properties. Reuse canonical change notifications for invalidation,
not a second independently maintained document model.

### Recording contract and diagnostic cost

- Activity records retain call identity, provenance, accepted/replaced/retained
  projection decision and reason, allowing a status transition to be explained.
- Query records retain normalized selector identity, snapshot/revision,
  candidate/filter counts, requested columns, cache/reuse outcome and consumer
  call identity. Distinguish App-to-executor output bytes from known
  executor-to-model delivery; unavailable upstream delivery remains explicit.
- Persistence records separate queue delay, validation/decode, canonical apply,
  map preparation, serialization, write, rename and acknowledgement. Retain
  publication counts, changed counts, snapshot size and durable watermarks.
- Use local monotonic clocks for durations and causal correlation between
  processes. Do not subtract unsynchronized clocks or double-count overlapping
  waits. Preserve execution success separately from correctness and usability.
- Reuse sanitized payload references and digests; do not copy the whole document
  into each record. Bound queues and record dropped/unavailable observations.
  Diagnostic failure must not turn a successful drawing into a product failure.
- Correct the local recording harness terminal observer separately. Keep its
  detection/recording duration outside App completion metrics; do not add the
  user-specific full-101 recording workflow to CI.

### Implementation order and acceptance

Before implementation, update/admit the current product contract and exact
Inspector routes: ai-execution-flow settle/observe/query-execution boundaries
and the existing document materialization owner in the conversational drawing
flow. Current flow must describe the new contract, not retain obsolete ownership.
Create one owner step card at a time; this proposal is not an admission result.

1. Prove actual provider-to-panel status replacement and delayed final action
   omissions with failing formal tests. Fix typed progress and root recording
   together, then verify real transport handoffs with a deterministic provider.
2. With persistence spans available, prove repeated map preparation in the
   materializer plus real reducer. Implement one preparation per durable batch.
   Measure the saved 101 locally after correctness and work-count gates pass.
3. Prove repeated selection/filter/column work across query pages and direct
   query-to-write composition. Implement retained selection and the bounded
   varying-fill handoff; align tool schemas, operation discovery and guidance.
4. Review the complete sequence, all direct consumers and diagnostic overhead.
   Run only applicable focused tests and bounded headless integration tests.
   A subsequent user-authorized full 101 run supplies end-to-end measurements;
   this planning task does not start one automatically.

Formal regression owners and required assertions:

- Provider, transport, Runtime and presentation tests: actual fixed-label
  producer events after authored work, repeated/late acknowledgements,
  concurrent call ordering, no concrete message yet, language preservation,
  cancellation/failure and explicit final persistence state.
- Runtime profiler and execution-flow-proof tests: provider returns while final
  action is blocked; root remains open, both success and failure finalize once,
  child calls join correctly, missing telemetry lowers coverage, and recording
  overhead does not recurse or copy large payloads per event.
- collaboration-operations.test.ts, document-canonical-reducer.test.ts,
  persistence queue/store and Reset tests: ordered create/update/delete,
  shared properties, hierarchy, Undo/Redo publications, failed later change,
  checkpoint write failure, duplicate publication/batch retries, lost ACK,
  cancellation and Reset. One working-map preparation per durable batch;
  later edits must not extend a captured completion target. Existing mock
  materializer output tests alone cannot prove reducer work reuse.
- design-context tests and local operation integration: one candidate selection
  per retained revision, stable pages, minimal requested columns, patterned
  membership reuse, exact spatial scope, coordinate-space correctness,
  bounded memory/release, changed dependency invalidation and stale-result
  rejection without mutation. Varying fills must match explicit intended values
  through the real batch API, including shared-property and Undo behavior.
- Current flow/specs, naming and scoped type/lint checks apply to implemented
  slices. CI tests assert deterministic correctness and work counts, not local
  milliseconds. No full repository validation or remote operation is implied.

Self-review: this addresses producers, transport and consumers rather than only
UI projection; retention alone does not solve read-dependent mutation, so the
typed consumer is included. Batching does not weaken durability or reorder
changes. Root records include final App work instead of extending a provider
timer and relabeling it. Checkpoint rewrite cost remains measured separately;
a journal/storage-format redesign is not justified by this probe and is outside
this proposal. If checkpoint I/O remains dominant after the bounded batch fix,
report its measured cost and revise the storage plan before changing formats.
No renderer, Group geometry, reference selection, model/effort, dependency or
unrelated CI changes are included.

### Resolved review gaps and implementation contract

1. **Membership invalidation.** A retained spatial selection depends on the
   query, workspace/document lifetime and all events that can change membership,
   not just IDs already in the result. Creation, deletion, bounds changes,
   ancestor transforms/reparenting and filter-property changes invalidate the
   relevant selection. Use canonical publication/change subscriptions; where
   the owner cannot reliably identify affected regions, invalidate spatial
   selection for that document instead of returning a stale hit. An explicit
   document revision is a safe conservative first boundary; finer invalidation
   is permitted only with equivalent work-count tests. Never scan the whole
   document to detect changes. A snapshot's requested values and membership
   share one version. Required cases include an outside object entering, a newly
   created match, an ancestor moving descendants and Undo/remote replay.
2. **Atomic consumption.** A retained-result mutation enters the existing
   runMutation boundary. Inside its synchronous callback, validate session,
   revision, current locks and complete target existence, compute the admitted
   mapping and apply the canonical batch. No await between final validation and
   write. Reset/eviction/stale references reject with a recoverable classified
   result and zero writes. Multiple operations explicitly using one snapshot
   validate together before their first write, not after their own writes have
   invalidated it. Preserve unrelated user/remote edits and existing rollback.
3. **Record delivery and closure.** A host-owned request recording session uses
   the Runtime recorder and local sink for both provider children and post-provider
   events. A bounded independently addressed delivery channel remains usable
   after the model response stream ends. Request/producer identity plus a
   monotonic producer sequence makes retries idempotent. A final producer marker
   specifies its last sequence; collector completeness requires those records,
   not merely a terminal UI event. Product settlement never waits for diagnostic
   upload. Trace state distinguishes product outcome from collection completeness;
   disconnect/disposal or missing sequences leave explicit incomplete coverage.
   Runtime emits terminal state after action/history settlement; the App supplies
   a correlated conversation-publication event without redefining Runtime timing.
   Child requests cannot close the parent. Same-document multi-actor persistence
   batches may serve several requests: link request sequence targets to the
   batch once, do not duplicate its measured work for each request.
4. **Activity identity and ordering.** Runtime/provider types own a structured
   activity kind (work or system), call identity and producer sequence. Runtime
   associates them with its invocation/attempt; transport preserves them. Only
   a newer work-start event can replace concrete activity. Late completions,
   duplicates and events from an earlier invocation cannot replace current work.
   Among overlapping work calls, latest admitted work-start wins; a completion
   does not restore an older description. Explicit control/terminal states win.
   Generic providers may omit activity metadata and receive ordinary phase
   labels; do not infer concrete provenance from their text. Internal execution
   summaries require explicit authored provenance too. Add transport tests with
   real adapter-produced system messages rather than fixtures omitting message.
5. **Bounded varying-fill contract.** Reuse the existing fill and calculation
   schemas before adding an operator. The intended consumer accepts an opaque
   snapshot, selected position columns with declared coordinate space, an
   explicit axis/domain and a finite piecewise-linear mapping of normalized
   values to fill parameters. Invalid/non-finite values, missing columns and
   zero-width domains reject before writes; endpoint handling is explicit in
   the schema. The AI supplies the mapping, not the App. Outputs are canonical
   new-value fill patches and a compact receipt with count/version/provenance;
   retain full details for explicit inspection. Exclude arbitrary expressions,
   JS callbacks and automatic artistic corrections. Prove equivalence to the
   same explicit patches through the public fill API, including shared fills.

Self-review after these additions: no result can remain valid solely because its
original members did not change; atomic validation occurs after queued user work;
recording delivery does not hold product completion open; generic progress no
longer masquerades as authored work; and the varying-edit operator has bounded
inputs rather than an open-ended language. Per-owner gates below must demonstrate
these claims before closure. Complete source-bound flow admission before each
implementation step. Do not claim runtime completion from this design review.

Step execution card - settle activity: inputs are registered provider progress
and ordered action starts; output is one current/history activity projection.
System/late/duplicate events bypass concrete replacement; control/terminal events
win. Runtime owns progress identity, App adapters own authored provenance and
presentation. Allowlisted files are provider/runtime types, local provider,
wire adapter, presentation and direct tests in the settle Inspector step. No
language inference, timer, canonical write or second UI state is permitted.
Cases: real producer generic message after work, old start, late completion,
retry/invocation retirement and current/history parity. Test-first gate: provider
and presentation regressions; then transport/Runtime and flow proof. Failure owner
is settle. Stop if provenance needs an unreviewed input or lifecycle mechanism.

Step execution card - observe request lifetime: Runtime run is the producer of
request start, provider/action child spans and settled outcome; App supplies a
nonblocking sink and domain observations. The collector admits sequenced local
records after the model stream closes, with explicit incomplete delivery. No
provider-only timer may represent the request; no diagnostic failure changes
canonical work. Boundary: Runtime runtime/profiler/record delivery, App recording
adapter and existing HTTP middleware, direct tests and specs. Tests first block
the final action and history independently, keep upload pending and assert one
terminal record only after product settlement. Failure owner observe. Stop for
unreviewed recording ownership or a requirement to block product completion.

Step execution card - durable materialization: the current socket-authoritative
session admits ordered, decoded canonical publications. Its backend materializer
must create one working document per admitted durable batch, then atomically
commit document and sequence registries. Retried batches bypass canonical apply.
Allowlisted owners are document-materializer, canonical reducer, backend store,
backend domain observations and their formal tests. Inputs retain document and
batch identity plus publication ranges; output remains the captured durable
sequence. No queue transaction merging, storage-format change, payload omission
or optimistic acknowledgement. Test-first: count real reducer map preparation
for multiple publications and reject a later invalid canonical change without
advancing the checkpoint. Existing queue, retry, Reset and reducer suites remain
required. Failure owner: open-socket-authoritative-document-session.

Observe slice checkpoint: Runtime root, independent delivery and activity
transport focused tests pass. Additional App domain/persistence observations and
final integration remain open; no complete recording claim is made yet.

Step execution card - retained query consumption: the App context owner retains
ordered query membership and requested values with canonical document revision
and workspace identity. Existing public Core metadata, spatial selection and
child APIs remain authoritative. Read references are opaque and bounded;
consumption validates every reference and target inside runMutation before any
write. A bounded fill-mapping action uses the public plural fill API, never a
model callback. Query/mapping schemas and operation discovery are direct
consumers. Formal cases: one selection across pages, outside/new/ancestor changes,
workspace replacement, eviction/release, stale-after-admission and exact mapped
new values. No scene-tree traversal for a bounds query, inferred color intent,
renderer cache or second document model. Failure owner: apply and settle.

### Completed implementation and bounded review - 2026-10-10

All five review gaps are implemented in the existing task worktree. Production
changes are confined to the admitted Runtime/App owners and direct adapters.
No renderer, Group geometry, model, reference acquisition, storage format or
third-party dependency changed. Nothing was pushed.

- Activity kind, call identity and sequence survive the real provider and HTTP
  handoff. System messages and late acknowledgements cannot replace authored
  work. Explicit durability settlement supersedes drawing activity. The shared
  transition owner computes recording decisions incrementally, without replaying
  earlier progress for every diagnostic event; current display and history use
  the same transition rules.
- Runtime records provider, context, resolution, permissions, confirmation,
  mutation admission, canonical write, domain waits, action outcome and history
  settlement. Its terminal record follows product settlement. Independent bounded
  delivery and sequenced collection handle lost acknowledgements, cancellation,
  incomplete streams, capacity and expiry. Conversation publication links back to
  the completed Runtime request. Diagnostics do not block product completion.
- One durable batch invokes the real canonical reducer once. Formal work-count
  evidence counts one property-map enumeration for three ordered publications,
  and no additional preparation on exact retry. Store observations distinguish
  admission, read, serialization, write and rename. The real reducer's map
  preparation observation is forwarded through the materializer; a formal
  regression detects a missing adapter handoff. Failed writes and changes retain
  the original checkpoint and watermarks.
- Retained queries perform one selection and property read per revision. Pages
  use an ID-to-row index; reference-only replies do not clone or transfer rows.
  Receipts record candidate, selected, metadata-read and computed-read counts,
  revision and reuse. The first three-row query reads three property rows; a
  repeated page reads zero properties and performs zero selections. Canonical
  revision invalidates potential new members, not merely original members.
- The registered batch-only mapping action is discoverable by operation and
  accepts its advertised schema through the real batch preparation owner. Inside
  synchronous mutation admission it validates freshness, target/ancestor locks,
  columns and all mappings, resolves current fill identities, rejects conflicting
  simultaneous values for a shared fill, and calls the public plural fill API.
  Existing fill APIs retain their ordered-update semantics; the mapping does not
  detach shared properties. Real App tests verify mapped values and Undo/Redo.

Self-review corrections included indexed page delivery, zero-row reference
receipts, exact snapshot schema/native-admission agreement, ancestor locks,
shared-fill conflict admission, map-preparation observation forwarding and
incremental activity diagnostics. Each discovered mismatch was reproduced by a
formal failing case before its owner correction. Existing behavior assertions
were retained; old status fixtures were updated to declare authored provenance.

Focused evidence (no full local CI):

| Gate                                                                        | Result                                                                                      | Evidence                                                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Runtime progress, delivery, portable boundary, execution and record parsing | 62 passed                                                                                   | tmp/whole-request-runtime-complete.log                                                                           |
| Query/mapping/schema, canonical materialization/reducer and backend Reset   | 92 passed                                                                                   | tmp/whole-request-app-final4.log; tmp/whole-request-checkpoint-failure.log                                       |
| Provider, HTTP transport and execution flow proof                           | 191 passed; 3 existing opt-in skips                                                         | tmp/whole-request-transport-final.log                                                                            |
| Activity, conversation and rendered panel                                   | 82 passed                                                                                   | tmp/whole-request-ui-final4.log                                                                                  |
| Runtime input, startup, App startup, HTTP client and actions                | 41 passed                                                                                   | tmp/whole-request-consumers-final.log                                                                            |
| Headless App integration                                                    | 4 passed: two viewport sizes, shared mapping/Undo and ancestor/new-member/Undo invalidation | tmp/whole-request-e2e-complete.log                                                                               |
| Runtime build and App production source typecheck                           | Passed; zero production diagnostics with unchanged tsconfig options                         | tmp/whole-request-runtime-build-final.log; tmp/whole-request-app-production-types.log                            |
| Server typecheck, changed-source ESLint and naming                          | Passed; ESLint has zero errors and five existing console warnings                           | tmp/whole-request-server-types-final.log; tmp/whole-request-eslint-final.log; tmp/whole-request-naming-final.log |

The current execution-flow source candidate is
a4fcac40-15f3-435f-8c4b-1edbff2c95ad, source fingerprint
94b902bdcdb68a480d63e3906f3a301d88bb71df00922e7334f81afe24fe05e4.
Its current baseline flow cases pass. Contract review
c1e0fe4693cce12f3cbd67cc5170000a63bdf87f911c847f25a088caa71ceee4
has no blockers and is accepted through the supported CLI. Scoped tests above
supply the additional new behavior proof; the baseline flow case set alone does
not claim that proof. Test-owned ports 3441/4440/4441 were closed after execution.

Decisions and limits: use a conservative document revision before attempting
fine-grained spatial invalidation; unrelated canonical edits can invalidate a
snapshot safely. Retention defaults to eight snapshots with a 32 MiB serialized-data budget;
capacity/release/staleness are actionable failures, never silent reselection.
Record completeness and product success remain separate. The previous saved-101
probe remains immutable evidence, not a replay or a claimed time saving. No new
live model/101 run was performed in this implementation task, and the remaining
checkpoint serialization cost has not been represented as solved by a storage
format change. A subsequent explicitly requested full run can measure the new
whole-request evidence.

### Follow-up - explicit activity state machine - 2026-10-11

User authorization: refactor in this same worktree; no push. Association and base
remain the whole-request task above. Scope is the App activity projection, its
direct consumers/tests and current conversation/Inspector contracts. Exclude
provider behavior, transport schemas, query/storage owners, model runs and full
local CI. Preserve language, loop compaction, concrete-work continuity, event
ordering, final outcome authority and current/history identity.

Design review: the current projection is already the shared owner, but its
boolean flags do not guard lifecycle transitions. A delayed running event after
settlement can replace completion or saving. Extract one App-owned pure reducer
with explicit running, awaiting-approval, saving, stopping and settled states.
Work descriptions remain data, not dynamically created states. Progress is
normalized to work/system/control events at this owner. Attempt/sequence guards
precede transitions. Completion acknowledgements do not resume approval; actual
execution/provider progress can. Saving accepts only settlement; stopping accepts
only settlement; settled rejects later progress. Authoritative conversation
snapshots finalize partial/failure/cancellation and clarification without
changing source events. Rendering history is read-only and repeatable.

Step Execution Card - settle: inputs are existing ordered Runtime progress and
conversation controls/outcome; output is one visible activity/history projection
and its accepted/retained/rejected reason. Allowed contributors are the App
presentation, turn controller and existing runtime event contract; no model
inference, string-based phase detection, timers, canonical data or new dependency.
Implementation boundary: activity-state.ts, presentation.ts and their direct
formal tests, under the existing settle route. Failure owner: settle. The state
machine does not replace Runtime's transport-admission validation.

Test-first cases: late work after saving/terminal, control resume, stale attempt
and sequence, duplicate visible work, repeated result reads, authoritative partial
failure and question behavior. Existing presentation/conversation/panel suites
remain regression obligations. Gates: focused tests, changed-source lint, naming,
production typecheck and current source-bound Inspector proof. Stop if a wire or
Runtime lifecycle change is needed; that is outside this follow-up. Self-review
findings resolved before implementation: avoid a second display owner, preserve
an explicit work entry through generic internal phases, keep host snapshots
separate from provider evidence, and avoid replaying history per recorded event.

Follow-up completion: the App-owned activity-state.ts now contains one pure
lifecycle reducer and the existing activity-label projection. presentation.ts
re-exports the unchanged consumer entrypoints and reuses the same tool labels
for outcome summaries. No Runtime or transport change was needed. Running work,
approval, saving, stopping, settlement and clarification have explicit transition
semantics; authored descriptions remain data. History reads are side-effect-free.
Generic loops, language, stale-event guards, partial failure and final outcome
contracts remain covered. Diagnostic decisions and panel replay use the same
reducer; no earlier progress is reread for an incremental recording decision.

Five new formal cases failed before implementation. Bounded review also caught
late approval reopening stopping; its regression failed before correction. The
existing invalid-MIME test now explicitly marks its intentional type violation,
and two existing status fixtures supply the required attempt field. Their
runtime rejection/behavior assertions are unchanged.

Validation: 101 focused cases passed (43 presentation, 25 conversation and 33
panel), including 19 added cases; production sources plus the two touched test
files typecheck with zero diagnostics (249 roots). Changed-source ESLint and
naming pass; App frontend build passes with its existing bundle-size warning.
Evidence: tmp/activity-machine-consumers-final.log,
tmp/activity-machine-types-final.log, tmp/activity-machine-lint-final.log,
tmp/activity-machine-naming-final.log and tmp/activity-machine-build.log.
Source-bound Inspector candidate 7b086b59-3680-412f-8c3b-ce55a514c8df passes;
source fingerprint 258d3efa5e98e738ba7ba282090da124993d380adcc7c8375ec47bf808c0ef49.
Contract review 10a3d6bfd6a21cc5be2ae9195bee0f0fdeedfb5bf43efe0d2bd0bf9681afb8e3
has no blockers and is accepted. No live 101 run, browser visual review, full
local CI, commit or push was performed for this follow-up.

### Live validation - full Taipei 101 - 2026-10-11

User-authorized one complete model run on the current dirty worktree. Reuse the
full-building prompt, headless recording and recording-only bounds fitting;
retain ten seconds after completion. Scope is the normal App provider-to-status,
query/mutation and durable settlement path. Evidence owner is settle/observe;
source-bound formal checks above remain prerequisite evidence. Use
http://localhost:3000 with isolated document/record directories under
tmp/full-101-state-machine-20261011. Command: node
tmp/full-101-state-machine-20261011/run.cjs. Capture status/outcome mutations,
request records, service logs, screenshots and video; inspect the final image
and compare status transitions with actual progress records. Read DOM state
without locator waits after the status node disappears, to avoid adding the
prior harness's 30-second completion delay. No product edit, push or full CI
is part of this validation. Preserve the original result on failure.

Live validation result: one request completed successfully. Send-to-first-visible
was 72.582 s; DOM outcome completion was 490.426 s (panel: 8m 10s). Final drawing
contains 12,547 objects, excluding workspace. The video is verified H.264 MP4,
1920x1080, 504.88 s, with the requested ten-second final hold. Both first and
final bounds fits occurred; the initial frame already covered final bounds.

The observed status sequence contains 17 authored work transitions. The shared
projection retained work through 123 generic progress events and 54 completion
acknowledgements; nine duplicates were suppressed. No generic label replaced
concrete work after its first appearance. Saving then settlement occurred in
14 ms. Final durability confirmation took 3.2 ms and history settlement 6.8 ms;
provider end to DOM completion was 192.3 ms. Fifteen background durable batches
completed, totaling 6.884 s of inclusive batch work, overlapping the main run.
All 19 request records completed; 201 payload files and four reference assets
passed digest verification. Source hashes captured before the run are unchanged.

Two recoverable issues remain in this evidence: a source-page download returned
partial, and 1,011 pattern faces exceeded the source limit before a 943-face
retry succeeded. The run did not exercise large retained region-query editing,
so it is not evidence for that workload. Compared with the prior 36,220-object
run, this run is shorter but has fewer objects and a slower first frame. No
constant-work speedup claim follows. Re-read settle/observe contracts at closure;
this is live evidence for continuity, durable completion and record ownership,
not a replacement for focused regression checks or a visual-accuracy guarantee.

Evidence: tmp/full-101-state-machine-20261011/report.html, verified-timing.json,
current-status-analysis.json, analysis-verification.json, persistence-spans.json,
trace.json, tool-timeline.csv, source-verification.json and video-metadata.json.
The final screenshot and sampled MP4 ending were inspected. Backend checkpoint
backup is preserved. Three test-owned services were stopped; ports 3000, 4101
and 4201 have no listeners. No production edit, second model run, full local CI,
commit or push occurred in this validation.

## Follow-up proposal - truthful activity and bounded drawing preparation

Status: user-authorized implementation, 2026-10-11. The revised limit policy
and whole-flow proposal have been self-reviewed; implementation starts at prepare. The user rejected generic waiting labels and
requested an audit across handoffs rather than further isolated fixes. This section supersedes the interpretation that
retaining a concrete activity proves that the displayed action is still running.
The historical run measurements above remain evidence, not acceptance of that
interpretation. The reported pattern rejection is a schema/budget inconsistency,
not proof that the requested geometry exceeded the aggregate work budget.

### Current task boundary

Association: this plan, current conversation, codex/full-101-review-20261010,
base e07bbd222c68e6806708fb450ac886dc47a07f4f, existing ai-runtime-profiler
worktree. The current request authorizes this complete revised plan, owner implementation,
formal tests and matching App/Runtime specs and Inspector contracts. Preserve all
pre-existing edits. Diagnostics remain under the existing run diagnosis directory.
Fixed discovery: the five native tool families, their advertised schemas and
170 action descriptors from the saved invocation, and the current registration,
discovery, admission, scheduling, construction, canonical dispatch, receipts,
repair/reuse, activity and trace handoffs. Compare current specs and focused
formal tests with those paths and the saved failures. Inspect direct consumers
only; do not turn this into an unrelated repository-wide cleanup.
Work through the reviewed owner slices and integrated focused verification. No
push, full local CI, additional model run, dependency change or unrelated renderer
work. A new full model run requires the requested verification checkpoint.

### Findings and causal evidence

1. **The activity contract itself retains completed actions.** At provider time
   71.914-71.971 s, prepare_and_apply_design finishes the base. At 86.016-86.019 s,
   criteria and API description calls finish; the next recorded call starts at
   113.635 s. The user's panel screenshot at request elapsed 101 s nevertheless
   says that the base is being drawn. Provider time starts approximately 0.260 s
   after Send. activity-state.ts unconditionally retains completed tool updates
   and keeps state.work across generic updates. The settle Inspector condition
   explicitly says to ignore completion acknowledgements. This is an incorrect
   product/architecture contract, not merely an untranslated verb or missing
   duplicate filter. Current tests proving continuity do not prove truthfulness.
2. **First visible latency contains reference selection and provider intervals.**
   First visible is 72.582 s after Send. The first schema call returns five full
   definitions (69,098 bytes). Page imports yield a generic site metadata image
   and a Wikipedia logo before a direct building aerial image is acquired at
   provider time 49.177-49.303 s. The first drawing call begins at 71.914 s:
   22.611 s later. The App does not execute drawing during that gap. Criteria and
   fact tools run after the first drawing, so mandatory plan-before-draw gating
   is not its demonstrated cause. Five earlier native search events total about
   11.665 s; image imports total about 1.912 s. Do not describe every remaining
   interval as model reasoning or promise that one App change removes it.
3. **Reference discovery suppresses useful candidates.** reference-page-images.ts
   prioritizes images connected to page metadata, and includes other structured
   images only when metadata is absent. A generic social/branding image can
   suppress project gallery candidates. Decoding successfully establishes image
   validity, not subject relevance. The retained source-to-image evidence allows
   this selection mistake to be distinguished from a download failure.
4. **Pattern admission disagrees with construction.** designPatternSchema.faces
   uses limits.nodes (1,000), whereas aggregate admission permits 10,000 expanded
   nodes. The rejected input has 1,011 faces, eight instances, 4,048 source points,
   8,089 total nodes including root and 32,384 expanded points. An offline replay
   reports no aggregate budget issue; constructDesign succeeds with 8,088 children.
   The pattern schema alone rejects it. The retry has 943 faces and omits 68 face
   keys from the rejected input. This establishes changed geometry input, not an
   objective visual-quality judgment. The diagnostic never applies invalid input
   to an App document or bypasses production admission.
5. **Admission prevents retained repair.** invokeLocalTool returns immediately on
   schema failure. Its pure explainInputIssue hook returns only code/message;
   the downstream design owner that retains rejected drafts is never invoked.
   The failed and retry payloads transmit 274,722 and 259,166 bytes. A recoverable
   flag alone does not provide a reusable draft or an actionable numeric limit.
6. **The largest transfer is new geometry, not a children query.** Ten preparation
   inputs total 2,092,336 bytes. One base-detail input alone is 1,046,087 bytes:
   3,221 projected faces with 12,888 vertices. Current world patterns support
   constant translations; vector-pattern placements also supply only x/y/fill.
   They cannot directly express the tapered facade grid. Four recorded grid
   families cover 3,000 faces. A pure bilinear row/column reconstruction of their
   vertices differs by at most 4.78e-11 world-coordinate units across 36,000
   coordinates. This proves representation feasibility for these regular faces,
   not general surface support or permission to approximate irregular geometry.
7. **Discovery and transport need separate accounting.** Nine definition queries
   return 113,486 bytes; the first prepare-and-apply definition is 46,076 bytes.
   Exact names can return both tool and action representations. A failed
   element.remove operation lookup is followed by a 26-entry element-category
   response and then element.deleteElements. Full-schema/usage/schemaPaths
   already exist; inventing a second catalog would duplicate ownership. Native
   tools are deferred, so registration bytes do not prove all definitions enter
   model context. Provider IPC totals, model-visible content, expanded App data
   and recorder files are different costs. Recorded App inputs do not establish
   whether the provider's internal code execution or the model authored every
   expanded coordinate.

Evidence: call-details.json and retained execution payloads in the run root;
`diagnosis/verify-input.ts` with `input-contract.json`, and
`diagnosis/verify-grid.cjs` with `grid-feasibility.json`. The pure probes run with
existing tsx/Node dependencies and perform no model request or document mutation.

### Audit conclusion - why the previous fixes did not close the flow

The saved invocation advertises 29 native tools in five families (image analysis
6, references 1, preparation 2, combined workflow 1, operations 19), plus 170
App actions. This is a registration and handoff audit, not a claim that all 199
entries were semantically executed in this turn. Existing basic-API browser tests
and public signature checks remain useful and must not be replaced.

The inventory is saved as diagnosis/advertised-tool-inventory.json. Seven current
test files passed all 251 tests during this audit (audit-focused-tests.log): presentation,
design-patterns, local-design-workflow, local-tool-invocation,
operation-input-schema, reference-page-images and local-operation-tools.
The saved failure still reproduces. Specifically, audit-admission.ts returns a
repairable draft ID through direct preparation, but no draft ID through any of
public prepare_design, public prepare_and_apply_design or its parts envelope.
All four paths reject without canvas dispatch. This is a concrete test-boundary
gap, not a hypothesis about the model ignoring instructions.

A separate fault injection uses the actual prepare_design input definition and a
valid saved draft, but substitutes a result containing only {available:true}.
invokeLocalTool reports success=true and toolOutcome=usable despite the missing
prepared artifact. localToolOutcome checks generic failure fields, not the tool's
required successful-result shape. This demonstrates an output-validation gap; it
is not evidence that this malformed result occurred during the live run. Preserve
that distinction in reports. Result: diagnosis/admission-audit.json.

The causal gaps are:

- **Acceptance drift:** presentation tests deliberately require completion to
  retain the previous active verb, matching the wrong product contract. A state
  machine implements that mistake consistently; it cannot correct the contract.
- **Bypassed boundaries in proofs:** repair and large-pattern tests call owner or
  workflow methods directly. The large-pattern fixture uses one face repeated
  1,200 times, which cannot detect 1,011 source faces rejected before expansion.
- **Missing output-contract enforcement:** JSON decoding plus absence of known
  failure flags is insufficient to prove downstream usability. Input schemas are
  explicit while successful output requirements can be assumed by each consumer.
  This lets a missing producer value surface as a later consumer problem.
- **Shared-oracle blind spots:** some all-basic-API native-schema comparisons use
  only empty/invalid inputs. Equal rejection by two schemas does not prove that
  either admits every intended valid request. Valid examples exist for other
  subsets; coverage is uneven, not universally absent.
- **Fragmented limits and wording:** aggregate construction, per-list schema and
  tool descriptions reuse the same limits for different concepts. One layer can
  be fixed while another continues to reject the request or teaches a stale rule.
- **Retention without end-to-end consumption:** repair storage, partial schema
  delivery and reference reuse exist, but entrypoint reachability, representation
  scope and selected subject identity are not all proven across their consumers.
- **Intent and execution are mixed at both ends:** local-ai-provider emits running
  before schedule/admission. The result then emits completed for both success and
  structured rejection without including outcome in that progress event. Public
  commentary agentMessage items currently do not update activity. The screenshot
  therefore cannot be fixed solely by changing the completion reducer.

The record is not evidence that every earlier fix was a cosmetic adjustment:
Undo, canonical dispatch, bounded reuse and formal API tests exist. It is evidence
that closure was repeatedly judged at a local boundary and sometimes against the
wrong expected behavior. Do not add another prompt paragraph as the sole repair.

### Proposed implementation sequence and acceptance

#### 0. Establish one authoritative contract per concern before changing behavior

Use the existing owners rather than inventing a second universal tool registry.
App operation owners supply identity, supported input, resource semantics,
execution route, effects, output interpretation and repair capability. Runtime
owns generic invocation lifecycle/correlation and observation; it does not infer
App geometry or whether a reference depicts the intended building. Core/App APIs
remain authoritative for canonical writes, current permissions and history.

Derive advertised schemas, compact documentation and error limits from those
owners. Keep semantic validity, structural validity and current-state admission
separate: a locked or stale target must still reject otherwise valid input. Public
wrapper and combined-tool contracts must route to the same admitted owner value,
not rebuild an independent interpretation. Source-list limits, per-primitive
limits, total expansion and execution slices each need their own resource meaning.

Review these handoffs together before production edits:

| Handoff                  | Acceptance contract                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent to discovery      | Existing request terms and intended scope survive; only registered routes can execute.                                                       |
| Discovery to admission   | Returned usage, examples, schema fragments and native schema agree with the intended valid input domain.                                     |
| Admission to preparation | Invalid input cannot write; a repairable rejection has an actually consumable bounded recovery artifact.                                     |
| Preparation to apply     | The admitted ordered artifact is consumed without AI retranscription; keys, shared properties and coordinate spaces retain meaning.          |
| Apply to reply           | Receipt distinguishes no write, acknowledged partial write, complete write and unknown disposition; compact replies retain recovery handles. |
| Reply to successor       | Actual returned IDs, query references, source assets and unresolved review findings remain usable with correct revisions and lifetimes.      |
| Invocation to status     | Purpose comes from authorized intent; phases and outcomes come from actual owners; neither substitutes for the other.                        |
| Invocation to trace      | One correlation chain links advertised contract, input, owner phases, result delivery and UI projection.                                     |

Synchronize only the affected clauses of ai-execution-flow.md,
ai-conversation-experience.md and existing compose/prepare/apply/inspect/settle/
observe routes. Inspect owns evidence freshness and unresolved review state;
changes there are limited to handoff preservation. Existing render, persistence,
spatial-query and transaction contracts are preserved, not redesigned.

Formal test coverage must enumerate current registered capabilities, so a new
exposed tool cannot silently inherit missing contract coverage. Reuse existing
fixtures rather than creating a documentation-only coverage registry. Each native
tool needs a valid routed case and applicable input/result/failure cases; basic
APIs retain their existing executable cases plus discovery-to-dispatch coverage.
Independent spec-derived cases must judge semantics, not merely compare two
validators generated from the same mistaken definition. No fake model is needed
to test these deterministic handoffs.

#### 1. Display the current purpose with a truthful execution phase

Product decision: no generic "waiting for next step" status. Display the current
work purpose throughout processing, with actual phase where it matters. Keep
purpose separate from a transient action verb. For example, a facade-reflection
purpose can pass through AI processing, geometry preparation, canvas application
and checking without losing its subject or claiming continuous drawing.

Purpose is attached to a work scope, not copied permanently from the last finished
tool call. Use explicit bounded public intent already supplied in the request,
public model progress or existing call metadata; keep its language. Parent scope
purpose remains valid across its child calls. When a child ends and no new child
purpose has been supplied, use the still-active parent purpose, ultimately the
user's overall requested work. Do not keep a completed child as the current task
or invent the next detail. No separate status tool, extra model request, forced
planning stage, private reasoning extraction or language-specific verb parsing.

A public commentary item may update purpose if scoped to the current request; it
cannot prove computation, canvas mutation or success. The provider's current
commentary omission must be covered by a real producer/consumer test. Optional
purpose metadata belongs at the shared invocation/progress boundary, not as an
undeclared argument added separately to every strict App API schema.

Actual owner events supply admission, queueing, preparation, mutation, publication,
inspection, failure, cancellation and settlement. Emitting an intent must not mark
its tool as executing before scheduling. Ending a child removes its active phase,
not the live parent purpose. Opaque model intervals may show the known purpose
with an AI-processing phase; they cannot be described as measured geometry
calculation. UI wording does not replace fine-grained profiler attribution.

Use existing Runtime invocation identity/order and App activity state machine.
Handle parent/child and concurrent calls explicitly, including old completion,
retry attempts and events after Stop/settlement. Preserve generic-update dedupe,
saving, approval and durable outcomes. Completion is a real transition rather
than loop spam; never add arbitrary display delays to hide it. A receipt with a
rejection must not appear as a successful completed drawing.

Test first through provider, Runtime, transport and panel: announce before input
is ready; queued tool before admission; rejected input; prepare then apply;
completed base followed by the screenshot's 101-second interval; child/parent
purpose; parallel read calls; stale completion; retry; cancellation and final
save. Assert purpose retention AND phase truth, not just stable visible text.
The timeline must show a live work purpose without generic waiting labels or a
stale active-drawing claim.

#### 2. Unify input/output contracts and make rejected input repairable

Owner: App prepare, common invocation admission and retained draft repair.
Use one resource contract for source primitives, source points, expanded objects,
expanded points and internal execution slices. Schema lists must reflect the
same valid-input domain as aggregate admission; aggregate checks still run before
expansion. Remove the independent 1,000-item maximum from pattern faces, fills and selected
ranges, and the obsolete source-node instruction. Do not replace it with another
arbitrary list length. Retain 1,000 nodes / 20,000 points as internal work-window
sizes. Count and process source faces individually: a motif containing many faces
is not one indivisible vector. A genuine indivisible face/vector still obeys its
point guard. Validate sorted selected ranges and count their actual expanded
work; palette validity is separate from geometry-window size.

The existing per-artifact 10,000-node / 200,000-point resource ceilings remain
explicit protections in this slice, not a per-request limit. Do not silently claim
unbounded streaming: arbitrary global layout/relations currently require a
complete admitted artifact. Within that valid artifact, preparation and apply
partition work at their own owners, preserving one global key/layout context,
root, painter order and grouped Undo. Prove real per-window processing and
cancellation opportunities, not only a larger schema maximum or a batch counter.
Actual expansion beyond resource ceilings remains an actionable rejection; future
unbounded artifact paging cannot be inferred from removing the stale list cap.

Add a bounded owner rejection-receipt path at shared admission, separate from
pure explanation and normal execution. A schema rejection can retain the
request-local draft and return draft identity, revision, exact path, observed
quantity, allowed quantity and supported repair operations. Keep the existing
four-draft/8-MiB retention limits and request cleanup. Invalid or excessive inputs
must not be retained unboundedly. Repaired input traverses the full current
schema/budget/semantic checks. Composite tools must preserve repair identity and
path mapping. Uncertain writes cannot be retried as if nothing happened.

Test first through the real advertised-tool entrypoint: the saved 1,011-by-eight
case succeeds unchanged; resource boundaries and true over-budget inputs reject
before expansion/writes; repair changes only the selected retained fields;
eviction, stale revisions and oversized retention return explicit recovery.
Verify identical painter order, object identity rules, shared fills, partial
failure receipts and intended grouped Undo through current direct consumers.

Enforce owner-defined output contracts at the same shared boundary. Preparation
success requires the prepared identity and its necessary receipt; an image result
requires its actual asset/provenance handle; query success must distinguish empty,
complete and paginated results; mutation receipts preserve acknowledged writes.
Reuse declared result types/contracts where available instead of inventing a
universal nonempty-result requirement. Legitimate void/no-op APIs may return an
explicit successful acknowledgement. Do not infer result validity solely from
status names, object presence or the absence of a failure property.

Keep domain payloads at their owners, with one small common outcome/recovery
contract: current phase, usable/partial/unavailable result, write disposition,
issue details and actual recovery action or handle. Recoverable does not mean
safe to replay. A missing or invalid output after a possible write must retain
execution evidence and require inspection, not replay the mutation. Validate
compact and full replies against the same semantic receipt and prove that the
next tool can consume their advertised handles. Fault-injection cases include
missing artifact/asset/query IDs, malformed nested outcomes, valid empty results,
partial mutation, cancellation after acknowledgement and response delivery failure.

#### 3. Improve reference and API discovery at their existing owners

Owner: App compose/reference acquisition. Return a bounded candidate inventory
with source URL, declaration kind and retained identity. Distinguish representative
metadata from gallery/structured/body candidates. A generic metadata image must
not suppress all alternatives. Do not certify subject correctness because an
image decoded, execute arbitrary page scripts, fetch every candidate or introduce
Taipei-specific URL rules. The model selects relevance; the tool verifies fetch,
identity, dimensions and provenance, retains the selected bytes, and reuses them
for later crops/reviews. Preserve network and untrusted-input protections.

Owner: App operation registry/discovery. Return an explicit route discriminator
for action versus orchestrating tool, recommend the applicable registered route,
and avoid duplicate full contracts unless requested. Preserve access to both
real capabilities. Reuse existing usage/schemaPaths/full recovery; return the
needed schema with constraint/reference closure. Scope delivery receipts by
representation, selected fields and revision. Start with tools needed for the
current stage, rather than describing final review in the first call. Unknown
operations return a small registry-derived candidate set; broad category queries
return a bounded index with explicit continuation, not every full usage entry.

Tests: generic metadata plus valid gallery; logo-only/no-candidate pages; failed
fetch and reuse of the same retained bytes; operation/action collisions; unknown
operation recovery; nested constraints and full-schema recovery; repeated partial
queries and revision changes. Measure returned bytes and fetch/selection counts.
Schema correctness takes precedence over shortening a response.

#### 4. Express regular surface detail without transmitting every vertex

Owner: App preparation/construction. Extend the existing declarative construction
contract with a planar surface/grid primitive: surface boundary, row/column
layout, normalized cell motifs, caller-controlled keys/order and material choices.
The backend generates world points, projects and applies through existing owners.
No executable JS/callback input, automatic viewpoint/material choice, hidden-face
creation, arbitrary rounding, automatic raster flattening or silent simplification.
Irregular details retain explicit geometry. Reuse projection, source accounting,
ordered slices, shared properties and editable vector output.

Before implementation, formalize the generic mapping and unsupported geometry in
the spec and prepare Inspector step. Compare the recorded 3,000 regular faces to
explicit geometry with a justified floating-point tolerance; preserve all fills,
keys, winding and interleaved painter order. Test holes/irregular details via the
existing explicit path, degenerate/nonplanar surfaces, true expanded limits,
cancellation between slices and Undo. Prove source computation counts, not merely
matching final pixels. If a proposed mapping cannot preserve these semantics,
revise that primitive before implementation rather than changing drawing quality.

#### 5. Close trace gaps at the actual boundaries

Owner: Runtime observe plus App domain adapters. Correlate provider item, tool
invocation, retained input, compilation, apply/publication and displayed phase.
Record raw input bytes, retained/reused bytes, repair delta bytes, expanded node
counts, schema representation/revision, outcome and rejection path. Each payload
has an ID/digest; duplicate references and actual retransmissions are separately
counted. Preserve local-only data handling and bounded recording overhead.

Distinguish provider waiting, visible output delivery, App computation and
transport. A provider-owned opaque interval is an observed boundary, not a claim
about private reasoning or an unowned gap. Expose missing start/end/parent
correlations as diagnostics rather than synthesizing success. Replay checks must
prove that every active UI action is backed by a currently active owner phase.

### Integrated regression and self-review

The implementation is one integrated change with owner-sized development slices;
a slice passing does not close the task. Before another live run, combine the
following sequences using real App adapters and deterministic external fixtures:

- Discover the needed contract, create a first ready part without a mandatory
  whole-design plan, compile repeated detail, apply ordered parts, inspect and
  repair through returned handles. Include an existing-document edit with no new
  root, arbitrary 2D geometry without projection, and shared-property updates.
- Validate source-face counts around 1,000 independently of expanded counts;
  test single, combined and parts envelopes with the same valid source. Test
  exact aggregate and primitive boundaries, invalid depth and negative world
  coordinates using the already-correct world/local conversion owner.
- Reject before writes, repair a retained field, apply, then fail a later part.
  Preserve completed receipts and target links; do not replay the first part.
  Cover cancellation while queued, during preparation, after an acknowledged
  mutation and before response delivery. Keep fatal transport termination distinct
  from recoverable domain rejection.
- Discover two image candidates including a logo, select the actual subject,
  reuse its identity for a crop and final comparison, and retire a rejected
  candidate without repeatedly importing it. Missing/expired image references
  restore through the owner; acquisition never certifies subject suitability.
- Retrieve partial and full schema scopes, lose one scope, recover just that scope,
  consume a region-query handle for a patch, then change relevant data and reject
  stale reuse. Full recovery remains possible and bounded.
- Replay activity events and trace correlation over the same sequence, including
  variable delays and concurrent reads. Verify there are no duplicate mutations,
  fabricated computation labels, lost purpose or success claims after failure.

Keep existing direct-API E2E, retained-query invalidation, grouped Undo, shared
Fill, group-coordinate and durable-settlement tests as accepted-behavior guards.
Test changed owner contracts with valid, boundary, malformed, stale, partial,
cancelled and delivery-failed inputs as applicable. Enumerate the live registry
for coverage, then use independent assertions for results and work counts.
A single full 101 run exercises only one path and cannot replace these proofs.

Count projections, compilation, serialization, asset fetches, schema deliveries
and canonical writes across repeated calls. Distinguish intended trust-boundary
validation from avoidable reconstruction. Do not remove validation or change
scheduler concurrency just because a helper is called twice: current evidence
has not shown either to dominate this run. Keep browser-drawn results, object
counts and pixel/geometry fidelity separate from bytes and model latency.

Self-review revised the earlier proposal in seven places: generic waiting wording
was removed; the tool-start-before-admission path was added; announced purpose
was separated from completed child work; real public admission now precedes the
repair proof; output usability gained owner-defined validation rather than generic
failure-field inference; schema equivalence gained independently valid boundary
inputs; and
surface-grid feasibility must preserve interleaved materials and painter order,
not coordinates alone. All are requirements of this proposal, not completed fixes.

### Completion boundary

Reviewed dependencies: the activity fix changes the current accepted contract,
so spec/Inspector correction precedes code; pure admission remains non-mutating;
retained repair never bypasses revalidation; geometry compression preserves order
and explicit artistic decisions; candidate discovery does not certify relevance;
no output-only cache proof or model-second performance promise is sufficient.
The probes establish admission/recovery failures, an output-validation gap and
one feasible geometry representation. They do not establish production readiness
or completion of the proposed fixes. Repeated review found no further concrete
contradiction within this bounded proposal; the formal failing cases and owner
contract updates remain required before implementation.

Implement one owner slice at a time under the current authorization, with formal failing
regressions before fixes and scoped lint/type/build checks for touched owners.
Existing related behavior remains in the focused gates. After all slices, use one
user-authorized complete recorded Taipei 101 run to inspect truthful activity,
first visible time, repair/reuse, selected references and final artwork. Report
workload and bytes alongside time; do not compare unequal object counts as a fixed
speed benchmark. Full local CI and push remain excluded from this task.

### Step Execution Card - prepare - resource windows and public admission

Owner: prepare with compose-to-prepare and prepare-to-apply handoffs. Source:
ai-execution-flow.md preparation contract and ai-execution-flow Inspector prepare
conditions, artifacts and implementation boundary. Inputs: admitted declarative
draft/repair, shared projection, fill templates, selected ranges and cancellation.
Outputs: the same ordered immutable artifact, accurate source work windows, or
structured rejection with no canonical mutation. Allowed: existing construction,
preparation, shared admission, budget and schema owners. Forbidden: canvas access,
AI/manual splitting, geometry simplification, changed global resource ceilings,
new IDs per resumed window or a second layout/projection owner. Advice and direct
edits continue to bypass preparation. Failure owner: prepare; apply retains
canonical locks, finite mutation members and acknowledged receipts.

Files: server/design-construction{,-schema}.ts, design-budget.ts,
design-preparation.ts, local-design-tools.ts, local-design-workflow.ts,
local-tool-invocation.ts, their direct formal tests and src/ai/prepared-design.ts.
First regression passes the same >1,000-face source through advertised/native
schemas and real shared admission, single and parts routes; requires unchanged
expanded output, bounded source windows and ordinary apply slicing. Follow with
palette/range boundaries, invalid primitives/expansion, cancellation, repair and
output-contract cases. Run focused tests, naming, changed-source lint and types,
then current Inspector candidate/contract review; no whole local CI. Stop the
segment if canonical renderer or new persistence changes become necessary.

Naming decision: retain existing public tool IDs and artifact version. Resource
names describe source windows versus aggregate ceilings, not model or branding.
Any new progress/result metadata is request-scoped and will have its own Runtime
owner step; this prepare slice does not introduce a persisted schema migration.

Self-review: the stale cap removal does not authorize unlimited expansion;
source batching must execute work rather than only count it; whole-artifact
identity/layout and application chunking remain coupled by the existing artifact;
invalid later inputs cannot create a partial document during preparation. The
public-entry regression precedes implementation. No unresolved contract conflict
remains for this bounded prepare slice after the matching spec/Inspector edit.

### Prepare slice evidence - cooperative construction

The native/public 1,011-face regression failed before implementation. The corrected
route retains all 8,088 expanded faces. Synchronous and cooperative construction
share one generator; the server consumes it with cancellation checkpoints before
publication. Independent faces are counted independently, including 5,001 faces
with 20,004 source points. Sparse ranges and palette phase survive windows.
The existing preparation session also retains its synchronous domain utility;
server tool invocations always use its cooperative compiler. Focused tests now
observe that compiler rather than the synchronous utility.

### Step Execution Card - prepare/compose - rejection and result handoff

Objective: preserve bounded rejected drafts at shared admission and validate the
required prepared artifact before a caller treats its result as usable. Inputs
remain the advertised schemas; rejected sources do not execute or bypass schema
validation. Owners supply diagnostic retention and result validation to the shared
invoker. Ordered parts retain exact part keys and repair handles without executing
siblings. Output failures retain unknown write disposition rather than replaying.
Files: local-tool-invocation.ts, local-design-tools.ts, local-design-workflow.ts,
direct formal tests, matching spec and Inspector prepare/compose contracts.
Test first: invalid public single/parts input returns repair handles and zero
writes; repair succeeds through the same entry; missing prepared identity rejects.
No generic nonempty-result requirement; documented void/no-op tools remain valid.

### Step Execution Card - observe - purpose and observed phase

Objective: project the currently active owner phase with its scoped purpose,
returning to the public request purpose after child completion. Runtime owns the
progress envelope and correlation; the App adapter emits scheduling, preparation,
application and public commentary events; the App reducer owns UI projection.
Inputs: ordered call identities, parent identities, scope, explicit phase, authored
purpose. Outputs: truthful current phase/purpose and rejection/retention diagnostics.
Files: Runtime provider/runtime progress contract; Design local-ai-provider,
local-tool-invocation observation, activity-state, conversation/panel projection,
related formal tests and matching prompt/spec/Inspector. No new model calls,
private reasoning access, verb rewriting or timers that hide completion.
Test first: a completed base at 72 seconds followed by provider processing uses
the parent purpose, never the completed drawing action. Nested and concurrent
calls preserve live ancestors; late completions cannot replace newer work.

### Step Execution Card - compose - bounded discovery and scoped delivery

Owner: existing operation registry and reference-page acquisition. Scope: partial
schema delivery receipts keyed by representation/field set/revision; parent
constraint closure; registry-derived recovery candidates and paginated category
menus; page candidate inventory without automatic subject selection. Reuse
existing full recovery, immutable images and acquisition protections. Files:
local-operation-tools.ts, reference-page-images.ts, local-reference-tools.ts,
direct tests and matching compose/prepare spec and Inspector. Formal tests first
prove repeated partial delivery and suppressed page alternatives. No renderer,
model changes, arbitrary scripts, hidden detail removal or private data search.

### Step Execution Card - prepare - declarative surface grids

Inputs: planar convex quadrilateral, row/column counts, normalized polygon motifs,
material/key/name data and explicit cell-major or motif-major order. Output:
ordinary editable vectors in one artifact. Owner: construction with existing
projection, budget, global identity and Group normalization owners. Files:
design-construction{,-schema}.ts, design-budget.ts, local-design-tools.ts,
preparation examples/prompt, direct tests, preparation spec/Inspector. Reject
unsupported geometry rather than changing it. Test explicit 3,000-face equivalence,
source projection count, winding/order/fills/keys, true resource limits,
cancellation, invalid planes and public native admission. No JS callbacks.

### Prepare slice review - recorded grid material and plane fidelity

The recorded 3,000 faces interleave glass and edge motifs, use per-cell fills,
and translate edge surfaces by two world units. The initial generic grid test
covered shape and uniform materials but could not prove this recorded case.
Continue the prepare card above: add optional motif `offset` and `fills` using
existing world-point and pattern-fill semantics; derive projection deltas once
per motif, never per generated face. These are request input fields, not persisted
components; no saved document migration is involved. A recorded geometry fixture
and independent explicit-face comparison must preserve order and every material;
original source keys map explicitly to generated keys without canonical ID changes.
Formal tests precede the construction/schema extension. Boundary scope remains
construction, its schema and tests, with matching preparation spec/Inspector.
No approximation or automatic material assignment is allowed. Naming baseline:
15 checks passed. Existing cooperative windows and aggregate ceilings remain.

### Compose/prepare handoff review - selected reference lifetime

The real candidate-selection regression found that only representative URLs
updated the retained page choice; newly exposed gallery candidates did not. A
failed representative inventory could also shadow a later successful explicit
selection. The existing compose discovery card covers this correction: reuse
all declared candidate identities, replace the page's selected asset after
successful explicit acquisition, and retire its obsolete failure receipt.
Continuation retains the page inventory; fresh acquisition remains retryable.
Two formal cases first failed with distinct decoded image bytes. Their producer
and reuse consumer now assert the same reference and attachment identities,
one page fetch and exactly two image acquisitions. No subject selection policy,
image resizing, fallback image or automatic retry is introduced.

### Resumed implementation checkpoint - 2026-10-11

Status: this follow-up implementation and scoped deterministic verification are
complete. Live full-101 acceptance has not been rerun. No push, full local CI,
new model request, recording or App server was started in this segment.

The resumed bounded review corrected three concrete gaps: an empty outer evidence
snapshot could hide acknowledged output; the initial grid omitted the recorded
per-cell material choices and offset trims; candidate-page reuse could return the
old representative after explicit gallery selection. Each behavior now has a
permanent regression, with failing-before evidence under the existing diagnosis
directory. Public ordered-part tests also prove repair without geometry resend
and continuation after a later failure without replaying the completed part.
The prompt contract test now checks purpose plus observed phase rather than
requiring the superseded continuous-action wording.

Verification on the final affected source:

| Gate                                                                    | Result                                                  | Evidence under run diagnosis                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Server, tool contracts, preparation, discovery and provider adapters    | 548 passed, 3 conditional live-protocol probes skipped  | resume-server-closure.log                                                     |
| Activity, conversation, panel, transport and retained-context consumers | 134 passed                                              | resume-ui-final.log                                                           |
| Runtime progress, delivery and profiler records/trace                   | 60 passed                                               | resume-runtime.log                                                            |
| Runtime build, server types and App types                               | Passed                                                  | resume-runtime-types.log, resume-server-types-final.log, resume-app-types.log |
| Touched-source lint                                                     | No errors; 3 explicit console logging warnings retained | resume-lint2.log, resume-reference-lint.log, resume-prompt-lint.log           |
| Naming                                                                  | 15 passed                                               | resume-naming-final.log                                                       |
| Current-source Inspector owner proof                                    | Passed                                                  | resume-final-candidate2.log                                                   |

The three skipped probes require real provider/discovery configuration and are
outside this segment's no-model-run boundary; they are not reported as passed.
Inspector candidate 86392e1e-b90d-4413-9ccf-25a6a665d4c5 captured source
48465eb51b37811078086782c320c812b80ac80753e87e66dac1ec6265e75953;
review 91510b8ea67f9c4e21ac34a148132cbc879bfd7d35ada943aec4d36a48690cd1
accepts the current contract. Later edits only append these plan notes.

The permanent recorded-facade fixture compares all 3,000 faces, their order,
material references and source-to-generated key mapping against explicit geometry
within 1e-8 coordinate tolerance. It includes signed projection offsets and the
original shared fill templates. Source projection calls are 12 versus 12,000;
compact input is under one tenth of explicit input for that fixture. This is
computation/representation evidence, not a model-latency or visual-quality claim.

Closure review: canonical APIs, Group normalization, shared properties and Undo
remain their existing owners. The backend cooperatively processes source,
expansion and identity work; final whole-artifact admission/layout compilation
still runs synchronously inside the unchanged aggregate limits. No unbounded
streaming, automatic material/subject selection, silent geometry simplification,
arbitrary executable callback or universal semantic validator was introduced.
Owner result contracts validate usable handoffs; registered action semantics and
retained-query freshness remain enforced by their canonical producers/consumers.
The next live 101 run must still verify actual model use and visible status; unit
and adapter evidence does not certify that future artwork or provider duration.

### Full Taipei 101 live acceptance - 2026-10-11

User-authorized single complete drawing run, recorded headlessly, with final
ten-second hold and harness-only bounds fitting. No push or full local CI.
Step execution: exercise current compose/apply/inspect/settle/observe contracts
without production edits; compare phase-purpose DOM history with invocation
spans, preserve all run outcomes, timing evidence and selected reference assets.
Existing accepted candidate remains the implementation source authority.
Evidence: `tmp/full-101-truthful-status-20261011/`.

#### Live acceptance result - 2026-10-11

One request completed successfully, with two independent final assessments
(first required revision, second accepted). First visible geometry: 40.529 s;
DOM completion: 1175.186 s; final retained objects excluding workspace: 81,981.
The recording includes final fit and a ten-second hold. All 141 execution
records completed; no browser errors or user confirmation prompts occurred.
Runtime source fingerprints remained unchanged throughout the run. No push
or full local CI was performed; the three task-owned services were stopped.

Observed exclusive drawing lifecycle: provider 868.365 s (including 52.262 s
child assessment), browser/App 299.503 s, tool backend 6.774 s; no uncovered
lifecycle interval. This does not expose private provider-internal activities.
Final durability was already satisfied; history settlement took 79.2 ms.

The live run does not close every acceptance issue:

- Observed canvas/processing phases switch correctly, but final review retains
  a broad earlier purpose with a generic operation label; initial activity also
  echoes the full prompt before authored commentary arrives.
- One batch produced ten retained context snapshots against the eight-entry
  owner cache; the oldest snapshot was evicted before mapped fill mutation.
- Artifact targets for read_design_context were rejected by argument-path
  resolution. The model recovered through other calls rather than stopping.
- Three inputs repeated identical 17,004-key targets (about 396-400 KB each).
- Equal-count 5,761-object/181-slice application receipts grew from 16.045 s
  to 38.773 s as this large document developed. This needs bounded owner
  analysis; it is not proof of a renderer-only regression.
- One raw usable query receipt is projected as unknown in the offline report.
- Two source-local acquisition failures (HTTP 403 and original-image size)
  remained recoverable; final assessment used retained image indexes 1, 3, 4.

Successful backend generation expanded 1,402 source nodes into 83,252 prepared
objects in 96 windows, maximum 1,000 expanded nodes per window. All fourteen
prepare-and-apply calls were usable; no source-size admission rejection occurred.
Prepared totals include objects later replaced, unlike final retained counts.
Evidence and exact timings: tmp/full-101-truthful-status-20261011/report.html,
verified-findings.json, application-analysis.json, verified-timing.json and trace.json.

### Large-document execution and pre-drawing review revision - 2026-10-11

Status: implementation and bounded self-review complete; focused closure and the
user-authorized complete recorded Taipei 101 run are in progress.
Baseline: e07bbd222c68e6806708fb450ac886dc47a07f4f plus the existing worktree
changes fingerprinted by the live run. Preserve those changes. The user has
authorized implementation and one complete live generation after review. No push
or full local CI is authorized.

#### Bounded audit and confirmed findings

Discovery is limited to the latest live records, their current producer and
consumer paths, canonical batch creation/settlement, retained queries/targets,
activity projection, report classification, and prepared/reference review.
Current authorities are ai-execution-flow.md, ai-conversation-experience.md,
the execution Inspector's compose/prepare/apply/inspect/settle/observe steps,
and the corresponding formal tests. Historical output is evidence, not a new
product contract. Do not reopen unrelated rendering or reference acquisition.

1. **Application cost:** 28 successful applications consumed 262.567 s within
   the 299.503 s App interval. Equal 5,761-element/181-slice calls grew from
   16.045 to 38.773 s. Creation, transaction settlement, and host yield all
   grew; yield includes scheduled work and is not idle time. Current canonical
   creation copies the full parent child list for rollback, copies it again in
   Workspace.addNewElements, and copies it in Group's canonical replacement.
   This establishes accumulating-parent work, not its share of the 262.567 s.
   Existing App admission tests prohibit full parent snapshots in the wrapper,
   but do not detect these deeper copies. The recording harness also requests
   all-element bounds every second; its cost must be separated from product work.
2. **Invalid query handoff:** ten snapshots were returned successfully against
   the eight-entry cache. The ninth/tenth insertions evicted live dependencies
   before map_retained_fills consumed them. Capacity is a storage policy, but
   the public receipt currently behaves like a durable handoff. Existing tests
   cover stale/released/single over-capacity results, not this producer-consumer
   sequence. Pinning alone would not fix revision invalidation after writes.
3. **Target admission defect:** context-action.ts exposes a root oneOf, while
   local-operation-batch.ts targetPath walks properties only. A valid scope=ids
   reference has no discovered path and is rejected before dispatch. Recovery
   used ten broad region queries: each inspected 81,140 metadata candidates
   before the parent filter. This is not evidence that local spatial indexing
   itself is missing; an exact identity route was unavailable to the caller.
4. **Repeated identity delivery:** three inputs repeated the same 17,004 keys,
   with target digest 9015019a988a6d49671248cab63a2fbc1650afa4065a1af835a04fd3694f5a32.
   Each complete input was approximately 396-400 KB. Existing artifact/prefix
   reuse handles simple families, but these selected subsets are repeatedly
   represented as expanded keys. Repeated metadata reads are a separate cost.
   Diagnostic storage is not wire traffic: primary records identify 757 unique
   payload paths totaling 393,498,830 bytes, but exact repeated digests account
   for only 13,990 redundant bytes across 43 groups. Whole-file hash deduplication
   alone will not solve this volume. Compare semantic artifact identity and field
   lineage across envelopes before classifying the remaining bytes as redundant.
5. **Activity purpose:** the scoped state machine correctly ends canvas phases,
   but a phase-only child inherits previous/parent/request text. Final assessment
   therefore displays an earlier construction purpose. The request seed also
   echoes the full prompt. Neither needs a language override or a waiting label.
6. **Classification:** exec-cd4aaafb-6c65-41fc-91ec-e707ee7853f2 has canonical
   toolOutcome=usable and diagnostic.output.usability=usable. The generic evidence
   summarizer exhausts its budget in actionResults, replacing toolOutcome with
   '[evidence budget exhausted]'. The evaluator reads that lossy evidence instead
   of the retained outcome and reports unknown. Full payload 511-output.json is
   preserved. This is a projection defect, not a failed query or missing duration.
7. **Late repeated-detail correction:** the first final assessment requested
   window construction/material depth and entrance detail; subsequent repair
   included eight 5,761-object batches. This is a candidate for early prototype
   review, not proof that every requested repair was necessary. Reference camera,
   actual visibility, original requirements and optional polish must be checked
   before treating an assessment suggestion as a mandatory addition.

#### Intended end-to-end flow

Retained reference evidence -> current requirement/fact bindings -> coherent
part recipe and reusable detail prototype -> read-only draft review -> repair
only a contradicted recipe/prototype -> canonical preparation -> ordered apply
windows -> current-state inspection -> independent final visual assessment.

Parallel to this product flow, Runtime carries scoped work identity, actual
phase, durable outcome metadata and correlated owner spans. The App supplies
domain purpose/evidence; the profiler never approves content or controls writes.

#### Implementation order and owner contracts

**1. Make evidence and activity trustworthy before performance changes.**

Runtime recorder/evaluator must retain a bounded typed execution outcome outside
the optional narrative/array summary budget. Preserve transport outcome,
domain usability, mutation settlement and visual correctness as separate fields.
Contradictory evidence is explicit; an exception after acknowledged writes is
not not-started. A validated before-write rejection can say not-started when
the executor supplies that evidence. Missing evidence never implies success.
Report from this canonical outcome, not a second interpretation of truncated
payloads. Large payloads remain local digest references, with explicit recovery.

Activity retains the state machine and call/attempt ordering. Each owner entry
supplies an actual phase and a task-scoped purpose with provenance; inherit
subject context only, not an earlier execution verb. Review tools publish the
review purpose before entering the child model and retain it for that call.
Closing a child restores the live parent purpose, never a finished child or
unrelated sibling. Use registered task/operation purpose until model-authored
detail arrives; do not echo the full prompt or add a separate labeling model.
Do not fabricate private provider activity. Language remains model-selected.

Add child spans/counters at existing canonical creation and Factory publication
boundaries. Distinguish creation, parent membership, property preparation,
history validation, observer delivery, persistence capture, and host scheduling.
Reuse existing canonical phase hooks where available. Record harness bounds
reads separately. Owner adapters feed the Runtime sink; no per-element log flood,
new telemetry, or duplicate profiler. Count scans, copied memberships, delivered
changes and serialized bytes alongside durations. Exclusive intervals must not
double-count nested observer/persistence work.

**2. Repair target and result lifetimes as one producer-consumer contract.**

Use the authoritative registered schema to resolve the applicable target slot
across oneOf/anyOf and nested objects using supplied discriminators. Reject
conflicts or genuine ambiguity; never guess by tool name, select a first branch,
or weaken final schema validation. Prefer explicit typed target-binding metadata
at the registry owner when schema semantics cannot uniquely express a binding.

Artifact preparation owns immutable named subsets/prototype instances and stable
opaque target-set handles. Resolve an arbitrary supplied subset once; subsequent
reads and mutations consume its handle instead of retransmitting expanded keys.
Existing exact-key and prefix routes remain valid current selectors. Preserve
identity order, missing-member errors, release, document/request ownership and
current existence/lock checks. A creation set is not live Group membership.
No generated element IDs become semantic names; no implicit root is introduced.

Separate a reusable selector from a revision-bound value snapshot. Add an owned
consumer lease for snapshots that have been accepted for pending work; eviction
may reclaim only unleased entries. Budget admission precedes a successful lease
receipt. Exhaustion returns capacity/backpressure before writes, never a usable
reference immediately invalidated by sibling production. Release on explicit
release, consumer completion, cancellation or request disposal. Retaining a lease
does not make stale values current. Keep canonical revision checks; finer field
invalidation requires authoritative change evidence and its own tests, not an
assumption that fills cannot affect a query.

For query-to-fill mapping, add a bounded declarative selector-and-mapping route
at the current mapping owner: resolve required columns, prepare patches, validate
all conflicts/locks and consume within the declared batch lifetime. It accepts
the existing mapping descriptors and artifact/region selectors, not JS callbacks.
Do not silently convert an atomic mapping to query/write/query/write streaming.
If a larger operation explicitly selects ordered-part semantics, return completed
part receipts and reject stale pending parts; never replay completed writes.
This route removes the need to export ten snapshots and ask the model to stitch
them together. Standalone reusable reads retain their explicit lease contract.

Exact identities use direct lookup. Narrow bounds continue to use spatial
candidates. Parent-only questions use the hierarchy owner. For combined broad
bounds and selective parent filters, use existing candidate-set intersection or
shared immutable candidate selection when it demonstrably reduces work, while
preserving spatial ordering. Do not enumerate an eight-tier subtree for a small
local region. No new global index is justified without measured owner evidence.

**3. Remove accumulating work beneath cooperative batch application.**

First add a formal same-size creation sequence against growing documents and
growing parents through the actual Core path. Count canonical memberships copied,
property preparation, publication and observer work; include independent parents
to distinguish parent growth from document growth. Replay retained descriptors
without a model, with capture on/off and harness polling separately attributed.

Replace full-parent copy/replace per append slice with canonical ordered insertion
evidence and its exact inverse at Scene Tree's membership owner. Rollback removes
only the attempted insertion and restores its relationships; preserve ordered
ADD_ELEMENT evidence, snapshots returned to readers, custom containers, shared
properties and inverse behavior. Do not mutate an exposed readonly snapshot or
bypass computed invalidation. Arbitrary insertion/reorder may have legitimate
suffix work; the normal append path must not repeatedly clone old siblings.

Keep publishable slices and grouped Undo. Coalesce work only inside its valid
transaction boundary; do not hold one giant transaction across asynchronous
generation, suppress required notifications, reduce detail, or increase slice
limits to conceal repeated work. Repair publication/subscriber work only after
the owner counters identify a concrete accumulating scan or rebuild. Yield time
needs scheduling and browser-profile evidence; it cannot be relabeled as render
cost. This substep remains a diagnostic gate, not a claim of a proven single cause.

**4. Add pre-drawing content review without another full-design planning barrier.**

The existing prepare_design checks syntax, layout and canonical descriptors;
recorded criteria/facts and reference acquisition do not review an unseen result.
Add a distinct read-only prepared-content review responsibility in the Design
review owner, provisionally review_prepared_design, registered through the same
invocation/schema contract. Input is a retained draft/artifact revision plus
requirement, applicable reference/fact revisions, intended view and explicit scope.
Backend derives the review packet from actual source, not only the drawing agent's
claim that its plan is correct. No raw geometry resubmission or canvas mutation.

Deterministic checks cover coordinate frames, units, projected bounds, attachment,
declared repeated-part counts and unsupported capabilities. A separate tool-free
model assessment examines reference-supported structure/arrangement, visible
surfaces, material/detail recipe and unresolved assumptions. Return scoped
pass/fail/unverified findings, source/part keys, required corrections and optional
polish separately. This is preparation evidence, never final visual approval or
a guarantee of 'almost no problems'. Unknown source dimensions stay assumptions.

Review the whole composition's lightweight structural recipe and one prototype
per materially different repeated detail before expanding it widely. For Taipei
101 this includes the window frame/glass/shadow recipe and entrance arrangement;
it does not require reviewing every window or completing every tower surface
before the first batch. Review per coherent ready part; completed review is reused
for identical prototype/view/material dependencies. Only changed dependencies
invalidate it. Instance placement and exceptions retain deterministic checks.
Fix source recipes before expansion rather than adding another full layer later.

Prompt guidance requests this route for reference-dependent composition or heavily
repeated detail. Direct known-value edits remain direct batch actions. On a review
failure, repair the identified draft part and review its changed dependency scope;
do not restart research or regenerate the whole drawing without new evidence.
The producer passes the admitted recipe revision to preparation/application, which
checks that identity; a review of revision A cannot certify regenerated revision B.
Final current-canvas visual review remains mandatory under the existing contract.

A fidelity limitation is explicit: Core.captureElementSnapshot currently accepts
an existing element ID, not an unapplied artifact. Do not promise an offscreen
visual preview by reusing that signature, render into the user's document and
delete it, or add a parallel SVG/Pixi approximation. Initial pre-drawing review
can examine actual structured recipes plus selected reference images and must
label appearance as unverified. If representative pre-drawing pixels are required
to close material defects, first prove isolated canonical rendering with the
same engine via an owner-approved Core API, with no live document, Undo,
collaboration or persistence effects and explicit resource disposal. This is a
separate feasibility checkpoint before that implementation, not a hidden fallback.

#### Required proofs and completion conditions

- Replay the successful ten-query receipt above with oversized/reordered fields:
  outcome remains usable; actual partial/rejected/unknown remain distinct. UI,
  records and report agree for the same call without opening every payload.
- Activity replay covers first intent, prepare, apply, yield/provider, final
  assessment, nested/sibling completion, reordered updates, Stop and late events.
  Purpose and phase match the active owner throughout, not merely at endpoints.
- Ten dependent snapshots under the current bounded policy cannot return doomed
  success handles. Test leased pressure, explicit refusal, release, invalidation,
  workspace replacement, cancellation, overlapping mappings and shared-fill
  conflict rejection. Invalid queries write nothing; no automatic mutation replay.
- The real oneOf context action accepts artifact targets only in the compatible
  branch. Test ambiguous branches, conflicting explicit IDs and malformed input.
  Repeat the same 17,004-member subset through reads and edits: membership bytes
  travel once, later calls carry references, output/ordering equals explicit IDs.
- Growing-document application preserves ordinary creation, computed data,
  selection, Undo/Redo, rollback, shared properties and user/remote interleaving.
  Work-count tests must fail on unnecessary old-member traversal; timing alone
  and mocked App create calls do not close this issue. No machine FPS CI threshold.
- Draft review catches wrong units/frame/view constraints, unsupported source
  assertions, contradictory repeated-detail recipes and unrequested decoration;
  it does not demand occluded features from another reference viewpoint. Identical
  recipes reuse evidence, changed material/view/reference invalidates the affected
  scope, and any unrendered appearance remains unverified. Include a non-building
  request and an existing-object edit so guidance is not Taipei-specific.
- Use existing focused owner suites and new permanent regressions first. Before
  future production slices, update the thin specs and the exact affected Inspector
  routes and run supported admission/review. Current admission does not certify
  this proposed extension. A later authorized complete 101 run records first
  visibility, correction reasons/counts/objects, serialized bytes, query work,
  application phase work, status timeline and final references. Do not compare
  different object counts as equal-work benchmarks or promise fixed model seconds.

Future implementation boundaries: Design's existing preparation/review tools,
target adapter, context/mapping owners, activity projection and prompt; Runtime's
invocation/activity/profiler owners; the demonstrated Scene Tree membership path
and its Core/Factory consumers only as supported by counters. Their direct tests,
current specs and execution Inspector are included. General renderer acceleration,
reference search/retry changes, model settings, external tools/dependencies and
unrelated Framework cleanup are excluded. Offscreen preview has the separate
feasibility gate above. This task edits only this plan.

#### Self-review outcome

The first design pass had four risks: leases alone do not prevent stale revisions;
streaming mapping could change atomic behavior; a textual prototype review cannot
certify material appearance; larger application windows could mask parent copying.
The revised design explicitly separates selector/value lifetimes, preserves atomic
mapping or explicit ordered-part semantics, labels missing visual evidence, and
requires canonical work-count proofs with unchanged cooperative behavior.

Review also found an important scope distinction: exact-ID routing is broken,
but the recorded broad bounds genuinely contain the tower. Fix routing before
claiming the spatial index is slow or creating another index. Current evidence
proves parent-list copying and status/outcome handoff defects; it does not quantify
all creation/observer/scheduling costs. The remaining owner measurement and any
isolated-preview feasibility must pass before those production changes. This plan
is a reviewed investigation and implementation sequence, not an all-causes-fixed
claim. No additional concrete handoff contradiction was found in the bounded
second review; the stated measurement and feasibility checkpoints remain open.

#### Approved execution and recoverability decision - 2026-10-11

The user approved the detailed implementation direction and explicitly permitted
replacing or removing costly ACID-related mechanisms when the system still
protects its data and supports continued work after errors. This is conditional
authorization to simplify the mechanism, not a requirement to remove transactions,
Undo, persistence acknowledgement or every inverse record. No push is authorized.

The product objective is recoverable progress with bounded normal-path overhead:
completed coherent parts remain useful; a failed part leaves no broken canonical
relationships; users can continue or explicitly undo completed work. An entire
long-running AI request need not be all-or-nothing. Existing per-member publication
and the single request history group already support that distinction.

Current code findings refine the implementation decision:

- SceneTree.addNewElementBatch saves the full old child list before materializing
  a batch. The local catch uses it only when membership may have changed before
  the transaction owner accepts the handoff. After acceptance, the local owner
  does not independently restore membership; Factory owns settlement. Preserve
  this exactly-one-recovery-owner boundary when replacing the snapshot.
- Workspace.addNewElements and Group.replaceChildrenFromCanonicalBatch also copy
  the growing list. Disabling failure rollback alone would leave those costs.
- Setter.get returns the stored value directly. In-place append is not a safe
  replacement until public reader/snapshot aliasing is resolved. An older result
  must not silently change because an internal writer reused its array.
- Factory shares inverse/replay primitives with Undo and remote compensation.
  rollbackable=false does not remove undoable inverse requirements; changing that
  option is not evidence of reduced work. Its current validation context scans
  the current journal, not proof of a full-document validation on every commit.
- Existing insertion/removal tests exercise rejected handoff and cleanup paths.
  They are evidence of failure cases that need a replacement, not a mandate to
  preserve their current copying algorithm. The direct ordinary-creation path
  must receive its own fault-injection coverage rather than borrowing proof from
  the separate prepared-insertion path.

Design choice: prioritize incremental canonical membership evidence and shared
inverse data over full-parent rollback snapshots. Keep finite, consistent commit
boundaries, but do not preserve duplicated validation, snapshots or bookkeeping
merely because they were introduced with ACID work. Measure normal-path snapshot,
validation, history and publication work separately from actual error recovery.
Broader deletion of the transaction machinery is not currently justified by the
recorded timings and would remove behavior shared by unrelated operations.

Recovery cases for the apply-step revision:

1. Invalid input: reject before writes; return repairable input evidence.
2. Failure before owner handoff: clean up the attempted membership, property
   relationships and computed instances using the bounded insertion evidence.
3. Failure after accepted handoff: Factory alone settles the accepted mutation;
   the caller reports that settlement and does not independently delete it.
4. Failure after earlier parts committed: preserve those parts, seal ordinary
   grouped history when the request ends, and identify unfinished parts. No blind
   replay of acknowledged mutations and no long-lived global interaction lock.
5. Projection failure with verified canonical data: report the failed projection
   and permit its existing owner rebuild path; do not label it a failed canonical
   write or recreate already-created objects.
6. Recovery itself fails: attempt independent remaining cleanup, preserve the
   primary error plus recovery failures, and do not claim the document is safe.
   Existing persistence protections remain until consistency is established.
   Never silently reload away unsaved work or overwrite a known-good save.

Before removing any existing protection, prove the replacement through the real
Core creation path: fail during materialization, parent membership, property
handoff, accepted publication and cleanup; then test another valid edit,
Undo/Redo and save/load. Count old-membership copies and inverse work on successful
calls. Preserve shared property ownership, sibling order, custom containers,
user/remote interleaving, and exposed snapshot independence. A faster successful
path with damaged failure behavior does not meet the user's recoverability goal.

This amendment changes the approved design constraints only. Production changes
remain subject to the existing owner-step readiness and test-first sequence;
the open aliasing and isolated-preview experiments remain explicit prerequisites.

#### Step Execution Card - observe - outcome metadata independent of summaries

Owner: Runtime observe/trace-owner, existing Inspector observe conditions for
receipt usability and transport separation; spec: ai-execution-flow.md, Shared
Runtime profiler and Execution recording. Inputs: actual tool result and failure
at the shared invocation boundary. Output: bounded outcome metadata independent
of optional payload summaries, consumed by the existing offline report. No model,
canvas, mutation or retry decisions. Missing historical evidence remains unknown.
Boundary: profiler recorder.ts, evaluation.ts and their existing records tests,
already in the observe implementation boundary. Failure owner: Runtime recorder
or report projection. Required cases: oversized and reordered successful results,
admission rejection, partial outcome, failed transport and unknown contracts;
existing profiler suites preserve payload redaction and diagnostic isolation.
First prove the successful receipt is misclassified before implementing; run
focused profiler tests and naming review. Stop if classification needs new App
semantics rather than preserving the original received execution evidence.


#### Step Execution Card - apply - registered union target binding

Owner: Design operation adapter, apply step; existing registered schema admission
and identity reference contracts. Input: registered action schema, supplied
arguments, explicit target reference. Output: one unambiguous applicable target
path, followed by unchanged complete argument validation. Boundary:
local-operation-batch.ts and local-operation-tools.test.ts. Branches constrained
by supplied enum/const discriminators must participate exactly when compatible;
unknown or overlapping paths remain rejected. Test the real read_design_context
union before changing implementation, incompatible snapshot scope, nested paths,
conflicts and ambiguity. No identity lookup on structural rejection and no writes.


#### Step Execution Card - compose - current operation purpose

Owner: Design provider progress adapter and conversation projection. Existing
compose current-work contract and conversation execution phase contract. Registered
operation descriptions are scoped work intent; phase-only children inherit that
live intent. Record registered-operation provenance separately from public-authored
commentary. The visual-assessment owner emits its review scope before child model
entry and closes it in finally. Remove raw full-request seeding from both live and
replayed panel projections; model commentary establishes request-level purpose.
Boundary: local-ai-provider.ts, conversation.ts, ai-conversation-panel.tsx and
existing provider/conversation/presentation tests. Preserve message language,
sequence, closed-call tombstones, sibling restoration and lifecycle precedence.
Focused provider regression precedes production edits; no new label model.


#### Step Execution Card - apply - retained consumer lifetime

Owner: retained-design-context, context action and retained-fill-action; runtime-input
owns request cleanup around its existing transaction runner. Reference delivery
returns a consumer lease bound to the request signal; successful leased entries
cannot be evicted by sibling reads. Release on consumption, explicit release,
request settlement, abort or owner disposal. Leases do not override revision or
workspace validity. Capacity refusal precedes returning a reference and preserves
existing consumers. Ordinary pages remain evictable. A declarative query mapping
prepares all disjoint patches before the single canonical fill write, releasing
internal query leases as columns are consumed; no query/write streaming or callback
code. Formal pressure and stale-value regressions precede implementation.


#### Step Execution Card - prepare - immutable target subsets

Owner: request-local preparation session and target adapter. Retain a batch of
explicit artifact selectors once; return opaque targetSetId plus artifactId and
count, never expanded membership. Subsequent batch targets use that pair. Preserve
requested identity order and deduplication, artifact release/request lifetime,
complete selector admission and canonical existence/lock admission on use. Budget
all requested subsets before storing any; reject rather than evict live handles.
Boundary: design-preparation.ts, local-design-tools.ts, operation target schema,
AiDesignToolIds and their existing formal tests. No names substituted for IDs and
no claim that creation membership equals current children. Test 17,004 identities,
repeated consumption, defensive arrays, wrong artifact, conflicts and release.


#### Step Execution Card - apply - canonical append and bounded recovery

Owner: Scene Tree Group ordered membership, Workspace insertion and SceneTree
ordinary creation recovery; Core/Factory integration is the behavioral oracle.
Group owns one mutable canonical order and lazily materializes a cached immutable
array snapshot for public get/save. Canonical append uses count/insertion methods
without materializing that snapshot. Mutation invalidates the snapshot, while
previous returned arrays remain unchanged. Serialized children stays string[].
Ordinary pre-handoff recovery removes attempted IDs using insertion evidence;
accepted handoff remains Factory-owned. Independent cleanup is attempted even
when another cleanup fails, and uncertainty is reported rather than claiming a
successful rollback. Test actual Core growing batches, snapshot independence,
Undo/Redo, middle insertion, save/load, properties and failure injection. Existing
diagnostic phase/counter hooks observe work; no second transaction/cache owner.
Boundary extends the existing apply membership route to components/group.ts and
components/workspace.ts and their tests, as authorized by this plan's canonical
membership scope. No general rendering or unrelated transaction rewrite.


#### Step Execution Card - observe - synchronous canonical work

Use the existing diagnostic phase and counter subscriptions only around the
prepared action's synchronous Core creation callback. Aggregate by owner phase
with explicit inclusive timing semantics; never collect unrelated user work while
the action awaits the host. The existing transaction/yield timings remain separate.
Record these aggregates in the existing result timing receipt and Runtime payload.
Boundary: design-actions.ts and its permanent tests. Prove an emitted host-wait
sample is excluded, while every own slice is counted. No second trace recorder.


#### Step Execution Card - inspect - prepared recipe review

Owner: Design prepared review coordinator, using the existing preparation owner
for immutable source recipes and the current review owner for requirement/reference
state. Review a retained artifact or explicit named source parts without canvas
writes. A tool-free provider checks the actual recipe plus applicable reference
images; deterministic compilation findings remain authoritative. Bind reuse to
recipe, scope and current evidence, and recheck evidence after asynchronous review
and before applying an assessed artifact. Appearance remains unverified. Failed
assessments require source correction; absent review does not block ordinary edits.
Boundary: local-prepared-design-review.ts, its permanent tests, design-preparation,
local-design-tools/review/operation-tools/provider, constants and App prompt.
Executable cases: actual source rather than caller narrative, reuse, changed
source/reference invalidation, contradictory findings, no canvas writes, explicit
partial scope and unrendered appearance. No preview renderer or new dependency.


#### Step Execution Card - apply - failed recovery settlement

The direct Core fault injection proves a cleanup exception currently prevents
remaining membership/map cleanup. Complete independent cleanup attempts, preserving
the original cause plus failures. Shared transaction types own the neutral
MutationRecoveryError contract; Factory reports rollback-failed even with an empty
journal when a canonical owner reports that error. Design observes its own member
settlement and reports unknown rather than claiming rollback success. This is the
approved recovery-failure case, not a new rollback manager. Extend the existing
apply boundary only to the transaction type, Factory settlement, and Design runner
with their focused permanent regressions. No removal of persistence protection.


#### Bounded implementation self-review - 2026-10-11

The owner review verified canonical append work without old sibling copies,
independent read snapshots, partial publication recovery, failed-cleanup reporting,
Undo/Redo and persisted round trips. Query leases preserve accepted dependencies;
target sets and nested union paths feed one admitted plural mapping without
repeating identity arrays. The review found and corrected the multi-target region
precheck and a partial-review success incorrectly clearing a whole-recipe conflict.
Both have permanent failing-before-fix regressions.

Pre-drawing review is a tool-free assessment of the actual immutable recipe and
applicable retained images. It is not a rendered preview and does not certify
appearance. Identical recipe/evidence/scope reuses assessment. Evidence changes
invalidate application; scoped success preserves unresolved broader conflicts.
Canonical findings remain authoritative and final canvas review remains necessary.
The full public child snapshot is materialized lazily when read, not removed;
reads can still incur work and must be measured independently of canonical append.
ACID-related full-parent backups were replaced with attempted-membership recovery;
Factory settlement, Undo, persistence protections and shared-property ownership
remain. No general transaction machinery removal is justified by current evidence.

Validation uses focused Runtime, Core, Scene Tree, Design tool and UI-state tests,
production/server type checks, scoped lint and naming. A broad default App tsc
command also includes legacy test doubles and surfaced unrelated test typing;
the maintained production and AI-server configurations are the applicable gates.
No full local CI has run. The following recorded run must verify actual current
status, owner timing, reviewed recipe application and retained reference evidence.


#### Complete live acceptance result - 2026-10-11

Status: PARTIAL ACCEPTANCE - implementation is present, but the intended whole-flow
improvement is not achieved. Do not claim this revision complete or ready to push.
The user-authorized single complete run is finished; no additional live run or
full local CI was started. Source candidate 91d755f0-9286-4080-8504-71a96883d74e
passed the execution owner proof; the reviewed source contract was accepted.

Evidence: tmp/full-101-large-document-20261011/report.html, run.json,
application-analysis.json, final-assessments.json, target-repetition.json and
record-completeness.json. Primary request 99b74684-88c2-49e3-bba2-c575ee04545c;
whole-request record c91b45ca-45ca-492c-96de-007f8db25f34. UI completion 2269.476 s;
first visible canvas 244.600 s; final objects 46,763. Recording continued ten
seconds after completion and fit was performed on first content and completion.
Overall bounds did not change between them. The previous run completed in
1175.186 s with 81,981 objects; these are different generated workloads.

Observed improvements: 19 prepared applications consumed 77.333 s. Synchronous
canonical creation emitted zero old-membership snapshot items; 46,773 insertions
used incremental membership. Outcome classification retained native tool status
outside oversized summaries. New phase counters identify UI scene-tree projection
at 24.252 s within 36.227 s of synchronous creation; nested phases overlap.
Formal tests cover target unions/nested plural paths, leases, atomic mappings,
cleanup failures, continued edits, Undo/Redo and save/load. The live run did not
exercise retain_design_targets; do not present its unit proof as live evidence.

Failed objectives and bounded replanning inputs:

- Nineteen prepared-recipe assessments consumed 592.956 s, ten returned fail, and
  three independent final canvas assessments were still required. The new owner
  validates immutable recipe data but lacks the actual existing-canvas attachment
  context. Recipe review does not establish appearance or whole-composition fit.
  Review admission and evidence scope need revision before another implementation
  iteration; an extra model gate per artifact is not a demonstrated improvement.
- Child completion still restores stale authored parent purpose. Explicit phases
  distinguish mutation from processing, but tower/spire completion can restore
  bamboo wording. Model-authored wording and observed step identity must retain
  separate freshness rather than treating all retained text as current activity.
- A batch input still carries 2,324,430 bytes of expanded target keys. There are
  23 distinct target key-list groups and no identical repeated list in this run.
  Target-reference capability alone did not cause the producer to choose it.
  Revisit the producer-consumer handoff instead of merely expanding limits.
- The primary drawing record is complete with no primary ownership gap, but the
  browser whole-request record stops at 1827.215 s with open lifecycle/action
  spans: 69 of 70 retained records are complete. Delivery drops into a permanent
  failure state after a pending-byte overflow or two send failures, and the App
  HTTP adapter discards the specific rejection cause. The failed live batch was
  not retained, so the exact triggering condition is unproven. Recovery must
  preserve bounded durable evidence and explicit errors without blocking product
  work; do not claim a verified final persistence duration from the missing tail.
- Recording-only all-bounds probes consumed 82.103 s across 2,091 observations.
  This is measured harness work, not product idle time; it cannot be added to the
  owner total or mechanically subtracted as a speedup.

These findings require a bounded task iteration under the existing plan before
more production edits. Preserve the completed run and failed acceptance evidence;
do not hide the regression by reporting only the faster application receipts.


### User-authorized progress release - 2026-10-11

The user now authorizes pushing and merging the current implemented progress
before planning reusable tool compositions. This supersedes the earlier no-push
checkpoint, but does not convert partial live acceptance into full acceptance.
The release scope is the existing tracked implementation, permanent regression
tests, current contracts, and release metadata in this worktree. No new recipe
library implementation or unrelated cleanup belongs in this release.

Preserve the recorded regression and follow-up requirements above: pre-drawing
review admission, stale purpose restoration, producer adoption of target handles,
and incomplete browser record delivery. They remain explicit planning inputs
after merge. The new reusable-composition plan must consider these issues.

Integrate current main, run the relationship-map-selected local checks (not the
repository-wide full validation mode), review this bounded diff, and add package
release metadata. Failed applicable checks block push; failed or pending CI blocks
merge. Merge only the reviewed exact source head after applicable CI passes.
No additional live AI generation is needed for this release checkpoint.


#### Release verification correction - backend diagnostic composition

Owner: observe. The existing boundary test fails because the approved document
persistence recorder now bundles Runtime's recorder, payload writer, and record
sink. The source import rule already permits the two independent Runtime public
entries, but the older backend graph oracle still rejects every framework file.
Correct that inconsistent oracle using the actual tree-shaken dependency graph
of a permanent diagnostic-only entry fixture. The document backend may contain
only that diagnostic graph; the collaboration backend retains zero framework
modules. Existing public-entry isolation tests continue to reject other framework
execution owners. No production bundler or runtime behavior changes.

Evidence before correction: local validation
881a9804-6258-4321-b5cb-048d4a13e2d1, 5.log,
framework-runtime-boundary.test.mjs document-backend graph assertion.
This is a broken-oracle correction under the test-first rule, not relaxation of
Core, rendering, mutation, or dependency boundaries.


#### Release verification correction - current action and activity inputs

The full Design gate found two stale test inputs/oracles. Context reads now
forward cancellation to their read owner, so assert the exact same AbortSignal
as well as the query. The panel's purpose test must supply the current explicit
provider activity phase when expecting AI processing; an unphased running edit
event exercises the generic drawing label instead. Preserve all existing purpose
and failure assertions. Only formal test inputs change; no production behavior.
Evidence: local validation 6f626c77-a862-4cec-b4d1-5e1eadfc35a4, 5.log.


#### Release correction - one immutable preparation input

Owner: prepare. The current work-count regression detects two reads of template
vertices: construction reads caller input, then recipe retention clones that
input again. Freeze one detached input snapshot before compilation and use the
same snapshot for compilation and retained review. This also prevents an async
caller from changing the reviewed recipe while compilation yields. Preserve
all admission limits, findings, artifact ownership and cancellation. Extend the
existing permanent work-count regression to both sync and async session entry
points before changing production code. No new cache or changed drawing policy.


#### Progress release validation - 2026-10-11

All applicable local release checks pass on the integrated main source
`9f3c5b561866f0915d56b729a9e14698ea97bc40`. The supported local validation
runner selected 24 workspace owners, shared checks, four Asyra FieldScope profiles,
and Design E2E. Unchanged owner results were reused only after comparing exact
input fingerprints; corrected owner tests were rerun. Final evidence is
`tmp/local-validation/progress-release-e2e-final/result.json`, with
`sourceVerified: true` and the reused source evidence chain in its plan.

- Functional E2E: 392 executed, including five intentional negative cases;
  19 existing conditional skips; zero unexpected failures and zero flaky tests.
- Collaboration E2E: 14 executed. Rendering contracts: three executed.
- Nineteen Framework package archives, all four clean-consumer phases, and
  release records pass. No package publication is authorized or performed.
- The current execution-owner source candidate
  `e29488a8-2774-42bd-937d-9634837f5e8a` passes. Contract review has no semantic
  changes, blockers or evidence invalidation and is accepted.

Release verification also synchronized the generated Inspector catalog, the
Scene Tree insertion work-count oracle, and the current two-line activity E2E
oracle. A direct Utils regression now covers immutable recovery-failure evidence
and primary error identity. The activity oracle retains mobile/desktop coverage,
stale-completion rejection, stable history, wrapping and scrolling assertions.
These are direct validation corrections, not new feature scope.

The complete live run predates the final immutable preparation-input correction.
Its failed objectives above remain open; this progress release does not close
whole-flow acceptance or authorize reusable-tool composition implementation.
