# AI execution evaluation and periodic reports

Status: planned; depends on [recording](ai-execution-recording-plan.md).
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
