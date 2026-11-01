# Flow Inspector Plans

## Active and proposed work

Registry publication and fresh registry-install verification remain paused and
require their own release authorization. No additional Stage 1 or 2 development
is active.

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
current implemented behavior. The [Flow Document Contract](FLOW_DOCUMENT.md) owns the new current-file workflow;
proof/execution contracts remain scoped to their existing tools. Historical
completed evidence is not rewritten as proof of independent adoption.
