# AI API surface review - 2026-10-04

Status: approved consolidation implemented; integrated validation recorded in the active plan.

## Scope and evidence

Review the complete Design-facing Core/common-API inventory, the AI adapters,
native tool discovery and batch dispatch, and their direct consumers. This is
not a review of every export of every Framework package. Baseline: commit
`c6506a164bea82a5c7284dd3c4a0b4f3bb17c7a5` plus the existing local changes in
`codex/ai-execution-flow`. Preserve those changes and recorded runs.

Discovery used TypeScript public-member inspection, the explicit API
declarations/dispositions, direct call-site searches and the latest retained
run. Candidate classes: duplicate exposure, single/batch equivalence, coordinate
and ownership ambiguity, unnecessary old-value reads, input/output contracts,
and capability selection. No product code, active specification or Inspector
contract changes are part of this audit. No live drawing or remote operation.

The baseline inventory covers **355 public members** (including non-callable
members), of which **173 are AI action contracts** and 182 have explicit host or
alternative-route dispositions. The existing signature/coverage gate passes
all 8 tests. It proves inventory and argument-order coverage, not suitability,
complete JSON-schema equivalence, output semantics or model selection quality.

| Public owner              | Public members | AI contracts | Review disposition                                                                                                                 |
| ------------------------- | -------------: | -----------: | ---------------------------------------------------------------------------------------------------------------------------------- |
| Core                      |            161 |           52 | Keep canonical capabilities; consolidate duplicate model-facing routes; distinguish document observations from host diagnostics.   |
| Element, including vector |             65 |           62 | Keep all editing capabilities; batch mutations; separate coordinate frames and geometry-preserving operations.                     |
| Selection                 |             14 |           14 | Prefer explicit batch replacement; distinguish encoded selections from structured point/segment references.                        |
| Hierarchy                 |              7 |            7 | Preserve App geometry normalization; separate canonical identity reads from UI projections.                                        |
| Viewport                  |              6 |            6 | Keep navigation explicit; consolidate duplicate coordinate/read routes. No automatic fit-zoom.                                     |
| Fill                      |             25 |           25 | Consolidate scalar/batch/field variants; distinguish patching independent fills from linking shared fills and pointer interaction. |
| Stroke                    |              7 |            7 | Repair old-value mutation contract before consolidating its AI routes.                                                             |
| Transaction               |             11 |            0 | Keep host-owned lifecycle; AI batch adapter already supplies it.                                                                   |
| History                   |              2 |            0 | Keep user/host-owned Undo/Redo lifecycle.                                                                                          |
| System context            |             41 |            0 | Keep gesture/session writes host-owned; existing snapshot route remains distinct from document edits.                              |
| Cursor                    |              2 |            0 | Keep pointer presentation host-owned.                                                                                              |
| Render layer              |              2 |            0 | Keep callback/resource registration host-owned.                                                                                    |
| Inspection                |              1 |            0 | Keep the existing image-carrying inspection tool route.                                                                            |
| Vector geometry helpers   |             11 |            0 | Keep canonical vector action adapters; do not expose computed-patch construction as a competing edit route.                        |

Also reviewed the native exposure of composite actions: prepared-design apply,
composition insertion/update/replacement/removal, single-element editing and
visibility, selection, context, arrangement, organization, review and conversation
control. Their existence outside the basic catalog matters to consolidation.

## Baseline findings

### 1. Method coverage is being used as the model's task menu

`src/ai/basic-api-contracts.ts` supplies a generic description when a declaration
does not provide one. **123 of 173 declarations have no specific description.**
The no-argument catalog in `server/local-operation-tools.ts` returns names,
owners, methods and effects, but omits even the available descriptions.

Purpose lookup requires every normalized query word to occur in a method name
or description. An unsuccessful query tells the model to read the entire catalog
or try other words. This is keyword filtering, not an operation contract resolver.
The latest run fetched the full catalog, then explicitly requested
`getFillTargetsAtIndex` and `updateFillFieldsBatch`; it did not request the
available `updateFillsAtIndex` contract. That establishes a missed route, not
proof of the model's private reasoning or that every fill update was uniform.

Decision: retain complete primitive coverage as an engineering invariant, but
organize the model-facing menu by explicit operation semantics and target/value
shape. Each operation needs its applicable situation, input, result and relevant
distinctions. Do not simply give the model a longer list of method descriptions.

### 2. An outer batch does not make the selected operation efficient

`execute_design_batch` already admits multiple operations. Prepared target
expansion can supply one plural target argument or expand a singular argument
into several actions. However, native tools still independently expose composite
single-object actions such as `update_design_element` and visibility changes.
The basic catalog also retains scalar and plural variants of the same operation.

Examples for consolidation: `updatePrimaryFillColor/Colors`,
`updateFillField/Fields/FieldsBatch`, `addFill/Fills`, `removeFill/Fills`, and
`setVectorElementPosition/Positions`. Keep one model-facing mutation operation
per semantic purpose, accepting one or many targets. Use a shared patch for
uniform values and per-target patches for genuine differences. Dispatch through
the existing canonical owners; do not invent a second data layer.

Batch-only exposure still permits repeated one-item calls. It removes redundant
single-item tool choices, but cannot guarantee that the model will discover all
independent edits at once. Receipts should measure calls, item counts and repeat
patterns. Do not buffer arbitrary future calls, reorder dependent operations or
claim that batching alone fixes the whole 30-minute run.

### 3. Similar method names sometimes hide different semantics

`hierarchy.moveElements` uses `moveElementsWithGroupGeometry`, unlike the raw
Core route. Element creation supplies App defaults and vector handling. In
particular, `element.createElements` currently rejects an all-vector batch with
different parents, although the single-create route can create each separately.
Removing the scalar route without proving equivalent batch support would lose a
valid capability.

Fill sharing changes future ownership relationships; applying the same patch to
many independent fills does not. Workspace, client, element-local and source
coordinates are not interchangeable. Canonical data, computed properties and
UI projections also answer different questions.

Decision: consolidate model-facing aliases only after proving semantic parity.
Prefer the App operation for App edits that require its normalization/defaults.
Preserve distinct capabilities with explicit input/result semantics, including
advanced canonical operations. Keep App methods used by UI features unless an
actual API migration replaces their contract and all direct consumers.

### 4. Stroke still requires caller-supplied old state

`common-apis/strokes.ts` accepts `currentStroke` in `updateStrokeFields` and
`updateStrokeField`. It compares against that caller snapshot, merges the snapshot
with the patch, and writes the resulting record. The Property Panel also calls
this contract. This is not merely an AI prompt issue: a stale snapshot can carry
unrelated old fields back into a write, and AI callers need an unnecessary read.

Decision: move the operation to a new-values-only patch contract, with a batch
form and owner-side validation. Preserve stroke geometry/bounds handling,
canonical setter before/after capture, shared-property behavior and Undo. First
prove stale-input, omitted-field preservation, multi-element and Property Panel
cases in App tests. Then migrate UI consumers and the AI adapter together. Do
not mask the API issue by fetching another old snapshot in the AI layer.

### 5. The tool output contract is weaker than the input contract

Basic contracts declare an input schema but no operation-specific result shape.
`basic-api-actions.ts` wraps an unknown return value and derives status from the
effect and whether the result is `false` or `null`. A returned array containing
failed entries does not fit that scalar status test. Void-returning mutations
also do not establish whether data changed.

Compact responses aggregate only successful valueless mutation acknowledgements;
query values remain complete. Thus choosing a broad query can still return a
large result. The latest run contains an approximately 1.71 MB context response.
These are native tool-boundary bytes, not proof that every byte entered model
context unchanged.

Decision: define operation-specific result/receipt semantics, including ordered
created IDs, changed/no-change/rejected items, failure stage and partial outcome.
Use explicit requested fields or existing artifact references for data retrieval.
Preserve full correlated inputs/results in diagnostics while returning the data
the caller actually requested. Do not silently truncate required query data or
report batch success solely because an array was returned.

### 6. Guidance can force an unnecessary read before an explicit write

`context-action.ts` says to read before targeted edits, and
`design-edit-action.ts` describes editing after reading context. This conflicts
with the valid case where current target IDs and new values are already known.

Decision: read only when the requested operation requires unknown information.
For known targets plus new values, the App validates current identity, ownership
and write eligibility. Reuse target references already held by the request;
invalidate them according to document/artifact lifetime. A read remains necessary
when the user's request depends on an unknown current value or visual evidence.

## Approved consolidated contract

1. **Batch mutations:** a single model-facing operation per editing purpose.
   One target is a valid batch. Uniform patches and individual patches have
   explicit, distinguishable schemas. Composite preparation-plus-apply remains
   available because it already applies a collection and avoids an extra trip.
   Conversation, research and inspection tools keep their appropriate contracts;
   they are not artificially treated as element mutation batches.
2. **Direct selection:** registered semantic operation identities resolve to
   one admitted adapter and its exact current schema/result contract. For
   example, “patch fill row on known targets with the same new fields” resolves
   directly to the uniform fill patch operation; linking shared Fill ownership
   is a separate explicit operation. The small operation menu must contain these
   distinctions so the model can call directly when it has the needed inputs.
   Do not require an extra resolver call before every execution.
3. **Authoritative metadata:** keep semantic identity, applicability, target
   shape, value shape, owner and result together with the registered contract.
   Generate discovery and dispatch lookup from it; no second handwritten
   synonym map, method-name heuristic or model call to decide the adapter.
   Exact lookup cannot guarantee correct interpretation of every natural-language
   request. Ambiguous or unsupported intents return the missing distinction,
   rather than silently choosing or directing the model to scan everything.
4. **Owned data:** resolve target references and child Fill/Stroke identities
   inside the existing App owners. Known-target patches do not fetch whole
   documents or send old component values through the model. Preserve ordered
   dependencies, cancellation, permissions, normal publication and request Undo.
5. **Capability preservation:** every current public member retains an explicit
   exposed-operation, equivalent-operation or host-only disposition. Removing a
   duplicate tool name is separate from removing a public App method. New public
   members still fail the coverage gate until classified.

## Implementation sequence and acceptance

The execution specification and Inspector compose/apply/settle boundaries now
carry the approved discovery, new-value writes and receipt semantics. The baseline
findings above are historical evidence, not descriptions of current behavior.

1. Test-first the Stroke stale/whole-record write risk and per-item outcome
   reporting; prove plural creation parity before retiring scalar exposure.
   Preserve the relevant
   App consumers and prove single/multiple targets, missing targets, no change,
   geometry consistency, shared relationships, Undo/Redo and collaboration.
2. Consolidate the AI mutation surface without losing vector-node editing or
   primitive capabilities. Test every replacement's semantics, one-item versus
   multi-item equivalence, ordered mixed operations, cancellation and partial
   failure. No automatic retry of uncertain writes.
3. Replace catalog scanning as the normal selection path with the registered
   semantic operations. Formal cases cover uniform fill edits, different fill
   edits, explicit sharing, mixed-parent creation, nested hierarchy moves,
   vector-node edits and missing-information queries. Assert selected owner and
   number of queries/dispatches, not only final output.
4. Verify compact results against full diagnostic evidence, target lifetime and
   invalidation, schema examples, coverage, types, naming and scoped lint. Test
   existing higher-level operations and UI callers for regressions. Measure
   unnecessary reads and payload duplication without inventing a fixed runtime
   SLA or treating one live drawing as comprehensive API validation.

Self-review: a batch wrapper alone leaves wrong-method selection untouched;
removing similarly named methods alone can lose normalization or coordinate
semantics; an added AI router introduces another model round trip. The proposed
contract addresses all three through owner-declared operation semantics and
existing deterministic execution. App API corrections precede AI adoption.

Validation performed for this audit: naming baseline passed;
`server/__tests__/basic-api-contracts.test.ts` passed 8/8 from the App directory.
Logs: `tmp/api-surface-naming-baseline.log` and `tmp/api-surface-coverage.log`.
No production API has been removed, merged or reimplemented in this audit.

## Implemented outcome

- Removed 19 redundant AI aliases with explicit surviving operations; retained
  public UI wrappers and distinct canonical/App semantics. Removed three unused
  public Gradient snapshot helpers; detached drag geometry is private.
- Added new-value Stroke batches and migrated UI callers. Fixed Preset child
  conversion so sparse patches retain omitted fields; downstream Render consumes
  detail changes without adding defaults. Mixed-parent vector creation now keeps
  input order and intended Undo boundaries.
- Every advertised basic API has explicit purpose, semantic operation/category and
  declared return meaning. Exact lookup uses the current admitted schema; empty
  discovery is a category menu. No additional model resolver or mandatory read.
- Basic and scalar composite mutations use batch dispatch. Collection tools retain
  their existing combined preparation/application route.
- Ordered creation failures, structural changes and ambiguous acknowledgements are
  reported honestly; conversation status preserves failures and partial changes.

Limits: exact lookup does not guarantee model interpretation; batch-only exposure
cannot force the model to identify all independent edits in one call. Void/false
owner returns cannot prove changed state. No new live drawing or speed comparison
is claimed by this consolidation's deterministic acceptance gates.
