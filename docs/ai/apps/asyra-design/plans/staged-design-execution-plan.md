# Plan: Staged Design Execution and Conversation Context

## Status and task boundary

Implemented and validated on November 6, 2026 under
[Editable Design Agent](ai-design-agent-plan.md). The implementation outcomes and
live evidence below distinguish mechanism correctness from model adoption.

Implementation authorized on November 6, 2026 in the existing
`codex/ai-conversation-improvements` worktree. Mutation scope is the four owner
slices below, their direct contracts and focused regressions, followed by the
fixed live test and report. Preserve preceding changes; no release, full local
test, dependency installation or remote operation is included.

## Product outcome

An AI can delegate related work once, let the host complete each ready stage and
apply it immediately, preserve selected stage context in the App, and continue
without retrieving intermediate data merely to hand it back. Preservation supports
continuation, later edits, recovery and organization even when reuse is uncertain.
The AI chooses intent, stage boundaries, retained values and visual decisions.
The host performs declared calculations, checks, repairs, bindings and writes.

## Follow-up: Decided work and stage continuity

Authorized November 6 after the staged live report. This bounded task repairs
three observed handoffs: facts/calculations composition, optional preservation
at the actual direct drawing entry, and artifact/current-region data review.
Discovery is limited to the recorded run `1793900303093`, these direct owners,
their schema/lifetime consumers and focused tests. No new storage, forced stages,
mandatory Knowledge, provider search-ranking change, release or full test run.

1. Compose owner: allow source facts and derived calculation recording in an
   ordered host sequence if their existing validation and request ownership can
   remain intact. Keep visual judgment/capture at its existing native boundary.
   Replay the rejected facts/calculations/group request; require facts before
   calculations and no later writes after an invalid source step.
2. Direct drawing/result-delivery owner: expose the existing optional selected
   retention and status/field delivery at `prepare_and_apply_design`. Lower that
   request through the existing host sequence/result owner; do not implement a
   second store or drawing loop. Preserve native default receipts and repair
   contracts. Test authored draft/public root retention, later-turn reuse,
   unavailable context before writes and save failure without drawing replay.
3. Preparation/review handoff: replay the recorded split-artifact data selection
   with real request ownership and fix the first incorrect lifetime contract if
   reproduced. Keep explicit release and foreign-request rejection. Resolve
   current region selectors through the canonical context read, with expected
   count and full fields, directly into owned data evidence without a model ID
   shuttle or a second initial value read. Revalidate the same region membership
   and selected values before accepting judgments; never silently widen targets.

Owner cards: compose consumes registered capabilities and ordered inputs and
returns actual step receipts; direct drawing consumes ready authored values and
optional selectors and returns acknowledged writes plus preservation outcomes;
inspect consumes exact artifact/ID or bounded region selectors and returns
current signed evidence. Relevant implementation boundaries are the App host,
workflow, review, data-evidence, preparation lifetime declarations and direct
tests/specs/Inspector. Shared runtime changes require a demonstrated direct gap.

Each segment starts with a failing permanent regression, then owner changes,
focused tests and review of its direct consumers. Preserve earlier dirty work.
Completion requires the three handoffs and their negative cases, scoped type/lint
and Inspector checks, then one unchanged-prompt 18-minute Taipei 101 run with
an unlimited original-provider-thread report. Freeze source until evidence and
service cleanup finish. Report actual adoption and waits, not inferred speed.

For a twenty-step request with two groups, the first group can finish its mechanical
iteration and appear on the canvas before the second group finishes. The second
uses earlier outputs directly. Its independent preparation may overlap the first
application when actual resource dependencies permit it. No intermediate model
round trip is required unless a new decision is genuinely needed.

## Planning baseline

The [November 5/6 test and report](../reports/taipei-101-motif-variants-2026-11-06.md)
records seven motif definitions, working overrides, zero cross-draft template
exports/reuses, one rejected whole-receipt save and two single-operation
execute_design calls. Nonplanar geometry recovered through two replacements.
Eleven App discovery calls and six native searches reported by the AI are distinct
paths. The failed curve query returned no match; its vector menu page contained
reads, while existing handle-edit operations were on subsequent content.

Existing owners to retain:

- `src/ai/conversation-results.ts`: App-owned conversation snapshots across turns,
  isolated by document/conversation, with the current capacity and reset lifecycle.
- `server/local-result-delivery.ts`: field selection, optional named retention and
  request-reference rejection. It currently reports no offending field path.
- `server/local-design-sequence.ts` and `local-tool-host.ts`: one model entry,
  execute_design, direct bindings, named values and grouped ready actions.
- `packages/ai-agent-runtime/src/recipe-execution.ts`: ordered awaited steps,
  followed by the recipe's optional iteration. This is not per-stage iteration.
- `server/local-design-workflow.ts`: ready parts already prepare and apply one
  part before preparing the next. There is no global wait-to-draw requirement.
- `server/local-tool-scheduler.ts`: independent leaves share a barrier but still
  wait for exclusive work. Launching more promises does not establish overlap.
- `server/local-design-tools.ts`: public template export; the registered-schema
  owner now proves direct typed-map forwarding, including key/value lifetimes.

The prompt already mentions preserving useful outputs when later use is uncertain.
The change must organize the actual contract around stage continuity, not merely
append another reminder or reintroduce batch versus recipe as a model choice.

## Proposed end-to-end flow

1. The AI submits decided stages through execute_design. Each stage identifies
   operations, dependencies, mechanical checks/repair conditions when needed,
   application operations and optional context exports.
2. The host admits the whole submitted structure, capabilities and binding
   contracts before writes. This does not require computing every stage's geometry
   before the first ready stage can apply.
3. A stage resolves current named context and bound earlier outputs, then performs
   its calculations and declared mechanical iteration.
4. Once its declared conditions pass, the host dispatches its application through
   the existing canonical batch/action path. It does not return to the AI just to
   obtain another instruction to apply already-approved work.
5. Selected public values are saved in App conversation context at their declared
   stage boundary. Prepared results and acknowledged application results remain
   distinguishable; a saved draft never implies a successful canvas write.
6. The next stage continues from host-held bindings or App context. Independent
   preparation may overlap application; canvas-dependent work waits for the
   required acknowledgement and fresh state. Visual-dependent work returns to AI.
7. Return execution status by default, selected fields for decisions and exact
   completed/failed/remaining stages for recovery. Preserve acknowledged writes.

The user's auto_batch example expresses an application boundary after a successful
stage. It is not an existing field. Final syntax must express that boundary and
its explicit consumer without guessing which arbitrary outputs are drawing
commands. Extend the single entry and shared execution owner rather than creating
another public dispatcher or parallel recipe engine.

## Implementation order

### 1. Stage context and clear preservation outcomes

Owners: App result context, host result delivery, sequence contract and prompt.

- Present retention as task continuity, not only reuse optimization. The AI may
  preserve useful stage outputs before knowing their eventual consumers; it need
  not save every intermediate result or read the saved data back.
- Keep decided in-call successors directly bound. Preserve selected authored
  parameters as well as computed public results through explicit stage outputs,
  so saving useful input parameters does not require a dummy tool or model round trip.
- Reuse the existing conversation store and lifecycle. Do not silently turn
  request artifacts into persistent references or promise persistence across App
  restart. Canonical element IDs remain subject to current target validation.
- Report the requested alias and exact field paths that prevent retention, with
  owner-declared lifetime information. Expose valid field selectors when known;
  never silently strip fields and claim the original selection was saved.
- Keep a successful write when optional retention fails. A successor that already
  has its bound input need not stop solely because an unrelated save failed;
  a successor actually depending on an unavailable saved value must report that.

Proof: replay taipei101Assembly with the original grouping receipt and with only
its group ID selected. Verify precise rejection, successful narrow retention,
no replay, no rollback and reuse on the next turn. Verify optional preservation
with no known later consumer, plus later continuation and document isolation.

### 2. Stage-local iteration and immediate application

Owners: runtime recipe admission/execution, App sequence/workflow and action bridge.

- Represent stage boundaries in the shared execution contract. Reconcile existing
  recipe iteration with per-stage checks and repairs; an end-of-recipe loop must
  not silently stand in for independent stage loops.
- Let each stage declare the mechanically decidable pass/repair/stop conditions
  and its application. The host must not invent geometry or visual acceptance.
- Apply a ready stage before preparing subsequent dependent stages. Keep existing
  direct-operation and ready-parts forms; lower equivalent forms into the same
  execution ownership instead of implementing another application pipeline.
- Collect stage outputs and save selected context at the stage boundary. Later
  failure or cancellation preserves earlier writes and their receipts. Resume
  only remaining work; unknown settlement requires reconciliation, not replay.
- Preserve current canonical transaction/Undo and cancellation ownership. Do not
  wrap the entire request in a transaction that hides all intermediate progress.

Proof: a permanent twenty-step/two-stage case, with separate mechanical iteration
in each stage, must show A applied before B finishes and no intervening provider
call. Exercise B failure/cancellation, actual previous-write target selection,
Undo behavior and recovery. Replay the recorded repair-to-group sequence and
created-ID ordering case with direct bindings and optional status-only delivery.

### 3. Overlap only genuinely independent preparation

Owners: the existing host scheduler and preparation/resource owners.

- Derive dependency and resource access from registered contracts and actual
  source ownership. Distinguish immutable-input preparation from canvas reads;
  do not reclassify every independent tool as safe beside an exclusive write.
- Allow B's preparation to overlap A's application when B does not depend on A's
  new document state. Keep writes serialized through canonical owners and await
  actual dependencies. Shared artifact capacity/lifetime admission remains owned
  and coordinated; concurrency does not increase existing limits.
- Ensure earlier application can actually be presented while later host work
  continues. Distinguish write acknowledgement, render opportunity and visible
  frame rather than asserting concurrency from Promise.all alone.

Proof: deterministic barriers show B preparation starting while A application is
pending; a canvas-dependent B must wait. Verify ordering, cancellation, resource
release and equal final output. A browser case proves A is visible before B
finishes. Do not add a general background job system or speculative visual work.

### 4. Remove evidence-backed acquisition and review friction

Owners: native declaration delivery, App capability metadata/search, review owners.

- Trace native declaration lookup separately from describe_design_apis. Replay
  the reported review/execute searches against actual delivered declarations;
  fix only the controllable owner supported by evidence. Provider-managed ranking
  limits must be reported rather than attributed to the App catalog.
- Replay `smooth vector path curves` and its vector-category fallback. Existing
  anchor/handle editing must be discoverable by purpose without requiring a
  misleading page of read-only operations first. Preserve exact-name ambiguity
  handling and metadata-based discovery; do not add a Taipei-specific alias.
- Review preparation usage's 25,202-byte/two-page acquisition for duplicate or
  irrelevant delivery. Preserve complete selected schemas and executable examples;
  do not invent a smaller byte target that discards necessary constraints.
- Preserve stable stage/region identities for review. Recheck scope after group
  or layer changes; retain genuinely unaffected local evidence. An overview or
  cross-layer occlusion affected by a change must still become stale.

Proof: recorded discovery queries, full selected-contract execution and measured
pages/bytes. For local deletion, preserve unrelated local evidence while invalidating
an affected overview. Report actual saved calls and work, not just fewer messages.

## Other AI recommendations and their disposition

| Recommendation                                               | Plan treatment                                                                                                                                                                                                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plane-local authoring for projected faces                    | Bounded investigation after stage execution: compare existing geometry APIs with the actual leftfin failure. Add a representation/tool only if an owner gap is established; do not promote one repaired input error into an unconditional new tool. |
| Preserve retained-draft replacement                          | Regression requirement, not a replacement subsystem. The recorded 510-byte repair must not replay the earlier buildings.                                                                                                                            |
| Pattern exceptions/exclusions                                | First exercise existing instanceRanges, split patterns and exact-key targets. A spatial exclusion calculation is a separate potential gap; never infer artistic exclusions.                                                                         |
| Short Knowledge on geometry, occlusion and review scope      | Use only where it reduces demonstrated uncertainty or repeat repair. No compulsory Knowledge read or quality-escalation requirement.                                                                                                                |
| Distinguish execution, visual acceptance and durable storage | Preserve and verify existing separation, including deadline stops after a successful final write.                                                                                                                                                   |
| Require all work in one giant batch                          | Rejected. Stage grouping follows decided inputs and actual decision boundaries.                                                                                                                                                                     |
| Persist every intermediate value                             | Rejected. The AI selects useful stage context, including speculative future use; transient/private values retain their lifecycle.                                                                                                                   |

These investigations are part of the consolidated assessment. A proposed new
geometry helper, spatial exclusion feature or Knowledge content needs a concrete
owner/design decision before implementation; the AI report alone is not authority.

## Upstream, downstream and superseded contracts

Before production edits, update and review the proposed flow through the existing
AI execution Inspector's compose, prepare, apply and inspect owners and handoffs.
Align executable product cases and bounded completion criteria there; this plan
is not a substitute for the executable flow contract.

Synchronize in the implementing slice:

- `ai-domain-prompt.ts`, native descriptions, selected usage and executable examples:
  stage continuity, useful optional preservation and early application.
- `local-design-sequence.ts`, runtime recipe schema/admission/execution and host
  scheduling: stage dependencies, iteration, application and context export.
- `specs/ai-execution-flow.md`, `API_SURFACES.md`, relevant development/user guides,
  `packages/ai-agent-runtime/TOOL_SPECIFICATION.md` and both affected runtime/App
  documentation: distinguish current forms and the new staged form accurately.
- Existing Inspector owner steps, direct fixtures and regression tests.

Remove superseded explanations that present retention solely as confirmed reuse,
require a model handoff before an already-decided application, or imply one final
iteration serves every stage. Keep existing supported forms that remain useful;
do not revive the retired public run_recipe/batch choice or add compatibility
routing, duplicate stores, hardcoded step-count limits or semantic drawing presets.

## Validation and completion

Each implementation slice starts with its formal failing case when fixing a bug,
then self-review and iteration against its owner, direct consumers and the gates
above. Run focused tests, relevant type/lint/naming and Inspector checks only;
no full local test, release workflow, new dependency or remote operation.

Completion requires:

- Selected stage context survives later turns in the same document/conversation,
  without model payload transfer, duplicate dispatch or lifetime violations.
- Two stage-local repair loops can each finish and apply through one AI delegation;
  the first stage is visible before the second finishes.
- Independent preparation overlaps safely; document-dependent work waits.
- Retention failure and later-stage failure preserve successful writes and exact
  recovery information; invalid input cannot bypass admission or replay work.
- The recorded acquisition/retention/review cases have measured outcomes; genuinely
  missing provider control or justified no-change findings are explicit.
- Current contracts, examples, Inspector and tests agree; historical descriptions
  do not remain competing execution authority.

Then run the unchanged fixed Taipei 101 prompt for up to fifteen drawing minutes.
Let the original AI finish an unlimited report in the same provider session.
Freeze source/test files from launch through report, video and cleanup completion;
keep process fit-zoom and the original evidence, including failed attempts.

Report stage readiness/application/first visibility times, actual overlap and waits,
retained aliases and lifetimes, same-call/cross-turn consumption, model-visible bytes,
transfer-only calls, discovery calls and concrete reasons for returning to AI.
Ask why useful stage context was saved or omitted even when reuse was uncertain.
Separate mechanism correctness from AI adoption, and tool duration from unknown
provider delay. One run does not establish stable speed improvement or complete
visual acceptance. Future tests continue to use the frozen prompt unless the user
explicitly changes it.

## Execution design and owner cards

The App compiles staged requests into the existing runtime sequence. Preparation
steps, an optional iteration checkpoint, and application steps share one global
ID/binding space. Each checkpoint follows a declared preparation step; admission
proves the complete ordered structure before dispatch. Iteration state/check/repair
semantics remain owned by the runtime. Stage application remains ordinary canonical
actions, with no implicit conversion of arbitrary results into drawing commands.

Independent overlap requires explicit owner capability, not a model claim. The
runtime may start an eligible next preparation while the preceding application is
pending only when all its bound inputs already exist. It drains started work before
returning failure. Document reads and writes retain their ordered barriers.

First owner card - compose/result delivery: inputs are admitted selectors, public
owner results and declared request-reference lifetimes; outputs are App snapshots
or alias/path-specific delivery issues. Modify result delivery, its focused tests,
and the compose contract. Preserve canonical writes and existing App isolation.
No new store, silent field removal, rollback or repeated execution is allowed.

### Reviewed implementation outcomes

- Compose/context: the actual 275-input/294-output grouping receipt from the
  November 5/6 run is a permanent retention fixture. The rejected alias reports
  both exact request-reference paths; a group-ID selection succeeds without
  replay. `source: "input"` also preserves selected authored parameters after a
  successful step. Same-call input aliases bind authored values; later turns use
  the existing App store.
- Compose/runtime: `stages` lowers to ordinary steps and runtime `checkpoints`.
  A permanent twenty-step case runs two independent mechanical loops before their
  respective applications. Full admission remains before writes. Review found
  that the canonical prepared application had not opted into composition; its
  action contract now does, using the same schemas and transaction owner.
- Prepare/apply: only fresh draft compilation without repair/material dependencies
  permits overlap. Per-branch receipt ownership prevents sibling contamination.
  Started pairs settle before failure delivery. Real browser evidence shows one
  rendered stage while the next is prepared, followed by both stages and correct
  Undo/Redo. A nonplanar second stage preserves the first applied stage.
- Discovery: the exact `smooth vector path curves` query previously missed existing
  handle editing. Its canonical metadata now explains Bezier curve editing and
  forceSmooth without claiming automatic visual smoothing. Exact names and
  compound all-term matching remain unchanged.
- Review/acquisition assessment: existing scoped-review tests already preserve
  unaffected facade passes and invalidate changed cross-region/overview evidence.
  Keep that behavior. The recorded 25,202-byte acquisition explicitly selected
  projected-face, surface-grid, pattern and optional plan, then its continuation;
  there is no demonstrated duplicate route to remove in those two calls. Do not
  remove selected constraints to force a byte reduction. Native declaration search
  remains distinct from App catalog search; no evidence supports changing provider
  ranking through App routing. No new geometry helper, exclusion subsystem or
  compulsory Knowledge lookup is introduced.

Focused validation passes: 115 runtime admission/execution/map cases; 467 App
node cases (two unrelated opt-in cases skipped); 22 created-target/retention cases;
two App conversation-store cases; twelve Inspector/recorder cases; and one browser
stage-visibility/Undo case. App typechecks, scoped lint and the naming gate pass.
The unchanged-prompt live run and unlimited same-session report also completed.
Mechanism tests do not establish model adoption or a stable speed improvement.

### Live validation outcome

The [staged execution report](../reports/taipei-101-staged-execution-2026-11-06.md)
records run `taipei-101-fixed-1793900303093`: 899.716 seconds of drawing,
602.310 seconds of reporting, no runner/evidence errors, unchanged report-phase
document and equal reload. All 122 frozen source/test/document hashes remained
unchanged through evidence completion; owned services stopped.

The AI successfully retained an authored draft through `source: "input"` and its
public root ID for possible later editing/recovery. No later named consumption
occurred. It combined ordering and ornament preparation/application in one call,
and two current-document queries in another. It did not submit `stages`, iteration
or direct inter-step argument bindings. Consequently this run proves live input
retention adoption, not adoption or speed improvement of stage-local iteration
or preparation/application overlap.

Drawing reached the deadline with complete building geometry but unfinished
visual acceptance. The report identifies omitted early draft retention, a
control-plane composition rejection, and a different unsuccessful curve query.
These are recorded observations, not authority to expand this implementation or
require a particular drawing strategy. The parent plan remains active.

### Follow-up implementation review

The artifact failure reproduces after selected result delivery, including a
non-final producer. The result envelope had no typed field provenance, and a
sequence exported only its default last output. The revised bounded fix exports
selected prior outputs through runtime admission and projects the host reply
from original owner schemas. Runtime execution schemas deliberately strip model
visibility annotations, so they cannot substitute for public delivery schemas.
The regression exercises actual ownership and canonical data review after return.

Direct retention lowers through the same sequence owner. Its optional controls
belong to the outer host entry; nested operations use the enclosing sequence's
controls and cannot silently ignore them. Facts/calculations retain source
validation. Region review reuses a pure canonical query schema and one canonical
value read, with membership/value revalidation. Explicit 18-minute admission and
runner guards are synchronized; the fixed drawing prompt is unchanged.

Focused follow-up validation passes: 114 shared runtime admission/execution
cases; 31 canonical creation/data-review cases, including the recorded smooth
ornament request; 73 discovery-delivery cases (two unrelated opt-in skips);
40 host and 122 review-stage cases; 25 evaluation-window cases; and 19 recorder/
Inspector cases. A separate direct-retention test also consumes the saved authored
draft through a new host request without returning it to the model. App typechecks,
runtime build, scoped lint, naming and scoped whitespace review pass. Discovery
retains its existing byte budgets (4944 bytes for the exact menu). The next gate
is the frozen-source live run, not additional implementation.

### Live-discovered correction and evidence recovery

Run `1793905217176` finished drawing naturally in 899.365 seconds and the
unlimited same-thread report in 521.246 seconds. All 130 frozen file hashes
remained unchanged. The host catalog exposed runtime leaf inputs without direct
retention fields while restoring the original scope declaration. Legal scoped
queries therefore failed before model adoption. The bounded correction is to
publish owner input contracts at the native catalog boundary and preserve the
separate runtime leaf admission. Add the actual failed query through the real
host before changing that boundary; do not relax scope validation.

Post-report browser evidence collection failed after the original browser closed.
Preserve the failed run and recover only its existing saved document in a separate
read-only replay, with model POST requests blocked, canonical snapshot comparison,
durable receipt, screenshots and owned-process cleanup. The original report and
raw video remain evidence; recovery does not turn the original run into a clean
pass or prove why its browser closed. Recovery does not launch another model drawing run.

### Follow-up completion

The three authorized handoffs and the post-live native catalog correction are
implemented and reviewed. The final real-host creation/catalog suite has 70
passing cases; scoped typechecks, lint and naming pass. The original live source
remained frozen throughout drawing/report and cleanup. Its drawing completed
naturally in 899.365 seconds, with seven applied stages and eleven saved names;
no named consumption, direct-retention adoption, region data-query adoption or
explicit repair loop was observed. The same-thread report took 521.246 seconds.

Original browser closeout failed and remains marked failed. Separate read-only
recovery confirmed canonical equality against the work snapshot, durable sequence
584/584, no AI requests, no page errors and unchanged original evidence. The raw
24m10s video decodes and its 400s/900s frames show the fitted complete building.
The native catalog correction was validated after this run through focused tests;
the live artifacts do not represent that later correction. See the
[full follow-up report](../reports/taipei-101-continuation-contracts-2026-11-06.md)
and linked original AI report. Broader model adoption and the cause of the browser
close remain outside this bounded implementation's completion claim.

## Strict continuation regression task

Authorized November 6 after the continuation-contract report. This task owns
three concrete follow-ups: native host contract acquisition and bounded mutation
receipt delivery; explicit Fill-mode and painter-order regression cases; and
reliable live evidence capture plus early work interruption that preserves the
original provider thread for an unlimited report. The current implementation
worktree is the base; all existing changes are preserved.

The discovery universe is the recorded run `1793905217176`, its actual requests,
the direct App action/host/provider/recorder owners and their existing tests.
No new editable document store, automatic artistic judgment, mandatory Knowledge,
shared-component redesign, compatibility branch, release gate, full local test,
commit or push. Authoring templates remain snapshots for tool inputs; canonical
shared properties/elements retain their existing Core semantics.

1. Compose/delivery: preserve the corrected native input catalog and replay its
   actual scoped query through the real host. Extend existing retained mutation
   receipts to the canonical mutation-receipt result kind, including fills, while
   preserving complete internal bindings, failure/partial/no-change status and
   explicit paged readback. The 1.49 MB six-operation request is the regression,
   not a new blanket status-only policy. Retention failure must never replay writes.
2. Prepare/edit: make choosing a solid paint mode part of the existing position
   mapping operation, using the canonical Fill fields and one plural write.
   Preserve ordinary field-only mapping when conversion was not requested.
   Prove the recorded gradient/color case and existing order operations using
   real canonical state, including no unrelated shared-source edits. Known
   ordering can be composed; visual judgment stays with the AI.
3. Evaluation: bound snapshot transfer through the existing recorder, preserve
   complete source/report evidence and recording, and trace browser lifecycle.
   Add explicit evaluation-only stop control using the existing work-interrupt
   path, then same-native-thread reporting. Ordinary requests do not stop on tool
   failures. Use permanent protocol and recorder tests before live execution.

Review each owner, handoff and focused regressions before advancing. Compose
consumes registered contracts and returns bounded public results plus retained
references; canonical full receipts remain authoritative. Edit consumes explicit
paint/order decisions and returns actual mutation evidence. Evaluation consumes
work/progress evidence, interrupts and settles work, collects the original AI
report, then verifies durable document equality and closes owned services.

### Task-local live acceptance and stop conditions

The latest user instruction supersedes the initial ten-run limit: this goal may
start at most **30** live 101 runs. This limit applies only to this goal and is not
a permanent runner default. Count a launch before starting its runner and keep
all attempts, including startup failures. Never launch attempt 31. At the limit,
stop goal execution and produce the same detailed aggregate report as on success.

Use the fixed prompt unchanged, a fifteen-minute drawing ceiling and unlimited
original-thread reports. Following the user's refinement after attempt 12,
blocking tools (including partial/unknown execution or failed research),
missing/incorrect App data that prevents execution, and abnormal interruption
stop drawing. Owner-declared correct_input with proven safe settlement remains
repairable in the same turn; a correlated native summary does not override it.
The first failure is latched; preserve acknowledged writes and request reporting,
not a second drawing turn. Reports and evidence collection continue after work
stops. Successful recording of failed visual criteria is ordinary design feedback:
allow geometry/material correction within the same drawing window. Waiting,
incomplete artwork and evidence not yet collected are not tool failures.
Uncertain observations are reviewed against actual calls; they
are never silently treated as a passing run. Result truncation or evidence failure
prevents acceptance even if detected after work has naturally settled.

Freeze source, prompt and run policy during each live attempt. After a failed
attempt, retain its original AI report and source identity, reproduce the issue
with a permanent focused test, revise the affected owner contract if necessary,
repair and review before the next attempt. Completion requires a full accepted
run without these failures, complete same-thread reporting and evidence/cleanup.
The final report lists every launch, stop reason, repair and actual adoption;
model self-assessment and measured evidence remain distinct.

The aggregate report must map each failed attempt and timestamp to its evidence,
root cause, exact correction, focused validation and the subsequent attempt that
actually exercised and verified that correction. A later run that did not exercise
the corrected path is not live confirmation. Link every original AI report.

Implementation progress: canonical mutation receipt delivery now retains complete
internal IDs while returning counts and existing receipt references. The recorded
six-operation fill/order request passes through the real host with canonical
painter order; large receipts, no-change, partial/failed/invalid owner output and
retention failure have focused coverage. The first receipt slice passed 93 focused
tests and naming validation. Live verification is still pending (0/30 launches).

The Fill slice now supports explicit solid conversion in one plural mapping write.
Focused tests preserve omitted-mode behavior, selected-owner source linkage and
unselected users; the old shared-Fill conflict wording was removed. The evaluation
slice uses recorder-owned opt-in control (`TAIPEI_101_STRICT_STOP=1`) scoped to the
exact work deadline. App/native failures and confirmed rework interrupt work while
preserving same-thread reporting; ordinary requests retain recovery. Snapshot
transport captures and serializes once, transfers bounded chunks and releases
handles. Real remote-browser recording remains exportable after capture.

For this task, launch the unchanged fifteen-minute benchmark with the strict flag.
Increment `tmp/continuation-iteration/attempts.json` before each runner launch.
A confirmed App data/execution blockage is supplied by updating that run's
`provider-records/evaluation-control.json` with its unchanged deadline, enabled
policy and `stop: {kind: "tool-failure", message, callId}`. The provider latches
the first failure, rejects subsequent work and records the reason in the retained
work exchange before reporting. Inspect actual calls/public activity; do not infer
rework from ordinary waiting or initial planned detailing. A stopped attempt is
never accepted merely because its report and evidence finish successfully.

### Attempt 1 correction

Run `1793940821364` stopped at 271.253 seconds before writes: the recorded
five-step invocation began with `define_design_criteria`, which inherited the
host's control-plane composition exclusion. The original-thread report completed
in 242.173 seconds. The report, source/reload evidence and video were retained;
empty-document detail captures were incorrectly reported as four evidence errors.
The report also confirms that generic interruption evidence hid the actual
`PREPARATION_REJECTED` reason from the original AI.

Bounded correction before attempt 2:

- Declare authored criteria registration composable at its existing request-state
  owner; preserve revision/invalidation semantics, not an automatic quality verdict.
  Replay the recorded five-step input and verify downstream admission before the
  next live launch. Reference selection and visual judgment remain explicit.
- Deliver the single `execute_design` host entry eagerly alongside discovery.
  Its current deferred declaration required repeated native search even after the
  App supplied its contract. Do not make every domain tool eager or invent aliases.
- Include the first actual bounded tool error/settlement in same-thread report
  context. Keep the immediate stop and retain complete external evidence; do not
  replay the failed invocation to reconstruct its result.
- Mark detail images not applicable only for a proven empty document. Missing
  bounds for a nonempty drawing remain an evidence failure.

Use permanent recorded regressions and targeted provider/recorder tests. Review
these owner handoffs and preserve ordinary request recovery, current criteria
semantics, immutable failed-run evidence and the fixed prompt. The task-local
launch count is 1/30; no second launch until correction and review pass.

### Attempt 2 correction and bounded iteration

Run `1793942054718` applied base and tier stages, then stopped at 218.218
seconds on four result-delivery issues: whole outputs included request-owned
artifact handles, and authored native inputs were selected through the action-only
`/arguments` wrapper. The browser disconnected during work snapshot capture five
seconds later. Its HTTP disconnect cancelled the active original-thread report;
the ephemeral thread was terminated and no complete report is recoverable.
Preserve that gap explicitly; never replace it with another AI's reconstruction.

This iteration supersedes the assumption that chunking return values alone bounds
remote snapshot messages. Playwright also sends primitive JSHandle previews; a
handle to the entire JSON string exports that string before chunk reads begin.
The first owner correction is snapshot transport: keep serialized text behind an
object handle, and test handle creation as well as chunk replies. Next, separate
recorded evaluation reporting from browser evidence availability after drawing
settlement. Only recorder-armed evaluation reports may survive transport closure;
ordinary request cancellation and tool cancellation remain unchanged. The runner
must wait on retained provider completion even if the browser disappears, collect
the report independently, then clean up its owned services. No report time limit.

The result-selection slice then checks the actual delivered source/result paths
against the authoritative selector compiler and output provenance. Publish a
single unambiguous authored-input view, validate known selections before writes,
and keep request handles in their existing lifetime. Do not silently prune saved
values, prolong artifact leases, replay acknowledged work, or claim that earlier
successful writes mean retention succeeded. Define the exact contract and tests
before that slice begins.

Step execution: runtime-handoff evaluation/report route and recorder evidence
consumer first. Allowed files are the provider, snapshot/report/runner helpers,
their focused permanent tests, and directly corresponding API/spec/Inspector text.
Prove oversized primitive preview rejection before changing snapshot code, then
same-thread report survival after transport loss and unchanged ordinary abort.
Review these handoffs before advancing to result selection. The count is 2/30;
no next launch until both slices and their focused gates pass.

Result-selection execution card: the existing host sequence/result owner will
expose `source:"input"` relative to each operation's ordinary arguments for both
native tools and canvas actions; internal action wrappers are not public selection
roots. Validate literal input pointers during admission, before effects. Preserve
runtime checks for resolved dependencies and dynamic storage failures. Discovery
must distinguish request-scoped result fields from portable continuation fields
using registered lifetime metadata, and reject a known nonportable whole-result
selection before drawing. Do not alter the stored value or create artifact copies.
The recorded base/tier selectors are the regression input; a corrected selection
uses `/draft` and `/compositionIds`. Confirm the exact recorded invalid selection
performs zero writes and the corrected small canonical draw saves/reuses both
input and IDs. Full recorded geometry remains a live validation, not a unit claim.
Allowlist: sequence compiler, result-delivery owner, host capture boundary,
lifetime metadata helper, discovery projection, their focused tests, API/spec and
Inspector contract. No SceneTree component/template or geometry changes.

Attempt 2 correction review: snapshot initializer and chunk limits, same-thread
transport-loss reporting, independent retained-report waiting, literal selector
admission, ordinary input roots (including generated target-bound batch wrappers),
and portable-field discovery now have focused regressions. The prior invalid
retention fixture is immutable; its corrected companion uses selected source and
composition fields, not a whole request-bearing receipt. Review updated the old
criteria/facts tests to retain portable selected outputs while preserving their
owner behavior. Type checks, scoped lint and Inspector/recorder contracts pass;
final eager-provider checks precede launch 3. Attempt 2 remains failed and has no
complete AI report. Only the next live run can confirm paths it actually exercises.

### Attempt 3 contract iteration

Run `1793943438488` stopped at 287.582 seconds before drawing, after successfully
saving selected fact/calculation fields. Its complete original-thread report took
260.608 seconds; empty-document evidence, equality and video finished without
errors. The original input selected `/compositionIds`, `/artifactId` and
`/toolOutcome` for delivery and also attempted to save artifact handles. The host
reported only `/output Source path is absent or not guaranteed to exist`.

Re-audit the first inconsistent owner rather than weakening recipe guarantees:
compare every actual selector with registered success schemas, the host-added
outcome envelope and the runtime binding proof. The host always attaches an
outcome, but the schema currently permits absence; prove this mismatch separately
from legitimately conditional workflow artifact fields. Keep conditional fields
conditional. Publish guaranteed binding fields and request-scoped fields alongside
portable selections from the same schema authority, and identify each rejected
selector by channel, alias, step and path before executing. Do not extend artifact
lifetimes, silently prune storage or remove a recipe's dependency validation.

Execution card: runtime-handoff registration, selected-result admission and usage
projection. In-scope files are tool-contract.ts, local-tool-host.ts,
local-tool-leases.ts, local-operation-tools.ts, local-design-sequence.ts, their
focused tests and matching API/spec/Inspector text. First replay the five recorded
paths, then prove host-added outcome presence, truthful conditional-field
classification, exact selection diagnostics, and preservation of nested schemas,
output validation and no-write rejection. Full original selectors stay immutable;
a corrected small draw proves executable delivery without replaying live work.
Review before launch 4; count remains 3/30 until that launch is recorded.

Owner proof refinement: adding required metadata alone is insufficient because the
runtime treats a compound result as opaque when its required outer field is
redeclared by branches, even identically. Extend this slice only to
`packages/ai-agent-runtime/src/recipe-schema.ts`, its recipe-admission regression
and the package contract paragraph. Permit exactly identical repeated field
schemas under the existing safe compound-boundary proof; differing schemas,
lifetimes and unsupported constraints must still fail. Normalize the host-owned
outcome to one canonical schema after the unchanged owner-value validation.
This is a generic schema proof, not an application-name exception or a weakening
of optional field presence. Build only this runtime dependency for the live App.

Attempt 3 review refinement: host acknowledgement is mandatory in registered
host/model schemas, while raw owner and nested action projection retain their
pre-acknowledgement contract. The same field is not made mandatory before the
host has added it. Existing partial/failed owner receipts remain intact. The
recorded template-retention regression now expects early rejection and zero
writes for request handles; its portable companion still draws and saves.
Ordinary action input delivery and retention share the same regression.

Schema-size review found a measurable regression from copying host metadata into
every open union branch. Keep the required guarantee at the outer host result;
normalize only existing metadata declarations and branches that restrict added
properties. This preserves the same runtime field proof without redundant
declarations. The fixed full-acquisition and per-message budgets remain acceptance
criteria; separately measure any necessary result-contract byte increase.

The size review resolves at the host-owned envelope: validate the canonical outcome
once at the root. Closed child branches admit that root-owned metadata without
duplicating or narrowing it. Extend the generic non-narrowing field proof to a
boolean true schema, which introduces no extra constraints; false, different types
and lifetimes remain rejected. Keep fixed full-exchange and per-message byte budgets. Explicit machine
result schemas do not repeat portable-field summaries already encoded there;
default usage retains the concise lifetime and guarantee summaries.

The reference regression exposed a missing rebase at the acknowledged delivery
failure envelope: executionResult was inserted without moving its local references
under /properties/executionResult. A permanent projection test fails on that exact
unknown-reference error before correction. Rebase at that owner boundary; preserve
the acknowledged result and partial delivery rather than replaying the mutation.

Byte-gate review: two selected-schema-only snapshots exceed the old contract
allowance by 106/205 bytes because the host outcome is now guaranteed. This is
not a transfer regression against the historical complete workflow: retain the
unchanged 24 KB message cap, whole-acquisition bound against the former two
queries, and oval contract-plus-authored-input bound. Remove only the redundant
old selected-schema sub-budget assertions; do not enlarge the frozen historical
fixture or the full-exchange budgets. Report this acceptance distinction rather
than pretending all intermediate byte snapshots improved.

Attempt 3 owner review is complete. Focused evidence: 77 runtime admission cases,
11 selected canonical host cases, and 79 discovery/projection cases pass (two
existing skipped cases remain skipped). The added failure-envelope reference test
passes, as do server types, scoped lint, naming and Inspector/recorder contracts.
The two snapshot-only byte assertions are superseded by unchanged full-exchange
limits as explained above. No live verification is claimed before launch 4.

### Attempt 4 classification

Run 1793946411154 stopped at 185.862 seconds on whole-result retention of
baseReceipt. The complete 269.175-second same-thread report and video are intact.
The actual provider pages include wholeResult=request-scoped, portable composition
IDs/outcome, request fields and guaranteed fields. The original AI acknowledges
that it chose an illegal whole result despite receiving these constraints.
Admission rejected before effects, as intended; the proposed preflight already
exists. Do not manufacture a production fix for an invalid model choice or weaken
request ownership. Preserve the full request as a regression and prove a selected
portable result plus authored source succeeds with small canonical geometry.
The same request also selects conditional artifactId for delivery; the corrected
companion removes that unguaranteed field. Launch 5 evaluates adoption again on
the same production code. This is not a claim that model misuse was repaired.

### Attempt 5 bounded replan

Run 1793947050700 repeated the retention mismatch with an individual artifactId
selector. It stopped at 257.124 seconds; its original-thread report completed in
422.973 seconds with intact evidence. The AI explicitly acknowledges violating
the received lifetime metadata. Existing preflight is correct. The upstream App
prompt still broadly asks for useful public output retention, while the actual
App context admits portable values only. Discovery lists possible fields together
and describes lifetime categories rather than the actual retain permission.

Compose-owner correction only: remove the broad public-output retention wording
from App and host descriptions. Publish conversation scope, explicit whole-result
retention permission, guaranteed portable and forbidden result paths, and distinct guaranteed
and conditional delivery fields from the same registered schema/lifetime owner.
Preserve complete owner schemas on explicit machine queries, existing context
storage, runtime validation and request lifetime. Do not add request storage,
copy artifacts, prune saved values, introduce automatic model repair, require an
extra preflight call, or change the drawing prompt. This addresses a contradictory
contract surface; it cannot guarantee model obedience.

Step card: compose/native contract delivery, with existing host/lease/compiler
validation as downstream acceptance. Allowlist: local-operation-tools.ts,
local-design-sequence.ts, ai-domain-prompt.ts, the matching retention sentence in
local-design-workflow.ts, their existing contract tests,
recorded attempt-5 fixture, and matching API/spec/Inspector text. First add
regressions for explicit actionable retention metadata and the original fifth
request; prove invalid handles still reject without effects, while selected
composition IDs and authored inputs execute/save/reuse. Review complete delivered
queries and unchanged full-exchange budgets before launch 6. No broad local suite.

The attempt-5 review also covers machine-schema usage: it must receive the same
retention permission summary as concise usage. A red integration case proves the
summary was absent on includeResultSchema=true; remove that inconsistent omission.
The explicit result schema still replaces the concise delivery-field summary.

Attempt 5 review: 97 discovery/prompt tests and six selected host regressions
pass; two existing discovery cases remain skipped. Machine-query pagination is
consumed via contentDelivery.next, matching the production contract. Server types,
scoped lint, naming, fixed full-exchange budgets, and Inspector/recorder contracts
pass. Existing request-handle rejection and portable App storage behavior remain
unchanged. Live adoption is unverified until a later run exercises it.

### Attempt 6 evaluation correction

Run 1793948243380 successfully composed facts/calculation/criteria, saved portable
facts/criterion IDs, then drew 10,025 applied elements and saved roots/authored
source. This is the first live exercise of the criteria composition correction and
the previously failing result-selection adoption. The 75,131,495-character work
snapshot, original-thread report, 53,735,087-byte video and unchanged reload are
complete. These successes do not constitute visual acceptance.

The first failure was a recorded visual fail at 362.357 seconds. Strict evaluation
missed the canonical checks/recordedChecks arrays because it inspected only count
summaries; it stopped 30.543 seconds later on missing delivery selector paths.
Preserve both events and the original report's actual stop reason. Do not rewrite
evidence to imply immediate stopping. The geometry/material criticism is an AI
visual decision, not evidence of a renderer bug. Missing path was correctly
rejected; do not weaken selector validation or replay the already applied tower.

Evaluation-owner step: preserve typed tool failure versus corrective-rework causes
through every provider observation path. Consume canonical recorded review
judgments, not arbitrary embedded user fields, pending checks or accepted=false.
Use the actual sixth-run review receipt as a red regression, then prove the
production provider interrupts once, starts an unlimited report in the original
thread, and preserves the first reason. Ordinary requests keep recovery behavior.
Allowlist: evaluation-control.ts, its focused test, the three direct provider
observation consumers, focused provider lifecycle tests, the recorded fixture and
matching API/spec/Inspector documents. No geometry, storage, Knowledge or drawing
prompt changes. Review these handoffs before launch 7.

The source-bound Inspector candidate exposed four stale proof assertions from
earlier accepted slices: deferred host entry, retired menu wording, the removed
no-template-overrides claim, and a redundant selected-guide-only byte ceiling.
Extend this bounded verification slice to those four existing assertions in
execution-flow-proof.test.ts. Assert the current eager host and template override
contracts, execute their existing examples, and preserve the unchanged 24 KB
message cap plus total guide-and-authored-input cost bound. Do not increase the
immutable baseline or remove whole-task cost checks. This is proof alignment, not
a production or drawing-prompt change.

Proof review found a separate accepted-feature cost: shared-motif guide bytes are
39,388 versus the old 37,023 adjusted ceiling (+2,365), before these evaluation
changes. That historical guide did not describe template overrides or portable
retention. Record this regression rather than claiming historical byte savings.
For this proof, preserve the original two-message maximum and 24 KB/message limit,
verify canonical override delivery and execution, and compare compact versus
expanded authored input with the same current guide. The projected-oval proof
retains its historical total-cost bound; combined acquisition retains the real
36,443-byte two-query baseline. No immutable evidence or baseline was rewritten.

Attempt 6 correction review passed: actual receipt regression, 11 evaluation
control cases, 20 provider lifecycle/recovery cases, and 85 captured execution-flow
cases; server/proof types, scoped lint (existing console warnings only), and
15 naming checks passed. Candidate 9893da71-20f9-4b7f-9630-4ebaea0d1f89
captures the reviewed source. No live verification of the new stop path is claimed
before the next launch. The retained original attempt 6 stop remains unchanged.

### Attempt 7 - confirmed rework and bounded example review

The seventh strict attempt stopped immediately on committed visual failure at
389.264 seconds; same-thread reporting completed in 327.323 seconds. It applied
13,920 elements without a failed tool, saved portable IDs and authored inputs, and
retained complete video/snapshot/reload evidence. This is live verification of the
attempt 6 monitor fix, not visual acceptance. Repeated cell-local gradients looked
convex. The supplied contract explicitly says gradients restart per projected box;
the submitted draft uses these gradients and no linearFields. Do not label faithful
rendering a renderer bug or force Knowledge/visual style to manufacture a pass.

Compose step card: the actual selected query includes projected-face, surface-grid,
pattern and vector. Adding vector makes first-valid-example selection fall back
from the existing mixed material composition to the earlier one-vector example.
This is a concrete example-coverage regression, not proof of the visual root cause.
Keep the already authored composed-material and mixed-component examples ahead of
the minimal vector example. Exact vector-only queries must still receive the valid
vector example. No new geometry, schema, registry, prompt instruction or tool.
Test the recorded query before the owner-order change, execute the delivered
example, preserve narrow selections and per-message delivery limits, then review
the direct discovery consumers. Allowed mutations: design-preparation-examples.ts,
its existing discovery consumer tests, recorded query fixture, and matching
API/spec/Inspector description. Stop this slice if ordering forces unsupported
content or changes canonical rendering. Run focused discovery and flow cases only.
The next live run tests adoption; it cannot pre-certify fewer visual revisions.

The recorded-query regression failed before implementation because the delivered
example had no world material or composition. Example ordering also exposed three
test fixtures indexed by array position; select their existing named fixtures
explicitly in discovery-delivery and local-design-workflow tests. This direct
consumer correction preserves their original test geometry and assertions.

Bounded replan before another implementation iteration: global example reordering
changed the unscoped menu from 4 KB-class to 5,962 bytes and broke two existing
selection expectations. Reject that approach and preserve the original example
array and fixtures. The semantic owner is projectWorkflowInput, which already
filters valid examples and ranks selected optional inputs. Add selected node-kind
coverage as a tie-break only there, computed once per valid owner-authored example
from the declared selection. No node-kind allowlist or model-supplied example data.
Unscoped discovery and single-kind scopes keep their existing behavior. Revised
allowlist replaces design-preparation-examples.ts with design-workflow-discovery.ts;
retain the recorded-query fixture, discovery test and matching docs. The integration
fixture deliberately has no inspection executor; verify canonical apply completion
and its existing FOLLOWUP_UNAVAILABLE receipt rather than inventing total success.

Attempt 7 correction review: 74 discovery cases passed (two unrelated opt-in
cases skipped), the direct visual-handoff consumer passed, and all 85 captured
execution-flow cases passed on candidate b4fdbfe6-4699-4208-a492-8d67dc74c23c.
Server types, scoped lint and 15 naming cases passed. Actual broadened query stays
one response below 24 KB; vector-only invocation arguments are unchanged.
Live adoption and visual effects remain unverified until the next launch.

### Attempt 8 - native detail contract and specific stop evidence

Attempt 8 applied 14,420 elements, then stopped at 378.428 seconds on partial
capture. Workspace overview succeeded; three full composition detail captures
exceeded the native 1024-pixel edge limit. Same-thread reporting completed in
322.630 seconds; evidence and reload equality are complete. Selected Assembly
example delivery is live-confirmed, but the AI still authored per-cell gradients.
There was no visual judgment, so this run does not verify material improvement.

Compose/inspect step card: the actual capture guide publishes region width/height
<=1024 but gives view only an enum. Whole-target native detail has the same limit,
communicated only after failure. Reuse one App-owned inspection edge constant
through shared inspection schema, action output/description, common capture call
and recovery message. Publish detail-without-region semantics on view itself so
selected usage retains it. Preserve existing overview, small-element detail, explicit
region, workspace restriction and no-crop/no-rescale native semantics. No new cap,
renderer change or automatic target selection. Allowed files: ai-design constants,
inspection-schema.ts, inspection.ts action/common API, local-design-review.ts
registered contract, their focused tests and recorded fixture, API/spec/Inspector.
Prove the missing selected contract first, then verify actual capture arguments and
valid region/oversize behavior; review before advancing.

Observe/report step card: canonical partial review contains individual actionResults
with concrete capture errors, but evaluationToolStop currently chooses the generic
outer message first. Preserve the first typed failed child message from this known
receipt structure before the aggregate partial message, with existing bounded size
and first-stop latch. Do not inspect arbitrary user data. Keep parent call identity
and original-thread unlimited report. Use the actual eighth-run receipt as a red
regression and prove the specific native-detail cause reaches the provider report.
Allowlist: evaluation-control.ts, its tests, direct provider report regression and
matching docs. Complete both owner slices before launch 9.

Capture slice review passed: the actual selected guide regression and eight
inspection tests preserve full-target native rejection and explicit region
recovery without crop/rescale. App/server types, scoped lint and naming pass.
The existing Pixi snapshot owner rejects native bounds over maxDimension before
rendering; no renderer implementation change is needed. Inspect action revision
advances 3 to 4 and review tool revision 18 to 19 for the published input contract.

Report slice red/green proof uses the exact aggregate capture receipt. The native
provider test restores only a synthetic PNG transport body omitted by saved model
receipts; failure details are unchanged and no visual judgment is simulated.
Twelve control tests and 21 provider lifecycle/recovery tests pass. The report
request now contains the specific 1024-pixel recovery condition. This proves
diagnostic delivery, not that the original AI saw the successful overview image.

Attempt 8 final review passed on captured candidate
d0e3aaad-1e71-42a6-9c4c-8ee02d78dac1: 85 execution-flow cases, 75 discovery
cases (two unrelated opt-in skipped), eight inspection cases, twelve evaluation
control cases and 21 provider lifecycle/recovery cases. App/server type checks,
scoped lint and naming passed. No source edits during the live run or its report.
Specific-failure reporting and correct native-detail selection still need later
live evidence; do not revise attempt 8's original AI report to imply it knew them.

### Attempt 9 - continuous material on repeated grid motifs

The ninth run applied 15,174 elements and stopped on material failure at 635.038
seconds. Its original-thread report completed in 410.208 seconds; video, snapshots
and reload equality are intact. All four captures were overview, so neither new
native-detail selection nor child capture diagnostics received live verification.
Portable retention and immediate recorded-review stopping were exercised again.

Repeated pane-local gradients remain an authored visual problem, not a renderer
defect. The selected guide delivers world fields, but the canonical grid motif
schema/compiler accepts only fill/fills. Continuous backing faces or patterned
faces are existing alternatives; there is no proof that material creation is
impossible. The narrower gap is that the chosen repeated-grid primitive cannot
consume the existing continuous material calculation directly. Example ranking
alone did not resolve that gap or establish model adoption.

Prepare step card: extend the existing optional materialField reference to grid
motifs, including template overrides and translated pattern members. Reuse the
world-field owner and its affine plane derivation once per grid/field, then
normalize each emitted editable vector's bounds and world offset. Native fill and
palette behavior remain unchanged. Explicit materialField conflicts with fill or
fills reject; a template override selecting a different paint mode clears only
the inherited alternative mode, and conflicting fields in one patch still reject.
Preserve generated identities, painter order, field provenance, cancellation,
capacity/source-work accounting, retained source repair and material-only revision.
No inferred lighting, automatic material choice, rendering change, new persistent
relation, mandatory preview or drawing-prompt change.

Fixed discovery and mutation scope: the recorded ninth-run draft/selected query;
design-construction/schema, design-linear-field, design-motif-reference, their
existing preparation/budget/material-revision consumers and focused tests; the
existing selected material example and directly conflicting API/spec/Knowledge/
Inspector text. A permanent recorded fixture must preserve the submitted native
fill baseline. Regressions first prove grid-field rejection, then compare every
sampled world phase against the shared world equation for tapered cells, offsets,
translated instances, reversed/constant fields and template variants. Assert plane
solve counts independent of cell/instance counts, source immutability, canonical
admission and retained material revision. Invalid keys/conflicts remain no-write
failures. The discovery example must execute and preserve bounded full acquisition.

Review: this replaces further prompt/example-only tuning. Work remains in the
prepare owner and its compose contract; inspect still owns visual acceptance.
Focused owner tests, direct-consumer checks, scoped types/lint/naming and captured
execution-flow cases precede launch 10. Live adoption and appearance are separate
outcomes; do not claim this capability guarantees a visually accepted first draft.

Review found the direct export handoff also needs the referenced field definitions:
read_design_templates previously exported motifs without linearFields. A failing
export regression precedes adding this portable map through the existing source
owner and result schema. No new store or handle lifetime. Preparation/template
export revisions advance to 3; main preparation workflow advances to 6.

The captured proof also pins a freshly authored preparation recipe to the current
revision (3), preserving rejection of stale dependencies. Source-capture review corrected the fixture handoff: the supported runtime
source declaration excludes **tests**, regardless of proof implementation paths.
Keep this new permanent recorded fixture in test-data/ai-drawing/fixtures and
explicitly declare that input, following existing captured evidence conventions.
No capture tool or authority bypass is changed. The paint-schema test
oracle was corrected to use the validator's input-first signature, then proved
red with the candidate exclusion removed and green with it restored.

Attempt 9 correction review passed: 51 material/template tests, 75 discovery
cases (two unrelated opt-in skipped), five final grid/schema cases, three focused
export/lifetime cases and 86 captured execution-flow cases. Server/proof types,
scoped lint (one existing console warning), naming and diff checks passed.
Candidate 315e408d-0978-4921-b337-5374667341ab captures the reviewed implementation.
The native-detail/report diagnostics from attempt 8 still have no later live
exercise. Launch 10 will test model adoption of optional grid material fields;
no first-draft quality or no-rework guarantee follows from these local proofs.

### Attempt 10 - parent-space misuse, no insertion behavior change

Run 1793955783162 applied 17,372 elements and stopped at 439.486 seconds on
whole/view visual failure. Original-thread reporting completed in 377.573 seconds;
video, snapshots and reload equality are complete. Tower motifs actually used
sunGlass and shadeGlass materialField overrides; this verifies grid-field adoption
and successful application, not completed material visual acceptance. Ten named
values were acknowledged and taipeiRoot was consumed three times across calls.

The actual selected provider guide already states that parentId uses parent-local
coordinates and omission inserts into the workspace. The first tower is a root;
base/crown/ornaments retain the same world projection but name that tower as parent.
Saved canonical positions show the tower origin at (8420.687804755104,
11068.80898442604), added to the later groups' local positions. The AI report
acknowledges the coordinate assumption and did not read current parent geometry.
This is not evidence that Group normalization or canonical insertion is defective.
Internal capacity continuation is separately source-anchored; it must not become
an implicit transform for arbitrary parentId calls.

Bounded verification card, prepare/apply: preserve the actual four submitted
drafts, parent selections and saved root positions in a permanent fixture. Prove
canonical preparation reproduces those local placements and the added parent
translation. Compare omitted-parent workspace insertion against the same intended
world coordinates; existing grouping can organize completed roots afterward.
No automatic coordinate inference, new placement API, prompt changes or production
geometry changes. Mutation scope is the fixture, its focused regression, existing
plan and evidence record. Run that regression and the existing parent-application
consumer case, then repeat the live test on unchanged product code. Do not label
this a runtime fix or claim the next run verified it unless it uses the same
affected parent/coordinate path successfully.

Attempt 10 classification review: all four real drafts reproduce the saved local
root positions; five signed-coordinate cases and three parent-application consumer
cases pass. The consumer suite uses its declared jsdom environment (the first
node-environment invocation could not collect tests); no canvas rendering claim
follows from these cases. Server types, focused lint and diff checks pass. Product
source hashes are unchanged from launch 10. No insertion or prompt fix is claimed.

### Attempt 11 - evaluator false positive, not repeated parent displacement

Run 1793957004552 was externally interrupted at 515.282 seconds after two
successful applications. The original-thread report finished in 339.426 seconds;
video, snapshots and reload equality are complete. The evaluator claimed the
second part reused workspace projection under a nonzero parent, based on the
previous run's failure. Inspection of the actual saved document disproves that
claim: parent design-46dabc90-f1a8-4cda-b01c-d52af85020e7-0 is a Frame directly
under workspace with x=0, y=0 and rotation=0. The child Group's local position is
(12113.924588680375, 10337.283311482286); this parent adds no displacement.
The erroneous stop arrived about 93.5 seconds after the successful tiers write,
before the next crown write. This is an evaluation failure, not a demonstrated
App or model coordinate failure. The launch still counts toward the 30-run cap.

The original AI report explicitly relied on the supplied stop reason without
reading coordinates again. Its agreement is not independent evidence. Preserve
that report, the original stop message and all run files unchanged; the attempt
ledger and final aggregate must disclose this correction and its author.

The premature classification also invalidates the claim that attempts 10 and 11
repeated the same product defect. Existing hierarchy.moveElements already reaches
the Preset group-geometry owner, which can preserve translation-space placement
when moving through Groups. Its current world-position helper sums translations;
do not generalize that evidence to arbitrary transformed containers. This is an
existing capability to evaluate, not evidence that another tool must be added.

Revised bounded verification card: preserve the actual attempt 11 base and tiers
inputs and their canonical root positions next to the attempt 10 regression.
Prove zero-origin Frame attachment and displaced Group attachment separately;
call-shape similarity and matching projection origins alone cannot classify rework.
The next regression must fail if it treats the Frame's projected content origin
as the Frame's own position. No product placement or prompt change is justified
by attempt 11. Scope is the recorded fixture, signed-coordinate regression,
existing plan and attempt evidence. Re-read the prepare/apply contracts, run the
focused cases, then review this classification before any further live launch.
For external manual stops, require current canonical evidence of the violated
invariant; automatic typed failures and committed failed judgments remain strict.
Do not claim either completed drawing or visual acceptance for this interrupted run.

Attempt 11 correction review: six signed-coordinate regressions pass, including
the exact zero-origin Frame and nonzero Group records. Server types, focused lint,
naming and diff checks pass. This corrects an evaluator assertion, so no red
production bug or product repair is claimed. The current prepare/apply contract
and Inspector step remain unchanged. No production or prompt hashes changed;
launch 12 repeats the same product with the corrected evidence requirement.

### Attempt 12 and revised task-local stop policy

Run 1793958291931 applied 15,591 elements in four workspace roots. It stopped at
439.410 seconds on five committed visual failures under the then-current policy.
The original-thread report completed in 352.189 seconds; snapshots, video and
reload equality are complete. No tool failed before the visual stop. The authored
belt pattern translates all vertices by (-240,-240,3160) per instance while the
base narrows symmetrically. The second and third left edges exceed the intended
base by approximately 475 and 955 world units. Selected usage explicitly declares
translation, and surface-grid bilinear mapping already exists. The AI also omitted
visible spire cap faces and did not use delivered world material fields. These are
authored design issues, not demonstrated projection/compiler defects. Do not
implement automatic taper, clipping, hidden-face generation or new lighting rules.

The user now explicitly permits visual correction and ordinary iterative drawing.
Supersede the no-rework stop condition for future runs without rewriting earlier
evidence. Attempts 1-12 still count; the task remains capped at 30 launches. The
original prompt, fifteen-minute drawing limit and unlimited same-thread report
remain unchanged. Failed execution, unavailable/incorrect App data that prevents
the task, and abnormal interruption still stop. A successful review recording fail
is not failed execution; neither is pending evidence, unfinished detail or an
ordinary lookup for information not yet requested.

Observe/report step card: remove visual judgment/count based stop inference from
the recorder-owned evaluation control. Reject the superseded external
corrective-rework stop kind; external confirmed App failures use tool-failure.
Preserve typed native/App failures, nested actionResults causes, first failure
latching, the work deadline, cancellation and unlimited original-thread reporting.
Scope: evaluation-control.ts and tests, direct local-ai-provider regression,
runner evidence policy label and contract test, current API/spec/Inspector text.
First prove the old policy rejects continued work after a successful failed review.
Then prove the same native turn can issue the next tool, while real capture or
App failure still interrupts and reports in the same thread. Reuse actual recorded
review/capture receipts; do not erase judgments, alter acceptance or simulate visual
success. Focused control/provider/runner cases, types/lint/naming and captured
execution-flow proof precede launch 13. No drawing model prompt or product geometry
change is part of this slice.

Policy revision review passed: 24 focused control/provider cases and 12 runner
cases, server types, scoped lint (one existing console warning), naming and diff
checks. The provider harness initially attempted to observe manual replies through
the fake server's request-only callback; corrected it to await actual reply packets.
The corrected test then fails on the archived old controller and passes on the
new controller: successful failed review is followed by another accepted tool in
the same work turn, with no interrupt. Real capture/App failure, confirmed missing
App data, first-stop latching, explicit cancellation and untimed reporting remain
covered. Captured candidate 0886a65a-11f9-4f98-9314-7699be3c157d passes 86 flow
cases; accepted contract revision 7. This is the user-requested evaluation-policy
change, not a claim that the interrupted artwork has been repaired.

### Attempt 13 - selected host image delivery loses its media channel

Run 1793959745424 verifies the revised policy: failed visual judgments at 377.365
seconds were followed by successful discovery, target reads, deletion and three
solid Fill mappings, new corrected geometry and grouping in the same drawing
turn. The combined deletion/mapping request was 2,366 bytes and returned only
84 bytes of execution status. This exercises bounded mutation delivery and solid
conversion; it does not prove final appearance. Eight source/root aliases were
saved, without named consumption.

The first established product defect occurs at 582.060 seconds: the group call
selects /actionResults into delivery.fields.receipt. That array includes a valid
inspect_drawing image and inspectionId. Host selection returns the requested
array under fields.receipt, but localToolContent only extracts images from the
top-level actionResults array. Provider tool_completed records 303,374 text bytes
and imageCount=0. Earlier direct review delivered two images and 4,846 text bytes.
This is a cross-owner envelope mismatch, not evidence that capture failed.

The AI then tried image discovery and binding. Binding succeeded but is not image
redisplay. Exact lookup of unregistered display_inspection failed at 628.599
seconds, triggering the automatic stop 46.539 seconds after the earlier delivery
defect. The image cause was established during later analysis, not detected live
at the first faulty handoff. The original AI independently reports Base64 without
visible pixels. Its unlimited original-thread report completed in 388.243 seconds;
video, snapshots and reload equality are complete. Preserve all original evidence.

Compose/provider-delivery step card: reproduce the exact group operation and
delivery.fields.receipt selection through the actual host and native content
adapter in the permanent image-delivery integration suite. Restore fixture image
bytes only from existing canonical test media; do not pretend redacted recorded
bytes are pixels. Trace selected output provenance and all supported delivery
envelopes before choosing the smallest repair. Preserve emitted pixels and their
inspection identity while moving Base64 out of model text into the native image
channel. Explicit status-only or non-image field selection must still omit images.
Do not walk arbitrary authored inputs as media, recapture pixels, replay grouping,
add a second store, infer visual approval or create an invented redisplay tool.
Read the exact compose/inspect/provider handoffs before implementation.

Bounded scope: localToolContent in local-operation-tools.ts, host result selection
and its direct local-result-delivery/native-provider consumers if provenance is
needed, image-delivery integration and selected-delivery/provider tests, and
matching API/spec/Inspector contracts. Fixed discovery is the actual request,
response and provider imageCount evidence, current image schema/selection owners
and their direct tests. Prove the existing failure first, then selected single and
multiple receipts, direct native path, status-only/non-image suppression, malformed
media rejection, source immutability and one capture/one decode lifetime. No
geometry, App prompt, selection ranking, unrelated discovery or release changes.
Review and focused gates precede launch 14; count remains 13/30 until launch.

The exact selected receipt fixture is now permanent. Its image-delivery test
fails on the current adapter with zero inputImage items instead of one, preserving
the original inspection ID and restoring only known fixture PNG bytes. No
production image-delivery repair has been made yet. Existing direct-path tests
already exercise top-level capture but do not cover the selected host envelope.

Selected-delivery review also reproduces a contract mismatch in authored-input
delivery: the planner exposes ordinary arguments, while invocationSchemas validates
them against the native wrapper containing arguments. The permanent host case
fails with output.fields.chosen.arguments missing after a successful group. The
sequence planner owns wrapper removal; share that schema path with host selection
rather than duplicating a wrapper heuristic in the provider. This direct handoff
correction is in the selected-delivery scope; no search or drawing behavior changes.

The repair carries private invocation-local image provenance from canonical owner
receipts through output selection to the native adapter; it does not scan authored
input or add a retained media store. Full/native results retain canonical envelope
handling, selected fields keep identity metadata, status and metadata selections
suppress images, and repeated selected aliases decode bytes once. The exact
recorded grouping arguments are covered through the real host/planner/projection
with a stubbed browser owner; its fixture restores required internal fields and
owned leases explicitly rather than treating provider-projected text as a full
internal browser acknowledgement.

Four adjacent local-tool-host tests also fail on the archived attempt-13 source
with the same assertions (two old preparation-revision recipes and two browser
failure-fixture expectations). The baseline log is selected-image-baseline-host.log.
They are not regressions introduced by this slice and are not claimed as passing;
current selected-delivery tests and captured owner proofs remain the bounded gates.

Selected-delivery gates passed: 22 image/result-delivery cases, 12 focused native
provider/continuation cases, server and flow-proof types, scoped lint (three
existing console warnings), naming and diff checks. Replacing only the adapter
with the archived attempt-13 source makes both the recorded alias and real-host
selection regressions fail with zero images; restoring the repair passes both.
Captured candidate ee796eee-9613-443d-9eb4-9034ad76b503 passes 86 owner-flow cases
on source 0e61e17efcc3033f172763b176af003b15ae5b4472c108ee0731920dab4ab704.
Review 9e9d75149c6ee42ee3dc73bd9eab29781127a018c5e56e1a3ac20cc3e806e080
accepted the updated contract. The three opt-in external-native image probes were
not run; these focused transport tests use the project provider harness. Live
verification of the selected alias path still requires actual model use.

Attempt 14 completed drawing in 758.681 seconds and the original-thread report in
377.164 seconds. Evidence capture and reload equality passed with no errors.
Before final closure, reconcile the four baseline-failing adjacent host fixtures
with their actual current owner contracts: correct the old prepare_design revision
pin, and expose the failed-prefix envelope assertion before deciding whether its
fixture or production owner is wrong. This is test/contract review, not an artwork
change, and does not retroactively change attempt-14 evidence.

### Closure review - distinguish browser prefix from acknowledged host result

The two preparation fixtures pass after their revision pin moves from 2 to the
current 3. The two failed-prefix cases expose a real pre-existing boundary defect,
not stale expectations: local-tool-host.project recursively treats an embedded raw
browser executionResult as an independently acknowledged host reply. Native egress
requires toolOutcome, but the browser prefix has not passed that host boundary.
This creates TOOL_DELIVERY_INVALID inside the original AI_EXECUTION_FAILED receipt
and shifts the successfully completed prefix down another envelope. The existing
formal cases fail on both archived attempt-13 and current source; a stronger
actionResults assertion now shows the exact double envelope.

Step card: compose failure projection owns the correction. Preserve the current
mandatory outer host acknowledgement; recursively apply full host delivery only
to an already acknowledged embedded result. Raw browser prefix remains with the
existing operation failure projector, which strips diagnostics and preserves
public completed action receipts. Do not invent successful outcomes, replay writes,
weaken the public schema, flatten arbitrary nested output or change cancellation.
Bounded edits: local-tool-host.ts, its current failure/cleanup/projection tests and
matching compose API/spec/Inspector handoff. Run the existing red cases, adjacent
host/image/provider cases, types/lint/naming and captured flow proof. The completed
attempt 14 remains valid evidence for its source; launch 15 only after this owner
correction passes review. No drawing prompt or normal-refinement policy changes.

Closure boundary correction review passed: all 40 host tests, 22 image/result
cases, 14 provider cases and 87 captured flow cases pass. Server/flow-proof types,
scoped lint (one existing warning), naming and diff checks pass. Current bare
browser prefixes keep their original failure and completed public actions; native
cleanup results retain their mandatory acknowledgement. No replay and one owner
projection are asserted. Candidate a410ef2c-f401-4ca8-b0a1-429f81e42abc, source
9bce127fc4b2f9b38ed2e7f8251c5b96ca05a6c86a8fa11186888ee9e746ad65, review
9886a97fb3224a0fd047d9d59deffcf61ee1e53013d917b572e1a11a9f79d17e accepted.
This fixes the two actual baseline failures and corrects the two obsolete revision
pins; none remains waived. Attempt 15 verifies the final production source.

### Attempt 15 - literal target rejection and lost stop diagnostics

Run 1793964076499 stopped at 673.991 seconds. The original-thread report completed
in 355.332 seconds; video, snapshots and reload equality succeeded. The recorded
mutation requested the shaded ornament member prefix with expectedCount 24, but pattern expansion
places its instance name before the member name. A zero match correctly rejects
that deletion. Do not introduce fuzzy targeting, remove expectedCount or replay it.
Normal ornament refinement before that request is not an execution failure.

The report could not identify the failure because evaluationToolStop discarded the
host receipt's public string issues and retained only `Tool outcome failed`.
The concrete zero/24 message exists in both the failed child and aggregate issues.
This is a separate observe/report defect, not a missing geometry capability.

Observe step card: first reproduce the recorded child/aggregate failure-message
loss in permanent tests. Read the existing public issue list only after recognizing
failure; keep the first bounded concrete message, native thread and stop identity.
Do not inspect arbitrary value data, change target semantics, drawing prompts,
stop classification, recovery or transaction settlement. Scope: evaluation control,
its tests and captured report proof, fixture, current spec/Inspector and this plan.
Run focused control/provider/proof cases, types, lint, naming and diff checks before
the next live launch. Preserve the original report rather than retroactively adding
facts the drawing AI never received.

The recorded failure-message regression failed before the fix and now passes.
Provider evaluation cases preserve the concrete stop reason in report input. The
captured 87-case flow candidate 2af5fe85-70c9-4408-aaed-f6015a8bf09b passed; contract
revision 10 accepts the bounded diagnostic change. Canonical snapshot inspection
also confirms generated instance prefixes rather than missing elements.
The target-owner file has an all-contract coverage hook, so title-filtered execution
passes its six selected assertions but fails the file-level completeness hook.
Run the complete single owner file instead. Its old duplicate-image expectation
also conflicts with the accepted byte-deduplication contract; preserve all receipt
metadata while expecting one native copy of identical bytes. This test correction
does not change production behavior. No fuzzy selection or drawing guidance added.

### Attempt 16 - diagnostic delivery verified; preserve target guards

Run 1793965734324 applied 15,509 elements, then stopped at 525.023 seconds. The
same-thread report completed in 336.348 seconds; video and reload equality passed.
The AI used member-name prefixes against expanded grid/pattern names. Reflection
mapping selected zero rows and returned no-change; the following ring deletion
matched no targets and correctly prevented mutation. Later submitted drawing
steps did not execute. Canonical snapshot names and the exact query confirm this
is not missing App data or a compiler deletion defect.

The attempt-15 diagnostic correction was exercised: report input 299-input.json
contains the actual no-target/no-mutation message, and the original report now
separates no-change from unexecuted later work. Its suggestions for source-key
selection and template reuse describe existing capabilities not used in this run.
Do not add a parallel API, fuzzy selection, automatic broader deletion or forced
Knowledge reading. Launch 17 repeats the same product and fixed prompt; there is
no production change between 16 and 17. Normal visual refinement remains allowed.

### Revised iteration - correctable input is not an App blocker

Attempt 17 exposed a remaining mismatch with the user's revised stop policy.
The recorded spire face is nonplanar; preparation correctly rejects it before
writing and supplies correct_input, draftId, geometryIssue and repairGuide.
The evaluator still interrupts this ordinary correction. Attempts 15 and 16 also
show correctable target-selection rejection, not missing canonical elements.
Retain all original stop records; reclassify these evaluator decisions explicitly.

A second upstream/downstream defect exists: selected/status result delivery drops
the sequence's formal recovery values. Removing the evaluator interrupt alone is
insufficient because the model can lose the draft reference and repair path.
The next slice replaces repeated unchanged launches with this bounded correction.

Compose step: preserve the existing projected owner failure/sequence recovery
alongside saved/selected acknowledgements on unsuccessful delivery. Use the owning
recovery schemas and runtime-reference lifetime machinery; do not serialize raw
private values or require success-field selectors to anticipate errors. Success
remains compact. Cover ready batch, dependent sequence, selected fields and status.

Resolve step: valid complete region reads with empty/wrong-count matches reject
before mutations and expose correct_input with not-started settlement. Enforce the
count at the host target owner after the complete read, not through an opaque
browser exception. Incomplete/unavailable/unknown reads remain failures; do not
broaden names, invent targets or suppress missing data.

Observe step: permit explicit owned correct_input recovery with known safe
settlement through direct, multipart, host and transport envelopes. Preserve the
actual failed receipt, successful prefix and repair handle for the original AI;
never retry automatically. Unknown mutation settlement, invalid delivery, missing
App data, unavailable capture and abnormal interruption still stop. Never inspect
arbitrary nested user values or infer correctability from an error message.

Scope: local-operation-tools, local-tool-host, local-design-sequence,
evaluation-control, their direct tests/provider integration, permanent recorded
fixtures, current API/spec/Inspector and manifest. First prove the exact attempt-17
selected failure loses recovery and strict reporting interrupts a legal repair.
Then prove correction proceeds in the same work turn without replaying successful
parts. Negative cases retain stop/no-write behavior. Run only the focused owner,
provider and captured execution proofs, types, lint, naming and diff gates.
The original prompt, drawing deadline, unlimited same-session report and total
launch count remain unchanged. Self-review confirms this corrects the first failed
handoff rather than weakening geometry, changing artwork or adding model guidance.

Owner review after the correctable-input slice: the recorded nonplanar face still
fails preparation before a write. Status and selected delivery now preserve its
projected recovery and request-lived draft; the same host repairs it and performs
one write. Complete target membership is checked once by the host before mutation;
missing/incomplete data is not reclassified. The evaluator recognizes only formal
recovery envelopes and Runtime's final inline-root summary. Independent delivery
errors and unknown settlement continue to stop. No model prompt, geometry tolerance,
selector matching, automatic retry, or successful-prefix replay changed.

Validation: the original recorded rejection and provider interruption failed on
the previous source. Corrected owners pass 265 focused cases and 23 provider cases;
the new captured repair proof and existing region proof pass. The full bounded
execution-flow capture passes 88 cases (candidate c940f45e-f6a6-4fb1-a144-6f33bf4e8a8f,
source 46aed640c43340624bbaeac372fd938cee026244dc886e970f0cbb08e96748a4).
Server/proof types, naming and scoped lint pass (two existing console warnings).
No full local, CI, publication or release gate was run. Live correction stability
remains unproven until the next recorded launch; do not infer it from these cases.

### Revised iteration - preserve known admission recovery

Attempt 18 adds a distinct admission case. The delivered reference-selection
contract explicitly says control-plane/native-tool; the AI nevertheless placed
it in execute_design. This is a correctable route choice, not evidence that the
control should become composable. Keep native control ownership and scheduler
boundaries. The current host knows the registered control and guarantees no
execution, but its typed input error becomes generic prose and triggers the strict
stop. The preceding geometry/target fix therefore did not cover this upstream
admission handoff.

Compose/invocation slice: preserve an explicit owner-declared correct_input
classification through typed admission errors. A resolved native control rejected
from a sequence identifies its existing direct route; do not invoke it, accept it
into recipes, or weaken registration. Canonical schema input rejection is also
correctable before dispatch. Missing/ambiguous capabilities, missing App context,
invalid output, unknown settlement and errors after acknowledged work remain
blocking unless their existing owner supplies a proven correction contract.

Tests first: replay attempt 18's exact reference-selection arguments, verify zero
native dispatch at rejection, and prove a known control works through its unchanged
native route. Include differently named controls, invalid direct inputs, unknown
capabilities and acknowledged-prefix negatives. Preserve the existing recovery
schema and evaluate the same formal receipts; do not add prose matching or another
error-name exception. Review local-design-sequence, preparedFor error preservation,
local-tool-invocation and direct consumers before implementation. Then run focused
host/invocation/provider and captured flow proofs, types/lint/naming. No drawing
prompt changes or mandatory model guidance. Retain the complete original report
before the next launch; the total counter remains 18/30.

Admission slice review: canonical schema validation runs before dispatch and now
returns explicit input correction. Only the resolved control-plane branch opts
into direct-native correction; unknown/ambiguous operations and unavailable context
retain failure. preparedFor preserves the typed owner error instead of replacing
it. Invocation drops safe-correction classification if prior acknowledged work
exists. No automatic native call, composition eligibility or lease policy changed.

The five focused admission regressions fail on the captured attempt-18 source and
pass after correction. 335 owner/evaluation cases and 24 provider cases pass,
including ordinary input correction followed by another call in the same work
turn, real blocking stops, transport-loss reporting and untimed reporting. The
captured 88-case flow proof passes at source
72702327a5aa6c44e216e49060cf849626d60bfc216541e590f44d3b24a2f2d0.
Types, scoped lint, naming and diff checks pass; existing console warnings remain.
No full local suite or release gate ran. The attempt-18 original report and video
are retained, with unchanged reload evidence. Live re-verification is still pending.

### Revised iteration - one authority for App completion

Attempt 19 proves the selected recovery handoff now works: the model-facing reply
contains the exact nonplanar geometry issue, retained draft and repair guide. It
also exposes a missed provider edge. About three milliseconds after that reply,
item/completed reports the same dynamicToolCall as failed. The evaluation branch
reclassifies this reduced native status and stops, despite the canonical App
receipt declaring safe correction. The normal protocol branch already treats
correlated App dynamic completions as summaries and admits only App-owned replies.
The evaluation branch had not reused that ownership rule.

Re-audit of the complete completion path:

| Boundary | Authority | Required behavior |
| --- | --- | --- |
| Nested host completion | Canonical owner receipt | Preserve correct_input, prefix settlement and blocking failures |
| Native App reply delivery | Actual App result/content delivery | Stop real delivery failure; preserve successful correction handoff |
| Correlated dynamicToolCall completion | Existing tool binding plus issued call identity | Observe native status without independently replacing the App result |
| Other native completion | Native provider result | Retain normal failure detection and protocol validation |

Observe slice: reuse one existing identity/status predicate in native completion
admission, bounded delivery observation and evaluation. Do not add another result
store, ignore all dynamic failures by type, or infer correctness from tool names.
The canonical App observers remain responsible for actual App failure. Unknown
identities and invalid protocol still fail. Tests must emit the real sequence of
App failure reply, correlated native failed completion and subsequent correction
in the original turn. Existing fake manual-tool tests omitted that native event;
strengthen them before implementation. Cover geometry repair, schema repair,
blocking App failures, external native failure and late/report lifecycle. Keep the
prompt, work window, report lifetime and 30-launch allowance unchanged.

Evidence-owner addition within this iteration: editing a test during attempt 19's
active report triggered Vite reload. This operator mistake exposed a separate
collector defect: waitForRecordedReport accepted settlement from any request in
the recording directory. An unrelated App lifecycle settlement was mistaken for
provider termination and cleanup killed the still-generating ephemeral report.
Preserve the partial public delta stream and disclose that the full report is lost;
do not synthesize a replacement. Future live runs prohibit file edits until report
and evidence cleanup have settled. Scope the collector to the exact provider
request from the observed work/report transition. Test unrelated settlement before
and during the wait, genuine same-request failure, report success and dead service.
Keep the report untimed and do not introduce another report store or resume session.

Completion-owner review: the predicate is calculated once per native event and
reused by evaluation, discovery recording and protocol admission. It recognizes
only registered App bindings, issued call identities and terminal statuses.
Actual App delivery/host observers remain unchanged and still stop blocking errors.
The report collector now requires the work transition requestId; unrelated
settlements before or during waiting cannot kill reporting. No new session,
report timer, result store, drawing prompt or geometry behavior was introduced.

Validation: both observed failures were reproduced before production fixes.
The revised source passes 24 focused provider cases, 20 evaluation cases, 12
collector cases and 89 captured flow cases, including real event ordering and
request-scoped untimed reporting. Server/proof types, naming, scoped lint and
diff checks pass; lint retains four existing console warnings. Accepted source:
60dbd8e59d9c493c65d85d9ca1892a6d9b51714c8236a5fa9326e19cfa309943.
No full local or release suite ran. Attempt 20 will provide current-source live
evidence; success cannot retroactively recover attempt 19's lost complete report.

### Current-source live verification - attempt 20

Attempt 20 reached the original fifteen-minute drawing limit without a blocking
App/tool failure. Two ordinary visual correction rounds continued. All 28 outer
App calls succeeded: 14 discovery, seven execution and seven review calls. Eleven
named values were saved; baseSource was consumed in seven input slots and podiumIds
in one sorting input. The final five-operation edit returned status only. No
step-output bindings, stages or mechanical iteration were submitted.

The original native thread 01a1b111-f489-78a3-b504-e9a31393e22f retained a complete
32,565-byte report after 454.629 seconds of reporting. Work settled at 899.727
seconds because of the deadline. Report-time document equality, reload equality,
source freeze and evidence cleanup all pass; no evidence errors. Continuous video
contains three fits as geometry expands. No services remain on owned ports.

This is a valid timed execution/evidence run, not final artwork acceptance:
last visual checks were still pending. Do not compare its deadline duration with
attempt 14's completed-delivery duration as a speed result. Correctable App failure
plus native summary and report-disconnect paths were not triggered in attempt 20;
their verification remains the focused/captured regressions. No additional live
launch is needed solely to randomize until the AI happens to finish its visual
acceptance sooner. The bounded defect-correction/test task ends at 20/30, with
remaining design decisions and research-evidence uncertainty disclosed in the
aggregate report, not converted into unrequested new implementation.

The aggregate report records all launches, corrections, actual live confirmation,
focused-only paths and missing originals. Eighteen complete original reports are
retained; attempt 2 has none and attempt 19 has only its partial public stream.
See ../reports/taipei-101-continuation-iteration-2026-11-06.md.
