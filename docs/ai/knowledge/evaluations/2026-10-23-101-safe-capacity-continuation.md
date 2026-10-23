# Safe capacity continuation - bounded 101 observation - 2026-10-23

The authorized single run completed its evidence capture, but did not exercise capacity continuation: the only submitted draft expanded to 1,443 objects, below the evaluation ceiling of 2,000. Real-model automatic partition continuation and interrupted-partition recovery remain unobserved in this run. Ordinary main-tool execution remained successful. No production source, prompt, budget or test implementation was changed for this observation.

## Configuration and provenance

- Task: composable-domain-knowledge-v1-plan.md, Task 3 - Asyra Design integration; safe capacity continuation observation.
- Worktree: `.worktrees/design-knowledge-evaluation`; branch `codex/design-knowledge-evaluation`; HEAD `96565e7125eea81d66f91298e8eb05ca0bf044b0` plus preserved uncommitted work.
- Previous accepted deterministic proof: `76b2415b-9074-4dad-96f2-364c9cf86e10`. All 841 runtime source files matched its recorded hashes before and after this run. This is source identity evidence, not a new deterministic test execution.
- Actual drawing record: `gpt-6-astra`, `medium`, local Codex.
- Limits: 2,000 expanded objects per artifact for this evaluation request; production default 10,000 unchanged. Work 120,000 ms; independent report limit 60,000 ms; no video; no retry.
- Empty isolated tool library, new document, project-local evidence, document and collaboration services. All three task-owned services were stopped and ports released after capture.
- Base URL: `http://localhost:3307`; viewport 1920 x 1080. Visual scope: the expressly authorized existing 101 runner and its own screenshots, not a separate model run or broad visual suite.
- Command, from `apps/asyra-design`: `node test-data/knowledge-evaluation/run-101.mjs quality-knowledge --deadline-ms=120000 --expanded-node-limit=2000`.
- Service launch and cleanup: `tmp/capacity-progress-live-1792742518163/`.
- Run: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792742530370/`.

## Tool correctness

| Question | Raw observation | Conclusion and limit |
| --- | --- | --- |
| Was the effective budget delivered? | Selected usage states 2,000 per artifact and safe excess continuing through retained parts in the same call. Both usage fragments share one revision and cover bytes 0-25,604 without gaps. | Correct App delivery observed. This does not prove every byte was retained in hidden model context. |
| Did safe excess become normal partition progress? | One draft: 66 explicit projected faces, 18 grids generating 1,376 objects, one root; 1,443 total. | Not exercised. No capacity rejection or retained capacity plan occurred. |
| Did owner success reach the main receipt correctly? | One `prepare_and_apply_design`, one preparation and one browser `apply_prepared_design`: complete, appliedElementCount 1,443; main tool success/completed. | Normal below-limit execution agrees across owner and receipt. |
| Did AI resend geometry? | One 24,502-byte geometry submission, one application; no repair or duplicate application. | No resubmission observed, but this was not failure recovery. |
| Did internal batching prove capacity partitioning? | Canonical application used 47 cooperative slices inside one artifact. | No. Application slicing is distinct from retained-source capacity partitions. |
| Was visual acceptance falsely claimed? | Main deterministic checks passed; later visual bind reports accepted=false, zero of two required checks passed, and requires status/evidence. | Successful binding was not visual acceptance. Final product outcome remained partial. |
| Was interrupted-part recovery safe? | No partition interruption or genuine mutation failure occurred. | Not exercised; do not upgrade previous deterministic proof to live recovery evidence. |
| Did writes stop at the deadline? | Work stopped at 120.000 s; native interrupt acknowledged at 120.008 s. Only `report_outcome` ran afterward, with no-change. | No drawing operation after cutoff observed. |
| Were report and persisted drawing retained? | Captured report exactly matches the raw native report message. Root and durable sequence 47 match after fresh-context reload. | Capture succeeded; reload equality covers root order and durable receipt, not every property. |

## Actual AI behavior

The AI discovered architectural Knowledge, read its parent and the materials method child, and requested draft usage covering projected-face, surface-grid and pattern plus optional plan. It consumed both usage pages without a refresh or delivery-failure invocation. It then submitted one source with root-level material templates and explicit faces/grids; it did not use pattern, parts or retained repair.

After drawing, it queried review usage and bound the overview image to two visual criteria. It did not submit visual statuses before cutoff. Its report accurately distinguishes successful creation from incomplete ornament, framing, material detail and unsubmitted visual acceptance. Screenshots show a full tower outline, tiers, podium, crown/spire and repeated windows; they are not detailed visual-quality acceptance.

The model also reports an initial image-forwarding argument error and successful resend. The App record confirms one retained/submitted inspection image, but does not independently retain that native Code Mode error or prove its duration. Keep that explanation labelled model self-report. Its lack of a persistence confirmation refers to what it had observed; the runner subsequently confirmed persistence and reload.

## Timeline from Send

| Interval (seconds) | Duration (seconds) | Observed phase |
| --- | ---: | --- |
| 0.000-16.712 | 16.712 | Startup/provider interval before first App tool |
| 16.712-16.721 | 0.009 | Discover Knowledge |
| 16.721-23.053 | 6.332 | Between App tools |
| 23.053-23.056 | 0.003 | Read architectural parent |
| 23.056-27.971 | 4.915 | Between App tools |
| 27.971-28.020 | 0.049 | Main-tool usage page 1 |
| 28.020-32.976 | 4.956 | Between App tools |
| 32.976-32.979 | 0.003 | Main-tool usage page 2 |
| 32.979-38.354 | 5.375 | Between App tools |
| 38.354-38.355 | 0.001 | Read materials method |
| 38.355-97.404 | 59.049 | No App tool invocation; eventual submitted geometry 24,502 bytes |
| 97.404-98.412 | 1.008 | Main tool prepares, applies, checks and captures overview |
| 98.418 | milestone | First observed content; not a GPU paint timestamp |
| 98.412-103.664 | 5.252 | Between App tools |
| 103.664-103.667 | 0.003 | Discover review usage |
| 103.667-111.136 | 7.469 | Between App tools |
| 111.136-111.150 | 0.014 | Bind visual evidence; no visual verdict submitted |
| 111.150-120.000 | 8.850 | No further App tool invocation before cutoff |
| 120.000-120.009 | 0.009 | Interrupt acknowledgement and report-only turn dispatch |
| 120.009-140.955 | 20.946 | Native report turn |
| 140.955-141.324 | 0.369 | Report settlement and text/screenshot capture |
| 141.324-142.799 | 1.475 | Final capture, persistence, checkpoint and fresh-context reload |
| 142.799-143.079 | 0.280 | Source verification and browser cleanup |

Eight App tool calls total 1.093071 seconds (unrounded records); main call 1.009645 seconds by its monotonic elapsed clock (the table uses rounded wall-clock event timestamps). Serialized App tool inputs total 25,440 bytes and outputs 82,060 bytes, excluding image bytes and native protocol overhead. The main call includes downstream owner durations, so do not add its child timings again. The 59.049-second pre-submission gap is the largest measured interval; public evidence cannot split it into reasoning, generation, scheduling and network time. No performance benefit from automatic overflow continuation can be measured because that path was not entered. The preceding 2,000 observation had first content at 73.930 seconds; this run is 24.488 seconds later, but the inputs and generated output differ, so this is not a causal regression estimate.

## Retained evidence and review

The run directory contains unmodified `run.json`, `source-snapshot.json.gz`, `checkpoint.json`, `first.png`, `final.png`, `reload.png`, `self-report.txt` and `self-report.png`. Provider records and payloads were preserved byte-for-byte into `preserved-provider/`; original recording files remain in the service output directory. All 54 preserved files match their original SHA-256 digests. Existing Runtime parsing and analyzer exports checked four complete record streams, 46 unique payload/asset references against size/SHA-256, and one exact inspection-image submission. No unfinished App tool calls were found. `generation-analysis.json` is derived; `observation-summary.json` records bounded observation checks. These do not replace raw records.

Primary drawing stream: `151121ee-201e-4563-9ae6-ec677678d331.jsonl`; App runtime stream: `9f09a6bd-9d08-4f8e-a04b-8b363146df7b.jsonl`. Native report source is drawing payload `42-output.json`; deadline and report markers are `host_observation` records in the same stream. Main source/receipt are the `tool_started` and `tool_completed` payloads for `prepare_and_apply_design`.

Inspected first, final, reload and report screenshots. First/final show the selected drawing with the AI panel; reload has no selection and a closed AI panel. The visible tower persists; viewport/UI changes are expected and were not treated as pixel identity. No source fixes or additional model runs were performed after this observation.

The focused result is an unexercised live overflow branch with preserved ordinary execution, deadline, report and reload behavior. Fixed over-budget deterministic regressions from the completed implementation remain the evidence for actual safe partitioning and no-replay recovery. A future live test intended specifically to exercise those branches should use a separately authorized fixed over-budget workload rather than infer coverage from lowering the limit alone.
