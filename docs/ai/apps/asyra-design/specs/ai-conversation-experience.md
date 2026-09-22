# AI conversation experience

## Product contract

User messages and attachments appear immediately on the right and retain their
identity and position across active and settled work. Assistant output appears on
the left. The App conversation controller owns request lifecycle, answered questions,
continuation and recovery; the panel is a projection. One active request is admitted.
A resolved provider attempt may ask a question rather than complete the user goal.

Each message displays only attachments submitted with that message. Answer and
retry requests retain the original reference as request context without presenting
it as a newly attached image. No Edit request action or automatic draft restoration
is offered. Panel text supports native mouse selection and copying. Composer keyboard events stay in the text
input, preserving native editing and IME without invoking canvas shortcuts.

Questions expose clickable choices and a text answer path, preserve subject,
dimensions, attachments and target context, and record the selected answer. Waiting
for an answer or approval has no active-work spinner. Approval is governed by the
existing runtime policy, with a concrete change summary and an explicit decision.

Execution activity uses each action’s short English visible-change summary (for example, “Smoothing the outlines” or “Reshaping the tail”), emitted when that action starts. Missing or unsuitable summaries use the registered action label; never display “Applying changes” or invent a specific edit.

Current activity is derived from real execution phases, with one concise visible
status and collapsed details. One App-owned activity projection produces the
ordered entries and the current entry shared by the headline and Activity list.
Consecutive entries with identical visible labels and messages appear once;
distinct messages and repeated activities separated by another activity remain.
The projection leaves runtime events intact. Expanding or collapsing Activity
rechecks the actual scroll extent: Jump to latest appears only while content
remains below the viewport, without requiring a subsequent scroll event.
New activity follows the latest entry when the feed previously fit without
scrolling or the reader was at the bottom (within one pixel for rounding).
A reader who scrolls upward keeps their position during incoming updates;
returning to the bottom or choosing Jump to latest resumes following.
Following is applied before paint so layout-induced scroll events cannot
reinterpret newly added content as a reader scrolling away.
The last list entry represents the current activity, including real approval/stop
states, without a visible Current badge or separate highlight. Accessibility
metadata identifies that entry while work is active. Tool events use user-facing descriptions of the work, without tool names or
AI-wait terminology. Completed tool work transitions to Reviewing the results;
it does not imply that the whole request has finished. Model-authored operational messages stay attached to their
corresponding event. Settlement clears the active accessibility metadata and labels the final
summary as Result (questions remain questions). A 12 by 12 pixel bell appears beside the duration after every terminal outcome.
It rocks left, right, left, right, then returns upright over one second and remains visible.
Reduced-motion preferences suppress the animation. The icon conveys that work
has ended; the existing result explains success, partial completion or failure.
Questions awaiting an answer do not show the bell. Its accessible label is
Request finished. Conversation panel text, including Activity, duration, choices,
composer and connection status, uses 12px type. Duration starts at 0s without a minimum-duration floor and shows only formatted time
with an accessible Elapsed time label; no large completion banner is displayed. No synthetic reasoning or timed
percentage is allowed.
Private model reasoning is never displayed. Explicit operational messages from registered backend operations may be displayed. App-owned text
is English; user text and model-authored content retain their language.

Completion describes actual results and does not certify visual fidelity. Failure
identifies a sanitized cause and canvas disposition, retains the request and image,
and offers safe retry when eligible. Partial-result messages do not append a generic
reminder that earlier changes are kept or that Undo is available. Retry is admitted only for confirmed pre-write
failure or cancellation; partial/unknown outcomes require review. An explicit image
tracing request uses registered VTracer or fails honestly, never a fabricated trace.
Replacement prepares new content before changing old content and executes in one
canonical transaction; ordinary failure retains applied progress; cancellation rolls back. Target ambiguity
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
invent a tool or silently claim an incomplete request is complete. Ordinary executor/provider failures stop further work and commit applied progress in the same Undo entry. The partial result names the failed activity, never offers blind replay, and does not claim every operation completed. There is no per-action savepoint: writes made before an executor throws are also retained. Explicit cancellation still rolls back; transaction settlement failures report unknown state rather than claiming retained progress. All terminal paths release the interaction lock.
Questions before drawing remain non-mutating clarification; a new user request
never silently joins an already settled transaction.

### Canvas keyboard handoff

Opening the Agent with its keyboard shortcut must not leave held modifiers in
the input system after composer autofocus. Clicking the canvas while the Agent
is idle restores drawing shortcuts without closing the panel or discarding the
draft. Composer typing and IME editing stay isolated from canvas actions; the
active Agent document interaction lock remains authoritative.

### Local provider usage observability

The local provider owns one bounded usage accumulator per invocation and emits
one structured `ai_request_usage` server log at settlement. It consumes provider
cumulative totals without summing repeated notifications. Correlation identifiers
connect attempts and clarification turns; no prompt, attachment, account or tool
payload enters this record. Cancellation and failure retain partial observations;
missing usage remains unavailable. Usage diagnostics cannot change action
execution, cancellation, final batches, or the conversation UI. The App development
guide defines the record fields and aggregation rules.

## General design research

The provider may use native cached web search for concepts, style, public facts
and visual references; attachments are not required and Wikimedia lookup is only
an optional asset source. Native web-search events produce safe research activity,
never raw queries or page bodies in the UI. Local shell, filesystem tools, account
credentials and third-party integrations remain unavailable. Research data cannot
override App instructions or canonical permissions. Download/import remains a
separate bounded backend operation; a search result alone is not an image receipt.

Reference import accepts a same-request candidate ID or a public HTTPS raster URL
plus source URL found through native research. Direct downloads resolve public
IPv4 addresses once per hop and pin connections; each redirect is revalidated.
Private/reserved hosts, credentials, nonstandard ports, unsupported MIME/signatures,
oversized streams and decoding limits are rejected. Imported images are normalized
to bounded PNG previews and appended only to request-local image-tool inputs; they
are not silently added to user message attachments. Preserve source metadata in the
receipt. No paid search service or subscription call is required for backend tests.


### General design target continuity

Follow-up target hints retain current non-workspace objects, including frames,
rectangles and native text, not just traced vector/oval roles. Revalidate each
distinct referenced ID once per submission against current canonical existence;
discard deleted and workspace IDs. The hints do not grant an editing capability
or override current selection/permissions. No cross-request existence cache.


### Conversation navigation

New conversation starts an empty document-scoped conversation without changing
the canvas; selecting history restores its settled messages and target hints.
IDs and turn counters remain owned by each conversation. Navigation is disabled
while any turn is active. An already empty conversation is reused. History is kept
only for the current document runtime and cleared on disposal. A separate stable
navigation subscription projects identity, short title and busy state; progress
updates must not rebuild or notify unchanged navigation. Composer drafts and
attachments are preserved per conversation by presentation, never sent on switch.
