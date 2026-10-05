# AI execution improvement

Created: 2026-10-03. Status: completed locally; no push or remote CI claimed.
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
enter brief and Send; fit once after confirmed overall bounds and once after
terminal settlement, retain the full finished work, wait ten seconds and stop recording. Preserve document, native
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

## Completed local result

All five linked plans are complete locally. Recording was implemented first;
reporting, isolated assessment, precise registry discovery, measured execution
guidance and local affected validation followed. The first live attempt exposed
a canonical-versus-computed property contract ambiguity; a native regression and
registry semantic correction preceded the successful repeat.

The final headless run passed, preserved the requested editable detail and scale
contract, and retained ten seconds after completion. It took 15m27s; the 1–2 minute
aspiration is **not achieved**, and this single run does not prove a speedup.
See [results and evidence](ai-execution-improvement-results.md) for timings,
visual limitations, validation, exact brief, replay artifacts and report commands.
No shared renderer or speculative RAG/cache was added without owner evidence.

Local records, recordings and `.env` are retained. Task-owned test servers were
closed. No push, PR update or remote CI was performed.

## Recording navigation follow-up - 2026-10-04

Bounded test-only change requested by the user: fit once after the first current,
complete overall inspection coverage receipt, then once after terminal settlement.
Partial geometry or later bounds changes must not trigger another fit. A question
is a pause, not terminal settlement. If no confirmed overall bounds arrive while
active, skip the early fit rather than guess; fit the retained drawing at the end.
The isolated recorder owns canvas focus and keyboard commands. This adds no
App automatic viewport behavior, no request mutation, and no AI/provider calls.
Scope is the existing E2E recording driver, permanent navigation regression cases
and its acceptance documentation. Verify focus, deferred initial fit, changing
bounds, final fit, questions and existing approval handling with headless browser
fixtures. The next live brief explicitly requests an elevated three-quarter view
looking down with visible top surfaces. Historical prompts/evidence stay intact.

Verification: the new navigation regression failed on the previous driver, which
refit on changed bounds. Five focused headless E2E cases now pass (24.0s), covering
focus, the two fit milestones, intervening geometry changes, question pauses,
missing early bounds and existing confirmation handling. Naming and formatting
checks pass. No live AI generation or production App code was changed in this
follow-up; no commit or push. Evidence: `tmp/recording-navigation-{red,final}/`.
