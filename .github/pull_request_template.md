Thank you for your interest.

This repository does not accept external contributions.
All pull requests from users not listed as collaborators will be closed without review.

## Task context

Include exactly one `task-context` fenced JSON block generated from the task's
handoff. Follow `docs/ai/workflows/task-context.md`. Explicitly select
`standalone`, `plan-task`, or `plan-closeout`; missing association does not mean
standalone. Keep the plan path, exact task heading and closeout owner for
plan-related work. Do not mark a partial task as whole-plan completion.

## Flow design and verification

For plan-driven development, reference the flow design reviewed before
implementation: plan/specification, Inspector revision, selected owner step/route,
prerequisites, acceptance cases and accepted behavior to preserve. Summarize any
design changes and their review. Report current source-bound evidence separately
for this work, its prerequisites, whole-target integration and preservation of
existing behavior; keep pending target work visible. Reference the existing
contract and Flow Inspector records rather than creating another readiness ledger.
