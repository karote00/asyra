# Reusable Tool Composition - Staged Corrections

Status: STAGE 5 COMPLETE - review Stage 6 before its goal and implementation.

## Current authority and stop boundary

The user authorizes completion of every remaining stage in this worktree,
`.worktrees/ai-reusable-tool-design`, branch `codex/ai-reusable-tool-design`.
The current conversation owns closeout. Stage 1 was pushed at `62127de41` and
Stage 2 at `d7890d8a6`. Stage 3 and its persistence follow-up are complete, including the three review
corrections documented below.

For each stage: review its complete plan and handoffs before setting a dedicated
goal; implement, self-review and iterate; run applicable local tests, lint and
TypeScript checks; then commit and push. Complete the preceding stage before
advancing. Finally review all stage connections and run the affected packages'
existing complete test suites, fixing regressions until those gates pass.
No PR monitoring, PR creation, merge, extra model evaluator or full Taipei 101
run is authorized. Stage 8 therefore uses deterministic integrated acceptance
and the existing package suites instead of a new live drawing/recording run.
Preserve .env, user documents, recordings and ignored evidence. Do not publish
private configuration or local-only diagnostics. Historical cards below record
past evidence; their old stop/push instructions do not override this authority.

## Direction

- The primary AI owns intent, design choices, recipe proposals and visual judgment.
- Tools own deterministic checks and explicitly permitted repairs; no extra AI
  evaluator may be invoked by checking or repair iteration.
- Reuse the common registry, invocation contracts, canonical document and existing
  check store. Do not create another execution interpreter or acceptance ledger.
- Retain valid passes and invalidate actual dependencies, including prior passes.
- Transfer retained data directly between tools; deliver compact, usable summaries
  and evidence to the model. Full owner data remains available when required.
- Publish ready work promptly. Status and diagnostics describe actual work.
- Preserve real mutation outcomes, document integrity and Undo. Never replay an
  uncertain or completed write to recover delivery, cleanup or saving.

## Stages

Stages 1 and 2 are pushed. Close the Stage 3 findings first, then review and
complete Stages 4 through 8 in order; each stage has a separate goal.

| Stage | Outcome | Required evidence |
| --- | --- | --- |
| 0 - Baseline | Remove stale execution instructions and preserve existing work. | Unverified checkpoint pushed; clean tracked worktree before Stage 1. |
| 1 - Check timing | Deferring images does not skip mechanical checks. | A coherent write boundary publishes first, then checks without a model or screenshot; results reach the existing store and consumer. |
| 2 - Local acceptance | Regional passes satisfy explicit required coverage. | Change one of eight regions; preserve unrelated passes and reopen actual cross-region dependencies without dropping required units. |
| 3 - Direct delivery | Structural outputs transfer usable retained sets. | Group-to-edit uses a handle without model-side ID expansion; full outcomes, ownership, stale recovery and Undo remain intact. |
| 4 - Mechanical repair | One real defect is repaired through an admitted finite recipe. | Check/repair/recheck succeeds without replay; decision-required, no progress, cancellation and partial outcomes stop correctly. |
| 5 - Model handoff | The primary AI selects capabilities and continues unresolved work. | Discovery, recipe reuse/creation, decision return and a new execution segment work together; saving does not replay writes. |
| 6 - Activity | Purpose, phase and recorded classification agree. | Cleanup cannot replace design purpose; late events cannot revive closed work; UI and profiler consume normalized facts. |
| 7 - Image checks | Comparable local evidence receives deterministic analysis. | Explicit coordinate mapping, scope and baseline; meaningful defects detected, unsupported comparisons reported, valid results reused. |
| 8 - Integrated acceptance | Verify the complete staged contract through existing package tests. | Cross-stage success, partial failure, cancellation, dependency invalidation, ownership and reuse; all affected package suites pass. No new live101. |

## Cross-stage handoff and failure rules

Each stage reviews the affected specification, canonical schemas, producer,
consumer and formal tests together. Existing unrelated owners are not redesigned.
Execution success, mutation settlement, mechanical findings, visual acceptance
and durable tool saving are distinct facts. A check finding is not a failed write.

- Invalid input before dispatch stops that call with actionable field issues.
- Stale/missing evidence stops its dependent work; reacquire only necessary data.
- A known finding stops acceptance of that obligation, not acknowledged drawing.
- Decision-required/no-progress/exhaustion stops automatic iteration and returns
  unresolved work to the primary AI; it must not replay completed preparation.
- Partial writes stop the dependent suffix and preserve exact completed receipts.
- Unknown settlement stops relevant writes until reconciled; never infer rollback.
- Save or cleanup failure does not erase acknowledged mutation results. Unavailable
  resources remain unavailable and cannot be consumed as valid output.
- Cancellation stops new dispatch and prevents publishing a new pass from a late
  result; preserve existing document work under its actual owner semantics.
- Document replacement invalidates old authority. Do not write into its successor.

Fix one reviewed stage at a time. Provider-wide continuation and activity work
belong to their later stages; they cannot silently expand the active correction.

## Reviewed architectural constraints for later stages

Design owns task intent, required coverage and execution-segment association.
Runtime owns finite recipe execution and contracts. Host owns scheduling and
leases. Canonical operations own writes and Undo. Check results remain in the
existing store; profiler records are not execution recovery authority.

Task continuation means a new explicitly admitted segment consuming acknowledged
results. The current library resume restores recipe availability, not an execution
program counter. Do not reinvoke initial writes or invent arbitrary DAG resume.
A coordinator returns before requesting primary-AI judgment and holds neither a
leaf scheduler barrier nor a transaction while awaiting that judgment.

References must be exported through declared success/partial/recovery schemas and
retained before child cleanup. Request-scoped evidence is not durable recipe data.
Repeated segment delivery, concurrent continuation, unknown acknowledgement and
request teardown need real host tests before any continuation claim.

Regional required units and cross-region requirements determine completion;
omission and scope shrink cannot erase failures. Image scope distinguishes an
isolated object from composited canvas pixels. Use Core/renderer public APIs,
explicit coordinate mapping, dependency versions and stable task tolerances.
Pan/zoom is not a semantic change. Unsupported comparison cannot fabricate pass.

## Stage 1 - Deferred capture preserves mechanical checking

### Frozen task contract

Objective: make delayed image capture independent of deterministic canvas checks
at the existing coherent operation/workflow boundaries. Do not introduce a new
task coordinator as a prerequisite for this correction.

Authority: Design execution spec sections Capture and deterministic review
responsibility and retained canonical measurements; Inspector inspect owner and
compose-to-apply/apply-to-inspect direct workflow routes. The current defer early
return also postpones measurement; the current live run used defer for all nine
prepare/apply and nine edit calls. Non-final capture could then deliver images
before layout checks, leaving checks until final judgment.

Scope: local-operation-tools and local-design-workflow, their maintained tests,
exact Design spec/Inspector conditions, flow manifest/proofs and generated
Inspector catalog only when required by changed contracts. Prompt/descriptions
may clarify only this timing contract. Preserve model and all canonical write,
review algorithm, dependency invalidation, selection and Undo behavior.

Discovery: current owner source, direct call sites, formal operation/workflow/
execution-proof tests and existing recorded run. No repository-wide audit.

### Step Execution Card - inspect timing

Owner: inspect, with compose boundary verification for ordered workflows.
Inputs: acknowledged write receipts, actual review targets, existing current
measurement stamps and caller capture preference.
Outputs: unchanged write outcomes, retained deterministic check results and
truthful capture-deferred/measurement state. A screenshot is optional; a required
mechanical check is not silently omitted because capture was deferred.
Conditions: check after a coherent acknowledged write boundary; ordered workflow
intermediate parts may defer checks to the explicit block boundary without
checking every part repeatedly. Required targets must not be lost. Already-current
checks are reused; check-result reads do not remeasure. No check-only model call.
Failure owner: inspect for checking, original apply owner for writes. Inspection
failure must not erase or replay completed writes. Cancellation publishes no late
check result. Missing/failed measurement stays unresolved with a bounded recovery
handoff. Partial ordered blocks preserve completed output and do not run successors.
Allowed contributors: current workflow, operation, measurement and evidence owners.
Forbidden: new task engine, automatic repairs, image-analysis tools, broad error
refactor, raised limits, extra AI, concrete renderer access or new dependencies.
Cases: single creation/edit with deferred screenshot; ordered multi-part block;
read-after-check reuse; known findings; unavailable/failed check; cancellation;
partial write; direct capture boundary; existing immediate path.
Gates: permanent red/green regressions, focused operation/workflow/proof tests,
server typecheck, focused lint, naming, exact Inspector admission/evidence and
bounded diff/self-review. No full local CI or live-model drawing.
Stop: report Stage 1 outcomes and limitations with no Stage 2 work and no push.

### Review status

Stage direction, ordered-boundary design, current contracts and failure handoffs
were reviewed before implementation and checked again against the final diff.
The preservation checkpoint was not tested. Stage 1 evidence is recorded below;
historical full-task evidence is not a claim of current whole-program readiness.

### Stage 1 boundary review

Checkpoint ea7e15532a775380a59a2069bb4da47be8335325 was pushed without
new validation as requested; the tracked worktree was clean afterwards.

Use invocation-local collection for ordered parts, never a request-global
suppression flag. The existing operation owner collects acknowledged targets;
the workflow flushes this collection at its explicit success or partial boundary.
Each distinct target is checked once against final block state, reusing current
stamps. Standalone mutations flush before returning regardless of capture policy.
No model-facing parameter can defer mechanical checking past a completed call.
Keep inspection follow-up diagnostics separate from the acknowledged write
outcome. Failed/unavailable checks remain unverified in the existing check store;
returned diagnostics name targets and recovery without suggesting write replay.
Cancellation stops dispatch and cannot publish late check results. Unknown write
settlement retains uncertainty and cannot certify affected output.

### Stage 1 self-review findings

The first permanent regressions reproduced both the defer early return and the
last-target-only ordered check. Follow-up review proved and corrected loss of
known findings on incomplete checking, unchecked unknown settlement, and missing
capture-failure diagnostics. Mechanical/capture failure is separate from write
success. Missing checking capability is an unverified mechanical result and blocks
completion. Do not preserve the previous optional-capability bypass or add
compatibility branches. Apply the current contract and update old fixtures.
Existing capture-only and local-invalidation tests retain their original
correctness assertions; counts now include the required post-write check.

### Stage 1 initial completion evidence

The additional user-requested review below supersedes this initial completion
claim and source evidence. These results remain historical, not the final source.

Only Stage 1 is complete. Its changes remain uncommitted and unpushed in the
same worktree; the remote branch still ends at the checkpoint. Monitoring and
later stages remain inactive. No live 101, full local CI or model configuration
change was performed.

- Reproduced the defer early return, missing earlier part checks, discarded
  findings on incomplete checks, unknown-settlement handoff, and unavailable
  capture diagnostics before their fixes. The strict missing-capability test
  also failed before removal of the old bypass. Red logs are retained under
  `tmp/stage1-*-red.log` and `tmp/stage1-red.log`.
- Final focused tests: 252 passed across operation tools, Design workflow,
  execution proof, common invocation and operation-composition consumers.
  Evidence: `tmp/stage1-delivery-tests.log`.
- Server typecheck passed: `tmp/stage1-delivery-types.log`. Focused lint has zero
  errors and one pre-existing no-console warning at execution-flow-proof line
  1293, outside the changed test. Evidence: `tmp/stage1-delivery-lint.log`.
- Naming gate: 15 passed (`tmp/stage1-verified-naming.log`). Generated Inspector
  catalog contract: 8 passed (`tmp/stage1-delivery-catalog.log`). Task-context
  preflight and whitespace review passed.
- Final source candidate `93f97617-c601-4162-907d-e1ba915bb2c9`, source digest
  `02b4176c363012798ac000f08852b96743dbf954ec737dfc96fed9808a83435a`;
  contract review
  `51fcba0e3daeda76b5b3ac24d9b03612a3373e8eede222a4de363c660d9a9215`
  accepted at mapping revision 58. Same-source positive, three precise negative
  scenarios and recovery passed for 27 obligations
  (`tmp/stage1-same-source-proof.log`). Expected negative runs remain failures;
  only the complete proof is green.
- Work-count assertions prove two ordered writes precede both target checks,
  repeated targets are checked once per block, current check reads do not scan,
  unrelated measurements remain reusable, and no extra provider call occurs.
  The existing 4,000-acknowledgement compact receipt budget still passes; missing
  capability reports one common diagnostic rather than per-object error text.
- Bounded self-review covered current input/output contracts, standalone and
  ordered success, partial/unknown settlement, cancellation, unavailable or
  incomplete checking, retained findings, current-result reuse, capture recovery
  and downstream receipt validation. No compatibility route restores skipped
  checks or treats unavailable checking as passed.

This proves deterministic timing and handoff behavior, not a new first-frame or
full-drawing wall-time improvement. Broader acceptance/dependency/status work is
still assigned to later stages and has not been declared complete.


### Stage 1 re-review - inspect boundary correction card

Scope remains the inspect owner and its compose-to-inspect route in the existing
Stage 1 card. Review uses only the current diff and direct producers/consumers.
Explicit mutation settlement, not execution status, decides whether follow-up
checking may begin. Partial/failed outcomes can still have unknown settlement.
Automatic images must not bypass failed, incomplete or retained failing mechanical
checks. Explicit capture remains a separate image-only operation. Cancellation
must be checked before publishing image evidence, not only before returning it.
The early evidence/completion paragraph must agree with the detailed timing clause.

Inputs, outputs, owner allowlist and stop boundary remain unchanged. Add permanent
cases for unknown settlement with partial receipts and lost acknowledgements,
incomplete/failed checks with immediate capture, reused failing checks, late
capture cancellation, missing canonical check evidence and targets removed before
the coherent batch boundary. Prove failing cases before production edits, then run the
focused Stage 1 tests, server types/lint/naming and current Inspector proof.
No compatibility paths, new lifecycle owner, later-stage work, push or monitoring.


### Stage 1 re-review outcome

Closed locally on 2026-10-13. The review found five concrete handoff defects:

- Partial execution could still have unknown mutation settlement. Both standalone
  and ordered boundaries now use settlement; a lost later acknowledgement does
  not trigger checks of earlier parts or replay completed writes.
- Failed/incomplete checks and reused failing verdicts could still trigger
  automatic images. The boundary reads the affected targets from the existing
  result owner. Explicit image-only diagnostic capture remains available.
- A nominally complete check without canonical evidence was stored as unverified
  but omitted its recovery diagnostic. Delivery now uses the same owner's retained
  measurement eligibility rather than a second, weaker completeness test.
- Cancellation during image capture could publish the returned image before the
  final abort check. Cancellation is checked before image evidence publication.
- A target created and explicitly removed within the same batch remained queued
  for checking. Confirmed removal now retires it from the pending target set.

The early evidence/completion paragraph still permitted deferred mechanical
checks; it now agrees with the precise timing contract. Missing-capability
recovery now requests actual checking rather than a read-only results lookup.
Existing positive capture fixtures now supply complete stamped mechanical results;
assertions for image delivery, canonical target identity and bounded write counts
remain. No legacy bypass or compatibility branch was added.

Formal red evidence: `tmp/stage1-rereview-red.log` (seven cases),
`tmp/stage1-rereview-boundary-red.log` (late image publication),
`tmp/stage1-rereview-surviving-red.log` (removed target), and
`tmp/stage1-rereview-evidence-red.log` (missing check evidence). Initial temporary
fixture syntax/API errors were corrected before claiming their behavioral red
results; they are not product failures.

Final validation: 261 tests passed across the five focused owner/consumer files
(`tmp/stage1-rereview-final-tests.log`), server typecheck and focused lint passed
(`tmp/stage1-rereview-types.log`, `tmp/stage1-rereview-final-lint.log`), naming
15 passed and generated catalog 8 passed. Task-context and whitespace checks passed.
Final candidate `047987a2-a88d-4e7b-af68-0894ba4495cd`, source digest
`0fa3fdfc5f5b3a64bcb3e014dcf555208462b072e59f2630e261a2d85827610d`;
contract review `a5ea68da6649f994ce15fb33ac7d08db3d235b25333cd03d8023687d0424526e`
accepted at mapping revision 59. Same-source positive, three precise negative
scenarios and recovery passed across 27 obligations
(`tmp/stage1-rereview-proof.log`). Expected negative failures are intentional;
the complete proof passed.

The final bounded diff/consumer review has no remaining blocking Stage 1 finding.
This is not certification of later stages or live Taipei 101 speed. Changes remain
local and uncommitted; no push, monitoring, full local CI or live model test ran.


### Stage 1 additional review - canonical receipt handoffs

Freeze this iteration to the existing inspect owner and compose-to-inspect route.
Use the current diff, canonical browser receipt producers and their direct
consumers. Verify target retirement for ungroup/replacement, not only explicit
delete arrays, and actual BrowserBatchExecutionError delivery with acknowledged
partial results. A failed transport without a receipt remains unknown; never
infer successful writes or replay a batch. Known partial receipts must contribute
their acknowledged targets before checking; the original failure stays a failure.
Keep cancellation and unknown settlement as check barriers. No generic invocation
redesign, result-store lifecycle redesign, later-stage acceptance work or model
calls. Add permanent red tests using canonical receipt construction, then repair
only the existing owner and run focused tests/types/lint/naming/current proof.
Retire the unused scalar deleteElement branch rather than retaining an obsolete
API path. No push, monitor, live 101, full CI or next stage.

The real provider receipt observer exposed one further handoff in this same
iteration: throwing an enriched receipt after the mechanical tail lets the generic
exception observer select its older batch snapshot and omit tail diagnostics.
The inspect owner must deliver its handled failure through the existing common
failure envelope, keeping the canonical receipt plus tail. Do not redesign the
generic invocation observer or discard its behavior for unhandled exceptions.
A permanent observer-enabled test must fail before this correction.


### Stage 1 additional review outcome

Closed locally on 2026-10-13. This supersedes the prior review's no-blocker
conclusion and final source evidence. The bounded review found three handoffs:

- Confirmed ungroup and successful replacement retired review scope but not all
  invocation-local pending targets. Both now use the same target retirement as
  explicit deletion. Partial replacement preserves the original target. The
  unused scalar deleteElement path was removed; no compatibility route remains.
- Actual BrowserBatchExecutionError receipts bypassed target collection. The
  inspect owner now checks acknowledged settled partial work at the ordinary
  boundary and preserves the failure, actual receipt and stopped suffix. Unknown
  settlement or missing receipts do not authorize checking or replay.
- With the provider's batch observer enabled, rethrowing an enriched error let
  generic failure delivery choose an older snapshot and omit mechanical-tail
  diagnostics. The inspect owner delivers handled failures through the existing
  common failure envelope. Generic unhandled-error behavior is unchanged.

The earlier tests used returned partial statuses and explicit deletion arrays;
they did not exercise the actual thrown browser receipt plus the provider observer.
New permanent cases use requireBatchSuccess, canonical ungroup result projection,
standalone/ordered calls, confirmed/partial replacement, unknown settlement and
failing mechanical checks with/without the receipt observer. Red evidence:
`tmp/stage1-additional-red.log` (browser receipt loss),
`tmp/stage1-additional-target-red.log` (ungroup retirement),
`tmp/stage1-additional-replacement-red.log` (replacement retirement), and
`tmp/stage1-additional-observer-red.log` (diagnostic loss). The first ungroup
fixture used the wrong argument and briefly had a syntax error; only the later
canonical groupId assertion failure is product evidence.

Final focused validation: 271 passed across five owner/consumer files
(`tmp/stage1-additional-final-tests.log`), server typecheck and focused lint
passed (`tmp/stage1-additional-final-types.log`,
`tmp/stage1-additional-final-lint.log`), naming 15 passed and generated catalog
8 passed. Task-context and whitespace checks passed.
Candidate `b8c74c94-ff9a-4a0b-a5c0-ad00abd1ecbb`, source digest
`59a250b9ce81f668dcdd4d73b782f95979b28729469101bbad829c9571030169`,
contract review
`c16f4324e17c920ecc8a82b9c6a1f68b8e551d3f97601509aa9c26c5250c6025`
accepted at mapping revision 60. Same-source positive, three precise negative
scenarios and recovery passed for 27 obligations
(`tmp/stage1-additional-proof.log`); negative failures are intentional.

The final review covers this Stage 1 diff and its direct receipt consumers, not
later-stage result-lifecycle redesign or live performance. No new AI call, full
local CI, live 101, commit, push, monitoring or next stage was started. No remaining
blocking finding was identified inside this bounded review.


### Stage 1 comprehensive review contract

The user explicitly broadened review on 2026-10-13. Previous narrow review
conclusions are not completion authority. Freeze discovery to the entire Stage 1
flow: canonical browser action/result producers, every operation-owner branch,
single/ordered preparation, native/common invocation, registered recipe/host
delivery, the existing check store, evidence currency and completion consumers.
Read current source and public catalog contracts, trace every declared mutation
result kind, and use permanent product tests rather than repeated small heuristic
passes. Provider observation must be enabled in representative integration cases.

Candidate classes fixed before repair: entry admission and capture-only/read-only
bypasses; complete/partial/failed/unknown/no-change receipts; target creation,
plural edits, shared properties, grouping/ungrouping, move/removal/replacement;
retained pass/failure freshness and retirement; missing/invalid/mismatched evidence;
check and capture failure/cancellation; compact/full delivery and primary-agent
visibility; final settlement; work counts, unrelated reuse, and no model calls.
Existing scheduler exclusivity protects owner state; no new scheduler is needed.
Explicit capture stays image-only. Regional acceptance, recipe repair iteration,
current-status redesign and provider-wide classification remain later stages.

The inspect timing owner and its direct apply/compose/settle routes remain the
semantic boundary. Necessary canonical review-target projection and direct check
store lifecycle corrections are in scope when formal cases prove a Stage 1 gap;
no alternative registry, guessed IDs, whole-document fallback or new acceptance
engine. Inspect all affected producers and consumers before implementation.
Before each owner correction, extend the existing card with the exact finding,
producer contract, intended delivery and permanent red case. Run focused owner,
actual adapter, host/provider consumer tests, types/lint/naming and same-source
Inspector proof. Report covered paths and remaining evidence limits, not a
repository-wide or performance guarantee. No push, monitor, live 101, full CI or
next stage.

### Stage 1 comprehensive review - producer proof card

- Route: compose/apply -> inspect, current canonical basic action contracts ->
  acknowledged target collection -> deterministic check delivery.
- Authority: product specification "Capture and deterministic review
  responsibility" and Inspector inspect conditions, inputs, failure owner and
  current cache dimensions. Read-only/capture-only operations remain bypasses;
  deferred capture never bypasses checking acknowledged mutations.
- Input: real createBasicApiActions executors and declared API arguments/results;
  injected public owners represent the document without a browser or model.
- Output: exact affected target checks, no guessed read-result identity, current
  retained evidence, explicit unresolved diagnostics and truthful settlement.
- Contributors: existing canonical result projection, operation coordinator,
  check store and common invocation. No model, schema guesses, replay, new registry
  or whole-document fallback.
- Files: existing local-tool-operation-composition.test.ts (compose route) and
  local-operation-tools.test.ts (inspect owner). Production files stay unchanged
  while this comprehensive review establishes reproducible findings.
- Cases: plural/shared edits, moves, first grouping/ungrouping, read/write mixes,
  retained failure retirement, failed currency reads, result reuse, malformed
  check receipts, scoped read work counts, no-change and cancellation controls.
- Gate: focused formal tests and fixture lint. A failing product assertion is an
  open review finding, not a green completion or authority to advance stages.
- Stop: report the complete findings and required owner correction together;
  never claim the prior green narrow suites prove these new paths.

### Stage 1 comprehensive review findings - original red evidence

This review supersedes the earlier bounded "no remaining blocking finding"
conclusions. The implementation is not ready for Stage 1 completion. This pass
changes formal tests and this plan only; it does not claim new production fixes.
The current stage goal remains incomplete. Later stages, push and monitoring
remain inactive.

#### Discovery and evidence

Reviewed canonical basic API catalog/result kinds and adapter execution; custom
creation/update/removal/replacement; standalone and ordered dispatch; the shared
registry/recipe and common invocation consumers; real browser receipt exchange,
provider action observation and requireBatchSuccess; mechanical evidence capture,
request check storage, result reads, compact/full serialization and final outcome.
Read-only, selection, viewport and explicit capture bypasses were distinguished
from mutations. Current browser measurement caching and scheduler boundaries were
also checked; this review does not propose another cache or scheduler.

Permanent producer/consumer cases were added to the existing
`local-tool-operation-composition.test.ts`. Public document-owner methods are
stubbed using their declared returns, but the basic API adapter, result projection,
operation coordinator, one-use batch exchange, provider action observer and
failure guard are production implementations. Injected malformed replies are
explicit fault cases, not claims that the current browser normally emits them.
No model or live browser is needed for these handoff proofs.

The focused combined run has 298 tests: 280 passed and 18 failed. All prior 271
cases remain green; the 27 added cases have 9 passes and 18 failures. The final
transport-integrated fixture independently reproduces the same 18 failures
(29 cases, including the two existing recipe tests). Evidence:
`tmp/stage1-comprehensive-review-tests.log` and
`tmp/stage1-comprehensive-transport-red.log`. Fixture lint and naming pass.
The final fixture after allowing either findings or an exact retained check
reference reproduces the same 18 failures (`tmp/stage1-comprehensive-final-red.log`);
focused lint, task-context preflight and whitespace checks pass. These metadata
checks do not make the product review green.
The first draft had two invalid test arguments (missing records and hidden rather
than visible); these were corrected against the actual schemas. Neither initial
admission error is a product finding. Failed review runs remain failed.

#### Blocking findings and owner corrections

1. **Mutation identity is inferred from response shape, not delivered completely.**
   Nine canonical producer cases skip all mechanical checks in a fresh request:
   Core/App plural property updates and patches, shared property component edits,
   plural primary-fill colors, first grouping, first ungrouping and moves.
   `basic-api-actions.ts` supplies only a scalar element/parent echo or selected
   result kinds, while the coordinator only understands a subset of those kinds.
   Fix the canonical apply-to-inspect handoff, including real shared-property
   owners and structural changes. Do not add recursive ID-field guesses or reuse
   an unrelated previous review target. A successful write receipt with unknown
   affected scope must remain explicitly unresolved.
2. **Read results can pollute mutation targets.** A mixed batch with a read value
   containing compositionId checks that unrelated payload ID. Restrict target
   authority to admitted mutation acknowledgements and their exact action IDs.
3. **Target retirement only removes pending sets.** A previously failed check
   remains active after confirmed deletion. Retire the removed target's active
   mechanical obligation and invalidate actual dependents; do not erase unrelated
   or main-agent visual obligations. Distinguish an absent target from an existing
   target whose measurement is unavailable.
4. **Freshness failure can leave an old pass current.** A validator transport error
   exits before stale state is recorded. Mark the affected evidence unresolved
   before returning diagnostics, propagate cancellation and preserve independent
   available results. This must agree with completion, not only the read response.
5. **Reuse and failure delivery lose the actionable pending work.** Reusing a
   current failed measurement returns neither its findings nor a check-result
   reference. A later checker failure overwrites known findings with an empty
   report. Preserve prior evidence as stale/unverified and return an exact compact
   check reference or findings; never replay an acknowledged mutation.
6. **An explicit result read validates unrelated targets.** Requesting only B
   validates A, B and C. Select the requested checks plus transitive declared
   dependencies before freshness work. Preserve the existing downstream-check
   proof; simply skipping all other checks would break upstream invalidation.
   The direct check store already selects IDs efficiently; the excess work is in
   the operation owner before that read, including unconditional preparation
   refresh. This is a work-count finding, not a model-time claim.
7. **Mechanical receipt correlation is incomplete.** Injected mismatched actionId
   or available=false/complete=true replies can be stored as pass. The actual
   transport and observation path does not reject them: the observer records a
   missing acknowledgement but returns the original receipt. Inspect must require
   one matching check acknowledgement, coherent availability/completeness and a
   valid stamp before certifying it. A receipt schema alone is insufficient.
8. **No-change can become a false completion blocker.** An admitted empty creation
   receipt runs no check but leaves measurementPending/inspectionUnavailable set.
   Derive pending work from acknowledged unresolved obligations, not an attempted
   write. Unknown settlement is different and must remain blocked.

These are shared handoff/lifetime defects, not 18 independent patch requests.
The correction must be reviewed as one connected contract: canonical mutation
scope -> active check obligations -> exact current evidence -> compact unresolved
result delivery -> truthful completion. Implement owner slices only after that
contract accounts for all findings together. No compatibility path or second
registry is required. The existing visual acceptance authority stays unchanged.

#### Confirmed controls and limits

The current narrow suites still prove returned/thrown partial receipts, unknown
settlement, stopped ordered suffixes, provider-observed failure delivery,
cancellation, missing check capability and automatic-capture gating. New controls
prove ordinary scalar writes and creation still check, read/selection/viewport
queries do not scan, unchanged passed evidence is reused, unrelated saved passes
remain intact, and checker failure does not replay the write. These controls do
not cancel the blocking findings above.

The root review-method defect was treating scenario-local fixtures and green
schema/proof tests as coverage of every producer/consumer lifetime. The plan's
intent was correct but its affected-target and retained-result obligations were
not enforced across all canonical result families. The previous rule-boundary
interpretation was too narrow for the user's whole-flow review request. This is
not missing user authorization, unclear product intent or a reason to resume
monitoring. No new 101 run, latency comparison, complete local CI, production
repair, commit, push or next-stage work was performed in this review.

### Stage 1 correction card - retained mechanical evidence

- Owner: inspect; authority: current Capture and deterministic review responsibility,
  retained-result dependency clauses and inspect implementation boundary.
- Inputs: exact submitted measurement action identity, canonical receipt/stamp,
  confirmed removed target IDs and explicit requested result IDs.
- Outputs: current complete passes only; unresolved prior evidence retained on
  failure; compact pending checks returned on reuse; removed tool obligations
  retired with transitive dependents stale and monotonic per-ID revisions.
- Currency work follows requested results and transitive check dependencies;
  cancellation stops work, invalid/missing currency becomes stale, and a failed
  read cannot leave an old pass current. No extra model or new measurement cache.
- Files: design-check-results.ts and its formal tests, local-operation-tools.ts
  and existing operation/composition tests, exact spec and Inspector condition.
  The scoped preparation-refresh argument is a direct consumer adjustment only.
- Red proofs: comprehensive review cases for retirement, currency failure, reused
  findings, preserved evidence, scoped reads and malformed acknowledgement;
  add store retirement/dependency/revision cases before implementation.
- Gates: these owner/store/consumer tests, server types, focused lint/naming.
- Stop: close this lifecycle slice before canonical write-target projection.
  Remaining target-generation findings cannot be declared fixed by this slice.

Lifecycle slice review also verifies failure recovery, not only failure marking:
failed explicit rechecks invalidate prior passes; failed/stale currency retires
the reusable stamp so the next coherent check can publish a fresh result. Two
additional formal red cases prove both transitions. Preparation freshness reads
continue through independent targets while retaining each failed target as stale;
cancellation still propagates. The initial lifecycle edit briefly retransmitted
all pending evidence; the existing 5,000-action compact gate caught it. The final
handoff uses counts and firstPendingId, with evidence retained in the same store
and readable using read_design_checks. No new cap, whole-document scan or model
request is introduced. A store test proves bounded summary bytes and retained
full evidence. The canonical receipt fixture that used a hardcoded action ID was
corrected to echo the actual submitted ID; wrong-ID rejection remains explicitly
tested through the real transport and observer.

### Stage 1 lifecycle correction evidence - intermediate checkpoint

Implemented exact measurement acknowledgement/availability checks, conservative
currency failure and explicit-recheck failure handling, recoverable stale stamps,
retained known findings, compact check summaries, transitive scoped reads,
independent attachment freshness failure handling and tool-result retirement with
monotonic revision reuse protection. The full visual acceptance policy is unchanged.

Validated current lifecycle source: 292 tests passed across check store,
preparation review, operation owner, ordered workflow, execution-flow proof and
common invocation (`tmp/stage1-lifecycle-final-tests.log`). The cross-owner suite
has 20 passes and 11 remaining failures (`tmp/stage1-lifecycle-remaining.log`):
nine mutation-target omissions, read-result target pollution and no-change
completion state. Its previously failing lifecycle cases and both added recovery
cases now pass. Do not combine these into a claim that Stage 1 is green.
Server typecheck, focused lint, naming, task-context and whitespace checks pass;
generated catalog has eight passing checks. Logs use the
`tmp/stage1-lifecycle-final-*` and `tmp/stage1-lifecycle-catalog-*` prefixes.

Source candidate `14eab92e-4e75-4824-8e62-c8aefde72abe`, digest
`58250dc9031b854eeb01614fb7c2a1ed306353805446006fdb4dafb386ad0e07`,
contract review `2ef005e58c58ad4855c0e82b62d133b5583fe417dab3bd9fd8235aad90c28e2b`
accepted the inspect lifecycle condition. This is architecture admission and the
existing positive proof only; complete same-source closure remains pending until
the full Stage 1 regression suite, including remaining target cases, is green.

At that intermediate checkpoint, the next owner was canonical apply-to-inspect target delivery. Read-only discovery
found 50 basic mutation APIs with scalar, plural, dictionary, structural and shared
property inputs. A field-name projector still misses shared-property and derived
group changes, so it cannot close the contract. Inspect the existing canonical
Scene Tree/Props observation boundary and transaction publication timing before
wiring target receipts. Capture must be scoped to the actual mutation execution,
not the wait for an unrelated transaction; cleanup, rollback/unknown settlement,
removed targets and no-change must remain explicit. Prove real canonical writes,
shared owners and the existing compact/full handoff, without a second registry or
whole-document fallback. This was the discovery state before the following canonical target correction; the producer and consumer are now implemented.
No services, model calls, full CI, commit, push or monitoring were started.

### Step Execution Card - canonical mutation scope to inspection

Owner: apply producer, then its direct inspect consumer. The reviewed Stage 1
comprehensive correction includes the canonical basic API adapter/results and
existing canonical inspection change observer, with their formal tests.
Actual Scene Tree/Props publications, including shared property owners and
structural parents, determine affected identities. Capture starts inside the
admitted synchronous mutation callback and lasts through transaction settlement;
waiting for another transaction cannot contribute. Read/viewport/selection output
never supplies document targets. Scope contains complete coverage, live IDs and
removed IDs; unknown observation is unresolved, not empty success. No whole-scene
scan, input-name projector, old response fallback or mutation replay is permitted.
Core/Factory remain unchanged. Existing history groups reject asynchronous members.
Failures preserve existing executor settlement authority and unsubscribe.
The inspect owner consumes exact matching write acknowledgements before compact
delivery. Empty complete scope does not invalidate prior checks or create pending
work. Missing/incomplete scope blocks completion. Checks still cannot certify
visual success. Producer, canonical real-App, compact/full and cross-owner formal
tests must close the nine omitted target cases, read pollution and no-change case.

Target-consumer integration gates additionally detected an unclassified existing
Core inverse-property lookup and two old semantic/provider fixtures without the
mandatory measurement capability. The lookup is explicitly host inspection
metadata in the existing disposition catalog, not another model operation.
The two fixtures now cross the real review-before-capture contract while retaining
their separate refusal of unassessed visual completion; missing-service regression
cases remain. These are direct consumers of the Stage 1 handoff, not new owners.

The final direct native-producer trace found retained-fill mapping returned only
a count; its regression failed before canonical shared Fill owner identities were
exported in the same mutationScope contract. The apply slice additionally includes
retained-fill-action and its existing formal tests, tool-contract schema reuse,
and the current native arrangement/reorder receipt consumers. This preserves
retained-query ownership and writes; it adds no query rows, broad tree scan or AI
request. Native prepared roots still supply their declared coherent inspection
unit rather than expanding every created descendant into separate server calls.

The saved-recipe handoff also pins exact tool revisions. Changed basic document
mutation outputs and retained mapping outputs therefore advance their contract
revision; selection/read/viewport contracts keep their unchanged identities.
Formal composition admission must use the newly advertised exact revision and
reject the replaced identity. No old-output compatibility path is retained.

### Stage 1 comprehensive review closeout - 2026-10-13

This section supersedes the earlier intermediate open/pending statements. Only
Stage 1 is locally complete. There is no authorization to advance other stages,
push, create a PR, run full local CI/live101, or resume monitoring.

The complete affected path was reviewed: canonical write producers and all basic
result kinds; native/prepared/ordered/composed entry points; exact acknowledgements
and compact/full schemas; mechanical checks and independent captures; retained
findings, dependency currency, deletion and same-ID recreation; partial, failed,
unknown, cancelled and no-change outcomes; provider delivery and final settlement.
Root defects were target inference from non-authoritative return fields, incomplete
retained-result lifecycle, and consumers still assuming superseded return contracts.

Corrections preserve actual canonical targets including shared property owners and
structural parents, distinguish known removal from unknown scope, exclude reads and
unrelated idle transactions, and require exact mutation/check acknowledgements.
Missing or uncertain evidence remains unresolved without replay. Deferred images
never defer required mechanical checks; tools never certify the primary AI's visual
judgment. Known failures survive failed freshness checks, removed tool obligations
retire while real dependents become stale, and scoped reads traverse only necessary
dependencies. Compact summaries retain full evidence without cloning/resending it.
Output-contract revision 3 replaces affected basic mutation and retained-mapping
revision 2; current admission rejects replaced dependencies before any write.

Final focused evidence:
- `tmp/stage1-full-scope-final.log`: 330 server tests passed, including real adapter,
  recipe/operation handoffs, lifecycle and unknown-settlement regression cases.
- `tmp/stage1-close-consumers.log`: 270 direct consumer tests passed, three existing
  opt-in cases skipped; basic catalog, native provider, host, observation and schemas.
- `tmp/stage1-full-scope-browser.log`: 51 browser-owner tests passed; initial launch
  omitted jsdom and failed environment setup, then the declared environment passed.
- `tmp/stage1-close-transaction.log`: seven existing transaction tests passed.
- `tmp/stage1-native-canonical.log`: one real browser case passed in 11.2 seconds,
  covering plural edits, shared owners (including retained mapping outside its query),
  group/ungroup, deletion, no-change, read exclusion and unrelated-object exclusion.
  The subsequent revision-only change is covered by composition and schema tests.
- `tmp/stage1-close-types.log`: both declared production/server typechecks passed.
- `tmp/stage1-close-lint.log`: no lint errors; two existing no-console warnings remain
  in server test files. `tmp/stage1-close-naming.log`: naming gate passed.
- `tmp/stage1-close-proof.log`: same-source positive, three exact negative scenarios
  and recovery passed, 28 obligations. Source digest
  `9c17d80d5b0a4b03357c4d66dd1d3e9e979146cacd6fafeba8488e77cd0a870f`;
  baseline `05756ff7-eec4-41be-aac2-42f5feb1de24`, recovery
  `7f75a594-964a-48f6-9ca6-c4b322015d99`, accepted contract review
  `23bb51d84c3e2aa8db085476f34a859b5c06fee2d7063ec885589690b6f7a9b7`.
  The initial proof attempt correctly refused unaccepted mapping changes; this final
  proof followed contract review/admission. Earlier failed runs remain failed.

Limits: 658 focused unit/integration cases plus the browser case establish this
bounded flow, not whole-repository correctness or live101 timing improvement.
Unknown write coverage blocks successful completion; the correction below replaces
the earlier reconciliation wording with an explicit request stop and current-state
new-request handoff. It never triggers guessed targets or write replay. Full regional acceptance,
automatic repair, activity redesign and image analysis remain later-stage outcomes.
Temporary browser service ports 3300/3401/4401 have no listeners. Local configuration,
documents and ignored evidence are preserved. No commit/push/monitoring was performed.

### Step Execution Card - Stage 1 settlement and compact inspection correction

Owner: inspect and its direct operation/workflow settlement consumers. Supersedes
prior local completion: missing-scope recovery and normal successful-check payloads
were not closed by the earlier evidence. User authorized both corrections.
Inputs: canonical write receipts, existing request-owned check results, capture and
full-response preference. Outputs: preserved write outcomes, compact automatic
check summary, retained queryable findings, and truthful terminal scope diagnostics.
A missing/incomplete/mismatched write scope is irrecoverable within this request:
stop subsequent document writes, keep read/check/capture access, report unsupported
completion with no replay or pretend reconciliation. Transient mechanical failure
or stale evidence remains retryable through the existing review action. The existing
check store is the sole unresolved-scope owner; no parallel Set or clearing a safety
flag based on a geometry pass. A single request-level terminal obligation records
the first broken write acknowledgement; original receipts remain diagnostic data.
Automatic successful checks do not resend full findings by default. Explicit full
batch/workflow response may include them; direct review and exact retained reads
remain full. Capture image receipts and original primary write receipts stay intact.
No new tool, registry, recovery coordinator, cache, model call or compatibility path.
Files: local-operation-tools, local-design-workflow and their existing formal tests,
check-result consumption, exact spec/Inspector/manifest proof and generated catalog.
DoD: red/green terminal-no-replay plus retryable-check cases; large normal successful
and failing-mechanical-result payload sizes; scoped retained reads; standalone,
ordered and reusable-tool output compatibility; focused tests/types/lint/naming and
same-source proof. No full CI/live101/push/monitoring or later-stage implementation.


The terminal-scope regression also covers missing transport acknowledgement,
incomplete coverage, later successful geometry checks and fresh-request isolation.
The common failure envelope must preserve an owner's explicit recoverable=false;
its default recoverable failures remain unchanged. This direct invocation helper
and its existing tests are in the same handoff slice. Integration tests exposed
older fixtures with hardcoded foreign action IDs or omitted canonical scopes;
correct these producers, keep explicit mismatch regressions, and retain the original
structural product-payload budget separately from required canonical scope IDs,
with exact scope equality and total compact/raw reduction assertions. No production
structural compaction or Stage 3 behavior is changed to make those fixtures pass.

The first lost-acknowledgement response now carries the terminal guidance itself,
not only a later rejected write. The existing acknowledged-prefix regression caught
a direct consequence: structured owner failures must retain observed execution
evidence just as thrown failures do. The common invocation boundary attaches actual
acknowledgements only to unsuccessful unknown-settlement results lacking them;
it does not invent settlement, replay, or let diagnostic failures replace outcomes.

### Stage 1 correction closeout

Both review findings are closed. The existing check store owns the single terminal
scope obligation; ordinary mechanical failure remains retryable. Automatic checks
retain full findings and default to summaries; explicit full response and exact
reads preserve complete evidence. A lost acknowledgement reports the stop condition
on its first response, and subsequent writes cannot replay the acknowledged prefix.
The invocation owner determines outcomes once for unchanged results; optional
diagnostic collection runs only for unsuccessful unknown outcomes missing evidence.
Its new regression failed before the owner-order correction and passed afterward.

Final evidence:
- `tmp/stage1-recovery-verified.log`: 611 passed, three existing conditional skips,
  13 affected owner/consumer files. No full local CI or live101 was run.
- `tmp/stage1-recovery-types-verified.log`: declared production/server typechecks
  passed. `tmp/stage1-recovery-naming-verified.log`: 15 naming checks passed.
- `tmp/stage1-recovery-lint-verified.log`: zero errors, one existing no-console
  warning in the formal proof test. `tmp/stage1-recovery-catalog.log`: eight passed.
- `tmp/stage1-recovery-proof.log`: same-source positive, three exact negative
  scenarios and recovery passed, 28 obligations. Source
  `46fa49e2579e971b40d8ec28e6b76678abf52e23d34e55ddf24dc55b0c00d135`,
  accepted review `9935e6591444f03bf6820dda4c192faddb32cc768597164ead37dacbd40203f4`,
  baseline `01794d39-b39c-4577-b0ef-b98a3ed4d817`, recovery
  `907d9ed7-7da8-4a60-95cb-f6d791596e78`. Earlier failed logs remain failed.

Final review covered compact/full/direct/ordered/native/composed handoffs, retained
findings, acknowledged-prefix preservation, cancellation and failure boundaries.
No second state owner, new tool, execution interpreter, model call, compatibility
layer or limit increase was added. No performance timing claim follows from these
tests. That review preceded the separately authorized push at `62127de41`;
it does not authorize another push or monitoring.


## Stage 2 - Cumulative regional acceptance

### Frozen task contract and Step Execution Card - inspect

Objective: declared regional checks accumulate across primary-agent reviews and
satisfy exact required coverage. Editing tier 3 preserves the other seven passes;
only tier 3 and actual cross-region dependencies reopen. Neither omission, scope
shrink nor a whole-criterion pass may erase an outstanding regional obligation.
Owner: inspect (`local-design-review`), with its direct operation validation and
existing check-store consumers. Upstream: admitted criteria, delivered inspection
IDs and browser-issued dependency receipts. Downstream: correction handoff and
final settlement. Keep Stage 1 mechanical checking and mutation receipts intact.

Current defect: unit results are retained, but final admission requires a separate
whole-criterion check and supplied overview on each call; pendingCriteria ignores
unit passes. Thus storage granularity and completion authority disagree.

Design: optional criterion.requiredUnits declares nonempty, unique stable regional
or cross-region judgment identities for visual criteria. It uses the existing
24-item request bound, not a larger limit. Whole criteria remain an intentional
current contract, not a legacy fallback. Structure checkpoints retain their whole
criteria; reject partitioned structure/data declarations at plan admission rather
than failing them later. Use existing result IDs, scopes and dependency edges.
There is no second ledger, cache or general dependency language.

The initial criteria may still be defined after the first ready drawing. Freeze
their obligations once judgments exist, and preserve the existing prohibition on
rewriting an established plan after a drawing mutation. Initial declaration must
not introduce a new pre-drawing delay. Identical declaration is not permission to
reset findings. Required identities cannot be dropped by later sparse submissions.

Separate required judgments, actual image scope, evidence currency and whole-request
agreement. Unit names cannot prove that crops cover a drawing. Preserve the current
whole-request agreement/containment requirement as an explicit whole-view visual
criterion when declaring regional criteria. Reject a regional-only plan that would
silently remove that obligation. Regional checks do not each need an overview.
The whole-view criterion alone owns its whole-view judgment and canonical coverage;
requested native detail, facts, references and deferred decisions remain required.
Tools prove the declared obligations and evidence currency, not semantic completeness
of an AI-authored plan or visual correctness. No extra model is invoked.

Important limit: an edit inside a whole-drawing image really invalidates that image
and its whole-view judgment. Stage 2 preserves the other seven regional judgments;
it does not promise that a whole-view judgment remains valid after its pixels change.
Do not hide this by removing the criterion, relabeling crops as overviews or claiming
a crop-union algorithm exists. Semantic image comparison belongs to Stage 7.

Failure/cancellation: validate candidates before store writes; stale/missing images
cannot pass, invalidating a source reopens its dependent units, and failed refresh
never clears findings. Prior successful unrelated evidence survives. Existing
unknown-write terminal policy and cancellation semantics remain authoritative.

Mutation scope: local-design-review.ts, local-operation-tools.ts, existing
check-result owner only if needed, their formal design-review-stages/operation/
execution-flow proof tests, direct tool-definition tests, current spec, Inspector
inspect contract/proof manifest and generated catalog. Read/reuse existing browser
currency owners and their maintained tests; do not rewrite them. No Framework,
canonical write, renderer, viewport, UI, activity or recipe-engine changes.
Discovery is current source/direct call sites plus those maintained tests.

Proof cases: eight declared units accumulated across calls; one changed unit plus
one cross-unit relationship invalidated; seven unchanged units retain exact result
revisions and require no new capture/judgment/geometry work; missing unit blocks;
whole-pass omission cannot bypass; explicit redesign preserves required identity;
unknown unit/duplicate/malformed declaration rejected; no-plan rewrite after edits;
missing/stale/cancelled validation preserves prior results; whole criteria and
requested detail still block; native schema, host response and settlement agree.
Focused unit/integration/types/lint/naming/catalog and same-source proof only.

### Full plan review - corrected handoffs

Source review includes the actual plan schema and tool descriptions, review record
and invalidation paths, canonical browser receipts/containment, retained check store,
operation capture/assessment routes and provider completion settlement. The current
red test proves schema rejection only; it is not an implementation or whole-flow
proof. Its regional-only acceptance expectation must be corrected before using it
as an oracle, retaining the regional accumulation regression.

1. **One completion authority.** Derive obligations from admitted criteria and
   existing results. Seed each required visual unit as unverified in that store;
   do not leave a competing whole-criterion placeholder for a partitioned criterion.
   Missing records still count as unresolved. Pending lists, correction handoff,
   accepted evidence and final settlement use this same derivation. Historical
   previousChecks is diagnostic only; pendingCriteria is not another acceptance
   authority. All mechanical failures remain independently blocking.
2. **Save valid local work before considering completion.** Validate the entire
   submitted candidate before committing any of its judgments. Invalid IDs, scope,
   revisions or malformed declarations reject that submission without overwriting
   prior results. A valid sparse submission with other obligations missing is a
   successful recorded judgment with accepted=false, not a failed drawing or an
   instruction to resend every pass. Stale retained evidence marks only its actual
   dependents unresolved and must not discard unrelated new valid judgments.
3. **Capture and judgment stay separate.** Capture returns delivered image IDs;
   it neither records supplied judgments nor requires unrelated whole-view coverage.
   Only the later primary-agent submission can create a visual verdict. Preserve
   successful captures on partial failure and the exact failed-target recovery.
4. **Refresh exactly the required evidence.** Validate candidate receipts and
   relevant retained receipts through the browser owner. Reuse completed canonical
   measurements; do not perform a geometry scan because a visual unit is submitted.
   Do not use all historical inspections, superseded scopes or failed diagnostic
   evidence as acceptedIds. Before publishing completion, validate the effective
   accepted set, whole-view containment and all existing blocking conditions.
   validateCompletion must consume that same set rather than restoring the old
   all-supplied-images requirement.
5. **Bounded transport does not bound lifetime accumulation.** The 24-image input
   limit stays per call. The host can validate accumulated receipts in bounded
   batches using the existing per-call image budget, deduplicating identical stamps. The
   primary AI is not required to resend every image or passed result. No new cache,
   raised cap, or unbounded browser action batch. Cancellation or an incomplete
   acknowledgement never certifies the unchecked suffix. Revalidate source currency
   at the existing final publication/settlement boundary; evidence describes that
   observation point, not permanent immunity to subsequent document edits.
6. **Actual invalidation and redesign.** A unit depends on its exact image receipts;
   a cross-region judgment includes every image it actually uses. Entering/leaving
   a crop, deletion, reparenting, contributing ancestor changes and shared properties
   use existing canonical invalidation. Pan/zoom/selection do not. Unknown effects
   and document replacement remain conservative. Current reference/fact bindings
   are criterion-scoped: a changed shared source can correctly reopen every unit
   of that criterion; do not invent unit-level source precision. Scope replacement
   preserves the obligation, exact predecessor revision and explicit redesign reason.
   A reason string is not geometric/visual proof: the primary AI must address the
   retained finding using newly delivered evidence. Affected check dependents reopen;
   unrelated results keep their exact revisions. Identical replay is idempotent.
7. **Failure and concurrency.** Distinguish malformed submission, known finding,
   unavailable/stale evidence and cancelled validation. Validate before writes,
   commit locally without intervening asynchronous work, and do not publish a late
   pass after cancellation or replace a newer superseded result. Completed writes
   are never retried for review recovery. Failed refresh keeps the prior evidence
   as unresolved; teardown/new request cannot consume old request-owned receipts.
8. **Public contract through the final consumer.** Update canonical phase schemas,
   exact runtime validation, native conversion, descriptions, output/partial schemas
   and correction instructions together. Return derived coverage counts and pending
   criterion/unit IDs with statuses; provide retained-result lookup for evidence.
   Define optionality for capture/partial versus recorded-review responses rather
   than making coverage mandatory on a response that cannot yet provide it. Changed
   semantic tool contracts receive owner-specific revision updates; saved old recipes
   fail current admission rather than receiving compatibility repair. No global
   toolSemantics revision bump or second result envelope.

### Implementation order and bounded proof

All segments stay within inspect; reread its contract before advancing each segment.

1. Declaration and result authority: correct the permanent red test; cover an eight
   region plan plus its whole-view criterion, missing/duplicate/foreign units,
   data/structure misuse, initial declaration after first drawing, locked obligations
   and idempotent replay. Implement only admission and cumulative result derivation.
2. Real operation handoffs: prove local captures and partial valid judgments survive
   missing global coverage; repair tier 3 and its explicit relationship without
   changing the other seven stored passes. Refresh only the stale whole-view judgment
   when genuinely needed. Exercise canonical browser currency, not only a mock that
   always returns coverage.complete=true. Verify the completion consumer, retained
   measurements, references/facts/detail and unresolved mechanical conditions.
3. Failure and delivery closure: prove more than 24 retained images through legal
   calls, malformed/duplicate/missing acknowledgements, source change during refresh,
   cancellation, changed supersession, scope redesign and teardown. Invalid candidate
   writes no judgments; incomplete acceptance preserves all valid recorded work.
   Verify native and common invocation success/partial outputs and changed contract
   admission. Do not add a new recovery engine to pass these cases.

Work-count oracles separate receipt validation, region-membership lookup, geometry
evaluation, image capture and AI judgment. Seven unchanged regions require zero new
captures, judgments or geometry evaluation and unchanged result revisions. Cheap
canonical currency checks may still occur; do not claim zero work or measured speed
from output-only tests. A genuinely invalid global judgment is counted explicitly.

Run only affected formal tests, declared types, focused lint/naming, catalog and
same-source flow proof after the corresponding implementation slice. Finish with
diff plus direct-consumer review for requirements, failures and over-design. Stop
and replan this slice if it needs a crop-union engine, semantic image equivalence,
new browser evidence format or a different owner; do not expand silently.

Plan-review outcome: the initial proposal was not ready because it conflated unit
completion with pixel coverage and omitted downstream settlement and partial-save
semantics. Those contracts are now explicit. At that historical checkpoint implementation had not started and no Stage 2 gate
was green. The checkpoint was reported before implementation. Later execution and
verification are recorded below; no performance improvement is claimed. No push, CI monitoring, full local CI, live101 or next-stage work.


### Stage 2 declaration slice - bounded iteration

The reviewed plan was reported before implementation resumed under the active goal.
New formal cases reproduce unsupported requiredUnits and absent cumulative acceptance.
The owner suite also exposed a direct regression in pre-drawing plan replacement:
placeholder obligations from the former declaration must not remain pending, while
observed judgments may never be discarded. Keep the existing check store and its
revision accounting; permit only the plan owner to discard unjudged placeholders
before any mutation/judgment, validating the complete discard before changes.
Reference invalidation may have made those unjudged placeholders stale already;
an observed scope, known fail/pass or non-declaration dependency forbids discard.
No generalized visual-result deletion or new lifecycle store is authorized.

Existing all-or-nothing review assertions are revised to prove accepted=false,
exact unresolved criteria and retention of valid local work. Independent supplied
assessment tests retain exact criterion coverage, following current pending scope;
no additional model invocation is introduced. Work remains in the first inspect
slice; operation transport, final settlement and public handoff closure are pending.


### Stage 2 operation handoff card - inspect

The declaration/result segment passes 108 formal cases, server types, focused lint
and naming (tmp/stage2-owner-{verified,types-final,lint-final,naming-final}.log).
Original red logs remain failed evidence. Whole-view evidence cannot be borrowed
from a different regional judgment to approve an unrelated whole criterion.
Pre-drawing replacement discards only unjudged declarations; observed structure
judgments lock the plan before source/reference mutation. Idempotent declaration
and supersession preserve result revisions. No overall Stage 2 completion claim.

Next segment: the same inspect step's operation route. Inputs are delivered scoped
images, admitted unit judgments and canonical validation acknowledgements. Outputs
preserve capture, partial recording and final acceptance distinctions. Reuse actual
createInspectionEvidence in the maintained inspection-evidence.test.ts integration
fixture (Core reads/capture are controlled fixtures, currency/containment and server
review are production owners). This adds an end-to-end consumer case to that test;
browser production behavior is not rewritten. Extend existing operation/proof tests
for transport failures and bounded accumulation, then update exact public contracts.
No extra model, scene copy, geometry evaluator or new result store is permitted.


### Stage 2 bounded iteration - coherent accumulated validation

The real 32-region integration regression `stage2-source-drift-red.log` changes
window 2 between two validation batches and incorrectly accepts the drawing.
Individual `current` booleans cannot establish a coherent publication boundary.
The existing browser inspection owner already owns the observation revision;
return its session/revision as `validatedAt` with each validation. The host requires
one unchanged observation version across the batch sequence before publishing
new judgments. This is a read-only fence, not a dependency key: version drift
must preserve unrelated passes and request a fresh validation, never globally
invalidate receipts or re-render. Exact changed receipts still own invalidation.
No automatic retry loop or revision cache is added.

This supersedes the preceding no-browser-edit restriction only for the existing
validation response metadata in common-apis/inspection-evidence.ts, its action
schema in ai/inspection.ts, and their direct formal fixtures. No capture,
observation, dependency algorithm or canonical write behavior changes. The inspect
step already owns these files. Validate cancellation, malformed acknowledgements,
missing fence, drift and stable >24 accumulation, then recheck exact schemas and
same-source proof. The red case is a correctness failure, not a performance result.


Consumer closure review: the runtime-input completeness fixture assumed a shared
revision 2 for nearly every browser action. Current basic mutation wrappers and
retained-fill tools already publish owner revision 3. Re-audit confirmed no runtime
regression or reason to change those owners. The completeness test now requires a
positive safe integer and successful common registry admission for every action,
plus exact revision 3 for this changed validation action. Exact declaration/review
versions and canonical/native schemas have their own direct contract test. Do not
keep extending an unrelated tool-name list or downgrade current contracts to make
the old assertion pass. Consumer fixture changes are inside this handoff closure;
no additional production owner was changed.


### Stage 2 completion - 2026-10-13

The bounded inspect stage is complete. Required units, current result derivation,
local capture/judgment delivery, whole-view acceptance and final settlement now
share the existing check owner. The actual canonical-browser integration proves
8 and 32 region accumulation, one changed third-tier membership lookup, unchanged
other-tier records/capture counts, cross-region invalidation, recovery without
recapturing independent regions, bounded 24-action validation, and refusal of
mixed observation versions. Missing/duplicate/extra/wrong-name acknowledgements,
unavailable version metadata, declared failure, transport exceptions and cancellation
cannot publish a new judgment or dispatch an unchecked successor batch.

Final self-review also corrected unchanged-plan replies losing the retained fact
acknowledgement (formal red then green); no source data was dropped or recomputed.
The only additional browser production change returns its existing observation
version. It is not a new epoch owner, dependency key or global invalidation rule.
No Framework, renderer, viewport, activity, recipe engine, model or subscription
setting changed. No second acceptance ledger, compatibility branch, automatic
retry loop, extra model invocation or limit increase was introduced.

Validation evidence:
- `tmp/stage2-server-verified.log`: nine focused server/consumer files, 602 passed,
  three pre-existing conditional skips. This is not the full local CI.
- Browser owner/dependency/action tests: 37 passed in
  `tmp/stage2-browser-final.log`; that attempt retained one failed runtime-input
  contract assertion. Its corrected file has all 18 passed in
  `tmp/stage2-runtime-contract-verified.log`, for 55 browser tests across the final
  applicable results. Earlier failed runs remain failed evidence.
- Declared production server/browser typechecks passed in
  `tmp/stage2-server-types-final.log` and `tmp/stage2-browser-types.log`.
- Focused lint is clean after the runtime-input correction; two existing
  no-console warnings remain in formal test files. Naming: 15 passed; catalog: eight
  passed. Logs: `tmp/stage2-lint-verified.log`,
  `tmp/stage2-runtime-contract-lint-verified.log`,
  `tmp/stage2-delivery-naming.log`, `tmp/stage2-catalog-test.log`.
- Accepted exact inspect contract review
  `33e9936de2e8ae2af1b36bf6cf6cfa73d8432f007427209c8a57e39c832e006a`, mapping 64.
  `tmp/stage2-same-source-verified.log`: positive baseline, three precise negative
  scenarios and recovery passed, 28 obligations. Runtime/proof source digest
  `bea58480e44823440f59d9810e8dc179911dec1e7e4372353ce330c4dad52327`;
  final recovery `df70fa0d-bd7e-4a31-b4b5-e68e380fea0e`. All five changed production
  files and the proof test were byte-compared with that captured source afterward.

Limits: these are controlled permanent integration proofs, not a live Taipei 101
run or a first-frame latency result. Actual changed full-view pixels still reopen
that whole-view judgment; unchanged regional passes survive. Validation establishes
evidence at the observed boundary, not immunity from later user edits. Tools do not
prove semantic completeness of an AI-authored plan or replace the primary agent's
visual judgment. No service was started, no push/monitoring occurred, and the next
stage has not started.


### Stage 2 comprehensive correction - inspect

Authorized objective: audit and repair the existing second-stage declaration,
evidence delivery, cumulative judgment, dependency invalidation and settlement
contracts. This does not authorize later stages, live101, full CI, push or monitoring.
Baseline is HEAD 62127de41 plus the existing 21-file Stage 2 working diff.
Discovery is frozen to current inspect source, its direct browser/provider consumers,
current spec/Inspector, and their maintained tests. Review admission/identity, source
ownership/lifetime, sparse accumulation, final completeness, failures/cancellation,
public schemas, work counts and superseded instructions; no repository-wide audit.

Read-only review identified three cases to prove before production changes:
- Deferred visual decisions are saved only when the entire result is accepted, so
  valid sparse work can be lost. Store their dependency-bound verdicts in the same
  check owner; retain their explicit disposition as result metadata, not a second
  acceptance store. Merge sparse decisions by identity and invalidate only actual
  image dependencies; source/reference changes without finer bindings remain
  conservatively criterion-dependent. Changed detail definitions reopen their own
  decision. Never treat a reason as visual proof.
- A visual review can report accepted while the shared store contains unresolved
  mechanical results. Derive completion from both kinds of current results, retain
  visual passes, and allow mechanical-only recovery without rejudging unchanged
  images. Final settlement must use the same blocker boundary.
- A malformed negative currency acknowledgement may retire evidence before its
  required validation stamp is checked. Reject malformed acknowledgements without
  destroying previously retained evidence; valid explicit stale receipts still
  invalidate their actual dependents.

Owner and allowlist remain inspect, the existing check-result schema, direct
operation/provider consumers, maintained owner/browser/proof tests and current
spec/Inspector/generated catalog. No new cache, background task, model call,
compatibility path, retry engine or limit increase. Extend formal regressions first;
confirm each failure, then repair at its owner. Re-run affected owner/consumer tests,
production types, focused lint/naming, catalog and same-source proof. Final review
checks the changed contracts and all discovered cases once; report actual remaining
limits separately from defects and backlog.


### Stage 2 comprehensive correction completion - 2026-10-13

Three permanent regressions failed before production correction: sparse deferred
decisions were lost before overall acceptance, visual acceptance ignored unresolved
tool checks, and an unstamped negative validation removed a still-recoverable image.
The current check store now retains deferred disposition metadata and exact submitted
image dependencies; no accepted-only decision array remains. Changed definitions
reopen their decision; identical replay is stable and invalid candidates write no
judgment. Source dependencies are conservative where no narrower binding exists.
Completion reads current tool blockers without clearing valid visual work; mechanical
recovery proceeds through existing tools without another primary-agent verdict.
Malformed negative currency reports cannot destroy retained receipts.

Reviewed declaration/schema parity, capture versus judgment, cumulative required
coverage, ownership/lifetime, source/image dependencies, supersession, negative and
cancelled handoffs, transport batching, final settlement, work counts and scope.
The 8/32-region canonical-browser cases retain unrelated results and capture counts.
Whole-view judgment can wait for the final candidate; altered whole-view pixels
still require that judgment. No claim of semantic image equivalence, AI workflow
adoption or measured Taipei 101 speed is made. No further concrete finding remains
within this frozen second-stage review. Later-stage backlog remains unimplemented.

Final evidence:
- Server union: 606 passed, three original conditional skips. Five unchanged direct
  consumer suites passed in `tmp/stage2-audit-server.log`; its two failed fixtures
  remain failed evidence. Those fixtures omitted an authoritative move scope or the
  required mechanical capability despite expecting acceptance. Their valid-success
  setup now provides those current contracts, preserving regrouping/refinement
  assertions. All four affected suites then passed 271 cases in
  `tmp/stage2-audit-server-final.log`.
- Browser: all 56 tests passed in `tmp/stage2-audit-browser-final.log`, including the
  malformed negative recovery with no recapture. Existing jsdom canvas capability
  warnings are not a live rendering result.
- Server production types and focused lint passed: `tmp/stage2-audit-types-final.log`
  and `tmp/stage2-audit-lint-final.log`; one pre-existing test console warning remains.
  Browser production source is unchanged from the earlier successful type gate.
  Naming 15 and catalog eight passed (`tmp/stage2-audit-naming-final.log`,
  `tmp/stage2-audit-catalog.log`); diff whitespace check passed.
- Same-source proof passed baseline, all three exact negative scenarios and recovery:
  `tmp/stage2-audit-same-source-final.log`, 28 obligations. The previous attempt
  failed because the deliberate negative mutation still targeted the old branch.
  Only that injection anchor changed; its three required failed cases are unchanged.
  Accepted review `32dbb61b192ec11fba73846c1c6329dc695307a816f46eba734e350d4edc08e6`,
  mapping 66; source digest
  `b04dd2a2d51b8b96e514798e4d6fde0dbf39d6220fcb3a606933f6fa17db8c5b`;
  final recovery `2b06dad1-5044-49fb-8ce1-f2ab462d6836`. Nine current production,
  proof and contract files were byte-compared with that successful captured source.

No service, live model or recording was started. No full CI, push, PR, monitoring
or next-stage implementation occurred. Work remains in the original worktree,
uncommitted and unpushed. The stage goal is ready to close; the whole plan is not.


## Stage 3 - Direct structural delivery

### Frozen contract and reviewed design

Baseline: d7890d8a6. Objective: group, ungroup and move outputs supply a usable
ordered retained element set to the next registered operation without sending
IDs through model text. Preserve full immutable receipts, canonical write and
Undo authority, partial outcomes and existing Stage 1/2 checking. Deletion has
no editable target set; removed IDs never become live targets.

Discovery is fixed to basic API declarations/adapters/results, retained context,
its browser runtime wiring, operation delivery/ownership and direct consumers,
current execution spec/Inspector and their formal tests. No generic Runtime
redesign, new tool interpreter/store, rendering, query invalidation redesign,
model/limit changes, compatibility route or later-stage repair orchestration.

Review resolved these gaps before implementation:
1. Group/ungroup currently have opaque owner receipts; explicitly declare their
   result kinds and exact ordered live target semantics. Moves use acknowledged
   moved IDs, grouping uses grouped children, ungroup uses released children.
2. A server-expanded list can become stale in the mutation queue. Registered
   element-list argument schemas admit a retained reference; only the browser
   adapter resolves it inside synchronous mutation admission. Point/segment lists
   remain distinct. Resolve all references before the first canonical call.
3. Reuse the existing bounded retained context owner for ordered membership and
   immutable structural receipt. Publication copies no hierarchy or geometry;
   it uses the actual completed receipt, not a post-hoc selection query. Existing
   document revision, workspace, request leases, capacity and disposal apply.
4. Full data recovery is an explicit read of the retained immutable receipt,
   not another mutation invocation. Reading old receipt evidence may report stale
   target authority; stale evidence cannot authorize a write. Missing/expired
   references return actionable recovery and never automatically reselect/replay.
5. Admission/retention can fail after a real mutation. Preserve the original
   outcome and return unavailable delivery separately; no false target handle,
   rollback claim or second write. Host publication failure similarly preserves
   the acknowledged receipt while refusing dependent execution.
6. Compact delivery omits large structural values and mutation-scope lists only
   after the existing checking owner consumes the original receipt. Preserve
   counts, operation/root identity, outcome and a typed retained reference.
   Uncertain/failed receipts retain their diagnostics. Full response remains an
   initial-call option; later recovery uses the explicit read.
7. Successful and partial schemas export owned handles before child cleanup.
   Native batches and registered recipe calls use the same browser contracts.
   Existing caller/sibling pins and explicit release protection remain authoritative.

Names belong to existing App contracts: `retained` for structural output,
`snapshotId`/`leaseId`/`total` for its request-owned reference, and `delivery=receipt`
for exact readback. Element-list reference admission is explicitly declared by
its schema owner, not inferred from names. These are current unreleased wire
contracts; bump affected action revisions, no old aliases or dual contracts.

### Step Execution Card - apply direct delivery

Authority: execution spec structural receipts and retained query consumption;
Inspector apply and apply-to-compose, with compose ownership bridge verification.
Input: admitted registered operation, actual canonical result, request signal,
current retained context and actual mutation publication scope.
Output: truthful original outcome; declared ordered element membership/receipt
retained once; compact reference for downstream consumers; explicit unavailable
delivery when post-write retention fails. Deleted objects are evidence only.
Failure owner: apply owns write outcome; retained context owns availability and
freshness; host ownership owns publication and cleanup. Never replay a write.
Allowed files: basic-api contracts/actions/results, context-action/runtime-input,
retained-design-context, local-operation-tools/local-query-artifacts and their
formal tests; exact spec/Inspector/manifest/generated catalog. If necessary, the
shared App outcome adapter changes only to classify this delivery failure.
Forbidden contributors: model checks, callback JS, another canonical store or
scheduler, silent readback fallback, inferred live IDs, widened resource limits.

Prove first with permanent tests: large group-to-edit through actual adapter and
store with no hierarchy reread/ID expansion; native compact and full/readback
parity; declared input/output schemas; fresh recipe handoff and intermediate
cleanup; request/sibling isolation; stale queue admission, Undo/Redo/load and
released references; cancellation, capacity/publication failure after success,
empty/failed/partial receipts and no dependent replay. Retain Stage 1/2 focused
proofs. Work counts include retained publication, queries and canonical writes;
payload scaling compares equivalent small and large structural outputs.

Gates: focused browser and server owner/direct consumer suites, production types,
focused lint, naming before/after identifiers, generated catalog and same-source
positive/exact negative/recovery proof including the new handoff. No new live
model, complete local CI or unrelated package gates. Canonical geometry/Undo
implementation stays unchanged; use a real Core/Factory integration for the
consumer boundary when the existing harness supports it.

### Plan self-review conclusion

The flow is producer -> existing retained owner -> common ownership export ->
compact reference -> admitted browser consumer -> canonical API. Full readback
is separate and cannot authorize stale targets. Every failure has one owner,
post-write failures preserve settlement, and downstream work cannot manufacture
success or restart the producer. No unresolved design choice remains within this
stage; tests may expose corrections inside these boundaries. Finish local review
and required evidence, report limitations, then stop before Stage 4 or push.

### Stage 3 settlement boundary review

Integration exposed two handoff defects: batch output did not declare its retained
references, and a host publication failure could leave the browser success outcome
in control. Formal native-host and publication-failure tests reproduce both; the
current corrections export declared references and classify delivery separately
from acknowledged writes.

The final race review identifies another boundary: creating a snapshot after an
await can capture a later document revision. Freeze the receipt at synchronous
mutation settlement, after canonical publication and before yielding. Extend the
existing mutation executor with an optional settled observer, implemented by the
existing App transaction runner and the Runtime's direct-execution path. This is
a synchronous observation hook, not a scheduler, transaction or retry system.
The observer never throws from retention failure: the original result remains
acknowledged with unavailable delivery. A supplied executor that does not honor
the requested observer cannot publish a current reference. Add exact tests for
late mutations, cancellation and unavailable delivery, plus actual Factory
publication/Undo. Extend this apply card boundary only to Runtime types/helper
and its tests, App transaction adapter/tests and the existing basic-API E2E.
No independent generic Runtime change or Stage 4 work is authorized by this card.

### Stage 3 local closeout

The scoped self-review and implementation iterations are complete. Structural
outputs expose ordered live targets through the existing retained owner and
common lease bridge. Full immutable receipts remain explicitly readable; stale
receipt evidence cannot authorize new mutations. Compact delivery preserves
typed root identity and references after the checking owner consumes the full
result. No new store, registry, interpreter, model call or compatibility route
was introduced.

The reviewed corrections include standard-schema element-reference admission,
typed group identity for recipes, native-batch reference lifetime, truthful
post-publication failure outcomes, and synchronous receipt capture at canonical
mutation settlement. Tests detect stale queued references, later document
changes, foreign/released references, count mismatches, cancellation and
post-write capacity/publication failure without replaying acknowledged writes.
An equivalent 4,000-child compact response stays below 2,500 characters while
full receipt readback preserves all children. Direct handoff performs no
hierarchy or metadata reread. This is payload/work-count evidence, not a model
latency claim.

Verification on the final production source:
- Browser owners and consumers: 79 tests passed (`tmp/stage3-browser-final.log`).
- Server ownership, dispatch and recipe consumers: 242 tests passed
  (`tmp/stage3-server-final.log`).
- Runtime execution and multi-batch boundaries: 19 tests passed
  (`tmp/stage3-runtime-final.log`).
- Real Core/Factory registered and direct-canonical controls: two E2E cases
  passed; the existing scope E2E also passed. See
  `tmp/stage3-real-core-control.log` and
  `tmp/stage3-preexisting-scope-e2e.log`.
- Production browser/server types, Runtime build, scoped lint, naming (15 tests),
  generated catalog (8 tests), and diff whitespace checks passed. Scoped lint
  retains one existing no-console warning; no new lint error was introduced.
- Same-source proof passed 29 obligations, four exact negative scenarios and
  recovery (`tmp/stage3-final-same-source.log`). Candidate
  `fd4c6a57-6d7c-4d71-81bd-43e7c2285c91`, accepted review
  `f916f08fee4432925e9fe74a924a71e57c013d6e66f524b3412bb48684b99aed`,
  captured source
  `3d074d60ba0a09795b309fa6f455a229e3c9880c8c7477293be3af5dc9fec97c`,
  mapping revision 68. Baseline run
  `99f9e99e-b40f-4ff9-820c-010bd928c109` and recovery run
  `9c019fec-945a-4c9c-a96b-76916b1fe255` passed. Injected failures matched
  their exact expected cases; earlier failed iterations remain failed evidence.

Historical Stage 3 limitation (resolved by the persistence correction below):
both the registered-tool E2E and a direct canonical-API
control reproduced a collaboration persistence rejection (409,
`unsupported canonical publication batch evidence at batch 3 props/removeProperty`).
The control bypasses the new structural adapters. Local canvas membership and
Undo/Redo assertions pass, but durable saving is not certified by these tests.
No collaboration/persistence implementation was changed. Preserve this formal
control and evidence for a separately bounded persistence correction; do not
describe the entire App as error-free or silently expand this stage into that
owner.

No known unresolved finding remains in the Stage 3 direct-delivery contract.
This closes only that contract, not the independent persistence issue or later
stages. No full local CI, live101, remote push or monitoring was run for Stage 3.
Stop here; Stage 4 requires a new user instruction and its own reviewed goal.


## Persistence 409 correction - diagnosis and bounded contract

User authority: diagnose and repair the observed real group/edit/Undo/Redo
persistence failure, then prove saving and reload. Preserve all Stage 3 work;
no push, monitoring, Stage 4, full local CI or live model test.
Discovery roots: the actual publication capture, App collaboration classifier,
its document materializer/reducer consumers, Factory publication contract and
real history replay. Determine batch shape versus order/content from captured
publications before choosing a production change. Do not infer historical onset
from a current-version canonical control.

### Diagnosis Step Execution Card

Owner route: `apply-remote-publication` in the canonical projection and
collaboration Inspector; persistence consumes the same App classification.
Inputs: actual canonical SharedPublication slices, batches and deliveries.
Outputs: retained full test evidence and exact rejected publication; no production
mutation in this diagnostic slice. Canonical source order and source-slice
boundaries remain authoritative. Invalid evidence must remain rejected.
Allowed edits: this plan and existing basic-API E2E to capture actual publications
and fail on decode/save defects. Read direct source/consumer contracts; no
framework batching change or synthetic success. Next implementation card and
goal follow confirmed cause and reviewed solution. Completion requires formal
red/green regression, actual durable acknowledgement and a fresh reload equality
check, plus adjacent malformed-input, ownership, retry and typed-source gates.


### Confirmed cause and implementation plan review

Actual canonical-path evidence is retained by `basic-api-actions.spec.ts` as
`structural-publications.json`. Both undo and redo fail decoding: undo separates
scene move/removal and property removal into distinct slices; redo separates
property creation and scene creation. Event order remains correct. This is not
the earlier hypothesis of several property batches within one source slice.

The first incorrect boundary is Factory `createGroupedHistory`: it promotes
atomic member internal channel batch slice IDs into a progressive history
sequence. The App factory adapter collapses atomic publications, but a grouped
replay is progressive, exposing these internal IDs as independently applicable
boundaries. The App classifier correctly requires creation/removal dependencies
to be in the same applicable slice. Relaxing that condition alone would leave
live per-slice application and publication-window splitting unsafe. Preserve
complete atomic transaction-end member boundaries at the History owner instead.
Explicit progressive boundaries and immediate-delivery boundaries stay intact.
This identifies the mechanism on current source, not the historical first commit.

### Correction Step Execution Card - Factory history boundary

Inspector: transaction flow `finalize-transaction-state` / history grouping and
its `settle-local-shared-projection` consumer; preserve the canonical collaboration
`record-and-deliver-transaction-batch` and App `apply-remote-publication` routes.
Input: successful member journals, existing progressive delivery sequence and
ordered source batches. Output: grouped history retaining semantic boundaries,
not one publication slice per internal atomic channel batch. Normalize only a
member without an explicit progressive sequence, and only its contiguous
transaction-end batches; immediate boundaries remain ordered and independent.
Reuse immutable source batches and existing sequence representation. No payload
cloning, new journal, asynchronous scheduler or App-only replay exception.
Allowed source: Factory grouped-history assembly; tests in Factory history-groups
and flow-proof; Factory spec and transaction Inspector. Existing App E2E and
collaboration decoder/materializer tests prove the direct consumers. Production
App classifier, reducer, transport and persistence queue remain unchanged unless
new formal evidence requires a bounded replan of this same defect.

Self-review: grouping complete transaction-end runs does not merge separate
members, explicit progressive slices or immediate publications. Inverse replay
reverses those boundaries while preserving complete property/scene dependencies.
Same-document sequences/idempotency and malformed-source refusal remain the
existing backend owners. Do not remove same-slice validation or ignore failures.

Gates: fail-first mixed-channel atomic member replay, immediate/progressive
preservation; full Factory unit suite/types/build/lint and naming; existing App
collaboration classifier/reducer/materializer/queue tests; real canonical and
registered operations, save acknowledgement and exact fresh-page reload after
action, Undo and Redo; positive and exact-negative same-source Factory proof.
Include publication work-count assertions and retained evidence. No full CI,
performance mega-suite, model invocation, monitoring, remote operation or Stage4.


### Persistence correction re-review - restore sequence completeness

The new end-to-end oracle rejects a successful backend acknowledgement whose
checkpoint differs from the live canonical document after undoing ungroup.
The App decoder's whole-publication restore shortcut consumes only the first
restore and drops later hierarchy/property changes. This is inside the requested
real-operation persistence/reload guarantee. Extend the next owner slice to
App `operations.ts` and `publication-processor.ts`: classify restore operations
in the ordered stream, keep every prefix/suffix and source-slice boundary,
reject malformed/mixed property evidence, and retain existing canonical apply.
Add permanent decoder regressions for restore with preceding/following work and
multiple restores. No new protocol, arbitrary cross-slice merge, full-document
fallback or backend special case. The original real E2E remains the integration
oracle; compare actual document values, not only successful status.

### Persistence correction replan - exact insertion evidence

The real nine-transition test now passes grouped/ungrouped action, Undo and Redo
checkpoint/reload equality, but undoing a two-leaf deletion fails sequence 10
with `element creation index is invalid`. Local replay retains every original
`{data,parentId,index}` and Scene Tree prepares exact insertion entries. The
App's canonical creation translation instead reduces the batch to one parent
and the first index, treating replay order as a contiguous insertion range.
This loses evidence even if the input order is valid. Sorting that single range
would still fail for nonadjacent siblings or different parents.

Re-reviewed bounded solution: retain exact entries in the existing
`element-creation` CanonicalChange and both its Core and backend consumers.
Use Scene Tree's existing prepared canonical insertion owner and the same Props
exact-graph preparation; the ordinary contiguous creation convenience delegates
to that owner. No new recovery API, old-shape compatibility, index clamping or
per-element public writes. Transport still carries unchanged Factory evidence.
The backend groups entries by parent and applies their recorded indexes in
ascending index order while rejecting duplicate/out-of-range indexes. Document
cloning and atomic acceptance remain unchanged. Formal cases cover reverse wire
order, nonadjacent slots, multiple parents, and invalid indexes, followed by the
unchanged real operation/save/reload sequence.

Step owners: `coordinate-canonical-owner-preparations` for Core type/coordination,
then `apply-remote-publication` for App decoding/live apply and persistence's
direct canonical reducer. Explicit files are Core canonical-changes/create-apis
and canonical-owner-coordination tests; App app-protocol-types/operations and
its existing unit tests, backend reducer/tests and basic-API E2E. Update those
exact Inspector boundaries and the current document-session spec. Extend scoped
checks to Core unit/build and direct consumers; retain all previous negative
and exact-equality requirements. This is the same observed persistence defect,
not authorization for any unrelated framework redesign.

### Direct live-consumer check - raw-data evidence metadata

The same nine-transition test now retains an independent live peer in addition
to durable and fresh-load oracles. It exposes a raw visibility publication that
the backend materializes correctly while the live peer retains the old value.
The captured canonical event includes its declared `options.undoable` metadata.
Scene's exact raw-data preflight regenerates only semantic evidence and compares
that entire value against incoming evidence, including options. Extend this
owner slice only to Scene Tree's existing canonical raw-data preflight: exclude
only declared mutation options from semantic equality; keep every before/after,
identity, field, order and unknown-field mismatch rejection. Options remain the
caller's Factory/remote transaction policy and cannot create local Undo or echo.
Prove the existing stale-prefix regression still fails correctly with options
present, and rerun the real live/durable/reload oracle. No transport rewrite,
new actor mode or save fallback is authorized by this finding.


### Persistence correction closeout - reviewed local evidence

The confirmed failures were representational handoff defects, not arbitrary
reordering of the original actions:

1. Grouped History replay promoted internal atomic channel batches to separate
   applicable progressive slices. Factory now retains complete atomic members.
2. App decoding treated a restore as the entire publication, dropping subsequent
   moves and property updates. Ordered source-slice decoding now consumes all
   evidence and rejects unsupported tails.
3. Canonical creation collapsed exact per-element locations into one parent and
   starting index. Core/live/backend now retain exact insertion entries and reuse
   the existing prepared Scene and Props owners. Reverse order, nonadjacent
   siblings and multiple parents are covered without index clamping.
4. Live raw-data preflight compared declared mutation options against semantic
   evidence that does not contain options. Scene excludes only those options;
   stale before/after rejection remains verified with and without options.

Final bounded review checked producer/consumer types, slice boundaries, ordered
restore prefixes/suffixes, multiple parents and sparse indexes, malformed and
stale input refusal, property ownership, remote application, Undo/Redo, durable
acknowledgements, fresh loads, failed-save retry tests, generated contracts and
unchanged Stage 3 behavior. No old CanonicalChange shape, compatibility adapter,
new persistence protocol, journal, scheduler, retry loop or fallback document was
introduced. The ordinary contiguous creation convenience still has its ordinary
public use; it shares the exact insertion owner rather than preserving a retired
wire representation. Historical onset was not established and is not claimed.

Final gates:

- Factory: 289 tests / 15 files, build and scoped lint passed
  (`tmp/persistence-factory-verified.log`, `tmp/persistence-factory-final-build.log`).
- Core: 268 tests / 26 files and build passed
  (`tmp/persistence-core-final-tests.log`, `tmp/persistence-core-build.log`).
- Scene raw/canonical mutations: 68 tests, build and scoped lint passed
  (`tmp/persistence-scene-options-green.log`, `tmp/persistence-scene-build.log`).
  The options-bearing case first failed its stale-evidence assertion on original
  production source (`tmp/persistence-scene-options-red.log`).
- App classifier/Factory adapter/backend materializer/queue/reset: 79 tests;
  collaboration lifecycle: 20 tests passed in its declared browser environment
  (`tmp/persistence-consumer-verified.log`, `tmp/persistence-lifecycle-final.log`).
- Final real E2E: 3 passed in 54.4 seconds (`tmp/persistence-final-verified.log`).
  Registered and direct canonical paths pass. The nine-transition case checks
  group/edit, Undo, Redo, ungroup, Undo, Redo, cross-parent nonadjacent deletion,
  Undo and Redo. At every transition the full local document equals the backend
  checkpoint, an independent live peer and a fresh loaded page. Durable sequence
  equals accepted sequence 4 through 12. All nine checkpoint/publication captures
  are retained in `tmp/persistence-final-verified/`. No persistence rejection
  occurs in this final run. This is a correctness test, not a performance claim.
  Its 120-second whole-test watchdog covers nine real three-second flush windows
  and fresh loads; each persistence wait retains its 10-second deadline.
- Browser/server production types, final scoped lint and naming passed
  (`tmp/persistence-{browser,server}-types.log`, `tmp/persistence-final-lint.log`,
  `tmp/persistence-final-naming.log`). Inspector contract/catalog tests: 38 passed;
  generated public documentation check passed for 41 pages / 19 packages.
- Factory same-source proof: 10 obligations, six exact negative scenarios and
  recovery passed (`tmp/persistence-factory-same-source.log`); source digest
  `d3633e1b1f42b6e24803b105c2a71414592901fe631f0a52521a380054bfe651`,
  accepted review `3ca922527f7ca28d1a890aeeeecc6f87a23c146dd7ca47e0d300c6bff74bfd39`.
- Final Design same-source preservation: 29 obligations, four exact negative
  scenarios and recovery passed (`tmp/persistence-design-final-same-source.log`);
  source digest `152fefce1239f1ba40e3aef1e9677c76fd4fb18fef2056ab25716b82fec2a79b`,
  candidate `0d06f08a-99e8-4d57-9bea-ccec9a256a9b`, mapping revision 68. Earlier
  failed gates remain failed evidence; none is relabeled successful.

Test-owned ports 3300/3401/4401 are closed. Local .env and prior Stage 3 changes
are preserved. No push, monitoring, live model run, full local CI or Stage 4 was
performed. Stop at this completed local correction for user review.


## Stage 3 review correction - complete direct consumers and partial delivery

### Reviewed bounded plan and execution cards

The previous review found three concrete failures, not a reason to redesign the
registry or add compatibility. The existing apply-to-compose contract requires
acknowledged structural references to survive partial batch failure. Canonical
creation now requires exact entries; every current direct consumer must use it.

1. Apply-to-compose owner: accept acknowledged batch artifacts on both resolved
   receipts and BrowserBatchExecutionError receipts. Preserve the original
   failure, settlement and order; never replay dispatch. Export partial envelope
   references through the same typed schema before child cleanup. Tests cover a
   successful group followed by a failed operation, explicit later read/edit,
   eventual release, publication failure, and no automatic failed suffix retry.
   Allowed files are existing operation tools, query bridge, result contracts,
   ownership tests and their spec/Inspector. No new artifact store or retry loop.
2. Canonical publication consumer: update Sim's existing publication-journal
   producer to current exact-entry creation, with real publication/reload
   regression and typecheck. Preserve its storage owner, sparse insertion order
   and existing public Core API. This is a direct consumer correction caused by
   the current Core contract change; no Sim analysis or UI redesign.
3. Formal gate wiring: add structural-delivery.test.ts to the existing Design
   test:ai command, with a permanent package-script assertion. The current
   targeted tests must remain in ordinary package validation, not only manual
   commands or Inspector source inventories.

Review: success, partial, recovery and teardown all consume acknowledged data;
failed writes are not made successful. Freshness still belongs to the browser,
request leases to the host, exact insertion to Core. No old creation wire shape
is retained. Focused failing tests precede changes. Close with local focused
regressions, affected production typechecks, scoped lint/naming and contract
checks; retain unchanged earlier gate evidence only for unchanged sources.
Then push this stage before reviewing Stage 4. Final package-wide tests remain
required at Stage 8, as explicitly requested by the user.

### Stage 3 closure review evidence

The final correction uses the existing partial outcome schema and adds optional
resource annotations to it, rather than accepting a second, weaker envelope.
Local schema references retain their original roots. An ordered group/selection
failure test verifies the acknowledged prefix is exported, the suffix is not
executed, the exact retained receipt can be read and used by a later edit, and
request cleanup releases it. Unknown mutation scope remains write-blocking.
No retry or compatibility path was added.

- Design owner/lease/composition tests: 198 passed
  (`tmp/stage3-partial-ordered2.log`).
- Browser structural, Basic API, transaction and collaboration tests: 86 passed
  (`tmp/stage3-closure-browser.log`); ordinary test-command contract: 11 passed
  (`tmp/stage3-closure-script.log`).
- Sim storage and actual runtime save/reload lifecycle: 27 passed
  (`tmp/stage3-sim-lifecycle.log`). The new sparse creation regression proves
  exact entries survive IndexedDB reopening; the existing lifecycle exercises
  normal editing, Undo/Redo, journal replay through Core and full snapshot equality.
- Design browser/server and Sim TypeScript checks passed. Scoped lint has zero
  errors and the existing proof logger warning. Naming passed.
- Direct current canonical-creation producers/consumers were searched in App and
  package sources: Design and Sim use the current entry contract; no additional
  App producer of the removed shape was found. Shared History behavior remains
  covered by the prior Factory/Core/Scene proofs and actual Design save/reload.

Earlier failed test runs remain failed evidence. Full affected package suites
will run at the final integrated stage; these focused checks do not claim that
final milestone. Remote main and task branch were fetched and contained no
unintegrated or unexpected commits.

Design same-source proof passed baseline, four exact negative scenarios and
recovery (29 obligations), source digest
`a437fe64b93c6d3c684419d889874cf000ba921f1f30fef9ec69802fb4b0d229`,
`tmp/stage3-closure-proof.log`. Negative scenario failures are expected proof,
not failing ordinary tests. Stage 3 is ready for its authorized push.

## Stage 4 - admitted mechanical repair

### Plan review and owner execution card

Owner: compose-to-inspect route in `ai-execution-flow-inspector.data.cjs`, using
Runtime's existing admitted finite iteration. Product contract: Mechanical
verification in reusable tasks and Canonical mutation inspection scope. Inspect
owns geometry findings; canonical position operations own writes; Runtime owns
bounded execution; the primary agent supplies the explicit permitted correction.

The mechanism already exists. The missing proof is a real domain finding passing
through its actual action schema, host registration, recipe admission, invocation
and recheck. Begin with a child extending beyond an unrotated container. Use
`createDesignReviewer` and `createDesignReviewAction`, the registered position
operation, the real common host/library and its ordinary dispatcher. A minimal
in-memory geometry owner supplies positions; do not stub the verification verdict
or implement another checker/interpreter. The explicitly authored repair moves the
child inside the container. Check that initial preparation is never replayed.

Inputs: current target ID, explicit allowed position and finite recipe. Outputs:
existing Runtime success/partial/recovery envelope, acknowledged calls and actual
mechanical verdict. A mechanical pass does not authorize visual completion.
Unsupported geometry returns decision-required; repeated findings stop without
another write; cancellation stops successors; partial mutation does not become a
pass or eligible save. The coordinator holds no leaf barrier while awaiting a
child. No model/provider is constructed by the harness or check owner.

Allowed slice: existing `local-tool-operation-composition.test.ts`, review action,
reviewer and their immediate contract adapters only if the new proof exposes a
mismatch. Runtime iteration changes require their own bounded owner card and
regression first. No automatic geometry guessing, extra evaluator, new registry,
state machine, retry, persistence format or larger limit.

Self-review: Stage 1 automatic checks may run after the repair before the explicit
iteration recheck; this is supported and must not be confused with repeated
mutation. Stage 2 store retains dependency-current results. Stage 3 receipt and
scope rules remain authoritative. No-continuation outcomes return to Stage 5;
Stage 4 does not implement a program counter or replay initial steps. Add permanent
integration cases, run focused Runtime iteration/admission tests plus affected
App tests, production tsc and lint/naming. Review actual calls, not only status.
When those pass, push and close this stage before starting Stage 5.

### Stage 4 admission audit correction

Before changing production, repeated fixture admission failures were separated
from the owner defect. Saved recipes must use closed portable input schemas and
current input bindings for document data; open property maps are passed as typed
input values, not undeclared object-construction keys. Those safeguards remain.
The corrected input then exposed a real contract mismatch: review_design's target
was declared as an ordinary string, while its upstream document identity is a
`document` runtime value. Runtime correctly refuses the lost lifetime annotation.
The inspect action must declare the existing document-reference schema, preserving
its length bound, and bump its revision. Add the failing real-host admission test
as the regression; update direct current-contract consumers, never accept both
old and new revisions. This is the first incorrect canonical owner boundary;
Runtime compatibility and admission rules stay unchanged.

### Stage 4 closure

The actual reviewer finds container overflow, and the explicit canonical property
operation corrects the position through the real host and finite interpreter.
The recipe obtains metadata once, checks, repairs once and rechecks; it never
replays the initial step. Current document identities and property values are
invocation inputs, not captured recipe literals. A revision-4 review action fixes
the missing document-reference annotation; admission and Runtime are unchanged.

Five real-domain host cases cover repair, no progress, unsupported geometry,
cancellation and acknowledged partial completion. Unsupported checks return their
retained decision-required finding without saving eligibility. Cancellation uses
the real AbortSignal and cannot dispatch another call. Failed executions retain
candidate metadata only, never successful execution evidence. This is distinct
from losing the candidate or silently retrying its work.

Validation: 177 host/operation tests (`tmp/stage4-host-closed.log`), 109 Runtime
iteration/admission tests (`tmp/stage4-runtime-tests.log`) and 20 browser review
tests (`tmp/stage4-review-tests.log`) passed. Design production tsc, scoped lint
and naming passed. The same-source proof passed 29 obligations with four exact
negatives and recovery. Early invalid fixture schemas and stale fixture outcome
assumptions were corrected to the authoritative current contract; they were not
production regressions. The binding rejection for the correctly typed document
input was the production regression and passed only after the owner fix.

Self-review: no additional model, algorithm, interpreter, compatibility branch or
automatic design choice. Existing complete/unsupported verdicts and mutation-scope
protection remain. Stage 5 owns resuming unresolved intent in a new segment.

## Stage 5 - primary-agent continuation

### Reviewed plan and owner execution card

Owner: compose route; existing discovery, library controls and provider protocol.
Inputs are the original objective, current registry contracts, unresolved checks
and typed acknowledged recovery. The primary agent chooses the correction; tools
validate and execute it. Output is a new admitted execution segment for remaining
work, followed independently by durable eligibility or save-only recovery.

Use existing submit/invoke/save controls. A segment is an ordinary admitted tool
invocation, not a new task object, persisted program counter or arbitrary DAG
resume. After a partial recipe, the model reads its declared recovery and remaining
checks, chooses a current existing capability or authors only the missing steps,
and supplies acknowledged identities as fresh inputs. It never reruns initial
creation to continue a suffix. Library resume restores a saved candidate's
availability, not execution progress. Repeated provider call IDs are already
rejected by the request protocol; test that actual owner instead of duplicating
identity tracking in the library. Concurrent distinct calls still use leaf
scheduling. Request cancellation and unknown writes remain terminal as specified.

Review found guidance for stopping and save-only retry but no explicit distinction
between a new execution segment and library resume. Add the exact guidance and
permanent prompt contract. Add real-host create/failed-select/selection-only
continuation, proving one creation and current typed ID delivery. Reuse existing
real-provider protocol and saved-tool rediscovery tests, save-failure/no-replay,
concurrent receipt and shutdown tests. Add missing repeated-ID protocol coverage
in the existing provider harness. No live model required; mocks replace only the
external transport and domain owner methods, never Runtime admission or dispatch.

Allowed files: existing domain prompt and tests, operation-composition and provider
tests; immediate host/protocol corrections only after a demonstrated regression.
Do not change Stage 4 mechanics, model settings, security, schema strictness or
limits. Self-review downstream: Stage 6 receives existing actual call IDs and
purpose metadata; Stage 2 passes and Stage 3 artifacts remain request-owned.
Focused tests, lint, tsc and bounded review precede this stage's commit/push.

### Stage 5 closure

Guidance now distinguishes remaining-work execution from candidate availability
resume. A real host creates once, stops at failed selection, exports exact
acknowledged IDs, discovers the selection capability and saves a newly admitted
selection-only recipe after success. No re-creation occurs. Actual provider
protocol tests reject repeated native call IDs both while active and after reply,
with exactly one dispatched operation. Existing save-only, concurrent receipt,
shutdown and saved-tool rediscovery cases passed without new state or limits.

Validation: 248 tests passed, three pre-existing conditional skips
(`tmp/stage5-handoff-verified.log`), production server tsc and scoped lint passed
(the existing proof logger warning remains). Naming and same-source proof passed.
A prompt test still expecting old final=false wording was aligned to current
accumulation/completion wording while preserving the local-work-retention check.
No production executor changed and no AI was launched.
