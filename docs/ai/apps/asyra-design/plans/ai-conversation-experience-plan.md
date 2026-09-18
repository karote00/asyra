# Plan: AI Conversation Experience

## Status and bounded contract

Design decisions fixed on 2026-09-15. Implementation authorized in the existing
`codex/design-local-codex` worktree. Final integration and PR-head CI validation
are in progress. Scope includes the owner files and permanent tests below.

Objective: make the complete drawing conversation understandable and actionable
from submission through progress, questions, execution, revision, and recovery.
The canvas remains the primary workspace. The panel presents a stable conversation
rather than an execution log.

Authorized implementation scope: App conversation state, presentation, panel,
confirmation integration, bounded server diagnostics and domain guidance, their
formal tests, current contracts, and generated Asyra Design template parity.
Shared runtime changes require a separately bounded owner slice when existing
public events cannot express an accepted outcome. Do not change canonical geometry,
rendering, collaboration, persistence, authentication, or dependency versions.
No new dependency is selected by this plan.

## Decisions

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
