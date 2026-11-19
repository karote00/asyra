# Plan: App Review - Five Handoff Fixes

## Task boundary

Status: Complete for these five findings and their focused acceptance cases.

This plan implements only the five findings accepted after
the App-wide review of the fourteen-finding cleanup. It does not expand that
earlier plan or claim whole-App acceptance.

Checkout: `.worktrees/ai-conversation-improvements`, branch
`codex/ai-conversation-improvements`, HEAD
`bd5fcee28cdb9ad58659071b3899016d85505796` plus inherited uncommitted changes.
Preserve unrelated changes. The current conversation owns these five steps.

Authorized boundaries are the five owners below, their direct consumers, formal
regressions, test entry points, and current contract documentation. No 101,
full local/App/conversation suite, renderer redesign, new product workflow,
dependency upgrade, generated template work, or unrelated cleanup is included.
Do not retain superseded entries, aliases, mirror writes, or permissive tests.
The current Text document migration is explicitly outside this task.

## Ordered implementation and acceptance

### 1. Canonical selection through Pen continuation

Selection channels own selected identities. Preset owns the frame-aligned
coordinate projection for panels and overlays. App continuation and Pen intent
must consume current selected identities through the existing Selection API,
never use delayed display coordinates to choose the next canonical edit.
Continuation remains derived from the selected anchor and canonical topology;
its existing empty-selection and new-subpath policies remain unchanged.

Owners: App selection API, `init-path-editing-continuation`, Pen feature and
their direct tests. Preserve the Preset frame-aligned refresh that fixes property
Undo/Redo. Applicable flow: `project-vector-interaction` in the Vector local
geometry Inspector; distinguish canonical intent from display projection in its
existing contract and include the actual continuation consumer.

Red proof: existing real-browser arbitrary-anchor continuation fails after three
clicks. Strengthen permanent coverage to assert point order and continuation
after each click, not just hover. Also exercise stale display data against a new
canonical selection, anchor connection and cancellation consumers. Green gates:
focused continuation/selection tests, Pen browser cases and the existing Vector
property Undo/Redo browser case. No duplicate selection store or forced render.

### 2. Remove obsolete renderer lifecycle exports

Core owns startup and teardown. Delete the unused App renderer state and public
`destroyRenderApp`, `setupInputSystem`, and `renderIsReady` forwarding entries
after checking their direct callers. Keep the current tool-switch controller.
Update controller/API docs and mocks. First strengthen the renderer boundary
test to cover exported entries and the retired state, then run that test and
controller/RenderApp lifecycle regressions. A test of only RenderApp is not proof
that the old public entry was removed.

### 3. Include permanent regressions in ordinary test entry points

The four omitted Stroke transform, Vector selection projection, document
generation and final-input delivery files must run through ordinary App tests;
the server files must also run through the response harness. Conversation
verification already discovers them and must continue to do so. Add a permanent
entry-point regression before modifying scripts. Keep explicit focused scopes;
do not replace the verifier or run its complete suite in this task.

### 4. Reconcile directly conflicting current documentation

Remove deferred Text Canvas/T-key claims, computed-data write guidance, and
selection compatibility-mirror guidance from the identified current feature,
controller, API and startup docs. Current editable Text, canonical property
writes, and frame-aligned read projections are authoritative. Add focused
contract checks that reject those specific conflicts and retain behavioral
Text/selection/controller tests. Do not rewrite historical evidence.

### 5. Make native test admission match its declared contract

Native protocol evidence uses an explicitly configured executable of the
fixture-declared version. No executable setting means native-only cases are
reported skipped; explicit missing/wrong-version settings fail before allocating
fixture resources. No implicit PATH fallback or simulated native success.
Keep the loopback scripted provider and actual successor-request assertions.
Use one test-owned admission definition for the fixture and verification entry;
record the executable version used by this fixture. Do not apply native-client
requirements to ordinary App-only harness cases. Skipped native evidence must
not count as complete conversation verification.

Red proof: unset, missing, mismatched and valid executable cases, including the
actual test collection/entry behavior. Green proof: configured native instruction,
schema and Knowledge handoffs, plus their deliberate-corruption counterexamples;
unconfigured collection must report skips instead of calling a PATH client.

## Review and closure

Before each owner change, read the affected current flow, identify input/output
and consumers, prove the formal regression fails, then fix at that owner.
Review the complete changed handoff, accepted behavior and test selection before
advancing. Only direct-consumer regressions caused by these changes may deepen
the fixed discovery scope. Record red/green results here; passing isolated owner
tests never establishes downstream correctness or whole-App acceptance.

Naming: reuse SelectionChannels, existing point references and Core lifecycle
APIs. New test-only admission identifiers belong to the native fixture tooling;
no persisted identities change. Naming baseline: 15 checks passed.

## Execution evidence

Step 1 complete. Existing arbitrary-anchor browser case failed on incorrect
point order; the new stale-display/current-selection unit case failed on point A
instead of B. Continuation and Pen connection/cancellation now read canonical
selection references. The Preset projection timing is unchanged. Four focused
files passed 18 cases; seven real-browser cases passed, including ordered
three-point continuation, arbitrary source, split endpoint, merge, close,
single-point cancellation, and Vector property Undo/Redo. Logs:
`tmp/five-pen-red.log`, `tmp/five-continuation-red.log`,
`tmp/five-pen-unit.log`, `tmp/five-pen-green.log`.
Review: no display coordinates enter intent, no new store or render was added;
empty selection/new-subpath policy and frame-aligned panel behavior are retained.

Step 2 execution card: App lifecycle exports and state have no production caller.
Core remains the startup/disposal owner. Test the public controller exports and
absence of the retired state, then retain tool switching and RenderApp lifecycle
regressions; no Core implementation change is needed.

Step 2 complete. Public-entry boundary failed before removal. Deleted the dormant
renderer state and all three lifecycle exports, removed their test mock and
current API/module declarations. Four boundary cases, two controller cases and
12 RenderApp Strict Mode/lifecycle cases passed. Direct-caller review found no
remaining consumer; Core methods and AI dispositions for Core methods are not
App controller aliases and remain unchanged.

Step 3 execution card: package scripts select ordinary App/server regression
files; conversationGroups independently discovers them. The five new checks
failed on all four omitted files and missing self-selection. Add the App files
to jsdom, server files to node and response harness, and the node check itself
to ordinary tests. Do not run or broaden any full suite.

Step 3 complete. Five entry-point guards passed after wiring. The four selected
files passed: Stroke 2, selection projection 4, server generation/delivery 19.
Review confirmed node/jsdom separation and unchanged conversation discovery;
no broad test command was executed. Evidence: `tmp/five-entry-red.log`,
`tmp/five-entry-green.log`, `tmp/five-selected-server.log`,
`tmp/five-selected-stroke.log`, and Step 1 projection evidence.

Step 4 execution card: current feature/API/module docs describe accepted runtime
behavior, not superseded mirrors or deferred Text capability. Three formal
cross-document checks failed before editing. Replace those claims at their
owners and retain current Text, controller and selection behavior tests; historical
recordings and unrelated docs remain unchanged.

Step 4 complete. Three contract regressions and five entry guards pass; seven
existing Text shortcut/Canvas cases pass. Direct review aligns Pen intent with
canonical identities and keeps frame-aligned display projections. No historical
evidence or Text migration changed. Evidence: `tmp/five-docs-red.log`,
`tmp/five-docs-green.log`, `tmp/five-text.log`.

Step 5 execution card: native protocol fixture admission owns explicit path and
version, independently of production provider discovery. Installed evidence is
`codex-cli 0.160.0`; fixtures declare that exact version without upgrading it.
Three real Vitest-entry counterexamples failed before repair: unset configuration
ran a case, and missing/wrong-version clients reached execution instead of
admission. Share one admission function, retain native cases as reported skips
when unconfigured, and fail full verification before work if native proof is
unavailable. Ordinary App-only tests remain client-independent.

Step 5 complete. The three real-entry red cases now pass, together with the
complete-verification preflight rejection: four admission tests. The first new
skip assertion mistakenly expected Vitest's `pending` status; the runner reports
explicit `skipIf` as `skipped`. Corrected that exact format, retaining a zero-pass
assertion and a separate rejection of skipped required evidence. No admission
was weakened. Explicit `codex-cli 0.160.0` execution passed six native instruction,
schema-corruption and Knowledge delivery/reuse cases plus three unfinished-output
observation cases. These are loopback scripted provider tests, not a live model.
Evidence: `tmp/five-native-red.log`, `tmp/five-native-green.log`,
`tmp/five-native-handoff.log`, `tmp/five-native-observation.log`.

Final direct-consumer review also proved the newly strengthened continuation
file and two native files were missing from ordinary entries. Added those direct
regressions to their proper environments and server harness; eight entry checks
now pass (`tmp/five-direct-entry-red.log`, `tmp/five-direct-entry-green.log`).
This completes the same test-selection boundary, not a new test inventory audit.

The Vector Inspector's generated catalog was stale. Regenerated its existing
artifact from current owners; all nine Vector flow contract cases pass. Three
focused conversation evidence cases preserve required-file selection, identity,
missing/duplicate/stale rejection, and rejection of skipped required observations.
Final node check: 19 cases passed. Naming: 15 passed. Changed-file lint has zero
errors and one inherited controller console warning. The final Pen case passed
again after adding its explicit missing-vector guard. No full suite or 101 ran.

## Verification limits

The scoped TypeScript diagnostic probe found one new missing-vector guard in the
new browser case; it is fixed without a cast. The remaining 152 diagnostics are
142 in pre-existing Pen E2E sections and ten in unchanged collaboration lifecycle,
Core composition and performance-profile code. An in-memory comparison removing
the new Pen case reports the same 152 diagnostic identities and zero additions
(`tmp/five-types-comparison.log`). This is not a clean App typecheck claim.
Those pre-existing diagnostics are outside the five accepted repairs and were
not modified. No package/runtime version, user environment, product provider
discovery, Text migration, or unrelated inherited change was rewritten.

The separately authorized [Pen handoff type diagnostics plan](pen-handoff-type-diagnostics-plan.md)
subsequently resolved those 152 diagnostics and preserved the focused Pen browser
behavior. That evidence supersedes this diagnostic limitation only; it does not
turn the five-fix task into a full App typecheck or full-suite claim.
