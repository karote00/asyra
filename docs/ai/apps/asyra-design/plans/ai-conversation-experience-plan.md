# Plan: AI Conversation Experience

## Current direction

The [Editable Design Agent plan](ai-design-agent-plan.md) now owns the broader
prompt-to-editable-design work, native research, complete UI/UX and PR delivery.
The sections below retain prior accepted contracts and historical local evidence;
they do not establish completion of the new plan.

## Status and bounded contract

Design decisions fixed on 2026-09-15. Implementation authorized in the existing
`codex/design-local-codex` worktree. The current pre-trace decomposition slice is local-only, with no push or CI
monitoring. Scope includes the owner files and permanent tests below.

Objective: make the complete drawing conversation understandable and actionable
from submission through progress, questions, execution, revision, and recovery.
The canvas remains the primary workspace. The panel presents a stable conversation
rather than an execution log.

Authorized implementation scope: App conversation state, presentation, panel,
confirmation integration, bounded server diagnostics and domain guidance, their
formal tests, current contracts, and generated Asyra Design template parity.
Shared runtime changes require a separately bounded owner slice when existing
public events cannot express an accepted outcome. Do not change canonical geometry,
rendering, collaboration, persistence or authentication. Dependency additions
are limited to the user-approved sharp dependency in the pre-trace slice below.

## Activity rows - 2026-09-19

Bounded UI correction: replace the generic working label with Planning the drawing;
render labels and distinct attached messages as sibling rows with identical spacing.
Preserve activity ordering, current-step ownership, deduplication and scrolling.
Two formal regressions failed before the correction. Geometry, tracing and prompt
quality are inspection-only for this request; no changes to those owners.

## Backend contour review and bounded refinement - 2026-09-19

Step Execution Card - request-backend-action-batch:

- Product contract: AI selects intended straight/smooth regions; backend measures
  cubic straightness and tangent discontinuity, prepares optional bounded edits,
  and returns before/after evidence. Visual interpretation remains with AI.
- Inputs: current-request artifact and selected path IDs; outputs: opaque review
  receipt, ranked local proposals, optional derived artifact for existing drawing
  operations. Source artifacts remain immutable. No coordinate arrays in replies.
- Scope/allowlist: App server image tools, contour helper, vector artifact measured
  bounds, domain prompt, provider progress/error handling, direct tests, existing
  Inspector condition/spec/plan, generated template. No renderer, canonical schema,
  Undo, UI, VTracer settings, dependencies or provider authentication changes.
- Conditions: explicit proposal selection from a same-request review; at most
  0.5 source-pixel displacement against the original artifact across all passes;
  preserve anchors, sharp corners, fills and path order. Compound/degenerate or
  self-intersecting paths are report-only. At most three refinement generations.
- Budgets: 16 paths/review, 128 cumulative paths, 64 proposals/report; retain bounded
  request-local proposals, never remeasure a selected proposal during admission.
  Every apply validates combined geometry before publishing a new artifact.
- Tool IDs belong to AiImageToolIds; all receipts/segment indices are request-local,
  not persisted identities. Reuse existing component topology checks and bounds
  ownership. Do not claim source-raster or semantic fidelity from geometry alone.
- Gates: formal tests first for straightness, tangent continuity, corner refusal,
  displacement cap, stale/foreign receipts, cancellation, compounded drift,
  immutable source/order, and prepared consumer integration; server suite, typecheck,
  build, naming, Inspector and generated template checks. No paid/live model calls.
- Failure owner: backend image preparation. Stop on uncertainty/budget with a
  concrete limitation. No guessed star primitive, special logo or blanket smoothing.
- Closure is this bounded local correction capability, not perfect image recovery.
  No push or CI monitoring.
- Evidence: 213 server tests passed (one opt-in live test skipped), including
  contour admission, bounded drift, conflict rejection, convergence and generation
  limits. Actual App rendering of a receipted straight-edge refinement passed
  pixel-row checks and one Undo/Redo; App and 1000px captures were inspected.
  Typecheck/build, focused lint, naming and 25 Inspector contracts passed. No
  subscription/model call was made; model uptake and arbitrary-logo fidelity are
  not claimed by these deterministic tests.

## Fidelity intent and output-scale review - 2026-09-19

Step Execution Card - request-backend-action-batch:

- Scope: existing contour review/refinement tools, preparation admission, prompt,
  direct tests, spec/Inspector and generated template. No new tools/dependencies,
  renderer, Undo, UI or VTracer parameter changes. No push or live AI calls.
- Require quality intent (faithful or cleanup) and intended output width/height
  on contour review. Faithful reports measurements without cleanup proposals.
  Cleanup proposals must satisfy both the original 0.5 source-pixel limit and a
  0.5 final drawing-pixel limit, using the larger nonuniform scale factor.
- AI selects intent from the request; ask only when material ambiguity remains.
  Preserve requested distinctive details; rough source pixels are not inherently
  errors. Output pixels mean drawing units, not screen zoom/device pixels.
- Receipts carry policy and both scales; apply checks cumulative original-source
  deviation again. Preparation checks actual insertion/replacement bounds, so
  later enlargement cannot bypass admission. Previous artifacts remain available.
- Stop conditions: worsening appearance, no eligible improvement, unsafe contour,
  exhausted budget. Measurements do not prove raster fidelity or semantic approval.
- Gates: test-first faithful/no-cleanup, missing/invalid policy, 2x/nonuniform
  scale, cumulative apply and later resize rejection; backend suite, typecheck,
  build, lint/naming, existing contour E2E and template/Inspector parity.

## Decisions

### Required image representation decision - 2026-09-19

Step Execution Card - request-backend-action-batch:

- Failure: real user run traced the whole reference despite a supported native
  background. Previous tests supplied the separation decision themselves.
- Contract/spec: local-ai-provider, Pre-trace layer decomposition; same Inspector
  owner, registered image input and request-local prepared output.
- Scope: server image-tool admission, prompt, direct protocol/visual tests,
  contracts and generated template. No renderer, Undo, UI or dependencies.
- Every ordinary trace requires a short explicit representation plan. The AI
  selects native-background parameters or explains preserving vectors; the
  backend executes that selection without interpreting the artwork. Missing
  decisions fail before conversion, with a recoverable tool response.
- Selected plans are returned with artifact evidence for data and visual review.
  A native decision routes through separation, never whole-image tracing.
- Cases/gates: missing/invalid plan, native routing and layer order, explicit
  vector preservation and reused conversion, provider recovery, actual rendering,
  server tests/typecheck/build, naming and template/Inspector parity.
- Stop at this owner boundary; no automatic shape guessing, special logo rule,
  extra planning round trip, push or CI monitoring. Live model choice requires
  separate evidence; deterministic tests alone cannot establish visual judgment.
- Validation: missing-decision/native-dispatch tests failed before the fix.
  The complete live App test then passed with the original reference and ordinary
  240x240/remove-TM request, with no primitive or decomposition hints. It produced
  one native Oval background and vector foreground; actual App/detail screenshots
  were inspected. This proves one real decision run, not universal model accuracy.
  An isolated provider test without the complete App operation path reported
  tools unavailable; it is not used as successful evidence. One App attempt was
  cancelled by a development reload; the completed run used stable source.

### Pre-trace layer decomposition - 2026-09-19

Step Execution Card - request-backend-action-batch:

- Objective: AI selects an intended solid native background before tracing;
  the backend separates the residual raster and assembles native background
  plus traced foreground in one existing prepared composition.
- Spec: local-ai-provider, Pre-trace layer decomposition. Inspector: existing
  request-backend-action-batch, including its registered tools and preparation.
- Inputs: accepted PNG/JPEG/WebP, AI-selected rect/oval bounds and fill, explicit
  color tolerance, optional explicit flat foreground palette and clipping choice. Outputs: request-owned artifact and
  compact separation evidence, then complete ordered descriptors.
- Scope: App server image tools/prompt/artifacts, direct tests and visual case,
  sharp dependency/lockfile/notices, contracts and generated template.
- AI owns interpretation; backend owns deterministic pixel processing and
  coordinate mapping. No frontend geometry, renderer, Undo, permission or
  provider authentication changes. No preferred primitive or logo-specific rule.
- Bypass: ordinary tracing remains available when decomposition is unsuitable.
  Unsupported textured/gradient backgrounds must not be claimed as separated.
- New tool identity vectorize_image_layers belongs to AiImageToolIds; artifact
  layer metadata is request-local, not a persisted schema or document migration.
- User approved sharp after license discussion. Pin the security-fixed version;
  preserve dependency license notices. No other new dependency or runtime upgrade.
- Gates: test-first separation/coordinate/layer-order cases, invalid input,
  cancellation and bounds, actual VTracer integration, App render and Undo,
  App tests/typecheck/build, naming, Inspector and template parity.
- Failure owner: backend image preparation. Stop for unsupported semantic
  separation or failed validation; never return an unchanged image as success.
- Delivery: local only. No push or CI monitoring for this slice.
- Local evidence: 21 separation cases, 190 backend tests, existing App tests,
  real reference raster -> VTracer -> native/vector preparation -> App capture
  and one Undo/Redo passed. Original mislabeled WebP bytes are exercised directly.
  The final flat-palette reference uses 37 elements including one native Oval;
  rendered mean RGB error is 9.45/255. No live model call was used in these tests;
  model strategy choice remains guided by the prompt rather than proven by this
  deterministic rendering case.

### Concise decision flow - 2026-09-19

Step Execution Card - request-backend-action-batch:

- Spec: local-ai-provider, Concise decision flow; Inspector: the existing
  request-backend-action-batch owner, registered-tool and receipt-review loop.
- Inputs: original intent, reference, bounded context, registered action/tool
  schemas and acknowledged evidence. Outputs: tool parameters, prepared batches,
  necessary clarification or one concise outcome. No new execution route.
- Ordinary supported work proceeds without narration or redundant questions;
  ambiguous targets, material missing input and required approvals still stop.
- Allowed contributors/files: server/ai-domain-prompt.ts, local-ai-provider.ts,
  local-operation-tools.ts, their direct tests, specs, this Inspector condition
  and generated template. Backend owns defaults for routine operational labels;
  model retains semantic decisions, data review and visual review.
- Forbidden: frontend model prompts, geometric changes, credential/model changes,
  weakened validation, skipped review, new dependencies, runtime/Undo changes.
- Work: native tool schemas supplied once per request; no duplicate catalog or
  operation schemas in the text input. Final-response action schemas remain.
- Gates: test-first compact payload and parameter-only operation cases, preserved
  optional meaningful messages and invalid-input rejection, prompt policy tests,
  full App tests/typecheck/build, Inspector generation/tests, template parity,
  naming/lint and latest-head CI. No latency or token-saving percentage claim.
- Failure owner: request-backend-action-batch. Stop if the change needs a new
  runtime owner, changes canonical behavior or removes required decision evidence.

### Evidence-led representation selection - 2026-09-19

AI owns interpretation of the user's intent, decomposition strategy and the
decision to adopt a representation. The backend supplies registered, deterministic
analysis and execution; it does not decide what the artwork means. No blanket
preference for Oval or any other component is permitted. A candidate should be
converted only when analysis and the intended result justify it.

Reference practices: <a href="https://www.anthropic.com/engineering/writing-tools-for-agents" target="_blank" rel="noopener noreferrer">Anthropic tool design</a>
emphasizes meaningful, bounded tool responses and outcome-based evaluations;
<a href="https://v0.app/docs/design-mode" target="_blank" rel="noopener noreferrer">v0 Design Mode</a>
provides selected-object visual context. One user prompt can drive multiple
analysis/action/review iterations; these sources do not establish perfect output.

Research synthesis and resulting flow:

- A single user message may initiate several model/tool/review cycles. The
  <a href="https://www.anthropic.com/engineering/building-effective-agents" target="_blank" rel="noopener noreferrer">Anthropic agent workflow guidance</a>
  describes feedback-driven tool use; it does not imply one generation is enough.
- Give the model the original reference, user constraints, current component and
  operation catalog, compact source summaries, analysis limits and actual rendered
  evidence. A broad instruction such as “improve quality” cannot replace these inputs.
- Treat candidate selection as a semantic decision and geometric measurement as a
  deterministic backend responsibility. Do not spend model output on coordinates
  the backend already owns. Compact evidence is a design goal; token/latency gains
  require measurement and are not asserted by this change.

| Phase         | AI responsibility                                                                 | Backend/App responsibility                                              |
| ------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Interpret     | Identify foreground/background intent, constraints and plausible representations  | Supply registered operations, components and current context            |
| Trace         | Select an available tool and inspect compact path summaries                       | Preserve source geometry and return request-owned artifact IDs          |
| Data review   | Nominate plausible candidates and assess whether conversion helps the request     | Measure fit/topology, disclose limits, return bounded analysis receipts |
| Prepare       | Select evidence-backed mappings, retain vectors, or explain an unmet constraint   | Validate receipt/source/selection and construct canonical batch actions |
| Visual review | Compare the actual render with the original request; choose supported corrections | Apply batches, return fresh rendered evidence and object IDs            |
| Finish        | Report achieved results and concrete remaining differences                        | Close the existing turn transaction as one Undo commit                  |

The merged-background case has two different questions: whether a contour matches
an available component, and whether foreground/background can be separated without
losing details. This change provides evidence for the former and identifies the
latter as a decomposition requirement. It does not pretend that a whole-path
replacement can solve both or introduce a logo-specific backend rule.

Step Execution Card - request-backend-action-batch:

- Product source: local-ai-provider, evidence-led component analysis below.
  Inspector: request-backend-action-batch and its existing review receipt loop.
- Inputs: current-request immutable vector artifact, AI-selected path IDs,
  registered component catalog and existing drawing target bounds.
- Outputs: bounded read-only analysis receipt containing contour identities,
  measured fit errors, conversion eligibility and limitations; AI-selected
  receipt-backed mappings resolved to existing prepared drawing descriptors.
- Conditions: analysis precedes approximating a traced path with a component.
  No automatic mutation or semantic selection. Original vectors remain when
  no mapping is selected; unknown/cross-request/mismatched receipts fail closed.
- Bypasses: no plausible candidate requires no analysis; complex/compound
  artwork reports that decomposition is required, never silently fills holes.
- Contributors/owner: App backend artifact analysis, image-tool adapter, local
  provider dispatch and domain prompt. No frontend geometry reconstruction,
  image identity branches, AI-generated coordinate arrays or renderer repairs.
- Boundary: App server, directly affected progress presentation/schema consumers
  only if needed, existing local-ai E2E, source spec/Inspector and generated template.
- Names: ANALYZE_VECTOR_COMPONENTS / analyze_vector_components in the existing
  backend tool registry; analysisId is request-local, never persisted. No change
  to canonical component or document identities.
- Lifetime/work: each explicit bounded analysis produces one immutable receipt;
  repeated preparations consume its completed eligibility results without
  remeasuring curves. No cross-request cache or automatic background analysis.
- Gates: test-first catalog/prompt/analysis and receipt admission; exact/near
  primitive, irregular, compound, invalid, cancellation, work-count and isolation
  cases; full App tests/typecheck/build, actual mixed-component drawing with one
  Undo/Redo, template parity, naming/lint/Inspector and latest-head CI.
- Scope excludes adding segmentation, raster generation, arbitrary path surgery,
  new components, clipping, dependencies, model changes or deadline changes.
  These are capabilities the AI may consider only when actually registered;
  this slice makes their absence explicit rather than promising them in prose.
- Parallel-analysis extension authorized by the user: admit up to 128 independent
  read-only analysis calls without awaiting preceding replies (10- and 100-call regressions).
  Each call retains its own request/call/analysis identity; responses may arrive in
  any order. Mutating/other tools remain exclusive, and final settlement drains
  outstanding analysis work. The 32-call non-analysis budget is preserved separately.
  This is concurrent protocol dispatch, not a claim of parallel CPU execution.
  Tests cover all-started-before-first-result, correlation, failures/cancellation,
  and rejection of overlapping writes. Same owner step/boundary as above.
- DoD: AI can obtain inexpensive geometric evidence, choose a supported mapping
  and render/review it; compound artwork cannot be falsely certified convertible.
  Do not claim this alone reconstructs the reference logo's merged background.

### Analysis budget decision - 2026-09-19

The user's 100-object scenario illustrates the workflow; it does not set the
limit. Limits are conservative, adjustable defaults for heterogeneous user
machines, not derived from one workstation's benchmark and not a performance SLA.

- Prefer one package of up to 128 candidate paths from one artifact. The backend
  divides it into jobs of at most 16 paths, yields between jobs, and returns one
  complete report. The model need not orchestrate a promise per object.
- Reserve a shared total of 128 candidate analyses per turn before queuing work.
  Separate independent calls remain supported, up to 128 calls within that same
  candidate budget. Repeated candidates consume budget; reuse earlier evidence
  when the source has not changed.
- Run one CPU job at a time on the existing Node event loop. There are no new
  workers or dependencies. These limits bound bursts and memory without assuming
  a user's core count, CPU speed or available memory; batch boundaries permit
  cancellation and I/O. They do not promise a fixed duration on every machine.
- Retain 8,192 samples and 100,000 intersection checks per path; responses contain
  at most eight contour summaries per candidate and no coordinate arrays.
  Overflow reports its limitation and leaves the original vectors intact.
- Preserve 32 non-analysis calls and at most 160 total protocol calls. Analysis
  cannot consume the allowance needed for applying and reviewing the drawing.
- Permanent tests cover complete 100-candidate packages, 10/100 independent
  submissions, matching replies, pre-reserved budgets, queued cancellation and
  exclusive non-analysis tools. No machine-specific latency test is required.
  The 7076 sample is not rerun, per the user's vector-only scope clarification.

Local validation for this slice: full App suites, server regression suite,
typecheck/build, naming/lint, Inspector and generated-template parity passed.
Permanent cases cover one 100-candidate package dispatched as 16/16/16/16/16/16/4,
10/100 independent calls, combined receipts, work reuse, budgets and cancellation.
The six deterministic local-AI browser cases passed; the final mixed-component
case and a real-subscription image case passed after the final receipt changes.
The live image case observed the actual analysis call and native Rectangle output.
Both actual App screenshots were inspected: the live blue square is a Rectangle,
the white compound background remains a Vector, and the mixed fixture contains
Rectangle/Oval/Vector with exact one-Undo/Redo restoration. Latest-head PR CI is
the remaining remote integration check.
No 7076 gate or machine-specific performance gate is required for this slice.

### Stable conversation and roles

- Append a user message immediately when submission is accepted. Render it on the
  right with its attachments. Keep its identity, role, text, and position stable
  during execution, questions, failure, and completion.
- Render assistant messages on the left. Never put submitted intent into an
  assistant `Request` block or reconstruct the conversation only after settlement.
- Separate user messages, assistant text, execution activities, questions,
  approvals, and outcomes. They may belong to the same request but are not one
  interchangeable message type.
- A provider attempt ending does not mean the user's drawing request is complete.
  A question ends in waiting for the user, not `Completed` or `No changes needed`.
- App-authored labels, hints, errors, buttons, and status text use English.
  User text, user-authored names, and model-authored responses retain their language.
- The first version retains a document-scoped, in-memory conversation. It does not
  add persisted chat, cross-device chat, or a retained native model session.

### Progress, thinking, and results

- Show one concise current activity, backed by actual events. Before a more
  specific event is available, show `Working…`.
- Use `Converting image to vectors…` only after the registered conversion tool has
  started; use `Updating canvas…` only when the mutation owner is applying changes.
- Put completed technical activity in a collapsed `Activity` disclosure. Keep the
  current actionable question, failure, and final result visible outside it.
- Do not expose `Requesting an action batch`, `Resolving app actions`, and permission
  preflight as a mandatory six-step conversation. Do not simulate progress with
  timers, invented percentages, or repeated generic thinking messages.
- Model reasoning summaries and assistant commentary are separate from runtime
  activity. The current local adapter does not deliver them to the panel. This
  version must work truthfully without them; streaming model commentary/reasoning
  is deferred until a bounded transport and disclosure contract is specified.
- Existing bounded batch explanation is model-authored intent, not proof of
  execution. Present result text only with the actual runtime outcome; suppress
  success claims that are contradicted by failure or partial execution.
- Successful execution must describe what changed using available bounded action
  summaries and outcome data. It must not assert visual fidelity merely because
  actions executed successfully. Do not traverse geometry to generate chat text.
- Show elapsed duration as secondary metadata. Track execution time separately
  from time waiting for a user; waiting must not look like active computation.

### Questions and approvals

- Questions contain a prompt, answer choices when appropriate, and an ordinary
  text-answer path. Buttons must submit real structured answers.
- Clicking a detail choice records a right-side answer such as `Balanced detail`,
  retains the selected state in the original question, and continues automatically.
  Do not display a synthetic instruction such as `draw this image with balanced
detail` as though the user typed it.
- Continuation preserves original subject, dimensions, attachments, target drawing,
  and answered preferences. It does not ask the same resolved question again.
- Disable duplicate submissions immediately. Obsolete questions show the chosen
  answer or `Superseded`, with no misleading actionable affordance.
- Do not force a detail-level question on every drawing. Ask only when a material
  ambiguity or resource tradeoff needs user input. An explicit preference is an
  answer; otherwise use the normal balanced default when no decision is necessary.
- Approval is distinct from preference. Show a concrete bounded description of
  affected objects, the reason approval is needed, and `Approve` / `Decline`.
  Preserve the decision. Existing runtime permission policy remains authoritative;
  routine authorized drawing does not gain an extra approval step.

## End-to-end state flow

These are product states, not new wire identifiers. Programmatic naming and
compatibility must be resolved in the owning implementation slice.

| State or transition           | Visible presentation                                          | Allowed interaction and outcome                                            |
| ----------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Ready                         | Composer and connection status                                | Edit, attach, send                                                         |
| Unavailable before submission | `Local AI unavailable` and actionable reason                  | Keep draft; reconnect; do not start a doomed request                       |
| Accepted submission           | Stable right-side message; left-side `Working…`               | Stop; edit a future draft without submitting a concurrent turn             |
| Provider preparation          | One genuine activity; expandable completed activity           | Stop; no fabricated substeps                                               |
| Needs answer                  | Left-side question and `Waiting for your answer`              | Choice or text continues original request; no spinner                      |
| Needs approval                | Concrete change summary and `Awaiting approval`               | Approve continues; decline settles without executing denied changes        |
| Applying                      | `Updating canvas…`; canonical owner progress when available   | Stop follows transaction cancellation; document lock remains authoritative |
| Success                       | Actual change summary and available contextual actions        | Continue editing or use valid Undo                                         |
| No change                     | Explain why no edit occurred                                  | Continue conversation; never classify a question as terminal no-change     |
| Partial                       | Explain applied and skipped changes                           | Review result; no unconditional replay of the whole batch                  |
| Failed                        | Stage, sanitized reason, canvas disposition, recovery actions | Retry only when safe, or edit and resend                                   |
| Stopping                      | `Stopping…`                                                   | Prevent duplicate actions until cancellation settles                       |
| Stopped                       | Actual rollback or retained-change result                     | Continue, safely retry, or use valid Undo                                  |

Connection readiness is independent of request outcome. `Local AI connected` does
not guarantee that a model request succeeded, met its deadline, or produced a good
drawing. Show the last readiness check honestly; do not run inference to probe it.

## Revision and failure recovery

The user's 2026-09-15 reference case is mandatory: a text-only Starbucks logo
request produces an unsatisfactory approximation; the user attaches a screenshot
and asks to redraw it with VTracer and replace the previous result. The screenshot
shows a generic failure after five minutes, with no actionable continuation.
This is observed UX evidence, not proof of the conversion tool's execution or the
failure's technical cause.

- Text-only drawing cannot promise exact reference fidelity. Do not claim that a
  conversion tool was used when no supported reference image was supplied.
- An explicit request to trace an attached supported image must use the registered
  VTracer route or report why it cannot. Do not silently substitute a hand-drawn
  approximation and call it traced output.
- Resolve `replace the previous drawing` from conversation-owned target references
  and current document context. If there is no unique valid target, ask a focused
  question. Never infer permission to delete unrelated canvas content.
- Prepare the replacement before deleting the old drawing. Apply replacement
  through the existing canonical transaction and permission owners. Failed or
  cancelled replacement must retain or restore the old drawing; a successful
  replacement is one intended Undo action. If existing registered actions cannot
  ensure this, specify and validate a bounded replacement action before shipping
  the revision flow; never compose unrelated delete/create turns in the UI.
- Preserve the original request, reference attachment, target, and selected detail
  across recovery. Retention ends with the document conversation lifetime; do not
  introduce provider-output caches or duplicate retained geometry.
- Distinguish unavailable connection/login, deadline exceeded, provider failure,
  conversion failure, invalid batch, and application failure using sanitized
  structured failure data. Never infer failure type from elapsed time alone.
- Example verified timeout copy: `The request timed out before any changes were
applied.` Actions: `Try again`, `Edit request`. For failed replacement, explicitly
  say `Your previous drawing is unchanged` only after the owner confirms it.
- Retry is user initiated, keeps context, and creates a linked attempt. Before
  repeating mutation, require a confirmed no-apply or rollback outcome. Unknown
  and partial application must be reconciled by the execution owner, not guessed
  from UI state. Never silently retry indefinitely or increase timeout as the fix.
- While work is genuinely running, show current activity and keep Stop available.
  An unusually long operation needs a visible elapsed duration and an honest
  waiting message, not a frozen success toast or a fabricated estimate.
- Success toasts belong to the request that produced them and expire. A later
  failed revision cannot leave a stale success toast implying that revision worked.
- Image generation and raster canvas elements remain unsupported. Supported image
  input and VTracer vector conversion remain separate capabilities.

## Architecture and ownership

The existing server-prepared action-batch path remains the only mutation route:

```text
User submission or answer
  -> App conversation controller (message identity, context, lifecycle)
  -> existing App feature and same-origin action-batch request
  -> App server (domain prompt, selected provider, registered VTracer)
  -> completed AiActionBatch
  -> runtime resolution and permission
  -> registered App action and canonical transaction
  -> authoritative outcome
  -> conversation projection and panel
```

| Owner                                                                     | Inputs and outputs                                                                                  | Boundary and failure responsibility                                                                                                                        |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App conversation controller (`src/ai/conversation.ts`)                    | Submissions, answer decisions, runtime events and results -> ordered messages and request lifecycle | Own stable identities, original intent, attachment/target references, one active attempt, continuation, duplicate rejection, and retirement of late events |
| App presentation (`src/ai/presentation.ts`)                               | Conversation state and bounded results -> display text and available actions                        | Pure projection; no requests, geometry scans, mutation, fabricated reasoning, or independent lifecycle state                                               |
| App panel (`src/app/ai-conversation-panel.tsx`)                           | Fine-grained view subscriptions -> role layout and user commands                                    | Own focus, scrolling, disclosures and draft; never execute drawing directly or infer success from a timer                                                  |
| App confirmation adapter (`src/ai/confirmation.ts`)                       | Runtime approval request and user decision -> one correlated response                               | Own approval settlement; decline and cancellation cannot leave unresolved pending controls                                                                 |
| App server (`server/ai-model-provider.ts`, `server/local-ai-provider.ts`) | Bounded request/context and server-owned prompt -> prepared batch or sanitized error                | Own provider and VTracer facts; no browser prompt, credentials, raw provider logs, or automatic alternate backend                                          |
| Shared AI runtime                                                         | Prepared batch, permission and abort -> execution outcome and bounded progress                      | Remains execution authority; App cannot redefine partial execution, rollback, or commit from presentation state                                            |
| Registered App actions and canonical owners                               | Approved prepared actions -> actual document change/history                                         | Own replacement atomicity, canonical progress, rollback and Undo; no AI-only rendering or direct UI writes                                                 |

The controller lives with the document session, not the panel's visible subtree.
Closing the panel hides it without stopping work; reopening restores its current
conversation. Navigation/document disposal cancels and disposes through the existing
owner lifecycle. Stop explicitly cancels; Undo is a separate history operation.
During the existing document interaction lock, only already-authorized interactions
remain available; this plan does not relax the canonical lock to enable chat controls.

Use fine-grained subscriptions and composition. Do not add `React.memo`, duplicate
stores, derived geometry, per-render context capture, or speculative caches.
Events and results must correlate to the owning request/attempt; late responses from
cancelled, superseded, or disposed work cannot create messages or mutate the canvas.
Question answers may start a new ephemeral provider attempt while remaining part of
the same user goal. No durable native thread or second provider API is required.

## Contract alignment before implementation

Current architecture authority:
`tools/flow-inspector/inspectors/ai-conversational-drawing-performance-flow-inspector.data.cjs`.
Relevant existing boundaries include `request-backend-action-batch`,
`resolve-server-prepared-action-batch`, and the App progressive composition owner.
Current provider authority: `../specs/local-ai-provider.md`.

Before production edits, publish the accepted user behavior as a thin App spec and
align the matching Inspector routes for submission, answer continuation, request
outcome, replacement, and panel lifetime. The current Inspector describes sending
ordinary turns and batch execution; it must not be assumed to already encode the
new complete conversation lifecycle. Preserve its existing mutation, rollback,
interaction-lock, credential and provider boundaries. This plan is the execution
sequence and decision record, not a second permanent specification authority.

## Implementation sequence and acceptance

All stages below are pending. Work one owning Inspector step at a time, with its
Step Execution Card. For each reported defect, run existing formal tests first;
if they miss it, add a permanent regression and prove it fails before implementation.

1. **Contract alignment.** Thin App spec, exact Inspector handoffs and named product
   cases. Review source/consumer compatibility and identifiers; run naming before
   the first identifier-bearing slice. No runtime change in this stage.
2. **Conversation lifecycle.** Stable messages, request/attempt separation, original
   context, answer continuation and document-scoped lifetime. Prove immediate user
   message, stable identity across transitions, stale-event rejection, and no
   duplicated submission with controller tests.
3. **Outcome and revision ownership.** Sanitized failure reasons, truthful results,
   referenced redraw, safe retry and replacement transaction. Prove timeout before
   mutation, conversion failure, ambiguous/missing target, cancellation during
   replacement, complete rollback, partial outcome and one successful Undo.
4. **Presentation and controls.** Left/right roles, one current activity, questions,
   approval, selected answers, status, Stop, draft, hidden/reopened panel and recovery.
   Component tests cover every state and transition, not only settled screenshots.
5. **Integrated visual and consumer acceptance.** Formal E2E runs below, synchronized
   screenshots inspected at narrow and desktop panel widths, template regeneration
   and generated-consumer parity, focused App/server/runtime checks, typecheck,
   lint/naming/build and relevant Inspector contracts. Run applicable existing
   guarded performance/collaboration gates once the complete affected owner slice
   is ready; no weaker sample replaces a required full-flow gate.

Mandatory product cases:

- A simple text drawing shows the user immediately on the right; the message never
  moves into an AI card while processing or after completion.
- A question can be answered by click, keyboard, or text; exactly one continuation
  retains subject, dimensions and image. Already-answered choices remain readable.
- Waiting for an answer/approval has no active-work spinner or completed result.
- A real tool run has truthful progress; no tool event means no claimed tool run.
- The reference-image replacement scenario above succeeds with editable vectors,
  preserves requested dimensions, removes only the intended prior drawing, and has
  a reversible history action. Visual fidelity must be inspected against the
  supplied reference, not inferred from successful action execution.
- The same scenario with conversion failure, timeout and cancellation preserves the
  old drawing, reference and intent, and exposes a useful recovery action.
- Long-running work keeps activity, elapsed time and Stop usable. An earlier success
  toast cannot misrepresent a later failed request.
- Partial/unknown execution cannot be blindly retried. Error details never include
  personal instructions, credentials, account identity, raw stderr or raw protocol.
- Close/reopen preserves state; navigation disposes safely. App-authored copy is
  English while user and AI-authored language remains intact.
- At 360px and desktop panel widths, inspect active, question, approval, success,
  partial, timeout, stopped and disconnected states. Verify actual alignment,
  wrapping, focus, keyboard activation, no clipping, and usable composer controls.
- Reading history does not force-scroll to new activity. Following the latest
  message follows new output; otherwise expose `Jump to latest`.

Completion requires these product cases, the applicable frozen gates, and inspected
visual evidence. Green unit tests alone do not close the UX work. Report live local
subscription evidence separately from mocked protocol tests. The implementation is delivered through PR #223; readiness requires every
required CI check on its delivered head to pass.

## Research references

These sources informed the role/activity/interaction separation. They do not mandate
adopting a package or copying a developer-oriented tool log into a drawing app.

- <a href="https://openai.com/index/unlocking-the-codex-harness/" target="_blank" rel="noopener noreferrer">Codex App Server: typed items, turns, events and approvals</a>
- <a href="https://elements.ai-sdk.dev/components/message" target="_blank" rel="noopener noreferrer">AI Elements: role-based messages</a>
- <a href="https://elements.ai-sdk.dev/components/reasoning" target="_blank" rel="noopener noreferrer">AI Elements: separate, collapsible reasoning</a>
- <a href="https://www.assistant-ui.com/docs/tools/tool-ui" target="_blank" rel="noopener noreferrer">assistant-ui: tool progress, outcomes and human input</a>
- <a href="https://elements.ai-sdk.dev/components/confirmation" target="_blank" rel="noopener noreferrer">AI Elements: approval request and decision states</a>
- <a href="https://elements.ai-sdk.dev/components/conversation" target="_blank" rel="noopener noreferrer">AI Elements: conversation scrolling</a>

## Implementation evidence - 2026-09-15

- Stable role-specific messages, question click/text continuation, retained approval
  decisions, real tool activity, safe recovery and hidden-panel continuity implemented.
- Runtime progress: 79 tests passed. App AI: 166 tests passed. App local suite:
  400 tests passed. Server: 93 passed, with subscription unit gate opt-in.
- Actual subscription image request through the Agent panel passed in 48 seconds;
  the inspected output contains the reference's editable blue/white geometry.
  This is connectivity and simple-image evidence, not a complex logo fidelity claim.
- Ten layout/conversation E2E cases passed at 360px and desktop widths. Full 7,076
  canonical rendering passed in its disconnected-socket environment. Reference
  replacement adds one Undo entry; timeout retains the prior drawing and image.
  An additional browser regression proves full rollback after incomplete insertion
  and suppresses blind retry for partial results.
- Inspector: 100 contract tests passed. Generated consumer: READY across 12 packages
  and six phases. Final source/template parity and PR-head CI are the delivery gates.

## Multi-step backend operations - 2026-09-18

Authorized scope: extend the existing provider request with sequential prepared
batch execution and acknowledged results, App-owned backend operation tools,
truthful operational messages and capability outcomes, one invocation transaction,
permanent runtime/server/controller/browser tests, current contracts and generated
Design template parity. No new dependencies, image generation, geometry cutting
algorithm, authentication, rendering or persistence owners are introduced.

The AI analyzes registered tool summaries and selects backend operations. Backend
owners retain complete tool artifacts for the request, prepare canonical action
arguments, and await runtime execution receipts before returning to the AI. A tool
limitation does not imply that the whole App cannot satisfy a request; the AI may
combine registered operations and inspect their results. Unsupported work ends
with a specific user explanation, not an opaque error or an unconditional retry.

One request opens one ordinary transaction and interaction lock. Multiple prepared
batches, intermediate messages and follow-up edits remain inside it. Normal
completion, including an explained capability limit after successful edits,
commits once. Fatal execution errors, cancellation and transport failure roll back
through the existing transaction owner. Every terminal path releases the lock.
No new user request or unrelated manual document edit joins the transaction.

Owner slices: (1) runtime sequential execution and receipts, (2) server operation
catalog and same-origin acknowledgement transport, (3) conversation projection and
capability outcomes, (4) integrated live subscription, Undo/Redo, visual and template
validation. Existing single-batch HTTP/sample callers retain their payload and
canonical path. Intermediate batches require explicit transport support.

Required evidence: two dependent batches see actual returned IDs, one commit and
Undo/Redo; per-batch permission; duplicate/late/foreign receipt rejection; no retry
after mutation; cancellation/exception rollback; unsupported before/after edits;
no raw protocol errors in UI; exact reference image live execution; narrow/desktop
screenshots. Run affected runtime/App/server suites, typecheck/build, lint/naming,
Inspector contracts, applicable canonical full-flow gates, template parity and CI
on the final PR head. Stop for an out-of-scope canonical prerequisite; do not add
fixture-specific behavior or weaken existing resource guards.

Validation refinement: the outer transaction also spans provider and confirmation
waiting, so the App interaction lock must admit panel controls without admitting
document edits. The panel isolates its own DOM events; the toolbar toggle admits
activation only while locked and preserves ordinary shortcuts once unlocked.
Existing narrow/desktop close/reopen, approval, shortcut and Stop browser cases
remain the acceptance contract. This is an interaction-boundary correction within
the multi-step slice, with no change to canonical transaction or input owners.

### Implementation evidence - 2026-09-18

- Acknowledged backend operations, actual canonical IDs/context, per-batch
  permission and confirmation, and one invocation transaction are implemented.
- Runtime 84, App AI 175, additional App Vitest 401, backend 106 tests pass.
  The configured local environment has one pre-existing no-env assumption
  failure; all five environment tests pass in the clean generated template.
- Twelve conversation/live-subscription browser cases pass. Nine focused cases
  also pass against the final rebuilt artifacts, including narrow/desktop
  confirmation and recovery, capability remainders and exact Undo/Redo checks.
- Real reference-logo execution removes the separate TM path. A dependent-edit
  case inserts all 38 paths, then hides only the TM path from actual returned IDs:
  two batches, one Undo entry, approximately 24.6 seconds in the final run.
- Runtime/App/template builds, typecheck, naming, lint (no errors), public docs,
  template parity, 30 affected Inspector/catalog tests and full 7,076-element
  canonical rendering pass. App screenshots and the reference crop were inspected.
- PR-head CI remains the remote delivery gate; this evidence does not claim
  pixel-identical logo fidelity or a guaranteed model latency.

### Activity synchronization correction - 2026-09-18

The status headline and Activity history share one App-owned projection of
existing runtime events and controller approval/stop state. Activity labels describe the work in English without exposing tool names or
AI-wait terminology. Completed tool work shows Reviewing the results without
implying that the entire request is finished. Operational messages stay with their
entry, the last entry indicates current activity without a badge or highlight,
and terminal summaries are labelled
Result. This slice changes presentation, its formal unit/browser tests, current
contracts and template parity only; backend, transaction and geometry owners are
unchanged. Validation includes staged streaming at 360px and 1280px, settled
marker removal, retained messages, and no history reprojection on draft typing.

### Refinement and native primitives - 2026-09-18

Owner step: request-backend-action-batch (App server). Inputs are the original
intent/reference, request-owned trace artifact, registered schemas and actual
execution receipts. Output remains prepared canonical batches and a truthful
completion report. Scope: server domain instructions, explicit oval path
selection in artifact preparation, direct tests, current specs and generated
template. No renderer, transaction, timeout or canonical mutation changes.

The server accepts optional ovalPathIds for explicit semantic replacement of
whole single-contour paths with native Oval descriptors; absent selection keeps
the original vectors. Preserve bounds, fill, order, roles and unaffected paths.
Reject foreign, duplicate, excluded or compound-path selections. No geometric
heuristic, brand-specific correction or automatic conversion is permitted. The
request-owned artifact remains the geometry owner; no additional cache is added.

Prompt policy requires receipt-based review and repeated supported edits before
report_outcome, preserving one Undo. Only supplied evidence may support review;
visual fidelity cannot be asserted without actual rendered-image feedback. Stop
on satisfaction, unsupported work, no improvement, cancellation or runtime limits.
Gates: test-first artifact/prompt regression, native consumer admission, operation
receipt tests, server/App tests, typecheck, naming, lint, template parity and
Inspector contract. Stop on unavailable evidence rather than inventing review.

### Rendered review loop - 2026-09-18

Bounded scope: engine-neutral subtree snapshot query (Render Engine/Pixi),
Render/Core facade, App read-only inspection action and registry, local provider
image-result delivery and completion admission, prompt, direct tests/docs,
Changeset and generated template. No new dependencies, canonical renderer
geometry, transaction semantics, image generation or arbitrary node-editing API.

Owner step: capture-drawing-review. Inputs: current canonical target ID, current
render projection and cancellation. Outputs: fresh bounded PNG and target/object
metadata or explicit unavailable result. App selects the target; Render flushes
and resolves its handle; engine extracts its real subtree. No UI screenshots,
custom renderer access, diagnostics-as-content, hidden state edits or cached image.
Boundary: App inspection/common API; Core facade; Render projection; Render
Engine/Pixi snapshot query and their tests/docs. Failure owner: inspection action.
Cases/gates: missing/unsupported/invalid targets, capped pixels, fresh image after
edit, no camera/selection writes, native image tool delivery, final inspection
after edits, repeated corrections and one Undo, real-subscription visual proof.

Stage 1 implements/tests capture at the declared Render/Core contributors. Stage
2 admits read-only inspection through existing App action execution. Stage 3
delivers image evidence to the provider and requires review before completion.
Inspect the matching owner contract before each stage. Test each stage before
advancing; stop on stale evidence or unsupported capture instead of fallback.

#### Bounded iteration - operation schema and two-stage review

Live native-image delivery succeeded, but repeated refinement failed because the
update action advertised an untyped updates array. The model guessed string items
and misplaced fillColor. The first incorrect owner is the App action inputSchema,
within resolve-server-prepared-action-batch's registered definition contributor.
Replace that incomplete schema with the existing geometry/style union; do not add
client geometry validation or change canonical mutation. Add a schema regression
before implementation, then rerun the real repeated-refinement case.

User clarification: review tool data before admitting any drawing mutation. AI
first checks structural summaries, constraints and supported backend parameters;
iterate only when inputs/options can improve the result. Identical deterministic
conversion is not a useful retry. Only after this cheaper review should the backend
prepare/apply batches. Actual-rendered review remains required afterward and after
corrections; it supplements rather than replaces data review. Scope adds prompt,
its formal policy tests and the existing request/inspection contract descriptions.
Self-review: no new tools, model-side geometry processing, provider retry after
mutation, transaction changes or fabricated visual evidence. Gates remain scoped
schema/prompt tests, App/server suites and real native-image refinement with Undo.

#### User scope clarification - App component mapping

Data review chooses representations from App-supported component conversions,
not only Oval versus vector. The current AI drawing descriptor admits Rectangle,
Oval, Vector and Group; Frame is a preset component but has no AI drawing action
contract here. Extend the existing server artifact owner with explicit per-path
componentMappings for supported Rectangle/Oval substitutions, while preserving
unmapped vector geometry and the existing composition Group. Keep ovalPathIds
compatible as an existing wire field; reject duplicate/conflicting selections,
unknown targets, exclusions and compound paths before descriptor creation.

The backend exposes the actual conversion catalog with the artifact summary and
reference schema; AI selects only conversions supported by both that catalog and
the action schema, based on semantic/reference evidence, not bounding-box shape.
Do not invent OCR, Frame conversion, custom component reconstruction or new native
components. Tests: mixed Rectangle/Oval/Vector preparation, negative mapping
admission, prompt/catalog consistency and real canonical mixed-component rendering.
Owner remains backend artifact preparation under request-backend-action-batch;
no rendering, transaction or framework component semantics change in this slice.

Mixed-component browser admission exposed an existing descriptor-schema mismatch:
Rectangle's canonical component ID is rect, while the AI schema advertised
rectangle. The typed schema regression fails before correction. Use rect in the
registered descriptor schema, conversion catalog and canonical assertions; retain
Rectangle only as a display name. No component alias or canonical migration is
introduced. This is the first incorrect registered-definition boundary, not a
reason to add a renderer fallback. Repeat mixed-component and live image gates.

Final local validation for rendered review and component mapping: App AI 184,
backend 117, engine 9, Pixi 15, Render 223 and Core 241 tests passed. Real local
subscription evidence includes repeated native-image refinement with exact
one-Undo/Redo restoration, native Rectangle creation from an image, and a 240px
reference logo without its separate mark. Typecheck and App/template builds pass.
The live gate must run with App source and tests frozen: editing even a server
unit-test file triggers Vite reload and invalidates a live conversation result.
The reload-interrupted run is not model latency evidence. The frozen final browser suite passed all 12 cases, including live refinement.
PR-head CI remains required before delivery. Polygon tracing quality remains a documented
limitation; this scope does not install or substitute another conversion tool.

#### CI direct-consumer compatibility correction

The new optional query exposed two direct consumers: FieldScope and Asyra Sim
ThreeEngine assumed every remaining query had point coordinates and advertised
all enum capabilities automatically. CI correctly rejects the widened union.
Bounded correction is their engine files, existing engine tests and capability
documentation only: list the capabilities actually implemented and explicitly
reject snapshot before projection work. Do not implement 3D capture or change
spatial rendering. Test-first rejection/capability admission, both engine suites,
and the full monorepo React build precede the next push. The capture owner still
reports unavailable for engines without the capability; no active spatial plan
or Inspector route gains a new output or behavior.

#### Inspector closure correction

Full CI contracts, beyond the focused catalog tests, detect an unregistered output
artifact and a missing anchor in the Inspector's declared specification document.
The bounded repair is the capture step's artifact, incoming/outgoing handoff routes,
consumer declarations and a source-of-truth link from its specification section.
No viewer exception or weakened test is allowed. Existing full contracts already
reproduce the failures. Run the complete Flow Inspector suite before another push;
App behavior, engine code and geometry stay frozen during this documentation slice.

### Reference tracing quality - bounded follow-up

Objective: preserve smooth reference contours through the existing image tool,
backend preparation and canonical editable Vector path. Reuse installed VTracer
in spline mode and the declared bezier-js dependency; no new tool or dependency.
Scope: the App VTracer worker, request-owned vector artifact parser/preparer,
their permanent tests, local-AI E2E, current specification/Inspector condition,
and generated template parity. UI, timeout, model settings, one-request Undo,
framework rendering, sample instruction artifacts and component selection policy
remain unchanged. Stop if fidelity requires a framework geometry semantic change.

Step Execution Card - request-backend-action-batch:

- Contract: local-ai-provider.md, reference curve fidelity; Inspector request
  step inputs/outputs and local subscription backend clause.
- Inputs: accepted image, request abort signal, tool-produced SVG; same-request
  artifact reference, target bounds, exclusions and component mappings.
- Outputs: compact summary and complete canonical descriptors with real cubic
  controls, exact curve bounds, preserved contour order, winding and fills.
- Conditions: only the registered worker dialect is admitted; invalid geometry
  fails at this backend owner before mutation. Straight segments remain supported;
  degenerate nonpainting contours are omitted, never substituted.
- Contributors: existing worker, backend parser/preparer and installed bezier-js.
  Forbidden: model-authored coordinate reconstruction, frontend preparation,
  fixture-specific output, renderer patches and cross-request caches.
- Boundary: apps/asyra-design/vtracer-tool-server.mjs, server/local-vector-artifact.ts,
  existing server/**tests**, **tests**/vtracer-tool-server.test.mjs and
  e2e/local-ai-provider.spec.ts. Documentation clarifies this same owner.
- Reuse: conversion and curve bounds are computed once per request attachment;
  preparation reuses that artifact and only maps selected geometry. Preserve
  existing conversion-call-count and request-isolation tests; no new cache.
- Names: local curve/anchor types are App-internal; existing artifact IDs,
  component IDs, property names and prepared descriptor wire version remain.
- Gates: red-first cubic/closure/bounds/scaling cases, real reference small-detail
  and curve preservation, full backend/App gates, typecheck/build, naming/lint,
  Inspector contracts, template parity, ordinary Agent E2E with actual rendered
  comparison and one Undo/Redo. Inspect overview and detail crops at recorded zoom.
- Completion: exact native control-point preservation and improved measured
  reference fidelity through the real App, with conversion/geometry size evidence;
  do not claim fewer AI iterations or pixel-exact tracing without measurements.

#### Quality iteration - locate fidelity loss before tuning again

The native cubic/closure/bounds tests pass and canonical points match every
prepared descriptor, but actual rendered MAE regressed from 11.765 to 14.103
with photo spline and 13.731 with poster spline. Smoothness alone is insufficient.
Replace blind profile tuning with an owner-local attribution: compare original
raster, tool SVG, prepared paths and actual App extraction in the existing formal
E2E before changing production options again. Same request-backend-action-batch
owner, files, curve-fidelity spec and gates; no renderer work is authorized.
If the first loss is tool fitting, choose a bounded documented configuration
using measured candidates; if backend translation loses semantics, fix that
translation and add its source-space regression. If renderer semantics are the
first loss, stop for scope. Self-review: comparison alignment and source bounds
must be recorded, oracle thresholds are not relaxed to bless an inferior result,
and final evidence must still come from the ordinary App action with Undo/Redo.

Attribution result: cutout spline improves native SVG MAE from 11.624 to 8.005
(7.991 after identical bounds normalization), but App extraction remains 12.421.
Canonical and computed points/segments/bounds match prepared data exactly. The
formal native compound-contour browser test proves its transparent central hole
is filled green ([0,136,0,255]) instead of showing the white background. The
current Preset nonzero path sends all contours to ordinary engine fill without
preserving the hole. Framework/Preset geometry semantics are the explicit scope
stop condition above. Request expansion before editing those owners; do not push
or claim quality completion while this gate fails. Backend edits and permanent
failure evidence remain in this worktree for the user's scope decision.

#### Authorized compound-fill correction

The user authorized fixing the discovered Vector fill defect together with the
reference-quality slice. Extend the frozen scope to the Preset's solid nonzero
compound-contour projection and its hit area, direct tests, and package contract.
Keep canonical points, native cubic controls, persistence, strokes, gradients,
single-contour rendering, engine APIs, and transform-only updates unchanged.

Step Execution Card - retain-vector-render-geometry:

- Sources: Vector local geometry Inspector's complete-snapshot geometry/style
  miss route; Preset Vector fill contract and the failing linear/cubic hole E2E.
- Inputs: complete canonical Vector paths, fill rule, and existing local offset.
- Output: non-overlapping fill faces and matching hit geometry for nonzero
  compound contours. These are ordinary transient render geometry, never scene
  objects, background-colored masks, or AI-generated replacement artwork.
- Conditions: closed, solid, nonzero compound paths use winding-aware geometric
  projection; single-contour, gradient, stroke and evenodd routes remain as-is.
- Allowed contributors: Preset Vector strategy and internal geometry helper.
  Forbidden: app identity, reference-image recognition, diagnostic polygons,
  canonical edits, Pixi dependencies and fallback fills.
- Boundary: packages/preset/src/components and src/**tests**, Preset docs,
  existing local AI E2E and this plan. Failure owner is the geometry projection.
- Algorithm: adaptively subdivide cubic contours for render projection only;
  split horizontal slabs at vertices and segment crossings, then emit disjoint
  trapezoids for intervals with nonzero winding. This supports opposite/same
  winding, nested islands, intersecting contours and contour-order invariance.
- Names: internal compound-fill geometry only, no wire/persistence changes.
- Reuse: one prepared geometry per strategy invocation shared by fill and hit;
  transform-only updates keep bypassing the strategy. No additional retained cache.
- Gates: existing hole E2E is red; add winding/area/crossing/curve unit oracles,
  rerun Preset tests, actual App quality comparison and Undo/Redo, render delta
  regressions, full project gates and final CI. Stop for a new semantic owner
  outside this explicit scope; do not weaken the image-fidelity oracle.

Compound-hole E2E passes for both linear and cubic contours. Extending winding
projection to single contours did not improve the image comparison, so retain
that existing route. Native and parsed SVG rasterizations are identical. The
remaining discrepancy is the current PR's snapshot consumer: Pixi truncates
fractional local capture sizes before applying resolution (249.98 becomes 249),
then the review image is stretched against its reported untruncated bounds.

Step Execution Card - capture-drawing-review:

- Sources: local-ai-provider rendered drawing review and Inspector capture step.
- Inputs/outputs/contributors/bypasses: unchanged engine-neutral query and actual
  rendered subtree; output is bounded PNG with its actual capture bounds.
- Correction: the concrete engine supplies an enclosing integer extraction frame,
  with machine-precision integer normalization, and derives the resolution from
  that same frame. Report that actual frame in the receipt. No synthetic image,
  canonical write, camera mutation, new cache or new public API.
- Scope: existing Pixi snapshot implementation/unit cases, its package docs,
  existing App quality E2E and specification. This corrects a direct regression
  exposed by this PR's fractional curve geometry, not an unrelated engine refactor.
- Gates: fractional/subpixel/near-integer capture unit cases fail before the fix;
  Pixi suite, actual App extraction/quality/Undo tests, snapshot consumer regressions,
  package builds and final CI. Failure owner remains capture-drawing-review.

The full App gate reproduced a test-isolation defect: the missing-environment
case reads the developer's `.env`. Bounded correction is the existing environment
test only: pass an explicit missing fixture path and leave local configuration
and production loading behavior unchanged. `.env.example` is a setup template,
not a test fixture. When a local `.env` is needed and absent, copy the example
to `.env`; never overwrite an existing developer configuration. Tests define
their own inputs and do not load `.env.example`.

The source-space fill regressions, actual linear/cubic hole E2E, and extraction
regressions pass. Actual App reference MAE is 8.362 versus the old polygon
baseline 11.765 (about 29% lower); native SVG is 8.005. The selected trace has 44
elements and 4,841 anchors/controls versus 38 and 621 before. Conversion measured
about 32 ms. This proves this reference's fidelity, not universal tracing
quality, reduced AI iteration count, or a runtime speedup.

The same-image, original-instruction local subscription browser test passed in
39.7 seconds including startup (the conversation displayed 34 seconds). It
produced a 240 x 240 editable composition and excluded the separate TM path;
overview and detail screenshots were inspected. The frozen browser regression
suite passed 21 cases, with six opt-in subscription cases skipped in that run.
Full App tests passed. The environment example is excluded from test inputs.
Curve work-count coverage proves two cubic bounds computations on admission,
none across three preparations, and fresh computation for a new artifact.
The final 7,076-element gate passed. Clean template consumption reports READY
for 12 packages and six phases; package consumption, naming, lint, public docs
and template parity pass. Exact-head remote CI must still pass before PR review
notification.

## Activity stability and separated edge regression - 2026-09-19

- UI segment: conversation presentation owns stable existing Activity DOM/text
  and geometry while current status changes; append rows, preserve selection and
  the existing scroll-follow rules. Reproduce with streaming E2E first.
- Backend segment: request-backend-action-batch owns explicit native-background
  separation and source evidence. Diagnose fringe fragments and lost boundary
  contact using permanent raster fixtures and real tracing; correct only proven
  separation/prompt defects. AI keeps semantic decisions.
- Scope: panel/presentation, image-layer separation, domain prompt, direct tests,
  contract docs and generated template. No renderer, Undo, dependency, remote
  push, live subscription calls or CI monitoring.
- Gates: failing regression first, focused UI/server tests, deterministic E2E,
  typecheck, build, naming/lint, Inspector/template parity. Stop at unresolved
  source evidence rather than adding logo-specific geometry.

## Retain applied progress after ordinary failure

Bounded owner step: `resolve-server-prepared-action-batch`. Runtime opts into
committing applied progress on ordinary failure; App composition enables it and
conversation/presentation reports the failed activity as partial. Preserve one
canonical Undo, cancellation behavior, permissions and transaction settlement
safety. No Factory savepoints, geometry changes, live subscription calls, push
or CI monitoring. Gates: runtime failure-prefix/provider/cancellation/settlement
tests, App presentation and composition tests, deterministic drawing-failure
E2E with one Undo/Redo, typecheck, naming and template parity.

Validated locally: 88 Runtime tests, 30 focused App tests, retained-drawing and
incomplete-replacement Undo/Redo E2E, cancellation E2E, package/App builds,
typecheck, scoped lint, naming, Inspector contract and generated-template parity.
The retained-drawing screenshot was inspected. No live AI call or remote push.
