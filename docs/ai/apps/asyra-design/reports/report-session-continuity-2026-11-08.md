# Retained report session observation - November 8, 2026

## Outcome and scope

The original native session survived initial request settlement, video collection,
browser closure and recorder command return. Two later report-only questions ran
on that same native thread. It remains waiting for questions, with no automatic
closure and no idle model calls. This completes the session-retention observation;
it does not complete the remaining context, delivery and reuse plan.

The single fixed-prompt drawing attempt had a 15-minute ceiling and stopped at
677.359 seconds because a recoverable review rejection failed outer result-schema
validation. It was not a completed drawing or a deadline stop. The original AI's
initial report and two follow-ups completed without a reporting time limit.
No source, test, configuration or documentation edits occurred during drawing,
reporting, follow-up generation or live evidence collection. After both answers
completed and the session returned to waiting, only documentation and the combined
report presentation were written. The original report bodies remain unchanged.

## Evidence

Run: `taipei-101-fixed-1794072813674`.
Provider request: `2665b01f-a9ed-4231-9bd3-338edf9482d6`.
Native thread: `01a1b712-c89e-74b1-9b26-780473cf81f6`.
Retained service session: `ddd83f88-1b76-4409-8f1d-79879cd2e745`.

- [Run record](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794072813674/run.json)
- [Complete original-agent reports](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794072813674/complete-ai-reports.md)
- [Initial AI report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794072813674/self-report.txt)
- [First follow-up](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794072813674/followup-01a1b723-8fbb-7592-804b-da8ab312a34e.txt)
- [Second follow-up](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794072813674/followup-01a1b72c-3700-7d31-a779-559d7def2885.txt)
- [Final screenshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794072813674/final.png)
- [Recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794072813674/recording.webm)

| Phase                 | Native turn                            | Observed duration | Result                                    |
| --------------------- | -------------------------------------- | ----------------: | ----------------------------------------- |
| Drawing               | `01a1b712-c8fb-7b30-90c6-411d26f6ee6a` |         677.359 s | Interrupted by strict tool-failure policy |
| Initial report        | `01a1b71d-18d4-7342-9234-ab1010187c57` |         289.469 s | 422 lines, 32,827 bytes                   |
| Context follow-up     | `01a1b723-8fbb-7592-804b-da8ab312a34e` |         322.350 s | 495 lines, 35,342 bytes                   |
| Operational follow-up | `01a1b72c-3700-7d31-a779-559d7def2885` |         126.647 s | 243 lines, 13,662 bytes                   |

Initial durations come from provider event elapsed time. Follow-up durations are
wall time between retained input/output file timestamps, including evidence I/O;
they are not measured reasoning time. The first follow-up exceeded five minutes
and completed successfully. The same process/thread remained available afterward.

The drawing contains 18,853 non-workspace elements: one Frame, five Groups,
18,798 Vectors and 49 Ovals. Recorder persistence reached sequence 600 / durable
sequence 600; reload content matched. Report-time document equality passed.
Evidence errors and browser/service errors were empty. Strict tool failure remains
the run outcome despite successful evidence collection.

The initial provider JSONL SHA-256 remained
`35716448942b36578ea4d3c7fef93886eec26d395adbc225cec834d50525c0cb`
and the persisted document SHA-256 remained
`ec0af32b643173c5376b7971fa3a29b01776fc90f2cb71273b51723222d3969a`
from a snapshot during the first follow-up through completion of the second.
Follow-up exchanges live separately under the
request's `.followups` directory; they do not append to the sealed initial record.

## Confirmed defects versus agent choices

| Observation                                   | Evidence and implementation check                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Classification                                                                                                                                                                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E10 could not deliver a recoverable rejection | Inner review returned `PREPARATION_REJECTED`, `not-started`, `correct_input`, before capture. Its message was `Conflicting source uses or supersession for one capture check.` Outer `execute_design` then returned `TOOL_DELIVERY_INVALID`. `local-tool-host.ts` registers the common failure schema for Runtime leaves, but its model-stage `recoveryContract` reconstructs results from the original owner definition. That alternate projection omits the common failure alternative. | Confirmed App contract handoff defect; preserve the inner cause and settlement through model egress. Do not change strict stopping to hide it.                                                                                                       |
| E10 repeated check metadata conflicted        | The overview declared supersession for `detail/tiers` and `detail/crown`; detail captures repeated those check identities without supersession. `local-design-review.ts` requires identical check metadata across the capture batch, and existing tests reject inconsistent source uses.                                                                                                                                                                                                  | Invalid agent input. The agent interpreted supersession as a once-per-unit declaration. A precise existing-rule example and located diagnostics are justified; a shared-check API is a separate proposal, not an existing capability.                |
| E8 image bytes leaked into recovery text      | `responseTextBytes=45821`, `imageCount=0`; the diagnostic retains a redacted data URL at `/failure/execution/recovery/0/value/actionResults/1/result/image/dataUrl`. `localToolImages` handles canonical `execution` and `executionResult`, but not the surrounding retained-result `failure` envelope.                                                                                                                                                                                   | Confirmed text/media handoff gap. Preserve image provenance and successful-prefix recovery; do not search arbitrary user payloads or discard evidence.                                                                                               |
| E1 selected step `0` did not exist            | E1 provided unnamed operations but retained `step:"0"`. The owner rejected it before execution. E2 named `facts` and `calc` and succeeded.                                                                                                                                                                                                                                                                                                                                                | Agent input error; a better located diagnostic is useful, but this was not unavailable storage or a lost result.                                                                                                                                     |
| E8 replacement geometry was nonplanar         | Independently rounded upper/lower ring vertices broke the shared ratio. Retained draft repair replaced four vertex fields and succeeded without repeating deletion.                                                                                                                                                                                                                                                                                                                       | Correct validation plus repairable authored geometry. Preserve validation. A new radial geometry primitive is not yet authorized or proven necessary.                                                                                                |
| E8 deleted before preparing the replacement   | Delete succeeded; replacement preparation then rejected the draft.                                                                                                                                                                                                                                                                                                                                                                                                                        | Agent ordering choice. Existing prepare/apply separation can validate before deletion; do not introduce silent transactional replay.                                                                                                                 |
| Saved data was mostly unused                  | 18 unique acknowledged names; `taipeiRoot` was consumed. Other names were held for possible continuation, or literal values were already available.                                                                                                                                                                                                                                                                                                                                       | Not a blanket storage defect. Initial report's 19-name total was corrected by the first follow-up.                                                                                                                                                   |
| E9 copied saved geometry fields               | Actual E3 `bodySource` projection and two face vertex arrays equal E9's projection and grid boundaries. Paths `/projection`, `/children/0/members/1/vertices` and `/children/0/members/3/vertices` are concrete reusable fields.                                                                                                                                                                                                                                                          | Available named selection not used. No binding rejection occurred. Add a focused real-input proof before claiming the proposed replacement has executed successfully. New mullion motifs and roof-shadow coordinates still need new authored values. |
| E6 construction and E7 capture were separate  | D5 already supplied capture usage; root/body IDs, criteria and reference receipts existed. Crown ID could bind to E6 output. The agent confirmed no new image or judgment was needed before these three overviews.                                                                                                                                                                                                                                                                        | Avoidable control handoff using existing capability. Do not count it as a pure value-fetch call or remove the judgment boundary after capture.                                                                                                       |
| Reference image delivery worked in this run   | E4 import selected the whole result and returned its image; E5 chose permitted uses after viewing it. No refresh/readback call was needed.                                                                                                                                                                                                                                                                                                                                                | Preserve this path. Viewing before choosing reference use is a real decision boundary; this does not disprove the prior run's different selected-field failure.                                                                                      |

## Contract load and preparation

There were 11 `describe_design_apis` calls totaling **136,076 model-visible text
bytes**, including wrappers and pagination. These are not measured tokens or model
reading time. Individual replies were 23,072; 7,807; 23,050; 6,112; 9,691; 14,778;
11,355; 11,596; 12,015; 6,821; and 9,779 bytes.

The first construction selection had 26,813 content bytes and required two pages.
It was complete after continuation. The agent successfully used projection,
surface grids, repetition, motif overrides, bindings and saved author inputs.
Large size alone is not evidence of lost understanding or the cause of a pause.

The follow-ups identified concrete reading burden: short nonsemantic `$defs`
names, unused layout/relations/shared-fill branches in the selected construction
scope, and route/result-shape distinctions. The agent could not identify an existing
smaller selection that would exclude those branches while keeping its actual
inputs. Its suggested guide structure is a hypothesis to test against the same
valid and rejected inputs; do not replace constraints with an incomplete summary.

Preparation was not manual enumeration of all windows. The submitted parameters
expanded into approximately 3,600 base-window motifs, 7,680 main-tower motifs,
5,120 later mullion/seal motifs and 384 roof seams. These are authored-count
calculations, not additional measured document counts. Preparing face coordinates,
proportions, ornament contours, materials and ordering still required decisions.
No measurement separates those tasks from provider scheduling/network time.

No Knowledge tool was called. The request-local Knowledge loader cannot explain
this run's pauses. Cache work remains subject to work-count and invalidation
measurement; a backend cache hit would not by itself reduce delivered contract text.

## Next implementation boundary

Continue the approved plan with the two reproduced delivery defects as the first
bounded correction: preserve common recovery contracts through model projection,
and carry canonical failure-envelope image provenance to native egress. Regress
with E10's exact conflict and E8's successful-prefix recovery; cover direct,
composed and retained/selected result routes without mutation replay.

Then use actual D1 inputs to reduce unused selected-contract branches while keeping
all used geometry, material, expansion and recovery constraints. Prove the concrete
E9 named-field substitution and E6-plus-capture composition with existing tools.
Do not add universal planning, mandatory Knowledge, forced saved-value reads,
a radial geometry tool or a shared-check API on this report alone.

The native successful-prefix report supplement, remaining storage/image variants,
cache measurement and cross-turn reuse proofs are still pending. This observation
confirms the session handoff, not every item in the wider plan. The retained native
session must remain available for user questions. A Vite service restart would lose
this ephemeral process; do not start subsequent server-source edits while that
session is still required. Its status/ask/close commands are documented in
[AI development and debugging](../modules/ai-development-and-debugging.md#retained-evaluation-report-sessions).

## Validation and review

- 49 selected session/provider/HTTP/evaluation-parser cases passed.
- 12 maintained collector cases passed.
- Two exact source-flow cases passed through the source proof configuration.
- Server type check and naming gates passed; scoped lint has no errors and three
  existing console warnings. App and required local service builds passed.
- Self-review covered loss after settlement, cancelled partial public answers,
  queued-question closure, release of closed provider closures, original-request
  abort detachment, and denial of tools during reports.
- An accidental broader test-name filter ran 179 provider-related cases: 176 passed
  and three tool-declaration expectation cases failed (old recipe/example schema
  expectations and unconditional deferred loading). This slice did not alter those
  declarations. They remain recorded follow-up work, not a full-provider pass claim.
- No full local test suite, release validation, commit, push or PR operation ran.
