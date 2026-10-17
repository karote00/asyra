---
"@asyra/factory": patch
"@asyra/core": minor
"@asyra/scene-tree": patch
---

Preserve complete atomic History member boundaries during grouped replay.
Canonical element creation now carries exact per-element parent and index entries,
so Undo can restore nonadjacent siblings and multiple parents through the same
prepared Scene and Props owners used by ordinary creation.

Keep declared mutation options outside exact raw-data evidence comparison while
retaining stale before/after rejection for live canonical application.
