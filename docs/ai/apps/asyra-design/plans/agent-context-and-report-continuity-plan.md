# Plan: Agent Context and Report Continuity

## Status and task boundary

Current task: [Single result delivery contract](#single-result-delivery-contract).
Parent task: [Complete conversation contract verification](#complete-conversation-contract-verification).
The earlier implementation and live observation remain recorded below; their
passing checks did not establish instruction consistency or complete workflow
correctness. Original report sessions remain open.

## Single result delivery contract

November 15, 2026. Status: completed. The previous whole-feature acceptance is
withdrawn: its test inventory was complete, but a successful test still required
the superseded public `response` selector. The native successor request in
`tmp/conversation-native-naZThS/request-2.json` proves the selector reached the
provider. Passing execution does not establish conformity to the current spec.

Task scope: current AI conversation registration, preparation/application,
composition, result delivery and retention, Knowledge, provider projections,
verification owners, their direct consumers/tests and normative documentation.
Discovery compares current spec clauses with registered input/output branches,
caller forwarding and test oracles. Search candidate classes are superseded result
selectors (`response`, `includeTargets`), retired tool aliases/correctability flags,
mandatory evidence/completion gates, interaction locks and acceptance rules that
protect those behaviors. Historical immutable evidence is not executable authority.
No renderer redesign, new dependency, compatibility path, 101, full repository test,
release operation, commit or push is included. Preserve strict input/result checks,
partial settlement, cancellation, independent retention and safe continuation.

1. Reopen the erroneous acceptance. Add independent spec-derived regressions at
   registration and the actual native successor boundary. Prove old selectors are
   currently admitted/advertised before changing production. Check the complete
   registered tool inventory for retired routes without treating valid domain data
   named `response` as a tool control.
2. Remove response formatting from prepared application and internal batch inputs;
   do not hide or rename it. Canonical application always acknowledges its created
   IDs and counts. Remove workflow `includeTargets`: source-key maps are available
   to bindings/retention without a second opt-in. Delivery alone selects model data.
   Preserve owner diagnostics until validated projection, including review scope
   and partial-application prefixes. No extra model or canonical lookup is needed.
3. Replace tests that protect superseded selectors with current behavior tests;
   retain their geometry, history, recovery and material assertions. Update callers,
   provider contracts, Knowledge if affected, Inspector and contradictory current
   clauses. Do not convert historical records into passing current fixtures.
4. Review each changed handoff and run focused tests, naming, lint and affected
   type checks. Then run `verify:conversation`, independently reconcile cases and
   inspect actual provider data/status plus remaining old-contract candidates.
   Record manual acceptance only after the source-bound feature evidence and this
   independent semantic review pass. A failed gate requires an in-scope correction
   and its focused proof before repeating whole-feature verification.

Owner execution card: execution Inspector `prepare`, `apply` and `compose` own
canonical data and ordinary validated dispatch; `settle` owns model projection.
The formal conversation flow's discovery/results/retention/instructions nodes own
the corresponding consumer evidence. Expected handoff is complete validated owner
data -> host binding/retention -> selected delivery -> native data plus outcome.
Only the existing result delivery owner selects public fields. Schema rejection
of removed controls must report not-started input failure and allow correction.
No aliases, fallback defaults for old arguments, new state store or mandatory
planning/review flow is introduced. Existing identifiers retain their meanings.

Implementation review: the four spec-derived regressions failed before production
changes, including the actual native successor request. Application and internal
batch no longer accept response; workflow no longer accepts includeTargets or emits
the obsolete receiptScope label. Canonical application supplies acknowledged IDs,
counts and maps. Workflow exposes source maps once in createdTargets and preserves
owner-reported counts instead of reconstructing them. Delivery and retention remain
independent. Historical recording inputs are used only for their authoring data;
the maintained test requests explicitly construct current arguments.

Removed verification behavior: the saved compact-receipt test disabled result
validation and asserted missing identity data. Its stale output-format oracle was
removed, while actual owner diagnostics, images, creation/history and cross-turn
identity tests remain. Positive full/compact variants are replaced by current
canonical-result checks and explicit rejection tests. The previous acceptance of
multiple result-selector layers is withdrawn at its original plan/report locations.
Focused checks and the whole-feature source-bound verification are required before
closing this task. No historical evidence is relabeled as current proof.

Whole-feature iteration: `tmp/conversation-proof-VqGZx6` caught three failed
assertions in two files. Two Host projection cases supplied an incomplete simulated
application receipt and relied on workflow count reconstruction; their canonical
fixtures now acknowledge counts and source maps explicitly. Mechanical closure
still required deleting coveredMeasurementTargets; its oracle now requires the
actual covered descendant IDs, while preserving reconciliation and work-count
assertions. The runner's ten findings describe these three failures, not ten bugs.
The run was stopped before broader expensive gates; it is failed evidence and
cannot support acceptance. Focused owner checks precede the replacement whole run.

Native delivery iteration: `tmp/conversation-proof-6uRRMI` passed all server,
App, Runtime and Node groups but failed one real-browser native receipt oracle.
The App emitted 86,617 characters of partial-work data and a separate 514-character
outcome. Native history retained a 48,023-character fragment and replaced the
outcome with an omission marker. This is a production handoff defect, not an old
test. Keep the exact native-content equality assertion and its prefix/history/
reload checks unchanged.

Revised owner step: native provider settlement/configuration must not apply a
second implicit result selector after App delivery. The supported native
`tool_output_token_limit` is applied to history storage (Codex rust-v0.160.0,
`core/src/context_manager/history.rs`, `record_item_with_metadata`). Configure it
at process and thread creation to the largest exactly representable JSON integer,
so it does not truncate App-selected data or the independent outcome. This is
not a larger model context window: native context management, App input/output
validation and existing information paging remain unchanged. Do not shrink test
requests, switch them to status-only, suppress IDs, add paging to write recovery,
or alter the provider fixture to manufacture complete output.

Primary reference: <a href="https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/core/src/context_manager/history.rs" target="_blank" rel="noopener noreferrer">Codex native history output handling</a>.

Before production changes, add a permanent actual-native test for a large explicitly
selected saved value and prove its data/outcome equality fails. Then update the
shared native configuration owner, provider spec and matching Inspector settlement
condition. Scope is the provider owner and its direct native/browser tests, not
new tool semantics. Focused native and the original failing browser oracle must
pass before another complete feature run. Self-review confirms this follows the
single-delivery requirement and preserves recoverable partial work and reporting.

Native iteration evidence: `tmp/response-native-red.log` proves the new actual
native saved-value oracle failed on exact successor content before configuration
changed. `tmp/response-native-focused.log` passed 326 focused cases (one guarded
case is enabled by the whole runner). `tmp/response-native-browser-result.json`
records exit 0 for the unchanged recorded-prefix browser oracle. The original
86 KB partial receipt, independent outcome, repair, history and durable reload
are now preserved through the actual native process. Eleven Inspector/selection
contract tests, server type checking and naming also pass. The complete feature
run must be repeated because provider source changed; previous passing groups
are not substituted for current-source evidence.

Completion: `tmp/conversation-proof-nIjeLI` passes all 6,705 independently
collected cases across 352 files: server 3,705; App 1,487; Runtime 524; Node 654;
browser 335. There are no missing, extra, skipped, failed or flaky cases, and
source/compiled/definition snapshots match. The independent clause review is
updated in `../reports/conversation-spec-coverage-review-2026-11-14.md`; formal
manual acceptance is recorded separately from the immutable successful execution
summary. All four task steps and both bounded correction iterations are complete.
No superseded argument, hidden response mode, old positive oracle or compatibility
route was restored. No 101, full repository test, release, commit or push ran.

## Endpoint interaction evidence reconciliation

November 15, 2026. Endpoint reconciliation completed; broader semantic acceptance
was subsequently withdrawn by Single result delivery contract above.

Replace the remaining high-detail benchmark's superseded interaction contract and
complete independent conversation acceptance. The benchmark owns fixed-work creation,
navigation, live tool switching and two-actor convergence. The existing streamed
conversation browser case owns independent user creation/Undo while AI waits,
followed by AI cancellation, retained members and grouped Undo/Redo. Do not inject
destructive no-target commands into the creation benchmark or claim event prevention
proves a document lock. Shortcut handlers legitimately prevent browser defaults.

The report producer and authenticated resource guard must preserve the same bounded
interaction evidence. Current guard sanitization drops the nested `localInteraction`
object entirely. Required endpoint evidence must reject missing, contradictory and
old lock-based input, rather than accepting it through an optional legacy branch.
Other proof kinds keep their own contracts. Immutable historical evidence stays
unchanged and is not accepted as current proof.

Scope: endpoint E2E scenario/probes, report admission and direct tests, referenced
Inspector acceptance/BDD/spec clauses, this plan and the current review report.
Discovery is fixed to those consumers and their existing transaction/interaction
owners. No product locking/runtime changes, geometry reduction, altered CPU/time
budgets, new dependencies, compatibility, full repository test, 101 or remote action.

1. Prove report loss/old-input acceptance and the stale scenario with permanent
   negative tests before repair. Define current tool-switch observations with
   real active-turn and partial-canonical-progress evidence, and retain loading,
   navigation, milestone and completion data through the guard's report boundary.
2. Replace the obsolete probe/commands/report fields. Observe keyboard activation,
   return to selection, then pointer activation during actual creation. Preserve
   fixed 7,076-element work, unchanged deadlines and ordinary history/publication
   assertions. No empty Delete or Undo event is an independent-edit proof.
3. Reconcile direct source-contract tests and Inspector assertions. Run focused
   guard/contract tests, the real streamed user-edit/Undo browser case, and existing
   transaction tests. Build the current endpoint artifact and run its formal guarded
   creation benchmark; failures remain failures and cannot relax resource guards.
4. Review the changed handoff, run full conversation feature verification on the
   final source, then record manual acceptance only if all current obligations pass.

Owner card: `evaluate-endpoint-performance` consumes actual browser observations
from `stage-local-interactive-composition`; the guard admits/preserves bounded
evidence and never changes product input policy. `duringCreation` is a new current
report field owned by the endpoint test; remove `blockedActionAttempts` and its
unsupported conclusions without aliases. Input remains authenticated and bounded.
Regression oracles include missing evidence, an old report, zero/complete progress,
inactive tools, settled turns and preservation through final report publication.
The companion functional case proves canonical effects and history separation.

Focused review also exposed existing type gaps when the endpoint file was added to
the maintained conversation typecheck: its prepared-response interceptor must emit
plain JSON bounds, a decreasing item counter is numeric rather than a closed input
union, and endpoint DTOs must describe current receiver convergence summaries and
browser options. Correct those direct producer/consumer declarations without type
assertions or runtime relaxation. Preserve the receiver's bounded summary rather
than restoring the retired full-tree read. The same source review found a remaining
turn-wide transaction invariant and guarded-interaction BDD sentence; replace them
with finite-member/current-interaction semantics and permanent negative checks.

Endpoint checkpoint: current guarded production proof passed with 7,076 elements,
Actor A completion 10,028 ms and Actor B convergence 15,031 ms under unchanged
resource/time budgets (`tmp/endpoint-current-proof.log`). Live keyboard/pointer
activation and complete preserved report evidence passed. The independent streamed
user-edit/Undo/Stop browser case also passed. The focused guard/scenario/Inspector,
transaction and interceptor suites passed. Final closure is recorded by `tmp/conversation-proof-MCCmiU`: 6,707 cases
passed with exact independent case reconciliation and unchanged source/compiled/
definition snapshots; the subsequent formal manual observation accepts the reviewed
current contract and the Flow is `done`. It is not inferred from the endpoint result. See the current specification review report for evidence limits.

Bounded gate iteration: `tmp/conversation-proof-VcruD7` reported one Server
case failure at 5,134 ms; the focused 24-case file passed, with that case taking
4,760 ms against the unchanged default 5-second guard. The raw JSON contains a
runner stack without a specific assertion message, so it does not prove a product
contract defect. The case combines independent 10,000-tool catalog growth and
real owner execution/recovery obligations. Split those into independently named
formal cases with the same current host setup, data volume and assertions; use distinct current case identities and retain the default timeout. This bounded
extension touches only that blocking test and current documentation. No product
optimization, smaller inventory, retry acceptance or timeout increase. The first
whole run remains failed/interrupted evidence; rerun the final-source whole gate.

Final manual-review iteration: `tmp/conversation-proof-ocKNuU` passed 6,707 cases
with unchanged sources, but manual inspection found two more conditions in the
same endpoint Inspector that still required blocked-input and Delete/Undo lock
probes at progress milestones. The source-contract test preserved those conditions,
so passing automation cannot accept this state. Strengthen the negative owner test
first, replace both current condition strings and their positive assertions with
the actual pan/zoom/keyboard/pointer sequence, and regenerate the workspace. Review
every input-lock/transaction occurrence in the affected Inspector and its tests,
distinguishing atomic History execution from request-wide AI waits. Historical
measurements remain immutable; no current test may require historical locking.
Rerun focused authority checks and whole-feature verification on the final source.
This iteration changes no product or endpoint execution code and keeps all bounds.

Final acceptance: focused endpoint contract tests passed (131), transaction/input
tests passed (13), prepared-response tests passed (7), split host usage tests passed
(25), the independent streamed browser scenario passed, and guarded high-detail
production execution passed. The final whole-feature run selected 352 files and
passed Server 3,705, App 1,489, Runtime 524, Node 654 and Browser 335 cases with no
missing, extra, skipped, failed or flaky cases. Naming, scoped lint, fixture types
and diff checks passed. All tracked processes settled. The automatic command exited
2 while the separate manual criterion was stale; its immutable summary is preserved.
`manual-review.json` records later acceptance through the formal Flow store, with
all 12 owner nodes and integration `done`. No 101 or full repository gate ran.

## Independent case completeness and specification reconciliation

November 14, 2026. Status: scoped specification and verifier changes implemented;
complete selected feature execution passed; independent coverage acceptance rejected
for the remaining endpoint benchmark consumer conflict recorded below.

**Bounded task contract.** Reconcile conflicting current conversation specifications
and independently compare collected case identities with executed case identities.
The confirmed counterexample deletes one assertion from a nonempty file and adjusts
its totals: the old completeness checker accepts it. This does not establish that
the previous 6,649-case execution actually omitted a case. Preserve inherited work.
Allowed edits are this plan, current conversation specifications, the existing
verification/report owners and their permanent tests. No product behavior change,
compatibility path, relaxed validation, 101 run, full-local gate or remote operation.
Discovery remains the six product authorities listed in the parent plan, their
current implementation/test consumers, Knowledge and actual provider transport.

1. Reconcile active clauses: tool failure versus conversation control, uncertain
   mutation settlement versus unsafe replay, optional review versus mandatory
   completion, current discovery/delivery and request versus conversation storage.
   Delete obsolete requirements at their owner; do not add a superseding appendix.
2. Test-first the omitted-case counterexample at the formal report owner. Require
   an independent case inventory in addition to the independently selected files.
   Use runner collection before execution: structured Vitest Node API and Playwright list; Node
   has no nonexecuting collection API, so a separately recorded Node run collects
   declaration events, including dynamic subtests. Its execution cost is explicit.
   Never derive expected cases from the execution report being assessed. Collection
   failures, duplicates, missing/extra cases and changed source cannot certify a run.
3. Wire each producer through the same completeness boundary, preserve formal
   normalization/publication, and test real collectors plus omission corruption.
   Required spec cases remain independent from the runner inventory; collection
   completeness is not semantic coverage. No successful report auto-accepts review.
4. Finish the manual clause review of conversation request, instructions, discovery,
   Knowledge, admission, composition, canonical execution, result projection,
   retention, media, lifecycle and evidence. Record concrete evidence and limits;
   distinguish a native same-turn correction from HTTP's single-batch boundary.

**Step execution card - observe.** Owner: formal runner completeness and its App
orchestrator. Inputs: independently selected files, pre-execution declarations,
source identity and later runner observations. Output: exact identity reconciliation
and formal diagnostics; it cannot decide tool execution or model continuation.
Allowed contributors: native runner collection, existing normalizers and capture /
publication owners. Forbidden: deriving expectations from the assessed report,
accepting counts in place of identities, source drift, or changing product status.
Internal names belong to the Flow Inspector report/collection owner, not App tool
identities. Artifacts are current-run evidence; no old-format acceptance is added.

Gates: naming baseline; failing then passing report/collector regressions; focused
scope and real-runner integration tests; touched-file lint/format and diff review.
Manual review is separate from automated results and cannot infer whole-flow proof
from counts. Preserve strict assertion failure/cancellation guards. Stop closure
if a required clause has contradictory authority or lacks adequate evidence.

Self-review before edits: a second declaration collection detects later omitted
results but cannot prove all required behavior was authored as tests. The manual
specification comparison remains necessary. Node collection must not hide execution
or mistake a skipped suite for complete nested registration. Existing source and
process guards apply to both collection and execution.

**Bounded iteration after the whole-feature run.** The 3,704 Server assertions
passed, but the new collector incorrectly treated Vitest CLI display names as
execution identities. Nested suites use different separators in CLI list and JSON
results. Replace that lossy collection input with the public structured Node API;
walk suite parents and preserve literal separators inside authored names. Add a
real nested/parameterized runner regression before implementation. Do not rewrite
observed report names or accept both representations. Keep full mismatch evidence
in the run artifact and publish its location plus count rather than repeating a
large issue list into every Flow criterion. The interrupted publication must remain
incomplete until fresh, source-bound execution succeeds.

The subsequent manual scheduling review found two remaining Design Preparation
clauses and one Local Provider clause promising implicit measurement during deferred
or immediate capture. `finishInspection` and the permanent review-free operations
cases prove the current separation: capture does not invoke mechanical review, and
deferral performs no follow-up read. Run `TqlFoN` was interrupted before document
edits. Correct these owner clauses, inspect all related scheduling statements and
run the existing focused owner cases before restarting the whole feature gate.
Do not change production behavior to satisfy the superseded prose. The same review
also reconciles the removed reference correctability flag, eager-name projection,
unsupported one-sentence answer/structure-first instructions, and the separation
between native acknowledgement and owner data. These are documentation corrections
to current formal behavior, not new model restrictions.

**Authority reconciliation extension within this task.** Conversation Experience
still links the conversation-lifecycle step of the performance Inspector. That
active secondary authority retained mandatory deferred-detail/measurement gates,
obsolete source limits, turn-wide rollback and an interaction lock across waits.
The current execution Inspector, transaction owner and formal behavior tests have
already superseded those requirements. Reconcile the secondary Inspector, its
referenced current contract paragraphs and BDD clauses; preserve historical run
records and unrelated performance/CRDT contracts. Include both active Inspector
contract suites in feature selection. This is contract/test synchronization, not a
new runtime or performance optimization.

**Step execution card - request/apply/inspect/settle contract projections.** Inputs:
current execution Inspector, App transaction/actions, capture owner and conversation
spec. Outputs: matching secondary flow contracts, BDD and permanent authority
regressions. Allowed edits: the two referenced performance contract/test files,
current normative paragraphs of their authority plan, BDD, feature selection and
this report. No canonical algorithm, transport, timing budget, historical result or
7076 benchmark change. First prove the obsolete contract assertions fail, then
verify the existing production behavior tests and revised contract suites. No
contract may reinstate task-wide stop, rollback or compulsory review.

Manual review additionally found the guarded 7,076-element endpoint benchmark still
asserts turn-wide blocked interactions and publishes `blockedActionAttempts`.
This is an unresolved test-consumer conflict, outside the contract-only extension's
benchmark mutation boundary. Do not silently drop the case, restore a product lock
or mark the manual coverage criterion accepted. The remaining bounded correction
must update the interaction scenario and report consumers while retaining fixed
creation/collaboration work, independent user history and formal performance guards.
The conversation feature result and this unexecuted benchmark must be reported
separately.

Final execution: `tmp/conversation-proof-7HhRka` reconciled 6,696 collected and
executed cases across 352 files, with zero failed/skipped cases or reconciliation
issues. Source, compiled-export and Flow-definition snapshots are identical before
and after execution. Focused verifier/authority tests passed 91 cases; current
transaction/interaction tests passed 13. Naming, touched-code lint and scoped diff
checks passed. The automated run's exit code 2 means manual acceptance was still
missing, not a failed automated case. The subsequent formal manual observation
rejects `spec-coverage-review` with the endpoint conflict; it is not auto-accepted
from these counts. No 101, full-local test, commit or push was performed.

## Recoverable execution and meaningful tool handoffs

November 14, 2026. Status: approved implementation and complete automated feature
verification finished; parent independent spec-coverage acceptance remains open.
See the [implementation and verification report](../reports/conversation-recoverable-handoffs-2026-11-14.md).
This approved task replaces
failure allowlists and schema-identity assumptions in the earlier acceptance work.
Preserve inherited work in `codex/ai-conversation-improvements`.

**Task contract.** Correct the common-API -> action -> Runtime -> Host -> native
provider boundary, including Knowledge, composed calls, retained results and the
evaluation controller. A tool failure is a tool result, not a decision to terminate
the conversation. Outputs must describe their actual meaningful values so consumers
can select and construct valid inputs; identical producer/consumer schemas are not
required. Keep strict admission/output validation, actual settlement, successful
prefixes, permission checks, transaction ownership and no automatic write replay.
Unknown settlement requires observation before repeating mutation, not termination
before the model can respond. No compatibility routes, dependency upgrades, release
work, 101 run or repository-wide test gate are authorized.

Discovery is fixed to the audited call chain, common-API read/error producers,
shared schema traversal/projection, their direct consumers, current Knowledge
contracts, evaluation orchestration and the existing conversation verifier. No
new mandatory planning, evidence or correction-permission workflow is introduced.

1. **Separate task control from tool results (compose/observe).** Remove the
   recursive correctable-input allowlist and automatic tool-failure interruption
   from both App and native events. Keep explicit cancellation, operator stop and
   work deadlines. Test an armed recorder through the real native provider: failed
   read/save, semantic rejection and mechanical decision handoff must reach the
   same model turn; correction must preserve acknowledged work. Remove obsolete
   strict-stop rules and expectations rather than keeping an alternate policy.
2. **Preserve semantic input diagnoses (apply/settle).** Inventory common-API
   semantic rejection paths, use the owning typed input error contract, and carry
   field/target details and real settlement through Runtime, browser and Host.
   Prove aligned-fill rejection before mutation and correction through the real
   owner. Unexpected errors remain execution failures, not guessed input errors.
3. **Publish meaningful result shapes (compose/apply).** Audit the 90 read
   contracts (89 currently omit a value schema), derive stable outputs from their
   real owners and expose them in provider contracts. In particular, fill targets
   must feed removal after field selection. Preserve honestly dynamic values and
   require explicit mapping/construction when shapes differ. No verifier widening.
4. **Preserve schema meaning across adapters (compose/request).** Fix root-relative
   references during native nonempty-object projection, references through arrays
   in target binding, and legal root references in portable retention/projection.
   Test equivalent inline/referenced forms plus malformed/illegal controls. Retain
   full canonical results independently from selected delivery and portable saved
   values. Remove conflicting Knowledge review-obligation text and obsolete tests.
5. **Verify complete recovery and handoff (observe).** Exercise actual registered
   contracts and native replies for direct, composed, retained and cross-turn use,
   including Knowledge. Keep assertion failures fatal to verification; only live
   task continuation changes. Run the whole `verify:conversation` feature gate
   after focused tests and independently review spec coverage and source identity.

Each stage adds permanent failing regressions before production edits, reviews its
Inspector owner boundary and direct consumers, then runs focused tests. Source and
verification artifacts remain separate: passing scripted native tests proves
transport/contract behavior, not autonomous model reasoning or universal success.

Evidence: the actual native `read_design_contracts` response in
`tmp/conversation-native-IkLCsF/request-3.json` exposes `value: true` for fill targets.
Real Host admission rejects its binding to removal before dispatch. Real fill-owner
execution throws an untyped aligned-patch error. The evaluation classifier stops
storage/execution/unknown-tool failures regardless of a useful receipt. Native
nonempty projection breaks `#/properties/count`; target traversal misses array
segments; retention rejects legal `#`. Previous focused greens did not exercise
these combined boundaries. Historical run artifacts are not rewritten.

**Step 1 execution card.** Owner: compose/observe native task control. Inputs are
validated tool replies and explicit recorder controls; output is unchanged owner
reply plus continuing native work, or explicit deadline/operator termination.
Allowed edits: evaluation-control, local-ai-provider, drawing runner controls,
their tests, active specs and existing Inspector conditions. Runtime result
validation, operation execution and write replay are forbidden responsibilities
for this controller. No cache or persisted alias is added. Test control fields
are current-only; retired strict failure-policy fields are removed.

Self-review: treating a failed receipt as success would conceal a defect; retaining
its failure status while letting the model respond does not. Opaque output is not
proof that data is missing; declare real structure or test a reasonable mapping.
Do not replace whole-flow proof with the original counterexamples alone.

Stage 1 review: the actual native storage regression first interrupted the drawing
turn (`tmp/conversation-recovery-native-red.log`, native `turn/interrupt` evidence).
It now retains failed/completed storage status, prepares once, retries storage in
the original work turn and proceeds to reporting without interruption. Three
native/control tests, 19 provider recovery/control cases, 236 affected consumer
cases (two new assertions corrected to the current completed-read and unknown-
exception settlement contracts), and 12 targeted audit cases pass. The broad audit
invocation was stopped and replaced by named owner cases; its full catalog remains
in the final feature gate. Removed classifier-only assertions are not replaced by
a no-op classifier. Canonical output validation and no-replay assertions remain.
Explicit operator control and disposal still have permanent regressions.

**Step 2 execution card.** Owner: App common-API semantic input admission and action
error adaptation (apply/settle). Introduce an App-owned `CommonApiInputError` for
explicit invalid fields/target choices, with a message and JSON-safe field/target
details. It is not a correction permission or settlement authority. Adapt it to the
existing Runtime `AiActionInputError`; transaction settlement remains Runtime-owned.
Keep unexpected owner/topology/transport errors distinct. Test the real fill-owner
alignment rejection and wrapper before edits, then Runtime/browser/native handoff.
No cache, aliases or alternative execution path is introduced. Allowed files are
common-API semantic checks, the action adapter and direct error receipt consumers,
formal regressions and their existing spec/Inspector boundaries.

Stage 2 review: the real aligned-fill owner regression failed before adaptation
(`tmp/conversation-semantic-input-red.log`). The same canonical Core -> Runtime ->
native test then exposed a second upstream mismatch: Host projected a nested batch
failure as another complete invocation result. The owner now receives its whole
failure envelope for projection; `inputIssue` survives without a fabricated delivery
failure. Actual correction updates the same elements without replaying grouping.
The 83 common-API/action tests and 175 Host/projection/recovery tests pass. Existing
vector topology/invariant and disposed-resource failures are not reclassified;
prescribed-position preflight already owns its explicit input contract. Details
remain diagnostic, never permission or settlement flags.

**Step 3 execution card.** Owner: registered common-API output declarations
(compose/apply). Audit every read signature and real result, reuse authoritative
schemas for IDs, coordinates and target records, and publish stable bindable
structure. Dynamic property values must remain explicitly opaque rather than
inventing guarantees. Add a real fill-target -> removal composition regression and
provider contract checks, including null/missing and malformed output controls.
Allowed edits: basic API contracts/results and their direct contract consumers and
regressions. No generic assignability weakening, implicit conversion or recompute
is allowed. Full values remain internal until caller-selected delivery.

Step 3 browser finding: the first catalog run caught an accidentally removed
registration export; restore the existing export, not the fixture inventory oracle.
The next run passed 35 real reads, then rejected getCanvasBounds: DOMRect inherited
accessors disappear in JSON-value detachment. Declare enumerable value-field
projection at the common-API result adapter for DOMRect reads, preserving all eight
public rectangle fields and normal output validation. This is an explicit data
conversion, not a fallback or missing-field relaxation. Keep the browser failure
as RED evidence (`tmp/conversation-read-browser-2.log`) and cover malformed values.

Stage 3 review: all 90 registered reads now pass the real browser canonical-owner,
output-schema, repeat/no-write and cancellation checks. Optional JavaScript object
properties become JSON omission at the read adapter; required missing values and
wrong boolean types still reject. DOMRect fields are explicit. The actual native
successor receives bindable fill-target fields, and a real Core -> Runtime -> Host
composition removes those same fills without an intermediate model read. Stable
read revisions advance with their new declared value schema. Dynamic registered
property values remain honestly opaque. Evidence: conversation-read-browser-4,
conversation-read-native-2 and conversation-read-handoff-green logs in tmp.

**Step 4 execution card.** Owner: canonical schema reference scope and App
composition/retention adapters (compose/request). Equivalent inline, local root,
array-segment and escaped references must preserve admission, target binding,
public projection and lifetime classification. Test current failures first; use a
shared local pointer resolver for App consumers and the Runtime schema graph owner
for relocation. No external refs, invalid pointers, incompatible values or
request-owned saved capabilities become admitted. Update conflicting Knowledge
text and test every labeled JSON example through loaded document delivery. Allowed
edits are schema adapters, their owner helpers, Knowledge corpus, existing specs
and focused/formal handoff tests. No new task policy, schema fallback or cache.

Stage 4 review: permanent RED cases reproduced broken native root properties,
array-reference target binding, portable root recursion and leaked nested internal
fields. Runtime graph normalization preserves reference targets before native
branch relocation; App consumers share strict JSON Pointer resolution. The 224
adapter/operation tests and 41 Runtime contract tests pass. Root-reference lifetime
controls still reject ephemeral descendants and unknown/external/invalid pointers.
The Knowledge corpus now checks labeled JSON examples and rejects retired review
obligations; its current-owner test passes. An absent optional context reader is
handled before schema conversion, rather than admitting undefined as a schema.

**Step 5 execution card.** Owner: observe whole-feature verification with formal
production handoffs. Armed real native tests cover input correction, unavailable
Knowledge and storage retry, assert one work turn and no interrupt, and preserve
successful-prefix/no-replay evidence. Mechanical iteration handoff remains verified
through the formal Host/Runtime boundary, not a synthetic successful substitute.
Run the existing complete conversation verifier after scoped lint/types and focused
checks. Its process assertions remain fatal; model failures remain ordinary results.
Review inventory selection and immutable source identity independently from test
counts. No 101, live-model inference, repository-wide gate or new stop policy.

Final boundary review: the initial feature run exposed two fixture type errors
(an unsupported recordDirectory option); recordings now use the public environment
configuration, with actual native same-turn checks still passing. Updated remaining
active stop-on-executor-error prose. A new semantic-read counterexample proved the
input adapter was mutation-only; it now surrounds the common call, keeping both
read and mutation diagnostics. Nonfinite rejected indexes remain textual diagnostics,
never invalid JSON numbers. Read errors without transaction-host evidence keep
unknown settlement; the test must not invent rollback evidence merely because an
input diagnosis exists. The same AI receives that diagnosis and continues with a
corrected read. The error owner is CommonApiInputError, distinct from server-side
construction input errors. Evidence: conversation-input-finite-red and green-2,
conversation-native-public-options, and conversation-read-input-native logs.

Full Server gate review: 3,690/3,697 assertions passed; seven failures share two
obsolete fixture assumptions. Six mechanical iteration variants returned only
metadata id/type instead of the real Core metadata contract. Supply the canonical
name/parent/visibility/lock/child-count fields; keep repair, stuck, decision,
cancellation, partial and unconfirmed-output assertions unchanged. The prefix
projection fixture expected the owner to receive only executionResult; it now
requires the complete failure envelope and projects its own payload through the
production projection helper, preserving failure status, private-field exclusion
and exactly-once owner work. Independently authored required evidence still named
the old Knowledge test; replace that selector with input-repair and unavailable-
owner cases. Do not ignore a missing selector or mark the interrupted run passed.
The interrupted complete attempt is tmp/conversation-proof-JYQObg.

Closure review scope was revised before the final complete run: check every active
failure-control clause in the execution/conversation/provider specs against actual
scheduler, Runtime, Host and provider stop callers. Two introductory clauses still
made the retired evaluation allowlist authoritative even though later sections had
been corrected. Remove those clauses, distinguish request settlement from a failed
member, and preserve explicit cancellation/deadline/unusable-transport behavior.
No production stop policy is added. Freeze these sources before the final gate;
interrupted attempts are not completion evidence.

Final App gate finding: the real non-Core-owner integration reads an empty system
context before interaction properties are registered. The new snapshot schema
incorrectly made three preset-managed properties mandatory. The canonical snapshot
enumerates registered keys; it does not fabricate preset defaults. Keep known field
types when present, describe their registration-dependent presence, and reject
malformed present fields. Add an empty/partial/populated/invalid contract regression
and retain the original real Core integration assertions. This is a producer-contract
correction, not a validator exception or fixture default injection. The interrupted
run `tmp/conversation-proof-aFhEUH` passed all 3,697 Server cases and Runtime, but
failed this App assertion; it is not completion evidence.

Final browser finding and bounded replan: `tmp/conversation-proof-ywsF45` passed
all Server/App/Runtime/Node cases and 334/335 browser cases. The remaining native
permission rejection is a product handoff defect, not an obsolete failed/partial
assertion. After owner projection removes internal `checks.visitedResults`, Host
incorrectly validates the public failure against the canonical failure schema,
creating TOOL_DELIVERY_INVALID. Separately, request-wide permission rejection with
zero acknowledgements and explicit not-started settlement is misclassified as
unknown mutation scope because it has no individual action ID. Preserve the
original browser assertions. Add canonical/public failure counterexamples, validate
each view against its own derived contract with unchanged status/settlement checks,
and recognize the Runtime-owned whole-batch permission receipt before scope
reconciliation. Missing/contradictory acknowledgements and uncertain execution still
require observation. Owners remain compose/apply/settle; no new failure permission,
automatic replay, compatibility or weakened canonical validation is introduced.
Run focused owner and actual browser/native regressions, then repeat the complete
feature gate on one frozen source. The failed browser run remains historical proof.

Boundary replan review: the new canonical/public-view and permission-scope
counterexamples first failed. Seven targeted cases now pass, including malformed
public fields, missing canonical diagnostics, contradictory acknowledgements,
direct and registered delivery, and execution/permission uncertainty controls.
The four affected owner suites pass 344 cases; the original real browser/native
permission case passes unchanged failed/not-started assertions plus checks against
fabricated delivery failure and unknown scope. The public failure schema is derived
from the canonical declaration, not hand-maintained or relaxed. Canonical validation
still runs first. A test owner intended for registered composition now explicitly
declares its composition capability rather than bypassing control-plane admission.
Evidence: conversation-failure-view-red, conversation-failure-validation-red,
conversation-admission-scope-red, conversation-boundary-owner-suite and
conversation-permission-browser logs in tmp.

Final closure evidence: `tmp/conversation-proof-lQiTeK` passes 6,649 cases:
Server 3,704, App 1,489, Runtime 524, Node/Knowledge/verifier 597 and browser 335.
There are no failed or skipped cases and no flaky browser cases. All 64 independently
required handoffs are satisfied; all 45 tracked processes exited successfully.
The 2,180 source-file hashes, 2,443 compiled-file hashes and required definition are
identical before and after execution. `summary.json` reports executionStatus=passed
with no issues. The command exits 2 because the separate parent spec-coverage-review
criterion is still missing; it does not automatically accept that manual criterion.
Focused lint, naming, fixture types and diff checks pass. No 101, repository-wide
test gate, commit or push was performed. The broader manual acceptance is not
claimed complete from automated counts.

## Verified producer and consumer contract repairs

November 14, 2026. Status: bounded product repairs and complete automated feature
verification finished; independent spec-coverage acceptance remains unaccepted.
Work stays in `codex/ai-conversation-improvements`, preserving inherited changes.
See the [repair and verification report](../reports/conversation-contract-repairs-2026-11-14.md).
The baseline is the frozen `tmp/conversation-proof-dThnsW` run: 6,662 passes,
three failures, no skips. Its report remains immutable historical evidence.

**Bounded task.** Repair the three confirmed producer/consumer defects through
current App/native and canonical result contracts, their direct Runtime consumers,
formal tests, specs and existing Inspector mappings. Preserve direct, composed,
staged, retained and native delivery semantics, permissions, strict input/output
validation, acknowledged prefixes, no-replay recovery, history and collaboration.
Do not add compatibility routes, substitute literal IDs, make required fields
optional, add mandatory model workflow, upgrade tools/dependencies or alter the
verification verdict to hide failures. No 101 or repository-wide gate. Discovery
is limited to the three failing contract paths and their direct consumers; unrelated
findings remain separate. Existing failing formal tests are the initial RED evidence.

1. **Compose - native input declaration.** Trace the canonical selection schema
   through `nativeToolInputSchema`, native registration and actual successor model
   declarations. The SDK schema representation omits object property counts but
   supports exclusive/intersection alternatives. At the existing native adapter,
   express a nonempty object as its original constraints intersected with an
   exclusive choice between any object and an empty closed object. This is an
   equivalent current schema projection, not a second public input format or a
   relaxed validator. Preserve reference scope, union semantics and original owner
   schema immutability. Prove empty rejection, valid selections and malformed
   selectors at the actual SDK consumer, as well as local equivalence controls.
2. **Apply/settle - acknowledged partial output.** The application owner must emit
   the required timing snapshot on both complete and acknowledged-partial paths,
   measured from the same execution state. Inspect failed-operation timing and
   transaction settlement before sharing the snapshot implementation. Preserve
   retained member counts and explicit full/compact behavior; reject malformed
   results and never replay accepted work. Verify the real Core failure through
   Runtime/Host and actual native output, plus owner cancellation/partial regressions.
3. **Prepare/apply/inspect - document identity binding.** Reconcile the produced
   composition ID declaration with actual preparation/creation identity guarantees
   and review/capture inputs. Use the authoritative document-reference contract;
   resolve the mismatched length guarantee at its real producer/consumer owner,
   not by loosening Runtime assignability. Verify ordinary and partial outputs,
   saved/reused document references, and the original staged template/repair/capture
   sequence with previous-result bindings. Keep foreign/invalid references rejected.
4. **Whole conversation verification.** Review each completed owner slice before
   advancing. Run focused formal regressions, scoped lint, naming and type checks;
   then freeze source and run `node apps/asyra-design/scripts/verify-conversation.mjs`.
   Include Knowledge and actual native data/status, all required normal and deliberate
   fault cases, and independent scope/evidence admission. Do not equate selected green
   results with manual whole-feature acceptance. Report any remaining failed or
   unproven handoff without changing assertions to pass.

Step execution boundaries: `compose` owns App schema projection and registration
in `server/operation-input-schema.ts`, `local-design-sequence.ts` and
`local-ai-provider.ts`; `apply` owns `src/ai/design-actions.ts` and its canonical
preparation/transaction consumers; `inspect` owns `review-action.ts`,
`inspection-schema.ts` and document-reference declarations in `tool-contract.ts`.
Runtime schema/admission changes are permitted only if evidence locates a defect
there; its current rejection is not itself grounds to widen validation. Existing
AI execution and spec-derived verification flows retain their required criteria.
No new cache, tool name, persisted format or compatibility identity is planned.

Self-review before implementation: an adapter-only unit test cannot establish
native delivery, a complete receipt cannot establish a partial receipt, and a
literal existing target cannot establish a produced-ID staged binding. Retain all
three original failing consumer assertions and add boundary counterexamples before
changing behavior. Their semantic requirements remain unchanged.

Step 1 review: the strengthened actual native regression first failed on the
missing empty-selection restriction (`tmp/conversation-native-selection-red.json`).
Equivalent nonempty-object lowering then passed ten focused native/projection cases,
including real SDK instruction/schema fault controls, legal named selections,
malformed selectors, original-registry immutability and root-reference equivalence.
No alternate input form or validator relaxation was introduced. Current SDK source
corroborates the measured boundary: its
<a href="https://github.com/openai/codex/blob/main/codex-rs/tools/src/json_schema/types.rs" target="_blank" rel="noopener noreferrer">schema representation</a>
retains allOf/oneOf but does not declare minProperties. Installed-provider behavior,
not upstream main alone, is established by the actual request regression.

Step 2 review: three strengthened partial receipt/timing regressions failed before
implementation. The application now produces one shared terminal timing snapshot,
including failed callback and transaction settlement duration without counting
unacknowledged members. All 65 application/consumer/transaction cases pass, and the
original real Core -> Runtime/Host -> native partial receipt case passes without
TOOL_RESULT_INVALID or replay. Evidence: `tmp/conversation-partial-red.json`,
`tmp/conversation-partial-green.json`, `tmp/conversation-partial-native-green.json`.

Step 3 readiness: `prepared-design-admission.ts` already admits only nonempty
identities up to 256 characters (including the continuation anchor). The output
currently omits this existing bound and document lifetime. Expose the existing
identity-length limit at the prepared format owner and reuse it in admission/output;
do not weaken review's input bound or Runtime structural/lifetime assignability.

Step 3 direct-consumer review: after the output lifetime correction, the unchanged
real browser sequence reached a second rejection at the next part's `parentId`
binding. Both canonical application input and its model-facing artifact projection
still declared a plain string. Correct both declarations to the existing document
reference contract; retain current parent existence/capability/lock checks and
request-scoped artifact identity. The internal material member list comes from the
not-yet-applied prepared artifact, so it is not an existing document target and must
not be mechanically reclassified. Evidence:
`tmp/conversation-repair-staged-browser.json` and its stage receipts.

Step 3 scenario correction: once lifetime admission passed, the unchanged staged
fixture was correctly refused because it prepared an already-overflowing Frame.
The current specification requires resolving preparation findings before apply.
Keep that rejection and revise only the scenario setup: prepare a valid 140-pixel
Frame, apply it, then resize it to 100 through the real bound-ID native action.
The same child now overflows in canonical state. Require the real review to report
repairable, the declared repair to run, a second review to pass, the later retained
template part to attach, and capture/history/canonical assertions to remain true.
This preserves the mechanical-iteration proof instead of bypassing preparation or
injecting a passing verdict. The newly reachable rejection is recorded in
`tmp/conversation-repair-staged-browser-2.json`.

The next execution completed all owner work and exposed the fixture's omitted
`resolve_design_targets` receipt. Step-time region selection is a real required
consumer for the declared repair, not extra model interaction. The oracle now
requires that exact receipt and proves its selected ID equals the repaired
canonical child, while retaining repairable -> repair -> pass and native media
checks. Evidence: `tmp/conversation-repair-staged-browser-3.json`.

Step 3 review: both original identity defects and the downstream parent reference
now pass the real browser staged sequence (`tmp/conversation-repair-staged-browser-4.json`).
The sequence uses produced IDs, step-time region selection, real mechanical review
and repair, same-invocation retained template reuse, later application, actual native
image delivery and one Undo/Redo group. No literal target substitution or verdict
injection is used. The 192 focused application/preparation/created-target cases pass.
The two newly strengthened parent-reference tests first failed before correction
(`tmp/conversation-parent-reference-red.json`). Runtime assignability and canonical
admission remain unchanged. Full feature verification is the next separate gate;
these focused results do not establish whole-feature acceptance.

Step 4 execution and bounded replan: `tmp/conversation-proof-x2FJj8` completed
6,672 tests with no failures/skips and unchanged source, compiled exports and Flow
definitions. All 45 managed processes completed normally. Final evidence review
found a verifier handoff defect: server and App batches share the same Vitest
producer/cwd, but capture selected both batches while publication supplied only
one. The later App publication added missing-result warnings for already completed
server criteria. Every criterion had passing evidence, yet ten nodes were blocked;
the CLI's execution summary checked raw records but omitted that final automated
Flow state. The independent manual spec review is a separate unmet criterion.

Revised final step, owned by verification `evidence` and the shared publication
contract: scope each pre-execution receipt to that group's declared files through
the existing formal capture API. Keep missing/duplicate/stale record rejection;
do not use executed-only publication or delete warnings. Reject incomplete automated
Flow state in the final execution summary. Mutation is limited to the existing
conversation scope/CLI owner, their permanent tests and this plan/report. First
prove the cross-batch failure with real capture/publication and exact consumer
state, including genuinely missing results, then fix the caller and rerun the
complete frozen feature gate. Shared publication semantics remain unchanged.
This is an execution-scope correction, not a new verifier or synthetic dispatcher.

Publication repair review: the permanent regression first reproduced false missing
warnings from two real Vitest executions through formal capture/normalize/publish
(`tmp/conversation-publication-red.log`). After file-scoped capture, a second RED
proved the CLI summary still ignored formal missing-result warnings
(`tmp/conversation-publication-state-red.log`). The final caller consumes the
formal evaluator's unsatisfied automated criteria and unresolved warnings; manual
acceptance remains distinct. The regression also rejects genuinely absent,
duplicate and source-stale results, and proves current valid evidence resolves
only its own warning. Existing shared publication/admission code is unchanged.
The real test subprocesses use the shared managed process owner, not an alternate
dispatcher. The complete feature gate must run again on this final source.

Final review and execution: `tmp/conversation-proof-JnVY1o` passed all 6,673 tests
across the same 347 files: server 3,736, App 1,482, Runtime 523, shared Knowledge and
verification 597, browser 335. There were no failures, skips or browser retries.
All 45 managed top-level processes settled normally. Source, compiled exports and
Flow definitions are identical before/after execution. All twelve automated
handoff nodes are done, no publication warning remains, and the execution summary
has no issues. The Flow is `awaiting-manual`, with only `spec-coverage-review`
unaccepted; exit 2 preserves that distinction. It is not a failed automatic gate
or full semantic acceptance. No 101, live model or repository-wide gate ran.
Scoped lint, naming, App types, verification fixture types and the 32 publication
regressions passed. The final report distinguishes product repairs, corrected
scenario assumptions and the verifier's scope defect; none were hidden by dropping
assertions or relaxing validation. No commit or push was performed.

## Complete conversation contract verification

November 14, 2026. Status: verification method replacement in progress; deletion of the old
paths takes precedence over further replacement development. The previous passing executions and
[full-flow reviews](../reports/ai-conversation-full-flow-review-2026-11-13.md) remain
historical evidence, not acceptance of the complete conversation contract.
Current acceptance is defined by the spec-derived task below. Earlier registry
comparisons and positive cases remain bounded evidence; no earlier defect list
defines the scope of the replacement.

### Spec-derived conversation verification

November 14, 2026. Status: implementation authorized; authority reconciliation and
negative-control proofs in progress. This section replaces all earlier verification-method
execution plans below. Their results remain historical records, not active coverage
requirements or an alternate passing route.

**Objective and boundary.** Replace the existing conversation verification method,
not just its latest three counterexamples. Derive required behavior from current
product specifications before inspecting test coverage. Prove complete producer to
consumer handoffs, including the data and state received in the provider's actual
successor request. The authorized mutation boundary is verification orchestration, formal evidence
producers, production-path test fixtures, existing flow mappings and their current
specification/documentation consumers. Product behavior remains unchanged. Existing
dirty work is preserved. No live model, 101 or repository-wide gate runs. Completion
requires the focused negative controls followed by the entire conversation feature
gate; an intermediate green suite is not completion.

The recurring failure is an incomplete acceptance method: candidate discovery defines
its own expected scope, helpers recreate parts of execution, and selected passing
cases stand in for the complete contract. Prior corrections remain useful evidence
but cannot define the replacement's requirements. Native reply construction has not
changed since at least November 2; omissions and summary contradictions are not
established regressions of a previously complete verifier. The earlier continuation
migration did cause consumer failures, which the retained failed run records.

#### Authority and independent expectations

Product authorities are [conversation experience](../specs/ai-conversation-experience.md),
[execution flow](../specs/ai-execution-flow.md), [local provider](../specs/local-ai-provider.md),
[design preparation](../specs/design-preparation.md), the Runtime
[tool specification](../../../../../packages/ai-agent-runtime/TOOL_SPECIFICATION.md)
and [package contract](../../../framework/packages/ai-agent-runtime.md). Canonical
state, transactions, rendering and collaboration retain their existing owner contracts;
this work verifies the AI entry's handoffs into them, not a replacement implementation.

Use the existing AI execution Inspector's request/compose/prepare/apply/inspect/settle/
observe steps, the Runtime Inspector's request/validation/permission/execution/cleanup
routes, and the conversational drawing Inspector's browser/canonical publication
boundaries. Read their exact inputs, outputs, conditions, bypasses, contributors,
implementation boundaries and failure owners before mapping cases. The existing
App and Runtime flow-contract manifests associate evidence with these authorities;
they are implementations to audit, not sources from which to invent requirements.
No additional approval ledger, score or competing contract registry is introduced.

Three independent inputs must remain separate:

1. **Required behavior:** the specification clauses and applicable product cases
   below, reviewed before test selection. Each assertion states an observable input,
   producer, consumer, state transition, forbidden effect and failure owner. Expected
   values come from independently authored domain examples and the specification,
   not the production schema/projection helper being tested.
2. **Actual capability:** declarations and instructions emitted by the real App
   composition, with/without drawing and inspection, normal/assessment requests,
   HTTP/local provider, and durable-library availability. Qualified identity/revision,
   permissions and conditional capabilities are observations to compare, not permission
   to silently remove a required capability from expectations. Unsupported routes have
   explicit rejection assertions rather than skipped coverage. New identities require
   an owner/case association; fixed counts such as 206 or 208 prove nothing.
3. **Executed evidence:** test-runner events, actual boundary records, consumer inputs
   and resulting canonical state on the captured source. The execution selector cannot
   supply the expected inventory to its own completeness check. A producer cannot mark
   an obligation inapplicable because it failed to discover or execute its test.

Conflicting active clauses block the affected expectation until resolved at their
semantic owner; never accept both old and new behavior. One already identified example
is the Runtime tool-spec introduction naming describe_design_apis while current App
specs require separate search_design_tools/read_design_contracts. The authority pass distinguishes generic Runtime capabilities from Design's public
route and removes the stale App reference at the Runtime specification owner.

#### Required whole-conversation handoffs

These obligations are derived from the linked specs, independently of the current
runner's folders and test list. Each row requires success, invalid input, downstream
failure and relevant interruption/isolation observations; absence is unverified.
A requirement within a cited section cannot be omitted merely because no current test
exists. UI behavior is covered through its real controller/presentation and browser
consumer; mocked rendering cannot certify actual pixels.
The clause-to-case association is a semantic review, not automatic proof from parsed
headings or manifest membership. Capture the specifications and reviewed case mapping
with execution evidence; changed or unmapped clauses require renewed review instead
of inheriting a passing verdict. The verifier cannot certify its own mapping.

| Handoff and authority                                                                                                                                                                                                                                                                                                          | Required observation and failure boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft, attachments, history and clarification -> submitted request. Conversation experience: Product contract, Conversation navigation, General design target continuity. Inspector: request.                                                                                                                                  | Preserve exact intent, source association, choices and per-conversation drafts; async reads cannot cross draft generations or document disposal. Refresh targets and permissions, reject invalid context before execution, isolate stale/duplicate events, and preserve panel focus/navigation and activity identity.                                                                                                                                                                                                                                                                                                   |
| App context, instructions and capabilities -> provider request. Local provider: Supported behavior, Conversation request continuity, Native example and target publication. Inspector: request/compose; Runtime provider/permission routes.                                                                                    | Observe actual HTTP request or native thread/start/turn input, including assembled prompt, original images, coordinate/reference meanings, enabled tools and valid published examples. Missing configuration fails before inference; local endpoint restrictions remain. A saved historical receipt grants no new permission. Do not add mandatory Knowledge, planning or completion gates.                                                                                                                                                                                                                             |
| Purpose/field search -> exact selected contract -> invocation. Execution flow: Discovery responsibility boundary, Unified public tool contract delivery, Provider-visible handoff contracts. Inspector: compose.                                                                                                               | Independently check applicability and candidate boundaries, qualified identities/revisions, per-name scopes, full restrictions and every continuation. Execute the delivered example against its real owner. Names alone, registration counts and successful schema generation do not prove callable behavior. No result from a search is silently treated as an acquired contract.                                                                                                                                                                                                                                     |
| Knowledge source -> admitted catalog -> resolved advice -> Host -> actual provider successor input. Local provider: Advisory knowledge tools; Runtime: Optional knowledge access. Inspector: compose.                                                                                                                          | Include shared package and App documents, source/provenance, contexts, references, children, overrides and selected dependency order. Content is untrusted and grants no writes. Verify lazy load/reuse work counts, exact text and state, paging, compaction/rehydration, input versus execution failures, disposal and no document mutation. Validate the independent shared-source tests as well as Runtime, App and native consumers.                                                                                                                                                                               |
| Invocation -> selected admission, permission and resource ownership. Execution flow: Tool schema support boundary, Canonical input rejection. Inspector: compose; Runtime validation/permission routes.                                                                                                                        | Pin the current execution/model contracts before effects; validate complete inputs, semantic constraints and supported schema rules. Reject foreign/stale handles. Invalid input cannot borrow rejected resources but may publish admitted repair diagnostics. A correction continues through the same real provider route without weakening validation.                                                                                                                                                                                                                                                                |
| Decided dependencies -> direct/library/sequence/staged/iterative execution. Runtime tool specification: Execution variants; execution flow: Executable phase continuity, Staged continuation implementation contract. Inspector: compose/prepare/apply.                                                                        | Exercise applicable equivalent entry paths with real owners, previous-result and same-input bindings, named inputs and target resolution after earlier writes. Check iteration stop conditions, ready-stage application and scheduling work counts. A failed dependency cannot run its successor; preserve completed prefixes and never replay them on recovery. Persisted recipes revalidate dependency revisions and composition policy on load; request-only owners/handles cannot become durable recipes, and save-only recovery cannot rerun leaves. No hard-coded one-scenario recipe proves general composition. |
| Preparation and target selection -> browser admission -> canonical mutation. Design preparation: Provider handoff, Canonical execution, Signed projection and Group coordinates. Inspector: prepare/apply and canonical transaction/publication routes.                                                                        | Follow actual artifact/key/element identities, current hierarchy, world/local bases and resolved region targets through canonical dispatch. Verify no writes on invalid preparation, real results after partial execution, intended Undo/Redo, selection/order, and required collaboration/publication effects. Use general create/edit/group cases as well as recorded examples; synthetic IDs or an accepting mock cannot establish the handoff.                                                                                                                                                                      |
| Raw owner value/state -> validation -> internal binding -> model projection. Execution flow: Tool schema support boundary, Model-visible result contracts; Runtime: Common contract foundation. Inspector: compose/apply/settle.                                                                                               | Independently assert object/array/scalar/null and falsy values, selected success/partial/recovery alternatives, revisions and same-execution settlement. Invalid results never become successful bindings. Successful execution with failed storage, partial delivery, and failed output with acknowledged work remain distinct. Validate final rewrapped results without injecting Host fields into closed owner data.                                                                                                                                                                                                 |
| Retention and result selection -> App conversation store -> later stage/turn. Execution flow: Conversation result delivery; conversation experience: Evidence-based drawing completion. Inspector: request/compose/settle.                                                                                                     | Retain and delivery are independent. Verify status/default/selected/full delivery, named summaries, direct binding without model readback and unchanged stored values. Later turns use the real App result exchange; document/conversation isolation, changed targets and expired request resources remain enforced. An unused saved value is not a failure. No repeated computation or extra model round trip is required solely to transfer saved data.                                                                                                                                                               |
| Reference/capture ownership -> selected text/images -> provider media input. Execution flow: Selected output image delivery, Browser prefix and native acknowledgement boundary. Inspector: inspect/settle.                                                                                                                    | Preserve attribution, identity, requested region/basis, image order and all selected images through actual content conversion and native successor input. Explicit status-only delivery may omit images. Failed media delivery preserves known execution state and cannot repeat capture or mutation. Real-browser capture validates pixels; jsdom proves only the boundaries it actually executes.                                                                                                                                                                                                                     |
| Progress, cancellation, failure and report transition -> UI/evaluation/cleanup. Conversation experience: Activity provenance and delivery order; execution flow: Canonical input rejection and evaluation continuation, Provider instruction and evaluation continuity. Inspector: request/settle/observe and Runtime cleanup. | Preserve ordered call identities, waiting/clarification state, partial receipts and public error meanings. Progress failures do not abort work; recoverable input does not trigger strict evaluation stop. Independent execution/resource/delivery failures remain visible. Cancellation, report entry, context compaction, unlimited same-session reporting and retained-session follow-up are separate transitions; cleanup is attempted for every opened resource without replaying acknowledged work. Use scripted offline turns, not 101.                                                                          |
| Final result and evidence -> consumer-visible outcome. Local provider: Direct native tool delivery; execution flow: App instruction delivery evidence. Inspector: settle/observe.                                                                                                                                              | Observe the real outbound App reply and actual downstream request, preserving data, acknowledgement, media and provenance together. The AI retains final visual judgment; tool success is not aesthetic acceptance. HTTP and native routes each retain their declared semantics. Redacted diagnostics, source/build identity and failed evidence remain truthful; a completed report cannot turn an invalid drawing/test run into success.                                                                                                                                                                              |

The initial whole-chain cases are deliberately general tasks, not Taipei 101 or
copies of the latest failing inputs. They supplement, rather than replace, the
per-owner cases needed for all applicable registered capabilities:

- Submit a request with two attachments, switch drafts during asynchronous reading,
  clarify a choice, then submit a later turn. Observe the actual request's original
  text, source association, current targets and isolated saved values at the provider.
- Create two editable children under a transformed parent, then select a region,
  group/reparent, update one child and capture both overview and detail in one decided
  sequence. Independently authored world/local coordinate expectations, actual returned
  IDs, order, canonical writes, Undo/Redo and collaborator state must agree. Missing
  targets and a later failed operation preserve the actual successful prefix.
- Read general and specialized Knowledge with a required dependency through native
  discovery, page it, reuse held advice, compact context and rehydrate. Then retain
  portable text in App context and consume it in a later request without re-reading
  the source. A request-only context handle cannot cross that boundary. Observe the
  actual wire text, acknowledgement and owner load/dispatch counts throughout.
- Prepare a reusable definition, override supported parameters, bind a previous
  result and a named input into later work, save a result without returning its body,
  and use it in the next stage/turn. Inject a save failure after completed execution:
  successful data remains usable and the repair repeats storage only. Wrong bindings
  and stale artifact references reject at the declared owner, without dispatch.
- Deliver successful, partial and failed results with selected and default media,
  then induce content delivery failure after an acknowledged write. Compare real
  App output and actual successor input; verify that corrected input, cancellation,
  report transition, follow-up and final disposal cannot replay that write or lose
  its settlement. A progress-observer failure must not become execution failure.
- Repeat the applicable request/action/error/UI handoffs through the HTTP adapter,
  with drawing/inspection disabled and with the recipe store unavailable. Verify
  each declared bypass and capability-specific rejection; do not force native-only
  Knowledge or SDK behavior onto a provider that does not advertise it.

Every scenario's expected values and forbidden effects are declared before its
execution fixture is assembled. Existing tests are matched to these expectations;
matching titles, shared schema functions or a generated fixture are not evidence.

#### Evidence placement and implementation checkpoint

The requirements above remain independent of executable selection. The current
owner proof manifest is not a complete conversation feature manifest: its single
source-aliased case file cannot certify compiled App exports, HTTP transport,
canonical browser rendering or a native successor request. Keep its valid owner
regressions, but do not use its green state to close these additional handoffs.

| Required boundary                              | Existing owner evidence to retain                                                      | Required continuous observation                                                                                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request, drafts, attachments and clarification | Conversation controller/context and panel tests; conversation navigation browser cases | Controller submission through real HTTP/provider; original images and answer links at the next native input; stale draft reads remain isolated.                                  |
| Context, capabilities and permissions          | Runtime input, permission, provider isolation and basic API contract tests             | Actual emitted declarations and actual native model tools for ordinary, no-operation and assessment profiles; disabled capabilities cannot dispatch.                             |
| Search and selected contracts                  | Capability search, contract acquisition and unified contract tests                     | The real provider delivers selected usage before the same request executes its operation; paged results remain complete.                                                         |
| Knowledge                                      | Shared source tests, Runtime knowledge and App knowledge corpus/continuation tests     | Source text and provenance reach the actual native successor; real returned continuation/context identities drive later calls; loss or mutation is detected.                     |
| Input admission and resources                  | Runtime contract/security and App invocation/lease tests                               | Invalid input is rejected before effects; corrected arguments succeed in the same native thread and turn; retained foreign resources reject.                                     |
| Direct, registered and composed execution      | Runtime recipe and App operation composition/phase tests                               | Actual browser Runtime executes dependencies and staged work; partial prefixes remain acknowledged and are not replayed.                                                         |
| Canonical state and coordinates                | Prepared admission, canonical coordinates/targets and browser inspection/history cases | Real Core state and browser pixels/order/Undo/Redo/peer state agree after the AI entry; an accepting executor fixture cannot certify these effects.                              |
| Values, settlement and projection              | Invocation/result projection and whole-result forwarding tests                         | Original owner data and separate acknowledgement reach the model together; altered data/state is detected by independent expected values.                                        |
| Retention and cross-turn reuse                 | Conversation result store and binding tests                                            | Controller -> HTTP result exchange -> next provider -> Host -> Core consumes a saved input without a model readback.                                                             |
| Selected media                                 | Reference/capture owner and image delivery tests                                       | Real import/capture ownership -> App native reply -> successor image inputs; bytes/order/text separation; deliberate image loss is detected.                                     |
| Progress, cancellation and reporting           | Activity state, evaluation window, provider session and cleanup tests                  | Actual native unfinished work cannot become invocation; cancellation/report/follow-up preserve completed work and owned-resource disposal.                                       |
| Complete execution evidence                    | Shared Flow Inspector source, binding, publication and runner tests                    | Real failed/skipped/empty/interrupted subprocesses and malformed/duplicate/stale observations remain incomplete; every required case and maintained owner file is accounted for. |

November 14 checkpoint: the shared observation consumers now reject contradictory
summary counts. The structured Node producer preserves actual lifecycle events;
its adapter and exact rerun path have real pass/fail/skip/empty/interrupted cases.
The native fixture controls external model decisions and account/endpoint setup
only; the production App creates tool results. Permanent positive and deliberate
corruption cases cover Knowledge text/state and original reference images, plus
same-thread input correction, source paging, selected topics and context reuse.
A controller/HTTP/native/Host/Core chain now demonstrates cross-turn saved-input
reuse. These are feasibility and boundary results, not full feature acceptance.
The independent file/capability reconciliation, remaining continuous cases,
compiled-source closure and final feature run remain open. The old verifier, synthetic dispatcher, five obsolete source/test files, their
callers and package commands are removed. Current docs, Inspector source, generated
workspace data and the Knowledge flow definition no longer route to them. Four
focused entry-boundary checks and the three retained owner suites pass; scoped lint
and deletion-reference checks close only this removal stage, not feature acceptance.
Historical logs and input fixtures remain evidence, not runnable acceptance paths.

Authority reconciliation also removes the outdated all-functions-deferred clause
from the local-provider spec. Its eager drawing bootstrap now matches the execution
spec and actual production registration; no runtime policy changed. Native built-in
tools are inspected separately from App registrations. Do not infer an App contract
violation merely from a native built-in being present; compare the applicable
assessment/report restrictions and actual dispatch behavior first.

#### Replacement execution design and deletion scope

The existing project already has formal tests, flow-contract mappings, test producers
and source-bound observations. Reuse those owners after testing their relevant
boundaries; do not create a new App-local evidence protocol or infer trust from the
Inspector name. Existing acceptance cases and manifests must themselves be checked
against the spec-derived obligations before being used.

The production path under test is:
App submission/controller -> actual request adapter -> provider configuration and
registration -> actual Host/Runtime/domain owners -> real browser/Core consumers ->
Host validation/storage/projection -> production content packaging -> native transport
or HTTP response -> actual successor input/UI -> subsequent request and cleanup.

For native tests, the loopback scripted model service supplies tool calls and records
requests. It must not supply the tool replies: the real App provider handler and Host
produce them after the scripted call arrives. Assert the complete production reply
(success/state/data/images) and the next wire request against independent expectations.
For HTTP, use the existing HTTP adapter and backend/browser protocol, not a fabricated
native namespace. Fake model decisions, external network services, timing controls
and deliberate fault injection are allowed fixtures; recreated admission, result
projection, retention, resource ownership or success classification are not.

Delete the old conversation-verification.mjs execution/verdict implementation and
self-referential scope tests first. Remove its package commands and current callers
before continuing replacement development. There is intentionally no whole-feature
command until the replacement proves its independently specified requirements.
Do not keep a fallback, environment switch, forwarding wrapper or alternate route.
Useful negative controls must remain independent behavioral regressions; immutable
prior logs and recorded inputs remain historical evidence.

Delete native-delivery.mjs's synthetic reply dispatcher and all callers that submit
preconstructed replies while claiming production handoff. Clear its current docs and
Inspector references. Actual App-adapter observations belong to the replacement,
which must not be used as a reason to postpone deletion. Subsequently audit
all shared and file-local verification fixtures, including tool-contract-assertions,
delivery-audit-fixture and tool-host-fixture: retain only transparent setup/observation
or explicitly owner-unit fixtures; remove alternate execution/state/projection paths.
No wrapper that forwards to an obsolete implementation counts as deletion. Domain
unit tests stay only when their asserted behavior matches current spec; they cannot
be relabelled as whole-flow evidence. Do not delete valid product regressions merely
because the old verifier ran them.

Expected coverage comes from reviewed spec cases in existing flow-contract ownership.
Separately inventory maintained tests across the repository, classify their owning
behavior against those requirements, and reconcile every relevant file/case with the
execution plan. This includes shared Knowledge tests outside the App. The runner's
folder roots, current imports or current emitted registrations cannot be the only
source of expected membership. Unsupported environments and unavailable prerequisites
remain required/unexecuted where applicable; they cannot silently narrow the scope.

Use structured runner events and the existing producer/evidence interfaces. The
current shared producers explicitly support Vitest/Playwright; native Node evidence
needs a bounded feasibility proof using Node's structured test events and the existing
observation format. Do not claim an existing Node adapter or reinstate TAP regex totals.
A necessary adapter belongs to the shared evidence owner, not a new verdict engine.
Compare independently declared case identity, actual executed cases, process completion,
errors and source identity. Totals are derived summaries only. Missing, duplicate,
contradictory, interrupted, skipped, stale or mismatched-source evidence cannot pass.

Clean/build only the declared feature dependency closure, then capture maintained
sources and the actual loaded exports. Preserve the current build/source safeguards
as requirements, not by retaining the old verifier. Package source tests and App tests
using compiled exports remain distinguishable. Existing source-alias proof configs
cannot certify the production compiled route. Verify environment and build identity
for the actual executed path; unrelated repository tests/releases stay outside scope.

#### Current execution arrangement

Use the existing Flow-file schema and shared producer/observation APIs for the
spec-derived handoff criteria. Keep the reviewed expected selectors separate from
runner discovery. The new command must record every selected file and actual case,
reject missing/duplicated/failed/skipped evidence, and retain source/build identity.
The command cannot mark the independent spec-coverage review accepted. A successful
execution report with missing semantic evidence remains incomplete.

The maintained selection currently includes all App server and source unit suites,
the Runtime suites, shared Knowledge source tests, verification-owner regressions
and the twelve offline conversational browser files. Other Flow Inspector product
proofs, including the complete Stage A editor suite and its retained historical
reports, are outside this feature run; their individual normalizer behavior is
covered at the shared report boundary. No skipped case in a selected file counts
as passing. Required semantic selectors remain independently authored in the
standard Flow-file, with a separate whole-spec review criterion.

The first current fixture correction isolates simultaneous native processes. The
browser proof exposed a second observation defect: a text-only reply reader rejected
valid image blocks. Permanent regressions must fail before either correction; preserve
all observed block fields and inspect App replies separately from native successor
requests. These are verification fixes, not permission to alter product behavior.

#### Implementation sequence and evidence gates

Current bounded iteration: the first complete-run attempt retained 3,709 passing
server cases and one unexecuted native-registration case. It did not reach the
remaining groups. Exact identity admission also found 166 ambiguous observations
across twelve maintained server files, including truncated parameterized names.
Publishing the combined diagnostic then exceeded the shared warning summary
contract. None of these results establishes feature completion.

The next owner slice is evidence publication and case identity. Preserve complete
diagnostics in the existing warning details, keep summaries descriptive, save raw
and normalized reports before publication, and prove long-diagnostic publication
with a permanent failing regression. Give parameterized cases distinguishable
authored identities without changing their inputs or assertions. Enable the existing
offline native registration check. Then rerun focused owners before the feature
entry. No duplicate or skipped observation becomes acceptable.

The actual native request also demonstrates schema transformations after the App
packet: some constraints and annotations disappear, while constants become enums.
Independently compare accepted/rejected inputs before classifying these as equivalent
or defective. Add native consumer assertions and corruption controls for instructions
and contracts; App packet inspection alone is insufficient. Product changes are
outside this verification task. Any proven product discrepancy remains an explicit
failed obligation, not a relaxed assertion or undocumented compatibility path.

Self-review: this iteration changes shared evidence producers, current test identity
and native consumer observation only. The warning-details contract already admits
the full diagnostic; no schema limit needs weakening. Current observations provide
the fixed twelve-file correction scope. Whole-spec acceptance remains pending.

The same formal collection check found ambiguous authored names in six App test
files and the Runtime action-batch resolution suite. Their inputs/assertions remain
unchanged; parameterized identity now includes the case index. Focused execution
passed 1,415 server, 38 App and 12 Runtime cases. A separate regression proved that
matching file/title alone could accept a foreign project; required handoffs now
consume the shared normalizer's complete selector identity instead of recreating
report matching. The native registration opt-in passed when enabled.

Actual native consumer evidence now includes original instructions, a deliberately
replaced schema, and the original report session through two later questions and
explicit closure. The normal instruction handoff and two corruption controls pass.
A permanent spec assertion fails: `delivery.fields: {}` is rejected by the App
publication but accepted by the schema in the actual model request because its
`minProperties` constraint was removed. This is an observed contract discrepancy,
not a test-helper projection or an equivalent `const` to `enum` conversion. Preserve
the failure in complete execution; do not change product semantics or accept the
whole-spec criterion from the other passing cases.

The second complete-run attempt (`tmp/conversation-proof-ftD4rN`) kept identical
source/build fingerprints through all five groups. Server: 3,714 passed and the
native contract discrepancy failed. Runtime: 523 passed. App: 1,469 passed and
eight failures caused by Node file owners being transformed in a browser test
environment; both files pass all 38 cases in Node without assertion changes.
The 409 Node cases passed, but a renamed required selector was correctly rejected.
Browser: 79 passed, eight failed and two artifact-dependent replays remained
unexecuted. The actual native/browser/Core/capture/Undo/Redo/peer case passed.

The next evidence-owner slice declares Node ownership on the two file-loading
suites, includes maintained Node tests under App source (including the production
provider-bundle boundary), and corrects five selectors missing their authored
suite prefix plus the renamed scope assertion. Prove the missing bundle file is
rejected before changing selection. Do not change input/output assertions for
these environment and identity corrections.

Then review the eight browser failures against current owners: three membership
profiles require a full-index preparation even though the warmed index takes the
canonical incremental-add path; one phase profile requires retired preprocessing
and an inapplicable delivery-sequence branch; two activity cases add four operations
but still expect the former three-operation row total; one expired-receipt case
expects a storage failure instead of canonical input rejection; and the recorded
provider peer sends the removed `response` control. Repair test inputs and owner
observations only after checking the current contract. Replace simulated native
delivery where it is claimed as real successor evidence. The two externally supplied
replay inputs need explicit coverage classification or maintained project fixtures;
skips cannot certify completion. The native schema discrepancy remains a product
finding, outside this verification-only mutation boundary.

The focused correction run now executes the two formerly input-dependent browser
cases using maintained general fixtures produced by the real preparation and Core
owners. Optional recorded inputs still exercise additional geometry; they are no
longer prerequisites for routine case execution. Thirteen focused browser cases
passed without skips. The native partial-prefix case then passed separately after
removing its fake SDK peer: real deferred discovery, actual App replies and native
successor content preserve partial settlement, repair-only mutation, history and
durable reload. A supplied historical draft contributes geometry only; its removed
response control is not forwarded into the current workflow contract.

Self-review preserves the original work-count and visual assertions. Incremental
membership assertions now require zero index rebuilds and exact added/append counts;
the phase proof checks current canonical owners; the activity proof counts all four
operations; an expired receipt rejects before storage and leaves canonical state
unchanged. Legitimate completed execution with storage failure retains its separate
case. One intermediate focused attempt was invalidated by a source edit during the
browser run; its navigation failure is not product evidence. The subsequent frozen
run passed that case. Freeze source during all browser and complete-feature runs.

The local-provider specification's retired completion-stamp gate contradicted the
conversation/execution specifications and current public registrations. Its owner
text now describes measurement/attachment freshness without introducing a global
completion call. Actual native schema equivalence remains failed, and independent
whole-spec association remains incomplete. Remaining continuous coverage includes
native compaction/rehydration, mutation preservation across report transition and
conditional capability profiles. The command's interruption cleanup also requires
an explicit orchestration proof; shared producer interruption tests alone do not
prove that caller's process lifecycle. None is closed by test totals.

The third complete run (`tmp/conversation-proof-q2cknX`) preserved identical
source/build/definition fingerprints. Executed cases: server 3,714 passed and one
native-schema failure; App 1,477 passed; Runtime 523 passed; Node 415 passed;
browser 89 passed. Nothing was skipped. Two Node required selectors nevertheless
failed reconciliation. The runner borrowed its observation configuration from the
first expected selector: adding the frontend-bundle criterion changed the identity
assigned to every Node result. This violates the independent-input boundary even
though the gate correctly refused completion.

Revised evidence-owner slice: execution configuration, not expectations, owns
producer/cwd/config/project identity. Explicitly execute the existing App Vite
configuration; give the default Runtime execution an explicit empty Vitest
configuration; identify Node execution by its actual orchestration entry. Browser
execution retains its actual Playwright configuration. Test these independent
execution identities before wiring them into normalization. Replace all former
package-manifest selector aliases; do not accept both. Expectations remain inputs
to comparison only. Required observations: changed expected configuration is
rejected, changing expectation order cannot change recorded identity, and the
frontend bundle and shared evidence cases match the same actual Node execution.
No product code or test behavior changes in this slice.

The execution-identity regression first failed on missing independent configuration
provenance, then passed after the caller stopped reading identity from expectations.
Explicit App configuration passed 38 focused cases; explicit default Runtime
configuration passed all 523 Runtime cases. The native browser repair proof now
continues through an unlimited report and a retained-session question: one native
thread, three turns, three actual writes, unchanged canonical state during reporting,
no tool replay, and normal undo/redo/durable reload afterward. That continuous case
passed at its observed boundaries only. Review found that its browser helper manually
loops action handlers inside a transaction. Those handlers use the real action
validator, but the loop bypasses Runtime batch admission, permission and settlement.
It does not prove the complete App/Runtime chain. The separate real-App HTTP/UI
hierarchy case remains valid evidence for its own route.

Next native Knowledge proof: the installed native engine owns context compaction.
Drive its normal compaction threshold using a scripted external model's usage receipt,
observe genuine native compaction notifications and requests, then verify actual App
rehydration and source data at the successor. Do not synthesize compaction events or
copy the App's context-reset implementation into a fixture. An unsupported native
route remains explicit missing evidence. The inspected installed model declares a
272,000-token window; simulated usage is test input, not measured model work.

Current verification-owner slice: first demonstrate that an explicitly denied write
is incorrectly dispatched by the repeated-detail helper, then delete its manual
executor and use the public Runtime with scripted provider decisions. Preserve
actual action validation, partial receipts, current context, transaction ownership
and resource lifetime. Do not classify this transport-free owner fixture as a full
UI/HTTP conversation. A scoped fixture type check also requires genuine narrowing
of JSON/receipt inputs and public history APIs, not assertions, private state or
invented defaults. Keep original behavioral assertions; invalid fixtures fail
explicitly. Review native media/report evidence separately from this owner fixture.

Native Knowledge compaction now has genuine engine notifications, stale-context
rejection and complete rehydration in one continuous session. Native assessment
also verifies both normal analysis and a forbidden invented tool call with zero App
dispatch. These observations do not resolve the failed native schema obligation.

The denied-write counterexample dispatched two elements through the removed manual
helper. The public Runtime replacement correctly rejects before mutation. Its
workflow consumer instead rewraps the permission rejection as invalid output with
unknown settlement; retain this failing assertion as a separate product-boundary
finding. The fixture's concurrent receipt correlation was separately corrected and
retested: six browser cases pass, the workflow rejection remains failed. The scoped
fixture type check passes without type assertions. Public Core history/boundary
queries replace private transaction fields; direct UI consumers keep their active-
interaction and one-commit assertions.

Next evidence-owner slice: test the actual verification CLI under interruption,
including a leader that exits zero while a descendant survives. Isolate publication
with the shared project configuration, never mutate the active flow from the
counterexample. The existing shared process owner must terminate its group and
preserve cancellation; the CLI must not run the next group or publish success.
Keep stdout/stderr evidence separate and retain formal process/output guards.

The actual CLI interruption proof first observed a second build after SIGTERM.
The CLI now uses the existing shared process owner, records cancellation separately
from a zero exit, terminates descendants and refuses successors. Its isolated
publication uses the same project/flow adapter; it cannot touch the active result.
All 26 focused CLI/process cases pass, including failed exits, deadlines, output
overflow, abrupt parent death, private source execution and separate output streams.
The complete gate now also runs the scoped verification-fixture type check against
its captured source. Added required observations cover native compaction, both
assessment profiles, browser permission rejection, its failing workflow consumer
and actual CLI interruption. Whole-spec review remains pending; counts cannot close it.

A final deletion-reference check found one stale compose-step implementation
reference to the deleted receipt-provider fixture. The generic current-owner path
regression detects it. Replace that reference with the real native fixture and
public Runtime fixture and regenerate the existing Inspector workspace. The fourth
feature run was intentionally cancelled before completion for this correction;
its cancellation evidence is `tmp/conversation-proof-dqQLgE`, never a passing run.

The fifth complete feature run is `tmp/conversation-proof-keAGOV` (log:
`tmp/conversation-complete-fifth.log`). It finished every selected group with
identical before/after maintained-source, compiled-export and definition snapshots.
The scoped verification-fixture type check passed. No tests were skipped.

| Executed group                                    | Passed | Failed |
| ------------------------------------------------- | -----: | -----: |
| Server - 100 files                                |  3,717 |      1 |
| App - 137 files                                   |  1,477 |      0 |
| Runtime - 34 files                                |    523 |      0 |
| Shared Knowledge and verification - 40 Node files |    443 |      0 |
| Browser - 12 files                                |     90 |      1 |
| Total                                             |  6,250 |      2 |

These are execution counts, not complete specification coverage. The thirteen
summary diagnostics describe two failing assertions and their file/process/required-
handoff consequences; they are not thirteen independent product bugs. There are no
remaining runner identity, missing-required-selector or source-drift findings in
this run. Naming and scoped lint also pass.

Failure assertions from that run (classification corrected below):

1. The actual native model declaration accepts `delivery.fields: {}`, while the
   App's original published schema rejects it. The native conversion drops the
   nonempty-object constraint. This violates equivalent declaration conversion;
   do not relax original input validation or rewrite the test to accept the loss.
2. The real browser Runtime rejects a denied write with `AI_PERMISSION_DENIED`,
   `stage: permission`, `settlement: not-started`, no action results and unchanged
   canonical state. The actual workflow/operation consumer adds an unverified
   mutation finding and rewraps it as `TOOL_RESULT_INVALID`, `settlement: unknown`.
   The separate Runtime rejection case passes; the workflow handoff remains red.
   This owner test uses production Runtime/Host/Core but not the App HTTP/UI request
   route. It must not be described as that entire continuous chain.

Correction after following the real provider assembly: the second failure above
was not established as a product defect. `local-ai-provider` passes Runtime receipts
through `observeActionBatch` and `requireBatchSuccess` before dispatching to operation
owners. The owner-only browser fixture omitted those existing adapters. Replace its
raw receipt dispatch with the exact production adapters; do not reimplement their
behavior. Replace the workflow rejection proof with an actual native provider call,
using the real browser Runtime for execution, and inspect both the outbound failure
receipt and the next native model request. Its top-level transport failure code must
follow the current Browser batch contract; assert original permission cause and
not-started settlement at their documented boundaries, rather than assuming that the
raw Runtime code must be copied to the workflow root. Keep the recorded failed run;
retract the premature product-bug classification.

The replacement native permission-rejection proof passes
(`tmp/conversation-native-permission.json`): the real provider assembles the adapters,
the browser Runtime rejects before mutation, and the next native model request
receives the original permission cause with failed/not-started acknowledgement.
No product fix was needed for this path. Owner-only fixtures now call the same
existing observation and receipt adapters; they still do not claim an HTTP/UI route.

Three additional native capability-profile cases pass
(`tmp/conversation-capability-profiles-next.json`): ordinary requests without a
browser executor retain Knowledge; an invented drawing call is not dispatched;
unavailable durable-library loading is disclosed in the actual developer instruction
input while Knowledge continues. The first load-failure assertion incorrectly looked
for that disclosure in the base instruction role; the production instruction owner
and actual successor input established its developer-role location. No instruction
was moved or added to make the test pass. This proves loading failure, not every
storage-write/retry branch. Native schema selection also rejects ambiguous duplicate
names instead of silently selecting the first declaration.

After the adapter correction, all six repeated-detail browser cases pass
(`tmp/conversation-repeated-detail-final.json`); all 22 native cases execute with
21 passes and the one original native-schema failure (`tmp/conversation-native-final.json`).
No cases are skipped in these full-file reruns. Scoped types and lint pass. The
sixth complete feature execution must use this corrected source; the fifth run
cannot be relabelled as evidence for it. The current confirmed product discrepancy
is native nonempty-object schema conversion. The earlier permission result was a
verification-fixture defect and is corrected, not a remaining product failure.

The sixth complete feature run is `tmp/conversation-proof-H7aw4m` (log:
`tmp/conversation-complete-sixth.log`). It finished all 323 selected files, including
the corrected native permission route. Maintained sources, compiled exports and
required definitions are identical before and after execution. The fixture type
check passes, every recorded process has a terminal record, and there are no
skipped cases or runner identity, missing-selector or source-drift findings.

| Executed group                                    | Passed | Failed |
| ------------------------------------------------- | -----: | -----: |
| Server - 100 files                                |  3,720 |      1 |
| App - 137 files                                   |  1,477 |      0 |
| Runtime - 34 files                                |    523 |      0 |
| Shared Knowledge and verification - 40 Node files |    443 |      0 |
| Browser - 12 files                                |     91 |      0 |
| Total                                             |  6,254 |      1 |

The command exits with status 1 and records `failed-or-incomplete`. Its seven
diagnostics are consequences of the single native schema assertion, including
group-level and final required-handoff reconciliation; they are not seven product
defects. The App rejects an empty `delivery.fields` object, but the declaration
received by the native model does not preserve that restriction. This observation
does not establish that invalid input can mutate the document: execution admission
still uses the original schema. It establishes a non-equivalent model-facing
contract, which remains a failure rather than an accepted conversion.

Final bounded review retains the distinction between actual App/HTTP/browser chains,
native successor-request proofs, public Runtime owner fixtures and owner unit tests.
The deliberate data, acknowledgement, image, instruction and schema corruptions are
detected at their real consumer boundaries. Actual CLI interruption and malformed,
missing, duplicated and mismatched execution evidence remain nonpassing. The deleted
verifier, receipt-provider fixture and synthetic native-delivery path remain absent;
the package command invokes only `scripts/verify-conversation.mjs`.

This run completes execution of the maintained feature selection, not acceptance of
all specification clauses or capability profiles. Keep the independent semantic
criterion unaccepted and the task goal incomplete. Do not repair the native product
contract inside a test fixture, omit the failing case or use the passing count to
close the still-unproved routes below. The only post-run change is this plan record;
no product source or test expectation was changed after the frozen run.

Acceptance remains incomplete. At the sixth-run checkpoint, the independent
spec-coverage criterion was pending, including the complete clause/capability
association and remaining continuous profiles beyond the observed no-executor and
library-load-failure cases. Durable save-only recovery was one missing profile;
the following slice supplies that evidence without accepting the whole criterion.
The real App HTTP/UI hierarchy case,
controller/HTTP retained-input chain, native Knowledge/compaction/media/report cases
and permission-owner case prove their named routes only. Do not combine separate
fixtures into an unobserved whole chain or claim every profile from these counts.
Product corrections remain outside this verification-only task boundary. No 101,
live model evaluation, full repository test, commit or push was performed.

Next composition evidence slice: prove durable save-only recovery through the actual
native provider. The authority is the Runtime tool specification's Durable host store
and the execution Inspector's compose route: completed work and failed storage remain
separate, and a genuine receipt permits storage-only retry without replay. Use the
existing production library, SQLite adapter, native fixture and published preparation
dependency. An independent SQLite writer holds a real write lock after admission;
release it only after observing the unsaved result in the successor model request.
Then invoke `save_tool` with that returned receipt, verify the persisted eligible
record, exact native acknowledgement and unchanged preparation dispatch count.
Also reject an invented receipt before a valid retry. All failure injection stays
in project-local test IO; no replacement store, copied receipt adapter, product
behavior or schema relaxation. The existing native handoff test and composition
Flow-file criterion own this evidence. New names are test-only scenario identities,
not new product identities or persistence formats. Naming baseline passes.

Fixture review for this slice exposed two invalid setup assumptions before the
storage assertions could run. An empty App action inventory intentionally disables
preparation and contract acquisition. Advertise the contract returned by the actual
prepared-action factory, while rejecting any browser dispatch in this server-only
case. The complete preparation contract returns JSON-fragment pages; this owner
does not advertise inputScope choices and correctly rejects that attempted scope.
The scripted model must follow each returned continuation of the full query,
check revision/offset/length continuity and finish acquisition before authoring.
Neither an unsupported call nor a first fragment is a complete contract. Keep these
failures as fixture evidence, not product bugs; do not replace the real registration
or remove pagination to make the scenario proceed.

The actual native storage recovery case now passes. It reads all four contract
pages, admits a definition with the acquired dependency revision, and persists a
candidate before a separate SQLite connection holds `BEGIN IMMEDIATE`. Preparation
then succeeds exactly once while promotion fails with the real lock error. Both
the canonical preparation owner's `prepareAsync` spy and public invocation identity
observations retain a count of one through the invalid and valid save retries.
An invented receipt rejects before storage changes; the returned genuine receipt
promotes the existing record to eligible after lock release. No execution arguments
or prepared artifact value are stored in the durable definition. The original
native thread and turn remain unchanged, and all observed child processes exit.

The independent outer-state assertion was corrected against execution-flow
clauses 75-90 and Model-visible result contracts: successful execution with unsaved
storage has an outer partial/completed acknowledgement and native `success: false`;
it is not failed execution and not a completely successful delivery. The successful
save-only retry has success/completed acknowledgement. Both exact payloads and
acknowledgements reach the actual successor requests. No product code or schema
changed to make these states pass.

Evidence: `tmp/conversation-native-storage-counts.json` passes the focused case;
`tmp/conversation-native-storage-file.json` executes the complete 23-case native
file with 22 passes, the original native-schema failure and no skips. Raw production
packets and ten model requests are in `tmp/conversation-native-0K6kw5`: four contract
calls, submission, one preparation invocation and two storage calls. Scope tests
pass 4/4, naming passes 15/15, and scoped types and lint pass. The composition Flow
criterion now requires this actual-provider case. These are focused results after
the sixth complete run, not a new complete-feature acceptance result. Complete
clause/capability association and the original product discrepancy remain open.

Next request evidence slice: conversation-experience Product contract, Conversation
navigation and General design target continuity require draft/source isolation and
question/answer continuity through the actual request consumer. The current delayed
attachment browser case ends at an intercepted HTTP request; separate native image
tests do not establish that full chain. Add a second actual-App browser scenario:
delay two FileReader completions, switch conversations, settle the unrelated request,
return and submit the originating draft, answer a native clarification, then follow
up. Inspect all real model inputs for source identity/count, exact intent and answer
history, with unchanged Core state and Undo depth. Preserve ordinary per-request
native lifecycle; do not turn this into report-session continuity.

Reuse the current test's real Vite/collaboration service setup by extracting only
owned process/environment lifecycle into a browser fixture. It must not implement
provider replies, admission, Runtime execution, context projection or result
conversion. Keep the existing hierarchy/pixels/peer/Undo assertions intact and run
both browser cases, fixture type checks and source identity checks before the next
complete gate. New identifiers belong only to test service lifecycle and scenario
data. This is request/observe evidence within the frozen verification boundary;
there is no product behavior change or new product workflow.

The two actual-App browser cases pass on the extracted service fixture. Opening the
panel also performs one native connection probe without a model turn: six thread
starts, one empty-tool probe, five task turns and five model requests are expected.
This follows the production status route, not an extra task execution. The original
hierarchy case remains green. Scoped types, lint, scope and naming gates pass.

Request evidence review requires structural attachment indexes and question/answer
links, not just presence of matching text and image bytes. Strengthen the same case
against independently authored source associations. Add a deliberate wire corruption
that swaps the original attachment indexes after App publication but before native
consumption, preserving image bytes and messages. The unchanged App packet must pass
the association assertion while the actual consumer request must fail it. The fault
belongs only to the existing external native proxy; no product transformation is
copied into a helper. Require both the unmodified and corrupted-path cases in the
request Flow criterion. This bounded request slice does not certify the other rows.

Request association proof passes: `tmp/conversation-association-browser-final.json`
executes all three real-App cases with no skips or retries. The corrupted arm keeps
both exact image bodies and all request text, but swaps current source indexes in
the outbound wire. The independently authored association assertion passes on the
original App packet and rejects the actual native consumer packet. All other
published/received request metadata remains equal. Subsequent history preserves the
original source turn, question, answer link and image identities without reattaching
them as new user uploads. No canonical or Undo change occurs in either advice case;
the existing hierarchy/capture/collaboration/Undo case also passes.

An initial assertion required an empty history object in the unrelated conversation.
The specification requires isolation, and the controller intentionally omits history
when there are no settled turns. The corrected assertion requires that omission;
it does not accept either representation or change product behavior. The failed run
remains in `tmp/conversation-association-browser.json`. Scoped type and lint checks,
source selection/proxy lifecycle tests and naming pass in the corresponding
`tmp/conversation-association-*-final.log` files. The new corruption case is a required
request criterion. This establishes this request boundary, not independent coverage
of every specification clause. The seventh complete feature run follows on frozen
source; its verdict must retain the known native-schema mismatch and pending
whole-spec review rather than infer completion from the focused passes.

The seventh complete feature run (`tmp/conversation-proof-VNGytW`, log
`tmp/conversation-complete-seventh.log`) executes all 323 selected files: server
3,721 passed / one failed; App 1,477 passed; Runtime 523 passed; shared Knowledge and
verification owners 443 passed; browser 93 passed. Total: 6,257 passed, one failed,
no skipped cases. Source, compiled exports and required definitions match exactly
before/after. All 44 recorded processes settle; only the server runner exits nonzero.
Seven summary diagnostics describe the one native-schema discrepancy and its failed
required handoff, not seven distinct product defects. Overall status remains
failed-or-incomplete and the independent spec-coverage criterion remains unaccepted.

The new request corruption and durable storage recovery proofs pass in that complete
run. Remaining continuous observations include the planned region-selection/group/
update/dual-capture canonical chain and portable Knowledge retained then consumed in
a later App request. Existing separate owner and native tests do not establish those
combined chains. Complete these and the independent clause/capability association
before the next complete-gate rerun. Do not alter the out-of-scope product declaration
or weaken its failing assertion to obtain acceptance. This checkpoint is not goal
completion or a claim that every conversation handoff is correct.

Next compose/request slice: exercise the existing production controller, HTTP result
exchange, native Host and canonical Core with a Knowledge read retained as portable
text, status-only delivery, then a later-turn named binding into an editable text
node. Independently compare the final canonical text with the source Markdown body;
observe Knowledge read count and absence of a second source load. A request-owned
context key must not enter the saved portable value. Existing request/compose lifetime
and delivery contracts own this scenario. Keep model decisions scripted, all result
and storage handling in production owners, and exact source/state assertions in the
permanent production-handoff suite. No product changes or additional mandatory flow.

Knowledge slice replan after focused fixture failures: the minimal controller/Core
fixture installs basic shapes and containers, whereas the real App also calls
`initText(core)`. A valid text child therefore failed after its frame was applied;
that result cannot establish the normal App text handoff. Replace the incomplete
fixture composition with the existing App text initializer before Core startup.
Do not define a substitute text component or accept a partial result as success.
The same test must require successful native acknowledgement, exact canonical source
text, one real source-file read, and scalar-only retained transfer. Its earlier
invalid root/missing-key inputs and immutable ESM-spy failure are fixture failures,
not product findings. The unavailable-text failure also exposed a partial result
missing timing; preserve its raw evidence as an unclassified failure branch until
checked against the owner contract. This does not authorize product repair.

Self-review: the current request/compose lifetime contract is unchanged. Only the
production-handoff fixture and its existing required criteria/documentation are in
scope. Run the complete handoff file after the targeted case, scoped types, lint and
naming; do not rerun the complete feature gate yet. The initializer is imported from
the production App composition and performs its real registration. No schema,
assertion strength or execution adapter is replaced.

The portable Knowledge positive route passes after using the actual text initializer.
The App exchange contract has two different outputs: save returns a name/type/origin
receipt; later read returns the selected scalar. The proof now asserts those two exact
values in order, rather than incorrectly expecting the body in both receipts. Actual
native requests never contain the retained body, the final editable text equals the
source body, and the real source read count remains one across two requests.
Add one transport-only corruption arm: replace that scalar after the App publishes
it and before the Host consumes it. Successful status must not satisfy the independent
canonical text assertion. Preserve exact original transfer observations and read
counts in both arms; then run the whole production-handoff file and scoped gates.

Partial-branch verification follow-up remains inside this slice: the prepared action
requires timing in its published result, but its acknowledged-prefix exception omits
that field. The existing action tests assert the exception receipt without following
it to native validation. To distinguish this from the earlier incomplete text fixture,
keep the complete App registration and inject a failure only at the public canonical
child-create call after the real frame write. Require the actual native reply to
preserve the partial prefix without a result-contract error, with no replay. Add this
as a permanent production-handoff case; if it fails, retain it as a product finding
outside the verification-only repair boundary. Do not weaken the output contract or
reconstruct the partial receipt in the fixture.

Knowledge continuity checkpoint: the final focused file
`tmp/conversation-knowledge-partial-final.json` executes five cases: four pass and
one fails, with no skips. The normal and corrupted geometry reuse cases remain green;
the new normal and corrupted portable-advice cases also pass. They prove exact source
text, save metadata then scalar read in the real App exchange, one source-file read,
no model body readback and no repeated Knowledge invocation. Actual canonical text
changes under deliberate transport corruption and the independent oracle rejects it.
Scoped types, lint, naming and scope tests pass. Both new Knowledge cases are required
Flow criteria. This source is newer than the seventh complete run; do not add these
focused counts to that run or claim a new whole-feature result.

The fifth case confirms a second product discrepancy. With production text
registration present, a controlled canonical child-create failure leaves the real
frame acknowledged exactly once. The prepared-action exception omits timing that its
published output requires (`src/ai/design-actions.ts` result schema and prefix catch).
Actual Host validation and native successor delivery therefore carry
`TOOL_RESULT_INVALID` instead of a contract-valid partial receipt. Existing action
unit tests assert only the exception prefix, which did not expose this downstream
mismatch. The permanent native-consumer assertion remains red; the canonical Flow
criterion requires it. Raw fault-run evidence is in `tmp/conversation-native-jHDWq3`
with its preceding Knowledge request in `tmp/conversation-native-bN9vq7`; both native
cleanup records confirm all children exited. Product behavior remains unchanged.

The parameterized display formatter initially truncated long case titles, producing
two indistinguishable names. The current file uses direct authored titles, preserving
exact selectors without an alias or relaxed identity check. The final five names are
unique and complete. Earlier fixture failures remain separate evidence, not accepted
results. Remaining work is the planned canonical multi-operation observation and
independent complete clause/capability association; the two confirmed product
mismatches continue to block feature acceptance. Do not rerun the complete gate until
the remaining verification slice is ready.

Canonical continuous observation slice: use the real App/browser/native fixture to
create a translated frame and parent containing two rectangles, select both from a
workspace region at execution time, group them, bind the returned first child ID into
a position update, and bind the returned group ID into overview and detail captures.
One execute_design call owns all five decided operations. Independently expected
workspace origins are red (120,100) and blue (175,127) after the local move; selected
IDs, group membership/order, exact two-image delivery, one history group, peer state
and Undo/Redo must agree. The region query must see the earlier creation, not a
fixture-generated ID list or renderer substitute. The apply/inspect Inspector routes,
Target-bound execution result continuity, Image inspection target preflight and
one-request history-group clauses own this slice.

Add a transport-only image-loss control through the existing native proxy: preserve
the App's two real capture blocks and their status, remove them before native
consumption, and require the independent ordered-image assertion to reject the
actual successor request. Keep pixel/world-coordinate and collaboration assertions
in both arms. Files in scope are the current browser handoff suite, its existing
Flow criteria and this plan. Services use the existing lifecycle fixture. No product
implementation, screenshot substitute, compatibility path or 101 fixture is added.
Run these cases, then the complete browser handoff file, scoped types/lint/naming and
selection checks before advancing to the independent specification association.

Canonical fixture admission review: both initial attempts used paths that the
published binding contract does not promise. Grouping declares groupId, not its
internal child-ID array. Creation exports the typed createdTargets map, but its
arbitrary source-key entries are not statically declared properties; current
request admission rejects such a nested step selector. The specification allows
declared optional properties and array items, not arbitrary map-key navigation in
step bindings. These two admission failures are fixture failures, not confirmed
product discrepancies. Saved-map navigation is separately proved by retained-value
cases; do not infer same-step dictionary support from that capability.

Revised bounded canonical case: keep creation, current regional selection and
grouping. Bind the declared groupId into a group-local position update and both
captures. Return the declared entire createdTargets array to independently compare
created child IDs with actual membership. With group-local position (5,10), expected
workspace origins are red (120,107) and blue (180,137); the group extent is 80 by 50.
Design preparation normalizes the original group with child minima (-5,7), moving
its workspace origin to (115,97) while preserving the original world geometry.
The explicit Group update invokes Preset geometry projection and normalizes the
enclosing Group as documented by its explicit-target contract; its final origin is
(120,107). The test checks that final parent origin and both later child points, not
the intermediate preparation origin. Soft assertions collect independent coordinate
and pixel failures in one run; any failure still rejects the case.
The earlier (125,100) expectation incorrectly ignored this declared normalization;
its failed assertion is fixture evidence, not a product defect.
This proves the originally required one-call dependent canonical chain without an
invented dynamic selector. Keep both rejected attempts as fixture evidence. Read
canonical IDs from SceneTree map keys. Scope, two-image negative control, history,
collaboration and fixed focused gates remain unchanged. The compose Inspector
explicitly declares the groupId-to-capture route; apply owns real mutation and one
history group; inspect owns both target-local captures and ordered media delivery.
Self-review: this changes the authored scenario, not production contracts or
validation, and does not establish unsupported dictionary binding as implemented.

Canonical pixel review: inspection returns an explicitly white-backed observation
(`common-apis/inspection.ts` declares background #ffffff), distinct from adding a
painted background to the document. The blank-pixel oracle now expects white RGBA;
red/blue content, native detail extent and ordered original-byte delivery remain
exact. The previous transparent-snapshot assumption was a fixture mistake. The last
run reached both complete chains, image corruption checks, one Undo group, Redo and
peer convergence; its only failed assertions were these two blank pixels per case.

Canonical handoff checkpoint: `tmp/conversation-canonical-file.json` executes all
five browser handoff cases with five passes, no skips or retries. The two new cases
prove a real one-call creation/region/group/update/two-capture sequence, exact world
positions and painter order, real colored pixels/native detail size, one Undo entry,
Redo and collaborator convergence. The image-loss arm removes only actual outgoing
native image blocks after the App produced both PNGs; the unchanged independent
ordered-image assertion detects it. Both cases are now required Flow criteria.
Scoped type checking, lint, naming (15 cases) and scope selection (4 cases) pass.
Product behavior is unchanged; the two earlier product discrepancies remain red.
This is a canonical/media boundary proof, not complete feature acceptance.

Next owner slice: HTTP provider transport and capability profiles. Current adapter
unit tests replace fetch, so they do not establish the actual remote consumer.
Add permanent cases in the production-handoff integration suite using a real local
HTTP model endpoint behind the production App middleware/controller/Runtime/Core.
Observe serialized prompt, original intent, complete published action contract and
authorization headers at that endpoint; prove valid canonical mutation, invalid
input with no writes, corrected later turn, and exact public history on subsequent
requests. Repeat with a deliberately restricted real Runtime registration: an
unadvertised mutation must reject without writes, while allowed reporting works.
The endpoint only scripts model decisions and records received bytes; no fixture
may perform action execution, schema projection, history assembly or result repair.
Native-only Knowledge/library capabilities are not fabricated for HTTP. This slice
covers the local-provider Supported behavior / Conversation request continuity and
request/compose/apply/settle routes. Files remain the integration suite, this plan
and existing Flow criteria. Run exact new cases, scoped types/lint/naming/scope, then
the complete handoff file; retain its known partial-result RED. Self-review requires
both permitted and forbidden effects at the real canonical consumer, not merely an
HTTP 200 response or schema identity. Independent full clause association remains
pending after this slice; do not start another broad gate prematurely.

HTTP fixture review: the first execution reached the real rejection, correction,
canonical state and later public-history assertions. Its declaration assertion
incorrectly expected a plain ID array: the public element membership contract is
an explicit array or retained snapshot/lease descriptor. Require both declared
branches at the actual endpoint; do not remove the retained-reference branch.
Seed through the public createElement operation (which owns valid descriptor
construction), and count one drawable
object (the workspace is not in the canonical drawable count). These are fixture
corrections, with no product validation changes. Rerun both profiles before acceptance.

HTTP handoff checkpoint: both actual-endpoint profiles pass. The unrestricted
profile observes failed input, successful correction and read-only reporting;
the restricted registration observes failed unadvertised mutation and two read-only
reports. Every request preserves the exact producer input and complete App prompt;
independent array/reference-contract assertions, canonical positions, forbidden
writes, header-only credentials and subsequent public history also pass. Transport
identity comparisons are not used as semantic schema or prompt correctness oracles.
Actual endpoint observations are retained under `tmp/conversation-http-*/observations.json`.
The complete production-handoff file runs seven cases: six pass and the known
partial-result contract mismatch remains red, with no skips. The exact-source
rerun after the artifact-path typing correction confirms the same six passes and
one failure in `tmp/conversation-production-handoff-reviewed.json`. Scoped types/lint, naming and
six verifier selection/interruption tests pass. The latter still reject missing,
duplicate, unsuccessful or interrupted evidence rather than inheriting test totals.

Independent association review after these slices does not accept whole-feature
coverage. The existing Flow criteria have real canonical/media and HTTP consumers
now, but three remaining distinctions must not be collapsed:

- The retained-input chain reads a known construction contract and then executes it.
  It does not prove purpose/field search -> candidate identity -> selected contract
  -> actual native invocation. Purpose-discovery tests currently construct a partial
  catalog and replace dispatch; they remain owner-unit evidence. Add the planned
  actual-native search chain before marking discovery complete.
- Recipe-flow tests exercise the real Runtime with deliberately small declared leaf
  owners. They prove scheduler/iteration/store semantics, not App preparation,
  template override, ready-stage application and provider delivery as one chain.
  The real native save-only and partial-prefix browser cases complement but do not
  replace that required composition/profile association.
- The current suite inventory and required-selector identity checks establish that
  selected cases execute honestly. They do not prove every advertised capability's
  applicable valid/invalid/failure behavior, nor every current specification clause.
  Complete the independently reviewed capability/owner-case association using the
  actual emitted inventories and maintained formal tests. Do not derive expected
  capabilities from the selection roots or accept a case solely because it exists.

Keep `spec-coverage-review` unaccepted and both known product failures visible.
Next bounded slice remains discovery, then composition/profile association and the
final whole-feature gate. Reuse lifecycle-only fixtures; fixture dispatch substitutes
stay owner-unit tests and cannot become whole-chain acceptance. Do not restore deleted
verifiers, add a compatibility route, or repair product behavior in this task.

Discovery slice execution contract: extend the existing real controller/HTTP/native/
Host/Core retained-source chain with a purpose-and-field query before acquisition.
The scripted model reads the actual native successor's candidate entry, follows its
published usage selector, and submits the selected qualified identity in the existing
execute_design stage. Query terms describe editable design preparation; draft is the
required input field. Independently require the construction owner and exclude
unrelated subject/reference lookup. The original retained-value corruption arm,
no-readback assertion and canonical dimensions remain unchanged. Actual query replies
must contain candidates only; a separate contract response must arrive before the
execution call. Count three first-turn calls (search, contract, execution) and one
second-turn call; no fixture may reconstruct search results or schemas. Scope is the
production-handoff suite, existing discovery Flow criterion and this plan. The compose
Inspector's separate search/read owners and current execution-flow Discovery
responsibility boundary own the case. Run the exact two chains, then types/lint/naming
and selector identity checks. Self-review: using returned identity/usage arguments
proves a consumed handoff; merely adding an unused search call would not.

Discovery checkpoint: both existing retained-source chains now pass with the actual
purpose/field query feeding returned usage arguments and qualified construction
identity into acquisition/execution. The original corruption arm still detects a
changed saved value at the canonical consumer. `tmp/conversation-discovery-first.json`
records two passes (five unrelated cases excluded by the focused selector). Types
and lint pass. The normal chain remains one required retention criterion and also supplies
discovery evidence in the semantic review; the shared capture forbids duplicate selectors.
This proves that consumed route, not every search query or capability profile.

Composition slice execution contract: add a real browser/App/native case using the
existing lifecycle-only fixture. A single execute_design call contains two stages.
The first prepares/applies a Frame, repeated template motifs and an overflowing
rectangle. The second reuses the first authored motif template via a retained-input
alias with a supported fill override, prepares a new part, checks the existing Frame,
repairs the prescribed rectangle position and checks again before applying its part.
Read actual browser acknowledgement POST bodies without intercepting or rewriting
them. Require apply -> repairable review -> one repair -> passing review -> second
apply -> explicit capture, two applied-stage statuses, one native invocation, exact
canonical type counts/parentage/positions/colors and one Undo group with correct Redo.
Preparation may overlap only as production authorizes; assertions concern dependent
canonical receipt order, not timing guesses. The same draft template is an AI tool
input, never a SceneTree shared component. Current stage, iteration, template-override
and request-history clauses own these expectations. Files are the browser handoff
suite, existing composition Flow criteria and this plan. Self-review: real review and
repair owners must run; no synthetic checker, fabricated receipt or manually repaired
canvas is permitted. Run this exact case, relevant types/lint and then the whole
browser handoff file. Product discrepancies remain RED outside this task.

Staged first-run review: the authored grid omitted its required order; add
cell-major explicitly. The separate dependency rejection is not explained by that
fixture error. apply_prepared_design declares compositionId as plain toolResultString,
while review/capture consume a document-lifetime identity. Request binding admission
requires equal lifetime tags; only numeric restrictions can defer to execution,
and string bounds remain structural requirements. The review owner also caps its
document ID at 256 characters while the creation result is unbounded. Its public prepared-application result lacks x-runtime-value:document;
prepare_and_apply_design's compositionIds export does carry that contract. Correct
only the missing grid input, rerun the real staged chain and retain a product RED if
the two identity bindings still reject. Do not weaken lifetime validation, substitute
an ID literal or replace the failing staged path with a different tool.

Staged confirmation: after adding the required order, the exact real browser case
still rejects only the two returned-ID consumer bindings before writes.
`tmp/conversation-stages-reviewed.json` is a permanent RED. Its actual native reply
is preserved in stage-receipts.json. The case is required by the composition Flow
criterion, so it cannot disappear behind passing owner tests. Neither later stage
application nor its repair/template effects are claimed proven by this failed run.

Continue composition verification with a distinct existing-target case, without
replacing that RED: create the initial editable Frame/overflowing child through
public App operations, select it as user context, and submit one host operation plus
an explicit review/repair iteration using those current IDs. Observe real review,
one prescribed mutation and final review through actual acknowledgement POSTs; require
exact final canonical x/y and one Undo/Redo group. Pair it with a transport-only fault
that changes the first real repairable verification verdict to pass before Host
consumption. The same independent canonical-position oracle must reject that false
pass, even if tool status/model reporting remain successful. Never fabricate a
checker response or run a repair from the fixture. This separately proves real
iteration and the oracle sensitivity while the new-result identity route remains
unverified/failed. Same browser suite/Flow/plan scope and focused gates apply.

Existing-target fixture correction: the general workspace-position creation helper
explicitly supports Workspace/Group parents, not Frame parents. Seed the child through
Core's public createElementInParent with parent-local coordinates, the canonical
container owner used by prepared application. Do not add a fallback or change the
App helper's type-specific behavior. The first two failures occurred before model
invocation and are fixture failures, not iteration findings.

Existing-target fixture replan: the next run completed real review -> repair ->
passing review and the corruption arm passed, but the baseline UI correctly reported
partial because durable publication could not be confirmed. Its initial direct seed
was not enrolled in the shared publication transaction, so the remote document did
not have the target before the AI mutation. The screenshot explicitly reports saving
unconfirmed; this is not evidence of a mechanical iteration failure. Create the seed
through a real Framework transaction with the same explicit immediate shared-delivery
options used by App mutations. Require a second browser to converge to that initial
canonical scene before sending the AI request. Then keep the unchanged success and
Undo/Redo assertions and verify peer convergence after repair. This bounded replan
changes fixture setup only; no mocked persistence, alternate status or ignored failure
is allowed. The false-verdict oracle already passed but must rerun on the valid seed.

Browser fixture setup uses the existing App transactionApis facade. A bare package
specifier inside page.evaluate is not transformed by Vite and failed before any
model request; the test now imports the served App facade exactly as existing browser
owner tests do. This does not add an alternate transaction implementation.

Existing-target iteration checkpoint: `tmp/conversation-iteration-facade.json`
records both cases passing without skips. A second browser first confirms the seed,
then the real Host performs review -> repair -> review in one native invocation;
canonical position, peer convergence, Undo/Redo and final success all agree. The
transport-corrupted verdict still produces native success but the unchanged canonical
position oracle catches the incorrect result. Both cases are now required Flow
criteria. This establishes the existing-target iteration boundary, not the failed
new-result staged binding or complete capability coverage. Next run the entire
browser handoff file and scoped types/lint/selector gates before further association.

Whole browser handoff review: `tmp/conversation-handoff-eight.json` reports seven
passing cases and the staged identity binding failure, with zero skipped/flaky cases.
Types, selector identity and naming pass. Lint identified one missing blank line in
the transaction seed; correct that formatting only and rerun lint. The passing
negative controls remain required cases, not a replacement for the positive staged
case. No product implementation was changed.

Independent capability association review distinguishes the actual native registration
from the underlying action catalog. The observed ordinary executor-enabled request
publishes Knowledge, image analysis, references, preparation, workflow, operations and
library namespaces. Basic APIs are acquired through operations rather than advertised
as separate native functions. The all-basic-API delegation test replaces each method
and therefore proves argument ordering only. The delivery audit also substitutes
canonical execution; it proves discovery/envelope admission, not every API's effects.
Those cases remain useful owner tests and must not certify the entire callable catalog.
Actual consumer proofs now cover purpose acquisition, retained inputs and Knowledge,
current-target iteration, creation/grouping/coordinates, images, history, collaboration,
HTTP/native profile rejection and storage-only recovery. Remaining capability-specific
semantic association is not accepted. Neither seven namespaces nor the selected test
file count closes that gap.

The continuous cases planned for this slice have now executed, including a genuine
staged RED. After scoped quality gates, freeze source and run the complete conversation
feature command once to reconcile all owner tests with these new consumer cases on
one source. This is a whole-feature execution observation, not semantic acceptance:
keep spec-coverage-review unaccepted, preserve all three confirmed product failures,
and report any missing or unsuccessful evidence. Do not fix product behavior, suppress
known failures or reclassify the unproven staged suffix. Continue the independently
required semantic association after observing the gate; no full repository or 101 run.

Formal capture admission correction: the first eighth-run launch correctly rejected
an ambiguous selector before starting any process. The same consumed purpose-search
and retention case had been registered under both discovery and retention. Existing
adapter regressions already reject duplicate portable identities, but the narrow
conversation membership test only read filenames. Strengthen that formal test to call
the exact production capture(project) admission used by the command; it fails with
Ambiguous portable selector on the current mapping before changes. Keep one case at
its retention owner; the complete flow already requires that node independently.
Do not duplicate execution, clone a test, or weaken selector uniqueness. This keeps
the full search -> acquisition -> execution -> reuse case required once. The aborted
launch is recorded in conversation-complete-eighth.log, not counted as a feature run.
Rerun the focused evidence gates before the next complete launch.

Scope reconciliation replan: the admitted eighth run (`tmp/conversation-proof-XqA2Sa`)
was explicitly interrupted after independent source inspection found omitted formal
consumers. All 40 started processes settled; the report records cancellation, not
success. The browser filename prefix omitted action-usage and basic-api-actions,
which execute registered owners and canonical publication; it also omitted construction,
containers, organization, editable variants, Fill edits, indexed queries, saved-document
review, drawing inspection and recording framing. Four Node evaluation-lifecycle tests
and the Vitest action-batch-interceptor test under test-data/ai-drawing were absent.
These are formal offline tests, not live 101 sessions. The earlier 323-file inventory
therefore never represented complete feature selection.

Bounded correction: first add an independent scope regression naming these spec-owned
consumers and demonstrate failure against the current selection. Then include their
existing files in the correct runner/environment, preserving resource/time/failure
policies. Enable the existing large-document opt-in for selected saved-document/query
proofs; never count skipped cases as passing. The guarded collaboration/video/7076
stress suites remain Framework benchmark owners, not a substitute for the real
conversation collaboration cases already required here. No render or collaboration
implementation changes are authorized. Run the newly selected files as a focused
slice, review their actual results against current specs and only then repeat the
complete feature command. Mutation scope is selection, its regression, existing Flow
references and this plan; any genuine product failure stays RED. Do not repair the
omission by renaming files or broadening the task to all App/framework tests.

Selection correction checkpoint: the new independent owner-file regression fails
against the prior selection at action-usage. Corrected selection includes 101 server,
137 App, 34 Runtime, 44 Node and 24 browser files. These counts describe selection,
not semantic acceptance. A separate source-association guard scans browser tests for
direct AI imports/endpoints and rejects an unselected, unclassified consumer regardless
of its filename. Its deliberate omission of action-usage is caught. The explicit
spec-owned cases additionally cover indirect inspection/framing consumers. The four
named Framework stress owners remain separately classified; the scanner is a tripwire,
not an inference that lexical matches cover all semantics.

Focused results: the eight selection/interruption cases initially pass; the added
source-association case also passes. All 15 evaluation-lifecycle Node cases and all
seven action-batch-interceptor cases pass. The twelve added browser files are running
with their existing large-document guard explicitly enabled, one worker and current
owned services. Formatting-only lint findings were corrected. No production behavior
or assertion was relaxed, and the three known real-chain failures remain required.

Additional owner run: `tmp/conversation-additional-browser-owners.json` reports 232
passes, four failures and one skip. This does not accept the added scope. The formal
indexed-query test fails because the committed ZIP has not been materialized into its
ignored gzip input; navigation-measurement.md already defines the exact preparation
procedure and the consumer validates the decompressed SHA. The transport-worker test
receives no current isolated WebSocket endpoint in its Node environment. The retained
export case is skipped because E2E_EXPORT_DOCUMENT is unset. These are verification
prerequisite omissions. Prepare the existing fixture only when absent, capture that
ignored input in source identity, and supply both the current owned WebSocket endpoint
and committed recorded-document export input. Do not generate substitute artwork or
weaken checksum/skip rejection. Then rerun these cases with the two still-unclassified
failures: structural history acknowledgement sequence did not advance, and shared
motif application never produced a successful UI result. Freeze files for the browser
rerun as well as the final feature gate. Genuine product failures remain unchanged.

Prerequisite rerun: `tmp/conversation-owner-prerequisites-reviewed.json` executes
all five previously failed/skipped cases successfully with no skips. The gzip input
is the original 126,637,750 bytes and matches the committed SHA-256; it is not a new
101 drawing. The full command now prepares that documented input when absent, captures
its ignored bytes in source identity, and supplies the actual isolated worker endpoint
plus the committed export replay input. Lint, naming and all nine selection/interruption
checks pass. An initial edit placed browser-only environment values in the Vitest
branch; lint caught the undefined ports before execution and the values were moved to
the correct owned browser branch.

The acknowledgement-sequence and shared-motif failures did not recur in the frozen
focused rerun. No product correction was made and their causes are not established;
retain both original observations rather than claiming they were fixed. The added
per-action/basic-API suites execute real canonical owners with explicit case oracles,
but their direct-owner helpers are not evidence of native/Runtime dispatch. Actual
provider/Host/controller chains remain separate required criteria. The expanded gate
must reconcile both classes, known product REDs and every selected file on one source.
Freeze all files for that run; do not combine earlier per-file passes into acceptance.

Ninth complete-command observation: `tmp/conversation-proof-jlKJNO` executes all
340 selected files: server 3,732 passes/two failures, App 1,477 passes, Runtime 523
passes, Node 461 passes and browser 334 passes/one failure. Total 6,527 passes,
three failures and no skips. All 44 processes settled; before/after source, compiled
exports and Flow definitions are identical. The three confirmed product failures
remain: lost native minProperties, invalid acknowledged partial receipt without timing,
and staged produced-ID admission to review/capture. Eighteen diagnostics describe
these three failures and dependent evidence rejection, not eighteen distinct defects.
The earlier structural/motif failures did not recur on this frozen whole run; their
first observations remain retained without a claimed product fix.

Verification-owner review still prevents acceptance. Walking the actual entry's
literal module imports/requires with the project's existing TypeScript parser reaches
19 modules and finds seven existing shared-owner test files omitted from selection:
control-plane snapshot, workspace-sources, contracts, playwright-results, store and
observation-lifecycle, plus flow-files project. This is independent of the runner's
hand-maintained test list. Product test-data owners have no remaining omitted formal
files in the audited roots; direct/indirect browser obligations retain their separate
spec/source checks. A complete-command execution is not complete method coverage.

Next evidence-owner slice: add that dependency-to-existing-test reconciliation as a
permanent regression and prove it fails with the seven omissions before correcting
selection. It supplements the independent product obligations; it cannot certify
semantic coverage by inspecting implementation imports. Run scope admission before
expensive builds/product suites using the same formal test file, so a scope failure
cannot consume a whole feature run before reporting. Preserve actual runner/parser
boundaries and source identity. Run the seven owner files plus selector/interruption
regressions, then the complete feature command again on frozen source. Scope remains
verification orchestration/tests/Flow/plan; no product repair or compatibility path.

The shared-owner focused run detects two verification integration mismatches: the
CLI interruption oracle still expects the pre-preflight process prefix, and ten
native browser handoff cases lack their official functional responsibility mapping.
Correct these at the existing CLI oracle and execute-agent-request mapping; retain
exact process outcomes, case identity and implementation ownership checks.

The shared Playwright parser unit file also contains 44 guarded whole-App proof
runs. Move those existing full-App profiles to their own formal test file, preserving
all guards, original owner faults and recovery assertions. Keep parser units and their
negative outcome oracle in the conversation gate. Share the unchanged raw-report
outcome assertion through the existing test fixture, not a replacement executor.
Replace the profiles' stale fixed case count with exact identities from the maintained
functional/status contracts. This separates gate ownership without permitting skipped
conversation cases or expanding this task into full-App execution. Focused shared-owner
checks must pass before the next frozen complete conversation run.

Shared-owner correction checkpoint: 143 focused cases pass with no skips, including
actual CLI interruption and full official functional discovery. After extracting the
profile-only runs, all 25 parser cases pass with no skips; the added exact-identity
oracle rejects omissions, duplicates and equal-count substitutions. The retained
whole-App owner mapping check passes separately; its expensive opt-in executions
were not run in this bounded task. Scoped lint, conversation verification typecheck,
naming (15 cases) and diff whitespace checks pass. The independent legacy-path
search finds only explicit deletion documentation and permanent absence assertions.
These results close this verification-owner slice only. Freeze source for the next
347-file feature run; keep all three confirmed product failures and manual semantic
acceptance unresolved until the current-source evidence supports otherwise.

Final current-source execution checkpoint: `tmp/conversation-proof-dThnsW` runs all
347 selected files. Server: 3,732 passed/two failed; App: 1,477 passed; Runtime:
523 passed; Node: 596 passed; browser: 334 passed/one failed. Total 6,662 passed,
three failed, zero skipped. All 45 managed processes settled, and original/compiled
source plus Flow definitions match before and after execution. The three product
failures remain native minProperties loss, missing timing in the actual partial
receipt, and incompatible produced composition-ID admission to review/capture.
The staged successor effects remain unproven. The manual coverage criterion and
whole-feature acceptance remain unaccepted; the verifier correctly reports failure.

See the [current evidence report](../reports/conversation-spec-verification-2026-11-14.md)
for normal/fault controls, actual consumer observations, scope corrections and
unresolved owners. This completes the current verification execution, not product
repair or full feature acceptance. No 101 or repository-wide test was run.

Deletion is the first execution stage, before every numbered replacement stage:
remove superseded implementations, their callers, commands and current documentation
references; verify no executable path remains. Preserve valid owner tests and immutable
historical evidence. Only then resume the following replacement stages.

1. **Derive and reconcile authority before selecting tests.** Complete the clause-to-
   case association for every row above in existing App/Runtime flow-contract owners,
   reviewing each relevant spec section and Inspector route. Resolve conflicting old
   clauses and classify every current tool/capability profile and relevant test file.
   Evidence: a removed required capability, a missing shared-owner file, or a new
   unmapped registration is rejected independently of the runner's selected list.
   No implementation can start with an unresolved owner or silently omitted clause.
2. **Prove evidence acquisition before replacing orchestration.** Test the shared
   producer/observation boundary with genuine executed/failed/skipped/empty/interrupted
   subprocesses and deliberately malformed/duplicated/stale reports. Prove exact
   case identity, source/build/environment correlation and the Node adapter boundary.
   First observe failure on existing weaknesses; keep every counterexample permanent.
   A process exit or green Inspector badge cannot replace independent case assertions.
3. **Connect the complete real execution path.** Replace synthetic fixtures by actual
   App adapters, Host ownership, Runtime and downstream consumers. Start with normal
   and failed Knowledge plus data/status/media through the actual native successor
   request, then cover all rows and applicable direct/composed/retained routes. Pair
   semantic input/output assertions with dispatch, load, capture and cleanup counts.
   Prove conditional registration and HTTP behavior separately. Exercise whole chains,
   not separately fabricated producer and consumer values joined in the report.
4. **Install the independently proved feature entry.** Execute the independent
   required cases and relevant maintained owner suites via their actual environments,
   using the validated shared evidence owner. The obsolete verifier, synthetic
   dispatcher and their callers must already be absent; do not recreate their interfaces.
   Update App workflow/debugging docs and existing Inspector/manifests together.
   Search the in-scope scripts, helpers, imports, manifests and docs for remaining
   reachable old paths; an unused-but-callable old acceptance route is not closure.
5. **Challenge the replacement and close only its proved boundary.** Before the full
   feature gate, run permanent negative controls that omit a required case/capability,
   return incorrect selected values, lose acknowledgement/media, misroute continuation,
   alter a saved value, reuse a foreign resource, replay a completed action and corrupt
   execution evidence. These controls must fail at the specified consumer and leave
   legitimate partial completion/storage failure valid. Freeze the final source, run
   the whole AI conversation verification, and review observed wire/state evidence
   against every obligation. Report absent evidence as unverified; test counts cannot
   close the feature. No 101, inference quality claim or full repository gate is needed.

Each implementation stage uses test-first corrections and focused regressions, then
self-review against its spec clauses and direct consumers before advancing. A failing
unrelated product path remains visible and is classified at its actual owner; do not
repair it in the verifier, relax schemas or change the product to fit a test harness.
Concrete product fixes beyond verification wiring require a separately bounded task.
The final feature gate includes bounded offline browser/transport cases needed for
these handoffs; existing high-detail/performance gates retain their own checkpoints.
This is not authorization to run every app or repository E2E/performance suite.

#### Planning self-review and completion conditions

Self-review corrections made before implementation:

- Rejected a new directory-based runner as the design: it would reproduce the same
  circular scope assumption. Spec obligations and independently observed capabilities
  now precede repository test classification and execution selection.
- Extended the design beyond the three reported cases to all conversation handoffs,
  including HTTP, real canonical mutations, UI, saved data, resource lifetime and
  report/cleanup behavior. Optional Knowledge stays optional in the product.
- Distinguished an actual native SDK experiment from the production App-to-native
  chain. The scripted service controls model decisions; production alone creates
  replies and acknowledgements, with assertions at the actual successor request.
- Found that boundary descriptions alone did not specify a continuous test task;
  added six general whole-chain scenarios with independently declared observations
  and forbidden effects, without replacing per-owner coverage.
- Found existing formal evidence owners and an unproven Node integration boundary.
  Reuse requires the stage-2 proof; no blanket trust or unverified replacement parser.
- Kept current useful domain regressions and immutable evidence while requiring
  deletion of executable old verification paths. Historical passing runs are not
  acceptance of the replacement. Existing spec wording conflicts are explicit work,
  never a reason to accept old and new contracts simultaneously.

Planning completion means the owner/input/output/failure and observation route for
all rows is defined and no known structural omission remains in this design. It does
not mean the cases already exist or that implementation feasibility has passed.
Implementation acceptance requires all applicable spec-derived cases with real
handoff evidence, independent inventory reconciliation, negative-control detection,
source-consistent execution, no reachable superseded verification paths and no
unresolved contract conflict. No extra mandatory App workflow is introduced.

### Historical verification plans and results

All sections below are superseded execution records. Commands and implementation
names in these records are not current entry points or acceptance authority.
Use only the spec-derived replacement section above for the active task.

### Verification method correction

November 13, 2026.

Current bounded task: replace the incomplete, manually enumerated `test:ai`
entry with a maintained feature test runner and correct the interpretation of
its evidence. This does not authorize correction of the product findings below.
Editable owners are the App test runner, its permanent tests and manifest,
direct test-entry assertions, this plan, and the App verification documentation.
Production tools, provider behavior, runtime contracts and Inspector semantics
remain unchanged. No live model, 101, full repository gate or remote operation.

The runner must discover the existing conversation test families, including
server, browser, Runtime, Knowledge, provider delivery and evaluation harnesses;
route Node, jsdom and native Node tests separately; and retain failures, skipped
cases, missing reports and process failures. A new test in an owned family must
not require editing a shell file list. The listing must identify the bounded
roots and exclusions. Its result is test execution evidence, never a declaration
that every legal invocation or every specification requirement is proved.

Review starts from the current specification and the entire boundary table below,
not the most recent defect list. Trace registered families through actual provider
instructions, input admission, execution, result validation/projection, retention,
successor-turn reuse and recovery. Check legal, illegal and equivalent inputs,
partial completion, independent delivery/storage failures and resource lifetime.
Use real owners and real downstream consumers for handoff claims. Registration,
schema examples and rejected-null cases establish only their named properties;
mock consumers and Inspector structural tests do not establish semantic parity.
Conflicting current authorities or absent positive-path evidence remain unresolved
even if every discovered test passes. Record these limitations in the existing
review report; do not create another evidence registry or completion score.

Test-first verification: demonstrate that the current entry omits maintained
server/Runtime and newly added family tests; then test exact environment routing,
failed/missing/skipped results and process interruption using permanent runner
regressions. Run those regressions, direct manifest consumers, naming/lint and the
feature gate itself. Existing product failures must remain failures. Complete this
task only when the verification method is executable and documented; the parent
feature remains open until its independent contract and handoff evidence passes.

Verification-method checkpoint: the old entry failed the new server-membership
regression. The replacement discovers 230 files across six runner/environment
groups. Its 24 focused tests pass, including real failed, skipped and interrupted
subprocesses. The full feature execution retained 5,344 passes, 11 failures and one
unexecuted large-document case; every selected file was accounted for and source
fingerprints matched. The feature remains failed. Product code and its failing
assertions were not changed. See the existing review report's verification-method
checkpoint for the exact run and limitations. Ordinary package test wrappers no
longer repeat the server and architecture suites already included by `test:ai`.

### Formal verification handoffs

November 13, 2026. Status: complete. This task implements the two follow-up
reviews of the verification boundary, not a new product workflow. The existing
185-entry dirty worktree is the accepted starting point; preserve unrelated work.

Confirmed findings: the runner excludes AI startup and panel consumers by filename;
its Node summaries do not establish file membership; its source identity excludes
loaded workspace dependencies and compiled exports. The owner assertion decorator
uses static rather than invocation-selected contracts and returns unvalidated model
projections. The information reader ignores the supplied continuation tool. Current
spec paragraphs also contradict the separate Host acknowledgement and rejected-input
resource scope. Independent review probes reproduce all three helper failures while
the formal Host correctly rejects invalid owner and projected results.

Freeze scope to the App verification scripts, shared test fixtures and their direct
consumers, the omitted startup/panel tests, and current App verification/spec docs.
Production Host, Runtime, tool schemas, lifecycle, permissions and drawing behavior
remain unchanged. Use existing discovery roots, registration, direct imports and the
review counterexamples as discovery methods. No compatibility, relaxed validation,
new product flow, live model, 101, full repository tests, dependency upgrade or push.
If a product failure is exposed, keep its evidence and classify it against current
spec before changing scope. Completing this task does not close the parent feature.

1. **Formal Host test boundary.** Add the selected-contract and invalid-projection
   counterexamples as permanent regressions, with valid and partial-delivery controls.
   Remove the decorator's alternate execution/projection path. Direct-owner tests
   remain explicitly owner tests with their domain assertions; they cannot claim
   provider/Host coverage. Full-handoff fixtures construct owners with the Host's
   actual resource ownership and invoke the production Host. Preserve existing Host,
   provider, Knowledge and cross-turn regressions; do not simulate exported resources.
2. **Continuation routing.** Add the unavailable-next-tool regression before changing
   the shared reader. Require an explicit initial invocation and dispatch each returned
   next.tool/next.arguments through the supplied real route. Preserve byte continuity,
   revision and completion checks; no fixed-owner continuation or old signature.
   Step 1 review: the two permanent counterexamples failed before correction. The
   old decorator is removed; original owner assertions remain. Formal Host tests
   retain complete failure receipts and add a valid selected-result control and real
   Knowledge reuse. Step 2 review: the permanent unavailable-continuation regression
   failed before correction; the reader now passes the returned tool identity to its
   consumer, and direct consumers route it or reject a foreign leaf identity. The
   first continuation-focused group passed 219 tests.

3. **Execution evidence.** Include maintained adjacent App consumers independently
   of AI naming, so startup and panel tests cannot silently disappear. Replace the
   obsolete App feature-system initialization assertion with the current Core/App
   ownership contract, including negative duplicate-initialization checks. Verify
   actual Node file results, exact stage identities and malformed report rejection.
   Clean and build the selected App workspace dependency closure using declared tasks;
   fingerprint its maintained inputs and actual compiled exports separately, checking
   source through build and execution and exports after build through execution.
4. **Authority and closure.** Remove contradictory current result/scope statements,
   synchronize verification docs and report limitations accurately. Review each slice,
   run its permanent focused tests and scoped lint/naming, then execute test:ai on the
   final source. No passing selected cases substitute for universal legal-tool proof.

Step execution boundary: the existing ai-execution Inspector's provider/discovery
owner pins input/output contracts, validates final model views and carries resource
ownership. Tests consume this existing contract; no Inspector semantics change is
needed. Test fixture names are internal and non-persistent. The complete flow is
registration -> selected admission -> owner execution -> validated model delivery ->
continuation/retention -> exact test evidence. Failures remain owned by their original
boundary; test adapters must not repair, replay or reclassify them. Each step advances
only after its direct consumers and counterexamples pass.

Step 3 full-feature review: `run-zHsko8` correctly remains failed. Eleven failures
exposed a file-local copy of the old continuation reader in execution-flow-proof;
remove that duplicate and use the shared routed reader, preserving its assertions.
Two newly selected startup failures mock the retired Reactive Events/SceneTree
entry points instead of current Core exports and read DTOs. Update those fixtures
at the public Core boundary and keep scalar/batch/patch work-count assertions.
These are direct test-consumer corrections within the frozen scope, not product
validation changes. Re-run both affected files before repeating the feature gate.
The corrected execution-proof/Host group passes all 94 cases; the startup file
passes both cases. The file-local reader and redundant owner alias wrapper are
removed, with no old call signature retained.

Step 4 review and closure: current scope/result specification paragraphs and the
verification guide now match the formal Host boundary. The final feature run
`tmp/conversation-verification/run-uft8F8/summary.json` passes all 265 files and
5,734 tests, with zero failed/unexecuted cases and matching source/compiled
fingerprints. All 19 dependency builds execute after clean without cache. App and
configured AI-server type checks, scoped lint and naming pass. The preceding
failed run remains retained. See the existing full-flow review report for counts,
regression evidence and limits. This closes the bounded verification correction,
not the parent universal semantic review. No product implementation, compatibility,
relaxed validation, live model, 101, full repository test or push was introduced.

### Typed test handoffs

November 13, 2026. Status: complete. Resolve the 255 App TypeScript diagnostics recorded after the
shared-handoff correction. Scope includes all 36 reported App test files, their
existing fixture helpers and directly implicated canonical owners, Knowledge,
provider and collaboration contracts. Preserve unrelated dirty work. No 101,
live inference, full repository gate, dependency change, compatibility, type casts,
suppression directives or weaker validation. Existing runtime assertions remain;
invalid-input cases must still exercise runtime rejection through a raw boundary.

Baseline and classification use the current App type checker, each reported call
site, the current public method/type and implementation, and the existing execution
and collaboration Inspector routes. The baseline is the formal failing oracle.
A production defect requires a failing behavior regression before its correction.
Do not treat all diagnostics as obsolete tests merely because runtime tests pass.

Self-review finding: the WebSocket test encoder silently supplied missing server
sequences. Remove that fixture compatibility wrapper and invoke the production
encoder directly with explicit ordered sequences. This prevents obsolete inbound
fixtures from being repaired before the actual provider receives them.

Confirmed declaration mismatch: `AppendVectorAnchorPointOptions` omits the
existing `VectorOperationIntentOptions.transientPreview` used by the topology
commit owner. The existing formal structural-preview test both exercises local
patching without canonical writes and fails compilation at this option. Reuse the
shared intent-options type; do not alter preview admission, transaction behavior,
AI tool inputs, or persistence. The focused gate includes the canonical-path and
preview-cleanup counterexamples. This is a declaration correction to an existing
route, not a new Inspector route or runtime behavior.

1. **Canonical mutation and action contracts.** Core owns mutation receipts and
   plural creation signatures; Runtime owns immutable action descriptions,
   permission inputs, previews and progress. Replace obsolete boolean/void mocks,
   stale permission models and executable-action-to-description shortcuts with
   actual current receipt shapes and createAiToolContract. Keep failure/no-op and
   no-extra-write assertions. Include actual Knowledge-to-operation handoffs.
2. **Result branches and retained resources.** Query and receipt owners can return
   unavailable/released or opaque values. Tests must establish required runtime
   shape and snapshot/lease presence before downstream access, not assert types or
   invent IDs. Preserve missing, stale, released and malformed result rejection.
   Check opaque Fill values at runtime before the existing value assertions.
   Distinguish callbacks'
   intended signatures from accidentally narrow mock inference.
3. **Collaboration and UI consumers.** Transport fixtures must provide the current
   frame identity, lifecycle and provider methods. Canonical changes are admitted
   at the backend boundary before document reduction, without importing Core into
   the independent backend. Preserve invalid messages, publication ordering,
   rollback/history, materialization and teardown tests. Typed UI callbacks and
   required progress/activity data must match the real consumer contract.
4. **Review and verification.** Run affected files with their actual Node/jsdom
   environment after each owner slice, including reported non-AI App families.
   Re-run App and AI-server type checks, Runtime build, scoped lint and naming.
   Then execute the complete maintained AI conversation gate with the installed
   offline native fixtures and recorded-bootstrap guard enabled. Missing/skipped
   evidence does not pass. Freeze product/test sources during the final run.

Initial classification: the baseline reports only test-file diagnostics. Confirmed
old fixtures include boolean mutation results, missing progress summary/permission,
removed AiPreparedAction and incomplete collaboration provider/frame shapes.
Conditional/unknown result diagnostics require runtime branch checks; they are not
permission to broaden output types. The Core/backend CanonicalChange mismatch and
materializer inference remain under investigation at their actual boundaries.
Current authorities: ai-execution-flow compose/apply/observe routes; Runtime tool,
permission and progress contracts; Core facade mutation and hierarchy APIs; socket
publication codec and document-session collaboration contracts. No new runtime
workflow or Inspector step is introduced for test-only corrections.

Typed-handoff implementation checkpoint: the 255 baseline diagnostics classify as
112 Agent/Knowledge/action handoffs, 79 query/property/resource tests, 39
collaboration transport/materialization tests, and 25 UI/lifecycle/Feature tests.
All 36 diagnostic files remain formal tests. Runtime shape assertions reject
missing values; canonical descriptions, mutation receipts and typed callbacks
replace outdated fixtures. The only production edit is the shared vector option
declaration described above. No validator, runtime fallback or old contract is
introduced. The wire fixture no longer synthesizes missing sequences.

Self-review also preserved absent-element lookup semantics in the prescribed
position fixture and added a no-write missing-target regression. The initial
full-feature attempt was interrupted before editing; its incomplete result is not
passing evidence. Focused tests, App/AI-server type checks, lint and naming pass;
the final maintained feature run passes on unchanged sources:
`tmp/conversation-verification/run-Zfhn8a/summary.json`, 230 files and 5,373
passing tests, zero failed/unexecuted. Runtime build passed, and source fingerprints
match. App TypeScript has zero diagnostics in `tmp/type-handoffs-types-final3.log`;
AI-server types, scoped lint and all 15 naming checks pass. No 101, live model,
full repository gate, compatibility path or push ran. The typed-handoff task is
closed; test execution does not by itself establish every possible legal tool
scenario or universal specification coverage. See the existing review report for
classification, focused iterations and the unchanged broader assurance limits.

### Shared handoff corrections

Status: the bounded eleven-failure/shared-handoff correction is complete. Final
feature execution `run-5HeAmn` passes 5,372 tests across 230 files with zero failed
or unexecuted cases and identical maintained-source fingerprints. At that
checkpoint, 255 App-wide type diagnostics in 36 test files remained unclassified.
The subsequent Typed test handoffs task above resolves them and reruns the full
feature gate; the earlier execution result did not waive them.
See the existing full-flow review report for exact evidence and limits.

November 13, 2026. Authorized scope: resolve the eleven failures from
`tmp/conversation-verification/run-w15BiE` and the uncovered workflow delivery and
active-contract contradictions through their shared owners. Discovery is limited
to the current full-flow boundaries, actual registration/provider contracts, these
failures and counterexamples, and their direct consumers. Preserve unrelated dirty
work and idle report sessions. No 101, live inference, release work, full repository
test or remote operation. No compatibility, weaker validation or new model approval
flow. Existing legal partial execution and independent storage/delivery failures
must remain distinguishable.

Spec-based classification: the six created-target failures involve dynamic
selected result contracts, ordinary authored-input roots, prewrite rejection of
request-only retention, and resource ownership during input rejection. Five expose
handoff behavior; the sixth asserts a diagnostic chosen before retention admission
and must be checked after the shared path correction. Three query-artifact cases
still expect the removed `ok:false/code:admission` envelope; update their canonical
input-failure assertions without removing dependency diagnostics or successful
real-consumer execution. The fourth masks a cleanup-state assertion with disposal
of a still-open sibling; preserve acknowledgement retry, unavailable failed handles
and sibling ownership. The mechanical test incorrectly classifies unavailable
owner evidence as authored input: preserve operational failure and zero writes.

Execution order and owner cards:

1. **Compose - rejected input and resource lifecycle.** Host owns the call scope;
   leaf admission owns typed rejection and optional repair artifacts. Open a scope
   for rejection handlers without borrowing references from invalid arguments.
   Validate the rejection output and release/transfer resources normally. Use the
   existing recorded direct/sequence recovery regression, add invalid-reference
   and repair reuse counterexamples, and retain cleanup-failure rejection.
2. **Compose - selected contracts and retention.** Resolve public input roots and
   output fields from the same invoked owner contract. A ready batch's validated
   dynamic result must not be treated as a statically guaranteed named-step result.
   Conditional declared fields use actual presence and value validation; unknown
   fields and incompatible values still reject. Proven request-only retention selections
   reject before effects, including alternative output branches. Durable recipes
   retain guaranteed-presence admission. Prove ordinary, staged and direct routes,
   input/result selection, partial recovery and cross-turn Knowledge reuse with
   real consumers; do not bypass raw or projected output validation.
3. **Compose/instruction - one delivery boundary.** Host owns outer retain/delivery.
   A ready part owns preparation and application, not another save/delivery engine.
   Remove accidentally advertised per-part retain/delivery and reject them before
   effects; outer selectors can address `/parts` in input/results, or named sequence
   steps when independent delivery is needed. Remove public response and its old
   full-response behavior; private canvas receipt formatting remains internal.
   Add provider-packet regressions for retired fields and real outer retention,
   selected/default/status delivery, successful prefixes and next-turn reuse.
   Align conversation spec and performance Inspector with the execution spec's
   existing optional Knowledge and AI final judgment, without signed-review,
   criterion-registration or evidence-completion prerequisites.
4. **Full-feature verification.** Correct the old query/mechanical assertions only
   against their canonical contracts and retain their real execution checks.
   Review all changed shared boundaries against the full-flow table, including
   Knowledge, direct/library/composed calls, retention and recovery. Run focused
   owner, Runtime, provider-packet and Inspector tests after each slice; then run
   `test:ai` with installed offline native delivery enabled and the existing
   recorded-bootstrap guard explicitly enabled at this final checkpoint. Missing,
   failed or unexecuted evidence cannot close this task. No drawing run is needed.

Primary authority: execution spec external-result selection, request lifetimes,
typed correction and prewrite admission; execution Inspector `compose` and
`instruction` owners. The performance Inspector's old review prerequisites are a
confirmed contradiction to remove, not behavior to restore. Existing Runtime
schema selection and Host projection are the semantic owners; new identifiers
remain internal and no persisted identities are changed. Test-first failures and
final results are retained in the existing review report and project-local logs.

Owner checkpoint: rejected-input resource scope passes 109 Host/lease tests and
all four recorded recovery routes. Conditional field work exposed a second owner
boundary: general intersection normalization changes durable admission proofs.
The revised slice keeps registered/durable parsing unchanged and resolves exact
supported intersections only for request selections with actual-value checks.
The five conservative-admission regressions remain unchanged. Runtime consumers
import built exports, so the completed feature gate must build that package before
App execution; otherwise source tests and consumer tests can exercise different
versions. This is a validation prerequisite, not release work.

### Previously implemented correction scope

The November 13 spec-based review authorizes a bounded correction of its confirmed
findings, not a new discovery pass. Complete these slices in order:

1. Compose owner - note admission. The input is an authored fact/calculation
   update; the output is either an atomic stored-note result or the existing
   typed input rejection before any note write. Use LocalToolInputError at the
   note owner for schema/duplicate-ID admission, without catching or reclassifying
   source-owner execution failures. Preserve later updates of the same ID,
   detached values, attribution and all original validation. The eight red Host
   route regressions are the initial oracle. Verify corrected follow-ups and
   acknowledged prefixes without replay. No message-based stopper or provider
   patch. The first owner correction leaves two registered-route regressions red:
   the evaluator recognizes composed recovery but omits the declared singular
   execution.value with its one failed call. Admit that existing envelope only
   when root/call/value agree on the owner's correctable outcome and settlement,
   including not-started input rejection and completed identity reads. Preserve
   independent delivery errors, unknown settlement and conflicting call evidence.
2. Knowledge verification - replace the whole-wire contamination assertion with
   authored document/source metadata checks. Force an opaque contextKey containing
   101 so the original false positive is deterministic; keep a negative control
   for actual subject-specific advice. This is an oracle correction, not a change
   to Knowledge generation, lookup, caching or content admission.
3. Contract synchronization - remove the superseded sourceCorrections/evidence
   gate paragraph, retain source identity validation and provenance, and align
   catalog and preparation revision documentation with their canonical owners.
   Confirm current replacement inputs work and old correction inputs reject;
   do not restore removed behavior or add compatibility. Keep Inspector compose
   ownership and its existing no-prerequisite/correctable-rejection contract.

Step execution contract: compose owns input admission and Host delivery, while
Knowledge owns advisory content and its opaque identities. Inspector conditions
for these boundaries are unchanged; their tests must preserve independent
operational failures, valid partial completion and no replay. Review each slice
before advancing. Fixed gates are the note route audit, design-context and
review-free operation tests, input-continuation/evaluation/selected-prefix tests,
Knowledge/corpus tests, actual-provider contract handoff, scoped type/lint/naming
and the existing execution-flow structural checks. No 101, full local suite,
release checks or remote operations. Completion applies to these confirmed
findings, not to every possible tool invocation or the parent plan as a whole.

Correction checkpoint: all confirmed spec-review findings are fixed. The eight
note routes, acknowledged-prefix cases, singular recovery equivalence and negative
controls, deterministic Knowledge oracle and native-only lookup boundary pass.
The final registration audit has 1,371 passing cases; the eight related owner/Host/
Knowledge files have 196 passes. Seven actual-provider and three flow-product
cases pass, as do scoped types/lint, naming and both Inspector checks. The provider
test retains one existing console warning. See the report's correction results
for baseline failures, iterations and exact evidence. No 101 or full local test.

Review the entire AI conversation path from browser submission to final provider
delivery and successor-turn reuse, including all registered tool families and
Knowledge. Derive tool membership from actual registration, not a list of previous
defects. Preserve the dirty feature worktree and idle report sessions. No live 101,
full local test, release work, dependency installation, commit or remote operation.
Do not change geometry/render algorithms merely to broaden this contract audit.

The fixed discovery methods are registration enumeration; tracing each public
entry through its owner, validators, resource lifetime and direct consumers;
comparison of published/provider contracts and executable examples; review of all
loaded Knowledge sources; and legal, illegal and equivalent-input counterexamples.
Finish this discovery pass before production edits. Corrections may touch the
conversation/controller/provider, tool owners and shared handoffs, Runtime
contract execution, Knowledge, their maintained tests, specs and Inspector.
No compatibility, permissive validation, new model prerequisites or second state
authority is permitted. Findings are classified by the first incorrect owner.

| Full-flow boundary                                                     | Authority and permanent verification                                                                                                                                          |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft, attachments, clarification, history and current targets         | Conversation panel/controller/context and their existing UI/controller regressions; asynchronous draft ownership, invalidation, cancellation and exact source associations    |
| Actual provider instructions, registration and discovery               | local-ai-provider plus registry-driven api-delivery-audit; native declarations, usage/full/scoped contracts, examples, identities, result branches and retired selectors      |
| Knowledge discovery, content, dependencies and reuse                   | App Knowledge owner, loaded shared/App documents, Runtime Knowledge tests and actual native successor-content tests; advice cannot contradict executable tool contracts       |
| Direct, library, ordinary/staged sequence and iteration execution      | Shared Host selection and Runtime dispatch; same selected input/output/lifetime contracts, valid and invalid values, dependent work counts, partial outcomes and cancellation |
| Projection, text/images, selected/default delivery and retained values | Result-delivery/media/provider integration; no invalid output binding, no extra execution, independent delivery/storage and precise owner status                              |
| Current-request resources and cross-turn App snapshots                 | Lease and conversation store owners; actual source receipts, same-request use, next-request expiry, portable reuse, foreign conversation/document isolation and cleanup       |
| Final reporting, interruption, recovery and resource disposal          | Provider/evaluation/selected-prefix regressions; correctable input can continue, acknowledged writes cannot replay, failed delivery cannot become execution success           |

Registry-wide tests must enumerate all actual registrations, not silently omit
new tools. Unsupported composition is an explicit route assertion, not a skipped
case. Real owner tests retain domain-specific valid fixtures; generic handoff
tests use controlled owners to exercise independently stricter execution and
model contracts. Do not claim that malformed-null admission alone proves every
tool's successful behavior. Existing semantic owner suites and the integration
families above are part of the final gate even when their files are unchanged.

### Execution order and reviewed handoffs

1. Freeze the registration-derived inventory and full-flow gates above. Strengthen
   registration coverage and cross-route counterexamples before implementation.
   A current valid example, deliberately invalid input/result and equivalent
   route must have distinct expected execution/settlement assertions. Prove the
   tests reject the current violations; controlled defective owners remain
   permanent negative controls rather than production test switches.
2. Compose owner: unify selection of the invocation's execution and model
   contracts. Resolve the execution contract before admission/resource opening;
   use it for output validation and resource transfer before dependent work.
   Runtime may receive the Host's selected contract through its public invocation
   boundary, but does not choose App policy. Keep the registered dependency
   identity pinned, scope resolved contracts to the actual call and reuse the
   existing outer-call evidence map. Direct and composed paths must share this
   selection, not duplicate the current logic. No late model projection can
   substitute for execution validation.
3. Information/retention owner: inspect all published request identities and
   continuations, not just Knowledge contextKey. Declare their lifetimes at their
   input/output producers and preserve them through public projection. Include
   read_design_contracts resultKey/fromResult and contentDelivery.next/contentPage.
   Verify actual same-request use and cross-request rejection, while complete
   portable advice/contracts remain savable and reusable without source replay.
4. Instruction owner: review the complete loaded Knowledge corpus and assembled
   App/provider instructions against current registration. Remove retired
   operations-based contract lookup advice; execute published JSON examples
   against the current provider input contract. Keep domain advice optional and
   avoid copying executable tool contracts into additional instructions.
5. Re-run all full-flow focused gates, including unchanged conversation, provider,
   Knowledge, discovery, composition, retention, resource and recovery families.
   Include installed native transport checks with project-local evidence; these
   use controlled local responses, not a live model. Run scoped type/lint, naming
   and Inspector checks. Review the resulting complete handoffs, not only new
   tests, and report proven behavior separately from unexecuted behavior.

Known counterexamples are execution-contract divergence across native/library/
sequence routes; request-only continuation/discovery identities saved successfully
but rejected in the next request; and loaded Knowledge prose prescribing removed
contract lookup inputs. They are required regressions, not the audit scope limit.

Completion requires current evidence for every boundary above and no known
in-scope failing counterexample. A green repair list or test count is insufficient.
The Inspector's structural check establishes valid architecture references only;
executable product tests establish behavior. Missing evidence stays incomplete.

### Integration review corrections

The complete provider gate found request-lifetime resources published without a
creating-call ownership pin. The resource was still alive, but the legitimate
creator could not export it in its result. Correct this in Host publication:
preserve the request lifetime and explicitly borrow the newly published resource
into the active creating call. Do not relax export checks or make unrelated
request resources implicitly exportable. Prove direct, library, ordinary and
staged routes plus the real capacity-continuation provider cases before closing.

The gate also found two tests pinned inconsistently to prepare_design revision 4
while current admission uses revision 5: a nested-recipe proof dependency and a
provider telemetry assertion. Resolve test dependencies from current registration
and compare telemetry against the proposal's exact revision. Preserve the same
admission, saving, reopening and no-replay assertions. Server transport tests run
in Node; browser conversation tests run in jsdom. Environment-induced URL loader
failures do not justify product changes or omitted checks.

The registration audit fixture duplicated the four library controls under a fake
namespace. Removing that duplication yielded 206 entries in that fixture, but the
subsequent full-flow review proved it still omitted two conditional owners and
the image-to-design preparation adapter. The corrected shared audit fixture now
matches all 208 full-capability provider registrations by complete definition, not
only name or count. This is not the number of eager provider functions. All
entries receive route/admission checks; semantic owner suites separately exercise
valid domain results. The installed registration probe now uses the real model
configuration producer and an isolated project-local home. It supplies a controlled
account response for that configuration-only probe; it does not test personal
login or start inference. Separate provider tests retain account rejection.

### Verification results and limits

The following are distinct handoffs, not a sum of overlapping test counts:

Earlier checkpoint, superseded as a completeness claim by the linked re-review:
1,349 registration/discovery assertions across the incomplete 206-entry fixture;
380 provider/Host tests including the installed registration
probe; 248 Runtime tests; 89 source execution-flow cases; and 12 installed native
text/image transport cases passed. The 19 semantic owner suite files and the 17
non-provider conversation/continuity suite files also passed. The selected native
run filters unrelated cases; its eight opt-in transport cases were explicitly
enabled rather than left skipped. App type checks, naming (15), Inspector structure
(2) and scoped diff checks passed. Scoped ESLint has zero errors and two existing
console warnings in test instrumentation. Logs are under project-local
`tmp/conversation-*-final.log`; checked-in tests are the permanent regressions.

| Boundary                               | Permanent verification                                                                                                         | Result established                                                                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Browser submission and successor turns | conversation, conversation-results, context, presentation, server-action-batch-provider and conversation-panel suites          | Original requirements, source associations, selected targets and portable saved data reach later turns through the current App state.                                                                                                |
| Registration and provider delivery     | api-delivery-audit, local-ai-provider, information-delivery and image-delivery integration suites                              | Current registration, discovery usage, real native text/image delivery and explicit control-plane exclusions are checked. Registry malformed-input checks supplement rather than replace valid owner scenarios.                      |
| Knowledge                              | local-knowledge, knowledge-handoff and knowledge-contract-corpus                                                               | The loaded catalog and its JSON tool examples use current provider-facing selectors; optional advice, dependency loading and no-reload reuse remain valid.                                                                           |
| Execution and recovery                 | local-tool-host, local-tool-operation-composition, selected-prefix-recovery, whole-result-forwarding and Runtime recipe suites | Direct, registered, ordinary and staged execution select the same invocation contract before work; invalid outputs do not feed successors, correctable inputs do not trigger evaluation stop, and recovery retains pinned contracts. |
| Result selection and continuity        | result-delivery, result-delivery-handoff and continuity-boundary-review                                                        | Retention is independent of delivery; selected images, named/final values and portable cross-turn content survive, while request-only capabilities cannot be saved as portable values.                                               |
| Resources and closure                  | local-tool-leases, request-publication Host counterexamples, real provider capacity cases and execution-flow-proof             | Creators can export newly published request resources; unrelated outputs still reject. Resource release, legitimate partial completion, stored recipe reopening and no-replay recovery remain checked.                               |
| Final reporting and interruption       | evaluation-control, evaluation-report-sessions, tool-input-continuation and local-ai-provider                                  | Correctable rejection continues; report sessions, terminal failure, progress isolation and disposal keep their declared responsibilities.                                                                                            |

Self-review caught and corrected an input-error classification regression, late
contract re-selection during cleanup recovery, the request-resource creator pin,
and duplicated registry fixtures. The native protocol probe's fake model-file
configuration was replaced with the actual producer; browser/server environments
are separated. No production validation was relaxed to make these checks pass.

These checks do not prove arbitrary future tools, every possible argument, model
adoption, drawing quality, GPU pixels or live-service behavior. No 101, full local
test or inference was run. Existing report sessions were not contacted. The App
prompt did not gain a new mandatory planning or Knowledge step.

Implementation checkpoint: rejected input receives an owned scope without borrowing
invalid references. Conditional selection resolves supported intersections and
actually present alternative fields while preserving strict persisted-recipe
admission, owner output validation, destination admission and request lifetimes.
Dynamic batch selections validate the actual projected value; absent fields report
completed execution with failed delivery, without replay. Existing request handles
may be delivered within their lifetime but remain forbidden for conversation saves.

Workflow parts now reject nested retain/delivery before work. Outer Host selectors
save source drafts and reuse them in a successor request without model readback.
The public response selector is removed; includeTargets requests domain identity
maps and the private adapter chooses its own receipt format. Recorded fixtures
remain immutable; tests explicitly select current inputs rather than restoring
obsolete fields. Current conversation and performance authorities no longer impose
criterion registration or signed completion prerequisites.

Self-review retained the five conservative durable-schema counterexamples. New
Host tests exercise actual present, absent and invalid conditional results before
a dependent consumer. Query tests preserve failed cleanup retry, sibling ownership,
canonical admission diagnostics and real consumer execution. Mechanical tests
preserve operational failure for missing evidence and typed correction for stale
revision. The verification runner now builds current Runtime exports first and
blocks consumers on failed build; ordinary test failures still allow remaining
feature groups to report their evidence. The first source-stable full run (`run-PkvI24`) exposed three remaining old public
response inputs: selected-contract discovery using a recorded ordered fixture,
duplicate-key repair using a recorded fixture, and browser capacity integration.
Current owner admission correctly rejects them. Update only those test inputs to
the current public contract; keep full/selected schema parity, unknown-field
rejection, exact repaired geometry, real Core root and Undo assertions. The
immutable recordings and private adapter formatting remain unchanged. This is a
consumer-contract correction at the same compose boundary, not another product
exception. Run their focused regressions before repeating the complete feature gate.

Supplemental App-wide type checking exposed unrelated and other existing test
typing debt. The four diagnostics in the edited browser consumer are resolved with
explicit serialized-container assertions; 255 diagnostics in 36 other test files
remain outside this bounded correction and still need individual classification. Do not describe the App-wide type gate as
passing or expand production changes to silence those tests. Preserve that result
separately from the feature execution gate in the report.

## Shared handoff boundary corrections

November 13, 2026. Status: implemented; focused boundary verification passed.

The complete conversation review, including Knowledge, reproduced four boundary
defects: compact creation receipts do not update conversation targets; Knowledge
context keys and nested preparation repair handles lack request lifetime metadata;
equivalent named/final Knowledge retention selectors disagree; and default final
delivery loses the resolved invocation input needed by a selected model contract.
The last defect was demonstrated with a supported invocation-dependent owner,
not attributed to a recorded 101 run. Two existing tests also assume superseded
contracts: Knowledge byte accounting assumes top-level input properties, and an
expired preparation retry expects unknown settlement despite no execution.

Continue in the current worktree without disturbing earlier changes. The bounded
scope is these shared producer/consumer boundaries, their public contracts and
permanent tests. Preserve strict input/output admission, completed prefixes,
independent retention/delivery, image selection, request ownership and document/
conversation isolation. Do not add compatibility, mandatory model steps, new
storage, global caches or prompts as a substitute for execution. No live drawing,
full local test, release work or remote operation is part of this task. Report
sessions remain idle while files change.

Implement and review in this order:

1. **Settled creation -> next request** (`request`). Consume the canonical
   composition identity independently of optional role details. A newer compact
   creation replaces old target hints without inheriting old roles. Use actual
   prepared-action receipts through the conversation controller; cover compact/
   full, partial completion, missing identity and document/target invalidation.
2. **Owner lifetime -> public selection -> App retention** (`compose`, with
   `prepare` as the repair-handle producer). Annotate request-only Knowledge and
   preparation references at their owning schema fields, including nested advice
   references. Preserve portable advice/source data. Named and final selectors
   use the same validated active result shape; static checks may reject proven
   nonportable paths, but must not misclassify a legal optional/union path as a
   broken tool contract. Missing actual fields remain explicit delivery/storage
   failures; no guessed data or weakened required-field validation. Prove real
   Knowledge/Host/App-store handoffs, same-request reuse, successor-request
   portable reuse, request-handle rejection and no source replay.
3. **Resolved invocation -> public projection -> provider reply** (`compose`).
   Carry the completed invocation's input and pinned model contract to default,
   selected, iteration and recovery delivery. Reuse the existing capture boundary;
   do not introduce a second result authority or repeat execution. Add permanent
   direct/composed/default/selected counterexamples, failed-output cases and
   successful-prefix recovery. Validate public replies, not raw schemas alone.
4. **Current contracts -> maintained evidence** (`compose`). Update Knowledge
   accounting to measure actual provider definitions and exchanges. Replace the
   stale expired-retry oracle with explicit no-execution assertions. Synchronize
   the active specification and Inspector, then run the focused boundary suites,
   scoped lint/types, naming and Inspector checks. Preserve existing invalid
   input/result and partial-completion regressions.

Each slice starts with failing permanent regressions before production edits,
then reviews its producer, transformation and direct consumer before advancing.
Reuse existing identifiers and contract helpers; any internal retained invocation
state is request-owned and disposed with the Host. No public identity migration
is needed. Current scoped tests and exact handoff observations establish closure;
they do not claim live-model choices, GPU rendering or every possible tool input.

### Verification and limits

- Creation receipts now advance the conversation target independently of optional
  role mappings. The permanent regression executes actual prepared actions and
  submits the successor conversation request; compact/full delivery agree on the
  new root and never inherit prior roles. Conversation/action/provider tests:
  136 passed.
- Knowledge and preparation schemas declare the lifetime of their own references.
  `read_knowledge` revision 6 and `prepare_design` revision 5 replace the previous
  revisions. Named and final retention use validated public values; optional or
  union-shaped portable values remain legal, while actual request references and
  missing selected fields fail explicitly. Real Knowledge/Host/App-store tests
  prove same-request reference reuse and successor-request advice reuse without
  another source read. Discovery, Knowledge, preparation and workflow tests:
  254 passed, 2 skipped (not included in the passing evidence).
- Runtime passes the completed call receipt to the result observer. Host pins the
  resolved input and model contract before child execution and shares one public
  projection across selected/default delivery. The invocation map is cleared on
  every outer-call exit. Direct, registered, sequence, retained, iteration and
  partial-recovery counterexamples check valid and invalid output, execution and
  projection counts, and preserved partial settlement. Host/result/retention suites:
  260 passed; Runtime admission/execution/Knowledge suites: 193 passed.
- The native-provider protocol regression inspects the actual contract reply,
  including nested Knowledge request lifetimes: 1 passed. It uses the normal
  provider integration with controlled native transport, not a live model.
  The selected-contract execution proof passed; Inspector contract checks: 2 passed.
- Knowledge byte accounting includes identical actual definitions in both
  strategies, without rewriting a fictional older schema. Expired preparation
  retry asserts `not-started` and unchanged execution count. Four direct-consumer
  test typing defects were corrected without weakening their assertions.

Scoped App type checks, Runtime build and naming checks passed. Scoped ESLint has
no errors; three existing test console warnings remain. No full local test, live
101 run, model-choice claim, GPU verification, commit or push was performed.

## Complete handoff corrections

November 13, 2026. Status: implemented; focused handoff verification passed.

This task corrects four confirmed findings from the complete-flow review. Work in
`codex/ai-conversation-improvements` preserves the existing dirty worktree, fixed
prompt, recorded evidence and retained report sessions. The scope is the following
four handoffs and their direct contracts, consumers and permanent tests. No new
mandatory planning, lookup or retention; no compatibility route, renderer redesign,
live drawing, full local test or remote operation. Original AI replies must remain
idle during file edits. Discovery follows these owners and their direct callers;
new unrelated findings are reported rather than added to this task.

1. **Declared lifetime -> projection -> selection -> App storage -> reuse.**
   The Compose owner carries the validated public result contract to retention;
   input selection uses the same public argument path as its schema. Lifetime
   belongs to a declared field/subtree, never every scalar with an equal value.
   Remove value-based taint collection and its old tests. Preserve schema-based
   early rejection, request artifact leases, secret exclusion, truthful storage
   failure, independent delivery and conversation/document isolation. Cover root,
   nested/escaped paths, arrays, references and active union branches, ordinary
   steps, public input and final-result selectors. Real Host + App storage tests
   must save and consume portable values in a successor request, reject actual
   nonportable fields, and treat identical portable values consistently when an
   unrelated request stamp changes. Do not add a second storage or provenance
   registry. Compute path evidence only for selected retention, using the current
   invocation's validated schema/value.
   Include the successful final iteration check in this handoff, with its resolved
   input and validated result. Intermediate repairable checks are not final
   delivery; failed iterations must not publish a successful final selection.
   Use the selected invocation input schema too: a static descriptor may omit a
   request lifetime declared by the wrapper's current selected child contract.
2. **Producer schema -> request admission -> resolved input -> executor -> receipt.**
   Runtime owns structural assignability. Apply the existing request-only numeric
   refinement consistently inside objects, arrays and declared alternatives, while
   keeping required fields, extra-field policy, types and resource lifetimes.
   Durable recipes retain static guarantees. The unchanged executor validator
   rejects invalid resolved values before the consumer runs, preserving completed
   predecessors and preventing dependent writes. Equivalent whole and fieldwise
   bindings must agree; tests execute both forms and assert execution counts,
   actual values, invalid range/type/missing fields and nonportable boundaries.
   No coordinate-specific exception or opaque-object bypass.
3. **Target intent -> assembled provider instructions -> registered operation.**
   Remove the unconditional local-change spatial-lookup rule. Known targets remain
   executable directly; spatial discovery and child enumeration retain their own
   meanings when information is missing. Check the actual assembled native packet,
   then execute known-ID edits and legal spatial/hierarchy queries through published
   routes, with invalid targets still rejected. Do not assert which tool an actual
   model will choose or introduce another mandatory guidance step.
4. **Canonical parent -> render hierarchy -> attachment/conversion -> child -> capture.**
   Replace the coordinate test's fabricated rotation and flat lookup with the real
   canonical update and render projection path. Verify translated/rotated and
   nested parents, parent updates, missing targets and out-of-range rejection.
   Equivalent world/local descriptions must produce the same canonical placement;
   derive the expected transform independently of production conversion. Capture
   may use a controlled image sink, but its actual target and transform must come
   from current hierarchy. Verify ordinary Runtime completion, not only the inner
   Host receipt. No GPU-pixel or live-model claim from headless tests.

Inspector owners: `compose` owns result selection, provider instructions and
Runtime integration; `request` owns conversation storage; `inspect` owns canonical
attachment reads and capture. Re-read their current flow before each slice. The
implementation boundary is local-tool-leases/result-delivery/host/design-sequence,
recipe-schema/admission and their direct tests, ai-domain-prompt and actual-provider
integration tests, coordinate-handoff integration and the existing render test
composition. Production render changes require a reproduced canonical defect.
The canonical rotation regression exposed the official Preset Group strategy:
it projected x/y but omitted rotation during creation/reload, although the update
path applied rotation. This is the reproduced canonical defect allowed by slice 4.
The nested-parent counterexample and direct strategy regressions reproduced the
same omission in Frame and Rectangle. Correct these three official strategies
and their permanent transform regression;
keep engine architecture, transform-group ownership and child geometry unchanged.

Update active specification, Runtime reference and Inspector conditions with each
changed contract; remove superseded statements rather than retaining two rules.

Each slice first runs or strengthens a formal failure and counterexamples, then
changes its owner, reviews its upstream/downstream paths and runs focused checks.
Final verification combines these focused suites, scoped lint/types, naming and
Inspector checks. Report each proven behavior, deliberate testing boundary and
unexecuted live/GPU behavior separately. Passing counts never substitute for the
handoff assertions. The prior rotated-parent adapter result only proved transform
arithmetic; it did not prove canonical rotation propagation.

### Verified results and limits

- **Retention:** real Host execution and App conversation storage now preserve
  portable coordinates even when they equal request stamps. Named/final public
  output and public input selections use their selected invocation contracts.
  The successor Host consumes saved values directly, without rerunning the source
  or returning its data to the model. Illegal request fields reject, including
  lifetimes introduced by invocation-specific input schemas. The final iteration
  handoff regression also passes: only its passing check becomes a stable result.
  Formal coverage lives in `continuity-boundary-review`, `local-tool-leases`,
  `result-delivery`, `result-delivery-handoff`, `whole-result-forwarding-review`
  and `local-tool-host` tests.
- **Binding:** whole objects, arrays and fieldwise numeric inputs pass through the
  same request admission and actual destination validation. Out-of-range values
  stop before the dependent owner runs; successful predecessors remain recorded.
  Required fields, types, extra fields, resource lifetimes and durable guarantees
  still reject incompatible bindings. Runtime admission/execution tests and the
  real Host counterexamples pass.
- **Instructions:** the assembled provider startup packet no longer requires a
  region query for every local change. Known-ID edits remain direct; spatial and
  hierarchy queries retain their own contracts. Provider packet and actual target
  routing regressions pass. This proves available instructions and executable
  routes, not which route a live model will choose.
- **Coordinates:** canonical creation, real nested render hierarchy, attachment,
  world/local conversion, child creation and capture run in one Host request.
  Missing projection and invalid coordinates reject; equivalent local/world
  inputs converge. Group/Frame/Rectangle initial rotation, explicit reset and
  omitted-angle reset pass. Parent updates and save/reload preserve the current
  basis. The Runtime completes normally, and capture receives the actual parent.
  The capture sink is controlled: no GPU pixel or performance claim follows.

Final checks: 258 App handoff tests, 151 Runtime admission/execution tests,
25 Preset group/pose tests, the selected provider startup test and four target
routing regressions passed. Inspector contracts (13 checks), naming (15 checks),
Runtime/Preset builds and scoped type checks passed. Scoped ESLint has no errors;
the existing provider-test console warning remains. No full local test, live 101,
remote operation or retained-session follow-up was run. The wider parent plan,
live model adoption, visual output, collaboration and performance are not certified
by this bounded task.

## Provider instructions and evaluation continuity audit

November 13, 2026. Status: confirmed corrections implemented and focused validation passed; no new live drawing was run.

### Task boundary

Update this plan and its index with confirmed causes, whole-flow evidence and an
ordered correction proposal. Audit current instruction producers, actual provider
packets, the live runner and all its imported test helpers, report/follow-up and
stop owners, and the plan/identity/coordinate/retained-result consumers and tests.
Read scope follows these paths; mutation scope is the ordered correction proposal:
provider instruction/notification handling, live evidence verdict and provenance,
declared inspection handoffs, their direct consumers, permanent focused tests,
and corresponding active documentation and Inspector contracts. Preserve
recorded runs, the fixed drawing prompt, open original sessions and unrelated
worktree changes. Do not add mandatory planning, lookup, retention or review
steps; do not start another drawing, run full local tests, or push. No file
edits while the original AI is answering. Completion requires source-to-packet
traces and focused regressions of the acceptance cases, not another self-report.
Unproved hypotheses require counterexamples before production changes.

### Implementation slices

- Observe owner: prove invalid submissions cannot pass final evidence closure and
  normal context compaction is legal during reporting; preserve tool prohibition,
  original failure, same-session reporting and independent artwork acceptance.
- Compose/discovery owners: exercise assembled instructions against current
  search/read contracts and remove conflicting selectors at their source.
- Inspect/target owners: declare actual attachment outputs; prove bindings,
  coordinate semantics and target ambiguity before changing target selection.
- Request/continuity owners: verify optional retained inputs through ordinary
  continuation without requiring reads, saves or another planning step.
- Closure: review direct consumers and focused regression results. Naming baseline
  passed before identifier changes. No historical benchmark evidence is edited.

### Implementation evidence

- Observe regressions reproduced report compaction rejection and successful closure
  despite an invalid fixed-prompt submission; both now pass with native tool
  prohibition and original failure preservation intact.
- The attachment wrapper integration exposed an earlier boundary than the missing
  bounds schema: the read action omitted composition eligibility, so Host treated
  it as a native control before binding validation. This read-only action may be
  composed in the current request; its canonical stamp remains transient. The
  correction includes both eligibility and the declared bounds, with a negative
  missing-transform case. Rotation assertions use numeric tolerance, not exact
  floating-point equality.

### Bounded handoff refinement after the pipeline counterexample

The full preparation -> actual parent -> conversion -> child -> capture proof
found a second boundary: request admission rejects an unbounded numeric output
bound to a bounded numeric preparation input, even when the actual value is valid.
Using generic property patches instead also lacks declared nested fields; do not
route around the owner or weaken those schemas. Keep the original prepared-child
route. Extend only the request-step numeric handoff in Runtime admission: retain
numeric type and lifetime compatibility, validate the actual number against the
unchanged destination contract before its dispatch. Durable recipe admission stays
statically guaranteed. This extends mutation scope to recipe-schema/admission and
their focused tests/docs; no renderer changes or general opaque-field bypass.
Prove valid translated/rotated values, out-of-range rejection before child creation,
unchanged durable admission, incompatible types and request lifetimes. Prior work
must remain a truthful partial result, without replay or capture after rejection.

### Implemented results and verification limits

- Observe: fixed-run closure now includes recorded invalid submissions/environment
  errors and late evidence failures, preserving the first failure. Source/build
  manifests include ignored App builds. Normal report compaction no longer trips
  the tool prohibition; actual tool items still reject. Unlimited same-session
  reporting and separate work/persistence outcomes remain unchanged.
- Compose: the actual provider developer block uses registered search/read names
  with their correct arguments. Assembled declarations accept the intended routes
  and reject the obsolete selectors. Search descriptions no longer repeat retained
  contract-read instructions. Organization/arrangement do not require redundant
  reads for known targets. Removed conflicting visual approval/binding prose from
  the active spec and Inspector; mechanical checks remain authoritative.
- Inspect: attachment reads now declare request composition, nullable bounds and
  basis semantics. The real wrapper regression first failed on composition
  eligibility, then on the missing bounds path. Both are repaired. Exact canonical
  type filtering remains unchanged, including custom types and valid empty results.
- Numeric handoff: the November 12 parent/section positions are preserved in
  `coordinate-continuity-20261112.json`. The canonical preparation/Runtime/Host
  pipeline creates the parent, reads its attachment, converts, creates the child
  and captures in one request. Translation and injected adapter rotation pass; canonical rotation propagation remains unproved by that test. Out-of-range input
  fails before child creation/capture, preserves the completed parent and remains
  correctable under the existing evaluation stop classifier. Numeric type/resource
  lifetime restrictions and durable recipe range guarantees remain unchanged.
- Continuity: ordinary browser result exchange feeds a successor Host directly.
  Saved root/source metadata is delivered without private values; named inputs are
  consumed without a model read. An unused saved value remains valid. Existing real
  geometry, saved-target and capture integration cases also pass.

Focused results: Runtime admission/execution 139; App browser/action/context and
coordinate handoff 181; selected provider lifecycle/delivery 9; recorded continuity
5; benchmark/evidence/Inspector Node tests 37. Naming gate 15 tests passed. Runtime
build and both App/server type configurations passed. Scoped lint has zero errors
and three existing console warnings. No full local test, live 101, commit or push.

The headless coordinate proof uses real transforms and canonical owners with a
render lookup/capture adapter; it proves identity, coordinates and execution order,
not GPU pixels. Ordinary completion tests retain real action/conversation/presentation
owners with controlled persistence receipts; they do not certify live durability.
No healthy-report watchdog termination was reproduced, so its safety policy was
not changed. Compact receipts cannot alone identify the task's main root: child and
independent-root counterexamples prevent a last-created-target guess, but no new
automatic task-root policy was introduced. Model adoption and visual quality remain
unmeasured until a separately requested live run.

### Confirmed observations at audit entry

Evidence root: `tmp/conversation-improvements/live/taipei-101-fixed-1794482034291`.
Provider request: `06d19b52-cc54-4e1e-98e3-b0da7fbefbc0`; its `3-input.json`
payload contains the actual instruction blocks. Same-thread clarification:
`followup-01a1cfab-9f85-7251-a663-065563f0b812.txt`.

- `local-ai-provider.ts` still tells the provider to discover by purpose using
  `read_design_contracts query`, contradicting the search/read split in the
  other delivered blocks and the tool schema. The instruction test checks only
  the sentence prefix. Prior claims that all conflicting discovery prose was
  removed were too broad. This run used the correct search tool; the conflict
  does not establish the cause of its coordinate mistake.
- Prepared child geometry uses parent-local coordinates, explicitly stated in
  the delivered contract. The AI reused workspace-projected input under an
  offset parent. Prepared group origins come from bounds, not the projection
  origin. Its later correction subtracts the actual parent offset. The existing
  coordinate conversion API was available; no renderer fault is demonstrated.
- Stage intentions were not submitted as executable stages. The AI retained
  original drafts and the building root, but not three created section roots.
  `delivery: status` did not prevent retaining those returned IDs. Subsequent
  root-child enumeration encountered 3,707 children and the AI guessed `Group`
  where the actual type is `group`. The filter contract accepts an unexplained
  string. Separate model choices from a discoverability gap.
- The original AI attributed six coordinates to a calculator, then retracted
  that claim when asked for evidence. Recorded activity contains web search,
  not six calculator receipts. Self-report is testimony, not an independent
  execution oracle; the earlier conversational analysis's calculator attribution needs this
  qualification.

### Instruction delivery audit

The actual `3-input.json` contains 50 native definitions in seven namespaces and
182 App action definitions. These overlap; they are not 232 different abilities.
The final drawing input exposes three final-response actions, while drawing tools
travel separately. Audited instruction producers include `ai-domain-prompt.ts`,
`local-ai-provider.ts`, owner-generated main-tool scope, registered tool descriptions,
selected contract delivery, conversation history, retained-result metadata, native
configuration, and report/follow-up instructions. Source paths below are relative
to `apps/asyra-design/` unless qualified.

| Layer                                | Actual evidence                                                                      | Finding                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App/base instructions                | App 10,249; operations 5,764; main scope 3,505 UTF-8 bytes                           | Role allocation, optional Knowledge, direct IDs, staged execution, retention and final visual judgment already exist. Do not add another compulsory planning or Knowledge step.                                                                                                                                                                                                                           |
| Developer response instructions      | 3,483 bytes; `server/local-ai-provider.ts:2417`                                      | Conflicting `read_design_contracts query` instruction survives in a separately maintained block. Its eager-tool list omits search although search is eager. Replace duplicate route ownership, not only this sentence.                                                                                                                                                                                    |
| Tool descriptions and selected usage | Three eager definitions total 14,846 serialized bytes; all definitions 244,270 bytes | Registration bytes are not all initial model-context bytes: most definitions are deferred. Search/read descriptions share irrelevant retained-contract prose; organize/arrange say to read first even though known targets need no preliminary read. Distinguish actual dependency from advice.                                                                                                           |
| Drawing user input                   | `self-report-evidence.json.workInput`                                                | Fixed prompt unchanged, empty initial document, no attachments/prior turns; evaluation questions removed before drawing. Work deadline announcement disabled. This run was not secretly given report questions as drawing instructions.                                                                                                                                                                   |
| Native configuration                 | `server/native-provider-config.ts`; thread/start validation                          | App instruction blocks are recorded, but accepted global instruction source identities and the effective merged native instruction stack are not recorded. Global home AGENTS sources are permitted; bundled model metadata also contains base instructions. This is an observability gap, not proof they were applied or caused this error. Do not call App-owned blocks the entire model system prompt. |
| Report and follow-up                 | Original native thread, distinct turn IDs; report/follow-up inputs retained          | Questions identify self-assessment and uncertainty; App tools and external tool items are blocked. No report time limit in this runner. Do not treat the AI's reconstructed intent as measured evidence.                                                                                                                                                                                                  |

Total recorded App instruction text is 23,001 UTF-8 bytes. Eight exact-contract
replies total 87,024 bytes; they are separate acquisitions, not one oversized
reply. Their byte counts are 21,120 / 6,832 / 11,474 / 5,488 / 5,765 / 16,435 /
15,700 / 4,210. No repeated page acquisition is demonstrated. One unused
vector-pattern read was the AI's choice. The separate construction and capture
replies sum above the 23,000-byte information page budget, but that sum is not a
measurement of their combined response. Measure the actual combined owner output
and its pagination before claiming either fewer calls or inevitable pagination. Never compare serialized bytes
to token consumption or charge all deferred declarations to initial reading.

The actual definition inventory has no `correct_input`, `dataEvidence`,
`run_recipe` or `describe_design_apis` residue in its serialized declarations.
That positive inventory check does not clear free-form instructions or prose specs.
Current `specs/ai-execution-flow.md:3396` still discusses global visual/source
obligations, and `:3922` prescribes supersedes/unit/review-binding behavior removed
from the current inspection contract. Later sections explicitly reject those
obligations. Clean current authority; preserve immutable historical reports.
Do not remove legitimate optional mechanical checks because they use similar words.

### Plan, identities, coordinates and saved context

| Handoff                                 | What this run and current code establish                                                                                                                                                                                                                                                                                                              | Classification                                                                                                                                                                                                                                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent to execution                     | Public stage commentary is intent; submitted `operations` are the executable sequence. No `stages` were submitted. Host binds declared dependencies; it does not infer omitted artistic intentions.                                                                                                                                                   | Existing capability; no evidence that a missing mandatory plan caused failure.                                                                                                                                                                                                                                      |
| Creation to later identities            | E1 payload 84 saves base root and two drafts; E2 payload 123 saves crown/podium drafts, not their roots. Later E8/E9/E10 do save new roots. `/compositionIds/0` was available throughout.                                                                                                                                                             | Model selection; retention did not discard requested IDs.                                                                                                                                                                                                                                                           |
| Compact receipt to next App turn        | `src/ai/design-actions.ts:555` returns root identity without role maps in compact mode. `src/ai/conversation.ts:604` updates even the root only when role maps exist. Final source snapshot has eight acknowledged roots and `targetHints.compositionId: null`.                                                                                       | Confirmed compact/full hint asymmetry; no ordinary next-turn failure was observed in this run. Do not fix it by promoting every new root to the main task target: the final created root is a detail child of the building. Root selection semantics need an explicit owner decision before changing this consumer. |
| Query identity vocabulary               | E5 payload 188 requests `filter.type: Group`; actual created type is `group`; E6 exact names succeeds. `context-schema.ts:50` accepts a free string and `design-context.ts:104` compares exact values.                                                                                                                                                | AI guessed; owner contract does not explain canonical registered type values. Publish their source/meaning without aliases or a fixed list that excludes registered custom types. A valid filter with no matches remains a legitimate result.                                                                       |
| Original geometry to new parent         | E1/E2 reuse a workspace-oriented projection under the offset base. Preparation rebases a Group to derived bounds (`server/design-preparation.ts:396`); that Group origin is not projection.origin.                                                                                                                                                    | Confirmed authoring error with a cross-tool semantic explanation gap, not a broken renderer or missing numeric primitive.                                                                                                                                                                                           |
| Parent observation to bindings          | `read_design_attachment` returns parent identity, basis, bounds and stamp (`src/common-apis/inspection-evidence.ts:214`). Its public output schema (`src/ai/inspection.ts:202`) declares basis but omits bounds although its description promises them. Open output permits the actual value; it does not publish typed bounds paths for composition. | Confirmed output declaration omission. This run did not call it; do not attribute this run's failure to that unexercised route. Binding rejection needs a formal regression before implementation.                                                                                                                  |
| Saved context to continuation           | Browser `conversation-results.ts` stores immutable selected values with name, source operation/path and bounded shape. `server-action-batch-provider.ts:438` sends that index next turn; named bindings read privately. Saved original draft remains original after repositioning.                                                                    | Existing behavior; 13 names, seven used, six unused is valid. An original-input save is not current document geometry.                                                                                                                                                                                              |
| Root hint vs saved target vs live state | `aiTargets` is one revalidated composition hint, not an index of every planned section. Named context stores selected values; SceneTree remains current truth. Root existence is rechecked at submission.                                                                                                                                             | Keep these owners distinct. Do not create another plan/geometry registry or silently turn saved snapshots into live values.                                                                                                                                                                                         |

The actual correction subtracts parent position (5578.087073967879,
34920.10644240931) from all three section positions. That is valid for this
translation-only case, not a general rotation/scale conversion. Existing
`core.workspaceToElementLocal` and `read_design_attachment` provide current basis
capabilities. The coordinate integration fixture mocks the parent render lookup
and exercises one translated point; it does not prove the complete prepared
Group -> canonical parent -> saved input -> later child path or rotated parents.

The current browser retention test proves private reads and next-request metadata
using a mocked HTTP stream. Conversation target tests use full role maps. Those
are useful component tests, but neither proves the compact real receipt reaches
the next provider packet with valid target identity. The live test starts fresh
and its later turns are report-only; it cannot close ordinary cross-turn editing.

### Test toolchain audit

Reviewed the fixed runner and all its imported helpers: live contract/environment,
self-report collector, report-session client, deadline worker, snapshot transfer,
video export and framing. Followed their server control/session/notification paths,
ordinary finalization, browser result projection, current focused tests and
Inspector observation contract. Also compared the separate Knowledge evaluation
runner/source-capture helper and execution-report policy. The latter are not the
fixed drawing entry and their historical limits must not be copied into it.

| Boundary                             | Evidence and consequence                                                                                                                                                                                                                                                                                                                                                                               | Proposed handling                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Work completion vs report completion | `local-ai-provider.ts:2565` saves work final text then replaces it with the report, returning before ordinary `preparation.resolveBatch` and `operations.settleOutcome` at `:2885`. Actual work says completed; App settlement says partial because the report is forced unsupported. Docs already describe this distinction, but the live result cannot validate ordinary final admission/durability. | This is documented diagnostic isolation, not itself a product defect. Retain its distinct status and limit live-run claims. Prove ordinary final admission and browser durability through paired focused integration cases. Do not move finalization into reporting or execute a final batch twice merely to make the harness look like ordinary use.                       |
| Fixed-prompt guard                   | Runner `:261` catches submission assertion failures into `meta.errors`; final exit policy checks `evidenceErrors`, not `errors`. Page errors are also only accumulated.                                                                                                                                                                                                                                | Invalid fixture/context submissions must invalidate the benchmark. Retain evidence/report when safe; do not relabel every console message as fatal. Classify actual page/service failures explicitly. This run has empty errors, so contamination is not established.                                                                                                       |
| Report protocol                      | Provider `:1872` rejects every report item except messages/reasoning/plan; the normal `contextCompaction` handler occurs later at `:1951`.                                                                                                                                                                                                                                                             | The inspected event path rejects contextCompaction before its normal handler. Regress that exact event through provider notification admission before changing it. Preserve tool prohibition; do not allow every non-tool-looking item. No such failure occurred in this run.                                                                                               |
| Drawing watchdog                     | Runner arms an owned-process watchdog at drawing deadline + 30s, retires it only after report-input observation; provider waits for in-flight tasks before that event.                                                                                                                                                                                                                                 | This can terminate a stuck work-to-report transition and is also an intentional process-safety guard. Do not declare it a report timeout or retire it on work completion while writes may still be draining. First prove false termination of a healthy report with a controlled delayed-observation case; otherwise retain the guard and identify the actual failed phase. |
| Test source identity                 | Fixed runner records HEAD only and launches existing backend/collaboration dist. Dirty source and actual build fingerprints are absent. `source-snapshot.json.gz` is document state, not source code.                                                                                                                                                                                                  | Reuse the existing `knowledge-evaluation/capture-source.mjs` source identity concept with a bounded owner scope and actual launched builds; exclude secrets and mutable evidence. Do not copy its older prompt, report timeout or collector. No evidence that this run executed stale builds.                                                                               |
| Failure/continuation                 | Validated final native App reply now controls stopping; successful inner work and corrected input remain distinguishable. Native external items take another path. `correctableInput` still decodes multiple owner envelopes.                                                                                                                                                                          | Cover every registered result family and both native routes with typed owner fixtures. Input rejection followed by correction must preserve the same drawing turn and completed prefix; unknown execution/delivery loss must remain visible. Do not simplify by ignoring all failures. Latest successful run alone exercises no rejection.                                  |
| Report evidence                      | Report receives at most 32 recent action receipts, with explicit omitted counts; this run has 39, seven omitted, and three omitted batches. Model timing/discovery byte metrics are not in that digest.                                                                                                                                                                                                | Derive exact metrics from existing correlated records, separate outer AI dispatches from Host steps, and give only the needed measured summary to the report. Keep missing causes unknown; do not request hidden reasoning.                                                                                                                                                 |
| Recording/reload                     | Auto-fit runs only at settled frames, pauses for deliberate detail navigation, preserves document state; video exports before browser disposal. Canonical document equality and persistence receipt are separate checks.                                                                                                                                                                               | Preserve. These prove evidence continuity, not subject fidelity or correctness of every geometric decision. A source-string test checking `.tick()` presence is not end-to-end runner proof; existing real framing fixture is useful.                                                                                                                                       |
| Retained session                     | Same native thread IDs are checked, report timeout is null, follow-ups are queued and recorded; original browser closes after evidence.                                                                                                                                                                                                                                                                | Preserve report-only continuity. It is not an ordinary editing continuation or proof that browser-owned saved context survives reload.                                                                                                                                                                                                                                      |
| Alternative evaluation/report tools  | Historical Knowledge runner is explicitly evidence-only in README; its 60s report timeout and alternate prompt are not used here. Profiler policy omits old reviewTool, so legacy plan/visual-review fields remain unavailable, not evidence of missing current AI verification.                                                                                                                       | Keep entry purposes explicit; do not compare alternate runs as the immutable benchmark. Remove superseded active interpretation, not historical evidence or legitimate separate tools.                                                                                                                                                                                      |

An additional stale test title calls `LIVE_TEST_LIMIT_MS` fifteen minutes while
asserting 1,080,000 ms (18 minutes). It belongs to the generic historical runner;
the fixed runner uses 900,000 ms and its own override. Correct the misleading
ownership/title rather than change the fixed drawing budget to satisfy that test.

### Second review: counterevidence and constraints

The first audit mixed confirmed defects, missing coverage and design choices in
one correction queue. That would risk another broad change without a proved cause.
The following corrections supersede those implications:

- Diagnostic `unsupported` is documented in the development guide and separately
  projected in `evaluation-window.ts`; it is not an incorrect drawing verdict.
  Ordinary `report_outcome(completed)` confirms persistence in browser
  `src/ai/actions.ts:1316`, after the provider returns. Merely calling the server's
  final batch resolver before reporting would not exercise that browser boundary.
  Executing both final batches could add a second terminal action. Keep reporting
  independent and establish the specific missing coverage before proposing a rewrite.
  `src/ai/__tests__/actions.test.ts:413` already checks completion/durability;
  `:460` carries durable/local-only/unavailable results through the real action,
  conversation and presentation with a mocked persistence callback. Server tests
  also cover final-write rejection and final preparation resolution. Preserve these
  tests; do not describe ordinary completion as wholly untested.
- Missing compact hints are real, but blindly accepting each root would select
  `design-4749e19c-b794-445d-9216-af3134c1c72f-0` (detail components) instead of
  `design-7f67319b-2e6e-4adf-8624-3b3c1187c51d-0` (building). The canonical final
  snapshot places the former under the latter. A root of a created part is not
  necessarily the root of the user's task. Named saved IDs already preserve this
  distinction; do not create another automatic task-root heuristic.
- A nullable transformed point is not a complete prepared-geometry conversion.
  Prove the actual parent created by preparation is queryable in the next Host
  step, and that subsequent geometry uses that basis. A rotation also changes
  orientation; translation subtraction alone is insufficient. No new transform
  primitive is justified yet, but existing single-point tests do not prove that
  every needed geometry handoff is already solved.
- Attachment `bounds` is undeclared, not proven lost in transport. Its schema is
  open. `recipeSchemaAt` requires a declared property even for execution-time
  selection, explaining why open receipt validity does not establish bindability.
  Confirm the actual wrapper path in a regression. Workspace bounds are null;
  non-workspace x/y describe the attachment relative to its own parent, whereas
  basis points describe its mapping into workspace. Publish both meanings.
- The stop classifier's branching is not by itself a bug. Existing input recovery
  evidence remains valid. Regress missing route coverage; do not rewrite a working
  classifier solely for uniform appearance or treat ordinary artistic changes as
  failures. Similarly, unchanged prompt and persistence evidence remain valid even
  though this benchmark does not prove every normal conversation route.
- The prior audit was source/record review, not a behavioral execution of every
  tool. Static routing findings need permanent failing regressions before code
  changes. Do not claim global instructions caused model behavior, that source
  drift occurred, or that eight contract reads can all be removed.

### Ordered correction proposal

1. **Correct evidence validity without replacing the diagnostic lifecycle.**
   Regress a single invalid benchmark submission followed by otherwise successful
   collection; it must not become a passing fixed-prompt run. Regress report
   context-compaction events through actual provider notification handling.
   Preserve original-session unlimited reporting, strict tool prohibition and
   independent work/report/persistence statuses. Reuse existing completion tests
   and add only missing paired normal/evaluation integration with the same owner
   receipts: normal final response admission
   and browser persistence, diagnostic report collection, legal partial work and
   interrupted work. A report success must not certify an invalid ordinary final
   response. This is a coverage requirement, not permission to insert another
   completion action into the live flow. Keep watchdog changes conditional on a
   proved false termination; preserve owned-process safety. Add bounded source/build
   fingerprints using the existing helper concept, without a clean-Git requirement
   or new model request.
2. **Unify executable instruction ownership and remove conflicting authority.**
   Use registered search/read identities and argument contracts at every delivered
   layer; remove obsolete lookup selectors and contradictory prose from App prompt,
   response prompt, tool descriptions, active spec and Inspector. Keep common App
   instructions about responsibility; put parameter/coordinate details with their
   owners. Check full assembled provider packets, first and follow-up turns, not
   substring presence. Execute published routes/examples against their current
   schema and owner, including the selected usage guide. Do not add compatibility
   names, compulsory reads or a compulsory design-plan call.
3. **Prove target selection, then repair declared handoffs.** First compare full
   and compact creation receipts through the conversation owner and next provider
   packet, including an existing building followed by a new detail child and two
   independent roots. Define which already-declared target the hint represents;
   never silently promote the last created part or infer a task root from names.
   Preserve optional role maps and named targets without restoring large replies.
   If existing target metadata cannot unambiguously select one root, document that
   design decision before modifying the hint consumer. Publish registered type
   vocabulary while preserving valid no-match queries and custom registrations.
   Declare attachment bounds (including workspace null) and basis semantics, then
   prove exact field binding through the real wrapper. Use this run's E1/E2/E4/E5/E6
   parameters for preparation -> actual canonical parent -> current transform ->
   next child -> capture, including translated and rotated parents and stale IDs.
   Keep the creation-ID/result binding distinct from the geometry basis. Do not
   add automatic space inference, mandatory reads, or a translation-only workaround.
4. **Prove optional continuity through an ordinary next turn.** Use existing
   browser conversation storage and Host bindings: retain original parameters and
   selected root IDs, return status/index only, consume named data without a model
   read, compose decided construction/conversion/edit/capture, then start a normal
   follow-up with actual compact receipts and saved-name metadata. Also cover an
   intentionally unsaved value and an unused save; neither requires auto-saving
   everything. Changed targets must use current SceneTree, not mutate historical
   inputs. The provider must receive enough selected result metadata to continue,
   without a full role map or full geometry round trip.
5. **Close with trace-based acceptance, then a separately authorized live run.**
   Review direct and Host paths, output projection, error correction and ordinary
   completion on the same source. Run only affected permanent tests; replace
   obsolete assertions and strengthen inadequate ones rather than relax validation.
   A later fixed-prompt run reports exact searches, contract reads, returned bytes,
   named reuse, composed steps and justified visual boundaries. Separate those
   facts from AI explanation and human visual assessment. No success threshold on
   Knowledge use, number of saves, artistic correction, or time between drawings.

Review conclusion: there is no established single cause for a month of varied
failures. Conflicting executable instructions, undeclared attachment output and
benchmark-invalid errors missing the final verdict are concrete correction targets.
The compact/full target asymmetry is concrete but its safe replacement semantics
are not yet settled. Diagnostic finalization is intentionally different; its
coverage limit must not be mislabeled a product bug. Fix proved owner mismatches,
add missing handoff coverage and retain model choice and existing safety boundaries.
Do not implement the earlier broad finalization rewrite or automatic root update.
Current audit makes no efficacy claim about the proposed changes. No code/test
files changed, no new drawing or report inference ran, and no full local test ran.
Earlier historical sections remain evidence, not active replacement contracts.

## Tool outcomes, evaluation stopping and composable discovery

November 12, 2026. Status: four owner slices completed with focused verification.
The first live observation proved input correction but failed endpoint-dependent
evidence closure; the corrected runner then passed a complete unchanged-prompt
15-minute observation. Preserve the original unlimited report
session and never edit files while it is answering. No full-local, release,
dependency upgrade or remote Git operation is included.

### Evidence and bounded coverage

Final run `taipei-101-fixed-1794482034291` completed drawing in 732.406 seconds
and its same-thread unlimited report in 397.620 seconds. No App tool interruption
or evidence error occurred. Persistence reached durable sequence 538, reload
matched the canonical document, and reporting left the document unchanged.
The earlier run's rejected `/invalid` binding recovered in the original drawing
turn. Final documentation review removed residual mixed-discovery prose from the
current spec/Inspector; no product changes followed the completed live run.
See the linked report for both original AI reports, exact gates, failures,
corrections, live coverage limits and unimplemented AI suggestions.

Baseline: `bd5fcee28cdb9ad58659071b3899016d85505796`, live run
`tmp/conversation-improvements/live/taipei-101-fixed-1794465864179`.
Provider request `452b7de5-3255-4028-9d82-bc75eea3e7cd` retained the declarations
in `3-input.json`, first rejected/corrected inputs in `84-input.json` and
`89-input.json`, and final rejected lookup in `329-input.json`/`330-output.json`.
Original-thread follow-up `01a1ce99-41f3-79e3-824b-3525c3cfefb3` confirms the
two intended lookups and distinguishes its own input assumptions from App faults.
The numbered files live under the run's provider payload directory; the follow-up
is `followup-01a1ce99-41f3-79e3-824b-3525c3cfefb3.txt` at the run root.
Do not rewrite this evidence.

Audit discovery methods are the actual advertised inventory, its current owner
factories, input checks and exception construction, raw/model result conversion,
Host composition eligibility, evaluation triggers, and their existing tests.
The inventory contains 49 native tools across seven groups and 182 App actions.
All 182 actions publish input/output contracts; 156 are basic API actions and
26 are App actions. Some native tools wrap those same actions: these are route
counts, not 231 independent capabilities. Saved tools are dynamic registrations;
cover their registration/invocation owners rather than freeze a list of names.
This is a source/contract audit, not an execution of every tool or every error
branch. Full behavioral closure requires the registry-derived regressions below.

| Registered family                | Native count | Audit result and implementation consequence                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | -----------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Knowledge                        |            2 | `local-knowledge.ts` rejects `contentPage` with `rehydrate` inside the owner, while the delivered schema accepts both. It throws `LocalToolInputError` without correction recovery. Closed sessions and unavailable retained advice also use that class. Separate invalid input, recoverable read selection and actual session/data loss.                                                     |
| Image analysis                   |            6 | `local-image-tools.ts` has general exceptions for invalid requests, unknown contour sources, invalid selections, cancellation and quality failures. Many structural errors are already intercepted by schema validation; do not count those as proven live defects. Test semantic selection and resource admission separately from decoding/computation defects.                              |
| Reference import                 |            1 | `local-reference-tools.ts` already distinguishes source-local acquisition failure before admission from unknown attachment admission, but evaluation recognizes a special `select_reference` marker and a references-specific envelope. Preserve alternate-source recovery while eliminating the extra stop-policy convention.                                                                |
| Design preparation               |            5 | `local-design-tools.ts` mixes explicit `correct_input` results, unclassified `LocalToolInputError`, `DesignReferenceError` and general exceptions. Material validation also combines capability availability with input checks. Distinguish supplied selectors from missing promised artifacts; retain successful prepared data.                                                              |
| Preparation/application workflow |            1 | `local-design-workflow.ts` composes partial prefixes and typed correction receipts but also throws the generic preparation error for input, capability and envelope problems. Require one classification at each owner and preserve each completed part.                                                                                                                                      |
| Design operations and Host entry |           30 | `local-operation-tools.ts`, `local-design-sequence.ts` and `local-tool-host.ts` include action wrappers, checks, discovery and `execute_design`. The real mixed-selector rejection loses correction classification. Empty execution observations can become fabricated completed-result delivery errors. Review every wrapper, selected result and early return, not only drawing operations. |
| Tool library controls            |            4 | `submit_tool`, `invoke_tool`, `save_tool` and `manage_tool` use another result adapter. Admission/management rejection and unsaved storage can become failed/not-started; invocation also has failed/not-started results carrying only issue strings. Verify invalid proposals, selected revisions, capacity, genuine store loss and successful execution with failed saving independently.   |

Shared boundaries also inspected: `local-tool-invocation.ts`, resource admission
and release in `local-tool-leases.ts`, scheduling, the basic action adapter and
Runtime batch receipts, native provider replies, `evaluation-control.ts`, and
the live recorder. The scheduler already absorbs a rejected call for queue
continuity; it does not independently require the drawing turn to end.

Confirmed defects and limitations:

- The first live rejection has explicit `correct_input` and continues. The
  final lookup has the same failed/not-started admission state but only generic
  recovery prose, so evaluation stops it. The App submits its tool result and
  issues `turn/interrupt` about 1.5 ms later. This is not an AI decision to quit.
- `LocalToolInputError.recovery` is optional; common schema rejection sets it,
  while `LocalOperationPreparationError` omits it. `localToolFailureReply`
  defaults `recoverable` to true even for failures that evaluation will stop.
  These are competing descriptions, not a reliable unified outcome.
- The first reply's empty observed execution data is projected as an execution
  result, producing nested `TOOL_DELIVERY_INVALID/completed` inside an outer
  not-started rejection. The correction allow-path accepts the outer marker.
  Fix both the false evidence and the possibility of concealing a real
  independent delivery failure; do not simply suppress the nested diagnostic.
- `describe_design_apis` combines purpose search, exact contract acquisition,
  category browsing, schema scopes and retained delivery. Its 6,219-byte
  description says one selector, while `query` only names `names` as exclusive
  and the published schema lacks the cross-field restriction. Runtime rejection
  returns unrelated inputFields/paging rules before identifying the conflict.
  The AI wanted two independent capabilities, not query-as-filter semantics.
- Discovery and Knowledge are currently control-plane tools and cannot be
  composed in `execute_design`. Request-only reference import already shows
  the supported distinction between request composition and durable recipes.
  There is no public `run_recipe` in this inventory; reuse the current Host.
- Existing mixed-selector coverage checks that the owner throws. Common invalid
  input coverage often stops at schema rejection; live recovery cases cover
  selected drawing paths. None of those assertions proves semantic lookup
  rejection followed by corrected execution through the armed provider.

The broader families above are concrete audit targets, not claims that all
their failures reproduce this interruption. In particular, missing resource
handles may reject in lease admission before the leaf handler is reached.
Regression tests must establish the first rejecting owner and actual dispatch
counts before selecting a correction. A model-supplied invalid ID and an App
that loses an acknowledged resource are not interchangeable failures.

### Outcome and stopping decisions

Remove the requirement that each tool opt into continuation with `correct_input`
or another test-specific recovery marker. Normalize existing outcome information
at its semantic owner: status, stable failure reason, phase, and actual execution
settlement. The common input boundary and owner semantic validators must produce
the same invalid-input meaning. Stop policy consumes that validated meaning;
it does not inspect message wording, guess from non-null data, or require the AI
to certify recoverability. Do not merely rename `correct_input` into a new flag.

An unsuccessful call remains unsuccessful. Its diagnostic explains the rejected
fields and permitted correction; it does not become successful just to continue
the conversation. `status` alone cannot distinguish invalid input from broken
execution, and a non-null result can contain either an error or completed prefix.
Preserve legitimate false/zero/null values under their owner's successful schema.
Native protocol success remains a derived transport acknowledgement, not another
independent decision. Remove the redundant generic `recoverable` default and
superseded selector-specific policy markers once their factual reasons are
represented in the canonical receipt. Retain recovery data that actually contains
completed IDs, remaining steps or checkpoints; it is not a continuation flag.

| Observed outcome                                                                                                             | Evaluation behavior                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rejected authored arguments before effects                                                                                   | Return the precise error to the same AI and continue; do not replay automatically.                                                                                                                         |
| Completed prefix, rejected suffix, known execution state                                                                     | Preserve prefix and its results; let the AI correct only the remaining work.                                                                                                                               |
| Empty/ambiguous search, rejected source, or an explicitly recoverable read selection                                         | Deliver truthful coverage and alternatives; do not equate this with App corruption.                                                                                                                        |
| Ordinary visual findings or AI design revisions                                                                              | Continue; no artistic approval gate.                                                                                                                                                                       |
| Genuine App execution/contract failure, contradictory result, lost promised data, unknown writes or broken provider protocol | Preserve evidence, settle started work and stop the drawing evaluation.                                                                                                                                    |
| Execution succeeded but saving/delivery failed                                                                               | Preserve execution; classify the separate failure truthfully. Actual required handoff/storage failure remains visible and stopping under this evaluation policy; never rerun the drawing to retry storage. |
| Explicit cancellation or drawing deadline                                                                                    | Stop drawing, settle/clean up, then preserve the original unlimited report session as applicable.                                                                                                          |

An invalid user selection does not justify bypassing permissions, schema checks
or resource ownership. Known no-write settlement alone does not prove invalid
input: missing owners and unavailable services may also fail before writes.

### Ordered implementation

1. **One failure contract across all owners.** Start with permanent failing
   regressions for both real inputs and the Knowledge conflict, then expand
   from the current registered inventory. Resolve source-owned failure reasons
   at schema admission, semantic validation and resource admission. Preserve
   those facts through direct calls, App actions, named/staged/iterated Host
   execution, saved tools, selected/status delivery and native replies. Remove
   the false empty-execution projection and obsolete correction/recoverable
   fields from producers, consumers and current tests together. Do not globally
   classify all preparation errors or all general exceptions as correctable.
2. **One evaluation decision from those facts.** Replace the format-specific
   correction allow-list in `evaluation-control.ts`. Review Host observations,
   native content conversion, correlated native completion, external recorder
   controls, interruption scheduling, concurrent calls, deadline and cleanup.
   A leaf input rejection cannot latch a terminal stop before its aggregate
   receipt; an unrelated failed sibling must not be hidden by that rejection.
   Verify a corrected second call on the same native turn, not merely an absent
   stop return from a unit helper. Progress/trace failures remain observational;
   arbitrary owner data named status/error is not an outcome acknowledgement.
   Keep failed attempts and unlimited reporting.
3. **Separate discovery responsibilities and compose reads.** Expose a purpose
   search owner and an exact contract-reading owner over the existing catalog.
   Search accepts intended capability and declared input-field requirements;
   it returns ranked candidates and exact identities without executing them.
   Contract reading accepts explicit identities and per-item selected scopes;
   it returns the matching authoritative contracts. Category browsing belongs
   to search; retained contract restoration/paging belongs to contract delivery.
   Canonical identities, revisions, bounded content and namespace ambiguity
   remain intact. Remove `describe_design_apis` and its competing selectors,
   examples and guidance after replacement; no alias or compatibility route.
   Final public names require the normal naming review before implementation.
   Permit these read owners, and read-only Knowledge acquisition, in current
   request sequences via `execute_design`; preserve lifecycle controls outside
   that composition and do not make request handles durable recipe inputs.
   The real request becomes one Host submission containing an exact ordering
   contract read and a purpose search for grouping, with results attributed to
   both steps. Known continuations bind directly; ambiguous capability choice
   returns to AI. Host orchestration cannot invent the tool or its arguments.
   No new outer dispatcher, automatic fuzzy execution or forced planning stage.
4. **Registry-wide verification and contract cleanup.** Derive coverage from
   native factories, App action registration and dynamic saved-tool contracts,
   not the tools that happened to run in Taipei 101. For every surface test
   schema-invalid input and valid result delivery; for each owner/variant add
   independently specified semantic conflict and operational failure cases.
   Cover full, selected and status-only replies, successful prefixes, storage
   failures, cancellation, resource transfer and corrupted output. Exercise
   actual provider declarations/replies, then the corrected call, with write,
   replay, resource and interrupt counts. Split legitimate operation variants
   only where responsibilities differ: a lifecycle operation enum or typed
   geometry variant is not automatically a multifunction design defect.

Each step includes self-review and focused regression iteration before advancing.
Coverage must include tools unused by the live drawing. Source inspection and
schema-only checks cannot substitute for the owner-to-provider cases. Remove
obsolete assertions while preserving their behavioral protections. Do not relax
validation, infer success from data presence, add per-tool evaluation exceptions,
or make the AI perform another status/approval call.

Before production edits, revise the owning `ai-execution-flow.md` sections and
`tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs` compose/settle
conditions in the same implementation slice. Existing clauses requiring
`correct_input`, `select_identity`/`select_reference` stop exceptions, native-only
discovery and the old lookup name conflict with this proposal; replace them,
not append contradictory instructions. Keep current contract authority explicit
until that revision. Synchronize App prompt, tool descriptions, action wrappers,
Runtime handoffs where affected, API guidance, examples and tests. Preserve the
existing scheduler, catalog/cache owners, retain/delivery independence and leases.

Only focused tests are planned for implementation. The authorized final live
observation uses the unchanged prompt and a 15-minute drawing limit,
original unlimited report session and retained follow-up access. No edits while
the App AI answers. Registry-wide recovery tests are required before a live run;
another successful drawing alone cannot close this cross-tool issue.

### Step execution - discovery responsibilities and request composition

The user removed the 18,000-credit stop on November 12. Resume the remaining
bounded stages; the earlier budget checkpoint is historical, not a current stop.
Owner: compose catalog/discovery and request Host registration. Search publishes
`search_design_tools` with purpose, input-field and category filters, returning
candidate metadata only. `read_design_contracts` takes exact `names` and optional
per-identity `scopes`; each scope selects schema paths or an owner input branch.
Keep existing result arrays, revision, retained result keys and content paging.
Remove the previous public tool and its selector aliases. Internal definition
projection remains owned by the existing catalog, not a compatibility dispatcher.
Read-only discovery and Knowledge become request-composable, never durable
recipe lifecycle controls. Preserve exact namespaces, source failures and leases.

The implementation allowlist is the discovery owner/schema, native publication,
Knowledge registration, direct discovery consumers/examples, their formal tests,
App specification/API and the compose Inspector contract. Before/after regressions
cover separate declarations, heterogeneous scopes, query/category metadata,
recorded ordering plus grouping in one Host call, Knowledge composition and input
correction without replay. Review publication and request composition before the
unchanged-prompt live observation. The initial two new boundary cases fail because
the old declaration remains and the new request owners do not exist.

### Discovery handoff review during migration

The new Host regression exposes an unreadable Knowledge dependency at binding:
its native cross-field rule used a representation unsupported by the registered
schema analyzer. Express the same accepted inputs as closed standard branches;
do not drop validation or add a schema bypass. Test actual request execution.
The per-name scope regression also exposes the old dual-route rule: ordinary
full/fragment action reads still include the canonical wrapper, whose paths differ.
Resolve the primary action once for short/semantic identities in every view;
qualified wrapper identities remain independently selectable. Preserve genuine
namespace ambiguity. Existing tests asserting duplicate full contracts must now
select both explicit identities to verify both routes. Search no longer auto-
acquires usage; current tests must search metadata and then use the returned read
route. These are contract migrations, not permission to weaken output validation.

### Consumer review - admission through App result context

Focused downstream cases exposed three first-owner omissions. Resolve them before
live admission: per-identity lookup aggregation must preserve missing-name recovery
candidates; a short action name must keep its primary owner even when an unrelated native tool
shares it; qualified native selection remains independently available; an authored missing saved name
or path must preserve its input rejection through the browser receipt, HTTP exchange
and Host. Unavailable context transport or expired document scope remains operational.
Reference-note crop bounds likewise distinguish an invalid crop from unavailable
source decoding before recording notes. No generic exception is reclassified as input.

The current owner allowlist includes conversation-results, its HTTP consumer and
Host, and reference-note admission, with existing compose/request boundaries unchanged.
Final review also removes the obsolete stop for invalid authored schema paths: publish INPUT_INVALID with truthful completed read coverage, while registration or delivery failures remain blocking. Formal tests reproduce dropped candidates, name collision, and the missing-name HTTP
error before production corrections. Preserve independent failed storage and source
errors, no action replay, exact provider declarations and final native-reply stopping.
Update old navigation tests to execute current search/read examples; historical input
fixtures remain immutable. These corrections do not introduce a new stop permission.

### Pre-live validation checkpoint - November 12

Stages 1-3 pass their focused owner and consumer checks. The final native-provider,
execution-proof, identity-recovery and stop-policy run passes 434 cases (one opt-in
case skipped). The independent failure/Host/report-session/HTTP run passes 190;
current registry admission passes all 210 owners. Browser result-context transport
passes 42 cases in its browser environment; Knowledge/activity/context consumers
pass their focused suites. Current server types and the 15-case naming gate pass.
Scoped ESLint has no errors and eight existing console warnings. No full local test,
release gate, commit or push ran. Historical evidence remains immutable.

Stage 4 now observes the unchanged-prompt 15-minute drawing, same-provider unlimited
report and retained session. Source and question files are frozen while the App AI
answers. Capture real input corrections, completed siblings and actual stop reasons;
do not treat a passing drawing as proof that every recovery route was exercised.

### Live evidence correction - isolated service identity

The first resumed run completed drawing in 451.748 seconds and its unlimited
same-thread report in 312.543 seconds. Its invalid authored binding recovered
without stopping. Evidence closure failed: the launcher overrode the owned
collaboration service port but omitted the browser endpoint override, which
still selected another retained run's service. The recording cannot certify
durable persistence or reload. Preserve its evidence and provider session.

The bounded correction belongs to the existing live runner and its formal tests:
reject a browser collaboration endpoint that differs from the owned service
before starting any service or model request. Do not rewrite local configuration,
route to an old service, or change product collaboration behavior. First reproduce
the mismatch with the recorded ports, then validate the current runner and repeat
the unchanged-prompt observation with all endpoint values explicit. The previous
report has finished; no source files were edited during its answer.

The regression fails before the guard exists and passes with it. The focused
runner/deadline/recording set passes 21 tests; scoped lint and the naming gate pass.
When choosing isolated ports, set `VITE_COLLABORATION_WS_URL` to the same host,
port and `/collaboration` route as `COLLABORATION_WS_HOST` and
`COLLABORATION_WS_PORT`. The runner checks this before creating a run directory.
No local `.env` is rewritten. Repeat on App 3059, collaboration 4159 and backend
4259; keep the first original provider thread available for follow-up.

### Step execution - common failure boundary

Owner: Inspector compose, with settle/provider interruption as its direct consumer.
Input: schema-invalid or semantically rejected tool arguments and actual owner
execution receipts. Output: validated failed/partial outcome with canonical failure
reason and truthful settlement; no duplicate correction permission. The mutation
allowlist is the registered tool owners, common invocation/Host/result conversion,
evaluation consumers, their focused tests and owning spec/Inspector/API docs.
Preserve schemas, resource ownership, completed prefixes, images and no replay.
No cache, rendering or model-selection change is included. Naming preflight passes
15 cases. New permanent real-input and Knowledge cases fail on the original
PREPARATION_REJECTED outcome; an independent delivery-failure case already passes.
Review raw/model/provider agreement and zero-write rejected admission before
advancing. Registry-wide and live evidence remain pending.

### Admission before leaf execution

Resource admission can reject an authored handle before the common leaf tool
boundary runs. Native Host currently rewrites this as TOOL_HANDOFF_FAILED;
Runtime composition keeps only issue text, losing the input cause. Treat this as
part of the same failure boundary, not a tool-specific stop exception. Preserve
contract-error stage and message in Runtime execution/call receipts, alongside
actual status and settlement. Cleanup and unrelated failures must replace the
local failure cause without removing completed sibling receipts. The evaluator
may continue only an input-stage rejection with known not-started effects; a
completed prefix is never replayed. Verify direct and composed paths plus cleanup
failure before proceeding to discovery publication.

### Failure-boundary checkpoint

Focused evidence now covers the original schema/semantic input failures, source
selection, library proposal/identity errors, native and composed resource admission,
known completed prefixes, and independent cleanup/storage faults. The armed native
provider regression rejects a direct artifact selection, rejects a composed artifact
selection, then rejects and corrects the recorded name update in the same turn with
zero interrupts and one grouping write. Runtime resource/persistence suites pass
64 cases; Host/selected-prefix/composition suites pass 108 cases. Broader focused
contract cleanup remains open; these counts do not close the whole plan.

Review found another first-owner mismatch: native leaf validation used a static
contract while the Host selected a per-invocation result contract. Pass the pinned
invocation contract to the leaf and preserve the outer sequence input schema when
selecting ready-batch results. Do not weaken validation or treat a completed write
without its required acknowledgement as confirmed; the unconfirmed-write test now
requires unknown settlement and keeps the no-replay assertion.

### Boundary review iteration

The first shared-boundary suite passes 351 cases and the Runtime/store/profiler
suite passes 112. Wider owner/provider checks exposed three distinct remaining
handoffs inside steps 1 and 2. Finish these before replacing discovery:

- Discovery produces failed completed reads without an explicit recovery schema.
  Publish that actual owner result, including unavailable field navigation, and
  verify it through provider reply validation. Do not reuse the generic admission
  receipt as the schema for a completed discovery read.
- Host-generated contract admission with incomplete issues must retain a
  registration failure, not an input failure. The permanent regression reproduces
  the wrong input stage. Correct reference selectors remain input failures.
- Knowledge must distinguish a missing authored root selection from a broken
  dependency/catalog. Classify at the Runtime catalog owner, then preserve the
  cause through the App boundary; do not classify every Knowledge exception as
  authored input. Add root-versus-dependency and same-owner correction tests.

The strict-stop fixtures previously used a nonexistent operation as their fatal
failure. That now correctly continues. Replace that fixture with a declared
request-composable tool whose executor fails, preserving the post-delivery
interrupt and same-session report assertions. Use the maintained server harness's
Node environment; browser URL rewriting and cross-realm buffers are not product
failures. Keep those results separate from actual contract failures.

Self-review: these changes remain in compose/settle and their declared Knowledge
owner boundary. No new dispatch, retry, compatibility or stop permission is added.
Rerun the affected provider cases, owner contract checks and current server types;
then review the complete slice before advancing to discovery replacement.

### Budget checkpoint - failure classification and continuation

The failure-boundary implementation is present. Same-turn provider correction is
verified with recorded name-update parameters, direct/composed invalid artifact
selection and no replay of the acknowledged group. A real executor failure still
interrupts after reply delivery and reports its concrete cause in the same thread.
Source fixtures that formerly treated an unknown authored operation as fatal now
use a registered executor failure for the fatal path. The invalid operation remains
covered as correctable input.

The shared registration boundary preserves rejected contracts as not-started and
blocking. Authored step-input binding rejection and malformed named references stay
correctable before effects. Preparation construction/motif validators preserve the
rejected draft rather than turning semantic input errors into general exceptions.
Search failed-read schemas now retain ambiguity choices and actionable navigation;
this is repair of the current owner contract, not completion of the planned split.

Latest focused evidence under `tmp/conversation-improvements/`:

| Scope                                                                                    | Evidence                           | Result     |
| ---------------------------------------------------------------------------------------- | ---------------------------------- | ---------- |
| Native provider continuation, genuine stop, same-session reporting and result validation | `provider-boundary-checkpoint.log` | 46 passed  |
| Shared native/Host admission, selected-prefix and whole-result validation                | `failure-boundary-final.log`       | 286 passed |
| Actual flow recovery, created targets and binding/retention admission                    | `failure-flow-final.log`           | 49 passed  |
| Runtime execution, store, Knowledge and profiler                                         | `runtime-boundary-checkpoint.log`  | 166 passed |
| Ten affected tool-family/Knowledge owner suites                                          | `tool-family-final.log`            | 257 passed |
| Actual direct/registry result variants and zero-replay input rejection                   | `batch-invocation-verified.log`    | 22 passed  |
| Browser canonical non-Core owners                                                        | `browser-owner-verified.log`       | 1 passed   |
| Host invalid named selection and incomplete contract admission                           | `host-admission-final.log`         | 2 passed   |

These are focused results at their recorded checkpoints, not a claim that every
tool variant or the entire plan is complete. Earlier failing logs remain retained;
current files and later matching regressions establish the corrected behavior.
No full local test or live drawing has run in this task.

Outstanding work remains: split purpose search from exact scoped contract reads;
remove the old discovery entry/examples without aliases; compose both reads and
Knowledge through execute_design; finish registry-wide provider publication and
input/result variant verification; then run the original fixed prompt for 15 minutes
and retain the original unlimited report session. Do not launch that live test
before the remaining implementation and focused review finish. No source files have
been edited during an App AI report; no App AI report was started in this task.
No commit or push has been made. Preserve this dirty task worktree for continuation.

The credit check at 09:45 UTC returned 18,042.653683, near the user's 18,000
convergence threshold. Converge this boundary rather than begin a new discovery
migration or a live model run that cannot be completed inside the remaining
budget. Current server and flow-proof type checks pass; scoped ESLint has no errors
and retains six existing console warnings. Naming passes 15 cases. Final source
review preserves registration failure without claiming no earlier effects, and the
74-case invocation suite covers both empty and acknowledged-prefix evidence.
The final construction/discovery check passes 59 selected cases
(`construction-input-final.log`). Obsolete budget-code expectations were replaced
with the canonical input-failure code while preserving exact observed/allowed
capacity, zero writes for rejected work, successful-prefix retention and no replay.

### Planning review

The revised direction removes redundant control conventions rather than adding
prompts or new approval steps. It preserves failure visibility, known partial
work, independent storage and transport, and canonical validation. Multi-query
execution has an existing Host/scheduler and request-only composition route;
its new publication and result selection still require focused feasibility
proof. No live failure is attributed to a family solely because it throws.
All-tool registration coverage is established; semantic branch regressions and
replacement contract admission remain implementation work, not completed checks.

## Terminal handoff and recovery contracts

Historical checkpoints follow. They preserve earlier evidence and task boundaries;
the active follow-up above owns the next changes.

November 11, 2026. Status: implemented; focused checks passed. The dependency
classification and shared-check follow-ups passed; full-local now stops at the
Asyra Design result-contract tests described
below. This approved follow-up supersedes the
previous closure claim for the complete handoff, while retaining its evidence.
Work in the existing feature worktree and preserve unrelated dirty changes.

The complete-path review added eleven permanent cases: ten failed and one passed;
231 existing focused cases passed. `continuity-review-boundaries.log` and
`continuity-review-provider.log` record the failures and actual provider packets.
The four defects share terminal ownership gaps: invalid-input early return bypasses
Host result validation; reconstructed delivery failures escape final validation;
non-root delivery merges recovery-only payloads into partial results; registered
composition recovery validates projected child values with raw child contracts.
`resultStage: host` remains an unused descriptor field, not an active consumer.

### Bounded implementation and review

Scope is App invocation/Host, declared model delivery, library recovery, discovery,
provider consumers, their formal tests, and owning spec/Inspector documentation.
Preserve independent execution/delivery/storage, valid partial and failed-prefix
receipts, exact owner revisions, resource release, correction and no replay. Remove
superseded metadata and contract alternatives without compatibility or relaxed
validation. Do not change geometry/rendering, model prompts, live evaluations,
release flows, dependencies, environment or remote Git state.

1. **Admission and terminal validation - compose.** Route invalid-input replies
   through Host validation using the canonical admission failure contract and
   explicit failed/not-started acknowledgement. Do not acquire resources or execute
   owner work for rejected input. Preserve actionable owner correction diagnostics.
   Validate diagnostic envelopes and acknowledgement agreement at their owner;
   middleware flags cannot override evidence. Review copied, mutated and ordinary
   rejections and verify zero owner calls and unchanged resource counts.
2. **Declared model results and failure construction - compose/provider handoff.**
   Keep partial/recovery view alternatives status-specific. A reconstructed delivery
   failure must itself pass its declared failure schema. Include execution evidence
   only when it can be delivered under that schema; retain truthful settlement and
   explicit delivery failure when evidence cannot be projected. Never weaken the
   successful view or silently turn recovery-only data into partial data. Use the
   existing delivery-failure owner, not another transport fallback or replay path.
   Review direct/registered routes, object/scalar roots, missing views and failure
   reconstruction; verify actual provider content and acknowledgement together.
3. **Composition recovery and metadata - compose.** Derive model recovery contracts
   from the same selected child owner/revision used to project recovery values.
   Raw recovery retains raw schemas. Consume the existing library recovery builder
   with its projection hook; no second registry/cache or caller-managed schema.
   Remove unused resultStage metadata and its obsolete assumptions. Review single
   tools versus composed partial prefixes and failed storage; preserve source-call
   counts and successful data.

Each step starts from formal red regressions, finishes focused tests and handoff
review before advancing, and updates old tests without deleting their invariants.
New internal helper names belong to the existing invocation/delivery owners; no new
persisted identities. Keep invocation-bound validation reuse; new failure data gets
its own validation rather than reusing the original result proof.

After all focused checks, review registration -> discovery -> raw inspection ->
resource handoff -> model projection -> recovery -> native provider packets using
current contracts. Only then run the repository full-local validation entrypoint,
with its existing guards. Full test failures are evidence, not permission to widen
production mutation scope. Release/publication and live 101 remain excluded.

### Implementation and focused review

All three steps are implemented. Rejected input now receives canonical failure
validation without acquiring resources or executing the owner. Boundary failure
construction also validates its envelope before any provider delivery. Model
failure reconstruction validates the new payload and includes only evidence allowed
by the declared view. Partial and recovery alternatives remain status-specific.
Composition recovery uses each selected child's model contract, preserving its
qualified identity and revision; the unused resultStage descriptor is removed.

Self-review added regressions for unknown tools and malformed boundary evidence.
It also caught a qualified-name overwrite during recovery conversion and a legacy
test receipt missing its required actionName. The name is preserved, and the test
now uses a valid receipt without removing its partial-execution assertions. No
validator or declared schema was weakened.

Focused evidence is under `tmp/conversation-improvements/terminal-handoff-*`:
246 invocation/Host/result/recovery cases, 26 actual provider-packet cases, 25 image
delivery cases, and 1,163 discovery/schema audit cases passed. Earlier owner-slice
checks cover library controls, leases, evaluation stopping and model delivery.
Flow-proof type checking passed. The bounded whole-path review covers registration,
discovery, admission, raw inspection, resource handoff, model projection, recovery
and provider delivery. Formatting, diff checks, naming (15 tests) and Inspector
checks (2 tests) passed. Scoped lint has zero errors and one existing console
warning in the provider test.

### Full-local result

Ran `yarn validate:full` after the focused checks and complete-path review.
Evidence: `tmp/local-validation/20969a4e-ad06-445c-b102-64805f81a527/result.json`.
Source verification passed. Security audit passed; dependency validation then
failed and the runner stopped before the other planned checks.

The E2E-only `apps/asyra-design/e2e/hierarchy-handoff-probe.ts` imports
`@asyra/reactive-events`, which is already declared in the App's devDependencies.
`scripts/deps-validate.js` recognizes test/spec filenames and tests/mocks
directories but classifies this probe as production source. Its importing consumer
is `e2e/hierarchy-projection-updates.spec.ts`. This is a test-helper classification
gap, not an absent installation or a failed tool-handoff regression. The validator's
six unit tests passed but do not cover this E2E helper path.

Do not claim full-local success. No validation was bypassed, dependency moved,
release flow run or unrelated production code changed. Correcting the E2E helper
classification requires a separately scoped follow-up; preserve production import
enforcement. The remaining full-local checks have not run.

### E2E helper dependency classification follow-up

The user authorized correcting the dependency classifier and retrying full-local
validation. Scope: `scripts/deps-validate.js`, its permanent regression tests and
this plan. Classify the workspace-root `e2e/` test directory, including browser
helpers, as test source; still inspect every import and require a declared owning
package. Preserve production dependency requirements outside that directory,
existing test conventions and nested-workspace ownership. Do not move dependencies,
skip files, add package exceptions or change App/runtime/Inspector behavior.

First reproduce the real helper failure in a formal regression, then cover nested
helpers, undeclared imports, public subpaths, similar directory names and production
paths. Review the bounded diff and run dependency, lint and naming checks before
retrying `yarn validate:full` with its original guards. Unrelated full-local failures
remain evidence and do not authorize broader corrections.

The two positive regressions failed before the classifier change while eight
existing/negative cases passed. After the correction all ten cases passed and the
formal dependency scan passed across 29 workspaces. Scoped lint and naming (15
tests) passed. Review confirmed that imports are still parsed and checked against
their declared workspace owner, no files are skipped, and production paths remain
strict. Evidence: `tmp/conversation-improvements/e2e-dependency-*`.

The full-local retry completed with failure at shared checks, retaining the
runner's stop policy. Evidence:
`tmp/local-validation/b29ae1d7-51ac-44e8-8591-f7b9601ae5e4/result.json` and
`shared.json`; source verification passed. Security audit, dependencies,
build-graph and declarations passed. Shared naming passed; lint reported 138
errors across nine pre-existing App test files, and repository scripts reported
seven failed tests. None is in the dependency classifier or its tests:

- The generated-template script exclusion expectation omits `test:live:taipei-101`.
- A tracked November 4 drawing report contains an absolute home path.
- Four documentation checks reject stale `docs/public/generated/package-reference.json`.
- The public source-map test rejects an outdated hash for
  `apps/asyra-design/server/local-operation-tools.ts`.

The full-local retry has not passed; subsequent workspace and E2E gates did not
run. No unrelated files were reformatted, dependencies moved, validation skipped,
or compatibility exceptions added. Follow-up corrections to these shared-check
failures are outside this dependency-classification task.

### Shared-check correction follow-up

The user authorized correcting the 138 lint errors and seven failed tests from
the full-local run above. Scope is the nine named App test files, the template
exclusion regression, the authored November 4 report links, current public
documentation generator outputs and this plan. Preserve test behavior and strict
validation; remove unused test scaffolding rather than suppressing rules. No
runtime/Inspector changes, dependency moves, compatibility, publication or live
drawing runs. Existing failed lint and formal test evidence is the baseline.

Verify the benchmark command and its contract test depend on the excluded
`test-data/ai-drawing` directory before updating exact template expectations.
Convert authored artifact links to portable relative paths without touching
original AI evidence. Regenerate public documentation through its canonical
generator; retain byte/hash assertions. Review automatic formatting separately
from unused-code removal and control-flow changes. Run the nine focused App
test files and affected script/documentation tests, lint and naming, then retry
full-local with unchanged guards. New unrelated failures require separate scope.

Review found 131 automatically correctable style errors, unused imports and one
unused helper, a non-null assertion and a nested conditional. Removed unused
scaffolding, made the missing-tool failure explicit and preserved conditional
precedence. The nine test files retain all their test declarations.

Executing these files exposed 21 failures in three existing consumer suites:
they still expected Host acknowledgement inside owner data. Migrate these tests
to the current separate data/outcome boundary, preserving all fixed status,
settlement, data, call-count and no-replay assertions. One observed-prefix fixture
also lacked its required actionId; use a valid receipt, preserve the owner's
failed application data and assert the invocation's partial/unknown acknowledgement
separately. No product contract or validation changed. All 133 App cases now pass.

The template test now verifies the real benchmark command and excluded data/test
paths, while retaining exact exclusion-list assertions. All ten portable report
links resolve to their original artifacts without rewriting those artifacts.
Generated package/API/content/source-map outputs were rebuilt from current sources
using `yarn docs:public`; deterministic checks remain unchanged. All 116 affected
script/documentation cases, App server type checking and public-documentation
freshness checks passed. Evidence: `tmp/conversation-improvements/shared-fix-*`.
Full-local retry follows final lint and naming checks.

The retry finished at
`tmp/local-validation/0d5f9696-32b8-4dff-84ca-a44bb4ee8704/result.json`.
Source verification passed. Security audit, dependency validation, build graph,
declarations, all shared checks and the `@asyra/ai-agent-runtime` workspace passed.
Full lint reported zero errors (110 warnings); the original seven script failures
are resolved. No scripts, tests or gates were skipped to obtain those results.

Asyra Design's first AI test stage ran 803 cases: 798 passed and five failed in
five files outside the nine-file correction above:

- `core-owner-results.integration.test.ts`: real Core result delivery expects a
  different result envelope.
- `identity-and-composed-receipts.integration.test.ts`: the test discards the
  invocation acknowledgement and then reads `native.toolOutcome.status`.
- `interrupted-design.integration.test.ts`: descriptive brief capacity expects
  two inline status objects but receives undefined.
- `non-core-owner-results.integration.test.ts`: real non-Core result delivery
  disagrees with the expected result envelope.
- `structural-delivery.test.ts`: observed fill projection disagrees with the
  expected inline acknowledgement.

These are recorded failures, not an assertion that all five are stale tests.
Their owner contracts and actual handoffs need review before correction. Full-local
remains failed; later workspace/E2E checks have not run. The owned runner exited
with no retained process groups. No runtime behavior, validator, compatibility path,
remote Git state or release operation changed in this follow-up.

### Native result consumer correction follow-up

The user authorized resolving the five remaining failures, reviewing the actual
upstream/downstream handoff and iterating without another inspection checkpoint.
Scope: those five AI integration suites, their result/invocation/projection owners
if a proven defect requires correction, direct contract regressions and this plan.
Use the existing spec and Inspector compose/apply contract: unchanged owner data,
separate invocation acknowledgement, declared model projection and no replay.
Do not restore inline Host fields, weaken schemas, skip validation or add compatibility.
Preserve mutation scopes, partial/failed states, resource ownership and undo/redo.

The failed full-local run provides the red baseline. Trace every expected field to
its owner before edits. Current evidence locates all five mismatches in consumers:
native tests discard the acknowledgement; compact projection tests demand raw
metadata after the declared public projection. Preserve expected states explicitly
at their actual boundary and all data/history/call-count assertions. Review the
five files and run their focused suites, direct provider-boundary regressions,
relevant type/lint/naming checks, then full-local. Iterate related result-contract
failures exposed by these gates within the same owner boundary; do not turn this
into unrelated runtime, rendering, release, dependency or environment work.

The user's additional review applies to all 20 test files modified in these recent
handoff, dependency, shared-check and native-consumer corrections. Retention follows
current behavior, not the age or number of tests. Keep necessary coverage for
strict admission/projection, failure recovery, saved data, optional reference use,
absence of mandatory approval, history, dependency ownership and template isolation.
Negative legacy-field checks prevent reintroduction; historical input fixtures are
immutable evidence adapted explicitly by test setup, not production compatibility.

Re-review removed the obsolete inline acknowledgement example from the internal-only
projection test; it now validates the actual empty projected value. Replace the new
part-outcome helper assertion with independently expected completed steps and real
application receipts, plus the separate invocation outcome and persisted geometry.
Raw rejection tests check their declared unavailable/not-started fields directly.
The underlying current behaviors still need coverage; obsolete field expectations
and unused scaffolding do not. No dual old/new acceptance or fallback helper is added.

Review confirmed no missing product data: Core/non-Core native replies preserve
their owner values and explicit outcome; the identity test had discarded the
reply envelope. Ordered parts are interpreted by the same canonical outcome owner
used during composition. Compact fill delivery preserves public status/settlement,
while the original observation retains its internal metadata and mutation scope.
Tests now assert those separate boundaries, including success, no-change, rejection,
partial mutation and no replay. Native owner tests explicitly reject reinjected
Host fields. No product implementation, schema or compatibility behavior changed.

All 35 cases in the five suites and 26 selected actual-provider-packet regressions
passed. App browser type checking and scoped lint passed; naming and final diff
review precede full-local. Evidence: `tmp/conversation-improvements/native-consumer-*`.

Full-local `37bd59a2-152d-4ca0-8c8b-723d5fa7850f` passed shared checks,
runtime checks and all 803 frontend AI tests. Its subsequent server stage exposed
142 failures in 19 files (3,189 passed, 14 skipped). The next bounded iteration
groups these by the existing handoff owner, rather than repairing assertions in
isolation: (1) strict failure construction and selected model contracts, (2) native
owner values versus separate acknowledgements, (3) immutable recorded scenarios
expressed as current input and delivery selections, and (4) actual provider content
items and recovery. Browser-only test dependencies must be isolated explicitly.
First investigate schema failures and provider interruption before migrating
consumers. Preserve meaningful execution, resource, history and no-replay oracles.
Remove generic historical-input normalization and obsolete Host-field selections;
use explicit current requests with recorded geometry. Do not invent an inline
acknowledgement helper or a dual-format result decoder. Validate each owner group
with focused Node/browser suites before another full-local run.

The full red baseline identified four implementation defects, not stale assertions:
scoped registered discovery omitted its delivery-failure schema; missing-owner
delivery failure generated an empty `anyOf`; targeted action receipts embedded
local references at the wrong root; evaluation still required inline Host metadata
on completed parts before allowing a later input correction. Correct these in
their existing schema/composition/evaluation owners. Missing evidence uses a false
schema, not permissive acceptance. Targeted receipts use the existing schema
embedding utility at every envelope boundary. Evaluation uses canonical action
outcomes with nonempty receipt evidence; missing, unknown and failed inspection
prefixes remain stopping conditions. The provider replay and new focused failure
tests establish the red baseline; preserve their negative controls.

Historical result selectors for `/toolOutcome` are no longer valid data selection.
Keep recorded geometry, portable IDs and source retention; remove those selectors
from current requests and assert the independent invocation acknowledgement.
The provider harness reads value and acknowledgement from separate native content
items, including follow-up callbacks. A content-delivery failure fixture must pass
owner schema validation and inject failure at the content adapter, rather than supplying a
malformed URL that correctly fails earlier admission. No timeout increase or
validation bypass is used to conceal that distinction.

The native reference replay also exposes a transport-boundary defect: delivery
repackaging applies the browser batch evidence schema to native reference data,
which intentionally has no browser action IDs. Reuse the existing canonical
model-delivery failure constructor and the invocation-pinned model contract at
the provider content boundary. Retire the separate transport failure code rather
than accepting both shapes. Validate the retained native value with its own
contract, preserve execution settlement, and prove actual provider content and
successful continuation. No synthetic action IDs or broader receipt union.

A sixth defect appears in the real interrupted batch replay: the failure branch
bypasses the normal owner result preparation, omitting the required batch summary,
and uses the pending action's not-started settlement for the whole execution.
Step: operation result handoff; inputs are the original submitted batch and observed
browser receipt; outputs are the canonical result plus its aggregate settlement.
Use one preparation path for both completed and interrupted receipts, preserve
child failure settlement, and validate the delivered prefix against acquired usage.
The internal batch summary participates in owner validation; public failure
projection still exposes only declared recovery evidence, not that internal summary.
The regression must prove one mutation completed, the other remains pending,
malformed retained data rejects, and recovery executes only the pending suffix.
No new schema alternative or replay fallback. Run focused batch/invocation/provider
regressions, bounded review and full-local after all current consumers pass.

The bounded re-review covers 36 App test files and the two previously changed
script test files. Retained cases still verify current behavior; obsolete inline
acknowledgement selectors, historical-input normalization and duplicate retired-plan
variants are removed. Native partial fixtures now carry consistent execution,
delivery and outer outcomes, with explicit rejection of contradictory states.
The 22-file consumer run passed 1,246 cases with one batch failure; its corrected
batch suite now passes all 24. The final operation/invocation/provider/recovery
regressions pass 526 cases (one existing skipped case). App/server/proof type checks,
scoped lint, naming and diff review pass. Full-local is the remaining closure gate;
no completion claim is based on those focused results alone.

Full-local `cc57edfd-8c38-487b-82da-9d70f1bcb91c` passes shared checks,
Runtime, all 803 frontend AI cases and 3,332 server cases (14 existing skips).
The later browser ownership suite reveals five stale native acknowledgement
assertions in `local-query-artifacts.test.ts`. Its query-to-fill and structural
ownership coverage remains necessary: preserve real owner calls, partial prefix
handling, lease disposal, retained receipt lookup and exact mutation counts.
The next consumer-only step retains the actual invocation envelope and checks
its separate outcome; raw domain receipts stay unchanged. No product schema or
compatibility change. All 15 cases pass; scoped lint, server type checking and
bounded diff review pass. Run full-local again on the corrected source.

Full-local `34a94b66-5341-4c69-8a46-6cd313a69904` passes every workspace
and FieldScope profiles. Control-plane finishes with 617 passes, 57 existing skips
and 11 failures, all caused by the removed `local-design-review.ts` still listed
in the current Design functional responsibility manifest/Inspector. Existing
source-existence and real Playwright-fixture tests detect this upstream defect.
Revised bounded step: reconcile `inspect-design` responsibility sources and its
exact executable case inventory against current inspection implementation and
`functional-failure-responsibilities.md`. Remove retired source/case references;
keep current observation freshness, mechanical validation and AI final verification.
Update only the functional manifest, its Inspector, generated workspace bundle and
this plan, plus directly necessary regression tests. No restored module, missing-file
skip, relaxed source validation or historical report rewrite. Preserve all 11
failure/recovery/attachment tests; they remain necessary. Run exact discovery and
Playwright evidence suites before another full-local run. This source mapping step
replaces assertion migration as the current failed boundary; no unrelated runtime
or tooling feature work is authorized.

Exact current Playwright discovery contains 530 cases while the stale manifest
contains 520: one retired mandatory-review case is removed, two renamed cases
retain their identities, and eleven additional cases are mapped to their actual
conversation, execution, inspection, navigation and render owners. Extend only
those existing responsibility boundaries to include their current producers,
including recording framing and GPU observation helpers as evidence producers,
not alternative product owners. Update the functional responsibility spec and
semantic mapping regression alongside the manifest/Inspector. This is current
coverage reconciliation, not restoration of the removed review protocol.

Functional mapping regressions pass: 75 tests, no failures, 44 existing opt-in
skips. Exact discovery and semantic responsibility checks pass after final review.
The 13 current browser cases first detect a stale live-service boundary: ports
3045/4145 belong to this worktree but have been running for three days; browser
Pixi is 8.20.1 while installed/locked and current prebundled files are 8.22.0.
Keep the version identity assertion. Validate using newly owned test services on
3057/4157/4257, without modifying persistent `.env` or stopping the retained session.
Use the same isolated service environment for the final full-local run. Service
identity and cleanup are test execution requirements, not product compatibility.

All 13 reconciled browser cases pass against newly owned current-version
services (1.2 minutes); the services are reaped and ports are released. The first
isolated attempt incorrectly set CI, which disables local server startup in the
existing config; rerunning in ordinary local mode fixes invocation only. No source,
assertion or version check was relaxed. Complete the previously unexecuted functional
E2E gate before another full-local run, to expose remaining current-consumer issues
without repeatedly traversing already validated expensive owners first.

Functional E2E reaches 234 passes and stops at the referenced partition recovery
case. Its scripted server reads removed inline Host metadata from unchanged owner
data, throws inside its own assertion and destroys the stream; App partial status
correctly reflects that interruption. Retain this real preparation, recovery,
collaboration, history and durable-reload case, but preserve `invokeLocalTool`'s
reply envelope and assert its separate outcome. Exact invocation/outcome search
in E2E finds only this file's two stale reads; host consumers do not read inline
acknowledgements. No product/timeout/assertion-strength change. Run the whole
construction E2E file, scoped lint/type checks, then resume the formal functional
gate before full-local. This is the same current result-consumer correction boundary.

The construction consumer correction preserves the invocation reply separately
and keeps all native outcome, partition, mutation-count, history and durable reload
assertions. One focused attempt overlapped test-file lint edits and lost its mounted
conversation panel; with source frozen the unchanged failing case passes in 28 seconds.
Keep source frozen throughout browser verification. Scoped lint and App types pass;
rerun all nine construction cases before continuing the full functional preflight.
No timeout increase, retry allowance or compatibility acceptance.

The frozen functional preflight passes 491 cases before the mechanical-repair
consumer demands an inline Host outcome in an object matcher. The earlier
property-read-only search missed this assertion form. Review complete invocation
consumers, including matchers, rather than relying on field-access searches.
Keep all five mechanical modes and their independent checks, recovery, history,
collaboration and durable reuse. Read invocation outcomes from the real reply and
owner values from its text; do not inject fields or accept either representation.
Owner-declared workflow/action/failure outcomes remain valid domain data and must
not be mechanically removed. Run all five modes and the functional gate before
the final frozen full-local run.

The remaining provider-prefix E2E preserves correct completed and rejected parts,
but expects an injected child acknowledgement absent from the current preparation
owner. Actual recorded output declares `available:false`, `settlement:not-started`,
`recovery:correct_input`, no completed steps and the retained draft. The deterministic
provider peer discards the separate final acknowledgement. Retain the test: capture
that exact provider content item, assert aggregate partial/partial and repaired
success/completed, and assert the rejected owner's explicit fields. Preserve
mutation counts, no-prefix-replay, undo/redo and durable reload. No inline-outcome
fallback or product/schema change is required.

Focused closure before the frozen full-local run: all five mechanical recovery
modes pass; the provider-prefix, repeated-detail and recording-framing file run
passes all five cases. The preceding tail run passed the other 27 cases, with two
existing skips, before exposing the corrected provider consumer. Construction
passes all nine cases; scoped lint, App types and naming pass. These focused runs
are diagnosis evidence, not a substitute for one full-local result on the final
source. Preserve all formal fail-fast and resource guards. Use isolated fresh App
services so retained user sessions cannot supply an older runtime.

Full-local run `08a0193d-77af-4c33-b46d-10cd4f553f25` verifies its source and
passes every workspace, profiles, control-plane tests and collaboration E2E. Board
E2E exposes one stale owner-count assertion: three injected scenarios correctly
fail the exact manifest case set, including the report case now owned by `settle`.
The Board therefore marks compose, apply, inspect and settle; the test hardcodes
three. Re-audit confirms the current settle Inspector owns bounded work/report
handoff and the executable report proof verifies it. Do not move the case back or
change product mapping. Revised bounded slice: this Board test and this plan;
assert the exact failed owner set derived from the manifest's expected cases,
including history/recovery, instead of a historical count. Existing full-local
failure is the red baseline. Run the focused Board case, its complete file, lint
and naming, then rerun full-local on frozen source. Review remains limited to this
mapping consumer and the prior frozen gates; no new repository-wide cleanup.

The Board correction passes its failing case and all 19 cases in the complete
localization file, with no skips. Current and historical observations must equal
the expected manifest owner set; cleared recovery still requires zero failed
observations. Scoped lint, naming and diff review pass. Freeze this source and
rerun full-local; earlier full results remain failed evidence, not combined success.

## Canonical result and contract continuity

November 11, 2026. Approved implementation in the existing
`codex/ai-conversation-improvements` worktree. Preserve the dirty predecessor;
no branch replacement, compatibility path, remote operation or wider closeout.
Status: complete with focused validation.

### Upstream findings and task contract

Runtime already inspects a value alongside an explicit outcome. App invocation
then merges host acknowledgement into object values, uses a separate channel for
non-objects, and downstream code reconstructs outcomes from those values. This
breaks exact owner values and loses execution state during projection/failure or
native delivery. Supported raw-schema vocabulary does not prove automatic
hidden-field projection preserves its semantics. Discovery pins a selected tool
contract while model egress can independently rebuild a generic wrapper contract.
Identity/text-only validation proof also lacks the producing invocation identity.

Evidence: `receipt-boundary-review-*.log` records 434 passing and 27 failing
focused cases; `upstream-result-contract-*.log` isolates Runtime's correct
inspection from App conversion and provider state loss. These are permanent
regressions, not 27 independent defects. Keep the previous 23-case regressions.

Scope: canonical App invocation, Host/registered execution, output declaration and
projection, provider delivery, direct Runtime/schema/sequence/result/media consumers,
formal tests, owning App spec/Inspector and direct API guidance. Preserve raw
input/output validation, partial execution, independent storage, resource ownership,
images, cancellation, retained results and no replay. Do not modify renderer,
geometry, live 101/report sessions, release tooling, dependencies or environment.
Only focused tests; no full-local gate. No prompt-only fix or new mandatory AI step.

### Ordered owner steps and handoffs

1. **Data and execution state - Inspector compose.** App invocation consumes the
   admitted owner definition, input and call identity; validate unmodified owner
   data with Runtime's explicit outcome. Keep the acknowledgement alongside every
   JSON value, never inject Host fields into business data. Existing domain-owned
   status fields remain domain data. Carry identity/contract/validation proof on
   this boundary and invalidate reuse for changed bytes, outcome or invocation.
   Library/sequence/cleanup consumers use that explicit state. Failure reporting
   preserves known settlement; provider state must be model-visible for every
   root shape. No old inline-vs-side-channel fallback.
2. **Raw and delivered contracts - Inspector compose.** Stop rewriting arbitrary
   owner schemas merely to accommodate Host acknowledgement. Original values use
   original constraints; changed model views use declared delivery contracts.
   Internal-field owners must declare their external shape when projection changes
   semantics; do not silently weaken const/enum, exclusivity, negation or uniqueness.
   Reuse the current delivery declaration and field selection owners rather than
   add a second registry. Migrate current declarations and tests together; no
   compatibility alias for superseded packaging or implicit projection assumptions.
3. **Invocation contract to provider - Inspector compose/apply consumers.** Resolve
   the selected tool/revision and owner/model contracts for the invocation, preserve
   that selection through library projection and final transport, and validate the
   actual status-specific model value. Execution state, delivery acknowledgement
   and saving status have different owners; incomplete delivery never reclassifies
   execution. The native protocol uses supported content fields to deliver value
   and acknowledgement, without inventing native RPC fields. Discovery and delivery
   consume the same contract selection. Proof is bound to its producing call and
   contract; independently authored tests assert actual payload/state semantics.

For each owner step, first verify failing formal cases, implement its upstream and
direct consumers, review invalid and legal partial cases, and run its focused
checks before advancing. Update superseded spec/Inspector clauses, not append
contradictory alternatives. Runtime remains composition/inspection owner; App owns
publication and delivery; lease/storage owners remain unchanged. Names are internal
owner-neutral contract names; no new persisted IDs or automatic migration. Reuse
existing validation evidence only for its exact immutable provenance; no new cache.
Prove one owner execution and existing resource-release counts on failure/recovery.

### In-scope handoff review and refinement

The implementation review distinguishes execution outcome from delivery outcome.
A selected registered invocation can execute successfully while its projected child
is partial, or deliver successfully while saving fails. Its model receipt therefore
carries `deliveryOutcome` beside `execution`; model-only branches validate the value
by that delivered state without rewriting the execution state. Raw branches remain
unchanged and cannot admit the model-only failure alternative as success data.
Generic invocation diagnostics keep their own outer fields; a tool projector owns
only its embedded execution result. Known execution evidence carries
`executionOutcome`, after validation and before resource transfer. Invalid or
undecodable evidence cannot establish completed execution.

The existing field-visibility annotation remains an explicit structural declaration.
The removed implicit behavior is semantic schema rewriting: counts, dependencies,
constants, enums, exclusive/negative alternatives and uniqueness must not be guessed
after dropping fields. Such declarations require an explicit `delivery` view and
fail publication when missing. Plain record-field visibility stays supported with
strict raw validation. A root JSON Pointer selects a declared whole-result view;
it does not change the original schema. Current declarations and older positive
tests migrate to explicit views rather than weaker schemas or compatibility rules.

The Host selects the model contract before effects, then attaches that authoritative
selection after invocation middleware. Middleware cannot substitute a schema.
Existing formal tests exposed both a copied failure's lost state and a forged model
contract; the regression cases remain permanent. Invalid sequence admission stays
with canonical admission; projection cannot replace its correctable-input recovery.
Provider tests inspect actual native content, including the separate acknowledgement.
A two-revision regression exposed one remaining name-only lookup: a successful
revision 1 result was projected with revision 2 fields. Forward the selected
revision through registered and sequence child projection, including recovery;
never substitute the latest registration. This is the same invocation-identity
boundary, not a compatibility route.
These refinements stay within the same three owners, exclusions and focused gates.

### Required proof and stop conditions

Run the 27 failures plus existing result/projection, Host/invocation/lease/library,
Runtime contract/recipe, selected provider and exact discovery, retained-result and
native image tests. Update old inline-result and automatic projection assumptions
without deleting invalid-input/output, partial-work or no-replay assertions. Test
model-visible state separately from Host progress. Scoped types, lint, format,
naming and Inspector checks also apply. A rule cannot expand this scope; unrelated
prerequisites stop for scope review. Do not claim live AI or full-app validation.

### Implementation and focused validation

All three owner steps are complete. Raw values now travel with an explicit
acknowledgement for every JSON root. Validation evidence binds the exact call,
owner, bytes and outcome. Selected model contracts are resolved before effects and
cannot be replaced by middleware. Registered receipts distinguish execution,
delivery and storage; child projections retain the selected revision and are not
selected twice. Original raw validation and final status-specific validation remain.

Removed the Host schema decorator, injected acknowledgement fields, old stage
arguments and implicit semantic hidden-field rewrites. Structural visibility remains
an explicit field declaration; semantic views require a declared delivery schema.
Updated direct consumers and former positive tests; no compatibility path, success
fallback, new mandatory model step or weakened validation was introduced.

The final self-review covered valid and invalid output, foreign validation proof,
partial execution, successful execution with failed saving, resource handoff and
cleanup failure, scalar/null/image delivery, middleware contract substitution and
two registered revisions. The two-revision case failed before the last correction
and passed afterward without executing the source twice. It is retained as a formal
regression, alongside the original 27 failures and the previous 23-case coverage.

Focused evidence is under `tmp/conversation-improvements/` in this worktree:

| Boundary                                                  | Passing cases | Evidence                                  |
| --------------------------------------------------------- | ------------: | ----------------------------------------- |
| Whole-result regression, Host and library controls        |           168 | `canonical-revision-after.log`            |
| Invocation, library, leases and selected-prefix recovery  |           115 | `canonical-lifetime-verified.log`         |
| Projection, retained handoff and delivered model boundary |            46 | `canonical-projection-verified-final.log` |
| Runtime contract and recipe checks                        |            79 | `canonical-runtime-final.log`             |
| Actual native provider result/state packets               |            21 | `canonical-provider-verified-final.log`   |
| Provider high-level usage and real owner execution        |             2 | `canonical-provider-preparation.log`      |
| Image delivery and evaluation input correction            |            46 | `canonical-image-evaluation-final.log`    |
| Opt-in native image interface                             |             3 | `canonical-native-image-final.log`        |
| Exact discovery audit and supported schema constraints    |            16 | `canonical-audit-recheck-final.log`       |
| Retained mapping after saving failure                     |             2 | `canonical-remaining-consumers-final.log` |
| Retained image and named-result execution proofs          |             2 | `canonical-consumer-review-final.log`     |
| Model delivery cost check                                 |             1 | `canonical-model-boundary-final.log`      |

The retained mapping and execution-proof logs include initial harness/selection
failures; their named final cases passed. The execution proof mock now preserves
unmocked Node exports and still substitutes spawn. The cost check shares its log
with three model-boundary cases already counted above. This table does not count
excluded tests or sum repeated runs.

Scoped TypeScript, ESLint, formatting, naming and Inspector checks complete the
bounded gate. ESLint has no errors; four existing console warnings remain in the
selected provider/proof files. No full-local, live 101, release, remote operation,
renderer change or report-session mutation was performed. This establishes the
mechanical handoff contract, not live model behavior or whole-App correctness.

## Complete result conversion and state handoff

November 11, 2026. Approved implementation on the existing
`codex/ai-conversation-improvements` worktree, preserving its dirty predecessor at
`036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82`. Status: complete with focused validation.

### Analysis and bounded task contract

The reviewed path is declaration/admission -> discovery -> owner execution ->
Host acknowledgement -> selected data/storage -> provider transport -> cleanup
and recovery. Evidence is retained under `tmp/conversation-improvements/` as
`receipt-flow-audit-*.log`; 376 focused cases passed and 23 failed. The failures
are five product boundaries, not 23 independent defects:

- Outer partial acknowledgement incorrectly selects the owner's partial payload
  schema even when execution succeeded and only storage/delivery is incomplete.
- Native error construction reparses malformed JSON and can bypass call cleanup.
- Accepted non-object result schemas cannot pass the object-only App packaging.
- Internal-field projection removes properties but leaves conflicting property
  counts and dependent requirements in the published schema.
- Transport success can contradict the validated acknowledgement after wrapping.

The obsolete projection test also expects unsupported pattern/conditional rules
to validate. Preserve its domain-key projection intent using admitted schemas,
and explicitly retain unsupported-rule rejection. Equality audits reuse production
schema generators; keep them for drift detection, not as independent correctness
oracles. Direct execution and provider tests must assert behavior independently.

Scope: App tool invocation/Host, registered result envelopes, result projection,
provider transport, their existing runtime consumers and formal tests, and owning
specification/Inspector/docs. Preserve strict raw input/output validation, legal
partial work, independent saving, original data shapes, resource lifetime, native
images, cancellation, selected fields, named reuse and no replay. No compatibility,
prompt change, new dependency/cache, geometry/rendering work, live model/101,
full-local test, release work or remote operation. Unrelated required changes stop
this task for scope review. Final review stays within this complete path.

### Ordered owner execution cards

1. **State handoff - App Inspector `compose`.** Owner: invocation envelope and
   Host transport. Validate payloads by their actual execution status; separately
   constrain outer acknowledgement and same-execution settlement. A successful
   payload remains a success payload when storage fails. Derive transport success
   from validated outcome rather than a copied flag. Preserve independently settled
   child recovery and strict invalid-result rejection. Prove the distinct partial
   shape and flag cases through discovery, internal calls and actual provider RPC.
2. **Result conversion - App Inspector `compose`.** Owner: raw invocation and
   canonical result schema/projection. Keep accepted arrays/scalars/null intact
   through direct and registered routes, with explicit outcome metadata at the
   Host boundary; do not infer product success before validating owner output.
   Transform internal-field constraints together with fields, retaining strict raw
   validation and public field constraints. Use the existing reference/context
   traversal and resource annotations. Preserve object results and declared views.
   Prove all admitted shapes, copied/identity replies, hidden field count/dependency
   cases, references, retained IDs and actual provider bytes. No version fallback.
3. **Failure settlement - App Inspector `compose`.** Owner: Host lifecycle.
   Decode once; retain successfully decoded evidence for error acknowledgement.
   Never parse failed bytes again to build an error. Close every opened scope even
   if result validation, resource transfer or failure construction fails. Keep
   original execution evidence, correct no-dispatch/uncertain distinctions,
   cancellation carriers, cleanup retry and one owner execution. Prove malformed
   JSON, resource transfer/cleanup faults, continuation and terminal disposal.
4. **Integrated independent proof - App `compose/apply` consumers.** Preserve
   existing success/partial/recovery, persistence, named reuse and image tests.
   Replace the obsolete unsupported positive oracle without relaxing admission.
   Add independent valid/invalid payload cases at real provider discovery and
   delivery, including crossed states and field projection. Exact schema equality
   is supplementary. All 23 baseline cases and affected normal paths must pass.

These steps use existing owner/consumer boundaries: Runtime handles composition
and result inspection; App owns schema semantics and transport; leases own resource
lifetime; storage owns saving. No model decision or diagnostic grants validity.
Reuse identity/text-bound validation only while its evidence is unchanged. Schema
conversion remains definition/invocation scoped; tests retain owner-call and cleanup
counts. Local names are owner-neutral internal helpers, with no new persisted ID.

Gates: the 23 failures; focused result, schema, Host, invocation, leases, library,
Runtime contract/recipe, conversation result and image suites; selected provider
RPC and exact discovery tests; three pinned offline native image cases; scoped
types/lint/format/naming and Inspector checks. Review each completed owner and its
handoffs before advancing. Do not claim whole-plan closeout or live-model coverage.

### Progress

- Baseline and design reviewed against current source, App spec and Inspector
  `compose` handoffs. The five defects are assigned to canonical owners above;
  existing invalid-result/no-replay tests remain required negative controls.

- State handoff reviewed: 16 targeted receipt cases and 57 existing library/Host/
  recovery controls pass. Selected real provider RPC cases pass (10), including
  distinct partial data, transport flags, non-object data and internal constraints.
- Result conversion reviewed: admitted JSON root shapes retain their values under
  identity and copied replies; explicit partial scalar outcomes and corrupted copy
  rejection pass. Counts/dependencies across inline, allOf and referenced contracts
  preserve valid output and reject missing/invalid public fields. The combined
  conversion run passes 93 cases; its sole remaining failure is the separately
  assigned malformed-JSON cleanup defect. Raw owner validation remains unchanged.
- Failure settlement begins after checking the existing compose lifecycle contract.
  Keep decoded evidence separate from undecodable bytes and release in finally.

### Implementation and review outcome

The original failures are retained as regression behavior:

| Boundary                                           | Baseline failures | Correction                                                                                        |
| -------------------------------------------------- | ----------------: | ------------------------------------------------------------------------------------------------- |
| Successful data with partial outer acknowledgement |                 2 | Select the payload by execution status; keep outer acknowledgement and storage separate.          |
| Malformed repackaged JSON                          |                 1 | Decode once, construct failure from decoded evidence only, release every opened scope in finally. |
| Non-object results                                 |                11 | Preserve raw JSON shape and carry the acknowledgement at the Host boundary.                       |
| Internal-field counts/dependencies                 |                 4 | Convert constraints with the fields, through composition and reference scopes.                    |
| Conflicting transport success flags                |                 4 | Derive the flag from the validated acknowledgement.                                               |
| Unsupported-schema positive test                   |                 1 | Replace with admitted variant/open-value schemas; explicitly reject unsupported constraints.      |

Review followed declarations through both registered and direct provider routes.
That exposed additional consequences of the non-object defect: direct progress
still expected inline object metadata, and a scalar delivery view lost its original
acknowledgement. Permanent regressions first reproduced both; their consumers now
use the same Host acknowledgement. The fake provider paging reader also assumed
JSON was never null; its parser now accepts null without changing product validation.
A nested reference with sibling property counts reproduced a missing projection
scope; the converter now resolves the original reference context. These are within
the same conversion/handoff scope, not separate tool capabilities or fallback paths.

Additional negative controls reject corrupted copied scalar data, changed outcome
metadata under identity/copy packaging, missing public dependent fields and invalid
public/hidden values. Published artifact cleanup is counted after malformed output;
resources release once and subsequent calls/disposal work. Successful mutations
with storage failure and independently settled partial children remain accepted.
No unsupported keyword is admitted and no owner constraint is bypassed to make a
model projection pass. Provider tests inspect published usage and actual RPC values,
not just equality between two calls to the same schema generator.

Final focused evidence is under `tmp/conversation-improvements/receipt-flow-*-final.log`:

| Focused suite                                                    | Passing cases |
| ---------------------------------------------------------------- | ------------: |
| Results, whole-result handoff, projection and conversation reuse |           123 |
| Host, invocation, leases, library, selected recovery and images  |           190 |
| Runtime tool contracts and recipe execution                      |            79 |
| Provider discovery, registered/direct RPC and delivered values   |            14 |
| Exact delivery audit and supported schema rules                  |            16 |
| Pinned offline native image transport                            |             3 |
| Total behavior cases                                             |           425 |

The three native image cases initially skipped by the ordinary image suite ran
separately with its existing explicit binary setting and passed. Other skipped
cases are intentional title selection, not failed checks. Inspector and naming
checks are separate from this total. Provider RPC uses the formal controlled backend
and real production App path; native images use the existing offline native harness.
This evidence does not claim live-model, 101, whole-app or full-local coverage.

Scoped TypeScript compilation, formatting/diff checks, the 15-case naming gate and
both Inspector contract cases pass. ESLint reports no errors; its three existing
console warnings are outside these changes. Final review covered the modified
conversion boundaries and their direct consumers, retaining strict rejection,
legal partial completion, saving independence and resource recovery. No commit,
push, compatibility route or additional mandatory model workflow was introduced.
This closes the bounded handoff task, not the wider plan.

## Host receipt validation and result branch consistency

November 11, 2026. Approved follow-up in the existing
`codex/ai-conversation-improvements` worktree, retaining its dirty predecessor at
`036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82`. Status: complete with focused validation.
This task does not close the wider plan.

### Evidence and bounded contract

The permanent whole-result review baseline had ten failures: four copied/mutated
invalid-status replies bypass native handoff validation, one of those paths can
acknowledge an already released request artifact, and five contradictory outer
outcomes pass published result contracts (three also pass host invocation).
The last two pass discovery but fail runtime selection. The recovery-only
correlation added previously does not protect success/partial branches.

Scope is native Host result validation/resource transfer and registered invocation
schema generation, their direct consumers/tests, this plan and the owning App
specification/Inspector. Preserve raw owner validation, valid partial prefixes,
successful execution with unsaved storage, cancellation, per-child recovery,
strict domain constraints and no replay. No compatibility, weaker validation,
prompt change, new cache, renderer change, live 101, full-local test or remote
operation. An unrelated required owner change stops this task for scope review.

### Ordered execution cards

1. **Host handoff - AI execution `compose`.** Input: owner-validated native
   reply, possibly reconstructed by execution instrumentation. Output: validated
   host envelope and transferred request resources, or `TOOL_HANDOFF_FAILED`.
   Reuse Runtime's existing result inspection to reject invalid outcomes before
   schema selection. Preserve identity/text-bound validation reuse; revalidate
   reconstructed envelopes under the projected host contract. Transfer resources
   only after valid output, release rejected resources once, never replay work.
   No new public identity or persistent state. Prove the five status/resource
   failures and valid artifact lifetime, raw output negatives, cancellation and
   stopped-successor controls before advancing.
2. **Invocation branches - AI execution `compose`.** Input: selected owner
   schemas; output: the same result alternatives for discovery and invocation.
   Discriminate success, partial and recovery branches by their actual outer
   status; correlate settlement across layers describing the same execution in
   every branch. Keep independent child recovery settlements and storage status
   independent. Reuse small schema conditions rather than duplicate owner payload
   schemas. Remove the recovery-only correlation path. Prove all five contradictory
   outcomes reject at discovery and invocation; retain valid partial/completed,
   declared recovery, unsaved storage and exact schema-audit controls.

The existing Inspector `compose` owner publishes and validates these contracts;
`apply` and provider delivery consume them without repairing receipts or executing
again. Runtime inspectors classify results; App validators own schema semantics.
Existing request leases own resource lifetime. Tests and model choices cannot
grant validity. Definition/invocation-scoped schema derivation and owner execution
counts remain unchanged; no new cache is authorized.

Gates: all ten permanent failures; focused Host/invocation/library/lease and
prefix-recovery cases; selected actual provider transport and exact usage audit;
flow-proof types, scoped lint/format/naming and affected Inspector contract checks.
Review each step's direct handoffs before advancing, then the bounded final diff.

### Progress

- Review baseline: `receipt-envelope-review-*.log` in the existing
  `tmp/conversation-improvements/` evidence directory. The previous blanket
  completion claim does not establish complete receipt validation; this task
  addresses its two reproduced gaps without undoing valid partial completion.
- Step 1 reviewed: canonical Runtime inspection validates reconstructed outcomes
  before selecting their host schema or retaining request resources. Unchanged
  identity/text-bound validation evidence still reuses completed validation. All
  five status/resource failures now pass, with 140 Host/invocation/lease/prefix
  controls passing. The five branch-consistency failures remain for step 2.
  Evidence: `receipt-handoff-fix-before.log`, `receipt-handoff-fix-step1.log` and
  `receipt-handoff-fix-step1-controls.log` in the same directory.
- Step 2 reviewed: every invocation result alternative now correlates settlement
  across the same execution. Partial output admits only a partial outer outcome;
  failed/unknown receipts use recovery validation. The old recovery-only condition
  is removed. The five contradictory combinations reject in both delivered usage
  and invocation. Successful-work/unsaved-storage, declared partial/recovery and
  aggregates with independently settled children remain valid.
- Final bounded verification: all ten original failures pass unchanged. The six
  result/Host/invocation/library/lease/prefix files pass 196 tests; composition and
  selected batch usage pass 78; actual provider transport passes five; exact usage
  and audit negatives pass six. The new provider cases use admitted data-plane
  fixtures and inspect the delivered contract and real native response, with one
  owner execution and no drawing dispatch. Flow-proof types, two Inspector checks
  and 15 naming checks pass. Scoped ESLint has no errors (one existing provider
  test console warning); formatting passes. No test was removed or weakened.
  Evidence: `receipt-handoff-fix-*.log` in the same directory. No product fallback,
  compatibility, prompt change, live-model test, full-local, commit or push.

## Failure receipt consistency and empty operation contracts

November 11, 2026. Approved bounded follow-up on the existing
`codex/ai-conversation-improvements` worktree and accepted dirty predecessor at
`036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82`. Status: complete with focused validation.
This is part of this plan, not whole-plan closeout.

### Evidence and scope

The review's permanent cases reject a contradictory completed receipt in delivered
usage, reject completed failed/unknown receipts at the real registered handoff,
and preserve a canonical inspection-only tool set. The existing provider input
correction case also fails because the operation generator publishes an empty
name enumeration. These are five failing cases, not five independent defects.

Scope: App invocation envelope generation, native owner/registry contract selection,
operation contract generation, their direct tests and provider consumer, and owning
specification/Inspector/docs. Preserve strict input/output validation, valid
completed results with unsaved storage, partial prefixes, cancellation, retention,
no replay and tool availability. No compatibility, weaker validation, prompt change,
new cache, renderer work, dependency change, live 101, full-local test or remote
operation. Review only these owners, direct consumers and the bounded regressions.

### Ordered execution cards

1. **Receipt consistency - AI execution `compose/apply`.** The App invocation
   owner publishes and validates the same selected owner result contracts. Keep
   Runtime's internal diagnostic envelopes distinct from the owner's declared
   recovery payload; do not feed a registry-added unrestricted failure alternative
   back into a selected public invocation. Represent common unacknowledged failures
   as complete invocation alternatives whose execution settlement agrees with the
   nested failure and cannot claim success/completion. Preserve acknowledged owner
   partial/recovery validation and successful owner data when storage is unsaved.
   Reuse existing host schema projection at discovery and invocation; no new wire
   identity, persistence format or retained state. Prove the three receipt failures,
   storage recovery without re-execution, invalid-prefix negatives and exact actual
   usage; review before advancing.
2. **Empty operation contracts - AI execution `compose`.** The operation owner
   must describe an empty batch capability with a valid rejecting schema, not an
   empty enumeration or fabricated operation. Other native tools and supported
   inspection remain available. Keep malformed/unsupported declaration rejection;
   arbitrary batch names and empty batches still reject before dispatch. Prove the
   two startup failures, actual provider correction in one turn, and ordinary
   nonempty batch usage. Review before final integration.

These cards select the existing App Inspector's registration/compose and canonical
apply boundaries. Inputs are registered owner contracts and invocation receipts;
outputs are executable discovery schemas and validated delivery. App owners alone
compose these envelopes; Runtime scheduling, model choices and tests do not supply
product validity. Failure ownership stays at admission/handoff with factual
settlement and no replay. Schema derivation remains invocation/definition scoped;
there is no new cache or payload scan, and owner execution counts remain unchanged.

Gates: the five review failures, whole-result and batch negatives, schema/host/
invocation/tool-library tests, selected provider protocol cases, exact schema audit,
scoped types/lint/naming and affected Inspector contracts. All five failures must
pass on the same source, with successful-work/unsaved-storage and unsupported-rule
controls retained. Final review covers the bounded diff and direct consumers only.

### Progress

- Review evidence: `tmp/conversation-improvements/recovery-support-review-*.log`.
  Four permanent review cases and one existing provider case fail before fixes.
  The preceding report's blanket recovery-safety conclusion is withdrawn; exact
  schema equality alone cannot prove valid outcome combinations.
- Step 1 reviewed: native discovery and invocation now use the same owner result
  projection. Common failure alternatives correlate outer/inner settlement and
  exclude successful execution; Runtime diagnostic additions no longer become
  selected owner recovery. The three original receipt failures and four additional
  completed-inner variants pass, with valid unsaved results and no-replay controls.
  Forty result/batch cases, 124 invocation/host/library cases and three exact actual
  usage routes passed. The first audit also passed 594 cases; its broad native
  selection took 132.73 seconds. Final envelope construction shares the large
  result schema and uses small correlation conditions; the affected exact routes
  were rechecked after that refinement. No throughput claim relies on timings.
- Step 2 review exposed a direct handoff prerequisite after registration succeeded:
  an instrumented/copied reply loses its object-identity validation receipt. The
  host then compared an acknowledged envelope against the raw owner schema,
  rejecting its own toolOutcome metadata. Reuse the same host contract projection
  for that validation path, while raw owner validation remains unchanged. The
  existing read-only regression detects it; additional valid/negative-count/extra-
  field direct-reply controls preserve strict validation and one owner execution.
- Step 2 reviewed: empty operation sets use a false name schema; independent native
  reads remain available. The real owner still rejects arbitrary names and empty
  batches before dispatch. The original provider correction case passes unchanged.
- Final bounded review: all five original failures pass on the final source.
  Twenty whole-result/review cases, 24 batch cases, 170 schema/host/invocation/library
  cases, 81 composition/prefix-recovery cases, five provider cases and 392 focused
  declaration/exact-audit cases pass. App flow-proof types, 15 naming checks, two
  Inspector contract checks and three maintained-test/type-membership checks pass.
  ESLint has no errors and the existing batch measurement console warning only.
  Raw owner validation, host acknowledgement validation and diagnostic recovery are
  distinct; none is bypassed. No compatibility, full-local, live-model run, commit
  or push. The selected task is complete; the wider plan remains active.
  See the [detailed follow-up report](../reports/contract-verification-and-current-pixi-2026-11-11.md#follow-up---failure-receipt-consistency-and-empty-operation-contracts).

## Complete result validation and handoff

November 11, 2026. Approved follow-up in the existing
`codex/ai-conversation-improvements` worktree at base
`036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82`, including the accepted dirty
predecessor and the review's permanent failing tests. This is a task within this
plan, not whole-plan closeout. Status: complete with focused validation.

### Evidence, scope and acceptance

The review reproduced three defects through current host usage and execution:
selected containers lose their original local-reference root; the App validator
silently accepts a published `dependentRequired` violation; the delivery audit
accepts an additional unconstrained union alternative. Whole-root forwarding,
negative numeric bounds, closed properties and successor stopping are controls.

Scope: Runtime registered-schema projection/admission, the App tool validator
and registration boundary, the exact delivery-audit oracle and canonical result
negative tests, their test/type entry points, and directly owning specs/Inspectors.
Read current owners, their callers and these regressions only. Preserve strict
inputs/outputs, typed binding proofs, runtime lifetimes, partial settlement,
no replay, independent retention/delivery and optional review. No compatibility,
prompt repair, renderer change, dependency addition, live 101, full-local test,
release work or remote operation. A necessary unrelated owner change stops this
task for scope review; a failure inside these boundaries requires iteration.

### Ordered owner steps and review gates

1. **Reference handoff - Runtime `admit/invoke`, App `compose`.** Preserve the
   original reference context when a registered result subtree becomes a new
   validation root, including siblings, nested/recursive references and runtime
   annotations. Reuse the existing schema traversal/embedding owner. Materialize
   only the reachable reference graph, without expanding recursive trees or
   importing unrelated result payloads. The selected whole-container regression
   must pass through published usage and actual host delivery. Keep whole-root,
   invalid-result, downstream binding and no-replay controls. Review discovery,
   retention and envelope embedding before advancing.
2. **Validator support - App `compose/apply`.** Enforce published supported
   constraints, including the reproduced dependent-field rule. Unsupported schema
   semantics must be rejected explicitly before publication/execution rather than
   ignored or turned into successful output. Keep schema annotations distinct from
   constraints; inspect schema locations, not literal examples or arbitrary JSON
   data. Validate the same supported contract at input and output boundaries.
   Add unsupported/nested/union cases before implementation and preserve existing
   built-in declarations, recovery and no-replay behavior. No new validator package.
3. **Exact audit - App `compose` verification.** Replace subset matching with an
   exact comparison at the correct owner/observed/model boundary. Normalize only
   semantically unordered sets and equivalent object defaults. Reject extra union
   alternatives and dropped constraints. Restore canonical invalid-result runs
   with well-formed fixtures; do not skip them or restore obsolete envelopes.
   Register the new review regressions in maintained test/type entry points.

Each step above is its execution card: the existing reusable-tool composition
`admit/invoke` and AI execution `compose/apply` contracts own inputs, results,
contributors and failure handling. Changes remain in their schema/validation/test
boundaries. Re-read these steps before advancing and update their contracts only
where this follow-up clarifies an actual responsibility. No new cache or lifecycle
is introduced; reference projection is one finite reachable graph per selected
schema and owner invocation counts must remain unchanged.

Gates: the three review regressions; relevant Runtime admission/flow/tool-contract
files; App schema, invocation, host, selected delivery/usage and API audit cases;
focused provider contract/repair cases; scoped type checks, lint, naming and
Inspector contract checks. Review each completed slice before the next. Final
closure requires all three original failures to pass on the same source, retained
negative controls, and a bounded review of the touched diff/direct consumers.

### Progress

- Step 1 reviewed: selected containers now carry a self-contained reachable
  reference graph. Removed the old consumer override of the projected root.
  Replaced the old expected standalone-reference failure with positive value
  validation and retained document/request/secret portability negatives.
  Runtime focused files: 142 passing; host reference/control cases and direct
  lease consumers pass; the current Runtime build supplies App consumer tests.
- Step 2 reviewed: supported dependent fields are enforced, unsupported/malformed
  declarations reject before publication, and value validation checks the same
  vocabulary. Root recursion and literal-data separation have permanent cases.
  Schema/host/invocation checks: 124 passing. Actual selected usage/publication:
  205 passing. The normalization fixture now starts from a valid declaration;
  duplicate type/required declarations have explicit rejection cases instead.
- Step 3 refinement from restored negative execution: registered invocation
  discovery omitted common leaf failure values nested under execution. Reuse the
  invocation failure owner, and limit the added public boundary alternative to
  unknown/not-started settlement; acknowledged prefixes must still satisfy the
  selected owner's strict partial/recovery schemas. The existing negative prefix
  tests detected a too-broad intermediate alternative and remain mandatory.
  Exact audit compares ordinary operations to registration, and action wrappers to
  their canonical model result plus the registered observation owner; these are
  distinct boundaries. Do not mistake capture-owner enrichment for a dropped
  constraint. Literal JSON and reference siblings must not be normalized away.

All three review counterexamples now pass. The final owner review preserves exact
success/partial/recovery boundaries and no replay; no compatibility path remains.
Final focused evidence: 142 Runtime cases, 194 App schema/host/invocation cases,
24 batch cases (also included in the 36-case final recovery slice), 390 exact
usage/action audit cases, five provider cases, 42 Inspector/test-membership cases,
15 naming cases, Runtime build and App flow-proof types. ESLint has no errors and
one pre-existing console warning in batch measurement output. No full-local,
new live-model/GPU run, commit or push. Detailed results are in the
[follow-up report](../reports/contract-verification-and-current-pixi-2026-11-11.md#follow-up---complete-result-validation-and-handoff).

## Current contract verification and SDK proofs

November 11, 2026. Approved follow-up to the expanded Pixi upgrade validation.
Base: `036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82`, current
`codex/ai-conversation-improvements` worktree with accepted uncommitted
predecessor changes. This is a child task of this plan; it does not close the
entire conversation plan. No remote operation is authorized.

### Evidence and frozen scope

The [SDK report](../reports/pixi-resource-lifetime-upgrade-2026-11-10.md) lists
the original failed suites. Old-SDK reproduction establishes attribution only,
not permission to ignore failures. The subsequent review found:

- Eighty API audit failures mix owner and Runtime-delivered schema boundaries
  or compare unordered `required` sets as ordered arrays. Browser action
  observation adds `toolOutcome`; owner fixtures must not impersonate it.
- Three current-version cases expose two real discovery defects: registered
  reference-plus-sibling constraints become unsupported dependency schemas, and
  projected registered results lose their reference root during portability
  analysis. Search fails before any canvas operation.
- Superseded tests still demand automatic mechanical review/approval, top-level
  reference receipts, old `plan` inputs, direct execution of host envelopes,
  old revision identities, old capture-ledger revision and a 15-minute ceiling.
  Search tests also assume plural forms cannot match and every descriptive
  query must remain a menu. Do not restore any of those old contracts.
- Five typing errors are in fixtures/cleanup/result narrowing. Type-check
  entries omit affected tests and still name removed files.
- Formal Pixi tests already import the installed SDK, not an old dependency.
  However, installed-version output directories do not prove browser-loaded
  identity. App handoff evidence needs the current dependency identity alongside
  source hashes; old-version evidence must never satisfy a current proof.

Mutation is bounded to these failed App AI tests and their direct production
owners, schema proof/projection in `ai-agent-runtime` when required, App test and
type-check entry points, current Pixi browser proof/handoff consumers, and their
specifications/Inspector contracts. Use the recorded failure inventory, current
source, exact call sites and focused regressions; no new repository-wide audit.
Keep admission constraints, resource lifetimes, failure settlement, no replay,
current host routing, independent retention/delivery, optional explicit review,
image fidelity, restore data and renderer semantics. No compatibility aliases,
prompt-only repair, dependency change, new live AI/101 run, full-local suite,
release gate or unrelated optimization.

### Ordered implementation and acceptance

1. **Audit the correct result boundary.** Under execution `compose/apply`,
   normalize only unordered schema sets and test owner, observed and model
   outputs separately. Add negative assertions for omitted required fields,
   altered types/enums and failed/partial outcomes. Do not remove constraints
   or accept an internal resource branch as a public success result.
2. **Repair schema handoff.** Under execution `compose` and reusable-tool
   `admit/invoke`, use the existing canonical schema/reference owners to preserve
   reference roots and sibling constraints through discovery, selected results,
   host routing, retention and downstream binding. The three existing red cases
   are the initial regression. Add actual successful/failed delivery and no-replay
   checks before advancing; no caught-error fallback or permissive schema.
3. **Remove superseded test responsibilities.** Under `compose/inspect/settle`,
   port current consumer tests to host invocation routes and `references[]`.
   Delete assertions/fixtures that certify removed automatic review; preserve
   explicit mechanical analysis, canonical mutation, repair, saved data, image
   delivery and reuse, cancellation, history and durable-prefix cases. Historical
   evidence stays immutable; current executable fixtures use the current input.
4. **Repair types and verification membership.** Correct the five fixture errors
   without weakening shared types or casting away invalid output. Remove stale
   type-check paths and include the affected maintained test families so old
   signatures cannot silently pass through transpilation. Keep scope limited to
   this App and current contract tests, not all workspace packages.
5. **Bind GPU proofs to the current SDK.** Under `render-material` and
   `project-render-hierarchy`, assert browser-loaded Pixi identity against the
   installed/locked version and carry it through source-verified App handoffs.
   Keep same-version control policies, current exact image/work/lifetime oracles
   and source freeze during browser proof. No old SDK installation/execution.
6. **Bounded closure review.** Run the affected suites and exact browser cases,
   scoped types/lint/naming, and current native GPU proofs. Recheck each owner and
   handoff after its slice. A test previously blocked by a stale assertion must
   complete its remaining assertions before being called verified. Record results
   and any remaining limitation in a detailed report; never infer App-wide green
   status from this scoped run.

Each numbered step is its execution card: the cited Inspector owner supplies
the unchanged inputs/outputs, conditions, allowed contributors and failure owner.
Step 1 starts with the current failed audit and negative-oracle cases. New
identifiers are test/proof-local; there is no new persisted or public identity.
Implementation review: Step 1 review rejected a repeated schema
compaction in the initial oracle change: re-compacting a resolved recursive
schema changes its proof representation. Compare each boundary after one
projection only, add observation metadata only to the primary browser receipt,
and sort required sets after normalization. Keep compact assertion output so
large schema failures remain diagnosable. Representative cases must pass before
the bounded audit group is repeated.

Step 2 review expanded the existing handoff proof through the advertised host
route. Registered output contracts with unsupported implication keywords were
rejected before execution even when the sequence merely returned the complete
result. Preserve the exact output schema for runtime validation and whole-result
forwarding; opaque fields still cannot supply typed bindings. Input admission
remains strict. Do not broaden general intersection implication to make this
pass. Query inability to prove a field is a typed reference issue, not a tool
execution failure; the complete published contract remains unchanged.

Completion: all six steps are complete for this bounded follow-up. The closing
[report](../reports/contract-verification-and-current-pixi-2026-11-11.md) records
real schema defects, removed executable expectations, type coverage, exact
focused results and current-SDK evidence. No compatibility path, prompt-only
repair, full-local run or remote operation was added. This closes the child task,
not the entire conversation plan.

## Local hierarchy work and projection

November 10, 2026. The agent supplied four exact saved root IDs in the
`assembly` step of run `taipei-101-fixed-1794244803070`. It did not request a
whole-document search. `api_hierarchy_groupElements` calls the App hierarchy
adapter, then Preset `groupElements`. Preset's previous read interface exposed
only `sceneTreeSaveData`; preparation serializes every element to obtain four
roots and their parent's order. Save validates the complete tree, and the
subsequent SceneTree move validates it again. Core already exposes metadata,
children and element reads. The excessive read belongs to the tool's framework
implementation, not an agent-selected query or provider requirement.

The four roots contain 25,539 drawable descendants. The recorded grouping call
took 155.726 ms; grouping plus two captures took 613.270 ms. Retained browser
phases show one new Group strategy, eight direct coordinate updates, no vector
strategy rebuild, UI flush 29 ms (including 17.7 ms hierarchy projection), and
one 34.7 ms synchronous render call. These nested measurements are not additive
or GPU elapsed time. Per-node counters were evicted; exact SDK visit counts are
not measured by that run. Pixi reparenting walks descendants until a render-group
boundary; the SDK batch partitions exclude Graphics, which represent design Groups.
UI flattening also falls outside the tail-addition optimization. Region bounds
are invalidated lazily; unchanged world bounds require proof before reuse.

### Render boundary acceptance revision

November 10, 2026 - approved follow-up to the small-group regression review.
The earlier production policy remains the measured candidate, not an accepted
universal optimization. This task is associated with Local hierarchy work and
projection and its existing project-render-hierarchy Inspector owner.

Objective: retain useful reparent savings without increasing ordinary rendering
cost for many small Groups. Preserve world geometry, painter order, element and
resource identity, queries, snapshots, failure recovery, history and shared replay.
Same-source comparisons hold all completed Core, Preset and UI corrections fixed.
The historical 155.726 ms provider call is context, not the rendering baseline.

1. **Same-source measurement.** Extend the permanent local benchmark to the
   retained 101 fixture, ordinary redraw, camera motion, actual parent translation
   and compensated reparenting. Keep previous/current Group strategies isolated
   in the test probe. Record CPU mutation/render, GPU timer/completion, work counts,
   source and fixture identity. Count decision overhead as well as saved work.
   Distinguish 25,539 visible leaves from 25,491 leaves under the four retained
   roots: 48 ornaments were moved out before the immutable fixture was saved.
2. **Bounded feasibility proof.** Before production edits, use permanent owner
   tests to verify whether existing public engine/SDK paths can retain native
   work for a logical-only reparent while preserving bounds, snapshot selection,
   coordinates, order and subsequent child/parent changes. Explicitly compare
   ordinary native reparent, isolated render domains, and retained native placement
   with changed logical ownership. Identity partition containers alone do not
   prove general transform separation. A failing candidate is evidence, not
   permission for a renderer rewrite or weakened oracle. Review the whole handoff
   before selecting a production design.
3. **Smallest proven owner change.** Only after step 2 passes, update the necessary
   Render/engine handoff and Group policy together. Preserve complete transaction
   changes and query-before-frame correctness. Do not infer that every container
   is invisible, or that equal matrices clear independent descendant dirty work.
   Update conflicting Preset/Render/Pixi specs, Inspector and tests together;
   remove superseded behavior rather than retaining compatibility routing.
4. **Focused integrated acceptance.** Re-run the affected native, shared-engine,
   region, hierarchy/history/replay and browser cases on the same source. Compare
   large-subtree and small-group CPU/GPU results in warmed reversed-order blocks,
   with deterministic work counts and image assertions. Include real parent
   translation, edits and reorder so savings are not shifted to another operation.

Scope: existing hierarchy/render owner families, their direct contracts and
permanent tests. The initial slice changes only this plan and local benchmark/
feasibility tests. No new group-size threshold, dependency, private SDK flag patch,
texture substitution, duplicate canonical scene, prompt change, full-local suite,
release gate or new AI drawing. No commit/push is included. Production changes
remain gated by feasibility; if the bounded candidates cannot meet the complete
handoff, record the exact failure and revise the design before production work.

Step 1 card: owner project-render-hierarchy; inputs retained fixture/current
strategies; outputs same-source measurements and validity checks; no production
semantics change. Reuse the local benchmark and test-only policy probe. New names
are test-local, non-persisted measurement identities. Gates: naming, scoped lint,
local benchmark and raw-sample/pixel review.
Step 2 card: same owner; test the canonical-to-native handoff, including negative
cases and cost. Native SDK imports stay inside render-engine-pixi. No candidate
is installed into the live app. Gate: focused permanent native feasibility tests
and an explicit design review; failure leaves steps 3 and 4 pending.
Steps 3 and 4 cards must select the proven design and exact contract before edits;
the current Inspector is not silently reinterpreted as permitting flattened
native ownership. Existing accepted correctness evidence remains required.

Status: step 1 complete. Step 2's bounded public-SDK candidates are rejected as
complete solutions: ordinary reparent and RenderLayer still visit descendants;
RenderGroup retains work but regresses many-small-group frames; retaining native
placement with an order-only layer loses Group transform/bounds ownership.
Production steps 3 and 4 are not admitted. See
[measurement and feasibility evidence](../reports/hierarchy-boundary-feasibility-2026-11-10.md).

Step review: the final seven-case browser matrix and two-case confirmation pass
measurement integrity. Real-scene reparent completion is 54.30 -> 10.00 ms and
56.90 -> 10.90 ms, while 1,000-vector-Group redraw CPU is 1.95 -> 2.60 ms and GPU
0.248 -> 0.592 ms in confirmation. Four new native characterization tests and
four existing partition tests pass; this reproduces the limitations, not product
feasibility. No production changes were made.

### Retained projection feasibility revision

November 10, 2026 - approved continuation of step 2. This is a bounded
experiment, not adoption of a new renderer. The existing independent Group
policy remains installed. The measured large-scene completion saving (46 ms)
and small-group steady CPU/GPU costs (0.65/0.344 ms, separate passes) must be
reported as distinct absolute costs, not a universal net regression.

Scope: this plan, its feasibility report, permanent hierarchy tests and
engine-owned test probes, and the local browser benchmark configuration.
No production or public API change is admitted before all four phases pass.
No size threshold, private SDK state mutation, dependency, texture substitute,
second canonical scene, AI drawing, full-local gate, commit or push. Preserve
existing dirty changes and live services. New identifiers are internal,
non-persisted test identities owned by their test package.

1. **Applied changes and read barriers.** Exercise official grouping in the real
   App and record applied versus committed events, parent/order and coordinate
   compensation, and reads before the next frame. Verify rollback, history and
   shared replay through the existing focused hierarchy case. Applied batches
   are not whole transactions: retain accepted changes until the next rendering
   or query barrier, without delaying canonical reads or inventing a transaction.
2. **Retained drawing and coordinates.** Use an engine-owned, test-only projection
   probe with explicit logical membership and stable drawable roots. Compare
   ordinary physical hierarchy, independent render domains and retained placement
   with public SDK operations. Consume admitted move and position changes together
   at a read/render barrier. Preserve painter order, resource identity and direct
   leaf edits. Count classification, native membership, descendant transforms and
   disposal, including changes to both old and new parents. Native retention alone
   is not admission; physical-parent lifetime must not leak into logical ownership.
3. **Logical queries and capture.** Test Group-local bounds and exact membership
   from the same projection revision. An experimental capture projection may
   share prepared Graphics contexts but cannot move live objects or crop unrelated
   screen content. Count its construction, traversal and cleanup, cold and repeated
   use, after edits. Include overlapping outside content and subsequent parent
   motion/deletion. Unsupported paint/resource types remain explicit limitations;
   do not claim complete feasibility from vector-only success.
4. **Whole-operation cost.** Compare baseline, installed policy and candidate on
   identical warmed fixtures in reversed order. Include ordinary rendering,
   compensated reparent, actual parent translation, immediate bounds and capture.
   Count query/capture work and total completion, not only the cheap mutation.
   Use small permanent probes first; promote to the retained 101 fixture only if
   the smaller proof passes the complete handoff. A correctness or deterministic
   work failure is sufficient to reject a candidate without a costly large run.

Execution cards: phase 1 observes the existing prepare-preset-group-operation,
normalize-preset-group-geometry and project-render-hierarchy handoff; phases 2-4
are isolated feasibility evidence for project-render-hierarchy, not replacement
production semantics. Inputs are accepted canonical changes and current paint
resources; outputs are exact logical geometry/order, evidence of native work and
capture completion. Bounds and capture consume the same accepted revision.
Failure belongs to the projection experiment; never repair canonical state or
serve stale output. Gates are scoped owner/browser tests, scoped lint/types,
naming and per-phase self-review. Review the existing Inspector before advancing.

Stop condition: a failed candidate does not authorize a renderer rewrite,
weakened oracle, new cache heuristic or production installation. Record which
handoff passed and which cost/correctness contract failed. Revise the bounded
experiment only where the evidence justifies it. Production admission requires
all phases plus representative paint types, history/replay and no shifted query
or capture cost; replace conflicting contracts together only after admission.

Phase 1 review: the real App emits three projection batches (Group addition,
hierarchy move, computed coordinates) before one committed projection batch.
Immediate frame barriers match the currently accepted state, including the
intermediate uncompensated pose. Final placement, rollback after a read,
undo/redo and native identity pass. The existing live edit/order/visibility and
remote-publication replay case also passes. Lifecycle/journal notifications are
not render-projection envelopes; camera transforms must be removed when comparing
workspace coordinates. The test probe was corrected at those boundaries, not by
changing product behavior or weakening the oracle.

Phase 2 review: the isolated native probe retains coordinates, root order,
independent leaf edits and old-parent deletion. Four-root reparent work is
4,004 memberships/4,000 descendant transforms for ordinary hierarchy, 4/0 for
installed independent domains, and 0/0 for retained placement. However, actual
parent translation revisits 4,000 descendants in the retained candidate versus
zero in the installed policy. This fails an acceptance obligation. Continue
phases 3-4 only to finish the bounded query/capture cost diagnosis, not to admit
production or silently accept the translation regression.

Phase 3 review: shared-context capture preserves Group-local bounds, live paint
identity, later geometry edits and cleanup in the vector probe. It nevertheless
constructs 4,004 temporary Graphics for each capture, including the second
unchanged capture. The existing policy needs no such materialization. This is
another rejection condition, not a request to hide cold work behind a cache.
Browser review must also account for SDK render/extract promoting its target to
an independent domain. Verify and restore the selected policy with public APIs,
including restoration cost. Compare direct rendering of retained roots into the
ordinary offscreen capture target as the bounded alternative to clone assembly;
record domain transitions and live-scene equivalence. This is normal capture,
not a texture replacement for editable live geometry. Replay source-stamped real
phase-1 observations into the isolated projection before timing synthetic scale.
Phase 4 is a bounded browser diagnosis on 4,000-leaf fixtures with reversed
policy order and capture cleanup inside timing. The recorded 101 promotion and
production admission remain blocked; GPU timer expansion and unsupported paint
families are unnecessary for rejecting an already-failed candidate.

Phase 4 final review: all 12 reversed-order browser blocks pass pixel, policy
and accepted-source replay assertions. The 1,728 samples expose the rejected
tradeoff: four-large-root capture completion is 1.80 ms with independent domains,
7.75 ms with shared-context assembly and 4.60 ms with direct root capture. Direct
capture restores policy but registers 8,000 leaf memberships. Neither route
satisfies the no-shifted-cost condition. Native tests pass 13/13; App browser
cases pass 2/2; the local engine browser proof passes 1/1. Scoped engine types,
lint and naming pass; focused App types remain blocked by 29 diagnostics in
untouched dependency files, with none in changed test/helper/config files.

Status: all four feasibility phases investigated and reviewed; candidate rejected.
This completes the bounded investigation, not production admission or whole-plan
closeout. Keep the installed policy. Recorded-101 promotion and production steps
3-4 remain unadmitted. See [complete handoff follow-up](../reports/hierarchy-boundary-feasibility-2026-11-10.md#complete-handoff-follow-up)
for producer evidence, candidate limitations, exact timings and reproduction.

### Pixi research revision

November 10, 2026 - external research and documentation only. See
[Pixi render boundaries - research](../reports/pixi-render-boundary-research-2026-11-10.md)
for official guidance, maintainer/issue applicability, pinned editor sources,
installed 8.20.1 implementation and measurement reconciliation.

Keep the installed independent Group domains. Their real-101 benefit is measured;
the flattened projection fails actual parent translation and capture. The next
candidate is reduced redundant render-state submission, with native membership
and capture retained. This is an evidence-backed experiment, not a proven fix.
Official RenderGroup guidance warns about many domains; RenderLayer and shared
Graphics contexts do not remove the missing coordinate/capture responsibilities.

Scope of this revision: this plan and the research report only. No code, tests,
dependency upgrades, production renderer selection, new measurements, commits or
pushes. The four phases below describe the next implementation/proof task; none
is executed by this documentation update. Existing Inspector behavior remains
unchanged until a complete candidate is admitted.

1. **Attribute the actual state cost.** In the existing permanent Pixi/browser
   probes, distinguish domain entries, instruction rebuilds, uploads by matrix
   role, equal consecutive values at the same program/location, and buffer/resource
   work. Hold version, domain policy and source constant. Isolate empty Graphics
   versus structural carriers without activating `PixiBatchPartitions`' existing
   128-child heuristic. The measured 2-to-2,000 matrix increase does not establish
   that all uploads are redundant. Output: an attributed cost and exact proposed
   SDK/engine owner, reviewed before selecting a change.
2. **Prove a supported minimal change.** Prioritize eliminating only demonstrated
   redundant submissions, keeping native domains and prepared geometry. Verify
   the actual supported insertion point before implementation; extension support
   in general is insufficient. Account for program/location state, different
   sibling transforms, nested domains, color, target changes, mutable matrices
   and context reset. Do not skip updates based only on object dirty flags. If
   no supported boundary exists, record the upstream requirement and stop that
   candidate. Same-version WebGPU uniform batching may be compared for attribution,
   never used to hide a WebGL regression or silently change the app backend.
3. **Verify accepted changes through capture.** Reuse the applied-batch producer
   evidence and focused history/replay cases. Reads must observe currently accepted
   state, including intermediate compensation; equal parent transforms cannot
   erase independent leaf dirtiness. Test real parent motion, ordering and exact
   selected-subtree bounds/capture with outside overlap, vector/text/image/effect
   content, cold/repeated extraction, restoration and the following live frame.
   Keep one canonical scene and its existing paint resources. Before changing
   production handoff semantics, reconcile the Inspector's committed-only wording
   with the measured applied-batch contract and update affected specs/tests together.
4. **Accept whole-operation improvement.** Compare original, installed and proven
   candidate on the same retained 101 and small-group fixtures in reversed-order
   blocks. Keep CPU, GPU and completion measurements distinct. Preserve the
   four-root reparent/translation savings and improve the identified steady cost
   beyond noise without extra query/capture, disposal or later-frame work. If
   evidence does not support this small change, retain the installed policy and
   report the absolute tradeoff. A custom display-list/batcher requires a separate
   reviewed design, not an automatic renderer rewrite.

Each future phase uses focused tests and self-review before advancing. No group
size threshold, raster substitute, private SDK flag patch, clone capture tree or
AI planning requirement. The upstream InstructionSet destruction fix merged after
8.20.1 is a relevant resource-lifetime finding, not a demonstrated cause of our
timings or authorization to upgrade the dependency.

Review: current `project-render-hierarchy` identity, order, independent-domain and
failure ownership stay intact. The research distinguishes measured results,
version-confirmed mechanisms and hypotheses. The no-cost-shifting condition covers
first capture as well as repeated capture and subsequent rendering. Earlier
rejected prototypes remain isolated evidence; they are not compatibility paths.
Status: research and plan revision complete; the next proof and production
admission remain pending. No additional benchmark or runtime validation was run.

Execution scope - approved continuation: first change only permanent browser/native
measurement probes, their focused tests and this plan/report. Production work is
conditional on the supported-boundary and whole-operation proof above. Preserve
all existing dirty changes; no dependency, backend, threshold or remote changes.
Step 1 card: project-render-hierarchy evidence, implemented by engine/App test
probes; input is existing native render commands, output is per-program uniform
attribution with actual GPU values. Observe and forward every submission, never
suppress calls. Instrumented runs are work evidence, not timings. Names are
test-local, non-persisted. Gates: observer regression tests, existing small-vector
and recorded-101 browser cases, naming, scoped lint and source/diff review.
Step 2 rechecks the SDK public boundary before choosing a candidate. A missing
supported hook is a bounded feasibility failure, not authorization to fork Pixi.

Step 1 review: observer control and both App cases pass. Small-group isolated
redraw has 2,000 identical matrix writes and 1,000 distinct native programs per
frame; the recorded scene has 14 identical and 31 changed writes. These are
program-local values, not evidence that a shared program can skip all writes.
`MeshMaterialBatcher` constructs a DefaultShader for every batcher, whereas the
SDK DefaultBatcher shares one. High-shader compilation creates a new GlProgram
with a unique debug define, producing distinct native programs. The engine's
analytic shader already uses the public GlProgram.from source cache.

Step 2 card: same projection evidence owner, engine-only test candidate. Reuse
the existing ordinary shader bits through GlProgram.from, changing program
ownership before first bind while keeping per-batcher resources, native domains,
draw order and capture. No GL suppression or private uniform flags. Compare
original/candidate native probes, exact images and work counts; test program
lifetime and texture-capacity separation. This takes priority over a new uniform
cache because it corrects the upstream program-creation owner. Only a passing
whole-operation proof admits the production shader factory change.

Step 2/3 review: the candidate keeps exact native-probe images, native domains,
zero capture clones and zero capture membership-leaf work. App hierarchy/history/
replay and mixed-material/overflow cases pass. Reversed App blocks reproduce the
small-group GPU improvement (about 0.59 to 0.28 ms); CPU submission remains about
2.6 ms. Recorded-101 reparent render CPU remains 0.3 ms. This admits the narrow
program-sharing change, not a claim that every small-domain overhead is removed.
One page-reload-interrupted run and one uninjected candidate were excluded.

Production card: `render-material`, owned by `@asyra/render-engine-pixi`, within
its existing shader/batcher implementation boundary. Inputs are ordinary shader
bits and effective texture capacity; outputs are independently owned Shader
bindings backed by Pixi's source-keyed immutable programs. SDK program caches own
source reuse, renderer shader systems own native context programs, and batcher
destruction releases its Shader without destroying shared programs. Capacity and
shader-source changes select different programs; scene/camera changes still
submit current uniforms. Analytic selection, start-batch rebinding, hierarchy,
queries and capture stay unchanged. The formal actual-batcher ownership assertion
fails before implementation (`sameProgram: false`). Gates: that regression, exact
native pixels/work, current-context recreation, focused App hierarchy/material
cases, small-group/recorded App measurements, scoped type/lint/naming and review.
Remove the browser response-injection candidate after admission; keep the old
independent-program behavior only as an isolated measurement reference.

Execution complete for this bounded shader-program slice. See
[state attribution and production proof](../reports/render-state-submission-proof-2026-11-10.md).
Step 3 review additionally covers text, raster content, nested alpha/effect targets,
selected capture and its following frame; the missing mixed-content coverage was
added before closure. Context restoration recreates native programs and permits
later Group edits. The program owner is admitted through the existing
`render-material` boundary; the `project-render-hierarchy` ownership/identity/order
contract is unchanged. The earlier applied-versus-committed handoff question was
not changed or claimed resolved by this shader-only slice.

Step 4 review: production App work counts confirm 1,000 to one ordinary program,
unchanged draws/matrices and zero steady buffer uploads. Final small-group redraw
GPU is 0.269 ms versus 0.587 before; CPU improvement is not stable across samples.
Recorded-101 four-root reparent remains about 10 ms versus 52.6 ms for the same-run
ordinary-domain control. Native bounds/capture retain zero clone/membership-leaf
work; all reference images match. Residual small-domain submission overhead is
reported, not hidden by a threshold. The carrier experiment was not extended:
attribution selected the concrete duplicated program owner without changing
carriers, queries or extraction. Only focused tests/build/types/lint/naming were
run; no full gate, dependency upgrade, commit or push. This closes the approved
program-reuse implementation, not unrelated work in the surrounding plan.

Follow-up review scope: trace only the shared-program diff, SDK binding/lifetime
consumers and existing hierarchy/material proofs. Strengthen permanent browser
tests for live surviving owners, multiple contexts and exact capture pixels;
record existing SDK lifetime limitations separately from regressions. Production
behavior, unrelated dirty files and performance policy remain outside this review
mutation scope. Run only the matching browser cases and focused type/lint/naming.

Review outcome: actual surviving-owner/multi-context rendering and exact capture
pixels pass, as do the seven existing App handoff/material cases. No new production
update regression was found. The review reproduced the existing Pixi 8.20.1
retired-instruction batcher retention: four deleted Groups leave four cached
Shader owners in both reference and production. This remains an open SDK lifecycle
issue, not a completed resource cleanup. See the report's follow-up review; no
dependency change, renderer fix, compatibility path or full test gate was added.

### Approved SDK lifetime implementation - 2026-11-10

Scope: repair retired instruction-owner retention through the official Pixi SDK
lifecycle. Upgrade 8.20.1 to 8.21.0 first, then verify the current stable 8.22.0
against the same focused checks before choosing the final dependency. This
explicitly authorizes the dependency change excluded by the earlier hierarchy
scope. Mutations are limited to the engine dependency/lockfile, direct adapter
consumers if required by the current SDK contract, permanent focused tests,
and these directly affected specifications and reports. No compatibility path,
SDK monkey patch, independent sweeper, repository-wide test gate or live AI run.

1. **Distinguish lifetime owners before upgrading.** Strengthen the permanent
   browser regression to require removal of retired instruction entries and
   destruction of their batchers. Prove it fails on 8.20.1. Separately prove
   normal RenderGroup pool reset/reuse keeps its usable instruction resources.
   The owner is `render-material`; SceneTree tombstones, history snapshots and
   live reparent handles must remain intact. No immediate heap/RSS assertion.
2. **Use the official SDK destruction handoff.** Install and verify 8.21.0,
   then 8.22.0, keeping both versioned evidence sets. RenderGroup destruction
   reaches InstructionSet destruction and the registered batch pipe; the
   existing material batcher releases its own Shader bindings without destroying
   shared programs. Update the dependency boundary assertion and docs together.
   Review each version's API and lifecycle changes; stop advancement on an
   unexplained correctness regression rather than add a fallback.
3. **Preserve restore and hierarchy semantics.** Verify real SceneTree
   tombstone identity across removal/undo/redo, rejected transaction restoration,
   and hierarchy replay. Exercise native render deletion/recreation through App
   undo/redo plus surviving children after ungroup. Keep reparent handles and
   model identities, world geometry and painter order. Restore data is not a
   retired GPU instruction cache and is not subject to this cleanup.
4. **Close live rendering and reuse boundaries.** Verify shared program peers,
   multiple contexts, context restoration, geometry/material edits, repeated
   target capture and the following frame. Measure the same focused large-root
   reparent and small-group scenarios; preserve work counts and image oracles.
   Report pool reuse separately from final destruction, and JS reachability
   separately from GPU allocation. No group-size threshold or cost shifted to
   querying/extraction.

Each step includes a bounded diff/direct-consumer review before advancement.
Existing `render-material` and `project-render-hierarchy` contracts remain
authoritative. The user subsequently broadened verification for this upgrade:
run the complete Asyra Design App suites and complete `render`, `render-engine`
`render-engine-pixi` and `preset` package suites, including applicable App browser and
large-scene rendering gates. This supersedes the earlier focused-only limit for
these five workspaces, not for other packages. No release validation, live model
benchmark, unrelated package-wide gate or compatibility work is authorized by
this verification expansion. Diagnose failures against the dependency change;
report unrelated existing failures without silently expanding production edits.

Steps 1-3: 8.20.1 fails the retired-owner oracle; both 8.21.0 and 8.22.0 pass
native lifetime, pooled reuse, program sharing, capture and context restoration.
8.22.0 is selected. App deletion/restore/ungroup and the existing hierarchy,
material, history and remote-replay cases pass against a fresh verified SDK
bundle. The previously running Vite served an old 8.20.1 bundle; its passing
consumer run is not upgrade evidence. Step 4 focused performance and image
checks pass. The complete rendering package suites, collaboration, render-delta,
7076 and status-notification browser gates pass. Broader App validation is
complete but not green: existing AI contract failures also reproduce with
8.20.1, and five unchanged AI test typing errors remain. Do not close the whole
App plan or claim all App tests pass. The SDK lifetime slice is verified; see
[the upgrade report](../reports/pixi-resource-lifetime-upgrade-2026-11-10.md)
for counts, baseline controls and residual small-group costs.

The expanded verification also repaired the App's existing test-entry inventory
(18 maintained suites omitted, three removed suites still referenced), and a
browser assertion that read a render snapshot before its scheduled frame.
Neither correction changes production AI behavior or removes failing cases.

### Contract and four owner steps

Objective: make local hierarchy work proportional to its actual dependency
scope while preserving canonical identity, world geometry, painter order,
history, remote replay, capture and hit testing. No AI planning rule, alternate
execution entry, compatibility path, dependency upgrade or release work.
Mutation is limited to Preset Group preparation/geometry, SceneTree hierarchy
admission, Render/Pixi hierarchy projection, UI/region projection, their direct
tests, fixtures, specifications and Inspector contract. Preserve unrelated dirty
files. No new live AI drawing is required by this task.

1. **Work-count regression and retained scenario.** Extract the recorded four
   root IDs, geometry and ordering into permanent test evidence. Establish local
   read, hierarchy validation, engine traversal, UI and region work counters at
   owner boundaries. Aggregate counters rather than emitting one event per leaf.
   Vary unrelated nodes independently of selected descendants. Verify successful
   group/ungroup/reparent, rejection, one undo, redo and shared replay. Existing
   identity-only tests do not prove bounded SDK work.
2. **Preset preparation and SceneTree admission.** Use existing Core local read
   APIs; keep invocation-local read reuse and invalidate it across mutation.
   Resolve all before-image ancestry before writes. Replace full-tree move
   validation with complete affected-parent/ancestry validation; full import/save
   validation stays authoritative. Local and replay moves share the same checks.
   Invalid membership, cycles, missing entities and stale replay reject before
   writes. Do not cache a global validity flag or silently repair corruption.
3. **Render hierarchy execution.** Keep render handles and immutable geometry;
   prove actual Pixi traversal/instruction scope before choosing a rendering
   boundary. Use the existing engine-neutral transform-group capability for
   semantic containers only if actual SDK tests preserve pixels/order and reduce
   work. Do not enable all Graphics partitions or alter visible shape semantics.
   Preserve request coalescing, capture, hit testing and resource disposal.
4. **UI and region projection.** Consume exact hierarchy deltas and retained
   parent/order projections instead of rediscovering the whole hierarchy. Count
   immutable output copying separately from tree traversal. Region geometry may
   only be reused when the actual transform/membership contract proves validity;
   otherwise retain correct invalidation and quantify that required work. Review
   upstream mutation evidence and downstream consumers together.

### Design review, gates and execution cards

Existing Group/hierarchy Inspector owners are prepare-preset-group-operation,
mutate-canonical-hierarchy, normalize-preset-group-geometry and render projection;
Preset data-channel owns UI projection and Render owns region queries. Inputs
are canonical IDs and exact changes, never provider text or Render-derived
canonical geometry. The same accepted contract applies to local, undo/redo and
accepted remote operations. Geometry normalization remains explicit; moving
children must not introduce observer-driven ancestor edits.

Each step first extends permanent focused tests, records the failing work-count
assertion, implements the owner correction, reviews direct consumers, then runs
the corresponding tests before advancing. Use Group operation, SceneTree move,
Core hierarchy transaction, Render hierarchy/region, native Pixi and Preset UI
projection tests. Real-scene verification must compare before/after world
geometry, order and rendering, plus history/shared replay; mocks alone cannot
close it. Scoped type/lint and naming checks accompany changed owners. No full
local suite. No completion claim while native pixels or replay evidence is
missing. If an assumed optimization changes semantics, revise this bounded
design before implementation rather than weakening its oracle.

Step 1 execution card: fixture/evidence and owner tests only; no production edit.
Step 2 execution card: Preset Group, Core read contracts and SceneTree moves;
outputs preserve exact hierarchy and coordinate updates, failures belong to
SceneTree admission, no whole-scene cache. Step 3 execution card: Render/Pixi
projection only, no canonical mutations, profile actual SDK and verify native
pixels. Step 4 execution card: Preset UI/Render region derived state only;
preserve identity/lifetime and account separately for unavoidable output copying.

Status: all four owner steps are implemented and functionally reviewed, but
render-policy performance acceptance is reopened after the small-group benchmark.
The 1,000-vector-Group case increases redraw CPU/GPU cost in two independent
ABBA runs, despite unchanged draw calls. No new production policy was introduced.
See [Small-group render benchmark](../reports/group-render-domain-benchmark-2026-11-10.md).
Focused Preset,
SceneTree, Core, Render, native Pixi and Inspector tests pass; the complete retained
25,539-element browser fixture passes geometry/order, undo/redo, production
publication-decoder replay and pixel checks. No live AI drawing was started.
See [Local hierarchy verification](../reports/local-hierarchy-work-2026-11-10.md)
for work counts, raster precision differences and remaining costs.

Review found one additional in-scope handoff: file load published UI projections
without seeding their reusable preparation. The owner now builds both from the
same loaded rows; the first edit after load is covered by the recorded-scene test.
Existing load tests expecting two element saves now require one.

The rendering proof separates policy adoption from reparenting. Under the new
policy, overview and three detail views are byte-identical before/after grouping;
remote replay also preserves the overview exactly. Switching the old/new render
domain changes float32 raster composition: 25/132/59/83 pixels differ in the four
544,000-pixel views, with unchanged source/world geometry. This is recorded, not
claimed as byte-identical old/new output. The policy comparison bounds changed
pixels below 0.05%, mean absolute channel error below 0.01/255, and maximum channel
delta at 64/255. Reparent comparisons retain exact equality. Foreground checks
prevent empty screenshots from passing. No geometry, image mask or product
fallback was added to satisfy the oracle.

Final review retains unavoidable full save/load validation, immutable flattened
ID copying, changed-order traversal and ordinary frame drawing. An additional
standalone E2E type probe finds existing errors in e2e/test-utils.ts; it reports no
error in the new scenario. Production owner type checks pass; no out-of-scope
helper cleanup, full-local suite, commit or push is part of this task.

Follow-up review: added native edited-child/parent-transform checks, retained
versus fresh region-index comparisons, and a small browser scenario verifying
child geometry/style/order/visibility after reparent. Each undo/redo and each of
four production-decoded remote publications is compared against the matching
pixels, region results and UI order. No new production defect was reproduced;
only tests and this verification record changed. See the report's follow-up
section for limitations and artifact locations.

Small-group measurement contract: verify the existing render-domain decision
without adding production optimization rules. Add only a permanent local browser
benchmark/config and its report. Hold 4,000 visible elements constant across
20/200/1,000 Groups, separately for rectangles and closed vector quads; compare disabled/enabled Group transform domains on the same
canonical scene in ABBA order. Warm each mode before measuring full-canvas redraw,
viewport pan and production hierarchy reparent. Count WebGL draw entry points in
separate instrumented samples; time uninstrumented CPU mutation/render submission
and submission-through-GPU-completion with gl.finish, identifying the actual GPU
backend. Retain raw samples, images, coordinate/order/identity checks and environment
metadata. GPU timer queries are sampled separately from CPU timings when
available; disjoint/unavailable results cannot be presented as GPU measurements.
The rectangle strategy is already unbatched, so a vector cohort using production
topology preparation is necessary to expose batching-boundary cost. Vector point,
segment and network IDs must be unique across the document. Test-only strategy
restoration runs before the isolated browser context is released.
No timing threshold becomes a product rule or CI gate. Use focused lint,
naming and this local benchmark only; preserve all existing sessions and artifacts.
Baseline preparation review: changing existing node flags alone is insufficient
because a later official Group strategy invocation restores the candidate flag.
The test uses a Vite-served, test-only public-registry probe selecting the exact
previous strategy body or current strategy, outside timed intervals, and verifies
all Group flags after every phase. Bare browser-evaluate package imports are not
resolvable; static package imports belong to that test module. A failed baseline
integrity check invalidates the sample instead of becoming performance evidence.
The existing project-render-hierarchy owner remains unchanged. Report a slowdown
as a finding, never conceal it with a new heuristic or change the drawing task.

The latest completed task is [Purpose and parameter discovery](#purpose-and-parameter-discovery).
The preceding completed task is [Canonical input rejection and same-turn recovery](#canonical-input-rejection-and-same-turn-recovery).
Its focused validation and live observation are recorded below. This completion
does not assert that the timed drawing met every visual requirement.
The target-bound result correction below remains a prior implementation record.

## Purpose and parameter discovery

November 10, 2026 - baseline `036f7f5dc`. Run
`taipei-101-fixed-1794238899355` used eight position-related lookups (76,302 text
bytes) among fifteen lookups (161,457 bytes). Actual delivered D3-D10 show
coordinate queries ranking pagination, hierarchy changes and vector-only edits.
The matcher merges authored purpose, incidental schema prose and names;
single/plural words and parameter shape affect ranking. Generic geometry wording
hides scaling-only scope. These are discovery defects, not execution failures.
The original-thread follow-up confirms that not paging D8 was an agent choice,
E3 performed coordinate arithmetic, and E6 omitted an already-known layer-order
dependency. Thirteen names were saved and five reused; unused saves are valid.

### Bounded contract and reviewed sequence

1. **Compose - purpose and parameter selection.** Replace undifferentiated
   descriptive matching with owner-authored discovery purpose/terms/boundaries
   and independently indexed admitted input fields. Optional `inputFields` in a
   descriptive query selects tools declaring those fields; an open record is not
   proof it accepts every requested field. Return applicability and matched field
   paths in candidates. Exact identities keep their existing authoritative route.
   Normalize ordinary plural words without changing exact identities. Tool names
   remain secondary evidence; never infer capability from another tool mentioned
   in guidance. Keep natural-language discovery for custom registrations with
   ordinary descriptions; no legacy scorer or duplicate execution entry.
2. **Compose/apply - coordinate handoff.** Use the recorded parent origin and
   child position to prove workspace-to-local conversion output can feed the
   existing position mutation in one execute_design request. Verify the actual
   provider-visible selected contracts, negative/nullable results, no successor
   write on missing conversion, and canonical geometry. Fix only a demonstrated
   handoff defect; do not invent an arithmetic tool or relax validation.
3. **Observe - one live run.** After focused tests, owner review, types, scoped
   lint/naming and affected flow checks pass, run the immutable prompt once with
   a thirty-minute drawing allowance. Retain fit-to-content recording, final and
   reload evidence, unlimited original-thread report and the live report session.
   No manual file changes during drawing or any AI report/follow-up. Analyze
   correct candidate selection, acquisition bytes/calls, field matching, bound
   execution and reasons for model handoffs; do not equate unused saves or visual
   iteration with failures. Correctable authored input may recover normally.

Allowed owners: App capability discovery/metadata and its basic/native producers,
coordinate action/result contracts if regression requires correction, directly
affected provider/host tests and recorded fixtures, current App API/spec/Inspector,
this plan and observation report. No Framework geometry redesign, dependencies,
embedding service, mandatory planning/review, compatibility path, full-local/CI,
release work or remote operation. Discovery is fixed to the recorded queries,
their production candidate set, coordinate consumers and contrasting purposes.

Review before implementation: metadata is owned by the declaring operation, not
a name-to-capability table in the search consumer. Parameter matching reads actual
schema fields, not output prose or example values, and does not replace runtime
validation. Candidate boundaries disclose vector-only, scaling-only and evidence-
dependent scope. Existing request-local metadata/corpus reuse retains its identity
and registry-revision lifetime; test unchanged reads and changed registration.
Opaque a/b/c identities, paging, exact ambiguity and compound artifact queries
remain acceptance cases. No precise model-time saving is promised.

Coordinate handoff review: the first draft tried the generic open property map,
which does not declare individual coordinate bindings. The revised proof uses the
existing typed per-element position setter. A separate current defect remains:
workspace conversion declares an untyped value, and Runtime sequence selectors
reject x/y through a nullable union before observing the conversion. Add the
owner's nullable point schema and permit only null-branch omission for sequence
field projection. Actual absent values must stop before the dependent mutation;
saved recipes still require every branch. This bounded change includes Runtime
recipe-schema projection and its direct admission tests, not general open-record
binding or arbitrary union inference. Discovery annotations must be removed only
at execution schema projection, not from candidate metadata. The failing App and
Runtime regressions are prerequisites to this correction.

Step execution card - Compose: input is current admitted descriptors plus query
and optional field requirements; output is ranked candidates with applicability,
field matches and exact usage routes, or explicit no-match recovery. The App
discovery owner never executes a candidate. Test the recorded searches first,
then production/native delivery and existing discovery contracts before advancing.

### Slice review and focused evidence

Compose now indexes declaring-owner purpose separately from incidental guidance,
returns applicability in query/category/recovery menus, and supports declared
input-field selection. Unique Basic API method names use the exact identity
route. The old query-selected summary helper was removed rather than retained as
an alternate scorer. Recorded queries, opaque identities, explicit vector scope,
reachable schema fields, existing compound searches and metadata reuse pass their
focused owner tests. Native provider protocol tests verify actual declarations,
all four recorded query replies and the nullable conversion contract.

Compose/apply execution card: the existing coordinate owner receives a workspace
point and parent ID; the typed position owner consumes the resulting x/y. Runtime
owns reference admission and presence checks, not geometry. The formal proof uses
the recorded negative local y, real Core/render conversion, production action
receipts, one Runtime request and request-scoped artifact ownership. It confirms
one host call completes both operations and actual null prevents position writes.
The nullable admission regression failed before the Runtime correction. Final
review retained strict saved-recipe admission and rejected other missing union
branches. The test harness was corrected to use one request lifecycle and the
existing receipt/cleanup bridge; no product fallback was added for harness errors.

Observe execution card: use the unchanged prompt fixture and existing recorder,
with `--minutes=30`, unlimited same-thread reporting, retained session and strict
stopping only for genuine tool/transport failures. Correctable authored inputs
continue. Freeze source/document edits until the original AI finishes answering.
Completed observation: one unchanged-prompt run completed naturally after 549,051 ms.
Eight discovery calls delivered 88,503 text bytes; eight execution calls delivered
13,756 bytes, with no input rejection or failed tool. Nine names were saved and
six reused through 25 named references; no pure saved-value forwarding call was
observed. The original thread completed its unlimited report and a follow-up, then
remained waiting. Sequence 812 is durable and reload/document-report parity passed.
All 24 frozen source/document hashes matched after reporting.

The live agent did not request position edits or use inputFields; those paths are
proven by the recorded/native regressions, not by this drawing. The follow-up
withdrew a proposed relative-move tool because that ability already exists and
D8 explicitly delivered it. Sample overbreadth was a missing ancestor choice;
repeated facade boundaries contained real offsets/new regions. No additional
product changes were made from unverified AI suggestions. The final independent
overview does not replace the AI's omitted post-fix overview.

Focused validation: 197 App owner tests, 88 Runtime admission tests, one actual
native-provider test and one selected-operation flow proof passed; naming,
scoped lint, App types and Runtime build passed. No full local suite or CI ran.
See [the complete observation and corrected recommendations](../reports/taipei-101-purpose-discovery-2026-11-10.md)
for metrics, original AI report, follow-up, recording and retained-session evidence.

## Canonical input rejection and same-turn recovery

### Thirty-minute follow-up observation

The user requested one additional unchanged-prompt run with a thirty-minute work
allowance. Scope: extend the Taipei benchmark CLI and existing evaluation-window
admission from eighteen to thirty minutes, update their direct regression tests
and active API/spec wording, then observe one run. Preserve the fifteen-minute
default, unlimited same-thread reporting, retained report session, strict genuine
failure stopping and correctable-input continuation. Other evaluators retain
their existing default budgets; the shared process watchdog and cleanup rules
are unchanged. No drawing/tool behavior, prompt or report questions change.

Observe owns the benchmark policy and its same-thread evidence; evaluation-window
admission remains at its current App boundary. Tests first demonstrated rejection
of the requested thirty-minute input in both the runner and production parser.
The focused gates are these two test files, adjacent deadline/report-policy tests,
scoped lint and diff review. Freeze manual changes from live launch until the
original AI finishes reporting.

Completed observation: `taipei-101-fixed-1794238899355` admitted 1,800,000 ms
without changing the fixed prompt. Drawing completed naturally after 669,778 ms;
the original thread completed its unlimited report in 367,118 ms and remains
waiting. Ten outer execution calls succeeded, with no tool/action failures or
input rejections. Reporting left the document unchanged; durable sequence 739
matches the document sequence and reload content is unchanged. All 31 frozen
file hashes matched after reporting. The two updated admission tests failed
before the correction; focused runner/watchdog tests (19), evaluation-window and
control tests (52), scoped lint and diff checks pass. Other evaluator defaults
and the process watchdog remain unchanged. See the
[thirty-minute allowance report](../reports/taipei-101-thirty-minute-allowance-2026-11-09.md).

### Contract, evidence and bounded design

November 9, 2026 - run `taipei-101-fixed-1794226962133`, E6, payload 320
passed a newly grouped element to `core.updateElementProperties` with
`values.name`. The actual selected usage (payload 191) declared an open values
object. Canonical group property resolution rejects that key before applying
properties, but the recorded failure (344-346) retained only AI_EXECUTION_FAILED.
The evaluation controller interrupted at the child completion before the outer
sequence recovery was delivered. The original same-thread follow-up confirmed
that the AI received interruption, not an actionable rejection or the new group ID.

Each owner admits its own input and returns only its own result and processing
status. SceneTree owns registered property target validity, Core exposes that
contract, the App action adapter translates a recognized input rejection into the
provider-neutral Runtime failure contract, Runtime owns write settlement, and the
App maps a safely settled rejection to existing correct_input. Generic exceptions,
invalid owner relations, missing data, output failures and unknown settlement must
not become authored-input errors. No string matching, duplicate property registry,
automatic field rerouting, silent skip, automatic retry or compatibility branch.

1. **Apply - canonical rejection.** First add a failing formal test using the
   recorded name input plus custom registered properties and broken-owner negative
   cases. Give unsupported property targets a typed, detached owner error before
   writes. Export it through Core. Keep normal unknown/internal errors distinct.
   The adapter translates only this recognized owner failure; no model policy or
   rename API knowledge belongs in SceneTree. Verify no partial property apply.
2. **Apply/compose - preserve the handoff.** Runtime carries the typed input
   diagnostic independently of transaction settlement. App maps it to correct_input
   only with known no-write settlement, preserving successful-prefix receipts and
   IDs. Remove the unconditional generic recovery for this recognized route; do not
   introduce a second executor. Existing failed action results remain failures.
3. **Compose/provider - delivery before recovery.** Prove strict evaluation keeps
   the original turn alive for the actual canonical rejection and delivers the
   outer recovery. Then the AI can submit the corrected suffix through ordinary
   admission. Genuine failures still stop writes and drawing; final failed receipt
   delivery must settle before an evaluation interrupt when a tool call is active.
   Deadlines/cancellation remain immediate. Selected usage explains element data
   versus registered properties from its owner declaration, not an App prompt rule.
4. **Observe - integrated proof and one live run.** Preserve exact recorded rename
   and capture arguments in a permanent fixture. Exercise group -> rejected rename
   -> corrected rename -> captures through canonical Core, transaction, Runtime,
   host and the native provider boundary with strict evaluation enabled. Assert
   successful prefixes execute once, no name write on rejection, valid corrected
   name, delivered group ID and two image results. Run one unchanged-prompt
   fifteen-minute 101 drawing only after focused tests, types, scoped lint/naming
   and the affected current flow contract pass. Input correction stays in the same
   drawing turn. The original AI writes an unlimited report in the same native
   thread and the session remains open. Freeze all manual file edits while drawing
   and reporting. Report evidence and any live adoption limitations separately.

Allowed changes: SceneTree property resolution/error/export and direct tests; Core
facade exports; Runtime action error, receipt/serialization and focused tests; App
basic API adapter/declaration, batch receipt, local operation recovery, provider
stop/delivery, direct tests/recorded fixtures; their current package/App specs,
Inspector, this plan and final report. Preserve all unrelated dirty changes.
Discovery is bounded to the traced failure path, its direct consumers and negative
cases. No broad property-validation redesign, new tools/cache, mandatory workflow,
full-local/CI/release checks, commit or push. No persisted data migration.

Naming: SceneTree owns ElementPropertyInputError with elementId/propertyKey;
Runtime owns AiActionInputError with provider-neutral issue data. These are current
in-memory/public failure contracts, not persisted identities or legacy aliases.
Use the existing App correct_input recovery identity. Work-count proof covers
canonical applications/grouping/captures and successful-prefix reuse; no cache is
introduced. The existing compose/apply/observe Inspector steps own this work.

Review: the complete path preserves strict input admission, transaction safety,
canonical ownership and failed-result truthfulness. New groups are validated when
their step runs; no preflight lookup of a not-yet-created ID is required. A failed
sequence stops successors and returns control to the AI rather than guessing how
to continue. Each step must pass its focused regression and negative cases before
the next step advances. Implementation and live observation are complete.

### Implementation review and focused evidence

Apply review: the registered property resolver now emits ElementPropertyInputError
only for unsupported authored keys. Invalid owner relations remain generic faults.
The App translates the typed owner result without routing metadata updates.
Runtime preserves AI_ACTION_INPUT_INVALID and inputIssue separately from settlement.
The original failing test and custom-registration/broken-relation cases pass (12).
Runtime rolled-back/committed/unknown diagnostic cases and adjacent multi-batch
behavior pass (26). Core/SceneTree builds and Runtime production-entry types pass.
The broad Runtime build also checks an existing unrelated test typing error in
recipe-admission.test.ts:1736; it remains unresolved, not reported as a clean build.

Compose/provider review: both browser-error packaging routes consume the same
recovery classifier. It requires a typed input diagnostic, known no-write
settlement and fresh context. Generic recoverable flags cannot bypass stopping.
Terminal tool failures close new native/canvas work admission, let active host
receipts settle and reach native transport, then interrupt. Cleanup remains allowed;
deadlines/cancellation still interrupt immediately and preserve the first failure.
No automatic repair, retry, field reroute or compatibility branch was introduced.

The permanent fixture preserves payload 320's exact rename, captures and selected
result fields. The real Core/transaction/Runtime/host/native-provider test uses a
small existing drawing, groups once, rejects the recorded rename, obtains groupId
from the selected delivered assembly receipt, corrects only the unfinished name
and captures, and receives two distinct images in the same strict native turn.
The mocked pixel source tests delivery, not rendered geometry. Native reporting,
retained session, deadline and cancellation cases pass (28 selected tests).
Adapter/transaction tests pass (51); handoff/evaluation/exchange tests pass (99);
three selected execution-flow proofs, two Inspector contract checks and naming
(15) pass. Server types and scoped lint pass with three existing console warnings.
The old property revision expectations were updated. A stale measurementIssues
failure expectation was removed: retired mandatory measurement evidence is not a
current operation failure; inspectionIssues remains covered. No full-local suite,
release checks, commit or push ran.

### Live observation and closure

Run `taipei-101-fixed-1794235733611` used the unchanged fixed prompt (SHA-256
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`). Drawing
stopped at its fifteen-minute deadline, not an input-error stop. One nonplanar
needle input returned correct_input before writes; the original drawing turn
repaired the retained draft and continued without replaying earlier construction.
The live run did not exercise the canonical name rejection; that route is proved
by the recorded-parameter Core-to-native-provider regression above.

The original native thread completed its unlimited report in about 7m30s and
remains waiting for questions. Its document was unchanged while reporting.
All 25 frozen implementation/test/document hashes remained unchanged through
report completion. Final evidence has no collection errors; durable sequence
1015 equals the document sequence, and the reloaded document is unchanged.

Nine outer execute_design calls returned eight successes and one corrected
rejection, with eight delivered image blocks. Seventeen contract queries returned
166,280 text bytes; execution responses returned 21,034 text bytes, excluding
image bytes. Ten names were acknowledged as saved and seven names were referenced
in later work; unused precautionary saves are not failures. Remaining search and
image-redisplay observations are follow-up candidates, not extra changes in this
task. The drawing still had an unsubmitted ornament refinement at the deadline.

See the [implementation and live report](../reports/taipei-101-canonical-input-recovery-2026-11-09.md)
for the failure/recovery evidence, owner boundaries, limitations and the original
AI's complete report. No compatibility route, full-local test, commit or push
was added during closure.

## Independent retention and delivery

### Contract and bounded implementation

Run `taipei-101-fixed-1794215656743` E3 repaired the crown, captured the workspace
overview and retained crown IDs, but delivered no image because retain implicitly
selected status-only delivery. The original AI confirmed the omission in follow-up
`01a1bfd6-68e8-7902-a170-2d255a18212d`. Preserve both exact requests as evidence;
do not amend immutable observations or the drawing prompt.

Retention and model delivery have independent responsibilities. Retain selects
portable input/result snapshots and names; it never changes returned work data or
images. Omitted delivery returns the ordinary final public result (final stage
application for stages; the existing ready-batch receipt for an anonymous ready
batch). Explicit status returns no work values/images. Explicit fields return
only those selected values/images. A successful save adds its compact saved-name,
source and shape receipt, not a second copy of the saved value. Apply the same
rule to direct drawing, ordinary sequences, ready batches and staged execution.
No legacy mode, alias, automatic image replay or required extra query is allowed.

1. **Compose - regression and default delivery.** Record the real failed crown
   draft, its retained source and exact E3 repair/capture input in a permanent
   fixture. Demonstrate failure before implementation. Correct the existing host
   result-selection owner, invocation schemas, model projection and image
   provenance together. Keep normal output ownership; appending a save receipt
   must not suppress or weaken final-result validation. Verify omitted/status/
   selected delivery with and without retain, including a three-step all-selected
   result, storage failure and execution failure without replay.
2. **Compose/provider - entry consistency and contract removal.** Exercise direct
   drawing and stages, remove their implicit status defaults, and update the
   public declaration/examples, usage, active API/spec/Inspector and contradictory
   tests. Inspect the actual provider packet and dispatched response, including
   image blocks, not merely owner schemas. Existing explicit status calls remain
   status-only. Retained values remain browser conversation snapshots; request
   handle lifetimes, failure recovery and permission admission remain unchanged.
3. **Observe - one live run.** After self-review, focused tests, server types,
   scoped lint/naming and the affected current-source flow gate, run one unchanged
   prompt fifteen-minute Taipei 101 drawing. Same native thread, unlimited report,
   retained session. Freeze manual edits from launch through completed reporting.
   Report actual adoption separately from formal coverage and keep all evidence.

Allowed mutation scope: local-tool-host, local-result-delivery, local-design-
sequence, direct drawing/provider/discovery consumers only as required by this
contract, focused tests/fixtures, active API/spec/Inspector/plan and final report.
Fixed discovery: retain/delivery branches, default/status wording and their direct
tests within those owners and current App documents. No crop/bounds changes,
geometry changes, mandatory reuse/Knowledge, new cache or tool, unrelated old-test
cleanup, compatibility, full-local/CI/release tests, commit or push. Preserve the
160 pre-existing dirty entries. No public identifier rename or persisted format
migration is needed; changed invocation behavior receives a current revision.

Step execution card: compose receives retain and delivery separately, dispatches
existing owners once, saves requested portable values in the existing conversation
owner and emits the selected final data/images plus save metadata. The provider
encodes only selected image bytes; capture does not repeat for delivery or saving.
Storage failure remains observable with acknowledged execution preserved. The
formal proof must count applications, captures and saves, and compare delivery
with retention toggled. Review each owner slice before advancing.

### Implementation review and focused validation

The host now preserves normal final delivery while appending save metadata.
Removed the retain/stage implicit status branch. Default sequence leaves still
pass their registered owner projection and validation; the outer execution
receipt does not validate a compact public structural receipt as raw execution
arrays. Ready batches also retain their registered public projection. Explicit
status and fields remain explicit selections. Default failures keep the original
execution recovery once, while selected delivery keeps its failure envelope.
No compatibility route or extra model call was added.

The exact E3 regression failed before implementation (zero images only when
retain was present) and passes afterward. Validation includes 154 cases across
the host, context delivery and recorded integration suites, followed by the
24-case final delivery/failure matrix and three selected-result/ready-batch
cases. Three native-provider tests verify the actual declaration and dispatched
image blocks. Cases overlap; counts are not additive. Applications, captures
and saves are counted; storage failure preserves the captured image and settled
writes without replay. Contradictory tests now explicitly request status when
asserting no returned work values. Two stale API/spec default-status descriptions
were removed. Server types, naming (15), Inspector contract tests and scoped lint
passed (one existing console warning). Current-source execution-owner baseline
passed in candidate `2465a8a3-1c04-4d02-bfd8-a1446ff48005`. The ordinary verifier
uses a historical accepted architecture; the current-source candidate proves
the changed architecture without restoring that old contract or running negative
scenario sweeps.

Live observation is complete, but the drawing did not complete: run
`taipei-101-fixed-1794226962133` stopped at 547.363 seconds on a later property
update failure. The unlimited original-thread report completed in 297.310 seconds
and remains open for follow-up. E2 exercised retain with omitted delivery and
successfully delivered its image; E5 delivered both selected images. Durable
sequence 794 and reload equality passed. See the
[independent retention/delivery report](../reports/taipei-101-independent-retention-delivery-2026-11-09.md)
for the complete original report, validation and separate new failure. This task
does not claim a successful complete 101 drawing or authorize unrelated fixes.

Original prompt SHA-256:
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
Manual file edits were frozen through drawing and the same-thread unlimited report.

## Previous target status

November 9 follow-up - the target-bound execution correction and its requested
live observation are complete, with the validation limitations below retained.
The original report session remains open. See the
[target-bound results report](../reports/taipei-101-target-bound-results-2026-11-09.md).
Earlier targets below remain implementation records.

## Target-bound execution results

### Bounded correction and reviewed design

The preceding run's E6 submitted details, a step-time region group and two
dependent captures. Its published groupId path was rejected before execution
because the sequence compiler replaced the registered action with the opaque
private batch. This section supersedes that route, not the canonical group API,
target resolver or Runtime dependency validation.

1. **Compose - preserve the execution owner.** Add a permanent fixture from
   `taipei-101-fixed-1794209667880` E6 and its acknowledged saved input sources.
   First reproduce the rejection through the production host with actual Core
   construction/grouping, the registered region reader and capture consumer.
   A named/dependent target-bound operation must retain its registered action
   identity and complete execution/model result schemas. Its existing wrapper
   admits either ordinary canonical arguments or target-supplied arguments, then
   uses the existing target resolver and canonical admission before dispatch.
   Anonymous independent operations retain batching. Remove the downstream
   single-batch model-owner substitution once the compiler retains the owner.
2. **Compose/inspect - prove the complete handoff.** Keep live selection after
   earlier writes, exact expected-count admission, one region resolution per
   distinct query, canonical action validation, conditional output and failed
   prefix/no-replay behavior. Test the real geometry and region parameters through
   create -> select -> group -> both captures in one host call. Include invalid
   target input, no-match/wrong-count, missing/failed grouping output and existing
   artifact fan-out consumers. Inspect actual provider declarations/usage and
   native dispatch, not only raw owner schemas. Update contradictory old tests.
3. **Observation.** After focused tests, type/lint/naming and current-source flow
   proof, run one unchanged-prompt fifteen-minute drawing. Preserve same-thread
   unlimited reporting and the retained session. Freeze edits throughout drawing
   and reporting. Review actual adoption separately from formal coverage.

Allowed changes: App sequence compiler, registered operation wrappers/dispatcher,
direct host consumers, their focused tests/recorded fixtures, current API/spec/
Inspector/plan documents and the final report. No framework admission relaxation,
new public tool, compatibility route, prompt forcing, new cache, full-local test,
release checks, commit or push. Preserve unrelated dirty changes. No persistence
identity changes are needed; wrapper revisions change with their contract.
Current request registration owns derived schemas; target membership remains
dispatch-local and is never cached across writes. Existing canonical owners
retain all geometry, selection and mutation semantics.

Step execution card: compose consumes the admitted operation and canonical target
schema, emits the same typed action contract to Runtime and model delivery, and
dispatches through the current secured action exchange. Inspect consumes its
actual groupId. Failure remains at input/target/result admission with real
settlement; no substitute ID or blind continuation is allowed. The first formal
regression must fail before production edits. Review the changed owner and its
direct handoffs before advancing; no unrelated discovery or cleanup is included.

### Direct-consumer review refinement

Typed target-bearing wrappers add an input alternative. The existing shallow
usage navigation must expose each wrapper branch's direct fields and argument
union choices, without recursively expanding all owner schemas or requiring an
extra discovery call. Ordinary argument validation remains complete; target
arguments undergo the existing complete bind/admission before mutation. Update
old exact wrapper paths and dependency revisions, not the current semantics.
A broader composition test-file run also reached unrelated superseded mandatory
mechanical-review expectations; those are outside this contract correction and
are not evidence to restore automatic checks. The three directly affected
composition/prefix tests are selected separately and use current revisions.

Current target-bound correction validation: the recorded create/region/group/two-
capture regression now passes, including wrong-count, empty-region, failed-owner
and missing-ID boundaries. Focused suites passed 139 integration/host/delivery
cases, 159 operation-contract cases, five native-provider cases and three directly
affected composition cases. Server type checking and naming passed; scoped lint
has no errors and one pre-existing test console warning. The broader composition
file still has 24 unrelated retired automatic-review expectations; it is not
reported as passing. Same-context acquisition still uses two calls; the complete
native contract now totals 33,793 bytes versus the historical 27,762-byte baseline
(compact action route: 23,703 bytes). This correction proves handoff correctness,
not a reduction in contract bytes. Live adoption is recorded below.

The final negative flow proof exposed a stale verification manifest: removing all
native tools also breaks the existing evaluation-report case, which now obtains
and calls execute_design. Both observed failures are explicitly declared for
that mutation; positive assertions and production behavior remain unchanged.
This bounded verification correction includes the App flow manifest.

Current-source positive flow evidence passed at accepted revision 30 (attempt
e0803658-d042-4d8e-a14b-53ec50f58ee1). The corrected omit-registered-tools negative
case produced exactly its two expected failures. The broader negative proof did
not finish: the unrelated dispatch-rejected-history mutation failed to collect
cases (attempt 17284c0d-667d-4c2f-ac4d-049d990c2d32). This is an explicit validation
limitation; no history-operation implementation or unrelated tests were changed.

### Live observation

Run `taipei-101-fixed-1794215656743` used the unchanged prompt and a 900,000 ms
drawing deadline. Drawing ended voluntarily after 442.382 seconds; the original
native thread completed its unlimited report in 436.238 seconds and remains
available for follow-up. No manual files were edited during either phase.

Two live sequences bound groupId to captures successfully. They used saved and
previous-step IDs for grouping, not a region-to-group selector; exact coverage
of the preceding failure therefore remains the recorded regression, not an
unexercised live-route claim. One nonplanar author face was rejected and repaired
without stopping or replaying successful work. Seven contract queries returned
73,963 text bytes; seven execution calls returned 8,933 text bytes and six images.
Three acknowledged ID names were reused without a separate value read.

Remaining observations: retain without explicit image delivery caused one
snapshot recovery, a manually selected crop required correction, and known
geometry parameters were copied instead of bound. These are recorded for review;
no new mandatory workflow or automatic image delivery was introduced. The AI
qualified its initial completion claim, yielding partial App settlement. Runner
evidence separately confirms durable sequence 681 and identical reload content.
The complete original report, screenshots, recording and validation limitations
are linked from the report above. No commit or push was performed.

## Provider-visible handoff contracts

### Evidence and bounded task

Run `taipei-101-fixed-1794165655396`, provider request
`69f37a9d-385b-4723-8116-b7e3c57f290c`, and same-thread follow-up
`01a1bf0d-64fa-75f2-b93f-cc0b8993b3d5` supersede the previous attribution:

- The same-submission input example exists at the owner but is removed by the
  provider schema projection. Ordinary usage picks the first valid example, while
  the new example was second. The previous raw-owner test proves execution only.
- Four identical projections are 70 bytes each; a named reference is 56 bytes.
  Non-use did not add a forwarding call or cause drift. Do not force alias use.
- The unused context lookup provided actual region/filter syntax. Host target
  schema was empty while internal admission had the complete owner schema. It is
  not proven that the entire lookup was unnecessary.
- Outer inspection lacks scope/default semantics in the delivered declaration.
  Deletion usage lacks narrow count/status selectors, so selecting actionResults
  also delivers its automatic image. Capture and delivery are separate controls.

Authorized scope: compose/provider contract projection, sequence declarations,
existing operation target/result owners, direct focused regressions and their
API/spec/Inspector/plan documentation. Preserve all unrelated dirty changes and
existing execution, storage, optional-path validation, capture defaults, staged
execution, recovery and report-session behavior. No compatibility routes, new
execution tools, compulsory reuse/Knowledge/planning, full-local/release/CI,
dependencies, commits or push. Do not modify the drawing prompt. Do not edit any
files while the live App AI draws or reports.

### Reviewed steps and execution cards

1. **Compose/provider - executable examples.** Canonical owners are
   design-workflow-discovery, local-ai-provider, local-operation-tools and
   local-design-sequence. Select one valid primary owner example through one
   shared selector. Deliver it in the native schema and in usage without
   duplicating all examples; make input reuse the host's primary example.
   Regression must inspect the actual thread/start dynamicTools packet and send
   its example through the native tool-call dispatcher. Preserve schema
   compaction and ordinary usage's separate invocation field. Replace the old
   raw-owner-only publication claim; keep its execution coverage.
2. **Compose - target contract handoff.** Source the public host target schema
   from the existing canonical batch target declaration, already derived from
   the admitted region resolver. Reuse it for ordinary steps, stage operations,
   apply steps and iteration checks/repairs without an independently maintained
   filter schema. Inspect provider output and execute the recorded region/suffix
   deletion through the host without a context-contract lookup or model ID read.
   Invalid selectors still fail before writes. Missing resolver capability does
   not advertise region selection. No cache or new query owner is needed.
3. **Compose/inspect - explicit capture and narrow results.** Publish outer
   inspection scope/default behavior at its schema owner, including that explicit
   capture still runs. Publish deletion count/status paths from its result owner
   using the existing typed conditional result-navigation mechanism. Derive a
   submitted sequence from provider-visible contracts: delete, build and capture;
   retain the original recorded selectors and use defer plus narrow delivery.
   Verify actual capture counts, one selected final image, deletion count/status,
   settled writes, and preservation of optional-path failures and automatic mode.

Each step first demonstrates a formal failure, then implements, reviews the
provider packet and direct consumer, and runs only relevant focused tests. Public
projection happens in the existing request-owned declaration construction; result
selection and target schemas retain their existing owners and lifetimes. Count
actual dispatches/reads/applies/captures instead of treating metadata as execution
proof. Current-source flow evidence covers the completed compose owner boundary.

After all three steps: unchanged-prompt 15-minute drawing, unlimited report in the
same native thread, retained session, recorder persistence/reload evidence and
visual inspection. Report adoption separately from capability availability;
unused saves and different artwork duration are not regressions.

### Step 3 regression refinement

The recorded E5 regression rejects the advertised deletion count before execution:
region targeting compiles to the private batch, whose result declaration only
navigates retained identities. A second conflict exports model-selected fields as
Runtime output bindings even though compact model values and execution receipts
are different contracts. The existing observer already captures projected step
results. Keep model field selection there; portable model-only fields do not
become Runtime output bindings. Preserve execution-field exports needed for
resource lifetimes. Resolve a selected single-operation batch through its admitted action's model
result contract, keep execution receipts unchanged, and retain conditional-path admission
and missing-field failure semantics. This bounded correction includes the direct
consumer local-tool-host; it adds no execution route or compatibility behavior.
Prove the actual recorded region operation, narrow scalar delivery and explicit
image count before live evaluation.

The direct-consumer regressions additionally exposed batch lease declarations
that covered structural receipt aliases but omitted query snapshot/lease fields.
Build resource navigation from admitted output lifetime metadata, including query
snapshots, rather than only structural receipt ownership. Preserve selected
artifact output and subsequent snapshot reuse. This is a current-contract owner
correction, not a compatibility path or a requirement for the AI to export data.

### Progress

All three provider-boundary regressions failed on the previous behavior and now
pass. The recorded E5 executes ten deletions plus construction and one selected
final image; defer captures once and immediate captures twice. Direct-consumer
review caught and corrected selected-resource lifetime loss, with subsequent
snapshot reuse now covered. Final focused verification: 134 handoff/host/result
tests plus seven native-provider tests passed; naming and server typecheck passed;
scoped lint has zero errors (three existing console warnings). Current-source
flow attempt f446f53a-3ce0-43ef-926a-9fb90aa4d75b passed all 89 cases; reviewed
contract 5f6cc91942eee486ea9d6b720bf002d74feccdb6b5762013a4e4e5ac9b289545
was accepted. No full-local, release or CI run.

The single live observation `taipei-101-fixed-1794209667880` completed drawing in
13m 14.038s and an unlimited original-thread report in 8m 57.018s. The immutable
prompt was unchanged; no files were edited while the AI drew or reported. The
session remains waiting. Durability reached 564/564, reload matched, and reporting
did not modify the document. See the
[provider handoff report](../reports/taipei-101-provider-handoffs-2026-11-09.md)
for native contracts, all discovery/execution calls and the original report path.

Live verification exposed an unresolved dependency route: target-bound grouping
compiles into the private batch, whose execution output does not carry the
advertised groupId for subsequent capture bindings. Model delivery now resolves
the actual action owner, but Runtime dependency admission still sees the batch
contract. The AI attempted the correct combined sequence and was forced to split
it after rejection. This is not an AI path error and is not fixed by the current
changes. Direct-ID grouping coverage and model-selection coverage missed this
region-targeted dependency combination. The next bounded correction must retain
the real action execution contract through target resolution and regress actual
E6 create/select/group/capture parameters, including failed or missing results.
No follow-up implementation was made after observation; do not mark the whole
handoff flow closed.

The run exercised eleven acknowledged saves and six reused names, with no full
saved-value retrieval. Current bounds were legitimately read through context;
decided ordering and final captures were combined. Same-submission input aliases
and deletion selectors were not used live and remain formally verified rather
than live-adoption claims. Ten contract replies totaled 101,837 recorded bytes;
nine execution replies totaled 13,282 bytes and delivered seven App images.
Different artwork complexity does not establish a speed improvement.

## Executable contracts and decided handoffs

### Evidence, scope and reviewed design

Run `taipei-101-fixed-1794161375677` and native follow-up
`01a1bc79-09bc-7443-899c-5b0ec97893fd` establish two distinct errors. E1 guessed
`/preparationInput/draft` although that output is only preparation-source metadata.
The host already resolves same-submission authored-input aliases, but the agent
could not establish that timing from delivered usage and split known work. E3
omitted the capture wrapper envelope: discovery mixed ordinary action parameters
with a different callable route, supplied no executable example, and the host
example builder did not apply argumentField. These are not missing drawing tools.

Twelve saves and nineteen successful bindings across nine names prove useful
continuity without full-value readback. Unused saves remain valid. E7 reads new
bounds, not redundant data. E6 exposes avoidable receipt/image delivery; later
visual decisions remain legitimate. The shorter `group elements` query ranks a
movement recommendation above grouping; the longer prior regression does not
cover it. No timing comparison between different artwork establishes causality.

1. **Compose - executable route consistency.** Deliver the registered host
   wrapper's actual input/output schemas for routed actions, across usage, full
   and field selection. Derive examples from owner examples in that same schema;
   remove the mixed ordinary-schema/host-envelope contract. Keep native-only and
   canvas batch routes distinct; no alternate input admission or compatibility.
   Replay the actual failed capture parameters and execute acquired examples
   through the production host, including failure before writes.
2. **Compose - same-submission input reuse.** Publish and execute a generic
   host example that retains authored input and consumes it later in the same
   submission. Use the existing alias resolver, with no extra read/store or
   mandatory persistence step. Replay E1's real geometry with correct input
   aliasing; preserve cyclic/missing-source rejection and existing cross-turn
   context isolation. Do not broaden preparationInput into an echoed draft.
3. **Compose - result-to-consumer handoff.** Use owner-declared result paths
   to expose exact named-step binding/selection locations and their types and
   optionality. Regress grouping to a narrow geometry read and selected delivery
   in one host call. Existing schema selection and Runtime optional binding own
   validation; no new result store, guessed array search or always-return-bounds.
4. **Compose/inspect - purpose and selected images.** Correct incidental
   recommendation metadata so the real short grouping query and opaque-name
   variant identify grouping before movement. Preserve compound-search coverage
   without query-specific ranking. Regress outer inspection defer plus explicit
   multi-image selection and narrow group ID delivery; prove capture counts and
   fresh images without adding automatic inspection suppression or a new gate.

The canonical owners are local-operation-tools, local-design-sequence,
local-result-delivery, existing API/inspection schema declarations and their
focused tests. Mutation scope includes their current API/spec/Inspector contract,
this plan, permanent recorded fixtures and final live-report evidence. Preserve
all unrelated dirty work. No framework execution redesign, extra dependencies,
Asyra skill, subagents, full-local/release/CI checks, compatibility paths, forced
planning/Knowledge/reuse, drawing-prompt changes, commits or remote Git actions.

Review each owner's current Inspector inputs/outputs, error owner, direct consumers
and existing accepted cases before edits and advancement. Add failing behavioral
regressions before fixes; review the resulting diff, directly affected tests and
contract together. Existing alias resolution already owns source reuse, existing
registered schema selection owns result paths, and inspection owns pixel work.
No cache or new materialized state is needed. Tests must count browser exchanges,
actual applies, saved reads and captures where those are the intended improvement.

After four steps, run focused owner/provider/contract checks and one unchanged
prompt fifteen-minute drawing. The original native session writes an unlimited
report and remains open. Freeze manual edits while the model draws or answers.
Report contract errors, actual bindings, separate forwarding calls and reasons
for returning to the model, including non-adoption without assuming a defect.

### Progress

Steps 1 and 2 passed acquired-example and recorded E1 regressions: actual host
wrappers agree across views; same-submission authored input executes three real
preparations with zero stored-value reads. The 157-test discovery owner suite passed.

Step 3's first real consumer exposed another mismatch: context input IDs added a
256-character bound absent from the canonical document-reference result type.
Static composition correctly rejected that incompatible producer/consumer pair.
Remove the consumer-only ID restriction and use the canonical reference schema
in context IDs and parent/ancestor selectors. This is the same handoff boundary,
not a Runtime relaxation or a group-specific exception. Preserve unrelated name
filters. The permanent group-to-recorded-bounds regression must prove one grouping
and one read through the host before advancing.

All four implementation slices now pass their focused regressions. Grouping binds
the declared conditional ID into the recorded geometry query in one submission.
Short and long purpose queries pass with real and opaque identities (164 discovery
and search cases). Selected capture proves exactly two captures and two delivered
media paths with outer defer and only a selected group ID. The integration file's
65 other cases passed; after correcting the new media assertion to the actual
`media` envelope, the capture case and acquired-envelope case passed as well.
The narrow capture fixture preserves recorded views/selection but uses the fixture's
current target rather than the recorded tower's region; live evidence verifies
actual canvas pixels. No capture behavior was changed to accommodate the fixture.

Self-review caught and corrected a projection regression: full result-schema
requests must not additionally materialize the compact result-path structures.
The existing scoped-result proof and selected-contract proof both pass. Typecheck,
scoped lint (zero errors; one pre-existing console warning), naming, and diff checks
pass. No runtime alias resolver, optional binding validator, saved-data store,
automatic suppression policy or compatibility parser was added. Final candidate
flow proof and the unchanged-prompt live observation were completed below.

Completion evidence: all 89 current-source flow cases passed in candidate
`4203d765-1dcc-47cf-bd11-1fc05487cf9f`; contract review
`d46986e9a00d7822bf4c53694040841d6cab8dd4e4addd1976314391fac23134` was accepted.
Run `taipei-101-fixed-1794165655396` used the unchanged prompt and 15-minute ceiling;
drawing completed natively in 300,983.84 ms and the same thread wrote its unlimited
report in 300,210.30 ms. Session remains waiting. Four discovery calls returned
45,406 text bytes; five executions returned 8,025 bytes and four images. Seven
successful saves, one direct named binding, zero saved-value readbacks and zero
pure-forwarding calls were observed. A non-coplanar authored face was repaired from
retained source in the same drawing turn without replay; no blocking error.

The corrected capture envelope was received and used correctly. Same-submission
input reuse and group-to-bounds chaining were formally verified but not used by
this model run. An unused context lookup and an automatic intermediate capture
remain model choices; existing outer defer controls the latter. Preserve these
limits rather than claiming adoption from availability. Report/reload document
equality passed, durable sequence is 355, and evidence collection has no errors.
See [the implementation and live report](../reports/taipei-101-executable-handoffs-2026-11-09.md)
for full evidence and the unchanged original AI report. These four slices are
complete; no further implementation, commit or push is implied.

## Discoverable handoffs without mandatory reuse

### Evidence and objective

The observation `taipei-101-fixed-1794155277890` and its two same-session
follow-ups establish different findings: E4 selected only its last capture;
D3 could not discover an existing-image recovery operation; D2 returned two
descriptions for one capture capability; D4 ranked an incidental preservation
description above grouping. Provider instructions restricted step names to
binding even though delivery and retention also use them. Two preparation
descriptions still advertised removed criteria. These are contract and handoff
defects, not evidence that unused saved values are waste.

Saving for a possible later phase is successful even when no consumer follows.
Keep full values in App conversation context and return a small index describing
the saved name, producing operation, input/result selection and available shape.
The AI may bind a known saved field directly later. No required reuse, plan
registration, extra acknowledgement, automatic value return or quality gate.
The objective is fewer model acquisition/forwarding turns, not less tool work
or a shorter drawing at a different level of detail.

### Ordered implementation and review

1. **Compose - remove conflicting contracts first.** Test actual provider
   declarations and preparation guidance; remove obsolete criteria wording and
   the binding-only step-name rule. Audit the same current prompt, discovery,
   spec and test owners for superseded review requirements. Historical reports
   remain evidence. Review this cleanup before proceeding.
2. **Compose - discovery and execution identity.** Return one callable usage
   route for a canonical action/wrapper pair, including captures; retain explicit
   qualified lookup and genuinely different namespaces. Correct canonical capability metadata where an operation is described only by
   implementation details or a recommendation for another operation. Preserve
   generic metadata ranking and verify relevant purpose coverage. Regress the real grouping query,
   opaque names, compound queries and reference acquisition together.
3. **Request/compose - useful storage receipts.** Have the existing App store
   produce a bounded description when saving, carry operation/source provenance,
   and return the same index in the execution receipt and next-turn context.
   Preserve direct bindings, document/conversation isolation and existing
   capacity limits. Replace superseded wire shapes and their tests together.
4. **Inspect - recover captured pixels.** Expose retrieval of request-owned
   captures by identity or target/view without capturing again. Deliver through
   the existing image channel with capture identity and snapshot semantics.
   Editing the document must not turn an old image into current verification.
   Prove capture work counts, selection, unknown handles and request lifetime.
5. **Whole handoff observation.** Run focused affected-owner tests and scoped
   type/lint/contract checks. Run one unchanged-prompt fifteen-minute Taipei 101
   observation, followed by the original AI's unlimited same-session report;
   retain the session. Ask about receipt usefulness, discovery, multi-image
   selection/recovery and why decided operations were separated. Do not edit
   any files while it answers. Compare handoffs, not unequal artwork durations.

Scope is the existing plan's implementation owners and their direct tests,
current API/spec/Inspector contracts and live reporting questions. No new
compatibility paths, dependencies, release work, full-local tests, remote Git
operations or drawing-prompt changes. Test each defect before its owner fix;
review each slice against actual producer and consumer contracts before advancing.
Unneeded saves, fresh visual decisions and normal model waits are not failures.

### Progress

Live admission follow-up: `taipei-101-fixed-1794160792861` failed before provider
creation because the report question fixture contained 8,634 characters and the
browser parser imposed an unjustified 8,000-character ceiling. No drawing or
model report occurred. Restore the exact recorded questions, remove only that
ceiling from the canonical parser and current spec, and replace the old rejection
oracle with lossless long-instruction admission. Preserve nonblank/type checks,
independent drawing deadlines and unlimited reporting. The actual fixture and
8,001/16,000-character regressions fail before the fix. Do not shorten questions
or modify the drawing prompt to accommodate an obsolete limit.

Cleanup: the actual-provider regression failed on obsolete criteria wording,
then passed after both preparation descriptions and the step-name restriction
were corrected. Scoped review of current prompts, discovery, Knowledge, execution
spec, API and Inspector found no remaining positive retired-review requirement.
Removed an unused criteria test helper and replaced an unrelated search fixture's
obsolete prose. Historical reports and explicit absence assertions remain intact.
Search review: changing global ranking to privilege a first sentence, or globally
normalizing plurals, regressed existing compound and metadata searches. Those
changes are rejected. The first incorrect owner is the grouping description:
it describes geometry preservation without the existing-elements/position task
terms, while movement descriptions lead with group-related guidance. Correct
these actual capability descriptions and retain the tested generic ranking; do
not add query-specific routing or infer semantic synonyms from every identifier.
Discovery owner review passed 162 focused tests, including the recorded query
with canonical and opaque identities, compound queries, native namespaces and
canonical capture usage. The duplicate route is removed only when the canonical
action already supplies its executable wrapper route.
Storage review: real staged inputs, selected-prefix recovery, direct bindings,
reference delivery and App snapshot tests pass after replacing string-only save
acknowledgements. Empty JSON Pointers are explicitly admitted through the Runtime
output schema. Descriptors are produced on save and reused in later context.
Capture recovery review passed the actual omitted-overview host replay and
request/currency tests. Historical redisplay uses original bytes; current-image
checks still reject stale evidence. Provider and browser checks also exposed
stale description assertions and an outdated partial-field expectation: no
successfully delivered definition is failed/completed, followed by exact narrow
recovery. Updated those tests without changing recovery behavior. Browser tests
run in jsdom. Current Flow Inspector proof passed all 89 cases, including saved
provenance and capture recovery. Focused lint/type/naming and recorder checks are
part of final validation. No full-local or release checks were run.
Final handoff review found an existing capture lifetime omission: inspectionId
was a plain string, and retention admission checked only top-level result paths.
The recovery owner must not inherit that contradiction. Mark the canonical
capture identity and its recovery metadata request-owned, select nested lifetime
through the existing Runtime schema resolver before execution, and preserve
portable sibling fields. Regression tests distinguish rejection before capture
from a later unavailable-image error. No new approval or reuse obligation.
Final current-source proof: `6888b1cb-6313-44f0-8a0d-a566d068db57`, all 89
cases passed. Source digest: `9ed265c71cd3569afe8c7e7bcb1ad90011b3642d86f7fb6815399a2ef1b323df`.
Focused owner, browser handoff, provider, retention recovery and recorder tests
passed; server typecheck and focused lint passed (existing console warnings only).
Naming passed 15 checks. The unchanged prompt SHA-256 remains
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
The subsequent report-instruction ceiling correction passed 28 parser tests and
12 recorder contract tests, with focused ESLint and diff checks. The exact
8,634-character recorded questions were restored; long questions pass unchanged.
The 89-case proof above predates this narrow parser correction and is not relabeled
as a proof of the later source.

Live observation `taipei-101-fixed-1794161375677` then completed drawing naturally
in 703,084 ms and unlimited same-thread reporting in 306,778 ms. Both correctable
admission errors recovered without stopping or replaying successful writes.
The run saved 12 names and successfully consumed 9 through 19 named bindings,
without a separate full-value retrieval. Multiple images were selected together.
Persistence sequence 619 is durable; reload and report document checks match.
No recorder/evidence errors occurred. The full report and qualifications are in
[Taipei 101 - Discoverable handoffs](../reports/taipei-101-discoverable-handoffs-2026-11-09.md).

The original session remains waiting on port 3047, with collaboration 4147 and
persistence 4247. No manual file edits occurred during drawing/reporting. No
commit or push was requested. Remaining observations are not silently closed:
the shorter live query `group elements` ranked grouping second, the first capture
submission missed its documented wrapper envelope, and a grouping capture
coexisted with an explicit overview. Historical-pixel recovery was not needed in
this run. Do not turn these observations into mandatory workflows or infer that
unused saved data is a problem.
The previous original session remains retained and idle.

## Previous target status

November 8, 2026 - implementation is authorized in the existing worktree,
under [Editable Design Agent](ai-design-agent-plan.md). The user approved removing
mandatory data-evidence review and completion gates, retaining tool input/output
validation and the primary AI's final verification, and examining other tools
for the same unnecessary procedural coupling. Review and iterate each owner slice
with focused tests only. After implementation, run one unchanged-prompt Taipei 101
observation with a fifteen-minute drawing limit, followed by an unlimited report
in the original native session. Retain that session afterward. No edits while
the App AI produces its report or a follow-up answer.

The active target is [Predictable tools without mandatory review ceremonies](#predictable-tools-without-mandatory-review-ceremonies).
It replaces the earlier direction of refining mandatory evidence acquisition,
signed judgments and an App-owned approval ledger. Previous implementation and
observation sections below are historical records, not additional active work
instructions or acceptance obligations. The replacement is implemented and its
focused verification and one authorized live observation are complete. See
[the November 9 implementation and observation report](../reports/taipei-101-direct-observations-2026-11-09.md).
No compatibility route, optional legacy review mode or renamed equivalent gate
is part of the replacement.

The preceding observation is `taipei-101-fixed-1794134061041`; its original native
thread `01a1bab9-4972-7623-9949-8359a8f7522b` remains retained for questions.
Preserve its report, follow-up `01a1bae2-ee24-7a71-b6c3-8d6f96bcd600`, provider
payloads and prior worktree edits. Do not edit files during an App AI report or
follow-up answer. Historical completion claims do not establish this target's
readiness or completion. The new observation is `taipei-101-fixed-1794155277890`;
its original native thread `01a1bbfd-0f51-7a61-851c-0a67a5de7c35` is also retained
in `waiting` status. Drawing ended voluntarily in 727.684 seconds; the unlimited
same-thread report completed in 355.042 seconds. No App tool failed. The AI's
retrospective qualifies the artwork as partial against the full visual request;
this does not represent a restored App approval gate. Persistence and reload
verification passed. No edits occurred during the report.

## Predictable tools without mandatory review ceremonies

### Objective and scope

The AI understands fixed tool contracts before calling them, plans and delegates
decided operations, reuses staged data, and performs final verification against
the user's request. Tools do not infer the next consumer or invent missing
parameters. A declared result missing at runtime is a tool defect; a correctly
declared result insufficient for a reasonable task is a capability-design finding.
Record the input, delivered contract, actual result and missing consumer need to
distinguish these cases. Do not solve either with a Taipei 101-specific branch.

The App owns execution, dependencies, result storage, identity/lifetime checks
and honest operation settlement. It does not require the AI to register and
maintain a second formal approval state for its own design judgments. Success
is predictable handoff with less unnecessary acquisition and data forwarding,
not shorter drawing time, compulsory reuse, more detail or mandatory Knowledge.

This review examines App tool declarations and prompts, discovery, sequence
admission/delivery, reference/media owners, review/fact/calculation owners,
post-write checking, provider settlement and their direct consumers/tests.
Discovery uses current definitions and call sites, retained provider inputs and
outputs, scoped source searches and the existing spec/Inspector. It does not
audit unrelated framework features or use removed code as behavior authority.
Mutation scope is the implementation owners and direct consumers/tests/contracts
listed below, including current Inspector data and report questions. Preserve the
drawing prompt and unrelated worktree changes. No full-local tests, release work,
dependency changes or remote operations.

### Confirmed findings and disposition

Paths below are repository-relative; line numbers in historical reports are
locators, not frozen behavior contracts.

| Current owner and evidence                                                                                                                                                                                                                                                        | Target disposition                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/design-data-evidence.ts` and `server/local-operation-tools.ts`: data queries call the canonical reader, save values under evidence IDs and reread them for judgment/completion. `server/local-design-review.ts` requires a declared data criterion and `dataEvidenceIds`. | Remove the model-facing data-evidence protocol and its completion dependency. Retain canonical data reads, complete/truncated result semantics and actual operation validation. Do not replace it with a hidden automatic approval ledger.                                                                                                                                                                            |
| `server/local-design-review.ts`: capture checks require a plan; verdicts require request/requirement/check signatures; regional judgments require declared units and whole-view obligations. The App prompt requires this formal review flow.                                     | Remove mandatory criteria registration, bind/record verdict operations, signatures, unit quotas and whole-view certification gates. Preserve actual capture, target/region meaning and AI inspection of relevant results, including the final result. A screenshot is an observation, not an App-issued design approval.                                                                                              |
| `server/local-operation-tools.ts` `settleOutcome` rewrites completed outcomes for quality/measurement state; `server/local-ai-provider.ts` calls completion revalidation.                                                                                                         | Remove approval-ledger and pending-review prerequisites from final settlement. Preserve real tool failures, cancellation, unknown writes, delivery failures and durability acknowledgements. AI-described incomplete work must remain incomplete.                                                                                                                                                                     |
| `server/local-reference-decisions.ts` and `select_design_references`: reference use depends on criteria, requirement revisions, declared units and signed use receipts; consumers treat omitted uses as reference-free.                                                           | Remove the formal reference-use approval chain and its capture/fact prerequisites. Use existing attachment/reference identity, selected source/region and ordinary authored purpose/limitations. Preserve access, decoding, coordinate bounds, provenance and source-local failure handling. No mandatory re-import or suitability certification.                                                                     |
| `server/local-design-facts.ts` and the facts/calculations tools: derived notes require retained valid source facts; criterion/element bindings feed review invalidation.                                                                                                          | Remove mandatory source-fact registration and criterion bindings for saving notes or continuing work. Reuse existing conversation retention for actual operation inputs/results; retain direct optional note storage for standalone authored values. Preserve source attribution and actual calculation capabilities. Do not require `record_design_facts` then `record_design_calculations` merely to store a value. |
| `server/local-operation-tools.ts` `finishInspection`: changed targets trigger measurement even when capture is deferred; missing/pending mechanical checks can suppress automatic images and block completion.                                                                    | Remove unconditional post-write quality-measurement work and approval gating. Keep checks needed to admit/execute the operation itself. Explicitly requested mechanical analysis remains composable and reports its result without registering new global completion obligations. A valid requested diagnostic capture need not wait for unrelated quality checks.                                                    |
| Discovery's advertised unique-complete-match rule and Inspector complete-first rule conflict with score-first selection and its new tests. The same import-purpose query previously returned executable usage but now returns a candidate menu.                                   | Replace conflicting rules together. Test normal-purpose acquisition and incidental-output interference jointly against the real catalog; a green synthetic ranking case does not prove both. Do not prescribe a scoring shortcut as the product requirement.                                                                                                                                                          |
| Host registration, discovery, `output` and `delivery.fields` use different schema projections. Discovery catches proof failures as conditional fields; host catches selector errors as `correct_input`.                                                                           | Keep this generic defect in scope even after retiring `/dataEvidence`. Distinguish actual optional fields, invalid authored selectors and unsupported/broken owner schemas. Prove retained tools' declared results through real binding and delivery routes; never loosen validation to make paths pass.                                                                                                              |

`server/` above means `apps/asyra-design/server/`. These are observed behaviors,
not measured latency claims. The data-evidence mechanism checks source currency,
not whether an AI-authored pass correctly interprets the data. Normal data
acquisition already returns a signed next invocation; it does not always require
a separate bind call. Internal repeated reads are not extra model exchanges.

The bounded pass also checked Knowledge, reusable-tool registration/saving,
construction preparation and context/target selection. Keep direct known-ID
Knowledge reads and optional discovery; no compulsory Knowledge lookup exists
in that contract. Keep dependency/type admission and save-only retry for reusable
tools; inline work needs no registration ceremony. Keep compiler validity,
resource bounds, target identity, transaction/Undo behavior and no-replay recovery.
Do not classify these as unnecessary just because they reject unsafe execution.
Template values remain distinct from SceneTree shared elements/properties.

### Target flow and handoffs

1. **Understand and plan - AI, compose.** The request and optional reference
   assets inform the AI's plan. Discovery supplies fixed inputs, outputs,
   conditional branches, units/coordinate spaces, effects and recovery. No
   prerequisite criteria, fact or approval registration. The AI can revise its
   plan without weakening or replacing the user's actual requirements.
2. **Delegate and execute - App host, prepare/apply.** The AI submits known work
   through `execute_design`. Existing bindings connect producer results to
   consumers; existing stages and declared mechanical iterations remain usable.
   Validate known dependency paths/types before effects and actual optional
   values when they become available. Stop an invalid successor without replaying
   a completed prefix. Tools never fabricate an absent result or choose design
   parameters on the AI's behalf.
3. **Retain and observe - App context and data/image owners.** Explicit retention
   preserves useful parameters and results even without a known later consumer.
   Forward results internally when decided; deliver status or selected values
   and images when requested. Captures and data reads work without criterion IDs,
   verdict signatures or a quality-ledger pass. Describe snapshots, identities,
   resource lifetime and freshness precisely; persistence does not make old
   geometry current. Repeated layouts use existing templates, overrides and
   computation tools rather than expanded model-authored item lists.
4. **Decide and verify - AI.** New visual/semantic decisions return to the AI with
   the requested observations. The AI verifies the final result against the
   original request and states unresolved limitations. This is a responsibility,
   not another tool attestation, fixed screenshot count or required verdict call.
   A declared mechanical comparison may run in the host when its inputs and
   conditions are already known; a successful capture is never an automatic pass.
5. **Settle - provider and conversation.** Report actual execution, persistence
   and the AI's task conclusion without an App-owned artistic approval state.
   Quality-review absence does not turn a completed operation into failure.
   Actual failures/unknown settlement remain visible and cannot be promoted to
   success. Existing report-session retention and untimed follow-ups are preserved.

Conditional dependencies and durable storage intentionally have different
lifetime requirements. One canonical meaning does not mean identical owner,
Runtime and model schemas. Remove discovery-only annotations at the appropriate
boundary without stripping validation or request/document identity semantics.
No blanket `runtimeOperationSchema(..., true)` substitution is specified.

### Implementation order and removal boundaries

The user has authorized this reviewed target. Before production changes,
reconcile the exact current
[execution specification](../specs/ai-execution-flow.md),
[API surfaces](../API_SURFACES.md) and
[Inspector flow](../../../../../tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs)
with this target. Their current mandatory-review clauses describe unmodified
runtime behavior, not obligations to preserve in the replacement. Replace clauses
at their owners; do not append exceptions while leaving contradictory requirements.

1. **Review-free observations - inspect and compose owners.** Prove and connect
   the existing canonical data-read and capture routes, with stable documented
   results and direct reference/media access. Remove criteria prerequisites from
   these observation consumers and preserve grouping, capture selection and
   result/media delivery. Do not delete the shared criteria producer while the
   reference/context consumers in slice 2 still require it. Use existing
   observation tools rather than adding a parallel replacement endpoint.
2. **Reference and context continuity - compose/inspect owners.** Replace
   criterion-bound reference uses with existing reference identity/region inputs;
   update construction, capture, fact and selection consumers in the same slice.
   Remove fact/calculation registration requirements used only for review. Keep
   sources/limitations as data, not prerequisites for approval. Existing `retain`
   saves a real step's input/output; it is not an arbitrary standalone note writer.
   Preserve direct optional note recording at the existing owner without requiring
   prior source-fact registration, and expose its values for ordinary named reuse.
   Do not invent dummy drawing/computation to save a note or claim a nonexistent
   generic save route. Remove the unused receipt schemas, stores and
   lifetime restrictions belonging only to the retired approval protocol.
   Asset access/ownership and other live resource restrictions remain.
3. **Retire approval and settle honestly - inspect/apply/settle owners.** After
   slices 1-2 have removed the consumer dependencies, delete
   `define_design_criteria`, review bind/record/data-evidence protocols and their
   exports, the formal-review `plan`/`reviewChecks` parameters of
   `prepare_and_apply_design`, signed `next` judgment templates and the approval
   ledger. AI planning and executable `operations`/`stages` remain. Remove automatic
   quality-measurement scheduling, review-state
   invalidation and completion-only rereads. Retain operation-local validation
   and explicit diagnostic/mechanical checks. Remove ledger-driven outcome
   rewriting in provider, final actions and UI consumers; keep partial receipts,
   unknown writes, failed publication and cancellation. Do not substitute an
   automatic pass or convert actual faults into warnings. Final response
   transport does not become a second write route. Update affected declarations
   and consumers with each removal; no legacy alias, hidden rebinding or optional
   compatibility review mode remains. Slices 1-3 form one replacement, not
   separately completed product contracts.
4. **Fixed contracts and acquisition - compose owner.** Remove retired tools and
   parameters from catalog, native declarations, examples and recovery hints.
   Resolve remaining result-schema projection/error-classification defects using
   supported, non-retired tools. Test real-purpose lookup and incidental matches
   together; preserve exact identities, real ambiguity and known-tool execution
   without mandatory rediscovery. Delete superseded policy tests, not useful
   negative cases or immutable evidence.
5. **Whole-flow verification and documentation.** Update current App prompt,
   spec/API clauses, Inspector steps/routes and their formal proof mapping with
   the affected implementation slices, then review the integrated contract.
   Update self-report questions, recorder/evaluation assertions and report
   interpretation that assume signed review or App approval. Keep the drawing
   prompt unchanged, the original reporting session, unlimited report duration
   and the no-file-edits interval. Missing retired review steps must not become
   evaluation failures; real tool and evidence-collection failures remain visible.
   Existing owners are `compose`, `prepare`,
   `apply`, `inspect` and `settle`; `observe` remains diagnostic. Inspect's output
   becomes observations/check results, not approval authority over settlement.
   Review each slice and its consumers before advancing. Only focused tests and
   affected source/type checks; no full-local or release gates. A live model run
   is now authorized once, after the focused implementation gates pass.

Primary implementation files are the audited owners above plus
`local-design-workflow.ts`, `local-tool-host.ts`, `local-operation-batch.ts`,
`local-tool-invocation.ts`, `local-design-sequence.ts`, `design-check-results.ts`,
the App prompt, constants, direct conversation/result consumers and the existing
drawing-test report/evaluation consumers. Shared Runtime
changes are limited to generic schema/admission defects demonstrated independently
of the removed review protocol. Do not move App approval policy into Runtime.

### Focused acceptance and evidence

November 9 final review: the four affected browser cases passed after aligning the
E2E backend with the App backend; the first mismatch was test environment setup,
not a product persistence failure. Independent pixels, edits, Undo/Redo, peer edits
and durable reload remain covered without verdict recording. The emitted material
reload screenshot was inspected. Runtime admission passes 87 cases; recorder
contracts pass 13; server type checking passes. Retention/schema consumers pass,
including the inherited-lifetime regression. Native provider tests use current
scoped acquisition and follow bounded delivery rather than assuming one response.
The current flow candidate passed (`43138412-63a4-4c66-9c84-7cc2057026d0`)
and its explicit contract retirement was accepted. The final scoped lint has no
errors (one existing console warning); naming and server type checking pass.
The flow gate exposed one obsolete wording assertion, now aligned with the
current optional-input contract. No removed runtime behavior was restored.
Exactly one live fifteen-minute observation completed on separately configured
ports, preserving the preceding retained session. The fixed drawing
prompt SHA-256 remains
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.

Step execution card - complete observation handoff, `inspect` and `settle`:
existing `inspect_drawing` remains a canonical read and is admitted as a composable
operation so decided construction and capture can run in one sequence. Preserve
its image validation, crop limits, canonical stamp and cancellation. The previous
control-only classification failed both real created-target chain regressions;
the current route passes without reintroducing the retired review wrapper.

Step execution card - schema projection, shared Runtime:
selecting a nested union result must validate that selected value, not the original
action envelope. The permanent admission regression failed with missing original
envelope fields; it now passes with projected union validation schemas. The 87-case
admission file passes. Optional selected values remain checked at execution; absent
values stop the dependent step without replaying prior effects. Unsupported owner
schemas remain owner failures, not correctable AI selectors.

The final schema review also reproduced inherited request-lifetime loss when
materializing a selected union field. The permanent regression failed because the
projected string omitted `x-runtime-value: request`. Schema materialization now
preserves inherited lifetime as well as the selected validation shape. This keeps
request handles out of conversation retention; it adds no approval requirement.

Step execution card - direct consumer retirement, `compose` / `inspect` / `settle`:
remove retired protocol fixtures and assertion cases. Preserve canonical image
currency, grouping, history, peer edits, persistence, media delivery and explicit
mechanical checks through their existing owners. Current Knowledge and selected
usage must not publish criteria registration or bind/record instructions. Historical
recordings remain immutable evidence, not current contracts or compatibility paths.

Review evidence so far: 185 construction/discovery consumers and 112 flow,
Knowledge and evaluation cases pass. Real provider-purpose discovery and opaque
names jointly use purpose/input term coverage before weighted relevance; incidental
output matches cannot outrank stronger intent matches. Source/input error ownership,
requested captures, no unrequested post-write reads, and actual unknown writes have
separate regression assertions. Remaining gates are provider integration, current
Inspector mapping, affected browser cases, type/lint checks and the authorized live
run. This is not a completion declaration.

Step execution card - observation consumer, `inspect` / `apply-to-inspect`:
the acknowledged target and explicit capture choice enter the existing image
owner; output is its receipt or capture error. No quality measurement is a
prerequisite. Unknown writes and cancellation bypass capture. The boundary is
`local-operation-tools.finishInspection`, its workflow callers and the permanent
`review-free-operations.integration` cases. Existing input/output, transaction
and reference ownership stay authoritative. Before implementation the new cases
fail twice: immediate and deferred observation both dispatch `review_design`.
The unknown-settlement negative passes. No cache or new public tool is introduced.

Step execution card - fixed acquisition, `compose` / `compose-to-execute`:
registered native wrappers own their declared invocation envelope, while ordinary
actions own their unwrapped parameters. Do not advertise a native wrapper through
an action-alias route that expects a different input. The real context-owner
navigation regression originally failed before dispatch with a nested `arguments`
error. Use the existing registered-tool invocation route for canonical batch
wrappers; preserve exact namespaces, revisions and ordinary action execution.
Discovery-only schema annotations must not become Runtime constraints, but actual
resource lifetime annotations remain. Publicly expose the existing Runtime
`RecipeReferenceError` type so consumers distinguish missing/conditional selectors
from unsupported owner schemas; do not classify arbitrary schema errors as AI
input correction. No saved identity or compatibility alias is introduced.

Initial focused evidence: observation/workflow tests passed 93 cases; standalone
context, host handoff and pixel/source race tests passed. Native capture output
validation reproduced and removed the stale required approval revision. Remaining
consumer, discovery, Inspector and report checks are pending. Retired approval-only
tests are replaced by direct data/image/context cases; historical fixtures remain
unchanged. No completion or live quality claim is made yet.

- A simple style edit, a repeated-component layout and a reference-backed graphic
  execute and expose final observations without criteria registration, data
  evidence IDs, signed judgments or a pending-quality completion gate.
- A multi-stage operation binds producer output directly, optionally retains
  useful context and reuses it in a later turn. No value-only read is needed just
  to forward saved data. Standalone numeric/source notes can be stored without
  inventing prerequisite facts or a canvas operation. A new visual decision still
  returns to the AI.
- Known declaration mismatches reject before effects; a missing optional value
  rejects only its dependent step at execution. Acknowledged prior writes remain
  visible and are not repeated. Tool-schema defects are not labeled AI input errors.
- Real image identity, invalid crop, unavailable media, malformed output, stale
  mutation targets, foreign request handles, cancellation and unknown settlement
  retain meaningful errors. Saving authored values does not extend a resource lease.
- Requested capture works without unrelated measurement approval. Explicit
  numeric/layout checks still return findings, but no check is silently scheduled
  merely to satisfy a removed completion ledger. Assert owner call/read counts,
  not just successful outputs; concurrent-change-sensitive operation checks stay.
- AI final verification remains in the prompt and observable final explanation;
  tooling does not demand a new checkbox or proof token. Actual failed/incomplete
  work and publication uncertainty remain distinguishable from quality opinions.
- The recorded import-purpose query and opaque-name/incidental-output cases pass
  against the real catalog and actual provider declarations. Retained generic
  result contracts agree across discovery, step bindings, selected/full delivery
  and named reuse. No retired tool or parameter remains advertised or auto-inserted.

Extend the existing `data-review.integration`, `review-free-operations.integration`,
`criteria-reference-handoff`, `image-delivery.integration`, `result-delivery-handoff`,
`phase-continuity.integration`, `local-tool-host`, `discovery-delivery.integration`,
`local-ai-provider` and execution-flow tests. Replace former approval requirements
with independent observation/settlement cases. Preserve valid target, input/output,
media and recovery negatives. End-to-end proofs must not use
`withReviewBindingActor` or another test adapter to invent missing AI calls.
Existing raw 101 fixtures are regression inputs, never special execution branches.

Open proof obligations: exact removal reachability, generic replacement schema
behavior, absence of hidden review calls and preserved failure handling require
implementation-time regressions. No claim of latency reduction, model adoption,
Inspector admission or implementation completion is made by this plan review.

Documentation review: source tracing distinguishes operation validation from
approval policy; current Inspector conflicts are identified for replacement,
not treated as preservation requirements. Consumer-first removal avoids a
criteria/reference dependency gap. Standalone note storage is not incorrectly
equated with step-bound retention. Existing files retain their prior historical
body; local links and target anchors were checked. Implementation, focused regressions and current Inspector reconciliation are in progress. No live observation has occurred in this task.

## Historical implementation and observation records

The remaining sections preserve earlier task decisions and evidence. Their
imperative wording, completed checks and live-run allowances are historical;
they neither reactivate mandatory review nor authorize another implementation
or drawing run. Use only the active target above for the next task's scope.

## Correctable sequence input and bounded live iteration

November 8, 2026 - the user approved immediate correction after the read-only
trace, followed by at most fifteen new fixed-prompt drawing attempts. This
supersedes the earlier single-attempt/no-retry boundary for this task only.
The preceding run is historical evidence and does not consume this allowance.

Objective: malformed authored parameters must reach the original agent as
correctable input without terminating its drawing turn. Genuine App failures,
missing required data, failed delivery, unknown settlement and the fifteen-minute
drawing deadline retain their stop behavior. Ordinary visual correction is allowed.
Keep completed writes; never auto-correct geometry or replay successful prefixes.

Scope: Runtime recipe admission issue classification, App host translation,
invocation/provider/evaluation handoffs, direct permanent regression tests and
these current contracts. The frozen discovery set is the prior run's second
input/output, those direct owners, their error schemas, existing negative cases
and failures found in this task's live attempts. No prompt coaching, model change,
new planner/validator/cache, full local tests, release work or remote operation.
Use the existing worktree and preserve prior edits. Existing source/value and
saved-context ownership remains unchanged.

1. At compose admission, distinguish canonical authored-value rejection from
   dependency, schema or unclassified binding defects. Runtime owns the typed
   issue code; App maps complete, known value issues to existing correct_input.
   Preserve mixed/omitted issues as blocking. No error-message matching.
2. Prove the recorded projection.kind failure before effects, direct/sequence and
   selected/status parity, then corrected suffix execution without replaying the
   previous tower. Verify provider evaluation leaves the same drawing turn active
   for correct_input, while genuine failure and deadline still interrupt it.
3. Remove the stale spec wording that failed visual checks or ordinary corrective
   rework stop the task. Update spec, Inspector and Runtime contract together.
   Focused checks: Runtime admission; App host, evaluation and recovery; actual
   created-target integration; mapped source proof; scoped type/lint/naming and
   runtime builds. Review each owner and negative cases before advancing.
4. Run the original prompt, fifteen-minute ceiling, until a complete tool-flow
   observation succeeds or fifteen starts are used. Record each start, exact
   failure, root cause, correction and the next verification in the existing
   task report. Genuine tool defects stop that attempt; let the original AI finish
   its unlimited report before editing, then fix/test/review before restarting.
   A parameter correction within a live turn is not a new attempt. Preserve
   fit-to-content video, unchanged drawing/report canvas, persistence evidence and
   original native-thread identity. Retain the final report session for questions;
   explicitly close superseded sessions before the next implementation/run.

Naming: add the Runtime-owned value issue category to AiRecipeIssue. It denotes
canonical authored-value validation, not a tool identity, stored recipe format,
or automatic retry command. No compatibility alias or persisted-data rewrite.
The existing App recovery identifier remains correct_input.

### Attempt 1 revision - reference selection admission

Run `taipei-101-fixed-1794112907923` exposed a second authored-input category:
the agent selected `/preparationInput/draft/...` from a construction result.
The delivered contract includes preparationInput metadata, but its canonical
schema has no draft. Existing same-call retained input bindings can carry that
draft instead. This is not lost App data or an unsupported composition capability.

Compose execution card: Runtime source-path resolution owns typed reference
selection failures; admission preserves that type; App host translates only a
complete known set before execution. A source selector that cannot be established is correctable; this does not
make it valid or widen schema projection. Keep schema parsing failures, incompatible
types (including opaque selected values), missing dependencies, omitted issues and unknown settlement blocking.
Do not infer categories from message text or alter the provider's stop policy.
The implementation allowlist is recipe-schema, recipe-admission, recipe-types,
local-tool-host and their direct tests/contracts. The permanent regression uses
the recorded base and two-tier request, proving zero writes on bad selection and
same-call retained-input repair without repeating the base. Review mixed failures and
opaque-value assignment failures as well as provider continuation before attempt 2. Reports must
finish before any edit. Attempt 1's original untimed report has completed.

### Attempt 2 revision - source-local reference recovery

Run `taipei-101-fixed-1794114048516` corrected an unknown selected step within
its original turn, then stopped on one 404 among two reference imports. The owner
explicitly describes source-local recovery, but did not publish settlement/recovery;
Runtime therefore reported unknown settlement and evaluation interrupted the turn.
This is not confirmed loss of required App data. Preserve the successful reference
and let the agent select another source; do not automatically repeat acquisition.

Compose execution card: add the reference acquisition owner and evaluation recovery
to this iteration's allowlist, with their direct regressions and schemas. Publish
select_reference only before attachment admission; failures during App admission
remain unknown and blocking. Aggregates must preserve all child outcomes and native
images. Test partial success, all-source failure, unknown attachment admission,
independent delivery failure and same-turn provider continuation. Review source,
Runtime and model receipts together. No download/security/resource guard change,
no new search strategy, no prompt edit. Attempt 2's original report has completed.

Bounded iteration status: complete after three of fifteen permitted starts.
Attempt 3 completed work and the original untimed report, retained the session,
and proved durable reload equality. Exact rejected-input/source fixtures and
negative cases passed focused validation. See the
[complete iteration report](../reports/correctable-input-iterations-2026-11-08.md).
This status applies only to the stopping/recovery correction above, not the
remaining context, delivery or cache candidates in this broader plan.

## Reference receipt and discovery follow-through

November 8, 2026 - implement the follow-up review of
`taipei-101-fixed-1794130103950` and its two original-thread follow-ups.
This section supersedes claims that reference-free capture proved reference-use
chaining, or that referenceDecisions was safely portable. The existing positive
storage test endorses the wrong lifetime and must change.

Bounded task: reference selection/result ownership, host admission and direct
capture consumers, capability discovery ranking/menu delivery and selected
contract presentation, their permanent focused tests and existing API/spec/flow
documents. Preserve the dirty worktree. No new dependencies, model/prompt change,
mandatory planning, mandatory Knowledge, forced batch size, renderer redesign,
release/full-local tests, commits or remote operations. One final original-prompt
15-minute observation; unlimited original-thread report, retained afterward.
No agent file modifications during reporting or follow-ups.

Evidence: discovery returned 138,424 text bytes across 11 calls. Initial vector
and plan selections were unused; unused tools and later-unused data review were
model choices. D8 returned partial lexical candidates including unrelated uses
of material; material revision requires an existing world field and is not a
local-gradient conversion. H2 selected only the criteria revision, causing H6
to repeat identical reference decisions. Independently, the producer's opaque
referenceDecisions array advertised conversation retention while consumer receipts
are request-owned. The prior capture regression removes referenceUses.

Ordered slices and execution cards:

1. **Canonical reference result and lifetime.** Compose/reference owners share
   typed snapshot/use/receipt schemas. Publish actual nested output paths and
   request lifetime through selection, discovery, admission and runtime storage;
   portable authored decisions remain storable. Replace the false positive
   retention oracle. Prove rejection before effects for request-bearing snapshots,
   while selected delivery and portable input storage remain valid. Keep pending,
   restricted, rejected, unchanged and stale-use semantics. Do not weaken the
   consumer or make request handles durable.
2. **Reference-backed chain.** Use this run's actual criteria, decisions and
   captures. Create current receipts through the real reference owner; bind them
   and construction outputs into capture in one host call. Never strip
   referenceUses or replay old request receipts. Cover stale/foreign/changed uses,
   preservation of completed writes and valid same-request reuse. General ID
   binding is insufficient proof. Existing owner state remains authoritative;
   do not add a second receipt store.
3. **Purpose discovery.** Replay D8 and retained purpose/name-independent cases.
   Separate strong purpose relevance from incidental schema vocabulary. Keep
   exact routes, partial-match honesty and explicit existing-field preconditions.
   Reduce candidate presentation to the information needed to choose an owner;
   do not eagerly repeat every branch's executable guidance. Full/selected
   contracts and complete inventory remain available. Measure outgoing bytes and
   verify usable selection paths, not only a byte ceiling or tool names.
4. **Selected contract delivery.** Replay D1-D11 with the actual scopes, then
   legitimate narrower scopes. Remove redundant common packaging at its assembly
   owner where equivalent execution/lifetime/recovery meaning remains available;
   preserve canonical parameter constraints, examples when useful, result paths,
   bounded pagination, cache invalidation and honest delivery. Model-selected
   unused fields are not grounds for silently omitting requested schemas. Keep
   concrete authoring and visual decision boundaries; no new planning ritual.
5. **Observation.** After slice review and relevant focused tests, run once with
   the fixed prompt and 15-minute work deadline. Ask the original AI for the
   unrestricted report on discovery, reference receipts, named reuse and reasons
   for returning control. Verify actual provider delivery, document invariance,
   persistence and retained-session status. An unfinished artwork is not a tool
   failure or a passing visual acceptance. Record unexercised routes separately.

Readiness: the existing reference decision owner already creates current receipts
and validates request/revision/purpose; host portability derives from schema.
Repair that producer rather than adding downstream exceptions. Search owns the
existing indexed metadata/corpus and retained discovery replies; do not introduce
a new cache. Whole-flow proof must include current reference uses and native media
selection, not just successful geometry application. Each slice must show its
failing oracle, focused green checks and bounded self-review before advancing.

### Follow-through implementation review

The producer now shares typed decision/use/receipt snapshots with correction
output. Request indexes and receipts are nonportable; source-input decisions
remain storable. Host registration preserves result navigation into discovery.
The original four retention cases failed before the change. Self-review found
and closed the correction-result escape using the same schema, with a failing
regression first. Real current receipt binding, recorded base construction and
whole-view capture now execute in one host submission. The older crown test is
explicitly reference-free and no longer represents reference-chain proof.

Purpose ranking no longer prioritizes all-term coverage over stronger purpose
metadata. Self-review also found automatic acquisition could still select the
sole complete but lower-ranked match; it now requires that match to be ranked
first. Permanent opaque-name cases prove both boundaries. Candidate scopes omit
repeated representation prose; exact navigation retains it. The recorded material
query returns 11,288 bytes in the bounded fixture and still exposes the existing
field prerequisite. It does not turn material revision into gradient conversion.

Selected-contract review found canonical schema factoring and narrow selection
already available. The same recorded broad draft selection remains complete:
32,615 bytes in two responses. A caller-selected narrower scope accepts the actual
base arguments with the same retention/results/recovery: 20,997 bytes in one
response. No additional blanket schema omission or invented limit is warranted.
The selected-representation regression now requests optional author fields that
its fixture actually uses; the previous test incorrectly assumed they were
implicitly selected. An older candidate-menu test now follows the explicit exact
route before expecting complete representation instructions.

Focused validation: 114 discovery/reference cases passed, followed by five
selected discovery rechecks including the new automatic-selection regression;
two construction/capture cases and two execution-flow cases passed. The recorder's
12 contract cases passed. Server type checking, scoped lint and naming gates are
required before observation. No full-local, release or publication checks run.
One final 15-minute drawing will use the unchanged prompt; the report includes
receipt handoffs, unused query selections and actual stage transfer causes.
Freeze source files through drawing and unlimited reporting, then preserve the
original report session for user questions.

## Third-run delivery review and four-slice correction

November 8, 2026 - the user authorized four ordered corrections, focused
regressions using attempt 3, and one final fixed-prompt fifteen-minute observation.
The user then required another complete handoff review before implementation.
This section records that preimplementation review and supersedes the delivery
work order below; completed recovery work remains complete. Implementation authorized. The compose slice first demonstrated the two obsolete
controls being silently accepted in the recorded E5 request; selected/status
retention controls passed. The original report session was
checked and remains waiting, not generating a report.

Evidence: `taipei-101-fixed-1794114896420`, request
`8022bce0-16d3-4e31-b0a6-62732377cbff`, native thread
`01a1b994-db52-7753-858c-220e818babbb`. Payload numbers below identify that request's
immutable provider records. Preserve the report and original requests. Some
recorded instruction prose is redacted; compare retained structured contracts
and current generators without claiming the redacted text was model-visible.

### Findings that change the implementation design

| Finding                                                                  | Evidence and consequence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retention is not the only reason E2 omitted images                       | Payload 71 imports images first, then records facts and calculations, with `response:full` and `retain`. Payload 84 contains only status. The sequence planner also defaults its output to the last step, so removing retention alone would still not select the earlier images. Intermediate-step delivery must be explicit and survive composition; do not automatically echo every intermediate result.                                                                                                                                                       |
| E5 requested both storage and output                                     | Payload 131 explicitly selects the reference-decision step with `output` and saves `/referenceDecisions`; payload 140 returns only `saved` and `toolOutcome`. Host selection computes the recipe output but replaces the external reply with `resultDelivery.finish`. Publish one external delivery decision and independent storage semantics, rather than another precedence exception. Runtime recipe output remains a separate internal computation contract.                                                                                                |
| Narrowing only the native invocation schema would miss earlier admission | `local-tool-host.register` publishes static owner schemas into Runtime; `prepare` calls `library.admitInline` before native invocation. Selected model paths are checked again against the registered model schema. The importer currently publishes a singular/plural union. Prefer one canonical reference-result envelope across input forms, success and source-local recovery; do not implement a leaf-only schema fix or relax all optional-path validation. Verify every consumer before replacing that result contract.                                  |
| Acquisition incorrectly advances delivery state                          | `local-reference-tools.projectDelivery` adds an attachment to `deliveredImages` before host selection, media encoding and provider protocol write. E2 returned no images; E4 reused cached bytes and delivered two images. Storage, metadata selection, failed encoding and cancelled writes must not count as image delivery. Transport submission still does not prove the model inspected or retained an image.                                                                                                                                               |
| Completion telemetry precedes transport submission                       | `local-ai-provider` records `tool_completed.imageCount` when content items are constructed, before its continuation checks stop state and calls `writeProtocol`. That count alone is not proof of submission. A successful stream write is also not proof of model perception. Compare constructed content, transport submission and available native echoes separately; do not move the same ambiguous flag one function later and call the lifecycle fixed.                                                                                                    |
| Current media provenance does not cover every result route               | Selected live fields carry a `LocalToolImage` side channel. `readNamedFields` returns plain JSON without it; ordinary `output` projection has a separate path. `localToolImages` intentionally scans canonical receipts, not arbitrary `fields` or authored objects. Confirm saved/selected media behavior with a failing regression before changing it; never fix this by recursively treating arbitrary image-shaped data as trusted media. This was not the cause of E9, which read metadata and shape, not pixels.                                           |
| Persistent names and request image handles have different lifetimes      | Browser conversation results survive request boundaries, but imported attachments live in request-owned image tools. `attachmentIndex` is currently a plain count in the import schema, and `retainReference` writes diagnostic assets, not App conversation attachments. A stable content identity or saved number is not a live image capability in the next request. Preserve portable source metadata; establish explicit availability/lifetime for media before allowing stored results to imply redisplay. Do not create an unrelated durable image cache. |
| Mapping navigation needs structure, not the complete value               | E9 (266/267) reads 2,338 bytes of reference decisions and approximately 395 bytes of two mapping shapes. Selected construction usage advertises `/createdTargets` but omits its nested `keyToId` structure. The complete owner schema has it. Publish the minimum canonical structure, including multiple compositions, rather than assuming `/0` always identifies every part or treating shape discovery as misuse.                                                                                                                                            |
| Capture uses subtree membership before regional cropping                 | E10 (271) selects the correct IDs for `base-y`, `bamboo-3-south` and `crown-taper-y`; their window elements are siblings. Render extracts only the selected object subtree. E12 (331) selects the owning groups and regions. Preserve that behavior. Selected capture usage must retain target membership and target-local coordinate semantics, not only image-size limits. No automatic regrouping, target promotion or visual approval.                                                                                                                       |
| Existing tests stop short of the failed handoffs                         | Reference tests call the import owner and media encoder directly; one test calls the importer twice before encoding either result, yet expects the second result to omit images. Host image tests cover direct/selected/full/status routes, but not this importer state transition or later saved-result reads. Add a connected oracle; do not preserve an incorrect call-count-as-delivery expectation.                                                                                                                                                         |

The source-confirmed path gaps above do not all constitute observed failures in
attempt 3. In particular, saved-image redisplay, successor-request handle reuse,
transport failure after selection and multi-composition navigation require formal
boundary cases. Do not report them as events that occurred in this drawing.
Unused saved values, legitimate shape queries and new visual decisions remain
valid behavior. The run used six saved names through 32 named bindings; storage
adoption did not fail generally.

### Ordered implementation and review

Frozen scope: App composition/admission, result storage and delivery, reference
acquisition/media egress, selected construction/capture contracts, their direct
provider consumers, focused permanent tests, API/spec/Inspector documentation.
Inspect Runtime admission as a consumer; do not add a second dynamic schema
system when a canonical owner result can satisfy the existing registry. Preserve
prior worktree changes. No model or drawing-prompt changes, dependencies,
release work, remote operations, mandatory saved-value consumption, new visual
planner, image resizing, automatic repair or expanded persistence product.

1. **Unify external result delivery independently of storage.** Execution card:
   compose owns `local-design-sequence`, `local-tool-host` and their direct
   tests. Public `output`/`response` are removed without compatibility aliases;
   `delivery` and `retain` keep their existing names and lifetimes. Gate: recorded
   E5 obsolete controls reject before dispatch; selected/status saves preserve
   the same decisions; existing stage and failure-prefix tests pass. Compose owns the
   model-facing decision; Runtime owns internal recipe outputs; canvas batching
   owns compact/full mutation receipts. Resolve public `output`, `delivery` and
   `response` overlap across native wrapper, ready batch, dependency sequence and
   staged paths together. Remove misleading public controls rather than adding
   silent translation precedence. Explicit selected outputs must not disappear
   when retention is added. Status-only requests must stay small. Earlier-step
   selection must work without changing execution order. Retain successful
   prefixes, settlement and diagnostics on partial failure; do not replay them.
   First reproduce E5 and E2 with their original controls, then test the current
   corrected contract, including rejected superseded combinations before effects.
   Review all direct consumers and focused tests before advancing.
2. **Align reference results and native media delivery end to end.** Execution
   card: reference acquisition owns the normalized envelope and request lifetime;
   host selection and native content/provider submission own media delivery.
   Keep `references`/`actionResults` identities, remove importer `refresh` and its
   invocation-count display state. Verify actual E2 status then display, E3
   metadata selection, singular parity, request-handle save rejection, existing
   partial-source recovery, media provenance and actual native submission.
   Reference
   acquisition owns bytes, source outcomes and stable content identities. The
   outer delivery boundary owns image selection and transport submission state.
   Prefer removing acquisition-owned "already shown" suppression: an explicit
   image selection should deliver cached pixels, while status/metadata selection
   should not. Keep within-reply pixel deduplication and acquisition reuse.
   Do not add a model-visibility registry or equate cache hits with prior display;
   retire `refresh` if its only remaining purpose duplicates explicit delivery.
   Replace the singular/plural result ambiguity at the owner and update discovery,
   static Runtime registration, selectors, projection, recovery and provider
   consumers together. Text metadata must not stand in for image content. Replay
   E2-E4 through actual host and native content construction, including an image
   step followed by nonimage steps. Verify status/metadata first, later display,
   explicit redisplay, partial source failure, encoding failure and cancellation;
   assert download/admission counts and successful-prefix preservation. Cover
   trusted media provenance through aliases and any supported named read. Keep
   authored data inert. Verify the request lifetime of saved image selectors;
   missing/stale availability must be explicit without silently changing assets
   or reexecuting mutations. Do not enlarge storage or add a cross-request image
   cache to make a test pass. Review before advancing.
3. **Publish the minimum reusable target structure.** Execution card: compose owns workflow discovery and canonical output projection; storage owns selector evaluation. Gate: recorded construction query exposes a validating minimal schema, with escaped-key and successor-request consumers. Construction owns
   `createdTargets`; selected discovery must derive its usable structure from that
   owner rather than maintaining a second handwritten output contract. Preserve
   source keys, multiple composition entries and current-document validation.
   Replay E9 and subsequent named bindings: known paths flow into consumers with
   no model value-fetch call; unknown structure still supports bounded shape
   discovery. Test multiple parts and escaped keys, missing/deleted targets and
   document change. Do not echo full mappings or require unused saves to be read.
   Review before advancing.
4. **Preserve capture semantics through discovery and execution.** Execution card: inspection owns target membership and coordinate semantics; review usage derives its description. No renderer semantics change. Gate: recorded selected query plus actual App pixel membership and unchanged document digest. The inspection
   owner defines target subtree and local-region coordinates; selected review
   usage and direct inspection must expose the same meaning. Use E10/E12 target
   keys and hierarchy in permanent regressions. Prove leaf capture excludes
   siblings and group-region capture includes the intended descendants, while
   valid single-element detail stays supported. Preserve native pixel limits,
   workspace overview rules, evidence dependencies, existing visual decision
   boundaries and no document mutation. A changed target must use its own local
   coordinates, not inherit the previous leaf's region blindly. Review actual
   selected provider contract and returned coverage, then the bounded integrated
   chain from construction to named target to capture to delivery.
   Existing review integration tests substitute the pixel renderer; add a focused
   actual-renderer membership oracle rather than treating those mocks as proof
   that sibling windows appear in the captured image.

For each slice, first demonstrate the relevant failure or contract mismatch in
formal focused tests; update the matching current specification and Inspector
owner/handoff, review the implementation and regressions, and iterate before the
next slice. Existing accepted status-only, source-recovery, failure-image,
no-replay and request-isolation cases remain required. No full local suite.
Measure exact outgoing content/media and work counts, not model comprehension or
elapsed drawing time as a substitute for correctness.

### Current focused evidence

Slice 1: the two recorded obsolete-control tests failed before implementation;
selected/status saves already worked and remain protected. The 48 host tests,
four recorded delivery tests, four selected stage tests and nine prefix/phase
cases passed. The iteration test now uses final `delivery.fields`, preserving
its actual repair/decision outcomes instead of the removed output control.
Naming and scoped lint passed.

Slice 2: three connected regressions first failed (cached image hidden, static
`/references` rejected, singular result mismatch). All seven recorded delivery
cases now pass, along with 26 reference-owner cases. Existing source-local and
unknown-admission outcomes are preserved. Two native provider cases first lacked
submission evidence and now distinguish the failed content response from the
corrected image response. Reference tests no longer equate a previous owner call
with image delivery. Scope review preserves within-reply deduplication and raw
source bytes; no cross-request image cache or new display-state registry exists.

Slice 3: recorded selected usage now publishes the minimal canonical mapping
schema, including its local type references. Positive and negative schema values,
multiple composition entries, escaped keys and five storage cases passed. Three
recorded successor-host cases passed, including construction followed by capture
and saved body geometry without model readback. The crown test's obsolete public
response control was removed; its cross-request target assertion remains intact.

Slice 4: selected capture usage first failed the missing membership contract.
It now shares the inspection owner's description. One real App E2E checks all
three recorded leaf-key roles against sibling window pixels: leaf captures are
red, owning-group local crops contain blue windows. The document digest remains
unchanged; the App screenshot was inspected. This proves membership, not the
quality of a generated building. The initial E2E used the wrong image envelope
path; correcting the test to canonical image.dataUrl made the pixel oracle pass.
The renderer required no production change.

Media follow-through: eight connected delivery cases, 27 reference cases and 21
media cases passed (three opt-in native-model cases skipped); the focused formal
reference recovery proof passed with the canonical envelope. Cancelled delivery
and invalid media encoding leave cached source images redisplayable without new
download/admission. The retired refresh control rejects before source effects.
Provider submission cases passed; server typecheck, naming and scoped lint passed
with existing console warnings. The final observation is recorded below.

### Final observation

Completed one authorized observation: `taipei-101-fixed-1794130103950`.
All four correction slices and focused gates are complete. The work deadline,
not a tool failure, stopped drawing; final artwork acceptance remained incomplete.
The original thread completed its unlimited report in approximately 6m47s and
remains waiting for questions. Persistence and reload equality passed. No agent
files were edited while the report was generated. See the
[observation and handoff assessment](../reports/delivery-handoff-observation-2026-11-08.md)
for exact calls, retained values, limitations and the complete original report.
No broader plan closeout or further product changes are implied.

After the four slices pass, run the unchanged canonical prompt once with a
fifteen-minute drawing ceiling. This is one new authorized start, not a renewal
of an earlier multi-attempt allowance. Use existing fit-to-content recording,
durable reload evidence and source identity capture. Correctable authored inputs
may be repaired within the same drawing turn; genuine App/data/delivery failures
retain the reviewed stop policy. The original native thread writes an unlimited
report, then remains available for questions. No file modifications while it
generates the report or follow-ups.

The report must distinguish successful acquisition from actual image delivery,
explain any redisplay, identify each saved-value read versus direct named binding,
and explain capture target/region choices and necessary model decisions. Preserve
the original report verbatim and compare its claims with provider evidence. A
successful live run alone cannot prove routes the agent did not exercise; focused
regressions remain the oracle for those boundaries.

## Evidence and confidence

Baseline: `taipei-101-fixed-1794062501433`, native thread
`01a1b675-627b-7e80-9092-3c5d73cf89be`.
The original fifteen-minute drawing window ended at its deadline. The original
thread completed its unlimited report; artwork acceptance remained incomplete.
See the [five-run report](../reports/discovery-stage-continuity-2026-11-07.md)
and [unaltered original AI report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794062501433/self-report.txt).
Provider evidence lives in that run's `provider-records/` under request
`ae612868-df3f-49ee-93b1-04cf59648be6`; numbered payloads below refer to its
`.payloads/` directory. Preserve those records rather than rewriting conclusions
into original AI output.

| Finding                                                                 | Evidence and classification                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The original agent cannot be questioned after cleanup                   | Confirmed lifecycle gap. `local-ai-provider.ts` starts an ephemeral thread and kills its child in cleanup; the live runner closes browser/services. Original work/report used the same thread, but the completed thread is no longer available. A new agent reading logs is not its continuation.                                                              |
| Selected contracts still require substantial reading                    | Confirmed delivery cost, not a proven latency cause. Payloads 53/56 deliver 23,709 content bytes of construction usage; 62/65 deliver 32,838 bytes for six record/review capabilities. Construction parameters alone occupy 17,523 bytes with 28 shared definitions. Pages split JSON structures.                                                              |
| Some acquisition was broader than execution                             | Confirmed agent choice. Initial vector scope, later vector-pattern, standalone fact recording and checks reading were not executed. Later editing/review contracts were partly unused when the deadline arrived; non-use does not prove they were pointless.                                                                                                   |
| Preparation was not manual enumeration of thousands of windows          | Confirmed. Payloads 135, 192 and 290 contain four drafts totaling 28,060 bytes, expanded into 15,910 elements. They use surface grids, patterns and motif overrides. Face coordinates, proportions, materials and ornament representation still require authoring decisions.                                                                                   |
| Reference information has limits                                        | Confirmed asset limits: a 520 by 710 dusk whole-tower image and a 959 by 497 ornament close-up. The agent restricted their uses and estimated missing dimensions. Images cannot supply exact unseen geometry; no evidence establishes that image payload volume caused the delay.                                                                              |
| The long preparation gap has no measured single cause                   | Unresolved. Between reference delivery near 113 seconds and the next App call near 519 seconds, native research events occur around 424-447 seconds. The AI describes contract reading, reference interpretation and geometry authoring. Neither the trace nor its report separates inference, scheduling, authoring and network costs.                        |
| Ten saves do not imply ten missed reuse opportunities                   | Confirmed adoption distinction. Four drafts were saved for future editing, which never executed. Criteria revision, two reference-use receipts and base/crown IDs were manually supplied later rather than consumed through named bindings. No attempted named binding was rejected.                                                                           |
| Import required avoidable delivery recovery                             | Confirmed sequence: E1 selects conditional `/references` and rejects before execution; E2 removes delivery, adds `response:full`, and retains criteria, returning status without images; E3 refreshes cached assets and returns the whole import result with two images. Payloads 76/77, 81/94 and 98/107 preserve this sequence.                              |
| Output controls expose different layers as if they were interchangeable | Confirmed contract friction. Host `response` controls grouped canvas receipts, not native-result/media delivery. Retention activates selected/status delivery. Import describes directly accompanying images, but batch import places image actions beside `/references`, under `/actionResults`. Allowing `/references` alone would not deliver those pixels. |
| Knowledge is already cached within a request                            | Confirmed. `local-knowledge.ts` lazily loads 11 package and 11 App Markdown files once into memory, currently 87,949 bytes. Even discovery initializes the whole catalog; only selected data reaches the model. A fresh request reloads when Knowledge is first used. Fifth-run Knowledge calls were zero, so this loader cannot explain that run's delay.     |
| Repeated backend work and repeated model delivery differ                | Confirmed. Discovery retains results by query/registry revision and reuses metadata/index work. Knowledge retains resolved responses, but ordinary repeated reads return text again. `reuseFrom`, `fromResult` and named values already exist. A cache hit alone does not remove an AI call or its response tokens.                                            |
| The report may lack native successful-prefix evidence                   | Confirmed evidence gap from the preceding third/fourth runs: the supplement selects canvas `actionResults`, omitting some native preparation/import results. Raw provider evidence retains them. Separately, native web bodies are `upstream-not-exposed`; this does not independently prove the AI received blank results.                                    |

The initial App-owned instruction blocks total about 23.1 KB; eager declarations
add about 16.3 KB. The entire registered catalog is not necessarily model-visible.
The 56.5 KB selected content is included in the final 138.6 KB discovery reply
measurement; do not add it twice. Bytes, tokens, cached provider input and total
task usage are distinct measurements. Report actual model-token counts only when
available; do not convert serialized JSON bytes into claimed measured tokens.

## Existing contracts and replacement boundaries

The current authorities remain
[AI execution flow](../specs/ai-execution-flow.md),
[API surfaces](../API_SURFACES.md),
[Runtime Knowledge contract](../../../framework/packages/ai-agent-runtime.md),
and the [execution Inspector](../../../../../tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs).
Before production implementation, update their affected owner steps, executable
cases and bounded DoD together. This plan is not an admission or passing result.

| Current contract                                                                                                    | Planned treatment                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary requests receive fresh provider/Knowledge context; Inspector request step forbids native-thread continuity | Preserve ordinary requests. Add explicit evaluation-owned report/question lifecycle at the compose/provider boundary; do not turn the request adapter into a global session or credential cache.                                                                                                               |
| Fixed evaluation uses one App request, two native turns, terminal report receipt and automatic cleanup              | Replace the evaluation-only assumption that the first report ends the session. Seal drawing/report evidence, publish a waiting session, accept additional report-only turns, and close on explicit user completion. Update collector and shutdown consumers together.                                          |
| Full/selected usage preserves complete constraints; information delivery splits byte-contiguous JSON                | Keep canonical validation and complete selected constraints. Change acquisition to meaningful tool/branch units with required reference definitions. Do not label a truncated or unresolved contract executable. Review generic large-result paging separately from contract paging.                           |
| `retain`, `output`, `delivery` and batch `response` have overlapping visible controls                               | Define one model-facing delivery decision with explicit values/media/status behavior. Keep storage selection independent. Retire unsupported or misleading combinations and update schema, examples, admission, dispatch and egress together; do not retain a silently ignored legacy option.                  |
| Import success schema combines singular and plural results, with media in a sibling envelope                        | Replace with a canonical owner result shared by input forms, static Runtime admission, selected delivery and source-local recovery. Invocation-only narrowing is insufficient. Publish media semantics independently of accidental JSON nesting; preserve failed-source outcomes and optional-path validation. |
| Knowledge reader promises metadata-only discovery; App loader first reads all bodies                                | Distinguish model-visible discovery from backend initialization in docs. Profile startup/read/parse work before choosing shared immutable catalog reuse or metadata-first loading. Runtime access/session delivery state remains its current owner.                                                            |
| Request query caches and Knowledge delivery keys expire with their owners                                           | Preserve expiry and explicit recovery. Reusing immutable definitions across requests must not share permission decisions, request handles or model-context acknowledgements. Cache keys need authoritative source/registry validity, not only a label or TTL.                                                  |
| Authored templates, creation maps and conversation values already exist                                             | Reuse them. Do not equate source keys with current element identity, saved drafts with SceneTree shared instances, or saved names with proof of model consumption.                                                                                                                                             |

## Ordered implementation slices

The following five slices describe the preceding implementation checkpoint.
Current delivery corrections follow **Third-run delivery review and four-slice
correction** above; these historical slice numbers do not add another work order.

Approved revision - November 8, 2026. Associate this work with this section and
existing `staged-design-execution-plan.md`; the current worktree source and its
uncommitted predecessor work are the implementation baseline. No rebase, cleanup
of unrelated edits, push, release checks or full local test is part of this task.

The executable phase plan is the existing `execute_design.operations` or `stages`
input, not a second prose plan store. Review `plan` continues to own requirements
and acceptance. Conversation results own portable saved inputs/results. Host
execution owns dependency order and mechanical iteration; the agent owns new
visual decisions. No create/approve/run-plan API, mandatory planning round,
automatic next-action inference or forced consumption of saved values is added.

### 1. Preserve recoverable outcomes and canonical images through delivery

Owner/flow: compose (`local-tool-host.ts`, `local-tool-media.ts`) and inspect
(`local-design-review.ts`); their direct invocation/provider consumers.
Input evidence: E10's actual repeated check declarations and E8's successful
prefix recovery from `taipei-101-fixed-1794072813674`.

First prove failing permanent regressions. Runtime recovery registration and
model-stage projection must share the common invocation-failure alternative,
including nested sequence recovery. Preserve the original correct_input error,
settlement, completed prefix and no-replay boundary. Canonical images inside a
failure execution envelope must follow the same native media path as successful
receipts without traversing arbitrary authored data. Selected capture usage must
expose the existing same-check metadata consistency rule; rejection identifies
both conflicting inspections and fields before any capture.

DoD: direct and composed review rejection remain deliverable; status/selected
recovery retains successful prefixes; failure images are native content with no
Base64 text leak; ordinary success and malformed-output rejection remain intact.

### 2. Execute decided construction and acquisition as one dependency chain

Owner/flow: compose, with unchanged prepare/apply/inspect authorities.
Use E6 crown/ornaments and E7's actual targets/checks. Append capture to the same
host submission, binding the new crown ID from its producer and consuming existing
root/body identities. Exercise the formal host, selected owner contracts and
actual downstream arguments. Preserve the return to the agent after images.
Use operations for an ordinary chain; stages only when preparation, mechanical
iteration and progressive application are actually needed. Existing correct
execution paths need no new wrapper. Publish complete owner-valid composition
examples through existing usage rather than adding a duplicate instruction block.

DoD: one submission reaches construction then capture; dependency failure stops
unstarted work, successful writes are not replayed, and capture cannot record a
visual pass. Existing repair-to-sort and stage ordering continue to pass.

### 3. Consume saved author inputs across stages and turns

Owner/flow: compose; existing conversation result store, named resolution and
workflow inputs. Use E3 bodySource and E9 details. Replace only the identical
projection, two face boundaries, origin and axes with named selections. New
mullion/shadow geometry stays authored. Verify source/result equivalence and
actual App context reads without an intermediate model value-fetch call.

Cross-turn cases use the existing bounded saved-name/shape projection. Prove
known-path consumption, unknown-path navigation, isolation after document change,
and explicit missing/stale selection. Only repair a demonstrated navigation gap
at the current owner; do not echo full drafts, create another registry or promise
reload durability. Request-owned evidence cannot become portable authority.

DoD: same and successor requests consume saved fields correctly; only selected
values cross the App boundary; unchanged source fields are not re-authored;
saving without a later consumer remains valid. Existing live target validation
and snapshot semantics remain unchanged.

### 4. Deliver focused, consistent contracts for execution and reuse

Owner/flow: compose; registered selected-usage projection, construction schemas,
result/media controls and existing App instructions. Replay D1's actual scoped
construction query. Remove irrelevant selected branches only through canonical
owner scope, preserve the complete used constraints and valid examples, and
measure delivered bytes plus acquisition calls. Keep full lookup available.

Review host response/output/delivery semantics together with source/result
selection and image delivery. Correct misleading combinations or descriptions
at their owners instead of adding a new competing control. Binding examples must
show a real consumer, not only successful saving. Requirements, ordering, media
and recovery must agree across prompt, selected usage, schemas and execution.
No arbitrary KB cap, hidden simplification or second validator.

DoD: valid real inputs retain their behavior, invalid inputs still reject,
selected guides remain executable, and examples run through formal owners.
Knowledge/cache work stays deferred unless this bounded evidence demonstrates a
necessary defect; no Knowledge calls occurred in the observation.

### 5. Verify submitted dependencies, actual execution and agent return reasons

Owner/flow: compose and current formal/live evidence consumers. Reuse step IDs,
stage outcomes, saved acknowledgements and provider records; no parallel workflow
ledger. Distinguish not submitted, pending, failed and completed work. Prove A to B
when B needs only A's output, a genuine image decision boundary, and failed-prefix
recovery without a substituted action or replay.

After focused tests and bounded review pass, run the unchanged canonical prompt
once with a fifteen-minute drawing ceiling. The original native thread writes
an unlimited report explaining actual saved-value consumers, combined/split
operations, and each necessary return to the model. Separate host correctness
from model adoption. Keep the report session available afterward. Do not edit any
files while the App AI generates its report or follow-ups. No automatic retry.

DoD: source/contract-bound focused evidence plus complete drawing/report/evidence
outcomes, exact prompt verification, same-thread identity, unchanged reporting
canvas and retained waiting session. A failed or timed-out drawing stays a failed
or incomplete observation; a completed report does not approve the artwork.

## Design review and accepted behavior

The compose owner can bind native workflows and review operations already;
conversation storage already resolves deep named fields. The recorded E9 reuse succeeds through the existing owner. The new E6 capture
regression exposed an App-to-Runtime schema projection defect: discovery-only
operation annotations reached binding admission as opaque constraints. After
removing that discovery-only annotation, the same regression exposed a second
contract defect: the capture element target omitted the document-reference
annotation already present on the producer ID. Both owner corrections now allow
construction followed by capture in one submission. This specific missing
composition cannot be classified solely as an adoption choice. The reviewed
handoffs retain existing authority: prepared values feed application, actual
created IDs feed acquisition, rendered evidence returns to the agent, and
portable source snapshots feed later preparation. No dependency crosses an
unavailable visual decision or an expired request credential.

Existing permanent coverage includes request-review-recovery, selected-prefix-
recovery, created-targets integration, result-delivery and review-usage tests.
Extend these or add a focused recorded-continuity test with exact retained inputs.
For each slice: re-read its Inspector owner, demonstrate any defect first, implement
inside that boundary, review direct consumers and run the named focused gates.
Reuse existing identifiers; new internal helpers remain host/media/usage-owned,
with no persisted identity migration. Naming gates precede and follow code edits.

## Implementation checkpoint before the final observation

Slices 1-4 have focused regressions and owner corrections. The recorded
construction/capture chain completes two real applications and three captures
in one host submission; capture returns evidence without approving the drawing.
The recorded source-to-detail chain consumes five fields from one App exchange
across successor hosts; this reuse passed before changing production resolution.
Unknown-path navigation now has an optional bounded subtree shape read through
the existing result route. Known-path consumers remain direct.

The selected construction scope omits explicitly unselected layout, relations
and shared-fill groups while retaining canonical full input and valid examples.
Its measured parameter payload is 19,369 bytes versus 20,576 with these groups;
this is a modest schema reduction, not a latency claim. The earlier acceptance of multiple result selectors was incorrect and is
withdrawn by Single result delivery contract. Delivery is the sole public selector;
canonical owner output remains available to binding and retention. No new output mode or automatic image approval was introduced.

Confirmed failures were reproduced before corrections: model recovery projection,
native failure image delivery, located check conflicts, composed capture admission,
and ignored shape-only navigation. Focused tests also exposed an example excluded
by the narrower scope; the owner now publishes a valid positioned primitive example.
The contract requires identical check metadata within one capture call; it does
not invent supersession, reference authority or subsequent visual decisions.

The existing source proof covers request-only composition, named navigation,
review continuation and retained report ownership. Real recorded chain tests
exercise formal host and App owners separately. Scoped server/proof type checks,
changed-owner lint, naming and the fixed-runner contract are the preflight gates.
Large preexisting integration test files remain Vitest-covered; adding them to
the proof TypeScript include exposed older fixture typing gaps and was reverted,
without suppressing errors or expanding this task into unrelated fixture rewrites.

## Verification and remaining decisions

Implementation proceeds one owner slice at a time, with failing permanent
regressions for confirmed defects, focused tests and bounded self-review before
advancing. Update current spec/API/Inspector and direct consumer tests in the
same slice; remove superseded rules rather than adding contradictory advice.
Retain accepted geometry, validation, cancellation, partial-success and no-replay
behavior. No full local test or release gate belongs to this task.

Focused coverage belongs in the existing provider/evaluation/recorder tests,
discovery and information-delivery integrations, host/media/result-delivery tests,
`local-knowledge.test.ts`, Runtime `knowledge.test.ts`, created-target/context
integrations and the affected execution-flow proof cases. Select exact cases for
each changed owner; scoped type/lint/naming checks accompany implementation.

The user explicitly authorized one final fifteen-minute live run after the revised
slices pass, with the original prompt, unlimited same-thread report and retained
session. The earlier baseline is complete; do not repeat it or inherit a retry
allowance. Preserve final/reload images, editable source, durable receipt and
fit-to-content recording. Test failure does not authorize coaching or a rerun.

Compare contract acquisition, valid first submissions, selected text/media,
value-only forwarding, backend work counts, saves/actual consumers and reasons
for returning to the model. Do not compare differently detailed drawings by
elapsed duration or infer latency from bytes. Existing failed runs remain evidence.

Open verification questions: which exact contract passages impeded the agent;
whether source text was available to it; supported native restart/resume behavior;
whether cross-request catalog work is material; and the measured call/byte tradeoff
of semantic contract delivery. These are explicit design/measurement gates, not
established defects or excuses to add more prompt instructions.

## Research context

Public examples support demand-driven acquisition, not a universal prompt budget:

- <a href="https://github.com/cloudflare/mcp/blob/main/README.md" target="_blank" rel="noopener noreferrer">Cloudflare MCP</a>
  reports about 1,100 tokens for three entry tools, not total task context.
- <a href="https://www.anthropic.com/research/advanced-tool-use" target="_blank" rel="noopener noreferrer">Anthropic advanced tool use</a>
  illustrates about 500 initial search-tool tokens and about 3,000 tokens for
  selected tools. Its example is not a general App system-prompt measurement.
- <a href="https://cursor.com/blog/dynamic-context-discovery" target="_blank" rel="noopener noreferrer">Cursor dynamic context discovery</a>
  reports a 46.9% reduction in total agent tokens for MCP-using runs, not a fixed
  prompt size.
- <a href="https://tldraw.dev/starter-kits/agent" target="_blank" rel="noopener noreferrer">tldraw Agent Starter Kit</a>
  uses viewport shape detail, outside-view clusters and mode-specific context.
  Its documentation does not establish a universal token budget.
- <a href="https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools" target="_blank" rel="noopener noreferrer">Vercel's SQL agent case</a>
  reports roughly 102K to 61K average task tokens over five queries, not initial
  prompt size. <a href="https://www.figma.com/blog/agent-custom-tools-context-skills/" target="_blank" rel="noopener noreferrer">The reviewed Figma article</a>
  does not disclose internal prompt size. Do not invent a comparable KB figure.

## Documentation review

The design distinguishes observed defects, agent choices, existing capabilities
and unresolved hypotheses. Evaluation retention does not change ordinary request
authority; shared source caching does not share model-delivery state; saving is
not a consumption obligation; media delivery is not inferred from metadata.
Current behavior documents remain authoritative until their implementation slice
updates them. Source, formal tests and Inspector admission are not claimed complete
by this documentation review.
Review corrected a dependency gap: asking the new original agent only after all
context changes could not inform those changes. The early observation above
addresses that gap without pretending the old ephemeral session can be resumed.
It also separates same-request reference receipts from cross-request portable
drafts and IDs, preventing session retention from becoming a lifetime bypass.

### Slice 1 execution boundary - 2026-11-08

Session handoff implemented and observed. Compose owns native report continuity; the service owns retained
sessions and local controls. The provider still releases drawing resources at
initial settlement. Changes are limited to evaluation parsing, provider/service
handoff, recorder/session commands, focused regressions and their direct contracts.
Naming preflight passed. Regression first: the initial request must return without
killing the original process, then support multiple public report turns, explicit
close, loss and denial of late tools. No discovery, storage or cache changes enter
this slice. The live observation follows focused protocol, route, collector and
source checks. Source edits stop during drawing, reports and follow-up answers.

Session handoff implementation and self-review: initial request settlement now
releases drawing resources while the service retains the original native process.
Local status/ask/close routes serialize questions and preserve public replies in
separate follow-up files, including partial output on cancellation. Loss is explicit;
closed identities release their provider closures. The fixed recorder seals video
and document evidence without stopping retained services. No restart recovery is
claimed, and Vite source changes must not destroy a session still needed for questions.

Focused validation before the observation: 49 selected session/provider/HTTP/parser
cases, 12 collector cases, two source-flow cases, server type checking and naming
passed. App and required local service builds succeeded. Scoped lint has no errors
(existing console warnings remain). An overbroad test-name selection also ran 179
provider-related cases: three unrelated tool-declaration expectations failed
(recipe/example schemas and unconditional deferred registration). Those declaration
contracts were not changed by this slice; this is not an all-provider-tests-pass
claim. Do not expand this session slice to rewrite them.

The upcoming single 15-minute observation uses the immutable drawing fixture.
Ask the maintained context follow-up only after the original untimed report ends.
Keep the original session available afterward. Contract-load, native receipt
supplement, storage/image and cache changes remain pending until the new answers
are compared with actual delivered records; no inference from old-session memories.

### Observation result and ordered next corrections

The single live attempt `taipei-101-fixed-1794072813674` stopped at 677.359 seconds
on a review-result delivery failure. Initial report and two subsequent questions
finished on the same original native thread; the first question exceeded five
minutes. The service remains waiting. Original provider evidence and persisted
content hashes remained unchanged across questions. Persistence reached 600/600.
This is a passed session-continuity observation and an incomplete artwork review.

Before changing contract presentation, the next bounded egress slice must preserve
E10's common `PREPARATION_REJECTED/not-started/correct_input` through model recovery
projection and route E8's nested failure-prefix image through native media instead
of text. Use the recorded exact inputs, preserve successful prefixes and test the
source/Runtime/model/retained paths together. The E10 input conflict remains invalid;
fixing its error delivery must not silently accept inconsistent check metadata.

Then test D1's narrower complete contract presentation, E9's identical saved-field
bindings and E6's already-decided appended capture. The agent confirmed those last
two are available abilities it did not use, not blocked operations. Keep reference
image acquisition/viewing before use selection, strict geometric validation and
optional Knowledge. Cache work still needs measurement; no Knowledge loader ran.
The remaining native receipt supplement and other slices are not marked complete.

Observation bootstrap correction: `taipei-101-fixed-1794133924121` stopped before
any provider session (107 ms, zero canvas writes). The added report questions
made the maintained report fixture exceed the production parser's 8,000-character
limit. The original drawing prompt was unchanged. A permanent production-parser
fixture test failed first, then the added report question was condensed. No
production input limit or drawing requirement was relaxed. This failed bootstrap
has no original-AI report and is retained as evidence; the intended drawing
observation must still run after the focused parser test passes.

### Follow-through observation result

Completed the intended drawing run `taipei-101-fixed-1794134061041`: 11m 09.592s,
followed by an unlimited 7m 20.215s original-thread report. Session remains waiting.
The complete report and checked evidence are indexed in
[Reference receipt and discovery](../reports/reference-receipt-and-discovery-2026-11-08.md).
Drawing/report source freeze was preserved. No additional implementation followed
the observation. Durable sequence 483 and reload match; reporting did not mutate
the drawing. The retrospective qualified the earlier visual acceptance, yielding
partial App settlement despite native drawing completion; this is not a save or
execution failure.

The observation had one correctable conditional-result selector rejection, then
continued successfully. It saved eleven names and consumed two target mappings
through three leaves. It did not use formal reference selection, so receipt-chain
adoption remains unobserved despite passing real-parameter composition proof.
Thirteen contract calls delivered 154,026 text bytes; do not claim a global reading
reduction. The implementation portion is complete, with these live limitations
explicitly retained for discussion. No full-local tests, commit or push occurred.
