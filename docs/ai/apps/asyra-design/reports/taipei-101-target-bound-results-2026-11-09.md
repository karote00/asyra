# Taipei 101 - Target-bound execution results

## Outcome and evidence boundary

The target-bound action handoff is corrected. The preceding run's exact E6
parameters now execute creation, step-time region selection, grouping and both
dependent captures in one host invocation in permanent tests. Runtime and model
delivery use the same registered action identity; the private-batch model-owner
substitution was removed. Canonical input, target-count and missing-result
validation remain in place.

The new live run completed drawing voluntarily in 442.382 seconds and produced
an unlimited 436.238-second report in the original native thread. The reporting
session remains available. The AI revised its initial completion claim to an
unsupported full-delivery claim; App settlement is `partial`. This is not a
tool-failure stop or a deadline stop.

The live AI used named IDs and prior-step IDs for grouping, rather than the
recorded region-to-group route. It successfully bound groupId to captures in two
submissions. Formal coverage of the exact reported bug and live adoption of a
related route are separate evidence, not interchangeable claims.

## Reproducibility

- Run: `taipei-101-fixed-1794215656743`.
- Artifacts: `tmp/conversation-improvements/live/taipei-101-fixed-1794215656743/`.
- Provider request: `f5c12a6c-2fa1-4cb0-8f78-f977b27ad0b0`.
- Native thread: `01a1bf96-5bcf-7e00-b13f-4810084b552e`.
- Drawing turn: `01a1bf96-5c30-7981-be77-6db73d8e2b71`.
- Report turn: `01a1bf9d-151d-7b40-a420-7072c29d24ee`.
- Retained report session: `9da37126-e985-48ad-ab77-8fccf457e29b`.
- App: port 3050; owned document/collaboration services: 4250/4150.
- Drawing deadline: 900,000 ms; report timeout: null; keepReportSession: true.
- Unchanged prompt SHA-256:
  `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
- Base HEAD: `71ff3fa09786160fe2c0902c04f98e40c3858441`, with the existing
  task worktree changes. No commit or push was performed.
- No manual file edits or tests ran during drawing/reporting. The runner recorded
  evidence normally; the document was unchanged throughout reporting.

Original AI text is preserved unedited in `self-report.txt` (482 lines, 32,258
UTF-8 bytes) and `self-report-summary.txt`. Provider payloads, timestamps,
`self-report-evidence.json`, `self-report-turn.json` and `run.json` accompany it.
This document analyzes that evidence; it does not replace the original report.

## Implementation and validation

| Boundary | Correction | Proof |
| --- | --- | --- |
| Sequence compilation | Preserve the named target-bearing action and its typed result instead of replacing it with an opaque private batch | Recorded E6 fails before the change and passes after it |
| Registered wrapper | Admit canonical arguments or target-supplied arguments; resolve through the existing secured target and action owners | Actual Core construction/grouping, one region read after writes, two captures of the actual new group |
| Result consumer | Use the actual registered execution/model owner; remove single-batch owner substitution | Provider-visible declarations and native dispatcher execute the recorded sequence |
| Failure handling | Preserve expected-count, empty-region, failed-owner and missing-ID checks | Five parameterized recorded cases; no dependent captures on invalid results and no replay of acknowledged creation |
| Existing consumers | Preserve scalar artifact fan-out receipts and ordinary input validation | Operation suite and direct composition/prefix cases |
| Contract navigation | Expose wrapper alternative fields and argument choices without recursively expanding every owner | Current provider/native scoped navigation tests |

The permanent fixture is
`apps/asyra-design/server/__tests__/fixtures/recorded-101/target-group-capture-20261109.json`.
It includes the exact previous E6 request and the selected saved inputs it used.
The Core integration creates the real recorded geometry. Renderer-dependent
capture output is supplied by the test boundary; native-provider tests separately
verify image delivery. Neither test is represented as a real browser rendering
proof of the exact region route.

Focused results: 139 integration/host/delivery cases, 159 operation cases, five
native-provider cases and three directly affected composition cases passed.
Server type checking, naming and scoped diff checks passed. Scoped lint has no
errors and one pre-existing console warning in the provider test file.

Current-source positive Flow Inspector evidence passed at revision 30, attempt
`e0803658-d042-4d8e-a14b-53ec50f58ee1`, source digest
`73c2c12abb8985310098d1ef8a332d2ee162e27f5df30762eabd232415638d12`.
The omit-all-tools negative manifest was corrected to expect both registered-tool
and evaluation-report failures: the latter test actually consumes native tools.
The resulting negative run produced exactly those two failures.

Validation limitations are explicit: a broader composition-file run still has
24 unrelated retired automatic-review expectations. The broader negative flow
proof stopped on the unrelated `dispatch-rejected-history` mutation with missing
collected cases, attempt `17284c0d-667d-4c2f-ac4d-049d990c2d32`. Neither broad gate
is reported as passing. No full-local, CI or release validation was run.

Adding the current target wrapper increases the complete native same-context
acquisition contract to 33,793 bytes, versus the recorded 27,762-byte historical
baseline. The compact action route is 23,703 bytes; both still use two calls.
The old historical-size ceiling was replaced by explicit comparison while
retaining completeness, valid execution and recovery assertions. This change
fixes the handoff; it does not prove a payload reduction.

## Actual live discovery

These are model-visible response text bytes, excluding images, native initial
declarations, input payloads and private App exchanges.

| Call | Requested contract | Text bytes | Result |
| --- | --- | ---: | --- |
| D1 | prepare_and_apply_design - selected draft node types | 23,015 | Used |
| D2 | prepare_and_apply_design - projected-face repair | 7,269 | Used for rejected crown |
| D3 | inspect_drawing | 6,713 | Used |
| D4 | read_design_inspections | 4,052 | Used to recover omitted image delivery |
| D5 | Purpose search: delete elements | 11,781 | Candidate menu, followed by D6 |
| D6 | element.deleteElements and hierarchy.groupElements | 11,243 | Both used |
| D7 | map_retained_fills | 9,890 | Not used; AI chose new detail geometry |
| **Total** | **7 calls** | **73,963** | No missing-name recovery or pagination |

## Actual live execution

| Call | Sequence | Text bytes / delivered images | Result and return reason |
| --- | --- | --- | --- |
| E1 | base -> tiers | 2,276 / 0 | Two successful applications; crown input was prepared separately |
| E2 | crown | 3,088 / 0 | Nonplanar spire face rejected before writes; author correction required |
| E3 | crownFixed -> whole | 331 / 0 | Repair and capture succeeded; retain without explicit delivery suppressed the desired image |
| E4 | show | 418 / 1 | Redisplayed the already captured overview; no new capture or mutation |
| E5 | removeBelts -> belts -> group -> finalOverview -> detail | 1,197 / 2 | Region deletion, replacement, group and both captures succeeded; local image showed a platform |
| E6 | windows | 308 / 1 | Corrected local crop; image informed the next material decision |
| E7 | glassDetails -> wholeGroup -> latest -> finishDetail | 1,315 / 2 | New details, group and both captures succeeded; AI then ended drawing |
| **Total** | **7 calls, 16 submitted outer operations** | **8,933 / 6** | One recoverable author input rejection |

The six actual captures comprise three overviews and three detail crops. E3's
capture was not delivered then; E4 redisplayed it. Therefore six delivered images
does not mean seven new captures. The image count is separate from text bytes.

E5 grouped three named composition IDs and the newly created belt composition ID;
its overview bound `/actionResults/0/result/value/groupId` directly. E7 similarly
bound new detail IDs into grouping and the new groupId into both captures.
Neither group required a region query. E5's deletion did use a region query with
an exact expected count of three. No extra model call existed solely to read an
ID and forward it to an already decided action.

## Storage and stage continuity

Eight distinct names were requested, seven acknowledged and three ID names reused:
`taipeiBaseIds`, `taipeiTierIds`, and `taipeiCrownIds`. The crown author draft name
was not saved by the failed request. E3 successfully saved its result IDs.
Four acknowledged author-input saves were not reused; precautionary storage is
valid and is not classified as a failure.

Receipts described source input/result, producing operation, selected paths,
types and available ID index paths. These enabled direct named bindings without
value reads. There was no standalone stored-value read, shape-navigation call,
createdTargets request or keyToId lookup. Future-turn reuse was not exercised.

The AI used pattern, surface-grid, motifTemplates, overrides and linearFields.
It did not submit stages or mechanical iteration, read Knowledge or create a
reusable recipe. Those absences do not prove missing capability. E7 copied known
projection, tier boundaries and repetition values rather than binding the saved
draft; its new reflection motif was a genuine post-image design decision.

## Failures, avoidable handoffs and attribution

| Observation | Evidence and classification | Implication |
| --- | --- | --- |
| Spire face not planar | E2 rejected spireSun with precise path and retained draft; E3 repaired two faces and applied without replay | Recoverable author input error; keep validation and repair |
| First overview omitted | E3 requested retain, omitted delivery; declaration explicitly says retain defaults to status; E5/E7 later selected both images successfully | Supported behavior used incompletely, not a failed capture; D4 plus E4 were avoidable |
| First detail crop hit platform | E5 selected target-local (2600,1200,1024,1024); E6 changed to (2200,4200,1024,1024) | Author-selected region mismatch, not demonstrated renderer failure |
| Belt protrusion | Initial repeated translation did not account for taper; E5 deleted three targets and drew replacements | Visual authoring correction; ordinary design work is allowed |
| Flat material appearance | E6 informed new reflection and frame detail in E7 | Legitimate visual decision boundary; cannot predeclare its final design |
| Unused fill mapping contract | D7 succeeded; AI chose another technique | Exploration choice; non-use alone does not prove a search defect |
| Rewritten saved parameters | E7 reused values by copying, without a rejected binding | Existing reuse capability not adopted; no tool failure established |
| External source failures | AI reports PDF 403 and one screenshot timeout, with other sources available | Incomplete external evidence, not the target-bound result defect |

The AI attributes pauses to geometry preparation, contract reading, image
interpretation, repair and delivery recovery. That is its public operational
self-assessment, not measured internal reasoning. The first draft was submitted
at 199.739 seconds; its tool call took 7.896 seconds. The gap includes other
activities and cannot be labeled entirely model compute or tool latency. No
cross-drawing duration comparison is used as evidence of tool quality.

The AI proposes keeping local repair, reducing image-delivery mistakes, reusing
known parameters and targeting local inspection more precisely. It also proposes
clearer completion claims. These are observations to review, not authorization
to introduce mandatory review gates or automatically deliver every saved image.
No additional production change was made from this self-report.

## Final artifact and report qualification

Final counts: 21,453 vectors, 25 ovals and seven groups, plus the workspace.
Five applications created 21,486 elements in total; that is not the final count
because deletion and grouping followed. Whole-building and native-detail images
were inspected: the tower extends from base to spire, with dense editable window
details and regular repeated reflection shapes. This does not independently
validate all real-world dimensions, ornaments or photorealism.

The AI's report calls parallel projection a potential mismatch with perspective.
The prompt requests consistent perspective but does not explicitly require
vanishing points. Treat that as a design interpretation to assess, not a newly
established tooling defect or a mandatory new acceptance condition.

The AI lacked a visible durable-save receipt while reporting. Subsequent runner
evidence confirms sequence 681 equals durableSequence 681 and reload preserves
the document. Its uncertainty is valid within its available evidence; it is not
evidence that saving failed. `selfReport.documentUnchanged` and
`reloadDocumentUnchanged` are both true. No evidence errors were reported.

The video is `recording.webm` (74,215,276 bytes). Recorder framing fitted the
canvas at 201.966, 207.932 and 306.805 seconds as new extents appeared. The original
session remains waiting for follow-up, with PID-tracked services retained. The
worktree is intentionally not committed or pushed.
