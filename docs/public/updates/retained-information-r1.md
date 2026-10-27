# Adopt selected retained information

## Selected retained information - pending integration

Pending source change, 2026-10-27, relative to development commit
`4cf053e7a8626aa3ea67f0f4e393e26812ab4300`; no released-version or deployment claim.
Hosts using the public Knowledge session can opt into exact redisplay when they
already retain full results via `openSession(principal, taskId, { retainResults: true })`.
Use `session.retrieve({ ids, fromResult: previous.contextKey }, signal)` to obtain
selected full text and required dependencies without reading the content provider.
The saved composition's contexts, resolved overrides and order remain authoritative;
explicit different contexts or combining fromResult with reuseFrom/rehydrate reject.
The returned contextKey identifies only the selected composition. Ordinary reads,
caller-held dependency reuse and rehydrate remain separate valid operations.

Asyra Design exposes this through its existing read_knowledge tool. Its existing
describe_design_apis tool returns a request-owned resultKey; use names and fromResult
to redisplay complete selected entries in their saved view/scope. Tool menus and
schema fragments remain incomplete contracts. Purpose search selects candidates;
it never makes a fuzzy match authoritative. No new reader or persistent cache exists.

Preserve host permissions, request isolation, revisions, cancellation and bounded
result lifetimes. Foreign, evicted, disposed or invalidated handles require ordinary
selected-read recovery; never replay a write or capture. Do not persist these keys
in documents or reuse them across tasks. There is no saved-data migration, Feature,
Core, rendering, Undo or collaboration change. Existing calls remain valid.

Verify seven-item reads followed by two-item redisplay, preserved overrides and
shared constraints, zero repeated provider/projection work, partial lookup coverage,
paging, invalidation and read-only recovery. These are local deterministic contracts,
not proof of model adoption. For the next update, retain host-specific permissions
and record selected source revisions and tested recovery; compare installed API
availability before adopting this optional parameter.

## Canonical sources

- [Runtime Knowledge contract](../../ai/framework/packages/ai-agent-runtime.md)
- [Knowledge owner](../../../packages/ai-agent-runtime/src/knowledge.ts)
- [Knowledge query types](../../../packages/ai-agent-runtime/src/knowledge-types.ts)
- [Design read owner](../../../apps/asyra-design/server/local-knowledge.ts)
- [Design discovery owner](../../../apps/asyra-design/server/local-operation-tools.ts)
- [Design execution contract](../../ai/apps/asyra-design/specs/ai-execution-flow.md)
