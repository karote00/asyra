# Reusable Tool Composition - Staged Corrections

Status: all five sequential corrections are locally implemented and verified.
Baseline: `d483471e825133de14098517e73a1c9860a57be8`. Combined review and applicable
integration gates and the authorized recorded acceptance are complete. Delivery is
authorized; the source remains unpushed until the applicable delivery checks pass.

## Current authority and stop boundary

Execute **Recorded acceptance - five sequential corrections - 2026-10-17**.
Complete Inspector admission before the first correction goal and production edits.
Work on one problem and one existing owner segment at a time. Review and pass its
upstream/downstream integration gates before advancing. Report together after all
five corrections and their combined review; report genuine blockers when necessary.
No model calls during deterministic review or mechanical checks. After the renewed
review and its applicable integration gates pass, the user authorizes one recorded
full Taipei 101 acceptance with the existing independent 15-minute hard deadline.
The latest user request authorizes pushing this branch and opening a PR. Integrate
the current target, review the accumulated branch and pass applicable local delivery
checks before pushing. This does not authorize merging, restarting monitoring or
another recorded acceptance. Preserve unrelated README/template/source-map changes.
Historical authorizations below do not apply.

### CI aggregate output correction - 2026-10-18

Owner step: `aggregate-workflow-results`, governed by CORE_PROOF.md
`Final workflow aggregation` and the core-proof Inspector step/terminal route.
PR #345 run 39046337314 completed every selected producer but its aggregate was
cancelled after the output stream stopped inside a multi-megabyte runner detail.
Replaying the exact downloaded inputs completes computation in 0.295 seconds and
produces 16,096,913 output bytes. The result is failed because five existing
expected-failure gradient assertions remain failed under the current contract.
Do not change that failure authority or label this replay passed.

Inputs/contributors: existing run-bound scope, producer receipts and immutable
observation bundles. Output: unchanged verdict/blockers and complete retained
result, with bounded stdout counters and an explicit evidence file. No raw runner
payload enters stdout. Failure owner remains the aggregate; evidence-write failure
must fail, not print a false passing result. Preserve the existing timeout and
all identity, coverage, partial-rerun and assertion checks. No new model calls,
product execution, fallback classification or monitoring.

Mutation boundary: existing workflow-results owner/tests, main workflow artifact
upload, CORE_PROOF contract, its Inspector condition/generated catalog and this
plan. Formal regression: real CLI with a large retained runner payload must finish
with bounded stdout and exact full evidence, including failed/partial outcomes;
unwritable output must remain nonzero. Run workflow-results and direct observation
integration tests, catalog/workflow contracts, lint and naming. Replay the exact CI
bundle after the fix and distinguish the resolved transport issue from retained
render failures. Stop before unrelated rendering changes unless separately
requested. The user has not requested another push in this correction turn.

Self-review: this corrects evidence delivery at its existing owner, not test
semantics; complete producer evidence and immutable originals remain available.
The generated catalog is derived only after the condition is synchronized.

### CI gradient assertions - authorized follow-up - 2026-10-18

The user explicitly included the five gradient failures in this correction.
First close the aggregate owner: 50 workflow tests pass; direct workflow,
observation, report and catalog integration has 132 passed/44 existing guarded
skips. Exact CI replay preserves the full failed result while reducing stdout
from 16,096,913 to 1,929 bytes (0.313 seconds). No expectation/failure weakening.

Next owner segment: existing Design functional `drag-gradient-handles` and its
canonical gradient/material handoff, with `render-material` inspected as the
consumer before any renderer mutation. Spec: functional-failure-responsibilities
`drag-gradient-handles`/`render-material`; handles are unrestricted and stop
ordering/colors preserved. Inputs are canonical normalized handles/stops, actual
pointer positions and the current element/view transform. Required outcome is
correct interpolation at each actual sampled pixel throughout the gesture.
Endpoint colors are required at their handle positions, not at arbitrary interior
pixels. Test reports cannot redefine canonical gradient mathematics.

Discovery is bounded to the five existing gradient-fill-render failures, shared
sampling helpers, gesture and material owners and their direct tests. First
record exact canonical inputs and screenshot sample coordinates; verify current
formal oracles against independent linear interpolation before changing runtime.
If runtime diverges, add the matching source-space regression before a single
owner correction. No fixture-specific colors, relaxed pixel tolerances, hidden
expected-failure annotations or Inspector bypass. Preserve reversed/outside
handles, drag continuity, Undo/Redo, shared fills and non-linear materials.
Only edit the first incorrect owner after admission; test-only oracle corrections
must prove canonical handles and actual pixel positions plus browser pixels.

Gates: existing gradient browser suites, analytic sample assertions, retained
screenshots at actual zoom/device scale, focused lint/types and affected owner
regressions. Add independent samples that detect inverted stops and stale frames.
Do not alter test names/case identities needlessly. Stop if another semantic owner
requires a new correction segment. No 101/model run, remote push or monitoring.
Self-review: the existing tests sampled y=0.1/0.9 but sometimes expected colors
for y=0/1, and static brightness checks cannot describe moving handles. Separate
this oracle defect from actual rendering evidence before implementation.

Gradient diagnosis: unchanged runtime passes all six render scenarios after
correcting the independent pixel oracle and excluding editor color-stop overlays.
The old static reversed test expected pure endpoint colors at y=0.1/0.9; actual
linear interpolation yields intermediate colors (for example red about 51 rather
than 0). The outside-start test used boundary y=0 expectations at sample y=0.1.
All three drag tests required fixed shape-edge colors while moving the gradient
axis, and x=0.25 intersected the moving editor stop swatches. The intermediate
analytic run passed both static cases and exposed the overlay contamination in
three drag cases. Side sampling then passed all six without runtime changes.
The final oracle additionally checks expected handle positions for every one of
90 moves, unchanged stops, exact CSS pixel centers and a tighter 12-channel-unit
tolerance. Expected-failure annotations are removed, not replaced with skips.
The stricter motion oracle initially expected a one-pixel pointer move to mutate
canonical handles, contrary to the existing three-pixel Feature admission rule.
Re-reviewed the input/Feature/render handoff: preserve that original click/drag
threshold in the expected state, using its authoritative App constant; do not
change production gesture behavior. All 90 sampled positions remain checked.
Screenshots and original failing reports remain local evidence. Current material
spec now states the existing signed-axis interpolation rule explicitly.

CI correction closure:

- Final gradient render run: six passed, zero skipped, zero expected failures,
  zero flaky cases (54.7 seconds). Fifteen adjacent handle, material and vector
  gradient cases passed in the preceding combined run; only the changed render
  suite was rerun. That preceding run retains its three motion-oracle failures
  and is not relabeled passed. Final screenshots for all three drag directions
  were inspected at 100% zoom, with canonical handles and stop data attached.
- Workflow owner suite: 50 passed. Direct observation/catalog/workflow integration:
  132 passed and 44 existing guarded skips. Exact downloaded CI replay retains
  the original failed aggregate byte-for-byte in parsed content; compact stdout
  is 1,929 bytes and the complete artifact preserves every runner detail.
- Design production typecheck, final scoped ESLint, naming (15 tests) and diff
  whitespace checks passed. Temporary browser service ports 3000/4101/4201 have
  no listeners. No renderer, gesture, model or timeout behavior was modified.
- Bounded self-review covered producer identity, failed/partial outcomes,
  artifact-write failure, always-upload delivery, original gradient case IDs,
  all 90 positions per gesture, original drag admission, adjacent materials and
  Undo/Redo. No assertion failure is bypassed by the aggregate correction.
- Evidence: tmp/pr345-{workflow-final,ci-integration,gradient-verified,
  design-types,final-lint,naming-final}.log; tmp/pr345-gradient-verified.json;
  tmp/pr345-ci-artifacts/aggregate-{before,after}.json. Final browser screenshots
  are retained under apps/asyra-design/test-results/*/gradient-canvas.png.
- Corrections remain local. PR #345's original cancelled/failed CI remains
  unchanged until a separately authorized push and new workflow run. No 101,
  live inference, push, merge or monitoring was performed in this correction.

CI correction delivery authorization - 2026-10-18: the user now explicitly
requests pushing these verified corrections to existing PR #345. No merge or
monitoring is authorized. The fetched main is already included in this branch;
retain the preceding exact-source browser/type/lint evidence and run the bounded
workflow/catalog and commit-dependent checks before delivery.

### Delivery integration - 2026-10-17

The user authorized push and PR creation after the renewed review and recorded
acceptance. Rebased the accumulated branch onto main
`748011ca127eabd5832df1f590d6e00b8a9d7651` without conflicts; product inputs are
unchanged by the rebase. Preserve unrelated local README/template/source-map work.
The delivery preflight found stale generated Inspector catalog and public API
index content. Existing contract checks reproduced both failures. Regenerate with
the existing owners after rebuilding declarations; catalog 8/8 and public docs
41 pages/19 packages now pass. No hand-edited generated semantics or production
changes. Run applicable local delivery checks against the resulting committed
source before publishing; do not restart monitoring or merge this PR.

The shared delivery gate also detected stale direct consumers: the root Undo
example, generated template README/environment, and the release test's exact
TypeScript command. The three previously preserved documentation edits match
these task-owned contracts exactly; their content is retained and included.
Only the canonical environment example and current three-config type assertion
were synchronized, followed by public source-map generation. Existing formal
regressions now pass 45/45, and focused lint is clean. No runtime change or full
release-template regeneration. Continue the remaining delivery checks while
retaining exact-source evidence for unchanged prerequisites.

#### Delivery Inspector presentation correction

Owner: existing Inspector data and generated catalog only. The full Inspector
viewer/structure tests reproduced an unresolved descriptive output on `apply`
and a supplemental publication-document link incorrectly selected as the primary
specification, producing double fragments. Keep the existing execution receipt,
Factory/history conditions, canonical publication owner and failure routes. Remove
the redundant non-artifact output text; classify the supplemental document as a
reference to its existing file. The declared primary spec and all step anchors
remain unchanged. Do not alter viewer validation or product runtime. Existing
viewer structure, all-catalog rendering/link checks and owner contract tests are
the regression oracles. Regenerate the catalog, verify admission/proof for the
exact corrected declaration and rerun Inspector/shared plus remaining gates. The
owner-specific anchor oracle also stripped existing hyphens from real Markdown
headings, unlike the rendered-link oracle. Preserve heading hyphens in that test;
the current `Tool-first correction contract` heading remains unchanged.


#### Delivery Inspector observation fixtures

The complete control-plane gate reproduced stale observation consumers after the
current Factory/shortcut and tool contracts changed. Restrict this correction to
the existing test fixtures, shortcut/functional observation manifests, shortcut
Inspector declaration and generated catalog.
Use the selected negative scenario's exact declared failures, not the union of all
negative obligations. Keep independent transaction-boundary obligations exercised
by their own scenarios. Inject reversed captured history intent at its current
owner; preserve valid-direction failures and successful invalid-intent guards.
Synchronize observation inventories with the current declared cases and verify
failure localization, retained attempts and recovery. Do not change product code,
weaken assertions or infer expected failures from the observed failed run. The
existing 17 failures are the red evidence. Run affected formal control-plane tests,
shared checks and the remaining browser delivery gates before push. Remove nine
obsolete real-model observation entries; map the three current export actions and
five immediate-history browser cases to their existing declared owners. The
shortcut declaration consumes captured intent, matching the current product spec.

#### Delivery complete action-usage inventory

The first functional browser case rejected the incomplete semantic usage table:
all three registered document-export actions were absent. Extend only the existing
browser fixture with actual export, download and release calls through the same
Runtime/transaction owner. Assert immutable metadata and source hash, unavailable
handle rejection, idempotent release, unchanged document/selection/history and
ordinary resource disposal. The existing dedicated export browser test continues
to prove downloaded bytes and durable reload. Preserve the exact registry-to-case
inventory assertion and every existing invalid-input/cancellation/domain oracle.
Run the whole action-usage suite and its lint before resuming functional/render
delivery gates; no product changes or repeated collaboration suite are required.

#### Delivery indexed-query consumer correction

The full functional gate reached the bounded-tier integration case and reproduced
an unavailable retained owner: the fixture constructed `createDocumentContextAction`
without its required backing owner and supplied the removed public `result: ids`
shape. Update only that existing fixture to use the actual Runtime registry,
`resolve_design_targets` for transient complete identities, the registered mutation
and normal transaction runner. Preserve the exact tier target, zero parent-children
reads, visible result and Undo restoration assertions; dispose actual resources.
This is current-contract integration, not a fallback or compatibility path. Run
all indexed-query cases and focused lint before continuing the complete functional
suite. The prior functional run remains failed; five pre-existing gradient
expected-failure cases are unrelated and unchanged. The same formal file also
reproduced `Retained query belongs to another request`: its producer omitted the
request signal while its consumer supplied one. Preserve that rejection and
synchronize the producer signal plus returned lease at every renewed snapshot;
retain stale-after-Undo and shared-property conflict/recovery assertions.


## Recorded acceptance - five sequential corrections - 2026-10-17

### Bounded planning contract and evidence

Objective: make the recorded operation-to-result flow correct end to end, without
larger limits, compatibility aliases, exceptional tool-name routing or another AI
reviewer. Preserve tool-driven mechanical checks, primary-agent visual judgment,
accumulated independent passes, canonical mutation/history, collaboration and
actual durable acknowledgement. A model assertion never proves image suitability,
visual correctness or storage success.

Evidence root: `tmp/ai-recording/runs/reusable-tools-1792226401062/`.
Use `tool-details.json`, the original `executions/` streams, `run.json`,
`current-status-analysis.json`, `final-selected-references.json` and the saved
`document.json.gz`. The actual exported document is 177,684,228 JSON bytes; the
ordinary action endpoint admits 16 MiB. The browser completed the export before
the parent tool aborted. The original failed receipt HTTP status/body was not
retained: do not rewrite that uncertainty as a historically observed HTTP 400.
The new integration proof must distinguish size rejection, connection loss and
lost acknowledgement explicitly.

Discovery is frozen to the five recorded failure classes, their existing owners,
registered descriptors, direct consumers, current spec/Inspector and formal suites.
Promote the necessary minimal sanitized input/output and event sequences into
existing permanent recorded fixtures during implementation; do not rely on ignored
local reports as the only regression oracle. Reuse the saved document for the
large-data proof. Do not upload videos, diagnostic payloads or local-only harnesses.

Current contract sources are `docs/ai/apps/asyra-design/specs/ai-execution-flow.md`,
`ai-conversation-experience.md`, `design-preparation.md`, and
`tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs`.
Existing flow owners remain request, compose, prepare, apply, inspect, settle and
observe. Before each future slice, amend the matching current spec and exact
Inspector route, obtain supported admission, and write its Step Execution Card.
This prose review is not Inspector admission or passing runtime evidence. Do not
create a second registry, evidence authority, persistence queue or activity reducer.

### Intended whole flow and dependency order

Primary agent chooses a purpose and explicit source/check scope -> current registry
admits the exact operation -> canonical owner executes once -> internal complete
receipt feeds validity, history and dependency consumers -> typed external delivery
returns bounded useful data -> the same review owner accumulates current judgments
-> the existing completion owner confirms durable publication -> the existing
activity reducer projects honest principal-task state throughout.

Execute corrections in this order: (1) save/export settlement, (2) excessive output,
(3) check-input/evidence handoff, (4) reference scope, (5) status projection.
The order is intentional: output delivery consumes the settlement distinction;
reference scope binds to the corrected check identities; status consumes final
operation semantics. This is execution order, not permission to mix five problems
in one implementation slice. Each correction may have several sequential existing
owner slices, but the next problem stays closed until the current one passes.

### Correction 1 - Separate persistence confirmation from document export

**Owner and routes:** compose -> apply -> settle, with observe recording delivery.
Core owns `Core.save()` serialization; it does not own durable document confirmation.
Design's existing document session and `report_outcome` completion path own the
captured publication target and its acknowledgement. Keep these owners unchanged.

**Contract:** ordinary completion requests durable confirmation, not full document
serialization. The advertised tool contract and discovery must distinguish export
from persistence in purpose, output and effect. Remove the ambiguous raw-document
AI route; do not retain an alias that silently changes its meaning. Preserve the
public Framework serializer and explicit document export capability. Classify the
other whole-document serialization capabilities by the same declared delivery
semantics; do not leave a props/hierarchy serialization bypass or remove narrow
query capabilities. An unavailable persistence confirmation must not be presented
as durable completion merely because report_outcome returned normally.

For an explicit export, use a browser-owned export artifact and local download
consumer, built from the existing Core serializer and browser Blob/download
facilities. Return typed metadata (artifact identity, document identity/revision,
format, bytes, integrity information and availability), never the document body in
a tool receipt. Bind the snapshot to the actual document generation using existing
canonical snapshot/revision facilities; a changed generation cannot be labeled as
the originally requested export. Do not add a second publication barrier. The export owner retains immutable bytes until download/release or
its defined owner disposal; request cleanup must not invalidate an export already
handed to the user. Failed creation publishes no usable artifact. Expired artifacts
are reported unavailable; a later export is explicitly a new read of current state,
not a silent reconstruction of the old revision. No model-selected filesystem path,
base64 document text, universal artifact platform or second editable document store.
Full-export JSON is not a recipe intermediate; current recipes/discovery must use
the actual typed output and revision. Existing incompatible saved recipes become
ineligible with a precise contract reason, not automatic migration or fallback.

**Failure contract:** preserve execution settlement, delivery acknowledgement and
durability separately. Validate bounded external receipts before POST. A healthy
channel returns a recoverable delivery rejection with the exact batch/action and
known settlement; a broken channel remains terminal with unacknowledged settlement
explicitly unknown at that observer. Retain bounded safe HTTP status/code, byte
counts, boundary and cancellation cause; do not capture entire error bodies or
secrets. Never replay a completed mutation because receipt delivery failed. The persistence queue retries its original publication batch; pending durable
confirmation retains its captured target while its document session is valid;
reload resolves through the existing document recovery owner, not a stale-session
receipt. Later edits cannot extend the original acknowledgement target.

**Boundaries and proof:** current `basic-core-api-contracts.ts`, canonical registry
exposure/results, `actions.ts` completion, `server-action-batch-provider.ts`,
`action-batch-protocol.ts`, server `action-batch.ts` and existing document/export
consumers; use profiler metadata only at its existing observation adapter. First
reproduce the recorded oversized receipt against the real middleware with a
controlled provider. Then prove real Core export, usable download integrity,
unchanged endpoint limit, cancel-before/after execution, response loss, storage
failure/retry, document replacement and save/reload equality. Preserve read-only
history and confirm normal edits, Undo/Redo and collaboration still persist.
Run the existing browser-provider/server-action-batch, basic API, runtime-input,
conversation and document recovery integration suites. A mock serializer alone
cannot close this correction; a generic abort without its first failure cannot pass.

### Correction 2 - Separate complete owner results from model delivery

**Owner and routes:** apply -> inspect consumes complete execution receipts;
apply -> compose delivers the registered external view. Runtime validates each
contract at its own boundary. Projection is after internal validity/dependency
consumption, and before the transport whose budget it must satisfy.

**Contract:** declare the delivery view at the authoritative tool registration,
including its schema and lifecycle. Use the same declaration in direct, batch,
native and composed invocation. Internal consumers still receive exact mutation
IDs and status/settlement. The model receives counts, useful identifiers, actual
failures and typed retrieval references where necessary. Do not teach the generic
serializer field-name guesses, a list of tool-name exceptions or silent truncation.
A composed successor that needs the original typed value must still receive it or
an explicitly declared consumable handle, never an undocumented summary substitute.

For large successful mapping results, consume the complete mutation scope before
projecting the model receipt. Recoverable full evidence uses the existing retained
receipt owner, exact request ownership and byte accounting. Retrieval must be
bounded/paged where needed; a full-response option cannot force an oversized inline
receipt. Partial/failed results preserve exact settlement and access to failure
details, not success-shaped counts. If retention/publication fails after a write,
return acknowledged execution plus delivery-unavailable, block missing-handle
consumers and never replay. Historical receipt access cannot refresh stale edit
authority. Borrowed and sibling leases survive another consumer's cleanup.
If an internal dependency consumer is across the browser/host boundary, an opaque
handle alone is insufficient: it must resolve through the existing admitted receipt
reader in bounded pages under the same lease before declaring scope complete.
Do not replace omitted IDs with an empty complete scope. Budget failure preserves
unknown/unresolved inspection state. The changed transport must also admit its
bounded failure envelope when the original result cannot be delivered.

**Boundaries and proof:** `tool-contract.ts`, canonical result declarations,
`basic-api-results.ts`, retained-context/structural delivery and
`local-operation-tools.ts`; Runtime public contract files only if the existing
shared declaration requires a delivery field, with its direct consumers updated.
Replay the recorded 3,584/1,600-ID mapping results: prove exact internal invalidation
and bounded model output with no full ID list, then retrieve the original evidence
and verify equality. Cover empty, no-change, partial, failed, wrong-request, stale,
cancelled, exhausted-budget and lost-publication outcomes. Use retained-fill,
structural-delivery, local-operation-tools, composition and execution-flow suites;
assert work/serialized-byte counts as well as values. Re-run correction 1's transport
cases. Explicit full-schema refresh remains supported; do not infer a provider
failure from a model-supplied refreshReason or introduce another definition cache.

### Correction 3 - Deliver exact check-to-evidence bindings

**Owner and routes:** inspect capture -> inspect judgment -> inspect-to-compose
repair feedback; compose owns schema lookup. The primary agent chooses semantic
criterion/unit and target region. Tools validate and bind that declared scope;
they do not choose a semantic region, judge the image or approve a result.

**Contract:** capture requests identify the intended check identities and canonical
scope. The existing review owner returns an exact submission descriptor per check:
request/check identity, requirement/check revisions, delivered inspection IDs,
canonical dependencies and available verdict fields. Images and checks must not be
two unrelated lists requiring the model to invent a join. Primary-agent input fills
status/evidence after image delivery and references that binding; the owner verifies
freshness again before recording. Whole-view and regional checks remain separate.
Do not crop, narrow, combine or silently replace model-authored scope automatically.
Scope redesign uses explicit supersession of the current revision and reason.

Mixed invalid submissions remain atomic; return precise per-check errors and a
correction route without erasing prior accepted results. Independent existing
passes remain accumulated. A valid check can be submitted independently; missing
or rejected checks stay pending and never satisfy final completion. Repeated same
submission is idempotent. Relevant local changes invalidate only bound dependencies;
unrelated changes, viewport pan/zoom and image retirement alone cannot erase valid
judgments. Stale, foreign, cancelled or superseded binding inputs reject without
changing stored results; recovery reacquires only affected evidence.

Schema-fragment discovery must expose actual registered root paths per exact tool
identity and return per-tool resolution/error information for mixed lookups. Preserve
successful lookups and delivery tracking without silently serving full schemas or
inventing `/properties` on a `oneOf` root. No heuristic JSON-pointer rewrite. This
closes the second recorded input rejection at its compose owner before advancing.

**Boundaries and proof:** `local-design-review.ts`, current check/evidence stores,
`local-operation-tools.ts` lookup, their registered schemas/prompt and consumers.
Use recorded crown overview-plus-detail input to prove the current gap, then actual
capture -> primary-verdict submission -> local edit -> stale refusal -> targeted
recapture -> final completion. Verify atomic failure, no unrelated recheck, retained
pass revisions, cancellation, out-of-order responses and schema union paths.
Use design-review-stages, local-operation-tools, execution-flow-proof and real
browser inspection-evidence integration. No new model request and no unit-only
closure; consume the corrected delivery views from corrections 1/2.

### Correction 4 - Enforce explicitly declared reference usage

**Owner and routes:** reference selection/import provides immutable source identity;
inspect owns applicability and check dependencies. Primary AI supplies semantic
purpose and region. Import/decode success is not source suitability, and mechanical
pixel tools must never find the subject or choose an alignment implicitly.

**Contract:** a selected source use specifies exact criterion/unit scope, original
image region (explicit whole image is allowed), supported purpose and restrictions.
Bind it to the immutable image digest and current requirement/use revision. A broad
criterion is not permission to use an entrance photograph for every detail unit.
Only explicit, current uses can support an adopted fact, reference-dependent
preparation or comparison. Unrelated reference-free drawing need not wait. Unknown
scope is pending; resolve it before the affected first use, not only at final review.

Crop validity and pixel availability are deterministic checks. Subject identity,
construction stage, viewpoint and sufficiency remain primary-agent judgments tied
to the selected use. Report source pixel dimensions and effective region size;
do not invent an occupancy threshold or equate metadata validity with visual
quality. Explicit image comparison additionally requires the matching target
inspection and declared comparison region/alignment; do not infer them from text.
The plan does not promise deterministic detection of a false semantic assertion.

Changing a source use invalidates its exact dependent facts/checks, including any
actually shared whole-view judgment, not all criteria. Selection order, aliases,
unchanged decisions and viewport changes do not invalidate evidence. Rejecting a
source removes its eligibility; missing replacement leaves dependents unresolved,
without clearing independent passes. Invalid updates are atomic. Reuse unchanged
validated bytes/uses without repeated downloads or extra model checking.

**Boundaries and proof:** `local-reference-decisions.ts`, `local-design-review.ts`,
reference/image tools, check stores and exact input/discovery/prompt contracts.
Replay final source decisions 1/3/5 without regions and require explicit uses;
prove entrance-only applicability, legitimate whole-image use, unsupported broader
use, out-of-bounds/wrong-revision/foreign evidence, source rejection/replacement,
partial availability and cancellation. Integrate with correction 3's binding and
local-pass tests and the real image adapter. Pixel metrics cannot be the visual
quality oracle. Existing reference, image ownership and review suites must pass.

#### Correction 4 execution card - inspect explicit source uses

- Owner: `inspect`; source identities/decoded oriented dimensions remain image-owner inputs.
- Replace criterion-wide reference decisions with `uses` containing a stable use ID,
  exact criterion/optional declared unit, purpose (`visual`, `fact`, `preparation`,
  `pixel-comparison`), explicit whole-image or pixel region and limitations.
  The reference owner issues request-bound use revisions; consumers explicitly name
  those receipts. No compatibility acceptance of criterionIds/sourceRegion decisions.
- Visual bindings retain selected use receipts, source facts bind exact use receipts,
  prepared checks consume only declared preparation receipts, and pixel comparison
  requires a matching use and crop. Reference-free checks remain independent.
- Changes invalidate exact use dependencies; unchanged uses retain revisions even if
  another use of the same bytes changes. Rejection/removal and asynchronous changes
  retire affected evidence only. Selection order does not alter eligibility.
- Allowed files: current inspect boundary, direct schema/prompt consumers and formal
  reference/review/preparation/image/operation integration suites. Add the reference
  owner regression file to the same boundary. No image search/subject detection,
  second evidence store, live AI, 101, push or monitor.
- Tests: atomic missing/bad scope; exact whole/local permission; independently revised
  uses; foreign/stale receipts; native binding and retained passes; source facts;
  prepared admission/reuse; pixel pre/post async currency; existing owner integrations.
- Self-review before implementation: scope is authored by primary AI, not inferred
  from an image or criterion name. Mechanical acceptance proves bounds/identity only.
  Every consumer validates before work and before publication after awaits. Reuse
  stores exact receipts, not the entire selected-reference context. Missing evidence
  is recoverable without redownload or replaying document writes.

#### Correction 4 local closure

Implemented explicit request-bound reference uses with independent revisions and
original-pixel scope. Visual bindings, fact bindings, prepared review/apply admission
and native-pixel comparison consume the same owner receipts. Unsupported or stale
uses reject without replay or new image downloads. Selected aliases and explanation/
ordering changes preserve eligibility. Fact bindings now invalidate exact check
scopes rather than every unit of a criterion. There is no compatibility interpretation
of old criterionIds/sourceRegion decisions and no extra model.

Self-review caught and test-first corrected two additional direct handoffs: selected
aliases initially resolved the first unselected index, and explanation-only changes
initially advanced all use revisions. Both now retain immutable source/use identity.
Shared facts retain independent unit support. A reference revoked after pixel work
cannot publish a pass. Preparation for an unchanged crown use reuses its result
while an entrance use change rejects the old entry at apply admission. Reference-free
preparation no longer inherits the entire source-selection context.

Evidence under `tmp/correction-4/`: `integration-verified.log` 497 tests; subsequent
bounded final owner suite `final.log` 324 tests, plus `recorded-final.log` 10 reference
owner/integration cases including all three recorded source declarations. Public
provider integration passed with 177 tests and its one existing opt-in protocol skip
(`downstream.log`; that run still had a separate new fixture failure, later fixed).
`flow-final.log` 41 passing public-flow proofs. Actual browser handoff/recovery proof
passed in 19.7s (`browser.log`); owned services exited. Server/flow TypeScript, focused
lint (two pre-existing console warnings), naming and diff checks passed. Early red
and migrated-fixture failures remain failed evidence, not green runs.
Structural Inspector admission: 41 cases, digest
`91a2bef34ef00e4fd9c15c63c1aa980cf022b21876bc0bae72f9315ebc0ae88a`.
This is local/structural evidence, not a committed-source assessment. No 101, live
model, remote action or monitoring. Correction 5 remains unstarted at this boundary.

### Correction 5 - Stable, honest principal-task presentation

**Owner and routes:** Runtime/provider report all actual lifecycle events; the
existing Design activity reducer projects them; panel/history consume that projection.
No second status controller, model status request or hidden execution queue.

**Contract:** render the current authored principal purpose as the primary status.
Keep operation execution state separate from retained task context, using a stable
layout and an honest context indicator when no operation is executing. Do not
replace that purpose with alternating tool labels or claim drawing while preparing,
reading, exporting or waiting for a real persistence acknowledgement. Observed
activity derives from actual effect/phase, not `execute_design_batch` alone. Mixed
operations remain explicitly mixed; do not guess the current action from a label.

All start/end events still update canonical state and diagnostic timing. Deduplicate
presentation by purpose identity/revision and meaningful semantic state, not an
arbitrary delay/minimum hold or a misleading retained running label. Context never
claims execution. A rapid real state change may still be visible; the acceptance
criterion is semantic continuity and truthfulness, not a fabricated maximum switch
count. Failure, approval, stopping, saving and terminal outcomes surface immediately.
Children remain diagnostic. Concurrent independent roots show shared live purpose
or explicit multiple-work state; completing one cannot erase another or revive
retired work. Missing purpose uses a truthful operation description, not invented
specific work. Language behavior is unchanged.

**Boundaries and proof:** `activity-state.ts`, provider activity normalization and
registered effect metadata, conversation/panel projection and original tests.
Replay every recorded status event; distinguish DOM transitions from rendered
frames. Test quick same-purpose roots, actual purpose changes, read/export batches,
partial failure, save-only retry, concurrent roots with equal/different purposes,
parent closure, late child events, cancellation, disconnect/reload and new requests.
Use existing reducer, provider, conversation and 360/1280 browser fixtures. Inspect
real screenshots/video from deterministic tests for wrapping, terminal visibility
and context-vs-execution; no new live model run. Re-run the full corrected settlement
and review flow to prove UI changes do not alter execution or persistence.

### Correction 5 execution card - Principal purpose and observed execution

- Owner: `settle`, consuming normalized provider activity and actual registered
  browser-action effects; one existing activity reducer owns the projection.
- Spec: purpose lifetime and principal-task presentation in ai-execution-flow.
  Input: ordered call/request starts and ends, parent IDs, authored purpose and
  actual dispatched action effects. Output: stable primary purpose, separate
  truthful execution/context state, complete diagnostics and bounded history.
- The provider may report an observed effect only at actual batch dispatch,
  aggregating canonical registered action effects. Unknown effects remain unknown;
  mixed effects remain mixed. Wrapper capability metadata cannot prove a write.
  Child names/purposes remain diagnostic; their actual dispatch state may describe
  what the principal invocation is doing without replacing its purpose.
- The panel presents purpose first and secondary operation/context text separately.
  Context explicitly says no App operation is executing. Lifecycle controls override
  purpose immediately. History deduplicates authored identity/revision, not prose
  alone; all starts/ends still reach the reducer. No timer or deferred event filter.
- Contributors: current provider, Runtime activity transport validator, existing
  reducer and panel. Forbidden: extra model, second controller, name-to-effect
  exceptions, discarded diagnostic events, fabricated execution while idle.
- Boundary: existing settle allowlist; provider.ts and its progress tests,
  local-ai-provider.ts and tests, activity-state.ts, presentation tests, panel and
  panel tests, existing conversation E2E and permanent recorded activity fixture.
- Failure owner: settle. Preserve late-event rejection, independent roots, retry,
  cancellation, approval, saving and terminal outcome rules; no mutations to
  persistence, Factory, execution scheduling or review evidence owners.
- Gates: recorded event replay; provider-to-projection dispatch proof; existing
  presentation/conversation/panel/provider/transport tests; 360/1280 browser UI;
  types, lint, naming and structural Inspector admission. Then the five-correction
  deterministic producer-consumer flow with durable reload and history checks.
- Stop on a missing upstream effect contract, lost causal identity, unrelated owner
  regression or required integration failure. No 101, model, push or monitoring.
- Self-review: transport data is optional because research/provider work has no App
  batch; absence never implies mutation. No global state or new retained result
  cache. Presentation fields derive from the same reducer state and event order.

#### Correction 5 local owner verification

The normalized transport carries actual dispatch effect only at the browser batch
boundary. The existing projection aggregates that work under its principal purpose;
unknown wrappers no longer claim writes. The panel puts purpose first and explicitly
labels retained context. History uses authored identity/revision rather than prose.
Self-review followed the real runtime-input contract enrichment (the generic Runtime
wire description alone omits effects); the App supplies canonical flat contracts.
No mutation, scheduling, evidence or persistence code was changed in this slice.

Recorded replay covers all 1,063 complete provider activity inputs. The 13,979 old
browser projection diagnostics omit input status/message and cannot honestly be
reconstructed as complete inputs; 83 observed DOM transitions are not frame counts.
New deterministic cases cover the missing effect metadata. Evidence in correction-5:
159 browser-side integration tests, 182 provider tests with one existing opt-in
protocol skip, 389 Runtime tests; original regressions were red. 360/1280 streamed
browser tests passed (22.7s), with real context/inspection/wrapping screenshots viewed.
Initial E2E failures were obsolete label-before-purpose assertions, updated throughout
that same formal case; navigation, history, concurrency and completion oracles remain.
Final combined gates and closure remain below, not implied by this owner result.

### Combined verification card - Existing public handoff flow

- Route: compose -> prepare -> apply -> inspect -> settle, verification only.
- Extend the existing real-browser public review handoff case with canonical prepared
  creation and explicit decoded source-use receipts, compact delivery, durable export
  and reload. Existing local repair, stale/invalid binding, transport interruption,
  cancellation and unrelated pass retention assertions remain in the same case.
- Use the actual image/reference owner, preparation/compiler, registered host,
  browser runtime/Factory and document session. Script only the primary agent's
  choices/judgments; no extra model. Exercise Undo/Redo and peer delivery through the
  existing complete aggregate/history and persistence cases on the same source.
- Boundary: existing ai-inspection-evidence E2E file and Inspector direct test mapping;
  no production edits unless a direct correction regression is first reproduced.
- Gates: combined case, existing aggregate recovery variants and export/history
  cases, current contract proof, changed package suites, type/lint/naming. Preserve
  original failure evidence; no retries used as evidence of a root-cause fix.
- Self-review: validation does not certify image semantics. Source scope and final
  judgments are authored by the controlled primary-agent fixture. Passing byte and
  dependency checks never replaces visual judgment or durable acknowledgement.

### Combined review correction card - Preparation receipt identity

The real-browser chain reproduced two identical checks returning reused=false.
Canonical attachment capture issues a fresh receipt UUID on every read. Preparation
included that transport receipt in its assessment cache/source identity, although
geometry, basis, parent, source uses and request criteria were unchanged. This is a
direct correction-4 reuse handoff, now reopened before further closure.

- Owner: prepare and its existing operation-tool attachment adapter, with their formal tests.
- The browser receipt also carries variable actionObservation diagnostics. Construct
  the exact PreparedAttachment domain value at its consumer boundary; transport
  timing/outcomes are not attachment content and must not enter semantic identity.
- Semantic reuse includes actual attachment content, document session, recipe,
  criteria and explicit reference uses; opaque receipt identity/global observation
  revision are currency evidence, not geometry. Validate the newly captured receipt
  before publication and retain it for apply admission. Invalid currency never
  becomes a pass. New session, changed parent/basis/bounds/source invalidates reuse.
- Preserve known same-source conflicts across equivalent receipt renewal. No new
  cache/store and no semantic validation bypass; exact dependencies still validate.
- Test first with fresh receipt UUIDs at each attachment read, then changed geometry,
  new document session and unavailable currency. Existing preparation suite plus
  the same real-browser combined case are the closure gates.
- Stop on changed compiler/admission semantics or an unrelated owner requirement.
  After this closes, migrate the existing regional-evidence fixture that still
  sends the superseded unbound review shape; preserve its twelve drift/fault cases.

The combined browser proof then correctly rejected completion because its added
prepared root had no visual judgment. This is a fixture omission, not a product
relaxation: declare and inspect that third target through the same public binding
before final completion. Keep all independent Left/Right and failure oracles.
The fresh-receipt and diagnostic-metadata regressions now pass (189 focused tests),
and the browser reached final coverage after confirming reused=true. The next run
must include the missing prepared-root visual obligation, not bypass coverage.
The prepared fixture also omitted paint, so it had no visible content for snapshot
extraction. Supply an explicit source fill for the visual fixture; no render or
inspection fallback is introduced.

### Combined correction closure and next card - Regional consumer binding

Preparation receipt identity is closed locally: 189 owner/adapter tests, server
TypeScript and the real public handoff browser case pass (19.7s). The latter proves
current reference-use receipts through preparation, reuse, mechanical apply, bound
visual checks, independent local repair, cancellation/transport recovery, compact
export, durable completion and reload. No product coverage check was weakened.

Next owner: inspect, only the existing regional inspection-evidence integration
fixture and its existing test mapping. Full App test:ai exposed twelve cases using
superseded unbound judgments. Migrate capture selections and consume next.arguments
through the real binding owner; bind multi-image alignment explicitly. Preserve
all twelve validation drift/fault oracles, atomic store comparisons, exact capture
and validation work counts. Fault injection stays at judgment validation, after
binding has completed. No production change or compatibility adapter is authorized
for this fixture migration. Review the current inspect capture/judgment contract
before editing; close this file before broader final gates.

The regional consumer migration passes all 26 cases in its existing file, including
all twelve drift/fault variants. Capture issues the descriptor; same-image judgments
consume it; cross-region alignment explicitly binds its images. Final validation
faults still execute at the original boundary and preserve exact prior stores and
work-count assertions. No production code changed for this migration.

### Final verifier packaging correction

The supported isolated Inspector candidate failed before collecting any case: the
proof imported the shared review-inputs test actor, outside the verifier's exact
five-file source closure. Ordinary package tests passed but cannot substitute for
this evidence. Keep the existing capture contract unchanged. Make the proof's
controlled primary-agent binding actor self-contained inside its declared testFile;
other ordinary suites retain their shared fixture. Boundary: execution-flow-proof
only, plan evidence. No production or Inspector-engine changes. Re-run the isolated
candidate, review/accept its exact local contract, then baseline, all declared exact
negative violations and baseline recovery on one frozen source. Missing cases or
infrastructure errors block closure. The actor calls the actual binding owner and
never fabricates receipts or alters invalid-input outcomes.

The isolated negative run then exposed a stale mutation selector: the old retained
field projection was removed by correction 2. Update only that declared scenario
to bypass current projectToolDelivery at the actual external boundary. The same
structural/removal obligations remain; add the new registered-model-delivery case
because it deliberately proves this shared boundary. No test assertion or product
condition is changed. Require the exact three declared failures with all other
cases passing, then re-admit and run every negative plus baseline recovery.

### Fixed review and completion gate for every correction

Before edits, read the exact current Inspector owner/route, amend its thin contract
and product cases within this problem, and complete supported admission. Establish
the goal for this correction only after the reviewed plan/admission is ready; do
not recreate the superseded whole-project goal. Add the
recorded regression before its production fix; show a real failure when asserting
a reproduced bug. Do not label a preventive case as an observed regression.

Before advancing, self-review the entire problem's diff and direct upstream/downstream
contracts, not only new tests. Cover actual supported usage, empty/invalid inputs,
versions and ownership, forbidden/impossible states at ingress, partial/unknown
settlement, cancellation, duplicate/reordered messages, concurrent consumers,
release/disposal, failure -> retry/reload, resource bounds, security, work counts,
and consistency of registry, schemas, spec, prompt, Inspector and visible behavior.
No compatibility aliases, guessed fallback, repeated source scans or duplicated
canonical control. Explicitly justify bypasses and unchanged owners.

Run affected existing suites plus real producer-consumer integration, lint, production
types and naming for changed identifiers. Where writes or completion are involved,
exercise ordinary edit -> Undo -> Redo, active-session completion, peer edits,
compensation/resend and durable reload through current owners. Do not redesign
Factory or persistence because a delivery test fails. Any current-diff regression
or unresolved required handoff blocks advancement; fix it and repeat affected gates.
A later finding reopens its owning correction before new work continues.

After all five, run one deterministic whole-flow integration using the saved inputs:
explicit reference use -> mechanical preparation with zero extra model calls ->
apply -> compact delivery -> evidence binding -> primary-agent verdict -> local
repair with unrelated passes retained -> durable completion -> export -> reload.
Include controlled failure/recovery at each changed boundary and concurrent activity.
Provider replies are controlled fixtures, not nondeterministic model tests. Run the
changed packages' existing applicable full test suites and affected browser/history/
collaboration suites once on the combined source; preserve declared opt-in semantics
and report skips accurately. Compare measured bytes, canonical work, invalidation
sets and status semantics; neither object count nor model wall time proves improvement.

### Planning self-review and authorization outcome

This review corrected the following potential gaps before implementation: bulk export needs
an actual user consumer and lifetime beyond request cleanup; compaction must follow
internal dependency consumption; partial receipts cannot lose settlement evidence;
check binding cannot invent the AI's semantic scope; reference restrictions need
per-use dependencies rather than criterion-wide approval; status stability cannot
retain a completed execution label. A second producer-consumer pass also required bounded internal receipt resolution
before declaring complete mutation scope, snapshot-generation binding for exports
and honest unavailable durability even after normal completion-tool return. Kept
atomic input rejection, precise source uncertainty, memory backpressure and existing
history/persistence owners.

Remaining evidence is deliberately implementation work: formal red/green regressions,
real transport fault attribution, download integrity/lifetime, source-scope integration,
combined browser behavior and Inspector same-source acceptance. No test/admission
was run by this documentation-only task. The plan is reviewed for the bounded five
problems, not a claim that implementation is complete or future defects impossible.
The subsequent user instruction authorizes sequential implementation, subject to
the current admission and stop boundary above.

### Correction 1 execution card - delivery settlement

Owner: apply-to-compose and apply-to-settle delivery, observe for failure metadata.
Spec: AI execution flow / Document export and persistence delivery. Inspector:
apply complete execution receipt and settle independent durability. Input is one
actual browser batch receipt after execution; output is its admitted bounded
receipt or explicit delivery failure with known settlement. No bypass enlarges
transport limits. Browser execution/provider and secured exchange are allowed;
model inference, Factory replay, diagnostic-driven writes and automatic retries
are forbidden. Failure belongs to delivery, never retroactively to mutation.
Files: existing action-batch protocol/endpoint/provider, batch-exchange and action-
batch server with direct tests. Regression: a completed oversized receipt must
reach the host as a recoverable delivery failure, without ending the drawing
stream or replaying the batch. Existing transport limits and origin/token checks
stay intact. Gate: actual middleware plus browser provider, cancellation/invalid/
lost acknowledgement tests, types/lint/naming, then review before export slice.

### Correction 1 execution card - explicit export owner

The transport slice reproduced the failed HTTP exchange before implementation;
36 original/focused browser-provider and actual middleware tests now pass, with
server types and focused lint. Evidence: `tmp/correction-1/transport-{red,review}.log`.
This is not closure of correction 1 or a historical HTTP-status claim.

Owner: apply, explicit export and its browser consumer; compose exposes its exact
current contract. Existing Framework serializers and publication owners stay intact.
The browser-owned immutable export is deliberately an output artifact, not a query
cache or editable document. Use one existing runtime-owned resource with explicit
export/download/release operations and byte backpressure; user download requests
are not proof the browser wrote a disk file. It survives request cleanup until
explicit release/runtime disposal. No foreign request needs raw document bytes.
Snapshot checks observe canonical publication/file-load changes and active document
identity before/after async serialization/digest; reject races without publication.
No parallel export mutation or new document queue. Cancellation leaves previously
published exports intact; failed/new allocations free only their own output.
Named files: new `src/ai/document-export.ts` and its formal tests, existing constants,
basic catalogue, runtime-input/startup, prompt and direct browser consumers/tests.
Inputs: explicit export, exact local artifact download/release; outputs: immutable
metadata and honest availability. Budget exhaustion preserves already issued exports.
Proof: old raw capabilities absent, no aliases, actual downloadable bytes/digest,
request abort after completion, replacement, overlapping exports, resource cleanup,
unsupported/expired references, real Core save/load and unchanged history.
Before advancing: full owner integration, upstream receipt contract and registry
validation, permission/disposal review, naming/types/lint and preserved persistence.

### Correction 1 execution card - completion presentation

The export slice passes real browser runtime invocation, actual browser download,
SHA-256 comparison, unchanged history, durable checkpoint equality and fresh-page
reload (`tmp/correction-1/export-browser.log`). Formal export lifecycle tests also
cover cancellation, replacement, capacity, unavailable handles and independent
cleanup/retry. One development-server reload interrupted a preliminary browser
run; subsequent frozen-source verification passed. Large retained-file export
proof remains required before correction closure.

Owner: settle, from the existing document confirmation to the typed action result,
conversation outcome and visible summary. The completion action may acknowledge
finished drawing work while storage is unavailable; it must return an explicit
partial settlement and the UI must show an authoritative unconfirmed-save message,
not only the model-authored completion text. Local-only is explicit and makes no
remote-storage claim. Unsupported outcomes do not request persistence. The
Framework serializer, document publication queue, history and mechanical/visual
acceptance are unchanged. A failed confirmation never replays the drawing; the
existing persistence/recovery owner remains responsible for recovery.
Files: `actions.ts`, `runtime-input.ts`, `presentation.ts`, prompt and their formal
consumer suites; existing lifecycle/provider/persistence suites prove captured
watermarks, cancellation, failure and publication order. Tests consume the actual
completion action result through conversation/presentation, including a misleading
model-authored saved message, local-only mode, success and abort. Recheck the
current settle Inspector route before edits. No status-machine correction 5 work.

### Correction 1 closure - reviewed local evidence

Structural admission contains 40 cases, digest
`915f30c408500c777b024acc3cc1fb79498d744510cc52b5f17327ec215d673c`.
All 40 execution-flow cases pass; removing the delivery-size guard fails the exact
new transport-to-validity case. This is a structural admission and executable
case proof, not a committed-source assessment or remote delivery approval.

The complete existing browser AI suite passes 606 tests. The server integration
selection initially passed 349/350: the formal public-method inventory detected
the three removed raw serializers had no disposition. Their current Framework
ownership is now explicit, with no alias or widened runtime allowlist; all 18
basic-contract cases then pass. Persistence/lifecycle/outbox regression suites
pass 84 cases; browser/server type checks, focused lint and naming pass.
The failed earlier run remains failed; the focused correction is recorded in
`tmp/correction-1/classification-green.log` and `recovery-final.log`.

Real browser runtime export/download, collaboration, nine structural/history
transitions and durable fresh-page reload pass (2 cases, 59.1 seconds). The saved
177,684,228-byte document separately exports, downloads with equal SHA-256, and
reloads with equal canonical content (40.6 seconds). No live model or new drawing
was used. The initial large-fixture DevTools transfer failed before product proof;
the formal fixture now streams through a tracked local HTTP server instead of
sending a huge browser-control message. No product capacity or timeout was raised.

Final review checked permissions, exact tool exposure, actual download consumption,
request/runtime lifetimes, replacement/cancellation, independent disposal failure,
capacity backpressure, partial outcome presentation and missing mutation coverage.
Runtime saved dependencies already fingerprint complete contracts; removed methods
and changed schemas cannot reload as silently compatible recipes. The existing
document queue owns retry and captured durability; no second queue or history
controller was introduced. Evidence is under `tmp/correction-1/`; local-only
recordings, export payloads and unrelated changes remain excluded from delivery.

### Correction 2 execution card - declared model delivery

Owner: compose contract, then apply-to-compose result delivery (separate slices).
Input is a registered complete result and its actual settlement. Output is a
validated owner-authored model view, not a guessed serialization transformation.
The common contract may declare `delivery: { path, outputSchema, receipt? }`: a JSON Pointer
to a bounded view produced by the owner. Runtime preserves and fingerprints this
metadata; it does not execute or infer product projection. Internal validation,
mutation invalidation and recipe bindings consume the complete typed result first.
Optional receipt metadata names its exact retained-evidence path and publisher
adapter without altering the value schema or recipe assignability. The native
host projects only at the external model boundary after ownership
transfer. Direct, batch and library invocation share that boundary. Missing or
invalid declared delivery becomes a delivery failure without replay or changed
execution settlement. Undeclared results keep their existing current contract.

First implement/prove the immutable portable declaration in Runtime tool-contract
and its formal tests. Then admit the App owner slice: fill/structural result
publication through existing retained-context, bounded receipt readback, canonical
internal dispatch and external projection. No model callback, second registry,
new mutable document store, inferred field list or larger byte limit. A composed
consumer keeps the complete successful result. Model `full` never overrides a
registered bounded view; immutable evidence is read separately in bounded pages.

Required proof: recorded 3584/1600-member results, exact internal changed IDs,
small external views, recoverable full receipts and one write; retained ownership,
stale/current distinction, partial/unknown/cancel/publication failure; existing
structural and recipe handoffs; correction 1 receipt budget regression. No next
problem before these gates and bounded full consumer review pass. Review confirms
that summary lifetime follows the already-owned receipt and cannot authorize stale
edits. A failure to publish the view cannot erase completed mutation evidence.

### Correction 2 execution card - retained mapping and bounded readback

Compose declaration passed 66 existing/new Runtime contract, persistence and recipe
flow cases after six red regressions. No execution behavior changed in that slice.
Next owner: apply-to-compose. Fill/structural owners produce full receipts plus a
registered compact `modelResult`, retain original evidence once, and publish through
the existing query ownership bridge. Existing inspection consumes full mutation
scope. External delivery selects the declared view; composition retains canonical
output. Delivery failures keep real settlement and remove unusable handles.

Readback uses the existing snapshot receipt route, with explicit bounded JSON-text
pages when the full immutable receipt exceeds the page budget. Page offsets refer
to the stored serialization, never live document rows; concatenation reconstructs
the exact receipt without repeating mutations or serializing every prior page.
Small complete receipts remain complete; large replies advertise encoding, offset,
next offset and total. Inputs cannot force a larger response. Byte accounting
includes retained serialized evidence; request/lease checks precede all reads.

Files: retained-fill-action, basic-api-actions/results, retained-design-context,
context-action, local-query-artifacts, local-operation-tools, local-tool-invocation,
local-tool-host and library controls, with their existing formal integration tests.
Failure owner: the existing delivery/retention owner. No changes to canonical fill,
Factory, collaboration or review validity semantics. Tests: actual action-to-host
3584/1600 mappings, recipe successor full input, structural parity, exact paged
readback, byte/call counts, partial/failed publication, cancellation and stale
references; re-run transport budget plus selected host ownership suites. Stop this
slice before correction 3 or any live inference/remote operation.

### Correction 2 review iteration - resource and delivery boundaries

Actual browser query -> fill -> batch -> later receipt read reproduced a missing
retained resource: batch output annotations enumerated structural names rather than
current registered receipt ownership. Derive success and partial resource paths from
the same declaration used by publication. A separate library invocation proved that
missing model delivery incorrectly kept outer success; preserve successful execution
and mark only delivery partial, with no repeated mutation. Partial batch envelopes
must project their acknowledged inner results too. No source-scope or history changes.

The receipt readback test now counts actual `toJSON` invocations (one), not page
iterations mislabeled as serialization work. Original bytes are immutable and pages
remain recoverable after unrelated canonical changes without restoring edit authority.

Correction 2 downstream review exposed the workflow decorator's fourth-argument
inspection target set being bypassed by the new internal entry. Preserve that
existing scope explicitly on the canonical internal call; do not change the formal
apply/apply/check/check ordering oracle. Raw discovery corruption probes now intercept
the actual internal entry. Obsolete synthetic structural fixtures must declare the
current delivery contract rather than expect name-based compaction. The full
existing operation and workflow suites remain closure gates.

### Correction 2 local closure

Canonical mapping/structural results now feed internal validation, exact inspection,
recipe successors and resource export before registered model projection. Full mode
cannot bypass that view. The existing context owner serializes immutable evidence
once and serves bounded JSON-text pages. Native batches derive exported receipt paths
from registered ownership; partial output and publication failure cannot leave usable
false handles. The library reports delivery failure separately from completed execution.
No mutation is replayed. Shared canonical effects also cover the three export actions;
this closes a correction 1 compact-descriptor consumer omission found by the existing
all-tool-family admission suite. Its execution and browser download behavior is unchanged.

Self-review covered direct/native/batch/library/recipe calls, scope preservation,
partial/unknown/cancelled outcome, capacity/publication failure, caller and sibling
ownership, stale readback versus edit authority, schema revisions, metadata freezing,
resource fingerprints, serialization counts and bounded bytes. Existing workflow
inspection-target aggregation is preserved through the internal invocation decorator.
Synthetic tests now declare actual delivery instead of relying on removed name guesses;
negative corruption probes still intercept the actual canonical owner call.

Evidence (`tmp/correction-2/`): Runtime contract/store/recipe 69 passed;
App AI suite 606 passed; delivery owner/host/library 193 passed;
invocation/composition/query handoffs 123 passed; focused retention/structural/fill and
host suites 89 passed before the final bounded failure cases; those added capacity and
cancellation cases passed in failure-integration alongside export tests (that run's two
old invocation spy failures were repaired and passed in the 123-case handoff run).
Current formal flow 41 passed, including complete recorded-size mapping -> internal
unverified scope -> compact view -> exact paged readback, plus the unchanged transport
budget proof. Actual browser canonical mutation, registered/canonical structural
references, Undo/Redo and fresh durable reload: 4 passed (1.0m). Owned ports cleaned.
Production browser/server and flow-proof TypeScript passed; naming and diff checks
passed; ESLint has zero errors and two pre-existing console warnings. Initial failed
runs remain failed evidence, not reclassified. No live inference, 101 or remote action.
Structural admission digest aa676a3672b0ef5b9fc0419d60754758baad51848f0205713cc11ca5e915b4d8
covers 41 App cases; this is not a committed-source target assessment.

### Correction 3 admission and execution cards

Scope remains exact review/evidence handoff and exact schema discovery. First owner
segment: compose. Per-tool schema fragment resolution returns either the requested
fragments or an explicit unresolved entry containing exact identity/revision, failing
paths and actual registered root/field paths. A failed entry does not mark that scope
delivered; successful siblings retain normal reuse/recovery behavior. Invalid request
shape still rejects before lookup. No pointer rewriting or full-schema fallback.
Files: local-operation-tools, its existing tests, discovery clauses and the exact
compose Inspector contract. Replay the saved mixed read_design_context / batch
lookup of /properties. Preserve category/operation/native selectors and actual
invocation output checks. Run existing discovery and flow tests, types/lint/naming.

Second owner segment: inspect, only after compose review. Existing capture/review
owners must bind explicitly requested criterion/unit identities to delivered images
and exact current revisions/dependencies. Return a fillable submission descriptor;
primary-agent semantic decisions remain separate. Validate bindings before recording,
retain atomic mixed rejection and independent passes, and do not infer which crop
represents a semantic unit. Plan the exact public input migration against current
callers before edits; no duplicate evidence store or permissive old-schema fallback.
Recorded crown overview/detail rejection is the formal scope oracle. Its failed
mixed submission must not erase previously accepted independent judgments. Browser
receipt validation remains the currency owner, including after async capture.

Both segments require upstream/downstream integration and failure recovery before
correction 4. No models, live 101, push or monitoring. Actual captured evidence:
review rejection 2.577ms; mixed schema rejection 0.951ms. These are tool durations,
not time saved or model inference measurements.

### Correction 3 inspect contract refinement before implementation

The compose segment passed all 176 existing operation-owner tests and server types/lint.
Its failed fragments never advance delivered coverage; valid siblings remain available.

Inspect execution card: explicit intent is supplied on each review capture as `checks`
(criterion/unit and optional supersession). Existing-image reuse uses `bindChecks` on
review_drawing. Both paths produce exact per-check submission descriptors after browser
currency validation. No automatic matching by names, bounding boxes or ordering.
A capture without a known plan uses the standalone inspect tool; it cannot approve work.
Review capture requires declared criteria and exact identities before starting capture.

Submission descriptors include a request-local authenticated binding of phase, check
identity, intended image IDs, requirement/result revisions and exact evidence stamps.
The existing review owner owns issuance/validation; no second image or result store.
The primary agent fills verdict/evidence only. The tool rejects modified, foreign,
stale and out-of-order bindings atomically before writes, and repeats validation after
async evidence checks. Exact same verdict replay remains idempotent if its evidence
is still current. Existing domain result storage and local dependency invalidation
remain authoritative. The internal domain recording operation is not an externally
invocable route: all tool submissions use the binding gate.

On partial capture, preserve successful images and failed explicit targets, but do not
issue a binding for an incomplete declared check. Recovery explicitly binds the complete
required image set after retry; never silently shrink it. Binding does no image/model
analysis. Native and composed invocations consume the same versioned public schema.
Current public capture/verdict callers and formal fixtures migrate together; there is
no old unbound submission fallback.

Allowlist: local-design-review.ts, local-operation-tools.ts, their existing owner and
flow-proof tests/fixtures, current prompt/spec/Inspector inspect contract. Tests cover
recorded crown scope, explicit local capture to binding to verdict, exact replay,
foreign/tampered/stale revision, mixed atomic rejection, partial capture, cancellation,
local edit and unaffected retained passes. Existing broad owner/flow suites and real
browser evidence integration are required before advancing to correction 4. No new
schema/result store, model, live101, remote or monitoring action. Stop for a failed
owner boundary or evidence contract, not by weakening freshness or scope checks.

### Correction 3 integration review checkpoint

Reviewed the new protocol against the existing domain recorder, native admission,
common invoke and browser evidence owner. The domain recorder remains internal; no
model submission bypasses the binding gate. Authenticating a descriptor uses an
ephemeral request secret and existing evidence/results; no duplicate binding store
or persisted compatibility format was added. Public tool revision is 7. Captured
bindings are marked request-local and cannot become saved recipe literals.

Existing domain/schema fixtures were migrated separately from scripted primary-agent
integration fixtures. The latter perform the real public bindChecks call; they do not
inject approvals or fabricate bindings. Previously failed logs remain failed. Three
fixture migration runs exposed old unbound inputs, removed two-list expectations and
new explicit evidence-validation call counts. Reviewed each against the contract,
preserved its semantic assertions, and did not relax production admission.

The latest saved run's crown input (1792226401062, calls 17/18/21) is now a permanent
fixture with original identities/crops/statuses and English evidence placeholders;
its prose is not the scope oracle. Invalid mixed binding leaves existing passes
untouched; corrected local binding and targeted recapture preserve the viewpoint.
Real browser public-host/evidence integration passed once (19.5s), including transport
failure, cancellation after validation, viewport changes, canonical local mutation,
recovery and independent pass retention. Playwright ports 3300/3401/4401 exited.
This checkpoint is not correction-3 closure: final adversarial race/schema gates and
bounded review remain before advancing. No fourth-correction work has started.

### Correction 3 local closure - 2026-10-17

Closed exact schema lookup and review evidence handoff on the existing compose/inspect
owners. Public review revision 7 has mutually exclusive capture, explicit bindChecks,
and bound-verdict modes in canonical and native schemas. Captures declare exact
criterion/unit intent; reuse requires explicit binding. No unbound public verdict is
accepted. Authenticated request-local descriptors carry exact source/check revisions;
canonical currency is checked before issuance and again before recording. Captures
with partial/reused images require explicit completion of the intended image set.
Bindings cannot become persisted recipe literals; no second result/evidence store,
AI reviewer, changed limits, automatic crop choice or compatibility route exists.

Bounded review covered producer outputs, native/common invoke, preparation workflow,
request resources, primary-agent fixtures, simultaneous verdicts, independent results,
partial capture, cancellation, stale/foreign evidence and final settlement. Domain
recording remains internal to the review owner; the public route uses bound validation
and bound recording on both sides of async evidence checks. Same verdict replay is
idempotent; a changed result rejects an older binding without overwriting the new one.

Evidence in tmp/correction-3/: final-owners.log 315 passes (177 operation, 113 review,
25 schema), composition-integration.log 66 passes, final-flow.log 41 passes including
actual public binding and foreign-request rejection; final-consumers.log 263 passes
with one existing protocol-executable opt-in skip. Provider execution is mocked;
no live model was called. Earlier owner-integration.log also covers invocation and
prompt contracts. browser-final.log passes the real public host/browser/canonical
edit/recovery integration (18.7s); its three Playwright ports exited. Server/flow types,
focused lint (one existing console warning), naming and diff whitespace pass.
Structural Inspector load digest 52d6e7e7877ab10a841c38c6c3c6a7f2e4d2863bca979b86a4d262d01eadcb08
with 41 cases. This is local admission/evidence, not a committed-source assessment.
All failed migration logs remain failed and are not relabeled. No push, live101 or
monitoring occurred. Correction 4 may now enter its own admission and goal.

## Renewed combined review and conditional live acceptance - 2026-10-17

Review the same five current corrections and their direct callers, consumers,
existing suites and exact Inspector routes. The fixed review categories above
remain the completion standard. This segment changes no production contract.
The accepted mapping revision 96 and local same-source proof remain the starting
point, not a substitute for source review. Inspect complete/internal versus
projected/external results, exact binding freshness, reference use revisions,
preparation semantic reuse, concurrent principal activity, export lifetime and
durable completion/reload. Preserve acknowledged execution on failure; do not
replay writes or broaden local invalidation.

Validation: exercise the existing real-browser inspection integration file,
including existing collaboration/history coverage and the combined public flow.
Retain the prior full-package and nine-negative Inspector proof where source has
not changed. Any concrete defect reopens its existing owner card, requires a
formal failing regression and affected gates before proceeding. Do not advance
based only on a new test or a successful live drawing.

Only after this review is clear, run the existing local recording harness once
with the original full prompt and unchanged App model. Verify the independent
worker deadline and process ownership before submission; terminate at 900 seconds
without confirmation. Preserve first/changed/final fit, successful final ten-second
hold, original execution records, references, video and save/reload comparison.
Separate measured provider-boundary elapsed time from tool execution and never
claim provider gaps are all model reasoning. No object-count improvement claim.
No remote operation or monitoring. Report any acceptance failure accurately.

Renewed review result: no additional production defect found in the bounded five
corrections or their direct handoffs. The entire existing inspection browser file
completed with 12 passes and 2 original conditional skips (2.3 minutes), including
the combined public flow and five aggregate recovery variants. Independent deadline
and real remote recording tests: 4 passed. Evidence: tmp/correction-5/renewed-browser-review.log
and renewed-deadline.log. Prior complete-package/source proof remains applicable;
only this plan changed. The conditional single live acceptance may now begin.

### Conditional recorded acceptance outcome

Run `tmp/ai-recording/runs/reusable-tools-1792243244012` completed successfully:
first visible content 75.972 s, authoritative UI completion 414.636 s; the independent
900-second deadline disarmed at completion. All 13 streams complete, no extra
review provider, no browser runtime errors. Durable sequence 577 acknowledged;
a fresh browser reload matched the canonical saved document hash exactly. The
recording and two actually selected reference images were retained and inspected.
Detailed timings, inputs/outputs, reference use receipts and limitations are in
that run's `analysis.md` and `references.md`.

The later spire correction preserved base/tier visual passes without resubmission;
coverage reached 6/6, final retained checks had no unresolved item. Preparation
receipt reuse and full concurrency/failure interleavings remain deterministic-test
claims, not newly exercised live claims. The run recovered an artifact-budget
rejection and conflicting target arguments. The former still reports outer unknown
settlement despite the preparation reason saying no writes; preserve this diagnostic
limitation for a bounded follow-up, not a hidden compatibility change. Definition
payloads still dominate measured tool text, and short principal operation/context
transitions remain observable. The primary model selected the aerial source for
whole-frame silhouette despite construction equipment; receipt validity does not
certify image suitability. Do not label these limits as solved by a shorter run.

No production edits occurred during or after acceptance. Temporary owned services
were stopped, configuration preserved, and no push or monitoring occurred. The
renewed conditional acceptance is finished; another live test requires direction.

## Five-correction local completion - 2026-10-17

All five current corrections are complete locally, in the authorized sequence.
No additional model, live 101, remote operation or monitor was started. Runtime
and App model configuration remain unchanged. Do not infer live model latency or
new drawing quality from deterministic integration results.

- Save/export: framework serialization is not a model save command. Existing
  document durability settles independently; immutable browser-owned exports
  deliver a download handle, preserve acknowledged writes on delivery failure,
  and survive request cleanup until explicit release/runtime disposal.
- Delivery: complete canonical results feed internal scope, lifecycle and recipes;
  only declared external views reach the model. Retained readback uses existing
  resource budgets and bounded pages; no larger HTTP limit or write replay.
- Check bindings: explicit capture/check intent produces exact current descriptors;
  primary judgments consume these bindings. Unrelated passes remain accumulated;
  drift, malformed acknowledgements, cancellation and transport failure cannot
  publish approval. Exact schema lookup preserves successful siblings on failure.
- Reference uses: the primary agent declares criterion/unit, purpose and original
  source region. Current use receipts reach preparation, visual/fact judgments and
  pixel checks. Tools validate those declarations and bytes, not subject suitability.
  Preparation now excludes renewed receipt/profiling metadata from semantic reuse
  while validating each current receipt before apply.
- Status: current principal purpose remains primary; actual canonical dispatch
  effects describe execution underneath it. Retained context is explicitly distinct
  from running operations. Ordered event/history evidence is retained without
  promoting descendant wording or treating wrapper execution as a canvas write.

Combined review covered the changed source, registry and public definitions,
internal/external receipts, artifact ownership/release, sparse judgment accumulation,
local invalidation, cancellation/late replies, recovery and actual terminal storage.
The existing browser path exercised public reference -> prepare/reuse -> apply ->
bound visual judgment -> independent local repair -> export -> durable completion
-> reload. Five aggregate history/recovery variants additionally exercised peer
collaboration, Undo/Redo, basis changes, no-progress, cancellation and interruption.
A separate immutable export/history case also passed. No Factory, collaboration or
persistence production changes were required by these five corrections.

Final evidence (under tmp/correction-5; original failures are retained):

- Runtime complete suite: 389 passed across 30 files (runtime.log).
- Design AI: 609 passed across 50 files (all-ai-final.log).
- Design server: 1,289 passed; two opt-in skips in the default run
  (all-server-final.log). The saved large checkpoint case was then explicitly
  enabled and passed: 183,494,794 encoded bytes, exact checkpoint equality
  (recorded-bootstrap-final.log). Only the unconfigured installed-native protocol
  registration probe remains skipped; it is not evidence of model inference.
- Design local: 159 Node tests and 624 Vitest cases passed (all-local-final.log).
  Framework runtime boundary: 13 passed (runtime-boundary-final.log).
- Browser: combined public handoff 1 passed (combined-browser-10.log), aggregate
  recovery/export/history 6 passed (history-recovery-browser.log), and two streamed
  status layouts passed earlier on unchanged presentation code (browser-final.log).
  Actual status screenshots were inspected; temporary browser servers have exited.
- Production server/browser types and flow-proof types passed. Lint: zero errors,
  five existing console warnings; verifier packaging rechecked separately after
  its test-only edit. Naming and diff whitespace checks passed.
- Supported isolated Inspector: candidate 2f4d6a1d-6539-45e8-9a6f-5def87c68921,
  accepted contract review af4eb4e6762e2f451ea397bf9f36d7272be7505fd08387c0f81573eff05847c9,
  mapping revision 96. Same-source baseline, all nine exact negative scenarios and
  baseline recovery passed for 41 obligations (inspector-proof-complete.log).
  Frozen source ab14e7963904b46371977337a4db7399dfa2059346a5bee43ea5f1203d8d7edd.
  This is local source proof, not a committed-head delivery/CI assessment.

Initial failures identified obsolete unbound consumer fixtures, attachment receipt
identity pollution, an incomplete/paint-free browser fixture, an uncaptured verifier
helper and an obsolete negative mutation site. Each was resolved at its actual
owner/fixture boundary without weakening coverage, currency, failure or work-count
oracles. The old preparation document's blanket invalidation/mandatory checkpoint
wording was synchronized to the current exact-dependency contract. There are no
known unresolved required handoffs within these five corrections. Keep all changes
local until a new explicit instruction; do not resume prior automation.

## Historical execution evidence

The records below retain their original dates, authorizations and outcomes. They
must not override the current authority and stop boundary above.

Historical Stage 2 delivery: exact lease protected remote e0d52ddef; its
integrated main was 4e925488842807672ab36c86fb69a269bd2249f5. Actual-head candidate
508f59b7-517a-429c-afa8-0b5506aa269d passed; assessment
98d71915-7567-4de2-9f65-1abfc9c9aaea is current and eligible for that source.
Actual-head changeset check passed. CI was not monitored. These are Stage 2
results, not Stage 3 admission or model-choice evidence.

### Stage 2 delivery authorization and integration - 2026-10-16

The user authorizes pushing the completed Stage 2 and retained Stage 1/Inspector
corrections now. This supersedes only their earlier local-only delivery restriction.
After this push, review and amend Stage 3 planning locally; no Stage 3 implementation,
live 101, model calls, further push or monitoring is authorized.

Integrate main 3f91e39fed0a97b87b6f254f1b2febc221d44afb before delivery.
Preserve its collaboration observations and authoritative history case identities;
retain this branch's three no-op replay cases and exact fault sets. Resolve only
these integration overlaps, regenerate the existing catalog, and run affected
Inspector/Factory/browser contract gates. Runtime source hashes from the prior
review are unchanged; retain their evidence rather than repeating unrelated gates.
Use the inspected remote source e0d52ddefedb941ed18d5b324130b2e4b51455bc as the
exact force-with-lease guard after the required rebase. Remote divergence is the
previously published equivalent pre-rebase series, not additional remote work.

### Stage 2 delivery inventory correction - 2026-10-16

The newly integrated collaboration inventory test failed against the branch's
existing cases: one recovery title changed and five recovery/compensation cases
were not yet mapped. Compare the actual configured Playwright list (22 cases)
with the current collaboration Inspector before editing. Its recovery owner
already owns retained drafts, outbox reconciliation and generation barriers;
remote apply owns peer compensation. Preserve existing case identities, map
these cases once with actual minimum participant counts (one or two), and
regenerate the catalog. No runtime, test behavior or Stage 3 implementation
changes. The exact inventory/admission tests must pass with all existing cases;
this cannot be closed by removing cases or relaxing equality.

### Stage 2 delivery observation timing correction - 2026-10-16

The complete original command passed 19 cases with three declared skips, but the
strict localization consumer rejected the recovery case: App readiness can precede
replacement collaboration-session identity after Retry. The new main observation
helper attached null as if it were a participant. The complete configured command
is the failing formal regression; the product assertions remain unchanged.

Owner: existing original-run observation helper, covered by the collaboration
manifest's observationInputs, not the product recovery owner. Readiness must wait
within a bounded timeout for the actual collaboration handle identity before
attaching participant evidence. Do not invent actors, omit required participant
counts, relax normalization or replay product operations. Missing identity must
fail the observation explicitly. Implementation boundary is
`apps/asyra-design/e2e/collaboration-observation.ts`; preserve identity checks,
source invalidation and original case assertions. Run the complete observed collaboration command, including the actual recovery
case, plus helper invalidation tests. This is main-integration tooling correction, not Stage 3.

### Stage 2 observation iteration review - 2026-10-16

Re-audit after the first observation correction: Playwright waitForFunction tests
predicate truthiness without awaiting it (installed coreBundle predicate call).
An async predicate is a truthy Promise even when its eventual identity is null.
Keep the existing strict participant normalizer. Use test-runner async polling of
the resolved page evaluation instead. Add a focused original-command proof of the
same recovery case by parameterizing the existing command/report assertion; keep
its complete 22-case variant. Run that short proof before repeating the complete
command. No product operation, timeout for product cases or outcome semantics change.

### Stage 2 delivery integration outcome - 2026-10-16

The integrated source preserves the 590 previously reviewed Design/Runtime/Factory
source files byte-for-byte. Current-main integration changed observation contracts
and the test helper, not Stage 2 product behavior. Evidence in `tmp/stage2-push/`:

- Factory 300 tests; Runtime, Design and Inspector builds passed.
- Final contract/catalog 49 tests, collaboration normalizer 13 tests, naming 15
  tests, delivery metadata 18 tests and applicable lint passed.
- Four direct collaboration/history/recovery E2Es passed; the configured real
  History Board failure/recovery proof passed. Existing runner and original-case
  localization checks passed; earlier inventory failures remain failed evidence.
- The focused recreated-session observation passed (25.7 s). The complete observed
  collaboration command then passed (218.3 s): 19 product cases, three declared
  opt-in skips, all 22 mapped with valid original participant evidence. Both earlier
  null-identity reports remain failed; a formatting-interrupted run is not a pass.
- Current-source Design candidate `207e7115-8d29-449d-b266-1ca586c87129` passed.
  Rebinding the same Stage 2 obligations to accepted integration baseline 88 produced
  assessment `13d75332-52e0-4288-b4e5-45fbe9994023`, current and eligible. The old
  baseline-87 assessment is stale, not completion evidence for the integration.

The final delivery must still verify its actual committed head, changeset and exact
remote lease. No live 101, provider request, Stage 3 product change or CI monitoring
was performed. The subsequent Stage 3 planning review remains local after push.

### Stage 2 final main freshness integration - 2026-10-16

Before push, main advanced to 4e925488842807672ab36c86fb69a269bd2249f5
(Inspector node interactions, #336). Rebase preserves both the new exact selected
configuration binding test and this branch's owned-process cleanup tests. The
existing workspace generator produces no further changes. All 590 previously
reviewed Design/Runtime/Factory source files remain byte-identical. Run affected
Inspector contract/catalog, node interaction, original-result and collaboration
normalization tests; retain the completed original collaboration report rather
than repeat unchanged browser behavior. The integrated suite passed 102 tests with
55 existing opt-in skips (`tmp/stage2-push/stage-c-tests.log`), including the real
original-case fault/recovery proofs. Scoped lint and 18 metadata tests passed.
No Stage 3 implementation is included.

### Stage 1/2 integration review - 2026-10-16

- Objective: recheck the current Stage 2 diff and direct Stage 1 consumers, including
  accumulated passes, current-request peer changes, failure recovery, history,
  compensation, resend and document reload. No Stage 3, live model, 101, push or monitoring.
- Inspector comparison: existing inspect-current-stage owns scoped canonical
  freshness and result retention; apply owns guarded writes; Factory and document
  settlement retain their existing history/durability owners. No new routing or
  compatibility contract is authorized. Current admission remains the baseline.
- Before edits: review found that the real aggregate integration already checks
  a passive collaboration peer and durable Undo/Redo, but does not change that peer
  while the same host request retains successful results. Strengthen that existing
  formal case with a peer mutation and peer Undo, exact remeasurement targets and
  unchanged independent result revisions. Do not infer a product bug until reproduced.
- Mutation boundary: the existing integration case and this plan/handoff; any
  reproduced direct regression is fixed test-first in its existing admitted owner.
- Gates: complete inspection/action integration, existing Factory replay/transaction
  suites, browser collaboration/history/recovery consumers, server canonical reducer
  and persistence queue, applicable lint/types and current Inspector evidence.
  Review error settlement and recovery paths in source as well as assertions.
- Stop: report only this bounded stage review; retained historical evidence is not a
  substitute for an affected gate, and no fixture failure is labeled a product bug.

### Stage 1/2 integration review outcome - 2026-10-16

The review found a missing combined integration assertion, not a reproduced new
production defect. The existing successful aggregate case now holds the real host
request open while a peer changes the repaired third region. Verification reopens
exactly that region, performs one canonical measurement, and retains all seven
independent pass records/revisions. Peer Undo restores the geometry; one more
measurement restores the pass under a newer revision. The original AI Undo/Redo,
peer convergence, authoritative saved digest and page reload assertions still pass.
The test records actual dispatched measurement targets, not just returned values.
Only this existing formal test and plan/handoff changed in this review.

Source review covered current schemas/selection provenance, prewrite guards versus
writer errors, partial/cancelled acknowledgements, typed repair coverage, result
currency/retirement, shared editor callers, ordinary Factory history/publication,
and exact persistence retries. Primary-agent inspection remains separate from tool
success. No parallel interpreter, second store, compatibility branch or new policy
was added. Existing accepted runtime/architecture evidence remains current; no
new production behavior was needed to close this review.

Fresh evidence under `tmp/stage2-review/`:

- `peer-e2e.log`: the strengthened real-peer case passes independently.
- `integration-full.log`: complete inspection suite, 12 passed / 2 original opt-in
  skips. The command's nonmatching action-suite filename selected no action tests;
  action usage was therefore run separately and is not claimed by this log.
- `action-usage.log`: all 22 registered action usage cases pass.
- `collaboration-recovery.log`: 9 existing real-browser cases pass: blocked local
  draft isolation; finite batch history; reconnect; remote nested-group Undo/Redo;
  visible rollback compensation and reload; preparation failure with retained edits,
  reload/retry and later save; IndexedDB prefix recovery; accepted-source cleanup
  failure and replay. These use actual peers and the document backend.
- `factory.log`: all 300 Factory tests pass; `core-history.log`: 6 history tests pass.
- `recovery-consumers.log`: 269 existing collaboration, publication outbox, recovery
  controls and transaction tests pass. `server-owners.log`: 291 check/repair,
  composition, receipt, canonical reducer and backend persistence tests pass.
- `browser-ai.log`: all 586 browser AI tests pass. Some suites overlap; counts are
  reported individually, not added into a synthetic coverage total.
- `browser-types.log`, `server-types.log`, `lint.log`, `naming.log`: production
  TypeScript, changed-test lint and all 15 naming checks pass. Diff whitespace passes.
- `assessment.json`: existing assessment b784e46f-6ecf-47e4-8585-0d69097cbe3c remains
  current=true and eligible=true on unchanged runtime source. The strengthened E2E
  evidence above is additional evidence, not fabricated Inspector case execution.

No live model/101, Stage 3, commit, push or monitoring was performed. Test servers
remain Playwright-owned and are checked for exit before reporting completion.

### Stage 2 local completion - 2026-10-16

The existing registry, invoke boundary, request check store and Runtime finite
iteration now connect native mechanical selection -> aggregate verify -> explicitly
prescribed guarded repair -> fresh selection -> verify. Current independent passes
are retained, typed unavailable findings survive failed reads, and only changed
selected dependencies are measured. No extra model, interpreter, result store,
compatibility route, inferred repair or automatic policy rebasing was introduced.
Primary visual acceptance and document durability remain independent obligations.

Final review exercised producer/consumer schemas and resource lifetimes, actual
request identity, stale revision/currency admission, complete pending coverage,
parent-local attachment basis, locks, partial reads, cancellation, unknown writes,
retirement, repeated progress and real downstream history/persistence. It corrected
known prewrite rejection classification without relabeling writer errors. The final
browser case explicitly changes the parent in a canonical transaction, rejects old
evidence, obtains new evidence and an explicitly renewed policy, completes repair,
and verifies Undo/Redo, a collaboration peer, saved digest and reload. Other seven
selected passes retain their evidence without remeasurement. The test uses the same
requireBatchSuccess adapter as the actual provider; failed receipts are not mistaken
for successful dispatch. Earlier malformed fixture/setup failures remain failed
logs, not product-regression evidence.

Final evidence (`tmp/stage2/`):

- Runtime `runtime-final.log`: full 376 passed; runtime source unchanged afterward.
- Design server `server-recovery-final.log`: 1,234 passed, 9 original opt-in skips.
- Design browser AI `browser-recovery-final.log`: full 586 passed.
- `browser-integration-final.log`: complete inspection/action-usage suites, 33 passed
  and 2 original conditional skips before the last known-rejection correction.
- `mechanical-recovery-final-e2e.log`: all five real aggregate integration modes
  passed on the final correction (success, changed basis, no progress, cancellation
  after write, interrupted reply after write). `action-recovery-final-e2e.log`: the
  current public action success/invalid/cancel/mixed-ID usage case passed again.
- `prewrite-red.log`, `prewrite-consumer-red.log` fail the specific product assertions;
  `prewrite-green.log` passes all 55 affected tests. Other red/green owner evidence
  remains in this directory. No failed run is reclassified as passed.
- Production browser and AI-server TypeScript, focused lint, 15 naming checks and
  8 generated catalog tests pass. `git diff --check` passes. A command using the
  nonexistent tsconfig.server.json was corrected to the actual tsconfig.ai-server.json;
  it is not a production type failure or passing evidence.
- Final Design candidate `3d151d8f-2f78-41b0-832d-aab7e51b6daf`: 34 mapped cases pass.
  Review `03e53793edfc7be6407d1b1e12fc1ba4d7cc4a19b8bbd511f9ef724b4eed8e65`
  has no blockers. Target `88a3a548-937e-4487-9094-533cb8dc29bf`, allocation 1,
  assigns all current obligations to their seven existing owner steps.
  Assessment `b784e46f-6ecf-47e4-8585-0d69097cbe3c` is completed, current and eligible;
  every owner and incoming handoff passes on the same runtime source, retaining the
  accepted baseline revision 87. Earlier development-only targets remain pending
  historical evidence; they were never completion proof. No baseline was published.

Limit: this stage supports prescribed existing-child position repair for supported
container-overflow findings. Creative choices, other repair families and primary
visual judgment remain with the primary AI; Stage 3 delegation and Stage 4 reuse
are not implemented or authorized by this completion. No live AI/101 was run and no
performance/first-frame claim is made. Test services exited; local changes and .env
remain. Do not push, restore monitoring or proceed to the next stage.

### Stage 2 admission card - 2026-10-16

- Owner routes: Design `inspect` and `apply`, existing Runtime recipe invocation.
- Inputs: request-owned exact check selection, canonical recheck descriptors and
  dependency receipts; explicit prescribed repair policy.
- Outputs: typed verification status/progress and complete current selection;
  acknowledged repair/partial/recovery receipts; no fabricated visual acceptance.
- Conditions: exact request/revision/origin admission, current dependency guards,
  bounded coalesced reads, supported complete repair coverage, owner-confirmed
  retirement, retained independent results, no replay of initial writes.
- Boundaries: existing check-result store and producers, operation-tool coordinator,
  canonical browser review/repair actions, existing host/schema/Runtime consumers;
  their formal tests, spec, Inspector and generated catalog. No second store,
  interpreter, creative repair, nested model or compatibility branch.
- Admission: update inspect/apply exact conditions and supported mapping admission;
  structural acceptance is not proof of unimplemented behavior. Add executable
  product cases and source-bound evidence in each owner slice; final actual Runtime
  and browser/save/reload tests must pass before Stage 2 completion.
- Gates: naming, owner regressions, native/common invocation and finite-recipe
  integration, actual browser/local dependency/partial/cancellation/history/save
  recovery cases, affected lint/types. No unrelated full local CI.
- Stop/replan: an unsupported owner or lifecycle assumption must be resolved at the
  current bounded slice before continuing; never infer success from an old green run.

### Stage 2 lifetime handoff card - 2026-10-16

- First incorrect owner: Design's schema-driven lease walker treats every request
  value as an opaque artifact. Canonical inspection stamps are request-owned objects;
  check selections will have the same lifetime without any artifact release operation.
- Current contract: `x-runtime-value: request` denotes transient request data;
  `request-artifact` denotes an explicitly leased opaque handle. Both reject captured
  recipe literals/defaults and require compatible typed bindings. Document and secret
  identities keep their current rules. No legacy request-as-artifact fallback.
- Owners: Runtime `admit` proves the annotation and exact dependency fingerprint;
  Design host `invoke` opens/retains/releases only declared artifact handles. Actual
  preparation/query/image handle producers migrate together with the walker. Plain
  inspection stamps and check selections remain request data; nested artifact fields
  still undergo lease validation. Changed dependency fingerprints invalidate saved
  recipes until ordinary current-contract admission succeeds.
- Boundaries: recipe schema and admission tests/spec/Inspector; Design common tool
  schema, lease walker and host integration tests. No new storage or identity guessing.
- Proof: first reproduce plain request input/output failing leases, fresh compatible
  artifact binding rejected by admission, and captured artifact literals rejected;
  then prove real lease transfer, sibling refusal and cleanup still hold. Follow with
  existing composition and review integrations before advancing to aggregate checks.
- Self-review: lifetime and resource ownership are independent responsibilities.
  A generic annotation preserves typed binding and host ownership without fake leases
  for record IDs, name-based exemptions, or weakening existing artifact validation.

### Stage 2 check provenance card - 2026-10-16

- Owner: Design `inspect`; canonical check producers -> request check store ->
  aggregate verifier. Keep public evidence as a summary, never parse it for dispatch.
- Store exact typed measurement/prepared descriptors beside the current record;
  expose detached private selections only to the coordinator. Public reads return
  compact check identity/revision projections. A retired tool record retains its
  last revision and owner reason; missing, recreated and main-agent records cannot
  masquerade as retired mechanical success.
- Admission validates the entire nonempty unique selection before work. Invalidation
  changes freshness but preserves identity; producing new evidence advances revision.
  Re-recording an identical descriptor and result reuses the revision. Retirement is
  canonical owner action, never inferred from a failed lookup.
- Tests: exact revision, duplicate/mixed selection, retirement/recreation, detached
  descriptors, no evidence parsing, unaffected pass retention and producer handoff.
- Review: use the existing store and its dependency graph. No second result registry,
  global invalidation or model calls. Runtime host supplies its actual request ID;
  a standalone operation owner has its own request scope for direct formal tests.

### Stage 2 aggregate verification and prescribed repair card - 2026-10-16

- Owner sequence: `inspect` validates complete current selection and refreshes only
  typed selected dependencies; `apply` admits explicit positions and dispatches a
  guarded canonical browser action; Runtime consumes the existing status/progress
  interface. No model or new interpreter participates.
- Producer handoff: successful native `review_design` receipts include a required
  `mechanicalSelection` with actual request ID and nonempty check selection. Existing
  check summaries remain summaries. Aggregate results return the same selected IDs
  with current revisions; partial results retain this projection for read-only retry.
- Review correction: explicit positions also carry the existing
  `PreparedAttachmentEvidence` (parent/workspace/basis stamp). Parent ID alone cannot
  guard a changed coordinate basis. Policies bind this original evidence, never a
  newly substituted basis. The existing attachment reader supplies it. No inferred
  positions or automatic policy refresh. Invalid basis returns to primary decision.
- Implementation boundaries: `local-mechanical-checks.ts`, existing operation tools,
  check store and typed producers; `prescribed-position-action.ts`, shared edit
  preparation, existing browser action registration and evidence owner; their exact
  tests/spec/Inspector. Preflight every edit using the existing editor's authoritative
  validation before any write, then run in the existing synchronous mutation boundary.
- Verify proofs: supported current passes avoid remeasurement; one changed region
  preserves unrelated passes; incomplete/failed/cancelled refresh retains independent
  results; progress excludes revision/time; terminal retirement remains selectable;
  unsupported descriptors/findings return decision-required, never auto-pass.
- Repair proofs: full finding/policy coverage, duplicate/foreign/expired/locked targets,
  queue-time dependency changes and parent changes reject before writes; current
  receipts, partial settlement and cancellation preserve actual history/save behavior.
  Integration must use real host/registry/Runtime and real browser persistence, not
  replace the canonical checker or writer with a mocked success.

### Stage 2 handoff iteration review - 2026-10-16

Real browser integration reached actual native review, request ownership admission,
and guarded repair admission. An invalid complete-set policy was correctly refused
before writes, but the declared repair recovery schema required retained selection
on every failure. The host therefore replaced the correct admission failure with
`TOOL_HANDOFF_FAILED/unknown`. Correct the output union at its definition owner:
explicit admission/not-started failures need no retained write result; execution
partial/recovery requires the acknowledged current selection. Do not loosen host
validation or infer that unknown outcomes were not started. Add a native-host proof
before repeating the browser flow. The first browser attempt also corrected its test
oracle from wrapper `success` to the actual delivered `toolOutcome`; that was not a
product behavior change.

The actual browser flow also exercised the App startup permission table: the new
registered reversible action was correctly denied because its allow entry was
missing. The existing all-registered-actions startup test reproduces this omission.
Include startup permission wiring and its existing tests in this same apply-owner
card; preserve deny-by-default for unknown actions.

The native response validator also classified aggregate verification as an action
receipt despite its declared read-only check schema. A formal native-host proof now
requires the exact verification output through the common boundary; bind that
validator to the existing declared verification schema, not an empty action array.

The exact unique selection schema also exposed a Runtime contract gap: registered
schemas preserve `uniqueItems`, but fresh recipe/state schemas reject the same
keyword. Extend the existing array subset to admit and validate this boolean
constraint, retaining implication checks and host runtime validation. Formal tests
must reject missing/false uniqueness when the consumer requires it and malformed
annotation values. This does not increase a work limit or bypass duplicate checks.

Attachment receipt identity is checked by its canonical dependency owner, not just
currency: a current capture for another target or a non-attachment capture cannot
approve this parent. The ordinary one-argument `current` API remains unchanged;
`currentAttachment` is the explicit typed operation. Existing callers passing
`current` to Array.map exposed why adding an optional positional argument there was
incorrect; the owner API now keeps these responsibilities separate.

### Stage 2 failure and currency closure - 2026-10-16

The same-source real browser cases now cover successful repair, repeated-progress
stop, cancellation after an acknowledged write and delivery interruption after an
acknowledged write. They use the actual host, Runtime recipe, browser actions,
Factory/history, peer collaboration and document backend/reload. Fault injection
happens after the actual write, not in a mocked mutation. No live model is invoked.
The existing startup test caught a missing new-action allow entry before closure.

Review found two further prewrite/read-boundary gaps: a changed revision during
asynchronous admission must remain a known rejection, and findings without current
canonical receipts cannot declare repairability. Revalidate independently completed
reads after a partial read, retain typed prior findings on unavailable measurements,
and return the complete current selection with pending findings. New regressions
failed before their owner fixes. Neither verification nor recovery replays writes.

### Stage 2 known prewrite rejection recovery - 2026-10-16

Owner: existing `apply` browser guard and operation receipt consumer. The initial parent-basis integration failure was a malformed test fixture call to
Core's plural property API, not evidence of a browser preflight rejection. Correct
the fixture to actual elementId/values updates and assert the first rejection's
settlement before retry. Separate formal regressions reproduced two real gaps:
preflight throws an unclassified error and the operation consumer marks an explicit
not-started receipt as unknown scope. Preserve the failed fixture evidence and do
not use it as proof of the product root cause. Preflight must explicitly report the existing input-contract
rejection before any mutation; execution errors after that boundary remain unknown.
The operation consumer must honor an exact failed-action not-started receipt without
inventing a missing mutation scope; acknowledged earlier actions still contribute.
No automatic policy rebasing, permission bypass, unknown-write retry or new state.
Boundaries: prescribed-position action, operation receipt consumer, their formal
regressions, existing spec/Inspector and functional case mapping. Gates: known-vs-
unknown failure tests and actual parent change -> rejection -> fresh prescribed
policy -> repair -> Undo/Redo -> peer/save/reload. No additional repair family.

### Stage 1 Factory follow-up review card - 2026-10-15

- Objective: review the no-op replay correction across normal transactions, batches,
  collaboration, Undo/Redo, compensation, retry and Stage 1 inspect-to-settle.
- Fixed discovery: current Factory replay/shared-publication owners and their formal
  suites; direct Core history consumers; Design publication, persistence queue,
  collaboration recovery and existing real-browser inspection integration. Inspect
  current source and contracts, not removed implementations or historical behavior.
- Exact owner routes: History `replay-history-action`, persistence
  `settle-local-publication`, and Design `inspect` -> `settle`. Review buffered and
  already-published failures separately. Canonical restoration and remote delivery
  compensation have different inputs; a local no-op is not proof of remote state.
- Allowed edits: focused permanent tests and first incorrect owner on these routes,
  their exact specs/Inspector contracts, this plan and current handoff. No Stage 2,
  model requests, live 101, push, monitoring, new compatibility or new dependency.
- Gates: Factory and direct consumer suites; real browser inspection/history with
  peer and durable reload; affected production types/build, lint/naming and exact
  Inspector admission. Reuse unchanged prior evidence with explicit attribution.
- Completion: review actual input/output and failure recovery, preserve strict
  backend admission, distinguish newly reproduced defects from preventive coverage,
  and report residual limits without claiming all possible states were enumerated.

Self-review: no new product capability is needed. The persistence bypass wording
must distinguish an ordinary unrecorded no-op from successful retained History
settlement; otherwise it conflicts with the upstream reviewed replay contract.
Published-prefix compensation needs an explicit no-op sibling proof in addition to
existing buffered-failure coverage. Both checks stay inside the authorized owners.

### Factory follow-up review outcome - 2026-10-15

The bounded upstream/downstream review found no additional production defect in the
successful-no-op replay correction. No production implementation was changed in this
review. One persistence Inspector bypass was ambiguous: ordinary no-op mutation and
retained History settlement are different contracts. The bypass now states that
separation and retains the document-channel filter; the generated catalog is updated.

Permanent preventive coverage now exercises a no-op sibling after publication,
followed by a later owner failure, reverse linked compensation, retained Undo entry,
retry and Redo. Local restoration touches only changed owners; shared compensation
restores the previously delivered state, which need not equal the local no-op state.
The new case passed without a production change. Its first draft configured the same
transaction delivery policy more than once and correctly failed admission; that test
setup was corrected, not the product guard.

Code review followed replay success versus mutation acknowledgement, batch/source
ordering, provisional History settlement, acknowledged compensation correlation,
document-channel filtering, canonical insertion validation, retained outbox/recovery,
and exact in-flight backend retry. Invalid duplicate creation still fails canonical
admission; no backend validation or recovery guard was removed. Stage 1 review still
uses the actual host/registry/browser/store/settlement route and no independent AI.

Current-source evidence under `tmp/stage1-integration/`:

- `review-factory.log`: full Factory suite, 300 passed; `review-factory-build.log` passed.
- `review-core.log`: 36 direct Core history/persistence tests passed.
- `review-browser-consumers.log`: 123 publication, collaboration and lifecycle tests passed.
- `review-backend.log`: 24 canonical reducer and persistence queue tests passed.
- `review-inspection-e2e.log`: 7 actual-browser Stage 1 cases passed, 2 existing recorded
  fixture opt-in cases skipped. Includes peer equality, durable confirmation and reload,
  partial results, stale/cancelled/unavailable evidence, repair and completion.
- `review-collaboration-cases.log`: 10 existing actual-browser collaboration cases
  passed. Covers finite batches, reconnect, Group restore/Redo, partial Fill, published
  compensation and durable reload, preparation/IndexedDB/accepted-cleanup recovery,
  subsequent edits and peer preservation. No persistence 409/422 appeared in either
  successful browser log. The first discovery command used ordinary Playwright config,
  which excludes collaboration; its `No tests found` result is not a passing run.
- `review-retransmission.log`: 2 real socket-server cases passed, proving publication
  retry deduplication and exact ordered backend-batch retry after rejection.
- `review-types.log`, `review-lint.log`, `review-naming.log` and
  `review-task-context.log`: declared production types, changed-file lint, naming
  (15 tests) and task association passed.
- `review-catalog.log`: 53 catalog/admission tests passed.

Prior accepted same-source History defect-injection and Design flow evidence remains
supporting evidence; this review does not relabel it as a new execution. No speculative
fallback, compatibility route, additional state owner or Stage 2 implementation was
introduced. All current bounded gates passed. Keep the work local and stop after this
review; no live 101, push, monitoring or automatic next-stage execution.

### Stage 1 integration closure card - 2026-10-15

The current request authorizes integration-level proof and direct defect correction
only. This card supersedes earlier completion claims for the same stage.

- Owner route: inspect-to-settle; upstream common host admission and actual App
  runtime action execution, downstream canonical result store, subsequent review,
  completion settlement and public runtime outcome.
- Authority: spec `#tool-first-correction-contract`; Inspector inspect conditions,
  existing implementation boundaries and inspect-to-settle route. No new capability.
- Inputs: actual registered action contracts, deterministic scripted primary-agent
  judgments, real rendered inspection receipts and canonical change notifications.
- Outputs: retained passed/pending records, scoped freshness rejection/recovery and
  a completion outcome consistent with all current obligations.
- Allowed contributors: existing registry/invoke, operation owner, check store,
  browser runtime, canonical evidence owner and real document APIs. No extra AI,
  compatibility route, fabricated receipt, replacement store or Stage 2 aggregate.
- Boundary: existing `e2e/ai-inspection-evidence.spec.ts`, corresponding operation
  and review tests; direct canonical-owner fixes only after a failing regression.
  Plan and current Inspector evidence references may be updated within this route.
- Integration completion requires real producer outputs admitted by real consumers:
  public invocation -> validation/dispatch -> browser action/evidence -> retained
  store -> subsequent partial review/read -> settlement -> runtime outcome.
  Script only primary-agent decisions and external transport faults. Do not mock
  middle owners, their freshness verdicts, check results or completion verdicts.
- Required sequences: existing-content review without a mutation; pass -> later
  failure -> blocked completion -> partial repair -> completed; pending evidence
  outside the submitted subset and unchanged passes retained; local document edit
  invalidates affected evidence only; stale/unavailable/cancelled reads cannot
  publish approval and a safe retry does not replay document writes.
- Gates: actual browser integration plus affected existing owner/host suites,
  production TypeScript, changed-file lint, naming and Inspector contract checks.
  Count mapped cases as evidence bindings, never semantic completeness by itself.
- Review each sequence against actual state and public outcomes, not test names.
  A test passing without a production change is preventive integration coverage,
  not proof that a newly reproduced defect was fixed.
- Stop after Stage 1 closure and a current-only new-chat handoff. No Stage 2,
  live 101, model requests, push or monitoring. Preserve existing local work.

Self-review: this boundary covers real ownership and failure/recovery handoffs without
building a second execution mechanism. The scripted model is the external boundary;
all product intermediates remain production implementations. Browser integration is
required where renderer evidence, runtime transactions or canonical invalidation are
involved. Existing targeted cancellation tests remain supporting evidence only.

Integration finding (resolved by the correction outcome below): the existing create/Undo/Redo/Core-load browser
case passed while persistence repeatedly rejected duplicate creation IDs (422).
Adding a required durable confirmation reproduces failure BEFORE Core load. The
earlier hypothesis that direct Core load caused the rejection is disproven; do not
use it as a root-cause statement. Preserve the strengthened failing test and actual
canonical publication artifact. The new public tool review/partial recovery/local
invalidation/settlement case passes with durable completion. Do not conflate that
pass with the independent history/persistence failure. The user explicitly authorized expanding this round to the history/persistence owner; Stage 2 remains excluded.

### Integration evidence and current stop - 2026-10-15

- New real browser/host/store/settlement case passes, including real durable
  `report_outcome`. Both before-dispatch cancellation and cancellation after actual
  browser validation preserve retained records. Corrected capture recovers unavailable
  images; one local edit preserves the other criterion's exact passed record. No
  product implementation change was needed for these newly exercised paths.
- Existing owner suites: 285 passed; declared production TypeScript passed; changed
  test lint passed; naming 15 passed; Inspector catalog/admission 53 passed.
- Earlier whole-file 7 passed / 2 opt-in skips is not clean persistence evidence:
  backend logs exposed a failure. Adding mandatory durable confirmation turns that
  previously invisible problem into a formal failing test. The correction outcome below records its subsequent passing verification.
- `tmp/stage1-integration/browser-publications.log` records the strengthened failure.
  `inspection-lifecycle-publications.json` preserves five actual publications:
  creation -> properties -> Undo properties -> Redo same-ID creation -> properties.
  The Undo publication has no inverse element removal. The backend then rejects
  duplicate creation. This localizes the broken producer/consumer handoff; it does
  not yet identify the implementation line responsible. No validation was relaxed.
- Exploratory E2E TypeScript configuration remains failed on pre-existing source/test
  helper typing outside the declared production gate; no errors remain in this turn's
  added integration block. Do not label that exploratory command successful.
- Current-only continuation: `reusable-tool-composition-current-handoff.md`.
  All test-owned 3300/3401/4401 listeners exited. No Stage 2, live101, model request,
  push or resumed monitoring. The authorized correction now includes the separate history/persistence owner. Do not reuse historical automatic merge goals.

### Authorized history-to-persistence correction card - 2026-10-15

- Objective: repair the reproduced create -> Undo -> Redo -> durable save failure,
  then prove reload and unchanged Stage 1 review handoffs. Stage 2 remains excluded.
- Inspectors: History Replay `replay-history-action` -> document persistence
  `settle-local-publication` -> backend materialization. Factory owns inverse/forward
  replay and shared evidence; App translates publication evidence; backend validates
  ordered document changes. No owner may silently drop a required removal.
- Inputs: real UI action, committed journal, inverse replay, exact publications.
  Outputs: matching local/remote/durable state with one reversible history action.
- Discovery: compare local Undo state, raw Factory publications and App translation;
  inspect only the first incorrect owner and its direct consumers. Do not assume
  Factory is wrong merely because the final backend rejection is visible.
- Allowed edits: the implicated canonical replay/publication owner and its existing
  tests, actual browser history/persistence integration, related spec/Inspector and
  plan. No backend validation relaxation, artificial inter-action delay, guessed
  removals, compatibility fallback or whole-document repair snapshot.
- First retain the current failing durable browser assertion; add a focused permanent
  producer/consumer regression before any production fix. Verify batching, progressive
  and synchronous history, failure compensation and retries through affected tests.
- Gates: affected owner suites, actual create/Undo/Redo/save/reload integration and
  existing review integration, production types, lint, naming and Inspector proof.
- Stop: Stage 1 handoff only; no model calls, live 101, Stage 2, push or monitoring.

Self-review: the failure is now explicitly authorized. Local state and wire evidence
must agree before blaming persistence. Preserve existing invalid-input/retry rejection;
use actual state owners and backend, not replacement history or a permissive reducer.

Root cause confirmed: after Escape, selection inverse succeeds without changing local
state. Factory replay gated both restoration and retained publication readiness on
`applied`, leaving the creation slice unready while local element removal succeeded.
Redo republishes creation; the backend correctly rejects its duplicate. Both ordinary
and progressive focused history cases fail before the fix with missing publications.
The correction separates successful replay delivery from mutation-only restoration;
retained historical evidence still reaches its shared consumer, and thrown replay
failures remain unready. No backend or App translation exception is needed.

### Stage 1 integration and history correction outcome - 2026-10-15

Completed the authorized slice. The production fix changes Factory replay readiness,
not backend validation or the document format. Successful owner replay settles its
retained shared delivery even when the local value already matches. Only actual
mutation registers rollback restoration. No selection-specific exception, duplicate-ID
bypass, artificial delay, compatibility path or replacement history was introduced.

Permanent regression evidence:

- `factory-journal-history.test.ts`: synchronous and progressive no-op sibling cases;
  real state and exact inverse/forward publications; failed mixed replay restores only
  changed owners, preserves History, publishes no premature batch and can retry.
- `ai-inspection-evidence.spec.ts`: real UI creation, Escape, Undo and Redo; second
  independent collaboration client sees each change; durable confirmation and backend
  digest match local state; actual reload restores the exact saved document.
- The same file's public tool integration crosses real host/registry/browser actions,
  evidence storage, partial repair, cancellation, scoped invalidation and durable
  settlement. Only primary-agent decisions and external faults are scripted.
- Full Factory suite: 299 passed. Core history/persistence consumers: 36 passed.
  App collaboration/publication consumers: 123 passed; server reducer/queue tests
  passed in the prior node run. Existing review/operation/store suites: 285 passed.
- Actual browser evidence suite: 7 passed, 2 existing opt-in recorded-replay skips;
  the subsequently extended two-client history/save/reload case also passed. No
  live101 or model request was run. No persistence rejection appears in final runs.
- Production TypeScript, Factory build, changed-file lint, naming (15), and Inspector
  catalog/admission (53) passed. No push, monitoring or Stage 2 work occurred.

Source-bound proof: History candidate and accepted review are recorded in
`tmp/stage1-integration/history-closeout-{candidate,accepted}.log`; final proof
`history-closeout-proof.log` passes baseline, three exact defect injections and
recovery on the same source, with 17 obligations. The History manifest now binds all
existing cases in its declared test suite; the current verifier correctly rejected
previously unregistered siblings, including skipped tests. Exact order/value negative
expectations were expanded to include those existing assertions; none were removed.
The old no-op defect injection fails the three new handoff/recovery cases exactly.
Design source candidate `dd343c3d-5a46-4133-bd0c-26e98afe95c3` passed its 31 cases.

Validation limitations and corrected attempts: the first browser rerun used the old
compiled Factory dependency and still failed; rebuilding the actual package resolved
that source mismatch before the successful run. An exploratory browser-consumer run
used Node instead of its declared jsdom environment; the corrected environment passed.
Earlier failed/unknown logs remain failed/unknown and are not counted as green.
The exploratory legacy E2E typecheck remains outside the declared production gate.
No broad repository CI, visual 101 acceptance or remote state is claimed.

Final self-review traced changed replay completion through projection, App filtering,
remote application, strict backend materialization and actual reload. Failure keeps
restoration and publication responsibilities distinct; existing compensation, batching,
History groups and direct Core consumers remain covered. UI/model review contracts
remain unchanged. Stop here and use the current-only handoff for the next conversation.

### Stage 1 follow-up review card - 2026-10-15

Current authorization is a bounded Stage 1 review and correction, plus read-only
Stage 2 implementation inspection and contract repair. Do not start Stage 2 code.
Review the current primary judgment path (validation, receipt admission, retained
results, correction handoff, completion), prepared checks, canonical vector conversion,
and explicit diagnostic provider separation. Include invalid input, partial reviews,
local invalidation, retry and unaffected-pass retention, not only the removal tests.

- Active owner: inspect; spec `#tool-first-correction-contract` and existing
  inspect-to-compose / inspect-to-settle routes. The canonical result store owns
  judgment status/evidence; correction output must preserve pending findings and
  completion must not retain a prior approval after a newer failed judgment.
- Allowed edits: local-design-review and its formal tests/proof; directly affected
  spec/plan/Inspector contracts and generated catalog. Other Stage 1 consumers are
  read/review/test only unless a direct regression is reproduced first.
- Stage 2 contract review compares actual Runtime admission, binding, iteration,
  cancellation and recovery with the proposed aggregate interface. Repair contract
  mismatches only; no new tool, interpreter, provider or compatibility behavior.
- Gates: regression-first owner tests, existing review/prepared/check-store/host
  integration, production typecheck, changed-file lint, naming and source-bound
  Inspector proof. Reuse unchanged vector/browser evidence, unless edits reach those
  consumers. No live 101, model requests, push or monitoring.
- Stop after the bounded handoffs pass review and applicable gates. Future aggregate
  execution remains pending; admitted contracts are not future runtime acceptance.

### Stage 1 follow-up review outcome - 2026-10-15

The review found and fixed three inspect-owner defects in the current primary-agent
handoff: partial submissions omitted other pending evidence; a newer structure failure
could leave final acceptance true; judgments of existing content could be ignored by
settlement when this request had made no edit. Formal regressions failed first in
`tmp/tool-first-stage1-review/red.log` and `read-only-red.log`. Correction output now
reads the canonical pending store, structure failures revoke final acceptance, and
published judgments activate the existing review requirement. No duplicate store or
compatibility route was introduced. Validation-only/rejected submissions stay inert;
structure recovery requires a final primary judgment; unrelated passes retain their
exact records. Existing-content review does not require a synthetic mutation.

Review traced schema -> operation host -> validation-only candidate -> asynchronous
canonical receipt validation -> publication -> correction/read -> completion settlement,
including cancellation, unavailable/stale evidence, partial criteria, reference/fact
changes, regional units and deferred work. The actual operation-consumer case now proves
completion refuses a later structure failure and resumes after correction with retained
passes. Source proof also covers that transition. An unused assessor mock in an existing
proof was replaced by an assertion on the actual mocked provider spawn boundary.

Stage 2 review corrected the numeric progress mismatch, specified revision handoff from
the last successful repair receipt, and placed dynamic repair-capability coverage at
the Design repair owner before writes. Actual Runtime admission/execution/partial and
cycle paths were inspected; generic Runtime remains unchanged. These are contract
repairs only. Stage 2 runtime implementation and its new aggregate acceptance are pending.

Final evidence under `tmp/tool-first-stage1-review/`:

- `integration-final.log`: 534 passed, three original conditional skips across seven
  existing review, prepared, store, operation, provider, host and composition suites.
  This includes four new regression cases and the strengthened real host settlement
  case, plus existing local invalidation, accumulation and failure recovery cases.
- `types-final.log`: both production TypeScript projects passed. `lint-final.log`:
  zero errors, one existing console warning in the proof fixture. Naming passed.
- `inspector-final.log`: 53 catalog/admission tests passed. Design captured candidate
  `34bf8a84-071d-4e81-bb40-e27821194386`, source
  `1aa0243e67964a6e6d2074b6dc56f2a755fc47b29fe843bf8da66627063d73f0`,
  all 31 cases passed; accepted review
  `5b296cda8c7c792bc8d93bfd739d30b341f4fe411a3dc2f8166a80d43673f055`.
- Runtime captured candidate `500530fb-0eeb-42b5-8dc9-41ae12b05bfc`, source
  `7bcf338a29bacaf02b2c8122044a135ea9ec49547c5bad2523e5b97a9afde60e`,
  all nine existing lifecycle cases passed; accepted review
  `892bf19fe1dcbad13144c00d9dd0a111085bf8611d4486e841578bfac4530b77`.
- The first filtered host invocation passed its selected case but failed the suite's
  all-advertised-tool coverage guard because other cases were filtered out. The guard
  was preserved and the complete suite passed; `host-focused.log` remains failed.
  No failed run is relabeled green. Unchanged canonical-vector/browser evidence from
  the preceding stage is retained; no browser/persistence/runtime mutation was made.

Bounded closure: current Stage 1 handoffs have no unresolved finding in the reviewed
routes and applicable gates. This is not a universal correctness guarantee, future
Stage 2 runtime acceptance, performance measurement or document persistence redesign.
No live 101, model request, push, monitoring or later-stage implementation occurred.

### Stage 1 execution card - 2026-10-15

- Owner segments: inspect removes the independent drawing assessor and refactors
  its still-used evidence types; observe removes its exclusive provider entry;
  compose removes the obsolete vector argument at schema/normalization/dispatch.
  Complete each segment before advancing. No generic Runtime implementation change.
- Contract: AI execution spec `#tool-first-correction-contract`; existing Inspector
  inspect/observe/compose nodes and prepare-to-inspect, inspect-to-compose,
  inspect-to-settle routes. Failure stays with the existing owner.
- Inputs: canonical criteria, primary-agent judgments, inspection receipts and
  componentMappings with eligible analysis receipts. Outputs retain current typed
  results and unresolved findings, without an independent-assessor verdict.
- Conditions: canonical freshness/coverage and pre-write schema checks remain;
  no fallback aliases, implicit extra model, new interpreter or widened limits.
  Explicit post-run diagnostic assessment remains separate and supported.
- Allowlist: local-design-review, local-prepared-design-review and neutral check
  contract; local-operation-tools image type consumer; local-ai-provider and its
  exclusive assessment helper; local-vector-artifact/local-image-tools and domain
  prompt; their existing formal tests, vector provider E2E fixture, package test
  inventory; directly corresponding spec, plan, Inspector manifests/data/catalog.
- Discovery frozen to those identifiers, direct callers and existing proof cases.
  Do not expand into retention, status, load/save or future mechanical-loop repairs.
- Test first: reject obsolete vector input; remove exported assessor capability;
  preserve primary visual failure/recovery and ordinary mechanical/prepared checks.
  Add the actual Stage 1 handoff case to the existing Design proof manifest.
- Gates: applicable server suites, canonical vector provider consumer, production
  server/browser typechecks, changed-file lint, naming, Inspector structural
  admission and source-bound candidate proof. Future acceptance cases stay pending.
- Stop: after Stage 1 self-review and gates. Do not claim model adoption, first-frame
  improvement or completion of future stages. No push or resumed monitoring.

### Stage 1 admission and owner review

The revised Design and Runtime manifests pass the existing `loadContract` structural
admission. This admits the declared architecture, not future executable completion.
The inspect owner case `inspect.current-contract` covers canonical conversion,
obsolete-input rejection, primary fail/stale/fresh-pass handoffs and absence of an
independent provider capability. Its initial execution failed on all six removal
assertions (`tmp/tool-first-stage1/red-all.log`) before production changes.

Readiness self-review: owner inputs/outputs, conditions/bypasses, contributors,
failure owners and current consumers are consistent for Stage 1. Stage 2's exact
aggregate API and Stage 2-4 handoff cases are specified but remain unimplemented;
no target or runtime acceptance is claimed for them. Stage 1 preserves the current
canonical check store and explicit post-run diagnostic service. The selected base
is the rebased task HEAD, which already contains this plan; task-context preflight
passes. No main, remote or unrelated task state is changed.

Inspect segment: 106 existing/current tests pass after removing the second assessor
and moving required neutral prepared-check types into `design-check-contract.ts`.
Retired tests exercised the removed independent scorer; reference selection, source
assertions, retained primary failures and local pass accumulation now exercise their
current owner APIs. No compatibility method remains. Observe and compose segments
remove their exclusive provider entry and alias; direct integration gates follow.

### Admission consumer correction

The applicable Inspector admission tests exposed stale fixture expectations: Design
still expected 23 cases (current 31, including this stage's one new case), and Runtime
expected one case per owner/four tests although its current manifest has nine cases.
This is a direct contract-consumer correction within admission scope: update exact
case counts and unique owner membership while retaining source/test-name/path/spec
and actual execution checks. No Inspector admission rule or runtime is weakened.
The failing formal run is retained in `tmp/tool-first-stage1/inspector-tests.log`.

### Stage 1 completion and bounded self-review - 2026-10-15

Completed only current-contract cleanup. Removed the independent visual provider,
its options/result fields, unused comparison/retention API, scorer prompt/validator
and exclusive live/unit cases. Required prepared-check context/results now have a
neutral current contract. Primary judgments continue through the existing check
store; explicit post-run diagnostics remain supported. Removed the oval alias from
schema, normalization, host consumer, prompt and current examples. Canonical mapping
and eligibility remain unchanged; rejected legacy requests do not consume artifacts.
Saved historical reference images were preserved, with their obsolete run instruction
removed. No compatibility adapter, alternate registry or model setting was added.

Self-review covered input admission -> existing conversion/inspection owner -> primary
failure and recovery -> current retained results, provider export/call sites, canonical
schema/native descriptions, actual browser drawing/Undo consumers, source assertion
freshness, and exact Inspector locations. Formal red evidence preceded removal.
The old independent-mode tests are retired; useful reference/source/local-pass cases
now call current owners. The inert assessor injection mock was removed because an
ignored callback is not proof that a checker cannot invoke a model. Current source
proof explicitly asserts no provider spawn, and existing prepared/deferred checks
remain executable. No unresolved Stage 1 failure remains in the bounded gates.

Evidence (all under `tmp/tool-first-stage1/`):

- `integration-tests.log`: 604 passed, 3 existing conditional skips; eleven current
  server suites cover provider/host, schemas, primary/prepared review, mappings and
  operation/composition consumers. `image-final.log`: 23 passed after strengthening
  actual valid-artifact rejection/reuse, not an already-invalid receipt fixture.
- `vector-e2e.log`: two real browser cases passed in 23.7 seconds, with mocked provider
  responses: native Oval creation and fresh captures after repeated edits with one
  Undo. Inspected generated screenshots. Playwright-owned 3300/3401/4401 processes
  exited; no listening test server remains. No model, live 101 or recording run.
- `types.log`: both declared production TypeScript projects passed. `lint.log`:
  no errors, four existing console warnings; `lint-final.log`: no errors/warnings
  for the final adjusted consumers. `naming-final.log` and task-context passed.
- `inspector-verified.log`: 53 admission/catalog tests passed. Earlier failed counts
  and missing exact case-location assertions remain in their failure logs; final
  corrections add current locations rather than weakening the assertions.
- Design candidate `ed666dd1-bb7f-49f6-a9b3-c0fab0ef102f`, source
  `fdf5f4949165041cc78baf08d8cca84af7ce2eac83305cf78a7bee83901f6dd6`,
  31 owner cases passed; reviewed contract accepted as
  `8af9466bffc2e36a5a5aef28db29007370d80447f0cfb8fa05bf7d792b3689fa`.
- Runtime candidate `d522a442-dda3-4148-94f6-234aab71292c`, source
  `a605c21abdf277d815119e96731ae6a04226a7124de6fbc3ebcdc6aca30e8017`,
  nine lifecycle cases passed; reviewed contract accepted as
  `6ffd0c037cc084faa5e8b5c5c40970446384b029c9976712b603b35c613ab651`.

Contract acceptance is not whole-target completion or a cross-flow source-equivalence
claim. Stage 2 aggregate verification/iteration, Stage 3 delegation and Stage 4 reuse/
settlement acceptance remain pending. This stage makes no first-frame or model-time
improvement claim. Changes remain local and unpushed; monitoring stays disabled.

### Latest Flow Inspector review - 2026-10-15

Reviewed after rebasing onto `origin/main` at
`5fe936e74` (local HEAD `844a5d27c`). This is a plan-only review, including the
current dirty source; previous source-bound passes do not prove the rebased source.
Use the existing Flow Inspector workflow, not an additional readiness registry.

Actual supported-tool reads and structural admission:

- `cli.cjs test-results`: no retained ordinary test observations in this checkout.
  An empty list is not a passing execution or absence of historical defects.
- `cli.cjs --manifest apps/asyra-design/flow-contracts.json status`:
  mapping revision 83, no active run; Runtime manifest status: revision 21,
  no active run. Both `targets` reads contain no admitted target records.
- The existing `loadContract` admission accepts the current Design, Runtime and
  Design Playwright manifests. This proves structural consistency only, not the
  proposed changes, implementation correctness or whole-target acceptance.
- Current source manifests contain 30 Design cases across seven nodes and nine
  Runtime cases across four nodes. Counts in older overview prose are not the
  current case inventory. The new Playwright observation manifest maps only the
  single-selection Delete case. It has no proof scenarios and cannot establish
  AI workflow, save/reload or whole-target conformance.

The latest localization tooling retains original failures/retries and source
fingerprints; unmapped, stale, missing and interrupted evidence remain explicit.
Use its ordinary reporter/importer on applicable future formal runs without
rerunning tests solely to collect observations. Do not invent mappings for an
unrelated case. Required new product cases belong in their real owner proof
manifests before claiming that those handoffs are verified.

#### Review findings resolved in this plan

1. **Missing owners:** the earlier planning card named only Design compose/inspect
   and Runtime observe. Execution also depends on Design request/prepare/apply/settle
   and the separate Runtime admit/register/invoke/persist contract. They are explicit
   below; no domain dependency repair moves into generic Runtime.
2. **Premature tool-first guidance:** prefer a workflow only after its exact declared
   check, output, lifecycle and recovery paths are executable. Stage 2 now closes
   mechanical execution before Stage 3 changes delegation guidance and proves
   discovery/authoring against that verified route.
3. **Missing aggregate check handoff:** `read_design_checks` returns retained counts
   and records, with freshness validation. It has no registered verification verdict.
   `review_design` currently verifies one target subtree. Runtime iteration requires
   a registered `statusPath`/`progressPath`, values pass/repairable/decision-required,
   and a finite declared repair list; it cannot infer a dynamic checker or repair
   strategy from a list of stale records. Stage 2 must close this domain contract,
   not label the existing read tool as an aggregate checker.
4. **Completion states were conflated:** successful invocation, current mechanical
   results, primary-agent visual acceptance, saved recipe eligibility and durable
   document saving are separate. None implies the next; settle owns the visible
   outcome and captured document publication acknowledgement.
5. **Recovery lifetime was underspecified:** request-local evidence/leases may support
   retry in that request, not resurrection after reload. Saved recipe definitions and
   document checkpoints have different durable owners. Missing transient authority
   requires reacquisition; it must not trigger mutation replay or fake current passes.
6. **Activity wording could preserve stale work:** the current settle contract retires
   commentary with its root cohort. Do not extend completed-call text to fill idle
   time. Request-stage purpose must have an explicit authored identity/lifetime; any
   intended change to cohort retirement must update spec and Inspector before code.
7. **Evidence coverage was overstated:** independent node passes and ordinary test
   localization cannot prove a cross-owner workflow. New cases must explicitly prove
   required routes, success, partial completion, interruption and recovery on one
   captured source. No older test contract is retained merely to certify a replacement.

#### Execution-order review and direction constraints

Review result: preserve the direction and existing owners, but execute mechanical
closure before promoting tool-first delegation. Before Stage 1 code changes, align
the thin contract and affected Inspector routes for the complete sequence; this is
existing readiness work, not another implementation stage or new architecture.

The fixed direction is primary-agent intent/creative choices/recipe authorship and
visual judgment, with deterministic execution/checking/declared repairs delegated
to tools. Actual changed dependencies determine invalidation. One canonical registry,
invocation path and check store remain authoritative; superseded behavior is removed.

Stage 1 remains the first production change. Remove only superseded paths and update
all their current callers atomically within the owner slice; do not leave a broken
intermediate flow or delete useful shared capabilities. Independent post-run diagnostics
are separate current behavior, not a dormant drawing assessor to retain for compatibility.

Stage 2 proves the mechanical loop with an admitted fixture recipe and real host
consumers. Stage 3 then proves lookup/specification/submission/invocation and makes
all instruction layers prefer that working capability. Stage 4 verifies durable reuse
and complete visible/document settlement. Existing save, cancellation, event and
resource contracts are prerequisites in every stage, not deferred implementation.

Do not turn tool-first into recipe-first: known suitable workflows and single edits
execute directly; a missing composition is authored only when existing capabilities
cannot already perform it. No arbitrary camera/style choice, invented geometry repair,
extra reviewer model or exhaustive pre-drawing plan is introduced. Ready coherent parts
may render before later parts are designed. Mechanical checks do not impose additional
visual polish or force the primary agent to inspect each batch.

A checked scope is complete only for its declared current obligations; the whole task
still needs all applicable mechanical and visual obligations. No local pass promotes
whole-document success. Check results accumulate for their valid lifetime; revisiting
an unrelated region is not required. Both tool and primary-agent findings use the
existing dependency-aware store without silently downgrading previous obligations.

Stage exit requires its own behavior plus actual upstream/downstream consumers and
failure recovery. New lifecycle events carry identity/ordering from the first emitting
slice; Stage 4 tests presentation end to end rather than retrofitting provenance.
Same-request retry, cancellation and recovery cannot be postponed to final integration.
Recheck affected existing preservation cases at each boundary; reserve the full
integrated suite for the completed sequence, not every edit.

That planning review authorized no implementation and claimed no model-adoption or timing result; the later Stage 1 authority above supersedes its stop boundary.
The aggregate check's exact public schema, owner route and executable cases still require
formal admission before its production slice. Do not repeat whole-plan review as a
substitute for that bounded contract work, and do not claim admission already exists.

#### Stage connections and owner boundaries

| Stage | Producer -> owner -> consumer | Concrete exit condition |
| --- | --- | --- |
| 1 - Current-contract cleanup | Current product requirements -> Design inspect/compose; provider observation adapter -> current registry, caller, documentation and tests | Removed assessor/alias paths are unreachable; current component mappings and primary-agent review still work. Shared neutral evidence helpers remain only when a current consumer needs them. |
| 2 - Mechanical closure | Prepared artifact -> inspect admission -> apply receipt with actual mutation scope -> Design inspect -> Runtime invoke verdict or Design compose decision | Checks close the affected mechanical obligations, preserve unrelated passes and return usable recovery; no second AI or model-per-record coordination. Prove a known admitted repair through the existing Runtime before changing model guidance. Unsupported repairs return a decision without redoing initial writes. |
| 3 - Delegation contract and guidance | Request scope/purpose + registry inventory -> Design compose -> Runtime admit then register -> the verified Stage 2 invocation route | Native and saved discovery use the same current registry; invalid recipes never dispatch; exact schemas, instruction layers and examples lead to real direct/composed host execution. Deterministic provider fixtures prove integration, not actual model preference. |
| 4a - Reuse and storage | Runtime invoke receipt -> Runtime persist with Design host storage -> next request compose/admit/invoke | Save-only retry and fresh-request reuse work with new inputs; no transient IDs in saved definitions; unavailable dependencies never silently select an older revision. |
| 4b - Visible settlement | Request purpose + ordered tool events + inspect outcome + document publication -> Design settle; Runtime observe records -> panel and persisted document | Truthful current purpose, explicit unresolved/partial outcome, independently confirmed document durability, and exact reload. Recipe storage is not document durability. |

These are sequential plan stages, not five combined implementation edits. Each
owner change gets the existing Step Execution Card and allowlist. Stage 4a and 4b
are separate owner segments. Stage 2 itself progresses inspect contract, apply
receipt consumer, then invocation integration; do not patch all three at once.
Already-working accepted behavior is preserved and proven, not needlessly rewritten.

Use the actual Design routes `prepared-review-to-apply`, `apply-to-inspect`,
`inspect-to-compose`, `inspect-to-settle`, `apply-to-settle` and `settle-to-result`.
Runtime lifecycle is a separate admitted flow; Design's registered leaf adapter is
its cross-flow integration boundary. Keep the two existing targets distinct; the
supported target owner binds one flow, not an invented cross-flow target. Design
integration cases must invoke the real Runtime public APIs through the host and
prove their receipts/resources at the consumer. Runtime cases independently prove
its generic contract. Capture their required source closure consistently; the same
Git HEAD alone does not establish equal dirty runtime source. Do not combine two
unrelated passing reports into a whole-system pass. Neither `inspect-to-compose` nor
`apply-to-compose` implies a mandatory new model turn: deterministic declared
continuation stays within tools; a new design choice returns to the primary agent.
Update those predicates/cases to remove ambiguity before implementing continuation.

#### Stage 2 execution review - 2026-10-15

This reviewed design is authorized for Stage 2 implementation. Stage 1 remains
the prerequisite. Development target c49b050d-be3d-4279-888b-4c1558a2f6ce records
pending obligations, not completion or performance proof. Inspector cleanup is
a separate predecessor tooling slice.

**Fixed objective.** Close explicitly selected mechanical obligations through the
existing Design check owner and real Runtime finite iteration, preserve unrelated
passed evidence, and return actionable incomplete work without repeating prior
writes. Primary-agent visual judgments, creative choices and final document
settlement remain separate. Suitable direct operations do not require recipes.

**Review findings and resolved design.**

1. The proposed checker is not enough: the existing basic repair API can write
   prescribed values but cannot guard an entire verification result. Add one
   Design-owned `repair_design_checks` adapter in the existing apply route. Its
   input declares the complete acknowledged `checks`, the supported repair
   capability and explicit repair policy. It resolves findings from the canonical
   check owner, preflights all pending findings and live dependencies, then invokes
   existing App/Core mutation APIs. Runtime never selects domain repairs.
2. Existing records retain human-readable `evidence` and generic scope; neither
   diagnostic text nor ID prefixes are sufficient recheck instructions. Producers
   must attach typed owner-owned recheck descriptors to tool records: checker kind,
   canonical target/source identity, current dependency receipt and supported
   finding payload. Keep these within the existing request-owned check store and
   existing artifact lifetimes, not a second result store or a scene copy. Public
   compact results need not expose the internal payload. A producer without a
   complete supported descriptor yields decision-required, never a guessed scan.
3. Runtime always checks again after a repair. The previous instruction to omit an
   empty verification after all targets retire is incompatible with that loop.
   Preserve the nonempty selected logical obligations, including owner-confirmed
   terminal retirement records, through the final check. Keep terminal provenance
   and the last acknowledged revision in the existing store; do not infer retirement
   from an absent lookup. Recreated IDs advance revision and invalidate old receipts.
   The final checker can pass an all-retired selection explicitly; Runtime needs
   no special empty-state bypass. Retirement never approves dependent visual work.
4. Counts, fresh record revisions and unchanged source bounds alone cannot prove
   progress. Derive the stable token from normalized selected obligation identity,
   unresolved finding kind/arguments and applicability, excluding receipt versions,
   timestamps and observation counters. Exact revision admission and live dependency
   validation remain independent requirements. Repeated/cyclic unresolved work
   stops through Runtime's existing progress guard.
5. A generic tool-origin result is not automatically a repairable geometry result.
   Preparation, attachment/reference applicability, canvas measurements and image
   metrics keep their actual recheck owners. Dispatch supported deterministic reads
   through those owners; unavailable source, unsupported repairs and unknown write
   settlement remain exact decisions. Never call the primary model or an assessor
   from a mechanical checker or repair adapter. Primary-agent records cannot be
   silently selected as mechanical work or promoted by geometry success.
6. A check record becoming stale without changing revision is already possible.
   Capture canonical dependency receipts before asynchronous reads and validate
   again before recording results and before each write boundary. Serialize only
   the existing leaf mutation boundary; the coordinator cannot hold the host barrier
   while waiting for a child. Do not use the viewport or a global display revision
   as local currency. A file load changes the canonical session and invalidates
   request artifacts; pan/zoom alone does not change geometry dependencies.
7. The repair receipt, not the initial input or earlier check result, supplies the
   next iteration selection. Include every selected pass, pending record and terminal
   retirement. Preserve unrelated passes. A repair that creates new affected
   obligations must report that closure; the first supported repair cannot create
   objects, reparent, delete, alter shared styles or implicitly broaden its scope.
   Partial/unknown receipts are never successful successor bindings.
8. Mechanical pass is not task completion. After the loop, primary-agent visual
   fail/correct/pass still works, previously passed unaffected units accumulate,
   and settle independently confirms document publication/persistence. Recipe
   eligibility and library save success do not substitute for either condition.

**Exact first repair.** Use the already demonstrated container-overflow case with
an explicitly authorized parent-local position for existing children. The primary
agent supplies the prescribed values/policy; tools check coverage and apply them.
Do not automatically clamp positions, resize a parent, guess aesthetics, move an
unrelated child, or convert text overflow into the same repair. The adapter rejects
mixed unsupported findings before the first write. It verifies the child/parent,
current geometry, permitted fields and that all remaining findings fit this repair.
Overlapping selected roots must not duplicate the same physical mutation. Both
measurement and repair use actual canonical App operations, not fixture state.
Additional repair families are separate future capabilities, not a Stage 2 claim.
The current low-level review's `repairable` label is not aggregate repair admission:
only typed findings with this implemented capability may enter the new repair path.

**Public handoff.** `verify_design_checks` takes a closed nonempty unique selection
`{ requestId, checks: [{ checkId, revision }] }` resolved only in the current
invocation's request/document ownership. The producer returns the actual host
request identity with its acknowledged selection; the consumer compares it with
its invocation context before reading records. IDs/revisions alone are insufficient
because logical IDs can repeat in a fresh request. Unknown or conflicting identities, main-agent origins,
and expired cross-request artifacts reject without writes. Its completed value
contains required typed `verification.status` and nonempty string `progress`, the
same `requestId`, complete acknowledged `checks`, compact results, explicit terminal retirements,
and exact unresolved reason/capability data. The existing common outcome separately
carries success/partial/failed and settlement. Decision-required is a completed
check result, not an exception that erases independent findings. Runtime may stop
iteration, but the caller must still receive those retained findings/recovery through
its existing stopped-work output path. An unavailable or cancelled check cannot be
bound as a successful verification. Partial schemas must be registered and tested
through the native host and saved-composition consumer, not only TypeScript objects.
If independent checks have already advanced retained revisions before another check
fails, recovery returns their acknowledged selection plus the exact incomplete work.
A stale-input rejection may expose the current selection for an explicit new check;
it must not silently accept the stale input or make a partial value success-bindable.
Recovery never replays the recipe's initial writes.

Request identity, check IDs/revisions and the corresponding recipe state are
annotated with Runtime's existing `x-runtime-value: request`; canonical element IDs
keep their `document` lifetime. Do not label plain check IDs as leased artifacts.
Admission must reject captured request literals in saved recipes. Current producer
outputs explicitly expose the ready-to-bind `checks` projection from record `id`
fields, avoiding a model-side renaming/enumeration step. The exact same projection
is used by verification and repair, with no parallel selection authority.

The first repair policy is closed:
`{ capability: "set-prescribed-child-position", positions: [{ elementId, x, y, attachmentEvidence }] }`.
Input also carries `requestId` and complete `checks`. Positions must be unique and
cover exactly the pending eligible children under the parent identities recorded in
the admitted checks. A concurrent parent/basis change invalidates that authorization
and requires a fresh policy decision; do not reinterpret old coordinates under a
new parent. The owner validates against current App geometry constraints and the explicit policy, then
issues existing canonical edits; it does not infer coordinates from diagnostic text.
The checker declares this capability only when its typed findings support it; a
caller still must supply a matching authorized policy. Unsupported source/visual/text
findings cannot accidentally enter this branch.

`repair_design_checks` returns the existing mutation receipt and the complete current
selection for a subsequent verification. The adapter must not fabricate pass itself. Existing post-write mechanical work
may already produce current records; the next aggregate verifier must reuse those
same receipts instead of measuring them again.
All input admission and coverage checks finish before writes; later cancellation or
owner failure retains exactly acknowledged writes and existing Undo/compensation.
Unknown settlement goes to existing document recovery, never verification-as-repair.
A retry of checking is read-only; a write retry resumes only a proven unexecuted
suffix under the existing recovery contract. If that suffix cannot be established,
return a decision and do not rerun the recipe's initial steps.

**Execution order within Stage 2.**

| Slice | Owner and producer -> consumer | Required proof before advancing |
| --- | --- | --- |
| 2.1 Contract admission | Existing Design inspect/apply routes and Runtime invoke contract | Synchronize this schema/retirement/repair design into the product spec and exact Inspector cases; pin current source. Structural admission does not claim behavior. No new generic interpreter or second registry. |
| 2.2 Typed check provenance | Existing preparation/measurement/reference producers -> `design-check-results.ts` -> inspect | Current-only owner descriptors; exact retired versus unknown/recreated IDs; partial updates retain other passes; reads of old evidence are not implicit approvals. |
| 2.3 Aggregate verification | Existing `local-operation-tools.ts` inspection coordinator -> canonical check owner -> real host | Coalesce overlapping reads, reuse current measurements, chunk bounded work, validate before publishing, retain completed independent results on failure; complete typed native output matches Runtime verification input. |
| 2.4 Guarded known repair | Verification receipts + explicit policy -> Design apply -> actual App mutation APIs | Full pending-set guard before writes, no duplicate target edits, correct parent-local coordinates, acknowledged receipt selection, real Undo/Redo and save/reload; mixed or stale inputs cause no writes. |
| 2.5 Real Runtime closure | Actual admitted recipe -> registered checker/repair -> final caller -> primary judgment/settle | One real repair cycle, no progress/cycle/budget stops, lossless partial/cancel recovery and output ownership. Preserve Stage 1 primary visual and persistence behavior on the same source. |

Before each slice, read its current Inspector owner and write the existing Step
Execution Card. New identifiers must pass naming checks before propagation. A new
producer may be changed only with its direct consumer in the same bounded slice;
never publish a half-migrated descriptor. Superseded contracts are removed, not
kept as hidden compatibility branches. Stage 3 model guidance/discovery and Stage 4
library/presentation changes remain outside this implementation authorization.

**Integration acceptance, not just units.** Use the existing public host/registry,
real browser actions, canonical store, real Runtime and actual document backend;
script only the model boundary. The fixed cases cover:

- Direct edit -> mechanical result with deferred screenshot; primary-agent visual
  fail/correct/pass and accumulated passes remain intact.
- Saved recorded-101 scope with eight passed regions, one changed window region,
  supported local repair and retained seven passes; compare identical input work
  counts and dependencies, not total drawing node counts or model time.
- Actual admitted container repair -> current receipt -> second verification ->
  primary judgment -> document acknowledgement -> exact reload and peer convergence.
- Already-passed and all-retired selections; absent versus recreated targets;
  duplicate/mixed revisions, wrong origin/request, expired source/artifact and
  unsupported/mixed repair capability; no partial input admission or first write.
- Ancestor transform, shared-property change, regional membership and requirement
  changes invalidate their actual dependents. Pan/zoom does not; no blanket pass
  retention when there is a real broad dependency change.
- Concurrent edit, Undo/Redo, collaboration or cancellation while checking and
  between check and repair; independently completed work is retained, stale success
  and successor writes are blocked, and safe read recovery stays within pending scope.
- First repair failure, failure after acknowledged writes, unknown settlement,
  retention/cleanup failure and subsequent recovery. Preserve actual receipts and
  strict save admission; never replay initial creation or relabel an unknown write.
- Stable no-op and A/B/A progress, exhausted finite budget, incompatible saved tool
  dependency revision, and malformed/partial outputs. Return stopped-work details
  to the caller even when Runtime terminates the loop.
- Actual Factory batching, successful no-op History replay, compensation, exact
  retransmission, subsequent edit/save and reload remain valid. Reuse prior evidence
  only for identical source closure; do not combine unrelated green reports.

Instrumentation must assert zero extra model calls, measured owner work counts,
unique checked targets and no duplicate mutation/publication. Existing current-purpose
start/end attribution must remain truthful through real repair children and cancellation;
this is a regression obligation, not a new status architecture. Focused package tests,
lint/types and these integration cases close the stage. No live 101 is needed.

Self-review: the former empty-selection bypass, implicit repair-capability guard and
string-parsing recheck gaps are now resolved in the planned contract. Feasibility
rests on existing finite Runtime iteration, registry/invoke, check store and App
mutation/persistence owners. The public aggregate/repair adapters and typed provenance are implemented locally
under the admitted Stage 2 card. Completion remains pending final same-source
integration, types/lint and contract proof. Structural admission alone is not closure.

#### Exact decisions required by the corrected mechanical design

- Keep `read_design_checks` as a retained-results/freshness read; do not hide a repair
  loop or model call behind it. The existing Design inspection coordinator must
  own a bounded aggregate mechanical operation, exposed through the same registry
  with an explicit invocation contract. Its specification must declare selected
  check identities/current scope, a registered verification verdict and progress,
  and typed successful/partial/recovery output. Choose its public identity within
  the existing review owner before coding; no parallel check store or interpreter.
  This is a required contract change, not a claim that today's API already supports it.
- Resolve selected tool-origin obligations to canonical targets through their actual
  owners. Refresh changed dependency receipts and coalesce overlapping measurements;
  do not let the model parse diagnostic strings or enumerate every stale result.
  Missing/deleted/unknown targets remain distinct. Deleted targets retire only the
  appropriate obligation; they do not prove dependent visual criteria.
- Recheck affected obligations at the coherent invocation boundary. Standalone writes
  retain the current spec's before-return checks; ordered intermediate parts may
  coalesce only until that invocation ends. Do not postpone mandatory checks until
  final screenshots, or recheck the whole tree after every internal leaf.
- The aggregate operation does not manufacture generic repair logic. Its required
  output names the supported mechanical findings and current progress; an admitted
  recipe supplies the matching repair behavior and typed state. A defect class with
  no such repair remains decision-required. First acceptance covers a real known
  repair plus unsupported, mixed and no-progress cases, not an arbitrary drawing
  repair promise. Keep required user criteria independent from optional polish.
- Aggregate pass requires complete current supported mechanical coverage. Repairable
  names only owner-declared capabilities for all remaining findings; inspect cannot
  infer its calling recipe. Before repair writes, the Design repair owner guards the
  complete capability set and current finding receipts against that recipe's declared
  repairs. Mismatch stops without mutation; unsupported findings are decision-required. Runtime executes the declared
  finite repair list; it does not invent conditions, loops, tool choices or fixes.
- Capture dependency versions before asynchronous inspection and validate them before
  publishing results. A concurrent edit, Undo/Redo or collaboration change cannot
  promote stale work to pass. Preserve unaffected evidence; retry only bounded safe
  reads. Unknown scope remains unresolved and cannot be guessed from the viewport.
- Pan/zoom must not invalidate canonical geometry passes. Screen-dependent images
  still obey their own evidence identity; preserving a geometry pass cannot authorize
  reuse of an obsolete screenshot or reference applicability decision.

#### Stage 2 handoff review correction - 2026-10-15

Contract-only repair, no Stage 2 implementation: actual Runtime admission and execution
require a nonempty string progress token, not the previously specified count. Normalize
unresolved work independent of record revisions/receipt refresh and retain repeated-state
cycle detection. Diagnostic counts remain separate. The next round binds the complete
remaining selection and exact revisions from the last successful repair receipt
(check output supplies the repair input). A repair can advance check records as well
as geometry, so a pre-repair snapshot is insufficient. It never reuses the initial
version list or silently omits passed/retired obligations. Dependency validation
is still required because invalidation can leave the record revision unchanged.

Generic Runtime executes a finite repair list and cannot check semantic finding coverage.
The host checker declares capabilities; the Design repair owner must guard full coverage
and freshness before any write. This closes the previously unspecified caller-knowledge
assumption without adding dynamic Runtime routing. Stage 2 exit cases must exercise the
real Runtime contract, changed receipt versions, no-op/cyclic repairs, mismatched/mixed
capabilities, cancellation and partial results. Source/attachment review, canvas geometry
and pixel checks keep their distinct actual owners; an unavailable recheck remains a
decision with exact pending work rather than a fabricated pass. No aggregate runtime
acceptance is claimed by this documentation repair.

#### Failure recovery and final acceptance

- Admission/schema/revision failure: no writes; return exact issues and retrieve the
  current contract. Repair submission is not execution and not save eligibility.
- Check/read failure: preserve independently completed checks, mark the incomplete
  scope unresolved and retry only reads known not to have completed coherently.
- Partial writes or Stop: stop successors, preserve actual receipts/Undo and let
  settlement finish its owned cleanup. Recovery takes acknowledged identities and
  only the unexecuted suffix; a successful later read cannot reconcile unknown writes.
- Output retention failure after a completed write: return its truthful settlement;
  never feed partial output to success bindings or replay the write. If a valid
  recovery handle could not be retained, say so and use the existing authoritative
  document recovery boundary, not an invented receipt or increased capacity.
- Save failure: recipe save-only retry requires the real receipt while available;
  after request/process loss, only the durable library record proves availability.
  Document save recovery uses its publication journal/checkpoint independently.
  Request-local passes/handles are reacquired after load, not silently restored.
- Cleanup failure: attempt independent host/store cleanup without replacing the
  product outcome. Retain bounded diagnostic/recovery evidence; do not reopen
  finished invocations to hide leaks or turn unavailable persistence into success.
- User-visible completion: current required mechanical and visual evidence plus the
  appropriate durable-document outcome. Recipe-storage failure is reported separately
  and does not redraw or mislabel the canvas result. Partial/unavailable status must
  remain available when any required condition cannot be established.

Before production implementation, align the affected product spec, both Inspector
flows, exact test identities and incoming handoff cases. Use current supported
contract/target/work admission, pin the accepted contract and reviewed candidate,
and keep future obligations pending. Do not reuse old candidate IDs after this
rebase without current source assessment. No target is created or baseline accepted
by this plan-only review. The Stage 2 whole-target proof must bind one captured source
and include new behavior, prerequisites, integration and preservation; old merged
PRs or old test contracts cannot substitute for current prerequisite evidence.

Required integrated cases include: canonical direct edit; new recipe admission and
bounded repair; saved recipe with new inputs; eight visual passes followed by stale
mechanical closure; one-region versus real broad edits; partial group/reorder output
with no duplicate writes; cancellation and concurrent edit during check; library
save-only retry and reload with expired transient handles; document save failure,
recovery, Undo/Redo and fresh reload; concurrent purpose retirement and late events.
Use saved 101 evidence in formal cases, without replaying model calls. Maintain
existing ordinary failure localization for mapped cases and add owner-correct proof
coverage for required missing cases. No 101 or provider probe is run in this review.

Self-review result: the direction and stage dependency order are consistent after
these changes. Implementation readiness remains conditional on admitting the revised
aggregate inspection contract and its exact cross-owner proof cases; structural
admission of today's manifests is not a claim that the new design is already proven.

### Evidence and root-cause assessment

Source: saved run `tmp/ai-recording/runs/reusable-tools-1792056357036/analysis.md`
and its actual tool input/output evidence. First frame was 106.825 seconds; the run
stopped at 900 seconds. There were 79 top-level tool calls occupying 32.539 seconds
in union, and zero submit/invoke/save/manage library calls. The remaining time is
outside those tool intervals, not a measurement of pure model reasoning. Eight visual
criteria passed, but 19 stale mechanical obligations remained near termination.
Generic status occupied 697.256 seconds. No extra checking model was invoked.

The pre-Stage 1 source supported these conclusions (the two obsolete routes below are now removed):

- `ai-domain-prompt.ts` teaches patterns and recipes, but makes iteration optional
  and returns unresolved check coordination to the primary agent after stops.
- `local-ai-provider.ts` additionally encourages composing calls and computing
  intermediate inputs inside Code Mode. Ad hoc execution is available without a
  clear preference for admitted, reusable orchestration. These instruction layers
  must agree; changing one prompt paragraph is insufficient.
- `local-tool-library-tools.ts` exposes working submit/invoke/save controls. Existing
  acceptance proves availability, not that the primary agent delegates a real
  multi-step task or that its mechanical completion closes without per-check turns.
- `local-design-review.ts` still implements optional independent assessment, although
  the current production constructor does not enable it. Old tests maintain that
  mode. `ovalPathIds` remains an accepted parallel input to `componentMappings`.
- The trace proves lack of recipe use, not why the model privately chose each call.
  Broad visual invalidation in this run included actual edits across tiers and glass;
  it is not evidence that every broad invalidation was erroneous.

### Planning card and architecture alignment

Owner routes reviewed: all seven Design execution nodes in
`tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs`, plus Runtime
`admit/register/invoke/persist` in
`tools/flow-inspector/inspectors/reusable-tool-composition-flow-inspector.data.cjs`;
canonical recipe types/execution and the existing library controls. Current routes already
require one registry/invoke boundary, typed outcomes, exact dependency ownership,
no extra AI in mechanical checks and distinct mechanical/visual/storage outcomes.
The observe route still mentions isolated visual comparison evidence; removing
that obsolete provider route requires synchronizing its exact consumers, not
retaining it merely to satisfy a historical Inspector clause.

Planning inputs are current source, current contracts and saved execution evidence;
output is this bounded correction sequence. Only this plan is edited in this segment.
No readiness or successful source assessment is claimed for unimplemented changes.
Before each implementation slice, update the directly affected product clauses and
Inspector contract together, then write its execution card and formal cases.

### Ordered correction slices

#### 1. Remove superseded behavior; refactor still-required capabilities

This is the first implementation priority, before prompt optimization.

- Remove the independent-assessment option, acceptance branch, output fields and
  tests requiring a second visual assessor from the drawing review path. Remove the
  visual-assessment-only provider entry and its exclusive helpers/tests after tracing
  all current callers. Primary-agent visual judgments remain in the common check
  store; tools cannot award artistic approval.
- Remove `ovalPathIds` from schema, normalization, prompt, examples and consumers.
  Preserve oval conversion through the canonical `componentMappings` contract and
  actual analysis eligibility. Do not accept aliases or silently convert old inputs.
- Preserve current stale mechanical refresh and receipt cleanup in their existing owners;
  these are current behaviors, not obsolete capabilities to delete. Any further
  mechanical-loop correction belongs to Stage 2, not this cleanup.
- Keep explicitly requested execution-report assessment separate: the current CLI
  calls `requestLocalAiAssessment` for post-run diagnostics. It is a different
  supported operation, not permission for a drawing/checking route to call AI.
  Prove it cannot be reached by mechanical preflight or iteration.
- Audit only the affected routes and their direct callers for duplicate input/output
  formats and bypasses. Synchronize schemas, tests, docs and Inspector; do not keep
  dead branches, flags or old-format tests as compatibility. Preserve original saved
  evidence without rewriting historical records.

Gate: current canonical oval behavior passes; obsolete input is rejected before
mutation; independent assessor route is absent; ordinary mechanical and primary-agent
review behavior survives, with zero provider calls from check/iteration execution.

#### 2. Close deterministic work inside existing owners

The invocation coordinator passes typed data to existing prepare/apply/inspect owners;
Runtime remains domain-neutral. Inputs include actual target handles, current dependency
receipts and declared check/repair bindings. Never infer target identity from arbitrary
field names or feed an entire scene to compensate for missing scope.

Implement the aggregate inspection contract and its verification adapter described
in the latest review before binding it into Runtime iteration. A retained-results
read alone is not that contract.

The inspection owner resolves pending/stale mechanical obligations by their actual
changed dependencies, batches bounded reads and retains unaffected passes. Rechecking
and allowed repairs may iterate without another AI request. Stable failure, unsupported
geometry, missing evidence, no progress, cancellation, exhausted budget or unknown
mutation settlement returns an explicit unresolved outcome, not success. Nonplanar
creative geometry is not automatically repaired by inventing a different shape.

The returned existing typed outcome must distinguish completed writes, failed or
unexecuted steps, current mechanical findings, retained visual passes/stale visual
criteria, recovery handles and storage status. Mechanically complete is not visually
accepted. The primary agent receives current rendered evidence and only unresolved
visual/design decisions; its corrections re-enter the same dependency-aware flow.
A successful visual judgment must not silently imply mechanical completion.

Resource lifetime follows actual consumers. Transfer exported handles before releasing
intermediates; preserve borrowed/sibling pins. If delivery fails after acknowledged
writes, retain the receipt and retry delivery/cleanup where supported, never replay
writes. Do not increase retention limits or add a separate progress/check store.

Use an explicitly authored formal fixture recipe to verify a known repair through
the existing admission/invocation path; no live model is needed to establish this
prerequisite. This fixture cannot be used as proof that the primary model chooses
the recipe. Do not change model-facing delegation instructions in this stage.

Gate: replay the saved eight-visual-passes/stale-mechanical sequence with canonical
current input/output. Prove closure or an actionable decision without per-check model
calls. Separately prove one-region edits preserve unrelated passes, broad real edits
invalidate their real dependencies, and pan/zoom does not invalidate semantic passes.
Exercise capacity pressure after successful grouping without repeating the mutations.

#### 3. Make tool-first delegation consistent and executable

Status: locally complete after full review on 2026-10-16. The source contract,
current integration and applicable quality checks pass. The user explicitly retains
the earlier unreproduced navigation interruption as a known unresolved, non-blocking
item. No model-selection or latency improvement is claimed.

**Outcome and bounded scope.** Give the primary agent one consistent way to select
and use current capabilities, including Stage 2 mechanical closure, across actual
assembled provider instructions, compact discovery, exact schemas and executable
examples. Keep the existing registry, native dispatcher, Runtime interpreter,
request check store and library. Tool-first does not mean recipe-first. Do not
create a master planner, dispatcher, compatibility alias layer, new tool grammar,
second catalog, generic repair engine, hidden model call or broader safety limits.

Primary AI owns intent, scope, creative choices, parameters, explicit repair policy,
recipe authorship and visual judgment. Runtime owns admission and finite execution;
Design owners supply canonical checks/repairs; the existing document and library
owners settle their distinct durability obligations. A primary-agent turn is needed
for a new decision, not between mechanically determined iteration steps.

##### Current review authority - 2026-10-16

The user requests a complete Stage 3 implementation/direct-consumer review and
bounded navigation-cause investigation. Preserve the original failed run as a known
unresolved item without blocking this stage solely on that unreproduced event. This
supersedes prior checkpoint instructions to block completion on that specific failure;
it does not waive product assertions or any other completion criterion. Use the same
seven review categories, current compose/inspect/settle contracts and existing tests.
No new architecture, Stage 4, live model/101, push or monitoring. Reuse unchanged
source evidence, verify its currentness, and fix only a proven in-scope defect.

##### Step Execution Card - Stage 3 compose admission and guidance

- Owner: `compose`; routes `request-to-compose`, `compose-to-prepare`,
  `compose-to-apply`, `inspect-to-compose`, `apply-to-compose`.
- Spec: `ai-execution-flow.md` capability discovery/composition and tool-first
  correction. Inspector: current compose inputs/outputs/conditions/bypasses,
  contributors, boundary and failure owner; inspect/settle remain consumers.
- Inputs: current request, canonical capability contracts, actual inspection and
  execution receipts. Output: a tool program using exact registered routes and
  fresh selection/policy values. Direct known work bypasses recipe creation.
- Allowed: domain guidance, native provider protocol, registered schemas. Forbidden:
  model review inside tools, second interpreter/catalog, guessed identities,
  saved request literals, replay of unknown writes or new compatibility paths.
- Files: existing compose-owned ai-domain-prompt.ts, local-ai-provider.ts,
  local-operation-tools.ts, local-tool-library-tools.ts and their formal tests;
  execution-flow-proof.test.ts; spec, corresponding Inspector/manifest and
  TOOL_SPECIFICATION.md. Browser inspection integration is preservation evidence.
- Cases: actual assembled instructions, known/direct route, exact lookup recovery,
  canonical proposal admission/correction/reuse, fresh mechanical selection through
  finite iteration, unsupported/partial/unknown/cancel and save-only recovery.
- Gates: test-first missing guidance; real host/Runtime integration; existing real
  browser inspection/history/save integration; focused server tests, production
  types, lint/naming, same-source Inspector candidate/assessment. No live provider.
- Review: spec/architecture, valid use, boundaries/invalid input, concurrency,
  lifecycle/recovery, downstream preservation, and work/over-design. Discovery is
  frozen to these files, direct consumers and existing test cases.
- Stop: wider owner change, unknown contract, new model or legacy path; Stage 4,
  101, remote operations and monitoring remain excluded.

Admission on 2026-10-16: candidate `2213574f-50a1-4c92-9e8f-21b0b7e1ab52`
retains the 34 predecessor obligations and adds `compose.tool-first-handoff`.
Review `2588633a94afb0c185ed7643180223ba1f023186b1b58fc1bca49f6dff0f5dc7`
has no contract blockers. Development target `171841c6-6153-45a0-af6b-a320d7727c9e`
retains all 35 obligations pending; it does not accept the red candidate as complete.
The new case first exposed absent mechanical-selection guidance. Its initial harness
also omitted registered capabilities; this was corrected to use the real registry,
then canonical repair grammar (nonempty repairs) without changing production admission.
Stage 3-only goal was set after admission. Provider assembly regression independently
failed on missing Stage 2 guidance before the production instruction change.

Bounded verification re-review: the new source-proof harness had three incorrect
assumptions (empty native registration, empty iteration repairs, and object-shaped
execution issues). Inspect the current host definitions, canonical grammar and
execution receipt before correcting the harness. Keep admission strict and the
unsupported-decision no-write oracle. Production algorithms are unchanged. Verify
the corrected case in isolation before repeating captured-source proof.

The first browser run had a navigation interruption in the pre-existing public
handoff case; the other 11 applicable cases passed. Warm targeted replay passed,
which alone does not explain the first failure. Retain both reports; reproduce with
Vite dependency diagnostics and tracing against a fresh project-local dev cache.
Do not add retry around mutations or change product lifecycle to hide navigation.

##### Stage 3 local verification checkpoint - 2026-10-16

- Actual provider assembly, canonical operation descriptions and Runtime tool
  specification now agree on direct/reused/new recipes and current mechanical
  selections. No new planner, registry, interpreter, cache or production algorithm.
- Formal provider handoff exercises exact discovery, rejected admission with zero
  product calls, corrected submission, execution, storage, fresh-request reuse and
  scoped full-schema recovery. Unsupported mechanical findings stop the real
  Runtime before prescribed repair; they never trigger another model.
- Nine server integration files passed 486 tests, with three existing opt-in skips.
  The current source proof passes all 35 obligations including the 34 predecessors.
  Production types pass; final lint has zero errors and four existing no-console
  warnings. Naming passes 15 tests; generated catalog contract passes eight tests.
- The original browser run passed 11 and skipped two, but failed the public handoff
  case at page.evaluate with destroyed execution context. Warm and fresh-cache
  focused runs each passed. A frozen full-suite replay with the original cache and
  Vite dependency/HMR logs plus Playwright traces passed 12, with two original skips.
  It covers local/peer edits, independent pass retention, actual Runtime repair,
  changed basis, no progress, post-write cancellation/interruption, Undo/Redo and
  acknowledged persistence/reload. These later passes do not erase the first failure.
- Initial local tracing was on-first-retry, and that run did not retry. Consequently
  it retained no failing navigation trace. Dependency re-optimization, source-edit HMR
  and product navigation remain hypotheses, not established causes. No retry around
  mutations, longer timeout or product fallback was added. Do not infer the cause is fixed from later successful replays. The later explicit
  user decision permits Stage 3 closure with this known item. Future investigation
  must retain the failing navigation/network/HMR event rather than repeat broad
  suites without new evidence.
- Fixed review categories were applied to current producers/consumers, not just new
  tests: valid/invalid use, exact identities/lifetimes, canonical invariants,
  cancellation/partial/unknown/save-only recovery, architecture/ownership,
  repeated-work/resource boundaries, and source-bound verification. Existing
  current-purpose causality and document/Factory algorithms were not changed.
- Final formatted-source candidate `5d085e80-a7e8-4fb0-a5cb-6cb2f68527c4`
  passes all 35 obligations. Source digest:
  `21ef806ef3be49091639906d65ff039445d56ad10cadf1cbee2c456b50ab4434`.
  Target `464efc48-fe8d-4e09-9513-c27f5238b441`, allocation 1, assessment
  `354271e0-644f-4fba-b890-e652c016cb41` is current and eligible with passed
  integration. This verifies the current source contract; it does not waive the
  known unresolved browser event. Stage completion also requires the complete
  review below and the user-authorized non-blocking treatment of that event.
- Evidence: tmp/stage3/{server-integration,browser-integration,browser-navigation,
  browser-cold-navigation,browser-frozen-replay,types,lint-final,naming-final,
  catalog-contract}.log. Earlier failed fixture/oracle iterations remain failed;
  corrected canonical grammar and string-shaped execution issues are now exercised.
  Scripted external-provider tests prove wiring, not model preference or speed.

##### Bounded diagnostic iteration - browser evidence retention

The original navigation failure remains unexplained. Five repeats of the exact
public handoff case with dependency/HMR logs and tracing pass (45.3 seconds), without
reload messages. This narrows reproduction but does not clear the failed run.

The existing test harness configures on-first-retry tracing while ordinary local
policy has zero retries. Correct only the formal ai-inspection-evidence.spec.ts
suite's evidence retention to retain-on-failure. This changes diagnostics, not
product/Inspector semantics, retry count, timeouts, assertions or failure handling;
do not add it as a product capability merely to authorize a test setting. Verify
with focused suite lint and the existing handoff integration test, then preserve
future failures' traces. No change to shared Playwright policy or other suites.
The corrected suite passed the existing public handoff integration case in 17.9
seconds without a CLI trace override; focused ESLint passed. Test-owned ports
3300/3401/4401 are closed. The production source and all assertions are unchanged.
The concurrent source proof also passed all 35 obligations with unchanged source
digest 21ef806ef3be49091639906d65ff039445d56ad10cadf1cbee2c456b50ab4434;
that proof preceded this diagnostic-only suite option and is not evidence of a
reproduced navigation cause. Logs: tmp/stage3/browser-navigation-repeated.log,
browser-retained-trace.log, browser-trace-lint.log, navigation-concurrent-proof.log.

Missing original trace cannot be reconstructed by this correction. The user subsequently authorized preserving the original event as non-blocking;
do not infer its cause or a repair from repeated passes alone.

##### Final Stage 3 review - 2026-10-16

Scope remained the admitted compose guidance, its canonical descriptors, real
provider/host/Runtime consumers and Stage 1/2 browser handoffs. No new production
correction was required in this review.

- **Behavior and route selection:** actual provider assembly preserves known direct
  calls and ready construction; exact lookup, basic batch wrappers, eligible saved
  recipes and corrected new submissions use their advertised owners. Model choice
  is not guaranteed by these deterministic tests.
- **Contract and invariant review:** current native selection, revision, verification
  paths, fresh policy and output state match the canonical schemas and interpreter.
  Admission rejects unsupported graphs before calls; request identities are not
  saved as reusable literals. Retired obligations retain provenance rather than
  disappearing to manufacture a pass.
- **Failure/recovery:** existing integrated cases cover stale basis, unavailable
  measurements, unsupported decisions, no progress, cancellation, partial/unknown
  writes, safe suffix continuation and genuine save-only retry. Unknown writes stay
  terminal despite later passing geometry. Save-only retry asserts one product call.
- **Stage 1/2 preservation:** real browser cases verify mechanical checks despite
  deferred capture, delivered image evidence before primary visual decisions,
  retained independent passes, exact affected IDs/revisions, peer edits, Undo/Redo,
  persistence acknowledgement and matching reload. Scripted provider re-entry is
  asserted once; finite mechanical repair invokes no additional model.
- **Architecture/work/resource review:** one registry/interpreter/owner chain remains.
  No UI state machine, Factory/persistence algorithm, cache, compatibility route,
  model configuration or runtime budget changed. Existing ownership/cancellation
  tests preserve cleanup and unrelated calls; test-owned ports are closed.
- **Evidence/currentness:** all 807 files in the passing captured source exactly
  match the current checkout (tmp/stage3/review-source-comparison.json). Assessment
  354271e0-644f-4fba-b890-e652c016cb41 was re-read through the actual service and is
  still current/eligible. Server 486 passed / three original opt-in skips; current
  source proof 35 passed; full browser 12 passed / two original opt-in skips.
  Production types, naming 15, catalog 8 and focused lint passed (four existing
  no-console warnings). The only later E2E change is trace retention, verified by
  its own lint and actual handoff case; assertions are unchanged. Failed earlier
  reports remain failed. No reason was found to rerun unchanged broad gates.

Navigation investigation distinguishes the observed symptom from its trigger:
Playwright reported destruction of the page.evaluate execution context; the stack
alone does not prove which navigation mechanism caused it. Current App reload
owners are explicit reset or recovery-button callbacks, not automatic mechanical
check/recipe completion. The failed case does not invoke those callbacks. The
installed Vite client can reload on a full-reload/update message or websocket
reconnection after a successful ping, but the first failed run lacks the required
browser/HMR trace to correlate either. No server-restart or optimizer-reload line
exists in the retained first log. Warm/cold/frozen and repeated reproductions pass;
these do not identify a trigger. The confirmed diagnostic defect was on-first-retry
tracing with zero ordinary retries; the formal suite now retains first-failure
traces. Do not label Vite, dependency optimization or product recovery as the proven
root cause. The original event remains known unresolved at the user's direction.

Stage 3 completion is limited to its implementation and verified contracts, with
that explicit known item. Stage 4, real-model adoption/latency, live 101 and remote
operations remain outside this completion claim.

##### Current-source review findings

1. The App prompt already describes recipe authoring, finite iteration and safe
   recovery. The gap is its concrete connection to the new Stage 2 selection and
   guarded repair contracts, not absence of an orchestration system. Audit the
   combined AI_APP_PROMPT, AI_OPERATION_INSTRUCTIONS, provider developerInstructions,
   tool result instructions and actual native definitions. Avoid contradictory
   routing or a description that sends every repair back to the model.
2. Discovery separates capability lookup from research, supports exact semantic
   operations/names, pagination and revision-scoped delivery. Preserve this owner.
   Query currently matches normalized words in registered names/descriptions;
   do not promise semantic search, add guessed aliases or rename callable identities
   as a substitute for useful purpose/limitation text and explicit category fallback.
3. Stage 2 supports exact mechanical selections and prescribed existing-child
   positions for supported container-overflow findings. It does not choose better
   colors, infer a new projection or redesign a building. Guidance must not advertise
   all findings as automatically repairable or treat all tool outputs as check handles.
4. A recipe dependency identity, native execution route and input wrapper are
   different fields. Admission and native conversion use the canonical schemas;
   examples must exercise those schemas and actual downstream calls. A menu or
   previously-returned definition reference alone does not prove complete binding
   information. Restore only missing contract coverage when necessary.
5. Execution, mechanical verification, primary-agent visual acceptance, document
   persistence and saved-tool eligibility are different results. The optional
   execution value lives under the exact selected invoke_tool result contract;
   callers cannot invent a generic output field or use partial/recovery data as a
   successful step result. Stage 4 expands proof; it does not defer these obligations.
6. TOOL_SPECIFICATION.md still describes some delivered integration as planned PR 2/3
   work. During Stage 3, update that current status and acquisition guidance at its
   existing owner. Preserve historical evidence only as history, not compatibility
   instructions or a second authoritative spec exposed to the model.

##### Exact producer-to-consumer handoffs

- **Intent to capability.** Reuse a known current contract. Otherwise use
  describe_design_apis operation/category/query menus, including available saved
  tools; request full definitions only for selected capabilities. Follow exact
  next.arguments while complete=false. Registry changes restart the affected lookup,
  not document work. Zero matches, ambiguous names and unavailable storage remain
  distinct; preserve unique matches. Research is not catalog search. Vocabulary
  improvements belong in canonical descriptions, not a parallel index.
- **Capability to route.** Suitable domain workflows (including ready-part
  prepare_and_apply_design), eligible saved compositions and single-step direct
  calls remain valid. Basic batch-action routes keep their prescribed wrapper;
  native review/capture remains outside execute_design_batch. The actual registered
  composition eligibility and registeredName/revision govern recipe dependencies;
  native namespace exposure is not proof of eligibility. Never block a ready first
  part while authoring a whole-document recipe or collecting all details.
  Prefer matching existing backend patterns/projection, retained regional queries and
  aggregate mapping tools over model-expanded vertices, full child inventories or
  repeated per-object calls. Preserve their real supported schemas and scope.
- **Missing combination to authoring.** Only when existing capabilities cannot
  express the required deterministic multi-step work, obtain the exact dependency
  input/output/verification contracts plus submit_tool's canonical Runtime proposal
  schema. Author typed fresh inputs, bindings, finite steps and optional iteration.
  submit_tool receives submissionId/proposal and expectedRevision when applicable.
  Identical submission retries remain idempotent; a corrected proposal uses a new
  submissionId. Failure issues must be carried to the next correction. Submission
  executes zero product operations and returns a private candidate, not a saved pass.
- **Stage 1/2 to mechanical closure.** Pass the actual review_design
  mechanicalSelection (`requestId`, exact `checkId`/`revision` pairs) as fresh
  request input. verify_design_checks returns current checks plus
  verification.status/progress. Use the registered verification paths; never parse
  diagnostic wording. The repair policy contains supported capability and explicit
  positions with original parent/workspace attachment evidence from the canonical
  producer. No literal request IDs/handles in saved recipes, guessed revisions,
  selected-target ID substitution or automatic coordinate-basis rebasing.
- **Iteration state to next check.** Bind initial writes outside iteration. Carry
  the current selection returned by check/repair into subsequent state; never reuse
  an older selection or discard already passed independent obligations. Owner-confirmed
  retired checks remain selected terminal records with provenance; absence is not a
  pass and callers must not drop all obligations to manufacture completion. Runtime
  checks again after repair. Unknown, partial, unsupported, stalled or exhausted
  results stop declared automatic work; no branch adds creative inference. Actual
  dependency changes reopen only affected obligations. Pan/zoom and presentation
  do not change semantic evidence; primary visual stamps keep their own dependencies.
- **Invocation to decision.** invoke_tool consumes exact name/revision/fresh input
  and optional current purpose. Interpret execution.status AND settlement, actual
  calls, typed value/recovery and storage independently. Mechanical pass ends only
  this declared mechanical task. It cannot grant primary visual acceptance, approve
  unavailable imagery or prove document/backend or library persistence.
- **Evidence to primary review.** Preserve Stage 1 deferred-capture behavior: all
  required mechanical checks still run. Capture at an actual visual decision
  boundary, deliver the image, then let the primary agent record observed criterion/
  unit results through review_drawing. Accumulate independent passes and return only
  unresolved affected work. Final visual review is not replaced by a tool pass or
  by a preset limit on primary-agent iterations. No independent reviewer model.
- **Purpose and terminal consumers.** Preserve current request/call/parent identity
  and authored purpose through invocation, queued leaves and settlement. Generic
  tool descriptions remain system activity; no new prompt may claim active drawing
  during preparation or revive a completed invocation. Existing status filtering and
  causal ownership stay unchanged; any direct regression returns to its current
  owner. Successful drawing remains separate from persistence confirmation.

Code Mode remains a valid invocation/data-binding surface for current schemas and
retained handles. It is not a second recurring orchestrator or an excuse to send
every intermediate result back for model coordination. Runtime owns admitted finite
iteration; product tools own deterministic bulk work. Do not add AI-supplied JS
callbacks, convert existing schema-bound operations into arbitrary code execution,
or prohibit useful direct calls merely because they do not need a recipe.

##### Recovery behavior that must remain executable

- Missing fields/context: recover exact schema coverage using the existing refresh
  contract; do not re-fetch every definition or redraw products.
- Admission rejection: retain field/step diagnostics, correct the proposal and admit
  again with zero mutation calls. A missing primitive or unsupported repair returns
  the specific decision/capability gap to the primary agent, not an invented route.
- Changed revision, expired artifact, foreign request, changed parent/workspace,
  permission/lock or stale dependency: reject before writes when known; acquire
  fresh evidence and an explicitly renewed policy when its basis changed. Do not
  silently adopt a newer policy or invalidate unrelated passes.
- Partial read: keep known findings/independent passes and retry only the affected
  read. Partial execution: retain acknowledged work and the exact recovery receipt;
  compose only an explicitly safe remaining suffix. An unknown mutation scope must
  be resolved through the document recovery boundary before any further writes.
  A later green check does not resolve uncertain delivery.
- Cancellation, no progress and iteration exhaustion: stop descendants, keep actual
  receipts and normal history/compensation semantics. No automatic reinvocation of
  initial creation. A newer request/reload cannot reuse old request checks or pins;
  obtain fresh evidence and use the existing persistence reconciliation first.
- Library unavailable/suspended/stale: do not invoke the unavailable saved revision.
  Native capabilities remain discoverable; any alternative executes only with a
  valid current contract. Successful execution with unsaved library metadata uses
  save_tool and the genuine receiptId for storage-only retry. manage_tool resume
  restores availability, never an execution cursor. Do not report the whole drawing
  as failed merely because optional library saving failed, or as durable when the
  document owner has not acknowledged persistence.

##### Authorized implementation order

1. **Admission, then goal.** Re-read the current Design compose step and routes
   request-to-compose, compose-to-prepare/apply, inspect-to-compose and apply-to-compose;
   review their direct inspect/settle consumers and Runtime admit/register/invoke/persist.
   Add the exact Stage 3 product cases and any missing contract wording through the
   existing Inspector paths. Preserve all Stage 1/2 obligations on the same source.
   Complete admission and set a Stage 3-only goal before production implementation. Existing Stage 2 assessment is predecessor evidence,
   not admission of new Stage 3 semantics.
2. **Canonical descriptions and examples.** In the existing compose owner, reconcile
   discovery descriptions, exact execution routes, recipe acquisition and the concrete
   Stage 2 check/repair example. Reuse canonical schemas and verification metadata;
   no hard-coded copied definitions. Existing selected contracts remain retrievable.
3. **Assembled provider guidance.** Align App/base/developer instructions and result
   continuation guidance with those real routes. Remove superseded duplicate advice
   instead of layering exceptions. Use a few executable decision examples: ready
   construction, a direct edit, eligible reuse, missing deterministic combination,
   supported mechanical closure, and a creative decision that must return to AI.
4. **Whole handoff proof and closure.** Exercise the real host/registry/admission/
   dispatcher/Runtime/check owners together, and the existing browser/history/save
   consumers. Review all seven fixed categories, correct direct regressions test-first
   and re-run affected gates. Stop at Stage 3 completion; no automatic Stage 4, push,
   monitoring or 101. The current authorization covers Stage 3 only.

Authorized mutation scope: existing Design compose-owned prompt,
provider, operation/library descriptors and their formal tests; current App spec,
Runtime tool specification's acquisition/status text and corresponding Inspector
contracts/catalog. Read Stage 1/2 check/apply and persistence owners as direct
consumers. Do not rewrite their algorithms, Runtime interpreter, schema grammar,
scene tree, rendering, history, backend persistence, storage format or UI state
machine merely to improve guidance. A reproduced blocking owner defect needs a
bounded replan; a new architectural scope requires user direction.

##### Permanent cases and completion criteria

Use current formal files, not disposable scripts or a new audit ledger. Strengthen
local-ai-provider.test.ts, ai-domain-prompt.test.ts, local-operation-tools.test.ts,
local-tool-library-tools.test.ts, local-tool-operation-composition.test.ts and
execution-flow-proof.test.ts where their real owner applies. Extend the existing
ai-inspection-evidence.spec.ts host/browser integration rather than substituting
successful fake tool replies for canonical checks or durable mutation results.

- Prove assembled thread/start instructions and native definitions agree, then drive
  deterministic external-provider protocol input through the real advertised host.
  Direct ready parts must not call submit_tool or wait for a whole-building plan.
  Valid known calls must not require a catalog round trip.
- Prove exact lookup and missing-schema recovery; ambiguous/zero results, changed
  pagination revision and restored context must not select a similar guessed tool.
  Exercise both basic batch wrappers and native/composed invocation wrappers.
- Discover a suitable eligible tool and invoke it with fresh arguments. Separately
  discover primitives, submit an invalid proposal (zero writes), correct/admit it and
  invoke the returned exact candidate. Candidate registration cannot self-certify
  saved eligibility. Control-plane operations cannot become recipe dependencies.
- Connect native mechanicalSelection to real Runtime check/repair/next-state/check.
  Assert exact measured target IDs, unchanged independent pass revisions, initial
  write count and zero provider re-entry inside deterministic closure. Unsupported
  findings must return a decision with zero fabricated repair operations.
- Reuse the real Stage 1/2 browser case: local and peer edits, changed attachment
  basis, Undo/Redo, known prewrite rejection, acknowledged partial results, unknown
  settlement, cancellation and fresh document reload. Verify affected scope and
  retained passes at each boundary, not only a final green response.
- Exercise safe suffix continuation and genuine save-only retry with no duplicate
  drawing; preserve canonical host rejection of foreign/stale receipts. Request
  reopen obtains fresh request evidence and cannot resume old execution state.
- Deliver actual captured image evidence before scripted primary-review decisions;
  deferred capture must still execute mechanical checks, and tool success must not
  satisfy visual or document-durability completion. Scripted decisions test wiring,
  not model judgment quality. Preserve concurrent purpose/settlement assertions.

Run applicable server/Runtime contract tests, affected real browser integration,
production typechecks, lint, naming and current-source Inspector proofs. Retain
unchanged predecessor evidence only after source/contract verification. Record tool
calls, reads, touched targets, accumulated revisions, writes and provider re-entry;
node count is not an effectiveness metric. Model behavior and wall-clock improvement
require separately authorized real-provider evidence; neither prompt text assertions
nor scripted protocol tests can guarantee the model chooses the advertised path.

**Self-review result.** The proposed handoffs now have explicit producers, consumers,
failure owners and restart behavior. No new model, orchestration layer, compatibility
route or generic creative repair is needed. Stage 1/2 completion remains intact and
Stage 4 is not used to defer correctness. Admission and local implementation now
exist, with formal case and browser results below. The later full review closes Stage 3 with the user-authorized known navigation
item; no universal failure coverage or guaranteed latency is claimed. A second review added
owner-confirmed retirement and terminal unknown-scope handling explicitly; neither
empty selections nor a newer check may bypass those boundaries.

#### 4. Preserve purpose, save eligibility and cross-request reuse

**Planning review baseline - 2026-10-16.** Stage 3 was pushed as
b1c8f9ac8bbc4cc7380aee677b27629136de1514 after integration with main
eac2b0d8e719ee9055c846a24a033020c4b1c3cd. This section is a reviewed execution
plan, not runtime completion evidence. The subsequent user authorizes Stage 4
admission and implementation; model calls, live 101, push and monitoring remain excluded.

**Objective and frozen scope.** Complete the existing invocation-to-purpose and
execution-to-durable-library handoffs while preserving Stages 1/2/3. Use the one
Runtime registry, interpreter, persistence owner, Design request coordinator and
activity state machine. Do not replace them or add another task orchestrator,
status generator, durable execution checkpoint, retry daemon or compatibility route.
Read-only discovery is limited to the owners below, their current public contracts,
direct consumers and permanent tests. Implementation may correct confirmed failures
within these owners after admission and a failing integration oracle. Unrelated
Factory, rendering or persistence redesign is not part of this stage.

##### Existing behavior and planning gaps

Current source already provides automatic save after completed composition, genuine
request-local save receipts, SQLite expected-version writes, dependency reload,
suspend/remove checks and scoped invocation activity. Retain
working behavior; an absent combined test does not establish a production defect.

The earlier Stage 4 paragraph did not specify receipt expiry across request disposal,
candidate versus eligible durability, independent document acknowledgement, nested
save dependencies, publication races or end-to-end activity ordering. It also did not
require one real durable-store/host/browser path. These are now explicit below.
Host-level in-memory-store tests, separate SQLite adapter tests and routed management
UI fixtures remain useful but do not together prove that complete path.

##### 4A. Preserve actual work purpose through the real event path

Owner: Design `settle`, with `compose` supplying Runtime invocation identity and
`observe` retaining evidence. Read `local-ai-provider.ts`, `local-tool-host.ts`,
`local-tool-library-tools.ts`, `server-action-batch-provider.ts`, `conversation.ts`,
`activity-state.ts`, `presentation.ts` and the conversation panel together. Runtime
`invocation.ts`/`recipe-execution.ts` own call identity, parent, pinned revision and
step provenance; Design translates those events, not a second lifecycle authority.

- Input is the actual request/attempt, ordered event sequence, call/parent identity,
  authored purpose identity/scope/revision and observed phase. Output is the existing
  incremental activity projection and diagnostic disposition consumed by the panel.
  Preserve current wire fields; any necessary semantic change must first update the
  existing spec and matching Inspector boundary, not introduce an alternate envelope.
- Distinguish original objective, authored stage intent, active call purpose and
  observed operation. Inherit purpose through live ancestry; never copy inherited
  prose as newly authored work. Native calls, nested recipes and native research
  close only their invocation ownership. They cannot infer completion of request
  stage context; new commentary, retry, saving or terminal settlement retires it.
- Deliver every start/end, including admission failure, cancellation and child
  failure, before visible deduplication. Parent completion closes only its dependent
  children. Late/duplicate starts cannot reopen closed calls; an old call or attempt
  cannot clear newer commentary or another independent active call.
- Known work retains concrete context during input preparation and queueing, but
  its phase cannot claim drawing before execution. After leaf completion, remove its
  execution claim. With no active calls, retain authored stage prose as Current
  task context, never as an execution label.
  Without authored context, show an observed phase; do not fabricate work or retain
  stale text to hide missing information. Language selection remains unchanged.
- Keep lifecycle transitions and observed phases in diagnostics even when text does
  not change. Do not add timers/debounce that conceal events. Stop, question,
  approval, document saving and terminal conversation outcomes take precedence.
  Tool-library saving is not document-saving acknowledgement or visual acceptance.
- Review pre-inference library load, coordinator-only work, nested invocation,
  save-only recovery and cleanup intervals explicitly. No completed child may remain
  visually active during them; missing current operation evidence is a producer
  handoff issue, not a reason to invent a purpose in the panel.

Proof: scripted external provider events must pass through the real provider adapter,
Runtime/host, production transport decoder, conversation projection and panel. Extend
existing provider/presentation/conversation/browser tests with controlled ordering:
serial children; parallel siblings with different purposes; nested coordinators;
research overlapping an App tool; rejected admission; cancellation before and after
acknowledged work; new commentary while older calls settle; retry and late events;
no authored context; library save wait and final document-save wait. Assert lifecycle,
selected purpose identity, phase and current DOM at each boundary, not just final text.
No extra model call may author, classify or validate a status.

##### 4B. Separate execution, eligibility and durable acknowledgement

Owners: Design `compose` (`local-tool-library.ts`, native library controls,
`local-tool-host.ts`, `local-tool-store.ts`) and Runtime `persist` (`tool-store.ts`,
`tool-library.ts`, registry). Existing `LocalToolInvocationResult` is authoritative:
`execution.status/settlement/value/recovery` is distinct from optional `storage`
and `receiptId`. Native wrappers must preserve that distinction on all paths.

- Admission may save candidate metadata without product execution. Candidate saving
  does not certify usability. Candidate resume restores private availability only;
  it does not restore an execution cursor, old check results or transient handles.
- Only a genuine success/completed receipt for the exact admitted recipe and request,
  valid declared output and current eligible dependencies may support promotion.
  The host's current applicability scope explicitly certifies canonical admission,
  outcomes, schemas and artifact handoff; it does not certify appearance, arbitrary
  inputs or satisfaction of the original drawing request. Do not add an AI reviewer.
- Keep Stage 1 mechanical/primary-visual completion and Stage 2 retained check
  revisions unchanged. A mechanically successful reusable tool can be eligible even
  while the broader drawing still requires primary visual review. Conversely, a
  green visual review cannot make failed/partial/unknown recipe execution eligible.
- Successful product work followed by an unsaved tool record preserves the exact
  execution result and genuine receipt. `save_tool(name, revision, receiptId)` retries
  only persistence; no leaf execution, drawing, Undo entry or re-verification of
  unaffected canvas checks. Capacity is reserved before starting work; backpressure
  must not evict another invocation's unresolved save receipt or raise the limit.
- Receipt ownership ends with request disposal. A fresh request rejects expired,
  foreign, mismatched or fabricated receipts. If eligible bytes were acknowledged,
  reload them; if only a candidate was saved, expose only explicit candidate resume;
  if no definition was saved, report it unavailable. Do not recreate success evidence
  from logs or automatically redraw to obtain another receipt. Durable execution
  resumption is excluded, not silently promised by the word recovery.
- Nested compositions require durably eligible dependencies before parent promotion.
  The invocation owner retains actual child receipts in private root evidence;
  persistence saves that bounded proof tree dependency-first. Keep the existing
  public root receipt as the single storage-only retry handle. A child save failure
  leaves independently acknowledged children intact and the parent unsaved; retry
  uses genuine child evidence without replaying either graph. Do not expose a second
  receipt catalog, reconstruct proof from logs or retain payloads durably. Request
  expiry keeps the same honest unavailability boundary as above.
- Cancellation/unknown settlement never promotes unfinished work. Cancellation after
  acknowledged product completion cannot roll it back; any already committed library
  bytes remain authoritative, while unacknowledged storage remains uncertain/unsaved
  until the current owner confirms it. Teardown attempts host disposal and store close
  independently after active work settles; cleanup failure cannot replace the product
  outcome or claim that resources closed successfully.

Proof: use the real host, native controls, registry/interpreter and real SQLite store
in one permanent integration path. Inject faults only at the documented external
storage boundary. Cover successful save, lock contention, commit-before-reply failure,
exact save-only retry, receipt exhaustion before writes, disposal and fresh reopen,
unknown/partial execution, nested dependency save failure and cleanup failure. Count
actual leaf writes and compare receipts/store bytes; no duplicate mutation is allowed.

##### 4C. Reopen and reuse through current authority

Owner: Runtime `persist -> admit -> register -> invoke`, with Design provider load,
discovery and secured management endpoint as direct consumers. Keep exact immutable
name/revision, canonical dependency fingerprints and expected-version storage writes.

- A new request loads/revalidates through current admission and discovers eligible
  tools through the same registry. Invoke with fresh parameters, current document
  targets/check selections and newly owned artifacts. Persist no request handles or
  document identities as reusable literals, and release only owned leases.
- Candidate metadata can be listed as candidate, never advertised as proven eligible.
  Stored UI status is metadata, not a promise that invocation is currently admitted.
  Refresh and exact-version management use the existing endpoint without model or
  canvas work; stale management writes fail without overwriting another connection.
- Suspension/removal, changed or missing dependencies, corrupt newer records,
  incomplete inventory and unavailable storage must not silently expose an older
  recipe or guessed fallback. Preserve current family-specific rejection; do not
  disable unrelated native capabilities or reset persistent data.
- Recheck saved state before a new invocation. An already-started admitted graph may
  settle with its pinned revision, but cannot republish a dependency or tool retired
  during execution. Dependency disappearance between load and invoke, concurrent
  promotion/state writes and ambiguous acknowledgements require exact current owner
  evidence, not blind retries. Fix only a reproduced mismatch with this contract.

Proof: extend `local-tool-library`, `local-tool-store`, `local-tool-host`, provider,
Runtime `tool-store`/`recipe-flow` and actual management integration tests. Close and
reopen the database/host, rediscover the exact eligible revision, and execute with
new values. Assert fresh handles, unchanged old document work, no old check selection,
no automatic execution on load/resume and zero additional provider turns for tools.
Test concurrent connections and the suspended/retired/corrupt/dependency cases above.

##### 4D. Integrated predecessor preservation and completion gate

Before production edits, update only necessary thin product spec/Inspector contracts
and executable cases at the existing Design `compose`/`settle`/`observe` and Runtime
`persist`/`invoke` owners. Re-read exact inputs, outputs, routes, bypasses, forbidden
contributors and failure owners. Complete supported Inspector admission; then set the
Stage 4 goal. Work one admitted owner slice at a time, with test-first defects and the
same fixed seven-category review after each slice. This planning review itself does
not claim that admission or the following runtime tests have passed.

A permanent combined browser case must use actual native review selection, Runtime
repair, canonical browser mutations and document persistence, plus the actual host
library and SQLite adapter. Mock external inference and deliberate fault boundaries
only. Build on `ai-inspection-evidence.spec.ts`; retain existing component tests and
management UI fixtures, but do not use their separate green results as this proof.

1. Obtain fresh scoped findings with an independent passed region, execute one
   explicitly prescribed repair and accumulate current results. Deferred screenshot
   still performs mechanical checks. Deliver an actual image before scripted primary
   judgment; model judgment quality is outside this deterministic proof.
2. Hold/fail tool-library saving after the real mutation; the panel shows the actual
   remaining operation, document/check state remains intact, and save-only recovery
   adds zero product writes and zero history entries. Observe independent document
   durability, not a substituted library-save acknowledgement.
3. Apply an unrelated local/peer edit; retain unaffected passes and invalidate only
   actual dependencies. Exercise Undo/Redo, acknowledged interruption, existing
   compensation/resend and fresh document reload. No new shared mutation owner is
   introduced; run affected existing Factory/collaboration regressions if touched.
4. Close the request and store, reopen with a new request, discover and invoke the
   saved revision with fresh values. Test expired receipt/check/handle rejection,
   candidate-only reopen, unavailable storage and recovery without replay. Parallel
   current status and terminal late-event behavior must remain correct throughout.

Run affected whole existing server/Runtime/activity suites (not only new cases),
real browser handoff/library cases, production typechecks, scoped lint/naming, and
current-source Inspector cases/required negative controls with accepted-behavior
preservation. Keep original skips and failure evidence truthful. Record check reads,
actual mutations, save attempts, admitted calls, provider re-entry and event ordering;
node count is not an improvement metric. No new live AI/101, complete repository CI,
push or monitoring is part of this gate.

**Self-review outcome.** All four directions now share their actual authorities:
Stage 1 evidence/completion, Stage 2 scoped finite repair, Stage 3 discovery/delegation,
and Stage 4 lifecycle/durability/reuse. Failure recovery has an explicit owner and
lifetime at each handoff, including nested save receipts and disposal. Existing
mechanisms are reused; new persistence formats, clocks, compatibility, duplicate
registries and extra AI are unnecessary. Remaining work is implementation admission,
formal failing cases where behavior disagrees, bounded fixes and integrated evidence.
The isolated Stage 3 navigation interruption remains known unresolved/non-blocking
by user direction; retained traces must diagnose a new occurrence rather than relabel
it passed. No Stage 4 runtime correctness or latency improvement is claimed yet.

### Self-review, verification and completion boundary

The fixed seven-category review below applies to every slice and all direct consumers.
Review found and incorporated these necessary limits: single-step calls remain valid;
unsupported creative repairs return to the primary agent; visual acceptance and save
eligibility stay distinct; diagnostics do not authorize automatic assessment; settled
writes cannot be replayed to recover output; and changed dependency scope, not pass
count or target count, determines invalidation.

Use permanent cases derived from saved tool input/output plus controlled adverse
ordering. Keep production registry, admission, dispatcher, check store and persistence
in the integration path; mock only external provider/network failure boundaries where
needed. Run existing affected suites, lint and production typechecks, including current
save/reload, Undo/Redo and collaboration regressions for any changed mutation boundary.
Record work counts, provider-call counts, actual outputs and preserved passes; node
count and a later green retry are not improvement evidence.

Do not make another expensive live 101 the primary bug detector. No live provider
probe is authorized by this planning update. A later explicitly requested acceptance
must retain the independent 900-second forced stop, recording and evidence preservation.
Runtime correctness does not guarantee model selection or a completion-time target;
those require observed evidence and must be reported without conflating them.

Whole-direction completion requires all four stages and their connected failure/recovery
cases, not merely registered tools or isolated green tests. Stages 1/2 are complete
and pushed; Stage 3 is pushed with the explicitly retained unresolved browser event.
Stage 4 admission, implementation and local completion gates are complete as recorded
in the Stage 4 completion section. Stage 4 changes are not pushed.

## Earlier review evidence (not current execution instructions)

### Stable comprehensive review scope and completion standard

Review the same complete current paths on every iteration: evidence publication
through accumulated review results, provider events through current activity, and
initial document connection through recovery, editing, persistence and fresh load.
The following categories are mandatory together, not selectable review themes:

- User behavior: ordinary, sequential, overlapping, reentrant, cancelled, retried
  and reopened operations; accepted behavior outside each correction must survive.
- Contracts: exact input/output shapes, identity, ordering, ownership, lifetimes,
  successful/partial/failed outcomes and their actual upstream/downstream consumers.
- Invariants: distinguish states made impossible by canonical ownership from
  untrusted external states requiring rejection. Do not duplicate validation or
  invent fallback state to compensate for a missing owner contract.
- Recovery: inspect each asynchronous failure and interruption boundary, retained
  edits/evidence, cleanup, compensation and replay. Recovery must permit further
  edits and acknowledged persistence followed by an exact fresh reload.
- Architecture: preserve Asyra public/event boundaries, one semantic owner,
  incremental/batch work, Undo/Redo and collaboration; avoid parallel registries,
  mutable canonical mirrors, unrequested compatibility and fixture-specific paths.
- Work and resources: trace real repeated computation and retained outputs,
  invalidation, subscriptions, queues, workers, rooms and disposals.
- Verification: inspect current implementation and existing consumers, not only
  new tests. Use deterministic adverse ordering and actual saved-file integration.
  An unexplained failed run blocks completion even if later repeats pass, unless
  the user explicitly retains that specific event as a non-blocking known item.
  This exception never turns its failed result into a pass.

This expands review depth across the authorized handoffs, not mutation scope to
unrelated repository features. Before each new correction, identify the first
incorrect owner and test it red; review its full contract before implementation.
Document concrete unresolved limits rather than claiming every hypothetical
execution is proven. No live101, model calls, push or monitoring.

### Cancellation isolation review

Repeat the fixed seven-category review for the checkpoint cancellation correction,
including the existing consumers and unchanged persistence/Undo/Redo/recovery paths.
Review shared initialization, existing-room admission, failure/timeout/close ordering,
peer identity, Reset, shutdown and accepted-write ownership. No production expansion,
new deadline, model run, push or monitoring is authorized by this review.

Verification card: existing socket tests separately prove read cancellation and
persistence. Add one permanent combined real-socket/real-backend case: hold a write,
start and cancel a different peer's checkpoint read, queue a healthy peer's next
publication, release the write, retry an accepted identity, confirm durability, and
reload the exact persisted checkpoint. Use controlled network boundaries only;
retain the production reducer, file store and protocol. Re-run the full socket
suite and direct lifecycle/publication/status consumers, then the existing saved
file recovery test. If this reveals a defect, prove it before changing its owner.

Cancellation isolation review outcome: no further production regression was found.
The new permanent combined test uses the real socket server, canonical document
operations, backend materializer and file store, with a network proxy controlling
only one read and one write. Cancelling the joining reader releases its admission;
two healthy Actors remain connected, the second publication can be accepted while
the first write is pending, and durability confirmation remains pending until the
writes succeed. Retrying the first publication returns sequence 1 without another
write. A new connection then receives the exact persisted document at sequence 2
with no pending tail. Existing shared-waiter, actual-timeout, partial-body, Reset,
backpressure, peer failure and persistence tests remain green.

The first combined test draft incorrectly equated accepted with durable and reused
an intentionally opaque transport payload against the real semantic backend. The
fixture was corrected to the current canonical document protocol and separate
acceptance/durability assertions. Those failures are not product regressions and
are retained in the diagnostic logs; no validation or production behavior was
changed to satisfy the fixture. Lint also required explicit globalThis.fetch in
this Node test; the corrected focused case and lint both passed.

Verified this review: complete socket suite 31 passed
(`tmp/review-cancellation-socket-all.log`), provider/queue 196 passed with 3 original
conditional skips (`tmp/review-cancellation-server.log`), and 15 complete direct
consumer files 404 passed (`tmp/review-cancellation-consumers.log`). The final
combined case passed again after the explicit-global correction
(`tmp/review-cancellation-combined-current.log`). Production typechecks, focused
lint and 15 naming tests passed. Both saved-document browser scenarios passed
(`tmp/review-cancellation-recovery.log`), including recovery, further edits,
Undo/Redo, regional pass retention, confirmed persistence and exact reload; only
the recovery scenario's intentional initial backend error was observed. Existing
source proof at digest `16b900c067eb867f0d030c773a3ef45ab63aca1478a325b9fcdeef96fde08fd7`
and mapping 83 is retained: this review changed only the formal socket test and
this plan, not production or Inspector semantics. Scope stayed at the current
handoffs; no new model call, live101, commit, push or monitoring was performed.

### Repeat of the fixed comprehensive review

Review the same seven categories above against the three current corrections,
including timeout-to-resource-release rather than only timeout-to-UI failure.
Keep the same bounded owner paths, existing local work and no-live101/no-push/
no-monitoring boundaries. Reuse prior unchanged evidence; add deterministic
regressions for any newly discovered missing handoff.

Open-document-session cancellation card: a socket closing or timing out must
release its pending checkpoint read and admission. Shared room initialization
must retain work while another waiter exists, but cancel and retire it when its
last waiter leaves. A subsequent connection must start a fresh read, not await
an abandoned promise. A cancelled old initialization must never publish a room
over a successor. Existing-room reads belong to their joining peer and must
release the serialized admission on cancellation, without discarding live peers
or pending persistence. Propagate cancellation through the existing HTTP client
readCheckpoint method; do not cancel persistence writes or introduce retries,
new deadlines, fallback checkpoints or duplicate authoritative rooms.

Self-review and tests before implementation: reproduce a held initial read and a
held existing-room read with a disconnected caller; healthy successors must finish
without releasing the old backend response. Verify one cancelled shared waiter
does not cancel the surviving waiter or duplicate backend reads. Keep backend
failure, real duplicate Actor, Reset, bounded progress, replay/Undo/Redo and
persistence tests. Only repair the existing socket/read ownership boundary.

Repeat review outcome: one additional cancellation defect was reproduced before
implementation. Closing the socket only ended the client-visible session; a held
HTTP checkpoint read still retained either the initialization promise or the
existing room admission. A healthy reconnect therefore waited on abandoned work.
The initial-room and existing-room regressions both failed before the correction
(`tmp/review-repeat-cancel-red.log`) and passed afterward. Read cancellation now
propagates through HTTP headers and response-body decoding. Shared initialization
has per-waiter ownership; only the last cancelled waiter aborts it. Identity guards
prevent the abandoned initializer from removing or publishing over its successor.
No deadline was raised, write cancelled, fallback added or integrity check removed.

All seven fixed review categories were revisited together. Reviewed normal and
adverse input, exact bootstrap milestones, room admission/retirement, actor identity,
shared-reader ownership, queue cleanup, existing persistence writes, outbox recovery,
Undo/Redo, compensation and resend; the real socket suite includes actual timeout,
partial-body cancellation and surviving shared-waiter cases. Producer purpose
settlement and activity projection still agree on closed identities and replacement
ownership. Canonical dependency receipts, region membership and review consumers
still retain unrelated passes; viewport changes do not invalidate content receipts.
No additional production changes were required in those latter two paths. Existing
Factory/package owners remain unchanged by this correction; no parallel canonical
state, new compatibility path, polling or model work was introduced.

Current-source validation:

- Complete real socket server suite: 30 passed; tests observe actual backend
  connection closure before attempting the successor, not only caller rejection
  (`tmp/review-repeat-socket-final.log`).
- Complete provider/persistence queue files: 196 passed, 3 original conditional
  skips (`tmp/review-repeat-server.log`). Nine direct activity, session, protocol,
  outbox, recovery UI and inspection files: 300 passed
  (`tmp/review-repeat-consumers.log`). Six publication, Factory, transaction and
  recording-outbox files: 104 passed (`tmp/review-repeat-publication.log`).
- Existing saved-document browser integration: both normal and failed-initial-read
  recovery passed, including exact canonical contents, local edits, Undo/Redo,
  unrelated regional pass retention, acknowledged persistence and exact fresh
  reload. Elapsed complete scenarios were 49.013s and 47.830s, not AI drawing times.
  The recovery case contains only its injected initial backend 500; both cases have
  no subsequent browser errors (`tmp/review-repeat-recovery.log`, E2E
  `recorded-reload.json` result artifacts). Real timeout cancellation is proved separately
  by the socket suite; the browser fixture injects a failed read, not a stalled read.
- Production typechecks, focused lint, naming 15 tests and Inspector catalog 15
  tests passed. The generated catalog reflects the current socket contract.
- Current source digest
  `16b900c067eb867f0d030c773a3ef45ab63aca1478a325b9fcdeef96fde08fd7`:
  candidate `cd497a01-4af7-499c-8aa6-066623d799f6`, accepted review
  `a37155a82cc0ccd16cfc1937baef88e2ebf079154b92a4903344faf8941b7a8c`,
  mapping revision 83. Same-source positive, four exact negative scenarios and
  recovery `31593c9a-feb3-4311-bc0b-0f9459711444` passed 30 obligations
  (`tmp/review-repeat-proof.log`). Deliberate negative failures remain negative.

No unresolved regression was found within these reviewed handoffs and gates.
This is bounded source/integration evidence, not a guarantee for every possible
external failure. Test-owned ports 3300/3401/4401 were released. No live101, model
calls, commit, push or monitoring occurred.

### Concurrent handoff and reconnect follow-up review

Current scope: review the previous native-research purpose and closed-peer
admission corrections with their direct producer/consumer and persistence paths.
No live101, model, commit, push or monitoring. Preserve existing local changes.

Settle card: test replayed/late native research events after completion, overlapping
App calls, purpose replacement and terminal failure. Both producer and projector
must agree that a completed invocation cannot become active again in that request.
Use the existing request-owned purpose lifecycle; no new presentation heuristics.

Open-document-session card: hold a joining peer's checkpoint read while the last
registered peer disconnects. Verify one authoritative room remains through queued
admission, live duplicate-Actor refusal, publication ordering, persistence and
subsequent reconnect. Review normal empty-room cleanup, failed/cancelled admission,
durability callback and Reset. If reproduced, fix room ownership at the shared
admission/retirement boundary, not by accepting duplicate Actors or replaying data.

Self-review: test-first both suspected races. Keep ordinary validation, deadlines,
sequence cutoff and replacement ownership. Run complete affected provider/server
suites, direct activity and session consumers, types/lint/naming, and the existing
saved-document failure/edit/Undo/Redo/save/reload proof. Stop after these handoffs
and their direct regressions are verified; do not expand into unrelated owners.

Recovery gate iteration: the real saved-file recovery gate intermittently fails
with the provider's bounded handshake timeout. A passing run is not closure.
Persist its actual worker stage/timing/failure evidence in the permanent E2E
artifact before deciding the next owner correction. Do not raise timeouts or
change data integrity admission. Keep the replayed research and room retirement
regressions green. Review the evidence against the finite bootstrap-stage contract.

Bootstrap-stage correction card (open-document-session): the saved checkpoint's
first complete reply takes approximately 4.76 seconds in a passing sample and
crosses the existing five-second stall guard in failing recoveries. Checkpoint
read/preparation and reply encoding/transfer currently have no observed boundary.
Add one canonical BOOTSTRAP_CHECKPOINT_READY control milestone after successful
admission and before encoding the full READY payload. The real worker validates
it and emits one checkpoint-ready stage between first control receipt and full
bootstrap decode. No periodic heartbeat, time increase, editable state, receipt,
checkpoint data, second transport or fallback is introduced. A valid READY still
owns connection completion; a progress marker alone never does. Duplicate or
post-ready markers fail; stale-generation events and repeated diagnostics cannot
extend a deadline. Keep the server hello deadline and all current integrity checks.

Self-review: the checkpoint read is bounded by the existing socket-open deadline;
marker receipt and checkpoint validation advance only finite stages; remaining
encoding/transfer/decode remains bounded separately. No marker on read failure or
rejected Actor. All normal/absent checkpoints share the same path. Test wire shape,
real worker handoff, timeout behavior, actual server order, current session suites
and saved-file recovery/edit/Undo/Redo/persistence/reload before closure.

### Comprehensive handoff review closure

The fixed review categories above were applied across current producer/consumer
code, existing adverse-path tests, and actual saved-document integration. Findings
were corrected at three current owners:

1. Provider purpose settlement retained completed native identities. A replayed
   native search start previously joined a new purpose after completion, keeping
   it visible after the real next operation ended. Request-local tombstones now
   match the activity projector's closed-call semantics. Concurrent App/native
   work, purpose replacement, repeated completion, failure and terminal cleanup
   were checked; old completions cannot retire replacement work.
2. Socket room retirement now counts queued and executing admissions. A last
   peer disconnect previously removed a room while a replacement checkpoint was
   loading; the orphaned room could accept an Actor also admitted to a new room.
   Admission ownership is acquired synchronously and released in finally on every
   outcome. Peers, outstanding admissions and undurable publications all prevent
   idle retirement; successful cleanup is proven by a fresh backend read. Reset
   still owns its explicit generation replacement, not an idle-retirement bypass.
3. Large-checkpoint recovery exposed a real bounded-timeout failure, not a room
   identity failure. Preparation plus transfer/decode exceeded the original
   single socket-open deadline. The canonical one-time checkpoint-ready control
   milestone now separates completed preparation from remaining transfer/decode.
   Both remain bounded at the existing durations; no recurring heartbeat, larger
   timeout or relaxed checkpoint validation. Exact shape, repeated/late marker
   failure, stale/reordered progress and progress-without-READY timeout are tested.

Architecture and adverse-path review: activity remains request/attempt-owned;
publication acceptance, bootstrap consumption and persistence acknowledgement
remain distinct. Progress cannot authorize edits or certify durability. Admission
serialization and peer duplicate refusal preserve one current room authority.
Failure/closed peers release ownership without discarding undurable work. Existing
source settlement, backpressure, failed peer writes, Reset and confirmation tests
were run. The current lifecycle's reconnect queue, retained publication cutoff,
recovery isolation, compensation and retry paths were inspected with their direct
tests; no extra state registry or replacement framework path was introduced.

Local evidence review still preserves unaffected regional passes, invalidates
changed members/ancestors and actual entrants/exits, and rejects mixed whole/local
judgments atomically. A changed unit scope needs exact explicit supersession.
Viewport navigation does not mutate canonical dependencies; unknown canonical
changes remain conservatively invalid rather than guessing unaffected results.
The saved-file browser proof exercises actual receipt creation, local mutation,
Undo/Redo, unrelated pass identity retention, new local pass accumulation,
persistence confirmation and identical fresh reload, not a fake persistence mock.

Final evidence:

- `tmp/review-handoff-server.log`: 196 provider/persistence-queue tests passed,
  3 original conditional skips.
- `tmp/review-handoff-milestone-server.log`: all 26 real socket tests passed.
- `tmp/review-handoff-final-consumers.log`: all 300 tests across nine current
  activity, protocol, worker/provider, lifecycle/outbox/recovery and inspection
  dependency/evidence files passed. The contained protocol/worker set also passed
  all 117 cases independently after the milestone change.
- `tmp/review-handoff-milestone-recovery.log`: both real saved-document normal
  and initial-failure recovery/edit/Undo/Redo/save/reload cases passed, with zero
  unexpected errors. Each case persists worker stage timings and console errors
  as `recorded-reload.json`; the deliberate initial backend failure is separate.
  Normal load measured preparation 2.240s and remaining transfer/decode 3.734s;
  recovered load measured 2.081s and 3.030s respectively. These are observations,
  not performance thresholds or node-count improvement claims.
- Final production browser/server types pass. Focused lint has no errors (existing
  console warnings only); naming and Inspector/catalog each pass 15 cases.
- `tmp/review-handoff-final-proof.log`: current-source baseline, four exact
  negative scenarios and recovery pass all 30 obligations. Source digest
  `34b18b93bdfdcb0acebf8ecc02753abbe8d19ace86e1ca0c3a8cf085aa61a3e0`, mapping
  revision 82, recovery `b6b68aac-ca0f-435f-8696-20974faddf7a`.

Failed evidence is preserved: native replay and room lifetime red regressions;
several pre-milestone real recovery runs timing out; three milestone protocol/
worker reds and the server ordering red. A later passing recovery was not used
as closure until the intermittent timeout was explained and corrected. Two added
negative-test assertions initially used a nested failure shape instead of the
actual flat worker response; their oracles were corrected, not product admission.
The first final catalog command used incorrect test paths and did not run; the
correct existing catalog/contract files then all passed.

Limit: this verifies the defined current handoffs and adverse cases, not every
possible machine speed, provider behavior or repository feature. Genuine stalled
or slower-than-budget stages still fail explicitly and retain normal recovery;
progress does not suppress failures. No new live101 or model invocation, commit,
push, monitoring or unrelated App changes occurred. Temporary test ports were
released; existing environment files remain. HEAD is unchanged at
`e0d52ddefedb941ed18d5b324130b2e4b51455bc`.

### Recorded repair follow-through review

Review the existing inspect, settle and open-document-session routes end to end,
including their current callers, failure paths and existing tests, not only the
new regressions. Preserve the authorized scope and all existing local changes.
No live101, model call, commit, push or monitoring.

- Inspect: trace evidence publication, dependency validation, result admission,
  accumulated coverage, supersession and completion. Prove unaffected passes
  retain identity while changed scopes and invalid evidence remain unresolved.
- Settle: include native research events as well as App tool invocation events;
  verify finite purpose ownership, overlapping calls, replacement, failure and
  terminal settlement through the actual activity projection. A native search
  currently emits activity outside the purpose cohort; add a failing formal
  producer/consumer regression before changing that owner.
- Bootstrap: exercise an actual failed initial saved-document handshake, retry
  in the same App, exact checkpoint recovery, mutation, Undo/Redo, durable save
  and fresh reload. Existing successful-load and fake-worker timeout proofs do
  not establish this combined recovery path. Keep all finite timeout guards.

Self-review: native research is observable provider work, not an App write or
permission bypass. Join its lifecycle to the same purpose owner without creating
another activity registry. Preserve overlapping root operations and never let an
old completion retire a replacement purpose. Failure injection belongs in the
formal browser test transport, not production behavior or the stored document.
Run affected owner suites, direct consumer tests, types/lint, naming and the
saved-file browser proof; expand mutations only for reproduced direct failures.

Follow-through bootstrap step card: the formal delayed-checkpoint server test
reproduces a closed socket being registered after its awaited backend read. The
same actor's recovery is then rejected as already connected. Repair the existing
open-document-session admission owner: a peer must still be open before queued
bootstrap work and after its final awaited checkpoint read, before reserving the
actor. Preserve the room queue/cutoff and real duplicate-live-actor rejection.
Verify the real server regression, existing server contracts and the saved-file
browser failure/retry/edit/save/reload path. No deadline increase or retry bypass.

### Follow-through review closure

Reviewed current producer/consumer code and existing tests for browser dependency
receipts, server judgment admission/result accumulation/completion, provider root
activity and presentation, socket admission, App reconnect/outbox replay, and
persistence confirmation. Two additional production defects were reproduced and
fixed at their existing owners:

1. Native web-search completion bypassed purpose retirement. Both App calls and
   native research now join the same finite purpose cohort. Concurrent research,
   overlapping App calls, replacement commentary, failure and duplicate completion
   preserve their correct lifetime. No additional model or purpose inference.
2. A socket closed during an awaited checkpoint read could later reserve its
   Actor, making the replacement connection fail as already connected. Admission
   now checks peer lifetime before queued work and after the awaited read, before
   reservation. Real live-Actor duplicate checks and sequence cutoff stay intact.

The saved-document browser test now feeds actual capture receipts into the
production review-result owner. A real crown edit plus Undo/Redo invalidates the
whole view and crown only; base receipts and its passed result/revision remain.
Submitting only a corrected crown fixture accumulates its pass without certifying
stale whole-view criteria. These fixture verdicts are not claimed as automated
visual judgments. The same test also covers a genuine initial backend-read
failure, same-page reconnect to the exact saved checkpoint, subsequent edits,
Undo/Redo, durable confirmation and exact reload. Expected initial errors are
explicitly asserted/retained; unexpected errors and all recovery errors fail.

Validation on the final production source:

- `tmp/review-recorded-server.log`: 465 passed, 3 original conditional skips,
  including the complete provider, review-stage, result-store and operation suites.
- `tmp/review-recorded-consumers.log`: 275 passed across activity/conversation,
  evidence/dependencies, protocol/provider and document lifecycle.
- `tmp/review-recorded-socket-all.log`: all 25 real socket-server tests passed,
  including the delayed-reader regression, multi-peer and persistence contracts.
- `tmp/review-recorded-recovery-final.log`: full saved-file failure/reconnect/
  edit/Undo/Redo/save/reload passed; `review-recorded-normal-and-ui.log`: normal
  saved-file handoff and both 360/1280 activity cases passed (3 cases).
- Production browser/server typecheck passed; focused lint has no errors and
  four existing console warnings. Naming and Inspector/catalog each pass 15.
- `tmp/review-recorded-proof.log`: same-source baseline, four exact negative
  scenarios and recovery passed all 30 obligations. Source
  `f9aee6dae1ff042b65c7c9bfe697ba06b898583fe32e1d14b2ce710fd19efe17`,
  accepted mapping revision 80, recovery `54daf11d-3bf1-4b2a-bd43-a4f957c3b041`.

Red evidence is retained in `review-native-purpose-red.log` and
`review-bootstrap-closed-red.log`. An initial browser interception attempt did
not intercept worker WebSockets and failed its injection assertion; it was
replaced with a controlled actual backend-read failure, not a product workaround.
The first follow-up provider fixture omitted its registered preparation capability;
its fixture was corrected without weakening admission. These failed runs remain
failed. No live101, model call, commit, push or monitoring occurred. No additional
production edits were needed for local invalidation after the combined proof. Both final
360/1280 App screenshots were inspected from `apps/asyra-design/tmp/review-purpose-ui`;
the current label follows the new inspection and the completed subject remains
only in history. The final two UI cases passed in `review-recorded-ui-artifacts.log`.
Ports 3300/3401/4401 have no remaining listeners; persistent environment files
were preserved. HEAD remains `e0d52ddefedb941ed18d5b324130b2e4b51455bc`.

### Recorded failure repair - bounded plan and self-review

Replay the saved public tool inputs/results, activity events and exact document.
Permanent fixtures retain provenance and hashes; tests must not depend on ignored
run folders. Work through existing owners, one slice at a time:

1. Inspect owner: visual judgment admission must distinguish local obligations
   from whole-view evidence. Prevent a regional verdict from acquiring incidental
   whole-target dependencies; never silently discard evidence actually needed by
   a cross-region judgment. Preserve separate whole-view coverage, exact local
   identity, sparse accumulated passes, reference invalidation and explicit redesign.
   Review the recorded mixed base/overview submission and prove corrected local
   evidence survives crown edits, while affected and whole-view checks invalidate.
2. Settle owner: trace commentary through provider start/end events into the
   activity machine. Give each authored stage an actual finite execution lifetime;
   no guessing completion from prose, timers or a tool-name exception. Preserve
   concurrent/nested calls, cancellation, failure, retries, authored language and
   honest observed operation labels. Replay the recorded repair-to-inspection seam.
3. Bootstrap owner: replay the exact saved document through the real backend,
   collaboration transport and fresh browser. Measure checkpoint read, encoding,
   transfer/decoding and application before selecting the first incorrect owner.
   Preserve reserved sequence cutoff, pending tail, stale generation refusal,
   cancellation, integrity and later save/reload. Do not raise a deadline to hide
   unbounded work or route around the authoritative session.

Allowed changes: these Design owners and their direct supported framework
consumers only if reproduced evidence requires them, permanent formal fixtures/
tests, exact specs/Inspector contracts and this plan. Discovery is limited to the
recorded handoffs and direct callers/consumers. Run red regressions first, then
focused tests, complete affected owner suites, types/lint/naming and a saved-file
browser replay. Do not re-run unrelated gates or generate a new drawing. Review
failure/recovery, work counts, current contracts and all three handoffs together
before closure; passing tests alone cannot waive a recorded failure.

Self-review: an overview of an isolated crown is legitimate local evidence; do not
ban every overview or infer semantic regions from element names. A broad evidence
set must be narrowed explicitly, not quietly certified. Commentary is authored
intent, not proof of activity; its lifetime must be tied to actual provider work.
Bootstrap failure is not data loss: the saved checkpoint equals the original.
Reproduce on current source because intervening transport changes may already
alter the path. Preserve older failures and label preventive proofs honestly.

First step card: `inspect`, current AI execution spec evidence/completion and
Inspector inspect step. Inputs: delivered image scope/stamp, declared criterion/
unit, explicit check dependencies and mutation receipts. Outputs: admitted current
scoped judgments, retained unaffected passes and actionable invalid-input recovery.
Only review/evidence owners may establish dependencies; no extra AI, guessed IDs
or visual approval from geometry. Boundary: local-design-review and formal
design-review-stages/recorded replay fixtures, exact spec/Inspector description.
Reject invalid scope before writes and preserve prior accepted results. Stop and
revise this card if current evidence cannot distinguish local from cross-region
scope; do not hide that uncertainty in a cache or fallback.

Inspect slice: saved original review input now fails before correction and the
101-test owner suite passes after correction (`recorded-review-{red,green}.log`).
The replay proves refusal preserves all prior results, explicit local resubmission
accumulates passes, crown/whole-view invalidation preserves base result identity,
and a real base dependency change invalidates it. Browser-issued dependency
validation remains to be replayed with the full preserved document below.

Next step card: `settle`, provider progress adapter to the existing activity
machine and current-purpose projection. Commentary has no natural completion in
the recorded protocol; bind it to the next root tool cohort and explicitly retire
it after all calls in that cohort settle, before later tools can inherit it.
Concurrent calls share the cohort, nested calls remain under their actual root,
and a newer commentary cannot be cleared by an older call. A cohort is execution
ownership, not inference that the whole user objective is complete. Authored tool
messages continue to own their call lifetime. No prose parsing, timeout, tool-name
exception, extra model, or synthetic success. Allowed files: local-ai-provider,
activity-state, their formal producer/consumer tests, exact spec/Inspector. Inputs
are existing commentary and invocation start/end events; output is ordered explicit
purpose completion plus current actual operation. Prove the recorded repair seam,
concurrent/replacement/failure behavior and unchanged active-call retention. Review
raw diagnostics independently of visible-history deduplication.

Settle focused producer/consumer regression is red before the change and green
with finite cohort settlement; provider suite 175 pass / 3 existing skips.
Replacement/concurrency replay and presentation checks remain final slice gates.

Bootstrap reproduction card: existing document-session transport and App lifecycle
own the reserved checkpoint/tail handoff. Inputs are the immutable saved 101
checkpoint and file/actor identity; output is exact loaded canonical document,
synced session and later durable edits. Record packet/owner timings without an AI
request. First add a guarded permanent saved-file browser case and reproduce on
current source before choosing production changes. Existing integrity/timeout and
process ownership guards remain. Boundary: Design collaboration transport/server,
App bootstrap and their direct formal tests/fixtures only as evidence requires.
Do not conflate old handshake failure with new application failure, or seed the
browser directly around the transport. Recovery must use real durable storage.

Bootstrap decision after recorded measurement: worker received the full frame at
4974.6ms, decoded at 5543.2ms and delivered to main at 6520ms. The existing 5000ms
aggregate watchdog cancels a progressing valid session. Keep 5000ms per finite
observed stage: worker/socket opening, awaiting the first bootstrap frame,
decoding/validation, and main-thread handoff. Only strictly ordered one-time
socket-open/first-frame/validated-bootstrap events renew that watchdog; diagnostics,
duplicates, reordered and stale-generation events cannot extend it. This is bounded
progress (at most four waits), not a heartbeat or a raised total timeout disguised
as performance. No wire encoding, source data or load validation changes. Maintain
terminal failure, cancellation and reserved tail semantics. Saved-file E2E and
fake-clock stall cases must prove both success and bounded failure. First formal
stage regression fails before implementation. Add the actual transport Worker to
the existing open-document-session Inspector boundary. This fixes functional
reload; no load-speed improvement is claimed without before/after timing evidence.

### Recorded-failure repair - final review and local evidence

The three scoped repairs are complete. This is not a new live drawing acceptance,
a claim that every future input is correct, or a load-speed claim.

- **Local judgment dependencies:** the saved submission cited a whole-target
  image alongside base crops, so its base pass genuinely depended on crown edits.
  The inspect owner now refuses this ambiguous mixed unit atomically, explains the
  required split, and preserves prior results. Explicit local-only resubmission
  accumulates passes; unit scope expansions/replacements require exact supersession.
  A whole image of an isolated crown and explicit cross-region obligations remain
  valid. No cited evidence is silently discarded, no dependency is inferred from
  names, and no additional AI is called.
- **Current purpose:** recorded native commentary lacked completion, so its
  request-scoped repair intent survived later inspection. The provider owns a
  finite root-call cohort and emits explicit completion when that cohort settles.
  Concurrent/nested calls, failure and replacement identities are preserved. The
  existing activity machine consumes those events; distinct concurrent observed
  operations now retain their names rather than only a generic count. The request
  objective and historical purposes are never promoted back into current work.
- **Large reload:** exact saved JSON is 183,494,673 bytes. Actual Worker replay
  received the 183,494,794-byte bootstrap at 4974.6ms, finished decode at 5543.2ms,
  and delivered at 6520ms. The old total 5000ms connection timer killed this valid
  progressing session. Finite stage stall guards preserve the same per-stage
  duration and all parser/cutoff/cancellation contracts. No checkpoint fallback,
  data trimming, wire-format change or larger timeout constant was introduced.
  Review additionally exposed a missing-phase progress event matching an exhausted
  phase array. The formal fake-clock case failed first; an explicit finite-stage
  bound now prevents malformed events from renewing the final deadline.

Permanent replay fixtures: server `fixtures/recorded-101/{review-handoff,purpose}.json`
and E2E `fixtures/recorded-101/{document.fixture.gz,manifest.json}`. The document
manifest records both raw and canonical SHA-256. No test depends on ignored live
run folders. The large fixture gate is opt-in (`E2E_LARGE_DOCUMENT=true`); ordinary
CI does not acquire a machine-speed acceptance threshold.

Evidence under `tmp/`:

- `recorded-review-{red,green}.log`: original mixed-scope input fails first;
  **101** owner tests then pass, including unchanged result identity/revision,
  actual affected dependency invalidation and explicit scope redesign.
- `recorded-provider-final.log`: **177 passed / 3 existing conditional skips**,
  including exact saved commentary, concurrent completion, replacement and failed
  tool cohorts. `recorded-browser-owners-final.log`: **179 passed** across
  presentation (**66**) and protocol/provider (**113**); its separate lifecycle
  file was initially invoked with the wrong Node environment, not passed.
  `recorded-lifecycle-final.log`: correct declared jsdom environment, **69 passed**
  across lifecycle and inspection dependency/evidence owners.
- `recorded-server-final.log`: **1174 passed**, one test-oracle whitespace failure,
  **10 conditional skips** including the new opt-in large fixture. The raw saved
  commentary includes a trailing newline; the existing presentation contract trims
  it. The corrected oracle is included in the full provider rerun above. Preserve
  this initial failed log; do not relabel it as a green complete-suite run.
- `recorded-bootstrap-stage-red.log` and
  `recorded-bootstrap-invalid-phase-red.log`: both reproduced before their fixes.
  `recorded-bootstrap-closeout.log`: final **113** protocol/provider tests pass,
  with reordered, duplicate, stale, missing-phase and diagnostics non-extension.
  `recorded-bootstrap-exact-final.log`: exact full saved payload round-trip passes;
  read 744.5ms, encode 774.9ms, decode 618.1ms in this local diagnostic. These are
  observations, not portable performance thresholds.
- `recorded-reload-red.log`: real cold session failed with handshake timeout and
  provisional empty workspace. `recorded-reload-complete2.log` and the saved-file
  case in `recorded-e2e-final.log`: full canonical hash equals the source, real
  crown fill edit invalidates crown/whole-view but retains base, pan/zoom and
  crown Undo/Redo retain base, authoritative persistence confirms, and fresh
  reload exactly equals the edited canonical hash. No direct browser fixture
  injection bypasses the socket bootstrap. The initial strengthened digest helper
  omitted await on Core.save; corrected before its green full-content proof.
- `recorded-e2e-final.log`: recorded large reload plus small multi-tier dependency
  browser tests pass. The two UI cases initially interleaved their new completed-
  purpose case before an existing active-purpose history-deduplication scenario.
  Separate those lifecycle scenarios without changing or dropping assertions.
  `recorded-status-ui-final.log`: **2 passed**, 360px/1280px, old purpose absent
  during the next inspection, historic content and existing following/deduplication
  checks preserved. No production change was made for this fixture ordering.
- `recorded-types-closeout.log`: browser/server production typechecks pass.
  `recorded-lint-closeout.log`, `recorded-bootstrap-lint-closeout.log` and
  `recorded-e2e-lint-final.log`: zero errors; existing/diagnostic console warnings
  remain explicitly reported. `recorded-naming-final.log`: **15 passed**.
- `recorded-inspector-closeout.log`: **15** current contract/catalog tests pass.
  Formal candidate admission exposed one duplicate basic-api fixture boundary in
  the prior apply contract; removed only that duplicate, regenerated the catalog.
  `recorded-source-proof.log`: baseline, **4 exact negative scenarios**, recovery,
  **30 obligations** pass on captured source. A final capture after the missing-
  phase transport guard is recorded separately below.

Final source closure: `recorded-source-proof-closeout.log` passes all 30
obligations, four exact negatives and recovery on source
`18d4f6cc4815dcd15e1bad51f8715adb52c3f6c2dfd6cc12fbc43874d0345195`,
recovery `a3dd395d-e661-41e5-8d92-c9e1bfc78148`, mapping revision 79.
Final whitespace check passes. Test-owned ports 3300/3401/4401 have no listeners.
HEAD remains `e0d52ddefedb941ed18d5b324130b2e4b51455bc`; no commit or push.

Visual evidence: explicit `APP_URL=http://127.0.0.1:3300`, isolated collaboration
3401 and backend 4401; file scope `ai-conversation-flow.spec.ts`, grep
`current activity matches`, one worker. Actual App panel uses deterministic
streamed fixture events, with no drawing/model invocation. Screenshots
`test-results/ai-conversation-flow-*/settled-purpose-next-inspection.png` at
360px/1280px were opened and reviewed: current text is `Reviewing the drawing`,
old purpose appears only in history, and the composer/status remain within the
panel. This proves lifecycle presentation, not AI visual accuracy. Test-owned
services exit after the gate; persistent .env is preserved.

Final review covered tool discovery instructions/schema to atomic judgment
admission, result identity/accumulation and invalidation, real browser-issued
scope dependencies, native lifecycle to activity projection/UI, malformed/stalled
transport to cleanup, and canonical load/edit/history/save/reload. Scope/result
errors remain recoverable and cannot silently certify a pass. No model calls,
new live101, commit, push, monitoring or unrelated framework changes were made in
this repair. Previous dirty selection/publication work remains intact.

## Historical checkpoints - superseded execution instructions

The following sections retain prior decisions and evidence. They do not authorize
new execution or override the current stop boundary above.

Repair the four observed handoffs from recorded run reusable-tools-1791997243736:
discovery selection/representation, visual unit identity/evidence, incremental
judgment delivery, and current activity projection. Reuse this worktree and the
existing registry, check store and activity machine. No live101, extra model,
further push, monitoring, persistence redesign or unrelated package changes.
The prior persistence recovery and recorded full101 remain completed evidence.
Run the affected formal owner/consumer tests, lint and production typechecks.
Any later authorized full101 retains its independent 900-second hard deadline.

## Authorized checkpoint and tool-test follow-up - 2026-10-15

The user explicitly requests pushing the current corrections before adding all-tool
usage tests. This is a coherent checkpoint of the recorded discovery, scoped
judgment and action-lifecycle corrections, not completion of the product goal.
Prior no-push directions are superseded for this checkpoint only. No live101 or
monitoring is authorized by this follow-up. Preserve original validation failures.

The subsequent live run `reusable-tools-1792002035768` completed drawing in
366.810 seconds, with first content at 111.477 seconds. It did not pass whole-flow
acceptance: a local base verdict cited a changed whole-building image and became
stale; authored repair purpose survived into final inspection; and a fresh reload
failed the document-session handshake although the stored checkpoint exactly
matched the exported document. These remain open. Test counts below mean executed
cases passed, not that every tool and failure/recovery path was covered.

The next task uses the authoritative Design host/native/browser registries to
verify usage, success, rejection, applicable execution failure/cancellation,
artifact lifetime and real producer-consumer handoffs for all tools. Reuse formal
tests and the saved live inputs. Never treat mock success outputs or schema-only
checks as proof of real execution. Exclude model calls, live101, monitoring and
additional remote operations. Missing cases and reproduced failures remain visible
until addressed; this checkpoint does not close them.

## All-tool usage verification - active local task

Scope: every current Design browser action and native host tool, including
registry-only basic operations and reusable-library controls. Inventory must derive
from current canonical definitions. Existing semantic owner cases remain authoritative;
add missing public-boundary rejection, cancellation, recovery and producer-consumer
cases rather than replacing owners with successful mocks. No production redesign,
model calls, live101, push or monitoring. Known live findings remain open.

Compose owner card: current Inspector compose contract and AI execution spec own
advertised input/output admission, exact dispatch, failure settlement and artifact
handoffs. Start with existing real-browser basic-api cases and native invocation
suites. Inputs are canonical definitions and explicit owner-specific valid cases;
outputs are actual successful receipts or structured rejection/cancellation, with
unchanged document/selection on rejected calls and subsequent valid recovery.
Existing concrete owners and public invocation middleware may contribute. Guessed
arguments, relaxed schemas, fabricated successes and test-name counting may not.
Edit only formal tests/fixtures and test runner registration, plus this plan and
necessary current verification mapping. Shared transport-only tests are not proof
of domain effects. Per-tool semantic oracles and failure/recovery checks must remain
visible. Focused suite, lint, typecheck and naming close each slice; unknown coverage
or known failing behavior prevents an all-tools-complete claim.

Self-review: the existing basic cases already assert actual canonical effects and
registry equality, but their malformed-input check only calls a schema helper and
their cancellation check does not verify preserved state or a later successful use.
Strengthen that same fixture through the production observed action boundary before
valid execution. Server owner tests require a separate real-owner usage inventory;
wrapper exception injection cannot substitute for those cases. Test-only changes
do not authorize altering production semantics to make a new test pass.

### Selection correction and complete tool review - current authorization

The current user authorizes repairing selection and findings from the current
all-tool review. This supersedes the earlier test-only mutation restriction.
No live101, model requests, push or monitoring. Review the canonical 152 basic
operations, 21 browser actions and 25 native tools through their current definitions,
public invocation, concrete owner, receipts and direct consumers. Inspect admission,
domain rejection, cancellation, partial settlement, ownership, recovery and test
oracles; do not infer end-to-end coverage from injected transport errors or counts.
Discovery is limited to those inventories, their direct implementations/consumers,
formal tests and recorded failures. No unrelated application or framework redesign.

Compose/apply owner card: `select_elements` accepts existing element identities;
validate the entire set inside the synchronous mutation boundary before selection
changes. Missing-only and mixed sets reject without changing prior selection;
valid calls must agree with canonical selection and allow recovery after rejection.
The Core selection channel remains the transaction/replay authority. The App action
owns its existing-element precondition, using the existing element lookup API;
no duplicate type registry, fallback selection, compatibility or automatic retry.
Allowed edits: action implementation, direct tests and current spec/plan as needed.
Failure uses the common execution-error/settlement path. Focused action regressions
must fail before the fix, then pass with real browser selection and unchanged
saved state. Review upstream discovery/schema and downstream batch/recipe receipts.
Run relevant owner suites, all Design AI/server suites, real registered-tool browser
usage, typecheck, lint and naming. Stop at unresolved contract contradictions or
unrelated scope; do not claim every possible input is covered by passing suites.

Self-review: validating before an asynchronous scheduler is insufficient. Verify
inside its actual callback, without an await between lookup and selection. Core's
low-level selection is intentionally generic; do not impose App-specific document
existence rules on vector channels or framework consumers. Tests must start with
nonempty prior selection, include both mixed-ID orders and a later valid call.

#### Selection owner review iteration

The direct-consumer review found the registry-only basic selection and toggle
routes use the same common selection API. Correcting only the named App action
would leave a bypass. Move existing-element admission to that common API, before
Core transaction publication; keep generic Core and vector channels unchanged.
The App action translates only the specific selection-domain error into its
recoverable execution error. Test both public routes, all-invalid and both mixed
orders, selection/Undo preservation and subsequent corrected use. The common API
and its direct consumers/tests are the bounded apply-owner correction; no new
registry or duplicate validation pass. Typed domain rejection prevents unexpected
programming exceptions from becoming expected usage-test success.

#### Review of existing verification consumers

Stricter domain oracles exposed that missing review/image dependencies and missing
replacement compositions reject through their owners rather than returning a
no-change receipt. Verify each exact owner rejection and preserve state, not an
arbitrary exception. SceneTree explicitly rejects reused active identities before
creation. This is test correction to current owner contracts, not new fallback.
The broad local gate also found one obsolete debug-Window assertion in the existing
collaboration lifecycle test. Its adjacent supported `getActiveCollaborationHandle`
identity assertion proves the same successor ownership; remove the redundant
prohibited debug access without changing production lifecycle or the assertion.
A separate local server gate lost its built executable while concurrent browser
setup rebuilt that same output directory. Run build-owning gates sequentially;
retain that failure and do not change product behavior or retry individual actions.

### Test-fixture iteration

Repeated full basic-usage runs failed during fixture construction, before the
selected tool executed: the workspace was empty after an earlier external
readiness observation. A toolbar/canvas or an earlier ready poll is not a fixture
mutation precondition. Revised test setup waits on the actual Core workspace and
active synced document session inside the fixture, then starts creation in that
same synchronous continuation. This never retries a product action. Preserve the
failed logs; the observation does not establish the cause of the intervening
workspace transition. Add domain-level missing-target/artifact probes before valid
recovery, beyond generic null-input and pre-cancellation checks. Do not relax any
product contract or expand into initialization redesign.

### All-tool review findings and limits

Reviewed the current canonical inventory and direct producer/consumer paths, not
only new tests: basic adapters and ordered return alignment; App admission and
transaction settlement; native schema/operation discovery; preparation/workflow
repair; retained queries, image artifacts and release/borrowing; reference download
and decode boundaries; library admission, invocation and save-only recovery;
mechanical/visual evidence and activity consumers. The selection defect affected
both the named action and common/basic entry points. Fix at the shared App owner;
Core generic channels and other apps are unchanged.

Usage verification now rejects unexpected programming exceptions and checks exact
owner refusal reasons. Native fixtures assert the actual public failure receipt
before preserving their direct-owner exception assertions. Real browser probes
verify missing/mixed IDs, prior selection, no added Undo entry, corrected use and
Undo/Redo. All registered basic and App operations have concrete effect/read oracles;
native suites combine real owner logic with explicitly mocked network/browser/model
boundaries. Those mocks are not live external acceptance. Unknown tools cannot be
hidden by a fixed list: canonical inventory equality and per-owner successful-use
checks fail omissions. Null-input/pre-cancellation tests alone are not evidence for
every domain failure; existing concrete owner regression suites remain required.

The prior recorded Taipei101 findings remain open: overly broad image evidence can
invalidate local acceptance, authored purpose can remain stale, and large-document
fresh bootstrap timed out. Existing unit suites do not close these recorded end-to-end
failures. This selection correction and all-tool review must not be reported as
proof that those three problems are repaired. Reuse the saved inputs/checkpoint for
those subsequent regressions; do not generate another live101 for this task.

### Selection correction verification and open review finding

Selection correction is locally verified. The broad review is **not an all-green
system claim**. Current evidence (all logs under project `tmp/`):

- `select-elements-red.log`: four original action regressions fail before repair.
  `select-common-red.log`: four common-selection regressions fail before the
  shared-owner correction. `select-review-selection-final.log`: 20 pass, including
  mixed-order rejection, scheduled target disappearance and queued cancellation.
- `select-review-final-browser.log`: **173 pass** (21 App actions and 152 basic
  APIs), with real state/effect oracles and strict expected domain refusals.
  Selection-specific checks preserve nonempty selection and Undo depth, then prove
  valid recovery, Undo and Redo. Both named and basic selection entrances execute.
- `select-review-server.log`: **1,172 pass / 9 existing conditional skips**;
  exact current native inventory includes 25 tools. Live provider tests stay off.
- `select-review-final-ai.log`: **581 pass**; subsequent new queued-cancellation
  case is included in the 20-test final focused selection run above.
- `select-review-final-local.log`: **152 Node tests and 587 Vitest tests pass**.
  Build-owning checks ran sequentially after browser setup completed.
- `select-review-runtime.log`: **374 Runtime tests pass**.
- `select-review-flow-proof-node.log`: **30 pass** using the formal Node environment;
  the earlier jsdom invocation was an incorrect test environment, not a product
  regression. `select-review-catalog.log`: **8 pass** after normal generation.
- Typecheck passes. Scoped complete owner lint has **0 errors / 7 existing
  console warnings**; edited selection test formatting is clean. Naming **15 pass**.
- `select-review-interactions.log`: **21 pass / 1 fail**. Existing finite-history
  grouped hierarchy E2E fails saved-state equality after Undo. The backend also
  rejects publication with HTTP422, `hierarchy move evidence ... is stale`.
  `select-review-history-baseline.log` reproduces both failures with the original
  HEAD selection/action files. The runner restores the correction byte-for-byte
  in finally. This proves the failure predates this selection correction; it does
  not prove its underlying persistence cause. Do not omit or waive this failure.

P1 finding at the previous checkpoint (now repaired and verified below): multiple nested grouping/moving/ungrouping operations in
one history member cannot complete the existing persistence/Undo proof. The exact
formal case remains `e2e/transaction-history-groups.spec.ts`, with reducer rejection
at `server/document-canonical-reducer.ts` hierarchy before-index validation.
Its producer/publication/reducer evidence needs a bounded persistence-owner repair;
do not weaken backend validation or call the complete tool system verified. The
three previously recorded live101 issues above also remain open. No live101,
model call, commit, push or monitoring occurred in this correction/review task.

### Review finding repair - ordered hierarchy publication

User authorization now includes repairing review findings. Freeze this slice on
nested grouping/movement/removal in a finite history member: canonical mutation,
Factory publication order, App preparation, backend materialization, Undo/Redo,
peer application and saved reload must agree. Keep existing validation, atomic
rollback, compensation and retries. No live101, push, monitoring or model calls.

Step card - diagnose the first incorrect ordered-evidence owner. Product contracts:
Factory transaction history groups and shared publications; Design collaboration
reference and socket-authoritative document session. Inspector routes:
`prepare-document-publication` in canonical-projection-and-collaboration and the
Factory transaction publication/replay owners if source order is already wrong.
Inputs are actual completed source deliveries; output is the same ordered canonical
effect at local replay, peer and backend. Transport grouping cannot redefine
operation semantics. No new document/history mirror, stale-evidence bypass,
selection workaround or retry of product operations. Read only those owners,
direct consumers, their formal suites and the existing failing E2E. Allowed edits
are the first incorrect owner, direct regression tests, exact contract docs/flow
and this plan. Existing baseline E2E already fails before implementation; capture
its actual source/prepared evidence before selecting a correction. Add a small
permanent regression at that owner before production edits, then prove the real
browser saved checkpoint, Undo/Redo, peer and fresh reload. Run affected full owner
tests, types, lint and naming sequentially for build-owning gates.

Self-review: do not infer a reducer fault from its rejection, or treat local Undo
and backend 422 as necessarily one defect. Explicit immediate and deferred delivery
may interact; preserve source operation boundaries and check both action and
reverse replay. No weakening malformed or stale evidence rejection. Stop and
replan at the same bounded owner if the first hypothesis is disproved.

#### Confirmed Factory ordering owner

The saved actual source (`tmp/hierarchy-publications-red.json`) publishes ungroup
and regroup before the earlier deferred move. The backend correctly rejects that
impossible order. This precedes document conversion. Work on transaction Inspector
`settle-local-shared-projection`, whose boundary is Factory source/tests. The fix
must make an immediate boundary drain the prior eligible journal prefix in order;
retain one synchronous source window, rollback evidence and exactly-once delivery.
Effective shared delivery of that prefix becomes immediate, while undoable/shared
and rollbackable options remain unchanged. Track the consumed prefix rather than
rescanning all prior entries on every write. Pure deferred transactions remain
commit-only; explicit progressive boundaries cannot be bypassed. Formal tests must
prove action, Undo/Redo, cancellation compensation and independent transactions;
then rerun the actual grouped-hierarchy browser proof before advancing. No backend
validation change is authorized or needed by this finding.

#### Factory slice verification and downstream review

Factory 295 tests pass, build passes, and the enhanced real-browser case passes
(26.5s): grouped/Undo/Redo checkpoints exactly equal live canonical data, an
independent peer converges, fresh reload matches, and a post-reload edit saves and
reloads. Logs `hierarchy-factory-all3.log`, `hierarchy-factory-build2.log`,
`hierarchy-browser-durable.log`. The temporary initial regression incorrectly used
commit:false, then assumed unpublished synchronous work produced wire compensation;
corrected it to the formal outcome and explicit published/unpublished cases.
Existing immediate-window expectations now assert the actual dependency order.

Next owner card: `prepare-document-publication` (canonical-projection Inspector),
Design collaboration reference ordered source delivery contract. Review the direct
consumer's merging of multiple MOVE_ELEMENTS deliveries within one transport batch.
Each delivery's moves are simultaneous; separate deliveries are sequential and may
move the same identity again. Preserve those boundaries through prepare/read/reducer,
including creation/removal classifier paths. Allowed inputs are source slices and
ordered deliveries, output is exact ordered CanonicalChange operations; no new
wire grammar or receiver reconstruction. Add formal regression in the existing
allowlisted document-publication tests before any adapter correction. Check same
source action/Undo/Redo/compensation and stale evidence rejection. No Factory or
backend semantic redesign in this next slice.

#### Adapter iteration - heterogeneous channel batches

The same-owner direct review proved a second adapter defect: MOVE_ELEMENTS and
UPDATE_ELEMENT_DATA in one Scene batch are misclassified together by a `some`
check. Both delivery orders fail the new formal cases. Normalize only Scene
transport batches into consecutive operation-family runs before classification;
keep source-slice and delivery order, combine scalar/plural add or remove families,
and keep subtree events individual. Props relationship evidence remains together
at its existing owner. This is not a new wire format or receiver reconstruction.
Verify creation/move/removal paths and mixed raw-data operations, then rerun the
existing owner suites and browser chain. Earlier pass evidence predates this
adapter correction and does not close it.

#### Ordered publication repair - final local verification

The P1 hierarchy finding is closed for this source. Three proven causes were
corrected: Factory immediate delivery overtook an earlier deferred prerequisite;
the document adapter flattened sequential moves into a simultaneous move set;
and heterogeneous Scene batches were classified as a single operation family.
Backend stale-evidence validation remains unchanged. The final review checked
effective versus caller options, consumed-prefix lifetime/reset, pure deferred
transactions, explicit progressive boundaries, failed channel delivery, rollback
before/after publication, Undo/Redo, source-slice identity, property association,
and ordered mixed operations. No compatibility branch or alternate wire grammar
was introduced.

Final evidence, under `tmp/` unless noted:

- `hierarchy-browser-complete.log`: **202 passed**, covering all registered basic
  and App actions, selection, group hierarchy/interaction, and finite history.
  The enhanced finite-history case verifies exact backend checkpoint equality
  after commit/Undo/Redo, an independent peer, fresh reload, and another edit/save/
  reload after recovery. No live model or Taipei101 run was used.
- `hierarchy-factory-closeout.log`: **296 passed**; current Factory build passes.
  Core **268**, Scene Tree **211**, Preset **212** also pass on the Factory fix.
- `hierarchy-design-local-final.log`: **152 Node + 601 Vitest passed** on the
  final adapter. `hierarchy-design-ai.log`: **582 passed** and
  `hierarchy-design-server.log`: **1,172 passed / 9 existing conditional skips**
  precede the final adapter-only correction; relevant adapter/reducer consumers
  were subsequently reverified in the local suite and browser gate.
- `hierarchy-types-final.log`, `hierarchy-lint-closeout.log`: pass;
  `hierarchy-naming-closeout.log`: **15 passed**. Inspector transaction/catalog
  **25** and canonical-projection contract **13** tests pass. Diff whitespace
  check passes. The generated catalog was regenerated through its normal owner.
- `hierarchy-factory-source-proof-final.log`: current captured-source baseline,
  **7 exact negative scenarios**, and recovered baseline pass, covering **11
  obligations / 3 flows**. Source digest
  `5e8c4d1c722fa8ad0107088112f0bc907df2aac6a07bcc54d02844e3c0f42161`;
  candidate `50aa43df-1676-45cd-b029-13f80df2000d`, accepted contract review
  `fddcf0730ec0e893539a8aa2ac36af7ff3da851153d76d61b6a1165453af3104`.
  The initial proof was correctly refused until the changed architecture contract
  was reviewed through candidate/contract acceptance; it is not a runtime failure
  or a waived gate. Original red regression logs remain preserved.

This closes the selection and newly diagnosed ordered-publication findings, not
the previously recorded Taipei101 image-dependency, stale-purpose and large-load
failures listed above. No commit, push, monitoring or extra AI invocation. HEAD
remains `e0d52ddefedb941ed18d5b324130b2e4b51455bc`.

### Prior test-only verification results

The pre-test checkpoint was pushed as `e0d52ddef`. Before the selection correction, changes after
that checkpoint were tests, fixtures and this plan; no new production implementation,
model invocation, live101, remote push or monitoring was performed.

- Canonical browser inventory: 152 basic operations and 21 App actions. The basic
  fixture now runs invalid input, pre-cancellation, unchanged document/selection,
  then a successful real owner call and its existing per-operation semantic oracle.
  Structural operations use the actual retained-context owner and dispose it.
- Canonical native inventory: 25 built-in tools, including four library controls.
  Exact inventory equality catches missing registration/testing scope. Native owner
  suites require successful public-boundary usage for every advertised built-in;
  each valid owner fixture also proves null-input and cancellation rejection without
  executing its owner, followed by exact input/output validation and one dispatch.
  Existing per-tool domain guards, partial outcomes and recovery assertions remain.
  Mocked external boundaries are not represented as end-to-end product execution.
- New App action suite uses real runtime definitions, Core, transaction runner,
  renderer, retained queries and document service. It asserts domain effects and
  producer-consumer receipts. Eighteen applicable actions additionally exercise
  unavailable targets/artifacts or conflicting prepared identities before valid
  recovery. Clarification/detail-choice are request-only controls; completion uses
  real persistence confirmation, with persistence-failure behavior also covered by
  the existing action suite.
- `tmp/tool-usage-basic-atomic.log`: **152 passed**.
- `tmp/tool-usage-actions-domain.log`: **20 passed, 1 failed**. The failure is a
  product defect, not a fixture exemption: `select_elements` returns selectedCount=1
  for a nonexistent ID while the effective existing selected-object count is zero.
  The current implementation in `src/ai/actions.ts` reports the requested array
  length. Preserve this regression and do not label this task all-green. The earlier
  valid-target run passed all 21 App actions on the same production source.
- `tmp/tool-usage-server-all.log`: **1,172 passed, 9 existing conditional skips**.
  The subsequent inventory-only update passed all 59 invocation tests in
  `tmp/tool-usage-inventory.log`; no production source changed.
- `tmp/tool-usage-ai-all.log`: **572 passed**.
- `tmp/tool-usage-ownership.log`: **65 passed**, covering query/image ownership and
  actual registry/composition handoffs.
- New save-only recovery test fails durable storage after successful invocation,
  saves the retained receipt on recovery, verifies eligible state and proves the
  product executor ran exactly once. New layer-conversion case uses the real tracer
  and hands separated paths to actual drawing preparation.

Review corrections: three old operation fixtures returned empty acknowledgements
for submitted work; public result validation correctly rejects that. Fixtures now
return one acknowledgement per submitted action, retaining argument/order assertions.
The prior basic fixture omitted retained structural delivery. Node-side oracle types
stay local to the test rather than importing a browser barrel into server compilation.
Earlier failed runs are retained and are not described as passes. This test work does
not resolve the previously recorded live101 local-invalidation, activity freshness or
large-document reload findings, nor prove every possible input combination.

## Recorded handoff correction - 2026-10-15

### Evidence and root causes

- At 187.249s discovery rejected query plus usage even though selection and
  representation are independent concerns. Flat advertised fields admit the
  combination but handwritten admission prohibits it; lexical pages only return
  menus. Preserve bounded pagination, exact routes and full schema availability.
- At 451.885s the crown judgment added corroborating views and was treated as a
  redesigned unit. Unit identity was the equality of all cited image scopes.
  Preserve the original exact target/crop obligation when additional evidence
  contains that scope; replacing/removing it still requires exact supersession.
- The check store already retains sparse passes, but capture replies provide
  evidence without a concrete sparse-recording handoff. Final-oriented guidance
  leaves useful local judgments unrecorded. Tools cannot invent visual passes.
- Activity contract and reducer explicitly prioritize stage prose over live call
  purpose and hide observed work phases whenever prose exists. This is a contract
  defect, not missing timers or a translation issue.

### Execution cards and reviewed handoffs

1. **compose - discovery.** Selection chooses registry entries; explicit usage/full
   chooses the representation for exact, query and category selectors. Query and
   category retain the same page size/revision/continuation. schemaPaths remains
   exact because fragments need an identified contract. Default menus do not
   consume full delivery. Validate native/action paths, repeat/recovery, empty
   results and every returned continuation. No automatic tool dispatch or aliases.
2. **inspect - evidence and retained judgments.** Unit scope is its initial exact
   target/crop set, independent of receipt versions. Additional corroborating
   scopes do not replace it or grow its identity. A scope replacement requires
   current revision/reason; stale replacement and malformed checks change nothing.
   Every cited image remains a real invalidation dependency (including a cited
   overview); never silently discard a dependency to preserve a pass. Capture
   and review replies expose pending coverage and an actionable sparse-recording
   handoff, including partial captures. Record passes/failures before editing;
   final completion consumes retained passes. Prove unchanged units and actual
   cross-region dependencies, cancellation/failure and exact replay. Use existing
   store only; no model call, synthetic pass or second acceptance ledger.
3. **settle - current activity.** Live leaf/common call purpose outranks request
   stage intent; stage intent remains context, not evidence that a drawing is
   executing. Present observed meaningful operation plus authored purpose.
   Admission/queue churn does not replace a live operation description; diagnostics
   retain every phase. Completion removes its call purpose and returns to explicit
   stage-context presentation. Preserve concurrent ancestry, late-event rejection,
   Stop/retry/saving and authored language. UI and recorded selected purpose agree.

Authorized implementation boundaries are the existing compose/inspect/settle
Inspector steps: local-operation-tools, local-design-review, ai-domain-prompt,
activity-state/presentation and direct producer/UI consumers only as necessary;
associated formal tests, execution spec, Inspector contract/generated catalog and
this plan. No broad repository discovery after this audit.

### Direct-consumer review refinements

- Capture before criteria is a supported path. Its next handoff must define the
  criteria while retaining images, not request a judgment that cannot be recorded.
  Formal capture-to-definition-to-recording regression first failed, then passed.
- Queued/admitted calls are visibly preparation, not already drawing; retain that
  classification until execution starts. After execution, repeated admission labels
  cannot revive queued wording. Formal phase and provider integration tests cover it.
- Showing current operation must not duplicate history rows with identical authored
  subjects. Keep current phase projection independent from history subject
  deduplication; historical snapshots stay immutable and all raw events remain.
- Increment the changed public discovery/review contract revisions. Validate both
  compact and full paginated representations through the real invocation boundary.
- Each execution card above uses its named Inspector step as failure owner and
  current specification sections Recorded handoff correction, Scoped visual check
  units and Purpose lifetime. Inputs are current admitted descriptors, actual
  delivered evidence and ordered progress respectively. Missing/ambiguous input
  stops that owner, never dispatches writes or manufactures approval. Only existing
  adapters/stores/projection contribute; extra models, guessed scopes, bypassed
  freshness, persistence changes and a second registry/store are forbidden. Stop
  an owner segment on its failing formal oracle and iterate within this boundary.

### Plan self-review and closure

Reviewed selector -> schema -> dispatcher -> page -> exact execution; capture ->
judgment -> shared store -> mutation invalidation -> final acceptance; and provider
start/phase/end -> reducer -> panel/diagnostics. Keep ambiguity, stale revision,
partial capture, source changes, cancellation and unknown mutation settlement
explicit. Scope expansion evidence is not proof of semantic equivalence; original
scope must remain or explicit redesign applies. Empty/unchanged results are not
fresh work. No node-count or model-time improvement claim from deterministic tests.
Test-first each owner, then full affected server/browser suites, typecheck, lint,
naming and current flow proofs. Review direct consumers and generated contracts.
Stop after local evidence and report; no additional live101 or remote operation.

### Whole-handoff review follow-up - 2026-10-15

Reopen only the four handoffs for a complete direct-consumer review. Fixed discovery
roots: current selector/schema/dispatcher, review capture/record/check-store/browser
invalidation, provider lifecycle/projection/panel and their existing formal suites.
No 101, extra model, push, monitoring, persistence or unrelated package changes.

Inspect owner card: a failed whole-drawing coverage check currently invalidates
criterion keys, which also retire independent optional regional units under that
criterion. Input is canonical whole-coverage failure, output is pending whole-view
acceptance with unchanged independent regional passes. Existing source/criterion
changes still invalidate every actual dependent. Use an explicit whole-coverage
dependency in the existing result store, not another store or an exception based
on unit names. Exact owner remains inspect in the current Inspector, Scoped visual
check units spec. Allowed files: local-design-review, its direct host/owner/browser
tests and matching spec/plan. No model judgments, receipt freshness bypass or
production browser/persistence mutation. Test-first the original coverage failure,
then prove repair/final acceptance without resubmitting unaffected units; include
corroborating-image invalidation, current source failures and existing 8/32-region
browser-owner integration. Stop if a new owner or semantics is required.

Self-review: criterion/source dependency and drawing coverage are different inputs.
The correction must attach whole-coverage dependency both to declaration placeholders
and recorded whole visual judgments. Regional judgments keep their own image and
criterion dependencies; a regional judgment citing a whole image still invalidates
when that image changes. Completeness is not weakened: final acceptance still
requires actual current whole coverage and all mandatory criteria.

Settle owner card: the actual Runtime action loop emits a scoped authored start
but no matching end. The App therefore retains a completed direct action while
later work is active. The matching settle Inspector already allows runtime.ts and
its consumers. Add a paired completed lifecycle notification in the same action
owner for success, failure and cancellation, without changing outcomes, mutation,
retry, transaction or permissions. No new observer or timer. Allowed inputs are
admitted action identity and executor settlement; outputs are ordered start/end
progress and unchanged action outcomes. Abort must continue suppressing observer notifications; the canonical cancelled
outcome closes App activity instead. Tests must prove ordering before the next
action and failure/cancellation terminal behavior at Runtime, then consume the
actual stream through the Design projection. This is a direct upstream repair,
not unrelated framework work. Existing provider streams and App lifecycle guards
remain required. Finish inspect owner gates before advancing to this card.

Settle self-review refinement: action IDs are batch-local, whereas activity IDs
live for the invocation. Paired completion must not make a later batch reusing an
action ID invisible as an old closed call. Prove distinct invocation identities
across real executeBatch calls, then use one opaque action-execution ID for progress
and its causal trace children; retain original actionId/batchId as evidence. No
change to product action IDs, receipts, retries or document identity.

Observe direct-consumer card: changing invocation correlation must retain original
batch/action identity through the existing profiler allowlist. Verify actual saved
trace output, not input objects. Permit only the missing actionId diagnostic field
if the test proves it is omitted; no raw payload expansion, observer authority or
new record format. Runtime progress tests plus existing profiler suite own closure.

### Whole-handoff review results - 2026-10-15

Reviewed the complete direct path from discovery input/schema/dispatch and cached
representations through capture, browser invalidation, sparse judgments, final
acceptance, Runtime/provider lifecycle, activity projection, panel and persisted
trace. Existing suites and actual browser contracts supplement the new regressions.

Two canonical defects were reproduced before fixing their owners. Whole-view
coverage failure retired eight independent regional passes through shared criterion
keys; its own dependency now retires only whole visual obligations. Source,
criterion and every actually cited image remain real dependencies. Regional
identity does not widen when corroborating images are added. Actual dispatcher
proof preserves the regional record through coverage failure and final retry
without resubmission. Browser proofs cover geometry, property changes, crop entry,
deletion, Undo, viewport changes, load and peer edits.

Runtime direct actions lacked paired completion. The actual action loop now closes
its scoped execution before advancing, while preserving executed/failed/cancelled
outcomes and abort suppression. Self-review caught batch-local action ID reuse:
each execution now has an opaque correlation ID shared by progress and causal
trace children. Product IDs and receipts are unchanged. A saved-record regression
also caught the recorder dropping original actionId; the existing allowlist now
retains that field with batchId. Actual Runtime-to-App tests cover successful,
failed, cancelled and repeated-batch handoffs; cancellation settles through its
canonical outcome without late observer notifications.

Final evidence (overlapping runs are not additional unique test counts):

- Runtime full package: 374 passed (`tmp/handoff-review-runtime-verified.log`).
  Final package build passed (`tmp/handoff-review-runtime-build-verified.log`).
- Complete AI/browser/panel suite: 572 passed
  (`tmp/handoff-review-ai-closed.log`); complete server suite: 1,170 passed and
  nine original conditional skips (`tmp/handoff-review-server-closed.log`).
  The later diagnostic allowlist-only change was verified by the full Runtime
  suite and 104 direct-consumer cases (`tmp/handoff-review-cross-owner-verified.log`).
- Actual browser inspection/conversation suites: 27 passed, five original
  conditional skips (`tmp/handoff-review-browser.log`). After final execution-ID
  correction, four affected status/batch/Undo cases passed again at 360/1280px
  (`tmp/handoff-review-browser-closed.log`). Final active/completed screenshots
  were inspected. Existing fixture logs include deliberate duplicate-create
  backend rejections; this does not claim error-free backend logs or re-prove the
  entire persistence subsystem. Temporary test ports are closed.
- Production typechecks, scoped lint, 15 naming checks and whitespace checks
  passed. Scoped lint retains one explicit test-console warning, zero errors.
  Final test-only type correction was rebuilt and linted successfully.
- Inspector/catalog: ten passed (`tmp/handoff-review-inspector.log`). Final
  same-source proof: 30 obligations, four exact negative scenarios and recovery
  passed (`tmp/handoff-review-same-source-proof.log`), source
  `bd91578825cca486952b428f5de84dbfcc4338f92de9dfbe22735dc81d9a432f`,
  accepted review `75d8746ae3ccf0a335d162986ea1d3723f26a06bc36f1d56dac858d32ed9c2d5`.

Preserve red coverage/lifecycle/batch-identity/correlation regressions and earlier
failed fixture/type iterations as failures. No admission, freshness, mandatory
review, transaction or abort guard was weakened. This closes the bounded review;
it does not claim faster model execution, universal agent wording correctness or
new live101 acceptance. No live AI/101, commit, push or monitoring was performed.

### Independent repeat of the bounded review - 2026-10-15

Re-read actual discovery admission/delivery/paging, review dispatcher validation
and partial receipts, result-store dependency closure, canonical browser change
notifications, Runtime action progress/abort guards, activity reducer and panel.
Rechecked failure, cancellation, retry, reused action IDs and saved trace consumers.
No additional blocking defect or production change was identified. The four
handoff corrections remain coherent with existing mutation, Undo and request
lifetime contracts. This is a single-agent second review, not an external audit.

Re-executed existing suites: 316 host discovery/review/store/flow cases
(`tmp/handoff-second-review-host.log`), 104 Runtime-to-App/presentation/canonical
inspection cases (`tmp/handoff-second-review-consumers.log`), and all 374 Runtime
package tests (`tmp/handoff-second-review-runtime.log`). Same-source proof again
passed 30 obligations, four exact negative scenarios and recovery
(`tmp/handoff-second-review-proof.log`, unchanged source
`bd91578825cca486952b428f5de84dbfcc4338f92de9dfbe22735dc81d9a432f`).
Earlier complete server/AI suites, browser screenshots/E2E, build, typecheck and
lint remain evidence for unchanged source; they were not silently counted as
new runs. Local dependency changes preserve unrelated passes; changed ancestors,
shared source/criteria or cited images still invalidate actual dependents. No
additional model call, live101, commit, push or monitor was started. Model wording
and live elapsed-time improvement remain outside this deterministic closure.

### Prior local verification and bounded closeout

All four owner corrections are implemented and reviewed through their actual
producer/consumer boundaries. Capture-before-criteria required inputs are derived
from the canonical schema, including references and detail requirements. Explicit
discovery representations preserve pagination and delivery identity. A retained
unit does not silently grow its identity when corroborating evidence is added;
every cited image still contributes real invalidation dependencies. Current
operation projection remains distinct from history subject deduplication.

- AI/browser and panel suites: 569 passed (`tmp/handoff-verified-ai.log`).
- Server suite: 1,170 passed, 9 existing conditional skips
  (`tmp/handoff-verified-server.log`). After deriving the final required-input
  list from the canonical schema, all 303 affected discovery/review/flow cases
  passed again (`tmp/handoff-owner-closure.log`). These overlapping runs are not
  additional distinct test counts.
- Production typechecks passed, including the final schema refinement
  (`tmp/handoff-final-schema-types.log`). Scoped lint has zero errors and two
  explicit test-console warnings (`tmp/handoff-closure-lint.log`). Naming passed
  all 15 checks (`tmp/handoff-closure-naming.log`); whitespace checks passed.
- Actual browser status tests passed at 360px and 1280px, 2 cases in 18.9 seconds
  (`tmp/handoff-status-final-e2e.log`). Active-inspection screenshots at both
  widths and wrapped-purpose presentation were inspected. Tests cover current
  operation/context separation, completion, late events, bounded wrapping,
  history deduplication and preserved scrolling/following. They use deterministic
  streams, not live AI. Temporary ports 3300/3401/4401 are no longer listening.
- Inspector and generated-catalog tests passed all 10 cases
  (`tmp/handoff-inspector-closure.log`). An obsolete contract-test assertion
  expected older cache counts; it now checks the existing exact dependency and
  observer-lifetime contract. No production cache was added by that correction.
- Same-source flow proof passed 30 obligations, four exact negative scenarios
  and recovery (`tmp/handoff-same-source-proof.log`). Captured source digest:
  `325cee220cf082339800f44a72f319c48555b9c7d23d03039a0d0a363358aeab`;
  accepted contract review:
  `670caf2aad582db96d985c5e095196f8fe25d120eda2f6fb5e11ca083112a1c4`.

Behavioral regression failures were retained before each owner correction. Earlier
failed runs remain failed evidence, including a DOM test invocation missing its
required environment and the stale Inspector assertion. No admission, freshness
or mandatory check was weakened to make those runs pass.

Limits: deterministic evidence proves the tool handoff, sparse result retention
and status projection, not universal primary-agent compliance or model-time
improvement. Authored purpose wording remains the primary agent's responsibility;
the UI separately displays the observed operation or explicit task context. No new
101 run, model call, push, commit or monitoring occurred after the requested
checkpoint push. This closes this bounded correction, not the historical global
plan or an authorization to start another stage.

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

Stages 1 through 7 are pushed. Stage 8 completes the integrated review and local
package validation; its final delivery contains only test wiring, the current UI
oracle and this closeout. Each stage used a separate reviewed goal.

| Stage                     | Outcome                                                             | Required evidence                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 - Baseline              | Remove stale execution instructions and preserve existing work.     | Unverified checkpoint pushed; clean tracked worktree before Stage 1.                                                                                |
| 1 - Check timing          | Deferring images does not skip mechanical checks.                   | A coherent write boundary publishes first, then checks without a model or screenshot; results reach the existing store and consumer.                |
| 2 - Local acceptance      | Regional passes satisfy explicit required coverage.                 | Change one of eight regions; preserve unrelated passes and reopen actual cross-region dependencies without dropping required units.                 |
| 3 - Direct delivery       | Structural outputs transfer usable retained sets.                   | Group-to-edit uses a handle without model-side ID expansion; full outcomes, ownership, stale recovery and Undo remain intact.                       |
| 4 - Mechanical repair     | One real defect is repaired through an admitted finite recipe.      | Check/repair/recheck succeeds without replay; decision-required, no progress, cancellation and partial outcomes stop correctly.                     |
| 5 - Model handoff         | The primary AI selects capabilities and continues unresolved work.  | Discovery, recipe reuse/creation, decision return and a new execution segment work together; saving does not replay writes.                         |
| 6 - Activity              | Purpose, phase and recorded classification agree.                   | Cleanup cannot replace design purpose; late events cannot revive closed work; UI and profiler consume normalized facts.                             |
| 7 - Image checks          | Comparable local evidence receives deterministic analysis.          | Explicit coordinate mapping, scope and baseline; meaningful defects detected, unsupported comparisons reported, valid results reused.               |
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

## Stage 6 - Normalized activity evidence

### Reviewed Step Execution Card

Owner: settle activity projection and observe provider adapter. Review covered
current specification Purpose lifetime, exact Inspector settle/observe conditions,
provider progress normalization, the existing activity reducer, profiler evidence
schema and their direct formal tests. No new state machine or event store.

The provider already normalizes registered operation labels to system activity
for the UI, but computes recorded purpose from the pre-normalized work kind.
Use the normalized kind for both consumers. Preserve registered diagnostic text
as expectedResult with expectationSource, not as authored purpose. Use existing
profiler fields; do not infer a model purpose from tool names or cleanup.

Inputs: actual public progress, producer order and ancestry, authored commentary,
registered descriptions. Outputs: normalized UI events and equivalent trace facts.
Preserve current request purpose and live-parent/sibling resolution. Failure:
observer exceptions remain diagnostic only; closed/settled calls cannot revive.
Cancellation, retry and saving retain existing lifecycle precedence.

Scope: provider progress adapter, provider/presentation tests, spec and matching
Inspector condition. Cases: registered review and preparation, authored work,
cleanup, late closed-call events, concurrent siblings, phase transitions and
recorded/UI agreement. Run provider and complete presentation suites, server and
browser tsc, scoped lint/naming and same-source flow proof. No live model, new
coordinator, language change or whole-repository discovery. Review found existing
state machine owns the required lifetimes; only the inconsistent producer and its
contract need correction. Push after these gates and bounded self-review.

### Stage 6 closure

Actual provider/UI regression failed before the fix: kind was system while trace
purpose contained the registered label. After normalization the trace has null
purpose/inherited source, with the unchanged registered text in expectedResult
and explicit expectationSource. No fallback old schema or duplicate reducer.
Provider 174 passed/3 existing conditional skips, presentation 52 passed, server
and browser TypeScript passed, lint zero errors (existing console warnings),
naming and eight catalog contract tests passed. Same-source proof passed all 29
obligations, four exact negative cases and recovery. Candidate
28b5292a-4f2f-4e5e-ba1d-78ca5da65538 and contract review
f1cf188c5c8fdd65258bada79bd4d940a951d9bfe3d33d7f8057f0e53fdddc86
were accepted; source 1282c6edee18304fdff555fdc5f1d19e2d7c4b646de0d9729e23e17a47d3c01f.
Evidence: tmp/stage6-{red,provider,presentation,tsc,lint,proof,catalog-test}.log.
Self-review confirmed authored labels, cleanup, live ancestry, terminal precedence
and late-event refusal remain owned by the existing state machine. No other App
uses this Design provider adapter. No live model or broad CI was run.

## Stage 7 - Deterministic aligned image checks

### Reviewed Step Execution Card

Owner: inspect. Current inspection uses isolated target/subtree pixels, white
background and target-local region receipts; it does not capture composited canvas
occluders. Existing image owner retains immutable reference attachments and hashes.
The common check store owns pass/fail/stale results. Use these owners directly.

Add check_drawing_image for a captured native region and an explicitly aligned,
equal-size native reference crop. Require a stable checkId, inspectionId, baseline
attachment/region, channel tolerance and allowed changed-pixel fraction. The
primary agent owns correspondence and suitability; tools do not estimate camera,
warps, semantics or architectural quality. Native-region dimensions must match
actual decoded pixels. Overview/downsampled/mismatched/invalid evidence is
unverified, never a pass. Whole drawings may use their entire native rectangle
when supported by the existing capture bound. Do not enlarge capture limits.

Compare normalized sRGB pixels composited on the capture's white background;
report differing pixels, fraction, maximum channel error and local difference
bounds mapped to target coordinates. Existing Sharp dependency only. Decode has
byte/pixel/time limits, cancellation and bounded row yields. No model, remote
fetch, image repair, arbitrary callback, resizing or opaque AI quality score.

Bind each checkId to target region, immutable baseline digest/crop and tolerances;
reject changed semantics instead of erasing a failure. A fresh inspection may
replace the same obligation after correction. Validate browser dependency receipts
before reads and after asynchronous computation. Retain results in the existing
check store with inspection dependency; reuse the current result without decoding
or pixel work, prove work count. Default check reads must validate these image
receipts too. Unknown currency or cancellation cannot publish a new pass. Local
changes stale only their dependent receipt; pan/zoom and unrelated edits preserve
valid checks. No separate acceptance ledger or implicit visual certification.

Integration: register a strict input/output contract in existing operation tools;
request inspection and numeric attachment selectors remain control-plane, as
existing review tools. Provider supplies the real image owner's referenceImages.
Primary-agent visual acceptance remains required, sees stored image findings via
read_design_checks and receives compact numbers rather than pixels. Invalid input
rejects before decode; unsupported evidence returns explicit unverified recovery;
failed comparisons remain visible until a current passing recheck.

Scope: new inspect-owned comparator module, operation/provider adapter, existing
image/reference public owner, constants/prompt/spec/Inspector and formal operation
tests. No renderer, other Apps, Runtime interpreter or new dependency changes.
Cases: exact match, local defect and bounds, crop exclusion, transparent color,
unsupported dimensions/view, changed baseline/tolerance, fresh corrected capture,
stale/current/unrelated receipts, missing reference, decode failure, cancellation
and repeated-call zero work. Test production output schema and actual retained
read/invalidation path. Run operations/provider/check-store suites, types, scoped
lint/naming, formal flow proof and generated catalog equality. Add tests to an
already included formal suite; no local-only tests. Self-review all entry/exit and
failure paths before push. Stage 8 runs affected package complete suites.

### Stage 7 self-review correction

A formal recovery test showed that recording an unsupported first overview also
froze its absent region, preventing a subsequent valid native capture. Keep the
baseline/target/tolerances bound immediately, but bind a region only after a valid
native region exists. Once bound it cannot change. This resolves the same pending
obligation, not a new ledger or acceptance bypass. Added formal red/green coverage
before correcting the owner. Also separated caller checkId from store resultId so
returned arguments continue the same check without accidental prefix duplication.

### Stage 7 closure

Formal operation tests: 138 passed, including eight regional pixel cases and
actual decoder-spy reuse (two initial decodes, zero repeated decodes). Provider
transport acceptance proves capture and image check within one primary turn and
one process; no additional evaluator. Initial provider fixture omitted required
snapshot width/height and was corrected to the actual renderer contract; production
delivery validation was not relaxed. Invalid first overview recovery was red then
green. Existing provider/host/check-store/prompt suites passed (348 tests plus the
subsequently added provider and recovery cases; three original conditional skips).
Server/browser tsc, scoped lint (existing console warnings only), naming and eight
catalog tests passed. Candidate 5cd544a0-2930-401f-8b06-7aafe980c8d6,
source 1673923d24feaaf462a4a5f575e9d7ad9e925870c83eafb12682769ab591c397,
contract review b9705efbbb5972e7a1303ee7c02795de945d694617b81bf8385579399dd9603e
accepted. The initial same-source full proof failed: the stale-evidence negative
correctly also failed the newly added regional pixel case, but its exact expected
set omitted that case. The stage commit was pushed before this result was inspected;
that was an execution mistake, not a passing full-proof result. Preserve that log. Evidence: tmp/stage7-{final-operations,integrated,provider-final,
last-tsc,proof,catalog-test}.log. Production owner is Design only; shared Runtime
contracts/renderer and other Apps are unchanged in this stage.

Review covered input validation, metadata and native dimensions, fixed criterion,
resultId/checkId continuation, common result storage, targeted/default reads,
final currency validation, partial/unverified paths, cancellation before publication
and independent-region reuse. This is bounded aligned pixel evidence, not semantic
photo matching or a speed claim for an entire model drawing. No live101.

Stage 7 closure correction: inspected the captured negative result and confirmed
exactly the original three stale-evidence obligations plus inspect.regional-pixels
failed. Add the new dependent obligation to this scenario's expected set, preserving
all original cases and mutations. No production/test assertion relaxation. Re-run
positive, all exact negatives and recovery before the corrective push and Stage 8.

Corrective verification completed: tmp/stage7-negative-proof.log reports all 30
obligations, four exact negative scenarios and recovery passing (11.699 seconds).
Accepted review d6291bbed817cc5cf0ccf754ae06e947aabf416e7393f1cbc32ad6565df99657.
The earlier full-proof failure remains recorded separately; it is not reused as a
pass. This correction changes only the exact scenario expectation and plan record.

## Stage 8 - Complete package acceptance

### Reviewed Step Execution Card

Owners: the existing request/compose/prepare/apply/inspect/settle/observe routes,
plus the already changed Factory publication and Core canonical insertion owners.
Review uses the current stage contract, current implementations, diff inventory,
direct consumers and permanent tests only. No new repository-wide redesign.

Inventory against origin/main identifies Runtime, Factory, Core, SceneTree,
Preset, Design and Sim as changed runtime packages. Design and Sim are the actual
canonical creation/publication consumers; Sim journal migration is already in
Stage 3. Check other Apps for these direct contract references and shared
subscription/history effects. Preserve their existing behavior; fix demonstrated
direct regressions within this stage if required.

Run the ordinary complete test:local suites for all six framework/Sim packages,
and Design's complete test command (boundary, AI browser, server response, local
App tests). Existing opt-in live-model and resource guards remain intact: no new
101/live evaluator, PR monitoring, all-repository CI or unrelated precision suite.
Run complete affected source lint and package tsc; also run direct App-consumer
checks when the changed contract reaches them. Inspect failures promptly, complete
bounded test-first owner corrections before rerunning only affected failed gates.

Audit found five existing server regression files missing from Design's explicit
ordinary test list: check-results, containers, draft-repair, target-index and
prepared-review. Add a permanent command-wiring assertion first, prove it fails,
then include those formal suites in the existing server command. This preserves
future package test coverage; do not create a temporary replacement runner.

Whole-flow review covers deferred mechanical checks, cumulative regional passes,
structural handle success/partial/ownership, exact save and reload ordering,
finite repair/no-progress/decision/cancel paths, fresh-segment/no-replay handoff,
normalized UI/trace activity, image dependency reuse and final completion guards.
Use current formal cases, including same-source positive/exact-negative/recovery
proofs; profiler evidence is not mutation recovery authority. No duplicated
registries, interpreters, acceptance stores or legacy compatibility path.

Completion: all affected ordinary suites, lint and tsc pass; document original
conditional skips and any corrected failures accurately. Review final changes,
commit/push this stage and leave the tracked worktree clean. No PR status action.
This closes staged implementation, not a new end-to-end AI timing claim.

Stage 8 full-suite consumer correction: the ordinary Design AI suite failed an
old panel expectation that discarded the completed work subject. The current
purpose-continuity spec explicitly retains that subject in the observed processing
phase until replacement or settlement. Update that formal UI oracle to assert
the exact processing phase plus retained subject and retirement on success. No
production reducer change or weaker assertion is needed. The initial full-suite
log remains failed (`tmp/stage8-design-all.log`: 547 passed, one failed).

### Stage 8 complete validation and final review

The full ordinary affected-package suites passed on the final implementation:

| Package / consumer | Verified result                                                                                             | Local evidence                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| AI Agent Runtime   | 356 tests                                                                                                   | `tmp/stage8-runtime-all.log`                                                                                                             |
| Factory            | 289 tests                                                                                                   | `tmp/stage8-factory-all.log`                                                                                                             |
| Core               | 268 tests                                                                                                   | `tmp/stage8-core-all.log`                                                                                                                |
| SceneTree          | 211 tests                                                                                                   | `tmp/stage8-scene-tree-all.log`                                                                                                          |
| Preset             | 212 tests                                                                                                   | `tmp/stage8-preset-all.log`                                                                                                              |
| Design             | 12 boundary, 548 AI browser, 1,121 server, 152 script and 540 local tests; 9 original opt-in skips          | `tmp/stage8-boundary-final.log`, `tmp/stage8-design-ai-green.log`, `tmp/stage8-design-server-all.log`, `tmp/stage8-design-local-all.log` |
| Sim                | 13 supervisor, 874 ordinary and 9 guarded heavy/representative/witness tests; 77 original conditional skips | `tmp/stage8-sim-all.log`, `tmp/test-supervision/1791916198975037000-89058/`                                                              |
| Office             | Complete 14-test suite                                                                                      | `tmp/stage8-office-all.log`                                                                                                              |
| Starter            | Complete 44-test suite                                                                                      | `tmp/stage8-starter-all.log`                                                                                                             |
| FieldScope         | 8 supervisor and 6 direct bootstrap/history/shortcut tests                                                  | `tmp/stage8-fieldscope-direct.log`                                                                                                       |

All five changed framework packages compiled successfully. Design server/browser,
Sim, Office, FieldScope and Starter package typechecks passed. Full changed-owner
source lint and Sim/Starter package lint passed (25 existing console warnings,
zero errors); naming passed. Evidence: `tmp/stage8-*-types.log`,
`tmp/stage8-owner-lint.log`, `tmp/stage8-sim-lint.log`,
`tmp/stage8-starter-lint.log`, `tmp/stage8-naming.log`.

The current Design flow passed all 30 positive obligations, four exact injected
negative scenarios and recovery in 13.813 seconds (`tmp/stage8-contract-proof.log`).
Catalog equality passed eight tests. Earlier negative runs are expected proof
failures, not ordinary test failures. The original Design full-suite failure
remains recorded separately; only its affected AI suite and the not-yet-run
server/local suites were run after the current-contract oracle correction.

Final review followed producers through exact schemas, retained success/partial
outputs, consumers, check-result ownership, dependency invalidation, recovery,
canonical publication, persistence and reload. No unresolved in-scope defect was
found after these corrections. Existing regressions prove local acceptance
accumulation, mutation-preserving inspection failure, finite mechanical repair,
no replay during primary-agent continuation, normalized purpose/trace agreement
and native image reuse/invalidation. Sim's exact ordered insertion journal was
updated in Stage 3; Office, FieldScope and Starter direct consumers require no
additional production change. FieldScope precision profiles are unrelated to
the changed publication contract and were not run.

Limits remain explicit: image comparison requires caller-aligned native crops and
never certifies semantic appearance; primary-agent visual review remains required.
Unknown mutations are not automatically replayed. No new live101, model timing
claim, model change, PR operation or monitoring was performed. Local evidence and
recordings remain ignored. Final delivery follows the user's per-stage push
authorization after the actual-head metadata checks.

## Live workload correction - 2026-10-14

### Evidence, scope and reviewed connections

Frozen baseline: ignored run `reusable-tools-1791943630483`, analysis.md and raw
records, source 4e28aa8a7. First visible 109.308s, main construction 206.578s;
7,718 fill targets written in a 2.107s overlapping action interval; only 2,836
post-write checks completed in 3,352.661s, with 356.200ms browser handler time.
The current code performs a separate exchange per target and replays accumulated
activity on every panel render. Browser root recording stops at 288.051s while
the server drawing record reaches cancellation at about 3,645s. This is a
record-completeness defect, not evidence that the request lasted 288 seconds.

Discovery is limited to the actual operation/check/store producer-consumer chain,
conversation/activity subscriptions, recorder/outbox/collector, local live harness
and their formal tests. No geometry, model, scene-tree, document transaction or
other-App redesign. Runtime fixes include direct consumers when necessary.

Implementation sequence:

1. Inspect: exchange bounded groups of independent exact-target checks and stamp
   validations through the existing batch route, preserving every target result.
   Do not replace targets with a containing group or widen dependency invalidation.
2. Settle: retain activity projection at its conversation lifetime and make the UI
   consume it. Eliminate accumulated replay/copy work, preserve authored purpose,
   true check phase, concurrent causality and terminal transitions.
3. Observe: reproduce the interrupted delivery and repair its first incorrect
   owner; preserve bounded capture, local durability, acknowledgements, gaps,
   reconnect/cancellation and independence from product settlement.
4. Local harness: independent 900-second timer cancels the owned request/provider
   without waiting for a busy page; permanent deterministic deadline regression.
5. Self-review, affected tests/lint/types and integrated representative workload;
   then one live recorded test with timing, reference and completeness analysis.

Review: batch transport is not a new review algorithm or ledger. Each canonical
result retains its own action ID, scope and evidence. Failed/missing/duplicate or
late receipts cannot become passes; completed writes are never replayed. Work
must be bounded on the real consumer path, including result adoption and UI
updates, not merely inside the geometry handler. The deadline owns only the test
request and its processes; it cannot kill unrelated sessions or discard content.
No new dependency or relaxed assertion is planned. Fifteen minutes is a hard
acceptance condition, not a promised model duration.

### Step Execution Card - inspect bounded transport

Owner: inspect / apply-to-inspect. Authority: execution spec Capture and
deterministic review responsibility; Inspector inspect exact-target retained
checks, scoped invalidation, no-model and cancellation conditions.
Inputs: acknowledged target set, current canonical stamps and cancellation.
Outputs: the existing check store and compact check summary; unchanged mutation
receipt and separate exact unresolved-target diagnostics. Current stamps reuse
existing validation semantics in bounded transport groups. Missing stamps check
once; per-target findings remain intact. No screenshot or model is introduced.
Allowed: local-operation-tools and its existing tests, current spec/Inspector
contract and generated catalog only where necessary. Forbidden: changed geometry,
new acceptance store, broad invalidation, raised admission limits or write replay.
Failures: preserve acknowledged per-action checks from partial batches, mark only
unavailable results unresolved; cancellation stops successors and late adoption.
Proofs: cold 7,718-target workload with bounded exchange counts; warm reuse;
one stale dependency; mixed findings/missing/duplicate acknowledgements; partial
batch and cancellation. Run focused operation/workflow/flow tests, types, lint,
naming. Review direct consumers and the current Inspector before advancing.

Inspect slice evidence: the 7,718-target permanent regression failed with 7,718 exchanges, then passed with at most 121 exchanges; warm evidence does not remeasure, and one stale target remeasures only itself. Independent reads resume only the proven unexecuted suffix after an exact fail-fast action failure; unknown transport outcomes stay unverified. Cancellation admits no late result. Existing workflow fixtures now execute every submitted action with canonical fail-fast receipts instead of assuming one action per exchange. All 201 operation/workflow tests, server TypeScript and focused ESLint pass (`tmp/live101-inspect-final.log`, `tmp/live101-inspect-types.log`, `tmp/live101-inspect-lint.log`). No source mutation was replayed.

### Step Execution Card - settle incremental presentation

- Owner: existing settle route, conversation controller and activity projection, panel, direct tests, current provider mechanical-inspection observation.
- Input/output: actual progress events become the same lifecycle-aware purpose/phase view. Append each event once; render consumes the retained projection. Raw progress remains available as an immutable point-in-time read, materialized only on demand. Collapsed history must not render or traverse all entries. Conversation selection, terminal outcomes, stop, confirmation and questions retain current semantics.
- Proof: count access to old event fields while repeatedly reading the controller/panel current activity; work must not grow with replay of all previous events. Verify immutable historical snapshots and demand-open history, existing lifecycle tests and panel tests, browser/server TypeScript and lint.
- Exclusions: no language, model, purpose-authority or progress-event truncation changes. No timing-only pass oracle.
- Self-review: state remains turn-owned; no cross-request cache, secondary reducer or React props comparison. Terminal and approval overlays are applied to the retained state, independently of provider progress.

Settle evidence: 113 conversation/presentation/panel tests and 317 provider/operation tests pass (three original provider opt-in skips). Production browser/server types and focused lint pass. A retained projection consumes each event once; the 300-publication oracle reads no old event fields. Snapshot progress stays immutable at its captured length. Collapsed history has zero rows until explicitly opened. Mechanical measurement emits one observed checking child per bounded exchange and closes it even after failure.

### Step Execution Card - observe durable batching and live evidence

- Owner: Runtime delivery sink/outbox contract; Design IndexedDB adapter; direct tests/spec. Existing observe route governs sequence completeness, bounded capture and recovery independent of product execution.
- Finding: saved baseline ends at sequence 7,209 / 288.051 seconds; console delivery issues were not captured, so the exact historical interruption cause is unproven. Source does prove one strict IndexedDB transaction per event and delivery waiting for the whole growing write queue. Do not mislabel those findings as a recovered baseline error.
- Change: persist bounded record batches in one atomic host transaction, keep the existing pending-byte limit and per-record sequences; deliver the durable prefix without waiting for producer quiescence. Keep known gaps explicit, exact acknowledgements, recoverable transport suspension, no fabricated terminal, no product replay. Update the single outbox contract and all consumers rather than add a compatibility branch.
- Proof: bounded append work count, atomic failure/reopen with the real IndexedDB adapter, delivery while a later append is pending, cancellation/terminal flush, existing offline/recovery and gap tests. Record console delivery warnings and final local outbox state in the next local-only live harness.
- Self-review: independent durability remains strict, chunks never mix request ownership, failed persistence marks the entire affected chunk, memory limit unchanged; diagnostic failures never cancel product work.

Observe evidence: 1,024 records previously required 1,024 strict storage appends; now at most 32 atomic batches preserve every sequence with the same 2 MiB capture limit. A blocked second batch no longer prevents delivery of the first durable prefix. Real IndexedDB quota/duplicate failures roll back the whole batch and preserve a truthful enclosing gap after reopen; they do not claim individual records survived. Historical interruption attribution remains unknown because warnings were absent from that run's evidence.

### Step Execution Card - local live deadline

- Owner: local-only live test driver and a permanent testable deadline helper; no App runtime timeout or model change.
- A separate worker starts a monotonic timer at Send with an absolute 900-second boundary. At timeout it records failure and terminates only the explicitly owned Vite/provider process group and owned test browser process tree. It must not wait for page evaluate, screenshots, a DOM cancel button or polling. A finished-before-deadline run disarms it; a late completion cannot turn failure into success.
- Ownership: the driver starts and verifies these services/browser and passes their exact PIDs. No user browser or unrelated server is targeted. Normal completion keeps final fit and ten-second video hold outside execution time; timeout terminates drawing first, then attempts evidence cleanup.
- Proof: permanent short-deadline child-process tests, including a blocked main test driver and pre-deadline completion; no actual AI calls. Verify the production live configuration is exactly 900,000 ms. Record the observed expiry and process stop times, not a hard-real-time guarantee the OS cannot supply.
- Self-review: no polling-only watchdog, no raised timeout, no full101 repeated automatically, no restoring monitoring. The fixture and video remain local; the helper is a reusable local-test safety boundary.

Pre-live self-review: exact-target handoffs, fail-fast continuation, cancellation, retained validity, controller lifetime, collapsed/history rendering, durable prefix acknowledgements and atomic failures were checked against direct consumers. Runtime 358 tests pass; Design 30 flow proofs, 113 conversation/UI tests, 317 operation/provider tests (three original opt-in skips), and 12 storage/startup tests pass. Production TypeScript, focused lint and 15 naming checks pass. The deadline helper passes three permanent local safety tests, including termination during a blocked driver. Existing services are rebuilt; the next step is one frozen-source live run, with no code edits during drawing.

### Observe iteration replan - measured live recording overflow

The live run `reusable-tools-1791949367770` completed product work in 626.779 s
with 29,912 nodes. A real 5,205-target correction plus mechanical inspection took
2.774 s. Recording acceptance failed: capture overflow began at 408.595 s, and
remote browser video export used the wrong API. Keep this run and its gaps as
failed evidence; do not reconstruct missing records or claim video delivery.

The previous count-batched persistence proof was insufficient for sustained
bursts. Replace transaction-count partitioning with a byte-bounded transaction
(256 KiB, a single larger record remains individually bounded by the existing
capture limit), preserving the 2 MiB pending limit and strict atomic durability.
Split at discontinuities after loss; never turn a capture gap into an invalid
storage batch. Prove sustained producer bursts against delayed storage, bounded
transaction bytes, prefix delivery, atomic rollback and reopen.

The durable file collector must not retain an ever-growing digest array or reject
long valid streams merely because they contain 50,000 events. Retain a bounded
recent digest window and verify older retries from the authoritative local file.
Restoration streams the file with bounded memory. Sequential old-prefix retries
reuse a bounded read cursor; conflicting retries and malformed persistence still
fail before any new event is written. Explicit host record budgets remain enforced.
This is storage-owner work, not a relaxed diagnostic validation contract.

Local harness corrections: save remote video with `saveAs` before closing its
browser server; prove a short recorded session is decodable before live AI.
Console diagnostics use append-only JSONL plus bounded summaries, never rewrite
all previous warnings for each new warning. Preserve the independent 900-second
watchdog. Do not change product geometry, models, review admission or delivery
limits to make this evidence pass.

Self-review: the bounded owner remains observe; storage throughput and retry
identity belong to the existing Runtime/host outbox and file collector. Extend
only their direct tests and contract documentation. No dependency, parallel
record owner, fabricated completion or product replay. After focused gates and
recording smoke evidence, run one new frozen-source full101 test.

Observe iteration evidence: the paced-burst oracle failed on the previous 32-record
partition and passes with byte partitioning at the unchanged capture budget.
A capture hole no longer creates a noncontiguous storage batch. Runtime suite:
361 tests passed, followed by the additional bounded-retry-window oracle (four
file collector tests passed). Browser storage/startup: 13 passed, including
large atomic batches and reopen. Current execution-flow proof: 30 passed.
Production types, focused lint and naming pass. Four permanent deadline/remote
recording tests pass; a real remote Chrome video survives server disposal.
Long durable streams beyond 50,000 records retain exact conflicting-retry
rejection and terminal recovery, with bounded recent digests and sequential
file cursors. No product source changes follow this frozen-source live boundary.

Final frozen-source live acceptance: `tmp/ai-recording/runs/reusable-tools-1791951004329`.
First visible observation 79.678 s; UI success 575.543 s; final video export
589.259 s after Send, within the 900-second deadline. Final document 16,802 nodes.
Actual 3,072-target correction/check completed in 1.378 s; final mechanical store
3,094 pass / 0 fail / 0 stale / 0 unverified. Final visual criteria 7/7 retained;
refreshing mechanical evidence reused the same eight inspection images. Twenty
record streams are complete, browser outbox empty, zero page errors or delivery
gap warnings. Two existing Pixi warning stacks remain. Video saved and three
positions decoded/viewed; actual two references viewed and linked. Detailed
analysis distinguishes six recovered non-success/partial tool calls, including
query reservations and unavailable immediate mutation-delivery receipts, from
completed backend save streams. It does not claim all handoff friction is gone.
Workloads differ across runs; no total-time speedup ratio is asserted. Services
are closed, local evidence preserved, no push or monitoring resumed.

Push checkpoint - 2026-10-14: user authorized publication before a read-only
review of remaining receipt, query-lifetime and response-delivery issues.
Current-source gates passed: Runtime 362 tests; Design server 407 tests with
three existing opt-in skips; browser/controller/storage 126 tests; four local
deadline/video tests; Runtime build and Design browser/server typecheck; naming
15 tests; focused lint with zero errors and three existing console warnings.
The catalog equality gate first detected a stale generated snapshot, then passed
all eight cases after the existing generator refreshed the four new conditions.
The generated README check first detected hand-authored adapter documentation;
the same text now lives in the maintained Runtime package guide, and all 19
README checks pass. No runtime source changed during these publication checks.
Evidence: `tmp/push-101-repairs/`. No full CI, repeat101 or monitoring.
Evaluate repairs by the original failing scenario, preserved correctness and
work counts; scene node count is descriptive, not a success/failure criterion.
The public documentation gate also detected generated API/guide indexes behind
the current source. Existing generation synchronized the new exported byte
bound and guide hashes; validation passes for 41 pages, 19 guides, 291 local
links and 135 API references (`tmp/push-101-repairs/docs-final.log`).

## Post-live handoff corrections - 2026-10-14

### Bounded contract and reviewed sequence

Fix the observed handoff failures, not scene complexity. The source checkpoint
is 713805aaa49692a6406d73eb6b7a92b6276a1aa8. Discovery is limited to the affected
Runtime action wrapper, Design transaction/action/query owners, operation tool
projection, descriptor delivery and their direct consumers/specs/tests.

1. Runtime apply: forward the optional settlement callback unchanged to the host
   executor. The host chooses its synchronous publication boundary. Prove actual
   Runtime invocation reaches the structural receipt publisher and its next
   consumer; cancellation, throwing mutation, callback failure and optional
   recording must not cause a second write or duplicate notification.
2. Query apply: add an explicit transient identity delivery to the existing
   context reader for complete region targets. It uses the same canonical
   selector/validation and never publishes a reusable handle or reserves a
   retained entry. A matching retained query may supply its existing selected
   identities without acquiring/releasing the caller's lease. The backend
   deduplicates query selectors within its current operation batch and retains
   only the copied target IDs until ordinary mutation admission. Prove more than
   eight distinct queries with the unchanged eight-entry budget, pinned external
   consumers, invalid/count/empty/cancel paths and later admission failure.
3. Operation delivery: recognize only the exact canonical successful outcome
   for compact valueless write acknowledgements. Preserve unknown, partial,
   failed and unavailable receipts in full. Original receipts and mutation scope
   reach validation/invalidation and existing execution recording before model
   projection. Structural outputs keep their existing immutable readback handles;
   full response at initial invocation remains available. Do not introduce a
   second receipt store or suggest rerunning writes for readback. Prove real
   action outputs, ordered counts, unchanged original scopes, compact bytes and
   failure preservation, including successful prefixes of failed batches.
4. Compose delivery: verify descriptor identity/revision/coverage/field-set
   reuse, changed definitions, scoped recovery and explicit delivery-failure or
   context-loss recovery. A previous response is not proof the model received it.
   The recorded full refresh is not by itself a duplicate-delivery bug. Only
   change production behavior if a formal counterexample requires it.

### Self-review before implementation

The apply and compose Inspector contracts already require synchronous settlement,
exact ownership, original receipt checking and scoped definition recovery. The
query extension needs an explicit transient output branch: no fake handle and no
optional weakening of retained success. Restrict transient reads to complete
region IDs. Public retained page/reference/column consumers remain pinned.
Reject transient snapshot/metadata requests, foreign/released handles and
incoherent reads. Do not fix capacity by raising limits or releasing caller data.

All writes retain current permission, existence, revision, cancellation and Undo
admission. Delivery or callback failure cannot replay a completed mutation.
Compact projection must not erase findings or failure settlement. No new model,
callback interpreter, background task, repository-wide migration or dependency.

### Execution cards and closure

Owner 1: Runtime apply wrapper and existing Runtime/App structural tests.
Owner 2: Design context action/schema and retained query owner, operation target
resolver, their formal tests, current apply specification and Inspector condition.
Owner 3: Design operation result projection and existing canonical result tests.
Owner 4: compose discovery definition tests and current description only if needed.
Each starts with a failing regression where behavior is wrong, then implementation,
focused tests, type/lint checks and direct-consumer review before advancing.

Final gates: affected Runtime suite/build, Design server operation/ownership and
browser query/structural/transaction tests, production browser/server typechecks,
focused ESLint, naming, current generated catalog equality and documentation
checks if contracts change. No entire local CI or full101. Retain failed evidence
as failed. Completion requires all four handoffs verified with remaining limits
reported; leave changes local and monitoring disabled.

### Handoff correction review evidence

Runtime apply regression failed on both missing notification and swallowed
settlement error; the real Runtime-to-structural-action regression failed before
fixing the wrapper. The host callback now passes unchanged, without invocation
or replay in Runtime. Subsequent full receipt recovery uses the actual Runtime
request signal, not the external caller signal; the ownership assertion correctly
caught that fixture mistake. Runtime 16 and structural 14 focused cases passed.

Query apply regression reproduces capacity exhaustion with eight accepted pins.
The value-only path uses the existing query computation and borrows cached
identities without borrowing/releasing a lease. Sixteen internal regions now
resolve with all eight accepted pins intact; repeated selectors avoid a new
spatial selection. Native schema conversion and browser runtime reject unsupported
transient shapes. Output review added a counterexample for a transient result
masquerading as retained by supplying fake handles; keep output alternatives
explicitly disjoint. Normal query and operation suites passed 25 and 143 cases
before this additional contract oracle.

Compose verification uses the existing exact discovery/recovery tests: changed
native registry generations, revisions, removed recipes, full/usage/field coverage,
path ordering, partial recovery and explicit context/delivery loss. No evidence
supports removing recovery or increasing limits. Production definition delivery
is unchanged. Its provenance means returned, never confirmed model receipt.

Remaining closure is current-source integrated regression/type/lint verification,
including failure/cancellation and original receipt preservation. This is not a
new live101 speed claim and is not measured by scene node count.

### Query handoff iteration - preserve typed composition

The existing real query-to-fill recipe rejected the draft union output: changing
one retained query action to optionally return no handle makes the next typed
step unable to rely on that handle. This is a contract-design defect, not grounds
to weaken recipe admission or preserve an old format through compatibility.
Re-review chooses two exact contracts in the same registry and query owner:
`read_design_context` always delivers retained references; the new batch-only
`resolve_design_targets` delivers transient region identities only. Both use
canonical query validation/computation. The latter has no public lifetime switch,
handle, cleanup callback or independent cache. Internal target.query uses it.

Owner/card: apply plus its compose admission consumer; inputs are registered
region bounds/filter/expected count, output is complete copied IDs or rejection.
The existing query store owns computation and cancellation; action constants,
effect metadata and runtime-input register the one new read action. Existing
read/refinement/page/release contracts and recipe bindings remain unchanged.
Allow those exact registration files plus context/operation tests in this slice;
no new tool engine, registry, model exposure route or store. The existing failed
query-to-fill composition test is the preservation oracle. New resolver tests
prove no capacity reservation, no fake handles, input/native equivalence and
failure before writes. Re-run ownership/operation/query tests, types/lint/naming
before closing. This supersedes the draft output-union detail above.

Registration consumer review: the existing startup test detects the new action
missing from the explicit App permission policy. Add only this canonical read
identifier to that policy and its standard activity label; unknown actions still
reject. These are direct registration consumers within the current Inspector
allowlist, not a permission redesign. The Node-only flow proof uses its protocol
fixture and the current resolver identity; importing the browser action factory
there incorrectly pulled browser globals into the server proof/typecheck. Actual
browser contracts remain tested through the real factory in focused tests.

### Ordered handoff correction closeout

All four reviewed boundaries are verified. Runtime forwards the exact settlement
callback to the host transaction, including recording on/off, failure and
cancellation. The actual Factory transaction and Runtime prove group-to-readback
and group-to-edit without a child query or replay. Region targets use the separate
value-only action through the existing query owner; all eight existing retained
pins survive sixteen distinct internal queries. A final regression exposed an
equivalent selector with reordered object keys performing a seventeenth spatial
read. Canonical record-key ordering now deduplicates it within the operation batch
while preserving array order and all seventeen requested writes. Capacity is
unchanged. Cancellation and unknown read settlement cannot proceed to writes.

The actual basic-action/observation/Runtime/transaction/server chain proves
compact success for sixteen plural edits: all 3,072 affected identities reach
recording and the existing check owner; the model receives acknowledgements and
one actionable pending reference, under 2,000 serialized bytes and under one
tenth of the original receipts. Failure, partial/unknown settlement, unavailable
delivery and unknown extensions remain explicit. This measures transfer and
work, not drawing quality, scene complexity or model latency. Definition delivery
already meets request/revision/view/field identity and recovery contracts; its
existing formal tests pass, so production discovery is unchanged.

Final verification: Runtime 370 tests plus build; Design AI 554 tests; server
handoff/ownership 221 tests; the affected real structural integration 15 tests
rechecked after the query-key correction; browser/server production typechecks;
focused lint (zero errors, two pre-existing console warnings); naming 15;
generated catalog 8; documentation and task-context checks. Query owner and
schema-focused regressions also passed in their owner slice. Evidence is in
`tmp/handoff-{runtime,ai-suite,server,structural,types,lint,naming}-final.log`,
`tmp/handoff-catalog.log` and `tmp/handoff-docs.log`. Failed red and intermediate
draft-contract evidence remains failed; it is not included as passing validation.

Current Design source candidate `8b5f2ec1-60ed-4e7e-870b-7cd273375416` passed at
source `93174d30ab833e6f0d61a74c86026b67c717df3239da9c74d234487fb6c6cb0f`.
Reviewed contract `fe046cc8e2975ac2a0e689fda4663cd685a9f9b23862fe028c67cadd1a006239`
was accepted with no blockers. Final bounded review covered producers, registered
schemas, policy admission, lifetime, failure/cancellation, downstream composition,
recording and compact response consumers. No new registry/cache, compatibility
path, higher limit, extra AI evaluator or model change was introduced. No new
full101, whole local CI, push or monitoring occurred. Full drawing elapsed time
and first-frame improvement remain unmeasured by this correction task.

The same-source final Flow proof also passed: one flow, four intentionally failing
negative scenarios, thirty obligations and successful recovery
(`tmp/handoff-proof-final.log`). Those injected failures are required negative
evidence, not unresolved product failures.

## Discovery and activity correction - 2026-10-14

### Bounded contract and reviewed sequence

Observed source: HEAD 713805aaa plus the completed local handoff changes. Frozen
run reusable-tools-1791965887247 proves discovery advertised review_design as a
batch action while batch admission rejects it. Taipei/ornament queries establish
unsuccessful capability lookup, not proof of the model's private intent.
Completion retains an expired call purpose. Long-window evidence is in the run's
tool-status-timing-audit.md and action-timing-breakdown.json.

1. Compose: derive batch schema, batch admission and advertised routes from the
   same admitted action set. Keep explicit mechanical review/capture on their
   existing native owners so findings and image evidence are processed correctly.
   Discover their actual native wrapper, including argument wrapping; unavailable
   or ambiguous native bindings never invent a namespace or executable route.
   Cover exact names/operations, menus, lexical results, candidates and definition
   reuse/refresh, preserving independent recipe contracts.
2. Compose: distinguish capability lookup from subject/reference research in
   existing App/tool guidance. Publish compact registry-derived menus and include
   native/saved capabilities in lexical search. Unknown terms return capability
   choices and research guidance without automatic dispatch, subject lists or a
   new model/classifier. Known tools remain directly callable. Full/partial exact
   schemas and explicit recovery remain available; lookup does not reserve them.
3. Settle: every ordered start/end updates live invocation state; completed call
   text cannot survive as current work. Preserve objective, live ancestry,
   concurrent siblings, retries, cancellation and terminal precedence. Deduplicate
   only projected presentation. Remove superseded segment-purpose retention,
   not another fallback or timeout. Preserve current authored language.
4. Observe assessment: retain exact-ID exchange timing for the frozen run and
   distinguish provider-side intervals from inclusive App work and research.
   Identify measured apply substeps without double-counting. No speculative
   performance change, inference-time claim or new full drawing is authorized by
   this measurement slice; concrete owner regressions may be repaired within the
   affected discovery/status handoff, not a renderer/storage redesign.

### Plan review and execution cards

Compose card: owner compose; spec capability-discovery-and-composition and shared
contracts; Inspector compose inputs admitted registry/request, outputs callable
program, failure owner compose. Allowed contributors actual native inventory,
canonical action definitions and existing prompt. Boundary local-operation-tools,
ai-domain-prompt and their existing tests plus current spec/Inspector. Inputs are
unchanged selectors; outputs exact routes and bounded capability menus. No web
request, canvas operation, permission relaxation, separate registry or extra AI
occurs during discovery. Formal tests must reproduce the false batch route and
native search omission first, then prove all discovery surfaces and actual native
invocation agree; unavailable registration and query pagination remain explicit.

Settle card: owner settle; spec purpose-lifetime; Inspector ordered progress to
visible outcome, failure owner settle. Boundary activity-state and presentation
formal tests plus direct panel/progress consumers. Inputs current request/attempt,
sequence, call/parent ID, phase and authored purpose. Outputs live purpose/phase
and diagnostic selection. No inference of model work from elapsed time; no stale
purpose retained after completion. Red/green regressions cover completion with
no objective, objective fallback, parent/sibling work, late events, duplicate
visible starts, retry and lifecycle controls. A new work purpose must have a new
valid invocation or explicit request purpose, never revive a closed call.

Feasibility review: native wrappers already own explicit review/capture result
processing; route metadata must preserve wrapper inputs rather than removing the
batch restriction. Native inventory is lazy and revision-aware, so discovery must
not snapshot it at owner construction. Search choices are advisory, not dispatch.
The status reducer already stores ordered active calls; remove stale retention
while retaining that owner and its concurrency semantics. Scoped schema reuse
keys and full definitions remain independent of compact menus. Terminal events
must update state even when the visible projection is identical.

Gates: regression-first operation/prompt tests; presentation plus direct panel and
provider progress tests; affected server/browser production tsc; focused ESLint,
naming, current generated Inspector catalog equality and same-source flow proof.
Only current-task/direct-consumer failures may expand tests. No full local CI.
Stop if the canonical input/output or owner cannot support the promised route;
revise this bounded contract before further implementation. Finish with local
review and a report, not remote operations or automatic monitoring.

### Settle handoff review refinement

Focused reducer tests passed, but the real panel integration exposed a direct
consumer identity mismatch: a new event with identical visible content creates a
new current entry while deduplication retains the previous history entry. The
panel intentionally marks the current entry by identity, so its current marker
vanishes. Keep one canonical visible entry when content is unchanged, after the
new state has already consumed the event. A formal identity regression fails
before the fix. Preserve historical snapshot immutability, lifecycle precedence,
and event diagnostics. This is within the settle projection boundary, not a new
UI state store or a timeout workaround. Re-run the three direct browser suites,
the exact 360/1280 activity E2E and inspect its screenshots before closure.

Additional review regressions prove same-text request purposes replace their
invocation identity and completion during approval retires the call without
resuming execution. Superseded completed-purpose assertions in panel/conversation
fixtures now expect the original objective; retry safety checks remain intact.
The first mixed node/browser invocation was an invalid environment invocation;
it is not passing product evidence. Subsequent corrected browser failures and
E2E failures remain recorded as failures until the bounded corrections pass.

The subsequent full activity E2E passed the event sequence and current marker,
then exposed a direct panel handoff: opening history measured scroll extent
before lazily mounted rows existed, so Jump to latest stayed absent. A permanent
single-toggle regression uses rendered row presence as its height oracle and
fails on the current panel. Move this existing measurement after history layout;
do not change follow policy, add polling or weaken E2E assertions. This bounded
consumer correction is necessary to preserve the same affected activity view.

### Discovery and activity correction closure

The advertised execution route now comes from the same admitted action set as
batch input schema and batch resolution. Explicit review and capture resolve the
actual design_operations native wrapper and its arguments envelope. Missing or
ambiguous wrappers are unavailable; a saved same-name tool cannot substitute.
Exact, partial, repeated, refreshed, category, candidate and lexical views retain
the correct route. Native/saved lexical menus omit full schemas without marking
exact definitions delivered. Capability lookup guidance distinguishes external
reference research and does not require repeated lookup of known tools.

Canonical activity consumes ordered starts/completions before presentation
filtering. Completed call purposes expire, equal-text request purposes retain the
new invocation identity, and approval acknowledgements close work without
resuming execution. Live parent/siblings, request objectives, retries and terminal
precedence remain. Identical presentation reuses its history entry for the panel
current marker; disclosure geometry is measured after lazy rows mount. No stale
segment retention, timeout, extra AI or separate activity owner remains.

Verification: 391 operation/prompt/composition/provider tests passed with three
existing conditional skips; 122 presentation/conversation/panel tests passed;
360/1280 activity E2E both passed (16.0 seconds). Browser/server production tsc,
scoped ESLint (zero errors, three existing console warnings), naming 15 and
current generated catalog eight tests passed. Same-source flow proof passed all
30 obligations, four exact injected negative scenarios and recovery on source
b1173136c7de44bdb7c6c6a81658da2c45b42672a1a7848ee6f85d947537db47.
Candidate 2420f57c-0b4a-4545-8554-6985cf920383 and contract review
9ec371d79acb79323d6f6ba3c81dd97f513233c0be4441d4fb10104b0e40ce2b
were accepted with no blockers (mapping revision 73). The mapping-only command
was inappropriate for the architecture change; supported contract acceptance was
used before the successful proof. Failed/interrupted exploratory runs remain
failed, not relabeled as successful evidence.

Visual evidence: APP_URL http://127.0.0.1:3300, existing real App activity E2E,
360x900 and 1280x900. Deterministic streamed status, no canvas mutation; initial
viewport/document state follows the existing fixture. Screenshots
completed-call-purpose.png and current-activity.png were inspected: completed
Base surfaces returns to the request objective with AI processing; actual active
purpose remains visible. No visible mismatch found in these scenarios. All three
Playwright-owned service ports 3300/3401/4401 were confirmed closed after exit.
The local report records exact commands and artifact paths.

Timing assessment retains the frozen full101: all 50 App exchanges match exact
native call IDs; two research calls are separate. Six exchange windows exceed
30 seconds, primarily before dispatch, not inside App tools. The largest App
call is 12.826 seconds including approximately 12.333 seconds of apply. This
correction removes demonstrated route/status defects; it does not claim measured
model-time or end-to-end speed improvement. No new full101, full local CI, push
or monitoring was performed. Final review is closed at the scoped report.

Final metadata check: task-context initially selected the new local subsection,
which cannot exist in the committed base. Its association now uses the existing
Current authority and stop boundary heading; that heading explicitly selects this
bounded correction. Preflight and public documentation validation passed. No
base/history rewrite or scope expansion was used to satisfy the check.

### Product-facing processing label - 2026-10-14

User refinement: the panel speaks for the product, not the model. This bounded
copy correction belongs to the existing settle/activity presentation owner.
Replace the provider phase display label with "Processing your request" while
retaining the current valid purpose. Internal provider classification, ordered
start/end events, purpose expiry, approval/save/terminal precedence, history
identity and diagnostic ownership remain unchanged. No new status inference or
retention policy, catalog fix, dependency, push or monitoring is included.

Review: the existing settle flow already separates phase and purpose. Change
only its display literal and direct expectations; do not change the flow
semantics or introduce an alternative renderer. Existing presentation and actual
panel tests cover live work, completed-call retirement, original objective,
failure and final settlement. Update their expected product copy first, prove
the panel regression fails, then run both focused files, browser production
types and focused lint. This does not close the separately observed long
objective fallback or sub-200ms presentation churn.

Validation: the actual panel regression first failed on the old label, then
95 presentation/panel tests and 27 conversation tests passed. Updated direct
360px/1280px streamed-history E2E expectations; both passed (19.1s). Browser
production tsc and focused ESLint passed. The only production change in this
follow-up is the provider display literal; lifecycle and purpose selection are
unchanged. Existing dirty work is preserved. No commit, push, full CI, live 101
rerun or monitoring was performed.

## Pagination and concrete activity correction - 2026-10-14

### Frozen scope and reviewed design

Fix discovery page validation and concrete current work presentation. Preserve all
existing work. No push, monitoring, model change, extra model evaluator, full101,
or full local CI. Discovery searches capabilities, never subject references.
Discovery emptiness is a valid complete result, not a failed invocation.

1. Compose owner: one page boundary uses `count`, `offset`, `complete`, and
   optional `next`; the returned count is `apis.length + tools.length`. Native
   category, API category and mixed lexical query use the same boundary producer.
   End offsets are valid; offsets beyond the inventory fail before delivery.
   The actual invocation result validator rejects inconsistent totals, malformed
   collections, unusable continuation and continuation on a complete page.
   Menus remain compact and do not consume exact-schema delivery.
2. Settle owner: request-scoped public commentary describes a concrete stage
   intent (target and purpose), not a claim that pixels are currently changing.
   It survives individual child invocations until newer stage commentary,
   explicit stage completion, retry or lifecycle settlement. The primary AI
   publishes it before preparing inputs and changes it when the task changes.
   A call purpose remains call-scoped and expires on completion. Stage intent is
   the visible umbrella while present; without it, use a genuinely live common
   call purpose. Do not echo the full original objective as current work.
3. Visible current work shows that concrete purpose without a generic phase
   prefix. Same-purpose system phases and changing child counts do not create
   history entries or announcements. All starts/ends still update state and
   diagnostic actual phase/count. No debounce, timeout, guessed phase, additional
   model request or copied completed call purpose. Without authored purpose,
   retain an honest observed phase; do not invent specific work.
4. Approval, stopping, saving, failure and terminal outcomes override purpose.
   Reject late/old-sequence events, retain live ancestry and sibling isolation,
   and clear stage intent across attempts. Full text stays available with the
   existing three-line preview. No language normalization.

### Step cards and bounded evidence

- Compose: implementation boundary is local-operation-tools, its formal tests,
  ai-domain-prompt and its tests. Inputs are admitted selectors and canonical
  descriptors; outputs are valid compact pages and primary-agent guidance.
  Failure remains a recoverable invocation failure, without executing canvas
  actions. Prove native/API/mixed/empty/end pages through invokeLocalTool and
  corrupt-output rejection; retain exact-schema and inventory-revision tests.
- Settle: implementation boundary is activity-state, presentation tests,
  conversation/panel tests and existing conversation E2E. Inputs are ordered
  existing public progress events; output is concrete current work plus separate
  observed-phase diagnostics. Prove repeated start/end work counts with unchanged
  purpose, stage replacement/completion, call expiry, concurrent ancestry,
  retry, cancellation and terminal protection. Verify real panel narrow/wide
  rendering and history identity. No timer-based suppression.
- Synchronize the purpose-lifetime spec, compose/settle Inspector contracts and
  generated catalog. Reuse supported source proof and contract admission.
  Run affected tests, production typechecks, focused lint and naming only.

### Self-review before implementation

The previous contract explicitly erased stage commentary on authored call start;
that made provider gaps fall back to the whole request. Retaining the last call
would instead revive completed drawing. A separately owned stage intent resolves
both without copying transient text. Stage accuracy depends on the primary AI
announcing an actual stage change; deterministic tests prove transport/lifetime,
not model compliance. Call start/end facts remain observable independently of
visible deduplication. Native `total` is replaced by canonical `count`; no legacy
fallback or second catalog is introduced. Empty/end pages, registry changes,
concurrent work, missing purpose, old events and lifecycle overrides are covered.

### Correction verification and closeout

- Discovery regression first failed through invokeLocalTool; final owner suite:
  165 passed (`tmp/pagination-purpose-green-final.log`). Pages use one boundary
  producer, mixed entry counts and canonical `count`; corrupted completion,
  missing completion, malformed arrays and unusable next offsets fail validation.
  Actual provider protocol proof also executes the recorded `delete elements`
  query and native category through the common host with successful delivery.
- Stage stability regression first failed. Forty child operations and all 160
  start/phase/end updates preserve one visible purpose/history entry while actual
  phase/count diagnostics change. A separate red/green regression closes replaced
  stage identities, preventing late commentary from resurrecting them.
- Presentation, conversation and panel: 123 passed
  (`tmp/purpose-consumers-final.log`). Server prompt/provider/invocation/discovery:
  411 passed with three existing conditional skips before the final additional
  missing-boundary regression; the affected discovery suite subsequently passed
  all 165 tests. No skipped test was used as positive evidence.
- Streamed panel E2E at 360/1280: two passed in 21.1 seconds
  (`tmp/pagination-purpose-e2e.log`); concrete purpose stays stable across query,
  inspection and completion events with no new history rows. Inspected actual
  completed-call and wrapped-current-purpose screenshots; full title/DOM,
  three-line preview, history position and following behavior are preserved.
  Tests own their temporary 3300/3401/4401 services; all listeners exited.
- Browser/server production TypeScript checks exit 0. Scoped ESLint: zero errors,
  one existing console warning in the execution proof fixture. Naming: 15 passed.
  Generated Inspector catalog: eight passed; task-context preflight and diff
  whitespace check passed. Logs use `tmp/pagination-purpose-*`.
- Final candidate `87be970e-8891-4d57-bd2e-fff61b8affca`, source
  `79a868b5328a7ef5307d55199162d294dfc6f8091ed1e8997b2ee6cbc600fd0d`.
  Exact contract review
  `08f34bab154482cb3e1fbbb3c9602b46fd5daa43a5385c4832dfe23a569779fe`
  accepted at revision 74. Same-source baseline, four exact negative scenarios
  and recovery passed all 30 obligations (`tmp/pagination-purpose-proof.log`).
  Expected negative runs remain failures, not mislabeled passing runs.
- Final bounded review covered the changed producers, invocation result validator,
  request-stage/call lifetimes, conversation handoff, visible/history projection,
  diagnostic return, prompt, direct consumers and lifecycle tests. No new runtime
  dependency, duplicated registry, timer suppression or evaluator model.
- No new full101 or real-provider acceptance was run. Formal tests prove lifetime,
  transport, rendering and actual execution boundaries; concrete stage authorship
  still relies on the primary AI following its updated existing commentary
  contract. Missing authored detail is never fabricated. No push or monitoring.

### Full handoff review follow-up - 2026-10-14

Scope remains discovery pagination and current activity. No live model, full101,
push, monitoring, dependency changes or unrelated owner work.

Review findings and execution cards:

- Compose: output admission currently checks the continuation offset but not the
  successor input contract. Reuse the discovery input validator for continuation
  validation. A registry change between pages can also silently skip entries;
  bind returned continuations to the existing native registry revision and reject
  stale continuation before delivering any page. No retained catalog snapshots or
  alternate registry. Formal tests must exercise the actual invocation boundary,
  valid continuation, malformed selectors and revision changes with bounded reads.
- Settle: diagnostic phase currently comes from the incoming event even when that
  event is rejected or completed. Derive it from accepted state and active leaves,
  preserving unscoped observed phases separately from visible stage intent.
  Test parent/child, concurrent completion, late events, empty active calls and
  stage continuity. Raw events remain available as incoming-event evidence.
- Verify producer-to-projection transport with the existing fake-provider protocol
  test, including public stage commentary and tool completion. No paid inference.

Plan self-review: compose owns page admission and native revision; settle owns
accepted lifecycle and diagnostics. Neither change introduces status timers,
semantic guesses, sticky completed work, extra model calls or larger limits.
Stage wording still comes from the primary agent: deterministic tests can prove
transport/lifetime but cannot guarantee that a future model authors a correct
stage description. This limitation must remain explicit in the report.

Gates: focused formal regressions red before production changes; affected server
and activity consumer tests, production typecheck, focused lint/naming, generated
catalog consistency and same-source Flow proof. Reuse unchanged visual evidence.
Review only these changes and their direct consumers before closing.

### Handoff review verification and stop

- Reproduced six discovery failures before implementation: five invalid successor
  inputs and a registry mutation silently skipping a capability. A subsequent
  category-specific regression isolated the advertised category constraint.
  Continuations now share input validation and pin the existing registry revision;
  unchanged multi-page traversal reads the native inventory once, and a changed
  revision rebuilds it once after an explicit restart.
- Reproduced two activity failures: completed calls retained their diagnostic
  phase, and coordinator/rejected events overrode live child diagnostics. Accepted
  state now owns phase projection, with surviving children/siblings and terminal
  controls preserved independently of stage text. Two lint findings were corrected
  before final source verification.
- Final server suites: 360 passed, 3 original guarded skips (operation owner,
  provider protocol and prompt). Existing fake-provider public-commentary through
  preparation/completion projection test passes; it performs no model inference.
  Activity/conversation/panel suites: 124 passed; final phase-helper cleanup reran
  all 62 presentation cases successfully. Production typecheck, focused lint,
  naming (15), catalog consistency (8), task context and whitespace checks pass.
- Final captured candidate b8e90643-36b5-4c76-a086-46a3c928d327, source
  fe873d70d25e8ee1ab394b9f1443079bb01cff9025ba3cd28b99e88ceb793171;
  accepted review 4abbdbc180e26e114be6645cb49de8c1b401ff6271c7e2930ec74eb4d30b0c7c.
  Same-source baseline, four expected negative scenarios and recovery passed all
  30 obligations, mapping revision 75. Recovery b83fc042-160a-4b44-a39c-8651e5f7c7fd.
  Evidence: `tmp/pagination-purpose-review-*`.
- Final bounded review covered input/output admission, dynamic registry lifetime,
  provider transport, stage/call ordering, parent/sibling completion, retry,
  approval/cancellation/settlement, UI history deduplication and diagnostics.
  No remaining reproducible defect was found in these changed handoffs. Model
  authorship remains an explicit limitation, not a deterministic success claim.
- No full101, paid/live model call, browser service, push or monitoring was started.
  Previous unchanged visual E2E evidence remains applicable. Stop here and report.

### Second full consumer review - 2026-10-14

Frozen scope: review the three preceding corrections through current callers,
registry lifetime, canonical invocation, activity transport, conversation/UI and
recorded diagnostics. No full101, live model, push, monitoring or unrelated work.

Settle verification card: the existing progress/settlement flow test performs
assertions inside a feature callback whose exceptions the conversation owner
intentionally catches. Its expected failed outcome can hide an assertion failure.
Capture immutable checkpoints in the callback and assert outside the failure
boundary, including that the feature reaches its intended outcome. First expose
its outdated completed-phase expectation as a real red test; then align that
expectation with the current accepted-live-phase spec. Preserve product error
handling. Owner: settle; contract: Purpose lifetime and diagnostic consistency;
allowed file: existing execution-flow-proof.test.ts; no production mutation.
Run the complete existing flow proof suite and direct consumer tests, not only
new tests. Stop after bounded review, scoped validation and a factual report.

Compose follow-up card: tracing the real local library shows its invalidation
counter also advances after rejected submissions and repeated save attempts.
Treating that counter as page identity introduces needless restart failures.
Use it only to refresh the existing inventory; compare an ordered descriptor
fingerprint during that refresh and advance a request-local discovery revision
only if the catalog actually changes. Retain only the fingerprint and revision,
not page snapshots or a second registry. Same-generation reads do no serialization.
The discovery owner remains local-operation-tools; actual host/library semantics
remain unchanged. Test actual host rejection followed by continuation, plus true
registry change and inventory work counts. Current compose contract still rejects
real changed catalogs; unchanged catalog continuations remain usable. Input/output
shape stays unchanged. Focused tests, consumer suites, lint/types and current
source proof close this slice; no full101 or model invocation.

Second review closure:

- Confirmed the old progress/settlement test passed with its assertion inside the
  caught feature callback, then failed once checkpoints were asserted outside that
  boundary (`second-review-hidden-assertion-before/red.log`). Corrected the stale
  expected phase, retained intended failed-outcome handling, and verified that the
  callback reaches its explicit end. All 30 existing flow cases now pass with the
  effective assertion. The previous green alone did not prove that old assertion.
- Actual host/library regression reproduced rejected recipe admission advancing
  the invalidation counter without changing definitions. Its next page previously
  failed. It now succeeds; genuine catalog changes still reject stale pages.
  Formal inventory oracle proves 19 schema reads for initial inventory, no extra
  reads across unchanged pages, 19 on invalidation with unchanged contents, and 18
  after actual removal. No page snapshots, document access or canvas mutation.
- Existing upstream/downstream suites: 221 discovery/composition tests, 311
  host/library/invocation/scheduler/provider/prompt/flow tests (3 original guarded
  skips), 145 browser transport/activity/conversation/panel tests, and 40 Runtime
  progress/multi-batch/trace tests passed: 717 distinct passed tests. No live AI.
- Production typecheck, naming (15), catalog consistency (8), whitespace and task
  context pass. Focused lint has no errors and one pre-existing console warning
  at execution-flow-proof.test.ts:1364. Logs: `tmp/second-review-*`.
- Captured source bdfb6a330f73c5d50b0eb5cde6fd1b7d4582234e3800b801a15e36ca95323a2c,
  candidate cf757698-2d7d-4b3f-9303-bd6132ffe3d1, accepted review
  a64e89d4a1941c2bd97a543b750b274cd4056686115b6c560525f4e39123524e.
  Same-source baseline, four expected negative scenarios and recovery passed all
  30 obligations; recovery d6d9b17d-1021-4e93-925e-594557dbf76e, mapping revision 76.
- Final review covers successor-input validity, catalog ordering and invalidation,
  exact-schema delivery reuse, recoverable admission and cancellation, actual
  host scheduling, accepted activity state, conversation failure handling, panel
  history and diagnostic transport. No remaining reproducible regression in these
  changed handoffs. Primary-agent stage authorship remains the stated limitation.
  No full101, extra model invocation, push, monitor or new service was started.

### Whole-changeset review - panel mount regression proof

- Owner: settle / conversation presentation; existing purpose/lifecycle contract and current feed follow-latest behavior.
- Inputs: an existing conversation mounted into an overflowing feed, subsequent progress and history expansion/collapse. Output: initial latest position, intentional reading position preserved during updates, correct jump control.
- Boundary: current panel component and its existing formal test; no model, provider, document or framework semantic changes. Allowed contributor: conversation presentation; forbidden: invented activity or history reset. Failure owner: settle.
- Discovery: all current production diffs and direct upstream/downstream owners, changed assertions and complete existing AI/server/Runtime suites. Do not infer acceptance from newly added tests alone.
- Gates: reproduce mount ordering in the formal panel suite; focused panel tests and affected AI suite, lint/typecheck. Existing deterministic suites cover remaining handoffs. Stop after review and report; no live101, external model, push or monitoring.

The mount regression failed with scrollTop 0 instead of the latest position. The correction orders initial following before expansion measurement; no additional timer, cache or state owner. During test-oracle review, strengthen existing settlement-failure event assertions outside the caught callback and require successful final runtime settlement in the observed compact-receipt proof. These are proof-strengthening changes at the existing apply/settle boundaries, not new production behavior. Inputs/outcomes and failure ownership remain unchanged; focused multi-batch and structural-delivery tests must pass.

### Whole-changeset review findings and evidence

Reviewed all 28 modified files and direct current producers/consumers, not only pagination and status regressions. The read covered discovery schemas/routes and dynamic catalog identity; transient region selection and retained leases; batch preflight/target admission; runtime settlement callback and original/compact receipt delivery; cancellation/partial outcomes and persistence consumers; activity ancestry/retry/terminal projection; feed/history lifecycle; prompt/spec/Inspector agreement and changed test oracles. Existing ownership remains canonical; no second registry, new interpreter, timer or cached document copy was added.

Findings:

- Confirmed panel mount regression: the new expansion measurement ran before initial follow-latest and disabled following for an existing overflowing feed. Formal mount test failed with scrollTop 0; reordered existing layout effects. Both real-browser widths now cover reopening at a short viewport, alongside expansion/collapse and manual following.
- Confirmed false-green test: the observed compact fill receipt proof returned an invalid empty final action batch; all writes completed but Runtime finished failed. A new final-status assertion exposed the failure. The fixture now uses the existing canonical report_outcome action, matching the production provider; no production admission was weakened.
- Strengthened settlement-failure proof: exact events are asserted outside the caught callback, so an earlier assertion failure cannot masquerade as the intended settlement failure. This is an oracle improvement, not another demonstrated runtime defect.

Verification: complete Runtime 370 tests; complete App AI 566 tests; complete server-response harness 1,156 tests with 9 guarded skips (live models disabled); five additional ownership/retained/composition files 95 tests. Production typechecks pass; focused changed-file lint and naming 15 tests pass. Logs: tmp/full-review-{runtime-verified,browser-verified,server,handoffs,types,lint-final,naming}.log. Original red logs remain tmp/full-review-mount-red.log and tmp/full-review-receipt-red.log. UI current-activity cases passed at 360/1280 widths and reopened-latest screenshots were inspected; full conversation/tool-library suite is the final UI checkpoint.

Limits: no live model or 101 run, so this review makes no new first-frame, total-duration or model-stage-authorship claim. Tests verify actual event/receipt contracts and work counts, not model-internal timing or aesthetic judgment. No push or monitoring.

Full UI review exposed three additional consumer failures: clarification-history reads race lazy mounting, and two timeout cases still require the superseded objective-as-current-activity behavior. Correct the async assertion and the current honest-phase oracle without restoring obsolete behavior. More importantly, the two Frame revision/Undo cases emit backend 409 for a props/removeProperty publication while their canvas-only assertions pass. Add durable checkpoint equality and reload to that existing formal scenario (settle persistence boundary) to make the failure visible. This review does not assume the persistence bug was introduced by the current diff or authorize a new canonical publication redesign; preserve the failing evidence and report the open issue.

### Whole-changeset review closeout - open persistence blocker

Full conversation/library E2E: 19 passed, 3 failed, 3 pre-existing profiling skips (tmp/full-review-ui-suite.log). The three failures were the lazy history mount race and obsolete objective-as-status assertions. Corrected consumers then passed all three targeted cases; the new Frame durability assertion failed as intended to expose the real persistence problem (tmp/full-review-ui-consumers.log: 3 passed, 1 failed). Do not label either original run green.

P1 open: native Frame replacement followed by Undo/Redo produces props/removeProperty publication evidence which the canonical persistence classifier rejects with HTTP 409. The canvas-only scenario previously passed while server retries continued. The permanent test now compares the durable checkpoint digest with the final canonical canvas and would reload only after equality. In the reproduced failure, persisted byteLength is 236 versus expected 4621; reload is correctly not attempted after failed durability. No user document was touched. The current changeset does not modify the classifier; this review establishes the mismatch, not when it was introduced or the complete producer-side root cause. Follow-up must inspect the original publication envelope and its producer/classifier boundary, rather than suppressing 409 or accepting arbitrary property removal.

Resolved P2: overflowing-feed mount loses follow-latest, corrected by effect ordering and permanent unit plus real-browser regression. Resolved proof gap: compact receipt scenario ended with an invalid empty batch, now uses canonical report_outcome and asserts successful terminal status. Strengthened settlement failure oracle verifies expected event sequence outside caught callbacks. Existing full Runtime 370, App AI 566, server 1156 (9 guarded skips), and supplemental ownership 95 tests passed. Production types, changed-file lint and naming passed. No new live101/performance conclusion. Full UI acceptance remains blocked on the durable checkpoint mismatch.

The earlier candidate 1325589a-d16d-41ee-b68b-6a478911a3d3 passed deterministic flow tests with no contract changes or blockers in its contract diff. It predates the new persistence regression and is not final whole-flow acceptance; do not use it to close this review's open blocker. Temporary Playwright services use isolated ports 3300/3401/4401 and test documents. No push or monitoring.

### Persistence 409 - producer-to-durable correction

- Objective: explain the first rejected real publication, repair its canonical owner, and prove each edit/Undo/Redo checkpoint and reload.
- Discovery: capture actual Core publications from the existing Frame revision E2E; trace their current producer and shared decoder, reducer and materializer. Synthetic fixtures alone cannot establish the producer contract.
- Authorized scope: existing Design persistence/collaboration source and formal tests, directly implicated framework producer only if evidence proves it incorrect, and matching active specifications/Inspector boundaries.
- Preserve: source slice order, owner payloads, one intended Undo entry, atomic persistence, duplicate/sequence rejection, shared property integrity and remote replay. Never drop unknown property events, reorder arbitrary operations, ignore 409, reset the document or replay successful writes.
- Sequence: reproduce and preserve envelope evidence; self-review the root-cause-specific plan; add permanent regression before production edits; repair; verify real mutations, each Undo/Redo durable state, reload, direct decoder/reducer consumers, types and lint.
- Initial review: current failure is proven, but event-name logs do not establish the origin or complete slice shape. Capture those before choosing a production fix. The existing settle flow owns durability but does not yet describe the implicated decoder boundary; update the relevant persistence contract once the exact root cause is established.
- Stop: all bounded regressions and direct consumer checks pass; report evidence and remaining limits. No remote operations or monitoring.

#### Confirmed cause and reviewed correction - synchronous immediate boundary

The captured `tmp/persistence-409-publications.json` proves forward publication 4 already splits one synchronous subtree removal into Scene and Props slices. Undo is not the first failure. Core correctly applies Scene removal then orphan Props removal without yielding. Factory assigns a separate owner-batch slice to each handoff; its single-event path also falls back to per-batch slices. Publication coalescing retains those incorrect independent boundaries. Both persistence and live consumers correctly require complete source slices. Earlier grouped-history normalization only covered atomic transaction-end members and did not repair this immediate forward producer.

Reviewed owner: Factory shared delivery (`settle-local-shared-projection` and its journal/history consumers). Use the existing immediate publication microtask token to identify one synchronous immediate boundary across separate owner calls. Close it at the existing microtask/settlement/discard boundary; do not merge across awaits, explicit progressive boundaries, transactions or publications. Preserve original immutable batches/deliveries and replay source mapping. No payload inspection, App-specific operation list, extra journal, decoder leniency or wire-schema change.

Test-first: separate Scene/Props owner handoffs must share one slice, adjacent asynchronous turns must remain separate, and ordinary/grouped Undo/Redo and published rollback compensation must preserve the source boundaries. Existing explicit progressive, atomic, publication-budget and failure tests remain required. Then the real Frame revision flow must reach an exact durable checkpoint after every edit, Undo and Redo and reload unchanged. Shared-property removal and strict malformed-source tests remain direct-consumer gates.

Self-review: the existing token already closes the synchronous enqueue window, including settlement before its queued microtask. Referencing that lifetime avoids another cache/reset protocol. `batchPublications:false` changes transport flushing, not the semantic completeness of one synchronous action. Frame E2E captures production publications; no extra AI call is needed. Authorized implementation is bounded to Factory shared-delivery identity, formal tests and matching Factory/Inspector docs, plus the existing real App persistence E2E.

Verification update: the corrected real flow reaches each edit and all Undo checkpoints without any 409. The expanded nine-checkpoint oracle exceeded Playwright's default 30-second whole-test deadline during Redo; the real persistence queue intentionally flushes after 3 seconds. This is not a persistence assertion failure or a reason to change its policy. Give only this expanded test 90 seconds; retain each 10-second checkpoint assertion, all nine intermediate equality checks and reload. Preserve the deadline-failed evidence in `tmp/persistence-409-real-e2e.log` before the rerun.

Further verification: all nine durable checkpoints and desktop reload pass. The narrow-width run reaches the same durable state, then its generic canvas-ready helper waits forever because the existing desktop sidebars leave the viewport anchor hidden at 360px bootstrap. Restore the same 1280px bootstrap viewport before reload; keep all revision/error/Undo/Redo checks at both requested widths. This persistence task does not claim to fix narrow-screen layout. The old `premature-publication` mutation no longer breaks grouped boundary preservation because the new immediate boundary is complete; its expected violation is now only `deferred.delivery`. The new exact split-immediate mutation separately proves this correction, rather than requiring an obsolete incidental failure.

#### Persistence correction closeout

Root cause is the Factory immediate source-boundary identity, not an HTTP retry policy or a malformed user operation. Core synchronously removes the Scene subtree and then its orphan property graph. Separate owner calls previously received separate slice IDs even though they belong to one complete synchronous operation. The progressive publication exposed those incomplete slices to the strict App decoder; Props removal then appeared without its Scene predecessor. Grouped-history repair for atomic transaction-end members did not cover this immediate forward path.

The fix uses the existing enqueue-window token for immediate slice identity across both scalar and batch owner handoffs. Microtask, settlement and discard boundaries already advance that token. Original batches, event order and source evidence remain immutable; ordinary/grouped Undo/Redo and compensation reuse the same complete source boundary. No App decoder, reducer, HTTP error handling, persistence retry policy, schema allowance or model behavior was changed.

Verification on this implementation:

| Evidence                                                                   | Result                                                                                         | Location                                                                           |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Actual pre-fix publication and failure                                     | Reproduced normal revision before Undo; Scene/Props split                                      | `tmp/persistence-409-publications.json`, `tmp/persistence-409-capture.log`         |
| Permanent Factory regression before fix                                    | Both ordinary/grouped cases failed with four slices instead of two                             | `tmp/persistence-409-factory-red.log`                                              |
| Complete Factory tests                                                     | 292 passed                                                                                     | `tmp/persistence-409-factory-all.log`                                              |
| Core direct owner/transaction consumers                                    | 42 passed                                                                                      | `tmp/persistence-409-core.log`                                                     |
| App decoder/materializer, reducer, queue, adapter and AI transaction tests | 82 passed                                                                                      | `tmp/persistence-409-consumers.log`                                                |
| Frame revisions at 1280px                                                  | Three edits, three Undo, three Redo each durably equal; reload equal                           | Desktop case passed in `tmp/persistence-409-real-e2e.log`                          |
| Frame revisions at 360px                                                   | Same nine durable checks and reload passed                                                     | `tmp/persistence-409-narrow-e2e.log`                                               |
| Existing real grouped structural flow                                      | Each history transition persisted and fresh-loaded; passed                                     | `tmp/persistence-409-structural-e2e.log`                                           |
| Factory same-source positive/negative/recovery                             | 3 flows, 7 exact negative scenarios, 11 obligations passed                                     | `tmp/persistence-409-factory-proof.log`                                            |
| Quality checks                                                             | Factory/App types, focused lint, 15 naming checks, catalog contract and diff whitespace passed | `tmp/persistence-409-{factory-types,app-types,lint-final,naming,catalog-test}.log` |

Final Factory recovery candidate `b524c5f5-8bf4-48fa-82ef-899aa86264f1`, source `5dd5152c8d2697caf06482bbb765d0e8158908ae1fd7c3b21db6d6d32484983c`, mapping revision 5. The negative mutation for split immediate boundaries detects this defect; forbidden commit and omitted compensation also correctly fail the new compensation assertion. No assertion was removed to make the source pass.

Earlier failed runs remain failed evidence: the expanded test first exceeded the old 30-second total budget; its nine real 3-second save windows now have a scoped 90-second total while each checkpoint still has 10 seconds. The desktop case then passed; narrow-screen bootstrap exposed the existing hidden canvas anchor, so reload uses the original 1280px bootstrap dimensions while all narrow-screen interactions and durable checks remain at 360px. This task makes no narrow-screen layout correctness claim. It also makes no full-worktree delivery or new 101 performance claim.

Final self-review checked synchronous and asynchronous boundaries, scalar/batch entry points, token lifetime, grouped/ordinary replay, compensation, explicit progressive/atomic policy, publication budget preservation, strict decoder rejection, atomic failed materialization, equality at every durable checkpoint and fresh reload. Existing negative and rollback contracts remain intact. Temporary Playwright services on 3300/3401/4401 are closed. No live AI, full101, push or monitoring was performed.

### Factory correction - cross-consumer review

- Objective: review the changed source-slice identity through enqueue, microtask/settlement, publication, rollback, grouped/replace-latest History, replay and durable consumption.
- Scope: Factory delivery owner and direct Core/Preset/App consumers. Inspect current call sites and existing tests, including non-AI Design gestures, Office, Sim, FieldScope and Starter. No unrelated domain calculation audit.
- Contract comparison: the settle-local-shared-projection step preserves ordered channel batches, asynchronous window separation, explicit progressive source order, one intended Undo entry and inverse compensation. Transport acknowledgement remains distinct from backend durability.
- Gates: existing Factory suite and Core/Preset lifecycle/history suites; existing direct App runtime/storage tests; existing Design gesture/publication tests and two-actor collaboration with Undo/Redo and reload. Reuse unchanged earlier real-edit checkpoint proofs. Any demonstrated regression requires a permanent failing test before correction, scoped lint/types and repeated affected gates.
- Stop: report findings and exact evidence/limits after these boundaries pass; no push, monitor or live 101.

#### Backend validation responsibility clarified

The durable backend does not invoke a model or re-review a drawing. `document-materializer.ts` decodes publication frames through the same App `decodeDocumentPublication` used by collaboration, checks publication identity/contiguous sequence/retry identity against the durable checkpoint, applies canonical changes and commits the next checkpoint. The reported failure occurred during decoding, before canonical application. The endpoint currently maps thrown failures to HTTP 409; that status alone does not establish a document revision conflict.

The current protocol still couples reconstruction of canonical changes to ordered low-level Scene/Props evidence within a complete source slice. Factory's correction restores the declared source-boundary contract for all synchronous immediate owner handoffs; it does not remove this protocol coupling. A possible later protocol redesign could transmit explicit canonical operations with their required data and retain backend ordering/reference validation, rather than infer operations from internal batches. That is a separate cross-producer/peer/history/storage change, not silently included in this review. No backend guard was relaxed and no cross-async slices were merged.

#### Cross-consumer review result

- No new regression found in the frozen Factory correction and its direct consumers. No additional production changes were made during this review. The token is transaction-instance-local, advances at microtask/settlement/discard boundaries, and is copied into immutable source batches before replay. Local channel delivery remains synchronous; history staging and public source-window batching remain separate responsibilities. Existing source IDs preserve replay and compensation rather than regenerating boundaries from inverse calls.
- Existing coverage inspected includes scalar/batch equivalence, explicit progressive ordering, immediate/deferred mixtures, bounded publication windows, custom channels, rejected append, partial compensation, observer isolation/reentrancy, nested replay, grouped History and replace-latest gestures. Direct App inspection covers Design pointer/pen/gradient/stroke paths and other Apps' Core transactions and durable consumers. Compiled Factory output used by packed consumers contains the current correction.
- Fresh tests: Factory 292; Core history/hierarchy/persistence/observer 41; Preset lifecycle/group/selection 54; Office complete suite 14; Starter complete suite 44; Sim selected runtime/storage/observation suites 50; FieldScope selected runtime/history/workspace suites 11; Design gesture/history/publication/outbox/lifecycle/reducer/queue suites 126. Total 632 passed. Logs: `tmp/factory-impact-{factory,core,preset,office,starter,sim,fieldscope,design}.log`. Sim and FieldScope use their existing guarded supervisors. Existing mocked canvas warnings in Sim are not product browser failures.
- Existing collaboration suite: all 14 tests passed in 2.7 minutes, including 16/320/1280-item two-actor batches, persistence/reload, reconnect/reset recovery, nested Group restoration, remote hierarchy/geometry Redo, vector anchors, live create/drag/pen before pointer-up and Fill Undo/Redo. Log: `tmp/factory-impact-collaboration.log`. These use deterministic existing fixtures, not live model calls.
- Retained earlier evidence: actual Frame revisions at both viewport sizes, each edit/Undo/Redo backend digest, reload, structural operations/fresh load, Factory exact-negative proof, lint and production types. Runtime source was unchanged during this review, so these unchanged gates were not repeated.
- Limits: this is the complete direct-impact review of the Factory correction, not every unrelated App feature or domain simulation. Backend low-level-evidence coupling remains as documented above; no claim of protocol decoupling. No live101, push or monitoring.

### Explicit document publication contract

#### Deep analysis and reviewed design

The 409 arose before canonical application: the backend decoded raw Scene/Props batches into semantic changes. The live peer repeats the same derivation. The corrected Factory source windows are necessary local delivery semantics but do not remove this receiver coupling. The first contract boundary to correct is the publishing App adapter, which already filters local-only channels and owns the translation from framework delivery to document transport.

Reuse the existing generic SharedPublication envelope and binary framing. Each source slice carries explicitly typed canonical changes in the App-owned `document` channel with `applyCanonicalChanges` delivery. This is an application payload, not a registered Factory channel or another history journal. Preserve publication/artifact/transaction IDs, origin, semantic slice identity/order and publication-level compensation reference. Transport batch/fragment layout has no semantic meaning to receivers. Canonical delivery IDs are deterministic from source slice IDs; compensation targets the source publication, not guessed synthetic per-delivery identities. No duplicate raw event payload is transmitted.

The sender converts complete immutable Factory evidence once before outbox retention. Source classification remains solely at this local adapter boundary. Peer and backend share one exact canonical payload validator and consume the resulting ordered changes directly. Neither reconstructs actions from Props/Scene adjacency or silently accepts the old event format. Existing saved document checkpoints retain their format; unsupported pending publication formats fail explicitly and remain recoverable evidence, never auto-reset or discard user data. Transport remains generic and opaque.

Validation preserves required fields and canonical change kinds, finite transport values, hierarchy/property relationships and apply-owner checks. Reject malformed/unknown/mixed raw payloads before canonical mutation; no partial checkpoint advancement. Validate identity/contiguous sequence, exact retries and optimistic durable sequence separately. Classify malformed requests as 400, invalid canonical operations as 422, genuine checkpoint/identity conflicts as 409 and unexpected storage failures as 500. Diagnostics must not mask the original failure or replay writes.

Review completed before implementation: (1) generic envelope reuse avoids a second provider/interpreter; (2) source semantic slices survive frame/batch regrouping; (3) all origins including compensation take the same producer path; (4) exact retained bytes/IDs support retries without re-derivation; (5) receiver policy transformations are validated before apply; (6) failed decoding/apply does not advance durable state; (7) bootstrap/outbox replay uses the same canonical consumer; (8) old raw transport is rejected rather than supported as a fallback; (9) local Factory diagnostics remain explicitly separate from the document wire contract.

#### Execution order and bounded gates

1. App publication owner: formal red tests for explicit canonical payload, raw receiver rejection, equivalent transport regrouping and preservation of source/compensation identity. Implement the local adapter and common strict canonical reader.
2. Peer and persistence consumers: switch to the common reader, update existing fixtures to invoke the real producer, retain malformed-input and failed-apply assertions. Prove retry, compensation, Undo/Redo and checkpoint invariants.
3. Backend error owner: typed error categories and actual HTTP tests for invalid request, semantic rejection, sequence conflict and storage failure. Preserve failed evidence and retry identity.
4. Integrated closure: existing Factory/Core/Preset and directly affected App tests, server/browser typechecks and lint; real two-actor collaboration, actual edits/Undo/Redo, compensation and persistence/reload. No live101 or unrelated full CI. Self-review the changed contract and direct consumers before reporting.

#### Step card - publishing App canonical contract

Owner: `apply-remote-publication` App adaptation route, with source `factory-adapter.ts` and the matching peer/backend consumers. Inputs: completed immutable Factory document evidence; outputs: explicit canonical document publication and strict ordered change slices. Conditions: preserve source identity, semantic boundaries, action/replay/compensation order and local-only exclusions. Bypass: no document changes. Contributors: existing local classifier and public CanonicalChange contract. Forbidden: receiver reconstruction, cross-publication merge, model calls, live-state rereads, alternate history or fallback raw format. Boundary: Design collaboration adapter/types/validator/processor plus directly named tests and backend integration. Failure owner: publishing adapter for incomplete source evidence, receiving validator for malformed payload; no false acknowledgement. Gates: permanent contract regressions red before implementation, focused producer/consumer suites, then naming/type/lint. Stop before advancing if any current semantic case loses information.

#### Step card - durable materialization and error ownership

Owner: existing Design durable session/materializer route in the conversational drawing performance Inspector. Inputs: explicit canonical publication frames, contiguous sequence and retained request identity; outputs: committed checkpoint/watermark or a classified failure. Contributors: common canonical reader, reducer and transactional store. Forbidden: raw event reconstruction, inferred operation batching, checkpoint advance on failure, generic errors represented as revision conflicts. Files: document materializer/backend/reducer and new persistence error type; direct HTTP/materializer/queue tests. Exact HTTP regression is red: invalid request, invalid reference and disk failure all incorrectly return 409; conflict and exact retry tests already pass. Gate: all five HTTP cases plus canonical consumer suites, failed-later-publication atomicity and queue retry evidence. Preserve the actual thrown message and cause.

Producer/peer review: 73 existing and new focused cases pass after fixtures now distinguish local Factory evidence from remote canonical payload. Source translation does not recursively revalidate trusted Factory data; untrusted receiving data is validated. Topology derivation occurs once at source. No consumer compatibility branch was introduced.

#### Self-review correction - retry content identity

The existing durable retry check compares only publication IDs and sequence numbers. A new actual-HTTP regression proves changed canonical payload under the same durable identity is incorrectly acknowledged. Retain a digest of canonical operation content and semantic source metadata, excluding request IDs, transport batch IDs and frame fragmentation. Compare it before acknowledging any durable retry. A checkpoint without a digest must not be treated as proof of an identical operation; new publications may extend that checkpoint and record their own digests. This preserves saved document data without accepting old raw publications or fabricating retry equality. Digest capture is per incoming publication, never a full-document scan.

#### Integration review - compensation framing and capture consumers

The real HTTP compensation regression exposes another receiving boundary: binary frame decoding duplicated the former per-delivery compensation requirement. Centralize this shape predicate across envelope and both existing codec layouts; document publications correlate compensation at publication level, while generic owner-event transport retains its own contract. Add an exact binary round-trip regression before the fix. The collaboration E2E capture helper must pass raw Factory evidence through the actual producer adapter before testing the remote consumer. Its observed rejection is not a production fallback requirement. Stop the broad run, preserve its failure, complete these bounded corrections and focused proofs, then repeat the complete collaboration suite.

Receiver validation also preserves finite signed-zero coordinates supported by the existing binary codec. A formal red case exposed accidental use of the stricter JSON-lossless predicate. Reuse its structural traversal with the numeric policy made explicit; JSON control/frame optimization still rejects signed zero while document operation validation accepts it. Stored JSON document semantics treat both zeros identically, as before; retry identity follows the saved document value semantics. Non-finite values remain rejected.

#### Source normalization correction from real structural persistence

The original 14 collaboration cases passed, but real grouped visibility changes exposed local `options.undoable` in the derived element-data change. Receiver rejection is correct: sender transaction options must not become remote history policy. Keep strict receiver validation; explicitly project semantic fields for element-data and subtree-removal at the publishing document owner, leaving original Factory evidence unchanged. Add the exact producer-to-reader red regression before the change, verify both option-bearing variants, then rerun structural persistence and the affected source suites. The existing creation-only and nested history cases are not substitutes for this direct consumer coverage.

The additional real compensation case uses the existing gesture publication policy (`batchPublications: false`) to make its prefix visible before rollback. The initial fixture used ordinary coalesced delivery and therefore had no visible prefix to compensate; correcting the fixture to this existing policy requires no product timing or threshold change.

#### Architecture review closure

The architecture now gives source preparation its own actual App owner step between Factory publication and generic Collaboration, rather than describing producer work on the remote apply node. The existing transport envelope stays generic. The shared remote/persistence validator and retry content identity are documented in the active App collaboration module; generated Inspector data is synchronized through the existing generator. Captured document-publication diagnostics now read the same current wire contract, while explicitly captured Factory evidence is prepared through the producer before remote-consumer assertions. Formal scripts include the new publication and HTTP persistence tests.

Final direct-consumer review also checked the existing Props mutation contract: `id` and `type` are immutable during value replacement. The new canonical document boundary must reject such replacement attempts and reserved record keys before peer or backend apply. Three red cases now pin that requirement; creation components continue to carry their required identity/type. This is a fixed wire identity constraint, not a second property schema registry.

One Frame validation attempt overlapped source formatting and produced an invalid empty in-memory digest during Redo; that run is retained as failed and is not acceptance evidence. The final browser run uses frozen production sources after all format/type checks. Earlier successful Frame cases do not replace the final run.

#### Exact retry acknowledgement handoff

Final inspection of the direct persistence consumer found a real contract mismatch: materializer retries returned the current document watermark, while `completeSuccessfulBatch` requires the exact requested batch ending sequence. An actual HTTP red case retries sequence 1 after sequence 2 is durable and receives 2. Acknowledge the requested already-durable range, leaving the stored watermark unchanged. Prove the same response through the actual persistence queue with both retained publications; it must remain editable, advance in order and not replay canonical writes. This changes only the already-durable retry response; new commits and invalid conflicts retain their existing behavior.

A later collaboration run stopped on unexpected browser navigation during the 320-item Undo observation. It is retained as failed; the navigation trigger was not established by the emitted stack. Final acceptance runs after all edits, generation and builds settle, with no concurrent writers and failure trace retention. No retry allowance, assertion relaxation or navigation-error suppression is added.

#### Explicit publication contract - final local verification

- The final frozen collaboration run passed all 15 cases in 3.0 minutes, including 16/320/1280-item delivery, reconnect/reset, nested Group Undo/Redo, live gesture publication and visible-prefix compensation through peer convergence, durable save and reload. Log: `tmp/persistence-contract-final-acceptance.log`. The earlier navigation failure remains recorded; this successful run does not establish its cause.
- Five actual edit/history/persistence browser cases passed in 2.1 minutes: both Frame viewport cases, registered and canonical structural handoffs, and grouping/ungrouping/deletion with each Undo/Redo persisted and freshly loaded. Log: `tmp/persistence-contract-frozen-reload.log`.
- Focused unit/integration coverage passed 249 unique cases: 207 browser-side cases plus 42 server cases. The final retry-boundary run reports 87 because it also repeats 45 collaboration-operation cases; these are not double-counted. Logs: `tmp/persistence-contract-units-complete.log` and `tmp/persistence-contract-retry-boundary-green.log`. The real HTTP and actual queue proof confirms old-range retries acknowledge their own ending sequence without lowering the stored watermark or reapplying writes.
- Existing server/middleware/bundle contracts passed 28 cases; current Inspector/catalog contracts passed 43; naming passed 15. Production and backend type checks passed. Scoped lint has zero errors and one existing backend console warning. Evidence: `tmp/persistence-contract-{server-contracts,flow-final,naming-final,types-final,backend-types,lint-final}.log` and `tmp/persistence-contract-retry-lint.log`.
- Final source review covered source preparation, common peer/backend validation, binary compensation correlation, content identity, exact retry acknowledgements, failure atomicity, local execution-option exclusion and immutable property identity. Framework Factory and generic transport ownership remain unchanged by this task; earlier unchanged direct-consumer evidence above is retained rather than rerun.
- Playwright-owned ports 3300/3401/4401 have no remaining listeners. Local configuration and unrelated worktree changes are preserved. This bounded persistence task is complete locally; no live101, model call, push, PR operation or monitoring was performed.

#### Follow-up review - persistence handoffs and browser navigation

Scope: re-review the explicit document producer, all receiving/bootstrap paths, queue/store identity and failure settlement, ordinary batch/history/compensation consumers, and the failed 320-item browser case. Discovery uses current source/direct call sites, bounded diffs and retained logs; no unrelated framework or AI behavior changes. Preserve semantic slices, no peer history/echo, atomic durable commit, exact retry identity and acknowledged range. No live101, push or monitoring.

Review card: the existing 320-item collaboration E2E owns diagnostic observation of both browser contexts. Its previous failure has no retained trace (the configuration traces only first retries); later successful tests replaced the default result directory. Capture actual document request initiators, main-frame navigation reasons/commits and Vite reload messages before navigation, attach them even on failure, and assert that creation/Undo/Redo does not navigate. Reproduce with an isolated cold Vite cache and frozen source. Keep original assertions, timeouts and fail-fast. This is test-observation coverage, not a product/Inspector semantic change; no runtime route expansion or navigation suppression. If the historical trigger cannot be proven, distinguish reproduced causes from the missing historical evidence.

#### Follow-up review findings - local completion claim withdrawn

- **Open P1: source conversion failure is lost before outbox ownership.** `createDocumentCollaborationPublicationSource` performs conversion inside the Factory subscriber. The actual Factory deliberately catches subscriber exceptions so observers cannot change canonical settlement. When conversion throws, `scheduleLocalPublication` is never called: no pending or conflicted record exists and the session can continue reporting `synced`. The new permanent lifecycle regression uses an actual isolated Factory and LocalSharedDataChannel, verifies a completed source publication and no provider send, and fails with actual `pendingCount: 0, sync: synced` versus required `pendingCount: 1, sync: conflicted`. This supersedes the previous local-completion statement for the failure path. Log: `tmp/persistence-review-producer-failure-red.log`. Production code remains unchanged in this review.
- Repair direction: App source preparation must explicitly hand a failed source artifact to the existing session/outbox failure owner before the Factory callback returns. Retain it as non-sendable failure evidence, expose failed sync/persistence confirmation, and preserve it across reload. Never send raw evidence as a fallback, mark it acknowledged, or make Factory observers change local transaction settlement. Prove storage failure and later valid publications cannot hide the retained failure.
- The full direct-consumer review traced producer filtering and atomic/progressive semantics, ordinary outbox/bootstrap paths, Core remote replay and rollback, reducer copy-on-write, transactional file write/cache ordering, sequence/content identity and exact range acknowledgement. No additional concrete defect was found in those inspected paths. Earlier unchanged Factory/Core/other-App evidence remains applicable; this review makes no claim about unrelated features.
- **Navigation cause remains unproven.** The old run had no first-attempt trace because its default configuration traces only first retries; its default results directory was replaced by later runs. Read-only inspection of this conversation's command timeline establishes concurrent file edits/test execution at 13:37:04Z and 13:38:17Z during the failed run ending 13:38:20Z, so its earlier `frozen` description was incorrect. Those facts do not identify the actual navigation initiator.
- Fresh cold-cache full collaboration passed 15/15 (3.1 minutes), with no source writes during execution. A separate traced 320-item creation/Undo/Redo run passed (1.0 minute); both actors have exactly one initial document request/commit and no reload messages. Repeating the prior overlapping backend unit command during that run also passed without navigation. This excludes neither a historical source-edit-triggered reload nor another missing event, and cannot retroactively prove either. Logs: `tmp/persistence-review-cold-browser.log`, `tmp/persistence-review-navigation.log`, `tmp/persistence-review-concurrent-unit.log`; full browser evidence: `tmp/persistence-review-navigation.json`, `tmp/persistence-review-navigation-evidence.json`, and `tmp/persistence-review-navigation-results/`.
- Permanent E2E observation now records document request initiators, requested navigation reasons, main-frame commits and development-server reload/update messages, asserts one navigation per actor for the 320-item case, and saves the evidence inside the test output directory even with the line reporter. This neither retries failed operations nor suppresses navigation errors. The previous cache was preserved inside `tmp/persistence-review-vite-cache-before`; the current cache is generated normally.
- Review conclusion: the persistence change is not ready to be declared fully correct until the P1 is repaired and the new regression passes. The historical navigation root cause is an explicit evidence limit, not a fixed bug. No live101, push, PR or monitoring.

Follow-up verification: the complete lifecycle suite reports 20 existing cases passed and the new source-conversion regression failed (1/21); this is a known open failure, not a green gate. Scoped test lint and naming pass. The final line-reporter 320-item run passed in 54.9 seconds and its JSON evidence remains on disk with exactly one initial document request/commit per actor and no requested navigation or development-server reload. Logs: `tmp/persistence-review-lifecycle-all.log`, `tmp/persistence-review-lint-final.log`, `tmp/persistence-review-naming-final.log`, `tmp/persistence-review-evidence-browser.log`; permanent output under `tmp/persistence-review-evidence-results/`. No product implementation changes were made during this review.

#### Factory-to-document preparation failure handoff - bounded repair

Objective: a completed local publication whose document preparation fails must be retained as a non-sendable conflict, never disappear behind Factory observer isolation or permit false persistence confirmation. Preserve local canonical settlement, History, ordinary publication identity, and explicit Reset generation behavior. Scope is the Design publication adapter, document lifecycle/outbox and direct formal consumers, their current specification and Inspector routes. No Factory/Core production changes, raw-wire fallback, source replay, new recovery UI, live101, push or monitoring.

Reviewed flow: the adapter prepares document evidence once and reports either a prepared publication or the original immutable source plus a normalized preparation error to required App callbacks. Local-only publications remain a no-op. Catch only preparation errors, not downstream subscriber failures. The lifecycle immediately queues either outcome in source order; the existing outbox retains failures with `conflicted` status and a reason, making the raw source diagnostic evidence only. The same storage identity and generation rules apply to pending and failed records. Recovery drains only the contiguous pending prefix before the first conflict; an apply/acceptance rejection stops the current drain. Later publications, including Undo/Redo and compensation, remain retained without bypassing a missing predecessor. Confirmation queues behind retention and rejects unresolved failures without calling provider confirmation. Storage failures remain explicit throughout the session, including generation rebinding; only explicit clear/reset or a successfully restored new outbox lifetime can clear that failure. Reset remains an explicitly destructive, separately owned operation.

Step card A: `prepare-document-publication`; spec `collaboration-reference.md` / Explicit canonical document publications. Input immutable Factory evidence; outputs prepared canonical publication or explicit source preparation failure. Conditions document channel selection, atomic/progressive slice preservation; bypass local-only evidence. Allowed contributors existing classifier/adapter; forbidden Factory settlement changes, raw fallback transport, renderer/history reads. Boundary factory-adapter and direct adapter/capture tests. Failure owner adapter callback into the document session. Prove actual Factory delivery remains non-throwing while the required failure callback sees the original source; computed-projection and unsupported events never reach the success callback. Recheck contract before session work.

Step card B: `open-socket-authoritative-document-session`; same spec plus durable outbox section. Inputs prepared publications or source preparation failures in original order. Outputs durable pending/conflicted records, accurate session status and persistence-confirmation rejection. Boundary lifecycle, publication-outbox and existing lifecycle/outbox tests. Existing IndexedDB owner is the only retention store; no second document model or implicit retry of the user action. Prove failure reload/file isolation, acknowledgement rejection, ordered prefix blocking, later successful writes, storage failure and reconnect, immediate confirmation ordering, disposal/reopen, and recovery that never sends raw failure evidence. Run existing producer/consumer/history/compensation tests and the real two-actor collaboration/save/reload E2E after focused gates. Typecheck, scoped lint and naming are closure gates; no unrelated full CI.

Self-review: all direct callers of the adapter require explicit failure handling (production session, diagnostic browser capture and formal adapter tests). Existing `retainConflict` cannot create a missing record; add a creation path in the current outbox rather than call it after the fact. Existing pending-only filtering skips conflicts, so use a contiguous prefix and stop the active loop on rejection. Existing generation binding clears storage failure without proving retained records reached disk; keep failure sticky within the lifetime. The current red lifecycle regression establishes the original defect; strengthen permanent tests before implementation. Stop on a new out-of-scope owner requirement or unresolved handoff; do not weaken accepted behavior to pass.

Segment A review: preparation callback contract now catches only preparation, retains identity, preserves no-document bypass and cannot misclassify a downstream callback error. Existing computed-projection regression failed before and all five adapter cases pass after. Required callback wiring remains the session segment; no Factory settlement change. Re-read the session step before implementing retention. Outbox prefix and new retention cases are red before production edits.

Segment B focused review: the original real-Factory regression now reaches retained conflict and fresh session reload; source storage quota failure, reconnect and later writes preserve failure. Pending-prefix selection and the active drain both stop on rejection. Factory shared-publication/flow proofs (72), Core facade/history/persistence (20), and backend reducer/error/reset/queue tests (42) pass unchanged. Extend the existing real-browser recovery scenario to cover local create/Undo/Redo behind a conflict, rejected persistence confirmation and reload with the same retained count while another peer continues working. This proves the new ordering boundary with real interaction and IndexedDB, without a new diagnostic app path.

Browser review iteration: the full collaboration run stopped in the existing retained-source recovery case. A focused strengthened assertion proved its supposed independent peer also loaded `pendingCount: 1, sync: conflicted`: `context.newPage()` shares IndexedDB and therefore the same file-local failure. This is not a failed inbound transport or a reason to bypass conflicts. Change only that fixture to a separate browser context, require its empty/synced outbox before interaction, then retain the full local create/Undo/Redo, peer reception and reload assertions. Red evidence: `tmp/factory-handoff-peer-red.log`. No production adjustment or timeout increase is justified by this finding. Re-review confirms file-local failure ownership stays unchanged.

Final direct-consumer review found the browser capture reader would decode the new failure envelope as a document publication and lose its source ID/reason. A permanent adapter/capture regression first proves `unknown` plus a generic envelope error, then verifies the original source ID and preparation error are retained without trying document decode. No production tool or status schema changes. The isolated-peer recovery case passes (19.6s); all browser source is frozen again for the final full collaboration suite after these focused corrections.

#### Factory-to-document failure handoff - scoped closure

The previously open P1 is repaired in the publishing App/session/outbox boundaries. Factory and Core production settlement are unchanged. The required preparation-failure callback retains immutable source identity and error as a non-sendable conflict; ordinary document delivery remains canonical-only. Ordered recovery stops at conflicts, including a rejection arising during the current drain. Subsequent action/replay/compensation records remain pending behind the failure. Confirmation is serialized after retention and never requests a provider receipt while the session is conflicted or storage-failed. Reload restores durable failures and later records without reapplying raw evidence. IndexedDB write failure retains memory evidence and explicit storage-failed status; it is not a promise that failed disk writes survive closing the tab. Reconnect and successful later writes cannot erase that failure. Explicit Reset/file-generation handling remains unchanged.

Final review covered the changed producer, every adapter caller, outbox storage/load/generation/acknowledgement, lifecycle enqueue/drain/confirmation/disposal/reconnect, direct peer canonical consumers, and existing Factory/Core History and compensation paths. No further in-scope blocking finding remains. The browser diagnostic capture now preserves the actual source ID/error. The recovery E2E's independent peer uses an independent IndexedDB context; same-context tabs intentionally retain the same file-scoped failures. No raw transport fallback, added local canonical store, history mutation, automatic source replay, model call or timeout increase was introduced.

Evidence:

- Original real-Factory lifecycle regression and new outbox/adapter cases were red before owner implementation: `tmp/factory-handoff-red.log`, `factory-handoff-outbox-red.log`, `factory-handoff-adapter-red.log`.
- Design direct-consumer suites: 219 passed across eight files (`tmp/factory-handoff-consumers-final.log`). Subsequent diagnostic-only correction was red then all seven adapter/capture cases passed (`tmp/factory-handoff-diagnostic-{red,green}.log`); 220 distinct cases across the combined same-production-owner evidence, not 226.
- Factory shared publication/flow: 72 passed (`tmp/factory-handoff-framework.log`); Core facade/history/persistence: 20 passed (`tmp/factory-handoff-core.log`); backend reducer/reset/error/retry queue: 42 passed (`tmp/factory-handoff-backend.log`).
- Full real-browser collaboration: 15 passed, 3.2 minutes, fixed source and first-attempt traces (`tmp/factory-handoff-browser-final.log`, `tmp/factory-handoff-browser-final-results/`). Covers independent peers, failed-source recovery, local create/Undo/Redo behind conflict, confirmation rejection, retained reload, batch creation, Groups/vectors/Fill, visible rollback compensation and durable reload. Earlier failed runs remain failed evidence; the separate-context fixture correction has its own focused red and green logs.
- Production browser/server typecheck passed (`tmp/factory-handoff-types-closure.log`, command exit 0); scoped lint has zero errors and nine existing lifecycle console warnings; naming 15 passed. Inspector contracts/catalog 43 passed (`tmp/factory-handoff-inspectors-final.log`), generated catalog synchronized. Scoped whitespace check passed.

No live101, push, PR operation or monitoring. This closes only the authorized failure-handoff repair, not the entire reusable-tool plan. The earlier historical navigation initiator remains unproven; this passing traced run does not retroactively identify it.

#### Failure recovery completion - revised bounded task

The previous handoff closure is superseded for recovery completeness. Retaining a conflict is an intermediate safety state, not completion. The user-visible endpoint is: preserve edits, reopen them, retry after the cause is corrected, drain in original order, receive durable confirmation, and reopen the saved result. A permanently invalid source must remain explicit and downloadable; Reset is never recovery.

Scope: Design publication adapter, outbox, document lifecycle, recovery presentation and their formal tests/spec/Inspector. Factory transaction/history and server canonical validation remain authoritative and unchanged. No live101, model calls, push, monitoring, dependency change or alternate server overwrite path. Review follows producer -> retention -> reopen -> recovery -> source acceptance -> durability -> reload, including peer changes, Undo/Redo, compensation, duplicate delivery, repeated storage failure and disposal. No unrelated cleanup.

Design review decisions:

- Outbox storage writes preserve a durable prefix: after a write fails, no later record may be stored without the missing predecessors. Retry flushes retained memory in order; storage recovery cannot merely clear a flag. An unsuccessful initial load must not permit writes over unknown persisted records.
- Preparation conflicts retain their source category. Retry invokes the same canonical preparation owner; canonical admission conflicts retry through the existing provider/apply boundary. No unchecked raw send, skipped record, changed publication identity or automatic conflict deletion.
- A blocked session preserves a read-only recovery document captured from the existing Core canonical snapshot API. Only failure/recovery paths capture this document; ordinary publications retain their existing incremental route. This is an outbox-owned recovery artifact, not another editable authority or server checkpoint. The latest retained recovery document is the local reopen source while blocked. The session isolates live inbound delivery during this state rather than applying peer changes over a divergent draft. It never replaces the shared server document with the draft.
- Explicit retry first durably retains all evidence, then re-prepares eligible failed sources. A fresh session replays canonical publications against the authoritative checkpoint through ordinary admission. Failed retry preserves the recovery draft and all remaining evidence. A downloadable recovery document is available when a source is still invalid or storage is unavailable; no promise of durable retention is made when every storage write fails.
- Recovery presentation exposes retry/download and pending work, not only a warning. Reload/retry does not represent persistence success; confirmation still waits for source acceptance and backend receipt. Protect unsaved in-memory work before unload.

Owner card - open-socket-authoritative-document-session (first slice: outbox):
Spec: collaboration-reference.md / Source preparation failure ownership and Recovery completion. Inspector: ai-conversational-drawing-performance-flow-inspector.data.cjs / open-socket-authoritative-document-session; preparation remains prepare-document-publication. Inputs: immutable publication, explicit source failure category, canonical recovery document, current file generation, storage results. Outputs: ordered durable pending/conflicted records, reopen recovery document, explicit retry outcome and storage status. Conditions: canonical-only transport, no successor write overtakes missing predecessor, no unknown-load overwrite, explicit generation Reset is separate. Contributors: App session/storage and existing Core snapshot/preparation APIs. Forbidden: raw send, server snapshot overwrite, Factory history mutation, normal-path document snapshot, silent discard. Failure owner: document session. Boundaries: collaboration/{publication-outbox,factory-adapter,lifecycle}.ts, render-app/index.tsx, their direct formal unit/E2E consumers and current contract docs. Work one sub-boundary at a time; tests red before production changes. Stop/replan on disproved recovery or concurrency assumptions, never weaken an oracle to accept stranded edits.

Gates/DoD: formal durable-prefix reload regression; storage load/write/retry failures; preparation failure then real edits/Undo/Redo/reopen/retry/confirmation/second reopen; persistent invalid source retains accessible draft; connected peers and exact retry/compensation preservation; no snapshots on normal publication; scoped lint, browser/server tsc, naming, Inspector/catalog tests and full collaboration E2E. Review repeats through the complete affected flow after corrections, not just the new case. Completion requires the recovery endpoint; a blocked-only green test cannot close this task.

Recovery outbox slice: the three new regressions failed before implementation (successor durable gap, unknown initial load, missing recovery API). All 16 outbox cases now pass. A later successful write cannot clear storage-failed by itself; explicit retry must flush the complete retained prefix. Ordinary append remains publication-only. Review carries the retry/load/generation paths into the next owner integration rather than declaring the task complete.

Owner card - document session recovery integration: same Inspector step and Recovery completion spec. Inputs are the outbox's retained failure category, canonical recovery document and prepared publication prefix. Output is a blocked-but-readable local document or ordinary canonical replay followed by durable confirmation. The session uses Core's existing snapshot/load APIs only on failure/reopen; it pauses inbound traffic while a divergent recovery document is active. Preparation uses the exact existing adapter function. Retry must persist evidence before allowing a fresh authoritative bootstrap; it cannot silently skip unsupported sources. UI consumes session recovery state and invokes explicit retry/export, with no independent write authority. Allowlist extends the same session step to direct recovery presentation/tests. Formal gate: transient conversion failure -> local draft -> reconnect preserving it -> reopen -> preparation repaired -> ordinary source acceptance -> persistence receipt. Existing publication/undo/retry tests remain required. Initial test setup used a nonexistent processor export and was corrected to the actual Core apply facade before collecting the behavioral red result.

Recovery integration self-review: the real browser case completed faulted real drawing + Undo/Redo + reopen + rejected retry + export + repaired retry + independent peer merge + durable receipt + second reload (25.4s). This is evidence for the happy recovery endpoint, not closeout. Additional failure-during-recovery cases proved snapshot exceptions could escape before retention, conflict storage rejection could skip isolation, and initial-load repair could resurrect an obsolete generation. Add bounded regressions before correcting those exact owner paths. Keep source retention independent of optional snapshot capture, isolate in finally even when storage fails, and apply the authoritative Reset generation to recovered stored records. No broadened framework or backend change.

Recovery final integration review: the full 16-case collaboration suite passed. A direct-consumer audit found explicit Reset assumes an active socket, whereas a safely reopened recovery draft deliberately owns none. Preserve explicit Reset by opening a short-lived authoritative session when isolated; clear retained evidence only after server acknowledgement, and retain the active recovery handle on Reset failure. Export must wait for queued retention before reading the recovery artifact. These are bounded lifecycle/presentation corrections under the same Inspector owner, not a new recovery protocol. Prove both regressions before production changes, then recheck ordinary collaboration, recovery, compensation and durable reload.

Recovery failure-boundary follow-up: optional canonical recovery-document capture may fail while the source evidence is safely retained. Reopen must still expose explicit preparation retry; absence of the optional document must not suppress recovery controls. The regression was red before changing the startup conflict predicate. Download reports the missing document honestly, while canonical source retry remains available. The storage E2E assertion was corrected to the public wrapped storage error rather than the injected inner DOMException; no production validation was relaxed.

Reset transport review: opening the temporary session is not sufficient; the existing provider requires the explicit bootstrap-consumed handshake before Reset. This short-lived Reset-only session does not hydrate or overwrite the local draft. Its failure retains the recovery handle and evidence. Prove the handshake ordering and real reopened-recovery Reset separately. Also strengthen the recovery endpoint with a new edit after recovery and its second durable reload, and register the new presentation tests in the existing package test:local entry.

#### Failure recovery completion - verified endpoint

The bounded completion endpoint is now exercised through real browser edits, retained source failure, additional edits/Undo/Redo/rollback compensation, blocked reopen, rejected retry, valid recovery-file export, repaired canonical retry, independent peer merge, another new edit, durable server confirmation and a second reload with exact element identities. A separate real IndexedDB quota-failure case proves a missing predecessor cannot be bypassed by later edits; explicit storage retry durably retains the complete prefix before reload and ordinary source replay/confirmation. No server checkpoint overwrite, unchecked raw transport, skipped conflict or relaxed canonical validation is used.

The final review traced source callbacks, optional capture failure, queue settlement, storage load/put/delete/generation, preparation/re-admission, disconnect/reconnect/reopen, duplicate acknowledgement, live peers, UI retry/download/unload, confirmation, disposal and explicit Reset. Normal publication still captures zero recovery snapshots. Factory/Core production code and backend validation were not changed in this recovery slice. Existing provider/operations/protocol and actual batch/Group/vector/Fill/Undo/Redo/compensation tests remain evidence for direct consumers. Recovery controls are registered in the package's existing test:local command.

Evidence and lineage:

- Durable prefix/load/recovery regressions, optional capture/conflict-storage failure, stale generation, Reset/export ordering and missing-draft retry were red before their bounded owner fixes. Logs: `tmp/recovery-prefix-red.log`, `recovery-review-red.log`, `recovery-generation-red.log`, `recovery-reset-export-red.log`, `recovery-no-draft-red.log`, `recovery-reset-handshake-red.log`. Setup-only runs are not behavior evidence.
- Final direct-consumer unit/integration run: 254 passed across 13 files (`tmp/recovery-final-consumers.log`). Includes lifecycle 28, outbox 17, provider 50, adapter 7, protocol 62, operations 45, document publication 15, publication feature 5, render startup 12, recovery UI 2, and Reset/mode 11. Earlier overlapping green runs are not additional tests.
- Complete real collaboration suite: 17 passed in 3.6 minutes (`tmp/recovery-closure-browser.log`, `tmp/recovery-closure-browser-results/`). After its direct Reset transport follow-up, the four affected endpoints passed in 47.2 seconds (`tmp/recovery-final-endpoints.log`, `tmp/recovery-final-endpoints-results/`), including the new isolated Reset case and strengthened post-recovery edit. The final small production delta is confined to the temporary Reset session handshake; all unchanged complete-suite paths retain their prior proof. This is 18 distinct browser cases, not 21.
- Backend reducer/Reset/error/retry suites: 42 passed (`tmp/recovery-final-backend.log`); no backend production delta in this slice. Browser/server production typecheck passed on final source (`tmp/recovery-verified-types.log`). Scoped lint, naming and Inspector/catalog closure logs are `tmp/recovery-closure-lint.log`, `tmp/recovery-closure-naming.log`, `tmp/recovery-closure-inspector.log`.
- Blocked and recovered screenshots were inspected; the downloaded canonical recovery document passes Core preflight and contains the exact retained local elements. The final recovery screenshots show the post-recovery edit as well. All browser runs kept source frozen; the historical navigation interruption is not assigned a cause by these successful runs.

Limits are explicit: if disk writes remain unavailable, work stays in memory with export and unload warning; closing the tab cannot be promised durable. If canonical preparation or admission still rejects a source, retry preserves the evidence and document instead of silently discarding it or claiming saved. The user can retry after the cause is corrected or export the valid recovery document when available. Reset is a separate destructive choice, never automatic recovery.

No live101, model calls, push, commit, PR changes or monitoring. This closes only the requested recovery endpoint and its direct regressions, not the full reusable-tool plan.

Final metadata closeout: Inspector/catalog 43 passed, naming 15 passed, scoped lint zero errors with 13 explicit console warnings, and scoped whitespace check passed. The test:local entry includes the new recovery UI suite. Temporary browser services on 3300/3401/4401 exited after the final endpoint run. All test artifacts remain local. No new candidate/target assessment or global plan completion is claimed by this bounded recovery report.

#### Recovery completion - asynchronous boundary review

This requested review reopens the bounded recovery task, not the full composition plan. Follow source publication -> preparation -> durable outbox -> source acceptance/ack cleanup -> reopen/retry -> later edits/confirmation, including in-flight reconnect, failed storage binding, disposal, history and rollback compensation. Read actual producers/consumers and deferred failure paths rather than relying on prior green totals. Scope remains the Design session/outbox/recovery controls and direct formal tests/spec/Inspector; no Factory/Core behavior change, server validation weakening, live101, push or monitoring.

Owner card: open-socket-authoritative-document-session, collaboration-reference.md / Recovery completion. Inputs: canonical/source publications, generation/bootstrap, ordered storage outcomes, source acknowledgements, active transaction boundary and session lifetime. Outputs: preserved current draft/source order, actionable recovery, valid replay, durable confirmation without collateral history reset. No async continuation may overwrite a recovery draft or revive a disposed session. Live publication rejection is not replay failure and cannot reload Core. Acknowledgement cleanup failure must enter recovery just like append failure. Reload admission must recheck active edits after asynchronous retention. Storage-generation binding failure remains recoverable without replaying a retired generation. Allowed contributors/boundaries are the existing session/outbox/Core public transaction/snapshot APIs, current recovery controls, their tests and contract documents. Forbidden: raw send, dropped evidence, blanket Core reload, weakening backend validation or new transaction authority. Failure owner: session. Prove deferred failures red, fix within owner, then direct-consumer unit/types/lint and real collaboration/Undo/Redo/compensation/storage-reload E2E. Stop and replan on an inconsistent generation/replay contract; do not add alternate persistence paths.

The async-boundary review found six failure categories, proved by seven red regressions: accepted-source deletion failure; reconnect overtaking recovery; live rejection after prior replay resetting history; active edits beginning during recovery; incomplete generation retirement/startup binding failure; and activation reviving after disposal. The fixes stay in the session and outbox owners. The 52 owner tests pass after correction. The real browser proof now covers accepted-source cleanup failure, subsequent edits and Undo/Redo, exact-identity replay, a new live rejection after replay, preserved Undo/Redo, another recovery, a subsequent edit, persistence receipt and durable reload with a second actor. Its first run stopped at a test-only bare module import in page.evaluate; the fixture now injects at the served provider module boundary and the whole case passes (28.1s). No production test switch or validation bypass was added.

Review of neighboring ownership: source preparation/Factory publication and canonical operations are unchanged by this slice; send precedes durable outbox cleanup; a failed cleanup retains exact identity; replay reuses server idempotency rather than constructing a new source; recovery snapshot work remains failure-only; current generation binding must finish before releasing storage failure; recovery/disposal cannot be overridden by an awaited connection result. Complete direct-consumer and browser regression gates remain pending below. This does not claim global plan completion or perfect handling of arbitrary storage loss.

Continuation within the same owner card: the Core-facing session adapter also awaits preparation before assigning its handle. Direct source inspection found that disposing during this wait can miss the pending controller; the deprecated preparation helper's cancellation test does not prove this actual App entry point. Add formal successful/failed delayed-bootstrap tests through createCollaborationDocumentSession, preserve a successor session's global handle, then correct adapter lifetime ownership before final closure. No Core/Factory mutation or new persistence path. The first complete browser pass is preserved separately; rerun affected startup/recovery endpoints after this closure, not unchanged batch workload cases.

The actual Core-facing adapter tests exposed both delayed-success revival and delayed-failure clearing of a successor's window handle. Both failed before correction (`tmp/recovery-audit-core-session-red.log`). The adapter now owns pending preparation, rejects preparation/activation after disposal, settles its controller and scopes global cleanup to its own identity. Lifecycle plus Strict Mode tests: 48 passed (`tmp/recovery-audit-core-session-green.log`). The complete collaboration browser suite passed all 19 cases before this final adapter change (`tmp/recovery-audit-browser.log`, 4.1m); affected startup/recovery endpoint rerun and final current-source consumer gates follow. No success is inferred from a predecessor run for an altered endpoint.

The final load-source handoff check also proved that an already returned checkpoint loader remained callable after session disposal. The permanent regression fails on that behavior (`tmp/recovery-audit-load-source-red.log`); the same session lifetime now guards load as well as prepare/activate. This is not a second cancellation authority: the existing App session owns all three entry points. The 8 affected browser endpoints passed after the pending-preparation adapter fix (`tmp/recovery-audit-final-browser.log`, 1.4m). The final guard changes only calls on an already disposed source; final owner/direct-consumer checks and ordinary startup browser proof close it below.

##### Asynchronous recovery review - bounded closeout

Final direct-consumer verification: 265 tests across 13 files passed on the final production source (`tmp/recovery-audit-closed-consumers.log`), including 37 lifecycle, 18 outbox and 3 recovery-control tests, plus existing provider, adapter, protocol, operations, publication, action, Strict Mode, Reset and mode consumers. Production typecheck passed (`tmp/recovery-audit-closed-types.log`). Scoped lint passed with zero errors and 13 explicit console warnings (`tmp/recovery-audit-closed-lint.log`); naming passed 15 tests. All newly exposed behavior mismatches were proved red before production changes; the original test-only browser module-import issue was corrected at its served-module fixture boundary.

Browser evidence is a lineage, not inflated case totals: all 19 collaboration cases passed in `tmp/recovery-audit-browser.log`; after the pending-preparation lifetime correction the 8 affected startup/recovery/compensation endpoints passed in `tmp/recovery-audit-final-browser.log`; after expiring the already-returned load source, ordinary startup and the complete accepted-cleanup/rejection/history/save/reload endpoint passed again in `tmp/recovery-audit-closed-browser.log` (2 cases, 28.0s). No endpoint failure remains. Normal/batch collaboration, reconnect, exact Group Undo/Redo, live drag/vector delivery, computed Fill fields, rollback compensation, generation Reset and recovery are covered by the complete suite and affected reruns. No live AI or 101 run was used.

Source review followed the actual App/Core session entry, immutable source preparation, ordered retention, acceptance/cleanup, failure isolation, retry, generation retirement, load-source lifetime, history and save receipt. The bounded correction changes only Design session/outbox behavior; it does not alter Factory/Core transaction semantics, other Apps, provider/server canonical admission or retry identity. Normal successful publication still takes zero recovery snapshots. Failed preparation and unavailable disk remain explicit blockers: memory-only work cannot be promised durable across closing the tab, and unresolved invalid sources are retained rather than dropped. Recovery requires correcting the cause before ordinary admission succeeds; export is available when a valid recovery document exists. Disposal settles an already-started preparation using the existing transport lifetime; it does not claim instantaneous network cancellation.

This closes the requested recovery review, not the global reusable-tool plan. No commit, push, PR operation or monitoring was performed. Final Inspector/catalog checks passed all 43 tests (`tmp/recovery-audit-final-inspector.log`); scoped whitespace checks passed. The owned temporary browser servers on 3300/3401/4401 have exited. No further product mutation is planned.

### Stage 1 push integration - current functional responsibility inventory

Latest main introduced exhaustive functional discovery after Stage 1 validation.
The rebased source adds 32 cases and renames one existing case; the old inventory
fails exact discovery equality. This metadata-only slice maps those actual cases
to their canonical owner entries and retains exact inventory equality. The saved
large-document membership case belongs to Preset data-channel projection, not Pixi.
Inputs are current discovered titles and existing source/spec contracts; outputs
are exact case mappings and a semantic projection responsibility. No production
behavior, Stage 2 work, model call, live 101 or CI monitoring is authorized here.
Allowed files are the functional manifest, responsibility spec/Inspector, generated
catalog, and their formal inventory/fault-proof tests. Gates: current discovery,
catalog/contracts, owner mapping coverage, and isolated real membership owner
fault/recovery. Existing product gates retain evidence only for identical files.
Stop on a product regression or an unmapped owner; do not weaken existing oracles.

### Authorized Inspector cleanup correction - 2026-10-15

Owner: Core Proof `execute-proof-run`, existing `runner.cjs` process settlement.
A real saved-document owner proof passed normally and detected the deliberately
broken owner, but final group cleanup reported EPERM as a spawn failure after the
runner had already exited. Two attempts reproduced it; there were no surviving
members when subsequently inspected. Do not ignore EPERM unconditionally or change
product assertions. Prove the already-empty group case separately from surviving
or unobservable groups; retain the actual child exit and fail closed on unresolved
cleanup. Inputs remain owned process identity, exit, deadline and cancellation;
output remains runner result plus accurate failure classification. No new execution
permissions, fallback product result, cache or process takeover.

Allowed slice: runner, permanent runner regressions, exact execution spec/Inspector,
and generated catalog. First fail formal regressions, then correct settlement and
run runner cases plus the actual unchanged saved-document positive/fault/recovery
sequence. Preserve deadlines, fail-fast, source ownership and cleanup. Runtime App
behavior and Stage 2 implementation remain excluded. This user authorization
explicitly withdraws the previous push; retain changes locally.

Cleanup iteration review: the actual denied group still had a macOS `?E` member
(exiting) when the leader closed. The initial immediate-absence correction therefore
correctly did not certify settlement, but the state parser also rejected that valid
transient state. Do not treat exiting/unknown state as gone. Reuse the existing
250 ms cleanup grace for bounded independent observations and accept only actual
absence. A surviving, malformed or unavailable group still fails. Permanent coverage
must distinguish transient exit, permanent live members and missing observation;
rerun the real unchanged positive/fault/recovery sequence after this bounded change.

The restored workspace case twice timed out after normal and injected-failure cases
completed correctly; its Vite process remained at one CPU core after HMR source
replacement. Workspace owner proofs compare isolated source versions, not live HMR.
Restart only the fixture-owned Vite process between those versions, await cleanup,
preserve every run log and keep the original test assertions, source restoration,
backend ownership and all existing deadlines. This harness correction is within the
authorized Inspector cleanup/integration scope, not a product or budget change.

Final fixture-consumer review found that teardown and source-version restart awaited
runner settlement but ignored its explicit cleanup error. The permanent fixture test
failed on this behavior before correction. Both paths now use the same fixture-owned
settlement helper: abort all selected services, await all outcomes, and report any
rejected promise or explicit cleanup failure. A cancellation without cleanup error is
normal. This does not turn an unresolved process into a passing proof or skip cleanup
of the other services. Evidence: `tmp/stage1-push/fixture-settlement-red.log` and
`fixture-settlement-green.log`. Final direct-consumer proof is recorded below.


### Inspector correction and Stage 2 planning outcome - 2026-10-16

The current cleanup implementation preserves the actual expected negative exit and
settles only an independently observed empty process group. It never accepts a live,
malformed or unavailable group as cleaned up. The fixture now reports cleanup errors
and uses a fresh Vite module graph for each isolated workspace source version.
The unchanged normal/fault/recovery proofs pass for both saved-document membership
and Factory group-history. No product assertion, timeout, canonical save validation,
App implementation or Stage 2 runtime behavior was changed in this tooling slice.

Final evidence under `tmp/stage1-push/`:

- `cleanup-contracts-closed.log`: 93 passed, 44 existing opt-in cases skipped.
  Includes the complete runner suite, contract discovery and default Playwright
  report/fault/recovery integration. This does not claim all opt-in owners ran.
- `fixture-consumer-proof.log`: saved-document membership and group-history each
  passed their real normal/fault/recovery sequence; owner coverage assertion passed
  (3 tests). The deliberate fault remains failed evidence and recovery is a new run.
- `fixture-settlement-final.log`: both permanent settlement regressions passed after
  the equivalent lint-only control-flow cleanup; the original red evidence remains.
- `catalog-closed.log`: all 8 generated-catalog contracts passed. The functional
  inventory has exact mappings for 443 discovered cases; enumeration is not a claim
  that all 443 browser cases executed in this turn.
- `cleanup-lint-final.log`, `context-closed.log`: focused lint and task context passed.
  `naming-closed.log`: all 15 naming checks passed.
- Earlier failed setup/cleanup/HMR runs remain failed. The final implementation
  changes after browser proof were an equivalent ternary-to-if rewrite and explicit
  Node timer import, verified by the affected fixture tests and lint.

All final proof fixture teardown completed. An older interrupted fixture's orphaned
services were separately verified by PID, process group, cwd and listener, then
stopped; details are in `service-cleanup.txt`. Local `.env` and all evidence remain.
No service belonging to another project was stopped.

Stage 2 review traced actual producer records, inspect/apply owners, Runtime
admission/iteration, common outcomes, partial recovery, primary judgments and
persistence. The execution review above now explicitly covers request ownership,
typed recheck descriptors, complete pending-set repair guards, parent-coordinate
basis, terminal retirement, stable progress, fresh successor selections and
independent mechanical/visual/durability completion. That was the Stage 2 planning checkpoint. The later Current authority and Stage 2
local completion sections above supersede its execution stop; they do not authorize
Stage 3, model calls, live 101, push or monitoring.

### Stage 3 delivery authorization - 2026-10-16

The user authorizes delivery of completed Stage 3. Main advanced only by the
Inspector documentation closeout eac2b0d8e719ee9055c846a24a033020c4b1c3cd.
Rebase and verify unchanged implementation inputs before push. Production Vite
build passes (7.80 seconds; existing chunk-size warning). Retain the current-source
integration evidence above, and verify actual-head task context, changeset and
Inspector source assessment. Keep the isolated navigation event explicitly unresolved.
Stage 4 remains planning-only and its later edits stay local.

### Stage 4 entry and admission - 2026-10-16

The user authorizes Stage 4 implementation after Inspector admission and goal setup.
Use the reviewed 4A-4D slices and the existing exact compose/settle/observe and Runtime
persist/invoke contracts. The initial target retains all 35 accepted Design obligations;
new or changed semantics/cases must update the matching owner and target before
production changes. Keep all predecessor gates, not only new Stage 4 checks.

Entry review confirms actual public owners already provide purpose causality, finite
iteration, genuine receipts, durable save and reload. Investigate missing combined
proof and concrete handoff failures; do not rebuild functioning mechanisms.

Stage 4 initial admission: target 626285be-1383-474d-a30a-e6565b78d399, revision 1,
using reviewed contract b6873583e8c5ced61d0a7225c302736048fb0969adae5e741bacb51fa0a19c7f
and review 49dd0e4e75810a8a3e43d10b79541bca645f50583821ea52c04b67761a13cb8d.
All 35 predecessor obligations remain allocated. Naming entry gate passed.

#### Stage 4A execution card - complete causal activity

Owner: Design settle, compose supplies invocation identity. Spec: Purpose lifetime
and Purpose continuity after execution. Inspector: settle conditions, allowed provider
result adapter/conversation projection, failure owner settle. Inputs: actual Runtime
invocation events, current request/cohort and authored purpose. Outputs: complete
scoped start/end progress through transport and the existing activity projection.
No extra model, copied inherited authorship, timers, alternate state machine or
canvas mutation. Boundary: local-ai-provider.ts and existing provider tests,
presentation/conversation tests and panel integration as direct consumers.

First verify nested coordinator start visibility in actual provider events consumed
by the production activity projection. Use scripted external protocol only; keep
real registry, Runtime invocation and event normalization. Test repeated starts,
parallel calls, successful/failed endings and request completion. A canonical owner
that already passes needs preservation evidence only. Gate: provider suite,
presentation/conversation/transport suites, types/lint and Inspector settle proof.
Stop to revise the same owner contract if event identity cannot support the handoff.

Stage 4A first correction: the real provider omitted nested coordinator starts while
reporting their endings. The strengthened actual provider-to-activity integration
failed on missing inherited purpose before the correction. Forward both lifecycle
edges with queued starts; retain leaf phases and existing projection ownership.
291 tests passed, three original skips; production types and focused lint passed.
Evidence: tmp/stage4/activity-{red,green,types,lint}.log. Remaining panel/storage
interval integration belongs to the later combined gate, not claimed complete here.

#### Stage 4B execution cards - nested execution proof and durable recovery

Invoke owner first: retain actual nested composition receipts in the existing private
execution evidence, bounded by the admitted finite graph. No public schema change,
log-derived proof, leaf output duplication or durable execution state. Persist owner
then consumes that evidence dependency-first with exact identity, applicability and
current saved-state checks. One root recovery handle retains child and parent proof;
independently acknowledged children survive a later storage failure. The existing
per-key store queue and CAS remain authoritative. No graph execution on save retry.

Boundary: recipe-execution.ts, tool-store.ts, existing recipe-flow/tool-store tests,
TOOL_SPECIFICATION and matching invoke/persist Inspector contracts. Formal nested
candidate regression must fail before production edits. Reject forged/foreign proof,
retired dependencies, partial results and stale writes; verify replay counts, fresh
load and invocation. Update admission before production, then run Runtime suites,
build/types/lint/naming and host/store integration. Do not add an App receipt catalog.

#### Stage 4C execution card - dependency availability at invocation admission

Exact compose/current-authority contract requires every composition dependency to
remain available before a new invocation, not only the named root. The real SQLite
reopen test proves the current host executes a parent after another connection
suspends its child. Correct the existing host admission traversal using canonical
admitted dependencies and keyed store management; deduplicate within this admission
only. Preserve already-started graphs, fail before writes, and do not reload a whole
library or add a new registry. Boundary: local-tool-library.ts and its real-store
integration tests. Existing compose availability and Stage 4C contract authorize this
correction; check direct native consumers and the combined browser gate afterward.

#### Stage 4A storage interval card - real operation lifecycle

The provider integration confirms automatic library saving has no active storage
call after the recipe finishes. Use the existing Runtime invoker for that actual
internal save, parented to the still-live native control (not the completed recipe).
The host forwards the existing execution phase and ordered start/end observations;
no new phase enum, activity machine, model call or public tool is needed. The save
input contains only immutable identity, not retained execution payloads. A failed
store result remains distinct from successful product work. Extend the same real
provider-to-projection oracle to require the saving label and retained purpose.
Boundary: library, host, provider direct adapters and existing integration tests.

#### Stage 4D execution card - existing browser flow with real durable library

Extend the existing aggregate mechanical repair browser case, retaining its five
success/interruption modes and real check/repair/Factory/collaboration owners. Replace
its in-memory library with the actual SQLite adapter. In the successful mode inject
an eligibility write failure after the canonical repair, then save-only retry while
asserting identical document/check state and mutation counts. Close/reopen store and
host, reject the expired receipt and old check selection, re-review current inputs and
reuse the saved recipe. Preserve peer edit isolation, Undo/Redo, document acknowledgement
and fresh page reload checks. No live inference, local harness or extra product owner.

Source-proof fixture review: the new host proof initially used an invalid root draft,
then omitted the real preparation ownership injection. Re-audit against the existing
local-tool-host integration fixture: use a frame with an editable child and the
actual host ownership passed to createDesignPreparationSession. Keep schema and lease
validation strict; both failures are fixture defects, not product regressions or
passing evidence. The combined browser test also corrected its new foreign-request
oracle to the current failed/not-started receipt (not an aggregate domain verdict).


### Stage 4 completion and fixed-scope review - 2026-10-16

The current local source closes the four admitted slices. No new task owner,
compatibility path, model reviewer, durable execution cursor or retry daemon was
introduced. No live model/101, remote operation or monitoring was performed.

Confirmed corrections:

- Forward actual nested starts as well as ends through the existing provider adapter.
  Automatic library saving has its own existing Runtime invocation lifecycle,
  parented to the live native control. Production transport decoding and projection
  preserve authored purpose and show the actual storage operation. Diagnostic phase
  failure cannot replace successful product work or durable storage evidence.
- Keep genuine successful nested composition receipts in private execution evidence.
  Persist dependencies before the parent, retain acknowledged children after a
  later failure, and retry through the original root receipt without executing tools.
  Forged/expired/foreign evidence and retired dependencies remain rejected.
- Check current saved availability of every composed dependency before a new graph
  starts. Shared dependency identities are read once per admission; native leaves
  still use their existing executor. Private and acknowledged candidates retain
  their current contract. Started graphs may settle but cannot republish retirement.
- Use a real SQLite library in the existing native-check/repair/browser flow. A
  library failure leaves the changed document and accumulated checks intact;
  save-only recovery adds no mutations. Reopen rejects old receipts and selections,
  then accepts a newly attached current selection and the saved recipe. Peer edits,
  unaffected passes, Undo/Redo and independently acknowledged document reload survive.

Final fixed seven-category review:

1. User behavior: traced normal/native/nested calls, parallel lifecycle consumers,
   cancellation and current-request retry; complete existing provider/activity and
   browser suites pass, including the original conditional skips.
2. Contracts: traced actual provider to NDJSON decoder to projection and panel;
   execution, library acknowledgement, primary judgment and document acknowledgement
   remain distinct. Root proof is private, exact and request-bound.
3. Invariants: canonical finite admission prevents recursive recipe cycles; per-key
   persistence serialization follows that dependency order. No user-authored receipt
   or log can substitute for execution evidence. No new input/output wrapper exists.
4. Recovery: before-commit and committed-before-reply faults preserve product work;
   retry is storage-only. Expiry after disposal is explicit, not fictional resume.
   Existing capacity, corruption, retirement, partial/unknown and cleanup tests pass.
5. Architecture: one registry/interpreter/persistence owner; Design translates actual
   lifecycle events. Factory, rendering, document protocol and shared history were
   not modified. The combined browser path proves their direct integration.
6. Work/resources: repeated child references cause exactly two admission reads for
   root plus child before four real leaf calls. Save-only retry leaves leaf count at
   four; fresh reuse uses fresh inputs/handles. No idle polling or broad reload cache.
   Test-owned ports 3352/3452/4452 exited; unrelated worktree listeners were untouched.
7. Verification: review covered changed owners and existing direct consumers, not
   only new tests. Exact negative controls fail the intended obligations and restored
   baselines pass on identical source digests. Initial failing and interrupted runs
   remain failed evidence; the retained Stage 3 navigation event is still unresolved.

Verification evidence (do not add overlapping test counts):

- Runtime whole suite: 377 passed; build passed (`tmp/stage4/final-runtime*.log`).
- Design whole server harness: 1,239 passed, nine original skips; AI/activity suite:
  586 passed (`tmp/stage4/final-server.log`, `final-ai.log`). Final admission-count
  assertion reran the entire library file: 17 passed (`admission-work-count.log`).
- Existing inspection/conversation/library browser suites: 34 passed, five original
  skips (`tmp/stage4/final-browser.log`). Real combined SQLite path includes complete,
  basis-changed, no-progress, cancel-after-write and interrupted-after-write modes.
- Production types, naming and scoped lint pass; lint reports four existing console
  warnings and zero errors. The final E2E formatting-only correction required no
  behavior rerun. Generated catalog contracts pass all eight tests.
- Formal screenshots `automatic-library-save.png` at the existing 360px and 1280px
  current-activity cases were visually inspected from the explicit 3352 site. Saving
  and inherited purpose are visible, with the composer and history preserved.
- Runtime candidate 4bce1bad-ed24-460e-8ac2-760ec51c6572, source
  678fb68134fb3c16eff805f4581b63c8ea382e9f3a6149806dfd8d01b4c45818;
  assessment 041cb828-a34a-4c7d-b236-c3d52b99862c is current/eligible (10 obligations).
- Design closure candidate c995cf40-1705-49f5-b3f7-14cdafa5ce3d retains source
  50829d700dbdb9350b40bed00d53b2c6780970cb45de5b4d3e9a4af4ee717284
  (36 obligations). Assessment 3d0c3c95-4eb0-47e4-ac53-ef730ad655e9 is
  current/eligible (`tmp/stage4/design-closure-assessment.json`).
- `tmp/stage4/source-controls.log` records all six Runtime and four Design exact
  negative scenarios, followed by passing recovery baselines. Their runtime source
  digests match the final candidates. This is not a baseline-acceptance mutation.

Limits: scripted external provider events prove the real integration, not future
model choices or a drawing-time guarantee. The previously unreproduced navigation
interruption remains the user-accepted non-blocking issue. This closes Stage 4 local
work only; remote delivery and a new live acceptance require a later user request.

### Stage 4 follow-up comprehensive review - 2026-10-16

The user reopens the fixed seven-category review across the Stage 4 diff and its
Stage 1/2/3 direct consumers. Scope: lifecycle/transport/panel, genuine receipt
persistence, current dependency admission, fresh-request reuse, real browser edits,
local pass accumulation, collaboration, Undo/Redo and durable reload. No live model,
101, push or monitoring. Retain earlier evidence only for identical source; diagnose
in-scope defects test-first. Existing Inspector admission remains the contract.

The nine prior server skips are seven real-provider inference tests, one installed
native-registration test and one saved large-document bootstrap test. The last two
are applicable without inference and now pass in tmp/stage4-review/bootstrap.log
and native-registration.log. The targeted native command deselects other tests;
those deselections are not new passes. The seven inference cases remain excluded.

Persist execution card: inspect publication after asynchronous dependency work,
including already-eligible idempotent saving. Input is a genuine completed receipt,
immutable definition and current host store; output must distinguish acknowledged
eligible state from concurrent suspend/retire. Allowed owner tool-store.ts, existing
Runtime and real SQLite host tests; spec Stage 4B/4C and Runtime persist require
current exact acknowledgement, never republishing unavailable revisions. First
reproduce with two actual SQLite connections and an intervening management write,
then repair the canonical persistence owner if needed. Preserve product outcomes,
mutation counts, capacity and save-only recovery; no polling, compatibility, new
format or weakening of CAS. Run complete affected persistence/host suites, existing
provider/activity/browser integrations, types/lint/naming and current-source proofs.

The real two-connection regressions both fail on stale saved eligibility
(save-race-red.log). The first post-edit App rerun also failed because it still
resolved the previous Runtime dist; the package has build:ai-agent-runtime, not a
build alias. After rebuilding the actual package entry, all 19 library tests pass.
The canonical commitStored no-write path now rereads exact bytes/version before
acknowledging unchanged state, and the eligible-save branch uses that same owner.
This preserves CAS writes and adds no product execution, fallback or persistent
format. It does not promise distributed serializability after the final observed
acknowledgement. Existing persist conditions already forbid late revival; no new
architecture contract or broader mutation scope is required.

The same final-publication review exposed load/resume checking the root before
asynchronous dependency validation. Two additional actual SQLite regressions
retire the root while its child is being read; both incorrectly publish/restore
it (restore-race-red.log). Extend the same persist-owner correction to final
registration, reusing one exact stored-entry confirmation after async preparation.
Do not add a second state authority or extra writes. The broad browser run also
failed the existing third Undo digest assertion; preserve its evidence and diagnose
that direct predecessor integration separately before completion.

Integration verification card: Design settle/observe preserves independent history
and durable publications (existing Frame revision case). The first run read the
third Undo digest after the shared helper's fixed 500ms delay; the production
shortcut awaits progressive history replay, whose completion event is published
only after its outer transaction settles. Two unchanged traced reruns pass, so the
original trigger is not proven. Strengthen this existing consumer to await exact
canonical digest and history depth before checking durable bytes, and retain traces
on the first failure. Keep the same keyboard input, expected snapshots, durable
acknowledgements and reload assertions. Only the existing conversation E2E file is
allowed; no Factory/history behavior changes, extra replay or enlarged timeouts.
A pending or lost shortcut must still fail the bounded semantic wait. Preserve the
first failure separately and do not claim the unexplained event itself fixed.

#### Follow-up review results

Fixed seven-category review, limited to this stage and its direct predecessors:

1. Contract and scope: mechanical acceptance, primary visual judgment, document
   durability and reusable-tool eligibility remain distinct. No extra inference,
   compatibility, second registry or broader stage was introduced.
2. Inputs/outputs: genuine private child receipts still authorize dependency-first
   saving; stale/forged/cross-request handles cannot authorize publication or replay.
   Retained root receipts describe storage recovery, not permission to repeat work.
3. Ordering/lifetime: all nested starts/ends reach the real transport before UI
   deduplication. Existing parallel, late-event, replacement-purpose, cancellation
   and save-phase cases pass. Final store confirmation now follows asynchronous
   dependency work for both saving and registration; it does not extend leases.
4. Failure/recovery: four new real two-connection SQLite cases reproduced stale
   acknowledgements and retired-root load/resume publication before the correction.
   Exact final version/bytes confirmation rejects them. Product success remains
   distinct from storage failure; retry performs no additional product writes.
5. Architecture: the correction stays in Runtime persistence; Design still owns
   SQLite and the panel projection. Existing Factory, history and document owners
   are unchanged. Their real browser and two-peer integration is exercised below.
6. Work/resources: unchanged commits do not add writes. Invocation admission still
   checks each composed identity once per graph; no polling/cache or larger limit.
   Only test-owned services are used; persistent local configuration is preserved.
7. Evidence and limitations: full existing suites supplement the regressions. The
   first Frame Undo failure remains retained in undo-first-failure; two unchanged
   traced runs passed but do not establish its trigger. The existing case now waits
   for exact canonical content AND history depth, then durable bytes, with first-
   failure traces. No arbitrary delay increase or keyboard replay was added. Do not
   claim that this proves the unexplained original failure's root cause fixed.

Final production-source evidence, under tmp/stage4-review/:

- Runtime: 377 passed (runtime-final.log); actual entry build passed.
- Server: 1,244 passed / eight skipped (server-final.log). One of those eight is
  the large saved-document bootstrap already passed separately in bootstrap.log;
  the remaining seven are real model-inference cases intentionally not executed.
  Installed native registration also passed and asserts no model turn starts.
- Existing AI/activity: 586 passed (ai-all.log). The later correction touches only
  store persistence, which this browser-state suite does not import; its unchanged
  lifecycle consumers are also covered by the final browser and server gates.
- Existing conversation/inspection/library E2E: 34 passed / five conditional skips
  (browser-final.log). Skips are three opt-in workload profiles and two retained
  recording/document replays requiring explicit fixtures; none is counted passed.
- Full collaboration suite: 19 passed (collaboration-final.log), including peer
  compensation, recovery after publication/IndexedDB/cleanup failure, subsequent
  edits, Undo/Redo, resend and acknowledged durable reload.
- Production types, naming and scoped lint passed; four existing console warnings,
  no errors. The final history-wait formatting error was corrected, not ignored.
- Runtime candidate 499b1450-bc1e-407c-ad75-effd3f779b98 has source
  070d0bf8a0bf7b1bc1e48c388e3623bc27fcff1c506a07b1ea8ab759190ab959;
  assessment c0887f9d-6369-404a-ae79-35abc7bbffd8 is current/eligible.
- Design candidate 5abfb6ac-9e2e-4f94-b500-2ea0eed79106 has source
  90c590184d9b13793dfdd3e89155b25bc1728a5e5ee9158a581f2fe8dfde25ab;
  assessment ed692f09-9631-4f88-bc92-0e312c275047 is current/eligible.
- All six Runtime and four Design exact negative controls failed only expected
  obligations, each followed by a passing restored baseline (source-controls.log).
  Their source digests equal the final candidates. All 44 Runtime and 807 Design
  captured files were compared with current bytes and match exactly.

Earlier failed runs remain failed evidence. No live 101, inference, push or
monitoring occurred. No source target/baseline was silently accepted or replaced.

Final history-consumer check: both 360px and 1280px cases pass after independently
awaiting the exact digest and the committed history depth (history-final.log).
The full suite's other 32 passing cases are unchanged; no broad rerun was needed.
Focused lint and diff whitespace checks pass. Test-owned ports 3352/3452/4452
are closed. Stage 4 local review is complete with the two explicit unresolved
historical event triggers above; do not convert those evidence limits into a
claim that every possible browser interruption is fixed.

### Stage 4 authority and deterministic verification review - 2026-10-16

The user reopens this stage only: remove inference-dependent formal tests, explain
recurring stale-authority failures, review persistence/status/reuse/Undo and recovery,
and directly correct demonstrated defects. No live inference/101, push, monitoring,
next stage, dependencies or environment changes. Existing local changes are retained.

Bounded replan and self-review: reading an entry is a snapshot, not a reservation.
Runtime's per-instance queue cannot serialize independent SQLite writers. The old
save fast path and restore path had separate early checks across await boundaries.
Previous Inspector cases exercised ordinary persistence but did not prove the final
publication boundary. A green case collection was incorrectly treated as coverage
of that missing temporal obligation. Fix verification at the same persistence owner;
do not add global locks, caches or claim that an acknowledgement prevents future
management changes. CAS acknowledges a write at its durable commit; a no-write
acknowledgement and local restore require exact current entry confirmation after
asynchronous preparation. Future invocation rechecks availability; an already pinned
valid invocation may finish, but cannot revive a retired durable revision.

Execution slices:
1. Deterministic-test policy: remove actual model-turn cases from Design server/E2E
   and scripts, their commands and active guidance. Keep scripted protocol streams,
   actual tool/SQLite/browser integration and installed registration without a turn.
   Add a permanent formal guard against the removed inference opt-ins, prove it red
   before removal. Historical run evidence remains historical, not an executable gate.
2. Runtime persist: bind final authority to an Inspector product case and negative
   control; exercise save/load/resume and both suspension/retirement with deterministic
   scheduling and exact versions, plus recovery and no extra product execution.
   Existing real SQLite regressions remain integration proof. Verify malformed owner
   acknowledgements and failure exits at the same boundary; test-first any finding.
   Allowed files: tool-store, its existing tests/fixture/recipe proof, current spec,
   Inspector persist step/manifest and generated catalog. No new persistence format.
3. Design history consumer: inspect the retained first failure, real input shortcut,
   progressive transaction and canonical publication boundaries. Add controlled delay
   and complete diagnostic capture in the existing formal Frame revision case to
   distinguish lost input, in-flight replay, rollback and wrong settled output.
   Do not infer historical causality from a successful rerun or remove assertions.
4. Fixed seven-category review across existing direct consumers; whole Runtime and
   server suites, existing activity tests, real browser handoffs and collaboration,
   scoped types/lint/naming and current-source Inspector proof. Stop after scoped
   closure; keep any evidence limit explicit. No new repository-wide discovery.

Review iteration: the controlled history fixture initially could not reach its
pause because the small Frame undo fits within the default replay slice. Force
one item per slice through the existing public CooperativeRenderOptions in that
single proof; do not add sleeps or change production scheduling. Native browser
imports must pass through the existing test runtime facade. Keep both failed
fixture attempts as evidence and retain the original unrelated failure separately.
The final durable reread also lacked identity comparison; the formal store test
first reproduced false success, then the owner added key equality alongside
version and bytes. Recovery reuses the receipt without executing product work.

The next diagnostic attempt showed no wrapper entries despite real shortcut and
Undo events: the test loaded a second extensionless history module instance.
Route instrumentation through the existing statically imported runtime facade,
so the browser proof uses the exact App history object. This is test wiring,
not a production defect. Recorded Undo events also precede the outer Feature
transaction's stack movement; name them replay-completed and retain independent
committed-depth, exact document and durable checkpoint oracles. The historical
failure still lacks its final input/transaction trace; do not infer its cause.

Review outcome for the fixed seven categories:
- Contract/scope: real inference cases were removed from the server, browser and
  scripts suites, their maintained commands and active guidance. Deterministic
  transcripts still exercise real registration, tools, SQLite and browser owners.
  The permanent boundary regression was red before removing the former live opt-ins.
- Input/output: final confirmation compares identity, version and exact record.
  Its malformed-identity regression was red before the owner correction. The same
  receipt succeeds after adapter recovery without another product invocation.
- Ordering/lifetime: save, load and resume share final confirmation after async
  preparation. Six suspension/retirement schedules are now an executable Inspector
  obligation. Per-instance queues do not claim to lock other SQLite connections.
- Failure/recovery: genuine nested receipts, before/after-commit failures, external
  retirement, request reopening and save-only retries remain exercised by actual
  SQLite connections. No retired state is resurrected and no product work is replayed.
- Architecture: Runtime owns authority, Design owns SQLite and presentation; neither
  Factory nor document protocol changed. Current status, existing read/write tools,
  collaboration, compensation, Undo/Redo and durable reload passed their existing
  direct-consumer suites, beyond the new regressions.
- Resources/work: no global lock, added polling, larger capacity or compatibility
  branch. The no-write path adds a final read, not another write or execution.
- Evidence: Inspector now fails persist.authority when final confirmation is removed.
  Seven Runtime and four Design negative controls fail only their declared cases,
  with restored passing baselines. The omit-invocation-calls control also expects
  persist.authority because that proof requires a genuine successful invocation.

Verified results (tmp/stage4-authority-review): Runtime 379 passed; server 1243
passed, with its two conditional cases separately passed: installed registration
without inference and saved-checkpoint encoding/decoding. AI/activity 586 passed.
Five browser suites: 51 passed, five workload/retained-fixture conditional skips;
collaboration: all 19 passed. Naming 15, boundary 14 and catalog 8 passed. Runtime
build and production server/browser TypeScript passed. Scoped lint has zero errors
and four existing console warnings. Do not count filtered-out tests as additional
passes. Earlier red cases and failed fixture setup runs remain failed evidence.

Runtime candidate 4b1593a2-d243-43e4-8a9b-f356a2b393ce, source
188bda0c1aea5dfa0a53a33f32902c910fbabea01985fbbdd1aa1809776c7ede,
assessment b8ed6ad3-01a8-46e3-9ac7-00279358fff7 is current/eligible (11 obligations).
Design candidate 7eaa2659-c20c-472b-97a2-1b96dc4c7ba5, source
98bb53cd97d7333d0efebed2b196458552f7cdb548751d6aacaf54c0971f6511,
assessment 02ceed5c-9f27-4ceb-978f-d90dc14272a7 is current/eligible (36 obligations).
The 44 Runtime and 807 Design captured files exactly match current bytes.

Undo evidence limit: the original final-shortcut/transaction trace does not exist,
so its unique trigger remains unproven. New instrumentation captures input, actual
history entry/return, replay events, history depths and document publications. A
controlled real replay proves a fixed keyboard wait can finish before the history
transaction. The canonical-content, committed-depth, durable-save and reload oracles
all remain; no automatic keyboard retry or timeout enlargement was introduced.
Diagnostic capture restores its instrumentation and cannot overwrite the original
assertion/navigation error. Its final capture-only validation is recorded separately.
No actual model inference, live 101, push, monitoring or remote operation occurred.

Final diagnostic-only history check: one controlled 360px case passed (51.1s),
with persisted frame-history-lifecycle.json and no publication decode failures.
The prior full 51-case browser result remains the broad evidence; this focused
case is not an additional distinct product case. Test-owned 3352/3452/4452 listeners
are closed. The requested scoped review is complete; historical Undo/navigation
trigger uncertainty remains explicit. Leave all work local for the user.

### Stage 4 complete follow-up review - 2026-10-16

Scope is the current Stage 4 diff and its direct Runtime persistence, Design
coordinator/status, history, collaboration and document consumers. Preserve the
seven review categories above. Fixed discovery: bounded source/diff reads,
existing failure artifacts, deterministic interleavings and the existing formal
integration suites. No inference, 101, remote operations, monitoring, next stage,
compatibility paths or unrelated framework redesign. Previous passing evidence
remains valid only for unchanged source; do not claim a historical cause from a
rerun. User authorization covers demonstrated direct regressions and their tests.

Step card - Design compose, durable-library handoff to Runtime persist:
- Spec: ai-execution-flow.md, Durable library; TOOL_SPECIFICATION.md, What is saved.
- Inspector: ai-execution-flow compose and reusable-tool-composition persist.
- Input: admitted finite recipe, real execution receipt, exact SQLite CAS commit
  acknowledgement, independent peer management and request-close signal.
- Output: separate product/storage outcomes, terminal observations, no product
  replay, no fresh invocation or reload of a retired revision.
- Condition: a write acknowledgement describes its commit; retirement after that
  commit must still block subsequent admission. Lost acknowledgement retains a
  genuine save-only receipt, which must not resurrect an externally retired entry.
- Allowed contributors: existing Runtime persistence/registry and real host SQLite.
  Forbidden: live model, second registry, locks spanning product execution, replay
  after storage failure, fabricated eligibility or timeout-based completion.
- Boundary: existing server/__tests__/local-tool-library.test.ts integration cases;
  production changes only if a formal regression identifies its incorrect owner.
- Failure owner: Runtime persist for storage; Design compose for receipt lifetime.
- Gates: real two-connection post-commit retirement with returned/lost acknowledgement,
  terminal observation and disposal, fresh request load; entire local-tool-library
  suite and direct store/control/invocation suites, scoped lint/types/naming.
- Self-review: this complements the pre-publication stale-read proof; it must not
  redefine a successful historical commit as permanently available. No new API.

Undo investigation remains read-only until evidence warrants an additional test
or correction. Compare original artifact and actual input -> Feature queue ->
progressive replay -> outer commit -> publication -> durable checkpoint ordering.
The original failure lacks the final input trace. Distinguish that unresolved
trigger from the proven fixed-wait/settlement gap; do not modify canonical History
merely to obtain a passing rerun. Stop discovery after these direct paths.

History consumer investigation card - Design apply -> settle:
Read existing Feature execution queue and public history boundaries. Add a
controlled browser input sequence in ai-conversation-flow.spec.ts: create a real
shape, hold the first Undo at the public history adapter, enqueue Redo and a normal
tool shortcut, release, and assert exact document, history and durable reload. This
is a diagnostic product case, not a claim about the historical failure. Allowed
contributors are real DOM shortcuts, existing test facade, actual Feature/Factory
and document owners; forbidden are direct stack edits, retries and model calls.
If it exposes a production defect, identify and admit its exact owner before repair.
Retain first failure trace; a passing result only excludes the controlled schedule.

The controlled browser case failed on current code: queued Redo followed by the
Select shortcut produced the empty document instead of the drawn rectangle.
Evidence: tmp/stage4-followup-review/queued-history-first-failure/trace.zip and
queued-history.log. The producer updates shared modifier state immediately; the
Feature reads it only when the serialized callback eventually executes. A later
shortcut therefore changes the meaning of an already-issued history command.
This proves a separate queued-command defect, not the historical third-Undo trigger.

Bounded revised apply card: the App input mapping owns translating a keyboard
chord into an immutable history direction in raw.detail; the Undo/Redo Feature
consumes that command through historyApis. Keep Framework's dequeue-time model
snapshot, queue, progressive replay, transaction and persistence unchanged. The
current event requires direction; missing/invalid intent performs no mutation,
without falling back to mutable Shift. Add key-combinations.ts, undo-redo/index.ts
and their exact integration test to apply's existing boundary. Update the current
feature spec. Run the actual producer/consumer test for Meta/Ctrl and both directions,
malformed intent and API rejection, plus the controlled browser failure/recovery,
ordinary history, collaboration, types/lint/naming and source-bound Inspector proof.
No generalized input rewrite or new queue. Re-read apply and settle before advancing.

Verification correction: the new exact App input/Feature proof is a mixed
browser/server integration verifier, so including it in the server-only TypeScript
program imports browser DOM types. Keep production server types unchanged. Move
only this verifier's type-check ownership into tsconfig.flow-proof.json, explicitly
including the existing browser declarations; the normal App typecheck command runs
all three programs. No unchecked test, production DOM allowance or indirect import
workaround. The Inspector maps apply.history-intent and a negative control back to
the actual mapping and registered Feature, supplemented by the real browser case.


Follow-up closure:
- Real two-connection SQLite tests cover retirement after commit with returned or
  lost acknowledgement, exact terminal storage outcomes, save-only recovery and
  fresh-request load. All 106 direct store/library/management/invocation cases pass.
  No additional persistence production correction was necessary in this review.
- The queued history defect was reproduced before repair in both the actual browser
  and nine mapping/Feature cases. The input now captures immutable direction; the
  Feature no longer reads a later shortcut's Shift state. No Factory, transaction,
  replay or document-persistence implementation changed.
- Actual history/dialogue/presentation consumers: 112 pass. Original Frame cases at
  both widths plus queued history: three browser cases pass. Existing history and
  inspection suites: 22 pass, two original conditional cases unexecuted. Complete
  collaboration suite: 19 pass, including peer compensation, recovery, Undo/Redo,
  IndexedDB retry and durable reload. Focused reruns are not additional cases.
- Inspector source candidate 9192cbf7-ffb0-43db-9453-82ec54e18a04 covers 37 obligations;
  source 0f7883e23ffe7d8cb5c6696ba32c257c5890d7ac60d30a2603e9a3d41cab1821.
  Target 0e5fd935-c067-4aa1-b4b9-ffe65eae8b9b, assessment
  75cc0094-2991-490f-a383-f3e79b18e700 is current/eligible. The exact negative
  read-late-history-modifier fails only apply.history-intent; restored source passes.
  Subsequent verifier type-program separation changes no runtime behavior.
- App, server and mixed integration-proof TypeScript programs pass. Catalog eight
  cases pass. Scoped lint has zero errors and one existing console warning.
  Evidence: tmp/stage4-followup-review/{storage-integration,consumer-tests,
  history-green,history-consumers,collaboration,history-source-controls,
  source-closeout,types-final,lint-closeout,catalog-tests}.log.

The seven review categories cover input/contract shape, semantic owner and direct
consumers, real success flow, failure/retry/retirement/disposal, concurrent ordering,
persisted identity/reload and unchanged behavior. This closes the scoped follow-up,
not a guarantee against all future defects. The original historical third-Undo
trigger still lacks its final input trace and remains unproven; the newly proven
queued-Redo defect must not be substituted as its cause. No live model, 101, push,
monitoring or remote operation occurred. Test-owned ports are closed.


### Stage 4 history admission correction - 2026-10-16

The user clarified the authoritative product requirement: while Undo or Redo is
executing, another Undo or Redo is ignored, never queued for later replay. This
supersedes the preceding queued-Redo acceptance expectation. Preserving issued
direction remains necessary for accepted commands; it is not permission to accept
commands during replay. No live model/101, push, monitoring or unrelated changes.

Step card - apply input admission to settle:
- Owner: App history input policy, consuming Factory's existing inUndo/inRedo
  lifetime through Core. Factory retains sole authority over replay state, stacks,
  compensation and outer transaction completion. No App busy flag, timer or lock.
- Inputs: actual keyboard chord, current Factory replay state, canonical event detail.
- Outputs: idle commands carry their captured direction into the existing Feature;
  busy commands produce no Feature event, history entry or delayed work.
- Existing gap: input combination callbacks cannot suppress dispatch, and Core lacks
  a facade for the existing Factory isInUndoRedo query. Add a read-only Core facade
  and an explicit synchronous false callback result at the generic input boundary.
  Void callback behavior remains the current normal contract, not a legacy path.
- Conditions: only explicit false suppresses dispatch. Other input remains usable;
  success and failure release replay state through existing Factory settlement.
  No broad transaction-idle filter that would suppress unrelated actions.
- Boundary: key-combinations.ts; existing undo-redo Feature intent contract;
  Core core.ts and facade integration test; InputSystem callback contract/dispatch
  and formal tests; existing history browser/proof cases, specs and Inspector apply.
  Framework additions expose existing authority and admission, not history policy.
- Forbidden: parallel busy mirrors, dropped transaction safeguards, replacing queue,
  modifying Factory merely to pass a test, replaying ignored commands after failure.
- Gates: red/green input admission and real App mapping/Feature cases; actual browser
  progressive Undo and Redo held inside Factory, repeated same/opposite shortcuts,
  ordinary shortcut unaffected, exact document/history/save/reload; replay failure
  release and subsequent accepted command; existing history/collaboration suites;
  Core/InputSystem suites, relevant types/lint/naming and current Inspector proof.
- Stop: complete these bounded gates and report; do not start another stage.

Self-review: a guard only at Feature execution is too late because Factory may be
idle by dequeue time. A guard that only erases detail still queues work and can
cancel an unrelated session, so rejection must occur before dispatch. Read Factory
at input time; its flags cover progressive replay through outer settlement. The
new Core facade must delegate to its injected Factory (not a global singleton).
The browser proof must pause within actual replay, not before calling Factory as
the superseded test did. Test both directions and failure recovery. Do not claim
this proves the trigger of the older trace-less third-Undo failure.


Direct consumer review found the existing 16-item collaboration scenario sends
Redo after visible empty snapshots, without an outer history settlement oracle.
The first run failed with an empty document after Redo. Do not infer timing from
that alone: retain actual keydown/admission events with Factory busy state and
history depth in this existing formal case before changing its sequencing.
Scope includes this direct history consumer only. If confirmed, wait for canonical
history settlement in the scenario, not a longer delay, retry or new product lock.


History admission closure - 2026-10-16:
- Product change is limited to the read-only Core Factory query, generic explicit
  false input admission, and App history shortcut policy. Factory replay,
  compensation, transactions and persistence production were not changed.
- Test-first evidence: the actual browser accepted three extra history inputs
  during held Factory replay before the fix. The source-bound proof also failed
  only apply.history-intent before implementation. No duplicated busy state.
- Core 269, InputSystem 36, App mapping/Feature 13 and FieldScope shortcut 1 pass.
  Four actual browser cases cover Undo/Redo success/failure, same/opposite inputs,
  unrelated input, no delayed replay, subsequent action and exact save/reload.
  Existing history regression: 18 browser cases pass (including the four above).
  Full collaboration: 19 pass in 3.7 minutes on the final frozen source, including
  peer convergence, compensation, failed save recovery and reload. Types, builds,
  scoped lint, naming and eight catalog tests pass. Existing lint warnings remain.
- Inspector recovery a8830b4c-66fb-4b96-a44a-74d3d8148d6b passes all 37 obligations.
  Policy negative 9cb8b96a-622c-4432-9d7f-9ec4eb65ab51 and dispatch negative
  8b2ff535-1eaf-4d6d-b297-b71097ab4539 each fail only apply.history-intent.
  Target 4d39a98f-bb17-4334-8295-d8ec6df7f6be revision 1; assessment
  b118a121-7e31-40c0-892c-96533a03ccc4 is current/eligible for runtime source
  90a48bcffdf57d0703a96e97b5d93fadfa16e71305cab70e3de11cca113eab9d.
  All 802 captured runtime files still match after final diagnostic-only edits.
- Evidence: tmp/history-admission/. Keep the initial collaboration failure: final
  Redo observed an empty document. A controlled outer-transaction hold stopped
  earlier, so it did NOT reproduce that failure. Three capture-only repeats and
  the final full suite pass, but do not establish the original trigger. The
  existing 16-item formal case now records actual keydown, admission, direction,
  Factory busy/depth, and history API entry/return/error, restoring observers in
  finally. The final trace contains six idle admissions, four Undo and two Redo
  entries/returns, no errors. No delay increase, retries or oracle weakening.
- Review covered input rejection before Feature/session queue, unchanged void
  callback consumers, injected Factory authority, immutable accepted direction,
  failure release, exact histories, collaboration and persistence. The earlier
  trace-less third-Undo and Stage 3 navigation events remain unresolved evidence
  limitations. No claimed root cause from passing reruns. No live AI/101, push or
  monitoring; stop at this scoped report.


### Stage 4 immediate history dispatch correction - 2026-10-16

This user-approved product requirement supersedes the prior admission-only closure:
Undo/Redo must never enter the interaction queue. During Factory history execution,
ignore new history input; when idle, execute immediately. Factory remains the only
history owner. No App lock, mirrored history flag, deferred command replay, model
run/101, push, monitoring, or unrelated stage work.

Read-only architecture review:
- The previous input guard rejects busy inputs, but accepted input still enters
  SessionManager.runAfterCancellingActiveSessions -> its captured interaction
  queue runner -> ExecutionRegistry -> App history API. The previous proof did
  not assert that accepted input bypasses the queue. Its completion claim was
  therefore narrower than the original requirement.
- Feature currently serializes all mutation handlers; active sessions own open
  Factory transactions and may have an asynchronous onStart/onUpdate/onEnd in
  flight. Existing cancellation finalizes commit-current or performs rollback,
  and can itself await user-defined handlers. Directly invoking replay alongside
  those handlers can mix histories or allow post-replay writes.
- Factory inUndo/inRedo currently describe actual replay through outer settlement.
  They also classify transaction origin and influence history recording. Setting
  them before finalizing an ordinary session is not a safe reservation trick.
- A new App pending flag, direct input-to-Factory bypass, general transaction-idle
  rejection disguised as history admission, or a priority queue that still stores
  the Undo request does not establish the requested contract.

Bounded task and review gate:
- Owner: existing Feature dispatch/session settlement and Factory history route;
  App declares history intent; Core exposes existing authority. No new registry.
- Scope: Feature dispatch/session/scheduler and their current public contracts;
  Factory/reactive-events only where required by demonstrated replay ownership;
  Core facade, Design history Feature/API/input and direct history consumers;
  existing product spec, Inspector apply route and formal integration cases.
- Fixed discovery: trace those entry points, actual transaction start/end and
  cancellation paths, direct input/toolbar consumers, and their existing tests.
  Preserve unrelated local Stage 4 work and current dependency versions.
- Required red proof: accepted idle input invokes history before any interaction
  queue admission; busy same/opposite input creates no queue work or later replay.
  Cover rapid consecutive input and current-generation shutdown/disposal.
- Integration gates: actual session interruption with commit-current and rollback,
  cleanup failure, replay failure/compensation, repeated input during settlement,
  normal action after recovery, exact history depth and document state, two-actor
  collaboration, accepted/durable save and reload. Use real owners; mocks may
  observe queue entry but must not replace the route being proved. Preserve
  existing Core/InputSystem/Feature/Factory affected regressions and types/lint.
- Confirmed by the user on 2026-10-17: interrupting a drag commits its current
  session through the existing onEnd/commit-current policy, then undoes that drag.
  Necessary settlement is not admission to the ordinary interaction queue.

Reviewed apply-owner card - 2026-10-17:
- Existing ownership verified: MoveElements already supplies commit-current;
  SessionManager already finalizes and closes that transaction; ExecutionRegistry
  already wraps finite execution; Factory owns replay, compensation and history;
  collaboration consumes existing publications and gates remote apply on actual
  transaction idle. None of these semantics needs a parallel implementation.
- Incorrect owner boundary: Feature execution admission unconditionally queues all
  events before calling the existing session-finalization route.
- Extend the existing Feature execution registration with an explicit immediate
  mode. One event cannot mix immediate and queued participants. Only the history
  Feature opts in. No event-name whitelist or second history flag.
- The existing interaction runtime supplies immediate execution as a non-buffering
  entry, not a priority queue. It begins the operation synchronously and provides
  settlement of the currently executing handler, not the queued tail. Its single
  active-operation ownership prevents ordinary callbacks from entering while that
  immediate operation settles/replays. Another immediate invocation is ignored
  while that operation is active; no pending command is retained. This is generic
  execution ownership, not a mirrored Factory history state or App lock.
- Reuse SessionManager cancellation exactly once after any already-running handler
  settles; do not repeat onEnd/onCancel or reopen the session. No active session
  means call the Feature immediately without an await or queued microtask. On
  failure, stop before replay; release runtime execution ownership in finally.
- Preserve generation/close checks before and after asynchronous settlement;
  shutdown drains admitted work, rejects pending normal work, and cannot run
  history in a successor. Existing Factory flags continue rejecting input during
  replay; normal input retains its existing serialized transaction boundary.
- Proof: real Feature input registration and SessionManager, not direct invocation
  of a mocked execution callback; spy on queue admission; idle same-stack entry;
  held onUpdate, onEnd success/failure, repeated input, queued unrelated command,
  disposal, later recovery. Actual drag through keyboard Undo, mouse-up and Redo
  verifies no stale drag update, exact history and durable document reload.
- Scope adds only the Feature runtime's existing core/type files and permanent
  tests to the apply contract. No Factory or persistence rewrite is planned.
- Self-review: rejected direct Factory calls (skip Feature/session), early Factory
  flag reservation (misclassifies session commit), a new App busy flag, and a
  queued high-priority history command. The accepted design reuses existing
  session/transaction implementation and changes only admission. Existing queued
  command/session regression suites remain required, along with real collaboration.

- Admission: target `17a344e1-1993-4aba-bf89-d1a06d7a1ab3`, reviewed candidate
  `1473c4bc-0ec9-4f46-9446-a97c673f65d1`; the real App dispatch proof failed
  `apply.history-intent` before implementation. This is admission, not acceptance.
- In-slice self-review tightened the same interaction owner's boundary: settlement
  of the running operation is enforced inside that owner, never delegated to a
  caller that could forget to await it. The new direct-owner regression failed
  before this refinement. SessionManager still owns only session finalization.
- Browser environment correction: the first drag-save check accidentally reused
  another worktree's port 4401 and hit a publication-contract 409 before the drag.
  That result is invalid as same-source product evidence. The replacement run uses
  dedicated port 4411 with all three services from this worktree; the unrelated
  listener was preserved. No persistence implementation was changed for it.

- Final lifecycle review reproduced a retired transport binding dispatching into a
  replacement Feature after asynchronous session finalization. The permanent
  regression first failed. The correction reuses `EventBinding.cleanupRequested`
  before snapshot/finalization and before execution, without a new registry or
  history flag. Existing unregister/disposal cases remain required. The completed
  collaboration run passed all 19 cases before this guard; rerun affected input,
  history and collaboration gates on the final guard source before closure.

#### Immediate history dispatch - bounded final review

1. Contract and input: explicit issued intent is immutable; normal callbacks retain
   their input semantics. Accepted history uses immediate Feature dispatch. Removed
   the contradictory active-spec statement that history traverses the queue.
2. Ownership and handoffs: InputSystem -> registered Feature -> existing session
   finalizer -> ExecutionRegistry transaction -> Factory replay -> existing
   publication/collaboration/persistence. Factory and MoveElements production were
   not changed in this correction. Mode belongs to Feature registration; shared
   participants cannot disagree. There is no event-name whitelist or App busy flag.
3. Ordering and invariants: idle input enters on the same stack; immediate work
   never appends to the queue tail. The existing execution owner awaits only the
   running handler and holds off ordinary queued operations. Commit-current ends
   the drag exactly once; subsequent pointer input cannot reapply it. Repeated
   immediate input is discarded without storage or deferred replay.
4. Failure and recovery: session-finalizer rejection stops history; existing
   rollback policy remains authoritative. Real controlled replay failures prove
   compensation, busy-state release and later history work. Actual browser proof
   confirms durable save/reload and a new edit/save after reload.
5. Lifetime: admission captures the existing runtime generation. Closure during
   finalization prevents later replay; stale callers cannot enter a successor.
   Existing transport retirement prevents a waiting invocation from targeting a
   replacement Feature. Queued ordinary work retains its serialization and cleanup.
6. Complexity and work: no new history queue, controller, registry, retained command
   list, timers, persistence retry mechanism, compatibility branch or model call.
   Only the existing Feature execution owner tracks its running operation; it does
   not mirror Factory's inUndo/inRedo or implement session finalization itself.
7. Evidence: tests include real Feature registration, session state and input
   dispatch, direct queue admission observation, genuine keyboard/mouse and exact
   persisted document digests. Existing suites supplement the new regressions.
   Tests with stale keyShift-only fixtures now consume current issued intent and
   prove changed live modifiers cannot reverse it; invalid intent remains a no-op.

Final-source gates so far: Feature 66, Factory 300, Core 269, App history/input/drag
28, Design Inspector 37; production Feature build and all App TypeScript projects
pass. Lint has zero errors and four pre-existing console warnings; naming 15 and
catalog 8 pass. Final history browser suite: 15 passed (1.9 minutes), including
active drag interruption, real busy replay, compensation and durable reload. Final
collaboration closure: all 19 cases passed (3.6 minutes), including two-actor
publication, rollback compensation, resend/reconnect, isolated recovery,
Undo/Redo and exact durable reload. Final Core rerun: 269 passed; all App
TypeScript projects passed again after the transport-retirement guard.

Inspector recovery `1c6803c9-ea6b-4bcd-a2ac-29ae53936b97` captures source
`111a59e62e0b9e9973c379b1ce6fcd7247948fcddcc0179628de503313ea1671`.
All four exact negative controls fail only `apply.history-intent`, then recovery
passes. Target `8bd253b8-fbcf-4bff-808c-1ed345edf05e`, assessment
`5ce717f9-b092-4299-be89-23252ccfa83b`: completed/current/eligible. Accepted baseline
was not replaced. Evidence: `tmp/history-immediate/`. Earlier red, invalid mixed-
worktree browser and intermediate results remain distinguishable from final passes.
The prior trace-less Undo/navigation observations remain unresolved; success here
does not establish their historical trigger. No live model/101, push or monitoring.

Closure: the final source manifest contains 807 files and all match current bytes.
The seven-category bounded review has no remaining in-scope production finding.
Test-owned listeners 3300/3401/4411 have exited; the unrelated worktree's existing
4401 listener was preserved. All edits remain local and uncommitted. Stop at this
user checkpoint; do not infer authorization for 101, push, monitoring or later work.


### Session cancellation policy constants - 2026-10-17

User-authorized follow-up to Stage 4: centralize the three existing session
cancellation values in Feature System, derive policy/outcome types from those
values, expose them through the existing Core facade, and update direct consumers.
Preserve all dispatch, interruption, transaction, failure and history semantics.
This is a representation-only refactor; it does not change an Inspector step's
semantics or add a route. No new Inspector boundary or admission is needed.

Bounded review: inspect all current policy literals in Feature System and App
consumers; distinguish session rollback values from Factory transaction outcomes.
Update the public session guide and developer Skill routing, then regenerate its
owned reference bundle. The installed external Skill cache is read-only.
Validate exported values and derived types (including rejected typo/outcome),
existing session lifecycle/failure/history tests, direct App feature consumers,
Core/App types, naming, lint, and Skill bundle integrity. No 101, inference, push,
monitoring, broader history refactor or compatibility layer.

Closure: Feature System 67 tests (including all existing cancellation, failure,
disposal and immediate-history cases), direct App Features 45, and Core facade
11 passed. The permanent policy typecheck is now part of local/CI package tests;
it rejects misspelled keys/values and feature-defined as a final outcome.
Feature/Core builds and all Design typecheck projects passed. Naming 15, public
documentation 11 and Skill packaging 24 passed. The real third-party installer
case is not applicable to this documentation-only Skill change and remains
opt-in; no installer, native model or installed-cache validation is claimed.
Scoped lint has zero errors and three pre-existing Feature console warnings.
The first documentation inventory assertion failed because the added example
raised the snippet count from 11 to 12; the precise count was synchronized and
the full documentation gates passed, without dropping any checks.

Review confirms one constant owner, Core re-export identity, literal-preserving
types, unchanged interruption/failure semantics and separate Factory transaction
outcomes. Updated maintained public guidance and generated offline Skill 0.1.13
candidate, with installed-API verification guidance; external installed 0.1.12
remains untouched. Public indices include the current local source. Evidence:
tmp/session-policy-*.log. Changes remain local. No inference/101, push or monitoring.


### Session policy contract owner correction - 2026-10-17

This user-approved allocation supersedes the preceding constant-owner decision:
Utils owns SessionCancelPolicies and the derived policy/outcome types. Feature
System imports the pure contract and owns its execution; Apps import these values
from Utils while invoking runtime through Core. Remove the Feature System and
Core exports, with no compatibility aliases. All policy values, session behavior,
transaction/history and failure semantics remain unchanged.

Scope: existing constant/type declarations, all exact policy consumers and public
exports, formal type/value/export-boundary tests, canonical package/public guides,
Skill source and generated references/indices, and this task's changeset. Fixed
discovery uses exact policy identifiers, current export chains and dependency
direction. This is a contract-location refactor without changing Inspector step
semantics; no new flow/admission. Move the policy tests and typecheck to Utils;
run Utils/Feature tests, direct App consumers, Core export tests, builds/App types,
naming/lint and documentation/Skill packaging gates. Self-review must verify no
old re-export remains and Utils imports no upper-layer runtime. No 101, push,
monitoring, new compatibility behavior or unrelated owner changes.

Owner-correction closure: Utils 101 (including the permanent typecheck), Feature
System 67, Core facade boundary 11 and direct App Feature 45 tests passed. Utils,
Feature System and Core builds and all Design TypeScript projects passed. Naming
15 and scoped lint passed (zero errors, three existing console warnings). Public
documentation and Skill packaging: 35 passed, the unchanged installer-only opt-in
case was not applicable/run. Generated public indices and offline Skill references
are current. No claim of native model/installer behavior or installed-cache update.

Self-review traced Utils root -> constants barrel -> one pure definition; Feature
System execution and handler types consume that definition, with no upper-layer
imports in Utils. App consumers import Utils directly. Core and Feature System
public policy exports are removed and absence is tested; obsolete source and
Feature-owned typecheck files are removed. The changeset now targets Utils and
Feature System, not a Core re-export. Transaction outcomes remain separate, and
existing lifecycle/failure/history regressions pass. No behavior, queue, history,
persistence or compatibility branch was added. Evidence: tmp/session-policy-utils-*.log.
All work remains local; no 101, push, monitoring or further stage advancement.


### Session policy owner review - 2026-10-17

Re-review the exact constant/type/export migration and its direct consumers,
Session/Factory history path, documentation and Skill source/bundle. Inspection
uses identifier/literal searches and AST checks of cancelPolicy, registerSession
and onCancel, including maintained JS examples and generated-template inventory.
No runtime behavior change or Inspector semantic change is planned.

Findings: Runtime Atlas still used four rollback literals, the Sim lifecycle
integration fixture one, and two Feature tests one each. Replace these with the
Utils constant. Incremental tsc left the removed Feature-owned constant in dist;
use the existing clean/build commands and inspect the actual built public entries.
The release-pinned Design CLI template also has literals, but is generated release
output: package-release-validation explicitly excludes template regeneration from
ordinary refactors. Do not hand-edit it or copy unrelated local Stage 4 changes
into a release template. No old policy imports/exports occur in that template.

Gates: existing Utils/Feature/Core/Factory tests, direct Design Feature tests and
App types, affected Sim lifecycle integration, real Runtime Atlas session-to-Factory
Undo/Redo and failure cases, naming/lint, docs/Skill synchronization. Keep source
policy values and error/transaction outcomes unchanged. No 101, model calls, push
or monitoring.

Review closure: all seven maintained-source policy literals are replaced. The
final AST inventory reports zero such literals in maintained Apps/packages/scripts;
eight remain solely in the release-pinned generated template described above.
Clean Feature build removed all four obsolete constant artifacts. Actual built
module imports confirm Utils owns the value; TypeScript's exported-symbol graph
also confirms both policy types are exported only by Utils, not Core or Feature.
No runtime session, history, transaction or persistence behavior was changed.

Fresh regression gates: Utils 101 (including typecheck), Feature 67, full Core
270, full Factory 300, direct Design Features 45, actual Runtime Atlas 15 and Sim
lifecycle integration 20 all passed. These include existing cancellation failure,
disposal, history settlement, canonical transaction/batch and lifecycle cases,
not only the new constant/export tests. Design's three TypeScript projects,
runtime boundary 13, naming 15, scoped lint and diff whitespace checks passed.
Utils/Feature/Core builds passed. Public docs and Skill generated checks passed;
their tests passed 35 with one unchanged installer-only opt-in skip. The latter
is outside this source/bundle change; no installer or installed-cache claim.
Evidence: tmp/session-policy-review-*.log. No new browser collaboration/save-reload
run was performed for this value-preserving migration; earlier browser evidence
remains historical for its recorded source. No inference/101, push or monitoring.


### Session policy browser integration follow-up - 2026-10-17

User-authorized closure supplements the Utils owner review with real Chrome
integration: complete undo-redo, transaction-history-groups and collaboration
specs. Reuse their existing current assertions for gesture interruption, busy
history rejection, peer convergence, compensation, recovery, durable confirmation
and reload. Run one worker, no automatic retries, fail fast. Use isolated
APP_URL http://127.0.0.1:3300, collaboration 3401, backend 4411 with test-owned
services from this worktree and unchanged persistent .env. Preserve every failure
and inspect the first incorrect owner before any bounded repair. No production
change is planned; any regression fix must follow the existing exact owner flow
and test-first rules. No live model/101, push, monitoring or later-stage work.
Record current-source results separately from prior browser evidence.


Browser follow-up closure: all 35 real Chrome cases passed on this worktree,
with one worker, retries=0, maxFailures=1 and no skips: undo-redo plus
transaction-history-groups 12 (1.5m), four success/failure busy-history cases
(58.0s), and the complete collaboration spec 19 (3.8m). The busy cases use the
existing controlled yield/failure adapter around actual history execution;
collaboration AI-response cases use deterministic recorded/generated responses,
not model inference. Services were built and owned by Playwright in order:
document backend 4411, collaboration 3401, Vite 3300. Listener cwd and resolved
Utils/Feature/Core/Factory package paths were checked against this worktree.
All three ports are closed after completion; persistent .env was unchanged.

Evidence includes active-drag Undo, subsequent Redo and durable reload, exact
nested history/peer state, post-reload edit/save/reload, ignored busy shortcuts
and recovery after injected history failure. Collaboration covers reconnection,
remote hierarchy/geometry restoration, live pointer updates, peer compensation,
isolated failed drafts, IndexedDB persistence failure, cleanup failure and
successful recovery without overwriting an independent peer. Pending/restored
Group and both peer screenshots were inspected. No failure, automatic retry or
production/test edit was needed. Logs, screenshots and diagnostic attachments:
tmp/session-policy-browser/{history.log,history-busy.log,collaboration.log,history,history-busy,collaboration}.
This adds current-source browser evidence; it does not diagnose unrelated
historical intermittent navigation/Undo events merely from passing runs.
No 101, inference, push or monitoring. Only plan/handoff evidence changed.


### Stage 4 complete current-source review - 2026-10-17

Review the fixed seven categories across Stage 4A-D and their Stage 1/2/3
producer/consumer paths. Fixed discovery: current owner contracts, bounded diffs
of Runtime recipe/persistence, Design library/host/provider and immediate Session
history changes; direct activity, check-selection/repair, store/management and
browser consumers. Preserve the current Utils-only policy contract. Require
actual failure/retry, retirement, request disposal/reopen, partial outcomes and
no duplicated product work. Reuse the immediately preceding 35 browser cases
only while their source is unchanged. Run complete Runtime, Design server and
AI consumer suites, the integrated mechanical-check/SQLite library/browser cases,
current-source Inspector proof, types/lint and affected predecessor gates.
No unrelated discovery, live model/101, push, monitoring or later-stage work.
Confirmed in-scope defects require a matching owner card and failing regression
before repair. Record historical navigation/Undo unknowns as such, not fixed by
a later pass. Completion means no open concrete finding in this bounded scope.


Compose-owner correction card: the full existing server suite fails the public
API exhaustiveness assertion for core.isInUndoRedo (server.log, 1 failed/1245
passed/2 skipped). Its current spec is History input admission: synchronous
Factory-state observation before input dispatch. It is not a model task action.
Existing compose Inspector owns canonical capability classification and includes
basic-api-dispositions.ts plus basic-api-contracts.test.ts; no flow semantics,
new tool or schema is required. Input: existing public Core method. Output: one
reviewed host-only disposition. Conditions: preserve direct App/Core use and
existing history APIs. Forbidden: exposing a model polling/control alternative,
removing the exhaustive assertion or adding an execution allowlist. Failure owner:
compose. Change only the disposition and this evidence; the existing failing
formal oracle supplies the red proof. Run the complete basic API/operation
consumer files, server harness, types and lint; keep unaffected browser evidence.


Current-source review closure: the existing exhaustive API oracle detected the
missing Core.isInUndoRedo disposition. The compose-owner correction classifies
it as synchronous App input admission, not a model action. Only that metadata
entry changed production source in this review. The initial failed server run
remains failed evidence; the complete rerun passed. No new controller, queue,
compatibility alias or relaxed assertion was introduced.

The fixed review covered normal/concurrent/reentrant use; exact request, recipe,
receipt and dependency ownership; invalid/foreign/expired inputs; cancellation,
partial work, ambiguous save acknowledgement, retirement and storage-only retry;
existing Framework ownership and direct consumers; bounded receipt/work reuse;
and actual integration evidence. Root and child receipts remain private and
request-owned, dependencies save before parents, retirement cannot be reversed by
late promotion, and new requests revalidate current durable authority. Activity
uses actual invocation ancestry and closes completed child claims independently.
Mechanical passes, primary visual judgment, document durability and library
eligibility remain distinct across Stages 1/2/3/4. No additional concrete in-scope
finding remains after the classification correction and repeated owner review.

Fresh results under tmp/stage4-complete-review/: Runtime 379 passed; complete
Design server 1246 passed and two original conditional skips; AI consumer suite
586 passed; the focused classification/operation confirmation passed 192 cases
(a subset, not an additional distinct coverage count). All three Design typecheck
projects, naming, scoped lint and diff whitespace checks passed. Real Chrome
conversation, inspection and library integration passed 38 cases in 5.3 minutes,
with retries=0 and five original conditional skips. These exercise real SQLite,
canonical browser mutations, scoped pass retention, prescribed repair, save-only
retry, fresh-request reuse, busy history, interruption and durable reload. Current
purpose at both viewport sizes, automatic library saving, and stopped retained
work screenshots were inspected. The preceding 35 history/collaboration browser
passes remain applicable: this metadata-only correction changes none of their
runtime owners. All Playwright-owned 3300/3401/4411 services exited.

Skip accounting: server skips are the opt-in saved large-document encoding probe
and installed native-provider registration probe (the latter explicitly asserts
zero inference). Browser skips are three application performance profiles and
two opt-in retained document/action replays requiring supplied artifacts. They
are not silently passed, live-model tests, or replacements for the combined
Stage 4 integration cases. No live AI/101 or performance improvement claim.

Current Design candidate 486e91d3-50a6-4560-b733-14a8d7896518 and recovery
7db06180-c0ef-4f55-a80f-e7eb313f0bfe share source
f6c59957b924ed5be96d0ffb1f1ce038b8dfd41f439b1ac9503872acaa718f23.
All 37 obligations passed; all eight negative controls produced exactly their
expected failures and baseline recovered. Target assessment
60c734a8-8825-42e1-aca8-4f874517464b completed current/eligible with no stale
reasons, using target 8bd253b8-fbcf-4bff-808c-1ed345edf05e and same-source
accepted-behavior preservation. Runtime candidate
0fa1a80c-6f3e-4939-a3bd-f48d3f0a33c4 and recovery
f55aa614-d8eb-4721-9ede-922be8c0c64f share source
188bda0c1aea5dfa0a53a33f32902c910fbabea01985fbbdd1aa1809776c7ede:
11 obligations passed, seven exact negative controls and recovery passed.
Accepted baselines were not replaced to obtain a green result.

Stage 4 is locally complete within its frozen contract. Earlier trace-less
navigation/Undo events remain historical unknowns, not newly diagnosed by green
runs; the user-accepted non-blocking navigation limitation remains explicit.
No commit, push, live 101, monitoring or subsequent stage was performed.


Stage 4 delivery correction - 2026-10-17: the formal dependency gate detects
the Runtime Atlas Utils import without a direct framework-site dependency.
Its existing Utils owner contract is unchanged. Add only the internal workspace
dependency and synchronized lockfile, then rerun dependency/build-graph/shared
checks and site validation. This is packaging correction, not a new runtime
owner or Inspector semantic change. The failing dependency log is retained at
tmp/stage4-push/shared/1.log. User now authorizes this Stage 4 push followed by
one recorded live 101 with a hard fifteen-minute deadline; no later push or
monitoring is authorized.

### Recorded 101 purpose and review-scope correction - 2026-10-17

Current task supersedes the Stage 4 cohort-expiry instruction. Use saved run
`tmp/ai-recording/runs/reusable-tools-1792174632012` only; no live inference,
101 run, push, monitoring, dependency upgrade or document/history redesign.
Preserve the four pre-existing local documentation corrections.

Root-cause review before implementation:

- The prompt says a concrete stage survives individual operation completion.
  Provider root-cohort completion instead retires it, and provider integration
  tests assert the generic fallback. The 230.024-second fallback is an authored
  contract mismatch, not a missing reducer exception.
- The original plan declares no regional units. Every passed visual criterion
  cites the whole-building image, sometimes with local crops. Those actual
  image dependencies really change after painter-order edits. Previous fixture
  tests supplied regional units that the real input omitted. They proved the
  mechanism, not the entry handoff. Never keep a judgment whose actual evidence
  changed or split a whole-image judgment into invented local approvals.
- Per-check image lists are optional and inherit every image in the submission.
  This silently broadens dependencies. Scope must be explicit at admission and
  carried back with coverage/repair replies, not reconstructed from prose.

Bounded owner cards and order:

1. Settle/provider activity owner (`settle`, Purpose lifetime). Inputs are actual
   native commentary, root/child invocation phases and terminal outcomes. Retain
   request-stage context until replacement, retry or lifecycle settlement;
   individual call completion removes only that call. Label context separately
   from observed operation, including after failure. Reject old/closed call
   events and retain concurrency/approval/Stop/save precedence. Remove the
   provider cohort bookkeeping, not add another busy/status owner. Boundary:
   local-ai-provider, existing activity projection/tests, prompt, product spec,
   matching Inspector and proof. Test the actual provider-to-projection path
   with recorded commentary and sequential/overlapping tools, late events,
   failure, replacement and terminal settlement. No invented work text.
2. Inspect/review admission owner (`inspect`, regional result accumulation).
   Keep existing requiredUnits: every visual criterion must explicitly provide
   it; [] means an intentionally whole-view judgment, nonempty stable IDs mean
   independent regional/cross-region obligations. Data criteria do not use it.
   Every submitted judgment must name its own inspectionIds; remove inherited
   all-image scope. Return the admitted obligations with capture/review handoffs
   so callers can submit only pending units. The original omitted-scope input
   must fail before plan storage or canvas application with actionable recovery.
   Explicit whole criteria still invalidate on changed whole-image evidence.
   The model, not a tool or hidden AI, chooses semantic partitioning. Tools
   enforce complete declared coverage and exact image dependencies. Boundary:
   local-design-review, local-operation-tools/direct workflow/schema consumers,
   current prompt, formal tests/recorded fixture, spec and Inspector. No cache,
   guessed geometric equivalence, silent legacy default or numeric limit change.
3. Integration/preservation: replay the saved input into the real public tools,
   exercise explicit corrected regional scopes, native browser edits, retained
   result revisions, sparse re-review and final acceptance. Check unaffected
   crops survive, affected/whole images expire, unknown scope stays unverified,
   cancellation/transport failure preserves prior results, and final acceptance
   still requires all obligations. Run direct provider/transport/conversation/
   presentation, review/check/workflow/schema suites, real browser inspection
   integration, production TypeScript, focused lint/naming and current Inspector
   evidence. Existing history/collaboration/save paths are consumers, not new
   mutation owners; preserve their formal integration assertions.

Self-review: explicit scope cannot guarantee the main model chooses a good
partition. It removes silent defaults and exposes the decision; do not promise
all global visual claims remain current after local edits. Keeping stage context
must not imply active painting: actual call phases remain separate and terminal
controls win. The saved raw fixture must remain raw, with corrected test input
constructed separately. Admission must be atomic and recovery cannot erase
previous passes. Test-first each owner; inspect direct consumer failures before
advancing. Stop only for a genuine out-of-scope owner change or contradictory
formal evidence; report limits without fabricating closure.


Recorded correction closure - 2026-10-17:

The two owner corrections are complete within this task. No new lifecycle owner,
cache, compatibility fallback, model call, Factory/persistence change or numeric
limit was introduced. Visual declaration revision 4 and judgment revision 5 expose
the explicit current inputs through the same registry, native schema conversion,
usage guidance, prompt and direct consumers. The raw recorded fixture remains
unchanged; corrected declarations are constructed separately in tests.

Test-first evidence lives in tmp/recorded-101-followup/: activity-red.log,
scope-red.log and undeclared-red.log fail the former behavior. The full current
server response harness passes 1,250 tests (two existing opt-in skips). Frontend
AI validation initially passed 48 files and failed the inspection fixture file
because its old whole-view declaration omitted requiredUnits; correcting that
fixture and preserving each regional image binding passes all 26 tests in the
file. Together the unchanged passes and corrected owner cover the 586-case
suite; the initial all-ai.log remains failed, not relabeled as a green run.
All three production typecheck projects pass. Naming passes 15 cases; scoped lint
has zero errors and four existing console warnings; catalog tests pass eight.

Frozen-source real Chrome inspection integration passes 12 cases with two
existing artifact-dependent opt-in skips. It exercises rejected recorded scope
at the public Runtime entry without dispatch or stored judgments, explicit
recovery, sparse review, independent pass retention, canonical mutations,
regrouping, Undo/Redo, cancellation, interrupted writes and durable reload.
Four additional existing conversation cases pass at 360/1280px, including stage
replacement, operation settlement, timeout, retry and one-Undo replacement.
Current-activity and timeout screenshots were inspected. Playwright-owned
3300/3401/4411 listeners are closed. No live inference or full 101 was run.

The first browser attempt was contaminated by watched-source edits during its
run and recorded unexpected Vite reconnections/reload. Its two failures and
traces remain in first-browser-failures; the full same suite subsequently ran
with frozen files and passed. This does not establish a general cause for older
trace-less navigation failures. A first candidate also failed because its
self-contained proof snapshot did not capture auxiliary fixture imports; the
proof entry now embeds the exact recorded evidence it needs while ordinary
integration tests consume the preserved JSON fixtures. Inspector production was
not changed to hide that failure.

Source-bound candidate 5b17f334-0207-4bd6-8832-bcbd099aa4ba and recovery
5627ccd7-b139-4982-8ef3-fab64fa0e3b4 pass all 38 obligations on source
503ac5685b2ec32e1833ae106aa4d08c91fef5b345a504c4bc45f002ff4edffa.
All 808 captured file hashes match the tested working source. Contract review
b7057dcfb04a3db3a5640559a56ece554bd78f2d9e5785dfc0313479611f7d37
was accepted with no blockers. Negative run
0dd9ec31-6b33-4817-89e7-351b1dee6e5c intentionally ignores canonical evidence
and fails exactly current-evidence, scoped-dependencies, regional-units and
regional-pixels; recovery passes. No accepted target baseline was replaced.

Bounded final review checked declaration/schema/example agreement, actual public
producer-to-consumer delivery, atomic rejection/recovery, sparse accumulation,
changed image expiry, cancellation/failure retention, sequential/concurrent/late
activity, lifecycle precedence and existing save/history consumers. No remaining
concrete in-scope finding was identified. The main agent still chooses semantic
regions and authors stage updates; tools cannot infer an unreported intention or
turn a changed whole-image judgment into independent local approvals. No live
latency improvement is claimed. Leave changes local; no push or monitoring.


### Scope and activity handoff review - 2026-10-17

Authorized follow-up: review the two recorded-run corrections and their direct
consumers, existing failure recovery and current requirement consistency. No
live AI/101, push, monitoring, new framework owner or unrelated repository audit.
Discovery is fixed to the changed owners, registry/schema/capture/review/store/
completion handoffs, provider/activity/panel/conversation lifecycle, active spec,
matching Inspector and prompt. Historical plan evidence is not current authority.

Inspect owner finding: explicit per-check image dependencies are stored correctly,
but the invocation owner still validates every enclosing image and uses that list
to reject submitted changes. An unused stale image can therefore reject a valid
local judgment before publication. The enclosing image list is availability, not
an implicit dependency, as already required by the current spec. Freeze the fix
at the existing review owner and its local-operation caller: derive the submitted
image selection once from the explicit checks; deferred-detail decisions retain
their documented enclosing-image dependency, capture requests still validate all
requested images, and referenced stale/unknown images remain rejected. Retained
passed evidence still participates in final acceptance and coverage. Do not weaken
freshness, cross-request identities, mechanical checks or atomic admission.

Step card - inspect: inputs are schema-admitted review submissions, declared
criteria/units and retained image receipts. Output is only admitted current
judgments plus existing pending coverage and recovery. Conditions include explicit
per-check membership, capture-only versus judgment calls, sparse/failed/deferred
judgments, cancelled or incoherent validation, changed prior evidence and final
coverage. Browser evidence is authoritative; no new image/model validator or
compatibility fallback. Boundary: local-design-review.ts, local-operation-tools.ts,
existing owner/server proof/browser integration tests, spec and matching Inspector.
First strengthen the real public browser handoff and owner regression; prove red,
repair selection at its semantic owner, then run existing review/workflow/schema
consumers and frozen-source browser recovery. Test unrelated stale images before
and after known retirement, while the same image remains rejected when cited.

Settle review card: trace sequential/concurrent calls, active ancestry, request
commentary replacement, old/closed events, cancellation/approval/save/retry and
panel rendering. Context without calls must be labeled Current task, with no
execution label inferred from prose. Existing call/phase owners remain sole
truth. Change implementation only after a concrete failing case, not because a
new status abstraction could be invented. Include existing presentation,
provider-to-projection and browser conversation tests rather than only new tests.

Self-review: this correction closes the admission-to-validation mismatch rather
than masking invalidation. It must not drop failed/unverified checks or deferred
dependencies when deriving selection. Unknown referenced images must still give
recoverable feedback; all-current final acceptance must remain required. Explicit
whole-view judgments may legitimately expire. No semantic AI partitioning claim.


Follow-up review closure - 2026-10-17:

Confirmed and corrected one additional inspect-owner handoff defect. Explicit
per-check bindings reached the result store, but both invocation freshness checks
and the direct review owner still treated unused enclosing images as mandatory.
The recorded menu could include a retired image and veto otherwise valid local
recovery. The existing public browser integration and direct owner regression
both failed before correction (tmp/scope-activity-review/browser-red.log and
scope-red.log). Selection now belongs to local-design-review's reviewInspectionIds;
the invocation owner consumes the same selection for validation and submitted-
change detection. Keep the original menu for subset admission; filtering it must
not admit references that were never offered. Capture and deferred-detail image
requirements are preserved. No numeric limit or accepted evidence was relaxed.

Full review followed raw input, native schema conversion, the real registry,
selection admission, browser receipt validation, atomic result publication,
independent pass revisions, sparse repair and final settlement. Existing tests
cover changed/foreign/unknown evidence, partial and cancelled validation,
canonical coverage, source requirements, transport failure and recovery. New
owner cases cover pass/fail/unverified submissions and deferred-detail evidence;
the source-bound regional case now repairs with an unused retired image still in
the menu. The browser test proves actual edit, stale rejection, preserved sibling
pass, local recovery and rejected reuse of the old image before durable completion.

No further activity runtime edit was justified. Existing provider integration,
projection and conversation tests plus strengthened 360/1280px browser cases
prove unrelated parallel purposes cannot replace common stage context, completion
exposes the surviving call, all calls ending returns to Current task, and late
starts cannot revive execution. Other existing cases retain queue/admission,
parent/child closure, approval, cancellation, timeout/retry, saving and terminal
precedence. Screenshots of actual current context and timeout UI were inspected.
The 66-case presentation file was rerun after correcting an obsolete test title
that claimed the original objective returned; its assertions already require
only the observed provider phase. Context remains authored information, not a
promise of pixels changing or an inferred new stage.

Requirement consistency review found stale authoritative prose: the plan header
still described Stage 4 as unpushed; Stage 4A retained root-cohort retirement;
API_SURFACES described the removed record_design_review tool, a pre-mutation gate,
blanket mutation invalidation, default deletion confirmation and query schemas
instead of the current menu representation. Corrected these to the active spec,
registry and permission contracts. Marked the old evaluation plan and handoff
section as historical; immutable run evidence was not rewritten. No unrelated
App requirements, global governance rules or framework semantics were changed.

Fresh local gates: full server harness 1,254 passed/two existing opt-in skips;
all 49 frontend AI files 586 passed; real Chrome 16 passed/two existing artifact-
dependent skips, retries=0; three production typecheck projects, naming 15,
scoped lint (zero errors, one pre-existing console warning), catalog eight and
diff whitespace pass. Browser services 3300/3401/4411 exited. The first focused
green attempt found only two old error-substring assertions; retained the useful
current-inspection wording while removing the incorrect pre-mutation claim,
then the complete server harness passed. This is not a hidden passed rerun.

Source candidate 7df0865e-285d-4f8c-a81c-c931a5c89746 passes 38 obligations on
b7056e39e02cd29c28bc7662913603bd7e077c0f0cb41a02007ec8b3b5ca04a4.
Contract review 1168cd21489bd67392f3e7821aead6c116d3e0138415d8a0ed77a3e72cce45fb
is accepted, with unchanged case identities and no blockers. Negative run
366e84db-2936-46f9-9240-f2903ee5f616 fails exactly the four expected inspection
freshness cases. The earlier negative command was blocked before execution by
pending contract admission; its log is retained separately. No target baseline
was replaced. Recovery run d04800f7-9b27-46f8-9161-9281b1c66f14 passes all
38 obligations on the same captured source and mapping revision 90. Final
comparison of all 808 captured file hashes against the worktree found no changes.

No remaining concrete in-scope issue was found by this review. This is evidence
for the stated contracts, not a guarantee of all possible model-authored intent.
The main agent still chooses semantic regions and announces stage changes;
actual changed whole-image judgments still need rechecking. No live latency or
101 improvement claim. Leave all changes local: no model calls, 101, push or
monitoring, and no automatically inferred next stage.

### Reviewed handoff delivery and recorded acceptance - 2026-10-17

The user now authorizes one push of the completed scope/activity corrections,
followed by one full recorded Taipei 101 acceptance. This supersedes the prior
local-only stop for delivery only; do not push subsequent test artifacts or
resume monitoring. Integrate latest main, preserve unrelated documentation edits,
and reuse verified unchanged source evidence. The independent deadline must
terminate the owned provider/browser execution at fifteen minutes from send,
retain failure evidence without asking, and distinguish timeout from completion.
Use the original full prompt and unchanged App model. Fit first content, changed
overall bounds and final content; keep ten seconds after normal completion.
Report first frame, phase timing/AI-tool attribution, actual local pass reuse,
parallel activity/context ownership, persistence/reload and final reference images.
No node-count-based improvement claim or production changes during the run.

### Recorded review, query capacity and activity handoff - 2026-10-17

Current bounded task: replay saved run reusable-tools-1792179056926 without a
model call. Correct incomplete review handoffs, structural-receipt contention
with query capacity and public activity churn. Analyze reference suitability
responsibility from the same evidence. Preserve existing unrelated README and
generated source-map edits. No live 101, push, monitoring, dependency changes,
Factory/persistence changes, artificial latency promises or increased limits.

Evidence: the eight handles released at 381 seconds were produced by structural
batch receipts at 200/362 seconds, not by eight live region queries. Immutable
recovery receipts currently consume the same eight-entry budget as materialized
queries. Releasing them loses recovery data; evicting pinned data is not a fix.
Review rejections protect real invariants: mixed whole/local dependencies, changed
unit scope without explicit predecessor, and an image omitted from the enclosing
menu. The next-call handoff currently supplies only flat IDs. Public status
projects admission and nested execution phases as different operations although
the actual user operation has not changed. All diagnostics must remain intact.

Reviewed execution order and Step Execution Cards:

1. apply - structural receipt/query retention. Inputs: successful canonical
   structural receipts, request signal, exact snapshot/lease and ordinary queries.
   Output: compact handles, recoverable immutable receipts and bounded queries.
   Keep one retained-context owner and the shared byte budget. Count only
   materialized queries against the query-entry budget; receipts do not allocate
   query rows and must not consume those slots. Pinned receipts still consume
   bytes and cannot be silently evicted. Retired/released handles never regain
   authority; historical receipt read cannot authorize an edit. No bypass for
   cross-request, cancelled, stale, oversized or genuinely full live queries.
   Boundary: retained-design-context.ts, existing structural-delivery and query
   tests; existing apply Inspector contract and execution-flow spec. Prove eight
   acknowledged group receipts followed by a real context read, receipt recovery,
   stale edit rejection, release/cancellation and independent entry/byte pressure.
   Stop on any need to change canonical mutation, Undo or storage ownership.

2. inspect - evidence binding handoff. Inputs: delivered images, declared
   criterion/unit identities and current result revisions. Output: a compact
   handoff describing each delivered image's target/region and each declared
   unit's existing binding/revision, without fabricated judgments or a new scan.
   Keep exact image/menu and supersession admission. Scope is explicit, never
   inferred from criterion prose. Recovery explains the available current binding
   rather than weakening admission or silently replacing inputs. Boundary:
   local-design-review.ts, local-operation-tools.ts and existing direct/registry
   integration tests, canonical schemas and current inspect contract/spec. Prove
   capture-to-handoff-to-judgment, independent pass retention, explicit redesign,
   foreign/unknown IDs and failure atomicity. Stop if this requires model calls.

3. settle - public activity projection. Inputs: ordered causal call events and
   authored purpose; diagnostics retain every event. Public operation labels
   represent active semantic operations, not anonymous nested implementation
   phases. Admission is not execution: expose context until real operation work
   begins; executing named children may replace their parent. Internal unnamed
   children inherit the nearest active named operation for public projection,
   without copying authored purpose or manufacturing execution. Distinct parallel
   named operations remain visible; completions, approval, save, cancellation,
   timeout and errors remain immediate. No timer/debounce or second state machine.
   Boundary: activity-state.ts, existing presentation/conversation/provider and
   browser integration tests, settle contract/spec. Replay saved event sequences
   and prove nested, parallel, late, rejected and terminal handoffs.

Reference audit: final indexes 3/1/6 were model-authored restricted decisions.
Tools verified identity/dimensions/criteria, not semantic subject occupancy. The
second image's restricted tower/detail role does not prove useful detail pixels.
Record the gap and a role-specific subject-region/resolution proposal; do not
introduce an unrequested classifier, arbitrary universal percentage threshold,
extra AI reviewer or pretend existing pixel validation certifies suitability.

Self-review: receipt recovery must remain byte-bounded even though query slots
are independent; no acceptance may be inferred from a returned review guide;
old result revisions must be shown without automatically superseding them; an
admitted-but-queued call cannot claim visible drawing; closing an anonymous
child must not close its parent or siblings. Existing independent pass dependency
logic, permission/transaction/save ownership and original reference bytes stay
unchanged. Close each owner with failing-before/passing-after formal regressions,
existing direct consumer integration, production types, scoped lint/naming and
current-source Inspector evidence. No live-performance improvement claim.

Apply-owner closure: the real structural-action integration reproduced the exact
eight-receipt/region-read capacity error before implementation. After separating
query-slot accounting from shared byte retention, 38 existing/new query and
structural integration cases pass, including historical recovery, stale consumers,
pin protection, cancellation and byte-pressure failure. Production typecheck and
scoped lint pass. Limits and canonical mutation behavior are unchanged. Inspector
contract admission 2056a44a1ede49574aa285e5e4a37d89ccad9b84b91caac8fc48d2c8d12041cc
accepted the reviewed owner boundaries. Advance only to the inspect card above.

Inspect-owner closure: canonical output revision 6 adds typed binding guidance
to the existing capture handoff. It lists delivered image target/region and
retained criterion/unit status, revision and prior image IDs, without copying
findings or auto-selecting dependencies. Scope-change errors identify the unit
and actual predecessor revision. The saved crown sequence reproduces both
intentional rejections and explicit local recovery while preserving the camera
pass. Direct and registry capture-to-review tests failed on missing guidance
before implementation; 281 cases now pass, with scoped lint and server types.
Two first green-run expectations needed correction: the canonical revision
bumped from 5 to 6 and declared checks are already unverified revision 1. No
admission rule was relaxed. Advance to settle using the card above.

Final bounded review found two handoff omissions and closed them before delivery:
retired image IDs alone do not describe an old unit scope, so guidance now also
decodes this owner's retained canonical scopes into target/view/region metadata;
these are diagnostic bindings, never current evidence. The red scope test then
passed. Actual authored child work must remain visible even without a registered
tool label; only unnamed system implementation phases project to their parent.
The full server suite exposed that preservation requirement through the existing
flow proof, while a provider assertion still expected admission chatter. Preserve
the authored child case and update only the admission expectation.

The recorded progress diagnostic omits toolStatus and authored text. Therefore
the new saved-phase fixture honestly replays starts only, using the simultaneous
DOM purpose; it is not an invented full event trace. Completion, nested and
parallel call behavior is verified by the existing provider/controller/browser
integrations and explicit terminal events. No claim of whole-run post-fix churn
or elapsed-time savings is made without a new live run.

Reference evidence: the second selected image is reference-1.jpg, immutable
reference:485fb39... in the retained run, 1120 by 665 pixels. Visual inspection
shows roughly 100 pixels across the tower and a cropped base. The main agent
marked it restricted for overall/details; the tool did not certify subject
coverage. Download, MIME, dimensions and immutable identity are acquisition
checks, not semantic suitability. Small occupancy alone is not a universal
rejection criterion: a silhouette source can still be useful while fine facade
detail cannot be recovered by enlarging its crop. Recommended next contract:
one primary-agent selection supplies intended criterion/role, subject region
and visible omissions; the existing pixel owner measures effective region
dimensions and returns them with the retained source. Compare those measurements
with the declared detail requirement, never a guessed universal occupancy
percentage. Reuse the original bytes/crop without refetching; reject or restrict
only the unsupported role, and batch acquisition for missing roles. No extra
review model or new automatic subject classifier is implemented in this task.


Apply-owner final consumer review: refinement currently spreads the parent
snapshot, including a structural receipt. A filtered target query must count as
a query and must not impersonate the original mutation receipt. Add a formal
red/green refinement regression, remove that copied receipt at this same owner,
and prove query pressure, cached reuse, release recovery and untouched parent
readback. This stays within the admitted apply boundary and unchanged budgets.


The apply refinement regression failed before the correction and now passes
with all 39 query/structural cases. Re-enter the existing inspect card only to
close its output-schema boundary: retained scopes are always produced but were
not listed as required. Reject missing scopes through the same canonical schema,
prove malformed-output rejection in the existing capture-to-review integration,
and retain the accepted input grammar and owner boundaries. No new behavior,
compatibility path or automatic decisions are added.


Delivery evidence for this bounded correction (no new live model run):

- Existing full server response harness: 1,256 passed, two existing conditional
  skips (external protocol executable and opt-in recorded large-document load).
  Existing full AI suite: 590 passed. Logs:
  tmp/recorded-handoff-server-final.log and tmp/recorded-handoff-ai-final.log.
- After final query refinement and required-scope schema corrections, reran the
  affected owners and consumers: 39 query/structural cases, 320 review/registry/
  flow-proof cases. Logs: tmp/receipt-refine-green.log and
  tmp/recorded-handoff-owner-final.log. Earlier red runs remain failed evidence;
  the focused schema red run also triggered the suite's expected all-tool
  visitation check because it selected a single test. The complete file passes.
- Final production, server and flow-proof TypeScript projects pass; scoped lint
  has zero errors and two existing console warnings. Naming: 15 passed.
  Logs: tmp/recorded-handoff-types-final2.log,
  tmp/recorded-handoff-lint-final.log and tmp/recorded-handoff-naming-final.log.
- Real browser current-activity integration: 360/1280 viewport cases passed on
  final activity source (24.9 seconds). Active inspection and completed-call
  screenshots were inspected. Internal anonymous phases preserve semantic work;
  completion returns to context. Log: tmp/activity-semantic-browser-final.log.
  Playwright-owned ports 3300/3401/4411 have no remaining listeners.
- Final Inspector candidate 7de1a9e1-3db7-4114-b810-fc5ac02f3eb4 captures source
  ac99bf1d0c1234c3c1976243b6d8bdf21fe8c83539bc973387b838267da8ed4c.
  Contract review 00eec9750b252fb2f107dadcbc375e32c911fa688d603b61d455a1266be49fc7
  accepted, mapping revision 92. Verify 3cc80608-eb80-43b9-9def-4a449145238a passes
  all 39 cases. Controlled ignore-canonical-evidence fails exactly four declared
  inspect cases; omit-structural-handoff fails exactly two declared apply cases.
  Recovery f170251f-07b6-49c1-b0bf-c2c7bb4849ab passes all 39 on the same source.
  Logs: tmp/recorded-handoff-{candidate,verify,recovery}-final.log and
  tmp/recorded-handoff-negative-{evidence,receipt}.log.

Final self-review: original evidence rejection, explicit redesign, independent
passes, borrowed handles, cancellation, byte pressure and query capacity remain
covered; no mutation/Undo/save ownership was changed. Actual authored child work
and parallel operations remain visible. Diagnostics are not hidden. Reference
suitability remains a primary-agent decision; the role/region pixel proposal is
analysis only. No time-saving claim follows from deterministic replay. No 101,
extra model, push or monitoring was started; unrelated README/source-map edits
were preserved.


### Principal operation, byte capacity and explicit reference scope - 2026-10-17

This user-approved review supersedes the previous entry-slot and child-visible
presentation decisions. Preserve the current worktree and unrelated changes.
No live 101, model call, push, monitoring, new dependency or persistence redesign.
Use current code, saved run inputs/outputs, direct consumers and existing suites;
do not expand into unrelated packages. The source is still HEAD 4e12f308b.

Reviewed owner cards, in order:

1. apply / retained context: remove the unsupported fixed eight-query entry
   quota and its unused internal option. Retain the existing byte budget, shared
   receipt owner, exact freshness, request leases and cancellation. Inputs are
   canonical queries/receipts; output is an admitted reference or recoverable
   capacity rejection, never partial eviction of pinned data. Test many small
   queries, mixed receipts, filtered descendants, oversized queries, genuine
   byte exhaustion, release/cancellation recovery and unchanged work reuse.
   Files: retained-design-context.ts, its formal tests, structural-delivery and
   execution-flow-proof tests. No unlimited-memory claim: serialized bytes are
   the accounting unit, not an exact JavaScript heap measurement.

2. inspect / reference applicability: primary AI supplies exact criterion roles
   and limitations; pixel comparison requires an explicit referenceRegion and
   existing target inspection. Tools never infer subject, alignment or purpose.
   Review direct reference-selection consumers for unnecessary invalidation;
   changed reference applicability must invalidate only dependent criteria,
   preserving unrelated passes. Unknown source scope cannot silently approve
   anything. Files: local-design-review.ts, local-reference-decisions.ts only if
   necessary, ai-domain-prompt.ts and existing formal reference/review/image
   checks. Prove invalid decision atomicity, scoped correction, unchanged pass
   retention, source recovery and explicit-region admission. No automatic
   subject classifier or arbitrary occupancy threshold.

3. settle / activity: one public status per principal invocation. A child with a
   live ancestor is not a separate public task even if named or authored; all
   child events remain in diagnostics. Only independent roots count as concurrent
   work. Admission is context until principal execution; root completion retires
   descendants and late events cannot revive them. Same reducer and causal graph,
   no debounce or new status owner. Files: activity-state.ts, existing provider,
   panel/presentation, execution proof and browser tests. Prove child start/end,
   errors/cancel, parallel root completion, retries and purpose separation.

Self-review: memory admission remains before publication, pins cannot be lost;
reference decisions cannot erase unknown source obligations or tool findings;
reference aliases/order alone must not create a new semantic dependency;
child-only messages cannot replace principal purpose, queued roots cannot
borrow an executing child's phase. Run focused red/green tests per owner,
existing full AI/server suites once integrated, production typecheck, lint,
naming, Inspector same-source proof and real browser activity integration.


Apply card closed: the new 64-small-query test failed at the old ninth query;
removing count admission passes it. Forty query/structural cases pass, including
actual byte pressure, pinned recovery, cancellation and derived-query reuse.
Enter inspect card: direct consumer review confirms selectReferences invalidates
all criteria whenever attachment selection changes, ignoring existing explicit
criterion bindings. Reproduce scoped replacement and identity-alias/order cases
before adjusting this owner. Preserve pending applicability and fact dependencies.


Inspect card: scoped reference replacement and alias preservation reproduced the
all-criteria invalidation; affected criteria now derive from immutable selected
reference identities and explicit role bindings, retaining bound-fact dependency
checks. Pending decisions still prevent final approval. Pixel-check omission is
already rejected before work; its regression proves retained results and zero-
pixel cached retry. The first test assumed a failure envelope at the direct
owner, corrected to its established throwing contract (host wraps failures).
Enter settle card with principal-only public projection and unchanged diagnostic
leaves; update superseded child-visible assertions, not lifecycle protections.


Principal operation review closed locally:

- Removed the superseded leaf-first public presentation wording from the active
  spec and Inspector. Principal invocations own the visible task; actual child
  phases, counts, ordering and failures remain diagnostic. Independent roots
  remain concurrent. No alternate state machine, debounce or inherited-purpose
  promotion was added.
- Full existing AI suite: 591 passed. Full existing server response harness:
  1,260 passed, two unchanged environment-conditional skips (saved large-document
  bootstrap and installed native protocol registration without inference).
  The earlier server run failed two superseded child-visible expectations;
  those runs remain failed evidence. Updated assertions still check raw child
  start/end phases, provider transport and cross-request saved-tool reuse.
- Query/structural tests: 40 passed, including 64 small retained queries, actual
  byte exhaustion, pin protection, release/cancellation and unchanged reuse.
  Reference/review/operation/prompt tests: 298 passed, including scoped source
  replacement, identity aliases, atomic rejection and explicit-region retry.
- Real browser activity cases: both 360px and 1280px passed; saved screenshots
  inspected. Automatic library-save children preserve the principal public task;
  completion restores context without claiming ongoing execution. Temporary
  browser service ports 3300/3401/4411 have no listeners.
- Production browser, AI server and flow-proof TypeScript checks passed. Scoped
  lint has zero errors and two existing test console warnings. Naming: 15 passed;
  generated catalog: eight passed; diff whitespace check passed.
- Current-source candidate b7b9ed82-b8d1-47ca-bd3a-e6bfef41b213, source digest
  5de19550b7219739e71425a6b8e4c926a7a4bc12c8ab754c12c38b116312c811.
  Accepted contract review
  a61a5c3cadab54f0a160e8873c7ef047b4cbf20143b45a99b3567af71ab7cc3a.
  Same-source proof passed all 39 obligations, eight exact negative scenarios
  and recovery (mapping revision 94). Recovery attempt
  0c1e27e7-0cb2-48aa-9b0c-caa8c52bdda0.
- Evidence: tmp/principal-{ai-full,server-final,browser,types-final,
  server-types-final,lint-final,naming-final,catalog-tests,final-proof}.log;
  tmp/byte-capacity-{red,green}.log; tmp/reference-scope-{red,verified}.log.

No live 101, model inference, push or monitoring was performed. This closure
proves deterministic handoffs and recovery, not faster live model completion or
automatic subject-quality recognition. The primary AI still judges whether a
reference supplies sufficient subject detail for its explicitly declared role;
mechanical image validity alone never certifies that judgment.


### Capacity and principal recovery re-review - 2026-10-17

Same bounded scope and exclusions as the principal-operation cards above. Review
current owners, direct consumers and existing tests, not only the last regression
additions. Preserve unrelated working changes. No new public API or owner.

Apply card: verify mixed request byte pressure, aborted-request reclamation,
sibling pins, stale query refusal and historical receipt recovery. Exercise the
existing retained-context and mutation/structural integration suites. Input is a
request-scoped canonical query/receipt; output is complete retained data or a
recoverable error before mutation. Add a permanent cross-request recovery case;
change production only if it exposes a defect. Existing apply Inspector contract
and implementation boundary remain authoritative.

Inspect card follows: verify pending/rejected reference recovery retains unrelated
passes and does not reuse invalidated approvals. Use actual image identity and
review/check owners. Invalid requests remain atomic. Existing inspect contract,
explicit criteria and canonical dependency receipts are unchanged.

Settle card follows: verify concurrent principals, failed/cancelled child and root
completion, retry, late events and terminal outcome. Match provider transport's
actual completed-status failure normalization; child failure is not whole-turn
failure. Preserve raw outcomes in trace and public principal ownership. Existing
settle graph/reducer, provider and presentation boundaries apply. Run full current
AI and server suites, scoped lint/types/naming and final same-source Inspector
proof. No live 101, model inference, push or monitoring.

Apply re-review: 74 existing retained-query, fill-consumer, structural-delivery
and runtime-lifetime tests pass, including the new mixed-request pressure case.
Cancellation releases only its leases; sibling pins and historical receipt
readback survive, stale mutation targets reject, a fresh request can recover.
No production defect reproduced in this slice. Advance to the inspect recovery
card above with the same current contract.

Inspect re-review: 299 existing review/check/operation tests pass. The new
pending -> rejected -> invalid correction -> valid scoped correction case keeps
the independent Finish result unchanged and requires a fresh Viewpoint judgment
before acceptance. No production defect reproduced. Advance to settle: strengthen
the existing real provider transport plus activity-projection success/failure
case, rather than substituting a reducer-only happy-path test.


Recovery re-review completion:

- No new production defect was reproduced. Added permanent mixed-request capacity
  recovery and pending/rejected reference correction cases, and strengthened the
  existing provider transport + activity projection success/failure integration.
  The latter verifies exact failed/success replies, the surviving research root,
  one completion per invocation and context-only presentation after all work ends.
- Direct consumers reviewed: retained fill and basic API mutation admission use
  the request signal and recheck freshness; transactionRunner finally releases
  that request's retained entries; structural historical receipt readback does
  not authorize stale writes. Reference changes use immutable identities and
  declared criterion dependencies. Provider child errors normalize to completed
  lifecycle events while the trace retains failure outcomes; they do not settle
  independent principal work or erase the request stage.
- Query/fill/structural/runtime integration: 74 passed. Review/check/operation:
  299 passed. Existing full AI suite: 591 passed; full server suite: 1,261 passed
  with the same two environmental conditional skips. No live inference.
- Browser production, AI server and flow-proof TypeScript checks passed; scoped
  lint has no errors and one pre-existing test console warning. Naming 15 passed;
  diff whitespace clean. No UI production change, so the previously inspected
  360px/1280px browser evidence remains applicable without another browser run.
- Current candidate 8528249e-d2d5-43aa-ae48-04a916ce2af1 passed 39 obligations.
  Product source digest is unchanged:
  5de19550b7219739e71425a6b8e4c926a7a4bc12c8ab754c12c38b116312c811.
  Mapping remains revision 94; the previous exact-source eight negative scenarios
  and recovery remain applicable. New surrounding integration tests were run
  explicitly above, not claimed to be included in the 39-case boundary proof.
- Logs: tmp/recovery-review-{query,inspect,provider,ai-full,server-full,types,
  lint,naming,candidate}.log. No live 101, push or monitoring. Existing unrelated
  README/template/source-map changes were preserved. No new compatibility path,
  quota increase, status owner or reference-image classifier was introduced.
