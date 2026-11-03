# Taipei 101 self-report audit - 2026-11-03

## Scope and evidence

This is an audit and proposed follow-up, not an implementation change. It belongs
to the [Editable Design Agent plan](../plans/ai-design-agent-plan.md).
The baseline is the current dirty `codex/ai-conversation-improvements` worktree at
HEAD `a1ed9040315a70be8a6fbf13c79b072536d6ac0d`; HEAD alone does not identify all
source changes already present. Existing changes are preserved.

Discovery was limited to the provider, discovery, review, hierarchy, inspection,
Knowledge and workflow owners, their direct tests, and the saved same-thread run.
No repository-wide cleanup, production edits, new benchmark, release validation,
full local test, commit or push is part of this audit. Completion means classified
claims, traceable evidence and an ordered plan; uncertain causes remain uncertain.

Evidence root: `tmp/conversation-improvements/live/taipei-101-fixed-1793691918526`.
Use `self-report.txt`, `self-report-evidence.json`, `run.json`, retained snapshots
and provider record `provider-records/f18ec243-ab57-476c-98eb-277823047c72.jsonl`
with its adjacent payload directory. Preserve original evidence unchanged.

- Drawing prompt SHA-256: `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
- Report SHA-256: `cee15f82e3aae27c91d814ac7add698a2e2cd64358640afb616dde6e783c20d4`.
- One App request and native thread `01a1a05e-ca95-72a0-bea6-ba3708e39202`.
- Drawing ended at the deadline after 899,698.726 ms; reporting took 277,312.283 ms.
- Work and report used distinct turns of that same thread. Report completion is
  separate from partial artwork acceptance. The report did not change the drawing.

The AI's retrospective explanation is a hypothesis source, even on the original
thread. Public exchanges establish actions and outcomes; they do not establish
unexposed model processing, server queueing or network timing.

## Findings

| Concern | Evidence and existing behavior | Classification and disposition |
| --- | --- | --- |
| Exact tool discovery failed or returned unrelated tools | App exact queries returned the requested tool. `discovery-delivery.integration.test.ts` covers the recorded exact query against small and 10,000-related-tool catalogs. Native provider deferred discovery is a separate boundary (`local-ai-provider.ts`, native definitions use `deferLoading`). This run does not expose its alleged unsuccessful search requests/results. | Native discovery cause unresolved. Do not rewrite App search or add speculative aliases. |
| Repeated descriptions wasted time | Calls at 21.2 and 26.1 seconds retrieved contiguous pages 0–20,203 and 20,203–33,384 of the same revision. A narrower pattern lookup at 77 seconds overlaps earlier material, but its necessity is not established. | Pagination is intentional. Investigate the later reacquisition separately; do not count every repeated name as redundant work. |
| AI read an unused 90 KB mapping contract | The unscoped `map_retained_fills` usage request at 475.7 seconds advertised 90,865 bytes, delivered only the first 19,911 content bytes, and was not followed by a continuation or execution. Wrapper bytes are different from content bytes. | Confirmed unused acquisition, not 90 KB fully consumed. Existing field/schema selectors should be evaluated before adding another discovery API. |
| Merged discovery acquired unused material | The facts/calculations/reference-selector request at 44.4 seconds delivered the first 19,860 of 29,637 bytes. No continuation was observed; reference selection was not executed. | Observable acquisition cost. It is not a pagination correctness failure or proof that every unused lookup was irrational. |
| Evidence bindings require excessive copying | Final judgment input was 6,970 compact JSON bytes; bindings accounted for 3,513 bytes across seven checks. Earlier input was 3,296 bytes with 1,843 binding bytes. `local-design-review.ts` already returns executable `next.arguments` and a fill schema. | Confirmed interaction cost, not missing template support. Evaluate compact submission without weakening binding validation. Byte counts are not token or latency measurements. |
| A valid tower check disappeared | The second capture returned eight check templates, including `detail/tiers` with inspection `b3b2adb0-3e21-43cf-be60-0747314cce08`. Final submission contained seven checks and omitted that unit. Response explicitly reported it stale and `accepted:false`. | AI omission with correct partial coverage, not missing evidence delivery. The motive for omission remains uncertain. Never auto-pass the omitted unit. |
| Creation cannot target a parent | `local-design-workflow.ts` supports `parentId` in parent-local coordinates and ordered `parts.parentPart`. Later details in this run targeted the root, then were regrouped. | Existing capability. Root placement may be deliberate for coordinate handling; changing the parent alone is not a safe universal fix. |
| Layer order needs a missing primitive | `src/common-apis/hierarchy.ts` exposes `moveElementsRelative` with before/after placement and geometry-preserving moves. Two successful live batches performed nine moves. Workflow creation itself has no equivalent relative-anchor input. | Existing primitive; a single-call convenience gap is possible. Prove benefit and coordinate/transaction correctness before adding it. |
| Group inspection misses related ornamentation | A group capture selects its subtree; content in another branch is outside that target. Root-plus-region and multiple image bindings already exist. Regional paint ownership has formal coverage; the run used root-plus-region for a native crop. | Expected scope boundary unless a reproducible paint-contributor counterexample is found. Do not broaden every group capture or invalidate evidence globally. |
| Source facts were independently verified | Four research records have `upstream-not-exposed` output. This says the recorder lacked the body, not that the model saw no source. Facts are model assertions; review snapshots label URL claims `source-assertion`/`asserted`. However, the review tool description begins with “verified source facts.” | Confirmed wording inconsistency; fix the misleading wording. No evidence here of a broken verification engine or fabricated research. |
| Knowledge is absent or must be mandatory | The App prompt explains optional Knowledge for shortening exploration. Spatial Knowledge already covers coordinate basis, grouping, occlusion, minimal moves and regional checks. This run did not read it. | Existing capability not used. Its absence alone does not prove discoverability failure or that reading it would reduce elapsed time. Add only missing, targeted guidance with measurable benefit. |
| Tool recipes, early screenshots or low detail should be required | Current instructions do not require every task to create a recipe or follow one drawing sequence. The fixed prompt requests a highly detailed realistic illustration. | Reject blanket requirements and forced simplification. They would introduce new task constraints rather than repair a demonstrated defect. |
| Long gaps mean tools are slow | All 23 App calls were classified usable; recorded individual tool spans ranged approximately 0.002–6.688 seconds. Gaps outside these spans are not attributed by that measurement. | No observed tens-of-seconds App tool execution. Model computation, native lookup, queueing and transport cannot be separated from this trace. Do not label unexplained time as idle or reasoning time. |
| Persistence was broken because the report could not confirm it | The report preceded harness persistence confirmation. Later evidence recorded sequence 729/durable 729 and equal source/reload documents. | Correct information boundary, not demonstrated persistence failure. Do not force the report to wait inside an unsettled outer operation without checking transaction ownership. |

## Reproducible evidence anchors

Payload numbers below refer to the retained provider record/payload sequence, not
source line numbers. Use call IDs when locating entries across record renderings.

- `call_M1pw11NXYSc97r4xWP2Zxcxc` input/output 47/48 and
  `call_wKLVntvbO3E35QW5J4SLOQNz` 50/51: contiguous description pages.
- `call_KIMbsnFii5mb7FgofvLwB8E8` 74/75: later pattern-only lookup.
- `call_Cg9XlJyPaHKICj5I6nhH2Kcj` 59/60: combined first page.
- `call_ZfjA70kdU3gcDGW9cjy1y3sK` 254/255: unconsumed mapping description.
- Capture input/output 7920/7941: eight offered judgment templates.
- `call_YLw8P9rwMm8VVKfq8gvh6M6x` 7985/7994: seven submitted checks,
  explicit missing `detail/tiers` coverage. Compact JSON serialization of input
  7985 provides the payload-size comparison above; it excludes transport framing.

Relevant implementation paths are relative to `apps/asyra-design/`:

- `server/local-operation-tools.ts`: exact lookup, usage scoping and pagination.
- `server/local-ai-provider.ts`: native deferred declarations and trace boundary.
- `server/local-design-review.ts`: generated next-call templates, request-bound
  signatures, dependency freshness, partial judgments and asserted fact evidence.
- `server/local-design-facts.ts`: explicit model-assertion semantics.
- `server/local-design-workflow.ts`, `src/common-apis/hierarchy.ts`: parent-local
  creation and geometry-preserving relative moves.
- `src/common-apis/inspection-evidence.ts`: regional paint contributors.
- `server/ai-domain-prompt.ts`,
  `knowledge/design.architectural-illustration.spatial.md`: optional assistance.

## Recommended follow-up

The [plan](../plans/ai-design-agent-plan.md#follow-up---reduce-exploration-and-repeated-work---2026-11-03)
owns the execution order. Its objective is to reduce exploration and repeated
work while satisfying the user's request. This audit does not prescribe a drawing
sequence, increased detail or a target number of Knowledge calls.

- **Capability access:** distinguish native deferred discovery from App lookup.
  Assess existing scoped descriptions against the recorded unused and repeated
  acquisitions. Improve discoverability and examples where needed; add telemetry
  only when an exposed event answers the unresolved question. Missing upstream
  evidence does not block other work.
- **Judgment submission:** measure the binding-copy cost and evaluate a simpler
  submission through the existing review owner. A compact reference is one option.
  Preserve request/image identity, freshness, supersession and partial coverage;
  the omitted eighth judgment must remain pending. Smaller payloads establish a
  data reduction, not an automatic latency improvement.
- **Drawing adjustments:** use the recorded parent, order and regional-inspection
  cases to evaluate existing operations and composition. Add guidance where the
  capability is hard to use, or an operation where it removes demonstrated repeated
  work. If hierarchy behavior changes, verify transformed-parent geometry, paint
  order and undo behavior. Extend Knowledge for missing decision support rather
  than repeating its existing spatial advice in the App prompt.
- **Source terminology:** correct the review description's “verified source facts”
  wording to match its model-assertion semantics. Preserve the existing separation
  between URL assertions and observed image evidence.

Review and test each affected owner. For a later 101 benchmark, preserve the fixed
prompt, 15-minute work limit and original-thread report. Compare observable tool
traffic and repeated operations, and report completion separately from persistence
and report settlement. A partial drawing is not an equivalent completed result;
process measurements may still be compared when their limits are explicit.

## Validation and exclusions

Six selected cases passed across discovery, review and workflow suites. However,
the command exited nonzero: the workflow suite's `afterAll` contract guard still
reported `prepare_and_apply_design` as advertised but not exercised through its
required boundary. Adding the advertised ordered-input example did not satisfy
that guard. Therefore this is case-level supporting evidence, not a passing gate
or proof that the complete owner suite passes. No guard was disabled or test code
changed. Resolve the selection/boundary mismatch when validating changes to that
owner. This is not a prerequisite for unrelated description or discovery work.

Retained output: `tmp/conversation-improvements/report-audit-focused.log`.
The selected titles were:

- `delivers the recorded exact query without descriptive matches or catalog growth`
- `does not revive stale passes when only another criterion is reviewed after a scene edit`
- `retains eight regional units under one criterion and repairs only the invalid unit`
- `does not let one applicable image bless other rejected citations or verify URL assertions`
- `passes only the known parent identity when extending a prepared part`
- `executes the advertised ordered input example without hidden envelope fields`

Documentation diff whitespace and local Markdown link checks passed. No production
code, existing test, raw report or drawing prompt was changed by this audit.

Deferred: provider-internal timing attribution without exposed evidence, wholesale
search redesign, mandatory Knowledge, automatic visual acceptance, mandatory
recipes, forced detail reduction and new persistence waits. None is authorized as
a production change by this planning task.


## Implementation follow-up

The approved plan was implemented after this audit. The findings above describe
the pre-change source and remain historical evidence. Review bindings now omit
repeated dependency bodies while the same owner validates their signature against
retained evidence. Applying that field removal to recorded input 7985 yields
4,668 bytes instead of 6,970 (33.0% reduction); no new live timing is claimed.
Discovery wording, optional spatial advice and source terminology were updated,
and the workflow no longer prescribes drawing before further detail or research.

Affected owner suites and final integration checks passed, including the workflow
suite's original contract guard. That guard only counts successful contract calls;
the earlier narrow selection exercised partial outcomes. Neither the guard nor
its success requirement was changed. See the plan for completed validation and
remaining provider-observation limits. The drawing prompt and saved run are intact.
