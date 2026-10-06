---
'@asyra/render': patch
'@asyra/render-engine': patch
'@asyra/render-engine-pixi': patch
'@asyra/preset': patch
---

Retain camera transforms and bounded ordered GPU batches for large documents, share equivalent live gradient resources, and use native materials only for eligible opaque convex vectors while preserving canonical geometry and complex fills.

Deliver demanded browser frames without an elapsed-time gate so continuous camera input does not skip alternate render frames.

Avoid unused Pixi wheel hit testing while retaining native navigation input, pointer targeting, and explicit object queries.
