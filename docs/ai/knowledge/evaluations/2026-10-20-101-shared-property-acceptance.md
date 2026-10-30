# Taipei 101 - Shared-property acceptance and root-cause analysis

## Result and limits

The single authorized Knowledge-arm run completed in **342.679 seconds
(5m 42.679s)**. First visible drawing content appeared at **75.808 seconds**.
It finished before the independently armed **600-second hard cutoff**. No second
model run or automatic retry was performed. Final check counts were **14 pass,
0 fail, 0 unverified, 0 stale**; required visual coverage was **5/5**. These are
retained tool/main-agent judgments, not an independent guarantee of artwork quality.

The framework/API implementation and admitted deterministic owner slices are
complete locally. Live acceptance exposes remaining agent/tool usability and
material-consistency limitations described below. Do not describe the whole
product as defect-free. All changes after the initial checkpoint remain unpushed.
No monitoring was restored and no new UI workflow was implemented.

### What changed

- Registered shared-property layers now have independent source identity,
  per-owner field overrides and logical child bindings. Source edits are explicit;
  selected-owner edits do not silently modify siblings. Reset removes selected
  overrides; detach materializes effective values. Rebinding with outstanding
  overrides is rejected until an explicit reset/detach decision.
- Core exposes read/local-update/source-update/reset/detach/share intents through
  existing public APIs and the AI operation registry. Factory still owns history.
- Canonical collaboration/persistence carries explicit lifecycle and owner bindings,
  rather than inferring property deletion from collection shape. Final-state link
  validation permits an owner legitimately removed later in the same accepted
  persistence window, while preserving operation-time existence/staleness checks.
- Retained Fill mapping now reports the actual selected-owner mutation scope and
  permits distinct local colors on a common source. Effective visual changes, rather
  than raw source fan-out alone, determine affected evidence.

## Protocol and evidence identity

- Run: `knowledge-quality-knowledge-taipei-101-1792446670972`.
- Sent: `2026-10-19T21:51:15.299Z` (2026-10-20 05:51:15 Taiwan).
- UI completed: `2026-10-19T21:56:57.978Z`.
- Model: actual provider `gpt-6-astra`, effort `medium`, unchanged.
- One drawing stream and one host-only `conversation-publication` stream with
  `model: none`. No additional AI reviewer exists in this recorded request chain.
  The five provider RPC starts are initialize, account/read, config/read,
  thread/start and turn/start, not five independent reviewing models.
- Fixed full-building prompt, 1920x1080 viewport, isolated document and tool library,
  the same two supplied reference images, explicit Knowledge read instruction.
  Retrieval was prompted; it is not evidence of spontaneous Knowledge discovery.
- Portable `illustration.architecture` revision 4; App architectural method revision
  14. Advice remains optional and is not a mutation-admission prerequisite.
- HEAD `e6734a3ec073365ca78e7c4b2c9256100f6d2c69` plus dirty task source.
  Frozen-source verification digest:
  `b1c989fd3beaed33039cf7742e80a83e6419bc20ddf0a25528f6549a5485825b`.
- Drawing request `9ef3ebd5-253b-410a-92e9-249b26218c7e`, source request
  `c7af3f0b-6d4e-4165-b716-cc970e8738af`. Stream complete, no sequence issues,
  zero recording failures, zero harness run errors. All 48 outer App calls have
  retained inputs and outputs. Native web-search details are not exposed upstream;
  image data URLs and protected resource fields retain recorder redactions. This
  is all available recorded I/O, not private model reasoning or unredacted transport.

## Timing

The provider began 264 ms after UI submission. Phase boundaries use actual outer
call completion timestamps and the observed first frame; tool durations are interval
unions, not sums that double-count nested work. The last column counts outer calls
started within a phase. The remainder includes model generation/decision/visual
interpretation, native Code Mode work, transport and scheduling. **It is not a
measurement of pure model thinking.**

| Phase | Wall s | App tools s | Research s | Outside observed tools s | Calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Knowledge, scope and first specimen | 75.808 | 1.909 | 2.053 | 71.845 | 10 |
| Specimen review, material repair and expansion | 66.597 | 6.470 | 0.000 | 60.127 | 14 |
| Podium and crown | 54.767 | 9.152 | 0.000 | 45.614 | 2 |
| Ornaments, occlusion diagnosis and repair | 101.741 | 2.335 | 0.000 | 99.406 | 13 |
| Final visual coverage and completion | 43.767 | 0.410 | 0.000 | 43.357 | 9 |

Provider-level duration is 342.368 s: observed tools/research 22.330 s, remainder
320.039 s. UI-to-provider and terminal observation account for the small difference
from UI wall time. First drawing application itself took **1.823 s**, beginning
73.709 s after provider start. The first-frame wait is primarily before that call,
not a minute-long geometry validation or rendering call.

Five preparation/application calls took approximately 1.823, 6.196, 5.456, 3.696
and 1.270 seconds. The largest wall-time phase is ornaments plus occlusion repair:
101.741 s, of which App tools occupy only 2.335 s. The trace locates this gap but
cannot split its remainder into private model reasoning versus generation.

Post-completion evidence is separate: final capture 0.109 s; durable receipt 0.006 s;
checkpoint export 1.416 s; recording finalization/tail 12.679 s (includes the required
10-second tail); fresh-context reload and capture 12.501 s; source verification
0.350 s. The 12.501 s is a harness stage, not isolated document-load CPU time.

## Historical comparison - descriptive, not causal

Previous run: `knowledge-quality-knowledge-taipei-101-1792418361592`.
Both used Knowledge, but App guidance and tool/framework implementation differ.
There is one sample each, no contemporaneous control and no blinded scoring.
Node count is not used as a quality or improvement criterion.

| Measure | Previous Knowledge run | Current Knowledge run | Interpretation |
| --- | --- | --- | --- |
| Completion | 541.714 s | 342.679 s | 199.035 s shorter in this observation; not a causal Knowledge effect |
| First frame | 109.016 s | 75.808 s | 33.208 s earlier in this observation |
| App tool interval union | 16.858 s | 20.277 s | Tools were not faster overall; work differs |
| External research | 2.288 s | 2.053 s | One observed research span this run |
| Outside tools/research | 521.910 s provider-level | 320.039 s provider-level | Not pure thinking time |
| Outer App calls | 47 | 48 | Fewer calls did not explain the improvement |
| Definition queries | 8 / 416,237 reply bytes | 9 / 320,292 reply bytes | Query count did not improve; bytes decreased |
| Outer input/output bytes | 401,635 / 611,536 | 246,890 / 494,578 | Payload reduction, not total transport reduction claim |
| Ornament input | 251,667 bytes | 154,836 bytes | Two repeated patterns; still dense source geometry |
| Representative acceptance | Expansion before confirmed pass | Failure, early repair, pass, then expansion | Observable adoption of the intended sequence |
| Material repair | Late 20-operation repair | Early two-operation repair | Earlier, but first two tiers still use a different material coordinate representation |
| Handoff problems | Three recorded handoff problems | Two rejected writes plus one partial check binding | Recovery works; interaction friction remains |
| Final check inventory | 36 passed / 0 stale | 14 passed / 0 stale | Different obligation sets; counts are not a quality score |

Current provider token usage is cumulative across the conversation: 1,932,580 input,
including 1,811,200 cached input; 12,891 output, including 2,335 reasoning output.
This is not 1.93 million newly authored words or unique prompt tokens. Transport
reports 4,700,234 bytes sent and 5,968,048 received; those totals include more than
outer tool JSON. No token-saving causal claim follows from these two runs.

## Decisions, repair sequence and roots

Call indices below are zero-based indices in `generation-analysis.json`.

### 1. Representative review is now before expansion, but representation diverges

Calls 9-22 construct two adjacent tiers, inspect them, record a material failure at
102.823 s, repair four glass faces at 125.02 s and record pass at 135.931 s.
Expansion starts at 135.946 s, after the pass. This is observable behavior consistent
with the guidance, unlike the preceding run.

The initial fields used a vertical span of 50,800 units versus horizontal 7,000,
with smooth stops. The main agent judged the specimen too flat. Its correction
replaced the first four faces with local gradient handles `(0,0.5)->(1,0.5)`.
The final saved checkpoint confirms those exact handles on `t1Xglass`, `t1Yglass`
and `t2Xglass`. Later tiers instead use world-frame fields; `t3Xglass` has projected
handles approximately `(0.07318,0.00997)->(0.98178,0.13375)`.

**Root:** the agent selected a valid local Fill override for a shared-coordinate
material objective. The API correctly executes a local edit; it does not preserve
or reconstruct the preparation field's world-coordinate provenance. Subsequent
construction uses a revised world field, so the specimen and extension are not one
identical material definition. The current task explicitly excludes a live world-
material editing system. Source/local shared-property APIs alone cannot reconstruct
that information. This is an App workflow/capability boundary plus an agent choice,
not proof of incorrect override persistence. No final call uses the new explicit
shared-source edit/reset/detach operations; their correctness is deterministic
integration evidence, not demonstrated real-agent adoption.

### 2. Three recoverable handoffs remain

| Call | Observed failure | Confirmed cause / recovery |
| --- | --- | --- |
| 11 | Partial capture binding | The same regional `facade/representative` judgment was assigned both whole-target and local images. Local invalidation cannot stay local under that mixed dependency. Images were retained; call 12 bound only local evidence without repeating the mutation. |
| 18 | Rejected before mutation | Input supplied both `arguments.elementIds=[]` and a retained target supplying the same slot. Admission correctly rejects conflicting sources. Call 20 omitted the placeholder and completed. |
| 29 | Rejected before mutation | Target `field=elementId` with path `request.anchorId` is not supported by the binder. It searches schema keys matching the field and allows only elementId/elementIds. The operation's valid argument is anchorId. |

The last case is a concrete tool-composition limitation:
`server/local-operation-batch.ts` `targetPath` records matching key names, then
validates explicit paths against those matches. Consequently an explicit path does
not rename an output identity into another registered document slot. The agent
queried the region, unnecessarily queried a larger region again although one match
was already retained, then paged one ID and passed it explicitly to the hierarchy
operation. This is not a capacity eviction or eight-slot limit.

The tool schemas and recovery messages are available, but the discovery surface
still asks the agent to integrate separate operation and binder contracts. Future
work should expose exact supported binding semantics; simply relaxing validation
or allowing guessed ID fields would violate the current contract.

### 3. Nine definition queries are not nine retrieval failures

There are eight query calls without refresh and one explicit refresh of
`prepare_and_apply_design`. All resolve with no missing names. The first response
contains the full tool schema; the agent requests `refreshReason=delivery-failure`
four seconds later. The App trace has successful delivery output; it does not prove
whether native Code Mode presentation abbreviated it. Treat the refresh's necessity
as unconfirmed, not as a proven server delivery defect.

The remaining lookups occur as the agent discovers review, Fill, context, ordering,
delete and final-ledger capabilities. One full prepare schema is about 72 KB;
all definition replies total 320,292 bytes. Root of the measured transfer is exact
full-schema delivery plus the refresh, not slow schema execution. `view=usage` and
field lookup already exist. The open usability issue is choosing and retaining
appropriate representations, not raising limits or introducing another registry.

### 4. Repeated geometry improved; dense motifs remain

The ornament input uses two `pattern` definitions with eight placements each,
32 motif faces and 2,200 supplied vertices. Backend repetition is used; the input
is no longer a complete geometry copy for every tier. However, dense polygon
samples and two explicitly oriented face sets still consume **154,836 bytes**.
This run therefore demonstrates pattern use, not optimal curve compression or a
need for a new renderer. The outline is an agent representation choice; a generic
curve authoring capability would require a separately reviewed scope.

### 5. Podium occlusion creates avoidable late work

The podium/lower-tower group is created after the main tiers. The first overall
inspection flags its top face covering the tower. Ordering correction is initially
rejected by the binder, then succeeds via explicit anchor ID. A later inspection
still finds an exposed unwanted face; call 38 removes that one face. This is a
visibility/layering design mistake followed by the binding limitation, not a slow
batch delete: deletion takes about **0.390 s**.

No extra model judged these states. Seventeen `review_drawing` calls consist of
**8 capture, 2 bind and 7 record calls**. They must not be reported as 17 AI reviews.
Main-agent interpretation occurs between them; no unobserved duration is assigned
as an exact AI visual-review cost.

## Accumulation, status and save/reload

- After final base/ornament judgments, call 40 retains 13 pass and one stale
  representative judgment. The changed tower/base overlap can affect the sampled
  lower facade; this trace does not establish an unrelated invalidation defect.
  Re-recording that region restores 14 pass. Ornament remains pending for missing
  whole-view coverage despite a local pass; adding already-captured overview evidence
  completes 5/5 coverage. `read_design_checks` refreshes stale mechanical evidence;
  final counts are stable at 14/0/0/0. This demonstrates accumulation and recovery,
  not proof of every possible spatial invalidation boundary.
- UI sampling records 15 nonempty status transitions. Long gaps are explicitly
  `Task context - no App operation executing`; active sampled parent tasks show the
  particular expansion or podium action. It no longer labels those captured idle
  gaps as active drawing. However, an older material-repair context reappears for
  about 13 seconds after expansion until the next authored context update. It is
  marked as context, yet semantically dated. Short operations may fall between
  samples; this one live run does not certify all concurrent-status permutations.
- Durable receipt: generation 0, sequence **709/709**. Checkpoint is **158,024,063
  bytes**. Fresh reload completes with the same root order, generation and receipt,
  and its screenshot was inspected. **The live reload oracle does not compare every
  property byte.** Stronger document equality is covered by formal browser scenarios,
  not claimed for this entire 101 checkpoint.
- No live persistence 409/422 or harness failure appears. The saved source itself
  confirms the local-gradient discrepancy; successful persistence preserved it,
  rather than silently fixing a design decision.

## Visual assessment and Knowledge inference

| Dimension | Observation | Claim limit |
| --- | --- | --- |
| Overall geometry | Full base-to-tip silhouette, stepped tiers, two visible facades and top surfaces are recognizable | Precise hidden geometry/dimensions are not established by the small aerial |
| Facade detail | Repeated windows, floor bands and ornaments are visible | Local detail images are redacted from persisted action payloads; overview alone does not certify every contour |
| Materials | Light/dark faces and reflective variation are apparent | Saved coordinates prove specimen/extension material-frame inconsistency |
| Podium | Offset low mass and roof details remain after occlusion repairs | Final form is a simplified interpretation, not a verified reconstruction of the reference |
| Knowledge adoption | Representative review before expansion; shared projection; explicit reference limits; backend grids/patterns | These choices agree with delivered advice; no control proves advice caused them |
| Quality improvement | Better sequence and earlier material repair are demonstrated | No defensible aggregate quality score or causal Knowledge gain from one unmatched historical comparison |

The portable module content remains revision 4. App guidance and capabilities changed.
The strongest conclusion is **partial adoption plus improved task sequencing**,
with retained material-frame and composition limitations. Do not claim that faster
completion proves Knowledge alone improved the artwork.

## Deterministic verification and unresolved test evidence

Before the live run: Props 288, Core 283, Factory 302, Render 269 and Preset 213 tests
passed on their recorded owner sources; Office 8, Sim 33 and FieldScope 6 direct
consumer tests passed. Final full AI suite: 640 passed; Knowledge/query/persistence
consumers: 48 passed. Retained mapper: 24; reducer: 10. Types/naming passed; scoped
lint has zero errors and one existing console warning. Frozen browser suite:
19 passed / one optional saved-export case skipped because E2E_EXPORT_DOCUMENT was
not provided. Shared masks/source/reset/detach, peer collaboration, history and
save/reload are not the skipped case.

Exact-source Inspector proof: 47 obligations, 11 expected-negative checks and
recovery passed, mapping revision 34. Source:
`f9ded3b6d71d87a83394b52954f57587a4e221cae19831f9cd39da344a7fb713`.
These deterministic checks and the live behavior are different evidence classes.

Historical failures are not erased by later passes: a browser navigation interruption,
an angular missing-selection failure and an interrupted-after-write Redo digest
mismatch were not conclusively explained. Frozen/repeated scenarios later pass;
that does not prove those intermittent roots were fixed. Existing failure traces
and full before/after documents remain in `tmp/shared-property-*` artifacts.
No timeout relaxation or new Undo controller hides them.

## Evidence locations

All paths below are relative to this worktree:

- Raw run, final/reload captures, recording and checkpoint:
  `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792446670972/`.
- `analysis.json`: derived interval/byte/call metrics.
- `generation-analysis.json`: exact recorded outer-call inputs/outputs and stream audit.
- `preserved-provider/`: JSONL and referenced payload archive.
- `recording.webm`: 32,240,817 bytes, first/changed/final fit and post-completion tail.
- Final drawing: `final.png`; fresh-load drawing: `reload.png`.
- Used reference 0: `apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/reference-0.jpg`.
  Restricted to broad massing/base/silhouette; construction equipment explicitly excluded.
- Used reference 1: same directory, `reference-1.jpg`.
  Restricted to ornament shape/material; not tower dimensions or full-building geometry.

Both images were decoded by the tool, but **the main agent** selected their visual
suitability and limits. Tool `validity=decoded` is not a visual-quality approval.

## Final disposition

The requested implementation sequence and single recorded acceptance are complete
locally, with the limitations above. No further production edits are made from this
report. Priority follow-ups, if authorized, are the registered identity-to-anchor
binding gap, preserving material-coordinate intent across local repair/extension,
and compact retained discovery/review handoffs. These are distinct owners; avoid
another undifferentiated architecture rewrite or repeating live101 to diagnose them.
