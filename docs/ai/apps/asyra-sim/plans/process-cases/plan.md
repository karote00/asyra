# Asyra Sim - self-authored etching and lithography cases

## Status and task association

Created: 2026-11-07. Status: planned; no numerical or product implementation has
started. User direction: independently implement what is currently achievable,
maintain MIT, and stop relying on third-party solver implementations, examples
and experimental datasets for this effort. Existing framework/runtime dependencies
are retained; no new package or native executable is selected.

This is a new App process-experiment plan, separate from the R0 first-release
roadmap and M6. Closeout owner: the coordinating agent in this user-owned chat,
with user product acceptance. Do not inherit old M6 push or multi-agent authority.
Base: `origin/main` at `5cf909b1fd8fd98991430124785de9bf52e322d7`.
Planning branch: `codex/asyra-sim-process-cases-plan`.
Worktree: `.worktrees/asyra-sim-process-cases-plan`.

Authoritative behavior: [process-cases-v1.md](../../specs/process-cases-v1.md).
Task dependencies and current acceptance: [process-cases.flow.json](process-cases.flow.json).
No task is accepted merely because this document or its flow validates.

## Planning task contract

This request creates this plan, its proposed specification, its flow document
and the entry in [PLANS.md](../../PLANS.md). No production code, tests, runtime
configuration, dependency, domain-knowledge, unrelated plan, release or remote
operation is changed. Discovery is limited to current Sim ownership, relevant
framework/public contracts, flow authoring and document checks. No external
research or data is needed. Completion is a reviewable, structurally admitted
plan with explicit numerical uncertainties and unexecuted implementation criteria.

Checks for this planning slice: flow CLI admission/context, existing plan-flow
document tests, naming checks, relative-link verification, scoped diff and
whitespace review. No product accuracy or visual acceptance is asserted.

## Delivery sequence

- Milestone E: Tasks 1-4 deliver the independently verified etching journey.
- Milestone L: Tasks 5-8 deliver all four lithography stages and timed source motion.
- Milestone B: Task 9 connects compatible cleared openings to etching through a
  declared ideal geometric transfer. It depends on both standalone milestones.

The current request authorizes planning only. Future implementation selects a
bounded task below from a base containing this plan and follows the repository
[task-context workflow](../../../../workflows/task-context.md). No new permission
is needed to review this plan; production execution is not claimed here.

## Current-source feasibility review

- `apps/asyra-sim/src/init/custom-renderer.ts` uses the supported CUSTOM profile.
  Existing public Preset spatial facilities may be reused; a new renderer or
  speculative Core/official-profile migration is not required by this plan.
- `src/analysis/contracts.ts`, `runner.ts` and `worker-protocol.ts` are built
  around rigid-body snapshots, trajectories and pair results. Their lifecycle
  concepts apply, but field payloads need an explicit process contract. Do not
  broaden collision semantics or fake pairs. No generic solver-plugin framework.
- `src/storage/project-format.ts` and `run-record.ts` assume mechanical run data.
  Reuse the existing storage publication/acknowledgement owner; add explicit
  process artifact admission and dispatch, with a supported schema/version
  transition and unchanged historical mechanical evidence. No second database.
- `src/domain/workcell.ts` has mechanical dimension limits. A material grid owns
  a separate numerical length scale and its validated local-to-scene transform.
- Framework owns intent, transactions, canonical state, subscriptions and render
  mechanics. Sim owns process physics, units, model versions and failure semantics.
- Start with self-authored TypeScript and typed arrays inside a module Worker.
  Small direct transforms avoid an FFT dependency. This removes the earlier
  proposed native Python service from the chosen direction. Browser runtime cost
  is unproven; Task 1 must measure it before promising interactive computation.
- Reuse immutable computed arrays for metrics and rendering within one run;
  no model solve on camera movement, time-slice selection or UI re-render.
  Avoid a cache until its dependencies, lifetime and work-count proof exist.

No numerical feasibility has been accepted. Main risks are strongly anisotropic
fronts, mask-edge accuracy, optical approximation/sampling limits, coupled time
steps, and browser memory/latency. Task 1 resolves or narrows these before product
implementation. Source inspection establishes ownership, not successful execution.

## Task 1 - Derive and prove bounded numerical feasibility

Owner: Sim numerical model preparation. Input: proposed specification and current
App constraints. Output: independently derived oracle definitions, permanent
small numerical proofs, final model restrictions and measured resource envelope.
Allowed future scope: App analysis process modules and adjacent formal tests,
this specification/plan/flow. No UI wiring or external solver/data imports.

Derive signs, units, crystal-frame mapping, speed-law bounds, numerical flux and
stability conditions; independently derive plane/circle, wave, absorption,
reaction, developer travel-time and scan-dose oracles. Choose synthetic defaults,
finite domains and small fixed workloads. Retain every feasibility test as a
formal test. Measure memory, elapsed time and stop latency under existing guards.
Review all downstream handoffs before production entry. If the coupled model
cannot meet the bounded envelope, revise the proposed model here, visibly, rather
than substitute a renderer animation or lower the acceptance threshold silently.

Exit: E01-E05 and L01-L05 proof designs are concrete, baseline errors/limits are
recorded, source/model separation is clear, and no material numerical uncertainty
is represented as passed. Required runtime claims remain unaccepted until tested.

## Task 2 - Own process definitions and detached execution

Depends on Task 1. Owners: Sim domain/common APIs, Feature and analysis lifecycle.
Input: validated material/mask definitions and numerical settings. Output: detached
snapshots and bounded completed/partial/failed process artifacts.
Allowed future scope: `src/domain`, `common-apis`, `features`, `init`, process-owned
`analysis` and their tests. Reuse existing framework mechanics through public APIs.

Add admission for units, domain, geometry, synthetic parameters, output schedule
and budgets. Extend the existing App analysis service with explicit process-job
routing while preserving mechanical protocols; no duplicate user-intent runtime.
Worker reads snapshots only. Cancellation, timeout, late callbacks, app replacement
and disposal settle exactly once. Progress cannot write canonical definitions.
Frozen arrays are transferred/copied with explicit ownership; observers cannot
mutate evidence. Invalid output stops at the producing stage.

Exit: invalid input allocates no worker; source edits cannot affect active input;
late/retired results are rejected; one bounded job lifecycle and declared byte
ceilings are proven; mechanical runner tests retain their behavior.

## Task 3 - Implement the etching kernel

Depends on Task 2. Owner: Sim etching numerical method. Input: admitted section,
mask, speed law and time schedule. Output: timed material interfaces and metrics.
Allowed future scope: process-owned `analysis`, pure domain validators and tests.

Implement isotropic then synthetic cubic front propagation, normal/frame mapping,
mask accessibility, stable stepping, controlled reinitialization and contour
extraction. Numerical results are authoritative; UI provides no patch geometry.
No side/bottom boundary bypass. Use separate analytic calculations for test
expectations. Failure belongs to the kernel, not storage or display.

Exit: E01-E05 pass, including independent space/time refinement, boundary failures
and material monotonicity; workload fits Task 1's fixed envelope or reports limits.

## Task 4 - Deliver the complete etching workbench

Depends on Task 3. Owners: Sim UI/projection and storage.
Input: definitions and immutable process artifacts. Output: ordinary configure,
run, inspect, compare, export and reopen journey with acknowledged persistence.
Allowed future scope: `src/ui`, `render-app`, `render-layers`, `common-apis`,
`features`, `storage`, `init`, `samples`, `e2e`, directly affected delivery scripts
and their tests. No numerical decisions in these consumers.

Reuse current automatic persistence and edit history. New process results have
explicit validated storage records, not modified historical collision records.
Source-space contour/metric tests precede close-up browser evidence. Timeline
playback labels computed slices; interpolation cannot become numerical evidence.
Camera/time selection performs zero solver invocations. A failed storage write
remains retryable. Preserve the existing portable-project ceiling.

Exit: E06 and existing mechanical journeys pass; two synthetic variants compare
and reopen without source drift. Milestone E completes only after both numerical
and normal-product evidence are accepted. This is not R0 release acceptance.

## Task 5 - Implement source placement and scalar optical propagation

Depends on Task 4. Owners: Sim optical domain and numerical method.
Input: two source heads, coherence groups, phase, pose, finite-width beams and
index-matched stack. Output: normalized boundary and internal complex fields,
irradiance, absorbed-energy accounting and explicit approximation limits.
Allowed future scope: optical domain/analysis, pose Feature/API wiring and tests.

Use existing scene transforms and gesture transactions, not robot-joint tracks.
Reject out-of-plane/high-angle/undersampled fields. Implement small direct
transforms and boundary guards before optimizing. Source movement follows an
explicit frozen track; render timing is irrelevant. Only identical numerical
inputs permit field reuse. Mechanical collision semantics remain separate.

Exit: L01-L02 and source edit/undo cases pass; propagation and approximation
errors are distinguished. Every optical-to-material handoff declares frame/units.

## Task 6 - Couple exposure and material reaction

Depends on Task 5. Owner: Sim exposure integrator.
Input: optical field, synthetic reaction/absorption parameters and frozen track.
Output: concentration, dose and absorption at requested exposure times.
Allowed future scope: process-owned analysis/domain and adjacent formal tests.

Resolve source pose/shutter, solve optics using current absorption, advance
reaction and refresh absorption. This bounded iteration is internal to exposure,
not a cyclic task dependency. Maintain explicit static/feedback modes and time
alignment. Enforce physical bounds through stable integration, not result clipping.
Do not assume equal total dose makes different bleaching histories equivalent.

Exit: L03/L05 pass, including static/scan equivalence limits, shutter gating,
time refinement and changed absorption feeding the next optical step.

## Task 7 - Compute developer-accessible resist removal

Depends on Task 6. Owner: Sim development numerical method.
Input: final reaction fraction, initial resist/mask geometry and development time.
Output: arrival times, retained resist, connected cleared openings and metrics.
Allowed future scope: process-owned analysis/domain and tests.

Build the fixed dissolution-speed field and propagate from accessible developer
boundaries only. Distinguish development time from exposure time. Substrate and
hard mask remain protected. No buried voxel deletion based only on dose threshold.

Exit: L04 passes; constant/layered/blocked-domain oracles, refinement and residual
film checks establish usable geometry rather than just an image.

## Task 8 - Deliver the complete lithography workbench

Depends on Task 7. Owners: Sim UI/projection and storage.
Input: source setup, timed motion and four-stage artifacts. Output: inspectable,
comparable, reproducible end-to-end lithography experiments.
Allowed future scope: the same consumer owners as Task 4 plus optical controls.

Show propagation, material absorption, reaction and developed contour with units.
Support pose drag before run and prescribed constant-speed exposure motion.
Keep draft gestures separate from frozen exposure. Compare stationary/scanned
and phase/dose changes; export/reopen all required provenance and fields.

Exit: L06 and mechanical/etching regressions pass, including one undo per drag,
zero solve on playback, changed inputs creating new evidence and all failure paths.
Milestone L is complete only when the actual four-stage user journey passes.

## Task 9 - Connect developed openings to etching

Depends on Tasks 4 and 8. Owner: Sim process-to-process conversion.
Input: completed developed geometry and supported transfer settings. Output: a new
etch definition referencing the immutable source and declared ideal transfer.
Allowed future scope: process domain/common API/Feature, consumer UI/storage and
adjacent unit/integration/browser tests; no physical hard-mask etch/strip model.

Admit only one fully cleared connected opening in matching units and frames.
Do not drop residual films, merge openings or silently rescale. Reject unsupported
geometry. Both success and cancel/undo preserve source evidence.

Exit: B01 passes through normal actions, export/reopen and repeat execution;
combined artifacts remain traceable and distinguish ideal transfer from physics.

## Verification and preservation gates

The flow's automated selectors are planned stable identities, not existing test
producers. Each implementation task must map its named cases to permanent tests
and publish current evidence before its criterion can pass. Empty observations
mean unverified. Do not publish a whole milestone from a generic green exit code.

Use existing Sim supervised test entrypoints for applicable unit/integration and
browser cases; typecheck, lint and build at completed product slices. Naming
checks precede identifiers and run after their first slice. Run existing heavy
and clean-consumer gates at the applicable final integration checkpoint, preserving
all guards. No new dependency/environment tool is authorized by this plan.

Preservation scope: existing domain/trajectory admission, formal and live
analysis, init/disposal, transaction history, project publications, run records,
comparison and portable export/reopen. Select actual affected formal cases in each
Task Execution Card; shared changes retain existing obligations. Numerical tests
must establish field/contour behavior before screenshots. Resource evidence binds
to stated hardware, source, grid and time step; no unmeasured realtime promise.

Whole-plan completion requires E, L and B journeys on the same source, accepted
numerical/resource evidence, existing behavior preserved, and no required pending
flow criterion. Publication, push, merge and external physical validation remain
separate. The next task after planning is Task 1, not immediate UI construction.
