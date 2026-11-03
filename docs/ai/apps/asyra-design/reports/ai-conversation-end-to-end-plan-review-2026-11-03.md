# AI conversation - end-to-end plan review - 2026-11-03

## Decision

The previous plan is not ready for implementation as written. It starts downstream
of native discovery and understates the difference between ordinary completion
and benchmark reporting. Replace its implementation order before code changes.
This is a source/contract/evidence review, not an independent model experiment or
proof of the cause of all historical delays. No product code or tests were changed
or executed. The repository agent-eval catalog was inspected; its three developer
workflow fixtures do not evaluate this embedded design-agent task.

## Scope and evidence

Trace the current path from panel input and history to native registration,
selected contract delivery, preparation, browser writes, inspection, completion,
reporting and recording. Read direct formal tests and current spec/Inspector
contracts. Mutation scope is this review, the existing improvement plan, and one
incorrect explanation in the latest host test report. Original model reports and
recorded artifacts stay immutable. No broad cleanup, dependencies, release work,
new model runs or production changes are authorized.

Primary live evidence is `taipei-101-fixed-1793699786368`, provider record
`e7b016db-d2e2-4bf3-9d60-b4f6e8854891.jsonl`. The video complaint is from
`taipei-101-fixed-1793638204793`. Retained files are under
`tmp/conversation-improvements/live/`. Read-only source review cannot certify all
historical versions or prove which change caused a month of repeated failures.

## Producer-to-consumer review

| Boundary | Current producer and consumer | Finding |
| --- | --- | --- |
| Panel -> conversation | ai-conversation-panel captures conversation ID and draft generation before asynchronous file reads; conversation-context-projection builds chronological public context once on submit | Existing ownership guards are present. No new attachment/history defect established by this run. This single-turn benchmark does not exercise conversation switching or follow-up continuity. |
| Request -> provider | server-action-batch-provider transports metadata; local-ai-provider creates request-local tool/evidence owners and an ephemeral native thread | Ordinary App turns use projected public history; the benchmark report alone continues the original native thread. Do not generalize report-session continuity to every App turn. |
| Native registration -> first callable tool | local-ai-provider maps every exposed tool to deferLoading=true, including describe_design_apis | A provider discovery stage precedes App discovery. App lookup unit tests do not cover whether the model finds this bootstrap tool. |
| App discovery -> selected tool input | local-operation-tools combines action and host-native definitions; exact/qualified routes, usage, schemaPaths and inputScope are supported | Several retrieval representations exist. Narrow-query success is not proof that the initial native declaration and examples guide the model to it efficiently. |
| Draft -> native elements | design-construction and local-design-workflow validate/project/expand; browser executes registered writes and returns receipts | Compact templates and retained repairs work in the retained run. No demonstrated missing high-level building primitive. |
| Capture -> binding -> judgment | local-operation-tools aggregates image selections; local-design-review issues signed bindings; browser evidence validates currency | Correct invalidation and binding requirements coexist with loss of known selection detail on mixed-image handoff. Review the producer before adding recovery prose downstream. |
| Ordinary final action -> durability | actions.ts reportOutcome confirms persistence for completed only | This ordinary completion path is not equivalent to benchmark report-only settlement. |
| Native work terminal -> benchmark report | local-ai-provider retains work finalText, clears it, starts the report turn and requires unsupported | Native work completion is retained, but the normal final work batch is not what this evaluation branch returns to the App. |
| Benchmark settlement -> artifacts | taipei-101-live separately confirms persistence, compares content, records video and reloads the same context | These prove host collection/durability, not ordinary completed-action delivery. Process framing is missing after first paint. |

## Findings that change the plan

### 1. The bootstrap discovery boundary was omitted

`local-ai-provider.ts` constructs deferred nativeDefinitions, advertises zero eager
tools, and supplies them to thread/start. Instructions say to use
`describe_design_apis`, but that tool is itself deferred. The test named
`keeps initial instructions bounded when unrelated deferred tools grow` explicitly
asserts that every tool remains deferred. That is an existing policy, not an
accidental missing flag.

The AI's alleged wrong/no-result search calls are not retained as raw request/result
pairs in the App trace. Native discovery tests verify protocol/lifecycle/digests;
they must not be cited as proof of semantic search quality. This supports an
upstream exposure risk, not a confirmed provider search defect.

Before changing exposure, define one bootstrap policy: compare the existing route
with a minimal eagerly available discovery entry, keeping domain tools deferred.
Do not eagerly load all tools. Review native support and initial instruction cost,
update the all-deferred assertion and associated contract together if the policy
changes, and evaluate bootstrap reachability separately from App exact lookup.
No candidate is adopted by this review and no native search internals are invented.

### 2. Several authorities shape what the model receives

The actual initial contract is AI_APP_PROMPT + conditional history instructions +
AI_OPERATION_INSTRUCTIONS + owner-generated Main tool scope + provider developer
instructions + native namespace/function declarations. Later selected usage is
produced by another projection in local-operation-tools, including input/output
navigation, schemas, execution routes and recovery.

The previous plan looked mainly at selected usage. A change there can leave the
native declaration and initial guidance unchanged. Preserve one semantic source
and derive route-appropriate representations; remove a superseded instruction or
example at its producer in the same slice. Do not remove native/action dual routes
merely because their names match: they have distinct execution envelopes.

Payload 414 is a paginated 78,598-byte total, not that many bytes delivered at once.
Qualified field retrieval in 419/420 already works. Verify the initial/native and
selected views together before inventing another query hint or selector.

### 3. Mixed-image recovery loses producer-owned information

The capture owner knows check assignments for new images. When any old image is
supplied, hasReusedImages causes undefined selections to be passed to
judgmentHandoff. The returned recovery therefore cannot retain those known roles.
This behavior is consistent with the current requirement for explicit old-image
binding, but dropping known new-image roles is unnecessary for that requirement.

Implementation review correction (2026-11-04): the earlier merge-risk finding
missed the upstream `validateCaptureChecks` call. It compares complete check
declarations, including reference uses and supersession, before any capture.
Conflicting declarations cannot reach aggregation. Focused regressions now cover
valid individual source uses conflicting when combined, identical declarations,
and rejection before browser dispatch. No merge-rule change is needed.

Preserve known new-image roles in the unsigned recovery template. Keep old-image
roles unresolved until supplied, then validate through the existing signed binding
route. Existing capture-count tests alone did not cover model-visible recovery.

### 4. Data and visual review are not fully independent contracts

Criteria distinguish verification=data from visual, while the Inspector requires
every submitted judgment to carry its own inspection IDs. The scale judgment in
this run depends on an overview image; a crown edit invalidates that image and
therefore the scale check. This is current declared dependency behavior, not proof
of overly broad invalidation code.

Do not promise that a new binding template eliminates this work. First document
what each data check actually certifies and whether current canonical/mechanical
receipts can serve that purpose. A new data-only acceptance path would be a separate
product contract change; do not silently remove images or accept a self-authored
calculation note as proof. Preserve current acceptance during the bounded fixes.

### 5. Benchmark outcome is host-controlled, not the AI's verdict

Both detailed and concise evaluation-report instructions explicitly require
report_outcome(outcome=unsupported). The provider rejects a different report outcome.
Thus the latest App partial outcome cannot be attributed to the AI independently
choosing a conservative completion classification. The prior host report's
explanation was wrong and is corrected separately; the original AI report remains
unchanged.

The evaluation branch retains work finalText and returns the report batch instead
of the ordinary final work batch. In actions.ts, persistence confirmation runs
only for completed. The runner's later confirmation is a different owner/phase.
Therefore, the AI's missing persistence receipt is partly explained by this test
path; it is not evidence of an ordinary App storage failure.

Keep three separate assertions: native drawing termination, report completion,
and ordinary App final-action/persistence behavior. Add ordinary completion
coverage using existing deterministic provider/transaction fixtures. The fixed
15-minute same-session report run remains useful but cannot substitute for it.

### 6. Current documents contain overlapping evaluator contracts

The execution spec around its local evaluation section says capture is without
video and closes the work context before a fresh-context reload. The observe
Inspector condition combines the fixed benchmark's untimed policy with that same
instruction. Current fixed runner records video and reloads the same context.

Scope these statements explicitly to their actual evaluator owners. Determine
whether each instruction still has a live consumer; retain it only there, and
remove or rewrite the superseded wording in the fixed-run contract. Do not change
the working recorder to satisfy an unrelated evaluator's lifecycle. Contract test
success did not expose this semantic conflict; string/shape assertions are not
whole-flow validation.

### 7. Recording acceptance checked the file, not the process view

First-paint fit and final/detail captures are insufficient for a growing tower.
The existing remote-recording test proves export before browser disposal, not
visibility during drawing. Add a rendered, settled multi-stage fixture and inspect
intermediate video frames. Frame updates must observe canonical change boundaries,
not element count alone, and must not compete with intentional detail capture.
This is a confirmed recorder defect independent of model quality and Knowledge.

## What remains supported

Optional Knowledge, source-scoped lookup, deterministic grid/pattern expansion,
retained local repair, refusal of nonplanar faces, selective evidence invalidation,
progress-error isolation and same-thread untimed report all have current owners
and relevant tests. The live run supplies additional evidence for some paths,
not all of them. This audit found no basis to replace those mechanisms, force
Knowledge retrieval or add a universal refinement sequence.

## Verification needed before claiming improvement

Use the actual current thread/start payload and real registered declarations in
contract tests. Exercise returned discovery/recovery instructions rather than
hand-authoring an ideal downstream input. Include a small edit, multi-object edit,
reference-based construction, mixed old/new evidence, clarification continuation,
ordinary completion, cancellation, and the fixed benchmark as distinct cases.
Use focused tests at their owners; do not run full local tests.

For each affected boundary assert semantic information, legal invocation, work
counts, invalidation, and absence of redundant acquisition/replay. A local test
passing proves that boundary, not shorter model latency. Any later live comparison
needs fixed prompt/configuration and retained failures; model variability and
unavailable provider timing remain explicit. No fifty-iteration historical causal
claim or independent review is made here.
