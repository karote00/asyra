# General editable design preparation

## Product contract

The assistant can create varied editable layouts and illustrations, revise chosen
objects, organize existing layers and answer read-only questions. It decides
subject, content and style from the request/context. The backend resolves declared
layout and canonical descriptors; it does not choose a design theme or substitute
another subject. This contract implements cases 1–3 and 11–15 of the AI design
agent plan and composes with its existing research/reference flow.

## Semantic preparation

A design draft has a name, root frame bounds and nested nodes. Supported nodes are
frame, rect, oval, text and vector. Each node has a unique request-local key and
meaningful name. Absolute children use parent-local positions. Row/column/grid
containers declare padding, gap and alignment; the backend computes positions
from child dimensions. Text stays literal editable content with explicit font,
size, weight, alignment, line height and color. Vector illustrations use bounded
closed `rings` of anchor coordinates with straight segments or paired explicit
`outControl`/`inControl` cubic controls, never raster
stand-ins. Repeated patterns are expanded native objects, not claimed reusable
component instances.

Admission rejects unknown fields, unsupported kinds, duplicate keys, nonfinite
numbers, invalid colors/font values, contradictory layout fields and excessive
input. Bounds: at most 1,000 nodes, nesting depth 12, 20,000 total anchors and controls,
100,000 total text characters, positive dimensions up to 100,000px. Limits apply
to the complete request, not separately to each child. No URL fetch or model call
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
is registered. The model supplies a semantic draft, receives a same-request
artifact ID and findings, and applies that ID without copying native descriptors
or point/property IDs. The same resolver serves dynamic operation calls and final
batch transport; model-authored raw `design` payloads are rejected. At most eight
preparation attempts, including invalid drafts, are allowed per request. Bad
preparation/reference inputs return actionable errors without canvas writes, so
meaningful corrections can continue within that budget. Unknown, cross-request
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
with canonical IDs, hierarchy, bounds, visibility/lock, typography and styles.
Pages contain selection IDs or one parent's direct children in canonical order,
with offset and limit (default 50, maximum 200). Missing objects are reported by
ID; pagination advances across those slots. Invalid input fails before reading.
Text previews are limited to 2,000 characters and style lists to 8 entries, with
explicit truncation flags. No vector points are requested. Reads are fresh;
restart pagination after hierarchy changes. Parent children observation still
copies the existing child list once per page. Pagination explicitly reports truncation. The targeted edit action changes one current object per call: optional name,
parent-local x/y/width/height/rotation, native typography patch, or primary fill and
stroke color. It admits all fields first, checks the object's ancestor chain for
locks, and requires existing property support. Typography uses its native schema.
Geometry and styles go through existing common APIs. Successful receipts identify
the actual edited object for visual inspection. It does not create or replace
objects or perform a custom rollback. Ordinary updates use current IDs and
canonical property APIs; they must not replace unrelated objects. Organization uses existing native hierarchy owners. organize_design accepts group,
ungroup or reorder on at most 200 unique IDs. Reorder stays within one parent and
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

arrange_design aligns or distributes 2..200 current siblings on a horizontal or
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

review_design observes at most 200 nodes beneath a current root, without screenshots
or writes. One native content-measurement batch checks visible text against its
layout box with a 0.5 local-pixel tolerance. Positive overflow is a concrete finding.
Unrotated visible child layout boxes are compared with observed parent boxes;
rotated box checks are explicitly unavailable, not falsely accepted. Missing
nodes, nonfinite geometry, measurement failure and truncation make the review
incomplete. Hidden nodes are not text-fit targets. Use selected scalar fields,
never clone vector points. Results include counts, concrete bounds and findings,
not a subjective visual-quality score. Repeat after supported corrections; actual
rendered visual review remains necessary for style and brief compliance.


### Provider review scheduling

When review_design is registered, automatically run it after each mutating receipt
with a current composition ID and before image review. Concrete text-overflow
findings return without an image so targeted corrections can happen cheaply.
Incomplete or other findings accompany visual inspection; they are not full
verification. Known unresolved text overflow prevents a completed outcome. Bound
this path to eight mutating review cycles and retain the existing six-image limit;
reads remain available. Preserve applied progress when limits are reached. Providers
without deterministic review retain their existing inspection route.

## Server typography protocol

Semantic text defaults and admission are App-owned protocol data. The preparation
server never imports Framework/Preset runtime modules. Browser admission validates
prepared properties against registered canonical schemas; permanent compatibility
tests compare protocol defaults and boundary values with canonical typography.
