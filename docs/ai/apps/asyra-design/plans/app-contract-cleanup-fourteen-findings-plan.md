# Plan: App Contract Cleanup - Fourteen Findings

## Task boundary

Status: Implementation and scoped evidence recorded for the fourteen findings.
The subsequent Pen consumer regression and related review follow-ups are resolved
under [App review - five handoff fixes](app-review-five-handoff-fixes-plan.md).
The earlier owner-level passes alone do not establish complete Pen handoff or
App-wide acceptance.

This independent plan contains only findings 1–14 from the November 15, 2026
Asyra Design App review. Their numbers below retain the review's meaning.
It does not inherit unfinished work or validation requirements from another plan.

Working checkout: `.worktrees/ai-conversation-improvements`, branch
`codex/ai-conversation-improvements`. The review baseline is HEAD
`bd5fcee28cdb9ad58659071b3899016d85505796` plus its existing uncommitted changes;
the commit alone is not the reviewed source. Preserve those changes.

Objective: resolve the conflicting current requirements first, then remove the
superseded implementations, entry points and test expectations for these fourteen
findings. Each affected producer and consumer must use the same current contract.
Do not retain old aliases, missing-field defaults, dual execution paths or
permissive fixtures to preserve replaced behavior.

Authorized changes are the named App owners, their direct consumers and permanent
tests, and their current specification/API/architecture/Inspector documentation.
Finding 4 may change the existing Preset vector-selection projection owner;
finding 13 includes its directly connected repository script and CI configuration.
These exceptions do not authorize broader Framework, verifier or CI rewrites.

Discovery is frozen to the fourteen findings: trace their current callers,
exports, declarations, selectors, fixtures, documentation and test entry points.
After edits begin, deepen those traces only to establish an affected handoff or
regression. A different pre-existing issue is outside this plan, not item 15.

Excluded: 101 or other live-model runs, full local/App/conversation suites, new
features, renderer redesign, performance tuning, dependency/tool upgrades,
release/template work, and unrelated cleanup. The existing spec-owned Text Fill
load migration and immutable historical recordings are not cleanup targets.
No new compatibility layer or mandatory AI workflow is permitted.

## Fixed findings and intended outcomes

### 1. Stroke edits repair unrelated Vector transforms

Entry: `apps/asyra-design/src/common-apis/strokes.ts`,
`src/common-apis/element/vector-geometry.ts`, and the Stroke tests.

The current `getVectorBoundsRepairPatch` derives element geometry from stored
points while changing Stroke fields. Stored points remain unchanged after a
legal whole-element move/resize, so differing bounds do not prove corruption.
The existing positive test also supplies a point without its required `kind`.

Use valid canonical Vector data to prove the consequence before changing code.
Stroke-only changes must preserve element transforms, parent-relative placement,
topology and identity. Remove the unrelated repair and its supporting branches;
retain Stroke validation, ordinary render invalidation and transaction ownership.
Replace the malformed fixture without discarding its useful patch/Undo assertions.

### 2. Document generation is guessed at several boundaries

Entries: `src/collaboration/protocol.ts`, `websocket-provider.ts`, `lifecycle.ts`,
`publication-outbox.ts`, and `server/document-backend-store.ts`,
`document-backend.ts`, `document-persistence-client.ts`, `document-materializer.ts`.

Handshake, checkpoint and generation-bound recovery records must carry the current
nonnegative safe-integer generation. Remove optional legacy-peer admission,
generation inference from document contents and missing/invalid-to-zero defaults.
Keep zero as a valid explicit generation. Keep `null` only for the documented
pre-first-handshake outbox state; it is not a substitute for malformed input.

Invalid stored/transport identity must use the existing explicit failure path,
without replaying it as generation zero or silently deleting unreadable recovery
data. Preserve valid first-handshake binding and Reset generation invalidation.

### 3. Deprecated collaboration startup remains callable

Entry: `src/collaboration/lifecycle.ts` and its lifecycle tests/callers.

Remove `prepareCollaborationDocumentSession`, `startCollaboration` and helpers
used only by that replaced startup route. Keep the current
`createCollaborationDocumentSession` contract registered with Core. Core owns
prepare, load, activation, readiness and disposal ordering. Preserve necessary
resource cleanup through that owner rather than deleting cleanup by name.

Move the old tests' meaningful recovery, ordering and teardown assertions onto
the real Core registration path. Do not add aliases or call an old wrapper from
the new test fixture. Normal RenderApp already uses the new path; this finding
does not claim that it currently starts through the deprecated export.

### 4. Vector selection retains migration-era parallel writers

Entries: `src/init/derived-state/init-selection-compatibility.ts`, Pen selection
writes, `src/properties/vector-point.tsx`, their system-context/provider readers,
and the existing Preset vector-editing selection projection.

Selection channels own selected identities. One derived projection supplies the
current point/segment information needed by the panel and overlay. Remove the
migration bridge and independent mirror writes after connecting those consumers
to the canonical projection. Do not merely rename the bridge or move its duplicate
writes. Derived coordinates/handle information remain supported; they are not a
second independently writable selection source.

Reuse the existing Preset owner for reusable projection and keep App interaction
intent in App APIs. Preserve point, handle and segment selection, geometry-update
refresh, Undo/Redo and teardown. Prove update counts as well as output values.

### 5. Local-only startup eagerly imports collaboration through Reset

Entries: `src/toolbar/tool-button.tsx`, `reset-stored-document.ts`, RenderApp,
and `src/init/__tests__/collaboration-production-bundle.test.mjs`.

The toolbar's static Reset dependency puts collaboration lifecycle code into the
main entry even when RenderApp chooses local-only startup. Remove that eager
dependency from ordinary startup; keep the permanently available Reset control
and its current explicit-action behavior. Do not remove Reset or alter stored
document/recovery semantics to make a bundle assertion pass.

Verify the complete production entry import closure, not only RenderApp's branch
or absence of an endpoint string. Distinguish deferred code available to an
explicit action from code evaluated at startup. Module inclusion alone does not
prove a WebSocket connection or storage access occurred.
The existing Text Fill load migration shares the collaboration directory but is
not a session dependency; do not use a directory-wide exclusion that rejects it.

### 6. Final-step input selection loses the producer input

Entries: `server/local-tool-host.ts`, `local-result-delivery.ts`,
`local-design-sequence.ts`, their public contracts and provider handoff tests.

An omitted step selects the final step under the same rules as naming that step.
Pass its validated public input, producer identity and lifetime restrictions to
delivery/retention, just as for a named selection. Do not reconstruct inputs from
the result, add a second read or weaken selection checks.

Use the reviewed Knowledge call selecting `/ids` to verify equivalent named and
final-step selections, independent retain/delivery, subsequent saved-value use,
and actual native successor-request data/status. Invalid selectors and values
outside their lifetime must still reject without replaying completed work.

### 7. Text documentation describes the pre-Canvas/pre-Fill interface

Entries: `CONSTRAINTS.md`, `rules/ui-data-flow.md`,
`modules/providers-and-ui.md`, and directly affected tool/shortcut descriptions.

Align them with `specs/editable-text.md`: Canvas text creation/editing, T shortcut,
Typography and the existing complete Fill panel are available; unsupported Text
Stroke controls remain absent. Preserve current behavior and its focused tests.
Do not activate the separate complete-Text-authoring plan.

### 8. Collaboration documentation contradicts its own local mode and outbox

Entries: `specs/socket-authoritative-document-session.md`, `ARCHITECTURE.md`,
and their directly duplicated current descriptions.

An absent configured endpoint selects the accepted local-only mode. A configured
endpoint selects the Core-owned socket session, including one-Actor editing.
Remove unconditional claims that every startup requires a socket, and the claim
that the implemented IndexedDB publication outbox does not exist. Preserve the
distinction between transport recovery and canonical document persistence.

### 9. Startup documentation still assigns lifecycle work to the App

Entry: `modules/init-and-startup.md` and direct current lifecycle descriptions.

Describe the registered Core session ordering and `core.destroy()` teardown.
Remove instructions to call `core.destroyRenderer()` plus a parallel App disposer,
or to manufacture the file-loaded event from render-ready. The App observes the
actual load event for zoom-fit; Core owns lifecycle readiness and load ordering.

### 10. Property documentation assigns writes/registrations to old owners

Entries: `rules/ui-data-flow.md`, `prd/properties-panel.md`, and their direct
registration/common-API descriptions.

Official reusable aggregate properties belong to Preset. App UI/controller intent
uses the current plural Core property mutation path through common APIs. Remove
instructions to write computed data or mutate a Stroke child through retired
helpers. Preserve shared-property ownership, validation and one intended Undo
boundary. This is not a new property architecture.

### 11. Current documentation advertises missing APIs/files

Entries: `API_SURFACES.md` and `modules/source-coverage.md`.

Remove the nonexistent `getPenEditingVectorId`/`setPenEditingVectorId` aliases and
the `src/setupTests.ts` entry. Correct the directly associated source descriptions
using current files. Do not recreate an alias or placeholder to satisfy a link.

### 12. AI documentation retains superseded cancellation/delivery rules

Entries: App `README.md`, `docs/architecture.md`, current AI specs, history
descriptions and the affected Inspector clauses.

Cancellation stops future work and preserves acknowledged finite members; failed
members retain their ordinary rollback semantics. Delivery controls selected
model data independently of retention. Ordinary valid contract reads must not
silently become incomplete references. Canonical complete/partial receipts carry
the identities required by their current schema; a retired full/compact option
does not decide whether those identities exist.

Remove conflicting instructions and correct the directly contradicted current
acceptance claims. Preserve historical observations as history, not acceptance.
Do not change ordinary versus diagnostic provider-session policy in this item.

### 13. Retired balanced-correctness gate configuration is still protected

Entries: `modules/e2e.md`, `scripts/balanced-ai-correctness-scope.mjs`, its direct
workflow inputs/environment forwarding, and `scripts/__tests__/workspace-automation.test.mjs`.

The documented package command is absent and App E2E no longer consumes
`RUN_BALANCED_AI_CORRECTNESS`. Remove this retired gate's selector, workflow input,
environment plumbing, documentation and tests that require the dead plumbing.
Keep existing maintained correctness/performance gates and their guards unchanged.
Do not recreate the old case, introduce a replacement gate or redesign CI.

### 14. Conversation tests accept an invalid successful creation receipt

Entries: `src/ai/__tests__/conversation.test.ts`, the registered creation-result
schema, and directly related producer/consumer verification and Inspector clauses.

Replace the compact-success fixture with actual schema-valid current owner
receipts. Retain the intended assertions: a new composition replaces the old
target, and its current role mapping cannot inherit stale roles. Empty permitted
mappings and missing required fields are different cases.

Prove that a malformed completed result is rejected at the real boundary, while
valid complete/partial results and safe continuation retain their intended
behavior. Do not bypass result validation, add a compact compatibility variant,
or remove the stale-target regression merely because its old fixture is invalid.

## Execution order

### Step 1 - Resolve current contract conflicts

First reconcile items 7–12 and the requirements governing items 1–6, 13 and 14.
Use current accepted behavior and the current semantic owner; neither a passing
old test nor a conflicting higher-level summary establishes the intended rule.
Apply the decisions above to the owning docs and remove the conflicting clauses.

Read the exact affected routes in the existing Design Functional, Vector local
geometry, socket document persistence, Design Collaboration, history and AI
execution Inspector contracts before changing those routes. Update only the
clauses/boundaries needed by these findings. For example, the AI request route
still mentions compact/full creation receipts and must follow items 12 and 14.
Do not add all fourteen operations to a synthetic product sequence.

Before claiming this step complete, check each corrected requirement against its
current formal behavior cases and direct implementation. Add missing targeted
contract regressions first; document-only fixes use the affected behavior tests
and path/export checks, not tests that merely require a preferred prose sentence.
Runtime defects remain pending until their owner steps below pass.

### Step 2 - Preserve Vector geometry and unify selection ownership

Handle item 1 first, then item 4, reviewing each before moving on.

- Item 1 red case: create a valid Vector, transform it and place it under a Group,
  then change Stroke geometry. Assert exact unchanged placement, dimensions,
  topology and parent, plus the intended Stroke result. Cover ordinary and bulk
  APIs, Undo/Redo and the canonical publication consumed by collaboration.
- Item 4 red cases: compose real selection/projection owners, select and edit
  points/handles/segments, then replay History and dispose. Assert panel/overlay
  values from the canonical selection, absence of independent mirror writers,
  and no duplicate derivation for an unchanged dependency state.
- Use focused existing Stroke, vector topology/parent, Pen, properties, selection
  and projection tests. A narrowly selected existing browser case supplies visual
  evidence where required; no full rendering/performance suite is added.

### Step 3 - Unify collaboration identity and lifecycle

Handle item 2, then items 3 and 5 together at their shared lifecycle boundary.

- Red cases cover explicit zero/current generations, missing/negative/fractional
  generations, first-handshake `null`, Reset, reload and mismatched recovery.
  Test the wire decoder, store/outbox and actual consuming session; do not test
  an independently simplified parser. Invalid identity must not become replay.
- Enter lifecycle tests through Core registration. Cover successful readiness,
  preparation/activation failure, unmount during startup and idempotent cleanup.
  Assert that removed startup exports and routes cannot be selected.
- Build both configured and local-only production variants with in-memory output.
  Check the entry import graph plus startup side effects. Exercise explicit Reset
  separately so deferring its dependencies does not break it.
- Run only relevant protocol, store, outbox, lifecycle, RenderApp, Reset and bundle
  cases; use a bounded collaboration integration case for the affected handoff.

### Step 4 - Repair final selection and creation-receipt verification

Handle items 6 and 14, with item 12's reconciled contract as authority.

- Prove the named/final-step `/ids` asymmetry before fixing the Host.
- Cover selected input/result, retain without delivery, delivery without retain,
  both together, missing selectors, forbidden lifetimes and cross-turn reuse.
- Exercise Knowledge through registered Host dispatch and the real native
  successor request, including its independently validated outcome. Use the
  existing offline scripted native fixture, not a live model or a mock formatter.
- Feed valid creation receipts through the production handoff and controller.
  Inject an invalid completed receipt to prove rejection, preserving partial
  settlement, no replay and stale-role clearing assertions.
- Run the focused Host, delivery, Knowledge, creation/controller and selected
  provider handoff cases. Do not run the whole conversation verifier.

### Step 5 - Remove the retired gate and close these fourteen findings

For item 13, first add a focused regression that fails while the obsolete gate is
advertised or forwarded without an executable consumer. Remove its direct owners
and change the old configuration test to check the maintained workflow contract.
Verify that remaining suites, failure reporting and resource guards are unchanged;
inspect configuration without dispatching CI.

Finally recheck items 1–14 against the edited source, direct consumers and their
focused results. Recheck current docs for only the superseded clauses identified
here. Retain every relevant behavior assertion from replaced tests. Do not start
a new App-wide search or fold unrelated failures into this plan.

## Per-step review and completion

Each implementation step follows: permanent regression first, observed failure
on the current owner path, owner correction, focused rerun, then self-review and
iteration of that same boundary. If an existing formal case already detects the
failure, retain and run it first. A newly passing helper-only case is insufficient.

Review producer inputs, conversion, consumer outputs/status, invalid-input
handling, cancellation, identity, History and resource lifetime where affected.
Remove superseded callers/tests in the same slice. Never weaken validation or
change an assertion solely to accommodate current output.

Use changed-file lint/format checks and affected type checks. Apply the existing
naming gate before introducing identifiers. Review current Inspector obligations
at each affected step; report unexecuted evidence as pending. No whole-feature
acceptance follows from this plan's focused tests.

Completion requires all fourteen outcomes, their relevant regressions and bounded
review to pass. Record which tests failed before repair, which passed afterwards,
and which paths were deleted. If a finding's predicted failure does not reproduce,
resolve that question against its contract before changing runtime behavior; do
not manufacture a failing oracle. Necessary work outside these fourteen findings
requires a separate scope decision rather than a compatibility workaround.

Planning review: the fourteen review numbers are preserved; current-state proof
is distinguished from historical evidence; no text migration, renderer redesign,
new feature or full-suite/live-model gate is included. Implementation is not
complete and no runtime correctness claim is made by this document.


## Execution evidence

Step 1 card: current App docs and the existing request/start-editor/property
routes consume the approved fourteen outcomes. Correct their conflicting
instructions without changing product behavior; runtime defects stay pending.
The five existing focused Text, local-mode, Core teardown and AI transaction
files passed 34 cases before documentation changes. Naming baseline passed.
No new runtime or persisted identifier is introduced in this step.

Step 1 review: corrected items 7–12 at their current document owners and the AI
request Inspector clause. Existing runtime behavior tests pass; items 1–6 and
14 remain unproven until their owner regressions. Step 2 card: Stroke App API
accepts validated field patches and forwards only Stroke mutations to Core.
Vector transform/projection and Factory retain geometry and History ownership;
no bounds repair, topology rewrite or rendering exception is allowed.


Item 1 evidence: the valid transformed-Vector regression failed for single and
batch Stroke writes: x/y 45/60 and dimensions 80/30 became 0/0 and 20/10.
Removed the bounds repair, geometry lookup cache and optional geometry output.
Fourteen focused Stroke cases now pass, including real Core mutation, preserved
parent/topology, Undo/Redo and one shared publication per action. The repeated
owner test now requires only the Stroke read; it no longer protects repair reads.
Logs: `tmp/fourteen-stroke-integration-red.log` and
`tmp/fourteen-stroke-green.log` (local evidence, not committed artifacts).

Item 4 execution card: canonical selection channels own identities. Preset's
existing vector-editing projection owns derived point/segment views and disposal;
App Pen/property actions only change selections or geometry. Verify the real
selection-to-Preset-to-panel handoff, geometry/replay refresh and update counts
before deleting the App bridge and independent writers. Preserve hover intent
and transient geometry; neither becomes canonical selection state.


Item 4 bounded replan: the actual browser property/Undo case rejects immediate
projection after applied events: Undo restores model and rendered geometry but
the derived selected x is 48 px stale. Headless Core tests did not exercise the
Render frame's deferred source transform. The existing `project-vector-interaction`
Inspector requires frame-aligned refresh. Keep the new Preset owner and removed
App writers; replace immediate geometry refresh with one pending refresh at the
already-demanded frame completion. An engine-less Core has no Render application
or future frame, so its synchronous model projection remains immediately readable.
Selection reads must not publish against an outstanding geometry frame. Register
and release the frame observer through the same projection lifetime, including
load/remount and terminal reset. Do not force a render or modify Render geometry.

Next fixed gates: the existing browser `vector point fields project canonical
geometry with one-step undo and redo`, the real Core projection tests, Preset
module cleanup and existing overlay tests. Changes remain in the item 4 Preset
projection and direct tests/docs. Review: inputs remain canonical selection and
geometry; Render owns coordinate projection, Preset owns derived state, App owns
intent. No new selection store or old setter is retained. Step 3 remains pending.


Step 2 review: 47 App focused cases passed; 40 existing selection/ID cases and
59 Preset module/cleanup/overlay cases passed across their bounded runs. The
single real-browser Vector property/Undo/Redo case first failed on stale selected
coordinates and now passes with frame-aligned projection. Its screenshot was
inspected. Selection/handle/segment output, topology refresh, unchanged-input work
counts, cancellation IDs and terminal runtime reset have permanent regressions.
`Core.destroy()` preserves composition for remount; terminal `resetRuntime()` owns
Preset cleanup, which the lifecycle regression now exercises directly.
Removed the App compatibility bridge/test, mirror setters, their API-disposition
entries and Pen/property/vector mutation callers; preserved hover intent.
Preset builds pass. App type checking has only three pre-existing unknown-result
diagnostics at `src/ai/__tests__/design-actions.test.ts:647,650,651`, outside these
fourteen findings. Do not broaden this plan to fix them.

Step 3 execution card: the wire decoder and persistence readers validate explicit
nonnegative safe-integer document generations. Session and materializer consume
that identity; they never infer it. Outbox may retain null before its first
handshake, and invalid stored generations fail through storage recovery without
replay or deletion. Core owns collaboration prepare/load/activate/dispose. Reset
remains an explicit action with deferred collaboration imports. Gate these owners
in that order, keeping generation correction separate from lifecycle deletion.


Item 5 direct-import review: deferring Reset alone did not pass the new complete
entry-closure test. Its direct import trace also found synchronous session reads
in AI startup/input/export and runtime diagnostics. Keep those reads synchronous
through a lightweight observation module registered by Lifecycle; move the old
getter exports entirely, without re-exporting them from Lifecycle. The callback
reads current owner state, including generation changes, without copying a
session or creating a connection. HMR removes only its own registration. These
are direct consumers of item 5's startup boundary, not an additional finding.
The same bundle oracle and live scope/disposal case verify this correction.


Step 3 review: explicit-generation regressions first failed at the wire, persisted
record, HTTP checkpoint and outbox boundaries. The four focused generation/client
files now pass 153 cases; the backend Reset file passes 11 cases in its Node
environment. Two real socket bootstrap/Reset cases pass. All 39 collaboration
lifecycle cases now use the current Core registration/start boundary rather than
the deleted prepare/start facade. Twenty-one direct RenderApp, Reset and diagnostic
cases pass; the complete production static-import closure passes. The naming gate
passes. App type checking retains only the three previously recorded out-of-scope
diagnostics. The local-only path keeps session observations synchronous without
copying state or eagerly loading socket/outbox owners.

Step 4 execution card: the AI request Inspector assigns validated public input,
result, invocation identity and lifetime to the producing Host boundary. Delivery
and retention consume that same observation for named and final selections;
neither infers input from output. Exercise actual Knowledge and native successor
requests, preserve independent delivery/retention, and reject absent/nonportable
selections. Creation fixtures must meet the registered owner schema while keeping
new-target and stale-role assertions. No new execution entry or compatibility
receipt is permitted.


Step 4 review: the real Knowledge `/ids` regression failed for unnamed final
selection; named selection succeeded but its next-turn unnamed selection failed.
The Host now captures validated public input, producer and lifetime exclusions
together with the final projection. Twelve permanent input/result/lifetime cases
and the focused Host/delivery files pass (122 cases in that run). Two offline
native provider cases verify actual successor data and explicit execution state.
The native fixture requires a real conversation identity; its initial missing
identity rejection was a fixture error, not product evidence.
The two historical creation fixtures fail when routed through the registered
App observer. Six scoped cases now preserve complete/partial target replacement
and empty-role clearing, and reject those malformed completed receipts at output
validation after exactly one producer execution. No runtime creation contract was
changed or weakened.

Step 5 execution card: the retired balanced correctness selector has no consumer
in current App E2E or package scripts. Add a source/parsed-workflow regression,
then delete only this gate's selector, inputs, environment and documentation.
Preserve maintained suite selection, runtime guards, reports and artifact upload.
No CI dispatch, replacement gate, broad acceptance or live-model test is in scope.


Step 5 review: the retired selector, its manual/reusable workflow inputs, caller
forwarding, environment forwarding, CI path relationship, old enforcing test and
current E2E documentation were removed together. The new permanent regression
failed before removal; five focused maintained workflow/guard cases now pass.
No maintained E2E suite, artifact report or resource guard was removed.

Final item 2 review found that Reset itself could generate an unsafe integer
from a valid maximum generation. The new regression reproduced the invalid
write. Reset now rejects before commit; the prior checkpoint remains readable
and unchanged. All twelve backend Reset cases pass. This is the direct writer
for item 2's explicit identity contract, not an additional cleanup finding.


## Final bounded review

All fourteen outcomes are implemented. No compatibility aliases, generation
inference, selected-view setters, retired startup facade or balanced-correctness
selector remains in the affected current owners. Historical evidence and the
explicitly excluded Text Fill migration were preserved. Direct-consumer review
also removed stale API setter listings, startup calls and compact/full receipt
prose from the affected current documents.

| Finding | Completed outcome and evidence |
| --- | --- |
| 1 | Stroke-only edits preserve canonical geometry, parent and topology; real Core single/batch actions, publication and Undo/Redo regressions pass. |
| 2 | Wire, persisted checkpoint, persistence client and outbox require explicit valid generation; legal pre-handshake null remains. Reset rejects exhausted generation without replacing data. Generation/client 153 cases, backend Reset 12 cases and real socket bootstrap/Reset 2 cases pass. |
| 3 | Removed old prepare/start facade; 39 lifecycle cases use real Core session registration/start and preserve ordering, recovery and cleanup. |
| 4 | One Preset projection consumes canonical selections. Removed App bridge and independent setters; headless, actual frame/Undo/Redo browser, work-count and disposal cases pass. |
| 5 | Reset defers its session dependency; lightweight session observations read owner state. Full local-only static import closure and 21 direct-consumer cases pass. |
| 6 | Final and named selections carry the same validated producer input, result, origin and lifetime. Host/delivery run: 122 cases pass; two actual offline native successor cases pass. Cross-turn use and request-lifetime rejection are covered. |
| 7 | Current Text Canvas, T key and Fill behavior replace obsolete Text constraints. Existing behavior baseline passes. |
| 8 | Current docs distinguish configured collaboration, explicit local mode and recovery outbox. |
| 9 | Core owns session preparation/load/activation/disposal; App observes actual file load and uses normal Core teardown. |
| 10 | Property docs assign canonical Stroke writes and aggregation/registration to current owners. |
| 11 | Removed nonexistent Pen aliases and setupTests.ts documentation. |
| 12 | Current docs/Inspector preserve acknowledged finite members and delivery-only result selection; removed compact/full and one-time-read claims. |
| 13 | Deleted selector, direct CI inputs/forwarding/path relationship and enforcing test; five maintained E2E workflow/guard tests pass. |
| 14 | Actual registered observer rejects both malformed old creation receipts. Valid complete/partial receipts replace targets and clear stale roles. Conversation/creation files: 86 cases pass. |

Additional direct-consumer check: all 43 basic-API action cases pass after setter
removal. The final production bundle check passes after RenderApp import migration.
The lifetime counterexample selects the entire actual input: portable IDs still
deliver, request-only descendants cannot be saved, settlement remains completed
and the producer executes once.

Scoped lint, naming and diff whitespace checks pass; existing console warnings
remain. Preset build, collaboration-server, document-backend and AI-server type
checks pass. App source-plus-tests type checking still reports only the three
pre-existing unknown-result diagnostics at design-actions.test.ts:647,650,651.
Those are outside the frozen fourteen findings and were not changed or hidden.
No full local/App/conversation suite, 101 test, live-model test, push or CI dispatch
was performed. The offline native fixture scripts model replies and verifies
actual provider packets; it does not perform a live design task.

Local logs remain under `tmp/fourteen-*`; the actual browser screenshot is under
`apps/asyra-design/test-results/properties-Property-Manage-756f3-with-one-step-undo-and-redo-chromium/vector-point-property-panel.png`.
These local artifacts are not committed evidence. Completion here is restricted
to the fourteen outcomes and listed checks, not a claim that every App behavior
or unrelated inherited work is correct.
