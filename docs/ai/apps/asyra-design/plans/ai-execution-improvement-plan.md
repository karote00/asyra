# AI execution improvement

Created: 2026-10-03. Status: planning complete; recording implementation first.
Owner and whole-plan closeout: this conversation. Continue
`.worktrees/ai-execution-flow`, branch `codex/ai-execution-flow`, from
`d0b2d213f41f6c10bbd98a3ccb5fdf5bbb8714ac`. Local commits are permitted;
push, PR update, merge and publication are not authorized for this work.
Check the account's weekly allowance at owner-stage boundaries. When exhausted,
stop implementation and tests, preserve a concise handoff and clean up only
task-started temporary processes; do not continue the goal on credits. This is
the user's explicit conditional pause request, not a request to redeem a reset.

## Objective and scope

Make execution explainable, then reduce demonstrated unnecessary work while
preserving the requested appearance, editable output, dimensions and detail.
Implement the five linked plans, in order of their dependencies, and finish with
one successful headless recorded upper-two-tiers Taipei 101 run. A failed run
remains evidence and requires a bounded owner correction before retrying.

1. [Execution recording](ai-execution-recording-plan.md) - first implementation.
2. [Evaluation and periodic reports](ai-execution-evaluation-plan.md).
3. [Precise retrieval and reuse](ai-execution-retrieval-plan.md).
4. [Execution efficiency](ai-execution-efficiency-plan.md).
5. [Local affected validation](../../../framework/plans/local-affected-validation-plan.md)
   - independent developer-tool work, reusable by the other plans.

Mutation scope: Design provider/diagnostics/tool owners and their direct tests,
App docs and execution Inspector/proof mapping; repository affected-validation
scripts, their direct tests and local command/docs integration. Framework bulk
creation changes require a measured canonical-owner finding within the efficiency
plan before editing. No unrelated cleanup, new dependencies, context-rag import,
model/effort changes, automatic global prompt rewriting or source restrictions.
Shared components and a new instanced renderer are not preselected solutions.

## Discovery and acceptance

Use existing provider traces, current public APIs/registries, the affected call
paths and their formal tests. Final review stays within changed owners and direct
consumers. Each plan freezes its owner slice before implementation. Keep current
Stop, partial-success retention, one request history group, interaction freedom,
source resolution and final visual assessment. Evaluate success against the
brief, including intentionally rough/simple/ugly requests.

Historical reference: request `0581ec09-dcdf-43d9-8243-1d3ee80130fb`, retained in
`tmp/pr280-integration/manual-design.log`: 777640 ms wall, 166712 ms observed
tool/research union, 610928 ms unattributed. First applied stage completed near
175504 ms. One 8161-element application recorded 96790.3 ms create time. These
are observations from one run, not universal timing gates or all model reasoning.
Large wire responses do not prove that all bytes entered model context.

## Final live acceptance

Use the existing formal live-provider test with this exact brief:

> Draw only Taipei 101's two uppermost large bamboo-shaped sections, plus the full crown and spire above them, as a highly detailed, realistic 2D illustration from one fixed oblique view. Use editable shapes, preserve visible façade details, and scale at 1 cm = 1 px.

Keep `gpt-6-astra` / `medium`. Record headlessly from App opening, open AI panel,
enter brief and Send; fit established bounds while drawing, retain the full
finished work, wait ten seconds and stop recording. Preserve document, native
detail/overview screenshots, run record, assessment and video. Inspect actual
screenshots. Report first visible stage, observed execution/queue/provider
intervals, unknown time, bytes, failures/rework and the requested visual quality.
The long-term full-building aspiration is 1–2 minutes, not a pass guarantee for
this different subject extent. Do not compare differing run times as a causal
benchmark; deterministic tests prove work-count improvements separately.

Completion requires all five plans' focused gates, affected type/build/lint and
integration gates, bounded review, and the successful live evidence. No remote
CI is run or claimed because push is prohibited. Keep generated evidence ignored
and local environment files intact. Record any unachieved acceptance honestly.


## Current local progress

- Recording stage: completed locally in `a02c4e608`.
- Deterministic report stage: completed locally in `c0087f44b`.
- Optional isolated assessment and saved opinions: completed locally in
  `8d667fdfb`; final live acceptance remains.
- Retrieval: registry discovery and batched evidence repaired; nine existing
  target/query/preparation suites passed 154 tests. No speculative cache added.
- Execution efficiency and local affected validation remain planned.
- Final Taipei 101 headless recorded acceptance has not started. No remote push.
