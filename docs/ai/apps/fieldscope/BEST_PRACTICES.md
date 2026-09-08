# Best practices

Judge exact geometry in source-space tests before inspecting rendered screenshots. Review water at a section angle and crops close enough to distinguish leaf shapes, fruit, and attachment points. An overview alone cannot prove those details.

Reuse complete geometry products for their configuration lifetime. Use GPU instances for repeated plants; do not expand thousands of copies into CPU triangle arrays. Prove actual construction counts together with correct invalidation after configuration edits and history operations.

Keep camera movement independent from geometry preparation. Use the existing render scheduler and clean up resources when a scene or runtime is retired.
