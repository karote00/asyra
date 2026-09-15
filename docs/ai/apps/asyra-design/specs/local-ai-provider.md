# Local AI provider

## Supported behavior

The App server selects `AI_PROVIDER_BACKEND=http` (the existing default) or
`local-codex`. HTTP retains its endpoint, model, and API-key configuration.
Local Codex requires an installed compatible Codex app-server, a configured
`AI_PROVIDER_MODEL`, and the user's own ChatGPT subscription login. The optional
`AI_PROVIDER_EXECUTABLE` selects the installed executable; otherwise use `codex`.
No dependency installation, login, account switching, or API fallback occurs.

The existing same-origin action-batch endpoint remains the only browser route.
For local Codex it admits only loopback peers, loopback Host, JSON requests, and
same-origin browser requests. A hosted service cannot borrow a visitor's login.
The exact registered sample keeps its existing provider-free behavior.

## Owner and data contract

`request-backend-action-batch` owns selection, provider invocation, and errors.
Each accepted ordinary request owns one ephemeral app-server thread and one
child process. No process or model work starts on App startup. The process is
closed before success or failure settles. Cancellation, a five-minute deadline,
protocol errors, unavailable login, and malformed output cannot publish a batch.
Parallel turns have independent process, output, cancellation, and configuration.
No retained cache or cross-turn conversation is introduced.

Only submitted intent, bounded context, registered action descriptions, accepted
images, and the backend domain prompt enter the model request. Native image
inputs carry image bytes once; prompt metadata omits those bytes. Local Codex
has no filesystem, shell, web, plugin, MCP, or external image-preparation tools.
Image understanding and action generation are supported; requests requiring an
unavailable image tool fail instead of inventing its result.

Codex manages its own credentials. The App never reads, copies, serializes,
returns, or logs credential files, account identity, provider stderr, or raw
protocol errors. Only the account type is checked in memory. Configuration and
credentials are excluded from templates. Authentication and rate limits remain
with the user's subscription; inference still runs remotely.

Only a completed final JSON `AiActionBatch` envelope reaches the existing
runtime. Commentary, reasoning, tool events, failed/interrupted turns, malformed
JSON, and unknown backend selection cannot become product output. Existing
permission, transaction, canonical mutation, rendering, and collaboration owners
remain unchanged. There is no provider retry or fallback in this adapter.

## Product cases and completion gates

Permanent server tests cover explicit/default selection, unchanged HTTP,
missing model/executable/login, API-key account rejection, valid final output,
malformed/oversized protocol, failed turn, tool requests, cancellation before and
during execution, timeout, child closure, image input, concurrent isolation,
and loopback/origin admission. Provider errors expose only stable codes.

Run server tests, App typecheck/build/test, naming/lint, Inspector contracts,
template regeneration/parity, and generated-consumer readiness. Inspect the
staged diff and generated template for personal data before PR delivery. CI
must pass on the final PR commit. A mocked protocol test does not claim live
subscription execution; report separately whether a compatible local CLI was
available for a live check.
