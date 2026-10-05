# Tool selection and compact receipt evaluation

Status: Data-processing, shared Fill preparation, and composed first-write plan
implemented and tested - 2026-10-05. Broad real-App API coverage exposed a separate
Pixi coordinate hit-test prerequisite, now repaired. Browser fixture readiness
now observes Core's actual frame completion; all 151 registered basic API cases
and their direct interaction regressions pass.
Matched live model comparison remains unmeasured. No remote operations.
Parent: [tool contract refactor](ai-tool-contract-refactor-plan.md).

## Bounded contract

Use ActiveSaddler's offline failure-pattern and scenario-selection concepts to
improve the existing Design harness. Do not install an optimizer or add model
calls to a user's drawing. Preserve the configured gpt-6-astra medium provider,
canonical data, request-owned review state, quality requirements and recovery.
Baseline: current codex/ai-execution-flow working tree at c6506a16, including
previous uncommitted work. Evidence: request d8b70145-757c-4403-bacb-435e4a2b7e7b
in tmp/startup-complete-first-output-20261004-210115.

Freeze discovery to the plan receipt producer/consumers, model-facing construction
contracts/examples, saved-record evaluation and their existing formal tests.
No Framework, renderer, search policy, external dependency or broad API rewrite.

## Sequence and acceptance

1. Inspect owner: acknowledge plan storage without echoing requirements, methods,
   sources or fact statements. Retain all original review/fact state and expose
   compact IDs/statuses needed for subsequent decisions. Prove no payload growth
   from longer statements, invalid input rejection, fact retrieval, partial plan
   resubmission and subsequent review behavior.
2. Compose owner: expose concise representation choices at the existing tool
   boundary, with executable examples. Distinguish existing-object batch edits,
   ordinary 2D paths, repeated 2D paths, explicit world faces, repeated world
   faces and UI layout. No subject classifier, fixed camera, required projection
   or forced detail level. Backend construction and canonical APIs remain owners.
3. Observe/evaluation: group evidence by concrete tool/failure mechanism and
   configuration, preserving affected calls and uncertainty. Provide an explicit
   small scenario curriculum with development and reserved validation cases;
   contract fixtures are not independent AI trials. Known receipt/format defects
   get deterministic regressions before spending live model calls. A recording of
   101 remains an integration example, not the only quality benchmark.

Formal checks: affected review, operation, construction, discovery, reporting and
source-bound proof suites; App typecheck/build, scoped lint, naming and Inspector
contract tests. Live evidence is supplementary and runs only while ordinary weekly
usage is available. Report any unrun model comparison as unmeasured, never passed.
No hard machine-time assertion or wall-clock promise. Final review covers this
slice and direct consumers only. Stop on ownership mismatch or exhausted ordinary
usage; preserve evidence and pending work.

## Step card - inspect / compact plan receipt

Spec: ai-execution-flow, Evidence and completion. Inspector: inspect, no new route.
Inputs: admitted phase=plan fields and request-local review/fact state. Output:
storage acknowledgement, criterion/deferred IDs and fact validity, no narrative
echo. Conditions: valid pre-mutation plan; invalid input remains rejected. Advice
bypasses drawing review. Allowed: existing review and fact owners. Forbidden:
canvas changes, independent model calls, acceptance inferred from storage.
Boundary: local-design-review.ts and design-review-stages.test.ts; direct operation
tests prove transport compatibility. No new cache or persisted identity. Failure
owner: inspect. Gate: regression fails first; retained state remains available to
facts and visual/structure review. Stop if a consumer needs removed narrative.

## Evaluation design

Hypotheses: compact acknowledgements remove known duplicated narrative without
losing review state; explicit representation choices help appropriate tool use
without forcing geometric/style choices. The first is deterministically testable;
the second requires fresh baseline/candidate model trials for a behavioral claim.
Freeze a candidate before reserved live cases. Evaluate requested result, usable
output, input rejections, redundant payloads and round trips separately from time.
Do not grade success solely by tool name or item count. Track fixed, still-failing,
regressed, still-passing and unmeasured separately; failed retries remain evidence.

## Inspect checkpoint and compose step card

The new narrative-echo regression failed before implementation. Review and
operation suites now pass 131 tests. Existing tests expecting full acknowledgement
content now inspect retained comparison state instead; explicit facts retrieval
and deferred review behavior remain covered.

Compose spec: Capability discovery and composition. Inspector: compose. Inputs:
admitted schemas and domain guidance; outputs: discoverable representation choices
and executable syntax examples. The model chooses by available data and requested
output, not by subject. Existing-object edits bypass construction. Contributors:
existing preparation definitions, shared construction schema and examples.
Forbidden: new model router, mandatory projection, inferred depth, fixed view,
quality escalation or fallback geometry. Boundary: local-design-tools.ts,
design-preparation-examples.ts and their tests; combined workflow consumes the
same definition. Failure owner compose. Gates: every advertised example passes
real admission/preparation; ordinary 2D, projected faces, repeated faces, repeated
curves and UI layout preserve semantics; existing editing tests stay green.
These fixtures prove tool contracts, not model selection accuracy.

## Step card - observe / evidence-led investigation targets

Spec: Execution evaluation; Inspector: observe. Inputs: saved records and explicit
period filters. Outputs: input-echo candidates and investigation groups retaining
tool/phase/error kind, configuration and source call/sequence evidence. Extract
observations before grouping; no root-cause inference from tool names. Missing or
truncated fields cannot prove an echo. Counts are not severity scores. Bypasses:
absent evidence remains unknown; no failures yields no investigation target.
Allowed contributors: existing read-only record projection and CLI. Forbidden:
automatic prompt changes, model calls, canvas writes, merged model/config results,
turning historical failures into current regressions without matched cases.
Boundary: local-ai-evaluation.ts, execution-report-cli.ts, their tests and app
test-data/ai-drawing/tool-selection scenario documentation. No cache. New report
fields are additive projections, not new saved runtime state. Failure owner:
observe. Gates: exact echo versus redacted/changed values, distinct tools/phases
and configurations, preserved evidence, empty results and CLI integration.

## Validation and bounded review - 2026-10-05

- 277 tests in ten focused suites passed, including review state, operation
  consumers, preparation/examples, combined workflow, reporting, source proof
  and domain prompt contracts. The final reporting adjustment passed its 25-test
  reporting/CLI subset. Two Inspector contract tests and 12 naming tests passed.
- App typecheck, scoped ESLint, frontend production build and report CLI build
  passed. The build still reports bundle-size and mixed static/dynamic import
  warnings; this slice does not alter frontend loading.
- Current-source Inspector candidate `4ae34f09-ee68-460a-8fff-5c53756f8656`
  passed `execution-owner-baseline`, captured source
  `4df32a8e32f5f23d9100d31e6cd2a778ed8e52b40c36ca8256aeb845488e10bb`.
- Reprocessing the retained baseline record detected unchanged `references`,
  `criteria` and `deferredDetails` at sequence 63, call
  `exec-ff3ccf0a-9a71-4693-91e4-02b15d5a4f27`. This verifies the diagnostic on
  real evidence; it is not a fresh model run or measured latency improvement.
  Report: `tmp/tool-selection-historical-report.json`; scoped gate logs:
  `tmp/tool-selection-*`.
- Review covered the changed producer, its operation/workflow consumers, example
  admission, report grouping and CLI. The example list now retains tuple types
  so adding examples does not erase the existing projection example's type.
  Full plan criteria/facts remain in their canonical review owner; receipt
  storage acknowledgement does not grant acceptance.
- No live baseline/candidate or new 101 recording was started. Weekly ordinary
  quota is 99% used; credit balance was unchanged. The curriculum documents
  development and reserved scenarios, but improved model tool selection and
  user-visible speed remain unmeasured. Resume those trials with ordinary quota
  before making behavioral improvement claims.

## User-authorized single live run - 2026-10-05

Observe recording contract rechecked; unchanged brief/model, headless single case,
first-visible plus ten seconds, no retries or implementation changes. Run
`a3054bb3-273d-4fa8-9bc8-5fa5bab36257` passed. First pixels 107.078 s
versus prior 133.349 s, with 19 versus 37 initial elements; no equal-quality
speed claim. Compact receipt confirmed (3143-byte plan, 253-byte response),
but the model still emitted explicit vectors and refreshed the same references.
No tool/input/browser failure. Analysis, command, records, document, screenshots
and video: `tmp/tool-selection-first-output-20261005-115945`. This integration
run does not replace reserved baseline/candidate model comparisons. Weekly
meter reached 100%; owned services closed and .env restored. Work converged.

## Quota-restored repeated observation - 2026-10-05

User requested one more test. Observe recording contract rechecked; same
headless case, brief and gpt-6-astra medium, no retries or product changes.
Run `d8e7cc11-85e8-417c-a3a0-65d76490629e` passed first-output assertions.
First pixels 122.470 s, 39 elements, cancelled after the 10-second window.
One plan admission failed because four criteria omitted verification; the
corrected call succeeded. Plan receipt 2377 to 258 bytes. Native research opened
a structural PDF after the search; no repeated reference import. Explicit
vectors remain the selected representation. Different initial batches prevent
an equivalent-quality speed comparison. App screenshot inspected; partial
geometry has protruding strips and is not a completed-artwork pass. Evidence:
`tmp/tool-selection-repeat-first-output-20261005-134439/analysis.md`.
All owned service ports closed and .env restored; no push.

## Approved priorities and plan-stage assessment - 2026-10-05

User additions: data-processing failures take first priority; the App prompt must
advertise shared element/property capabilities without requiring discovery first;
evaluate whether a separate plan stage is necessary. This section updates the
existing plan, not current runtime or Inspector behavior. Discovery is bounded to
the latest rejected plan, actual advertised schemas, preparation/compiler, shared
property public consumers, prompt and review/settlement dependencies. Do not add
another full drawing run merely to rediscover a known deterministic contract gap.

### 1. Data contracts and processing first

Evidence: the latest plan omitted verification on four visual criteria. The App
prompt lists requirement and description for each criterion, whereas the actual
schema requires requirement, description and verification. Tool-level guidance
does mention verification. This is an incomplete duplicated contract in our own
instructions, not evidence that the model never received the required schema.
Its contribution to the failure is plausible, not separately measured.

The selected preparation route also accepts only inline color/gradient fill
values and creates distinct Fill records per element. Existing public fill-link
and detach operations prove canonical sharing already has an owner. Repeated fill
data in this route is therefore an API expressiveness gap, not solely poor model
choice. The latest draft had 38 vectors, 168 vertices and five distinct inline
fills; native pattern/projection use is separately unproven.

Implementation acceptance, before further prompt tuning:

- One authoritative input contract drives model-visible requirements and actual
  admission. A failing formal regression must capture the prompt/schema mismatch.
- Preparation must support explicit canonical shared-property identity through
  the existing public creation/linking owners. Resolve the precise wire contract
  against those owners before naming new fields. Do not invent IDs, redefine an
  existing record under the same ID, or implicitly share merely equal values.
- Test shared and independent fills, new and existing targets, linked updates,
  detach, plural edits, invalid/missing references and undo/redo; prove the same
  references survive canonical application and persistence. Input accepts only
  new values, never old snapshots supplied by the model.
- Preserve compact retained results and correctable failures. Verify actual
  request/response shapes through the advertised tool to its App consumer, not
  just individual helper outputs. Confirm repeatable geometry can use existing
  backend expansion without forcing it on irregular artwork or ordinary edits.

### 2. App prompt communicates stable capabilities

Tell the model up front that the App supports shared elements and shared property
components, what linked edits mean, and how independent variants differ. A Group
does not imply a shared instance. Use authoritative IDs/reference semantics; do
not equate duplicate IDs with sharing. State existing-versus-new construction
capabilities accurately, adding the preparation path only when it is implemented.
Keep a short capability overview in the prompt; retrieve detailed signatures only
for unknown operations. Do not copy a complete tool catalog into the prompt.
Add coverage for actual prompt content and complete usable shared-operation paths.

### 3. Evaluate the separate plan gate

Current useful data: stable requested criteria, visual/data verification routing,
selected reference indexes, fact bindings, deferred detail tracking and final
acceptance checks. The current implementation refuses retrospective plan creation
after mutation and uses stored criteria for comparison and completion. Deleting
only the instruction would leave these consumers unable to verify completion.
No experiment currently measures how much the separate pre-drawing call improves
quality; its existence must not be treated as evidence of such improvement.

Candidate to design: retain original user intent, evidenced facts and acceptance
checks, but admit the minimum request-linked criteria atomically with the first
mutation instead of requiring a separate narrative plan call. Register/validate
them before writing, preserve pending requirements and fact lifetime, and prevent
retrospective lowering of criteria. Ordinary direct edits should not require
construction research or an expanded plan. Mixed visual/data criteria must remain
explicit; do not guess missing verification or declare unchecked results passed.
This is a proposed flow change, not an implemented or selected production contract.

Before implementation, align the affected compose/prepare/inspect/settle spec and
Inspector handoffs and their executable cases. Compare current separate-plan and
combined-first-write flows on fresh contexts with the same model/effort, documents,
references and briefs. Include a direct edit, intentionally rough illustration,
UI layout and detailed illustration. Final-quality comparisons must finish the
task; first-output-plus-ten-seconds recordings measure only initial visibility.
Track requirement omissions, invalid inputs, facts preservation, usable output,
manual correction needs and first-visible time independently. Fix development
cases first and retain reserved validation cases. Do not promise quality parity
or saved seconds before measuring them.

This priority order supersedes any interpretation that another instruction-only
change or another 101 recording can close the data-processing defects. No model,
search policy, framework-wide redesign, auto-fit behavior or quality reduction is
authorized by this planning update. Production implementation begins only after
the precise shared-data and changed review contracts are ready and testable.

## Implementation contract - 2026-10-05

Continue this plan in the existing worktree. Discovery is frozen to the actual
registered App tools/actions, their schemas, preparation, canonical consumers,
review/settlement, prompt and formal tests. No 2D/3D skill split, Framework
redesign, search changes, automatic camera or reduced quality. Preserve existing
local changes. No push.

Design review found three handoff defects: duplicated incomplete criterion
guidance; inline-only construction fills; tests that prove dispatch but not
canonical behavior. Fix input contracts first, then shared preparation/application,
then concise capability guidance. Extend actual-registry tests without treating
mocked calls as real execution or deterministic scenarios as model selection proof.

Shared construction design: an optional draft `sharedFills` dictionary defines
inline colors/gradients by draft-local key. A node's `fill: {shared: key}` selects
that definition; keys are not canonical IDs. Preparation creates one ordinary
Fill descriptor at its first use and canonical child-ID references thereafter.
Equal inline colors remain independent. Missing/invalid definitions reject before
application. Return the used key-to-canonical-Fill-ID map once for later edits.
Existing-document linking/detachment continues through the existing fill APIs;
there is no new global palette store or redefinition under an existing ID.
This uses existing Core ids-or-objects creation, not a second sharing engine.

The separate plan call is an orchestration issue: expose its existing strict
contract as optional `plan` on combined preparation/application. Validate and
prepare first, register criteria before the first canonical mutation, then apply.
Existing explicit plan, direct edits, independent assessments, facts and final
checks remain usable. Invalid preparation or criteria must not mutate the canvas.
Later mutations cannot retrospectively replace criteria. This removes a required
extra round trip for ready construction without claiming model quality parity.

Acceptance: executable advertised examples; missing verification rejects and is
explained; invalid/shared/independent/repeated fills; real App creation, linked
changes, detach, Undo/Redo and persistence; combined plan/preparation failure and
existing review obligations. Run affected server/AI suites, App typecheck/build,
naming, scoped lint, Inspector proof and browser canonical cases. Report gaps in
all-tool behavioral coverage explicitly until every advertised route has an
executable semantic case. No new live 101 run before deterministic gates pass.

### Step card - contract and schema handoff

Owner: inspect; spec Evidence and completion; Inspector inspect. Inputs: original
requirements and registered review schema. Output: a single exported plan schema
and executable example used by prompt and admission. Existing phase/revision/fact
validation remains authoritative; advice bypasses drawing review. Allowed: review
owner and formal consumers. Forbidden: invented criteria, default verification,
canvas writes. Boundary: local-design-review.ts and design-review-stages.test.ts;
compose consumes the exported guidance in its next segment. Failure: inspect.
Gates: example admitted by real review owner, missing verification rejected,
existing fact/structure/final tests. No cache/persisted identity changes. Stop on
criteria weakening or a missing public handoff.

### Step card - prepare / shared Fill construction

Inspect schema example passed real-owner admission and required-field rejection
(59 tests). Prepare spec: Shared construction and first-write criteria; Inspector
prepare. Input: optional draft sharedFills and explicit shared keys on supported
shape/face/pattern fill slots. Output: unchanged native descriptors, one definition
at first use and child-ID references thereafter, plus compact sharedFillIds
receipt. Independent inline fills bypass sharing. Contributors: design-fill wire
schema, construction/compiler; forbidden: Core mutation, external state reads,
implicit equality sharing. Boundary: design-fill.ts, design-construction.ts,
local-design-tools.ts, design-preparation.ts and preparation/pattern tests. No
cache; names are ephemeral draft keys and receipt IDs are ordinary canonical IDs.
Failure owner prepare. Gates: real schema + compiler for independent/shared fills,
patterns, invalid/unknown keys, unused definitions, input immutability and repeated
preparation isolation. Browser consumption follows in the apply segment.

### Step card - apply / canonical shared Fill admission

Prepare passed 96 focused tests before this segment. Spec Shared construction;
Inspector apply. Inputs: immutable prepared descriptors containing one Fill
definition and later string child references. Output: canonical shared property
relationships through existing createElementsInParent, without re-expansion.
Only references to a preceding admitted Fill in this artifact are accepted;
unknown, forward, wrong-type and redefined IDs fail before any write. Existing
document sharing remains the existing link API. Contributors: wire admission and
public creation API; forbidden: duplicate Fill records, private Props access,
whole-document scans. Boundary: prepared-design-admission.ts, design-actions
tests, existing fill-patch browser suite. Gates: mixed/nested batch creation,
canonical update/detach/Undo/Redo and persisted IDs; no new cache or identity type.
Failure owner apply. Stop if public Core cannot consume the prepared references.

### Step card - compose / usable guidance and first-write review handoff

Apply admission passed 40 tests and preparation 98; real App history/persistence
gate is running. Spec Shared construction and first-write criteria; Inspector
compose. Input: ready draft, optional exact review plan, current registered review
capability. Output: one prepared artifact, saved criteria before canonical write,
ordinary compact receipt. Without review capability the plan field is unavailable;
without plan the existing path is unchanged. Standalone/direct edit planning stays
valid. Contributors: existing design and review tool owners and registry-derived
guidance. Forbidden: guessed verification, retrospective acceptance, forced style,
new review state. Boundary: local-design-workflow.ts, ai-domain-prompt.ts and tests.
Failure: compose delegates to original owners. Gates: schema and real-owner plan
admission, preparation failure/no write, invalid plan/no write, post-write rejection,
Stop before application, retained final-review requirements and receipt scope.

### Step card - apply / actual registered action coverage

The registry contains 152 basic API actions. Existing signature/dispatch tests do
not prove their behavior. Extend the existing basic-api browser suite with an
explicit semantic case for every current registry entry. The case inventory must
exactly match the registry; additions without cases fail. Each case uses real App
owners in an isolated canonical fixture, actual advertised admission, output or
canonical-state assertions, unknown-field rejection and cancellation. No mocked
methods, generated no-op arguments or model-selection claims. Cases belong to
apply; prepare/inspect native tools retain their real-owner server suites. Inputs
and outputs follow the current registered contracts; no production semantics
change merely to satisfy a test. Boundary: basic-api-actions.spec.ts and its
fixture helper. Stop on a confirmed unrelated Framework prerequisite.

### Step card - compose / real-owner contract corrections

The exhaustive browser case pass exposed a structured selection contract missing
its required point target, and a host render-ready event incorrectly advertised
as a read. These are compose-owner schema/eligibility errors, within the frozen
all-tool contract audit. Add failing contract tests before correcting the schema
and moving renderIsReady to the host-owned disposition. Preserve the actual
selection owner and event API. No private adapters or invented return values.
Browser fixtures must follow real owner shapes (point results wrap point/index;
parent conversion supports Group/Workspace). A separate Core viewport clone
failure is recorded and awaits authorization for the Framework prerequisite;
continue the independent App corrections. Gates: contract tests and browser
semantic cases, exact registry inventory, no model access to lifecycle events.

### Authorized prerequisite - detached viewport position

The user explicitly approved the narrow Framework prerequisite on 2026-10-05:
Core.getViewportPosition must project the renderer-owned position to detached
numeric x/y before exposing it. The engine position can contain callbacks and
cannot be structured-cloned. This preserves the existing public PositionData
contract; it does not change the Inspector route or renderer ownership. Scope is
Core's getter and its existing app-runtime-facade regression suite. Prove failing
callback-backed input first, then detachment, fresh reads and real-browser action
output. No cache, renderer redesign or unrelated Framework changes are included.

Viewport consumer review: production references were traced in apps/packages/tools,
including indirect method-name catalog entries. AI's basic Core action calls the
changed getter; Preset selection outlines and vector editing overlays call Render
directly, and the Renderer adapter already extracts x/y. No current consumer
mutates the Core return or relies on engine fields. The unchanged contract is a
fresh coordinate observation. Focused Core tests (41), Preset overlays (23), Render
viewport/adapter tests (8), and App viewport unit test (1) pass. Real-browser
viewport/action cases remain part of final validation. Rebuild Core before browser
validation because the App consumes its dist exports.

### Validation checkpoint - 2026-10-05

- Criterion example/schema and shared preparation/admission are implemented;
  standalone planning and existing acceptance requirements remain available.
- Removed the host render-ready notification from AI tools; 151 basic actions
  remain. Structured point selection now includes the required target.
- Core viewport getter red/green proof reproduces DataCloneError with an engine
  callback; detached x/y, fresh reads and unchanged owners are verified.
- Server harness: 741 passed, 5 opt-in live tests skipped. Additional shared
  gradient isolation regression: preparation suite 38 passed. Browser shared
  creation/link/detach/Undo/Redo/persistence: 2 passed.
- Real-App action/viewport suite: 156 passed (148 basic actions, 3 existing vector
  history cases, 5 navigation cases). Three client-position hit-test actions fail
  before the first pointer event because Pixi rootBoundary.rootTarget is unset.
  They remain in the permanent suite; the independent successful run explicitly
  excluded those three and is not an all-tools pass. Requested separate approval
  for this engine fix; no fallback or fake pointer event was added.
- App typecheck/build and naming pass. Scoped lint has zero errors and the existing
  Core console warning. Inspector candidate 518d27a9-4988-4f99-8c3d-ef80bf4a85bc
  passes the execution-owner proof; the proof is not a substitute for browser or
  live model evidence. No live model run or speed/quality parity claim this turn.

Evidence is under tmp/tool-contract-*.log. Final closure is pending the hit-test
prerequisite decision and its applicable checks. No push performed.

### Authorized prerequisite - programmatic hit testing

The user authorized fixing the confirmed Pixi hit-test failure on 2026-10-05.
Keep AI -> common APIs -> Core -> Render -> engine query unchanged. The Pixi
adapter owns the current stage and must supply it to programmatic hit testing
even before the first pointer event. Scene Tree existence is not point hit
testing; no fallback geometry, synthetic pointer event, wait or App bypass.

Scope: the adapter query, permanent adapter regressions, the three failing
real-App API cases and direct hover/hierarchy consumers, plus this checkpoint
and the package execution contract. This restores the existing query contract;
no new Inspector route or contributor is needed. Prove failure before production
changes, then run the Pixi suite/build, the real registered API matrix and focused
interaction regressions, naming and scoped lint. Stop on an unrelated owner
defect; no live model run or remote operation is included.

### Hit-test repair and bounded validation - 2026-10-05

Two permanent adapter regressions failed before the change: an unset event
boundary root throws, and programmatic queries have no owned-stage root. Each
query now selects its engine-owned stage before traversing Pixi. Tests also
verify target-handle mapping, no-hit null, a later foreign/null event root, and
no implicit render. AI/common APIs/Core/Render contracts remain unchanged.
The browser fixture observes `Core.subscribeToFrameComplete()` after seeding;
it must not confuse a browser animation callback with completed Asyra drawing.

- Pixi package: 27 tests passed; build, naming and scoped lint passed.
- Direct hover/hierarchy/selection unit tests: 18 passed.
- Browser interaction/navigation regressions: 30 passed, including hover, drag,
  deletion, Group reparenting, Frame disclosure and zoom.
- All three formerly failing client-position APIs passed in the real App before
  pointer movement. The broader run passed 151 cases before stopping at
  `api_element_scaleVectorElementAroundCenter`; remaining three API cases passed
  separately. This is coverage evidence, not a fully green matrix.

The first broad run intermittently reported anchor separation 280000 instead of 200. A fixed-source repeat reproduced it (2 passed, then failure), and a controlled
run with the pre-fix Pixi query reproduced the same value (1 passed, then failure).
Restored the corrected source and rebuilt afterward. Subsequent hit-test repeats
also returned null with correct coordinates and a projected element present.

The browser fixture's single requestAnimationFrame did not guarantee completion
of Asyra's queued scene drawing. It now subscribes through the existing Core
facade before seeding, waits for the actual Render completion, then constructs
its query inputs. No production delay, synthesized event or relaxed assertion.
The three hit queries and the scale case each passed five fresh-page repetitions
(20 passed). This supersedes the initial classification as an established
independent production scaling defect; the earlier results used an unsynchronized
fixture. The full API matrix remains the final gate after this correction.

Evidence: `tmp/pixi-hit-test-*.log`, including red/green, broad browser, isolated
vector, repeated vector, pre-fix control, and interaction runs. No push.

Final prerequisite gate: the corrected readiness fixture passes the complete
154-case basic API browser suite (151 registered actions and 3 vector history
cases), without exclusions or retries. The separate 30-case interaction suite
also passes. Focused repeated hit/scale cases: 20 passed. Pixi tests: 27 passed;
direct consumer unit tests: 18 passed. Package build, App typecheck, naming,
scoped lint and diff whitespace checks pass. Tests have closed their servers;
ports 3000, 4101 and 4201 are clear. No runtime delay or forced render was added.
Evidence: `tmp/pixi-hit-test-matrix-final.log`,
`tmp/pixi-hit-test-interactions.log`,
`tmp/pixi-hit-test-render-observation.log`. Earlier failed attempts remain
recorded; no claim of measured live-model improvement is made.

## User-authorized post-contract first-output run - 2026-10-05

Observe recording contract rechecked; one headless same-brief case, gpt-6-astra
medium, no retries or product edits. Request
508b6b28-15ae-462b-8883-a553625f3485 passed first-output assertions. First visible
pixels 98.156 s versus previous 122.470 s, with 31 versus 39 initial elements;
no equal-quality speed claim. Combined plan/preparation/application succeeded
without schema rejection or API discovery. One of two reference sources failed
recoverably in a 15.019 s batch; provider preparation after that took 59.139 s.
The model still selected explicit vectors and no sharedFills.

Screenshot inspected: two initial tier masses, not completed facade/crown/spire.
Ten-second window ended at 108.167 s; Stop lookup returned false and context
closure cancelled at 108.532 s. Final screenshot still shows Working; settled UI
is not verified. This remains a recording stop-path follow-up, not drawing
completion. No browser errors; exclusive record gap zero. Full analysis and
artifacts: tmp/api-contract-first-output-20261005-172236/analysis.md. Owned services
closed and .env restored. No push.

## Responsibility-scoped execution - 2026-10-05

Status: IMPLEMENTED; one live attempt recorded, with a failed recording-stop gate
corrected in permanent tests afterward. No second live run. This continuation supersedes the earlier
narrow discovery boundary only for the work below. The current worktree and its
uncommitted predecessors remain the integration source; no new branch or push.

Objective: the model submits a coherent domain task, and existing owners execute
its deterministic handoffs, retaining references and compact outcomes instead of
asking the model to relay intermediate payloads. Preserve requested quality,
original resolution, camera choice, shared-property semantics and one request's
existing history group. Model remains gpt-6-astra medium.

Scope: Design server preparation/workflow/reference/observation owners, their
registered guidance and tests, first-output recording fixture, this plan and the
execution/preparation specs and matching Inspector. No Framework/runtime model,
network-search policy, external dependency or canonical history changes.
Discovery is fixed to the last run 508b6b28-15ae-462b-8883-a553625f3485, these owners,
their direct callers and permanent tests. Stop on a required unrelated owner fix.

Design review: preparation/application/inspection are already composed. Keep
that route; do not add a catch-all orchestrator or duplicate geometry compiler.
The remaining gaps are required model-authored vector bounds, missing internal
preparation/criteria handoff observations, loss of a prepared handle when a later
handoff fails, and a recording stop check that can treat transient absence as
settlement. Existing patterns/projection/shared Fill definitions are retained.
Reference I/O is already concurrent; per-source timing is needed to establish
whether early delivery would help. Do not claim a failed candidate caused all
15 seconds, or introduce polling/invisible background work without evidence.

Sequence / step cards:

1. prepare: accept vector rings without redundant width/height; measure through
   existing vector geometry exactly once per shared ring object and derive its
   bounds. Explicit dimensions still constrain geometry. Preserve anchors,
   controls, placement, fill and painter order; reject partial dimensions,
   degenerate shapes and invalid coordinates. Existing pattern and projection
   expansion stay authoritative. Demonstrate compact construction/shared Fill
   use through admitted examples, without style-based routing.
2. compose: the existing combined workflow owns prepare -> optional criteria ->
   apply/inspection. Delegate only required input, observe each handoff using
   existing diagnostic records, and return completed step summaries and retained
   artifact identity if a later step fails. Never retry uncertain writes or infer
   visual acceptance. Cancellation interrupts before the next step. No new
   canonical state; artifacts live in the existing request preparation session.
3. prepare/observe: trace each reference acquisition through existing observation
   records with parent correlation, original input, result and elapsed work.
   Test parallel receipts, same-request reuse and cancellation. Assess early
   delivery using this evidence; suitability stays a model decision.
4. observe: strengthen the formal first-output fixture with a temporarily hidden
   Stop control. Wait for actionable Stop or actual terminal message outcome,
   click once and verify settlement; absence alone is not completion.

Required evidence: failing permanent regressions before fixes; real-owner
preparation/workflow/reference/invocation/recording suites; deterministic work
counts and exact output equivalence; App typecheck/build, scoped lint, naming,
Inspector source-bound proof and contract test. Preserve existing rejected-input,
shared/unshared Fill, review, direct-edit and cancellation cases. Review only this
slice and its consumers. After gates pass, run exactly one headless live case with
the unchanged upper-two-tier/crown/spire brief, first visible pixels plus ten
seconds, recording-only first-bounds fit, no retries. Compare timing, first content,
input/repeated bytes, handoffs and recovery; a single sample is not a speed promise.

Responsibility slice checkpoint: new regressions first failed on missing derived
bounds and missing prepared handle after application failure. Preparation cases
now verify explicit/derived descriptor equality and one measurement per repeated
ring object. Workflow delegates through the common invocation boundary, observes
prepare/criteria/apply, retains artifactId/completedSteps/failedStep, and performs
no automatic mutation replay. Reference observations capture each candidate before
batch settlement and preserve existing request-local I/O reuse. Stop fixture first
failed because an absent button left outcome=active; the recorder now waits for
an actionable control or terminal outcome and verifies settlement.

Early reference delivery review: current native calls deliver one final result;
partial image delivery requires a pending-work contract, cancellation ownership
and model notification/retrieval semantics. Adding a poll loop would reintroduce
model orchestration. Keep ordered concurrent acquisition for this slice and use
new per-candidate timings to measure the opportunity; no early-delivery speed
claim. This completes the agreed evaluation, not an implementation of streaming
native tool results.

### Responsibility slice result - 2026-10-05

Implemented and reviewed within the frozen scope. Canonical optional vector bounds
(including repeated templates), parent-linked internal owner observations, failure
progress/retained artifact handles and acknowledged partial work are verified.
Exclusive timing now classifies internal server handoffs as tool work, not browser
exchange. Early reference delivery was evaluated and deferred as described above.

Validation: 750 server tests passed (5 gated skips), typecheck, production build,
scoped ESLint, 12 naming checks, 100 Inspector contract tests. The generated
workspace catalog was refreshed from canonical Inspector sources to fix its stale
snapshot; no catalog policy changed. Source-bound proof 7203e798-6780-4e74-b243-71580f78d735
passed before recording; a final post-correction proof is recorded below.

Exactly one live attempt: tmp/domain-workflow-first-output-20261005-183038.
First visible pixels 130.074 s versus previous 98.156 s (+31.918 s). First batch
13 elements rather than 31; only the lower of the requested two sections is present.
Both references succeeded (0.106/1.053 s); combined preparation/application took
0.194 s; provider gap before that call was 76.405 s. Input 7,301 bytes versus
17,473; all 12 vectors used owner-derived dimensions, no sharedFills/patterns.
Content differs, so neither bytes nor elapsed time prove isolated speed impact.

Live recording failed its stop gate: the real button's accessible name is Cancel
request, while the recorder looked for Stop. This was not a transient UI absence.
The synthetic fixture missed the mismatch. Replaced that fixture with the actual
Panel/cancellation path, proved it red, fixed the recorder's three role locators,
and passed both real-control and delayed-control cases (2 tests, 36.2 s).
No second live model request was made. The saved video continues beyond +10 s;
context closure cancelled at 169.382 s. Corrected live stop is not newly proved.
Full evidence and caveats: the run's analysis.md/report.json/records/browser.

This slice closes the scoped implementation and one-attempt investigation, not a
claim of improved first-output latency, complete artwork, or a passing live gate.
.env restored; owned service ports closed; no push.

Final source-bound owner proof: 492d8c15-1eb6-41af-8f15-46a7c4b5e94f passed
(source a852dd5dd8288d5200f0bd7b9b23ca2e0bf8ef1e442f29ec93168516951889cc).
This proof covers its declared server owners; actual recorder cancellation is
proved separately by the two real-browser regression cases, not this digest.

## First visible change path - 2026-10-05

Status: DONE. User acceptance is the first actual canvas pixel change,
independent of element count or completeness. One live first-output attempt after
validation; ten seconds of observation then real Cancel request. No push.

Bounded scope: Design server prompt/provider, reference acquisition/transport,
review lifecycle and preparation guidance, their direct formal tests, execution
and preparation specs and matching Inspector. Preserve canonical geometry,
original image bytes, model gpt-6-astra medium, user's style/viewpoint/scale,
request history, permissions and final visual verification. No provider/model
changes, new dependency, search-source restriction, fake output or automatic
product fit. Discovery is the 98 s/130 s saved runs and these direct owners.

Design review: native research does not expose structured candidate images to the
App. Do not pretend to intercept them. Extend the existing importer to accept a
source page alone: the same safe transport fetches it, extracts page-declared
image metadata and imports usable bytes internally. Model still chooses relevant
pages and judges image suitability. No extra model call, source list, crawl or
resizing. Direct image URLs remain the preferred route when already known.
Successful page resolution is retained for this request; failed reads retry only
on explicit later calls. Concurrent equivalent calls share the same cancellation
scope. Metadata selection is not subject/style acceptance.

First drawing must no longer depend on a model-authored acceptance plan. Preserve
the original request in the existing provider/assessment input; allow the first
criteria record after partial drawing, before visual approval. Once established,
criteria cannot be rewritten after mutation to bless a bad result. Existing
full-request independent assessment and final completeness remain authoritative.

Step cards (exact Inspector owners):

1. inspect - local-design-review and direct operation/provider callers/tests.
   Input: immutable invocation request and evolving drawing evidence. Output:
   optional early criteria or first criteria after partial drawing; unreviewed
   changes remain unaccepted. No automatic visual pass or revised requirements.
   Cases: draw then plan, replace locked criteria, stale evidence, final quality
   and independent assessment. Red test before implementation; focused review tests.
2. prepare - local-reference-tools and reference-image-download plus source-page
   metadata helper/tests. Input: public HTTPS sourceUrl with optional imageUrl.
   Output: admitted original raster and source-local candidate/failure receipts.
   Reuse validated transport per hop, no JS execution/cookies/private hosts.
   Cases: page metadata, relative/entity URLs, failed candidate then good one,
   duplicates, cancellation, size/type/DNS guards, no image, original bytes.
3. compose/request - ai-domain-prompt, preparation examples and provider guidance.
   Keep startup instructions short and route stage-specific procedures to existing
   tool contracts. Plan is not required for first mutation. If the chosen method
   has world-space coordinates and projection, let the existing owner project;
   already-authored 2D vectors stay 2D. No camera or style inference in the App.
   Cases: prompt routing, real projection and vector equivalence, registration,
   no separate plan call needed before successful prepare/apply.

All steps use current request-local owners and existing typed tool receipts.
Required gates: focused regression red/green; server response suite, App types/build,
scoped lint/naming, Inspector candidate/contracts; real recorder cancellation
regression. Then one recorded live case with the unchanged brief; inspect image,
analyze the three intervals and record the failed or successful attempt without
reruns. Stop on unrelated owner changes; no broad repository audit.

Validation and one live result:

- Server suite 755 passed, five opt-in skips; recorder cancellation 2/2 passed.
  Types, scoped lint, naming, production build and 100 Inspector contract cases
  passed. Final owner proof `87d1438e-7063-4d04-8596-0c09d0b50171` captured source
  `88b11d1df2ecce712a6d302883108a97d92fd720a3da4d74c0b28bc69ab926c4`.
- One live request `03b6e32e-2026-407a-ba8b-16b959e3294d`: first visible pixels
  49.861 s versus previous 130.074 s; actual cancellation 59.938 s. Two spire
  faces were visible. This proves first-change delivery, not completed fidelity.
- The source-page path was used, then an explicit cached refresh and a direct
  original-image import. Page metadata selected a publisher preview; neither
  raster was resized. The final receipt correction marks page-derived source
  resolution unverified rather than asserting original-source resolution.
  Regression red/green and 47 reference tests passed; no second live run.
- Evidence and bounded analysis: `tmp/first-change-live-20261005-192548/analysis.md`.
  Source hashes distinguish the live-tested source from the final receipt text.
  `.env` restored and test services closed. No push.

## Reference acquisition owner correction - 2026-10-05

Status: COMPLETE. Replaces the assumption that adding URL caches fixes repeated
reference work. Frozen scope: reference page parsing, acquisition/retained asset
selection, delivery receipts and their direct provider consumers/tests; matching
prepare/compose contract documentation. No renderer, geometry, model/effort,
provider search policy, dependencies or push.

Evidence: the 19:25 run imported a page-declared 960 x 1440 preview, explicitly
redelivered it from cache, then imported the 3657 x 5486 original from the same
page. The downloaded page already includes an image-bearing hyperlink to that
original. Current parsing ignores those links and treats the first decodable
metadata image as the selected page result. Direct original acquisition does not
update that page selection. Thus cache hits can preserve the wrong resource.
There was no logged provider delivery error; the model's reason for refresh is
not known. Verify actual image delivery independently rather than inventing it.

Revised owner design and self-review:

- Prepare owns page-declared relationships between an image preview and its
  linked image resource. Parse generic image-bearing links and structured image
  declarations, not site names, CSS selectors or rewritten URLs. Prefer a
  declared linked resource over its preview. Multiple unrelated linked images
  remain distinct; subject choice stays with the model. Never silently replace
  a failed explicit linked resource with its lower-resolution preview.
- Retain the selected page asset and its exact declared candidate relationships.
  A later explicit acquisition of a candidate updates that selection. A page
  refresh redisplays the selected retained image and does not research/download
  it again. Do not merge assets by filenames or strip URL parameters; byte
  identity may deduplicate admitted identical resources, not infer equivalence.
- Receipts distinguish acquisition, reuse, image delivery, dimensions and source
  provenance. Refresh is redisplay, not an original-resolution upgrade.
- Compose delivers image content through the existing native protocol. Add a
  maintained live protocol probe if existing tests cannot prove model access;
  test published image observations, never private reasoning.

Fixed discovery: last-run inputs/outputs, same source HTML declarations, current
reference owner, content adapter and native response write, current formal tests.
No repository-wide scan. Gates: red/green regression using the published HTML
relationship and different-host synthetic fixtures; preview/original selection,
failed linked resource, multiple assets, direct candidate upgrade, byte/URL
identity, repeat/refresh network and decode work counts, delivery failure and
cancellation. Full server harness, types/lint/naming, source-bound Inspector proof.
A live protocol image-delivery probe is distinct from another full 101 recording.
Completion means these owner defects are corrected and evidence distinguishes
necessary re-display from redundant acquisition; no claim that model behavior
can never request a legitimate reinspection.

Compose segment revision: real protocol probes reproduced a second independent
cause. The native Code Mode adapter returns a string containing receipt JSON,
then newline-delimited image data URLs. The model used `result.content[]` (MCP
shape), emitted no output, refreshed, then printed base64 while discovering the
actual shape. Raw executable tool calls/outputs prove this; reasoning is excluded.
The former generic “forward images” instruction does not define this boundary.

Step Execution Card - compose: spec “Reference acquisition and redisplay”;
Inspector compose native-image delivery condition and prepare-to-compose receipts.
Input is localToolContent's validated JSON plus unchanged image blocks; output is
model-visible receipt and images through Code Mode with one acquisition. Compose
owns the exact native return-format recipe, including zero/multiple images and
reuse; direct native delivery remains unchanged. Allowed contributors are the
native adapter, localToolContent and provider instructions, not new image
processing or source-selection rules. Files: local-operation-tools.ts and its
test, local-ai-provider.ts, local-ai-live.test.ts; spec/Inspector above. Failure
owner compose. Gates: execute the advertised recipe against adapter-shaped results,
assert no image bytes enter text output, real model reads the image with one import,
server suite/types/lint/naming and regenerated source-bound proof. Stop on a native
format different from the observed contract and report that concrete incompatibility.

Results:

- Acquisition red gate: 6 failures before correction; captured source-page links,
  cross-host/signed URLs, no preview fallback, selected-candidate updates and byte
  identity now pass. Concurrent identical aliases decode/attach once; different
  same-size bytes remain separate.
- Live delivery red: the six-digit image probe repeatedly needed 2 imports and a
  refresh. Protocol evidence in
  `apps/asyra-design/tmp/reference-owner-live-probe/1791201564796/result.json`
  shows the first `result.content[]` loop emitted nothing, followed by base64 text
  while the model discovered the string shape. This is separate from networking.
- Live delivery green:
  `apps/asyra-design/tmp/reference-owner-live-probe/1791201792001/result.json`;
  gpt-6-astra medium, 1 import, 1 download, 1 model-visible image block, zero base64
  text output, correct six-digit answer. It used the advertised recipe in the
  first import call; no refresh or source upgrade. This is a bounded protocol
  test, not a new full Taipei 101 drawing or proof that all reinspection is wrong.
- Final server harness: 764 passed, 6 opt-in skipped; separate live probe passed.
  Server typecheck, scoped ESLint, naming gate and App production build passed. Inspector contracts:
  100 passed. Local .env restored byte-for-byte after opt-in runs. No push.

The first attempted final server run overlapped the temporary live-test opt-in,
which activated an unrelated maintained VTracer probe. The runner was stopped;
`.env` was restored and the final server suite was rerun with live tests skipped.
Subsequent opt-in testing must finish and restore .env before starting that suite.

## Tool handoff contract review - 2026-10-05

Status: COMPLETE for the bounded tool handoff review. Review all currently registered App tool families and their
shared admission, result, native delivery, prepared-artifact and browser-receipt
boundaries. Observable completion: valid declared inputs reach the intended owner;
usable results survive each handoff; correctable failures preserve actionable
receipts and permit continuation. Preserve model/effort, canvas behavior, source
resolution, existing permissions, cancellation and uncertain-write safeguards.
No Framework/API feature expansion, dependencies, push or full drawing run.

Fixed discovery roots: server local tool/provider/workflow/operation/schema owners,
registered src/ai action contracts and their direct browser receipt consumers;
existing formal tests and prior native protocol evidence. Candidate classes:
(a) advertised schema versus native Code Mode declaration, (b) validation versus
owner admission, (c) artifact/target identity and wrapped argument resolution,
(d) compact/partial/failure receipt classification and image forwarding, and
(e) browser frame/receipt acceptance and cancellation. Methods: current code and
schemas, registry-derived formal seam tests, small native protocol probes where
mock tests cannot prove the actual adapter. No new repository-wide discovery after
repairs start. Every confirmed bug gets red/green regression before repair.

Compose Step Execution Card: existing capability-discovery-and-composition spec
and compose Inspector inputs/outputs/conditions; registry schemas and prepared
receipts are input, exact callable contracts and unambiguous usable/error receipts
are output. Native provider and existing tool owners contribute; no model-authored
geometry evaluation, new product intent rules or silent replay. Implementation is
restricted to compose's existing provider, schema, tool/workflow and test boundary,
plus direct receipt consumers only if discovery proves a handoff defect. Gates:
registry-derived admission and handoff regressions, native format proof as needed,
server suite, direct browser tests if changed, types/lint/naming/build and Inspector
contracts/source proof. Stop on a required change outside these owners. Review
exact step again before advancing; prepare internals remain unchanged unless their
handoff is the first proven wrong owner.

Findings and corrections:

- Actual native declarations discarded sibling object fields around unions:
  import_reference_image exposed arbitrary objects, and prepare_design omitted
  common fields. The registration adapter now distributes those constraints
  without changing canonical admission. Closed-object intersections are covered
  by an additional red/green counterexample to prevent accidental widening.
- Code Mode still abbreviates deep fields as unknown. Native lookup formerly
  returned routes only, preventing recovery of the exact format. It now returns
  the original registered schema (including $defs) and description once per
  request/revision, with references and explicit refresh thereafter. No separate
  schema copy, unconditional lookup or repeated full catalog was introduced.
- Common admission ignored nullable type arrays and uniqueItems. Both are now
  enforced, while legal null controls and distinct targets remain admitted.
- Operation preparation replaced the owner's exact rejection with a generic
  message. The original reason now survives pre-dispatch failure handling.

Validation:

- Original server baseline: 764 passed, 6 opt-in skipped. Initial new regression
  tests reproduced seven failures; native lookup and closed-object counterexamples
  separately failed before their corrections.
- Final server suite: 776 passed, 8 opt-in skipped. Server types, scoped ESLint,
  naming and App production build passed. This review changes no browser rendering.
- Native catalog evidence: reference-owner-live-probe/1791202959062 (missing
  fields) and /1791203189348 (correct common fields, remaining native depth
  abbreviation). Paths are under apps/asyra-design/tmp/.
- Real gpt-6-astra medium recovery probe /1791203693442: rejected empty reference
  input returned PREPARATION_REJECTED, correction succeeded in the same turn,
  image digits were read correctly with one download and one admitted import,
  exact preparation schema was retrieved and a two-element artifact prepared
  successfully. The formal probe asserts the usable prepared receipt as well as
  image visibility. Local .env restored byte-for-byte. No full drawing or push.
- Current execution Inspector's two contracts and source-bound owner proof passed:
  21779908-355a-4098-9932-0365802105ce, revision 58, source
  112684294f5b09d1e0189d300abbacddc0e8b98ba3b2405aa7f9b75f89e90fd2.

Outside this bounded repair: the expanded Inspector run has two failures in
unchanged Runtime/performance contracts: “transaction, projection, collaboration,
and cleanup routes preserve existing owners” and “local-only startup is
transport-free while configured socket remote apply stays nonpersistent”.
They are recorded in tmp/tool-handoff-inspector-scoped.log and were not rewritten
to make this review green. No claim is made that all repository gates passed.

## Follow-up - two Inspector contract failures - 2026-10-05

Status: COMPLETE. User authorized correcting the two failures recorded above.
Scope is the Runtime settlement and Design startup Inspector contracts, their
formal assertions and directly affected documentation. Preserve atomic rollback,
grouped retention, one intended Undo entry, and separate optional transport startup.
Fixed discovery: exact failing assertions, current Inspector/spec, direct runtime
and App transaction owners, package scripts and their maintained tests. No new
runtime behavior, package changes, unrelated cleanup or push. Gates: both original
failures, all Inspector contracts, Runtime atomic/grouped and App history-group
tests, root startup automation and formatting checks. Stop if evidence requires a
product-policy change instead of contract synchronization.

Step card - settle-plan-transaction: Runtime Inspector and current product spec
already distinguish atomic complete rollback from grouped finite-member retention.
Inputs are mutation/failure receipts and the host settlement contract; output is
one explicit settlement outcome and intended Undo entry. Existing assertions still
require old rollback wording. Verification owns this correction; runtime and
Factory owners remain unchanged. Validate both host behaviors with existing formal
transaction tests, including failed members, Stop and unknown settlement.

Step card - open-socket-authoritative-document-session: package scripts and BDD
already use start:asyra-design; dev:all has been removed and the root automation
test expressly requires its absence. Correct this step's obsolete startup sentence
and its direct contract assertions. Preserve all endpoint/local-only, remote apply,
permission and persistence conditions; no service is started for this repair.

Results: both original failures were reproduced before correction. Runtime contract
assertions now independently require atomic rollback, grouped retention and explicit
unknown settlement. Startup Inspector/spec/assertions now use the actual
start:asyra-design entry, verify its package script, and reject obsolete dev:all.
The current BDD already matched the real command. Runtime behavior was not changed.

Validation: 33 affected Inspector contracts passed; 16 Runtime atomic/grouped tests,
6 App history-group tests and the maintained root startup automation test passed.
App tests required jsdom; the initial Node-only invocation failed during collection
(window unavailable), then the browser-environment run passed. Formatting, naming
and scoped whitespace review passed. No service was started; no push.

Expanded Inspector run: 345/346 passed. The remaining failure is outside these two
owners: render-delta-update-flow-inspector.contract.test.cjs, “the product contract
and formal oracle lock count and timing budgets”. It expects an inline assertion
inside render-delta-profile.spec.ts, which currently delegates to
assertRenderDeltaContracts. Recorded in tmp/inspector-contract-drift-all.log; its
contract and helper were not changed in this bounded repair.

## Follow-up - Render measurement contract drift - 2026-10-05

Status: COMPLETE. User authorized fixing the remaining Render Inspector failure.
Scope: render-delta-update Inspector/spec, their contract test and the maintained
render-profile helper regression. No renderer, cache, geometry, E2E runtime or
threshold changes. Fixed discovery is the failing assertion, current E2E call to
assertRenderDeltaContracts, its helper/tests and the matching handoff step.
Completion requires all Inspector contracts, the helper's positive/negative work
count cases, formatting and bounded diff review. No browser timing claim or push.

Step card - handoff-engine-commands: current E2E consumes phase measurements and
work counts, then calls the shared assertion owner. Outputs are strict work-count
validation plus observational elapsed-time metrics; fixed local-machine timing
thresholds are obsolete. Preserve zero full rehydrates, exact delta/sample counts,
bounded canonical reads and engine ownership. Correct Inspector conditions and
its direct acceptance/spec; keep the persisted dense-vector-budget identity.
Historical measurements stay labeled as historical, not current pass criteria.

Results: reproduced the original stale inline-assertion failure and the revised
contract's failure against obsolete timing requirements before correction. The
Inspector and current profiling spec now preserve strict work counts and label
elapsed timings as observations. Historical measurements/thresholds remain as
historical evidence. The E2E-to-shared-helper call is verified directly; the helper's
maintained regression suite proves zero full rehydrates, sample/phase/delta counts,
read limits, retained slow observations and rejection of excessive work. Added the
missing total-sample-count negative case without changing the helper itself.

All 346 Inspector contract tests and 6 render-profile/helper tests passed (352/352).
Scoped ESLint, formatting, naming and whitespace review passed. No Render, cache,
geometry or browser execution code changed. No browser performance result is claimed;
no service was started and no push was performed. The three contract failures found
during the tool review and its follow-ups are now resolved.

## Push integration - prepare owner whitespace regression

Scope: source-page linked-image resolution only. The prepare Inspector requires
following publisher-declared original/preview relationships without site rules or
URL rewriting. The maintained linked-image fixture now contains legal leading and
trailing whitespace in srcset; the existing import regression fails by selecting
the social preview. Normalize attribute-boundary whitespace before parsing its
candidates. Preserve URLs, metadata matching, source resolution, and download
reuse. Gate: existing reference-page and reference acquisition suites, server
checks, and current local affected validation. No search/model/render changes.

## Push integration - compose admission browser compatibility

Scope: the shared operation-input-schema admission owner and its existing tests.
The compose Inspector requires one schema contract for server and browser callers.
The full registered-action E2E failed before its first action because Node util
was externalized by Vite. Replace only structural comparison with the existing
browser-compatible lodash dependency; preserve JSON schema admission, uniqueItems
and schema intersection behavior. Existing schema tests and the complete basic
action browser suite are the regression gates. Rerun affected App checks and
functional/render E2E; retain already passed unchanged workspace gates.

Integration iteration: the shared module also loads through Vite configuration
in native Node ESM. The browser-compatible named lodash import failed the App
build because lodash is CommonJS. The compose owner and JSON comparison contract
remain unchanged. Use lodash's default isEqual entry with its explicit .js path,
which loads in native Node and browser bundling. Prove the App build and existing
schema tests first, then resume affected gates; do not change fixture loading or
introduce environment-specific admission implementations. Self-review confirms
this addresses both actual consumers without changing API or validation policy.

Push integration - preparation browser fixture: the maintained pavilion E2E
reported `Invalid design construction: check key is missing`. Its brief still
assumed `$root`, contrary to the current prepare contract (optional explicit
selectors; generated canonical identities; no reserved root name). Update this
fixture to declare and reference `pavilion`, and include the actual preparation
receipt in failed assertions. Production admission stays unchanged. Existing
explicit/unnamed-root unit cases remain authoritative. Run the complete structured
construction browser file and the remaining functional/render cases; retain
passed earlier cases whose inputs have not changed.

The same construction E2E file also registered empty schemas for its mixed-action
proof. Canonical target resolution correctly rejected those untyped placeholders.
Use the actual browser action factories to supply advertised schemas, then keep
the same preparation, target lookup, canonical writes and Undo/Redo assertions.
A bounded scan of E2E operation-tool callers found this single placeholder caller;
no production schema or routing exception is needed.

Push integration - inspect receipt E2E: repeated rendered inspection already
produced correct red/blue/green pixels, but the test still expected the removed
implicit subtree `elements` payload. Align only this consumer with the inspect
contract: assert the requested elementId and absence of implicit object data;
retain all three pixel checks, image freshness, size, and Undo/Redo assertions.
A bounded search of E2E inspection-result consumers found only this stale read.
No product API change or restored duplicate payload is needed.

## CI integration iteration - cold browser admission loading

The previous dual-environment fix passed a warm local Vite cache but failed
CI run 37330875212: loading the first basic action dynamically discovered
`lodash/isEqual.js`, triggered dependency optimization and reloaded the page
during invocation. The existing registered-action test detects the failure.

Revised compose step: consume the already shared lodash package through its
native-ESM-compatible default export, preserving the same isEqual function.
Only operation-input-schema.ts and this plan change. Inputs, outputs, canonical
admission and failure ownership stay as defined by the compose Inspector; no
fixture retry, browser-reload recovery, alternate validator or Vite exception.
Self-review: the package root is already in the App's static dependency graph;
default import also handles native Node CommonJS interop. Verify the existing
schema suite, App build, and basic-action E2E from a cold Vite cache, followed
by affected local gates. Stop on any admission or loading regression.

## CI integration - retained raster work-count watchdog

CI run 37333920794 completed the retained 24-fill, 9,216,000-pixel fixture
with exactly 24 gradient-type reads in 5,662 ms, then failed Vitest's default
5-second watchdog. This is a test-runtime limit, not a failed work-count or
pixel oracle. Scope is only even-odd-fill-work.test.ts and this plan; production
rendering and Inspector behavior remain unchanged. Keep the full fixture, pixel
snapshots and work-count assertions; give this one expensive case a bounded
30-second watchdog. Duration remains diagnostic, never a throughput acceptance
threshold. The existing CI failure supplies regression evidence. Validate the
Render workspace with coverage, then shared gates. Self-review confirms no
production contract, workload, assertion, retry or global timeout is changed.
