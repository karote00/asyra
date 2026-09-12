# API surfaces

- `FarmConfiguration`, `DEFAULT_CONFIGURATION`, `validateConfiguration`, and `configurationSite` own editable dimensional inputs and validation.
- `createLayout` and `createStructure` own bay strips, passages, and greenhouse steel members.
- `createDrainProfile` owns the cross-section used by both the 3D projection and the section diagram.
- `createSupportAssembly` and `createPlantingNet` own poles, crossing joints, rails, mesh strands, and cable ties.
- Crop domain APIs own reusable cultivar variants and deterministic planting positions; see the water/crop specification.
- `buildSiteMeshes` returns the configuration's complete engine-neutral scene. View projection only changes visibility and presentation.
- `spatialV0` and capability `farm.spatial.v0` are app-owned render contracts, not a public framework or persistence format. Mesh data must pass `readSpatialDescriptor` before rendering.
- Runtime configuration methods are the only UI write route into Core history. Camera and view operations do not add history entries.

Cross-package imports use public `@asyra/*` facades. Do not import another app's runtime or renderer.

## Robot design APIs

- `RobotConfiguration`, `DEFAULT_ROBOT`, `validateRobot` own the M2 design schema.
- `assessRobotDesign` combines A's necessary lane and energy screens. A missing
  lane is explicit `null`; no alternative lane is chosen. Its immutable `route`
  exposes B's completed positional A input for fresh synthetic survey admission.
  Missing identity or invalid interval makes both route and lane null; D does not
  resolve strip IDs again. The route is not motion clearance.
- `FarmRuntime.getRobot` / `subscribeRobot` expose the current stable read report.
- `patchRobot` dispatches the registered one-shot Feature and merges against the
  latest canonical settings inside the session queue. Failed admission does not
  mutate state or history. Existing `undo` / `redo` replay both document owners.
- `focusRobot` is a presentation-only camera action; it starts no simulation.
- `createRobotModel` and `RobotProjection` produce admitted concept geometry with
  a definition-scoped lifetime. `export-robot-review.mjs` exports the same model
  for optional Blender inspection; exported artifacts are not loaded by the app.

## Canonical scene source

- `CropModel` retains source triangle ownership for fruit body/detail, synthetic
  tomato distal pedicel and later surface hairs; near/distant representations
  preserve the same fruit ID and original geometry/materials.
- `SiteGeometry.prepareScene` composes immutable source metadata, installed plant
  and fruit identities, transforms and the complete pre-visibility scene. Existing
  cultivar and planting outputs are reused; empty populations create no cultivars.
- C source products carry immutable `SourceRegion` partitions of the original
  index buffer. `readSourceRegions` admits complete, ordered, unique ranges and
  detaches mutable callers. `sheet` has no enclosed material; `closed-solid`
  requires source closure evidence; `open-shell` preserves unresolved closure.
  Boxes declare closed regions, while original uncapped tubes, botanical poles,
  hairs/spines and unwelded cylinder seams remain open-shell. Original film,
  foliage and calyx faces are sheets. No triangles, caps or thickness are added.
  `SiteGeometry.primitive` retains shape and regions as one completed product;
  scene, cultivar near/distant, robot rig and installed dock retain that metadata.
  These declarations do not decide ray visibility, origin occupancy or contact.
- `FarmRuntime.getScene` reads that completed source without work;
  `isCurrentScene` rejects a retired source. Canonical farm changes replace the
  revision and disposal closes access. Camera, visibility and robot design changes
  do not rebuild the farm source. Robot definition evidence remains a separate
  owner input for later working-pose integration.
- These APIs are app-local transient geometry handoffs, not a sensor, clearance,
  persisted format or implemented harvesting session. D's adapters own observation
  and swept-motion admission against this source.

## Synthetic working-rig source

- `prepareRobotRig` binds the unchanged robot source to the approved five-joint
  synthetic chain, with rest pivots, tool axes, bounds and rate metadata. It
  rejects an unsupported full lift stroke without altering parked geometry.
- `evaluateRobotPose` returns immutable candidate rigid transforms and tool/chain
  frames. Joint limits are validated atomically; it does not plan reach, advance
  time or admit collision clearance. Source buffers are reused across poses.
- `FarmRuntime.getRobotSource` reads the completed definition product;
  `isCurrentRobotSource` tests its lifetime. `evaluateRobotPose(source, joints)`
  rejects retired handles or unavailable rigs. Definition changes and disposal
  retire source handles; dock, mission, camera and farm edits preserve them.
- D must consume this same source for later IK, approved rate checks, swept
  collision queries and retention. These read APIs start no harvesting motion.

## Installed dock source

- `FarmRuntime.getDockSource` returns the immutable `DockSource` revision and
  installed station meshes also used for rendering. `isCurrentDockSource` checks
  owner-issued handle identity. Dock relocation and disposal retire the handle;
  unchanged placement preserves it across robot definition and mission changes.
- Distinct platform, charger, contacts and exchange stand reuse their original
  admitted shapes. Reads and relocation do not regenerate geometry. Bounds and
  route annotations are not physical station meshes. These APIs admit no support,
  electrical contact or movement clearance.

## Dispatch admission source contracts

- Composition issues a `CanonicalMission` receipt for one completed B/farm/C
  update. `prepareMission` checks receipt/source currentness, detaches canonical
  data and issues an immutable prepared product. Copied prepared products are
  rejected even when they retain an authentic receipt.
- `admitDispatch` validates explicit synthetic evidence at simulation seconds,
  obtains fresh A screens using B's completed route, and requests the required
  dispatch/return movement coverage through an injected query owner. Source
  handles retain C's original identity; no geometry is generated here.
- Evidence validity is [from, until). Query intervals have positive duration,
  end before evidence expiry and preserve dispatch-before-return order. Inputs
  do not renew themselves. Missing/unknown/blocked results hold admission and
  retain reasons; changed currentness during a query rejects the result.
- The returned decision creates no run and is not a physical safety certificate.
  This contract has formal tests using real C products and explicit query doubles;
  the actual swept provider, session clock and normal UI wiring are subsequent
  owners. No default clear provider is installed.

## Session clock foundation

- `HarvestSession` receives a composition canonical receipt and privately prepares
  the mission. `start` accepts only generation-bound dispatch evidence and runs
  admission internally; accepted-result objects cannot start a run.
- Explicit `advance`, `pause`, `resume`, `cancel` and fault acknowledgement own
  transient domain state. Time is in seconds; paused time cannot accumulate as
  active progress. Crossed deadlines coalesce to one pending patrol. Clock changes
  never create physical motion or renew a movement query.
- Resume requires a distinct async provider bound to the current paused snapshot,
  run, pose, held offsets, remaining intent and run-bound evidence. Accepted results
  preserve these values; held/fault/stale results cannot unlock motion. Source
  retirement closes the same generation even after a clock change or provider
  rejection. Cancellation and replacement protect their successor generation.
- `replaceMission` and `dispose` are synchronous internal composition lifecycle
  notifications. Replacement validates before retiring a valid run; the same
  current receipt is a no-op. External queued intents require their generation.
- Reads return the same immutable snapshot, and transitions use immutable links
  rather than copying accumulated history per tick. This foundation has no Core
  transaction, timer, real movement provider or UI session controls. Action-driven
  poses, actual picking/charging and real provider composition remain next.

## Shared query geometry source

- `QueryGeometry.prepare` consumes a composition-issued `GeometryReceipt` binding
  current C scene, robot and dock handles from one update. Required owner predicates
  validate receipt identity and all handles before preparation and publication.
- Its immutable `GeometrySource` shares original near shape buffers, descriptors,
  fruit partitions/plant bindings and robot body ownership. Only farm dimensions
  are removed; robot source contains no route annotation. No source generators run.
- `read` and `placePoint` reject copied/retired products; `clear` retires the product.
  Unchanged current receipts reuse preparation. `placePoint` composes source
  instances before installed descriptor transforms for farm/dock geometry; robot
  parts remain chassis-local and require later session base/joint pose inputs.
- This source API makes no observation, contact-policy, quality or clearance claim.
- `GeometryMesh.prepared` is the immutable completed local shape/non-sheet-region
  bounds product. Shape bounds share original shape identity; region products
  additionally share original region-array identity. `GeometrySource.work` records
  cold source position/index visits. Same current receipt reuses the product;
  replacement, retired reads and clear end its owner-held lifetime. Dynamic ray
  and pose inputs consume it without source-bound preparation.

## Near-source ray evidence

- `RayQueries.query` consumes the issued current `GeometrySource` and a detached
  `RayBatch`: synthetic simulation time/validity, current base/joints, explicit
  leaf source-pose/all-fruit-attached state and bounded finite rays. It advances
  no clock and runs C FK once per batch without source generation.
- Results preserve nearest original mesh/instance/triangle and metre distance,
  within-range miss, or unknown. Region-local source semantics distinguish sheets,
  closed material and unresolved open shells; opacity does not grant passage.
- Hits additionally expose the selected/refined conservative `distanceBounds`;
  the existing `distance` remains its display midpoint. Shared `prepareQueryFrame`
  and `transformQueryDirection` consume admitted rigid inputs and reuse the same
  conservative coefficient inverse without a second camera transform algorithm.
- Geometric unknowns may include one ambiguous triangle or two overlapping
  nearest candidates as immutable representative witnesses, with original source
  identity and conservative distance intervals (or explicit unbounded distance).
  They explain uncertainty without implying exhaustive coverage or clearance.
- Arithmetic bounds cover normalization, inverse placement and predicates;
  finite point inputs alone may use bounded exact dyadic proofs, including exact
  rational nearest ordering. Non-point uncertainty is never replaced by a rounded
  centre. Work counts include source/region preparation and exact predicates;
  source-local bounds come from QueryGeometry's completed product. Ray results
  and world-vertex copies are not cached.
- This geometry evidence is not fruit detection, quality, optical calibration,
  a swept-motion result or an implemented harvesting action/UI workflow.

## Injected target observation admission

- `TargetObservations.admit` consumes a composition-issued `ObservationContext`
  tied to the real HarvestSession snapshot and its actual canonical mission plus
  current GeometrySource. Required context/mission predicates have no permissive
  defaults; composition must prove the run-to-mission relationship.
- `TargetReading` is explicitly `synthetic-injected`, with an assumption label,
  target/run/generation/source revisions and finite explicit validity. Admission
  clones once, validates that snapshot, preserves nulls and returns immutable
  target assumptions only after currentness is rechecked. Valid earlier readings
  can be admitted at the current snapshot without extending their expiry.
- Coverage is a declared visible/total sample count; zero total has no coverage.
  Pose, maturity, target-scoped pedicel/cutsite, corridor and independent
  spine/calyx/contact-damage fields remain assumptions. Source membership checks
  validate identity without filling them from hidden scene truth.
- This helper changes no session, clock, inventory or action state. It rejects
  support/cut/retention/placement confirmations and additional undeclared claims;
  later viewpoint and expected-action owners must provide their own evidence.

## Synthetic viewpoint samples

- `TargetObservations.view` uses the same actual-run context and a
  `synthetic-viewpoint` request at the current snapshot time. Explicit candidate
  IDs, sample count and camera pose/slopes/range are assumptions, not detections
  or hardware calibration. The adapter selects evenly spaced original near
  triangle centroids with a 64-ray computation cap, preserving plant/instance and
  partition identities.
- Each output keeps the requested source sample and actual ray result separate.
  Visible means this computed camera ray hit some surface of the target, not that
  the intended triangle/pedicel is visible. Non-target occlusion requires hit
  upper distance strictly before sample lower distance; rear/overlapping hits and
  misses remain unknown. Requested-point distance encloses endpoint subtraction
  before the norm; frustum eligibility follows the actual computed floating ray.
  Owned result containers are frozen without freezing the composition context.
- Coverage counts only declared samples; no maturity, quality, anatomy or action
  readiness is inferred. Current session base/joints supply the robot pose in the
  existing world-aligned, empty-held/all-attached foundation. Missing leaf or fruit
  state remains unknown. Camera inverse prepares once, eligible rays share one
  batch/FK and completed bounds, and no source or session state is regenerated.
