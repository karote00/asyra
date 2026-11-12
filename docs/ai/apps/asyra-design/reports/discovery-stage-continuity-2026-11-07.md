# Discovery and stage continuity - implementation and live evidence

Date: November 7, 2026. Branch: `codex/ai-conversation-improvements`.
Associated plan: [Staged Design Execution](../plans/staged-design-execution-plan.md#follow-up-discovery-and-stage-continuity).

This report concerns the five authorized continuity steps and their direct live
regressions. It does not compare drawing speed across differently detailed
artworks. All current-task drawing launches use the unchanged fixed prompt and
15-minute upper bound. Reports have no time limit and continue in the original
native provider thread. Earlier task launch allowances do not become a new
unlimited retry allowance here.

## Implemented owner changes

| Step | First owner and actual change | Preserved boundaries | Focused evidence |
| --- | --- | --- | --- |
| 1. Request composition | Runtime declares request-only sequence eligibility; App reference import, selection and review expose executable execute_design routes | Request-local controls cannot become saved recipe dependencies; owner validation, media, cancellation and no-replay semantics remain | Runtime admission; App host/discovery; actual combined review |
| 2. Purpose discovery | Complete purpose coverage ranks before partial matches; a unique complete candidate delivers executable usage | Qualified identities and real ambiguity remain authoritative; a/b/c names work through metadata; connectors normalize only query terms | Recorded purpose queries, opaque identities, ordinary English variants and negative terms |
| 3. Stage preservation | Workflow optionally returns acknowledged createdTargets; retain saves the public map in existing App context. Bounded value-shape navigation is derived once at save | Maps are historical creation receipts, not current document truth; no request-artifact lease extension or new store; canonical consumers revalidate targets | Real crown map survives host disposal and is used by a new host; browser context/provider tests |
| 4. Direct dependent inputs | Request input bindings may select declared optional paths and require their actual value at execution; generated pattern names are documented | Unknown paths/type mismatches reject; missing query results stop before dependent mutation; durable recipes retain guaranteed presence | Recorded query output binds its wrapped elementIds into sorting; empty query blocks sorting |
| 5. Review acquisition | The same host can execute capture and data acquisition together and return selected data and actual images | Judgment still follows observation; signed evidence, stale checks, sparse recording and completion coverage remain | Actual review integration combines four capture receipts and data; identical fixture pixels deduplicate only transmission |

The structural schema proof also now treats forbidden optional properties as
absence constraints, allowing identical mutually exclusive paint/template
schemas to bind. Negative value and lifetime tests remain. The change is not an
untyped pass-through.

## Current-task live attempts

| Attempt | Run suffix | Drawing outcome | Drawing elapsed | Unlimited report | Native thread |
| --- | --- | --- | --- | --- | --- |
| 1 | 1794058385599 | Stopped on incorrectly classified composed review recovery | 696.037 s | Completed, 374.132 s | 01a1b636-a51c-7391-87f3-9d64338a144f |
| 2 | 1794060038560 | Stopped on producer/consumer requirementRevision mismatch | 442.027 s | Completed, 303.786 s | 01a1b64f-cf93-7651-9d40-3ea3e400a615 |
| 3 | 1794060989815 | Capture declaration rejected; wrong unknown settlement stopped the run | 534.965 s | Full report collected, 368.391 s; browser evidence incomplete | 01a1b65e-5554-7c70-a438-757e5c8b2691 |
| 4 | 1794062043662 | One of three external reference URLs returned HTTP 404 | 128.953 s | Completed, 247.765 s | 01a1b66e-680d-7683-8163-4f3653dadc49 |
| 5 | 1794062501433 | Full drawing window elapsed; artwork acceptance unfinished | 899.719 s | Completed, 289.278 s | 01a1b675-627b-7e80-9092-3c5d73cf89be |

Neither attempt 1 nor attempt 2 is a completed acceptance run. Both completed
reporting without document changes and have durable persistence/reload evidence.
Attempt 1 has sequence/durableSequence 604/604 and 18,899 non-workspace elements;
attempt 2 has 1054/1054 and 33,562. Durable storage does not establish visual
acceptance. The AI did not yet have these later runner persistence receipts and
correctly reported that storage was unconfirmed from its own evidence.

### Every observed issue and its disposition

| Attempt and event | Evidence-backed cause | Correction or classification | Verification |
| --- | --- | --- | --- |
| 1, reference purpose query | `import reference image from url` counted `from` as an unmet purpose term; import was rank 3 and required another exact lookup | Query-only connector normalization, after exact identity resolution; metadata remains unchanged | Red-first real query plus variants and opaque a/b/c. Attempt 2 used `import reference image from URL` and directly received executable import usage |
| 1, selected requirementRevision output | AI selected an optional revision from reference-selection output for delivery; guaranteed-output admission rejected it before writes | Legitimate selection constraint; not a missing ID or transport failure. Do not silently invent a value | Existing strict output selection retained. This differs from attempt 2's producer minimum defect |
| 1, final capture plus data | Capture produced successful images but a changed check scope required explicit supersession. Native rebind_checks recovery was valid; aggregate evaluator only admitted not-started child settlement and stopped the partial capture | Preserve matching typed owner recovery through leaf, aggregate and host. Unknown/mismatched receipts, failed captures, recorded judgments and independent errors still stop | Saved real leaf/aggregate/host regressions failed first and passed after correction; existing review integration proves rebind without recapture. Later runs must be classified separately if they do not exercise the same scope conflict |
| 2, crown geometry | Author submitted a noncoplanar needle face; geometry diagnostic identified the exact vertices | Expected input validation and AI geometry decision. Existing retained draft repair replaced two vertex arrays and applied successfully; no product geometry change | Same live attempt repaired once without replaying the base or tiers |
| 2, criteria to reference selection | define_design_criteria output declared an optional integer with minimum 0, while reference selection requires minimum 1. New and idempotent successful criteria receipts always contain a positive revision | Correct the producer schema to required positive requirementRevision, revision 7; preserve consumer zero/stale rejection. No Runtime coercion, new query, evaluator exemption or prompt workaround | Real recorded two-operation input fails on the old declaration and passes through the real host and review owner after correction; idempotence, missing/zero output and stale input regressions |

The attempt 2 AI attributed the last failure partly to choosing a conditional
field. Inspection of admission and numeric schemas establishes the narrower
product defect: the declared minimum was incompatible. Request input bindings
already support guarded optional presence; an extra query was not the correct
repair. The AI also called the stop a user interruption; the actual stop was the
App evaluation observer reacting to the failed contract receipt, not a new user
instruction or the AI voluntarily ending drawing.

## Model-facing acquisition and transfer measurements

Count only completed outer calls with provider `responseTextBytes`. Do not sum
nested Runtime receipts or diagnostic payload sizes as model transfer. Text bytes
exclude image bytes, input tokens, and provider overhead. A failed/aborted call
without a delivery receipt is not assigned an invented delivery size.

| Measure | Attempt 1 | Attempt 2 |
| --- | ---: | ---: |
| describe_design_apis calls | 15 | 7 |
| Discovery reply text bytes | 171,473 | 88,922 |
| execute_design submitted | 14 | 7 |
| execute_design completed delivery receipts | 13 | 7 |
| Execution reply text bytes | 23,593 | 7,534 |
| Total measured outer reply text bytes | 195,066 | 96,456 |
| Acknowledged distinct saved names | 19 | 11 |
| Successfully consumed named bindings | 1 | 0 |
| Pure saved-value forwarding calls | 0 | 0 |

These partial runs have different work coverage and must not be treated as a
performance comparison. In particular, attempt 2 stopped before final capture
and data review. It cannot demonstrate that final review communication fell.

AI-reported contract content totals (26,813 and 28,994 bytes for the initial
construction reads) differ from model-facing page wrappers. Both metrics are
valid for different boundaries; they are not interchangeable.

## What the first two AI reports establish

- Attempt 1 used 15 search/contract calls and 14 host submissions. The podium
  creation output was directly bound to sorting. It later consumed a saved crown
  root for a real bounds query; this was a new geometry read, not an ID-copy call.
  It saved 19 names but did not consume saved createdTargets maps in live work.
- Attempt 2 used seven contract calls and seven host submissions. Source facts,
  calculations and base creation were combined. Distinct geometric parts were
  authored in separate calls without intervening output-image decisions. The AI
  said later detailed parameters were not yet ready; this is not proof the host
  required those returns. It saved 11 names and consumed none before stopping.
- Both used existing repeated geometry and template mechanisms. Neither used
  Knowledge, saved recipes or explicit stages. Absence is not itself a defect.
  Cross-turn saved-map consumption is proven offline, not by these live reports.
- The attempt 2 failed crown draft had no successful `crownDesign` save. Its
  repair saved resulting IDs/maps but did not save the corrected full draft.
  Do not claim retention automatically reconstructed that authored source.
- Both explain long pre-call intervals as high-level contract reading, geometry
  authoring, research, visual choices or repair. They do not have hidden reasoning
  or provider/network timing attribution. This supports inspecting avoidable
  work, not assigning every pause to a backend or claiming an exact time saving.

## Focused validation

- Runtime admission and map/schema tests: 82 passed; affected Runtime build passed.
- Workflow and creation-map integration: 167 passed.
- App conversation-context/provider tests: 45 passed.
- First live corrections: 53 focused cases passed, including real aggregate
  recovery, metadata search and combined review.
- Producer revision correction: 13 focused cases passed, including real host,
  reference decision negatives and review integration.
- Current mapped execution-flow proof: 98 passed after the producer correction.
- Naming: 15 passed; scoped server/browser/proof types and changed-file lint passed.
- Maintained runner prompt/report checks: 12 passed. Prompt SHA-256 remains
  `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.

No full local suite, release workflow, commit or push was performed for this task.
A mixed four-node usage acquisition still requires two bounded pages (27,221
bytes in its focused case). Preserving actual owner guidance and map contracts
has a measurable cost; this work does not claim every contract became smaller.

## Evidence locations

All run folders are under the current worktree:
`tmp/conversation-improvements/live/taipei-101-fixed-<suffix>/`.
Each retains run.json, provider JSONL/payloads, final and detail screenshots,
recording.webm, self-report.txt, self-report-summary.txt and same-session report
provenance. Full AI reports are immutable evidence, not edited conclusions.
Permanent regressions include request-review-recovery-20261107.json and
criteria-reference-handoff-20261107.json in the maintained AI drawing fixtures.

## Later attempts and final assessment

### Attempt 3: preflight and failed-child provenance

The recorded final call first successfully recorded the base and tier judgments.
The second step requested two crown captures with the same criterion/unit,
reference-use receipt and revision, but different supersession reasons. The
canonical synchronous preflight rejected that conflict before pixel work.
A plain exception incorrectly became TOOL_EXECUTION_FAILED/unknown and triggered
the evaluation stop. The full provider receipt confirms the successful first
step, even though the bounded facts given to the reporting AI did not.

Two connected boundaries required correction:

1. The App capture preflight now returns typed correct_input/not-started without
   relaxing check equality, authoring a reason, approving a check or replaying
   the successful prefix.
2. Runtime could still discard that failed-child value when the native owner
   declared no recovery schema. The host registry now declares the existing
   canonical App invocation failure alongside any native recovery schema. That
   is a host boundary contract, not a new public domain-tool payload. Publishing
   a duplicate large failure schema in review usage was rejected during focused
   review because it unnecessarily paged the contract.

The permanent regression uses the recorded pair of conflicting reasons rebound
to the test request's actual criterion. It executes through the real host and
review owner with a successful prefix, proves zero capture dispatch, retained
prefix and failed-child provenance, and checks both aggregate and outer recovery.
It failed before correction and passed after. Existing tests preserve unknown
settlement and independent failures as stopping cases. The affected recovery /
review cases passed 26 tests, host/handoff passed 50 and mapped flow passed 98.
Attempts 4 and 5 did not reproduce the identical two-reason conflict; therefore
the exact repair is formally proved, not claimed as independently exercised live.

Attempt 3 also has an operator-induced evidence failure. Editing a test at
22:28:48 reloaded the Vite page while the original AI was still writing its
report; later server-source edits restarted Vite. The native report completed,
but browser report disposal/projection and reload verification failed. This was
my sequencing error. The immutable run is not repaired or relabeled successful.
Attempts 4 and 5 froze all source/test/docs until reporting and cleanup finished;
both have no evidence errors and unchanged reload documents.

### Attempt 4: valid input recovery, then external source failure

The first submission retained from nonexistent step `op-1` while operations had
no such explicit ID. The host rejected it before execution. The AI corrected the
ID to `criteria` and resumed without changing the test prompt. This is expected
input validation and recovery, not a reason to remove admission.

The next call imported three references. Two succeeded; the skydb image URL
returned HTTP 404. Existing strict evaluation stopped on the partial import.
The provider receipt preserves criteria/facts/calculations and two successful
imports. The reporting AI received only the bounded canvas-action summary and
could not confirm those native steps. Its uncertainty is truthful for its input,
but is not proof that all four steps were lost or never executed. No App code or
stop-policy change was made for an external 404. Attempt 5 used the same source
and unchanged prompt; the AI independently chose different reference URLs.

The native import's source-local continuation text and strict evaluation stopping
behavior are different contracts. This report does not silently convert the
strict benchmark into ordinary App recovery or claim the external image failure
was fixed in production.

### Attempt 5: full timebox, incomplete artwork acceptance

The drawing ran for the full 15-minute window and stopped for work-deadline,
not tool-failure. The original native thread wrote the complete 377-line report
in another 289.278 seconds. The work turn is
`01a1b675-62d2-7a03-9600-c2280edcd171`; the report turn is
`01a1b683-15b8-7231-8e56-eaafc386619b`. No new provider thread was created.
The drawing prompt hash matches the immutable fixture. No source changes occurred
from launch through complete evidence cleanup.

Four applications created 15,910 non-workspace elements: four groups, 15,760
vectors and 146 ovals. Base, eight tower tiers, crown/spire and ornaments are
visible. The runner's final, spire, base and native-detail images were inspected.
They show editable repeated geometry and detailed frames; they do not establish
architectural accuracy or complete requested detail. The AI saw only three
review overviews and submitted no formal judgments or dataQueries. Capture
coverage was seven required checks, zero passed, accepted=false. Additional
louvers and ornament seams were announced but not executed. The runner's later
native-detail screenshot must not be attributed to the AI's drawing-time review.

The report and reload did not change the document. sequence/durableSequence are
503/503, reloadDocumentUnchanged=true, and errors/evidenceErrors are empty.
The AI's report correctly lacked this later persistence evidence; the host now
confirms durability. The full recording includes three automatic fit operations
at 522.509, 603.474 and 747.138 seconds as applied geometry expanded. No new
capture/render pass or release workflow was launched for this report.

| Final-run measure | Observed value | Interpretation |
| --- | ---: | --- |
| App contract/search calls | 11 | Nine initial selections, two continuation pages |
| Purpose queries | 3 | Import directly executable; edit/group searches returned menus |
| Discovery reply text | 138,568 bytes | All completed outer discovery replies, including page wrappers |
| Host submissions | 7 | One pre-dispatch rejection, six successes |
| Execution reply text | 11,491 bytes | Excludes image bytes and internal receipts |
| Total measured outer reply text | 150,059 bytes | Not provider token usage or total network traffic |
| Saved names | 10 | Four authored inputs and six public results |
| Named input bindings / step input bindings | 0 / 0 | Saved values were not consumed through those mechanisms |
| Source-key map adoption | 0 | includeTargets/createdTargets were not selected |
| Pure saved-value forwarding calls | 0 | Do not confuse this with all avoidable calls |
| Avoidable image/result delivery recovery | 1 | Reused imported assets, no second download |
| Formal visual judgments / data queries | 0 / 0 | Full artwork acceptance is still pending |

The output-delivery chain is particularly concrete:

1. E1 selected `/references` from the import result; that path is not guaranteed
   by the current multi-shape output contract. Admission rejected before work.
2. E2 removed selected delivery but retained criteria. Existing retention behavior
   defaults to a status reply: 100 text bytes, zero images. `response:full` is a
   different option and does not override selected-retention delivery.
3. E3 invoked import with refresh/output and received the two cached images:
   2,688 text bytes, two images, acquisition=reused, acquisitionAttempts=1.

The owner accepted the corrected workflow and did not redownload assets. It is
also clear that the agent needed two extra submissions beyond a correctly
selected initial delivery. The first is input correction; the second is image
handoff recovery, not a pure ID-copy call. The current contract explains status
retention and guaranteed paths, so this is not evidence that storage is broken.
It is evidence that output selection and mixed metadata/media delivery still
create friction. A future change should examine call-shape-specific result
contracts and explicit media delivery together, with this exact sequence as a
regression, instead of adding another general reminder or widening all paths.

Five acquisition replies concerned capabilities never executed: vector-pattern,
data review, projected-source editing, a group menu and group usage. Their outer
text totals 58,528 bytes. Non-use alone does not prove the reads were pointless:
work was cut off while the AI was planning refinements. It does show that smaller
acquisition has not been demonstrated across this entire live task. The two
initial paged contracts contain 56,547 content bytes; their outer wrappers total
64,237 bytes. Do not equate these different boundaries or compare this incomplete
artwork to a previously completed drawing as a speed benchmark.

The long gap after reference delivery is observable; its internal cause is not.
The last reference delivery was at about 113 seconds and the next host submission
at about 519 seconds. The AI explains geometry authoring, contract reading and
reference interpretation at a high level. Provider records do not separate model
inference, scheduling, input generation or network time. The report must not
attribute the whole interval to App execution or claim a measured speed gain.

### Remaining distinctions and follow-up evidence

- Search: the exact `from URL` import variant now reaches executable usage in one
  call (attempts 2 and 5). Opaque-name behavior is formally tested. This does not
  prove every compound purpose query is solved.
- Handoff: multi-operation host calls and acknowledgment preservation are proven.
  Direct optional query-to-sort binding is formally tested; attempt 5 did not use
  it. Capture plus data acquisition is formally tested, not adopted in attempt 5.
- Preservation: App storage and cross-request map consumption are formally tested.
  Attempt 3 consumed named roots and reference-use receipts, but no live attempt
  consumed createdTargets. Attempt 5 saved ten names without named consumption.
- Review: observation and explicit judgment remain separate. A full-height picture
  is not a completed acceptance receipt. Do not force automatic approval to fit
  the deadline.
- Report evidence: local-ai-provider.ts currently supplements reports from
  requestContext.receipts[].actionResults. Native preparation/import prefix results
  can therefore remain absent from that bounded supplement after a strict stop.
  Attempts 3 and 4 expose this limitation; provider JSONL preserves the missing
  facts. Extending that bounded supplement is a separate, concrete evidence task,
  not a reason to fabricate certainty in the original AI reports.
- External research: the AI reports that readable web source bodies were absent
  while it wrote verified-source statements. This is a self-reported provenance
  concern, not an independently confirmed App delivery defect. No new external
  research or source-verification implementation was added in this task.

The five implementation slices and focused checks are delivered. The final live
run and unlimited original-thread report are complete as a timeboxed evaluation;
whole-artwork acceptance remains incomplete. No claim of uniformly lower latency,
complete model adoption or absence of all future tool errors is made.

## Full original reports and final media

- [Attempt 1 full original AI report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794058385599/self-report.txt)
- [Attempt 2 full original AI report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794060038560/self-report.txt)
- [Attempt 3 full original AI report - browser evidence incomplete](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794060989815/self-report.txt)
- [Attempt 4 full original AI report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794062043662/self-report.txt)
- [Attempt 5 full original AI report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794062501433/self-report.txt)
- [Attempt 5 final screenshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794062501433/final.png)
- [Attempt 5 native detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794062501433/native-detail.png)
- [Attempt 5 recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794062501433/recording.webm)
- [Attempt 5 run and evidence metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794062501433/run.json)
