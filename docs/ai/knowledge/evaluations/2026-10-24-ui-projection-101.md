# UI projection and recent handoffs - one bounded 101 observation

Date: 2026-10-24. Source: `ca73c170896faf1be7a39a6b6cd86be965dd9da0`.
The implementation slice was locally verified and pushed before this run.
No product changes, retry, additional model run or CI query followed the observation.

## Scope and evidence

One fresh document and empty isolated tool library; production expanded-artifact
limit 10,000; `gpt-6-astra` with `medium` effort verified in the original provider
record. Work budget 120,000 ms, independent report budget 60,000 ms, no video.
The existing runner was invoked from `apps/asyra-design`:

```sh
node test-data/knowledge-evaluation/run-101.mjs quality-knowledge --deadline-ms=120000
```

App URL: `http://localhost:3307`. Viewport: 1920 by 1080. Formal capture used the
live App and a fresh context for reload. Screenshots include the ordinary App
panels and selection state; first/final/reload screenshots and the exact submitted
inspection image were inspected. This is an overview review, not a detailed
geometry or material-quality acceptance.

Run: `knowledge-quality-knowledge-taipei-101-1792830831162`.
[Original run and capture receipts](../../../../tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792830831162/run.json),
[raw provider record](../../../../tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792830831162/preserved-provider/8f03734c-bbba-40c7-a856-d8311a2792cd.jsonl),
[derived handoff metrics](../../../../tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792830831162/handoff-metrics.json),
[delivery verification](../../../../tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792830831162/delivery-verification.json).

The archive contains 83 original files. All 71 referenced payload/image assets
match their recorded byte lengths and SHA-256 digests. The formal image restoration
helper verified the single submitted inspection PNG, 238,011 bytes. Attachments,
source snapshot, checkpoint, report text and screenshots were retained.

Capture stages completed, including report, final view, persistence, checkpoint,
reload, source verification and browser cleanup. Document sequence and durable
sequence are both 327. The runner reported no page errors. Owned document,
collaboration and Vite services were stopped after capture.

Important distinction: the Runtime parser reports one incomplete provider span,
`item:msg_0dfd0d215a5072a8016adc6def9ba48191b3d92f4afa90b9d1`. Its native kind is
`agentMessage`, starting at Send +118.312 seconds in the work turn. The work turn
was interrupted at the deadline; that item has no completed event. All 12 tool
calls have terminal records and all referenced payloads verify. The subsequent
report turn completed and its report was captured. Do not relabel the overall
provider event stream as complete or infer unavailable text from later reporting.

## Outcome

The App settled as **partial**, not accepted, at 134.522 seconds. First observed
nonempty drawing bounds occurred at **80.545 seconds**; this is not a GPU first-paint
measurement. Two successful applications created 8,253 and 2,121 elements. A prior
10,373-element attempt was rejected before any canvas mutation. Final content has
10,374 elements across two top-level groups, including the second group's new root.

Two visual criteria were explicitly recorded as failed, with `accepted=false`:
the building remains too schematic, and the requested ornament, convincing glass
reflection and shadows remain incomplete. Tool success means those failed checks
were stored successfully; it does not mean the design passed. The captured model
report correctly identifies these limits. Its statement that final persistence
was not yet evidenced is separate from the runner's later successful save/reload.

## Recent changes observed in the actual handoffs

| Change | Observed evidence | Conclusion and limit |
| --- | --- | --- |
| Incremental UI projection | First application: 259 publications, one initialization root scan/tree visit, 8,252 admitted appended entries, 773 terminal-ancestry visits. Second application: 68 publications, no full-tree visits, 2,121 appended entries, 203 ancestry visits. | The new owner path was used. The second application did not traverse the existing 8,253-node subtree. All 327 batch publications remain present; this is not batch enlargement or deferred publication. |
| Preserved complete output | Cumulative flattened output is 1,703,551 IDs; immutable copies account for 1,693,177 prior IDs. UI projection phases total 44.0 ms and 12.8 ms. | Necessary copying remains. Do not describe all document-size work as eliminated. Historical timing is not a controlled benchmark. |
| Compact prepared delivery | Actual browser arguments use version 2 without repeated property-ID maps or keyToId. First: 29,004,768 bytes versus 34,710,757 bytes in the same data's canonical representation. Second: 7,329,911 versus 8,765,635 bytes. | Same-content representation comparison saves 5,705,989 and 1,435,724 bytes, about 16.4% each. Canonical sizes are offline reconstruction under the admission contract, not an additional execution or historical timing measurement. |
| Compact tool receipt with retained diagnostics | The successful main-tool replies are 1,857 and 1,286 bytes. Full browser results retain timing, canonical work counts and action observations in payloads 28 and 48. | AI receives operation results and inspection identities while raw owner diagnostics remain available for analysis. Both owner results and outer receipts say completed with matching element counts. |
| Topic-scoped Knowledge discovery | The request supplies the architectural topic ID and context. It receives 10 entries / 5,752 bytes. The previous saved full-catalog request returned 20 entries / 9,596 bytes. | Scoped discovery is actually adopted; no full tool catalog request occurs. This does not prove Knowledge caused visual improvement. |
| Main-tool image handoff | The first successful application includes immediate inspection and submits one exact retained image. Later bind/record calls reuse that inspection ID without recapture. | Existing-image reuse works. The AI still queries review usage and four schema fields before binding. It does not exercise automatic upfront check binding or multi-scale evidence. |
| Failed review to correction handoff | The final review reply contains both failed criterion records, their evidence, retained inspection identity, `requiresFreshReview`, and capability discovery instructions; no guessed target IDs. | Structured correction context reaches the AI. No subsequent correction application is observed before cutoff, so end-to-end use of that context remains unobserved. |
| Cancellation/partial recovery | Work cutoff interrupts a message after all creation has completed. | This run does not exercise cancellation during a creation batch or retry after partial application. Retain the formal local results; do not count this run as another proof. |

The bytes above come from original payloads. Byte reconstruction restores only the
known property IDs and key map using the current admission contract; it does not
recompile geometry or alter the saved input. The UI counters come from full browser
owner results, not the compact AI-facing summaries.

## AI behavior and remaining handoff issues

| Observation | Supporting evidence | Boundary of the conclusion |
| --- | --- | --- |
| Relevant tool selection | The first main-tool query selects `draft`, projected faces, surface grids, pattern and optional plan. Its two contract pages complete by 17.712 seconds. All four later review field paths resolve. | No invalid operation, mixed-tool field path, full tool catalog or delivery-failure refresh is observed. |
| Pattern and shared motifs used where applicable | One seven-member component repeats eight times with a vertical step of 3,600. The component includes faces and grids. The grids share the `frames` motif; fills use root templates. | This is real source compression and successful execution, not merely selecting pattern in discovery. No additional nested pattern was necessary to express this submitted source. |
| Knowledge selection remains bounded but substantial | Two reads: the architectural entry, then its material-method child. The latter returns six dependency documents, including the already-read parent, totaling 22,742 response bytes. Detailed parameter/review/correction children are not read. | Not all descendants were loaded, and no Knowledge pagination was needed. It is not proven that every returned paragraph was necessary or that the resulting materials satisfy the advice. |
| Expanded output still rejects before drawing | The first attempt has 39 source nodes but 10,373 expanded nodes, exceeding 10,000. Reply: `DESIGN_BUDGET_EXCEEDED`, `not-started`, retained draft ID, no completed steps and no directly executable parts. | No false success or completed-write replay. This is a naturally encountered boundary, not an intentionally lowered-budget retest. Existing automatic source-work partitioning did not handle this expanded-artifact guard. |
| Recovery still requires AI resubmission | After the rejection, AI submits the original first 21 top-level children, then the remaining eight grid children. The child sequences, projection, fill templates and motif templates are exactly preserved. | The original geometry descriptions were not simplified. Successful work is not resent, but AI manually resends source rather than continuing retained parts. The second application adds a separate top-level group, so parent structure is not identical to the original single-root proposal. |
| Review is honest but not complete | Both visual checks fail against the first inspection. The second application defers inspection. | No whole-document image after the second application was submitted to the model. Final/reload runner screenshots are evidence for us, not an image the AI reviewed. |
| Provider accounting gap | An agentMessage begins just before cutoff and has no completed item event; work interruption and a separate successful report are present. | Missing span closure is confirmed. The saved evidence does not establish whether native termination omitted the event or adapter accounting failed to close it. This is not an unfinished App tool call. |

## Timeline from Send

| Time range, seconds | Duration | Observed work |
| --- | ---: | --- |
| 0.000-10.932 | 10.932 | Startup/provider interval before first Knowledge call. |
| 10.932-17.712 | 6.780 | Topic discovery, entry read, two selected-tool contract pages, material-method read. |
| 17.712-71.379 | 53.667 | Contract available until first complete draft submission; no App operation spans this interval. The submitted arguments are 10,610 bytes. Internal generation versus waiting is not separable from available evidence. |
| 71.379-71.397 | 0.018 | Pre-compilation expanded-artifact rejection; no mutation. |
| 71.397-75.491 | 4.094 | Recovery interval before revised source is submitted. |
| 75.491-80.522 | 5.032 | Prepare, apply 8,253 elements, mechanical checks and inspection. Browser apply owner total: 4.166 s. First observed drawing follows at 80.545 s. |
| 80.522-83.374 | 2.852 | Review usage query and four-field schema query. |
| 83.374-102.703 | 19.329 | Interval before the remaining grid source is submitted. |
| 102.703-104.055 | 1.352 | Prepare and apply 2,121 elements. Browser apply owner total: 1.116 s. |
| 104.055-115.643 | 11.588 | Bind the existing image, then submit two failed visual judgments. |
| 115.643-120.002 | 4.359 | Work-turn message output and deadline interruption; no further App tool call. |
| 120.002-133.618 | 13.616 | Work acknowledgement plus report-only turn. |
| 133.618-134.522 | 0.904 | Report delivery/capture and observed UI settlement. |

All 12 outer tools together occupy about 6.483 seconds. These intervals include
nested owner work; do not add nested phases again. The provider's residual interval
includes generation, message streaming, reporting and other wait time, not a
measured pure-reasoning duration. There are no tool/action starts after the work
deadline. Native work settlement is `interrupted` for `work-deadline`; report
completion is a separate event. Last application finishes around 104.022 seconds.

## Historical comparison and interpretation

Reference only: saved run `1792770001609`, source `74e44c1f`, same nominal model,
effort and work/report budgets. It is not a matched control experiment.

| Metric | Previous saved run | Current run |
| --- | ---: | ---: |
| Selected contracts/initial Knowledge complete | 29.371 s | 17.712 s |
| Complete contracts to first submission | 44.072 s | 53.667 s |
| First submission | 73.443 s | 71.379 s |
| First observed content | 76.234 s | 80.545 s |
| Successful created elements | 4,114 | 10,374 in two applications |
| Outer tool calls | 9 | 12 |
| Full/scoped Knowledge catalog reply | 9,596 bytes / 20 entries | 5,752 bytes / 10 entries |

The recent changes have positive, bounded effects: less repeated hierarchy work,
smaller deterministic delivery, scoped discovery and recoverable inspection/result
identities. This run does **not** show earlier first content or fewer total tool
calls. Its naturally encountered rejection and manual partition add exchanges,
and it generates substantially more content. The long pre-submission interval is
still the largest observed wait; assigning it entirely to the App or the model
would exceed the evidence. No implementation changes or rerun were made to force
a favorable result.

## Artifacts

- [First frame](../../../../tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792830831162/first.png)
- [Final view](../../../../tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792830831162/final.png)
- [Fresh-context reload](../../../../tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792830831162/reload.png)
- [Captured model report](../../../../tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792830831162/self-report.txt)
- [Model report screenshot](../../../../tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792830831162/self-report.png)

The report is retained locally after the implementation push. No further model
execution, implementation, push or CI inspection is implied.
