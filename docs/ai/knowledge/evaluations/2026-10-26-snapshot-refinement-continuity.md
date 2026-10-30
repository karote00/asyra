# Retained snapshot refinement - two-turn 101 observation - 2026-10-26

The corrected handoff was exercised successfully: the second turn read existing
children, refined that returned snapshot by name, received a valid complete page,
and used its identities for two existing-fill edits. The earlier false
`arguments.elementIds` rejection and fallback region query did not recur.
This is evidence for the bounded tool fix. Both drawing turns remained partial;
material realism, metal completion and failure recovery are not certified.

## Run and source

- Run: `knowledge-taipei-101-continuity-1792951863562`.
- First Send: 2026-10-26 02:11:07.205 Asia/Taipei.
- One run, two ordinary App requests; no retry or video.
- Shared work budget: 120 seconds; final report budget: at most 60 seconds.
- Native model headers: `gpt-6-astra`, effort `medium`, both turns.
- Effective and production expanded-node limits: 10,000.
- HEAD: `04d87366167e048e719129b67f10dbb6929fd5f2` with preserved local changes.
- Source digest: `c685257699ae373dcf1888ba8e61e2e50125b5fd191bf65c773d6e11e7a64a1f`.
  Source capture matched before Send and after collection. No product, prompt,
  Knowledge or runner changes were made for the observation.
- URL: `http://127.0.0.1:3307/?fileId=knowledge-taipei-101-continuity-1792951863562`.
- Scope/command: the existing live UI scenario,
  `node test-data/knowledge-evaluation/run-consultation.mjs --scenario=architecture-101`.
- Viewport: 1920 x 1080, device scale 1. Screenshots include the App panels and
  selected-root outline; first/final overview zoom is 2 percent.
- The existing collector's 10 deterministic sequencing checks passed before launch.

Evidence root: `tmp/knowledge-evaluation/knowledge-taipei-101-continuity-1792951863562/`.
Original provider root: `tmp/drawing-continuity-provider-1792951831490/`.
The evidence root includes copies under `preserved-provider/`, source archive,
reference images, per-turn documents/messages, ordinary first answer, attributed
second report and screenshots. Source/event evidence remains unchanged.

## Tool correctness

| Boundary | Original evidence and document checks | Conclusion and limit |
| --- | --- | --- |
| Children to retained snapshot | At 92.587 s, one `read_design_context` children query requested fills, page delivery and limit 30. It returned total 6,981 and snapshot `0d0ed474-0ba5-4462-b90f-69dc4864ead7`. | Existing source captured once; the page did not exhaust the retained membership. |
| Snapshot refinement to valid output | At 98.493 s, the same tool used that snapshot with `filter.name.prefix=tier`, page delivery and limit 200. The result contained 24 rows, nextOffset null, no elementIds property, and success/completed. | The previously broken element-result refinement route was exercised without rejection. |
| Reuse of retained data | Owner observation reports selectionExecutions 0, refinementExecutions 1, candidateCount 6,981, metadataReadCount 6,981 and computedReadCount 0. | No fresh source selection or computed-column capture. Refinement still performs necessary metadata predicate work; it is not zero work. |
| Selected rows to editing | AI selected the 16 left/right tier faces from the 24 returned rows, excluding the eight roofs. One `execute_design_batch` carried two `api_fill_updateFillsAtIndex` operations, each with eight distinct returned IDs. | All targets came from the selected page; accepted IDs match inputs exactly. The alternative `map_retained_fills` consumer was not used. |
| Receipt to actual document | Both fill receipts report complete/completed, changed=true, complete mutation scope and no unavailable IDs. Document comparison finds exactly 16 changed property records: 16 kind and 16 gradient changes. | Actual canonical mutations agree with the receipts; this is not merely successful tool invocation. |
| Preservation and replay | All 6,983 document IDs and their order are identical across turns; sceneTree and property IDs are identical. Only the 16 intended fill records changed. No second creation, region fallback or repeated material batch occurred. | Geometry, hierarchy, order and unrelated material records were preserved. Normal-path no-replay was observed; failure-recovery no-replay was not exercised. |
| Deadline | Work interruption started at 120.003 s and was acknowledged by 120.011 s. The only later App action is report_outcome at 133.234 s. Final document equals the saved second-turn document. | No drawing operation started after cutoff. Reporting did not replay edits. |
| Host cleanup | Native second-turn event sequence 838 at 133.222 s reports tool-host cleanup failed with TOOL_CLEANUP_FAILED; knowledge and tool-store cleanup completed. | A confirmed remaining cleanup failure. The error detail is redacted; neither its cause nor a resource leak is established. Provider completion does not mean every cleanup step succeeded. |

Native streams:
- First: `017986f6-1d94-4502-b381-a79453492121.jsonl`, creation sequences 249/284.
- Second: `61a50320-425e-4a25-971e-326051d78057.jsonl`, children sequences 125/136,
  refinement 185/196, material batch 234/287, cutoff 329-343, report output 830,
  cleanup failure 838.
- App requests: `3216ca49-e28d-431c-a020-d46445b9f9e7` and
  `a65ea8fa-239e-4f77-a687-7504d41b112d`.

`continuity-checks.json` verifies returned-snapshot use, target membership,
receipt/input agreement and exact changed-owner membership. `document-comparison.json`
preserves every changed field. `generation-analysis.json` and `timeline.json`
are derived indexes into the original records, not replacements for them.

## AI behavior

| Observation | Evidence | Assessment |
| --- | --- | --- |
| Used the corrected route | Children then snapshot refinement, followed directly by editing returned IDs. | Adoption of this specific handoff is observed. |
| No failure-driven requery | Exactly two context calls, scopes children and snapshot; no region query or replacement read. | The earlier recovery detour did not recur. |
| Additional contract lookup remained | Initially requested read_design_context and updatePrimaryFillColors; later queried updateFillsAtIndex for gradients, then review_drawing usage. | Do not call this zero lookup or zero round trips. These are different capabilities, not retries of a rejected snapshot. |
| Performed bounded material work | Two eight-face edits introduce cold reflective bands and darker side faces. | The final screenshot visibly differs; metal records were not edited. |
| Honest incomplete result | Report explicitly says metal work and full/detail visual validation remain unfinished. | Consistent with actual changed fields and partial UI outcomes. |
| Image error and recovery claim | AI says initial image forwarding failed with “image detail must be a string” and it then displayed a retained result. This string is preserved in report output, but not independently in recorded native tool-error events. | The claim is not promoted to a confirmed native recovery. App records show one automatic inspect_drawing capture, one retained submitted image, and no repeated edit/capture. |
| First-frame self-report | AI describes the second turn's single-face preview as its first observed frame. | This is not the run's first frame. The collector observed the initial whole tower at 51.551 s. |

The first turn created 6,982 editable elements plus the workspace. The follow-up
kept them and changed only existing materials. No metal-completion, visual-realism,
Undo/Redo, collaboration replay or fresh-context reload claim is made from this run.

## Timeline

Times are relative to the first Send. First frame means observed canonical bounds
and a saved screenshot, not an exact GPU presentation timestamp.

| Time (s) | Duration (s) | Activity |
| --- | --- | --- |
| 0.000-12.559 | 12.559 | Initial provider work before the first Knowledge tool |
| 12.559-23.752 | 11.193 | Five Knowledge/selected-contract calls and intervening gaps |
| 23.752-47.254 | 23.502 | Interval before initial drawing submission |
| 47.254-51.687 | 4.433 | Prepare, create and overview capture |
| **51.551** | — | **First frame observed; first.png saved** |
| 51.687-73.581 | 21.894 | Review lookup, binding, partial judgment and first-turn settlement |
| 73.581-78.897 | 5.316 | Save ordinary answer/document/screenshot, verify idle input |
| 78.897-88.252 | 9.355 | Second request begins; interval to first lookup |
| 88.252-98.516 | 10.264 | Capability/Knowledge reads, children query, snapshot refinement and gradient API lookup |
| 98.516-107.911 | 9.395 | Interval before material edit submission |
| 107.911-108.029 | 0.118 | Two eight-face edits and automatic single-face inspection |
| 108.029-120.002 | 11.973 | Review usage lookup and remaining native work; image recovery is an AI claim |
| 120.002-120.011 | 0.009 | Start reporting, interrupt work and receive terminal acknowledgement |
| 120.011-133.204 | 13.193 | Report-only turn |
| 133.204-138.468 | 5.264 | Settle second UI outcome; save report and per-turn evidence |
| 138.468-143.978 | 5.510 | Final document/screenshot capture and browser cleanup |

Observed top-level tool execution totals: first turn 4.535 seconds across nine
calls; second turn 0.248 seconds across eight calls. Other intervals are not proven
model reasoning time. Tool input/output bytes were 24,129/73,801 and 2,505/88,166
respectively. These are recorded payload sizes, not token usage or billing.
The prior failing run first frame was 47.665 seconds; this run is not a controlled
latency comparison. The success criterion here is removal of the invalid handoff,
not a guaranteed faster first frame.

## Capture and screenshot review

All nine saved execution streams pass the public Runtime parser as complete,
with no parser issues. All 17 top-level tool calls have preserved input and output
references. All 119 referenced payload/image assets pass size and SHA-256 checks;
137 files including stream/metadata files are copied into preserved-provider.
Both submitted tool images and both original reference images verify.

The standard single-run quality analyzer rejects this multi-turn partial capture:
it expects its separate successful-quality outcome and evidence-stage contract.
That rejection is retained in `tmp/snapshot-refinement-live-analysis.log`; no
missing stage was filled with success. Diagnostic analysis instead uses the same
public record parser and existing payload/image readers. Complete recorded streams
are not proof that all Codex-internal transformations are observable; the reported
image-helper error/recovery is one explicit evidence limit.

First and final overview screenshots were inspected. The final tower has visible
vertical reflective bands on the edited tier faces with the original silhouette,
framing and object layout preserved. This overview is not detailed material
acceptance. The report screenshot and native single-face pixels remain available.

The browser closed normally. All three owned services were stopped with PID,
start-time, cwd and command checks; service-cleanup.json records no remaining
processes. The initial inline cleanup wrapper failed before stopping services
because its Worker inherited an incompatible Node input-type flag; the existing
file-based cleanup script then succeeded. No model or product operation was retried.

## Bounded conclusion

The retained snapshot output correction is positively observed in a real second
turn, including successful downstream mutation and exact preservation checks.
No false refusal or failure-driven context requery occurred. Failed-refinement
recovery and map_retained_fills remain unexercised. The independent tool-host
cleanup failure remains unresolved, and native image recovery is only partly
observable. No additional model run, product fix or push was performed.
