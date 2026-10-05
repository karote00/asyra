---
'@asyra/render': patch
---

Prepare invariant gradient inputs once per rasterization and reuse sampling scratch
values, preserving exact pixels and raster dimensions while avoiding per-pixel
configuration work and allocations.
