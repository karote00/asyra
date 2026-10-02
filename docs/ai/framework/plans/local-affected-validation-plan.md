# Local affected validation

Created: 2026-10-03. Status: planned. Independent tooling plan coordinated by
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
