# Retained material recovery - 12-minute 101 observation

Date: 2026-10-28. Task: Composable Domain Knowledge V1, Task 3.

The material recovery handoff is fixed and covered by a permanent saved-input
regression. One authorized live observation completed. The live run exercised
ordinary retained geometry repair and successful material inheritance separately;
it did not exercise their combined historical failure. Do not label that branch
as a live pass or infer that the artwork met every requirement.

## Scope, evidence and confirmed cause

Baseline commit: `367b9f6b53de94f3c9fe83106d0d0e7574f2eda3`.
Baseline run: `1793173740052`; provider
`210fec18-1017-4ef7-9379-bcc1e7bcb356`. Raw payloads 81/82 preserve the
original material source; 174/177, 181/184 and 188/197 preserve the failed draft,
repair conflict and successful subsequent repair. Hashes were checked against
the permanent fixture, rather than inferring the original fields from later drafts.

| Original event | Evidence | Conclusion |
| --- | --- | --- |
| 390.565 s: 6192-byte draft rejected as nonplanar | Material resolution had already embedded the source into retained `linearFields` | Geometry rejection was valid; retained material was already available |
| 399.584 s: 529-byte repair rejected | Returned guide reintroduced `materialSourceId`; owner rejected its conflict with embedded fields | Compose delivered recovery arguments inconsistent with preparation-owned source |
| 404.787-408.494 s: 211-byte repair succeeded | Selector removed; unchanged name replacement used; 5067 elements applied | The second recovery round was avoidable; a cosmetic replacement should not be necessary |

Preparation now returns recovery arguments appropriate to the source it retained.
Raw pre-resolution rejection retains the required selector. Post-resolution
recovery consumes embedded fields. Single composition and ordered parts follow
those arguments without restoring a consumed selector from the original request.
Unstarted sibling parts retain their own selectors; completed parts are excluded.
No new cache, store, state, validator or execution mechanism was introduced.
True inline/source conflicts and nonplanarity remain rejected before writes.

Production behavior changes are confined to `local-design-tools.ts` and
`local-design-workflow.ts`, plus their generated template counterparts. Contracts,
proof mapping, permanent fixture and direct tests were updated. No Knowledge,
model, geometry tolerance, Core mutation, Undo/Redo or persistence owner changed.

## Fixed DoD and local verification

| DoD | Evidence | Result |
| --- | --- | --- |
| D1 - exact saved regression | Original field/input hashes verified; red Inspector candidate failed only the new case, prior 83 passed | Passed |
| D2 - directly executable recovery | Actual returned guide plus explicit vertex correction; complete 5067-element artifact equals direct corrected preparation, including geometry, materials, order and references | Passed |
| D3 - source stage and real conflicts | Raw pre-resolution selectors retained; resolved fields reused even after original source release; genuine inline/source conflicts rejected | Passed |
| D4 - direct, single and parts recovery | Parent relationships, completed-part exclusion, cancellation, foreign handles and actual request disposal covered | Passed |
| D5 - data and execution | 486-byte repair versus original 6192-byte draft (92.15% smaller); no full resend, cosmetic rename, extra discovery call or replay | Passed |
| D6 - integration and self-review | Focused consumers, complete execution gate, types, lint, naming, generated outputs and source-bound Inspector | Passed |

Focused tests: 258 passed. Full execution gate: Runtime 459, Preset 37,
App 2789 passed and two existing opt-in skips, Inspector 84 passed. The skips
are native registration requiring `LOCAL_AI_PROTOCOL_EXECUTABLE` and a large
checkpoint fixture requiring `E2E_LARGE_DOCUMENT=true`; neither covers the changed
recovery handoff. Production/proof types, naming and documentation/update gates
passed. Scoped ESLint has no errors and one unchanged console warning in the proof.
Boundary fixtures intentionally lack browser mechanical review and preserve their
`FOLLOWUP_UNAVAILABLE` partial receipts rather than fabricating full success.

Final Inspector verification: `f02eefc3-2013-4707-87aa-306079c08165`, revision 165,
source `9b568f2683776d41efc2ef57af2bbed143daa8a0fdcdd747180fe9214ee04a4b`.
Bounded review covered the production diff, direct consumers, rejection stages,
ordered parts, disposal, existing accepted inputs and generated counterparts.

## Live configuration and outcome

Run: `1793178457558`. Main provider:
`46a3cb4c-f6e5-4904-87e6-39a9f5b180a3`. Actual model/effort:
`gpt-6-astra` / `medium`. Work cap 720 seconds; independent report cap 60 seconds;
no recording; production object budget 10000. Knowledge remained advisory.

| Measurement | Observed result |
| --- | --- |
| First content | **175.044 s**, first successful creation of **2319 elements**, two adjacent tiers |
| Work end | **715.486 s**, natural native completion before the 720-second cutoff |
| Report | 715.487-735.591 s, **20.104 s**, captured as text and screenshot |
| UI settlement | 735.812 s, `partial` |
| App calls | 29: 28 usable, one genuine geometry rejection followed by successful repair |
| Successful creations | 14668 elements across five successful creation calls |
| Subsequent deletion | 16 protruding crown elements |
| Saved scene | 14653 entries including workspace: 14642 vector, five oval, four group, one frame, one workspace |
| Last drawing mutation | 644.554 s; no drawing mutation after the work cutoff |
| Visual acceptance | Four of seven required visual checks passed; overall and base failed, scale unverified |
| Final store counts | Eight pass, two fail, one unverified, one stale; includes nonvisual results and a later revision |

`partial` means that editable work is preserved but not all requirements passed.
It is not the status of each individual tool call. The provider's `completed`
means its request/report finished; it does not override `accepted=false` or turn
the artwork into an accepted result. Final store counts and visual coverage have
different scopes/revisions and must not be treated as the same denominator.

## Recovery observations

| Branch | Observation | Limit |
| --- | --- | --- |
| Material inheritance | Calls at 256.544 and 329.875 s reused the first artifact material source and created 6955 and 5033 elements | Both were successful preparations; no repair in these calls |
| Genuine geometry rejection | At 452.417 s, `cornerY` at `/children/0/members/2/vertices` was nonplanar; deviation 21.242964433104376 world units versus tolerance 0.0000053301031884945725; no write | This draft had no `materialSourceId` |
| Retained repair | At 464.221 s, AI sent two explicit vertex replacements in 543 bytes; 328 elements applied, no earlier part replay | Preserves ordinary recovery; does not exercise the exact material-source failure |
| Original material conflict | No `materialSourceId conflicts with inline linearFields` response | Absence alone is not a live proof; exact branch is proven by local saved-input regression |
| Recovery size | 543 versus 3335 bytes, 83.72% smaller; no full geometry or material resend | Different input from local 486-byte regression; do not combine measurements |

The AI corrected two vertex arrays and used the returned retained draft handle.
It did not need an unchanged-name replacement. The original valid geometry
protection remained active. Later visual review identified protruding crown
members and AI removed exactly 16 elements; this is separate from preparation
recovery and was not changed by this fix.

## Complete tool timeline

All times are seconds after request submission. Provider timestamps were aligned
once with the measured 344 ms offset. The inter-call column is elapsed time since
the previous App tool ended, not measured model reasoning time. Research and
public activity events may occur within that interval. Zero-based call indices
match the derived analysis and preserved raw input/output.

| Call | Start-end | Tool duration | Since previous App tool | Input/output bytes | Operation |
| --- | --- | --- | --- | --- | --- |
| 0 | 19.316-19.381 | 0.065 | 19.316 | 179/23072 | Drawing usage for selected projected-face, surface-grid, pattern and vector operations |
| 1 | 24.012-24.014 | 0.001 | 4.631 | 288/5842 | Continue the same drawing contract page |
| 2 | 28.706-28.716 | 0.010 | 4.692 | 112/19696 | Knowledge, reference selection, visual review and result-reading usage |
| 3 | 37.978-37.993 | 0.015 | 9.262 | 87/5752 | Discover relevant Knowledge |
| 4 | 41.099-41.104 | 0.005 | 3.107 | 157/23072 | Read selected method and review Knowledge |
| 5 | 45.974-45.975 | 0.001 | 4.870 | 266/11766 | Continue the same Knowledge selection |
| 6 | 70.196-70.211 | 0.015 | 24.221 | 110/17119 | Read pattern-specific drawing usage |
| 7 | 173.571-175.031 | 1.460 | 103.360 | 6100/1432 | Create the first two adjacent tiers: 2319 elements |
| First frame | **175.044** | - | 0.013 after create completed | - | First visible content, 2319 elements |
| 8 | 180.135-180.145 | 0.010 | 5.104 | 80/10013 | Read visual capture usage |
| 9 | 197.789-197.865 | 0.075 | 17.645 | 243/3608 | Capture one material detail image |
| 10 | 213.676-213.692 | 0.015 | 15.812 | 991/4124 | Record material and tier-join passes |
| 11 | 225.823-225.852 | 0.029 | 12.131 | 801/2735 | Record reference purpose and focus |
| 12 | 256.544-261.156 | 4.613 | 30.692 | 2994/819 | Create six further tiers: 6955 elements, reuse material source |
| 13 | 329.875-333.665 | 3.790 | 68.718 | 7519/819 | Create base, podium, crown and spire: 5033 elements, reuse material source |
| 14 | 345.252-345.261 | 0.010 | 11.587 | 119/13939 | Read vector/pattern operation contract |
| 15 | 353.396-353.460 | 0.064 | 8.135 | 382/3712 | Capture overview |
| 16 | 408.240-408.324 | 0.084 | 54.780 | 1154/7678 | Record overall failure and missing details |
| 17 | 452.417-452.437 | 0.020 | 44.092 | 3335/1558 | Reject nonplanar cornerY before writes; retain source and repair guide |
| 18 | 464.221-464.683 | 0.461 | 11.784 | 543/921 | Execute retained repair with two vertex replacements: 328 elements |
| 19 | 534.203-534.403 | 0.201 | 69.520 | 5567/771 | Create metal ornament: 33 elements |
| 20 | 555.584-555.790 | 0.206 | 21.180 | 1425/11547 | Capture five review images |
| 21 | 567.707-567.709 | 0.001 | 11.918 | 48/4414 | Read retained-target usage; no later invocation observed |
| 22 | 616.879-616.891 | 0.012 | 49.170 | 5391/8995 | Record local passes and remaining overall/crown/base issues |
| 23 | 620.185-620.189 | 0.003 | 3.294 | 42/4822 | Search element deletion capability |
| 24 | 623.341-623.345 | 0.004 | 3.152 | 56/16721 | Read exact element.deleteElements usage |
| 25 | 644.247-644.554 | 0.307 | 20.902 | 255/719 | Delete 16 protruding crown elements |
| 26 | 658.650-658.799 | 0.149 | 14.096 | 681/7095 | Capture overview, crown and base images |
| 27 | 696.265-696.280 | 0.015 | 37.466 | 3585/8224 | Record final visual assessment: 4/7 passed, accepted=false |
| 28 | 703.632-703.719 | 0.088 | 7.352 | 2/225 | Read final check counts: 8 pass, 2 fail, 1 unverified, 1 stale |
| Work end | 715.486 | - | - | - | Natural completion, not forced cancellation |
| Report | 715.487-735.591 | 20.104 | - | - | Captured AI self-report |
| UI end | 735.812 | - | - | - | Partial artwork retained |

A public research activity occurred approximately 51.525-60.594 s. The first
submission followed the last pre-drawing App call by 103.360 s. It contained
6100 bytes and created 2319 elements; the observed output is not a timing cause.

### Intervals without recorded events

These are all recorded gaps of at least ten seconds in the main stream. For each,
no event was recorded during the interval and the cause was not recorded. They
must not be labeled thinking, network delay or tool execution without evidence.

| Start-end | Duration | Recorded cause |
| --- | --- | --- |
| 81.407-100.825 | 19.418 s | None recorded |
| 110.761-173.569 | 62.808 s | None recorded |
| 213.862-225.822 | 11.960 s | None recorded |
| 235.173-256.543 | 21.370 s | None recorded |
| 261.158-329.874 | 68.716 s | None recorded |
| 358.050-373.263 | 15.213 s | None recorded |
| 373.300-398.587 | 25.287 s | None recorded |
| 420.183-452.412 | 32.230 s | None recorded |
| 452.627-464.218 | 11.591 s | None recorded |
| 477.865-534.201 | 56.336 s | None recorded |
| 573.491-616.879 | 43.388 s | None recorded |
| 669.162-696.264 | 27.103 s | None recorded |

## Information volume and cost evidence

| Category | Calls | Input bytes | Text output bytes |
| --- | --- | --- | --- |
| describe_design_apis | 9 | 1034 | 115638 |
| discover_knowledge | 1 | 87 | 5752 |
| read_knowledge | 2 | 423 | 34838 |
| prepare_and_apply_design | 6 | 26058 | 6320 |
| review_drawing | 8 | 13852 | 54983 |
| select_design_references | 1 | 801 | 2735 |
| execute_design_batch | 1 | 255 | 719 |
| read_design_checks | 1 | 2 | 225 |

Total App input: **42512 bytes**; text output: **221210 bytes**. Ten model-delivered
images add **1639179 bytes**. Before first creation there were seven App calls
returning **106319 text bytes**: 65729 contract bytes and 40590 Knowledge bytes.
One contract continuation and one Knowledge continuation read successive pages,
not the same page again. Pattern-only usage at 70.196 s overlaps operations in
the first selection; this observation alone does not establish an unnecessary call.
The retained-target usage query at 567.707 s had no subsequent matching invocation;
its decision value is not recorded. Neither is attributed to the material fix.

Measured App tool execution totals **11.728 s**; tool plus public research totals
**20.799 s**. These totals do not explain all remaining elapsed time. Missing
events are listed explicitly above.

Provider usage reports **2996528 cumulative input tokens**, including
**2878464 cached input tokens** (118064 uncached), **18845 output tokens**, and
1517 reasoning output tokens already included in output. Total reported tokens:
3015373. This is a cumulative multi-request measure, not a single 3M-token prompt.
Transport reports 3713558 sent bytes and 4214312 received bytes, a different
boundary from App payloads and preserved file sizes. No dollar cost is inferred
without a verified applicable price and billing basis.

## Artwork and quality evidence

First, final and reload screenshots were inspected along with the exact preserved
crown, base and ornament crops delivered to the model. The full tower is editable
and recognizable, with eight tiers, glazing/window grids, crown/spire and a front
metal ornament. The base remains schematic with large flat panels; the final
report acknowledges missing side ornaments and insufficient realism. The final
crown crop no longer shows the previously protruding grille pieces in that view.
The ornament crop shows a double curl and pendant but does not prove full reference
fidelity. A visible tower or many scene elements is not proof of complete quality.

This run does not isolate visual quality, Knowledge benefit or wall-time change
caused by the fix. Knowledge was read and material/review decisions followed, but
that sequence alone does not establish causal benefit. The demonstrated correction
is the preparation-to-recovery argument handoff; the live quality limits remain.

## Preservation and reproducibility

Evidence root:
`tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1793178457558/`.

- `run.json`, `native-boundaries.json`: configuration, work/report boundaries,
  durable receipts, capture lifecycle and source freeze.
- `preserved-provider/`: original streams, inputs, outputs and image bytes.
  `provider-preservation.json`: 495 preserved files, 50706605 bytes, hashes verified;
  ten streams complete, no issues or incomplete calls; ten images verified.
- `generation-analysis.json`: derived call/activity/gap reconstruction;
  `diagnostic-metrics.json`: derived tables. Raw provider records remain authority.
- `self-report.txt`, `self-report.png`: captured AI account, not acceptance authority.
- `first.png`, `final.png`, `reload.png`: first content, endpoint and new-context reload.
- `checkpoint.json`: 95924258 bytes, durable sequence 467/467, document generation 0.
  Reload root/order/generation/receipt checks passed. This does not claim an
  exhaustive comparison of every property from the reload screenshots.
- `source-snapshot.json.gz`: exact run sources. All 2887 source-manifest files
  matched disk before closeout documentation. Digest:
  `faa6a41ada87baa624ea244159d07e6815e535ce9b1086aed91132d03e860deb`.
- `service-cleanup.json`: agent-started services exited; browser cleanup completed.

The local permanent regression runs without ignored evidence directories.
The source manifest above describes the tested implementation, before this report
and the plan's observation note were written. No additional model run, CI query,
commit or push was performed during closeout.

## Conclusion

Close the fixed D1-D6 recovery slice on deterministic evidence. Live observation
confirms preserved ordinary repair, material reuse and honest partial acceptance;
the exact combined historical failure remains unobserved live. No further model
run is necessary to manufacture that scenario. Remaining quality and read-volume
observations are evidence for a separately bounded decision, not new implementation
scope within this fix.
