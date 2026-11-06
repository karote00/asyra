# AI contract delivery trace - 2026-11-04

Baseline: `736bd14316756765abc8aa189feb6bf38fb3db4f`, worktree
`.worktrees/ai-conversation-improvements`. Evidence: fixed run
`taipei-101-fixed-1793725505653`, provider request
`49334d7a-41f1-4cc1-8791-e0fabd9e1961`. Original artifacts remain immutable under
`tmp/conversation-improvements/live/`. This trace does not establish the cause of
every historical model delay or compare unlike completed/interrupted drawings.

## Delivered changes versus remaining work

| Earlier change                                             | Observed consumer behavior                                                                                                            | Conclusion                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Optional methods/Knowledge; no compulsory drawing sequence | Current prompt source preserves optionality; no Knowledge call in this run                                                            | Do not add another invitation or infer failed delivery from non-use |
| Direct discovery bootstrap                                 | Advertisement has 49 tools and one eager tool; first App call is describe_design_apis                                                 | Implemented and exercised                                           |
| Scoped executable usage                                    | Payload 48 selects draft with projected-face, surface-grid and pattern; 183/209 select capture/record                                 | AI uses inputScope; repeat advice is not the fix                    |
| Compact signed bindings                                    | Capture responses retain request/requirement/check revisions and signature, not dependency bodies                                     | Implemented and exercised                                           |
| Mixed-image handoff                                        | 630 captures two images with three retained IDs; 645 preserves known roles; 649 completes old-image roles without lookup or recapture | Implemented and exercised                                           |
| Spatial advice                                             | Existing spatial topic explains common basis, gaps versus occlusion, relative moves and local evidence; not read                      | No demonstrated missing topic                                       |

## Confirmed contract findings

1. `local-design-workflow.ts` scoped usage says criteria are immutable after
   drawing, losing the qualification that an established plan cannot be rewritten.
   Native description, review owner and formal tests permit initial criteria after
   first pixels. The compressed geometry instruction similarly loses the supplied
   2D input condition retained in `designRepresentationGuidance`. Replace these
   inconsistent representations at their producer; no evidence attributes a
   particular waiting interval to either sentence.
2. The spec distinguishes visual from canonical/numeric evidence, but
   `local-design-review.ts` requires nonempty inspectionIds on every judgment and
   records image dependencies for data criteria too. Payloads 212/664 justify
   scale/editability using numeric inputs and native receipts, while binding them
   to a whole image. This is an unresolved evidence contract, not failed selective
   invalidation or mixed-image recovery. Earlier bounded work explicitly deferred
   separating data acceptance. Removing images without authoritative data evidence
   would weaken acceptance and is not an acceptable fix.
3. Scoped acquisition works but complete representations remain large. The first
   selected guide has 26,816 content bytes in two pages; the six-tool query has
   56,039 bytes in three pages. The batch/delete joint query advertises 108,004
   bytes, of which only its first fragment was delivered before narrowing. Selected
   deletion already includes its invocation envelope. The owner projects both
   input and output scopes, then assembles success/partial/recovery/host result
   schemas. Improve that representation without removing executable constraints.
4. Existing tests prove direct invocation, legal guides and safe recovery. Some
   choose the correct scope programmatically. Frozen historical byte allowances
   include full-result-contract cost. These are useful correctness gates, not
   proof of minimal acquisition or faster model behavior.
5. Advertised tool definitions and tool payloads are retained, but thread/start
   does not retain the assembled instruction blocks. The serializer redacts an
   `instructions` property. Current-source reconstruction is therefore distinct
   from retained delivery evidence. Native search request/result pairs are not
   established by this trace; do not invent a search-ranking root cause.

## Timing interpretation

The 34 recorded App tool calls total about 13.38 seconds, including about 10.73
seconds for five drawing calls. Most wall time is outside those measured call
boundaries. It is not all model reasoning or all idle time. Exact provider
generation, queueing and network attribution remains unavailable. Contract bytes
are not token counts, and smaller inputs alone do not prove lower model latency.

## Authorized implementation

See the bounded task in the [parent plan](../plans/ai-design-agent-plan.md#contract-delivery-and-evidence-closure---2026-11-04).
Preserve successful discovery, local repairs, current-image validation, optional
Knowledge, no-replay, the fixed prompt and the original-session untimed report.
The new acceptance boundary is source-to-delivery-to-consumer correctness plus
explicit acquisition/work counts, followed by one authorized live run.
