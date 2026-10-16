# Tool Specification

Status: Common contracts, finite composition/library and embedded Design integration are implemented. Current staged guidance and verification work remains tracked in the plan.

This specification is owned by `@asyra/ai-agent-runtime` and applies equally to
primitive and composed tools. The remaining implementation is tracked by the
[Reusable Tool Composition plan](../../docs/ai/framework/plans/reusable-tool-composition-plan.md).
Exported types and formal tests are the authority for the implemented foundation.
The model-acquisition section applies to the current host integration; Design exposes the canonical proposal through submit_tool and exact dependency contracts through describe_design_apis.

## One canonical contract

One registered tool definition supplies discovery, invocation, validation and
storage projections. Do not keep separately authored copies for basic tools,
composed tools, each model provider or the reusable-tool library.

The following sections map to the exported common contract and composition APIs:

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
partial values using the host validator. Successful values use `outputSchema`;
partial values use `partialOutputSchema` when declared, otherwise `outputSchema`.
The optional partial schema belongs to the same immutable, revisioned descriptor
and its persisted dependency fingerprint. Schema selection follows the host's
explicit outcome; success never falls back to the partial schema. Compositions
forward only successful settled values, so partial receipts do not weaken typed
successful handoffs.
An invalid output preserves the actual value and settlement, reports the precise
validation issue and is never silently reclassified as a successful tool result.
A thrown host validator is also an explicit validation failure. Classification is
not inferred from truthiness, HTTP success or an empty object. Runtime does not
retry execution during validation. Failed and unknown receipts remain actionable
without pretending they satisfy the successful-result schema.

Tools exporting usable repair data on failed or unknown outcomes declare an
optional `recoveryOutputSchema` on the same immutable descriptor. This shape is
validated independently of successful and partial results; it cannot promote an
outcome or change settlement. Only validated declared references transfer to the
caller before cleanup. Undeclared failure diagnostics export no resources.
Composition stops successors and preserves typed recovery separately from normal
output bindings. Recovery is not successful-execution or persistence eligibility.

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
from a successful example. The recipe validator rejects such bindings without changing primitive invocation.

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

The generic library supports this lifecycle. Advertising the construction and
discovery tools in the embedded Design host belongs to PR 3.

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

The Runtime contract shares these concepts. Its additional recipe
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

## Typed recipe admission

A version-1 recipe contains finite ordered steps and an optional bounded repair iteration. Public
parameters/results use JSON Schema. Bindings are literal JSON, a JSON Pointer into
public input or an earlier step result, or an explicitly constructed object/array.
There are no arbitrary expressions, unbounded loops, callbacks or dynamic dependency names.
A proposal names exact registered dependency revisions. Host limits bound encoded
size, step count, nesting, expansion and repair issues; exceeding them rejects the
proposal without partial registration or execution.

An optional `iteration` declares `id`, `stateSchema`, `state` (initial binding),
`check` (one ordinary step), `repairs` (ordered steps), `next` (state binding), and
`maxIterations` (positive maximum repair rounds). A `state` binding is available
only inside that iteration. Initial steps execute once. Check executes first and
after each acknowledged repair round. Final output may bind the iteration ID,
whose result contains `state`, `result` (checker output), and `iterations` (repair
round count); it cannot bind optional internal repair results. All IDs are unique.

A registered read/prepare checker owns `verification: {statusPath, progressPath}`.
Admission requires guaranteed output paths: status is restricted to `pass`,
`repairable`, or `decision-required`, and progress is a nonempty string identifying
the unresolved semantic state. The checker must not use fresh invocation IDs as
progress. Only `pass` completes mechanical iteration. Decision-required, repeated
progress (including cycles), exhausted rounds, cancellation or unacknowledged
work stops without replay or save eligibility. Domain checks do not imply visual
acceptance. Runtime validates every dependency and the worst-case step expansion
before execution; each leaf still uses the same secured invocation and leases.

Public recipe array schemas support `uniqueItems` as a boolean constraint. Bindings
into a unique selection must guarantee uniqueness; removing or weakening this
constraint is not an accepted substitute for matching the registered contract.

Only dependencies explicitly marked composition-eligible by their host can enter
a recipe. Control-plane tools remain ineligible. This is shared contract metadata,
not a tool-name list. Metadata derives from the actual dependency graph; a model
cannot downgrade mutation/external effects or grant resource access.

Recipe-authored public schemas use the closed structural subset: objects,
homogeneous arrays, primitives, required fields, enums and finite bounds. Registered
dependencies may also use open objects, omitted optional `required`, primitive
`const`, homogeneous untyped enums, and disjoint union variants. Dependency fields
are projected by declared required paths. Unused opaque siblings do not prevent
that projection; opaque values cannot be bound, constructed or silently narrowed.
A path through a union must exist in every branch. Object construction selects a
union branch only when declared literal or bound discriminators exclude every
other branch; ambiguous variants reject before execution. Open source objects
cannot satisfy a closed destination without an explicit field mapping. Array
uniqueness is preserved, never inferred for arbitrary bound items. Registered
arrays can describe ordered receipt prefixes with `prefixItems`; an index still
requires `minItems` to guarantee presence. Each prefix retains its own schema and
runtime-value lifetime. Whole-array bindings check all reachable prefix positions
and the remaining item schema. Common object constraints on unions intersect
with each alternative, including forbidden properties and each closed property
set. Local `$defs` references resolve lazily and once per schema graph; recursive
schemas do not expand into repeated trees. Unknown, cyclic-only or unsupported
references remain unusable. Strict numeric endpoints and string patterns remain
part of implication checks; literals use the original host schema with its local
reference scope. Proof recursion is bounded and fails closed. The public recipe
schema subset remains unchanged.

All constraints on the selected value remain enforced. Unsupported keywords on a
used value, optional source paths and uncertain assignability return actionable
issues. Invocation still uses the host's complete original schema. This does not
claim general JSON Schema implication or infer structure from live product data.
The `x-runtime-value` schema annotation identifies transient `request` data,
leased `request-artifact` handles, `document` identities and `secret` values.
Hosts resolve leases only for explicitly annotated artifact handles, including
nested handles; request-owned data does not imply a resource lease. A binding may forward a compatible typed value from fresh input
or a prior output; a recipe may not persist a literal or default of that type.
The host owns correct annotations; Runtime does not infer document identity from
string spelling. Ordinary primitive invocation does not require the restricted
composition subset.

Admission returns a detached frozen proposal and derived descriptor or independent
issues with step/path, expected/actual summaries and recovery. The returned issue
count is bounded and reports omitted issues. It never calls a dependency to infer
its result type. Registration consumes this artifact; successful admission alone
does not make a recipe durable or eligible for another request.

## Durable host store

The generic store adapter reads entries and performs atomic compare-and-swap writes
with opaque storage versions. A successful write acknowledges durable storage of
that exact record. The adapter is host-injected; importing Runtime performs no IO.
The saved record contains the common descriptor once, the recipe steps/output
binding, exact dependency revisions/fingerprints, availability and compact scoped
validation evidence. It contains no execution arguments, outputs, credentials,
request handles, or author request identity.

Eligibility requires a genuine complete Runtime receipt for the exact admitted
recipe and successful host-supplied applicability checks. A caller-authored JSON
receipt cannot establish eligibility. This is scoped evidence, not proof of all
possible requests or visual correctness. Saving a candidate remains supported;
a restart exposes it for explicit inspection/resumption, never automatic execution.

Store conflicts and failures leave product completion unchanged. Retrying save
performs storage work only. Reload checks the current canonical dependencies and
re-enters admission; unknown formats, corrupted entries and changed dependencies
remain unavailable with individual reasons. Suspended and retired tools are not
invokable in future calls. An invocation already holding a validated graph keeps
its revision; live host security still applies at every leaf. Host request cleanup
releases exported request references and the corresponding unsaved candidates.

## Authoring schema and host lifecycle

`aiRecipeInputSchema` publishes the exact JSON submission envelope and recursive
binding alternatives. The admission parser derives its accepted field inventories
from that same format owner. This transport schema is not semantic approval:
`admitAiRecipe` additionally checks structural schema implication, runtime-value
classification, current dependencies and finite host budgets. The host exposes this
schema through its registered authoring operation; model-specific schema encoding
belongs to that adapter and never weakens admission.

Store reload requires a complete bounded inventory before selecting current
revisions. A corrupt identified revision blocks publication of that tool family,
while unrelated families remain usable. A saved candidate is not advertised after
restart; `resume` explicitly admits it for a fresh author request without running
it. Suspension/retirement updates both durable state and local registry metadata,
including private candidates. `library.remove` releases a host-selected in-memory
composition; retire durable entries first when permanent removal is intended.
Pinned active runs keep their captured definitions and finish normally unless the
host revokes a capability or the caller cancels.

The lease adapter receives the pinned `inputSchema` at `open`, and the selected
success or declared partial `outputSchema` at `retain`. It resolves annotated
references through host-owned stores; field-name guesses or a later registry
lookup are not reference authority. Schema metadata contains no executor.

The lease adapter's `release` is idempotent for its exact call scope and accepts
absent or partly initialized scopes after `open` fails. It must never release
borrowed inputs or sibling scopes.

Registered open objects preserve host admission, but their undeclared fields are
not evidence that a saved literal is independent of runtime state. Bind such
values from fresh typed input; known declared ordinary fields can remain literals.
This constraint applies to recipe capture only, not direct native invocation.


### Host library management

`createAiToolStoreManagement({ store, capacity })` uses the same saved-record
contract as persistence. `list()` returns compact identity, description,
availability and storage version, plus isolated invalid entries and a truncation
flag. This is saved metadata, not dependency admission or invocation eligibility.
It neither creates a registry nor executes a recipe. `read(name, revision)` returns
the same metadata for one exact current entry without scanning the inventory;
invalid data rejects, and absence returns undefined.

`setState({ name, revision, expectedVersion, availability })` permits only
`suspended` or `retired`. Pass the version observed by the user; stale versions
reject even if the requested state happens to match. Writes preserve the recipe
and execution evidence, require the exact durable acknowledgement, and never
revive retired entries. Runtime persistence delegates its state writes to the
same owner and updates request registry availability only after acknowledgement.


### Diagnostic outbox control contract

Hosts implementing `ExecutionRecordOutbox` reserve bounded per-request control
capacity through `reserve`, persist an `ExecutionRecordGap` through `recordGap`,
and return that metadata through `gap`. Gaps describe an enclosing missing range
and capture/storage/mixed cause; they do not reconstruct discarded records.
The host merges ranges without an unbounded list and keeps control discoverable
through `requests` and removable with `remove`. Normal `read` returns payloads
only. Runtime coalesces capture-refusal bursts, reports failed control writes and
refuses complete recovery when a retained gap exists. A host cannot guarantee
lossless evidence if both normal and reserved storage fail.

### Invocation provenance

Recipe invocation observations include the actual pinned tool revision and, for
each dispatched child, its admitted parent recipe name, revision and step ID.
Repeated use of a leaf retains distinct causal call IDs and recipe steps. Root
admission failures do not fabricate a pinned revision or recipe step. The host
forwards these fields with its existing input/output and lifecycle records; they
do not grant execution authority or change scheduling, retries or settlement.
