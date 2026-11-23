# Local AI provider

## Direct native tool delivery

Tools expose vendor-independent JSON contracts and owner results. The local adapter
registers deferred native declarations and delivers text and images directly through
the native tool-response channel. No generated JavaScript program, interpreter
storage or model-authored forwarding step participates. App-owned result handles,
bounded content continuations and explicit refresh remain the recovery authority;
recovering delivery must never replay a completed mutation or capture.

Normal startup selects direct tools and standard Responses delivery from the native
executable's public model metadata without changing global configuration or model
limits. Missing configuration fails explicitly before model use. Request-owned
configuration is released on every terminal path. Other providers consume the same
public owner contracts through their own adapters, without native-runtime dependence.

Native registration lowers nonempty-object constraints into equivalent supported
intersection/exclusive alternatives before the SDK serializes declarations. Empty
result selections remain invalid at both model and execution boundaries; valid
named selections and original owner schemas remain unchanged. Root reference scope
and union restrictions survive this projection. It is one current public contract,
not a second input format or a text-only substitute for validation.

Formal offline tests must inspect the real successor request for full text, native
images, exact search routing, paging, failures and cancellation. A stored result is
not proof of model receipt. Generated templates use this same production path.

## Supported behavior

Style comparisons describe the requested visible appearance unless the user
explicitly requires a different output medium. A failed visual criterion routes
back to supported corrections or a changed method; it is not itself an execution
failure. An unsupported outcome must identify a concrete unavailable operation or
missing evidence after considering alternatives. Neither vector output nor one
ineffective correction proves that the requested appearance is unsupported.
This does not weaken visual acceptance or impose detail on requests for simple art.

Native `codex` resource/template discovery notifications are metadata only and
must not terminate a drawing turn or supply an action batch. This does not enable
external MCP execution or resource reads; those require their own integration.

Browser NDJSON admission bounds each unfinished frame to 64 MiB, not the complete
request. A consumed newline resets the byte accounting; many valid prepared
batches must not exhaust a cumulative transfer quota. Chunk boundaries, including
split UTF-8 sequences, do not alter frame boundaries or receipt ordering.

The App server resolves `AI_PROVIDER_BACKEND` through an explicit source registry:
`local-codex` (the default) or `openai-responses`.
The custom HTTP batch model source and its configuration are removed. Responses uses the
server-only `OPENAI_API_KEY` and `AI_PROVIDER_MODEL`. No source fallback exists.
`createToolCallingDesignSource` connects a new Runtime `AiProvider` to the existing
Host and recording pipeline; adding a source does not change the request router,
Design tools, knowledge, transaction policy, retention or final batch settlement.
All model sources use the shared Host channel, invocation observation and request
lifetime. Browser HTTP remains the App exchange transport. Sources are registered explicitly at service composition.
Local Codex requires an installed compatible Codex app-server, a configured
`AI_PROVIDER_MODEL`, and the user's own ChatGPT subscription login. The optional
`AI_PROVIDER_EXECUTABLE` selects the installed executable; otherwise use `codex`.
No dependency installation, login, account switching, or API fallback occurs.

Opening the Agent panel immediately shows a persistent English notice below
its header: AI uses the configured account, subscription limits or API charges
apply, and Asyra Design does not provide AI access. It is visible before typing,
submission or connection readiness, outside the scrolling conversation feed.
The notice describes account usage without claiming a provider is connected.

The existing same-origin action-batch endpoint remains the execution route. It may
stream registered tool activity and sequential complete prepared batches, then a final batch or sanitized error;
JSON responses remain supported. Model commentary and reasoning are not streamed.
The panel uses a separate `/api/ai/status` POST for connection readiness.
Every source admits only loopback peers, loopback Host, JSON requests, and
same-origin browser requests. A hosted service cannot borrow a visitor's login.
The exact registered sample keeps its existing provider-free behavior.

## Conversation request continuity

The service owns provider continuation keyed by App conversation identity and a
stable provider contract. Each request binds fresh tool executors and cancellation.
Local Codex resumes the registered native thread; Responses uses `store: true` and the stored response ID for continuation. Native
IDs and API history are never interchangeable. Changed contracts or unavailable
continuation fail explicitly rather than replaying mutations or silently restarting.
The App supplies the Host with bounded `metadata.conversationContext`
with exact public intents, replies, clarification questions/choices and source indexes.
Current intent takes precedence over conflicting history. Original source images are
separate native image inputs; their bytes are omitted from serialized model text.
Responses projects only current attachment pixels and exposes earlier turns on explicit range reads. The native source retains its existing context projection. History is data and cannot confer current inspection, preparation or tool receipts.
Canonical targets and request evidence are validated afresh. Context overflow fails
before Feature execution with a new-conversation instruction; the server rejects
malformed context before provider invocation. See the bounds and ownership in
[Conversation Experience](ai-conversation-experience.md#product-contract).

## Owner and data contract

### Evidence-led component analysis

The model evaluates whether a registered component better meets the request;
there is no unconditional preference for native primitives. It may select up to
128 candidate path IDs from a current-request artifact for read-only component
analysis. Analysis returns an opaque analysisId, contour IDs and geometric
measurements for the registered axis-aligned Oval/Rectangle conversions, including
boundary deviation, area difference, topology limitations and eligibility.
Measurements describe geometry, not semantic meaning or visual approval. No
coordinate arrays, automatic conversion, canonical writes or model request are produced.

Approximate mappings submitted through the local image adapter must reference a
nonempty analysisIds containing same-request receipts for the same artifact.
Independent reports may be combined; each selected path/component pair must have
eligible evidence in at least one referenced report. Only eligible
results may be selected; the backend consumes completed analysis rather than
recomputing it during preparation. Unmapped geometry and whole-path exclusions
retain their existing meaning. Analysis never authorizes excluded or unknown IDs.
The original geometry is preserved when AI chooses not to convert.

Compound contours, self-intersections, degenerate geometry and excessive fit
error cannot authorize whole-path conversion. The response identifies the
limitation and available next step, without pretending segmentation or contour
surgery is registered. Analysis uses bounded approximation with disclosed
sampling tolerance; it is not a proof of semantic equivalence. Receipts remain request-owned without a cumulative count ceiling, with eight contour summaries per path
and the full contour count. Sampling/precision/intersection budgets return explicit
noneligible evidence rather than failing the whole conversation. After applying a
selected conversion, existing actual-render review and one-request Undo remain.

Independent analysis calls may be issued concurrently without waiting for earlier
results, up to 128 calls in flight. There is no cumulative call/path quota.
Every response is correlated to its own tool call and receipt, and final settlement waits for outstanding work.
App `delivery` is the only result selector. Process and thread configuration must
preserve the selected validated text and its separate outcome in native history,
including large saved values and partial-work recovery. Configure the supported
`tool_output_token_limit` to `Number.MAX_SAFE_INTEGER`, the largest exactly
representable JSON integer, instead of inheriting a smaller native per-tool cutoff.
This does not change model context capacity, native compaction, input/output
validation or explicit information paging. Actual native successor requests must
match complete tool content; a transport acknowledgement alone is insufficient.

Other tools, including writes, queue behind prior calls and remain exclusive. Each call admits at most 128 candidates. A request-owned queue runs one bounded
CPU job of at most 16 candidates at a time and yields between jobs. A whole
package returns one complete receipt after every job finishes, never a partial
receipt. These are conservative adjustable defaults, not machine-based SLAs.
Other calls remain exclusive and queued, without cumulative quotas; abort cleanup remains enforced.
Concurrency does not imply CPU parallelism.

Required cases: 10/100 simultaneous analyses and result correlation; exclusive writes;
exact and near primitives; irregular and compound paths; malformed
or cross-request references; analysis cancellation and per-call bounds; zero canonical writes;
no repeated analysis during multiple preparations; mixed native/Vector rendering
and exact Undo/Redo restoration. Token savings are not claimed without measurements.

`request-backend-action-batch` owns selection, provider invocation, and errors.
Each accepted ordinary request owns one ephemeral app-server thread and one
child process. No process or model work starts on App startup. The process is
closed before success or failure settles. Cancellation,
protocol errors, unavailable login, and malformed output never execute incomplete batches. Ordinary execution failures and explicit cancellation preserve successful finite members; the App seals them into one request-owned Undo entry. A failed member rolls back only its own writes.
Parallel turns have independent process, output, cancellation, and configuration.
Required stdout read failure/EOF or stdin error/finish/close before protocol
completion closes the affected invocation even if its process has not exited yet.
Stream or process closure after a complete protocol is normal, including a validated
readiness-only acknowledgement. Optional stderr read failure is recorded but cannot
fail the drawing. Thread and turn acknowledgements are validated before admitting
subsequent tool packets, including packets received together in one chunk; tools
must match the acknowledged active turn. Progress observer exceptions are recorded
without private text and cannot interrupt execution or receipt delivery.
Transport records retain only channel/status/terminal disposition and correlation,
never raw error text or diagnostic bytes.
Native tool replies deliver owner JSON and images unchanged, followed by a separate
supported `inputText` item containing `toolOutcome`. This acknowledgement is present
for object, array, scalar and null results, including failed delivery. The protocol
`success` flag follows that validated acknowledgement; it is not an independent
execution result. Contract selection and validation finish inside the Host before
transport; the provider does not rebuild owner schemas or inject fields into data.
Media failure preserves validated execution settlement and does not replay work.
Before thread creation, read effective native configuration once and disable each
inherited MCP server by name in the request-local thread override. Empty tables
merge with inherited configuration and do not clear it. Do not modify user config
or retain server names across requests. Invalid configuration stops admission
before inference; native App tools and permitted web research remain available.
Native configuration snapshots are not reused across requests. The same isolation
policy applies at child launch and thread creation: disable native hooks, legacy
notification commands and both multi-agent variants, in addition to the existing
App/plugin/shell isolation. User configuration files are never modified.

The local provider explicitly sets medium reasoning effort for both thread
configuration and turn execution, and checks the thread acknowledgement before
starting inference. It does not inherit a different personal effort setting.
The configured model is preserved and model fallback remains disabled.

Codex native tools are grouped by their existing owners: image analysis, reference
import, design preparation, workflow composition and canvas operations. Each
function retains its exact App name and schema inside its native namespace.
When drawing operations are available, `search_design_tools`,
`read_design_resources` and `execute_design` are eager in the operation namespace. The knowledge namespace publishes `discover_knowledge` and `read_knowledge` directly. Other exposed functions
use `deferLoading: true`. No-operation and assessment-only requests do not gain
these drawing entries. Empty owners are omitted. A request-local binding map
routes the exact namespace/name pair to the registered owner; missing, wrong or
unknown namespaces fail before dispatch. Full schemas remain registered with
the native service and discoverable as callable functions; initial instructions
provide purpose-based discovery without enumerating every tool. This reduces eager schema
exposure, not registration wire bytes, and does not promise a latency reduction.

Codex may apply the user’s own global `AGENTS.md` or `AGENTS.override.md` from
its effective home directory. Project instructions and workspace access remain
disabled. The App does not read or return those personal instructions.

Submitted intent, bounded context, registered action descriptions, accepted
images, and the backend domain prompt enter the model request alongside that personal guidance. Native image
inputs carry image bytes once; prompt metadata omits those bytes. Local Codex
has no filesystem, shell, plugin, MCP, or image-generation tools. Native public
web research and direct registered-tool composition are available. The backend
exposes its registered VTracer tool for submitted PNG/JPEG/WebP attachments and registered backend operation tools; image tool
arguments select an attachment index, never a path or URL. Conversion uses the
existing App worker and the owning request cancellation, without a cumulative call quota.
The request-owned image tool retains the parsed vector paths and returns only
an opaque artifact ID plus path IDs, colors, bounds and point counts to the
model. The model selects target bounds and optional whole-path exclusions;
the backend prepares the existing editable batch descriptors deterministically.
Insert and replacement model-facing schemas accept these references only for
compatible image requests. References cannot cross requests. The final browser
batch still contains complete descriptors, never unresolved image references.
Whole-path exclusion supports removing separate marks; it does not claim raster
inpainting or cutting a region out of a connected path. AI may combine other registered editing operations before reporting an unsupported remainder. Unknown references,
unknown excluded paths, empty results and invalid bounds fail before mutation.
Repeated conversion of the same attachment in one request reuses its completed
conversion; no image, SVG or artifact is retained across requests.
Image understanding and action generation are supported; requests requiring an
unavailable image tool fail instead of inventing its result.

App-authored UI labels and hints use English. AI response language is unrestricted
and may follow the user request or personal language preferences.

Codex manages its own credentials. The App never reads, copies, serializes,
returns, or logs credential files, account identity, provider stderr, or raw
protocol errors. Only the account type is checked in memory. Native retry/error notifications
retain public error kinds, retry disposition and numeric HTTP/RPC status with
thread/turn correlation; unknown kinds are unclassified, and private text/data
are omitted. Recording a retry never interrupts native recovery or changes turn
settlement. Configuration and
credentials are excluded from templates. Authentication and rate limits remain
with the user's subscription; inference still runs remotely.

Only complete backend-prepared `AiActionBatch` envelopes reach the runtime. Intermediate operations await an execution receipt before AI continuation. Commentary, reasoning, unregistered tool events, failed/interrupted turns, malformed
JSON, and unknown backend selection cannot become product output. Existing permission, canonical mutation, rendering and collaboration owners remain unchanged. One invocation owns one history group containing finite synchronous mutation members; each batch repeats permission and confirmation against the latest bounded context. There is no provider retry or fallback in this adapter.

## Product cases and completion gates

Permanent server tests cover explicit/default selection, unchanged HTTP,
missing model/executable/login, API-key account rejection, valid final output,
malformed/oversized protocol, failed turn, tool requests, cancellation before and
during execution, timeout, child closure, image input, concurrent isolation,
and loopback/origin admission. Provider errors expose only stable codes.

Run server tests, App typecheck/build/test, naming/lint, Inspector contracts,
template regeneration/parity, and generated-consumer readiness. Inspect the
staged diff and generated template for personal data before PR delivery. CI
must pass on the final PR commit. The panel probes the same local login/protocol boundary without starting a model
turn. It checks once per panel open or explicit Retry, cancels retired checks, and
never recaptures document context while typing. HTTP reports configured rather
than claiming a live inference check. Probes return only sanitized status.

A mocked protocol test does not claim live
subscription execution; report separately whether a compatible local CLI was
available for a live check.

## Backend operation execution

The request-owned tool catalog combines image analysis/conversion tools and typed
backend operation APIs derived from the registered App action catalog. Complete
artifacts remain on the backend. Operation parameters select references and edits;
the backend prepares action arguments and streams a complete batch to the App.
The runtime resolves, authorizes and executes it before returning redacted action
results and refreshed context. The model may continue with another operation.
Execution has no cumulative tool-call/VTracer limit and supports explicit
cancellation; there is no total request deadline. No retries
occur after a batch starts.

The same-origin action-batch route accepts one-use receipt tokens only from the
owning stream and retires them on acknowledgement, disconnect or settlement.
A receipt acknowledges completed execution with normal canonical publication;
the request-owned Undo group may still be open. It does not prove remote durability
or visual correctness. Final report_outcome is non-mutating and explains
completion or a capability limit; unsupported work is not a retryable error.
HTTP and exact-sample single-batch providers retain the same ordinary runtime path.

## Review and native primitives

The domain prompt asks the AI to inspect relevant rendered results and verify the
final result against the request. It does not prescribe a review after every
operation. Receipts prove execution, not visual fidelity; absent image feedback
must remain visual uncertainty. Supported corrections continue in the same native
turn without automatic write replay. The AI stops when the request is satisfied,
useful alternatives leave a concrete blocker, or an explicit stop applies.

Prefer native Oval for intended circles/ellipses, including circular outlines,
and native Rectangle for rectangles. Preserve deliberately irregular contours.
Image-reference preparation accepts only canonical componentMappings: explicitly selected
whole single-contour paths become filled native Ovals at their original mapped
bounds, with original fill/order/role. Compound paths are ineligible so holes
are not silently filled. Selection is not automatic shape recognition or
arbitrary path cutting. Unknown, duplicate, excluded or ineligible IDs fail
before canonical mutation. Unselected paths remain unchanged.

## Rendered drawing review

### Reference curve fidelity

The registered image worker traces references in spline mode. The request-owned
backend admits its absolute M/L/C/Z path dialect and preserves cubic control
points in the existing editable Vector descriptor schema. It preserves contour
order, closure, winding, fills and holes; it does not flatten curves into line
segments or ask the model to reconstruct geometry. Unknown commands or malformed
paths fail before mutation. Controls and fitted curves may extend slightly beyond
the source image; admission bounds coordinates to one image extent beyond each
edge and never clips them. Target sizing uses actual curve extrema, not the control
polygon, and maps anchors and controls by the same transform. Bounds are computed
with the request-owned artifact once and reused by preparation.

Native component mapping remains an explicit supported model selection. Spline
tracing does not recognize semantic components and does not guarantee exact raster
reproduction. Formal cases cover mixed straight/cubic segments, closing curves,
holes, nonuniform scaling, invalid input and retained small reference details.
Formal fidelity acceptance verifies native controls in canonical App data, one
Undo/Redo and actual App screenshots plus measured reference comparison; conversion time and
geometry size are reported separately from model latency.

Tool-result summaries expose dimensions, bounds, colors, topology, native
primitives and resource cost for the AI to use when deciding its next action.
There is no required two-stage review or pre-mutation approval. The AI chooses
valid supported preparation inputs for the intended operation. Identical deterministic tools
are not rerun without changed inputs. VTracer currently has no adjustable trace
settings; its retained artifact supports bounds, exclusions and componentMappings.
The backend catalog currently permits whole-path Rectangle/Oval conversion; the
composition uses Group, and remaining artwork retains Vector. App/preset types
without registered AI preparation contracts are not advertised as conversions.
Every mapping must reference one retained single-contour path and a registered
target, without duplicates or conflicts. Backend preserves order, mapped bounds,
fill and role IDs; AI judges semantic suitability using reference/tool evidence.
Bounds alone do not establish a shape. The obsolete ovalPathIds parameter is rejected before mutation; there is no alias conversion.
Tools perform the declared geometry conversion. Data review does not prove
appearance; the AI chooses relevant rendered observations for visual judgment. The update action
advertises typed object items with nested geometry/style fields, not an untyped
array that requires the model to guess its editing protocol.

A registered read-only inspect_drawing operation captures the requested canonical
composition through Core -> Render -> the configured engine. Capture flushes the
current projection and extracts only that element subtree, excluding editor
overlays and viewport framing. It returns a bounded PNG (at most 1024 pixels per
side), capture bounds and bounded object summaries. The default overview renders
the complete subtree into a scaled composition preview; original assets, vectors
and document dimensions remain unchanged. Explicit detail views and target-local
regions use native resolution and reject oversized captures. Region results are
marked partial and cannot establish whole-composition visual approval.
`elementsTruncated` describes the object-summary limit, not image coverage.
Missing/unsupported capture
is an explicit unavailable result; never use a synthetic replacement image.
Images are transient operation results, never canonical document properties.

By default, after each acknowledged mutating operation, the backend automatically inspects
the actual composition ID from its receipt or existing target metadata. An
explicit inspect_drawing call can select an existing target. While a drawing is
under review, layer organization also invalidates its prior inspection evidence.
Grouping the current target updates inspection ownership to the acknowledged new
group; grouping unrelated siblings does not replace the review target. Standalone
organization still uses its structural receipt without requiring visual review.
Up to 200 object
summaries accompany the whole rendered subtree.

For an already planned stage, operation wrappers accept `inspection: "defer"`.
This preserves preparation and canonical acknowledgements while omitting the
intermediate automatic snapshot. It does not run implicit mechanical review. The receipt marks `inspectionDeferred`.
The AI can apply ready artifacts consecutively, then inspect the completed stage.
Relevant mutations invalidate dependent observations. The AI owns final
verification; deferred capture does not create an evidence or text-overflow gate.
Explicit captures still run. Request-owned image recovery and named portable
conversation results retain their separate existing lifetimes.
Operation dispatch checks declared required and unknown argument fields, including nested batch items,
against the registered backend-facing schema before sending a batch. A malformed
argument envelope returns a recoverable preparation error without dispatch or
visual-evidence invalidation. This does not replace semantic preparation validation,
permissions or executor checks, nor retry a failed canonical execution.

Local provider tool replies deliver the PNG as native image input plus text
metadata, not base64 text in the prompt. AI compares the original intent/reference
with this actual output, identifies differences and makes supported targeted edits.
It requests current observations when necessary to verify the final result. Unsupported
edits and lack of improvement end with a concrete limitation, not blind retry.
The AI makes the visual assessment; App checks object validity and snapshot
availability, while the user remains the final judge of satisfaction.

Capture is read-only, keeps camera/selection/document state unchanged, and does
not add an Undo entry. All edits retain one request-owned Undo group; each finite member publishes before
subsequent read-only inspection.
Inspections and measurement cycles have no cumulative quota. Cancellation,
per-call validation and concurrent admission guards remain. Final model batches
use their advertised control-action catalog; they do not bypass ordinary action
permissions by embedding unadvertised mutations. Capture failures retain explicit
visual uncertainty and actual delivery status; they cannot falsely certify quality.

The retained `photo-faithful` profile identifier uses poster-color spline fitting,
cutout hierarchy, speckle threshold 2 and path precision 2. It preserves small
reference details without introducing another converter. The permanent reference
comparison records actual App pixel error, canonical control counts, conversion
time, and one Undo/Redo; smoother curves alone are not a quality pass.
Rendered review snapshots report their actual enclosing extraction frame so
fractional curve bounds cannot silently crop the evidence.

## Pre-trace layer decomposition

Ordinary `vtracer` calls require an explicit `plan` in the same call: either
`{strategy:"preserve-vectors",reason}` or `{strategy:"separate-background",reason,
background,colorTolerance,clipToBackground,foregroundColors?}`. Reasons are short
(nonblank, at most 500 characters). The second choice executes the existing layer
separation before tracing, and returns `representationPlan` with its artifact
and separation evidence. Missing/invalid decisions cannot start conversion; the
provider returns a recoverable tool response for the model to correct. The direct
layer tool already requires explicit native-base parameters. No extra planning
request or user-facing narration is introduced.

The AI owns choosing the representation and must compare artifact evidence and
actual rendered output with its plan and the user's request. The backend validates
and executes that choice; it cannot prove the model's visual judgment. Complex
foreground alone is not a reason to preserve a geometric background as vectors.
Existing whole-image conversion reuse remains per attachment within the request;
replies reflect the current admitted plan without reconverting the same raster.

Before vectorization, AI decides which intended objects can use registered native
components and which need tracing. `vectorize_image_layers` supports one solid
rect/oval background selected by AI, its source-pixel bounds/fill, color tolerance
(0–32 per channel), and an explicit choice to clip to that region. It separates
pixels explained by that background only within the selected region, then traces
the residual. Equal-colored pixels elsewhere remain unless explicitly clipped.
For intentionally flat artwork AI may explicitly supply up to 16 foregroundColors;
inside the region these plus the background form a palette instead of
colorTolerance. Classification composites source alpha over the selected base
before choosing the nearest RGB color; retained flat foreground becomes opaque.
This avoids VTracer promoting nearly transparent matte RGB to solid fragments. Omission preserves
nonmatching source colors; palette quantization must not be inferred for gradients
or shading. This is compositing decomposition, not automatic semantic segmentation: matching
interior colors can be represented by the underlying native fill. The model must
not claim independent semantic objects or use this for textured/gradient bases.

Actual byte signatures determine PNG/JPEG/WebP decoding even when an accepted
attachment has a misleading extension or MIME type. Other formats are rejected;
only submitted bytes are decoded, bounded to 16 MiB and the decoder safety
policy, without a separate four-million-pixel ceiling. Work observes cancellation, yields during pixel scans and has bounded
native decode time. Repeated decompositions permit meaningful parameter refinement
without a cumulative count limit; unsupported or unchanged separation fails explicitly.
Transient raster bytes never enter model text, document state or persistence.

The artifact carries its native background and source frame. Preparation inserts
that component first, followed by foreground vectors with the same transform;
foreground exclusions must not stretch the surviving paths. A plain solid image
may produce a native-only composition. Existing whole-image tracing preserves its
current retained-path fitting behavior. Execution admission, replacement and the
single-turn Undo boundary remain authoritative; no review-stage prerequisite is added. Tests must prove
region-limited separation, same-color interior appearance, source placement,
layer order, malformed/oversized input rejection and rendered composition/Undo.

## Concise decision flow

Ordinary supported requests proceed through available tools without mandatory
review stages or requests to approve already-authorized work. Brief concrete model
commentary can explain a stage or decision; it is not a prerequisite for execution. App-authored status remains
English. Model-authored operation descriptions, questions and outcomes retain unrestricted
language.

Supply native tool definitions once. In operation mode, the text input retains
only action schemas needed by final-response controls; registered operations use
their native tool schemas. Provider instructions explicitly distinguish this final
response list from the available tools and permit tool calls before the final JSON. The callable declarations identify the entries.
Native web research is allowed for public references, concepts and methods;
App execution remains bounded to registered operations. Finding an external tool
does not install or authorize it. Unavailable raster generation does not imply
that editable drawing is unavailable. Preserve original constraints, references, current
context, tool results and receipt identity. Routine operation calls require only
arguments; a short message is optional for a concrete user-relevant impact.

Use existing defaults for non-material choices. Ask a single concise question
only when required input or genuine ambiguity prevents a correct action, with
short choices when applicable. Required approval remains enforced by runtime.
Finish with a factual explanation of the result, limitations and source attribution;
include unmet requirements or useful next steps when necessary. Do not expose tool names, model reasoning or technical payloads.
Conciseness never permits silent failure, hidden partial output, omitted review
or guesses about destructive targets. These are guidance and payload reductions,
not a guarantee of model latency or a measured token reduction.

## Backend contour review

`review_vector_contours(imageArtifactId,pathIds,quality)` measures selected paths and
returns same-request review receipts and bounded local proposals. `apply_contour_refinements(reviewId,proposalIds)` consumes an explicit non-overlapping subset
and returns a new artifact for existing insert/replace actions, with before/after
metrics. Both are optional capabilities selected by the AI based on intended
straight or flowing regions. The backend never infers artistic meaning.

Straightening requires the cubic control hull to stay within 0.5 source pixels of
its chord and ordered control projections. Smoothing aligns incoming/outgoing
handles only at shallow (<=30 degree) joins, retaining their lengths. Sharp corners,
compound contours, self intersections, degeneracies and excessive measurement work
remain report-only. Selected edits preserve anchors, fills and order; combined
geometry is checked for contour intersection/winding before publication. These are
bounded numerical checks, not proof of fidelity to the source raster.

The displacement cap applies against the original trace across all generations;
no cumulative drift is allowed. Derived bounds are recomputed once while the
preparation frame remains fixed. Original artifacts/analysis receipts remain valid
only for their own immutable source. There is no derived-generation count limit. At most 16 paths
per review and 64 proposals per response; review shares the read-only queue with
component analysis. The original-source displacement bound still spans all generations. Reports state truncation/limitations.
Cancellation prevents publication. Failed proposals return a recoverable tool
result; no unchanged retry or completed-quality claim is warranted.

The AI selects proposals according to the original reference, reviews the new
rendered result, and retains a previous artifact if appearance worsens. No supported
proposal is a remaining capability limit, not an automatic pass. Source-error and
local tangent/straightness metrics cannot replace visual interpretation.

### Fidelity policy and final output scale

Every contour review requires `quality: {mode: "faithful" | "cleanup", targetSize:
{width, height}}`. Faithful intent preserves source irregularities and returns
measurements without cleanup proposals. Cleanup permits selected corrections when
intent justifies them. Plain tracing/recreation defaults to faithful; explicit
clean/smooth/simplify requests indicate cleanup. Ask only for material ambiguity.
The prompt must not classify source roughness as a conversion defect or discard
texture merely for neatness.

The backend caps displacement at both 0.5 original source pixels and 0.5 final
**drawing** pixels (not screen zoom or device pixels). The conservative output
scale is the larger width/height scale of the artifact preparation frame. Review
filters proposals using the tighter bound and returns both scales and the policy;
apply checks cumulative original-source displacement again. Preparing the derived
artifact checks actual insertion/replacement dimensions, preventing later
unreviewed enlargement from bypassing the output bound. Source-only limits remain
in force for downscaling. Original artifacts remain available as an alternative.

Improvement means the intended local defect decreases without new visual damage
and while both displacement limits hold. Stop/revert on worsening appearance,
no eligible improvement, unsafe contours or invalid geometric results. These geometric
bounds are relative to traced geometry, not a pixel-similarity score against the
reference. Sharp corners, narrow features, holes and gaps still require the
existing topology checks and targeted visual review; no new gap/thickness oracle
is claimed by this policy change.

### Separated boundary review

Faithful geometry does not require preserving antialias coverage as independent
objects. Explicit flat palettes remain available in faithful mode. Visual review
must check foreground-to-background contacts, not only the outer base or overall
similarity. Raster clipping and a native curved base do not guarantee a shared
exact vector boundary. Revise supported parameters only from source evidence;
retain a better prior result or report the unresolved limitation rather than
claiming completion or adding patch geometry.

### Reference reproduction fidelity

Named existing logos and requested reproductions must not silently become inspired
original illustrations. Research text is not geometry evidence. Successful imports
return an explicit handoff to vectorization using their attachment index; failed
imports direct alternate-source research or a request for an image, never fabricated
paths. Original illustrations remain available when requested. This is model guidance
and receipt handoff, not a deterministic guarantee of visual similarity.

Preparation rejection before `executeBatch` returns a bounded tool failure so the
model can correct reference arguments until completion or user cancellation. It does
not retry automatically or reclassify canonical execution failures, transport errors
or cancellation. Prior artifacts remain request-local and validation is unchanged.

The provider uses native live web search without App-specific source restrictions.
No site-specific search adapter or candidate-ID import path is registered. The
model chooses research methods and passes original imageUrl/sourceUrl pairs to
the safe importer; arbitrary public source domains are admitted, not a domain list. Original raster dimensions are preserved through import,
vectorization input, and native Codex model image delivery. For the OpenAI Responses source, the App delivers a bounded overview of an oversized imported raster and retains the original. MIME/signature, byte bounds
and decoder safety remain; there is no separate four-megapixel source ceiling; exceeding a guard reports failure,
never resizes the source. SVG input is explicitly unsupported by this raster
importer and is never replaced by a publisher raster thumbnail. Tool receipts
report source evidence; the user request determines whether tracing is appropriate.

The model must establish the current identity before drawing an unspecified brand
logo; historical variants require user intent. Tool completion alone cannot prove
that the selected version matches the request.

The native provider admits both completed and failed dynamic-tool notifications
for known App-issued call IDs. The App-owned tool result determines recovery; a
failed notification after a recoverable argument rejection is not a malformed
turn. Unknown tool/call identities remain protocol failures.

The App HTTP request and local model turn have no elapsed-time deadline. Stop,
disposal and client disconnect still abort work and close the owned child process.
Browser cancellation is checked before consuming each buffered frame; no subsequent
batch callback or receipt is dispatched after Stop, even within the same chunk.
The readiness check retains its 10-second deadline; individual network/tool and
payload/call-count bounds remain unchanged. Generic HTTP providers opt out with
`timeoutMs: null`; an omitted value retains the Framework default.

The model first reuses supplied attachments, current canvas context and retained
source facts, then researches only missing information. Original or open-ended
briefs need not reproduce an external reference. Missing suitable context permits
an explicitly disclosed creative reconstruction when consistent with user intent. Exact logos and explicit
faithful reproductions still require reference fidelity or user acceptance of
reinterpretation. Subject identity, viewpoint, style and dimensions are separate
review criteria. Tracing alone cannot transform a reference's camera viewpoint.

Normal requests also have no cumulative protocol-byte quota. The provider bounds
individual JSON-lines messages and unterminated buffered input to 32 MiB, drains
stderr without retaining or exposing diagnostics, and preserves duplicate-call,
foreign-turn and malformed-message rejection. Connection readiness and individual
network/decode watchdogs are service guards, not request-total deadlines.

Reference import failures carry `available: false`, the current failure `code`,
`sourceCode`, message, actual settlement and `nextStep`; acquisition diagnostics
retain their stage when available. A rejected source permits a different source,
query or method. Unknown attachment-admission settlement requires observation
instead of replay. No continuation-permission flag is required. Successful receipts also require suitability
review; an unrelated, incomplete or wrong-version image triggers further research.
The model must not demand user-provided public material solely because candidates
failed. User-only decisions/resources or real capability blockers remain valid
reasons to ask. These are orchestration instructions, not a claim that deterministic
tests certify model-level completion. The former search activity identity remains
readable in saved conversations but is never a callable operation.

Operation input admission traverses the registered model-facing schema before
canonical dispatch: required/unknown object fields, array items/bounds, declared
primitive types, enum/const, local references, string/numeric constraints and
oneOf/anyOf/allOf alternatives. Invalid nested batch entries produce a recoverable
preparation error with the failing path before any item is dispatched. This does
not retry canonical failures or replace current-target, permission or executor
validation. Prepared internal geometry is not traversed by this model-input check.

## Direct tool orchestration

The native backend invokes registered App tools directly with JSON arguments.
Every call uses schema admission, the artifact resolver, permission, execution
receipt and cancellation owners. Public web research remains separate. Arbitrary
program output cannot become a canvas batch or an App receipt.

Concurrent calls are scheduled in arrival order using the registered owner's
internal `executionAccess` declaration. Independent image analysis, new immutable
design preparation and API catalog queries may overlap admission; existing image
CPU queues still serialize bounded computation. Missing access is exclusive.
Artifact release/import, canonical queries with context/review side effects,
canvas writes and combined prepare/apply remain barriers. A combined workflow
overrides the preparation definition's independent access because it also writes.
The provider's once-per-request namespace binding consumes the declaration and
does not classify by tool names. Internal access metadata is omitted from native
schemas. Cancellation or an unusable provider transport prevents queued calls from
starting. Tool rejections settle their own invocation and remain available to the
model; they do not poison the scheduler or automatically terminate the task. The scheduler introduces no automatic retry and delegates canonical
mutation boundaries to the App history-group adapter.
Opaque handles belong to the current request. Explicit named portable values belong
to the App conversation store and can cross turns in the same document scope. Their
receipts identify origin and shape; saving does not imply delivery or grant permission.

When design application is registered, prepare_and_apply_design combines semantic
preparation and application in one tool call. Invalid preparation never dispatches
an action. Valid artifacts are prepared once, then consumed through the existing
operation owner and its immediate/deferred capture policy. It does not implicitly
run layout measurement. Its default response omits duplicated refreshed context,
applied-ID lists and role mappings; it preserves preparation findings, root identity
and actual capture results. createdTargets carries acknowledged source-key
mappings for binding, named retention and selected delivery, without a second
input selector. The adapter delivers selected receipt text and actual image content directly for
visual judgment.

Formal cases cover ordered concurrent writes, cancellation/failure queues,
unchanged analysis concurrency, one preparation per combined call, no application
on invalid input, complete owner receipts with independent selected delivery, and native tool-output
admission without authorizing shell/MCP tools. The live comparison is one headless
recorded run; timing, tool events and observed quality are reported separately.

Unsupported completed items fail explicitly and cannot supply a final action batch.
Diagnostics preserve bounded item identity and rejection category without secrets.

### Observable request timing

Tool traces distinguish receipt-to-execution queue time from execution time and
record response text byte counts and image counts. Prepared-design receipts add
admission, canonical creation and cooperative-host yield milliseconds (`cooperativeYieldMs`; older logs used `cooperativePaintMs`) plus actual
slice/element counts. Cooperative yield is not GPU presentation timing and no longer requires two animation frames per slice. Tool spans
may include user approval waits and must not be described as pure computation.

The provider also records bounded `provider_request_started`,
`provider_request_completed` and `provider_request_failed` events for initialize,
account lookup, thread creation and turn start. Their `durationMs` measures the
observed RPC wait, not model reasoning. `requestBytes` counts the existing UTF-8
wire string including its newline. Usage `transport.sentBytes` counts writes
accepted by the local process pipe; `receivedBytes` counts actual stdout chunks.
Neither implies remote processing or token consumption. Counting reuses the wire
string and does not serialize image/document payloads again.

`capabilities_advertised` reports `toolCount`, `toolDefinitionBytes`,
`eagerToolCount` and `eagerToolDefinitionBytes` for the native tool-definition JSON
array. These are protocol sizes, not an estimate of the provider's internal prompt
or token cost. The current catalog registers deferred functions plus the admitted eager
entry declarations described above; counts and bytes come from that actual emitted
array. Deferred namespace metadata is not a zero-token claim. Total bytes measure the complete registered
namespace JSON, including all deferred schemas. These numeric fields
are additive to schema version 1; immutable older records remain unchanged.
No raw request or response content is added to these diagnostics.

The usage record reports the union of observed tool/research intervals and the
remaining unattributed wall time. Overlapping calls count only once. Unattributed
time can include model generation, provider/network waiting and native transport; it is never reported as measured private reasoning. Per-call timing
and summaries contain no image bytes, private reasoning or raw generated code.
These diagnostics do not change request execution or introduce a time limit.

Local invocations also retain one version-2 JSONL execution record under
`AI_EXECUTION_RECORD_DIR` (default `tmp/ai-executions`, relative to the server
working directory). Each file is named by the request ID, created exclusively
and never silently overwritten. `AI_EXECUTION_SOURCE_REVISION` optionally names
the tested source; absent metadata is null, not an inferred current checkout.
Keep both settings in `.env.example`; actual local `.env` files remain private.

The header records the configured model and medium effort. Ordered lifecycle
events retain bounded API names/field selectors, artifact references, explicit
truncation and observed durations. Elapsed time uses a monotonic clock. Native
reasoning/message/plan item boundaries may be observed without retaining their
contents; their reported lifetime is not proof of exclusive model compute time.
RPC call identities pair starts and ends independently of tool identities.
Persisted evidence omits echoed briefs and free-form exception/message text.
The existing allowlist also excludes raw code, image/geometry data and credentials.

Queued file writes drain at request settlement. A sink failure emits a separate
`ai_recording_failed` diagnostic and cannot alter the drawing outcome. A process
interruption can leave a partial file; readers must expose missing terminal,
sequence or call evidence. `@asyra/ai-agent-runtime` supplies the pure reader and
overlap accounting, including historical version-1 logs with unavailable fields.
Diagnostic outcome records provider settlement; visual acceptance still belongs
to the existing review owner. Logs are ignored local evidence, not document data.

Prepared semantic artifacts support explicit grouped release through
release_design_artifacts; the ordinary tool scheduler owns ordering and cancellation.
Released IDs become unavailable without replaying or deleting canvas mutations.
Canonical application returns complete acknowledged IDs and mappings. The Host
applies `delivery` after validation; named retention and bindings consume their
declared values independently. No separate full-response input mode exists. Fresh
permission context remains a Runtime responsibility.

### Canonical inspection validity

Rendered inspections and deterministic layout reviews share an App-owned,
runtime-scoped canonical generation. Scene Tree, Props and file-load notices
invalidate old stamps, including edits made outside the agent. Consumers that
depend on current measurements or attachment bases validate those stamps before
using the data. The optional inspection-validation action checks stamp currency; it is not a
mandatory completion gate and does not require a completion-only reread. The AI owns final visual verification; saved captures
may be redisplayed with their original identity and freshness information.
The validity service stores no image/geometry, and runtime disposal unsubscribes
its observers. A measurement/capture generation mismatch requires fresh
measurement; an unchanged stage does not repeat that computation.

### Native schema alternatives

Review phase alternatives declare their complete object fields and requirements,
sharing a single property definition at the App owner. Native discovery can
project a `oneOf` alternative without merging sibling properties from its parent;
therefore phase-only branches cannot advertise the real input contract. Ordinary
server validation and phase-specific required fields remain authoritative. The
permanent offline alternative-validation test and opt-in native review probe cover
both schema validation and actual deferred tool discovery.

### Inspecting execution records locally

Build the read-only reporting command once after source changes:

```sh
yarn workspace @asyra/asyra-design ai:report:build
yarn workspace @asyra/asyra-design ai:report
yarn workspace @asyra/asyra-design ai:report --request REQUEST_ID
yarn workspace @asyra/asyra-design ai:report --from 2026-10-01T00:00:00+08:00 --to 2026-10-04T00:00:00+08:00 --json
```

The command loads the App's local `.env`. `--directory` overrides record storage
for inspection. Default selection is the last seven days, with the ending instant
excluded. By default it does not start the App or call a model. Missing directories, ambiguous
request IDs or invalid arguments exit unsuccessfully with an explanation.
Malformed or interrupted files remain visible as unclassified/incomplete records.
JSON includes per-step call/sequence references, timings, byte counts, issues,
configuration groups and finding frequencies. The readable summary shows the ten
longest observed calls and states how many were omitted; `--json` includes all.

Optional `--feedback path/to/feedback.json` reads a local object mapping request
IDs to user-authored feedback strings. Keep this file in ignored runtime storage.
Feedback remains separate from measured findings and retained model visual reviews.
Configuration grouping does not establish equivalent drawing tasks. A repeated
query candidate is not a proven unnecessary call, and unknown time is not measured
model reasoning. Accepted model review evidence is not independent visual proof.

An optional explicit assessment reuses the configured local model at medium effort:

```sh
yarn workspace @asyra/asyra-design ai:report --request REQUEST_ID --assess process --criterion "Reduce repeated tool and data work while meeting the requested result"
```

Use `--assess visual` with the exact requested criteria to reuse an adequate
current model visual review, without a new call. Otherwise one isolated assessment
call may read the report projection; no App tools, web search or canvas
executor is supplied. No images are supplied, so this is opinion about available
evidence, never visual certification. Provider absence/failure and invalid call
citations are saved as unavailable/failed assessment, with no automatic retry.

Assessment JSON sidecars (schema version 1) and separately identified provider
JSONL records live in `assessments/` under the selected record directory. Their
source request ID, criteria, purpose, duration, opinion and assessment request ID
are distinct from drawing records. A period report includes saved assessment
opinions for its selected drawing requests, plus malformed-sidecar diagnostics.
A new `--assess` invocation is explicit new work, not an automatic periodic job.
The diagnostic model projection includes up to 40 calls ranked by unresolved
status and observed duration, states the omitted count, and leaves the complete
record untouched. This bound never limits drawing tools or execution. User
criteria govern evaluation; it does not impose a high-detail drawing style.

### Narrow API discovery

`search_design_tools` searches admitted purpose, category and input-field metadata.
A unique exact method name selects its admitted owner. Ambiguous identities remain choices.
A clear purpose candidate can carry its route and complete ordinary arguments even when some query terms are unmatched. Search excludes discovery and scope-menu annotations from ordinary arguments. Every executable owner participates, including workflow and saved tools. Large schemas use lossless compaction; larger serialized replies use the published content continuation. Alternative candidates give an identity and a purpose summary for an exact read. Preserve category, required field filters, workflow scopes and paging.
A returned schema describes the named candidate. When a route wraps ordinary arguments,
`parameterField` names the slot alongside the route’s admitted arguments. Search does not execute the operation. Known operations execute directly. Use `read_design_resources` for exact
identities, complex owner scopes, results and recovery when those are needed. No-match results preserve truthful coverage and navigation.
These are separate inputs and owners, not mutually exclusive modes of one tool.
Registration, contract revision and mutation permission checks remain authoritative.

### Shared profiler integration

Design uses Runtime invocation middleware for native tool dispatch and internal
owner handoffs. Runtime owns record storage, projections and the report command;
Design supplies domain selectors and the optional local provider assessment
factory. A content-delivery failure is an intermediate event, followed by exactly
one call settlement. Recording transport timing does not retain transport bytes.
The local report command supports `--request ID --trace` for Trace Event JSON.

## Advisory knowledge tools

The local provider composes request-owned `design_knowledge` tools through the
existing tool host, deferred native discovery and input/output validation:
`discover_knowledge` returns applicable metadata; `read_knowledge` resolves selected
IDs and context labels. Neither executes a browser action or creates an Undo entry.
The HTTP provider protocol remains unchanged; other providers may compose the
optional Runtime knowledge API separately.

`server/local-knowledge.ts` owns file admission, content and the default catalog:
selected files from the independent `@asyra/domain-knowledge` workspace,
App-owned architectural illustration topics and `knowledge/design.docs-page.md`.
Fixed catalog IDs resolve exported
package paths; model arguments cannot choose files, credentials or scope.
This initial loader accepts JSON-compatible YAML frontmatter and rejects other
syntax, unknown fields and file-defined identity/revision. The Runtime itself
accepts normalized descriptors and does not impose a parser on other Apps.
For App files with overrides, each frontmatter entry contains `target`, `priority`
and `text`. Admission separates `text` into provider content; discovery exposes only
`target` and `priority`. The Markdown body remains independent module guidance.
A missing targeted body is rejected before registration; no whole-body fallback
or source-file mutation occurs.

For low-level advice, select IDs such as `components.button`. For specialization,
discover with `docs-page` or `landing-page`, then include the desired composition
ID in the read. Several distinct reads in one task are supported. The Runtime
remembers identical delivered contexts only within that request; provider results
retain earlier advice. The host invalidates delivery receipts on the current
thread's completed `contextCompaction` item. The Agent can also request
`read_knowledge` with `rehydrate: true` when earlier advice is missing. Both paths
re-read the App's admitted content without reloading files. A reconstructed request
creates a fresh session. Unchanged effective context still reuses delivery receipts.
Request cleanup disposes access and releases the App's
content map. Files are loaded lazily once per request, so no shared mutable cache
or cross-tenant retention is introduced.

Discovery metadata gives
IDs, descriptions and composition targets; the Agent selects labels from the user's
intent and target. For "refine a docs-page button", docs discovery includes general
button advice and the docs composition while excluding landing-page advice. For
"make it resemble a landing CTA", a second landing-context discovery/read is
allowed within the same task. Context labels filter relevance, not authorization.
This proves the retrieval contract; it does not guarantee a model interprets every
natural-language request correctly.

Trusted App code may install/remove app-supplied revisions through
`createDesignKnowledge`; that owner is never registered as an Agent tool. It
validates replacements before updating metadata and content. No tool can write
shared sources, persist extracted advice or grant new execution permissions.
The local adapter uses a request-private principal and a local host scope; a
multi-tenant deployment must bind its authenticated identities through its own
Runtime composition. Treat all returned knowledge as untrusted advice, including
text that claims to grant system or tool authority.

### Native example and target publication

The executor declares the operation and stage alternatives, their binding syntax and validation constraints. Its worked examples are delivered by an exact usage read through `read_design_resources`. The provider can execute known work immediately. Native Codex receives distributed alternatives for its schema renderer. Responses accepts common property constraints shared by the alternatives. Both enforce the same valid inputs. Tool search, categories, exact contract reads and spelling recommendations use the admitted Design catalog. Knowledge discovery searches visible advice metadata and suggests visible topic IDs; a known ID can be read directly. A standalone saved-field read belongs to `read_design_resources({savedFields:{label:{name,path}}})`. Views of a saved shape and selected images retain their original provenance and conversation scope.


## Source composition and Responses transport

The shared owners are `server/design-ai-request.ts` (recording and final admission)
and `server/design-provider-tools.ts` (current inputs, Host and selected tool
content). `server/ai-model-sources.ts` registers source factories. The middleware
owns the default source registry and its continuation lifetime. Injected sources
remain owned by the caller; supply the same registry to action-batch and status
middleware. Each source constructs a fresh turn provider and releases it after
settlement; retained protocol state contains no expired executor or abort signal.

Design lists each admitted Responses entry on one short line. The initial tools array contains only the client loader. The model can request web_search through that loader to activate authorized hosted research for the current turn. The catalog remains on the App server. Native search returns the requested definitions in tool_search_output. The stored response chain lets subsequent calls reuse each loaded entry. A loaded executor can run known operations directly. The advertised catalog digest describes local admission. The outgoing tool-search observation identifies the definitions actually delivered and their serialized byte counts.

The Responses adapter translates only the model protocol. `strict: false` retains
optional parameter semantics; the Host still validates inputs, complete outputs,
retention and delivery. Invalid tool arguments are returned to the same model
turn. Errors from the Runtime provider are translated into the existing App error
states. Local admission applies before any source can use configured credentials.
Status checks do not invoke inference. API credentials are never sent to the browser.

Optional native evaluation/reporting remains a native source capability. Ordinary
Responses conversation turns are supported; the Responses source explicitly rejects
native evaluation controls. This does not introduce another drawing test harness.

Source disposal rejects new work, cancels active model/tool work and drains real
request settlement before releasing continuation. Service shutdown also cancels
pending browser receipts before disposing sources and recording. Common tool
observation emits one start and terminal event per call; native transport retains
only its protocol-specific observations. Session-unavailable remains distinct
from invalid configuration through browser and runtime failure projection.
