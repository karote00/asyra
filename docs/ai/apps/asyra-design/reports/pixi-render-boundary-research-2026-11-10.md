# Pixi render boundaries - external research and revised direction

November 10, 2026. Associated task: [Local hierarchy work and projection](../plans/agent-context-and-report-continuity-plan.md#local-hierarchy-work-and-projection).

## Decision

Keep the installed independent Group domains while investigating their submission
cost. The evidence supports their large-subtree benefit, but not using every
logical Group as an optimal batching boundary. The next experiment should isolate
avoidable render-state submissions without changing membership or capture.
No replacement has yet demonstrated all required benefits.

The previous flattened native projection is rejected: it moves work into actual
parent translation and selected-subtree capture. RenderLayer, shared Graphics
contexts, and temporary capture trees do not repair that complete handoff.
Do not proceed from that failed experiment into production architecture changes.

This research changes only this report and the existing plan. No implementation,
test, dependency, renderer preference, benchmark result, or Inspector behavior
changes here. Discovery covered official Pixi guides, tagged/installed sources,
issues and maintainer replies, and four editors' first-party documentation or
public implementation. Findings distinguish observed behavior from proposed work.

## Version and evidence boundary

- Installed Pixi is **8.20.1**; the engine manifest requests `^8.20.1`.
  The official release was published August 26, 2026. Its patch notes concern UBO
  offsets, radial gradients, TextStyle destruction and a dependency update, not
  an atomic retained reparent API. See
  <a href="https://github.com/pixijs/pixijs/releases/tag/v8.20.1" target="_blank" rel="noopener noreferrer">the 8.20.1 release</a>.
- The app does not set a renderer preference. Installed `autoDetectRenderer`
  tries WebGL before WebGPU. The existing browser evidence explicitly records
  WebGL; it cannot establish WebGPU performance.
- Official `8.x` guides and repository development branches are mutable. Version
  claims below were checked against installed modules; editor source references
  are pinned to commits, and their fetched blob identities were cross-checked.
  Context7 was unavailable. Public sources do not expose Figma's complete current
  renderer or prove how it performs this particular reparent/capture operation.
- No new performance measurements were run. Source findings do not constitute a
  measured improvement. Earlier immutable evidence remains in the
  [same-source feasibility report](hierarchy-boundary-feasibility-2026-11-10.md)
  and [small-group report](group-render-domain-benchmark-2026-11-10.md).

## What Pixi actually retains

| Mechanism | Verified behavior and consequence |
| --- | --- |
| RenderGroup | Owns prepared instructions and relative transforms. Moving a stable subtree can avoid updating each leaf; entering its draw domain still submits state. This is the useful installed behavior. |
| Ordinary Container | Supplies parent transforms and membership. Native reparent walks ordinary descendants until a RenderGroup boundary. `reparentChild` preserves world placement, not retained membership cost. |
| RenderLayer | Changes paint ordering while logical parents still own transforms. Removal can detach layer membership. It is not a substitute for Group-local bounds, lifetime or capture membership. |
| GraphicsContext | Shares prepared drawing content. It does not share the complete transform, instruction, hierarchy or selected-capture result. |
| Renderer render/extract | `AbstractRenderer.render` enables a RenderGroup on its target. Rendering formerly ordinary retained roots for capture changes their domain; restoring it also costs work. |
| cacheAsTexture | Trades vector submission for raster texture reuse, with resolution, invalidation and memory costs. It is not the requested retained editable drawing solution. |
| ParticleContainer | Specializes particles, not arbitrary editable vectors, text and effects. Its benchmarks are not evidence for this task. |

The official guidance supports stable scene domains and warns against too many
independent groups. Stable structure does not require frozen coordinates.
Our installed `RenderGroupPipe._addRenderableDirect` breaks the parent batch;
its execution pushes group uniforms, executes instructions and restores state.
Therefore retained preparation and cross-group batching are separate concerns.
Sources:
<a href="https://pixijs.com/8.x/guides/concepts/render-groups" target="_blank" rel="noopener noreferrer">Render Groups</a>,
<a href="https://pixijs.com/8.x/guides/concepts/render-layers" target="_blank" rel="noopener noreferrer">Render Layers</a>,
<a href="https://github.com/pixijs/pixijs/blob/v8.20.1/src/scene/container/RenderGroupPipe.ts" target="_blank" rel="noopener noreferrer">8.20.1 RenderGroupPipe</a>,
<a href="https://github.com/pixijs/pixijs/blob/v8.20.1/src/rendering/renderers/shared/system/AbstractRenderer.ts" target="_blank" rel="noopener noreferrer">8.20.1 renderer</a>.

### A narrower opportunity: state submission

Installed `GlobalUniformSystem.bind` updates projection, world matrix and color
for each domain. WebGL `pop` dirties the restored group. The matrix parser calls
`uniformMatrix3fv` without comparing matrix values; some scalar/vector parsers
already compare values. `GlUniformGroupSystem` tracks dirty IDs per group and
program, which is not the same as knowing the last value installed at a GPU
uniform location.

This makes redundant matrix submission a specific hypothesis, not a generic
request to cache more. Projection values may repeat across domains; world values
may differ. Existing counters do not identify how many values were equal.
Skipping an unchanged object's upload is unsafe when a different domain has
since installed another value. Any proof must own the actual program/location
state, including restoration, capture target changes and context resets.

Relevant installed files under `node_modules/pixi.js/lib/` are
`rendering/renderers/shared/renderTarget/GlobalUniformSystem.mjs`,
`rendering/renderers/gl/shader/GlUniformGroupSystem.mjs`, and
`rendering/renderers/shared/shader/utils/uniformParsers.mjs`.
The versioned
<a href="https://github.com/pixijs/pixijs/blob/v8.20.1/src/rendering/renderers/shared/shader/utils/uniformParsers.ts" target="_blank" rel="noopener noreferrer">matrix parser</a>
provides a reproducible external reference.

Pixi documents systems, pipes and adaptors as extension mechanisms; custom
batchers are classified primarily internal. That does **not** establish a safe
public hook for suppressing stock global-uniform writes. Prove an exact supported
boundary before selecting this implementation. Do not intercept raw GL calls,
override private dirty flags, or edit installed SDK files to claim production
feasibility. If the required change belongs upstream, report that ownership and
keep it separate from an app-level workaround.
<a href="https://pixijs.com/8.x/guides/concepts/architecture" target="_blank" rel="noopener noreferrer">Official extension architecture</a>.

8.20.1 already has `GpuUniformBatchPipe`, which stages WebGPU uniforms together.
It still has separate RenderGroup instruction domains. A same-version WebGPU
probe could help attribute backend submission cost, but cannot prove a WebGL
fix or justify changing production preference. The installed `canBundle = false`
field is not evidence of a usable public retained-render-bundle feature.

### Issues and maintainer advice, with version applicability

| Source | Evidence | Decision for this project |
| --- | --- | --- |
| <a href="https://github.com/pixijs/pixijs/issues/10353#issuecomment-2012504952" target="_blank" rel="noopener noreferrer">10353 - maintainer GoodBoyDigital</a> | Recommends RenderGroup for a crowded stable subtree; the reporter later corrects an unfair particle/ordinary-container comparison. | Supports the retained-domain mechanism; does not endorse one domain per logical Group. |
| <a href="https://github.com/pixijs/pixijs/issues/10377#issuecomment-2091839159" target="_blank" rel="noopener noreferrer">10377 - maintainer response</a> and <a href="https://github.com/pixijs/pixijs/pull/10505" target="_blank" rel="noopener noreferrer">10505</a> | Old recursive removal overhead was addressed by separating owned/parent domains and removing an unused child registry. Those concepts are already in installed 8.20.1. | Do not cite an early-v8 fix as a missing solution to our present work counts. |
| <a href="https://github.com/pixijs/pixijs/issues/11409" target="_blank" rel="noopener noreferrer">11409</a> and <a href="https://github.com/pixijs/pixijs/pull/12030" target="_blank" rel="noopener noreferrer">12030</a> | Upstream fixed cached batchers surviving InstructionSet destruction. PR merged September 8, after 8.20.1. Installed BatcherPipe/InstructionSet lack the new destruction hook. | Relevant lifecycle risk for transient domains. It is not proof that our measured slowdown was a leak. No upgrade or repair is authorized here. Future repeated-domain evidence must account for retained resources. |
| <a href="https://github.com/pixijs/pixijs/issues/11789" target="_blank" rel="noopener noreferrer">11789</a> | Requests a custom-render hook after transforms. Maintainer acknowledges the request; that is not an implemented hook. | Keep the explicit accepted-state flush barrier; do not invent an available callback. |
| <a href="https://github.com/pixijs/pixijs/issues/12048" target="_blank" rel="noopener noreferrer">12048</a> | Reporter describes Graphics mutation trouble and proposes flattening/recreation. The inspected discussion has no maintainer endorsement of that workaround. | Not evidence that our tested mutation path is broken, and not permission to destroy/recreate live objects. |

## Other editors: transferable principles and limits

| Editor | Logical groups, rendering and local export | What transfers |
| --- | --- | --- |
| tldraw | Shapes retain parent IDs. `DefaultCanvas` maps a rendering list to sibling Shape components; each Shape obtains a page transform, clipping and inherited opacity. Image export gathers selected shapes, creates a temporary SVG React/DOM tree, then optionally rasterizes it. | Separate document ownership from display ordering and maintain explicit transform dependencies. Its export materialization and per-shape page transforms do not prove cheap capture or constant-cost parent motion for our 25,000-leaf case. |
| Penpot | Current WASM documentation distinguishes the shape tree, tile/shape indexes, cached tile images and live GPU surface composition. Vector PDF uses another composition path over shared shapes/primitives, with documented parity gaps. | Explicit invalidation ownership and shared paint semantics are valuable. Tile screenshots cannot isolate a logical subtree when outside shapes overlap. Rebuilding vector export or switching to Skia is not a free Pixi capture solution. |
| Excalidraw | Group helpers use `groupIds` on elements. Export prepares the selected elements and calls the static scene renderer on another canvas. | Logical grouping need not imply a GPU domain. Its selection-group model is not our parent-coordinate contract; its export redraw has a cost, rather than reusing arbitrary retained Pixi subtrees. |
| Figma | Public engineering material describes a custom graphics interface, explicit draw arguments and lazy WebGL binding updates, then WebGPU support. Performance research separately covers local/remote changes and hardware differences. | Compare actual state at the rendering owner, and measure complete operations. Public articles do not reveal enough to assert Figma's exact Group-to-GPU mapping or selected-subtree capture implementation. |

Pinned editor sources inspected:

- tldraw `b2ae992ffe32148e8109f27e4f5fd42b72e784d3`:
  <a href="https://github.com/tldraw/tldraw/blob/b2ae992ffe32148e8109f27e4f5fd42b72e784d3/packages/editor/src/lib/components/default-components/DefaultCanvas.tsx" target="_blank" rel="noopener noreferrer">DefaultCanvas</a>,
  <a href="https://github.com/tldraw/tldraw/blob/b2ae992ffe32148e8109f27e4f5fd42b72e784d3/packages/editor/src/lib/components/Shape.tsx" target="_blank" rel="noopener noreferrer">Shape</a>, and
  <a href="https://tldraw.dev/sdk-features/image-export" target="_blank" rel="noopener noreferrer">official export documentation</a>.
- Penpot `2e6c799bba85aa8ec2cab19daa5fe6b2d5ea482d`:
  <a href="https://github.com/penpot/penpot/blob/2e6c799bba85aa8ec2cab19daa5fe6b2d5ea482d/render-wasm/docs/rendering_architecture.md" target="_blank" rel="noopener noreferrer">live/vector architecture</a> and
  <a href="https://github.com/penpot/penpot/blob/2e6c799bba85aa8ec2cab19daa5fe6b2d5ea482d/render-wasm/docs/tile_rendering.md" target="_blank" rel="noopener noreferrer">tile rendering</a>.
- Excalidraw `701b901a0f1ba3d0b390d9cdf63d112e25abac4b`:
  <a href="https://github.com/excalidraw/excalidraw/blob/701b901a0f1ba3d0b390d9cdf63d112e25abac4b/packages/element/src/groups.ts" target="_blank" rel="noopener noreferrer">group helpers</a> and
  <a href="https://github.com/excalidraw/excalidraw/blob/701b901a0f1ba3d0b390d9cdf63d112e25abac4b/packages/excalidraw/scene/export.ts" target="_blank" rel="noopener noreferrer">export renderer</a>.
- Figma:
  <a href="https://www.figma.com/blog/figma-rendering-powered-by-webgpu/" target="_blank" rel="noopener noreferrer">WebGPU and explicit graphics state, September 2025</a>,
  <a href="https://www.figma.com/blog/keeping-figma-fast/" target="_blank" rel="noopener noreferrer">performance methodology, August 2023</a>.

## Reconcile with our measurements and owner boundaries

The same-source real-101 confirmation moves four roots with 25,491 descendants;
the scene has 25,539 visible leaves. Reparent completion improves **56.90 to
10.90 ms** with independent domains. Actual parent translation improves **14.80
to 1.40 ms**. Ordinary redraw CPU remains 0.20 ms and GPU is 0.611 versus 0.607 ms.
The historical 155.726 ms provider grouping call contains other work and is not
the rendering baseline.

For 1,000 Groups with four vectors each, independent domains increase redraw CPU
**1.95 to 2.60 ms** and GPU **0.248 to 0.592 ms**, measured in separate passes.
Draws remain 1,000; matrix submissions rise from 2 to 2,000. These are small
absolute steady-frame costs alongside a large-subtree benefit, not proof that
the whole app became slower. Do not add CPU and GPU medians from different passes.

Our ordinary baseline already breaks batches: empty Group Graphics default to
`batchMode = 'no-batch'`. Therefore unchanged draw counts do not prove that
RenderGroup boundaries are free. Conversely, replacing Groups with Containers
is not an established fix: independent domains still submit state, and
`PixiBatchPartitions` starts its existing 128-child partition path for Containers
while excluding Graphics/Mesh. A representation change could silently activate
a different size heuristic. The proposed work must not do that.

| Owner | Current handoff | Required consequence |
| --- | --- | --- |
| Core/Preset | Group creation, membership and coordinate compensation can produce separate accepted batches before commit. | A read between them sees the accepted intermediate state. Do not wait for commit or predict final compensation. |
| Render SceneTree | Canonical identity, parent/order and opaque engine handles; commands project the accepted structure. | Retain identities and propagate independent child edits even when a parent's final world matrix is unchanged. |
| Pixi adapter | Native hierarchy/domain membership and prepared graphics; official invisible Groups use independent domains. | Submission optimization belongs here or in the SDK, not in AI hints or duplicate canonical state. |
| Bounds/capture | Render flushes accepted work; adapter reads native local bounds and extracts the target. Text resolution is temporarily adjusted/restored. | Keep exact membership and coordinates. Include preparation, restoration, resource lifetime and the next live frame in cost. |

Direct implementation references: `packages/preset/src/components/group.ts`,
`packages/preset/src/subscriptions/data-channel.ts`,
`packages/render/src/stores/scene-tree.ts`,
`packages/render/src/layers/scene/render-layer.ts`,
`packages/render/src/types/render-object.ts`, `packages/render/src/render.ts`,
`packages/render-engine-pixi/src/pixi-render-engine.ts`, and
`packages/render-engine-pixi/src/pixi-batch-partitions.ts`.

The prior 4,000-leaf prototype confirms the capture constraint: four-root capture
completion is 1.80 ms with independent domains, 7.75 ms with temporary shared-context
Graphics and 4.60 ms with direct-root capture plus restoration. Direct capture
registers 8,000 leaf memberships; temporary assembly creates 4,004 Graphics even
on repeated capture. These synthetic values are not the real-101 timing.

## Revised experiment and decision points

1. **Attribute submission cost on 8.20.1.** Extend only the permanent engine/browser
   probe: count domain entries, instruction rebuilds, matrix uploads by semantic
   role, consecutive equal values at the same program/location, buffer uploads
   and live resources. Compare empty Graphics and structural Container carriers
   in an isolated SDK fixture with domain policy held fixed, without activating
   app partition heuristics. Use existing small and retained-101 fixtures; do not
   rerun AI drawing. Report instrumentation separately from timed runs. This
   determines whether state submission, batch breaks or another owner dominates.
2. **Prove the smallest supported change.** Prefer elimination of demonstrated
   redundant submissions while preserving native identities, domains and capture.
   First establish the supported SDK/engine insertion point. Test different
   sibling matrices, nested groups, shader changes, alpha/tint, target changes,
   context reset, and mutable matrix objects. Compare exact numeric state, not
   object identity or epsilon geometry. If the SDK does not expose the required
   boundary, stop that candidate and identify an upstream change; do not patch
   private state. An optional same-version WebGPU comparison is attribution only,
   not a backend migration or acceptance substitute.
3. **Prove the complete handoff.** For a passing candidate, verify accepted-state
   reads, true parent motion, independent child edits, painter order, visibility,
   history/replay and exact partial capture, including overlapping outside shapes,
   representative vector/text/image/effect content, cold/repeated capture and
   post-capture live rendering. No extra capture tree, retained duplicate geometry,
   hidden domain promotions or delayed query work. Resolve the Inspector's
   committed-only wording against the already measured accepted-batch contract
   before any production handoff change.
4. **Admit only measured end-to-end benefit.** Reuse reversed-order same-source
   blocks and original correctness oracles. Preserve the four-root reparent and
   translation benefit, improve the identified small-group cost beyond measurement
   noise, and avoid moving work to query/capture, cleanup or later frames. If the
   small change is insufficient, retain the installed policy and document its
   absolute tradeoff. A custom retained display-list/batcher is a separate design
   proposal requiring a complete mixed-paint and capture model, not an automatic
   continuation of this task.

The first experiment does not promise that all 2,000 uploads are redundant, that
custom extension registration alone solves the problem, or that a Container
carrier removes independent-domain overhead. No group-size threshold, raster
replacement, private SDK patch, second canonical tree or backend switch is part
of the selected direction. Each future phase requires focused tests and review;
no full-local or release gate is needed for this research update.

## Review outcome

The plan now separates an established mechanism (retained domains), an identified
cost (domain/state submission), and an unproven improvement (safe state deduplication).
It preserves prior failures as evidence rather than compatibility paths, and
keeps external editor export costs visible. This research is complete within the
stated scope; a production optimization remains unproven. Documentation links,
version applicability and current-owner references were reviewed. No new runtime
or performance success is claimed.
