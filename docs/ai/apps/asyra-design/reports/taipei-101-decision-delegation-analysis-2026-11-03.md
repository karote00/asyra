# Taipei 101 - decision delegation - evidence review - 2026-11-03

## Conclusion and scope

This run establishes an incorrect paint-order decision and a partially effective
first correction. It also establishes repeated image acquisition that supplied no
new pixels. It does **not** yet establish an App correctness bug in inspection
invalidation, a failure to delegate deterministic work, or a requirement to force
Knowledge usage.

The task ended because the benchmark cancelled at its soft deadline. The model
had recovered a stale-evidence binding and had not recorded final acceptance.
This is an incomplete benchmark, not an autonomous premature-stop regression.

Association: [decision and execution responsibilities follow-up](../plans/ai-design-agent-plan.md#follow-up---decision-and-execution-responsibilities---2026-11-03).
The [original run report](taipei-101-decision-delegation-15m-2026-11-03.md)
retains identity, all call timings, source fingerprint and runtime measurements.
This review covers that single run, its captured payloads and images, and direct
hierarchy/inspection owners. It changes documentation only. No additional live
run, prompt change, product fix, full local suite or remote operation was performed.

## Findings reviewed against alternative explanations

| Observation | Classification | Evidence and limit |
| --- | --- | --- |
| Ribs and bands obscure coin ornaments | Confirmed task mistake | Native-resolution before/after images and actual painter order agree. This is visibility correction, not merely optional extra polish. |
| First repair leaves an internal rib over a coin | Confirmed incomplete operation selection | Moving the ornament group changes its order against another group, not its own children. The API performed the requested operation. |
| Spire platform obscures the shaft | Confirmed visible overlap, improved by repair | Reordering makes the shaft continuous. It does not prove physically correct front/back ring geometry. |
| Three stale crops return byte-identical images | Confirmed redundant image information; suspected invalidation precision gap | Hash equality proves no new image content. It does not alone prove a receipt was legally reusable. |
| Binding returns partial, then succeeds | Correct recoverable guard behavior | Invalid IDs were identified; the model reacquired only those images and rebound successfully. No dead end or failed request. |
| No final current acceptance | Confirmed incomplete verification | Deadline cancellation occurred immediately after successful rebinding. Stale judgments are not proof of final visual failure. |
| Zero Knowledge and reusable-tool calls | Not a demonstrated problem | Direct preparation tools already perform projection, patterns and grids. No evidence that composition or retrieval would have saved time here. |
| Long elapsed time | Confirmed latency, mixed causes | Provider-side intervals dominate. They cannot all be attributed to indecision, product execution, or one prompt change. |

## What went wrong in the ornament repair

Five preparation calls constructed the base, tiers, crown, ornaments and finishing
details. The ornament draft placed the coin components before a repeated ornament
pattern. That pattern includes pilasters, so those later same-group children can
paint over the coins. A subsequently created finishing group adds another layer
of bands and piers. The visible overlap therefore has two hierarchy levels.

At provider elapsed 719.182 s, the model requested
`api_hierarchy_moveElementsRelative` with the ornament **group** as the moved
element, the finishing group as anchor, and `placement: after`. This fixes the
between-group ordering. It cannot fix the pilaster-versus-coin order inside the
ornament group. The next native image confirms a remaining rib across the coin.

At 817.030 s, the model instead selected the coin components by artifact prefix
`coin` and moved them after the final ornament-pattern member
`ruyi-7-scrollCoreX`. That operation addresses the remaining internal ordering.
The final crop shows a clear coin face.

The first operation was neither a no-op nor an implementation failure: it removed
part of the obstruction. Its target granularity was insufficient for the complete
visible defect. The 97.849 s between repair starts includes inspection, discovery,
judgment and identification of the separate spire issue; it is **not** a measured
97.849 s of wholly avoidable waste.

Relevant owners:

- `apps/asyra-design/src/common-apis/hierarchy.ts`, `moveElementsRelative`, resolves
  the anchor parent and sibling insertion point.
- `apps/asyra-design/src/ai/basic-design-api-contracts.ts` describes the same
  relative-move behavior. Moving a group does not claim to reorder its contents.
- `packages/preset/src/components/group.ts`, `moveElementsWithGroupGeometry`,
  preserves geometry while moving and normalizing affected groups.

The second batch also moved `mastCollar` and `mastCollarTop` before the crown
group. Before this repair, an opaque platform ellipse interrupts the spire shaft;
afterward the shaft is continuous and the platform sides remain visible. This is
observable improvement, but a two-dimensional crop is insufficient to certify the
physical front/back relationship of the whole platform.

## Why the repeated inspections deserve investigation

There were five capture calls producing 17 inspection images. The retained assets
contain 13 distinct canvas-image hashes plus two reference-image hashes. Four image
deliveries therefore repeated existing canvas bytes.

The final binding attempt at 862.015 s rejected three stale inspection IDs. Their
replacement captures at 871.161 s were byte-identical to the earlier images:

| Crop in source coordinates | Earlier capture(s), provider seconds | Replacement | SHA-256 prefix |
| --- | --- | --- | --- |
| Tier, x=7800 y=28700 w=1024 h=1024 | 656.835 and 772.309 | 871.161 | `7679b5e8aab1ae0` |
| Crown windows, x=9000 y=10300 w=1024 h=1024 | 656.835 | 871.161 | `e085d9d717d95d4` |
| Crown roof, x=9600 y=7350 w=1024 h=1024 | 772.309 | 871.161 | `ff97389e480a1a8` |

Full IDs, hashes, asset paths and capture sequence associations are retained in
`analysis-inspection-map.json` under the run directory. Equality here means equal
PNG bytes, not a subjective judgment that two images look similar.

The partial binding was successfully repaired at 883.809 s. Roughly 21.8 s elapsed
from partial result to repaired binding, although reacquisition itself took about
0.156 s and the final binding about 0.017 s. Extra model/tool turns can therefore
matter more than image-rendering time. Removing this cycle is not guaranteed to
make the whole benchmark finish; final visual judgment still remained.

### Mechanism and uncertainty

`inspection-evidence.ts` observes scene moves and effective computed-property
changes. Regional captures obtain candidate members from spatial bounds and
include their containment dependencies. `inspection-dependencies.ts` invalidates
receipts when dependency elements or ancestors change, and rechecks regional
membership when relevant parents change. It does not blindly invalidate every
receipt on every document mutation.

Group movement can normalize group bounds and rebase child local positions while
preserving their world-space appearance. `group.ts` stages group geometry and
child positions, then applies the geometry projection. Reparenting the two mast
platforms out of the finishing group is a concrete reason to inspect this path.
A broad container dependency or an equivalent geometry normalization can explain
why an unchanged local crop loses currency.

This is a supported hypothesis, **not a reproduced owner defect**. Staged updates
are not proof that every staged value became an effective mutation. The retained
images also do not establish the entire canonical dependency footprint at each
capture. A conservative invalidation may be valid even when recapture ultimately
produces the same pixels.

The right next proof is a focused owner-level regression that combines a regional
receipt, actual group-relative moves, normalization and effective-change events.
It must distinguish world-space-equivalent changes from real overlap, member
entry/exit and painter-order changes. Only if the current behavior violates that
contract should invalidation be narrowed. Do not skip currency guards, compare
only image hashes as a replacement correctness contract, or instruct the model to
ignore partial results.

## Verification bookkeeping versus drawing quality

The capture results offered ready-to-fill check arguments. The model recorded
only the checks it had judged: early view acceptance, then tier acceptance and
base/crown failures or uncertainty. Later repairs invalidated some earlier
judgments. The final successful operation bound replacement evidence; it did not
record a new judgment or submit `report_outcome`.

This is not sufficient evidence that the model ignored a required protocol step.
The review contract allows recording only observed checks and preserving unrelated
valid judgments. Deferring overall acceptance while known defects remain can be
reasonable. Likewise, zero current accepted checks at cancellation does not mean
that eight visual criteria actually failed. It means current final acceptance was
not established.

The benchmark used a 900 s hard budget and its existing 15 s stop margin. The
ordinary cancellation control was clicked at browser elapsed 885.481 s; provider
duration was 885.128 s. The fixed user prompt did not communicate that internal
deadline. There is no basis to claim that the model elected to stop, that the App
arbitrarily abandoned a recoverable partial, or that another 15 s would certainly
have been sufficient.

## Was deterministic delegation actually absent?

No. Five `prepare_and_apply_design` inputs totaled 42,144 JSON bytes and produced
17,883 retained nodes, including 17,803 vectors and 74 ovals. Preparation used
projected faces, surface grids and repeated patterns extensively. The tier group
alone contains 9,336 children. The model did not manually enumerate every final
window or calculate every resulting vertex.

The direct tools already cover substantial high-level execution. Zero
`submit_tool`/`invoke_tool` calls does not demonstrate failure to delegate.
Composing a wrapper around a sufficient direct tool can add orchestration without
removing work. This trace does not establish a recurring missing computation
primitive that a new reusable tool would solve.

Knowledge is also optional. The architectural spatial topic already explains
geometry versus painter order, but the inspected App topic does not explicitly
teach the between-group versus within-group distinction seen here. A short,
optional diagnostic note could help with this recurring class of confusion.
There is no evidence that retrieval would have prevented this particular mistake,
or that forcing Knowledge before every drawing would reduce elapsed time.
Do not infer the model's private reason for not retrieving it.

## Where the time went

| Measurement | Result | Interpretation |
| --- | --- | --- |
| First paint, browser elapsed | 169.065 s | A real user-visible wait, not a proven runtime fault. |
| Provider exclusive intervals | 867.207 s | Approximately 98% of provider lifetime; includes waits and emitted activity. |
| App plus tool exclusive execution | 17.922 s | Approximately 2%; this trace does not support an App-compute bottleneck. |
| Last creation completed to provider end | Approximately 279.919 s | About 31.6% spent after construction, including review and real repairs. |
| Last edit completed to provider end | Approximately 67.429 s | About 7.6%, largely final evidence orchestration. |
| App calls | 33: 32 usable, one recovered partial | No rejected or failed App call. |

The provider report classifies roughly 555.115 s as waiting and 291.993 s as
reasoning-event intervals. These are observable timing classifications, not access
to private reasoning or proof of confusion. Research/response/request intervals
account for the remainder. No CPU profile was collected.

Ten API-description calls returned 144,528 JSON bytes, but they are not ten
identical discoveries: they include pagination, different operations, and narrower
schema paths. Labeling all discovery as redundant would be incorrect. The trace
contains real round-trip overhead; it does not measure the savings from changing
schemas or prompt delivery.

Reported input usage was 3,828,655 tokens, including 3,687,296 cached tokens; output
was 32,243 tokens. Usage is partial. Neither total input nor transport bytes alone
establish new-token cost or causality for latency.

## Prioritized next work, subject to a separate implementation task

1. Reproduce the suspected inspection-precision gap at its canonical owner. Keep
   unrelated-region validity and true overlap invalidation in the same formal
   test. If it is conservative behavior required by the contract, document that
   result instead of declaring and patching a bug.
2. Capture the confirmed hierarchy diagnosis as concise optional Knowledge:
   determine whether the occluder is inside the same group or in another group,
   then choose the smallest correct ordering operation. Avoid an always-on
   drawing sequence or mandatory retrieval rule.
3. Assess whether existing hierarchy inspection exposes enough information to
   choose that operation. Add a tool only after demonstrating missing information
   or repeated deterministic work, rather than treating every visual correction
   as a need for a new tool.
4. Evaluate review orchestration using the same evidence-currentness contract.
   Preserve explicit visual judgment; binding or matching hashes must never
   silently become acceptance. Any claimed speed improvement needs a later
   authorized comparable run, not a counterfactual subtraction from this trace.

No recommendation above has been implemented by this analysis. The strongest
immediate lead is unnecessary evidence churn, while the strongest confirmed task
mistake is choosing group-level ordering for a partly internal occlusion.

## Validation and retained evidence

The existing `inspection-dependencies.test.ts` and `inspection-evidence.test.ts`
passed: **34 tests, two files, 1.54 s**. They cover scoped validity, regional
membership, ordering and conservative unknown/load handling. They do not reproduce
this live combination of group normalization and regional inspection dependencies.
Passing them neither proves nor disproves the suspected precision gap.

All evidence paths below are relative to the worktree:

- Run directory: `tmp/conversation-improvements/live/taipei-101-fixed-1793646265510`.
- Original source, statuses and timings: `run.json`, `source-identity.json`,
  `source-changes.patch`, `execution-report.json`, `report-data.json`.
- Request: `provider-records/ad26fe14-c1d7-4419-a51c-cc0e6e20f54a.jsonl` and its
  sibling `.payloads` and `.assets` directories.
- Derived image map: `analysis-inspection-map.json`.
- Focused verification: `analysis-focused-tests.log`.
- Ornament before/first repair/final assets: hash prefixes `e2d84c72f1ae`,
  `7d2fcf74838c`, `aa24b9ec1d4e`.
- Spire before/after assets: hash prefixes `43c4171024f9`, `f928b826ff3b`.

The native-resolution crops above were inspected directly. The original report's
six final/reloaded views were also inspected. The complete video was retained but
not reviewed frame by frame. Saved, checkpoint and reloaded documents match; that
proves persistence consistency, not final design acceptance. Raw run evidence and
the immutable prompt were not edited.
