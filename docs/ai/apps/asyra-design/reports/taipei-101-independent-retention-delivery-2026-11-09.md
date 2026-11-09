# Taipei 101 - Independent retention and delivery

## Result

The retain/delivery correction is implemented and exercised by both the original
missed-image regression and the new live run. This live drawing did not complete:
the strict runner stopped after a browser property update failed. It was not a
fifteen-minute deadline stop, a missing-image stop, or an AI completion decision.
The original AI completed its unlimited report in the same native thread, and the
session remains available for follow-up.

No manual file edits occurred between live launch and completed reporting. No
full-local suite, CI, release gate, commit or push was performed.

## Evidence

- Run: `taipei-101-fixed-1794226962133`.
- Provider request: `a67b8348-2fce-48a8-bb31-5aa0b6fdba0d`.
- Native thread: `01a1c042-e0a5-7552-b474-87db4f1b3e6b`.
- Drawing turn: `01a1c042-e0fd-72f2-bac4-051d35565ed5`.
- Report turn: `01a1c04b-346e-73c1-9a54-445bd2969d35`.
- Retained report session: `39938ae3-11e9-458c-8cc1-a049846e4071`.
- App: `http://127.0.0.1:3051`; retained service PIDs: backend 57109,
  collaboration 57111, Vite 57114.
- Unchanged drawing prompt SHA-256:
  `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
- [Original AI complete report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794226962133/self-report.txt).
- [Same-thread and stop evidence](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794226962133/self-report-evidence.json).
- [Run metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794226962133/run.json).
- [Final screenshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794226962133/final.png).
- [Native detail screenshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794226962133/native-detail.png).
- [Recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794226962133/recording.webm).

## Correction and validation

Retain selects portable snapshots for the existing App conversation owner and
adds compact save metadata. Omitted delivery preserves the final public result
and images. Explicit status suppresses work values/images; explicit fields select
only requested results/images. Stages use the same default. The direct drawing
convenience path delegates these options to the host; selectors address the
ordinary drawing result, exposed under the host execution receipt when delegated.
Ready batches preserve the registered compact public result, including structural
receipt handles rather than internal ID arrays.

The host retains owner validation and projects the final leaf before emitting the
outer receipt. It does not validate the compact model view as raw canonical
execution arrays. Default failures preserve their existing execution recovery;
selected deliveries preserve their failure envelope. There is no legacy mode,
extra model query, forced image replay or changed crop behavior.

The permanent fixture preserves prior run `taipei-101-fixed-1794215656743` raw
requests 121 and 138, including the rejected crown source and exact repair plus
capture. Only the runtime-generated repair ID is substituted during replay. The
baseline regression delivered one image without retain and zero with retain.
After correction, both deliver one image. Explicit status and fields are covered
separately. Save failure keeps the image and acknowledged writes, with partial
status and no replay.

| Focused validation | Result |
|---|---|
| Host, recorded integration, result handoff and result delivery suites | 154 passed at the completed first slice |
| Final delivery/failure matrix, including exact E3, stages, direct drawing and storage failure | 24 passed |
| Three selected step results and compact ready-batch parity | 3 passed |
| Actual native-provider declaration and dispatched results | 3 passed |
| Server TypeScript check | Passed |
| Naming | 15 passed |
| Inspector architecture contract tests | Passed |
| Scoped lint | No errors; one pre-existing console warning |
| Current-source execution-owner baseline | Candidate 2465a8a3-1c04-4d02-bfd8-a1446ff48005 passed |

Test groups overlap; these counts must not be summed. The historical accepted
Flow mapping rejected ordinary verification after the authorized architecture
change. The current-source candidate passed instead; historical acceptance was
not silently rewritten, and unrelated negative scenarios were not run.

## Live metrics

| Metric | Observed value |
|---|---|
| Drawing limit | 900 seconds |
| Actual drawing phase | 547.363 seconds - 9 minutes 7 seconds |
| Stop | Strict tool-failure policy, not deadline |
| Report phase | 297.310 seconds - 4 minutes 57 seconds, no time limit |
| Host submissions | 6; five normal external replies, final one interrupted |
| Contract discovery | 12 calls; 123,132 text bytes (123.132 decimal KB) |
| Normal host result text | 10,290 bytes across five completed external replies |
| Native design images submitted to provider | 4: 1 + 1 + 2 |
| Construction applications | 7, totaling 25,004 applied elements |
| Final snapshot | 24,804 vectors, 193 ovals, 8 groups, 1 workspace |
| Requested saved names | 12; AI received confirmation for 10 before interruption |
| Confirmed names consumed later | 8, according to original AI and named inputs |
| Report mutated document | No |
| Durable document | sequence 794 = durableSequence 794 |
| Reload equality | Passed |
| Evidence errors | None |
| Recording framing | Four automatic fit updates during drawing |

The applied-element total includes containers and is not the final visible-shape
count. Text byte counts exclude image bytes and provider-native web replies. The
final interrupted host call has no normal external completion measurement and is
not counted as a zero-byte successful reply. Contract discovery tool durations
sum to about 0.95 seconds; the five completed host invocations sum to about 20.17
seconds. These sums do not measure model preparation, network time, or all work in
the interrupted invocation, and must not be used to assign the remaining time to
a single cause.

## Actual retention and delivery

Raw inputs below are in the provider payload directory for this request.

| Submission | Raw input | Work and selection | Observation |
|---|---|---|---|
| E1 | 90-input.json | Base -> tiers, four saves, explicit status | No image requested or returned; correct explicit suppression |
| E2 | 130-input.json | Crown -> ornaments -> overview, three saves, delivery omitted | One image reached native transport; directly exercises the repaired default |
| E3 | 163-input.json | Four current group-coordinate reads, selected results | Data used to decide correction; not a pure forwarding call |
| E4 | 207-input.json | Position correction -> overview, delivery omitted, no saves | One image reached native transport |
| E5 | 250-input.json | Glass mapping -> tower details -> base details -> two captures, three saves, two selected image results | Both images reached native transport |
| E6 | 320-input.json | Layer order -> finish -> group -> name update -> two final captures, two requested saves | First three steps acknowledged; update failed; final requested captures did not run |

E2 proves that saving no longer turns an omitted delivery into status-only output.
E5 proves selected multi-image delivery remains intact. The run did not exercise
stages or direct-drawing convenience delivery; their evidence is formal tests,
not live adoption. Unused saves are valid. The AI did not make a confirmed extra
call solely to transfer a previously computed value to an already-decided step.

## Stop analysis and limits

The failing E6 operation tried to name the new group through
`api_core_updateElementProperties` with `values.name`. The same operation had
previously succeeded for x/y position correction. The update returned
`AI_EXECUTION_FAILED`, settlement `not-started`, and only the generic message
"The batch could not complete." The sequence retained the successful layer move,
169-element finish application and grouping. It did not rerun them.

Current Core separates these concerns: `updateElementProperties` resolves property
bindings, while `updateElementData` explicitly accepts `name`, `visible` and
`lock`. This is strong evidence of a wrong semantic route for renaming. The
recorded exception does not expose its original cause, so this report does not
claim that it has proved the unique throwing condition. Runtime wraps this path
with a generic execution failure in `packages/ai-agent-runtime/src/runtime.ts`.

The strict test policy stopped on that execution failure. It was not classified
as a correctable input-admission error. The native call interruption explains why
the original AI required supplemental host evidence to distinguish completed
prefix writes from the failed update. These are separate follow-up concerns:
correct naming capability discovery/admission, useful structured failure details,
and whether an unstarted correctable operation should remain in the drawing turn.
No production changes for those concerns were made during this bounded task.

## Original AI report, checked against evidence

The original report is linked unabridged above. Its principal observations are:

- It prepared projected faces, surface grids, repeated bamboo tiers, window motifs,
  materials and ornaments. It attributes waits at a high level to authoring those
  inputs, reading contracts and making visual decisions. It does not claim access
  to hidden provider/network timing.
- Initial child groups were misplaced relative to their parent. Four coordinate
  reads and a correction repaired the visible assembly. This was visual/design
  correction, not the strict stopping event.
- Position-tool discovery took three purpose searches and an unsuitable selected
  contract before using the property updater. Some other contracts were fetched
  but not used. The 12 queries and 123,132 text bytes warrant a separate discovery
  analysis, not another generic instruction to read less.
- Projection and material data were reused by name. Twelve saves were requested,
  ten acknowledged to the model, and eight acknowledged names later used. The last
  two saves remain unconfirmed from the AI's perspective after interruption.
- The tower detail capture selected a subtree that excluded later sibling detail
  groups. This is an incomplete inspection target, not evidence of renderer failure.
- It submitted decided corrections and captures together in E4, E5 and E6. The
  final captures were blocked by a preceding failure, not split into a new model
  request and not lost by retention delivery.
- It had not received final persistence evidence, so its report says durability was
  unconfirmed. Recorder closeout subsequently proved durable sequence equality and
  reload equality; this supplements, rather than rewrites, the original report.
- Eight inspection receipts appear in host evidence, but only four design images
  were submitted and viewed. Internal receipts are not model-visible images.

The final overview and native detail were inspected. The tower spans base through
spire with dense editable window geometry. A small overview is not proof of exact
architectural detail; the original AI did not finish final visual acceptance after
its last changes. This run must remain an interrupted observation, not a successful
complete 101 benchmark.
