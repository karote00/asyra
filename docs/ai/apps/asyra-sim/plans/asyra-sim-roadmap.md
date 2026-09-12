# Asyra Sim: From Planning to the First Public Release

## 1. Status and Task Contract

### Current milestone closeout - 2026-09-12

M0 feasibility and M1-M4, including M3.5, are complete within their bounded
contracts. The user explicitly authorized M3.5/M4 acceptance and closeout;
previous M1-M3 dates and proof limits remain intact. See
[M3.5](completed/m3-5-workbench-flow.md) and
[M4](completed/m4-comparison-extensions.md) for final evidence and decisions.
The user closed [M5 delivery](completed/m5-controlled-pilot.md) on 2026-09-12
with its capacity failure and reference-hardware gaps explicitly carried into
M6/R0 review. M6 development is authorized after the separately authorized
PR #192 merge, conditional on all newest-head CI passing. This roadmap remains
active for M6 and R0; no release gate, deployment or publication is waived.

### 1.1 Development workbench closeout (2026-09-07)

The bounded implementation and original-part refactor are complete for PR #156.
Their owner sequence, completion evidence and limits have moved to
[the completed development-workbench record](completed/development-workbench.md).
This includes the permanent `asyra-sim.vercel.app` development deployment, not
R0 Public Alpha certification. The remaining roadmap and first-release gates
stay active; the historical checkpoints below are not current release claims.

### 1.2 Earlier implementation checkpoint (not mesh readiness)

Implementation is authorized; M0 feasibility and the bounded M1 local-workcell
slice are complete. M2 is accepted under Section 5; M3-M4 remain in progress. No milestone or release gate is
claimed complete merely because its contract or source files exist.

The current implementation includes canonical experiment drafts, mapped
trajectory previews, preflight, isolated formal runs, frozen evidence replay,
explicit run retention with Undo/Redo, two/three-run comparison, reports, and
portable project import/export, and independent candidate duplication with frozen
body lineage, bounded progress/cancellation, and restricted GLB attachment with
independent body-local placement. Its local gate passes 360 App tests and 24 normal
browser journeys plus type/lint/build; comparison, import, visual placement and
replay screenshots were inspected. Visual sources survive Undo/Redo and native
replacement, including historical-only references. Invalid source content is
rejected before pausing the current runtime. CSV/JSON resource admission and
stale-preview cancellation have formal regression coverage.
Admission now enforces collider/pair/segment caps, and the method/runner enforce
global retained evidence, encoded payloads, deadlines, and 250 ms cancellation
grace. Trusted pre-start method composition, an independent static-sphere example,
typed method parameters, immutable declarations and missing-module history now
share the production Worker and generic result path. Declaration differences are
disclosed in comparison and every report; CSV stops assembly at its byte limit.
New studies use measured 100,000-evaluation/30-second defaults; saved budgets are
unchanged. Typed acceptance groups now have bounded schemas, evidence-based
three-valued evaluation, canonical revision/Undo behavior and ordinary UI editing.
Reports, comparisons and reopened history preserve the same evaluated tree;
successful acceptance never hides incomplete execution, coverage or raw findings.
Run-linked field observations now support bounded text/opaque files, revisioned
editing and Undo/Redo, separate feedback bundles, and verified source persistence.
The ordinary browser journey proves byte-exact downloads, unchanged historical
reports, corrupt-import rejection before retirement, and portable reopening;
its editor, attachment review and retained-note screenshots were inspected.
Larger numerical usability benchmarks still require implementation or validation.
M5 exact-source consumer build and candidate assembly now pass at `125a09c0e`:
19 Framework packages, 348 locked registry records, 360 App tests, isolated type
and main/Worker build inputs, and a versioned folder/archive with guides, SDK,
original notices and checksums. Eighteen launcher/delivery tests and three normal
startup/editing browser tests pass. Packaged offline browser evidence, larger
resource usability, reference hardware and M6 independent acceptance remain.
The current pause is a validated delivery checkpoint, not App/R0 completion;
resume from the next bounded work in [PLANS.md](../PLANS.md).

The goal is a free, pluggable, trustworthy experiment workbench. Its first bounded
product is [robot workcell geometry experiments](../specs/robot-workcell-v0.md).
[PRODUCT.md](../PRODUCT.md) is the authority for user value.

The implementation task covers `apps/asyra-sim/`, its App documentation, its
dedicated Flow Inspector and catalog registration, and necessary workspace
manifests/build integration. The user approved `three`, `@types/three`, and their
necessary dependencies. Reuse existing repository tooling without upgrades.

Start with an App-owned CUSTOM engine. The user also approved minimal necessary
engine-contract/Render/Core extensions and their tests/docs if a formal proof
identifies a missing public boundary. Do not make those changes preemptively.
Preset extraction, enabling official 3D/HYBRID profiles, changes to other Apps,
publication, live equipment, external outreach, and broader Framework work are
excluded except for the explicitly approved runtime reset scope below. Preserve
existing 2D and startup-lock semantics.

### Approved Runtime Reset Scope

The user approved complete App runtime termination and reconstruction for
document replacement. This is not permission to change ordinary `Core.load()`
into a reset or to replace Framework history with an App-owned stack. Ordinary
`destroy()` retains its compatibility behavior. A retired Core composition must
not be reopened and mixed with old Feature, engine, or subscription instances.

The bounded extension covers Core lifecycle orchestration and only the necessary
Feature System, Factory, canonical state, input, render, registration, and Preset
cleanup owners, their public boundaries, direct tests and documentation. The App
orchestrates acceptance, its own resources and UI replacement through Core.
Do not introduce multiple concurrently active default runtimes, a second state
graph, an iframe runtime, a page-reload workaround, or changes to other Apps.

Advance one owner segment at a time: stop Feature admission and drain work;
release owner resources and canonical state/history; retire the old composition
and expose a clean successor; connect the App replacement and storage UI. Define
each downstream Inspector step before implementing it. The first Feature slice
is the `quiesce` step; its formal cases are defined in the storage reset contract.

The previous editing test incorrectly assigned history reset to canonical load.
Keep load round-trip/validation coverage and move the A-to-B empty-history oracle
to the full App reset integration. That regression must pass before normal Open
is claimed complete. Gates are focused owner regressions, existing owner suites,
type/lint/build, Inspector validation, and repeated normal-path browser open and
teardown. Old queued work, late handlers, active cancellation, cleanup failure,
invalid target preservation, and A/B/A reconstruction are required cases.
Do not activate a successor after incomplete cleanup or an uncooperative handler;
report the reset failure and preserve detached recovery data.

The Core handoff gate validates observable delivery, not internal callback
identity: lifetime-scoped bindings must preserve each payload/batch and order
exactly once while active and suppress delivery after retirement. Before App
integration, replace internal identity assertions in the direct Core facade and
startup tests with those delivery oracles; retain injected-owner isolation.
Then prove actual Core/Feature work settlement, retained-handle rejection and
default-Core A/B/A reconstruction with real Framework owners. The bounded files
remain the Core lifecycle implementation and its direct tests/docs under
`reset-core`; no downstream App change may compensate for a failing owner gate.
Focused lifecycle and delivery cases precede the full Core suite, build/lint and
Inspector gates. Preset and App adoption follow as separate owner segments.

The bounded `surface` proof adds only Core's validated `resizeRenderer` delegate,
its basic API tier, focused startup/facade tests, and API/package documentation.
Render already owns resize; no engine-specific Framework behavior is needed.

Discovery is bounded to the public Core, Render, engine, Feature, property,
scene, and persistence surfaces needed by the owner slices. Verification covers
owner tests, typecheck, lint/build, normal-path browser/visual/offline tests,
resource limits, and an isolated distribution consumer. Independent pilots and
maintenance ownership remain human gates, not simulated evidence.

Freeze a separate scope and actual gates before starting each subsequent
milestone. This roadmap does not authorize implementing every milestone at once
or changing other Apps, environments, packages, or repository-wide support policy.

## 2. Milestones and the First Release

| Milestone                                | User-observable outcome                                                          | Focus before advancing                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| M0 Contracts and feasibility             | Supported scope and exclusions are clear, with small technical proofs            | 3D boundaries, method/error envelope, Inspector readiness                  |
| M1 Workcell foundations                  | Create, manipulate, save, and reopen a simple 3D workcell                        | Consistent canonical state, transforms, and transactions                   |
| M2 Experiments and trajectories          | Import paths, select scope, and configure methods and thresholds                 | Correct units, interpolation, snapshots, and preflight                     |
| M3 Formal analysis                       | Obtain collision, clearance, and unresolved results with replay                  | Formal numerical evidence and continuous-time completeness                 |
| M3.5 Workflow usability | Configure, run, read results and replay without losing context | Single run entry, focused panels and truthful result states |
| M4 Comparison and pluggability           | Compare three variants, export, replace methods, and preserve experiment context | Consistent results, traceable versions, and independent module integration |
| M5 Quality and delivery                  | A controlled-pilot candidate that installs or starts locally                     | Offline, security, performance, consumer, and documentation gates          |
| M6 Independent pilots and release review | Non-developers complete the workflow independently and understand its limits     | All G1–G8 gates in FIRST_RELEASE are satisfied                             |
| R0 Public Alpha                          | A publicly released, free local experiment tool with a limited scope             | Still not production approval or industrial safety certification           |
| M7 and beyond                            | Expand according to real needs                                                   | Choose one evidence-backed capability increment at a time                  |

The required sequence is `M0 → M1 → M2 → M3 → M3.5 → M4 → M5 → M6 → R0`.
Tests, supporting documentation, and resource cleanup accompany each owner
implementation; they must not all be deferred to M5. Independent test design,
sample preparation, and pilot arrangements may begin earlier; implementation
still advances by Inspector owner step.

[FIRST_RELEASE.md](../release/FIRST_RELEASE.md) is the sole authority for R0
release requirements. This table is navigation, not a second release standard.
An M1 or M2 demo cannot serve as the first product release.

## 3. M0: Prove the Direction Before Starting the App

The first coherent foundation checkpoint consists of the normal CUSTOM
workbench, canonical editing, shared kinematics, and interval query kernels.
Its gates are all App unit/integration tests, typecheck, lint, production build,
the basic workcell E2E suite, inspected real-App screenshots, and Inspector
schema/catalog checks. It may be committed independently while M0 remains
active. Restricted GLB feasibility, environment/resource selection, complete
experiment execution, and release gates are not part of this checkpoint claim.

### Questions to Resolve

Can the existing Framework public boundaries support a small 3D workcell? Can the
selected numerical methods provide useful, trustworthy answers for the joint
trajectories and geometry we promise to support?

### Work Sequence

1. Check PRODUCT and the first-version contract to confirm user scenarios and
   responsibilities for modeling, analysis, and judgment.
2. Inspect only the necessary Framework owners: Core composition, render/engine,
   input/selection, props/scene tree, Feature tasks, and local persistence APIs.
3. Identify supported capabilities and actual gaps; do not treat `CUSTOM` as
   production-ready 3D.
4. Define a small set of independent 3D and geometry proofs. Obtain the relevant
   authorization when code or third-party dependencies are needed. Before writing
   formal tests or code for each proof, establish its bounded product cases,
   Inspector owner/route/file allowlist, and Step Execution Card; do not defer
   these until M1.
5. Use permanent formal tests to prove basic camera, picking, transforms, and
   save/load feasibility, plus analytical geometry, rotational sweeps, and
   high-speed crossing cases. Do not build disposable visual demos.
6. Evaluate engine, geometry, and import candidates for licensing, offline use,
   reproducibility, workers, numerical contracts, cancellation, and measured
   performance. Three.js is approved for the first CUSTOM visual engine and
   restricted GLB importer, not as the formal geometry-analysis method. Its type
   dependencies do not authorize using a transitive physics library as a solver.
7. Freeze the official methods' input envelope, error and time semantics,
   decision boundaries, and unsupported and unknown states.
8. Select the first-version OS/browser support, reference hardware, local
   distribution format, and initial resource limits.
9. Use the proof results to complete the next App implementation slice's product
   cases, DoD, and exact Inspector owner/route/artifact/failure/file allowlist
   before starting M1.

### Deliverables and Stop Conditions

Deliver bounded decisions in the existing specs, necessary formal proofs, and an
executable contract for the next slice, not new readiness matrices, audit ledgers,
or large collections of governance documents.

- If a public 3D boundary needs changes, propose a separate Framework scope;
  do not bypass it without approval.
- If a method only supports frame sampling, do not claim continuous analysis.
  Change the method or explicitly revisit the product scope.
- If returning unknown for every case is the only way to avoid incorrect
  answers, that does not demonstrate usefulness.
- If dependency costs or licensing prevent delivery of the free local core,
  reject that candidate; do not silently make the core paid.
- Unresolved numerical error bounds or supported input envelopes block method
  implementation readiness. They cannot be deferred to release wording.

## 4. M1: Workcell Editing Vertical Slice - Complete

Closed 2026-09-07. Canonical workcell editing, transactions, acknowledged local
saving and safe runtime replacement meet the bounded M1 exit criteria.
The owner scope and recorded formal/browser evidence are archived in
[M1 workcell foundations](completed/m1-workcell-foundations.md).
This completion does not establish M2-M4 or R0 acceptance.

## 5. M2: Executable Experiments and Data Import

### Closeout - 2026-09-08

M2 is complete, including the user-requested Core integration, automatic
persistence and authored-input follow-ups. All five owner exit criteria are
accepted with no in-scope blocker. The detailed acceptance and final evidence
are archived in [the completed M2 record](completed/m2-import-contract.md).
M3-M6 and public-release gates remain separate; the next task is a bounded M3
review of existing method contracts and evidence.

### User Outcome

Create joint trajectories through the UI or CSV, select the geometry analysis
scope, method, and decision thresholds, and understand preflight blocks and
warnings.

### Owner Slices

1. Trajectory: keyframes, explicit interpolation, forward kinematics, and separate
   static and motion routes.
2. Import: JSON/CSV mapping and restricted GLB, with preview before acceptance;
   never execute imported code.
3. Experiment: definitions and versions for the model, scope, pairs, time,
   methods, and rules.
4. Snapshot/preflight: freeze only necessary inputs and separate data,
   capability, and resource risks.
5. Preview UI: a time slider and geometry preview, explicitly distinguished from
   formal full-trajectory collision results.

Formal evidence includes product cases for malformed input, missing units,
reversed or duplicate timestamps, joint limits, intermediate rotation, empty
pair sets, missing colliders, background/influencing objects, and excluded pairs.

Do not implement a general scheduling engine, arbitrary workflow loops,
vendor-controller interpretation, or inverse kinematics.

## 6. M3: Official Collision and Clearance Methods - Complete

Closed 2026-09-08 within the frozen local profile. All six owner exit criteria
are accepted: static/continuous/clearance evidence, Worker lifecycle, result
validation/rules and ordinary result/replay. Existing sufficient implementations
were retained; independent time/distance oracles and explicit formal finding
labels/witness times close the actual evidence/presentation gaps.

650 App tests and 27 distinct browser cases pass, with inspected overview/detail
screenshots and unchanged numerical/resource limits. Full scope, commands,
owner conclusions and operational acceptance are archived in
[M3 formal analysis](completed/m3-formal-analysis.md).
M4-M6 and independent release gates remain separate.

## 6.5. M3.5: Understandable Experiment Workflow - Complete

Closed 2026-09-12 by explicit user acceptance. Single Run admission, workflow
tabs, current-input editing, natural scrolling and evidence/replay/retention
feedback meet the bounded exit criteria. See
[the completed M3.5 record](completed/m3-5-workbench-flow.md).
M3 numerical acceptance remains closed; M5/M6 release gates remain separate.

## 7. M4: Variant Comparison, Versions, and Private Extensions - Complete

Closed 2026-09-12 by explicit user acceptance of this stage and preceding stages.
All six owners and the ordinary UI/SDK paths meet their bounded exit criteria;
see [the completed M4 record](completed/m4-comparison-extensions.md). The earlier
M3.5 acceptance dependency is resolved. M5/M6 and R0 remain future work.

### User Outcome

Compare three variants, export and reopen them, and let advanced developers
integrate their own methods without modifying Core.

### Owner Slices

1. Experiment revision: duplicate variants, preserve their origin and changes,
   and explicitly create new runs.
2. Result storage: immutable inputs and evidence, run references, asset
   consistency, and persistence acknowledgment.
3. Comparison: show differences in parameters, scope, methods, and exclusions;
   explicitly identify cases that are not directly comparable.
4. Export: project bundles and JSON/CSV/HTML reports with format safety.
5. Field observation: run-linked text and attachments that do not overwrite
   results or claim automatic calibration.
6. Extension: trusted modules installed before startup, capabilities and versions,
   an example method, and conformance.

Acceptance covers two equally important paths: non-developers configure existing
methods through the UI, and developers add new methods through the SDK. An SDK
without a usable UI is not complete.

## 8. M5: Controlled-Pilot Candidate - Delivery Stage Closed

Closed by explicit user direction on 2026-09-12; see the
[completion record](completed/m5-controlled-pilot.md). The original scope and
historical iterations below remain evidence of what was required and attempted.
The full representative capacity gate failed and M1 / 8 GB hardware is still
unverified. These are carried release blockers, not passing M5 evidence.

The previous delivery iteration addressed the `ui` owner's consumer lock guard,
not a solver or Framework change. The exact-source gate exposed a blanket patch
rejection after all 19 packages built, packed and validated: Yarn's already-locked
builtin compatibility patches must retain their complete locator and checksum.
Replace the blanket rejection with source-class validation in
`scripts/consumer-contract.mjs` and its permanent tests. Only plain registry
records and unchanged npm-backed Yarn builtin compatibility records qualify;
custom/local patches, new inputs and integrity drift remain failures. Prove the
new regression red, then run consumer/launcher unit tests, formatting, Inspector
and placement gates before committing; rerun the clean-source consumer afterward.
Self-review confirms this preserves the runtime-profile input-integrity contract
and the Inspector `ui` boundary without new dependencies, relaxed isolation,
solver changes or downstream compensation. Distribution assembly still waits
for passing independent build evidence.
The placement gate also detected extracted copies of other Apps' source tests
inside failed build outputs. `scripts/build-consumer.mjs` now places its
reconstructible source snapshot under the existing temporary directory; archives
and failure logs remain retained. The unchanged repository placement gate is the
regression oracle, not an expanded exception for product tests.

The isolation iteration fixed actual consumer isolation. The clean
gate at `81c473395` detected ancestor `buffer` and `lightningcss` declaration
reads: npm ambient/optional resolution can climb out of a project-local consumer.
Use the existing macOS sandbox for consumer type/test/build commands to deny
reads from every ancestor `node_modules`; retain the real-path evidence fences.
No library is added, aliased or stubbed. Add permanent process tests proving
local reads succeed and ancestor/symlink reads fail. Copy the App's existing
environment declaration alongside its runtime file; ordinary consumer typecheck
is the missing-input regression gate. Files remain App `scripts/**` and these
delivery docs. Run focused process/contract tests, formatting, Inspector and
placement checks, then commit and rerun the exact-source gate. Self-review maps
this to the unchanged `ui` isolation contract and macOS delivery profile; other
hosts fail explicitly rather than claiming equivalent isolation.

The current `ui` slice preserves native ESM semantics in App test configuration.
The isolated `9a20ebc87` gate passed the type fence and 347 tests, but all 13
lifecycle cases failed because vite-node's default CommonJS interop snapshots
the default export even for `.js` packages declaring `type: module`. Native Node
observes the packed Core successor correctly. Disable that interop in the App's
`vitest.config.ts`, without changing Core, inlining private sources, or weakening
the existing lifecycle assertions. The same failed packed lifecycle file is the
focused regression gate, followed by all 360 packed tests and the production
build; then the usual lint/Inspector/placement checkpoint and exact-source gate.
Self-review confirms the Inspector `ui` testing boundary and runtime-profile
isolation contract agree; no product lifecycle rewrite is authorized by this
test-runner mismatch.

The clean `b6fc3af0b` consumer now passes all 19 rebuilt/packed Framework inputs,
348 locked registry records, 360 App tests, type isolation and all three bundle
fences. The next `ui` segment assembles a local candidate in the same producer
process, using only its verified App build and exact source snapshot. Scope is
App `scripts/**`, App delivery docs and examples, the README and the dedicated
Inspector. Gates cover safe file collection, complete original dependency
notices, rewritten documentation links, checksums and failure without a passing
artifact, followed by clean-source assembly and packaged browser workflows.
The assembler does not accept a modified cached consumer as release evidence.
Reference hardware, independent pilots and maintenance policy remain unverified.

### User Outcome

Receive a product candidate that starts on their own computer, works offline,
and includes examples and documentation.

### Work

- Delivery has two reviewable checkpoints. First commit the generator and its
  permanent guard tests after lint, path/integrity tests and Inspector validation;
  this freezes executable tooling but does not claim a built candidate. Then
  execute the gate from that clean exact commit and retain its actual consumer
  evidence before distribution assembly and packaged-browser validation. A
  failure blocks that later checkpoint and must not be relabeled as a pass.
- Freeze measured platform, numerical, and resource profiles, with normal,
  boundary, and over-budget benchmarks.
- Pass the applicable unit, method, integration, extension, E2E, visual,
  resource, and security gates.
- Verify older results, missing methods, missing assets, corrupted projects,
  save failures, and recovery instructions.
- Use a project-local clean consumer to verify packaged dependencies and
  independent builds, producing a reproducible deliverable.
- Provide quick-start guidance, method limitations, format examples, SDK
  documentation, data confidentiality guidance, backups, and troubleshooting.
- Prepare pilot scripts and previews of shared diagnostic data; do not request
  partners' confidential information by default.
- Propose a Sim maintenance and issue-reporting policy. Obtain separate approval
  for any differences from repository policy.

This milestone permits preparation for controlled pilots; it does not complete
the first public product release.

## 9. M6: Independent Pilots and R0 Release Review

Development is active after PR #192 merged. The bounded
[M6 plan](m6-pilot-review.md) first makes the missing-method recovery exercise
self-contained and adds candidate limitation/update notes. Carried resource,
reference-hardware, independent evidence and maintenance decisions remain open.

External pilots must meet FIRST_RELEASE G7; this roadmap cannot lower that
requirement. Outreach, confidential data transfers, and other external
operations still require user authorization.

Convert pilot findings into permanent regression cases using test-first
development. Return to the first incorrect owner, pass focused tests, and then
rerun the affected gate; do not rerun every expensive case after each small edit.

Finally, confirm that FIRST_RELEASE G1–G8 all have evidence tied to the candidate
artifact. Complete version, limitation, and update notes, then ask the user to
decide whether to approve external publication. If external usage evidence or an
issue-reporting mechanism is missing, retain candidate status and state that
clearly; do not invent completion.

## 10. M7 and Beyond: One Proven Need at a Time

Prioritize needs identified through feedback from the first users:

- More usable equipment templates and format imports.
- Validated additional import formats, mechanisms, and coordinated motion.
- Parameter sweeps, design of experiments, and measurement-data alignment.
- Inverse kinematics or path suggestions, kept separate from formal validation
  results.
- Other local domain methods, such as thermal, optical, or process geometry
  analysis.

Every new method needs its own supported conditions, inputs and outputs, formal
oracles, and unknown semantics. Whole-factory scheduling, TCAD, AI, cloud
services, and collaborative editing are not a default list of promised next
features. The existence of an SDK does not make these interchangeable without
engineering integration.

## 11. Main Risks and Responses

| Risk                                                                     | Response or blocking condition                                                                             |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `CUSTOM` is insufficient for real 3D                                     | Prove feasibility in M0; handle gaps through a separate Framework scope, with no bypasses                  |
| A general physics engine's CCD does not cover our rotation/interpolation | Match method capabilities to formal motion oracles; an engine's brand is not evidence                      |
| Supplied part geometry is absent from the collision input                | Block execution; implement shared complete geometry, never substitute proxies or waive the mismatch       |
| Precision conflicts with performance                                     | Use supported profiles, cancellation, budgets, and unresolved states; never silently reduce precision      |
| Small manufacturers still cannot build models independently              | Provide examples, forms, mapping, and independent pilots; reject author-only demos                         |
| Cross-repository or cross-version coupling                               | Use public APIs and a clean consumer; do not rush to split repositories                                    |
| Private methods are mistaken for officially validated methods            | Expose origin, version, evidence status, and the trusted-module policy                                     |
| Free maintenance becomes an unlimited burden                             | Bound support scope, require reproducible cases, and define maintenance owners and update/withdrawal rules |
| Generalization into a huge platform delays the first release             | Enforce R0 exclusions and scope freezes; record requests without automatically adding them                 |

## 12. Decision Points and Open Questions

| Decision                                                               | Latest decision point                       | Effect while unresolved                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| Specific renderer, solver method, import dependencies, and licenses    | M0                                          | Blocks dependent implementation; do not install first and seek approval later |
| Geometry, coordinates, time, errors, and comparability rules           | M0, before the method owner starts          | Blocks method contract readiness                                              |
| Supported platforms, reference hardware, and local distribution format | Initial choice in M0; measured freeze in M5 | Unverified platforms cannot be listed as supported                            |
| Formal Inspector and next-step allowlist                               | Before each owner implementation            | Stop if missing; this roadmap is not a substitute                             |
| Numerical CPU, memory, time, and cancellation-deadline limits          | Initial choice in M0; measured freeze in M5 | Performance gates cannot pass without numeric limits                          |
| Pilot partners and evidence they may share                             | Arrange before M5; execute in M6            | Remain a candidate without independent pilots                                 |
| Sim issue-reporting, maintenance, licensing, and policy                | M5–M6                                       | Responsible public delivery is not ready                                      |
| R0 version number and external publishing operations                   | After the M6 gates pass                     | Completed documentation does not imply publication approval                   |

## 13. Scheduling Principles

No calendar commitment is made yet. The 3D boundaries and numerical methods are
the largest unknowns, and the old CAD estimates are not carried forward. After
M0, estimate M1–M3 from actual gaps, formal proofs, available contributors, and
gate costs. Reserve time for pilots and quality corrections in M4–M6.

Complete an acceptable slice before adjusting later estimates. After repeated
failed iterations, follow task iteration replanning instead of endless patches.
New discoveries do not automatically expand the current mutation scope.

## 14. Replacement of the Old CAD Plan

The user requested replacing the original CAD roadmap with the new Sim product
direction. The old plan was not completed implementation. Its useful ideas are
retained in this roadmap and the authoritative documents:

- 3D vertical slices and Framework readiness: M0/M1.
- Scene hierarchy, transforms, Undo/Redo, and save/load: M1/M2.
- External renderer and analysis-engine boundaries: ARCHITECTURE and the
  extensions contract.
- Playback that does not pollute canonical state or Undo: the first-version
  contract and M2/M3.
- Collision times, clearance, replay, and stale reports: M3/M4.
- Formal tests, visual verification, performance, and independent delivery:
  developed continuously from M1, with release checks completed in M5/M6.

Not carried forward: general mechanical CAD or gear/chain modeling goals,
AI-first phases, fixed-frame sampling presented as formal continuous collision
analysis, unsupported industrial risk classifications, preemptive whole-factory
or TCAD expansion, old schedules, or treating a non-physics MVP as this product's
release.

Remove the original CAD roadmap and its dedicated indexes; Git history preserves
them. Deleted content must not be used to infer current product contracts. The
current Sim documentation is the authority for this product.
