# CI Workflow Splitting Plan

## Status and Ownership

Implementation completed through PR [#264](https://github.com/karote00/asyra/pull/264), merged on 2026-09-30. This retrospective plan records the scope and acceptance contract that governed the repository-wide CI split. Whole-plan closeout remains pending review of this record on the current documentation PR.

- Plan owner: repository CI workflow and validation owners.
- Closeout owner: Asa Tsai, coordinating owner.
- Integrated implementation head: `3f07fcf93e78b13bb898f273495e0431f69433e8`.
- Integrated merge commit: `ae6aac8ef40fc86d4b4cf3f52d91719e471d1f37`.

## Goal

Route CI validation according to changed workspace ownership and declared dependency consumers, while retaining one required aggregate validation signal and ensuring selected workspace checks run against built dependency artifacts.

Align app E2E execution with each app's meaningful CI groups, use the current installed browser channel consistently, and give root start, test, lint, and related commands names that identify their app purpose.

## Bounded Contract

### Authorized scope

- Root GitHub Actions workflows and CI classification/build/test orchestration.
- Root and app package scripts that define app-specific start, test, lint, and E2E purposes.
- App E2E grouping/configuration and affected meaningful tests.
- Directly affected CI, E2E, and workflow documentation, formal script tests, Flow Inspector CI evidence contracts, and Changeset metadata.

### Required outcomes

1. Changed paths select their owning workspace and declared dependency consumers; shared/release inputs select the appropriate broader validation, and unknown paths fail closed.
2. The existing required `validate` check remains the aggregate for shared validation, selected scopes, release/archive readiness, and E2E producers.
3. Selected workspace test jobs build their canonical dependency closure before running `test:ci`; unselected work is skipped and selected work must succeed.
4. Each app exposes purpose-specific root commands and E2E CI groups that map to meaningful product behavior.
5. Browser E2E uses the current channel present in its execution environment instead of downloading a pinned Chromium build.
6. Formal regression coverage proves the routing, aggregation, build-before-test ordering, E2E group selection, and workflow configuration contracts.
7. Local required gates pass and PR #264 CI accepts the integrated implementation.

### Exclusions

- Replacing the required aggregate check or weakening branch protection.
- Installing a browser binary solely to satisfy the split workflow when the runner already provides a current browser.
- Keeping obsolete all-app commands or undifferentiated CI paths for compatibility after purpose-specific commands become canonical.
- Unrelated product behavior, package publication, deployment, or runtime/package-manager upgrades.

## Execution and Acceptance Record

The implementation was developed and corrected against the above outcomes. PR #264 added dynamic CI scope selection, workspace dependency build closure, app E2E CI groups, app-purpose root scripts, and regression coverage; it also updated workflow and Flow Inspector contracts. The PR was merged at the exact merge commit recorded above.

PR #264's recorded validation included 317 passing `yarn test:scripts` tests, 100 Flow Inspector workspace tests, 271 passing tools control-plane tests with one platform-guarded skip, `yarn lint:ci` with zero errors, and passing public-doc generation, Turbo graph, Changeset, workflow YAML, and whitespace checks. Clean-artifact Design build/test and Framework/Core build/test passed before the main sync; script, lint, and control-plane gates were rerun after syncing main. The PR body records the associated limitations and CI delivery boundary.

The implementation commit `5de68999d3c4d8bfbee2c0ab460970a18322a1a6` was titled “Add scoped CI execution plan” but did not add a durable plan file. This record makes that missing planning artifact explicit; it does not retroactively claim a review or evidence that was not recorded.

## Closeout Readiness

All implementation outcomes above are integrated. Closeout must append the exact reviewed source SHA and decision after this plan record has received trusted review, then move this plan to `plans/completed/`, remove this active index entry, and append the completion rationale to `decisions/releases/unreleased.md`.

## Closeout

Completed: 2026-10-01
Reviewed source: 834c0a87c68d2a17afd9e11c2456aa27d90e148c
Outcome: PR #264's scoped CI workflow changes were integrated at merge commit `ae6aac8ef40fc86d4b4cf3f52d91719e471d1f37`; its recorded local and CI validation evidence is summarized above.
Decision: Accept the CI routing, app-purpose command, dependency-build, and E2E group split as complete. The current documentation PR records the missing retrospective plan; this closeout does not claim additional implementation or review evidence for PR #264.
Exit criteria: All seven required outcomes in this plan are integrated and supported by the PR #264 validation record; the plan record itself was reviewed at the exact source SHA above.
