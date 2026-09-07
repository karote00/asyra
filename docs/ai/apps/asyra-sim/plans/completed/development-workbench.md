# Development Workbench Closeout

- Plan: Asyra Sim development workbench and original-part geometry refactor.
- State: DONE - development implementation, 2026-09-07.
- Review: <a href="https://github.com/karote00/asyra/pull/156" target="_blank" rel="noopener noreferrer">PR #156</a>.
- Final decision: close this PR's development scope; keep the R0 roadmap active.
- Deployment: <a href="https://asyra-sim.vercel.app" target="_blank" rel="noopener noreferrer">Asyra Sim</a>.
- Authorities: [product](../../PRODUCT.md), [architecture](../../ARCHITECTURE.md),
  [original-part method](../../specs/original-part-method-v1.md),
  [hosted development](../../release/HOSTED_PREVIEW.md), and
  [first-release gates](../../release/FIRST_RELEASE.md).

## Outcome for Users

Users can edit a synthetic robot workcell, choose or author experiments, import
joint trajectories, inspect motion with live whole-part collision/clearance
feedback, run bounded formal analysis, compare candidates, and export evidence.
Six starter experiments include an intentional tool/table collision. Every
modeled part enters the default workcell check; intentional assembly relationships
remain explicit. Display visibility does not silently exclude geometry.

The workbench also provides direct Object edits, Undo/Redo, stable panels,
light/dark themes, pan/zoom and padded Fit all, local saves, portable projects,
trusted pre-start method extensions, acceptance rules, and separate field notes.
These are experiment tools, not structural, deformation or equipment-control
capabilities, and not a guarantee of real-world feasibility.

## Architecture and Implementation Boundary

Asyra remains the application framework: public composition, typed events,
canonical transactions, history and lifecycle owners are reused. Sim owns the
3D domain, CUSTOM engine adapter, numerical methods, Workers and projections.
The approved runtime-reset work retires the old composition before replacing
a document. Generic 3D Preset extraction is deferred.

Complete original geometry and source placement feed both rendering and analysis.
Method `original-part-clearance-v1@1.0.1` distinguishes clearance from established
contact/penetration even after a clearance witness has already been found.
Live and retained evidence share their computation owner; edits invalidate
dependent results, and cached seeks do not create duplicate observations.
Unsupported input, numerical ambiguity and exhausted work stay explicitly
unknown. Whole-part highlights are not precise intersection regions.

## Exit Evidence

- Deployment implementation checkpoint: `78694410b1c8f0372f42349c12196f90a50071ef`.
  Vercel project `asyra-sim` is connected to the repository; the durable domain
  is assigned and `main` production tracking is verified.
- App unit/integration gate: 578 tests across 112 files passed. Deployment and
  HTTPS environment regressions include test-first failing proofs.
- App lint, typecheck, the exact Vercel build command and 11 naming checks passed.
  The build completed all 17 required tasks.
- The hosted normal-app mixed-pair browser journey passed. Five light/dark,
  close-up and expanded-feedback screenshots were inspected. At 3.840 s the
  workpiece remains a clearance warning; at the penetrating 3.856 s pose it is
  a collision. Cached revisits retain the same evidence without another report.
- HTML, script, stylesheet and module Worker responses returned successfully
  with the declared same-origin policy; a missing script returned 404.
- CI workspace scheduling is bounded to two concurrent tasks, retaining every
  existing test owner, timeout and assertion. Its permanent automation test and
  the 23-task workspace CI stage passed locally.
- Current-head repository CI, both existing Vercel projects and the new Sim
  Vercel check must all pass before the final user-review handoff. The PR checks
  are the source of remote status; this file does not certify a future commit.

Earlier full browser, Framework lifecycle, source-geometry and exact-source
consumer evidence remains in the roadmap checkpoint and permanent tests.
The latest hosted check is not a rerun of every historical resource gate.
The local root script gate encountered an unrelated nested worktree in its
file-placement scan; that checkout was preserved, and remote CI uses a clean
checkout. No test was removed or weakened to mask that local condition.

## Release Boundary and Remaining Work

This closes development implementation, not the complete M0-M6 roadmap.
Independent numerical review, reference-hardware and larger resource proofs,
an updated exact-source offline package and packaged workflows, independent
pilots, and public maintenance/support policies remain first-release gates.
The old packaged candidate is not silently promoted to this source revision.

No version bump, Changeset, package publication, release tag or merge is created
by closeout. The user's separately requested Vercel deployment is a hosted
development workbench, not R0 Public Alpha. Browser storage belongs to each
origin; use portable export/import to transfer local projects.

## Archived Original-Part Refactor Owner Sequence

The following completed sequence was moved from roadmap section 1.1. It records
the original bounded design and local correction decisions, not a new active
task or permission to reopen completed owners.

The user's corrected requirement supersedes the earlier proxy-based R0 scope.
The product contract section 2 is authoritative. Scope: Sim domain, assets,
editing, snapshots, methods, worker/results/storage, render/UI, permanent tests,
App docs and its Inspector. No Framework changes, new dependencies, equipment
control, publishing or unrelated cleanup are authorized by this refactor.
Preserve panel layout, themes, canonical transactions, kinematics, explicit
analysis scope, cancellation and immutable historical evidence.

The bounded refactor is implemented and locally verified; PLANS.md records the
current evidence and user-review handoff. The owner sequence below remains the
scope and design record, not an assertion that external R0 gates are complete.

Work one Inspector owner at a time:

1. **Snapshot admission:** reject new execution when a selected body has legacy
   visual bindings whose complete geometry is absent from the method input.
   Primitive colliders, hidden state, warning acknowledgement, direct runner or
   Worker entry, and historical rerun cannot bypass rejection. Preserve old
   result validation independently. Gates: preflight/snapshot/admission unit
   regressions, runner/Worker no-execution proof and ordinary UI blocked-state
   test. This is a protective intermediate state, not a mesh solver.
2. **Domain and asset source, then edit/storage/render consumers:** introduce
   bounded canonical indexed geometry and explicit topology/solid semantics.
   Preserve original triangles, conversion and provenance; material/color data
   cannot change collision coverage. Freeze source identities and complete
   resolved geometry into new-version run inputs. Reject incomplete migration;
   never promote old proxies to equivalent original parts. Update the matching
   Inspector handoffs before each consumer. Gates: source-space parity,
   transforms/units, missing/corrupt geometry, Undo/Redo, duplication and portable
   projects. The maintained table-leg case must use ordinary accepted data.
3. **Method, then runner/results:** implement original-triangle static contact,
   clearance and containment under the declared topology, followed by complete
   joint-space continuous-time bounds. No mesh convexification, decimation or
   sampled-clear conclusion. Boundary/ill-conditioned cases remain unresolved.
   New method/version and snapshot identity must not reinterpret old evidence.
   Gates: independent triangles/closed solids, disjoint concave regions and
   holes, containment, grazing/degenerate input, feature-only contact, fast and
   rotational crossing, resource termination, Worker parity and report identity.
4. **UI and closure:** present one part geometry with optional diagnostic
   overlays, not an unrelated visual shell over a surrogate. Restore the full
   ordinary example/run/replay/compare journey only through the mesh route.
   Gates: App unit/type/lint/build, affected browser and synchronized visual
   cases, resource profiling and cancellation. Spatial acceleration requires
   a measured owner plan and an equivalence oracle; resource limits cannot
   authorize loss of geometry. Rebuild independent delivery only afterward.

The user canceled the one-turn account-usage stop line. Stop only for new
dependency requirements or unresolved product/Inspector conflicts outside this scope.
Record the completed owner and next gate in PLANS.md; do not label the entire
refactor complete because the admission block or viewport works.

Bounded numerical usability iteration (2026-09-05): the normal full-source
browser run reached 46 pairs but exhausted mesh work at the nineteenth pair,
leaving 28 unresolved. Preserve the budget and all source geometry. The domain
owner now exposes exact shared-ancestor-relative pair poses; only the new method
consumes them. Permanent interval enclosure proofs and full-triangle separating
certificates reduced the ordinary example to 112 interval evaluations, with
all 46 pairs resolved and no triangle-work exhaustion at the unchanged budget.
The full-suite Node run measured about 1.5 seconds; this is development-host
evidence, not a reference-hardware guarantee. This does
not authorize unrelated optimization, new dependencies or changed tolerances.

Browser oracle correction: the original-part import journey passed source
acceptance and history restoration but failed whole-viewport PNG byte equality
twice, including after waiting for settled frames. The UI owner must prove Undo/
Redo against exported canonical source bindings and original bytes, not treat
GPU pixels (including diagnostic overlays) as geometry authority. Keep the
wireframe visual difference, add explicit restored part count/source/placement
assertions, and retain both rendered views for inspection. Scope is the existing
import E2E case only; projection source-space parity tests remain mandatory.
This replaces screenshot-byte equality, not the product restoration contract.

Final method-owner review: retain a valid static witness when a later triangle
query or interval-bound query exhausts the mesh budget. Inputs are the validated
pair and the existing kernel's evidence/exhaustion response; outputs remain the
complete interval partition. A zero lower bound after exhaustion is conservative,
not proof of clearance. A proven issue remains a finding, other sampled bounds
remain unresolved, and all unvisited intervals remain explicitly unknown.
This changes only `continuous-query.ts` and its method-owner regressions under
the Inspector's method step and product sections 7-8; no renderer, state, scope,
threshold, historical method identity or external contributor is allowed.
Gate: three red witness-retention cases, focused/full App tests and the affected
Worker/browser workflows. Stop for any unsatisfied evidence-owner contract.
