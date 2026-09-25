---
"@asyra/render-engine-pixi": patch
---

Keep native text crisp at canvas zoom by updating bounded raster resolution from
pixel density and inherited scale. Coalesce updates and release owned text tracking.

Use target-relative text density for bounded snapshots independently of viewport
zoom, restoring screen density on both successful and failed extraction.
