# Taipei 101 - Direct observations without approval ceremonies

## Scope and evidence

This closes the authorized implementation target in
[Agent Context and Report Continuity](../plans/agent-context-and-report-continuity-plan.md).
It does not certify architectural accuracy or turn the primary AI's suggestions
into additional implementation scope. No full-local test, release, commit or push
was performed. The original drawing prompt was unchanged.

Run: `taipei-101-fixed-1794155277890`.
Evidence root: `tmp/conversation-improvements/live/taipei-101-fixed-1794155277890/`.
Provider request: `adb1a040-33e7-48a8-a84b-98bc229e3a07`.
Original native thread: `01a1bbfd-0f51-7a61-851c-0a67a5de7c35`.
Drawing turn: `01a1bbfd-0fa6-7d41-bc10-5221a9b5baec`.
Report turn: `01a1bc08-2368-7340-af52-4dc4470f3be3`.

The report is preserved verbatim in `self-report.txt` (34,686 bytes), with
`self-report-evidence.json` and `self-report-turn.json`. Its final assessment is
more qualified than its initial drawing completion message. Keep both as evidence.
The recorder exited successfully. The report session remains `waiting` at the
App on port 3046; the preceding retained session on port 3045 remains available.
No source or documentation was edited while the AI produced its report.

## Implemented boundary

- Removed mandatory criteria registration, data-evidence review, bind/record
  judgments, reference-use approval signatures and App completion approval state.
  Deleted their owners and retired their formal obligations; no compatibility
  endpoint, optional legacy mode or renamed approval gate remains.
- Canonical observations and optional authored reference/fact/calculation context
  no longer require approval registration. Preserved source identity, decoding,
  coordinate validation, request lifetime and actual input/output validation.
- Removed unrequested post-write quality measurements. Preserved requested
  captures, explicit mechanical analysis, cancellation, unknown writes, transaction
  settlement and persistence. The AI performs final visual verification.
- Corrected canonical native-wrapper invocation envelopes and purpose discovery.
  Corrected selected union schema validation and inherited request lifetime in the
  shared Runtime; optional dependencies are checked before their consumer executes.
- Updated current prompts, Knowledge, specification, API surfaces, Inspector,
  direct consumers and regression tests. Historical recordings were not rewritten.

## Focused validation

| Owner boundary                                  | Evidence                                                                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Observations, context and prepared construction | 93 focused cases passed                                                                                     |
| Construction/discovery consumers                | 185 passed; intentional skipped cases unchanged                                                             |
| Flow, Knowledge and evaluation consumers        | 112 passed                                                                                                  |
| Runtime admission                               | 87 passed, including union projection and inherited request-lifetime regressions                            |
| Final selected retention/provider consumers     | 23 passed after rebuilding the Runtime facade                                                               |
| Recorder contracts                              | 13 passed                                                                                                   |
| Browser persistence/material/detail consumers   | Four affected browser cases passed; screenshot inspected                                                    |
| Current flow contract                           | Candidate `43138412-63a4-4c66-9c84-7cc2057026d0` passed; explicit retirement accepted                       |
| Static gates                                    | Server types, naming and scoped lint passed; one existing console warning remained in the final scoped lint |

Review caught and corrected: native-wrapper argument mismatch, composability of
canonical captures, selected union validation against the wrong envelope,
inherited request-lifetime loss, stale approval fixtures and one obsolete wording
assertion. The browser's first attempt used the wrong backend port; aligning its
configured backend resolved the environment mismatch without a persistence patch.

## Measured run results

| Measure                                        | Result                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| Drawing allowance                              | 900 seconds                                                             |
| Drawing elapsed, recorder request-relative     | 727.684 seconds (12 min 7.7 sec)                                        |
| Drawing stop                                   | AI completed; `stoppedAtDeadline:false`, `stopReason:null`              |
| Report elapsed                                 | 355.042 seconds (5 min 55 sec); no report deadline                      |
| App contract queries                           | 8; 87,142 response text bytes                                           |
| `execute_design` calls                         | 11; 5,905 response text bytes; 11 images                                |
| Research calls                                 | 3; separate from App tool acquisition                                   |
| App tool failures / authored schema rejections | 0 / 0                                                                   |
| Named saves / subsequent named consumption     | 22 / 0                                                                  |
| Direct producer-to-consumer ID bindings        | 2 successful composition-to-order bindings                              |
| Final document                                 | 29,262 vectors, 676 ovals, 9 groups and one workspace                   |
| Persistence                                    | `sequence:956`, `durableSequence:956`; reload document unchanged        |
| Report isolation                               | `documentUnchanged:true`                                                |
| Recording                                      | `recording.webm`, 97,229,056 bytes; fit framing recorded during drawing |
| Evidence collection errors                     | None                                                                    |

Response byte counts exclude image bytes and internal App exchanges. Nested host
operations are not additional model calls. No cross-drawing timing comparison is
used to infer tool quality or benefits.

## Handoffs observed

| Sequence | Submitted operations                                         | Interpretation                                                                     |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| E1       | Base and tower construction                                  | Known work delegated together; capture was deferred                                |
| E2       | Workspace overview                                           | Could have followed E1 without another model dispatch                              |
| E3       | Crown and ornament construction                              | Two prepared drafts delegated together                                             |
| E4       | Overview and detail captures                                 | Both executed; only the last result was selected for delivery                      |
| E5       | Facade reflection and rails construction                     | New design decisions after looking at the detail image                             |
| E6       | Group six roots                                              | Existing IDs reused; group contract was acquired separately                        |
| E7       | Fill mapping over 924 elements                               | Visual correction after seeing roof checkerboarding                                |
| E8       | Two named detail captures                                    | Both results/images delivered and saved                                            |
| E9       | Four target deletions, replacement construction and ordering | New composition IDs bound directly to ordering without a model relay               |
| E10      | Overview and joint captures                                  | Existing total-group target known; could have followed E9                          |
| E11      | Seam construction, ordering, overview and detail captures    | Complete decided construction-to-observation sequence; direct ID binding succeeded |

The final sequence demonstrates that the current host already supports the
combined path. The earlier separated calls do not establish a missing capability.
No compulsory review registration or approval call occurred.

## Primary AI report checked against implementation

**One image was omitted by the authored selection, not by rendering.** E4 used
`delivery.fields.detail.path:"/actionResults"` without a step ID. The provider's
`execute_design` contract explicitly says that an omitted step selects the final
result. `local-design-sequence.ts` owns this meaning. Later E8/E10/E11 explicitly
selected both named captures and each returned two images. The extra query
`display existing inspection image` returned a menu and was abandoned. This is
observed discoverability/authoring friction, not evidence that two-image delivery
is unsupported or that capture must be repeated.

**Saving worked; cross-stage named reuse was not exercised.** Eight drafts, eight
composition-ID lists and six capture results were saved. No `kind:"named"`
consumer or shape/value read was submitted. Projection, face boundaries and
repetition settings were authored again in later drafts. The AI acknowledges that
this was not a workaround for a rejected binding. Successful saving alone does
not establish reduced model input or cross-turn reuse in this run; formal focused
tests cover those supported paths.

**Several handoffs were optional; visual decisions remained necessary.** E1/E2
and E9/E10 could have been one dispatch using known capture targets. Roof colors,
corner replacement and the second seam correction were decided after inspecting
images. The two real composition-to-order bindings succeeded. There were no
observed calls exclusively to return an existing value and forward it unchanged,
but this does not mean all 11 execution calls were necessary.

**Waiting explanations are self-assessment, not telemetry.** The AI describes
preparing large drafts, researching dimensions, reading selected contracts,
repeating projection/boundary parameters and visually choosing revisions. The
record confirms these calls and inputs. It does not identify private model
processing, scheduling or network delay. Do not present those causes as measured.

**AI-visible persistence uncertainty differs from recorder verification.** The AI
says it did not see a final durability receipt. The recorder subsequently confirms
matching sequence 956 and identical reload content. Preserve its statement as its
visibility limit; do not describe this run as a failed save.

**Final quality remains qualified.** The original AI initially reported completed,
then its retrospective explicitly qualified realism, estimated dimensions,
orthographic projection and simplified podium/ornament geometry. The final App
settlement is `partial`, consistent with that AI-authored report, not a restored
approval-ledger rejection. Overview and native detail screenshots were inspected;
they show editable architecture and detail, but cannot certify every requested
dimension or architectural likeness.

## Remaining findings, not additional changes

The run supports the removal target: actual work, observations, storage and honest
settlement proceed without the retired approval ceremony. It does not exercise
reference selection/import, Knowledge use, saved named consumption, declarative
mechanical iteration, unknown writes or cancellation. Those remain bounded formal
test responsibilities rather than unearned live-test claims.

Potential further work is evidence-led: examine why the AI chose last-result-only
delivery, how useful saved inputs remain discoverable across stages, and why it
split already-decided captures. Do not add mandatory registration, forced reuse,
Taipei-specific geometry, an artistic approval gate or new prompt rules from the
self-report alone. Suggestions about default materials, automatic capture targets
and durability presentation require their own current-contract review.
