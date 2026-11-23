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
thread identity; Responses submits stable instructions as initial developer input and uses
`store: true` with `previous_response_id` for each successor. Only new content
and outstanding correlated receipts are submitted. Current request guidance
remains request-scoped. Missing remote state is explicit and cannot trigger
automatic mutation replay. The App owns a durable SQLite checkpoint containing the stored response ID,
issued call IDs and outstanding calls and receipts. Persist the dispatch claim
before a tool runs and its exact correlated text and media before continuing.
An interrupted dispatch with unknown settlement blocks re-execution. A clean
restart can forward an acknowledged receipt and resume without another tool
invocation. The App commits the operation identity, arguments and delivered result
atomically with the checkpoint. Acceptance by the successor removes the pending
payload from the next request while the App retains its operation receipt.
No Conversations API permission is required. Disposal releases runtime resources;
the App owns the lifetime of its durable checkpoint.

The Design Responses source publishes the available App entries from the Host registry. Design operations expose `search_design_tools`, `read_design_resources` and `execute_design`. Advice exposes `discover_knowledge` and `read_knowledge` in its own namespace. The App owns these choices; the Responses adapter keeps their declarations local until requested. The initial developer input lists the available qualified entries and their purposes, one per line. Each HTTP request declares a small client-executed tool search. It accepts exact names and returns selected namespaces in a correlated tool_search_output. A later function call uses its native namespace and the same Host. The stored response chain keeps loaded tools callable across user turns. Explicit searches can reacquire definitions. Unknown names return an empty selection. Apps can independently supply eager functions. A known operation can execute directly through the Host. Unknown capabilities can be located by purpose and input fields. Standalone native and registered routes carry their ordinary invocation through execute_design. They remain ineligible for composition when the owner forbids it. Authorized hosted web search is requested through the client loader by exact name. Its native declaration is sent on the following requests of that turn; the next user turn starts with research inactive. Changing activation leaves the authorized conversation contract intact. Published counts and contract evidence describe the actual provider subset. Downloaded public references retain their original App bytes, identity and dimensions. Responses receives an aspect-preserving overview of at most 1280 pixels per side; its media dimensions describe the delivered pixels.

Generic runtime tool publication preserves qualified identities, descriptions and input schema
semantics. Optional fields stay optional; explicit `strict: false` prevents the
API from rewriting them. Host validation remains mandatory. Deferred functions
use native client-executed search. Checkpoint pending search call IDs and selected identities under the same binding digest, reconstructing outstanding tool_search_output from trusted schemas on retry. Model call IDs correlate every returned text,
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

Offline diagnostics correlate the individual Responses usage receipt and each
outgoing client tool-search definition with the response identifier. Definition
bytes measure serialized UTF-8 JSON, not model tokens. Record identities and
sizes separately from model content, including cache-write counts and lifetimes
when the provider supplies consistent figures. Keep diagnostic records outside model input.
