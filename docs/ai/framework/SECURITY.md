# Framework Security Boundaries

This document records security-sensitive framework ownership boundaries. It is
not a deployment security audit or a substitute for an adopting app's threat
model, backend authorization, credential management, monitoring, or incident
response.

## AI Agent Runtime

`@asyra/ai-agent-runtime` treats provider output as untrusted data:

- model output can select only a registered action name;
- the complete plan must normalize and pass every registered action schema
  before permission, confirmation, transaction, or execution;
- permission is app-owned, evaluated for every action, and default behavior is
  not inferred by the runtime;
- confirmation receives a detached redacted complete preview;
- arbitrary code, expressions, dynamic imports, package-private APIs, Render
  objects, engine objects, and app-private stores are not action inputs;
- one accepted plan executes only through registered app executors and one
  app-owned transaction runner.

The runtime does not turn model output, audit output, explanations, or provider
diagnostics into canonical state. App executors must continue through their
ordinary common/public APIs and canonical validators.

## Credentials and Provider Transport

The generic HTTP provider is a transport adapter, not a credential store:

- use an app/backend proxy for model-vendor API keys and production
  authorization;
- do not embed a server API key in browser code, runtime metadata, source,
  environment values exposed to the client, local storage, or test fixtures;
- the adapter accepts only an app-selected HTTPS or same-origin endpoint;
- importing or disabling AI creates no provider, network, timer, listener,
  secret read, or Feature side effect;
- live-provider smoke tests are opt-in and never CI authority.

The runtime recursively redacts built-in authorization, token, key, secret,
password, and cookie field patterns, configured additional secret keys, and
authorization-like string values. Provider failures are mapped to stable
messages; raw response bodies and third-party exception messages are not
returned.

Redaction is defense in depth, not authorization. Apps should disclose only the
minimum provider context needed for the requested task.

## Permission and Transaction Boundaries

Permission and confirmation occur before the transaction opens. Denial,
invalid plans, cancellation, abort, and provider timeout produce no accepted
canonical prefix.

Executor failure occurs inside the one app transaction boundary. The app and
Factory own rollback, undo history, persistence, and optional shared
publication. The runtime owns no independent recovery log or canonical repair
path.

## Collaboration

`@asyra/collaboration` transports completed Factory publications and ephemeral
Awareness only. It does not authenticate users, authorize actions, validate app
domain payloads, resolve conflicts, retain history, or provide durable
recovery. Receiving apps and production backends own those controls.

AI origin does not weaken or replace that rule: shared AI mutations use the
ordinary Factory publication and app-owned remote-validation route.

## Resource Ownership

Runtime and transport compositions dispose only explicitly owned resources.
Borrowed providers, app APIs, canonical owners, Render instances, and
Collaboration instances remain with their declared owners. Disposal prevents
new AI work, aborts active request signals, waits for active runtime settlement,
and removes request-local listeners, timers, retry state, and detached
intermediate values.

## Dependency audit and delivery policy

`yarn security:audit` checks all Yarn workspaces and both production and
development dependencies at the high/critical threshold. Yarn owns dependency
resolution and scope: the recursive scan includes indirect dependencies; the
non-recursive `--all` scan includes direct workspace dependencies.

- Retain every recursive advisory, including package, affected/installed versions,
  advisory URL and dependency information, in the command log and per-run evidence.
- A finding only in indirect dependencies is informational for delivery. It does
  not require an App workaround, a forced transitive override or waiting for a fix.
- A finding in the direct scan blocks delivery, including a package that also
  appears indirectly. Repair the directly selected dependency, or wait for an
  appropriate upstream version before upgrading with normal authorization.
- Registry failures, process failures, malformed/truncated reports and evidence
  write failures block validation; they are not indirect-dependency exceptions.
- Do not suppress advisories or exclude packages to implement this distinction.
  Keep both scans and their raw outcomes. An informational advisory remains an
  unresolved upstream issue, not a statement that the package is safe or fixed.

The shared entry is `scripts/security-audit.mjs`; local validation, CI and
existing delivery consumers use that same entry. Each invocation retains raw
NDJSON, stderr and a summary under `tmp/security-audit/`. The earlier
advisory-specific ignore list is superseded by this ownership policy.
