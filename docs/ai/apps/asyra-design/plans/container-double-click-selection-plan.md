# Container double-click selection

Status: implementation, bounded self-review and applicable local gates passed; pending PR review.
Owner: this task. PR #298 was merged while this feature was being validated;
rebase the unpushed feature onto its merged main before separate delivery.
Baseline: `eb140cd78883efe3aa5cbbcc730a214a1fbdc273`.

## Bounded contract

Implement the container double-click requirements in
`../prd/element-selection.md#container-double-click-selection`, expressed first
in `../bdd-features/selection.feature`. Scope: Design selection Feature,
canvas-hierarchy controller, grouped FeatureNames, their direct unit/E2E tests
and selection docs. Reuse Core container registration, renderer raw hit identity,
canonical hierarchy projection and selection common APIs. No Framework, load,
render, AI, schema, persistence, dependency or CI-routing changes.

## Reviewed approach

Use the existing browser double-click event. Add an exclusive one-shot selection
Feature before vector double-click editing (priority 100 versus 90). A successful
selection returns a handled result; rejected gestures return null so existing
features retain ownership. Read current selection and Core container capability
before querying a raw hit. Resolve the immediate child using the existing
canonical hierarchy validation and parent chain, checking visibility/lock along
the selected-container-to-hit path. Never infer ancestry from display objects.
Reuse existing selection APIs; do not cache a second hierarchy or add listeners.

Self-review: a raw leaf selection would skip nested levels; a nonexclusive handler
would immediately enter vector editing; a Group/Frame name list would exclude
custom inheritance. The proposed ownership prevents all three. Browser tests must
include the preceding click sequence, since isolated handler tests cannot prove
interaction ordering. Overlap comes from the normal renderer hit, not a new scan.

## Execution card - select-container-child

Architecture: `tools/flow-inspector/inspectors/container-double-click-selection-flow-inspector.data.cjs`, step
`select-container-child`. Inputs: current Select/modifier/path-editing state,
selected IDs, registered container capability, raw hit ID and canonical hierarchy
projection. Output: one immediate child selection or no drill-down change.
Conditions/bypasses and forbidden contributors are the product contract above.
Failure owner is the same App selection step; cache dimensions are empty.
Allowed files: `src/features/selection`, `src/controllers/canvas-hierarchy-target.ts`,
its tests, the App test script registration, `src/constants/feature-names.ts`, `e2e/group-hierarchy.spec.ts` and
selection PRD/BDD/feature/API docs. Stop if this requires a Framework semantic
change or a new product decision outside this contract.

## Sequence and gates

1. Add permanent failing hierarchy, feature registration/guard and browser cases.
2. Implement one App selection owner slice; run naming, typecheck, focused tests.
3. Run existing selection, move, hover, vector editing and hierarchy browser suites;
   inspect a screenshot after nested child selection. Review direct consumers,
   exclusivity, stale/locked/hidden targets and document preservation.
4. Run applicable App lint/build/unit tests and shared local checks; integrate
   latest main, review staged diff and commit. PR #298 merged during validation;
   deliver the new feature in a successor PR. Do not merge.

Completion requires all applicable local gates passing and the requested push.
Report CI separately; pending CI is not a completed CI result. No live AI run or
machine-dependent timing gate is required for this selection behavior.

## Integration revision - resolve-element-point-bounds execution card

The first real-browser run passes both drill-down levels but fails the final
vector double-click for Group and Frame. The existing public
`elementApis.isPointInsideElement` compares a workspace point with parent-local
bounds. Its callers already supply workspace points. Correct that common API by
using the existing Core workspace-to-element-local conversion before the local
bounds test. Preserve padding, empty-point vector editing and near-path handling.
This necessary direct-consumer correction extends the slice to
`src/common-apis/element/apis.ts` and its existing geometry handoff tests; it does
not change Framework or renderer contracts. Add translated/rotated/missing
projection regression cases before that correction. The browser failure is the
integration oracle. No unrelated hit-test redesign is included.

The matching Inspector step is `resolve-element-point-bounds`: App common API
owns the workspace point, computed local dimensions, public transform and local
padding inputs, and returns a boolean without mutation. Missing/invalid projected
coordinates return false. No cache, Pixi access or parent-position fallback is
permitted. Gates are the translated/rotated/padded/missing-projection unit cases,
real nested vector double-click and the registered public API browser case.

## Validation and bounded self-review

- Original behavior fails the permanent browser case: double-click retains the
  outer Group instead of selecting its immediate child. Missing controller and
  Feature registration also fail the initial unit tests.
- The first implementation passes drill-down but exposes the existing nested
  vector coordinate mismatch. Both new bounds tests fail before the common API
  correction; both pass afterward.
- App local suite: 450 Vitest tests pass, including the newly registered Feature
  test file. The related Node test portion passes as well.
- Browser integration: all 46 selection, group hierarchy, group commands and Pen
  cases pass. Final focused checks: Group and Frame drill-down, empty Frame space,
  unchanged computed document data and the actual public bounds action pass
  (3 tests). Screenshots show the selected leaf and no path-edit handles until
  the later double-click. Headless tests use isolated port 3350 and new file IDs.
- A real custom component derived from the Group registration passes the Feature
  test via Core's container capability. No Group/Frame name whitelist is used.
- The final review covers the diff, the subsequent vector-editing consumer,
  all workspace-point query callers, event consumption, missing/locked/hidden
  hierarchy, empty and overlapping hits, and test-script registration.
- Test servers are owned by Playwright and shut down after each run. No user's
  saved document, desktop browser session or AI provider is modified.

## Final gate integration revision

The full Inspector gate exposed two omissions in the newly authored flow:
the generated catalog was stale, then its viewer rejected `cases` where the
existing acceptance contract requires `assertions`. Correct the new data to the
current viewer contract, register its App catalog owner and regenerate the
existing bundle. Strengthen the new formal contract test for acceptance fields.
Run catalog/viewer tests and the full Inspector gate before closing. No Inspector
runtime behavior changes are needed; App gate evidence remains valid because
its implementation and tests are unchanged.

## Completed local gates

Design full workspace lint/build/test:ci and local unit suite pass. Inspector
full workspace lint/build/test:ci passes after catalog generation and acceptance
shape correction. Its focused flow/catalog/viewer suite passes all 26 tests.
Dependency and build-graph gates, final shared validation, naming (15 tests),
typecheck, lint and browser regressions pass. Evidence is retained under
`tmp/group-double-click/`; none of the local browser artifacts are committed.
The merged main tree matches the original baseline tree, so rebasing only the
new feature preserves the validated runtime and contract inputs. Commit-dependent
changeset admission is checked against the actual rebased head before push.
