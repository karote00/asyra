# AI execution evaluation and periodic reports

Status: implementing deterministic reports; recording owner stage is complete.
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
