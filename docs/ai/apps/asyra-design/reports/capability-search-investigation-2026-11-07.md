# Capability Search - End-to-End Investigation

## Status and scope

Completed the bounded search/acquisition task after six launches. The user reduced
the allowance from thirty to fifteen during attempt 6; no counter reset occurred.
The final source passed its focused contract gates and completed drawing plus an
unlimited report in the original native thread. This does not certify architectural
fidelity or universal search recall. Earlier sections preserve the investigation's
entry-state findings; the implementation and final evidence sections describe the
corrected state. Three independently reproduced baseline test discrepancies remain
outside this bounded correction, and no full-suite result is claimed.
The active scope is
[Capability search and precise acquisition](../plans/staged-design-execution-plan.md#follow-up-capability-search-and-precise-acquisition).

The central defect is not missing tool names. Search treats instructions, schema
fields, execution receipts and capability descriptions as interchangeable text,
then counts substring matches equally. The first correction improved recall for
recorded queries, but did not establish reliable retrieval across the real catalog.
Its first-sentence menu reduction also introduced a separate information loss.

The investigation used current registrations, complete provider construction,
actual delivery and exact acquisition, prior attempt receipts, and focused tests.
Git history identified the successive discovery/delivery owner changes; current
source and contracts, not deleted implementations, determine expected behavior.
No native provider ranking algorithm was inferred from the model's self-report.

## Routes at investigation entry

| Handoff                       | Current owner and information                                          | Finding                                                                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Author capability             | App action definitions and native owner definitions                    | Descriptions, input/output schemas and execution semantics already exist. Basic API descriptions start with an operation identity followed by prose.                                             |
| Register                      | `local-tool-host.ts`, `local-tool-library.ts`, Runtime action registry | Qualified identities, revisions, availability and request ownership are preserved. Host schemas add invocation outcomes and lifecycle contracts.                                                 |
| Advertise native declarations | `local-ai-provider.ts`                                                 | Native groups publish owner name, description and native input schema. Only discovery and execution host entries are eager. Registry-only tools are not advertised as separate native functions. |
| Build App discovery inventory | `local-operation-tools.ts` through `host.definitions()`                | Uses admitted actions and current registered native/saved definitions. Host output schemas participate in metadata indexing. This is a different representation from native declarations.        |
| Search by purpose             | `metadataText` and `searchCapabilities`                                | Descriptions and nested schema text are flattened; arbitrary substrings count as words; every term has the same weight. String enum/const choices are omitted.                                   |
| Deliver candidates            | Same owner                                                             | Sixteen results per page. Results are sorted together, then split into API/tool arrays without a shared rank. First-sentence summaries can remove all useful prose.                              |
| Acquire contract              | Exact names/operations, scopes, fields, continuations                  | This route works for the independently tested owners even when purpose retrieval fails. Complete selected contracts remain separately available.                                                 |
| Invoke                        | Native declaration or returned host/registered route                   | Search does not grant execution. Registry revision, canonical wrapper identity, composition admission and downstream validation remain authoritative.                                            |

The native and App schemas should not be made byte-identical: their input,
output, lifecycle and routing responsibilities differ. They must describe the
same capability and preserve exact acquisition identities. Copying host receipts
into native declarations would increase noise rather than fix this handoff.

## Reproduced findings

Tests construct the real App runtime action catalog and the normal provider host;
only the external provider transport is simulated. These are deterministic local
regressions, not additional live-model launches. Exact follow-up acquisition
succeeds and no canvas mutation is dispatched in every case below.

| Independent query                                                       | Matches | Applicable owner on first page   | Interpretation                                                                                                            |
| ----------------------------------------------------------------------- | ------: | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `import public image`                                                   |     198 | Yes                              | Useful recall, but very broad candidate set.                                                                              |
| `select retained attachments for visual comparison`                     |     223 | Yes, third within native entries | Not itself a failure: preparation and criteria registration can also select references.                                   |
| `recompile existing world linear field`                                 |     184 | Yes                              | Existing material precondition is already discoverable.                                                                   |
| `group existing elements`                                               |     203 | Yes, third within API entries    | Retrieval succeeds, but the description is only `hierarchy.groupElements.`.                                               |
| `bevel`                                                                 |       0 | No                               | Real false negative. `stroke.updateStrokeFieldsBatch` accepts `patch.joinType = "bevel"`; the index ignores enum values.  |
| `Please find a tool to group existing elements so I can use the result` |     230 | No                               | Adding normal request wording displaces the grouping owner from the first sixteen results. Exact acquisition still works. |

### 1. Token matching and ranking lose the intended operation

The natural-language grouping query ranks visibility, deletion and movement above
the requested grouping owner. The returned match evidence credits words such as
`a`, `i`, `so`, `the` and `result`; `includes` can find short strings inside unrelated
words. Broad receipts and common execution instructions contribute the same weight
as an operation's purpose. The former all-terms requirement caused empty results;
the new any-term recall exposes this ranking defect instead of solving it.

This is an App retrieval defect, not proof that the model chose a wrong operation.
The first-page miss can cause extra paging or query reformulation. No measured
number of model waiting seconds is attributed to it.

### 2. Legal parameter choices are missing from the index

The Stroke schema contains `joinType` with `miter`, `bevel` and `round`, inherited
from the canonical utility constants. Exact usage delivers that schema, but a
purpose query for `bevel` finds nothing. Indexing descriptions more deeply did not
cover legal enum/const vocabulary. Examples and defaults remain non-capability
data and should not become search authority.

### 3. Menu compression discards the capability description

`defineBasicApi` authors descriptions as an operation identity followed by prose.
The new first-sentence implementation therefore returns only the identity for
basic APIs. The grouping regression expects the canonical explanation, “Group the
supplied element IDs,” but receives only `hierarchy.groupElements.`.

The workflow owner has the complementary problem: its first sentence explains an
optional review plan; its prepare/apply purpose appears later. A shorter reply is
not an improvement if selecting an applicable capability now requires another
lookup. Repair the summary producer and its contract, not individual tool names.

### 4. Real capabilities and incidental context need different treatment

Reference-selection fields in preparation and criteria registration are real
inputs and are consumed by the review owner. Their presence in search results is
not automatically noise. The hypothesis that these specific matches were merely
unrelated output text was too strong and is rejected.

However, the current search cannot distinguish purpose, input choices, semantic
outputs, common host receipt fields, references to other tools or limitations.
These are all concatenated before ranking. The correction must preserve useful
secondary capabilities without allowing shared boilerplate to dominate retrieval.
Do not impose a universal “one preferred primitive must rank first” requirement.

### 5. Native discovery is a separate evidence gap

The original AI reports three native declaration searches and one retry: its first
attempt to obtain `select_design_references` returned `review_prepared_design`.
The actual advertised catalog contains the correct selection declaration once,
with its qualified namespace and input schema. App records do not include the
native finder's actual query and candidate response, so this ranking incident is
not independently reproduced.

The existing provider tests titled native discovery inject MCP resource-listing
events. They verify lifecycle recording and non-retention of private content;
they do not test native tool-finder relevance. Passing those tests cannot establish
that both search routes are reliable. Public query/result telemetry should be
recorded only if the actual provider protocol exposes it; reasoning content is
neither necessary nor acceptable as a substitute. Do not invent unsupported events
or treat a fixture as proof of real-provider observability.

## Existing behavior that should remain

- Exact names/semantic operations acquire the selected contract without a fuzzy
  substitute. Missing and ambiguous names remain explicit.
- Native namespace collisions return qualified choices. A foreign same-name
  saved tool is not a canonical action wrapper or recipe dependency.
- Registry availability excludes suspended/retired entries and foreign-request
  candidates. Existing generation invalidation refreshes registered additions,
  replacements and removal; the metadata cache is request-owned.
- Scoped usage, selected fields, full schemas and bounded continuations retain
  their existing validation and recovery contracts.
- Candidate discovery does not execute, silently pick targets or imply approval.
- Material recompilation already begins its description with the requirement for
  an existing explicit world linear field. The latest AI requested that clarification,
  but the source already supplies it. Do not add a duplicate reminder.

The earlier a/b/c tests prove metadata lookup in a tiny authored catalog. They do
not prove robustness under the real catalog, shared schema growth or unrelated
wording. Keep their identity guarantees and add realistic interference cases.

## Attempt 1 evidence and limits

Evidence directory: `tmp/conversation-improvements/live/taipei-101-fixed-1793979557467`.
Request: `acd58145-25bb-4fcd-8574-af14a5ca6c47`.
Original provider thread: `01a1b183-cecc-7352-95cf-fda6f7cb162f`.

| Measure                                                            |                                      Result |
| ------------------------------------------------------------------ | ------------------------------------------: |
| Drawing                                                            |            899735 ms; deadline interruption |
| Original-thread report                                             | 456038 ms; completed without report timeout |
| App calls                                                          |                                          32 |
| Discovery/acquisition calls                                        |                       16; 201926 text bytes |
| Purpose-menu calls                                                 |                              2; 27638 bytes |
| Other acquisition calls                                            |                            14; 174288 bytes |
| All App text                                                       |                                259833 bytes |
| App-call interval union                                            |                                    28538 ms |
| First paint opportunity                                            |                                   363882 ms |
| Named retained values / later consumption                          |                                      12 / 0 |
| Explicit cross-step input bindings / stages / mechanical iteration |                                   0 / 0 / 0 |
| Drawing primitives                                                 |           24041 vectors, 70 ovals, 7 groups |
| Report changed document                                            |                                          No |
| Reload changed document / evidence errors                          |                                   No / none |

The model reports complete building geometry but unfinished final visual/data
acceptance. The harness later confirms durable sequence 771 and unchanged reload;
the AI did not have that later persistence evidence when writing its report.

One target-count admission rejection performed no writes and was corrected safely.
The selector expected four front-coin elements, but one frame had a different name.
Changing the prefix expectation to three and targeting the frame separately passed.
The owner knows expected and actual counts but returns a generic message without
the failing operation/query. This is a separate diagnostic improvement candidate,
not a reason to remove the guard or classify normal artwork correction as failure.

The prior twenty-attempt task's last run had 160205 discovery bytes and an earlier
first paint. The current run therefore does not establish overall speed or data
improvement. Equivalent deterministic acquisition does improve: the broad material
menu is 5990 bytes in one delivery; the recorded compound menu is 12772 bytes in
one delivery, followed by 30019 bytes of complete scoped usage in two deliveries.
The compound total is 42791 bytes/three deliveries, not just the menu size.

At least 39313 bytes of acquired contracts were not executed: Knowledge,
material-revision/application, data review and image binding. Some selection
depends on model judgment; a host cannot automatically declare those lookups
unnecessary. App execution occupies only part of the elapsed time. Gaps between
calls also include unobserved generation, research and transport, so the report
does not assign them all to reasoning or all to search.

## Revised correction order

1. Repair the search document and ranking together. Preserve field origin;
   include legal string enum/const values; match normalized lexical tokens rather
   than arbitrary substrings. Downweight corpus-common words and shared receipt
   context relative to the operation purpose. Derive this from the admitted
   catalog, not a Taipei-specific synonym list, tool-name exception or new registry.
2. Repair candidate summaries and ordering at the same discovery owner. Keep
   actual purpose prose and relevant applicability information; do not truncate
   at a synthetic identity sentence. Preserve enough ordering information across
   API/native routes to understand relevance. Exact acquisition remains complete.
3. Prove the whole acquisition route with the real catalog: independent queries,
   natural-language wrapping, enum choices, opaque/misleading identities,
   unrelated schema growth, namespace ambiguity, revision/removal, unsupported
   vocabulary and complete selected execution examples. Prove cache invalidation
   and work counts, not only final output. Retain the original recorded queries.
4. Recheck actual native declarations and observable protocol data separately.
   Preserve callable admission and owner lifecycle. Do not claim native search is
   fixed by an App ranking change or force every domain operation into the host.
5. After focused checks and source review, run the unchanged fifteen-minute test
   with an unlimited same-thread report. Track lookup/menu/acquisition/native
   discovery separately, all bytes and pure-transfer calls. Stop for blocking App
   failures; normal visual correction and safe input recovery remain allowed.

The first two corrections share the discovery owner and should be implemented
together after the new regressions establish the failure. Target-count diagnostics
remain separate unless the next real run demonstrates a blocking handoff. No new
App prompt reminder, forced Knowledge use, framework registry, release work,
full-local suite or additional live launch is needed to complete this investigation.

## Focused evidence

- `tmp/search-acquisition-iteration/deep-search-provider-contract-red.log`:
  six complete-catalog cases, three passing and three failing (summary, enum,
  natural-language first-page recall). This is the preserved pre-correction evidence.
- Earlier `deep-search-provider-red-2.log`/`red-3.log` used a provisional top-one
  oracle. That requirement was rejected after owner review; those ranking results
  remain measurements, not product failures. The replacement checks useful
  first-page recall and meaningful descriptions.
- `deep-search-preserved.log`: six selected case assertions pass, but the file's
  global advertised-tool coverage guard fails under a title filter. This run is
  not reported as passing. The complete focused owner file then passes all 202
  cases in `deep-search-owner-preserved.log`; no full local suite is run.
- Original AI report: `self-report.txt` in the live evidence directory. Preserve
  its complete contents; the analysis above is an independent implementation check.

Post-correction evidence is separate: `deep-search-provider-accepted.log` passes
13 cases, including the original cases, generic fill editing and a/b/c owners
registered into the full provider catalog. `deep-search-composition.log` passes
both recorded artifact-key deletion executions. The first scoring candidate still
failed natural-language grouping; field-length normalization corrected it without
a query-specific exception. Exact selected schemas and actual mutation routing
remain unchanged. A subsequent live run is still required; these deterministic
results do not establish improved drawing speed or native finder relevance.

## Attempt 2 - acquisition outcome and evaluation boundary

Source was frozen throughout drawing, original-thread reporting and evidence
closure. Work stopped after 481183 ms; the untimed report completed in 308652 ms.
The drawing had 14516 vectors, 97 ovals and three groups. Durable sequence 461 and
reload matched; report generation did not change the document, and evidence errors
were empty. The original report is retained at
`tmp/conversation-improvements/live/taipei-101-fixed-1793985913649/self-report.txt`.

The final exact lookup requested `fill.updateFills`, `hierarchy.groupElements` and
`element.deleteElements`. The latter two contracts were delivered completely;
`fill.updateFills` does not exist and was absent from earlier provider payloads.
The discovery owner returned partial/completed with `DEFINITION_UNAVAILABLE`.
The evaluation controller interrupted before the model received that result. The
original model therefore reported an interruption without the missing identity;
its suggestion to add per-identity results was based on missing delivered context,
not absence of those fields in the actual App result. No drawing edit failed.

The defect was a producer/consumer distinction, not a missing alias. A completed
identity lookup now exposes typed select-identity recovery while preserving
partial/failed coverage. Unavailable known definitions retain their blocking code.
Continuation pages, retained reads, invocation outcomes and strict evaluation
consume the same distinction; no fuzzy execution or guessed-name compatibility.
The captured input/output is permanent regression evidence. Six new regressions
failed before implementation. All 310 affected owner/evaluation cases passed
(two pre-existing skips); a stricter consumer review then passed its 31 focused
cases. Fourteen provider cases include actual mixed-result delivery, correlated
native failed-item observation, corrected exact acquisition in the same work turn,
and preservation of unknown execution-owner failure. The new provider case also
passes alone through the existing canonical action fixture; its initial isolated
fixture failed on missing browser globals and was corrected without product changes.

Do not interpret other run observations as proven product defects. The reference
import purpose query returned the import tool at shared rank 3; related candidates
are allowed, and availability is not adoption. The model identified crown geometry
and cell-local reflection problems after viewing the image; these are legitimate
visual corrections. Saved author inputs and eight acknowledged aliases were not
consumed before interruption. The model's account of empty Web evidence cannot
prove what the native search backend returned without corresponding public evidence.
The existing facts owner records asserted sources, not independently verified facts.
These remain report findings, not additional implementation scope.

## Attempt 3 - successful-prefix recovery exposes an older contract conflict

The current search code did not encounter a name miss in this run. Only three
App discovery calls occurred, so this run does not live-verify attempt 2's identity
recovery. Work stopped after 348178 ms; the original-thread report completed in
244362 ms. Two parts applied 13454 elements including their root groups. Durable
sequence 423 and reload matched; source remained frozen and evidence errors were
empty. The complete original report remains in
`tmp/conversation-improvements/live/taipei-101-fixed-1793987538688/self-report.txt`.

The crown's nonplanar face was a valid input rejection with an exact retained-draft
repair. The blocking bug occurred later: selected delivery projected completed
prefix recovery before canonical validation. `checks.visitedResults` is required
internally but omitted from model output. The partial result failed schema validation,
then artifact handoff reported unknown settlement. The original AI consequently
could not see the crown diagnosis or four acknowledged drawing saves.

Moving projection alone fixed the premature canonical handoff, but a second
upstream distinction still failed public validation: Runtime normalization deliberately
removes App visibility annotations. Model recovery schemas were incorrectly derived
from that normalized execution contract. The bounded correction preserves canonical
receipts until resource handoff and obtains model recovery schemas from the matching
registered App owner/revision. Existing Runtime schema constraints remain unchanged;
no synthetic fields, error exemption, storage layer or replay was introduced.

The earlier formal case rejected its first step, so it did not exercise a completed
prefix containing internal review fields. The new recorded three-step regression
covers both status-only and selected delivery, exact saved names and unchanged saved
author input. A generic composable owner reproduces the same issue with a differently
named internal statistic; its explicit recovery schema remains required. Both real
cases failed with the original handoff error, and all four cases failed at the public
boundary before the schema correction. The strengthened flow proof applies two
prefixes, rejects the crown, repairs only the crown and verifies exactly three writes.

The model's proposed new operation ledger is not established as necessary. Existing
Runtime recovery and App conversation saves already contained the needed information;
the bad boundary prevented delivery. Its proposed compatibility change is also not
needed: current owner contracts can be aligned directly. External PDF retries,
source estimates, zero Knowledge use and visual acceptance remain separate from
this proven host defect. None justifies changing the fixed drawing prompt.

## Attempt 4 - retained check-scope recovery interrupted

Work stopped at 489371 ms, after 17 App calls; the untimed original-thread report
completed in 293790 ms. Eight discovery calls delivered 110336 bytes; six execution
calls and three reviews brought total public text to 138173 bytes. App call interval
union was 13464 ms; first paint opportunity was 134240 ms. These figures do not
attribute unobserved provider preparation time. The only purpose query, `apply
world material fields existing artifact`, returned prepare_material_revision at
rank one. The AI selected an already acquired mapping tool instead. There were no
missing tool identities or successful-prefix input rejection; those repairs remain
formally verified, not exercised live by this run.

The final seven captures all succeeded. Added detail images changed three existing
check scopes and required explicit supersession reasons. The canonical review owner
returned exact revisions and retained bindChecks arguments, but no typed recovery;
invocation classified the result as generic partial and evaluation interrupted it.
The model did not receive the successful new images or recovery arguments. Its
request for a new preflight is therefore not the first incorrect owner: existing
rebind already avoids capture or write replay. The missing producer/consumer
classification is the bounded correction.

The existing real review integration successfully recovered this case but never
called the evaluation consumer. Adding that assertion reproduced the stop before
implementation. New negatives preserve genuine capture/data/delivery failures.
The original report's proposed role metadata and artifact receipts are not adopted:
existing artifact selection and generated-name rules were available but not used.
Normal glass/material changes and a literal prefix query returning zero are not
blocking App failures. Eight named values were saved, none consumed; three
continuous fits are recorded. All 23 source hashes remained unchanged, durable
sequence 400 and reload matched, report-time document equality passed, no evidence
errors occurred, and owned services exited. Full original report:
`tmp/conversation-improvements/live/taipei-101-fixed-1793989016959/self-report.txt`.

## Attempt 5 - result contract mismatch, not a search miss

Run `taipei-101-fixed-1793990346469` stopped at 407.143 seconds. Its original
thread `01a1b228-7266-74e1-b8dd-5d604dfb5b87` completed an untimed 245.533-second
report. Fifteen App calls returned 116,050 bytes: seven discovery, six execution,
and two review calls. First paint was 106.743 seconds; measured App call union was
12.588 seconds. Five native images were delivered. The document retained 14,977
vectors, 111 ovals and four groups, at durable sequence 478. Eight of ten requested
named values were saved; the final two were rejected before execution. No saved
value was consumed. Source hashes, report-time content, reload and cleanup passed.

The model received `/batchSummary` as a guaranteed portable map_retained_fills
result in provider output 216, then selected it for named step `reflect` in input 290. Host rejected that path before browser dispatch in output 291. The guide
used the outer batch contract; the step uses the canonical action wrapper. The
model followed misleading upstream metadata. A second defect turned pure selector
rejection into a strict evaluation stop rather than allowing corrected input.
The model's own report identified this distinction; source and recorded payloads
independently confirm it. Fixture result-route-stop-20261107 preserves all four.

Slice E separates invocation and step schemas and derives retention from the
latter, including opaque registered leaves behind invoke_tool. It also classifies
only pre-dispatch authored selector rejection as correct_input. Existing tests
checked rejection but not continuation or advertised guarantees against the actual
named-step contract. Four strengthened cases failed before implementation. The
new flow proof checks published fields through execution and storage, rejects
invalid/internal/request-scoped selections with zero dispatch, and preserves
missing dependency/data failures. This is a contract correction, not extra prompt
text, path substitution or a tool-name bypass. Live confirmation remains separate.

Full original report:
`tmp/conversation-improvements/live/taipei-101-fixed-1793990346469/self-report.txt`.

### Slice E review and bounded validation

The expanded owner review initially returned seven failing cases. Two were fixed
within this slice: a discovery fixture used description-only API entries instead
of real registered actions, and duplicated result wording exceeded a fixed
acquisition budget. Canonical action fixtures and shorter nonduplicated result
interpretation now pass all 202 operation-owner tests without raising budgets.
One older stage assertion prohibited all artifact IDs even in successful-prefix
recovery; it now checks no top-level artifact leak, exact preserved recovery and
non-stopping safe correction. No request handle is saved in conversation storage.

The recorded dynamic-dimension selection exposed a real regression from slice C.
Base HEAD passes it, while the current version successfully saved and selected the
value but then applied a failure-specific schema to that successful receipt. The
host now requests that extra recovery projection only for failure receipts; the
existing recorded case and successful-prefix tests pass together. This correction
preserves both dynamic ready-batch selection and strict named-step guarantees.

A project-local baseline server snapshot at HEAD independently reproduces three
other failures: the old expectation of exporting a nonportable retained handle,
target-count prose containing a number, and a generic template-map schema binding.
These are recorded as pre-existing limitations rather than silently relaxed or
counted as a new clean full-suite result. Logs: route-baseline.log and
route-owners.log under tmp/search-acquisition-iteration. The targeted regression
set passes eight cases, host/prefix passes 52, discovery/identity acquisition passes
88 (two existing skips), and the operation owner passes 202. Only focused tests
were run; no full local suite, CI or release gate was launched.

Final slice E acceptance: 91 current-source flow cases passed in candidate
54497bf3-439f-4b82-ba5d-19997b4b0c43 and verified run
277cc77e-0e2f-4648-8328-c82a755fb38d, source
4863bdc0ffca4145a6c50704f0974f39caed68cd46996fc893de7a68fa2fa8d2,
accepted architecture revision 20. Server/proof types passed, naming passed 15,
scoped lint has zero errors and one pre-existing console warning, and diff checks
passed. Two source-proof fixtures were corrected to use canonical actions and the
proof file's existing standalone paging helper; no production fallback was added.
The next live attempt is 6/30; all earlier attempts and limitations remain intact.

## Final attempt 6 - completed execution and separate visual limits

Run `taipei-101-fixed-1793992259989` finished drawing normally in 653.706 seconds
(10m 53.706s), below the fifteen-minute limit. The original native thread
`01a1b245-a770-7cf1-93b2-3a5bc80f08b6` completed its report in 298.265 seconds
(4m 58.265s). Work turn `01a1b245-a7da-7370-b4bd-40be2a7d5dc5` and report turn
`01a1b24f-9af2-7db3-b843-4c7487cc8dc2` are distinct turns in that same thread.
The report has 469 lines and remains unedited in self-report.txt.

No blocking App/tool/data failure occurred. All ten requested names were saved;
`detailsRoot` was consumed as a later ordering anchor. The first paint opportunity
was 219.446 seconds. The final document has 21,878 vectors, 87 ovals and six groups
(excluding the workspace). All 31 frozen hashes matched. Report-time content was
unchanged; persistence and durable sequence both equal 696; reload matched. No
evidence stage errors occurred, all three owned services exited, and the 83,110,333
byte recording is retained. Framing fitted three times while the first large
submission expanded the document. Final and native-detail screenshots were inspected.

The runner/App request's settlement is partial. This is not hidden drawing failure:
local-ai-provider explicitly requires the report-only final action to use
unsupported; conversation outcome combines that with completed work as partial.
Native drawing and report statuses are both completed, and stopReason is null.
Do not change this report contract merely to make a summary status green.

### Measured calls and payloads

| App route            | Outer calls | Returned text bytes | Measured App duration |
| -------------------- | ----------: | ------------------: | --------------------: |
| describe_design_apis |          11 |             139,041 |                0.703s |
| execute_design       |           4 |               8,036 |               18.652s |
| review_drawing       |           9 |              44,260 |                1.013s |
| read_design_checks   |           1 |                 173 |                0.014s |
| Total                |          25 |             191,510 |         20.382s union |

These are App response text bytes, not provider tokens or network transfer. Images
are separate (ten delivered images). Seven native research calls were recorded.
The original AI reports two native callable searches; its total of 34 includes those
and the seven research calls. Native search ranking remains opaque to the App. The
report initially contradicts itself on review counts, then corrects the count to
nine; actual App receipts confirm nine. Use the measured table above.

There were eight exact contract acquisitions, one purpose query and two continuation
reads. The purpose query `group existing elements preserve positions` returned
hierarchy.groupElements in the candidate menu (third API entry), then the AI chose
that exact operation. No missing-name recovery occurred. This validates that real
purpose-to-exact acquisition, not every possible query. Search still ranks lexical
metadata relevance, not semantic entailment or arbitrary language translation.

### What actually ran together

| Submission     | Host operations                                                                                 | Delivery and retained data                              | Why the AI resumed                        |
| -------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| E1 at 218.041s | Criteria, facts, calculation, base, tiers, crown                                                | Six names saved, three composition-ID arrays; 343 bytes | Inspect first rendered result             |
| E2 at 413.183s | Create details, bind new composition ID directly into grouping                                  | Two names saved, group receipt; 874 bytes plus overview | Inspect details and choose local views    |
| E3 at 540.756s | Create continuous reflection layer, bind new ID into ordering and read named detailsRoot anchor | Two names saved; status-only 119 bytes                  | Inspect material change                   |
| E4 at 574.702s | Read a bounded region                                                                           | 21 vector rows and read handles; 6,700 bytes            | Use actual matching count for data review |

E2 and E3 have real output dependencies and avoid extra model dispatches merely to
carry the newly created IDs. E3 also demonstrates named App context consumption.
Five preparation/apply children were executed across E1-E3. No explicit stages,
mechanical iteration, saved tool recipe or Knowledge lookup was used. Their absence
is not failure: visual corrections required fresh human-like visual judgment, and
no deterministic repair loop was specified. Three old root IDs were still returned
and later supplied literally; that was avoidable payload, but not an extra lookup.

### Long intervals - evidence versus interpretation

| Observed interval                            | Duration | Supported interpretation                                                                                                                              |
| -------------------------------------------- | -------: | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Last early research completion to E1         | 124.363s | E1 submitted 16,652 bytes with three drafts and metadata. The AI says it prepared large authored inputs; provider compute/queue split is unavailable. |
| Last pre-detail contract completion to E2    | 127.837s | Detail geometry and grouping were prepared. The AI acknowledges several details were already required and could have been planned earlier.            |
| Local images to next ordering-contract query |  48.371s | AI subsequently states repeated per-window reflections were found; visual decision occurred in this interval, but exact inference time is unknown.    |
| Ordering contract completion to E3           |  36.374s | New reflection geometry and a dependent order operation were authored; host execution itself took 6.484s.                                             |
| Last material images to final check read     |  79.975s | Region reads, data evidence, binding, visual recording and ledger confirmation caused several distinct dispatches.                                    |

The 20.382-second App union is measured, but subtracting it from total time does
not measure model reasoning: native research, generation, scheduling and delivery
also occupy the remainder. The original AI admits it cannot separate these causes.
It reports PDF 403/timeouts and irrelevant pages; App research completion records
do not independently expose every native response, so these remain attributed
self-report rather than verified App-tool defects.

### Assessment of the original AI's recommendations

- Existing methods succeeded: compact pattern/grid/template input, per-reference
  overrides, direct output binding, named retention and one named consumption.
  Generated templates are not persistent SceneTree shared components.
- The reflection correction added a new overlay layer instead of using existing
  retained-fill/material update capabilities. This is a model strategy/adoption
  choice in this run, not evidence that mapping was unavailable. It did not invoke
  map_retained_fills, so slice E's exact old failure has formal replay proof rather
  than a live identical retry in attempt 6.
- The AI proposes a new region-data evidence shortcut. Current dataQueries.query
  already reads bounded canonical values and evidence together; it requires the
  expected count. E4 discovered that count before the later review. Any next change
  must address that actual admission/coverage contract, not add a duplicate tool or
  claim the existing direct-query ability is absent. No such change was made here.
- The AI proposes simpler capture/bind handling. Existing capture accepts selected
  checks and explicit supersession; attempt 6 used supersedes during normal rebinding
  successfully. Its extra bind is not proof that the earlier scope-recovery defect
  remains. Planning mixed overview/detail coverage may reduce calls, but visual
  judgments must still follow delivered images. No automatic approval was added.
- The AI says persistence was unconfirmed in its visible context. The external
  collector later confirms durable sequence 696 and identical reload. This is a
  visibility distinction, not data loss or a reason to redraw.
- The AI's self-acceptance was optimistic. It acknowledges estimated local geometry,
  orthographic projection, insufficient real-image comparison and decorative
  simplification. The screenshots confirm dense editable output, not measured
  fidelity. Do not use successful tools as a quality score or add mandatory research
  to the drawing prompt.
- Knowledge remains optional and was not used. Its possible value for early material
  choice is unmeasured here; no quality mandate or new instruction was introduced.

## All six attempts and actual repair confirmation

The prior twenty-run task is separate. Current allowance is fifteen; six were used.
The limit is a ceiling, not a target. Every attempt retained an unlimited original-
thread report; none borrowed an older artwork, report or edited drawing prompt.

| Attempt | Drawing / report       | Outcome or first incorrect owner                                                                                                     | Correction before next launch                                                                                      | Actual confirmation                                                                                                                                                                                                      |
| ------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1       | 14m59.735s / 7m36.038s | Work deadline, no blocking failure; incomplete drawing. Deeper search audit still found ranking and summary omissions.               | Slice A refined corpus-aware metadata search, meaningful summaries, selected acquisition and work reuse.           | Independent real-catalog regressions; later runs acquired exact contracts. Attempt 6 purpose query selected grouping in one menu + one exact acquisition.                                                                |
| 2       | 8m01.183s / 5m08.652s  | Discovery delivered two valid contracts plus unresolved fill.updateFills as a generic unavailable definition; evaluator interrupted. | Slice B typed unresolved identity selection and preserved partial coverage, paging and refresh.                    | Formal mixed-lookup and same-native-turn provider continuation; attempts 3-6 had no identical missing-name event, so do not call them live reproductions.                                                                |
| 3       | 5m48.178s / 4m04.362s  | Successful base/tiers prefix plus correctable crown failed canonical validation after premature model projection.                    | Slice C preserved canonical recovery until egress, with revision-correct model schema.                             | Real recorded prefix and generic internal-field regressions, exactly-once repair proof; final stage review also caught and fixed C's successful dynamic-selection regression. No identical live prefix rejection in 4-6. |
| 4       | 8m09.371s / 4m53.790s  | Successful captures changed existing check scope; exact recovery existed but lacked typed continuation, causing interruption.        | Slice D canonical REVIEW_SCOPE_CONFLICT/rebind_checks and narrowly gated consumer continuation.                    | Existing real integration failed before fix; producer/negative/provider same-turn proofs passed. Attempt 6 explicitly supplied supersedes and completed binding; it did not reproduce an omitted-reason rejection.       |
| 5       | 6m47.144s / 4m05.533s  | Provider advertised outer batchSummary as a named-step guarantee; host rejected it, evaluator stopped before mutation.               | Slice E route-correct metadata and safe authored-selector recovery; correct successful selected-result projection. | Exact recorded guide/input tests, opaque registered leaf and zero-write corrected execution; attempt 6 used correct step actionResults for grouping/ordering and completed, but did not repeat map_retained_fills.       |
| 6       | 10m53.706s / 4m58.265s | Native drawing and report completed; no blocking App failure. Two ordinary visual corrections.                                       | No post-run implementation change.                                                                                 | Same thread, ten names saved/one consumed, two dependent write sequences, 31 source hashes, persistence/reload and cleanup verified. Visual fidelity remains qualified.                                                  |

## Remaining bounded limitations

Do not advertise a full local pass. Three base-HEAD test discrepancies are retained:
nonportable retention is rejected before writes although an old test expects later
partial recovery; a target-count test expects obsolete prose; and a generic
motif-template-map step binding cannot prove its destination schema. The last is a
potential reusable-input contract limitation, distinct from per-reference overrides
(which worked live). It remains an explicit future candidate, not silently fixed.
The earlier exact setElementLock acquisition audit also had two baseline failures.

No source was changed during attempt 6. No full local suite, release workflow,
dependency install, commit or push was performed by this task. All final detailed
reports and summaries are available in the task-local report bundle. The credit
check at approximately 19:29 UTC returned 20,712.7679735, above the convergence
threshold; checks were spaced at thirty-minute intervals.
