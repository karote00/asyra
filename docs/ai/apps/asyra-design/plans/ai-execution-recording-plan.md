# AI execution recording

Status: completed locally; final live evidence recorded in the parent results.
Parent: [improvement plan](ai-execution-improvement-plan.md).

## Outcome

Every provider invocation retains a locally readable, versioned execution record
that survives normal request completion and makes successful, failed, cancelled,
partial and interrupted work distinguishable. A step can be located by request,
call and sequence; records never become a canonical scene or completion authority.

## Owner and design

Extend existing `local-ai-usage.ts` at Inspector `observe`, composed at the
existing provider boundary. Keep its current console summaries for consumers.
A dedicated App-server file sink stores one append-only JSONL per request under
the project's ignored runtime directory. It consumes already sanitized events,
does not copy geometry/images/prompts, queues ordered writes, reports sink errors
without changing drawing settlement, and exposes a drain hook for orderly tests
and shutdown. Missing terminal records are incomplete, never successful runs.

Record actual lifecycle events: provider RPC, tool admission/execution/end,
research, capabilities and settlement. Include model/effort and configured source
identity when available, wall-clock timestamps and monotonic elapsed durations;
absent identities remain unavailable. Tool metadata retains exact requested API
names/field selectors and input/output artifact references, bounded summaries,
explicit truncation and byte counts. Do not infer causal dependencies, source
quality, hidden reasoning or model-visible tokens from transport alone.

A pure reader reconstructs step spans, union accounting and unresolved calls
from records; retain malformed/incomplete evidence as diagnostics. Do not compare
separate requests as retries without a recorded relationship. Diagnostics must
not block user work with a second AI call or serialize the whole scene per step.

## Execution slices and gates

1. `observe`: formal tests for missing query selectors, ordered durable events,
   complete/failed/cancelled settlement, incomplete streams, redaction, bounded
   payloads, overlapping spans and unknown time. Prove gaps before production.
2. `observe`: implement record/sink/reader, integrate provider with unchanged
   console contract; permanent injected sink/clock tests plus normal caller
   integration. Test write failure and concurrent request isolation.
3. Sync execution spec/Inspector/proof and portable provider docs. Naming,
   focused usage/provider/proof tests, App typecheck/build and scoped lint pass.

Naming: neutral `ExecutionRecord`, `ExecutionRecordSink` and schema-versioned
diagnostic events owned by the App server, separate from document wire schemas.
No migration of old logs; the reader labels their absent fields explicitly.
No automatic deletion of historical logs or `.env` files. Source revisions and
configuration metadata must not collect secrets or run Git on every tool event.

## Active step card - observe

Spec: `ai-execution-flow.md#ownership-and-diagnostics` and execution recording
section. Inputs: actual provider lifecycle, queue/execution spans, sanitized
receipt summaries. Outputs: trace plus durable diagnostic record. Missing
provider fields bypass attribution; sink failure belongs to observe and cannot
fail drawing. Allowed: existing usage instrumentation and bounded receipt
timings. Forbidden: raw prompts/credentials/geometry/private reasoning and
diagnostics deciding output. Boundary: existing usage/provider files, new
execution record/sink helpers, and direct formal tests declared in Inspector.
No cache. Gates: tests above and existing accounting proof. Stop for any required
canonical mutation, unavailable semantic input, or unproven payload privacy.

## Evidence

- Baseline naming: 12 checks passed. Exact-selector regression failed before
  adding selector fields; persisted brief redaction, missing sequence and native
  item lifecycle regressions each failed before their corrections.
- Source-bound flow candidate `c15a4397-b982-4ffd-9b26-47c09f83133c` preserved
  seven existing owner cases; observe-boundary contract review
  `3bc7ce6363fda00ec081ba7dc41c74068fa5a179958adf2243d47e9bbe3d063c`
  had no blockers and was accepted for this slice. This initial proof does not
  substitute for the new recording tests or final source re-verification.
- Four focused suites passed 104 tests, with three pre-existing opt-in tests
  skipped. New file I/O tests use project-local temporary directories and
  validate actual successful writes, isolation and filesystem failures.
- Existing console logs remain available; version-2 local records are additive.
  App model/effort, canonical mutations, Undo and drawing quality gates unchanged.

- Final source-bound candidate `da2f2e3c-aad1-4ed8-9cb5-fd4ee67a1947`
  passed all seven owner cases. App typecheck/build, naming (12 checks),
  Inspector contracts (27 tests), scoped lint (no errors; three diagnostic
  console warnings) and diff whitespace checks passed. No push occurred.

## Final acceptance

See [parent results](ai-execution-improvement-results.md). The successful live
request, period report, independent post-run process opinion, zero-call reuse of
current visual-review opinion, native detail screenshots and full recording are
retained locally. Speed and visual limitations remain explicit; model opinion is
not user approval. No push.
