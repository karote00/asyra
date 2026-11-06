# Taipei 101 - regional evidence - fifteen-minute budget - 2026-11-03

## Outcome

The single authorized run **completed successfully in 693.783 seconds
(11 minutes 33.783 seconds)** using the unchanged canonical prompt. The model
recorded all seven required visual checks as passed, read 371 passed request
checks with no failed, unverified or stale checks, and returned a completed
response. Final runtime evidence validation remained current. The fifteen-minute
budget did not trigger cancellation.

The finished drawing, durable checkpoint and reloaded document are exactly equal:
17,356 nodes, comprising one workspace, five groups, 17,329 vectors and 21 ovals.
That is 17,355 drawing objects, rather than 17,356 drawable primitives. Source
hashes were unchanged during the test; all 2,080 referenced evidence hashes passed.

This result is not evidence of a guaranteed speed improvement. The preceding run
was incomplete and is not a completed-task timing baseline. Model planning,
geometry, references, checking and repair choices differ between runs. The
runtime fix has a separate deterministic before/after regression proof; the new
Knowledge advice was not retrieved during this live run.

Association: [regional evidence and occlusion diagnosis](../plans/ai-design-agent-plan.md#follow-up---regional-evidence-and-occlusion-diagnosis---2026-11-03).
Background: [preceding evidence review](taipei-101-decision-delegation-analysis-2026-11-03.md).
No additional model assessment, second live run, product changes during the run,
full local suite, publication or remote operation was performed.

## Implemented changes and bounded review

### Regional evidence owner

The real-App regression creates a Group whose enclosing bounds cross a crop while
none of its children contributes pixels to that crop. Moving an outside child out
of the Group changes Group bounds but leaves the crop byte-identical. Before the
fix, the crop receipt became stale; every other assertion passed.

`apps/asyra-design/src/common-apis/inspection-evidence.ts` now excludes that
non-painting enclosing extent from direct regional membership **only when the
current registered renderer is the exported Preset Group renderer**. It uses the
public Core registry, not a list of container type names. Actual contributing
children still retain their Group ancestors. Custom or unknown render strategies
remain conservative. Whole-target receipts still become stale, and real member
entry, Undo and paint changes still invalidate regional evidence.

The change is in the inspection dependency adapter. It changes neither render
output nor hierarchy operations, adds no image-hash cache and does not suppress
canonical events. It does not attempt to preserve every world-equivalent Group
normalization: a Group that actually contributes through its descendants remains
a dependency. The formal test proves this specific false dependency class, not
that every identical crop in the preceding run had precisely the same cause.

Self-review checked the registered-strategy distinction, contributing ancestry,
regional entry/exit, existing ordering coverage, unchanged receipt lifetime,
unknown/custom strategy preservation, whole-target behavior and no added redraw.
Repeated currency checks do not repeat capture or regional membership reads once
the receipt is current. The source includes both the real-App regression and
focused registered-strategy tests.

### Optional Knowledge

`apps/asyra-design/knowledge/design.architectural-illustration.spatial.md` now
explains the distinction between moving a containing group and reordering its
children. It advises identifying the actual occluder, choosing the smallest
appropriate move and checking the remaining occluder after a partial repair.
The discovery description advertises that diagnosis.

The advice is explicitly optional. It adds no App prompt, drawing stage, detail
quota, required check or mandatory retrieval. The existing real-catalog test
verifies delivery of the new advice and exclusion from unrelated contexts.

### Focused verification

| Gate | Result |
| --- | --- |
| New real-App Group/crop regression before production change | Failed on false receipt invalidation; pixels identical and all negative cases correct |
| Same regression plus existing scoped inspection E2E | 2 passed, 15.2 s |
| Inspection evidence, dependencies and Knowledge suites | 68 passed, 2.00 s |
| Fixed Taipei 101 prompt/deadline contract | 4 passed |
| Naming gate before/after identifier-bearing slice | Passed |
| ESLint on the four directly changed TypeScript files | Passed after two spacing corrections |
| Focused diff and whitespace review | Passed |
| Inspector module | Loads with its existing seven steps; not a whole-plan acceptance claim |

The matching execution spec and `inspect` condition/contributor documentation were
synchronized. No Framework package implementation or global validation policy was
changed. Earlier uncommitted conversation changes remain preserved in this worktree.

## Run identity and reproducibility

| Field | Value |
| --- | --- |
| Run | `taipei-101-fixed-1793652131268` |
| Provider request | `8f582fa3-b55c-48de-bc57-7adcd0b17668` |
| Source runtime request | `3b90e891-0945-43da-a067-b2c46063b685` |
| HEAD | `a1ed9040315a70be8a6fbf13c79b072536d6ac0d` plus retained uncommitted patch |
| Provider source fingerprint | `b2fa18ac6e82e27582611f4275bfb29f6167bf856357e0349f9cc000927a83ba` |
| Patch SHA-256 | `d08d4d3949f2601f04dc8dea018d13ec5679a722f40e3cdbc7e538e499faca83` |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Model / effort / provider | gpt-6-astra / medium / local-codex |
| Submitted, Taiwan time | 2026-11-03 04:42:16.192 |
| Model request | Exactly one fixed-fixture prompt, no attachments or coaching |
| Command | `yarn workspace @asyra/asyra-design test:live:taipei-101 --minutes=15` |
| Base URL | `http://127.0.0.1:3045` from the preserved App `.env` |
| Viewport | 1920 x 1080, DPR 1 |
| Budget | 900,000 ms hard deadline, existing 15-second stop margin; neither needed |
| Browser elapsed to settlement | 693,783 ms |
| Provider duration | 693,728.053 ms |
| First paint opportunity | 136,929.900 ms |
| Final visual acceptance | 7 required, 7 passed, none pending |
| Final request check read | 371 passed; 0 failed, unverified or stale |
| Runtime settlement | `executed`, `success`; provider `completed` |
| Clarification / browser errors | None / none |
| Persistence | Generation 0, sequence 553, durable sequence 553 |
| Recording | `recording.webm`, 73,248,777 bytes |

The provider clock begins 330 ms after browser submission. Tool timings below use
the provider clock; first paint and browser settlement use the browser clock.
Screenshot, checkpoint, reload and video collection happen after logical task
settlement and must not be charged as additional model drawing time.

The recorder retained its own services: document backend PID 31051, collaboration
PID 31052 and Vite PID 31078. Cleanup completed and ports 3045, 4145 and 4245 were
verified clear. No existing unrelated service was stopped.

## Drawing and review sequence

| Provider time | Observed work | Result |
| --- | --- | --- |
| 16.824-58.412 s | Discover preparation, source/Knowledge and image-import contracts; two pagination continuations | No drawing yet; discovery is not retrieval or image import |
| 135.647-139.569 s | Base, podium and lower glazing | First successful construction |
| 227.210-233.948 s | Eight repeated tower tiers, windows and ornaments | Successful construction |
| 309.835 s | Crown/spire preparation | Nonplanar antenna face rejected before writing |
| 317.150-317.994 s | Repair two retained antenna face vertex arrays | Successful; existing lower work preserved |
| 378.739-379.171 s | Coins, entrance and podium roof details | Successful construction |
| 388.098 s | First whole/tier/crown/base overview captures | Four images delivered |
| 427.538 s | Record review | View passed; roof occlusion and crown detail concerns recorded |
| 452.352-453.002 s | Move roof-fold members before the base facade | Occlusion correction |
| 479.677-479.955 s | Add crown shadow-side windows, louvers and rings | Model-chosen detail completion |
| 485.447-494.061 s | Reparent crown additions and base ornaments into inspected groups | Correct capture scope while preserving projection |
| 514.977 s | Record scale calculations | Successful |
| 527.064 s | Three updated overviews plus three entire-group native-detail requests | Overviews retained; oversized detail captures unavailable |
| 569.371 s | Retry only the three details as 1024 x 1024 local regions | Successful; no replay of drawing writes |
| 588.683 s | Bind mixed overview/native evidence | Crown scope replacement missing explicit reason |
| 603.156 s | Supply replacement reason and rebind existing images | Successful; no recapture |
| 676.957-677.100 s | Record final judgments | All seven visual checks accepted |
| 685.944-686.030 s | Read request-wide check counts | 371 passed, none unresolved |
| Approximately 693.698 s | Final runtime currency validation | Current receipts, then normal completion and cleanup |

After the last canvas edit at about 494.061 s, roughly 199.667 s remained before
provider completion. This is approximately 28.8% of provider lifetime, covering
calculation recording, inspections, binding recovery, judgment and settlement.
It is not all unnecessary work. Final accepted recording took about 0.143 s;
most elapsed time between these operations belongs to the provider side.

## Problems observed, and whether they are really problems

### 1. Antenna face was nonplanar - real model input error, correct guard

The rejected face `antennaL` had a maximum world-space plane deviation of
22.8223087285 against a tolerance of 0.0000180234569. This was not a small rounding
edge case. The preparation owner returned `NONPLANAR_FACE`, the exact vertex path,
a retained draft ID and a repair handoff, with `settlement: not-started`.

The model replaced the two antenna side faces with three-vertex triangles using
the existing retained draft. Successful recovery ended about 8.143 s after the
failed call ended. No malformed geometry was written and no earlier drawing was
replayed. The tool's fail-fast and repair behavior is working. This single error
does not establish a missing new tool: the existing owner already detects and
localizes the issue and supports a small repair.

### 2. Podium roof initially covered the tower - real drawing-order error, repaired

The first whole-building image shows the sawtooth roof painted across the lower
tower. The model recorded the problem and moved the actual `roofFolds-` members
before the `baseY` facade anchor. The final whole/base images show the roof behind
the tower. This is a real visibility correction, not optional polish.

This time the model selected the relevant members, rather than repeating the
preceding run's insufficient whole-group coin repair. However, it did not read
the new Knowledge text. Its better operation selection cannot be attributed to
that advice. The API followed both requests; there is no evidence of a hierarchy
implementation failure in this run.

### 3. Native-detail request exceeded the supported capture size - avoidable request mismatch

At 527.064 s, the model requested `view: detail` for each entire base, tier and
crown group. Those world-scale groups exceed the 1024-pixel native capture limit.
The tool preserved the three successful overviews and returned the exact failed
targets with guidance to select a smaller child or target-local region.

The model discovered target resolution, then retried three explicit 1024 x 1024
regions at 569.371 s. About 42.370 s elapsed between the partial result and the
completed corrective capture. This includes discovery, region selection and
provider time; the actual corrective capture took about 0.219 s.

The size guard is legitimate and the recovery is correct. There is no evidence
that lowering native resolution or silently choosing a crop would be correct.
A useful future tool-contract candidate is a more explicit size/preflight result
with actual target dimensions, if it demonstrably removes a round trip. That is
a prospective improvement, not an implemented fix or proof that this App failed.
The current receipt uses generic `CAPTURE_UNAVAILABLE`, so it should not be
interpreted as a renderer crash.

### 4. Crown binding replacement omitted its reason - input mismatch, correct recovery

The crown had an existing failed judgment at result revision 2. Changing its image
scope to combine updated overview and native detail required an explicit
`supersedes` revision and redesign reason. The first bind omitted the required
reason. The tool returned the exact selection, current revision and missing field,
without recording judgments or discarding images.

The next call supplied the reason and successfully rebound the same images about
14.475 s later. This was not stale-image invalidation and did not cause a recapture.
The guard protects against silently replacing an established obligation. It must
not be removed merely to make every call report success.

The error message repeats "No judgments were recorded." This is a minor diagnostic
wording defect, not a task blocker or repeated execution. It is documented here
without expanding this slice into unrelated message cleanup.

### 5. Initial base capture omitted sibling ornaments - scope mismatch, corrected

The first base overview isolated the original base group; later ornaments lived
in a separate group. It therefore did not include every intended base detail.
The model moved the ornament/entrance group into the base before final inspection,
and did the corresponding scope organization for crown additions. The later
captures contain those details.

This is a consequence of the selected capture target and authored hierarchy,
not proof that capture omitted children it promised to include. Existing workspace
overview remains available without grouping. Grouping is one chosen organization
method, not a requirement the App should impose on every drawing.

### 6. Additional crown details - completion judgment, not an established bug

The model decided that broad shadow-side areas needed windows/louvers before
acceptance. The fixed prompt asks for detailed architecture, so this is a plausible
interpretation. The evidence does not establish that those additions were required
for every acceptable result or that the App forced them. Do not classify all such
time as waste or add a rigid drawing sequence to prevent it.

### 7. No Knowledge or reusable-tool invocation - not a demonstrated failure

The model asked for the `discover_knowledge` usage contract, but made zero
`discover_knowledge` or `read_knowledge` calls. It also made zero `submit_tool`,
`invoke_tool` or durable tool-save calls. The new advisory text was not consumed;
this run cannot evaluate its effect on decision time.

Six preparation calls include one rejected draft and five successful artifact
applications. Inputs use projected faces, surface grids and repeated patterns,
with consistent azimuth 35, elevation 25 and scale 1. Deterministic projection and
window expansion were already delegated to tools. The successful drawing contains
17,355 objects from 33,004 bytes of preparation-call input, including the failed
attempt and repair. Zero composition calls does not mean that the model manually
computed every resulting shape, nor establish that another wrapper would help.

### 8. Report `modelReview.current: false` - conservative report semantics, not App rejection

The derived report records `accepted: true`, but `modelReview.current: false`.
The implementation in `packages/ai-agent-runtime/src/profiler/evaluation.ts`
marks the summary current only when every later non-provider/non-lifecycle step
is an explicitly successful evidence-validation action. The later
`read_design_checks` call and `release_design_context` actions fail that blanket
temporal condition even without a new drawing mutation.

Final runtime validation at approximately 693.698 s explicitly returned current
receipts, the final review accepted all seven criteria, and the browser settled
successfully. The summary flag is therefore not evidence of stale final artwork.
It is a conservative report-level limitation that would be misleading if displayed
as an authoritative App failure. `certifiesVisuals: false` is also not rejection:
a profiler does not independently certify artistic correctness. No report-runtime
code was changed in this bounded task.

## Inspection reuse and evidence fidelity

The three capture calls returned 10 images with **10 distinct PNG hashes**:
four initial overviews, three updated overviews, and three native local crops.
The same tier overview captured at 388.098 s remained usable in the final binding
and judgment. The two bind calls reused delivered images; neither captured pixels.
There was no unavailable/invalid-ID currency recovery and no repeat of the prior
run's three byte-identical stale-crop acquisitions.

This is compatible with the scoped evidence contract and shows a completed live
workflow. It is not a controlled replay of the previous repair sequence; absence
of duplicate captures alone cannot quantify the fix's benefit. The deterministic
real-App before/after regression remains the direct evidence for the code change.

## Independent screenshot review

Reviewed actual App screenshots: `first.png`, `final.png`, `spire.png`, `tiers.png`,
`base.png`, `native-detail.png` and `reload.png`. Also reviewed the initial four
provider images and the final three native 1024 x 1024 crops.

| View | Observation | Limit |
| --- | --- | --- |
| Final whole building and reload | Continuous base-to-spire silhouette, repeated projecting tiers and podium; preserved after reload | Overview alone cannot certify every small ornament |
| Base | Two coin ornaments and entrance are visible; roof no longer paints across the tower | Source-faithful architectural dimensions beyond declared inputs were not independently audited |
| Crown/spire | Added shadow-side details visible; shaft continuous to the tip | Fine physical front/back relationships are not certified by a low-zoom screenshot |
| Tiers | Repeated glass cells, bands and small ornaments are visible | No claim that every real-world detail is reproduced |
| Native detail and three native crops | Distinct editable window geometry and gradients; no blank/failed capture in these samples | Crops sample specific regions, not every surface |

The final App screenshot includes a blue selection outline around crown content;
the reload view has no selection and the conversation panel is closed. Those UI
state differences are not document mismatches. The drawing uses illustrative
material gradients and estimated dimensions; successful execution is not a claim
of surveyed geometry or photographic equivalence. No mandatory quality escalation
is proposed from this review. Video is retained, not reviewed frame by frame.

## Timing and resource interpretation

| Exclusive owner | Time | Share of provider lifetime |
| --- | --- | --- |
| Provider | 677.837 s | 97.71% |
| App | 14.398 s | 2.08% |
| Tools | 1.493 s | 0.22% |
| Recording gap | 0 s | 0% |

Provider-side classifications include 467.735 s waiting, 175.273 s reasoning-event
intervals, 17.527 s research, 16.830 s response intervals and 0.472 s protocol
requests. These are observed timing categories, not access to private reasoning,
measured CPU activity or proof that all waiting was indecision.

| Usage / transport | Recorded value |
| --- | --- |
| Input tokens | 2,942,909 |
| Cached input tokens | 2,831,616 |
| Non-cached input tokens by subtraction | 111,293 |
| Output tokens | 24,680 |
| Reasoning output tokens, included in output | 3,827 |
| Total tokens | 2,967,589 |
| Usage status | reported |
| Transport sent / received | 6,735,726 / 6,548,669 bytes |

Token totals are not a credit-price calculation. The browser profile is a bounded
development diagnostic (`releaseEvidenceEligible: false`), not a full-run CPU/RSS
profile or release performance proof. Retained runtime evidence contains 558
Factory commits, 553 publications and 561 status entries. No inference is made
from Codex UI CPU or from the number of retained bounded profiling samples.

## Tool totals

There were 28 App tool calls: 25 usable, one partial capture and two failed input
operations, all recovered before completion. The report also includes three
native research spans with unknown App usability; they are not three additional
App failures. Counts at tool and nested action levels must not be added together.

| Tool | Calls | Input JSON bytes | Output JSON bytes | Inclusive time, ms |
| --- | ---: | ---: | ---: | ---: |
| `describe_design_apis` | 10 | 1,176 | 171,112 | 476.230 |
| `prepare_and_apply_design` | 6 | 33,004 | 6,027 | 12230.700 |
| `review_drawing` | 7 | 13,745 | 43,046 | 866.045 |
| `execute_design_batch` | 3 | 1,218 | 2,126 | 1267.431 |
| `record_design_calculations` | 1 | 558 | 686 | 1.346 |
| `read_design_checks` | 1 | 18 | 175 | 85.563 |

Ten discovery calls include two pagination continuations and distinct operation
queries. Some requested capabilities were never invoked. This is an observed
exploration cost, not evidence that every discovery call was redundant. Inclusive
tool times are not additive with exclusive owner totals or nested action times.

## Complete App call table

| # | Start, s | Operation | Outcome | Duration, ms | Input / output bytes |
| ---: | ---: | --- | --- | ---: | ---: |
| 1 | 16.824 | Discover - prepare_and_apply_design | usable | 298.528 | 170 / 23,072 |
| 2 | 22.129 | Discover - prepare_and_apply_design - page | usable | 9.193 | 279 / 14,299 |
| 3 | 34.383 | Discover - discover_knowledge, record_design_facts, record_design_calculations, select_design_references | usable | 21.525 | 125 / 23,072 |
| 4 | 39.057 | Discover - discover_knowledge, record_design_facts, record_design_calculations, select_design_references - page | usable | 3.988 | 234 / 20,363 |
| 5 | 58.401 | Discover - import reference image | usable | 10.750 | 49 / 6,575 |
| 6 | 135.647 | Create base and podium | usable | 3922.363 | 7,664 / 1,098 |
| 7 | 227.210 | Create eight tiers | usable | 6738.284 | 8,840 / 1,063 |
| 8 | 309.835 | Prepare crown and spire | failed | 17.075 | 8,332 / 1,496 |
| 9 | 317.150 | Repair retained antenna faces | usable | 844.166 | 427 / 862 |
| 10 | 322.604 | Discover - review_drawing | usable | 22.231 | 80 / 16,697 |
| 11 | 378.739 | Create base ornaments and roof | usable | 431.161 | 5,874 / 754 |
| 12 | 388.098 | Review - capture | usable | 264.458 | 548 / 7,040 |
| 13 | 402.814 | Discover - resolve prepared artifact targets | usable | 5.785 | 60 / 4,721 |
| 14 | 427.538 | Review - record | usable | 29.102 | 2,234 / 7,887 |
| 15 | 432.883 | Discover - hierarchy.moveElementsRelative | usable | 29.698 | 64 / 20,320 |
| 16 | 452.352 | Move roof folds behind facade | usable | 650.123 | 419 / 714 |
| 17 | 479.677 | Add crown details | usable | 277.651 | 1,867 / 754 |
| 18 | 485.447 | Reparent crown additions | usable | 151.413 | 400 / 706 |
| 19 | 493.595 | Reparent base ornaments | usable | 465.894 | 399 / 706 |
| 20 | 514.977 | record_design_calculations | usable | 1.346 | 558 / 686 |
| 21 | 527.064 | Review - capture | partial | 158.909 | 858 / 8,138 |
| 22 | 541.834 | Discover - resolve_design_targets | usable | 64.250 | 51 / 23,072 |
| 23 | 569.371 | Review - capture | usable | 219.419 | 735 / 3,062 |
| 24 | 588.683 | Review - bind | failed | 24.446 | 1,077 / 5,037 |
| 25 | 603.156 | Review - bind | usable | 26.824 | 1,228 / 8,359 |
| 26 | 616.150 | Discover - read_design_checks, report_outcome | usable | 10.283 | 64 / 18,921 |
| 27 | 676.957 | Review - record | usable | 142.889 | 7,065 / 3,523 |
| 28 | 685.944 | read_design_checks | usable | 85.563 | 18 / 175 |

## Decision after reviewing the findings

The authorized runtime defect is fixed and directly regression-tested. The
optional Knowledge diagnosis is delivered correctly but had no live consumption
in this sample. The run completes, retains current acceptance and saves correctly.

The strongest remaining efficiency candidate is the inspection-size request
mismatch and its recovery information, rather than stronger always-on design
instructions. A future scoped task could prove whether reporting concrete target
size and supported capture choices removes an unnecessary discovery turn. Keep
crop selection and final visual judgment with the model. The report's conservative
currency summary should be distinguished from runtime acceptance wherever it is
presented. Neither candidate was silently added to this implementation slice.

There is no basis from this single sample to force Knowledge, require tool
composition, relax geometry/currency guards or promise a fixed completion time.
The previous incomplete run is not used as an equal completed-result comparator.

## Evidence locations

All paths are relative to this worktree. Main run directory:
`tmp/conversation-improvements/live/taipei-101-fixed-1793652131268`.

- `run.json`: immutable submitted prompt, browser timeline, settlement and services.
- `source-identity.json`, `source-changes.patch`: exact tested dirty source.
- `provider-records/`: provider and source runtime records, payloads and image assets.
- `execution-report.json`: official read-only report; no post-run model assessment.
- `report-data.json`: complete call IDs, exact payload paths, timings and byte counts.
- `analysis-inspection-map.json`: capture IDs, delivery ordering and full PNG hashes.
- `evidence-checks.json`: document equality, source stability and hash verification;
  JSON redaction paths are explicitly excluded from filesystem hash checks.
- `source-snapshot.json.gz`, `checkpoint.json`, `reload-snapshot.json.gz`: canonical
  persistence evidence plus retained runtime and conversation diagnostics.
- `final.png`, detail screenshots, `reload.png`, `recording.webm`: visual evidence.
- Parent directory logs: `inspection-group-before.log`, `inspection-group-after.log`,
  `inspection-knowledge-focused.log`, `inspection-live-contract.log`,
  `inspection-naming-before.log`, `inspection-naming-after.log`, `inspection-lint.log`
  and `inspection-fix-live.log`.

Reports and final plan notes were written after source-stability verification.
Raw run evidence and the fixed prompt were not rewritten. No commit or push was
performed for this slice.
