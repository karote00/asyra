# Plan: AI Design Execution Flow

## Status and task association

Created: 2026-10-01. Status: Task 0 local verification and Task 1 flow admission
complete; Task 2 diagnostics and Task 3 discovery/scheduling slices implemented
and locally verified. Task 4 canonical evidence freshness is implemented and
verified through manual, remote, Undo/Redo and load browser cases. Task 5 native
end-to-end acceptance passed on 2026-10-02; PR CI and user review remain open.
Closeout owner: the coordinating agent in the originating AI panel conversation,
with product acceptance by Asa.

Base after Framework integration: `origin/main` at
`85e88319f3659c5048966146c039c88ad22142c4` (PR #280).
Existing implementation rebased and uncommitted work restored on 2026-10-02.
Worktree: `.worktrees/ai-execution-flow`.
Branch: `codex/ai-execution-flow`. Intended PR base: `main`.
The user authorizes a new worktree, this plan, implementation and PR creation.
Merge is not authorized. Single-agent execution remains the default.

This is a continuation of the merged Design implementation, not a restart of
the discarded delegated AI panel experiment. The existing
[Editable Design Agent plan](ai-design-agent-plan.md) is historical execution
context for this work; this task does not declare that entire plan complete or
activate deferred manual Text authoring.

The user fixes the App model at `gpt-6-astra` with `medium` effort. The originating
chat's effort is independent. Preserve the App selection, verify the effective
provider setting in integration evidence, and do not tune it to improve results.

## Objective and bounded scope

From one user brief, the agent selects an appropriate supported construction
method, applies meaningful editable progress, reuses still-valid work and
finishes with an accurate outcome. Reduce redundant model round trips and
deterministic work without lowering requested quality or changing canonical
document, permission, cancellation, transaction or persistence ownership.

Mutation scope after readiness: Design's existing `server/` agent orchestration,
`src/ai/` request/receipt/continuity adapters, their direct registered action
consumers when required for mutation evidence, and their permanent tests,
app-owned diagnostics, headless E2E cases and current contract documents.
Inspector architecture artifacts and their structural tests belong under
`tools/flow-inspector/inspectors/`. Generated outputs use their existing generator.
No unrelated UI redesign, Framework rewrite, CI redesign or Sim work is included.

The user clarified on 2026-10-01 that App features and integration flows are
intended Flow Inspector use, so package-only admission is an implementation
defect. Task 0 owns the necessary tool correction; adding an App architecture
file alone does not correct source or runner admission.

Discovery is bounded to these owners, their immediate callers/consumers,
registered capability sources, current specifications and existing test runners.
Final review covers the diff, affected consumers, preservation cases and fixed
gates. Discoveries do not independently authorize new mutation roots.

Preserve:

- Native editable output and registered core/common-API action execution.
- Requested style and detail, including simple, rough or deliberately ugly work.
- Full source resolution and dimensions; separately identified composition
  previews may coexist with original-resolution detail inspection.
- User-controlled Stop, existing resource/protocol guards, ordinary failure
  progress preservation and existing intentional Undo commit boundaries.
- Free public research without fixed source lists; an unsuitable reference
  prompts another method or source, not an automatic unsupported outcome.
- Conversation history, independent questions, visible partial outcomes,
  local completion time, keyboard access and document replacement safety.
- Local `.env` files and secrets. No dependency, binary or paid-service addition.

## Current authorities and evidence

Current product contracts:

- [Local AI provider](../specs/local-ai-provider.md).
- [Design preparation](../specs/design-preparation.md).
- [Conversation experience](../specs/ai-conversation-experience.md).
- [Socket document session](../specs/socket-authoritative-document-session.md).

Current source establishes Code Mode, parameterized design preparation,
`prepare_and_apply_design`, `prepareOperationBatch`, semantic target maps,
compact receipts, deferred inspection and queue/execution timing. These remain
the starting point; adding another parallel batch or state system is excluded.

Confirmed opportunities, not measured shares of elapsed time:

1. `local-design-review.ts` invalidates every inspection on any drawing mutation.
2. `local-operation-tools.ts` defaults to post-write measurement and inspection;
   batching already permits `inspection: defer` but relies on caller choice.
3. `local-ai-provider.ts` permits concurrent execution for only two contour
   analysis tools; other work is exclusive regardless of independent inputs.
4. Each request constructs new provider and artifact lifetimes. Conversation
   target hints survive separately; there is no assertion that all history is lost.
5. `local-ai-usage.ts` correctly distinguishes tool intervals from unattributed
   wall time. It does not measure private reasoning or GPU presentation.
6. Image generation and raster insertion are unavailable in the current provider.
   Prompt changes alone cannot create these capabilities.

Research supports programmatic tool composition, concise outputs, dependency-led
execution and outcome evaluation. It does not establish a speedup for this App:

- <a href="https://www.anthropic.com/engineering/code-execution-with-mcp" target="_blank" rel="noopener noreferrer">Programmatic tools and intermediate data</a>.
- <a href="https://developers.openai.com/api/docs/guides/latency-optimization" target="_blank" rel="noopener noreferrer">Latency optimization</a>.
- <a href="https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents" target="_blank" rel="noopener noreferrer">Agent evaluation</a>.

## Preparation blocker: App evidence admission

The new [task workflow](../../../workflows/task-context.md#plan-to-flow-development-and-review-before-implementation)
requires reviewed flow admission before production implementation. A static
Inspector and ordinary green CI do not establish that admission.

On the selected base, `resolveRuntimeAuthority` in
`tools/flow-inspector/control-plane/snapshot.cjs` resolves runtime owners only
under `packages/*`, requiring a non-private public canonical package entry.
The existing Design step owner `asyra-design server` rejects as unsupported.
Using the actual manifest identity `@asyra/asyra-design` instead attempts to read
the nonexistent `packages/asyra-design/package.json`. The real App is private
and lives at `apps/asyra-design`; changing its name cannot repair this boundary.
`contracts.cjs` also retains a Factory proof manifest default. CLI/service entry,
verification source, Node/browser runners and evidence admission must be checked
together; a path substitution alone would not establish App verification.

Readiness probe on 2026-10-01:

- Existing formal case `runtime authority rejects unsupported workspace package
identities and dependency graphs` passed via Node's test runner.
- Direct read-only resolution of the existing Design step returned
  `Runtime authority: unsupported package owner`.
- Resolution with its manifest identity returned
  `Runtime authority: missing or invalid workspace package @asyra/asyra-design`
  for `packages/asyra-design/package.json`.

Product-owner clarification: repair the tool's package-only assumption so App
features and integration flows can use the same development workflow. No
authority is fabricated, no Factory evidence is relabelled as Design evidence,
and no product implementation bypasses admission.

## Task 0 - Restore App and integration flow verification

Outcome: a declared App feature flow and an integration flow can be selected,
source-admitted and verified through the existing tool with exact source-bound
evidence. Existing Factory verification and retained evidence remain valid.

Scope: the existing Flow Inspector contract loader, source admission/capture,
verification execution, task-boundary and service/CLI consumers that currently
derive `packages/*` or the Factory proof from a selected flow. Update their
current contract, corresponding Inspector owner steps and permanent tests.
Do not redesign the Board, add autonomous delegation, weaken containment or
change protected CI policy. Keep this prerequisite separately reviewable from
AI execution changes, even if delivered on the same development branch.

Review before implementation:

1. Resolve owner identities against actual workspace manifests and existing
   discovery facilities. Directory names, public package exports and a
   `src/index.ts` entry are not universal App identity requirements. Preserve
   canonical paths, duplicate-name checks, declared dependency closure,
   symlink rejection and immutable captured manifests.
2. Select the product-owned proof manifest at the service boundary, preserving
   its identity through restart, candidate review, source composition and CLI.
   A chosen flow must not silently execute the Factory manifest instead.
3. Declare source and verification inputs with their owning flow. App `server/`
   modules and root support modules must not be omitted merely because they
   are outside `src/`; `.env`, generated output and unrelated files remain out.
   Cross-owner integration must capture every selected producer and consumer.
4. Map required behavioral cases and negative demonstrations to the selected
   runtime boundary. Negative transformations must affect runtime only, never
   tests, arbitrary repository paths or a hardcoded Factory file.
5. Resolve test configuration, actual module imports and containment before
   claiming support. Node-backed feature tests and browser-dependent cases have
   different execution requirements. Unsupported execution is explicit; never
   substitute a green mock or schema check for a required runtime case.
6. Preserve retained evidence through its existing explicit history admission;
   new owner support does not upgrade historical descriptors implicitly.

Permanent cases: private App feature; App server source; App plus package
integration; different manifest name and directory; unrelated workspace
exclusion; changed/missing transitive input; mutation outside the declared
boundary; source/test-role overlap; symlink/path escape; restart and source
composition; unsupported runner; existing Factory positive and negative proof.
First strengthen the failing App regression, then correct one owner step at a
time and verify its consumers. A path-only unit pass cannot close this task.

Required gates: focused contract/source/runner/service/task tests, a real App
feature execution from captured source, a real cross-owner integration execution,
existing Factory preservation proof, Inspector structural checks, naming/lint,
applicable tool build and its scoped Changeset before delivery. Source execution
uses installed locked dependencies and declared resource guards.

Task 0 local evidence: actual private Design server scheduling and its
Utils-backed gradient validation pass from captured source; the declared
negative mutation fails precisely the gradient obligation. App candidate
verification and source handoff survive restart. The control-plane suite covers
481 cases: 477 pass after preparing the existing browser origin and Framework
build prerequisites; four platform/opt-in cases remain skipped. The initial run's
14 environment failures were rerun successfully (13 browser cases and one
existing App fault-injection case). Inspector catalog/workspace contracts pass
25/25, React tests pass 12/12, naming passes 12/12, scoped ESLint, typecheck and
tool build pass. No paid model execution or production AI change was involved.
Task 1 may proceed; PR CI and the complete AI plan remain outstanding.

### Execution card - admit-proof-contract

Product contract: Task 0 above and the App flow correction section of
`docs/ai/tools/flow-inspector/CORE_PROOF.md`. Architecture owner:
`admit-proof-contract` in the Core Proof Inspector.
Inputs: trusted product proof manifest, architecture and selected manifest path.
Output: immutable admitted mapping with its real manifest identity and declared
negative runtime transformations. Every selected case and handoff still resolves.
Conditions: paths are canonical repository-relative paths; a negative mutation
belongs to a selected step's runtime implementation boundary and cannot change
verification files. No bypass permits unknown steps or missing cases.
Allowed contributors: existing mapping admission and trusted contract loading.
Forbidden contributors: a Factory filename as universal authority, caller-defined
passing results or source capture/runner execution inside contract admission.
Failure owner: `admit-proof-contract`; source admission independently verifies
actual runtime membership before execution.
Files: `contracts.cjs`, its formal `contracts.test.cjs`, the named spec/Inspector
contract and this card. Gates: focused admission tests, existing contract tests,
naming and formatting. Stop on any obligation weakening or need to mutate another
owner before this segment passes. This segment does not claim App execution.

Segment evidence: the new product-manifest and App negative-transformation
regressions failed against the original Factory-only admission. After the
correction, all 29 contract tests and 12 naming checks pass. The generated
Inspector workspace was regenerated from its source; its 25 catalog/workspace
tests pass. The source capture, service selection and execution consumers still
need their own correction and integration evidence before Task 0 can close.

Admission follow-on: optional `workspaceSources` in the product mapping declares
workspace names and their relative runtime `inputs` (exact files or directory
`/**` patterns) plus a nullable source `entry` for package aliases. The source
owner resolves names against actual root-declared workspace manifests; this
mapping never supplies a directory identity. This is a proof input declaration,
not an implementation write allowlist. An explicit declaration produces runtime
scope format 2. Existing retained scope format 1 stays at its declared historical
package boundary. Names belong to contract/source admission; persisted scope
versions remain explicit. Formal admission tests cover unsafe, duplicate and
ambiguous declarations before capture consumes the new format.
The source review returns to this admission boundary for one missing guard:
an alias entry cannot name hidden configuration or test code, even when its
parent directory is a valid declared runtime root. Add those failing cases
before allowing source discovery to read the entry.

### Execution card - capture-proof-source

Product contract: Task 0 and Core Proof App flow correction. Inspector:
`capture-proof-source`, its admitted-contract input and proof-source output.
Inputs: admitted scope, trusted repository location, root-declared workspace
manifests, source declarations, retained source artifacts at their fixed location.
Output: immutable exact file inventory and runtime authority format 2 for an
explicit workspace scope, including actual workspace directories and source
inputs. Conditions: names are unique, dependencies resolve to captured manifests,
source paths stay within their workspace, runtime and verification roles do not
overlap, and actual bytes bind the identity. No public-export prerequisite for
private App owners. Unsupported or missing inputs fail here before execution.
Allowed contributors: source-owned filesystem discovery and existing snapshot
composition/validation. Forbidden: directory-name inference, ambient `.env`,
generated output substitution, verifier files as runtime, caller-issued authority.
No persistent cache: use one capture-local read/hash map; each unique discovered
input is read once, and retained byte admission remains a separate trust boundary.
Source declarations and authority versions are persisted proof identities owned
here and contract admission; genuine historical format 1 retains its existing
validation. No conversion of old evidence is introduced.
Implementation: `snapshot.cjs`, its narrow `workspace-sources.cjs` helper and
formal snapshot tests, plus corresponding spec/Inspector. CI input selection is
a later slice of this owner. Tests: private App with `server/`, different name
and directory, App/package integration, missing/changed dependency, escaped and
symlinked input, role collision, unused declarations, immutable re-admission,
composition and per-capture read counts. Stop before service/runner changes;
this segment alone cannot establish end-to-end App support.

Source gate follow-on: CI admission consumes the captured verification mapping
role to select the independently accepted Git-base contract. It must reject a
missing/substituted selected manifest, not read Factory instead. Include the new
source helper among protected verifier inputs. The selected snapshot already
owns the mapping identity; CI admission does not reselect a product. Files:
`ci-context.cjs` and its formal tests, under the same source owner.

### Execution card - serve-proof-actions

Product contract: Core Proof controlled actions and Task 0 selection/retention.
Inputs: server-selected canonical `manifestPath`, repository root, optional
explicit store location, admitted contract/source artifacts and registered actor
requests. Outputs: one product-bound service and retained attempt/history state.
Select the same manifest for fresh candidate reads and preserve accepted versions
on restart; reject reopening another product's store. Default product stores are
separated by manifest identity. CLI `--manifest` selects a local service; remote
`--url` consumes the running service's selection and cannot retarget it.
Allowed: contract/source owners and existing service/store/CLI. Forbidden:
Factory fallback for an explicitly selected product, current contract recreation
of retained runtime authority, accepting unsupported descriptor formats.
Boundary: service/store/CLI and their formal tests in the Inspector allowlist.
Failure owner: `serve-proof-actions`. Tests: initial selection, restart, candidate
selection, wrong-store rejection, CLI selection, and retaining source-authority
format 2 without accepting an unknown format. Preserve existing service gates.
Source helper gates passed: 39 snapshot/workspace tests, 30 admission tests and
both independent accepted-base CI selection tests; naming passes. Stop before
runner or task-admission changes; service selection alone is not runtime proof.

The service regression exposed a fixture that declared a Factory rollback
mutation outside its selected owner steps and never applied that scenario.
Correct this affected fixture to mutate its actual UI Context owner and execute
the declared negative scenario. Keep its existing positive integration gates;
do not broaden an implementation boundary to admit an unrelated mutation.

### Execution card - capture-proof-source derived configuration

The service regression gate passed except for the now-corrected integration
fixture; both its positive lifecycle and real negative scenarios pass. Return
to `capture-proof-source` for the derived execution handoff. A workspace flow
may itself own the tool's control-plane directory, so generated execution files
must have fixed paths outside workspace runtime inputs. Source authority format
2 uses the fixed `.flow-proof/` namespace inside its immutable source tree;
retained authority format 1 keeps its original exact generated bytes/paths.
The source owner exports the fixed execution role selection for its runner
consumer; no caller may choose paths or process commands. Keep execution source
format 2 and its native-loader policy, existing byte identity and containment.
Scope: snapshot helper and source tests, then the separate runner card consumes
the completed roles. Gate: a tool-workspace overlap regression plus snapshot
preservation; stop before changing runner admission. Node-backed Vitest execution
is the current runner; browser-only execution is not silently substituted.

### Execution card - execute-proof-run

The source-role regression and existing snapshot gates pass (40 cases).
Consume the source owner's fixed role selector and admitted workspace authority
format 2 in the contained runner. Inputs remain captured source, registered
scenario, cancellation/deadline and trusted attempt location; output remains a
settled runner result with source identities. No manifest rediscovery or source
rehashing belongs here. Scope: runner and its permanent tests, exact Inspector
condition and spec. First extend the real contained execution test to workspace
authority and prove rejection, then admit that format and selected roles.
Preserve process containment, cancellation, timeout, zero source reads and one
report hash; unsupported authority still fails before dispatch. Gate: complete
runner tests plus naming/lint, before another owner advances.

Runner acceptance also uses a permanent App fixture: captured Design server
scheduling and the actual Design gradient validator consuming Utils metadata.
It runs the real modules, including a declared runtime negative transform;
neither a mock App nor a renamed Factory case can satisfy this gate. Fixture
authoring belongs to the runner test boundary. This proves Node feature/source
integration support, not visual generation quality or browser execution.

### Execution card - admit-agent-task workspace boundary

The actual App server and Utils integration proof passes, including its runtime
negative scenario. At `admit-agent-task`, replace the directory-derived owner
assumption only for declared workspace scope. Pre-admission still checks a
canonical runtime file and exact step boundary. Source-bound admission then
checks the selected step's actual captured workspace directory and declared
runtime inputs before any candidate write or dispatch. Dependencies remain
read-only inputs. Legacy tasks retain their recorded package boundary. Scope:
agent-contract and permanent admission tests, its exact spec and Inspector.
The task execution consumer is a subsequent step; do not claim end-to-end task
support until that consumer passes. Gates: private App src/server admission,
dependency and test/config/secret rejection, existing admission suite and naming.

### Execution card - execute-agent-task selected workspace

All six task admission cases pass. Consume source-bound admission immediately
after capture, before writing candidate files. Retained candidate verification
loads its captured manifest identity; the deterministic demonstration uses that
contract's declared negative scenario rather than Factory's scenario name.
Scope: task owner, demonstration adapter and task tests under
`execute-agent-task`. Prove a real App candidate mutation, verification, source
handoff and restart, plus rejection of a captured dependency as a mutation owner
before adapter dispatch. No real provider is activated and no budget is changed.
Gates: task suite, existing verifier/runner regressions and scoped lint/naming.

### Execution card - manage-flow-target workspace evidence

The 31 task admission/execution regressions pass. The final prerequisite
consumer is dependent work admission: it accepts only authority format 1 even
when the source owner has admitted workspace format 2. Scope: flow-target and
its formal tests, exact Inspector/spec. Accept both known source authority
versions with unchanged digest, source availability, allocation, prerequisite
and restart checks; unknown versions still reject. No source IO/reassessment
belongs here. Gate: dependent admission/restart tests and complete target suite.
Automated package-release PR metadata remains its existing published-package
capability; this task's private App PR is created through the normal repository
workflow, without activating or extending that separate release capability.

## Task 1 - Review and admit the complete execution design

Outcome: a feasible whole flow, exact architecture steps, executable product
cases and preservation obligations admitted through supported Flow Inspector
paths. This task owns design only until the prerequisite above is resolved.

The following owner flow is the proposed design. Transfer its reviewed contract
to the tool-owned schema-2 Inspector before production work. Existing product
specifications remain current runtime authority until their implementation slice.

### Request and working context

Owner: Design conversation/request adapter. Input: user brief, attachment
references, conversation/document identity, current selected targets and current
canonical change identity. Output: request context with requested medium,
constraints and validated continuity references. The model interprets intent;
the adapter does not turn keywords into a fixed subject/style classifier.

Allow existing conversation state and public document observations. Exclude
renderer-derived authority and a second editable document snapshot. A new
conversation has no previous working context. A document replacement retires
the previous context; missing/deleted targets require fresh resolution.
Failure is owned here, before a successor can consume stale references.

Boundary: `src/ai/conversation.ts`, `runtime-input.ts`, provider adapter and
their direct lifecycle tests. Review actual document revision availability
before choosing continuity keys; no speculative whole-document hash per call.

### Decide and compose work

Owner: local provider. Input: request context, registered capability catalog,
reference findings and previous execution/inspection receipts when applicable.
Output: a coherent program of registered operations with selected method,
targets, parameters, requirements and any unresolved decisions.

AI owns aesthetics, ambiguity and method selection. Existing native Code Mode
owns program execution; the App does not evaluate arbitrary generated code.
Keep discovery available across methods. Simple edits bypass construction and
research when irrelevant. Original designs need no real-subject reference.
Concrete reference work may change sources without restarting completed work.
Unsupported media require an explicit capability explanation, not silent
substitution with a lower-quality medium.

Boundary: `server/local-ai-provider.ts`, `ai-domain-prompt.ts` and existing
tool definitions. Separate common instructions from relevant method guidance;
retain no Taipei-101-specific coordinates, detail quotas or search-source lists.

### Prepare and retain deterministic work

Owner: existing design/image artifact owners. Input: validated semantic
parameters and selected source/artifact handles. Output: immutable prepared
artifacts, target maps and findings, addressed by handles rather than copied
through model messages. Optional user edits and advice bypass preparation.

Reuse existing preparation, patterns, projection and artifact release APIs.
No model call inside geometry expansion, canonical mutation during preparation,
or automatic detail removal. Likely-hidden details can be deferred by the model
without computing their geometry; overall review decides whether to restore them.

Boundary: existing `server/local-design-tools.ts`, `local-image-tools.ts`,
`design-preparation.ts` and related typed preparation owners. Extend a lifetime
only after work-count evidence identifies repeated preparation. Define exact
inputs, source identity, invalidation, release and session isolation first.
Server restart may lose derived work but cannot lose canonical drawing progress.

### Schedule and apply

Owner: existing tool scheduler and operation adapter, followed by the existing
App action runtime. Input: composed registered operations and prepared handles.
Output: ordered execution receipts and progressively visible native changes.

Classify access at the tool's existing semantic owner. Only proven independent
reads/preparations may overlap. Shared artifact mutation, document writes and
read-after-write dependencies retain ordering. Unknown effects remain exclusive.
Do not infer safety from tool names or introduce a second transaction manager.

Apply meaningful chunks as they become available. Do not wait for all final
detail, nor add animation-frame delays. Admission rejects an invalid batch
before its canonical writes. Cancellation prevents queued execution and late
results. Never retry an already-started mutation without authoritative receipt
and idempotency semantics. Prior successful progress keeps existing Undo behavior.

Boundary: `local-tool-scheduler.ts`, `local-operation-batch.ts`,
`local-operation-tools.ts`, `local-design-workflow.ts`, `batch-exchange.ts` and
direct App action/receipt adapters. Canonical application stays under registered
Feature/common-API ownership; no direct renderer or package-internal writes.

### Inspect affected work

Owner: existing Design inspection and review coordinator. Input: real receipts,
changed canonical fields/targets, semantic dependencies and rendered evidence.
Output: requirements with current, stale, failed or unverified evidence and a
targeted correction request when necessary.

Known non-visual changes need not retire visual evidence. Parent geometry,
inherited style, layout, clipping and paint-order dependencies expand the scope.
Unknown effects conservatively invalidate the complete relevant target. Reuse
requires demonstrated equivalence, not a model assertion that two images match.
Remote/manual edits, Undo/Redo and replacement participate in invalidation.

Coalesce deterministic measurement within a coherent execution stage. Final
completion still requires current overall evidence and resolution of deferred
requirements. Receipt success alone never certifies visual quality. Failed
criteria return to decision/composition with relevant evidence; they do not
force a complete restart or a fixed number of retries.

Boundary: `local-design-review.ts`, `local-operation-tools.ts`, App inspection
and review actions, and only the public change observation needed by them.
Detailed dependency validity is a readiness experiment before cache design.

### Settle and explain

Owner: existing conversation lifecycle. Input: verified outcome or unresolved
failure/clarification plus retained progress. Output: an accurate visible result,
independent question when required, preserved work history and completion time.
Questions pause the work segment; an answer starts a subsequent segment.

Errors retain the failing operation, confirmed progress, still-valid references
and recovery category. Deterministic known repairs may execute without another
model decision; changing intent, source selection or visual method returns to
the model. Do not expose credentials, private reasoning or raw provider dumps.

Boundary: current provider result/error adapter and conversation presentation.
This plan does not redesign the panel's accepted layout or add activity spam.

### Observe without controlling execution

Owner: current usage/trace instrumentation. Input: provider lifecycle events,
tool queue/execution/receipt spans and browser commit/render observations where
available. Output: a bounded timeline linked to request and operation identities.

Separate startup, model/provider waiting, native orchestration, research, tool
queue, execution, approval wait and browser acknowledgement. Unobservable time
remains explicitly unattributed. Parallel spans use interval unions and causal
ordering, not summed durations presented as total wall time. Record selected
payload sizes, output/token usage when available, repeated-work counts and first
meaningful visible progress. Host yield is not proof of paint or GPU completion.
Diagnostics cannot change product output or grant completion.

Boundary: `local-ai-usage.ts`, provider event handling and existing App trace
receipt fields. No raw images, prompts, generated code or secrets in summaries.

### Whole-flow design review and remaining feasibility work

Resolved: deterministic preparation and canonical apply already have a typed
handoff; compact/full receipts have tests; Code Mode already composes registered
tools; live research is already enabled. Preserve those routes.

Resolve before admission: App source/runner support; exact document change
observation for external edits and Undo; cross-request identity/lifetime proof;
inspection dependency equivalence; tool effect declarations; actual provider
payload visibility and lifecycle events. Use bounded retained design experiments
where code inspection is insufficient. These are readiness obligations, not
permission to invent measured cache benefits or mark the whole design approved.

### Task 1 design-authoring segment

Owner: complete execution contract and its seven architecture handoffs; this
segment changes specifications and Inspector architecture only. Inputs are the
existing provider/preparation/review/conversation contracts, registered action
effects, canonical change observation and the installed app-server protocol.
Output is one thin execution specification and one schema-2 architecture map.
Existing lower-level preparation and transaction owners remain authoritative.

Allowed contributors: current App source, public Core observations and generated
protocol schema. Forbidden: model-output quality claims from mocked transport,
new rendering semantics, speculative cross-request caches and tool-name safety
lists. Boundary: this plan, `specs/ai-execution-flow.md`, the corresponding
`tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs` and existing
workspace catalog generation. Failure owner: this design segment. Gates: schema
and route validation, source/spec path existence, naming and workspace catalog
checks. Stop before production if any route lacks an owner or an unsupported
protocol feature is required. Product cases and implementation gates are recorded
in the specification; static contract validation does not prove runtime success.

Feasibility findings (2026-10-01):

- Installed Codex `0.158.0-alpha.2.1` generates `DynamicToolSpec` with required
  `type: function` and optional `deferLoading`; native namespaces also exist.
  The unrelated PATH CLI is `0.40.0` and must not be used for acceptance. No
  runtime upgrade is needed. Generated schema is retained under ignored
  `tmp/flow-inspector/codex-schema/`. Schema support proves protocol shape only;
  actual native discovery and invocation still require integration evidence.
- The provider composes definitions whose individual tool owners already supply
  `type: function`. A strengthened real-provider packet assertion passes before
  production changes; the initial suspicion of a missing discriminator was
  incorrect. Retain this preventive coverage and keep tool identities stable.
- App `common-apis/design-review.ts` already observes Scene Tree, Props and file
  load while reviewing. Reuse this canonical observation route for evidence
  lifetime; a request-local server counter alone misses external changes.
- `basic-api-catalog.ts` already owns semantic effects. Tool owners must classify
  access from these contracts and their actual artifact use. Unknown access stays
  exclusive. Merely reading a mutable artifact is not independent preparation.
- Retain current request-local immutable artifacts and conversation target maps.
  There is no measured case justifying a cross-request geometry or image cache.
  A successor request resolves targets against current canonical state.
- Target-local review reuse is conditional on a complete dependency footprint.
  Until an exact footprint is demonstrated, use canonical document generation
  to invalidate conservatively. Stage coalescing removes repeated intermediate
  measurement without pretending that unrelated-image equivalence is proven.
- Native lifecycle events and existing queue/execution spans establish observed
  boundaries. Deferred catalog bytes are not a measured model token saving;
  protocol bytes, advertised eager schema bytes and actual provider usage must
  remain distinct evidence fields.

Sources: <a href="https://learn.chatgpt.com/docs/app-server" target="_blank"
rel="noopener noreferrer">Codex app-server protocol and schema generation</a>;
<a href="https://developers.openai.com/api/docs/guides/tools-tool-search"
target="_blank" rel="noopener noreferrer">Responses tool search concepts</a>.
Responses parameters are not assumed to be app-server parameters.

### Task 1 protocol feasibility probe - compose

Inspector owner: `ai-execution-flow` / `compose`; specification:
`ai-execution-flow.md#capability-discovery-and-composition`. Input: the installed
native `DynamicToolSpec` function contract and the actual provider's advertised
thread-start tools. Output: a permanent transport regression proving whether the
current provider satisfies required envelope fields. This is a design probe,
not production implementation or model-output acceptance.

Allowed: existing fake subprocess transport as a receiver of real provider
packets. Forbidden: mocked tool definitions or a paid drawing to discover schema
errors. Boundary: existing `server/__tests__/local-ai-provider.test.ts`, the
compose Inspector boundary and this plan. Failure owner: provider composition.
Gate: focused existing process/model test, then the strengthened protocol-field
assertion. It passes on current production code, disproving the suspected missing
field; no fix is required. Stop before production changes
until contract/source admission is recorded. No tool identity is renamed.

The original process/model test passes (1 case, 77 unrelated cases filtered),
and the strengthened assertion also passes (1 case, 77 filtered). Individual
tool owners already supply native function discriminators. The new assertion is
preventive coverage, not evidence of a repaired bug. No inference was executed.

The first selected source-proof flow is `capability-advertisement`, registered
through `apps/asyra-design/flow-contracts.json` and its permanent
`server/__tests__/execution-flow.config.ts`. It exercises the actual provider
against a fake transport, never a live inference request. Its registered negative
mutation omits dynamic tools and must fail the same mapped case. This admits only
the compose packet obligation; it does not establish the remaining owner steps,
native discovery behavior or whole-target acceptance. Additional owner cases and
handoffs remain required before whole-flow admission. The selected manifest,
proof config, existing provider test and compose boundary are within this Task 1
feasibility segment; no production source is changed.

Source-bound capability proof passed on attempt
`10d7cfa5-4a2e-455e-a46f-b84493a6f71d`; deliberate omission failed exactly
`compose.registered-tools` on `8b63bfec-9d93-471d-ad6b-73d710896814`. The
isolated proof replaces the broad provider-suite selector because unrelated
filtered cases are correctly rejected as unexpected by Flow Inspector. Local
contract review `0f733d031085ea76726937566ec676ea408318ec522c93f1d05f49d1db0256f1`
accepted this mapping with no removed obligations; these are historical source
pins and subsequent test changes require fresh verification.

The execution probe also confirms basic APIs are already discovered through
`describe_design_apis` and executed through `execute_design_batch`; they are not
all eagerly advertised as individual native schemas. Preserve that existing
mechanism. Measure the high-level catalog before choosing deferred native tools;
no claim of catalog-size or latency improvement is established yet.

### Task 1 continuity proof - request

Owner step: `request`; spec: `ai-execution-flow.md#request-and-continuity`.
Inputs: user intent, current target existence, retained successful action receipt.
Output: successor feature request with only current canonical references. New
conversations and disposed document lifetimes omit previous targets. Allowed
contributors: actual conversation controller and a controlled Feature boundary;
forbidden: synthetic conversation state and renderer-derived IDs. Failure owner:
`request`. This segment adds only the permanent execution proof case and its
Inspector/test mapping, not production behavior. Case: deleted role targets are
removed before the next request, and a new conversation has no prior target.
Gate: focused proof test, followed by source-bound candidate proof when the owner
inventory is complete. Stop for a current-contract failure before adding another
owner. The shared proof file is test evidence for each explicitly named step.

### Task 1 artifact proof - prepare

The request continuity case passed without production changes. Re-read the
`prepare` step: validated draft and request-local handles enter the existing
preparation owner; immutable artifacts and findings leave it. Spec:
`ai-execution-flow.md#preparation-and-execution`; failure owner: `prepare`.
Allowed contributor: actual `createDesignPreparationSession` with a counted real
compiler. No mocked geometry, renderer writes or cross-request cache. Add one
case to the permanent execution proof and corresponding boundary/mapping: repeated
resolution compiles once, a changed draft compiles again, another request cannot
resolve the handle, and released handles fail. Gate: that focused case. Stop on
semantic mismatch; this segment changes no production owner.

### Task 1 operation proof - apply

Preparation lifetime proof passed. Re-read `apply` and its preparation handoff;
spec: `ai-execution-flow.md#preparation-and-execution`. Input: admitted draft,
prepared handle and registered action. Output: canonical batch and compact
receipt. Existing preparation, workflow and operation adapters are the only
contributors; no alternate transaction or renderer route. Invalid drafts bypass
writes; failure owner is `apply`. Extend the shared formal proof and its explicit
Inspector evidence boundary. Count the real compiler and canonical dispatch,
derive receipt identities from the dispatched prepared artifact, and verify
invalid input does not dispatch. This proves orchestration at the existing batch
boundary, not actual Canvas geometry or Undo (covered by the integration gates).
Gate: focused apply proof. Stop on contract mismatch before the next owner.

### Task 1 review proof - inspect

Apply proof passed with actual adapters and counted compiler/dispatch. Re-read
`inspect`, spec `#evidence-and-completion`: only current rendered inspection
references and requested criteria may justify assessment. Add a baseline proof
through the existing review owner: structure success cannot certify completion,
a mutation retires prior inspection IDs, and current overview/detail evidence
can satisfy the requested checks. No screenshot cache or external-generation
claim is made by this local test; canonical observation is a later integration
requirement. Scope: shared proof and mapping, failure owner `inspect`; focused
case is the gate, and an unexpected acceptance blocks advancement.

### Task 1 outcome proof - settle

Current-revision review proof passed. Re-read `settle` and `#evidence-and-completion`:
Feature execution receipts and retained progress produce a visible outcome.
Allowed owner is the actual conversation controller; controlled Feature receipts
exercise the boundary without pretending to render. Add a partial-result case
which retains its completed action/progress and keeps prior history when the next
request makes no change. No successful completion may be inferred from an empty
mutation. Boundary: shared proof/mapping; failure owner `settle`; focused case
must pass before the diagnostics owner. No production changes in this segment.

### Task 1 accounting proof - observe

Partial settlement proof passed after correcting the test to the public
`settledTurns` field (no production bug). Re-read `observe` and
`#ownership-and-diagnostics`. Inputs are observed lifecycle spans and bounded
receipts; output is trace accounting, never inferred private model reasoning.
Allowed owner: existing usage recorder. Verify overlapping intervals count once,
missing spans stay unattributed, and an arbitrary private payload is excluded.
Use a controlled clock for arithmetic, not a machine-specific duration budget.
Boundary: shared proof/mapping; failure owner `observe`; focused case and then
all seven source-bound baseline owner cases are the gates. These are feasibility
and preservation evidence, not proof of the forthcoming improvements.

## Task 2 - Establish baseline and execution evidence

After Task 1 admission, use formal provider/scheduler/operation tests to capture
work counts and orchestration boundaries. Add failing regression cases before
fixing repeated work. Improve existing diagnostics to distinguish observed
stages and missing observations. Store evidence under project-owned test output
paths and bind it to source/configuration; never interpret unknown time as
private reasoning. Do not launch repeated paid drawings to discover protocol bugs.

Gate: focused provider, usage, scheduler and batch-exchange tests, including
overlapping intervals, cancellation, malformed receipts and unavailable fields.

## Task 3 - Implement bounded execution and working continuity

One reviewed owner step per slice: request continuity, parameterized work,
effect-aware scheduling, then canonical handoff. Reuse current registry and
schemas. Generate only required tool context and return compact results while
retaining full data behind validated handles. No undocumented concurrency across
writes. Prove isolation, release, invalidation and work counts through ordinary
callers, not only helper tests.

Gate: existing design preparation/pattern/workflow/batch/scheduler/provider tests
plus permanent new normal-caller continuity cases. Existing transaction,
permission and failure-progress tests must remain green.

## Task 4 - Implement affected review and intent-appropriate guidance

Use the dependency contract proven in Task 1. Test unrelated edits versus parent,
style, order, manual/remote, Undo/Redo and replacement changes before updating
invalidation. Coalesce stage measurement; require final overall assessment.
Compose focused method guidance without changing user intent or medium.

Gate: `design-review-stages`, `local-operation-tools`, `ai-domain-prompt`,
inspection/review integration and representative native rendering cases.
Equivalent output plus counted eliminated work is required for optimization.

## Task 5 - Integrated acceptance and PR delivery

### Inspect integration execution card

Owner `inspect`, spec `#evidence-and-completion`, retains the existing Inspector
inputs, conditions, bypasses and failure owner. Verify the real public canonical
observations with manual edits, Undo/Redo, remote edits and document load. The
new browser case belongs to the inspect boundary; it exercises the existing
validity owner without mocking channel notifications. It does not certify
appearance or change canonical, render, transaction or collaboration behavior.
Existing rendered-inspection E2E separately proves actual image freshness.
Test-local names and ephemeral state have no persisted identity. Naming baseline
passes. Gates are the focused headless browser cases, existing conversation E2E,
App full tests/build/types, naming and changed-file lint. An actual lifecycle
failure requires a test-first correction at its canonical owner before advancing.
No cache or new runtime API is introduced by this preventive integration slice.

Integration result: the complete App command passes 1,361 tests (three opt-in
native/live cases skipped), App/dependency build and both TypeScript projects
pass. The rendered-inspection case passes; 23 conversation/navigation and
canonical-evidence browser cases pass, including actual remote publication and
document load. Naming, changed-test lint and Inspector structure pass.

### Compose live acceptance execution card

Owner `compose`, product cases and DoD above, exercises the declared native
discovery/composition route and its apply/inspect/settle consumers. The existing
local-provider E2E owns the new opt-in upper-two-tiers case and reuses its stream
capture. Inputs are one short brief, ordinary registered tools and an isolated
document; outputs are actual editable content, terminal outcome, inspections,
video and bounded execution evidence. All production owner boundaries remain
unchanged. No mock provider, generated geometry fixture or test-side artwork is
allowed in the live case. Viewport fitting uses existing App navigation only.
Record from App opening through ten seconds after settlement; inspect screenshots
and actual inspection artifacts separately from the automated success assertion.
Use the existing local subscription opt-in, headless browser, one worker and no
automatic retry. Test lifetime guard is not a product timeout or speed target.
Stop and retain failure evidence if the brief fails; diagnose before rerunning.
All added identifiers are test-local and ephemeral. Prior naming baseline applies;
run naming/lint and discovery before the paid run. No model/effort change.

Live attempt 1 reached a clarification after research and reference tracing,
without drawing: "top two major tiers" was ambiguous about whether the narrow
crown counted as a tier. It is not accepted. The harness initially awaited only
a terminal outcome, while a question intentionally retains the active outcome;
recording was stopped and all artifacts retained in
`tmp/flow-inspector/live-upper-tiers-attempt-1`. The harness now also stops on an
independent Question. The second brief specifies the two uppermost large bamboo
sections plus the complete crown/spire above them. Production instructions and
model settings remain unchanged; this is a scope clarification in the test brief.

### Live harness iteration - confirmation and retained evidence

Attempt 2 reached an accepted visual assessment, then requested confirmation to
remove replaced back-facing collar geometry. The recording driver did not handle
that visible confirmation and the 900-second harness guard stopped the run. This
is failed acceptance, not a successful drawing or a provider timeout. Artifacts
remain under `tmp/flow-inspector/live-upper-tiers-attempt-2`.

Owner remains `compose` integration verification, with the same spec and Inspector
boundary above. First prove the missing interaction using the actual App and a
fixed protocol fixture, then update only the recording driver: acknowledge
undoable, no-external-effect edits in its isolated test-owned document, record
each acknowledgement, fail on questions, and preserve artifacts on failure.
No production permission, model, scheduler or prompt changes. Improve the existing
stream recorder to retain incoming chunks sequentially without rewriting growing
history for each chunk. Gates: deterministic confirmation/stream recording case,
existing rendered-freshness and native-component cases, lint/naming and one live retry after those
pass. Self-review: user authorization covers creation/refinement/deletion in the
test drawing; it does not cover external effects or unrelated documents. The
recorded interactions must remain distinguishable from model tool time.

The confirmation driver regression first failed on the real confirmation screen
at its 20-second test guard, then passed after the UI acknowledgement was added.
Three deterministic recording/freshness/component cases pass, as do naming and
lint. The stream now appends rather than repeatedly replacing growing history.

Live attempt 3 was invalidated by the coordinating agent formatting
`apps/asyra-design/flow-contracts.json` during the run: Vite reloaded the page and
cancelled the provider at 182,759 ms. The native run is not accepted. Artifacts
remain under `tmp/flow-inspector/live-upper-tiers-attempt-3`. Finish all source
writes and gates before the next live run; while it records, use read-only
inspection and write diagnostic artifacts only under ignored `tmp/`.

Full Flow Inspector control-plane verification: 467 passed, 4 opt-in skipped;
13 Board cases initially failed because the command omitted the existing tool
`.env`. Re-running both Board files with that `.env` passed all 13 (2 opt-in
skips). Thus all 480 applicable cases pass. Inspector workspace tests, typecheck,
build and the new architecture structure tests also pass. Final allocation
`cdd96b54-9040-4a88-b9c1-80728d8105cb` and same-source assessment
`d690262a-087b-4e6b-b4a8-b59f91d23166` prove seven owner works, whole integration
and preserved accepted obligations; the previous target remains immutable.
Three deliberate source mutations each fail only their intended case (6/7 pass,
no infrastructure issues). These prove the contract checks, not live quality.

### Live harness iteration - canvas navigation

Attempt 4 reached native settlement at 591,102 ms with retained artwork and an
unsupported outcome, but the recording driver never entered its monitoring loop:
its initial click targeted `#viewport-anchor`, a non-interactive positioning
element with `pointer-events: none`. The custom recording page had no action
timeout, so it waited until the 960-second harness guard. The empty navigation
timeline and final 100% viewport corroborate the missing fit behavior. This is
a harness failure, not provider thinking time. Preserve attempt 4 artifacts.

The next compose acceptance slice changes only this test file and plan. Product
contract, Inspector compose inputs/outputs, contributors, boundaries and failure
owner remain as in the compose acceptance card above. Reuse the existing
`clickCanvas` test utility for an actual user canvas click. First reproduce the
current navigation failure in a deterministic App test, then verify composer
focus release, fit navigation, and settlement with the same recording driver.
Bound custom-page action waits so future interaction failures identify their
locator instead of consuming the entire live guard. Gates: focused navigation
and confirmation E2E, naming and changed-file lint. No production, model, prompt,
permission, geometry or quality-acceptance changes belong to this correction.
After these pass, separately assess the native quality/scale findings before
starting another live iteration; a successful harness is not visual success.

The navigation regression failed because the real canvas intercepted the
positioning element's click, then passed after reusing `clickCanvas`. Composer
focus release and actual zoom change are asserted; the confirmation driver also
passes (two cases). Naming (12 cases), lint and formatting pass. Attempt 4's
inspection overview shows detailed glazing but visibly repetitive material and
imperfect profiles, consistent with the failed visual assessment. Its added
uncertainty about exact local dimensions is not a reason to weaken the original
brief; existing domain guidance already distinguishes detailed style from exact
engineering reproduction. The next live run retains the same brief and quality
assertions, now with functioning navigation and bounded interaction waits. No
production prompt correction is justified by this evidence alone.

### Compose recovery iteration - rejected input is not unavailable capability

Attempt 5 now records and settles normally. It stops after 37,153 ms without
drawing: the model omits required review-plan arguments and interprets their
rejection as a broken App interface. The existing provider returns
`available: false` for both a recoverable `LocalOperationPreparationError` and
an unavailable external reference, conflating a rejected invocation with a
missing capability. Registered schemas remain intact; do not weaken admission.

Owner: compose, `#capability-discovery-and-composition` and `#preparation-and-execution`.
Inputs: the registered tool binding and its existing typed failure. Output: a
compact native error reply that preserves the distinction between recoverable
rejected input and an unavailable reference. Conditions, bypasses, contributors,
forbidden contributors, failure owner and no-cache boundary remain those of the
compose Inspector step. Files: provider, its existing formal test, this plan and
the execution spec. First add a same-turn invalid-plan/corrected-plan regression
that checks capability availability, recoverability and no canonical writes.
Then fix only reply classification; retain failed-call status and diagnostics.
Run provider/scheduler/operation suites, types, naming and lint. No automatic
mutation replay, schema bypass, prompt expansion or altered quality criteria.
Self-review: this fixes a concrete protocol ambiguity exposed by live evidence;
it does not prove the model will always recover or certify illustration quality.

The regression failed on the original `available: false` reply. With the corrected
classification it passes: unsuccessful invocation remains explicit, the corrected
review call succeeds in the same turn, and no canonical batch runs. The full
server suite passes 451 tests (three opt-in skips), both App TypeScript projects,
naming, lint and formatting pass. The 204 selected repository-script cases also
pass. The next live acceptance run retains the same brief, model/effort and quality
assertion to exercise actual model recovery and rendering after this owner fix.

### Inspect iteration - canonical scope after regrouping

Attempt 6 exercises the recovery correction successfully: the model corrects its
initial invalid plan and continues drawing. Recording navigation runs four times
and retains the final document, screenshots and video. Native settlement is
770,010 ms with an unsupported outcome; this is not live acceptance. The actual
App screenshot and detail captures retain visible material/profile limitations.

It also reveals a concrete inspection-scope defect. After grouping the tower,
a later applied collar composition replaces `reviewTargetId`. The model ungroups
that temporary collar and reparents its surviving geometry into the tower. The
saved canonical document confirms the collar composition no longer exists and
its surviving child belongs to the tower group. Nevertheless, whole-tower
overview captures are rejected four times because their IDs differ from the
deleted `reviewTargetId`. The final two minutes include repeated evidence
requests that cannot satisfy this stale identity check.

Next owner: inspect, spec `#evidence-and-completion`, existing inspect Inspector
boundary and public Scene Tree contributors. Freeze discovery to the current
operation target transitions, their canonical action receipts, existing public
containment queries and inspection tests. First add a formal regression for
apply, group, add detail, ungroup/reparent detail, then inspect the whole design;
also retain rejection of unrelated-root or detail-only evidence. Resolve scope
from actual canonical containment and successful mutation coverage, not a new
type list, latest-created-ID heuristic or unverified caller assertion. Before
implementation, trace existing public API output and complete the exact scope
contract at these existing owners. No schema relaxation, synthetic screenshot,
automatic drawing retry or reference-specific fix is authorized by this slice.
Gates: scope regression, existing inspection/review/provider suites, canonical
manual/remote/Undo/load E2E, source-bound proof and affected build/type/lint checks.
Do not run another native drawing until this defect has a permanent failing test
and its owner correction passes these gates.

#### Inspect scope execution card

The provider's preferred automatic inspection target is not a completion scope.
The inspect owner retains request-owned scope IDs from initial context and
successful creation receipts. Successful group/ungroup receipts transform those
references; adding a detail must not replace the earlier scope. Canonical
containment is checked through the existing inspection validation action,
alongside its generation stamp, at assessment and completion. Its optional scope
query returns coverage/missing targets using public `getElementData` parent
relations, without screenshots, geometry serialization or model analysis.
Multiple current overview targets may jointly cover the requested scope.
Unrelated trees, native regions alone, deleted unresolved targets and mixed
generations cannot certify it. Plain stamp validation retains constant work;
coverage visits only requested ancestry paths and shares reads within that call.
No new retained geometry/image cache is introduced.

Allowed files are the existing inspect allowlist: local operation/review owners,
inspection action and validity common API, their formal tests and browser case,
plus this plan, execution spec and inspect flow contract. App validity/containment
owns facts; backend owns requested scope and completed inspection IDs; model
judgment still owns visual criteria. Caller-supplied IDs cannot replace backend
scope. Measurement must use a live inspected target rather than a retired group;
measurement freshness and whole-scope coverage remain separate requirements.
First prove the regrouping failure in the operation test, then prove canonical
coverage, missing/cyclic ancestry, unrelated roots and bounded shared reads at
the App owner before implementation. Preserve prior explicit-rendering, Undo,
remote/load and unrelated-edit invalidation cases. Stop if actual API/receipt
contracts cannot establish coverage; never accept an overview merely because
the caller labels it one. The revised contract needs source-bound admission
before advancing from red tests to its implementation.

Scope correction: the permanent operation regression reproduced the live
regrouping failure before implementation. The canonical owner now validates
ancestry with one read per visited ID per query. Coverage follows successful
group/ungroup and explicit removal receipts; unknown missing IDs still fail.
Measurements are associated with each inspected overview target and generation.
Formal coverage rejects unrelated roots, detail-only images, deleted IDs and
cycles. The real App's three browser cases pass, including regrouping and
manual/remote/Undo/Redo/load invalidation. The backend suite passes 455 cases
(three opt-in native cases skipped); focused App tests pass 21 cases. The
revised architecture contract was admitted as revision 8, and its updated
scope-aware verification oracle as revision 9. Source candidate
`8b4e7c5d-793a-4318-8038-133bc192f6eb` passes all seven cases; target
`4dd3ea08-b4b9-47e8-a71c-9f5c9e21c62e` retained a failed assessment against the
older oracle. Its successor uses the admitted oracle and passes all seven owner
works plus integration. Live drawing acceptance remains open; these results
prove bookkeeping and validity, not visual quality.

Live attempt 7 completed its native turn after 770,049 ms and honestly reported
an unsupported/partial result. Final acceptance failed; the recording and full
7,675-element document are retained under
`tmp/flow-inspector/live-upper-tiers-attempt-7`. The native evidence reports
50,293 ms observed tool/research time and 719,756 ms unattributed time; the latter
is not a measurement of model thinking. Earlier overview and region calls
returned real images and inspection IDs at canonical revision 15,367. After the
last move/ungroup/regroup sequence, captures of the successor root became
unavailable, and the final App screenshot lost most visible artwork. The last
review call used an empty inspection ID list. No scope-coverage rejection was
observed. A collaboration durability failure was also recorded, but causality
is not established.

Next bounded diagnosis remains the inspect integration case: reproduce moving a
detail group and regrouping through public App hierarchy APIs, then compare real
snapshot output before/after in the permanent inspection E2E file. Start with a
small deterministic case to distinguish general regrouping from the live
large-document conditions. Inspect the actual capture exception rather than
relying on the App's generic unavailable message. Do not spend another native
AI run to reproduce this. No Framework mutation is authorized by this diagnosis;
if the first incorrect owner lies outside the current boundary, resolve scope
before implementation.

The small regroup case and opt-in saved-document replay both preserve complete
snapshots. Retained before/after PNGs show the complete tower; fresh loading does
not reproduce the live failure. Continue the same inspect integration card in
`e2e/ai-inspection-evidence.spec.ts`: exercise overview/native-region extraction,
detach the last detail group, move it back into the drawing and regroup through
public APIs, with frame delivery between operations. Inputs remain the saved
project-local document and public hierarchy/capture APIs; output is real PNG
evidence plus the original thrown exception if capture fails. Compare final
whole-drawing pixels with the baseline. No fallback rendering, internal engine
access or production changes are allowed by this diagnostic. Focused E2E and
lint/naming are the gates; a failure outside the inspect owner stops production
repair until its boundary is resolved.

Replay evidence now narrows, but does not reproduce, attempt 7's loss of artwork:

- Overview/region extraction, moving the detail and regrouping preserve artwork.
- Inspecting individual subtrees before regrouping changes 150 of 388,096 pixels
  (maximum channel delta 20), with the full tower intact. Exact PNG identity was
  an over-strict diagnostic oracle for floating-point transform/antialias changes.
  The retained replay test now bounds both changed-pixel fraction (0.1%) and
  channel delta (32); this detects the reported disappearing bodies, and does
  not certify fine-detail quality or replace native-region review.
- Replaying the retained 2,304 fill edits after restoring their original gradients
  passes the same image checks. These edits were one original batch, not 2,304
  model round trips. The expanded opt-in replay needed its explicit 180-second
  guard (155,483 ms test work); the no-action replay retains 90 seconds and normal
  cases retain the default guard. Stage annotations identify which operation
  completed if a guard fires.
- The actual AI async transaction runner with immediate shared delivery, frame
  boundaries and fit zoom also preserves snapshots in both small and large cases.
  Adding the same final group rename also passes the small case; the retained
  large replay includes that operation for its next run.
- `inspection-fill-stages-report.json` and
  `inspection-transaction-zoom-report.json` retain evidence under the existing
  ignored task artifact directory. No production renderer fix has been made.

The default inspection E2E suite passes four cases with the saved-document case
explicitly opt-in. App type checks, scoped ESLint, naming and diff checks pass.
The diagnostic services on 3000/4201/4101 have been stopped. These are diagnostic
exclusions only: native visual acceptance, PR creation and exact-head CI remain
open.

Next hypothesis must cover incremental construction and intermediate reads, which
fresh document loading bypasses. Reuse the recorded prepared-design/action stream
through the existing App action/transaction route, preserving group-result ID
mapping and recording the first actual capture exception. This remains an inspect
integration test in its existing allowlist; no paid model run, product workaround
or Framework change is authorized by these passing partial replays. Do not repeat
the same saved-document experiment without a new operation/state distinction.

Stream replay uses a project-local transcript plus explicit captured group-result
aliases. The actual App runtime resolves its registered actions, permission and
transaction boundaries; a deterministic provider supplies the already-recorded
batches and remaps only generated result identities. It does not call the model.
The test observes the public capture method's original exception and rethrows it
unchanged, preserving App behavior. Compact batch milestones, browser errors,
final document and real screenshots identify the earliest divergent operation.
Inputs are the retained transcript and alias map, not new drawing instructions;
the five-minute test guard remains separate from the product's unrestricted
turn lifetime. Implementation stays in the existing inspection E2E file. No
passing replay substitutes for live model/visual acceptance.

The recorded stream now reproduces the native failure without a model call.
`inspection-stream-report-3.json` through `inspection-stream-report-8.json`
retain the failed runs (the sixth stops on diagnostic handle initialization,
not a product result). The final canonical group has positive dimensions and
five children, but its native content bounds are zero; each child independently
has positive native bounds. The public Canvas Pipeline Debugger shows that the
last group receives `children: []` and no child-attachment commands. Earlier
group/reorder operations project their hierarchy correctly. Projection first
goes missing when the basic `hierarchy.moveElements` action moves the new detail
group using default transaction-end delivery. Later immediate ungroup/regroup
operations encounter the stale projection.

The permanent case `inspection sees hierarchy edits before a long-running AI
transaction settles` reduces this to two rectangles: an outer async AI
transaction combines a default-delivery move with immediate group operations.
It fails with the same `Snapshot target has no finite visible bounds` exception
in `inspection-running-transaction-report.json` (12.9 seconds). The equivalent
case with separately settled operations passes. The runtime currently wraps the
whole provider invocation, including incremental batches, in one transaction;
the basic adapter preserves API defaults while high-level drawing actions
explicitly request immediate delivery. This difference explains why loading the
completed document or testing each operation in its own transaction missed the
failure. No renderer strategy exception was recorded.

Repair review must resolve publication and transaction ownership, not force a
redraw, reload the document, or weaken inspection acceptance. Determine whether
the App execution adapter can satisfy the existing contract, or the runtime
needs an explicitly admitted batch settlement boundary. Verify visibility and
read-after-write coherence, intended Undo/Redo commits, partial failure, Stop,
and ordered mixed actions. A necessary Framework mutation remains outside the
current frozen scope; user direction has been requested before that repair.
The inspect diagnostic segment may retain and validate its regression tests and
evidence while that decision is pending. All owned replay servers are stopped.

Read-only repair review confirms this is an explicit existing contract, not just
an accidental missing option: `framework/packages/ai-agent-runtime.md` describes
one invocation transaction; `local-ai-provider.md` calls intermediate receipts
provisional and retains one-request Undo. Runtime `multi-batch.test.ts` proves
commit-once and rollback of earlier batches on Stop. Factory separately promises
transaction-end buffering versus explicitly immediate delivery. Do not silently
change any of those contracts or append options to arbitrary API signatures.

The earlier proposed repair, superseded by the planning direction below, covered
three separate cases:

1. A completed execution stage becomes observable before the next model/tool
   decision; provider waiting does not hold an unnecessary mutation transaction.
2. A stage containing several dependent actions preserves ordered canonical and
   rendered reads, including mixed publication policies. Merely committing
   between batches does not prove this within-batch case.
3. Stop or failure keeps previously completed stages and rolls back only the
   appropriate unfinished work, with accurate receipts and intended Undo/Redo
   boundaries. Existing documented generic-runtime behavior must be explicitly
   accounted for when designing the App's stage policy.

Use the small failing E2E as the visual oracle, then the recorded action stream
and original live acceptance. Runtime transaction, multi-batch, failure and
lifecycle tests need corresponding real canonical-integration coverage; mocks
that only count runner calls cannot prove publication timing. This is a proposed
repair contract, not admitted implementation scope or a completion claim.

### Revised Framework planning direction - 2026-10-01

The user requested a Framework plan for explicit collection of independently
committed batches into one pending Undo group. The planning authority is
[Transaction History Groups](../../../framework/plans/transaction-history-group-plan.md).
PR #280 delivered and merged the reviewed Framework implementation after all
33 checks passed, including validate-only attempt 2 reusing attempt 1 evidence.
The App integration now consumes those APIs; whole-plan acceptance remains open.

Preserve complete-batch publication to prevent partial property values and
multi-selection MIX_VALUE oscillation. The group stays outside Undo/Redo until
AI finishes or stops; user transactions and remote apply continue independently
and are never collected by time window. Existing Undo/Redo must not cancel AI.
Object-level prompt-editing locks are a future feature, not a prerequisite or
an excuse to retain the request-wide interaction lock.

The Framework plan owns enrollment, pending history, interleaved replay semantics,
per-transaction durability, advisory memory warnings and same-batch publication
ordering. Implementation first requires the corresponding product/Transaction
Inspector contract and tests. Do not replace this with a global immediate-delivery
default, per-field notifications, ad-hoc history array concatenation, or a canvas
reload. The existing red E2E remains valid evidence; physical transaction
grouping and notification correctness require separate proofs.

Representative cases:

1. A detailed rendering of the top two major Taipei 101 tiers and spire from one
   brief, preserving recognizable silhouette and requested detail.
2. A deliberately simplified version of that subject, with no forced elaboration.
3. A rough or intentionally ugly original illustration; no compulsory beautifying.
4. A landing page with supplied dimensions, content and style using native layers.
5. A targeted existing-vector node/flip edit using registered low-level APIs.
6. Organize existing components without reconstructing unaffected artwork.
7. Follow-up adjustment, unsuitable reference recovery and invalid artifact input.
8. Stop, tool failure, clarification, Undo/Redo, remote edit and document replacement.

Deterministic fixtures prove ownership, work counts, output equivalence,
invalidation, progress preservation and protocol safety. Headless App tests prove
integration, shortcuts, visible progress and outcome presentation. Do not use a
mock model as evidence of Astra quality. Live review uses the original top-two-
tiers scope and a short one-shot brief, records the actual tool sequence and
video, and reports all attempts. Model generation is stochastic; no fixed
seconds SLA or element-count quality threshold is introduced.

Before the paid run, pass relevant server and App suites, TypeScript checks,
lint/naming and App build. Use existing declared commands, Headless Playwright,
owned servers, resource guards and screenshot inspection. Run the applicable
canonical batch/7076 milestone gate if the completed slice changes that path;
it validates canonical execution, not an AI speed comparison.

Whole-plan completion requires current source-bound Flow Inspector work,
handoff, target integration and accepted-behavior evidence; final bounded review;
all applicable local gates; and exact-head PR CI. Register the PR task context,
attach the PR to this conversation and leave merge to the user. Partial work
keeps this plan active. Closeout follows the existing workflow after review.

## Stop and replan conditions

- Unresolved Flow Inspector source/verification admission or missing proof mapping.
- A required canonical public API or dependency outside the authorized owner scope.
- Unproven inspection reuse, invalid lifecycle assumptions or unsafe mutation retry.
- Required third-party tool/service addition or model/effort change.
- Formal failures invalidate the reviewed design; re-review affected flow and
  connected cases before another implementation iteration.

Do not reduce quality, loosen acceptance, disable a failing gate or claim a
partial PR is completed implementation to bypass these conditions.

### Task 0 follow-up - work allocation boundary

Task 1 source candidate `ca9b56b7-aad1-4eb7-9f49-09979e0de521` passes
all seven baseline owner cases. The attempted separate entry/observation flows
were rejected because the existing proof contract requires nonempty incoming
handoffs; group the connected execution owner boundaries in one flow instead.
Typecheck passes after rebuilding the existing ai-agent-runtime declarations.

Admission inspection found a remaining package-only check in `validateAllocation`:
work scope derives `packages/<owner>/src/` instead of honoring the admitted
format-2 step boundary. This contradicts Task 0's App registration requirement.
Reopen only `manage-flow-target`; spec `CORE_PROOF.md#flow-targets-and-work-decomposition`.
Inputs: trusted admitted contract, explicit work scope and existing runtime files.
Output: retained work allocation, not execution/source authority. Conditions:
exact step boundary, complete obligation coverage and immutable history; no
candidate or allocation may bypass subsequent captured-source admission. Retain
the explicit format-1 historical scope contract. No new cache or runtime dispatch.
Allowed files: existing target owner, its permanent tests, exact Inspector and
current tool contract. First demonstrate App server work registration fails, then
admit format-2 runtime work inside the reviewed boundary; reject test files,
non-runtime paths, other owner boundaries and unknown scope versions. Run target
owner tests plus existing task/source admission tests before returning to Task 1.

Task 0 allocation follow-up validation: `flow-target.test.cjs` passes 44 cases,
including App server work, TSX work, retained reload, out-of-boundary files and
unknown source scope versions. `agent-contract` plus `workspace-sources` pass
10 cases; these retain actual workspace-owner/source restrictions at execution
admission. Inspector/catalog/workspace tests pass 27 cases. Naming passes 12.
Focused ESLint and App typecheck pass. Tool changes have the focused Node test
evidence above; the App source proof below is a separate validation boundary.
No remote CI or PR completion is claimed.

Task 1 baseline evidence: candidate `ef267257-de0f-4805-9dfa-13f95571ea8a`
passes all seven owner cases at source digest
`759ee1926935bdfc4fb98077320ddb88483cbebe8f8cf5f2ab3f5d8ce17a102c`.
Negative candidate `cc8491ee-1e38-42f5-b25c-e46b3cf029fe` fails only
`compose.registered-tools` (six unaffected cases pass, no infrastructure issues).
Contract review `f12b38956b45bddbd9fafbb2265144750b8016de064eade90b675670ee436c35`
is locally accepted with no blockers, retaining the seven connected baseline
owner obligations. These prove existing owner boundaries, not new optimization,
real model decisions, whole-target integration or visual quality. The development
target/work allocation and improvement regression obligations remain to be
registered before production improvement slices. App remains gpt-6-astra/medium;
no live model call, recording, push or PR was started in this segment.

### Task 2 execution card - observe transport and lifecycle

The supported target owner registered `f48b70d2-85af-4f94-956a-468999d2a555`,
allocation revision 1; `observe` work is
`e9a3cbbf-c6ad-478f-8b9d-3f72898a79d0`. All seven works remain pending.
The initial script used a nonexistent `flow.cases` convenience field; corrected
to the admitted contract's `cases` inventory before any target write.

Re-read `observe`, its receipt inputs, and spec `#ownership-and-diagnostics`.
Inputs: actual serialized outgoing protocol, received byte chunks, registered
native definitions, and known RPC lifecycle. Outputs: numeric byte counters and
bounded start/completion/failure spans. Preserve existing usage fields, model,
transport contents and all execution behavior. Existing usage/provider owners
only; no raw prompt, generated code, credentials, image or private reasoning in
new diagnostics. The wire string is serialized once; counting must not serialize
the document again. No cache. Failure owner `observe`; tests are the shared
execution proof and existing provider usage suite. First strengthen the actual
provider transport probe to fail for missing byte/lifecycle/catalog evidence.
Then implement numeric counters and trace integration inside the already reviewed
owner boundary. Gate: focused proof, full provider suite, typecheck/lint; reject
any accounting shortcut that changes execution or assumes unobserved model time.

Observe slice validation: the strengthened transport proof failed for missing
transport counters before production edits. The seven proof cases and 78 provider
tests now pass (85 total), as do App typecheck and naming (12 cases). Focused
ESLint has no errors and retains the two existing console warnings. Review finds
no change to serialized requests, tool dispatch, final outputs or timing unions.
The recorded bytes are UTF-8 wire bytes, not tokens or inferred reasoning time.

### Task 3 execution card - compose configuration and discovery

Owner `compose`; spec `#capability-discovery-and-composition`, Inspector step
`compose` and its request-context/tool-program route. Inputs are registered
schemas, request context and the native protocol. Output is an executable tool
program using the configured model and medium effort. Simple edits bypass
research/preparation; all tools retain their existing App identities and owners.
Native discovery and Code Mode are allowed; App evaluation of generated code and
subject classifiers are forbidden. No cache or canonical writes in this slice.
Failure owner is compose. Allowed implementation/test files: local-ai-provider.ts,
local-ai-provider.test.ts and execution-flow-proof.test.ts. Stop if the installed
native protocol cannot preserve the complete catalog and dispatch identities.

First enforce the existing medium contract: inspection found no explicit effort
on thread/start or turn/start, allowing personal configuration to select effort.
Use native `model_reasoning_effort`, `reasoningEffort` and `effort` wire fields;
they are external protocol identities, not new App registries or saved document
fields. Prove missing request effort and mismatched acknowledgement with formal
transport tests first. Gate this correction with the complete provider/proof
suite, App typecheck and naming before extending discovery. Native deferred
functions require a namespace in the installed protocol; verify that handshake
before enabling deferred schemas. A local configuration probe does not prove
model tool discovery or rendered quality.

Native namespace ownership follows the five existing tool factories rather than
an action-name whitelist. Namespace names are ephemeral native wire identities;
App actions, tool names, receipts and saved documents retain their identities.
`image_analysis`, `design_references`, `design_preparation`, `design_workflow`
and `design_operations` qualify those owners. The binding map is built once per
request from the same factory outputs as registration; it is not a derived
geometry cache. Wrong namespace calls must fail before dispatch. The permanent
proof mutation follows the registration expression and still removes the entire
catalog, preserving its original negative behavior rather than accepting fewer
capabilities.

Compose slice evidence: the medium and namespace regressions failed before the
corresponding implementation (four cases each). The complete provider, source
proof, configured-provider and readiness suites pass 103 cases; the two opt-in
native probes each passed separately. One is registration without inference;
the other used real gpt-6-astra/medium to discover and call the deferred vector
API description through native Code Mode, with no canvas execution. It is a
protocol smoke test, not the final visual acceptance run or a speed benchmark.
The test transport was updated to emit the namespace on both call and completion,
matching the installed native schema; incorrect namespaces remain rejection cases.
App typecheck, focused ESLint, naming (12) and Inspector structure (2) pass.

Captured candidate `f70b10a0-f363-4b75-987c-47bf39fe649a` passes seven cases
at source digest `41a7f278c528c521749a5387ea2ebdfe2723659a8d3ec758121969b8b8cc0034`.
Negative `aca8dd20-caad-42fe-b40c-d9eabf5e3bab` fails only
`compose.registered-tools`; six other cases pass with no infrastructure issues.
Review `150ffedc8b0ad5e4db44f178b51b8391e9e976dc1d83fef613c7a8974a04e36d`
is locally accepted. The original target's immutable verification pin remains
historical; do not present its pending works as completed or silently rewrite
that pin. Whole-target integration must bind the final admitted contract after
the remaining owner slices. No PR or remote CI completion is claimed.

### Task 3 execution card - apply semantic tool access

Re-read `apply`, its tool-program/prepared-artifact inputs and execution-receipt
output, plus spec `#preparation-and-execution`. Inspection confirms the provider
has a two-name concurrency whitelist; the scheduler accepts only a boolean.
The existing image owner retains bounded CPU analysis internally; preparation
creates a new frozen artifact with a unique identity synchronously, and API
description reads the immutable registered catalog. These may share admission.
Canonical queries also update context/review state and are not admitted as
independent merely because an underlying basic API says read. Release, import,
combined workflows, writes and unknown operations remain ordered barriers.

Allowed contributors are the existing tool factories, provider dispatch adapter
and scheduler; no second executor, transaction manager, renderer or geometry
cache. Add the factories/adapter and their permanent regression files to the
apply implementation boundary because that is where semantic access is declared
and consumed. Names `LocalToolAccess` and `executionAccess` belong to the local
scheduler contract; they are internal, not saved or native-wire identities.
Consume each declaration from the registered definition map built once per
request. Conditions: preserve all input validation, native namespace dispatch,
read-after-write order, recoverable-failure progress and cancellation. Failure
owner apply; no bypass beyond independent admission.

Tests first: prove independent preparation and catalog lookup overlap through
the actual provider without invoking canvas execution; ordered writes/releases
and subsequent reads wait, absent access is exclusive, recoverable rejection
does not poison the queue, and Stop prevents queued work. Use controlled promise
barriers and actual call counts, not elapsed-time thresholds. Gates: scheduler,
provider, preparation/image/workflow/operation suites, typecheck, naming and lint.
Stop if an alleged independent operation modifies a pre-existing shared input.

Apply slice evidence: 175 tests pass with two native opt-in probes skipped;
App typecheck, focused lint, naming and Inspector structure pass. The combined
prepare/apply owner explicitly overrides preparation's independent access.
The captured candidate `bde33b2f-80ff-4eb7-b610-4c6dda146ec4` passes all seven
cases; negative `da4e01af-1655-43e6-9cfc-c8dd23f31704` fails only
`apply.composition`, with six passes and no infrastructure issues. Contract
review `98137a9c3b44ba8788e32ac245fc4d7a8effc864c2a61394edcca4c7354e5098`
is locally accepted. This proves scheduling semantics, not final product quality.

### Verification integration slice

Register the new execution proof in the existing App server response harness and
include the touched scheduler/workflow/proof tests in the server TypeScript gate.
This changes verification entrypoints only, not Inspector owner semantics or
runtime boundaries. Scope: App package.json, tsconfig.ai-server.json and type
corrections in those tests. Existing source-proof configuration remains isolated.
Required gates: server typecheck, focused proof/workflow/scheduler suites and lint.
Stop on errors outside these tests rather than broadening into unrelated cleanup.

Verification integration passes: all 17 proof/workflow/scheduler tests, server
TypeScript and focused ESLint. The newly included tests exposed unknown argument
accesses and catalog schema typing; corrections stay in the fixtures. The server
type library now includes ES2023.Array for the existing conversation presentation
`findLast` dependency reached by the proof; runtime target stays ES2022 and no
runtime/tool version changed. The proof is now part of the normal server harness
and therefore App local/CI entrypoints, not only the captured-source runner.

### Task 4 execution card - current canonical inspection evidence

Owner `inspect`, spec `#evidence-and-completion`: consume public Scene Tree/Props
and document/Undo/Redo notifications at the App, bind snapshots to a runtime
session and monotonic generation, reject changes during capture, and validate
those stamps before model assessment and final reporting. The evidence owner
retains no geometry, images or computed cache; a stamp comparison is constant
work and cannot certify visual quality. Runtime owns observation disposal.
Registered read-only `validate_inspection_evidence` uses the ordinary action and
permission route; no new transport channel or direct canonical mutation. Backend
review tracks the exact stamps returned by App inspection, never a model-supplied
revision or receipt success. Missing observations/evidence fail closed. The
validation call returns a compact boolean without a render, scan or context
reconstruction by the evidence owner. Existing transport context remains intact.

Boundary adds the direct App evidence API, action registry/runtime wiring,
provider finalization caller and permanent tests to the existing inspect step.
Names belong to App inspection, remain ephemeral and do not change saved files.
Tests first: externally changed evidence cannot pass visual review; missing
validation cannot claim freshness; mixed-state capture is rejected; unchanged
validation performs no new capture or document reads; disposal/replacement
retires stamps. Gates: inspection/runtime tests, backend review/operation/provider
suites, server and App typecheck, naming/lint. No target cache, event-time drawing,
new transaction path, model-effort change or automatic quality simplification.
Stop on unavailable canonical change observation or an unowned runtime lifetime.

Canonical-evidence slice validation: the original backend accepted an assessment
after the App reported an external change; the formal regression failed before
the fix. A separate regression caught mixing a successful earlier measurement
with a newer capture. The corrected owner remeasures that mismatch once, retains
unchanged measurement validity and does not immediately repeat a failed check.
153 backend/proof/stage/workflow tests and 25 App inspection/lifetime/startup
tests pass; two opt-in native probes were not rerun in this slice. App and server
TypeScript, focused lint, naming (12) and Inspector structure (2) pass. The runtime
construction test verifies shared ownership and disposal; public channel/load
adapter tests verify invalidation, and mixed-generation capture is rejected.
The new evidence test is registered in the normal App AI harness.

Source candidate `801bae7c-8e67-4e70-9011-e97597b12f0c` passes all seven cases
at digest `3b5a62c393505cd19ce196286b0c5acb1942ae87a1e9adc749fd8c6d8d4d032f`.
Negative `8a67b8eb-9037-4242-9cc9-874aa15ddc2d` fails only
`inspect.current-evidence`, six pass, no infrastructure issues. Contract review
`ca8f988eff86a4594120762530397d6e3bb4d585cb32b99761ba7964f65af649` is locally
accepted. This is an inspect owner slice, not whole-plan or live visual completion.
Remaining integration includes actual manual/remote/Undo/document lifecycle,
representative product cases, final full gates, headless live acceptance and PR CI.
No target-local cache or field-specific invalidation is claimed: unknown canonical
changes conservatively retire all evidence, while selection/viewport are outside
the observed canonical channels. The existing semantic stage/deferred-inspection
route is retained for further integrated verification.

### Task 5 prerequisite - finite mutation admission - 2026-10-02

Owner step: Transaction `finalize-transaction-state`; product clauses: Framework
history-group plan `API contract`, Factory `Transaction history groups` and
Transaction spec `Undo`. Existing start/update/end reject an unrelated active
transaction; user drag deliberately keeps one open across input callbacks.
The App must observe readiness instead of enrolling in the user's transaction
or retaining its old request-wide document lock.

Inputs: the injected Factory's canonical boundary state only. Output: a
synchronous `isTransactionBoundaryIdle()` snapshot, owned by Factory and exposed
by Core's existing history facade. It is not a reservation; a caller must check
and enter synchronously, or check again after an await. Open pending history
alone is idle. Active/nested transactions, replay, settlement and group member
or observer callbacks are busy. Shared-evidence mutation restrictions continue
to throw independently; the snapshot cannot grant mutation authority.
Existing transaction status subscriptions allow an App wait to retry after the
settlement stack unwinds. App cancellation/lifetime owns cancellation of waiting.
No polling, frame wait, ambient group, new scheduler, or conflict engine.

Allowed contributors: Factory canonical lifecycle, existing Core instance facade.
Implementation boundary: existing Transaction step Factory source/tests and Core
history facade/tests, matching package/spec docs and existing Inspector source.
Direct AI catalogue disposition is metadata identifying this as host lifecycle,
not a model action. Failure owner: `finalize-transaction-state`; cache: none.
Names are new non-persisted public lifecycle API, no data migration.

Gates: baseline naming passed; formal Factory/Core tests first for idle, nested
user transactions, group member and observer state, settlement, instance
isolation, unchanged history and pending-group interleaving. Then focused suites,
build/typecheck, naming, formatting and Transaction Inspector contract. Stop if
an owner snapshot cannot support correct finite admission; resolve that contract
before touching App writes. App apply/settle cards follow this prerequisite.

Prerequisite verification: after rebuilding rebased dependencies, the two new
Factory tests failed on the missing public API while all 21 existing history
cases passed. Implementation passes 285 Factory tests, 256 Core tests, 17
Transaction Inspector contracts, dependency builds and naming. The query reuses
the existing admission predicate, adds no retained state, and changes no history.

### Task 5 - invocation mutation scope transport

Owner: Runtime `run-plan-transaction`; connected routes: `execute-app-actions`
and `settle-plan-transaction`. Product: Runtime supported behavior and failure
contract; App preparation/execution. One invocation still calls its runner once.
The runner may provide a request-local synchronous-mutation executor; Runtime
forwards it with the signal to registered actions. Atomic hosts retain their
existing callback/rollback contract. Design will supply finite members of one
Framework history group. No shared ambient executor or runtime-owned journal.

Inputs: host runner, invocation signal, registered action callback. Output:
request-local execution scope. Queued work must respect cancellation; asynchronous
preparation is outside mutation callbacks. A runner may report an explicit
settlement status with the original callback cause; the outcome owner consumes
that report and never infers retained writes solely from successful action receipts.

Implementation boundary for this transport segment: runtime/types/index and
transaction tests, existing Runtime Inspector and current package/spec docs.
Failure owner is `settle-plan-transaction`; no cache. Public names
`AiMutationExecutor`, `runAiMutation`, `AiTransactionSettlementError` describe
host execution/settlement and are not persisted. Gates: transaction boundary
forwarding and atomic preservation tests, runtime suite/type build, naming and
Inspector contracts. Action forwarding and outcome semantics get separate
owner cards before their implementation. Stop on shared invocation state,
mutation replay, or any async canonical member requirement.

Transport verification: new signal/scope forwarding test failed on the existing
runner wrapper, then all five transaction tests passed after forwarding. Naming
passed. Existing atomic callbacks remain supported without a mutation executor.

### Task 5 - registered action scope forwarding

Owner: Runtime `execute-app-actions`; input is the prior host execution scope,
validated action arguments and signal. Output is ordered action receipts or the
original executor failure. Scope stays local to `runInvocation`, including
concurrent invocations; no global capture or journal. `runAiMutation` checks
abort before calling the supplied host boundary, or the existing atomic scope
when no boundary is supplied. App member callbacks must be synchronous.
Boundary: Runtime types/runtime/index and execution/multi-batch tests; direct
registered App action consumers will be integrated after this transport gate.
Failure owner remains settlement; no cache. Tests prove exact scope forwarding,
pre-abort prevents mutation, ordinary atomic execution and concurrent isolation.
No change to provider retries, permission, argument identity or redaction.

Execution forwarding: new executor-context oracle failed before implementation;
the runtime suite passes after exact per-invocation forwarding. Concurrent
multi-batch coverage checks the active host scope at each actual write.

### Task 5 - explicit grouped settlement evidence

Owner: `settle-plan-transaction`, connected App `settle` route. Inputs: host-owned
settlement outcome and original callback failure. Output: committed/rolled-back/
unknown evidence without mutation retry. Atomic default remains complete rollback;
grouped failure or Stop can retain completed members even when the current action
has no receipt. A distinct unclassified runner failure remains unknown. Scope is
Runtime runtime/index, multi-batch/transaction tests and matching current contracts;
App transaction/presentation consumers follow after the runtime gate. No journal,
extra rollback, message heuristics, counts-as-proof or provider retry is added.
Gates: retained cancellation and original failure classification, unchanged atomic
rollback, unknown settlement failure, full runtime tests/type build. Failure owner
is the existing settlement step. Stop if source failure and settlement outcome
cannot be reported independently.

Runtime settlement gate: both retained Stop/failure oracles failed as unknown
before implementation; all 97 runtime tests and package build now pass. Unknown
host settlement still reports unknown; original executor failure remains at its
execution stage. The runtime retains no canonical state or journals.

### Task 5 - Design finite history-group adapter

Owner: Runtime `run-plan-transaction` with Factory settlement handoff; App `apply`.
Inputs: invocation signal, synchronous mutation callbacks, existing public Core
history/status APIs and App history correlation. Outputs: independently published
members, one sealed Undo entry and truthful settlement evidence. Open lazily on
first write. Admit only at idle; an event-driven retry rechecks after settlement
unwinds, without frame/timer polling. Cancel queued mutation work, but seal prior
members even after request cancellation. No request-wide interaction lock.
A nonempty seal alone may correlate its new action identity; unrelated user
commits during read-only work are never labelled as AI edits.

Boundary: App transaction adapter, common transaction APIs, permanent transaction
tests and corresponding existing Inspector contracts. Canonical operations remain
Factory-owned. Gates use the real Factory for interim user transactions/Undo,
multiple AI members, original failed-member rollback, retained Stop, no-op history,
queued cancellation, concurrent scopes, and unknown seal failure. Do not proceed
to action integration until these pass. No new scheduling owner, stale snapshot
admission, async member, captured remote/user edit, or replaced document write.

Design adapter gate: six real-Factory cases failed with the old request lock and
missing member scope; all pass after lazy grouping and settlement-based admission.
Only successfully sealed nonempty groups may correlate history. No model calls,
paint timers or data projection changes were added to the adapter.

### Task 5 - register every canonical action write as a member

Owner: `execute-app-actions`, App `apply`. Inputs: validated action arguments,
request-local mutation executor and existing canonical common APIs. Outputs:
ordered synchronous members and unchanged detached receipts. Read and viewport
catalogue effects remain read/view operations; write, delete and selection effects
use the host boundary. High-level prepared drawing/design, geometry/style,
organization, arrangement and targeted-edit actions enroll their existing finite
write slices. Preparation and cooperative host/paint yields remain outside.
Revalidate prepared design target existence/lock inside admission after any wait.

Boundary: App actions/basic-api-actions/design-actions/design-edit-action/
organization-action/arrangement-action and their existing formal tests, plus
current Inspector and product docs. Failure owner is settlement, cache none.
Gates: every catalogue effect dispatch, high-level mutation scope and yielded
preparation, existing action semantics/cancellation suites; then actual browser
progress/Undo/interleaving replay. No new geometry, batching limits, simplified
artwork, hardcoded API names or changed provider settings.

Action integration: six new scope oracles failed before production edits; all 79
registered/high-level action tests pass after enrollment. Existing semantic effect
metadata selects mutation admission, with no method-name allowlist.

### Task 5 - outcome presentation and interaction regression

Owner: App `settle`; connected Runtime `settle-plan-transaction`. Inputs: canonical
host settlement status, retained receipts and original failure. Outputs: Stop
explicitly says successful changes were kept; unknown final state asks for review
without claiming a failed rollback. Grouped execution lets its runner classify
failures even under preserve-progress policy; zero successful members must not
be claimed as committed progress. Atomic preserve-progress behavior is unchanged.
Boundary: Runtime settlement tests/runtime; App presentation/tests and existing
document-interaction integration oracle (new expectation: ordinary input remains
live during AI waits). No new UI layout, outcome heuristic, replay or locking.
Gates: failure with zero members, partial Stop, unknown settlement, existing
presentation/interaction suite and complete AI unit tests. Follow with canonical
browser evidence before claiming product completion.

### Task 5 - canonical browser integration checkpoint

Owner: App `apply` to `inspect` and `settle` integration. Product cases: visible
complete members before request completion; manual input and Undo between members;
Stop retains one final AI Undo entry and Redo; inspection after hierarchy changes.
Reuse the existing streamed protocol fixture and original browser replay. Update
only tests whose old outer-transaction assumption contradicts the admitted group
contract. No mock transport is presented as Astra quality evidence.

Boundary: existing ai-conversation-flow and ai-inspection-evidence E2Es, existing
App runtime-integration oracle and corresponding Inspector contracts. Gates:
focused streamed-history test, prior hierarchy red proof, ordinary conversation
and inspection cases; actual screenshot inspection. Servers are test-owned and
headless, using the existing .env. Framework/Runtime/action local gates have
passed; full AI suite first exposed three obsolete outer-wrapper assertions,
updated to finite members plus no history during denied confirmation (four
runtime-integration cases now pass). Typecheck passes. Live model acceptance is
still pending; no final PR or whole-plan completion claimed.

### Task 5 - preserve failure explanation after finite settlement

Owner: `settle`, product outcome explanation. The browser regression proves a
missing replacement target is now correctly failed (zero successful members),
but the rolled-back branch hides the existing sanitized action cause. Preserve
that cause under the same execution-stage/code/length checks already used for
partial outcomes; no raw errors or inferred transaction status. Boundary:
presentation and its formal tests; existing revision E2Es remain the oracle.
Test the rolled-back explanation first, then both viewport cases. API catalogue
closure separately classifies the five new transaction host methods at the
existing disposition owner, using the unchanged exhaustive contract test; they
must not be exposed as model lifecycle actions. No new action or API is added.

### Task 5 - native review schema diagnosis

The first post-integration live attempt ended after 34 seconds without canvas
writes: the model claimed that required review/scale fields were absent. The
registered review definition has those fields alongside phase-specific `oneOf`
requirements. This evidence does not yet distinguish discovery schema projection
from model misuse. Stop the recording and isolate `compose` to `inspect` schema
transport in the existing opt-in real-native protocol suite. Capture only actual
tool arguments/identities, require a complete plan call and no canvas mutation,
and preserve exact App gpt-6-astra/medium settings. Boundary: the existing provider
protocol test and, only if its red proof confirms a defect, the registered schema
owner/transport and corresponding regression. No invented CAD/quality restriction,
weakened visual criteria or test-only product route. Resume full live acceptance
only after the original missing-field condition is explained and verified.

Native schema evidence: the focused real-provider probe reproduced an actual
`record_design_review` call containing only `{phase:"plan"}` despite an explicit
complete input. Its top-level shared properties were lost by the native
alternative projection. Each review `oneOf` alternative now declares complete
properties and required phase fields from one shared property definition. The
same Astra probe passes with all plan fields; 57 review/operation cases retain
phase validation. A permanent offline alternative-validation oracle also checks
invalid field types, while the opt-in native case verifies real discovery.
The failed full-run recording is retained at
`tmp/pr280-integration/live-upper-tiers`; it is not acceptance evidence.

### Task 5 - bounded iteration after large-receipt live failure

The second live run reached the 15-minute recording guard, not an App deadline.
It completed the two main glazed modules and correctly kept visual acceptance
false while crown details remained missing. Its canonical work is retained.
Evidence shows a 7,168-action vector read returned 6.6 MB, a 21,046-action node
update returned 8.7 MB, and prepared application returned a 2 MB identity map.
Total native transport was 29 MB outbound / 47 MB inbound; accumulated input
usage was 3.24 million tokens. These counts do not establish private reasoning
or explain every unobserved second. The unresolved boundary is returning full
repetitive mutation receipts to native orchestration despite already-owned IDs.

Revised next slice: existing `apply` operation adapter and `prepare` identity
owner. Default prepared application to its existing compact response, retaining
explicit full response and the existing artifact target resolver. For compound
operations, compact only successful basic mutation acknowledgements with no
returned data; retain query values, newly returned IDs, findings, no-change and
unknown outcomes. Offer explicit full receipts. Canonical receipt consumption,
review scope, mutation admission, geometry and Undo stay unchanged. Keep large
query values inside native Code Mode and return the information needed for the
next decision; the App never evaluates generated code or truncates query data.

Boundary: local-operation-tools, local-design-tools, provider composition guidance,
their existing formal tests, current execution spec/Inspector and generated
consumer. Tests first: many acknowledgement-only mutations produce bounded
counts; actual values and uncertain results survive; explicit full retains all
receipts; default compact application still resolves every target identity.
Then existing provider/operation/design suites, source proof, type/lint, template
parity and clean consumer. Reuse the unchanged live brief only after these pass.
Do not adjust drawing quality, model/effort, recording guard or success oracle.
Self-review: this changes transport representation at its current owner, not
canonical data, and stays within the admitted compact execution objective.

Compact-transport slice: both new oracles failed on the prior behavior, then all
68 operation/design cases and the 174-case affected server suite passed (three
explicit native probes skipped). Five thousand valueless acknowledgements become
one count while query values, returned IDs and uncertain results remain intact.
Server types, naming/lint, source obligations and current target assessment pass.
Generated template parity and its six-phase clean consumer pass; Framework's
19-package packed consumer and release records pass. The third live recording
uses the unchanged brief and guards; it remains pending product acceptance.


### Task 5 - recording guard calibration after continued refinement

The third run also reached the 15-minute harness guard while performing visible
local refinements, with no terminal App failure. One malformed edit was rejected
and corrected. Full source resolution, content and successful mutations survived.
The latest overview and native detail show corrected glazing, ruyi relief and
spire collars; the model still identified a corner ornament and ring shading to
finish. This does not meet the complete-run oracle, and is not a speed benchmark.

The previous instruction not to adjust the recording guard is superseded for
this single opt-in scenario: retain a finite 30-minute drawing guard and a
separate one-minute teardown reserve. Other scenarios retain their original
guards. Existing standing authorization covers formal test execution; there is
no user-set 15-minute product deadline. This adjusts the test's observation
window, not App quotas, drawing quality, model settings, or the success oracle.
Boundary: existing local-provider E2E, its generated copy and this plan. Run its
lint/types and retain all previous production gates. Capture one complete native
run before PR delivery; do not count interrupted output as success.


Final direct-consumer review found the new repository source-proof manifest and
runner copied into the standalone template. Their paths require the monorepo
Inspector owner. A generated-artifact regression fails before fixing the existing
release exclusion list; exclude only that manifest, config and proof test while
retaining all product server/runtime files. This is template packaging inside
Task 5, not a change to Inspector execution semantics. Verify regeneration,
artifact regression and clean consumer before delivery.

### Task 5 - deterministic replay of the fourth live interruption

The fourth live run settled partially after roughly 6 minutes 40 seconds, below
its recording guard. The last requested operation moves an existing root into
another container using `targetIndex: 10000`. Diagnose this exact recorded batch
before another paid generation. The recorded-operation replay initially stopped
at an earlier confirmation because its broker had no active turn; it now begins
a test-owned turn and approves only operations inside that isolated replay.
This is a correction to the replay oracle, not product approval behavior.

Step: apply / integrated acceptance. Inputs are the retained batch stream and
canonical API results; output is the actual rejected owner operation. Boundary:
existing replay E2E and this plan. No geometry, model, runtime failure policy or
success oracle changes. Reuse its failing replay to identify the canonical cause;
then define the smallest correction and formal regression before implementation.

Replay confirmed the canonical rejection: `targetIndex` was outside the final
insertion range. The public API correctly refuses it before changing hierarchy.
The AI contract omitted both its nonnegative lower bound and the dynamic range /
append semantics. Next bounded slice: the existing basic hierarchy API schema
and its contract test. Discovery must explain reading target children and using
the count excluding moved IDs for append; do not clamp, guess a large index, or
change the canonical API. The new static-admission regression is red before the
schema correction. This prevents invalid negative admission and communicates the
existing dynamic constraint; it does not claim arbitrary execution errors are
recoverable. Unknown mutation failures retain their existing stop semantics.

The corrected-parameter replay passes with the same drawing actions and the
canonical target child count (148). This isolates invalid tool input from a
rendering failure; it is not a replacement for native one-shot acceptance.
The corrected contract passes 52 contract/operation tests, App/server types and
focused lint. A fifth native recording uses the original brief and unchanged
model, quality oracle and 30-minute observation guard.

### Task 5 - successful native acceptance, 2026-10-02

The fifth post-integration run completed the unchanged one-shot brief with
`gpt-6-astra` / `medium`, in 674.4 seconds of provider wall time. The recording
covers App opening, Send, incremental editable drawing, fitting and ten seconds
after completion. Two pre-execution malformed requests were corrected in the
same invocation. The final saved document contains 8,611 entities including
containers/workspace. The actual App view and native ornament/crown crops were
inspected: the two main modules, crown, spire, glazing and relief are visible.
This is a complete execution, not a claim of exact surveyed dimensions or a
performance benchmark; local dimensions remain estimated and visual preference
belongs to user review.

Evidence: `tmp/pr280-integration/live-upper-tiers-5`, with `completed-app.png`,
`document.json`, `action-batch.ndjson`, `execution-evidence.json`, native inspection
PNGs and the recorded WebM. Owned document/collaboration/Vite servers terminated.
Transport accounting is 9.55 MB sent / 22.44 MB received; observed tool/research
spans cover 23.3 seconds and 651.1 seconds remain unattributed. Do not label that
entire remainder as model reasoning or compare independent runs as a speed test.

All seven current source obligations and their integration assessment pass with
current eligible evidence. Final changed-code lint covers 130 files; naming,
App/server types, generated parity and template artifact regressions pass.
Earlier unchanged Framework, Runtime, browser, 7076, build and release-consumer
milestones remain applicable. Implementation is ready for the authorized PR;
remote exact-head CI and user review are the remaining delivery steps.

### PR #281 - integration gate correction

CI exposed stale direct-consumer artifacts omitted from the local gate set:
public package/source reference digests after Core/Factory contract changes,
the release-template test's exact exclusion list, and the board regression's
hardcoded six-check expectation after Framework history groups added three
canonical proof cases. The existing formal checks detect all three failures.
Bounded correction: regenerate public docs through the official owner, synchronize
the exclusion oracle, and derive full-board check totals from the admitted
contract. No runtime or drawing behavior changes. Run the affected docs/release
suites, real board case, generated-source lint and website/artifact build before
pushing the correction; retain the successful native drawing evidence.

The synchronized documentation/release suite passes 59 tests. The board's full
baseline count now follows the admitted case inventory, and its failure summary
matches actual failures while still requiring the declared negative cases and
explicit cancellation-flow navigation. Its real browser case passes. All three
production Apps build (22 tasks), and their artifact browser checks pass.

The collaboration integration consumer also retained the old single physical
transaction publication oracle. CI formally reports nine `action` publications
followed by `undo` and `redo`. This agrees with the accepted `apply` contract
(Preparation and execution): each prepared member publishes, while the request
seals one history entry. Bounded test-only correction consumes the existing
prepared artifact, derives member count from group plus slices, verifies ordered
minimal publications and one history increment, and retains complete Undo/Redo
and two-actor convergence checks. Runtime, fixtures, batching and source owner
boundaries remain unchanged. Gate: both 16-item browser cases and focused lint;
a semantic discrepancy would stop this oracle-only correction.

Both 16-item real-browser collaboration cases pass (45.5 seconds), including
per-member publication, one Undo entry and ordinary two-actor convergence.
Focused lint, naming and diff checks pass. These CI corrections preserve the
verified runtime and native drawing; exact updated-head CI remains pending.
