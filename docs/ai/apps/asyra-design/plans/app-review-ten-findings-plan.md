# Plan: App Review Ten Findings

## Bounded task

Status: R1-R10 and the authorized rectangle handoff follow-up are implemented
and accepted within the bounded focused checks below. Historical failure limits
remain recorded. The original scope is R1-R10 from
[the November 15 review](../reports/app-wide-contract-review-2026-11-15.md).
The conversation owns implementation and review. Work in the existing
`codex/ai-conversation-improvements` worktree at HEAD
`bd5fcee28cdb9ad58659071b3899016d85505796` plus inherited changes; preserve them.
No 101, full local/App/conversation suite, dependency change, generated template,
compatibility path, broader audit, commit or push is included.

Allowed changes are the ten finding owners, their direct callers, current
documents, formal regressions and test selection. Current specs govern behavior;
the review is evidence, not a new product specification. Existing migration and
registered-recipe policies remain unchanged. A newly discovered unrelated issue
is recorded, not implemented. A necessary out-of-scope dependency stops that
slice. Red proofs precede product changes; intentionally corrupted observations
must be rejected without weakening legal behavior.

## Ordered implementation

### 1. Verification entry and typed observations - R1, R4, R6, R7

Owner: App test entry points, browser declaration proof and typed observations.
Input: maintained test scripts and current public Core/App contracts. Output:
existing explicit selectors, strict browser/compiler evidence and acknowledged
identity assertions. No test omission, cast or debug-global exemption may make
the result pass.

First add an existence regression for every explicit App test selector and prove
the removed selection file fails it. Delete that selector and the narrower
duplicate existence check, preserving inclusion checks. Include the companion
property browser file in the Pen type gate and assert its inclusion. Run the
compiler before repairing its observations with public canonical/render APIs;
keep geometry, rendered bounds and undo/redo assertions. Replace the runtime
debug-global type fixture with a static declaration proof that detects `any`
and wrong owner types without consuming DevTools handles. Keep the formal global
guard. Narrow the AI receipt before its existing complete-ID assertions.

Checks: entry/declaration/global boundary node tests, focused Pen compiler,
App source compiler, design-action receipt test and property browser cases.
These are verification-only changes, not new AI or Pen execution contracts.

### 2. Independent Pen evidence and current ownership docs - R2, R3, R5

Owner: Pen observation regression and real browser input ordering. Preserve
Vector Inspector `project-vector-interaction` and `settle-vector-action`:
canonical selection drives intent, display refresh remains frame-aligned.
Capture independent expected coordinates before observation; demonstrate that
in-place corruption fails the oracle. Establish a real frame barrier in the
browser, perform successive inputs while display is stale, assert canonical
topology/selection and continuation, then release and assert projection catches
up. Retain ordinary Pen coverage and history/reload checks. Do not change product
selection timing or use a second selection store to satisfy a test.

Remove the current source map's deleted state reference and compatibility point
selection wording, with targeted document regressions. The delete-hover wording
is reconciled in step 3 with its actual owner.

Checks: observation and continuation regressions, current-document guards, Pen
browser cases and supporting property undo/redo. Review the assertion purposes,
not only their passing count.

### 3. One eligible hover policy after deletion - R8 and remaining R5

Owner: App hover target policy and delete feature. Inputs: pointer, modifiers,
current path-editing scope, canonical hierarchy and lock/visibility. Output:
eligible hover ID or null after successful deletion. Existing deletion and
functional Inspector steps own the transaction and hover handoff.

Prove the overlapping locked-target failure before repair. Share current hover
resolution between normal hover and successful deletion through an App-owned
controller/common boundary; no feature-to-feature obsolete API. Preserve subtree
deletion, selection/history and drag ownership. Test locked, hidden, grouped,
empty and ordinary eligible targets; strengthen the browser assertion to require
the actual expected target. Update feature docs and the affected flow handoff.

Checks: hover/delete unit tests, delete browser cases, applicable history cases
and focused Inspector contract checks.

### 4. Marquee projection invalidation - R9

Owner: App registered area-selection overlay. Input: workspace endpoints and the
current viewport projection; output: screen-space polygon/outline or empty layer.
Retained output is valid only while its projected geometry is unchanged.

Add a real overlay-registration regression for scale/pan with unchanged workspace
endpoints, then fix the signature at the projection boundary. Preserve zero draw
work when output is unchanged, clear on ending selection, and redraw on resumed
selection. Use the existing engine-neutral canvas and Core registration. No new
render scheduler, forced frame or Pixi-specific shortcut.

Checks: layer tests for projection, clearing and reuse, existing selection and
viewport browser tests. Source-space numeric assertions own correctness.

### 5. Hierarchy admission reuse - R10

Owner: canvas hierarchy target controller and its authoritative projection source.
Keep all malformed-hierarchy rejection and current Group/Frame targeting rules.
Separate projection admission from changing hit/selection/modifier queries; a
create-parent lookup must not validate its same input twice. Before retaining
admission across calls, verify the producer's change and lifetime contract.
Reuse only at that contract's valid lifetime; raw mutable caller input still
requires fresh admission. Bound retained memory and invalidate on hierarchy/data
replacement, workspace/load/history changes and owner teardown as applicable.
Do not add a size threshold, serialize the document per query, or move full work
into capture or another consumer.

First reproduce the 10,000-element read counts formally. Add invalidation and
malformed-input cases, then implement and compare output plus work counts on
normal callers. Update functional `target-hierarchy` flow cache dimensions only
after that lifetime is proven. Retain independent expected targeting results.

Checks: target-controller and source-handoff tests, creation/selection/hover
consumers, layer hierarchy/browser reparent tests. Work-count improvement is the
acceptance metric; no unmeasured GPU or frame-time claim.

## Design review and completion

The sequence repairs evidence before product behavior, keeps canonical owners,
and removes contradictory documentation alongside its implementation owner.
No step depends on relaxed validation. Step 5 must establish the producer's
lifetime before selecting its reuse mechanism; this is bounded design work in
that step, not permission to redesign Framework projection.

Before each step, reread the matching specification and flow, record its concrete
execution card here, demonstrate red, implement, run focused green evidence and
review direct consumers. Only then advance. Final checks combine the changed
boundaries and typed observations; no aggregate pass count proves whole-App
correctness. Record remaining limits explicitly. The associated task flow keeps
these same five outcomes, not additional product requirements.

## Execution evidence

Step 1 card: the test entry owns file selection, the declaration test owns
static type evidence, and browser observers consume public state/render APIs.
Inputs are maintained scripts and real declarations; missing files, unknown
receipts and unsafe globals must fail explicitly. The current Vector flow's
canonical/projected distinction remains unchanged. Red gates are the new
selector/inclusion checks, existing debug-global guard and strict compilers.
The five-outcome task flow is admitted at
`apps/asyra-design/test-data/app-review-ten-findings/app-review-ten-findings.flow.json`.
No production behavior change is part of this step.

Step 1 review: red selector/inclusion/global gates failed as expected; the
expanded compiler reproduced 33 property-test diagnostics and the App compiler
reproduced the three receipt diagnostics. Removed the stale selector and its
server-only duplicate guard. Replaced the debug-global value fixture with static
TypeScript symbol evidence, including any/unknown/string corruption cases.
Property observations retain actual render geometry and canonical Vector data;
the public selected IDs replace private access. Receipt assertions are unchanged
after strict record admission. Green: 15 node cases, both strict compilers,
the complete-identity receipt case, and all 20 property browser cases. Naming
passed. Logs: `tmp/ten-step1-*`. No guard was disabled or assertion weakened.

Step 2 card: preserve canonical intent and frame-aligned display. The Vector
flow still forbids duplicate geometry/state. Independent expected values must
reject in-place corruption; the browser case must observe no frame completion
between selected source and successor input, then prove display catches up.
Current source-map and point-selection docs are repaired at the same boundary.

Step 2 review: the old observation oracle accepted deliberate in-place coordinate
corruption; an independent pre-call snapshot now rejects it. Adding explicit
zero-frame/stale-display assertions exposed that the old browser scenario did
not establish its title. A Playwright clock barrier installed before startup
now holds real frame callbacks while two real successive clicks update canonical
selection/topology/continuation, then resumes and proves display catches up.
All 26 Pen browser cases (including persisted reload/render identity), 12 focused
owner cases, the strict Pen compiler and four document guards passed. Product
Pen and Preset timing were not changed. Evidence: `tmp/ten-step2-*`.

Step 3 card: the deletion and functional hover flows require eligible current
targets after a successful canonical delete. Extract the existing hover policy
into one App controller; normal pointer/render inputs and deletion share it.
Selection clears only after accepted deletion, within the same transaction.
Do not recreate the absent feature API or use geometry fallback as hover policy.
Red evidence must exercise actual delete execution and browser input, not merely
call the extracted helper.

Step 3 review: five actual feature-execution regressions failed before repair;
the real browser also reproduced a locked remaining target becoming hovered.
The shared controller now owns hierarchy/editing/lock/visibility policy for
normal hover and successful deletion. Failed deletion preserves selection.
Nine focused owner cases, all 14 delete browser cases (including rollback,
undo/redo and durable reload), 14 document/entry guards, App types and naming
passed. Updated both flow implementation boundaries and replaced the old weak
browser selector with all three actual eligibility cases. No geometry fallback
or legacy feature API remains in deletion. Evidence: `tmp/ten-step3-*`.

Step 4 card: the App selection overlay owns canvas-space geometry derived from
workspace endpoints. Reuse must depend on projected endpoints, with null/empty
selection clearing the layer. The actual engine-neutral registration remains
the execution path. Numeric drawing calls and reuse counts are the regression
oracle; neither a mocked replacement registration nor a screenshot alone closes
the projection contract.

Step 4 review: actual overlay-registration scale and pan regressions failed
before the signature fix. The signature now compares projected endpoints;
unchanged output performs no drawing, null clears once, and resumed selection
redraws. Six focused owner cases and 20 selection/viewport browser cases passed.
The functional flow records the actual projection inputs and cache dimensions.
No engine-specific API or product scheduler was introduced. Evidence:
`tmp/ten-step4-*`.

Step 5 design/card: Preset `data-channel` publishes replacement descriptor maps
through `mutation.commit`/subject.next and replaces hierarchy arrays when order
changes; load rebuilds the projection. Pointer-only queries preserve these
identities. Retain one admitted pair plus current workspace in the App controller,
and release it through Core runtime cleanup. Direct explicit-input functions
remain freshly validated because their caller may mutate data in place. Internal
admitted resolvers are not public bypasses. Normal pointer/create/container
consumers share admission; create checks its expected workspace against that
same result instead of validating twice. Tests must cover real Preset changes,
load and history as well as raw mutable malformed input and work counts.

Step 5 review: the formal 10,000-element cases first reproduced repeated whole
projection reads and double create admission. Unchanged normal pointer/create
queries now perform fewer than ten additional map reads; explicit create stays
below 21,000 instead of the observed 40,002. Every supplied descriptor must
still be admitted; the test does not require redundant work as a lower bound.
Malformed replacement maps, order-only replacement and workspace-only changes
invalidate admission. Selection and modifiers remain live query inputs.
Cleanup releases the retained projection. Raw mutable input is never retained.
The real Preset integration proves reparent, undo, redo, document load and
lock/visibility updates rather than substituting a fake projection producer.
The seven-file consumer run passed 54 cases; the final two-file owner run passed
30 cases after additional lifetime/key checks. Seven real Group/Layer browser
cases passed. Source and Pen compilers and naming passed. No new Framework
projection, capture cost or group-size rule was introduced. Evidence:
`tmp/ten-step5-*`, `tmp/ten-final-app-types.log`,
`tmp/ten-final-pen-types.log`, `tmp/ten-final-naming.log`.

## Final bounded verification and remaining limit

- R1-R7: entry, independent observation, real input ordering, companion compiler,
  current documentation, static declaration evidence and strict receipt admission
  are repaired. The final 33 node cases pass without excluding debug-global checks.
- R8: normal hover and successful delete share one eligibility owner. Rejected
  deletion preserves selection; no obsolete feature API is restored.
- R9: marquee reuse keys projected geometry and clears on selection termination.
- R10: the current authoritative projection is admitted once; live target inputs
  and every invalidation boundary remain checked.
- The formal Inspector discovery check caught the Pen ordering case missing from
  the maintained browser case manifest. Added its exact selector and actual
  owning implementation paths, and updated the three delete-hover cases to include
  the shared controller. All three focused contract checks now pass, including
  equality against actual Playwright collection. No admission rule was relaxed.
- The final Pen/delete/selection browser run passed 50 of 51 cases. The failure
  was `Element Selection should deselect via Contents Panel empty area click`:
  immediately after rectangle creation, its existing selection precondition was
  false, before the panel click. The unchanged exact case passed three subsequent
  executions. This does not prove the cause or prove a repair. Do not erase the
  failed run or claim clean combined browser acceptance. Logs:
  `tmp/ten-final-browser.log`, `tmp/ten-selection-followup.log`.
- No product behavior or test assertion was changed to hide that failure. Its
  relationship to the hierarchy change remains unproven. Keep task integration
  acceptance open rather than use the passing retry as evidence of a fix.

No full local/App/conversation suite, GPU/frame latency benchmark or 101 ran.
These findings do not establish correctness of every App interaction. No commit
or push was performed, and inherited changes were preserved.

## Rectangle selection integration follow-up

The user authorized diagnosis and correction of the one remaining failed
rectangle-creation precondition. Scope is the real input-to-create-to-selection
to-display handoff and its E2E helpers, direct regressions and current evidence.
Keep all existing creation, canonical selection, rendering and cancellation
semantics. Do not add compatibility, retries that hide failure, longer fixed
sleeps or weaker assertions. No 101, full local suite or unrelated cleanup.

Execution card - integration: trace actual keyboard/pointer input, tool state,
canonical identities and display observations. Preserve the original failed run.
First characterize the failing boundary and demonstrate a permanent regression
against current behavior, including a controlled delayed handoff when needed.
Then correct its semantic owner and verify both normal and delayed execution.
The selected Inspector owners remain switch-tool, create-element and
select-elements, plus the existing task integration criterion. Independent
canonical and displayed observations must distinguish a failed mutation from
an incomplete test wait. Final checks are the original combined Pen/delete/
selection cases, exact relevant owner tests, strict types and test-discovery
contracts; all must pass before integration acceptance is recorded.

User-reported product reproduction: holding R for more than 100 ms and then
dragging on the canvas creates a default-size rectangle instead of resizing.
This is separate from the helper's premature return. Extend this same bounded
follow-up to tool-shortcut admission and its active create-session handoff.
First compare held input with and without repeated keydown during drag, using
real keyboard/pointer events and canonical dimensions. Preserve intentional tool
changes, fresh Pen key presses, editable-target admission and one-gesture history.
Fix the first incorrect input/session owner; do not weaken the creation test or
use the helper repair as evidence that this product bug does not exist.

### Follow-up findings and owner corrections

The historical single selection failure has no trace of the canonical state at
failure; unchanged passing repeats do not identify its exact cause. Preserve that
limit. Two independent regressions establish actual incorrect handoffs:

- The rectangle E2E helper returned after fixed sleeps even while the real
  SessionManager queue was blocked. Releasing that queue produced the selected
  rectangle without another input. A separately suppressed real canvas mousedown
  also let the old helper report completion without any rectangle. The helper
  now sends one shortcut and one click, then waits for a new canonical rectangle
  selection, idle transaction boundary and visible controls. It does not retry
  mutations or compensate by pressing V. The original case retains its selection
  assertions and attaches input/state observations even when helper admission fails.
- The user's held-R reproduction is a product defect: a repeated keydown was
  admitted as another tool-switch execution, whose formal session cancellation
  completed the active create gesture at its default size. Holding R beyond
  100 ms without repeat preserved resizing; injecting the real repeated keydown
  while held produced 100 x 100 instead of the expected 320 x 229. The App now
  uses existing held-key metadata to admit fresh matching tool keydown only,
  before session cancellation. Repeat, release, cancellation, composition and
  unrelated held-key changes are ignored. No InputSystem timer, creation geometry
  or generic session-cancellation contract was changed. Fresh intentional tool
  changes, same-tool Pen actions and editable-field ownership remain supported.

Permanent regressions cover the real blocked queue, rejected pointer input,
slow main thread, held R with/without repeat, exact dimensions, undo/redo and an
intentional different-tool interruption. All five tool shortcuts also have direct
admission checks. Their exact browser cases belong to the existing create-element
or switch-tool owner and are included in real Playwright discovery; ordinary App
verification selects the shortcut regression. Layers empty-area deselection does
not switch the active tool; that accepted behavior is unchanged.

Red evidence: `tmp/rectangle-queue-owner-red.log`,
`tmp/rectangle-rejected-red.log`, `tmp/held-rectangle-owner-red.log`, and
`tmp/held-tool-admission-red.log`. These are behavioral counterexamples, not
inferences from unchanged retries. The first two concern test acknowledgment;
the latter two concern product admission. Neither proves the missing historical
trace's exact cause.

### Final focused acceptance

- Combined real-browser Pen, deletion, selection, rectangle handoff, element
  creation and properties: **84/84 passed**, including the original failure's
  exact case and the held-R reproduction (`tmp/rectangle-final-integration.log`).
- App shortcut/create/selection owner tests: **29 passed**
  (`tmp/rectangle-final-owner.log`); existing InputSystem held-key contract:
  **5 passed** (`tmp/rectangle-held-input-contract.log`).
- Entry selection, declaration and current-spec guards: **21 passed**
  (`tmp/rectangle-final-boundaries.log`). Exact functional case discovery:
  **3 passed** (`tmp/rectangle-final-discovery.log`). Strict handoff compilation,
  focused ESLint, naming and bounded whitespace checks passed.
- The manual frontend on port 3045 serves the corrected held-key registration
  and repeat guard. Its document/collaboration services remain running for the
  requested manual inspection. No 101, full local run, commit or push occurred.

This accepts the authorized integration repairs with deterministic red-to-green
counterexamples and preserved behavior. It does not reconstruct the original
untraced failure or certify every App interaction. The earlier failed run remains
historical evidence; acceptance comes from the corrected owners and current gates.

## O P V T browser shortcut follow-up

The user requests actual browser regressions for the four remaining tool keys.
This task extends only the switch-tool admission proof and its direct operation
handoffs: O ellipse resizing, P connected-anchor handle dragging, V selection
movement and T text-box dragging. Use real keyboard/pointer input, hold longer
than 100 ms, inject repeated keydown during the active gesture, and verify the
canonical result and relevant visible state. Verify fresh tool changes separately
for each key, and preserve fresh Pen source-selection behavior.

Execution card - switch-tool: current held phase/changed-key/repeat metadata is
admitted before Feature session cancellation. Repeated keys must not dispatch;
fresh matching keydown must dispatch. Observe downstream creation, Pen topology,
movement and text editing through existing public APIs; do not implement a test
replacement for dispatch or sessions. Allowed edits are the new browser cases,
exact discovery/type inclusion and this plan's evidence. No production changes
are planned; an observed in-scope product defect must first have a failing test.
No framework policy change, new compatibility, broad audit, full local test,
101, commit or push. New identifiers are test-local and exact case identities;
no persisted product identities change. Review actual assertions and collection,
then run only these cases, related existing tool/gesture cases, focused types,
lint, naming and discovery guards. Keep the manual server available.

### O P V T focused acceptance

Added eight real Chromium cases in `e2e/tool-shortcut-handoff.spec.ts`: four
held-key operation cases and four fresh-key interruption cases. O verifies exact
ellipse dimensions and one undoable creation; V verifies the complete move of
the same selected identity and undo/redo; P verifies two anchors, one segment,
exact outgoing-handle displacement and continued connection, followed by a fresh
P disconnect and fresh V switch; T verifies the dragged width, focused editor,
provisional state, exact committed text and undo/redo. Every normal-switch case
first verifies the rectangle's expected dimensions, then verifies that subsequent
pointer movement cannot alter the finalized rectangle after the new tool activates.

The first run passed the O/P/V held cases but stopped other cases at test
observation: the existing UI helper omits Text and names the rectangle button
`rectangle`, whereas the canonical tool is `rect`. The new tests incorrectly
mixed those contracts. Corrected the new observer to independently assert the
canonical tool and its real toolbar state; no product behavior or geometry/history
assertion was relaxed. Preserve `tmp/tool-handoff-browser.log` as the initial
fixture failure, not product-failure evidence.

Final result: **16/16 browser cases passed**, comprising all eight new cases and
eight related existing R, Pen and text/IME handoffs
(`tmp/tool-handoff-final.log`). Exact functional discovery passed three checks;
the strict compiler inclusion/declaration guard passed seven checks. Focused
TypeScript, ESLint, naming and whitespace checks passed. Case collection and
strict compilation both include the new file. No production source, existing
helper, framework policy, full local suite or 101 changed/ran. The user's manual
server remains running. This proves these selected interactions in Chromium,
not every keyboard/browser/gesture combination.
