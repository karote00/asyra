# Attachment-to-reference handoff - bounded 101 observation

## Scope and interpretation

One authorized live observation, no video, 120 seconds of drawing work and at
most 60 seconds of reporting; production 10,000-node limit. The objective is to
understand pre-drawing variability, not to rank first-frame speed. No product
source changes, retry, CI inspection or push occurred during this observation.
Previous implementation and local closure remain in Task 3 of the active plan.

- Run: `knowledge-quality-knowledge-taipei-101-1792933490279`.
- Source request: `78243e17-cb5b-4dd4-bd82-0bcaec72553a`.
- Native drawing record: `4770f801-1462-4268-972b-050c1b7ebc9e`.
- Actual model/effort: `gpt-6-astra` / `medium`, verified in the original record.
- Source capture and end-of-run verification agree on
  `e5dc49acdba3c0128581dad36708f98fe716ed1c7a25db767cda41b2ea1e4ace`.
- Base URL: `http://localhost:3307`, isolated document and initially empty tool library.
- Command: `node apps/asyra-design/test-data/knowledge-evaluation/run-101.mjs quality-knowledge --deadline-ms=120000`.
- Visual scope: this single maintained 101 scenario; 1920 by 1080 viewport.
- Result: partial drawing, 1,719 editable elements, one applied composition.
  The tower, crown, spire and ornament are not complete. This is not quality acceptance.

## Timeline from Send

| Time | Event and evidence |
| --- | --- |
| 0.418-0.420 s | Existing image owner registers both attachment identities; measured execution 1.347 ms. No decoding or reference selection occurred. |
| 12.042-12.048 s | Scoped Knowledge catalog lookup. |
| 16.384-16.387 s | Read only the thin architectural-illustration parent. |
| 23.672-23.726 s | Main tool draft usage, projected-face/surface-grid/pattern and optional plan. |
| 28.285-28.287 s | Continue the same main-tool contract; no scope change or refresh. |
| 32.621-32.623 s | Read material-method child and its mandatory dependency closure. |
| 32.623-66.763 s | No new App tool call; the next submitted drawing input is 4,236 bytes. This 34.140-second interval is not measured pure reasoning or JSON generation time. |
| 66.763-67.992 s | Main tool prepares, applies 1,719 elements, mechanically reviews and captures an overview. No preparation rejection. |
| **68.003 s** | **First visible frame**, confirmed by observer and first.png; reported as a timestamp, not a success threshold. |
| 71.304-75.847 s | Review usage query followed by bind-scope usage. |
| 82.500-82.513 s | Bind the detail criterion to delivered inspection evidence. |
| 88.142-88.154 s | Record a failed visual detail judgment. The record operation succeeds; the visual criterion remains failed. |
| 88.154-120.003 s | No additional App tool call or canvas mutation. A public agent-message item spans 97.054-100.433 s; internal computation is not observable. |
| 120.003 s | Work cutoff; interrupt acknowledged at 120.014 s. |
| 120.015-137.124 s | Same-thread report-only phase, approximately 17.109 s; no App operations. |
| 138.177 s | Report text/screenshot captured and UI settled. |
| 138.288-139.832 s | Checkpoint export and fresh-context reload; root/order and durable receipt match. |
| 140.086 s | Browser cleanup completed. Owned services subsequently stopped with verified PID/cwd. |

All ten complete outer tool calls:

| Start-end from Send | Tool | Tool wall time | Input / output bytes |
| --- | --- | ---: | ---: |
| 12.042-12.048 | `discover_knowledge` | 6.464 ms | 87 / 5,752 |
| 16.384-16.387 | `read_knowledge` | 3.014 ms | 87 / 2,518 |
| 23.672-23.726 | `describe_design_apis` | 53.392 ms | 170 / 23,072 |
| 28.285-28.287 | `describe_design_apis` | 1.698 ms | 279 / 4,604 |
| 32.621-32.623 | `read_knowledge` | 2.042 ms | 104 / 21,851 |
| 66.763-67.992 | `prepare_and_apply_design` | 1229.505 ms | 4,236 / 2,023 |
| 71.304-71.305 | `describe_design_apis` | 1.538 ms | 43 / 2,175 |
| 75.843-75.847 | `describe_design_apis` | 4.368 ms | 77 / 8,900 |
| 82.500-82.513 | `review_drawing` | 12.447 ms | 129 / 1,811 |
| 88.142-88.154 | `review_drawing` | 11.429 ms | 844 / 3,309 |

Total outer tool wall time is 1,325.896 ms. This must not be subtracted and
labelled entirely as model thinking: native delivery, inference, scheduling and
unobserved parameter generation are not individually measured. Pre-drawing calls
are five calls, 727 input bytes and 57,797 output bytes. All ten calls total 6,056
input bytes and 76,015 output bytes. These are App tool traffic, not model-context
size or independent token totals.

## Tool handoff and actual behavior

| Question | Confirmed evidence | Limit |
| --- | --- | --- |
| Initial attachment handoff | Both initial metadata referenceIds exactly match SHA-256 of the two retained original JPEG assets. No caller validation is asserted. | Metadata is not an AI suitability decision. |
| Mechanical prerequisite | No validate_reference_images query/call, select_design_references call or image decode was needed before the first write. | The run never consumed explicit reference-use receipts; automatic on-use preparation and its failure recovery remain locally verified, not newly exercised live. |
| Source purpose | Submitted brief restricts aerial image to broad massing and close-up to ornament; intermediate dimensions are explicit estimates. | Sources are descriptive strings in the draft brief, not newly recorded factual-use receipts. |
| Execution truthfulness | Preparation/application/capture succeed; visual detail is explicitly failed for mechanical repeated glints and missing upper structure. | Successful recording is not a visual pass. |
| Stop behavior | Last actual application completes at 67.920 s. No action_started or tool_started occurs after the 120-second cutoff. | No mid-write cancellation occurred in this run. |
| Persistence and pixels | Four original records parse complete. Checkpoint and fresh reload retain root/order and sequence 55/55. First/final/reload screenshots visibly retain the same lower building. | This is not an exhaustive canonical property comparison or proof of finished Taipei 101 geometry. |

## Variability, evidence and inference

The prior retained run `1792929336384` used the same two references, but a
10-minute work budget and an earlier implementation. It is a diagnostic example
of different selection paths, not a matched speed or stability control.

| Decision | Prior retained path | Current path | Interpretation |
| --- | --- | --- | --- |
| Initial Knowledge selection | Parent, material method and repetition selected together; two-page result. | Thin parent first, then material method with six unique dependency documents. | Selection order and optional scope differ before drawing. No need to force identical design choices. |
| Material review guidance | Additional material-review child read before first draft. | No material-review child read in this window. | Different review-preparation scope; absence alone is not a defect. |
| Main contract | Face/grid with plan. | Face/grid/pattern with plan; two pages. | Pattern was available but not used in the submitted lower-building draft. It may have been preparation for later tiers; do not label non-adoption as a bug. |
| Attachment preparation | Usage/full lookup followed by independent validation of both retained images. | Initial owner identities; no independent validation. | The new deterministic handoff was delivered. Avoided live calls are observed, but their absence does not establish why the model chose this sequence. |
| Repeated dependency body | Some prior reads explicitly used reuseFrom. | Second read omits reuseFrom and repeats the 1,964-byte parent body, same source revision 18. | Concrete duplicate delivery. Total pre-drawing information still depends on read grouping/order and reuse selection. Its latency contribution is not established. |

Current submission actually uses projected faces, face-referenced grids, a shared
window motif and shared fill templates. Material advice is relevant to the glazing,
metal and directional-lighting choices; these correspondences do not prove which
text caused each choice. The subsequent model judgment correctly reports that
repeated per-window glints do not establish realistic material. Knowledge was
read, but no blanket adoption or quality-improvement claim follows.

The strongest supported conclusion is bounded: attachment identity preparation is
now App-owned and occurred once without a decoding gate. Other front-loaded
selection still varies with the intended first part, optional capability scope,
Knowledge dependency closure and read reuse. The repeated parent body is an actual
resource duplicate; the unused pattern contract is only an unconsumed selection
within a truncated run. One run cannot establish variance, stability or a single
root cause for historical differences. No additional issue is implemented here.

## Self-report versus observed evidence

The model reports 1,719 editable elements, incomplete upper tower/ornament,
failed realistic-material detail, no observed tool-batch failure and unknown
causal timing. Those statements agree with the operation receipts and partial
canvas. Its suggestion that visual-review round trips may delay first frame is
not established: both review calls occurred after first visible content. The
model did not have the later persistence capture; its lack-of-evidence statement
must not be converted into a save failure. Later capture independently verifies
55/55 and matching reload roots/order.

## Evidence

All artifacts are under
`tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792933490279/`:

- `run.json`, `checkpoint.json`, `source-snapshot.json.gz`.
- `preserved-provider/`: byte-identical original events, payloads, manifests and
  image assets; 63 copied files, 55 referenced payload/asset hashes verified,
  no missing/mismatching references; three image assets (two inputs, one capture).
- `runtime-record-validation.json`: four complete original records, no parser issues.
- `generation-analysis.json`: derived index of original input/output and event times.
- `evidence-integrity.json`: copy and payload integrity results.
- `self-report.txt`, `self-report.png`, `first.png`, `final.png`, `reload.png`.
- `service-cleanup.json`: verified process ownership and cleanup receipts.

Screenshots were inspected directly. The first/final view has a selected root
outline; reload has selection cleared and a different fitted placement. Both
show the same base/lower structure and repeated glazing. No finished-render
acceptance is claimed. The app-visual-review-sync skill was used with this
explicitly bounded scenario; no broader visual suite or model rerun was added.
