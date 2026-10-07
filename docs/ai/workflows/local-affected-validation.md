# Local affected validation

## Product contract

`yarn validate:local` previews affected security audit, local lint, tests and E2E. Add `--run`
to execute the previewed obligations. `--base <ref>` selects an explicit commit;
otherwise use the merge base of HEAD and origin/main. `--full` selects full
validation. No fetch, push, remote CI, dependency installation or tool upgrade
is performed. Existing whole-repository commands remain available.

## Local inputs

Inputs union the base-to-HEAD changes, staged changes, unstaged changes and
non-ignored untracked paths. Renames contribute both old and new paths; removals
remain inputs. Git paths are NUL-delimited. Resolve commits before classification;
an invalid base is an error, never an empty successful plan. Record content
fingerprints and Git identities without retaining file contents or local secrets.

## Shared selection

Use `ci-scope.mjs` and `ci-relationships.json` with current and base manifests.
Workspace discovery includes apps, packages and tools plus declared downstream
consumers. Reuse CI's reliable related selection and full-owner fallback.
No separate dependency graph or workspace-name allowlist is permitted. Workspaces
without an E2E contract report not-defined. Existing separately-owned E2E groups
use local command contracts in the same relationship map. Unknown relationships
or missing command contracts block execution rather than silently skipping work.

## Owned execution

Run selected checks and their declared build prerequisites sequentially through
existing CI runners or the E2E owner's local command. Keep owner resource guards
and zero-test checks. Selected failure, missing result, zero tests or cancellation
cannot produce a passing aggregate. Unselected checks are explicit. This command
runs the selected security audit first using `yarn security:audit`, with the same
selection and severity threshold as CI. An audit failure or registry error stops
subsequent checks and remains in the run evidence. Unselected audits do not query
the registry. Audit results depend on the live advisory database; rerun before
push rather than treating an earlier pass as permanent. This command does not
certify release, publication, production artifact or hosting gates.

```sh
yarn validate:local
yarn validate:local --json
yarn validate:local --run
yarn validate:local --base origin/main --run
yarn validate:local --full --run
```

The JSON preview includes each CI selection reason and the exact local command.
Default base uses the existing local origin/main reference; this command never
refreshes it over the network. A wide branch diff can legitimately select many
owners. `--full` intentionally selects all local owners. Run from the repository
root. Press Ctrl+C to cancel; the result retains cancellation and completed-check
evidence. A failed check stops later commands and its numbered log remains in the
reported evidence directory. Changing code during a run requires a fresh run.

Selected control-plane unit contracts run locally, while its remote workflow
trial/proof certification remains separate. Existing CI runner identity fields
are used only as an adapter format with repository authority `local`; no GitHub
check, artifact upload or successful remote run is created.

Each run stores the plan, command logs, child process IDs and results under
`tmp/local-validation/`. Cancellation stops only the owned process groups, waits
for cleanup and prevents subsequent commands. No global process/port cleanup.
Recheck input identity after execution; edits during validation make the result
unverified. Logs are evidence files; terminal output stays concise. Local results
are never represented as GitHub CI evidence.

## Acceptance

Formal tests cover dirty/staged/untracked/deleted/renamed paths including spaces,
invalid refs, package/downstream selection parity, new workspaces, docs-only and
shared inputs, missing E2E, failure/zero tests, cancellation and changed inputs.
Preview the actual task changes and run that plan. Required task-specific gates
remain required even when not selected by this general adapter.

### Supervised owner selection

Registered supervised owners in `scripts/ci-relationships.json` use one
invocation-owned TypeScript syntax dependency graph. Ordinary and profile test
files are discovered from the owner source tree, including nested tests. Relative
imports, re-exports and literal dynamic imports propagate to transitive consumers;
unresolved dynamic edges retain their consumer tests. Known upstream source
changes resolve discovered workspace exports and subpaths through the compiler's
source-to-output mapping, including when dist artifacts do not exist. Runtime
imports and re-exports propagate upstream changes; explicit type-only declarations
do not execute the imported module. Owner-local edits retain type and value edges,
and owner lint/build remains complete. Each reached source is parsed once and
workspace output maps live only for that classifier invocation.

Missing or unsupported package entry mappings retain their importing consumers.
Owner-local or unknown-workspace deletions, shared configuration and unknown
non-code resources retain complete owner coverage. No workspace names or numerical-test filenames are allowlisted. The
classifier never executes app modules or reuses a graph across source revisions.
CI installs the declared parser before classification when a discovered local or
upstream workspace source path needs parsing; unrelated PRs retain pre-install
selection.

FieldScope's ordinary files run through `test:affected` and its existing
supervisor. Profile selection is partitioned by the existing profile owner;
CI runs nonempty groups on independent runners, while local validation consumes
the same selected files sequentially. Each process remains single-worker for
profiles with unchanged guards. Empty selections are explicit, never empty test
invocations. Selected profile runs cannot claim full-suite coverage.

Browser spec edits select exact specs within their existing process groups.
Runtime changes keep the complete browser suite because browser-to-app feature
relationships are not inferred from TypeScript imports.

Workspace-local tests and registered `workspaceLocalInputPatterns` remain inputs
of their own validation owner. They do not broaden a downstream runtime owner's
selection when mixed with source changes. Coverage/navigation flow manifests
use this relationship-map contract; unknown resources still select conservatively.

A removed source in a known upstream workspace broadens to all value-import
consumers of that workspace, including subpaths and transitive re-exports.
It never assumes that a removed file was unused. Owner-local or unknown-workspace
deletions still select the full owner. No historical implementation is required.
