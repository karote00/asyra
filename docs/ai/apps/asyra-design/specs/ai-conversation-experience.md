# AI conversation experience

## Product contract

User messages and attachments appear immediately on the right and retain their
identity and position across active and settled work. Assistant output appears on
the left. The App conversation controller owns request lifecycle, answered questions,
continuation and recovery; the panel is a projection. One active request is admitted.
A resolved provider attempt may ask a question rather than complete the user goal.

Each message displays only attachments submitted with that message. Answer and
retry requests retain the original reference as request context without presenting
it as a newly attached image. Explicit Edit request restores the complete request
and reference to the draft for review. Composer keyboard events stay in the text
input, preserving native editing and IME without invoking canvas shortcuts.

Questions expose clickable choices and a text answer path, preserve subject,
dimensions, attachments and target context, and record the selected answer. Waiting
for an answer or approval has no active-work spinner. Approval is governed by the
existing runtime policy, with a concrete change summary and an explicit decision.

Current activity is derived from real execution phases, with one concise visible
status and collapsed details. One App-owned activity projection produces the
ordered entries and the current entry shared by the headline and Activity list.
The list marks exactly one current entry while work is active, including real
approval/stop states. Tool events identify the registered tool or operation;
tool completion explicitly transitions to waiting for AI, not an invented next
processing stage. Model-authored operational messages stay attached to their
corresponding event. Settlement removes the current marker and labels the final
summary as Result (questions remain questions). No synthetic reasoning or timed
percentage is allowed.
Private model reasoning is never displayed. Explicit operational messages from registered backend operations may be displayed. App-owned text
is English; user text and model-authored content retain their language.

Completion describes actual results and does not certify visual fidelity. Failure
identifies a sanitized cause and canvas disposition, retains the request and image,
and offers edit/resend or safe retry. Retry is admitted only for confirmed pre-write
failure or cancellation; partial/unknown outcomes require review. An explicit image
tracing request uses registered VTracer or fails honestly, never a fabricated trace.
Replacement prepares new content before changing old content and executes in one
canonical transaction; failed or cancelled replacement rolls back. Target ambiguity
requires clarification, never deleting unrelated objects.

The controller is document-scoped. Closing the panel hides it; reopening retains
conversation state. Stop is explicit and remains available under the canonical
interaction lock. Navigation/disposal cancels work and retires late events. A stale
success toast cannot imply that a later failed revision succeeded.

## Architecture boundaries

Submission and continuation enter the existing App feature and same-origin
requestActionBatch route. The App server owns prompt, provider, registered image
tools and sanitized errors. Each completed prepared AiActionBatch reaches runtime resolution, permission and registered actions inside one invocation transaction. The server waits for execution receipts before continuing AI work. Conversation
state, status and UI never become canonical or shared document state. UI may not
prepare geometry, bypass permission, or infer rollback. No credential or raw provider
log may reach UI, templates or reports.

The exact architecture map is the conversation-lifecycle step in
`tools/flow-inspector/inspectors/ai-conversational-drawing-performance-flow-inspector.data.cjs`,
with existing provider, resolution and composition steps retaining their authority.

## Cases and definition of done

Permanent controller, component, server and integration tests must cover stable
message role/identity, question click/text continuation, duplicate/stale events,
waiting versus execution, sanitized deadline and conversion failures, safe recovery,
replacement success/rollback and valid Undo, panel close/reopen and stale toasts.

Formal browser tests and inspected live screenshots cover narrow and desktop widths,
active work, question, approval, completed, partial, failed, stopped and disconnected
states. Check alignment, wrapping, focus, keyboard controls, composer usability and
history scrolling. The reference-image redraw scenario must preserve old content on
failure and retain request context for recovery. Report model/tool execution separately
from fixture evidence and visual fidelity separately from successful mutation.

Run App/server tests, typecheck/build, naming/lint, affected Inspector contracts,
generated template parity and clean-consumer gates. Applicable guarded canonical
full-flow gates remain required for affected mutation owners. CI on the delivered
PR head must pass; automated assertions alone do not close visual acceptance.

## Tool activity transport

The same action-batch POST may negotiate newline-delimited response framing with
Accept: application/x-ndjson, application/json. The server emits only registered
tool name/status activity, sequential prepared batches with correlated acknowledgements, then one final batch or sanitized error. JSON
responses remain accepted. This is framing of the same prepared batch, not another
provider route or action format. Only complete prepared batches enter execution; incomplete model output never does.
The optional provider progress callback is observational, bounded and retired when
the request settles or aborts. It contains no model thoughts or tool payloads.

## Multi-step execution and capability limits

AI may analyze tool summaries, choose a registered backend operation, observe its
actual canonical execution result, and continue within the same request. The
backend prepares all action arguments; the AI never reconstructs bulk geometry.
Each batch retains ordinary resolution and permission checks. Tool artifacts are
request-owned and cannot be used by another request. Execution receipts contain
bounded results and refreshed App context, never complete document geometry.

One invocation owns one transaction and the existing document interaction lock.
The lock blocks document edits while allowing Agent panel open/close, approval,
Stop, scrolling and draft typing. Agent DOM events remain isolated from canvas
shortcuts and mutation controls.
Normal settlement commits all completed batches into one Undo entry. Capability
limits are normal settlement: explain the unsupported remainder and whether any
changes were made, with no Try again. A limitation of one tool requires checking
other registered operations before declaring App capability unavailable. Never
invent a tool or silently claim an incomplete request is complete. Fatal errors,
cancellation and transport loss roll back the invocation and release its lock.
Questions before drawing remain non-mutating clarification; a new user request
never silently joins an already settled transaction.
