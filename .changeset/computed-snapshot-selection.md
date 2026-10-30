---
"@asyra/core": patch
"@asyra/scene-tree": patch
"@asyra/utils": patch
---

Forward computed field selection to the existing snapshot owner before materialization, avoiding full shallow projections for selected reads while preserving detached results, complete reads and fresh local state.
