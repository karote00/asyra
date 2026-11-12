# Taipei 101 - snapshot delivery repair and live validation - 2026-11-02

## Outcome

The missing snapshot dimensions defect is fixed and verified by formal regressions
and one live run. The live agent received images, continued from the base to eight
tiers and the crown/spire, and authored visual failure judgments. **The full task
did not finish within the test window and is not a completed benchmark.** No
performance comparison with the earlier completed run is provided.

A separate recorder defect appeared at the deadline: the button displays Stop but
its accessible name is Cancel request. The recorder searched for Stop and timed
out after two seconds. Cleanup then terminated owned services and the provider
record ended cancelled. This was not a model-authored final answer or success.
Original failure evidence remains unchanged; no additional live model run was made.

## Repair and verification

- The inspection action now declares required integer PNG width/height (1–1024),
  preserving them through model projection before native image extraction.
- Generic projection, PNG validation, model instructions, cancellation policy and
  the approved benchmark prompt remain unchanged. Action revision is 3.
- Formal projected-image regression: five cases failed before the fix, including
  multiple images, overview, local region and workspace; the zero-image case passed.
- Eleven image tests pass, including actual host projection and the pinned native
  transport. Tests preserve original bytes/order and prohibit recapture.
- Existing incomplete inspection mocks were corrected at their direct consumers.
  Server broad run: 3,089 passed, one mock failed, two existing skipped; corrected
  batch suite: 23 passed. AI broad run: 791 passed, one mock failed; corrected
  runtime suite: 22 passed. No full-suite green claim is inferred from these runs.
- Typecheck, App build, scoped lint (one existing console warning), naming (15)
  and the current-source Flow Inspector candidate (85 cases) passed.
- Removed the prior integration's duplicate presentation path from the Inspector
  request boundary. Candidate evidence is distinct from accepting unrelated
  revisions of the local Inspector baseline.
- Live source commit: `20b23a5e2e718aae0ec701201c8cb3fdff36a6e3`. It is a local commit, not pushed.

The deadline defect is covered by the existing real-browser streamed drawing
cancel/Undo test using the same stop helper as the recorder. The original Stop
selector reproduces the timeout; the corrected helper selects Cancel request.
The corrected browser case passes and verifies retained applied content plus one
Undo entry. The three recorder contract tests and 15 naming checks also pass.
This follow-up changes only recorder/test interaction, not product behavior or
prompt content.

## Live settings and observations

| Item | Value |
| --- | --- |
| Run | `taipei-101-fixed-1793612223281` |
| Request | `e2473f16-9644-4846-8441-7a932e1c873c` |
| Source fingerprint | `f18ecfa7aeaaa394a1adf18c62a5355a75b63bf1813071d3da1d29d9724b27ae` |
| Model / effort | gpt-6-astra / medium |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Submission | 2026-11-02 17:37:08.395, Taiwan time |
| Inputs | One exact fixed prompt, fresh conversation, no attachments or coaching |
| URL / viewport | `http://127.0.0.1:3045` / 1920 × 1080, DPR 1 |
| Command | `yarn workspace @asyra/asyra-design test:live:taipei-101` |
| Guard | 600 s hard limit, existing 585 s soft stop |
| First paint opportunity | 162.713 s |
| Provider duration | 587.497 s; cancelled during recorder cleanup |
| Recorder exit | 1; Stop selector timeout |
| Final App settlement | Not captured; do not infer success or a model final answer |
| App tool outcomes | 25 usable, 1 rejected, 0 partial, 0 failed |
| Native research | 1 additional outcome with unknown App usability |
| Image delivery failures | 0 |
| Submitted image assets | 11; all retained hashes verified |
| App input/output payloads | 52; all retained hashes verified |
| Recording failures | 0; an unfinished provider span remains due to cancellation |
| Root requests / receipt POSTs | 1 / 21 |

## Timeline

Times below use recorded UI observations relative to submission, not exact backend
phase boundaries.

| Approximate elapsed | Observation |
| --- | --- |
| 0–117 s | Research, references and contract discovery; one selector request rejected, then agent continued |
| 163–181 s | First base geometry, successful image delivery and continued tool discovery |
| 181–258 s | Visual review, source facts and position inspection |
| 292–341 s | Eight bamboo tiers and facade ornaments created |
| 363–407 s | Base entrance, stone structures and coin ornaments added |
| 472 s | Crown, equipment layers and spire created |
| 498–520 s | Reference selection and overview/detail image acquisition |
| Before cleanup | Agent recorded visual failures requiring correction, not final acceptance |
| About 585–588 s | Soft-stop lookup failed; cleanup cancelled provider and retained video/failure screenshot |

## Tool detail

| Tool | Calls | Input bytes | Output bytes | Inclusive ms |
| --- | ---: | ---: | ---: | ---: |
| `describe_design_apis` | 10 | 962 | 147,320 | 460.341 |
| `discover_knowledge` | 1 | 43 | 9,596 | 6.614 |
| `import_reference_image` | 2 | 565 | 10,001 | 813.212 |
| `read_knowledge` | 2 | 261 | 34,861 | 19.089 |
| `prepare_and_apply_design` | 4 | 22,364 | 7,222 | 16384.111 |
| `review_drawing` | 4 | 5,955 | 26,578 | 481.487 |
| `record_design_facts` | 1 | 604 | 2,105 | 7.603 |
| `execute_design_batch` | 1 | 199 | 437 | 11.232 |
| `select_design_references` | 1 | 1,450 | 4,082 | 3.020 |


The rejected describe_design_apis request combined unsupported selector/view
options. Its PREPARATION_REJECTED reply supplied corrections; it did not stop the
turn. This is distinct from the repaired image-delivery bug.

## Visual result and remaining work

The delivered overview shows the building from base through spire, with eight
projecting tiers, dense facade grids and two visible sides. Agent inspection of
the saved full image and three detail images confirms this visible extent; it
does not certify precise architectural dimensions or requested realism.

The model recorded one view pass and four failures: overall appearance (including
coin occlusion), base detail (missing side entrance beam and stone seams/depth),
tier detail (flat corners and frame edges), and crown detail (flat metal bands).
The model's accepted flag is false; these are model-authored observations, not a
substitute for independent architectural verification.

Persisted backend evidence contains 21,071 nodes: 21,059 vectors, seven ovals,
four groups and one workspace. Durable sequence is 666, generation 0. The normal
final snapshot/checkpoint/reload verification did not execute after the Stop
lookup failed. Therefore no final-memory equality or successful-reload claim is
made for this run. The retained full image was captured before cleanup, not by a
new model request or a separately generated renderer.

## Usage

| Metric | Value |
| --- | ---: |
| Input tokens | 2,440,083 |
| Cached input tokens | 2,338,176 |
| Noncached input tokens | 101,907 |
| Output tokens | 14,635 |
| Reasoning output tokens | 1,357 |
| Total tokens | 2,454,718 |
| Transport sent / received | 4,642,713 / 4,351,304 bytes |
| Exclusive provider / App / tool time | 568,343.463 / 16,798.379 / 2,355.559 ms |
| Recording gap attribution | 0 ms; provider report still incomplete |
| Video bytes | 51,502,479 |

Provider tokens are not account credit cost. Inclusive tool durations overlap
exclusive owner accounting and must not be added to it. The offline report was
built without model assessment. Owned service ports were clear after cleanup.

## Retained evidence

- [Run metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793612223281/run.json)
- [Offline execution report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793612223281/execution-report.json)
- [Full building image delivered to the model](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793612223281/provider-records/e2473f16-9644-4846-8441-7a932e1c873c.assets/1f4c00d8c52ac2fa8eee8542aad0d2dbe7c360f10d4c7fdd66168612664e6851.png)
- [Base image](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793612223281/provider-records/e2473f16-9644-4846-8441-7a932e1c873c.assets/6f7ec0120373dd5f0e20bc76f2d86a7f0f498b76c72f86d7c264c93345866dd9.png)
- [Facade detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793612223281/provider-records/e2473f16-9644-4846-8441-7a932e1c873c.assets/7778d7b3d8c36e182d4d041012612c7c9197c3b9f9c2a16b663d847efe03bb1c.png)
- [Crown detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793612223281/provider-records/e2473f16-9644-4846-8441-7a932e1c873c.assets/4485b8cf1c06abcaa617ff0e4c344f5faad8863eb09211e08bee1a4f35fa39ed.png)
- [Actual App failure screenshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793612223281/failure.png)
- [Full recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793612223281/recording.webm)

Raw evidence is retained under project-local ignored tmp and is not included in
Git. Reports must not relabel this run as completed or replace its failure record.
