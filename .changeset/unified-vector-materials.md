---
'@asyra/core': patch
'@asyra/preset': patch
'@asyra/render': patch
'@asyra/render-engine': patch
'@asyra/render-engine-pixi': patch
'@asyra/flow-inspector': patch
---

Render vector fills through shared topology and batched analytic GPU materials,
removing area-dependent CPU color rasterization from document loading. Preserve
editable source geometry, holes, fill order and retained paint/geometry lifetimes.
Unify angular and diamond gradients with their control-point definitions; older
nonlinear fills can change where the previous rendering routes disagreed.
Expose the neutral material capability and synchronize the render flow contracts.
