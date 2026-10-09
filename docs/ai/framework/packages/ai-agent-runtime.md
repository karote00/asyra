# AI Agent Runtime Package

`@asyra/ai-agent-runtime` is an optional, provider-replaceable orchestration
runtime for turning natural-language intent into registered app actions. It is
not a model vendor SDK, Feature System replacement, canonical state owner,
transaction engine, permission authority, or collaboration transport.

## Activation and Ownership

Importing the package is inert. An app opts in by creating one runtime with:

- one `AiProvider`;
- app-owned context, action definitions, permission, confirmation, and
  transaction adapters;
- optional bounded retry and redaction options;
- only the resources that this runtime composition explicitly owns.

The app invokes `runtime.run(...)` from its Feature System lifecycle and passes
the Feature-owned abort signal. One invocation may also pass an optional
`progressObserver`; Feature System retains trigger, exclusivity, cancel, and
completion ownership, and the runtime creates no second session queue.

Injected providers and app adapters are borrowed by default. `dispose()` aborts
and awaits active invocations, disposes the instance-local registry, and
disposes only resources listed in `ownedResources`.

## Invocation Flow

```text
app Feature intent + AbortSignal
-> app context provider
-> deterministic provider-safe action catalog
-> one app transaction runner
-> provider.requestActionBatch()
-> server-prepared AiActionBatch
-> Runtime.resolveAiActionBatch()
   -> preflight the small control envelope
   -> bind ordered actions to registered executors
-> app permission for every action
-> optional complete-batch confirmation through AiActionBatchPreview
-> registered app executors in order
-> app common/public APIs and canonical owners
-> optional detached operational progress observations
-> detached redacted terminal result
```

The invocation runner encloses provider work and every sequential batch. A host
may supply an invocation-local `AiMutationExecutor` to its callback; Runtime
passes it to registered actions, whose `runAiMutation` calls admit finite
synchronous writes. Atomic hosts omit it and retain their outer transaction.
Grouped hosts delegate finite members and one final Undo entry to Factory,
without a physical transaction around model/network waits. Provider retries are allowed only before any batch is admitted.
`AiProvider.requestActionBatch()` is the only provider request contract. It
may await `options.executeBatch(batch)` to receive actual redacted action results and refreshed context before continuing.
A callback batch rejection resolves a receipt with `failure` instead of poisoning
the invocation. It includes code, safe message, stage, exact failed action ID/name,
measured action execution time, `settlement` and `contextFresh`. Completed actions
remain in `actionResults`; remaining actions are not executed. The provider must
inspect `failure`, retain completed work, and choose corrected inputs or another
operation without replaying the failed batch. The runtime never automatically
retries these actions. A failed context refresh is marked stale and retried before
any subsequent permission evaluation. Stop and invalid concurrent callback use
still reject. A final returned batch has no provider continuation; its rejection
continues to use the ordinary terminal result contract. Every batch uses the same resolution/permission/execution owners and invocation scope. The final return is one server-prepared `AiActionBatch` with one `batchId`, optional
explanation, and ordered actions containing execution arguments plus a bounded
redaction-ready summary. A live backend provider and a test transport return
that same contract; the response source cannot select a different resolution,
permission, confirmation, execution, or canonical mutation path.

`runtime.resolveAiActionBatch()` checks only the small control envelope:
required data properties, a non-empty `batchId`, the non-empty actions rule,
duplicate action ids, and registered action names. It does not traverse,
validate, normalize, clone, or freeze nested arguments. The resulting
`ResolvedAiActionBatch`, permission policy, and executor preserve the exact
server-prepared arguments identity. `PermissionReadyAiActionBatch` adds only
permission decisions; `AiActionBatchPreview` redacts and retains only bounded
summaries. Invalid control envelopes, permission denial and declined confirmation apply no
prefix from that batch. Callback failures return receipts as described above;
terminal final-batch or provider failures still propagate through the one App
transaction runner, whose rollback/failure policy owns settlement. Once execution
begins, automatic provider-request retry is forbidden. An app may instead
resolve an executor with detached recoverable partial-item evidence, allowing
successful sibling mutations to commit in the same intended undo unit.

An explicit `AiTransactionSettlementError` reports the original callback cause
and the host-known committed, rolled-back or unknown outcome. Otherwise, the
transaction runner rejects with the original callback error only after
successful rollback. A distinct settlement error reports transaction failure and
an unknown canvas state; consumers must not claim successful rollback or offer
blind replay. Under the default rollback policy, a normal callback rejection after earlier execution reports
`transaction.status: rolled-back`.

## Public Surface

Composition and execution:

- `createAiAgentRuntime(input)`
- `AiAgentRuntime`
- `CreateAiAgentRuntimeInput`
- `AiRunRequest`
- `AiRuntimeOptions`
- `AiRuntimeResult`
- executed, cancelled, failed, stage, and failure-code result types
- `AiRuntimeProgressObserver`, `AiRuntimeProgressUpdate`,
  `AiRuntimeProgressPhase`, and `AiRuntimeProgressOutcome`

Actions and action batches:

- `createAiActionRegistry()`
- `AiActionDefinition`
- `AiActionDefinition.inputSchema` is the JSON-compatible backend-facing action
  description; `AiActionDefinition.execute` is the app-owned executor
- `AiActionDescription`
- `AiActionBatch`, `AiActionBatchAction`, `ResolvedAiActionBatch`,
  `PermissionReadyAiActionBatch`, and `AiActionBatchPreview`
- action-batch resolution failures and retry policy types

Provider boundary:

- `AiProvider` and `AiProviderInput`
- `AiProvider.requestActionBatch(input, { signal })`
- `createGenericHttpAiProvider(options)`
- generic HTTP fetch, response, and configuration types
- `AiProviderError`

Policy and evidence:

- context, permission, confirmation, and transaction adapter types
- `redactAiValue(...)`
- `createAiRuntimeAudit(...)`
- detached preview, execution summary, and audit types

Permission evaluation, confirmation, action execution, and transaction
wrapping remain focused orchestration surfaces. The runtime instance exposes
`resolveAiActionBatch(batch, { signal })`; there is no top-level resolution
helper, client payload preparation API, compatibility wrapper, or alternate
payload mode. Apps use `runtime.run()` for the complete ordering contract.

## Terminal Results

- `executed`: batch id, bounded summary-only preview, ordered detached action
  results, committed transaction outcome, and audit.
- `cancelled`: stable `aborted` or `confirmation-cancelled` reason plus a
  detached audit and preview when available.
- `failed`: stable code, owner stage, retry count, stable message, and detached
  audit.

No result grants mutation authority or contains canonical scene state.
`AiActionBatchPreview` contains only redacted server-prepared summaries. It
never retains complete item, path, point, geometry, or other action-argument
graphs. The runtime does not require an app to render its low-level actions or
provide a visual preview to the user.

An invocation-local progress observer receives ordered frozen updates for
context, provider attempts, resolution, permission, confirmation wait when
required, execution, and non-abort settlement. Updates contain only stable
operational summaries plus safe attempt, batch id, action count, and terminal
outcome fields. They never contain provider bodies, action arguments, app
context, canonical state, secrets, or model chain-of-thought. Observer
exceptions are contained. Caller abort or runtime disposal prevents later
progress delivery and releases the invocation-owned reference.

## Provider and Secret Boundary

The generic HTTP adapter posts detached JSON to an app-selected HTTPS or
same-origin endpoint. The endpoint may be a backend proxy that owns vendor
selection, authentication, API keys, rate limits, and provider-specific
repair.

The runtime and adapter never read `OPENAI_API_KEY`, environment files,
browser storage, or another implicit credential source. Authorization, token,
key, password, cookie, configured secret keys, and authorization-like values
are recursively redacted from context sent by the runtime, metadata, preview,
executor summaries, audit, and stable failures.

Raw provider bodies and third-party error messages are never terminal output.
See `../SECURITY.md`.

## Asyra Design Integration

Asyra Design composes one formal provider during App startup. Its bounded
action catalog contains only:

- `request_drawing_detail_choice`
- `insert_vector_composition`
- `update_composition_elements`
- `remove_ai_composition`
- `set_element_visibility`
- `select_elements`

The backend prepares the insert action's compact transferable geometry and
bounded summary before the provider returns its `AiActionBatch`; Runtime does
not redo that model work. The executor materializes only the current ordered
progressive slice on the main thread. Executors use app common APIs with
`undoable: true`; their declared transaction-end or progressive shared
delivery remains inside one outer App transaction. Factory, canonical state
owners, Render, and optional Collaboration therefore receive the same route as
ordinary app actions. The Asyra Design permission map is explicit and
default-deny; confirmation defaults to cancellation.

## Validation

```bash
yarn workspace @asyra/ai-agent-runtime test:local
yarn workspace @asyra/ai-agent-runtime build:ai-agent-runtime
yarn workspace @asyra/ai-agent-runtime example:ai-agent-runtime
```

Advanced implementation guide: `docs/public/build/ai-actions.md`.

Golden Path: `../golden-paths/compose-ai-agent-runtime.md`.

Product contract:
`../plans/completed/ai-agent-runtime-plan.md`.

Dedicated Inspector:
`../plans/ai-agent-runtime-flow-inspector.html`.

### Provider tool activity

Providers may use the optional request-options `onProgress` callback with a bounded
registered tool name and `running` or `completed` status. Runtime forwards it as
provider-phase progress with `tool` and `toolStatus`; invalid names/statuses, aborted
work and callbacks after request settlement are ignored. Activity is observational:
consumer exceptions cannot alter execution. It must not contain raw tool arguments,
model reasoning, credentials or account data. The final batch remains the only
input to action resolution and permission.

### Optional failure retention

`AiRuntimeOptions.failurePolicy` defaults to `rollback`. Asyra Design selects
`preserve-progress`: after execution starts, an ordinary failure returns a failed
result normally from the transaction callback so the canonical owner commits the
applied writes once. Failed results then carry `transaction.status: committed`,
redacted completed `actionResults`/audit, and optional `failedAction`. These are
partial outcomes, not successful completion. There is no per-action savepoint;
writes inside a throwing executor may also remain. Cancellation and confirmation
cancellation still reject the callback. A transaction settlement rejection remains
unknown and cannot report committed progress. No retry occurs after a batch starts.

Execution progress is emitted per action at execution start, with the registered
action name in `tool` and the bounded redacted action summary in `summary`.
Consumers may map absent/non-text summaries to their own activity labels.

### HTTP provider deadline

`GenericHttpAiProviderOptions.timeoutMs` accepts a positive finite integer or
`null`. Omission keeps the existing default deadline; `null` explicitly disables
only the elapsed-time deadline. Caller abort and provider disposal still abort
the transport and release request resources, including during body parsing.

### Safe execution failure explanations

Registered executors can throw `AiActionExecutionError` with a static, bounded
public explanation and recovery guidance. Runtime preserves that message with
`AI_EXECUTION_FAILED` and stage `execution`; ordinary errors still receive the
generic execution-failure message. Never wrap raw provider/transport/canonical
exception text in this class. Failure policy, failed-action identity and transaction
settlement remain authoritative and unchanged.

## Shared Invocation and Execution Profiler

The package owns portable invocation middleware, records, timing, evaluation and
Trace Event JSON export. `createAiInvoker({ execute, middleware, observe })`
returns an object with `invoke({ name, input, callId?, parentCallId?, retryOf?,
signal?, actor?, purpose?, purposeSource?, expectedResult? })`. The host injects
its existing canonical executor, including admission and any required permissions
and transaction boundaries. This dispatcher grants no mutation authority and does
not replace `runtime.run()` for complete user requests.

Middleware receives `(call, next)`. Each `next()` can execute at most once while
its middleware is active. Settlement waits for any downstream work already
started, even if middleware forgot to await it. Observer failures do not change
results/errors or trigger retries. Concurrent calls keep separate identities;
explicit `parentCallId` and `retryOf` provide causality without ambient global
state. The host owns queueing, lifecycle and cleanup.

`createAiExecutionProfiler(input, model, options)` creates one request recorder.
Options supply provider, effort, purpose, clock, optional log callback and sink;
none are inferred from a vendor or application. Use `trace` for actual public
boundaries, `span` for explicit internal phases, `recordTransport` for chunk
receipt/send time and byte count, `update` for cumulative usage snapshots, and
`finish` once for settlement. Finish precedes flushing the host-owned sink.
Callbacks never authorize execution or upload evidence. Importing the package
starts no I/O; recording requires an explicitly composed sink/log callback.

`parseExecutionRecord`, `evaluateExecution`, `createExecutionPeriodReport` and
`exportExecutionTrace` are offline projections. Domain report selectors are
provided through `ExecutionReportPolicy`; a non-drawing host requires no Design
imports. `assessExecution` only calls an explicitly supplied provider when a host
requests an assessment. Its opinion is distinct from recorded execution facts.

The `/node` entry exports `createExecutionRecordSink`, sanitized payload
serialization, batch observation and `runExecutionReportCli`. File creation is
exclusive, writes are ordered, payloads are stored separately with hashes and
redaction metadata, and `flush()` reports storage failure. The root/browser entry
imports no Node APIs. Full permitted tool inputs/outputs stay local; credentials,
provider prompts, private reasoning and binary images are omitted. Recorded data
is not automatically sent to the model, Asyra or any telemetry service. An explicit
assessment transmits its documented bounded diagnostic summary to the host's
chosen provider; this is not an automatic background upload.

Trace export uses `runExecutionReportCli(['--request', id, '--trace'], ...)` or
`exportExecutionTrace(parsed)`. Transport chunks expose timing, direction, stream
and byte count, never raw content. Timeline durations reflect observed boundaries,
not hidden inference work. Report visibility is separate from ownership coverage:
a provider-owned wait is accounted for but its internal activity remains
unavailable. Old records retain that limitation. Missing sequence, duplicated
boundaries, open calls and recording failures cannot produce a complete report.
