# Adopt unified direct tool contracts

Pending source changes, 2026-10-28, relative to development commit
`4cf053e7a8626aa3ea67f0f4e393e26812ab4300`. This is not a released-version claim.

Use the registered public tools directly through the provider adapter. Generated
JavaScript forwarding is no longer an App execution route. Provider integrations
must preserve the registered input/output schemas, execution identity, cancellation
and result settlement. The generated Design template follows the canonical App.

Exact discovery and field queries use the existing describe_design_apis owner.
Use its returned execution route and fieldQuery arguments. Exploratory usage is a menu. Exact usage for owners without operation scopes,
and selected scoped usage, include complete standard JSON Schema parameters,
result contracts and recovery for the returned execution route. Examples are
optional; missing examples never remove necessary constraints. Complete usage
can span bounded pages; do not fetch the same fields again once they are present.
Preserve local references and cross-field restrictions. General search, complete
schemas, bounded continuation pages, refresh and explicit retained redisplay remain
available. Do not infer successful coverage from a completed read alone.

For preparation failures, use a complete returned repairGuide only when provided.
Retained parts preserve siblings and parent relationships. Supply corrected values
for the indicated paths; incomplete diagnostics do not authorize guessed repairs.
After partial execution, recover only unfinished work and preserve acknowledged
writes, inspections and valid checks. A successful invocation can record a failed
visual judgment; interpret domain results separately from tool settlement.

Core.allocateIds delegates to the existing registered identity counter without
creating document elements or history. Generated draft keys remain distinct from
document IDs. Computed-field selection limits are exported by Core/contracts.
Preset exposes canonical typography constraints shared with its existing native
validators; consumers must retain type, numeric, enum and whitespace restrictions.
No document migration or new result registry is required.

Selected Knowledge redisplay remains optional and request/session scoped. Follow
[retained information guidance](retained-information-r1.md) for fromResult,
dependencies, overrides, invalidation and read-only recovery. Knowledge consultation
and early visible content are advisory, not mandatory execution stages.

Before integrating, verify real owner success, legal no-op, failure and supported
partial/cancelled cases; execute the delivered examples and recovery arguments.
Preserve history, save/reload and collaboration checks for changed mutation paths.
The local 101 observation does not replace API-specific formal coverage.

## Canonical sources

- [Tool specification](../../../packages/ai-agent-runtime/TOOL_SPECIFICATION.md)
- [Design execution contract](../../ai/apps/asyra-design/specs/ai-execution-flow.md)
- [Design local provider contract](../../ai/apps/asyra-design/specs/local-ai-provider.md)
- [Preset contract](../../ai/framework/packages/preset.md)
- [Core identity allocation](../../../packages/core/src/core.ts)
- [Canonical discovery owner](../../../apps/asyra-design/server/local-operation-tools.ts)
