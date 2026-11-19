# Taipei 101 - Staged execution and conversation context

## Result and evidence

Implementation and focused validation completed. The live test reached its
fifteen-minute drawing deadline with full building geometry but unfinished visual
acceptance. The original AI then completed an unlimited report in the same native
thread. This is a partial drawing delivery, not an accepted finished illustration.

| Measurement              | Observed result                                                    |
| ------------------------ | ------------------------------------------------------------------ |
| Run                      | `taipei-101-fixed-1793900303093`                                   |
| Started                  | November 6, 2026, 01:38:23 Asia/Taipei                             |
| Drawing                  | 899.716 seconds; interrupted at the configured deadline            |
| Report                   | 602.310 seconds; completed without a report timeout                |
| Native thread            | `01a1acca-6ef8-7022-bd60-ba27108460cc` for both phases             |
| Drawing turn             | `01a1acca-6f5e-72c0-b617-453f0104cab0`                             |
| Report turn              | `01a1acd8-2503-7950-a5ed-9363faf4e881`                             |
| Prompt SHA-256           | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Document                 | 14,294 vectors, 392 ovals, four groups, plus the workspace         |
| Persistence              | Sequence 465 equals durable sequence 465; reload unchanged         |
| Report-only phase        | Document unchanged                                                 |
| Runner / evidence errors | Zero / zero; runner exit 0                                         |
| Frozen files             | All 122 source/test/document checksums unchanged                   |
| Cleanup                  | Vite, collaboration and document-backend PIDs stopped              |

[Original AI report - complete and unedited](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793900303093/self-report.txt)

- [Same-session evidence](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793900303093/self-report-evidence.json)
- [Run metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793900303093/run.json)
- [Provider records](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793900303093/provider-records/33dcc813-9e3c-43e9-a75a-34dea5ce7fe2.jsonl)
- [Recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793900303093/recording.webm)
- [Final overview](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793900303093/final.png)
- [Reload overview](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793900303093/reload.png)
- [Tier detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793900303093/tiers.png)
- [Frozen checksums](../../../../../tmp/staged-live-source.json)

The original-language report is immutable generated evidence. Its references to
the user stopping work mean the configured deadline, not a new manual stop. Its
unknown persistence status describes what the AI had verified; the runner
subsequently established durable persistence and reload equality. The AI used
`unsupported` in its final reporting action; the App settlement is `partial`.
Neither means the drawing tools lack the requested general capability.

## Implemented and reviewed changes

1. Selected authored inputs can be retained with `source: "input"`, alongside
   selected public results, in the existing App conversation context. This
   supports later continuation and recovery even without a known future consumer.
   Same-call aliases use canonical authored inputs; later turns use the App store.
2. Retention rejection identifies the requested alias and exact blocked field
   paths. It preserves successful writes and does not silently strip fields.
3. `execute_design.stages` lowers to the existing runtime sequence and iteration
   checkpoints. Each stage can prepare, check/repair and apply before proceeding.
   Full admission remains before writes; no new public dispatcher was introduced.
4. Eligible immutable-input preparation can overlap a preceding application.
   Owner contracts and actual bindings determine eligibility; document-dependent
   work waits. Started branches settle and keep separate receipts on failure.
5. The canonical prepared application now permits composition. Existing curve
   handle metadata answers the prior recorded `smooth vector path curves` query.
   Existing scoped review invalidation remains intact. Selected preparation
   contracts were not shortened without evidence of redundant content.

Self-review corrected canonical application eligibility and concurrent receipt
ownership, and exercised the published staged example through the real host.
Validation passed: 115 runtime cases; 467 App node cases (two opt-in cases skipped);
22 created-target/retention cases; two conversation-store cases; twelve
Inspector/recorder cases; one browser stage-visibility and Undo/Redo case.
App typechecks, scoped formatting/lint and naming checks passed. The browser
case showed stage A on the actual canvas while B preparation had completed and
A's acknowledgement was pending, then both stages. No full local test, release
workflow, dependency installation, commit or push was performed.

## Actual live execution and adoption

Times below are provider request trace seconds; they differ slightly from runner
sampling. Internal leaves and sequence receipts are not additional model calls.

| Completion | Outer call                                | Measured call duration | Outcome and handoff                                                                         |
| ---------- | ----------------------------------------- | ---------------------: | ------------------------------------------------------------------------------------------- |
| 220.192 s  | Main `prepare_and_apply_design`           |                8.728 s | Main geometry automatically split and applied within one delegation; then visual inspection |
| 438.232 s  | Detail `prepare_and_apply_design`         |                0.648 s | Ornament, facade and entrance details applied; then grouping and inspection                 |
| 472.881 s  | Facts, calculations and grouping sequence |                0.006 s | Admission rejected ineligible `record_design_facts`; no steps started                       |
| 481.566 s  | Grouping sequence                         |                0.284 s | Grouping succeeded; whole-receipt retention rejected request references                     |
| 814.161 s  | Ordering plus smooth ornament sequence    |                0.393 s | Both operations completed; authored draft and root ID saved; then visual inspection         |
| 858.416 s  | Two current-document queries              |                0.060 s | Spire/base IDs and dimensions returned; then formal data-evidence acquisition               |

The runner observed its first paint opportunity at 213.017 seconds, and fit-zoom
at 217.121 and 220.547 seconds. A paint opportunity is not an independently timed
visual acceptance. Initial preparation was not postponed until all later detail
decisions; the ready-parts workflow already applied the main building early.

| Mechanism                      | Live adoption                                             |
| ------------------------------ | --------------------------------------------------------- |
| One-call related operations    | Ordering plus ornament generation; paired data queries    |
| Explicit `stages`              | None                                                      |
| Submitted mechanical iteration | None                                                      |
| Inter-step argument binding    | None; retain selectors are not argument bindings          |
| Authored-input retention       | `taipeiSmoothDraft`, from `/draft` with `source: "input"` |
| Result retention               | `taipeiSmoothRoot`, from `/compositionIds/0`              |
| Later named consumption        | None in this run                                          |
| Template overrides             | Used within drafts                                        |
| Cross-stage template export    | Not called                                                |
| Knowledge                      | No discovery or reads                                     |
| Measured staged overlap        | Not demonstrated by this live run                         |

The successful correction returned 964 recorded JSON bytes while saving both
values. The AI explicitly says it retained them for possible editing, provenance
and recovery, despite no decided next consumer. The first two large drafts were
not named; the AI does not claim a deliberate evaluated reason for omitting them.
This is evidence of partial adoption, not universal use or measured reuse savings.

## Failures, recovery and remaining limits

| Observation                                        | Classification supported by evidence                                                                                                                                                                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Facts/calculations attempted inside a sequence     | Existing eligibility boundary, not a staged runtime crash. `local-tool-host.ts` defaults unspecified composition to control-plane; sequence admission requires allowed dependencies. Standalone recording succeeded. Do not infer the boundary should be removed without reviewing those owners. |
| Whole `taipeiGroupReceipt` could not be saved      | Correct lifetime rejection. Exact `/actionResults/0/result/retained/snapshotId` and `/actionResults/0/result/retained/leaseId` paths were returned; the successful grouping was not replayed. Narrow public-ID retention is already available and covered by the real-receipt regression.        |
| Curve discovery missed again                       | The new query was `vector smooth corners bezier`, not the fixed historical query. All-term purpose matching still has vocabulary limits. This run does not prove comprehensive semantic retrieval.                                                                                               |
| Guessed delete owner and unsupported context scope | Contract acquisition errors followed by recovery; no failed drawing write or successful-write replay.                                                                                                                                                                                            |
| Reference import HTTP 404                          | One candidate failed; the other succeeded. No evidence of total import failure.                                                                                                                                                                                                                  |
| Final artifact-backed data query unavailable       | Reported request-reference failure; cause not established here. Current-document queries recovered. Do not infer expiration or capacity from the error alone.                                                                                                                                    |
| Base ribs obscured circular ornaments              | Actual visual authoring/order problem, corrected with relative ordering. Earlier authored order review could prevent it.                                                                                                                                                                         |
| Angular ornament and crossing band                 | Actual visual correction; AI added smooth shapes and retained their draft. Some older covered geometry remains. This does not prove every replacement should become a host repair loop.                                                                                                          |
| Final review incomplete                            | Four passed and six pending review units in the last evidence. Corrected detail and dimension/type evidence had not been fully adjudicated before the deadline.                                                                                                                                  |

The overview and enlarged tier image show the full editable building and dense
facade detail. They are not proof of exact real-world dimensions or complete
photographic fidelity. Local dimensions remain estimates. The known height is
508 m before projection; no claim is made that all facade dimensions were verified.

## Calls, returned data and waits

There were 41 outer App tool completions: 19 discovery, eight review, four direct
context reads, four execute calls, two direct prepare/apply, and one each of facts,
calculations, reference import and reference selection. Internal leaves are
excluded. The AI additionally counts ten native declaration searches and two web
calls; these are a separate provider path, not App catalog calls.

Recorded JSON output payloads for those 41 App completions total 255,296 bytes;
the 19 discovery completions account for 190,290 bytes. These are recorder payload
bytes including wrappers, not a wire-byte or token total. The two paginated
contract contents report 25,202 and 23,771 bytes (48,973 combined); those selected
contents must not be confused with the sum of all discovery responses.

Provider usage covers drawing plus reporting: 1,502.048 seconds total, 21.545
seconds observed tool/research time and 1,480.504 seconds outside that observed
bucket. Reporting alone took 602.310 seconds. The outside bucket cannot be called
pure model thought or network delay. Reported tokens are 3,938,160 input, including
3,707,264 cached, and 41,642 output. These are cumulative provider accounting,
not unique prompt size or a measured credit charge.

The AI attributes long action-free periods to contract acquisition, writing the
large main/detail inputs, inspecting native-resolution images, choosing ornament
repairs, and recovering unavailable targets. The trace supports the work order,
but not a precise causal split among inference, scheduling, network and images.
No chain-of-thought inference is needed to establish those observable stages.

Potential avoidable work includes unused vector/delete acquisition, wrong route
and scope retries, predictable overlap mistakes, and the final region-to-ID-to-data
sequence. The last sequence also creates new signed evidence and reads types:
calling it a pure copy operation would be misleading. No strictly transfer-only
call is established; several calls contain both already-known data and new work.
Visual decisions between main geometry, detail generation and correction genuinely
needed images. No submitted mechanical predicate proves they could all run without
returning to the AI.

## AI recommendations and assessment

The complete original report contains fifteen sections and detailed tables.
Its useful recommendations are clearer composition eligibility, selected public
retention, less declaration-search friction, direct region-bound data evidence,
earlier overlap/order checks and earlier preservation of useful authored context.

Selected field retention already exists and worked; adding another store is not
justified. Native provider declaration ranking is distinct from App metadata.
Region evidence and unavailable artifacts need owner-level investigation before
new APIs or lifecycle changes. More mandatory Knowledge or mandatory recipe use
does not follow from this run. Existing partial settlement, native-resolution
review, successful-part preservation and document persistence should remain.

This bounded implementation is validated, but the run does not demonstrate
adoption of explicit stages, safe overlap or a stable speed improvement. No
post-run production change was made from the AI's recommendations. The parent
plan remains active; new findings are evidence for a subsequent scoped decision.
