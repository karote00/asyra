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
