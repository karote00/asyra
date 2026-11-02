# Taipei 101 - actionable knowledge - twelve-minute run - 2026-11-02

## Outcome

The requested single twelve-minute-budget test ran with the unchanged fixed prompt.
The recorder exited successfully (0), saved the drawing, confirmed durability and
reloaded the exact same canonical document. The App screenshots show the building
from base to spire, eight projecting tiers, window grids, crown and ornaments.

This is **not a model-completed or visually accepted delivery**. The recorder
cancelled at 705.480 seconds using the existing fifteen-second margin before the
720-second hard limit. The provider settled cancelled; the App retained the work.
The model had found detail/material problems, applied one final refinement, and
had not reinspected or accepted that refinement before cancellation. There was no
model-authored final completion message. Do not compare this as a completed task
against a previously accepted full drawing.

No extra prompt, clarification, attachment, forced Knowledge lookup, post-run model
assessment or rerun was used. All observations below distinguish source tests,
recorded execution, model judgments and independent screenshot inspection.

## Implementation and verification before the run

Source commit: `77e54d91c22e027b07fefca634e720e50810eae1`.
Associated plan: [Optional design guidance](../plans/ai-design-agent-plan.md#optional-design-guidance---2026-11-02).
Implementation/review: [Knowledge ownership follow-up](ai-prompt-ownership-review-2026-11-02.md#follow-up-implementation-and-bounded-review).

The changes improve discovery utility and topic descriptions, retain concrete
coordinate/representation mappings, make representative checks conditional, and
remove optional sampling-method dependencies from direct parameter reads. Existing
App prompt, calculation tools, model configuration and benchmark prompt remain
unchanged. Actual parameter delivery decreases from 33,831 bytes/two pages/seven
documents to 18,221 bytes/one page/five documents. This is a static delivery result,
not proof of model behavior or drawing speed.

Formal regression was demonstrated before production edits. Eight focused
provider/knowledge/handoff suites pass 319 cases with six existing opt-in skips;
final knowledge checks pass 32 cases. Naming: 15 passed; Inspector/domain: six
passed; recorder: four passed. Typecheck and App build pass. Scoped lint has no
errors, with two pre-existing console warnings. Current-source Inspector candidate
`f06c13c2-dc73-444f-8513-bd2ab164b926` passes; the first candidate's outdated
selection-wording assertion was corrected and direct parameter delivery was added
to its existing proof. Candidate evidence does not mutate accepted baselines.

## Run identity

| Item | Value |
| --- | --- |
| Run | `taipei-101-fixed-1793631939264` |
| Source fingerprint | `b68abf7ee6f4b4e072c3c72f551067769187c1323c572705ab62172d2cef1658` |
| Provider request | `5209503a-8be6-4d32-99de-503e69221068` |
| Source request | `f0392b5a-960c-4d6c-9774-fab100804bc3` |
| Provider / model / effort | local-codex / gpt-6-astra / medium |
| Submission time | 2026-11-02 23:05:45.110 Taiwan time |
| Command | `yarn workspace @asyra/asyra-design test:live:taipei-101 --minutes=12` |
| App URL | `http://127.0.0.1:3045` |
| Viewport / DPR | 1920 x 1080 / 1 |
| Scope | Existing full-building recorder, fresh document/conversation, actual App screenshots and reload |
| User submissions / receipt POSTs | 1 / 17 |
| Initial submission bytes | 457,963, including ordinary App context |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Hard limit / soft-stop threshold | 720,000 / 705,000 ms |
| Browser measured duration | 705,480 ms |
| Provider lifecycle duration | 705,378.445 ms |
| First paint opportunity | 193,294 ms |
| Recorder result | Exit 0; no recorded page errors |

The prompt fixture, composer contents and submitted intent are checked by the
recorder. The fixture is
`apps/asyra-design/test-data/ai-drawing/taipei-101-full-building-prompt.txt`.
Source remained fixed throughout the run. The fixed deadline governs AI work;
post-stop screenshots, serialization, reload and video export are collection time.

## Timeline and announcement-to-action delay

| Approximate elapsed | Observed event |
| --- | --- |
| 9 s | Announces dimension and facade research |
| 14-102 s | Four API discovery calls and six native research operations |
| 128.075 s | Announces scaled base and eight-tier construction |
| 192.352-194.365 s | Base preparation/application succeeds |
| 193.294 s | First paint opportunity |
| 219.874 s | Announces eight projecting tiers and facade details |
| 268.627-273.828 s | Eight-tier preparation/application succeeds |
| 299.086 s | Announces crown, observation levels and spire |
| 376.823-376.852 s | Crown input rejected before writes: nonplanar mast face |
| 390.278-391.262 s | Retained-draft geometry correction succeeds |
| 417.636 s | Announces ornaments and entrance details |
| 497.052-497.469 s | Ornaments and entrance preparation/application succeeds |
| 506.724 s | Fifth API discovery, for review |
| 535.421 s | Announces whole/detail inspection |
| 541.674-542.048 s | Review capture succeeds |
| 619.240-619.269 s | Records three failed detail checks and one ornament pass |
| 661.196 s | Announces frame/gasket and continuous-reflection refinement |
| 687.209-694.158 s | Refinement preparation/application succeeds with inspection deferred |
| 705.480 s | Test recorder stops work and begins final evidence collection |

| Announced action | Announcement to tool start | Tool inclusive duration | Result |
| --- | ---: | ---: | --- |
| Base | approximately 64.3 s | 2.013 s | Applied |
| Eight tiers | approximately 48.8 s | 5.201 s | Applied |
| Crown/spire, first attempt | approximately 77.7 s | 0.029 s | Rejected before writes |
| Ornaments/entrance | approximately 79.4 s | 0.417 s | Applied |
| Final frame/material refinement | approximately 26.0 s | 6.950 s | Applied, not reinspected |

Announcements use sampled browser activity timestamps; tool intervals use provider
recording timestamps. Small clock/start differences make delays approximate.
These intervals are not measurements of private reasoning or argument-generation
speed. Native transport does not provide a complete generation-versus-stall split.
Capture-to-recorded-judgment took approximately 77.2 seconds; the final accepted
quality of the refinement remained unresolved.

## Tool activity and geometry recovery

| Tool | Calls | Input bytes | Output bytes | Inclusive time |
| --- | ---: | ---: | ---: | ---: |
| `describe_design_apis` | 5 | 864 | 89,747 | 0.377 s |
| `prepare_and_apply_design` | 6 | 32,943 | 5,914 | 15.593 s |
| `review_drawing` | 2 | 4,143 | 19,771 | 0.402 s |

Thirteen App calls: twelve usable, one failed/not-started, zero partial. Six native
research operations have unknown App usability; that is not a research-failure
claim. There were **zero discover_knowledge and read_knowledge calls**. No App
reference-image import occurred. Five PNG assets were retained; their filename
hashes match their bytes. All 26 App input/output payload hashes match saved bytes.

The failed input was `mastY.vertices`: maximum deviation from the face plane
18.06035288986692 world units exceeded tolerance 0.00004804378211589925.
Preparation rejected it before canvas writes and returned a retained draft with
repair guidance. The next preparation call corrected the face and succeeded about
14.4 seconds after rejection. This is an invalid model-supplied planar face, not
evidence of a broken projection algorithm. The App did not end the task after it.

The final refinement used existing projection, world-linear fields and repeated
motifs through preparation. It added a refinement group under the existing
composition, with inspection explicitly deferred. Successful execution proves
those inputs were supported; it does not prove all reviewed visual problems were
resolved or that all original facade surfaces were replaced.

## Time and resource attribution

| Exclusive owner | Time | Share |
| --- | ---: | ---: |
| Provider | 688.066 s | 97.55% |
| App | 15.855 s | 2.25% |
| Tool | 1.458 s | 0.21% |
| Recording gap | 0.000 s | 0.00% |

Provider components include 456.157 s waiting, 182.687 s observed reasoning-event
intervals, 28.268 s research, 20.159 s response-event intervals and 0.794 s request
transport. Waiting is not measured thinking. Inclusive tool times include nested
App work and must not be added to exclusive totals. No CPU/memory profile was
collected to attribute provider delay.

| Usage / transport | Recorded value |
| --- | ---: |
| Input tokens | 779,586 |
| Cached input tokens | 685,440 |
| Noncached input tokens | 94,146 |
| Output tokens | 18,237 |
| Reasoning output tokens | 2,619 |
| Total tokens | 797,823 |
| Transport sent / received | 3,796,362 / 3,514,615 bytes |

Usage status is partial because the run was cancelled. Recording completeness is
true with no report issues; that does not mean the drawing task was complete.
Credit balance was checked at 22:58 Taiwan time: 28,249.026249. No more frequent
credit polling was performed, and no per-run credit cost is inferred from tokens.

## Model judgments and independent visual review

The model recorded `accepted: false`, `current: false`, `certifiesVisuals: false`.
Its four detail checks found: base frame layers insufficient; tier reflections too
uniform with insufficient inner/outer frames; crown frames still needing detail
and roof/spire inspection; coin ornaments passing. The final refinement followed
those judgments, but no new visual acceptance was recorded afterward.

The reviewing agent inspected first.png, final.png, spire.png, tiers.png, base.png,
native-detail.png and reload.png from the actual App. Overview zoom is about 2%;
spire/tiers/base use scale 0.0576923, and native-detail uses scale 1. Final images
include panels and selection outlines; reload clears selection. The dark canvas
is workspace presentation, not evidence of an authored background.

| Aspect | Visible evidence | Remaining limit |
| --- | --- | --- |
| Whole silhouette | Base-to-spire drawing with eight outward tiers and separate crown is present | Whole-building appearance is not exact architectural completeness |
| Viewpoint | Two facade sides and top ledges are visible in a fixed elevated view | Source projection is azimuth 35/elevation 25/scale 1; no independently surveyed geometry oracle |
| Facade | Dense editable window shapes, differentiated glass sides and added frame borders | Some large light bands and repetitive shading remain visually prominent |
| Ornaments | Coins and repeated ruyi/corner motifs are visible | Native-scale corner motif remains broad angular geometry; detailed fidelity is unverified |
| Crown/spire | Layered platform, narrowing crown and spire with repeated bands | Material shading on broad roof surfaces is comparatively flat; no final model acceptance |
| Base | Glazed entrance and canopy are present | Adjacent podium relationships are not established by this isolated composition |
| Native detail | Layered borders and glass gradients are visible at 100% | Thin light lines extend across some dark recesses; final geometry/occlusion correctness is not certified |
| Reload | Same canonical data and visible whole building survive reload | Viewport/panel/selection changes prevent a pixel-identical screenshot claim |

The drawing has meaningful detail, but this evidence does not support claiming
all of the user's realism, ornament and architectural-fidelity requirements passed.

## Persistence, artifacts and cleanup

| Check | Result |
| --- | --- |
| Node count | 19,353: 19,326 vectors, 21 ovals, four groups, one frame, one workspace |
| Durable receipt | generation 0; sequence = durableSequence = 613 |
| Source versus checkpoint | Exact canonical document equality |
| Source versus reload | Exact canonical document equality and matching counts |
| Video | recording.webm, 56,795,791 bytes; full playback not independently reviewed |
| Services | Recorder-owned PIDs 218/219/220 stopped; ports 3045/4145/4245 clear |

Evidence root:
`tmp/conversation-improvements/live/taipei-101-fixed-1793631939264/`.
Retained files include run.json, execution-report.json, evidence-checks.json,
source-snapshot.json.gz, checkpoint.json, reload-snapshot.json.gz, recording.webm,
all seven inspected PNGs, service logs and provider-records with payloads/assets.
Original recording files are unchanged; the report and checks are derived evidence.

## What this run establishes

The code/content change and deterministic delivery tests are complete. The live
run exercises normal discovery, drawing, invalid-input repair, review, refinement,
cancellation and durable reload successfully. It also reproduces long
announcement-to-action intervals and late visual refinement.

Because the agent did not read Knowledge, this run does not test whether the
rewritten bodies improve decisions. The updated discovery tool description was
available, but did not lead to a lookup. Do not infer that compulsory reads would
help, that content changes are ineffective, or that the model lacked knowledge.
The next analysis should use retained tool arguments and actually delivered
contracts to identify avoidable derivation; this report authorizes no extra run
or new scheduling/quality instructions.
