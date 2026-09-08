---
'@asyra/flow-inspector': patch
---

Add an explicitly authorized local provider adapter behind the operation broker,
with durable request reservations, separate provider usage observations, fail-closed
remote uncertainty, and shared board/API/CLI task state. Preserve candidate
containment and manual source review; live provider acceptance remains separate
from offline adapter contract tests.
