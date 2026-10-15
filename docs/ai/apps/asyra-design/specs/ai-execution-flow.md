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
carry an exact revision and are returned once per request/revision. Later lookups
return references with a refresh route. `refresh: true` explicitly restores full
definitions after context loss or failed delivery. Compact menus do not consume
full-definition delivery. A new request starts fresh; this state never deduplicates
action execution.

Exact name/operation lookup also supports `view: "usage"` and `schemaPaths`
(JSON Pointers into the canonical input schema). Usage includes purpose,
execution route and root property paths. Fragment replies include exact selected
values and transitive local reference dependencies; they are partial documentation,
not complete executable schemas. Unknown paths reject recoverably. These modes
require an exact selector, cannot be combined with each other, and
never consume full-definition delivery. Explicit refresh preserves the selected
usage or schema-path scope. A partial response offers a scoped recovery route;
full recovery remains a separate choice. Optional `refreshReason` records
context loss, delivery failure or missing fields, and requires refresh; an omitted
reason stays unknown. Definition receipts distinguish initial delivery, reuse,
version change and explicit recovery without asserting model retention. Full lookup and explicit refresh remain
available for every contract. Replies distinguish current response coverage from
previous delivery; a delivery record cannot prove that the model retained context.

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

## Preparation and execution

The combined preparation/application workflow also accepts ordered ready `parts`.
Each part has a unique local key and an ordinary draft or repair. `parentPart`
links to an earlier successful part's actual composition ID; it is never a
canonical ID and never implies an outer root. Explicit existing `parentId` remains
available. Sequence shape and backward references are admitted before writes.
The workflow prepares and applies one part before preparing the next, using the
same preparation and current canonical admission owners. A failure stops later
parts and returns ordered receipts for successful parts plus the failed part;
completed and uncertain writes are never automatically replayed. Cancellation
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
input. Structural receipts identify changes; reads are observations only. Compact
transport of successful declared moves/removed receipts keeps ordered identities
and counts without canonical snapshots or old hierarchy locations. Explicit
full response retains the original owner receipt. Unknown and unsuccessful
results retain their diagnostic data; compacting never alters history evidence. Void
acknowledgements and ambiguous false/null results must not certify a document
change or a valid unchanged target. Failed receipts propagate to conversation
settlement; mixed successful writes and failure are partial. Compact replies may
aggregate successful valueless acknowledgements, retaining their unmeasured
application meaning, without dropping identities, reads or failure evidence.

Element selection validates all requested IDs at the common element-selection
owner inside the synchronous mutation boundary. A nonexistent ID, including a
mixed valid/invalid request, rejects the whole replacement without changing prior
selection or adding an Undo entry. `select_elements` reports its accepted selection
count only after successful canonical replacement; the basic selection/toggle
routes use the same existence contract. Explicit clearing and generic Core/vector
selection channels retain their own contracts. A corrected call and its Undo/Redo
must remain usable after rejection.

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
consume a missing handle. Unknown and failed owner results are not compacted.

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
artifact target resolver. Compound operations aggregate only successful basic
mutation acknowledgements whose return value is null and whose result contains
no additional data. Reads, returned IDs, findings and uncertain outcomes remain
complete. Explicit full response retains every acknowledgement. Canonical
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

## Evidence and completion

Saving a pre-mutation plan returns a compact storage acknowledgement with criterion
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
to a bound fact or its binding identify affected criterion IDs; reference changes
invalidate comparison; canonical drawing changes retain their separate generation
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
planned criteria and known canonical element IDs with factBindings. The review owner attaches bound fact IDs to
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

## Execution recording

The Runtime profiler emits a versioned, append-only local record per invocation in
addition to existing console diagnostics. The record includes request/call and
sequence identities, observed timestamps, model/effort, bounded tool selectors,
artifact references and terminal outcome. Source identity is optional and marked
unavailable when not supplied. No request prompt, image bytes, credential or private reasoning is persisted.
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

The invocation result adds `toolOutcome` with status `usable`, `unavailable`, or
`partial`, and bounded issues. A returned string is not proof of usable output.
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
components by canonical child ID; it does not link whole elements. Subsequent edits
propagate to all owners of that Fill. Detaching creates an independent child from
current values. Other rows, property fields, order and ordinary Undo/Redo persist.

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

Review responses provide structured correction context: unresolved criterion
IDs with complete evidence, known fact-bound target IDs, and the supplied
inspection targets/regions. Inspection regions retain target-local coordinates;
no workspace bounds or guessed object IDs are inferred. Missing scope remains
unknown. Failed checks are not truncated into an actionable subset. This context
is diagnostic only and cannot authorize completion or replace a fresh review.

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
input, not sharing or instructions to merge patches. Sharing/detaching retains the
existing canonical relationship representation, persistence and Undo/Redo.
An element-instance ref with local property overrides is a distinct model capability;
this Fill correction does not introduce it or substitute row indexes for its identity.

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
including definitions and constraints, once per request/revision; subsequent lookup
returns a reference and explicit refresh route. No separately maintained schema copy
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

### Source and upstream evidence provenance

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
enter accepted comparison. Restricted references carry criterion scope,
limitations and optional original-image pixel regions; canvas inspection regions
remain a separate coordinate space. The tool checks structure and identity, not
visual truth, and never decides applicability from filenames or site rules.

Facts are source-attributed assertions. Dependency freshness is separate from
evidence assessment. Every cited image needs current applicable evidence for the
bound criterion; one eligible citation cannot bless another ineligible source.
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
that lease while preparing patches. Every mapping, target lock and shared-fill
conflict is checked before the one plural write; no intermediate mutation occurs.

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
retains bounded genuine evidence for save-only retry. Partial or uncertain work
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
Stage intent is not a claim that drawing is currently being applied. It survives child starts/ends while its next root tool cohort is active. The
provider explicitly completes that stage when the last root call in the cohort
settles, including failure/cancellation. New commentary replaces it; older calls
cannot complete a replacement. Retry, saving and terminal settlement also retire
the stage. A stage describes this finite work cohort, not the whole objective. No additional AI evaluates or authors status.

Display the common genuinely live call purpose before retained stage intent.
Show the observed operation separately from authored context. Admission/queue
churn preserves its operation description; meaningful operation changes update
immediately. Without a live call, label retained prose as Current task rather than
claiming that drawing is executing. Without authored purpose show only observed
work, never invented work or the full request as current work.
All lifecycle events and actual owner phases/counts remain in diagnostics. No timer
or debounce suppresses events. Stopping, approval, saving and terminal outcomes
immediately override normal work presentation.

Call purposes retain authored identity, scope and revision across phase-only
updates. Resolve inheritance from live ancestry, never copy it into a child as
new authored text. Concurrent leaves use their common purpose; one sibling cannot
represent unrelated work. Distinct active operation labels remain visible together
with their count, rather than being replaced by a generic operation count. Closing a parent closes dependent children, preserves
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

Before each new composition, the library checks the exact current saved state.
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
A regional check cannot mix an uncropped target image with a crop of that same
target: explicitly resubmit only the required local images and keep whole-view
judgments on their separate criterion. Admission rejects before recording any
judgments and identifies the enclosing image IDs. An overview of an isolated
regional target remains valid, as do explicit multi-target cross-region checks.
Intermediate visual review accepts current local crops without requesting an
unrelated overall view. Omitted units retain their status, and invalidation follows
their actual image dependencies. Final review still requires current whole-request
coverage/detail and original criterion judgments, and cannot complete with a
retained required unit failed, stale or unverified. Reusing a unit for a different
scope requires explicit redesign reconciliation rather than silently discarding
its earlier obligation.

### Capture and deterministic review responsibility

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

Canonical canvas measurement results are retained in the same check store per
checked target, alongside prepared-source and primary-agent evidence. Complete
rechecks replace only that target's findings, including deleted children; partial
checks remain unresolved. Reads validate actual browser-issued scoped receipts
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

Retained position-to-fill mapping returns this same scope from the canonical
shared-property inverse-owner lookup after its admitted write. Native arrangement
and reorder retain their declared applied identities; prepared compositions retain
their coherent root inspection unit. These paths do not guess scalar input names
or expand a full document to find affected owners. Changed basic document-mutation
and retained-mapping output contracts advertise revision 3; unchanged read,
selection and viewport contracts retain revision 2. Saved recipes with replaced
dependency identities fail admission before execution and must be corrected using
the currently advertised contract. There is no old-output fallback.

### Mechanical delivery and unresolved write scope

Automatic checks retain complete findings in the existing request-owned check
store and return a compact summary with the first pending result ID. Direct
review and retained-result reads remain complete; explicit full batch/workflow
responses may include automatic check receipts. Default delivery must not resend
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

### Declared regional acceptance coverage

A visual criterion may declare nonempty unique `requiredUnits`, within the existing
24-item bound. These are stable regional or cross-region judgment identities, not
geometry or a new tool. A criterion without requiredUnits remains a whole-criterion
obligation. Partitioned criteria cannot be data criteria or structure checkpoint
criteria. The first declaration may follow the first ready drawing. Once judgments
exist, obligations cannot be rewritten; an established plan also retains its lock
after a drawing mutation. Identical declaration must not reset findings.
The primary agent submits findings for delivered images; tools do not call an
additional model or infer visual correctness.

The existing check store accumulates current passes across calls. Final acceptance
requires every declared unit (including never-submitted units), all whole criteria
and all retained unresolved findings. The same derivation governs review replies,
correction instructions and completion settlement. Omission or a whole-criterion pass cannot
substitute for missing regional work. Sparse reviews may supply only changed units;
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
only images it actually depends on; citing an overview makes it a real dependency.

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

Native research items and App tool calls share the same finite authored-purpose
cohort. A completed search releases its membership exactly once; overlapping
operations keep the purpose active, and an older completion cannot retire a
replacement purpose. Research diagnostics remain distinct from App mutations.

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
registry. This is the Stage 2 contract, not a claim of current availability.
Input is a closed object `{ checks: [{ checkId, revision }] }`: a nonempty unique
selection of request-owned tool-origin check identities and their exact retained
revisions. Scope, canonical target and dependencies come from those owned records,
never model-authored arbitrary IDs, a viewport, diagnostic text or a second store.
Existing transport/iteration budgets apply; work is chunked internally. A selection
with unknown, mixed ownership, wrong origin or conflicting revision is rejected
before checking or mutation. The operation never mutates the document.

Successful output contains `verification: { status, progress }`, `results` in the
existing compact check-result format, and exact unresolved check identities/revisions,
reason codes and recovery. `status` is `pass`, `repairable` or `decision-required`;
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
nonempty selection. All-retired work may pass without another empty verification call.
A stale result revision is a recoverable input conflict, not permission to drop an
obligation or restart initial writes. Exact revision matching alone is not currency:
existing dependency invalidation can change status without advancing that revision. Pass requires
complete coherent current mechanical coverage for that selection. It does not grant
visual acceptance, whole-task completion, recipe eligibility or document durability.
Repairable requires every remaining finding to have an owner-declared mechanical
repair capability. The inspect owner returns their exact capability IDs and structured
finding arguments; it cannot infer which recipe called it. An admitted recipe must
cover that complete set. Because Runtime executes its finite repair list without
domain branching, the Design repair owner validates that set and current finding
receipts before any repair write. A mismatched or mixed unsupported set stops with
exact unresolved work and no repair writes. Runtime validates registered schemas,
bindings and budgets; it does not infer dynamic domain coverage from status alone.
Findings without a declared repair require a primary-agent decision. Empty work after canonical deletion can
retire only the deleted target's own obligation, not dependent visual criteria.

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

### Cross-owner handoff cases and stage exits

These cases define subsequent stage acceptance; they are pending until executed
on the relevant captured source, not passing by structural admission.

| Case | Producer -> consumer | Required success and failure behavior |
| --- | --- | --- |
| Current contract (Stage 1) | compose/inspect -> host and primary judgment | Canonical oval conversion and primary visual fail/correct/pass work; removed alias rejects before dispatch and no independent assessor capability exists. |
| Aggregate closure (Stage 2) | apply receipt -> inspect -> Runtime verification | Fresh receipt closes selected stale mechanical checks, preserves unrelated visual passes, and executes one admitted known repair; actual Runtime admits the string progress contract and acknowledged revision binding. No-op/cyclic repairs and wrong/mixed repair capabilities stop without initial-write replay. |
| Freshness race (Stage 2) | canonical edits -> inspect -> settle | Edit, Undo/Redo, collaborator change or cancellation during check cannot publish stale success; retry only safe reads, preserve unaffected records, and return exact incomplete scope. |
| Delegation (Stage 3) | discovery -> admit/register -> host/invoke | Exact spec -> invalid recipe correction -> eligible invocation through real host; unsupported intent returns a decision; suitable direct tools need no forced composition. |
| Reuse (Stage 4a) | invoke receipt -> persist -> fresh request | New input yields new artifacts; failed save retries only storage, revoked dependency rejects, expired transient handles require reacquisition. |
| Settlement (Stage 4b) | inspect/apply -> settle -> visible result | Purpose start/end/cohort ordering is truthful; Stop/partial writes/cleanup failure preserve actual progress; document-save failure, recovery, Undo/Redo and fresh reload are independently proven. |

The definition of done for Stage 1 is current caller/schema/test alignment and
applicable formal proof, types and lint. Stage 1 does not implement mechanical
aggregation, modify model guidance or certify any future stage. Accepted historical
evidence is immutable; obsolete executable behavior is removed, not emulated.
