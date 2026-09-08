# Core integration review - 2026-09-08

Baseline: `a379a0ee2`, branch `codex/asyra-sim-m2-import-contract`.
This is a requested architecture review, not a new runtime contract or a claim
that the findings have been fixed. Sim production code and its Inspector remain
unchanged in this documentation/review task.

Follow-up baseline: `cc16f8ce5`. The user accepted the CUSTOM rendering boundary
and requested a requirements-first mapping to existing Asyra capabilities.
The schema observation below is not a confirmed defect or a decision to split
properties. The proposed staged refactor below is the current recommended order.

Implementation progress: the composition document-channel slice now installs
Core local Scene Tree/Props channels and forwards original publications to
runtime document subscribers. A normal-runtime regression failed with zero
publications before channel installation; a second regression exposed an extra
rollback notification before replacing the status subscription. Edit, Undo and
Redo now each publish once; no-op and transaction-end rollback publish nothing.
Direct computed reads already returned correct values, so this slice adds no
redundant computed projector or renderer replacement. Registered UI consumers,
scoped read invalidation and publication-based storage/recovery remain pending.
The findings below retain their explicitly identified audit baselines.

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

## Schema observation - no migration decision

Owner: Sim canonical property registration and App update APIs. This is a
feasibility question, not a confirmed architecture defect.

`src/init/properties.ts` stores each experiment definition as one object field.
`src/common-apis/experiment.ts::updateExperiment()` replaces that complete value,
including the trajectory, when changing a rule, budget or other setting. Body
parameters similarly share one object property. This is valid canonical data,
but transaction grouping does not make a whole-object replacement a smaller
domain patch.

Whole-object properties are supported. Correct component registration and
computed/UI projection can expose individual values without changing that
canonical representation. The initial review overreached by putting schema
refinement into the correction order before tracing these Framework owners.

Core distinguishes value replacement from record collection patches;
`patchElementProperties()` is not a general recursive JSON diff. Props Manager's
prepared mutation path skips equal field values and records before/after
evidence for changed property keys. That identifies the evidence unit, not a
measured performance failure. Preserve the schema first, then measure actual
publication size and owner work after correct registration/projection wiring.
Any later change needs measured justification, explicit migration and historical
compatibility evidence. Do not invent a storage-side diff engine.

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

## Milestone meaning

M1 closeout and M2 import acceptance remain historical scoped results. They do
not establish completion of this integration follow-up or M3-M6. Address the
newly requested integration work before resuming the separately bounded M3
method/evidence review. This review itself authorizes no solver, backend,
packaging or release implementation.

## Requirements mapped to existing Asyra capabilities

This follow-up is a proposed implementation direction, not new runtime behavior.
The supported product needs complete original-part geometry, canonical editing,
explicit import admission, live/formal analysis, immutable results, local
recovery and complete replacement. Preserve these requirements and their owners.

| Sim requirement                                    | Existing capability and proposed use                                                                                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Body identity, hierarchy, joint/source metadata    | Keep `defineComponent`, `registerPropertySchema`, `definePropertyComponent`, component relations and canonical Scene Tree/Props mutations.                             |
| Experiment settings and trajectory                 | Keep the registered object initially. Expose needed fields through property/computed/UI projections; do not split merely because it is an object.                      |
| Completed action and Undo/Redo                     | Keep existing Features and `runTransaction`; persistence consumes resulting publications without regrouping gestures.                                                  |
| Object/experiment inspector values                 | Use `registerUIProperty`, `getUIProperty` and `onUIPropertyChange`, with scoped canonical projection updates upstream.                                                 |
| Candidate, experiment and retained-reference lists | Register relevant data-channel batch observers, read affected entities through Core, and publish bounded derived lists. Do not maintain another editable scene mirror. |
| Reading current fields without full snapshots      | Wire `projectLocalComputedDataFromPropertyIds` or `projectLocalComputedDataForElements`, then read relevant `getElementComputedData` values.                           |
| 3D appearance and playback                         | Keep `setRenderEngineProvider`, `registerRenderLayer`, domain poses and spatial descriptors; consume scoped model projections. No component renderStrategy migration.  |
| Camera, playback, preview and incomplete text      | Preserve transient ownership. Register UI Context properties where shared/derived UI values are useful, not for every local variable.                                  |
| Automatic local persistence                        | Compose document channels and consume `SharedPublication` through an App durability adapter. Keep explicit serialization for export/checkpoints.                       |
| Source/result integrity and import acceptance      | Preserve archives, admitted receipts, detached Feature tasks and separate canonical reference transactions.                                                            |
| Complete document replacement                      | Keep `preflightLoad`, `resetRuntime`, captured Core identity and registered cleanup; retire the new observers/UI properties/queue too.                                 |

## Feasibility details

### Registration needs its canonical input wiring

The current Core name is `registerUIProperty`, not `registerUIContextProperty`.
`PropertyRegistration` supports compute, aggregate, aggregateKey, source$,
selection policy and triggers. `onUIPropertyChange` has initial current-value
delivery. The ordinary `setUIProperty` path suppresses equal values; source$
forwards its emissions. Avoid rebuilding large values merely to compare them.

The [UI Context contract](../../../framework/packages/ui-context.md) explicitly
assigns recompute triggers to Preset/App subscriptions. In current source,
action/key filters are installed for aggregate registrations with triggers;
a compute callback alone does not install a canonical observer. The standard
recompute context is selection-oriented, while Sim currently owns selectedId
in App UI state. Copying a Design registration alone would not connect selection.

Sim applies `CUSTOM` with `defaults: []`. Preset installs requested modules
only. Its optional UI Context default normally acquires document/selection
channels, canonical property projection and UI observers, along with official
UI registrations. CUSTOM profile selection alone installs none of that module.

Recommended start: retain CUSTOM and explicitly compose the required document
channels and Core data-channel observers. Project affected property owners once,
read their element-computed values, then update registered Sim UI values through
Core. Preserve selected identity's transient semantics, including empty/missing
targets and refresh on selection change. Framework owns registry, observables,
property projection and cleanup; Sim owns domain dependency routing. Do not
create another signal registry or copy Preset's 2D selection system. Select an
optional Preset default only when its full behavior fits the product.

Public entrypoints already exist: `createLocalSharedDataChannel`,
`registerSharedDataChannel`, `registerDataChannelObserver`, the projection
helpers above and UI-property APIs. A normal CUSTOM-runtime test must still
prove initial-load projection, mutation, Undo/Redo, selection, removal and
teardown. API availability is not proof that Sim has composed these pieces.

Source evidence: `packages/preset/src/defaults/install.ts`,
`defaults/modules/ui-context.ts`, `defaults/installation.ts`;
`packages/ui-context/src/property-registry.ts`, `ui-context.ts`;
`packages/core/src/data-channel-observer.ts`, `apis/ui-context.ts`, `core.ts`.

### Property definitions remain valid

Core's element update facade resolves declared targets, prepares one Props
batch and applies it. Value replacements and record collection patches are
different operations, as tested by `element-property-api.test.ts`. A correctly
defined component may keep a structured object while consumers observe useful
fields through computed/UI registration. There is no automatic requirement to
decompose Experiment into many new persisted properties.

Measure the real operation path before optimizing representation: equality,
owner preparation, publication evidence and consumer recomputation are different
costs. Source evidence: `packages/core/src/apis/element-properties.ts`,
`types/element-properties.ts`, and
`packages/props-manager/src/manager/props-manager.ts::preparePropertyMutationBatch`.
Its equal-value suppression does not promise automatic recursive JSON patches.

### Local recovery remains App-owned

Framework supplies canonical publication and validated apply boundaries, not
Sim's durable journal/resource-store policy. Proposed local storage direction:
a checkpoint plus ordered publications and separately retained immutable
resources. Ordinary commits append promptly; explicit export materializes the
portable bundle. Checkpoint compaction is storage maintenance, not input debounce.

Before implementation, specify reference/resource acknowledgement, revision
conflicts, interrupted writes, restart replay and old snapshot-project
compatibility. Recovery uses an App validation adapter and existing Core
load/apply contracts, never private History. A raw publication is not a complete
portable project; the current IndexedDB record format needs an explicit evolution
contract. No network backend is needed or proposed for this slice.

### Route dependencies before doing work

A label edit can refresh a list row without preparing body meshes. A pose/source
change must refresh dependent geometry, preflight validity and live inputs. A
rule change can invalidate preflight/current-result status without rebuilding
topology. Archived result bytes stay unchanged when the current model changes.
Place routing before canonical reads and expensive preparation. UI Context
cannot recover work already wasted by a whole-document reader upstream.

## Proposed staged refactor

1. **Prove CUSTOM composition.** Reconcile compose/edit/ui handoffs for channels
   and property/UI projections. Add permanent normal-runtime tests first for
   one Body and one Experiment: initial values, edit/replay, no-op/rollback,
   targeted notifications and cleanup. Keep schemas and the 3D provider. Stop
   if a necessary public facade is missing; any Framework extension needs its
   own bounded contract instead of a private import or parallel mechanism.
2. **Replace broad read consumers.** Move panels and list readers to registered
   UI projections; feed the spatial consumer from the same scoped model owner.
   Retire the global-revision read path only after its consumers pass. Prove
   zero unnecessary workcell capture/history scans/geometry preparation for
   unrelated edits, plus fresh pose, hierarchy, source, selection and lifetime
   invalidation. Preserve full geometry and latest-field edit semantics.
3. **Replace automatic persistence.** Reconcile storage/capture/lifecycle
   contracts for the local journal and resource recovery. Prove ordered
   edit/Undo/Redo persistence, failure/retry/restart and old-project reopening
   before switching writes. Saving A must not cancel later interaction B.
   Explicit export/replacement keeps its intentional stable capture boundary.
4. **Verify the full workflow and remove superseded plumbing.** Run ordinary
   editing/import/analysis/retention/Undo/Redo/reload E2E, synchronized full-source
   visual checks and representative work-count/resource gates. Remove only
   replaced revision buses/adapters/timers. Keep the schema unless measurements
   justify a separately scoped representation change.

Before each production slice, reconcile its exact Inspector/spec contract and
write its Step Execution Card. Current contracts still describe revision-wide
workbench projections and coalesced snapshot saving; this proposal does not
silently amend those executable contracts. No solver, dependency, Preset 3D
extraction, backend, release or M3-M6 implementation is included. Project-name
Undo semantics remain an explicit product decision; preserve current metadata
behavior until decided.

## Follow-up verification

At `cc16f8ce5`, existing permanent suites passed:

- UI Context: 10 tests for registration/aggregation, custom compute typing and reset.
- Core: 26 tests for property definitions, value/record mutation APIs, runtime facades and observer reset.
- Sim: 23 tests for real bootstrap, CUSTOM renderer, canonical editing and body subscriptions.

Logs: `.artifacts/sim-feasibility-{ui-context,core,current-app}.log`. These tests
support capability feasibility and preserved behavior, not completion of the
proposed integration. The normal-caller cases above remain implementation gates.
This follow-up changes documentation only.
