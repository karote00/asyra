# Architecture

`domain` produces engine-neutral geometry and layout from an admitted farm configuration. `render-app/site-projection.ts` assembles immutable spatial descriptors once for each applied configuration. `render-app/spatial-layer.ts` projects those descriptors through the framework render layer. `engine/spatial-contract.ts` validates and detaches incoming spatial values; `engine/three-engine.ts` owns Three.js objects, camera, GPU resources, and disposal.

`runtime/bootstrap.ts` owns Core initialization, configuration transactions, configuration subscriptions, scene replacement, and teardown. The React workbench composes independent controls and subscriptions. It must not become a second canonical farm model.

## Update boundaries

Completed configuration edits, Undo, and Redo replace the site projection once. Camera motion, layer toggles, film opacity, panel visibility, and unfinished editor input do not rebuild geometry. Runtime-owned SiteGeometry retains admitted cultivar shapes by netTop/netBottom (at most two entries) and repeated cultivation primitives by their complete dimensions (at most 32 entries). The latest envelope, terrain, cultivation and crop projections are independently retained by their scalar dependencies. Plant assignments and admitted instance arrays survive net-only edits; width, strip topology, soil inset and longitudinal planting dimensions invalidate them. SpatialLayer submits changed admitted descriptors only; unchanged shapes and their GPU buffers are reused. Runtime-local weak bounds reuse immutable model extrema while current transforms still determine scene bounds. Changed dependencies invalidate the relevant product; teardown clears retained products. Renderer admission receipts only recognize detached, deeply frozen products; caller identity is not validation.

Crop variants and placements are domain outputs. The renderer consumes completed instance transforms and triangle meshes; it must not decide crop species, spacing, ripeness, or water shape. Camera fitting consumes the bounds of actual instance transforms without expanding every plant's vertices.

There is no framework package modification, robot controller, server, collision engine, or crop damage solver in this app's current architecture.

SceneTree owns the canonical structured settings element and its transaction history. SpatialLayer owns derived 3D output; retained projections are neither editable state nor a second SceneTree. This composition follows the public custom-composition guide rather than copying the design app's 2D schema.

UI language is owned by `ui/i18n/locale.tsx` and its typed message catalogs. Its provider wraps the existing workbench without replacing runtime or configuration ownership. Language-neutral `ConfigurationError` codes/parameters originate in the configuration validator; UI error formatting never parses localized strings. Locale changes bypass site projection, scene admission and history.

## Harvest feasibility domain

The four `domain/harvest-*.ts` modules provide deterministic lane, crate/load,
energy and hazard assessments. They consume existing farm layout/planting-row
owners and explicit observations; they do not create a second farm model,
generate crop meshes, drive animation, mutate Core or command hardware. M1 is
headless and has no UI consumer yet. Reports are necessary engineering screens,
not physical clearance or safety certificates. The [harvest owner flow](/docs/ai/apps/fieldscope/plans/harvest-robot/inspector-flow.md)
owns the boundaries for subsequent mission composition and projection.
