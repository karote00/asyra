# Taipei 101 - optional guidance - twelve-minute run - 2026-11-02

## Outcome

One user-authorized twelve-minute-budget run was executed with the unchanged
canonical prompt. The saved App overview shows the base, eight tiers, crown,
spire, podium and ornaments. The model had not accepted the completed drawing:
it found missing ornamentation and material/connection defects and was still
correcting them when the recorder cancelled at 705.987 seconds.

Cancellation itself succeeded. The App displayed that the request was stopped
and applied changes were retained. The provider lifecycle settled `cancelled`,
with complete recording and no report issues. This was the test driver's deadline
stop, not a model-authored completion or an App decision to end the design task.

**The recorder subsequently failed while obtaining the final source snapshot:**
`page.evaluate: Target page, context or browser has been closed`. Final and detail
screenshots exist, but source snapshot, confirmed persistence receipt, checkpoint
export and reload verification were not completed. Runner exit was 1. The exact
cause of the browser disconnection is unproven; do not label it an out-of-memory
failure, a prompt regression or the hard deadline firing without evidence.
The deadline worker recorded `finished`, not a hard-deadline failure.

No rerun, corrective prompt, model assessment or completed-benchmark comparison
was performed. Original failure metadata is retained unchanged.

## Identity and conditions

| Item | Value |
| --- | --- |
| Run | `taipei-101-fixed-1793627124232` |
| Source | `170185b57665dd23bb7873e33989ec0772f6bdfb` |
| Product instruction change | `e9f669623` - optional design knowledge |
| Recorder-only change | `170185b57` - explicit duration parameter |
| Source fingerprint | `fcf5fcb32629c2da856d437e3150e127ede10ec8af54520aec245813d596a808` |
| Provider request | `dd3f8771-be3a-44fb-ab33-37119b998971` |
| Source request | `94dcc41b-81f7-4910-8e38-ff76cf2741d7` |
| Provider / model / effort | local-codex / gpt-6-astra / medium |
| Submitted | 2026-11-02 21:45:29.561 Taiwan time |
| Command | `yarn workspace @asyra/asyra-design test:live:taipei-101 --minutes=12` |
| Base URL | `http://127.0.0.1:3045` |
| Viewport / DPR | 1920 × 1080 / 1 |
| Visual scope | Existing full-building live recorder, actual App overview and detail inspection |
| Guard | 720,000 ms hard limit, 705,000 ms soft-stop threshold |
| Actual browser drawing duration | 705,987 ms |
| Provider lifecycle duration | 706,110.995 ms |
| First paint opportunity | 158,913.900 ms |
| User submissions / receipt POSTs | 1 / 20 |
| Initial submission size | 457,963 bytes including ordinary App context |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |

Only the test duration changed from the usual ten minutes. The default remains
ten minutes; explicit integer durations of 1–15 minutes retain the existing
15-minute safety ceiling and 15-second soft-stop margin. Four recorder contract
tests, scoped lint and 15 naming checks passed before this run. Product prompt
validation from the preceding implementation remains recorded in the parent plan.

The exact [fixed user prompt](../../../../../apps/asyra-design/test-data/ai-drawing/taipei-101-full-building-prompt.txt)
matched the recorded prompt and actual submission, removing only the fixture's
final newline. This was a fresh document and conversation with no user attachments,
prepared design, coaching or supplied clarification. Source stayed fixed during
execution. Association: [Optional design guidance](../plans/ai-design-agent-plan.md#optional-design-guidance---2026-11-02).

## Timeline

| Approximate elapsed | Recorded activity |
| --- | --- |
| 0–60 s | Planning, capability discovery and four native research operations |
| 87 s | Further capability discovery |
| 114 s | Model announces base/façade construction and distinguishes confirmed height from estimated local dimensions |
| 158.914 s | First paint opportunity |
| 162.967 s | Base with two glass façades, window frames and slab backing applied |
| 193 s | Announces all eight projecting tiers |
| 245.387 s | Eight tiers, windows, chamfers and terrace shadows applied |
| 280 s | Announces crown, observation levels and spire |
| 333.582 s | Crown, louvers, platforms, metal bands and spire applied |
| 397 s | Announces podium, entrance, skylight and ornaments |
| 454.700 s | Podium and entrance shell applied |
| 542.146 s | Tier ornaments, metal scroll details and base coins applied |
| 553.245 s | Drawing inspection completed |
| 600.729 s | Further tool discovery |
| 645.921 s | Model reports floating crown bands and missing base/podium ornamentation |
| 649.456 s | Removes 14 detached crown bands, retaining other crown geometry |
| 705.987 s | Recorder cancels; model has not submitted final acceptance |
| After cancellation | Final/detail screenshots succeed; final snapshot evaluation loses browser connection |

Times are sampled UI observations except the separately measured first-paint and
lifecycle durations. A first-paint opportunity is not visual-quality proof. Browser
and backend durations use different start/end observations and need not match.

## Tool activity and optional knowledge

| Tool | Calls | Recorded input bytes | Recorded output bytes | Inclusive ms |
| --- | ---: | ---: | ---: | ---: |
| `describe_design_apis` | 9 | 1,118 | 137,534 | 490.645 |
| `prepare_and_apply_design` | 5 | 37,147 | 6,085 | 22,433.187 |
| `review_drawing` | 2 | 4,438 | 17,462 | 388.896 |
| `execute_design_batch` | 1 | 310 | 700 | 596.977 |

All 17 App tool calls were usable, with zero partial, rejected or failed outcomes.
Four additional native research outcomes are classified as unknown App usability;
that classification is not evidence of research failure. There were **zero
`discover_knowledge` or `read_knowledge` calls** and no App reference-image import.
This run demonstrates that the model can proceed without consulting knowledge;
it does not establish that knowledge is unnecessary or that the prompt change
caused a particular speed or quality outcome.

Four inspection images were submitted to the model. All four unique asset hashes
and 34 App tool input/output payload hashes match retained bytes. No missing image
dimension error occurred. Tool payload sizes do not include every transport cost.
Inclusive nested durations must not be added to exclusive owner totals.

## Model judgment and independent screenshot inspection

The recorded model review has `accepted: false`, `current: false` and
`certifiesVisuals: false`. It passed the viewpoint and failed overall coverage,
materials and two detail checks. Its cited concerns were missing large base plates,
corner cloud ornaments and podium roof ornaments, flat top surfaces, and detached
crown ribs. The subsequent edit removed 14 bands; no final reinspection certified
the correction or the remaining details before cancellation.

The reviewing agent inspected final.png, base.png, tiers.png, spire.png and
native-detail.png, all captured through the actual App rendering path.

| Aspect | Visible result and limit |
| --- | --- |
| Base to spire | Entire vertical extent visible; crown and spire present |
| Eight bamboo tiers | Clearly repeated projecting sections and terrace bands |
| View | Two façades and visible top surfaces; consistent apparent elevated three-quarter projection |
| Window detail | Dense individual window/frame structure; repeated light/dark patterns visible at detail scale |
| Ornaments | Tier scroll motifs and two visible base coins present; completeness not established |
| Podium / entrance | Podium façade grid, skylight-like roof and entrance present |
| Crown / spire | Tapered crown, louver/platform layers and spire visible after band removal |
| Material realism | Blue-green glass, metal highlights and contact bands; broad flat terraces and repeated pane shading remain visible |
| Exact dimensions / architectural fidelity | Not independently verified from screenshots |
| Final acceptance | Not reached; neither model review nor complete recorder validation passed |

The overview uses about 2% zoom, local views about 6%, and native detail 100%.
Screenshots include the App panels and a blue selection outline around tower
content. UI chrome and selection are not drawing geometry. The black canvas
surrounding the object is not evidence of an authored background panel.

## Retained document and recorder limitation

The retained backend document contains 28,450 canonical nodes: 28,219 vectors,
225 ovals, four groups, one frame and one workspace. Backend generation is 0 and
durableSequence is 899. These counts demonstrate persisted editable shape data;
they are not a substitute for final-memory comparison or successful reload.

The recorder finished its deadline worker and captured all four detail views,
then failed at the following final snapshot evaluation. No source-snapshot file,
normal checkpoint export, reload screenshot or reload snapshot exists for this
run. The ordinary persistence-confirmation step had not executed. The backend
file is retained original evidence and was not relabeled as a completed checkpoint.

A raw browser recording file remains (58,713,058 bytes); normal export to
recording.webm did not complete. Full video integrity/duration has not been
independently verified. Services were cleaned up; ports 3045, 4145 and 4245 were
no longer listening. No additional model call or reconstructed final drawing
was used to fill these evidence gaps.

## Usage and attribution

| Metric | Recorded value |
| --- | ---: |
| Input tokens | 1,571,284 |
| Cached input tokens | 1,469,184 |
| Noncached input tokens | 102,100 |
| Output tokens | 21,030 |
| Reasoning output tokens | 3,371 |
| Total reported tokens | 1,592,314 |
| Usage completeness | `partial` |
| Transport sent / received | 2,583,546 / 2,353,581 bytes |
| Exclusive provider owner | 681,239.148 ms |
| Exclusive App owner | 23,158.377 ms |
| Exclusive tool owner | 1,713.470 ms |
| Recording gap attribution | 0 ms |
| Provider recording failures / report issues | 0 / 0 |
| Runner exit | 1 |

A complete provider lifecycle record describes a correctly recorded cancellation,
not completed drawing, complete usage accounting or successful browser export.
Partial usage is not an exact billing total. Reasoning output is not added again
to total tokens. Provider owner time includes waiting and generation; CPU/memory
were not comprehensively profiled. No causal before/after speed claim is made,
particularly because the authorized time budget differs from previous runs.

## Evidence

Raw artifacts are retained under ignored project-local tmp. These links point to
this run only; prior evidence is unchanged.

- [Run metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793627124232/run.json)
- [Execution report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793627124232/execution-report.json)
- [Prompt, hash and backend checks](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793627124232/evidence-checks.json)
- [Final App overview](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793627124232/final.png)
- [Base](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793627124232/base.png)
- [Tiers](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793627124232/tiers.png)
- [Crown and spire](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793627124232/spire.png)
- [100% detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793627124232/native-detail.png)
- [Raw browser video](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793627124232/browser-artifacts/page@e49dd13468abbb82377447351498a786.webm)
