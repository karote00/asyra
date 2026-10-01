# Plan: AI Design Execution Flow

## Status and task association

Created: 2026-10-01. Status: Task 0 local verification complete; Task 1 design review in progress;
AI production implementation has not started. Closeout owner: the coordinating agent in the originating AI panel
conversation, with product acceptance by Asa.

Base: `origin/main` at `c93176e1b14d58281664247071cfcd3552f7e0dc`.
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
