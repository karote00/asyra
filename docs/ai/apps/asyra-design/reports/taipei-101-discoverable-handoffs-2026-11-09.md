# Taipei 101 - Discoverable handoffs and unlimited report instructions

## Result and evidence

Run `taipei-101-fixed-1794161375677` completed drawing naturally in
703,084 ms (11 minutes 43 seconds), within the unchanged fifteen-minute work
window. The original native thread then completed its detailed report in
306,778 ms (5 minutes 7 seconds), without a report timeout. The session remains
available for follow-up. No manual file edits occurred during drawing or reporting.

The drawing prompt SHA-256 is unchanged:
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
The exact 8,634-character report instructions from the earlier rejected run were
restored and delivered intact. This is not a shortened question set.

Evidence directory, relative to the repository root:
`tmp/conversation-improvements/live/taipei-101-fixed-1794161375677/`.

- `run.json`: configuration, timings, service PIDs, persistence and recorder outcome.
- `self-report.txt`: the original AI's complete public report, preserved verbatim.
- `self-report-evidence.json`: original work/report inputs, outputs and native identities.
- `self-report-summary.txt`: the separate short final summary; not the full report.
- `final.png`, `spire.png`, `base.png`, `native-detail.png`: inspected visual evidence.
- `recording.webm`: recording with four fit operations as the building grew.
- `source-snapshot.json.gz` and `reload-snapshot.json.gz`: unchanged reload evidence.

The native thread is `01a1bc5a-19d5-7933-ba60-73279727c01b`.
Work turn: `01a1bc5a-1a2b-72f0-a024-8729ba9bee1a`.
Report turn: `01a1bc64-ce90-7400-8a80-727b0a7a868c`.
Retained session: `a7f0b040-0175-4d2c-b3cc-609335face35` on port 3047.
The status endpoint was checked after completion and returned `waiting`.

## Startup failure and correction

The preceding attempt, `taipei-101-fixed-1794160792861`, failed before creating
a provider session or drawing anything. The browser's evaluation parser rejected
report instructions longer than 8,000 characters while reading the mutation
deadline. The outer transaction surfaced `AI_TRANSACTION_FAILED`.

This was an App test-admission defect, not a model refusal or drawing failure.
There is no original model report for that attempt because no model was started.
Its evidence remains intact. A temporary question condensation was reversed by
restoring the exact text from its recorded `evaluationWindow.reportInstructions`.

The correction removes the character ceiling in `readEvaluationWindow`, updates
the current execution spec and Inspector contract, and replaces the old overlength
rejection test. Nonblank string validation remains. There is no truncation,
compatibility route or replacement ceiling. The final short summary contract is
separate from the unrestricted public report and its question text.

Before the fix, three regression cases failed: the actual 8,634-character fixture,
8,001 characters and 16,000 characters. Afterward, all 28 evaluation-window tests
and 12 live-recorder contract tests passed. Focused ESLint and diff whitespace
checks passed. No full-local, release or CI suite was run.

## Observed drawing and delivery

| Signal | Recorded result | Interpretation |
| --- | --- | --- |
| Work completion | Native completion before deadline | Not an interrupted or timeout drawing |
| Public execution calls | 9 `execute_design` calls | 7 successful, 2 correctable admission rejections |
| Contract calls | 6, delivering 66,612 text bytes | Measured text payloads; not tokens or image bytes |
| Execution delivery | 11,973 text bytes and 7 images | Includes both rejected-call responses |
| Successful selected saves | 12 unique names | 5 drafts and 7 composition-ID arrays |
| Successful named bindings | 19 occurrences using 9 saved names | Excludes 6 attempted bindings in rejected E3 |
| Successful previous-step bindings | 2 | New group IDs passed directly into grouping |
| Separate saved-value fetches | 0 | No full draft read-back before reuse |
| Knowledge calls | 0 | Non-use alone is not a defect |
| Final document | 18,906 vectors, 320 ovals, 9 groups, 1 workspace | Object count is not visual acceptance |
| Persistence | Sequence and durable sequence both 619 | Reload document unchanged |
| Reporting | Same native thread; document unchanged | Complete report, retained session |
| Recorder errors | None; evidence errors empty | Independent of the model's quality self-assessment |

The first completed workflow visible in a tool receipt exposed the lower-tier
element count, not the entire first submission's count. Final document counts
above come from the captured canonical document, rather than summed partial
receipts.

## Actual execution boundaries

| Call | Submitted work | Handoff and outcome |
| --- | --- | --- |
| E1 | Base, lower tiers, upper tiers | Rejected before execution: previous-result `/preparationInput/draft/...` was not a guaranteed output |
| E2 | Base and lower tiers; save inputs and IDs | Succeeded; status and descriptive save index only |
| E3 | Upper tiers, crown, overview | Rejected before execution: missing nested `arguments` envelope for the capture wrapper |
| E4 | Corrected E3 | Succeeded; six named bindings reused projection, materials, members and window motif; overview delivered |
| E5 | Resolve and delete old spire bands; add ornaments | Succeeded; named projection reuse, status-only result |
| E6 | Add roof details, group, capture overview | Succeeded; seven named bindings and one previous-step binding |
| E7 | Read four group geometry fields | Succeeded; new bounds for local capture coordinates, not a saved-value forwarding call |
| E8 | Resolve/delete two brace sets, add braces, group, capture two targets | Succeeded; three named bindings and one previous-step binding; three images delivered including grouping capture |
| E9 | Reorder ornaments, capture detail and overview | Succeeded; saved `detailIds` and saved `finishIds` anchor directly bound; two images delivered |

Both rejected inputs returned `PREPARATION_REJECTED`, `not-started` and
`correct_input`. The existing evaluation policy allowed correction in the same
drawing turn. E2 and E4 prove recovery; no successful prefixes were replayed.
Input admissibility and predictable failures are not proof that every contract is
easy to use. The model attributes these two mistakes to its own authoring; that
self-assessment does not replace an upstream/downstream contract audit.

## Storage and image findings

The model reused `baseDraft`, `tierDraft`, `detailDraft`, `baseIds`, `tier1Ids`,
`upperIds`, `crownIds`, `detailIds` and `finishIds`. Each save receipt exposed its
name, producing operation, step, input/result source, selected path and bounded
shape. In particular, E4 reused upper-tier members without returning the complete
lower-tier draft to the model. E9 used saved IDs and an anchor in one operation.

`crownDraft`, `finishDraft` and `bracesIds` were saved but not consumed. These are
valid precautionary saves, not defects or waste metrics. No forced reuse or extra
registration was introduced. This run proves cross-call reuse in one drawing
turn; it does not independently exercise cross-turn reuse after a new user prompt.
That capability remains covered by the focused App-context tests.

The model deliberately selected multiple images in E8 and E9. The earlier
last-result-only selection pattern was not repeated in those calls. It did not
need to redisplay an old capture, so `read_design_inspections` remains unexercised
in this live run; the actual hidden-overview replay and lifetime tests provide
that owner evidence. New captures after edits were necessary for current-state
inspection. E6 also selected a grouping result with an automatic capture plus an
explicit overview without an intervening edit. That is a potential redundant
capture, not evidence for prohibiting visual verification.

The model notes that its isolated crown capture excluded later sibling details.
That selection cannot prove the whole crown assembly was missing those details.
The overview, spire, base and native-detail screenshots were inspected separately.
The visible result contains the complete silhouette and dense editable facade
detail; this does not establish exact real-world geometry or photorealism.

## Discovery and remaining qualifications

The six reads were scoped preparation usage; capture/context usage; purpose-based
deletion; purpose-based grouping; exact grouping usage; and exact relative-order
usage. No missing-identity retries or pagination reads were needed.

There is a remaining ranking qualification: the live query `group elements`
ranked `core.moveElements` first and `hierarchy.groupElements` second. The menu
showed the former's guidance sentence about group bounds. The model selected the
correct grouping candidate on the next call. The earlier regression proved the
longer purpose query `group existing elements preserve positions`, including
opaque names; it does not prove this shorter query ranks first. Do not claim all
grouping discovery is resolved, or change generic ranking from this observation
without reviewing its canonical metadata and existing compound-search cases.

The short-name capture usage was usable, but E3 still omitted its documented
argument envelope. The real failed parameters and delivered D2 contract are
retained. This is evidence for a focused contract usability review, not an
automatic instruction to add another mandatory lookup or validation workflow.

## Original AI report and independent limits

The full report contains fifteen sections, including execution tables, two input
errors, three visual corrections, source limitations, named reuse, capture
selection, waiting explanations and proposed improvements. Its recommendations
were not implemented during or after this run.

For long gaps, the model identifies preparing world-space geometry, changing
failed bindings, authoring the crown and ornaments, interpreting images and
choosing local capture coordinates. It explicitly lacks telemetry to apportion
model generation, provider scheduling and network time. These are supported
operational explanations, not measured causes or hidden reasoning.

Its useful proposed review directions include the capture envelope, guaranteed
binding fields, optionally combining bounds with an already-planned capture,
and eliminating redundant capture work. Existing host composition already covers
several of these routes; their non-use must not be described as missing features.
Visual decisions after receiving a new image remain legitimate model handoffs.
No new approval, quality gate or mandatory Knowledge step is justified by this
report alone.

The model initially declared the drawing complete, then qualified photorealism,
estimated dimensions and its lack of a visible persistence receipt. The recorder
independently confirms persistence and reload equality. The final App settlement
is `partial` because the report-only final action uses `unsupported` as its
self-assessment summary; the work turn itself completed naturally. This is not
evidence of a deadline stop, a transport failure or loss of drawing data.

Compared with the preceding completed observation, discovery delivery changed
from 8 calls / 87,142 bytes to 6 / 66,612; execution delivery changed from
11 calls / 5,905 bytes / 11 images to 9 / 11,973 / 7. Descriptive save receipts
carry more text, while this run directly consumed 9 saved names instead of none.
These are descriptive outcomes, not a controlled causal performance comparison:
the drawings and model decisions differ. The objective is useful continuity and
fewer unnecessary model handoffs, not the smallest possible receipt or shortest
tool computation time.

## Retained state

The service owns the idle report session after recorder completion. Backend PID
25620, collaboration PID 25621 and Vite PID 25624 remain on ports 4247, 4147 and
3047 respectively. No follow-up question is running. No commit or push was made.
