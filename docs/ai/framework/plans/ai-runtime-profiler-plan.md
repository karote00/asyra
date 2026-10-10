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
Design, the public documentation site, Office, Sim, Core and FieldScope before
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
`53693fda-a70d-4051-8ee6-e7ce2ed08073` retains unchanged App/Core/FieldScope
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
