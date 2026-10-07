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

## Selection outline regression - render owner execution card

User review found that selected inner Groups have no blue box. The Group render
strategy clears its own graphics; its visible content lives in descendants.
RenderGraphics' logical local bounds describe only its own draw commands, so
using that result as world content bounds silently returns an empty rectangle.
This task is bounded to current presentation bounds in Render, its direct
selection consumer tests and matching docs. No new selection algorithm, authored
geometry, persistence, batching policy or dependency changes are allowed.

Owner: `orchestrate-render-adapter` in the existing render-engine-boundary
Inspector. Bound Render objects lazily measure local presentation bounds through
the existing engine capability and opaque handle, then project the cached bounds
for selection. Pending draw commands must reach the engine before measurement;
unchanged queries must not redeliver them. Logical construction/diagnostic bounds
remain separate so evidence collection cannot prematurely deliver pending draws.
The adapter validates finite normalized bounds without inspecting Pixi or
substituting an App rectangle. Allowed implementation is RenderObjectRuntime and
its node adapter plus Render's public content measurement consumer, direct tests,
the Group hierarchy browser regression and matching docs/Inspector contract.
Test-first gates cover visible intermediate Group outlines, native measurement
counts, invalidation, lifecycle and deferred draw delivery. Verify existing
selection/hover and the saved 101 document without changing authored data.

### User-confirmed lazy bounds contract

Children changes invalidate the container and affected ancestors. Bounds are
measured only on demand, retained until invalidated and reused across selection
and API reads. Viewport or ancestor-only transforms must reuse local content
bounds, projecting only four corners. The engine-neutral adapter currently
bypasses this lifecycle for Group graphics. Restore it at RenderObjectRuntime:
cache engine-local content bounds by object lifetime; invalidate on own geometry
and descendant geometry/transform/visibility/membership changes, but not material
only or viewport movement. Use the existing local-content-bounds capability;
engines without it retain their supported world-bounds query. Add/remove/destroy
and document replacement must not reuse old object measurements. Public content
measurement and selection use this same owner. Formal tests must count native
measurements and draw delivery, not merely assert matching output.

### Outline repair validation

- Before production changes, the permanent intermediate-Group blue-outline
  browser oracle fails and 13 lazy-bounds cases fail. The final bounds suite has
  16 cases covering invalidation, reuse, lifecycle, transforms and invalid output.
- Render: all 257 tests pass; its package build passes. Existing selection overlay
  tests pass (4). Browser selection, Group hierarchy, Group commands and Pen
  regressions pass (46).
- Continuous pan/zoom across 20 reads performs one local content measurement;
  multiple descendant edits coalesce into one subsequent measurement. Selection
  and the public content API share the same cached result.
- The full Render suite caught premature draw delivery from diagnostic bounds
  reads during implementation. Keeping logical diagnostic bounds separate fixes
  it while preserving the existing handoff assertions.
- Naming, focused lint and Inspector/catalog contract checks pass. Review is
  bounded to the changed adapter, measurement API, selection consumer and their
  tests; no document, renderer engine, AI workflow or persistence changes.
- Real pointer click/double-click on the user's saved 101 at localhost:3000
  selects the nested Group and displays its blue outline. Screenshot reviewed:
  `tmp/group-double-click/101-group-double-click-outline.png`. Its 8,264 direct
  render children are measured lazily. The user's document remains unchanged.
- Temporary E2E ports are closed. The user's document, collaboration and Vite
  services remain available on 4201, 4101 and 3000 for refresh and manual review.

## Drill-down hover synchronization - bounded repair

Outcome: after entering a child, canvas hover and selection obey the new selected
parent scope immediately, including when the pointer stays still. Ancestors
cannot remain hovered or become ordinary click targets within that scope.
Investigate the existing hierarchy resolver and selection/hover Feature handoff;
preserve modifier bypass, sibling selection, deselection, path editing and
canonical document data. Scope is the double-click Feature, its existing
controller/direct consumer tests, BDD/PRD and matching Inspector step. No new
hierarchy cache or renderer policy is needed. First prove the browser failure
before implementing the missing state handoff; add Feature-level assertions and
controller negative cases. Gates: focused unit and Group/selection/move/vector
browser regressions, lint, types, naming and Inspector contracts.

Step execution: `select-container-child` receives current selected IDs, pointer
hit and validated canonical hierarchy. Successful selection changes the parent
scope; publish the resolved hover for that new scope in the same gesture before
UI publication, through existing common APIs. Rejected gestures remain no-ops.
Allowed/forbidden contributors and document/history boundaries remain unchanged.

### Hover repair evidence and review

The browser oracle fails before repair: selected ID is the inner Group while
hover retains the outer Group with the pointer stationary. The Feature regression
also fails because no hover update occurs. Existing hierarchy resolution already
rejects ancestors correctly, so the repair only publishes the validated child to
hover after selection within the same execution gesture; it does not re-query
geometry, modify the resolver, or add cached hierarchy state.

After repair, 48 focused unit tests and all 46 Group/selection/drag/Pen browser
regressions pass, including stationary hover at both inner Group and leaf levels.
The controller tests retain sibling selection, ancestor rejection and workspace
scope after deselection. Nine Inspector/catalog checks, focused ESLint, App
typecheck and naming pass. Bounded diff review confirms rejected gestures do not
change hover and document data remains unchanged.

The preserved 101 was also reviewed through actual click/double-click on
localhost:3000: selected child and hovered child IDs match immediately, and only
the inner Group outline is visible. Screenshot:
`tmp/group-double-click/101-drill-hover-synchronized.png`.
Temporary test services have stopped; manual-review services remain running.

## Authorized CI routing correction - 2026-10-07

The user explicitly expands this task to repair local/remote selection before
push. The original CI exclusion above is superseded only by this section.
Keep workspace discovery and transitive lint/build compatibility checks. Refine
behavior-test obligations through the shared source graph and relationship map;
do not exclude an App merely because it has a different renderer.

Scope: shared CI classifier/source graph/runner and their formal tests; Sim's
existing supervised unit and grouped browser runner contracts; relationship-map
metadata, local-validation specification and matching Inspector select/execute
contracts. Preserve all budgets, full validation, unknown/deleted input fallback,
zero-test rejection and source/result identities. No App runtime changes.

Select step (local-affected-validation Inspector): consume changed paths, current
and base manifests and explicit source/test contracts; produce exact test files
or conservative full selections. Add Sim supervised selection using its existing
positional file interface. Correct erased named type edges. For explicitly
registered isolated browser proofs, follow declared source inputs using the same
graph; all unregistered browser specs retain coverage, including newly added
specs. App startup remains covered by the ordinary browser integration suites.
Unknown resources, removed inputs and configuration edits retain full coverage.
No lexical guesses that browser tests never navigate or App-name skip lists.

Execute step: preserve each selected owner's supervisor and E2E process groups.
Sim must consume exact selected files and reject unknown/duplicate selections.
The shared runner must use the declared supervised argument contract instead of
hardcoding one owner's --file syntax. Local and remote use the same selection.

Gates: prove failing regressions before implementation; source graph type/value,
consumer and unknown/deletion cases; exact Sim group filtering; classifier/local
parity and aggregate contracts; real Render-change preview demonstrating retained
render consumers and omitted unrelated numerical proofs. Run changed routing
owner tests and applicable local validation, reusing unchanged completed source
evidence. Stop if safe narrowing cannot be established; retain those tests and
report that boundary. Final review stays within these owners and direct runners.

### CI routing validation and bounded review

- Test-first regressions reproduced full Sim unit selection, ignored browser
  selections, and incomplete accounting against the unselected inventory.
  Unknown/new browser specs and deleted/configuration inputs retain coverage.
- Review found a new-owner edge: profile-named tests must not disappear when
  that owner has no separate profile task. A permanent fixture reproduces the
  omission; these files now stay in the ordinary supervised invocation.
- Render-only routing selects 29 of 176 Sim unit files and 36 of 44 browser
  specs. The omitted eight are isolated computation proofs, including the three
  expensive representative candidates. FieldScope retains 9 unit files, 4
  runtime profiles and its full browser integration; these actually consume the
  shared runtime. All affected lint/build checks remain selected.
- The actual Sim CI runner executed one selected navigation spec: 5 passed,
  one selected group, no extra groups or incomplete-result failures.
- `tmp/group-double-click/ci-routing-validation2` passed shared checks, full Sim
  lint/build/unit/browser validation, full Inspector checks, Design functional
  E2E (386 passed, 18 existing conditional skips) and Render contracts (3 passed),
  with sourceVerified=true. The previous unchanged owner/build/collaboration
  evidence is retained from the earlier local validation runs; input hashes
  were compared before reusing it. The earlier Sim navigation interruption was
  rechecked without code changes and the complete suite now passes.
- Final selector/metadata verification and the actual narrowed supervised
  invocation follow the profile-retention correction. No renderer, App runtime,
  dependency or environment code changed during this CI-routing segment.
