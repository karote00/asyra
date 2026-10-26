# Public Codex activity recording - eight-minute 101 observation

Date: 2026-10-26. Task 3 in the existing composable-domain-knowledge plan.

## Outcome

The missing public-activity handoff is implemented and observed in one authorized
live run. The App now retains public message deltas/final text, readable reasoning
summary deltas/final summaries and public plans through the existing sanitized
payload sink. It requests concise summaries in the ordinary work turn. It does
not request private reasoning or introduce another model call, cache or store.
The existing evaluation analyzer restores this content with hash and identity
validation, including incomplete streams without certifying completion.

Live artwork outcome: **partial**, not visually accepted. **First frame:
122.773 seconds** after Send. Work stopped at 480 seconds; the report was captured
at approximately 503 seconds. No video. Model gpt-6-astra / medium; production
artifact ceiling 10,000. One work turn and one existing report-only turn; no extra
model review or rerun. No CI inspection or push.

## Source and formal verification

- Worktree: `.worktrees/design-knowledge-evaluation`; branch
  `codex/design-knowledge-evaluation`; HEAD `a669266a1570010454a58223b6aa737400b4a657`.
- Preserved source snapshot and successful source verification in this run;
  no source edits during live execution. Post-run plan/report updates are separate.
- Existing Task 3 plan, product spec and observe Inspector contract updated before
  implementation. Admission revision 138; final Inspector verify
  `5c6b0f86-2102-43c2-b28e-bdae63bc7e34` passed.
- Test-first evidence: `tmp/public-activity-app-red-body.log` (dropped public body),
  `tmp/public-activity-runtime-red.log` (notification payload not retained),
  `tmp/public-activity-analysis-red.log` (identity and unavailable-content checks).
- Runtime: 451 passing tests. Direct App suites: 309 passing, one opt-in native
  registration case skipped because LOCAL_AI_PROTOCOL_EXECUTABLE was not set.
  Final focused activity, metadata/privacy and foreign-turn tests: three passing.
- Existing knowledge-evidence consumer command: 53 Node tests, 29 browser-adapter
  tests and 19 action-batch/exchange tests passed; the new offline tests are in this
  existing command. App/server/proof production types and runtime/service builds
  passed. Naming passed; scoped lint has zero errors and five existing console
  warnings. Diff review and whitespace checks passed.
- Self-review covered exact thread/turn/item attribution, turn-only plan updates,
  Unicode, partial streams, empty/malformed/unavailable content, failed/throwing
  sinks, final values versus deltas, hash/provenance rejection, linear delta
  storage, cancellation and no execution replay. Private reasoning stays absent.

## Actual recording results

| Observation | Measured result | Meaning / limit |
| --- | --- | --- |
| Retained public activity payloads | 589 | Every referenced activity payload restored and hash-checked |
| Public agent message deltas | 515 | Includes final report streaming; no growing-prefix copies |
| Completed public messages | 5 | Four progress messages and the final report |
| Completed reasoning-summary items | 21 | 24 summary sections; concise public titles |
| Summary section / text delta events | 24 / 24 | Actual native emissions, not reconstructed reasoning |
| Public plan events | 0 | Not observed live; covered by formal integration tests |
| Public activity payload bytes | 169,337 B | About 165.4 KiB; excludes JSONL envelope overhead |
| Activity serialization time | 36.403 ms aggregate | Existing sink measurements; not end-to-end latency |
| Activity file-write time | 377.000 ms aggregate | Asynchronous writes; not added model thinking time |
| Maximum activity queue delay | 13.648 ms | Measured queue delay, not a total to add to wall time |
| Recording failures reported | 0 | Does not imply every native lifecycle has a terminal event |
| Provider streams | 11 preserved; 10 complete | Drawing stream has one unclosed reasoning item at cutoff |
| Verified payload references | 14,678 | All preserved reference checks passed |
| Submitted native tool images | 6 | Exact pixels and hashes restored from existing assets |
| Complete preserved provider directory | 14,712 files; 118,702,829 B | Includes existing tool/action evidence, not just activity additions |

The public summaries now explain which activities were announced inside several
formerly opaque tool gaps. They are short labels, not a second-by-second account.
For example, the first drawing tool gap contains an actual summary at 76.860 s;
after it, no native or transport event is recorded until 121.390 s. That 44.530 s
interval still has no recorded internal activity. Its cause is unknown. This
report does not invent an explanation or apply a model-thinking label to it.

## Full milestone and completed-activity timeline

All times are seconds since Send. Native elapsed times are aligned with the
recorded provider start, 0.298 seconds after Send. Tool durations are measured
invocation intervals. Public summary timestamps are arrival times, not duration
attribution. All raw deltas remain in activity-analysis.json and original payloads.

| Time | Duration | Evidence | Operation / activity | Result / interpretation |
| --- | --- | --- | --- | --- |
| 10.037–10.047 | 0.010 | Tool | discover_knowledge | usable; input 87 B, output 5752 B |
| 17.061–17.066 | 0.005 | Tool | read_knowledge | usable; input 187 B, output 23072 B |
| 21.651–21.653 | 0.002 | Tool | read_knowledge | usable; input 296 B, output 9554 B |
| 28.392 | — | Public message | Announces tower/facade first, followed by base, tiers and crown; attachments have limited reference purposes. | Actual received content; not a measured work-duration label |
| 31.795–31.836 | 0.041 | Tool | describe_design_apis | usable; input 179 B, output 23072 B |
| 36.481–36.482 | 0.001 | Tool | describe_design_apis | usable; input 288 B, output 6473 B |
| 53.647 | — | Public summary | Planning tiered building structure | Actual received content; not a measured work-duration label |
| 56.344–56.346 | 0.002 | Tool | describe_design_apis | usable; input 69 B, output 23072 B |
| 62.337 | — | Public summary | Checking for sufficient remaining content | Actual received content; not a measured work-duration label |
| 63.821–63.824 | 0.003 | Tool | describe_design_apis | usable; input 178 B, output 23072 B |
| 71.076–71.079 | 0.004 | Tool | describe_design_apis | usable; input 178 B, output 18606 B |
| 76.860 | — | Public summary | Estimating required drawing time | Actual received content; not a measured work-duration label |
| 121.391–122.762 | 1.370 | Tool | prepare_and_apply_design | usable; input 7364 B, output 1486 B |
| 122.773 | — | Milestone | FIRST FRAME | Two editable tower tiers and window grids are visible in first.png. |
| 127.148–127.216 | 0.068 | Tool | review_drawing | usable; input 233 B, output 3069 B |
| 150.667 | — | Public summary | Improving glass reflections; Planning reflection overlay approach | Actual received content; not a measured work-duration label |
| 155.452–155.465 | 0.013 | Tool | review_drawing | usable; input 869 B, output 4487 B |
| 159.713 | — | Public summary | Checking progress status | Actual received content; not a measured work-duration label |
| 163.133 | — | Public message | Announces podium, base and crown work plus stronger glass reflection and metal detail. | Actual received content; not a measured work-duration label |
| 164.216–164.224 | 0.009 | Tool | describe_design_apis | usable; input 38 B, output 23072 B |
| 168.505 | — | Public summary | Preferring exact schema fields | Actual received content; not a measured work-duration label |
| 170.568–170.572 | 0.004 | Tool | describe_design_apis | usable; input 94 B, output 22100 B |
| 176.298 | — | Public summary | Applying gradient fills | Actual received content; not a measured work-duration label |
| 188.681–188.715 | 0.033 | Tool | execute_design_batch | usable; input 1557 B, output 1403 B |
| 204.362 | — | Public summary | Selecting representative face overview | Actual received content; not a measured work-duration label |
| 206.631–206.697 | 0.066 | Tool | review_drawing | partial; input 418 B, output 3543 B |
| 213.897 | — | Public summary | Assessing gradient realism | Actual received content; not a measured work-duration label |
| 216.492–216.503 | 0.011 | Tool | review_drawing | usable; input 318 B, output 2739 B |
| 223.760–223.771 | 0.012 | Tool | review_drawing | usable; input 1372 B, output 2888 B |
| 229.634 | — | Public summary | Implementing pattern tiers | Actual received content; not a measured work-duration label |
| 235.836–239.971 | 4.135 | Tool | prepare_and_apply_design | usable; input 4320 B, output 775 B |
| 245.187 | — | Public summary | Checking base and crown alignment | Actual received content; not a measured work-duration label |
| 266.377 | — | Public summary | Analyzing ornament projection methods; Designing polygon ribbons and base structure | Actual received content; not a measured work-duration label |
| 303.594–303.638 | 0.044 | Tool | prepare_and_apply_design | failed; input 16528 B, output 845 B |
| 307.295 | — | Public summary | Recovering lost variables | Actual received content; not a measured work-duration label |
| 309.661–309.667 | 0.005 | Tool | describe_design_apis | usable; input 120 B, output 5227 B |
| 318.826 | — | Public summary | Calculating indices manually | Actual received content; not a measured work-duration label |
| 321.244–324.026 | 2.782 | Tool | prepare_and_apply_design | usable; input 900 B, output 924 B |
| 327.496 | — | Public summary | Assessing timing and reflection | Actual received content; not a measured work-duration label |
| 335.234–335.268 | 0.034 | Tool | select_design_references | usable; input 815 B, output 2461 B |
| 359.629 | — | Public summary | Designing tiered cloud ornaments | Actual received content; not a measured work-duration label |
| 361.544 | — | Public message | Announces cloud ornaments, medallions and corner details before overview/detail inspection. | Actual received content; not a measured work-duration label |
| 390.614–391.052 | 0.438 | Tool | prepare_and_apply_design | usable; input 34875 B, output 773 B |
| 395.390 | — | Public summary | Confirming acceptance and planning overview | Actual received content; not a measured work-duration label |
| 398.958–399.108 | 0.149 | Tool | review_drawing | usable; input 1112 B, output 6239 B |
| 421.809 | — | Public summary | Fixing geometry overlay order; Adjusting tier tapering | Actual received content; not a measured work-duration label |
| 425.899 | — | Public summary | Fixing order and reporting limits | Actual received content; not a measured work-duration label |
| 426.779–426.781 | 0.001 | Tool | describe_design_apis | usable; input 79 B, output 2270 B |
| 436.789–436.803 | 0.013 | Tool | review_drawing | usable; input 3363 B, output 7552 B |
| 442.284 | — | Public summary | Estimating brief duration | Actual received content; not a measured work-duration label |
| 444.613 | — | Public message | Reports base occlusion and says realism and estimated proportions remain insufficient. | Actual received content; not a measured work-duration label |
| 447.513–447.743 | 0.230 | Tool | execute_design_batch | usable; input 378 B, output 725 B |
| 452.904–452.952 | 0.048 | Tool | review_drawing | usable; input 388 B, output 3207 B |
| 468.306 | — | Public summary | Managing crown object hierarchy | Actual received content; not a measured work-duration label |
| 475.661–475.668 | 0.007 | Tool | review_drawing | usable; input 1040 B, output 6625 B |
| 475.675–478.125 | 2.449 | Tool | execute_design_batch | usable; input 390 B, output 734 B |
| 480.000 | — | Milestone | WORK DEADLINE | Host stopped work; native interruption acknowledged at 480.006 s. |
| 502.706 | — | Public message | Final report: partial artwork; last crown-order edit lacks a fresh image, final acceptance unfinished. | Actual received content; not a measured work-duration label |
| 503.031 | — | Milestone | REPORT CAPTURE / UI SETTLEMENT | Partial result; report text and screenshot saved. |
| 511.610 | — | Milestone | EVIDENCE CAPTURE FINISHED | Checkpoint, fresh-context reload, screenshots, source verification and browser cleanup complete. |

## Native event gaps of at least ten seconds

These gaps use every native trace and transport event, not only App tool calls.
They retain a null cause. Earlier or later public labels are contextual evidence,
not proof of what happened throughout a gap.

| Interval since Send | Duration | Last / next recorded boundary |
| --- | --- | --- |
| 39.543–53.628 | 14.086 | provider_item_started → transport_chunk |
| 76.861–121.390 | 44.530 | provider_item_completed → transport_chunk |
| 129.164–147.777 | 18.614 | provider_item_started → transport_chunk |
| 176.298–188.681 | 12.383 | provider_item_completed → transport_chunk |
| 191.931–204.334 | 12.403 | provider_item_started → transport_chunk |
| 247.770–265.027 | 17.258 | provider_item_started → transport_chunk |
| 266.378–303.592 | 37.214 | provider_item_completed → transport_chunk |
| 340.786–359.618 | 18.833 | provider_item_started → transport_chunk |
| 361.544–390.613 | 29.068 | provider_notification → transport_chunk |
| 401.614–416.626 | 15.012 | provider_item_started → transport_chunk |
| 455.750–468.274 | 12.523 | provider_item_started → transport_chunk |

## Tool behavior and AI behavior

| Area | Raw evidence | AI behavior / interpretation |
| --- | --- | --- |
| Initial information | 3 Knowledge calls, 5 description calls before first drawing; 7,364-byte first draft | AI read main drawing contract in two pages and review/reference descriptions in three pages. This run establishes the sequence, not the cause of each latency. |
| First result | prepare_and_apply_design 121.391–122.762 s; first image at 122.773 s | Two tiers are visibly present. It is not final acceptance. |
| Material inspection scope | At 206.697 s capture succeeded but changed check scope lacked supersedes; receipt partial, judgments not written | At 216.492 s AI rebound existing inspection IDs and then recorded checks; it did not recapture or redraw for this recovery. |
| Nonplanar crown face | At 303.638 s preparation rejected crownFinX-2050 before application; retained draft supplied | At 321.244 s AI used a 900-byte repair referencing the retained draft, instead of resending the 16,528-byte submission. Preparation/application then succeeded. |
| Occlusion | Public report and failed visual check identified base/top-face occlusion; subsequent hierarchy edits returned completion | AI acknowledged remaining proportion/realism issues. Last crown fix had no follow-up image before cutoff. |
| Work deadline | Last drawing tool completed at 478.125 s; stop at 480 s; report turn started at 480.006 s | No drawing after cutoff. Two release_design_context cleanup calls occurred during settlement and are not drawing. |
| Completion | Provider returned a report batch; App outcome partial; final visual check not accepted | Report completion is separate from artwork completion. |
| Lifecycle completeness | A reasoning item started at 479.962 s; work was interrupted, with no item/completed for it | Analyzer preserves the open span and marks the drawing stream incomplete. Zero storage failures does not erase it. |
| Mechanical work volume | 6,953 review_design action starts; 7,008 total action starts, 7,007 completed and one failed preparation | This remains a separately observable cost. Necessity/duplication has not been re-audited in this recording task. It must not be attributed to the 589 public-activity writes. |

## Saved result and limits

The canonical checkpoint and fresh-context reload preserve the same root order
and durable receipt: generation 0, sequence 427, durableSequence 427. Final and
reload screenshots were inspected; the tower remains visible after reload. This
is the existing roots/receipt reload proof, not a new byte-for-byte document oracle
or a visual acceptance verdict. AI reported material realism and proportions as
unfinished. Knowledge causal benefit was not tested in this run.

Source recording: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1793002315768/preserved-provider/72adf41d-a32e-49e2-a554-142dc2844b40.jsonl`.
Saved run, first/final/reload screenshots, self-report text/image, checkpoint,
source snapshot, generation-analysis.json, activity-analysis.json,
public-activity-verification.json and provider-preservation.json are in
`tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1793002315768`. Service cleanup receipts confirm all three owned services stopped;
ports 3307/4117/4217 were free after cleanup. The generic guard stop receipt
retains status `failed` for the intentional stop path, with its explicit authorized
stop reason and no errors; the separate identity/PID verification confirms no
remaining owned service. The original receipt was not rewritten as success.

The implementation closes the loss of exposed public activity. It does not expose
hidden token generation, add continuous progress that Codex never emitted, or
repair the historically missing content. Summary-generation overhead itself was
not isolated; the measured storage costs above must not be presented as its cost.
