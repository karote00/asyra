# Taipei 101 - executable contracts and decided handoffs

## Outcome and evidence

Run `taipei-101-fixed-1794165655396` exercised the four implemented handoff slices
with the unchanged fixed prompt and a 900,000 ms drawing ceiling. Drawing ended
by native completion after 300,983.84 ms, not deadline or evaluation interruption.
The original native thread wrote its unlimited report in 300,210.30 ms. The
report session remains waiting for follow-up. No manual file edits occurred during
drawing or reporting.

- Native thread: `01a1bc9b-64bd-7f72-8bbc-bd8e6d43189f`.
- Drawing turn: `01a1bc9b-6512-7161-b286-0e5e52747693`.
- Report turn: `01a1bc9f-f6b1-7003-96d8-deeef1d6c075`.
- Provider request: `69f37a9d-385b-4723-8116-b7e3c57f290c`.
- Retained session: `445dfa03-9bd9-4577-b0d4-7ad435cd6640`.
- Prompt SHA-256: `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
- Evidence directory: `tmp/conversation-improvements/live/taipei-101-fixed-1794165655396`.
- [Full original AI report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794165655396/self-report.txt) - 558 lines, preserved verbatim.
- [Run metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794165655396/run.json).
- [Final screenshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794165655396/final.png).
- [Recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794165655396/recording.webm).

The drawing turn reported completion. The retrospective's final `report_outcome`
was `unsupported` because the model would not certify every original requirement;
the App consequently displays `partial`. This is not a tool interruption. The
independent recorder confirms durable sequence 355, exact reload equality, and
unchanged document during reporting. The model's statement that it had no durable
receipt describes its available evidence, not a demonstrated storage failure.

## What changed and what verified it

| Slice                       | Production change                                                                                                                                                        | Permanent proof                                                                                                                                                    | Live observation                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Executable route            | Routed action discovery uses the registered host wrapper schema for short/qualified identities, usage/full/field reads; examples are wrapped once at registration        | Acquired capture example executes through the real host; the old flat capture input fails the delivered schema                                                     | Provider received required `arguments`, no host `argumentField`, and a correctly nested example; all submitted captures used the correct envelope              |
| Same-submission input reuse | Existing retain/input alias capability is exposed by an executable ordinary-operation example                                                                            | Recorded E1 geometry executes all three preparations with zero saved-value reads; generic example executes two applies                                             | Not adopted: camera parameters were repeated literally; no same-submission input alias was submitted                                                           |
| Result-to-consumer handoff  | Group owner declares its exact conditional result path; usage publishes typed named-step navigation. Context ID inputs now share the canonical document-reference schema | Group ID binds to the recorded bounds query in one call, one group and one read                                                                                    | Not exercised: no grouping or context read executed                                                                                                            |
| Purpose and selected images | Movement metadata describes container maintenance without incidental grouping terminology; existing outer defer and selected media are verified                          | Short/long grouping queries succeed with real and opaque names; one group plus two explicit captures produces exactly two selected images and no automatic capture | Purpose-based deletion found a usable owner immediately. Final sequence returned both selected images, but one was an avoidable automatic intermediate capture |

The group-to-read test exposed a real upstream/downstream mismatch: the context
consumer imposed `maxLength:256` on IDs while producers use the shared document-ID
contract without that restriction. Static admission correctly rejected the pair.
Context ID and parent/ancestor inputs now use the shared contract. Name filters
are unchanged; no Runtime schema relaxation or group-specific exception was added.

Full result-schema discovery retains its original projection branch. Review found
and fixed a regression that attempted compact result-path materialization even
when a caller explicitly requested the full schema. The existing scoped-result
proof detects this; the compact navigation does not impose an extra requirement.

No compatibility parser, second result store, alias resolver, forced Knowledge
read, mandatory planning step or automatic capture suppression was introduced.

## Actual acquisition and execution

Text byte counts below are provider-visible UTF-8 response text, excluding image
bytes and provider-internal/network traffic. KB means 1,000 bytes.

| Metric                                         |        Observed |
| ---------------------------------------------- | --------------: |
| Contract calls                                 |               4 |
| Contract text                                  |    45,406 bytes |
| Host calls                                     |               5 |
| Host response text, including recovered error  |     8,025 bytes |
| Delivered drawing images                       |               4 |
| Knowledge calls                                |               0 |
| Context-read executions                        |               0 |
| Shape/full saved-value readbacks               |               0 |
| Successful distinct saved names                |               7 |
| Named references submitted/consumed            | 1 - `tierIds/0` |
| Calls only forwarding previously produced data |               0 |
| Correctable geometry rejection                 |               1 |
| Blocking tool/recorder errors                  |               0 |

| Query                                                 | Text bytes | Result                                          |
| ----------------------------------------------------- | ---------: | ----------------------------------------------- |
| `prepare_and_apply_design`, selected draft node types |     20,834 | Executable scoped construction contract         |
| `inspect_drawing`, usage                              |      6,688 | Correct host envelope and executable example    |
| `read_design_context`, usage                          |     11,342 | Acquired but never executed                     |
| `delete elements`, usage                              |      6,542 | Usable deletion contract on first purpose query |

No pagination, missing-name recovery, repeated contract acquisition or truncated
contract delivery occurred. The unused context query is a real avoidable discovery
round trip in this run; it was the model's exploration, not a required tool gate.

| Host call | Explicit steps                                                     | Text bytes / images | Outcome and handoff                                                                       |
| --------- | ------------------------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------- |
| E1        | base construction → eight-tier construction                        | 2,256 / 0           | Both applied; four named saves; status delivery                                           |
| E2        | crown construction → overview                                      | 3,067 / 0           | Crown rejected before writes; overview did not run                                        |
| E3        | retained crown repair → overview                                   | 545 / 1             | Field-level repair applied; image delivered                                               |
| E4        | detail capture bound to `tierIds/0`                                | 307 / 1             | Direct named ID use, no value readback                                                    |
| E5        | resolve/delete old bands → construct replacements → final overview | 1,850 / 2           | Ten targets resolved inside host and deleted, replacements applied, final image delivered |

Ten explicit steps were submitted, nine reached execution/preparation, and eight
completed successfully. E2's blocked overview was subsequently submitted in E3.
This count excludes internal preparation/application/selection work.

The original crown used five non-coplanar vertices at `/children/27/vertices`.
The owner returned `NONPLANAR_FACE`, `settlement:not-started`, retained `draftId`
`fe63958c-097f-4878-8a09-e4ac759c50f7`, and a precise replacement route. E3 replaced
that field with three vertices and succeeded. Existing base/tier writes were
preserved. This was an authored geometry error caught by valid input validation;
it is not recurrence of the wrapper or fabricated preparation-output errors.
The strict test allowed correction in the same drawing turn.

## Storage, images and remaining round trips

Seven confirmed saves are `baseDraft`, `baseIds`, `tierDraft`, `tierIds`, `crownIds`,
`detailDraft`, and `detailIds`. E2 requested `crownDraft` and `crownIds`, but neither
was saved on that failed step. E3 successfully saved `crownIds`. A failed save
request is not a save acknowledgement. Unused successful saves are valid future
context, not a failure or waste metric.

E4 directly binds `tierIds/0`; E5 resolves its region/name targets inside the host.
Neither requires the model to obtain a full ID list. E5 is a demonstrated example
of known deletion, replacement and capture running without a model handoff between
them. E3 likewise joins correction and overview.

E1 and the crown preparation had no intervening image decision, but the complete
crown parameters had not been submitted yet. That is incremental authoring, not
proof that a fully prepared step was blocked by the tool. E3-to-E4 adds a visual
decision point; the agent planned a close-up generally, but the record does not
establish that the exact region was known when E3 was submitted.

E5 did not set outer `inspection:"defer"`. Its construction step set local defer,
but that does not suppress another step's automatic capture. It selected the whole
`removebands/actionResults` and `finalview/actionResults`, so both an intermediate
crown image and final overview were returned. Existing outer defer and narrow
selected receipt fields already avoid this. The AI suggestion to add inspection
control is therefore not evidence of a missing capability. No new gate is warranted.

Saved camera and template reuse remains an available choice. The model repeated
camera literals and used separate templates with variations. The exact same-call
input path is tested formally but unexercised live; this run cannot establish its
adoption or a persistent inability to find it.

## Original AI assessment and its limits

The full report explains waits in terms of research, authoring world-coordinate
geometry and repeated surfaces, crown construction, field repair, image inspection,
and later target/operation selection. It explicitly has no provider/network timing
telemetry and does not assign precise causes or duration shares. Measured App tool
durations are not a measure of all model preparation, research or transmission.
Do not infer improvement from drawing duration across different artwork.

The AI recommends preserving pre-write geometry checks, exact field repair,
status-plus-save receipts, region-to-mutation handoff, and ordered host execution.
It identifies the unused context lookup, fixed-radius bands on a taper, and
repeated camera parameters as opportunities. These distinguish input choices and
visual refinements from tool defects.

Several proposed changes are not adopted:

- A mandatory final evidence/completion checklist conflicts with the accepted
  lightweight contract. Honest reporting needs no new App approval gate.
- Additional inspection controls duplicate the outer defer already available and
  now formally exercised with two selected captures.
- A convenient portable corrected-draft save is a potential future question; this
  run proves request-local field repair, not a missing general persistence feature.
- Knowledge may help geometry decisions, but no Knowledge route was exercised;
  non-use alone cannot establish a defect or require more prompts.

## Drawing and recorder verification

The final canonical snapshot contains one workspace, four groups, 11,135 vectors
and eight ovals: 11,148 elements including workspace. The report's receipt-derived
11,147 excludes workspace and matches that count. Four applies reported 2,949,
6,649, 760 and 799 elements; deletion removed ten.

Overview, crown/spire, base and native-scale detail screenshots were inspected.
They show the full main tower, tier silhouette, individual window framing, platform
seams and major ornaments. They do not establish surveyed dimensions or complete
photorealism. The model acknowledges approximate local dimensions, an orthographic
interpretation, and no full attached shopping podium. Tool execution success does
not certify those visual/user-intent questions.

The recorder fit the live view after the first three major document growth points.
The approximately 53 MB WebM is available alongside final/reload/detail screenshots.
Report-phase document equality and reload equality are both true; persisted and
durable sequence are both 355. The browser closed after evidence collection while
the native report session and its three required services remain available.

## Validation and completion

- Discovery/search: 164 focused cases passed.
- Created-target integration: 65 existing/other cases passed together; the corrected
  new two-image assertion and capture-envelope case then passed. All 66 cases have
  passing evidence; no production change was made for the fixture's media assertion.
- Current-source Flow Inspector candidate: all 89 cases passed, attempt
  `4203d765-1dcc-47cf-bd11-1fc05487cf9f`.
- Contract review accepted:
  `d46986e9a00d7822bf4c53694040841d6cab8dd4e4addd1976314391fac23134`.
- Server typecheck passed; naming 15 cases passed; scoped lint has zero errors and
  one pre-existing console warning; scoped diff check passed.
- Only focused checks were run; no full-local, release, publishing or CI workflow.
- One live drawing was launched for this task. No commits or remote operations.

The four bounded implementation slices are complete. Observations above separate
verified behavior from unexercised capabilities and future optional investigations;
this report does not authorize another implementation cycle.
