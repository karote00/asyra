# AI execution evaluation and periodic reports

Status: completed locally; final live evidence recorded in the parent results.
Parent: [improvement plan](ai-execution-improvement-plan.md).

## Outcome and boundary

Completed records yield evidence-linked findings and a report over an explicit
time interval. Every finding identifies a step, observation, confidence and
possible remedy. Missing evidence stays unknown. App-server diagnostics own this
projection; it cannot mutate drawings, approve completion or rewrite prompts.

## Tasks

1. Implement deterministic assessment from actual events: rejected inputs,
   unresolved tools, long observed owner spans, payload size and supported
   duplicate-query candidates. A repeat is not automatically waste; compare
   exact selectors and available revision/dependency identity. Count overlapping
   durations by union. Do not equate bytes with tokens or unknown time with
   reasoning. Label thresholds as report filters, not machine timing pass gates.
2. Offer one post-run AI assessment over a compact recorded summary and explicit
   requested criteria, through the existing provider infrastructure. Separate
   its duration/usage from drawing and deterministic findings. Never call it per
   tool step. Record success, failure/unavailable and evidence references; a
   self-assessment does not certify visuals. Reuse existing final visual review
   evidence when adequate rather than invoking another review of the same work.
3. Produce an on-demand period report (date range, default recent seven days)
   grouped by model/configuration and comparable task metadata when present.
   Include frequencies, affected runs, partial-record counts and candidate
   improvements. Support attaching user feedback separately from model opinion.
   No scheduled cloud job or external notification is required.

## Cases and completion

Tests: completed and partial runs, no records, malformed records, unavailable
usage, parallel spans, distinct queries, changed revisions, duplicate candidates,
rough-vs-detailed criteria, AI unavailable, date-boundary inclusion and duplicate
run identity. Formal fixtures never masquerade as independent model samples.
CLI/report integration and docs explain exactly how to inspect a run/period.
Run the report over final live evidence and report limitations. Never claim
statistical speed/quality improvement from a single drawing.

## Active step card - observe report projection

Spec: execution flow, Ownership and diagnostics / Execution evaluation.
Inspector: observe (trace owner), no new canonical route. Inputs: versioned local
records, explicit date filters, separate optional feedback keyed by request ID.
Outputs: deterministic findings and period projection with source request/call
and sequence references. Missing or truncated fields remain unknown; duplicate
queries require exact untruncated selectors and recorded revision. Existing
visual review evidence is model opinion, not measured visual correctness.
Allowed contributors: record reader, receipt summaries and caller feedback.
Forbidden: canvas mutation, timing pass thresholds, inferred reasoning, hidden
quality criteria. No cache. Failure belongs to observe; malformed files are
reported and excluded from unsupported comparisons.
Boundary: local-ai-records.ts (read only), new local-ai-evaluation.ts and its
formal tests; reporting CLI/config and registration when added. Stop before any
new provider assessment protocol; that is a separate compose segment.
Gates: no-data/partial/overlap/revision/truncation/date/duplicate tests, scoped
lint, App typecheck, source-bound observe proof and report CLI integration.

## Deterministic report checkpoint

Implemented saved-record run and period reports, separate feedback/model opinions,
exact-selector repeat candidates, incomplete/failure/unavailable-result findings,
and a read-only CLI. Retained writer arrays are decoded only when complete.
Real historical run `0581ec09-dcdf-43d9-8243-1d3ee80130fb` can be inspected without
replaying the drawing; its transport-success/unavailable-result distinction is
now visible. Historical evidence is not a new performance sample.

Focused reader/evaluation/CLI/owner-proof tests: 25 passed. App typecheck and
report build passed; scoped lint has no errors (one existing diagnostic console
warning). Naming and Inspector contracts passed. Source-bound candidate
`c1c6d704-26bd-47a1-9e8f-46925dc599d5` passed, with observe contract review
`d7aad7477f6a84a91515673bb9660dc05cdba66a5c8db4ddf2073f04e3a95ba7` accepted.
Optional separate post-run model assessment remains for the next segment;
final live report acceptance remains in the parent plan. No push.

## Active step card - observe optional model assessment

The next observation segment reuses the native provider transport for one
explicitly requested post-run assessment. This is a separate diagnostic request,
not another drawing composition: it has no App tools, web search, Code Mode,
canvas executor or document context. Input is a bounded report projection and
explicit requested criteria; output is attributed opinion with known call IDs,
separate duration/usage references, or a recorded unavailable/failure status.
Existing adequate visual-review opinion is reused when visual assessment is the
requested purpose; process-efficiency assessment is distinct. No per-step model
calls. Missing evidence remains unknown. Failure belongs to observe.
Allowed files: provider transport, recording metadata, evaluation owner/CLI and
direct tests already in observe, plus a dedicated assessment projection helper.
No new dependencies, model change, canonical writes, cache or implicit execution.
Gates: native envelope proves no capabilities; one-call/zero-call reuse tests,
invalid citations, model failure, separate-record metadata and CLI tests; existing
provider tests, typecheck, naming, scoped lint and source-bound proof. Stop on any
need for canvas access or hidden reasoning.

## Optional assessment checkpoint

Implemented one explicit capability-free local-model assessment, separate usage
records, persisted version-1 opinions and period-report inclusion. Current visual
opinions can be reused when they cover the requested criteria; later tool work
makes them ineligible for automatic reuse. Unknown citations, unavailable model,
failed assessment and malformed saved opinion remain explicit. Failed native
requests retain their own diagnostic ID. Request metadata cannot spoof recording
purpose. Provider/proof fixtures now use memory sinks so test invocations do not
populate runtime drawing reports.

Seven focused suites passed 126 tests, with three existing opt-in live tests
skipped. App typecheck, App build, report CLI build, naming and Inspector contract
tests passed. Scoped lint: no errors, two existing diagnostic console warnings.
Source-bound candidate `7ed1da54-8dd6-4bd3-9c04-8ec5e986bd8c` passed; review
`01883427911d559f28f4c3225cd565eb8f6b2945b98b360641376a8fd2f77efa` accepted.
Formal assessment tests use a provider double; no new live drawing or live model
assessment is claimed. Final parent acceptance will generate the new evidence.
No push.

## Final acceptance correction - observe output channel

The real optional assessment completed, but its provider diagnostics preceded the
CLI JSON on stdout. The bounded correction stays in observe usage output and its
native-provider regression: assessment diagnostics go to stderr, the saved
records remain unchanged, and drawing diagnostics retain their existing channel.
No new provider call, canvas capability or evaluation criterion is introduced.
Gate: the native assessment test must fail on stdout contamination first, then
pass with trace and terminal usage still present on stderr; report/parser and
provider tests, typecheck, lint and source-bound proof follow.

## Final acceptance

See [parent results](ai-execution-improvement-results.md). The successful live
request, period report, independent post-run process opinion, zero-call reuse of
current visual-review opinion, native detail screenshots and full recording are
retained locally. Speed and visual limitations remain explicit; model opinion is
not user approval. No push.
