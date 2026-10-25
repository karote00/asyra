# AI design execution flow

Registered App editing actions execute directly, including deletion and replacement,
with ordinary grouped Undo. The App prompt owns contextual permission questions
for external-tool use or security concerns through request_clarification; it does
not turn internal edit effects into confirmation requirements. Schema admission,
canonical locks and host/external security boundaries remain enforced.

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

## Request and continuity

The existing request carries the brief, attachments, current bounded context,
registered capabilities and validated conversation target references. Canonical
state stays in the App. A new request never assumes prior inspection evidence is
current. Deleted targets, changed document identity and replacement invalidate
continuity references; no geometry or image cache crosses requests in this slice.

Successor requests also carry bounded prior messages from the selected App
conversation's existing settled turns: exact request text, original objective
when distinct, the existing presentation owner's assistant answer and actual
outcome, with turn identity. These are historical messages, not current document
facts, tool programs, valid inspection evidence or caller-held Knowledge results.
Current instructions and corrections take precedence; never replay prior actions
or infer omitted content. Native threads and Knowledge sessions remain scoped to
the current request. History interpretation guidance is included only when history
is present, without increasing first-use instructions.

The App includes the newest contiguous complete turns in chronological order
within a 32 KiB serialized UTF-8 history envelope and explicitly reports the number
of omitted older turns. This bounds context cost, not model capacity. No message
is sliced. An oversized newest pair yields an empty history with an omission count;
an empty/new conversation omits history. Switching conversations restores only
that conversation's messages. Raw results, action arguments, progress, image bytes
and retained session credentials are excluded. Failed, partial and cancelled
results use the same authoritative presentation as the user sees. Current target
validation and safe retry rules remain unchanged.

Formal cases must prove controller-to-native-input continuity with the saved
ordinary consultation answer, isolation, clarification/retry, failure/cancellation,
whole-turn Unicode bounds and unchanged tool/work-turn counts. They must retain
session expiry and no-replay protections. Local delivery does not prove adoption.

## Capability discovery and composition

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
constraints and acceptance criteria, not a complete geometry inventory. Emit ready
coherent retained parts in a shared coordinate system; keep unresolved detail pending
without weakening the final acceptance contract.

Chosen-method advice exposes one executable advisory route: choose the method,
initially separate local material/join and whole-result obligations, apply a ready
part, capture its actual representative region, consume the returned binding and
record a primary-agent judgment before repeating that unresolved shared choice.
Capture/binding success is not a judgment; record success is not a pass. Exact
`recordedChecks` criterion/unit/status/revision and retained pending obligations
control interpretation; local pass can coexist with overall pending. Capture/bind
returns a non-final submission; the primary agent explicitly sets final on the
record call for completion, with fresh binding of retained images if needed. Correct a
failed material or missing view at its actual owner, retain unrelated passes, and
never rewrite judged criteria or replay drawing to repair evidence. Current
supersession protects replacement judgments. Unknown settlement requires inspection
of retained state before retry. Discovery uses exact native identities; missing
fields and lost definitions retain explicit recovery. This route is App advice,
not a Knowledge admission gate, extra model reviewer or second result store.
No-Knowledge actions, valid alternative methods and independent ready work remain
supported. Executable examples prove handoffs, not model adoption or visual quality.

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
is available, not unsupported. Use native Code Mode for dependent composition
and compact intermediate values; the App does not evaluate model-written code.
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
routes. Explicit mechanical review/capture uses the actual native wrapper and
its argument field, never a batch route. Missing or ambiguous wrapper registration
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
metadata. Usage never embeds input, output, partial/recovery or delivery validation
schemas; exact full lookup remains the authority for executable contracts.
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
cursor. Provider, discovery and result guidance agree on these routes. Code Mode
binds current values; Runtime owns admitted recurring iteration.

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
and face materialField retain their existing semantics. Grid palette restarts per
component instance; world fields evaluate at translated world positions.

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
Multiple bindings currently require plural elementIds; other scalar arguments such
as a hierarchy anchor use their ordinary explicit registered input. Target paths
cannot invent a new registered slot or broaden the supported binding grammar.

Prepared-check reuse depends on actual parent/workspace identity, basis, bounds,
document session, recipe, declared criteria and explicit source uses. Fresh capture
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

Structural direct delivery retains group/ungroup child identities and acknowledged
move identities in the existing request-owned context store. The immutable full
receipt is stored with that membership at synchronous mutation settlement, after canonical publication and before yielding. A later document change invalidates the reference instead of recertifying old output. Compact output returns `retained` with
`snapshotId`, `leaseId` and `total`, plus outcome/count/root identity; no expanded
structural or mutation-scope lists enter the model reply. Internal checking and
history consume the unchanged receipt first. A deletion has no live target set.
Only declared element-list arguments accept these references; point/segment IDs
remain ordinary explicit arrays. Resolve all references and validate their exact
request, lease, workspace and revision inside synchronous mutation admission.
Stale/released references reject before writes; no automatic reselection or replay.
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

## Main-workflow visual judgment handoff

The main drawing workflow accepts optional explicit `reviewChecks` using the existing
review owner's capture-check identities. Selection applies only to the invocation's
ordinary automatic image target; it does not assert whole-request coverage. Validate
selection against current or same-call criteria before writes. Reject selection with
`inspection=defer`. With no selection, preserve ordinary preview/defer and later binding.
Do not infer selection from plan prose, force early review or preload all review schemas.

After successful drawing and capture, reuse the existing review owner to validate and
bind those exact image IDs. Deliver `visualReview` with acceptance context and bound
`next.arguments`, the registered execution route and owner-derived status/evidence
constraints. The primary agent views the image and fills those fields, then submits
through the ordinary dispatcher. Capture and binding record no judgment and cannot
claim acceptance. Do not recapture or create another review state/registry.

Preserve image and requirement/result revision dependencies, signatures, independent
passes, multiscale evidence and explicit scope supersession. A failed follow-up retains
actual writes and successful images, reports partial, and provides review-only recovery.
Incomplete drawing never silently binds the requested checks to an earlier part's image.
Retain existing remaining-only recovery and true cancellation. Single/parts and full/
compact use the same boundary. Independent review capture/binding remain legal.

DoD: execute the actually delivered usage/example and returned next invocation through
real owners; remove independent model binding and mandatory full review-usage lookup,
measure total input/output and selected guidance bytes against the same local control,
retain all restrictions, and prove no repeated writes/captures on failure. Include
invalid selection, deferred/unselected work, partial drawing, cancellation, stale,
foreign/tampered/missing evidence, multiscale and independent invalidation. Local
correctness and byte reduction do not establish live model adoption or latency.

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
5,372 to at most 1,938 bytes without deleting any other field. Local evidence proves
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

Declaring review criteria returns a compact storage acknowledgement with criterion
and deferred-detail IDs and fact validity. It does not echo the submitted method,
requirements, source statements or references. The review owner retains complete
criteria, source facts/bindings and explicit reference selection for subsequent
checks; phase=facts remains the explicit fact retrieval route. Storage success
does not approve a drawing.

A coherent stage may defer screenshots. Only intermediate parts inside one
ordered invocation may coalesce mechanical checks until that invocation ends;
standalone writes check before returning. Visual assessment or completion still
requires current image evidence at its explicit decision boundary.
Numeric admission, a successful receipt and a model assertion are not visual
acceptance. Requested qualities, not a universal detail score, govern review.

Review discovery exposes one self-contained schema per phase. Plan accepts the
initial criteria and optional facts/bindings; facts retrieves or updates source
metadata; structure checks planned structure criteria; visual assesses current
appearance. Only visual accepts final/deferredChecks. Only plan/facts accepts
facts/bindings/dependencyChanges. Shared field definitions do not expose unrelated
phase inputs. Tool guidance states conditions before actions and uses the exact
field names. Cross-field and current-state validation remain at the review owner;
clearer wording does not authorize automatic argument repair or weaken evidence.

Intermediate visual assessments may select a nonempty subset of planned criteria
with final=false. They never approve completion and do not require evidence for
yet-unbuilt detail. Final assessment remains the default and requires all
criteria, current overall evidence and requested native detail.

### Attachment-to-reference preparation

Initial attachment metadata delivers the existing image owner's retained
referenceId alongside the unchanged image payload. Available admitted dimensions
come only from that owner, never caller-supplied validation. Identity availability
is not evidence of decoding or visual suitability. Initial delivery must not
fully decode unused attachments or gate first drawing on source selection.

When explicit reference uses require oriented pixel bounds, the existing async
selection entry prepares those sources through the image owner before the
synchronous reference/review owner records decisions. Existing in-flight and
completed validation is reused, including imported images. No new cache,
reference registry, AI call or required standalone validation is introduced.
Pending/rejected candidates and source-only facts need identity, not decoding.
Independent validate_reference_images remains a supported diagnostic/recovery API.

Unknown identities, invalid bytes, decode timeout and cancellation remain honest
failures; failed preparation does not commit selection or clear prior evidence.
Successful sibling preparation is retained for retry. Recovery targets failed
sources only and never repeats drawing or image download. Internal preparation
uses existing owner observation with actual duration/results. AI alone decides
subject/viewpoint suitability, accepted/restricted/rejected status, exact uses
and limitations; decoding cannot approve a source or a visual check.

Formal provider/dispatcher/real-owner tests must prove identity and pixel-use
continuity, deferred work, failure isolation, reuse work counts and lower total
handoff bytes/calls including initial metadata and guidance. Live AI adoption and
first-frame improvement remain unobserved until separately authorized.

### Primary-agent visual comparison

The primary drawing agent compares original request, retained criteria, applicable
original references and current rendered overview/detail images. `review_drawing`
records its evidenced findings without calling a separate model. When capture
targets are supplied, the tool returns images and IDs first; it must not accept
judgments submitted before those new images were delivered. The next ordinary
agent continuation inspects them and submits findings using current inspection IDs.

Visual criteria require image judgment; data criteria require canonical/numeric
evidence and cannot be certified by pixels. User requirements set the threshold;
optional polish does not block completion. Source applicability, rejected images,
unknown indexes, current coverage, nonempty evidence, cancellation and final
whole-request inspection remain enforced. Repeated primary-agent review is allowed.
Retain failed or unknown findings for correction; changed evidence cannot approve
completion. No model fallback is installed in the normal tool dispatcher.
Standalone diagnostic visual-assessment probes remain separate from product tool
execution and are not invoked by preparation or drawing review.

### Evidence tool responsibilities

Expose criteria definition, source fact recording, derived calculations,
reference selection and drawing review as separate discoverable responsibilities.
Names state the action and object. Their schemas contain only applicable inputs;
all route through the same registered invocation/admission boundary and existing
request-owned evidence state. Remove superseded public multipurpose routes
instead of advertising aliases. Preserve internal reuse and all actual review
checks. Discovery and recovery link to the exact current registered tool.
Reference selection returns candidate indexes, applicability decisions, the current
requirement revision, whether they changed and the current review handoff. It does not record or retransmit source facts or bindings.
Criteria initialization may include references; subsequent selection uses its
own owner method. Fact and selection receipts share dependency-repair, reference-applicability, then
current-review routing. Decisions resolve against all retained images, including
unselected images being rejected in the same batch. An unchanged accepted selection does not ask for another review.

Source facts retain source-attributed assertions with explicit dependencies. Derived
calculation records cite retained valid fact IDs and concrete verification, keep
full numerical precision, and may be corrected without changing those facts.
They are diagnostic calculations, not source authority or canvas validation; they
cannot be fact-bound to approve visual criteria. User-requested precision remains
a requirement. Otherwise judge the significance of a proposed drawing correction
using subject scale, viewing scale and visible impact; avoid reworking large
illustrations for negligible numerical narration. Do not round stored data or
silently change verified dimensions.

Identical fact, binding and reference submissions preserve accepted evidence.
An unrelated new unbound fact does not invalidate the reviewed result. Changes
to a bound fact or its binding identify exact affected criterion/unit checks; reference-use changes
invalidate only their dependent checks; canonical drawing changes retain their separate generation
checks. Unknown impacts and invalid source dependencies remain conservative.
Fact receipts report acceptance/fresh-review state and current registered recovery
instructions instead of leaving callers to infer what to do from a success flag.
An invalid source directs callers to record_design_facts first. Only a valid
source receipt directs them to review_drawing with the affected checks and current
inspection evidence. Machine-readable next-tool fields and instructions agree.

### Retained source facts and evidence assessment

When the source has been verified and the user has requested no contrary change,
preserve its result. Personal aesthetic preference is not a reason to change it.
The review owner retains compact source facts for one invocation: stable id,
statement, applicable scope, source references, verification notes and explicit
source/requirement dependency versions. Estimates and unverified model-generated
geometry are not verified source facts. Recording is a model's evidence-backed
assertion, not automatic truth certification or approval of rendered output.

Use `record_design_facts` to record or retrieve these facts,
or include them in the initial plan at first adoption. Bind reused facts to
exact planned criteria/units and known canonical element IDs with factBindings; image-backed bindings carry explicit fact-purpose referenceUses. The review owner attaches bound fact IDs to
criterion checks without requiring callers to repeat the relationship; existing canonical inspection coverage
validates the bound targets before a visual assessment. A binding is review
metadata, never proof of geometry or a second model of the document.
The primary agent can retrieve dependency-current facts with applicable
image evidence bound to its visual criteria, including source references, model
verification notes and scope/limitations. Unsupported facts remain explicitly
unverified. URL citations remain attributed assertions. Reference
adoption records what the image can support (for example, massing rather than
finished facade detail). Download success does not establish suitability. Data-only,
unrelated and invalid facts are excluded. These facts never substitute for current
canvas evidence or the primary-agent visual verdict.
Repeated retrieval neither researches nor asks the model to judge them again.
Ordinary drawing mutations do not alter source facts. A source change, user request
or concrete contradicting evidence must identify the changed dependency and reason;
only dependent facts become invalid and require verification. Valid facts cannot
be overwritten. Invalid facts retain their previous evidence until revalidated.
Facts never bypass current-image, external-change or final completion validation.
A new invocation starts without inherited fact authority; persistent diagnostic
records remain evidence, not a source of current validation. Canvas-dependent
observations stay in the existing revision-bound inspection owner.

Canonical Scene Tree/Props changes and document load/replacement participate in
evidence invalidation, including manual, remote and Undo/Redo changes. Inspection
must reject mixed-generation results. Reuse requires unchanged identity and a
complete dependency footprint; unknown dependencies invalidate conservatively.
No target-local cache is admitted merely because the local tool revision matches.
Final overall inspection and unresolved requirements remain mandatory.

Completion coverage follows the current canonical containment of this request's
scope, independently of the last target used for an automatic inspection.
Successful group/ungroup operations preserve that scope through their canonical
receipts. Adding detail does not discard earlier scope. Current whole-subtree
images may jointly cover the scope; unrelated roots, regions alone or unresolved
deleted IDs do not. The existing App inspection validation action verifies an
optional coverage query through public Scene Tree parent relations. The backend
supplies its owned scope and recorded overview targets, never a model assertion
of coverage. Plain generation checks remain constant work; coverage shares
ancestor reads within a single query and does not render or copy the document.

App inspection and layout measurement attach an ephemeral runtime/generation
stamp from public canonical change observations. The runtime owns subscription
cleanup; document load invalidates the generation. The backend compares stamps
and uses the registered read-only `validate_inspection_evidence` action before
accepting an assessment and before reporting an accepted completion. Validation
compares constant-sized values; it does not recapture, walk the document or
certify appearance. Absent validation or mixed-generation evidence cannot count
as current. If a capture exposes a newer generation than a successful layout
measurement, remeasure that target once; unchanged subsequent captures reuse
its validity, while failed measurements remain unresolved without an immediate
identical retry. No images or geometry are cached by this validity owner.

A question pauses the current segment and is shown independently. An answer
starts another segment. Completion, partial work and failure explain the actual
outcome and retained work. Preserve existing history, local completion time,
keyboard interaction and user Stop without App-imposed total retry/time quotas.

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

An explicit evaluation window may set `expandedNodeLimit: 2000` for diagnostic
reproduction. Omission retains the production 10,000-object ceiling; other override
values reject. This request-local policy is consumed by existing budget inspection,
preparation and retained-source partition planning and is disclosed in delivered
usage. It cannot be changed by a model tool. Compiler and browser safety ceilings
remain 10,000; no other budget increases. Recovery preserves whole instances,
geometry, order and existing no-replay rules. The runner records both limits and
never claims recovery coverage when a live submission does not exceed the limit.

An explicitly configured local evaluation window separates the work deadline from
an independent report timeout (60 seconds). Normal product requests have no such
window. The browser and provider consume the same absolute work deadline. The
browser checks it at the actual synchronous mutation boundary, including queued
work. A finite mutation already entered may settle; no later mutation enters and
committed changes are never replayed or undone by the deadline.

At the work cutoff the native provider cancels App tool execution and interrupts
the active turn. After its terminal acknowledgement it requests a concise public
report in the same native thread. Reports explain completed work, remaining work,
first-frame delays and uncertainty without requesting private reasoning. Report
calls cannot execute App tools or final drawing actions. Early work completion also
enters reporting. Missing interruption, transport failure, cancellation, malformed
report and report timeout are explicit failures, never artwork completion.

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
or ambiguous evidence stays failed; no drawing operation is repeated for capture. It saves report text and its screenshot without recording
video, then closes the work context before fresh-context reload. On report/capture
failure it records the missing evidence and attempts bounded cleanup; an external
watchdog bounds hangs independently. A self-report is not measured
provider reasoning time or a verified cause. Evidence collection has its own bounded
cleanup after reporting and cannot grant extra drawing time.

DoD: deterministic protocol tests prove same-thread transition and denial of late
App calls; actual transaction tests prove deferred-write rejection, retained partial
history and Undo/Redo; capture tests prove report/text/screenshot capture,
report timeout and failure preservation. Ordinary requests remain unchanged. Live
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
disables web search and Code Mode; no canvas executor or document is attached.
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

### Request-linked criteria and bounded inspection payloads

Plan criteria are named request-local entries, each retaining original requirement
text and a concrete observable description. Structure review selects criterion IDs;
fact bindings and result checks use criterionId. Descriptions can make a requirement
observable without introducing new user requirements. Every final criterion must
have current evidence; visual judgment checks deviations and relationships rather
than feature presence alone. All named criteria remain in the final checklist.
Image inspection returns current rendered evidence and coverage metadata. It does
not implicitly query or attach subtree object summaries. Explicit scoped context
queries own data retrieval; native resolution and overview behavior are unchanged.

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
contracts are saved once per invocation and linked by content digest. Per-check
model judgments are distinct from transport/output availability, and an unfinished
structure review is not a failed final review merely because `accepted` is false.

### Whole-result review and revision handoff

The primary drawing agent checks the actual rendered result against the original request as a whole
as well as each declared visual criterion. Passing a list of individually
plausible features is insufficient when their combined form contradicts that
request. The requirement controls realism, roughness, detail and unusual views;
no preferred angle or universal detail threshold is added. Structural reviews
do not reject unfinished finish detail. One assessment reports all currently
visible contradictions within its phase so revisions can address them together.

Review responses provide `correction.checks` from the existing pending result
store and required coverage, including findings outside the submitted subset.
Each check retains id, criterionId, optional unitId, status, revision, full evidence,
optional invalidation reason, exact inspectionIds and `factElementIds` from only
that criterion/unit. No criterion-level evidence aggregation remains. Passed
checks stay in the result store and are excluded from correction. Missing checks
retain their coverage status without invented evidence or scope.

`correction.inspections` resolves the union of these checks' retained image IDs
once. Each entry identifies its image target and optional target-local region;
`unavailableInspectionIds` preserves retired/missing image identities. Image
coverage and fact-bound elements are diagnostic context, never an edit target or
permission. Do not convert target-local regions into workspace edit queries or
use an overview root as the inferred defect target. Stale evidence stays a
question for fresh inspection, not a current visual conclusion.

Optional `correction.discovery` supplies the existing query entry and arguments
with an explicit caller-filled query. Select a capability intent or exact known
name; consume the returned execution route and complete contract. Known scoped
edits need no discovery. The review owner never lists repair tools, selects a
repair policy, reads Knowledge or guesses values. Existing query, preparation,
mutation and review owners retain validation, cancellation, partial receipts,
no-replay recovery and fresh affected-evidence requirements. These diagnostics
cannot authorize completion. No additional result store or retained cache.

Formal local verification executes the delivered guidance through existing query
and edit consumers, including world-material and local-property routes and missing
target decisions. It preserves multi-unit/multiscale identity, unrelated passes,
whole-view obligations and partial recovery. Measure the whole necessary exchange,
not a shorter summary that forces missing evidence to be read again.

The request retains unresolved primary-agent findings. A subsequent review receives
those findings as questions to check, not as accepted facts or construction
instructions. Fresh passing findings resolve them; stale passes cannot. Source
facts retain their existing independent dependency/invalidation contract.

If canonical evidence changes during visual analysis, return the completed
assessment alongside the actual freshness/coverage result as partial evidence.
Retain its useful findings and explicit next action, but do not approve detail
or completion. An expired inspection is not a malformed tool input. Transport
failure, uncovered scope and changed canonical data remain distinguishable.

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
Native Code Mode declarations may omit sibling union fields or abbreviate nested
schemas as unknown. Registration distributes common union fields into each branch
without changing admission. Exact-name lookup returns the canonical inputSchema,
including definitions and constraints, on every requested read through bounded
content continuation when necessary; explicit refresh remains available. No separately maintained schema copy
or model-authored substitute is used. Mixed lookups return
known matches with explicit execution routes and separately identify missing names.
They neither discard valid matches nor send native tool names to the canvas batch.
When an action and native wrapper share a short name, the same lookup supplies
both actual input contracts with their distinct routes. A flat action schema is
not the native wrapper schema; no extra qualified lookup is required to discover
that wrapper. Delivery reuse and explicit recovery remain independent per route.

Once direction and shared coordinates are established, prepare and apply each ready
coherent part, then review its actual result using phase=visual, final=false.
Remaining requirements stay pending; repeated geometry is not evidence that the
whole structure must already be reviewed. Structure review remains an optional
whole-structure checkpoint. Final acceptance still requires all planned criteria
and current overview/detail evidence. There is no new rendering or Undo path.

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
action lookup. Reference imports return original image bytes once per request/attachment;
later calls return the attachment receipt. Explicit refresh=true redelivers original
bytes after context loss or failed delivery, without re-downloading. Failed sources
remain retryable. Recording-only initial fit runs in the browser independently of
screenshot capture so a slow capture cannot postpone viewport navigation.

### Shared construction and first-write criteria

A semantic draft may declare `sharedFills` as draft-local names of solid/gradient
values and reference them using `fill: {shared: name}`. These names are not saved
property IDs. Preparation allocates one canonical Fill at first use, subsequent
entries reference that ID, and the receipt returns `sharedFillIds`. Unused
definitions do not create records. Equal inline fills remain independent. Unknown
keys or invalid definitions fail before application. Existing property linking
and detachment use the same public App APIs as ordinary editing. Saved documents
and Undo contain ordinary canonical relationships only.

The combined preparation/application tool may accept the exact existing plan
contract. It prepares the draft, registers the plan before mutation, and applies
the retained artifact through the existing owners. Invalid preparation or plan
cannot write. This is optional composition of the current owners, not another
review system: standalone planning and direct edit routes remain available, and
post-mutation plan rejection, facts, current evidence and final checks remain.
All model-facing plan examples must pass the actual advertised schema and owner.

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
owns deterministic preparation, optional criteria admission, canonical application
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

The original user request remains immutable in the invocation and primary-agent
result review. A ready partial drawing may be applied before model-authored review
criteria exist. The first criteria record may follow partial drawing but must
precede primary-agent result review/approval; it does not itself approve any output. Established
criteria cannot be replaced after mutation. Final assessment still compares all
requirements, including the original request, with current evidence.

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
or refreshing the page reuses that selected asset; refresh only redisplays it.
Identical decoded-admitted source bytes share attachment identity. Different
bytes remain distinct even when names or URLs resemble one another. Protocol
image delivery is verified independently from download success.

The provider adapter owns the Code Mode result contract: receipt JSON on the
first line and unchanged image data URLs on subsequent lines. Advertise one
executable forwarding recipe for this format, separate from MCP content arrays.
Forward images with the native image helper and only the parsed receipt with the
text helper. Retained Code Mode values can be redisplayed without reacquisition.
Formal tests cover zero/multiple images and exclude base64 from text output;
an opt-in real-model probe verifies actual image visibility from one acquisition.

### Image result delivery and recovery

The published Code Mode receipt example stores the complete result under a fresh,
caller-selected key before parsing or forwarding. A display failure does not erase
acknowledged mutations or the saved original image. The published recovery example
loads that same key and forwards the retained receipt/images without invoking the
producer again. Missing or malformed retained results fail explicitly; no fallback
capture, redraw, automatic retry or invented success. Independent calls use separate
keys within existing Code Mode storage; no new App retention mechanism is introduced.

The native contract must be tested with the actual published examples and actual
inputText/inputImage results through the native image helper, reaching the next
outbound request. Zero, one and multiple image cases preserve bytes and order;
image base64 must not become receipt text. Mock helper call counts alone do not
prove this boundary. Fixed offline responses may exercise the native executable
without invoking a real model. Evidence identifies source/example version and
native executable, and separates submitted results, native outgoing content,
unavailable live model visibility and model-authored judgments.

Image redisplay and criterion binding are independent. Existing inspection IDs
can be bound with bindChecks after criteria are defined, without recapture; current
revision, local and multiscale invalidation rules still apply. A forwarding failure
must not replay writes or discard the original execution result. Native regression
coverage is part of the existing local consumer gate. An unrecorded historical
forwarding error remains unconfirmed even after current deterministic tests pass.

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
preliminary lookup. Full and field queries remain available. Scope cannot combine
with usage or schemaPaths; refresh and continuations preserve it and its revision.

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

### Cross-query Knowledge dependency delivery

The existing read tool accepts optional `reuseFrom`, at most 32 unique opaque
`contextKey` values from complete results whose advice the caller still holds.
No extra discovery, acknowledgement, parent read or Knowledge prerequisite is needed.
Without this opt-in the entire required dependency closure is returned as before.
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

The App guides Code Mode to consume one bounded page per output and retain composed
data without printing all pages together. No output-budget increase or mandatory
Knowledge prerequisite is introduced. Native request tests must verify exact page
content and lossless reconstruction, separately from actual model adoption.
Discovery and provider instructions must publish the same executable informational
forwarding example. It accepts one original text-only read reply and a query-specific
Code Mode key, validates contiguous revision-bound byte coverage, and retains the
complete parsed value only at completion. Each exec forwards one original bounded
page, not the assembled value or a schema summary. Replaying a saved original page
requires no tool call. Repeated identical pages are valid; gaps, mixed revisions,
incoherent byte metadata and oversized single replies reject before state replacement.
Failed read receipts cannot overwrite valid retained content. Fresh reads and refresh
remain legal after context loss; use a fresh key for changed content. Existing
text/image receipt forwarding remains independent. Tests execute the actual delivered
example and inspect real native successor requests; neither storage nor tests prove
model adoption or prevent arbitrary agent-authored oversized output.

### Source and upstream evidence provenance

Offline native delivery verification may replace inference with fixed loopback
Responses events while retaining the actual native executable and tool consumer.
It must preserve the subsequent outbound request, fixture/binary identity and
explicit missing evidence using existing diagnostic storage. Never equate a native
echo, history view or scripted response with final remote model visibility. Test
configuration must not change production refresh behavior or increase output limits.
Cross-execution proofs must retain each scripted exec, corresponding actual outbound
request and public notifications through that same evidence sink. Verify retained
fragment coverage, revision and byte identity before parsing; a last page alone is
insufficient. Compare compact and full printed output separately from retained
content. Missing coverage rejects assembly. Scripted store/load observations do not
expose native storage internals or establish historical AI behavior; absent public
orchestration output remains explicitly unavailable.

For matching discovery and Knowledge calls, retain publicly exposed native completed
result content through the existing profiler payload sink, separately from App
output. Decode JSON text before redaction; record original byte counts and digests
without claiming sanitized bytes equal original bytes. Missing/null, empty,
malformed and non-text results remain explicit. Native echo is not final model
visibility. Exec/wait output without an explicit child-call relationship remains
uncorrelated and its arbitrary body is omitted. No private reasoning or credentials
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

Mechanical image admission retains original bytes and content identity. It does
not establish suitability. `select_design_references` retains batched model
assessments keyed by immutable reference identity and requirement revision.
Pending and rejected references remain available for investigation but cannot
enter accepted comparison. Restricted references carry explicit criterion/unit uses, purpose,
limitations and required original-image whole/region declarations; canvas inspection regions
remain a separate coordinate space. The tool checks structure and identity, not
visual truth, and never decides applicability from filenames or site rules.

Facts are source-attributed assertions. Dependency freshness is separate from
evidence assessment. Every cited image needs current applicable evidence for the
bound criterion/unit and purpose; one eligible citation cannot bless another ineligible source.
URL citations remain assertions. Selection and decision changes invalidate only
affected evidence/review, while unchanged submissions preserve current review.
Current source limitations travel into local corrections and primary-agent final
review. Changed requirements expire prior decisions. Original evidence is retained.

## Completion presentation

Settled answers and retained-progress explanations appear in the AI conversation.
Do not repeat them in a canvas-spanning completion/Undo toast. Ordinary toolbar
and keyboard Undo/Redo retain the existing history contract. Removing the overlay
does not alter partial outcomes, cancellation, unrelated notifications or history.

### Composed capture-to-review handoff

review_drawing accepts current inspectionIds and/or explicit inspections using the
registered inspect_drawing target schema. Prefer inspections when fresh captures
are needed; retained IDs support exact evidence reuse. Both feed the same review
owner. The total evidence selection is bounded to 24, and existing IDs must be
unique nonempty strings. Target regions retain native-resolution limits.

The inspection owner captures each requested target once, admits only successful
stamped image receipts, and forms the review IDs internally. Any unavailable
capture returns accepted=false, successful inspectionIds and failedInspections
with the exact target and recovery guidance. It does not run the assessor, filter
away required failures or substitute an overview for requested native detail.
Retry may combine successful current IDs with corrected pending targets. Missing,
stale, mixed-generation or insufficient-coverage evidence still blocks review;
all original criteria and post-assessment freshness checks remain in effect.

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
stops, with optional opacity and declared clamp/reject endpoint behavior. One
call may combine disjoint mappings at one fill index. It validates every snapshot,
column and current target inside mutation admission, then calls the public plural
fill API once. The mapping owner resolves fill identities through the public API
and rejects conflicting simultaneous values for one shared fill before writing;
it does not change the public API's ordered-update semantics or detach relationships. Stale or evicted references produce
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
`motifs: { template: key }`, with no other fields or overrides. The same definition
may be used by grids with different boundaries, orientations, counts and painter
orders, including pattern members. Templates are generic normalized polygons, not
semantic presets. Do not infer repeats or require template use.

Every named definition has a nonempty key of at most 160 characters and a nonempty
array of valid motifs. Missing references, duplicate motif keys, invalid definitions
and inline/reference conflicts reject before application. Definition validation and
camera-dependent offsets occur once per construction invocation; each boundary and
cell mapping remains independent. All definitions count toward source admission;
each use counts its complete expanded output. Existing limits remain unchanged.

Preparation retains definitions in its existing immutable source; repair and parts
reuse that source. No new canonical property, cache across invocations, registry or
storage mechanism is introduced. Ordinary vectors retain the inline equivalent's
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

The primary drawing agent reviews actual current images and records its findings
with `review_drawing`; normal tool dispatch must not launch a separate assessor.
Repeated primary-agent visual review is allowed. Store program and primary-agent
results with distinct provenance, scope, criteria, evidence and dependencies.
Use pass, fail, unverified and stale states; normal worklists omit passed details
but retain counts and an explicit retrieval path. A changed dependency reopens
related passes without deleting objects or erasing previous evidence. Unknown
scope invalidates conservatively. Browser-issued visual receipts track their actual target subtree or target-local
region and contributing ancestry. Shared property edits follow canonical owners;
regional entrants and exits affect membership. Viewport pan/zoom and selection
never invalidate evidence. Each primary-agent criterion may name a subset of the
call's current inspection IDs; otherwise it depends on all supplied images.
Invalidate only dependent judgments, preserving unchanged passes and their original
evidence. Whole-building judgments still depend on the whole building. Unknown
impact and document replacement fail closed. Current receipts captured at different
scene revisions can be combined after individual browser validation. Mutation
revokes completion immediately; fresh overall/detail coverage is still required.
Unscoped deterministic and attachment evidence retains its global safety contract.
Source/reference changes use declared criterion bindings. Unchanged passes may be
reused only when their dependencies are proven current. A model assertion never
clears a deterministic failure. Final acceptance still needs current inspection
coverage and all original requirements; optional polish is not a failure.

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
within their parent artifact. Attachment acquisition, validation and conversion
remain control-plane source operations: their numeric provider attachment
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

### Scoped visual check units

A primary-agent check may name a stable unitId within its original criterion.
Different units retain separate results and image dependencies. The initially cited capture targets and crops define a unit scope; receipt
revisions do not define its identity. Changing the set of target/crop scopes,
including adding a broader scope, requires exact revision/reason supersession.
A regional or cross-region conclusion may cite both an uncropped target image and
a crop of that same target when both are needed. Every explicitly cited image is
an actual dependency; changing either invalidates that conclusion. A local-only
conclusion cites only its required local evidence, never an inherited batch list.
Broad evidence deliberately carries broad invalidation. An overview attached to a
regional conclusion does not replace the separately declared whole-view judgment.
Capture success, a valid binding and a supersession reason do not establish visual
sufficiency. Retain necessary evidence when recovering; do not narrow the evidence
merely to obtain a current pass. Independent regional overviews and multi-target
cross-region checks remain valid.
Intermediate visual review accepts current local crops without requesting an
unrelated overall view. Omitted units retain their status, and invalidation follows
their actual image dependencies. Final review still requires current whole-request
coverage/detail and original criterion judgments, and cannot complete with a
retained required unit failed, stale or unverified. Reusing a unit for a different
scope requires explicit redesign reconciliation rather than silently discarding
its earlier obligation.

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

Capturing an image does not execute deterministic subtree checking. The explicit
mutation coordinator checks acknowledged targets before returning, even when
`inspection=defer` suppresses screenshots. Ordered parts collect targets in an
invocation-local boundary and check each distinct target at the completed or
partial block boundary, rather than repeatedly checking intermediate states.
Confirmed delete, ungroup and replacement receipts retire removed targets from
this invocation's pending checks. Browser batch errors carrying acknowledged
receipts enter the same check boundary: settled partial writes are checked and
the original failure is preserved; missing receipts or unknown settlement never
become successful execution. Current measurement stamps are reused. Check failures preserve acknowledged
writes and return separate target-specific diagnostics; missing or failed checks
remain unverified and block completion, including missing checking capability.
A shared unavailable capability or unknown settlement returns one diagnostic
with affected count; each target retains its actual check state. Cancellation
stops new checks and publishes no late verdict. Explicit unknown mutation
settlement prevents follow-up checks even when execution status is partial or
failed. Automatic capture waits for current complete mechanical checks without
findings at the affected targets, including reused results. An explicit capture
remains image-only and may be requested separately to diagnose findings.
No model-facing capture option skips these checks. Final assessment
consumes only an exact single matching mechanical acknowledgement with coherent
availability, completion and a current canonical stamp. Failed freshness reads
make that target stale, retire its reusable stamp and retain known evidence;
failed explicit rechecks cannot leave an earlier pass current. The next coherent
boundary may recheck once to recover. Incomplete checks retain both prior and
newly observed findings without treating them as a complete current pass.
Check tails return `checks` counts and an optional `firstPendingId`, readable
through `read_design_checks`; they do not retransmit every retained finding.
Confirmed target removal retires its tool-owned result and makes actual dependent
checks stale, preserving unrelated and primary-agent obligations. Recreated IDs
receive a newer check revision. Explicit result reads refresh only the requested
checks and transitive declared dependencies. Independent preparation freshness
failures are retained as stale results without preventing other selected reads;
cancellation still stops the read.

Final assessment
requires a current complete deterministic result for each overview target. It
validates retained measurement stamps through the browser owner, computes missing
or stale results once, and returns incomplete work when checks cannot complete.
Intermediate local visual findings do not trigger an unrelated subtree scan.
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

### Explicit visual unit redesign

A changed unit scope preserves its criterion/unit identity and requires
`supersedes: { revision, reason }` naming the exact current result revision. The
replacement consumes current delivered evidence and remains an outstanding
obligation until assessed. It cannot erase a finding, rewrite the criterion or
certify a removed object by transport success. The primary agent explains how the
new design resolves the old finding; final whole-request coverage is still needed.
Repeated identical submissions are idempotent; stale revisions cannot overwrite
newer judgments. Changed results invalidate actual dependent checks. Equivalent
image scopes are set-valued, independent of capture ordering or duplicate views.

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
paths. Its revision 4 target is a document runtime reference, supplied by current
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

A deterministic review may receive optional unique measurementTargets IDs from
retained checks. The browser reviewer returns coveredMeasurementTargets selected
from the exact successful capture coverage, with the same receipt. Selection adds
no geometry reads and exposes only requested IDs, never the complete subtree.
This selection certifies scope only: it does not certify compatible rule context,
prior receipt freshness, findings or visual quality. Incomplete/cancelled captures
do not authorize reconciliation.

The operation owner supplies its existing retained targets in the original review
exchange, including relevant targets of the same ordered read batch. It reconciles
only current retained obligations selected by the captured coverage, using the
existing bounded validation action. Empty or absent selection triggers no extra
exchange and leaves unrelated results unchanged. Explicit selected review remains
legal. Object count and server-inferred ancestry cannot select coverage; no
all-target fallback, added query prerequisite, state store or write replay is allowed.

Canonical canvas measurement results are retained in the same check store per
checked target, alongside prepared-source and primary-agent evidence. Complete
rechecks reconcile existing mechanical obligations proven by their exact
supported-rule/subtree coverage. Deleted or missing targets are not captured
coverage: only explicit canonical retirement may retire an obligation; omission
from coverage never approves or erases it. The browser
reviewer alone certifies coverage and issues independent target receipts; ancestry
or an aggregate pass is not sufficient. Partial/uncovered/incompatible results
remain unresolved. A later sibling edit cannot invalidate a reconciled independent
target. The validation action accepts `measurementTargets` (1-64 unique IDs) only
with mechanical evidence and without visual scope; entries contain `elementId`,
`available`, and, only for complete compatible coverage, `complete`, `findings`
and `evidence`. Unavailable entries carry a reason. Covered-root normalization
excludes external parent containment and requires compatible inherited visibility.
The server commits each acknowledged result only if its selected obligation
revision and receipt remain unchanged. Late/cancelled results cannot replace newer
state. Subsequent selected reads, verification and request completion consume the
same reconciled ledger; selected success never claims whole-request completion. Reads validate actual browser-issued scoped receipts
without running geometry checks. Invalid receipts stale only their dependent
units; current unrelated passes remain. Container and text findings both block
completion. Mechanical passes cover supported rules, never visual acceptance.

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

Automatic checks retain complete findings in the existing request-owned check
store and return a compact summary with the first pending result ID. Default direct review, prepared review and retained-result delivery use the same bounded check summary. `read_design_checks` returns summary by default; explicit IDs or `view: details` provide bounded detail with ledger revision, offset and next offset. Subsequent pages must name that ledger revision and reject a changed version. Internal results remain complete; explicit full batch/workflow responses may include automatic check receipts. Default delivery must not resend
full findings, including large complete checks with known failures. Screenshot
receipts and acknowledged product writes keep their existing output contracts.

Missing, incomplete or mismatched mutation scope creates one terminal request
obligation in that same store, not a second state collection. No geometry recheck
can reconstruct unacknowledged write coverage. Further document writes in this
request stop before dispatch; read/check/capture and an accurate unsupported
outcome remain available. Preserve existing document work; never replay it or
promise a reconciliation tool that does not exist. A subsequent request starts
from current document state rather than replaying this request. Ordinary failed
mechanical checks and stale evidence remain retryable through review_design.

Compact count receipts explicitly distinguish request-wide counts from selected
checks. Neither count scope asserts visual acceptance or document durability.
Review replies identify capture, bind or record; only successful recording returns
compact exact acknowledgements of committed check identities, criterion/unit,
origin, status and revision, including passes. Failure before recording returns no
acknowledgement; partial completion after recording preserves committed receipts.
Capture and binding never pronounce readiness for further drawing. The optional
structural judgment reports only `structureAccepted`; final `accepted` remains
whole-request acceptance from the canonical owner. Capture/bind cannot reset a
current acceptance merely by reporting a different constant; invalid evidence
still invalidates through the canonical owner. A valid unverified judgment is
successful recording.
Full bodies remain available through the existing retained check read. A source
or reference handoff with current visual acceptance but pending mechanical work
identifies the exact pending check read; it must not demand another visual
judgment or leave the next action absent solely because visual work passed.

Multiscale acceptance cases: bind and record a same-target overview plus crop;
keep an independent local-only pass when only the overview changes; stale the
combined conclusion when either image changes; recover with current same-scope
images without drawing replay; reject missing, foreign or tampered evidence and
unversioned scope changes atomically. Partial capture and cancellation cannot
publish a pass. A regional overview cannot satisfy an unjudged whole criterion.
Final acceptance requires all independent obligations and current evidence, and
is revoked when any required dependency changes. These cases use generic targets,
not a particular subject, material or crop coordinate.

### Declared regional acceptance coverage

Every visual criterion explicitly declares `requiredUnits`, within the existing
24-item bound. An empty array intentionally declares a whole-view judgment; a
nonempty array declares independent regional or cross-region obligations. Missing
scope is rejected atomically by the declaration call without storing a plan or dispatching canvas mutations. This does not introduce a plan-before-drawing gate. These are stable regional or cross-region judgment identities, not
geometry or a new tool. A visual criterion with empty requiredUnits remains a whole-criterion
obligation. Data criteria omit requiredUnits. Partitioned criteria cannot be data criteria or structure checkpoint
criteria. The first declaration may follow the first ready drawing. Once judgments
exist, obligations cannot be rewritten; an established plan also retains its lock
after a drawing mutation. Identical declaration must not reset findings.
The primary agent submits findings for delivered images; tools do not call an
additional model or infer visual correctness.

The existing check store accumulates current passes across calls. Final acceptance
requires every declared unit (including never-submitted units), all whole criteria
and all retained unresolved findings. The same derivation governs review replies,
correction instructions and completion settlement. Omission or a whole-criterion pass cannot
substitute for missing regional work. Every submitted judgment supplies its own nonempty inspectionIds; the enclosing
image list is availability, not an inherited dependency list. Sparse reviews may supply only changed units;
unchanged passes retain result revisions and image dependencies. A cross-region
check names every required image, so editing either dependency invalidates it.

Required unit coverage, image extent and evidence currency are separate facts.
A regional plan retains an explicit whole-view visual criterion for whole-request
agreement and canonical requested-target coverage. Unit names and local passes
cannot establish that crops cover the whole drawing. Local acquisition and recording
valid local judgments do not require that whole-view condition to be complete yet.
Incomplete acceptance saves valid judgments with accepted=false; malformed candidate
submissions overwrite no prior judgments. Requested native detail, source facts,
references, deferred decisions and mechanical conditions remain independently required.

Evidence validation uses submitted images plus relevant retained results through
the existing browser owner. Whole-view containment is required for the whole-view
criterion, not each regional judgment. A genuine change in a whole-view image can
reopen that judgment without reopening independent local passes. Criterion-scoped
source/reference changes affect that criterion's units; no finer scope is guessed.
Pan, zoom and selection are not semantic edits. Final settlement validates the same
effective accepted evidence, not every historical or superseded inspection.

Unit scope changes require exact revision/reason supersession and never remove the
required identity. The reason is an explicit primary-agent redesign decision, not
tool proof of semantic or geometric equivalence. Known findings must be addressed
with fresh evidence; actual dependent checks reopen and unrelated passes retain
their revisions. Identical replay does not create a new result revision.

Capture and binding replies expose informational `acceptanceContext` alongside,
never inside, executable `next.arguments`. Derive the shared method and requirement
revision from the current canonical plan and project each selected criterion's exact
requirement, description and optional unitId. Bindings and context share the current
requirement revision. Unbound recovery exposes no invented selected checks. Context
neither records judgments nor establishes image completeness or a visual pass.
For requested realistic reflective materials, primary-agent assessment includes visible
material/reflection character as well as joins, color continuity and lighting. A smooth
height grade alone is not realism evidence; deliberately flat styles remain valid.

Replies expose derived coverage counts and pending criterion/unit identities and
statuses; full evidence remains in the existing check store. Capture and partial
capture replies retain their own output requirements. Accumulating more than one
call's image limit does not require model-side retransmission or a limit increase;
the host validates retained receipts in bounded batches. Stale, unavailable or
incompletely validated evidence stays unresolved. Cancellation cannot publish a late
pass; review recovery never replays drawing writes. Request teardown expires evidence.

Accumulated inspection validation includes the browser owner's `validatedAt`
session/revision. A host validation sequence must use one observation version;
version drift prevents publication of new judgments and reports partial validation.
It does not invalidate independent checks: later receipt validation identifies
actual affected dependencies. Missing, duplicate, failed or malformed validation
acknowledgements cannot establish currency. Cancellation publishes no new judgment.

Sparse deferred-detail decisions use the same check store as regional judgments,
including their explicit omit/restored/pending disposition and the submitted image
dependencies. Valid decisions survive incomplete global acceptance. A changed detail
definition or actual image dependency reopens only that decision; source/reference
changes remain conservatively dependent on all criteria because deferred decisions
have no narrower source binding. Missing decisions remain pending. Redefinition
cannot silently reuse an earlier pass. Whole-view judgment may be deferred until
the final candidate without discarding current regional or deferred decisions.

Review acceptance and settlement both remain false while any tool-origin result is
unresolved. Resolving mechanical work alone preserves and reuses current primary-agent
judgments. A malformed negative validation response is unavailable evidence, not
authority to delete retained receipts; only an admitted current=false acknowledgement
may retire its dependencies. Recovery validates again without replay or recapture.

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

Capture replies, including partial capture, expose current pending coverage and
instructions for recording only observed local judgments before the next edit.
No status is fabricated. Valid passes accumulate in the existing store; subsequent
reads and final acceptance consume them without retransmission. Each judgment cites
only images it actually depends on; citing an overview makes it a real dependency. The enclosing
image list is only a selection menu: unused entries, including retired entries,
cannot block a submitted judgment or become freshness dependencies. Selection
must still be a subset of that menu. Capture requests validate all requested
images; deferred-detail decisions retain their enclosing-image dependencies.
Final acceptance validates retained passes as well as submitted judgments.

Current activity uses the live common call purpose before retained stage context.
Observed operation and authored purpose are separate visible facts. Admission/queue
churn preserves a stable operation description, not an obsolete stage action; exact
phases remain diagnostic. With no active call, stage prose is explicitly labeled
as context. Completion removes call purpose; concurrent ancestry and lifecycle
precedence remain authoritative. No timeout-based guessing or extra model call.

Capture before criteria returns a definition handoff and retains image identities;
it does not request an impossible judgment. Current-operation changes do not append
identical authored subjects to history. Derived history replaces only its current
projection, never mutates earlier snapshots or suppresses diagnostic events.

A known tool queued or admitted before execution is labeled as preparation for
that operation; only execution presents the operation as active. Admission repeats
preserve the existing description. A late preparation phase does not turn an
already executing call back into a queued operation.

Whole-drawing coverage is a separate check dependency from criterion/source validity.
A failed overview coverage check reopens whole-view judgments and declarations,
not independent regional units sharing the criterion. Regional judgments still
depend on every cited image and their actual criterion/source requirements.

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
visual-assessor provider/export/options/results. Shared current check data remains
neutral. Partial judgment replies derive unresolved criteria and their evidence from
the current shared result store, not only the submitted subset or a second history.
A later failed/unverified structure judgment revokes earlier final acceptance while
preserving unrelated passes. A structure-only recovery cannot grant final acceptance;
a coherent primary-agent final review must close the retained obligations. Validation
without publication and rejected input do not change those results. Explicit judgments
of existing content govern completion even when this request made no document edit.
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
retire only the deleted target's own obligation, not dependent visual criteria.

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

### Explicit visual judgment bindings

review_drawing capture inputs declare criterion/unit checks on each target. Existing
images are bound explicitly with bindChecks. The review owner returns per-check
request-authenticated descriptors with requirement/result revisions and canonical
image dependencies. The primary agent supplies status/evidence after seeing images;
submission never infers or changes the declared scope. Tool submissions require
current bindings and browser currency validation, with atomic mixed rejection and
unchanged independent passes. Exact current replay is idempotent. Failed capture
retains successful images but cannot issue a binding for an incomplete check.
A rejected binding after capture returns a partial handoff with successful image
receipts and explicit bindChecks recovery. It records no judgments, retains
independent passes and does not classify settled capture as an unknown canvas
write. The caller reads affected current revisions before rebinding; no implicit
supersession, recapture or edit replay.

### Explicit reference uses

Selected image suitability is a primary-agent assertion. Every accepted/restricted
source declares uses with stable IDs, exact criterion/unit, purpose, original-pixel
region (explicit whole is valid), and limitations. The request owner issues immutable
identity/revision receipts. A criterion-wide decision is not regional permission.
Visual judgment, fact adoption, preparation and pixel comparison consume explicit
current receipts for their matching purpose. Reference-free work needs none.
Only changed use dependencies become stale; selection order and unchanged uses do
not invalidate independent passes. Missing, foreign or stale uses reject atomically.
Pixel comparison also needs an explicitly corresponding target crop and alignment;
source decode/bounds success never establishes semantic suitability. Asynchronous
consumers revalidate before publication, preserving actual completed effects.

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

Relevant advisory knowledge is the default method reference for open design
choices, subject to user intent and current capability/security contracts. Shared
Domain Knowledge contains only domain principles; Design owns tool mappings,
representation limits and operational guidance. Missing/irrelevant advice and
known-value edits do not block execution. Existing brief, method, criteria and
fact artifacts retain concise decisions; no new approval gate or knowledge store.
Only affected decisions are reconsidered after a real dependency change.
Tools accept valid inputs independently of Knowledge reads or recommendations;
no Knowledge ID, acknowledgement or adherence proof is an admission prerequisite.
App guidance maps an agent-chosen method to existing contracts. Deterministic
replay may control the agent decision and external evidence to verify those
contracts and recovery; it cannot establish that a real agent adopts the method
or improves design quality. Those efficacy claims require real-agent evidence.

Compact query menus and usage views group a canonical basic action with its
explicit registered wrapper route, retaining the qualified full-definition
selector. Foreign namespaces and uncertain associations remain separate. Full
and exact-name lookups retain distinct contracts; a menu is not an executable
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

Unscoped usage views derive root input paths, output pointers and element-slot cardinality from the
canonical descriptor. Owner-authored examples are published only when they validate
against its current input schema and are wrapped in its actual native, batch or final
response route. Native conversion retains common examples at the complete union scope,
not inside alternatives that reject those inputs. Example identities are illustrative, never live credentials. Missing
or invalid examples are explicitly unavailable. Full schemas, exact fragments and
explicit delivery/context-loss recovery remain authoritative; a returned response is
not evidence that the model read or understood it.

High-level preparation and criteria tools expose their existing executable owner
examples in the canonical input schema, not only description prose. Usage publishes
one validated illustrative invocation through the actual native/batch envelope;
full retrieval includes the complete contract and examples. Navigation includes
local schema-definition paths without recursively expanding references. Fragments
retain ancestor constraints and local reference closure and remain partial documentation.
An unknown path is recoverable and never dispatches a drawing action. Exact lookup
still defaults to full; route-only usage is optional, not a prerequisite. A known
contract can execute directly, including without Knowledge. Explicit recovery keeps
view/paths and never retries a previously completed product write.

### Exact-name query selection

Before lexical matching, query checks existing admitted exact identities (action,
semantic operation, native name or namespace.name). Trim surrounding whitespace;
otherwise use existing exact case and spelling. An exact hit uses the same identity
resolution as names, including ambiguous-name rejection and independent action/native
routes. Descriptions referencing that identity do not add matches. No exact hit keeps
the existing lexical capability search; category exploration remains available.

Representation is unchanged: query without view is a menu, usage is usage, full
retains canonical restrictions. Exact queries need no additional lookup and no
inventory offset; a nonzero offset rejects rather than falling back to lexical
search. Existing content paging, registry revision checks, refresh and no-replay
recovery remain. No new selector, registry, result store or limit is introduced.

DoD: replay the saved main-workflow query in one reply; adding 10000 descriptive
references does not grow delivery or calls. Verify purpose/category exploration,
qualified names, ambiguous namespaces, action/native dual routes, complete full
contracts and executable usage/recovery through existing owners.

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

Owner-declared optional input groups are selected with inputScope.optionalInputs in
the same read. The workflow publishes plan as optional: select it only when defining
criteria in this invocation. Without that selection the scoped contract forbids plan
and explains how to select it; drawing can proceed without it. Full unscoped queries
retain all inputs. Only optional canonical root fields can be declared this way;
unknown or duplicate choices reject. Broader selections may still use existing paging
and must not claim single-response coverage when continuation is present.

### Inspection discovery field ownership and receipts

The existing schemaPaths array applies independently to every selected exact
identity. Different tools requiring different fields use separate queries, which
may run in parallel in the same Code Mode execution. Shared-path multi-tool reads
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
branch leaves. The returned refresh/recovery selector identifies that entry alone:
action operations use operations, native tools use qualified names. To query fields,
reuse only that selector, omit view/refresh/refreshReason and add paths from that entry's inputFields. Do not
transfer paths between entries. Bare exact-name full/usage lookup still returns both
legitimate routes. Native arguments remain wrapped exactly once; action arguments
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
Preserve criteria-before-review, partial outcomes and recovery without write replay.

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

### Workspace overview and inspection receipts

The existing inspect_drawing and review_drawing capture routes accept the actual
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

### Selected review usage delivery

The existing review tool exposes owner-defined capture, bind and record operations
through the existing exact-name inputScope usage query. Review selection requires
an operation but no construction nodeTypes. The same owner schema remains the
execution authority for structure and visual phases; selection changes delivery,
never execution syntax or validation. Full and field queries remain independent.
Selected usage includes complete branch restrictions, owner invocation guidance
and actual receipt semantics and no-replay recovery in one bounded reply for
the ordinary review cases. Known direct calls need no lookup. Examples contain
illustrative identities only: resolve current target/criterion/image identities
from retained results, and consume capture/bind next.arguments for signed records.
Capture and bind have static examples; record uses the delivered next invocation,
with explicit judgments supplied after observation. It must not publish a static
example containing invented credentials. Never fabricate a binding signature or a visual pass. Invalid inputs, cancellation,
partial capture and stale evidence preserve the existing owners and recovery.

Acceptance covers delivered examples through real capture/evidence/review owners,
phase/branch rejection, independent and multiscale invalidation, partial recovery,
full/field/refresh preservation and unchanged construction scope selection. Measure
total bytes and required contract reads through capture/bind and record, including
pagination, against the retained saved-query case. Do not weaken schema constraints,
raise delivery limits or add discovery prerequisites. This is not a requirement to
inspect before first drawing and does not establish model adoption or timing gains.


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
