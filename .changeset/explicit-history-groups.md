---
'@asyra/factory': patch
'@asyra/core': patch
'@asyra/reactive-events': patch
'@asyra/scene-tree': patch
'@asyra/preset': patch
'@asyra/flow-inspector': patch
---

Add explicit start/update/end history groups that preserve finite transaction
publication while sealing successful members into one Undo entry. Preserve
ordinary interleaved editing, remote applies and ordered Undo/Redo; expose
advisory counts without imposing limits. Publish accepted Scene Tree batches to
the local Render projection before dependent hierarchy mutations, without
replaying delayed shared echoes or exposing per-field UI updates.

Allow CI aggregation to reuse successful earlier-attempt evidence for the same
workflow run, source revisions and selected checks. Latest dependency failures
still block completion; foreign, future or mismatched evidence remains invalid.
