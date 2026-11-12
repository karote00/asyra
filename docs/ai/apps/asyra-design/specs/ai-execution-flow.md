# AI design execution flow

## Direct native tool delivery

Tools expose vendor-independent JSON contracts and owner results. The local adapter
registers operation discovery and the single host entry eagerly when operations are available,
keeps domain declarations deferred, and delivers text and images directly through
the native tool-response channel. No generated JavaScript program, interpreter
storage or model-authored forwarding step participates. App-owned result handles,
bounded content continuations and explicit refresh remain the recovery authority;
recovering delivery must never replay a completed mutation or capture.

Normal startup selects direct tools and standard Responses delivery from the native
executable's public model metadata without changing global configuration or model
limits. Missing configuration fails explicitly before model use. Request-owned
configuration is released on every terminal path. Other providers consume the same
public owner contracts through their own adapters, without native-runtime dependence.

Formal offline tests must inspect the real successor request for full text, native
images, exact search routing, paging, failures and cancellation. A stored result is
not proof of model receipt. Generated templates use this same production path.

Registered App editing actions execute directly, including deletion and replacement,
with ordinary grouped Undo. The App prompt owns contextual permission questions
for external-tool use or security concerns through request_clarification; it does
not turn internal edit effects into confirmation requirements. Schema admission,
canonical locks and host/external security boundaries remain enforced.

### Native discovery bootstrap

When drawing operations are available, canonical `describe_design_apis` and
`execute_design` are directly available in the initial native registration. Other native domain
tools remain deferred. Initial metadata counts and bytes derive from actual
registration; unrelated catalog growth must not enlarge the bootstrap. No-operation
and assessment-only requests do not acquire drawing entries. Domain native calls
and host sequences retain their own contracts; direct availability does not authorize writes.

## Product contract

A single brief may request creation, refinement, reference tracing, organization
or advice. The agent chooses supported tools according to the user's requested
appearance, medium, dimensions and detail. Simple, rough and deliberately ugly
work are valid outcomes. Tool discovery must not remove available capabilities
or require the user to know their names. Missing evidence prompts further useful
research or an alternative supported method; it is not automatically failure.

This contract composes with [local provider](local-ai-provider.md),
[design preparation](design-preparation.md) and
[conversation experience](ai-conversation-experience.md). It does not add raster
insertion, image generation, new geometry semantics or a different provider.
The configured App model remains `gpt-6-astra` with `medium` effort.

Capture declaration preflight rejects conflicts before pixel dispatch with typed
correct_input/not-started recovery. The host registry declares canonical App
invocation failures alongside native recovery schemas so Runtime can preserve the
failed child and successful prefix. This internal contract does not duplicate
failure schemas in model-facing usage or authorize replay/automatic judgment.

### Tool schema support boundary

App tool registration and browser action observation reject unsupported or malformed
schema constraints before publishing executable definitions. The App validator owns
its explicit keyword vocabulary; `dependentRequired` is enforced when its trigger
is present, while unimplemented keywords are errors even in optional properties or
unselected alternatives. Schema annotations and literal examples/defaults are not
executable constraints. Local root references retain their original context.
Input and output validation use that same boundary; no invalid result becomes a
success binding and failed delivery never replays acknowledged work.
Registered invocation discovery also describes common invocation failures inside
`execution.value`. Common boundary failures are complete invocation alternatives:
the execution cannot claim success, and outer and nested failure settlement must
agree on unknown or not-started. Acknowledged completed/partial prefixes match the
selected owner's partial/recovery schemas. Native discovery and invocation use the
same owner contract projection, not a registry-augmented diagnostic alternative.
Successful owner data remains valid when saving fails; retry saving without replay.
Native replies without invocation-bound validation evidence revalidate unchanged
owner data alongside the explicit acknowledgement. Proof binds the producing call,
contract, bytes and outcome; foreign or changed replies cannot reuse it.
Validate the outcome before selecting its result schema or transferring request
resources. Invalid outcomes fail at the Host handoff; rejected resources release
once and cannot be acknowledged as usable. Unchanged identity/text/outcome-bound receipts
reuse completed validation. Success, partial and recovery alternatives discriminate
the outer status and correlate settlement across layers describing the same
execution. Independent child recovery entries retain their own settlements, and
storage failure does not change the completed execution settlement. Discovery and
invocation enforce these same alternatives; partial output cannot admit a failed
or unknown acknowledgement through a broader union branch.
Raw values validate against execution status. Successful execution with failed
storage still uses the owner's success schema. Model views validate against
`deliveryOutcome`, which can be partial even after successful execution. Outer
status, execution, delivery and storage describe their own boundaries;
same-execution settlement remains correlated. Transport success derives from the
validated acknowledgement, never an independently supplied boolean.

Accepted result roots include objects, arrays, scalars and null. Raw values pass
owner validation unchanged; Host acknowledgement is always separate from data.
Domain-owned receipt fields remain part of their declared data. Library and
sequence consumers carry explicit execution state; provider content delivers that
state alongside the value using supported native content fields. Missing or invalid
state is a handoff failure, never inferred success. Delivery failure preserves the
known execution settlement and never authorizes replay.
Provider content failures use the same canonical model-delivery failure contract,
with evidence validated by the invocation-pinned model schema. Native owner data
must not be reclassified as browser batch receipts merely because it contains an
`actionResults` field. Evaluation recognizes completed workflow prefixes from
canonical action receipts before allowing a later owner-declared input repair;
missing receipts, unknown settlement and independent delivery failures still stop.
Interrupted browser batches use the same owner result preparation as completed
batches before model projection. The outer acknowledgement describes aggregate
settlement, while the pending action retains its own not-started settlement.
Public failure projection preserves the validated completed prefix and recovery
without exposing internal batch diagnostics or replaying completed mutations.

Raw owner schemas are not rewritten to admit Host fields. Structural field
visibility is an explicit declaration. A semantic shape change
requires an owner-declared delivery contract; selection must preserve exact literal,
exclusive-alternative, negation and uniqueness semantics. Registration, discovery,
selected invocation and final projection retain the same owner and revision.
Registered/sequence child and recovery projections use their explicit revision,
never the latest same-name registration.
Validate the actual delivered value against its status-specific selected contract,
not a generic wrapper or a union of unrelated success/recovery alternatives.
Registered model receipts carry `deliveryOutcome` beside `execution`; saving,
execution and delivery remain independent. The Host pins the model contract before
effects and never accepts a replacement from invocation middleware. Generic failure
metadata belongs to the invocation owner; tool projectors only handle its embedded
result, with validated `executionOutcome` when known. Missing or invalid evidence
cannot establish completed execution. Child views already selected by their owner
are not selected again by the enclosing receipt projector; the complete model
receipt still passes exact status-specific validation.
Rejected input still passes canonical failure/acknowledgement validation without
opening a resource scope or executing the owner. Reconstructed delivery failures
also validate before egress; include only evidence admitted by their declared model
failure schema, preserving execution settlement when evidence cannot be delivered.
Partial model views cannot accept recovery-only payloads. Registered composition
recovery uses selected model child contracts after projection; internal recovery
keeps raw child contracts. No obsolete result-stage descriptor is published.

Native settlement decodes a reply once. Failure construction uses only decoded
evidence and never reparses failed bytes. Every opened call scope releases in
`finally`, including malformed output, validation, handoff and cancellation paths.
Undecodable post-execution output remains uncertain; it does not authorize replay.
Cleanup failures retain decoded evidence, and failed resource cleanup remains
retryable at request disposal under the existing lease owner.

An empty batch capability has a valid rejecting operation schema; it does not
publish an empty enumeration or prevent unrelated native tools from registering.
Contract audits compare exact success, partial, recovery and boundary alternatives,
including the canonical browser observation enrichment. Normalization preserves
reference intersections and literal data; extra alternatives are failures.

### Executable phase continuity

The AI plans the task; executable operations and stages carry decided dependencies.

Model egress preserves the common invocation-failure alternative registered at
Runtime, including failures nested in selected sequence recovery. Canonical
failure execution envelopes preserve image provenance; image data follows native
media delivery, never arbitrary user-payload scanning. Same-check metadata in one
capture batch must be identical, and conflicts identify both inspections before
capture. Successful prefixes are not replayed.

### Canonical input rejection

Canonical property resolution rejects unsupported keys before property application
with an owner-typed input diagnostic. The App adapter translates only recognized
input errors; Runtime reports that classification independently of write settlement.
The App publishes correct_input only for confirmed no-write rejection with fresh context. Unknown
settlement, broken owner relations and generic execution failures remain blocking.
Successful prefix receipts and IDs reach the AI without replay. Strict evaluation
keeps the same drawing turn active for correctable rejection. For terminal tool
failure it stops successor writes, delivers the settled outer recovery, then
interrupts drawing. Deadlines and explicit cancellation remain immediate.

### External result selection

`execute_design.delivery` is the sole explicit model-result selection. Retention
saves portable values independently; `delivery.fields` may select an earlier step
while later operations continue. `delivery:status` returns no selected values.
The superseded public `output` and `response` fields reject before execution;
Runtime recipe outputs and private canvas receipt formatting retain their own
internal contracts. Omitted delivery returns the final public result and its
images, including for stages and direct drawing. Retention only adds save receipts;
it never changes result selection. Explicit status suppresses work data/images;
explicit fields select only those values/images. Earlier images require explicit
selection. Anonymous ready batches retain their ordinary batch receipt. Selected failure receipts preserve completed work,
settlement and recovery without replay.

### Saved target navigation

Selected construction usage publishes the structure of owner-declared resultPaths
from the canonical named-step output schema. `createdTargets` is an ordered array
of composition identities and source-key maps, not one universal first entry.
Discovery does not copy a second mapping schema or fetch runtime values. Consumers
use JSON Pointer escaping and revalidate current document identity; shape reads
remain available when the necessary path is unknown.

### Reference result and image delivery

Reference acquisition returns one envelope with ordered `references` metadata
and `actionResults` media for either singular or plural inputs. Both are declared
before Runtime composition. Source-local failures retain their settlement and
recovery; completed imports are not replayed. Acquisition reuses request-owned
bytes without marking them as shown. Explicit result/media selection displays the
cached original; status and metadata selection do not. The superseded `refresh`
input rejects. Deduplication is limited to repeated pixels within one reply.
Image attachment indexes and pixels are request-owned, not portable conversation
capabilities. Preserve portable authored source input for later requests.

## Request and continuity

The existing request carries the brief, attachments, current bounded context,
registered capabilities and validated conversation target references. Canonical
state stays in the App. A new request never assumes prior inspection evidence is
current. Deleted targets, changed document identity and replacement invalidate
continuity references; no geometry or image cache crosses requests in this slice.

Conversation continuity follows the bounded public history contract in
[conversation experience](ai-conversation-experience.md). Metadata carries exact
prior user turns and public replies/questions with source-attachment indexes;
current intent stays separate. The backend validates this data before invoking a
provider. Historical outcomes do not authorize replay or reuse of request-owned
evidence. Fresh ephemeral provider threads receive the same admitted context.

## Capability discovery and composition

Discovery ranks owner-authored purpose separately from actual schema fields and
secondary identity words. `x-design-discovery` on an operation input schema owns
its purpose, optional vocabulary and applicability boundaries. Without that
annotation, the first authored description sentence declares purpose; synthetic
identity prefixes, subsequent guidance and cross-operation references are not
positive purpose evidence. Exact identity resolution remains unchanged.
Descriptive query `inputFields` optionally requires declared leaf names or slash-
separated paths. Open records do not prove arbitrary property support. Candidates
return purpose, boundaries, top-level input fields and requested matching paths;
this navigation is not an executable contract or value validation. Natural-language
queries remain supported, including custom tools with opaque names. Input enum/const choices and schema descriptions remain secondary search evidence;
examples and incidental schema prose do not establish purpose or field acceptance. Ordinary plural normalization never rewrites identities.

The coordinate owner declares workspace-to-local conversion as a point or null.
Request sequences can bind declared point fields to a typed position update,
checking actual presence before dispatch; a missing conversion never reaches the
mutation. Persisted recipes retain guaranteed-path admission. Discovery annotations
remain visible in catalogs and are removed only from execution admission schemas.

Shared instructions state App-wide intent, data authority and completion rules
once. Image-specific decomposition/conversion/refinement guidance is exposed with
the relevant discoverable tools, not unconditionally in every request. Required
input examples and product constraints remain available; concision does not
weaken quality, source resolution, canonical checks or actual final review.
The original user request remains authoritative. Do not add unrequested
content merely to present or decorate the result. For an isolated object, leave
the surrounding canvas transparent and omit Frame background paint unless the
request or necessary composition calls for it. Requested scenes/backgrounds and
existing unrelated content remain valid. Final visual review checks both missing
requested content and unsupported additions; optional polish cannot expand scope.
Organize complex requirements
in the existing initial plan using short, explicit statements; preserve quantities,
units, scope, relationships and original style terms. Separate implementation
choices and uncertain assumptions from requested requirements. A short request
can be used directly. No separate translation call or STE vocabulary compliance
is required. Later replies update the relevant requirement without dropping the
remaining original request.
Before research, reuse suitable attachments, current canvas context and verified
conversation facts. Research concrete information gaps, not every concrete subject
unconditionally. Batch independent gaps in native research; continue once evidence
supports the next retained structural part. Further research must answer a specific
remaining question, recorded briefly in existing progress/decision records without
private reasoning or per-call chatter. The initial plan contains immediate method,
constraints and acceptance criteria, not a complete geometry inventory. Ready
coherent retained parts may be emitted in a shared coordinate system; keep unresolved detail pending
without weakening the final acceptance contract.

Always-present App instructions explain Knowledge value before tool names: domain
principles, common failure modes and mappings to supported App capabilities can
reduce repeated derivation, exploration and correction attempts, including for
familiar tasks. Uncertain methods or adjustments that repeatedly miss their target
are useful occasions to consult relevant advice about a cause or supported tool.
Native namespace metadata exposes that purpose before deferred tool loading.
This adds no detail or polish requirement and introduces no lookup gate.
Domain knowledge is optional reference material, not a default method or an
additional acceptance standard. Global guidance does not prescribe representative
sampling, construction order or refinement sequence. Exact tool contracts and
truthful current-evidence completion remain required. Discovery describes the
unresolved decisions advice can help resolve. Direct material parameter reads
include domain and contract constraints without the optional sampling method;
repetition advice does not require a representative check for known materials.
Knowledge maps decisions to existing tool computation, not duplicate algorithms.

Always-present instructions assign visual intent, design parameters and final
appearance judgments to the primary agent. Supported deterministic projection,
repetition, transforms, material mapping and mechanical checks belong in existing
registered tools rather than model-expanded values. Prefer a sufficient direct
tool. When reusable orchestration would reduce manual work, the agent discovers
exact dependencies, submits a finite recipe and invokes it with fresh inputs.
Composition connects available primitives; it cannot invent capabilities or make
artistic decisions. Only registered mechanically decidable checks and repairs
qualify for bounded iteration. No recipe or tool-count target is required.
Successful execution attempts saving independently; inspect storage outcomes and
retry failed saving through save_tool without replaying drawing work. Existing
selected tool contracts retain exact authorship, admission and recovery authority.

When a new visual decision is needed, inspect the relevant current result. Reuse
unchanged observations and context, and repair the actual owner without replaying
acknowledged writes. A screenshot is not an approval token.

Material-correction advice pairs creation with explicit current-target edits.
Native palette-only replacement supplies complete per-target gradients, preserving
handles/type/positions and unrelated Fill fields. Shared property identity, not
color equality, determines affected owners; detach only for an intentional local
change. Constant-phase compilation loses source palette information: known world
source can be recompiled as an oracle, but native-only documents cannot recover it.
Do not claim compact preparation receipts expose a material-only update operation.
Unknown settlement, changed targets and unavailable source remain explicit recovery
conditions. Actual mutations drive scoped evidence invalidation; unrelated passes
remain usable before fresh final judgment and durable save.

The provider registers every available tool with its native protocol contract.
Construction discovery explains choices by supplied data: existing-object edits
use registered batch operations; ready 2D paths remain vectors; repeated 2D curves
may use vector-pattern; explicit world faces may use shared projection, with
pattern for translated repetitions; UI placement uses existing layout/relations.
No representation is required by a subject name or detail level. Guidance must
not invent depth or force orthographic projection on perspective artwork.
Executable examples demonstrate syntax rather than prescribing content or camera.
It may defer schema loading through native discovery while retaining exact tool
identities, schemas and the existing dispatch/permission route. A deferred tool
is available, not unsupported. Use registered workflow/recipe owners for dependent composition and retained
intermediate values; the App does not evaluate model-written code.
Research and simple edits remain available without a construction prerequisite.
Native sleep display notifications are lifecycle evidence only: they neither
execute App actions nor supply a final response. Validate their protocol fields;
unknown tool execution and diagnostic-assessment tool restrictions remain rejected.
Unsupported protocol must report a configuration failure before drawing rather
than silently dropping tools or switching the configured model/provider.

A registered tool rejecting recoverable preparation input remains available.
Its native reply reports unsuccessful execution, `PREPARATION_REJECTED`, the
input diagnostic and recoverability; it must not label the capability unavailable.
Unavailable external references remain distinguishable. The model can correct
the request in the same turn; the provider does not automatically replay it.
Preparation-owner exceptions and native result-delivery failures return an
unsuccessful tool reply with a bounded diagnostic. They do not abort sibling
tools or the provider turn. A delivery failure is not permission to repeat a
mutation: retain its execution outcome and inspect existing state before another
change. Explicit Stop, broken provider transport/protocol and unknown canonical
write settlement remain terminal. Native reference delivery accepts the same
original PNG/JPEG/WebP bytes and dimensions as reference import; canvas snapshot
limits remain specific to canvas inspection.

The existing discovery tool resolves exact semantic `owner.method` identities,
exact action names, or a category against the current admitted contracts. Empty
input returns categories and counts, not the entire API catalog. A category may
opt into `includeSchemas: true` to retrieve its admitted schemas in the same call;
the flag requires a category. The default category menu stays compact. Optional lexical
search returns compact action/native/saved capability menus and no match returns the category menu; it never
infers capability absence or picks a similar adapter. Selectors are mutually
exclusive. Each declaration carries purpose, category, input and result meaning.
Capability lookup does not search external subjects, images or source pages.
Research uses native web research, followed by reference import when needed.
Unknown subject terms never imply an unavailable drawing capability. Menus omit
input/output schemas; exact lookup retrieves them. Native/saved results preserve
namespace, registered identity and current execution route with shared pagination.
The batch-admitted action set owns both schema admission and advertised batch
routes. Explicit mechanical review/capture uses its registered request owner through
the host sequence or native invocation; it is never a raw canvas batch item. Missing or ambiguous wrapper registration
reports unavailable rather than guessing a namespace. Candidate, category,
query, exact, partial and repeated-definition views obey the same routing owner.
Use operation selectors for an action schema fragment, or a qualified native name
for its wrapper fragment; their field paths are intentionally different.
Lookup indexes live only for that admitted request registry. Known operations
may be retrieved together with `operations`; use this selector for known semantic
identities. Exact `names` also accepts uniquely resolving semantic identities
from that registry. Unknown entries preserve other matches; ambiguous native or
action identities return explicit candidates rather than choosing a route.
Plural lookup does not rescan the catalog or perform a canvas exchange.
Known operations
execute directly; discovery is not a mandatory extra step. Full App action definitions
carry an exact revision and return the requested content on repeated reads, with
bounded content delivery for oversized replies. Prior App output is not proof of
model receipt. `refresh: true` explicitly restores the selected current scope after
context loss or failed delivery. Request-local retention never deduplicates action
execution or substitutes for current registry validation.

Exact name/operation lookup also supports `view: "usage"` and `schemaPaths`
(JSON Pointers into the canonical input schema). Usage includes purpose,
execution route and nested property/schema-definition paths, with compact effect/composition/lifecycle
metadata. Exploratory usage and unselected owner operation scopes remain menus. Exact tools without an operation scope and selected scopes publish the
complete selected input contract as standard JSON Schema with owner result and
recovery guidance. Exact full lookup retains all validation schemas.
Fragment replies include exact selected values and transitive local reference dependencies; they are partial documentation,
not complete executable schemas. Unknown paths reject recoverably. Schema paths
require an exact selector; usage also supports category and query selectors.
Usage and schema paths cannot be combined; each selected scope remains independently readable. Explicit refresh preserves the selected usage or schema-path scope. A partial response offers a scoped recovery route;
full recovery remains a separate choice. Optional `refreshReason` records
context loss, delivery failure or missing fields, and requires refresh; an omitted
reason stays unknown. Definition receipts distinguish requested delivery and explicit recovery without asserting model retention; content revisions bind continuation to its source. Full lookup and explicit refresh remain
available for every contract. Replies describe current response coverage; a previous return cannot prove that the model retained context.

Native declaration conversion may remove only equivalent redundant constraints.
It preserves common union fields, closed-object boundaries, required fields,
contradictions and local references. Duplicate alternatives may be removed from
anyOf/allOf, never oneOf; admission remains owned by the original schema.

Model mutations use batch dispatch, including one-item operations. Redundant
scalar aliases have explicit surviving-operation dispositions. Single-object
composite edits are batch items; existing collection preparation/application
remains native. Public UI wrappers and distinct canonical/App normalization
capabilities remain available at their owners. Registered descriptions distinguish
computed projections from canonical values and linked property records. Known
IDs and new values do not require a preliminary whole-document read. Unknown
information needed by the requested operation still requires an appropriate read.

Visibility mutation receipts consume the existing App flag status: a changed target
returns complete, an already-matching target returns no-change, and an unavailable
target returns failed with not-started settlement. An unavailable target never
produces a successful successor binding. Perform this decision inside the existing
mutation boundary; no pre-read race or inferred boolean success.

### Tool-first delegation and mechanical closure

Known current tools execute directly. Ready parts do not wait for recipe authorship.
When a deterministic combination is missing, the primary agent acquires exact
registered dependency contracts and the canonical submit_tool schema, authors finite
work, corrects admission issues with a new submission identity, and invokes the
returned exact candidate with fresh inputs. Admission performs no drawing. Native
route/wrapper and recipe registeredName/revision are distinct contracts.

Native review_design publishes mechanicalSelection as current request data. A finite
mechanical recipe binds that selection to verify_design_checks and a supported
explicit policy to repair_design_checks. Its next state carries returned requestId/
checks, including passed and owner-retired obligations. Initial creation is outside
iteration. Verification metadata supplies status/progress paths. Unsupported findings,
partial/unknown settlement, no progress or exhaustion return a decision without
inventing repair or repeating acknowledged writes. Changed attachment basis requires
fresh evidence and an explicitly renewed policy.

Tool checks cannot grant primary visual acceptance or document durability. Capture
rendered images before primary judgments; retain independent passes. Optional library
storage failure uses the actual save-only receipt, not drawing replay. New requests
obtain fresh selection/evidence; library resume is availability, not an execution
cursor. Provider, discovery and result guidance agree on these routes. Existing artifact references
bind current values; Runtime owns admitted recurring iteration.

## Preparation and execution

### Component selection and bounded repetition

Before the first scoped query, existing owner selection explains two independent
choices: the contents of one component (faces/grids) and whether the complete
ordered component repeats by translation. Pattern members retain their face/grid
contracts; an explicit pattern-only query needs no separate child types. Selecting
compatible content types also includes their optional member-repetition wrapper. The existing
illustrative query example connects to the selected executable mixed example.
Examples are optional choices, never mandatory representation or inferred geometry.
Keep irregular, differently shaped or transformed exceptions explicit.

Selected usage reiterates that component compression does not reduce expanded
counts. Independent ready layers retain painter order; do not interleave previously
layered geometry merely to form mixed components. Use existing ordered parts and
explicit ranges for bounded known remaining instances. Never replay acknowledged
parts. No eager schemas, additional selection call or implicit execution of recovery partitions.

DoD: verify the actual first provider request, execute the published query and its
returned example, and compare saved explicit face/grid blocks with compact output.
Prove all numeric geometry/material fields and order, actual byte reduction,
unchanged overflow/no-write, partial outcomes, cancellation and remaining-only
recovery. Unrelated catalog growth and independent legal choices remain unaffected.

### Optional repetition in selected contents

A draft or parts query selecting world-space faces or grids delivers their optional
translation wrapper in the same usage/full projection. The existing main-owner scope
declaration identifies its canonical repeating node and member field; supported
member kinds and restrictions derive from that node, not a second type registry.
For implicit repetition retain only selected compatible members and the canonical
members alternative. Do not load faces-mode palettes or unrelated member contracts.
Explicit pattern queries retain the full faces/members contract. Repair and unrelated
primitive scopes do not acquire repetition merely because it exists.

Initial selection explains that one component plus count/step is a loop; the backend
expands it. A selected guide carries a valid existing combined example when available.
Do not force repetition, infer geometry, interleave painter layers or require another
lookup. Keep all origin/axis/range/member limits and cross-field constraints. The
ordinary canonical invocation validator remains authoritative. Scope refresh restores
the same projection, never replays writes; full unscoped and field queries remain valid.

DoD: the recorded face/grid query receives an executable root-material, independent-
sibling and pattern example in one response. Validate and dispatch that returned input;
prove explicit single nodes, pattern-only faces mode and optional-plan behavior remain
legal. Single-kind queries exclude other member kinds. Invalid owner declarations or
nested members reject rather than silently widening the scope. Startup reading does
not grow; total content-plus-repetition acquisition is smaller than two separate
queries, and unrelated catalog growth does not change bytes/calls. Preserve partial,
invalid, cancelled, stale and remaining-only recovery through existing formal cases.
This delivery guarantee does not certify model choice or time to first frame.

### Composition examples within selected usage

For the selected face/grid content scope (with optional explicit pattern), existing first-valid owner example
filtering delivers a complete combination: root
material definitions, separate sibling layer patterns and independent nodes between
them. Mixed-component ordering remains available through its own valid example.
Pattern-only selections retain a valid pattern-only example. Examples remain
illustrative; independent geometry and face-only patterns remain legal.

Use the existing query, schema admission and dispatcher. Do not preload this
example into startup guidance, add a lookup or increase delivery limits. Replace
redundant selected-only explanatory prose if necessary; preserve all parameter
restrictions, optional-plan semantics, results and no-replay recovery. The same
mixed selected scope must remain one reply with no greater reading volume.

DoD: execute the actual returned example, compare recorded explicit and compact
geometry/materials/order, preserve independent siblings and truthful partial
outcomes, and recover only uncompleted work after overflow/cancellation/refresh.
Initial reading and unrelated-catalog growth must not increase. Deterministic
proof establishes contract execution, not model adoption or visual quality.

### Projected ovals

Analytic oval bounds are owned by the existing Utils geometry module and consumed
by Preset Group normalization and Core scene world bounds, including zoom-fit.
Canonical creation, review and viewport consumers must agree on rotated extents;
no direct render lookup or replacement viewport state is allowed. The backend
Group-bounds entry consumes the public Utils geometry-bounds subpath, retaining
only pure geometry modules; it must not load the Utils barrel, lodash, framework
runtime, DOM or registration. Both paths use the same analytic calculation.

A projected-face or pattern face chooses vertices (an explicit polygon) or
ellipse:{center,u,v} (a planar ellipse), exclusively. The nonzero independent
world radius vectors encode size and direction, including conjugate axes. No
segments field, sampling knob, polygon or cubic approximation defines an ellipse.
The existing orthographic camera maps a nondegenerate ellipse to the existing
oval component. Construction computes its local dimensions, origin and rotation;
only official prepared admission, dispatcher and Core creation perform writes.
Tools never access render APIs. Renderer implementation stays owned by the preset.

The same public geometry owner supplies transformed oval bounds to preparation,
Group normalization and App checks. Keep native geometry and placement distinct:
normalization translates child origins without changing their rotations. Frame
checks use transformed extents; unsupported transformed containers stay explicit
failures/unverified cases, never silently certified. World material fields are
converted to oval-local paint coordinates and keep their phase under pattern
translation and material revision. Native inline/template fills remain valid.

Pattern templates compile once, with ordered translated oval instances and stable
identities/references. Native ovals cost ordinary nodes, not fabricated sampled
path commands; all node/depth/extent limits still apply. Reject invalid/nonfinite,
dependent or edge-on inputs before writing. Explicit vertices and independent
native/vector operations remain valid. Do not migrate historical documents.

Retained continuation records the original anchor rotation. Admission and mutation
compare it to canonical placement and reject changed rotations, scale/skew,
hierarchy or binding. Original rotation plus valid Group translation is allowed;
partial results persist and completed writes are never replayed. Material validity
uses canonical geometry, not viewport round trips. Save/load, Undo/Redo and
collaboration use existing owners and stores.

Selected guidance and executable examples deliver the contract in one acquisition.
Verify projected analytic geometry, transformed bounds, materials, renderer/hit
handoff, budget/work counts, invalid inputs and real Core interrupted recovery.
Total selected-guide-plus-input delivery must not increase. No claim about model
adoption, first-frame timing or visual judgment follows from local tests alone.

### Translated mixed components

The existing pattern supports either faces or ordered members, never both.
Members are explicit projected-face or surface-grid values under the root's shared
orthographic projection. They repeat through the existing origin, translation axes
and instanceRanges. No nested patterns/containers, scale, rotation or inferred
geometry. Pattern fills is exclusive to faces mode; member fills, grid palette/offset
and face/motif materialField retain their existing semantics. Grid palette restarts per
component instance; world fields evaluate at translated world positions. Grid
material planes are solved once per boundary/field, with each emitted vector
normalized to its own bounds and actual motif/instance world offset. Template
paint-mode overrides replace inherited alternatives; conflicting explicit modes
reject. Material provenance includes grid outputs for existing material revision.

Output is ordinary editable siblings in instance-major/member-major order, then the
grid's declared cell/motif order. Keys prefix each member output with pattern key
and original flat instance index; grid cell/motif suffixes remain. Parent relationships,
root normalization and artifact identity remain preparation-owned. No container or
relationship is silently inserted. Translate geometry exactly within the existing
numeric tolerance, preserve fills and source input, and validate complete extent.

The structural budget counts selected instances times all expanded member objects
and paths, plus ordinary/root nodes; source templates are counted once. Reject
unsupported or oversized input before writes. Compile member templates once within
one preparation; reuse their output for translations without cross-request state.
Existing faces, independent grids and no-replay partial recovery remain legal.
Discovery delivers member constraints and an executable owner example in the same
selected-contract route; no new preflight or tool. Formal equivalence compares full
geometry, materials, painter order, identities/parents, limits and cancellation,
including the saved repeated-component input and reduced submitted bytes.

### Source-referenced expansion recovery

The preparation budget owner supplies aggregate and component costs before geometry
compilation. For the main workflow, an oversized eligible flat projected group produces a
successful internal preparation plan with immutable retained source references,
not a failed operation or a compiled artifact. Standalone prepare_design retains
its single-artifact contract: success always supplies artifactId; excess remains a
no-write refusal with retained diagnostics. Existing recipes may bind artifactId
without a new branch. Preparation writes nothing. The main tool consumes this plan through the
existing ordered parts executor in the same invocation, starting the first part and
continuing subsequent parts without a model round trip. Repair selects an owner-computed partition, exclusive with field
replacements; it never asks the model to recalculate counts or resend source geometry.
Complete pattern instance ranges and independent siblings retain source order.
Budget calculation measures each source component once and reuses additive costs;
metadata is limited to 128 parts and charged to the existing retained-byte capacity.
An unsupported or larger plan remains a no-write failure with ordinary explicit repair.

A valid descriptive root brief with empty checks is preserved unchanged in every
selected source and prepared review; it does not disable safe capacity continuation.
Nonempty numeric brief checks refer to final parent-local layout and cannot be
silently evaluated on partial bounds. Until those whole-design semantics are
supported across partitions, automatic partitioning returns an explicit no-write
limitation with the original source and checks retained. Invalid brief fields are
also explicit input limitations. Single-artifact brief checks keep their existing
validation and evaluation. Retained refusal diagnostics distinguish unsupported
partition semantics from measured capacity excess; they never suggest dropping
checks to bypass admission.

Recovery supports independent fill templates and world linear fields. Unsupported
layout, relations, nested containers, shared-fill bindings, overlapping source key
families and indivisible excess remain explicit no-write failures. Automatic recovery
requires disjoint generated prefixes; it never renames keys or makes a duplicate key
valid by separating it into another artifact. No limit increase, mandatory preflight, automatic
geometry simplification or additional tool registry is permitted.

The first partition creates the original group; later partitions continue that same
root through its retained preparation evidence. Application validates current root,
anchor and ancestry, rebases against canonical Group normalization, and uses existing
creation transactions. Preserve world geometry, native fills, generated keys, painter
order and the original single-root parent graph. Never insert extra group wrappers.
Expired/moved/deleted/locked or ambiguous bindings reject without replay.

Parts returns ordered receipts and only offers a ready remaining invocation for
confirmed unstarted work. Completed writes are never automatically retried, and a
partial or unconfirmed application requires state inspection. Ordinary independent
parts and field repairs retain their contracts. The selected usage explains automatic safe-capacity continuation and executing
remaining-only recovery after a genuine interruption without another discovery
round trip. Explicit parts retain parent links and ordering when a safe source is
partitioned inside the sequence. Internal plan success certifies only retained source;
workflow completion requires every actual application receipt. Child progress must
not report a capacity failure for a successfully retained plan.

DoD: execute fixed over-budget source in one public main-tool invocation, then
actual remaining recovery after injected failure through dispatcher and canonical
owners; prove counts/boundaries, source retention/expiry, same-parent geometry/fill/
order equivalence, cancellation, no duplicate writes and truthful partial recovery.
Verify affected canonical Group normalization, Undo/Redo and saved-state replay.
The 10,000-object bound is per compiled artifact for resource containment, not a
complete-document limit or an established performance threshold.

### Expansion budget selection

Existing main-tool startup and discovery guidance distinguishes one ready draft
from ordered parts using the canonical per-artifact limits before submission.
Selected repetition contracts state aggregate counts: a surface grid contributes
rows * columns * motif count; a pattern contributes selected instances * faces;
a vector pattern contributes placements. Add ordinary nodes and every root/nested
container. Template compression reduces source input, not expanded output.
Internal work windows do not increase artifact capacity. Limits come from the
preparation owner, not duplicated discovery constants. Path/depth guards still apply.
For independent ready artifacts that exceed one artifact together, select existing
parts in the same lookup; each part must fit independently. Do not add a mandatory
preflight exchange, preload every operation schema, or automatically split geometry,
layout, painter order, keys or relationships. Valid direct draft calls remain legal.
Safely partitionable excess uses retained-source continuation in the main tool.
Genuine budget rejection keeps observed/allowed values, no-write settlement and
retained draft recovery without replaying completed writes. Actual delivered examples must reach the dispatcher and preparation owner;
formal cases cover the recorded excess, exact boundary, partial success and cancel.

The combined preparation/application workflow also accepts ordered ready `parts`.
Each part has a unique local key and an ordinary draft or repair. `parentPart`
links to an earlier successful part's actual composition ID; it is never a
canonical ID and never implies an outer root. Explicit existing `parentId` remains
available. Sequence shape and backward references are admitted before writes.
The workflow prepares and applies one part before preparing the next, using the
same preparation and current canonical admission owners. A failure stops later
parts and returns ordered receipts for successful parts plus the failed part;
completed and uncertain writes are never automatically replayed. Execution
receipts belong to their actual invocation and causal descendants, not all earlier
work in the request. Each internal workflow step uses its own invocation identity;
acknowledged effects contribute to its coordinator but never to a sibling. A
preparation rejection preserves its geometry explanation and retained repair draft
and reports no canvas dispatch; an earlier successful part does not change that
child into a partial mutation or replace its error with a result-schema failure.
Parent settlement still accounts for every completed or uncertain child. Diagnostic
draft retention is distinct from a document write. Unknown effects remain unknown. Cancellation
retains existing terminal semantics and recorded acknowledged work. Nested owner
observations identify part order and preparation/application boundaries. Patterns,
shared fills and projection stay at their existing preparation owner. Submit
ready parts only; an entire design is not a prerequisite for this route.

Prepared target selectors use exact immutable artifact identities. Repeated prefix
queries reuse an artifact-owned key index and preserve source order; releasing
an artifact releases its lookup state. A prefix miss remains a recoverable error,
not permission to select the entire artifact. Exact keys require no full-key walk.
retain_design_targets accepts a batch of exact-key or prefix selections and stores
immutable ordered identity subsets under artifactId/targetSetId. Subsequent batch
targets send that pair rather than expanded keys. Admission budgets the complete
retention request before storing any subset; exhausted capacity cannot evict live
references. Releasing an artifact also releases its target sets. These identities
remain creation members, not live Group children; current canonical admission
continues to check existence and locks.

Local corrections may query a workspace region, then filter candidate identities
by current type, hierarchy and flags before using registered batch mutations.
A localized defect is queried by its workspace bounds even when its parent spans
many other regions. The query must not enumerate that parent's children first.
An explicit identity-only result returns ordered IDs without element summaries
or property values; the default metadata result remains available. Filters apply
before pagination, and page limits and continuation are explicit. Those IDs feed
the ordinary registered batch operation; its current admission still owns locks
and existence. Spatial bounds are a conservative candidate test, not a pixel hit
or an occlusion decision. Query state follows object changes, parent transforms, deletion, replay
and load; viewport navigation does not change workspace region membership.
Missing projection or stale identity must be explicit, never an empty success.
A batch operation may supply an explicit region query as its target. Its fields
are derived from the unique region-capable alternative in the registered context
contract, including shared constraints; snapshot alternatives are not region
queries. Ambiguous or absent alternatives expose no guessed target route. The backend
requests all matching IDs once from the registered context reader and feeds them
directly to the registered plural argument. It does not expose intermediate
metadata or require model-written callbacks. Queries resolve an identity snapshot
before batch writes; ordinary admission still checks the current targets. An
unavailable, incomplete or malformed query rejects before writes. Empty matches
are explicit and never expand to the workspace. Full-match reads are permitted
only for identity-only region queries without pagination or property fields.

Relative hierarchy placement resolves a live before/after anchor inside the
existing hierarchy owner without sending all sibling IDs to the model.

Retained batch targets supply their registered argument slots. Callers omit those
slots from arguments, including empty arrays, null and placeholder values. Validate
all binding shapes, exact paths and argument conflicts for an operation before
resolving its retained sources; report independent binding issues with operation,
target and argument locations together. Never overwrite an explicit caller value.
Each binding declares its actual input slot and cardinality. A plural elementIds
selection and a scalar anchor may resolve independently in the same operation. Target paths
cannot invent a new registered slot or broaden the supported binding grammar.

Prepared-check reuse depends on actual parent/workspace identity, basis, bounds,
document session, recipe and compiler findings. Fresh capture
receipt IDs, global observation revisions and transport profiling are not semantic
content. The operation adapter projects the canonical attachment domain value;
each renewed receipt is still validated and retained for apply admission. Changed
content/session or failed currency cannot inherit a pass.

Preparation rejection reports the invalid source location. Duplicate semantic
keys identify both conflicting locations. An explicit request-local draft repair
may submit only replacement fields; the same preparation validation and budgets
apply before an immutable artifact is created. Rejected drafts are not executable
artifacts. Missing or stale repair references reject recoverably. Repair never
replays an uncertain write or changes a successfully prepared artifact.

Plural deletion accepts current element IDs, including container descendants,
through one canonical preparation/application. Duplicate, missing or Workspace
targets reject before writes; selecting an ancestor and descendant removes the
subtree once. Hierarchy validation, retained-property inventory and orphan graph
preparation are shared for that call. Scene/Props retain their ordinary deleted
instances and reversible evidence; shared properties with surviving owners stay
active. One-item calls have the same lifecycle.

Plural creation supports the same valid target parents as scalar creation and
returns results in input order. Consecutive compatible items may share an owner
call; grouping must not reorder intervening objects or split the intended Undo.

Stroke field edits receive only requested new fields and stable target IDs.
The App validates targets and preserves all omitted fields through canonical
record patches. A batch validates all targets before writing, preserves item
order, and reuses bounds preparation only within that synchronous call for an
unchanged owner. UI and AI use the same operation. The caller does not provide a
current Stroke snapshot; canonical setters own before/after and Undo data.

Batch visibility receipts retain statuses aligned with submitted element IDs.
Malformed or misaligned statuses fail instead of inventing success. Canonical
mutationScope identifies actual affected owners, including shared properties;
unchanged and unavailable input rows are not evidence of a mutation. Scope alone
does not prove visual acceptance.

Registered return contracts preserve actual owner values. Ordered creation
receipts distinguish successful IDs, failed entries, partial outcomes and empty
input. Structural receipts identify changes; reads are observations only. Declared compact
views preserve counts and typed retained evidence without copying original snapshots
into model output. Internal results remain complete even for partial execution;
registered model delivery applies at the final external boundary. Diagnostic details
remain recoverable, and compacting never alters history evidence. Void
acknowledgements and ambiguous false/null results must not certify a document
change or a valid unchanged target. Failed receipts propagate to conversation
settlement; mixed successful writes and failure are partial. Compact replies preserve unconfirmed valueless receipts instead of aggregating
them into successful acknowledgements; identities, reads and failure evidence remain.

Element selection validates all requested IDs at the common element-selection
owner inside the synchronous mutation boundary. A nonexistent ID, including a
mixed valid/invalid request, rejects the whole replacement without changing prior
selection or adding an Undo entry. `select_elements` reports its accepted selection
count only after successful canonical replacement; the basic selection/toggle
routes use the same existence contract. Explicit clearing and generic Core/vector
selection channels retain their own contracts. A corrected call and its Undo/Redo
must remain usable after rejection.

Exact schema-fragment lookup resolves each requested tool independently. An unresolved
path returns that registered identity/revision, failed paths and real root/field paths;
it neither rewrites the pointer nor consumes definition-delivery state. Successful
siblings retain ordinary response/reuse tracking. Request-shape errors still reject
before lookup. This is a discovery result, not permission to execute partial schemas.

Registered owner-produced delivery views separate complete internal results from
model output. Exact registered paths and schemas govern projection; no field-name
heuristics or tool-name exception list may discard execution data. Internal
mutation checks, resource transfer and recipe bindings consume complete typed
values before model projection. Explicit full response cannot bypass a declared
bounded view. Immutable historical receipts remain available through bounded
readback; missing delivery cannot authorize a dependent operation or replay.

Every native, registered and batch model exit selects its declared result fields,
including successful, partial and failed outcomes. Undeclared owner extensions
and host-only observations are not model data. Diagnostic counters and context
refresh snapshots remain available to internal consumers and recordings. Explicit
domain maps and requested values retain their keys and restrictions. Small and
field-selected reads remain direct; bounded references do not create a mandatory
extra read. Preserve necessary findings, stale evidence, acknowledged targets and
actionable recovery, including automatic-check failures. Projection cannot change
execution settlement, mutate canonical receipts, rerun an owner or replay writes.
Model delivery failure preserves the acknowledged semantic owner result under
existing executionResult when its declaration can validate that evidence, plus
explicit delivery failure and no-replay guidance. Child delivery failures must
make the enclosing model acknowledgement incomplete without changing canonical
execution settlement. Owner partial/failed evidence without a successful delivery
view remains described by the acquired partial contract. Reusable and recovery
results use their exact invoked revisions, not the latest same-name declaration.
Cost comparisons require equally complete decision and recovery information.
Existing bounded pagination may carry necessary contracts; historical one-page
counts are not a reason to omit restrictions. Missing information must not cause
additional discovery, and pure diagnostics must not inflate model delivery.
Published model result schemas describe these same views, not the complete host
envelope. Measure acquisition plus results and recovery, not isolated payloads.

Structural direct delivery retains group/ungroup child identities and acknowledged
move identities in the existing request-owned context store. The immutable full
receipt is stored with that membership at synchronous mutation settlement, after canonical publication and before yielding. A later document change invalidates the reference instead of recertifying old output. Compact output returns `retained` with
`snapshotId`, `leaseId` and `total`, plus outcome/count/root identity; no expanded
structural or mutation-scope lists enter the model reply. Internal checking and
history consume the unchanged receipt first. A deletion has no live target set.
Canonical mutation-receipt actions use the same retained delivery owner. Their
model result contains status, changed, settlement, accepted/unavailable counts,
small mutation-scope counts and the retained receipt reference. Full canonical
IDs remain available to bindings, checking, recordings and paged receipt readback.
Partial, failed, no-change and invalid owner results preserve their original
meaning. Failure to retain a settled receipt is explicit and never replays writes.
Only declared element-list arguments accept these references; point/segment IDs
remain ordinary explicit arrays. Resolve all references and validate their exact
request, lease, workspace and revision inside synchronous mutation admission.
Stale/released references reject before writes; no automatic reselection or replay.
Retained-fill actions preserve transaction-settlement errors and their original
admission causes unchanged; action wrapping must not discard known settlement.
`read_design_context` with `scope=snapshot, delivery=receipt` retrieves immutable
historical evidence and explicitly reports whether its targets are current. It
cannot refresh stale target authority. Normal page/reference reads still require
current data. Capacity/cancellation/publication failure after acknowledged writes
preserves the receipt with an unavailable delivery diagnostic; successors cannot
consume a missing handle. Failed execution without a declared view retains its original
bounded failure envelope. Partial execution with retained evidence uses its declared
view without losing settlement; projection failure is explicitly partial delivery.
Large immutable receipts use bounded `receiptPage` JSON text, UTF-16 code-unit offsets,
`total` text length and `nextOffset`; concatenating text reconstructs exact JSON.
Serialization occurs once at retention, never once per page or from live rows.

Preparation consumes validated parameters or existing immutable handles and
returns prepared handles, concise findings and semantic target references.
Existing owner APIs compute layout, projection and repetition. Downstream tools
consume those results rather than reconstructing their meaning. Original image
resolution and canonical dimensions remain unchanged. Overview previews are
separate, explicitly identified review artifacts. Preparation advertises
per-window source work and per-artifact expansion/depth budgets from the shared
constants. Source windows are automatic and do not alter global layout or
identity. Rejections identify expanded/depth excess or oversized indivisible
primitives, retaining requested detail when suggesting reusable templates or
separate artifacts.

Execution admits each complete batch before writes and uses existing registered
Feature/common-API transactions. One request owns one Framework history group;
each synchronous mutation slice closes and publishes normally. Provider work,
preparation, inspection and user discussion do not hold a physical transaction
or a document-wide interaction lock. Host-owned admission waits for an unrelated
active interaction to settle; it never enrolls user or remote edits. Stop or
failure seals successful members as one Undo entry; only the failed member rolls
back. Empty requests create no history. Outcomes reflect actual settlement,
including partial members of an action that did not return a result.

Meaningful stages appear as soon as ready;
there is no requirement to finish all detail before the first stage. Likely
hidden details may be deferred by the model and reconsidered during overall
review; the backend does not automatically delete, simplify or cull artwork.
Guidance checks returned identities/failures after each operation and visual
appearance at coherent stage boundaries, earlier only when the next decision
requires an image. Uncertain repeated motifs can be validated before expansion;
already validated motifs need no additional per-instance checkpoint. Requested
detail and final overall review remain unchanged.

Only work with proven independent access may overlap. Reads of mutable artifacts,
canonical writes, read-after-write dependencies and unknown effects retain safe
ordering. Cancellation prevents queued writes and late result delivery. Never
retry a started mutation without an authoritative outcome. Completed work and
its intended Undo commits survive later recoverable failure.

Native prepared application defaults to the existing compact receipt; its full
identity map remains available through explicit full response and the prepared
artifact target resolver. Compound operations retain each action identity and its explicit owner outcome.
Compact delivery summarizes large mutation scopes only after canonical receipt
consumption; it never replaces them with aggregate inferred success. Reads,
returned IDs, findings and uncertain outcomes retain their recovery evidence.
Explicit full response retains every acknowledgement. Canonical
receipt consumption and review scope happen before this transport projection.

Tool owners declare request-local execution access alongside their definitions.
Independent access means no modification of existing shared inputs: immutable
image analysis, new immutable design preparation and registered API description
may share admission. Their existing CPU queues and validation still apply.
Canvas queries can update context or review state and therefore remain exclusive,
as do artifact release, import, mutation and combined prepare/apply operations.
Unknown or missing access is exclusive. The provider consumes this declaration;
it does not maintain a list of parallel tool names. Internal access metadata is
not exposed as a native tool schema field. A request owns one barrier queue and
disposes it on Stop or settlement; no cross-request scheduling state is retained.

### Creation batch UI projection

Each canonical creation batch reaches the existing Preset UI projection once,
with complete ordered IDs and immutable rows. Continuous depth-first tail
additions reuse valid hierarchy preparation instead of rederiving unrelated
subtrees. Preserve immediate partial results, selection/layer consumers,
cancellation, history and durable collaboration. Do not enlarge batches, defer
publication or replay writes. Cold, interior and invalidated structural changes
retain complete derivation. Tests must count hierarchy work separately from
necessary immutable copying and compare every intermediate snapshot. The
[Preset contract](../../../framework/packages/preset.md) owns projection reuse.

### Metadata child-count handoff

Inspection ancestry reads consume scalar Core metadata. Core obtains childCount
from the existing canonical Scene Tree membership owner, without materializing
children merely to count them. Preserve registered container capabilities,
missing targets, complete child queries and immutable published snapshots.
No extra model/dispatcher call, observer suppression, cache or membership mirror
is permitted. Existing inspection dependencies remain authoritative for local,
ancestor and subtree invalidation, document reload and disposal.

Formal tests must count actual child-snapshot copies with real canonical owners
and the live App inspection observer during ordinary batched creation. Verify
lower work with identical metadata, complete ordered output, mutation/history/load
updates, local-result preservation, cancellation and remaining-only recovery.
Timing is diagnostic; fewer copies alone do not establish first-frame latency.

### Prepared design delivery

The existing resolver delivers owned prepared designs with property names instead
of repeated property-ID values and without a duplicate key-to-ID map. Vector
point, segment and network record IDs are omitted only after checking equality
with their map keys; all graph references remain explicit and unchanged. The
current wire shape forbids redundant record id fields. Browser admission restores
those IDs from exact keys and property maps from the supplied names and IDs,
then runs the existing complete canonical validation before any write. Compact
delivery version 3 is required; previous wire versions are rejected.
Retained canonical artifacts and independent conversion formats are unchanged.

Reconstruction cannot infer missing properties, repair malformed references, alter
IDs, recompute geometry or share independent materials. Preserve complete geometry,
material bindings, order, hierarchy, continuation evidence and budget protections.
Explicit full receipts retain key/role mappings. Cancellation and partial recovery
keep actual acknowledged results and never replay completed edits. Projection adds
no model query or round trip and owns no cache. Formal tests must exercise the real
resolver through browser admission and Core, prove saved-case payload reduction of
at least 15% against the original full-map baseline and at least 14% for each of
the three fixed vector inputs against v2, unchanged canonical output/compilation
and dispatch counts, explicit pack/restore costs, and affected history,
collaboration and save/reload behavior. Timing measurements supplement deterministic
work evidence; reduced bytes alone do not prove a first-frame latency improvement.

Selected-owner Fill edits apply local overrides. Explicit shared-source edits,
override reset and detachment are distinct intents. Delivered App advice must use
these canonical operations and never require detachment for a local correction.
Portable Knowledge remains advisory and contains no App operation identifiers.

## Main-workflow observations

The workflow prepares and applies admitted parts through their canonical owners.
When requested, it captures the acknowledged target and returns actual images,
identity and write receipts. Deferred capture performs no follow-up reads.
The same call can bind created IDs to a decided edit or capture. Unknown writes
stop dependent work; capture failure preserves acknowledged edits and allows a
capture-only retry. No plan registration or review selection is accepted.

## Compact workflow delivery

The main drawing workflow's default and explicit compact responses omit pure
preparation work/reuse statistics and drawing timing diagnostics. This projection
runs after existing owner validation, receipt consumption and inner execution
observations; diagnostics remain in those original records. Explicit full responses
retain them. Direct owner APIs retain their independent contracts.

Keep all operation results, identities, counts/ranges, findings and limitations,
material provenance, inspection images/evidence, acceptance status, partial/failure
settlement and recovery instructions. Omission must never infer success or change
an action outcome. Apply projection only to known workflow/preparation and drawing
receipt locations (including executionResult/batches failure containers), not
similarly named fields inside user data, checks or recovery.
Single and ordered-part paths share this contract. Cancellation remains cancellation;
no additional tools, captures, queries, writes or automatic replay are introduced.

DoD: execute the main workflow and the published forwarding example; compare full
and compact semantic results and image bytes, verify original diagnostics and call
correlation in the existing trace, and prove fewer delivered bytes without extra
calls. Cover no-op, invalid input, partial/failure, cancellation, follow-up failure
and remaining-only recovery. Saved representative compact text must shrink from
5,372 to at most 1,938 bytes for the original fields. The same receipt with the
required created-root identity array is bounded at 2,005 bytes. Local evidence proves
delivery correctness, not model adoption or latency.

## Document export and persistence delivery

`Core.save()` produces a portable snapshot; it is not durable confirmation.
Ordinary completion uses the existing captured document-publication target and
reports durable, local-only or unavailable accurately. Later edits do not extend
the target; disconnect, replacement, cancellation or storage failure cannot claim
success. Retry never repeats already-applied edits.

Explicit document export delivers a browser-owned immutable downloadable artifact
and bounded metadata, not full document JSON in a tool receipt. Keep Framework
serialization available locally; remove ambiguous raw serialization routes from
AI discovery and recipes instead of preserving aliases. Artifact identity binds
actual document generation/revision and integrity. Request cleanup cannot retire
an export already handed to its user-facing download consumer; its owner releases
it on explicit release or disposal. Expired or failed exports are unavailable,
never silently regenerated as the old revision. `export_document` returns metadata;
`download_document_export` requests a browser download of those exact retained bytes;
`release_document_export` frees them explicitly. A download request is not proof of
a completed disk write. The export owner's separate 256 MiB retained-byte budget
admits the recorded 177,684,228-byte document while bounding ownership; this does
not raise the 16 MiB receipt limit. Exhaustion rejects new exports without evicting
issued exports. The metadata revision is a browser observation revision, not a
backend durable watermark. Snapshot identity and canonical change observation
reject in-flight document replacement or edits before artifact publication.

Unavailable completion confirmation returns partial status while preserving the
completed drawing. The conversation shows an authoritative unconfirmed-save
message instead of model-authored claims of successful saving. Local-only mode
also has an explicit local-only summary. Neither path offers drawing replay as a
storage retry. The document persistence queue retries its original publication
batch; pending confirmation keeps its captured watermark. A new confirmation after
session recovery is a new read, not reuse of a stale disconnected receipt.

Action execution, receipt delivery and document durability are distinct outcomes.
A result exceeding the ordinary receipt budget is replaced by an explicit bounded
delivery failure before transmission. Preserve known execution settlement and
batch/action identity; missing output cannot authorize a successor. A healthy
exchange accepts the failure and allows ordinary model recovery. Broken transport
remains terminal with its original cause and acknowledgement uncertainty. No
failed delivery replays mutations or implies rollback. Retain bounded status/code,
byte count and failure boundary, not unbounded HTTP bodies or secrets.

## Evidence and completion

The AI verifies the result against the user's request using the observations it
needs. Images come from inspect_drawing; values come from read_design_context.
No criteria registration, signed verdict, data-evidence token, reference-use
approval or completion-only reread is required. Captures describe an observation,
not a design approval. Explicit mechanical checks report their findings without
creating a global quality gate. Operation input/output validation, cancellation,
unknown write settlement and durable publication acknowledgements remain required.

### Attachment-to-reference preparation

Attachment metadata and imports use the existing image owner's content identity,
original bytes and admitted dimensions. Consumers select existing images and
original-pixel regions directly. validate_reference_images decodes requested
sources when dimensions or diagnostics are needed and reuses admitted results.
Source identity, access, decoding errors and out-of-image regions remain ordinary
input/resource validation. No suitability decision or prior criteria is needed.
AI-authored purpose and limitations are optional context, never permission.

### Primary-agent visual comparison

The AI compares delivered images and available data with the request, makes
visual decisions and performs final verification. It can inspect a ready part
before other parts exist and combine decided operations with their captures.
No mandatory construction order, screenshot count or verdict-submission call is
introduced. Source images do not establish unseen geometry; the AI states material
limitations. A successful tool call does not itself establish visual quality.

### Captured-image recovery

The inspection owner retains original successful capture receipts with its
request-owned images. `read_design_inspections` selects known IDs or recent
matching target/view captures and returns them through the ordinary image channel.
It performs zero canvas captures and no current-document validation. Its explicit
saved-snapshot label and original target/region/stamp distinguish redisplay from
fresh capture. Stale images may be redisplayed but cannot pass mechanical checks;
those consumers retain dependency validation. No cross-request image access or
mandatory read-before-capture is added.

### Evidence tool responsibilities

record_design_facts stores authored statements with optional provenance and scope.
record_design_calculations stores authored numeric values and units with optional
provenance. Both support direct storage without prior facts, criteria or drawing;
updating an existing id replaces the note. Missing declared output is a tool error.
select_design_references optionally stores selected attachments and source notes;
other tools use their own source identity/region inputs directly.

Saved notes are data, not independently verified truth. Use ordinary result bindings
and named retention for decided downstream work or possible later reuse. The App computes a saved descriptor once on storage: name, producing operation,
input/result selection and bounded shape. Execution receipts and later request
context reuse that descriptor without values. Saving has no mandatory consumer.
Retention does not extend request-owned image/query leases or make old geometry current.

## Ownership and diagnostics

The App provider owns orchestration and transport; preparation owners own derived
artifacts; registered actions/common APIs own canonical operations; conversation
lifecycle owns presentation. Rendering neither decides what to draw nor grants
completion. Framework packages remain accessed through public APIs.

The local provider reads effective native configuration once before creating its
ephemeral thread and disables inherited personal MCP servers for that invocation.
It preserves transport fields required by native configuration validation, omits
unset optional values, and never records or writes the configuration itself.
App tools, permitted web research and the configured model/effort stay unchanged.

Diagnostics record observed startup, native orchestration, queue, tool execution,
receipt and finalization boundaries with request/call identities. Unobserved
provider internals stay unavailable; invocation ownership is recorded continuously. Concurrent spans use interval unions. Wire
bytes, eager tool schema bytes and reported token usage are distinct quantities.
Retain bounded summaries, not prompts, credentials, raw geometry or private
reasoning. Diagnostics cannot control output or certify rendered correctness.

### Shared Runtime profiler

`@asyra/ai-agent-runtime` owns invocation middleware, recording, interval
projection, evaluation and trace export. The Node entry owns optional local
persistence and the report CLI. Design supplies canonical tool dispatch, result
interpretation, domain report policy and provider/event adapters. No generic
profiler implementation remains in Design. Browser imports require no Node APIs.

Every registered invocation crosses the shared dispatcher, including rejection,
unknown operation and cancellation. Middleware cannot call the canonical executor
more than once. Instrumentation cannot replace permissions, confirmations,
transaction settlement, retry decisions or original returned/thrown values.
Parent call, actor, purpose and expectation have explicit caller/contract
provenance; absent explanations remain unavailable. Parallel calls retain their
own identities. Internal phases use explicit child spans rather than simulated
function tracing. No instrumentation claims invisible provider compute time.

The profiler retains timestamped transport direction, byte count and stream kind,
plus permitted public notification metadata. It does not retain transport bytes,
credentials, prompts or private reasoning. Reports distinguish ownership coverage
from observable activity and identify missing, duplicate and unfinished records.
Inclusive and exclusive timings remain separate. A standard trace export supports
external timeline viewers without a new product UI. Export is explicit and local;
no automatic upload or telemetry. Saved historical records remain readable with
missing capabilities explicitly reported rather than invented.

### Unfinished native output visibility

Provider observation declares its visibility through the existing Runtime trace:
public item lifecycle and App invocation events are observable; pre-dispatch native
tool-output item start, argument deltas/bytes and generation-versus-stall attribution
are unavailable on the current interface. Missing events never mean zero generated
bytes. Transport byte counts are not argument bytes. A started or completed public
item is not automatically an admitted/executed App operation or a successful result.

Formal same-version native tests supply progressing arguments and withheld deltas
to an unfinished tool call, then verify actual public events and later execution.
If both produce identical observations, retain that limitation rather than reporting
a stall, oversized generation or measured thinking. Fixture bytes are test evidence,
not production observations. Abrupt cancellation/disconnection cannot invent item
completion. Observation uses existing records and never changes dispatch, recovery,
status or settlement. No new proxy, database scanner, logging configuration or raw
reasoning/code/diagnostic capture is introduced.

## Execution recording

Browser streaming admission separates observational activity from execution frames.
Qualified tool names remain intact. A parsed activity frame with invalid progress
fields is omitted from presentation without cancelling the stream or executing
anything; observer callback exceptions are likewise isolated. Activity following
the final result is ignored without reopening progress or rejecting the result. Existing server
records retain original tool activity. Unknown frame kinds, malformed JSON or
operation/result envelopes, receipt failures and explicit errors remain fatal.
User cancellation and transport cleanup retain their existing semantics.

The Runtime profiler emits a versioned, append-only local record per invocation in
addition to existing console diagnostics. The record includes request/call and
sequence identities, observed timestamps, model/effort, bounded tool selectors,
artifact references and terminal outcome. Source identity is optional and marked
unavailable when not supplied. No request prompt, credential or private reasoning is persisted. Image bytes
are excluded from event JSON and console summaries; explicit image assets use
the existing local content-addressed asset sink.
For native App-tool replies, the provider adapter preserves each submitted
inputImage as an existing asset_retained event with callId, contentIndex,
mediaType, status submitted and the asset reference. contentIndex is the exact
zero-based position in the native contentItems array, including preceding text.
The bytes are the validated image delivered by localToolContent, without another
capture, decode/re-encode or resize. Repeated images may share asset bytes but
keep distinct delivery identities. The corresponding tool output retains the
text metadata and inspection IDs. Local transport submission does not prove
provider perception or visual correctness. Suppressed/cancelled replies and
transport exceptions cannot be labelled submitted. Asset-write failure remains
recording failure and does not alter the tool outcome or replay completed work.
Offline image restoration joins call identity and content order and verifies
asset containment, bytes and SHA-256. Missing, corrupt, duplicate or incomplete
image delivery evidence rejects complete analysis rather than fabricating pixels.

Ordered ready-part preparation/application spans retain a bounded local part key
and zero-based index on their existing start/end/failure records. This identifies
part boundaries without a second trace store or inferred model decisions.
Original-reference decoder failures retain a bounded decoder message, with URLs
and credentials omitted, rather than replacing the cause with a generic failure.
App tool input/output snapshots are retained in separate local files, including
geometry and supplied values needed for diagnosis. Each reference includes its
content digest, bytes and explicit redactions; summaries never pretend to contain
the omitted data. Snapshots do not enter provider context or console logs. Truncation is explicit. Each call also retains input/output root shape and bounded
summaries with named omitted fields, and safe rejection feedback. Receipt-based
output usability is usable/unusable/partial/unknown with reasons; a completed
transport is not proof that output is usable or that pixels are correct. Report
projections join these with call identity and queue/execution durations. Summary-only sinks explicitly report unavailable snapshots. Snapshot write
failures mark recording failed without changing the drawing outcome.

New recorded invocations have an explicit App lifecycle envelope and provider-turn
handoff/return spans, including the gaps between provider item notifications.
Child visual-review calls carry parent request, tool call and waiting-span identity.
Exclusive accounting assigns child AI waits before their enclosing tool, then App
exchanges, tool execution/queue, research, native wait, provider events/requests,
provider turn wait and App orchestration. Inclusive call duration is shown separately.
Provider wait is not measured model thinking. Missing boundaries or event sequences
are recording defects; historical logs retain unavailable coverage. Notification
records retain method, public item kind, native thread/turn/item identities and
timestamp, never private reasoning. Startup records also retain process-level and
matching-thread MCP server names, states, structured failure reasons and warning
categories, including before thread acknowledgement. Free diagnostic text is
explicitly omitted; an unclassified reason stays unclassified. Native turn IDs identify a user-facing turn,
not individual model inferences. Reports distinguish observed exec/wait items
from model-round count and program-to-child relationships, which remain
unavailable when the provider protocol does not expose them. A lifecycle
settlement envelope alone does not invalidate the last visual-review opinion;
later App work and incomplete execution still prevent current-review reuse.
A subsequent canonical inspection-stamp validation is read-only: explicit
`current: true` preserves review currency; false or omitted results do not.
Concurrent spans are counted once in that priority order; provider item intervals
are reported events, not a measurement of all private model reasoning. Missing
boundaries remain incomplete. Native wait duration comes from lifecycle events,
not the requested sleep duration. Older v2 records remain readable with unknown
input/output utility and unavailable execution starts.

Public native activities are retained through the existing redacting payload
sink: agent message deltas and completed text, readable reasoning summary deltas
and completed summaries, proposed-plan text and turn plan step/status updates.
Request concise public summaries without changing model effort or adding turns.
Private reasoning content and raw reasoning text deltas remain excluded. Attribute
content to its exact thread/turn/item; a turn-scoped plan notification may omit
threadId only when its turnId matches the active turn. Save each delta once, not
cumulative prefixes; completed values are authoritative and are not concatenated
with their deltas. Empty, missing, malformed and failed retention stay distinct.
Activity capture cannot reject a tool, replay a mutation or change settlement.

Offline activity analysis verifies retained payload hashes, merges public activity
with existing lifecycle/tool events in record order, and exposes intervals with no
recorded activity. It also works on interrupted/partial records without certifying
completion. Preserve first-content timing separately. Arrival times are activity
evidence; no-event intervals have no inferred cause. Missing historical payloads
remain missing. Tests cover the actual adapter/recorder/analyzer handoff, foreign
turns, partial streams, recording failures and linear delta preservation cost.

Offline evaluation may supplement public activity with selected native diagnostic
boundaries from a read-only database query. Bind extraction to an exact thread,
unique native process and run window; preserve row identities and raw-body digests
but save only allowed item/call/timing metadata, never raw text. Missing databases,
unsupported formats, ambiguous processes and interrupted items stay unavailable or
incomplete. Native start, dispatch and host completion are separate facts, not
parameter progress or a network diagnosis. Never pair events lacking a shared
identity by temporal proximity. This supplement is version-sensitive diagnostic
evidence, not a runtime status API. Collection runs after work, cannot change
settlement, and is consumed by the existing activity analyzer.

The App-server recording sink queues events in order and drains at request
settlement. Recording errors are reported separately and cannot reject, roll
back or modify drawing results. Interrupted records have no terminal success;
readers retain malformed/partial evidence and classify unresolved calls as
incomplete. Overlapping tool intervals count once. Provider request intervals
can overlap tool work and are not labelled exclusive model reasoning.

Records are project-local diagnostics, not public document state or provider
input. Loading a record cannot mutate the canvas. Existing log format 1 remains
readable with unavailable fields; new diagnostic records use version 2. Log
files and local environment values never enter Git. Runtime storage does not
silently delete earlier evidence. Periodic evaluation consumes records as a
separate projection, not as completion authority.

### Bounded evaluation work and self-report

Ordinary drawing/quality evaluation prompts announce optional Knowledge resources.
The agent may consult them for an unresolved decision at any stage or proceed
without reading them. Neither a read count nor a prescribed reading order is an
acceptance condition. Preserve the original design requirements, references and
deadline. Save the actual prompt; historical forced-reading runs remain immutable
and cannot be treated as the same prompt condition. Do not add a forced-reading
variant or extra model run to an ordinary observation.

An explicit evaluation window may set `expandedNodeLimit: 2000` for diagnostic
reproduction. Omission retains the production 10,000-object ceiling; other override
values reject. This request-local policy is consumed by existing budget inspection,
preparation and retained-source partition planning and is disclosed in delivered
usage. It cannot be changed by a model tool. Compiler and browser safety ceilings
remain 10,000; no other budget increases. Recovery preserves whole instances,
geometry, order and existing no-replay rules. The runner records both limits and
never claims recovery coverage when a live submission does not exceed the limit.

An explicitly configured local evaluation window separates the work deadline from
an independent report policy: `reportTimeoutMs: null` waits for report completion
without a time limit; an explicit positive timeout is bounded to five minutes.
The fixed 101 benchmark uses the untimed policy. An optional recorder-owned
`evaluation-control.json` beside provider evidence arms strict stopping only for
its exact `workDeadlineAt`. Blocking App/native execution failures, missing
required data, failed delivery and unknown settlement stop through the same
interrupt boundary after the active host invocation delivers its settled recovery.
New calls are rejected while stopping; deadlines still interrupt immediately.
Canonical authored-value rejection is correct_input when the complete admission
result establishes no writes, or a typed canonical input rejection carries known
no-write settlement and fresh context. Direct and
sequence routes preserve this identity; generic recoverable flags and prose do
not establish it. Failed visual checks and ordinary corrective rework do not
stop the task. The first reason is retained and is not deadline expiry.
Reference import declares `select_reference` and
known pre-attachment settlement for rejected sources. Partial and all-source
failures retain their per-source receipts and successful images; the registered
recovery contract covers both singular and batch forms. Strict evaluation permits
the original agent to choose another source. Attachment admission failures,
unknown effects and independent delivery errors remain blocking.
Control observation ends when work settles. Drawing input remains unchanged;
ordinary tool recovery is unaffected when this explicit control is absent.
The recorder transfers complete document/report snapshots in bounded chunks from
one browser capture and serialization, then disposes both handles. It records
browser lifecycle events and preserves independent report/video evidence if a
collector fails. Normal product requests have no such window. The browser and provider consume the same absolute work deadline. The
browser checks it at the actual synchronous mutation boundary, including queued
work. A finite mutation already entered may settle; no later mutation enters and
committed changes are never replayed or undone by the deadline.

At the work cutoff the native provider cancels App tool execution and interrupts
the active turn. After its terminal acknowledgement it requests a concise public
report in the same native thread. Reports explain completed work, remaining work,
first-frame delays and uncertainty without requesting private reasoning. Report
calls cannot execute App tools or final drawing actions. Optional `reportInstructions` accepts a nonblank string without an App-imposed
character ceiling. It requests detailed public commentary with the existing final
1000-character summary contract. These host controls are excluded from drawing
input. `announceWorkDeadline: false` suppresses the otherwise unchanged work
countdown instruction. Report instructions are delivered only after work settles
and tools drain. The fixed benchmark submits once and verifies retained work/report
exchanges share a native thread with distinct turn IDs, then extracts only public
commentary from that report turn and requires the settled evaluation receipt.
Its incremental trace observer reads each byte once; canonical content captured at
report entry must match report settlement. No new-session report fallback. Early work completion also
enters reporting. Missing interruption, transport failure, cancellation, malformed
report and report timeout are explicit failures, never artwork completion.

An explicit `keepReportSession: true` evaluation option transfers the original
native process to the service after report completion. The initial request and
recording can finish while the session waits without model calls or an idle timer.
Drawing tools and request artifacts are released at settlement; follow-up questions
remain report-only in the original thread. Local admitted status, ask and close
requests use the retained session identity. Questions serialize, public input/output
is retained separately from the initial execution, and disconnecting a question's
HTTP response does not discard its answer. Explicit close cancels active reporting,
drains pending questions and releases the process once. Lost processes are reported
as lost, never recreated. Service restarts do not promise resume. The recorder
finalizes video and document evidence while preserving the service for questions;
explicit closure remains separate from evidence collection. Ordinary requests and
non-retained evaluations preserve their existing cleanup.

The existing evaluator preserves work outcome separately from model-authored report
text and observed events. Capture consumes the existing settled conversation result,
not a second copy of the complete network stream. A report is eligible only after
executed runtime settlement with the host evaluation marker and matching final
report_outcome/no-change receipt. Earlier batches may reuse action IDs; the final
ordered receipt identifies the final report. The rendered projection carries bounded text and
request/turn identity; the collector must match the observed request and recheck
identity and the assistant result text before taking its screenshot. User text or
work-history text cannot substitute for the displayed report. A raw provider report,
ordinary outcome, prior turn or failed/cancelled result cannot substitute. Missing
or ambiguous evidence stays failed; no drawing operation is repeated for capture. The knowledge-evaluation run-101 collector saves report text and its screenshot
without video, then closes the work context before fresh-context reload. The fixed
taipei-101-live collector records continuously and reloads the same context after
retaining report and source evidence. During drawing, canonical changes are
coalesced until rendered and transaction-idle. When bounds leave the visible
canvas, the existing viewport API fits the current content. Idle polls do not read
bounds; same-count geometry changes still trigger inspection. External navigation
is classified only against settled/rendered geometry: a cropped view pauses
framing, and navigation exposing all content automatically resumes it through
the production runner tick. Unchanged paused polls do not read bounds. Ordinary
fit navigation does not disable tracking. The runner records pause/resume times.
Framing does not change canonical content, selection or history. Retire the drawing watchdog before framing disposal and
report evidence. Framing failures are evidence errors and cannot abort native
report collection. On report/capture failure, retain missing evidence and attempt
bounded cleanup; an external watchdog bounds hangs independently. A self-report is not measured
provider reasoning time or a verified cause. Evidence collection has its own bounded
cleanup after reporting and cannot grant extra drawing time.

DoD: deterministic protocol tests prove same-thread transition and denial of late
App calls; actual transaction tests prove deferred-write rejection, retained partial
history and Undo/Redo; capture tests prove report/text/screenshot capture,
explicit report timeout, untimed report continuation, and failure preservation.
The fixed benchmark retires its drawing watchdog before report-entry evidence,
retains completed native report text before browser captures, and independently
collects source, receipt, persistence, checkpoint, screenshots, reload, and video.
Missing evidence fails explicitly while other collectors continue. Its report has
no duration watchdog; cancellation and transport errors still terminate normally.
Ordinary requests remain unchanged. Live
model compliance and screenshot appearance require a separately authorized run.

## Execution evaluation

Offline reports may identify exact, fully retained plan input fields echoed by
the output and group investigation targets by tool, phase, failure kind/code and
recorded configuration. Preserve call/sequence references and candidate confidence;
truncated content cannot establish duplication. Frequencies do not establish a
root cause or priority. Different configurations and phases remain separate.
Development scenarios and reserved validation scenarios evaluate requested output,
not compulsory tool names. Contract replays cannot claim measured model selection
improvement. These projections never change runtime routing or call another model.

The observe owner projects saved records into read-only run and period reports.
Each tool call separately reports transport status and receipt-based execution
status: usable, partial, rejected, failed or unknown. A completed transport with
an admission rejection is not a successful operation. These mutually exclusive
call totals remain separate from nested action failures; they must not be added
together. A later success alone does not prove recovery from an earlier failure.
Reports separate deterministic observations, retained model review opinions and
optional user feedback. Each finding links to request, call and sequence when
available. No missing or truncated input is reconstructed. Only identical
untruncated read selectors at an explicitly equal revision are repeat-query
candidates; even then, repetition is not proof of waste. Time and payload ranks
identify investigation candidates, never machine-speed pass/fail criteria.

Period selection uses startedAt in a half-open [from, to) interval, defaulting
to the recent seven days. Unknown timestamps are reported as unclassified rather
than silently counted; duplicate request identities are excluded and reported.
Group runs by known provider/model/effort/source identities, keeping unknown
metadata explicit. Interrupted and malformed records remain visibly incomplete.
Feedback is kept separate and never substitutes for tool or visual evidence.
An explicit post-run assessment may reuse the native provider transport once,
with a compact report and named criteria only. It advertises no App tools and
disables web search; no canvas executor or document is attached.
Assessment duration, usage and record identity remain separate from drawing.
Assessment diagnostics use stderr so the report CLI's stdout remains a single
machine-readable payload. Drawing diagnostics retain their existing channel.
Unknown call citations or malformed responses are failed assessments, not
findings. The report stores the opinion separately; it cannot approve completion.
An existing final visual review can supply model opinion without a second call;
absence is unavailable, not a positive assessment. These reports do not mutate
canvas state, approve a drawing or automatically change prompts.

## Product cases and definition of done

Permanent executable cases must cover:

- All registered tools remain callable after deferred discovery, including narrow
  vector-node edits, simple edits, research and preparation. Unknown tools and
  malformed arguments fail before canonical writes.
- A composed stage reuses prepared handles and IDs, applies through the ordinary
  batch route, and performs one required end-of-stage inspection. Compare actual
  call/work counts with the same operations individually; no seconds threshold.
- Independent work overlaps; conflicting operations and subsequent reads retain
  order. Cancelled queued work never writes; recoverable input failure does not
  poison subsequent corrected work.
- Inspection remains current across local edits, external edits, Undo/Redo and
  replacement. Unknown changes invalidate; edits during inspection cannot create
  accepted mixed-state evidence. Missing observations never mean unchanged.
- Requested simple and detailed output use the same execution contracts without
  subject-specific geometry, mandatory detail quotas or resolution reduction.
- Partial execution, clarification, Stop and final reporting preserve progress,
  Undo and the accepted conversation layout.
- Trace accounting separates overlapping tool spans from wall time, handles
  absent provider fields, and excludes sensitive payloads.

Use focused provider/scheduler/preparation/operation/review/lifecycle tests first,
then App typecheck/build and affected integration/visual gates. Flow Inspector
must resolve the complete owner flow and run the admitted source proof. Personal acceptance recordings are local developer operations, not product
behavior or shared CI requirements. Product cancellation, lifecycle recovery,
canonical changes and Undo remain covered by the ordinary regression suites.
Normal App use does not automatically fit the viewport. Final delivery requires
latest PR CI passing; static flow validation is not runtime completion.

### Prepared target and geometry reuse

Batch target references populate the exact identifier argument path in the registered
API schema, including a nested request. Ambiguous paths or conflicting supplied IDs
are rejected before dispatch. Known artifact members do not become current children.
Reusable vector templates and explicit placements belong to deterministic preparation,
with exact geometry and stable keys, per-call validation and no cross-request cache.
Exact-key target lookup uses the retained index directly without enumerating its
unrelated members; prefix and whole-artifact lookup remain explicit broad queries.
`vector-pattern` contains one `template` (width, height, rings, optional fill and
optional `type: "vector"`) and
ordered `placements` (x, y, optional fill override). It emits normal vectors named
with the placement index and keyed as `key-0`, `key-1`, etc. It does not transform
geometry; different sizes or orientations remain explicit. Expanded node and point
guards apply, and one preparation measures each shared rings object once.
Provider execution/gap observations retain public timing metadata only; missing
historical provider coverage remains unattributed, not inferred model thinking; new invocations record actual delegation spans. Native exec/wait
lifecycle duration is `providerOrchestrationEventMs`, not claimed CPU time. The
report exposes the ten longest App-call gaps with preceding/following operation
names and exclusive observed timing categories; overlapping calls are merged.

## Tool invocation contract

App-provided tools are our owned adapters over canonical App APIs and preparation
owners. Native web research is external; reference download and import policy are
App-owned. Every native tool uses the exact advertised schema for pre-dispatch
admission. Invalid input returns a correctable field diagnostic without invoking
its owner. Nullable type unions and unique-item constraints are enforced; legal
nullable values remain valid. Preparation rejection receipts retain the owner's
specific reason before canvas dispatch. No aliases, guessed intent or silent parameter repair are applied.

The invocation result adds `toolOutcome` with status `success`, `failed`, `partial`, or `unknown`, independent settlement
and bounded issues. A returned string is not proof of usable output.
Negative visual judgments and successful requested region captures are usable
results; image scope is not execution completeness. Canonical status=partial or
complete=false indicates partial work or coverage. Unavailable preparation and
failed captures are not usable. Partial results preserve successful action receipts and
never cause automatic replay. Every registered owner uses the same failure boundary. Admission, execution,
decoding and delivery failures return to the model; unknown writes are explicitly
unknown and never automatically replayed. Broken transport remains terminal. User
Stop always cancels rather than entering the recovery path.

A semantic draft key identifies a node within that draft. A root may supply a key;
without one its generated element ID serves as its selector. No root name is reserved. All keys share the same uniqueness checks. Canonical
IDs remain server-owned. Reference import reports its failing stage without
changing source resolution, and reused image bytes do not replace the current
call's attribution. Inspection without an explicit view or region consistently
requests overview for any target. Explicit detail/regions retain native resolution.

### Non-Core owner result contracts

Every registered non-Core document writer declares an explicit owner-result
contract. Existing structural and ordered-status contracts remain valid. The 31
previously opaque writers return a mutation receipt that retains the original value, acceptedIds,
unavailableIds and changed, derived at the original owner validation and apply
boundary. Accepted means fulfilled, including valid unchanged work. Unavailable
means rejected or unsupported, never unchanged. Empty valid input is a no-op.
Mixed available and unavailable targets are partial; wholly unavailable work fails.
Invalid receipts fail their contract while preserving known settlement and effects.

Fill/Stroke and element wrappers propagate canonical apply evidence. Empty patches
still validate requested targets. Vector owners validate the target before empty
patch shortcuts and report canonical apply results; transient Feature operations
retain their existing computed-patch authority. Direct consumers explicitly project
the retained value instead of treating receipt-object truthiness as success.

All current document writers must declare a result kind. Remove the opaque-owner
fallback; do not reinterpret missing output as successful or unchanged. Recovery
retains acknowledged results and identities, never dispatches completed writes
again, and leaves transport or rollback failure with its existing settlement owner.
No additional state, registry, persistence format or model judgment is introduced.

### Core owner result contracts

Every registered Core mutation declares the semantics of its original return;
opaque-owner fallback is forbidden for this family. Accepted identity lists mean
all declared targets were validated and processed, not that every value changed.
Their identity namespace and ordered deduplicated input mapping are explicit in
the existing declaration. Core property writers return acceptedIds plus changed from their existing Props
and Scene apply evidence. Empty input or empty mutation evidence is no-change;
include binding and retirement effects, equal-valued overrides and unowned sources.
Visual target scope is not evidence that no mutation occurred.
Core's element-data boolean is a changed flag only because missing/invalid targets
reject before application; false is a valid unchanged result in this contract.

App element property wrappers preserve the Core changed flag and return their accepted
caller targets after existing group normalization. Empty values do not bypass target
validation; empty target input remains inert. The direct patch wrapper forwards the
same receipt. Direct Group interfaces match the Core return type. Vector scaling
and plural positioning consume canonical evidence and retain their boolean and
ID-list values inside the explicit non-Core mutation receipt; geometry algorithms remain unchanged. Neither wrapper may discard the canonical result into a void return.

Malformed or misaligned owner output fails the result contract, preserving original
values, any creation prefix, canonical scope and known settlement. It does not
claim that acknowledged edits failed or authorize replay. Normal Core results and
result-contract rejection do not report unknown application. Transport loss and
rollback failure retain their separate execution-settlement recovery; absence of
an acknowledgement cannot truthfully certify either success or no writes.

When a member throws, existing synchronous Factory status is authoritative for
that member's settlement. Discarded/rolled-back means no retained member writes;
prepared-batch failure reports not-started while preserving earlier successful
actionResults. A committed member's failed delivery retains completed settlement.
Unknown settlement is reserved for missing host evidence or failed recovery, not
for discarding an available rollback receipt. Rollback failure closes the existing
invocation to later writes. Outer history settlement retains the original cause.

Formal coverage must exercise real Core/Factory behavior through App adapters and
native contracts, including no-op, mutation, missing/stale target, cancellation,
rollback, malformed output and partial-prefix recovery without duplicated writes.

### Owner results and workflow outcomes

Document operation receipts distinguish confirmed changes, confirmed unchanged
valid targets, unavailable targets and unconfirmed application. Returning from an
owner is not enough to certify the requested change. Void, false or null without
an explicit result contract cannot become successful application or a valid no-op.
Retain known execution settlement and mutation scope when application is unconfirmed;
never replay a write to reconstruct its receipt. Reads and transient operations
keep their separate non-document contracts.

Primary Fill/Stroke color batches return one ordered changed, unchanged or
unavailable status per input. Empty input is a valid no-op. Available unchanged
targets count as fulfilled work; unavailable entries make mixed results partial
and wholly unavailable results failed. Scalar UI operations still return whether
a value changed. Composition edits use the same statuses: unchanged entries do
not create partial failure, while missing/unsupported targets do. Malformed or
misaligned owner results cannot certify complete application.

A workflow that completed writes but could not deliver required measurement or
capture reports partial, preserves the completed mutation settlement and identities,
and describes check-only recovery. Full and compact replies agree. A successfully
delivered negative domain check is not an execution failure; explicit deferred
inspection remains valid. Cancellation and unknown mutation settlement retain their
existing authority. No follow-up failure replays acknowledged writes or discards
completed parts, and incomplete output cannot feed successful recipe bindings.

Formal cases cover real owner-to-action handoffs, ordered mixed/no-op/unavailable
results, invalid receipts, cancellation, compact/full workflow parity, failed
measurement/capture, valid negative checks and recovery with one mutation dispatch.

### Correctable contracts and shared property edits

Bezier control points may lie outside the local rectangle while the actual curve
remains within declared bounds. Validate finite controls and actual curve extrema;
never equate a control point with a visible vertex. Malformed control pairs report
node key, ring and edge before any application; no inferred control is inserted.
Review phase examples come from the same advertised contract and are validated in
formal tests. Diagnostic records identify the advertised schema used for admission.

Fill row batch edits consume element targets, row index and new fields once. The
App resolves current child IDs inside the same synchronous mutation boundary.
Independent fills remain independent. Explicit sharing links existing Fill property
components by canonical child ID; it does not link whole elements. Editing a selected
owner writes sparse local overrides. Only an explicit shared-source operation changes
unmasked dependent fields in all consumers. Reset removes override presence; detach
materializes the selected effective component. Other rows, property fields, order
and ordinary Undo/Redo persist. Root reads expose logical child slots separately
from effective property IDs; callers retain the logical path and may guard expected
binding/source identities. Acceptance of an edit is not durable save confirmation.

Action diagnostics distinguish the outer native call, inner App batch operations,
and provider lifecycle activity. Every observable action records actor, parent,
contract purpose, expected result, input/output references, observed timing and
execution outcome. Model-supplied purpose and judgments remain attributed opinions;
missing purpose or correctness evidence is unavailable, never invented. Native
lifecycle metadata is recorded without private reasoning, credentials, images or
raw provider event dumps. Unknown spans and missing endpoints remain explicit.
Drawing, prepared-source assessment, current-image visual assessment and explicit
post-run execution assessment retain their actual invocation purpose in records.
A tool-free assessment mode does not turn visual comparison into execution-report
analysis; the parent call/span and source identity remain unchanged.

Browser `handlerMs` measures actual asynchronous handler elapsed time, not CPU time.
The enclosing action span measures the batch exchange and may overlap sibling
spans. Reports keep child actions separate from native tool counts and time
unions. Diagnostic metadata is retained locally and stripped from model-facing
receipts. Missing handler timing (including an interrupted exchange) stays
unavailable; it is not estimated from a batch total. Exact native and App action
contracts are saved once per invocation and linked by content digest. AI design judgments are distinct from transport/output availability.
Incomplete artwork and ordinary visual correction are not tool execution failures.

### Whole-result review and revision handoff

Final verification belongs to the AI. It uses current observations where needed,
preserves acknowledged work, revises actual deviations and reports limitations.
Capture/data failures describe the missing observation; they never authorize replay
of completed writes. Tool receipts remain authoritative for actual execution and
publication, independently of the AI's design judgment.

### Browser failure handoff

The browser acknowledges a rejected batch with an explicit failure envelope before
continuing the stream. The exchange validates the one-use token, batch and
known action identity, then rejects promptly; it must not wait for cancellation.
Framework callbacks return completed actions and a bounded failure with stage,
action identity and settlement. Failed actions are not replayed. Context refresh
precedes subsequent permission decisions. Exception content is redacted before
delivery. Actual handler and batch elapsed measurements remain distinct.
A failure acknowledgement is not proof of rollback or zero writes; preserve prior
successful members and never automatically replay uncertain mutations. Stop retains
its abort behavior. Recording failures cannot replace the original execution error.

### Native image regions and preparation limits

A preserve-vectors image plan may select an explicit integer source-pixel region.
Coordinates refer to the image after orientation metadata, without resampling.
The immutable attachment remains intact. The returned artifact uses region-local
coordinates and carries the selected region for mapping back to the source;
absence of a region retains the original full-image path. Background separation
continues to use its existing explicit base semantics and does not silently crop.
Oversized vector output returns observed bytes, the existing 8 MiB limit and a
source-local recovery path. It is not an unavailable converter or malformed input.
Only successful conversions are reused within the request, keyed by attachment
and selected region; cancellation never publishes a new artifact.

Before semantic compilation, one bounded structural budget inspection counts all
observable source and expanded node/path budgets and depth without constructing
geometry. Admission returns the violated budgets together, with observed counts,
limits and explicit lower bounds if traversal itself reaches its guard. Native
invocation enriches a schema rejection with the preparation owner's pure budget
inspection, without dispatch. Valid inputs use that inspection once inside the
preparation owner; neither path can bypass schema validation. The combined workflow
uses that same owner. No automatic repartitioning may change layout, relationships,
keys or painter order; recovery retains the original draft for programmatic reuse.

### Post-run efficiency contract

Discovery advertises registry-derived categories. Invalid names/categories return
current choices with the error; no speculative alias is executable. Native
preparation tools are distinguished from registered canvas APIs.

Batch writes may bind prepared element identities to an aligned array of new
values. References are request-owned creation membership, not cached mutable
properties. Per-target Fill-row edits resolve each current Fill identity in the
App, validate the whole update set, then perform one canonical batch. Plural
visibility writes retain item-level changed/unchanged/unavailable outcomes in one
operation. Neither path requires caller old values.

Preparation partitions source work automatically inside one immutable artifact;
parent structure, key identity, painter order, layouts and cross-node relations
remain global. Expanded geometry/depth ceilings and per-primitive validation
remain enforced; no simplification or model-assisted splitting is needed merely
because cumulative source work exceeds one preparation window. Pattern faces,
Fill palettes and selected instance ranges have no independent 1,000-item input
ceiling. Each source face is an individual primitive. Construction yields between
bounded work windows so cancellation can run before publication or canvas writes.
The artifact still admits at most 10,000 expanded nodes and 200,000 expanded
points; a single primitive remains bounded to 20,000 points. Compilation uses the
constructed result once, without rebuilding earlier windows.

Visual judgment is bounded by the user's requested quality. Optional polish must
not become a blocking defect through model-authored criteria, reference detail,
or prior reviewer preferences. Explicit user acceptance is authoritative for the
accepted scope, not a waiver of unrelated requirements or stale/data evidence.

#### Shared identity and repeated mutation targets

A Fill property component has one unique ID. Distinct Fill collections may reference
the same child ID: A=[red,blue], B=[red] shares red and preserves A's independent blue.
This is a canonical ownership relationship, not duplicate component creation.
Fill-row mutation destinations must be unique; repeated element targets are invalid
input, not sharing or instructions to merge patches. Sharing/detaching uses canonical source-backed property records and field/link deltas
through persistence and Undo/Redo. This is property inheritance, not whole-element
instancing. Row indexes are immediate selection conveniences, never retained identity.
A source-backed source must be detached before it becomes an independent source.
An overridden target must be reset or detached before rebinding to a new source.
Current editors use the Core local-target APIs. Future shared-style UI must use the
explicit source API; no new UI workflow is introduced by this contract.

## Progressive preparation and reference admission

Reference import preserves original encoded PNG/JPEG/WebP bytes and oriented
dimensions, validates decoding, and does not inflate JPEG/WebP to PNG or impose
a separate 4 MP ceiling. Existing decoder safety, download/delivery byte limits
and cancellation remain. Decode failure and byte rejection are distinct failures;
no automatic resizing or substitution occurs. Reference import accepts a batch of
independent image/source URL pairs with ordered per-candidate receipts; failures
do not discard siblings. Concurrent duplicate URLs reuse one in-flight download,
decode and attachment within the request, preserving per-caller attribution.
Failed attempts remain retryable and cancellation prevents attachment admission.
Original-resolution region extraction
and layer separation use the same decoder pixel admission.

Exact-name discovery distinguishes native tool inputs from canvas action inputs.
Its native routes and complete schemas come from the actual registered tool groups.
Native declarations may omit sibling union fields or abbreviate nested
schemas as unknown. Registration distributes common union fields into each branch
without changing admission. Exact-name lookup returns the canonical inputSchema,
including definitions and constraints, on every requested read through bounded
content continuation when necessary; explicit refresh remains available. No separately maintained schema copy
or model-authored substitute is used. Mixed lookups return
known matches with explicit execution routes and separately identify missing names.
They neither discard valid matches nor send native tool names to the canvas batch.
For a batch action and its own registered wrapper, ordinary exact usage supplies
the executable batch guide and the qualified wrapper reference. Explicit wrapper
selection retrieves its executable guide. Full and machine-schema reads include
both actual input contracts with their distinct routes. A flat action schema is
not the native wrapper schema; no extra qualified lookup is required to discover
that wrapper. Delivery reuse and explicit recovery remain independent per route.

The AI can apply a coherent ready part and observe it before preparing other parts.
It chooses the needed checkpoints and final verification against the request. No
phase registration or stored approval is required. Rendering and Undo retain their
existing owners.

### Ready-part continuation and delivery reuse

Prepared application and prepare_and_apply_design accept optional parentId for an
existing editable container in the current workspace. New part coordinates are
local to that parent; omission retains workspace insertion. Canonical capability,
existence, membership and locks are rechecked at write boundaries. No container
name or type is assumed. Compact receipts retain actual part identity; continuing
construction does not require the complete ID map. Submit ready retained surfaces
before generating unrelated parts or their detail; final requirements stay intact.

Native API lookup can recover complete registered descriptions and schemas when
native declarations abbreviate them, using the same revision and refresh policy as
action lookup. Reference imports reuse acquired original bytes within the request.
Explicit delivery selects images independently of acquisition; repeated selections
redisplay the cached original without refresh or redownload. Failed sources remain
recoverable under their typed owner outcome. Recording-only initial fit runs in the browser independently of
screenshot capture so a slow capture cannot postpone viewport navigation.

### Shared construction

A semantic draft may declare `sharedFills` as draft-local names of solid/gradient
values and reference them using `fill: {shared: name}`. These names are not saved
property IDs. Preparation allocates one canonical Fill at first use, subsequent
entries reference that ID, and the receipt returns `sharedFillIds`. Unused
definitions do not create records. Equal inline fills remain independent. Unknown
keys or invalid definitions fail before application. Existing property linking
and detachment use the same public App APIs as ordinary editing. Saved documents
and Undo contain ordinary canonical relationships only.

Basic API eligibility excludes host lifecycle notifications, including
`renderIsReady`: it emits an initialization event and is not a readiness query.
Structured vector point selection carries elementId, pointId and the canonical
target (anchor/inHandle/outHandle). Registered basic actions each have an explicit
real-App browser case matching the catalog inventory; it exercises advertised
admission, actual owner effects/output, unknown-field rejection and cancellation.
Each case starts a fresh document rather than resetting canonical state behind
the live persistence stream. These deterministic cases prove API execution, not
that a model chooses every tool correctly for every user request.

## Responsibility-scoped tool execution

The model selects domain intent and judges evidence. The existing Design workflow
owns deterministic preparation, canonical application
and inspection handoffs. It sends each owner only its input and returns compact
outcomes and retained artifact references. A failed handoff preserves completed
steps and the prepared handle, does not replay mutations, and remains recoverable
through the common invocation boundary. Cancellation prevents subsequent work.
Internal owner calls retain correlated input/output observations and timings;
compact model receipts must not erase diagnostic evidence or imply visual success.

Vector preparation may derive dimensions from supplied rings when both dimensions
are omitted. Explicit width/height remain bounds assertions; a partial pair is
invalid. Coordinates remain local to the supplied x/y placement, default zero.
This changes no geometry, scale, camera or Fill sharing. Existing pattern and
projection owners perform expansion; model-generated derived coordinates are not
required when their declarative inputs are available.

Reference acquisition preserves concurrent ordered receipts and original bytes.
Per-source observations distinguish reusable acquisition from new I/O and expose
failure stage without interpreting successful download as suitable artwork.

### First visible change admission

First visible content is a good-to-have experience goal, not a mandatory stage,
independent deadline or completion criterion. Useful editable progress may be
shown when its inputs are ready; necessary research may precede drawing. Do not
create disposable previews, force smaller submissions or weaken required input
validation, reference obligations or final review solely to improve this timing.
Record the actual first-content time (or its absence) as diagnostic evidence;
latency alone neither accepts nor rejects the task. Explicit user requirements
and the overall work deadline remain authoritative.

The original user request remains immutable. The AI may revise its working plan
and apply partial work without registering criteria. Final verification compares
the actual result with the request, including any remaining limitations.

Startup guidance exposes immediate choices and stable capability boundaries;
stage-specific schema and review procedures belong to their registered tools.
Known world-space projection work goes to existing projection preparation;
already-authored 2D geometry remains unchanged. First-change success depends on
actual pixels, never an element-count or completeness threshold.

Reference import accepts sourceUrl with an optional direct imageUrl. With only a
page URL, the reference owner downloads bounded public HTML through the existing
DNS-pinned transport, resolves page-declared representative image URLs and imports
usable candidates without another model relay. It does not execute page scripts,
crawl links, infer visual suitability or reduce image resolution. Source-local
failures and candidate provenance remain visible; direct known URLs skip HTML.

Page-declared image metadata proves a publisher-selected representative image,
not the original-source resolution. Its receipt must mark source resolution
unverified, preserve the supplied bytes, and let the model choose a verified
original URL when required. Never label a metadata preview as the original.

### Reference acquisition and redisplay

Source-page resolution must retain explicit relationships between preview images
and their linked image resources. A declared linked resource takes priority over
its preview; its failure must not silently downgrade to that preview. Multiple
unrelated resources remain candidates, not interchangeable versions. URL strings
are not rewritten to guess original images. The model retains subject selection.

Acquisition receipts state the actual image dimensions, selected source and
whether bytes were newly acquired or reused. A later explicit acquisition of a
known candidate for the same page updates that page's selected asset. Repeating
the same page reuses that selected asset; explicit media delivery redisplays it.
Identical decoded-admitted source bytes share attachment identity. Different
bytes remain distinct even when names or URLs resemble one another. Protocol
image delivery is verified independently from download success.

The provider adapter delivers structured receipt text and original image bytes as
separate native inputText/inputImage content. No model-authored forwarding helper
is required; base64 never becomes receipt prose.

### Image result delivery and recovery

Existing image and inspection owners retain original evidence with explicit handles.
A delivery failure preserves acknowledged mutations and retained evidence. Use the
advertised read/redisplay route without invoking the producer again; missing or
malformed handles fail explicitly. No fallback capture, redraw, automatic retry or
invented success is allowed. Independent results retain independent identities.

The inspection owner declares `image.dataUrl`, `image.width` and `image.height`
as required delivery fields. Pixel dimensions are integers from 1 through 1024
and must match the original PNG header. Registered model projection preserves
these fields before native image extraction; it must not recapture, resize or
infer dimensions from document bounds. Overview, native regions and workspace
overviews share this contract, including multiple images in one reply.

Formal image regressions pass the production inspection declaration through
model projection and image extraction, with a real host-boundary case. A fixture
sent directly to image extraction is insufficient to prove the complete handoff.

Formal tests send actual owner output through the native response channel and
inspect the next outbound request. Zero, one and multiple images preserve bytes
and order. Fixed offline responses exercise the actual native executable without
a model. Evidence separates submitted content, native outgoing content, unavailable
live visibility and model-authored visual judgments.

Image redisplay reuses retained native pixels and source identity. Current target
and crop validation still apply when new work depends on them. Forwarding failure
never replays writes or discards their acknowledged result. Native regression
coverage checks actual media delivery independently of the AI's visual judgment.

### Diagnostic reference recovery

Reference acquisition preserves structured failure stage, reason, HTTP status
when observed, transient classification and attempt count. Public transport
retries a classified transient read at most once within the original deadline;
permanent HTTP rejection, unsupported media, bounds/security rejection and user
cancellation do not retry. Each redirect is independently admitted. Failed page
candidates retain their diagnostics while the existing resolver tries other
publisher-declared resources. No thumbnail downgrade, subject decision or new
network permission is implied. A successful candidate and explicit redisplay
continue through the same request-local acquisition owner.

### Selected batch-operation usage

A selected admitted batch action queried with view=usage includes the complete
existing execute_design invocation contract and that action's canonical
arguments, results and recovery, using standard JSON Schema in the usage guide. Derive
from registered owners: no copied operation allowlist, new executor or state. Name,
semantic operation and explicit usage queries preserve their existing selection
and ambiguity rules. Read-only and mutation actions have the same completeness obligation. Exploratory menu entries point to the exact selected usage acquisition.

Keep target field/path cardinality, artifact and retained snapshot selectors,
current admission, inspection policy, ordered partial receipts and retry-only-pending
instructions. An executable example comes from a valid owner example wrapped by the
existing route; unavailable examples are explicit, never fabricated IDs. Unselected
operation enums and result alternatives must not appear in this selected contract.
Full and schema-path queries, general usage navigation and deliberate complete
inventory remain available. Refresh, repeated reads and continuation never mutate.

DoD: execute delivered examples through real owners with success, invalid input,
cancellation, stale/unknown targets and partial-success recovery without replay.
For the saved 29,264-byte acquisition, selected complete delivery uses one query and
fewer total bytes under the same budget. Adding unrelated operations cannot increase
selected reply bytes or page count. Preserve target binding, restrictions, ordering,
local results and existing persistence/history semantics. Live adoption and timing
remain separately observed rather than inferred from deterministic tests.

### Selected operation contract delivery

Default instructions do not enumerate all registered tools. Use existing purpose
query or exact identity discovery for the current need. Intentional complete
inventory remains available through categories and their continuations; it is
optional, not a prerequisite, including for complex requests. Unrelated catalog
growth must not inflate matched small-task contracts or their continuation count.
Deferred native registration is transport metadata, not proof of model visibility.

The existing exact-name discovery route supports explicit inputScope for owners
that declare it. The ready-part workflow exposes operation choices and nodeTypes
from its canonical input schema. A selected reply retains the registered execution
route, revision, complete applicable input constraints, output/partial/recovery
schemas and lifecycle. It is complete for the declared subset, not an unrestricted
recipe contract. Actual execution always validates the original full contract.

Scope excludes incompatible operation fields and unselected node types without
weakening shared or branch constraints. Missing, ambiguous or unsupported scope
returns a recoverable read failure, never an inferred route or silent full fallback.
Retain exact reference closure without adding a second schema registry. Menu/usage publishes choices; a known selection requires no
preliminary lookup. Full and field queries remain available. Scope supports selected usage or full delivery and cannot combine with schemaPaths;
refresh and continuations preserve it and its revision.

Usage navigation exposes root input fields rather than enumerating every nested
schema path. Exact field queries and their path-resolution recovery remain valid;
selected/full contracts retain all nested constraints. Evidence: current usage
inputFields alone occupies 24,166 bytes; usage plus scoped acquisition took five
calls versus four for full. This superseded exhaustive navigation must be removed.

DoD: real first-use discovery, including usage when used, returns fewer bytes and
requires fewer calls than full on the same source from equivalent initial knowledge
(direct/direct and usage+selected/usage+full). Report optional navigation overhead
separately; do not compare unknown selection to an already-known contract. Exercise ordinary, projected,
grid and mixed drafts, repair and ordered parts through current owners. Scoped
and full validators agree within the selected domain; unsupported combinations
reject before writes. Preserve partial receipts, cancellation, failed follow-up
and recovery without replay. Offline native forwarding proves actual outgoing
content, not model adoption. Component repetition and artistic choices are outside
this delivery change; distinguish missing capability from missing usage information.

### Selective nested Knowledge delivery

`discover_knowledge` accepts optional nonempty `ids` with known topic IDs alongside
existing contexts. Supply these IDs to inspect only those topics and their selectable
children in one call; omit ids for intentional full-catalog exploration. Direct reads
remain legal without discovery. The App forwards selection to Runtime, never filters
by topic names or independently walks dependencies. Missing/hidden/inapplicable roots
return an empty selection, not the full catalog. Invalid selectors reject. Selected
visible navigation cycles reject; unrelated graphs do not affect scoped selection.
Keep source metadata and required dependency links; retrieval still resolves necessary
constraints outside the chosen catalog. No automatic descendant-body reads, higher
limits, mandatory Knowledge step or additional preliminary request.

The repository-local `test:design-execution-flow` entry builds current Runtime
public exports, then runs existing Runtime tests and the App server
consumer harness before Inspector verification. Consumer failure blocks this entry
regardless of a standalone Inspector pass. Reuse existing suite inventories; test the
actual command's failure propagation. Standalone Inspector proves its mapped cases,
not the unexecuted consumer suites. This gate neither queries CI nor calls a model and is not copied into standalone
App templates.

Discovery exposes selectable child IDs, descriptions and revisions through the
existing metadata catalog. `children` means optional navigation, never automatic
content retrieval; dotted IDs alone do not establish hierarchy. Only discoverable
children in the requested contexts appear. Missing optional children are omitted;
visible navigation cycles reject. Discovery does not deliver module bodies.

Select a parent topic or a detailed child directly from its discovery description,
without a preliminary body read. Descriptions must state the decision the parent
already supports and the additional unresolved need served by its detailed child.
For material methods, ordinary representation and lighting-domain choices select
method; local-coordinate conversion uncertainty or a needed worked example selects
method.parameters. A known supported representation does not require the walkthrough.
Hierarchy depth does not establish necessity or completeness. These are advisory
selection conditions, not a tool gate or a deterministic intent classifier.

Read selected IDs directly, without first reading every parent. Parent modules
are thin entry guidance, not eager umbrellas. Existing references, extensions and
explicit override targets are mandatory dependencies: preserve their constraints,
source revisions, authorization, deduplication and explicit failure semantics.
Do not remove required limits to make a reply small. Shared domain methods remain
portable; App modules own tool application. Select relevant topics as decisions
arise; absent advice and known-value actions remain valid without a lookup.

DoD: execute actual catalog discovery and select returned nested IDs; verify exact
selected dependency closure, absence of sibling bodies, retained necessary limits,
shared dependency read counts, invalid dependencies and filtered navigation.
Before reading bodies, test the real catalog for these selection conditions and
the actual provider prompt for direct parent/child choice without added calls.
Exercise both choices through the real read owner, asserting necessary closure,
no eager details, continuation coverage and unchanged repeat/rehydrate behavior.
Exercise actual App examples against their owners after topic selection. Existing
paging, rehydrate, cancellation and revision protections remain; no mutations or
write replay originate from a Knowledge read. Deterministic delivery is not proof
of model adoption or task latency improvement.

Selected material-method and representative-review decision topics must each
return their necessary advisory dependency closure in one complete informational
reply within the existing budget. Common execution/recovery limits remain mandatory;
detailed contract invocation examples and material parameter walkthroughs are
optional discoverable children, not eager references. Selected representation
limits cannot be postponed into an optional example. Explicit detailed or multi-topic
reads may still paginate. A prior successful read alone never authorizes suppressing a
necessary dependency from a later response. Explicit caller-held reuse follows the
cross-query contract below.

DoD: actual catalog-to-invocation tests assert one reply per decision topic, necessary
constraints and absent optional sibling bodies; optional examples still execute at
their real owners. Execute the published forwarding example with the same-version
offline native engine and compare the successor request exactly. Preserve paging,
repeat/rehydrate, cancellation and stale-content recovery without write replay.

### Selected retained information delivery

Existing read tools accept fromResult to redisplay exact selected content already
resolved in this request. read_knowledge uses a previous contextKey and ids;
describe_design_apis uses a returned resultKey and names. This mode returns actual
text/contracts, not omission markers, and cannot combine with fresh-query modes
(rehydrate/reuseFrom or refresh/view/schemaPaths/inputScope). Normal reads and
refresh remain available to obtain a different current composition or scope.

Knowledge inherits the retained contexts, rejects explicitly different contexts,
and preserves original document order, resolved overrides, source/provenance and
necessary target/effective-source dependencies. It uses retained full documents
without provider content reads. It must not import unrelated old siblings. The
selected result receives its own contextKey so later reuse cannot imply possession
of the omitted documents. Generation/context invalidation, permission, cancellation,
eviction and session disposal remain authoritative.

Discovery retains results in its existing request-bounded result map. Exact-name
selection returns whole saved entries with original input/output, recovery, local
schema references, coverage and execution routes. Menus/fragments never become full
contracts. Ambiguous and missing names remain explicit; valid siblings survive.
Selection must not rerun contract projection. Registry changes and foreign/expired
keys fail with ordinary selected-read recovery; do not silently substitute current
content. Preserve bounded continuation bytes and cancellation. Keys are identities,
not fuzzy goal matches. Existing purpose search chooses candidates separately.
Neither mode executes or replays drawing or capture. Measure cold-plus-repeat wire
bytes and real source/projection work, including handle overhead.

### Cross-query Knowledge dependency delivery

The App owns delivery of decision-required Knowledge to the active model turn.
The native tool-response channel carries complete bounded text directly; retained
values alone do not establish model receipt. Deliver advisory content as
untrusted context, distinct from the user's intent and from executable authority.
The model-facing body and the tool receipt must not duplicate the same content.
Preserve complete explicit reads and expose any changed receipt shape truthfully.

The existing provider channel must prove complete same-turn delivery in actual
successor requests without additional model requests before this path is enabled.
A steer/queue acknowledgement alone is not that proof. Use existing result storage
and its lifecycle; no additional cache, acknowledgement tool or body ledger.
Failure cannot certify forwarding or trigger product mutation replay.

Automatic dependency selection belongs to the App and the existing Runtime session,
not model bookkeeping. Ordinary new-child reads may omit only identical dependencies
with verified complete forwarding in the current context. Retained storage or native
dynamic-tool completion alone is insufficient. No forwarding evidence means full
required content, never a success receipt with missing restrictions. Selected new
content remains complete; source, revision, override and document order stay exact.
No new cache, acknowledgement tool call or model round trip is introduced. Existing
explicit reuseFrom/fromResult, complete reads, paging and rehydrate remain available.

Incomplete pages, suppressed/truncated output, failed delivery and context loss do
not authorize automatic omission. Current permissions and source validity remain
mandatory. Formal native successor-request cases must distinguish these paths from
complete forwarding before automatic omission is enabled. A last page or successful
App call cannot stand in for complete coverage. Recovery repeats only the required
read, never completed drawing or capture.

The existing read tool accepts optional `reuseFrom`, at most 32 unique opaque
`contextKey` values from complete results whose advice the caller still holds.
No extra discovery, acknowledgement, parent read or Knowledge prerequisite is needed.
Without explicit reuse or verified complete forwarding, return the entire required
dependency closure.
A result key is scoped to its retaining session; query equality cannot forge another
session's key. Runtime owns validation and reuse in its existing bounded result map.

Documents remain ordered with exact target/source/replacedSource metadata. Only an
identical resolved document may replace `text` with `retainedFrom`, identifying the
same target in a supplied earlier result. Keep complete source provenance and all
new/changed advice. References can be resolved through retained prior results;
complete fragment coverage alone does not establish possession of their dependencies.
The App publishes an executable reuse call alongside the existing forwarding guidance.
A retained result or a successful read is never proof of model receipt or adoption.

Check current authorization, generation, context, cancellation and dependency closure
before reuse. Missing, foreign or evicted references fail explicitly with recovery:
repeat only this read without reuseFrom; use rehydrate after context loss. Rehydrate
resets context and supplies full text even when old reuse references were supplied.
Do not replay writes or captures. Permission failures remain failures, not full-content
fallbacks. Same-query page retries retain identical wire bytes; changed content or
context makes old continuation invalid. Ordinary no-reuse and refresh reads stay legal.
No new store, model call, topic classifier or increased output budget is introduced.

DoD: permanent real-catalog and generic regressions execute delivered examples and
native tool invocation, prove exact full reconstruction (including overrides), lower
aggregate input/output plus incremental guide bytes and no additional calls. Cover
fresh direct reads, overlapping dependencies, invalid/foreign/evicted references,
permissions, revisions, context loss, cancellation/concurrency/disposal, UTF-8 paging
and no-replay recovery. Existing Runtime and App consumer suites precede Inspector
proof. This establishes delivery correctness, not model adoption or latency savings.

### Bounded informational content delivery

Discovery and Knowledge reads must bound their complete serialized replies before
native delivery. Small selected results remain complete objects. Oversized results
use explicit JSON fragments with UTF-8 byte ranges, total size, content revision and
same-tool continuation. A last fragment is not evidence that earlier fragments were
read. Assemble all matching ranges and verify content identity before treating a
fragmented definition as complete. Never drop schema constraints or advisory text.

Existing usage, schema-path and category selectors remain supported. Repeating a
discovery read is legal; a prior App return must not suppress needed content on the
assumption that it reached the model. Invalid or stale continuation refuses clearly
and directs a fresh read; refresh/rehydrate retain their recovery meaning. Continuing
one result does not reset context again or replay any design mutation. Continuations
are request/query/revision scoped and preserve cancellation and permission checks.

The App delivers one bounded page per direct tool response. Follow the returned
same-owner continuation; no assembled-body echo, output-budget increase or mandatory
Knowledge prerequisite is introduced. Native tests verify exact page bytes and
complete reconstruction. Repeated pages remain stable, gaps and mixed revisions
cannot certify completeness, and stale content requires explicit read/refresh.
Existing retained-result queries recover output without replaying product writes.

### Source and upstream evidence provenance

Offline native delivery verification may replace inference with fixed loopback
Responses events while retaining the actual native executable and tool consumer.
It must preserve the subsequent outbound request, fixture/binary identity and
explicit missing evidence using existing diagnostic storage. Never equate a native
echo, history view or scripted response with final remote model visibility. Test
configuration must not change production refresh behavior or increase output limits.
Multi-call proofs retain each direct call, actual outbound request and public
notifications through the existing evidence sink. Verify contiguous content and
revision identity; a last page alone does not establish complete delivery.

For matching discovery and Knowledge calls, retain publicly exposed native completed
result content through the existing profiler payload sink, separately from App
output. Decode JSON text before redaction; record original byte counts and digests
without claiming sanitized bytes equal original bytes. Missing/null, empty,
malformed and non-text results remain explicit. Native echo is not final model
visibility. Unsupported native output is rejected rather than treated as an App result. No private reasoning or credentials
may enter the trace. Diagnostic failure does not change tool settlement, recovery,
refresh/rehydrate or dispatch; no completed operation is replayed for recording.

Design captures host source revision and a source-scoped fingerprint at request
entry, once per invocation, and supplies both to the Runtime profiler and child
review. The fingerprint includes relevant dirty and untracked source; it is a
source observation at capture time, not proof of immutable loaded code. A
configured build revision remains authoritative. Node source capture is explicit,
read-only and inert on import; missing source access cannot fail the user request.
Runtime retains unavailable source identity explicitly. Public provider calls
whose input/output payloads are not exposed keep explicit upstream-unavailable
provenance, independent from successful timing coverage. Existing invocation and
payload identities link actual lookup/recovery inputs and outcomes; no purpose
or private service activity is inferred.

### Durable completion receipt

A completed drawing and a durable document are separate results. Final outcome
reporting asks the active document session to confirm persistence of publications
queued before that call. The session captures the applied sequence at that queue
boundary and waits outside its publication queue. Later user or remote edits do
not extend the target. The socket confirms only the same document generation and
a contiguous backend durable sequence at least as high as the target. Ordinary
persistence cadence remains unchanged. Disconnect, cancellation, Reset, conflict
or persistence failure cannot become a successful save receipt. Local-only mode
reports local-only; it never claims durable storage. Confirmation does not alter
canonical data, History, rendering or accepted drawing evidence.

### Retained reference identity and diagnostics

The request image owner resolves attachment indexes to content-digest reference
identities. Selection and source-fact admission use this owner before storing
state, so a missing attachment cannot become accepted evidence. Public source
URLs remain attributed assertions; a successful download or decode never proves
subject identity or fine-detail suitability. `validate_reference_images` reports exact
retained bytes, encoding, dimensions and reuse without a second download.

`sourceCorrections` explicitly repairs citation and verification with a reason,
preserving statement, scope and dependency versions. The existing fact-change
callback invalidates affected review evidence; changing factual content still
requires evidenced dependency changes.

Runtime retains explicitly supplied reference image bytes as local assets keyed
by content digest. Asset receipts join the request and attachment index. Final
comparison selection identifies the actual reference set; acquisition alone is
not final use. Payload diagnostics preserve opaque resource digests when URL
queries are redacted and separately record serialization, queue and write costs.
Application timings distinguish creation, transaction boundary delivery,
selection, validation, cooperative yields and orchestration bookkeeping.

### Reference applicability and source assessment

The AI decides how a source helps the task and may save its purpose, region and
limitations. Tools validate identity, access and pixel bounds. Source selection
is optional and does not gate capture, preparation, comparison or completion.

## Completion presentation

Settled answers and retained-progress explanations appear in the AI conversation.
Do not repeat them in a canvas-spanning completion/Undo toast. Ordinary toolbar
and keyboard Undo/Redo retain the existing history contract. Removing the overlay
does not alter partial outcomes, cancellation, unrelated notifications or history.

## Whole-request observation and retained query consumption

The Runtime request owns timing through final action and history settlement;
provider completion ends only a child invocation. App adapters report domain
work. Independently sequenced delivery remains available after the model stream
ends. Collection completeness requires producer end markers and contiguous
sequences; missing records remain incomplete even when product execution succeeds.
Diagnostics never delay or fail product settlement. Persistence batch work links
to all affected request sequence ranges without duplicating measured work.

A retained spatial query belongs to one document/workspace generation and
revision, including changes to potential matches outside the original result.
Creation, moves, ancestor transforms, filter changes, Undo/Redo and remote edits
invalidate affected membership/values. Pan/zoom does not invalidate world-space
queries. Referenced batch mutations validate freshness, locks and all targets
inside the synchronous canonical write boundary; stale/evicted results reject
before writes without silently reselecting. Data-dependent fill computation uses
explicit position space, finite mapping parameters and new values, never arbitrary
code. AI chooses visual intent. Full explicit data inspection remains available.

### Durable batch preparation

The backend applies ordered canonical changes from all publications in one
admitted persistence batch to one working document. Publication sequence and
identity registries remain exact; no acknowledgement precedes checkpoint commit.
A failed change or checkpoint write preserves the original document and
watermark. Retries perform no canonical apply. Preparation work counts are
asserted using the real reducer, independently of machine-specific duration.

### Retained query and fill mapping

The canonical query owner validates the complete selector before document reads,
cache lookup, retention or lease allocation. Public action and native schemas
advertise the same scope alternatives: selection has no hierarchy/region selector;
children accepts parentId; IDs requires elementIds; region requires finite workspace
bounds and alone accepts direct predicates. Result IDs cannot request property
columns. Complete region IDs exclude paging. Invalid combinations return actionable
scope/field errors with no side effects; they are never reinterpreted as another
query. To filter a hierarchy result, explicitly retain it and refine its current
snapshot. Existing snapshot ownership, cancellation and mutation admission remain
unchanged. A rejected read does not consume or release an earlier valid reference.

The App context reader retains ordered membership and requested property columns
under a bounded snapshotId, document revision and workspace identity. Repeated
pages reuse that result. `delivery=reference` returns a compact receipt for a
consumer; `delivery=columns` excludes row metadata. Scope=snapshot reads or
releases an existing reference. Canonical scene/props changes and file load
invalidate snapshots, including an outside object entering a region. Viewport
changes alone do not invalidate parent-local property columns or workspace bounds.

`map_retained_fills` is a registered batch-only action. It maps x/y parent-local
columns through a finite increasing domain and explicit piecewise-linear RGB
stops, with optional opacity and declared clamp/reject endpoint behavior.
Optional `kind: solid` writes the mapped color, solid kind and `gradient: null`
together; omitting it preserves the current paint mode and gradient. One
call may combine disjoint mappings at one fill index. It validates every snapshot,
column and current target inside mutation admission, then calls the public plural
fill API once. The mapping owner resolves fill identities through the public API
and applies selected-owner local overrides. Different owners sharing one Fill
source may receive different colors without detaching or changing unselected
source users. Duplicate selected owners reject before writing. Stale or evicted references produce
an actionable recoverable failure, never an automatic reselection or replay.

### Scoped discovery and surface grids

Definition delivery is keyed by identity, revision, representation and selected
field set. A repeated partial result references its delivered scope; recovery
restores exactly that scope. Partial definitions include ancestor constraints
and reference dependencies and do not constitute standalone validation schemas.
Category and lexical discovery return bounded pages with explicit continuation;
unknown operations return registered candidates, never inferred executable aliases.
Reference pages retain other linked/structured image candidates alongside the
representative declaration. Candidate pages do not fetch alternatives or certify
subject suitability. Selecting an explicit candidate uses the ordinary immutable
image acquisition/reuse path. Explicit acquisition of any known gallery candidate
updates the page's selected asset, including after representative acquisition
failed. Page continuation reuses the retained candidate inventory without retrying
a failed representative; a later successful selection replaces that failed
receipt. Fresh acquisition can still retry a failure. All inventory is request-local.

A `surface-grid` is a root child under the existing shared orthographic projection.
Its four world corners are ordered (u,v)=(0,0),(1,0),(1,1),(0,1), are coplanar,
and project to a strictly convex, nondegenerate quadrilateral. Rows and columns
partition normalized surface coordinates uniformly. Each motif is a polygon of
normalized cell-local (u,v) vertices, with its own key, name and fill. An optional
motif world-space `offset` translates its plane without changing order. Optional
`fills` cycles by row-major cell index and overrides the motif's default fill,
using the same fill contract as patterns; a complete per-cell list expresses
irregular material assignment without retransmitting geometry. Projection of a
motif offset is reused across its cells. No material is selected by the backend. Bilinear
interpolation maps each cell vertex to the surface, then the existing projection
maps it to the canvas. Equivalently the backend interpolates the four projected
corners, projecting the source boundary once. Signed projected offsets pass
through the existing Group normalization.

The caller chooses cell-major or motif-major painter order. Within each order,
rows precede columns and motif/vertex order is preserved. Generated keys use
`gridKey-flatCellIndex-motifKey`, where flatCellIndex=row*columns+column.
No depth sorting, hidden faces, automatic materials or executable callbacks are
introduced. Irregular geometry and holes remain on the explicit vector path.
Source motifs, expanded nodes and expanded points use the same resource contract
and cooperative preparation windows. Global key conflicts remain errors. Invalid
or nonplanar/degenerate surfaces reject before application; no approximation is
used to fit them into the supported primitive.

### Face-referenced surface boundaries

A surface-grid boundary may be four explicit world corners or `{face:key}`.
The reference selects exactly one projected-face with four polygon vertices in the
same root children or pattern members scope, regardless of declaration order.
Corners retain their authored order. No outer-scope, cross-draft, ellipse, ambiguous
or inferred targets are supported; extra reference fields reject. Existing finite,
planar, strictly convex projected boundary checks still apply. Inline boundaries
remain valid and independent; references select geometry, not face materials.

Construction resolves this source-only choice before ordinary compilation. Existing
source selection resolves from the retained complete source before dropping other
parts; a selected grid does not recreate its source face. Explicit source repair
resolves the new source values. Preserve root/pattern translation, material palettes,
keys, parents, painter order and existing truthful budgets. Do not persist a live
link, add a cache/store, change rendering or replay acknowledged work.

Selected usage and executable examples expose both forms without another query.
Formal cases cover inline/reference equivalence, forward references, invalid scope
and geometry, parts retaining a face from another batch, cancellation/recovery,
and canonical application with Undo/Redo, collaboration and durable reload. Measure
net delivery including contract cost; no timing or model-adoption claim follows.

### Shared normalized motifs

A draft may define `motifTemplates` as a root-local map of names to the existing
ordered inline motif arrays. Each surface-grid accepts either that inline array or
`motifs: { template: key, overrides?: { motifKey: patch } }`. Patches may
replace supplied `name`, `vertices`, `offset`, `fill` and `fills`; arrays replace
as complete fields. Explicit `fill` clears the template palette unless `fills`
is supplied too. Motif identity/order cannot change through an override. Unknown
keys/fields and invalid effective geometry reject before writes. The same definition
may be used by grids with different boundaries, orientations, counts and painter
orders, including pattern members. Templates are generic normalized polygons, not
semantic presets. Do not infer repeats or require template use.

Every named definition has a nonempty key of at most 160 characters and a nonempty
array of valid motifs. Missing references, duplicate motif keys, invalid definitions
and inline/reference conflicts reject before application. Definition validation and
camera-dependent offsets are reused within one construction invocation; style-only
variants reuse original validated vertices and offsets; changed vertices revalidate; each boundary and
cell mapping remains independent. All definitions and authored patch vertices count toward source admission;
each use counts its complete expanded output. Existing limits remain unchanged.

Preparation retains definitions in its existing immutable source; repair and parts
reuse that source. `read_design_templates` exports only public `motifTemplates`,
`fillTemplates`, `linearFields` and `sharedFills` from an owned prepared source. An `execute_design`
step may retain that value in App conversation context, without delivering the
geometry to the model; later requests bind its named maps into a new draft.
Definitions are immutable authoring snapshots, not live SceneTree template
instances. Reusing sharedFills values creates sources for the new preparation;
linking existing document sources requires explicit canonical property operations. Native shared Fill source edits/local overrides/reset retain their
existing Core behavior; a template edit alone never regenerates existing geometry.
No new canonical property, cache across invocations, registry or storage mechanism
is introduced. Ordinary vectors retain the inline equivalent's
geometry, material values, keys, names, parents and painter order. Independent inline
motifs, current partial receipts and no-replay recovery remain valid.

Selected usage delivers the complete inline/reference contract and executable owner
example without additional queries or pages. Compare total first-use bytes, including
instructions, example and invocation; shrinking arguments alone is insufficient.
Formal cases cover generic non-window polygons, varied planes/counts/orders, palettes,
offsets, pattern members, malformed references, source lifetime and real application,
Undo/Redo and durable reload. Saved design evidence is a regression fixture, never a
runtime special case or proof of reduced model latency.

### Retained consumer lifetime

Every reusable snapshot delivery admits a request-owned lease before returning.
The batch-only `resolve_design_targets` action is restricted to complete region IDs, without
paging or property fields. `read_design_context` always retains its handle contract.
The resolver returns copied identities without snapshot/lease
handles and does not reserve retained capacity. Internal batch target queries
use it, deduplicate selectors within that batch and release their copied values
when preparation ends. A matching retained query may supply those identities
without acquiring or releasing caller leases. Ordinary mutation admission still
checks current targets; transient results are not persistent edit authority.
Leased entries cannot be evicted; exhaustion rejects the new handoff with capacity
feedback while preserving existing consumers. Explicit release, request settlement,
cancellation and host disposal release leases. Borrowed consumers do not release
caller-owned leases. Workspace and canonical revision checks remain mandatory;
retention never makes stale values valid. AI queries default to references without
rows; explicit bounded pages and columns remain available with the same lifetime. Declarative fill
mapping may query its required position column internally, consume it and release
that lease while preparing patches. Every mapping, target lock and local target binding is checked before the one
plural owner-local write; no intermediate mutation occurs. Distinct selected owners
may map different colors while inheriting one source; no implicit source update
or mandatory detachment is allowed.

### Prepared recipe review

`review_prepared_design` is a deterministic tool-only check of compiler-admitted
source and current canonical attachment. It has no model client, assessor callback
or nested agent dispatcher. Success, failure, retry, cancellation and missing
information must issue zero model requests. Program findings are authoritative;
unknown appearance/source interpretation remains unverified and is not a data
failure. No whole-building wait or mandatory semantic preflight is permitted.

Retain source identity, coverage, attachment and dependency currency. Identical
inputs reuse program results; changed source is checked anew. Partial coverage
cannot conceal a whole-source compiler failure. The tool retains compact results
and predecessor provenance, not a second copy of canonical product data.
`read_design_attachment` resolves the actual workspace, parent, basis and bounds
through Core. Apply preserves exact parent/stamp validation after queue admission
and before the first write. Never replay mutations or check the original stamp
after successful own slices have advanced the document.

### Retained review results

The existing result store retains explicitly requested program checks and compiler
findings with their actual dependencies. Exact-ID and paged reads remain available.
Freshness checks belong to consumers that need current computation, not to final
artistic approval. Images retain canonical capture stamps for explicit pixel checks;
no model verdict ledger or required-unit obligations exist.

## Shared tool contract

All advertised tools derive input/output schemas, canonical identity and revision,
effects and lifecycle from the Runtime common tool contract. Provider declarations
are compact projections of that descriptor. Host result adapters explicitly report
outcome and settlement. The canonical `outputSchema` describes successful values;
`partialOutputSchema` covers domain partial receipts and interrupted execution
evidence. The host selects the appropriate schema from the outcome before
validating. Malformed success cannot be admitted through the partial branch. Invalid outputs retain settlement evidence without replaying the
operation. Registration and validation do not grant permission or replace the
existing scheduler. The Runtime tool specification owns the portable contract;
Design owns operation-specific schemas, actual resource access and result meaning.

`recoveryOutputSchema` declares usable failed/unknown values without changing
outcome or settlement. Compound preparation exports its child artifact schema in
single, ordered and partial receipts. Runtime transfers validated returned
references before call cleanup; a subsequent native or composed consumer must
resolve the same retained artifact without recompilation. Failed nested recipes
stop successors and return separately typed recovery receipts from pinned child
contracts. No failure or unknown write is replayed or made eligible for saving.
Request disposal and explicit release still remove the actual retained values.
Schema projections preserve local reference roots and literal data, including
inside unions and library envelopes; resource discovery reads declared schema
annotations only, never field-name conventions.

Browser actions sent to the local host carry the immutable canonical contract
from their actual definition alongside the same flat name, purpose and input
schema. The admitted action inventory is unchanged; no executor or duplicate
nested input schema is transported. The provider strips host-only metadata from
model turn text. Exact tool lookup exposes the canonical output and lifecycle
only when requested. A native action wrapper uses its successful result schema,
not an invented permissive receipt, while the browser keeps final validation and
execution authority. Generic Runtime compact discovery remains unchanged.

Native single-action results declare the primary receipt in `prefixItems`, with
its canonical action identity and successful output schema. Following measurement
or inspection receipts have their own envelope and do not weaken the primary
result. The shared validator enforces positional schemas and disallowed tails.

Keyboard history commands retain their issued direction through immediate Feature
execution and existing session finalization; they never enter the ordinary
interaction queue and later input cannot reverse the admitted direction. Replay events do not certify the outer
transaction or durable save. History grouping and document acknowledgement remain
owned by their existing boundaries.

### Durable library

Design supplies Runtime's `AiToolStore` from its local host data directory. Models
never choose storage paths or SQL. The adapter uses the project's existing Node
24 built-in SQLite, transactional expected-version writes and durable commit
acknowledgements. Inventory and record bytes have explicit finite budgets.
Unrecognized storage versions, malformed rows, contention and exhausted capacity
return errors without resetting the store or replaying product work. Connections
close at the host lifecycle boundary; reloading retains exact committed versions.
Runtime owns recipe eligibility and dependency revalidation, not the database.
The request-scoped Design coordinator binds that same registry to the existing
secured leaf executor and artifact ownership adapter. It never acquires a parent
scheduler barrier. A completed successful composition attempts durable promotion
only after host checks; execution and saving have separate receipts. Failed saving
retains bounded genuine evidence for save-only retry. Runtime retains nested child
proof behind the same root receipt and saves dependencies before the parent. Saving
uses its own actual invocation under the live native control, with start/end and
execution phase observations; a completed recipe is not shown as still drawing.
Observer failure cannot replace product or storage outcomes. Partial or uncertain work
never becomes eligible or triggers replay. A saved candidate can be resumed through
Runtime revalidation in a later request. Request disposal releases library state
only after started invocations settle; persisted definitions remain on disk.

Native authoring controls expose Runtime's canonical finite recipe grammar for
submission, return precise admission repairs, dispatch exact registered revisions,
and report saving separately. Save-only and availability management do not execute
product actions. Controls are excluded from composition. Their coordinator does
not hold the host leaf scheduler barrier; leaf calls retain normal admission.
Existing API discovery exposes current registered contracts and their execution
routes, including recipes admitted during the request. A host registry generation
invalidates the request index after registration, load or availability changes;
unchanged definitions retain their compact delivery and explicit refresh path.

Implementation references: <a href="https://nodejs.org/download/release/v24.13.0/docs/api/sqlite.html" target="_blank" rel="noopener noreferrer">Node SQLite API</a>
and <a href="https://www.sqlite.org/pragma.html#pragma_synchronous" target="_blank" rel="noopener noreferrer">SQLite durable synchronization</a>.

The drawing provider creates that request host before inference, loads current
eligible definitions, and advertises the four library controls alongside native
tools. Discovery returns each canonical `registeredName` and revision separately
from its native namespace route; admitted recipes route through `invoke_tool`.
Each recipe child uses the existing batch receipts, phase observer and execution
boundary. Child tool traces retain causal parent IDs and matching start/completion
events. Connection checks and isolated assessments do not open the library.

`AI_TOOL_LIBRARY_DIR` selects the host directory (default
`.app-data/ai-tool-library` relative to the App server). Store-open failure is
recorded and explained without blocking native tools or resetting persistent
state. A later storage operation can retry opening; product execution is never
replayed for storage recovery. Shutdown waits for active calls before closing
the connection. The host excludes this persistent local data from Git.

### Purpose lifetime

Every ordered invocation start and end updates canonical activity state before
visible deduplication. A completed call's purpose expires. The primary AI publishes
a short concrete stage intent (target and purpose) through existing public
commentary before preparing inputs, and replaces it when the stage changes.
Stage intent is contextual, not proof of execution. A new principal start retires
preceding request commentary; completing that principal never restores it. Unscoped
commentary received during principal work is informational and cannot become a later
current task. Explicit call-scoped purpose follows that call. A new idle commentary
may establish fresh context. Retry, saving and terminal settlement retire it.
When no current operation or fresh purpose exists, show the most recent principal
settlement with an explicit completed, partial, failed or outcome-unconfirmed label.
Consume canonical toolOutcome, never equate transport completion with success. The
existing closed-call metadata retains identities and receipts for the current group;
concurrent groups settle only when every root ends. A surviving root remains current.
The original objective stays in the conversation, never the idle activity fallback.
No additional AI evaluates or authors status.

Display the common genuinely live principal invocation purpose before retained
stage intent. Descendant purposes remain diagnostic and never replace the
principal public task.
Show the observed operation separately from authored context. Admission/queue
churn preserves its operation description; meaningful operation changes update
immediately. Without a live call, label retained prose as Current task rather than
claiming that drawing is executing. Without authored purpose show only observed
work. The objective is contextual only; it cannot supply an active call purpose.
All lifecycle events and actual owner phases/counts remain in diagnostics. No timer
or debounce suppresses events. Stopping, approval, saving and terminal outcomes
immediately override normal work presentation.

Call purposes retain authored identity, scope and revision across phase-only
updates. Resolve inheritance from live ancestry, never copy it into a child as
new authored text. Independent concurrent principal invocations use their common
purpose; one sibling cannot represent unrelated work. Distinct principal operation
labels remain visible together with their count. Child phases and leaf counts
remain complete in diagnostics without becoming public task labels. Closing a
parent closes dependent children, preserves
independent siblings and rejects late events. Omitted parent metadata preserves
known ancestry. Request objective remains conversation context, not stage evidence.
Registered operation descriptions remain system activity; preserve their diagnostic
expectedResult/expectationSource without promoting them to authored purpose.

The current-purpose preview occupies at most three message lines. Keep its full
text in the DOM and title for accessibility and inspection; this presentation
bound does not shorten the request, alter lifecycle or revive a completed purpose.

### Diagnostic delivery lifetime

Diagnostic records are committed to the host's local outbox before transport.
Transport failure suspends delivery while bounded capture continues. The outbox
retains each stream until a matching, contiguous terminal durable acknowledgement.
Reconnect and restart resend stored evidence through the same collector, which
validates duplicate content rather than duplicating it. Recovery never invokes
an App operation. Resource, quota and persistence failures are explicit recording
failures; they do not alter product completion or claim a complete trace.

#### Composition artifact ownership

The Design host publishes each retained handle to its request ownership adapter
with a real release callback and freshness validator. Pinned input/output schemas
identify request references; property names never establish ownership. Borrowing
requires caller/request ownership, and returned references transfer before child
cleanup. Live pins cannot be evicted or explicitly released by another call.
Unreturned local intermediates are released at completion or failure; exported
references survive until explicit caller release or request termination. Resource
limits reject new ownership before changing existing pins. A release failure stays
retryable and cannot make an unavailable artifact appear valid.

Prepared sessions publish their immutable artifact to that adapter with actual
store cleanup and existence validation. Target-set handles alias the backing
artifact and keep it alive. Failed publication removes only the newly created
artifact; target-set admission is atomic. Explicit release validates every target
before changing the session, and borrowed artifacts stay intact.

Retained browser query handles also belong to their creating request signal.
Remote snapshot reads, release and mutation consumption enforce that identity
before returning data or writing. Repeated selectors within the same request
reuse work; a later request receives a separate capability. Terminal cleanup
removes only the settled request's entries and pins.

Preparation definitions declare request-reference lifetimes at the actual input
and output fields. Preparation and retained target selection are composition
leaves; explicit resource release is control-plane. Rejected draft diagnostics
have bounded request ownership for the next corrected invocation, independently
of failed call cleanup. Diagnostic capacity refuses new retention without
evicting an already returned repair source. Host publication refusal removes the
unpublished source; terminal release removes the actual retained source.

The Design request host registers namespace-qualified native identities and
compositions in one Runtime registry. Both routes dispatch leaves through the
same scheduler and native admission/outcome boundary. Library controls are
coordinators outside the leaf barrier; their selected revision projects nested
input/output reference schemas before execution. Actual reference exports pass
through the caller to the request before cleanup. Native cleanup failure returns
execution evidence without replay; shutdown waits for active calls and supports
retrying failed release while refusing new work.

Basic public API schemas mark document identities at their semantic declarations,
including element/property/vector targets and successful creation ID receipts.
Field names, color values and labels remain ordinary values. Recipe literals
cannot capture those identities; use fresh input or a preceding successful
receipt. Polymorphic read values stay opaque instead of inventing a return type.
Direct public API validation and dispatch are unchanged.

Canonical basic operations are registered once for typed recipe binding using
browser-owned contracts and the secured existing operation executor. They remain
registry-only capabilities: native provider declarations still expose the plural
batch interface, not every basic method as a native function. Exact discovery
returns the registered identity, revision and library invocation route. Neither a
recipe nor direct library invocation bypasses browser admission, Undo or review.

The AI query producer and release control are separate: read_design_context has a
successful live-handle output; release_design_context has only historical release
evidence and is not a recipe dependency. Both delegate to the existing retained
browser query owner. The server publishes actual snapshot/lease aliases into the
shared host ownership adapter, rejects explicit release while another invocation
borrows them, and requires a browser acknowledgement for release. Failed handle
publication cleans up newly created browser state without retiring another
consumer. On request cancellation the browser transaction-finally is authoritative
for releasing request data even after host transport becomes unavailable.

# Image products in reusable tools

The request image owner publishes actual vector artifacts to the common host
ownership adapter. A component-analysis or contour-review handle aliases its
source artifact, so a dependent consumer pins both the report and required source.
Explicit refinement produces a separately owned artifact with its own contour
lineage. Releasing a source removes its stored reports and conversion reuse entry;
it does not remove an independently retained derived artifact.

A cache hit explicitly borrows the retained artifact for the current invocation
before returning it. Borrowing validates current request or ancestor ownership;
it cannot acquire a private sibling's product. Publication refusal removes the
unpublished result and preserves any existing source. No conversion or write is
automatically replayed after handoff failure.

Contour review, component analysis and explicit refinement are composable using
fresh request handles. Relative path and proposal keys remain values interpreted
within their parent artifact. Attachment acquisition and explicit reference selection can compose in a request
sequence, but cannot be stored as recipe dependencies. Other unadmitted source
controls remain native-only: their numeric provider attachment
selectors are not persisted recipe identities. All native operations continue
through the common invocation and outcome contract.

Before each new composition, the library checks the exact current saved state
of the root and every admitted composition dependency, once per identity in that
admission. Native leaves retain their existing secured execution boundary.
Suspended/retired entries reject even when this request previously loaded them.
Unavailable storage refuses a known saved revision; a private candidate whose
initial save was never acknowledged remains locally usable. Already-started
validated graphs finish with their pinned revision, and later saving cannot
republish a revision retired during that work. State management and saving do not
replay canvas edits.

Provider teardown attempts host disposal and storage closure separately after
active calls settle. Each records duration and outcome using host observations;
a cleanup error cannot replace the original product outcome or its error.

### Work deadline and resource cleanup

The work deadline closes model operation admission, not the lifetime of resources
needed for final reporting. After active work settles, the existing host releases
its retained queries through the observed browser dispatcher and checks real
acknowledgements. Owner-created cleanup is internal lifecycle work; the model
cannot select it or use it to execute late operations. Actual mutation deadlines,
permissions and request/borrow ownership remain enforced.

True cancellation or disconnected transport leaves request-data release with the
browser transaction-finally owner. Completion, partial work, failed reports and
cancellation all release only their own request data. Cleanup must not requery,
redraw or change history. Release failures remain explicit and retryable without
reopening work or repeating successful releases. Provider result settlement and
resource cleanup outcome remain separate; neither a completed provider nor an
aborted transport is evidence of acknowledged remote cleanup.

### Saved tool management in the conversation panel

The existing panel exposes an on-demand saved-tool list with description, revision
and stored availability. The local same-origin management endpoint delegates to
Runtime's canonical store management; it does not invoke a model, register a
second catalog, mutate the drawing or change Undo. List failures remain visible
instead of appearing as an empty library. Incomplete/corrupt inventory is explicit.
Suspend and Remove carry the exact revision and observed store version. A stale
write rejects without retrying; Refresh retrieves current metadata. Retired rows
cannot be resumed by these controls. Availability is rechecked before future
invocations, while active pinned work retains its documented lifecycle. Closing
the list cancels pending UI reads and ignores late responses. Provider and panel
use the same configured AI_TOOL_LIBRARY_DIR and existing SQLite adapter.

### Durable recording gaps

Runtime reserves a bounded outbox control slot before payload capture. A lost
capture or failed append retains a compact enclosing sequence range and typed
capture/storage cause where storage allows. Repeated loss coalesces control work;
metadata contains neither discarded payloads nor unbounded error strings. It does
not imply that every sequence inside the enclosing range was lost.

The browser stores control at a reserved negative sequence in the diagnostic
outbox, outside nonnegative payload reads. Gap updates replace reserved padding,
remain discoverable across restart even without payloads, and are removed only
with that request's outbox. Recovery reports a retained gap and cannot acknowledge
complete recording, fabricate events, or repeat product work. Reserve/gap writes
can also fail under quota exhaustion; those failures are explicit, so lossless
recording is not promised. Product completion remains independent.

Nested Runtime observations retain their pinned revision and admitted parent
recipe name/revision/step ID in the existing execution record. Repeated same-tool
steps remain distinguishable without replaying arguments or guessing from order.

### Retained predicate selection

Refinement preserves the retained result mode before serialization. Element-mode
results omit the optional `elementIds` property; identity-mode results retain an
ordered array, including an empty array for a valid empty selection. Page and
column delivery must pass the registered output contract using the raw owner
result. Refinement and paging reuse retained rows without another source query.
Input diagnostics identify `arguments`; result diagnostics identify `output`.
Validation stage, observed result and settlement remain available on failure;
output rejection never authorizes replay or a different source query.

Region filters and current snapshot refinements support literal name equality,
prefix and suffix in addition to canonical type, parent, ancestor and lock filters.
All supplied predicates are conjunctive. Refinement returns an independently owned
snapshot of the retained candidates; it never repeats the region lookup or broadens
empty results. Optional expectedCount is an exact complete-match precondition,
checked before returning targets. Reference delivery contains handles and counts;
explicit pages remain available. Freshness, request ownership, cancellation and
mutation admission apply unchanged. Names are not unique identities.

### Capture and deterministic review responsibility

Mechanical evidence belongs to the browser deterministic reviewer, not the image
receipt owner. Its coverage binds the actual supported rules and traversal
context: root-only checks do not establish containment in an external parent.
The supported rectangular containment rule uses Frame dimensions, not arbitrary
container or Group dimensions. Group dimensions are operation snapshots, not
containment constraints. Group ancestry remains part of subtree coverage. A Group
inside a Frame is checked using its read-only canonical descendant rectangle union
and translation, using Preset's geometry owner; inspection never normalizes or
rewrites Group/child coordinates. Unknown geometry stays incomplete. An undeclared
custom container does not acquire a containment rule from `isContainer` alone.
Known changes preserve a receipt only if the checked rule inputs remain equal;
paint or stacking order alone must not retire unchanged mechanical findings.
Geometry, measured text, inherited visibility, parent dimensions and membership
must be considered where consumed. Unknown changes, document replacement and
owner disposal retire receipts. Cancelled, incomplete or mixed-source checks
issue no current evidence. Validation returns a causal failure reason and never
promotes a mechanical receipt into visual or attachment coverage. Exact checked
coverage stays browser-owned behind the receipt; server coverage reconciliation
is a separate consumer change. Existing image dependency rules remain unchanged.

Capturing an image does not execute deterministic subtree checking. A requested
post-write image may run after acknowledged writes without a mechanical approval
pass. Deferred capture performs no follow-up quality reads. Explicit mechanical
analysis remains available and validates its own inputs, scope, freshness and
outputs; it cannot create an implicit completion prerequisite. Preserve acknowledged
writes and actual capture failures. Cancellation and unknown write settlement
prevent dependent capture; neither permits replay of a completed mutation.
Check tails return `checks` counts and an optional `firstPendingId`, readable
through `read_design_checks`; they do not retransmit every retained finding.
Confirmed target removal retires its tool-owned result and makes actual dependent
checks stale, preserving unrelated and primary-agent obligations. Recreated IDs
receive a newer check revision. Explicit result reads refresh only the requested
checks and transitive declared dependencies. Independent preparation freshness
failures are retained as stale results without preventing other selected reads;
cancellation still stops the read.

Final AI verification uses the observations and explicit checks selected for the
request. It does not automatically measure every previously changed target.
The browser runtime retains completed deterministic node verdicts under its live
canonical observer. Known changes invalidate affected nodes and geometry-dependent
ancestors; parent dimensions and inherited visibility are explicit rule inputs.
Text results retain their actual element dependencies. Unknown changes, file load
and disposal invalidate retained work. Cancellation and mixed-source evaluation
cannot publish new verdicts. Without a canonical observer, evaluate uncached.
Reports count summary aggregation separately from canonical reads, evaluated or
reused nodes and actual text measurement.
Completion revalidates both visual and measurement evidence; neither substitutes
for the other.

### Attachment dependency currency

An attachment receipt depends on its actual workspace, parent ancestry, editable
container membership, local bounds and workspace basis. Known changes lazily
revalidate this small canonical signature once; child edits that do not change
attachment geometry preserve the receipt. Parent geometry/ancestry changes,
removed or locked containers, unknown changes, document replacement and disposal
invalidate it. Preparation refresh validates each retained receipt through the
browser owner, never compares scoped receipts with a newly captured workspace
stamp. Validation failures remain stale/unverified and never certify application.

### Automatic prepared-source results

Successful artifact publication records existing compiler findings in the same
request-owned check store used by preparation and drawing review. No additional
review invocation, model or scan is required to retain those results. Explicit
prepared review supplies attachment/coverage evidence and reuses the source unit.
An owned declared predecessor continues the same source obligation; its temporary
new source result is consolidated without dropping unrelated or visual obligations.
Compiler-rule and immutable source identity are distinct from current canvas
evidence and handle availability. Application receipts acknowledge actual effects;
later edits require canonical checks, never source approval as canvas proof.

### Purpose continuity after execution

Completing a call retires its call-scoped purpose and execution phase. A separately
authored current stage intent survives; a completed call does not establish one.
Use the Purpose lifetime contract above for stage replacement, visible deduplication,
concurrency and lifecycle precedence. Diagnostics retain actual phases and call
counts even when a stable concrete stage produces no visible text change.

### Mechanical verification in reusable tasks

The registered deterministic review action publishes domain-owned verification
paths. Its registered target is a document runtime reference, supplied by current
input or acknowledged output when composing; saved recipes cannot capture a
request-specific target as a literal. Its mechanical verdict is pass only when supported checks are complete and
no findings remain; known text/container overflow may enter an explicitly declared
repair recipe. Incomplete or unsupported checks require primary-agent judgment.
The verdict never certifies appearance or request satisfaction. Stable progress
identifies the target and normalized unresolved findings, excluding fresh evidence
IDs, viewport state, diagnostic timing and reuse counters. The verdict is produced
inside the canonical evidence capture boundary; later writes still invalidate the
applicable stored checks through their actual dependencies.

### Mechanical coverage selection

A deterministic review accepts optional unique `measurementTargets` IDs or the
`descendants` selection. Explicit IDs return only requested captured identities;
an explicit empty list stays empty. Automatic selection returns actual captured
descendants, excluding the root, in the same successful capture reply and receipt.
Selection consumes completed reviewer coverage without more geometry reads. It
certifies scope only, not compatible rule context, freshness, findings or visual
quality. Incomplete/cancelled captures never authorize reconciliation.

Explicit mechanical review may request descendant coverage. Its results retain
actual target identities, supported rules, findings and canonical currency. A
complete recheck may reconcile earlier results within that proven scope; omitted,
unsupported or stale targets are never reported as passing. Reads validate scoped
receipts without repeating geometry work. Cancellation prevents late adoption.
These results support requested diagnostics or declared mechanical iteration; no
automatic post-write review or task-completion obligation is created.

### Canonical mutation inspection scope

Basic mutation receipts expose `mutationScope` with `complete`, `elementIds` and
`removedElementIds`. The browser observes actual Scene Tree/Props publication
inside the admitted synchronous execution through transaction settlement, not
while waiting for another transaction. Shared-property owners and changed
structural parents are included; workspace roots are not whole-scene targets.
Only these touched identities are resolved against canonical metadata. Unknown
publication/resolution yields incomplete scope, never an empty verified scope.
Read, viewport and selection receipts do not create document-check obligations.
The server consumes exact matching mutation acknowledgements before compact
delivery; it never infers a mutation from arbitrary result field names. Empty
complete scope creates no new check or visual invalidation. Missing or incomplete
scope remains unresolved. Failure/cancellation keeps existing settlement authority,
releases observation, and cannot trigger replay or fabricated completion.

Retained position-to-fill mapping returns this same scope from its complete
admitted owner-local target set after the canonical write; unchanged users of the
shared source are not affected. Native arrangement
and reorder retain their declared applied identities; prepared compositions retain
their coherent root inspection unit. These paths do not guess scalar input names
or expand a full document to find affected owners. Current selected-owner write and retained-mapping contracts advertise revision 6; unchanged read,
selection and viewport contracts retain revision 2. Saved recipes with replaced
dependency identities fail admission before execution and must be corrected using
the currently advertised contract. There is no old-output fallback.

### Mechanical delivery and unresolved write scope

Explicit checks retain complete findings in the request-owned check store and
return bounded summaries. `read_design_checks` provides selected details with
revision-aware paging. A changed store rejects stale continuation rather than
silently mixing versions. Check results describe supported measurements; they do
not certify appearance or control whether the AI can finish the task.

Missing, incomplete or mismatched mutation scope remains an execution failure.
Further writes stop when the prior write state is unknown. Reads and diagnostic
captures remain available; no check can reconstruct an unacknowledged write or
authorize its replay. Preserve successful work and report the actual limitation.

Overview and crop captures retain independent identities and canonical stamps.
Foreign, tampered or stale source identities reject at the actual consumer. No
criterion, unit count, binding, verdict or multi-image acceptance ledger is required.

### Primary-agent remaining-work segments

An interrupted recipe returns its declared acknowledged recovery. The primary
agent retains the original intent, consults current capabilities and pending
checks, and invokes or authors only unresolved work as a new admitted execution
segment with current input identities. It does not rerun initial creation. Library
resume restores candidate availability, not a program counter. Unknown mutation
scope retains its existing write-stop boundary. Repeated provider call identities
are rejected before another dispatch; a new call identity is a new intentional
invocation, not permission to assume prior unknown work rolled back. Failed save
uses the successful receipt with save_tool and cannot replay product work.

### Deterministic aligned image checks

`check_drawing_image` compares a current native `inspect_drawing` region with an
explicitly corresponding same-size crop from an immutable reference attachment.
The primary agent declares alignment; the tool does not infer perspective,
resample images, judge semantic appearance or call any model. Captures isolate
the target subtree and use white, so this check does not prove external canvas
occlusion. Whole-image checking uses the full native region within the existing
capture limit. Missing mapping, overview scaling, mismatched dimensions, corrupt
or unsupported images remain unverified. Animated images are unsupported.

Both images are oriented and converted to sRGB on white. The result includes
changed pixels/fraction, maximum channel error and the changed bounds in target
coordinates. Tolerance is explicit and fixed with the baseline digest and target
region for that checkId. Returned checkId continues the same obligation;
resultId reads it in `read_design_checks`. A fresh capture may update that check
after correction, but cannot relax its tolerance or change its baseline/scope.

The existing request check store retains tool-origin evidence and exact image
receipt dependencies. Before reuse and after asynchronous comparison, the browser
validates canonical dependencies. Reuse does no decode or pixel iteration;
default reads and final validation refresh image dependencies too. Unrelated edits
and viewport changes preserve evidence when the canonical receipt remains valid.
Changed evidence, decode failure or cancellation never creates a pass. Compact
pixel results are diagnostic facts; main-agent visual acceptance remains separate.
The input's request-local inspection and numeric attachment selectors are control
plane values, not portable recipe literals or durable document identities.

### Ordinary creation input normalization

Core owns ordinary creation input normalization and delivers its resulting
ordered descriptors directly to the existing Scene Tree creation owner.
Preserve defaults, explicit overrides, supplied/generated identities, input
isolation, scalar/plural and inert-empty semantics. Intermediate envelopes that
have no consumer must not require another batch traversal before owner admission.

Preserve complete frozen results, geometry/materials/order/parentage, invalid
input rejection and transactional partial-result/no-replay recovery. Existing
constructor validation, history, collaboration and persistence remain authoritative;
no new cache, tool exchange or caller-input mutation is permitted. Verify both
semantic preservation and actual normalization work in the real creation flow.

### Ordinary creation result handoff

The existing Scene Tree ordinary creation owner produces one detached frozen
ordered ID list per completed batch. Core and App adapters forward that same
read-only result without allocating another ID list. This is result forwarding,
not suppression of complete batch output or necessary tool receipt aggregation.

Preserve scalar and inert-empty behavior, invalid-input/parent rejection, order,
isolation from mutable inputs/membership, old snapshots, partial committed
results and remaining-only recovery. Later edits, history replay and reload do
not modify returned lists. No new cache, transport turn, delayed publication,
batch enlargement, compatibility copy or change to UI snapshots is permitted.
Prove actual downstream copy counts through the real creation flow with full
and compact receipts, failure/cancellation and persistence preservation.

### Computed snapshot selection

Mechanical review's selected geometry fields must reach the existing computed
snapshot owner before any full-field projection is materialized. Read only
requested own enumerable values; deduplicate names without reading omitted
fields. Core retains input validation and detached snapshot isolation. Full
reads remain available independently, while empty selections, missing elements,
missing fields and workspace observations retain their existing results.

No new cache, query or transport exchange is introduced. Preserve fresh reads,
mechanical verdicts, coverage, local invalidation, cancellation and partial
no-replay recovery. Prove work counts through the real owner and default review
adapter together with unchanged document, history and shared-state behavior.

### Mechanical review structural reads

Deterministic review obtains structural facts from current Core metadata and the
complete ordered child query. Leaves do not request child lists; nonempty
containers must not be truncated to a default page. Do not save or clone full
element data and unused property references for structural inspection. Computed
geometry and text measurements retain their existing owners and required work.

The reviewer keeps its existing verdict cache, change invalidation, cooperative
cancellation and receipt lifetime. Findings, coverage, supported-rule judgments
and unavailable results remain equivalent; missing, mixed, stale or cancelled
work never becomes a pass. Structural read optimization does not add transport,
mutable state or a cache, replay writes, mutate document/history/shared state, or
remove independently valid full-data queries. Prove actual canonical save/copy
counts through the default adapter as well as semantic and recovery behavior.

### Mechanical inspection transport

Mechanical measurements and dependency validation use bounded exchanges of at most 64 independent exact-target actions. Each target retains its own evidence and finding status. A known fail-fast action failure preserves acknowledged prefix results and may continue only the proven unexecuted read suffix; unknown outcomes remain unverified. Cancellation prevents late adoption and further dispatch. Grouping reads never replays acknowledged document writes or converts missing checks into passes.

### Discovery continuation and activity diagnostic consistency

Discovery category/query continuations carry a request-local catalog revision.
The host invalidation counter refreshes the existing inventory, but only a changed
ordered descriptor fingerprint advances the catalog revision. Failed/no-op library
operations leave continuations usable. Compute the fingerprint only on inventory
refresh, retain no page snapshots and reuse it for unchanged-generation reads.
The consumer forwards `next.arguments` unchanged. A changed registry refuses the
stale continuation before returning entries; restart the selector without offset
or revision. This guards dynamic tool registration/removal without retaining a
second catalog. Continuation admission uses the same input rules and registered
category choices as direct invocation, including mutually exclusive selectors.

Activity diagnostic `phaseLabel` represents accepted live leaves, independently
of the visible authored stage. A coordinator update cannot hide a running child;
a completed or rejected event cannot describe ongoing execution. Once all calls
finish the diagnostic phase belongs to the provider. Raw incoming events remain
recorded for causal analysis. Stage intent is supplied by the primary agent and
is not evidence that canvas pixels are currently changing.

### Recorded handoff correction

Discovery selection and representation are independent. Exact, category and query
selectors accept usage/full views; category/query default to compact menus and
retain bounded pagination and registry revision. schemaPaths needs exact identities.
Usage does not consume the full definition; continuation retains its representation.

Capture replies expose requested images, target identities, canonical stamps and
actual failures. Partial delivery preserves successful observations. The AI decides
which observations it needs and whether the result satisfies the request.

Current activity uses the live common call purpose before retained stage context.
Observed operation and authored purpose are separate visible facts. Admission/queue
churn preserves a stable operation description, not an obsolete stage action; exact
phases remain diagnostic. With no active call, stage prose is explicitly labeled
as context. Completion removes call purpose; concurrent ancestry and lifecycle
precedence remain authoritative. No timeout-based guessing or extra model call.

Current-operation changes do not append identical authored subjects to history.
Derived history replaces only its current projection; it never mutates earlier
snapshots or suppresses diagnostic events.

A known tool queued or admitted before execution is labeled as preparation for
that operation; only execution presents the operation as active. Admission repeats
preserve the existing description. A late preparation phase does not turn an
already executing call back into a queued operation.

A capture describes its actual whole-target or target-local region. A regional
image does not claim to display uncaptured content. The AI chooses any additional
view needed for its final verification; there is no whole-view certification gate.

Runtime-authored direct action starts have paired completion activity on success and
failure, before another action or terminal outcome. Abort continues to suppress
observer notifications; the returned cancelled outcome retires App activity.
Completion ends activity ownership; the canonical outcome still determines success or failure.

Native research and App call starts/ends update actual operation ownership.
Principal starts retire preceding request commentary. Overlapping and late completion
events retire only their own call and cannot clear another active principal. Research diagnostics remain separate from mutation.

Completed provider call identities remain closed for that request. A repeated or
late native research start cannot attach an old call to new commentary, prolong
that purpose, or disagree with the activity projector's closed-call state.

## Tool-first correction contract

The primary agent owns intent, creative decisions, recipe authorship and final pixel
judgments. Design tools own deterministic checks and exact dependency invalidation.
Runtime owns admitted finite orchestration, not domain diagnosis or repair invention.
No drawing or prepared-review route opens another model. Explicit execution-report
analysis is a separate caller-requested diagnostic service. Remove the independent
visual-assessor provider/export/options/results. Shared check data retains tool-origin measurements and currency. The AI owns
visual decisions and final verification. No formal judgment submission, structure
approval, pending-coverage ledger or completion veto is retained.

Vector conversion accepts only `componentMappings` with eligible analysis
receipts; `ovalPathIds` is rejected, never translated or silently ignored.

### Mechanical closure interface

The existing inspect owner exposes `verify_design_checks` through the common tool
registry. The same request-owned result store supplies native and composed callers.
Input is a closed object `{ requestId, checks: [{ checkId, revision }] }`: the
actual host request identity plus a nonempty unique
selection of request-owned tool-origin check identities and their exact retained
revisions. Compare `requestId` to the invocation owner before resolving records;
logical check IDs can repeat in another request. Successful native `review_design` output includes `mechanicalSelection` with the
same request identity and ready-to-bind selection; aggregate output carries
`requestId` and the complete `checks` selection directly. Mark this selection as Runtime
request-lifetime input; it cannot be captured as saved recipe literals. Scope,
canonical target and typed recheck descriptors come from those owned records,
never model-authored arbitrary IDs, a viewport, diagnostic text or a second store.
Existing transport/iteration budgets apply; work is chunked internally. A selection
with unknown, mixed ownership, wrong origin or conflicting revision is rejected
before checking or mutation. The operation never mutates the document.

Successful output contains the same `requestId`, `verification: { status, progress }`,
`results` in the existing compact check-result format, and exact unresolved check identities/revisions,
reasons, typed pending findings and recovery. `status` is `pass`, `repairable` or `decision-required`;
`progress` is a nonempty stable string identifying normalized unresolved mechanical
work for the selected logical obligations. It excludes result revisions, fresh receipt
IDs, timing, counters and viewport state. Equal unresolved work produces equal progress,
so repeated no-op checks or a repair cycle cannot bypass Runtime's repeated-progress
stop. Counts remain diagnostic fields, not the verification token. The registry declares
`/verification/status` and `/verification/progress` with required typed output fields.
Output also supplies `checks` with every remaining selected identity and its current
revision, including passes; `unresolved` is only the pending subset. An admitted recipe
passes this acknowledged selection into repair. Every successful repair receipt carries
the complete resulting selection with current revisions, so the next check binds from
the last repair receipt, never initial versions or a pre-repair snapshot. If repair
only invalidates dependencies without changing revisions, it still returns that exact
selection for canonical revalidation. Partial/unknown repairs cannot supply a successor
success binding.
Canonical retirement is reported explicitly; a repairable result always retains a
nonempty selection. Preserve confirmed terminal retirements within the selected
logical obligations so Runtime can perform its mandatory next check on a nonempty
selection. All-retired work passes only after this explicit terminal verification;
missing IDs do not prove retirement. Keep terminal provenance in the same request
check owner, and reject old selections when an identity is recreated.
A stale result revision is a recoverable input conflict, not permission to drop an
obligation or restart initial writes. Exact revision matching alone is not currency:
existing dependency invalidation can change status without advancing that revision. Pass requires
complete coherent current mechanical coverage for that selection. It does not grant
visual acceptance, whole-task completion, recipe eligibility or document durability.
Repairable requires every remaining finding to have an owner-declared mechanical
repair capability. The inspect owner returns their exact capability IDs and structured
finding arguments; it cannot infer which recipe called it. An admitted recipe must
cover that complete set. Because Runtime executes its finite repair list without
domain branching, `repair_design_checks` validates the complete set, request identity,
current finding receipts and explicit repair policy before any write. Each prescribed
position includes current `attachmentEvidence` from `read_design_attachment`; its
canonical receipt must belong to the stated parent and workspace. The synchronous
mutation owner rechecks that original basis and preflights all ordinary edits before
the first write. Mechanical stamps must be current at their issuing deterministic
reviewer; attachment stamps must be current at the existing attachment owner.
The two owners are explicit dependencies, not interchangeable `isCurrent` checks.
A visual stamp cannot authorize mechanical repair, and a valid mechanical stamp
cannot replace the original parent basis. Check both inside the synchronous
mutation boundary; never fall back to another owner or scan asynchronously there.
The first
supported policy sets prescribed parent-local positions for eligible existing
children with container-overflow findings, through the existing App APIs. It does
not infer positions, resize ancestors or support arbitrary finding families. A mismatched or mixed unsupported set stops with
exact unresolved work and no repair writes. Runtime validates registered schemas,
bindings and budgets; it does not infer dynamic domain coverage from status alone.
Findings without a declared repair require a primary-agent decision. Empty work after canonical deletion can
retire only the deleted target's own check; unrelated results remain unchanged.

Known admission failures return `not-started` without a fabricated write receipt.
This includes queue-time read-only preflight rejection before the first write.
An exact failed action identity with no acknowledgement and explicit not-started
settlement does not create unknown mutation scope. Fresh evidence and an explicitly
renewed policy may proceed; errors from writers retain their actual unknown/partial
settlement and cannot be reclassified by this preflight boundary.
After execution starts, partial/recovery carries the actual receipt and complete
current check selection. The owner result validator must use the verification
schema for checks, not require action acknowledgements from a read-only verifier.

Partial/cancelled/unavailable outcomes retain independently acknowledged results and
exact outstanding identities; they are not successful verification bindings. Before
publishing any pass the owner validates captured dependencies against the current
canonical state. Safe read recovery retries only incomplete work. Unknown write
settlement is reconciled by apply/settle, never by this reader or by replaying writes.
Pan/zoom is not geometry change; region membership changes, contributing ancestors,
shared properties and actual user-criterion changes invalidate their true dependents.

Runtime consumes the typed verdict using its existing verification contract and
finite repair list. It checks registered dependencies, bindings and budgets before writes,
stops on no progress/unsupported findings/cancellation, and exports real receipts
before releasing child resources. It cannot infer a new repair or invoke a model.
A successful direct edit needs no recipe. Missing reusable capability is authored
by the primary agent, admitted by Runtime, invoked through the same host, then saved
only when eligible. Save-only retry never repeats a completed product mutation.

### Cross-owner handoff cases

These product cases apply to their named routes. Proof must use the relevant
captured source; structural admission alone does not establish runtime correctness.

| Case              | Producer -> consumer                             | Required success and failure behavior                                                                                                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current contract  | compose/inspect -> host and primary judgment     | Canonical oval conversion and primary visual fail/correct/pass work; removed alias rejects before dispatch and no independent assessor capability exists.                                                                                                                                                           |
| Aggregate closure | apply receipt -> inspect -> Runtime verification | Fresh receipt closes selected stale mechanical checks, preserves unrelated visual passes, and executes one admitted known repair; actual Runtime admits the string progress contract and acknowledged revision binding. No-op/cyclic repairs and wrong/mixed repair capabilities stop without initial-write replay. |
| Freshness race    | canonical edits -> inspect -> settle             | Edit, Undo/Redo, collaborator change or cancellation during check cannot publish stale success; retry only safe reads, preserve unaffected records, and return exact incomplete scope.                                                                                                                              |
| Delegation        | discovery -> admit/register -> host/invoke       | Exact spec -> invalid recipe correction -> eligible invocation through real host; unsupported intent returns a decision; suitable direct tools need no forced composition.                                                                                                                                          |
| Reuse             | invoke receipt -> persist -> fresh request       | New input yields new artifacts; failed save retries only storage, revoked dependency rejects, expired transient handles require reacquisition.                                                                                                                                                                      |
| Settlement        | inspect/apply -> settle -> visible result        | Stage replacement and call start/end ordering are truthful; Stop/partial writes/cleanup failure preserve actual progress; document-save failure, recovery, Undo/Redo and fresh reload are independently proven.                                                                                                     |

Accepted historical evidence is immutable; obsolete executable behavior is
removed, not emulated. Execution order and stage scope belong to the active
implementation plan rather than this product specification.

### History input admission

Factory replay state is the sole busy authority. During Undo/Redo, the App ignores
new history shortcuts before input dispatch. Accepted history input never enters
the ordinary Feature queue. Core reads the
composed Factory directly; no mirror, timer or independent lock is introduced.
Only explicit false from an input combination callback suppresses its dispatch.
Other input and ordinary void callbacks retain their normal semantics. Accepted
history commands retain their issued direction, while model state is resolved by
the existing Feature. Failed replay preserves canonical compensation and releases
admission through ordinary Factory settlement. Ignored input is never replayed.

When idle, the registered history Feature begins synchronously. An active drag
ends through its existing commit-current session finalizer and then is undone.
Only an already-running handler may need to settle first; unrelated queued work
cannot run ahead or interleave. This sequencing belongs to the existing Feature
interaction owner, not an App history lock. Overlapping immediate invocations are
ignored, never retained. Session finalization failure or runtime closure prevents
replay. Later pointer updates cannot restore the closed drag. Redo, collaboration,
compensation and save/reload use their existing canonical owners.

### Retained recovery and review guidance

Nonplanar projected-face rejection preserves its exact source-relative JSON Pointer,
measured maximum deviation and the existing world-unit tolerance. This applies to
standalone faces and pattern face/member templates. The retained-draft receipt
provides the existing repair route and replacement shape without supplying guessed
geometry. Failure remains not-started; earlier committed work is untouched. The
consumer uses the supplied pointer and retained draft, not a key-to-index search or
whole-source retransmission. Invalid/expired repairs and cancellation remain errors.
When the main workflow publishes that repair template, it supplies its registered
entry and the original admitted non-draft options, including parent, review plan,
inspection policy and material source. The model supplies corrected field values;
it need not reconstruct workflow context. Neither old draft nor previous replacement
values are copied into the template. Standalone preparation keeps its own route.

Structural mutation receipts and materialized queries share the retained-context
owner and bounded byte storage. There is no fixed query-count quota. Historical receipts remain recoverable while retained, never current edit
authority. Pinned data cannot be evicted to admit unrelated work.
Internal consuming reads share query rows with equivalent request reads, but own
independent leases. Releasing an internal mapping lease on success or failure
must not release a caller's or another consumer's lease. Normal request paging
reuses its request lease. Cancellation, disposal and canonical invalidation still
apply to every consumer; independent lifetime never grants stale-write authority.

A review handoff describes delivered image scopes and declared unit identities,
including existing bindings and revisions. It does not supply or approve visual
judgments. Exact evidence selection and explicit scope supersession remain the
primary agent's responsibility, enforced atomically by the review owner.

Public current activity distinguishes admission from real execution. Each live
principal invocation owns one public activity; nested tools do not replace it,
even when named or authored. Independent principal invocations retain distinct
ownership. Diagnostic events are
not filtered. Lifecycle control and completed-call removal remain immediate.

Reference suitability and intended criterion roles are supplied by the primary
agent, including limitations. Pixel processing requires caller-specified source
regions and target evidence; tools do not infer alignment or subject purpose.
Changing a selected reference use invalidates its exact dependent checks only; unrelated
passes remain accumulated. Original bytes and decisions remain reusable.

### Principal-task presentation

The current authored principal purpose is primary; operation state is secondary.
When no App operation executes, retained prose is explicitly task context. Child
names never replace the principal purpose. Actual dispatch effects come from the
registered actions, not a wrapper tool name or declared capability alone. Unknown
and mixed effects cannot be presented as drawing. Every ordered start/end remains
observable. History distinguishes authored identities/revisions even when their
text matches. Approval, failure, saving, stopping and terminal outcomes override
work immediately. No time-based display hold or extra model call is permitted.

### Knowledge-to-capability adoption

Spatial guidance explains parent-local attachment, retained composition identity,
relative hierarchy moves and common-ancestor regional inspection. These are
optional ways to avoid rebuilding or regrouping content. Tool descriptions leave
the order of drawing, detail work and research to the agent. Stored source facts
are attributed assertions, not independent source verification.

Relevant advisory knowledge is the default method reference for open design
choices, subject to user intent and current capability/security contracts. Shared
Domain Knowledge contains only domain principles; Design owns tool mappings,
representation limits and operational guidance. Missing/irrelevant advice and
known-value edits do not block execution. Existing brief, method and
fact artifacts retain concise decisions; no new approval gate or knowledge store.
Only affected decisions are reconsidered after a real dependency change.
Tools accept valid inputs independently of Knowledge reads or recommendations;
no Knowledge ID, acknowledgement or adherence proof is an admission prerequisite.
App guidance maps an agent-chosen method to existing contracts. Deterministic
replay may control the agent decision and external evidence to verify those
contracts and recovery; it cannot establish that a real agent adopts the method
or improves design quality. Those efficacy claims require real-agent evidence.

Compact query menus and ordinary exact usage group an admitted batch action with its
explicit registered wrapper route, retaining the qualified full-definition
selector. Foreign namespaces and uncertain associations remain separate. Full
and explicitly qualified lookups retain distinct contracts; a menu is not an executable
schema. Pagination covers the displayed capabilities, retains selector/view and
rejects stale catalog revisions. Grouped routes never mark undisclosed full
contracts as delivered. Invocation and recipe validation remain unchanged.

Recorded analysis reports actual representation choices and uncertainty, not
adoption or quality merely from a knowledge read or authored claim. Tool-only
verification cannot establish subsequent real-agent improvement. Continuous
per-pane gradient fields remain unsupported by single-axis retained color mapping;
representation advice must state this distinction without reducing requested detail.

### Whole-flow evidence closure and advisory handoff

A subtree result only closes compatible existing obligations certified by the
browser owner. Native review, batch, recipe verification, pending-result reads,
visual review and final settlement share that result state. Repeating a read or
verification must not revive superseded evidence. Canonical revisions protect
against concurrent or late reconciliation; partial results retain independent
acknowledgements without replaying writes. Root passes do not clear visual/source
obligations or unknown mutation settlement. Save acknowledgement and reload remain
separate from model completion and mechanical success. Finalization errors retain
their App boundary; they are not all malformed model responses.

Discovery answers known final-response identities in exact selectors and capability search with their actual final
route and schema while leaving them unavailable to native/edit dispatch. Complete
known contracts require no lookup; missing executable contracts use full retrieval,
missing individual fields use scoped retrieval, and genuine loss permits refresh.
App architectural guidance maps advisory material choices into actual supported
parameters and separate material/detail judgments. A failing premise should be
corrected before more dependent repetition; independent work may proceed. Knowledge
is never required for admission and tools never infer aesthetic correctness from
prose. Existing portable Knowledge contains no App tool identities.

Formal integration must exercise real browser modification/review/validation,
result reconciliation, repeated reads/verification, preserved visual decisions,
final settlement and save/reload. Include negative controls for uncovered failures,
foreign/stale/partial evidence and cancellation, plus Undo/Redo and collaboration
through existing owners. The saved 101 sequence supplies input evidence, never
reusable live receipt IDs. Owner-local proofs alone cannot close this flow.

### Material relationship publication

Material edits use the same canonical publication path as other property changes.
Publication conversion must retain exact final property relationships and ordering
alongside record lifecycle changes. Removing an old Fill and linking an existing
Fill is distinct from removal alone; equal colors do not establish shared identity.
Updates to retiring components precede removal; creation precedes updates to new
components. Lifecycle changes precede final relationship values as ordered canonical operations
within the same atomic publication; each Core property batch keeps unique owners.
Live peers, bootstrap replay and durable reduction consume the same operations.
Remote apply creates no receiver History or outbound echo. Malformed evidence
rejects rather than guessing missing links. A successful local edit does not imply
durable save; history, compensation, retry and reload retain their existing owners.

### Source-preserving material correction

`prepare_material_revision` consumes an owned preparation artifact, an existing
world-field key and a complete field definition. It publishes a new immutable
request artifact without changing the original recipe, member IDs or document.
The original projection and geometry own native gradient compilation, including
constant-phase sampling. The output explicitly says `applied: false`.

`apply_prepared_material` consumes that revision through the existing dispatcher.
The browser preflights every original member against request-owned creation
provenance (workspace, ancestry, canonical geometry and ancestor transforms, and canonical Fill binding)
before one plural local override operation. Viewport zoom/pan must not
invalidate provenance: read document-owned geometry through Core, never a round
trip through screen coordinates. Do not loosen tolerances or ignore real document
changes. A pre-write rejection identifies the unavailable member, geometry/ancestry
or Fill-binding mismatch; bounded numeric differences may explain a geometry
mismatch but cannot authorize an AI override. Preparing the same retained recipe
again does not refresh stale creation provenance or authorize replay.
Missing, changed, foreign or cancelled
provenance rejects before the first write. Material values use canonical Fill APIs,
transaction history, collaboration and persistence; no material metadata is added
to saved documents. Committed writes remain committed if subsequent provenance
refresh fails; the receipt lists unusable members and prevents blind replay.

Later preparation may explicitly use `materialSourceId` to inherit the revision's
world-field definitions. Inline fields and a retained source conflict and are
rejected. Revisions cannot be applied as new geometry. Existing source ownership,
cancellation and request cleanup cover all retained recipes and member mappings.
The primary agent remains responsible for representative visual acceptance;
mechanical preparation never approves appearance or makes Knowledge mandatory.

### Retained identity destination binding

An App input schema marks an element slot with `x-design-element-binding`: `all`
consumes one resolved list, `each` fans out in retained order, and `one` requires
exactly one identity. Generic document, property and workspace references do not
implicitly become element targets. `hierarchy.moveElementsRelative` declares
`request.anchorId` as `one`; its moving set remains `all`.

The batch's target field/path selects this exact canonical slot. Reserve all
bindings before source lookup; reject occupied/overlapping paths, incompatible
branches and multiple fan-outs before dispatch. One `each` slot can coexist with
`one`/`all` slots without a Cartesian product. Region queries resolve once and
permit `all` or `one`, never unbounded scalar fan-out. Complete input admission
and current mutation ownership still apply after resolution.

The existing App host registration adapter removes only this App control-plane
annotation for Runtime recipe type proofs, retaining every schema validation and
lifetime constraint. This is neither a new registry nor permission to relax an
unknown schema assertion. Native discovery retains the binding declaration.
Failure identifies the actual operation/slot; recover an invalid reference without
replaying acknowledged writes or rereading unrelated document data.

### Actionable usage projection

Exploratory usage and unselected owner-scoped tools derive root input paths and
choices from the canonical descriptor. Exact non-scoped tools deliver their
complete canonical parameters in usageGuide, regardless of read/prepare/mutation
effect or native/batch/final-response route. Selected guides retain root/branch output paths and element-binding navigation as well as result
constraints, lifecycle and recovery; input paths alone never establish readiness. Owner-authored examples are published only when they validate
against its current input schema and are wrapped in its actual native, batch or final
response route. Native conversion retains common examples at the complete union scope,
not inside alternatives that reject those inputs. Example identities are illustrative, never live credentials. Missing
or invalid examples are explicitly unavailable. Full schemas, exact fragments and
explicit delivery/context-loss recovery remain authoritative; a returned response is
not evidence that the model read or understood it.

High-level preparation and context tools expose their existing executable owner
examples in the canonical input schema, not only description prose. Usage publishes
one validated illustrative invocation through the actual native/batch envelope;
full retrieval includes the complete contract and examples. Navigation includes
local schema-definition paths without recursively expanding references. Fragments
retain ancestor constraints and local reference closure and remain partial documentation.
An unknown path is recoverable and never dispatches a drawing action. Exact lookup
still defaults to full; exploratory navigation is optional, not a prerequisite. A known
contract can execute directly, including without Knowledge. Explicit recovery keeps
view/paths and never retries a previously completed product write.

### Exact-name query selection

Before lexical matching, query checks existing admitted exact identities (action,
semantic operation, native name or namespace.name). Trim surrounding whitespace;
otherwise use existing exact case and spelling. An exact hit uses the same identity
resolution as names, including ambiguous-name rejection and independent action/native
routes. Descriptions referencing that identity do not add matches. No exact hit keeps
the capability search; category exploration remains available. Purpose ranking
uses registered purpose descriptions, nested input/output metadata and legal
string enum/const choices before names. Preserve metadata origin when ranking;
common instructions and receipt vocabulary must not outweigh the requested
operation merely by accumulating substring matches. Use normalized lexical terms
and relevance derived from the current admitted catalog, without subject-specific
keywords or a second registry. Keep descriptor traversal and corpus derivation
request-owned and invalidate them with the existing catalog generation.
Partial matches remain candidates and disclose matched and unmatched query terms;
they do not certify the whole purpose or automatically select an execution owner.
Examples/default values are not searchable capability declarations. Metadata is
traversed once per request-owned descriptor generation and reused until the existing
native catalog revision replaces that generation; no new registry or cache owner.

Multiple or partially matching descriptive usage results are compact menus with
exact acquisition routes and shared relevance ranks across API/native entries.
Descriptions retain meaningful purpose prose; a synthetic operation-name sentence
is not a capability summary. Prefer a relevant complete description sentence,
without inventing applicability or treating a menu as an execution contract.
Do not expand every candidate into full parameters.
A uniquely complete descriptive match may deliver usage in that same call;
explicit full requests and exact selection keep their existing complete contracts.
Known exact tools require no preliminary search. Candidate completeness describes
the search page, not possession of execution contracts. Preserve current result
paging, retained refresh, namespace ambiguity and canonical wrapper ownership.

An exact query resolving one unambiguous native tool accepts `inputScope` just
like the equivalent single `names` selector. Scope selection without `view`
returns full selected schemas; with `view=usage` it returns the complete selected
guide. Scope cannot combine with `schemaPaths`. Ambiguity remains explicit;
fuzzy queries cannot project a scope onto descriptive matches. Action-only
identities cannot silently stand in for a native scoped owner. Invalid scope
values use that owner's existing choices and recovery, without another menu.

Without inputScope, representation is unchanged: query without view is a menu,
usage is a menu only when selection is unresolved; otherwise it supplies the complete selected contract. Full retains canonical restrictions. Exact queries need no additional lookup and no
inventory offset; a nonzero offset rejects rather than falling back to lexical
search. Existing content paging, registry revision checks, refresh and no-replay
recovery remain. No new selector, registry, result store or limit is introduced.

DoD: replay the saved main-workflow query in one reply; adding 10000 descriptive
references does not grow delivery or calls. Verify purpose/category exploration,
qualified names, ambiguous namespaces, action/native dual routes, complete full
contracts and executable usage/recovery through existing owners.
Replay both saved valid-operation query/scope failures, compare names/query
restrictions and page recovery, and execute the actual delivered example through
the dispatcher and preparation/application owners. Repeated lookup, refresh,
registry invalidation and cancellation never replay an acknowledged mutation.

### Preparation source reads and immutable lifetime

Structural budget admission precedes source snapshotting and geometry compilation.
For pattern faces, admission derives aggregate and largest-primitive point counts
from one read of each vertex collection, independently of instance count. Valid
preparation then snapshots the source once and compiles immutable templates; repeat
instances must not cause repeated template projection. These are distinct ownership
boundaries, not a whole-session promise of one raw property access.

Over-budget input must not be cloned or compiled. Preserve all existing capacity,
invalid-input and cancellation guards. Artifact lookup reuses admitted output without
rereading mutable input; source edits cannot alter a retained recipe or artifact,
and release ends lookup lifetime. No new cache or skipped trust-boundary validation.

DoD: separate budget, snapshot, projection and lookup observations; compare exact
budget sum/maximum/expansion and complete canonical output for sync/async, different
instance counts, invalid/empty faces, rejected budget, cancellation and source edits.

### Layer-preserving repetition delivery

Selected composition usage exposes its registered execution envelope and one valid
owner example before the long parameter restrictions, within the existing response
budget. Choose repetition by intended painter order: a mixed component repeats its
ordered members per instance; separate painter layers use separate sibling patterns
at their existing positions. Independent geometry may sit between those layers.
Owner examples demonstrate root material references and this layered composition;
valid mixed-component examples remain available through existing scoped/full retrieval.
No inference of user intent, automatic geometry folding, extra selector, mandatory
pattern or preliminary call is introduced. Explicit nonrepeating geometry stays legal.

Generated source keys/names follow the existing pattern contract. Preserve explicit
names/references when they are required; do not silently rewrite existing objects or
reuse old source keys. Resolve canonical edit targets through returned artifact mappings.
Pattern input compression does not reduce expanded budgets or weaken recovery.

DoD: replay saved source with complete ordered canonical geometry/material/parent
comparison, declared key/name correspondence and artifact target resolution; at least
50% smaller full invocation without omitted output. Execute the actually delivered
layered example and preserve the mixed case. A merged-layer negative control must fail
the same order oracle. Measure complete first-use input/output, including optional plan,
all pages and startup guidance; the example is in the first page without increased bytes
or round trips. Preserve constraints, full/field queries, refresh, partial/cancelled/stale
recovery and no replay. Verify actual application, Undo/Redo and reload for the compact
fixture. Model adoption and first-frame latency require separate live evidence.

### Selected operation usage guide

For the ready-part workflow, exact lookup with `view: usage` and `inputScope`
returns an actionable guide for that operation and selected node types. Prefer
this over full validation schemas for direct execution. The guide includes the
actual route, an owner example validated for that scope when available, readable
input constraints, execution effects, outcome interpretation and recovery. Missing
matching examples are explicit, never invented credentials or silent substitutes.
All applicable input and cross-field restrictions and required local references
remain represented; shared definitions/notes are available in that same reply.
Unknown schema constraints remain explicit. Optional input fields are marked optional.
Full output validators remain authoritative at the tool owner, not default reading
material; usage retains distinctions between success, no-op, partial, failed and
unconfirmed settlement, including completed work and safe next actions. Main-workflow
instructions must not claim the preparation child's read-only effect.

The representative draft/projected-face/pattern and vector cases require one guide
reply within the existing delivery budget, after optional purpose discovery. Measure
all discovery/guide continuations and bytes; do not count only the final page. Full
schemas, exact field queries, intentional inventory, paging and refresh remain valid.
Refresh preserves view and inputScope and never repeats a product write. Known
contracts need no lookup; new machine recipe bindings retain full schema admission.
Formal tests execute published examples through the existing dispatcher and owners,
exercise cross-field rejection, partial/cancelled/stale recovery and unrelated-catalog
growth. No new tool, registry, validator, scheduler or state store is introduced.

Owner-declared optional input groups are selected with inputScope.optionalInputs
in the same read. Only actual optional canonical root fields may be declared;
unknown or duplicate selections reject. Full queries retain all inputs. Broader
selections can use existing paging and must not claim single-response coverage
when continuation is present. Preparation no longer advertises a formal review plan.

### Inspection discovery field ownership and receipts

The existing schemaPaths array applies independently to every selected exact
identity. Different tools requiring different fields use separate queries, which
may run in parallel in the same native turn. Shared-path multi-tool reads
remain valid. Never infer ownership from a field name or silently rewrite a pointer.
A tool with any invalid requested path keeps its whole requested scope unavailable;
other identities retain their complete requested fragments, constraints and references.
Its recovery includes a narrower same-tool query for valid requested paths when any
exist, explicitly distinguished from the unavailable original scope. Valid scoped
recovery retains original paths; invalid scoped recovery must not repeat a known
invalid path. With no valid requested paths, it requests same-entry usage navigation.
The existing explicit full refresh route remains.

Usage exposes immediate input properties and union branch roots, including those
under an argument wrapper, without preloading validation schemas or enumerating all
branch leaves. When input navigation is available, usage includes an executable
fieldQuery using the existing tool/arguments shape:
action operations use operations, native tools use qualified names. Its schemaPaths
contains one canonical navigation example; replace only those paths with needed
paths from the same entry. Do not reconstruct selectors from refresh instructions,
transfer paths between entries or automatically fetch every advertised field.
Unavailable-scope inputFields use the same compact root/branch navigation without
traversing unrelated nested leaves; issues and exact same-owner recovery remain.
Refresh/recovery selectors continue to identify only their own entry. Bare exact-name full retrieval includes both legitimate routes. Default usage
represents a canonical batch wrapper through the action dependency reference. Native arguments remain wrapped exactly once; action arguments
remain direct. Navigation is not an executable validation schema. Fragments retain
ancestor restrictions and local reference closure; canonical execution validation
remains unchanged. No extra preliminary request, alias or pointer inference.

Exact lookup receipts report success only when every requested identity is delivered,
partial when some are delivered, and failed when none are delivered. Missing and
ambiguous identities count as unavailable. Completed read settlement means lookup
finished, not requested coverage or visual acceptance. Empty lexical searches,
menus, empty selections and valid pagination remain successful read operations.
No new invocation state or status mechanism is introduced.

Existing bounded content pages preserve the lookup outcome, including partial and
failed results. The published forwarding example may assemble these valid pages;
complete assembly never promotes lookup coverage to success. Malformed pages and
ordinary read failures preserve previously retained content. Existing refresh,
cancellation, revision invalidation, full retrieval and no-write-replay remain.

DoD: saved mixed-field query, all-failed/mixed/success outcomes through invocation,
executable narrower recovery and per-tool usage guidance, reference and cross-field
constraint preservation, partial-page forwarding, repeat/refresh/stale/cancellation,
empty search/menu and zero mutation replay through actual downstream owners.
The saved mixed query fits one existing bounded reply; corresponding usage and
field-query input/output is below 30,676 bytes. Growing unrelated nested leaves
must not grow failed navigation or its traversal work. Execute delivered fieldQuery
examples rather than test-authored selector assembly, including downstream reference
selection and invalid/stale revisions. No extra preliminary lookup or larger limit.

### Next-part operation selection

The initial provider Main tool scope must include the canonical owner's selection
conditions before the first scoped query, together with its existing legal choices
and example. Forward the existing selection verbatim, once; deferred tool schema
registration is not a substitute. This adds no discovery request and preloads no
child schema. Bounded scope-error recovery retains legal choices and its executable
correction example without repeating the complete selection prose. Preserve explicit independent geometry, translated mixed components,
root/container distinctions and optional-input choices without forcing adoption.
DoD: inspect the actual native thread/start request and compare selection with the
owner declaration; execute direct selected examples, preserve bounded delivery
under unrelated catalog growth, budget failures, partial receipts and no replay.

The first selection reply and direct selected usage distinguish the draft root from
its children. Every draft guide already includes group/frame root contracts;
nodeTypes selects child types, including nested containers. Changing only the root
container does not require another query. Select frame for nested frames, not to
unlock a frame root. All frame dimensions and group restrictions still apply.
Selecting optionalInputs includes their documentation, never makes them required:
plan may be omitted after reading it without another query. A previously unread
child type or optional input can still be queried through the existing mechanism.
These explanations use existing selection/usage fields, without a prerequisite read.

DoD: execute published examples through the registered dispatcher with both legal
root types, omitted plan and unchanged read counts; separately validate nested-frame
selection, frame dimensions, group restrictions and supplied-plan validation.
Preserve canonical inputs, partial outcomes and recovery without write replay.

The existing workflow discovery menu and unscoped usage expose owner-authored
selection conditions alongside inputScopes in the same reply. Choose the types
needed by the next submitted part: independent world-space faces, translated
multi-face repeats, or normalized motifs on a regular four-corner planar grid.
A part needing grid detail can select it immediately; ready geometry need not
wait for future detail. No Knowledge read or planning exchange is a prerequisite.
Do not automatically add all types, choose geometry, or preload their schemas.

For an owner publishing this selection guide, unscoped usage is a selection view:
retain identity, execution route, root input paths and valid owner example, replace
long execution prose with selection guidance, and omit nested output-path inventories.
Exact selected usage still delivers all applicable constraints, result interpretation
and recovery. Full/field lookup and tools without this owner opt-in are unchanged.
Known scopes can retrieve their guide directly. Scope refresh and explicit broader
composition preserve existing continuation and failure semantics.

DoD: actual query/usage to selected guide to dispatcher/apply for a ready world-face
part followed by grid detail and for grid in the first part. Each focused first-use
path uses at most two bounded replies and less total delivery than the saved query
plus selected guide; unrelated catalog growth does not inflate it. Execute published
examples, preserve constraints and reject invalid inputs before writes. Subsequent
lookup/refresh never replays partial or completed writes. Existing cancellation,
stale continuation and full/field recovery gates remain required. These deterministic
cases prove usable handoffs, not earlier live model decisions or first-frame latency.

### First-query scope choices

When startup guidance recommends a selected main-tool lookup, the same provider
input includes its owner-derived legal operations, node types and optional inputs,
operation meanings and a valid executable lookup example. This is a compact selected
capability, not the whole tool catalog or full validation schemas. Unrelated tools
must not increase this instruction or require a preliminary menu lookup.

Query inputScope.operation selects an execution branch; it is not the outer
semantic-operation selector or a user-intent verb. Execution still uses the returned
branch fields. Owner scope-selection rejections remain failed/not-started and identify invalid fields
with current owner choices and a valid query example in the existing error message.
The caller selects the correction; no alias, guessed scope or automatic retry is
allowed. Full/schema queries, refresh, partial success, cancellation and no-replay
recovery retain their existing contracts.

DoD: execute the example actually delivered in the provider packet through discovery
and the returned execution route; reproduce the saved invalid-create lookup and
correct it from that rejection alone. Prove owner-choice changes propagate, invalid
node/optional groups stay rejected, all legal branches remain available, unrelated
catalog growth does not inflate startup guidance, and completed writes are not
replayed during informational recovery. No live-model latency claim follows from
these deterministic tests.

### Interrupted owner results

Stopping prepared drawing does not erase acknowledged mutation members. Before any
acknowledgement, retain ordinary failure/cancellation. After a confirmed prefix, the
App execution owner supplies a detached partial result with its actual composition,
confirmed count and prefix range (full responses may include IDs), planned count,
and non-replay guidance. A completed drawing followed by a delivery interruption is
not an unstarted drawing. Failed or unconfirmed members never enter the prefix.
Runtime retains this owner result in the existing action receipt, independently of
the failed/cancelled invocation. Final transaction rollback overrides retained-write
claims; unknown transaction settlement never certifies persistence or safe replay.

The existing invocation failure path must preserve structured evidence while still
rejecting cancellation. The existing causal receipt ancestry retains request-level
batch evidence for the report phase after active tools settle. Ordinary requests do
not retain an additional request-root receipt lifetime. The report input carries
bounded factual receipts, not geometry, full schemas, diagnostic inference or presumed
model understanding. Summaries reuse the existing receipt-count budget, mark omitted
actions/batches explicitly, and omit long identifiers rather than truncating them into
a different identity. Reporting admits no further tools or mutations. Normal requests
without an evaluation window do not start a report turn. Expired artifacts and partial
members cannot produce an invented resume invocation; reuse existing remaining-only
recovery only where the owner can prove it safe.

DoD: formal tests interrupt before mutation, between acknowledged members and after
writes before delivery; verify true cancellation, failure and final rollback separately.
Follow actual owner results through Runtime, native delivery and report input. Verify
saved/reloaded canonical values and hierarchy, ordered collaboration publication and
remote application, no echo/remote History, one intended local Undo/Redo entry and no
replay. Neither an error label nor presence of a result alone establishes settlement.

### Image inspection target preflight

The App inspection common API obtains target existence, type and childCount from
one current scalar Core metadata observation per capture attempt. Preflight must
not save or clone complete element data, children or properties merely to decide
capture eligibility. Its work does not grow with target membership. Full-data
queries remain independently available; required snapshot traversal is unchanged.
Use the existing snapshot owner with identical target, size, native-resolution and
region inputs. Missing/noncurrent/empty workspace, unsupported scope and capture
failures retain their specific results. Preserve cancellation, partial captures,
failed-only recovery, local/whole-view invalidation and read-only document/history/
shared-state behavior. No count cache, fallback snapshot read or extra exchange.
Formal verification must exercise actual canonical owners and count copying before
capture, alongside existing pixel and native reply/recovery preservation tests.

### Workspace mechanical review

A workspace is a non-geometric scene root. The deterministic reviewer checks its
visible descendants through canonical metadata, ordered membership and actual
geometry/text owners; the workspace itself needs no computed rectangle and imposes
no Frame containment. Do not fabricate bounds, regroup the document or skip real
child errors. Existing unsupported geometry, text, Frame containment, visibility,
missing targets, cancellation and mixed-source failures retain their semantics.
A mechanical pass is not visual approval; an empty workspace supplies no visual
proof. Workspace mechanical receipts depend on subtree membership and relevant rule
inputs. Painter-order-only changes retain equal mechanical verdicts while visual
evidence keeps its existing order invalidation. Local independent receipts survive unrelated edits; load retires receipts.

Final review consumes this same reviewer for workspace overview targets. Incomplete
mechanical review keeps accepted=false and exposes current pending findings via the
existing retained-check query/recovery contract; it must not merely ask for another
unspecified measurement. Preserve successful images and visual judgments. Recovery
never redraws, recaptures current evidence or replays settled mutations.

DoD: real canonical workspace to capture/binding/final acceptance integration;
valid multi-root and negative geometry/text/Frame/hidden/missing/empty cases;
membership/order/load/local invalidation, cancellation, retained work counts,
read-only save/history/shared-publication invariants and actionable failed recovery.

### Workspace overview and inspection receipts

The existing inspect_drawing capture route accepts the actual
current workspace ID for overview. Core.captureElementSnapshot resolves that
workspace through the existing engine-neutral snapshot owner, using its real
scene container; no document grouping, reparenting, camera/UI capture or new tool.
One overview preserves all visible root geometry, transforms, painter order and
occlusion. It is bounded to the existing 1024-pixel preview and is not native detail.
Workspace detail/region is unsupported: target a concrete element for those checks.
Missing/noncurrent targets and empty workspaces produce unavailable evidence with
specific owner reasons and actionable recovery, never a blank successful review.

Inspection receipts declare settlement from the read owner. A completed read with
no usable image is failed/completed, not unknown or success; all-failed aggregate
captures are failed/completed, mixed captures partial/completed, when every read
settled. Cancellation and transport failures must not claim unobserved completion.
Keep uncertain mutation evidence unchanged. A changed document invalidates capture;
no result or malformed output cannot establish evidence. Describe these outcomes
in the action output contract and deliver the same scope guide on native routes.

Reuse the existing evidence and check stores. Workspace captures depend on the
whole workspace subtree, including membership/order; local captures retain scoped
invalidation. Workspace switch/load retires prior evidence. Recover only failed
captures, retain successful image IDs and independent local judgments, and never
replay edits or group elements merely to capture. Acquisition is not visual approval.

DoD: execute delivered guides against real owners; multi-root/rotated/occluded/hidden
pixel and source-space cases; document/selection/history/shared-publication immutability;
missing/foreign/empty/scope/render/change/cancellation failures; complete versus partial
coverage and truthful settlement through native reply/presentation; successful capture
reuse without writes; local versus workspace invalidation and reload. Formal cases
must not depend on ignored evidence files. No live model is required for this proof.

### E2E execution continuity

Formal browser validation must preserve source and runtime continuity independently
of product correctness. Freeze source before execution and verify its identity at
closure. Use explicit operation phases rather than current source line numbers to
attribute failures. An unplanned main-frame navigation, participant closure, source
change or unavailable required evidence invalidates the environment proof; it must
not be reported as successful persistence or rewritten as a product save failure.

A planned reload authorizes one replacement of the named participant only. It does
not authorize another navigation or erase prior violations. Capture public Core
history depth, runtime identity and documents with backend durable sequence around
save/history phases in existing Playwright attachments. Preserve the original error
when capture also fails. Diagnostic state remains test-local and never changes App
writes, history, collaboration or persistence. Exact Core/backend comparisons and
Undo/Redo remain strict after planned reload and a new edit. Test the extra-reload
case deterministically and retain a permanent minimal fixture of the observed
save-pass/history-failure sequence. Models and private provider internals are not
needed to prove this contract.

### Knowledge source identity delivery

App read_knowledge delivers complete provenance once in the existing sources
catalog. A document source or replacedSource may contain only id/revision when
its full record exactly matches one unambiguous catalog record. Resolve absent
provenance from that same reply, without another read. Explicit provenance remains
when equality or uniqueness cannot be established. IDs and revisions alone never
justify dropping different provenance. All text, ordering, override relations,
retainedFrom, trust, generation and context identities remain unchanged.

The Runtime public and retained results remain complete and immutable. Projection
belongs to existing App delivery before bounded pagination; it does not prune
Knowledge, infer model receipt, add state or increase limits. Rehydrate restores
full advice with resolvable provenance; reuse and stale/foreign/cancelled recovery
remain existing read-only operations, never write/capture replay. Tests execute the
published resolution against real composed/overridden/paged/reused results, prove
lower total delivery and linear metadata-only work, and retain direct consumers.

### Consultation observation boundary

A multi-turn consultation or drawing diagnostic preserves ordinary predecessor answers in the
App conversation. Only its final request enters the existing evaluation self-report
phase. All work shares one absolute deadline; the existing process watchdog also
bounds ordinary predecessor turns. A terminal partial result may continue only after
its ordinary answer, request identity and document are saved and App input is idle.
Preserve its partial outcome and send only the declared follow-up. Missing evidence,
unsettled or non-idle input, failed/cancelled outcome or expiry stops the sequence
without retry. A captured final partial report is not artwork acceptance. Capture ordinary answers separately from attributed
final reports and compare original native inputs; historical self-report text cannot
stand in for the actual design answer or prove causal model improvement.

## Pre-execution guidance and recoverable input validation

Registered API descriptions, selected usage, examples and runtime admission share
canonical owners. Validate each published executable example against its actual
route before delivery. Never publish an invalid example as executable, silently
coerce model input or substitute a different operation. Full contract validation
is retained at execution; semantic owner preflight happens before side effects.

A source key identifies one node; boundary.face references another node's key in
the same source scope. A face and its grid have distinct keys even when they share
a display name. Ambiguous source identities report every conflicting source path,
retain the original source and offer existing repair replacements. They do not
become a generic missing boundary error or receive automatically guessed names.
Valid unique references and explicit corner boundaries remain unchanged.

Review supersedes is legal only with an explicit declared unitId and exact prior
revision plus redesign reason. Whole-criterion judgments omit supersedes; fresh
images of an unchanged scope do not require it. Validate this before capture,
binding and recording. Invalid whole-criterion recovery identifies the removable
field, retains image assignments and invokes the existing bind route without
recapture or replay. Never invent a unit, relax scope replacement checks or treat
binding as visual approval.

First visible content may be a small editable part. Complete planning, optional
Knowledge, all materials, decoration and whole-structure approval are not first-
drawing prerequisites. The agent chooses what to show first and may adjust it
later. Real geometry/input validation still applies; visual review and required
whole-request coverage remain completion obligations. No new preliminary call or
forced drawing order is introduced.

Basic computed-field lookup publishes the existing Core owner selection limits;
full reads and an empty selection remain legal. Both Core and App property patches require records, accepting records:[]
with ordinary values or combined linked-record patches. Ordinary values may also
use updateElementProperties. Empty patches retain no-op semantics. Dynamic property validity remains with the canonical property registry.

## Identity allocation and composed owner receipts

The model may allocate an ordered list of IDs through the existing Core/basic API
route backed by idCounter. All requested counter types must already exist. One
atomic allocation returns isolated immutable IDs in input order, observes the
existing namespace and loaded counter positions, and rejects malformed, ambiguous
or exhausted allocation without consuming a prefix. Empty input is valid. The
model cannot set, reset, load or unregister counters. Allocation does not create
objects, publish document changes or enter Undo history. Generated IDs can be used
as explicit source keys; references reuse exactly the issued key, while final
prepared keyToId mappings remain authoritative for document operations. Valid
caller-authored keys and omission of unneeded keys remain legal. Allocation cannot
make two distinct nodes sharing one explicit key unambiguous.

Composed geometry, prepared-material and retained-fill operations consume canonical
mutation receipts through the existing receipt interpretation. A valid unchanged
operation reports no-change, available/unavailable mixtures remain partial, and
missing/malformed receipts never certify a write. Preserve accepted identities,
true settlement and no-replay instructions; retain original provenance validation,
local invalidation, ordered application, history and receipt delivery. An accepted
identity is not proof that its value changed. Tool execution, visual approval and
conversation/evaluation outcomes remain distinct.

Formal cases execute delivered allocation through Core and real owner no-op edits,
validate references and cancellation, and retain the current invalid-input, mixed
result, partial application and no-replay regression gates.

## Unified public tool contract delivery

The existing registered owner is authoritative for each tool identity, input and
output schema, examples, effects and recovery. Discovery and provider adapters
must project that definition; they cannot introduce an independent parameter
language, registry or inferred operation. Selected usage publishes executable
JSON Schema with standard local references and the complete selected constraint
closure. Only provably unreachable alternatives may be removed. Preserve ordinary
search, ambiguity, full/field queries, bounded paging and independent operations.
An unrelated opaque recipe alternative cannot block a supported binding when its
necessary discriminator proves non-overlap. Unsupported selected bindings and
ambiguous alternatives remain rejected by the existing Runtime proof owner.

Optional construction checks may be omitted and then mean no requested checks.
Supplied checks retain their semantic constraints; width and height expectations
are nonnegative and note fields must contain non-whitespace content. Omission
cannot create a visual or mechanical pass. Published examples and validation must
agree with these actual owner semantics. Targeted typography edits reuse the
Preset owner's public value constraints rather than derive validity from default
value types; target capability and locks remain execution-owner checks.

Input failures identify the failing contract and support correction through the
existing retained draft/repair owner. A missing declared object field can be
corrected without resending completed geometry; unknown/prototype paths, arbitrary
array insertions, expired or foreign references remain invalid. Validate the
complete corrected source before execution. Preserve workflow context, exact
completed results and no-replay semantics across admission and output failures.
For a never-started parts request, recovery preserves every part's source, order,
parent relationship and workflow options. Retained valid source may use empty
replacements after complete owner validation. Missing retention or an invalid
outer envelope must not produce a purported complete recovery invocation.
Execution failures continue to expose only unfinished work; admission recovery
never implies that any mutation already ran.

Every public API requires actual-owner semantic evidence through its delivered
entry, with applicable success, no-op, invalid input/output, cancellation, partial
result, stale identity and recovery cases. Format-only admission, mocked delegation
and provider transport success do not prove the requested operation completed.
The existing verification gate must fail when a registered entry lacks required
coverage; local evidence does not claim model adoption or universal correctness.

### Unified usage acquisition

Discovery descriptions distinguish complete operation usage, owner-published input
scopes and missing-field queries. Native callable declarations retain exact names
and routes independently of App contract lookup. No additional lookup is required
when the current contract is already known.

Exact selection without owner-declared operation choices is sufficient to obtain
an executable usage contract. Selected scopes retain the same promise. General
search/category and unresolved scopes are navigation; their next action selects
the owner/operation, not delivery-failure refresh. Reuse existing coverage and
nextAction metadata to distinguish these results. Missing or invalid owner examples
are explicit, but canonical parameters/results may not be omitted for that reason.
Do not infer current IDs, receipts, permissions or runtime preconditions from an
example. Native, read, prepare, batch and final-response routes follow the same
selection rule, retaining their actual execution envelopes and lifecycle.

Usage parameters are standard JSON Schema; usage is not schema-free. Complete
selected guides preserve local references, cross-field restrictions and result
semantics from their owner. Execution still validates runtime state. Reacquisition
of missing content selects the required scope; refresh repeats the same scope only
for lost delivery/context and never executes anything. Full/field queries,
request-local retained reads, bounded paging and partial lookup remain valid.

DoD: enumerate actual registrations through discovery, execute delivered examples
and non-example inputs using only delivered constraints, and prove reference
receipts reach downstream consumers. Preserve invalid/cancelled/stale/partial
recovery without replay. Count total request/response bytes and continuation calls
for the saved acquisition and unrelated-catalog growth; improve the complete path,
not merely a single reply. No new state, cache, tools or higher byte budget.

### Model-visible result contracts

Executable usage describes the result after the registered App delivery view is
applied, including operation results inside batch/native envelopes and partial
execution. Internal mutation receipts and resource schemas are not substitutes
for this model-facing contract. Derive the declaration from the same registered
owner schemas used by projection; never infer it from field names or tool lists.
Delivery failure remains distinguishable from operation failure and retains its
settlement and no-replay instruction. No-delivery tools keep their owner schema.

Full registered dependency definitions preserve complete internal result schemas
for recipe bindings and explicitly distinguish their bounded model delivery.
Compact usage does not duplicate those internal schemas. Full response cannot
bypass registered delivery; use the existing retained receipt readback for original
acknowledgements. Preserve input constraints, no-op, partial/cancelled/stale recovery,
refresh, fields and paging without another prerequisite lookup or mutation replay.

Discovery consumes host.definitions(), including registered-tool execution routes.
For a registered route, executable usage describes invoke_tool identity/revision,
the selected owner input under input, and its projected value under execution.value
alongside execution status, calls, issues, storage and receipt recovery. Its example
uses that same route. The library invocation owner defines these envelopes; do not
invent another wrapper or expose canonical recipe values as external results.

Host outcome metadata is part of external delivery. Closed business schemas remain
closed to unrelated fields and preserve constraints and local references, while
admitting the host's structured toolOutcome. Nested business objects remain closed.
Do not change the result shape or weaken canonical validation to fix discovery.
Negative navigation tests use actual schema pointers and preserved incorrect output,
not a top-level field-name approximation. Run delivered examples through the real
host and invoke_tool, validating the complete result with the acquired contract.

Compact representation may remove identical alternatives and flatten bare nested
anyOf/allOf only when local reference targets retain their meaning. Preserve oneOf
multiplicity, annotations, closed schemas and every business restriction. Guidance
selection contributes explanations; final route assembly prepares each parameter
contract once. Cost evidence separately accounts for body sections and continuation
wire overhead; a larger correct contract does not waive existing acceptance budgets.

An owner may associate its existing input-scope operation with canonical successful
result alternatives. Selected usage includes only that declared operation's result;
unscoped/full reads retain every alternative. This is a declaration projection,
not a different execution path. Capture/bind preserve context, evidence coverage
and exact next-step restrictions; record owns recorded-result correction details.
Partial execution, admission rejection and retained recovery remain complete for
every scope. Reject malformed scope declarations rather than guessing fields.

Executable usage defaults to owner-derived result fields and settlement/recovery
meaning in usageGuide.results. Complete input constraints and owner examples remain
executable without another lookup. Machine consumers explicitly request
includeResultSchema=true with view=usage to obtain one standard JSON Schema for
the complete external reply, including admission rejection. Both modes use the
same registered model-delivery owners; runtime validation always uses full schemas.
Refresh, pagination and scope correction preserve the selected mode. Schema
validation consumers request the explicit mode; direct-execution tests consume
the default guide and validate real output against the complete canonical schema.
Scope selection cannot change the actual invocation envelope.

Raw owner values, host-annotated receipts and projected model replies are distinct
contract stages. Each boundary derives its contract from its authoritative input,
not from the presence of a metadata field. The invocation owner declares its own
failure envelope; discovery cannot invent execution or completion for rejected
input. Preserve closed composition branches and original business validation.

Per-registration tests must select published operation scopes, execute advertised
routes and validate complete external replies. Cover outer admission rejection,
inner rejection, successful/no-op/partial results and remaining-only recovery.
Malformed business values cannot pass via a generic failure branch. Selected
operation receipts admit only the selected operation and the existing registered
automatic inspection follow-ups, each with its own result constraints. Preserve
empty no-op batches and acknowledged partial prefixes. A registered execution
reported as successful retains its required value even when outer delivery or
saving reports partial completion; failed/not-started executions may omit it. Preserve
complete acquisition budgets, paging and refresh without additional prerequisite
calls or new storage.

Validate acquired usage against actual host output from real owners, plus saved
regressions and delivery-bearing registration enumeration. Prove fewer complete
acquisition bytes without extra calls and retain full internal receipt consumers.

### Retained material preparation recovery

The preparation owner publishes executable repair arguments for the exact
retained source. Input rejected before material resolution retains the necessary
materialSourceId. After successful resolution, retained source already contains
immutable linearFields and its repair must not inject that selector again.
Compose preserves workflow controls but consumes the preparation owner's
arguments as authoritative, including in remaining-only ordered-part recovery.
Unstarted siblings retain their own required inputs. Do not discard required
selectors indiscriminately or relax a genuine inline-fields/source conflict.

Execute returned guides with only explicit corrected fields. Preserve geometry,
materials, painter order, references, completed parts and parent relationships;
no geometry resend, cosmetic rename, new cache or replay is required. Foreign or
expired source and cancellation retain ordinary owner failures without writes.
Formal saved-input tests must cover both retention stages, direct preparation,
main workflow and ordered parts, and compare corrected output to direct preparation.

### Complete usage cost comparison

Compare complete default acquisition bytes and continuation calls with explicit
machine-schema acquisition, using identical input constraints and executable owner
examples. Preserve native page limits, failure/recovery meaning and no-replay
behavior. Record both modes separately; historical machine-schema budgets remain
regression ceilings for that explicit mode, not a reason to enlarge default replies.

### App instruction delivery evidence

The provider adapter assembles ordered App-owned instruction blocks once. The
exact joined strings form thread/start baseInstructions/developerInstructions.
The existing advertised-contract payload retains each block's source, role, text
and SHA-256 alongside native definitions. User intent, conversation history bodies
and model reasoning are excluded; only the static history-handling rule is retained.
Generic payload redaction is unchanged. Associate this snapshot with transport
start/completion evidence: a submission attempt alone does not prove provider
receipt. Recording failures remain observational and never retry product work.

Correction discovery offers executable usage when a contract is missing. Position-dependent fill mapping resolves query columns internally. Request a standalone snapshot when its values have another consumer.

Canonical data reads accept explicit IDs or current query selections. Host target
bindings resolve artifact keys into the actual registered target slot before the
read. One operation may combine independent supported bindings. Requested columns,
page completeness, coordinate space and source currency remain explicit; no data
evidence token or verdict submission is needed.

### Purpose discovery and inline recipe execution

Capability queries rank complete matches against the owner's description, root
schema titles/descriptions and declared input/output field names before matches
that rely on the tool name. Exact identities retain priority. An exact selector
may supply purpose to recover candidates from the admitted action/native catalog.
A candidate does not settle a missing exact selection or authorize execution.

The provider has one design sequence entry, design_operations.execute_design.
Use the same operations list for a known edit, output-bound dependencies and
mechanical iteration. The host resolves and pins exact registered capabilities.
Keep ready edits in a single exchange. selectAt:"step" on a target prevents
membership lookup before the preceding write. Each scheduled group uses the
existing region and artifact binding owner. For mechanical iteration supply
typed initial state, a registered check, repairs, next state and maxIterations.
The Runtime stops on pass, decision, repeated progress, exhaustion, cancellation
or uncertain prerequisite settlement. Retain completed receipts without replay.
The model reports grouped and split calls and the reasons for returning control.

### Created roots and artifact-key operations

The workflow owns compositionIds on successful creation. Collect identities from
the actual apply acknowledgements, deduplicating continued roots in original
order across parts. Array position zero is guaranteed only on success. A failed
order retains the earlier creation receipt. The host never repeats the create.

Runtime proves a source field independently required by an object intersection
only when no branch changes that field or its lifetime. Known omitted object
keys may discharge a negation that requires them. Closed argument constraints
remain active. Literal homogeneous maps are validated with their registered
key and value schemas and may not capture runtime references. Registered typed
map outputs may bind directly into subsequent compatible inputs; prove key/value
constraints and runtime lifetimes, reject untyped narrowing and do not guarantee
arbitrary keys. Public template exports use the same key contract as preparation.

A batch target supplies one registered element argument. Compound discovery
matches the key resolver together with the action identity and capability,
producing candidate examples from valid owner arguments and actual binding
slots. It preserves unrelated actions, ambiguity and missing-name settlement.

### Conversation result delivery

Use ordinary step bindings when the successor is decided. To save public values
in the current App conversation, add `retain: {alias: {step, path}}` to
execute_design. Retention adds save metadata without changing delivery. Omitted
delivery preserves the final public result and images; use explicit
`delivery: "status"` when no work values or images are needed.
A later operation uses `{kind:"named", name:"alias", path:""}` in its arguments
without model retrieval. Same-call aliases with a producer step compile to step
bindings. For a decision use `delivery: {fields: {label: {step, path}}}`.
Omitting step selects the final projected result (the existing receipt on the
ready canvas route). Read a field of a saved snapshot with no operations and
`delivery: {fields: {label: {name:"alias", path:"/field"}}}`.

Names survive subsequent requests in the same open App document and
conversation. The browser owns bounded immutable JSON snapshots; only names
accompany the next model turn. Browser context exchanges do not execute canvas
actions. Request-only handles cannot become cross-turn references. Named
document targets remain subject to current validation before writes. A stale
document, failed selection or storage error reports actual settlement; never
replay completed work to recover delivery. App runtime disposal releases storage.

A dependent canvas action can bind a previous output to one argument and a
request-owned artifact selection to a distinct element slot in the same step.
The host resolves the artifact's exact membership at admission and type-checks
the remaining bindings against the registered action. The secured action
validates current document targets when it runs. Use one concrete expanded key
for a singleton anchor. Missing keys identify their argument and offer up to
three matching keys; ambiguous anchors report the match count. Live region
membership retains its step-time resolution.

Before preparing stage inputs, the agent considers ready actions, common parameters
and potentially reusable outputs. Known independent drafts and dependent operations
share execute_design; a selected draft guide supplies the same per-operation
arguments without a parts lookup. Visual decisions remain actual return boundaries.
Optional named public outputs may be saved before their later use is certain.
Selected authored parameters use `retain: {alias: {step, source: "input", path}}`
after successful execution; paths address ordinary operation arguments for both
native tools and canvas actions, without internal action wrappers. Same-call input
aliases bind authored values, and later turns use App snapshots. This grants no
cross-turn validity to request-scoped artifacts.

## Staged continuation implementation contract

The single execute_design entry accepts either operations or stages. A declared
stage prepares, mechanically checks/repairs, applies through canonical actions,
and exports selected App context before continuing. Public values may be retained
for later continuation even without a known consumer. Retention rejection identifies
the alias and exact request-lifetime field paths; it does not undo acknowledged
writes or prevent a successor with an already available direct binding.

Full structural admission precedes effects. Stage iteration checkpoints run before
the corresponding application, not after the whole request. Independent immutable
preparation may overlap pending application only under owner-declared access and
resolved input dependencies. Canvas-dependent work waits for acknowledgement.
Started work settles before terminal delivery; acknowledged work is never replayed.
Implementation and focused evidence are tracked in
[the staged execution plan](../plans/staged-design-execution-plan.md).

### Direct stage continuation and selected reference ownership

`record_design_facts` and `record_design_calculations` are composable under their
existing source/dependency validation. Ordered facts then calculations require no
model handoff. Visual capture/judgment retains its native boundary.

The direct `prepare_and_apply_design` entry also accepts optional `retain` and
`delivery`, with the same selectors as execute_design but no step field. For
example, `retain: {draft: {source: "input", path: "/draft"}, root: {path:
"/compositionIds/0"}}` saves useful stage context even without a known later
consumer. Select these optional inputs in scoped usage. The host lowers the
direct request into the existing sequence/result owner; there is no second store.
Inside an execute_design sequence, use its enclosing retain/delivery controls.
Unselected native calls preserve their existing full decision/recovery receipts.
Unavailable context rejects before drawing; optional storage failure retains the
acknowledged write and reports partial delivery without replay.

Selected model-visible result fields preserve their registered request-reference
lifetimes through runtime output export and host delivery. Runtime sequences may
assemble multiple prior step fields into a typed output object; no inferred IDs,
private lookup or lifetime extension is substituted. Owner model projection and
internal execution schema remain distinct. Named App snapshots still reject
request-only handles. Status-only delivery does not export discarded artifacts.

Canonical `read_design_context` supports existing ID, subtree and region
selectors. For artifact-backed targets use the host's `target` binding into
`elementIds`; choose `delivery: "page"` and explicit fields when values are needed.
Reference-only receipts preserve membership for later operations without returning
all rows. A data read does not register a judgment or trigger a completion reread.

Explicit evaluation work windows allow up to thirty minutes. The Taipei 101
runner accepts `--minutes=30`, retaining its fifteen-minute default and unchanged
prompt checksum. Report duration remains independent; null means no report limit.

The native host catalog publishes the registered owner input contract. Runtime
leaf schemas are separate: their removal of direct-only delivery fields must not
remove those fields from native discovery while retaining the original scope
declaration. Invalid scopes still fail; nested direct delivery options still fail
before writes.

The single `execute_design` host entry and `describe_design_apis` are eager native
declarations. Domain-specific operations remain deferred; acquiring their contracts
does not require searching again for the host entry. Optional authored facts,
calculations and reference notes are ordinary composable context. They are not
prerequisites for drawing or verification.
Strict evaluation reports retain the first bounded public tool error message in
addition to tool/call identity and stop kind. Empty-workspace detail captures are
explicitly not applicable; missing bounds for nonempty documents remain failures.

### Recorder-owned report transport lifetime

Once the work phase is settled and the report phase has started, a recorder-armed
strict evaluation report survives an HTTP `request closed` cancellation. It stays
in the original native thread, denies further tool calls, records transport loss,
and retains its complete public report without a time limit. Explicit cancellation
with a different reason, ordinary requests, and the drawing phase retain their
existing cancellation behavior. The recorder waits for the retained provider
report before cleaning up owned services even if browser evidence fails. The wait
is scoped to the original provider request observed at report entry. Other App
lifecycle settlements cannot end it; same-request failure and provider-service
loss remain explicit failures.

Snapshot transfer keeps serialized text behind an object JSHandle; a primitive
string handle would transmit its entire value in the protocol initializer before
chunking. Both initializer and chunk messages are covered by focused tests.
Missing browser evidence remains a failure and is never replaced with a claim of
visual or durable acceptance.

Known literal authored-input selectors are checked at structural admission before
writes. Whole-result selectors that can contain registered request/secret fields
are likewise rejected before effects; the host does not prune or extend their
lifetime. Individually selected request-scoped fields are also rejected before
writes. Usage distinguishes possible, guaranteed, portable and request-scoped
fields using the registered result and lifetime metadata. The host acknowledges
every object result with a required toolOutcome; raw owner validation and nested
action projection occur before that host acknowledgement. Delivery admission
identifies the failing alias, step and path rather than only the output envelope. Successful writes remain acknowledged when genuinely dynamic selection
or storage fails afterward; that boundary still reports partial delivery.

Selected usage makes named retention actionable: retention.scope is conversation,
wholeResultAllowed states whether an entire output can be saved,
guaranteedResultFields lists guaranteed portable selections, and
forbiddenResultFields identifies request/secret-bearing selections. Result
guaranteedFields and conditionalFields are disjoint; conditional presence is not
a binding guarantee. Explicit machine-result schemas remain authoritative; the same retention
permissions accompany both concise and machine-schema usage. App/host/workflow guidance distinguishes portable
continuation data from request handles; retaining an alias never extends a lease.

Result navigation is route-specific. `usageGuide.resultScope=invocation` and
`results` describe the actual outer reply. `stepResults` describes a named action
or registered leaf when that differs from its invocation wrapper.
`retention.resultRoot=named-step` and all retention guarantees derive from the
canonical named-step model schema. A ready-batch summary is not a named action
result; an invoke_tool execution envelope is not its leaf output. Native direct
owners reuse their existing projection. Derive both routes from authoritative
wrapper constructors and registered schemas, without field-name substitutions.
Before dispatch, pure authored delivery/retain selection errors return
not-started correct_input recovery. Missing dependencies, saved values, unsupported
owner schemas, omitted admission issues and post-execution delivery failures do
not gain that recovery. Corrected input must execute only after a new valid
admission; no rejected call writes or automatically replays work.
Failure-specific recovery projection applies only to failure receipts. Successful
selected ready-batch values have already passed owner projection; dynamic rows
are not reinterpreted as statically guaranteed named-step bindings at egress.

Recorder-armed evaluation stops on typed App/native execution failures, including
partial/unknown settlement, and externally confirmed missing or incorrect App data
that prevents execution. Preserve the first concrete failure across native calls
and nested host operations before same-thread unlimited reporting. Public host
issue strings and structured issue messages are diagnostic sources on failed
receipts; arbitrary nested value data is not. Normal visual correction, incomplete
artwork and arbitrary nested user data do not stop drawing. Correctable authored
input failures with explicit not-started recovery may continue. Actual unknown
writes, owner contract failures and missing required App data remain stopping
errors. Ordinary requests retain their normal recovery.

Selected preparation examples are validated against the selected schema first.
After the existing selected-optional-input priority, rank valid owner-authored
examples by distinct requested node-kind coverage. Compute coverage once per
example, using only the owner-declared selection. Widening a face/grid scope to
permit vector siblings therefore preserves composition coverage; vector-only and
unscoped discovery retain their existing examples. No inferred style, new material
behavior or mandatory workflow is introduced. Example selection is guidance, not
proof of visual acceptance.

Native inspection uses one App-owned maxEdge for schema region bounds, output
image bounds, capture execution and failure recovery. Selected capture usage
preserves the view contract: detail without region captures the entire target at
native resolution only if both dimensions fit the 1024-pixel bound. Larger targets
need a smaller child or an explicit target-local region. Overview fits the whole
target into a preview; detail does not silently crop or downscale. Existing partial
capture receipts and valid-image retention remain unchanged.

Strict evaluation diagnostics inspect only the known actionResults/result receipt
structure for a concrete child failure before using an aggregate partial message.
This preserves the native capture constraint in the same-thread report without
claiming that a captured image was displayed to the AI. Parent call identity,
bounded message size, first-stop latching and normal-request recovery remain.

### Selected output image delivery

Host output selection preserves canonical inspection/reference-image provenance
through field aliases and supported execution/recovery envelopes. The provider
adapter validates selected bytes, emits native image content and removes Base64
from text while preserving inspection identity. Repeated aliases decode the same
bytes once per reply; delivery does not recapture or replay a completed mutation.
Status-only, metadata-only and authored-input selections do not emit images.
Authored-input selections use the planner's ordinary-argument schema at admission
and delivery. Private provenance lasts for the invocation and does not establish
visual approval or create another image store.

### Browser prefix and native acknowledgement boundary

A transport failure may contain a raw browser executionResult with completed
actions. That prefix has not passed the host acknowledgement boundary. Its existing
operation failure projector preserves public receipts and removes diagnostics.
Recursive native result projection applies only to an embedded, acknowledged host
result, such as cleanup failure after successful owner delivery. Do not add a
secondary delivery failure solely because a raw App prefix has no toolOutcome.
The outer native result still requires its current outcome and settlement contract.

### Correctable input and failure delivery

`execute_design` revision 6 preserves a `failure` field when status-only or
selected-field delivery cannot complete. It contains the existing projected owner
receipt or sequence execution/recovery, using that invocation's failure schemas.
Draft references keep their request lifetime; they are not named conversation
snapshots. Successful delivery remains compact. Missing selected success fields
do not replace the actual failure or require the model to anticipate its shape.

Complete region target reads enforce expectedCount at the host after reading.
Empty or wrong-count matches return correct_input with not-started settlement,
without dispatching mutations. Incomplete, unavailable or unknown reads remain
blocking failures. Literal selectors stay literal; no fuzzy target substitution.

Strict evaluation allows owner-declared correct_input recovery with known safe
settlement, including multipart successes followed by a rejected input and the
inline root's aggregate receipt. It preserves the failed receipt for the same AI
to repair; it neither retries automatically nor replays successful parts.
Independent result-delivery errors, unknown settlement, unavailable App data and
abnormal interruption still stop. Ordinary visual corrections remain allowed.

Canonical input-schema rejection and a control-plane-only operation placed in a sequence
return explicit correct_input before dispatch. The control remains native; its
receipt identifies the registered direct route without automatically invoking it.
The host preserves the typed owner recovery through admission wrappers. Missing
or ambiguous capabilities, unavailable App context and errors with acknowledged
prior execution do not receive this safe-input classification.

Correlated native dynamicToolCall completion summarizes the existing App reply;
it is not a second execution outcome. Evaluation and protocol admission reuse
the registered binding, issued call identity and terminal status check. Actual
App receipts and delivery still own blocking failures; unmatched or invalid native
events retain their existing failure handling. No result cache or automatic retry
is introduced.

### Recoverable discovery identity selection

A completed discovery read with missing or ambiguous requested identities preserves
partial/failed coverage and publishes `IDENTITY_UNRESOLVED` with
`recovery.kind=select_identity` only when all resolved definitions were delivered.
The model may select a current exact identity without replaying writes. This recovery
survives retained reads and content pages. The evaluation consumer continues only
for this typed completed-read outcome with no independent issue; unavailable known
contracts, failed field scopes, unknown settlement and execution-owner lookup
failures remain blocking. This is separate from not-started execution admission.

Selected delivery retains canonical sequence failures through invocation validation
and resource handoff. Only model egress projects successful-prefix and rejected-suffix
recovery values. Public recovery preserves IDs, save acknowledgements, settlement
and exact repair while omitting internal fields; do not replay completed writes or
weaken canonical schemas to accept already projected owner output.

The existing invocation-schema hook distinguishes canonical owner validation from
model egress. Recovery branches use the matching registered App owner/revision for
model field visibility, while Runtime normalization and canonical resource schemas
remain unchanged. A model schema failure must remain a delivery failure; it cannot
fall back to an unselected generic schema or fabricate required internal fields.

## Execution recovery and evaluation

Correctable authored input errors return the existing `correct_input` recovery
before affected writes. The AI may correct the input and continue in the same
work turn. Completed prefixes remain acknowledged; recovery never replays them.
Real tool failures, unavailable required data, unknown settlement, failed media
or persistence delivery remain visible to the recorder. Visual design corrections
and the absence of a formal judgment are not execution failures.

### Shared contract delivery and review handoffs

Native declarations use the same lossless schema compactor as selected usage,
after native union normalization. Shared local definitions reduce repeated input
structure without changing owner admission, exclusive alternatives or reference
meaning. Provider registration bytes and App usage reply bytes are separate
measurements; neither establishes model token consumption.

Selected canvas-action usage supplies operationParameters for operation.arguments,
its executable example when the owner has one, result roots, retention and recovery.
Generated target-binding examples preserve registered field/path pairs and all
other required arguments; they reuse the same validated examples as purpose menus.
Its hostContract selector references the already available execute_design contract;
it does not repeat the host input envelope or full host instructions. Native and
registered tools retain their own invocation parameters. Exact full definitions
remain available. Exploratory candidate menus omit recipeDependency; exact lookup
retains authoring metadata. Only a canonical same-owner wrapper already represented
by an admitted action route is suppressed; foreign same-name tools remain distinct.

The AI chooses the views and canonical data needed for its decision and final
verification. Captures return actual images and identities; data reads return
selected canonical values. Neither requires registering criteria or posting a
verdict. Explicit mechanical checks remain available and composable. Their
results do not certify appearance or create global completion obligations.

### Compiled preparation findings

`prepare_design` revision 4 reports blocking compiled findings as
`available=false`, `applicable=false`, `settlement=not-started` and
`recovery=correct_input`. The retained artifact and findings remain inspectable;
no canvas apply has run. The combined workflow preserves that failure contract,
including acknowledged earlier parts. Corrected source must pass ordinary admission.
This changes neither geometry checks nor artifact ownership or strict evaluation.
An unavailable handle, execution uncertainty or independent delivery failure remains
blocking; successful compilation alone never authorizes applying failed findings.

### Target admission recovery

Pure registered target field/path/conflict and action-input validation preserve
`PREPARATION_REJECTED`, `not-started` and `correct_input` through both direct batch
admission and scheduled host planning. `field` names one identity argument;
`path` locates its nested slot. Dotted field aliases are not accepted. These
rejections precede target reads and canvas writes. Missing owners, artifact
handles/readers, incomplete target data and uncertain execution are not classified
as correctable input. Existing target cardinality, identity and canonical mutation
checks remain authoritative; the runner stop policy is unchanged.

### Discovery and stage continuity

The existing execute_design sequence consumes registered request-only operations
as well as reusable operations. Runtime composition `request` permits only
authored request sequences; registered and reusable inline recipes reject it.
It does not extend artifact leases or bypass canonical invocation, effects,
images, cancellation and settlement. Request-only source/review controls use
exclusive scheduling unless their existing owner proves independent access.
Usage exposes the registered host input envelope and named-step output contract.
Short action identities and qualified wrappers share those schemas across usage,
full and field reads. Owner examples are wrapped once at registration; callers
submit the delivered parameters without another argumentField transformation.
Retention describes the same named-step route, not a nonexistent native option.
Owner-declared result paths expose typed named-step selectors and conditional
presence without promising optional values. Grouping publishes its group ID at
`/actionResults/0/result/value/groupId`; context consumers use the canonical
unbounded document-ID schema, not a consumer-only length cap. Runtime validates
actual optional values before their consumers run. Same-submission retained input
aliases resolve authored arguments without a separate read; retained output aliases
remain ordered step dependencies. No draft echo or compatibility route is added.
Outer inspection defer controls automatic captures only. Explicit captures still
run, and selected delivery must carry every caller-selected image.

Purpose lookup orders complete metadata/identity term coverage before partial
lexical coverage, then uses current corpus relevance within each class. One
complete candidate can deliver selected usage despite partial alternatives.
Several complete candidates retain explicit selection. No tool is executed by
search, and exact identity ambiguity is never resolved by relevance.

Applied creation mapping is portable source-key to acknowledged document-ID
output selected with includeTargets:true. createdTargets preserves acknowledged
composition order and each keyToId map; omission returns an empty array. It can be retained in the existing conversation context without returning
the map to the model. Compact delivery does not remove binding data selected for
retention. Saved metadata describes bounded shape/navigation, not values; derive
it once on save. Canonical consumers recheck existence and permissions. Neither
source drafts nor stored mappings certify current geometry or group membership.

Known roots bind directly into queries; a query result may bind a later sorting
anchor. Pattern member names follow patternName - oneBasedIndex - memberName.
Candidate name/identity reads and geometry column reads keep distinct meanings.
Visual choice among candidates remains an agent decision.

A request sequence may acquire images and canonical data before returning them
together for judgment. Capture and data remain separate owner operations; their
shared host does not record approval. Each consumer validates the actual source
identity, membership or values required for its own operation.

Request sequences may bind a declared optional output field or array item to a
later operation. Admission proves the value type; execution requires the path to
exist and validates the actual input before invoking the dependent operation.
Empty or missing results stop that successor without replaying earlier work.
Unknown paths, incompatible types and impossible array indices still reject.
Saved recipes retain the stronger guaranteed-presence admission contract.
Action wrapper step results retain their declared actionResults/0/result envelope.
Generated pattern names are patternName - oneBasedInstanceIndex - memberName;
exact/prefix matching uses that full name, while suffix matches an authored member
name. A candidate list never implies visual approval of every candidate.

Purpose search normalizes ordinary English query connectors after exact identity
resolution. It does not modify catalog metadata, discard negative terms or turn a
connector-only query into an empty query. The strict evaluator preserves explicit
review rebind continuation through matching causal sequence receipts, including
successful captures followed by a scope conflict. Unknown outcomes, failed images,
unrelated delivery failures and mismatched recovery receipts remain stopping errors.

### Capture target membership in selected usage

The inspection owner defines capture membership before cropping: a concrete
scene target includes only its subtree, excluding overlapping siblings. A group
region includes its descendants within coordinates local to that group. Selected
review capture usage derives this meaning from the canonical inspection schema;
it must not omit it while preserving only native pixel limits. Switching from a
leaf to its owner group requires region coordinates in the new target space.
No target promotion, regrouping, mutation or automatic visual judgment occurs.

### Reference receipt navigation and purpose candidates

Reference context exposes selected image identities and authored notes through
ordinary result schemas. There are no signed use receipts. Request attachment indexes
retain their resource lifetime; authored purpose/limitations can be retained as data.
Discovery candidates remain choice metadata; executable usage comes from registered
owners. Preserve exact identity, requested fields and honest ambiguity.

### Provider-visible handoff contracts

The native thread/start tool packet and selected usage use one valid primary
owner example. Native schema compaction retains that example once; selected
usage keeps it in invocationExample. The host primary example performs two
operations with a same-submission authored-input alias. No model read or prior
submission is required. This is an available route, not compulsory reuse.

The sequence target declaration comes from its admitted canvas dispatcher, whose
region schema comes from the canonical region resolver. Ordinary steps, stages,
apply operations and iteration checks/repairs share that declaration. No region
resolver means no advertised region route. Invalid filters reject before dispatch.

Outer inspection controls automatic capture for ready canvas operations when a
settled review target exists. Omitted/immediate retains automatic capture; defer
omits it. Registered tools keep their own inspection arguments. Explicit capture
operations still run; delivery independently selects returned images.

Deletion usage publishes count/status selectors from its compact result owner.
Named or dependent target-bound operations compile to their admitted action
wrapper, preserving both execution and model output contracts. Target-bearing
arguments use the canonical selector and existing resolver at dispatch; complete
canonical arguments are validated before mutation. Anonymous independent work
retains the private batch. Scalar artifact expansion preserves ordered receipts
of the same action. Model selection uses the same admitted owner without a
single-batch substitution and is captured by the existing projected-result observer. Portable model-only fields are not re-exported as Runtime output
bindings: execution receipts and compact model values may have different shapes.
Declared execution-field exports preserve request resources. Batch resource
navigation derives from admitted output lifetime metadata, including structural
receipts and query snapshots; a selected snapshot remains usable afterward. Unknown selected paths reject
before writes; missing dynamic fields fail delivery without replay. Runtime step
dependencies and retained request lifetimes keep their existing validation.

Regressions inspect actual native packets and replies, execute the delivered
input-reuse example, and replay the recorded region/suffix deletion followed by
construction and explicit capture. Count dispatches and captures; raw owner schema
assertions alone do not prove provider publication.

### Target-bound execution result continuity

The recorded E6 sequence must apply details, resolve the current region once,
group six matching roots and bind its actual groupId into both captures in one
execute_design call. Existing conditional output admission remains: no-match or
wrong-count rejects before group mutation; failed or missing group output prevents
capture without replaying completed construction. Formal proof uses the original
geometry, selectors, result paths and capture region. jsdom replaces only renderer
spatial/pixel boundaries; the live run supplies actual rendered-image evidence.
Native protocol tests acquire the published group result path, submit the recorded
sequence and receive both images through the real provider dispatcher.
