# Plan: AI Conversation Ownership Repair

## Status and scope

Implementation authorized on 2026-11-17 after the corrected design review. Execute
T1-T8 in owner/dependency order with permanent red/green regressions and integrated
preservation gates. Remote operations and publication are not authorized.
The reviewed source is `b60cec0abdd9c3b12e5c912fd76a1f7fbf8b8e6e`.
Planning branch: `codex/ai-conversation-repair-plan-20261117`.

This is the bounded repair follow-up to
[AI Conversation Experience](ai-conversation-experience-plan.md), within
[Editable Design Agent](ai-design-agent-plan.md). The coordinating owner of this
plan owns its final integration and closeout; this plan does not close either
parent or inherit their historical implementation/push authorization.

The product authority is
[AI conversation experience](../specs/ai-conversation-experience.md#conversation-state-and-handoff-repair).
The exact repair architecture, task dependencies and pending acceptance are in
[the Flow document](ai-conversation-ownership-repair/ai-conversation-ownership-repair.flow.json).
It refines the existing conversation-lifecycle owner; the existing
request-backend-action-batch, resolve-server-prepared-action-batch and canonical
mutation owners remain authoritative outside this repair. No historical passing
test result is imported as acceptance of the new work.

Objective: preserve authored conversation information and drafts across their
correct lifetimes, interpret multi-batch outcomes once, and project truthful,
incrementally updated UI through existing Asyra mechanisms.

The six functional defects and two lower-priority issues below are all planned.
The lower-priority stages follow functional repairs; full-plan completion cannot
silently omit them. There is no claim that the measured repeated work already
violates a user-perceived latency budget.

Authorized writes are the App development task boundaries below,
this plan and Flow, and their narrow product/index/parent references. The user
authorized implementation after design review; remote publication remains excluded.

## Confirmed findings and evidence limits

| Finding | Observed failure at the reviewed source                                                                                                                                                                 | Repair task |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| F1      | After answers `240 by 240` and `Blue`, the third provider input retains `Blue` and the original poster request, but not the earlier dimension answer or preceding question.                             | T2          |
| F2      | Actual runtime plus controller, with controlled actions, returns both read_design_context and request_clarification; projectAiQuestion returns null and the summary says no canvas changes were needed. | T1          |
| F3      | Unmounting and remounting the actual panel with the same controller changes an unsent draft to an empty string.                                                                                         | T3          |
| F4      | A FileReader started in conversation A completes after navigation and attaches A's image to B's draft.                                                                                                  | T4          |
| F5      | A completed advice reply is replaced entirely by generic drawing/storage text when persistence is local-only or unavailable.                                                                            | T5          |
| F6      | retry passes the original message attachments back as new submitted attachments; the new message repeats the original image.                                                                            | T2          |
| F7      | The actual runtime's pre-execution cancelled result has no stage; the App retry predicate requires stage and returns false. This is conservative denial, not unsafe replay.                             | T6          |
| F8      | With 100 settled turns, one progress update caused 202 activity projections in the reviewed React diagnostic. The panel also searches the timeline for every turn.                                      | T7          |

Source anchors at the reviewed baseline (paths remain the implementation evidence;
probe observations above must be replaced by permanent failing tests):

- F1/F6: [conversation controller](../../../../../apps/asyra-design/src/ai/conversation.ts),
  request metadata assembly and retry submission.
- F2/F5/F7: [result presentation](../../../../../apps/asyra-design/src/ai/presentation.ts),
  projectAiQuestion, summarizeAiTurn and canRetryAiTurn; compare
  [runtime cancellation](../../../../../packages/ai-agent-runtime/src/runtime.ts).
- F3/F4/F8: [panel](../../../../../apps/asyra-design/src/app/ai-conversation-panel.tsx),
  component-local drafts, asynchronous image completion and timeline projection;
  [App](../../../../../apps/asyra-design/src/app/index.tsx) conditionally unmounts it.
- Existing lifecycle composition: [initApp](../../../../../apps/asyra-design/src/init/init-app.ts).

These were read-only source/controlled-execution diagnostics, not new permanent
regressions. The first step of each repair is to reproduce its failure in the
formal files named below. Do not treat 202 as a portable timing threshold or
require reproducing that exact incidental render count.

The prior review ran the App suites (2,748 passing test executions, with repeats
between commands), runtime suite (414), expanded browser suite (63), and three
explicit item-count cases. Two backend tests and two browser cases requiring
retained replay inputs remained skipped. This is baseline context only. It does
not establish real-model quality, complete accessibility acceptance or final
repair correctness.

## Ownership and existing mechanisms

| Owner                               | Authoritative value and lifetime                                                                                                         | Existing mechanism to reuse                                                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App initialization                  | One document-runtime composition; disposed before resources can enter a successor.                                                       | initApp creates the conversation/confirmation/runtime and owns dispose.                                                                                     |
| App conversation controller         | Conversation identity, ordered authored turns, question/answer links, request admission, immutable request context and settled result.   | Existing createAiConversationController, turn IDs, navigation subscription and target revalidation.                                                         |
| App draft owner                     | Text, submitted-image candidates, attachment operations and errors keyed by conversation; lives with the document composition.           | A separately encapsulated App-owned presentation controller composed by initApp; dynamic keyed subscriptions following Starter's item-projection pattern.   |
| App attachment reader               | Pending browser reads tied to a draft generation and operation identity; ends on completion, explicit cancellation or document disposal. | Existing FileReader conversion, extended with explicit operation retirement and abort cleanup; it currently exposes only a Promise. No new storage library. |
| Feature and runtime                 | One admitted invocation, progress, action receipts and authoritative cancellation/transaction result.                                    | invokeFeatureTask/cancelFeatureTask, createAiAgentRuntime and current public result types.                                                                  |
| App transaction adapter and Factory | Finite mutation members, retained progress and one request-owned Undo group.                                                             | Existing createAiTransactionRunner and public Core history-group APIs; unchanged.                                                                           |
| App server/provider                 | Transport validation, prompt interpretation and tool execution within one request.                                                       | Existing same-origin requestActionBatch, NDJSON receipts and ephemeral provider process.                                                                    |
| App presentation projection         | Human-readable answers, separate storage notices, per-turn activity and UI view state; presentation never decides task admission.        | Existing activity reducer; stable per-key snapshots and useSyncExternalStore, as already used by navigation and Starter.                                    |
| React panel                         | DOM refs, focus, selection, IME events and transient hover/drag display.                                                                 | Existing input isolation and focus-return behavior; mounting does not own the data above.                                                                   |

Reference implementations: `apps/starter-app/src/providers/properties.ts`,
`apps/starter-app/src/init/derived-state/init-ui-properties.ts`,
`apps/asyra-design/src/app/ai-conversation-navigation.tsx`, and
`docs/public/start/custom-composition.md#use-starter-as-the-complete-app-reference`.

Use Core's defineUIProperty/getUIProperty/setUIProperty/onUIPropertyChange when a
fixed Core-coordinated UI property is actually needed, registering it before Core
starts. This design does not need one Core property per conversation or turn:
these identities are dynamic and belong to keyed App projections. Do not adopt
the Design useProperty hook's module-global signal map for the new state, add a
second store containing the same authoritative values, or refactor unrelated
property hooks. Reuse the ownership/subscription pattern, not Starter's entire
application architecture.

## Lifecycle and handoff decisions

### Document and presentation

initApp creates the draft owner next to the conversation controller and injects
both into presentation. On disposal, retire the draft owner and its read callbacks
before awaiting conversation/runtime shutdown; late reads cannot resurrect state.
Keep existing runtime cancellation and transaction-settlement ordering intact.

Closing the panel only detaches UI subscriptions. Text, completed attachments,
pending reads and their errors survive. Disclosure toggles remain view-local;
retaining them across panel closure is not required by any confirmed finding.
Switching conversations selects another keyed draft. The conversation controller
remains the sole owner of selected identity and the global active-turn lock. Opening a new
conversation keeps the previous draft. Neither operation sends text or changes
the canvas. Document disposal clears all these values; browser reload and
cross-document persistence are not added. Here document lifetime means the existing
initApp runtime instance, not every canonical load, collaboration update or React
mount. Do not add a new document-switch mechanism. An empty New conversation
remains the existing no-op; navigation during execution remains rejected.

Conversation admission has one authoritative transition and explicit accepted/rejected
evidence. The composer submits a captured conversation ID, draft generation and
revision through an App-owned composer action, which validates pending reads and
uses the conversation controller's admission. It must not compare active intent
text or await final settlement to infer acceptance. On acceptance, consume exactly
that captured draft and publish the admitted turn before observers can re-enter;
return its turn identity and settlement Promise. Preserve the existing public
submit settlement behavior for non-composer consumers through the same admission
path, not a second queue, active flag or independent validation implementation.

A stale draft revision, active-turn conflict or invalid question reply rejects
without consuming input. Rejected navigation leaves the selected draft intact.
Text typed after acceptance belongs to the next generation; subsequent settlement
never clears it. A later provider or transport failure is an admitted failed turn,
not draft rejection, and does not automatically restore the consumed draft.

### Attachment operations

Reserve attachment slots in selection order and capture conversation ID, draft
generation and read-operation ID before reading. Ordinary text edits do not
invalidate those slots. Navigation or panel closure does not redirect them.
Completion updates only the original live draft; removal, accepted submission,
explicit cancellation and document disposal retire the relevant operation.

Send is unavailable for a draft with pending reads, and the admission method
enforces the same rule without relying on a disabled button. When no turn is active, navigation may select another ready
draft and submit it. During execution the existing global navigation/send lock
remains in force; this is not concurrent conversation execution. Read errors belong to the originating
draft. Multiple concurrent file selections retain selection order even when reads
finish in reverse order. No read completion may append to an admitted message.

### Authored conversation and provider input

The controller owns a typed semantic turn state independent of display strings
and of canvas disposition. Keep question/answer linkage in that state; the
controller must not call a presentation projector to decide whether a reply is
valid. The settlement adapter examines the authoritative complete invocation
result, including streamed receipts, once. A valid terminal clarification after
reads is awaiting-answer, even though the provider attempt has completed.

Keep the existing general question and drawing-detail action schemas. Validate
their registered result shapes. A failed/cancelled invocation never becomes an
answerable question because an earlier receipt contained one. Contradictory or malformed terminal
receipts produce a separate conversation-protocol diagnostic and no answer
admission. Never rewrite a successful runtime result or its canonical disposition
into a fabricated runtime failure, or select an arbitrary first/last question. A valid terminal
question after earlier committed work retains that work and its existing Undo
boundary; answering starts a new invocation, never reopens a sealed group.

Build one immutable provider-context snapshot at admission. Include ordered public
user messages, public questions and answers, authored terminal replies and their
correlations for the selected conversation. Do not include activity history,
private reasoning, raw tool payloads or complete document geometry. Preserve
authored wording and order; no heuristic extraction of dimensions, colors or
permissions, and no additional summarization model request.

Use one App-owned `metadata.conversationContext` contract for this information.
Remove the superseded authored `metadata.replyTo.intent` fragment across producer,
prompt and tests. Retain `metadata.replyTo.turnId` as the current shared profiler's
correlation contract (`packages/ai-agent-runtime/src/profiler/recorder.ts`); it
contains no alternate authored context and is not a compatibility fallback. Existing UI replyToTurnId/retryOfTurnId relationships
remain correlations, not alternate provider context. Wire messages identify their
turn/role, text, reply/retry relation, known execution disposition and only
currently available attachment indexes. Failed or cancelled historical attempts
are not represented as successful work or as instructions to replay. Retry links back to its
original request rather than adding a second semantic instruction to execute it.

Keep public text history separate from the current request's executable image set.
Preserve the existing attachment-selection contract: explicitly submitted images
replace inherited request images; an answer without new images inherits its
question's request images; retry inherits the failed request's exact ordered image
set; a new independent request without images sends no historical image bytes.
Historical messages retain their source attachment descriptors. Mark images absent
from the current request as unavailable, never as a usable attachment index.
Within the selected set, retain source identity and stable ordered indexes rather
than deduplicating identical bytes from intentionally distinct image slots.

Do not union all historical images. Existing local-image tools, native image input,
retained-reference evidence and sample-image recognition consume request indexes.
Their input must remain identical for equivalent requests. Tests compare bytes,
order and indexes at these actual consumer boundaries, including image replacement
on a clarification answer and a later independent text-only request. Historical
image retrieval is not a capability introduced by this repair.

The existing transport owner remains responsible for the full-envelope byte limit
after canonical context and action definitions have been added. Do not duplicate
its serializer or limit in the composer. Overflow fails at server ingress before model
execution with explicit feedback on the admitted failed turn; it cannot silently
truncate context. Preserve history and offer the existing New conversation path
for a fresh bounded request. No persistent model session, transcript database or
new browser persistence is introduced.

Treat historical text as quoted public conversation data, with explicit role and
turn identity; only the current request is an instruction to execute. Preserve
question/answer and retry lineage, including detailOption's canonical requestIntent.
An earlier permission answer is evidence for its original scope, not blanket
authorization for later external actions. Existing permission/confirmation owners
remain authoritative. No progress logs, runtime credentials or private reasoning
are imported; this is not a promise to redact secrets a user deliberately types.

Retry reuses the failed request's immutable authored context and image references,
while obtaining fresh canonical context and revalidated target hints through the
existing owners. It appends a user retry turn with no newly submitted attachments.
Once a newer turn exists, the old request cannot be retried. Message attachment
identity and provider image availability are verified independently.

### Result and recovery

Keep authored answer, task disposition and persistence observation as separate
fields in the App result projection. Presentation displays the answer and, when
applicable, an additional accurate storage notice. It never substitutes a generic
drawing sentence for advice, or describes nonexistent writes as retained changes.
Derive effect/disposition from existing authoritative runtime receipts and transaction
evidence, reusing the registered action contracts where needed. Do not maintain a
second list of read/write tool names or infer effects from the authored answer.
The existing confirmPersistence call and backend durability owner remain unchanged.

Move retry admission into App conversation policy, shared by the UI and controller.
Use the actual discriminated runtime result contract. A valid runtime cancellation
before execution has no transaction and an empty audit; cover that producer path
in a permanent runtime test. The Feature's explicit abort-before-run result is
separately known. Malformed/uncorrelated values, partial/committed/unknown outcomes,
and cancellation after execution remain denied. Do not infer safety from wording,
missing stage alone, an absent error, or a timeout. Preserve existing safe-failure
admission without widening it. If current public results cannot distinguish a
required case safely, stop T6 and design the smallest shared-runtime contract
change before editing that owner; no speculative public API extension is planned.

### Subscription and computation

Separate subscriptions for conversation navigation, ordered turn identities,
individual turn projections, active request controls, and keyed draft state.
Reuse stable snapshots until their actual inputs change. Append progress only to
the active turn's existing activity projection. Store the answer relation once
at admission rather than searching the whole timeline on each render.

Already settled turns retain their finalized semantic/presentation values; updates
to an unrelated active turn do not rescan their results or activity. A question's
answer updates that question and the new answer turn; retry of a failed answer
retains the original question lineage rather than creating a second answer. Draft typing does not notify
the history list. Expanding one disclosure updates only its local view. A disclosure override must
not overwrite the shared semantic snapshot used by another consumer. Selection,
scroll-follow, IME and status accessibility must remain correct. This removes
unnecessary work; it does not authorize a new cache, React.memo, props-comparison
wrappers, transcript virtualization or a redesigned activity state machine.

## Execution tasks and permanent regression contracts

All future bug fixes are test-first: run the existing formal tests, add the
missing assertion in the named test owner, record its failure on the unfixed
behavior, then implement at the first incorrect owner. Do not keep diagnosis-only
test files or consider the earlier in-memory probes sufficient red evidence.

### T0 - Review and admit the design

Owner: this plan's coordinating owner. Boundary: the five planning files only.
Check the product contract, exact Flow routes/artifacts, current public APIs,
failure paths and all eight findings together. Keep all implementation criteria
pending. Structural Flow validation is not product or user acceptance.

Acceptance: the plan and Flow agree on owners and task dependencies; no unresolved
design contradiction is delegated to a UI patch; user has a reviewable design.
Implementation was subsequently authorized by the user.

### T1 - Normalize semantic settlement

Owner: App conversation controller's result-admission boundary. Flow: `settlement`.
Depends on T0. Scope: `src/ai/conversation.ts`, an internal semantic-result helper
if needed, direct presentation consumers, and their tests. Runtime is an input,
not a mutation target for this task.

Formal regressions in `src/ai/__tests__/conversation.test.ts`,
`presentation.test.ts`, `runtime-integration.test.ts`, and
`src/app/__tests__/ai-conversation-panel.test.tsx`:

- F2: real runtime executes one or several read batches then a terminal general
  question or detail-choice action; the controller waits and the panel shows it.
- Answers correlate with that exact question. Stale answers, duplicate active
  submissions and late progress cannot reopen or answer a settled task.
- Prior committed members plus a terminal question preserve the real disposition;
  answering creates a separate invocation and Undo boundary.
- Failed/cancelled results containing earlier question receipts do not expose
  answer controls. Conflicting terminal receipts expose a conversation diagnostic
  while retaining the actual runtime result and transaction disposition.

Acceptance: no `actionResults.length === 1` lifecycle assumption, no dependency
from admission to display projection, no synthetic Finished or terminal timestamp in the visible reply
while waiting (retain factual invocation completion time for diagnostics), and exactly one semantic interpretation shared by all consumers.

### T2 - Preserve continuation and retry context

Owner: App conversation request-context materializer. Flow: `continuation`.
Depends on T1. Scope: conversation/internal context helpers, direct wire contract
and provider consumers, `server/ai-domain-prompt.ts`, and direct tests. Preserve
the current endpoint, tool catalog and provider process isolation.

Formal regressions in conversation/presentation tests,
`server/__tests__/ai-domain-prompt.test.ts`, `local-ai-provider.test.ts`,
`ai-model-provider.test.ts`, `action-batch.test.ts`, and
`e2e/ai-conversation-flow.spec.ts`:

- F1: poster -> size question -> 240 by 240 -> color question -> Blue. Assert
  the third serialized provider input includes both questions/answers in order.
- Continue after a completed advice reply using a referenced prior option. Keep
  the authored option context without requiring a persistent provider thread.
- Three or more clarification rounds, revised user constraints, click/text
  answers, empty history, and navigation away/back preserve correct correlations.
- F6: fail before writes with an image, retry, fail again, retry again; original
  image appears on one message, every request receives the correct bytes, and
  no new drawing action is implied by repeated semantic request text.
- Other conversations never contribute text/images. Deleted target IDs are
  revalidated. Oversized final envelopes fail at the existing transport boundary before
  model execution at server ingress, instead of truncation; the admitted failed turn remains visible.
- No imported raw progress, tool results, private reasoning or runtime credentials
  in transcript; authored text is data, not an instruction replay.

Acceptance: public request content is sufficient for deterministic continuation;
one current provider-context contract; stable message identity and attachments;
no prompt-only compensation or hidden full-conversation lookup by provider ID.

### T3 - Own drafts for the document lifetime

Owner: App draft/presentation controller composed by initApp. Flow: `drafts`.
Depends on T2, whose single admission path is extended for composer handoff. Scope:
`src/init/init-app.ts`, App composition, an encapsulated draft owner in `src/ai`,
panel/providers and direct tests. No Core or UIContext package changes.

Formal regressions in `src/app/__tests__/App.test.tsx`,
`ai-conversation-panel.test.tsx`, `src/init/__tests__/init-app.test.ts`, and
`e2e/ai-conversation-navigation.spec.ts`:

- F3: close and reopen the actual App panel; retain exact text, attachments,
  attachment errors and per-conversation drafts, including a draft typed during
  active work. Use the real App toggle, not only a never-unmounted fixture.
- A/B/new/empty conversation navigation retains each draft without requests or
  canvas writes. Preserve legitimate navigation/list notifications and the empty
  New no-op; draft-only edits must not notify unrelated history consumers.
- Accepted send clears only its captured generation; rejected admission retains
  it with feedback; text typed afterward survives prior request settlement.
- StrictMode remount and document disposal release subscriptions exactly once;
  a fresh initialization has no predecessor drafts or late updates.

Acceptance: no authoritative draft map in the panel, no keep-mounted workaround,
no global singleton, no browser persistence, no draft writes to canonical state.

### T4 - Bind attachment reads to their originating draft

Owner: App attachment adapter under the draft owner. Flow: `attachments`.
Depends on T3. Scope: draft owner, current readImageAttachment adapter, composer
admission/feedback and direct tests. Transport/image conversion owners stay intact.

Formal regressions in panel/controller tests and navigation/flow E2E:

- F4: hold A's reader, switch to B, complete A: only A receives the image.
  Return to A and verify identity, order and readiness.
- Close/reopen while reading; complete while hidden; preserve the original draft.
- Two reads completing in reverse order, repeated selection, read failure and
  unsupported media retain correct ordering and draft-local feedback.
- Send while reading is rejected both through UI and owner API. B's independent
  ready draft is not blocked by A's pending read when no request is active.
- Removal/cancellation/disposal retires callbacks. Late success/error after
  retirement cannot mutate another draft, clear new text or publish a message.

Acceptance: no callback consults the currently displayed conversation as its
write destination; pending reads are tracked and cleaned by their actual owner.

### T5 - Separate authored answers and storage notices

Owner: App semantic-result presentation. Flow: `presentation`. Depends on T1.
Scope: result projection, panel and their direct tests; report_outcome's persistence
producer is a preserved input, not a reason to redesign storage.

Formal regressions in `src/ai/__tests__/presentation.test.ts`,
`actions.test.ts`, panel tests and conversation-flow E2E:

- F5: the same authored advice and drawing reply remain verbatim under durable,
  local-only and unavailable persistence; relevant notices are additional content.
- Pure advice never claims it drew or retained edits. Real partial/failed/unknown
  outcomes retain their exact disposition and never append success.
- Awaiting answers has no terminal timestamp. Terminal responses preserve local
  completion time, readable wrapping and follow-latest behavior at 360/1280 px.
- Persistence warning plus answer remains accessible; source language is retained.

Acceptance: no generic storage branch replaces authored result text, no UI
inference of rollback/durability, and no change to saving or Undo semantics.

### T6 - Connect conservative pre-execution cancellation recovery

Owner: App recovery policy consuming the runtime result. Flow: `recovery`.
Depends on T1/T2; lower priority after T5. Scope: conversation admission policy,
projection consumers, Feature/runtime boundary tests. No shared runtime behavior
change unless a separately reviewed, necessary contract gap is proved.

Formal regressions in conversation/presentation/runtime-integration tests,
`src/features/ai-agent/__tests__/index.test.ts`, and
`packages/ai-agent-runtime/src/__tests__/runtime-lifecycle.test.ts`:

- F7: actual runtime cancellation before context/provider execution exposes the
  documented no-execution evidence and permits explicit retry with original context.
- Abort-before-run Feature result is tested separately; cancellation racing
  admission has one owner and cannot submit twice.
- Started execution, committed/partial/rolled-back/unknown transactions, malformed
  result shapes, wrong conversation IDs and non-latest turns remain non-retryable
  for the cancellation path. Preserve existing safe failure retry cases.
- A cancelled receipt with missing stage is not automatically considered safe.
  No retry is automatic and no completed mutation is replayed.

Acceptance: eligible cancellation is recoverable without weakening conservative
admission. Shared runtime changes, if necessary, require a revised owner segment,
public contract/Changeset and direct-consumer gates before proceeding.

### T7 - Bound projection work to actual updates

Owner: App per-turn/draft projection and React subscriptions. Flow: `observation`.
Depends on T1-T6. Lower priority; no cache or latency claim by default. Scope:
conversation and activity projection adapters, panel composition/providers,
navigation and direct tests. No unrelated UI hook migration.

Formal work-count regressions in conversation/panel tests, plus streaming E2E:

- F8: 0/10/100 settled turns with repeated active progress. Count actual settled
  result normalization and activity-entry construction: zero additional work for
  unchanged settled turns per update. History-dependent projection work is independent of old-turn count; do not
  assert constant cost for the active turn's own growing progress history.
- Draft keystrokes do not notify history/navigation; repeated getSnapshot calls
  are referentially stable until owned inputs change. Two consumers share results.
- Answer admission updates only the question relation and new turn. Switching,
  settlement, disclosure toggles and disposal invalidate exactly their inputs. Test two consumers with different
  disclosure states; presentation overrides cannot mutate shared semantic state.
- Formal DOM/behavior checks retain native text selection, stable prior activity
  rows, expanded state, IME, scroll position and Jump to latest behavior.

Acceptance: correctness and work counts pass together; no React.memo/deep equality,
timed throttling that drops required progress, or general caching layer. If material
latency remains after removing redundant work, measure it and replan within scope
before choosing a cache or changing the rendering architecture.

### T8 - Verify the integrated conversation

Owner: plan coordinator. Flow: `verification`. Depends on T1-T7. No additional
feature scope. Run all new cases on the same frozen source and the preserved
behavior suites. Inspect browser screenshots; test success alone is not visual
acceptance. Record exact source, commands, skipped inputs and evidence paths.

The integrated acceptance journey is: create A with a reference; answer two
questions after read-only inspection; keep a next draft while work runs; close and
reopen; obtain an answer with a storage notice; start B while A reads another
attachment; return to A; fail before execution and retry without a new image
message; cancel before execution and retry; stop after an actual mutation and
verify retained progress, no replay, and one Undo/Redo. Repeat key UI transitions
at 360/1280 px. Also exercise a standalone advice-only conversation.

Run this journey with a deterministic provider but real controller, Feature,
runtime, canonical mutation and persistence adapters. Separately perform a bounded
real configured-provider smoke for multi-question continuation and advice if that
environment is available; distinguish it from deterministic evidence and do not
claim general model fidelity. Missing live access is reported, not fabricated.

Acceptance: all eight findings have permanent regressions; the whole journey and
preserved behavior pass; no duplicate semantic owner or lifecycle leak remains
inside the frozen scope. Do not call the full plan complete if T6/T7 are deferred.

## Plan review corrections and preservation cases - 2026-11-17

The source baseline is unchanged. This review traced the controller, initApp,
panel, Feature/runtime cancellation producer, activity reducer, provider wire
input, image tools, prompt and existing formal tests. Only this plan, its product
clarification and Flow are corrected; implementation remains pending.

1. **Historical image union was a regression.**
   `conversation.test.ts` already asserts that an independent new circle request
   has no imageAttachments after an image/question/retry chain. The original plan
   contradicted that case. Preserve request-image selection, replacement and
   indexes; test the actual local-image and native provider consumers.
2. **Admission lacked an explicit handoff.** The current async submit publishes
   active state before awaiting execution; the panel compares intent strings.
   Require one admission result and atomic draft consumption, with stale revision,
   synchronous subscriber re-entry, active conflict and subsequent typing tests.
3. **The full envelope cannot be validated at composer admission.** Runtime adds
   context/actions later. Reuse the transport serializer/bound and distinguish
   rejected drafts from admitted provider failures; test the final request body.
4. **Lifecycle preservation was broader than the defect.** Remove mandatory
   disclosure persistence. Keep current empty-New and global execution locks.
   FileReader abort/retirement is a necessary extension, not an existing feature.
5. **Semantic diagnostics must not rewrite execution truth.** Distinguish invalid
   question admission from actual transaction/result outcome; tests assert both
   simultaneously, including committed work followed by a question or malformed
   receipt. Do not add another transaction or action-effect registry.
6. **Recovery and projection tests need real producer evidence.** Cancellation
   audit actions are empty by construction; they are not sufficient proof alone.
   Validate trusted result provenance and the executionStarted-to-transaction
   contract using real runtime cases before/after a read action and mutation, plus
   Feature abort-before-run. Count actual reducer/result-entry work, not just
   getActivity wrapper calls. Existing incremental activity append remains intact.
7. **Conversation replay needs safety and lineage preservation.** Test failed
   answers followed by retry, detail-choice requestIntent, quoted old requests and
   scoped permission answers. No stale turn may become a new execution command or
   a new security approval.

Formal regression design must cover these concrete paths in addition to T1-T8:

| Scenario                                                                                 | Observable owner-boundary oracle                                                                                                                                             | Formal home                                                                                             |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Original image -> question -> new image -> answer retry -> independent text request      | Exact per-request image bytes/order and native/tool indexes; original image is not silently reintroduced; independent request has no images.                                 | conversation.test.ts, local-ai-provider.test.ts, local-image-tools.test.ts, action-batch.test.ts        |
| Two questions -> failed answer -> retry -> detail choice                                 | Ordered serialized text, one original question relation, canonical requestIntent, no duplicated semantic instruction or new image message.                                   | conversation.test.ts, ai-domain-prompt.test.ts, runtime-integration.test.ts                             |
| Pending A reader -> navigate B -> B runs -> A completes -> return A                      | Existing execution/navigation lock is preserved; completion changes only A; no canvas/history writes from draft operations.                                                  | panel, init-app and navigation E2E tests                                                                |
| Send observer edits new draft; rejected send; empty New; same-intent successive requests | Accepted generation consumed once before notification; new text survives; rejection retains original; one Feature invocation; empty New remains no-op.                       | conversation, panel and App tests                                                                       |
| Awaiting confirmation -> close/reopen -> confirm or cancel                               | Broker remains sole pending-confirmation owner, no implicit approval/cancellation, active UI and final result restored, no duplicate request.                                | Feature/runtime integration, panel and conversation-flow E2E                                            |
| Stop after read versus stop after committed mutation; repeat dispose                     | Trusted producer proves recovery eligibility; neither post-execution path replays; committed work retained with one Undo/Redo; late reads/progress cannot reach successor.   | runtime-lifecycle, runtime-integration, init-app and conversation-flow E2E                              |
| Advice/drawing result with durable/local-only/unavailable storage                        | Authored text survives; actual disposition and saving behavior unchanged; notice does not invent writes; real report_outcome producer included.                              | actions, presentation and panel tests                                                                   |
| 100 settled turns, active progress, two readers with distinct disclosure state           | Zero unchanged-history reducer/entry reconstruction; active progress remains correct; reader-local state does not contaminate the other consumer.                            | activity projection cases in presentation.test.ts, conversation and panel tests                         |
| Final wire overflow and text referring to historical permission                          | Server ingress rejects overflow before model/action execution; explicit failed turn and usable New path; historical consent does not bypass present permission/confirmation. | server/action-batch, server-action-batch-provider, ai-domain-prompt, Feature/runtime and provider tests |

Use the real owner under test and controlled dependencies, not a mocked replacement
for admission, settlement, projection or transport. Each F1-F8 primary regression
must fail on the unfixed source for its observed reason. Preservation cases may
already pass and must remain green; do not require every negative case to fail
first or modify runtime solely to manufacture a red test. An assertion of metadata
field existence, a panel screenshot alone, a mocked summary or a getActivity call
count alone does not establish root-cause coverage.

No claim of zero behavioral risk follows from this document review. If these
whole-flow cases reveal a necessary change to canonical mutation, confirmation,
provider tools, transaction or durability semantics, stop the affected repair and
re-evaluate the complete input-to-settlement-to-Undo/reload scenario before changing
its design or implementation boundary. Do not silently relax preservation tests.

## Gates and stop conditions

For this documentation-only stage: naming baseline, Flow schema/reference
admission, `node --test scripts/__tests__/plan-flow-documents.test.mjs`, local-link
and bounded semantic review, and `git diff --check`. No product tests are presented
as validation of a not-yet-implemented repair.

Future execution runs the focused red/green files for each task, then at completed
owner milestones and final integration:

```sh
yarn lint:naming
yarn workspace @asyra/asyra-design test
yarn workspace @asyra/ai-agent-runtime test:local
yarn workspace @asyra/asyra-design typecheck
yarn workspace @asyra/asyra-design react:build
yarn lint:asyra-design
```

Development acceptance covers the canonical App and its direct framework consumers.
Template generation, clean-consumer installation, packaging and release gates belong
to the separate release workflow. They are not completion gates for this repair.
Do not expand into release-tool fixes or request release-scope decisions while
closing this development task. New formal test files, if needed, must be included
by the App's explicit test scripts.

Final browser scope: `ai-conversation-flow`, `ai-conversation-navigation`,
`ai-composer-layout`, `ai-tool-library`, `conversational-ai`, `local-ai-provider`,
`ai-inspection-evidence`, `drawing-inspection` and `design-containers` specs, one
worker and fail-fast. Preserve actual cancellation, finite mutation groups,
canonical target invalidation, input isolation and collaboration/durable reload.
Run the existing 16/320/1280 owner profiling cases once at the integration
checkpoint, with their documented opt-in. The canonical 7,076 gate is required if
implementation touches mutation/progress-delivery owners or makes drawing-throughput
claims; it is not substituted by the chat-history work-count test. Retained replay
cases need their actual project-local inputs; report unavailable input explicitly.

Do not add dependencies, rewrite renderer/geometry/Factory/collaboration, redesign
the backend tool catalog, add arbitrary question-choice schemas, change subscription
credentials, add persistent conversation storage, or broaden to other Apps.
Preserve the current registered permission and security boundaries. No regex-based
intent memory, UI-only hidden attachment patch, forced keep-mounted panel, or
invented result fallback is an acceptable repair.

Stop the affected task if the formal failure cannot be reproduced, runtime safety
evidence is insufficient, a required public contract is missing, or the first
incorrect owner is outside its allowlist. Revise the bounded design before coding;
do not use discoveries to silently expand scope. Stop after the bounded implementation
and integrated verification. Remote operations and publication remain separate.

## Execution evidence

T0: corrected owner design reviewed and implementation authorized by the user.
T1: three formal conversation regressions failed on the unchanged implementation
(`.ai-repair-t1-red.log`); 139 focused controller/presentation/panel tests pass
(`.ai-repair-t1-green.log`). Eight real-runtime integration tests, including read
then clarification through executeBatch, pass (`.ai-repair-t1-runtime.log`).
Question admission now belongs to conversation-result; canonical outcome is unchanged.
The final owner and integration results are recorded below.

T5 preservation refinement: the existing actions test uses the authored text
"Drawing saved successfully." with unavailable/local-only persistence. Preserve it
as authored content, but put the authoritative storage notice before the answer
and retain the actual partial/no-change outcome. The test now asserts these three
independent values instead of requiring authored text replacement. No regex-based
claim rewriting or changes to confirmPersistence are introduced.

T2 integrated preservation correction: the full App suite exposed the shared
profiler's replyTo.turnId consumer via the existing cumulative-usage test. The
App retains that pure correlation contract while conversationContext alone owns
authored messages. The formal test still asserts correlation and that private
request text is not logged. Shared profiler/runtime code remains unchanged.

## Development verification - 2026-11-17

T1-T7 are implemented and T8 development verification is complete. The user
reaffirmed that release and development are separate workflows. The attempted
release configuration/test edits and generated template changes were reverted;
no release failure blocks this development result. No packages, shared runtime,
Factory, renderer, transaction or collaboration implementations were changed.

| Owner task  | Permanent regression and root-owner correction                                                                                                                                                                   | Evidence                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| T1 / F2     | Real runtime read batches followed by clarification remain answerable; contradictory terminal replies and late cancellation cannot admit a question or rewrite transaction truth.                                | `.ai-repair-t1-red.log`, `.ai-repair-terminal-red.log`, `.ai-repair-lifecycle-red.log`; final App suite |
| T2 / F1, F6 | Ordered public context survives three rounds; retry preserves immutable context, attachment selection and question lineage without adding a new image message. Profiler correlation retains only replyTo.turnId. | `.ai-repair-t2-red.log`; real provider smoke and serialized request assertions                          |
| T3 / F3     | initApp owns keyed drafts; admission consumes one captured generation before notification. Rejection, re-entry, later typing, close/reopen and document disposal retain their correct boundaries.                | `.ai-repair-t3-red.log`; controller/panel tests and navigation E2E                                      |
| T4 / F4     | Actual FileReader operations retain origin, generation and ordered slots. Cancellation/removal/disposal retire callbacks; hidden reads never target another conversation.                                        | `.ai-repair-t4-red.log`; actual-reader and remount regressions                                          |
| T5 / F5     | Authored answers remain intact and authoritative storage notices are displayed separately, before the answer. Persistence and outcome owners remain unchanged.                                                   | `.ai-repair-t5-red.log`; producer, presentation and panel tests                                         |
| T6 / F7     | Shared App admission/UI recovery consumes actual Feature/runtime cancellation evidence. Any transaction or observed action prevents replay.                                                                      | `.ai-repair-t6-red.log`; real-runtime integration and negative-shape tests                              |
| T7 / F8     | Keyed App projections reuse finalized semantic/activity output across consumers. Actual projection work for settled history is unchanged during active updates at 0/10/100 turns.                                | `.ai-repair-t7-red.log`; real projection instrumentation and independent-view tests                     |

Final development gates:

- `yarn workspace @asyra/asyra-design test`: 2,780 passing test executions
  (13 boundary, 640 AI, 1,302 backend, 159 local Node, 666 local Vitest), with
  two existing retained-input backend cases skipped. Some suites overlap.
  Evidence: `.ai-repair-app-final-source.log`.
- Shared runtime: 414 passing tests, no runtime source changes
  (`.ai-repair-full-runtime.log`).
- Nine browser specs: 69 distinct passing cases on the same production source,
  including explicit 16/320/1280 profiling and a real configured-provider smoke;
  two cases require unavailable project-local recorded replay inputs.
  Evidence: `.ai-repair-e2e-final.log` (56 passes before the live language-oracle
  failure), `.ai-repair-live-final.log` (corrected smoke passes), and
  `.ai-repair-inspection-final.log` (12 passes, two skips). The smoke oracle
  accepts English or Traditional Chinese color wording; exact serialized history
  and unchanged canonical document remain separately asserted.
- Frame Undo/Redo additionally passed twice at each width after freezing files
  (`.ai-repair-frame-frozen.log`). Earlier diagnostic failures coincided with
  Vite reloads triggered by test-file edits; the history assertions were unchanged.
- Typecheck and production build pass (`.ai-repair-typecheck-final-source.log`,
  `.ai-repair-build-final-source.log`). Build retains its existing large-chunk warning.
- App lint: zero errors, 28 existing warnings. Naming: 15 passes. Flow document
  tests: two passes. Scoped diff whitespace review passes.
- The server ingress overflow regression passes through the actual HTTP middleware;
  no duplicate client limit was introduced (`.ai-repair-ingress.log`).

Inspected actual browser artifacts under
`apps/asyra-design/test-results/ai-conversation-repair-final`: composer states,
360/1280 complete conversation screenshots, retry feedback and the retained next
draft. The real provider screenshot and public wire context are under
`apps/asyra-design/test-results/ai-conversation-repair-live`. The model retained
240 by 240 and Blue in its final advice, with no canvas changes. This is one
bounded live smoke, not a claim of general model fidelity.

The initial implementation fingerprint is in `.ai-repair-source.log`; the subsequent
re-review below supersedes it with current source-bound acceptance. Development is verified; parent plans, publication and deployment are not
closed or authorized by this result. No push was performed.

## Implementation re-review - 2026-11-17

Scope: the delivered App diff, its direct consumers, permanent regression oracles,
and development gates. Release, packaging, templates and shared release tooling
are explicitly excluded. Review traced initialization/disposal, admission and
Feature handoff, semantic settlement, request context and image indexes, safe retry,
draft/FileReader ownership, projection subscriptions, panel interactions and
storage notices. Existing Feature/runtime, canonical mutation, history, permission,
persistence and collaboration owners remain authoritative and unchanged.

Three additional defects were reproduced in the existing permanent
`src/ai/__tests__/conversation.test.ts` before their owner corrections:

| Finding                            | Root cause and correction                                                                                                                                                                                                                                                                                                          | Failing evidence and oracle                                                                                                                                                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 - Image admission publication   | `addFiles` notified error state before registering its pending slots. A synchronous draft observer could submit without the selected image. Register slots first, then publish error, pending count and attachments together through the existing draft publication helper.                                                        | `.ai-rereview-attachments-red.log`: the attempted send executed instead of rejecting. The regression asserts no Feature dispatch and retained input; cancellation/disposal from the first notification also retire the registered reads.                   |
| R2 - Invocation disposal handoff   | The tracked promise was installed only after Feature.execute returned and represented just Feature settlement. Disposal from admission or synchronous progress could finish before endTurn. Install the complete invocation promise before any observable admission/dispatch work and mark disposal before cancellation callbacks. | `.ai-rereview-settlement-red.log`: endTurn occurred after disposal completed; synchronous progress disposal finished while execution remained unresolved. Both ordered lifecycle regressions now pass, alongside repeated-disposal and real-runtime tests. |
| R3 - Retired projection references | Projection disposal cleared maps but kept active controls and a whole source snapshot, retaining retired request state/attachments. Retain only the active turn needed for confirmation updates; clear that reference and controls during disposal.                                                                                | `.ai-rereview-observation-red.log`: disposed projection still exposed the active image-bearing turn. The regression asserts empty IDs, absent turn projection and null active controls while shutdown is still draining.                                   |

The earlier regressions did not cover these notification-time boundaries. The new
oracles assert admission, resource-release ordering and observable state retirement,
not helper call counts or a preferred implementation shape. The original actual
projection work-count tests at 0/10/100 turns remain intact. No alternate queue,
canonical store, history implementation, persistence path or dependency was added.
Focused verification: 110 tests pass across conversation, actual runtime integration,
panel and initApp (`.ai-rereview-observation-green.log`). Six permanent cases were
added; each of the three confirmed defects has a recorded failing oracle before
its correction. The unchanged original 44 conversation tests passed during the
first red run, demonstrating the prior coverage gap.

Final frozen-source development verification:

- Full App command: 2,786 passing executions (13 boundary, 646 AI, 1,302 backend,
  159 local Node, 666 local Vitest); two retained-input backend skips.
  Evidence: `.ai-rereview-app.log`. The final lint-only test guard correction was
  followed by all 50 conversation tests passing (`.ai-rereview-conversation-final.log`).
- Shared runtime: 414 passes (`.ai-rereview-runtime.log`).
- All nine browser specs in one fail-fast, single-worker run: 69 passes, two
  unavailable recorded-input skips (`.ai-rereview-e2e.log`). Both
  RUN_AI_CONVERSATION_LIVE=1 and RUN_AI_DRAWING_PERFORMANCE=1 were enabled.
  This includes actual model continuation, 16/320/1280 elements, panel/navigation,
  image continuation, cancellation, partial work, Frame Undo/Redo, independent
  history, keyboard/pointer behavior, collaboration and inspection invalidation.
- Typecheck and production build pass (`.ai-rereview-types.log`,
  `.ai-rereview-build.log`). Existing build chunk warnings remain.
- Lint: zero errors, 28 existing warnings (`.ai-rereview-lint-final.log`).
  Naming: 15 passes (`.ai-rereview-naming-final.log`). Flow document tests: two
  passes; scoped whitespace review passes.
- Inspected the actual 360/1280 complete-conversation images and live-provider
  image under `apps/asyra-design/test-results/ai-conversation-rereview`. The live
  reply retained the dimensions and color; the test asserts unchanged canonical
  document data. This is bounded smoke evidence, not general model certification.

Current source fingerprint: `.ai-rereview-source.log`. Flow observations were
republished against that source after these gates. No additional confirmed defect
remains within the reviewed diff/direct-consumer scope. No framework, release,
template, packaging, dependency or remote operation was performed by this re-review.
