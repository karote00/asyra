# AI design execution flow

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

The provider registers every available tool with its native protocol contract.
It may defer schema loading through native discovery while retaining exact tool
identities, schemas and the existing dispatch/permission route. A deferred tool
is available, not unsupported. Use native Code Mode for dependent composition
and compact intermediate values; the App does not evaluate model-written code.
Research and simple edits remain available without a construction prerequisite.
Unsupported protocol must report a configuration failure before drawing rather
than silently dropping tools or switching the configured model/provider.

A registered tool rejecting recoverable preparation input remains available.
Its native reply reports unsuccessful execution, `PREPARATION_REJECTED`, the
input diagnostic and recoverability; it must not label the capability unavailable.
Unavailable external references remain distinguishable. The model can correct
the request in the same turn; the provider does not automatically replay it.

## Preparation and execution

Preparation consumes validated parameters or existing immutable handles and
returns prepared handles, concise findings and semantic target references.
Existing owner APIs compute layout, projection and repetition. Downstream tools
consume those results rather than reconstructing their meaning. Original image
resolution and canonical dimensions remain unchanged. Overview previews are
separate, explicitly identified review artifacts.

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

A coherent stage may defer intermediate automatic measurements and screenshots.
It ends with current stage inspection before visual assessment or completion.
Numeric admission, a successful receipt and a model assertion are not visual
acceptance. Requested qualities, not a universal detail score, govern review.

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

Diagnostics record observed startup, native orchestration, queue, tool execution,
receipt and finalization boundaries with request/call identities. Unobserved
provider time stays unattributed. Concurrent spans use interval unions. Wire
bytes, eager tool schema bytes and reported token usage are distinct quantities.
Retain bounded summaries, not prompts, credentials, raw geometry or private
reasoning. Diagnostics cannot control output or certify rendered correctness.

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
must resolve the complete owner flow and run the admitted source proof. A formal
headless live test uses the agreed short Taipei 101 upper-two-tiers-and-spire brief,
records from opening the App until ten seconds after completion, fits established
bounds and verifies the effective model/effort. That live result is reviewed for
requested qualities, not compared against a promised duration. Final delivery
requires latest PR CI passing; static flow validation is not runtime completion.
