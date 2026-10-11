# Reusable Tool Composition

Status: APPROVED - sequential implementation authorized; completion requires the proofs below.

## Planning task contract

The initial planning task was to produce an implementation-ready design for
composing registered basic capabilities into reusable high-level tools, including the unresolved observations from the
last complete Taipei 101 run. This task changes only this plan, its Framework
plan-index entry, and the user-requested proposed Runtime tool specification.
It does not implement capabilities, change current product or
Inspector contracts, run another live drawing, change model/effort, or push.

- Worktree: `.worktrees/ai-reusable-tools-plan`.
- Branch: `codex/ai-reusable-tools-plan`.
- Base: `origin/main`, `d81fbc3419f357da9159abad045ce462614ec48f`.
- Accepted predecessor: merged PR #316. Its partial live acceptance remains partial.
- Association: this plan, this section; closeout owner: the current conversation.
- Discovery: current Runtime invocation/registry/profiler, Design discovery,
  preparation/review/workflow, retained context, activity reducer, their direct
  contracts/tests and the previous plan's recorded live evidence. No repository-wide
  cleanup, renderer redesign, dependency additions, or unrelated app changes.
- Planning gates: source/owner review, failure-scenario review, internal link and
  bounded diff checks. Runtime feasibility remains subject to the proofs below.
- Stop after the briefing so the user can decide implementation model and effort.

Implementation authorization is recorded in the current delivery contract below.
The existing profiler plan is not closed by creating this plan. Its specific
follow-up findings are associated here; unrelated unfinished work remains there.

### Documentation review delivery - 2026-10-11

The user subsequently authorized committing and pushing these planning documents
and creating a documentation-only PR, without running tests. This supersedes the
planning task's no-push checkpoint for these documents only. Implementation, model
selection, runtime tests and merge remain outside this delivery. Review the three
document paths, links and whitespace; do not claim runtime or Inspector admission.

### Sequential delivery authorization - 2026-10-12

The user authorized implementation, scoped validation, push and merge of the
complete plan, one PR at a time. This supersedes the initial briefing/model and
no-implementation/no-merge checkpoints. Keep the App model `gpt-6-astra` with
`medium` effort unchanged. Do not start a successor until its predecessor merges.

First repair the two planning-review gaps in PR #317: scheduler acquisition for
nested invocation and returned-reference ownership. This documentation slice is
limited to the three original document paths, their linked owner contracts and
these handoffs. It does not change production or Inspector semantics. Its gates
are source/owner and bounded diff review, document links, formatting and applicable
metadata/changeset checks. Merge only after latest-head applicable CI passes.

Every subsequent PR requires a bounded implementation contract, exact current
Inspector flow, applicable tests, self-review and correction before push. Recheck
latest-head CI and head identity before merging. After all three implementation
PRs merge, review every acceptance case and carry-over against main. Correct any
remaining mismatch in a new worktree through implementation, self-review,
iteration, applicable validation, PR and CI-gated merge. Do not close the plan
merely because its initially planned PR count has been reached.

## Evidence and diagnosis

Authority: [current Design execution contract](../../apps/asyra-design/specs/ai-execution-flow.md),
[Runtime package contract](../packages/ai-agent-runtime.md), and
[previous plan](ai-runtime-profiler-plan.md), section
`Complete live acceptance result - 2026-10-11`.

The retained evidence is under the predecessor worktree's
`tmp/full-101-large-document-20261011/`. The primary request is
`99b74684-88c2-49e3-bba2-c575ee04545c`; the browser record is
`c91b45ca-45ca-492c-96de-007f8db25f34`. Evidence is read in place.

| Observation | Consequence for this plan |
| --- | --- |
| Completion 2269.476 s; first visible content 244.600 s; 46,763 objects | Measure the complete delivery path, not only a faster apply function. Earlier runs contain different generated workloads and are not controlled speed comparisons. |
| 19 prepared applications: 77.333 s; UI scene-tree projection 24.252 s within 36.227 s synchronous creation | Preserve incremental membership. Profile repeated projection work separately; nested durations must not be summed. |
| 19 recipe assessments: 592.956 s, ten failures; three final canvas assessments still needed | A model review per artifact is not established as beneficial. Structured review needs current attachment context and narrower admission. |
| One batch input: 2,324,430 bytes of expanded target keys; 23 distinct key-list groups | Fix producer-to-consumer references. Identical list retransmission was not demonstrated in this run; large payload and repeated serialization are separate questions. |
| No live use of `retain_design_targets` | Exposing a capability does not establish that the normal workflow uses it. |
| Child completion restores stale parent wording | Purpose freshness and observed execution phase are different contracts. |
| 69/70 records complete; browser record ends at 1827.215 s | Missing final evidence prevents exact browser settlement timing. The failed live batch was not retained, so the triggering condition is unproven. |
| Recording probes: 82.103 s over 2,091 observations | Harness overhead must be measured separately and reduced at its owner. It is not product idle time or guaranteed removable wall time. |

Current code establishes these constraints:

- `packages/ai-agent-runtime/src/types.ts` exposes input schema and an unknown
  result, without a universal executable output contract. A recipe validator
  cannot currently prove every tool-to-tool handoff.
- `src/invocation.ts` in that package already supplies middleware and causal
  observation. It accepts the host's secured executor; it grants no authority.
- Design `server/local-ai-provider.ts` binds actual tool namespaces and uses a
  host scheduler. Native provider Code Mode already supports request-local
  composition; there is no verified cross-request recipe lifecycle.
- `server/local-prepared-design-review.ts` reviews retained source and evidence;
  it does not render the proposed result or establish its fit with current canvas.
- `src/ai/activity-state.ts` inherits previous/parent/request wording. Closing a
  child can expose an older parent description even when phase is accurate.
- Runtime `src/profiler/record-delivery.ts` permanently fails after overflow or
  exhausted sends and discards pending records. Recovery needs a delivery design,
  not a larger memory limit.

These paths are implementation evidence, not parallel behavior authorities.
During implementation, reconcile the older integration overview in the Runtime
package document with the current Design contract; do not restore superseded
transaction/catalog behavior from that overview.

## Product outcome and boundaries

An AI can reuse a compatible high-level tool, or propose a composition when no
appropriate registered operation exists. The system validates that composition,
executes it through existing owners, and stores its reusable definition locally.
A subsequent request can discover it and supply new inputs without regenerating
its internal orchestration or transferring intermediate object lists to the model.

Reuse means reusing verified operation logic. It does not mean reusing old object
IDs, document snapshots, permissions, reference-image judgments, or successful
results against new documents. A missing primitive capability remains missing;
composition cannot manufacture an unsupported operation.

Supported initial compositions are ordered, finite calls with typed value or
artifact bindings. They may reference an existing verified composition, expanded
and cycle-checked at admission. Bulk work uses an existing plural/domain operation
whose owner performs bounded chunks. There is no generic per-object tool loop.

Not included: evaluating model-supplied JavaScript in the App, arbitrary callback
execution, recursive/unbounded workflows, arbitrary filesystem/network access,
automatic package installation, a public marketplace, cloud synchronization, or
automatic execution on importing a recipe. Existing native Code Mode remains a
provider capability; it is not persisted as an executable App program.

## Ownership and API shape

Names below express proposed responsibilities, not newly available APIs.

| Owner | Responsibility | Forbidden responsibility |
| --- | --- | --- |
| `@asyra/ai-agent-runtime` | Recipe format/validation, operation references, composition lifecycle, invocation causality, generic storage interface and diagnostics delivery protocol | Design geometry, concrete App selection, renderer access, granting permissions |
| Design tool registry and server adapters | Current operation schemas, outcome decoding, effect/resource metadata, operation search, preparation and semantic assessment | A second generic recipe interpreter or parallel capability catalog |
| Design Feature/common APIs/Core | Current document resolution, retained target ownership, finite writes, recovery, grouped Undo and persistence | Executing arbitrary generated code or trusting saved IDs as current authority |
| Host persistence adapter | Private durable recipe store and diagnostic outbox using existing host facilities | Automatically loading recipes into document content or copying credentials into them |
| Design UI | Project current purpose/phase and library management into the existing panel | Inferring execution state from a timer or inventing a successful outcome |

Use the existing invoker's `invoke` boundary for both a composition and every
leaf operation. Distinguish primitive/composition identities by registry kind,
not by ambiguous names or a second dispatch mechanism. A composition expands to
calls passed to the existing host scheduler and secured executor. The outer
composition coordinator must not hold a scheduler barrier while awaiting its
children: doing so would make a scheduled child wait for its own parent. Only
leaf/domain operations acquire and release host scheduling resources. Both parent
and leaf still traverse validation and causal invocation; derived parent effect
metadata does not bypass live leaf authorization. Nested compositions follow the
same rule. Runtime does not acquire a competing mutation queue or open a long
physical transaction. Cancellation stops further dispatch; queued and running
leaves retain the host's cancellation and settlement rules.

### Tool contracts required for composition

All primitive and composed tools use one canonical registration contract and
registry. Their shared identity, description, schemas and execution semantics
must not be duplicated in a recipe-only catalog. A composition adds an execution
recipe and dependency evidence; it does not add a second common descriptor.
The user-requested package-owned proposed specification is
[Tool Specification](../../../../packages/ai-agent-runtime/TOOL_SPECIFICATION.md).
It must remain explicitly proposed until implementation and executable contracts
are delivered. Current package guides will link to its accepted contract then.

Extend the canonical registration contract with composable output and execution
metadata, derived from the existing owner where possible:

- Canonical operation identity and contract revision, input schema, successful
  output schema, and explicit failure/partial/unknown-settlement receipt.
- Effect: read, prepare, document mutation, or external effect; actual resource
  access and permission checks remain the host owner's decision.
- Cancellation/settlement behavior; explicit retry-safe or reconciliation support
  only where the owner can prove it. Absence means no automatic write retry.
- Output kind: bounded value or retained artifact, with an owner-resolved schema
  and lifetime. A receipt is not necessarily the tool's complete underlying data.

Inventory every currently advertised Design tool and its outcome variants. Use
existing decoding/admission to produce one normalized result at the invocation
boundary. Do not maintain a second JSON schema catalog or silently reinterpret a
string as a successful JSON object. A tool with no verified result adapter remains
directly invokable under its current contract but is explicitly ineligible as a
typed composition producer until its contract is completed. This is a staged
implementation boundary, not a permanent second class of incomplete tools: final
acceptance requires all currently advertised Design tools to use the common
contract and have formally checked outcome variants.

Provider declarations, compact discovery, full usage/schema retrieval, saved recipe
manifests and documentation examples derive from the same canonical definitions.
Keep host-only dependencies, validation history and recovery bookkeeping out of
routine model context. Provider adapters may change wire field names and supported
schema representation, but never silently weaken host validation or invent fields
unsupported by that provider. Output validation remains host-owned even where the
provider protocol accepts arbitrary tool-result text.

Static validation resolves literal and referenced inputs, required fields, all
branches, cycles, effects and budgets. JSON Schema assignability is not assumed
solvable for arbitrary schemas: support a defined structural subset, require an
explicit registered adapter for other mappings, and perform actual downstream
input validation before every call. No unsafe cast or model-generated transform
stands in for a proof.

### Saved recipe and per-run state

A saved definition contains stable identity/version, purpose, applicability and
limitations, parameter/result schemas, immutable ordered steps, exact dependency
identities/revisions, effect summary and validation evidence. Each step binds
constants, input paths or an earlier step's declared output path. No executable
expressions or dynamic tool names are accepted.

Parameterize document targets, regions, reference inputs and meaningful style or
geometry choices. Constants are permitted for genuine algorithm defaults; host
handles, credentials, local paths, private source payloads and captured selections
are not reusable constants. Reject captured runtime identities at admission using
their declared types, not string-pattern guesses.

Per-run state contains invocation identity, current resolved parameters, graph
revision, receipts, actual handles/leases, completed steps, settlement and causal
records. It is not stored as the reusable definition. A receipt can be retained
for diagnosis without authorizing its targets in a later run.

Example composition, expressed as intent rather than new executable syntax:

1. Inputs: current workspace, a world-space region, new fill values.
2. Resolve matching editable objects through the existing region query owner.
3. Pass its retained target handle directly to one plural fill operation.
4. Return changed count, affected region, completion/partial receipt and optional
   inspection reference. Return no expanded target list unless explicitly asked.

This works for a new region in another document. It is not a saved command to
modify the IDs from the previous Taipei 101. If an existing combined operation
already meets this purpose, use it rather than create a redundant recipe.

## Complete execution and reuse flow

1. **Discover:** search canonical operation identities and compact reusable-tool
   summaries together. Return applicability, required inputs, effects, revision
   and availability. Fetch detailed schemas only for selected candidates.
2. **Select or compose:** the model selects an applicable tool. If none fits,
   distinguish an orchestration gap from a missing primitive. For the former it
   submits a typed recipe through one admission tool; the latter returns the
   unsupported requirement and available alternatives without inventing execution.
3. **Admit:** Runtime checks structure, exact dependencies, bindings, bounded
   expansion and effects through host capabilities. Failure returns step/path,
   expected contract, actual issue and supported recovery; no document writes.
   Success registers an immutable candidate in the shared registry for explicit
   invocation and may persist it as a candidate; neither action runs its steps.
4. **Preflight:** resolve current inputs and deterministic domain checks. Request
   semantic review only for the uncertainty described below. Read-only preflight
   is not a promise that arbitrary mutations can be simulated or rolled back.
5. **Invoke:** run through existing middleware/scheduler, validate each actual
   handoff, check current permissions and freshness, then perform finite batches.
   Stream phase/progress and compact receipts while the model need not orchestrate
   every internal step. Stop/failure preserves acknowledged progress.
6. **Evaluate:** combine actual receipts with explicitly scoped checks. Successful
   execution is distinct from satisfying visual criteria. Final visual assessment
   still belongs to the current Design workflow.
7. **Retain:** attach execution evidence to the exact candidate revision and promote
   to reusable eligibility only after complete successful execution and applicable
   checks. Persist the definition and eligibility atomically; persistence failure
   is distinct from execution failure. Keep scope and evidence, not a universal
   correctness claim.
8. **Reuse:** discover the saved immutable version in a later request, validate its
   dependencies and new inputs, acquire fresh document handles and invoke. Reuse
   does not require another model to approve unchanged orchestration.

The candidate-to-eligible transition must not execute the task twice. Extraction
from an already completed run verifies its typed steps/receipts; it does not replay
them for promotion. A model-native code program cannot be promoted merely because
the provider ran it successfully; it must become a validated declarative recipe.

### How the embedded AI obtains and uses the contract

The model does not read a repository Markdown file or require a locally installed
skill. The package specification teaches developers the contract. The executable
registration schemas supply the model-facing discovery, usage and validation
surfaces. A developer skill could teach authoring later, but is not an App runtime
dependency or a second source of tool rules.

Keep one short bootstrap instruction: reuse an applicable registered operation;
for an orchestration gap, discover the composition submission capability and its
current schema; submit a declarative recipe and repair reported contract errors;
do not invent missing primitives. Full construction instructions are deferred to
the registered submission tool's description and exact schema.

The submission capability is an ordinary registered tool governed by the same
input/output contracts as all other tools. Its structured input identifies:

- New submission or an explicit revision of a named candidate, with a retry-safe
  submission identity; revisions also carry the expected prior revision.
- Desired purpose, applicability/limitations, and public parameter declarations.
- Ordered steps referencing discovered exact operation identities, input bindings
  and public result bindings. Step references are local recipe identifiers, not
  document element IDs or guessed executor names.
- The contract revision the model used when composing, so stale definitions yield
  a precise refresh response rather than an unrelated format error.

AI-authored input is a proposal, not a second tool-definition format. Admission
produces the common registered descriptor from it. The model supplies desired
semantics and choices; the system derives what the existing registry already knows.

| Information | Producer and validation |
| --- | --- |
| Purpose, meaningful parameter names, desired bindings and limitations | AI proposes; host validates format and representability without pretending to prove design quality. |
| Required fields and input/output shapes of existing steps | Canonical registry supplies them through scoped schema retrieval; AI references rather than copies them. |
| Public input and output schema | AI chooses the public interface and result bindings; Runtime derives referenced field schemas where possible and verifies declared constraints. New constants/parameters need explicit valid schemas, not guessed types. |
| Stable registered identity and immutable revision | Registry assigns/resolves them under existing naming rules, checking collisions and expected prior revision. Display wording is not authority to overwrite another tool. |
| Dependency revisions, effects, permissions and artifact lifetimes | Host derives and checks them from canonical dependencies. AI cannot self-certify them or reduce leaf restrictions. |
| Validation and execution evidence | Actual validator/executor records, bound to the candidate revision; never accepted as model-authored proof. |

### Handoff receipts and repair loop

The following names describe required receipt meanings, not finalized wire names.
Every response uses the common outcome contract and a bounded payload.

| Handoff | Consumer receives | Failure and recovery owner |
| --- | --- | --- |
| Discover to schema retrieval | Exact identity, applicability, availability and current contract revision, with a scoped retrieval route | Registry reports unavailable/ambiguous choices; no silent name substitution. |
| Schema retrieval to submission | Required fields, typed binding grammar, applicable input/output schemas and exact revision; one bounded valid example where useful | Definition delivery distinguishes already delivered from missing; explicit scoped refresh recovers lost context. |
| Submission to admission | Proposed interface/steps and submission identity, with referenced revisions | Runtime returns structured issues before registering executable behavior. |
| Admission to registry | Immutable validated descriptor/recipe, dependency digest, candidate identity/revision and invocation route | Registration conflict leaves existing entries unchanged and returns the current revision or exact collision. |
| Registry to execution | Candidate reference plus fresh arguments and current run context | Existing invocation/host checks enforce freshness, resources, permission and actual input/output validity. |
| Execution to promotion | Settled receipts and applicable assessments for that exact recipe revision | Runtime keeps partial, failed or unknown runs as evidence without marking reusable eligibility. |
| Promotion to persistence | Descriptor, recipe, dependency evidence and eligible state | Store returns durable acknowledgement or explicit save failure; retry saves only, never reruns steps. |
| Next request to reuse | Revalidated eligible descriptor from the local library, retrieved through ordinary discovery | Changed/missing dependencies suspend that entry; return why and the supported repair route. |

A rejection includes stage, candidate/submission revision where available, issue
code, affected step and binding/schema path, expected type or constraint, a bounded
actual-value summary, and supported recovery. Independent issues should be returned
together within a bounded response; omitted issues are explicitly counted rather
than presented as a complete list. Validation never creates placeholder canvas
objects or executes a write just to see whether the binding works.

Example: step `recolor` binds its target collection to `locate.count`. Admission
returns that binding path, expected target-handle schema and actual integer schema.
If the registered result has a suitable handle field, the issue can identify that
exact field as a candidate correction. It must not invent a field or choose among
semantically ambiguous outputs. AI changes the binding and resubmits the proposal;
the validator checks the complete resulting recipe, including previously valid
steps whose dependencies changed.

Same submission identity plus same content returns the same candidate receipt;
same identity with changed content is a conflict, not an overwrite. A corrected
proposal uses a new submission identity and explicit prior candidate revision if
it updates an accepted candidate. Invalid new proposals need no registry entry.
Previous valid revisions remain immutable. Limit repeated unchanged invalid
submissions and expose no-progress feedback within the existing request budget;
stop that composition attempt or select another legitimate route without a generic
retry loop or aborting unrelated valid work. Cancellation ends the attempt promptly.

### Registration, first use and durable availability

Registration, execution, promotion and saving are separate transitions:

- A validated candidate is visible to its creating request and explicitly invokable
  there; it is not advertised as a previously proven tool to other requests.
- A candidate saved before execution reloads as a candidate, not an eligible tool.
  It can be inspected or explicitly resumed after current dependency validation.
- Only actual complete execution and applicable checks make a revision eligible.
  Its applicability remains scoped to the supported parameter domain and evidence;
  one successful input does not certify all possible inputs or visual results.
- If execution succeeds but saving fails, report completed product work and an
  unsaved tool separately. The current registry entry can remain session-local;
  cross-request availability is promised only after durable acknowledgement.
- A restart between success and promotion must not trigger another mutation run.
  Reconcile durable receipts for that exact revision, or retain candidate status
  when evidence is incomplete. An explicit new invocation is a separate action.

A tool registered during a model turn may not be present in that turn's native
provider declarations. The submission receipt therefore returns an invocation
route through the already advertised generic registered-operation dispatcher.
That dispatcher resolves primitive and composition identities in the same registry
and uses the same host checks. Later discovery refreshes its registry revision;
do not assume provider-side hot registration or create a hidden parallel executor.
The composition contract remains retrievable through ordinary exact lookup.
Extending the existing dispatcher to resolve composed entries is a prerequisite
implementation step, not a capability claimed to exist today. Enable submission
discovery only after exact lookup and this invocation path pass together.

Recipe submission, registry mutation, promotion and library administration are
control-plane operations and cannot themselves be recipe steps. Mark this through
canonical composition eligibility metadata, not a tool-name blacklist. Otherwise
a nominally finite recipe could register or invoke an unvalidated dynamic graph.
Basic tools and compositions still share one contract; eligibility is a capability
of the actual operation, not an exemption from that contract.

Use the same admission pipeline for stored definitions on load, without interpreting
load as execution. Check manifest integrity, format, dependencies and eligibility
evidence. Registry publication follows successful validation; one malformed entry
is reported and isolated without blocking valid library entries or built-in tools.

### Library lifecycle and compatibility

Use one host-private store, shared across that host's Design requests/documents.
Runtime exposes a storage interface without automatic I/O; the local host adapter
uses existing persistence infrastructure. Version manifests and evidence separately,
write atomically, deduplicate identical canonical recipes and bound storage. Do not
start by adding a database dependency.

States: candidate, eligible, suspended, retired. Suspended means a dependency or
contract is unavailable/changed, not deleted evidence. A changed dependency digest
requires revalidation; no silent alias to an API with similar wording. Unknown
format versions remain unavailable with an explicit error. No compatibility shim
or migration implementation is assumed.

One run pins an immutable expanded recipe and dependencies; editing its library
entry affects future invocations. A host capability/security revocation still
stops new leaf calls immediately. Delete/disable operations do not silently abort
an already authorized run; Stop is explicit. Preserve referenced versions until
active runs finish, then apply retention policy.

Saving an eligible local recipe can be automatic and separately removable. It
does not pollute canvas Undo. Imported definitions never auto-run. External
effects inside a saved tool retain the same authorization checks as direct calls;
a familiar recipe name cannot confer authority or grant new access.

## Carry-over corrections integrated with composition

### 1. Retained data and producer-consumer handoff

Change the ordinary producer result to include a consumable typed target/artifact
handle and compact coverage/count. Consumers accept that handle directly at the
registered input path. Do not require AI to discover and call a separate retention
operation after it has already received thousands of keys. Keep explicit narrow
columns/full recovery for legitimate inspection or lost-context cases.

Reuse current query owners and leases. Bind query artifacts to document/workspace
generation, canonical revision and query identity. Pin through the last dependent
consumer. Separate borrowed input references, owned intermediate leases and public
returned references. Before a child composition finishes, transfer or retain its
returned-reference ownership for the calling parent/request; local completion
must not invalidate the next consumer's input. Release only locally owned,
unreturned intermediates with no remaining consumers, never a borrowed or sibling
lease. Explicit caller release or request termination releases exported request
artifacts. Partial/failure receipts may preserve useful returned artifacts under
the same ownership rule; unreturned intermediates are cleaned up on failure or
cancellation. Capacity pressure rejects a new handoff recoverably rather than
evicting a live dependency. Prevent cross-request handle reuse even when two
requests happen to use the same workspace. Ownership retention never overrides
revision invalidation, permission changes or reference freshness.

Not all artifacts have the same invalidation: an immutable prepared source is
different from a current-scene query. After a mutation, do not reuse a stale query
under a new revision. Use acknowledged mutation outputs for subsequent targets,
or explicitly resolve a fresh query when its semantics are required. Do not
silently reselect different objects for a pending edit.

Record producer identity, handle resolution, hit/miss/invalidation reason, sizes
at each actual transport boundary, and expansion/serialization counts. Store large
payloads once in the diagnostic artifact store and reference their hashes in events;
hash references require retained bytes and cannot conceal missing input/output.

### 2. Preparation and pre-drawing review

Always run deterministic input, coordinates, limits, references, target existence
and structural checks. Use current world/local contracts; do not reopen the already
fixed Group coordinate implementation. Resolve actual attachment parent transform,
relevant bounds, unit/projection facts and local scene context through public APIs.
Avoid reading the entire scene to answer an attachment question.

Separate review of a reusable algorithm from review of one design instance. Code
or schema success cannot certify proportions, source interpretation or appearance.
Request model semantic review for a new reference-dependent construction decision,
unresolved contradiction, missing attachment evidence, or materially changed
criterion/evidence. Repeated instances of an already reviewed construction within
its declared valid domain need deterministic checks, not another identical model
review. Direct known-value edits bypass semantic design review.

Retain review scope, findings and dependencies: source hash, named criteria,
reference versions, attachment context and relevant scene revision. Reuse only
when those dependencies match. Changes outside a proved dependency scope need not
invalidate it; absent such a proof, invalidate conservatively. Findings distinguish
blocking contradictions, unknown evidence and optional polish. Do not convert
unknown into pass, or unfinished unrelated parts into failure.

Prepare/review/apply one coherent ready part; do not assemble the complete building
before its first visible part. Final reference/canvas review remains necessary.
Keep original request and retained verified facts authoritative, including no
unrequested backgrounds or arbitrary changes to verified dimensions.

### 3. Current activity and causal records

Extend the existing state machine with purpose identity/revision and a validity
scope tied to the active step, rather than another precedence chain of strings.
Step entry emits its purpose and actual phase; terminal child events cannot restore
an obsolete parent subtask. A parent may resume only its still-valid orchestration
purpose, not an old child-specific sentence. Out-of-order events are ignored by
the existing attempt/sequence/closed-call rules.

Present purpose and phase distinctly: preparing geometry for the roof, applying
roof geometry, checking the roof. Only actual mutation application claims canvas
updating. During provider work use the current request/step purpose with an honest
processing phase; no invented next step, generic waiting message, extra model call
just to update status, or forced language. Coalesce identical observable state,
not genuine task transitions. Concurrent reads expose a coherent active purpose
and counts without allowing the last unrelated response to rename the task.

Record recipe/version/step and parent-child spans, actor, purpose source, expected
result, input/output artifacts, admission/queue/execution/delivery, outcome, retry
link and settlement. Provider waits are observed provider-boundary elapsed time,
not hidden internal reasoning. Report wall time, critical path, inclusive nested
time and exclusive owner time separately; never sum overlapping spans.

### 4. Reliable diagnostic delivery

Introduce a bounded durable outbox behind the existing Runtime sink abstraction.
Browser host persistence retains unacknowledged records; the receiving local
collector acknowledges sequences only after its durable write. Record batches
have stream identity, sequence ranges and content identity. Retry duplicate sends
safely; collector verifies content and reports acknowledged ranges.

Keep failed payloads and typed transport/HTTP/storage causes. Resume from the last
acknowledged sequence after reconnect/reload without rerunning product operations.
Use backoff and a separate diagnostic lifecycle; no unbounded memory, hot retry
loop, blocking product operation, or infinite final-saving spinner. Product done
and diagnostics saved are independent states. A terminal marker is complete only
with contiguous required evidence, acknowledged persisted payloads and closed spans.

Disk/browser quota failure cannot guarantee lossless recording. Preserve compact
gap metadata through a reserved control budget where possible, mark incomplete,
and provide an explicit persistence error; after storage recovery retain the gap
rather than claim reconstruction of unavailable data. This limitation must be
tested and reported, not described as zero-loss logging. Host transport accepts
only validated local diagnostic payloads and introduces no external collection.

### 5. Large-document application and recording overhead

Preserve incremental membership, single immutable preparation snapshot and bounded
application. Prove whether UI projection repeats for the same canonical changes;
if so, aggregate at the existing batch publication boundary and update affected
branches rather than rebuilding the entire tree per insertion. Preserve final
ordering, selection, Group dirty bounds, Undo/Redo, remote updates and save/load.
Do not add a second scene tree, global rollback snapshot or render-frame delay.

If remaining cost is legitimate work, report it; composition does not make object
creation free. Use fixed synthetic workloads plus the saved large document to
compare work counts without model-generated workload differences.

For recording only, observe authoritative overall-bounds changes instead of
rescanning all objects on a polling loop. Fit on first content, real overall-size
changes and final completion, then retain the final ten seconds. Keep any recording
harness changes local if that is its existing ownership; do not add automatic fit
to normal App use or publish local-only recording fixtures.

## Failure, cancellation and resource contract

- Validate all known graph structure before execution; validate data-dependent
  inputs immediately before their leaf call. Static approval never disables live
  permission, resource, schema or reference checks.
- Reuse the existing host scheduler's resource ordering. Initially execute recipe
  steps in declared order; do not introduce a second parallel executor. Independent
  direct read calls keep their existing scheduling behavior. Composition coordinators
  await leaves without acquiring a parent barrier, including nested compositions.
- Budget expanded steps, composition depth, retained bytes, actual item expansion
  and work per domain operation. Reject cycles and unbounded expansion. A rejected
  admission returns the limiting dimension and a supported partition boundary;
  it does not merely recommend a larger cap.
- Chunk only at owner-declared coherent boundaries with cancellation and publish
  checkpoints. A chunk must not expose invalid partially linked canonical state.
  Keep one intended user-request Undo group, excluding intervening user/remote edits.
- On known partial failure, preserve acknowledged completed steps and exact remaining
  scope. A downstream failure never causes automatic replay of successful writes.
  On unknown mutation settlement, require owner reconciliation or explicit recovery;
  an invocation key alone cannot provide exactly-once execution after a crash.
- Do not restore whole-scene ACID snapshots. Local canonical cleanup and valid
  partial progress remain the existing owner's responsibility. Cleanup failure is
  explicit and does not prevent unrelated safe work where the owner permits it.
- No automatic full-run resume after App restart in the first version. Persist
  diagnostics and known receipts, then re-resolve current state for an explicit
  continuation. Durable recipe storage is not a durable mutation workflow engine.

## Implementation sequence and verification

Before production edits, promote the approved product behavior into current specs
and update the applicable Runtime/Design Inspector steps with exact owners, inputs,
outputs, conditions, bypasses, failure owners, direct contributors and boundaries.
Use existing supported Inspector admission paths and executable cases. This plan
does not claim Inspector admission or runtime verification has already happened.

### Ordered PR boundaries

| Delivery | Included stages and closure boundary |
| --- | --- |
| PR 1 - Common contracts and recording foundation (#319) | Stage A: shared registration/output/outcome contracts, invocation diagnostics and durable delivery, current-purpose freshness. Retain its existing validated implementation and review corrections. |
| PR 2 - Runtime composition and durable library | Stage C and generic Stage D: typed finite recipes, admission/repair, registry dispatch, nested invocation, host-store interface, eligibility and save/reload. Prove with neutral hosts; no Design-specific geometry or alternate scheduler. |
| PR 3 - Design integration and complete acceptance | Stage B, Design-specific Stage D, Stage E and Stage F: normal query handles, preparation/review reuse, embedded authoring/discovery/storage/management, recorded repeated-work corrections and complete integration acceptance. Every remaining acceptance case must be accounted for before whole-plan closeout. |

Promote current specs and the exact Inspector steps with each implementation PR;
this sequence is not permission to publish unimplemented capabilities. PR 2 starts
from merged PR 1; PR 3 starts from merged PR 2. The final review includes preserved
primitive operation behavior, not only successful composition examples. The user
has authorized the complete plan's final recorded 101 acceptance; it follows the
deterministic integration gates and retains the existing final-reference report.

| Stage | Implementation boundary and completion evidence |
| --- | --- |
| A - Observability and invocation contracts | Runtime invocation/profiler/types, Design result adapters/collector/activity. Test-first lost delivery, typed results and stale purpose; retain complete observable causality before judging later speed. |
| B - Current handoffs and review | Design operation/workflow/preparation/review/retained-context owners and direct tests. Default producer handles, narrow attachment context, scoped review reuse. Prove genuine bounds queries do not expand unrelated siblings or return large lists to AI. |
| C - Generic composition | Runtime format/validator/interpreter through existing invoke and host scheduler; direct package tests. Ordered typed graph, dependency revisions, partial outcomes, cancellation and finite budgets. Extend existing exact lookup/dispatch to composed entries before exposing submission. Prove portability with a second neutral test host, not another product implementation. |
| D - Durable library and discovery | Runtime host-store interface, existing Design local host persistence and discovery adapters. Registered submission schema, bounded repair, candidate publication, save, reload, compact search, version eligibility, disable/remove, no captured state or double execution. Add minimal management within existing panel, no separate catalog product. |
| E - Large-document integration | Canonical creation publication and Design scene-tree projection only where recorded repeated work is proved; direct affected tests. Compose domain bulk operations, preserve selection/Undo/remote interleaving and observed drawing updates. |
| F - End-to-end acceptance | Deterministic direct-versus-composed equivalence, new-request reuse, failures and the authorized complete recorded 101 run. Report limitations and final references. Full local CI belongs to a later explicitly requested release checkpoint. |

For each stage, run focused existing owner tests plus new formal regressions that
fail before the fix. Naming validation precedes identifier-bearing implementation.
Expand lint/build/type checks to affected direct consumers; do not substitute a
live AI drawing for deterministic contracts, or run full local CI per small change.

Required behavioral cases:

1. Discover an existing suitable operation without unnecessary composition; report
   a genuinely unsupported primitive without inventing it.
2. Assemble a valid multi-step tool; run once, save, reload in a new request and
   use different targets. Same inputs through direct primitives and composition
   produce equivalent canonical data, effects, Undo and permission decisions.
3. Reject missing fields, invalid actual outputs, mismatched bindings, unsafe
   expressions, cycles, unknown versions and excessive expansion before affected
   writes; preserve already acknowledged unrelated progress.
4. Every registered tool has tested output/outcome classification. Every declared
   binding kind has valid/empty/invalid/partial coverage; real Design preparation,
   query, mutation and inspection exercise cross-owner chains. Do not claim every
   possible graph is tested from one generated drawing.
5. A changed contract suspends reuse; a captured target ID cannot masquerade as a
   reusable constant; imported content cannot execute instructions or gain authority.
6. Cancellation inside a chunk, user/remote edits between chunks, Undo/Redo during
   an open group, downstream failure and uncertain settlement preserve host rules.
7. Live lease survives cache pressure; stale query fails explicitly; using mutation
   receipts avoids illegal stale-query reuse. A child returns a handle, completes,
   then its outer consumer resolves it successfully. Borrowed/sibling leases survive
   unrelated cleanup; cancellation and request termination release the correct
   ownership without leaks or cross-request reuse.
8. Repeated motifs within reviewed scope avoid redundant model review; new source,
   parent transform, relevant scene change or requirement invalidates it. Final
   appearance remains unverified until actual canvas assessment.
9. Child completion, retry, concurrent read, late event and saving show the correct
   current purpose/phase, without stale wording or per-loop flicker.
10. Diagnostic offline/reconnect, repeated batch, HTTP rejection, quota exhaustion,
    terminal-before-data, reload and disposal yield complete durable evidence or
    explicit incompleteness. Neither path duplicates a product operation.
11. Count target expansion, source compilation, serialization and scene-tree
    projection across small and large fixtures; test invalidation as well as reuse.
12. A full drawing preserves user constraints, editable output and final visual
    review; recording includes reference assets, current status and final ten seconds.
13. An embedded-model protocol fixture starts with bootstrap guidance and the tool
    discovery surface only, retrieves the submission schema, submits an invalid
    binding, receives a precise issue, corrects it, registers and invokes through
    the already advertised dispatcher. It requires no filesystem skill or manual
    insertion of the new tool into the provider request. A real-provider acceptance
    case later verifies discoverability beyond the deterministic protocol fixture.
14. Repeat a submission after a lost response; prove one immutable registration
    and no execution. Test conflicting revisions, newly changed dependencies and
    bounded no-progress repair. Actual invocation still requires fresh admission.
15. Prove execution-success/save-failure separation, save-only retry, candidate
    reload, malformed-entry isolation, and a new request discovering the durably
    saved eligible tool. Missing execution evidence must not silently promote it.
16. Reject control-plane operations nested in recipes through capability metadata;
    verify that submission is not discoverable before its returned invocation and
    schema-retrieval routes are operational.
17. A nested composition with ordered mutations completes through the real host
    scheduler without holding a parent barrier. Direct authorized operations can
    interleave at host boundaries. Cancellation while a leaf is queued prevents
    subsequent dispatch and preserves the queued/current leaf settlement contract.

DoD is the above behavior with bounded work and correct handoffs, not a promised
model duration. Report AI boundary waits, tool work, App apply/projection, queues,
transport and final persistence separately. Include first visible change, total
UI completion, object/geometry workload, model review counts, bytes per boundary,
recipe reuse/admission failures and recording overhead. Full logs remain local;
the user receives a concise table and links to the evidence and actual references.

## Model and effort decision checkpoint

Keep the current App model/effort and coding-session configuration unchanged during
planning. Coding capability and the App's executing model are separate decisions.
This design must work through provider-independent Runtime contracts rather than
depending on a particular model to avoid malformed input.

The implementation authorization keeps the current model/effort. If an App
model comparison is authorized, compare fixed operation selection, typed recipe
construction, repair and reuse cases first, with identical tool definitions,
document fixtures, reference evidence and budgets. Track correctness, unnecessary
calls, recoveries, transferred bytes and completion time; do not decide from a
single randomly generated 101 or assume a larger effort is faster. A complete 101
run then tests product behavior, not a statistically reliable speed claim.

## Self-review and resolved design gaps

- **Unknown outputs:** added normalized producer contracts and runtime downstream
  validation. Static graph shape alone is insufficient.
- **Hidden arbitrary programming:** constrained the first version to ordered typed
  bindings and domain bulk calls, with no general expression or loop language.
- **Duplicate execution on promotion:** candidate promotion consumes existing
  receipts; validation is not a second mutation run.
- **Stale saved data:** separated recipe storage from run handles; defined fresh
  resolution, leases and dependency revisions, including invalidation after writes.
- **Permission laundering:** each leaf retains current host checks; compound labels
  and previous approval never enlarge authority.
- **Review bottleneck:** separated deterministic checks, conditional semantic
  review and final visual proof; reusable algorithm success does not certify new art.
- **Retry corruption:** no automatic replay of uncertain writes, no new whole-scene
  rollback requirement, and no implicit durable workflow-resume promise.
- **False recording completeness:** durable acknowledgement and explicit storage
  failure replace assumptions of zero-loss logging; product completion is independent.
- **Misleading performance claims:** preserved differing workload counts and nested
  timing semantics; application work and harness probes have distinct owners.
- **Governance drift:** future specs/Inspector must describe the new implemented
  contract; this proposal neither changes current authority nor closes old partial
  acceptance. Review remains limited to the named owners and acceptance cases.
- **Two competing tool formats:** following user review, primitive and composed
  tools now explicitly share the entire common registration contract. The package
  specification defines both; provider projections and persisted manifests reuse
  it without copying common metadata into a separate recipe catalog.
- **Unreachable authoring specification:** added the embedded discovery-to-schema
  path and a registered submission capability. Markdown and developer skills are
  not required model inputs; they do not replace executable contracts.
- **Registration mistaken for successful reuse:** separated candidate admission,
  explicit execution, evidence-based promotion and durable availability, including
  save failure after successful work and reload without automatic mutation replay.
- **Provider catalog timing gap:** a new candidate is invokable through an existing
  advertised dispatcher; the design does not assume native tool hot registration.
- **Repair race and metadata invention:** specified immutable submission/revision
  receipts, exact binding errors and host-derived identity/dependency/effect data.
- **Unbounded control-plane nesting:** exclude registry/library management from
  recipe steps through canonical eligibility metadata. Integrate the existing
  dispatcher before advertising authoring so a successful submission is usable.

Remaining implementation proofs are real gates: canonical output normalization,
host outbox acknowledgement across reload, no stale handles across mutations,
preserved Undo/interleaving, and demonstrated use of saved tools in a later request.
The plan is approved for sequential execution, not a claim that those proofs already pass.
