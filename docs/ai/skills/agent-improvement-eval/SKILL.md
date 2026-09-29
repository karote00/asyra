---
name: agent-improvement-eval
description: Evaluate recurring agent or workflow failures, turn real failures into repository eval cases, and compare skill or instruction improvements with fixed baseline/candidate experiments and holdout cases. Use for 改善評估、反覆失敗分析、規則或技能改善前後比較 in repositories with scripts/agent-evals. Exclude ordinary one-off product fixes and model-weight training.
---

# Agent Improvement Eval

## Trigger Signals

- The user requests an improvement assessment, recurring-failure analysis, or
  a before/after comparison of agent instructions, skills or workflow behavior.
- An authorized workflow-improvement task needs evidence that its change helps.
- Explicit invocation: `$agent-improvement-eval`.

## Do Not Use When

- The task is only an ordinary feature, isolated product bug or general question.
- The request concerns model-weight fine-tuning rather than repository behavior.
- The current checkout lacks the repository-owned eval tool. Report the missing
  prerequisite; do not install a different evaluator or copy another checkout.

## Required Inputs

- A concrete failure and evidence, or a specific proposed improvement to assess.
- Expected behavior, the owning layer and the authorized scope of change.
- Baseline/candidate configurations, representative cases and a sample budget.

Infer available inputs from the current task and source. Ask only for missing
information that affects validity. Assessment-only requests authorize analysis
and evaluation artifacts; they do not authorize adopting a rule change.

## Preflight

Resolve the current repository root and read its `AGENTS.md`. Paths below are
relative to that root, not this installed skill's directory.

- Read `docs/ai/tools/agent-evals/README.md` for current schemas, commands and
  evidence rules, and `docs/ai/workflows/agent-task.md` for task scope/routing.
- Confirm `scripts/agent-evals/cli.mjs` exists; use `yarn agent:eval list` to see
  available cases. Use the repository's declared runtime and dependencies.
- Identify whether the request is diagnosis only, case authoring, an experiment,
  or adoption of an already-evaluated change. Retain existing user authorization.

## Deterministic Procedure

1. Describe the observed failure separately from the hypothesized cause. Identify
   Skills, Architecture, Verification or Evals as the proposed correction owner.
   Freeze the expected behavior, editable scope and completion/stop conditions.
2. Reuse a representative case when available. If authoring is authorized and
   needed, follow `docs/ai/tools/agent-evals/case-authoring.md`; retain a failing
   reproduction, independent oracle and corrected replay. Sanitize evidence.
3. For a comparison, use the definition schema in the tool guide. Record one
   hypothesis, evidence, declared configurations, instruction-file allowlist,
   disjoint development/holdout cases and samples per case before running trials.
   Assessment without a valid comparison must remain inconclusive.
4. Run `yarn agent:eval experiment <id> <definition.json>` and
   `yarn agent:eval trial <id> <baseline|candidate> <case> <run> <actor>`.
   Use the emitted prompt/workspace, then the existing `admit`, `regression`
   when applicable, `evaluate` and `review` protocol. The CLI does not select or
   invoke a model; configuration labels describe the session actually used.
5. Use `agent` only for actual independent agent samples. Scripted demonstrations,
   answer-informed execution and reused solution context are `replay`. Do not
   relabel the current informed conversation as an independent sample or reviewer.
   If fresh contexts are unavailable, report that limitation without dispatching
   another agent. Tool tests can still validate evaluator mechanics.
6. Complete the planned development evidence before releasing holdout cases.
   Freeze the candidate at its first successful trial. Do not tune from holdout
   feedback; a later candidate needs a new experiment and appropriate unexposed
   reserved cases. Record prior exposure because cases are readable.
7. A distinct reviewer must inspect the actual diff, tests and handoff and submit
   evidence-specific semantic decisions. Never invent their review or use a new
   label for self-review. Prepare the review artifacts and report pending status
   if that reviewer is unavailable; no automatic reviewer dispatch is implied.
8. Run `yarn agent:eval compare <id>`. Report every case's results and retained
   comparison path. Explain whether the evidence supports the hypothesis, shows
   regression, is unchanged, or remains incomplete. Make or adopt the bounded
   improvement only when already authorized; otherwise present the proposal.

## Validation Matrix

- Fixed task expectations and evaluator; changed grading starts a new benchmark.
- Exact source/configuration evidence, one mode and the planned sample count.
- Failed, pending and missing samples retained; attempts are not new samples.
- Development and holdout results reported separately, including regressions.
- Current-source independent semantic review for any claimed passed run.
- Case/tool/workflow changes use the tool guide's applicable formal gates.

## Required Output Format

Report the failure and hypothesis, proposed or implemented owner change, compared
configurations, per-case results with attempt counts, comparison artifact path,
review state and recommendation. Distinguish evaluator-test success from measured
agent improvement. A small pass-rate gain alone does not establish causality.

## Guardrails

- This skill adds no agent dispatch, background scheduling or unattended retry.
- It does not automatically rewrite global rules, weaken acceptance criteria,
  merge, publish or expand the user's task. Use the repository's Git policy.
- Keep source-of-truth procedures in the repository tool guide; do not create a
  competing evaluator or duplicate its schemas inside this skill.

## Failure Policy

Preserve failed runs and evidence. Stop the experiment when fixed expectations,
candidate identity or scope must change, required review is unavailable, or the
declared sample budget is exhausted. Report the exact missing prerequisite or
inconclusive result. A failed or incomplete comparison is never permission to
rewrite rules or retry without a bound; future experiments need an explicit scope.
