# Rendering module

Domain builders return numeric triangle buffers. Site projection admits these buffers once per configuration and provides stable layer identities. SpatialLayer is the framework adapter; it sends completed descriptors to the app's CUSTOM engine without rebuilding farm geometry.

The engine owns Three.js geometry, materials, lights, meshes, instance matrices, camera and resource disposal. Admission rejects malformed buffers, non-finite transforms and invalid material values. Frozen admission receipts permit repeated presentation updates without cloning the same accepted geometry.

Repeated crop models use instance transforms. Bounds calculation must include every instance while examining each model's vertices only once per scene measurement. Instance rendering changes neither root placement nor model topology. Configuration replacement updates both geometry and placements; layer and camera changes reuse the accepted scene.

Permanent domain, admission, engine, runtime and browser tests cover these handoffs. Screenshots are rendering evidence, not the authority for dimensions or cultivar placement.
