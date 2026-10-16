# Flow Inspector Plans

## Active and proposed work

[Flow-Based Work Management and Independent Project Adoption](plans/flow-inspector-independent-project-adoption-plan.md)
is the current proposed direction, updated by the user on 2026-10-17.
Reviewed planning scope: ready for implementation authorization. Implementation
and npm publication have not started.

The remaining work is grouped into two complete delivery stages:

1. Human task workflow and open evidence contract: public flow authoring,
   automated/manual evidence, node/feature acceptance, direct card/panel actions,
   concise human/Agent context, current-state writes and file observation,
   and future-team conflict boundaries.
2. Independent installation, external CI and release readiness: consumer-owned
   projects, portable adapters, installed-package acceptance and publication gate.

## Product direction and authority

A flow represents feature work; each card represents a bounded task. Accepted
completion of all required tasks and integration criteria completes the feature.
Flow Inspector should replace a separate task board for this workflow, with
flow files as the sole project contract/current-state input. Failure localization
is one optional evidence source. Tests are optional; manual-only and
mixed projects must work. Humans and Agents share authoritative state while the
human panel folds technical detail. No per-stage history is required: persist
current state with minimal revision metadata. CI evaluates the same flow files
headlessly without UI or a running service. Asyra Skill remains independent.

This user-directed planning decision supersedes earlier restrictions that treated
all work management as outside the product. It does not activate autonomous task
assignment/Agent dispatch, provider orchestration, Jira/Asana synchronization,
protected merge enforcement, team hosting or authentication. Assess future-team
identity/concurrency/authority interfaces now; implement team services later.

## Existing completed scope

The [A/B/C completion record](plans/completed/flow-inspector-failure-localization-abc-closeout.md)
and [completed result lifecycle](plans/completed/flow-inspector-persisted-results-and-warning-supersession-plan.md)
remain evidence for bounded Asyra-checkout behavior. They do not claim independent
npm readiness or completion of the newly clarified task-oriented experience.
Detailed history remains in `plans/completed/` and dated prior plans.

The living [Core Proof](CORE_PROOF.md), [Inspector contract](FLOW_INSPECTOR.md),
[execution contract](AGENT_EXECUTION.md) and [review contract](PR_REVIEW.md) describe
current implemented behavior. Before implementing the proposed stages, reconcile
their affected owner contracts with the new product direction. A proposed plan
alone does not change runtime semantics or reopen historical completed evidence.
