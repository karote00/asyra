# FieldScope affected test routing

Status: IN PROGRESS

## Bounded delivery

Preserve every ordinary, profile and browser assertion and all supervisor guards.
Select exact affected test files from the source dependency closure; supplemental
resource relationships belong to the repository CI relationship map. Unknown,
deleted, configuration or unresolved upstream inputs select the complete relevant
class. Discovery includes new test files automatically. No robot retirement,
geometry changes, timeout increases, dependency upgrades or production changes.

The repository classifier owns one selection per invocation. The workspace runner
and profile runner consume that selection, not an independently reconstructed
impact graph. Local validation consumes the same selection and runs profiles too.
Browser navigation crosses a non-import boundary: source changes retain full E2E
until explicit feature dependencies are proven; browser-spec-only changes select
the affected specs through the existing supervised groups.

## Owner steps

1. Select: source inputs and registered owner/resource contracts produce ordinary,
   profile and browser file selections. Use TypeScript syntax parsing; preserve
   transitive imports, cycles and conservative unresolved inputs. Formal tests
   cover UI-only, crops, walking, shared fixtures, resources, removals, newly
   added tests and upstream package changes. Compare real repository selections.
2. Execute: pass selected ordinary files to the existing Python supervisor and
   selected profile files to its profile mode. Keep process deadlines, worker
   acknowledgements, exact receipts and failure propagation. Independent profile
   groups may run on separate runners; each keeps one worker. E2E filtering stays
   inside the six owned groups. Selected zero/missing results fail.
3. Verify: synchronize the active test-scheduling and local-validation contracts,
   run routing and runner regressions, execute representative real split suites,
   then applicable local validation before committing/pushing. No merge.

## Review

The graph is a test-selection approximation, not a product dependency authority.
An unresolved edge broadens selection rather than excluding tests. Known upstream
source changes use the proven export-entry/source mapping described below; unproven
boundaries retain their consumers. Static imports do not cover browser routing
or filesystem reads; explicit resource relationships and conservative browser
selection retain those cases. No time savings are promised from selection counts.

## Verification

The real UI selector change selected two ordinary test files and no profiles.
Both executed successfully through `test:affected`. Selecting the trigonometry
profile executed only that file through the exact-receipt supervisor. Selecting
the camera-flight browser spec executed its three cases and no other group.
Formal regressions cover transitive/cyclic imports, unknown/deleted inputs,
new files, local/CI parity, mixed workflow/UI inputs, invalid profile selections,
and omitted executed-file evidence at aggregation.

`yarn validate:local --base origin/main --run` passed with `sourceVerified=true`:
dependencies, build graph, shared checks, website, FieldScope and Inspector
lint/build/tests, 754 ordinary FieldScope cases, 36 browser cases, and all 30
profile files. Evidence: `tmp/local-validation/eb013a00-8198-459e-80af-f47a954e3d9e`.
The initial shared check detected a stale generated source hash after the root
script registration; regeneration and the full rerun passed. Final edits only
clarified Inspector ownership and strengthened existing workflow assertions;
their focused checks are repeated before push. Remote CI remains separate.

## Authorized cross-workspace correction - 2026-10-07

The user authorized extending PR #298's CI repair to stop unrelated numerical
profiles from running for render-engine changes. The current external-source
shortcut selects all profiles despite the merged owner-local graph.

Step execution: local-affected-validation/select, owned by Repository CI scope.
Inputs remain changed paths, head/base manifests and the relationship map;
outputs remain the same ordinary/profile file selections and browser contracts.
Reuse the classifier's existing propagated workspace set: a proven upstream
source change enters the owner graph at imports of affected packages, including
subpaths and packages that transitively re-export the changed dependency. Treat
each package boundary conservatively as a whole; do not infer symbol or dist-file
equivalence. Unknown, deleted, configuration and resource inputs retain full
owner selection. Unresolved imports retain their consumers. E2E remains under
its existing browser contract.

Mutation scope: scripts/test-impact.mjs, scripts/ci-scope.mjs, their formal tests,
local-validation selection tests/contracts, this plan, and the existing local
validation Inspector. No package name whitelist, numerical-product changes,
new dependencies or changes to supervisor/aggregate evidence semantics.
The invocation-owned graph parses each owner file once; the existing classifier
owns workspace propagation. New names are internal selection inputs only, not
persisted identities. Baseline naming runs before implementation.

Source inspection and the strengthened regression also expose erased `import
type` paths from numerical modules to runtime/render types. Known upstream
runtime inputs follow runtime edges only; owner-local edits retain the complete
type/value graph. Explicit type-only import/export declarations are erased;
ambiguous mixed declarations remain conservative. Full owner lint/build remains
selected, so type validation is not removed. Both edge sets are built in the same
single parse per file, with no persisted graph cache.

Bounded iteration review: package-level propagation alone still includes pure
walking calculations through `@asyra/preset/spatial`, which shares a package with
the Pixi-backed root entry but does not import it. Supersede that coarse boundary
with source-entry resolution. Reuse discovered workspace identities, resolve
explicit package exports (including subpaths/conditions), and map TypeScript
emission paths back to source using the compiler's output mapping. Missing or
unsupported exports/configuration broaden the importing consumer instead of
guessing a dist/src substitution. One invocation-owned resolver caches only
workspace output maps; each reached source is parsed once. Extend the allowlist
with scripts/test-impact-workspaces.mjs and its relationship-map registration.
Before accepting this iteration, prove separate package entries, re-exports,
custom output roots, absent build artifacts, unresolved mappings and the actual
pure walking profile exclusion. No numerical assertion or deadline changes.

First reproduce that the actual mesh shader change selects pure trigonometry
profiles. Then prove known package imports/subpaths/transitive consumers remain
selected while independent tests are excluded, mixed owner/upstream edits are
unioned, unknown boundaries remain conservative, and local/CI selections agree.
Run the actual selected FieldScope files through existing guarded runners.
Finish after scoped routing, runner and shared checks pass; preserve previously
verified unchanged product/runtime gates and push the same PR without merging.

Final PR-range check: mixed upstream runtime and validation-only changes must not
reintroduce full-owner selection. Reuse the classifier's test-only distinction
when attaching inputs to downstream owners. Register coverage/navigation flow
manifests as workspace-local validation inputs in the relationship map: their
own workspace still runs, while unrelated runtime dependents do not inherit them.
Unknown resource/configuration files remain conservative. Prove mixed inputs,
validation-only changes and unknown resources before this final selector repair.

For a removed source inside a still-known upstream workspace, exact former
imports cannot be proven from current files. Retain every current value-import
consumer of that workspace's entries and their transitive tests. This is a
conservative package boundary, not a guess that the removed file was unused.
Deleted owner-local sources, removed/unknown workspaces, resource and config
changes still retain full owner selection. No deleted implementation is used as
behavior authority. The full PR also changes the shared RenderEngine entry used
by spatial consumers, so numerical profiles reachable through it remain selected.

Local result: 93 routing/runner/parity cases pass. The actual PR-range preview
selects 42 ordinary files and 25 profiles, excluding independent trigonometry and
crop-source work. A Pixi-only source change selects 3 ordinary files (7 cases) and
2 profiles; those exact selections pass the existing guarded runners. The broader
25-profile set is covered by the unchanged runtime's passing 30-profile run.
One retained path is walking-source-relation -> walking-motion-contract ->
walking-terrain-placement-contract -> spatial-contract -> preset/spatial ->
three-engine -> render-engine. This PR changes that shared entry, so retaining
those consumers is intentional. Local/CI share selections and evidence rules.
Generated Inspector workspace output is synchronized from its canonical source.

## CI parser admission correction - 2026-10-07

Run 37600081325 fails before classification: the parser-install command uses
`skip-builds`, while the pinned Yarn 4.3.1 accepts `skip-build`. Downstream red
aggregates lack scope output; they are not product-test failures. Prior source
classification tests did not execute the workflow's conditional dependency install.

Revised bounded slice: correct that install command and add a permanent executable
workflow regression to `scripts/__tests__/workspace-automation.test.mjs`. Extract
its actual Yarn arguments, execute them with the pinned Yarn in a dependency-free
project-local fixture, retain immutable lockfile behavior and prove lifecycle
scripts do not run. First demonstrate the current command's rejection, then fix
.github/workflows/main.yml and execute the real repository install/classification
path. No runtime, dependency/version, selection-policy, aggregate or timeout
changes. This preserves local-affected-validation/select semantics; no new
Inspector contract or product case is needed for a corrected CLI argument.
Self-review: a string-only spelling assertion would miss tool compatibility;
the regression must actually invoke Yarn. Scoped workflow/script/shared checks,
naming, clean lockfile and actual-head changeset validation close this slice.

The executable regression rejects the old spelling and passes the correction;
a control install confirms the lifecycle sentinel runs without skip-build mode.
The exact repository install and real classifier command pass locally without
lockfile changes; 181 related workflow/routing/aggregate tests pass. The fix preserves the existing relationship-map selections; no downstream
product input, profile selection or required check is altered by the CLI repair.
