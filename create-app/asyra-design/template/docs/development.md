# Development

## Requirements and start

- Node.js 24.x
- Yarn 4.3.1, or the package manager selected by the generator

In the monorepo, install and build from the repository root, then run
`yarn dev:all`. In a generated project:

```bash
yarn start
```

Open `http://localhost:3000/?fileId=my-design`. The `fileId` must be non-empty.

For the complete collaboration and durability path, run these in separate
terminals:

```bash
yarn document:backend
yarn collaboration:server
yarn start
```

## Common changes

- New tool or command: add a registered Feature, centralize identifiers, route
  mutation through a common API, and test both the owner and user behavior.
- New model field: define schema and load fallback with the canonical property
  owner before adding UI controls.
- New panel control: keep the component derived from state; send writes through
  a controller/common API.
- New overlay: register an App render layer through the public Core boundary;
  do not import a concrete render engine.
- New AI action: define App schema, permission, confirmation, and transaction
  execution. Model output is never canonical state.
- New collaboration behavior: keep transport generic and place document/domain
  acceptance policy in the App.

## Verification

Run the focused owner test first. Before handing off a general App change, run:

```bash
yarn typecheck
yarn react:build
yarn test
```

Browser changes also require the relevant Playwright suite. Collaboration
changes require the complete local services and `yarn test:e2e:collaboration`.
Do not treat a screenshot as a substitute for a source-space or state-owner
assertion.

## Local AI usage records

Each `local-codex` drawing provider invocation emits one JSON line to the App
server's standard output with `event: "ai_request_usage"` and `schemaVersion: 1`.
Keep your normal server logs to retain these records; this does not create a
separate usage database or send telemetry elsewhere. Connection probes produce
no drawing usage record. The HTTP provider has no token accounting contract yet.

Records include a unique `requestId`, configured model, attempt, elapsed time,
provider outcome, and validated conversation/turn/reply identifiers when supplied.
They omit prompts, images, tool arguments/results, account details and credentials.

`tokens` contains the latest valid provider-reported cumulative snapshot for the
invocation: `inputTokens`, `cachedInputTokens`, `outputTokens`,
`reasoningOutputTokens`, and `totalTokens`. Tool follow-ups and visual reviews
inside that invocation are already included. Repeated notifications are not
summed. Cached input is a subset of input; reasoning output is a subset of output.
Do not add those subsets again. Elapsed time includes backend/tool waiting and
is not a measure of model compute or billable tokens.

- `reported`: the provider completed and supplied valid usage observations.
- `partial`: the invocation failed, was cancelled or timed out after a valid
  observation, or supplied malformed usage data. Counts are observed evidence,
  not a guarantee of final billed usage.
- `unavailable`: no valid observation; `tokens` is `null`, never an invented zero.

For a complete user request, follow `replyToTurnId` to include clarification
turns, group attempts by `conversationId` and `turnId`, and sum each unique
`requestId` once. Concurrent invocations remain separate. Keep partial and
unavailable records visible when calculating averages; do not interpret missing
usage as free work. These token records do not establish subscription percentage
or monetary cost. Provider outcome does not certify final document settlement.
