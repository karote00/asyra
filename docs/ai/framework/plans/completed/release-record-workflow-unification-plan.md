# Workflow Validation Simplification

Status: Implementation and local validation complete; source review and closeout pending.

## Task contract

Owner: repository development and release tooling. Base:
`80f1b59249b1f14c07fd01ac569a8b9b6c4fc0c2` on `codex/readability-ci-repair`.
Delivery target: PR #363, remote branch `codex/readability-migration`.

Keep development validation, plan closeout, package publication, create-app
publication and project release updates independently executable. Owner
`decisions/releases/unreleased.md` streams supply project release updates.
Current Flow Inspector contracts and their current results own completion.

Scope: maintained workflow entrypoints, CI/local validation selection and
aggregation, publisher admission, release-update readers, current project rules,
Inspector contracts and their direct tests. Inspect these owners and direct
consumers; preserve unrelated product behavior, historical records,
`release-configs/<app>.json`, generated `create-app/*/template` and the unpushed
readability scanner in its separate worktree.

## Changes

1. Development CI runs source and behavior checks. Package readiness remains in
   package publication; owner release-update checks remain in release updates.
2. Changesets calculate release versions. Owner decision streams supply prose.
   Closeout follows implementation and may use a follow-up PR after an early merge.
3. Publisher admission binds source, predecessor, dependencies, artifact identity,
   registry state and retry outcomes independently of notes or completed plans.
4. Flow Inspector runs current contract tests. Current required results must pass;
   CI evaluates the resulting checks without another baseline/candidate proof.
5. Current rules describe workflow responsibilities, steps and completion in
   concise present-tense terms.

## Validation and review

Keep artifact tamper, consumer, registry, deployment, cancellation, resource,
cleanup and result integrity tests. Remove obsolete per-file note coverage,
mandatory Changeset PR checks, document-phrase checks and repeated Inspector prose
assertions. Review current-task diffs and direct consumers only.

Formal regressions demonstrate publisher admission without documentation,
manifest inventory without plans, CI selection without release readiness,
release-update reading independent of closeout and version materialization
without generated changelogs. Run repository script tests, CI/local runner and
Inspector contracts, naming, lint, formatting and canonical public documentation
generation/checks. Record results and exact reviewed source at closeout.

## Progress

- Focused release/CI suites: 189 tests passed before final simplification.
- Artifact-only publisher regression and CI independence regressions failed on
  the prior behavior, then passed after their owner corrections.
- Release inventory retains manifest/version checks while removing document
  phrase and historical readiness checks.
- Changesets materializes the fixture package version and consumes version intent
  without creating a changelog.
- Baseline CI run `41230021980` on the base source completed 45 jobs successfully.
  The downloaded job inventory is `tmp/readability/ci-before-workflow-separation.json`.

## Local validation results

- Repository script suite: 609 passed across its primary and serial build groups;
  one existing opt-in real Skill installation case was not selected.
- Current flow evaluation, result producers and release-history tests: 42 passed.
- CI/local runners and closeout/task-context tests: 41 passed.
- Public documentation tests: 71 passed.
- Final publisher/artifact regression suite: 27 passed.
- Naming: 15 passed. Repository lint: zero errors, 110 existing warnings.
- Changed-file formatting, public generation/check (57 pages, 19 packages),
  current release-flow admission and diff whitespace checks passed.
- Protected template/configuration paths and the lockfile are unchanged.

## Delivery and report

After required local checks and review, close the plan and push to the existing
PR branch. Let the PR event start CI. Check the exact pushed head every ten minutes
until all required checks pass or 2026-11-01 12:00 Asia/Taipei (04:00 UTC), whichever
comes first. Remove the monitor at either condition. Report the before/after job
counts, check families and owners, removed or relocated checks and rationale,
retained correctness safeguards and observed verification results. Keep job
counts distinct from test-case counts. Publication and merge remain separate.

## Closeout

Completed: 2026-11-01
Reviewed source: 4873d3af514984aa00b1208c58c2080cd61c489c
Outcome: Independent development, closeout, publication and release-update flows
are implemented; the recorded local checks passed.
Decision: Implementation accepted locally. PR CI verification and the final
before/after report follow the delivery procedure.
Exit criteria: Applicable local checks pass; workflow separation and protected paths are verified.

## Final delivery confirmation - 2026-11-02

Reviewed source: b738ff4333a4de0ee920a171fec2c40af897884a
Merged source: cb66b095f6ad55d2793ca3cd7b950c13f478dcbb (PR #363).
Evidence: <a href="https://github.com/karote00/asyra/actions/runs/41323723485" target="_blank" rel="noopener noreferrer">Full PR validation</a> completed with all 44 jobs successful, including all required checks and final validate.
The final full run contains 44 successful jobs, compared with 45 in baseline run 41230021980. The removed job is framework-release-readiness. Workspace behavior, Fieldscope profiles, specialized E2E, production artifacts and final aggregation remain verified. This is a job-count comparison, not a test-case count or a runtime speed claim. Publication remains separate from merge.
