Never record completed plans here.

# Flow Inspector Plans

## Active and Future Work

The persisted-result lifecycle stage is implemented and awaits PR review and CI. The agreed failure-localization
and optional node-interaction scope is closed following the merges of Stages
A/B/C. See the [completion record](plans/completed/flow-inspector-failure-localization-abc-closeout.md)
for the bounded outcome, original acceptance evidence and remaining limitations.
Detailed completion history belongs in `plans/completed/`, not this active index.

Further runner or mapping coverage, interactions or operational features require
a new explicit product decision with a bounded inventory and acceptance criteria.
There is no mandatory Stage D and no automatically queued per-case follow-up.

## Active Result Lifecycle Stage

[Persisted flow results and warning supersession](plans/flow-inspector-persisted-results-and-warning-supersession-plan.md)
is the approved follow-up to PR #338. It delivers test-produced
execution evidence, offline/restart/CI consumption, and correction-backed warning
retirement. It does not reopen the completed
A/B/C stages or historical control-plane backlogs.

## Product Direction and Authority

Help humans and AI move from an existing failed test directly to its recorded
responsibility node, implementation location and original evidence. Investigation
and repair remain their work. Mapped coverage does not imply passing product
behavior, universal test support or proof of a root cause.

The living [Core Proof](CORE_PROOF.md), [static Inspector contract](FLOW_INSPECTOR.md),
[local execution contract](AGENT_EXECUTION.md) and [review contract](PR_REVIEW.md)
remain authoritative. Existing controls retain their behavior. Original planning
paths remain stable as historical scope/evidence references; they are not active
backlogs. Repository development rules remain unchanged.

Task dispatch, provider expansion, remote reconciliation, agent budget management,
ticket/PR synchronization, delivery management, protected merge enforcement,
team tracking and hosting remain outside the agreed scope. Their unfinished
historical requirements are not marked complete or silently reactivated.
