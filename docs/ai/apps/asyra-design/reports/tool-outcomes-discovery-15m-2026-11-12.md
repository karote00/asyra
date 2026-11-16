# Tool outcomes and discovery - implementation and live verification

## Outcome

The bounded four-step task in the [active plan](../plans/completed/agent-context-and-report-continuity-record-2026-11-16.md#tool-outcomes-evaluation-stopping-and-composable-discovery)
is implemented and verified. Input rejection now returns its actual reason and
settlement to the same AI without an extra correction-permission flag. Evaluation
consumes the validated native result after Host settlement. Purpose search and
exact contract reads are separate, request-composable owners. Superseded public
selectors and the old lookup entry are removed, not aliased.

Two live observations ran during the resumed task. The first proved real input
correction but failed persistence/reload evidence because the launcher selected
the wrong browser collaboration endpoint. The second passed complete evidence
closure after an endpoint preflight was added. Neither drawing reached its
15-minute deadline. Each original AI finished an unlimited report in its own
drawing thread, and both sessions remain available. No files were edited while
either AI was reporting. No full local test, commit or push ran.

This establishes the implemented handoffs, not universal artistic correctness or
every possible tool failure. Formal registry/provider cases cover routes the
drawings did not exercise. The final AI itself identifies unfinished fidelity
verification; its natural completion is not independent visual acceptance.

## Implementation and validation

| Owner slice                     | Current behavior                                                                                                                                                                                | Important preserved boundaries                                                                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Failure producers and adapters  | Common input rejection survives schema/semantic admission, App context HTTP, Host, saved tools and provider delivery. Authored missing names/paths are distinguishable from lost promised data. | No general exception is automatically called input error. Prefix results, IDs, actual settlement and separate storage/cleanup failures remain intact.                                                               |
| Evaluation stopping             | Decide from the final validated native reply rather than prematurely stopping on a child observation. Invalid authored input and valid empty searches can continue.                             | Unknown writes, genuine execution/contract failures, missing required resources, broken delivery and deadlines retain their stop semantics. No automatic mutation replay.                                           |
| Discovery                       | `search_design_tools` returns candidate metadata; `read_design_contracts` accepts exact names and per-name scopes. Both and read-only Knowledge can run in the existing request Host.           | Search never executes a candidate or silently returns a full contract. Qualified identity, revision, paging, missing/ambiguous matches and schema validation remain authoritative. No `describe_design_apis` alias. |
| Consumers and current contracts | Provider declarations, App instructions, execution examples, activity labels, docs and tests use the current route. Saved reads use a distinct closed branch.                                   | Primary actions do not acquire unrelated same-name native dependencies. Request composition does not make request handles valid durable recipe inputs.                                                              |

Final document review also removed two older discovery descriptions from the
current specification: category `includeSchemas` acquisition and combined
action/wrapper full lookup. Inspector wording now names candidate search and
validated native-result evaluation consistently. Historical reports and saved
inputs remain immutable evidence rather than compatibility contracts.

Focused validation logs are under `tmp/conversation-improvements/`:

| Gate                                                               | Result                                                    | Log                                                                                                         |
| ------------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Native provider, execution proof, identity recovery and evaluation | 434 passed; one opt-in case skipped                       | `selection-continuation-final.log`                                                                          |
| Failure delivery, Host composition, report sessions and App HTTP   | 190 passed                                                | `failure-handoff-final.log`                                                                                 |
| Current registered owner admission                                 | 210 passed; unrelated cases excluded by focused selection | `registry-admission-final.log`                                                                              |
| Browser action-batch transport                                     | 42 passed in jsdom                                        | `browser-provider-final.log`                                                                                |
| Knowledge, activity and result-context consumers                   | 94 passed in the three applicable files                   | `browser-handoff-final.log`; the separate browser-provider file was rerun in its required environment above |
| Runner, deadline and recording after endpoint correction           | 21 passed                                                 | `live-endpoint-green.log`                                                                                   |
| Server types                                                       | Passed                                                    | `types-close.log`                                                                                           |
| Naming                                                             | 15 passed                                                 | `live-endpoint-naming.log`                                                                                  |
| Scoped source lint                                                 | No errors; eight existing console warnings                | `scoped-lint-close.log`; endpoint helper/tests also passed scoped lint                                      |

Counts above overlap in some owner coverage and must not be added into a unique
test total. Earlier migration failures were corrected and rerun; failed historical
logs are not presented as passing whole runs. No validation was weakened to accept
malformed results or make the live drawing pass.

## Live observations

Both used the immutable fixture SHA-256
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
The only time limit was the 900,000 ms drawing window. The recorded source was
the task worktree based on `bd5fcee28cdb9ad58659071b3899016d85505796`, with the
reviewed implementation changes uncommitted.

| Measurement                      | First observation                       | Final observation                                                     |
| -------------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Run                              | `taipei-101-fixed-1794481039670`        | `taipei-101-fixed-1794482034291`                                      |
| Drawing duration                 | 451.748 s - 7m32s                       | 732.406 s - 12m12s                                                    |
| End of drawing                   | Native completion                       | Native completion                                                     |
| Report duration                  | 312.543 s - 5m13s                       | 397.620 s - 6m38s                                                     |
| Drawing/report native thread     | `01a1cf67-e3fe-73e0-b630-c4e686b417dc`  | `01a1cf76-f721-7dd1-b0c8-5d61021cce9d`                                |
| Correctable rejected input       | One; corrected in the same drawing turn | None                                                                  |
| App tool interruption            | None                                    | None                                                                  |
| Report leaves document unchanged | Yes                                     | Yes                                                                   |
| Persistence/reload               | Failed evidence closure                 | Durable sequence 538; exact document equality after reload            |
| Final document                   | 16,489 nodes including workspace        | 16,644 nodes including workspace: 8 groups, 16,372 vectors, 263 ovals |
| Recorded evidence errors         | Persistence and reload                  | None                                                                  |
| Original provider session        | Retained, waiting                       | Retained, waiting                                                     |

These times are run records, not a quality-normalized performance comparison.
The final drawing performed more diagnosis and different design work.

### First observation - actual input recovery and evidence failure

At 119.205 seconds the AI submitted a second construction step whose projection
bound `base` output path `/invalid`; that step also had an unfinished empty child
list. Admission returned `TOOL_INPUT_INVALID`, the precise destination/path and
`settlement:not-started`. No canvas operation had run. The AI replaced the invalid
binding with named authored-input paths and submitted complete geometry in the
same native drawing turn. The corrected two-step sequence completed by 234.851
seconds. Resending the unstarted base was not replay of an acknowledged write.

The AI's report identifies this as its unfinished input, not a proven tool defect.
The case directly demonstrates the repaired stop behavior. Formal tests separately
prove successful-prefix recovery, unrelated sibling failures and malformed output.

After reporting, evidence collection discovered that the command set owned
collaboration port 4158 but inherited browser endpoint 4145 from local `.env`.
The intended document backend had an empty checkpoint. Therefore this observation
cannot certify durable saving/reload, despite its successful canvas operations.
This was the coding agent's launch configuration error, not the drawing AI's fault.

The existing runner now rejects that mismatch before starting services or a model
request. A permanent regression uses the actual ports and proves correct matching
configuration is accepted without mutating `.env`. The final observation explicitly
used App 3059, browser/server collaboration 4159 and document backend 4259.
No old service was used as a fallback and no failed evidence was overwritten.

## Final provider-visible work

The retained provider declaration packet is
`06d19b52-cc54-4e1e-98e3-b0da7fbefbc0.payloads/3-input.json` inside the final
run's `provider-records`. It contains the separate search/read declarations and
no retired lookup tool. The actually returned initial construction contract says
that `parentId` coordinates are parent-local; that information was not absent
from the provider delivery.

Measured `responseTextBytes` from native tool completion events:

| Native owner            | Calls | Text bytes returned |
| ----------------------- | ----: | ------------------: |
| `read_design_contracts` |     8 |              87,024 |
| `search_design_tools`   |     3 |              43,970 |
| `discover_knowledge`    |     1 |               9,939 |
| `read_knowledge`        |     1 |              12,604 |
| `execute_design`        |    12 |              20,914 |

These are summed text responses, including their delivery envelopes, not one
87 KB contract, image bytes, model tokens or provider inference counts. The AI
did not receive these telemetry totals and correctly refrained from inventing
them in its report. Two native deferred-tool searches acquired Knowledge callable
declarations; they are distinct from the three App purpose searches above.

The 12 Host submissions contain 27 authored operations. Representative actual
sequences, verified against input payloads:

| Sequence | Work delegated together                                                             | Why control returned                                                            |
| -------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| E1       | Base, then tower using the new base root ID                                         | AI prepared the next large geometry separately                                  |
| E2/E3    | Crown and podium; overview in a later call                                          | The overview target was already known; this was a mergeable split               |
| E4-E6    | Canonical child/parent reads, zero-result type filter, then exact-name reads        | Diagnosing displacement; not a failed mutation or pure saved-value forwarding   |
| E7       | Set three group positions, then inspect                                             | New visual judgment found roof overlap                                          |
| E8       | Resolve/move two roof targets, then create ornaments                                | Later reference and design decisions                                            |
| E9       | Create metalwork, order it using its new ID, create base detail, map fills, inspect | Visual judgment after material/detail changes                                   |
| E10      | Create finishing, move four roots into the main group, read bounds                  | AI chose the final crop using returned bounds                                   |
| E11/E12  | Overview plus detail; later redisplay the saved overview                            | Both images were delivered; AI chose to reread the overview without recapturing |

Thirteen names were retained; seven were referenced later through named bindings.
The other six are valid possible-future context, not waste or a failure. Saved
projection, fill and motif definitions were used directly; no full saved draft
was read back merely to forward it. New IDs also used direct step bindings.
This live run does not independently prove cross-user-turn consumption because
the reporting turn was read-only; formal context tests cover that boundary.

## AI report and interpretation

The original AI reports that it prepared substantial geometric inputs between
calls, diagnosed parent-coordinate mistakes, read movement/hierarchy contracts,
obtained closer ornament references and made visual corrections. Those are
high-level explanations tied to visible actions. Neither the AI nor this report
can attribute each quiet interval to private inference, provider scheduling or
network time. Tool timings alone do not establish the missing attribution.

| Observation                                                                                             | Supported conclusion                                                                            | What is not established                                                                                                                             |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial child geometry was displaced; the delivered contract stated parent-local coordinates            | The AI did not correctly apply an available coordinate rule and later corrected existing groups | A missing provider field or broken conversion owner is not proven; a new geometry API is not justified by the self-report alone                     |
| `filter.type:"Group"` returned zero, then exact names found the groups                                  | The empty read remained usable and did not falsely terminate work                               | Whether type discoverability needs improvement requires separate contract review; zero matches are not an execution failure                         |
| Knowledge was read after displacement                                                                   | Spatial advice helped the AI interpret parent coordinates and subtree scope                     | More Knowledge calls are not themselves a goal or proof of quality                                                                                  |
| E2 overview was separate; computed coordinates were manually transferred; final bounds preceded capture | Some decisions already made could be composed more tightly                                      | These are not proof that the current Host lacks the ability; do not add mandatory planning/approval stages                                          |
| Final overview was displayed again                                                                      | Existing saved-image recovery was used without recapturing or writing                           | No missing-image delivery is demonstrated; E11 delivered both selected images                                                                       |
| AI did not see a final persistence receipt                                                              | Its report appropriately did not certify durable saving                                         | The recorder subsequently did verify durable sequence 538 and reload equality; its evidence supplements rather than rewrites the original AI report |
| AI cautioned about estimated dimensions, regularized materials and simplified ornaments                 | Successful tool execution is distinct from full architectural fidelity                          | This task does not establish independent artistic acceptance                                                                                        |

The report's suggestions for coordinate conversion, earlier checks, richer empty
filters and image presentation are proposals, not implemented changes. No new
forced visual review, Knowledge requirement or compatibility route was added.

## Complete original reports and evidence

- [Final AI complete report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794482034291/self-report.txt)
- [Final run metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794482034291/run.json)
- [Final image](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794482034291/final.png)
- [Native-scale detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794482034291/native-detail.png)
- [Recording with drawing-time fit updates](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794482034291/recording.webm)
- [First AI complete report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794481039670/self-report.txt)
- [First run metadata including failed evidence closure](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794481039670/run.json)

The final session status was checked after recorder exit: `waiting`, original
native thread unchanged. Use the maintained `taipei-101-report-session.mjs` with
the final run directory for later questions. Services remain PID-tracked in
`run.json`; do not close the session until the user finishes follow-up.
