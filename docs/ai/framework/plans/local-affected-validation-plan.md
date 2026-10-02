# Local affected validation

Created: 2026-10-03. Status: completed locally; no remote operation. Independent tooling plan coordinated by
the [AI execution improvement plan](../../apps/asyra-design/plans/ai-execution-improvement-plan.md).

## Outcome

Developers can preview and execute affected lint/test/E2E checks locally using
the existing CI relationship map and workspace discovery. New apps, packages and
tools participate through their manifests; no duplicate workspace allowlist.
Existing full-suite commands remain available. Local evidence is not remote CI.

## Contract and scope

Owners: `scripts/ci-scope.mjs` for impact selection, a local execution adapter for
Git inputs and command execution, and workspace-owned scripts for actual checks.
Inputs include changes from an explicit base to HEAD plus staged, unstaged and
untracked paths, including removals. Default to the current branch's merge base
with origin/main; expose explicit base and full options. Unknown relationships
retain relevant full-owner gates or report unresolved selection, never green
empty results. Build prerequisites follow existing CI contracts.

Mutations: local validation script and permanent tests, minimal exports/adapters
at existing CI selector/runner, root command, workflow docs and exact Inspector
architecture/proof. Do not rewrite CI policy or create a second dependency graph.
No dependency/tool upgrades or create-app implementation changes.

## Tasks and gates

1. Read existing scope/relationship and execution contracts; freeze selected
   plan schema and manifest script resolution. Reuse reliable fine-grained
   selection, owner-full fallback and repository-script input selection.
2. Add preview and explicit run commands. Use argv execution, sequential/bounded
   concurrency, exit propagation and owned-child cancellation. Record selection,
   commands, results, source identity and dirty inputs in ignored local evidence.
   No E2E for owners without E2E contracts; distinguish not-defined, not-selected,
   passed, failed and unverified/zero-test outcomes.
3. Test package-to-downstream-app/tool impact, new workspaces, docs-only, shared
   configs, deleted/renamed/untracked paths, spaces in paths, invalid base,
   failed command/cancel and empty selection. Prove selection matches CI for the
   same changed paths. No universal wall-clock assertions.
4. Run the new local route against this task's actual changes after its focused
   tests. Complete required checks from the parent task; scoped selection is not
   permission to drop explicitly required integration/heavy gates.

DoD: preview explains each selected owner/check, execution runs the documented
local commands and returns nonzero for failures/unresolved obligations, permanent
tests pass, docs show copyable commands, and no remote operation occurs.

## Active step card - collect

Contract: `docs/ai/workflows/local-affected-validation.md`, Local inputs.
Inspector: local-affected-validation / collect. Add the input adapter and formal
Git-fixture tests only. Resolve an explicit commit or default merge base, union
NUL-separated committed/staged/unstaged/untracked paths and fingerprint current
file content/deletion without copying it. No classification, child checks or
network work in this segment. Test spaces, renames/removals, staged then undone
working edits, ignored files, invalid refs and changed identity in repository-local
fixtures. Naming gate precedes implementation. Stop on unsafe path or unresolved
Git identity. Selection and execution advance only after these tests pass.

Collect validation: four formal Git-fixture cases passed; naming and scoped lint
passed. The adapter retains index identity separately from working content, and
does not dereference symlinks. No classification or execution was introduced.

## Active step card - select

Contract: Shared selection; Inspector select and inputs-to-selection route.
Consume resolved local inputs, current/base manifests and the existing CI map;
produce a detached execution plan with owner reasons, explicit missing E2E and
unresolved obligations. Reuse the classifier without a second graph or fixed
workspace names. Preview must not launch checks. Allowed files are the local
adapter, relationship map and formal local tests. Prove parity against CI,
package downstream closure, newly added owners, docs-only and unknown inputs.
Stop if a selected obligation cannot be mapped; execute remains a later step.

Select validation: local and CI selection tests passed (59 cases), including
new workspaces and package-to-package/app/tool closure. Existing separate E2E
groups now carry local argv/evidence contracts in the same relationship map.

## Active step card - execute

Contract: Owned execution; Inspector execute / plan-to-execution / result.
Consume only the selected plan and explicit run intent. Emit local plan/log/PID
and terminal result evidence, including source revalidation. Use existing CI
check runners and map-owned E2E commands, preserving prerequisite ordering,
nonzero-test checks, resource guards and cancellation. No network authority,
second selection policy or global process cleanup. Files: local adapter/runner,
minimal workspace result-directory adapter, their formal tests and root command.
Map test registration is performed by select before this segment advances.
Prove failed/missing/zero/cancelled/source-changed results cannot pass, cancellation
stops owned children and no subsequent command starts. Gate scoped lint/naming,
formal tests, actual preview and actual selected run. Stop on unresolved command
contracts or owner regressions; unrelated gates remain outside this adapter.

### Bounded execution correction

Actual runs exposed a declaration-record-to-argv adapter error (fixed with a
failing regression), then stale generated source-index/template-environment
consumers (synchronized, direct tests passed). The default main-based preview
correctly includes the pre-existing branch work. Final task validation instead
uses the frozen task baseline `d0b2d213f41f6c10bbd98a3ccb5fdf5bbb8714ac`:
46 changed paths and three workspace owners, rather than 217 paths and twelve.
The broader run was explicitly cancelled, not reported as passed.

Cancellation exposed detached Playwright server groups surviving the wrapper.
Revise only execute ownership: snapshot verified descendant process identities
before signalling the root, include their separate groups in cleanup, and prove
with a real detached child plus an unrelated process that only owned descendants
are stopped. Existing App profiling guards implement app-specific ownership and
registration; the build-test helper covers only one group. Neither is a reusable
repository command-lifecycle adapter. No app guard or CI policy change is needed.
Retain the finite termination escalation guard and exact source verification.
After focused cancellation tests pass, rerun the task-baseline local command.

The task-baseline run reached all 217 functional cases: 194 passed, five existing
expected failures, eighteen opt-in skips, zero unexpected outcomes. Its new
result parser incorrectly rejected expected failures. Correct execute only:
interpret the final result against Playwright's declared expected status, retain
expected-failure/retry counts, and keep unexpected passes, interruption, missing
and zero tests failing. Workspace records retain their existing owner's verdict;
their raw failed-attempt count is not a new local failure policy. Formal positive
and negative cases precede the correction. No gradient behavior or expected-fail
mark is changed. Recheck all adapter cases before the next actual run.

Select follow-up: retain the ordinary CI first-failure guard in the map-owned
local Playwright argv (`--max-failures=1`) while letting local configs own their
servers. Same select contract and allowlist; formal command-contract assertion
first, no change to which tests are selected or their expected outcomes.

## Local completion

All 109 focused adapter, CI selection and workspace contract tests passed.
Task-baseline execution `82f2410d-9c38-4ac5-9c18-7e1cbc09c662` passed all nine
selected checks with source identity verified. This includes shared lint, naming
and repository tests; Design, framework-site and Flow Inspector owner gates;
13 collaboration cases, 199 executed functional cases (five declared expected
failures, no unexpected failures or flaky cases), and three render contracts.
Eighteen functional opt-ins remained explicitly skipped, including the separate
real-subscription acceptance required by the parent plan. Evidence is retained
in `tmp/local-validation/82f2410d-9c38-4ac5-9c18-7e1cbc09c662/`.

Bounded review checked the collect/select/execute flow, direct runner and map
consumers, cancellation ownership, result interpretation and source identity.
No workspace allowlist, second relationship graph, remote operation or unrelated
product fix was added. Local evidence does not replace remote CI.
