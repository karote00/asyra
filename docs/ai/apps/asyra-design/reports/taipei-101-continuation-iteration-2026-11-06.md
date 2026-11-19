# Taipei 101 continuation iteration - 2026-11-06

This report covers the current bounded task only. The launch allowance is 30;
it does not apply to other tasks. Each drawing uses the unchanged full-building
prompt with a fifteen-minute limit. The original AI writes an untimed report in
the same native thread after drawing settles.

Prompt SHA-256: `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
Implementation branch: `codex/ai-conversation-improvements`.
The source of each launch is preserved in `tmp/continuation-iteration/attempt-NN-source/`
and its SHA-256 manifest. No launch result is retroactively attributed to later code.

## Interpretation and evidence boundaries

The final user policy permits ordinary visual changes and correctable drawing
inputs. Actual App/tool/data failures that block work or cause abnormal termination
stop drawing. Attempts 1–12 were run under an earlier stricter policy. Attempts
15–19 exposed incomplete application of the revised policy: valid input rejection
was still treated as an immediate evaluation stop. Original records remain intact.

Execution success, a model's visual acceptance and persistence verification are
separate claims. The original AI's explanations are retrospective self-reports,
not independent proof of internal reasoning. Time outside App calls includes
model generation, provider scheduling, native research and other activity; it is
not a measured reasoning duration.

## Launch-by-launch causal review

| Attempt | Classification | Observed problem | Adjustment | Verification and limits |
| --- | --- | --- | --- | --- | --- |
| 1 | Execution contract mismatch | Criteria definition was excluded from composition; the first sequence was rejected before drawing. | Admit the existing criteria owner to the sequence; preserve eager application and empty-canvas evidence cleanup. | Criteria composition first exercised in 6; eager application in 2; empty evidence cleanup in 3. |
| 2 | Retention contract and evidence lifecycle defects | Whole-result/request-handle retention and authored-input paths conflicted with the public contract. A large snapshot closed the browser; report transport cancellation then lost the original report. | Separate portable values from handles; normalize authored inputs; chunk snapshot transfer; keep recorder-owned same-thread reporting alive after request transport closes. | Portable input retention and large evidence transfers exercised in 6 and later; disconnect recovery has focused proof. Original report 2 is unavailable. |
| 3 | Output contract mismatch | Required host acknowledgement and conditionally available artifact paths were conflated during source-path validation. | Guarantee host acknowledgement at its owner and validate branch-specific public result paths without inventing success. | Live preparation/retention in 6; admission regression tests cover branch conditions. |
| 4 | Correct contract rejection | AI requested retention of the entire nonportable base receipt. | No production change between 4 and 5; preserve rejection. | 5 repeated a related request-handle mistake; this was not a successful correction. |
| 5 | Upstream lifetime guidance conflict | AI tried to retain artifactId across turns; its request lifetime was incompatible with named storage. | Expose portable fields, whole-result permission and forbidden fields consistently in concise and machine contracts; preserve request-handle lifetimes. | 6 and later saved valid authored inputs/public values; 10 consumed a named value. |
| 6 | Invalid selector and old evaluation gap | A required delivery path was omitted. The then-strict controller had also missed a preceding recorded visual failure. | Fix the then-current visual-stop observer; select examples from valid requested branches. The later user policy intentionally superseded visual-stop behavior. | 7 exercised the old visual-stop path. Since 13 visual refinement is allowed; do not describe the old policy as current. |
| 7 | Selected guidance defect; visual stop under old policy | An unsuitable minimal vector example was selected for the requested branch set; drawing stopped on material feedback. | Rank validated examples by selected branch coverage instead of globally reordering or expanding all examples. | 8 received the corrected selected contract; receipt does not prove AI adoption. |
| 8 | Native-detail contract mismatch | A full target exceeded the native-detail maximum; an overview image was not a substitute. | Use the existing authoritative capture limit in schema/capture/recovery; preserve exact detail bounds and specific failure diagnostics. | 14 captured explicit 1000x1000 and 1000x500 regions; 15 captured five 1024x1024 regions. |
| 9 | Missing grid material capability | Repeated cell-local reflections required correction; world material fields were supported for faces but not surface grids. | Extend the canonical grid compiler/override/export path to the existing material-field model; verify solve counts and invalidation. | 10 used grid fields, without proving visual acceptance. Export and invalidation remain focused-test evidence. |
| 10 | Authored coordinate error | A reused world projection was applied beneath a nonzero group parent, introducing a second translation. | Keep parent-local semantics; preserve the exact four-draft/canonical-parent regression. No production geometry change. | 11 was a different zero-origin frame case, not a recurrence. Formal signed-coordinate tests cover 10. |
| 11 | Evaluator false positive | I manually stopped a valid zero-origin frame case after incorrectly transferring attempt 10's diagnosis. | Preserve both actual fixtures; require current canonical evidence before external manual geometry stops. Do not patch the renderer. | 12 proceeded without the erroneous geometry stop. The original AI report adopted supplied stop claims and is not independent confirmation. |
| 12 | Normal visual refinement under superseded policy | Translated decorative belts did not follow a taper; other visible details still needed refinement. No tool had failed. | No automatic taper or patch geometry. Apply the user's revised policy: allow ordinary visual corrections. | 13 and 14 continued after failed visual reviews; 14 completed. |
| 13 | Image-delivery defect | Selecting actionResults moved inline image data into fields without its native media channel; AI received 303374 text bytes and zero images, then searched for a nonexistent redisplay operation. | Preserve invocation-local canonical media provenance through selected result delivery and split image bytes into native media. Also fix authored-input schema roots. | 14: selected named-step receipt, 799 text bytes and one image. 15: selected direct group receipt, 845 bytes and one image. Different images/payloads are not a compression benchmark. |
| 14 | Completed drawing; adjacent failure-boundary defect found afterward | Drawing completed in 12m38.681s. Adjacent tests exposed pre-existing double projection of raw browser failure prefixes. | Recognize only acknowledged host envelopes as host results; preserve raw browser completed prefixes without replay. Correct stale contract revision pins. | 40 host tests and 87 captured flow cases passed. The browser-failure prefix is focused-only; successful live runs do not exercise it. |
| 15 | Correctable input stop and lost diagnostics | The member-name prefix did not match generated pattern-prefixed names: zero matches versus 24 expected. The controller replaced public issue text with a generic failure, so the original AI could not diagnose it. | Keep literal targeting and expectedCount guards. Preserve public host issue strings/structured messages in the bounded same-thread stop reason. Later policy review confirmed the complete valid zero-match result should permit input correction; correct_input delivery and evaluator handling were fixed before 18. | Exact stop message live-verified in 16 and 17. Safe correction is covered by formal regressions before 18; live verification remains separate. |
| 16 | Correctable input stop; diagnostic fix verified | Member names were again used as prefixes of expanded grid/pattern names. Reflection mapping selected zero rows (no-change); ring deletion rejected zero targets before later drawing steps. | No fuzzy targeting or geometry workaround. The attempt-15 diagnostic fix delivered the exact zero-target/no-mutation reason to the original report thread. Subsequent end-to-end review identified evaluation false stopping; preserve literal selectors while returning formal correct_input before mutations. | The report input at 299-input.json contains the concrete stop reason. Selected image delivery was not exercised by this attempt; ordinary capture returned six images. |
| 17 | Correctable geometry stop and recovery handoff defect | Nonplanar spire face was correctly rejected with a retained draft and repair guide. Evaluation stopped before correction; selected/status host delivery also dropped formal recovery. | Preserve projected failure recovery and its request lifetime; complete region counts become host-owned correct_input; permit safe input correction across formal envelopes while retaining blocking-error stops. | 265 owner, 23 provider, and 88 captured flow cases pass; actual retained-draft repair succeeds with one write. 18 did not exercise retained-draft repair. 19 proved projected recovery reached the native reply, but exposed a later duplicate-summary stop. Safe continuation remains formally verified. |
| 18 | Known native-control route misuse and incomplete admission recovery | The AI had the correct control-plane/native-tool contract for reference selection but placed it inside execute_design. The host rejected before dispatch; generic recovery prose triggered evaluation stop before a direct-route correction. | Keep control operations native. Preserve owner-declared correct_input through typed admission errors and canonical schema rejection; do not suppress missing capabilities, unavailable context, or acknowledged/unknown execution. | Exact recorded input plus differently named controls fail on the prior source. Native direct calls, no-dispatch rejection, schema correction and acknowledged-prefix negatives pass. Neither 19 nor 20 exercised this control-route correction; do not claim live verification. |
| 19 | Duplicate native outcome and report-collector identity defects | The App delivered the complete safe-correction receipt, but a correlated native failed summary stopped work about three milliseconds later. Editing a test during the report caused Vite reload; the collector then accepted another request settlement and killed the original unfinished report. | Reuse canonical App completion ownership in evaluation and protocol admission. Scope report waiting to the original provider request. Prohibit file edits during drawing/report/evidence collection. | Formal regressions reproduce both defects and pass after correction. Full original report 19 is lost; retain its partial public stream explicitly as incomplete. 20 ran without blocking failures and retained its complete report; neither corrected failure edge occurred, so those edges remain focused-test evidence. |
| 20 | Valid timed run; artwork acceptance incomplete | No blocking App/tool failure. Two normal visual refinement rounds continued; the deadline interrupted final visual acceptance after eight images arrived. | No further product change justified by this run. Retain the canvas, complete original report, pending checks and successful reload verification. | 28 successful outer calls; 11 named saves and eight named input references. Same-thread full report, unchanged reload, zero evidence errors. Recent failure-path corrections remain focused-test evidence. |

## Upstream and downstream review

The repeated failures did not have one cause. Distinguish:

- Public contracts versus canonical owners: criteria composition, conditional
  output paths, authored-input roots, portable retention and capture limits.
- Capability gap: grid material fields required the existing face-material model
  to reach the grid compiler, overrides and export path.
- Delivery defects: selected images lost their native channel; raw browser failure
  prefixes were projected twice; selected failures lost their repair references.
- Evaluation defects: visual refinement and later explicit input recovery were
  interrupted, and one manual geometry diagnosis incorrectly reused another run.
- Ordinary model decisions: incorrect literal prefixes, nonplanar geometry,
  translated ornaments on tapered surfaces and unused available capabilities.

The correction policy is not implemented by hiding failures. Complete reads may
return a correctable no-match/count receipt before writes. Incomplete reads and
unknown settlement still fail. A recoverable child cannot hide an independent
result-delivery defect. The original AI receives the formal recovery, decides its
correction and revalidates it. Successful prefixes are not replayed.

## Focused validation before attempt 18

The recorded nonplanar preparation and selected/status delivery regressions fail
on the previous source. The strict provider regression also detects premature
interruption. The corrected source passes 265 owner/evaluation cases, 23 focused
provider cases, and 88 captured execution-flow cases. The same-host proof repairs
the retained draft and writes once in both selected and status delivery modes.
Negative cases preserve blocking-error stops.

Accepted flow revision: 11. Source digest:
`46aed640c43340624bbaeac372fd938cee026244dc886e970f0cbb08e96748a4`.
Accepted-source verification:
`3a346a1e-ab32-48d6-840e-1d9c682ebacc`.
Server and proof type checks, naming, scoped lint and diff checks pass.
Scoped lint retains two existing console warnings. No full local suite, CI,
release, publication, commit or push was run for this continuation.

## Original reports and known evidence loss

The original reports are copied byte-for-byte into
`tmp/continuation-iteration/original-ai-reports/`, with source paths and SHA-256
hashes in its manifest. The report for attempt 2 was lost after browser and report
transport failure. It cannot be reconstructed as the original AI's report.
Attempt 19 also has no complete original report: an operator edit caused a dev
reload, then a cross-request settlement bug terminated collection. Its 17,220-byte
public delta stream is retained as partial evidence, never as a complete report.
The native thread was ephemeral; do not create a substitute session/report.
Attempt 11's original report contains the evaluator's mistaken premise; preserve
it as evidence, not as validation of that premise.

The task ends at 20/30 launches. The latest run completes timed execution and
evidence collection without blocking defects; artwork acceptance remains pending.
There was no commit, push, full local suite, CI or release execution.


## Recorded attempt metrics

Text bytes and images count outer App tool replies, excluding nested host calls.
The App time is the union of outer call intervals, not a model-thinking metric.
Attempts stopped early are not equivalent completed-drawing benchmarks.

| Attempt | Work | Report | App calls | Reply text bytes | Native images | Reload unchanged |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 4:31.259 | 4:02.173 | 6 | 60,628 | 2 | True |
| 2 | Unavailable | Unavailable | 5 | 55,201 | 0 | None |
| 3 | 4:47.582 | 4:20.608 | 5 | 53,479 | 0 | True |
| 4 | 3:05.862 | 4:29.175 | 6 | 63,011 | 2 | True |
| 5 | 4:17.124 | 7:02.973 | 4 | 54,179 | 0 | True |
| 6 | 6:32.906 | 4:55.944 | 13 | 135,884 | 1 | True |
| 7 | 6:29.271 | 5:27.323 | 14 | 133,748 | 4 | True |
| 8 | 6:18.431 | 5:22.630 | 8 | 66,457 | 1 | True |
| 9 | 10:35.043 | 6:50.208 | 9 | 70,077 | 4 | True |
| 10 | 7:19.491 | 6:17.573 | 10 | 77,484 | 1 | True |
| 11 | 8:35.288 | 5:39.426 | 6 | 50,000 | 0 | True |
| 12 | 7:19.414 | 5:52.189 | 11 | 75,822 | 4 | True |
| 13 | 10:28.606 | 6:28.243 | 28 | 519,112 | 2 | True |
| 14 | 12:38.681 | 6:17.164 | 32 | 196,971 | 14 | True |
| 15 | 11:13.991 | 5:55.332 | 22 | 153,646 | 11 | True |
| 16 | 8:45.023 | 5:36.348 | 15 | 122,738 | 6 | True |
| 17 | 5:21.411 | 4:07.919 | 7 | 64,129 | 0 | True |
| 18 | 8:45.212 | 4:44.978 | 11 | 72,271 | 2 | True |
| 19 | 5:00.169 | Incomplete | 8 | 63,783 | 3 | Unavailable |
| 20 | 14:59.727 - deadline | 7:34.629 | 28 | 224,436 | 20 | True |

## Current-source verification and its limits

The attempt-19 native-summary regression and cross-request report-collector
regression both failed before implementation. Final focused verification passes
24 provider cases, 20 evaluation cases, 12 collector cases and 89 captured flow
cases. Server/proof types, naming, scoped lint and diff checks pass. Scoped lint
has four existing console warnings and no errors.

Accepted flow revision 13, source:
`60dbd8e59d9c493c65d85d9ca1892a6d9b51714c8236a5fa9326e19cfa309943`.
Accepted verification: `b0f1bda6-9994-4682-8a10-344cd3850da3`.
All 177 archived changed/untracked source files match their pre-launch hashes
after attempt 20; no source edit occurred during drawing or reporting.

Attempt 20 proves the ordinary live path and visual correction policy. It does
not independently exercise every previously corrected failure. In particular,
safe rejection followed by native failed summary and disconnected report waiting
remain focused-test evidence. The launch cap is a ceiling, not a target or a
statistical reliability guarantee.

## Attempt 20 - measured timeline

Times are relative to provider execution. The runner's deadline begins slightly
earlier, accounting for work settlement at 899.727 seconds instead of 900.000.

| Interval/event | Measurement | Evidence and interpretation |
| --- | --- | --- |
| Initial discovery and construction preparation | Before 220.181 s | Four App contract calls plus native research; not all time belongs to App execution |
| Facts plus base | 220.181-223.256 s | Two host steps; 260 text bytes; three named saves |
| First paint opportunity | 221.282 s | Runner observation, not proof of final visual quality |
| Eight tiers | 323.095-328.948 s | One host step, compact repetition and three named template/projection references |
| Crown plus coins | 425.592-426.907 s | Two host steps, four named references, 318 text bytes |
| First visual capture | 445.270-445.537 s | Four images; AI later rejects repeated pane gradients and incomplete podium |
| Data exploration | 528.168-533.177 s across two calls | One empty literal-prefix selection followed by a small complete sample; no tool failure |
| Reflection, podium, calculations | 642.558-645.612 s | Three host steps; 270 text bytes; subsequent visual review still needed |
| Second visual capture | 683.804-684.080 s | Eight images, including native-detail crops |
| Ordered local edits | 837.430-840.717 s | Sort, add Fill, update three Fill groups; 84 text bytes; named podium IDs consumed |
| Final visual capture | 892.225-892.578 s | Eight images received; no subsequent final judgments before deadline |
| Work settlement | 899.727 s | `work-deadline`, no latched tool-failure stop |
| Original report | 454.629 s after report entry | Complete 32,565-byte public commentary; same native thread |

The final canonical document contains 16,638 vectors, 40 ovals and five groups,
plus its workspace. Both report-time equality and reload equality pass. This
later harness evidence supplements the AI's report; the AI could not observe
checks performed after its report. Reload equality does not retroactively mark
stale/failed visual criteria as accepted.

## Data transfer and reuse

| Outer App call category | Calls | Reply text bytes | Measured interval total | Images |
| --- | --- | --- | --- | --- |
| Contract discovery | 14 | 160,205 | 0.639 s | 0 |
| Host execution | 7 | 8,390 | 16.941 s | 0 |
| Review/capture/data | 7 | 55,841 | 1.039 s | 20 |
| Total | 28 | 224,436 | 18.620 s | 20 |

These are text payload bytes, not tokens, native image bytes or total wire cost.
The maximum text reply is 23,072 bytes. Discovery contributes about 71.4% of reply
text, while execution is compact. Thus another round of shrinking successful
mutation receipts is not supported as the main opportunity in this run.

Eleven named values are confirmed saved. Actual inputs contain eight named
references: seven projection/Fill/motif slots from baseSource in tier/crown/coin
drafts, and podiumIds in the final sort. These are actual consumption, not merely
intent to reuse. The sort also resolves its anchor through a live region query.
No step-output bindings, stages, mechanical iterations or cross-user-turn reuse
occurred. No pure data-forwarding-only outer call was identified; initial drafting
calls nevertheless split work without intervening visual judgment.

The final five-step edit demonstrates known sequential work can remain inside
the host. Visual review cannot be moved into a deterministic host loop merely
because it takes time. The empty prefix query returned correct data; it required
the AI to revise a targeting assumption rather than an App repair.

## Original AI recommendations checked against evidence

| AI observation/recommendation | Verified status | Disposition |
| --- | --- | --- |
| Same gradient repeats per pane | Initial contract already warns that local gradients restart; grid material fields already exist | Genuine drawing-method mistake; not evidence that the compiler needs a new reflection mechanism |
| First correction became too flat, second added highlights | Calls and two visual reviews confirm this sequence | Normal design iteration. A layered initial material may reduce rework, but no measured counterfactual proves the time saving |
| Podium addition covered the tower | AI recorded the overlap, then used existing sort with named IDs and a live anchor | Correctable authored order; no geometry, renderer or automatic layer heuristic change justified |
| Combine base, tiers and crown | No image boundary between the three initial calls | Potential dispatch reduction; submitting all parameters up front can delay first paint. No measured same-input comparison was run |
| Preserve semantic target sets | Current IDs, artifact membership and named values already support reuse; podiumIds was consumed | Investigate selection strategy before adding a second target store |
| Material-purpose search missed | Exact query returned a truthful complete no-lexical-match response plus category recovery | Discovery friction, not a missing capability or thrown tool error. Broader material usage was large and not fully read |
| Source facts were overclaimed | AI itself acknowledges absent auditable source content in its current context | Treat external verification as unproven. Saved provider metadata cannot establish whether native search originally delivered full pages; do not diagnose App data loss from this report alone |
| Knowledge could help | No Knowledge calls; applicable material behavior was already in the delivered contract | Possible targeted aid, not a mandatory reading rule or proven latency improvement |
| Add timings | Recorder already measures App boundaries; AI does not receive all recorder metadata | Measured tool time is available for analysis. Provider scheduling/generation decomposition remains unknown |
| No final persistence confirmation | True from the reporting AI's perspective | Later harness reload equality passes; artwork acceptance still incomplete |

The original AI counts five web calls. The recorder observes eight native
research-completed items. These are different counting surfaces; neither count
is substituted for the other. Likewise, thousands of internal action receipts
are not thousands of AI round trips. Report wording and original bytes remain
unchanged; corrections are in this analysis.

## Comparison boundary and remaining work

Attempt 14 completed and accepted its drawing at 12:38.681. Attempt 20 reached
the deadline with pending final judgments. Do not rank their completion speed or
claim stable completion from this pair. Observable workload differs: 14 has
32 outer calls, 196,971 text bytes and 14 images; 20 has 28 calls, 224,436 bytes
and 20 images. Fewer calls here do not establish less total work or a speed gain.

The bounded implementation/testing task is complete: no blocking App/tool defect
was observed during the current-source fifteen-minute window, same-thread
reporting and evidence cleanup succeeded, and the remaining issues are disclosed.
This is not a claim that every future model-generated input succeeds or that the
latest artwork has passed final visual acceptance. Do not introduce further
prompt mandates, automatic geometry corrections or speculative tools from this
self-report alone.

## Deliverables

- Complete latest original report: `tmp/conversation-improvements/live/taipei-101-fixed-1793972096963/self-report.txt`.
- Final overview and detail images: `final.png`, `tiers.png`, `base.png`, `spire.png` in the same run directory.
- Continuous recording: `recording.webm` in the same run directory; 120,984,204 bytes.
- All original reports: `tmp/continuation-iteration/original-ai-reports.zip`; manifest records 18 complete reports, one partial report and one unavailable report.
- Per-launch evidence paths and corrections: `tmp/continuation-iteration/attempts.json`.
- Per-launch measured totals: `tmp/continuation-iteration/attempt-metrics.json`.
- Pre-launch source manifests: `tmp/continuation-iteration/attempt-NN-source.json`.

## Per-launch evidence index

Paths are relative to the worktree root. Each run directory contains its original
provider records and available screenshots/video; each source manifest is in
`tmp/continuation-iteration/attempt-NN-source.json`.

| Attempt | Run directory under tmp/conversation-improvements/live | Original report in bundle |
| --- | --- | --- |
| 1 | `taipei-101-fixed-1793940821364` | `attempt-01.txt` |
| 2 | `taipei-101-fixed-1793942054718` | `Unavailable` |
| 3 | `taipei-101-fixed-1793943438488` | `attempt-03.txt` |
| 4 | `taipei-101-fixed-1793946411154` | `attempt-04.txt` |
| 5 | `taipei-101-fixed-1793947050700` | `attempt-05.txt` |
| 6 | `taipei-101-fixed-1793948243380` | `attempt-06.txt` |
| 7 | `taipei-101-fixed-1793950347595` | `attempt-07.txt` |
| 8 | `taipei-101-fixed-1793951748371` | `attempt-08.txt` |
| 9 | `taipei-101-fixed-1793953206847` | `attempt-09.txt` |
| 10 | `taipei-101-fixed-1793955783162` | `attempt-10.txt` |
| 11 | `taipei-101-fixed-1793957004552` | `attempt-11.txt` |
| 12 | `taipei-101-fixed-1793958291931` | `attempt-12.txt` |
| 13 | `taipei-101-fixed-1793959745424` | `attempt-13.txt` |
| 14 | `taipei-101-fixed-1793962348567` | `attempt-14.txt` |
| 15 | `taipei-101-fixed-1793964076499` | `attempt-15.txt` |
| 16 | `taipei-101-fixed-1793965734324` | `attempt-16.txt` |
| 17 | `taipei-101-fixed-1793966684502` | `attempt-17.txt` |
| 18 | `taipei-101-fixed-1793968797184` | `attempt-18.txt` |
| 19 | `taipei-101-fixed-1793970528365` | `attempt-19-partial.txt` |
| 20 | `taipei-101-fixed-1793972096963` | `attempt-20.txt` |
