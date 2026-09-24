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

## Local environment

Before starting services, copy `.env.example` to `.env` in the App directory
(`apps/asyra-design` in the monorepo, or the generated project root):

```bash
cp .env.example .env
```

All three service commands above load this local file. The example configures
local collaboration, document persistence and Codex subscription access. Install
Codex and sign in, then select a model available to your account using
`AI_PROVIDER_MODEL`. Set `AI_PROVIDER_EXECUTABLE` to an absolute executable path
if `codex` is not available on PATH. Existing shell environment values take
precedence. Keep machine-specific settings and secrets in `.env`; never commit it.
The example is setup documentation, not a test fixture.

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

### Native backgrounds before tracing

Local AI can use `vectorize_image_layers` after deciding that a solid native
rect/oval better represents the intended background. It supplies source bounds,
fill, tolerance and an explicit clipping choice. The backend separates matching
pixels only inside that region, traces residual pixels and prepares the native
base below the vectors in a shared source frame. Matching interior colors remain
visible through the base; this is not semantic object segmentation. Gradient or
textured backgrounds require another supported strategy. Both review stages and
one-turn Undo still apply. Four image calls bound parameter refinement.

sharp is a local, free dependency. See
[third-party notices](../THIRD_PARTY_NOTICES.md) before redistributing native
binaries; dependencies retain their own licenses independently of this App's MIT
license. PNG/JPEG/WebP decoding is limited to four million pixels and 16 MiB.

Image preparation requires an explicit representation plan in ordinary `vtracer`
parameters: `preserve-vectors` with a reason, or `separate-background` with a reason
and the native background parameters. The server executes that choice and returns
plan evidence for review. Missing plans return to the model for correction before
conversion. This prevents silent whole-image tracing, without having the backend
choose shapes. The optional live App regression is `local subscription traces the reference logo`
in `e2e/local-ai-provider.spec.ts`, enabled with `E2E_LOCAL_AI=true`. It uses the
configured local subscription and checks the native-base result for an ordinary
user request without specifying the primitive or separation parameters.

### Local contour quality tools

The local provider exposes `review_vector_contours` and `apply_contour_refinements`.
AI selects intended straight/smooth regions; backend computes bounded proposals
and validates a new request-local artifact before existing insert/replace actions.
The 0.5 source-pixel cap is relative to the original trace across all passes, not
reset on each refinement. No blanket smoothing or raster-fidelity claim is made;
sharp corners, compound/unsafe paths and exhausted budgets remain explicit limits.
Both source and derived artifacts stay available for visual comparison/reversion.
The deterministic contour unit/tool/E2E tests do not consume an AI subscription.

Contour review requires `quality.mode` (`faithful` or `cleanup`) and
`quality.targetSize` in final drawing pixels. Faithful reviews are measurement-only.
Cleanup must stay within 0.5 source pixels and 0.5 final drawing pixels, even across
multiple passes. Preparation rechecks actual dimensions, so resizing a refined
artifact beyond that budget is rejected; review at the intended size or retain the
original. Screen zoom does not change the budget.

### Flat-palette edge coverage

Explicit foreground palettes classify source alpha composited over the selected
native base before tracing. Nearly transparent matte colors must not become
solid fragments. Retained flat colors form a binary mask; no-palette source
colors/alpha remain unchanged. This does not establish exact shared boundaries
between traced paths and a native curved base; rendered contact review remains
required, including in faithful mode.

Activity keeps one fixed-height current label above the append-only history.
Detailed messages appear only in the history, so changing message length does
not reposition existing rows.
