# Conversation continuity and tool contract corrections

Completed: 2026-11-02. Asa reviewed the full-building Taipei 101 result and accepted
this bounded scope for closeout and PR creation. Remaining realism and report
freshness limitations are non-blocking and need not be changed now.
Parent: [Editable Design Agent](../ai-design-agent-plan.md).

## Accepted outcome and exit criteria

Tasks 1-4 delivered exact bounded conversation context, draft-owned asynchronous
images, consistent explicit review bindings, deterministic flow verification and
one locked-prompt recorded Taipei 101 test. Stage reviews and original validation
are retained below. The accepted run remains bound to its original source commit;
subsequent integration validation does not relabel it as a new live model run.
No second AI run, release workflow, version change or merge is authorized here.
The parent plan and separately owned AI improvement work remain open.

## PR integration

Rebase onto main 5cf909b1f preserves newer tool contracts and readable control flow.
Replace the overlapping 32 KiB truncating history projector with the accepted
single conversationContext contract; preserve main's isolation, settlement,
no-replay and retry regression cases. History guidance stays conditional on actual
history, preserving first-request instruction size. Framework source is unchanged.
Integration validation on the rebased source: App AI 792 pass; server response
harness 3,074 pass and 14 existing skips; execution flow proof 85 pass; recorder
and Inspector contracts 27 pass; framework boundary 13 pass; browser 30 pass and
three existing performance skips; closeout/task-context contracts 20 pass. Types,
production build, naming and scoped lint pass (four existing console warnings).
Reviewed narrow-panel and selected-object browser screenshots. Test-owned ports
3045/4145/4245 are clear. No additional live model run or release check.

The generator synchronizes 550 template paths, including main's pre-existing
readability/source drift; generated copies are not independently authored changes.
Raw execution evidence, local configuration and videos remain untracked. Original
source-bound Inspector proofs remain historical evidence, not rebased-source proof.
Current integration logs are under `tmp/conversation-improvements/pr-*`.

## Retained implementation and original evidence

## Conversation continuity and tool contract corrections - 2026-11-02

Original local completion record - subsequently accepted by Asa on 2026-11-02; see the [detailed report](ai-conversation-improvements-2026-11-02-report.md).
Parent: this Editable Design Agent plan. Whole-plan closeout remains with its
coordinating owner and product acceptance with Asa. This follow-up closes only
the bounded corrections below, not historical PRs or the entire Design Agent.
Planning baseline: `b60cec0abdd9c3b12e5c912fd76a1f7fbf8b8e6e`.

### Current execution - Task 1 request owner

Worktree: `.worktrees/ai-conversation-improvements`; branch:
`codex/ai-conversation-improvements`. Plan prerequisite commit: `6e6ecf226`.
All four tasks require bounded self-review and corrections before advancing.
After their gates, run one recorded fixed-prompt 101 test. Check actual account
credits every 30 minutes only; at or below 15,000, begin wind-down, retain evidence,
finish necessary cleanup/validation and notify Asa for review. Do not start a new
slice or live run after that threshold. Token usage is not a credit balance.

Step card: `request` / `conversation-lifecycle`. Sources: execution spec
`Request and continuity`, conversation spec `Product contract`; current request
and conversation Inspector inputs, outputs, conditions and failure owners.
Input: existing settled user turns, public assistant replies/questions, submitted
source images and fresh target observations. Output: immutable, bounded history
plus distinct source attachments through existing Feature metadata. Current
intent overrides conflicting prior intent; history is data, never executable
receipts. Empty conversations omit history; oversize input fails before Feature
execution with an actionable no-write explanation. No canonical cache, raw result
serialization, second provider session or automatic summary model.
Boundary: conversation/context projection, pure protocol admission, presentation
of admission failures, their direct tests and matching contract docs. Provider
consumption is a subsequent compose segment. Request context is computed once per
submission, never on progress notifications; at most 128 prior turns, 128 KiB
serialized text context and 8 MiB serialized source attachments. Retain exact
turns until the bound, then require a new conversation with the needed brief
instead of silently dropping history. Reference identity uses original data URL
and MIME type; repeated references are delivered once with per-turn indexes.
Cases: exact multistep questions, revisions, image continuity, isolated navigation,
retired targets, bounded rejection, work counts and normal retry. Gates: formal
red/green controller tests, actual request serialization, types/lint/naming and
Inspector admission/proof. Stop for a contract contradiction or excluded owner.

### Task 1 compose handoff

Step card: `compose`, consuming `artifact:request-context` through
`request-to-compose`. Preserve the registered tool contracts, ephemeral provider
thread, configured model/effort, current target validation and existing image
transport. Consume exact admitted chronological history as user data; current
intent overrides conflicting history. Source indexes identify provenance, not
new attachment requests. Never treat historical prose as current execution
receipts. Boundary: App prompt, provider wire tests and these contract docs;
no Runtime or canvas changes. Verify the actual serialized native request,
question/choice retention, separate image delivery and absence of extra model
turns. Gates: provider and prompt suites, existing request gates and Inspector
source proof. Request projection tests pass (106); server admission tests pass
(19); typecheck, scoped lint and naming pass. Compose consumption is verified. Bounded review covered the changed projection,
server admission and provider consumers: exact public fields only, no old handles,
latest-intent precedence, immutable once-per-submit work, no navigation/progress
recomputation, retained source isolation and actionable over-limit refusal.
Corrected obsolete attachment fallback and a test lint violation during review.
Final evidence: controller/presentation 106 pass; action-batch 19 pass;
provider/prompt 199 pass and one existing skip; Inspector contracts 24 pass;
source proof `a897b846-7a98-4ae8-9eb8-5ea1598b0035` passed. Types and naming pass;
scoped lint has zero errors (two pre-existing console warnings in proof/provider
tests). No unresolved task-local review finding; no claim of live model quality.
Evidence logs are under `tmp/conversation-improvements/task1-*`.

### Task 2 attachment owner

Step card: `conversation-lifecycle`, conversation spec `Document-scoped history`.
Input: selected files, originating conversation/draft generation and panel lifetime.
Output: source attachments or read errors only on that still-live draft. Navigation
preserves a pending draft; accepted send retires its generation; panel/document
disposal retires reads. No model request on attachment/navigation and no canonical
writes. Use one presentation-owned draft map, not a second active-draft copy.
Boundary: panel draft handlers, panel regression tests, conversation spec and
conversation-lifecycle Inspector. No provider, Runtime or canvas changes.
Cases: delayed success/error after navigation, sending before read completion,
concurrent reads, unmount, normal removal/submission and unchanged navigation.
Gates: reproduce with controlled FileReader completion first, panel suite,
types/lint/naming, Inspector contracts, bounded diff/direct-consumer review.
Stop for ownership mismatch or required out-of-scope changes.

Review outcome: one authoritative per-conversation draft map replaces the copied
active draft. Delayed success/error updates use the captured conversation and
generation; accepted composer submission advances the generation; unmount rejects
late state updates. Navigation has no draft-copy overwrite. Three regressions
failed before implementation and pass afterward. All 40 panel tests pass, including
concurrent out-of-order reads, newer text, unmount and no accidental Feature calls.
Types/lint/naming pass; 22 Inspector contract tests pass. Direct consumer closes the
panel by unmounting it. No unresolved task-local review finding. Evidence:
`tmp/conversation-improvements/task2-*`; browser acceptance remains Task 4.


### Task 3 guidance owner

Step card: `compose` consuming `inspect` registered review contracts. Sources:
execution spec review binding rules and Inspector `inspect` explicit dependencies.
Input: current registered descriptions, schemas and returned bound descriptors.
Output: shared prompt consistent with mandatory per-check nonempty image IDs;
operation procedures stay in `review_drawing`. Capture/bind precedes judgment,
with exact request ownership, freshness and separate overall criterion preserved.
Boundary: `server/ai-domain-prompt.ts`, its formal tests, existing review-stage
admission cases and contract docs. Do not change review admission or introduce a
second schema/registry. Existing stage tests already cover omitted, foreign and
forged bindings, stale evidence and local subset recovery. Run those unchanged,
add the contradictory-guidance regression first, then correct only the obsolete
sentence. Gates: prompt and review-stage suites, lint/types, bounded self-review.
Stop if registered owner and product contract disagree beyond this correction.

Review outcome: removed only the obsolete implicit-dependency sentence. Existing
registered descriptions, schemas and admission agree; executable published fact
examples and exact returned review descriptors already have formal owner tests.
The new prompt regression failed before correction; all 129 prompt/review-stage
cases now pass. These include missing scope, foreign/forged bindings, stale
successors, valid sparse subsets and retained independent passes. Scoped lint and
naming pass. No validator weakening or extra workflow gate; no unresolved local
finding. Evidence: `tmp/conversation-improvements/task3-*`.


### Task 4 integration and live evidence

Step card: existing conversation/request/compose/inspect/settle handoffs; no new
product owner. Inputs: implementations from Tasks 1-3, unchanged registered
Feature/canonical mutation routes, fixed Taipei 101 fixture. Outputs: deterministic
browser and provider evidence, current docs/template parity, then one bounded live
record with actual submitted prompt, original provider records, timings, editable
source, overview/detail screenshots and honest result assessment. Mocked evidence
establishes wiring and semantics, never live quality or speedup.
Boundary: existing App tests/E2E, a permanent fixed-prompt recorder, provider spec,
App guide, generated template and this plan/report. No additional production
feature, model settings, prompt coaching or geometry repair. Full AI/server gates,
focused browser conversation/navigation, build/types/lint/naming, Inspector source
proof and template parity precede live execution. Use the reference procedure's
10-minute live-run ceiling and normal Stop/cleanup; retain failures without reruns.
If AI asks a genuine clarification, preserve it and ask Asa instead of inventing
an answer. Credit checks stay on the 30-minute cadence; wind down at 15,000.

### Task 4 validation iteration

Two browser attempts were invalidated by concurrent manifest/package-build changes.
Their traces show Vite reconnects during the cases and lost test listeners. Keep
source and dependency outputs static during every browser/live run; do not patch
history behavior or increase assertion deadlines. The static-source rerun passed
29 cases with three opt-in performance cases skipped. Preserve all attempts.

Template synchronization regenerates pre-existing drift as well as this task's
source changes (349 generated paths); never hand-edit that output. Parity passes.
The agent incorrectly ran release-only probes and proposed a scope expansion.
User correction: a non-release task must not execute or handle release workflows.
Those probes are excluded from this task's acceptance and remaining work; preserve
their logs only as historical evidence. Do not rerun them or change the release
package set. The earlier scope question is withdrawn. Local generated-template
synchronization is recorded above; no publication readiness is claimed.

### Task 4 pre-live review

Formal gates: AI 619 pass; App local 159 Node cases plus 666 Vitest cases pass;
server harness 1308 pass and two existing skips; framework boundary 13 pass;
static-source browser flow 29 pass and three opt-in performance skips; the four
navigation/style cases pass, including targeted color change, two-object revision,
unrelated-object preservation, exact prior intent, and one Undo/Redo per request.
The deferred-image browser case verifies the subsequent submission's actual image
ownership. Inspected narrow and wide panel screenshots and attachment isolation.
Inspector candidate `cab4e9b3-7cee-4173-9c71-b7af69b5d9e4` passes. App build,
types, scoped lint/naming, template parity and local template build pass. Fixed
prompt/recording contract has a permanent Node gate and immutable fixture digest.

Bounded review rechecked request-owned history/evidence separation, draft lifetime,
registered explicit image binding, generated-script exclusions and recorder cleanup.
No production timing promise follows from mock results. No unresolved finding in
the four implementation slices. Release-only results are excluded from App
acceptance and do not block completion. Preserve
all failed pre-live attempts. Next: exactly one live run, visual inspection and
actual evidence report; no code/build edits during that run.

### Post-live recording correction and review

Step card: Task 4 test recorder and read-only retained-evidence verification;
production request/compose/inspect/settle contracts remain unchanged. Rechecked
Inspector observe rules: execution receipts do not certify visuals, missing data
stays unknown, and diagnostics never change product settlement. Inputs: the one
completed run and exact retained document. Outputs: corrected classification and
bootstrap readiness tests plus a separate no-AI reopen proof. Boundary: the
permanent recording scripts, their Node contract tests and these docs. Preserve
original evidence; no second drawing request, model assessment or artwork repair.

Two recorder defects were reproduced before correction: receipt POSTs on the same
endpoint were counted as user submissions, and socket connection was mistaken for
completed document bootstrap. Use the canonical receipt header and wait for the
expected canonical node count before capturing reload. Tests: two red cases before
correction; all three contract cases green afterward; scoped lint and naming pass.
The separate retained-document helper blocks AI requests and proves exact document
equality with 20,920 nodes, zero AI requests, and a visibly loaded screenshot.
Original `run.json` and blank `reload.png` remain unchanged. No production changes
followed the tested source `ca83647639baa03906a467942cd9c0f20f8225d2`.

One live drawing completed in 352.501 seconds, with first paint opportunity at
50.205 seconds and 20,906 editable vectors. The App settled successfully and the
backend checkpoint matches the source. Overview, base, tiers, spire, native detail
and corrected reopen images were inspected. The result remains a stylized vector
illustration; high object count and model-accepted checks do not establish full
architectural realism. Offline report freshness remains `current: false`, so no
blanket current-review certification is claimed. Report, raw records and video are
linked in the detailed report. Task-local implementation review is complete;
artwork acceptance and future quality work remain explicit. No push, merge or
additional AI run.

Final template check exposed local App `tmp/ai-executions` records as 30 candidate
publication files. Within Task 4 template synchronization, add `tmp` to the existing
App release exclusions; preserve the raw files. The focused release contracts failed
before correction and pass afterward, including the locked-recorder exclusions.
The full release suite has 32 passes and one existing standalone workspace-protocol
failure. This unnecessary release run is historical evidence only, excluded from
App acceptance by the user correction above. Template parity then
passes without generating execution records. This is artifact hygiene, not a
release-set change or a repair of the separate clean-consumer limitation.

### Objective, evidence and boundaries

Make ordinary design follow-ups and clarification answers carry the information
needed to act on the intended editable design. Keep reference provenance and
conversation isolation, remove contradictory tool guidance, and measure the
resulting complete task flow without weakening current review requirements.

Source review found four concrete gaps:

- `src/ai/conversation.ts` sends the current intent and target hints, but not
  prior conversational requirements or decisions. Ordinary follow-ups do not
  inherit references; only clarification and retry do. The local provider starts
  a new ephemeral thread per request, so a conversation ID does not restore memory.
- Clarification metadata contains the original intent and prior turn ID, but
  not the actual assistant question, offered choices or intervening answers.
- `server/ai-domain-prompt.ts` both requires per-check `inspectionIds` and says
  omitted bindings use every supplied image. `local-design-review.ts` rejects
  missing per-check IDs; the existing explicit binding contract is authoritative.
- `src/app/ai-conversation-panel.tsx` awaits image reads without binding their
  result to the originating conversation and draft lifetime.

The existing conversation and panel suites passed 63 tests during review. This
is baseline evidence, not proof of these cases: establish permanent failing
regressions before changing each implementation owner. No live-model latency
baseline or browser reproduction of the attachment race has yet been collected.

Mutation scope for future implementation: the existing App conversation and
panel owners, their Feature/provider handoff and bounded input validation,
domain/tool guidance, direct tests, affected current specifications/API docs,
existing Inspector steps and generated Design template. Shared Runtime changes
require evidence that the existing public handoff cannot express the contract
and a separately bounded owner slice. No new dependencies, model changes,
geometry/rendering changes, persistent chat store or external integrations.

Discovery stays within these four gaps, their direct consumers, and the task
cases below. Retain permission checks, cancellation, request-owned evidence,
partial-result recovery, grouped Undo and current native editable capabilities.
Do not add raster insertion/image generation or relax final visual verification.

### Task 1 - Preserve conversation intent and clarification context

Owner: App `conversation-lifecycle`, followed by the existing Feature and
`request-backend-action-batch` handoff. The controller owns conversation memory;
the panel displays it and the provider consumes one immutable request projection.

Design the bounded context contract before coding. It must retain the original
applicable requirements, explicit user revisions, assistant questions and choices,
answers, relevant prior outcomes and user-supplied reference provenance. Keep the
current request distinguishable from history and treat quoted/source content as
data. Latest explicit user instructions supersede conflicting earlier instructions.
Do not infer a permanent requirement from an assistant suggestion or a failed action.

Keep conversation-owned source references distinct from request-owned artifacts.
Resolve needed reference bytes into each new request without presenting them as
new user attachments. Do not carry old inspection IDs, tool leases, check receipts
or provider call identities as usable authority. Previously imported backend
references may require reacquisition from retained provenance; do not retain an
expired request handle. Revalidate target existence and current selection/locks.
Do not cache canonical context across submissions.

Use the existing conversation as the source, not a second mutable history store
or a long-lived provider process. Select explicit transport/attachment bounds
against existing endpoint limits before admission. Ordinary growth must have a
deterministic bounded retrieval/retention policy; never silently truncate an
active requirement, pending question or needed reference. If necessary context
cannot be delivered, report that precise limitation before executing ambiguous
edits. Do not introduce a summarization model call or send all canvas geometry.

Permanent cases: referenced design then text-only refinement; retained dimensions
and color constraints; an explicit replacement instruction; two successive
clarifications with a short answer such as "the latter"; clickable answers;
new/history conversation isolation; deleted targets and changed selection;
retry without duplicated writes; missing references and over-limit context;
read-only advice with no mutation. Provider tests must inspect the actual serialized
input of a fresh request, not merely the controller's rendered message history.

### Task 2 - Bind asynchronous attachments to their draft

Owner: existing panel draft presentation under `conversation-lifecycle`.
Associate each pending read with its originating conversation and draft generation.
Completion updates that originating draft only while it is still valid, even if
another conversation is visible; never append to the currently visible draft by
accident. Sending/resetting that draft or disposing the document retires its pending
reads. Late success or failure cannot restore submitted attachments or overwrite
another conversation's error. Keep native FileReader and current accepted formats.

Permanent cases use deferred FileReader completion: A -> B -> completion -> A;
new conversation during read; send before read completes; document disposal;
mixed read success/failure; out-of-order reads. Browser navigation tests verify
draft restoration and subsequent send uses only that conversation's attachments.

### Task 3 - Make guidance agree with executable tool contracts

Owner: existing backend guidance/discovery and inspect input admission.
Remove the obsolete implicit-binding instruction. Require explicit nonempty
per-check image dependencies exactly as the current schema and validator do;
retain capture/binding before verdict submission and request-local freshness.

Keep stable App policy in the shared prompt and operation-specific instructions
at their registered tool owner. Review only the affected review/capture examples
and their discovery delivery. Do not add another registry or rewrite the entire
prompt based on token count alone. Direct known-value edits remain direct batch
operations; do not invent a prepared-content gate, and do not remove applicable
current rendered-result review to make simple edits appear faster.

Permanent cases: published examples succeed through actual admission; absent,
foreign and stale inspection dependencies fail; a valid explicit subset succeeds;
unrelated retained passes survive. Check both native tool delivery and composed
invocation where the same contract is exposed. A string assertion alone does not
prove an example is executable.

### Task 4 - Validate the complete task flow and measure cost

For full-building Taipei 101 tests, use the
[fixed prompt and baseline rules](../../modules/ai-development-and-debugging.md#fixed-full-building-taipei-101-test-prompt).
The exact user-approved fixture is mandatory unless the user explicitly requests
a change. Do not add reference instructions, search restrictions or test-driver
coaching. Other task cases below remain distinct scenarios, not modified versions
of the Taipei 101 baseline.

Run after Tasks 1-3 and their focused gates pass. Cover selected-object color
editing, multi-object style revision, referenced editable drawing followed by
text-only refinement, chained clarification, and partial failure followed by a
safe remaining-work request. Include a separate read-only advice case.

Deterministic browser/provider tests establish context delivery, intended targets,
unchanged unrelated content, editable results, one Undo per modifying request,
Stop/failure behavior and document/conversation isolation. Inspect the actual
panel and resulting canvas for affected visual cases; screenshots are not a
substitute for semantic regression assertions.

Use existing profiling/recording owners to measure submission-to-first-visible
change, total completion time, request bytes, discovery/tool calls, rejected inputs,
repeated acquisition and unresolved review work. Read-only tasks have no
first-mutation metric. Compare equivalent briefs, documents and reference inputs
under the same provider configuration; preserve failed runs and separate browser,
tool and model time. Report unmeasured or inconclusive results explicitly. Do not
claim a speedup from prompt size, fewer calls, mocked runs or different artwork.
This task adds no total production duration limit or review quota.

### Required document changes and implementation admission

Before production edits, update the affected current contracts and admit the
existing matching Inspector steps; this plan is not admission or a second spec.

- `specs/ai-conversation-experience.md`: define cross-turn requirements, exact
  question/answer continuity, source-reference lifetime and pending draft reads.
- `specs/ai-execution-flow.md` and, where the transport changes,
  `specs/local-ai-provider.md`: distinguish conversation data from current
  canonical context and fresh request evidence; document overflow and failure.
- `API_SURFACES.md`: document the chosen bounded metadata contract, input
  validation and tool-binding semantics after names/ownership are resolved.
- Existing conversation/request/inspect Inspector steps: align inputs, outputs,
  routes, bypasses, failure owners, boundaries and exact product-case evidence.
  Preserve unrelated steps and accepted behavior; use supported admission and
  generated-catalog tooling, not a new Inspector or parallel execution path.
- `apps/asyra-design/docs/ai-agent-guide.md`: explain follow-up/reference behavior,
  supported tasks and honest capability limits after implementation. Regenerate
  the standalone template through its existing generator and verify parity.

Per-task gates: red/green formal regressions, affected App/server integration,
types, naming when identifiers change, scoped lint and corresponding Inspector
proof. At the integrated milestone run complete applicable AI/server and browser
suites, build, generated-template parity and applicable clean-consumer checks.
Use current project scripts and preserve their guards. Planning-only completion
requires document/link consistency and a bounded diff review, not runtime claims.

Stop the affected implementation slice if bounded retention cannot preserve its
required context, current spec and Inspector disagree, or the repair needs an
excluded owner. Record a bounded revision before proceeding. Delivery/remote CI
and user visual acceptance remain separate from local passing tests.

### Existing plan disposition

Use current specs and executable contracts as behavior authority. Historical
results are not evidence for this follow-up's eventual source revision.

- This plan remains the product parent; Conversation Experience retains accepted
  UI/lifecycle requirements and links here for these new corrections.
- Reusable Tool Composition records later tool, reference, activity and durable
  completion work. Preserve those contracts; do not restart its completed stages.
- Runtime Profiler and Execution Recording retain failed historical whole-flow
  acceptances. Map an issue to current code and this task's cases before reopening
  it; passing later unit tests does not retroactively turn that run into a pass.
- Execution Flow, Tool Definition Delivery and Operation Pipeline have local
  implementation evidence and historical delivery gates. Their outstanding PR/CI
  status needs exact remote verification before administrative closeout, not an
  assumed new implementation backlog.
- Tool Selection Evaluation is explicitly historical as of 2026-10-17. Basic API
  Coverage and the retrieval/efficiency/evaluation slices record local completion.
  Reuse their contracts and tests rather than repeating those projects.

This planning update makes no GitHub status claim, closes no historical plan,
and authorizes no push, merge, publication or deployment.
