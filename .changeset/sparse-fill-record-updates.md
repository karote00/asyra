---
'@asyra/preset': patch
---

Preserve omitted Fill fields when applying partial record updates. Fill creation
still uses the registered component defaults; updates no longer reset unrelated
colors, opacity, visibility, or gradient data.
