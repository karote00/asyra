# AI Agent Runtime Host Composition

## Status and authority

Proposed target contract for the
[ownership transfer plan](../plans/ai-agent-runtime-ownership-transfer-plan.md),
reviewed against `30f856260a9776f87e0440b1b5b0d88e68a515de`.
This document does not claim that new APIs or adapters are shipped. The current
[package contract](../packages/ai-agent-runtime.md) and
[Tool Specification](../../../../packages/ai-agent-runtime/TOOL_SPECIFICATION.md)
remain authoritative for existing behavior. Implementation must reconcile the
affected current sections in the same slice as each transfer.

The [Flow document](../plans/ai-agent-runtime-ownership-transfer/ownership-transfer.flow.json)
owns the proposed architecture and route boundaries; this document owns the
target behavior and acceptance cases. Executable case bindings remain pending.

## Supported behavior and ownership

An App may continue using registered actions with its own adapters, or opt into
a shared host composition for direct tools, dependent sequences, mechanical
iteration, retained results, selected content delivery and tool discovery.
These compositions use the same registry/invoker/recipe/Knowledge owners.
No new mandatory model planning, discovery, visual review or completion gate is
introduced.

Runtime owns mechanical reference resolution, contract pinning, validation
coordination, composition and result-view selection. Owners supply tool schemas,
domain checks and outcome classification. Optional adapters supply schema-engine,
provider, storage, discovery and Knowledge-source implementations. Apps retain
Feature lifecycle, context, permission, canonical actions, transaction policy,
UI/history, selected sources and credentials. Generic code must not import an
App or recognize its action names, element structures or coordinate conventions.

The package's portable imports remain inert and browser-safe. Node/native/storage
adapters are opt-in, use host configuration and perform no work merely on import.
The fixture's service-owned state does not establish Headless Core support.

## Invocation and contracts

1. The App composes a trusted registry and explicitly enabled adapters. Tool
   descriptions, search results and execution resolve from that registry;
   no shadow list can silently replace identity or revision.
2. The provider receives the adapter-transformed input contract and declared
   output guidance. Transformations preserve supported semantics, including
   local references, alternatives and Unicode lengths. Unsupported provider
   representations fail explicitly, not by widening the accepted input.
3. The host pins the selected invocation contract. It resolves explicit step,
   input and named references, then validates actual arguments against the
   destination contract before execution. Schema projection may establish a
   binding, but is not a replacement for actual value validation.
4. App authorization, state/target checks and canonical execution remain in
   their secured path. Direct calls and composed leaves cannot bypass it.
5. The shared result boundary validates complete owner output with the selected
   success/partial/recovery contract and declared execution status. Valid complete
   results return directly to the existing recipe executor for dependent steps.
   Separately, it selects and validates retained values and provider-visible views.
   No retention or model delivery is required for this internal handoff. A result
   invalid under its pinned contract cannot become a successful step binding.

A producer's output does not need to equal a consumer's input shape. Explicit
existing selectors, recipe expressions or registered conversion tools may map
it into a valid destination value. Do not invent missing data, coerce unrelated
values or add an alternative recipe language. Test the transformed values and
the destination executor, not just schema equality.

### Authored syntax boundary

Design owns the translation of its `stages`, `operations`, `apply`, generated
step identities and canvas dispatch grouping. After pinning the registered
contract and admitting the authored envelope, the host may invoke that owner's
declared syntax adapter. It returns steps/bindings in the existing Runtime recipe
format or an owned translation error; it never executes a canonical operation.
The host admits the translated graph through the existing recipe machinery and
validates resolved destination values before dispatch. Translation does not grant
permission, bypass destination validation or create a second interpreter.

An ordinary registered call or already supported recipe bypasses this optional
translation. Non-Design consumers neither import the Design adapter nor supply
`apply` or Design-specific stage identifiers. Shared named-reference handling
consumes normalized selections rather than traversing Design's authored grammar.

## Retention and content

Retaining a value and delivering a value are independent decisions. Omission of
retain never disables direct dependencies; omission of delivery keeps the
documented delivery behavior regardless of retain. Per-tool external visibility
remains enforced when a request selects output fields.

The host passes selected values, provenance and explicit media metadata to an
App-selected store. Its acknowledgement supplies available names, operation
origin and useful field/type descriptions without sending the entire saved value
to the model. A later tool may resolve a named path privately. Saving a result
that is never reused is valid, not a failure or a reason for another AI call.

Storage scope comes from trusted App context: conversation, principal/tenant and
document identity where applicable. Scope changes, disposed resources and expired
request handles are revalidated; the runtime must not treat an element ID or opaque
handle as proof that a target is still live. Keep named values, ephemeral leases
and durable saved recipe definitions distinct. No new persistent database or
automatic retention of all tool outputs is required.

Producers declare content types/paths; shared transport never guesses images from
Design action names. Selected multiple images, retained images and later redisplay
preserve their provenance and content. Internal-only data does not become public
because a caller asked to retain or deliver it.

## Failures and lifecycle

Every invoked boundary provides its declared result or failure with execution
settlement. Input rejection before dispatch makes no writes and reaches the same
live provider invocation for correction. There is no special success marker,
retry whitelist or automatic mutation replay needed to let AI respond.

Preserve legal partial receipts and recoverable owner output without deciding
whether canonical changes commit. `AiRuntimeOptions.failurePolicy` remains
`rollback` by default; Design's `preserve-progress` is an App choice. For a fatal
invocation failure, the selected policy and transaction adapter determine the
actual rollback/commit result. An input rejection handled within a still-live
invocation is distinct from its final transaction settlement.

Internal step receipts may precede final transaction settlement. Preserve their
execution evidence, but never report provisional writes as finally committed.
The App transaction adapter supplies the actual final settlement to the terminal
result. Unknown settlement stays unknown. Invalid completed results must not
masquerade as successful delivery.

Storage, content or transport failure cannot erase execution history or claim
that an acknowledged write never started. It also cannot promise that an enclosing
transaction will commit: final state still follows the App's transaction policy.
Recovery retries only the failed owned operation when its contract permits it,
never replays completed mutations automatically. A lost native session is reported
as lost, not silently replaced by a new session claiming continuity.

Feature/session ownership remains in the App. Host ordering only coordinates
leaves within an invocation using owner-declared access/overlap rules. On abort
or close, await active owned work and release its resources once. Borrowed
resources survive. Progress observers cannot cancel or poison successful work.
No speculative global cache or second authoritative state tree is introduced.

## Permanent product cases

Use a non-Design order/inventory fixture with trusted App-owned state, an injected
deterministic model endpoint and public built package imports. Its actions find stock,
compute allocations, reserve stock and produce a receipt with declared media.
Do not import Design production/test helpers or reproduce the host inside the
fixture. The fixture may implement its domain and storage adapter; it must use
the actual shared invocation, recipe, validation and delivery code.

### Connected non-Design journey

At least one required integration journey starts at `createAiAgentRuntime(...).run`
and uses the production provider adapter, bidirectional exchange and host together.
The model endpoint is scripted/offline; the provider adapter is not a fake
`requestActionBatch` implementation. Where the native adapter is selected, use
the existing declared CLI with the offline endpoint. The client exchange routes
`executeBatch` back through the Runtime's real permission, action execution,
transaction and receipt path. Node service-owned fixture state is sufficient;
this is not a new App or Headless Core implementation.

Within that one connected fixture: discover capabilities and a Knowledge policy,
submit an invalid quantity and correct it in the same live provider session,
execute stock/allocation/reservation/receipt dependencies, and receive selected
text and two images. One dependency uses a complete result that is neither named
nor delivered. Retain a separate allocation for a later turn and consume it
through the same production exchange and trusted store scope, without manual
fixture reinjection. Ordinary later-turn behavior follows the selected adapter's
session contract; correction continuity is explicitly asserted within the turn.

Capture actual provider wire descriptions/content, executor arguments, canonical
state, transaction settlement, store access and mutation counts with correlated
request/step identities. Fixtures may implement their domain, transaction/store
adapters and model endpoint; they must not replace the shared invoker, recipe
engine, validator, projector, exchange, receipt encoder or schema conversion.
Separate helper/adapter tests supplement this journey and cannot satisfy it.
Run rollback and preserve-progress failure variants on the same production path.

| Case                                          | Required observation                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C01 - Catalog identity                        | Arbitrarily named tools `a`, `b`, `c` are found by declared purpose and input fields. Exact names, ambiguous names, removed entries and revisions resolve consistently across search, contract read and actual execution. Known tools need no compulsory search.                                                                                                                                                                                           |
| C02 - Provider contract semantics             | Capture the actual adapter output, not just raw schemas. Local references, union siblings, closed objects, Unicode and unsupported rules have the specified legal/illegal behavior. Use independent expected values.                                                                                                                                                                                                                                       |
| C03 - Direct and composed handoff             | Stock output is selected/transformed into allocation input and a returned reservation ID feeds receipt creation in one submission. Verify actual destination values and one write; with no retain and status-only delivery, a complete internal result still feeds its successor, with no model readback solely to forward data. Whole-value and equivalent fieldwise bindings agree.                                                                      |
| C04 - Correctable and partial failure         | An invalid quantity rejects before dispatch; the same provider session submits a corrected call and continues. For a fatal later failure, verify both default rollback and explicitly selected preserve-progress against actual final state and transaction settlement. Preserve execution evidence without assuming its writes committed. An illegal success output fails validation; a legal partial result passes. Neither path replays earlier writes. |
| C05 - Retention independence                  | Exercise retain absent/present with default, status-only and selected delivery. Save allocation data without sending the body to AI; in a later turn, resolve a retained path directly into another tool. Verify save/read counts, names/origins and scope isolation. Unused saved results remain valid.                                                                                                                                                   |
| C06 - Selected media                          | Two receipt images arrive as two provider content items; a saved selected image can be delivered later without repeating its producer. Missing content reports delivery failure while preserving execution evidence and the actual App-owned transaction settlement. Action names carry no media authority.                                                                                                                                                |
| C07 - Knowledge and information               | Discover/retrieve a non-Design inventory policy through real Knowledge APIs, then select/redisplay it with provenance. Changed revision, permission and scope invalidate reuse appropriately. Preserve loader/read counts within their declared lifetime and exact paginated content; no new cache claim without measurement.                                                                                                                              |
| C08 - Optional adapters                       | Custom validator/provider/store continue to work. Importing portable exports neither loads Node modules nor starts native processes, storage or network. SQLite compare-and-swap/conflict and Knowledge file errors preserve their owner boundaries.                                                                                                                                                                                                       |
| C09 - Session and transport                   | Test native adapter continuity and browser exchange acknowledgements through their production transport paths, using the existing offline native test setup. Abort, disconnect, oversized/invalid receipt and session loss remain distinguishable; no fabricated completion, silent new session or write replay.                                                                                                                                           |
| C10 - Host lifetime and iteration             | Existing recipe iteration/checkpoints run with owner conditions; independent preparations and exclusive writes retain correct ordering. A rejection does not poison the queue. Leases cannot escape their lifetime; save-only recovery and close release owned resources once without releasing borrowed ones.                                                                                                                                             |
| C11 - Verification can detect broken handoffs | Deliberately remove an ID, corrupt a complete result, lose an image, change settlement, select another contract revision or omit an executed case. The permanent integration checks must fail. A legal transformed value and legal partial result must still pass. The expected answer cannot be produced by the code under test.                                                                                                                          |
| C12 - Adoption and Design preservation        | The connected non-Design journey above uses public built exports and the actual runtime/provider/exchange/host path, not independently passing helper fixtures. Existing Design direct/composed operations, context/coordinates, retained data, images, correction, canonical ordering, undo/redo and collaboration remain correct on the same candidate; no Design shim or old dispatch path remains.                                                     |

These cases are required outcomes, not implemented test claims. Stage 0 must map
them to runner-emitted permanent cases before implementation. Record actual
execution and assertions, never acceptance from aggregate test counts.

## Definition of done

All required cases pass on one candidate, the transferred App implementations and
conflicting active rules are removed, and public examples execute without Design
imports. Relevant package type/build, focused tests and final AI conversation
verification pass. Existing canonical behavior remains owned and tested at its
original boundary. No new dependency, public support claim, paid model test,
publication or new product feature is implied by this target contract.
