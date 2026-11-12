# Taipei 101 - contract delivery verification - 2026-11-04

## Outcome and scope

The authorized implementation and focused validation are complete. One unchanged-prompt
fifteen-minute drawing run reached its deadline; the original native AI then completed
an untimed report in the same thread. This is a completed test and report collection,
not a fully accepted drawing. It is not compared as a completed drawing against a
previous completed benchmark.

Base: `736bd14316756765abc8aa189feb6bf38fb3db4f` on
`codex/ai-conversation-improvements`, with the task's uncommitted implementation.
The pre-run `tmp/conversation-improvements/contract-source.json` records source hashes;
all recorded App and Inspector files were verified unchanged after the run. No commit,
push, release, full local suite or additional live drawing was performed.
The unrelated prior framing-recovery report remains untouched.

Parent: [bounded task and per-owner reviews](../plans/ai-design-agent-plan.md#contract-delivery-and-evidence-closure---2026-11-04).
Baseline: [contract trace](ai-contract-delivery-trace-2026-11-04.md).

## Changes actually delivered

| Owner                | Change                                                                                                                                                                                     | Proof and retained boundary                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compose/prepare      | Native and scoped instructions consume the same owner-defined criteria timing and supplied-geometry conditions                                                                             | Baseline regression failed; initial criteria after first drawing remains legal, established criteria remain protected; no mandatory drawing sequence           |
| Acquisition          | Usage returns complete input constraints/examples with compact result fields and settlement/recovery meaning; explicit `includeResultSchema: true` supplies full result validation schemas | Runtime validation remains complete; direct machine consumers, pagination and correction modes updated together; no compatibility alias                        |
| Data review          | `review_drawing` acquires canonical selected document values, owns immutable evidence IDs, releases read leases and validates selected values before acceptance                            | Data checks use `dataEvidenceIds` and empty image IDs; forged, missing, truncated and stale evidence fails; unrelated unselected changes do not invalidate     |
| Evidence consumers   | Binding, check recording, coverage, correction context and final acceptance distinguish data from images                                                                                   | Negative and integrated tests exercise real upstream reads, not manually fabricated downstream receipts; visual obligations remain intact                      |
| Provider observation | Actual App-owned base/developer blocks are assembled once for transport and recorded with role/source/digest                                                                               | Transport tests compare exact packets; live record contains four verified blocks; user/history content and private reasoning are not copied into this evidence |

Self-review also caught a correction-context producer that still labeled numeric
evidence IDs as inspection IDs. A failing regression preceded the producer/schema
fix. This was corrected before final validation and before the live run.

### Deterministic acquisition costs

These are reply body bytes for identical selected inputs/examples, not tokens or
model latency. Full schemas remain available to explicit machine consumers.

| Fixed case   | Default usage bytes | Full result-schema bytes | Default acquisition      |
| ------------ | ------------------: | -----------------------: | ------------------------ |
| Vector draft |              15,900 |                   23,289 | One reply instead of two |
| Mixed draft  |              20,879 |                   28,268 | One reply instead of two |
| Capture      |               8,697 |                   18,172 | One reply                |
| Record       |               9,185 |                   18,115 | One reply                |
| Delete       |               9,737 |                   20,918 | One reply                |

These cases do not imply every live query fits one reply. The live draft also
requested optional plan inputs and totaled 24,879 body bytes across two replies.

## Run identity and settlement

| Item                           | Evidence                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| Run                            | `taipei-101-fixed-1793731065236`                                                       |
| Started                        | 2026-11-04 02:37:45 Taiwan time                                                        |
| Command                        | `yarn workspace @asyra/asyra-design test:live:taipei-101 --minutes=15`                 |
| Prompt SHA-256                 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`                     |
| Input                          | Fixed approved full-building prompt; one fresh conversation submission; no attachments |
| Drawing limit                  | 900,000 ms; work elapsed 899,695.83 ms                                                 |
| Drawing result                 | Native work turn interrupted at runner deadline; `stoppedAtDeadline: true`             |
| Native thread for both turns   | `01a1a2b4-139e-72f0-975c-483690242852`                                                 |
| Drawing turn                   | `01a1a2b4-140a-7580-bd90-3ab4df138bc6`                                                 |
| Report turn                    | `01a1a2c1-c954-7502-b35e-40b8596733ba`                                                 |
| Report                         | Completed in 200,507.72 ms, with no report deadline                                    |
| Report-only document integrity | Unchanged                                                                              |
| First paint opportunity        | 88,054.10 ms after submission; not a provider reasoning metric                         |
| Final element census           | 14,334 vectors, 16 ovals, 11 groups = 14,361 elements; one workspace                   |
| Retained checks                | Six required; three retained passes, three unresolved                                  |
| Durable document               | Sequence 476, durable sequence 476, generation 0                                       |
| Reload                         | Document unchanged                                                                     |
| Recorder                       | Exit 0; errors and evidenceErrors empty                                                |
| Final App settlement           | Executed / partial; not whole-drawing acceptance                                       |

The AI's phrase "user interruption" describes the report request following
interruption. The recorded cause is the test runner's drawing deadline, not an
independent user click, an App crash or the AI declaring the drawing finished.
Its report correctly says it lacked a final persistence confirmation in its own
context. The host subsequently verified durability and reload; this is not evidence
of failed saving. Document persistence is unrelated to package release work.

## Native actions and recoveries

| Native App tool            | Calls |
| -------------------------- | ----: |
| describe_design_apis       |    14 |
| prepare_and_apply_design   |     8 |
| execute_design_batch       |     7 |
| review_drawing             |     6 |
| import_reference_image     |     1 |
| record_design_facts        |     1 |
| select_design_references   |     1 |
| record_design_calculations |     1 |
| Total                      |    39 |

The canonical provider record is `4772d3af-6282-423a-b3f7-e2143ee69116.jsonl`.
Browser/host action expansion records are not counted as native model calls.
Seven construction submissions succeeded. One was rejected before writes:
`NONPLANAR_FACE` on `leftfin.vertices`, deviation 0.316227766 world units against
an 8.788629e-8 tolerance. The AI used the retained draft and replaced left/right
fin fields, then continued successfully. Settlement was `not-started`; existing
base geometry was not replayed. A structured tool failure can occur inside a
completed provider tool event, so event completion alone is not success evidence.

The seven construction receipts report 3,238 / 7,769 / 823 / 986 / 241 / 444 /
1,242 elements. Other receipts include 3,712 fill changes, 386 deleted old roof
elements and four added groups. Receipt arithmetic matches the final host census.
This does not establish final architectural accuracy.

The final visual changes replaced the initial podium roof and added ornament
bevels. They were applied but not re-reviewed by the drawing AI before the
limit. Tier and crown checks remained valid. Overall silhouette/view checks
became stale; the base retained its pre-correction failed check. The host's later
screenshots do not retroactively complete the AI's acceptance workflow.

## Evidence that the new paths were used

At provider sequence 10465 (869.739 seconds), `review_drawing` acquired data for
five exact IDs and fields x/y/width/height. It returned canonical evidence in
33.86 ms. At sequence 10504 (880.662 seconds), the AI submitted a scale judgment
with `inspectionIds: []` and the owner-issued `dataEvidenceIds`; recording took
38.85 ms. Numeric acceptance therefore exercised the new path without image
substitution. Those values prove document dimensions, not precise real-world
measurements of every architectural component.

The advertisement retained four App-owned instruction blocks, all with valid
SHA-256 values: app-contract 9,091 bytes, operation-contract 5,889 bytes,
main-tool-scope 3,199 bytes and provider-response-contract 3,238 bytes. The first
three have the base role; the last has the developer role. Total: 21,417 bytes.
This is actual App delivery evidence, not a reconstruction from current source.
It does not reveal hidden provider instructions, private reasoning or all native
search internals. Deferred tool inventory bytes are not equivalent to text the
model actually read.

## Long intervals and remaining uncertainty

The 39 App tool durations sum to 17,683.57 ms; their interval union is 17,682.70 ms.
Most of the fifteen-minute wall time is outside these measured App executions.
It must not all be labeled model thinking, network delay or idle time.
The following are gaps between measured App calls, not provider inactivity.

| From elapsed s | To elapsed s |  Gap s | Next App action          |
| -------------: | -----------: | -----: | ------------------------ |
|         30.816 |       87.097 | 56.281 | prepare_and_apply_design |
|         89.241 |      167.187 | 77.946 | prepare_and_apply_design |
|        180.031 |      245.968 | 65.937 | prepare_and_apply_design |
|        266.881 |      333.587 | 66.706 | prepare_and_apply_design |
|        460.268 |      501.050 | 40.782 | select_design_references |
|        541.666 |      609.994 | 68.327 | prepare_and_apply_design |
|        660.368 |      695.580 | 35.211 | review_drawing           |
|        695.920 |      754.411 | 58.490 | review_drawing           |
|        775.702 |      834.797 | 59.095 | prepare_and_apply_design |

The AI attributes work in these intervals to constructing large inputs, locating
contracts, reviewing eleven images, preparing targeted changes, handling geometry
and unsuccessful searches. That account helps identify work, but cannot quantify
provider generation, queueing, network or image reasoning time.

| Observation                                                 | Classification                                                                                                                                                                                | Consequence                                                                                                                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Usage queries still advertise 86,909 and 56,463 bytes       | Confirmed remaining acquisition cost: seq 987 requests three named tools; seq 1016 requests read_design_context. Both explicitly use `view: usage`; only their first fragments were delivered | Result-schema reduction does not remove wide input/route representations. Do not misreport this as using full mode or reading all advertised bytes |
| Full visible photo imported after four construction batches | Confirmed sequence; later roof replacement is visible in receipts                                                                                                                             | Earlier reference use is a plausible way to reduce this rework, not proof of a mandatory global drawing order                                      |
| Named native searches did not return expected declarations  | AI self-report; exact search-ranking cause not established by this App trace                                                                                                                  | Inspect native request/result routing before proposing App search changes                                                                          |
| Initial base review omitted later overlays                  | AI target selection/coverage issue; corrected through existing grouping and review scope                                                                                                      | Existing multi-target/region capability must be assessed before adding a new tool                                                                  |
| Nonplanar rejection                                         | Correct validation with successful local recovery                                                                                                                                             | A multi-finding validator could reduce some retries, but this run needed only one failed submission; no evidence that validation should be relaxed |
| Knowledge and saved recipes unused                          | Confirmed absence of these calls; projection/grid/pattern and batch fill tools were used                                                                                                      | Do not force Knowledge reads or recipe creation merely to increase use                                                                             |
| Three unresolved final checks                               | Deadline plus late correction, not loss of all local passes                                                                                                                                   | Preserve selective invalidation and report partial acceptance honestly                                                                             |

No additional implementation or prompt rule was added from this run's hypotheses.
The bounded task fixes its demonstrated contract gaps; it does not claim every
remaining acquisition cost or long interval is solved.

## Visual and recording evidence

The 101,638,448-byte WebM decodes as 1920 x 1080 and lasts 1,153.44 seconds,
including reporting/evidence time beyond the drawing limit. The runner fit the
canvas at 89.562, 180.393 and 247.054 seconds. Offline frames at 210, 330 and
850 seconds were inspected: they show the full current tier structure, then the
spire-to-base building, then the revised podium. The recording is not confined
to the first base view until the ending. A 120-second frame is also retained.
The final overview and base detail were inspected; the base shows folded roof
strips, window frames and beveled round ornaments. These observations establish
visibility and editable output, not final realism or precise architectural fidelity.

Temporary live services on 3045/4245/4145 were cleaned up and their listeners
checked. The offline video decoder used installed Chrome through Playwright and
was closed; no browser or binary was installed.

## Focused verification

Permanent regressions were proved failing before each owner fix. Final results
include the following scoped gates; overlapping runs are not summed into a unique
test total.

| Gate                                         | Result                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Workflow/review condition slice              | 235 passed                                                                                                   |
| Canonical context upstream slice             | 77 passed                                                                                                    |
| Provider suite                               | 232 passed, one pre-existing skipped                                                                         |
| Final eight-file focused pass                | 649 passed, two stale consumer assertions failed, three skipped; both failures corrected and rechecked below |
| Corrected review/data/execution proof/stages | 209 passed                                                                                                   |
| Selected schema and delivery-cost cases      | Nine passed                                                                                                  |
| Final batch/data cases                       | 24 passed                                                                                                    |
| App server/browser/proof type checks         | Passed                                                                                                       |
| Scoped ESLint                                | Zero errors; five existing console warnings                                                                  |
| Naming gate                                  | 15 passed                                                                                                    |
| Inspector contract gate                      | Two passed                                                                                                   |
| Final source/diff check                      | Recorded App/Inspector source hashes unchanged through live run; whitespace check passed                     |

Logs remain under `tmp/conversation-improvements/contract-*`, `data-*`,
`usage-*` and `instruction-delivery-*`. No full local suite was run.

## Original report and artifacts

The original AI report is preserved without editing; `self-report.md` is byte-identical
to `self-report.txt`. It contains nine sections, detailed action/failure tables,
its explanation of long waits, improvement proposals, unused capabilities and
remaining work. Host corrections above supplement it rather than rewriting it.

- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793731065236/self-report.md" target="_blank" rel="noopener noreferrer">Complete original AI report</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793731065236/self-report-evidence.json" target="_blank" rel="noopener noreferrer">Same-session report evidence</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793731065236/run.json" target="_blank" rel="noopener noreferrer">Run metadata</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793731065236/run-analysis.json" target="_blank" rel="noopener noreferrer">Selected provider analysis</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793731065236/recording.webm" target="_blank" rel="noopener noreferrer">Process recording</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793731065236/final.png" target="_blank" rel="noopener noreferrer">Final overview</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793731065236/base.png" target="_blank" rel="noopener noreferrer">Base detail</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793731065236/process-210.png" target="_blank" rel="noopener noreferrer">Video at 210 seconds</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793731065236/process-330.png" target="_blank" rel="noopener noreferrer">Video at 330 seconds</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793731065236/process-850.png" target="_blank" rel="noopener noreferrer">Video at 850 seconds</a>
