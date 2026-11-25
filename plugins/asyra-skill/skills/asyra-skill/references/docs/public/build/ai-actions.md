<!-- Generated from docs/public/build/ai-actions.md; edit the source and regenerate. External links may describe a newer revision. -->

# Build registered AI actions

Use `@asyra/ai-agent-runtime` to turn provider-prepared intent into a bounded,
schema-described set of app actions. The runtime orchestrates; your app retains
domain meaning, permission, confirmation, transaction, and canonical mutation.

## Prerequisites

- an app-owned `AiProvider`
- a bounded context provider
- registered `AiActionDefinition` values with input/output schemas, effects and lifecycle
- explicit permission and optional confirmation policy
- one app transaction runner and Feature-owned `AbortSignal`

## Ownership

AI Runtime owns provider sequencing, small control-envelope validation, action
resolution, permission/confirmation order, transaction invocation, redaction,
progress, and terminal results. The provider owns model/backend preparation.
The app owns schemas, action executors, permission decisions, Feature lifecycle,
domain prompt, provider credentials, and canonical common APIs.

## Write the App prompt and tools together

Start with one real user request. Write down which decision needs the model,
which operation the product already performs, and what result the model needs
to decide or answer. Use that split to place information where it is consumed.

| Where | What belongs there |
| --- | --- |
| Stable App prompt | The model's product role, the decisions it owns and how to reach available capabilities. When a provider defers tool definitions, name the actual discovery entry or qualified names its binding accepts. |
| Current request input | The user's request, relevant selection or scope and fresh facts for this turn. Resolve mutable targets and access at execution. |
| Registered tool contract | A purpose that distinguishes this operation from its neighbors; accepted arguments, required fields, units or coordinate basis where relevant; complete output, effect, resources and lifecycle. Generate provider descriptions from this definition. |
| Knowledge | Optional domain references the model can consult when a decision needs evidence. Keep live quantities, identities and permissions with their canonical owners. See [App-owned retrieval](app-retrieval-action.md). |
| Executor and App policy | Validate at the secured boundary, evaluate permission and confirmation, then use the same product operation as a human command. The App selects transaction and storage policy; the adapter translates the provider protocol. |

For an inventory assistant, the stable App instruction could be:

> Help the user decide what to reserve. Read current stock when availability
> matters. Use the reservation tool to make the change and report the confirmed
> quantity when the App supplies it. Consult the stock policy when a rule is unclear.

Supply the actual registered entry names where the chosen provider needs them.
Put the requested SKU in turn input and the SKU format in its tool schema. Keep
changing stock levels out of the stable instruction. Enforce the stock check
in the product operation even when the model has already read the quantity.

### Hand a result to the next owner

For example, a stock tool returns `{ "allocation": { "sku": "A1", "quantity": 2 } }`.
The reservation tool takes `{ "sku": "A1", "quantity": 2 }`. If the user has
already authorized that quantity under App policy, a composed host can bind
the first step's `/allocation` directly to the second step's input. The executor
returns the reservation ID. If the user must choose among alternatives, deliver
the options and wait for that choice before reserving. A simple independent
action can use the registered action route directly.

Validate the complete owner result before binding it. Choose separately what to
retain for a later turn and what to deliver now. For example, retain the
reservation under a conversation-scoped name and return just the status if the
next decision needs no details. If the model must report the confirmed quantity,
make that field available from the canonical result or a bound lookup. A
requested quantity alone cannot establish what was reserved.

For a known input rejection before dispatch, return the offending field and the
accepted form so the model can correct the call. If a write may already have
run, preserve its known or uncertain settlement and reconcile with the App
before another mutation. Report a storage or delivery failure separately from
the operation it followed.

Test this handoff through the App's configured provider and runtime with a
deterministic source. Inspect the declarations actually offered, the arguments
seen by the canonical executor, the resulting state and the receipt delivered
to the model. Exercise a rejected input followed by a corrected request with
one eventual write. Separately, interrupt receipt delivery after an acknowledged
write and verify the recovery path preserves its settlement without reserving
again. For retained results, check reuse on a later turn and isolation from
another conversation. The [runtime package guide](../reference/packages/ai-agent-runtime.md)
describes the inventory journey, provider bindings and continuation storage.

## Diagnose an expensive or interrupted AI task

Start with two adjacent provider calls. Read the instructions and tool declaration
the model actually received, its arguments, the host receipt (including any media
parts), and what the model requested next. Identify the first handoff where the
next owner lacked information or received data it only forwarded. Apply the
smallest change that explains that observation.

| What the trace shows | What to change and how to check it |
| --- | --- |
| A known edit first fetches its own instructions. An unfamiliar edit searches twice. | Allow direct invocation of known operations. For discovery, match purpose and supported input fields. Return the ordinary executable input and route for a clear match; show distinguishing summaries and unmatched terms for ambiguous candidates. Keep advanced composition and examples available on request. Replay both a known operation and a purpose query with opaque tool names. Check that a valid first match executes and an unsupported argument still rejects. |
| The model reads a long list of IDs and sends it back unchanged. | Bind the required output field to the next host step. If that step comes on a later turn, retain the complete mapping in App scope and return its confirmed name, what it identifies, and the outcome. Deliver individual IDs on demand. Verify a downstream edit targets the intended ID, a missing key causes no dependent write and a storage failure preserves the original mutation status. |
| A narrow inspection delivers every record or every image. | Expose the smallest useful unit for that decision: a page, selected fields, an individual image or a region on the original asset. Identify the source and units for region queries. Compare the subset against the full source; verify a caller that actually needs pixels receives pixels. Keep the original available under its declared lifetime. |
| A large authored input is rejected and the next call rewrites it all. | If repeated in this product, let its authoring tool retain the rejected revision before dispatch. Return its scoped reference, independent issues and exact editable paths in the submitted source. Accept grouped replacements against that revision, revalidate the complete result and then apply. Verify a stale reference or invalid path leaves the source intact. A simple scalar input can still be corrected directly. |
| Preparation and review repeat the same findings. | Have the owner identify findings for the current revision and deliver the actionable changes or requested detail. Preserve access to all unresolved issues. Replay an unchanged review and a revision that both fixes one issue and introduces another; check that the model can distinguish them. |

**How Design measured it.** In an offline replay of a creation with 1,400 IDs,
the creation text including its execution envelope fell from 96,828 to 561
UTF-8 bytes. A separate 73-byte outcome remained. The original ordered mapping
was still available, and a known child edit took one host submission. A separate
entrance draft had four collapsed paths: the scripted provider used one retained
repair, zero full resubmissions and one acknowledged application of 104 elements.
These are measurements of specific handoffs. A different App can adopt the
result binding without building a geometry draft editor. See the
<a href="https://github.com/karote00/asyra/blob/main/docs/ai/apps/asyra-design/plans/completed/on-demand-design-contracts.md" target="_blank" rel="noopener noreferrer">Design replay and its measurement boundaries</a>.

For your own comparison, replay the same input and verify canonical effects,
provider-visible bytes, model exchanges used only to transfer data, full input
resubmissions and writes. Count model decisions separately from host steps. Use
provider usage records for token, cache or billing claims. For a live run, inspect
what happened after a refusal: a corrected call or a supported alternative can
complete the task. Apply the same judgment to knowledge: if the model repeatedly rederives a
domain rule, make the reference discoverable by the question it answers. If it
recalculates deterministic values, look for an existing calculation tool. A task
can finish successfully without reading knowledge or consuming a saved value.
If the trace cannot explain a choice, record the uncertainty; a same-session follow-up
can supply the model's explanation, while the receipts establish what executed.

## Public APIs

- `createAiAgentRuntime(...)` and `AiAgentRuntime`
- `createAiActionRegistry()` and `AiActionDefinition`
- `createAiToolContract()`, `createAiToolMiddleware()` and `createAiInvoker()`
- `AiProvider.requestActionBatch(...)`
- `runtime.run(...)` and `runtime.resolveAiActionBatch(...)`
- context, permission, confirmation, and transaction adapters
- `redactAiValue(...)` and `createAiRuntimeAudit(...)`
- `createGenericHttpAiProvider(...)` for an app-selected safe endpoint

## Where this runs

Create one runtime inside the app Feature or service that owns the AI
invocation lifecycle. Provider credentials and vendor calls belong behind the
app's server boundary. Browser code receives a bounded provider adapter,
registered actions, permission policy, and the same transaction runner used by
ordinary product commands.

## Implementation

```ts
import {
  createAiAgentRuntime,
  type AiActionDefinition
} from '@asyra/ai-agent-runtime'

type SetVisibilityInput = Readonly<{
  readonly visible: boolean
}>

const setVisibilityAction: AiActionDefinition<SetVisibilityInput> = {
  name: 'set_visibility',
  description: 'Set one selected record visibility.',
  revision: 1,
  effect: 'mutation',
  resources: ['document'],
  lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' },
  outputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['visible'],
    properties: { visible: { type: 'boolean' } }
  },
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['visible'],
    properties: {
      visible: { type: 'boolean' }
    }
  },
  execute: async ({ visible }) => {
    visibilityFeature.api.setVisible(visible)
    return { visible }
  }
}

const runtime = createAiAgentRuntime({
  provider: {
    requestActionBatch: async () => ({
      batchId: 'visibility-batch',
      actions: [
        {
          id: 'visibility-1',
          name: 'set_visibility',
          arguments: { visible: false },
          summary: { outcome: 'Hide the selected record' }
        }
      ]
    })
  },
  actionDefinitions: [setVisibilityAction],
  contextProvider: {
    getContext: async () => ({
      selectedIds: selectionFeature.api.ids()
    })
  },
  permissionPolicy: {
    evaluate: async ({ action }) =>
      action.name === 'set_visibility' ? 'allow' : 'deny'
  },
  confirmationHandler: {
    confirm: async () => true
  },
  transactionRunner: {
    run: async (_label, execute) => appTransactions.run(execute)
  }
})

await runtime.run({
  intent: 'Hide the selected record',
  signal: featureAbortController.signal
})
```

The deterministic provider above makes the orchestration readable. Replace it
with an app-approved provider adapter; keep the action schema, permission, and
executor boundaries unchanged.

## Domain validation

The example declares a contract. Registration freezes that contract; it does not
choose a JSON Schema engine for the app. Install `createAiToolMiddleware({ resolve,
validate, classify })` on the existing secured `createAiInvoker({ execute,
middleware }).invoke(...)` boundary. `resolve` returns the registered immutable
descriptor, `validate` returns a concrete schema issue or `undefined`, and `classify`
reports execution status and settlement separately. Keep executor errors and known
partial results; never retry a mutation because its output failed validation.
Provider descriptions remain compact; host-only output/effect metadata stays in
registration until a caller needs it. See the package's Tool Specification for the
contract and the planned reusable-composition lifecycle.

## Flow

1. A Feature starts one explicit AI invocation with an abort signal.
2. The app supplies bounded context and public action descriptions.
3. The provider returns one ordered, server-prepared `AiActionBatch`.
4. Runtime validates the control envelope and registered names.
5. App permission evaluates every exact prepared action.
6. Required confirmation receives a bounded redacted preview.
7. One app transaction runs registered executors in order.
8. Executors call the same app common APIs used by human interactions.
9. Runtime returns a detached bounded result and audit.

## Expected result

One schema-backed visibility action executes, commits once, rolls back zero
times, and preserves the provider-prepared argument identity through permission
and execution. No provider call or AI work occurs merely by importing or
creating unrelated Framework capabilities.

Permission denial, confirmation cancellation, invalid control envelope, or
abort applies no canonical prefix. Executor failure propagates through the one
app transaction runner so its rollback contract owns reversal.

## Validate

Test default-deny permission, confirmation cancel, abort, provider failure,
invalid and duplicate actions, executor rollback, redaction, progress observer
containment, and disposal. Assert the canonical Feature result and the one
transaction boundary; provider output alone is not success evidence.

## Forbidden shortcuts

- no model/vendor SDK or credential lookup in the generic runtime
- no unregistered action or direct model-to-canonical write
- no action arguments in preview, audit, progress, or terminal error output
- no second AI-only transaction/session queue
- no retry after canonical execution begins
- no visual preview requirement as mutation authority

## Canonical sources

- <a href="https://github.com/karote00/asyra/blob/main/docs/ai/framework/packages/ai-agent-runtime.md" target="_blank" rel="noopener noreferrer">AI Agent Runtime contract</a>
- <a href="https://github.com/karote00/asyra/blob/main/docs/ai/framework/golden-paths/compose-ai-agent-runtime.md" target="_blank" rel="noopener noreferrer">Composition golden path</a>
- [AI Agent Runtime package guide](../reference/packages/ai-agent-runtime.md)

## Next

- [Build app-owned retrieval and action](app-retrieval-action.md)
- [Read the AI Agent Runtime guide](../reference/packages/ai-agent-runtime.md)

## Sequential backend operations

A provider can await the optional `executeBatch(batch)` callback supplied to
`requestActionBatch`. Each complete prepared batch passes the ordinary registry,
permission and confirmation path. The receipt contains redacted executor results
and refreshed App context, allowing the provider to choose a dependent next step.
One invocation uses one App transaction runner: normal completion commits once,
and cancellation or fatal failure rolls back all intermediate writes. A receipt
is provisional execution, not a commit or durable acknowledgement. Providers must
not repeat a completed batch or retry after execution has started.

### Composing dependent tools without adopting Design

Keep the action-only composition above for simple Apps. For a multi-step tool host,
register the same immutable definitions with the Runtime and host registry, then
compose `createAiToolHostLibrary` (Node adapter) with an owner executor, validator,
lease adapter and App-selected tool store. Use its existing recipe admission and
invocation; do not create a second interpreter. The owner executor routes canonical
actions through `createBatchExchange` and the Runtime's `executeBatch` callback.
`createExchangeAiProvider` transports these callbacks and their receipts over the
configured App endpoint. The App still owns permission and transaction policy.

`invokeAiToolOwner` from the optional schema entry pins and validates complete
owner values. Feed those complete values to dependent steps; call
`projectToolDelivery` only for the selected model view. `resultDelivery` coordinates
independent retain/delivery choices. Save selected values to the App conversation
context, return their names/provenance, and use `resolveNamedResultInputs` in a
later turn. A saved name is not permission to reuse a request-scoped resource.

The schema entry's existing Lodash peer must be explicitly declared by consumers.
Node adapters are separate imports and do not enter the portable root's browser
graph. The permanent inventory journey under the Runtime tests is an executable
example of these actual public APIs, including correction, two images and reuse.

### Continuing native conversations

For a Node-hosted native model, use `createNativeAiProvider` from
`@asyra/ai-agent-runtime/node` as the provider behind the same exchange endpoint.
It implements `AiProvider`; you do not need another Feature or recipe scheduler.
Provide an executable, model, configuration directory and a `prepare(input,
context)` callback. That callback binds the current host and returns:

- `thread`: stable native instructions and dynamic tool declarations.
- `input(resumed)`: the new request and current App state; include admitted prior
  history only when `resumed` is false.
- `invoke(call)`: dispatch through the registered host and return explicit text
  and image content items. Correctable input failures remain model-visible replies.
- `decode(result)`: interpret the completed native turn as an `AiActionBatch`.
- `dispose()`: release only this request's owned resources.

Pass the same `metadata.conversationId` on later requests to continue that native
thread. Native history is retained across request process restarts; executors,
signals and transaction handles are rebound each time. Use existing named result
storage for values needed by later steps. Native history does not replace it.

The registry defaults to service memory. Inject `createNativeConversations(storage)`
when your App needs durable identity mapping; keep the native history available
in the corresponding provider home. This does not persist the App UI conversation
or named result store automatically. Codex 0.160.0 restores the original tool
contract on resume, so changing tools/configuration requires a new conversation.
The adapter rejects stale contracts and missing history instead of silently
starting over. Keep model credentials, instructions, tool policy and transaction
settlement in the App. See the permanent `native-inventory-journey` Runtime test
for the complete exchange, Knowledge, correction, media and cross-turn reuse path.
