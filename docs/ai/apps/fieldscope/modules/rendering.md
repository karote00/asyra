# Rendering module

Domain builders return numeric triangle buffers. Site projection admits these buffers once per configuration and provides stable layer identities. SpatialLayer is the framework adapter; it sends completed descriptors to the app's CUSTOM engine without rebuilding farm geometry.

The engine owns Three.js geometry, materials, lights, meshes, instance matrices, camera and resource disposal. Admission rejects malformed buffers, non-finite transforms and invalid material values. Triangle admission captures accessor values once, directly detaches flat numeric arrays, then validates and freezes the retained snapshot. Frozen admission receipts permit repeated presentation updates without cloning the same accepted geometry. The engine copies accepted values directly into its final owned typed GPU buffers, preserving vertex colors and 16/32-bit indices without a temporary expanded index array.

Repeated crop models use instance transforms. Bounds calculation must include every instance while examining each model's vertices only once per scene measurement. Instance rendering changes neither root placement nor model topology. Configuration replacement updates both geometry and placements; layer and camera changes reuse the accepted scene.

Permanent domain, admission, engine, runtime and browser tests cover these handoffs. Screenshots are rendering evidence, not the authority for dimensions or cultivar placement.

Optional surface maps require UV coordinates on full and distant triangle shapes. Surface admission preserves detached immutable RGBA arrays; SurfaceTextureStore owns shared GPU color/normal maps, reference-counted by base materials. Distant material clones share the same pair under their base object's lifetime. Replacing the last textured object or destroying the engine releases the pair. No texture generation occurs during camera movement.
