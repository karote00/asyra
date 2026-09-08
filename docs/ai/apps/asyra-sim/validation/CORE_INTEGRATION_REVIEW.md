# Core integration review - 2026-09-08

Baseline: `a379a0ee2`, branch `codex/asyra-sim-m2-import-contract`.
This is a requested architecture review, not a new runtime contract or a claim
that the findings have been fixed. Sim production code and its Inspector remain
unchanged in this documentation/review task.

## Scope and method

Trace the normal caller paths for composition, canonical editing, transaction
publication, automatic persistence, UI/geometry projection, import and analysis
artifacts, and complete runtime replacement. Compare them with the public Core
facades, Framework ownership/reuse rules, Design's actual publication adapter and
document session, and Sim's `compose`, `edit`, `project`, `snapshot`, `run`,
`storage` and `ui` Inspector owners and connecting routes.

Evidence comes from current source and existing permanent owner tests. There
are no hardware latency measurements or new browser performance claims here.
Solver mathematics, full source geometry, Preset extraction, backend creation,
packaging and release remain outside this review. No broad source cleanup is
authorized by these findings.

## Conclusion

Sim uses real Core Features, canonical owners, transactions and lifecycle
facades. The earlier reorganization was not merely cosmetic. However, the
automatic persistence and projection consumers do not complete the incremental
integration demonstrated by Design. Working Undo and isolated child fields are
necessary evidence, not proof of efficient publication, storage or upstream
computation.

Read [the reusable Core App guide](../../../../public/start/custom-composition.md#build-one-complete-data-path)
for the implementation method. The following source paths are relative to the
repository root; they identify the first responsible owners.

## Confirmed gaps

### 1. Automatic persistence observes status and recaptures the project

Priority: high. Owner: Sim storage/composition handoff.

`apps/asyra-sim/src/init/bootstrap.ts` exposes `subscribe()` by accepting both
`committed` and `rolled-back` transaction status. In
`src/ui/runtime/use-project-runtime.ts`, every such notification calls
`session.markEdited()` and increments the workbench revision.
`src/storage/project-session.ts` waits in a fixed 300 ms window, calls document
capture, encodes the complete `ProjectSnapshot`, and writes one replacement
record. The snapshot includes referenced runs and source collections, not just
the changed canonical field.

This has no document-publication selection or per-publication persistence
identity. A rollback notification can mark an unchanged restored document dirty.
Several completed operations can become one latest snapshot. The queue has
useful CAS acknowledgement and failure protection, but it is a snapshot queue,
not a stream preserving each canonical publication. Removing the timer alone
would simply increase complete captures.

Design's `src/collaboration/factory-adapter.ts` consumes Core publications,
filters document channels and preserves identity when no filtering is needed.
Its `src/collaboration/lifecycle.ts` appends each publication to its outbox and
drains it in order without a per-Feature debounce. Those concepts apply locally
without importing Design's backend or enabling networking.

Required regression evidence for a correction: edit/edit/Undo/Redo during a
blocked write retains distinct ordered document publications; transaction-end
rollback and non-document work produce no document write; ordinary edits require
no full-project capture; acknowledgement, retry, restart and reference recovery
remain correct. Explicit export/checkpoint capture must still work.

### 2. Background capture enters an interaction-cancelling command path

Priority: high. Owner: persistence-to-edit handoff.

`ProjectSession.save()` calls the document capture adapter, ultimately reaching
`bootstrap.captureSnapshot()` -> `save()` -> `editing.edit.captureDocument()`.
In `src/features/edit-workcell.ts`, capture shares `execute()` with editing
commands. That helper invokes `runAfterCancellingActiveSessions(...)`, whose
Framework implementation cancels active interaction sessions before running
the supplied operation.

A deliberate capture/replacement can need a stable interaction boundary. An
automatic persistence observer should consume already-settled evidence instead
of entering that command path. As wired, a timer from an earlier commit can
reach a later interaction and request its cancellation. This is a confirmed
call-path coupling; this review has not reproduced a user-visible interruption
in every current Sim control, and programmatic analysis tasks must not be
conflated with interaction sessions.

Required regression evidence: commit action A, start a live interaction B before
the persistence work executes, and prove saving A neither cancels B nor creates
an early B commit. Explicit replacement must still quiesce real work correctly.
Correct the incremental persistence inlet rather than weakening Feature
cancellation semantics globally.

### 3. Local field subscriptions sit downstream of broad canonical reads

Priority: medium. Owner: Sim runtime read projections and their consumers.

`src/ui/runtime/workbench-data.ts` refreshes candidates, load diagnostics, Undo
depth, retained runs and the selected workcell for each shared revision.
`bootstrap.getRuns()` captures the canonical owner snapshot to find references.
`src/common-apis/workcell.ts::readWorkcell()` calls
`readCandidateParameters()` (which captures a snapshot) and then captures another
snapshot, scans scene elements and validates the assembled workcell.
Core's `getCanonicalOwnerSnapshot()` actually serializes Props/Scene and clones
the observation; it is not a constant-time handle to a retained read model.

Consequently even an experiment-only change can reread unchanged geometry and
history. The new workcell identity also invalidates
`src/ui/viewport/use-viewport-projection.ts` preparation. Fine-grained body field
hooks isolate some React work but do not prevent this upstream work.

The existing workbench test proves reuse when its entire revision is unchanged;
it does not distinguish a relevant geometry change from an unrelated document
change. That is why this gap survived the prior organization/optimization work.

Required regression evidence: using the real runtime, edit one experiment or
observation and count zero unnecessary workcell captures, source preparation
and retained-run scans; edit one body and refresh its actual dependent owners;
Undo/Redo, membership changes and runtime replacement must invalidate correctly.
Choose scoped canonical observation/projection APIs before adding caches or
deep-comparison wrappers. No wall-clock performance threshold is established by
this source review alone.

### 4. App property granularity limits the benefit of incremental delivery

Priority: medium. Owner: Sim canonical property schema and App update APIs.

`src/init/properties.ts` stores each experiment definition as one object field.
`src/common-apis/experiment.ts::updateExperiment()` replaces that complete value,
including the trajectory, when changing a rule, budget or other setting. Body
parameters similarly share one object property. This is valid canonical data,
but transaction grouping does not make a whole-object replacement a smaller
domain patch.

The current snapshot storage masks this distinction. A publication-based
adapter alone must not be advertised as a minimal-payload solution until this
boundary is measured. It is not evidence that the solver or geometry needs to
be simplified.

Required regression evidence: with a representative large trajectory, change a
single independent setting and inspect the actual canonical delivery size and
work, not a mocked transport call. Decide appropriate property/patch boundaries
with schema validation, persisted identity migration and Undo equivalence.
Do not silently rewrite old experiment evidence or introduce a private diff
engine in the storage adapter.

## Explicit differences and missing evidence

- Project rename is repository/session metadata in `ProjectSession.rename()`,
  outside canonical History. It persists but is not an undoable document edit.
  Decide whether project-list naming should stay metadata or join canonical
  document semantics; do not accidentally promise that every persisted field
  already has Undo. Changing this is a separate product/schema decision.
- Preflight before snapshot creation repeats validation on newly detached
  inputs. This protects a real admission boundary; removing it because the
  same helper name appears twice would be unsafe. Reuse would require an
  owner-issued artifact with complete dependency validity and measured benefit.
- Immutable run/source archives and separate canonical references are valid
  resource ownership. An incremental storage design must preserve reference
  closure, source availability, integrity and Undo retention; a canonical delta
  alone is not the complete project recovery format.
- Design's signal hooks and socket server are examples, not universal runtime
  dependencies. Sim should keep its CUSTOM provider, local product boundary,
  domain methods and public Core lifecycle.

## Existing boundaries that should be preserved

- `features/edit-workcell.ts` and `common-apis/*` route mutations through actual
  Core/transaction APIs with validation and expected-revision checks. There is
  no replacement UI-owned Undo stack to remove.
- `init/runtime-controller.ts` and `bootstrap.ts` own fail-closed replacement,
  pause/admission, real cleanup and retired-runtime guards. Saved startup does
  not add a new example over the restored document.
- Trajectory import tests prove explicit external units, strict JSON retention,
  one parsing lifetime, exact validated conversion receipt reuse, and
  invalidation/cancellation. These are already reusable owner artifacts.
- Camera state and camera submission are viewport-local. Existing camera tests
  prove that camera-only work does not recreate mesh preparation.
- Live-analysis preparation and reuse tests exercise retained input preparation,
  fresh per-sample budgets and all-pair evidence reuse. No new cache or solver
  rewrite is justified by the persistence findings.
- Historical snapshots, runs and opaque sources remain detached, validated and
  lifetime-owned; restoring or viewing evidence does not reinterpret it using
  a current method.

## Verification and its limits

Executed at the baseline during this review:

- Sim: 55 tests across project-session, bootstrap-lifecycle, workbench-data,
  editing and body-subscriptions passed.
- Sim: 36 tests across trajectory-import-panel, live-preview-reuse,
  worker-preparation, viewport-camera and snapshot-history passed.
- Design: 38 tests across collaboration-factory, collaboration-action-publication,
  collaboration-publication-outbox and collaboration-lifecycle passed. The first
  lifecycle run could not resolve the unbuilt Collaboration package; after
  building its declared `build:collaboration` target, all 18 lifecycle tests
  passed. No dependency was added.

Logs are local task artifacts under `.artifacts/architecture-review-*.log`.
The tests above verify preserved behavior; they do not close the missing
integration oracles described under each finding. The project-session test
explicitly expects burst coalescing before capture. The workbench test expects
revision-wide invalidation. Green results therefore cannot establish the desired
incremental integration. No production correction or new Sim visual acceptance
is claimed by this review.

## Correction order and milestone meaning

1. Freeze the Sim local publication persistence and resource-recovery contract,
   reconcile the existing storage Inspector/spec (which currently describe
   coalesced snapshots), and define normal-caller regression oracles. This is
   a prerequisite to production work, not a request to build a backend.
2. Replace the automatic status/capture inlet with the canonical document
   publication handoff. Prove ordered delivery and that background persistence
   cannot cancel an interaction. Keep explicit capture for export/checkpoints.
3. Scope read projections at their canonical change owners and prove real work
   counts across unrelated edits and replacement.
4. Measure and, where justified, refine property granularity with an explicit
   migration plan and historical compatibility evidence.

M1 closeout and M2 import acceptance remain historical scoped results. They do
not establish completion of this integration follow-up or M3-M6. Address the
newly requested integration work before resuming the separately bounded M3
method/evidence review. This review itself authorizes no solver, backend,
packaging or release implementation.
