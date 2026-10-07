# Indexed drawing queries and local edits

Status: implemented and locally verified; PR review pending.
Base: `0dd9e2c0e779b34a8f4bda66384b9ff10440d2f6` (PR #299).
Closeout owner: this task.

## Task - indexed operations

Enable AI to locate a bounded set of current objects, compose the appropriate
registered operations and repair an admitted preparation failure without sending
the entire document or draft again. Region queries find candidates; they do not
decide the user's design or silently modify geometry.

Authorized owners: Design preparation/artifact lifetime, registered discovery and
batch composition, Design common context/hierarchy APIs, and the smallest Core /
Render query interfaces needed for spatial lookup. Include their permanent tests,
current API/spec documents and execution Inspector. No rendering strategy,
reference acquisition, model configuration, automatic aesthetic correction,
document-format migration, dependency additions or unrelated CI changes.

Discovery is fixed to the last full-101 tool trace, these APIs and their direct
callers, existing geometry/bounds/registry utilities, query lifecycle consumers
and formal tests. Final review uses the diff, direct consumers and gates below.

## Evidence and design decisions

- A relative move read 2,186 child IDs (about 111 KB) to place two objects at
  index 1,417. Resolve before/after placement inside the hierarchy owner using
  current identities. Preserve the existing indexed move and Group geometry
  normalization; no caller-supplied old values.
- Four duplicate construction keys rejected a roughly 121 KB draft. Return
  conflict keys and exact source paths. Retain a bounded request-local draft
  reference for explicit field repairs; compile and validate the repaired draft
  before any apply. No automatic retry or partial canonical write.
- Exact prepared keys already use a map. Prefix selection currently enumerates
  every key on every call. Build an artifact-owned sorted key index lazily once;
  binary-search a prefix range and preserve original target order. Release the
  index with the artifact. No second canonical identity store.
- Existing `getElementIdsInBounds` walks every workspace object on each query.
  Reuse its public role but put spatial candidate lookup behind Core's renderer
  abstraction. Use a multilevel spatial hash over workspace extents: small objects occupy
  small cells and large objects occupy coarse cells, each stored once. Query
  occupied cells and then test exact bounds. Geometry and transform changes
  invalidate affected objects and ancestors; parent transforms also invalidate
  their descendants. Membership/order changes refresh ordering separately from
  bounds. Viewport transforms do not invalidate workspace extents. Rendering, zoom and LOD
  remain unchanged. Return conservative candidates, never claim pixel-perfect
  visibility or infer occlusion from bounds.
- Region filtering consumes candidate IDs and only requested metadata. Hierarchy
  membership and identity are canonical; presentation extents come through the
  renderer API. Pending or unavailable projection is explicit, never a fake empty
  success. Moving a parent affects descendant world extents; deletion, reorder,
  Undo/Redo, load and runtime disposal must be covered.
- Native Code Mode, patterns, shared fills and artifact selectors already support
  composition. Improve discoverability at the existing contract owner, including
  selective usage/schema retrieval and the new query-to-batch paths. Do not add
  another model, tool catalog or generated-code evaluator. A native wrapper and
  its registered batch operation keep distinct, explicit invocation shapes.

Spatial references: <a href="https://github.com/mourner/rbush" target="_blank"
rel="noopener noreferrer">RBush</a> and
<a href="https://box2d.org/documentation/group__tree.html" target="_blank"
rel="noopener noreferrer">Box2D dynamic tree</a> demonstrate region-based
candidate lookup and updateable bounds. They inform the design; this task adds
no third-party dependency. Work-count proofs, not a library's benchmark or an
assumed complexity, determine whether the implementation removes full scans.

## Product cases and verification

1. Exact/prefix selectors preserve identity and source order, reject missing
   keys, and avoid a repeated full-key walk on a large artifact. Artifact release
   and a new request cannot reuse retired records.
2. A duplicate-key failure identifies both source positions. A compact repair
   succeeds through the same preparation and apply route; malformed pointers,
   missing/stale references and still-invalid repairs remain recoverable. Repair
   never mutates a successfully prepared artifact or repeats a write.
3. Before/after moves need no child-list response. Same-parent reorder and
   cross-parent movement preserve existing normalization, locks, transaction and
   Undo behavior. Invalid anchors reject before writing.
4. A query region returns all intersecting candidates and supports exact type,
   parent/descendant and visibility/lock filtering without reading unrelated
   object data. Negative coordinates, boundary contact, nested transforms,
   derived Group types, empty regions, oversized shapes and overlapping bounds
   have formal oracles. Region bounds are workspace coordinates, not viewport
   pixels. Pan/zoom must not rebuild a workspace index.
5. Large-document tests count index construction, candidate visits, bounds reads
   and metadata reads; localized edits update affected entries only. Compare
   results with a brute-force oracle, including the saved full-101 fixture when
   the browser owner is required. Do not impose machine-time thresholds in CI.
6. Executable registered-schema examples compose query, filter and batch edit;
   native invocation and batch admission agree. Full schemas and explicit
   context-loss recovery remain available.

Run focused regressions first, naming before/after the first identifier slice,
source-bound execution proof preserving accepted obligations, affected owner
lint/build/tests and routed local CI. Browser checks prove query freshness and
Undo on real Core/Render, without a paid live model or another 101 generation.
Create a new PR after local verification and bounded review; user reviews it.
Do not merge. Stop for a new dependency, unresolved authority conflict or a
necessary change outside these owners. Replan within this boundary if an
optimization fails equivalence or repeated-work proof.

## Step card - prepare

Authority: execution spec, Preparation and execution; Inspector `prepare`,
compose-to-prepare and prepare-to-apply. Inputs: validated construction source,
explicit repair fields and request-local artifact references. Outputs: immutable
prepared artifact / selector index or structured rejected-draft diagnostic.
Conditions: unique keys, exact reference lifetime, same admission and budgets;
direct edits bypass preparation. Contributors: preparation/construction owners;
forbidden: model calls, canonical writes, geometry simplification.
Boundary: design-preparation, design-construction, local-design-tools and their
owner-local helpers/tests. Failure owner: prepare. Gates: selector work counts,
duplicate paths, compact repair, lifetime and unchanged preparation suites.

## Step card - apply query and hierarchy owners

Authority: execution spec, Preparation and execution; Inspector `apply` and
compose-to-apply. Inputs: current region / IDs / anchor and new values. Outputs:
ordered candidate identities or canonical mutation receipts. Conditions: current
workspace, live projection, finite bounds, validated permissions and parent
capability; read-only queries bypass transactions. Contributors: App common APIs,
Core facades, canonical hierarchy and engine-neutral renderer queries. Forbidden:
Pixi imports, UI data as canonical authority, automatic target edits or a second
Undo manager. Boundary: Design context/element/hierarchy common APIs, relevant
Core query facade and Render query/index owner, their direct tests. Failure owner:
apply through the existing recoverable adapter. Gates: brute-force equivalence,
large-data work counts, invalidation, real browser mutation/Undo integration.

## Step card - compose

Authority: execution spec, Capability discovery and composition; Inspector
`compose`, compose-to-prepare/apply. Inputs: current admitted schemas and the
query/repair/anchor contracts. Outputs: exact usage guidance, schema and compact
handoffs. Conditions: known APIs execute directly, full recovery remains;
simple edits bypass construction. Contributors: registered contracts and native
workflow; forbidden: duplicate catalogs or App evaluation of generated code.
Boundary: basic API contracts, context action, local-design-workflow,
local-operation-batch/tools, examples, domain prompt and direct tests. Failure
owner: compose. Gates: schema input/output parity and executable compositions.

## Design review

Confirmed: identity lookup, spatial candidate lookup and hierarchy placement are
different responsibilities. Spatial extents cannot choose design intent or prove
occlusion. Mutable indices must consume owner changes and be discarded on load /
runtime replacement; prepared artifacts are immutable and request-owned. No saved
ID or data format changes are needed. Exact spatial ownership and invalidation
will be proved before its implementation segment; no full-document invalidation
may be disguised as a successful local-work optimization.

## Validation checkpoints

Prepare: the formal 2,049-key regression failed on the original repeated full-key
walk. Indexed lookup passes it and retains source order; a 10,000-key test counts
only matching prefix entries plus one boundary check. Duplicate-key repair failed
on the original missing diagnostics; explicit replacement now passes unchanged
admission. 112 preparation/construction/flow tests and five index/retention tests
pass; server TypeScript and the naming gate pass. No canonical writes are added.
Source-bound readiness target: `tmp/ai-indexed-operations/target-created.json`.
This is implementation progress, not final PR delivery evidence.

Compose: the combined route initially rejected a valid repair. Its regression
requires the same preparation handoff and exactly one apply after successful
repair; invalid source must not dispatch a write. The existing compose step and
its input/output/failure contract were rechecked before this segment.

Query checkpoint: formal Core observations avoid property serialization; App
region/context and hierarchy tests pass. Browser tests prove current query
results through write/Undo/Redo and relative move/Undo. The preserved 18,287-node
101 query matches brute force: 311 candidates tested for 10 returned document
objects; ten repeated queries and pan require zero bounds reads and zero order
rebuilds. First lookup measures 18,287 document nodes (internal render helpers
are excluded). Hierarchy ordering initially visits 54,844 projection nodes once;
ordinary geometry changes do not rebuild this ordering. Source evidence:
`tmp/ai-indexed-operations/large-query`. Counts describe this region, not a
universal candidate ratio or model-time improvement.

Naming/compatibility: region-query counters belong to Render diagnostics; Core
metadata/children/region methods are additive public read APIs. Relative movement
belongs to Design hierarchy. draftId identifies rejected request-local source,
not a canonical element or prepared artifact. Existing persisted IDs, document
schema, full reads and indexed moves are unchanged. Naming gate passes.

Bounded review: permanent regressions first exposed stale descendant extents
after intrinsic geometry changes and inconsistent coordinates for a translated
workspace. Both now pass; the coordinate contract matches Core
`elementLocalToWorkspace`, while viewport pan/zoom still reuses extents.
Workspace projection clear explicitly retires its index.

## Final local verification

Routed `yarn validate:local --base origin/main --run` checks are complete across
Design, Core, Render and the selected consumers. Evidence starts at
`tmp/local-validation/b53fd4ea-3640-4c6e-a0de-840ed0ff5fa5`; continuation
`1f3d1828-e70f-4c02-8ff9-18034683196f` preserves unchanged-input successes.
The final functional/renderer run is
`4ec0423c-943c-4f1b-9ee1-dff571a946e1`: 390 executed functional cases
(including five expected failures) and three renderer contracts, no flaky
results, source verified. The only intervening source edit corrected the new
relative-move fixture's parent oracle; production inputs stayed identical.
The full 101 milestone also passes at `tmp/ai-indexed-operations/large-query-final`.

An existing FieldScope Fit all screenshot comparison failed once. Without
production or assertion changes, three isolated repetitions and the full owner
suite passed; the intermittent cause remains unproven and its failure is retained.
No FieldScope implementation or CI routing was changed for this task.

Source candidate `c719b611-8214-4e7b-b031-40e4360e4d76` and target assessment
`5e898825-1fad-4fbc-a10c-4325a727873e` pass the reviewed execution contract.
The completed contract is bound by target `9cc9b012-d683-4ff6-b8c4-6357d533af0d`,
allocation revision 2. The earlier planning target remains historical because
its contract binding is immutable. Actual commit evidence is refreshed for PR
delivery. These deterministic checks do not measure live model duration.
