# AI Runtime Invocation and Profiler

Status: implemented, locally verified and self-reviewed; ready for PR review.
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
