# React Presentation Migration

Status: IMPLEMENTED AND LOCALLY VALIDATED; PR delivery is authorized and pending.
Checkpoint `7fd401189` was explicitly pushed as an unvalidated snapshot before
this independently authorized correction. The checkpoint exception is not used
for the current delivery.

## Task contract

### Shared validation inventory and PR delivery

Follow-up for run `41206334526`: all upstream jobs passed, but the lint
producer omitted `executedFiles` after switching to the root lint command.
The aggregate correctly rejected that incomplete evidence. Repair the producer
in `scripts/run-ci-checks.mjs`, prove the real CLI reports its root target, and
pass producer-generated results through the existing aggregate tests. Retain
identity, digest, failure and missing-evidence rejection. Scope is limited to
this producer, its direct tests and delivery notes; no product or template
changes. Validate CI/local orchestration suites, lint, naming and metadata,
then push for ordinary PR execution without dispatching or monitoring CI.

The real CLI regression failed with `executedFiles` undefined before correction.
After correction, 160 CI/local/aggregate tests pass, including producer-to-
aggregate success and execution-failure rejection; 72 final aggregate/document
contracts also pass. The downloaded CI artifact matches the source/run identity,
relationship digest, execution-plan digest and all selected inputs: the missing
lint target is the isolated mismatch. Naming, formatting and update guidance
pass. Evidence: `tmp/readability/validate-*`. No aggregate acceptance rule,
workflow dispatch, product test or resource guard was changed.

Follow-up after PR run `41200509598`: the previous gate selection missed two
direct workflow-string consumers and the generated public source map after the
root manifest changed. Correct the release-audit and Sim supervision contracts
for the shared CLI without changing their enforcement, regenerate public docs
through their canonical generator, and validate the full repository script suite,
Sim supervisor suite, website build and production artifact verification. Also
diagnose the 120-second Design localization/recovery timeout using its existing
real-runtime test and retained logs; preserve all scenarios, source identities,
recovery assertions and process/time guards. Edits are limited to these failed
owners, their regression tests and required generated documentation. No product
feature, template, manual CI dispatch or monitoring is authorized by this repair.

The existing localization test reproduces the same five full Vitest invocations
locally in 66.8 seconds; CI exhausted the enclosing 120-second limit. Each child
already has a 30-second limit, so five individually valid children can exceed
that envelope. Isolate each cumulative fault combination as a complete
baseline/fault/recovery case (three children per case). Keep all 85 product cases
in every invocation, every cumulative mutation combination and history/mapping
assertion, the 30-second child guard and 120-second case guard. Do not change App
runtime, timers or assertions. This is the `localize-test-results` verification
boundary: captured source, ordinary reports and retained recovery history remain
authoritative; no product step semantics or conformance verdict changes.

Repair validation: the three existing workflow/source-map regressions failed
before correction. After correction, `yarn test:scripts` passes 551 tests plus
all four real workspace build modes; its existing installer opt-in remains
unselected. The shared control-plane command passes 629 tests with zero failures
or cancellations (57 existing conditional cases unselected). All three isolated
Design recovery cases pass in about 40 seconds in that complete run. Flow rerun
tests (2), core proof and candidate proof pass. Sim's official `test:ci` passes
its 13 supervisor contracts and all four supervised phases: ordinary (877),
heavy (4), representative (1), witnessed-zero (4), with completed and reaped
processes. Production builds for all three artifact owners, Design typecheck,
three production browser tests and five resource-evidence contracts pass.
Full lint has zero errors and 110 existing warnings; naming and focused lint
pass. Evidence is under `tmp/readability/ci-repair-*`. Conditional/opt-in cases
are not counted as passed, and no skip or timeout setting was changed. Remote
CI remains for the user to inspect after the authorized push.

The current delivery slice consolidates existing local and CI development
commands in `scripts/validation-checks.mjs`. Full PR selection uses `ci:full`
on the ordinary push-triggered PR workflow. Authorized edits cover the command
catalog, local adapter, CI wiring, direct regression tests and owning guidance.
Preserve every selected owner, supervision/resource limit, result identity and
aggregation guard. Product behavior, template generation and release behavior
are excluded. This internal orchestration refactor does not change Inspector
product steps or their accepted semantics.

Validation covers command inventory parity, real CLI invocation/failure
propagation, stale/tampered evidence rejection, local-runner cleanup, CI scope,
workspace scheduling and workflow aggregation, plus lint, naming and metadata
gates. Stop if these require weakening checks. After validated commit and push,
handoff to the user: do not manually dispatch, rerun or monitor CI.

Local evidence for this slice: 207 orchestration/aggregation regressions and
24 direct workflow/source contracts pass. Full repository lint passes with
110 existing warnings and no errors; naming (15 tests) and changed-source
format checks pass. The real full inventory resolves 37 commands, 26 workspaces,
33 profile files and four browser suites without unresolved owners. Dependency
and build-graph commands pass through the new evidence-verified CLI. Logs and
the inventory are under `tmp/readability/full-catalog-*`. These are scoped local
results, not a claim that the next full remote CI run has passed.

PR #363 delivery correction: the scope job exceeded GitHub Actions' 1 MB
job-output limit before product checks started. The bounded correction covers
CI plan serialization, workspace artifact consumption, workflow wiring and
regression coverage; it does not change selected checks or product behavior.
The full evidence artifact remains authoritative. Workspace readers verify its
execution identity, relationship digest and scheduled owner. The large-plan
regression and existing CI/local-runner suites pass (88 tests); focused lint,
workflow formatting and naming pass. Replaying the actual PR classification
produces 13,822 UTF-16 output bytes. Remote exact-head validation remains pending.

This chat owns the correction and closeout. Implement all maintained Flow
Inspector browser presentation in React. Remove iframe composition, imperative
viewer implementations, standalone embedded-renderer HTML generation, legacy
renderer adapters and their obsolete entrypoints. Do not retain a parallel
compatibility implementation. An HTML document that only mounts the React
application remains a necessary browser entry document, not a second renderer.

Keep current architecture data, evaluation and revision-checked action contracts.
Preserve flow selection, catalog search, lane filters, selection/detail panels,
routes, artifacts, invariants, acceptance contracts, zoom/pan/fit, narrow layouts,
task notes and drafts, manual acceptance/reopen, rerun preview/confirmation and
cancellation, evidence/localization and the currently supported control-plane
actions. The UI must consume authoritative service verdicts rather than derive
completion. Invalid or missing data must be visible and disable writes.

Scope: `tools/flow-inspector`, its direct build/serve/package consumers, owning
documentation and formal tests. Repository-wide readability changes are frozen
at the checkpoint. Generated app templates, Framework runtime behavior, external
deployment, publication and unrelated release failures are excluded. No subagents.

## Architecture and implementation slices

### CI repair segment - detail scroll visibility

Owner: `services`, consuming the admitted architecture and authoritative retained
assessment snapshot. The task contract requires readable detail panels at narrow,
tablet and desktop widths. The presentation flow's services step permits React
presentation under `src/` and control-plane proofs; service verdicts, history,
acceptance and legacy renderer paths remain excluded. The required output is the
same assessment identity visible below the sticky close control after scrolling.
No bypass or new cache is introduced. Failure belongs to presentation layout.
The existing Board geometry oracle failed in CI; explicitly aligning the summary
to the scroll start reproduces it locally. Limit correction to the detail scroll
container in `src/workspace.css` and its Board regression. Gates are the focused
three-width browser proof, React build/tests, lint and screenshot inspection.
Stop if correction requires changing assessment semantics or weakening the oracle.

The strengthened Board proof now passes at all three widths after reproducing
the sticky overlap before correction. React tests (23), build and focused lint
pass; the narrow screenshot shows the complete retained identity below the
close control. No assessment service behavior changed.

The next bounded CI repair is the Design execution-proof test's clock ownership.
Its real 100 ms work window includes asynchronous setup, and CI expires before
the first turn starts. Keep the production deadline and all original assertions;
control the test clock and advance the same 100 ms only after the scripted first
turn is observed. Limit edits to this test and delivery notes. Verify the focused
proof and its complete test file, naming, lint and typecheck before delivery.

The corrected deadline proof and all 85 tests in its file pass. The declared
Design `typecheck` gate, naming and focused lint pass (one unchanged console
warning). The generic `tsc --noEmit` diagnostic used the broad test configuration
and reported existing test typing mismatches; it is not the package's declared
typecheck entrypoint. Generated Inspector CSS was rebuilt from canonical source.
Remote verification must use a new full workflow dispatch on the repair commit.

Full CI exposed a remaining desktop boundary: the summary started 0.375 px above
the close control's bottom after fractional scroll rounding. Re-review of the
same services presentation contract keeps the scope unchanged. Reserve the same
8 px readable gap on desktop as on narrow layouts, and strengthen the geometry
oracle to require at least 4 px of separation. The stronger oracle fails locally
before correction (the previous desktop gap was exactly zero). This changes
layout spacing, not tolerance, service behavior or the accepted assessment.

1. **Architecture presentation.** The React architecture viewer owns rendering
   of admitted schema-v2 target, lanes, steps, routes and detailed contracts.
   Inputs are immutable architecture data, controlled selection and explicit
   panel actions. Outputs are React DOM/SVG and user selection/viewport events.
   Missing/invalid input produces a local error, never an old renderer fallback.
   Contributors: React components and pure layout helpers under `src/`.
   Forbidden contributors: legacy viewer globals, injected scripts, iframe DOM,
   service verdict recomputation. Failure owner: architecture viewer.
2. **Workspace composition.** The React workspace owns catalog/search/navigation
   and passes selected admitted data directly to the viewer. Remove target-frame
   messaging, old target HTML/JS and legacy-v1 rendering. Inventory every current
   catalog kind before choosing its presentation; do not silently omit current
   targets. Nine sources are declared contract documents, previously displayed
   as their original fields. Register those sources explicitly and render their
   untouched fields in React without a schema-version adapter or automatic
   fallback for unknown sources. Do not fabricate missing architecture semantics.
   Failure owner: workspace navigation/catalog admission.
3. **Live service presentation.** React task and control-plane surfaces own
   subscriptions, draft/selection lifetime and user intent. Existing services
   remain owners of evaluation, authorization, preview bindings and writes.
   Refresh does not launch commands. Preserve stale-write rejection, invalid-file
   diagnostics, cancellation and cleanup. Remove DOM injection/MutationObserver
   presentation bridges. Failure owner: each service request boundary.
4. **Delivery.** Vite owns React build output; servers/package CLI serve that
   output. Remove embedded standalone generations and obsolete compatibility
   tests, replacing them with React/served-build behavior proofs. Canonical
   architecture validation remains independent of browser presentation.

Routes: catalog or service snapshot -> admitted architecture -> React viewer;
React user action -> existing service -> authoritative snapshot -> React state.
No downstream UI may regenerate an upstream verdict or route through old DOM.

## Verification and completion

Add failing React behavior tests before each implementation slice. Cover normal,
empty, invalid, filtered, narrow, refreshed and stale-action states. Use existing
formal browser/service suites to preserve accepted interactions and trust bounds.
Validate typecheck, React tests, contract tests, flow-file and control-plane tests,
installed consumer/build gates and visual browser review. Review each direct
consumer and the bounded diff. Search the owned browser/build entrypoints for
remaining iframe/legacy renderer references before declaring migration complete.

Do not claim completion after adding a React shell or after one component passes.
All four slices and their affected integration gates must pass. The prior
checkpoint exception does not authorize pushing failing refactor versions.

## Progress

### Final local validation

`yarn validate:local --full --run` completed with all 37 checks passed and
`sourceVerified: true`. Evidence is
`tmp/local-validation/9b025ed0-b954-4062-a646-8776864abe7e/result.json`.
All workspace checks, Fieldscope profile groups and 684 control-plane tests pass.
The separate Inspector semantic suite passes all 351 tests. Browser results
include 19 collaboration, 32 Board, 504 functional and three render-contract
passes. Existing environment/evidence-dependent skips are not passing evidence;
no new skips or weakened behavioral assertions were introduced. Remote CI is
pending. The earlier blocker descriptions below are retained as work history,
not the current result.

### Full validation corrections

The user authorizes correcting the four remaining validation blockers. Restore
the immutable pre-P5b fixture bytes without changing their manifest or oracles;
separate their historical-source ownership from editable-source lint fixes.
Correct the archived launch Inspector's authority after hosting retirement and
the vector material cache evidence contract against the current Preset owner.
Preserve Next.js-generated instructions before collecting a fresh validation
identity; do not exclude that file from source verification. Run focused
regressions, the complete Inspector suite and full local validation again.
No deployment, template changes, runtime redesign or weakened checks are allowed.

Correction results: all 351 Inspector contracts pass after canonical catalog
regeneration; the three vector mesh work-count/behavior tests pass. The frozen
source profile passes after restoring nine files from their manifest-pinned Git
blobs, with every original SHA-256 retained. Source-identity runner regressions
and focused lint pass. Evidence: `tmp/readability/corrections-inspector-tests.log`,
`material-work-counts.log`, `frozen-source-restored-profile.log`, and
`source-identity-regressions.log` in the same directory.

Full validation is pending an explicit user decision: the immutable historical
fixture now triggers 76 `curly` errors, with no other ESLint errors. Changing
those bytes breaks the original digest oracle. The user requested no relaxed
checks, so no lint exemption has been added; a narrowly scoped historical-format
exemption was proposed for approval. Do not launch or claim a green full gate
until this conflicting requirement is resolved. The generated site AGENTS.md
is preserved before the next input-identity snapshot.

The user subsequently approved retaining historical comparison and excluding
the manifest-pinned fixture from formatting. The exact directory now disables
only `curly` and Prettier formatting, and standalone Prettier ignores it. Other
ESLint checks remain active. A permanent workspace-automation regression proves
that current source and neighboring fixtures still report missing braces, all
three paths retain semantic lint, and only the historical path is formatter-ignored.
The regression failed before the override and passed afterward. Full validation
is resumed with the source-identity guard unchanged.

- Checkpoint pushed; current entrypoints inventoried: React workspace, static
  architecture viewer, flow-file task dashboard and control-plane board.
- Architecture presentation is in progress under `src/architecture/`.
  The admission CLI accepts `react-presentation-migration/presentation.flow.json`;
  task evidence remains unaccepted until its gates pass.
- Formal React tests were added before implementation and failed for the absent
  component, absent viewport controls, cross-lane route geometry and controlled
  selection. Eight current tests cover direct DOM/SVG rendering, lane filtering,
  fit/reset, refreshed contracts, controlled selection, inert authored text,
  empty data, pointer zoom work counts and listener disposal.
  Local evidence is under `tmp/readability/react-*.log`.
- The production workspace now composes React architecture directly. Catalog,
  routes, history, panels and relative links have focused coverage. The nine
  explicit contract documents retain all source fields in a React document view.
  Source data and source membership are unchanged. Old standalone/target files
  still exist for removal in the delivery slice; live service UIs remain old.
- The served workspace browser test caught a narrow-screen detail overlay
  blocking panel controls. The layout boundary is corrected and the test passes
  with ordinary clicks. Screenshots and metadata are in
  `tmp/readability/react-browser/`; screenshots were inspected. Typecheck and
  focused source lint pass. No full migration or full validation is claimed.
- Latest focused verification: 17 React tests, 8 catalog contract tests and the
  served React browser test pass; typecheck, build, focused ESLint and diff
  whitespace checks pass. The source and generated workspace build are
  uncommitted after the checkpoint. The tool-local `.env` was initialized from
  its example because it was absent; it remains ignored and must be preserved.
- Next: finish bounded workspace contract checks and malformed-input coverage;
  migrate flow-file task and control-plane browser presentation. Then remove
  superseded assets/adapters, update direct delivery contracts, rebuild and run
  the final tool, browser, installed-consumer and repository validation gates.

### Service slice iteration

The initial direct-mount browser gate now passes. React owns the live dashboard,
control-plane controls, node observations, comments and explicit rerun previews.
Live browser tests pass. The first full localization browser run passed 17 of 19
cases; one old panel-toggle selector and one brace-sensitive Design scenario
mutation require direct-consumer corrections. The scenario correction changes
only its injection strings, not application behavior or the expected failures.

Before expanding delivery changes, close the existing service behavioral tests:
target commitments and drafts, task/review controls, contract/mapping decisions,
history, current-source evidence and viewport/failure navigation. Compare each
request with the existing service DTO and each display with the authoritative
projection. The target catalog uses `obligations`, and saved work commitment
property order must survive editing because the current owner compares serialized
commitments. Do not invent alternate DTOs or relax those owner checks.

Current failures are bounded to this presentation and its direct browser test
selectors. Retain the full tests, update iframe locators to the direct document,
and keep all behavioral assertions. Aborted stale requests replace old response
completion expectations; still prove that stale selections cannot replace the
current UI. No old browser asset is removed until its replacement behavior is
covered. Then remove the obsolete delivery paths and run final gates. This is
an implementation checkpoint, not a completed migration or approved push.

Service verification now covers 22 React tests, including catalog admission,
transient subscription recovery, idle polling termination and aborted selection
isolation. Typecheck passes. The live dashboard's two browser cases and the
target decomposition browser case pass. Original canvas/history and narrow
workspace checks pass; all catalog detail layouts pass. Localization passed
17 of 19 cases, and the two transient-history failures pass after the subscription
retry correction. Re-run the complete suite on the final build.

Target assessment, all catalog links and full-runtime fixture integration now
pass their focused browser proofs. Delivery removal has proceeded: the old
viewer, embedded HTML generator, iframe target and adapter, imperative dashboard
and Board scripts, 25 standalone HTML files and their server redirects are
deleted. React catalog equality and actual built React tests replace the obsolete
HTML-presence tests. Source links resolve from both served and file entrypoints.

Final verification is in progress. React tests (23), typecheck, package and
delivery contracts (77), flow-file service tests (61), installed consumption and
selected rerun pass. Root lint has zero errors and existing warnings. The live
dashboard regression caught duplicate selected-node headings; the action section
now has its own heading and both live browser cases pass. Full Board and service
suites are running; an offline-provider Board case still needs diagnosis.

The expanded Inspector semantic suite has 348 passing cases and two failures in
unchanged contracts: website launch references `vercel.json`, and render-delta's
cache inventory omits `evaluate-vector-material`. These are not silently waived
or changed as presentation work. Preserve this distinction in final evidence.
No additional commit or push has been made; completion remains unclaimed.

## Final service iteration

The complete Board suite exposed two service-presentation lifetime mistakes
after the earlier focused passes. A newly created task selection was overwritten
while the summary list still described the previous task. A completed run could
reuse its in-flight cached record when state polling stopped. These violate the
services step's authoritative snapshot and selection-preservation contracts.

Keep the correction within `TaskReview.jsx`, `ControlPlane.jsx` and their formal
React/browser tests. Preserve a selected task per owner step across summary
refreshes; retain an explicitly returned new task ID before its summary arrives.
Bind run reads to the authoritative run summary and explicit action revision,
so completion and CI mutations invalidate the retained record. Do not add timed
fallbacks, derive verdicts, alter service DTOs or loosen assertions.

The existing offline-provider, canvas failure/recovery, mapping, Phase 4 and
Phase 5 browser cases detected these bugs before correction. Re-run those five
cases first, then the complete Board suite and final development validation.
Self-review confirms the changes remain inside the services owner and preserve
the unchanged service evaluation, cancellation and cleanup contracts. The two
retained-live provider/GitHub cases require existing external evidence IDs; absent
evidence is unavailable coverage, not passing evidence or permission to create
new external executions.

## Final verification record

All four implementation slices are present: direct React architecture/workspace,
React live dashboard, React control-plane and removal of old delivery assets.
There are no iframe, postMessage, old viewer globals or target HTML paths in
production React source. Generated app templates remain unchanged. The five
service regression cases pass after the selection and record-lifetime correction.

The full development run is retained at
`tmp/local-validation/fe70752b-de16-43cf-97be-ac41cb5ab077/`. Security audit,
dependency validation, build graph, declarations, shared checks and every
workspace passed. Shared checks include repository lint and naming; lint has
zero errors and existing warnings. Flow Inspector typecheck, 23 React tests,
77 delivery/package contracts, 61 flow-file service tests and installed-consumer
validation pass. Both live dashboard browser cases and the served React workspace
browser case pass. Desktop, narrow and detailed service screenshots were inspected.

The full runner correctly stopped at Fieldscope's source profile failure:
`crop-partitions.source.profile.test.ts` reports a frozen `crop-models.ts` digest
mismatch. That source and its frozen contract were not modified by this refactor.
The heavy profile group passed. The unexecuted collision profile was then run
explicitly and passed; the remaining profile group completed with 40 passing tests.
Receipts are `tmp/readability/react-profile-collision.log` and
`tmp/readability/react-profile-remaining.log`. No assertion or baseline was relaxed.

The remaining original validation commands were executed sequentially through
the existing guarded runner, with the original input-identity check retained.
Results are in `tmp/readability/react-remaining-validation/`:

- Control-plane: 684 tests passed, zero failures. Both Design cases affected by
  concurrent package rebuilds in the earlier diagnostic run pass sequentially.
- Collaboration E2E: 19 passed, three conditional high-detail/recording cases
  skipped by the ordinary suite configuration.
- Board E2E: 32 passed, zero failures; two retained-live provider/GitHub cases
  lack the required existing evidence IDs and remain unverified.
- Functional E2E: 504 passed, zero failures, 16 conditional cases skipped
  (explicit profiling, retained local documents, or alternate app configuration).
- Render correctness/work contracts: all three tests passed.

Skipped cases are not passing evidence. The remaining runner's overall status
is `unverified`, despite every command passing: the site E2E's Next.js generator
changed `apps/asyra-framework-site/AGENTS.md` from a level-one to a level-two
generated heading. Comparing the original and final input manifests found this
as the only changed input. The generated change is preserved and the original
result is not rewritten as a pass.

The additional Inspector semantic suite passed 348 of 350 tests. Its two
unchanged semantic failures are the website launch authority's missing
`vercel.json` and render-delta's cache inventory omitting the existing
`evaluate-vector-material` step. Evidence is
`tmp/readability/react-inspector-contracts.log`. They remain outside this
presentation refactor. Consequently this record does not claim a fully green
repository, accepted integration criterion, or permission to push a failing
version. Runtime behavior outside the Inspector and frozen evidence baselines
remain untouched.

## React-only presentation review

The follow-up review covers production presentation source, all browser entry
documents, server asset routes, build/package delivery and current tool documents.
Workspace and control-plane mount through `src/main.tsx`; live flow documents
mount through `src/live-main.tsx`. Both use React roots and share React
architecture components. No production iframe, frame messaging, imperative HTML
injection or old viewer global was found. React effects retain only browser
interaction/subscription work with cleanup; backend services remain authoritative.

Corrected the stale workspace README that still described iframe composition
and standalone renderers. Added a delivery contract that requires empty React
mount roots, external scripts, no frames and no inline event attributes. The
existing 77 delivery contracts and 23 component tests passed again; both delivery
guard cases and focused lint pass. No runtime implementation changed in this review.

The user's subsequent clarification establishes the first release as a complete
React project, with formats chosen according to implementation needs. File
extensions are not the acceptance criterion. Necessary mount documents, CSS,
data, tests and build configuration remain; all product UI stays React-owned.
Future backend-dashboard architecture is excluded. Existing service-backed
features remain functional without redesigning their service contracts.

The final project-organization slice moves presentation styles into their React
source owners, updates direct imports/package boundaries and documents the React
development/build/test workflow as the primary contributor entry. Architecture
and delivery are the affected owner steps. Preserve CSS bytes and import order,
public URLs, CLI behavior and offline opening. Verify naming, build, typecheck,
component/delivery/installed-consumer tests and the live/workspace browser proofs.

The project-organization slice is complete. Both production CSS hashes are
identical before and after relocating styles. Catalog generation and both Vite
builds, typecheck, component/contracts/flow-file tests, installed-tarball tests,
workspace browser proof and both live browser proofs pass. Focused ESLint,
naming and whitespace checks pass. Evidence is under
`tmp/readability/react-project-*.log`. README formatting still reports pre-existing
code-example and table formatting; the new contributor instructions introduce no
formatter differences. The previously documented unrelated repository failures
remain unresolved and are not reclassified as passing. No template was changed,
and this slice was not pushed.
