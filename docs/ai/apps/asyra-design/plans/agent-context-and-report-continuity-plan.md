# Plan: Agent Context and Report Continuity

## Status and task boundary

The completed task is [Canonical input rejection and same-turn recovery](#canonical-input-rejection-and-same-turn-recovery).
Its focused validation and live observation are recorded below. This completion
does not assert that the timed drawing met every visual requirement.
The target-bound result correction below remains a prior implementation record.

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
this is a modest schema reduction, not a latency claim. Existing receipt response,
sequence output and model delivery select different layers; their reviewed paths
remain valid. No new output mode or automatic image approval was introduced.

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
