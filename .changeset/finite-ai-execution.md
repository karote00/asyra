---
'@asyra/factory': patch
'@asyra/core': patch
'@asyra/ai-agent-runtime': patch
'@asyra/flow-inspector': patch
'create-asyra-design-app': patch
---

Expose instance-local transaction admission state and support request-owned finite
mutation executors with explicit settlement evidence. Design can publish drawing
progress, preserve independent user edits and retain completed AI work in one
Undo entry after Stop or failure. Admit App-owned Flow Inspector work scopes and
register the Design execution contract.
Synchronize the generated Design template with the same execution and inspection
contracts.
