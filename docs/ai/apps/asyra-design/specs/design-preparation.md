# General editable design preparation

## Product contract

The assistant can create varied editable layouts and illustrations, revise chosen
objects, organize existing layers and answer read-only questions. It decides
subject, content and style from the request/context. The backend resolves declared
layout and canonical descriptors; it does not choose a design theme or substitute
another subject. This contract implements cases 1–3 and 11–15 of the AI design
agent plan and composes with its existing research/reference flow.

## Semantic preparation

A design draft explicitly selects a root `type` of `group` or `frame`. Supported
nodes are group, frame, rect, oval, text and vector. Group organizes children with
content-derived bounds; it accepts children and position but no width/height,
fill or layout options. The backend uses Preset's pure `@asyra/preset/group-bounds` derivation and
normalizes child-local coordinates while preserving world geometry. Empty Groups
have zero bounds. Frame requires independent positive width/height and may have a
solid or gradient background or one-time absolute/row/column/grid preparation. Either may nest
the other; hierarchy depth never selects the type. Missing root type is rejected.
Persisted Frame identity/registration remains unchanged.

Frame clipping, constraints, live Auto Layout, borders and corner radii are not
exposed by this preparation contract and must not be promised by the model.
Group has no independently rendered background. Layout overflow checks apply to
Frame boundaries, not to Group's content-derived bounds. A fixed requested output
region may be a Frame; a collection of artwork parts may be a Group.

Each node has a unique request-local key and
meaningful name. Absolute children use parent-local positions. Row/column/grid
containers declare padding, gap and alignment; the backend computes positions
from child dimensions. Text stays literal editable content with explicit font,
size, weight, alignment, line height and color. Vector illustrations use bounded
closed `rings` of anchor coordinates with straight segments or paired explicit
`outControl`/`inControl` cubic controls, never raster
stand-ins. Repeated patterns are expanded native objects, not claimed reusable
component instances.

`fill` accepts the existing `#RRGGBB` string or native gradient data:
`{gradientType, gradientHandles:[{x,y},{x,y}], gradientStops:[{position,color,opacity},...]}`.
The admitted gradient type is the canonical linear identity. Nonlinear types
remain outside this AI wire contract until their rendered behavior is verified. Handles are normalized to each final 2D element's bounds, including
projected and repeated faces; they do not encode world-space lighting. Two to 64
stops must be in nondecreasing 0–1 order; equal positions preserve hard edges.
Colors are hex, opacity is 0–1, and finite handles are bounded to ±10,000.
Unknown fields/metadata and malformed gradients are rejected before writes.
Preparation and browser admission share the App wire validator. Canonical fill
data, rendering, persistence and Undo use existing owners; no new renderer,
fallback shading geometry or persisted version is introduced. Gradients supply
continuous shading without expanding strips and do not guarantee visual fidelity.

Admission rejects unknown fields, unsupported kinds, duplicate keys, nonfinite
numbers, invalid colors/font values, contradictory layout fields and excessive
input. Bounds: at most 1,000 source nodes and 20,000 source anchors and controls. Compact pattern expansion has a separate per-artifact bound of 10,000 total output nodes and 200,000 total points; these bounds contain memory and wire size rather than limiting the complete drawing request. Nesting depth remains 12,
100,000 total text characters, positive non-Group dimensions and derived Group dimensions up to 100,000px (empty Groups may be zero). Limits apply
to the complete artifact, not separately to each child. No URL fetch or model call
occurs during preparation. Layout overflow is reported with exact node keys and
amounts. Absolute positions can intentionally overlap; row/column/grid placement
resolves declared gap and padding. Measurements do not infer overlap intent. Text fit is provisional
until actual browser font measurements are available; estimates never prove fit.

The result is a request-owned prepared artifact, an ordered parent-before-child
list of native descriptors, semantic-key/ID mapping and deterministic findings.
Only the backend creates canonical object/property/path IDs. Analysis is computed
once per immutable artifact, reused by its receipt, and recomputed for a changed
draft. The model receives an opaque artifact ID and concise findings, not the
full descriptor/path payload. No cross-request cache.

## Provider handoff

The local provider advertises `prepare_design` only when `apply_prepared_design`
is registered. The combined prepare_and_apply_design tool may perform both steps without an
intermediate model round trip, preserving the same admission and receipt owners.
For preparation-only calls, the model supplies a semantic draft, receives a same-request
artifact ID and findings, and applies that ID without copying native descriptors
or point/property IDs. The same resolver serves dynamic operation calls and final
batch transport; model-authored raw `design` payloads are rejected. Preparation
has no request-total attempt limit. Bad
preparation/reference inputs return actionable errors without canvas writes, so
meaningful corrections can continue until completion or user cancellation. Unknown, cross-request
or stale artifact IDs never resolve to a fallback design. Preparation never
requires a reference image. The ordinary operation receipt and rendered inspection
follow application before a success claim.

## Canonical execution

The apply operation resolves a prepared artifact on the server and sends its
validated bounded payload to a registered App action. The App admits registered
native types, unique identities, valid parent order, required properties and
current target permissions before writing. It applies parent-child groups through
existing common APIs within the invocation transaction and yields between chunks.
It returns root IDs and the semantic-key/ID mapping for subsequent targeted work.
Later failure preserves completed writes under the accepted runtime contract.
No server artifact can execute arbitrary JavaScript or bypass permissions.

## Context and targeted operations

Canonical metadata reads use Core's optional flat field selection on
`getElementComputedData(elementId, fields)`. The existing no-selection call still
returns a detached whole projection; selected reads clone only requested own
values, never omitted vector points. Selection accepts at most 64 nonempty names
of at most 128 characters and removes duplicates. Missing objects return undefined;
empty selection on an existing object returns an empty object. Each call reads
fresh projection state with no cross-call cache.

A read-only document operation returns bounded selected/workspace object summaries
with canonical IDs, hierarchy and visibility/lock. Computed bounds, typography and styles require explicit fields; the default is identity metadata only.
Pages contain selection IDs or one parent's direct children in canonical order,
with offset and limit (default 50, maximum 200). Missing objects are reported by
ID; pagination advances across those slots. Invalid input fails before reading.
Text previews are limited to 2,000 characters and style lists to 8 entries, with
explicit truncation flags. No vector points are requested. Reads are fresh;
restart pagination after hierarchy changes. Parent children observation still
copies the existing child list once per page. Pagination explicitly reports truncation. The targeted edit action changes one current object; execute_design_batch expands a target set to ordered actions in one call: optional name,
parent-local x/y/width/height/rotation, native typography patch, or primary fill and
stroke color. It admits all fields first, checks the object's ancestor chain for
locks, and requires existing property support. Typography uses its native schema.
Geometry and styles go through existing common APIs. Successful receipts identify
the actual edited object for visual inspection. It does not create or replace
objects or perform a custom rollback. Ordinary updates use current IDs and
canonical property APIs; they must not replace unrelated objects. Organization uses existing native hierarchy owners. organize_design accepts group,
ungroup or reorder on complete unique ID sets. Reorder stays within one parent and
uses an index in the remaining sibling list. Group name is optional; ungroup takes
one official Group, validates its children and preserves them. Check selected
objects and ancestors for locks before writes. A request-local observation map
reads each touched node once; never cache across calls. Structural receipts are
reviewed directly without consuming screenshot correction attempts; explicit
visual inspection remains available for stacking changes. This action does not
provide arbitrary reparenting, deletion or reusable instances. Rename uses targeted
edit; alignment/spacing belongs to a separate layout operation. Destructive changes use
the existing confirmation policy. Unsupported reusable-instance operations are
explained rather than treating groups as instances. Read-only operations do not
trigger mutation review or consume visual-correction attempts.

## Review and termination

First resolve deterministic preparation findings. Then inspect real rendered
output after application and make bounded targeted corrections. Actual text
metrics, geometry and requested content are checked separately from subjective
style judgment. Report success only for achieved requirements; retain partial
work and explain concrete unmet requirements. Do not repeatedly retry an
unsupported capability or hide missing screenshot/font evidence behind success.

## Product cases and gates

Permanent tests cover varied desktop/mobile layout drafts, illustrations with
cubic and straight paths, bad/deep/oversized inputs, stable artifact reuse and
changed-input recomputation, ordered native creation, targeted edits and preserved
unrelated objects, organization, read-only advice, partial failure, one Undo,
save/reload and actual canvas screenshots. Provider protocol tests prove opaque
preparation/application handoff and research remains independent of image inputs.
The complete AI plan remains open until those flows and final CI pass.

## Arrangement

arrange_design aligns or distributes two or more current siblings on a horizontal or
vertical parent-local axis. Alignment uses start/center/end of the union of native
projected layout boxes. Distribution follows current spatial order: omit gap to
preserve outer extent with equal nonnegative spacing; provide gap to preserve the
first edge and use that spacing. Reject negative implied spacing. Resolve corners
through native projection into parent coordinates, including rotated targets;
never reconstruct vector paths. Validate all targets, ancestors and finite bounds
before a single plural canonical position update. Preserve orthogonal coordinates,
sizes, styles and stacking order; use existing preset group geometry projection
once when needed. One request-local raw observation per node, one geometry read
and four corner projections per target; no cross-call cache. Receipts identify
changed objects and parent for rendered review. Unchanged positions create no write.

## Deterministic current-design review

review_design observes the complete subtree beneath a current root, without screenshots
or writes. Traversal and native text measurement yield to the existing cooperative host
between chunks of 200 items and check the request abort signal. The chunk size is not
a total traversal limit. Native content measurement checks visible text against its
layout box with a 0.5 local-pixel tolerance. Positive overflow is a concrete finding.
Unrotated visible child layout boxes are compared with observed parent boxes;
rotated box checks are explicitly unavailable, not falsely accepted. Missing
nodes, nonfinite geometry, measurement failure and truncation make the review
incomplete. Hidden nodes are not text-fit targets. Use selected scalar fields,
never clone vector points. Results include counts, concrete bounds and findings,
not a subjective visual-quality score. Repeat after supported corrections; actual
rendered visual review remains necessary for style and brief compliance.

### Provider review scheduling

When review_design is registered, immediate mutations measure before image review;
planned intermediate mutations may defer measurement until stage inspection. Concrete text-overflow
findings return without an image so targeted corrections can happen cheaply.
Incomplete measurement blocks completed claims; they are not full
verification. Known unresolved text overflow prevents a completed outcome. There
is no request-total measurement or image-review count limit; Stop controls request
cancellation. Ordinary failures retain progress under existing transaction rules. Providers
without deterministic review retain their existing inspection route.

## Server typography protocol

Semantic text defaults and admission are App-owned protocol data. The preparation
server never imports Framework/Preset runtime modules. Browser admission validates
prepared properties against registered canonical schemas; permanent compatibility
tests compare protocol defaults and boundary values with canonical typography.

## Structured construction and requirement checks

Drafts may include a brief with intent, viewpoint, source notes and explicit
assumptions. These are AI-authored context, not independently verified facts.
Optional bounded checks name an existing semantic key and a layout property
(x/y/width/height), expected value and tolerance in final drawing pixels.
Preparation measures the compiled native layout boxes, returns expected/actual
values and passes/failures, and refuses application of artifacts with failed
checks or layout overflow. Brief/review metadata stays on the preparation receipt;
the canonical action receives the existing descriptor contract without that metadata.
Text measurement remains provisional until rendering. The optional layoutReview
receipt reports at most 64 positive-area intersections between sibling text boxes
and marks further results truncated. Touching edges, different parents and
non-text decoration are excluded. These are advisory box measurements, not glyph
collision detection or a prohibition of intentional overlapping typography. AI
resolves unintended overlaps before application; actual browser review remains
necessary. This metadata is also excluded from canonical action payloads.
Checks do not certify subjective aesthetics or reference fidelity. Missing context
never causes an invented source or an unsupported claim of exact reproduction.

Absolute-layout rect/oval/text/frame children may declare root-level relations
for x/y/width/height. Each relation computes target property = factor * source
property + offset. Sources are siblings or $parent in the target parent's local
space; source properties also include right/bottom/centerX/centerY. Parent edges
start at zero. Optional targetAnchor (0..1) on x/y subtracts the corresponding
fraction of target width/height for exact center/end alignment. Dependencies resolve irrespective of declaration order; cycles,
multiple writers, unknown references and nonfinite/out-of-budget results fail.
Relations never resize raw vectors, alter flow-controlled positions, or persist
as live constraints. Existing row/column/grid remains the owner for flow layout.

A draft may declare one shared orthographic camera (azimuth/elevation in degrees,
positive pixels-per-unit scale, screen origin). Explicit projected-face nodes
provide planar 3D vertex rings, names, keys and fills; the server projects each
vertex once and compiles ordinary editable straight-edge vectors. World Z is up.
All faces are root children with absolute layout and preserve caller painter order.
Degenerate/nonplanar faces, invalid cameras and excessive input fail before apply.
This does not infer 3D geometry from images, perform perspective reconstruction,
hidden-surface removal, lighting, or automatic occlusion sorting. The AI must
choose visible faces/order or a different supported representation.

The prompt requires structure/viewpoint before details, source versus estimated
measurements, explicit relations for regular geometry and meaningful requirement
checks where measurable. Post-apply inspection compares the same brief against
actual rendered output, with targeted correction and existing evidence validation. Passing deterministic checks alone is not a completed visual review.

## Repeated geometry and staged review

A root-level `pattern` construction node declares keyed planar `faces`, a 3D
`origin`, and one or two `axes` (positive integer count and 3D step). The backend
expands the Cartesian product in declared axis order, with the last axis varying
fastest; each instance emits its faces in declared painter order. Optional `fills`
cycles an explicit palette by instance; omission preserves each face fill. This
is deterministic author-specified geometry, not inferred shading or a 3D model.
All output remains ordinary editable vectors. Generated keys include the pattern
key, instance index and face key. Counts, vertices, finite coordinates, planarity,
projection and final bounds retain whole-artifact admission. The backend expands a complete compact stage once rather than requiring the model to manually split at 1,000 generated objects. Source and expanded budgets are distinct; exceeding either rejects the complete artifact without writes or detail reduction.
No clipping, hidden-surface removal, depth sorting, arbitrary code, noise or
fixture-specific facade generator is introduced. Existing native layout remains
preferred for 2D row/column/grid layouts. Only final visible parts are authored;
patterns are optional and must not regularize intentional irregularity.

Pattern faces are admitted once per pattern and projected once per template
vertex; each instance uses the camera's linear translation. Expansion never
modifies source input. Existing immutable prepared artifact resolution performs
no recompilation; changed parts are prepared separately and ordinary targeted
operations preserve unaffected canonical objects. This is not automatic whole-
document diffing or a claim that changed drafts avoid necessary validation.

Plans may name a subset `structureCriteria`. A `structure` review checks that
subset against current overview evidence and returns `readyForDetail`; it never
approves completion. Prompt policy requires this checkpoint before dense detail
for substantial constructed artwork, with viewpoint and layering corrected first.
When structure criteria were declared, repeated-detail preparation is rejected until a structure assessment passes. Later detail mutations invalidate final approval but do not erase that completed checkpoint; a subsequent failed structure assessment closes the gate again. This checks recorded evidence, not whether a model judgment is objectively correct.
Refining an existing child preserves the established whole-drawing review target; its mutation still invalidates all earlier inspection evidence. A child update receipt identifies the edited child, not a replacement overview target.
Full visual review still covers every original criterion and required native
detail evidence. The server retains the preceding visual assessment within the
request and reports pass-to-nonpass `regressions` with previous evidence; these
are model assessments, not an automated aesthetic oracle. Historical review
records never validate the current revision. Correct or discard a worse candidate
using ordinary authorized actions; retain prior artifacts until comparison, do
not automatically roll back or delete applied work.

Formal gates cover compact/explicit geometry equivalence, input immutability,
whole-output limits, template work counts, current artifact reuse, stale review
rejection, structure not approving completion, and reported criterion regression.
Browser construction/Undo tests and the same-prompt headless recording validate
the existing application route; quality and performance are reported separately.

### Stage execution and measurement

Prepared expanded stages keep one root, original keys, palette sequence, painter
order, layout and relations. The existing application owner automatically groups
contiguous entries by parent in slices of at most 32 elements or 2,048 points
(a single valid larger vector remains indivisible). It yields to the existing cooperative host between slices without requiring two animation frames,
checks cancellation and target availability, and uses one ordinary action/Undo
boundary. No extra model call is needed per slice. Browser admission validates
all entries before the first write. This reuses existing slicing, not a second
geometry compiler or transaction path.

For `inspection=defer`, the operation owner marks layout measurement pending as
well as invalidating visual evidence. An explicit stage inspection measures the
current overview target before capturing; further overview/detail captures reuse
that measurement until a mutation. Immediate operations still measure pending changes immediately.
Incomplete measurement, text overflow, or missing current visual evidence blocks
a completed outcome. Deferring never changes mutation receipts or Undo boundaries.

### Narrow receipts, affected checks and artifact lifetime

Combined preparation/application requests a compact receipt at the canonical action
source. It retains status, root ID, applied count and timing without constructing
ID arrays/role maps for transmission. Explicit full mode preserves the existing
maps. Runtime still refreshes the context used by permission decisions; this must
not be replaced with stale model context to save work.

Layout checks remain composition-wide after edits. A same-request tool history is
not proof that the canvas is unchanged: users and collaborators can also mutate it.
Do not reuse an affected-subtree baseline without authoritative document revision
and invalidation evidence. Incomplete checks and text overflow still block completion.
Visual evidence is independently invalidated after changes.

Repeated immutable template rings share measured bounds within one synchronous
preparation, after admission. Each instance still receives its own ordered canonical
identities and validates declared bounds; a new preparation starts a fresh lifetime.

release_design_artifacts releases explicitly discarded request-owned prepared designs
in one grouped call. Missing IDs are reported, malformed input changes no retention,
and retained artifacts remain usable. No canvas object, source attachment or Undo
history is removed. Reference/contour lineage remains owned by its existing image
pipeline; this operation does not guess that dependent image evidence is obsolete.

Native tool orchestration retains a compact working record of status, needed IDs,
artifact references, findings and the next decision. Inputs follow each tool schema;
raw geometry and complete receipts stay in code storage. Decisions occur at coherent
batch boundaries, with fresh evidence when dependencies change or are unknown.

### Request-owned targets and grouped operations

Prepared `keyToId` remains authoritative for original creation identities during
that request even when application returns compact receipts. `execute_design_batch`
accepts ordered registered operations and optional artifact targets (exact keys,
key prefix, or the entire prepared set). Unknown/released artifacts and unknown
keys reject before dispatch. References are not mutable Group membership or cached
properties: regrouping retains identity, deletion is validated by canonical actions,
and Undo/Redo follows the actual current document. No cross-request lookup is promised.

The backend validates all expanded arguments and submits one ordinary action batch.
It does not bypass action registration, permission, confirmation, cancellation,
transaction, or failure semantics. Measurement and inspection run once after the
batch (or at an explicit deferred stage boundary), not once per expanded edit.
Grouping and arrangement accept complete sibling sets without an artificial
200-object split; existing hierarchy, locks, and geometry validation remain.

`read_design_context` supports `scope: ids` with explicit elementIds. With no limit
it reads the known set in one request, without parent scans. `fields` selects computed
properties and defaults to an empty list: identities, names and hierarchy metadata
need no geometry/style computation. Missing IDs are explicit. Selection and children
retain pagination for discovery only; do not restart discovery to recover known IDs.


## Priority-based progressive work

The AI makes a cheap global estimate of parts, rough bounds and likely visibility,
then prioritizes user requirements, recognizable structure, visible area and uncertainty.
It applies coherent reusable structure before unrelated dense detail analysis, then
batches ready regions. Region boundaries do not require separate model round trips.
Intermediate LoD is a computation policy, not permission to reduce final quality,
source resolution or requested dimensions. Deliberately simple results remain valid.

Likely occluded detail may be deferred without exact geometric proof. The AI keeps
compact descriptions, reasons and restoration parameters instead of generating hidden
geometry. A small uncertainty margin may retain neighboring detail; no fixed multiplier
is prescribed. Useful partially covered shapes and requested hidden editable content
remain. This is model-directed prioritization, not an automatic visibility engine.

`pattern.instanceRanges` optionally selects sorted, nonoverlapping, nonempty zero-based
flat intervals `{start,end}` with exclusive end and last axis varying fastest. The
compiler visits only selected instances; keys, palette phase, translation and painter
order retain the original index. Source admission remains unchanged; expanded node and
point limits count selected output. Invalid ranges reject before geometry expansion.
Omit a whole pattern instead of sending an empty range list. Later restoration submits
only missing ranges through normal preparation/application and uses current artifact
IDs; local pattern keys are not cross-artifact canonical element IDs. No hidden full
instance array, visibility cache, clipping or geometry deletion is introduced.

`record_design_review` accepts incremental `deferredDetails` (id, description, reason)
in plan/structure/visual calls. Its existing request-owned review state retains those
parts across mutations. Final visual `deferredChecks` use current inspection IDs and
one disposition per retained ID: `omit` with visual evidence, `restored` after drawing
and checking, or `pending`. Missing/pending decisions block acceptance even when all
original criteria pass. Mutations invalidate these decisions, not the retained part
list; a successor request starts empty. The backend validates coverage and freshness,
not whether the AI's visibility judgment is objectively correct. Per-call additions
are compact; there is no cumulative deferred-part quota or new orchestration tool.

Formal tests cover selected/restored equivalence, original palette/index preservation,
work proportional to selected ranges rather than the full Cartesian product, invalid
range rejection, deferred-part retention, current-evidence settlement and request
isolation. Runtime mutation, permissions, cancellation and Undo remain unchanged.


## Preparation input repair

The published preparation schema declares native node requirements by type:
Frame and non-Group native nodes require positive width/height; Vector also requires
rings, Text requires text, and Group excludes size/fill/layout fields. Construction
faces retain their separate schema and derive native dimensions from the shared
projection. Names and keys remain required where declared; no fabricated names or
geometry are inserted to repair model input.

The preparation tool consumes the same published schema through the existing App
operation-input validator before compilation. Independent field errors are collected
with paths such as `arguments.draft.children[0].name`; diagnostics are bounded and
explicitly request another validation pass when truncated. This is input admission,
not a second geometry compiler or permission owner. Semantic geometry validation
remains authoritative and may reveal further errors after schema repair; a reported
list is not a promise that every other property or visual requirement passed.

Failures distinguish `recovery=correct_input` (repair the same draft) from
`recovery=review_structure` with `nextTool=record_design_review` (inspect the existing
structure and record current evidence before retrying retained detail). Missing shared
projection points to the camera and absolute-layout requirement. Nonplanar faces identify
the face key and vertices; repair/split the plane rather than search again. These
failures do not imply an unsuitable reference. Preparation still never modifies the
canvas, relaxes geometric tolerances, invents visual approval or discards valid artifacts.
Existing per-draft shared projection and request-owned artifacts remain the reuse owners.


### Type-directed repair and construction choice

Union admission selects a supplied type only when every alternative constrains that
same discriminator (const or enum) and exactly one alternative matches. Overlapping
oneOf alternatives and general branches still participate. A projected-face error
must not recommend native width/height/rings, or report unrelated node-type failures.
This changes diagnostics, not accepted geometry or required fields.

Both preparation tools expose the same executable minimal examples in their native
tool descriptions: a 2D vector surface with a gradient and numeric check, and a compact
repeated planar motif with a shared camera. Formal tests validate these through the
actual schema/compiler and verify provider registration carries them. Examples are
syntax guidance, never fallback artwork or per-request fixtures. Existing structure
review remains mandatory for patterned detail. Retained artifact/key resolution does
not recompile or scan the canvas.

A three-quarter view does not require spatial construction. The model chooses native
2D visible surfaces when appropriate and uses projection when spatial relationships
justify it. Repeated geometry uses existing pattern expansion; unique visible detail
and editability must be preserved. Refinements use existing IDs for supported property
edits. Vector path points are not supported by update_design_element; genuine path
replacement must explicitly retire superseded objects through ordinary approved
operations, preserve unrelated objects, and retain the existing Undo boundaries.
Intentional transparency/material overlays are not redundant covering copies.

Regression evidence reproduces the error classes observed during live preparation
(name, gradient opacity, numeric checks and vector fields); it does not claim to replay
unlogged raw user/model payloads. Deterministic preparation and identity-reuse tests do
not establish that a future model turn will choose the right strategy, run faster or
produce better artwork. Those outcomes require a separate live test.
