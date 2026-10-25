# Drawing continuity observation - 2026-10-26

The run produced an editable initial drawing but did not exercise the second-turn
handoff. The collector stopped on a settled `partial` outcome after successful
creation and a deliberately unfinished visual criterion. This is a test eligibility
mismatch, not evidence that the conversation-history fix failed or passed in drawing.
Do not repeat the model run to turn this missing observation into a pass.

## Scope and source

- Run: `knowledge-taipei-101-continuity-1792947710242`.
- Started: 2026-10-26 01:01:55.093 Asia/Taipei.
- Work budget: 120 seconds shared by both turns; final report maximum 60 seconds.
- Actual collection: 79.370 seconds, one request, no retry and no video.
- Original provider: gpt-6-astra / medium, verified from its native record header.
- Production expanded-node limit remained 10,000; no evaluation override.
- HEAD: `04d87366167e048e719129b67f10dbb6929fd5f2` plus preserved local changes.
  The run source archive is authoritative; source remained unchanged during work.
- Run artifacts: `tmp/knowledge-evaluation/knowledge-taipei-101-continuity-1792947710242/`.
- Provider originals: `tmp/drawing-continuity-provider-1792947666341/`.
- First request reuses the frozen 101 brief and two hash-verified references, with
  an explicit initial-pass scope. The planned second request preserves geometry,
  identities, viewpoint and composition while refining existing glass/metal.
  It was not sent. This is not the unchanged single-turn full-artwork experiment.

Only the observation runner, its deterministic tests and observation contracts
changed in this task. Product code, Knowledge content and production limits were
not changed. Six collector tests plus seven watchdog tests passed; lint, naming
and diff checks passed. Inspector revision 131 admitted the observation contract;
verification `3099904a-8a8b-4b1b-9287-71299ab6bb02` passed its mapped boundary cases.
Those tests did not prove that the inherited continuation gate was suitable for
an intentionally incomplete drawing; this live run exposed that gap.

## Results and attribution

| Boundary | Original evidence | Finding |
| --- | --- | --- |
| Prepare and create | One `prepare_and_apply_design` input, 25,111 bytes. Reply says 8,006 elements; `apply_prepared_design` is complete with matching applied count | Successful creation, no resend or creation replay |
| Actual document | Before: one workspace. After: 8,007 IDs, preserving the original workspace. Turn-1 and final document files are byte-identical | Created objects retained; no second mutation after settlement observed |
| Snapshot | `inspect_drawing` is available, completed, `partial:false`, with a retained overview image and evidence binding | Successful capture, not proof of material quality |
| Visual recording | AI bound the overview, then recorded `overall:pass` and `finish:fail`, with `final:false` | Initial completeness and unfinished finish were distinguished |
| Tool receipt versus artwork acceptance | Both `review_drawing` calls succeeded at their operations; returned `accepted:false` and the pending finish criterion | No hidden claim of final artwork acceptance behind operation success |
| UI settlement | At 73.040 s the ordinary message is `partial`, listing missing reflections/shadows, ornament and base details | A retained incomplete drawing; not a failed create operation |
| Continuation gate | `runConsultationPhases` accepts only `success` or `no-change` after saving a settled result | The harness blocks the very partial initial result intended for follow-up |
| Second-turn context, edits and nonreplay | No second App request or native input exists | Unobserved; cannot close the drawing-continuity DoD |
| Final diagnostic report | Only a final request enters report mode, and that request was never sent | No dedicated self-report; ordinary first-turn result text was captured |

The main AI explicitly acknowledged flat-color materials and missing detail. Its
check result is recorded evidence of its judgment, not an independent material
quality oracle. The inspected first/final screenshots show a full tower initial
pass with repetitive facade divisions, roof surfaces and spire. This observation
does not certify exact proportions, all required decoration or realism.

The collector inherited a success-only gate from non-drawing consultation. For
this drawing experiment, an incomplete but settled and retained initial drawing is
not inherently an unsafe predecessor. A bounded follow-up should distinguish that
case from execution failure, cancellation, pending writes, missing evidence and
expired deadlines. The next deterministic correction should exercise those cases
before any separately authorized live rerun. Do not relabel `partial` as success,
relax final acceptance or automatically replay the first drawing.

## Timeline

Offsets are seconds after the first Send. First content means observed nonzero
canonical bounds plus a screenshot, not a precise GPU paint timestamp.

| Interval or point | Event | Duration |
| --- | --- | --- |
| 0.000-9.098 | Initial delivery and native work before first Knowledge call | 9.098 s |
| 9.098-9.113 | Targeted Knowledge discovery and App architectural entry read | 0.015 s |
| 9.113-12.391 | Interval before drawing usage query | 3.278 s |
| 12.391-12.433 | Selected draft/projected-face/surface-grid/pattern usage | 0.042 s |
| 12.433-15.811 | Interval before continuation page | 3.378 s |
| 15.811-15.812 | Remaining drawing-contract page | 0.001 s |
| 15.812-19.016 | Interval before material-method read | 3.204 s |
| 19.016-19.017 | Material-method Knowledge read | 0.001 s |
| 19.017-46.995 | Interval before first drawing submission | 27.978 s |
| 46.995-52.033 | Prepare/apply and overview capture | 5.038 s |
| **51.900** | **First frame observed and screenshot saved** | Within apply span |
| 52.033-54.327 | Interval before review usage query | 2.294 s |
| 54.327-54.329 | Review usage query | 0.002 s |
| 54.329-58.092 | Interval before evidence binding | 3.763 s |
| 58.092-58.105 | Bind overview to two criteria | 0.013 s |
| 58.105-65.290 | Interval before recording judgments | 7.185 s |
| 65.290-65.307 | Record initial completeness pass and finish fail | 0.017 s |
| 65.307-72.854 | Remaining native work to completion | 7.547 s |
| 72.854-73.040 | App partial outcome observed | 0.186 s |
| 73.040-79.370 | Per-turn document, screenshot and answer capture; sequence stops | 6.330 s |
| After 79.370 | Final document/screenshot verification and cleanup | Outside model work |

Native records attribute about 5.125 s to observed tools and 67.445 s outside those
spans. The latter is not measured reasoning. No further investigation of unavailable
native parameter-stream internals is needed for this result. Total time is not a
controlled speed comparison against earlier one-turn or two-turn consultation runs.

## Knowledge and data

| Measure | Observed |
| --- | --- |
| Knowledge calls | One targeted discovery, two reads |
| Tool discovery | Exact-name scoped drawing usage in two pages, then review usage |
| All recorded tool argument bytes | 27,696 |
| All recorded tool reply bytes | 67,372 |
| Drawing argument bytes | 25,111 |
| Repeated Knowledge body | 1,964 bytes of the architectural App entry in the material-method read |
| Provider-reported input tokens | 285,453, including 248,576 cached |
| Provider-reported output tokens | 1,933 |

The AI selected relevant advice rather than the entire catalog. Repeated delivery
and pagination were observed, but are not the target of this experiment and are
not evidence of a new regression caused by the context fix. There is no second
request with which to measure cross-turn reuse. Tokens and tool bytes have distinct
measurement boundaries and are not a billing calculation.

## Evidence completeness

All five execution streams pass the public Runtime record parser with no issues.
All 48 referenced payload files, including image bytes, exist and match their
recorded size and SHA-256. The nine completed tool calls have original argument
and reply payloads; there are no unfinished tool calls in those records. The main
App request is `631cc2c8-9d6f-4543-92dc-10028367672f`; native drawing request is
`a53311c2-a891-416e-8a2e-66f4115c8b17`. Durable batch records acknowledge sequences
through 252. This does not replace a fresh-context reload equivalence test.

Saved artifacts include exact prompts, first ordinary result text, per-turn and
final documents, before/first/final screenshots, source archive and original
provider streams. `analysis.json` is derived and does not replace originals.
The ordinary first-turn path does not independently retain its full native
work-input and final native output envelopes. Native protocol summaries and the
actual UI result cannot be relabeled as those missing raw envelopes. The outer
model HTTP request is also unavailable. No dedicated final evaluation report or
second-turn artifacts exist; no complete-I/O claim is made across those boundaries.

All three task-owned services were stopped with process identity checks. The
immediate cleanup assertion raced process disappearance; a subsequent PID/listener
check found none remaining. Original stop and later verification receipts are
retained. No model rerun, push or CI inspection was performed.
