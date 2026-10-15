Never record completed plans here.

# Flow Inspector Plans

Direction aligned on 2026-10-11: help humans and AI move directly from a failed
test to its recorded responsibility node, implementation location and original
failure evidence. Eliminate repeated discovery; debugging and repair remain the
human or AI's work. The roadmap no longer requires an agent/task/delivery system.

## Current delivery stages - 2026-10-15

The core failure-to-node path is implemented. Stage A now has a complete
implementation candidate for its frozen 412-case inventory; validation and
remaining execution limits are recorded in the supporting plan. Follow the roadmap's
[consolidated stages](plans/flow-inspector-workflow-control-plane-roadmap.md#consolidated-delivery-stages---2026-10-15):

1. Stage A: complete the frozen Design functional test inventory's localization.
2. Stage B: complete collaboration and selected shared Framework localization.
3. Stage C: optional command buttons and comments, only on a separate request.

A/B include full end-to-end acceptance, not one PR per mapping or owner. Exact
inventories are frozen before implementation. Stage B is the next goal after
Stage A review; it is not activated by the Stage A implementation. Historical
slice notes do not schedule more stages.

## Core Mainline

- [Test Failure Localization](plans/flow-inspector-verification-coverage-expansion-plan.md)
  owns the initial ordinary-test ingestion, mappings, usable failure context and
  real App/Framework failure-and-recovery acceptance cases.
- [Failure Localization Roadmap](plans/flow-inspector-workflow-control-plane-roadmap.md)
  owns product scope, sequencing and completion boundaries. It is not a separate
  implementation backlog to count twice.

## Supporting Coverage Expansion

- [Test Result Source Support](plans/flow-inspector-control-plane-evidence-and-ci-plan.md)
  covers separately selected additional runners, CI producers and test sets.
  Reuse the core result-to-node path. Receiving CI failures does not require
  required-check configuration, a protected verifier or merge enforcement.

## Optional After Core Acceptance

- [Node Interactions](plans/flow-inspector-control-plane-actions-and-integrations-plan.md)
  scopes future command buttons and comment blocks. Neither is activated or
  required for core completion. Both must reduce actions at an already located
  node, not introduce task planning or automatic repair.

## Removed from the Mainline

Unimplemented task decomposition/dispatch, provider expansion, remote execution
reconciliation, agent budget orchestration, ticket/PR synchronization, delivery
management, protected merge enforcement, team work tracking and hosting are
withdrawn from the current backlog. They are not merely waiting to become
mandatory later phases. Reintroduction requires a separate product decision.

Existing functionality and its runtime contracts remain intact. Completed work
is not reopened; unfinished historical full-phase requirements are not falsely
marked complete. Dated records are preserved in the roadmap and supporting
plans, with links to their accepted closeout evidence.

## Authority and Activation

The current [Core Proof](CORE_PROOF.md), [static Inspector contract](FLOW_INSPECTOR.md),
[local execution contract](AGENT_EXECUTION.md) and [review contract](PR_REVIEW.md)
remain authoritative for implemented behavior. Repository development rules
remain unchanged. The planning revision grants no implementation, remote action,
publication or deployment authority. All existing plan filenames stay stable.
