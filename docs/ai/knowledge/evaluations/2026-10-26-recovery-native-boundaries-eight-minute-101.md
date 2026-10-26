# Retained geometry recovery and native boundary observation

## Scope and result

This report closes two verified handoff defects and records one authorized live
observation. It does not close the unresolved causes of broad prework selection or
long upstream intervals. Historical evidence and reports remain unchanged.

- Run: `knowledge-quality-knowledge-taipei-101-1793007650398`.
- Work: 480 seconds; separate report allowance: at most 60 seconds; no video.
- Actual provider: `gpt-6-astra`, `medium`; production expanded-node limit 10,000.
- HEAD: `a669266a1570010454a58223b6aa737400b4a657`, with preserved and newly validated
  uncommitted changes. The runner's source verification passed with digest
  `527856524e94c41ea37c266a0882ab21d106fb00cad2895429bd1e6b3c51c8bf`.
- **First frame: 136.589 seconds after Send.** The screenshot contains two adjacent
  editable building sections. Final drawing outcome: partial, not accepted.
- Work interruption observed at 480.011 seconds; report received at 499.783
  seconds. No App tool call was observed after the work cutoff.

Evidence directory: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1793007650398/`.
The principal original record is
`preserved-provider/68dd6c0a-a327-4f40-9d14-a95a30c0522b.jsonl`.
`generation-analysis.json` is derived; relevant conclusions were checked against
the original records and hash-verified payloads. Times below include the provider's
0.458-second offset from Send.

## Root-cause review before implementation

The baseline is run `1793002315768`, as documented in
[the unchanged investigation](2026-10-26-prework-gap-material-followup.md).

| Concern | Confirmed evidence and counterevidence | Disposition |
| --- | --- | --- |
| Large prework delivery | Full queries were explicitly requested; page ranges did not overlap. The full and partial-output schemas are independently executable validators. Their repeated structure is not proof of accidental repeated retrieval. Existing selected capture/bind/record usage remains available. | No query override, Knowledge removal, cross-schema substitution or forced tool choice. The cause of the broad selection remains unconfirmed. |
| Missing 44.53-second interval | Exact-process native diagnostics contain a pending custom output item at 76.861 s, dispatch at 121.384 s and host completion at 122.767 s. The public App stream had no corresponding pending event or intervening chunks; the recording sink reported no failures. | Confirmed observation-boundary gap. Add a read-only, post-run diagnostic supplement. Argument progress and the cause of waiting remain unavailable. |
| Material repair followed by geometry rejection | Earlier material corrections remained on their four elements and were reused. The later independent crown draft had truly nonplanar faces: maximum deviation 4.761041 world cm, existing tolerance 0.000010608487 cm. The rejection preceded mutation. | Keep the geometry guard. Fix the missing source path, measured facts and executable retained-repair handoff. Earlier material work was not discarded by this rejection. |

The review rejected the earlier suggestion to deduplicate full/partial schema
branches through cross-schema references: that would change independent consumer
contracts without establishing the selection cause. It also rejected treating the
nonplanar input as numerical noise, silently correcting geometry, or claiming the
native logs reveal generation speed or network waiting.

## Changes and self-review corrections

| Owner | Implemented change | Preserved behavior |
| --- | --- | --- |
| Construction and preparation | Nonplanar projected faces return `geometryIssue` with the existing source JSON Pointer, key, maximum deviation and unchanged tolerance. Direct faces and pattern faces/members retain their actual source paths. The retained draft supplies an explicit repair template. | Real invalid geometry remains rejected before mutation. No automatic geometry change, tolerance increase, new cache or inferred ID-to-index mapping. Existing degeneracy handling remains intact. |
| Main workflow | Preparation failure completes the repair route with `prepare_and_apply_design` and the original non-draft options, including parent and workflow policies. The caller supplies only corrected replacement values. | Standalone preparation remains legal. No resend of the whole draft or replay of earlier completed steps. Invalid, expired and cancelled repair retain their existing guards. |
| Evaluation capture and analysis | Once after work, read the native diagnostic database without writes. Match exact thread, unique process and time window; preserve selected boundary metadata, source row IDs and body hashes. Verify the saved supplement's digest before timeline analysis. | Public events remain separately attributable. Missing, ambiguous or unsupported evidence stays unavailable. No private text capture, runtime polling, synthetic status or invented completion pairing. |

Self-review found and corrected an incomplete handoff: preparation alone could not
preserve the main workflow's original parent and options. A failing regression was
added before the compose-owner correction. Review also tightened fractional time
window matching in native extraction. Neither correction widened the product scope.

Geometry reporting remains fail-fast and applies to the affected projected-face
path; this is not a claim that every geometry validator now reports every defect
at once. Native diagnostic formats are version-sensitive supplemental evidence,
not a guaranteed public parameter-progress API.

## Local verification and fixed DoD

Contracts were updated and admitted before production changes. Inspector revision
141 verification `7e125d9a-1f6d-412f-a50f-18ed46380375` passed 81 mapped cases on
captured source `a6efb925a143b054d9ddc691de069e9b96f77cb302564318e9c8ebb26d523779`.

| Fixed requirement | Formal result | Live observation |
| --- | --- | --- |
| Reproduce the real rejected input | Permanent fixture extracted from the hash-verified original provider input; regression failed before implementation. No ignored evidence directory is needed by the test. | No nonplanar rejection occurred in the new run. |
| Repair through the actual returned route | Actual preparation, dispatcher and main workflow execute the returned template after corrected field values are supplied; direct and pattern source locations are checked. | AI use of this new repair template was not observed. |
| Preserve parent, policies and prior work | Tests verify caller-owned options and expired/cancelled repair. Real Core integration preserves 4,114 prior entries through rejection and repair. | Existing drawing and later additions remained present; this does not exercise the new rejection path. |
| Undo/Redo and save/reload | Real integration checks prior entries and properties, new repair, Undo/Redo and saved reload. | Root order and durable receipt matched in a new browser context. The live oracle is not a full property-by-property comparison. |
| Restore native pending/dispatch/completion boundaries | Real SQLite extraction, read-only database hash, process/thread/window isolation, unsupported/missing/ambiguous input and digest tampering are covered. Actual recorder-to-analysis integration preserves first-content timing. | 96 native boundaries collected, 58,636 bytes, 33 ms after browser cleanup. Argument progress and wait cause remain unavailable. |
| Preserve partial evidence honestly | Partial provider spans and capture failures remain explicit; no temporal guess pairs unidentified starts with completions. | Main stream has an interrupted reasoning span at the deadline. It is retained as incomplete, despite successful report publication. |

Direct suites: 256 unique tests (108 workflow, 42 local tools, 29 prepared delivery,
60 pattern, 17 draft repair). Existing evidence gate: 58 Node tests, 29 browser
adapter tests and 19 batch tests. Production types, naming, runtime/service builds
and scoped lint passed; lint retained four existing console warnings.

A filtered workflow run passed the three selected cases but failed its suite-wide
advertised-tool coverage hook. The full 108-case suite subsequently passed without
weakening that hook. Inspector candidate failures caused by isolated fixture
capture and source changes between capture/review were resolved before admission;
they were not reclassified as passing results. No CI inspection or extra model run.

## Live timeline

| Seconds after Send | Duration | Recorded activity or result |
| --- | ---: | --- |
| 0.000-18.645 | 18.645 s | Startup, public message and native activity before the first App lookup. |
| 18.645-26.514 | 7.869 s | Topic catalog and two contiguous Knowledge pages. |
| 30.571-33.480 | 2.909 s | Two contiguous pages of selected drawing usage. |
| 39.676-47.984 | 8.308 s | Full review/reference/facts query first page, then reference usage and fields. |
| 47.984-70.617 | 22.633 s | Public summary and message events; at 66.227 s the summary says "Sketching architectural tiers". No drawing submission yet. |
| 74.586-77.055 | 2.469 s | Recorded research request for height and segment dimensions. No additional reference-image search was recorded. |
| 86.134 | Boundary | Native pending custom output item. Public summary completes at 86.136 s with "Optimizing coordinate calculations". |
| 86.136-135.059 | 48.923 s | No intervening event in the combined saved public/native timeline. Argument progress and waiting reason are not recorded. |
| 135.059 | Boundary | Native `exec` dispatch. Native dispatch metadata does not include an item ID that would independently pair it with the pending item. |
| 135.071-136.582 | 1.511 s | First drawing submission: 6,479 input bytes; two sections created. |
| **136.589** | **First frame** | **First visible content saved as `first.png`.** |
| 145.576-166.304 | 20.728 s | Capture usage, overview/detail images, material failure recorded. |
| 169.732-180.834 | 11.102 s | Context usage/field lookup and actual read. |
| 211.442-211.535 | 0.093 s | Add glass reflection geometry: 2,882 input bytes. |
| 215.598-226.146 | 10.548 s | Recapture and record a local representative material pass. |
| 226.146-300.160 | 74.014 s | Public/native activity exists within the interval; no App call. A remaining event-free subinterval is 256.211-300.139 s. |
| 300.160-309.121 | 8.961 s | Main drawing extension: 29,268 input bytes; two retained partitions, 9,411 and 3,399 elements. Both complete. No nonplanar rejection. |
| 320.717-361.429 | 40.712 s | Select reference uses, capture whole building, record overall/detail failures and a scale pass. |
| 365.158-383.116 | 17.958 s | Discover deletion route and delete one occluding top face by retained artifact key. |
| 412.323-412.524 | 0.201 s | Four images captured. Changed detail scope prevents binding; receipt is partial, with no judgments recorded. |
| 449.140-459.870 | 10.730 s | Query binding usage and rebind the same four images with explicit supersession. No redraw or repeated capture. |
| 473.703-473.719 | 0.016 s | Final record: overall/material pass, detail fail, scale stale; accepted remains false. |
| 480.011 | Boundary | Work turn interrupted by the deadline. Last drawing mutation was at 383.116 s. |
| 480.011-499.018 | 19.007 s | Separate reporting phase. |
| 499.783 | Boundary | Report text received; saved text and screenshot. |
| 499.997-509.366 | 9.369 s | Durable save evidence, checkpoint, context closure and fresh-context reload. |
| 509.870-509.903 | 0.033 s | Read-only native boundary supplement collected after work. |

Intervals are not an attribution of their whole duration to tool execution.
Public summaries are recorded descriptions, not measured internal work breakdowns.
The owner durations and event-free subintervals are stated separately. The native
supplement reveals a pending item; it does not supply events inside the silence.

## Prework acquisition and remaining uncertainty

| Group | Actual request/reply bytes | Calls | Observation |
| --- | ---: | ---: | --- |
| Knowledge | 38,948 | 3 | Same selected entry, materials method and repetition modules; logical content 31,030 bytes, nonoverlapping ranges 0-21,963 and 21,963-31,030. |
| Drawing usage | 30,012 | 2 | Logical content 27,423 bytes, nonoverlapping pages; draft with face/grid/pattern/vector and optional plan. |
| Review/reference/facts | 29,145 | 3 | Explicit full query requested 63,925 logical bytes, but only bytes 0-20,728 were fetched. It was abandoned for reference usage/fields; review capture usage was fetched later. |
| Total before first drawing | 98,105 | 8 | The eight App lookup owners took 65.301 ms in aggregate; wall time between calls is separately shown above. |

The old run transferred 134,135 bytes before drawing. This run transferred 36,030
fewer bytes because the queries taken differed, including abandonment of the full
result. This patch did not change discovery or Knowledge delivery. The lower byte
count does not establish complete acquisition of that abandoned full contract.
No `refresh` or repeated Knowledge page range occurred in the prework interval.

This preserves a concrete next investigation: why the ordinary review task starts
with full acquisition and then switches to purpose-scoped usage. The current
records establish the path and cost, not a single causal instruction that forced
it. No new change is authorized or implemented by this observation alone.

## Material, correction and acceptance behavior

The first material check failed because glass looked too flat. The next submission
added reflection geometry, followed by a representative-area pass. The later large
extension succeeded; it did not reject or roll back that material work.

Whole-building review subsequently found an occluding top face. One element was
deleted through the returned retained artifact selection. The next capture
succeeded for all four requested images but the detail check's scope had changed.
The tool explicitly returned `status: partial`, `settlement: partial`, retained
image IDs and supersession guidance. AI then used the same images in bind and
record calls. This is observed recovery without redoing successful captures or
drawing, not an observation of the new nonplanar-repair path.

Final visual coverage was 2/4: overall and representative material passed, detail
failed and scale was stale. Execution success on recording those judgments did
not mean visual acceptance. AI's report acknowledged simplified ornamentation and
insufficient podium detail. Overview screenshots were inspected, but are not an
independent high-zoom material/geometry acceptance test.

The report says there was no durable-save confirmation available to AI. The runner
subsequently obtained document generation 0 and durable sequence 480, and the fresh
context returned the same receipt and root order. Those are separate observations
at different times, not a reason to rewrite the report as successful acceptance.

## Evidence preservation and cleanup

- 905 original provider files preserved with byte hashes: 57,513,823 bytes.
- Nine provider streams: eight complete; the drawing stream retains one open
  reasoning span interrupted at cutoff. There are no unfinished outer App tool
  calls and no reported recording sink failures. Provider/report completion is
  not equivalent to complete work or a complete native span trace.
- 873 payload references verified in the drawing stream; nine delivered image
  occurrences restored from retained bytes, with hashes. Original payload redaction
  policy remains unchanged; preservation is not a claim of inaccessible private
  model state or absent parameter deltas.
- Public activities: 677, 195,572 bytes; measured serialization 62.972 ms, payload
  writes 497.630 ms aggregate, maximum queue delay 12.659 ms. These measurements
  do not identify the source of the long silent intervals.
- Native supplement: one exact thread/process, 96 boundaries, digest checked;
  58,636 bytes, 33 ms post-run collection. No runtime database polling.
- `first.png`, `final.png`, `reload.png`, `self-report.txt`, `self-report.png`,
  checkpoint, source snapshot and native supplement are saved.
- Browser process exit confirmed. Three owned service process groups stopped;
  ports 3307, 4117 and 4217 closed. The generic stop guard's original receipt says
  `failed` for explicit termination; it is preserved, not rewritten. Separate
  cleanup verification records zero errors and no remaining service identities.

The implementation DoD is locally verified. Live native boundary capture is
observed. Live adoption of the new nonplanar repair route is unobserved. The long
upstream wait and broad acquisition selection causes remain unresolved; neither is
reported as repaired by this work. No further model run, push or CI inspection was
performed.
