# AI Agent Runtime Ownership Transfer

## Status and task contract

Implementation authorized on 2026-11-21. The existing Lodash dependency transfer
is approved. All implementation stages and local feature acceptance are complete.
The integrated change is ready for pull-request review; remote CI is not monitored.
Parent source: `origin/main` at `30f856260a9776f87e0440b1b5b0d88e68a515de`, including
the merged Design conversation work in PR #365. Branch:
`codex/ai-agent-runtime-ownership-transfer`. The implementation task base is the
reviewed plan commit `34b85659bb83bbdf5ffc12ab50c069e0e1d38121` on this same branch.
Closeout owner: the coordinating
agent for this plan, with user review of the integrated result.

The objective is to let another App compose the complete tool handoff without
copying Design internals, while Design retains its product decisions and canonical
operations. Success requires both a non-Design consumer and preserved Design
behavior on the same candidate source.

The scheduled implementation request authorizes this plan's complete stages,
focused and final feature acceptance, self-review, closeout, task commits, push
and one pull request. It excludes 101, whole-repository tests, release workflows
and remote CI monitoring. Explicit third-party dependency approval remains a
prerequisite under AGENTS.md; it is not inferred from general implementation
approval.

The implementation boundary is `packages/ai-agent-runtime`, its optional
adapters, the directly affected Design AI composition, and permanent consumer
fixtures/tests and documentation. Exclude rendering, geometry behavior, canonical
Core/Feature/transaction implementations, other Apps' product features, provider
model settings and unrelated CI repairs. New dependencies or tool upgrades still
require approval. A necessary change outside this boundary stops that slice for
replanning; it does not expand this task automatically.

## Authorities and reviewed sources

- Current [package contract](../packages/ai-agent-runtime.md),
  [Tool Specification](../../../../packages/ai-agent-runtime/TOOL_SPECIFICATION.md)
  and [public exports](../../../../packages/ai-agent-runtime/src/index.ts).
- Current [Design execution flow](../../apps/asyra-design/specs/ai-execution-flow.md)
  and [registered-action guide](../../../public/build/ai-actions.md).
- Current [host composition contract](../specs/ai-agent-runtime-host-composition.md).
- Current [Flow document](ai-agent-runtime-ownership-transfer/ownership-transfer.flow.json).
- Existing [runtime
  architecture](../../../../tools/flow-inspector/inspectors/ai-agent-runtime-flow-inspector.data.cjs):
  preserve Feature-owned invocation, App context and permissions, canonical
  execution, settlement and cleanup. Its completed batch-oriented flow is not
  evidence that the new host/result/provider composition is already verified.

Discovery is bounded to the current package exports/specs, Design's `src/ai`,
`server` tool/provider modules, AI Feature, their direct tests, and public adoption
guides. Review follows registration -> provider description -> invocation ->
executor -> validation -> retention/delivery -> provider receipt. Compare current
owners and actual consumers, not file size, old diffs or matching schema shapes.
After authoring, review only these documents, their references and their gates.

## Existing capabilities to reuse

| Need                                          | Existing owner                                                                                                       | Required integration, not a replacement                                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Registered immutable contracts and invocation | `createAiActionRegistry`, `createAiToolContract`, `createAiInvoker`, `createAiToolMiddleware`, `inspectAiToolResult` | One common invocation/validation path for direct and composed calls; injected owner classification remains authoritative.           |
| Dependent steps and mechanical iteration      | `admitAiRecipe`, `createAiRecipeInvoker`, schema projection and recipe lease adapter                                 | Reuse request/sequence admission and late value validation. Do not add another interpreter or a general step ceiling.               |
| Saved tools                                   | `createAiToolLibrary`, `createAiToolPersistence`, `createAiToolStoreManagement`                                      | Supply reusable host coordination and optional storage, not another tool registry or save engine.                                   |
| Knowledge                                     | `createAiKnowledgeAccess`                                                                                            | Preserve authorization, source revisions, graph resolution and retained selections; file loading and ranking are separate concerns. |
| Provider and diagnostics                      | `AiProvider`, `createGenericHttpAiProvider`, profiler and record-delivery APIs                                       | Add optional native transport implementation; reuse existing progress, recording and recovery contracts.                            |
| Canonical edits                               | Design common APIs, Core, Feature System and transaction adapter                                                     | Keep existing invocation/commit/undo/collaboration owners; no AI-only state or transaction engine.                                  |

## Responsibility allocation

Paths below are relative to `apps/asyra-design` unless explicitly package-owned.
Each source containing multiple responsibilities must be split by behavior.
Moving a whole file or retaining an old forwarding export is not the plan.

### Move common mechanisms into ai-agent-runtime

| Mechanism                                                                                                                        | Current source                                                                                          | Target boundary                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pin the invocation contract, validate raw results, select and validate external views, preserve execution versus delivery status | `server/local-tool-invocation.ts`, `server/local-tool-host.ts`, `src/ai/tool-contract.ts`               | Shared host/result functions using existing invoker and contract APIs. Domain result schemas, outcome classifiers and rejection explanations remain injected.                                                   |
| Resolve named/step/input references and coordinate independent retain/delivery selections                                        | `server/local-result-delivery.ts`, generic portions of `src/ai/conversation-results.ts`                 | Portable result-reference and selection mechanisms with a host-supplied store. No global conversation store and no schema-specific Design receipt decoding.                                                     |
| Describe retained values and carry explicit content references                                                                   | `src/ai/conversation-results.ts`, generic portions of `server/local-tool-media.ts`                      | Generic provenance, selected paths and declared media handoff. Design producers declare image results; generic code never identifies media by a Design action name.                                             |
| Assemble library/invoker/recovery/leases and coordinate admitted leaves                                                          | `server/local-tool-host.ts`, `local-tool-library.ts`, `local-tool-leases.ts`, `local-tool-scheduler.ts` | An optional host composition using existing runtime owners. Request-scoped ordering and leases are reusable; policy, resource identity, overlap eligibility and canonical validation remain supplied by owners. |

### Provide optional adapters

These are explicit imports/compositions, not mandatory initialization. Prefer
subpaths of the existing package; establish exact public names in Stage 0 after
the naming gate. Node-only adapters must not enter the browser import graph.

| Adapter                                      | Current source                                                                                                    | What stays outside the adapter                                                                                                                                                                                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supported JSON Schema validator              | `src/ai/tool-schema.ts`                                                                                           | Tool/domain schemas and semantic validation. Preserve the documented supported vocabulary, local references and Unicode semantics; unsupported rules remain errors. Keep custom validators possible.                                         |
| Native Codex transport and schema conversion | `server/local-ai-provider.ts`, `native-provider-config.ts`, `operation-input-schema.ts`                           | Design prompts/tool sets, model/effort selection, service permission policy and evaluation controls. Transport owns process/protocol/session handling, not product completion.                                                               |
| SQLite tool-store adapter                    | `server/local-tool-store.ts`                                                                                      | Host-selected path, capacity, credentials and lifetime; recipe admission and persistence coordination stay in existing runtime APIs.                                                                                                         |
| Knowledge file parser/loader                 | `server/local-knowledge.ts`                                                                                       | Content and revision catalog, topic selection and authorization. `@asyra/domain-knowledge` content does not move to runtime. Preserve lazy per-owner loading; no speculative global cache.                                                   |
| Capability discovery and contract reading    | `server/capability-search.ts`, generic portions of `local-operation-tools.ts` and `local-information-delivery.ts` | App vocabulary, categories, permissions and exposed catalog. Match declared purpose/fields, resolve identity and ambiguity, and preserve exact selected contract provenance. Do not turn capability search into knowledge relevance ranking. |
| Browser/server exchange                      | Generic portions of `src/ai/server-action-batch-provider.ts` and `server/batch-exchange.ts`                       | App endpoints, authentication, document binding, limits and failure policy. Reuse generic HTTP provider; extract only the bidirectional batch/receipt mechanism that it does not already implement.                                          |

The package currently has no runtime dependencies. The validator uses Lodash in
Design and the native adapter has environment-specific dependencies. Stage 0 must
resolve packaging against the actual import graph; do not silently add a package,
assume the consumer's hoisted dependencies, or replace tested semantics merely to
avoid a dependency decision.

### Keep in the App or its existing framework owner

- Design action schemas, common-API exposure, target/element/coordinate semantics,
  construction, material preparation, inspection, domain artifact validity and
  outcome classification remain Design-owned.
- Prompt content, reference selection, permissions, confirmation policy, model
  choice, conversation UI, drafts/history, attachment association and document
  context remain App-owned. App/system-context storage remains an integration
  choice, not a new runtime database.
- Core/Feature/Factory retain session scheduling, canonical state, finite mutation
  boundaries, undo/redo and collaboration. The host's leaf-ordering mechanism is
  not a second Feature queue.
- Reference image production/decoding and viewport capture remain domain owners;
  the generic provider only transports explicitly declared content.
- Evaluation windows, stop rules, report questions and evidence collection remain
  test/development-tool policy. Generic session continuation may be reused, but
  the production provider must not depend on the 101 harness.
- No capability moves to Preset merely because it is reusable. A future Preset
  default requires a separate demonstrated composition need; this plan does not
  add a Core dependency on AI or automatically enable AI in any App.

## Current contract deltas and removal obligations

1. The package contract currently delegates schema validation and result
   classification to hosts. Retain that extension point while offering the
   shared pipeline and optional validator. Do not claim registration alone
   validates values or make the reference validator compulsory.
2. The current provider boundary is vendor-neutral. Document a separate opt-in
   native adapter; do not redefine the root runtime as a vendor SDK. Preserve
   `AiProvider` implementations that do not support retained native sessions.
   Explicit adapter capability differences are not legacy compatibility.
3. Design's execution spec currently assigns orchestration/transport to its App
   provider. Update only the transferred mechanisms when their consumers migrate;
   retain App policy and endpoint ownership. Remove obsolete App entrypoints,
   duplicate validators/projectors and their now-false assertions in that slice.
4. Keep per-tool `AiToolContract.delivery` (declared external view) distinct from
   per-request retain/delivery selections. A request selector cannot authorize
   internal-only data disclosure or change the producer's execution settlement.
5. Keep the existing recipe language, saved tool format, Knowledge semantics and
   provider result meanings unless a proved gap requires a reviewed contract
   change. No aliases, dual dispatch, legacy payload recognition or fallback to
   the old Design implementation. Retained historical reports are evidence, not
   executable compatibility; do not erase them.
6. Public docs must describe the basic action path and optional complete host path
   separately. Update the package contract, Tool Specification, public reference,
   build guide and Design spec together at their implementation stages. Do not
   publish proposed imports as available APIs before they exist.

## Implementation sequence

The stage sequence below defines the authorized work. Each stage starts from its
Flow owner boundary, adds or
strengthens permanent behavior tests before implementation, preserves existing
legal behavior, and reviews the diff plus direct consumers before advancing.
For a refactor, characterize the accepted baseline first; for a defect, prove a
red regression before changing the owner. Passing new helper tests alone is not
completion.

### Stage 0 - Finalize exports and executable proof mapping

Resolve optional entrypoints, dependencies, resource lifetime and the existing
validator/provider import graph. Bind the product cases in the target contract
to exact permanent test titles and actual producers in the Flow document before
production edits. Prepare the non-Design fixture using public package exports;
it must not import Design test helpers. Bind one connected non-Design journey
through runtime.run, the production provider/exchange, host, canonical executor
and provider successor; isolated helper successes cannot substitute. Review the
full flow and accepted Design
behavior. This planning revision has no implemented new-case producers or accepted
runtime evidence; it is not implementation admission. The required automated
integration criterion reserves an evidence identity only; Stage 0 must connect
it to the actual runner cases before production work.

### Stage 1 - Shared invocation and delivery boundary

Reuse the existing invoker, result inspector and schema-reference helpers. Extract
contract pinning, complete internal result handoff and external projection while
preserving owner-specific schemas
and classification. Provide the optional validator without weakening unknown-rule
rejection. Migrate direct Design calls and composed leaves to the same boundary.
Verify that a non-retained, non-delivered complete result still feeds its
successor. Preserve the default rollback policy and explicitly selected
preserve-progress separately, including actual final transaction settlement.
Remove superseded paths and update relevant specs/tests in the same slice.
Focus: C01-C04 and C10 below, plus the current tool-contract, tool-schema,
local-tool-invocation, result-schema-projection and unified-tool-contracts tests.

### Stage 2 - Result references, storage and media handoff

Extract named references, provenance and independent retain/delivery coordination.
Keep Design authored-syntax translation at the App owner: stage/apply flattening
and generated step IDs return the existing recipe format to shared admission.
Named-reference resolution consumes that normalized input. Inject actual App
storage and validity checks; provide explicit media metadata
instead of action-name recognition. Verify same-call dependencies and later-turn
reuse through the real provider delivery. Delete duplicated selection and image
handoff code after the consumer switches. Focus: C05-C07, conversation-results,
result-delivery and result-delivery-handoff tests.

### Stage 3 - Reusable host assembly and resource cleanup

Compose the existing library, recipe invoker, store management and leases behind
one optional host. Inject domain scheduling/overlap policy and cancellation;
preserve save-only recovery and predecessor execution evidence without assuming
final commit. Shared coordination observes, rather than chooses, App transaction
policy. Extract the SQLite adapter
without changing stored format or admitting expired runtime handles. Focus:
C03-C05, C09-C10 and existing local-tool-host, recipe, lease, scheduler and store
tests. Do not add a second recipe engine or task/session manager.

### Stage 4 - Discovery and Knowledge adapters

Extract metadata search/contract reads and file loading independently. Feed the
same admitted registry into discovery, invocation and provider description.
Keep App categories and Knowledge authorization/selection policy. Preserve
supported pagination and revision identity; no arbitrary new truncation or
compulsory discovery step. Focus: C01, C07-C08 and purpose-discovery,
operation-input-schema, local-knowledge and knowledge-handoff tests.

### Stage 5 - Provider and exchange adapters

Separate native protocol, transformed schemas, content encoding and session
continuation from Design group/prompt composition and evaluation reporting.
Extract only transport gaps beyond `createGenericHttpAiProvider`. Preserve
same-session correction, abort, execution/transport failure distinction and
observer isolation. Focus: C02-C04, C06, C09-C10 and native-provider-handoff,
server-action-batch-provider and runtime-integration tests. Native tests use
the declared existing offline CLI setup, not a paid model or a new CLI version.

### Stage 6 - Consumer integration and adoption documentation

Run the single connected non-Design journey through public built exports with
actual provider/exchange and storage handoffs across turns, then preserved
Design integration on the same source. Delete remaining transferred App wrappers,
unused imports and tests that enforce removed ownership, retaining their valid
behavior assertions at the new owner. Complete C11-C12, package type/build and
focused lint gates; run the package suite and existing AI conversation feature
verification once at final integration. Do not run the whole repository suite,
release workflows or 101. Document minimal action-only composition and optional
host/adapters with executable examples and explicit storage/session ownership.

## Verification and completion

The [target cases](../specs/ai-agent-runtime-host-composition.md#permanent-product-cases)
own expected outcomes. Existing test locations anchor regression selection;
Stage 0 supplies exact new executable mappings, not case-count-based acceptance.
Expected provider data must be authored independently from the projector or
schema transformer under test. Tests must prove intentionally damaged handoffs
fail, while legal transformed and partial results pass.

Completion requires all target cases, removal obligations, same-source Design
preservation and the non-Design public-import consumer. No skipped/unselected
case can become passing evidence. Measure actual invocation, storage, image
delivery and cleanup counts for reuse/lifecycle claims; do not infer savings
from shared helper names or compare model drawing times.

## Planning self-review

- Corrected the initial temptation to move whole host/provider files: generic
  mechanisms and domain callbacks are explicitly separated above.
- Search is an optional capability adapter, not a new Runtime Knowledge ranker;
  existing metadata/registry owners remain the source of identity.
- Result persistence and native session lifetime do not become Feature ownership.
  Retain and delivery remain independent and request handles remain non-durable.
- Both raw-result and provider-view validation survive extraction. Destination
  validation follows explicit value transformation; equal schemas are not a
  prerequisite for a useful handoff.
- Flow review added the explicit prior-turn lookup request, the pinned-contract
  handoff to result inspection, and owned-resource shutdown acknowledgements.
  A returned saved value or a closed UI alone cannot prove those producer steps.
- The plan distinguishes source-backed extraction opportunities from unproven
  usability/performance gains. No benchmark, production correctness or complete
  adoption claim follows from this documentation review.
- Revision review (2026-11-20) separates complete internal results from
  saved/model views, retains both App transaction policies, assigns Design
  grammar translation to its App adapter, and requires one connected non-Design
  runtime/provider/exchange journey. Flow-document regressions cover these
  declared boundaries; they do not prove runtime behavior.
- Pending before production: exact exports/dependency decision and executable
  Flow case bindings in Stage 0. No new implementation or compatibility path was
  added to make this plan appear complete.

Documentation checks: validate the new Flow through the supported Flow API and
the existing plan-flow document test; check changed Markdown links/anchors,
formatting, naming and `git diff --check`. All implementation observations remain
empty until actual execution supplies evidence. Manual owner criteria in this planning
Flow are review placeholders. The connected journey has a required automated
criterion with no observations; manual acceptance cannot satisfy it. Stage 0 must
complete exact executable case bindings and independent review before production
work. Structural admission cannot waive that requirement.

Planning validation on 2026-11-19: the existing plan-flow admission and naming
tests passed (19 cases); new document links/anchors and architecture source
references resolved; formatting and `git diff --check` passed. Flow evaluation
correctly remained incomplete with no runtime observations. No product tests,
new consumer proof or implementation acceptance ran in this documentation task.

Revision validation on 2026-11-20:

- The four new Flow-document regressions failed against the preceding Flow and
  passed after the four boundary revisions. The final document suite passed all
  eight cases. These assertions protect declared routes, not production behavior.
- The actual CI changed-path classifier selected plan-closeout, plan-flow-document
  and task-context checks, with no unknown paths. All 28 selected cases passed.
  The focused CI scope-selection regression also passed. The shared-validation
  job runs these document checks; the separate heavyweight Inspector job is not
  selected for this documentation change. No CI workflow change was necessary.
- The existing Flow policy suite passed 15 cases, including mixed automated/manual
  acceptance and stale evidence handling. Evaluating this actual Flow remains
  blocked with no implementation observations, as expected at planning time.
- Naming checks passed 15 cases. Scoped ESLint, formatting, 66 document/source
  references and whitespace checks passed. Existing lockfile dependencies were
  installed for the new worktree; manifests and lockfile were unchanged.
- Remote CI was not run. No runtime implementation, new consumer integration,
  101 test, full-repository test, commit or push was performed. Exact executable
  case bindings and the connected production journey remain Stage 0 onward work.

## Scheduled preflight - 2026-11-21

The one-time weekly-quota condition passed at 04:00 Asia/Taipei: the 10,080-minute
window reported zero percent used. The existing dedicated worktree and branch
were verified; a fresh fetch confirmed HEAD and origin/main both remained at the
base SHA recorded above. Approved uncommitted planning changes were preserved.

Stage 0 found a dependency decision requiring explicit approval before the
shared validator/provider-schema extraction:

- Design declares `lodash: ^4.18.1`; the lockfile resolves 4.18.1. Runtime currently
  declares no runtime dependencies or peer dependencies.
- `src/ai/tool-schema.ts` uses Lodash `isEqual` for `const`, `enum` and structural
  `uniqueItems` checks. `server/operation-input-schema.ts` also uses it when
  intersecting provider schema constraints. These are validation semantics, not
  incidental formatting utilities.
- Runtime has no equivalent shared equality API. `@asyra/utils` uses Lodash
  internally but does not expose an equality API; expanding that package is
  outside this plan. Relying on monorepo hoisting would break installed consumers.
- Proposed packaging: expose the validator/schema conversion through an optional
  Runtime subpath, declare `lodash: ^4.18.1` as an optional peer, and declare the
  existing Lodash and type versions as development dependencies for package tests
  and declarations. Portable root imports must not import that subpath or Lodash.
  Design continues to supply its already-declared Lodash. No version upgrade is
  proposed. The optional adapter's consumer setup must declare its peer explicitly.
- AGENTS.md requires explicit approval before adding a third-party dependency.
  No manifest, lockfile, production source or dependency version was changed.
  Do not replace the tested equality semantics or hide dependency requirements
  merely to avoid this decision. Final exports, executable case bindings and
  all production stages remain unfinished; there is no completion or PR claim.

Resume Stage 0 after the dependency decision. Its import-isolation, installed
consumer and schema-equivalence gates remain required before advancing.

## Implementation preparation - 2026-11-21

The user approved the existing Lodash version and dependency ownership transfer.
The optional `@asyra/ai-agent-runtime/schema` entry owns the validator, provider
schema conversion and pure result projection. It declares the existing Lodash
version as an optional peer, with the same development/type dependencies for
building and testing. Portable root imports remain independent of this entry.
Node-only adapters remain under `@asyra/ai-agent-runtime/node`; portable result
context and purpose metadata operate without Node or Design imports.

Initial owner segment: result validation and projection. Characterize the current
Design tool-schema, operation-input-schema and result-schema-projection tests,
then move their generic owner to the optional schema entry. Preserve domain
outcome classifiers and receipt semantics in Design. Public import regression
must fail before exports are provided. Stage completion requires unchanged legal,
illegal, Unicode/reference and projection behavior through the new entry.

Permanent proof locations: package `src/__tests__/host-composition.test.ts`
(direct/composed correction and complete internal handoff),
`src/__tests__/host-journey.test.mjs` (connected provider/exchange/Knowledge/state
journey and deliberate broken handoffs), and existing migrated schema, retention,
store, search and native transport suites. Actual case identities and results
must be published before acceptance; this list is not a passing observation.

### Result owner segment - schema extraction

The optional schema entry now owns supported validation, native input conversion
and model result projection. Design imports it directly; the two obsolete App
schema files were removed, with no forwarding entrypoints. Domain outcome and
action-effect classification remain in Design. Existing Lodash 4.18.1 is the
optional peer and development dependency; no upgrade occurred.

Validation: the public-import regression first failed because the schema export
was absent. After implementation, 82 cases across five focused files passed,
including original schema and result-projection behavior. Runtime build and
Design server type checking passed. Naming and focused lint passed (four existing
console warnings). The initial native-schema baseline required building Core's
existing declaration dependencies; those were built without source changes.
At that checkpoint, the remaining invocation/host, storage, discovery and
transport transfers and connected journey were pending; they are now completed
and verified in the final acceptance below.

### Connected owner handoff - implementation card

The active owner segment is Host -> canonical execution -> complete result ->
retention/delivery -> provider successor. Inputs are pinned registered contracts,
normalized recipe bindings and App transaction/storage policy. Outputs are full
validated internal values, independently selected provider views, saved names and
actual settlement. Design grammar, coordinates, catalog policy and evaluation
controls remain excluded from shared code. Allowlisted implementation is the
Runtime host, schema, result and provider adapters plus their direct Design
composition consumers and permanent tests.

Permanent source-bound producers are now being implemented:

- `packages/ai-agent-runtime/src/__tests__/host-journey.test.mjs`: C01-C07 and
  C11-C12 through the public built exports, production HTTP exchange, tool host,
  canonical runtime executor, Knowledge and a later turn. The inventory model
  endpoint and App transaction/state are fixture owners; orchestration is real.
- `packages/ai-agent-runtime/src/__tests__/recipe-admission.test.ts`,
  `preserves presentation visibility separate from internal binding types and lifetimes`
  (test title starts `keeps`): a newly exposed upstream mismatch. The complete
  result contains a presentation-only `x-model-visibility` annotation, but static
  recipe admission treats that supported annotation as an opaque value and
  prevents the successor from using it. The formal regression fails before the
  correction. Remove only the presentation annotation from implication analysis;
  retain original runtime validation, type constraints and resource lifetimes.
- Existing Design native provider/config suites now pass 307 cases (one optional
  installed-registration probe not selected); they execute the extracted native
  RPC transport. This does not replace the required offline native integration.
- Existing exchange/invocation tests protect correctable rejection and matching
  one-use receipts. Browser exchange tests run with their required jsdom
  environment; a node-only attempt's missing `location` was a harness mismatch.

The entire journey must pass before mutation counterexamples count as evidence.
Partial results and transaction policy are asserted against actual canonical
state, not inferred from receipt labels. Flow acceptance remains incomplete until
all bounded product cases and preserved Design verification run on this source.

### Retention ownership correction before final acceptance

The connected journey passed, but direct consumer review exposed an ownership
mismatch in the new exchange adapter: it constructed and cleared its own result
store, so an App-supplied store could not be selected or survive a borrowed
provider lifetime. The permanent public-export regression demonstrates the missing
saved names before the correction. The adapter must accept the App result-store
interface and optional explicit release callback; it must not create a second
store. Design retains its existing memory store and clears it through its App
composition. Async store exchange is awaited before a receipt is sent. The first
whole-feature run was interrupted for this bounded correction; it is not final
evidence and will be rerun after focused storage/exchange gates pass.

### Final integration gate

The common schema/host/result/search/Knowledge/native/exchange mechanisms are now
implemented and all transferred App entries are removed. App-owned policy
composition remains explicit. The scope selector now includes the public built
`.test.mjs` journey in the Runtime Vitest group, with a red/green selection
regression. The Flow names its exact cases, including mutation counterexamples
and both App transaction policies. Direct Design integration tests exercise the
same moved owners; native provider characterization passed 307 cases plus one
optional probe not selected. Final verification supplies the required offline
native executable and does not accept skipped handoff evidence.

The final gate is the existing `verify:conversation` runner, including the Runtime
suite, preserved App/server consumers, node acceptance and browser handoffs. Its
source/case reconciliation is retained. No 101, paid model, full-repository test,
release workflow or CI monitoring is selected. The task Flow accepts only actual
producer results plus bounded owner review after the gate completes.

### Final acceptance correction - preserved consumers

The complete feature run at `tmp/conversation-proof-IKjLlf` exposed three
test consumers still reading moved projection exports, a backend boundary list
missing the new public schema entry, duplicate Inspector source references after
the protocol transfer, a contained-runner fixture using the old scheduler name,
and verifier stimuli omitting flow-level required cases. Existing formal tests
failed before correction. These are direct consumers of the transferred owners;
update their imports/declared inputs and preserve all behavioral assertions.
The backend boundary must additionally prove the schema entry has no Framework
execution-owner dependencies; its approved Lodash dependency is explicit.
The current document backend build is also required by existing browser-proof
fixtures and must be prepared before rerunning their tests. No production
validation, canonical behavior or compatibility entry is changed.

Revised final sequence: correct these bounded consumer handoffs, run their exact
regressions, then rerun the full feature gate on unchanged source. An interrupted
or failed run remains failure evidence and cannot close the plan.

The corrected CLI control also exposed premature integration publication: its
flow-level observations depended on owner observations published by later groups.
Keep per-group evidence, then bind the admitted integration records after every
group, the full source/compiled/definition equality guard and required-handoff
checks succeed. Existing real-CLI corruption cases remain mandatory; no manual
acceptance is synthesized. Update exact Inspector implementation paths to the
transferred owners; keep their case identities and assertions unchanged.

## Local acceptance - 2026-11-21

All seven implementation stages are complete. Shared invocation, schema,
references, retention/delivery, discovery, host composition and optional
Knowledge/storage/native/exchange adapters now live in Runtime. Design retains
its grammar, policies, content, canonical operations and UI. Eleven superseded
App source entries were removed without forwarding paths. Existing Lodash
4.18.1 remains the optional schema peer and development dependency.

The non-Design public-export journey runs the production Runtime, HTTP exchange,
host, recipe, executor and provider successor. Twelve permanent cases cover
complete internal values, equivalent bindings, actual transaction settlement,
named cross-turn reuse, two images, Knowledge, borrowed/owned storage and six
deliberate corruptions. All passed after bounded owner review.

Complete Design preservation evidence is in `tmp/conversation-proof-fK3gxR`:

- Server: 3,807 passed, no failed or skipped cases.
- App: 1,621 passed, no failed or skipped cases.
- Runtime: 551 passed, no failed or skipped cases.
- Node verifier and supporting tools: all 62 selected files passed.
- Browser: 337 passed, no failed, flaky or skipped cases.
- Independent collection, complete-report admission and source/compiled-file
  equality passed. The offline Codex CLI was 0.160.0; no paid model or 101 ran.

The full runner initially returned non-success solely for two retained unmapped
warnings from the earlier failed projection tests. Its five execution groups
passed. Four existing cases were then bound explicitly in the Flow, rerun, and
used through supported publication to replace those warnings. Original failure
diagnostics remain in `tmp/conversation-proof-IKjLlf`; they were not suppressed.
The complete reports were independently readmitted after checking every source
and compiled hash against the completed run. Reconciliation is recorded in
`tmp/ownership-transfer/reconciliation.json`. The current conversation Flow and
ownership-transfer Flow both evaluate to `done` after manual contract review.

Runtime build, Design server types, 154-file scoped lint, naming, dependency
audit, public documentation generation checks and focused Flow/document tests
passed. The final scoped review found no remaining in-scope correction. No
whole-repository test, release, compatibility shim or CI monitoring was added.
PR review and merge remain separate from this completed local implementation;
the named coordinating owner retains the plan's formal archive closeout.
