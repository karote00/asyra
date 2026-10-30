# Settled partial continuation - 2026-10-26

The diagnostic continuation fix passed its focused local regressions and was
exercised in one authorized live drawing run. The first turn settled partial,
its ordinary answer and document were saved, and the declared follow-up ran once.
The second native input preserved the exact predecessor intent, answer and partial
outcome. The follow-up changed only 5,568 existing fill colors; geometry, IDs,
scene-tree order and hierarchy were unchanged. Artwork acceptance remained partial.

## Change and verification

The previous collector treated every partial outcome as a reason to stop. The
collector now requires a terminal result and completed capture, plus a saved
per-turn document. Before a partial predecessor can continue it also requires its
ordinary answer, turn/request identities and idle App input. The UI remains the
settlement authority; no successful tool call is substituted for turn settlement.
The collector sends only the declared follow-up under the original deadline.
Failures, cancellation, missing evidence, active input and expiry remain blocked.
A final captured partial report completes collection without promoting the artwork.

Only the existing observation runner/tests, README, active plan and observation
spec/Inspector contract changed. No App runtime, Knowledge, acceptance owner,
production artifact limit, model settings or drawing prompt changed in this fix.
No initial operation is retried by this collector.

Formal regression first: three of ten collector tests failed on the old gate.
After correction, ten collector tests plus seven existing watchdog tests passed.
Cases include every missing prerequisite, failure/cancellation, capture crossing
the deadline, exactly one unchanged follow-up and final partial reporting. Lint,
naming and diff checks passed. Inspector revision 132 accepted the contract;
verification `27caf2e1-a3a6-43f4-b067-78b02a3d4ffb` passed the mapped owner cases.
Bounded review checked the actual UI idle controls, canonical cancellation priority,
capture ordering, continuation and final report paths. No CI was inspected.

## Run identity and limits

- Run: `knowledge-taipei-101-continuity-1792948625197`.
- Start: 2026-10-26 01:17:09.368 Asia/Taipei.
- One live run, two App requests, no retry, no video.
- Work: 120 seconds total. Final report: maximum 60 seconds.
- Collection completed at 135.277 seconds; source unchanged throughout.
- Native model headers: gpt-6-astra / medium for both turns.
- Production artifact limit: 10,000, no test override.
- HEAD: `04d87366167e048e719129b67f10dbb6929fd5f2` plus preserved local changes.
  The saved source archive identifies the executed bytes.
- Evidence: `tmp/knowledge-evaluation/knowledge-taipei-101-continuity-1792948625197/`.
- Original provider records: `tmp/drawing-continuity-provider-1792948598117/`.
- First App/native IDs: `5ef193a0-f070-4b6f-9617-0fe0dbac1084` /
  `29870eff-795d-49e8-9b8d-a9badc59e213`.
- Second App/native IDs: `46882276-489f-40f6-aa62-7dc7b6269454` /
  `b15a54e4-4278-4eab-a0ab-92f22bdc8358`.

## Evidence by boundary

| Boundary | Confirmed observation | Limit |
| --- | --- | --- |
| Initial creation | One main drawing call created 5,662 elements; workspace plus created objects totals 5,663 IDs | Not an independent full visual-quality acceptance |
| Partial continuation | Initial outcome partial, documentPath saved, inputIdle true, ordinary answer captured; exactly one second request followed | Single live case; negative routes are covered locally |
| Context delivery | Second native `4-input.json` contains one prior turn; intent and message match exactly, outcome partial, omittedTurns zero | No claim that every underlying model HTTP transformation is observable |
| Existing-state access | AI read existing children and selected retained-fill mapping against the existing root | One snapshot output-validation error occurred, detailed below |
| Actual modification | `map_retained_fills` receipt appliedCount 5,568; document diff has exactly 5,568 fill.color changes | Color distribution is not complete physical reflection or metal-detail work |
| Preservation | Same 5,663 IDs in the same sequence, identical sceneTree, zero added/removed props; every other property unchanged | Undo/Redo and reload were not separately exercised in this live run |
| No replay | No second creation call, no added tower, one successful fill-mapping batch; final document equals saved second-turn document | No mutation failure/retry was exercised |
| Work cutoff | Last drawing mutation batch finished at 102.689 s; work interrupted at 120.003 s, acknowledged at 120.011 s; no tools after cutoff | Report is not artwork acceptance |
| Report capture | Attributed final report text and screenshot saved; final UI outcome remains partial | Remaining visual work is explicitly unfinished |

The second native input carries 2,319 UTF-8 JSON bytes of conversation history.
There was no request to retrieve that history. The first ordinary answer was the
App's actual incomplete-drawing summary, not a substituted diagnostic self-report.

The AI's report says it changed 5,568 glass cells and preserved geometry; these
claims match the receipt and complete document comparison. It also says metal
colors were retained and fine reflections/detail inspection remain unfinished.
The final screenshot shows a stronger continuous light/dark distribution across
glass compared with the initial pass; this is an observed appearance change, not a
certification of material realism or a causal Knowledge-quality improvement.

## Independently observed tool problem

At 85.409 s, `read_design_context` was invoked with scope `snapshot`, a returned
snapshotId, a name-suffix filter, page delivery and limit two. Its reply rejected
with `arguments.elementIds: expected array`. Crucially, the saved reply names
`contractStage: "output"` and contains an `observedResult` with `available:true`,
scope `children`, total 5,568 and returned elements. This is evidence of failure
in the result-validation handoff; it is not proof that the input simply omitted
a required elementIds argument. The exact source-level cause is not determined
by this observation.

The failure was exposed as an unavailable result and failed execution, with a
nonreplay recovery instruction. AI then used a region query in `map_retained_fills`
and completed the modification. No failed mutation was replayed. This is a bounded
candidate for separate investigation, not an additional fix in this task.

## Timeline

Seconds are measured from the first Send. First content is observed canonical
bounds plus a screenshot, not a precise GPU paint measurement.

| Time | Activity |
| --- | --- |
| 0.000-10.313 | Initial delivery and native work before first Knowledge call |
| 10.313-10.330 | Targeted Knowledge discovery and architectural App-entry read |
| 13.692-15.902 | Selected drawing usage and continuation page, including the interval between calls |
| 15.902-44.302 | Interval before initial drawing submission |
| 44.302-47.739 | Prepare/apply and overview capture |
| **47.665** | **First frame observed and saved** |
| 50.231-60.226 | Review contract, evidence binding and judgment recording |
| 66.422 | Initial partial outcome observed |
| 66.422-70.514 | Save first document, answer/screenshot; verify idle input |
| 70.514 | Second turn begins under the same deadline |
| 71.849 | Second full native work input retained, including predecessor |
| 78.592-85.436 | Selected tool/Knowledge/context reads; snapshot output-validation failure |
| 93.016-102.689 | One retained-fill modification batch, 5,568 existing fills |
| 111.057-118.988 | Define current criteria, capture/bind review evidence |
| 120.003 | Work cutoff starts reporting and interrupts native work |
| 120.011 | Native interruption acknowledged |
| 120.012-130.979 | Report-only request and response, about 10.97 seconds |
| 131.126 | Second partial outcome observed |
| 135.277 | Per-turn report/document/screenshot capture complete |

First-turn native observed-tool time is about 3.538 seconds; second-turn time is
about 10.523 seconds. Outside-tool time is not measured reasoning. The first-frame
change from the previous run is not attributed to this collector fix: the generated
initial drafts differed, and this is not a controlled latency comparison.

## Knowledge, data and evidence completeness

| Measure | First turn | Second turn |
| --- | --- | --- |
| Knowledge calls | Targeted discovery + App-entry read | Targeted discovery + materials-correction read |
| Recorded top-level tool calls | 8, all usable | 12, including one explicit failed read |
| Tool input bytes | 13,535 | 2,912 |
| Tool reply bytes | 52,325 | 85,387 |
| Provider-reported input tokens | 251,599 | 264,400 |
| Cached input tokens | 215,168 | 217,856 |
| Output tokens | 1,939 | 1,457 |

The second read repeated 1,964 bytes of the architectural App-entry body. Cross-turn
Knowledge delivery is therefore not deduplicated by this fix. The correction advice
and the chosen existing-fill operation are compatible, but there is no controlled
causal Knowledge-effect result. Token counters, tool payload bytes and wire sizes
are distinct measurements, not a billing estimate.

All eight execution streams pass the public Runtime parser without issues. All
11,585 referenced payload files exist and match recorded sizes and SHA-256. Both
reference images, actual tool inputs/outputs, saved inspection pixels, per-turn
files, first/final screenshots, final attributed report and source archive are
retained. The high payload count includes operation-level observations; it is not
the number of model tool calls. `analysis.json`, `timeline.json` and
`continuity-checks.json` are derived evidence, not replacements for originals.

The second full native work input, interruption output and report input/output
are preserved. The ordinary first-turn path still lacks independently retained
full native input/final-output envelopes; saved prompt, tool records and actual
UI answer cannot be relabeled as those missing raw envelopes. Underlying model
HTTP requests remain unobservable. No missing data was filled by rerunning a model.

The three task-owned services were stopped and cleanup receipts retained. No push,
CI inspection, additional model run or unrelated product repair was performed.
