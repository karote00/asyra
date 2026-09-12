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
