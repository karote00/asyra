# Tool Specification

Status: Common contract foundation implemented; composition and library lifecycle remain proposed.

This specification is owned by `@asyra/ai-agent-runtime` and applies equally to
primitive and future composed tools. The remaining implementation is tracked by the
[Reusable Tool Composition plan](../../docs/ai/framework/plans/reusable-tool-composition-plan.md).
Exported types and formal tests are the authority for the implemented foundation.
The recipe, library and model-acquisition sections below describe subsequent PRs.

## One canonical contract

One registered tool definition supplies discovery, invocation, validation and
storage projections. Do not keep separately authored copies for basic tools,
composed tools, each model provider or the reusable-tool library.

The following are semantic requirements, not finalized TypeScript field names:

| Section     | Required meaning                                                                                       | Primary consumer                                    |
| ----------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Identity    | Stable registered identity, display name where useful, contract revision                               | Registry, discovery, persistence                    |
| Description | Purpose, applicability, limitations and parameter/result meaning                                       | Model and developer                                 |
| Input       | Executable schema, required/optional fields, units and coordinate/reference semantics where applicable | Admission, composition validator, model             |
| Output      | Executable successful-result schema, including typed artifact references when used                     | Host validator, downstream tools, model when needed |
| Outcomes    | Explicit successful, failed, partial or unknown-settlement semantics, with actionable errors           | Runtime and caller                                  |
| Execution   | Registered implementation or declarative composition recipe                                            | Host executor through Runtime invocation            |
| Effects     | Read/prepare/mutation/external effects and declared resource access                                    | Host scheduling and authorization                   |
| Lifecycle   | Cancellation, settlement, artifact lifetime and supported recovery behavior                            | Runtime and host                                    |

Reuse the existing canonical operation identity; do not require a new UUID merely
because tools are persisted. Human display names and per-invocation call IDs are
not tool identity. A qualified provider name is an adapter mapping to that identity.

Every tool follows the same sections. Values differ by actual behavior: a read-only
tool has no mutation settlement, while a mutating tool must declare its real
settlement/recovery contract. The absence of proven retry safety never means a
write can be repeated automatically. Optional extensions apply where meaningful;
authors do not fill irrelevant boilerplate merely to make descriptions longer.

## Common contract foundation

The PR 1 contract exposes `AiToolContract`: canonical name, description, positive
integer revision, input and successful-output schemas, effect, resource names and
lifecycle. Schema validation is supplied by the host's existing schema authority;
Runtime does not substitute a weaker validator. The same immutable descriptor is
used for lookup and invocation. A compact provider projection includes only name,
description and input schema. Obtaining that projection does not grant execution.

The host classifies an observed result as success, partial, failed or unknown and
reports settlement separately as not-started, completed, partial or unknown.
The installed middleware or native invocation adapter validates successful and
partial values against the declared output schema using the host validator.
An invalid output preserves the actual value and settlement, reports the precise
validation issue and is never silently reclassified as a successful tool result.
A thrown host validator is also an explicit validation failure. Classification is
not inferred from truthiness, HTTP success or an empty object. Runtime does not
retry execution during validation. Failed and unknown receipts remain actionable
without pretending they satisfy the successful-result schema.

Registration rejects empty identity/description, invalid revision, non-JSON schemas,
unknown effects or lifecycle values and invalid resource names. Descriptors are
recursively detached and frozen, including schemas and arrays. Schema semantics
remain the host validator's responsibility. Definitions must provide real schemas;
a permissive placeholder does not establish a composable result contract.

Acceptance covers nested mutation isolation, malformed registration, compact
projection, false/empty successful values, partial values, unavailable results,
unknown settlement and a throwing validator. Design adapters must additionally
prove their actual operation-specific result shapes and outcomes before PR 1 closes.

Design keeps a shared canonical effect declaration for browser action definitions
and native wrappers. A read or selection operation must not become a document
mutation merely because it passes through a generic executor. Actual host scheduling
and permission policy retain authority; metadata grants no permission.

Polymorphic getter values and transport receipt contents may have an explicitly
opaque leaf (`true`) inside an otherwise validated receipt. Such a leaf does not
prove a typed downstream binding. Recipe composition must obtain an owner-specific
schema or reject a binding that requires unknown structure; it cannot infer fields
from a successful example. PR 1 does not implement that recipe validator.

## Execution variants

- A primitive resolves to the host's registered implementation.
- A composition resolves to a validated, bounded sequence of registered tools and
  typed bindings. Its common identity, schemas and description use the same fields
  as a primitive. Only its implementation payload and dependency evidence differ.

Both use the same registry and invocation boundary, input/output checks, causal
records and host permission rules. Compound declarations cannot override the
effects or authorization of their leaves. Runtime checks the expanded dependency
graph rather than trusting a model-authored claim that a recipe is read-only.

A composition coordinator enters validation and causal invocation but does not
hold a host scheduler barrier while awaiting its children. Actual leaf/domain
calls acquire scheduling resources through the secured host executor. This applies
to nested compositions as well; the host retains authorization, cancellation and
resource ordering without a second queue or a parent-child scheduling deadlock.

## What is saved

Persist the shared serializable descriptor once, plus the composition recipe,
dependency revisions and scoped validation evidence. Native function bodies are
not JSON; primitive implementations remain in host code. Loading a composition
resolves its dependencies against the current registered implementations.

Keep execution receipts and diagnostic payloads separate from the definition.
Document IDs, live target handles, credentials, current permissions and prior
selection are per-run context, not reusable defaults. An unchanged recipe still
receives fresh per-run admission and current host checks.

## What the model sees

Compact discovery exposes identity, purpose, applicability and enough effect/input
information to choose. Selected-tool retrieval exposes precise input requirements,
result meaning and requested usage/schema detail. Full schemas remain retrievable.
Execution returns a bounded result or a resolvable artifact reference. Returned
references retain caller/request ownership before a child invocation cleans up
its private intermediates. Completion cannot release borrowed inputs or sibling
leases. Explicit owner release or request termination cleans up exported request
artifacts; revision/permission invalidation still applies, and references never
become cross-request reusable recipe data.

Dependency digests, storage locations, historical validation runs and internal
delivery bookkeeping remain host metadata unless a specific recovery requires
them. More host metadata must not become a larger prompt on every call.

Provider projections come from the canonical contract. Map only supported fields;
retain richer validation at the host. Input-constrained generation does not prove
tool choice, successful execution, output validity or fulfillment of the request.
Descriptive annotations do not grant authority.

## Embedded AI authoring lifecycle

The model learns the construction interface through an ordinary registered
submission tool and scoped discovery, not by reading this Markdown file or loading
a local developer skill. Its input schema defines the required proposal fields:
purpose/interface, exact step identities, typed input/result bindings and the
retrieved contract revisions. Its output schema defines admitted candidate receipts
and structured correction issues. Full construction detail remains retrievable.

The proposal becomes the common registered descriptor through admission. The host
derives identity/revision, dependency schemas, effects and lifecycle constraints;
AI supplies intent and parameter/binding choices, not self-authored authorization
or validation evidence. The normal registry stores the resulting definition once.

Admission failure returns the offending step/path, expected contract, actual issue
and supported recovery. A corrected proposal is fully revalidated. Submission
identities distinguish retrying the same content from changing a revision; neither
registration nor its retry executes the composed operations.

An admitted candidate can be explicitly invoked by its creating request through
the already advertised registered-operation dispatcher. Native providers need not
support adding a new tool declaration midway through a turn. Successful execution
and applicable checks promote the exact revision; durable storage acknowledgement
establishes cross-request availability. Candidate, executing, successful and saved
are distinct meanings, not interchangeable success claims.

Composition-aware lookup/dispatch must be implemented and verified before exposing
submission. Registry/library control-plane tools cannot be recipe dependencies;
their canonical eligibility metadata enforces this without a separate tool format
or hard-coded name list.

Saving retries do not repeat document writes. Restart loads validated definitions
without executing them; saved candidates do not become eligible without evidence.
Current dependencies and fresh arguments are checked again on reuse. The plan's
handoff section owns the detailed implementation sequence and failure cases.

## Relationship to external tool protocols

Reviewed on 2026-10-11:

- <a href="https://developers.openai.com/api/docs/guides/function-calling" target="_blank" rel="noopener noreferrer">OpenAI function calling</a>
  defines function name, description, input parameters and strictness. Its ordinary
  function-result payload does not impose this proposed host output contract.
- <a href="https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools" target="_blank" rel="noopener noreferrer">Claude tool definitions</a>
  use name, description and input schema; applicable optional examples illustrate
  invocation. Useful descriptions explain when to use a tool and its results.
- <a href="https://modelcontextprotocol.io/specification/2025-11-25/server/tools" target="_blank" rel="noopener noreferrer">MCP tools, revision 2025-11-25</a>
  include input schema, optional output schema, display metadata and behavior
  annotations. The protocol distinguishes structured outputs and tool errors.

The proposed Runtime contract shares these concepts. Its additional recipe
dependencies, per-run reference lifetimes, mutation settlement and durable reuse
are host execution responsibilities, not evidence of a superior model interface.
No MCP transport, new provider integration or arbitrary code executor is implied.

## Acceptance requirements

All advertised Design tools must use the shared contract at completion, including
formal success/error/partial outcome tests where applicable. Basic and composed
implementations with equivalent behavior must expose equivalent public contracts.
Provider projections, saved descriptors and examples must agree with registration.
Test real downstream validation, malformed results, changed dependencies, cancelled
calls and unknown settlement. Verify compact discovery actually reduces routine
delivery without preventing retrieval of necessary detail.

Verify nested scheduling, cancellation while queued, returned-handle consumption
after child completion, shared lease isolation and terminal request cleanup.
