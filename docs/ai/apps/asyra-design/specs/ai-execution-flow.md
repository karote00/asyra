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
search returns matching schemas and no match returns the category menu; it never
infers capability absence or picks a similar adapter. Selectors are mutually
exclusive. Each declaration carries purpose, category, input and result meaning.
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
A batch operation may supply an explicit region query as its target. The backend
requests all matching IDs once from the registered context reader and feeds them
directly to the registered plural argument. It does not expose intermediate
metadata or require model-written callbacks. Queries resolve an identity snapshot
before batch writes; ordinary admission still checks the current targets. An
unavailable, incomplete or malformed query rejects before writes. Empty matches
are explicit and never expand to the workspace. Full-match reads are permitted
only for identity-only region queries without pagination or property fields.

Relative hierarchy placement resolves a live before/after anchor inside the
existing hierarchy owner without sending all sibling IDs to the model.

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
The action adapter supplies reviewElementIds for owner-confirmed changed or
unchanged targets; unavailable targets are excluded. Malformed or misaligned
statuses fail rather than inventing review targets. The review coordinator
retains every confirmed target even when no composition was previously created;
these IDs establish scope only and do not prove visual acceptance.

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

A coherent stage may defer intermediate automatic measurements and screenshots.
It ends with current stage inspection before visual assessment or completion.
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

### Independent visual comparison

The local subscription provider performs a fresh, tool-free visual assessment
at structure and final review boundaries. Its evidence consists of the original
request, planned criterion requirements, explicitly selected original reference
attachments and current rendered overview/detail images. Reference selection
uses attachment indexes in the plan and can be updated with phase=facts after
further research without rewriting requirements; changing selection invalidates
review approval. Omitted selection supplies user attachments
only, not every researched image. Unknown indexes reject before assessment.
Each criterion declares verification=visual or data. The independent assessment
receives visual criteria only; data criteria still require ordinary checks from
numeric/canonical evidence. Image judgments cannot certify editability or metric
scale. Data-only reviews do not start a visual model call. A resubmitted plan
preserves existing explicit reference selection when the field is omitted;
explicit [] clears it. No selection crosses request boundaries.
The drawing agent's method, pass claims and self-review explanation are excluded.
Viewpoint, style and detail remain model decisions governed by the user request,
not App defaults. An intentional rough or unusual result is valid when requested.

The independent model returns a finding for every requested criterion. It cannot
write to the canvas or change the plan. A failed or unverified finding prevents
structure/final approval even if the drawing agent reports success. Invalid or
unavailable assessments do not fall back to self-approval. Canonical freshness
and coverage are revalidated after assessment; late results never approve a
changed drawing. Intermediate checks do not trigger extra provider calls.
Independent child requests retain their parent request ID, comparison criteria,
ordered image roles and original-byte digests, findings and measured provider
usage/time. Raw request text, image bytes and private reasoning are not logged.
The assessment remains model judgment, not proof of visual correctness; permanent
negative and positive cases and live screenshot review remain required evidence.

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
The independent visual comparison receives dependency-current facts with applicable
image evidence bound to its visual criteria, including source references, model
verification notes and scope/limitations. Unsupported facts remain explicitly
unverified. URL citations remain attributed assertions. Reference
adoption records what the image can support (for example, massing rather than
finished facade detail). Download success does not establish suitability. Data-only,
unrelated and invalid facts are excluded. These facts never substitute for current
canvas evidence or the independent visual verdict.
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

An independent visual assessment checks the original requested result as a whole
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

The request owns unresolved independent findings. A subsequent assessment gets
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
because cumulative source work exceeds one preparation window.

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

The original user request remains immutable in the invocation and independent
assessment. A ready partial drawing may be applied before model-authored review
criteria exist. The first criteria record may follow partial drawing but must
precede semantic review/approval; it does not itself approve any output. Established
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
Current source limitations travel into local corrections and independent final
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
