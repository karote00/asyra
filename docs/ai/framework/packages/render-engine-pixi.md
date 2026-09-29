# Package: @asyra/render-engine-pixi

## Responsibility

Default Pixi implementation of the `@asyra/render-engine` contract. This is the
only package that owns Pixi SDK imports and concrete Pixi runtime objects.

## Owns

- Pixi `Application`, surface, root container, graphics, mesh, ticker, and
  event lifecycle;
- abstract command/query translation behind opaque handles;
- graphics, mesh geometry, viewport, resize, hit-test, and flush execution;
- gradient, raster-pattern, texture, and other concrete resource translation;
- normalized pointer events returned through the abstract contract;
- cleanup after complete or partial initialization.

## Must Not Own

- imports from `@asyra/render`;
- framework state subscriptions, layer ordering, or render strategies;
- framework target-id mapping;
- product feature decisions or app-domain interaction policy;
- custom-engine introspection or fallback routing.

## Public Surface

- `PixiRenderEngine implements RenderEngine`;
- `createPixiRenderEngine(): RenderEngine`.

For profile `2D`, Preset passes `createPixiRenderEngine` through
`core.setRenderEngineProvider(...)`. The Core-owned Render invokes that
provider during `core.start(...)`, creates one fresh engine, and owns its
runtime cleanup. Profile `CUSTOM` receives no provider from Preset. The
catalog's `presetEngineId` is diagnostic metadata, not a dynamic-import or
package-resolution path.

## Execution Contract

1. `initialize(...)` creates the Pixi application, canvas/input target, and
   root object handle. The result forwards that owned `Application` only as the
   contract's `unknown` runtime identity for legacy renderer-instance access.
2. `execute(...)` translates engine-neutral object, hierarchy, draw, resource,
   viewport, resize, and flush commands.
3. `query(...)` resolves bounds, coordinate conversions, and hit testing
   without exposing Pixi objects.
4. Pixi pointer events are normalized to `RenderEngineInteractionEvent` and
   returned with an opaque target handle.
5. Framework frame scheduling uses one engine-owned standalone Pixi `Ticker`
   for the engine lifetime. It never registers with or starts
   `Application.ticker`, so Pixi auto-render cannot bypass Render's dirty gate.
   A frame callback only returns its timestamp; only the explicit abstract
   `flush` command invokes `Application.render()`.
6. `requestFrame(...)` owns one one-shot scheduling slot. It consumes and
   removes the active callback before invocation; `cancelFrame()` removes a
   pending callback and stops the owned ticker without reallocating it between
   demanded frames. `destroy()` then destroys the ticker, releases all owned
   objects/resources
   (including engine-created mesh geometry while preserving shared textures),
   destroys the application, and returns deterministic cleanup counts.

Snapshot extraction encloses fractional local bounds in an integer frame before
Pixi rasterization, normalizing machine-precision noise at integer boundaries.
The resolution budget and returned bounds use that same frame. This prevents
fractional content from being truncated and keeps image coordinates consistent
with review metadata, without changing the target or viewport.

Unsupported capabilities and initialization failures do not emit fallback
surface output or a successful ready result.

Raster-pattern descriptors map source texels into normalized object bounds:
`scale: { x: 1 / width, y: 1 / height }` covers one complete object. The Pixi
adapter uses local texture space and converts texel scale into normalized
texture scale exactly once. Procedural gradients use the same mapping. This
preserves the vector contour's alpha and gradient across object sizes and zoom;
source texture dimensions and canonical geometry are unchanged.

## Dependency Boundary

- depends on `@asyra/render-engine` and `pixi.js`;
- does not depend on `@asyra/render` or another framework runtime package;
- non-render packages and apps do not import this package directly in the
  default composition path.

## Validation

- the shared `runRenderEngineContract(...)` adapter runs against
  `PixiRenderEngine`;
- package-boundary tests reject `@asyra/render` imports;
- Pixi-specific tests cover lifecycle, commands, interactions, mesh/property
  updates, resource translation, application-ticker isolation, explicit
  single-flush rendering, and deterministic cleanup.
