# Evaluation-only 2,000 artifact limit and parts observation - 2026-10-23

Run: `knowledge-quality-knowledge-taipei-101-1792698079485`. One authorized real-provider run, no video and no retry.
Actual provider: `gpt-6-astra` / `medium`. Work budget 120 seconds; report budget
60 seconds. Runner exit 0; artwork outcome **partial**.

## Changes and verified scope

The existing evaluation-window, preparation-session and runner argument admissions
now accept the explicit test-only 2,000 override instead of 5,000. The production
10,000 limit, partition algorithm, main workflow and result-status semantics are
unchanged. Historical evidence remains unchanged. Current spec, Inspector and
Task 3 plan were reconciled and structurally admitted before implementation.

Two formal fail-first cases demonstrated the previous rejection of the new policy.
Passing gates: 69 budget/repair/discovery cases, 45 browser transport/projection
cases, one native-delivery case, 18 capture/protocol cases, 62 source-bound Inspector
cases, 15 naming cases and ten Inspector/catalog checks. Production types passed;
scoped lint has zero errors and two existing console warnings. Inspector attempt
`fb5b44a1-33de-4917-867e-43292cb93e89` was accepted. All 841 runtime files matched
before and after observation. The runner separately verified unchanged run sources.

The deterministic 13,095-object preserved source still recovers through the actual
returned parts at 2,000, without geometry resubmission, a second root or replay of
acknowledged changes. Tests compare geometry, materials and order, exercise partial
failure then remaining-only recovery, and preserve cancellation, foreign/stale
source and lost-acknowledgement protections. This is tool evidence, not proof that
the model will choose the continuation.

## Tool correctness and actual model behavior

| Boundary | Confirmed observation | Limit |
| --- | --- | --- |
| Delivery | Actual selected usage contains `Per artifact: 2000 expanded objects` | This is per artifact, not whole document |
| Application | One submission, 69 projected faces plus root; 70 objects acknowledged and saved | No surface-grid or pattern in this submission |
| Overflow | No submission exceeded 2,000 | No live capacity rejection or recoveryInvocation |
| Recovery/no replay | Only one apply occurred, with no duplicate geometry submission | Live failure recovery remains unexercised |
| First content | 73.930 s; screenshot visibly contains the building massing | First-frame presence is distinct from final design quality |
| Visual check | Tool successfully recorded the model's material **fail** | Tool success did not imply artwork acceptance |
| Cutoff | Work stopped at 120.003 s; interruption acknowledged at 120.010 s | Only report_outcome/no-change after cutoff, at 133.338 s |
| Report | Native report returned at 133.315 s; text/image capture completed at 133.786 s | Saved text exactly matches raw report; self-report remains attributed |
| Reload | Fresh-context root/order and durable receipt matched; sequence 4 | Not an all-properties reload equivalence proof |
| Evidence | Four contiguous streams; 46 payload/asset references verified by size/hash; two exact tool images | Native hidden transformations or private reasoning are not inferred |

The AI accurately reported 70 editable objects, missing facade/window/ornament
work and a failed material judgment. Its claim of an initial image-forwarding
argument error is a **model self-report**, not independently established by the
saved App tool replies. Those replies acknowledge successful drawing and image
capture, and a subsequent read-only review obtained another image. There was no
second drawing submission. Do not turn the model's stated forwarding error or
latency explanation into a confirmed owner root cause.

The model used a single sparse massing submission. There is no evidence that it
would have exceeded the budget under a different limit; the reduced complexity
cannot be causally attributed to 2,000 from this one uncontrolled observation.
No further model run was made to force a favorable case.

## Timing from Send

| Interval (s) | Duration (s) | Observed boundary |
| --- | ---: | --- |
| 0–16.901 | 16.901 | Startup to first App tool dispatch |
| 16.901–42.598 | 25.697 | Four Knowledge/discovery calls and intervening intervals |
| 42.598–72.927 | 30.329 | Final preparatory reply to drawing submission; no intervening App tool |
| 72.927–73.218 | 0.291 | Preparation/application and image capture |
| 73.218–73.930 | 0.712 | First-content observer and screenshot |
| 73.930–89.259 | 15.329 | Interval before criteria/review calls |
| 89.259–89.305 | 0.046 | Define criteria and obtain/bind visual evidence |
| 89.305–97.653 | 8.348 | Interval before authored visual verdict |
| 97.653–97.662 | 0.009 | Record material fail |
| 97.662–120.003 | 22.341 | No further App tool invocation before cutoff |
| 120.003–120.011 | 0.008 | Stop, interruption acknowledgement and report dispatch |
| 120.011–133.315 | 13.304 | Report-only native turn |
| 133.315–133.786 | 0.471 | Runtime/UI settlement and report text/image capture |
| 133.786–135.003 | 1.217 | Final capture, persistence, checkpoint, fresh-context reload and cleanup |

Eight outer App tool spans total **0.400 s**, including nested application/image
work. The intervals between them are not independently proven thinking, encoding
or provider-stall time. First content is **7.765 s later** than the prior 5,000 run
(66.165 s). Different output and decisions prevent causal comparison. Fewer calls
and fewer objects are not evidence that this experiment improved latency or quality.

## Complete App input/output timeline

Saved App-boundary JSON bytes, not token counts or total native-model wire bytes:

| Start (s) | End (s) | Tool duration (s) | Tool | Input bytes | Output bytes |
| ---: | ---: | ---: | --- | ---: | ---: |
| 16.901 | 16.909 | 0.009 | `discover_knowledge` | 43 | 9,596 |
| 25.305 | 25.307 | 0.002 | `read_knowledge` | 87 | 2,671 |
| 32.476 | 32.519 | 0.043 | `describe_design_apis` | 144 | 18,867 |
| 42.597 | 42.598 | 0.001 | `read_knowledge` | 104 | 22,742 |
| 72.927 | 73.218 | 0.291 | `prepare_and_apply_design` | 17,435 | 5,123 |
| 89.259 | 89.263 | 0.004 | `define_design_criteria` | 598 | 201 |
| 89.264 | 89.305 | 0.041 | `review_drawing` | 149 | 2,588 |
| 97.653 | 97.662 | 0.009 | `review_drawing` | 818 | 2,293 |

## Capacity continuation versus rejection

The current implementation exposes a real semantic gap. In
`server/local-design-workflow.ts`, preparation's DESIGN_BUDGET_EXCEEDED response
can already contain safe retained-source partitions. The main tool adds an actual
executable recoveryInvocation but preserves `available:false` and the failed
preparation step. `server/local-tool-invocation.ts` therefore classifies it as
failed/not-started even when the retained source is suitable for continued work.
This fact comes from implementation and deterministic tests; this live run did not
exercise that response.

A bounded next change should make supported capacity partitioning ordinary progress:

| Situation | Intended contract |
| --- | --- |
| Valid source with a safe partition plan | Prepare a bounded first artifact and publish actual continuation references; capacity alone is not rejection |
| Ready-to-draw main tool | Reuse existing ordered parts and preparation/application owners to consume bounded artifacts, reporting real progress; do not ask the AI to recreate geometry |
| More work after acknowledged progress | Return actual completed receipts plus only confirmed remaining source references; distinguish more-work from whole-request completion |
| Cancellation, expiry or failure after writes | Preserve acknowledged work and continue only safe remaining work; do not blindly replay |
| Invalid geometry, forbidden action or unsafe/unavailable partition | Retain explicit rejection with the concrete cause; do not label unsupported splitting as successful continuation |

This is not a status rename: the first returned part must be usable, continuation
must preserve geometry/material/order/parent relationships, and a normal continuation
must not be mislabeled as whole-task completion. Reuse retained draft/repair, parts,
owner receipts and existing cancellation; no second scheduler or state store.

Use a fixed preserved over-budget source for formal verification, including an
interrupted later part and duplicate continuation. Require real first-part effects,
remaining-only continuation, no resend and no replay. This provides a deterministic
DoD instead of lowering the test limit repeatedly until a model happens to overflow.
Result semantics were intentionally not changed during this single budget experiment.

## Evidence

Project-local directory: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792698079485/`.
`run.json`, `source-snapshot.json.gz`, `checkpoint.json`, `preserved-provider/`,
`execution-analysis.json`, `verification.json`, `self-report.txt`, `self-report.png`,
`first.png`, `final.png`, `reload.png` and `services-cleanup.json` are preserved.

Drawing record: `5757014d-4c40-4b9f-ab80-6d88e8da9dab.jsonl`. Runtime record: `e98ac1a9-17a4-413c-b0b1-6bc6cb5b65bb.jsonl`.
All four screenshots were inspected. All three owned services were stopped.
No second run, push, reviewer model, goal or automation was started.
