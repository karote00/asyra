# Evaluation-only artifact budget and report capture - 2026-10-23

Run: `knowledge-quality-knowledge-taipei-101-1792696509071`. One authorized real-model run; no video, no automatic retry.
Actual provider: `gpt-6-astra`, reasoning effort `medium`. Work 120 seconds;
independent report maximum 60 seconds. Runner exit 0; artwork outcome **partial**.

## Outcome

| Boundary | Observed result | Limit |
| --- | --- | --- |
| Test policy | Explicit request-local 5,000; production remains 10,000 | Same effective limit delivered in usage, preparation and retained partition planner |
| Drawing applications | Two complete owner receipts: 2,629 and 2,495 objects | Each artifact is below 5,000; total document count is not this budget |
| Retained-source recovery | No live overflow, repair or recoveryInvocation | Live model adoption of recovery is untested in this run |
| Duplicate writes | Exactly two applications, two roots, saved subtree sizes 2,629 and 2,495 | This verifies this execution; failure recovery is covered by deterministic tests |
| Work cutoff | Work stopped at 120.002 s; interruption acknowledged at 120.008 s | No drawing action after cutoff; only terminal report_outcome/no-change at 135.538 s |
| Report capture | Host-admitted text and screenshot complete; saved text exactly matches native report | Captured claims remain model-authored statements, not acceptance |
| Persistence/reload | Durable sequence 163; fresh context roots/order and receipt match | Not a full property-by-property reload oracle |
| Evidence | 79 referenced payload/assets verified by size and SHA-256; five contiguous streams; two exact tool images restorable | No hidden reasoning or generation-versus-stall inference |

The report incorrectly treats 2,629 + 2,495 = 5,124 as exceeding the evaluation
limit. Actual delivered guidance says **per artifact**, and both artifacts are
legal. This is an observed report interpretation error, not evidence that admission
failed. It was not corrected or hidden in the saved report.

The report correctly states that two batches were applied, a first image existed,
material review failed, and whole-work acceptance was incomplete. It mentions
contract paging and phased preparation as possible delays, explicitly without
measurement. Raw events confirm paging and long pre-submission intervals, but do
not establish the model's internal reason for those intervals.

## Timing from Send

| Interval (s) | Duration (s) | Actual boundary |
| --- | ---: | --- |
| 0–9.106 | 9.106 | Startup through first App tool dispatch |
| 9.106–34.915 | 25.809 | Six Knowledge/discovery calls and intervening provider intervals |
| 34.915–64.488 | 29.573 | Last preparatory reply to first drawing submission; no intervening App tool |
| 64.488–66.139 | 1.651 | First preparation/application/check/capture tool |
| 66.139–66.165 | 0.026 | First-content observer; first frame at 66.165 s |
| 66.165–74.760 | 8.595 | Image review, binding and material-fail record, including intervening intervals |
| 74.760–102.527 | 27.767 | Review reply to second drawing submission; no intervening App tool |
| 102.527–104.137 | 1.610 | Second preparation/application/check/capture tool |
| 104.137–120.002 | 15.865 | Four follow-up discovery calls, then work cutoff |
| 120.002–120.008 | 0.006 | Native interruption acknowledgement |
| 120.008–135.522 | 15.514 | Report-only phase |
| 135.522–136.643 | 1.121 | Runtime/UI report settlement and text/image capture |
| 136.643–140.745 | 4.102 | Final capture, checkpoint, new-context reload, source verification and cleanup |

All 14 outer App tool spans total **3.363 s**. This total includes nested browser
work; do not add their inclusive spans again. The two no-App-call intervals before
submissions total **57.340 s**. These are observed intervals, not proven thinking
or provider-stall costs. First-frame latency was 66.165 s versus 55.978 s in the
previous run: 10.187 s later. Different model decisions/output prevent causal
attribution to the test budget. This run does not demonstrate a speed improvement.

## Complete App tool timeline

Times use the drawing stream start offset from Send, not mixed request clocks.
Bytes below are saved App boundary JSON, not token counts or all native-model wire bytes.

| Start (s) | End (s) | Tool duration (s) | Tool | Input bytes | Output bytes |
| ---: | ---: | ---: | --- | ---: | ---: |
| 9.106 | 9.112 | 0.006 | `discover_knowledge` | 43 | 9,596 |
| 16.277 | 16.281 | 0.004 | `read_knowledge` | 87 | 2,671 |
| 21.231 | 21.275 | 0.044 | `describe_design_apis` | 170 | 23,072 |
| 26.605 | 26.607 | 0.003 | `describe_design_apis` | 279 | 4,674 |
| 30.034 | 30.037 | 0.003 | `read_knowledge` | 104 | 22,742 |
| 34.912 | 34.915 | 0.003 | `describe_design_apis` | 43 | 11,566 |
| 64.488 | 66.139 | 1.651 | `prepare_and_apply_design` | 9,248 | 5,221 |
| 70.109 | 70.121 | 0.011 | `review_drawing` | 131 | 1,800 |
| 74.745 | 74.760 | 0.014 | `review_drawing` | 820 | 2,519 |
| 102.527 | 104.137 | 1.610 | `prepare_and_apply_design` | 50,346 | 4,718 |
| 107.646 | 107.648 | 0.002 | `describe_design_apis` | 70 | 18,025 |
| 112.959 | 112.965 | 0.006 | `describe_design_apis` | 26 | 5,097 |
| 115.871 | 115.875 | 0.004 | `describe_design_apis` | 64 | 23,072 |
| 119.146 | 119.148 | 0.002 | `describe_design_apis` | 74 | 2,218 |

First draft: 9,248 input bytes; 12 projected faces and eight surface grids. Second
draft: 50,346 bytes; 44 projected faces, eight surface grids and one pattern. Both
used ordinary draft submission. There was no rejected geometry to resend and no
parts recovery. The material review tool successfully recorded a **failed** visual
judgment; execution success did not turn that judgment into a pass.

## Implementation and deterministic verification

The existing evaluation window carries only an explicit 5,000 override; omission
preserves production 10,000 and unsupported values reject. The existing preparation
session owns request lifetime; the budget inspector, usage/schema descriptions and
retained-source planner receive that limit. No global mutation, new store, automatic
retry, ceiling increase, geometry simplification or model tool override was added.
Other guards, including source-work and path limits, remain unchanged.

Fail-first regression reproduced absent metadata propagation, ineffective rejection
at 5,001, and partitions still using 10,000. Final tests cover exact boundary,
production isolation, actual browser metadata and native discovery delivery,
13,095-object geometry/material/order equivalence, a single canonical recovery
root, remaining-only recovery after failure and rejection of duplicate application.
Existing cancellation, stale/foreign references and lost-acknowledgement protections
passed in the discovery integration suite.

Passed: 15 focused budget/repair cases; 54 discovery integration cases; 45 browser
transport/report projection cases; 18 capture/protocol cases; 62 source-bound
Inspector cases; 15 naming cases; 10 static Inspector/catalog cases. Existing
workflow 63, local tools 39 and compiler 52 cases also passed. The native transport
budget case passed with a scripted provider, without inference. Production types
passed. Scoped lint had zero errors and four existing console warnings. Inspector
attempt `4901f069-a15f-4c1a-83c6-48ed17518bf0` was accepted, and all 841 captured
runtime files matched before the run. The live runner independently verified
unchanged source during execution.

## Evidence

Project-local directory: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792696509071/`.
- `run.json`, `source-snapshot.json.gz`, `checkpoint.json`
- `preserved-provider/`: raw streams plus original payloads and image assets
- `execution-analysis.json`: derived full App input/output timeline, linked to raw records
- `verification.json`: evidence integrity, checkpoint counts and post-cutoff actions
- `self-report.txt`, `self-report.png`, `first.png`, `final.png`, `reload.png`
- `services-cleanup.json`: all three owned services stopped

Drawing record: `2cc2196b-8cc4-4fbe-9066-669d0a195c2a.jsonl`. Runtime record: `8f42fb98-166d-4cf0-b290-f8d161d8edc3.jsonl`.
Report source: `2cc2196b-8cc4-4fbe-9066-669d0a195c2a.payloads/74-output.json`. Historical evidence was not modified.
The screenshots were inspected. No production changes were made after starting
this model run. No second run, push, automation, goal or reviewer model was started.
