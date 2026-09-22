# Local AI provider

## Supported behavior

The App server selects `AI_PROVIDER_BACKEND=http` (the existing default) or
`local-codex`. HTTP retains its endpoint, model, and API-key configuration.
Local Codex requires an installed compatible Codex app-server, a configured
`AI_PROVIDER_MODEL`, and the user's own ChatGPT subscription login. The optional
`AI_PROVIDER_EXECUTABLE` selects the installed executable; otherwise use `codex`.
No dependency installation, login, account switching, or API fallback occurs.

Opening the Agent panel immediately shows a persistent English notice below
its header: local AI uses the user's own subscription and usage limits, and
Asyra Design does not provide a subscription. It is visible before typing,
submission or connection readiness, outside the scrolling conversation feed.
The notice is provider-neutral and does not imply additional provider support.

The existing same-origin action-batch endpoint remains the execution route. It may
stream registered tool activity and sequential complete prepared batches, then a final batch or sanitized error;
JSON responses remain supported. Model commentary and reasoning are not streamed.
The panel uses a separate `/api/ai/status` POST for connection readiness.
For local Codex it admits only loopback peers, loopback Host, JSON requests, and
same-origin browser requests. A hosted service cannot borrow a visitor's login.
The exact registered sample keeps its existing provider-free behavior.

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
sampling tolerance; it is not a proof of semantic equivalence. At most 128
analysis receipts are retained per request, with eight contour summaries per path
and the full contour count. Sampling/precision/intersection budgets return explicit
noneligible evidence rather than failing the whole conversation. After applying a
selected conversion, existing actual-render review and one-request Undo remain.

Independent analysis calls may be issued concurrently without waiting for earlier
results, up to the request budget of 128 calls and 128 total candidate paths.
Every response is correlated to its own tool call and receipt, and final settlement waits for outstanding work.
Other tools, including writes, remain exclusive. Candidate slots are reserved
before waiting. A request-owned queue runs one bounded
CPU job of at most 16 candidates at a time and yields between jobs. A whole
package returns one complete receipt after every job finishes, never a partial
receipt. These are conservative adjustable defaults, not machine-based SLAs.
Non-analysis calls retain their 32-call
limit, total protocol admission is 160, and abort cleanup remains enforced.
Concurrency does not imply CPU parallelism.

Required cases: 10/100 simultaneous analyses and result correlation; exclusive writes;
exact and near primitives; irregular and compound paths; malformed
or cross-request references; analysis cancellation/budgets; zero canonical writes;
no repeated analysis during multiple preparations; mixed native/Vector rendering
and exact Undo/Redo restoration. Token savings are not claimed without measurements.

`request-backend-action-batch` owns selection, provider invocation, and errors.
Each accepted ordinary request owns one ephemeral app-server thread and one
child process. No process or model work starts on App startup. The process is
closed before success or failure settles. Cancellation, a five-minute deadline,
protocol errors, unavailable login, and malformed output cannot commit an invocation. Failed or cancelled requests roll back intermediate writes.
Parallel turns have independent process, output, cancellation, and configuration.
No retained cache or cross-turn conversation is introduced.

Codex may apply the user’s own global `AGENTS.md` or `AGENTS.override.md` from
its effective home directory. Project instructions and workspace access remain
disabled. The App does not read or return those personal instructions.

Submitted intent, bounded context, registered action descriptions, accepted
images, and the backend domain prompt enter the model request alongside that personal guidance. Native image
inputs carry image bytes once; prompt metadata omits those bytes. Local Codex
has no filesystem, shell, web, plugin, MCP, or image-generation tools. The backend
exposes its registered VTracer tool for submitted PNG/JPEG/WebP attachments and registered backend operation tools; image tool
arguments select an attachment index, never a path or URL. Conversion uses the
existing App worker and the owning request cancellation, with at most four calls.
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
protocol errors. Only the account type is checked in memory. Configuration and
credentials are excluded from templates. Authentication and rate limits remain
with the user's subscription; inference still runs remotely.

Only complete backend-prepared `AiActionBatch` envelopes reach the runtime. Intermediate operations await an execution receipt before AI continuation. Commentary, reasoning, unregistered tool events, failed/interrupted turns, malformed
JSON, and unknown backend selection cannot become product output. Existing permission, canonical mutation, rendering and collaboration owners remain unchanged. One invocation transaction encloses all batches; each batch repeats permission and confirmation against the latest bounded context. There is no provider retry or fallback in this adapter.

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
At most 32 tool calls (including at most four VTracer calls) and the existing
five-minute request deadline bound execution. No retries occur after a batch starts.

The same-origin action-batch route accepts one-use receipt tokens only from the
owning stream and retires them on acknowledgement, disconnect or settlement.
A receipt acknowledges provisional execution within the open transaction, not a
committed or durable document. Final report_outcome is non-mutating and explains
completion or a capability limit; unsupported work is not a retryable error.
HTTP and exact-sample single-batch providers retain the same ordinary runtime path.

## Review and native primitives

The domain prompt requires review of the original constraints after each
acknowledged operation and permits repeated supported corrections in the same
request. Receipts prove execution, not visual fidelity. Without rendered-image
feedback the model must state visual uncertainty rather than claim it inspected
the canvas. Stop if requirements are satisfied, supported edits are exhausted,
no improvement is obtained, or cancellation/runtime limits are reached.

Prefer native Oval for intended circles/ellipses, including circular outlines,
and native Rectangle for rectangles. Preserve deliberately irregular contours.
Image-reference preparation accepts optional ovalPathIds: explicitly selected
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
Completion requires native controls in canonical App data, one Undo/Redo and
actual App screenshots plus measured reference comparison; conversion time and
geometry size are reported separately from model latency.

Review has two stages. Before any mutation, AI reviews tool-result summaries
against user intent: dimensions, bounds, colors, topology summaries, unwanted
marks, native primitives and resource cost. It iterates supported inputs/options
and chooses backend preparation parameters first. Identical deterministic tools
are not rerun without changed inputs. VTracer currently has no adjustable trace
settings; its retained artifact supports bounds, exclusions and componentMappings.
The backend catalog currently permits whole-path Rectangle/Oval conversion; the
composition uses Group, and remaining artwork retains Vector. App/preset types
without registered AI preparation contracts are not advertised as conversions.
Every mapping must reference one retained single-contour path and a registered
target, without duplicates or conflicts. Backend preserves order, mapped bounds,
fill and role IDs; AI judges semantic suitability using reference/tool evidence.
Bounds alone do not establish a shape. Existing ovalPathIds remains compatible.
No geometry processing moves into the model. Data review does not prove appearance;
remaining visual uncertainty must be checked after rendering. The update action
advertises typed object items with nested geometry/style fields, not an untyped
array that requires the model to guess its editing protocol.

A registered read-only inspect_drawing operation captures the requested canonical
composition through Core -> Render -> the configured engine. Capture flushes the
current projection and extracts only that element subtree, excluding editor
overlays and viewport framing. It returns a bounded PNG (at most 1024 pixels per
side), capture bounds and bounded object summaries. Missing/unsupported capture
is an explicit unavailable result; never use a synthetic replacement image.
Images are transient operation results, never canonical document properties.

After each acknowledged mutating operation, the backend automatically inspects
the actual composition ID from its receipt or existing target metadata. An
explicit inspect_drawing call can select an existing target. Up to 200 object
summaries accompany the whole rendered subtree.

Local provider tool replies deliver the PNG as native image input plus text
metadata, not base64 text in the prompt. AI compares the original intent/reference
with this actual output, identifies differences, makes supported targeted edits,
and inspects again after the final edit before reporting completion. Unsupported
edits and lack of improvement end with a concrete limitation, not blind retry.
The AI makes the visual assessment; App checks object validity and snapshot
availability, while the user remains the final judge of satisfaction.

Capture is read-only, keeps camera/selection/document state unchanged, and does
not add an Undo entry. All edits retain the existing one-request transaction.
Six inspections per request bound image work; existing cancellation/deadline and
tool-call guards remain. At the inspection budget no further mutations are
admitted. Final model batches cannot contain new mutating drawing operations
that bypass rendered review. Capture failures downgrade a completed report to an explicit visual
review limitation; they cannot falsely certify quality.

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
only submitted bytes are decoded, bounded to 16 MiB and four million
pixels. Work observes cancellation, yields during pixel scans and has bounded
native decode time. Up to four decompositions per request permit meaningful
parameter refinement; unsupported or unchanged separation fails explicitly.
Transient raster bytes never enter model text, document state or persistence.

The artifact carries its native background and source frame. Preparation inserts
that component first, followed by foreground vectors with the same transform;
foreground exclusions must not stretch the surviving paths. A plain solid image
may produce a native-only composition. Existing whole-image tracing preserves its
current retained-path fitting behavior. Both review stages, execution admission,
replacement and the single-turn Undo boundary remain unchanged. Tests must prove
region-limited separation, same-color interior appearance, source placement,
layer order, malformed/oversized input rejection and rendered composition/Undo.

## Concise decision flow

Ordinary supported requests proceed through tools and the existing two review
stages without model narration, progress prose, repeated preference questions or
requests to approve an already-authorized next step. App-authored status remains
English. Model-authored questions/outcomes retain unrestricted language.

Supply native tool definitions once. In operation mode, the text input retains
only action schemas needed by final-response controls; registered operations use
their native tool schemas. Preserve original constraints, references, current
context, tool results and receipt identity. Routine operation calls require only
arguments; a short message is optional for a concrete user-relevant impact.

Use existing defaults for non-material choices. Ask a single concise question
only when required input or genuine ambiguity prevents a correct action, with
short choices when applicable. Required approval remains enforced by runtime.
Finish with one short factual sentence; include an unmet requirement or next step
when necessary. Do not expose tool names, model reasoning or technical payloads.
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
only for their own immutable source. At most three derived generations, 16 paths
per review and 64 proposals per response; review shares the 128-path request budget
and read-only queue with component analysis. Reports state truncation/limitations.
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
no eligible improvement, unsafe contours or exhausted budgets. These geometric
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
