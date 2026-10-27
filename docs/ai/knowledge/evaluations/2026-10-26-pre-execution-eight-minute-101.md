# Pre-execution recovery and eight-minute 101 - 2026-10-26

## Outcome and scope

The bounded local fixes and direct-consumer gates passed. One authorized 101 ran with a 480-second work cap, 60-second report cap, no video, and the production 10,000-object per-artifact limit. It ended naturally at **410.319 seconds**, with **first visible content at 94.442 seconds**, and a partial final outcome. No second model run, CI check or push occurred.

The final review accepted the main agent's four submitted visual criteria; this does not contradict the separate partial report about insufficient verified realism and exact dimensions. It does not independently validate the image judgments. This run contained no ambiguous boundary references or invalid whole-criterion supersession, so those exact recovery routes remain formally verified locally, not live-exercised.

## Original 47.91–134.31 second gap

Baseline: `knowledge-quality-knowledge-taipei-101-1793017937929`, drawing record `54de5cda-8f11-405b-85fe-cd898c52ecea.jsonl`. Its provider clock starts 0.302 seconds after the App submission clock. The previous report omitted public activity inside the 86.40-second tool-call gap.

| App time (s) | Confirmed record | Limit |
| --- | --- | --- |
| 47.911–47.914 | Reference-purpose field lookup completed | No drawing invocation yet |
| 67.578–67.637 | Public summary: Designing world-building structure | Public summary, not detailed internal work |
| 67.638–70.824 | Agent announced a podium, base and two facade sections before extending upper levels | Shows a partial-first intent was already present |
| 70.824 | Native output item started | Arguments still unavailable |
| 134.293 | Native exec dispatch | Complete next request became executable |
| 134.314–134.339 | First App drawing invocation rejected before writes | Duplicate source identity described below |

The App was not spending 86 seconds executing this tool: its rejection took about 25 ms. The exact split between argument generation and upstream waiting is not in the available records. This work repairs the omitted report evidence and confirmed App handoffs; it does not claim the unresolved upstream delay is fixed.

## Boundary identity: exact failure and correction

The ambiguous names were source `key` values **podium-x** and **podium-y**, not display labels. Each appeared once on a projected face and again on its surface grid:

| Key | Face path | Colliding grid path | Intended reference |
| --- | --- | --- | --- |
| podium-x | /children/0/key | /children/3/key | grid.boundary.face = podium-x |
| podium-y | /children/1/key | /children/4/key | grid.boundary.face = podium-y |

A boundary is the four-vertex world-space face used to position and project a grid. A face key must identify one source node in its scope. Giving the grid the same key made the reference ambiguous. The early boundary resolver rejected ambiguity before the later compiler could produce its more actionable duplicate-key report. Rejecting an ambiguous reference before writing was valid; masking the exact conflicts and retained repair path was the handoff defect.

The existing resolver now collects conflict paths while constructing its existing index and uses the canonical key-conflict error. The existing retained draft repair reply includes draftId and field replacement instructions. It neither guesses which node to rename nor modifies geometry. The actual replay replaces only grid keys, leaves the referenced face identities intact, then validates and applies exactly once. Geometry, materials, order and references are compared against complete expected prepared entries. No extra registry, cache, state or preflight model exchange was added.

## Supersession preflight and recovery

Baseline run `1793014314889` captured images at 398.329 seconds, then tried unit-only supersedes on a whole criterion. A generic revision/reason rejection led to more invalid attempts; existing images were already available. Whole-criterion refresh and replacement of a declared regional unit are different operations.

The shared capture/bind/record schema and owner validator now reject whole-criterion supersedes before image work or recording. The rejection offers corrected arguments through the existing next route, preserving criterion and image identities; record recovery rebinds evidence before a fresh explicit judgment. Exact local-unit revision/reason, stale evidence, multi-scale coverage, unrelated passes and no-replay protections remain. The previous 1,000-character reason bound remains.

Formal integration executes returned capture, bind and record corrections through actual review/evidence owners. Invalid unrelated fields do not generate a misleading executable next step. No recapture or mutation is needed to recover an invalid whole-criterion bind/record.

## API audit and initial delivery

[The per-API inventory](2026-10-26-pre-execution-api-audit.md) lists 155 basic APIs and 26 other App actions. Runtime/AST enumeration and direct current-owner reads were used, not regex-based discovery. A registry-driven permanent suite checks all 181 App actions and 201 local entries; these sets overlap. Its 538 cases check actual invalid-input admission, declarations, exact usage, examples and execution routes. The owner suites add real state-changing behavior. Boundary validation alone is not asserted as full semantic coverage of every possible input.

Two further owner/schema mismatches were reproduced and corrected:

- Core computed reads already allow at most 64 fields with names up to 128 characters. App admission omitted those limits. The unchanged Core limits are now exported from its pure contracts entry and consumed by App schema, preserving full, empty and selected reads.
- Core patch schema accepted missing records even though the real Scene Tree owner requires the array. It now requires records, matching the already-correct App schema. Ordinary value patches use records:[]; updateElementProperties remains available. The owner was not weakened to accept an undocumented format.

Initial App guidance now explicitly permits a small editable visible part and subsequent adjustment. It removes the contradictory Knowledge-before-committing instruction. Readiness means valid inputs for that part, not settled materials or a complete plan. The actual delivered small-part example runs without criteria/research and is later edited through the real property owner. A final direct-consumer test additionally asserts these exact instructions in the actual thread/start packet produced by the provider adapter; the provider suite passed 227 cases (the conditional registration case had already passed separately). This test-only strengthening occurred after the live observation; product sources were not changed. The saved live payloads do not contain the full baseInstructions text, so live model comprehension is not inferred from that local proof. Final visual acceptance remains required. The unchanged 101 prompt explicitly requests specified Knowledge before designing, so this test does not exercise a zero-Knowledge workflow.

## Local verification and self-review

| Gate | Result |
| --- | --- |
| Focused audit, source repair, prompt and direct creation/review | 622 passed before subsequent strengthened record recovery coverage |
| Final App server harness | 2,332 passed; two conditional cases separately enabled below |
| Direct Core/non-Core App owners, basic actions, composition, transaction and runtime | 186 passed |
| Core scene tree, runtime and restore facades | 35 passed |
| Inspector source flow proof | 81 passed |
| Inspector contract tests | 2 passed |
| Installed native registration without inference | 1 passed |
| Large saved-document encoding/decoding | 1 passed; 183,494,794 bytes |
| Production types, Core build and App production build | Passed |
| Naming | 15 passed |
| Scoped ESLint | Zero errors; four existing measurement console warnings |
| Documentation update check and diff whitespace | Passed |

The first review found a 68-byte delivery-budget regression caused by added boundary prose. The wording was shortened while preserving identity constraints; fixed byte thresholds were not changed. Three stale consumer expectations were corrected to the actual current contract: mandatory records, selected usage's full parameter annotations, and invocation outcome outside a paged content body. The native test still executes the delivered batch, and the discovery test still checks partial coverage and settlement. No production fallback was introduced to satisfy tests.

## Live run chronology

Times below use the App submission origin. The provider starts 0.292 seconds later.

| App interval (s) | Activity | Evidence/result |
| --- | --- | --- |
| 0–7.558 | Request setup and first native exchanges | Model gpt-6-astra / medium |
| 7.558–25.027 | Seven Knowledge/tool reads | 87,128 combined input/output bytes; selected drawing usage takes two pages; an additional full multi-tool lookup is not fully consumed |
| 25.027–90.659 | Native composition before first drawing | Dimension summary at 30.28; exec completes at 61.94, 75.24 and 79.19; lexical/evaluation summaries at 65.02 and 78.74. Exact Code Mode error bodies are not preserved in App records |
| 90.659–94.425 | First prepare/apply | 12,668-byte input; 6,221 objects; successful owner receipt |
| **94.442** | **First visible frame** | **Podium, lower tower and two bamboo sections, confirmed in first.png** |
| 97.020–119.581 | Capture/judge representative region and record reference uses | Creation preceded visual review |
| 127.681–136.102 | Read-context contract and selected coordinate query | One namespace/argument-path follow-up |
| 157.473–157.569 | Add continuous reflections | Five new objects; existing geometry preserved |
| 157.571–181.680 | Changed local scope, recrop, rebind and judge | One partial reply; exact prior revision required. Overview retained; new detail crop added |
| 181.687–186.513 | Extend tower and crown | 7,016 objects, successful owner receipt |
| 197.151–235.438 | Read attachment coordinates and create ornaments/base detail | 25,786-byte creation input; 420 objects |
| 242.853–286.987 | Inspect, locate/delete obscuring/simplified surfaces and create layered crown | Two selected delete operations and 25 new objects |
| 299.798–329.412 | Review, extend reflections and adjust stacking | 15 new objects; relative hierarchy move returns confirmed changes |
| 340.617–391.412 | Fresh views, judgments, source facts and final check query | Final coverage 4/4; accepted main-agent judgments; no unresolved checks |
| 391.412–410.319 | Final report and UI settlement | Report acknowledges unverified exact scale/realism; partial outcome |
| 410.427–418.196 | Save checkpoint, fresh context reload and source verification | Durable sequence 441/441; root/order match; sources unchanged |

The longest interval with no recorded event is 30.297–61.930 seconds (31.633 seconds); another is 205.678–234.799 seconds (29.121 seconds). Both have unknown causes. Public activity and host boundaries are included; missing detailed progress is explicitly missing.

## Live correctness versus agent behavior

| Item | Tool evidence | Agent behavior / limit |
| --- | --- | --- |
| Boundary keys | First input is valid; all creation calls succeed | Uses distinct keys and explicit corner boundaries. Ambiguous face-reference recovery not exercised |
| Whole-criterion supersedes | No invalid whole-criterion submission | New exact correction path not live exercised |
| Regional supersedes | Partial response at 157.679 preserves images and demands revision 2 plus reason | Agent changes an unsuitable crop, then binds retained overview plus new detail; no drawing replay |
| First editable content | Created before visual checking; later creation, deletion and stacking are acknowledged | First frame 94.442 s. It still prepares a detailed 6,221-object initial part |
| Status honesty | 43 successful App calls, one partial, no failed/unknown App call | App success does not validate model-authored Code Mode programs or aesthetics |
| Final verification | Four current visual judgments accepted; saved document and reload receipt agree | Main agent subsequently reports partial realism/exact-scale confidence; independent high-detail visual acceptance is not established |
| Remaining discovery cost | On-demand selected routes remain usable | Full multi-tool lookup, capture usage and read-context field follow-up remain; no claim that all query waste is eliminated |
| Native error account | Host invocation timestamps and public lexical/evaluation summaries are preserved | Scope/image parameter errors are model self-report only; exact arguments/error responses not available in the captured App boundary |

Knowledge content was unchanged. This run read the parent and materials-method child, applied a representative-region workflow and later extended it. That is observed use, not a controlled proof that Knowledge caused improved quality or timing.

## Resource and evidence accounting

- App calls: 44; total recorded input 86,290 bytes, output 241,768 bytes, excluding image bytes. Summed App tool execution 14.652 seconds.
- First drawing input: 12,668 bytes. Prior baseline first drawing was rejected for identity conflicts; this run's valid explicit-corner input did not exercise that rejection.
- Provider reported tokens: 2,595,065 input, including 2,497,152 cached; 16,423 output, including 2,993 reasoning output. These are request totals, not unique context size or a dollar estimate.
- Full request provider directory preserved: 26,077 files, 170,417,329 bytes, SHA-256 manifest. Provider record is complete with zero recording failures. Fifteen returned tool images were restored and hash checked.
- Source digest: c32d50158fd30c1d8a6a332965bc251327cce22e0a4c86f6281d7e2511e86c25. Source verification passed after the run.
- Checkpoint: 90,094,111 bytes; durable sequence 441 before and after reload. Reload oracle compares root order and durability, not every property. Local history/identity tests supply the separate bounded proof.
- All three agent-started services were identity checked and terminated; ports 3307/4117/4217 are released. Browser cleanup completed. No video was recorded.

Evidence directory: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1793022990110/`. Primary records are preserved-provider, run.json, checkpoint.json, source-snapshot.json.gz, self-report.txt, first.png, final.png and reload.png. generation-analysis.json and activity-analysis.json are derived from those records. See tool-image-evidence.json, preserved-provider-manifest.json and service-cleanup.json for bounded evidence receipts.

## Complete App tool timeline

The preceding gap column is the time since the previous App tool completed, not an attribution of that time to a single cause. Native activity inside those intervals is recorded separately above.

| # | App start–end (s) | Tool time (s) | Preceding gap (s) | Tool | Outcome | Input / output bytes |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 7.558–7.567 | 0.009 | 7.558 | discover_knowledge | success / completed | 87 / 5,752 |
| 1 | 7.569–7.571 | 0.002 | 0.002 | read_knowledge | success / completed | 87 / 2,518 |
| 2 | 14.528–14.583 | 0.054 | 6.958 | describe_design_apis | success / completed | 179 / 23,072 |
| 3 | 16.796–16.798 | 0.002 | 2.213 | describe_design_apis | success / completed | 288 / 6,477 |
| 4 | 18.848–18.850 | 0.002 | 2.049 | read_knowledge | success / completed | 104 / 21,851 |
| 5 | 22.650–22.656 | 0.006 | 3.800 | describe_design_apis | success / completed | 90 / 23,072 |
| 6 | 25.024–25.027 | 0.003 | 2.368 | describe_design_apis | success / completed | 68 / 3,483 |
| 7 | 90.659–94.425 | 3.766 | 65.632 | prepare_and_apply_design | success / completed | 12,668 / 1,609 |
| 8 | 97.020–97.026 | 0.005 | 2.595 | describe_design_apis | success / completed | 80 / 9,254 |
| 9 | 102.663–102.731 | 0.067 | 5.638 | review_drawing | success / completed | 193 / 2,993 |
| 10 | 119.539–119.553 | 0.014 | 16.809 | review_drawing | success / completed | 923 / 4,396 |
| 11 | 119.555–119.581 | 0.026 | 0.002 | select_design_references | success / completed | 833 / 2,556 |
| 12 | 127.681–127.684 | 0.004 | 8.100 | describe_design_apis | success / completed | 48 / 7,642 |
| 13 | 132.935–132.939 | 0.004 | 5.251 | describe_design_apis | success / completed | 91 / 7,000 |
| 14 | 136.088–136.102 | 0.014 | 3.149 | read_design_context | success / completed | 201 / 1,246 |
| 15 | 157.473–157.569 | 0.097 | 21.371 | prepare_and_apply_design | success / completed | 1,838 / 813 |
| 16 | 157.571–157.679 | 0.107 | 0.002 | review_drawing | partial / partial | 392 / 3,895 |
| 17 | 162.734–162.773 | 0.039 | 5.055 | review_drawing | success / completed | 371 / 3,127 |
| 18 | 169.101–169.110 | 0.009 | 6.328 | review_drawing | success / completed | 338 / 2,685 |
| 19 | 181.670–181.680 | 0.011 | 12.559 | review_drawing | success / completed | 1,433 / 6,618 |
| 20 | 181.687–186.513 | 4.826 | 0.007 | prepare_and_apply_design | success / completed | 10,134 / 819 |
| 21 | 197.151–197.161 | 0.011 | 10.638 | read_design_context | success / completed | 181 / 1,187 |
| 22 | 234.817–235.438 | 0.621 | 37.656 | prepare_and_apply_design | success / completed | 25,786 / 773 |
| 23 | 242.853–242.961 | 0.108 | 7.415 | review_drawing | success / completed | 1,059 / 5,954 |
| 24 | 250.505–250.512 | 0.007 | 7.544 | describe_design_apis | success / completed | 42 / 4,667 |
| 25 | 270.015–270.024 | 0.010 | 19.503 | review_drawing | success / completed | 3,254 / 8,101 |
| 26 | 270.027–270.055 | 0.028 | 0.003 | read_design_context | success / completed | 202 / 1,333 |
| 27 | 270.057–270.075 | 0.019 | 0.001 | read_design_context | success / completed | 202 / 1,079 |
| 28 | 274.263–274.271 | 0.008 | 4.187 | describe_design_apis | success / completed | 56 / 13,005 |
| 29 | 286.417–286.909 | 0.492 | 12.147 | execute_design_batch | success / completed | 430 / 1,121 |
| 30 | 286.912–286.987 | 0.075 | 0.003 | prepare_and_apply_design | success / completed | 7,431 / 815 |
| 31 | 299.798–299.932 | 0.134 | 12.812 | review_drawing | success / completed | 614 / 4,085 |
| 32 | 313.122–313.128 | 0.006 | 13.190 | review_drawing | success / completed | 1,515 / 5,136 |
| 33 | 315.668–315.674 | 0.006 | 2.540 | describe_design_apis | success / completed | 64 / 13,280 |
| 34 | 327.181–327.292 | 0.111 | 11.507 | prepare_and_apply_design | success / completed | 2,288 / 815 |
| 35 | 327.293–329.412 | 2.119 | 0.001 | execute_design_batch | success / completed | 373 / 734 |
| 36 | 340.617–340.883 | 0.267 | 11.205 | review_drawing | success / completed | 1,933 / 8,259 |
| 37 | 354.131–354.202 | 0.071 | 13.248 | review_drawing | success / completed | 1,415 / 5,576 |
| 38 | 354.205–354.343 | 0.138 | 0.003 | review_drawing | success / completed | 1,467 / 6,180 |
| 39 | 364.134–364.186 | 0.052 | 9.791 | review_drawing | success / completed | 908 / 5,851 |
| 40 | 368.985–368.987 | 0.003 | 4.798 | describe_design_apis | success / completed | 69 / 5,920 |
| 41 | 383.855–383.857 | 0.002 | 14.868 | record_design_facts | success / completed | 1,402 / 2,158 |
| 42 | 383.859–383.955 | 0.096 | 0.002 | review_drawing | success / completed | 5,151 / 4,665 |
| 43 | 390.206–391.412 | 1.206 | 6.251 | read_design_checks | success / completed | 2 / 196 |
