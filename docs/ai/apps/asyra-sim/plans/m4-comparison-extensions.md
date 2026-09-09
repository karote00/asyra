# M4: Variant Comparison, Versions, and Private Extensions

Status: bounded implementation and formal validation complete; user acceptance
and closeout are pending. Live automation limitation is recorded below.

## Baseline and bounded contract

PR #175 is merged (2026-09-09); fetched `origin/main` is
`ffa0beb8228b3c57ed0ff81e9ac59a56f82b8afc`.
Worktree: `.worktrees/asyra-sim-m4-comparison-extensions`; branch:
`codex/asyra-sim-m4-comparison-extensions`.
The user explicitly authorizes M4 alongside pending M3.5 acceptance. This
supersedes only the earlier scheduling dependency, not M3.5 acceptance or
closeout. M2 and M3 remain accepted. No remote operation is authorized.

Outcome: ordinary users configure installed methods, explicitly run three
independent candidates, understand revisions and comparison conditions, and
export/reopen their evidence and separate observations. Developers reproduce
the existing trusted pre-start SDK integration without changing Core.

Discovery is fixed to current six-owner App callers, their direct contracts,
permanent tests and R0 Inspector routes. Review candidate classes are identity
and revision preservation, immutable resource/reference integrity, comparison
disclosure, report safety/parity, separate observations and exact method
admission. No repository-wide cleanup follows from this review.

Authorized files: the corresponding App editing, storage, snapshot/extension,
runner and UI owner allowlists, direct permanent tests, existing thin App specs,
R0 Inspector data/generated output, this plan and operation/index documents.
One Inspector owner is completed before advancing. Bugs require a failing
permanent regression before production changes. Existing sufficient behavior
is verified and retained rather than rebuilt.

Gates: focused owner tests; full App tests; App build/typecheck/lint; naming;
Inspector contracts and test placement; bounded normal-App E2E for comparison,
retained runs, projects, observations, methods, acceptance, storage failures,
Worker outcomes, workflow and desktop/576 x 690 layout. Use the same explicit
`APP_URL=http://127.0.0.1:3020` for server and browser tests. Inspect emitted
normal-App screenshots and operate the live App. Preserve browser-local data.

Keep canonical Scene Tree/Props, Feature transactions, publication persistence,
authored-input validity separation, source geometry, solver accuracy/budgets,
immutable history, registered fine-grained projections and natural panel
scrolling unchanged. No second state/history/catalog/conclusion, eval, uploaded
code, hot installation, new dependency/tool, Preset extraction, M5 packaging,
M6 release, push, PR, merge, tag, publish or deploy. Stop for an out-of-scope
prerequisite or unresolved contract/product decision; repair in-scope readiness
before code. User acceptance alone permits later closeout discussion.

## Owner sequence and discovery

1. **Experiment revision (`edit`)**: existing material-revision/no-op/stale-write
   tests and duplication remapping/lineage tests cover canonical ownership.
   Verify copies of copies, history and independent inputs; no solver is invoked
   by copy or selection. Candidate is the editable model container; experiment
   revision versions its definition; a run freezes inputs and evidence.
2. **Result storage (`storage`)**: existing archive, visual-project, publication,
   repository and session tests cover immutable identity, retained-only sources,
   acknowledgement, failed-head retry and canonical recovery. Verify rather than
   replacing the established publication queue.
3. **Comparison (`storage`, then `ui`)**: existing comparator supports two/three
   runs, lineage correspondence and incompatible rules/declarations. The UI
   currently omits explicit candidate/experiment revision context in selection
   and comparison columns and keeps a two-column library on short narrow views.
   Add permanent user-boundary regressions and correct presentation only.
4. **Export (`storage`)**: existing reports and portable formats retain canonical
   records, declarations, sources and separate annotations; verify hostile text,
   byte caps, corrupted resources and reopen parity.
5. **Field observation (`edit`, `storage`, `ui`)**: existing completed metadata
   edits, explicit attachment acceptance, Undo and source capture remain the
   behavior. Verify independent observations without rewriting results.
6. **Extension (`snapshot`, `run`, `ui`)**: retain the single installed catalog
   and independent static-sphere example. Verify parameters, capability/version
   failures, historical reading, conformance and real Worker termination through
   the ordinary shared execution and report paths.

## Step execution cards

Cards use the complete current R0 Inspector fields and connecting routes, read
before each segment. These are execution notes, not additional product authority.

### Experiment revision verification

Owner/failure: `edit`; specs: robot-workcell sections 9/11 and editing-v0 Intent
and Application. Inputs: runtime/domain plus edit intent. Output: committed
model under one Feature/Core transaction; load/replay bypass new intent.
Allowed: Feature and Core facades. Forbidden: direct SDK mutations, another
history or input-layer decisions. Boundary: existing common-apis and Feature
tests. Gates: editing and candidate duplication tests (material/no-op/stale
revisions, source remapping, copy-of-copy lineage, Undo/Redo). No production
change unless a permanent case identifies a contract failure.

### Result storage verification

Owner/failure: `storage`; specs: local-storage-v0, robot-workcell 9/10.
Inputs: canonical capture/publications, validated result and verified resources.
Output: immutable retained data and separate durable acknowledgement.
Missing methods permit reading only. Allowed: local storage, owned decoder and
Core task facades. Forbidden: evidence rewrite, remote upload and guessed units.
Boundary: storage tests. Gates: run-record, visual-project, publication-repository,
project-publications and project-session including failure/retry and replay.

### Comparison verification and UI correction

Storage segment consumes validated retained records, produces disclosed input
differences and incompatibilities, and never ranks or reruns. Boundary:
run-comparison and its direct tests; spec: robot-workcell section 9.
UI segment owner/failure: `ui`; inputs: existing immutable runs and transient
selection; output: accessible ordinary workbench. Route: retained-data-to-ui.
Allowed: ordinary UI controls and existing comparator. Forbidden: inferred
lineage/names, rewritten evidence, geometry/decision computation or a new store.
Boundary: UI results, direct UI/E2E tests and current spec/Inspector/guide.
Cases: explicit candidate/experiment/revision and selected run slots; two/three
distinct runs; incompatible/partial states; zero analysis during selection;
keyboard focus and 576 x 690 reachability. Existing immutable IDs are displayed
without new persisted fields or inferred historical names. No cache introduced.
Gates: run-library regression red/green, existing comparison tests, normal
candidate-comparison/retained-run E2E and inspected desktop/narrow views.

### Export verification

Owner/failure: `storage`; inputs: retained records, canonical capture and verified
resources; output: safe reports/portable project. Specs: robot-workcell 10,
local-storage-v0 and extensions-v0 Replacement and Versioning. Allowed:
existing serializers; forbidden: current-catalog substitution or UI text as
canonical data. Boundary: storage and direct export tests. Gates: run-record,
report-text, project-format/visual/observation-project and ordinary reopen.

### Observation verification

Sequential owners: `edit` metadata transaction, `storage` opaque sources, `ui`
completed gestures. Failure remains with the corresponding owner; no cross-owner
production segment. Spec: field-observations-v0. Inputs: retained run reference,
bounded authored metadata and admitted attachment receipt; outputs: independent
canonical note and separate portable feedback. No note inside RunRecord; no
content execution, calibration or inferred truth. Gates: observation contract,
Feature/archive/project/UI tests and field-observations E2E with Undo/export.

### Extension verification

Sequential owners: `snapshot` admission, `run` Worker/result, `ui` configuration.
Specs: extensions-v0/extensions-sdk-v0; routes snapshot-to-run/result-to-storage.
Inputs: immutable pre-start catalog, current parameters/capabilities and frozen
snapshot; outputs: admission or explicit error, validated result and ordinary UI.
History bypasses installed-code lookup but never permits substitution. Allowed:
declared schemas, exact Worker dispatch and result validation. Forbidden:
runtime catalog mutation, uploaded code, eval, Core modifications or a second
solver example for output volume. Gates: catalog/execution-admission,
method-conformance/runner, existing static-sphere numerical tests and methods
browser cases. Record reproducible commands in the existing SDK guide.

## Evidence and next checkpoint

The six owners satisfy the frozen implementation and formal-test conditions.
Existing revision/lineage, immutable archive/publication, comparison semantics,
export, observations and installed-method execution were verified rather than
reimplemented. Production corrections are restricted to the comparison UI:
ordered removable slots, explicit frozen provenance, retiring stale comparison
references, short-view stacking, Escape and focus restoration. No solver,
canonical schema, persistence queue or catalog changed.

Permanent tests first reproduced the missing selection context, stale comparison,
removed-run reselection, narrow layout and Escape failures. The corrected gates
pass; comparison remains an explicit action, with a five-notification work-count
regression proving no repeated comparator invocation and correct invalidation.

| Owner/gate | Result | Local evidence under `.artifacts/` |
| --- | --- | --- |
| Experiment revision/duplication | 27 tests / 2 files | `m4-edit.log` |
| Archive/publication/session/comparison | 38 tests / 6 files | `m4-storage.log` |
| Export and portable resources | 22 tests / 5 files | `m4-export.log` |
| Independent observations | 26 tests / 5 files | `m4-observation.log` |
| Catalog/admission/conformance/runner/example | 31 tests / 5 files | `m4-extension.log` |
| Final comparison UI and focused consumers | 12 tests / 4 files | `m4-ui-final.log` |
| Complete App unit/integration suite | 663 tests / 118 files | `m4-full.log` |
| App build (including TypeScript), lint | Passed; existing bundle-size advisory | `m4-build.log`, `m4-lint.log` |
| Repository lint | Passed: 0 errors, 79 existing warnings | `m4-root-lint.log` |
| Naming | 11 tests | `m4-naming-final.log` |
| Inspector catalog/workspace | 100 tests | `m4-inspector.log` |
| Test placement | 2 tests | `m4-placement.log` |

Normal-App browser coverage totals **47 distinct cases**, all with passing final
executions. Groups: candidate comparison/retained runs (3), methods/observations/
acceptance (5), persistence/projects/resources (13), formal outcomes/workflow/
review (17), plus Worker and IndexedDB browser contracts (9). The final affected
browser batch reruns comparison with those last nine cases: **11 passed** in
`m4-final-browser.log`. Earlier grouped evidence is `m4-comparison-final.log`
(retained/Undo passed; Escape failed and was corrected),
`m4-comparison-reopen.log`, `m4-method-observation.log`, `m4-persistence.log`
and `m4-workflow.log`. Do not read the pre-correction failed batch as the final
Escape outcome.

Reproduce the final main gates from the worktree:

```sh
yarn workspace @asyra/asyra-sim test:local
yarn workspace @asyra/asyra-sim build
yarn workspace @asyra/asyra-sim lint
yarn lint:naming
yarn workspace @asyra/flow-inspector test:contracts
node --test scripts/__tests__/test-file-placement.test.mjs
APP_URL=http://127.0.0.1:3020 yarn workspace @asyra/asyra-sim test:e2e src/analysis/__tests__/runner.browser.spec.ts src/storage/__tests__/runtime.browser.spec.ts e2e/__tests__/candidate-comparison.spec.ts --output=../../.artifacts/m4-final-browser
```

### Normal App review and handoff

The server uses `APP_URL=http://127.0.0.1:3020`, Vite PID **47332**, from this
worktree. The previous same-project server was explicitly authorized for takeover
and was stopped. No existing browser project was cleared. Ordinary App E2E ran
through the same 3020 server, including real Worker execution and project export,
accepted import, reopen, comparison and resource validation.

Agent screenshot review passed for desktop comparison, 576 x 690 selection and
stacked comparison, reopened dark mode, independent method settings, unavailable
method history, accepted finding evaluation and separate observations. Final
comparison screenshots are in
`.artifacts/m4-final-browser/e2e-__tests__-candidate-co-19a74-aceable-body-correspondence/`.
They show the ordinary workbench dialog and selected evidence, not a separate
rendering fixture. The test specifies viewport and scroll state in its source.

The unchanged exported three-run project is `.artifacts/m4-three-candidates.json`
(4,409,148 bytes), extracted from the formal test's report attachment. Runs:
A `ef7fd743-b1eb-4f00-9f49-623cc34b40b7`,
B `a314a9fd-46c2-44bb-9f76-106ac99f02a1`,
C `29757f6e-aa8f-4e5c-a9c7-1e7339a5ac45`.
All use Synthetic clearance study r1, original-part method 1.0.1,
20 mm and 0–8 s; fixture post X is respectively -0.75, -0.6 and -0.45 m.
Import it into a separate review project through the normal Projects preview and
acceptance controls. The App README's M4 hands-on review documents independent
creation, a 35 mm rule revision, comparison, exports and reopen. The SDK guide
records existing trusted installation and exact repeatable verification commands.

Additional interactive Chrome review created **M4 - Three candidate review**
at project ID `6f614c93-39b4-413f-beae-a3dcfd73a6ea` and ran/saved A normally
(complete coverage, 46 pairs, no issue within scope). CUA's native prompt handling
timed out during B naming; in-app browser import confirmation also timed out,
and Chrome file upload was unavailable. Thus the additional interactive session
is not claimed to contain the three-run project. A native prompt may still need
manual dismissal. This automation limitation does not replace the passing formal
normal-App export/import and three-run evidence; manual user review remains open.

M2/M3 acceptance remains unchanged. M3.5 and M4 user acceptance, final closeout
and all remote operations remain pending. No further implementation prerequisite
was found inside the frozen scope. Next: user M4 review and any bounded reported
correction, then explicit direction on closeout/PR. M5 packaging and M6 pilots or
release are excluded; this work is not their readiness or acceptance claim.

### UI bounded-review follow-up

Same `ui` owner, retained-data-to-ui route, input/output and allowlist as the
comparison card above; robot-workcell section 9 remains the product authority.
The final diff review strengthened removal/reappearance: a removed canonical run
must retire its transient slot, not silently reselect it after Undo. The new
permanent assertion fails before correction. Prune absent identities and retire
comparison source references at that input-lifetime boundary; preserve immediate
render-time validity and never recompute comparison on unrelated renders.
Gate: run-library red/green with five unchanged input notifications, removal,
reappearance and unchanged comparator call count, then full App and affected E2E.
This is a correction to the current UI diff, not a new discovery class or owner.


### User review correction - comparison feedback and navigation

User review on 2026-09-09 found that Compare selected runs appeared inactive
because new output was below the viewport. Frozen correction: existing `ui`
owner and retained-data-to-ui route only; inputs are the selected immutable
records, output is pending feedback followed by the existing comparison and
explicit result navigation. UI owns one cancellable pending presentation request;
`storage/compareRuns` remains the sole comparator, invoked once per completed
explicit request. No cache, solver, canonical data or persistence change.

Allowed files: current results controller/view, direct formal UI/E2E tests,
section 9, current Inspector and operation guide. Extend the existing condition
with visible pending feedback before computation, duplicate-submit protection,
request retirement on selection/source/lifetime changes, and automatic scroll
and keyboard focus on success. Failure restores the button and exposes the
existing error without navigating to obsolete output. No artificial wait budget.
Gates: test-first pending/work-count/cancellation/failure and real viewport/focus
regressions; focused UI plus affected comparison/retained E2E at 3020, screenshot
review, full App tests, build/typecheck/lint, naming, Inspector and placement.
Do not revisit the other five completed owners or declare M4 user acceptance.


Correction evidence: the original four UI cases passed while five new cases
failed before implementation (`m4-feedback-red.log`); the ordinary browser case
failed result focus without test-driven scrolling (`m4-feedback-red-browser.log`).
After correction, all nine UI cases pass and the complete App suite passes
**668 tests in 118 files**. The three affected comparison/retention browser cases
pass, including a DOM frame observation of the busy disabled button before
completion. The final A/B/C rerun also waits for the complete desktop comparison
or the narrow-view result heading to enter its destination before screenshots,
without scrolling the result on behalf of the App. Build/typecheck, App lint,
naming, full Inspector contracts and placement pass. Evidence uses the
`.artifacts/m4-feedback-*` log and screenshot paths; prior milestone evidence
above remains the historical baseline.

Agent visual review passed for the final desktop and 576 x 690 screenshots in
`.artifacts/m4-feedback-final-browser/`. Interactive review also used the user's
existing Chrome project `8c93ec70-87a9-4004-97ba-470cbb11f1e6` on the same 3020
server: select the three retained checkboxes, click Compare, observe automatic
scrolling and focused Run comparison. No import, model edit, run or canonical
write was needed. M4 acceptance is still pending the user's review of this fix.

### Authorized adjacent feedback review

The user authorizes correcting similar UX findings in other ordinary App sections.
Discovery is frozen to current UI action handlers/controllers and their direct
formal UI/browser tests: project operations and import preview, original-part
import, trajectory read/explicit preview, observation editor/attachment actions,
run-detail selection/retention retry, and experiment creation/explicit result
navigation. Shell model edits already select their output and report canonical
success; formal analysis has progress/cancel/completion and must not interrupt
editing. Automatic acknowledgements never request scrolling or steal focus.

One `ui` owner segment under retained-data-to-ui, storage-to-ui asset inputs and
result-to-ui; section 9 plus existing import/observation/workflow contracts apply.
Inputs remain immutable evidence, existing preparation receipts and authoritative
session/Feature outcomes. Output is local pending feedback or explicit content
navigation only. Allowlist: these UI families, shared DOM reveal utility if
needed for equivalent behavior, their direct tests, current specs/Inspector,
this plan and App guide. No new canonical write path, numerical work, parser,
cache, queue, dependency, runtime catalog, persistence semantics or layout shell.
One explicit action owns its pending presentation; unrelated notices and normal
completed-field writes must not repeat work or move editing focus.

Confirmed classes: disabled actions without visible pending labels, state shown
only outside an active modal, asynchronous preview below the user's position,
and an editor/detail rendered after a long list. Regression tests first cover
pending/duplicate guard, failure recovery, lifetime retirement and navigation
without recurring focus on acknowledgements. Gates: focused affected UI suites,
normal 3020 projects/import/observations/retained/workflow E2E with desktop/narrow
screenshots, full App tests, build/typecheck/lint, naming, Inspector and placement.
Stop after this frozen review; unrelated bugs do not extend implementation.


Bounded validation revision: the browser caught result navigation occurring before
its subscribed tab became visible; the ui owner now consumes the explicit reveal
request only with the Results tab active. The first rerun's interrupted analysis
coincided with Vite navigation while files were edited; final browser validation
must run against unchanged files. The added narrow selection case also changed
the later exported run, so it now restores the original selection after proving
navigation and waits for the heading to reach the dialog top before screenshot.
Re-audit/self-review: section 9 and ui retained-data-to-ui/result-to-ui still own
these effects; no Feature, solver or persistence change is needed. Remaining
work is the fixed browser scope, screenshot inspection and final scoped gates.

Adjacent-feedback closure evidence: the original formal UI tests missed the
reported UX classes; the added/strengthened tests produced 14 failures before
their corresponding implementation (`m4-other-feedback-red.log`,
`m4-project-feedback-red.log`, `m4-creation-feedback-red.log`,
`m4-retention-feedback-red.log`). Final App validation passes 678 tests in 119
files. App build/typecheck and lint, naming (11), full Inspector contracts (100)
and test placement (2) pass. Existing build bundle-size advisory remains.

Base URL: `http://127.0.0.1:3020`. Visual Test Scope: normal projects,
trajectory-import, field-observations, retained-runs, workbench-flow and
visual-references browser specs. Command:
`APP_URL=http://127.0.0.1:3020 yarn workspace @asyra/asyra-sim test:e2e e2e/__tests__/projects.spec.ts e2e/__tests__/trajectory-import.spec.ts e2e/__tests__/field-observations.spec.ts e2e/__tests__/retained-runs.spec.ts e2e/__tests__/workbench-flow.spec.ts e2e/__tests__/visual-references.spec.ts --output=../../.artifacts/m4-other-feedback-verified`.
All 23 browser cases pass on the final unchanged build. Screenshots under
`.artifacts/m4-other-feedback-verified/` include `selected-run-narrow.png`
(576 x 690, historical r1 selected), `portable-project-preview.png` (1440 x 960,
two retained runs), GLB source review, trajectory conversion and
`results-narrow.png` (600 x 960). Agent screenshot review passed; the destination
and its controls are visible after App-owned navigation. Remaining Differences:
none within this bounded UI feedback scope; no numerical or equipment-validation
claim is made from these images.

Runtime State: interactive Chrome verification used the user's existing project
`8c93ec70-87a9-4004-97ba-470cbb11f1e6`, 1371 x 826 viewport, browser zoom unchanged,
three retained A/B/C runs. Clicking B focused Selected run at y=130. Opening an
empty observation draft focused Observation title and scrolled it into view;
the inspected settled screenshot placed it at y=363. The empty draft was
discarded and the dialog closed; Undo remained 0 and no canonical data changed.
Detailed entry/action/expected-result instructions are in the App README's
Reviewing action feedback and revealed content section. M4 user acceptance is
still separate from this completed correction.
