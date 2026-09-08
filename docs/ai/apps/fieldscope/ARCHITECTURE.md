# Architecture

`domain` produces engine-neutral geometry and layout from an admitted farm configuration. `render-app/site-projection.ts` assembles immutable spatial descriptors once for each applied configuration. `render-app/spatial-layer.ts` projects those descriptors through the framework render layer. `engine/spatial-contract.ts` validates and detaches incoming spatial values; `engine/three-engine.ts` owns Three.js objects, camera, GPU resources, and disposal.

`runtime/bootstrap.ts` owns Core initialization, configuration transactions, configuration subscriptions, scene replacement, and teardown. The React workbench composes independent controls and subscriptions. It must not become a second canonical farm model.

## Update boundaries

Configuration Apply, Undo, and Redo replace the site projection once. Camera motion, layer toggles, film opacity, panel visibility, and unfinished editor input do not rebuild geometry. Scene geometry remains valid for the owning configuration lifetime and is retired on replacement. Renderer admission receipts only recognize detached, deeply frozen products; caller identity is not validation.

Crop variants and placements are domain outputs. The renderer consumes completed instance transforms and triangle meshes; it must not decide crop species, spacing, ripeness, or water shape. Camera fitting consumes the bounds of actual instance transforms without expanding every plant's vertices.

There is no framework package modification, robot controller, server, collision engine, or crop damage solver in this app's current architecture.
