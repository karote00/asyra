# Reusable Tool Composition - Superseded History

Historical evidence only. All execution, push, merge, monitoring and automatic
continuation instructions below are superseded. This file does not authorize
work. The active contract is [the current plan](reusable-tool-composition-plan.md).
Previous completion statements describe their recorded scope, not current
whole-product acceptance. Preserve failed and partial evidence as such.

# Reusable Tool Composition

Status: IN PROGRESS - PR 1 and PR 2 merged; PR 3 integration in progress.

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

| Observation                                                                                                | Consequence for this plan                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Completion 2269.476 s; first visible content 244.600 s; 46,763 objects                                     | Measure the complete delivery path, not only a faster apply function. Earlier runs contain different generated workloads and are not controlled speed comparisons.    |
| 19 prepared applications: 77.333 s; UI scene-tree projection 24.252 s within 36.227 s synchronous creation | Preserve incremental membership. Profile repeated projection work separately; nested durations must not be summed.                                                    |
| 19 recipe assessments: 592.956 s, ten failures; three final canvas assessments still needed                | A model review per artifact is not established as beneficial. Structured review needs current attachment context and narrower admission.                              |
| One batch input: 2,324,430 bytes of expanded target keys; 23 distinct key-list groups                      | Fix producer-to-consumer references. Identical list retransmission was not demonstrated in this run; large payload and repeated serialization are separate questions. |
| No live use of `retain_design_targets`                                                                     | Exposing a capability does not establish that the normal workflow uses it.                                                                                            |
| Child completion restores stale parent wording                                                             | Purpose freshness and observed execution phase are different contracts.                                                                                               |
| 69/70 records complete; browser record ends at 1827.215 s                                                  | Missing final evidence prevents exact browser settlement timing. The failed live batch was not retained, so the triggering condition is unproven.                     |
| Recording probes: 82.103 s over 2,091 observations                                                         | Harness overhead must be measured separately and reduced at its owner. It is not product idle time or guaranteed removable wall time.                                 |

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

| Owner                                    | Responsibility                                                                                                                                           | Forbidden responsibility                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `@asyra/ai-agent-runtime`                | Recipe format/validation, operation references, composition lifecycle, invocation causality, generic storage interface and diagnostics delivery protocol | Design geometry, concrete App selection, renderer access, granting permissions       |
| Design tool registry and server adapters | Current operation schemas, outcome decoding, effect/resource metadata, operation search, deterministic preparation checks and primary-agent review                             | A second generic recipe interpreter or parallel capability catalog                   |
| Design Feature/common APIs/Core          | Current document resolution, retained target ownership, finite writes, recovery, grouped Undo and persistence                                            | Executing arbitrary generated code or trusting saved IDs as current authority        |
| Host persistence adapter                 | Private durable recipe store and diagnostic outbox using existing host facilities                                                                        | Automatically loading recipes into document content or copying credentials into them |
| Design UI                                | Project current purpose/phase and library management into the existing panel                                                                             | Inferring execution state from a timer or inventing a successful outcome             |

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
4. **Preflight:** resolve current inputs and deterministic domain checks without any
   model request. Unresolved appearance stays with primary-agent result review. Read-only preflight
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

| Information                                                           | Producer and validation                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose, meaningful parameter names, desired bindings and limitations | AI proposes; host validates format and representability without pretending to prove design quality.                                                                                                                      |
| Required fields and input/output shapes of existing steps             | Canonical registry supplies them through scoped schema retrieval; AI references rather than copies them.                                                                                                                 |
| Public input and output schema                                        | AI chooses the public interface and result bindings; Runtime derives referenced field schemas where possible and verifies declared constraints. New constants/parameters need explicit valid schemas, not guessed types. |
| Stable registered identity and immutable revision                     | Registry assigns/resolves them under existing naming rules, checking collisions and expected prior revision. Display wording is not authority to overwrite another tool.                                                 |
| Dependency revisions, effects, permissions and artifact lifetimes     | Host derives and checks them from canonical dependencies. AI cannot self-certify them or reduce leaf restrictions.                                                                                                       |
| Validation and execution evidence                                     | Actual validator/executor records, bound to the candidate revision; never accepted as model-authored proof.                                                                                                              |

### Handoff receipts and repair loop

The following names describe required receipt meanings, not finalized wire names.
Every response uses the common outcome contract and a bounded payload.

| Handoff                        | Consumer receives                                                                                                                  | Failure and recovery owner                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Discover to schema retrieval   | Exact identity, applicability, availability and current contract revision, with a scoped retrieval route                           | Registry reports unavailable/ambiguous choices; no silent name substitution.                                     |
| Schema retrieval to submission | Required fields, typed binding grammar, applicable input/output schemas and exact revision; one bounded valid example where useful | Definition delivery distinguishes already delivered from missing; explicit scoped refresh recovers lost context. |
| Submission to admission        | Proposed interface/steps and submission identity, with referenced revisions                                                        | Runtime returns structured issues before registering executable behavior.                                        |
| Admission to registry          | Immutable validated descriptor/recipe, dependency digest, candidate identity/revision and invocation route                         | Registration conflict leaves existing entries unchanged and returns the current revision or exact collision.     |
| Registry to execution          | Candidate reference plus fresh arguments and current run context                                                                   | Existing invocation/host checks enforce freshness, resources, permission and actual input/output validity.       |
| Execution to promotion         | Settled receipts and applicable assessments for that exact recipe revision                                                         | Runtime keeps partial, failed or unknown runs as evidence without marking reusable eligibility.                  |
| Promotion to persistence       | Descriptor, recipe, dependency evidence and eligible state                                                                         | Store returns durable acknowledgement or explicit save failure; retry saves only, never reruns steps.            |
| Next request to reuse          | Revalidated eligible descriptor from the local library, retrieved through ordinary discovery                                       | Changed/missing dependencies suspend that entry; return why and the supported repair route.                      |

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

### 2. Tool checks, primary-agent visual review and retained results

The current user direction supersedes all earlier semantic-assessor cards in this
plan: preparation checks MUST NOT invoke a model, including failures, missing
inputs, retries or fallback. The primary drawing agent reviews actual rendered
results and may iterate as often as necessary. Its ordinary continuation is not a
nested assessment request. Do not install an independent visual assessor in the
normal drawing tool dispatcher either.

Reuse the preparation compiler's admitted geometry, coordinate, reference, key,
limit and explicit numeric requirement checks. Do not invent aesthetic thresholds,
infer that repeated windows are erroneous duplicates, or assume adjacent shapes
must join. Undeclared visual relationships remain unverified. Tool pass certifies
only enumerated program checks, never reference interpretation or appearance.
Repair actionable failures and check again before applying. Exact parent/stamp
admission, cancellation, canonical validation and Undo remain intact.

Retain compact results with stable identity, tool/main-agent provenance, criterion,
scope, evidence references, dependency versions and pass/fail/unverified/stale
state. Store payloads at existing artifact/evidence owners, not in each result.
Normal replies return unresolved/stale items and counts; explicit reads recover
passed evidence. Successful checks accumulate within the request. Results are
not a second document store and never authorize replay of mutations.

A correction invalidates the results depending on changed inputs, including
previous passes and downstream relationships. Invalidation is not a failure or
a deletion of product objects. Unknown change scope invalidates conservatively;
never infer unaffected geometry from IDs or model claims. Reference/source
changes invalidate their bound criteria. Canonical scene changes use the current
browser evidence contract; where it supplies only a whole-scene stamp, visual
results must be marked stale rather than pretending a scoped stamp exists.
Preserve prior evidence for correction guidance, not completion approval.

Check unchanged immutable prepared source once per dependency set. Corrected
artifacts retain predecessor provenance and recheck changed conditions. The
primary agent receives the current worklist, inspects actual output, records its
findings and repeats targeted corrections. Final whole-request visual inspection
remains required; no fixed cap on primary-agent reviews. All consumers must keep
program-check pass distinct from primary-agent visual pass.

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

### PR 1 - Common contracts and recording foundation

Authorized on 2026-10-11. Worktree `.worktrees/ai-tool-contract-foundation`,
branch `codex/ai-tool-contract-foundation`, based on the PR #317 documentation
head `435f4918c99b124e59810267ac6cb63cea39bfbb` (which contains the fetched main).
PR #317 is merged as `04a5e07e3e241d7af0d65fc75c6266cde34b9843`.
Delivery now targets main. The user's sequential-delivery authorization covers
push and merge after current-head applicable CI passes.

The bounded objective is Stage A: one executable tool descriptor and normalized
outcome boundary, reliable diagnostic delivery with explicit incompleteness, and
current-purpose freshness. Generated public API documentation and the bundled
AI action guide must be regenerated with their source contracts; the documentation
bundle version changes, but no installed plugin or runtime dependency is upgraded.
Scope is Runtime registry/types/invocation/profiler,
Design's direct registration, provider/result adapters, activity and host recording
storage, plus their public exports, current specifications, Inspector contracts,
formal tests and release metadata. Discovery is limited to those owners, direct
callers, existing tests and the retained live evidence above.

Preserve secured dispatch, actual resource scheduling, recoverable tool failures,
finite mutation settlement, grouped Undo, authored language, existing model and
effort, and compact provider declarations. Do not implement recipe execution,
recipe storage, target-lifetime redesign, semantic review redesign, scene-tree
optimization, rendering changes or a new live 101 run in this PR.

Prove immutable contract registration and exact output/error/partial classification;
invalid outputs must not trigger replay. Prove ordered durable diagnostic delivery,
reconnect, duplicate receipt, restart, quota failure and terminal completeness.
Prove child closure, sibling/retry/stale events and saving retain only current
purposes. Run focused tests per owner, naming, affected lint/build/tests, current
flow proof and applicable pre-push checks after integration. Self-review the diff
and direct consumers. Push and create a PR for user review only after those gates;
merge only after latest-head applicable CI passes; do not close the whole plan.

First execution card - Runtime registry contract:

- Owner/route: Runtime `describe-action-registry` into Design `compose`.
- Input: host-registered tool definitions; output: immutable canonical descriptors
  and verified invocation contracts, with compact provider projections.
- Invariants: no shared mutable schema, no executor in discovery, no granted
  permissions, no second catalog, no automatic retry of a completed/uncertain write.
- Cases: descriptor mutation isolation, malformed output, outcome preservation,
  provider projection size, all advertised tools with a declared result contract.
- Boundary: Runtime registry/types/invocation and direct Design definition adapters,
  public exports, current tool spec, matching Inspector routes and formal tests.
- Failure owner: registration rejects malformed descriptors; invocation reports
  invalid output with the original settlement evidence and never repeats execution.
- Gate: formal registry/invocation tests and Design adapter contract tests, then
  affected type/lint checks and naming before advancing to recording delivery.

Direct-consumer correction - Runtime Atlas registered action:

- The existing six-case browser gate fails at the AI case after required tool
  metadata becomes mandatory. Its isolated canonical test reproduces the same
  registration failure before this correction.
- Add the real output, revision, effect, resource and lifecycle fields to the
  existing `set_visibility` definition in the website Runtime Atlas harness.
  Preserve its public Runtime dispatch, one transaction and actual visibility
  result; do not change the website interaction or introduce a legacy fallback.
- Boundary: `apps/asyra-framework-site/lib/runtime-atlas/runtime.mjs` and its
  canonical regression test. This is a direct consumer of the changed contract.
- Gate: isolated canonical case and the existing six-case browser acceptance,
  followed by affected website validation. The current Atlas harness ownership
  and detached-evidence flow remain unchanged.

Activity execution card - Design `settle`:

- Evidence: live status at 10:45:25.426Z restores the earlier bamboo commentary
  immediately after the spire operation. This is stale request-level purpose, not
  evidence that the spire's canonical application continues.
- Input: ordered authored request/call messages and observed owner phases. Output:
  current phase with a still-valid purpose; no language inference or model request.
- Distinguish stable request objective, transient request commentary, and explicit
  call purpose. New authored call work supersedes earlier transient commentary.
  Inherited purposes resolve from active ancestors at projection time, rather than
  becoming fabricated call-authored copies. Closing a call cannot revive superseded
  commentary. Existing genuinely authored live parent/sibling purposes remain valid.
- Boundary: activity-state.ts, presentation tests, current execution spec and settle
  Inspector conditions. Preserve lifecycle precedence, ordering, retry and loop
  deduplication. Do not change producer language or infer freshness from wording.
- Cases: exact bamboo/spire event ordering, inherited parent after request update,
  authored parent/sibling retention, stale/retry events and saving/terminal state.
- Gate: presentation suite, then direct conversation consumers and execution proof.

Recording execution card - Runtime `observe`:

- Input: immutable ordered records, a host-owned durable outbox and collector
  acknowledgements; output: complete durable receipt or explicit incomplete evidence.
- Persist before sending. Keep admitted records until the matching terminal
  acknowledgement. Network failure suspends delivery, not capture; a bounded retry
  or host reconnect resumes the retained stream without repeating product work.
- Outbox recovery is independent from the product AbortSignal. Memory capacity
  bounds pending persistence, not all historical records. Quota/write failure is
  explicit and cannot certify completeness. No unbounded retry timer is added.
- Node collection acknowledges durable checkpoints, validates matching duplicate
  sequences and reopens persisted streams after process restart. Terminal receipt
  requires the contiguous terminal record and a successful durable checkpoint.
- Boundary: Runtime profiler delivery/records and Node collector/sink, Design host
  IndexedDB adapter/startup/HTTP route, their existing tests and current contracts.
- Cases: offline capture, reconnect, lost/foreign acknowledgement, sink and process
  restart, quota exhaustion, missing sequence, terminal-before-data and disposal.
- Gate: permanent delivery/collector/storage tests, App integration and flow proof.

PR 1 verification and review - 2026-10-12:

PR #319 follow-up execution card - Design `compose`:

- Review the current registered browser/native definitions, their owner result
  adapters and direct handoffs. Preserve the bounded PR 1 exclusions above.
- Contract: the `compose` Inspector requires exact advertised admission and
  preservation of acknowledged/unknown settlement at one recoverable boundary;
  the Tool Specification separates result usability from mutation settlement.
- Inputs are registered schemas, owner receipts and optional diagnostic evidence.
  Output is an accurately classified receipt or recoverable failure, never replay.
- Check empty edit properties against their declared minimum, explicit settlement
  across browser/native wrappers and ordered parts, nested unknown receipts and
  diagnostic exceptions. Result usability and mutation settlement remain independent;
  incomplete parent work cannot be overwritten by successful child receipts.
- Implementation boundary: Design tool-schema/tool-contract/local-tool-invocation,
  local-design-workflow ordered receipt aggregation and their formal tests. No scheduling, rendering, model, recipe or
  retained-data redesign. Existing compose routes and bypasses remain authoritative.
- Add failing regressions before implementation. Then run owner and direct-consumer
  tests, affected lint/type/build and current flow proof; review the bounded diff.
  Stop for a genuine new owner or contract change outside this PR's scope.

Follow-up direct-consumer and mutation-proof cards:

- The compose regressions pass. Its real owner fixtures now check successful and
  partial results against their advertised input/output contracts. This exposed
  a missing inspection identity list on the source-changed review branch; preserve
  that list rather than weakening the output schema.
- The existing release consumer typecheck fails on the new required registration
  fields (CI job 114526707578). Update only its registered `set_counter` example
  with real contract metadata, then run the packed clean-consumer gate. This is
  a direct consumer correction, not a release or dependency change.
- Mutation proof: the current `mutate` Inspector owns the basic-api-cases fixture
  and requires exact declared receipts and ordinary Undo. Add output-schema checks
  to its existing per-API real-browser scenarios, retaining every semantic oracle
  and cancellation assertion. No production mutation or scheduling changes.
- Gate: all registered basic API scenarios, affected App checks, naming and current
  flow proof. Stop if an unrelated product behavior would need changing.

PR #319 follow-up verification:

- Fixed declared object property-count admission, explicit settlement propagation
  through browser/native and ordered-part boundaries, diagnostic exception isolation,
  source-change review inspection identities and the packed-consumer registration.
- Permanent regressions failed before each behavior fix. The final source-verified
  scoped run passed dependency/shared checks, full Design lint/build/tests (478 AI
  browser, 907 server, 463 other Vitest and 162 Node cases), 152 real basic-API
  input/output scenarios within functional E2E (392 passed / 19 conditional skips),
  collaboration (14 / 3), rendering contracts (3) and the 19-package clean consumer.
  No flaky pass. Evidence: `tmp/local-validation/pr319-review-verified/result.json`.
- The standalone packed-consumer fixture has no workspace selector; its exact
  `release:consumer` gate ran explicitly alongside the affected-owner local runner.
  Earlier canceled/failed validation records are retained, not counted as passes.
- All 23 current flow cases passed; the source assessment is eligible. Bounded
  review found no remaining mismatch in the reviewed contracts and direct handoffs.
  Opaque result leaves retain the limitations in the Tool Specification.

- Runtime: 202 tests passed, with affected lint/build and public export checks.
  Design: 474 AI browser tests, 885 server tests, 463 other Vitest cases and
  162 Node tests passed; eight server cases retain their explicit opt-in skips.
- Browser acceptance: Design functional 392 passed / 19 conditional skips,
  collaboration 14 passed / three conditional skips, rendering contracts three
  passed; website 102 passed / five conditional skips. No flaky pass was reported.
- Current flow: all 23 owner cases passed on source candidate
  `3eabec6b-63a1-4c8d-ad52-68164787e7f2`; integration assessment
  `df493fd5-48c0-410f-8562-885e33273364` is current and eligible.
- Shared checks, dependency/declaration checks, Runtime, Design, website and
  Inspector validation passed. Source-verified evidence is retained under
  `tmp/local-validation/3f11f420-17e3-43c5-87f0-185bd6049aaa`,
  `tmp/local-validation/delivery-remaining`, `tmp/local-validation/delivery-final`
  and `tmp/local-validation/delivery-e2e`. Failed checks remain in their original
  runs; their corrected replacements passed. Unchanged owner results were reused
  only after input hashes matched. The final E2E source check passed.
- Bounded review corrected classified-output error wrapping, explicit native and
  browser settlement preservation, recovery admission races and the Runtime Atlas
  direct consumer. Permanent tests reproduced the contract failures before fixes.
  The partial-refinement E2E now asserts the precise schema error as well as
  retained drawing and one Undo/Redo; no assertion or validation was removed.
- Generated public documentation, bundled action guidance and the Inspector
  workspace projection are synchronized. Opaque result leaves, storage quota and
  corrupt/incomplete streams remain explicit limitations rather than success.
- The App model and effort are unchanged. No recipe execution/library, rendering
  optimization or new live drawing run is included. PR 2 and PR 3 remain planned;
  this verification does not close the overall reusable-tool composition plan.

Before production edits, promote the approved product behavior into current specs
and update the applicable Runtime/Design Inspector steps with exact owners, inputs,
outputs, conditions, bypasses, failure owners, direct contributors and boundaries.
Use existing supported Inspector admission paths and executable cases. This plan
does not claim Inspector admission or runtime verification has already happened.

### Ordered PR boundaries

| Delivery                                                | Included stages and closure boundary                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR 1 - Common contracts and recording foundation (#319) | Stage A: shared registration/output/outcome contracts, invocation diagnostics and durable delivery, current-purpose freshness. Retain its existing validated implementation and review corrections.                                                                                                               |
| PR 2 - Runtime composition and durable library          | Stage C and generic Stage D: typed finite recipes, admission/repair, registry dispatch, nested invocation, host-store interface, eligibility and save/reload. Prove with neutral hosts; no Design-specific geometry or alternate scheduler.                                                                       |
| PR 3 - Design integration and complete acceptance       | Stage B, Design-specific Stage D, Stage E and Stage F: normal query handles, preparation/review reuse, embedded authoring/discovery/storage/management, recorded repeated-work corrections and complete integration acceptance. Every remaining acceptance case must be accounted for before whole-plan closeout. |

Promote current specs and the exact Inspector steps with each implementation PR;
this sequence is not permission to publish unimplemented capabilities. PR 2 starts
from merged PR 1; PR 3 starts from merged PR 2. The final review includes preserved
primitive operation behavior, not only successful composition examples. The user
has authorized the complete plan's final recorded 101 acceptance; it follows the
deterministic integration gates and retains the existing final-reference report.

| Stage                                      | Implementation boundary and completion evidence                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A - Observability and invocation contracts | Runtime invocation/profiler/types, Design result adapters/collector/activity. Test-first lost delivery, typed results and stale purpose; retain complete observable causality before judging later speed.                                                                                                                                                                         |
| B - Current handoffs and review            | Design operation/workflow/preparation/review/retained-context owners and direct tests. Default producer handles, narrow attachment context, scoped review reuse. Prove genuine bounds queries do not expand unrelated siblings or return large lists to AI.                                                                                                                       |
| C - Generic composition                    | Runtime format/validator/interpreter through existing invoke and host scheduler; direct package tests. Ordered typed graph, dependency revisions, partial outcomes, cancellation and finite budgets. Extend existing exact lookup/dispatch to composed entries before exposing submission. Prove portability with a second neutral test host, not another product implementation. |
| D - Durable library and discovery          | Runtime host-store interface, existing Design local host persistence and discovery adapters. Registered submission schema, bounded repair, candidate publication, save, reload, compact search, version eligibility, disable/remove, no captured state or double execution. Add minimal management within existing panel, no separate catalog product.                            |
| E - Large-document integration             | Canonical creation publication and Design scene-tree projection only where recorded repeated work is proved; direct affected tests. Compose domain bulk operations, preserve selection/Undo/remote interleaving and observed drawing updates.                                                                                                                                     |
| F - End-to-end acceptance                  | Deterministic direct-versus-composed equivalence, new-request reuse, failures and the authorized complete recorded 101 run. Report limitations and final references. Full local CI belongs to a later explicitly requested release checkpoint.                                                                                                                                    |

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
8. Tool checks never request a model. Retained results reuse current dependencies;
   new source, parent transform, relevant scene change or requirement invalidates them. Final
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
- **Review bottleneck:** separated deterministic tool-only checks from primary-agent
  result review and final visual proof; reusable algorithm success does not certify new art.
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

PR 1 CI consumer-input correction - 2026-10-12:

- CI run 38161848080 and the local scope CLI both reject the standalone packed
  consumer fixture as an unknown input. The consumer suite itself already passed.
- Bounded owner: the existing release-readiness input relationship and classifier,
  its permanent classification test, and this plan evidence. Recognize the exact
  consumer fixture family, select its release gate, and preserve fail-closed
  handling of unrelated unknown paths. No runtime, Inspector semantics, new
  scheduler or repository-wide CI redesign is included.
- Test first: fixture test/source/manifest changes select release readiness with
  no unrelated workspace, Design E2E or FieldScope profile selection. Then run
  classification/local-selector regressions, actual-head classification, naming,
  scoped shared checks, and retain the already-passed packed consumer evidence
  only if its complete source inputs remain unchanged.

- Verification: the new classification regression failed before the fix; all
  89 classification/local-selector/runner cases passed afterward, as did focused
  ESLint and naming. `yarn validate:local --base HEAD --run` selected only shared
  checks and passed with source verification (evidence
  `tmp/local-validation/c9cbabf6-eaad-4474-9ccf-3a8a30437c39/result.json`).
  Actual PR inputs now select Runtime, Design, the website and Inspector, with
  no unknown paths or FieldScope heavy profiles. Runtime and consumer source
  remain identical to the prior validated commit. Main integration and new-head
  CI remain required before merge.

User-authorized Git policy correction - 2026-10-12:

The user reaffirmed standing authorization for necessary fetch/rebase and safe
source-branch updates within an authorized delivery task. Remove the redundant
approval checkpoint from the canonical Git policy and its AGENTS summary. Preserve
exact remote-commit leases, unrelated work, no-push requests, and separate merge
and release authority. This is a documentation-only scope addition; verify the
policy references and shared workflow checks without changing runtime contracts.

PR 1 CI functional-suite deadline correction - 2026-10-12:

- Run 38202123199 on 5f6f235ee reached test 385 of 411 with continued progress
  and no unexpected assertion failure when the 30-minute job deadline canceled
  it. Browser execution began at 04:05:13Z; test 385 began at 04:32:56Z and the
  job was canceled at 04:33:01Z. The prior CI suite completed in about 24 minutes;
  the same local inventory passed with 392 tests and 19 conditional skips in
  16.4 minutes. These are observations, not product performance thresholds.
- Bounded correction: allow 45 minutes for the functional E2E job, including
  setup, the serial suite, result collection and cleanup. Preserve test-level
  timeouts, single-worker isolation, fail-fast, zero ordinary retries, all
  assertions, report identity and process cleanup. Other job deadlines and
  runtime behavior remain unchanged. The failed CI run supplies the regression
  evidence; workflow/runner contract tests and scoped shared validation check
  the correction before pushing. Exact-head CI must complete before merge.

### PR 2 bounded implementation - 2026-10-12

PR 1 merged as `d3ee5d410de92ec8a4f161f4142ffeadc7e0132f` after its
latest-head applicable CI passed. PR 2 starts from that main revision in
`.worktrees/ai-reusable-tool-runtime`. The selected task is Ordered PR boundaries,
PR 2; this conversation retains final closeout ownership.

Scope: Runtime typed admission, same-registry composition invocation, revisioned
request visibility, host-injected artifact lifetime and durable library adapters;
their direct tests, exports, current specification, package guide and dedicated
Inspector contract. Discovery is limited to those owners, existing invocation,
registry and schema authorities, direct Design consumers (read-only), and the
required repository gates. No Design implementation, provider change, geometry,
arbitrary code execution, dependency addition or new scheduler belongs to PR 2.

The new recipe wire format starts at version 1; it has no legacy migration path.
Tool names remain canonical registry identities. Revisions, request ownership and
submission identities are separate. Composition eligibility is canonical host
metadata, defaulting to unavailable until the host explicitly opts a tool in.
Schema annotations classify request/document references and secrets; the validator
rejects saved literals of these types instead of guessing from ID-shaped strings.

Owner order: admit -> register -> invoke -> persist. Admission resolves exact
contracts and validates finite bindings without execution. Registration owns
idempotent submissions and visibility; invocation pins the graph and uses the
existing invoker around every parent and leaf. Persistence consumes exact receipts
and atomic host acknowledgements; it never runs a recipe. Load returns through
admission. Hosts retain security, permissions, resource scheduling and storage IO.

Required gates: focused owner tests, Runtime complete tests/build/lint, naming,
current Inspector source proof and negative proof, public-doc generation/check,
packed consumer and directly affected consumer checks, then selected local
validation before push. Do not repeat unrelated live drawings in PR 2. Review
includes cycles/expansion, non-JSON input, unknown schemas, partial/uncertain
settlement, parent scheduling, reference lifetime, cancellation, concurrent
revision conflicts, lost responses, save-only retry and isolated corrupt reload.

#### Step execution card - admit

- Authority: Tool Specification - Typed recipe admission; Inspector `admit`.
- Inputs: JSON proposal, host limits/validator and current registered contracts.
- Output: immutable admitted recipe/derived contract or bounded path-specific
  repair issues; no registration, scheduling, storage or product writes.
- Conditions: finite ordered steps, exact revisions, opt-in dependencies, proven
  structural bindings. Bypass: invalid input returns issues before execution.
- Contributors: canonical contract descriptors, JSON detachment, host validator.
  Forbidden: model-supplied permissions, string-ID heuristics, JS evaluation.
- Boundary: recipe types/schema/admission, common contract eligibility metadata,
  their formal tests and public exports as listed in the Inspector.
- Cases: valid neutral-host chain, empty/malformed proposals, unsupported schema,
  optional/path/type mismatch, captured reference, future output, stale revision,
  control-plane dependency, oversized expansion and bounded independent issues.
- DoD: formal tests and package build/lint/naming pass; downstream registered
  candidate consumes the immutable result without re-deriving its semantics.
- Stop: an unresolved contract contradiction or a need for an out-of-scope owner.

Self-review: the parent does not enter the host scheduler; child-output ownership
is transferred before cleanup; no success receipt implies durable publication;
unsupported structural proof fails explicitly while ordinary primitive invocation
keeps the host's existing full-schema validator. These handoffs cover the reviewed
PR 1 preservation requirements. Production implementation has not started yet.

Admission slice evidence: 29 new admission cases and all 231 Runtime tests passed;
package build, focused lint and naming passed. The initial missing-module failure
proved the feature was absent, not an existing bug reproduction. Static proof
preserves bounds, required paths, escaped pointers and inherited reference types;
ordinary primitive contracts remain unchanged. The new Inspector manifest was
admitted through `loadContract` with all four owner handoffs. Runtime source proof
runs after the remaining owner cases exist; contract admission is not completion.

#### Step execution card - register

- Authority: Tool Specification - Embedded AI authoring lifecycle; Inspector
  `register`, including all incoming/outgoing artifact routes.
- Inputs: admitted immutable recipe, creating request, submission identity,
  explicit expected revision. Outputs: scoped canonical registry entry and receipt.
- Conditions: identical submission replay is inert; revisions are immutable;
  candidates cannot escape the creating request. A rejected revision preserves
  existing tools. Saved eligibility is a separate persistence-owned transition.
- Allowed: existing registry, admitted descriptors, host-created executors.
  Forbidden: a parallel capability catalog, native provider hot-registration
  assumptions, execution during registration, candidate publication before ack.
- Files: `action-registry.ts`, `types.ts`, `tool-library.ts`, their tests and
  exports; exact implementation boundary in the Inspector.
- Cases/gates: existing registry behavior; scoped discovery/lookup parity,
  expected-revision conflict, immutable older revisions, suspended/retired lookup,
  retry-safe submission; focused tests, build, lint, naming.
- Stop: scope ambiguity or a required out-of-owner mutation. Invocation and storage
  internals remain separate subsequent segments.

Registration slice evidence: all 241 Runtime tests, build, focused lint and naming
passed. New cases prove same-registry private lookup/discovery, immutable revisions,
explicit conflicts, suspension without silent old-version fallback, inert retry,
request cleanup, and expanded-step admission before registration. Scope review
found no new scheduler or execution during submission. Durable publication is not
yet implemented; its future adapter alone will request the eligible transition.

#### Step execution card - invoke

- Authority: Tool Specification - Execution variants and What the model sees;
  Inspector `invoke` and `register-to-invoke`.
- Inputs: exact registered revision, fresh request/input/signal, pinned admitted
  recipes, secured host executor, host schema classifier and lease adapter.
- Outputs: classified receipt with independent settlement and causal child spans;
  exported values retain caller ownership before local cleanup.
- Conditions: pin the full finite graph before writes; common invocation and
  schema middleware surround parents and leaves. Only the host leaf executor
  acquires scheduling resources. Partial/unknown/error stops successors.
- Bypass: cancellation before dispatch produces not-started; a failed invocation
  never automatically retries. No body of a recipe is executable JavaScript.
- Allowed: registered descriptors, typed bindings, existing invoker/middleware,
  host permissions/scheduler and artifact-lifetime adapters.
- Forbidden: parent barriers, second queue, global mutable execution state,
  release of borrowed inputs, inferred successful settlement after a host throw.
- Boundary: recipe execution/types, invocation/common middleware value projection,
  their direct tests and exports. The common middleware extension selects a value
  from an explicit host receipt while preserving the default primitive behavior.
- Cases/gates: neutral host nested scheduler, direct equivalence, exact graph pin,
  invalid output, failed/partial/unknown receipt, cancellation between steps,
  returned/borrowed/sibling handles and cleanup errors; Runtime tests/build/lint.
- Stop: an unresolved lifecycle or downstream schema mismatch; no Design edits.

Invocation slice: the focused 12 cases include a real lease-owner map proving
intermediate release, surviving final/borrowed/sibling handles, and request-end
cleanup. Common middleware now accepts an explicit host-result value projection;
its ordinary behavior is preserved. Completion follows retention and cleanup,
including an already-aborted call's causal identity. Build and focused lint pass.

#### Step execution card - persist

- Authority: Tool Specification - What is saved, Embedded AI authoring lifecycle;
  Inspector `persist`, admitted/registered/execution inputs and reload route.
- Inputs: exact admitted definition, trusted execution receipt, host applicability
  check, bounded store enumeration and atomic compare-and-swap acknowledgement.
- Outputs: durable saved state or explicit unsaved failure; validated reload into
  the same registry; unavailable/candidate entries remain explicit.
- Conditions: only the Runtime-produced complete receipt for this exact recipe
  plus host checks can establish eligible state. The store writes descriptor,
  recipe payload, dependency fingerprints and evidence together. Save-only retries
  never invoke leaves. Restart never executes a definition.
- Bypass: candidates can be saved without evidence but do not auto-publish;
  corrupt/unknown-format/stale-dependency entries are isolated on reload.
- Allowed: same admission/library/registry, immutable definitions and host IO.
  Forbidden: automatic IO at import, captured request data, fabricated success,
  upgrading stale definitions or falling back to an older eligible revision.
- Boundary: `tool-store.ts`, library lifecycle handoff, exports and store tests;
  current specification/Inspector routes. Host storage owns atomic durable writes.
- Gates: saved candidate, successful run/save failure/save-only retry, fabricated
  receipt rejection, fresh-request reuse, dependency invalidation, corruption,
  optimistic conflict and suspension/retirement; full Runtime build/tests/lint.
- Stop: a required storage security boundary outside host-injected IO or an
  unresolved contract conflict. No new database or package is introduced.

Persistence slice evidence: full Runtime 268 tests pass, including ten storage
cases and four captured-flow handoff cases. Generic source proof passed on source
`39f6bbb1ec0e7c68ce39bb662f2ed0799e991896fe59ee7985f47c02aa3055db`;
`prove` rejected exactly `admit.handoff` when control-plane eligibility enforcement
was deliberately removed, then recovered on the same source. Evidence:
`tmp/runtime-proof.log`. This is scoped package evidence, not PR 2 completion.

Bounded review is now limited to the new Runtime diff, existing registry/invocation
consumers, the four lifecycle handoffs and fixed gates. The captured proof keeps
its small neutral host fixture inline because source verification captures the
explicit proof file/config, not arbitrary test helpers. Ordinary storage tests
reuse their separate fixture. No Inspector production behavior was changed.

Lifecycle review: two formal regressions first failed for private-candidate
retirement and partially opened artifact scopes. Persistence now reads the host
registry's lifecycle metadata without relying on model-visible discovery; the
invoker cleans the exact call scope even when opening throws. Host release is
idempotent and must tolerate an absent or partly initialized local scope. The
registry metadata API exposes no candidate descriptor or executable body. These
changes remain within persist/invoke ownership and direct registry handoff.

Final owner review also completed the canonical machine-readable proposal schema,
explicit saved-candidate resume and local composition removal. Reload rejects an
incomplete inventory and avoids silently restoring an older corrupt tool family.
Formal regressions cover these handoffs; no model calls or product mutations run
during save/load/resume. The host adapter and model-facing authoring operations
remain PR 3 work, as planned.

Final validation sequence: build declarations before generating the public API
index, then run the selected local gates. The first shared gate correctly rejected
an index generated before the latest declarations. A final idempotency review
also reproduced a second candidate-resume attempt being mistaken for a changed
submission; resume and load now share the exact-definition restore path. Review
is closed to these lifecycle corrections and the fixed gates, with no further
unrelated discovery. Runtime regression coverage now includes repeat resume and
removed-submission refusal. The earlier partial local validation was cancelled
before final E2E to verify the corrected source consistently.

### PR 3 bounded implementation - 2026-10-12

Base: `dd6757567fcda182c68370569e54f3a6cb7add3c`, merged PR #320.
Worktree: `.worktrees/ai-reusable-tool-design`; branch
`codex/ai-reusable-tool-design`. Association remains Ordered PR boundaries;
this conversation owns final closeout.

Deliver Stages B, Design-specific D, E and F and verify the preserved Stage A
behavior. Scope is the Design AI registry, discovery/dispatch, host tool store,
retained data and review, scene-tree projection, activity/recording adapters,
direct Runtime integration contracts, tests, active specs and Inspector mappings.
No renderer redesign, model/effort change, arbitrary generated code, new dependency,
unrelated app work or global CI redesign. Existing local recording remains local.

Discovery is fixed to the plan's named owners, their immediate producer/consumer
paths and existing formal cases. Reuse merged Runtime mechanics. First establish
successful output versus partial receipt semantics, then wire host library and
same-registry discovery/dispatch before advertising authoring. Complete retained
producer/consumer ownership and review dependency admission before integration.
Prove incremental projection work at its actual publication boundary, then verify
status, recording durability and the local recording probe. Each owner slice has
focused tests; run selected local delivery gates only after integration. Full
recorded 101 acceptance follows deterministic success/failure/reuse gates; final
report includes actual references, workload, boundary timings and limitations.

Design review finding: current `toolSemantics` combines successful output with
partial failure evidence in one `anyOf`. A valid recipe cannot infer guaranteed
successful fields from that union. Do not strip a branch inside the interpreter.
The one common contract will keep `outputSchema` for successful values and an
optional `partialOutputSchema` for a different partial receipt. When omitted,
partial uses the same output shape. Host classification chooses the applicable
schema; malformed successful output never falls back to partial validation.
Composition passes values onward only after successful completed settlement.
Both schemas are immutable, revision-bound and included in stored fingerprints.
Design derives both from its existing definition owner, without another catalog.

#### Step execution card - successful and partial result contracts

- Owner: Runtime `invoke`; Tool Specification - Common contract foundation;
  reusable-tool-composition Inspector `invoke`, `register-to-invoke`.
- Inputs: canonical descriptor, host-classified outcome and actual result.
- Outputs: validated result or invalid-output evidence preserving settlement.
- Condition: success uses successful schema; partial uses its explicitly declared
  schema or the shared shape; failed/unknown never claim successful data.
- Allowed: registered contract, host validator, existing common middleware.
  Forbidden: outcome inference from schema acceptance, write replay, weakening
  successful validation, Design-specific branching in Runtime.
- Boundary: Runtime tool-contract/types, direct tests, specification and matching
  Inspector condition. Design adoption is a subsequent compose-owner segment.
- Cases: success cannot match partial-only shape; valid/invalid partial receipts;
  immutable descriptor; unchanged shared-output behavior; middleware preserves
  acknowledged work and invokes once. Focused Runtime tests/build/lint/naming.
- Stop: a needed outcome/settlement rewrite or unrelated owner change. Do not
  advertise Design composition until schema retrieval and dispatcher work together.

Successful/partial contract slice: formal regressions failed before implementation
and all 52 contract/execution/store tests pass after correction. Runtime build and
naming pass; no Design behavior changed in this slice.

#### Step execution card - registered schema handoff

- Owner: Runtime `admit`, Tool Specification - Typed recipe admission.
- Input: unchanged canonical dependency schemas and typed recipe bindings.
- Output: inert admission or bounded repair evidence, before any executor call.
- Condition: public recipe schemas remain the strict subset. Registered object
  receipts may be open and contain opaque unused leaves. Only declared required
  fields may be projected; every union branch must guarantee a source path.
  Target construction requires a provably disjoint discriminator. All selected
  constraints, reference annotations and uniqueness requirements remain intact.
- Allowed: immutable canonical contracts and existing host validators. Forbidden:
  sample-based inference, arbitrary union narrowing, weakening invocation schemas,
  accepting opaque bound data, control-plane execution or a second tool catalog.
- Boundary: recipe-schema/admission and their formal regression tests, exact
  specification and Inspector admit condition.
- Cases: open result plus unused opaque child, absent/optional fields, conflicting
  union branches, literal and bound discriminators, open-to-closed rejection,
  uniqueness, reference lifetime, unsupported used fields. Run admission tests,
  full Runtime suite/build/lint/naming before moving to Design compose.
- Stop: any unproven schema implication; report unsupported use instead of a
  permissive fallback. Review confirms selected fields retain complete constraints
  and all existing negative cases still fail before product execution.

Registered-schema slice: six new positive handoff regressions failed on the prior
reader; the supported projection passes all existing negative cases. Self-review
added and reproduced a union-wrapper lifetime-erasure case, then fixed annotation
inheritance. Runtime 288 tests, build, lint and naming pass. The original full host
schema remains intact for invocation and literal validation; partial union paths
and unknown selected structure remain rejected.

#### Step execution card - Design successful contract adoption

- Owner: Design `compose`, Shared tool contract specification and Inspector.
- Inputs: existing owner definitions, actual result and host outcome classifier.
- Output: canonical successful schema plus explicit partial schema, with contract
  revision changed to identify the new descriptor; product result data unchanged.
- Conditions: a successful receipt must satisfy the domain output shape; partial
  may use either that shape or explicit interrupted execution evidence. Existing
  failure/unknown and per-owner checks remain authoritative and never replay.
- Boundary: Design tool-contract helper, local-tool-invocation regressions and
  existing advertised owner contract tests, spec/Inspector/plan.
- Cases: real host schema validator, primitive domain success, domain partial,
  interruption evidence, malformed success rejected with settlement preserved;
  inspect every advertised family using existing fixtures. No provider launch.
- Stop: any output regression requires correction at its definition owner, not a
  broad permissive output schema. No authoring tool is exposed by this slice.

Design contract adoption: 270 tests across six native tool families pass. The
partial-settlement regression now constructs both schemas from the same owner
helper instead of overriding only the successful schema. Product schemas and
outcome expectations were not weakened. Contract revision is 2; no prior saved
Design recipe library exists on this branch.

#### Step execution card - durable Design tool store

- Owner: Design `compose` library host adapter; Runtime persistence remains the
  eligibility/reload owner. Product spec: Shared tool contract - Durable library.
- Inputs: host-selected data directory and finite capacity/byte budgets, exact
  Runtime store key/expected version/JSON record. No model-selected file path.
- Outputs: exact committed entry, bounded inventory, or a storage error without
  altering prior data or invoking any tool.
- Conditions: compare-and-swap and byte/count checks in one database transaction;
  acknowledge only after durable commit; reject unknown storage versions and
  malformed entries; interrupted or competing writes cannot overwrite a record.
  Busy IO fails promptly and can be retried by the save-only owner.
- Boundary: server/local-tool-store.ts and its tests, server test runner, matching
  spec and compose Inspector. Provider activation is a later integration slice.
- Allowed: existing Node 24 built-in SQLite, filesystem directory ownership and
  Runtime AiToolStore. Forbidden: new dependencies, arbitrary file access from
  recipes, product replay, process-local-only CAS, silent memory-only persistence.
- Cases: reopen, independent connections, stale versions, lock contention,
  interrupted transaction, capacity/bytes, exact acknowledgement, detached data,
  malformed database/version, idempotent close. Focused tests/lint/typecheck.
- Decision: use existing Node node:sqlite with DELETE journal/synchronous EXTRA
  and zero lock-wait timeout. This avoids custom stale-lock recovery and a new
  dependency; all IO is server-only. Node currently labels this built-in active
  development, so keep it behind AiToolStore and test on the pinned Node version.
- Stop: durable acknowledgement or concurrency proof fails; do not expose save.

Durable host-store slice: nine permanent cases pass, including independent
connections, contention and a child-process exit with an uncommitted transaction.
Server typecheck and scoped lint pass. The adapter is not yet exposed to the model.

#### Step execution card - request-scoped Design library coordinator

- Owner: Design `compose`, Shared tool contract - Durable library. Runtime remains
  the only registry, recipe interpreter and persistence/eligibility authority.
- Inputs: same canonical registry, request identity, real host leaf executor,
  explicit artifact lease adapter, existing schema validator and bounded store.
- Outputs: candidate admission, observed invocation result, independent save result,
  and durable reload/management. No duplicate capability catalog or interpreter.
- Conditions: dispatcher handles primitive and composed entries equally; only leaf
  execution enters the host scheduler. Successful composition attempts persistence
  after host applicability checks. Failed save keeps a bounded genuine receipt for
  save-only retry; failed/partial/unknown/cancelled execution is never promoted.
  Candidates may be saved separately and resumed only through Runtime validation.
- Boundary: server/local-tool-library.ts, direct tests, matching plan/spec/Inspector
  and server test command. Provider/native discovery activation follows this slice.
- Cases: exact contract discovery, submit/bad binding repair, nested serial host
  execution without a parent barrier, successful save and new-request reuse,
  failed-save retry without repeated leaves, partial output, control-plane
  rejection, disable/remove, disposal and request isolation.
- Forbidden: model JS, model permissions, schema duplication, retained receipt
  fabrication, save retry replay, cleanup while started work remains active.
- Stop: unavailable ownership adapter or incomplete dispatcher; do not expose the
  authoring operation until these real provider handoffs are tested together.

Request coordinator slice: nine cases pass, including receipt-capacity admission
before mutation, foreign receipt refusal, nested scheduling, save-only recovery,
cancellation and waiting for active work before releasing the request. Server
typecheck, scoped lint and naming pass. Borrowed registry/store stay host-owned.

#### Step execution card - Design authoring and current discovery

- Owner: Design compose; Shared tool contract - Durable library; existing compose
  Inspector route. Inputs are canonical Runtime grammar, admitted registry and
  request coordinator, host-declared namespace and execution route.
- Output: typed submit/invoke/save/manage controls and existing API discovery that
  sees newly registered/revised/suspended recipes with exact invocation routes.
- Conditions: Runtime grammar is the source of proposal shape, including local
  references. Control-plane tools cannot enter recipes. Submission and execution
  fail independently of saving. Unknown paths produce repair details, never JS.
  Discovery rebuilds its request index only when the host registry generation
  changes; unchanged definitions retain compact-delivery behavior.
- Boundary: local-tool-library/tools, local-operation-tools, scheduler, constants,
  direct tests and server test runner, spec/Inspector/plan and the App backend
  boundary docs to match the already-enforced independent Runtime entrypoints.
- Cases: grammar through native conversion, malformed binding repair, same-lookup
  recipe discovery/update/removal without stale cache, scheduler-free coordinator
  and cancellation, precise execution/storage outcomes, public contract metadata.
- Forbidden: another catalog/interpreter, generated callbacks, arbitrary storage
  paths, making successful parsing imply eligibility, bypassing leaf admission.
- Gates: focused tool/schema/discovery/scheduler tests, server typecheck/lint/naming.
  Provider activation and actual leases require the following integration card.

Authoring/discovery slice: native grammar, bad-binding repair, exact revision
dispatch, save-only failure and control-plane exclusion pass. Discovery regression
proved the former request-static index missed later registrations; generation
invalidation and the bounded tools category now expose current routes. Scheduler
regression proved parent-barrier deadlock, then passed with coordinator access;
leaf scheduling/cancellation gates remain unchanged. Focused suites pass; provider
activation remains gated on real artifact ownership and canonical descriptors.

#### Step execution card - browser-to-host canonical contracts

- Owner: Design compose; Shared tool contract and capability discovery.
- Inputs: concrete App action definitions, the Runtime-selected compact action
  inventory and provider request options. Output: host request actions enriched
  from those same immutable contracts, never executable functions.
- Conditions: names remain the admitted inventory; copy no canvas data, schema
  is computed once per runtime, not per call. Host metadata stays out of model
  turn text and appears only in requested tool definitions. Native wrappers of
  browser actions use the canonical successful result schema, retaining actual
  partial/failure classification and original browser validation.
- Boundary: runtime-input and tests, App action-batch-protocol, local operation
  tools and tests, native provider request projection/tests, spec/Inspector.
- Cases: canonical descriptor equality, no executors or duplicated nested input
  schema, provider options/disposal preserved, no unsolicited model metadata,
  real action-to-wrapper successful output binding. Full App action regression
  catches the intentional contract revision change.
- Forbidden: guessed successful output schema, registering missing contracts as
  composable capabilities, broad model transmission, changing Generic Runtime's
  compact registry.list contract, alternate execution/permission paths.
- Stop: unknown or mismatched canonical metadata; do not infer a usable receipt.

#### Step execution card - guaranteed receipt positions

- Owner: Runtime admit; TOOL_SPECIFICATION typed recipe admission and the admit
  Inspector route. Design transport waits on this canonical schema dependency.
- Inputs: registered original output schemas, exact JSON Pointers, host validator.
- Outputs: proof for a guaranteed prefix item, with its constraints and lifetime;
  following diagnostic items remain independently typed.
- Conditions: an array index requires minItems; prefixItems never implies presence.
  Full array binding checks every reachable prefix and remaining items. Opaque
  selected items fail admission. Runtime-value capture checks use the same index.
- Boundary: Runtime recipe-schema/admission tests, tool specification, Inspector
  admit contract and this plan. No execution, UI, browser schema mutation here.
- Cases: guaranteed first receipt, missing/optional index, different typed tail,
  whole-array mismatch and runtime-value literal capture. Gates: focused admission
  tests, Runtime build/lint; original schema remains the host validation source.
- Forbidden: live-result inference, homogeneous retyping of heterogeneous replies,
  duplicate output payloads, weakening validation or public recipe grammar.
- Stop: ambiguous positional proof; return a binding issue before product writes.

Guaranteed receipt positions: admission regressions pass, including constructed
arrays, optional positions, heterogeneous whole arrays and captured references.
Runtime build/lint pass. Return to Design compose: validate prefixItems in the
shared host validator, retain primary receipt identity and independently typed
follow-up receipts in the native wrapper. Extend the browser contract card's
boundary to its existing compose-owned tool-schema/operation-input-schema and
formal tests. No provider executor is activated before artifact lease integration.

Browser-to-host contracts: 130 wrapper/schema regressions, 17 runtime-input cases
and native turn projection pass. Server typecheck and scoped lint pass (existing
console warnings). Compact descriptors without success metadata remain ordinary
operations only; they cannot enter recipes. Full metadata is authoritative.

#### Step execution card - typed lease handoff

- Owner: Runtime invoke, pinned recipe invocation; TOOL_SPECIFICATION lease
  adapter contract. Consume the already pinned definition and classified result.
- Inputs/outputs: open receives the exact input schema with the input; retain
  receives the exact success or declared partial schema with the returned value.
- Conditions: schemas come from pinned contracts, never a second registry lookup;
  retain occurs before release and only for validated success/partial results.
- Boundary: Runtime recipe-execution and its tests, specification and invoke flow.
- Cases: leaf and nested schema handoff, partial schema choice, invalid success
  not retained, no callback executor leakage; existing lease-order/cancel gates.
- Forbidden: field-name heuristics, guessing reference ownership, new execution
  paths, a no-op lease adapter in the Design integration.
- Gates: focused recipe execution/flow tests, Runtime build and scoped lint.
- Stop: a schema not supplied by the pinned owner; fail before artifact borrowing.

Typed lease handoff: 19 execution/flow cases and Runtime build pass. The schema
is the pinned owner's schema, including partial results, not later registry state.

#### Step execution card - Design artifact ownership adapter

- Owner: Design compose, Shared tool contract / Durable library. Runtime invoke
  calls the adapter; real preparation/query/image owners supply release callbacks.
- Inputs: current request identity, explicit host-published artifact handles,
  pinned schemas, caller ancestry, returned values and canonical freshness checks.
- Output: call-local ownership, borrowed pins, parent/request export and exact
  cleanup. No artifact lookup or ownership inferred from property names.
- Conditions: host annotations identify request references; every handle resolves
  through its publishing owner. Open checks all borrowing before pinning; retain
  transfers all valid exports before local release. Unknown/foreign references
  reject. Capacity never evicts a live dependency. Cleanup is idempotent, failed
  release remains recoverable and request shutdown waits for call completion.
- Boundary: local-tool-leases and formal tests, package test registration, plan,
  App specification and compose Inspector. Actual publisher hooks follow this
  slice; until then no provider authoring activation or no-op lease adapter.
- Cases: child-to-parent-to-request transfer, borrowed/sibling isolation, invalid
  export atomicity, local failure/cancellation cleanup, capacity, foreign request,
  original-schema reference extraction, release failure retry.
- Gates: focused ownership tests, typecheck/lint/naming. Failure owner is compose;
  freshness remains canonical query/artifact owner, never repaired by retention.

Artifact adapter: 12 cases pass, including atomic alias admission, asynchronous
cleanup joining, parent-only export and freshness rejection. Alias handles pin
the original store owner rather than inventing an independent artifact lifetime.

#### Step execution card - prepared artifact publisher

- Owner: Design prepare, Preparation and execution / Composition artifact ownership.
- Inputs: bounded validated draft, current host ownership hooks, immutable compiled
  artifact and target subsets. Outputs: original artifact receipts and owner pins.
- Conditions: publication either registers real release/freshness callbacks or
  removes the unpublished local artifact. Target aliases admit as one batch.
  All reads check caller ownership; explicit release checks all targets first and
  cannot invalidate another call's dependency. Unbound local sessions keep the
  same ordinary request lifetime; the provider must inject real ownership hooks.
- Boundary: design-preparation, direct permanent tests, spec/prepare Inspector.
- Cases: actual prepared source across child completion, target aliases keep its
  owner alive, cancellation clears unused intermediates, publication refusal
  leaks nothing, guarded explicit release and unchanged preparation output.
- Gates: preparation/ownership focused tests, server typecheck and lint.
- Forbidden: persistence of prepared geometry in reusable definitions, fallback
  outputs, schema/geometry changes, ignoring a host ownership failure.

Prepared publisher: real preparation plus ownership suites pass (60 cases),
including child target alias reuse and removal on refused publication. Server
typecheck/lint pass. Provider hooks remain to be connected after query ownership.

#### Step execution card - request-owned retained queries

- Owner: Design apply; retained context and mapping consumer contracts. Inputs:
  current request cancellation identity, canonical workspace/revision and query.
- Outputs: request-owned snapshot/lease; existing query result and work counters.
- Conditions: same-request query reuse stays exact; a different request cannot
  read, consume or release the first request's handle, even in the same workspace.
  Terminal cleanup removes that request's entries only. Freshness and capacity
  stay under the existing query owner; ordinary internal store diagnostics remain
  available without making an unscoped remote capability.
- Boundary: retained-design-context, retained-fill-action, their formal tests,
  App specification and apply Inspector. No geometry/rendering or transport work.
- Cases: forged cross-request snapshot and lease, unchanged same-request work
  counts, wrong-request release, terminal isolation, canonical stale rejection.
- Gates: retained query and fill tests, scoped types/lint. Stop on lost caller
  identity; never infer ownership merely because the workspace matches.

Retained query and consumer regressions pass, including rejection before writes
and preservation of the original request's lease after a foreign invocation.

#### Step execution card - registered structured dependency admission

- Owner: Runtime admit; TOOL_SPECIFICATION Typed recipe admission, Inspector admit.
- Inputs: exact registered schemas, finite recipe bindings and host validator.
- Output: a proven binding or bounded actionable rejection before execution.
- Conditions: distribute common object constraints into declared alternatives
  without widening; resolve local references lazily without recursive expansion;
  preserve forbidden properties, exclusive bounds, patterns and runtime lifetimes.
  Original schemas with their reference scope remain the invocation authority.
- Boundary: recipe-schema, recipe-admission, admission tests, specification and
  admit Inspector. Design's existing library tests consume the real preparation
  definition as an integration proof; no Design executor changes in this slice.
- Cases: actual nested Design preparation with fresh dimensions, forbidden group
  dimensions, unknown references, ambiguous branches, captured references, strict
  numeric endpoints, unsupported constraints and recursive proof termination.
- Gates: failing real-contract proof first, Runtime admission/build/lint, Design
  integration proof and types. Public recipe grammar remains unchanged.
- Stop: an implication cannot be proven; return a precise issue rather than
  discard a constraint or accept based only on one example invocation.

Registered schema proof: 299 Runtime tests, actual recursive Design preparation,
server types and scoped lint pass. Work-count regression proves a recursive
definition is resolved once across repeated source paths. No budget was raised.

#### Step execution card - canonical region query discovery

- Owner: Design compose; exact operation lookup and backend target handoff.
- Inputs: admitted READ_DESIGN_CONTEXT contract, including its current snapshot
  alternative. Output: the unique region query shape and unchanged exact lookup.
- Conditions: derive fields from the registered input, preserve branch/common
  constraints, reject ambiguous or absent region definitions; final dispatch
  validates the complete original contract before any writes.
- Boundary: local-operation-tools and its formal real-contract regression,
  compose Inspector and App spec. No new query index or renderer behavior.
- Cases: actual context action resolves one region with all IDs into one plural
  mutation, invalid bounds and snapshot confusion reject before dispatch,
  ambiguous declarations do not invent a route. Existing narrow query tests pass.
- Gates: operation suite, types/lint, exact flow review. Stop on ambiguity; no
  copied fallback schema or alternate browser API.

Region handoff now passes 108 operation tests against the actual context action,
including pre-dispatch negative cases; no intermediate identity export was added.

#### Step execution card - preparation reference lifetimes

- Owner: Design prepare; preparation artifact ownership and rejected draft repair.
- Inputs: exact preparation definitions and request-owned repair source. Outputs:
  annotated request handles, explicit composition eligibility and real cleanup.
- Conditions: preparation and selection may compose; explicit resource release is
  control-plane. Failed preparation diagnostics remain request-owned for repair;
  successful intermediate artifacts remain call-owned until exported. Full
  capacity refuses new diagnostic retention without evicting existing source.
- Boundary: local-design-tools, design-preparation, design-draft-repair and their
  tests, common schema annotations, preparation spec and Inspector.
- Cases: old handles cannot be captured in saved recipes; fresh handles flow from
  input/earlier outputs; rejected source remains repairable after child failure;
  ownership refusal removes unpublished source; terminal cleanup removes it.
- Gates: preparation/draft/tool tests, real recipe handoff, types/lint/naming.
  Failure owner is preparation; no geometry or browser mutation changes.
- Stop: an identity has no real owner release/freshness contract. Never annotate
  an arbitrary string as a live reference or return an unpublished handle.

Preparation ownership gates pass: 52 preparation/repair cases and 47 native
preparation/library cases, types and naming. Release remains control-plane.

#### Step execution card - native and composition host dispatch

- Owner: Design compose; shared tool contract, durable library and ownership.
- Inputs: current native owner definitions, secured scheduler, current request,
  real artifact owners and Runtime store. Outputs: one registry, native controls,
  common leaf outcomes and exact caller/request reference transfer.
- Conditions: namespace-qualified registry identities avoid ambiguity. Native and
  recipe leaves use the same admission/result boundary and scheduler; the parent
  coordinator cannot hold a leaf barrier. Controls reflect the pinned selected
  contract for nested input/output ownership, never guess reference fields.
  Retain before releasing; disposal waits for both native and composed work.
- Boundary: local-tool-host, library controls, common native owner interface,
  formal host/control tests, package test registration, spec and compose Inspector.
  Provider activation follows the host proof; no model/configuration change here.
- Cases: real prepare-to-retained-target recipe, native-to-recipe borrowing,
  export after nested control completion, cross-request durable reload with fresh
  inputs, control exclusion, failed/cancelled leaf, no barrier deadlock, cleanup.
- Gates: host/library/ownership tests, scoped types/lint/naming, Inspector review.
- Stop: absent actual publication/release or missing reference contract; never
  substitute a no-op adapter, duplicate registry, or second unguarded executor.

Host review: 87 focused host/library/lease/invocation cases pass, including real
prepare-to-target reuse across requests, cancellation and retryable terminal
cleanup. Scoped TypeScript and lint pass. Inspector review
`d96bad62d37a17078155892b8b51c5450fdd211b9e7b611ae12cc577890bc07b`
accepted. Provider activation is not yet claimed.

#### Step execution card - provider activation of the common host

- Owner: Design compose, same native provider and durable local library.
- Inputs: provider calls, exact registered owners, configured local directory,
  request cancellation and acknowledged batch receipts. Outputs: native and
  composed outcomes with actual causal records, dynamic discovery and durable
  reload diagnostics.
- Conditions: one scheduler for leaves, no coordinator barrier; preserve existing
  admission/decoding and partial-effect evidence, authored status and image
  delivery. Request disposal follows settled work. Storage failure is explicit
  and must not prevent built-in tools or replay product work. Assessments and
  connection checks do not initialize a tool library.
- Boundary: local-ai-provider, local-tool-host/store and their formal tests,
  local library limits, model-provider host configuration, env example, App spec
  and compose Inspector. Model, effort and provider isolation are unchanged.
- Cases: provider discovers authoring controls, invokes actual preparation through
  the shared host, shares and reloads a valid recipe, preserves effect receipts
  on failure, retains ordinary tools after unavailable storage, records nested
  causal calls, and closes resources on cancellation/startup failure.
- Gates: focused provider/host/storage tests, server types, lint/naming and
  contract review. Do not activate a second execution or persistence path.

Provider integration review: 293 provider/host/store/control/discovery tests pass
(three existing conditional provider cases skipped); 23 existing flow owner cases
pass with actual provider activation and isolated on-disk test storage. Server
TypeScript and scoped lint pass (existing console warnings only). Inspector review
`8496d9a543dd5cb5229f2aa1ea758ff5df93b730ca4e55ce7758ef83bd681b17`
accepted. Formal provider reuse proves submit, dynamic discovery, invoke, saved
reload, new input, artifact borrowing and complete causal traces. A new trace
assertion detected mismatched child span categories; matching tool start/end and
execution events now preserve zero unattributed lifecycle time. Assessments and
connection checks skip storage; failed open leaves native tools usable, and
startup failure closes the connection. No live model run or PR delivery is claimed.
Evidence: `tmp/pr3-provider-integration.log`, `tmp/pr3-provider-flow-direct.log`,
`tmp/pr3-provider-host-types5.log`, `tmp/pr3-provider-lint3.log`.

#### Step execution card - document identity and opaque input capture

- Owners: Runtime admit and Design compose, current recipe capture contract and
  public basic API schemas. Existing primitive calls retain their input behavior.
- Inputs: declared document identities, field-name lists, polymorphic property
  records and successful owner receipts. Outputs: dependency proofs that accept
  fresh identities and ordinary literal values, but reject saved document IDs or
  opaque captured records.
- Conditions: annotate at each semantic declaration, never infer IDs from field
  names at runtime. Document values do not enter request artifact leases. Keep
  field names, colors and new labels as ordinary strings. Open/opaque leaves lack
  evidence for safe literal capture; require a typed fresh input instead. Do not
  widen public recipe grammar or guess polymorphic output types.
- Boundary: Runtime recipe-schema and admission tests; Design basic API contract
  helpers/core/design/vector declarations, receipt schemas, their formal tests,
  Shared tool specification, App spec and matching Inspector steps.
- Cases: reject saved element/property/vector identities; accept fresh inputs and
  successful created-ID handoff; retain literal field lists and new values; reject
  hidden captured values under an open registered object while accepting a typed
  fresh object input. No changes to API dispatch, rendering or geometry.
- Gates: test-first captures, Runtime admission and build, Design contract/result
  tests, scoped types/lint/naming and contract review before moving owners.

Document identity slice passed 300 Runtime tests and 36 Design contract/action
cases, server typecheck, focused lint and naming. Captured-source candidates
90c88cfe-0ce5-4b49-bb2d-1e0dbd8107b3 and
7ecfb9dc-dc76-480e-96f7-4714be2b8cb7 passed; both contract reviews accepted.

#### Step execution card - canonical batch-operation composition

- Owner: Design compose, existing capability discovery and secured leaf dispatch.
- Inputs: canonical browser basic-API definitions and actual receipt schemas.
  Outputs: the same registered operation can be a typed recipe dependency, using
  the existing plural API and browser execution path.
- Conditions: keep native batch-only exposure. Register exact basic operations
  once in the same registry with registry-only provider exposure; discovery gives
  their registered identity and invoke route without advertising individual native
  functions or expanding the universal batch schema. No parallel schema catalog.
  Recipe invocation uses the same secured owner, scheduler, Undo and review path.
- Boundary: basic-api-actions, local-operation-tools, local-tool-invocation,
  local-tool-host/provider and formal tests, App spec and compose Inspector.
- Cases: real basic creation receipt feeds later selection; captured IDs reject;
  failure never dispatches a successor; canonical basic operations remain absent
  from native function declarations; exact discovery names the usable route.
- Gates: failing integration proof first, focused action/host/discovery/provider
  suites, server types, lint/naming and contract review.
- Forbidden: duplicate contracts, separate registry, direct Core bypass, saved
  document state, adding per-item native tools, weakening result validation.

Canonical batch-operation composition passed: real basic creation-to-selection
and failed-successor proofs, exact semantic discovery to registered contract,
registry-only provider exposure, 110 operation/discovery tests and 169 host/provider
tests (three existing conditional skips). Server types and focused lint pass.
Candidate 46b1cf44-e159-492c-a092-cc8bf52cdd5e and contract review accepted.

#### Step execution card - retained query ownership and compact delivery

- Owners: Design apply (browser retained query source) and compose (existing
  operation adapter and shared leases). Inputs: canonical query receipt, request
  signal, snapshot/lease IDs and current scene revision. Outputs: compact default
  AI query result, typed retained handles, consumer access and actual cleanup.
- Conditions: every delivered reusable snapshot is pinned until explicit release
  or request settlement. New capacity admission never evicts pending consumers;
  current-revision checks remain authoritative. A consumer borrows caller-owned
  leases; only internally acquired leases are released by that consumer. Browser
  settlement releases request data even when cancellation breaks host transport.
  Backend ownership publishes actual browser handles and sends releases through
  the same owner; no duplicated selection, guessed property names or no-op stores.
- Boundary: retained-design-context/tests, context-action/tests,
  retained-fill-action/tests, local-operation-tools/host/provider and tests,
  exact App specs and compose/apply Inspector. No spatial algorithm or UI change.
- Cases: more than capacity worth of page queries cannot evict earlier pending
  results; explicit release frees space; lookup work is reused; reference default
  avoids row transfer; explicit page/columns stay available; stale and foreign
  handles reject; sibling borrowing cannot retire a producer; request completion
  and cancellation clean up the actual browser data.
- Gates: test-first retained-owner cases, focused query/consumer/host integration,
  existing operation/provider tests, types/lint/naming, contract review.
- Stop: a remote release cannot be acknowledged; preserve diagnostic evidence and
  rely only on the browser's formally verified request-finally cleanup on abort.

Query handoff uses the existing common host lease adapter. Its shared ownership
interface moves from preparation to local-tool-leases, permitting asynchronous
browser-owned release callbacks. The operation adapter publishes exact successful
reader receipts, aliases lease to snapshot, guards explicit release before remote
execution, and cleans failed publication through the same browser reader. The
browser transaction-finally remains the cancellation cleanup owner.

Self-review found that a query/release union cannot guarantee a live reference to
a recipe successor. Split only the AI capability contract: read_design_context
always returns live query handles; release_design_context is an explicit
control-plane operation returning historical release evidence. Both delegate to
the same browser retained query owner. Include constants, runtime registration,
startup permission and activity labels as direct consumers in this owner slice.
Batch-only mapping remains registry-only when composition-eligible, just like
canonical basic operations; it is not advertised as an individual native function.

Retained-query slice verified: 301 server cases passed with three existing
conditional skips; 53 browser cases passed. Server and browser production types,
naming and scoped lint pass. The actual query-to-fill composition consumes the
retained result without transferring rows, and removes the intermediate browser
data after completion. Page/columns output preserves its optional identity list
instead of fabricating duplicate data. Candidate
f6d5178f-60b8-4074-b895-8eaff17a54d6 and contract review
cee81486939c7a9313d5458e1cac262552580e1c8d20a6c6829850702e20867f
are accepted. This closes this owner slice only; full PR3 acceptance remains open.

#### Step execution card - retained image products

- Owners: request image artifacts and compose host leases. Inputs: current image
  conversion, artifact identity, relative path/proposal keys and current quality
  policy. Outputs: retained vector, analysis or contour-review handles and exact
  declared results through the common invoker.
- Publish actual artifacts, and alias dependent analysis/review handles to their
  source lifetime. Release removes artifacts, derived reports and matching reuse
  entries; a surviving derived artifact owns its original contour evidence.
  Borrowed source and sibling users remain pinned. Refused publication removes
  only the unpublished result. No input bytes, geometry or attachment indices
  are persisted inside recipe literals.
- Contour analysis and explicit refinement are typed composition dependencies.
  Attachment acquisition/validation/conversion remains a control-plane source
  boundary: its numeric attachment selector belongs to the current provider
  request and is not a durable recipe identity. Relative path/proposal keys are
  ordinary values checked against their explicitly retained parent.
- Boundary: local-image-tools, local-ai-provider, focused image ownership tests,
  existing image contracts, App spec and compose Inspector boundary.
- Gates: test-first actual source cleanup, dependent report pinning, publication
  refusal, native/composed handoffs and cross-request capture refusal; image and
  host tests, scoped types/lint/naming and Inspector review. No decoder algorithm,
  image selection heuristics, App model or renderer changes.

The native cache reuse regression exposed a missing handoff: an existing request
artifact was returned without adding the current call's pin, so export failed.
Extend only the common host ownership adapter with explicit borrowing of an
already-owned ancestor/request artifact. No new artifact copy, capacity increase,
foreign/sibling adoption or inferred ID scanning. Include local-tool-leases/host
and direct ownership test fixtures in this slice; query reuse uses the same borrow.

Image ownership and cache handoff verified: 266 focused image, preparation, host,
provider, query and lease cases passed (three existing conditional skips). Server
types, scoped lint and naming pass. Test-first proofs cover request cleanup,
capacity refusal and the formerly rejected cached return; a real composed
contour-review/component-analysis route succeeds and rejects a captured source
identity. Candidate 546c03a7-1baf-46f3-8116-6fa57e251cd2, source digest
608d80d69a09e7e158cfd93312c5dada5c670c02123ad72c6e6cac903f8f1676,
and contract review d9cbac0a3a3d85df0dcb10ab2bc9bbc48a18910dc8e36f4578d8cc405fe236fd
are accepted. Evidence: tmp/pr3-image-final-tests.log, tmp/pr3-image-types.log,
tmp/pr3-image-lint.log. Final delivery and full 101 acceptance remain open.

#### Step execution card - terminal cleanup settlement

- Owners: Design provider settlement and common host teardown. Inputs: settled
  product return/error, finished native calls, artifact disposal and store close.
  Outputs: the original product outcome plus independently recorded cleanup
  outcomes and duration. Diagnostic cleanup is not a new product invocation.
- Await active tool work, then attempt every cleanup owner. A teardown exception
  must not replace a completed drawing or its original classified failure. Record
  explicit failed host observations and close the cleanup span in every case;
  retain errors instead of inventing successful cleanup. No mutation replay,
  extra model call, retry loop or document rollback.
- Boundary: local-ai-provider/host, their formal tests, App spec and settle flow.
  Runtime's existing host_observation and lifecycle span contracts suffice.
- Test-first: store/host close failure after successful output and after provider
  rejection, preserved original outcome, both cleanup attempts, recorded evidence
  and cancellation behavior. Gates: provider/host/store tests, types/lint and
  exact contract review. Durable browser outbox integration is a separate slice.

Terminal cleanup settlement verified: 186 provider/host/store cases passed (three
existing conditional skips); server types, focused lint and naming pass. Candidate
a87e992f-df42-4b05-ae44-5653b546accd and contract review
ad64c2db27fcbfb5f691e2860e28ae61a3b9800a9979b35b1f995d51bbab2767
are accepted. Evidence: tmp/pr3-cleanup-final.log and related scoped gate logs.

#### Step execution card - stored tool management

- Owner: Runtime persist, plan Library lifecycle and Stage D. Inputs: host store,
  exact saved identity/revision, observed storage version and suspend/retire intent.
  Outputs: compact saved metadata and exact durable state acknowledgement. Listing
  is not admission or permission to execute; no registry is created for the UI.
- Reuse the canonical stored-record decoder and exact-byte acknowledgement.
  Isolate invalid records; expose incomplete inventory explicitly. UI state writes
  require the observed version and reject stale requests, including idempotent
  writes against a different version. Retired revisions cannot revive. Existing
  persistence delegates state changes to this owner and updates its registry only
  after acknowledgement. No recipe execution, automatic repair or migration.
- Public API: createAiToolStoreManagement owns inventory and state-only control;
  existing storage format/key and lifecycle names remain unchanged. No parallel
  catalog. App transport and panel are a later owner segment.
- Boundary: tool-store, public export, existing tool-store tests, Runtime guide,
  TOOL_SPECIFICATION and persist Inspector. Test compact inventory, corrupt entry
  isolation, capacity reporting, stale write refusal, exact acknowledgements,
  preserved candidate/retired behavior and no invocation. Run Runtime tests,
  types/build, lint/naming and current contract review before the App consumer.
- Review downstream admission at invocation entry separately: a suspended stored
  definition must not be callable through an already-loaded request's stale view;
  an already-started recipe stays pinned and is not silently cancelled.

Stored metadata management: 304 Runtime tests pass, including compact inventory,
corrupt isolation, stale observed version, retirement and forged acknowledgement
cases. Runtime build, scoped lint and naming pass. No App consumer is wired yet.
Evidence: tmp/pr3-management-runtime.log and related build/lint/naming logs.

Exact management reads additionally pass without inventory scanning; 20 store
cases pass after the read addition, with build/lint unchanged green. Candidate
13931f56-8d2c-4db4-928b-c7baea71e1b0 and review
d0fea4639cd7a18eb5e3fcd6bfce16bd6292534ca741aa40fa29e4a63fd5d489
are accepted.

#### Step execution card - saved state at invocation admission

- Owner: Design compose library invocation, plan immutable active versions and
  management lifecycle. Inputs: exact request registration and current canonical
  stored metadata; output: admitted pinned run or not-started recoverable refusal.
- Read exact saved state before a new composition starts. Known saved entries
  fail closed on storage loss, suspension or retirement; a private candidate
  whose initial save failed may still run without a durable entry. Existing
  active work keeps its pinned graph; UI changes never replay or cancel it.
- Boundary: local-tool-library and formal library/host tests, compose Inspector
  and App spec. No new catalog, scheduler, model change or browser action.
- Test-first two request hosts sharing storage, external suspension after reload,
  no subsequent writes; storage unavailable and saved candidate retirement.
  Preserve save-only recovery and active-call disposal tests. Check relevant
  types/lint and host/provider suites, then accept the contract before UI work.

Saved-state admission: 22 library/host/control tests pass, including the test-first
cross-request suspension and storage-failure regressions; an active graph settles
after retirement and cannot republish itself. Server types, lint/naming pass.
Candidate bf8881f0-e8f6-41a9-9fcd-bc9ca155a6a0 and review
f47f7d801004acdf81e1d85454abcee2cf7b7925311ba32da6de083f0e3939d7
accepted. Evidence: tmp/pr3-saved-state-tests.log and scoped gate logs.

#### Step execution card - Design saved tools panel

- Owner: compose host management, Stage D minimal existing-panel management.
  Inputs: admitted local same-origin request, canonical compact saved inventory,
  explicit exact-revision suspend/remove with observed storage version. Outputs:
  independent library metadata/acknowledgement or visible error; no model request
  or canvas actions. Existing conversation and drawing controls remain usable.
- Runtime owns stored format and state validation. Host opens the same configured
  SQLite store as the provider; no alternate registry or catalog. A bounded JSON
  endpoint uses existing local request admission before opening storage. Invalid,
  remote or oversized input cannot mutate. Close all owned connections; preserve
  mutation acknowledgement when later cleanup fails and report cleanup separately.
- Panel loads on explicit opening/refresh, scopes updates to the panel and aborts
  pending reads on close. It shows stored state without claiming dependency
  eligibility. Suspend/remove cannot submit recipes, execute drawings or resume
  retired entries. Stale mutation refreshes rather than blindly retrying a write.
- Boundary: shared management transport contract, local-tool-management route,
  existing Vite plugin registration, conversation-panel mounting, saved-tool panel
  and their tests; tsconfig server include, App spec/Inspector. Existing library
  limits supply storage capacities. New endpoint belongs to the shared transport
  module; persisted store format is unchanged.
- Cases/gates: local/remote/origin/method admission, bounded body, malformed input,
  current/stale durable state, no model invocation, read failure, component open/
  refresh/close and state writes, unaffected conversation suite. Types/lint/naming,
  current contract review; full recorded 101 is a later acceptance gate.

Saved-tool panel verification: 44 focused browser/conversation cases and 20 host/
store cases pass; App typecheck, scoped lint and naming pass (the host diagnostic
console warning remains non-failing). One formal Chromium E2E passes in 10.8 s,
with controlled management transport data, no drawing request and unchanged Undo.
Its screenshot was inspected: list stays within the panel width; prompt/Send/Stop
area and close controls remain accessible. URL: http://127.0.0.1:3300; temporary
Playwright-owned services exited with no remaining listeners on 3300/3401/4401.
The actual Runtime durable state and stale-write paths are separately covered by
host tests; the screenshot is not evidence of model recipe authoring. Formal new
cases are included in ordinary App scripts. Evidence: tmp/pr3-management-app-*.log,
tmp/pr3-management-visual.log and the saved-tools.png E2E artifact.

Saved-tools panel contract candidate 40a395d1-4458-46b6-b5f2-8aebdacf746f and
review 603e690652ab9e028eca9f06f30da820639367550039daa65d9017fd1f5102e2
are accepted. This closes management UI only; remaining carryovers and full
recorded acceptance remain open.

#### Step execution card - durable recording gap evidence

- Owner: Runtime observe and host outbox storage adapter. Inputs: immutable producer
  sequence, capture/storage failure and durable outbox control acknowledgement.
  Outputs: normal persisted records or compact durable missing-range metadata;
  recovery must never certify a stream with a retained gap as complete.
- Reserve a fixed small control record before first payload capture. On failure,
  replace reserved padding with bounded range and capture/storage flags, merging
  further missing ranges without an unbounded list or retained error text. This
  reports the enclosing range, not reconstructed lost records or an exact count.
- Browser adapter uses a reserved negative sequence key inside its existing
  diagnostic database, excluded from payload reads and included in request
  enumeration/removal. No document storage or database migration is needed.
  Payload sequences cannot overwrite the control key. Closing/reopening retains
  gaps. Recovery reports them and preserves partial evidence without completion.
- Quota failure may also prevent the reserve or gap write. Report that separate
  storage failure explicitly; no lossless guarantee, write replay or success
  fallback. Runtime delivery remains independent from product cancellation and
  cannot block tool completion. Keep finite pending memory and retry policy.
- Boundary: Runtime record-outbox/record-delivery/public types, existing delivery
  tests; browser outbox adapter/tests, direct startup consumers; observe Inspector
  and recording spec. No collector protocol bypass or synthetic missing events.
- Test-first persistent gap after storage failure and capture capacity refusal,
  restart refusing completion, reservation failure, control exclusion, bounded
  merge/padding, removal and existing offline/duplicate/acknowledgement scenarios.
  Gates: focused Runtime delivery/collector and browser outbox/startup tests,
  builds/types/lint/naming and exact contract review.

Durable gap slice verified: all 310 Runtime tests pass; focused delivery18,
collector2, browser outbox/startup10 and an additional real-browser-storage quota
integration case pass. The final outbox file has8 passing cases. Runtime build,
App typecheck, scoped lint (existing proof console warning only) and naming pass.
The burst proof records100 capture refusals with one reservation and one gap
write. Reserved control serialization does not grow when padding is replaced.
A quota-failed payload remains absent after reopen; available payloads stay intact
and recovery explicitly refuses completeness. This is not a guarantee that quota
permits every control write. Candidate5f9004d5-8126-4265-bc66-dcbcf0c6ef22,
review2a803b9573d54e9add9ddd51615720da635053b8b9c5a9aa7f43a096953e8c46
accepted. Logs: tmp/pr3-record-gap-*.log.

### PR 3 Step Execution Card - Incremental UI membership projection

- Owner: `apply`, Preset UI-context projection downstream of the canonical Scene
  Tree publication. Spec: carry-over 5 and Preset Runtime subscriptions. Inputs:
  exact owner-scoped changes and the current immutable UI map/flattened identities.
  Outputs: the same immutable rows, membership order and flattened UI snapshot.
- Evidence: the saved run attributed 24.252 s to projection. Current fixed
  16/320/1280-item applications publish 2/11/41 batches; hierarchy preparation
  currently reads every prior row on every publication. Baseline profiles are
  `tmp/pr3-application-baseline-{16,320,1280}.json`. Timings are supplemental;
  permanent read/work-count and equivalence tests decide correctness.
- Retain only derived identity membership (parent identity and child lists), at
  the existing observer lifetime. Key: exact previously published map and flat
  array identity. Apply admitted deltas to affected memberships. Row replacement,
  file load, another observer, failed projection or disposal invalidates reuse.
  Cold use derives from the current projection, never scans canonical objects.
  Noncanonical/incomplete membership cannot be retained as a complete candidate.
  Old published rows and child arrays remain immutable. The public flat array
  still requires complete ordered identity materialization; count this separately
  from row reads or membership reconstruction, without claiming constant work.
- Contributors: canonical Scene Tree event owner, Preset projection and existing
  UI subjects. Forbidden: App-owned mirror tree, renderer changes, frame delays,
  larger batch limits, second rollback manager or changed ordering semantics.
- Boundary: `packages/preset/src/subscriptions/data-channel.ts`, its existing
  `selection-subscriptions.test.ts`, Preset spec, current App apply contract and
  direct prepared-application E2E work-count assertions. Failure remains with the
  Preset projection owner; an interrupted derived candidate is discarded.
- Cases/gates: test-first repeated publications must not reread untouched rows;
  compare exact ordering and immutable snapshots over add/move/remove/restore,
  property-only updates, external reseed and observer replacement. Existing
  selection/Undo/remote/load tests remain applicable. Run focused Preset tests,
  naming/lint/build, fixed browser workload and saved-large-document integration.
  Stop on semantic drift or unexplained workload; do not broaden rendering scope.

Self-review: full flat-array production remains legitimate public output work.
The change removes repeated row decoding and reconstruction, not the output or
transaction boundary. Retention is observer-private and only reusable with exact
published identities; synchronous re-entry cannot reuse an in-progress candidate.

Focused fixture review: the unchanged-row regression was reproduced before code
and now passes. The expanded equivalence fixture initially used structural events
for computed changes and value-equal `uiContext.set` calls as identity replacement.
Those do not exercise the claimed boundaries: computed changes use their local
computed event route, and the property registry suppresses value-equal writes.
Before further iteration, the fixture was corrected to use ordinary computed
events and the existing subject publication API for explicit projection reseeding.
No production routing or equality suppression changes are authorized by this test.

Owner review additionally reproduced a real raw-hierarchy classification gap:
`UPDATE_ELEMENT_DATA` applied parent/children changes but did not mark hierarchy
output dirty. Both raw and computed routes now use the same hierarchy-key rule;
the formal mixed edit sequence covers each route. A no-op ordered move also
proved that value-equal flat output keeps the registry's old identity; retention
uses that acknowledged identity rather than rebuilding on the following edit.

Evidence: 212 Preset tests pass, including cold-versus-retained exact rows/order,
immutable earlier snapshots, raw/computed edits, incomplete membership, reseed
and observer replacement. Preset build and scoped lint pass. The unchanged-row
regression previously read 192/6,144 parent values for 32/1,024 unchanged rows;
it now reads zero on the successor publication. Browser prepared workloads
16/320/1,280 pass with one membership preparation and 20/342/1,362 row reads.
Projection phase totals on this local run were 0.5/2.4/10.3 ms versus the earlier
0.6/3.5/16.5 ms; these are observations, not cross-machine budgets or model time.

The saved 18,287-element Taipei 101 passed load, sequential creation, Undo/Redo
and exact document restoration. The first structural edit read 18,289 rows;
subsequent creation, Undo and Redo each read two, with no membership rebuild.
All complete flat identities are still published. The fixture's documented
ignored gzip was regenerated from the tracked ZIP after an initial missing-file
test setup failure. No fixture, watchdog or runtime budget was weakened.
Logs: `tmp/pr3-projection-*`; profiles: `tmp/pr3-application-after-*.json` and
`tmp/pr3-projection-large-membership.json`. Test-owned services exited.

### Design integration - inspect owner - source context and conflict continuity

Step Execution Card:

- Owner: `inspect`, review coordinator. Sources: Prepared recipe review in the
  App execution spec and preparation/review carry-over in this plan. Inspector
  inputs are retained prepared source, current requirements/reference evidence,
  prior findings and source dependencies; outputs remain prepared-review evidence.
- Scope: review a named part within the complete retained source context. A part
  selector narrows assessment coverage, not coordinate, prototype or ancestor
  evidence. Identical review reuse requires the whole source, selected coverage,
  compilation findings and current evidence to match. Unknown or partial findings
  cannot erase a known conflict for the same immutable source and dependencies.
- Inputs/contributors: actual retained recipe and the existing request evidence
  owner; isolated tool-free assessment. No canvas mutation, model-generated
  geometry repair, new schema bypass, hidden appearance approval or alternate
  registry. Direct known-value edits retain their existing review bypass.
- Boundary: local-prepared-design-review.ts and its formal tests, App spec and
  inspect contract. Failure owner is inspect. Source fingerprints and attachment
  scene capture are separate follow-on obligations, not claimed by this slice.
- Tests first: identical selected child under changed containing transform must
  not reuse an assessment; model packet must preserve ancestor/prototype context;
  an unknown whole review must preserve a known scoped contradiction. Existing
  exact reuse, scoped coverage, async freshness, deterministic findings and
  request evidence invalidation remain required. Run focused tests, types/lint,
  naming and Inspector contract comparison before advancing.
- Stop: no cache lifetime expansion or source owner mutation in this slice.

Self-review: selecting a child alone loses the context needed to interpret its
coordinates and references. Keeping the retained source as assessment input makes
coverage explicit without fabricating a dependency closure. A newly prepared
source or changed evidence requires fresh review; unchanged unknown findings do
not resolve an already established contradiction.

Evidence: both added regressions failed before implementation. Named-part review
now retains complete source context and never reuses a changed containing source.
An unknown whole review retains the prior scoped conflict, including its coverage
and original finding in the result. Existing reuse remains exact and request-local;
the Inspector now documents the already-existing assessment cache dimensions.
152 focused prepared-review, operation and preparation tool tests pass. App type
checks, scoped lint and naming pass. Logs: `tmp/pr3-review-context-*`. This closes
source-context/conflict continuity only; canonical attachment capture remains open.

### Design integration - inspect owner - canonical attachment evidence

Step Execution Card:

- Owner `inspect`; preparation/review carry-over and App Prepared recipe review.
  Read the actual attachment parent through the existing Core facade and capture
  it using the canonical inspection evidence owner. A new read-only
  `read_design_attachment` action returns workspace/parent identity, local bounds,
  the parent-local basis in workspace coordinates, and a current evidence stamp.
  Workspace basis is identity. Ancestor metadata proves containment and container
  capability; no subtree or document snapshot is read.
- `review_prepared_design` accepts optional parentId, resolves it before assessment,
  supplies the captured context to the model, and revalidates its stamp afterward.
  Its retained review includes this attachment and the existing exact dependencies.
  Application must use the reviewed parent and pass its evidence to the browser;
  the subsequent apply-owner slice will verify this immediately before mutation.
- Allowed contributors: existing Core facade, canonical evidence observer,
  registered action dispatcher and isolated semantic assessor. Forbidden: Pixi
  access, guessed transforms, server-only scene revisions, global scene scans,
  implicit visual approval and a second registry. No missing-context fallback.
- Boundary: inspection-evidence.ts, inspection.ts and formal tests, action
  constants/metadata and existing runtime registration, local-prepared-design-review
  and local-operation-tools with tests, current specs/Inspector. Ownership of
  browser mutation admission remains with apply, not this reader.
- Cases/gates: nested transformed parent, workspace identity, deleted/foreign or
  cyclic ancestry, cancellation, scene change during review, changed target and
  exact evidence reuse. Test-first missing context/target mismatch; App focused
  tests, types/lint/naming and contract comparison. Stop on unavailable canonical
  geometry; return a recoverable error rather than invent evidence.

Self-review: the stamp is global and conservatively expires on any canonical
change. No target-local cache claim is made. Runtime-local freshness is insufficient
at the final browser queue boundary, so delivery must retain the stamp for apply.

### Design integration - apply owner - reviewed attachment admission

Step Execution Card:

- Owner `apply`, consuming `artifact:prepared-review` with prepared source through
  the existing browser action boundary. Spec: Prepared recipe review, current
  coordinate/attachment and canonical permission contracts. Inspect supplies
  parent/workspace/stamp; apply is the final failure owner before mutation.
- Exact output: unchanged plural native application/receipt on current evidence;
  a recoverable pre-write rejection on expired, foreign or unavailable inspection
  lifetime, changed workspace or changed parent. Unreviewed direct known-value
  actions retain their existing deterministic checks and bypass semantic review.
- Check immediately before the first mutation, without an intervening await.
  Own subsequent writes legitimately advance the global stamp; do not reject
  the remaining slices because of those writes. Existing per-slice workspace,
  container membership, lock, cancellation and partial-settlement checks remain.
- Contributors: Runtime-local inspection evidence owner and existing public App
  APIs. No model-authored refresh, automatic replay, transaction wrapper, renderer
  access or admission fallback. The server attaches evidence after preparation
  expansion; it is not an editable model-side artifact argument.
- Boundary: design-actions.ts and formal tests, runtime-input registration,
  inspection-evidence type, App spec and apply flow. Test-first stale/foreign
  stamp and target changes produce zero writes; valid reviewed multi-slice apply
  completes despite own stamp changes. Scoped action/runtime tests, types, lint,
  naming, and exact Inspector producer-consumer comparison close this slice.

Attachment handoff review/evidence: browser capture reads only ancestor metadata,
three canonical basis points and four requested bound fields. Missing, foreign,
cyclic or unavailable parents fail; scene changes during assessment cannot be
certified. Server review retains target/stamp and adds the exact evidence after
prepared-source expansion. The browser checks it inside the first mutation callback,
including a deterministic queue-change regression; no stale write occurs. Own later
slices retain normal checks without invalidating themselves. Removed redundant
post-write prepared-review checks so completed mutations are not mislabeled as
new preparation failures. Request-local stamp schemas prevent saved recipes from
constructing captured evidence as literals.

330 host/provider/operation tests pass (three original conditional skips), and
81 browser/evidence/application/runtime tests pass. Test-first failures established
missing source context, missing attachment and missing browser admission. App
types, focused lint and naming pass. Logs `tmp/pr3-attachment-*`. One old mock
fixture initially lacked the newly required canonical read actions; it now proves
the exact two reads while retaining zero-mutation assertions. Existing startup
console warning is unchanged. No services or full 101 run were started here.

### Design integration - settle owner - causal activity projection

Step Execution Card:

- Owner `settle`, Purpose lifetime spec and current activity carry-over. Consume
  ordered public activity, the original user objective, live call ancestry and
  lifecycle controls. Output remains one phase/purpose projection and its existing
  diagnostic decision; no generated status language or additional model call.
- Exact gaps: a newer parent phase currently hides a still-active child; multiple
  independent calls show whichever unrelated purpose emitted last. Actual panel
  and diagnostic projection omit the objective that unit examples already supply.
- Keep explicit purpose identity/revision/scope within the existing state machine.
  Phase-only notifications cannot re-author inherited text or erase known parent
  identity. Active leaf work outranks its coordinator's generic phase. Concurrent
  leaves show their common live orchestration purpose or request objective plus
  an operation count, not one arbitrarily selected sibling's text.
- The original objective is passed consistently by conversation and UI, including
  follow-up/retry turns. Existing fresh commentary, valid call-scoped purpose,
  completion cleanup, ordering, deduplication and lifecycle controls remain.
- Boundary: activity-state.ts, conversation.ts, ai-conversation-panel.tsx and their
  existing formal tests; Purpose lifetime spec and settle Inspector. Allowed
  contributors are existing ordered progress, conversation and presentation.
  Forbidden: text heuristics, obsolete child replay, new model calls, forced
  language, renderer changes or another status precedence chain.
- Tests first: parent heartbeat with running child, concurrent siblings then
  completion, missing parent in phase-only continuation, actual panel objective
  fallback and original request across follow-up/retry. Run focused presentation,
  conversation/panel/provider transport tests, types/lint/naming and source proof.
  Stop if a status claims a mutation outside the actual applying phase.

Self-review: parent orchestration purpose remains valid until its call ends; child
text is not copied to it. Revision changes only for genuinely changed authored
purpose, not recurring system phases. The grouping is causal, not a tool-name
priority heuristic. Phase remains distinct from authored-language purpose.

Activity projection verified: two formal regressions failed before the owner fix
(coordinator heartbeat displaced live child work; unrelated concurrent work adopted
the last sibling text). A separate real panel regression proved the missing request
objective. The existing machine now retains authored purpose identity/scope/revision,
projects active leaves and shared purposes, and receives the original objective from
the controller/panel through clarification and retry. Sequential panel fixtures now
emit actual completion events rather than leaving supposedly sequential calls live.
132 browser and 205 host tests passed (three original conditional skips), including
transport and the actual flow proof; types, focused lint and naming passed. The only
lint warning is the existing flow proof diagnostic console. Evidence:
`tmp/pr3-activity-*`. Captured candidate
`a090d377-c3b0-47e2-b9e4-5cbcc346b87d`, digest
`c1d53e9408bc93f5412f22cec30eddb2d0e3fc5f4405a85c5eaf6863b208ac6d`,
review `bffa22c492c2e892575cb91236f922ebdaef44f4545c85a1d955c285c74ec837`
accepted. No model call, language override or product rendering change.

### Design integration - local recording observation

- The live recording harness remains ignored local evidence, as requested. Existing
  `ai-runtime-profiler/tmp/full-101-large-document-20261011/run.cjs` scans every
  element once per second using `getAllElementsBounds`, even during provider waits.
- Use existing Core publication/frame subscriptions to invalidate local observation;
  measure current workspace roots through engine-neutral content measurement and
  public coordinate conversion only after changed content has rendered. Poll only
  the observer's scalar snapshot. No second scene tree, geometry cache, Pixi access,
  persistent App auto-fit or new public API.
- Local tests preserve bounds growth/shrink, multiple roots, empty content, frame
  coalescing, disposal and zero extra reads during idle. Instrument measurement count
  and elapsed time, fit work and status capture separately in the live recording.
- Fit on first actual content, changed overall bounds and final completion; retain
  the final ten seconds. No arbitrary wait-time speed target or producer replay.
- Close this harness slice with local tests and real browser smoke, then run the
  authorized complete Taipei 101 acceptance after remaining integration review.

### Design integration - invocation diagnostic provenance

- Final handoff review found nested spans already preserve call/parent and input/
  output, but repeated calls of the same leaf do not carry the admitted recipe step
  identity or exact pinned dependency revision. A call tree alone cannot identify
  which of two same-tool recipe steps ran.
- Runtime `invoke` owns a typed recipe invocation observation: pinned revision and
  the parent recipe name/revision/step ID. Native invocations have no fabricated
  recipe step. Preserve the common invoker and every security/lease boundary;
  metadata is diagnostic only, never authority or persisted captured document data.
- Design observation forwards this metadata to existing Runtime records, without
  another recorder or payload copy. Test nested repeated leaves and actual provider
  records first, preserve ordering/cancellation/partial results and observer
  isolation, then run Runtime tests and affected provider proof/types/lint/naming.
- Boundaries: recipe-execution.ts, public type export and formal invocation/flow
  tests, existing profiler recorder allowlist/test, Tool Specification and invoke Inspector; local-tool-host observation type and local-ai-provider/tests,
  App diagnostic spec and observe Inspector. No recipe language, scheduler or model
  change. Advance only after the records contain the actual pinned provenance.

Invocation provenance closed: 311 Runtime tests passed, including the formal
nested recipe proof and recorder allowlist. The actual provider test confirms
recipe-step metadata reaches persisted records; 184 related host tests passed
(three original skips), with types/lint/naming passing. The final query handoff
re-run exposed a test store that claimed writes but always returned no records;
its fixture now actually stores and CAS-checks entries, preserving the current
availability guard. No product admission was relaxed. Runtime candidate
`46469aaf-06c6-4dba-8c11-45aad7c51d51`, digest
`23fcd106a1ee6e23796a2e2d8e30a5c3cbd6e3db64f1fb5babf2b37bf6d01d9c`,
review `7bfc8a1e4bfa5551aa713ac6bb9e1182bbc9604c634d60bd56f7a5e800eb51be`
accepted; Design candidate `bdce0f67-89d5-47e4-ac71-ea74fc417c16`, digest
`deebd6ce37b0200c90fb95ca136148506a24b5253589076eabde84d557fa4244`,
review `561e77bee532ec7474d24bfb4d6ab388f586969c40181a30b348e5211a01b15f`
accepted. Evidence: `tmp/pr3-provenance-*`. Final bounded ownership review ran
91 tests covering every advertised family admission/error boundary, canonical
basic operation contracts, image leases and cleanup; no failures.

Local recording observation verified: four local cases passed; actual browser
smoke measured the canonical rectangle at (40,30)..(140,100), coalesced publication
and rendered frame into one measurement, and performed zero additional reads
while idle. The driver polls this scalar snapshot, retains first/change/final
fit and the final ten seconds, and records measurement and fit overhead separately.
Only final document reporting traverses all elements once. Local scripts and
recordings stay ignored. Evidence: `tmp/ai-recording/smoke.json`,
`tmp/pr3-recording-{local-tests,smoke}.log`.

### Design integration - live acceptance iteration

The complete recorded Taipei 101 run `reusable-tools-1791809549790` finished:
first visible content at 330.114 seconds, UI completion at 1713.103 seconds,
30,733 objects and 52 complete recording streams. Final visual assessment passed,
but delivery acceptance remains open. All temporary services were stopped. The
ignored run directory contains the trace, payloads, reference images and report;
the recording and harness must not be published.

Prepared review consumed 494.134 seconds across 15 calls. Fourteen actual model
assessments occupied 493.627 seconds; all other processing occupied 0.507 seconds.
The first three assessments occupied 99.862 seconds before first content. Model
service boundaries include service wait and generation, not observable internal
reasoning. Inclusive tool durations must not be added to nested provider durations.

The next iteration is limited to the observed handoffs and their direct consumers:

1. Compose: exact lookup must deliver the actual native wrapper schema even when
   an action shares its name. The run received flat action fields, attempted the
   native route, then needed rejection and another lookup to obtain the wrapper.
2. Inspect: distinguish staged recipe coverage from final whole-drawing criteria,
   and retain correction evidence across genuine source revisions. Current broad
   reassessment cannot be fixed by raising limits, skipping known conflicts or
   merely shortening instructions. Before editing this owner, define criterion
   selection, lineage authority, changed-dependency invalidation and final coverage
   with formal cases. A model's claim of unchanged data is not reuse authority.
3. Settle: distinguish generic registered tool descriptions from authored stage
   purposes. Generic preparation currently retires useful commentary and leaves
   the full original prompt as the visible status. Preserve the existing rule that
   genuinely superseded stages cannot reappear; do not solve this by string matching
   or copying completed call text into a perpetual stage.
4. Observe: classify visual child assessments as visual assessments; retain actual
   causal spans and distinguish model boundaries from local execution. In the
   ignored recording harness only, suppress fit caused by floating-point bounds
   noise without introducing App auto-fit.

Self-review: this replaces acceptance based on isolated passing tests with actual
lookup-to-invocation and review-to-application cases. The valid nonplanar input,
missing artifact, stale inspection and attachment guards remain. No renderer,
reference acquisition, model configuration, recipe JS or quality threshold change
is authorized by this iteration. Each owner advances only after its exact contract
and test-first proof are complete; the inspect design is not yet implementation-ready.

### Step Execution Card - compose exact route delivery

- Owner/failure owner: `compose`, Discover and compose. Product authority:
  `ai-execution-flow.md` - Progressive preparation and reference admission.
  Inspector conditions require mixed exact lookup, distinct execution routes and
  canonical native schema delivery with revision/refresh semantics.
- Inputs: exact names and the current registered action/native definitions.
  Output: independently identified action and native definitions with usable input
  schemas on first full delivery; explicit references on repeat delivery.
- Conditions: same short name is not an excuse to omit one route's input contract.
  Preserve namespace ambiguity, partial matches and usage/schema-path requests.
  Compact menus remain compact and do not consume full delivery.
- Contributors: current registry and existing `deliverDefinition` owner. No second
  schema, implicit input wrapping, canvas call, model call or heuristic route choice.
- Boundary: `server/local-operation-tools.ts` and its existing formal test file;
  clarify the matching spec/Inspector clause if necessary. No other owner edits.
- Tests first: strengthen mixed lookup to require both schemas immediately; prove
  lookup-to-native invocation and lookup-to-batch invocation use their different
  advertised inputs without a recovery lookup. Preserve qualified repeat/refresh
  identity, unknown names, schema fragments and registry revision invalidation.
- Gates: operation/discovery and schema/invocation tests, server types, focused
  lint, naming and same-source Inspector evidence. Stop on admission changes or
  unresolved route ambiguity. Bounded review covers these routes and direct callers.

Card self-review: delivery identity is already namespace-qualified for native
tools and distinct from action names. Removing the schema-omission special case
reuses established revision/refresh accounting; it does not merge unlike contracts.

Compose correction verified: both strengthened mixed lookup and actual dual-route
invocation regressions failed on the missing native schema before the correction.
191 operation/schema/invocation tests passed afterwards, with server types, focused
lint and naming passing. The same source candidate
`9188e4df-1b08-4aca-9b51-0aa681e5be7b` passed, source digest
`fc1860aee2798c792b296e75c7fe410b09de7939447aa7725e983554220fc17f`,
review `fef61f9052fedebf0f8a222d442e9c5e13b755259191c31acf47dd73978bdfd0`.
Evidence: `tmp/pr3-discovery-*`. The bounded review confirmed that action/native
refresh identities remain distinct, flat native arguments remain invalid and
discovery itself performs no mutation. No live-time improvement is claimed.

### Step Execution Card - observe assessment classification

- Owner: `observe`; Runtime owns records and Design supplies actual invocation
  purpose. Spec: shared diagnostics and independent visual assessment. Inspector
  inputs include explicit assessment requests, visual evidence and parent identity;
  output is the causal execution trace. Failure remains with `observe`.
- The live run's visual child records were labeled `execution-assessment`: provider
  setup checked the broad assessment flag but omitted the visual subtype. The
  existing provider test expected this incorrect label. Prepared assessment and
  ordinary drawing already have distinct labels.
- Boundary: `server/local-ai-provider.ts`, its provider tests, diagnostic spec and
  observe Inspector condition. Inputs are actual internal invocation mode flags;
  no inference from prompt text or returned status. No additional records/model
  calls, changed scheduling, or external model internals.
- Strengthen the existing real request-to-sink test first to require
  `visual-assessment`, preserving parent call/span, source identity and image input.
  Run the affected provider tests, server types, focused lint/naming and source
  proof; preserve drawing, prepared and explicit execution-assessment modes.
- Self-review: the classification reflects the actual endpoint already selected
  for inference. This corrects report attribution without changing elapsed-time
  evidence or the product outcome. Stop if a second recorder or inferred activity
  classification becomes necessary.

Observe correction verified: the strengthened visual request-to-sink case failed
on `execution-assessment` before the correction; 170 provider tests passed after
it (three existing conditional skips), with types and naming passing. Focused lint
has no errors and three existing diagnostic-console warnings. Source candidate
`971d468e-512b-4ccf-9802-cbfe867cae4e`, digest
`a9a47d99b6c811fbf82a3030a13ce92b09ccfc45e6af67fd50926cba2d544245`,
review `3cef2818811844392bed3139285cc2816a86679ca324c88a1abcad639a440e2a`.
No historical records were rewritten and no historical model time was reclassified
without its actual parent/endpoint evidence. Logs: `tmp/pr3-assessment-kind-*`.

### Inspect iteration - concrete design and review

The retained live payloads show two different causes, not fourteen duplicate
requests. Different ready parts legitimately have different source. Four failed
assessments requested source corrections; ten remained unverified, primarily for
dimensions, reference detail or appearance unavailable before rendering. The first
failure requested ornamentation/shadows before the initial part could appear; the
next failure identified a concrete attachment intersection. Later entrance review
requested shape corrections, then additional joints on the next revision. Do not
report all of these as redundant cache misses or promise to eliminate their time.

The inspection owner will make staged scope and revision handoff explicit:

- Optional `criterionIds` selects current stored criterion IDs for this ready
  stage, independently of optional source `keys`. Omission preserves full criteria.
  The complete source and original request remain available for context; the
  assessment must not demand completion of deliberately pending criteria. Return
  reviewed and pending criterion IDs, without advancing final drawing acceptance.
  Unknown/duplicate/empty IDs reject before an assessment or canvas call.
- Optional `previousArtifactId` identifies an actually retained and reviewed
  predecessor. Resolve through the existing source owner, never caller-supplied
  previous verdicts. Supply its actual prior findings as correction questions,
  together with source-change/evidence-currency metadata. Do not resend the old
  complete recipe, infer lineage from names, or adopt old findings as fresh proof.
- Exact source/evidence identity shares known conflict state across duplicate
  artifact handles. A smaller scope or unknown result cannot erase that conflict.
  A genuinely changed source is assessed on fresh evidence; its predecessor is
  context, not an automatic pass or a permanent veto on corrected geometry.
- Reuse remains conservative: complete source, explicit criterion/key coverage,
  findings, attachment and current requirement/reference evidence plus any supplied
  predecessor findings determine the packet. Do not infer unchanged independent
  subparts across changed geometry without a canonical dependency proof. The
  existing final current-canvas check still covers every request criterion.
- Report exact reuse and coverage in the existing receipt and record the actual
  assessment boundary. Improve model guidance to submit a coherent ready stage and
  reuse its assessment, carrying actual predecessor identity during corrections.
  Neither guidance nor metadata can authorize contradictory writes or certify
  appearance before rendering.

Self-review resolved two unsafe shortcuts: selecting criteria alone could hide a
known conflict, so conflict continuity is keyed to actual source/evidence rather
than artifact ID; treating previous findings as approval could preserve errors,
so changed sources still require fresh judgment and prior findings are questions.
Existing immutable source ownership and current attachment admission remain the
authorities. This design reduces unnecessarily broad scope and lost correction
context, but does not assert that different ready recipes require no model work.
Implementation must first add formal staged-scope, duplicate-handle conflict,
predecessor ownership/freshness and unchanged-reuse work-count cases. Keep the
existing intersection, stale attachment, source-key context and final-coverage
tests. Final integrated recording remains necessary to assess the actual behavior.

### Step Execution Card - inspect staged recipe and revision handoff

- Owner/failure owner: `inspect`; spec Prepared recipe review and Progressive
  preparation; Inspector consumes actual prepared artifacts, requirements,
  canonical attachment, references and prior findings as revision questions.
- Output: source-bound assessment with explicit criterion/key coverage, pending
  criteria, reuse, prior-question provenance and unchanged appearance/final-review
  limitations. No new completion authority or canvas mutation.
- Conditions/bypasses: default whole-criteria review remains; explicit partial
  stage does not clear same-source conflicts. Direct known-value edits still omit
  prepared review. Existing source/attachment invalidation and cancellation stay.
- Contributors: request-owned immutable preparation, current design criteria,
  source evidence and independent assessor. Forbidden: caller-authored old verdict,
  old source copies as proof, name-based matching, unproven dependency reuse,
  appearance certification, model/configuration changes or admission weakening.
- Boundary: local-prepared-design-review.ts and its formal tests, the matching
  spec/Inspector; ai-domain-prompt.ts and its contract test provide caller guidance
  only after the owner contract passes. Existing local-operation-tools/provider
  tests prove the public caller and output handoff without a new dispatcher.
- Gates: staged/default/invalid criteria, exact packet reuse count, conflicting
  alias handles, predecessor source availability and changed evidence, cancellation,
  partial keys and full-source context, canonical attachment and final-canvas
  requirement. Then focused owner/caller tests, types/lint/naming and source proof.
- Stop on stale pass, loss of an existing conflict guard, cross-request source
  access, or semantic equivalence inferred without an authoritative dependency.

Card review: source signatures include complete immutable content, not just the
selected keys. Review history is request-owned derived evidence, not canonical
document state. A predecessor is consumed through the same owned recipe lookup.
Changed-source history is diagnostic and cannot silently become current approval.

Inspect slice verified: four initial formal regressions failed before implementation.
Review then exposed two additional same-source hazards: an older alias retained
approval after a later conflict, and an older cached pass could clear that conflict.
The new regression failed before the canonical source-review correction. Resolution
of an unchanged known conflict cannot rely on that older cached approval. Scope
ordering and predecessor alias spelling also have a formal reuse-count proof;
actual retained predecessor availability is still checked on every call.

334 focused owner, caller, prompt, provider and flow tests passed (three original
conditional skips), server types, focused lint and naming passed. Coverage and
reuse are part of the declared successful receipt. The original source, geometry,
attachment and final-canvas guards remain. Evidence: `tmp/pr3-staged-*`.
Candidate `960d89d9-471f-4b7b-ac0a-fa716c2fd820` passed on source digest
`8694898637478bb34261aeb7802e438e45adea8914ff92f770b7da491b3c8c50`.
This proves staged scope and handoff correctness, not a measured model-time gain.
Current-status provenance and local recording bounds noise remain before the next
integrated acceptance. No push, commit or replacement live run has occurred.

### Step Execution Card - settle authored versus registered activity

- Owner/failure owner: `settle`; inputs are ordered public progress with explicit
  provenance. Spec Purpose lifetime and Runtime Provider tool activity state that
  only authored work uses `kind: work`; system labels must not retire commentary.
- First incorrect boundary: Design `reportProgress` already receives explicit
  `registered-operation` provenance but publishes it as authored `work`. The
  existing state machine correctly retires old commentary for genuinely authored
  work, so changing its retirement rule would revive stale stages.
- Repair the producer classification through the existing `work/system` contract.
  Retain registered descriptions and provenance in diagnostics, call identities,
  ordered phases and completion; only actual public/model-authored work may replace
  a request purpose. No new source enum, extra precedence chain or string heuristic.
- Boundary: local-ai-provider.ts and its formal provider tests, matching spec and
  Inspector. The direct consumer is the actual activity projection; import it in
  the formal provider test and replay emitted progress, rather than constructing
  an already-correct classification only in a reducer unit test.
- Test first: actual public stage followed by registered preparation retains stage
  through queue/work/completion; registered vector/review intent remains recorded
  as system provenance. Preserve authored new-stage retirement, active children,
  concurrent siblings and lifecycle precedence in presentation tests. Gates are
  provider and presentation/transport tests, types/lint/naming and source proof.
- Stop on registered labels being relabeled as user/model authorship, phase claims
  of drawing during preparation, or resurrection of a genuinely superseded stage.

Self-review: no Runtime API change is necessary. The current contract already
expresses this distinction; its producer was violating it. Keeping diagnostic
tool intent does not make that intent an authored request-stage update.

Settle slice verified: the actual provider-to-projection regression failed before
the producer correction. 194 host tests and 106 browser presentation/transport/
panel tests passed, with three original conditional skips; server types, focused
lint (zero errors) and naming passed. Candidate
`5ca65b62-7e08-48c6-9c7e-73397dae291b` passed on source digest
`5137073b36b7aeefe870e271fd2dad8d1a369ce1c96e04973d99c8ae71abaf87`.
Evidence: `tmp/pr3-status-source-*`, `tmp/pr3-status-projection-red.log`.

Local recording review also reproduced an exact-bounds comparison causing camera
fits for floating-point noise. The ignored, local-only recorder now compares at
machine precision scaled to the bounds, anchored to the last successful fit;
small real and cumulative changes remain visible. Its regression failed first.
No product camera behavior or published test fixture changed. The next complete
101 recording evaluates the combined discovery, staged review, classification and
activity handoff changes; elapsed model time remains an experimental result.

### Design integration - second live acceptance and bounded remainder

The complete recording in `tmp/ai-recording/runs/reusable-tools-1791813964905`
finished with final visual acceptance: first content 260.422 s, UI completion
2040.345 s, 38,232 objects, zero browser errors. The previous run was 330.114 s,
1713.103 s and 30,733 objects. Do not claim equal-workload acceleration. All 15
prepared reviews used explicit stage criteria; eight retained actual predecessors.
Their 479.062 s inclusive time contains 478.241 s at the model boundary and
0.822 s elsewhere. Main-provider waits account for most of the increased wall time.
The report, exact rejected inputs and final five reference originals remain local.

48 of 49 streams are complete. One native assessment emits an agentMessage start
without its matching completion, then starts/completes another message and ends
the turn. The recorder correctly preserves an incomplete child span; the whole
provider call and parent wall time remain known. Do not invent an item end time or
call this a storage sequence loss. This is an explicit observability limitation.

Review of this run narrows the remaining integration work:

1. Compose: two invalid target bindings were correctly rejected, but the generic
   error hid the conflicting argument. Validate every binding's shape/path and
   argument conflicts before resolving any retained source; return their precise
   locations together. Explicit empty arrays still conflict and must not be silently
   overwritten. Explain that targets supply omitted argument slots and that multiple
   bindings currently require plural elementIds. Preserve exact registered paths.
2. Settle presentation: the genuine terminal-work fallback is the original request,
   which may be long. Bound its visual height while retaining the complete accessible
   text. Do not revive old commentary, invent future work, alter purpose lifetime or
   add another model call to shorten text.
3. Compose acceptance: the 101 run did not author a new reusable tool. Add the planned
   guarded real-provider author/save/reload probe to the existing live-provider test
   owner. Use an isolated project-local store and preparation-only paired artifacts;
   verify actual model tool calls and persisted reuse with different inputs. It must
   not supply a finished recipe to the model or substitute mocked inference.

These are bounded owner corrections/proofs, not another architecture redesign or
latency promise. Original model/effort, source constraints, final visual review,
security, Undo and recording ownership remain. No additional full drawing is
required for error-message/presentation-only changes when their direct formal and
browser proofs pass. Selected final delivery gates remain after these slices.

### Step Execution Card - compose binding preflight and actionable rejection

- Owner/failure owner: compose; registered operation schemas own the target slots.
  Consume operation arguments and retained target descriptions; produce admitted
  canonical actions or exact binding errors before dispatch or source resolution.
- First incorrect boundary: assignTarget rejects a supplied placeholder correctly,
  but its error discards the path; sequential binding validation may resolve an
  earlier source before finding a later independent invalid binding.
- Boundary: local-operation-batch.ts, local-operation-tools.ts and its formal tests,
  matching capability-discovery spec and Inspector condition. No new target modes,
  guessed ID-field names, silent overwrites or bypass of canonical admission.
- Test first: reproduce the recorded nested empty-array plus mixed scalar/plural
  bindings; assert both exact locations and zero resolver/dispatcher work. Correct
  only the reported invalid inputs and prove existing valid nested bindings still
  execute once. Preserve union, array-slot, ambiguous-path and stale-reference cases.
- Gates: focused operation/schema/invocation tests, types, lint/naming and source
  contract review. Stop if any caller value is overwritten or invalid input writes.

Self-review: preflight reserves slots in an immutable local copy, not document state.
It cannot validate source existence or permissions; their existing owners still run
after structural admission. Errors contain paths and recovery instructions without
copying potentially sensitive argument values. This closes the observed recovery
gap without broadening the supported binding grammar.

Compose binding closure: both new formal regressions failed on the prior source.
After immutable preflight, all 193 operation/schema/invocation tests passed;
server types, focused lint and naming passed. Valid nested bindings resolve once,
caller input stays unchanged, and later invalid bindings perform zero lookups.
Candidate df8f79ec-8c9e-4e7f-b0df-1a6e93019c45, source
12122154edcdc50bc0b8d551f61cc61503aec83c293707941997a1199a96e67a,
review 7f91b9972ad458e8c126aa872300ac97ab78620e90edc46c08b1af8ea3da0594
accepted. Evidence: tmp/pr3-target-feedback-{red,green,types,lint,naming,accept}.log.

### Step Execution Card - real-provider reusable preparation acceptance

- Owner: compose; use the existing provider, exact tool discovery, Runtime
  authoring/admission/invoke and host SQLite store. Existing formal protocol
  cases remain responsible for deterministic failure/cancellation coverage.
- Boundary: existing guarded local-ai-live.test.ts only, plus this plan evidence.
  No product mutation, alternate registry, fixture recipe supplied to the model,
  model/effort change, or ordinary CI execution of subscription inference.
- Case: ask the real model to discover the specification and author a finite
  preparation-only tool producing two independent editable parts from a width
  parameter. Invoke it, verify actual eligible durable bytes, reopen in a fresh
  provider request, discover the saved revision, and invoke with another width.
- Oracle: two nested preparation calls per successful invocation, actual changed
  inputs, fresh output handles, same saved recipe/revision, no submission in the
  second request, no browser mutation, and retained execution evidence. Admission
  corrections are observable; a failed live attempt is evidence, not a pass.
- Gates: focused guarded live test, types/lint and bounded evidence inspection.
  Finite timeout/cancellation and isolated project-local store/records preserve
  real user libraries and documents. Do not start another complete 101 drawing.

Real-provider acceptance passed with unchanged gpt-6-astra medium. It discovered
contracts, authored two preparation steps, saved eligible revision 1 and reused it
in a fresh request (width 17 then 23), producing four fresh handles and zero canvas
calls. Both records are complete with no issues. Evidence:
apps/asyra-design/tmp/reusable-tool-live/1791817544984/acceptance.json and
 tmp/pr3-live-library-verified.log (63.23 seconds). The first probe exposed an
oracle assumption that dimensions lived on a Frame root; the model validly used a
Group. The corrected oracle checks canonical rectangular geometry from exact saved
input, preserving the requirement rather than constraining authoring shape.
Types and lint passed. Candidate f2c53577-c853-4cc6-9f6e-77bda30d4a62;
review 4175e7b77f14f1f74f8628783f9e3fafa6b23278c96912daad205b903bab7d49 accepted.

### Step Execution Card - bounded current-purpose presentation

- Owner/failure owner: settle; activity-state remains authoritative. No changes to
  purpose selection, freshness, language, lifecycle or model requests.
- Boundary: ai-conversation-panel.tsx and its existing formal conversation E2E,
  matching activity spec/Inspector condition. The recorded long original request
  is correct fallback data but currently consumes an unbounded presentation area.
- Test first: extend the existing 360/1280px stream cases with a long purpose;
  require at most three rendered message lines, intact DOM/accessibility text and
  full hover text, no horizontal overflow and preserved following/history behavior.
- Render a three-line purpose preview with full title. Do not truncate the stored
  request, resurrect completed intent, create a synthetic next action or hide errors.
- Gates: exact browser cases with inspected screenshots, focused lint/types and
  current source contract proof; no extra full drawing is necessary.

Purpose presentation closure: the existing browser fixture still emitted old
unscoped phases and reused completed call IDs. Updated that fixture to the current
scoped producer contract, preserving late-event rejection, phase/purpose separation,
conversation following, stable history and terminal behavior. Then the new height
oracle failed at 300px against a 61px maximum. Both 360/1280px cases now pass;
screenshots show three visible current-purpose lines and complete expanded history.
Full text/title and normal following remain. Production typecheck, lint and naming
pass. An exploratory whole-source tsconfig also includes legacy test fixtures and
reports their stale typing; the declared production typecheck passes. No unrelated
fixture migration is included. Candidate 981644c1-3e42-4b94-9f16-d1b89575125b,
source d5a46ceae0cbd5d1c85dfc424c669349762dd10dc90a77c5bfa678b776efdf1e,
review a742df7af65f36d3b3c23c5e4fee2b401d884c3f3325c4eeb9dea20c169fb89b
accepted. Evidence tmp/pr3-purpose-*; browser-owned temporary services exited.

Latest main c696dba31 (Skill packaging only) fast-forwarded without conflicts or
loss of working changes. Selected final delivery validation includes Runtime,
Preset, Design, Inspector and affected App consumers; FieldScope selection is
limited to three related tests and two bootstrap/scene-demand profiles, not robot
geometry workloads. The declared delivery checkpoint is now active.

### Step Execution Card - canonical partial-contract consumer fixture

Final selected delivery run 3ee0aec4-83e4-4cb6-84cd-7decbed7b183 passed shared
checks and Runtime, then failed one of 504 AI browser tests. The existing
server-prepared consumer fixture asserted the prior exact action-key list and
omitted partialOutputSchema. The compose contract already requires that separate
partial receipt schema; current toolSemantics supplies it to every action.
Update only that direct consumer's exact key/schema expectations and its compose
verification boundary. Preserve the no-front-end-preparation assertions and all
other key checks. No production behavior or schema is weakened. Focused regression
and lint precede resuming affected delivery validation.


### Delivery correction - generated Inspector catalog

The continuation passed shared, Design, Framework Site, Office, Sim and FieldScope,
then the existing Inspector catalog equality test failed: the committed browser
snapshot did not contain the current source contract's apply consumer. The
generate-browser-snapshot owner consumes classified current source objects and
produces their deterministic JSON-safe serialization. Run its existing generator;
do not edit generated semantics, source contracts or the regression oracle. Scope
is the generated workspace bundle and this evidence. The existing failed catalog
test is the regression; focused catalog tests and complete Inspector checks must
pass before continuing remaining delivery commands. Preserve earlier exact-source
passes only after comparing the input fingerprints and accounting for this derived
file and plan metadata. No product source is changed.


### Delivery correction - request purpose versus settled explanation

Owner: settle; Purpose lifetime and the existing conversation timeout/retry case.
The complete functional suite failed its old blanket assertion that the entire
Agent response subtree must exclude the original request. That subtree now
intentionally includes the active request objective and its recorded history.
Scope is the existing 360/1280px case and this plan; no product/spec changes.
Replace the obsolete blanket assertion with separate oracles: active current
activity contains the current request, never the previous request, and does not
render a settled explanation; timeout removes current activity and renders the
timeout explanation, not an echoed request. Preserve reference attachment reuse,
retry input/target identity, panel reopening, canvas integrity and one Undo.
The existing failing case is the regression evidence. Run both widths and inspect
screenshots, then continue the unchanged functional and render-contract gates.


Both timeout/retry widths passed (2 cases, 16.1 seconds), focused lint passed,
and the active/timeout/success screenshots were inspected. The active objective
is shown under AI processing; timeout removes it and explains unchanged content;
retry completes with a concise outcome. All original document/reference/Undo
assertions remain. Evidence: tmp/pr3-purpose-timeout-{e2e,lint}.log and the
existing Playwright case screenshots. Only the formal test and plan changed.


### Delivery iteration - conversation consumers of new panel capabilities

The next functional run exposed a second stale whole-container assertion: the
icon-navigation case expected an entirely text-free header, including the new
saved-tool management control. Re-audit is bounded to ai-conversation-flow.spec.ts,
its current activity/header producer, the saved-library panel case, Purpose lifetime
and the compose management/settle navigation contracts. Current source explicitly
provides Saved tools while conversation navigation remains icon-only. Neither
product behavior nor the registered owner contract should be reverted.

Revised approach: retain exact empty text, 24px size, SVG and spacing oracles on
the actual navigation controls; independently require the Saved tools control.
Keep all draft switching, focus, no accidental request and history assertions.
After the two observed stale consumer checks, run the entire conversation-flow
file plus the management case before restarting the broad functional suite. This
replaces the earlier one-case-then-whole-suite approach; no wider repository audit
or unrelated fixture migration. The existing failed header assertion is the red
evidence. Self-review: both new controls and unchanged navigation are independently
checked, the original purpose contract is preserved, and no production exception,
fallback or test removal is needed. Only this formal test and plan may change.


Conversation consumer iteration closed: the whole conversation-flow file and saved
library case passed (22 passed, 3 existing conditional performance skips, 1.4 min).
Focused lint passed; 360/1280 header screenshots retain navigation, focus and drafts
with the separate Saved tools control. Evidence: tmp/pr3-conversation-integration-
{e2e,lint}.log. No product changes. Complete functional and render contracts remain
required; this focused suite does not replace them.


## Local correction - tool-only checks and retained review results

Authorized 2026-10-13: update this plan and current contracts, self-review, then
implement locally. No push, PR creation, merge, automation restart or full local CI.
Previous delivery authorization is superseded. Preserve existing worktree changes.

### Inspect owner - tool-only preparation and primary-agent outcomes

- Owner/failure owner: `inspect`; product clauses Prepared recipe review and
  retained review results; existing prepare/apply/observe handoffs remain intact.
- Inputs: immutable compiler-admitted recipe/findings, explicit coverage, current
  canonical attachment, request criteria, source/reference dependencies, primary
  agent findings tied to current rendered inspection evidence.
- Outputs: deterministic tool findings, compact retained worklist with explicit
  provenance/currency and retrievable passed evidence, unchanged apply evidence.
- Forbidden: nested model clients/callbacks in preparation or normal review tools,
  model fallback, guessed geometry relationships, false visual certification,
  automatic mutation replay, per-frame document scans or raised batch limits.
- Boundary: existing prepared/design review, operation/provider wiring, direct
  preparation/session producers, prompt, common result helper and their formal
  tests; current App spec/Inspector/mapping and generated contract catalog.
- Order: (1) remove model dependency and prove real dispatcher zero-model paths;
  (2) retain tool/main-agent outcomes and dependency invalidation with compact
  reads; (3) integrate prompt, exact consumer schemas and tests; bounded review.
- Cases: success/failure/unknown/cancel/repeat with zero model calls; unchanged
  source reuse; corrected source reopens affected conditions; earlier failure
  cannot be hidden by partial coverage; visual check cannot approve data failure;
  current captures required; scene/source/reference changes invalidate affected
  evidence; unknown scope invalidates conservatively; failed validation cannot
  erase prior results; explicit reads recover saved pass evidence.
- Gates: permanent regression red before implementation, focused review/provider/
  operation/prompt tests, server typecheck, changed-file lint, naming and exact
  Inspector admission. No new paid 101 run or performance claim in this slice.
- Stop: fail the slice for model access through tool checks, stale completion,
  hidden failures, or canonical apply/Undo regression. Report genuine ownership
  gaps; do not resume previous remote-delivery work.

Design self-review: the compiler already owns deterministic preparation admission;
reuse its results rather than reimplementing geometry. A tool cannot judge image
similarity. Current canonical inspection stamps are scene-wide: scoped source/fact
reuse is supported, but visual scene edits conservatively reopen dependent visual
results until a separately proven narrower canonical dependency exists. This is
an explicit safety boundary, not a claimed localized visual cache. Request-owned
results remain available during iteration and in existing execution records;
resuming across requests/restarts is not certified by an in-memory map. Completion
requires current final inspection, not a monotonically decreasing issue count.


### Local correction result - 2026-10-13

Implementation and bounded self-review completed locally. Removed the normal
provider's prepared and visual assessor callbacks and the prepared-model request
entry. Preparation consumes existing compiler findings; errors, cancellation,
unknown coverage and repeat checks have no model fallback. Actual provider
integration proves two prepared checks use one existing primary turn and one
provider process, with only canonical attachment reads/validation in between.
The standalone explicitly invoked diagnostic visual probe is not wired into
ordinary drawing tools.

Retained results separate tool and primary-agent provenance, retain dependency
versions and prior evidence, and index unresolved IDs. With 2,000 accumulated
passes and one pending item, a default store read visits one result. This counts
the result store only: canonical freshness validation remains separate work.
Dependency fan-out reopens downstream passes; cycles and cross-origin replacement
reject before mutation. Unknown source impact and scene changes mark affected
results stale. Final correction requirements read current retained state, never
historical pass labels. Unchanged passes keep their evidence/revision.

The primary agent first receives actual capture images, then submits findings
with current IDs. Capture input no longer requires judgments. Partial capture
failure returns successful images and exact failed targets; a capture call cannot
certify images the primary agent has not received. Default result delivery omits
passed details; read_design_checks exposes counts and explicit retrieval with a
typed schema. Normal final review does not start another model.

Test-first failures and corrections were retained in formal tests: zero-model
boundary, omitted-review compiler failure, stale-pass revival, unknown fact impact,
dependency-free invalidation, and capture-without-judgment/partial-image delivery.
The final focused run passed 537 tests with 3 original conditional skips across
11 files (tmp/tool-check-final-tests.log). Server typecheck, changed-file lint
(0 errors; existing console warnings), naming (15), generated catalog tests (8)
and the current Inspector candidate passed. Evidence: tmp/tool-check-types-final.log,
tmp/tool-check-lint-final.log, tmp/tool-check-provider-lint.log,
tmp/tool-check-naming-final.log and tmp/tool-check-catalog-test.log.
Inspector candidate 09f20073-1687-4f41-8d31-ed498853cfb7 captured source
fe5b1dd912d4396c4d1b0edba84add9e7d5996916f713b5a691524e47ec77e98;
contract review 2e3c54058e30609d18ba1db3720fe26376ba2cb2ab8b3966b8ba3cf31044c9af
was accepted without blockers. This is local owner evidence, not full delivery CI.

Limits remain explicit: canonical scene stamps cannot prove per-region visual
freshness, so scene edits conservatively reopen scene-dependent judgments.
Results are request-owned, with existing execution records for diagnostics;
no cross-request/restart resumption is claimed. No new full-101 run or wall-time
improvement claim, no full local CI, no commit/push/PR/merge, and no monitoring
restart occurred in this correction. Earlier complete-delivery failures remain
outside this bounded correction and are not relabeled as passed.


## Local correction - dependency-scoped inspection invalidation

Authorized 2026-10-13. Continue in the existing worktree. No remote operations,
automation restart, full local CI or additional live-model acceptance run.

### Step Execution Card - inspect actual capture dependencies

- Objective: editing third-tier windows reopens only dependent judgments, including
  a whole-building judgment when it actually used the changed content. Pan, zoom,
  selection and moving content outside the viewport are not invalidation inputs.
- Owner/failure owner: inspect. Browser capture evidence owns currency; the result
  store owns reverse judgment dependencies. Core exposes existing canonical
  property-owner indexes; the App must not inspect renderer implementation types.
- Inputs: issued capture target and optional target-local region, canonical scene
  changes and property-owner relations, current spatial candidates and ancestry,
  request criteria, source facts, and main-agent findings bound to delivered images.
- Outputs: opaque scoped capture receipts, per-receipt freshness, targeted stale
  judgments and an unchanged-pass worklist. Retain original evidence for diagnosis.
- Browser design: global stamps remain for unscoped deterministic/attachment
  checks. Visual captures use individually issued receipts. Whole-subtree evidence
  follows descendant and ancestor changes; regional evidence additionally records
  spatial membership and contributing ancestry. Queue membership checks for
  possible entrants; remove/move must account for old membership. Shared property
  changes use canonical owner relations. Unknown notifications, document load,
  unavailable dependency resolution and disposal fail closed. Never reuse a stamp
  from a different runtime or a capture changed while rendering.
- Server design: stop clearing all visual evidence before each mutation. Mark
  completion unaccepted, then reconcile retained capture currency through the
  browser. Each supplied criterion can bind a subset of the call's issued capture
  IDs; omitted bindings conservatively depend on all supplied images. Dependency
  changes reopen only related results and downstream checks. New and still-current
  older captures may coexist. Final overall/detail coverage remains mandatory;
  a fresh overview does not silently refresh unrelated stale judgments.
- Lifetime/work: request/runtime-owned receipt metadata only, no copied document or
  image-comparison cache. Unchanged stamp reads do not traverse scene content.
  Changes route through affected IDs/ancestry, and regional membership is refreshed
  only for pending scopes. No per-frame work or all-document polling. An actual
  whole-building check may require whole-building evidence by definition.
- Boundary: existing inspection evidence/action, review state/dispatcher/prompt,
  their permanent unit/E2E tests, Core public property-owner query and its focused
  tests/docs, this plan, App spec, inspect contract and generated catalog.
- Cases: eight tiers with independent criteria; third-tier fill/geometry and
  shared fill across two tiers; regional entrants/exits/reorder; parent transforms,
  reparent/delete/Undo/Redo, missing/unknown dependencies and load; mixed current
  receipt ages; invalid criterion bindings; external edit/read/final handoffs;
  unchanged passes/evidence retained; constant unchanged validation and no
  unrelated subtree reads. Zero new model calls.
- Gates: permanent regressions red before implementation, focused browser/server/
  Core tests, real browser scoped evidence case, applicable typechecks, naming,
  changed-file lint and current Inspector contract review. No full local CI.
- Stop conditions: stale completion, incomplete owner mapping, offscreen false
  invalidation, unbounded document scans, swallowed cleanup/errors, or writes to
  canonical document data from evidence bookkeeping block closure.

Self-review before implementation: both browser currency and server invalidation
must change together. A local crop may gain new contributors even if its old IDs
are untouched; membership and ancestor dependencies are therefore required.
Shared properties must invalidate every actual owner, not just the edited action's
named target. Scene changes revoke final acceptance immediately, but do not erase
passes. Whole-request coverage and per-criterion dependencies are separate checks.
Unknown dependencies reopen evidence rather than manufacturing validity. Existing
global attachment admission and deterministic measurement are intentionally not
weakened by scoped visual receipts. This supersedes the prior visual scene-wide
limitation once the focused proofs pass; it does not claim a full-101 speedup.


Scoped self-review correction: the real browser deletion case exposed retired
property cleanup being mistaken for unknown document impact. The owner lookup
must resolve active ancestors and any remaining direct relations; orphan cleanup
has no active consumers. Canonical removal/parent-property changes still retire
actual captured dependents. The new permanent Core test fails on the prior lookup,
and the browser deletion test fails because the unrelated first tier becomes
stale. This is inside the existing Core/index and inspect boundary, not a change
to deletion, Undo or property validation.


Scoped correction - completed local evidence and final review:

- Browser receipts and server criterion dependencies now agree: editing the third
  tier retires that tier and genuinely dependent whole-building evidence, while
  seven independent tier passes remain reusable. Mixed capture ages require
  individual current receipts; final request coverage and completion checks remain.
- Canonical property owner lookup is strict by default. Only known property-removal
  observations opt into retired-ID cleanup; unknown update dependencies still
  invalidate conservatively. Both deletion over-invalidation and strict-default
  behavior were reproduced by permanent failing tests before their fixes.
- Work-count proof: the third-window edit reads only its three ancestry entries;
  100 unchanged validations perform zero ancestry reads and zero region queries.
  Region checks use conservative spatial candidates, not a pixel-exact visibility
  claim. Parent transforms, shared property consumers and entering/leaving members
  retain their real dependency effects. Pan/zoom and selection are not inputs.
- Focused server verification: 418 passed, 3 original conditional skips in
  `tmp/scoped-final-server-tests.log`. Final browser units: 41 passed in
  `tmp/scoped-strict-final-browser.log`; Core: 5 passed in
  `tmp/scoped-core-strict-tests.log`. Core build, App production/server typechecks,
  changed-file lint (no errors; existing console warnings) and naming passed.
- The permanent real-browser group/region test passed with geometry edits, actual
  nested fill changes, regional entry, Undo, pan/zoom, deletion and document load:
  `tmp/scoped-strict-final-e2e.log` (1 passed, 13.3 seconds). The existing global
  manual/Undo/Redo/load test also passed in `tmp/scoped-inspection-group-e2e.log`.
  Agent-owned temporary service ports were verified closed after tests.
- Current 24-case Inspector candidate `67e5e673-ba0f-460e-ac72-c9373065aa9f`
  passed with source digest
  `5fafb952a1df3bae67c1020c2b311a260a851600a3ab0b8388a6e7362d4085f6`.
  Contract review
  `bbde883fb9db7c07af0add23661220a433dc502c3c98d2675495ff1a02790e96`
  was accepted with no blockers. Generated catalog verification passed 8 tests.
- Final review covered the changed producer/consumer contracts, explicit versus
  default criterion bindings, cleanup/disposal, unknown-change fallback and
  completion freshness. Earlier failed diagnostic runs remain failed evidence;
  their successful replacements are named above.
- Global deterministic measurement and attachment stamps remain the existing
  admission safety boundary; this correction scopes visual evidence and its
  dependent judgments. No second model was introduced. No new full-101 runtime
  measurement, full local CI, remote operation or monitoring restart occurred.

## Revised plan - complete retained handoffs and incremental review

Planning checkpoint, 2026-10-13. This section supersedes incomplete end-to-end
assumptions in the local corrections above; their measured evidence remains valid.
Status: analysis and self-review complete, implementation not started.

### Bounded task and evidence

The current authorization is analysis and planning only. The sole edited file for
this checkpoint is this plan. Do not implement, commit, push, create a PR, resume
monitoring, run full local CI or start another live drawing at this checkpoint.
Keep the current worktree, App model and effort. No subagents or dependencies.
Future implementation must first align the affected current spec and exact
Inspector contracts, then work through the owner slices below. This plan is not
an assertion that those revised contracts or their implementation already pass.

Fixed discovery: the latest live run, current producer/consumer code and direct
formal tests for artifact delivery, target selection, inspection/result reuse and
activity. No repository-wide audit or rendering redesign. Evidence is under
`tmp/ai-recording/runs/reusable-tools-1791829034810/`: `analysis.md`,
`tool-timeline.json`, `query-analysis.json`, `review-handoff-analysis.json`,
`run.json` and their original `executions/` payloads.

- Live result: first visible detection 81.198 seconds, UI completion 470.753
  seconds, 41,129 editable elements, one primary drawing model and zero additional
  review models. These are observations of one workload, not speed guarantees.
- Six post-application `review_prepared_design` calls failed with unavailable
  artifacts. Together they took 3.164 milliseconds; they were not successful
  checks and were not slow validators.
- Sixteen context reads delivered 735,633 bytes. One spatial selection found
  2,736 crown objects from 2,970 candidates; its subsequent pages reused the
  snapshot with zero further selection executions. Fourteen pages delivered those
  2,736 rows so the agent could remove 24 roof faces. This is excess delivery and
  caller-side filtering, not repeated whole-tree spatial search.
- Four whole-target deterministic reviews visited 162,031 elements cumulatively;
  two crown checks bring the total to 167,519. All six took 1.420 seconds. Avoiding
  this repeated work matters, but it is not evidence of minutes of validator CPU.
- No local visual passes were submitted before the crown repair. The primary
  agent submitted one detail failure, then six passes at final review. The live
  run cannot prove that prior passes were erased or preserved. Existing narrow
  invalidation tests prove a smaller behavior, not complete live adoption.

### Confirmed first incorrect boundaries

1. **Returned handles lose ownership at the compound output boundary.**
   `local-design-workflow.ts` spreads the preparation definition, then replaces
   its output semantics with `actionResults/completedSteps` or an untyped `parts`
   array. Returned `artifactId` fields are absent from these reference schemas.
   `local-tool-host.ts` retains only schema-declared request references, and
   `local-tool-leases.ts` intentionally never guesses handles by field name.
   Preparation publishes call-owned artifacts with a real removal callback.
   Therefore normal compound-call cleanup can remove an artifact immediately
   after returning its ID. Ordered and partial output branches need the same
   scrutiny. The workflow description nevertheless promises retained identities.
   The existing direct workflow fixture creates a session without ownership;
   preparation host tests cover a different route. Neither closes this handoff.

2. **Spatial selection ends before the task-specific predicate.**
   Region filters expose type, parent, ancestor and locked state. `fields=[]`
   omits computed properties but still returns names and other metadata in page
   mode. Existing batch `target.query` can consume a full region internally, but
   cannot express every subset the agent then identifies by name or creation
   key. The recorded crown source contains stable keys such as
   `mast-collar-12-roof`; the later edit reconstructs canonical IDs from pages.
   Restoring the retained creation-key route removes this avoidable round trip.
   The trace does not prove what caused the agent to choose paging; missing
   artifact continuity, insufficient predicates and conflicting usage guidance
   are concrete product contributors rather than claims about private reasoning.

3. **Local review still crosses global coverage and measurement gates.**
   `local-operation-tools.ts` calls `validateEvidence` with whole-request coverage
   by default even for an intermediate review. `local-design-review.ts` requires
   an overview even when `final=false`. Capture also invokes `measure` through
   global measurement state/stamps. Consequently a correct regional receipt alone
   is insufficient on the actual dispatcher route. Narrow browser invalidation
   did not change these other boundaries; this explains why that earlier slice
   was necessary but insufficient.

4. **Results cannot accumulate independent scopes of the same requirement.**
   The result store supports dependency edges and pending-only reads, but the
   review coordinator records `visual:<criterionId>` and final assessment merges
   criterion-level previous checks. Different regions under the same criterion
   replace each other rather than form explicit coverage. Criteria are immutable
   after drawing, so relying on the agent to anticipate one criterion per window
   region is not a sound remedy. Unjudged entries must remain unverified; image
   delivery or a fast geometry check must never manufacture visual passes.

5. **Purpose lifetime is coupled to short-lived calls.**
   `activity-state.ts` clears request purpose when a concrete call authors a new
   purpose, then removes that call on completion. With neither surviving, the
   presentation returns to the original full objective. Active-call precedence
   and closed-call guards work, but there is no surviving semantic work segment
   between calls. Keeping a completed call active would incorrectly imply drawing
   continues. The legacy report `modelReview` aggregation also misses accepted
   primary-agent findings and must not be used as the final review oracle.

### Intended end-to-end contract

Ready source -> deterministic preparation/attachment checks -> apply -> retained
artifact and actual effect receipt -> precise target selection -> dependency-scoped
tool checks -> delivered images -> primary-agent findings -> retained check units
and pending-only worklist -> affected-unit correction -> final current visual and
coverage judgment. Ordinary preflight and review tools never launch another AI.
Primary-agent iterations remain allowed and have no arbitrary two-review cap.

#### Slice A - compound artifact export and recovery

- Owners: compose/prepare and existing host lease adapter. Reuse each authoritative
  child receipt schema in single, ordered, partial and interrupted compound output;
  do not introduce a second handle registry or name-based reference discovery.
- Export every usable returned handle to its actual caller/request before local
  cleanup. Internal unreturned artifacts still retire. Completed preparation
  followed by apply failure must describe the retained recovery artifact and
  product settlement separately; never replay successful or uncertain writes.
- Separate immutable prepared-source validity, retained creation identity and
  current-document validity. A post-apply source check does not certify later
  canvas edits. Consumers still validate current target existence/permissions and
  attachment admission. Removed targets are explicit, never replaced by guessed IDs.
- Preserve request/call ownership, borrowed/sibling isolation, capacity safeguards,
  explicit release, cancellation and request-end cleanup. No longer TTL, blanket
  request pinning, silent eviction, source duplication or raised limits.
- Add structured, bounded ownership diagnostics for publish/export/consume/release
  with request/call lineage, declared output path and release reason. Do not log
  complete source at each hop. Distinguish expired/released/foreign/unknown handles
  where the owner has evidence; give a current recovery route without auto-replay.
- Red-first proof: the actual host invokes the real compound owner, returns, then
  a fresh call resolves its artifact, reviews source and targets a stable key.
  Cover compact/full, ordered parts, later failure, interruption, borrowed handles,
  explicit release, cleanup failure and request end. Assert both usable exports
  and actual disposal of unexported intermediates.

#### Slice B - selection stays behind a retained reference

- Owners: existing preparation key index; canonical context reader/retained
  snapshot; registered batch target resolver. Prefer original keys/target sets
  for known creation members. They never masquerade as live Group children.
- For spatial tasks, compose canonical bounds/membership with a finite typed
  predicate before returning a result. Add exact-name/prefix/suffix predicates
  only to the authoritative context filter contract, inherited by batch queries;
  no executable callbacks, regular-expression code, guessed semantic tags or
  parallel App selector. Support predicate refinement of a current retained
  candidate snapshot without sending candidate rows back to the model.
- Default delivery is a reference plus matched count and optional bounded preview.
  Explicit rows/columns and pagination remain available for actual inspection.
  Expose the same retained target to plural mutations; no complete ID-list echo.
  Names are selectors, not unique identities: combine them with explicit scope,
  report the count and reject a violated caller-specified count constraint before
  writes. Do not silently broaden an empty match.
- Keep snapshot selection and mutation freshness distinct. A newly matching
  object, renamed object, move, delete or relevant property change can invalidate
  the selected set. Revalidate at the execution boundary; return targeted stale
  recovery rather than silently reselecting a different destructive target set.
  Internal query-to-write may resolve once at its admitted execution boundary.
- Work proof: reproduce the recorded crown candidate set and 24 exact deletion
  targets; normal reference-to-edit delivers no 2,736-row/ID payload to the model.
  Assert exact targets, one candidate selection, internal refinement work counts,
  no unrelated subtree scans, explicit-page availability and stale/empty safety.
- Coordinate handoff remains explicit: capture regions are target-local while
  spatial queries use the registered workspace bounds contract. Convert through
  canonical transforms and bind their dependencies; never reuse image pixels or
  target-local rectangles as workspace bounds by assumption. A moved or reparented
  scope must be revalidated before a destructive edit.

#### Slice C - scoped check units and coverage

- Owners: inspect coordinator, existing result dependency index, canonical data
  review and browser evidence. Keep original requirement criteria immutable, but
  allow separately identified check units under a criterion: criterion revision,
  declared verification method, stable scope identity, relevant rule revision and
  dependency versions. Inspection IDs are evidence versions, not unit identities.
- Multiple regional units for one criterion coexist. Relational units explicitly
  depend on the involved regions or upstream checks. Truly global silhouette,
  perspective or whole-request judgments remain global; do not label them local
  merely to retain a pass. Units derived from tool rules have tool provenance;
  subjective units pass only after the primary agent judges delivered images.
- Coverage belongs to the original requirement and current affected content, not
  whichever units happen to be green. Additions create uncovered obligations;
  removals retire obsolete membership with evidence; replacements/reparenting
  invalidate their real dependents. Explicitly account for an original unresolved
  finding when a design is replaced. Splitting scope cannot erase that finding or
  narrow the original requirement. Empty coverage never implies completion.
- Intermediate capture and assessment require currency/coverage only for the
  declared units. A local crop can be judged without an unrelated whole-building
  overview. Final completion alone requires current whole-request visual coverage,
  requested detail and all required data/visual obligations. Fresh final imagery
  does not automatically make every old regional judgment stale or every new
  region pass; dependencies determine reuse.
- Decouple deterministic data checking from taking a picture. Cache rule results
  by their real dependencies and valid lifetime in the existing inspection owner.
  Initial validation checks relevant source/content; later validation recomputes
  dirty units plus actual relation/global aggregates. Examples: local text geometry,
  shared-property consumers, parent transforms, structural membership and overall
  extents have different dependencies. A final aggregate reads verified summaries
  where sound rather than rescanning every unchanged object. Unsupported rules or
  unknown effects stay conservatively dirty; no duplicate canonical scene mirror.
- Do not weaken the separate first-write attachment stamp or transactional safety
  to optimize inspection. Viewport pan/zoom and selection remain nondependencies.
  Cross-document/load/disposal invalidate affected owner state. Shared fills,
  regional entrants/exits, reference changes and real cross-region relationships
  must still reopen every dependent pass.
- Publish existing deterministic preparation results automatically into the same
  result owner, with source/rule provenance. Do not ask the agent to call a review
  tool merely to record already computed checks. After apply, acknowledge which
  canonical effects correspond to that source; later canvas edits require current
  data checks, not a recheck of the old source as proof. Tool descriptions and
  examples must make this boundary explicit while retaining intentional source
  review and repair for changed preparation inputs.
- Keep successful evidence internally and return pending/stale units plus counts,
  scope, reason, dependencies and exact next-tool arguments. Main-agent submissions
  may include both passes and failures in one call; omission leaves other units
  unchanged. Identical submissions are idempotent. No compulsory visual review
  after each batch and no additional model requests to populate the worklist.
- Red-first actual-dispatch proof: eight regions share one criterion; record their
  independent passes, change the third region, inspect/submit only that region,
  retain the other seven and finalize with current overall evidence. Also test
  real shared dependencies, cross-region redesign, new/unjudged content, current
  mixed-age images, stale findings, missing coverage and reference changes.
  Count rule executions and metadata reads as well as output equality. Existing
  independent-criterion and browser receipt tests must remain valid.

#### Slice D - truthful purpose continuity and causal reporting

- Owners: provider activity producer, existing activity state machine/presentation
  and Runtime report aggregation. A semantic work segment outlives individual
  calls; its identity/revision/neutral purpose is separate from active execution
  phase. New purpose supersedes a segment; ordinary call completion does not.
- Tool-start/finish, browser apply and capture events own the phase. After a write
  finishes, keep the established subject but show analysis/preparation, not ongoing
  drawing. Use existing authored tool messages/public commentary as correlated
  purpose updates; do not infer private reasoning or invent the next task.
  Structure purpose as a subject plus owner-derived phase rather than repeatedly
  applying string precedence or language-specific verb rewriting. No language change.
- Generic protocol traffic must not replace concrete purpose with the full prompt.
  Concurrent unrelated work shows a truthful shared segment and active count;
  completed children are not active. Reject late events/old attempts; stop, error,
  retry and success retain lifecycle priority. Loop deduplication compares semantic
  phase/purpose revisions so repeated traffic does not flicker.
- Record purpose source, segment/call lineage, selected phase and transition reason.
  Report check attempts separately from successful checks, retained versus
  recomputed units, invalidation causes/dependency edges, query selection/refinement
  counts, rows/bytes delivered and handle retention failures. Read actual
  primary-agent accepted outcomes; absence of a second model is not absent review.
  Missing records remain missing; do not fabricate completion or sum nested spans.
- Red-first event replay covers the actual concrete-call -> completed -> provider
  gap, sequential and concurrent parts, old commentary, cancellation and retry.
  Browser proof checks displayed phase and purpose through real event handoffs.

### Implementation order, boundaries and closure gates

After this planning checkpoint, establish the common-contract proof described
below, then implement A, B, C and D in bounded owner cards. Establishing the proof
means agreeing exact current contracts and adding their failing formal cases;
it does not authorize a new invocation architecture or a parallel validation system.
For each, align current App spec and compose/prepare/apply/inspect/settle Inspector
contracts before production changes. Use existing registered tools and common
Runtime invoke; update generated catalog only through its generator. Expected
files are the named owners above, their direct schema/prompt/example consumers,
permanent tests, report evaluator, spec, manifest, Inspector and this plan. Any
new Core capability must first demonstrate that existing public APIs/indexes
cannot provide it; rendering and canonical document-format changes are excluded.

Focused formal tests must fail on each original boundary and pass after correction.
Then run direct consumer tests, applicable typechecks/naming/lint and focused
browser handoff/work-count cases. No full local CI at this stage. Use stored live
inputs as regression evidence through permanent generic cases; do not publish
local recording harnesses or hard-code Taipei-specific production behavior.

One later authorized full recorded 101 run checks actual adoption: no additional
review AI, all returned recovery handles usable as declared, reference-to-edit
without mass row delivery, local review accepted without a global prerequisite,
and honest status continuity. Report first visible detection, stage timing,
selection/validation work counts, bytes and final references. If the natural agent
never submits a local pass before editing, explicitly report that live limitation;
do not claim it exercised pass preservation or force unnecessary review calls just
to produce a favorable trace. The deterministic dispatch/browser cases remain
mandatory. Completion requires both correct architecture and stated evidence,
not merely a faster stochastic duration. Remote operations/monitoring remain off.

### Self-review and resolved planning gaps

- Retaining handles alone does not make them current canvas truth: source identity,
  target existence, mutation settlement and document evidence stay separate.
- No accidental memory fix by retaining everything: exported/request-owned values
  have explicit lifetimes; internal temporaries and alias pins have tested cleanup.
- Fast spatial lookup already works. The correction closes filtering and delivery,
  including exact selection semantics and TOCTOU, rather than adding another index.
- Scope is attached to check units, not fabricated new user requirements. Coverage
  and original failures cannot disappear through renaming, splitting or replacing
  units; dependency cycles and upstream stale results must reject acceptance.
- Regional pass reuse and final whole-image judgment are compatible. Global visual
  reevaluation does not require global deterministic recomputation or discard
  independent local passes. Actual global/unknown dependencies remain conservative.
- Current status keeps purpose without keeping finished execution alive. When no
  specific purpose has been authored, the UI must be honest about that limitation;
  it must not invent a detailed next action to satisfy a presentation test.
- Verification crosses the exact missing boundaries: compound output -> cleanup ->
  next consumer, snapshot -> refinement -> mutation, actual dispatcher -> local
  judgment -> final coverage, producer -> state machine -> UI -> report. Owner-only
  fixtures and one screenshot cannot close these regressions.
- Self-review result: the plan addresses the four requested problems and their
  direct observability gaps together. No production fix or performance improvement
  is claimed at this checkpoint; implementation and its red/green proofs remain.

### Follow-up self-review - prove behavior across real boundaries

Planning-only review requested after the common-format discussion. The same
mutation scope and exclusions apply. No production changes or tests were run for
this review. The original plan already requires shared contracts and returned
reference retention; the failure is incomplete enforcement and evidence, not a
newly discovered user requirement. The following closes gaps in the proposed
proof method before implementation.

1. **Use independent behavioral expectations, not only schema agreement.**
   Keep exact schema tests, but derive semantic expectations from the current
   product cases and known fixture content, not from the validator or selector
   being tested. An output accepted by its own permissive schema is insufficient.
   The real host must finish and perform cleanup before a new invocation consumes
   an exported handle. Verify the actual stored value, exact selected identities
   and real disposal callback. The test must fail when the handle annotation is
   omitted, export is removed or cleanup occurs early. Use bounded negative
   fixtures/fault injection in existing tests, not a new mutation-testing system.

2. **Discover coverage from the actual registration paths.**
   Enumerate the current Design host's native, registry-only and composition/control
   routes using the existing formal test setup. Compare that set with the existing
   executable cases so a newly registered or wrapped tool cannot silently escape
   coverage. Shared cases verify common admission/outcome/lifecycle invariants;
   owner cases verify meaningful domain values and applicable outcome variants.
   An inapplicable variant needs a tested contract reason, not a blanket skip.
   Do not build another production registry or self-referential audit artifact.

3. **Prove semantic equivalence of entry paths, not identical wire JSON.**
   Provider adapters may use protocol-specific envelopes; decoded invocation and
   result semantics must be the same canonical contract. Domain owners supply
   execution facts and data. The shared boundary validates and packages those
   facts; it must not guess mutation settlement from arbitrary field names or a
   successful transport. Common control fields cannot be shadowed by domain data.
   A wrapper derives its declared output mapping and reference annotations from
   authoritative child contracts rather than replacing them with open objects.
   Legitimate domain maps keep explicit value schemas; do not mechanically ban
   all extensible data or force every tool to have identical domain parameters.
   Compare native/direct and composed behavior for the same known inputs through
   actual discovery, admission, invocation and downstream consumption.

4. **Separate recovery artifacts from successful dependency values.**
   A partial or unknown result may preserve useful artifacts and acknowledged
   writes for explicit recovery, while remaining ineligible as a successful step
   output. Test cancellation before dispatch, after an acknowledged mutation,
   between ordered parts and during export/cleanup. Assert exact write counts,
   stopped successors, no automatic replay, correct settlement and independent
   cleanup diagnostics. If acknowledgement is lost, retain unknown settlement;
   neither successful cleanup nor a later report may invent success or rollback.

5. **Test ownership isolation and document freshness independently.**
   A retained handle must survive the producing call but fail after explicit
   release/request end; borrowed inputs and sibling ownership remain isolated.
   A currently owned reference can still point to obsolete document membership.
   Test an edit between selection and consumption, shared-property changes,
   reparenting, deletion/Undo and document replacement at controlled boundaries.
   Test concurrent calls with deterministic barriers rather than timing sleeps.
   Verify both allowed reuse and required rejection, plus terminal cleanup without
   leaks. Saved reusable recipes carry no request-owned handle into a new request.

6. **Check values, work and delivery as separate outcomes.**
   Exact edit results alone cannot prove reuse. Assert selection/rule execution
   counts, unaffected-subtree reads, payload rows/bytes and actual ownership
   cleanup alongside correctness. The eight-region/same-criterion case must use
   the real review dispatcher, not only the result-store helper. Unchanged passes
   must survive; actual shared dependencies must reopen them. Pass counts are not
   required to increase monotonically when a redesign invalidates earlier work.
   New or unjudged content remains uncovered. Final visual approval and complete
   requirement coverage stay separate from individual data-check successes.

7. **Make visible state and reports accountable to the same causal events.**
   Replay the actual operation-completed -> provider-processing boundary through
   the activity producer, reducer and browser presentation. Keep purpose without
   reporting completed drawing as active. Verify delayed events, retries and
   simultaneous calls. Compare report classifications with known invocation
   receipts, including failed checks, partial success and accepted primary-agent
   findings; never let report aggregation serve as its own correctness oracle.

Execution remains a set of focused permanent tests plus a small number of real
cross-owner/browser cases, not one giant test that hides the failing boundary.
Each demonstrated bug gets a failing case before its fix. Existing valid behavior
is checked on the same source. Later recorded 101 acceptance tests natural model
adoption and timing, but cannot replace deterministic coverage for branches the
model never exercises. No additional review model may be called; test the provider
request boundary as well as checking the resulting trace.

Self-review conclusion: the revised proof now separates contract completeness,
runtime behavior, resource lifetime, dependency freshness, execution work and
user-visible truth. It has explicit failure witnesses and real consumer checks.
Planning review is complete within this scope; the proof is not yet executed,
and implementation correctness or a future speedup is not established.

## Authorized implementation - task ownership and retained execution

Authorized after the planning checkpoint on 2026-10-13. Continue locally in this
worktree; implement the reviewed corrections, with no push, monitoring restart,
full local CI or new live-model drawing unless separately requested. Earlier
planning-only sections describe their historical checkpoints, not a current stop.
This section integrates slices A-D and their cross-boundary proofs above with the
following task orchestration contract. Preserve the App model/effort, canonical
write/Undo owners, current source data and other local work.

### Owner allocation and complete task flow

- Primary AI decomposes the user request, specifies scope, parameters, constraints
  and completion criteria, queries existing capabilities and chooses an existing
  primitive, a saved composition or a proposed new composition. It owns design
  decisions, new recipes and subjective evaluation of delivered visual results.
- Runtime owns canonical registration/admission, input/result validation, finite
  orchestration, dependency handoff, cancellation, progress and lifecycle. It
  never invents design intent or calls a second model to decide a repair.
- App tool owners implement registered domain operations and deterministic checks
  through existing APIs. The host retains permissions, document freshness,
  scheduling, transactional settlement and concrete artifact storage.
- Runtime storage/library owns candidate eligibility and durable save/reload.
  The primary AI supplies applicability and parameterization. Existing policy
  permits saving only the exact successfully verified candidate revision; saving
  is separate from task completion and never reexecutes product writes.

The primary agent starts capability selection at a meaningful subtask boundary,
not before every leaf call. Search the same registry including saved compositions.
Changing targets or parameter values does not require another tool. New recipes
are appropriate when the next operations can be determined from declared inputs
and prior outputs. A need for new visual/design judgment returns to the primary
agent. Missing primitive capability is reported, not manufactured by composition.

Task input references a registered operation/recipe revision, fresh domain inputs,
scope and retained progress, constraints and explicit completion obligations.
Use existing criteria and check-unit identities rather than a second independent
Design acceptance ledger. Admission identifies missing/unsupported inputs or
expired references before writes and returns field/step-specific issues. Domain
owners determine which criteria are mechanically checkable. Subjective criteria
remain primary-agent obligations and cannot become program passes by assertion.

Execution completion, deterministic checks, primary-agent acceptance and durable
tool storage are distinct results. Task completion requires all applicable
obligations to be current and fulfilled; no pending/failed/unknown required unit
may disappear through omission or criteria rewriting. Data-only tasks do not
require invented visual review. A correction continues the same task with retained
progress; actual changed dependencies reopen corresponding units, including prior
passes. Final visual coverage remains required for drawing tasks.

New composition lifecycle: primary-agent proposal -> pure Runtime admission ->
private candidate registration -> explicit invoke through the existing host ->
applicable verified execution -> eligible durable save acknowledgement -> ordinary
discovery in a fresh request -> new-input/dependency/freshness admission on reuse.
Store the common descriptor, recipe, dependency versions and eligibility evidence,
never current-document IDs, request artifacts or credentials as recipe defaults.
Preserve existing exact-revision resume, suspension/removal and save-only recovery.
Equivalent parameters reuse existing tools; do not infer semantic equivalence
from similar names or automatically substitute a near-match tool.

### Controlled iteration and accepted boundaries

Current recipes support finite ordered steps. Extend only the existing Runtime
composition owner for controlled repair; do not create a second App interpreter.
Primary AI must declare the registered check and repair operations, typed result
bindings, applicable program findings and a finite iteration/work budget before
execution. No generated JavaScript, arbitrary expressions, unconstrained recursion
or callback from AI. Admission validates all reachable dependencies before writes.
Only a fully acknowledged iteration can feed the next iteration; partial/unknown
settlement stops and returns actual progress for explicit reconciliation.

Use typed check outcomes to determine pass, mechanically repairable findings or
primary-agent decision required. Apply only declared repairs to unresolved scopes.
No progress, repeated identical unresolved state, budget exhaustion or an unknown
repair stops with an actionable receipt, not a false pass. Sequential checkpoints
retain successful output and do not repeat initial writes. Tools never decide new
colors, remove unspecified geometry or otherwise invent intent to satisfy a check.
Progress is streamed while one task invocation runs; completed ready parts publish
without waiting for every part. Coordinator waiting holds no leaf scheduler lock
or physical transaction. Stop remains effective between and during owned steps.

### Implementation sequence and self-review

1. Establish real-host common-contract proof and close slice A resource exports.
2. Close B precise retained selection, C scoped checks/coverage and D truthful
   purpose/reporting using their owner-scoped test-first gates.
3. Extend Runtime composition contracts/admission/execution for the typed bounded
   iteration above, then integrate task inputs/completion and AI-facing guidance
   through existing discovery, dispatcher, criteria and library owners. Review and
   admit that exact Runtime flow before its production slice; existing ordered
   recipes must remain supported without new mandatory repair steps.
4. Prove new candidate creation -> real execution -> save acknowledgement -> fresh
   request discovery/use, plus rejected recipe, failed/partial run, save failure,
   cancellation, no-progress stop and changed dependency. Preserve current formal
   durable-library proofs rather than rewriting that implementation gratuitously.
5. Run focused affected-consumer/type/lint/naming and browser gates; record what
   actually passed. Complete source-bound Inspector evidence and self-review.
   No new full local CI, remote work or monitoring as part of this authorization.

Review resolved: the "main tool" is the common entry over Runtime, not a new model
or semantic planner. Runtime cannot infer arbitrary repairs; they must be admitted
registered operations. Technical recipe eligibility does not certify artistic
quality. Request execution data and saved reusable recipe identity have separate
lifetimes. Shared outcomes are derived from explicit owner facts, not loosely
interpreted domain fields. The existing multi-owner plan requires these slices
together; completing the first slice is not whole-task completion.

### Step Execution Card - compound result resource export

- Owner/route: compose; existing prepared-artifact output -> host retain -> next
  prepare/apply consumer. Failure owner: compose; concrete disposal remains prepare.
- Authority: App spec shared tool contract and retained prepared application;
  Inspector compose combined-workflow/partial-outcome conditions and prepare
  immutable-handle lifetime; Tool Specification returned references/partial results.
- Inputs: admitted draft/repair/ordered parts, canonical child descriptors and
  acknowledged operation receipts; outputs: typed single/ordered/partial receipts
  with usable exported preparation handles and exact product settlement.
- Conditions: retain before cleanup, partial never becomes success, unknown writes
  never replay; no ownership bypass or blanket retention. Allowed contributors:
  existing preparation, invocation, workflow and lease owners. Forbidden: model
  inference, field-name handle guessing, extra registry or changing canonical writes.
- Boundary: local-design-workflow.ts, local-tool-host.ts and local-tool-leases.ts
  only if their actual contract requires correction; existing owner/host/proof tests,
  App spec/Inspector/manifest and this plan. Reuse child schemas, no extra format.
- Cases/gates: real-host single compact/full, ordered completed/partial and failure
  recovery exports, next-call key consumption, release/request disposal, unreturned
  cleanup and owner isolation; source-changing regression red first, focused tests,
  production/server types, naming, lint and source-bound Inspector proof.
- Stop: invalid output, swallowed handoff failure, unknown settlement reclassified,
  inaccessible returned handle, undisposed intermediates or changed write counts.

#### Retained failure boundary - reviewed refinement

Real-host tests reproduced two independent losses: omitted compound output
references, and a declared prepared artifact returned with a failed applicability
check. The latter must remain failed, while its repair data remains usable. Current
common contracts validate only success/partial, so neither blindly retaining every
failure nor treating it as partial is correct.

Complete the compound-success correction first. The next bounded invoke-owner
slice adds an optional immutable `recoveryOutputSchema` to the same descriptor for
failed/unknown results. Validate it without changing outcome/settlement; only
declared, validated recovery data may transfer leases. Undeclared failures remain
diagnostics without resource export. Nested composition must propagate explicit
recovery receipts and pinned schemas before ancestor cleanup, never forward them
as successful successor inputs or use them as save eligibility.

The directly required boundary is Runtime tool-contract/recipe-execution and
existing tests/public exports/spec/invoke Inspector, then Design invocation/host/
library projection and compound/preparation declarations. This is part of the
authorized common handoff correction, not a separate registry or a tool-specific
exception. Test invalid/absent recovery, failed and unknown settlement, nested
cleanup, cancellation, native/composed equivalence and no replay before closure.

Self-review found a directly related schema-projection defect: embedding a child
schema loses its local `$ref` root, and union-branch ownership checks discard the
original schema root. A formal recovery-envelope test reproduced the failure.
The bounded correction includes the existing App tool-schema validator and lease
walker plus Runtime canonical schema embedding. Preserve literals, arrays and
constraints; do not weaken validation or infer references from returned field
names. This must pass before the recovery slice can close.

Source proof found the existing `ignore-canonical-evidence` scenario still
targeted the removed `entry.result.current === true` expression. Its failed
attempt collected no cases and is not passing evidence. Update only the mutation
anchor to the current grouped canonical verdict rejection, keeping missing
receipts rejected. The current mutation correctly violates both final-current
evidence and scoped-dependency reconciliation; declare both exact failures. No production
evidence rule is relaxed. Re-run the bounded positive/negative/recovery proof
before accepting this segment.


Retained export verification completed locally: Runtime 126 focused tests and
Design 218 focused tests pass; Runtime build and server types pass. Focused lint
has no errors and one existing console warning in the proof fixture. Runtime
same-source proof passes four obligations; Design same-source proof passes 25
obligations, all three exact negative scenarios and recovery. The obsolete-anchor
and missing-second-expected-failure attempts remain failed evidence. Corrected
proof: `tmp/retained-app-proof-final.log`, source
`c8a73c5473509b1c951469bcf490db6aa3d663fecb0ead2adb1dc7af209f1a52`.
No live-model or global delivery gate was run.

### Step Execution Card - canonical native result projection

- Owner: compose; source: Shared tool contract in the execution spec and compose
  canonical-browser/native-receipt condition. This closes a direct consumer of
  the new recovery schema before advancing to query ownership.
- Inputs: canonical browser descriptor and its success, partial and optional
  recovery schemas. Outputs: native receipt envelopes with the same outcome
  meanings and resolvable local schema references.
- Conditions: wrap each declared domain schema at the actual primary result
  position; preserve independently typed automatic-inspection tails. A missing
  recovery declaration remains missing. Preserve failed/unknown outcomes.
- Contributors: canonical Runtime schema embedding and existing App validator/
  lease walker. Forbidden: field-name inference, duplicate schemas, extra AI,
  retries or changing write/Undo semantics. No new retained cache.
- Boundary: existing local-operation-tools, src/ai/tool-contract and formal
  local-operation-tools tests, already in compose allowlist. Failure owner:
  compose projection; browser operation execution remains unchanged.
- Test first: native success/partial/recovery using local definitions must
  validate the envelope and retain only the declared request handle; reject
  malformed values and unwrapped payloads. Check the shared partial constructor.
- Gates: focused operation/invocation/lease tests, production server types, naming,
  focused lint and current source proof. Stop on changed outcomes or resource
  extraction differences, unresolved refs or an out-of-boundary requirement.


Canonical native projection closed: three new regressions failed first; 184
operation/invocation/lease tests, server production types, focused lint and naming
pass. Source proof passes all 25 obligations, three exact negatives and recovery
(`tmp/native-projection-proof.log`, source
`030080b53f5b89f69d6fb7cf7516111d9fa1e3a1a912ed3d756722439e1185ca`).

### Step Execution Card - retained predicate selection

- Owner: apply; source: slice B, Shared tool contract and canonical region query
  spec, Inspector apply region/retained-query conditions. Inputs: workspace bounds
  or a current request-owned snapshot, canonical finite filter and optional exact
  expectedCount. Outputs: live reference/count, explicit pages on request.
- One canonical filter supports type, parent, ancestor, lock and conjunctive
  literal name equals/prefix/suffix; no regex or generated callbacks. Snapshot
  refinement examines retained candidate identities and current metadata, never
  repeats the spatial selection or sends rows to the AI. Name is not identity.
- Reuse existing snapshot retention/leases and current revision rejection. A
  refined snapshot owns its materialized subset independently of its source;
  release, cancellation, foreign requests and stale reads remain rejected.
  Count mismatch rejects before target consumption; empty matches stay empty.
- Allowed contributors: canonical context reader/source and retained-query owner;
  forbidden: broad hierarchy scan, silent reselection, guessed coordinate space,
  raised capacities, new index or model call. Cache key is source snapshot plus
  exact predicate/count within the existing request/revision lifetime.
- Boundary: design-context and retained-design-context with their existing formal
  tests, context-action canonical schema and tests; apply allowlist already names
  them. Failure owner: canonical query admission; batch mutation keeps its existing
  permissions and synchronous freshness boundary.
- Prove 2736 candidates refined to 24 exact targets, one spatial query, zero
  additional computed reads, no returned rows/IDs by reference, explicit pages,
  cache hit work counts, stale/foreign/released inputs and count mismatch. Then
  verify canonical batch target-schema inheritance and affected browser tests.
- Gates: focused reader/retained/context action tests, production types/lint/naming
  and source proof. Stop if canonical target consumption or stale protection is
  weakened. No live test, broad local CI, push or monitoring.


Apply-side focused gate: 51 tests and both production typechecks pass; focused
lint/naming pass. The 2736-to-24 proof records one spatial selection, 2736 metadata
reads during first refinement, zero computed reads, zero work on repeated
refinement, explicit page access and stale/foreign rejection. Additional literal
predicate/count and canonical-schema cases cover the direct consumer boundary.

### Step Execution Card - region target predicate handoff

- Owner: compose, canonical region target schema projection and existing batch
  resolver. Spec: Retained predicate selection; Inspector compose canonical region
  declaration and apply complete-target admission.
- Input: registered context filter/expectedCount schema plus exact operation
  binding; output: unchanged canonical region arguments and complete validated
  target identities supplied internally to the existing plural mutation.
- Derive count declaration from the same unique region-capable schema. Missing
  count declaration means no new count option. Reject mismatching returned count
  before a mutation; no result can silently widen the intended target set.
- Boundary: local-operation-tools and its formal tests, existing compose allowlist.
  Forbidden: second selector, name heuristics, changed mutation/Undo owner or
  retaining model-visible candidate lists. No cache added.
- Red/green: extend the existing actual region-to-mutation handoff with literal
  predicate and expectedCount; add complete-but-wrong-count failure. Gates:
  affected reader/action/batch tests, types/lint/naming and same-source proof.
  Stop on partial/empty/stale bypass or extra spatial selection.


### Bounded iteration - successful borrowed query consumption

The new real reader-to-fill proof first needed explicit headless host adapters;
that fixture failure is not product evidence. After using the same injected Core
boundary as the existing reader tests, the proof exposed a product defect:
retained-fill-action released every lease immediately after computing a mapping,
including caller-owned leases. The existing regression only covered rejection
before that point. Both the first run and focused reproduction fail at the
post-success borrowed-lease assertion. Do not weaken the expected stale verdict
to accept a released handle.

Re-review: apply owns both query lifetime and canonical mapping consumption.
Its existing allowlist includes retained-fill-action and its formal tests. Extend
this bounded slice to that direct consumer only. Release an immediately consumed
lease only if this invocation acquired it; finally cleanup uses the same owned
set. No changes to mapping math, permission checks or write admission. Strengthen
borrowed-lease tests for successful and rejected consumption, retain actual-host
proof and verify stale rejection inside the next mutation boundary. Other query
and shared-owner behavior is unchanged. This directly repairs the approved
borrowed/sibling lifetime requirement rather than adding a compatibility path.


Verification placement review: the real reader-to-fill product case belongs in
existing browser `retained-fill-action.test.ts`; importing its default Core/fill
owners into the server proof pulls DOM modules into the Node-only production
type graph. Keep this formal test in its browser owner and run it explicitly;
do not change TypeScript environments or suppress type checking. The server
same-source proof still covers its registered region-to-plural-dispatch boundary.
No existing obligation is removed; the temporarily added browser case mapping is
not part of the accepted baseline. Borrowed ownership on success stays asserted,
and the actual browser case must pass before this slice closes.


Retained selection closure: reader/action/operation tests pass (178 before the
additional successful-consumer regression); final integration passes 25 server
proof cases plus 14 browser mapping cases. Both production typechecks pass after
keeping browser tests in their owner. Focused lint has zero errors and the existing
proof console warning; naming passes. Current source proof passes 25 obligations,
three negatives and recovery (`tmp/refinement-source-proof.log`, source
`407e3694e6e221772a3625a2ad04394c0f568df2b907d78d7505ca17733402a7`).
The transient headless import failures remain failed evidence, not product passes.

### Step Execution Card - independently retained visual check units

- Owner: inspect, spec slice C and retained-check requirements. Inputs: immutable
  criterion identity, optional stable unitId, delivered scoped images, primary-agent
  findings and canonical per-image currency. Outputs: independent retained unit
  results plus unresolved work; final request acceptance remains separate.
- Add unitId under an existing criterion instead of making another criterion for
  every region. Scope identity derives from actual image targets/crops, not image
  receipt IDs. Repeated evidence is idempotent; another unit cannot overwrite it.
  A reused unit cannot silently change its target/crop; redesign reconciliation is
  a subsequent explicit owner handoff, never implicit omission or renamed scope.
- Intermediate visual capture/judgment validates only its supplied images. It does
  not require whole-request coverage or a whole overview. Final still requires
  current whole coverage/detail, every original global criterion and every retained
  required unit fulfilled; no unit omission clears pending/stale findings.
- Preserve existing independent-criterion behavior. Aggregate criterion completion
  remains its primary-agent whole-result judgment, not automatic artistic approval
  from regional passes. Unit passes remain available for that judgment.
- Contributors: canonical evidence validation and existing designCheckResults
  dependency graph. Forbidden: another AI, global invalidation for a known local
  edit, automatic unit pass, new criterion ledger or hiding missing coverage.
- Boundary: local-design-review, design-check-results, local-operation-tools and
  existing design-review-stages/local-operation-tools/execution-flow-proof tests,
  all in inspect allowlist. No new cache. Failure owner inspect.
- Tests: eight units under one criterion, crop-only intermediate, targeted expiry
  leaves seven passes, same unit repair updates only that unit; omitted stale unit
  blocks final acceptance, unchanged resubmission preserves revision, current whole
  evidence permits final acceptance only after repair. Existing source-current
  negatives and final coverage remain required.
- Gates: focused review/dispatch/result tests, types/lint/naming and source proof.
  Stop if scope can change silently or a regional pass can approve whole request.
  This closes unit retention; deterministic rule reuse and explicit redesign
  reconciliation still require their subsequent owner slices.

Scoped visual-unit closure: 266 focused tests passed. Candidate
`2a637f0d-7b4f-4550-8134-9becbab50c99`, source
`3835ed9a49ebee13775736a96481858fde379b4d3e51d0fe1b115b6b73d0b180`,
accepted review `81d76be6f57f740ccda7e20ed3ae02db921f6cde8446457ac6f7a913c9cda9c1`.
Same-source proof passed 26 obligations, all three exact negative scenarios and
recovery (`tmp/scoped-units-proof-final.log`). The stale-evidence mutation also
fails the new regional-unit case; its expected violation list now includes that
case. The earlier mismatch remains a failed proof, not a product regression.

### Step Execution Card - capture and deterministic checking separation

- Owner: `inspect`; source: Evidence and completion / Scoped visual check units.
- Inputs: explicit capture targets, current browser measurement stamps, retained
  visual IDs and actual canonical mutation observations. Output: image-only
  capture receipts and independently current deterministic measurement results.
- Capture must never start a subtree measurement. Ordinary mutation coordination
  may explicitly check before presenting images. Final visual assessment checks
  each required overview target's deterministic evidence, running missing/stale
  checks once; final acceptance still requires current measurements. Intermediate
  local review does not trigger an unrelated whole-target scan.
- Contributors: registered browser measurement and evidence validation; no model
  calls, cached server revision as freshness, raised limits or lowered checks.
- Boundary: local-operation-tools and its formal tests, canonical review-action
  and its evidence tests; existing inspect spec/Inspector/plan. Failure remains
  inspect-owned with partial/unverified outcome. Later node-level computation
  reuse remains a separate slice, not claimed by capture separation.
- Tests: explicit capture performs zero deterministic calls after deferred writes;
  final assessment performs required checks once; repeated captures do not repeat
  checks; incomplete measurement still blocks completion; existing automatic
  mutation checks and text-overflow recovery remain intact. Run affected host
  suites, types, naming/lint and same-source proof. Stop for a broken caller
  contract before expanding to another owner.

Capture separation closure: 261 host tests and 32 browser/evidence tests passed;
production browser/server types, focused lint and naming passed. Canonical browser
measurement receipts now use the existing scoped evidence owner. Red-first proof
showed the old global stamp incorrectly invalidated B after editing A; the current
receipt retains B and still invalidates both on shared ancestry changes. Candidate
`2193ec91-1e7c-4125-a287-5db98c14d1b4`, source
`635fdf185af97d56cf626f73456d8980727a513220ad44bca1dc803baefa16c5`, review
`6e523736ecbb2b4c4be014b849bca3779c2cbf9eb5e285c3edc955660e6b82e9` accepted;
26 source obligations, three exact negatives and recovery passed. Evidence:
`tmp/capture-separation-*` and `tmp/measurement-scope-*`. This removes implicit
capture scans; node-level deterministic computation reuse remains outstanding.

### Step Execution Card - explicit visual unit redesign

- Owner: inspect, same Scoped visual check units and retained result owner.
- Inputs: existing criterion/unit identity, exact previous result revision,
  explicit redesign reason and current delivered replacement image scope. Output:
  revised unit under the original obligation, with supersession provenance;
  dependent check results become stale and unrelated passes remain unchanged.
- Stable-scope ordinary rechecks need no supersession. Changed scope requires an
  explicit exact-revision declaration. Never delete unresolved obligations or
  silently map them to another criterion. The original global criterion and
  current final coverage remain required. A removed/replaced design is assessed
  through current replacement/absence evidence under the same obligation; the
  tool validates evidence identity and version, while semantic resolution belongs
  to the primary agent. No tool asserts visual correctness on its own.
- Contributors: primary agent, canonical delivered image scope and existing
  dependency result store. No additional model, arbitrary repair or broad reset.
- Boundary: local-design-review, design-check-results, their formal tests and
  inspect spec/Inspector. Failure owner inspect. Focused gates: schema plus
  exact revision, failed/unknown replacement blocks final, same-scope duplicate
  images, unrelated pass equality and dependency invalidation; type/lint/naming
  and source proof. Stop if replacement would require changing original criteria.

Explicit unit redesign closure: 236 focused tests, production server types,
focused lint and naming passed. Same-source proof passed 26 obligations plus
three exact negatives/recovery. Candidate `a7c14e87-f3cf-405c-880a-0a8fe193408e`,
source `7e52ed2b4a12b04dc8fc1ac8401ff0b7b026778e3fe01b00434306bfc991ad37`,
accepted review `3c14139f38f0d497b6f28ac4283a3f9579cbe7f126b82d5e9064e4fe0f9598e8`.
Evidence: `tmp/unit-redesign-*`. Units retain their obligation across redesigned
scope; this does not yet complete incremental deterministic rule execution or
Runtime bounded repair orchestration.

### Step Execution Card - canonical attachment dependency refresh

- Owner inspect; existing canonical attachment, scoped-dependency and preparation
  reuse contract. Inputs: retained exact parent/workspace/basis/bounds receipt and
  canonical changes. Outputs: current/stale per-attachment result, never a new
  whole-workspace stamp used to invalidate unrelated parent evidence.
- Root cause: preparation refresh compares each attachment to a newly captured
  workspace stamp. Browser attachment capture also uses a global revision despite
  reading only ancestor membership and parent geometry. Both over-invalidate.
- Reuse the existing receipt index. Attachment receipts retain the small actual
  parent geometry signature; affected canonical changes trigger lazy signature
  validation once, unchanged dependencies remain current. Unknown/load/disposal
  invalidate; removed/locked/reparented invalid containers or changed geometry
  cannot remain valid. No scene clone, child traversal, pixel inference or AI.
- Boundary: inspection-dependencies/evidence and tests, prepared-review refresh and
  tests, existing spec/Inspector. Dependency source reads only canonical parent
  metadata, bounds and three basis points; the active request owns receipt lifetime.
  Preparation refresh asks attachmentCurrent and never recalculates an attachment.
- Gates: unrelated parent and unchanged child edits retain passes; changed parent
  bounds/shared transform/unknown load invalidate; repeated validity reads do no
  additional geometry work; failed validation cannot leave reported current proof.
  Focused host/browser tests, production types, naming/lint and source proof.

Attachment dependency closure: 151 host and 40 browser tests passed, browser/server
production types, focused lint and naming passed. Same-source proof passed 26
obligations, three exact negatives and recovery. Candidate
`98311487-8f98-4e32-83bb-2ddfe770b55a`, source
`f1373bd5583b77837325bdad0c0c660443772aba1d7a53cd9303e7ec20b46ed2`, review
`4c65546a0716a51689c911438d8abaeb552039ade0cb3c374bd269e43e0ab812` accepted.
Evidence `tmp/attachment-refresh-*`, `tmp/attachment-signature-*` and the separate
red-first editability case `tmp/attachment-lock-red.log`. Initial attachment
capture still reads each ancestor only once; lazy validation reads only the
changed parent signature, with no child data traversal or repeated geometry reads
while current. Pixel and editability dependencies remain distinct.

### Step Execution Card - retained deterministic node verdicts

- Owner inspect, canonical design reviewer and request-owned browser runtime.
  Recorded baseline: repeated subtree review visits 162,031 objects across four
  global scans plus regional work. Captures have now been decoupled, but final
  deterministic review still needs valid reuse inside a changed large target.
- Retain per-node completed deterministic verdicts, child dependency IDs, derived
  local bounds/visibility and parent-dimension inputs. Canonical content remains
  in Core. Known changes invalidate affected nodes and their geometry-dependent
  ancestors; unchanged node verdicts survive. Parent dimension/visibility changes
  cause dependent rule reevaluation. Shared-property owners, membership changes,
  unknown/load and disposal retain conservative correctness.
- The final report aggregates retained summaries; count aggregation separately
  from actual metadata/computed reads, rule executions and text measurements.
  No claim of zero aggregation over a large result. Text measurement stays batched.
  Incomplete or interrupted results cannot enter the retained cache. Without a
  canonical observer, use the ordinary uncached evaluator.
- Boundary: existing design-review evaluator/tests, canonical change translator,
  review-action descriptor and runtime-input lifetime/tests, inspect spec/flow.
  No new registry, editable document mirror, TTL or capacity-limit increase.
- Gates: same output as uncached evaluation, 8-region local change and shared
  dependency work counts, text correction/measurement batching, new/removed child,
  unknown change, cancellation and disposal. Complete focused tests, production
  types/lint/naming/source proof before advancing to purpose or Runtime iteration.

Retained node verdict closure: 57 focused browser cases passed across reviewer,
canonical dependencies/evidence, registered action and runtime ownership (the
last text-batching case was run separately). Production browser types, focused
lint and naming passed. A new disposal-during-yield case first failed and now
rejects without publishing results. The real registered browser action proves
precise Scene Tree changes, shared-property owners and runtime cleanup; the
initial test used a nonexistent Props action and was corrected to the canonical
`UPDATE_PROPERTY` event before claiming that integration proof.

For 1,609 nodes, a single window edit rereads/evaluates three nodes and reuses
1,606 verdicts; unchanged repeat performs zero canonical reads. Aggregation still
visits 1,609 summaries and is reported separately. For 401 text nodes, initial
measurement batches are 200/200/1; a single changed text remeasures one. Membership,
visibility, parent dimensions, unavailable checks, cancellation and full
invalidation preserve output equivalence. Source-bound proof passed 26 obligations,
three exact negatives and recovery: candidate `84ea9da1-b12c-4bc6-9bdd-67b3bb29fe0d`,
source `ff3cf2a24b3e3a37023ee6b8d0b0639f5ab74d36d4c87bf4b597b1b532da1754`,
accepted review `6dffe79497de70730a1676ca441ded70f2dd892eab31eb292f5dd0410273363c`.
Evidence `tmp/node-review-*`. These are deterministic work-count proofs, not new
live Taipei 101 timings. Automatic preparation publication, truthful purpose and
Runtime bounded iteration remain separate unfinished slices.

### Step Execution Card - automatic compiler result publication

- Owner prepare-to-inspect handoff. Compiler findings already exist at artifact
  publication; invoking review merely to record them repeats responsibility.
- The request preparation session supplies the existing shared check-result owner
  to operation/review tools. Publish one immutable source check after successful
  artifact publication, without calling a model, browser or secondary scanner.
  Explicit prepared review records attachment/coverage and reuses that source unit.
- Source checks use the immutable recipe digest and compiler-rule identity. A
  caller-declared, owned previous artifact may continue the same source obligation;
  consolidate the temporary new source unit into that lineage and invalidate
  actual check dependents. Never erase an unresolved visual obligation or treat
  source checks as canvas evidence. Artifact release affects availability, not
  the historical truth of an immutable compiler check.
- Boundary: design-check-results and tests, preparation publication and tests,
  local-design-tools/operation-tools wiring, prepared-review and real-host tests,
  existing prepare/inspect spec/Inspector. Preserve source verification, actual
  attachment admission and application receipts. Source approval never proves
  canonical canvas effects; existing acknowledged application and measurement
  owners retain that responsibility.
- Gates: real prepare -> default pending-results read without explicit review;
  compiler failures exposed immediately; explicit review does not duplicate the
  source unit; owned correction replaces only its predecessor obligation, unrelated
  passes remain identical, and compiler failure/cancellation creates no fake pass.
  Focused types/lint/naming and source proof; no AI, full CI, push or monitoring.

Automatic compiler publication closure: 266 distinct focused cases passed (254
owner/consumer cases plus one cancellation/publication case and 11 prompt cases),
server production types, lint and naming passed. Real preparation -> shared query
needs no explicit review or browser invocation. Source review is idempotent;
corrections consolidate into the existing obligation and preserve unrelated passes.
A new negative case caught adoption of an already superseded source; it now rejects
before disturbing either lineage. Artifact publication failure and cancellation
cannot create a pass. Candidate `61be1801-1844-4c50-8ff1-15c89195b367`, source
`38c43b21c6f6750cd40ed8197a721bcf5b9b4f100ce586cd0a28d52b8e01b8b7`, accepted
review `4b40d2314d39bc72642b8c6c4f10a8fe74acb164886baeb3c9e00c834609c8fd`;
source proof passed 26 obligations, three exact negatives and recovery.
Evidence `tmp/compiler-publication-*` and `tmp/compiler-lineage-red.log`.

### Step Execution Card - purpose continuity across completed calls

- Owner settle, current provider -> runtime -> activity reducer -> panel/report.
  Actual gap: closing the last authored call removes its purpose and falls back
  to the full original request; retaining its execution phase would be misleading.
- Retain the last established work subject independently from active calls. Its
  authored ID/revision survives phase-only updates; provider processing is the
  observed phase when calls end. New authored work supersedes it; retry clears it.
  Active live ancestry still owns specific execution, concurrent unrelated calls
  use shared request purpose rather than the latest sibling. Late/closed events
  cannot revive execution or replace a newer subject. Lifecycle controls win.
- Preserve authored language/content; never infer a subject by rewriting verbs.
  The panel shows actual phase separately from work subject. No extra model or
  placeholder next-task story. Diagnostics derive selected purpose identity/source,
  phase label and active-call count from the same reducer that renders the UI.
- Boundary: activity-state/presentation tests, provider/transport tests as needed,
  existing panel E2E and execution-flow proof/spec/Inspector. No new status store.
- Gates: red actual apply-completed/provider-gap replay, request commentary,
  nested and concurrent completion, retries/late events, lifecycle priority;
  current event path to DOM and decision report at narrow/wide widths. Focused
  types/lint/naming/source proof; no full suite, live model, push or monitoring.

Purpose continuity closure: 78 focused reducer/conversation cases, two maintained
browser cases at 360/1280 px, production types, lint and naming passed. Both
completed-call screenshots were inspected: the phase is AI processing and the
established subject survives. Source-bound proof passed 26 obligations, three
exact negatives and recovery, candidate `a54469bf-7119-41b4-b1f8-318eeee58d4b`,
source `7b3434952dca5f69917286b5f47395db4c92b6bc41965256f519531a242066a4`,
accepted review `38ec95fa17af31acc967d881cd93c57a201ff77137aa5af6b16091ad26e24fc5`.
Evidence `tmp/purpose-*`; manually invoking the guarded proof without its captured
source was rejected, and only the supported candidate/prove runner supplies the
accepted evidence. All temporary browser services exited. No live timing claim.

### Step Execution Card - typed bounded iteration admission

- Owner `admit`, source TOOL_SPECIFICATION / Typed recipe admission. Extend the
  existing proposal, not the App interpreter. Initial ordered steps run once;
  optional iteration declares an ID, state schema/initial binding, registered
  checker, ordered repairs, next-state binding and maximum repair rounds.
- The domain owner declares `verification` paths on a read/prepare tool contract:
  required status is pass/repairable/decision-required and progress is a nonempty
  stable unresolved-state key. The recipe author cannot reinterpret arbitrary
  booleans or declare that a check is visual approval. Registration preserves and
  validates metadata shape; admission proves guaranteed output paths and types.
- Admission checks exact keys, unique step identities, earlier-output bindings,
  iteration-only state bindings, next-state closure, all dependency revisions,
  effects and worst-case expanded step budgets before any write. Final output may
  use the guaranteed iteration receipt (state/result/iterations), never a repair
  result that might not run. Missing/ambiguous contracts reject without invocation.
- Runtime invoke subsequently checks once, repairs only repairable results,
  rechecks, stops on repeated progress/decision/budget/non-success/cancellation,
  and exports validated progress without replay. Coordinator holds no leaf lock.
  This card implements admission only; execution remains a separate owner slice.
- Boundary: existing recipe types/format/admission/schema, tool contract, admission
  and contract tests, Runtime specification and admit Inspector. No App changes,
  inference calls, arbitrary code, new dependencies or limit increases.
- Proof cases: successful typed state loop, absent owner capability, optional or
  wrong status/progress, forward/stale repair binding, zero/unsafe/excess rounds,
  state type mismatch, skipped-repair output escape, immutable metadata. Focused
  Runtime tests/types/lint/naming and source-bound flow proof before advancing.
- Self-review: budgets count all possible rounds; state carries actual typed
  output, not copied model state; saved recipes capture no current handles;
  successful check does not imply subjective acceptance or durable saving.

Bounded admission closure: 95 focused cases, complete Runtime types, naming and
focused lint passed. Source proof passed five obligations and the exact negative
with recovery. Candidate `38107bed-5580-4319-8e57-3a075e3a9f3b`, source
`b15bc4d0fc5e6040f800f5edab5e716af0b2c7b003beab7e71cce00e5e0440ac`,
review `832d019840b4c854fc9a9150b9a0f423c7c4711cd54a1dc32be739f7176bffea`.
Canonical schema inventory assertions now include optional iteration/state; the
positive bounded-state case was red before implementation. Execution is next.

### Step Execution Card - bounded repair invocation

- Owner invoke; consume admitted immutable iteration and current arguments.
  Pin initial/check/repair dependencies before execution and count nested worst-case
  expansion. Use the common invoker and actual host scheduler only for leaves.
- Run initial writes once. Each round uses acknowledged current state, checker
  output and explicit repair bindings. A required owner verdict determines pass,
  repair, or return to the primary agent. Repeated semantic progress, round budget,
  cancellation, failed/partial/unknown settlement and malformed results stop.
- Output: success only after pass; otherwise existing typed recovery receipts and
  actual calls, preserving leases through the caller boundary. No automatic replay,
  inferred repairs, second model, scheduler barrier or fabricated eligibility.
- Actual step provenance includes round index. Check both initial and next state
  against the admitted schema; no previous-round internal output may leak forward.
- Boundary: recipe-execution, its maintained tests and recipe-flow proof; invoke
  Inspector/spec. Existing library registration/storage remains authoritative.
- Gates: pass without repair, several repairs with one initial write, no-progress
  and cycle, decision, budget, cancellation, partial/unknown, malformed verdict,
  nested budget rejection before writes, exact revisions and output ownership;
  existing nested/lease/recovery tests, types/lint/naming/source proof.

Invocation review found a real failure handoff: thrown no-progress/decision stops
assembled recovery after the outer middleware had released its lease, so receipt
fields existed without caller ownership. New retained-export assertions failed for
all five stop reasons. Extend this same invoke-owner correction to normalize an
inner failure before export/cleanup; preserve the original outcome and diagnostic
failure, never reinterpret malformed output as valid recovery.

Next handoff review exposed explicit saved-body projection dropping optional
iteration, and registration graph accounting visiting only initial steps. Keep
these red lifecycle findings for the following register/persist owner card;
current invoke proof asserts execution/retained stop only, not durable reuse.
No feature completion claim is permitted until both projections are corrected and
the same authored iteration survives a fresh-host save/load/invoke proof.

Invocation boundary re-review: distinguish three facts before cleanup: validated
own output, validated child recovery, and successful caller transfer. A rejected
own output cannot be exported under its recovery schema; a failed caller transfer
must omit that unusable resource while retaining actual call/settlement/error
receipts. Both additional formal negatives were red before correction. This stays
inside the same failure/lease owner and does not replay or synthesize product data.

Invocation closure: 37 focused execution/middleware cases, Runtime types, lint and
naming passed. Source proof passed six obligations and two exact negatives with
recovery (including deliberately ignored repair budget). Candidate
`676f0e95-6d8d-4776-930f-4ca026d63cf4`, source
`7745b75c9fd6d431adaef38fc1b1a44de51ab460bcf8c68d1ed624327943d04b`, review
`8e857b99bd8b19271272edaa6510860697fddb68f72296656fa7c53130735e42`.
Evidence `tmp/iteration-execution-*`; typed unsuccessful recovery is exported
before cleanup, and failed transfers are omitted without hiding executed calls.

### Step Execution Card - bounded graph registration

- Owner register, consume admitted recipe plus canonical registry/private nested
  recipes. Registration must account for all reachable iteration checks/repairs
  including nested compositions and multiplicative rounds before publishing.
- Reuse one recipe-format-owned step/weight inventory in registration and pinning;
  preserve immutable per-call pinning, exact revisions, private visibility and
  caller cancellation. No execution during admission/registration, no new cache.
- Boundary: recipe-format/types public exports, tool-library, pinning's inventory
  consumer and maintained admission/library/execution/flow tests; register/invoke
  Inspector boundaries updated for this shared representation only.
- Gates: nested loop repair budget red before registration; unadmitted nested
  repair rejects; ordinary recipes and exact private candidate lifecycle stay
  intact; narrow Runtime tests/types/lint/naming/source proof. Stop before store.

Graph registration closure: 107 focused Runtime cases, types, lint and naming
passed; source proof passed seven obligations and two exact negatives/recovery.
Candidate `7dbd8be9-2b99-4ae6-b612-22c7788c0563`, source
`d912752f409d9319f83cc2651a1101218a0eaa458e5379fcc5be3d22f6fff1d3`, review
`5923b0e01511f14966924af4d1362ae1e1329791b4f6c54a99c564e68a6feb98`.
The separate invocation-budget test now admits within the library budget and uses
an explicitly lower execution budget, preserving both independent protections.

### Step Execution Card - complete iteration persistence

- Owner persist, source What is saved / Durable host store. Preserve the admitted
  optional iteration in the same immutable implementation body on save, exact
  current-definition comparison, restore/resume and complete inventory loading.
  No extra ledger or execution data in the definition.
- Explicit current format accepts only steps/output and optional iteration;
  unknown keys and malformed iteration re-enter canonical admission and reject.
  Exact dependency fingerprints include domain verification metadata.
- Successful verified execution is required for eligible save. Budget/unknown
  stops cannot grant eligibility; failed save retries only IO, no product writes.
- Boundary: tool-store and maintained store/flow tests, persist Inspector/spec.
  Gates: prior red same-definition fresh-host load, different fresh inputs,
  save-only retry, candidate resume, immutable conflict, malformed loop and changed
  checker capability; existing store regression suite, types/lint/naming/proof.

Persistence closure: 155 focused contract/admission/execution/library/store cases,
Runtime types/lint/naming and source proof passed. Eight obligations, two exact
negatives and recovery; ignoring repair budget correctly fails both invoke and
persist cases. Candidate `21338258-38d2-44a1-a88a-63e4553205ec`, source
`9d825f00a9b916661535d0b67c67391fc9dcd5a4e63323b45c03b248bbabef70`, accepted
review `36510b035d12235fe2987c7072b6da7707affe7e7072cdb5eac25d4c27fb80ea`.
Actual fresh-host reuse, repeated current-host load, storage failure/no write
replay, ineligible stopped receipt, corrupted round limit and changed checker
fingerprint are covered. Evidence `tmp/iteration-persistence-*`.

### Step Execution Card - canonical Design verification capability

- Owner inspect, consume completed deterministic review through canonical evidence
  capture. Add an explicit mechanical verdict to the existing review action.
  Complete/no findings passes supported checks only; container/text overflow is
  mechanically repairable; unavailable/unknown checks require primary-agent
  decision and never grant a pass. Existing partial outcome remains partial.
- Stable progress fingerprints include target identity and normalized pending
  findings/completeness, excluding receipt IDs, observation timing/cache counts,
  viewport and iteration number. Compute after review inside evidence capture so
  a concurrent canonical change cannot turn stale evidence into a current pass.
- Preserve complete canonical result and typed references. Domain verification
  metadata points into this result; the compose transport must subsequently
  relocate those paths to its existing batch envelope, not drop or guess them.
- Boundary: review-action and maintained tests, inspection spec/Inspector. No
  second checker, model call, repair implementation, current document writes or
  new dependency. Gates: pass/repair/decision, order-independent semantic progress,
  changed finding vs unchanged receipt/timing, cancellation and canonical currency;
  existing review/runtime tests, types/lint/naming and source proof before compose.


Canonical verification closure: 38 focused review/runtime cases, browser types,
lint/naming and current-source proof passed (26 obligations, three exact negatives,
recovery). Candidate `6f91be9e-0eeb-4f6b-bc09-e3747bdbf97f`, source
`2daf3fe7854c2b0c43c3cdaae9965ceafe7e43717632fd637f8a6023142a056b`, review
`c9fd4687a4217acef9b584142d504b9f5907c25cfd24e2d674aeef05ece9b5bd`.
Evidence: `tmp/design-verification-*`.

### Step Execution Card - native verification envelope handoff

- Owner compose: project the canonical domain verification paths into the actual
  single-action batch envelope with its exact first receipt. Preserve schemas,
  revision and outcome semantics; no inferred verdict or second registry.
- Prove actual canonical review -> operation wrapper -> secured request host ->
  Runtime admission/invoke. A passing check completes without repairs; unchanged
  mechanical findings stop after the declared repair rather than silently pass.
  Keep initial writes single, ordinary leaf scheduling and cleanup.
- Boundary: local-operation-tools, maintained operation/host tests, existing
  library descriptions and App prompt, compose Inspector and execution spec.
  Gates: red/green actual host handoff, discovery/operation/library regressions,
  production types/lint/naming/current source proof. No model/live drawing.

Handoff review found the canonical checker also lacked explicit composition
eligibility. Include review-action in this compose slice only to declare its
read-only, value-only capability eligible. No mutation or reference lifetime is
introduced. The existing spec requires this actual checker to be usable by Runtime.


Envelope closure: 155 focused host/operation/library/prompt cases, server types,
lint/naming and current-source proof passed (26 obligations, three negatives,
recovery). Candidate `1e9cc5dd-714f-4da0-8e5f-fffa45b9c370`, source
`2d5f617fc78b16f1cb3253660ec7a7c6932ead3642f6fc689c4ab65748c2043f`, review
`df3825289c9731400cd50f19b6661b969bdc967bccff824d26b8c55d296a400f`.
Real host canonical checks admit/invoke, stop unchanged findings, export exact
outcomes and keep unsaved execution successful. Evidence `tmp/verification-envelope-*`.

### Step Execution Card - retained canonical measurement obligations

- Owner inspect: deterministic canvas findings join the same request check store
  as prepared source and primary-agent judgments. Replace the obsolete global
  text-ID set with one authoritative result per exact checked target. A complete
  recheck replaces that target's findings, including a removed child; incomplete
  checks remain unresolved. Unrelated target failures/passes remain retained.
- Exact browser evidence owns validity. Check-result reads validate retained scoped
  receipts without remeasuring geometry; only expired target units and downstream
  dependents become stale. Final measurement admission computes required stale
  targets only; canonical node reuse remains at the browser owner. Pan/zoom alone
  cannot manufacture a dependency change.
- Boundary: local-operation-tools and maintained operation tests, inspect spec/
  Inspector. No alternate check store, new model, state mirror, or broad invalidation.
- Tests: eight target passes/one changed target, unchanged read zero review work,
  deleted overflow cleared by same-target complete recheck, unrelated failure
  retained, partial/no evidence never completion, all deterministic findings block
  completion. Focused regressions/types/lint/naming/source proof before closure.


Measurement retention closure: 128 focused operation/check-store cases, server
types/naming and current source proof passed (26 obligations, three negatives,
recovery). Candidate `c753fe2f-02e4-4f82-87f4-ec919cedcb34`, source
`719aba97ba445222b1ca9a5cea4b19c053c1a47c1dc89ea5fa8d56a8e044ee67`, review
`ec1cd55cc00ab08c7c8d4c51452496a18ba2449605ee4d20c6e86b998c5f3732`.
The maintained eight-target case proves local invalidation, zero measurement on
reads, removal recovery, unrelated failures and incomplete blocking. Two older
batch fixtures now provide the current canonical measurement stamp; no assertion
was dropped. Evidence `tmp/measurement-retention-*`.

### Step Execution Card - final persistence and usage review

- Owner persist: add the exact bounded-iteration saved-candidate resume proof to
  the existing lifecycle suite. Resume remains private and inert until explicit
  invocation, repeated resume is idempotent, fresh inputs still pass full admission.
- Update the Runtime package guide from the accepted current specification, including
  bounded repair, no second model, mechanical versus visual acceptance, and save-only
  recovery. No new runtime behavior, compatibility path or invocation authority.
- Boundary: recipe-flow tests and Runtime package guide; focused persistence suite,
  types/lint/naming and current Runtime proof. Then observe-owner test-only review
  checks that actual round provenance survives recording without changing activity.


Candidate resume closure: 29 focused persistence cases passed; the exact new
resume case is now a formal persist-to-admit obligation. Initial candidate run
correctly rejected the undeclared test; the current manifest includes it. Candidate
`66bb770f-6a7c-4b7f-ab1e-0dbde3641463`, source
`fa331019ab203cfbd7ef24426407c27782b6e794b6df656c3081cf51669c2e14`, review
`16a0de0c2af2d3058ac1afacf79f5bee04482c9fa4f823504a601a1362249a75`;
nine obligations, two negatives and recovery passed. Evidence `tmp/iteration-resume-*`.

### Step Execution Card - cancelled measurement handoff

- Owner inspect final review found retained measurements were published before
  checking cancellation after browser delivery. An aborted exchange must not add
  a reusable pass, even if the browser returned a completed receipt concurrently.
- Boundary: existing local-operation-tools and maintained operation tests. Test
  direct review and automatic post-write review cancellation before recording;
  preserve earlier evidence and actual product settlement, never replay writes.
- Gates: test-first rejected receipt adds no check record, affected operation and
  check-store suites, production types/lint/naming/current-source proof.


Cancellation closure: 130 operation/check-store cases, server types and
current-source proof passed. Candidate `77a71dbd-bd01-454a-9043-74fe4613da6b`, source
`0f7f03a93ad3eb3c3be2286567228ef57fd1878ba8103bae819d288df4c0c67c`, review
`aa56f399a4f07419d1ce243bd995eb03a62a31cf769028af213bf1843373d813`.
Both direct and automatic cancellation failed before the owner fix and pass after.
Evidence `tmp/measurement-cancel-*`.

### Step Execution Card - selected check dependency freshness

- Owner inspect final read-through: selecting a downstream check ID must not skip
  its retained upstream measurement's canonical validity. The existing check store
  already invalidates downstream dependencies; refresh owned browser stamps before
  filtering returned rows. Do not implement another dependency graph in the App.
- Boundary local-operation-tools/maintained operation tests. Validate scoped stamps
  only, no geometry remeasurement or broad result invalidation. Red/green downstream
  selected-read case, existing local retention gates and current source proof.


Selected dependency closure: 131 focused operation/check-store cases and current
source proof passed, including the new red/green selected-downstream case.
Candidate `5f20313d-2bf7-44b4-a8ea-f7bf00b4e98c`, source
`f06c71f9015a05e69c107b07982ac7a77b2cb9b7670ad6f8ba05b659ec95683a`, review
`ed5a49fd659b0f11c5db327058b2d1d371a860f25906fcceaf56ef2d00b06634`.
Evidence `tmp/measurement-upstream-*`; scoped validity lookups are distinct from
canonical geometry/rule evaluation, which is not repeated by check-result reads.

### Step Execution Card - bounded iteration observation closure

- Owner observe: the existing common observer forwards exact parent recipe,
  revision, step ID and actual round. Verify the current recorder retains round
  identity alongside work counts and definition-delivery metadata. No inferred
  round from names, second recorder, changed activity state or extra provider call.
- Boundary: maintained profiler record test and observe Inspector condition only.
  Gates: focused record case, then the bounded affected-consumer suites and current
  App/Runtime proof. Prior narrow/wide activity E2E evidence remains valid because
  presentation/state code is unchanged by the iteration integration.


Observation test-first finding: the recorder's bounded field projection discarded
`recipeStep.iteration`. Extend this existing Runtime recorder allowlist with the
actual integer round, preserving all existing size/redaction rules. No second
recorder. The first focused and final-consumer runs correctly failed this case;
retain those failures. The App consumer run also exposed one maintained provider
fixture without the canonical measurement stamp. Update that test receipt in its
inspect-owner boundary, preserving its exact preparation/apply/inspection assertions.
Runtime/browser/server type checks and 38 browser cases already passed; rerun only
changed consumer gates after these corrections, not unrelated repository checks.


Final lint review found a nested ternary in the new measurement status projection;
the earlier auto-fix command had not corrected it. Split the expression without
changing status semantics and verify the explicit final lint exit status. Earlier
measurement/cancellation closure notes above no longer claim that earlier lint
passed. Runtime record correction passed all 40 maintained record tests and the
Runtime package build; browser/server/Runtime types passed.


Observation and final owner proof closure: current App source
`07580069580ca2de88fef5b186162d9d0f6f48b83f80377d33b26b566bb55353`
(candidate `ca6be7ea-f771-4c32-a2cf-8c26f593cb3c`, accepted review
`52d1a4959574cfaf9f0ff783a3d7a4115b307f6ad1bf2e79b1e5020dc2e84cb2`)
passed 26 obligations, three exact negatives and recovery. Runtime source
`d80a159df1192ebf94c3ed1982c2cd99269413877971ede0f85af312a5a31722`
(candidate `11b189d8-0b8f-4ba0-b2e0-603dda7cbd8b`, accepted review
`b014bb7bd2b9a14e407a97c49b86f839ec882cefd0a249b95682072feb230aef`)
passed nine obligations, two exact negatives and recovery. Focused final evidence
is under `tmp/task-owner-final-*`; earlier failed runs remain failed. The two
corrections were rerun in their full maintained record/provider files.

### Derived catalog synchronization

The existing catalog contract test detects the generated browser snapshot still
containing pre-change flows. Regenerate only the existing workspace-bundle.data.js
with the existing generator and run the eight catalog contracts. This updates the
rendered copy of the current admitted Inspector sources; no new flow, rule, source
semantics or generator change. Do not preserve an obsolete diagram beside the
current contract. No broad local CI or remote work.


### Local completion of the authorized task-owner implementation

This authorized local phase is implemented and self-reviewed. This does not close
the original remote delivery/merge goal. No commit, push, monitor restart, full
local CI or additional live Taipei 101 run was performed in this phase.

- Ownership: primary AI selects capabilities/authors recipes/owns visual judgment;
  Runtime admits and executes bounded declared work; domain tools own deterministic
  checks; library/storage own eligibility and persistence. No secondary checking AI.
- Completion: declared mechanical success, retained current task obligations,
  primary-agent visual acceptance and durable saved availability are independent.
  Failed/partial/unknown/cancelled work never silently advances or grants eligibility.
- Handoffs: exact input/output/recovery schemas, scoped ownership and native envelope
  pointers; prepare-to-consume, query-to-mutate, check-to-repair, candidate-to-save,
  restart-to-fresh-input and downstream dependency currency are formally exercised.
- Iteration: initial writes once, only declared repairs, actual semantic progress,
  finite nested budgets, no-progress/decision/cancel/uncertain stop, no write replay.
- Retention: one shared check store, unrelated passes retained, affected units and
  dependents reopened, deleted failures replaceable through a complete target check.
  Check-result reads validate scoped evidence and do not repeat geometry scans.
- Diagnostics: actual step/round identity survives the existing recorder; previous
  purpose/phase UI evidence is preserved. No guessed phase or hidden-model timing.

Final bounded validation comprises 204 Runtime contract/lifecycle/record cases,
425 App host/provider/retention cases, 38 browser owner cases and eight catalog
contracts. Three existing conditional provider cases remain skipped. The initial
final-consumer runs had one recorder and one provider-fixture failure; the corrected
full maintained files passed (40 and 172 cases respectively). Do not label the
initial runs green. Browser/server/Runtime types, Runtime build, explicit final
lint, naming and diff whitespace checks passed. Source-bound App proof passed
26 obligations/three negative scenarios/recovery; Runtime proof passed nine
obligations/two negative scenarios/recovery. Evidence: `tmp/task-owner-final-*`.
The generated Inspector catalog now exactly matches current source (eight tests).

Final review is limited to the authorized changes, their consumers, retained
regressions and stated gates. No remaining issue is known in that reviewed scope.
These deterministic results do not establish a new first-frame or total drawing
time; retain the previous live-run measurements as historical evidence only.
