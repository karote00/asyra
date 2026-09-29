Thank you for your interest.

This repository does not accept external contributions.
All pull requests from users not listed as collaborators will be closed without review.

## Task context

Include exactly one `task-context` fenced JSON block generated from the task's
handoff. Follow `docs/ai/workflows/task-context.md`. Explicitly select
`standalone`, `plan-task`, or `plan-closeout`; missing association does not mean
standalone. Keep the plan path, exact task heading and closeout owner for
plan-related work. Do not mark a partial task as whole-plan completion.

## Inspector applicability

State whether the change affects or proves an Inspector-governed contract.
For applicable changes, reference the specification, Inspector owner step/route,
affected cases, synchronized contract changes and gates run against the current
source. Explain why no Inspector edit was needed when restoring an unchanged
contract. For non-applicable changes, give a brief reason. Follow the existing
contract references in the task; do not create another readiness ledger.
