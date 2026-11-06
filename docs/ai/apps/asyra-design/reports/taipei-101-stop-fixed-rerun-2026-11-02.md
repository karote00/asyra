# Taipei 101 - unchanged-prompt rerun after recorder repair - 2026-11-02

## Result

The authorized single ten-minute-budget run completed its recording, cancellation,
persistence and reload procedure successfully (runner exit 0). **The drawing task
was not completed:** eight bamboo tiers, facade details, ornaments, base and podium
were present, but the crown and spire were absent when the deadline stop occurred.
This is a recorded timeout/cancellation, not a successful full-building benchmark.
No comparison with a previously completed drawing is made.

The test driver clicked the production Cancel request control at the existing
585-second soft deadline. App cancellation retained applied changes. The provider
ended cancelled, with a complete lifecycle record and no report issues. Neither
the model nor the App independently decided that the requested drawing was done.
There was no model-authored final success response. The 600-second hard fallback
was not needed. Evidence export and reload ran after model cancellation and are
not extra drawing time.

## Test identity and input

| Item | Recorded value |
| --- | --- |
| Run | `taipei-101-fixed-1793613943023` |
| Source commit | `d0075d16e0c01776211a8bd773c222a20e3d1422` |
| Source fingerprint | `725334efa7f2d74525dd84c7bc1e583a4740589eafe128d13c1988ab3daf13f0` |
| Drawing provider request | `a14e42d6-4f20-4eda-89d4-95280281c52f` |
| Source request | `760b20d4-d521-476a-8f5a-f4b6d7a7b134` |
| Model / effort / provider | gpt-6-astra / medium / local-codex |
| Submission time | 2026-11-02 18:05:48.756 Taiwan time |
| App URL | `http://127.0.0.1:3045/?fileId=taipei-101-fixed-1793613943023&aiPerformance=profile` |
| Viewport | 1920 × 1080 |
| Scope / command | Fixed full-building live test / `yarn workspace @asyra/asyra-design test:live:taipei-101` |
| Budget | 600 s hard ceiling, unchanged 585 s soft stop |
| Input | Fresh document and conversation; one fixed prompt; no user attachments or coaching |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Actual submissions / receipt POSTs | 1 / 19 |
| Initial submission bytes | 457,963 including ordinary App context |
| Clarification supplied by test driver | None |
| Runner errors / failure | None |

The [canonical prompt](../../../../../apps/asyra-design/test-data/ai-drawing/taipei-101-full-building-prompt.txt)
was read directly, removing only its final newline. Its hash, recorded prompt and
actual submitted intent match. No source, prompt, package output or production
instruction was changed during this run. The model independently researched and
imported two reference images through ordinary App tools; these were not test
attachments or prepared reference hints.

Task association: the inspection delivery correction follow-up in the
[Editable Design Agent plan](../plans/ai-design-agent-plan.md). This run only tests
and reports current behavior; it does not change or accept an Inspector contract.

## Timing and progression

| Elapsed after submission | Observed activity |
| --- | --- |
| 0–67 s | Planning, operation discovery and native research |
| 111 s | Design criteria established |
| 130–177 s | Reference selection, verified facts and additional knowledge retrieval |
| 235.617 s | First paint opportunity detected |
| 238.659 s | First two bamboo tiers and terrace representative section applied |
| 264–297 s | Image inspection and material evaluation |
| 306 s | Model identified flat glass and proposed reflection, metal-edge and shadow improvements |
| 332.252 s | Representative two-tier material refinement applied |
| 338–351 s | New images and representative material review |
| 362 s | Model announced extension to the remaining six tiers |
| 396.373 s | Third through eighth tier application completed |
| 435.568 s | Eight-tier ornaments and corner decorations applied |
| 464 s | Model announced base, entrance, coin and podium work |
| 529.642 s | Base, entrance and podium visible shell applied |
| 551.806 s | Model announced crown, mechanical levels, braces and spire work |
| 585.208 s | Deadline cancellation settled; drawing stopped before crown/spire application |
| After cancellation | Final/detail screenshots, source save, durable checkpoint, reload and video export |

UI activity times are sampled observations, not exact backend execution boundaries.
The first-paint metric is a rendering opportunity, not an architectural quality
measurement. The provider lifecycle duration was 584.863 s; its start is later
than the browser submission, so it differs from the 585.208 s browser duration.

## Tool and delivery details

| Tool | Calls | Input bytes | Output bytes | Inclusive ms |
| --- | ---: | ---: | ---: | ---: |
| `describe_design_apis` | 10 | 1,063 | 142,636 | 413.655 |
| `discover_knowledge` | 1 | 43 | 9,596 | 15.740 |
| `read_knowledge` | 2 | 261 | 34,861 | 12.552 |
| `import_reference_image` | 1 | 380 | 2,291 | 3,511.852 |
| `define_design_criteria` | 1 | 1,918 | 237 | 3.906 |
| `select_design_references` | 1 | 1,333 | 4,574 | 4.747 |
| `record_design_facts` | 1 | 1,103 | 1,841 | 3.780 |
| `prepare_and_apply_design` | 5 | 32,171 | 6,191 | 19,399.691 |
| `review_drawing` | 4 | 4,771 | 31,783 | 258.965 |

All 26 App tool calls were usable: zero rejected, partial or failed results. Three
native research outcomes have unknown App usability and are not counted as failed
App tools. Inclusive durations may overlap nested App/action work; do not add them
to exclusive owner times. Payload bytes describe recorded tool input/output and
are not a complete network or image-byte measurement.

Six images were submitted to the model: two researched reference images and four
PNG inspection images. All six unique asset hashes and 52 App tool payload hashes
were verified. The original missing-width/height failure did not recur. The model
used the first inspection to identify flat materials, changed the drawing, then
used the later inspection to pass the representative material method. That pass
explicitly excluded complete-building and ornament acceptance. The last review
has `accepted: false`, `current: false`, and `certifiesVisuals: false`.

## Visual inspection

The agent inspected actual App final, base, tiers, top-target, native-detail and
reload screenshots. This is a visual review of the saved result, not certification
of accurate unseen geometry or real-world dimensions.

| Requested aspect | Observed result / limit |
| --- | --- |
| Entire base-to-spire building | Failed: base and eight tiers are present; crown and spire are missing |
| Elevated three-quarter view | Two facades and visible terrace/podium top surfaces; perspective broadly consistent in visible geometry |
| Bamboo tiers | Eight projecting tiers with ledges and corner pieces |
| Facade / windows | Dense window grid, independent vector content, tonal reflection bands and metal-edge highlights |
| Ornamentation | Repeated tier ornaments and two visible base coin forms; precise architectural fidelity not established |
| Base / podium | Tapered lower tower, entrance details and adjoining podium shell present |
| Realistic materials / lighting | Stylized blue-green surfaces and highlights; repeated broad tonal bands remain visible at 100% |
| Complete visual acceptance | Not achieved; no final whole-building review after the later expansions |
| Real dimensions at 1 cm = 1 px | Not independently verified; an announced 50,800 cm spire target was not completed geometry |

Final screenshots include the App side panels and a blue selection outline around
the last applied base/podium region. Overview zoom is about 2%, detail zoom about
6%, native detail 100%. Reload has no selection and the AI panel is closed, so its
framing differs. These UI differences do not imply document changes.

The file named `spire.png` is the recorder's predetermined top-target view; it
shows mostly empty space and a small portion of the top tier at the bottom. Its
filename is not evidence that a spire exists. The overview establishes the missing
crown/spire; this poorly framed detail alone is not a geometry oracle.

## Editability and persistence

| Check | Result |
| --- | --- |
| Total canonical nodes | 23,927 |
| Vectors | 23,849 |
| Ovals | 72 |
| Groups / frame / workspace | 4 / 1 / 1 |
| Persistence generation | 0 |
| Applied sequence / durable sequence | 755 / 755 |
| Final document equals durable checkpoint | Verified by full parsed-document equality |
| Final document equals reloaded document | Verified by full parsed-document equality |
| Reload node counts | Identical |
| Recorder exit | 0 |
| Service cleanup | Ports 3045, 4145 and 4245 no longer listening |

Canonical vector/oval records demonstrate editable shape storage; this run did
not perform destructive editing or an additional Undo exercise on the drawing.
The cancellation/Undo regression had passed before this run. Source, checkpoint
and reload evidence is retained without replacing earlier failed-run artifacts.

## Resource and token observations

| Metric | Recorded value |
| --- | ---: |
| Provider lifecycle | 584,862.674 ms |
| Exclusive provider owner | 560,291.679 ms (95.80%) |
| Exclusive App owner | 19,508.790 ms (3.34%) |
| Exclusive tool owner | 5,062.206 ms (0.87%) |
| Unattributed recording gap | 0 ms |
| Input tokens | 2,458,152 |
| Cached input tokens | 2,353,920 |
| Noncached input tokens | 104,232 |
| Output tokens | 19,727 |
| Reasoning output tokens | 2,112 |
| Total reported tokens | 2,477,879 |
| Transport sent / received | 3,245,523 / 2,984,104 bytes |
| Video bytes | 45,332,245 |
| Recording failures / report issues | 0 / 0 |
| Usage completeness | `partial` |

A complete lifecycle report means the cancelled lifecycle was recorded correctly,
not that drawing or token accounting completed. Usage is partial and not an exact
billing total. Reasoning output is a reported subset, not an additional amount to
add to total tokens. Owner timing includes provider waiting, not measured CPU time.
CPU and memory were not comprehensively profiled. Offline reporting used no model
assessment and made no additional drawing request.

## Interpretation and remaining work

The stopping repair worked: cancellation, retention, persistence and reload are
now captured cleanly. Image delivery also worked through both review rounds.
The observed incompletion is a deadline outcome: almost four minutes elapsed
before the first paint, and representative-section refinement preceded the other
six tiers and base. The model announced crown/spire work with about 33 seconds
remaining before the soft stop and did not apply it in time.

These observations identify where this run spent its budget; a single run does
not establish a model-independent performance regression or prove that any
specific optimization will solve it. Provider-attributed time dominates this run,
but includes waiting and generation. This report does not attribute the outcome
to unrelated PRs, modify the fixed prompt, silently rerun, or label an incomplete
drawing as equivalent to a previously completed test.

## Evidence

All paths below refer to this run's retained local evidence, not another test.
Raw artifacts live under ignored project-local `tmp` and are not included in Git.

- [Run metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/run.json)
- [Execution report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/execution-report.json)
- [Equality and hash checks](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/evidence-checks.json)
- [Final App overview](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/final.png)
- [Tier details](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/tiers.png)
- [Base details](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/base.png)
- [Top-target view](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/spire.png)
- [100% detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/native-detail.png)
- [Reload overview](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/reload.png)
- [Source snapshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/source-snapshot.json.gz)
- [Durable checkpoint](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/checkpoint.json)
- [Reload snapshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/reload-snapshot.json.gz)
- [Full recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793613943023/recording.webm)
