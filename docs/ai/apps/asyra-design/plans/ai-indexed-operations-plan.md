# Indexed drawing queries and local edits

Status: initial implementation and full-run follow-up locally verified; PR #300 remains open. Follow-up changes are local only.
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

## Task - full-run follow-up

Baseline: `ee7107ce360cac7624c013f782b2262a9dd12534`. The user approved
continuing the open PR after the full-run trace
`c65118a8-cc15-4331-99fb-f670650b1828`. Success means correct narrow lookup,
current canonical writes and complete usable evidence, not a promised duration.

Authorized scope extends the existing App compose/apply/inspect/observe owners:
context queries and their registered guidance; prepared apply and direct metadata
consumers; reference applicability and review handoffs; execution report
classification. Framework changes are limited to a demonstrated repeated-work
cause on these existing canonical call paths and their direct tests. Preserve
spatial membership, all admission, cancellation, locks, history, source images,
geometry, model settings and final whole-request review. No new acquisition
strategy, rendering strategy, subject-specific camera/shape rules, dependencies,
CI routing, automatic mutation retry or unrelated cleanup.

Fixed discovery: this saved trace and payloads, named owner call paths above,
their direct consumers, public APIs and existing formal tests. Findings:

- A region API exists but the live program read 42 child pages from two broad
  parents. Region candidates must be usable as compact IDs; a known local defect
  uses workspace bounds, then task filters, rather than enumerating a broad
  ancestor. Unknown semantic intent remains the model's decision.
- The same 8,193-object batch took increasing create/yield time. Attachment,
  type and lock readers currently call full `getElementData`, which serializes
  growing child arrays. Prove and remove that unnecessary snapshot work using
  existing metadata APIs, then count the remaining direct canonical work before
  deciding any further owner change. Do not infer renderer cost from elapsed time.
- One limit=500 admission failed against maximum=200. Advertise the actual bound
  and response pagination from the same contract; keep validation strict. Add a
  compact identity projection, preserving default metadata and explicit fields.
- The formal evaluator already detects unavailable replies; the earlier manual
  action-failure count omitted admission. Add a single explicit report summary
  of admission/execution/partial/unknown outcomes using observed receipts, without
  labeling unrelated later calls as recovery or transport completion as success.
- Reference selection already follows the latest facts update. Preserve the
  model's supported uses and limitations with the selected image identity and
  pass them into independent review. Download success is not suitability proof;
  no image-quality heuristic may make the model's decision.
- Reuse valid source facts and unchanged evidence only under proven lifetime
  dimensions. Existing global image revision invalidation is conservative and
  must not be bypassed. First verify its coverage and keep focused intermediate
  reviews plus fresh final whole-composition assessment. Only introduce narrower
  reuse if dependency evidence can prove validity; otherwise document that
  intentional boundary instead of guessing that old pixels are current.

Sequence: apply query -> compose guidance -> apply metadata/work -> observe
report -> inspect reference/evidence -> bounded integration review. Each segment
uses the existing Inspector owner and produces its card before edits. Required
gates: formal failing regressions for new behavior, eight-tier shared-parent
region-to-batch case, candidate/property/snapshot work counts, missing/invalid/
locked/filter/page cases, changing-parent/replay freshness, report classification,
reference-selection and stale-evidence tests, naming, affected owner suites and
routed local validation. No paid model run is needed to prove these contracts.

Design review: region coordinates come from workspace bounds, not screenshot
pixels or parent-local coordinates. The index is already runtime-owned; do not
add a request-local second spatial index. Compact IDs are observations, not
permission grants. Revalidate at ordinary mutation admission. Metadata projection
must retain the real parent/type/lock checks at each slice, so interleaved user
edits still invalidate execution. Reports cannot infer hidden model thinking or
recovery. Source applicability is retained model evidence, never canonical proof.
All accepted initial obligations remain; stop for an unresolved authority
conflict or necessary change outside this scope.

### Step card - local region lookup

Owner `apply`, route compose-to-apply, spec Preparation and execution; Inspector
apply region condition. Input: admitted workspace bounds, canonical type/ancestor/
lock filters, requested result projection and page. Output: ordered candidate
IDs or existing element summaries with truthful pagination. Read-only; no
transaction. Contributors: Design context action/common API and public Core
metadata/spatial query. Forbidden: parent children enumeration to resolve a
region, viewport-coordinate assumptions, canonical writes or pixel-visibility
claims. Files: existing context action, design-context and their formal tests,
indexed-design-query E2E. Failure owner: apply via recoverable adapter. Cases:
one bounds within a shared eight-tier parent, empty/invalid region, filter before
pagination, zero unrelated property reads, compact IDs into ordinary batch edit.
Naming: optional `result` wire field (`elements` default / `ids`), existing IDs
and saved document data unchanged; page constants remain App query-owned.

Region checkpoint: the new shared-parent compact-query and filtered-pagination
regressions fail on the baseline rejection and pass after the query change
(32 focused tests). The query owner returns IDs without computed-property reads
or child-list calls. Runtime browser composition is retained for the integration
gate. Naming passes before identifiers propagate. Existing metadata output stays
the default; spatial queries remain current bounds candidates.

### Step card - local query discovery

Owner `compose`, route compose-to-apply; spec Capability discovery and composition.
Input: registered context schema and original local-edit intent. Output: exact
region/ID projection usage and actual page limit. Conditions: use known IDs
without lookup; spatial lookup for unknown local targets; children only for
actual hierarchy questions. Contributors: existing domain guidance and registered
context tool description; no semantic classifier or automatic model decision.
Files: ai-domain-prompt and its formal tests; context action owns detailed schema.
Gate: advertised guidance keeps exact schema and execution path, full retrieval
and model freedom; no fixed building or camera semantics.

### Step card - prepared apply metadata

Owner `apply`, existing prepared-to-apply route and normal canonical admission.
Input: admitted prepared entries and current parent/type/lock observations.
Output: identical ordered writes/receipts and ordinary grouped Undo. Recheck
current metadata at each synchronous slice; cancellation and user edits retain
existing rejection. Use Core metadata instead of cloning full parent snapshots;
no retained permission cache. Boundary: design-actions, its formal tests and
public Core metadata facade (already implemented). Test the real default adapter
with metadata changing between slices, and prove zero snapshot reads regardless
of growing children. Stop if canonical ownership or admission must change.

Metadata checkpoint: the default-adapter regressions fail on the original
full-snapshot read, then pass with metadata-only checks, including a parent
locked during a cooperative yield. 74 query/apply tests pass. Scene Tree's
insertion preflight validates only incoming descriptors; its parent-order copy
is rollback evidence, not a redundant permission snapshot. Retain that semantic
boundary. Remaining wall-clock growth cannot be assigned to this one fix.

### Step card - complete execution outcome reporting

Owner `observe`; spec Diagnostics and Inspector observe input/receipt conditions.
Input: retained terminal tool receipts, transport stage, action outcomes and
explicit omission markers. Output: mutually exclusive per-call usable/partial/
rejected/failed/unknown classification and counts, separate from child action
failures. Do not infer recovery from the next call or certify visual correctness.
Boundary: local-ai-evaluation, execution-report-cli and their tests. No execution
or retry changes. Gates: admission rejection despite completed transport, partial
with acknowledged work, failed transport, usable reply and absent evidence; keep
original call identity, timing and privacy.

Observation checkpoint: the new outcome summary regression fails before the
change and passes afterwards; 26 report/CLI tests pass. Native transport and
nested actions remain separate counts. Missing outcome evidence remains unknown.

### Step card - source applicability handoff

Owner `inspect`; spec Evidence and completion; existing facts-to-review inputs.
Input: valid retained source facts, criterion bindings, latest explicit reference
selection and current inspection images. Output: the independent reviewer receives
only relevant bound facts, including their source, scope/limitations and recorded
verification, alongside selected images. Reuse the existing facts schema, not a
second reference judgment store. Facts remain source evidence, never current
canvas proof; invalidated facts cannot reach comparison as valid. Image evidence
still requires the same current revision and final overall check. Boundary:
local-design-review, local-visual-assessment, local-ai-provider and their tests.
Gates: fact scope survives drawing changes, unrelated/data facts are excluded,
changed dependencies retire affected facts, reference replacement is preserved,
provider actually receives this context without tools; stale images cannot pass.
No target-local image cache is introduced: the current public evidence stamp has
only document session/revision, so narrower reuse would be unproven. Focused
intermediate checks and reusable source facts already have formal support.

### Follow-up verification and bounded review

The eight-tier shared-parent browser case selects and edits only the bounded
third-tier candidate, reads no parent children, and restores it with Undo. The
preserved 18,287-element Taipei 101 oracle agrees with the spatial and compact-ID
results: this region checks 311 candidates and returns 10 IDs after index creation;
repeated and post-pan queries perform zero fresh bounds reads. These are work
counts for this fixture, not a universal ratio or promised model-time gain.

Apply regressions preserve current metadata checks after a parent changes during
yield, with no full snapshot reads. Source-fact tests prove bound/valid visual
scope handoff, exclude data-only and unrelated facts, retain selection changes,
and invalidate changed dependencies. The independent reviewer still needs current
canvas evidence. Report tests use the real recoverable failure envelope: confirmed
partial work stays partial even when the enclosing result is unavailable.
Offline replay of the saved live run reports 93 usable App calls, 3 partial and
1 rejected; 6 external research steps lack result-usability evidence. Four nested
action failures remain a separate count. No new model drawing run was performed.

Final routed local validation passed with `sourceVerified=true`:
`tmp/local-validation/dc9dccd4-e30e-47d4-86bb-f7cbc42ffbf5/result.json`.
Design and Inspector lint/build/tests, shared/dependency checks, functional E2E
391 passed / 19 conditional skips, collaboration 14 passed / 3 conditional skips,
and render contracts 3 passed. The isolated large-document milestone separately
passed all 3 indexed-query cases. Naming and typecheck passed. Validation fixes
were test assertion lint hygiene and regeneration of the Inspector workspace
bundle; no product checks were relaxed.

Source candidate `bc947635-5e36-4110-b770-8bfd612533f7` and target assessment
`d6dc51fb-0ebf-4b8d-b075-32a0737b70f5` passed with eligible=true for target
`fbad7006-1f59-4c55-ab24-b8b2d895ef94`, allocation revision 2. Bounded review
covered the diff, direct consumers, source-fact freshness, real partial-result
semantics and the fixed gates. Final edits after local validation are this plan's
status/evidence only; runtime and test inputs remain byte-identical. No push or
merge is included in this follow-up.
