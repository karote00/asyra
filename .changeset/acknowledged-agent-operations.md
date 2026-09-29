---
"@asyra/ai-agent-runtime": patch
---

Support sequential provider-driven prepared batches with canonical execution
receipts inside one invocation transaction. Recheck permission for each batch,
refresh context after execution, reject duplicate or retired batches, prevent
retries after execution starts, and roll back the invocation on fatal failure.
