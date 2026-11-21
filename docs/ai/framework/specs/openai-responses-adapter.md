# Replaceable Model Sources and Responses Provider Contract

The App composes one recorded request, tool preparation, invocation and final
settlement pipeline. Explicitly registered sources replace only the model
transport. A third source must be injectable without editing the router or
Design tool code. The registered default is local-codex; openai-responses is
optional. The removed custom HTTP batch source and its configuration are rejected,
not retained as an alias or fallback. Browser HTTP exchange remains the common
App transport. Source-neutral tool bindings belong to Runtime; App prompt,
actions, knowledge composition and transaction callbacks remain in Design.

The optional Node adapter in `@asyra/ai-agent-runtime/node` translates OpenAI
Responses HTTP messages. Apps supply instructions, tool namespaces, current input,
an invocation callback and final decoding. Construction performs no network work.
The adapter does not import an App, execute canonical actions, choose transaction
policy, or implement another Host, result store or knowledge loader.

The service owns conversation leases. Each lease binds an App identity to one
provider configuration and prevents simultaneous turns. A fresh turn receives
fresh execution callbacks and cancellation. Native continuation keeps its stable
thread identity; Responses continuation keeps complete protocol history, including
assistant phase and encrypted reasoning items. Responses uses `store: false` and
never requires additional Conversations API permission. Disposal clears owned
state; external storage lifetime belongs to its injected owner.

Tool publication preserves qualified identities, descriptions and input schema
semantics. Optional fields stay optional; explicit `strict: false` prevents the
API from rewriting them. Host validation remains mandatory. Deferred functions
use the API's tool-search facility. Model call IDs correlate every returned text,
image and outcome with exactly one invocation. A syntactically invalid argument
or unavailable name is a recoverable tool output, not a transport failure.

The adapter preserves complete internal tool handoffs. Model-visible content is
already chosen and validated by its owner; it is neither truncated nor replaced
by a success flag. Tool results are handed back before the next model response.
No fixed turn-count limit, automatic mutation replay or fallback provider exists.
HTTP failures, invalid response envelopes, incomplete generations and refusals
must not be reported as a successful App action batch. Aborting or disposal stops
network work, drains invocation work, and prevents a late response from becoming
a successful turn. Unresolved tool execution invalidates continuation explicitly.

Design supplies the same tool Host and final batch admission for CLI and Responses.
Its environment selects `AI_PROVIDER_BACKEND=openai-responses`, a model and
server-only `OPENAI_API_KEY`. Status reports configuration, not paid connectivity.
Knowledge remains optional untrusted advice. Saved result reuse remains App-scoped
through the existing `ExchangeConversationResults` service owner.

Official protocol references:
<a href="https://developers.openai.com/api/docs/guides/function-calling" target="_blank" rel="noopener noreferrer">Function calling</a>
and <a href="https://developers.openai.com/api/docs/guides/conversation-state" target="_blank" rel="noopener noreferrer">Conversation state</a>.

The App source lifetime owns fresh request controllers and active work for every
source. Disposal closes admission, aborts and drains requests before releasing
continuation. Service teardown cancels pending browser receipt exchanges before
draining source work. Tool bindings observe both current request cancellation and
transport cancellation; no old signal is retained across turns.

The shared Design invocation owner emits exactly one top-level start and terminal
record and terminal progress per invocation, preserving the advertised contract
digest, selected model payload, outcome and settlement. Recipe child observations
keep their own causal IDs. Sources record protocol events only and must not repeat
common tool observations. Observation failures never change execution.

Unavailable continuation remains AI_PROVIDER_SESSION_UNAVAILABLE through App HTTP
and browser/runtime error projection, with actionable new-conversation guidance.
Formal transport fixtures use the provider's actual declarations and the same
authoritative owner contracts. Integration proves canonical execution, partial
completion, selected images and cross-turn saved-result reuse through the shared
Host and browser exchange, not only helper or knowledge-only execution.
