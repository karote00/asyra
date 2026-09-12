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
  lane is explicit `null`; no alternative lane is chosen.
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
