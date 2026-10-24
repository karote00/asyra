# Rendering module

Domain builders return numeric triangle buffers. Site projection admits new buffers once and provides stable layer identities. Runtime-owned SiteGeometry retains cultivar shapes by netTop/netBottom and cultivation primitives by tube displacement/diameter, clip axes/normal/diameters, or tie radius. Retention is bounded to two cultivar sets and 32 primitives and cleared on runtime disposal. `@asyra/preset/spatial` owns the shared SpatialLayer; the App wrapper selects its layer name and converts admitted App placements; it sends completed neutral descriptors to the app's CUSTOM engine without rebuilding farm geometry.

The engine owns Three.js geometry, materials, lights, meshes, instance matrices, camera and resource disposal. Admission rejects malformed buffers, non-finite transforms and invalid material values. Triangle admission captures accessor values once, directly detaches flat numeric arrays, then validates and freezes the retained snapshot. Frozen admission receipts permit repeated presentation updates without cloning the same accepted geometry. The engine copies accepted values directly into its final owned typed GPU buffers, preserving vertex colors and 16/32-bit indices without a temporary expanded index array.

SpatialLayer retains the last admitted descriptor per mesh and skips unchanged property submissions. Configuration projection independently retains the latest envelope, terrain, cultivation and crop outputs, plus base geometry and grouped cultivar placements, under their explicit dependencies. Repeated crop models, supports, net strands, cable ties and spring clips use instance transforms with unchanged canonical topology and material. Bounds calculation must include every instance while examining each model's vertices only once per scene measurement. Instance rendering changes neither root placement nor model topology. Configuration replacement updates placements and only regenerates shared shapes whose dependencies changed; layer and camera changes reuse the accepted scene.

Permanent domain, admission, engine, runtime and browser tests cover these handoffs. Screenshots are rendering evidence, not the authority for dimensions or cultivar placement.

Optional surface maps require UV coordinates on full and distant triangle shapes. Surface admission preserves detached immutable RGBA arrays; SurfaceTextureStore owns shared GPU color/normal maps, reference-counted by base materials. Distant material clones share the same pair under their base object's lifetime. Replacing the last textured object or destroying the engine releases the pair. No texture generation occurs during camera movement.

Detail selection reuses completed full/distant instance matrices while admitted instances, geometry, maxError, world transform, camera projection/view, viewport height/DPR and pixel-error policy match. A real dependency change recomputes culling/detail; visibility changes must not expose stale matrices. Instance buffers for detailed crops are written by the detail pass only, avoiding an immediately overwritten full-instance upload. Weak per-mesh entries expire with their owner. The runtime owns a shared SpatialBoundsOwner lifetime. Only admitted shape receipts retain local extrema; mutable caller data is admitted afresh. Current instance yaw/translation and mesh quaternion/translation are always included through transformed local-bound corners. Runtime disposal clears the owner.

The CUSTOM engine advertises only its implemented object, graphics, interaction,
resource and spatial capabilities. The optional framework snapshot query is not
supported and fails with UnsupportedRenderEngineCapabilityError before projection
or drawing. Adding a framework capability does not opt this engine into it.

Camera navigation and flight consume Preset's pure spatial camera controls.
The App retains its mode presets, 1.5 reference aspect / 150-degree FOV cap,
24px framing padding, gesture sensitivities, optical zoom limits and movement
speed. Runtime Features publish camera-only output; controls never read canonical
site data or rebuild its geometry. Bounds selection and reference-camera zoom
percent remain App policy.

The App admission owner retains yaw-based domain placements for existing source,
ray and collision consumers. It produces paired immutable neutral projection
receipts once, with IDs derived from the App placement key and duplicate ordinal,
quaternion rotation and the existing explicit shadow policy. Repeated projection
and bounds consumers reuse those receipts without cloning placements. No renderer
format is fed back into source evidence. The App retains rigid mesh and yaw-only
placement admission; neutral scale support does not broaden solver inputs. The engine wrapper supplies the existing
daylight colors, intensities, positions and shadow range explicitly; the generic
Preset engine does not choose FieldScope styling.
