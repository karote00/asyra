# Taipei 101 - Continuation contracts and eighteen-minute validation

The authorized three handoffs are implemented and focused regressions pass. The
unchanged-prompt drawing ended naturally after 14m59s, within its eighteen-minute
ceiling. The original AI completed an unlimited report in the same native thread.
The original runner exited 1 because post-report browser evidence collection
failed. A separate read-only recovery proved that the saved document equals the
work-completion snapshot and recovered the final image and durable receipt.
This is not a clean end-to-end runner pass or an independent visual acceptance.

The live run also exposed a real catalog defect in the new direct-entry contract.
That defect was corrected after the frozen run and verified through the real host
with the failed query. The recording belongs to the pre-correction frozen source;
the final catalog correction has focused, not another live-model, validation.

## Evidence and timing

| Measurement | Result |
| --- | --- |
| Run | `taipei-101-fixed-1793905217176` |
| Started | November 6, 2026, 03:00:17 Asia/Taipei |
| Drawing ceiling | 1080 seconds; original prompt unchanged |
| Drawing duration | 899.365 seconds; natural completion, no deadline interruption |
| Report duration | 521.246 seconds; no report timeout |
| Native thread | `01a1ad15-741c-7473-b358-ac2bd9203766` in both phases |
| Drawing turn | `01a1ad15-748c-78a1-8daf-6a70e059d5ff` |
| Report turn | `01a1ad23-27a9-76c3-8a03-eb75d465ac77` |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| First recorded paint opportunity | 257.130 seconds; not a measured human perception time |
| Canonical elements | 17,732 vectors, 173 ovals, seven groups, one workspace |
| Original runner | Exit 1; report collected, subsequent browser evidence unavailable |
| Recovery | Canonical document equals work snapshot; original run unchanged |
| Durable receipt | Sequence 584 equals durable sequence 584; generation 0 |
| Recovery AI requests / page errors | 0 / 0 |
| Source freeze | 130 file hashes unchanged until original runner cleanup |
| Video | Raw WebM, 122,367,688 bytes, 24m10s; frames at 400s and 900s decoded and inspected |
| Service cleanup | Original and recovery Vite, collaboration and backend ports released |

Evidence paths below are local and immutable except for separately appended
analysis/recovery artifacts. The report is the AI's complete original text, not
an edited reconstruction.

- [Original AI report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793905217176/self-report.txt)
- [Original run and failures](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793905217176/run.json)
- [Report provenance](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793905217176/self-report-evidence.json)
- [Measured calls and gaps](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793905217176/continuation-analysis.json)
- [Recovery receipt](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793905217176/recovery/recovery.json)
- [Recovered final screenshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793905217176/recovery/final.png)
- [Original raw recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793905217176/browser-artifacts/page@641de49b494f362e5b905398e283ba63.webm)
- [Video recovery checks](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793905217176/recovery/video-evidence.json)

## Implementation and actual adoption

| Handoff | Implementation and regression | Live observation |
| --- | --- | --- |
| Sources and calculations | Existing validators now allow ordered composition; invalid source prevents downstream work | AI tried criteria plus facts/calculation, but criteria remains control-plane. It later recorded calculation alone; combined facts/calculation adoption is not proven |
| Direct retention/delivery | Direct prepare/apply lowers into the existing sequence and App store; defaults preserved; unavailable store rejects before drawing; save failure does not replay drawing | Direct entry was not used because scoped discovery failed. Corrected native catalog now passes the actual query; no claim of live direct-retention adoption |
| Selected artifact lifetime | Selected prior-step outputs export typed provenance through runtime admission; public field schema comes from the original owner | Formal replay of the preceding smooth-ornament input now reaches canonical artifact-backed data review. This live AI used IDs, not artifact data review |
| Bounded region data review | One canonical query resolves membership and values; later judgment revalidates the same region and values | Not used in live dataQueries; no demonstrated live ID-lookup saving |
| Staged execution | Existing stage owner remains responsible for preparation, optional iteration, application and dependencies | Seven stages applied, seven preparation-to-application bindings, no artifact ID relay through the AI |
| Named preservation | Existing conversation-owned context retains authored sources/public values across requests | Eleven names saved: seven authored inputs and four public outputs; zero later named consumption |
| Mechanical iteration | Existing explicit conditions remain available | No explicit iteration/check-repair loop submitted |

The new catalog defect was not a model mistake. `host.definitions()` previously
published normalized runtime leaf input fields and reattached the original scope
declaration. Direct retention fields had been removed from the runtime leaf, so
valid native usage queries failed with `Only optional canonical root inputs may
be selected`. Owner-only discovery tests did not traverse that production adapter.
The added permanent test traverses the real host and reproduces the exact failure
before the correction. Native discovery now derives its input from the owner;
internal leaf admission still excludes direct-only delivery controls. No scope
validator was weakened.

## Calls, returned data and execution grouping

| Recorded outer App call | Count |
| --- | ---: |
| describe_design_apis | 20 |
| execute_design | 12 |
| review_drawing | 10 |
| define_design_criteria | 1 |
| read_design_checks | 1 |
| Total | 44 |

The AI additionally reports seven native tool searches and two web-tool calls.
Those are separate from the App's 44 outer calls and from nested host execution.
Recorded outer input JSON totals 66,172 bytes; recorded outer result JSON totals
1,771,769 bytes. Discovery contributes 203,027 result bytes. These are recorded
App payload sizes, not token billing or a complete native transport total.
Images and provider presentation/truncation have separate accounting.

A single six-operation edit at 679.031s accounts for 1,493,110 result bytes
(84.3% of recorded outer results). The AI omitted compact delivery and received
large accepted-ID receipts; its report acknowledges truncation. Existing status
or selected-field delivery could reduce this result. This run does not justify
changing all default receipts or adding another result store.

| Sequence | Work/result | Why control returned |
| --- | --- | --- |
| E1/E2 | Criteria/facts/calculation rejected before writes | Missing selected step, then ineligible criteria operation |
| E3 | Base and tiers; two prepare/apply stages | Continued authored input preparation; no intervening visual decision |
| E4 | Crown and ornaments; two stages | First visual inspection |
| E5 | Known-root bounds | Parameters and local inspection decisions |
| E6/E7 | Empty target selection, then three bounded context reads | Recover actual expanded names; no mutation in E6 |
| E8 | 10,832 fill changes and nine hidden rings | Continued already planned detail work |
| E9 | Three detail stages | Inspect new details and occlusion |
| E10 | Six fill/opacity/order changes | Visual assessment of reflection and ornaments |
| E11 | Six visibility/material changes, status-only result | Final visual inspection |
| E12 | Record height calculation | Data judgment; could have been recorded earlier |

The host actually overlapped preparation with independent application:

| Applied step | Application interval | Independent preparation inside that interval |
| --- | --- | --- |
| base-write | 256.379–258.009s | tier-source: 256.379–256.706s |
| crown-write | 365.191–365.992s | ornament-source: 365.195–365.259s |
| base-detail application | 605.905–606.300s | tier-detail-source: 605.909–606.073s |
| tier-detail application | 606.301–611.604s | crown-detail-source: 606.301–606.642s |

This confirms overlap for these steps. It does not measure a stable overall speed
improvement. The AI's own report correctly did not infer overlap because it did
not have these timestamps.

## Waiting, correction and responsibility

| No outer App-tool interval | Duration | Supported explanation and limit |
| --- | ---: | --- |
| 144.701–256.217s | 111.516s | Authoring base/tier inputs after criteria; no App operation executing |
| 262.947–365.100s | 102.152s | Preparing crown/ornament inputs; AI acknowledges no visual decision between these batches |
| 489.516–605.846s | 116.330s | Preparing three detail drafts after material edit; consolidation may avoid one model handoff |
| 62.249–113.210s | 50.961s | Research/input preparation before the rejected planning sequence |
| 710.943–759.347s | 48.403s | After image review, authoring final material/occlusion corrections |
| 838.594–873.846s | 35.252s | Final evidence/judgment work |

These are gaps between recorded App calls, not proof of idle provider time.
Research, inference, input generation and scheduling cannot be separated from
these timestamps. The original AI explicitly states it lacks that telemetry.
It identifies large input preparation, visual decisions, discovery recovery,
receipt handling and evidence binding as work performed between calls; it does
not claim a measured causal breakdown.

| Finding | Classification | Action in this task |
| --- | --- | --- |
| Three valid scoped usage failures | Reproduced host contract bug | Fixed after live run; real-host red/green regression |
| Selected artifact unavailable in preceding run | Reproduced export/provenance bug | Fixed before live; recorded ornament replay and earlier-producer tests pass |
| Criteria inside execute and missing retain step | Submitted input/routing mistakes; existing checks reject before writes | Preserve validation; no forced composition of control-plane operations |
| Saving two artifact handles across turns | Correct request-lifetime rejection; drawing already applied | Preserve sources/public values; no write replay |
| Empty ring target | AI assumed prefix rather than actual expanded-name suffix | Existing bounded query recovered names; no mutation was submitted on empty selection |
| Color edits leave old gradient visible | Existing fill behavior used incompletely | AI explicitly cleared gradient and selected solid mode; no universal destructive fill conversion |
| New detail obscures ornaments/circular motifs | Visual layering/design error revealed by images | AI corrected visibility/order; not a general host execution failure |
| supersedes required after changing check scope | Existing evidence-consistency protection | AI supplied current revision/reason; preserve protection |
| Large accepted-ID result | Existing compact delivery not selected | Record missed opportunity; do not force all outputs to status |
| Original browser evidence loss | Real harness closeout failure; root cause not established here | Preserve failure; recover saved document/receipt/image and validate raw video separately |

The bounded host evidence shown to the AI included 41,106 action results with
41,074 omitted, mainly inspection validation in the visible subset. That is not
41,106 model calls or drawing operations. This report does not establish whether
validation work counts caused browser loss. A separate owner/performance analysis
would be needed; no patch or caching change is justified by correlation alone.

## AI assessment and independent limits

The AI reports that stage bindings removed all seven prepare-result-to-apply relay
round trips. It preserved useful intermediate decisions without needing certainty
that they would be reused, consistent with the intended context model. It also
admits it did not consume named results later, did not use Knowledge, and did not
submit automatic mechanical iteration.

Its negative findings include repeated contract discovery, avoidable admission
mistakes, duplicated authored templates, excessive result delivery, incomplete
initial fill semantics, late painter-order corrections and administrative evidence
rebinding. It proposes compact mutation receipts, clearer fill-state semantics,
more useful target metadata and precise discovery. These are proposals, not all
confirmed missing capabilities. Status delivery, scoped queries, input templates,
explicit target references and validation already exist.

The AI recorded five required criteria as passed and no pending/stale checks, but
explicitly qualified its prior completion claim: detailed real-world component
dimensions were estimated, visual acceptance was its own judgment, and it lacked
its own final persistence receipt. Our later read-only recovery establishes
persistence and document equality, not architectural accuracy or photorealism.

The recovered overview shows the complete silhouette, eight tiers, crown/spire,
window grids and base. A low-zoom overview is not independent validation of small
ornament geometry or every intersection. No claim that every visual detail is
correct is made.

## Validation and remaining boundaries

Focused validation includes 114 runtime admission/execution cases, 70 final
creation/host cases, two canonical data-review cases, 73 discovery-delivery cases
(two unrelated opt-in skips), 122 review-stage cases, 25 evaluation-window cases,
and 19 recorder/Inspector cases. Scoped lint, App typechecks, runtime build and
naming pass. No full local test, release flow, commit or push was run.

The recovery script is retained as a formal project-owned read-only diagnostic.
It blocks AI POST requests, verifies saved canonical equality and durable sequence,
preserves original run evidence, and cleans up owned processes. Original report
receipt extraction from the closed App page remains unavailable; the full report
and native thread provenance were collected directly from provider evidence.

The broader Editable Design Agent plan remains active. Current implementation
work is complete; stable model adoption, general visual quality, native-provider
search behavior and the unresolved browser-close cause are not claimed solved.
