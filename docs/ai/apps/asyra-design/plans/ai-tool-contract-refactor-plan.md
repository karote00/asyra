# AI tool contract refactor

Status: DONE - approved post-run improvements locally validated, 2026-10-04. Historical drawing outcomes are preserved. No push.
Owner: this conversation. Parent: [execution improvement](ai-execution-improvement-plan.md).
Baseline: `c6506a164bea82a5c7284dd3c4a0b4f3bb17c7a5` plus the preserved, locally
validated execution-report and Fill changes in `codex/ai-execution-flow`.

## Approved post-run improvements - 2026-10-04

The user accepts the latest drawing's visual quality. The recorded automatic
partial outcome remains historical evidence, not a new requirement to redraw it.

Bounded contract: improve the existing Design compose, prepare, apply and inspect
owners using the recorded run and their direct consumers only. Keep canonical
geometry, order, identity, sparse new-value writes, history grouping, model/effort,
source resolution, cancellation and expanded resource ceilings. No Framework,
renderer, dependency, unrelated UI, remote operation or new drawing run.

1. Compose: derive discovery choices from admitted operations and return useful
   recovery choices on invalid lookups in the same call.
2. Apply: expose plural visibility and per-target Fill-row patches; resolve child
   IDs at the canonical owner. Reuse prepared identity references, including
   aligned per-target new values, without returning thousands of Fill IDs.
3. Prepare: automatically partition source validation/construction work within
   one immutable artifact. Retain global keys, parent/layout/projection and
   relation resolution; preserve expanded node/path/depth ceilings and reject
   an individually oversized primitive. No model round trip to split source work.
4. Inspect: distinguish required visual corrections from optional polish.
   Original user requirements and explicit acceptance own the quality target;
   model-authored criteria and reference images cannot raise it. Preserve real
   contradictions, missing evidence, data checks and freshness. Calibrate with
   existing formal accepted/rejected image cases; no landmark/style classifier.

DoD: focused failing regressions before fixes, one/many parity, identity and
layout equivalence across source partitions, invalid-batch no writes, bounded
receipt/call counts, discovery recovery, review calibration, App/server tests,
relevant browser/history gates, types, naming, lint/build and Inspector proof.
No speed or fresh drawing acceptance claim without a new measured run.
Self-review: source batching must not flatten hierarchy or split layout; target
references identify original members and never cache mutable Fill values; review
changes must not reinterpret an automatic failure as user acceptance.

### Step card - compose: discovery recovery

Spec: capability-discovery-and-composition; Inspector: compose. Inputs: admitted
registry and one lookup selector. Output: exact admitted schemas or a compact
failure with current categories and available native alternatives. Empty lookup
returns categories. Registry is the sole contributor; no fabricated aliases or
lexical execution. Boundary: local-operation-tools and its formal test file,
current spec/Inspector. Failure owner compose. Test nonexistent category/name,
filtered registry, exact lookup and no canvas dispatch. Stop on contract mismatch.

## API consolidation - 2026-10-04

User clarification: all document mutation APIs accept new values only; caller
old-state snapshots must be removed from every affected public mutation path.
Pure detached calculations must not become competing stateful edit routes.

User-approved scope: implement the decisions in ../ai-api-surface-review.md across
Design public/common APIs, their UI callers, AI contracts/adapters, discovery and
batch execution, with direct tests and current API/spec/Inspector documentation.
Freeze discovery to the audited 355-member inventory, composite actions and their
direct consumers. Preserve primitive capabilities, explicit coordinate/ownership
semantics, canonical setters, history groups, publication, model/effort, source
resolution and all unrelated local work. No new dependency, Framework redesign,
remote operation or live drawing is required by this API consolidation task.

Order: App mutation correctness and batch parity; AI batch exposure and truthful
receipts; authoritative semantic discovery; integrated formal validation.
Completion requires coverage of every public member, no redundant scalar mutation
tool route, one/many target parity, exact operation lookup, and applicable App,
server, UI, history, type, naming, lint/build and Inspector gates. Do not claim
model latency or drawing quality from these deterministic tests.

### Step card - apply: new-value Stroke patches

Spec: preparation-and-execution; Inspector: apply. Inputs: stable element/Stroke
IDs and requested new fields, optional host event options. Output: ordered
canonical record patches, preserving omitted fields and normal projection/history.
Empty patches bypass mutations. App reads only canonical target validity and
geometry needed by bounds repair, once per distinct owner within the synchronous
batch. No model old-state snapshots, renderer writes, secondary state/history or
cross-call cache. Failure belongs to apply; malformed/missing targets reject the
batch before writes. Allowed files: common-apis/strokes and its exports/tests,
Property Panel stroke interactions and tests, matching AI contract signatures,
API_SURFACES/spec/Inspector. Internal StrokeFieldsUpdate belongs to common APIs;
no stored document identity changes. Test first partial-write preservation and
invalid-batch atomic admission, then multiple owners, bounds work count and UI
migration; stop this segment on an unresolved semantic regression.

## Integrated recovery contract - 2026-10-04

This revision supersedes the earlier slice-completion claims below. The user
requested one integrated delivery after repeated regressions, not another
independent prompt tweak followed by a list of future optimizations.

**Outcome:** a drawing request preserves its intended style and verified facts,
receives actionable review of the actual drawing, can revise it without losing
canonical updates, and reports completion only with current evidence. A failed
review, stale inspection and failed persistence are different outcomes. Their
causes must survive every handoff. Passing tool admission is not drawing success.

**Bounded owners:** existing Design request/plan/review/settlement tools and their
direct browser consumers; Design collaboration publication, persistence queue,
HTTP client and backend reducer where the recorded run crosses those boundaries;
their existing specifications, Inspector routes and permanent tests. Preserve
all prior local work. No unrelated Framework, renderer, CI or UI redesign.
Keep the configured model/effort, canonical setters, Undo grouping, interactive
editing, original asset resolution and safety/resource guards unchanged. No
dependencies, push or changes to historical evidence.

**Evidence and discovery:** trace the latest failed run and its predecessor;
compare recorded actions, inspection generations, the exported document and the
actual durable checkpoint. Follow only these producers, consumers and their
existing contracts/tests. The latest export and checkpoint contain the same
6,239 elements, but 2,177 property records differ; durability stopped at sequence 741. This establishes an unsaved-update boundary, not its cause. Recover the
precise rejection through a deterministic normal-path reproduction before
changing canonical behavior.

**Execution order and acceptance:**

1. Diagnose and repair the publication-to-durability handoff. Permanent tests
   exercise the actual Fill/hierarchy operations involved, retry, read-back and
   reload. Accepted changes must survive in the checkpoint; errors retain their
   stage and cause. Do not hide a failed write, retry unknown mutations blindly,
   or bypass freshness checks.
2. Repair review-to-revision handoff as one request-owned contract. Retain
   concrete findings with their inspected evidence, distinguish stale evidence
   from uncovered scope, and preserve findings as diagnostics without allowing
   stale findings to approve completion. Revisions must be checked against the
   original requirements and unresolved findings, without re-deciding verified
   facts or replacing the user's intended style.
3. Validate visual judgment using preserved failed images and representative
   contrasting requests. A plausible-looking set of lines is insufficient proof
   of a coherent solid when the user requests one. An intentionally folded,
   rough or abstract drawing must remain valid for that request. Do not encode a
   preferred camera angle, landmark geometry or mandatory high detail.
4. Verify settlement and recordings across success, visual rejection, evidence
   invalidation, synchronization failure, cancellation and continuation. The
   final response must name the actual unresolved issue and retained progress.
   Each owned operation must retain correlated inputs/results and duration;
   unattributed elapsed time must not be labelled model thinking.
5. Run focused regressions, the integrated App/server and applicable
   collaboration/Undo gates, type/naming/lint/build and Inspector proofs before
   one source-verified headless drawing acceptance using the unchanged upper-two-
   tiers prompt. Inspect overview and native details, browser errors, durability,
   completion and recording together. If it fails, preserve the run and diagnose
   the failed owner before another attempt; do not declare partial gates DONE.

**Self-review:** the previous approach added an independent judge but did not
prove its whole-form judgment or its findings-to-correction contract. It also
treated persistence failure as a generic invalid inspection. The revised order
first makes state/evidence trustworthy, then proves judgment and convergence,
then validates the whole product flow. No fixed time target or extra mandatory
review loop is an acceptance condition. Completion requires the stated evidence;
an unresolved root cause or visual contradiction leaves this plan active.

### Active step - persistence failure evidence

Owner: `flush-persistence-window`, consuming backend failure from
`materialize-backend-document` in the socket-authoritative persistence Inspector.
Spec: socket-authoritative-document-session, Three-Second Persistence Window and
Acknowledgement and Failure Semantics. Inputs remain opaque ordered batches and
backend acknowledgements/errors; outputs retain the failed batch identity,
sequence range and actual failure cause while retrying the exact bytes. Empty
queues bypass work; only durable acknowledgements release entries. Implementation
is confined to the existing persistence client/queue and socket composition plus
their formal tests. No decoding, canonical repair, browser persistence owner or
assumed transport success is allowed. The queue owns failure propagation; the
backend still owns rejection. Internal diagnostic names belong to the existing
queue option/state contract; no new persisted identity or wire format is needed.
First prove loss of backend rejection detail and queue correlation, then preserve
it through retry/recovery. Focused queue/client tests and naming/type checks gate
this step. A passing diagnostic test does not close the unsaved-update defect;
the subsequent normal-path replay must identify and fix its first incorrect owner.

### Active step - publication encoding

The durable replay now fails formally with HTTP 409: request exceeds the 64 MiB
body limit. The source Fill publication is only 1,742,629 JSON bytes with 2,176
deliveries. `publicationWireUnits` repeats the whole slice ordering in every
delivery, producing quadratic wire growth. The new 64/128-delivery regression
fails at 252,244 bytes versus a 177,740-byte linear-growth bound. Keep the HTTP
limit and mutation batch intact; fix this first incorrect transport owner.

Owner: App wire encoder/decoder in `transport-live-publication`; backend and
socket consume the same opaque frames. Inputs are the existing detached
publication; output preserves every slice, batch, delivery, ordering and payload.
Store ordering once per slice and batch membership/count once per batch in
payload version 2, with ordered delivery units. Frame version remains unchanged.
Decode version 1 retained outbox/persistence artifacts explicitly; new writes use
version 2. Unknown versions, malformed indices/counts/order and compensation
metadata still fail. No cache, canonical state change, semantic payload repair,
framework change, guard increase or parallel persistence path. Implementation:
`src/collaboration/protocol.ts` and its protocol/worker tests, existing replay,
the App session spec and applicable Inspector transport contract. Gates: exact
round-trip, malformed/legacy payloads, linear byte growth, codec worker tests,
server persistence tests and full recorded-action durable equality. Stop and
retain failure if that equality still fails; do not infer completion from send
acknowledgements.

### Active step - review and revision handoff

Persistence encoding gates now pass: 60 protocol cases, 149 protocol/worker/outbox/
operation cases (before the final malformed-layout additions), type checking and
the full recorded replay. The replay's 49,391,815-byte canonical document and
durable checkpoint have the same digest. This resolves the reproduced byte-limit
failure without changing its limit. The work continues; these are not visual
acceptance results.

Owner: `inspect`, with `settle` as the direct consumer; product clauses Evidence
and completion and the independent comparison contract. Inputs: original user
request, selected original references, current overview/details, declared
visual/data criteria and prior independent findings. Output: one whole-request
visual judgment plus criterion findings, current evidence validation, unresolved
findings for revision and truthful completion eligibility. The original request
also governs whole-form judgment so omitted or weak model-authored criteria
cannot silently certify a visibly contradictory result. Prior findings are
questions to recheck, not construction instructions or proof. Data-only cases
bypass visual assessment; unfinished details are not structural failures.

Retain an assessment that becomes stale during analysis as diagnostic evidence,
with the exact freshness/coverage result; it must never approve completion or
erase unresolved failures. Only a fresh pass resolves a finding. No retry loop,
preferred angle, fixed detail level, extra model, automatic geometric repair or
mutation from the reviewer. Scope: existing review/operation/provider owners,
their current tests/spec/Inspector and preserved visual fixtures. Gate with
test-first whole-result rejection despite individual passes, stale-finding
handoff, preservation/resolution, coverage-versus-version errors, data-only
bypass and unchanged fact/cancellation semantics, then real-model fixture checks.

### Integrated acceptance result and bounded replan - 2026-10-04

The frozen-source live run `3de9c326-d532-47f5-bd40-302de89b863a` took
21m25s and correctly returned partial work: shape improved, but the independent
review still rejected the requested realistic finish. All 2,562 canonical
elements and properties match the durable checkpoint (sequence 8766); browser
errors are empty. Do not mark this plan complete. The prior “no failed calls”
progress summary counted thrown failures only and was wrong: normal tool returns
also contain unavailable results. Audit both paths.

Root cause at the preparation handoff: `vtracer` throws “Image tool unavailable”
when its generated SVG exceeds 8 MiB; the converter is available, but the agent
receives neither the actual limit nor a supported bounded native-pixel route.
The conversion selects a whole reference although only a small region supplies
this request's detail. Keep the byte/pixel/CPU guards and original bytes. This
iteration stays in the already-owned image preparation tool, its direct tests,
spec and Inspector: add explicit optional native-pixel region selection to the
preserve-vectors plan, return the source region and local coordinate frame, and
report oversize output with observed/allowed bytes and actionable region guidance.
No automatic crop, resampling, palette reduction, invented material or canonical
mutation. Existing full-image and background-separation behavior remains valid.

Step owner: `prepare`. Inputs are immutable request attachments, an explicit
representation plan and optional integer region. Output is an immutable local
vector artifact or a classified unavailable result. Use the existing Sharp
library and converter. The existing successful conversion cache stays invocation
owned; extend identity from attachment to attachment plus region, prove conversion
counts for identical/different regions, and never publish a cancelled artifact.
Prove native pixels, orientation, invalid bounds, guard diagnostics and cancellation
before implementation. Then verify actual conversion, all image/provider cases,
current contracts and integrated acceptance. Invalid cubic controls/bounds and
unknown API inputs remain rejected; do not turn those failures into guessed data.

### Acceptance follow-through - preparation budget diagnostics

The second frozen-source drawing (`16440f14-7757-467a-ab9c-c8d9dfd75aa4`)
completed in 10m42s with independent overall/scope/view/finish passes and identical
canonical/durable document digests. It exposed two recoverable preparation
rejections: 1,172 source children exceeded admission; wrapping the same children
in groups still exceeded the 1,000 source-node budget. The generic `node/depth
limit` response did not explain that grouping cannot reduce total source count.

Step card: owner/failure owner `prepare`; spec Preparation and execution; current
Inspector prepare inputs/outputs and allowlist remain authoritative. Inputs are
semantic drafts; outputs retain the same artifacts or reject with the precise
violated budget and recovery guidance. No changed acceptance limit, batching,
geometry, persisted identity, model or external dependency. Plain drafts and
pattern expansion remain separate source/output counts. Advice/direct edits
bypass preparation. Allowed contributors are the existing preparation/schema
owners; no model calls, inferred geometry or canonical writes. Edit only
`design-construction.ts`, `local-design-tools.ts`, their existing formal tests,
this plan and the corresponding spec/Inspector condition. First prove nested
source overflow, depth overflow and invalid node currently share an ambiguous
error; advertise the existing per-artifact budgets from their canonical constants.
Then prove precise rejection, unchanged valid expansion and full server/type/lint
and Inspector gates. Stop when these bounded diagnostics pass; do not rerun
stochastic drawing merely to test an error-message change. Preserve the completed
run as evidence of the rendering/review/persistence source revision, and label
this subsequent diagnostics-only delta separately.

Self-review: this closes the observed recovery ambiguity without treating model
input mistakes as a reason to relax guards or automatically simplify artwork.

### Integrated local acceptance - completed 2026-10-04

- Completed frozen-source request `16440f14-7757-467a-ab9c-c8d9dfd75aa4`
  in 641,667 ms (10m42s), using the unchanged upper-two-tiers prompt and
  gpt-6-astra medium. First application completed at 230.5s. Independent final
  overall and scope/view/finish checks passed; overview plus native façade,
  ornament and spire images were manually inspected. Photo-derived dimensions
  are disclosed as estimates, not survey measurements. This one successful run
  is not a guarantee of identical output or latency on future requests.
- 2,076 canonical elements; the complete 19,273,305-byte document and backend
  checkpoint have SHA-256
  `17542ca1b3d18ef6e0232b0cdffae98b7d1f143b7a632020b6313f56b1938faa`.
  Browser errors are empty. The formal harness waits ten seconds after successful
  completion before ending headless recording. Owned services exited; live-test
  opt-in was reset to false without deleting the local environment.
- Evidence: `tmp/integrated-region-live-20261004/` contains frozen source hashes,
  correlated records/report, native inspections, exported document, full-digest
  durability receipt and video. All captured source hashes were unchanged during
  the drawing. The subsequent diagnostics-only delta is separately proven below;
  the video does not claim to exercise those improved rejection messages.
- Two rejected preparations are retained as failures, not counted as successful
  drawing work. Their shared-budget diagnostics were fixed with three failing
  regressions first; 87 preparation tests pass. Complete server suite: 611 passed,
  four skipped (includes a real subscription VTracer protocol test). Official
  App/server typecheck, scoped lint, naming and App build pass. The broad default
  tsconfig additionally includes pre-existing test typing errors; it is not the
  App's configured `typecheck` gate. No unrelated test typing was rewritten.
- Earlier integrated gates remain valid: 373 App AI tests, 157 transport tests,
  durable replay of the original failing 49 MB document, gradient checkpoint and
  reload E2E, collaboration/Undo E2E, the 7,076-element formal gate, and four
  contrasting visual-calibration cases. Final Inspector proof passed one flow,
  three negative scenarios and seven obligations (attempt
  `b5b3ffec-b1e8-49de-b981-34ecdee3b762`). Build retains its existing chunk-size warning.
- Report timing: 52.1s measured App tool execution, 20.4s research, 63.1s observed
  provider reasoning events; 498.1s remains unattributed in the detailed breakdown.
  Do not describe that remainder as proven model thinking. The report's existing
  conservative `modelReview.current=false` follows the later read-only freshness
  check; actual final freshness validation and settlement succeeded. Historical
  opinion metadata is not the canonical acceptance authority.
- The previous run was 21m25s and partial. This run is complete with coherent
  connected geometry, visible materials/details and durable updates. Content and
  decisions differ between runs, so the elapsed-time difference is not a measured
  causal speedup. No fixed camera, Taipei-specific geometry, relaxed guard,
  source downsampling or mandatory high-detail policy was introduced.

No commit or push was performed for this recovery. The prior failed evidence is
preserved. This closes the bounded integrated recovery contract, rather than
leaving an identified owner defect as a future optimization.

## Earlier task contract (retained history)

Review the entire App-provided AI surface and refactor confirmed contract defects.
Completion means advertised inputs match admission, reusable facts are consumed
without redundant model assembly, failures remain actionable at their real owner,
and a delivered response is distinguished from a usable result. No speed or
visual-fidelity claim follows merely from fewer calls or passing schemas.

Scope: Asyra Design server tool factories/provider dispatch, their registered App
action descriptors and direct consumers, diagnostics, permanent tests, execution
spec and Inspector. Preserve prior dirty work. Do not change Framework semantics,
canonical setters, history grouping, permissions, configured model/effort, source
resolution, resource guards, rendering, search providers or external tools. No
dependencies, push or extra model evaluations. Run one headless product acceptance
after deterministic gates; diagnose failures before any repeat.

Discovery is one pass over the five tool factories composed in local-ai-provider,
the basic API catalog/dispositions, their runtime callers and formal tests. Check
schema/admission parity, producer-consumer references, input ownership, output
usability, cancellation/error ownership and retained-data lifetime. After edits,
review only these changes, direct consumers and fixed regression cases.

## Inventory and actual scenarios

| Surface / owner                                                                        | User scenario                                                              | Decision                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native provider research                                                               | Find references on the web                                                 | External capability; preserve native discovery. App owns import failures, not web search implementation.                                                                                                      |
| `import_reference_image`                                                               | Use a researched image                                                     | Keep original pixels and guards; report the actual rejection stage and valid next action. Repeated URL reuse must preserve the current source attribution.                                                    |
| Image analysis: trace, layer separation, component analysis, contour review/refinement | Trace an attachment or refine a known trace                                | Reuse artifact/analysis owners. Input/receipt mistakes and preparation failures must not abort the whole conversation. Preserve explicit cleanup/quantization choices.                                        |
| `prepare_design`, `prepare_and_apply_design`, release                                  | Draw a layout/illustration, apply ready stages, release unused preparation | Root and child keys identify semantic draft nodes, not canonical IDs. Accept an optional root key consistently. Keep all-or-nothing preparation and accurate applied receipts.                                |
| `describe_design_apis`, `execute_design_batch`, registered basic APIs                  | Edit vector anchors, patch many fills, organize objects, move viewport     | Catalog and canonical adapters already preserve public method ownership. Keep full discovery, plural calls and prepared target resolution. Prove all schemas pass through the same native admission boundary. |
| Registered higher-level operations                                                     | Arrange/organize, read narrow context, insert/replace a trace              | Keep existing canonical API and permission routes; validate wrapper arguments before dispatch rather than terminating on a format mistake.                                                                    |
| `inspect_drawing`, measurements, evidence validation                                   | Review the whole drawing or selected native detail                         | Honor the advertised overview default for every target, not only the last generated root. Explicit region/detail remains native; no silent downsampling of detail.                                            |
| `record_design_review` plan/facts/structure/visual                                     | Retain requirements, verified facts and review a stage                     | Keep phase-specific schemas and evidence semantics. Consume already-bound facts deterministically rather than require the model to repeat exact fact-ID lists in every check.                                 |
| Clarification/outcome                                                                  | Ask a meaningful question, stop or finish                                  | Preserve the final action route and truthful completion gate; no new UI flow.                                                                                                                                 |

## Reviewed findings and design

1. **Compose / native boundary:** schema validation is inconsistent across tool
   owners. Invalid wrappers and some analysis receipt mistakes currently reach
   the fatal transport route. Introduce one App-owned invocation boundary that
   validates each advertised definition before calling its owner. A typed input
   rejection carries a correction message; no guessed aliases or automatic
   semantic repair. Owner declarations identify preparation-only failures safe
   to return to the model. Unknown mutation/transport failures remain terminal:
   a started write must never be blindly replayed.
2. **Compose / result:** `success:true` currently means a returned string, even
   for `available:false` or `applicable:false`. Return a small explicit execution
   outcome alongside existing result payloads; distinguish usable, unavailable
   and partial evidence. Keep negative visual judgment usable as a review result,
   never misclassify it as a transport error. Diagnostics record this outcome.
3. **Prepare:** root key rejection confuses semantic keys with server-owned IDs.
   Optional root keys use the same uniqueness checks and existing keyToId owner;
   omitted root keys use the generated element ID as the selector. Never accept canonical
   IDs. Reference import keeps stage-specific reasons and current attribution.
4. **Inspect:** implicit detail for non-current targets contradicts the public
   overview default. Resolve the view consistently before capture. Bound facts
   already belong to the review owner: checks supply judgment/evidence, while
   the owner attaches the applicable fact IDs. Keep target coverage, invalidation,
   evidence freshness and final completeness unchanged.
5. **Observe / final integration:** summaries retain explicit tool outcome and
   recovery reason; transport completion remains distinct. Verify every family
   through real registered definitions, plus create/edit/organize/read/review,
   failed preparation followed by correction, and cancellation/unknown writes.

## Self-review before implementation

- Rejected silently fixing `sourceUrl` into `sources`: a field may represent a
  different meaning; exact schemas and actionable preflight diagnostics are the
  boundary. Source scope/verification remain model decisions, not invented data.
- Rejected blanket recoverability: a failed canvas exchange may already have
  applied work. Only pre-dispatch admission and declared preparation owners are
  safely recoverable. No automatic retry is introduced.
- Rejected deleting evidence gates to reduce calls. Known fact bindings can be
  reused, but current image coverage and visual judgment still must be supplied.
- Kept the basic catalog and phase review state machine: inspection found useful
  existing owners, not a reason to create a parallel API registry or new model.
- Each handoff has an existing producer/consumer: registry -> invocation -> owner
  -> receipt/content -> diagnostics/model; preparation handles -> canonical batch;
  bound facts/current images -> review. Canonical data stays in the browser.
- Public result metadata is additive within the App protocol; immutable previous
  logs remain historical. Removed redundant review input is removed from active
  schemas/guidance/tests, not supported through a compatibility alias.

No unresolved design finding blocks these bounded stages. Formal failures may
revise this design within the same scope before advancing.

## Execution and gates

One Inspector owner at a time, with a step card before its tests/implementation.
First prove missing cases red, then implement and review each owner.

1. Compose: shared admission/result boundary; provider fake-transport tests and
   permanent all-family contract cases. Verify invalid inputs call no owner,
   corrected calls stay in the same turn, native metadata stays valid and unknown
   mutations remain terminal. Naming/type gates before downstream propagation.
2. Prepare: root-key uniqueness/reference errors and provenance; local design,
   workflow/reference/image tests, including unchanged work reuse and cancellation.
3. Inspect: overview default and automatic retained fact references; review,
   operation and inspection-evidence tests, including negative/stale/missing data.
4. Observe/integrate: diagnostics tests; entire App server suite from App cwd,
   affected browser unit tests and inspection/conversation E2E, typecheck, scoped
   lint, naming, App build and source-bound Inspector proof/review. One headless
   upper-two-tier Taipei 101 live acceptance with recording and visual inspection.
5. Final bounded review: every inventory row, direct consumer and required gate;
   record concrete findings, fixes, unchanged intentional boundaries and limits.
   Finish goal only when these obligations are satisfied. Do not push.

## Step card - compose

Spec: AI execution flow, Capability discovery and composition and Tool invocation
contract. Inspector `compose`: request/registered schemas/actual receipts in;
admitted tool program and classified result out. No new cache, semantic argument
repair, canonical writes or external service implementation. Extend its existing
implementation boundary to the shared server invocation module and test, plus
owner metadata/error declarations in the existing factories. Provider dispatch
consumes those declarations; it does not infer policy from tool names. Failure
belongs to compose admission or the explicitly declared execution owner. Cases
and gates are stage 1 above. Stop for unknown mutation settlement or any required
Framework change; preserve the existing fatal handling in that case.

Compose checkpoint: four new provider regressions failed before implementation.
The shared invocation boundary now passes 119 focused provider/invocation/flow
cases (three existing opt-in skips); naming passes. All five tool families use
the registered input schema before owner dispatch. Preparation recovery belongs
to the owner; removed the provider's hardcoded image-tool recovery list. Review
confirmed unknown mutation failures still cancel queued work, no automatic retry,
and negative visual assessment is a usable result rather than execution failure.

## Step card - prepare

Spec: Tool invocation contract / Preparation and execution. Inspector `prepare`:
validated semantic draft or source URL in; immutable artifact and explicit findings
out. Optional root key uses existing keyToId and uniqueness; no supplied canonical
identity, geometry changes or new retained cache. Reference owner retains existing
same-request decoded-image reuse, while each receipt keeps the caller's source
attribution. Failure owner is preparation/import; guards and original pixels remain.
Files: design-preparation.ts, local-design-tools.ts, local-reference-tools.ts and
their existing formal tests. Red tests: keyed root, duplicate root/child key,
same image with another source URL, exact HTTP/byte failure reason. Gates: focused
preparation/reference/workflow/image suites plus typecheck. Stop for format support,
new dependencies or altered canonical schema requirements.

Prepare checkpoint: three regressions failed first; 83 preparation/reference/
workflow/image cases now pass. Root keys map through existing server-generated
identities; duplicate keys reject. Same-image attribution changes perform no
additional download or attachment creation. HTTP errors carry the actual status.

## Step card - inspect

Inspector `inspect`, Evidence and completion / Tool invocation contract. Inputs:
explicit target/view/region, current canonical evidence, saved criterion/fact
bindings and model judgment. Outputs: current overview/detail and checks enriched
with already-owned fact references. The review owner resolves bindings; the model
still supplies each criterion's evidence/status. No inferred truth, changed facts,
implicit detail reduction, new cache or weakened coverage. Failure remains at
inspection/review admission. Files: local-operation-tools.ts, local-design-review.ts,
their direct tests; existing prompt/tests for changed input guidance. Cases:
non-current target default overview, explicit detail/region preserved, bound facts
attached without resubmission, unknown/missing/stale facts and evidence still reject.
Gates: review/operation/prompt/evidence unit tests and server types. Stop if capture
or canonical evidence semantics need changing; those stay unchanged.

Inspect checkpoint: two regressions failed first; 104 focused tests pass after
updating explicit native-detail consumers. Bound fact citations now come from the
same review owner's existing map. Current stamps, target coverage, dependency
invalidation and full final criteria remain enforced.

## Step card - observe and integrated verification

Inspector `observe`, Execution recording/evaluation. Input: the invocation owner's
explicit toolOutcome and original receipts; output: bounded summaries, usability
and reviewable failure feedback. Recording cannot alter execution. Consume the
new outcome directly; keep historical-format interpretation only in the existing
diagnostic reader. No cache or new model assessment. Files: local-ai-usage.ts,
local-ai-evaluation.ts and records/evaluation tests. Cases: returned input rejection
must be unusable even when capability available=true; mixed receipt partial;
negative visual judgment remains usable output; old logs retain existing meaning.
Then the fixed complete gates and headless product run from the task contract.

Final compose review found canonical mutation status=partial and incomplete
review coverage were not yet represented in the new outcome. Compact batch
acknowledgements also need to count as successful work when another result fails.
This remains in compose result classification; add formal regressions before the
correction. Do not conflate accepted=false visual judgment with missing coverage.

## Final compose correction card

The live run completed, but exposed two result/admission presentation defects:
region inspection uses partial=true to describe image scope, not incomplete work;
shared outer/phase schema fields repeat identical error reasons. Remain in
Inspector compose, exact advertised admission and result interpretation. Add red
cases to invocation/schema tests; classify partial work from canonical status or
complete=false, preserving successful requested crops. Deduplicate exact field
reasons while retaining outer schema constraints and ambiguous union rejection.
No tool aliases, geometry, model settings or review evidence changes. Gate with
schema/invocation/provider/recording tests, types, lint, naming and owner proof.
The one live run is retained unchanged; use deterministic artifact replay after
these bounded feedback-only corrections rather than a second model run.

## Final review and acceptance - 2026-10-03

All inventory rows were reviewed against their registered schemas, direct consumers
and fixed product cases. Correct canonical API adapters, batching, request-local
artifact ownership and capability discovery were retained. Confirmed defects were
fixed at invocation, preparation, inspection or recording owners, rather than by
adding subject-specific prompts or changing external research services.

Post-implementation review corrected three additional defects before closeout:
canonical status=partial and compact successful acknowledgements now classify
mixed results correctly; region inspection's partial=true describes requested image
scope and does not imply incomplete execution; phase/outer admission errors retain
unique field reasons, outer constraints and bounded diagnostics without repeating
unknown-field/disallowed-value messages. Each had a failing permanent regression
before its correction. Final review found no remaining actionable issue within
this refactor's bounded contracts.

Validation:

- 560 server tests pass; four existing opt-in protocol/live cases skip in this
  deterministic suite. The full product live case runs separately below.
- 361 App AI/browser unit tests pass.
- 28 inspection/conversation E2E cases pass, including the enabled preparation
  profiling cases. Two retained-artifact cases subsequently pass using this run's
  actual action stream and saved document: 30 executed deterministic E2E cases.
- Typecheck, scoped ESLint, naming, App build and source-bound owner proof pass.
  The new invocation test is included in the normal server/CI test script.
- One headless Astra medium live acceptance passes, recording app opening through
  completion plus ten seconds. Request `68b353bf-b7f1-4484-9405-910080cc3c82`:
  616.083 seconds, first applied drawing around 167 seconds, 3,640 non-workspace
  elements, 31 App tool calls plus three observed research calls, no thrown tool
  failure. Four rejected inputs/preparations were corrected within the same turn:
  fact fields, out-of-bounds controls, unpaired controls and fact-binding fields.
- The live run exposed six successful region captures misclassified as partial.
  Historical records remain unchanged. The result-classifier fix and deduplicated
  diagnostics were then verified with the permanent regression suite and two
  source-frozen artifact replay cases; no second model run was made.
- Visual review inspected the complete overview and native detail, not only the
  fitted canvas: two large tiers, crown, spire, editable glazing and ornament are
  present. Estimated dimensions are disclosed. This is an architectural illustration,
  not a verified survey or photorealistic reconstruction. The final app screenshot
  cuts off the lower edge; the retained complete overview shows the whole result.

Evidence under `tmp/`: `tool-refactor-final-server.log`,
`tool-refactor-browser-units.log`, `tool-refactor-e2e-final/result.json`,
`tool-refactor-replay-final/result.json` and
`tool-refactor-live-20261003/{source.json,result.json,report.json,browser/}`.
The live run verifies an unchanged source snapshot; subsequent feedback-only
corrections are identified above and separately verified. The recording, full
input/output payloads, complete overview and native crops are retained.

Earlier gate failures were preserved: the first conversation run had one Undo
snapshot mismatch (isolated cases and full rerun passed); the first saved-document
replay lost its browser execution context during ongoing source edits (the frozen
source replay passed both cases). No retry setting or product assertion was weakened.

Limit: this establishes tool admission, useful failure recovery, receipt semantics
and producer/consumer compatibility; it does not make arbitrary model inputs valid
or guarantee design fidelity. Elapsed duration is diagnostic evidence, not an acceptance threshold.
No elapsed-time improvement claim is inferred from this single uncontrolled run.
No Framework semantics, model/effort, original source resolution or user data were
changed for the refactor. No push or merge was performed.

## Follow-up - rejection roots, shared properties and action evidence

Status: DONE - bounded follow-up implemented and verified on 2026-10-03.
The historical acceptance above remains unchanged. There is no one-to-two-minute
target, and no new live-model acceptance claim.

Bounded objective: repair the four observed admission/recovery failures at their
actual owners, expose existing shared Fill property components and grouped new-value
updates, and retain attributable action evidence. Scope is the existing preparation,
review, invocation, operation/catalog, Fill common APIs, provider/record projection,
their formal tests, product contracts and this Inspector. No model change, search
change, detail reduction, new dependency, hidden argument coercion, automatic retry,
new Framework property type, unrelated cleanup or push. Discovery is limited to the
four saved calls, their registered producer/consumer paths, canonical property
references, and provider events/record projection. Completion requires focused
regressions, App/server types and tests, fill integration/Undo evidence, naming/lint,
and current-source Inspector proof. Missing provider internals remain explicitly
unobserved, never fabricated. A new live drawing is not a deterministic guarantee
that arbitrary future model calls cannot be malformed.

Root evidence: calls 7/35 used wrong fact/dependency/binding fields; the exact schema
was registered, but phase-specific executable examples and retained contract identity
were absent. Calls 23/25 exposed over-restrictive nonnegative controls and a later
unpaired-control rejection without node/edge location. Fill call 51 repeated only
eight patches 2,600 times. Existing Preset Fills already links child Fill property
components by ID; use this relationship rather than duplicate shared state.

Reviewed design and handoffs:

1. Prepare: admit finite signed Bezier controls while testing actual curve bounds;
   anchors/dimensions retain their bounds. Report node key and ring/edge for malformed
   pairs and collect pair failures together. Never invent a missing control.
2. Inspect/compose: publish schema-validated examples for fact creation/binding and
   phase-specific contracts from the same definitions; retain the actual advertised
   schema digest with calls so discovery drift can be tested, not guessed.
3. Apply: add public Fill row bulk patch with one shared patch argument. Resolve
   current row IDs once within the canonical App boundary; preserve independent
   properties. A separate explicit share operation links target rows to a source
   Fill child ID; a detach operation clones that record for independent edits.
   Preserve row order, unrelated fills, atomic rejection, updates and Undo/Redo.
   Existing prepared-target resolver supplies elementIds without an ID round trip.
4. Observe: retain action identity/parent/actor, input/output snapshots, declared
   purpose/expected result (contract-derived when no model purpose is supplied),
   execution outcome and separate correctness evidence. Record every public provider
   lifecycle item and unknown method metadata without private reasoning or raw event
   dumps; unknown detail stays unavailable. Do not infer hidden model reasoning.
   Child App operations remain distinguishable from their outer native call, even
   when the model-facing receipt is compact. Record actual owner boundaries, not
   invented per-operation timestamps from a batch total.

Self-review: shared update arguments do not imply persistent sharing. Persistent
sharing must be explicit because later edits affect every reference. Canonical
setters own before/after; no duplicate history mechanism. Record execution utility
separately from visual correctness; a completed call does not certify the drawing.
Examples must pass the real schema and owner; do not accept guessed aliases. No new
cache: use existing request artifacts and canonical Fill relationships. Missing
provider duration endpoints remain incomplete instead of relabeled as thinking.

### Step card - follow-up preparation

Owner prepare; spec Tool invocation contract / Preparation and execution;
Inspector prepare. Input semantic draft; output unchanged geometry or actionable
rejection. Existing geometry measurement owns actual curve bounds; declaration
limits and pre-write all-or-nothing admission remain. Boundary design-preparation,
local-design-tools and their existing tests. No canonical writes, geometry repair,
or model calls. Red cases: valid signed controls rejected today, malformed pairs
identify all affected edges. Gates preparation/tools/workflow tests and types.

Preparation checkpoint: both new regressions fail on the original code and pass
with 63 preparation/tools/workflow cases after correction. No coordinates are
clamped or invented; actual out-of-bounds curves still reject.

### Step card - follow-up review contract

Owner inspect; Evidence and completion. Input explicit fact assertion and saved
criterion/target IDs; output retained provenance and bindings. Publish complete
copyable examples with exact required fields from the existing phase schema. Test
examples at native discovery schema and real review owner; wrong aliases still
reject before mutating retained state. Boundary local-design-facts/review and
review tests. No invented scope, evidence, sources or automatic revalidation.
DoD: facts retrieval, invalidation, binding and all existing review cases pass.

Review checkpoint: the missing executable-example regression failed first; 96
review/operation cases pass. Exact IDs, scope and dependency versions still belong
to their existing owners; this improves discovery and does not claim deterministic
model adherence.

### Step card - follow-up Fill application

Owner apply; spec Correctable contracts and shared property edits. Inputs current
canonical element IDs/row, new patch or explicit source Fill relation. Outputs one
ordinary canonical batch and propagating shared child values only when requested.
Use Core updateElementProperties/patchElementProperties, Preset Fills ID child
relations; no new property type, persisted alias, renderer state or history owner.
Boundary fills.ts, Fill tests, basic-design-api-contracts and fill-patch E2E.
Tests prove one resolution/read per unique element, one plural write, no writes
on invalid targets, row preservation, actual shared propagation, detach, and
Undo/Redo. If public Core cannot represent this relation, stop this slice and
revisit the Framework boundary; do not simulate sharing in an App map.

### Step card - follow-up observations

Owner observe; Execution recording and Correctable contracts. Inputs actual native
lifecycle messages, advertised definitions, dispatched App batches and receipts.
Outputs local actor/parent/contract/purpose/expectation/correctness evidence and
complete input/output references, with explicit unobserved fields. No hidden model
reasoning, automatic model assessment, runtime control, or attribution inferred
from elapsed gaps. Child operation timings are batch-exchange windows unless their
owner supplies actual execution timing; never divide a batch duration by count.
Boundary provider/usage/records/timing/evaluation plus a focused batch observation
adapter and permanent tests. Observers cannot reject execution or change results.
No new cache; contract snapshots retained once per request, child observations per
actual dispatch, AsyncLocalStorage carries call identity across safe concurrency.
Red cases: child operation missing in compact result diagnostics; no schema/purpose
attribution; unknown lifecycle metadata discarded; model judgment conflated with
successful execution. DoD: privacy, ordering, cancellation and interrupted calls,
all owner recording/provider tests, types/lint/naming and current-source proof.

Observation handoff refinement: measure each real browser action handler at the
App action-definition composition owner (runtime-input), with handlerMs carried
as diagnostic result metadata. The server records it before removing only that
metadata from model-facing receipts. This preserves compact acknowledgements and
separates handler elapsed time (including its async waits) from exchange latency.
Thrown canonical errors remain unchanged; absent measurements are unavailable.
This extends the observe allowlist to runtime-input and its existing tests.

### Follow-up verification and bounded review

- Preparation: signed controls use existing actual-curve measurement. Malformed
  pairs identify semantic node, ring and edge without changing geometry. Fact
  examples execute through the real advertised schema and review owner; no alias
  coercion, invented provenance or automatic retry was added.
- Fill: a shared input patch is distinct from a shared canonical Fill child.
  Share/detach, multi-selection edits, gradients, omitted fields and Undo/Redo
  passed in the real App. Shared references and subsequent propagation survive
  Core save/load. No Framework property type or shadow relationship was added.
- Observations: exact native/App action contracts are retained once per request;
  actual inner actions retain parent identity, arguments, receipts, purpose source
  and expected contract. Browser handler elapsed time is separate from exchange
  time and excluded from outer tool totals. Diagnostic metadata is removed before
  model receipts. Missing receipts/measurements/private provider details remain
  unknown; model review judgments do not certify pixels or factual accuracy.
- Bounded review caught and corrected child action double-counting, the distinction
  between `accepted: false` and failed criterion judgments, and advertised versus
  internal contract digests. Regression tests first reproduced the accounting and
  judgment defects; final digest test compares the actual native envelope.

Validation: server response harness 574 passed (4 opt-in live-provider cases not
run); App AI/common-API suite 366 passed; 16 ordinary browser cases passed across
Fill, conversation and inspection, with 2 retained-evidence replay cases not
selected. One browser attempt encountered `ERR_CONNECTION_REFUSED` before the API
assertion; its retained failure is in `tmp/tool-roots-e2e-final.log`. The affected
batch recolor and strengthened shared-property save/load case both passed in
`tmp/tool-roots-fill-recheck.log`. No timing threshold was relaxed. Types, production
build, naming and scoped ESLint passed (3 existing console warnings).

Current-source candidate `0799f329-17cb-487d-a519-174373ba83cf` passed, accepted
contract review `e75ddc990c9165cec1e59225ca0749a8eee09ec55d6d4d7a81cce6c67ca6ce43`
has no blockers. Local `prove` passed 1 flow, 3 negative scenarios and 7 obligations
at source digest `7c7a424b99acd74aa38cced2ed6168cfbdcb17f15d9518220e5e6ced40de5fc9`;
final positive attempt `a941039e-9d8e-4c74-8e48-ccd855814a7b`. An extra `ci` command
could not compare the manifest with the historical base that lacks that file
(attempt `4e8df741-b4e7-451f-92d1-3334f20bee0e`); local proof is the applicable
working-source gate, and remote CI has not been run or claimed.

No new model drawing was run. These regressions establish the corrected contracts,
not a zero future model-error rate or reconstructed reasons for old unobserved
intervals. Existing run artifacts and local environment were preserved. No push.

## Live-test identity and failure-handoff repair - 2026-10-04

Scope: repair the confirmed creation identity mismatch, terminal browser failure
handoff and deferred-detail discovery in this same worktree. Keep actual element
IDs distinct from optional draft selectors; existing-object edits use registered
APIs and IDs without a new container. No reserved root name. Preserve successful
history members, original failure semantics, Stop, original image resolution,
model/effort and unrelated dirty work. No push. One recorded headless upper-tier
live test after deterministic gates, without a model retry.

Design review: preparation creates identities; admission validates relationships
and IDs, not names. A draft selector may refer to any node, including a container,
but never supplies a canonical ID. An unnamed root uses its generated identity
as its selector. The transport must acknowledge a failed batch before the browser
rethrows the original error; the server rejects that exchange immediately and
records the browser-owned failure. Unknown mutation settlement stays unknown and
is never automatically retried. Handler failure timing is attributed only when
actually measured. Safe public owner errors may cross the boundary; arbitrary
exception content is not promoted to public explanations.

Cases/gates: named/unnamed Frame and Group, root checks, projected descendants,
duplicate selectors, prepared handoff to actual browser admission, direct edit
without a root, failed receipt/token retirement, Stop and failed acknowledgement,
handler timing on rejection, deferred-detail executable examples; focused then
complete server and App AI suites, types/lint/naming/build, source-bound Inspector
proof and one full recorded live acceptance. Review only these owners and direct
consumers. Do not change Framework runtime or introduce a second history owner.

### Step card - identity preparation

Owner prepare; Preparation and execution / design-preparation Semantic input;
Inspector prepare -> apply. Input draft with optional root selector; output native
IDs, unique selector mapping and unchanged geometry. No canonical writes or model
calls. Direct edits bypass preparation. Boundary design-construction,
design-construction-schema, design-preparation, local-design-tools and existing
preparation/pattern/tool tests. Add failing checks for arbitrary root selectors,
unnamed generated identities and keyed projection; preserve caller data and
uniqueness. Then admit those artifacts at the browser apply owner. Stop for an
unsupported canonical identity requirement; no renamed-name workaround.

Preparation review: two new regressions reproduced the construction/index defect;
preparation and pattern tests pass. Existing local-design-tools integration now
correctly exposes the still-unfixed browser admission, which is the next owner.

### Step card - identity admission

Owner apply, prepared-artifact -> execution-receipt. Input server-prepared IDs,
parent links and selector mapping; output native creates through existing APIs.
Direct existing-object edits bypass this artifact entirely. Validate IDs, parents,
uniqueness, geometry and mapping; never a reserved name. Boundary prepared-design-
admission and existing design-actions tests. Existing integration is red; add
named Frame/Group cases and tampered-ID/map rejection. Preserve direct-edit tests,
cooperative batching and history. No renderer or Framework changes.

### Step card - browser failure exchange

Owner apply route apply-to-settle, spec Preparation and execution / Tool invocation
contract. Input actual rejected browser batch; output a one-use failure envelope
before rethrowing the identical local error. Existing exchange owns validation and
settlement; the diagnostic owner receives its typed rejection. Failure envelope
contains batch/action identity, measured handler/execution time and an explicitly
safe owner message. Unknown errors expose only a generic message;
unknown settlement is never interpreted as no mutation or replay permission.
Stop bypasses reporting on the aborted signal. Failure reporting errors must not
replace the original local error. Boundary protocol, browser provider, batch
exchange and their permanent tests; observation adapter and runtime-input are the
next observe segment. Cases: exact token/batch validation, failure wakes pending
exchange, no retry/next batch, ack failure, cancellation and successful receipts.
No change to Framework callbacks, canonical writes or history.

Exchange checkpoint: new browser and exchange regressions failed first; 20 tests
now pass. Success receipts are unchanged. The failure envelope is distinct from a
canonical receipt and retires its token without waiting for request cancellation.

### Step card - rejected handler observation

Owner observe, spec Browser failure handoff / Execution recording; Inspector
observe. Inputs real thrown errors, measured handler spans and typed exchange
failure; outputs safe failure reason and exact available timings. Preserve the
original exception object. Only unique matching action names get per-action handler
attribution; absent/ambiguous action settlement remains unknown. No inferred success,
rollback or replay. Boundary runtime-input, action-failure, local-action-observation,
usage and their tests. Prepared admission marks only its static owner explanation
public; it never exposes raw canonical exceptions. Gates rejection timing, original
error preservation, safe-message privacy and recorded failed output semantics.

### Step card - deferred-detail discovery

Owner inspect, Tool invocation contract. Input declared deferred part with its
reason; output retained deferral and actionable admission. Add a complete executable
example beside the existing field definition and explicitly state its required
fields in native discovery. Do not invent a reason, weaken required fields or add
an alias. Boundary local-design-review and design-review-stages tests. Prove the
example passes both advertised schema and real owner; missing reason rejects.

Repair pre-live checkpoint: original failed payload replay now admits all 104
entries unchanged and its original 21,000 px root check passes. Formal preparation,
application, direct edit and rejection tests pass. Complete server suite passed
580 tests (4 opt-in skips); the additional real HTTP failure-handoff case then
passed with 58 focused server cases. App AI suite passed 373 tests. Types, scoped
lint (2 existing console warnings), naming and build passed. Source-bound proof
passed 1 flow, 3 negative scenarios and 7 obligations, final attempt
933cb189-fa5b-467a-9af6-95c5db93eb88.

Browser conversation/inspection suite passed 26 cases before one fixture failed
its setup assertion (expected two manually drawn rectangles, before exercising
inspection). Its exact case and the blocked regrouping case passed on the same
runtime without a product change in a focused recheck (2 cases, source verified).
The initial wrapper also omitted verifyInputs; its result remains failed and is
not reclassified. Retained-artifact cases require explicit input and remain
separate. Live run uses the complete source-verifying runner with no retries.

### Identity repair live result - 2026-10-04

One source-verified headless Astra medium run completed, request
d7320406-dc64-4ad2-a9db-2e683bcc7578, 449.000 seconds. First prepared application
succeeded at 149.355 seconds; final 6857 non-workspace elements. E2E passed
with zero retries and ten seconds of the finished view. Two recoverable geometry
input rejections (unpaired controls, then bounds) were corrected within the same
turn; no terminal action failure or reserved-root rejection. Actual failed-batch
HTTP transport and handler timing are covered by deterministic regression tests,
not claimed exercised by this successful live run.

Visual review does not pass: visible detail is present, but massing looks unfolded
and crown/body joining is unnatural. The model's completed judgment and automated
E2E success do not certify visual quality. This one-run result is retained unchanged
in tmp/identity-failure-live-20261004; it is not replaced with another run or manual
geometry edits. Original prior failed inputs replay successfully at both repaired
owners. No push; local environment and previous dirty work preserved.

## Reference-aware independent visual review - 2026-10-04

Scope: repair the inspect owner's self-confirming acceptance. A fresh, tool-free
model assessment receives the original request, retained criterion requirements,
selected original reference images and current rendered images. It does not
receive the drawing agent's method, self-rating or previous pass claims. The
model remains Astra medium. App code supplies evidence and validates the result;
it does not choose camera angles, rewrite geometry or impose detail/style.

Step card - inspect: inputs current stamped image evidence, original request and
plan requirements, selected reference attachment indexes; output independent
criterion findings combined conservatively with the drawing agent's findings.
Structure and final review invoke it; intermediate visual checks bypass it.
Missing/invalid review or evidence changed during assessment cannot approve.
Existing mutation, Undo, cancellation and full-resolution image contracts remain.
Owner boundary: local-design-review, local-operation-tools, local-image-tools,
local-ai-provider and new local-visual-assessment helper, their formal tests,
existing provider replay fixtures and the execution-flow spec/Inspector.
No Framework changes, additional provider, dependency, fixed viewpoint, push or
automatic drawing retry. One complete headless recorded upper-tier test follows
focused/full server tests, types, lint/naming/build and current-source proof.

Design review: reuse request-owned image attachments and inspection receipts;
only materialized image values cross into a fresh assessment request. No full
canvas dump, mutation tools or prior self-review enters that request. Each
structure/final submission runs one assessment; no per-batch review and no
new cross-request cache. Revalidate canonical evidence after the async result.
Formal cases: self-pass/independent-fail, missing/malformed findings, deliberate
rough style, stale result, Stop, selected reference validation, no mutation tools,
input/output record correlation. Retain the known unfolded structure screenshot
as a permanent negative visual fixture; use a matching intentional unfolded
illustration request as a positive style control. Run both once before the one
full drawing; failures remain evidence and block quality claims.

Inspect checkpoint: regression-first checks block self-pass/independent-fail and
stale async results. A real isolated Astra call rejected the retained unfolded
structure. The initial positive fixture wrongly requested a hollow ring where
the image has a disk; that failure is retained. Correcting the case to a solid
disk (without changing the evaluator) passed its targeted recheck. This is a
small intent-sensitive case pair, not a general accuracy claim.

Step card - observe: retain independent comparison criteria, ordered image roles
and byte digests, result, actual provider duration/usage and parent request ID.
Existing record sink/privacy rules own storage. No raw provider instructions or
thoughts; no inference of missing time. Boundary local-ai-provider, local-ai-usage
and their record/provider tests; Inspector observe, Execution recording spec.
One new context event has no timing interval; child requests retain their own
measured times. Prove diagnostic input linkage and malformed response failure.

Pre-live verification: 590 deterministic server tests passed, 5 live opt-in cases
skipped; types, build, naming and scoped lint passed (two existing console
warnings). Positive-control description correction is retained alongside the
original failure. Reference changes use the existing facts phase and invalidate
approval without replacing requirements. Image input metadata and parent/child
record correlation are covered by formal tests. No camera angle or geometry
transformation policy was added.

### Bounded iteration - visual versus data evidence

The first live attempt was stopped with original artifacts preserved after two
independent structure reviews correctly declined to certify metric scale from
pixels. The visual criteria passed; repeatedly retrying a vision check cannot
produce data proof. This invalidates the all-criteria comparison design. The
first incorrect owner is inspect's dispatch, not model angle selection. A second
confirmed gap was plan resubmission dropping an explicit reference selection.

Revised inspect contract: each planned criterion declares verification=visual or
data. Independent review receives visual requirements only. Data criteria remain
mandatory in the ordinary review and retain existing numeric/canonical evidence
responsibilities; an image never certifies them. Data-only review makes zero
visual provider calls. No name-based guessing, special scale exceptions,
fabricated measurements or fallback pass. Omitted selection on plan resubmission
preserves the existing explicit indexes; [] explicitly clears them; facts can
replace them. New requests never inherit them.

Step card: inspect owner, Evidence and completion, same allowed implementation
files plus their existing direct test helpers and execution-flow proof. First
prove scale/data is excluded from image assessment while still required for
completion, and reference omission preserves selection. Then run the bounded
server/types/lint/naming/proof gates and one replacement complete recording. The
cancelled run remains cancelled; this is no speed/quality claim from partial work.
Self-review: requirements and data checks are retained; visual evidence cannot
substitute for canonical data; unchanged model, original prompt and geometry.

Dispatch correction verification: criteria are explicitly visual/data; data-only boundaries make zero image-assessment calls and unverified data still blocks completion. Plan resubmission retains references unless explicitly replaced or cleared. Server suite, types, naming, scoped lint and Inspector core proof passed before the replacement recorded run.

Reference admission correction: the replacement run exposed the first request's actual rejection: referenceImageIndexes existed in phase schemas but not the top-level property registry. Plan retention alone cannot repair a field rejected before the owner. Stop preserved that run. Within inspect's existing schema boundary, derive top-level fields from the same phase schemas used by native discovery, then prove both plan/facts admission through the real tool entry. This removes duplicated field registries rather than repairing model arguments. Existing phase rejection, callback image selection, numeric/visual dispatch and full server gates remain required before another full recording.

### Recorded result - independent comparison remains incomplete

The replacement complete headless run `tmp/visual-comparison-live-20261004-verified` used the unchanged upper-two-tier brief, Astra medium, retries=0 and source verification. It failed acceptance after 24m27s, reporting unsupported/incomplete rather than success. Earlier cancelled runs remain in `tmp/visual-comparison-live-20261004` and `tmp/visual-comparison-live-20261004-corrected`.

Confirmed: reference selection passed native admission; five structure assessments and three final assessments received selected references and visual criteria only. Four structure failures preceded one pass. Final assessments did not certify the requested realistic finish. Eight independent calls took about 123 seconds combined; this does not explain the full runtime. First canonical drawing applied at 222.9s. Main request observed tool/research intervals totaled 171.4s; the remaining 1295.5s is unattributed, not a measurement of reasoning alone.

Remaining issues: the result still has an unfolded-façade appearance and repeated glass patterns. Independent comparison catches several discrepancies but has not reliably corrected the overall quality or reduced iteration. Two final reviews lost canonical freshness during the asynchronous assessment. Saved browser errors separately report document persistence unavailable until accepted changes are durable, and the final App screenshot displays document session offline. Canonical revision changed from 17424 to 19691 across the affected checks. These observations establish a persistence/synchronization failure alongside the visual failure; the persistence root cause is not established here. Do not remove freshness validation, weaken visual acceptance, attribute all remaining time to model reasoning, or claim quality completion.

Implementation verification: all 595 deterministic server cases passed across the complete suite and the corrected 55-case operation rerun; five opt-in cases skipped. Types, naming, scoped lint and Inspector proof passed. Final full-suite confirmation is recorded separately. No push. Test-owned services were stopped. Next bounded work should reproduce the persistence failure from saved action batches before another expensive live generation and evaluate the false-pass structural view using the preserved images.

### Apply prerequisite - canonical Stroke child adapter

The new real-App regression fails before Undo: patching width resets an existing
color to black. `strokes.children.toChildData` expands creation defaults on every
partial write. This formal evidence requires correcting the direct canonical
Preset child adapter, not restoring old-state input in the App. Bound the scope
extension to that adapter, its existing children-map tests and Preset property
contract; no other Framework redesign. Preserve creation defaults at the Stroke
component owner and nested Fill identity projection. First prove a width-only
child patch contains no omitted fields, then repeat the same App Undo test.

### Step card - apply: plural creation parity

Stroke App/Preset tests and the real-App multi-owner Undo regression now pass;
Render subscriber inspection and three existing projection tests found no default
insertion on that downstream route. Next, existing `element.createElements`
consumes ordered create options and must retain scalar creation's valid mixed-parent
capability. Preserve painter order by batching only consecutive vectors with the
same resolved parent; preserve existing canonical validation and return each item
result in input order within one synchronous transaction. No cross-call cache.
Allowed files: element APIs and existing create-element tests; spec/Inspector.
Gate: old mixed-parent rejection fails formally, then same-parent fast route,
mixed parents/types, result order, one transaction and existing vector creation
cases pass. Failure owner remains apply; stop if parity cannot be established.

### Step card - apply: remove snapshot-based Gradient API routes

Creation parity passes 27 focused cases, including consecutive mixed-parent
vectors and the existing dense-move proof. Next remove unused public Gradient
snapshot/delta methods. The interactive drag's detached calculation remains a
pure helper, not a stateful API or AI operation; it continues to submit its newly
computed gradient to the canonical new-value setter. Existing pointer-offset,
radial-center, publication and History behavior must remain unchanged. Inputs to
public mutation APIs remain targets and new values only. Scope: Fill APIs,
Gradient feature/direct test, existing API contracts and docs. Gate: formal
catalog rejection of caller snapshots, Fill/Gradient focused tests, types and
existing Gradient E2E at the integrated checkpoint. No unrelated input feature
redesign. Failure owner apply; no retained cross-call cache.

### Apply checkpoint - sparse updates and interactive compatibility

Render's data-channel subscriber routes individual, batch and record-patch
computed changes to the scene-tree mirror without injecting omitted defaults.
Three existing Render projection tests pass. The confirmed defect was upstream:
Stroke child conversion expanded creation defaults into a sparse update. The
Preset owner fix keeps defaults at creation and preserves other fields on edits.
The real-App width/color multi-owner regression failed before this correction
and now passes, including one-commit Undo/Redo and rejected-batch isolation.

Removed the three public Gradient snapshot/delta routes; internal drag geometry
retains its detached calculation and submits new values through the existing
setter. The public signature/snapshot gate and Fill/drag tests pass. Integrated
Fill/Stroke/Gradient browser validation passes all 22 cases, including shared Fill,
multi-selection, persistence reload, normalized drag and rendered stop colors.
Types and the Inspector architecture contract pass. This is an apply checkpoint;
model-facing operation consolidation and semantic discovery remain ACTIVE.

### Step card - compose: consolidate advertised operations

Continue the frozen API inventory. Keep UI methods at their public owners but
classify redundant model routes with explicit replacements in dispositions.
Generate runtime actions, lookup and batch admission from surviving contracts.
Unique scalar primitives remain ordered items inside the batch entry; collection
preparation/apply retains its combined route. Single-object composite edits are
batch-only. Exact owner.method lookup returns the current admitted schema in one
call. Empty lookup returns categories; category lookup supplies operation purpose
and result semantics. Keep metadata at declarations, not a synonym classifier.
Test duplicate-route rejection, one/many dispatch, schema freshness and unknown
lookup with no browser calls. Scope: existing basic contracts/dispositions,
catalog/adapters, operation tools/batch, action constants, direct tests and docs.
Metadata is request protocol only. Next verify truthful receipts at apply, then
all integrated gates; no intermediate handoff. No new dependencies or push.

### Step card - apply: truthful operation receipts

Compose gates pass 81 cases. Rechecked apply: ordered batch writes, canonical
permission/history and failure acknowledgement stay at existing owners. Declare
return meaning beside each operation contract; adapter receipts preserve raw
owner values and ordered per-item identities. A creation array containing null
is partial/failed, never complete; empty batches are no-change. Boolean false
means no application reported (unchanged or unavailable), not proof of a valid
unchanged target. Void acknowledgements do not claim measured mutations. Reads
are successful observations, not document changes. No document reread or new
revision/observer machinery to fabricate result certainty. Scope: basic contracts,
adapter and direct tests; discovery exposes those same return declarations.
Prove mixed creation, empty input, no-change and nonthrowing structured movement
results; preserve throw/cancellation behavior and original item order.

### Step card - settle: preserve failed API outcomes

Apply receipts now expose ordered partial/failed creation outcomes. The direct
conversation consumer must retain failed status instead of calling a completed
transport a successful request. A failed receipt alone (or with reads/no-change)
is failed; confirmed successful writes plus failure are partial. Preserve
existing cancellation, clarification and committed-failure behavior. Scope:
conversation outcome projection and its formal tests, Inspector boundary and
result documentation. Test failed-only and mixed-result executions first, then
run the integrated operation/provider/conversation gates. No additional state
read or mutation at settlement.

### Integrated admission check - compose

The new Stroke batch's broad patch schema admitted misspelled fields and wrong
primitive types. The formal schema regression fails before correction. Reuse
canonical Stroke enums and the writable-key type at the registered declaration;
validate only supplied fields, keeping empty patches valid. Nested Fill remains
the owner record input, not an invented deep-patch contract. This is the existing
compose admission boundary and no new mutation owner or capability.

Apply integrated review also verifies non-document operations: selection and
viewport execution retain no-change document status with explicit transient
application metadata. The regression fails against the first receipt refactor;
correct the declared result kind, not conversation-specific action-name handling.

## API consolidation - completed local acceptance - 2026-10-04

Delivered the full bounded inventory consolidation: 152 model-facing basic
operations with declared purpose/category/result semantics; 19 redundant aliases
have executable replacements while public UI wrappers remain. Three unused
snapshot-based Gradient public routes moved out of the public surface. Scalar
composite edits are batch items; collection native tools remain available. Exact
operation discovery resolves current admitted schemas without an extra model
resolver or mandatory document read.

New-value Stroke batches, canonical sparse child conversion, mixed-parent creation
parity, owner-return receipts and conversation settlement were reviewed together.
Render subscriber inspection found no omitted-field defaults downstream; the
confirmed default expansion was fixed at Preset. Successful creations keep their
real IDs/order, partial failures stay partial, and transient selection/viewport
execution is not reported as document modification. Compact void acknowledgements
retain their unmeasured-application meaning. Nested shared Fill ownership,
permissions and canonical Undo/publication boundaries remain at existing owners.

Validation:

- App AI/common API/Gradient: 46 Vitest files, 382 passed. The subsequent
  non-document receipt regression and conversation checks pass 29 cases, including
  the added case (383 distinct covered App cases). Node-only production bundle
  test runs under its correct Node runner and passes separately. Initial incorrect
  blanket Node/jsdom invocations are retained in logs, not counted as product bugs.
- Server: 630 passed, 5 existing guarded cases skipped. No live subscription run.
- Browser: 8 integrated API/conversation cases pass, including workspace/container
  vector reflection, stable identities, batch Fill, independent user Undo and one
  AI history entry. Previous completed apply checkpoint's 22 Fill/Stroke/Gradient
  cases remain valid: 30 browser cases across the relevant completed stages.
- App typecheck, scoped ESLint, naming (12), docs formatting, production build and
  Inspector contract (2) pass. Existing production chunk-size warning remains.
- Current-source Inspector candidate and reviewed contract revision 41 pass;
  proof `4134b88e-3158-4c0a-8ede-2343cc363a16` verifies 7 obligations and all 3
  negative scenarios. Source digest:
  `2f8243a7231826c3816a77f9929b1cf08cc5e1ffedd1e32cfbcb0a25d0f48916`.

Evidence is retained under `tmp/api-consolidation-*` and the source-bound Inspector
run directory. Browser-owned servers exited; ports 3000/4101/4201 have no listener.
Bounded review covered the diff and direct consumers; no unrelated repository
redesign, dependency, model/effort change, push or new drawing run. This closes API
consolidation, not a claim of measured generation speed or visual quality.

### Single live acceptance after API consolidation - 2026-10-04

Ran exactly one headless recording with the unchanged elevated upper-two-tier
brief, gpt-6-astra / medium, retries=0, APP_URL=http://localhost:3000.
Artifacts: `tmp/api-consolidation-live-20261004`. Source hashes stayed unchanged.
Two recorder-only fits occurred at overall coverage and terminal settlement.

Provider completed in 664.54s, but the App reported partial work and the success
assertion failed. Independent assessment passed scope, elevated perspective and
identity; realistic finish failed for simplified roof/eave equipment, repetitive
glass reflections and weak contact shadows. The completed-App screenshot was
inspected; perspective and architectural detail are present, without certifying
realistic completion. The document retains 5,423 Vectors and 16 Groups. No browser
errors. Durable-completion assertion and the explicit ten-second success hold
followed the failed assertion and were not executed; neither gate is claimed.

Recovered failures: unknown operation prepare_design, unknown category creation,
and 1,257 source nodes exceeding the existing 1,000-source-node construction guard.
No guard was changed. Recorded 77 tool/research calls and 478 App action receipts.
Exclusive attribution: provider 641.73s (includes waits and child assessment, not
measured thinking alone), tool 1.15s, App 21.65s, recording gap 0. First canonical
application completed at 103.63s. These are observations, not controlled speed
comparison. See report.json and result.json for full evidence and limitations.

No second run or unrequested implementation. Test services exited, local live
opt-in restored to false, .env retained, nothing pushed. Deterministic API gates
remain green; this live visual acceptance failed and is not relabeled success.

### Step card - apply: plural state and Fill-row edits

Compose recovery passed 65 formal tests. Apply consumes ordered element IDs (or
resolved immutable prepared references), new visibility or aligned Fill patches.
Canonical current Fill row IDs are resolved once per unique owner for this call;
no mutable property cache survives it. Validate alignment and rows before writes;
use one ordinary synchronous transaction. Visibility returns ordered explicit
changed/unchanged/unavailable statuses. Public scalar UI method remains a wrapper;
AI discovers the plural operation. Empty input does no work. Forbidden: old values
from the model, per-item action envelopes, alternate history or render writes.
Boundary: common-apis/fills and element/apis, their existing tests; basic API
contract/result/disposition and tests; operation batch tests; current documents.
Failure owner apply. Gates: mixed targets, missing row, duplicate IDs/alignment,
one canonical Fill batch and transaction, one AI operation/receipt for many
visibility targets, real App Undo and Fill regression. Stop on changed semantics.

### Step card - prepare: source-work partitioning

Apply focused gates passed: 36 App cases and 80 server/contract cases. Prepare
inputs remain one immutable semantic draft; output remains one artifact/identity
map plus source-work batch counts. Partition only cumulative source-node/path
work at primitive boundaries during the existing depth-first compiler walk.
Keep all node relations and final layout in their existing whole-artifact owner;
this is not chunked canvas application or a memory/latency claim. Expanded
10,000-node/200,000-path and depth guards remain admission constraints, and each
indivisible template must fit a source window. Failure owner prepare. Contributors
are existing construction/admission/session; no model, canonical writes, dropped
detail or flattened groups. Boundary: design-budget, design-construction,
design-preparation, local-design-tools and their existing tests. Formal cases:
1,173 nodes, nested grouping, native admission, layout/relations crossing windows,
path windows, invalid primitive, expanded limits, deterministic IDs and order.
Stop if partitioning changes geometry or owner semantics.

### Step card - inspect: requirement-bounded visual judgment

Prepare focused gates passed 89 cases, including actual source/template read
counts. Inspect consumes original user request, selected images and prior
findings, not drawing-agent success claims. Return required findings separately
from optional suggestions; only required findings and existing canonical
freshness/data gates affect approval. User acceptance in an actual request may
scope quality, but this change does not fabricate acceptance or rewrite old runs.
Boundary: local-visual-assessment, its formal unit/live tests and image fixtures;
local-design-review and ai-domain-prompt guidance; current spec/Inspector. No UI
acceptance button, subject classifier, geometry changes or waived stale checks.
Failure owner inspect. Verify advisory retention, malformed output rejection,
real failure preservation, and accepted/rejected image calibration. A prompt
change alone is not deterministic proof of model judgment; report live evidence
and its limits. Stop if a real contradiction is masked.

### Bounded review - apply and prepare

Integrated tests detected preparation diagnostics leaking into the canonical
artifact; retained source-work summaries now leave the compiler through a
server-owned observation callback and are omitted from the artifact. Canonical
admission remains strict. Apply review additionally checks that all-no-op
visibility sets open no transaction; a new regression failed first, then the
owner preflight was corrected. Retained target-status maps live only inside this
synchronous call. Cross-window relation/ID tests below prove the unchanged global
prepare contract; no additional product scope is introduced.

### Post-run improvement validation - 2026-10-04

Implemented the five approved outcomes: requirement-bounded review with separate
optional suggestions; automatic source-work windows with whole-artifact layout;
prepared references plus aligned Fill-row new values resolved by the App; current
registry category recovery; one plural visibility operation and truthful ordered
statuses. No shared mutable Fill cache or alternate canonical mutation path.

Formal evidence:

- Server suite: 632 passed, 5 guarded cases skipped; the subsequently added
  cross-window relation/identity case passed with its 34-case owner suite.
- App suite: 386 passed. Final changed-owner regressions: 36 passed.
- Browser: 7 unique cases passed (Fill/visibility/Undo/streamed history);
  final affected three Fill/visibility cases rerun and passed after owner review.
- Fresh model visual calibration: five cases matched expected results, including
  the user-accepted upper tiers, the accepted detailed illustration, two invalid
  solid-building structures, and intentional abstract folded panels.
- Types, scoped ESLint, naming (12 cases), production build and bundle test passed.
- Inspector revision 42, final proof 47e8c36f-ad84-47a9-855a-6bb23434c354:
  one flow, three expected negative scenarios and seven obligations passed;
  source digest aeffc93cb2da333b752689b5fca60f4567c784e9f148480fb9a3d8f712b9dd53.

Logs/artifacts: tmp/approved-improvements-*.log, tmp/approved-improvements-browser,
tmp/approved-improvements-browser-final, and
tmp/visual-review-evaluation-1791109749779. Source-work observations are server
receipts only, excluded from strict canonical prepared artifacts. No-op visibility
sets open no transaction. All owned test servers stopped; ports 3000/4101/4201
have no listeners. Existing .env preserved. No commit or push.

This task did not run another full drawing and makes no new end-to-end latency
claim. The recorded prior visual failure and the user's later acceptance are
separate facts; neither is rewritten. Source partitioning preserves the expanded
artifact and indivisible primitive guards and does not promise bounded total
memory or asynchronous canvas streaming within compilation.

### Review correction - Fill identity and mutation targets

Status: DONE (bounded Fill correction). The user clarified that ref describes
model sharing, not a source element/index API descriptor. The proposed ref parameter was withdrawn.
A=[red,blue] and B=[red] legitimately reference one canonical red Fill component.
Scope is the existing App Fill row mutation/sharing boundary and direct tests/docs:
reject duplicate mutation destination IDs before reads/writes, keep canonical
shared children, independent rows, persistence and Undo/Redo. No merge of repeated
patches, element-instance implementation or stored-data change. No push.

Step card: apply, spec Preparation and execution / Shared identity and repeated
mutation targets. Inputs: unique destination IDs, current row, new fields or the
existing explicit share operation. Output: canonical public Core updates in one
ordinary transaction. Failure owner: apply; no renderer, shadow state or ID cloning.
Allowlist: common-apis/fills, basic-design-api-contracts, existing Fill/action tests
and Fill E2E. Gates: duplicate rejection before lookup/write, schema agreement,
shared mutation, detach, Undo/Redo, save/load, App types/lint/naming and flow proof.
The independent visibility review finding is handled in the correction below.

Validation for this correction: 25 focused unit tests, 12 Fill/Stroke browser
cases, App typecheck, scoped ESLint, 12 naming checks and Inspector core proof
passed (revision 44, 3 negative scenarios and 7 obligations). Test-owned servers
stopped; ports 3000/4101/4201 have no listeners. No commit or push.

### Review correction - Visibility receipt identities

Status: DONE (bounded visibility correction). Restore direct batch visibility edits without a prior
composition target. Scope: App basic action result adapter, backend inspection
handoff, their formal tests and current contracts. Preserve public visibility
API, ordered statuses, transactions, unavailable/partial reporting and final
visual acceptance. No Framework, shared-element, rendering or model changes;
no push. Stop if a new canonical capability is needed.

Step card - apply: spec Preparation and execution; Inspector apply. Inputs:
registered status-items result and its submitted elementIds. Output: validated
ordered statuses plus reviewElementIds for changed/unchanged targets only. This
additive request-local receipt field is not persisted and proves target identity,
not visual correctness. Misaligned/invalid responses fail without invented IDs.
Use basic-api-actions/results and their existing test allowlist; do not reread
canonical data or expand scalar calls. Gates: producer tests for mixed, no-op,
empty and malformed outcomes, plus naming/type/lint.

Step card - inspect (after apply): spec Evidence and completion; Inspector
inspect. Consume confirmed reviewElementIds into the existing request scope;
retain all available targets, exclude unavailable targets and preserve ordinary
current-evidence coverage requirements. Use local-operation-tools and its
existing test allowlist. No receipt may bypass visual verification. Gates:
producer-to-consumer regression with no prior target, mixed and unchanged
statuses, full scope validation, deferred and compact receipt behavior; existing
operation/action suites, App typecheck/build and Inspector core proof.

Validation: the producer regression failed before the fix (10 failures); the
consumer regression separately failed before its fix (4 failures). Final focused
App suites: 58 passed; backend/action-batch/flow suites: 101 passed. App typecheck,
scoped ESLint, frontend build, 12 naming checks and Inspector core proof passed
(revision 45, 3 negative scenarios, 7 obligations). Multi-target final coverage
rejects an incomplete single-target inspection, accepts complete current coverage
and preserves partial/unavailable statuses in compact and full receipts. No live
AI drawing was run; this correction changes receipts, not rendering. No commit
or push.

### Single live acceptance after visibility receipt correction - 2026-10-04

Exactly one headless run passed using the unchanged elevated upper-two-tier brief
and gpt-6-astra / medium. Provider duration 646.50s; first successful prepared
application 174.15s. Retained 9,270 Vectors and 7 Groups. Durable checkpoint parity,
no browser errors, two recording-only fits and the ten-second final hold passed.
Two unusable calls recovered within the same request: reference decoding and
unsupported template.type. App overview and native details were inspected; local
rail/roof geometry and stylized materials remain for user review, not a claim of
photographic equivalence. Evidence: tmp/visibility-receipt-live-20261004/summary.md,
report.json, browser/, records/ and taipei-101-upper-tiers.webm. Source hashes
unchanged, test servers stopped, .env settings restored/preserved. No push.

## Research-driven execution correction - 2026-10-04

Bounded objective: correct the observable failures in the visibility-receipt run,
using existing native Code Mode, preparation and request-local target owners.
Research sources: OpenAI programmatic tool calling and latency guides, Anthropic
code-execution/tool-authoring guidance, and OpenTelemetry agent-span conventions.
These support explicit call relationships, small actionable contracts and outcome
proofs; they do not establish that every tool call costs a model round.

Scope: App server diagnostics, preparation/reference contracts, their formal tests,
this plan and the existing execution spec/Inspector only if their boundaries need
clarification. Discover through the saved run, current protocol, direct producers
and consumers. No model/effort change, dependencies, new RAG, canonical mutation
owner, automatic geometry repair, live retry campaign or push.

Sequence: (1) correct report freshness and preserve observable native correlation;
(2) preserve reference decode reasons; (3) evaluate and implement preparation-time
validation/reuse at the existing owner, with small-template and local-edit proofs.
Do not claim provider-internal reasoning or speed gains that were not measured.
Closure: focused red/green regressions, affected server integration, TypeScript,
naming, scoped lint and current Inspector proof. Recheck the exact owner before
advancing; expand no unrelated audits.

### Step card - observe

Spec: Execution recording, Execution evaluation, Ownership and diagnostics.
Inspector: observe; inputs public lifecycle, tool spans, saved receipts; output
sanitized execution trace/report. Missing native correlation stays unavailable;
never infer a model turn from a tool count or concurrent interval. Contributors:
usage instrumentation and read-only projection; forbidden: private reasoning,
raw prompt/credential persistence, diagnostics changing drawings. Existing
allowlist: local-ai-provider.ts, local-ai-usage.ts, local-ai-records.ts,
local-ai-evaluation.ts and their existing tests. No retained computation cache.
Failure owner observe. Cases: valid final review followed by settlement; later
App action invalidates it; incomplete run; supplied vs missing native identities.
Gates: focused provider/record/evaluation tests and types. Stop if the installed
protocol cannot establish a relationship: report that boundary explicitly instead
of manufacturing one. Internal metadata corrections use the existing architecture
contract and do not redefine canonical completion authority.

Observe outcome: red tests reproduced stale-review reporting and dropped native
item/turn IDs; 152 focused tests pass (3 opt-in cases skipped). Installed Codex
schema exposes no model inference ID or program parent ID. Reports therefore
retain native turn/item observations and explicitly mark both unavailable instead
of inferring them from tool counts. Lifecycle settlement no longer invalidates a
review; later tool/action work and incomplete requests still do.

### Step card - prepare

Spec: Preparation and execution; Prepared target and geometry reuse. Inspector:
prepare. Inputs validated semantic parameters and request-local handles; output
immutable prepared artifacts or source-local correction feedback. Reference
failure preserves decoding reason without image bytes, stack or credentials.
Vector templates may explicitly declare their existing vector type; contradictory
types and unrelated fields remain rejected. This removes an inconsistent format
boundary, not invalid-data repair. Invalid geometry is rejected before expansion.
Keep the existing immutable geometry/key map, proving reuse and release behavior
rather than introducing another cache or mandatory trial-drawing step.
Contributors: preparation, reference decoder, pure geometry. Forbidden: model
calls inside expansion, canonical writes, detail removal, cross-request cache.
Boundary: local-reference-tools, local-design-tools, design-construction and
existing tests listed by prepare. Failure owner prepare. Gates: real corrupt and
pixel-limit inputs, native schema admission, invalid template before compilation,
repeated target lookup with one compile and release invalidation, pattern geometry
parity. Stop for changed geometry or unsupported owner semantics.

Prepare outcome: reproduced the decoder-message loss and the 224-template format
failure. Explicit vector type now has the same meaning at schema and compiler;
other types remain rejected. Existing preparation and target maps are retained.
A work-count regression additionally proved ten exact-key lookups enumerated the
whole map ten times. Exact lookup now uses only requested keys; broad prefix/all
queries still enumerate intentionally. No new cache or change to invalidation.

### Step card - observe report integration

Re-read observe and Execution recording/evaluation. Same allowed inputs, outputs,
contributors, prohibitions and failure owner as above. Boundary adds its already
allowed execution-report-cli.ts and test. Expose unavailable model-round/parent
linkage in the human-readable report as well as JSON; preserve item durations and
native turn identities without equating either with inference count. Gate: mixed
exec/wait/tool report, historical missing metadata, CLI and server integration.
No runtime drawing or provider behavior change in this segment.

Real-record replay correction: the lifecycle fix alone does not make the saved
review current. The last App action is the canonical read-only inspection-stamp
validator, and the old diagnostic allowlist omitted its `current` result. Extend
this same observe segment with a real serialization regression. The report can
accept a successful post-review freshness validation only with explicit retained
`current: true`; false or missing evidence and later mutations remain unconfirmed.
This uses the existing validator contract, not a heuristic list of read-like names.
Old records are not backfilled or silently certified from missing summaries.

### Bounded acceptance

Completed the research-backed correction. Final focused integration: 335 passed,
3 existing opt-in provider cases skipped, across 10 suites. TypeScript, naming,
scoped ESLint (zero errors, two existing console warnings), formatting and the
source-bound proof passed. Proof 3763b907-23d7-4fa2-af3c-a7696b31ec53 covers one
flow, three negative scenarios and seven obligations at reviewed revision 45.
Permanent tests demonstrate template geometry equivalence, contradictory-type
rejection before compilation, retained geometry/ID reuse without full-map scans,
release invalidation, decoder cause preservation and serialized review freshness.

The prior real run was re-read without invoking a model. Its missing final
freshness field is not backfilled; historical review currency remains unconfirmed.
New receipts retain that field. Native program-child links and individual model
rounds are unavailable in the inspected protocol, not inferred from counts.
No new data store, cache, prompt rule, model/effort change or dependency was needed.
No full drawing rerun or speed claim. No commit/push; local .env untouched.

### Single live acceptance - research correction - 2026-10-04

User authorized one complete live test. Scope: existing formal headless recording
case only; no implementation edits, retries, model changes or push. Step: settle
and observe integration through the existing full owner flow. Inputs: unchanged
elevated Taipei 101 upper-two-tiers brief and current App. Outputs: terminal
outcome, full durable checkpoint, browser errors, recording and observed report.
Conditions: current overall coverage before first recording-only fit; final fit
only after settlement; ten-second final hold. No partial-bounds repeated fits,
provider mock or screenshot-only completion claim. Existing 30-minute test cleanup
guard stays active. Stop on failure and preserve evidence. Artifacts:
tmp/research-correction-live-20261004. Restore only test-owned local .env keys and
verify source hashes and test-service cleanup afterwards.

Single live outcome: one run, no retry, 1 E2E passed (9.3 minutes). Provider
request completed in 511.44 seconds; first drawing applied at 136.20 seconds.
32 App tool calls were usable and 6 native research calls completed, with no
input rejection or reference import failure. Final durable checkpoint matched
6,786 vectors and 6 groups. Recording contains exactly two fit interactions and
the final ten-second hold. All 428 frozen source hashes stayed unchanged; test
services stopped and only the test-owned .env settings were restored. No push.

Real App overview and native detail screenshots were reviewed. Elevated view and
facade detail are present; some edge fragments and more schematic spire detail
remain visible. E2E success does not certify every visual detail. The report also
exposes a remaining observe gap: post-review select_elements makes its current
flag false even though final canonical inspection validation returns true.
Preserve this evidence for the next bounded correction, without changing code or
rerunning this user-authorized single test. Results and comparison are recorded
in tmp/research-correction-live-20261004/summary.md.

## First visible output - 2026-10-04

Bounded objective: remove avoidable preparation before the first retained drawing,
without changing final quality or the original request. Scope: compose guidance,
registered API discovery and recording-only first-visible observation. Fixed audit:
current domain prompt, discovery implementation/tests and existing recording helper.
No model/effort changes, source resizing, new dependencies, framework rendering
changes, quality-threshold changes, push or additional live model run.

Compose Step Execution Card: owner `compose`; inputs existing request/context and
admitted registry; outputs concise immediate decisions and exact callable schemas.
Use existing evidence before research, batch independent information gaps, and
resume drawing when those gaps no longer block a retained structural part. Keep
unresolved requirements for later completion. Add opt-in category schemas to the
existing discovery tool; default remains compact. No intent classifier or schema
cache. Formal prompt contract and discovery regressions must fail first; exact
schema equivalence, unavailable category and invalid selector tests gate the edit.

Observe Step Execution Card: owner `observe`; recording harness only. Inputs actual
canvas screenshots and existing recording clock; output first observed canvas pixel
change plus observation interval, separately from canonical application receipts.
A changed pixel is not certification of a useful or correct drawing. Keep the
unchanged-canvas case explicit. Sample within the existing recording loop, stop
capturing after detection, and never delay App receipts or add automatic App zoom.
Formal headless cases cover unchanged pixels and a newly rendered drawing; preserve
the two existing recording-only fit interactions. No production screenshot polling.

DoD: focused tests, types, scoped lint/format, naming, direct-consumer review and
source-bound Inspector proof. No measured live latency claim without a new live
run. Stop at these gates; other prior report/quality gaps remain separate work.

### First-visible bounded acceptance

Completed compose and recording-only observe changes. The two new server
regressions first failed on unconditional research guidance and unsupported
category schema retrieval. The recording regression first failed because no pixel
observation existed. Existing compact lookup remains unchanged; opt-in category
schemas match exact-name schemas through both the tool and native provider route,
without a canvas exchange. Guidance preserves final acceptance and original detail.

Validation: 210 server tests passed, 3 existing opt-in cases skipped; 8 headless
recording tests passed and the opt-in live drawing case skipped. Two Inspector
contract tests, the official App typecheck, scoped ESLint, formatting and 12 naming
checks passed. Source-bound proof passed at revision 46: one flow, three expected
negative scenarios and seven obligations. Final positive run:
`d80b7c56-2390-409d-b7a2-97d1c9ae7311`. A broad diagnostic `tsc --noEmit` also included
unrelated legacy test-mock typing errors; the supported `typecheck` script passed.
No edits were made to those unrelated mocks.

Pixel evidence is explicitly scoped to the recorded unobscured canvas region at
native screenshot resolution. It retains the last unchanged sample's capture-start
and first changed sample's completion, not an invented exact presentation time.
Conversation updates alone do not count. This is a visual change observation, not
semantic drawing quality. The actual App screenshot was inspected; no production
rendering, automatic zoom or model parameters changed. Test services stopped.

No new live model run, latency claim, commit or push. The next authorized live run
will save first-visible pixel evidence beside existing canonical apply receipts,
using the unchanged benchmark brief and two recording-only fit interactions.

### Single live acceptance - first-visible correction - 2026-10-04

User authorized one complete headless live run. Bounded scope: existing Taipei 101
upper-two-tiers acceptance recording, unchanged brief, gpt-6-astra medium, no retry,
no implementation changes or push. Owner segments: settle and observe integration
through the current flow. Inputs: original brief and current source; outputs:
canonical checkpoint, final outcome, actual canvas pixel observation, execution
records and recording. Keep the existing two fit milestones and ten-second final
hold. Use local .env, restore only test-owned keys, freeze source hashes including
untracked App source, stop test services and inspect actual App screenshots.
Artifacts: tmp/first-visible-live-20261004. Failures preserve evidence; do not silently
rerun or change the drawing prompt during this one-run comparison.

Single-run outcome and scope correction: the user clarified that first-output
experiments must stop after the first retained visible drawing. Interrupted this
run and stopped recording/services; no retry. First application receipt: 152.72 s;
first visible sampled interval: 180.16-181.29 s, including recording-only fit at
180.24 s. The full-completion test is interrupted, not a passed finished-artwork
acceptance. All 488 frozen source hashes stayed unchanged and local .env was
restored. Evidence: tmp/first-visible-live-20261004/summary.md.

Before another first-output experiment, separate its formal stopping condition
from the full-artwork test: capture the first retained visible output, cancel,
save evidence and end recording. Do not continue refinement for that measurement.
Keep full-completion testing as a separately requested scenario. No implementation
change or follow-up model run was made during this interrupted test.

### Reference admission, discovery and progressive stages - 2026-10-04

Bounded contract: fix original-resolution reference admission, mixed tool/action
discovery and the global structure prerequisite that delays ready drawing batches.
Reuse the existing importer, admitted registries, preparation/workflow and partial
visual review. No search-policy, model, rendering, history or final-quality changes;
no new live generation or push in this task.

Reviewed flow: compose resolves actual tool and action schemas with explicit routes;
prepare validates original raster bytes and compiles each ready semantic batch;
apply retains each batch through the existing canonical path; inspect can review
a subset with final=false, leaving the rest pending. Full structure review remains
available, but is not a prerequisite for compiling repeated geometry. Final review
still covers all requirements, current evidence and required detail.

Step cards (execute sequentially):

- prepare / preparation-and-execution: public downloaded bytes -> original raster
  attachment and oriented dimensions, or source-local failure. Preserve original
  encoding, validate decode, retain decoder resource safety and byte guards. Reuse
  request-local imports. Direct consumers are image region extraction and layer
  separation. No resampling, native network bypass or source substitution. Tests:
  > 4 MP valid original, compressed encoding preserved, corruption rejected, cache
  > count and original-resolution downstream region/layer handling. Stop at focused
  > importer/image tests before compose.
- compose / capability-discovery-and-composition: admitted action and native-tool
  definitions -> exact schemas with execution routes, including mixed lookups.
  Unknown names preserve known matches and report missing names. Registry-derived,
  request-local, no canvas exchange, invented aliases or duplicated schemas. Test
  mixed lookup, unknown name, same-name action/native distinction and provider wire.
- prepare then compose: remove repeated-geometry's global review dependency; no
  incomplete/future geometry is required by preparation. Tests compile valid pattern
  stages before global review; malformed input still fails. Workflow guidance uses
  existing final=false review for ready parts. Integration proves multiple retained
  batches with partial review while full acceptance remains pending.

Authorized files: these Inspector owner boundaries and their formal tests, this
plan, execution spec and Inspector contract. Gates: red regressions before each
runtime fix, focused suites, official App typecheck, naming, scoped lint/format,
source-bound Inspector proof and bounded direct-consumer review. No unrelated audit.

Inspect handoff card: align existing review tool descriptions and pending-status
text with progressive preparation. Inputs/outputs, evidence freshness, criterion
validation, independent structure/final assessment and final acceptance stay
unchanged. Owner files: local-design-review.ts and design-review-stages.test.ts;
case: a ready part uses partial review without an advertised global prerequisite.
Gate: descriptor regression plus existing partial, structure and final review suite.

Prepare direct-consumer review found an introduced handoff requirement: preserving
JPEG encoding also preserves EXIF orientation, while the native vector converter
ignores it. The real importer-to-converter regression fails with swapped dimensions.
Normalize orientation only at the existing conversion adapter, without resampling or
altering the saved reference. Region/layer paths already orient before extraction.
This is inside reference admission and direct-consumer scope, not a new workstream.

### Bounded acceptance - 2026-10-05

Completed the three authorized changes; web search policy is unchanged. Reference
import retains encoded originals and display dimensions, validates actual decoding
and no longer imposes the separate 4 MP limit or delivery-time PNG inflation.
Region/layer consumers share decoder-default pixel safety; whole-image conversion
applies EXIF orientation only to its converter input. Original references remain
unchanged. The real JPEG import-to-native-converter regression caught and verified
this handoff. Byte limits, cancellation and decoder safety remain.

Exact name discovery indexes actual admitted native definitions once per request,
returns distinct native and batch-action routes (including shared names), retains
known matches and identifies missing names. Native protocol proof verifies the
combined preparation and batch entrypoint schemas, with no canvas exchange.

Preparation no longer consults global structure readiness before compiling a ready
pattern batch. Formal integration delivers a first retained batch, records a partial
review, then prepares/applies a second batch while other criteria remain pending.
Existing final settlement still refuses completion. Guidance and review descriptors
now agree on that ordering; canonical rendering, history and final review are unchanged.

Verification: 354 tests passed across ten focused suites; three existing opt-in
provider tests skipped. Typecheck, scoped ESLint/formatting, diff whitespace and
12 naming checks passed. Initial red regressions cover reference admission, both
direct raster consumers, mixed lookup, pattern readiness and review guidance.
Provider conversion fixtures now use real PNG bytes instead of a non-image sentinel
so decoding is exercised before the mocked native converter. Inspector revision 47
proof passed: one flow, three expected negative scenarios, seven obligations.
Positive run: c2d88ea3-9d20-40c4-ae18-f4c3568eaf1e.

Evidence: tmp/staged-acceptance-tests.log, tmp/staged-typecheck-final.log,
tmp/staged-eslint-final.log, tmp/staged-naming-final.log, tmp/staged-proof.log.
No live drawing test, measured speed claim, commit or push in this task.

### First-output recording - 2026-10-05

Bounded user-authorized task: one headless live Taipei 101 upper-two-tiers run,
unchanged brief/model/effort. Stop AI and recording ten seconds after the first
visible retained drawing. No retry, full-artwork acceptance, production change or
push. Preserve original source configuration and record all artifacts locally.

Observe step card: inputs are actual App pixels, canonical receipts and user test
stopping condition; outputs are first-visible evidence, ten-second hold, explicit
Stop, saved document/log/video. Extend the existing recording driver with an
explicit first-output mode, separate from full completion. Native screenshot
sampling stays test-only. First-output fit may use confirmed applied-stage bounds;
do not wait for global quality approval. Preserve full-artwork tests and their
settlement fit. No renderer/model/prompt changes. Files: existing local AI E2E,
this plan, execution spec, observe Inspector clause. First prove the stop regression,
then focused recording checks, lint/types/naming and flow proof. Live run exactly
once after those checks; preserve any failure without restarting. Cleanup only
test-owned processes/config keys, never delete local .env.

Validation: the first-output stop regression failed before implementation and passed
afterward; six other focused recording checks passed. Formatting, types, ESLint,
naming and observe proof passed (394ce9a1-cd3b-43e9-93c9-406cfe1abfab, revision 48).

One live run executed under tmp/first-output-live-20261005. It failed before first
output at 50.417 s: import_reference_image received an article URL and raised
TOOL_FAILED after 377 ms; no detailed exception was retained. The provider turn
ended immediately, with no canvas receipts. The exact exception cause is not
established by this evidence. Screenshot review confirms an empty App canvas;
the ten-second-after-visible condition was never reached. No retry or live
product repair was performed. Video, source hashes, document and records retained;
493 source files unchanged. Test-owned .env keys restored and tracked services
closed. This is a failed first-output product result, not full-artwork acceptance.

### Tool-local failure recovery - 2026-10-05

Bounded correction of the first-output failure: native result delivery must accept
the original raster formats admitted by reference import, and tool-local errors
must return actionable failure receipts instead of aborting the provider turn.
Preserve Stop, protocol/transport failure handling, unknown canonical-write
settlement protection, model/effort, search and drawing quality policy. No live
model rerun or push in this slice. Discovery is limited to native invocation,
content conversion, registered preparation owners, provider dispatch and their
direct formal tests.

Compose step card: ai-execution-flow compose, capability-discovery-and-composition.
Inputs registered schemas, owner results/errors and request cancellation; output
native tool results allowing corrected or alternate operations in the same turn.
Preparation owners cannot write canonical state; their failures and delivery
failures remain tool-local. Unknown write settlement remains terminal and cannot
be replayed. No tool-name recovery list, model workaround or image resizing.
Files: local-ai-provider, local-tool-invocation, local-reference-tools and
local-operation-tools plus their existing tests, spec and Inspector compose
contract. Internal helpers belong to the invocation owner; existing native names
and persisted identities remain unchanged. Gates: failing JPEG/WebP/large PNG
delivery and same-turn recovery regressions, focused owner suites, cancellation
and queued-write regressions, types/lint/naming, App build and flow proof.
Stop for any required unrelated owner change. Review only this bounded slice.

Validation: six new failing cases first reproduced the three original-raster
delivery failures, same-turn execution/delivery termination, and malformed
preparation output. All are green after the owner correction. The focused five
suites pass 215 tests (three existing opt-in tests skipped), including Stop and
queued uncertain-write guards; an EXIF-orientation handoff also preserves bytes
and rejects incorrect dimensions. Types, ESLint, naming and App production build
pass. Compose proof a56c4916-d7e1-468d-80f0-740651ee2b32 passes revision 49.
Bounded review confirms no automatic retry, mutation replay, image resizing or
model/prompt change. No live AI rerun or push.

Correction to the preceding live-run diagnosis: the retained full input includes
an imageUrl ending in .jpg, separate from the article sourceUrl. The article URL
was attribution, not evidence of a wrong image input. The old native delivery
admitted PNG only (and capped references at four megapixels), inconsistent with
the original-format importer. The prior TOOL_FAILED record omitted the exact
exception; the new formal regressions prove that handoff defect independently.

### Uniform API failure contract - 2026-10-05

Supersedes the preparation-only recovery restriction above. User-authorized scope:
all registered native tool groups and their canonical browser/runtime batch path.
Native schema admission, execution, decoding and delivery return bounded failure
receipts; owners do not opt in to recovery. A failed API does not terminate the
provider turn. Stop, unavailable transport and invalid provider protocol remain
request lifecycle failures. No automatic replay; uncertain writes remain unknown.
Successful action receipts survive a later failure; refreshed context precedes
further permission decisions. Model, prompts, rendering and search are excluded.
Discovery is frozen to the invocation/provider, batch exchange, runtime callback,
observations, direct tests and their public contracts. No live rerun or push.

Apply step execution card: input admitted batches and cancellation; output success
or failure receipts including completed actions, failure stage, action identity,
settlement and context freshness. Framework owns action settlement, browser owns
acknowledgement, server owns receipt delivery. Test failed-middle-action recovery,
no replay, next batch admission, context refresh and Stop before implementation.
Allowlist adds ai-agent-runtime provider/runtime/multi-batch tests and package docs
to the existing apply route; no changes to transaction semantics.

Compose step execution card: all actual registered owners use one admission/error
boundary. Tests cover all registered groups, schema explanation exceptions, owner
exceptions, malformed output and delivery failure; preserve semantic failures and
partial evidence. Remove preparationRecovery policy, not tool capabilities.

Observe step execution card: correlate completed and failed actions from the same
receipt without marking already acknowledged actions failed. No log-controlled
execution or second source of state.

Closure: focused failing regressions first; framework runtime suite and builds,
App invocation/provider/exchange/observation suites, typecheck, lint/naming, flow
proof and bounded diff/direct-consumer review. No further repository-wide audit.

Validation and closure: regression tests first demonstrated provider termination,
stream closure, poisoned runtime callback state, schema-explanation escape,
missing partial-failure observation, and incorrect zero-progress settlement after
a compound operation. The shared invocation now covers every registered tool
definition; owners no longer opt into error recovery. Completed action receipts
and exact failed action identities survive recovery. Context refresh failures
remain explicit and fresh context is required before later permission checks.

Framework: 100 tests pass. App server/browser exchange: 255 tests pass, with three
existing image opt-in cases skipped; App runtime/transaction integration: 15 pass.
The final invocation/provider slice passes 128 tests after the partial-delivery
classification update. Initial DOM-dependent tests were mistakenly invoked with
Node; rerunning with the project's jsdom environment passes all 15. Framework
and App builds, typecheck, scoped ESLint, naming and diff checks pass. Flow proof
0aa07dbf-0897-4873-8fef-528157d45c59 passes revision 50 (three negative scenarios
and seven obligations). Bounded review checked final-response report routing,
Stop, unknown writes, compound receipts, current context and direct consumers.
No live AI rerun, model/prompt change, commit or push in this task.

### First visible output - bounded execution, 2026-10-05

Objective: remove repeated definition delivery and avoidable mechanical reference
round trips, fit the recording when objects first exist, and reduce measured
vector-gradient preparation work without changing artwork semantics or resolution.
Mutation scope: existing recorder, compose/discovery, reference acquisition and
canonical gradient rendering owners, their direct consumers, formal tests and
contracts. Discovery is limited to these owners and the retained first-output run.
Do not change model/effort, web search providers, normal App navigation or output
quality; do not add dependencies or push. No new live generation is necessary for
renderer diagnostics. Reuse the retained scene and deterministic fixtures.

Execute owner slices in order: recorder, definition delivery, reference acquisition,
then gradient rendering. Each slice requires a failing regression first, focused
correctness and work-count checks, direct-consumer review and applicable types,
formatting and flow proof. Preserve uncertain-write and cancellation contracts.
Finish after these gates and report evidence and remaining limitations; do not
expand into unrelated repository repair.

Observe Step Execution Card: the isolated recorder reads canonical current canvas
bounds on each observation. First nonempty bounds trigger one fit immediately,
without waiting for an AI receipt or complete composition. Terminal settlement may
trigger the final fit. Output is recording navigation evidence and sampled pixels,
not a claim of visual quality. Normal App behavior is unchanged. Implementation
allowlist: local-ai-provider E2E recorder and its formal regression scenarios.
Test an active drawing with objects but no receipt before implementation; assert
one early fit and one terminal fit, preserving navigation failure and Stop tests.

Compose Step Execution Card: native schemas remain owned by provider-native
registry discovery. App discovery returns native routes, not a second copy of
those schemas. App action definitions are returned once per exact admitted
revision within this request; later reads return a definition reference and an
explicit refresh route. Refresh always restores the full definition after context
loss or failed delivery, without replaying actions. Compact category menus do not
mark schemas delivered. No cross-request state or suppression of actual mutations.
Retained evidence: discovery outputs 3 and 7 repeat the same prepare_design schema.
Tests: mixed native/action routes, repeat across selectors, refresh, new request,
changed definition identity, compact-menu then full lookup, and zero dispatches.
Allowlist: operation-tools, provider discovery guidance, direct tests and contracts.

Prepare Step Execution Card: one reference acquisition call accepts independent
candidate image/source URL pairs, returning ordered per-candidate receipts and
visible original images. One failed candidate cannot discard successful siblings.
Public HTTPS validation, redirects, byte/decoder guards and cancellation remain
owned by the existing downloader/importer. Request-local in-flight reuse avoids
concurrent download/decode/attachment duplication for the same URL; successful
reuse retains each caller's attribution. Failed attempts remain retryable. Bounded
I/O concurrency controls resources, not task attempts or search-source selection.
Tests prove parallel start, duplicate work counts, ordered partial success,
cancellation and original image delivery. Existing singular wire input remains
compatible; advertised preferred input is the candidate batch. No search provider,
image resampling, automatic source suitability decision or mutation is introduced.

Render owner slice: @asyra/render's existing even-odd fill owner consumes canonical
shape, fill and dimensions and emits the same engine-neutral raster resource.
The engine-boundary Inspector orchestrate-render-adapter contract already owns
fills/** and their tests; this internal arithmetic scheduling change introduces no
new route, resource type, cross-call cache or Inspector semantics. Gradient type,
handle deltas/radii and interpolation segment constants are invariant within one
synchronous rasterization. Prepare them once, reuse per-sample scratch values,
and retain exact pixel-center geometry, fill ordering, alpha, stops and resolution.
The 954-gradient retained scene identifies this owner; a representative three-stop
diagonal gradient supplies the deterministic performance fixture. Work-count
oracles bound type/handle preparation by fills rather than pixels; golden pixel
buffers cover all gradient types, holes, transparent layers and changed inputs.
Profile before/after with identical raster dimensions. No timing pass threshold.
Run render unit suite, framework build, vector/gradient visual consumer gates and
inspect actual screenshots before closure. No engine replacement or resampling.

Visual-fixture iteration: three setup failures occurred before any rendered-pixel
assertion (browser bare-module resolution, reused point/segment identities, then
an empty default-fill id conflicting with its record key). Re-read current element
creation and property-record contracts: these are fixture admission defects, not
renderer evidence. Replace manual post-creation record construction with the
existing public createElement input carrying one complete fill with a unique id.
Keep independent canonical point/segment/network ids. Scope remains the new vector
gradient E2E fixture only; no production bypass or owner change. The next gate must
reach canonical four-gradient state, capture real pixels, then prove fill update,
Undo and Redo parity. Self-review: creation input/record ownership now agree; no
fallback pixel output, guessed old value or fixture-specific runtime behavior.

First-output scope validation and closure:

- Recorder regression failed with an existing object and no batch receipt, then
  passed with first-object fit. Nine recording E2E cases pass; the two opt-in live
  generation scenarios were not run. Normal App navigation was not changed.
- API tests prove category/name/operation reuse, explicit refresh, request reset,
  exact revision identity, native schema authority and no canvas dispatch. The
  provider proof now verifies native definitions in their registry and compact
  native routes/action references in repeated App discovery.
- Reference regressions prove concurrent start, one download/decode/attachment per
  duplicate URL, ordered partial results, per-caller attribution, original image
  delivery, cancellation and retry after source failure. Direct-consumer review
  caught missing aggregate failure classification; the common outcome now reports
  partial/all-unavailable results with each failed source's reason. Shared native
  schema admission is covered, including mixed singular/batch rejection.
- Render preserves exact golden buffers for four gradient kinds, transparent
  stacking, holes and changed inputs. The 24-fill / 9,216,000-pixel fixture changes
  gradient-kind reads from 9,216,000 to 24, and bounds handle reads by fill count.
  The initial isolated instrumented run was 2,172 ms; the first equivalent run was
  886 ms. These are local owner-fixture observations, not an AI latency promise or
  a timing pass threshold; concurrent final-suite runs differ. No raster dimensions
  or pixel values changed, and no cross-call raster cache was added.
- 231 App server tests, 235 Render tests and nine direct vector consumer tests
  pass. Six existing gradient E2E cases and the new vector gradient fill / Undo /
  Redo case pass, alongside the nine recorder cases (16 E2E total). Three existing
  opt-in provider cases remain skipped. Naming, scoped lint, Render build, App
  typecheck/build and scoped diff checks pass; the App build retains its existing
  chunk-size advisory.
- App visual review used http://localhost:3000, the project .env URL, with a 1280 x
  720 viewport at 145% zoom, no selection, and ordinary vector strokes. Runtime
  data and the inspected screenshot are in tmp/first-output-vector-visual/.
  Four gradients and their holes render correctly; fill opacity update plus Undo
  and Redo restore exact canvas pixels. No new AI-generated artwork quality claim.
- Bounded review covers definition recovery, native dispatch routes, schema
  admission, source-local errors, cancellation, pixel parity, fill invalidation,
  Undo/Redo and normal navigation isolation. No dependency, model change, commit
  or push. Test-owned servers closed; no listener remains on the test ports.

The four authorized owner changes are complete. Total search/model latency still
requires a subsequent explicit live first-output run; this task's deterministic
checks do not claim a faster whole AI request.

## Ready-part delivery correction - 2026-10-05

Bounded contract: fix the retained run's repeated native descriptions/reference
images, allow ready prepared parts to attach directly to an existing canonical
container, and make recording navigation independent of slow screenshot polling.
Owners are compose, prepare, apply and observe in the existing execution flow.
No source whitelist, model/effort change, geometry simplification, generation quota,
new renderer, automatic user navigation or remote operation. Discovery is limited
to these owners, their direct tests and the retained first-output run.

Self-review: a list of drafts still requires generating the whole list first and
would not fix first output. Use independent calls with optional parentId instead;
return each part's real identity in the existing compact receipt. Later parts
use parent-local coordinates and current container permissions, without replaying
previous geometry or inventing a root. This enables progressive delivery, but
does not prove a model will generate its first part earlier. Prove capability and
work counts with formal tests; a future live run measures model behavior.

Compose execution card: consume admitted tool identities; output native routes
without copied descriptions/schemas, while native discovery remains authoritative.
Update the existing ready-part guidance with the new attachment route after the
apply owner is verified. Failure owner compose; no generated-code evaluator.
Files: local-operation-tools and direct tests, then domain prompt and workflow
definitions. Gates: exact native/action lookup, unchanged execution identity,
provider proof, naming and typecheck. Stop on loss of capability/schema recovery.

Prepare execution card: consume public source candidates and optional refresh;
output original images once per request, then reference receipts with explicit
refresh recovery. Acquisition cache and delivery state are distinct; failures
remain retryable, bytes/resolution/attribution unchanged. Failure owner prepare.
Files: local-reference-tools and tests. Gates: actual image block counts, concurrent
duplicates, explicit refresh, new request, partial failures and cancellation.

Apply execution card: consume admitted prepared artifact plus optional parentId;
output ordinary applied identities/receipt. Validate current container capability,
workspace membership and lock state through canonical APIs before each write.
Parent-local coordinates; default workspace behavior retained. Failure owner apply.
Files: design-actions, local-design-tools, local-design-workflow and direct tests.
Gates: sequential parts, existing/custom container, missing/locked/non-container
parent, parent removal between slices, compact identity, input admission and normal
transaction/Undo consumer tests. No partial invalid-input admission or auto-retry.

Observe execution card: test harness alone observes canonical nonempty bounds and
calls existing viewport API once at a browser animation opportunity, independently
of screenshot polling. Screenshot pixels still own first-visible timing. Cleanup
removes the observer; normal App never auto-fits. Files: local-ai-provider E2E.
Gates: objects arriving during delayed capture, one initial fit, no fit after
cleanup, existing recording/cancellation scenarios and actual screenshot review.

Completion: focused regressions fail before correction, pass afterward; run direct
consumer tests, scoped lint/typecheck/build, flow proof and bounded review. No
additional live AI generation is required or implicitly started by this repair.

Ready-part correction validation:

- Native lookup regression failed on copied description, then passed with actual
  namespace/tool routes only. Native schema discovery and explicit App-definition
  refresh remain available; no operation was removed.
- Import regressions failed on repeated image blocks. Sequential singular/batch
  imports now emit one image then reference-only receipts; explicit refresh
  redelivers the same original bytes with one download and one attachment. New
  request owns fresh delivery state. Existing concurrent/partial/cancel cases pass.
- Parent continuation regressions failed on workspace insertion and rejected
  workflow input. Existing/custom containers now receive only the new prepared
  part; missing, leaf, foreign-workspace, locked, cyclic and removed parents fail
  before the next write. Compact receipts remain sufficient for continuation.
- Real headless App proof creates two parts through the actual prepared action
  and invocation history runner: later part retains the previous surface geometry,
  attaches to its actual parent, and both parts Undo/Redo together in one entry.
- Recording regression initially had a fixture error (missing workspacePosition).
  Corrected fixture verifies actual creation, then fails with the prior polling
  driver and passes with browser-local navigation during pending capture. Existing
  immediate question/completion cases exposed a first-animation-frame race; the
  observer now checks already-present bounds synchronously before subscribing.
  Eleven browser cases pass; two live-model scenarios were intentionally skipped.
  Inspected ready-parts.png in tmp/ready-part-browser-final at the actual App URL.
- 168 focused server cases, 141 provider/direct-consumer cases (three existing
  live opt-ins skipped) and 45 App action/history/runtime cases pass. App build
  passes with the existing bundle-size advisory. Final type/lint/naming and
  scoped whitespace checks pass. Architecture proof revision 52 passes, including
  three expected negative scenarios and seven obligations; final proof attempt
  3e9fade6-1e00-499a-bd15-f8a7d350013e. Test-owned servers have stopped.

Bounded review: source provenance/original resolution, cancellation/retry recovery,
exact native identities, parent-local coordinates and canonical permission checks,
compact/full receipt compatibility, history grouping and test-only navigation
remain intact. No model tuning, arbitrary stage/object quota or automatic research
restriction. This closes the concrete capability/delivery defects, not a measured
first-output speed claim. A later explicitly requested live run must distinguish
provider preparation from App application instead of inferring success from these
deterministic checks. No commit or push.

## Local provider startup isolation - 2026-10-05

Bounded objective: remove inherited personal MCP startup from App-owned requests
and retain structured startup diagnostics. Scope is local-ai-provider, its formal
tests, recording projection and their current contracts. Model/effort, prompts,
research selection, geometry, history and user configuration files stay unchanged.
No full drawing run or speed promise. Discovery is limited to the existing live
trace, provider protocol/configuration and direct tests.

Step card - compose: inputs are request context, registered tools and effective
read-only provider configuration. Output is one isolated ephemeral thread. Read
configuration once per invocation and explicitly disable every inherited MCP
entry for that thread; an empty table is not a replacement under native config
merge. Do not cache names across requests or write personal configuration. Missing
or invalid configuration fails before starting inference. Native registered App
tools and web research remain available. Allowed contributor: app-server protocol;
forbidden: personal MCP processes, model fallback and global configuration writes.
Boundary: local-ai-provider.ts and its formal tests. Verify inherited/new/dotted
server names, absent/invalid config, cancellation, existing provider tests and an
opt-in native no-inference startup proof. Naming gate baseline passed.

Step card - observe (after compose gate): inputs are public startup notifications,
outputs are sanitized server/status/reason metadata with explicit omitted text.
Record process-level notifications before thread acknowledgement as well as
thread-scoped notices, excluding unrelated threads. No raw credentials, free-text
warnings or private reasoning. Boundary: local-ai-provider.ts, local-ai-usage.ts
and direct formal tests. Existing evidence schema stays version 2 with additive
optional fields. Verify missing/unknown fields, redaction and cancellation.

Gates: regression fails before repair, provider/usage/direct consumer tests, types,
scoped lint, naming, architecture proof and bounded diff review. Stop on required
out-of-scope changes; no push.

Native protocol correction: the real no-inference gate exposed that per-server
objects replace transport fields, while quoted dotted RPC keys are interpreted
as literal quoted names (unlike CLI TOML overrides). Revised bounded approach:
retain each effective server entry only in memory, set enabled=false, and pass
the nested map to thread/start. Never persist this config payload. This preserves
transport validation and arbitrary server identities without guessing key parsing.
The native gate, not a mock-only shape check, is the acceptance oracle.

Startup slice closure: four configuration regressions and the startup diagnostic
regression failed before repair. Effective configuration is read once per child,
MCP entries retain their native transport fields only in memory, unset null fields
are omitted for TOML conversion, and enabled=false is applied through the nested
thread override. The real installed native no-inference test injects an enabled
nonexistent MCP and verifies zero MCP startup notifications, no turn/start and
owned process shutdown. Final native proof passes (570 ms test body; this is not
a model latency measurement). Local .env probe settings were restored.

173 focused provider/recording/report/proof tests passed, three inference/native
opt-ins skipped in that suite; the native no-inference gate ran separately. Types,
scoped ESLint (existing console warnings only), naming, App build (existing bundle
size advisory), two architecture contract tests and whitespace checks pass.
Architecture revision 53 proof passes: 2976c6f7-cc3d-4b0b-a98f-f6a7eaf59fa5, three
expected negative scenarios and seven obligations. Bounded review preserves
model/medium effort, web/App tools, source dimensions, cancellation and history.
No new cache, global config write, drawing rerun, commit or push.

Known measurement limit: historical 62-second first-search latency cannot be
retroactively split into model compute and MCP startup; corrected startup removes
a demonstrated inherited-service defect, not proof that all 62 seconds disappear.
Structured diagnostic categories retain explicit free-text omissions; unknown
warning causes remain unclassified instead of being guessed.

## Startup audit completion - 2026-10-05

Objective: close evidenced isolation and diagnostic gaps before the first tool.
Discovery is now frozen to native startup configuration, transport notifications,
readiness callers and direct tests. Readiness is one request per open/retry, not
polling; tool schemas are already deferred; local preparation and handshake were
not the measured long interval. Personal global instruction support remains an
intentional contract. No model/effort, prompt, research or rendering change.

Compose step card: the same request-owned isolation policy must apply at child
launch and thread creation, including hooks and both native multi-agent switches.
The native hook engine defaults on independently of plugins; legacy notify is a
separate command path. Disable both without editing personal files. Preserve
account/auth, App tools, web research and assessment tool isolation. Only provider,
its tests and current contracts change. Prove policy before implementation with
formal regressions, then verify native config and registration without inference.
No daemon reuse or new cache.

Observe step card (after compose checks): capture structured native retry/error
metadata in the existing provider notification/RPC lifecycle records. Preserve
willRetry, public error kind, numeric HTTP/RPC status and thread/turn correlation;
unknown kinds are unclassified. Free text and arbitrary data remain omitted.
Retry notices must not abort a valid turn or manufacture reasoning duration;
terminal settlement stays with the existing native turn/transport lifecycle.
Owner is local-ai-provider with local-ai-usage evidence projection; names are
internal, neutral and optional additions to record schema v2. Test retry/recovery,
failed turn/RPC, unknown/private error details, unrelated threads, cancellation
during each handshake and independent invocation policy.

Required gates: failing regressions, focused provider/direct-consumer tests,
native no-inference probe, typecheck, scoped lint, naming, build, architecture
contract/proof and bounded review. No drawing rerun, commit or push. Stop if a
fix requires new owners outside this startup contract. These checks close known
defects, not a promise about external inference latency.

Startup audit closure: the isolation regression and eight diagnostic regressions
failed before their owner repairs; five stalled-handshake cancellation checks
already passed. A shared request-owned policy now applies before child initialize
and again at thread/start. Hooks, legacy notify and both native agent variants
are disabled. The installed native no-inference test injects enabled alternatives
and an unavailable MCP, then verifies effective policy, zero MCP startup notices,
no turn/start and child closure. This proves isolation, not model latency.

Error observations retain allowlisted public kinds, retry disposition, numeric
HTTP/RPC statuses and existing correlation/timestamps. A successful native retry
still completes through its original single turn; failed turns keep their existing
settlement. Unknown/private details never become log text. No model, effort,
prompt, personal instructions, App capabilities, research or geometry changes.

Final validation: 195 focused provider/readiness/recording/report/proof cases pass;
three opt-ins skipped there, with the real native no-inference case separately
passed. Types, naming, scoped lint (two existing console warnings), build (existing
bundle advisory), whitespace and two architecture tests pass. Architecture revision
54 proof a0ff6e35-ba2b-4d83-8ced-a98910cb2c12 passes three expected negatives and
seven obligations. Bounded review confirmed isolation at both startup boundaries,
redaction, native recovery and independent request cancellation. Test-owned child
processes closed; local .env restored. No drawing run, commit or push.

Native hook behavior was checked against the installed 0.160.0 protocol and
<a href="https://learn.chatgpt.com/docs/hooks" target="_blank" rel="noopener noreferrer">official hooks documentation</a>.
The original 62-second delay still has no retroactive internal inference breakdown;
the repaired records make future native failures/retries observable without
mislabeling all provider wait as model reasoning.

## Startup transport closure audit - 2026-10-05

Frozen scope: provider startup/first-call transport edges and direct consumers.
Read-only audit covered existing isolation, account/thread acknowledgements,
readiness caller, pending RPCs, cancellation, process and stdio teardown. No new
evidence calls for model/prompt/configuration changes. The remaining concrete
defect is incomplete stream lifecycle handling: stdout read errors have no
listener and EOF without child close can strand a pending request; stderr read
errors are also unhandled even though diagnostics are optional.

Compose step card: provider owns the input protocol and terminal transport
failure (local-ai-provider spec - request lifecycle; Inspector compose - broken
transport remains terminal). Consume existing owned child streams and pending
RPC/turn state. Fail only the affected invocation on required stdout failure or
premature EOF, cancel its tools and await owned child close. Completed protocol
followed by EOF is valid; diagnostic stderr failure never controls the drawing
outcome. Preserve explicit Stop, no lifetime timeout, no replay, separate request
state and existing finite mutation settlement. Files: local-ai-provider and its
formal test. Prove early EOF/read errors during admission and active turn, late
normal close, stderr failure, redaction and concurrent unaffected requests.

Observe step card (after compose checks): existing trace owner records bounded
transport event metadata (channel, status, terminal) with normal timestamps and
thread/turn correlation, never raw stream text/errors. Additive internal
provider_transport_event stage and channel field use record schema v2. Files:
local-ai-provider, local-ai-usage and direct tests; no separate reporting store.
Inspector observe contract is rechecked before this slice.

Gates: test-first failures, scoped provider/recording/readiness/direct consumers,
types, naming, lint, native no-inference registration, build and architecture
proof. No drawing run, push, or new dependencies. Review only this diff and direct
consumers after edits; stop if a new owner is required.

Transport closure validation: seven original missing-handler/EOF cases failed
before repair; the existing successful completion case passed. Permanent tests
now cover all three stdout terminal events during configuration, pending turn
admission and an active turn, plus optional stderr failure, independent peers
and events after complete protocol receipt. A focused refinement caught and fixed
misclassification of a post-completion read error before final validation.

Required transport loss terminates only its request and awaits child close.
Optional diagnostics remain non-terminal. New transport records retain channel,
status, terminal disposition and existing timestamps/correlation only; raw stream
errors remain private. Ten recording assertions failed before the observation
slice and pass afterward. No request timeout, replay, model or prompt changes.

209 focused tests pass, with three opt-ins skipped in that suite; installed native
registration passed separately without turn/start. Types, naming, scoped lint
(two existing console warnings), build (existing size advisory), two architecture
tests and whitespace pass. Architecture revision 55 proof
b6d60009-ff9e-4bad-9c27-012a29f8a0a6 passes three expected negatives and seven
obligations. Bounded review found no additional established defect in this startup
scope. Local .env restored, owned native child closed; no drawing run, commit or
push. This is transport correctness evidence, not a first-search latency result.

## Startup lifecycle completeness audit - 2026-10-05

Frozen objective: complete the submit-to-first-tool lifecycle audit before owner
repairs. Read-only discovery followed browser streaming, HTTP admission/exchange,
configured provider, native process/RPC admission, scheduler and record sink,
plus direct runtime cancellation and readiness consumers. Candidate classes are
normal/failing handshake, malformed identity, retries, observer exceptions,
cancellation between queued frames, concurrent invocation isolation and all owned
stdio/process termination edges. The existing dirty worktree is the baseline.

Repair candidates from that completed pass: progress callbacks currently escape
into execution; turn identity is assigned after the asynchronous acknowledgement
continuation and can admit mismatched tools; buffered browser frames can dispatch
a batch after Stop; stdin closure and immediate process closure after a complete
protocol do not share the required-stream settlement logic. Prove each candidate
with permanent tests before implementation. Existing native retry behavior,
readiness-only deadline, per-frame safety bounds, personal instruction policy and
request-local isolation are intentional. Runtime's cancellation guard already
protects canonical writes; the browser adapter still owns preventing stale
callback dispatch. No new latency attribution is inferred from these findings.

Compose execution card: local-ai-provider spec Request lifecycle; Inspector
compose inputs/conditions/implementationBoundary and observe diagnostic isolation.
Inputs are owned native protocol/registered tools and progress observer; output is
validated first-call execution and ordinary final settlement. Account/config/thread
admission still precede inference, and checkOnly bypasses the turn. Admit tools
only against the acknowledged turn, including coalesced fast replies. Progress
observers cannot control results. Required transport loss terminates its own work;
complete protocol followed by process/stream close remains successful. Native
protocol and current tool registry are contributors; private diagnostic text,
model/prompt changes, new timeouts/replays and cross-request state are forbidden.
Files: local-ai-provider and formal provider tests; current spec/plan clarify only
these contracts. Failure owner is compose. Gates: test-first regressions, native
no-inference registration, focused consumers, typecheck, naming, scoped lint,
build and existing architecture proof. Stop for an out-of-scope owner or product
contract conflict.

Apply execution card (after compose): existing apply cancellation condition and
local provider spec explicit Stop. Inputs are buffered NDJSON frames and request
AbortSignal; no new batch/receipt callback after cancellation, while already
acknowledged writes remain retained. Files: server-action-batch-provider and its
formal tests. Failure owner is apply. Test Stop during activity, receipt delivery
and pending response handoff; verify canonical runtime guard remains unchanged.

Final review is bounded to these changes, direct consumers and the frozen cases.
No drawing inference, dependency change, commit or push. Completeness refers to
this lifecycle boundary, not every tool or all repository behavior.

Discovery classifications confirmed by regression tests: nine native lifecycle
cases and two browser cancellation cases failed before repairs. Progress observer
exceptions are isolated and redacted; tool admission checks the acknowledged
turn synchronously before same-chunk dispatch; stdin termination uses the existing
required-transport boundary; valid final/readiness receipt followed immediately
by process close is accepted. Browser checks cancellation at every buffered frame.
The previously passing malformed-ack, ordinary stdin error, completed stdin closure
and pre-aborted response handoff remain preventive controls, not new bug claims.
No downstream runtime rewrite, new cache or inference request is required.

Completeness closure: 270 formal cases across 11 direct-owner/consumer files pass;
three native opt-ins are skipped in the general suite. The installed native
no-inference registration case passes separately and closes its child. Explicit
positive controls include a valid acknowledgement plus first tool in the same
chunk, valid readiness immediately followed by process close, native recovery,
concurrent isolation and Stop without mutation replay. Types, scoped lint, naming,
build, whitespace and two architecture tests pass; the existing build bundle-size
advisory remains. Existing architecture revision 55 proof
8f2ba0b3-a223-412b-85c1-25c885f9af24 passes one flow, three expected negative
scenarios and seven obligations, with no new architecture owner or route.

Bounded final review checked synchronous RPC admission/rejection settlement,
observer redaction, required-vs-optional streams, completed-result preservation,
per-frame cancellation and runtime/exchange consumers. No additional established
defect remains in this frozen startup lifecycle scope. Test processes finished
and local .env was restored byte-for-byte. No inference/drawing run, commit or
push was performed; first-search latency and the deferred schema-size performance
question remain unmeasured, outside this correctness closure.

## Post-audit first-output live acceptance - 2026-10-05

User-authorized scope: one headless live recording using the existing Taipei 101
upper-two-tiers/elevated-three-quarter brief, unchanged Astra medium configuration.
Observe step and its first-output recording condition were rechecked. Run only
the maintained first-output live Playwright case, no retries; fit first nonempty
canonical bounds, retain ten seconds after observed canvas pixels, then Stop.
Capture native records, request/receipt timeline, document, screenshots and video;
analyze measured startup/research/preparation/application phases against the prior
first-output run. No implementation edits, prompt changes or push. Preserve local
.env and close owned services. Weekly quota exhaustion stops this run per the
standing user constraint. Evidence proves initial visibility, not finished quality.

Live first-output result: one headless case passed in 2.6 minutes. Request
d8b70145-757c-4403-bacb-435e4a2b7e7b; evidence at tmp/startup-complete-first-output-20261004-210115.
First search 10.589 s versus 62.418 s previously; first visible canvas 133.349 s
versus 157.291 s, with 37 elements versus four. These differing early batches
are not an equal-quality speed benchmark. Two reference imports succeeded in one
1.752-second call; zero input/tool/protocol/browser errors. The remaining main
gaps were reference-to-plan (45.724 s) and plan-to-first-apply (42.291 s), owned
by the provider. Application/review/snapshot took 0.584 s.

Agent inspected the actual 1920x1080 App screenshot: elevated two-module initial
geometry is visible, with incorrect trim occlusion and incomplete crown/spire.
The model recorded that visual issue before cancellation. This is an initial-output
test, not visual acceptance of finished work. At 143.361 s the ten-second window
ended; the initial Stop-button visibility check returned false, but final context
cleanup cancelled the invocation (provider settlement 143.595 s). Last screenshot
precedes closure and still shows Working. No second live run. Complete records
have zero unattributed interval; provider internal wait is not claimed as measured
reasoning. Local .env restored, all three owned service ports closed, no push.
