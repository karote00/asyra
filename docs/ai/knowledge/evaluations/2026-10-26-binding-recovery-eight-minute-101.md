# Review binding recovery - eight-minute 101

## Outcome

The bounded handoff fix is implemented and formally verified. This live run also
observed the intended recovery: the next request matched the returned template
except for the exact caller-owned reason requested by the owner. No contract
lookup, recapture or edit replay occurred between rejection and successful binding.
The illustration itself remained partially accepted at the work deadline.

- Run: knowledge-quality-knowledge-taipei-101-1793010611909
- Source HEAD: a669266a1570010454a58223b6aa737400b4a657; dirty source is preserved in source-snapshot.json.gz.
- Source verification after observation: aa15cd96aaa75e4d58de495cb0491881491ae5ea7d20e82e849d79c46bb1a0b0.
- Actual model: gpt-6-astra, medium. Work: 480 seconds. Report limit: 60 seconds.
- No video. Production expanded-object limit: 10,000. One live run only.
- First visible content: **98.810 seconds** after Send; first.png shows two tiers.
- UI settlement: partial at 500.396 seconds, including reporting.
- No edits, extra model runs, CI inspection or push after the test began.

## Confirmed defect and change

Historical run 1793007650398 captured four images but discarded declared selected
checks when binding failed. Recovery returned generic bindChecks guidance; the AI
then fetched 8,900 bytes of bind usage and rebuilt the selection. The defect was
in the capture-to-review handoff, not the need to validate changed image scopes.

The existing canonical review validator now carries all recoverable conflict
indices and current revisions. The same review handoff returns the ordered checks,
exact image assignments and reference uses. Only the explicit redesign reason is
left to the caller. The old catch-and-rebuild path that lost selection was removed.
There is no new result store, automatic scope acceptance, inferred reason or pass.
Capture plus failed binding remains partial; bind-only rejection remains
failed/not-started. A failed binding records no judgments.

## Formal verification and self-review

| Verification                              | Result                                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test-first reproduction                   | The saved-input integration and owner/proof regressions failed before implementation because recovery lacked per-check templates and exact missing fields.                                                                                                                             |
| Owner and proof suite                     | 396 passing cases across four files.                                                                                                                                                                                                                                                   |
| Direct consumers                          | 131 passing cases across five files, including workflow, actual Core/dispatcher review usage, references, image delivery and correction.                                                                                                                                               |
| Final changed integration/reference cases | 12 passing cases.                                                                                                                                                                                                                                                                      |
| Inspector                                 | Admission completed before production implementation; final candidate 80db7d81-1057-4730-8a79-2a40b8808715 and accepted revision 143 verify 8127057a-d3cc-4d7c-8af6-21a4f5558868 passed all 81 mapped cases.                                                                           |
| Other gates                               | Production types, naming and diff check passed. Scoped lint: zero errors, one existing proof console warning.                                                                                                                                                                          |
| Preserved protections                     | Multiple conflicts, independent passes, exact source uses, stale versions, expired evidence, cancellation, incomplete captures, exact replay and unchanged saved Core state.                                                                                                           |
| Recovery cost                             | Fixed comparison includes initial contract growth: 21,758 bytes versus a conservative recorded-route lower bound of 24,900 bytes; at least 3,142 bytes (12.6%) lower. Zero extra query/capture/write. This is a deterministic route comparison, not a measured live speed attribution. |

Self-review distinguished bind-only rejection from capture partial success,
removed a wrapper that overwrote the owner failure message, and extended tests to
execute returned multi-unit templates. It did not relax scope, revision or reference
checks. Actual delivered usage and output schema are exercised by the integration.

## Live recovery evidence

All times below are seconds after Send, with the original provider's 309 ms offset
applied. Raw payload SHA-256 values and exact references for calls 37-41 are saved
in binding-recovery-verification.json and were checked against original JSONL.

| Time                             | Evidence                                                                                                                                                | Interpretation                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 448.153-448.226                  | Four capture requests: two ornament regions unavailable, two other targets successful. Partial/completed receipt retained successful images.            | A real capture problem remains. It was not relabeled success; no judgment was recorded. Exact reason for these unavailable regions was not established in this task. |
| 454.294-454.325, 459.602-459.648 | Only the two ornament regions were requested again, with adjusted regions, and succeeded.                                                               | Successful targets from the mixed capture were reused. No drawing replay.                                                                                            |
| 472.761-472.771                  | Binding four checks using eight retained images failed because material/sample changed scope. failed/not-started; recordedChecks empty; accepted false. | The original protection remains effective. Owner returned revision 3 and requiredInputs = bindChecks[0].supersedes.reason.                                           |
| 479.227-479.238                  | AI sent the returned arguments, adding only /bindChecks/0/supersedes/reason. All four bindings were issued.                                             | Actual adoption confirmed. Recovery completed in 6.467 seconds after rejection. Zero intervening tool calls; only validate_inspection_evidence actions.              |
| 480.000                          | Work deadline.                                                                                                                                          | No later drawing call or mutation action is recorded. Only release_design_context appears after cutoff.                                                              |
| 499.339                          | Report output recorded.                                                                                                                                 | AI accurately said the four final judgments were still unsubmitted.                                                                                                  |

The recovery exchange contains 14,687 input/output bytes across the failed and
successful binding calls. Historical and current live cases differ; this number
is not a controlled comparison. The local fixed comparison is the cost proof.

Final retained coverage is **2/6**: overall and crown passed; material/sample stale,
base failed, tower and ornament unverified. The successful bind did not convert any
of those pending judgments to passes. accepted stayed false. The provider's
completed outcome means its request/report lifecycle completed; App outcome stayed
partial. These are distinct, consistent meanings.

## Timeline

| Interval / milestone |        Duration | Observed activity                                                                                                                                                                              |
| -------------------- | --------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-13.565             |        13.565 s | Request startup to first Knowledge discovery.                                                                                                                                                  |
| 13.565-40.057        |        26.492 s | Seven prework calls: discovery, three Knowledge reads and three tool-contract reads; 91,100 output bytes.                                                                                      |
| 40.057-97.269        |        57.212 s | No App tool call. Native record has output-item-started at 57.768 s and exec dispatched at 97.254 s. Argument progress and the wait cause are not recorded.                                    |
| 97.269-98.804        |         1.535 s | First design submission, 5,241 input bytes; two representative tiers.                                                                                                                          |
| **98.810**           | **First frame** | First saved visible-content screenshot.                                                                                                                                                        |
| 101.493-122.604      |        21.111 s | Read capture usage, capture and judge representative content.                                                                                                                                  |
| 130.453-177.147      |        46.694 s | Material capability lookup, two preparation/application pairs, reinspection and representative material pass.                                                                                  |
| 197.015-201.800      |         4.785 s | Extend six remaining tiers.                                                                                                                                                                    |
| 241.530-244.323      |         2.793 s | Podium and sloped base.                                                                                                                                                                        |
| 258.419-260.030      |         1.611 s | Crown and spire. No nonplanar refusal in this run.                                                                                                                                             |
| 292.737-322.926      |        30.189 s | Reference-purpose declaration, then ornament creation (42,639 input bytes). This interval includes time between tools.                                                                         |
| 329.492-350.186      |        20.694 s | Overview capture and explicit failed judgments.                                                                                                                                                |
| 355.984-400.152      |        44.168 s | Correction contract queries, delete problematic rear members, add podium roof/entrance. Last document mutation completed by 393.350 s (outer workflow); subsequent work is inspection/binding. |
| 416.336-439.143      |        22.807 s | Recapture and record overall/crown passes.                                                                                                                                                     |
| 448.153-459.648      |        11.495 s | Mixed capture and retries of failed ornament targets.                                                                                                                                          |
| 472.761-479.238      |         6.477 s | Scope rejection and one successful template-based bind retry.                                                                                                                                  |
| 480.000-499.339      |        19.339 s | Report-only phase; no later drawing.                                                                                                                                                           |
| 500.396              |      UI settled | Report and screenshot captured; checkpoint and new-context reload then completed.                                                                                                              |

Intervals do not fill every gap; the complete tool table below exposes each call's
start, end and tool duration. Total 42 App tool calls took 12.669 seconds inside the
recorded outer tool windows. This metric is not a decomposition of other time.

## Evidence, remaining issues and attribution

| Area                  | Confirmed                                                                                                                              | Limit                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Binding handoff       | Exact next-arguments reuse plus one authored reason, four checks/eight images/reference uses preserved. No extra lookup/capture/write. | Final judgment submission after that bind did not occur before cutoff.                        |
| Images                | 13 tool images restored from preserved payloads; payload hashes verified. First/final/reload/report screenshots saved.                 | A successful capture does not establish adequacy of framing or visual judgment.               |
| Persistence           | Durable sequence 533; same ordered roots and durable receipt after a new-context reload. Final/reload screenshots inspected.           | Reload comparison is roots-order-and-durable-receipt, not whole-document byte equality.       |
| Capture failures      | Two requested ornament regions returned CAPTURE_UNAVAILABLE; adjusted regions succeeded.                                               | No new root cause claim or fix in this task.                                                  |
| Public/native capture | 737 public activity records, zero recording failures, exact-thread native boundaries available.                                        | Argument progress and wait causes remain unavailable where not recorded.                      |
| Cleanup               | Knowledge, tool host and tool store cleanup completed; browser settled; all three owned services stopped.                              | Failure-retry cleanup was not exercised.                                                      |
| Knowledge             | Three reads delivered selected architecture/material guidance; run used material review and representative extension.                  | This change did not alter Knowledge. No causal improvement in visual judgment is established. |
| Final image           | Full tower silhouette, tiers, facade detail, podium and spire are visible; reload retained the composition.                            | Two of six retained visual checks passed; this is not full quality acceptance.                |

Preserved provider evidence: 1,058 files, 61,368,423 bytes. Checkpoint: 111,268,296
bytes. Reported usage: 2,645,528 input tokens including 2,508,288 cached input tokens;
11,096 output tokens. These are provider usage totals across its work, not unique
prompt size. No monetary estimate is inferred.

The single bounded defect can be closed with both local proof and live adoption.
The next independently evidenced candidate is capture-region admission/recovery
(two unavailable captures); it requires its own trace and contract review. Do not
expand this fix or rerun the model to pursue it automatically.

## Complete App tool-call timing

Status is the evidence analyzer's execution classification, not a visual verdict.
All bytes are serialized recorded outer inputs/outputs.

| Call | Start s |   End s | Tool duration s | Tool                      | Classification | Input bytes | Output bytes |
| ---- | ------: | ------: | --------------: | ------------------------- | -------------- | ----------: | -----------: |
| 0    |  13.565 |  13.570 |           0.006 | discover_knowledge        | usable         |          87 |         5752 |
| 1    |  21.594 |  21.596 |           0.002 | read_knowledge            | usable         |         187 |        23072 |
| 2    |  26.677 |  26.680 |           0.003 | read_knowledge            | usable         |         296 |         9554 |
| 3    |  30.287 |  30.343 |           0.056 | describe_design_apis      | usable         |         170 |        23072 |
| 4    |  33.035 |  33.036 |           0.001 | describe_design_apis      | usable         |         279 |         4604 |
| 5    |  36.697 |  36.701 |           0.004 | describe_design_apis      | usable         |          70 |         4442 |
| 6    |  40.055 |  40.057 |           0.002 | read_knowledge            | usable         |         104 |        20604 |
| 7    |  97.269 |  98.804 |           1.535 | prepare_and_apply_design  | usable         |        5241 |         1404 |
| 8    | 101.493 | 101.497 |           0.005 | describe_design_apis      | usable         |          80 |         8915 |
| 9    | 106.905 | 106.963 |           0.058 | review_drawing            | usable         |         184 |         3233 |
| 10   | 122.593 | 122.604 |           0.011 | review_drawing            | usable         |         857 |         5282 |
| 11   | 130.453 | 130.458 |           0.005 | describe_design_apis      | usable         |          26 |        14867 |
| 12   | 134.364 | 134.369 |           0.004 | describe_design_apis      | usable         |         106 |        23072 |
| 13   | 141.282 | 141.283 |           0.002 | describe_design_apis      | usable         |         215 |         3718 |
| 14   | 158.592 | 158.657 |           0.065 | prepare_material_revision | usable         |         607 |          183 |
| 15   | 158.659 | 158.686 |           0.027 | apply_prepared_material   | usable         |         133 |         1010 |
| 16   | 158.687 | 158.740 |           0.054 | prepare_material_revision | usable         |         511 |          183 |
| 17   | 158.742 | 158.757 |           0.015 | apply_prepared_material   | usable         |         133 |         1012 |
| 18   | 165.489 | 165.552 |           0.063 | review_drawing            | usable         |         184 |         3227 |
| 19   | 177.136 | 177.147 |           0.011 | review_drawing            | usable         |        1031 |         3766 |
| 20   | 197.015 | 201.800 |           4.785 | prepare_and_apply_design  | usable         |        3640 |          819 |
| 21   | 241.530 | 244.323 |           2.793 | prepare_and_apply_design  | usable         |        9447 |          819 |
| 22   | 258.419 | 260.030 |           1.610 | prepare_and_apply_design  | usable         |       10089 |          819 |
| 23   | 292.737 | 292.771 |           0.034 | select_design_references  | usable         |         883 |         2748 |
| 24   | 322.435 | 322.926 |           0.492 | prepare_and_apply_design  | usable         |       42639 |          773 |
| 25   | 329.492 | 329.637 |           0.145 | review_drawing            | usable         |         611 |         6320 |
| 26   | 350.172 | 350.186 |           0.014 | review_drawing            | usable         |        2597 |         9574 |
| 27   | 355.984 | 355.986 |           0.002 | describe_design_apis      | usable         |          49 |         3761 |
| 28   | 359.220 | 359.223 |           0.003 | describe_design_apis      | usable         |          27 |         2044 |
| 29   | 363.374 | 363.377 |           0.002 | describe_design_apis      | usable         |          49 |         8082 |
| 30   | 367.041 | 367.044 |           0.003 | describe_design_apis      | usable         |          98 |        12706 |
| 31   | 370.313 | 370.315 |           0.002 | describe_design_apis      | usable         |          55 |         8476 |
| 32   | 377.537 | 377.843 |           0.306 | execute_design_batch      | usable         |         255 |          717 |
| 33   | 393.187 | 393.350 |           0.162 | prepare_and_apply_design  | usable         |        7505 |          815 |
| 34   | 400.149 | 400.152 |           0.003 | describe_design_apis      | usable         |          71 |        21761 |
| 35   | 416.336 | 416.536 |           0.200 | review_drawing            | usable         |        1016 |         8171 |
| 36   | 439.133 | 439.143 |           0.010 | review_drawing            | usable         |        2094 |         5774 |
| 37   | 448.153 | 448.226 |           0.073 | review_drawing            | partial        |        1272 |         7360 |
| 38   | 454.294 | 454.325 |           0.031 | review_drawing            | usable         |         446 |         3315 |
| 39   | 459.602 | 459.648 |           0.047 | review_drawing            | usable         |         448 |         3319 |
| 40   | 472.761 | 472.771 |           0.010 | review_drawing            | failed         |        1023 |         4633 |
| 41   | 479.227 | 479.238 |           0.012 | review_drawing            | usable         |        1528 |         7503 |

## Saved artifacts

- Evidence directory: tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1793010611909/
- Original provider: preserved-provider/21554202-aaef-4283-b430-d00e8244748c.jsonl
- Binding proof: binding-recovery-verification.json
- Raw preservation: provider-preservation.json
- Parsed calls: generation-analysis.json
- Public/native observation: activity-analysis.json, public-activity-verification.json, native-boundaries.json
- Images and state: first.png, final.png, reload.png, self-report.png, self-report.txt, checkpoint.json
- Cleanup: service-cleanup.json and run.json browser lifecycle.
