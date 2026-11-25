# `@asyra/ai-agent-runtime`

Optional orchestration for turning natural-language intent into registered,
app-approved actions.

## Owns

- provider request, small control-envelope validation, and ordered action
  resolution
- immutable common tool contracts and host-supplied validation middleware
- permission and optional confirmation sequencing
- one app transaction-runner invocation around accepted executors
- bounded redaction, progress observation, audit, terminal results, and cleanup

## Does not own

The portable core does not own model vendors, credentials, app-domain actions, Feature sessions, canonical
state, transaction implementation, collaboration, or provider retry after
execution begins.

## Compose when

Compose it when an app wants model-assisted intent behind explicit action
schemas, permission, and canonical app APIs. Do not compose it for ordinary
deterministic commands or as a substitute for Feature System. Import and
construction are inert until the app creates and runs a runtime.

## Public entrypoints and prerequisites

The public entrypoint is `@asyra/ai-agent-runtime`. Provide an `AiProvider`,
context provider, `AiActionDefinition` catalog, permission policy, confirmation
handler, transaction runner, and Feature-owned `AbortSignal`. Important
surfaces include `createAiAgentRuntime(...)`, `createAiActionRegistry()`,
`runtime.run(...)`, and `createGenericHttpAiProvider(...)`.
Each action also declares revision, output schema, effect, resources and lifecycle.
`createAiToolMiddleware()` enforces host schemas through `createAiInvoker()`;
registration alone is a declaration. Recording uses `createRecordDeliveryHost()`
with host-owned durable outbox storage. Diagnostic recovery never replays actions.

Tool delivery declarations use standard JSON Pointers: `delivery.path: ""` selects
the whole result, while `/field` selects a child. A declared view does not change
the raw output schema or execution outcome. Hosts validate raw data with its
execution state, then validate the selected view with its delivery state.

## Lifecycle, inputs, outputs, and failure

One run obtains bounded context, requests one provider-prepared batch, resolves
registered actions, evaluates permission, optionally confirms, and executes in
one app transaction. Results are `executed`, `cancelled`, or `failed` with
bounded detached evidence. Invalid batches, denial, cancellation, or abort
apply no canonical prefix. Executor failure reaches the app transaction's
rollback. `dispose()` aborts active work and disposes only explicitly owned
resources.

Scoped authored action progress has paired start/end notifications. Each actual
execution has an opaque invocation identity, distinct from batch-local action IDs;
causal trace children use that execution identity and retain original actionId and
batchId for correlation. Completion ends activity, not necessarily successful work.
Abort suppresses further observer notifications; consumers use the returned
cancelled outcome to settle their UI. Progress never authorizes mutation or retry.

When actions need revision-bound receipt capture, the App mutation executor
honors `runAiMutation(context, mutate, settled?)`: call `settled(result)` once,
synchronously after successful canonical publication and before yielding. Keep
capture failure separate from the completed mutation; never replay a write to
recover its receipt.

### Diagnostic storage and retry ownership

Diagnostic outbox adapters implement atomic `append(records)` for an ordered, single-request batch partitioned at `recordStorageBatchBytes` (256 KiB), with an individual record still subject to capture and transport bounds. The delivery sink keeps its existing pending-byte bound and streams durable prefixes independently from later storage work. A failed atomic append records the entire enclosing lost range; it never synthesizes completion or replays product operations.

File-backed collectors retain only a recent digest window. Older retries are checked against the durable stream using a bounded sequential cursor; restart streams the evidence without retaining all hashes. Explicit host record budgets still apply. A generic collector without durable retry lookup retains its bounded in-memory admission budget.

## Relationships

Feature System owns the invocation session. App executors call Core/common APIs.
Factory owns actual transaction settlement. Collaboration and Persistence
observe ordinary canonical commits; the AI runtime creates no parallel path.

## Maintained use path

Follow [Build registered AI actions](../../build/ai-actions.md). The related
[app retrieval guide](../../build/app-retrieval-action.md) keeps search
read-only and mutation behind a Feature API.

## Replacement and disabled behavior

`AiProvider` is replaceable. Apps may replace context, permission,
confirmation, transaction, audit, and HTTP adapters. If the package is not
composed, no provider request, model connection, credential read, or AI state
exists. A provider failure must not fall back to an unregistered action.

## Support, migration, and deprecation

Current support is the browser composition with app-owned provider/backend
policy. There is no current Headless Core service runtime. The root API is
current; no compatibility wrapper or alternate client payload mode is
supported. Migration must preserve action schemas, prepared argument identity,
permission defaults, and one-transaction behavior.

## Selected retained information

See the pending [selected information integration guide](../../updates/retained-information-r1.md)
for exact result redisplay, validity boundaries and read-only recovery.

## Canonical sources and release inventory

- [Knowledge owner](../../../../packages/ai-agent-runtime/src/knowledge.ts)
- [Design information delivery](../../../../apps/asyra-design/server/local-knowledge.ts)
- [Design tool discovery](../../../../apps/asyra-design/server/local-operation-tools.ts)
- [Package contract](../../../ai/framework/packages/ai-agent-runtime.md)
- [Package manifest](../../../../packages/ai-agent-runtime/package.json)
- [Registered AI action guide](../../build/ai-actions.md)

Version and exported-entry facts are generated from this package manifest into
`docs/public/generated/package-reference.json`. The documentation gate reviews
this page against the exact 19-package release inventory.

## Optional complete tool host

The portable root additionally exposes request scheduling (`createAiToolScheduler`),
App-scoped result context (`createConversationResults`), named references
(`resolveNamedResultInputs`), independent `resultDelivery` selections, media
selection and purpose/field metadata search. These mechanisms do not select an
App's transaction, domain vocabulary, document identity or storage lifetime.

Import `@asyra/ai-agent-runtime/schema` for `invokeAiToolOwner`,
`operationContractIssue`, `nativeToolInputSchema`, `projectToolDelivery` and
`createAiToolLeases`. This opt-in entry requires the consumer to declare Lodash
`^4.18.1`; the portable root does not load Lodash. Complete owner output is
validated before any external projection. Presentation-only internal fields can
still feed a successor. Request-scoped/secret lifetimes remain enforced.

Import `@asyra/ai-agent-runtime/node` for `createAiToolHostLibrary`,
`createSqliteToolStore`, `createAiToolStoreSession`, `createBatchExchange`,
`createNativeProviderConfig`, `startNativeProcess`, `createNativeRpcTransport`,
`parseKnowledgeFile`, `createKnowledgeFileLoader` and `createInformationDelivery`.
These imports are optional and inert. The App supplies paths, catalogs, budgets,
permissions and owned-resource cleanup. Native transport supports the tested
Codex app-server protocol; executable selection, model, prompts, tool catalog and
report/evaluation policy stay outside it. Normal providers need no native client.

`createExchangeAiProvider` extends the existing generic HTTP provider with
bidirectional batch receipts and App conversation result storage. Configure the
endpoint/headers, byte budgets, App-owned `results` store and failure callbacks
explicitly. Its store supplies scope-aware names, descriptions and awaited
exchange. Borrowed stores survive provider disposal; only an explicit
`releaseResults` callback releases owned storage.
A receipt transport failure does not undo acknowledged work or authorize replay.

The executable inventory journey in
`packages/ai-agent-runtime/src/__tests__/fixtures/inventory-journey.mjs` demonstrates
public built imports from `runtime.run` through the provider/exchange, host,
canonical executor and a later turn. Its App transaction adapter tests default
rollback and explicitly selected preserve-progress. It is not a Design shim.

## Replaceable tool-calling sources

The Node entry exports `PrepareToolProvider`, `ToolProviderBinding`,
`ProviderContentItem`, `createProviderConversations`, `createResponsesConversations`
and `createResponsesAiProvider`. Bindings provide instructions, qualified tool
schemas, fresh turn input, canonical invocation and App-owned final decoding.
Adapters translate the provider protocol and never implement App actions.

```ts
import {
  createResponsesAiProvider,
  createResponsesConversations
} from '@asyra/ai-agent-runtime/node'

const conversations = createResponsesConversations() // service lifetime
const provider = createResponsesAiProvider({
  apiKey: serverKey,
  model: configuredModel,
  conversations,
  prepare: prepareCurrentAppTurn
})
// Use provider through the existing AiProvider/Runtime composition.
// Dispose the provider after owned requests, and conversations at service shutdown.
```

`prepareCurrentAppTurn` returns the App's current `ToolProviderBinding`. Another
source can consume the same binding through its own `AiProvider` implementation;
tool execution, named result storage and transactions remain unchanged. The optional
`observe` callback receives credential-free protocol bodies and normalized cumulative
usage. Observers cannot change execution or replace a settled answer.

Responses preserves namespace names, schema semantics and correlated text/image
outputs. It uses explicit `strict: false` plus the existing strict Host validation,
and client-executed tool search for deferred declarations. The App lists the available
qualified names in its instructions. A native search call accepts an array of names.
The adapter returns only the selected definitions in tool_search_output. The stored
response chain keeps them available on later turns. Use `store: true` and
`previous_response_id` with incremental inputs. Stable instructions appear in the
initial developer message. The adapter needs no Conversations API access.
No SDK dependency, automatic mutation retry or fallback source is installed.
An unresolved invocation invalidates continuation; an acknowledged output survives
a later HTTP failure. The adapter rejects incomplete responses as final answers.
Service restart requires a durable App checkpoint. External credential, durable
storage, transaction and evaluation policies belong to the composing App.
