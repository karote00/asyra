# Unreleased App Decision History: Asyra Sim

Append App-scoped decisions according to the
[global standard](../../../../decisions/README.md). Record changes in direction
as superseding entries; do not overwrite released history.

## 2026-09-04 — Implement CUSTOM First, Extract Generic Defaults Later

- The user authorized the first candidate implementation, `three`,
  `@types/three`, their necessary dependencies, and minimal necessary Framework
  extensions with tests and documentation.
- Start with an App-owned CUSTOM engine and the existing public Core/Render
  boundaries. Keep SDK objects private to the adapter and robot/analysis
  semantics outside it. Do not enable the official 3D/HYBRID profiles.
- Generic contracts and adapter code may be extracted in a later task; Preset
  will own optional default composition, not engine execution or Sim semantics.
- Foundation tests and local builds do not replace numerical, real-browser,
  distribution, maintenance, or independent-user release evidence.

## 2026-09-04 — Establish Asyra Sim's Product Direction and Separate Documentation

- Context: The user wants to lower the barrier for small and medium-sized
  manufacturers to build simulation experiments, not replace every commercial
  solver or guarantee real-world agreement or improved yield.
- Decision: The product is named Asyra Sim. Its planned App path is
  `apps/asyra-sim/`, alongside `asyra-design`. Its plans and product contracts
  belong exclusively in `docs/ai/apps/asyra-sim/`.
- Core contract: "We provide a trustworthy environment for executing experiments,
  not a guarantee that users' experimental assumptions hold." Official methods
  must still be implemented correctly and formally verified under their published
  conditions of applicability.
- Consequence: Develop in the monorepo first, using public boundaries and a clean
  consumer to maintain independent delivery. Do not split repositories
  immediately or inject Sim domain logic into the Framework.
- Status: This task creates planning documents only, without creating the App,
  installing dependencies, or changing the Framework.

## 2026-09-04 — Limit the First Domain to Local Robot Workcell Geometry Experiments

- Decision: The first version uses one fixed-base serial arm, a tool, a workpiece,
  and static obstacles to analyze user-specified joint trajectories. It provides
  collision and clearance analysis, scope configuration, variant comparison,
  and traceable results.
- Exclusions: No real-equipment control, safety certification, vendor-controller
  equivalence, dynamics, whole-factory scheduling, automatic obstacle avoidance,
  TCAD, or nanometer-accuracy promises.
- Rationale: Start with experiments that have explicit mathematical answers and
  verifiable boundaries; the long-term name does not define first-version scope.
- Consequence: Separate background scenes from analysis scope. Unknown and
  incomplete are formal states. Algorithms, precision, and resource profiles
  still require M0 evidence; animation frames cannot stand in for formal
  full-trajectory analysis.

## 2026-09-04 — A Free, Pluggable Core Does Not Mean Safe Hot Loading of Arbitrary Code

- Decision: Local modeling, basic official methods, experiments, comparison,
  saving, and export are all part of the free core. Users configure existing
  methods through the UI; new solvers integrate through trusted local modules.
- Consequence: R0 has no account, cloud, or AI dependency. Modules are installed
  before composition, without changing Core's post-startup registration lock.
  Private methods need not be uploaded and receive no automatic official
  endorsement.
- Open questions: Specific dependency licenses, supported platforms, private
  extension delivery, and issue-reporting and maintenance policies must still be
  resolved at the planned decision points.

## 2026-09-04 — Gate the First Public Release on a Complete User Experiment Loop and Evidence

- Decision: The first product release is R0 Public Alpha, after M0–M6 and the
  [first-release gates](../../release/FIRST_RELEASE.md) are complete.
- Minimum usability requirement added by this plan: Two non-developers complete
  independent pilots, with at least one having equipment or automation
  experience. De-identified or synthetic data is acceptable; sharing commercial
  secrets is not required.
- Consequence: Distinguish internal demos, public source code, controlled-pilot
  candidates, and public product releases. Do not claim a completed release for
  small manufacturers without external pilots or a support mechanism.
- Status: These are planned gates, not evidence already obtained or authorization
  to publish externally.

## 2026-09-04 — Replace the Original CAD Roadmap with the Sim Plan

- Context: The user requested retaining useful parts of the old CAD plan and
  removing the superseded plan after completing this planning task.
- Decision: Retain 3D vertical slices, transactions and persistence, engine
  isolation, collision replay, result invalidation, and test sequencing. Do not
  retain general CAD modeling, AI-first phases, sampling presented as complete
  analysis, or old schedules.
- Consequence: Remove the old CAD roadmap and its dedicated README/PLANS
  navigation, and update the App index. Git history preserves the original text.
  This supersedes a product direction; it does not mark the old plan as
  implemented.
- Reference: [Roadmap replacement notes](../../plans/asyra-sim-roadmap.md).

## 2026-09-04 — Replace Projects Through Complete App Runtime Reset

- The user approved necessary Framework lifecycle changes for terminating and
  rebuilding the App runtime when opening another project. Clearing Undo inside
  canonical load is not the chosen architecture; ordinary load and destroy keep
  their existing semantics.
- App acceptance, storage, Workers and UI remain App-owned. Framework owners
  stop work, release their resources/state/history and retire composition before
  a successor starts. An uncooperative handler or failed cleanup cannot count as
  successful reset.
- The first implementation slice adds Feature quiescence. Complete Core/App
  replacement and the normal storage UI remain unfinished M1 work.

## 2026-09-07 - Close the Development Workbench and Keep One Durable Hosted Product Name

- Context: The user requested Vercel deployment using the final product name,
  followed by development closeout and current-head CI validation for PR review.
- Decision: Use the separate Vercel project and permanent domain
  `asyra-sim.vercel.app`. Keep `main` as the production branch and Git-connected
  PR previews for review. The initial production alias serves the reviewed PR
  implementation without merging it; later merges update the same domain.
- Outcome: The bounded workbench, approved complete runtime replacement,
  original-part analysis and live collision feedback are implemented. Move the
  completed refactor record out of the active roadmap into
  [development-workbench.md](../../plans/completed/development-workbench.md).
  This supersedes earlier unfinished-development status, not historical evidence.
- Consequences: Hosting delivers static assets; experiments, geometry, runs and
  local saves remain browser-local. Origins have separate storage and require
  portable export/import for transfer. Disable deployment toolbar injection and
  project model-improvement sharing. Do not create cloud-analysis obligations.
- Release boundary: This is development closeout, not completion or waiver of
  the independent numerical, resource, offline distribution, pilot or support
  gates in `release/FIRST_RELEASE.md`. No version bump, release record, package
  publication, tag or merge is authorized by closeout.

## 2026-09-07 - Close M1 Workcell Foundations

- Context: M1 had passed its bounded exit gates but lacked milestone closeout.
- Decision: Archive the existing owner scope and evidence in
  [M1 workcell foundations](../../plans/completed/m1-workcell-foundations.md).
  Keep the first-release roadmap active and resume at M2 import-contract
  acceptance, not M5. This supersedes active-M1 wording without rewriting old
  decisions or claiming PR completion proves M2-M4.
- Consequences: No product code, historical units or evidence are changed.
  M3-M6 and first-release gates remain separate. Closeout adds no Changeset,
  version bump, tag, package publication or deployment.


## 2026-09-07 - Complete M2 Source Units and Conversion Review

- Context: External CSV mapping assigned canonical units without a source
  declaration, and acceptance preview omitted converted joint values. Prior
  helper tests encoded guessed units instead of the product contract.
- Decision: Suggest columns only for external/edited CSV, preserve explicit
  JSON and known App-generated canonical units, and share storage-owned parsed
  rows and validated conversion review with draft acceptance. Canonical replay
  initializes import text from its matching definition/revision.
- Outcome: M2's five owner exit criteria pass the bounded formal and browser
  evidence in [the roadmap](../../plans/asyra-sim-roadmap.md#5-m2-executable-experiments-and-data-import).
  No source units, canonical numbers or historical evidence are migrated.
- Consequences: Save retains the existing one-action Feature transaction;
  previews and discard remain noncanonical. Next work starts with a bounded M3
  contract/evidence review, not M4/M5 or automatic method reimplementation.
  No push, PR, merge, tag, version bump, publication or deployment is part of
  this acceptance.

### 2026-09-08 - Retain explicit import unit declarations during editing

Numeric source edits retain user-declared units and valid column mappings while
retiring the conversion preview and acceptance eligibility. Initial App canonical
units remain distinct from explicit declarations; a new CSV requires fresh units,
and a removed source column retires its own declaration. No saved source evidence
or Feature/History boundary changes. Permanent UI and browser regressions cover
retention, conversion reuse, invalidation, and unchanged save/replay behavior.

### 2026-09-08 - Keep initial unit choices visible during source edits

The first retention correction covered explicitly selected units but still cleared
initial App unit choices. User verification caught that missing product case.
Retain those choices visibly, distinguish them from source declarations, and
require one explicit confirmation before validation can admit edited data.
Confirmation does not validate numbers, accept a draft, or save a project.
The regression starts from untouched App data, types invalid text, confirms units,
and corrects the value without reselecting units.

### 2026-09-08 - Remove the additional unit confirmation flow

User direction supersedes the confirmation interaction above. Editing current
source text retains its existing units without a notice or extra confirmation.
External CSV file loading still starts with undeclared units. Preview invalidation,
numeric validation, and the existing draft/save boundary are unchanged.

### 2026-09-08 - Apply and save a trajectory in one action

The successful import preview now offers Apply and save. It merges the same
validated trajectory artifact into the latest experiment draft and passes that
complete input directly to the existing save Feature, avoiding a React state
update followed by a stale save closure. Other settings and exclusions are saved
in the same transaction; one Undo/Redo reverses/restores the complete change.
Pending saves disable both save entry points and guard duplicate dispatch.

### 2026-09-08 - Close M2 and its accepted editing follow-ups

- Context: M2 import acceptance was followed by user-requested automatic
  persistence, registered Core integration and independently editable authored
  input. Their completed evidence must no longer appear as active work.
- Decision: close M2 with all five owner exit criteria accepted and no in-scope
  blocker. Archive the acceptance and final 647 App / 17 affected E2E results in
  `docs/ai/apps/asyra-sim/plans/completed/m2-import-contract.md`.
- Consequences: this supersedes the earlier manual Save/Apply and transient-only
  invalid-input limitations. Core publications/history own completed edits;
  execution validity remains separate. The roadmap stays active for M3-M6.
  User-authorized push and PR review follow closeout; no merge, Changeset,
  version bump, tag, publication or deployment is authorized by this decision.


### 2026-09-08 - Close M3 official collision and clearance acceptance

- Context: merged implementation and earlier test counts did not establish M3
  acceptance. A bounded review compared the six owners against current numerical,
  runtime and Inspector contracts before changing code.
- Decision: accept M3 under the frozen local profile after independent interval
  oracles, a test-first formal finding/witness presentation correction, 650 App
  tests and 27 distinct browser cases with inspected screenshots. Archive the
  owner conclusions and operational cases in
  `docs/ai/apps/asyra-sim/plans/completed/m3-formal-analysis.md`.
- Consequences: retain the existing solver, method version, complete original
  geometry, Core transaction/persistence ownership and immutable history. No
  numerical/resource limit was relaxed. M4 begins with its own bounded review;
  M5/M6 and independent numerical, reference-hardware and release gates remain
  open. Closeout authorizes no remote or release operation.


### 2026-09-09 - User accepts M3 and inserts M3.5 workflow usability

- Context: the user accepted M3 after the live seven-run demonstration, but found
  the crowded panel and preflight/replay/retention transitions hard to understand.
- Decision: retain M3 closeout and add
  `docs/ai/apps/asyra-sim/plans/m3-5-workbench-flow.md` before M4. Plan a single
  run entry with automatic admission, focused tabs and clearer result evidence.
  M3.5 implementation has not started; contract readiness comes first.
- Consequences: this supersedes the earlier next-step recommendation to start M4
  immediately. Preserve numerical owners, full geometry, history and persistence.
  The user authorized committing and pushing M3 and the M3.5 plan, followed by
  current-commit CI verification before review. No merge or release is authorized.

### 2026-09-12 - User closes M3.5/M4 and confirms preceding milestones

- Context: the user requested closeout of the current Asyra Sim M4 stage and
  every preceding stage, followed by push and PR tracking. M0 feasibility and
  M1-M3 already have bounded completion evidence; their dates and limits stand.
- Decision: accept and close M3.5 workflow usability and M4 comparison, versions
  and private extensions. Archive the detailed records at
  `docs/ai/apps/asyra-sim/plans/completed/m3-5-workbench-flow.md` and
  `docs/ai/apps/asyra-sim/plans/completed/m4-comparison-extensions.md`.
  This supersedes the pending M3.5 implementation/acceptance state in the
  2026-09-09 entry and the interim pending M4 acceptance checkpoints; their
  execution history is retained. The old M3.5 path in that entry is historical.
- Evidence: final implementation source `34500475524d419109c1b5c89c1e388e2b53c582`
  passes 678 App tests, the recorded browser/visual gates and all five required
  PR #181 checks, including production artifacts and release readiness.
  The user's closeout instruction supplies acceptance; CI alone does not.
- Consequences: M5 candidate preparation is the next separately authorized
  milestone. M5 resource/offline evidence, M6 independent pilots and all public
  release gates remain open. No Changeset, version bump, tag, merge, publication,
  deployment or App-server startup is authorized by this closeout. The user
  separately authorizes pushing this documentation and tracking its PR checks.


### 2026-09-12 - Close M5 delivery and authorize M6 development

- Context: PR #192 delivered a clean exact-source candidate, corrected delivery
  tooling and operating instructions, 678 isolated tests, 39 packaged browser
  cases and eight passing CI checks at `9cf5c7f5e`. The user was explicitly told
  that the representative workload leaves all 298 pairs unresolved and that
  M1 / 8 GB reference hardware evidence is missing.
- Decision: accept and close the M5 delivery stage with those gaps preserved,
  archive `docs/ai/apps/asyra-sim/plans/completed/m5-controlled-pilot.md`, rebase
  latest main and merge PR #192 once all newest-head CI passes. This is one-time
  merge authorization. Then start M6 in a new project-local worktree, create its
  PR and obtain passing CI before requesting user review.
- Consequences: this supersedes pending M5 closeout and earlier M6 scheduling
  restrictions, not failed resource evidence or FIRST_RELEASE G1-G8. Capacity,
  reference hardware, independent numerical/pilot evidence and policy decisions
  remain release blockers. No M6 merge, publication, deployment, dependency/tool
  upgrade, version bump, tag or new Changeset is authorized by this closeout.
