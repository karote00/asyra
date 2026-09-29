# Repository Agent Task

Use this entry for implementation, bug fixes, refactors, and documentation work
without requiring the user to name a slash command. Read-only questions retain
the Level 0 path in `AGENTS.md`.

## Route the Request

Identify the requested outcome and the smallest semantic owner. Select the
existing workflow below and load only its applicable contracts. Resolve scope
from the user's request and current source, not keyword matching alone.

| Requested outcome              | Workflow                                        | Additional guidance when applicable                                                                                                           |
| ------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Correct wrong behavior         | [bugfix](bugfix.md)                             | Formal failing regression before implementation; geometry routes to [geometry-clipping-bugfix](geometry-clipping-bugfix.md)                   |
| Add behavior                   | [feature](feature.md)                           | App work routes to [app-feature](app-feature.md); Feature/session work uses `docs/ai/skills/feature-authoring-guard/`                         |
| Change ownership or public API | [framework-api-change](framework-api-change.md) | Exact affected owner and applicable Inspector contract                                                                                        |
| Reorganize implementation      | [refactor](refactor.md)                         | Import boundaries use `docs/ai/skills/framework-import-boundary-auditor/`; runtime ownership uses [runtime-refactor](runtime-refactor.md)     |
| Change documentation           | [docs](docs.md)                                 | Behavior drift uses [docs-reality-check](docs-reality-check.md); implementation/doc synchronization uses `docs/ai/skills/docs-contract-sync/` |

Skills provide procedures; existing source-of-truth contracts own behavior.
Inspect current APIs, helpers, and registries before proposing a new owner.
Single-agent execution remains the default. This workflow does not dispatch
other agents or authorize additional tasks.

## Execute One Bounded Task

1. State the outcome, owner, authorized mutation scope, relevant source contracts,
   checks, exclusions, and stop conditions before editing. Follow the existing
   [bounded task rule](../framework/rules/bounded-task-scope-and-closure.md).
   A concise task statement is enough; do not create another governance record.
2. Establish the plan association and preserve it through handoff and PR using
   [task context](task-context.md). For plan-driven development, complete the
   plan-to-flow design and review of steps, handoffs, whole-flow feasibility and
   accepted-behavior preservation before production implementation. Hand off the
   reviewed contract and use Flow Inspector's supported admission/evidence paths.
3. Select gates from the changed behavior and its direct consumers. Apply the
   naming, test-first, computation, and visual rules only where their
   applicability conditions hold. Record necessary unavailable checks accurately.
4. Implement at the canonical owner, run the selected checks, and resolve
   in-scope failures. Existing safety hooks and architecture/type/lint/test gates
   retain their own enforcement boundaries; reading a rule does not prove a
   hook intercepted an operation.
5. Review the bounded diff and report changed behavior, exact validation results,
   and remaining limits. Commit/push/PR actions follow the existing
   [Git policy](git-commit-push-policy.md). Never turn pending CI into a completion
   claim.

## Learn from a Failure

When a task exposes a repeated agent failure, name the failed behavior and the
layer that owns its prevention. A missed procedure belongs in Skills; an
incorrect or unenforced boundary in Architecture; a weak oracle in Verification;
a missing representative case in Evals. Use the existing task's evidence.

If correcting the workflow or eval case is inside the authorized task scope,
make the smallest correction and rerun the same case. Otherwise report the
concrete follow-up. Do not automatically append a global rule after every
mistake or expand the current task into a repository audit.

## Evaluate the Workflow

For improvement assessments and before/after comparisons, use the
[`agent-improvement-eval` skill](../skills/agent-improvement-eval/SKILL.md).
Its trigger includes natural-language requests to evaluate recurring failures;
explicit invocation is `$agent-improvement-eval`.

Use the [agent eval tool](../tools/agent-evals/README.md) when changing these
procedures or measuring repeated failures. Its three permanent fixture cases
exercise documentation authority, regression-first bug repair, and display/model
ownership. The tool captures real source and test evidence. A named independent
reviewer owns semantic acceptance; the tool does not silently treat an agent's
self-report as success. Ordinary tasks do not need to run this suite unless
they change this workflow or the evaluation machinery.

For an authorized improvement experiment, freeze the failure evidence,
hypothesis, baseline/candidate configurations, development/holdout cases and
sample count with the tool's `experiment` command. Prepare fresh runs with
`trial`, then use the existing evidence/review flow and `compare`. Keep held-out
feedback out of tuning, preserve failed attempts, and report inconclusive or
regressed results honestly. The tool records comparisons; it does not dispatch
agents, change rules or retry tasks automatically.
