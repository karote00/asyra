---
"@asyra/factory": patch
---

Give fresh transaction producers distinct opaque publication IDs so edits after
reload or from another runtime are not discarded as previously accepted writes.
Existing persisted IDs, replay ordering and compensation links remain supported.
