# Replaceable AI Sources and OpenAI Responses Adapter

## Task contract

Continue `codex/openai-api-integration` in its existing worktree. The coordinating
agent owns this plan. The authorized outcome is one App request lifecycle,
invocation/observation, delivery and continuation pipeline with replaceable model
transports. Remove the custom HTTP batch source; it is not a supported exception.
Preserve native evaluation/reporting, ordinary conversation behavior, canonical
transactions, Host validation, knowledge, named results and selected media.

Allowed changes: the runtime provider boundary, Design source composition,
request/progress/error handoffs, their direct consumers, formal tests and current
specification/Flow documentation. No compatibility aliases, weaker admission,
new dependencies, paid API calls, 101, repository-wide tests, push or PR creation.
Review only these owners, their direct consumers and the selected gates. Stop
and replan this bounded work if the owner design fails repeatedly.

## Confirmed review findings

- App cancellation did not reach the API request's internal tool controller.
  Provider preparation also ignored its current cancellation context.
- Native transport alone recorded top-level invocation start/completion and sent
  terminal tool progress; the shared Host deliberately omitted those calls.
- Browser error translation changed unavailable continuation into invalid
  configuration, removing the actionable reason in runtime failure projection.
- The non-Design proof advertised an `id` schema but invoked a `quantity` owner.
  A passing owner result did not prove the advertised contract was usable.
- The retained HTTP batch source bypassed tool-calling continuity and execution.
- Existing API integration exercised knowledge and named values but did not prove
  canonical mutation, partial completion and selected media across the exchange.

The prior implementation-complete assessment is withdrawn. Earlier passing runs
remain historical evidence only; they do not satisfy the cases below.

## Owner flow and ordered steps

1. **Request lifetime (App source and service).** A shared source lifetime owns
   admission, fresh request cancellation, active request draining and service
   disposal. Caller Stop, source disposal and connection teardown reach the model
   and tool owners. The service cancels and drains pending receipt exchanges
   before disposing conversation registries and record collectors. Native and API
   sources use this lifetime; transport-specific state stays in each adapter.
   The common tool owner links the request signal and detaches it on cleanup.
   Regressions: API fetch abort, abort during tool work, late completion rejection,
   source/service disposal with a pending exchange, no later admission, fresh next
   turn callbacks. Cleanup must await real work, not a timeout race.
2. **Invocation observation (shared Design tool owner).** Move the existing
   top-level invoker observation, purpose selection, progress and exact delivered
   payload recording out of native transport. One call has one start and terminal
   observation, including input rejection, partial settlement and delivery failure.
   Keep recipe child IDs and native protocol diagnostics distinct. Diagnostic
   failure cannot change execution. Regressions run both sources and compare
   causal progress, contract digests, output, callback counts and cleanup.
3. **Source and error contract (App routing and browser).** Delete the custom HTTP
   batch implementation, registration, configuration and tests protecting it.
   The default source is local-codex; explicit removed/unknown identities fail
   without fallback. Keep the browser HTTP exchange: it is transport to the App,
   not the removed model source. Carry session-unavailable through browser/runtime
   projection without classifying it as a configuration error. Preserve secret
   isolation and inference-free readiness.
4. **Complete handoff proof (runtime and App integration).** Derive scripted model
   calls from the declarations actually sent to the provider; validate against
   those declarations and the authoritative owner. Correct the non-Design case
   without weakening either contract. Exercise real Host and browser/server
   exchange for a canonical action, partial completion, continuation, named reuse
   and selected images. Broken publication or handoff must fail the oracle.
   Preserve App transaction ownership; fixture transport must not implement a
   competing executor/validator. Run focused adjacent native and browser cases.

Internal names `createDesignModelSource` and source request controllers belong to
App lifecycle composition; they are not persisted identities. Existing tool,
conversation and error identities remain authoritative. Remove obsolete HTTP
configuration names instead of accepting them as aliases. No new cache is needed;
per-request tool composition and service-owned continuation retain their lifetime.

## Step execution and review

Before each owner edit, reread its Flow node and the specification. First add a
permanent regression and record its failure on current production code. Then
implement the canonical owner, review direct consumers and run the affected
focused tests before advancing. Use actual provider declarations and invocation
counts, not copied schemas or aggregate passing counts. Record evidence under
`/Users/asa/Desktop/workspace/asra/tmp/openai-api-integration/`.

Gates: focused runtime/provider, source lifetime, App exchange, native preservation,
browser conversation/results tests; affected type checks, scoped lint/format,
naming and documentation/Flow validation. Existing native registration may run
without inference. Live API acceptance, Claude/Gemini implementations and API
101/reporting are outside this task.

## Status

All four owner steps are implemented and reviewed against the current contract.
The shared source closes admission and drains cancellation; shared invocation owns
records and progress; unavailable continuation preserves its public reason; the
custom HTTP batch implementation, configuration and redundant image catalog are
removed. Current image definitions, not the removed catalog, remain the test oracle.

Formal red evidence is retained in `repair-lifetime-red.log`,
`repair-service-red.log`, `repair-observation-red.log`, `repair-routing-red.log`,
`repair-contract-red.log` and `repair-terminal-red.log` under the task evidence
root above. These exposed cancellation, service draining, missing observation,
source/error routing, mismatched advertised schema and pre-invocation settlement.

Focused acceptance covers 455 distinct cases:

- App source, common invocation, service exchange, routing/status and prompt:
  90 cases. `repair-app-final.log` and `repair-observation-prompt-final.log`.
- Native provider preservation: 302 cases, including the separately enabled
  installed-client registration check without inference.
  `repair-app-final.log` and `repair-native-registration.log`.
- Browser provider: 47 cases in its required jsdom environment.
  `repair-browser-final.log`. The first combined Node invocation had one
  `location is not defined` environment failure; it was not a product failure
  and no assertion or product code was changed to bypass it.
- Non-Design Responses and conversation leases: 13 cases.
  `repair-runtime-final.log`. Publication now derives from the same registry
  schema used by the Host, with legal and illegal input assertions.
- Actual controller/Feature/runtime/browser/server/Responses/Host/Core: three
  cases. `repair-canonical-final.log` proves repair in the same model turn,
  unavailable actions without mutation, canonical partial completion, named
  targets reused in the next turn, exact terminal progress/output pairs and
  selection of one image from two captures. Only the model transport and rendering
  snapshot boundary are substituted; canonical mutations and result storage are real.

The first retained sequence reports failed status with partial settlement when its
partial successor stops execution; the later resolved batch reports partial status
with partial settlement. Both preserve accepted work and reach the same model.
Assertions distinguish these legitimate owner contracts rather than deriving status
from settlement. Cancellation before dispatch instead reports not-started, never
unknown execution. The two old native ephemeral-thread expectations now match
source-owned leases while retaining the continuation, attachment and no-replay assertions.

Runtime, App server and full source-integration TypeScript checks pass. Scoped
lint has no errors (one existing native-test console warning); naming, formatting,
local links and Flow admission are checked. No full repository suite, 101, paid
inference, commit or push was performed. This proves the bounded source handoff,
not model quality or live Responses service acceptance.

Specification: [Responses adapter](../specs/openai-responses-adapter.md).
Flow: `openai-responses-adapter/responses-adapter.flow.json`.

## Drawing follow-up on the same branch

The Taipei Dome run exposed two Design-side contracts. Keep geometry in the
Preset geometry owner and the application tool catalog. The
Responses adapter has no geometry policy. Verify the recorded group scale,
ordinary arguments versus named dependencies, nested proportional resize,
editable leaves, and Frame exclusion with focused regressions. No paid inference
is required for these deterministic handoffs.

## Offline discovery cost follow-up

Replay the two Dome path-operation searches through the real Responses request,
Design catalog, Host and subsequent provider input with a scripted transport.
Distinguish related candidates from a full vocabulary match and retain navigation
to all matches and exact usage. Remove repeated candidate payload without
changing execution admission, complete selected usage, user drawings or selected images. Measure model-visible bytes on both sides.

For server tool search, preserve protocol ordering and record the actual returned
definition identities and serialized sizes correlated to the response, without
persisting schema contents in transport diagnostics. Test the persisted trace and
the following request independently. Local measurements do not establish token
savings or the contents of a past server-side search. No live inference.

The original first pages measured 18,010 and 18,523 UTF-8 bytes. The same
queries now deliver 2,743 and 2,656 bytes through the model transport fixture.
The vector query's remaining candidates are reachable once each, and the
selected operation still supplies its usage contract. Partial matches retain
the reference-research route. Two Core property descriptions now put their
actual purpose before their Group size restriction so the grouping operation
ranks first even under opaque identities. The observed drawing
input used four fill templates, two motif templates and nine surface grids.
The final selected execution receipt was 1,660 bytes in the retained text
payload. Preserve that host expansion and selected delivery. Provider response
receipts now distinguish reported cache reads and writes from model output;
definition byte counts cannot partition billed tokens among individual tools.

## Incremental Responses continuation

Use stored Responses over HTTP. Publish stable developer instructions once at
the start of the input. Send request-specific guidance for the current request.
Link each successor to its last accepted response and submit only new content
or the correlated tool receipts. Preserve the current callable catalog, Host
validation, selected media, cancellation and settlement semantics.

First prove request boundaries with an offline scripted transport. Then connect
the service-owned checkpoint to durable App storage. Record execution intent
before dispatch. Commit the actual correlated operation receipt together with
the continuation checkpoint before the next model request.
An ambiguous mutation must never be retried automatically. Verify recovery,
isolation, input size, and exact-once delivery of acknowledged effects across
service restart. Use focused runtime and App tests without model inference.
