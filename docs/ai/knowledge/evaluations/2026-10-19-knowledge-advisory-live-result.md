# Architectural Knowledge - single live evaluation

## Result and comparison boundary

The authorized Knowledge-arm run failed the ten-minute completion requirement.
The independent watchdog expired 117 ms after the deadline and began terminating
owned generation 174 ms after it. No retry, extension, second model evaluation,
production correction, push or monitoring followed.

Some advisory content was adopted: the initial podium is offset from the tower,
and an early material judgment includes painted surfaces and frames. However,
tool acquisition increased, material correction remained late, and the agent did
not finish. This is not evidence of an overall Knowledge efficiency improvement.

Compare the saved previous Knowledge run `1792337950811` with the new Knowledge
run `1792342207875`. Both use the same full architectural prompt, two reference
attachments and gpt-6-astra medium. Only the new run was executed this time.
Knowledge revisions and App guidance changed; the runs are stochastic and have
different action sequences. This is an observational comparison, not a causal
Knowledge/no-Knowledge experiment. Object quantity is not a quality or performance
improvement criterion.

## Comparison

| Measure                                       |             Previous Knowledge run |                                    Current Knowledge run | Interpretation                                                                            |
| --------------------------------------------- | ---------------------------------: | -------------------------------------------------------: | ----------------------------------------------------------------------------------------- |
| First observed content                        |                           59.743 s |                                                 98.364 s | 38.621 s later; first visible compositions differ                                         |
| UI completion                                 |                          366.088 s |                                   No completion at 600 s | Current run failed; do not report 600 s as successful completion                          |
| App tool invocations                          |                                 45 |                                                       64 | More interactions                                                                         |
| Tool definition queries                       |                                 10 |                                                       14 | No reduction                                                                              |
| Usage queries / field queries                 |                              1 / 0 |                                                    4 / 0 | Some compact usage adoption; no field-level query adoption                                |
| Full-definition recovery                      |                                  1 |                                                        1 | Same 65,110-byte definition requested again; server delivery does not prove model receipt |
| Definition response bytes                     |                            284,060 |                                                  331,541 | 16.7% more                                                                                |
| All tool input bytes                          |                            289,565 |                                                  490,192 | More total input                                                                          |
| All tool output bytes                         |                            434,297 |                                                8,963,539 | 20.6 times as much output; dominated by check-result records                              |
| Largest single input                          |                          162,182 B |                                                159,464 B | Both ornamental work; not a reflection-input comparison                                   |
| App tool wall-time union                      |                           24.686 s |                                                 62.095 s | Includes different actual workloads; not a same-work benchmark                            |
| Native research tool time                     |                            2.099 s |                                                  3.195 s | Observed separately from App tools                                                        |
| Provider time outside observed tools/research |                          338.236 s |                                                534.452 s | Includes inference, input generation, processing and transport; not pure thinking         |
| First explicit material deficiency            |                          272.971 s |                                                185.684 s | Identified 87.287 s earlier, relative to provider start                                   |
| Material correction start                     |                          302.481 s |                                                305.959 s | Still late; one explicit correction pass in each run                                      |
| Podium composition                            | Broad, centered rectangular plinth | Offset attached low mass visible from first construction | Better broad relationship; reference too weak to certify exact geometry                   |

Byte counts are serialized parsed tool inputs/outputs, excluding image pixel
payloads and transport framing. The current material correction input was 9,897 B;
the maximum input belongs to ornament generation. Neither figure proves that a
particular reflection strategy is generally efficient.

First content is the harness's first observed drawing bounds, not a GPU paint
timestamp. The previous provider window is 365.021 s; the current provider starts
259 ms after Send and is bounded by the 600 s cutoff. No terminal usage record
exists after forced termination, so final token totals are unavailable.

## Current elapsed-time attribution

Times below use Send as zero. Tool intervals are unioned before subtraction.
The provider-outside-tools column is an observed responsibility boundary, not an
assertion about private model reasoning. It also includes the final interval
without a terminal provider event.

| Stage                                            | Interval          | Wall time | App tools | Research | Provider outside tools | Calls started |
| ------------------------------------------------ | ----------------- | --------: | --------: | -------: | ---------------------: | ------------: |
| Planning, acquisition, first visible part        | 0:00-1:38.364     |  98.364 s |   4.348 s |  3.195 s |               90.562 s |            12 |
| Early review and tiers                           | 1:38.364-3:05.961 |  87.597 s |  33.300 s |        0 |               54.296 s |             8 |
| Crown/base/ornament and material correction      | 3:05.961-5:06.305 | 120.345 s |   7.534 s |        0 |              112.811 s |            11 |
| Visual review and detail/geometry correction     | 5:06.305-8:09.528 | 183.222 s |  10.819 s |        0 |              172.403 s |            19 |
| Final views and podium occlusion correction      | 8:09.528-9:18.832 |  69.304 s |   3.745 s |        0 |               65.559 s |             6 |
| Verification, stale results, final-action lookup | 9:18.832-10:00    |  41.168 s |   2.348 s |        0 |               38.820 s |             8 |

The first row additionally contains 0.259 s of submission time. One tier
preparation/application call takes 33.061 s, accounting for most of the second
stage's tool time. The remaining long stages are primarily outside observed tool
execution. This does not establish why the model service spent that time.

## Did Knowledge change the actual work?

| Advice                                                  | Actual input/output evidence                                                                                                                         | Outcome                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Establish spatial relationships before details          | Both architectural modules read early. Method facts describe view, scale and separate glass/frame roles. Offset podium appears in the first drawing. | Broad massing adoption observed. Initial criteria still use overall/detail/scale rather than a separate attached-volume relationship criterion. |
| Compare relevant reference scope early                  | Reference use is selected around 50 s, but early inspections omit its binding. First reference-backed overall capture occurs around 324 s.           | The early relationship-check handoff was not fully adopted.                                                                                     |
| Judge combined material and structure                   | Early capture contains base glass plus window frames; the agent identifies weak material appearance around 186 s.                                    | Better evidence scope and earlier diagnosis than the previous frame-only check.                                                                 |
| Correct material before repeating unsuitable appearance | Correction remains around 306 s, after further construction.                                                                                         | Earlier diagnosis did not translate into earlier correction or fewer material rework passes.                                                    |
| Retrieve only the missing tool contract                 | Four usage queries, no schema-path queries, one full recovery, fourteen total lookups.                                                               | Partial adoption only; no efficiency gain.                                                                                                      |
| Use the correct execution route                         | Final query asks the native catalog for `report_outcome`, which is a response action rather than a catalog tool, and returns zero tools.             | A route-selection failure remains despite existing instructions. Not proof of a missing portable Knowledge concept.                             |

Knowledge remains advisory. These observed choices do not justify making reads
or compliance mandatory, or moving App tool schemas into the shared module.

## Rework and unresolved App handoffs

1. Before first content, preparation is rejected for missing `draft.brief.checks`.
   The agent then attempts replacement of the absent `/brief/checks` path. The
   existing repair contract rejects that operation; replacing the entire brief
   succeeds. The rejection/repair interval adds roughly eight seconds before the
   valid application. This is contract use, not expensive mechanical checking.
2. A later multi-part application settles the crown but rejects a nonplanar base
   face. Another base attempt and an ornamental bracket face also need geometric
   repairs. The evidence distinguishes partial settled work from rejected work;
   it does not label all these inputs as tool implementation bugs.
3. One visual submission mixes local evidence and broader coverage and is
   rejected without recording judgments. The next submission corrects the input.
4. The foreground podium is modified late to address overlapping columns/doors.
   Therefore improved broad massing does not mean podium rework disappeared.
5. At approximately 576 s, a visual review returns about 2.806 MB and 5,460 stale
   records. A subsequent full-root mechanical review is complete with no findings,
   and verification of that root passes. Yet the following result read still
   returns 5,459 stale per-element measurement records and about 2.801 MB.
   Root verification and earlier descendant-result reconciliation remain
   disconnected in this observed path. This is a concrete App handoff/output
   issue, not something that can be resolved merely by adding architectural advice.
   The exact implementation root cause requires a separate bounded audit.
6. The final catalog query for `report_outcome` yields zero tools. There is no
   final response before the watchdog. The trace establishes this sequence, but
   does not establish that this one query or the stale results alone caused the
   entire timeout.

Only one drawing model stream was executed. There was no additional AI reviewer
call. The primary agent made the visual judgments; mechanical tool checks stayed
tool execution. No product fix was made during or after this evaluation.

## Visual review

Actual saved-state overview, podium, tier and ornament images were inspected,
in addition to the first-content capture and a near-cutoff frame extracted from
the recorded UI. The current podium extends to one side/front of the tower with
a recognizable attachment; this matches the aerial reference's broad relationship
better than the previous centered plinth. The saved ornament has the double curl,
stem and lower circular element visible in the detail reference.

Glass uses continuous tonal fields beneath a dense frame grid, but the visible
highlight rhythm remains repetitive and the reference does not establish exact
reflectance. The low-resolution aerial image cannot establish exact podium
dimensions, facade/window patterns or completed crown appearance. Attractive
detail does not change the timeout result. These are partial saved results, not
an agent-declared completed drawing.

## Final references and their limitations

The two supplied attachments were the image references used in this run. The
research call did not add another drawing image reference.

| Reference                                                                                     | Actual permitted use                                          | Limitation                                                                                                                  |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `reference-0.jpg`, SHA-256 `2641a97ca7ed04ffc472541566c573aaf9e570ae7cf69d1b6fe845882d7549d7` | Broad tower/podium massing, relative placement and attachment | Low resolution, small subject, construction crane near crown; not detailed material, dimensions or completed crown evidence |
| `reference-1.jpg`, SHA-256 `d4b293abf4e0d0571846b398fda42aed0e7ca6dae611ac32abe288ae63753bdd` | Local ornament shape and relief                               | Not whole-building or podium evidence                                                                                       |

Files: `apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/reference-{0,1}.jpg`.
The exact model-input assets are also retained under the new run's provider assets.

## Evidence integrity and recovery

Run folder: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792342207875/`.

- `deadline.json` records the enforced timeout. `run.json` retains the subsequent
  browser-closed exception; it is not rewritten as a success or an unrelated
  capture failure.
- All 64 completed tool calls have their saved input/output. The 50,324 sequenced
  records have no sequence gaps. The forced-stop model stream has no terminal
  completion/usage event, and remains explicitly incomplete. No output after the
  cutoff can be claimed.
- `preserved-provider-manifest.json` records 46,976 retained files and 314,366,323
  bytes checked against the originals. `generation-analysis.json`, `metrics.json`
  and `timing-comparison.json` retain parsed calls and timing calculations.
- `source-snapshot.json.gz` and `post-stop-source-verification.json` verify
  unchanged evaluation source, digest
  `f90f022a5f4b78c036a1fc9db846764aec5ad76f517cf663cea52299f45d791b`.
- `browser-artifacts/page@ac15f8b36a0b06bc9ad5e9f7c903eb72.webm` is retained. Its
  valid media header reports 10:03.760, including pre-Send setup. A frame at video
  600 s was decoded and inspected. The original collector still records raw spool
  preservation rather than orderly final export. Full-frame decode was not claimed.
- A separate read-only browser, blocking every `/api/ai/` POST, loaded the saved
  document and captured inspection images. It attempted zero model requests.
  The save receipt has sequence and durableSequence 1268. No original pre-kill
  receipt exists for equality comparison, so this proves current saved-state
  recovery, not exact equality with an unrecorded final in-memory state.
- Recovery artifacts are `post-stop-recovery.json`, `post-stop-reloaded.png` and
  `post-stop-inspection-{0,1,2,3,4}.png`. The original timeout remains a failure.

## Conclusion

This run supports partial adoption of better spatial and material-review advice.
It does not support fewer lookups, less material rework, faster first content,
faster completion or an overall Knowledge quality improvement. Remaining gaps
include agent decisions, weak reference evidence and an App result-reconciliation
handoff. They must not be conflated into a single Knowledge-content diagnosis.

The authorized evaluation and analysis are complete. Further model runs and
implementation are not authorized by this report. No push or monitoring occurred.
