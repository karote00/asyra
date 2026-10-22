---
"@asyra/preset": minor
"@asyra/render": minor
"@asyra/render-engine": minor
"@asyra/render-engine-pixi": patch
---

Use canonical Fill properties and engine-neutral text paint for native text.
Text now supports layered colors, opacity, visibility, and gradients through the
same Fill controls and transactions as other elements. Replace typography
textColor with fills and pass paint to RenderGraphics.text as its second argument.

Migrate saved typography colors to canonical Fill records at browser and backend
load boundaries, preserving colors and subsequent durable property updates.
