---
'@asyra/ai-agent-runtime': minor
---

Require a shared immutable tool descriptor with output schema, revision, effects, resources and lifecycle. Add host-validation middleware and explicit execution/settlement outcomes that retain rejected output evidence without replaying actions.

Persist diagnostic records through a host-owned outbox, resume delivery independently of product execution, and acknowledge Node collection only after durable checkpoints. File collectors recover matching persisted prefixes after restart. Hosts adopting record delivery must supply durable outbox storage and close it after delivery-host disposal.
