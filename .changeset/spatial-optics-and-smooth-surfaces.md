---
"@asyra/preset": patch
"@asyra/render-engine": patch
---

Support validated optical material controls and authored vertex normals for
spatial assets. Render ordered transparent media while reusing unchanged opaque
color, depth and shadows within a flush. Preserve native rendering for ordinary
scenes and restore render state on errors. Reduce repeated scene submissions
without reducing geometry, resolution or material quality.
