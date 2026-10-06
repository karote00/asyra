# FieldScope affected test routing

Status: IN PROGRESS

## Bounded delivery

Preserve every ordinary, profile and browser assertion and all supervisor guards.
Select exact affected test files from the source dependency closure; supplemental
resource relationships belong to the repository CI relationship map. Unknown,
deleted, configuration or upstream workspace inputs select the complete relevant
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
An unresolved edge broadens selection rather than excluding tests. Upstream package
changes remain full-owner because source/dist and re-export dependencies require a
separate proven cross-package resolver. Static imports do not cover browser routing
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
