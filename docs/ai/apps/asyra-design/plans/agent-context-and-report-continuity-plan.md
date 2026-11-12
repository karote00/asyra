# Plan: Agent Context and Report Continuity

## Status and task boundary

The active follow-up is [Terminal handoff and recovery contracts](#terminal-handoff-and-recovery-contracts).
The earlier conversion task passed its selected cases but did not establish the
whole-flow invariant. Upstream review traced the remaining failures to result
packaging, implicit schema conversion and loss of invocation contract identity.
Earlier rendering work and immutable live evidence remain unchanged.

## Terminal handoff and recovery contracts

November 11, 2026. Status: implemented; focused checks passed. The dependency
classification and shared-check follow-ups passed; full-local now stops at the
Asyra Design result-contract tests described
below. This approved follow-up supersedes the
previous closure claim for the complete handoff, while retaining its evidence.
Work in the existing feature worktree and preserve unrelated dirty changes.

The complete-path review added eleven permanent cases: ten failed and one passed;
231 existing focused cases passed. `continuity-review-boundaries.log` and
`continuity-review-provider.log` record the failures and actual provider packets.
The four defects share terminal ownership gaps: invalid-input early return bypasses
Host result validation; reconstructed delivery failures escape final validation;
non-root delivery merges recovery-only payloads into partial results; registered
composition recovery validates projected child values with raw child contracts.
`resultStage: host` remains an unused descriptor field, not an active consumer.

### Bounded implementation and review

Scope is App invocation/Host, declared model delivery, library recovery, discovery,
provider consumers, their formal tests, and owning spec/Inspector documentation.
Preserve independent execution/delivery/storage, valid partial and failed-prefix
receipts, exact owner revisions, resource release, correction and no replay. Remove
superseded metadata and contract alternatives without compatibility or relaxed
validation. Do not change geometry/rendering, model prompts, live evaluations,
release flows, dependencies, environment or remote Git state.

1. **Admission and terminal validation - compose.** Route invalid-input replies
   through Host validation using the canonical admission failure contract and
   explicit failed/not-started acknowledgement. Do not acquire resources or execute
   owner work for rejected input. Preserve actionable owner correction diagnostics.
   Validate diagnostic envelopes and acknowledgement agreement at their owner;
   middleware flags cannot override evidence. Review copied, mutated and ordinary
   rejections and verify zero owner calls and unchanged resource counts.
2. **Declared model results and failure construction - compose/provider handoff.**
   Keep partial/recovery view alternatives status-specific. A reconstructed delivery
   failure must itself pass its declared failure schema. Include execution evidence
   only when it can be delivered under that schema; retain truthful settlement and
   explicit delivery failure when evidence cannot be projected. Never weaken the
   successful view or silently turn recovery-only data into partial data. Use the
   existing delivery-failure owner, not another transport fallback or replay path.
   Review direct/registered routes, object/scalar roots, missing views and failure
   reconstruction; verify actual provider content and acknowledgement together.
3. **Composition recovery and metadata - compose.** Derive model recovery contracts
   from the same selected child owner/revision used to project recovery values.
   Raw recovery retains raw schemas. Consume the existing library recovery builder
   with its projection hook; no second registry/cache or caller-managed schema.
   Remove unused resultStage metadata and its obsolete assumptions. Review single
   tools versus composed partial prefixes and failed storage; preserve source-call
   counts and successful data.

Each step starts from formal red regressions, finishes focused tests and handoff
review before advancing, and updates old tests without deleting their invariants.
New internal helper names belong to the existing invocation/delivery owners; no new
persisted identities. Keep invocation-bound validation reuse; new failure data gets
its own validation rather than reusing the original result proof.

After all focused checks, review registration -> discovery -> raw inspection ->
resource handoff -> model projection -> recovery -> native provider packets using
current contracts. Only then run the repository full-local validation entrypoint,
with its existing guards. Full test failures are evidence, not permission to widen
production mutation scope. Release/publication and live 101 remain excluded.

### Implementation and focused review

All three steps are implemented. Rejected input now receives canonical failure
validation without acquiring resources or executing the owner. Boundary failure
construction also validates its envelope before any provider delivery. Model
failure reconstruction validates the new payload and includes only evidence allowed
by the declared view. Partial and recovery alternatives remain status-specific.
Composition recovery uses each selected child's model contract, preserving its
qualified identity and revision; the unused resultStage descriptor is removed.

Self-review added regressions for unknown tools and malformed boundary evidence.
It also caught a qualified-name overwrite during recovery conversion and a legacy
test receipt missing its required actionName. The name is preserved, and the test
now uses a valid receipt without removing its partial-execution assertions. No
validator or declared schema was weakened.

Focused evidence is under `tmp/conversation-improvements/terminal-handoff-*`:
246 invocation/Host/result/recovery cases, 26 actual provider-packet cases, 25 image
delivery cases, and 1,163 discovery/schema audit cases passed. Earlier owner-slice
checks cover library controls, leases, evaluation stopping and model delivery.
Flow-proof type checking passed. The bounded whole-path review covers registration,
discovery, admission, raw inspection, resource handoff, model projection, recovery
and provider delivery. Formatting, diff checks, naming (15 tests) and Inspector
checks (2 tests) passed. Scoped lint has zero errors and one existing console
warning in the provider test.

### Full-local result

Ran `yarn validate:full` after the focused checks and complete-path review.
Evidence: `tmp/local-validation/20969a4e-ad06-445c-b102-64805f81a527/result.json`.
Source verification passed. Security audit passed; dependency validation then
failed and the runner stopped before the other planned checks.

The E2E-only `apps/asyra-design/e2e/hierarchy-handoff-probe.ts` imports
`@asyra/reactive-events`, which is already declared in the App's devDependencies.
`scripts/deps-validate.js` recognizes test/spec filenames and tests/mocks
directories but classifies this probe as production source. Its importing consumer
is `e2e/hierarchy-projection-updates.spec.ts`. This is a test-helper classification
gap, not an absent installation or a failed tool-handoff regression. The validator's
six unit tests passed but do not cover this E2E helper path.

Do not claim full-local success. No validation was bypassed, dependency moved,
release flow run or unrelated production code changed. Correcting the E2E helper
classification requires a separately scoped follow-up; preserve production import
enforcement. The remaining full-local checks have not run.

### E2E helper dependency classification follow-up

The user authorized correcting the dependency classifier and retrying full-local
validation. Scope: `scripts/deps-validate.js`, its permanent regression tests and
this plan. Classify the workspace-root `e2e/` test directory, including browser
helpers, as test source; still inspect every import and require a declared owning
package. Preserve production dependency requirements outside that directory,
existing test conventions and nested-workspace ownership. Do not move dependencies,
skip files, add package exceptions or change App/runtime/Inspector behavior.

First reproduce the real helper failure in a formal regression, then cover nested
helpers, undeclared imports, public subpaths, similar directory names and production
paths. Review the bounded diff and run dependency, lint and naming checks before
retrying `yarn validate:full` with its original guards. Unrelated full-local failures
remain evidence and do not authorize broader corrections.

The two positive regressions failed before the classifier change while eight
existing/negative cases passed. After the correction all ten cases passed and the
formal dependency scan passed across 29 workspaces. Scoped lint and naming (15
tests) passed. Review confirmed that imports are still parsed and checked against
their declared workspace owner, no files are skipped, and production paths remain
strict. Evidence: `tmp/conversation-improvements/e2e-dependency-*`.

The full-local retry completed with failure at shared checks, retaining the
runner's stop policy. Evidence:
`tmp/local-validation/b29ae1d7-51ac-44e8-8591-f7b9601ae5e4/result.json` and
`shared.json`; source verification passed. Security audit, dependencies,
build-graph and declarations passed. Shared naming passed; lint reported 138
errors across nine pre-existing App test files, and repository scripts reported
seven failed tests. None is in the dependency classifier or its tests:

- The generated-template script exclusion expectation omits `test:live:taipei-101`.
- A tracked November 4 drawing report contains an absolute home path.
- Four documentation checks reject stale `docs/public/generated/package-reference.json`.
- The public source-map test rejects an outdated hash for
  `apps/asyra-design/server/local-operation-tools.ts`.

The full-local retry has not passed; subsequent workspace and E2E gates did not
run. No unrelated files were reformatted, dependencies moved, validation skipped,
or compatibility exceptions added. Follow-up corrections to these shared-check
failures are outside this dependency-classification task.

### Shared-check correction follow-up

The user authorized correcting the 138 lint errors and seven failed tests from
the full-local run above. Scope is the nine named App test files, the template
exclusion regression, the authored November 4 report links, current public
documentation generator outputs and this plan. Preserve test behavior and strict
validation; remove unused test scaffolding rather than suppressing rules. No
runtime/Inspector changes, dependency moves, compatibility, publication or live
drawing runs. Existing failed lint and formal test evidence is the baseline.

Verify the benchmark command and its contract test depend on the excluded
`test-data/ai-drawing` directory before updating exact template expectations.
Convert authored artifact links to portable relative paths without touching
original AI evidence. Regenerate public documentation through its canonical
generator; retain byte/hash assertions. Review automatic formatting separately
from unused-code removal and control-flow changes. Run the nine focused App
test files and affected script/documentation tests, lint and naming, then retry
full-local with unchanged guards. New unrelated failures require separate scope.

Review found 131 automatically correctable style errors, unused imports and one
unused helper, a non-null assertion and a nested conditional. Removed unused
scaffolding, made the missing-tool failure explicit and preserved conditional
precedence. The nine test files retain all their test declarations.

Executing these files exposed 21 failures in three existing consumer suites:
they still expected Host acknowledgement inside owner data. Migrate these tests
to the current separate data/outcome boundary, preserving all fixed status,
settlement, data, call-count and no-replay assertions. One observed-prefix fixture
also lacked its required actionId; use a valid receipt, preserve the owner's
failed application data and assert the invocation's partial/unknown acknowledgement
separately. No product contract or validation changed. All 133 App cases now pass.

The template test now verifies the real benchmark command and excluded data/test
paths, while retaining exact exclusion-list assertions. All ten portable report
links resolve to their original artifacts without rewriting those artifacts.
Generated package/API/content/source-map outputs were rebuilt from current sources
using `yarn docs:public`; deterministic checks remain unchanged. All 116 affected
script/documentation cases, App server type checking and public-documentation
freshness checks passed. Evidence: `tmp/conversation-improvements/shared-fix-*`.
Full-local retry follows final lint and naming checks.

The retry finished at
`tmp/local-validation/0d5f9696-32b8-4dff-84ca-a44bb4ee8704/result.json`.
Source verification passed. Security audit, dependency validation, build graph,
declarations, all shared checks and the `@asyra/ai-agent-runtime` workspace passed.
Full lint reported zero errors (110 warnings); the original seven script failures
are resolved. No scripts, tests or gates were skipped to obtain those results.

Asyra Design's first AI test stage ran 803 cases: 798 passed and five failed in
five files outside the nine-file correction above:

- `core-owner-results.integration.test.ts`: real Core result delivery expects a
  different result envelope.
- `identity-and-composed-receipts.integration.test.ts`: the test discards the
  invocation acknowledgement and then reads `native.toolOutcome.status`.
- `interrupted-design.integration.test.ts`: descriptive brief capacity expects
  two inline status objects but receives undefined.
- `non-core-owner-results.integration.test.ts`: real non-Core result delivery
  disagrees with the expected result envelope.
- `structural-delivery.test.ts`: observed fill projection disagrees with the
  expected inline acknowledgement.

These are recorded failures, not an assertion that all five are stale tests.
Their owner contracts and actual handoffs need review before correction. Full-local
remains failed; later workspace/E2E checks have not run. The owned runner exited
with no retained process groups. No runtime behavior, validator, compatibility path,
remote Git state or release operation changed in this follow-up.

### Native result consumer correction follow-up

The user authorized resolving the five remaining failures, reviewing the actual
upstream/downstream handoff and iterating without another inspection checkpoint.
Scope: those five AI integration suites, their result/invocation/projection owners
if a proven defect requires correction, direct contract regressions and this plan.
Use the existing spec and Inspector compose/apply contract: unchanged owner data,
separate invocation acknowledgement, declared model projection and no replay.
Do not restore inline Host fields, weaken schemas, skip validation or add compatibility.
Preserve mutation scopes, partial/failed states, resource ownership and undo/redo.

The failed full-local run provides the red baseline. Trace every expected field to
its owner before edits. Current evidence locates all five mismatches in consumers:
native tests discard the acknowledgement; compact projection tests demand raw
metadata after the declared public projection. Preserve expected states explicitly
at their actual boundary and all data/history/call-count assertions. Review the
five files and run their focused suites, direct provider-boundary regressions,
relevant type/lint/naming checks, then full-local. Iterate related result-contract
failures exposed by these gates within the same owner boundary; do not turn this
into unrelated runtime, rendering, release, dependency or environment work.

The user's additional review applies to all 20 test files modified in these recent
handoff, dependency, shared-check and native-consumer corrections. Retention follows
current behavior, not the age or number of tests. Keep necessary coverage for
strict admission/projection, failure recovery, saved data, optional reference use,
absence of mandatory approval, history, dependency ownership and template isolation.
Negative legacy-field checks prevent reintroduction; historical input fixtures are
immutable evidence adapted explicitly by test setup, not production compatibility.

Re-review removed the obsolete inline acknowledgement example from the internal-only
projection test; it now validates the actual empty projected value. Replace the new
part-outcome helper assertion with independently expected completed steps and real
application receipts, plus the separate invocation outcome and persisted geometry.
Raw rejection tests check their declared unavailable/not-started fields directly.
The underlying current behaviors still need coverage; obsolete field expectations
and unused scaffolding do not. No dual old/new acceptance or fallback helper is added.

Review confirmed no missing product data: Core/non-Core native replies preserve
their owner values and explicit outcome; the identity test had discarded the
reply envelope. Ordered parts are interpreted by the same canonical outcome owner
used during composition. Compact fill delivery preserves public status/settlement,
while the original observation retains its internal metadata and mutation scope.
Tests now assert those separate boundaries, including success, no-change, rejection,
partial mutation and no replay. Native owner tests explicitly reject reinjected
Host fields. No product implementation, schema or compatibility behavior changed.

All 35 cases in the five suites and 26 selected actual-provider-packet regressions
passed. App browser type checking and scoped lint passed; naming and final diff
review precede full-local. Evidence: `tmp/conversation-improvements/native-consumer-*`.

Full-local `37bd59a2-152d-4ca0-8c8b-723d5fa7850f` passed shared checks,
runtime checks and all 803 frontend AI tests. Its subsequent server stage exposed
142 failures in 19 files (3,189 passed, 14 skipped). The next bounded iteration
groups these by the existing handoff owner, rather than repairing assertions in
isolation: (1) strict failure construction and selected model contracts, (2) native
owner values versus separate acknowledgements, (3) immutable recorded scenarios
expressed as current input and delivery selections, and (4) actual provider content
items and recovery. Browser-only test dependencies must be isolated explicitly.
First investigate schema failures and provider interruption before migrating
consumers. Preserve meaningful execution, resource, history and no-replay oracles.
Remove generic historical-input normalization and obsolete Host-field selections;
use explicit current requests with recorded geometry. Do not invent an inline
acknowledgement helper or a dual-format result decoder. Validate each owner group
with focused Node/browser suites before another full-local run.

The full red baseline identified four implementation defects, not stale assertions:
scoped registered discovery omitted its delivery-failure schema; missing-owner
delivery failure generated an empty `anyOf`; targeted action receipts embedded
local references at the wrong root; evaluation still required inline Host metadata
on completed parts before allowing a later input correction. Correct these in
their existing schema/composition/evaluation owners. Missing evidence uses a false
schema, not permissive acceptance. Targeted receipts use the existing schema
embedding utility at every envelope boundary. Evaluation uses canonical action
outcomes with nonempty receipt evidence; missing, unknown and failed inspection
prefixes remain stopping conditions. The provider replay and new focused failure
tests establish the red baseline; preserve their negative controls.

Historical result selectors for `/toolOutcome` are no longer valid data selection.
Keep recorded geometry, portable IDs and source retention; remove those selectors
from current requests and assert the independent invocation acknowledgement.
The provider harness reads value and acknowledgement from separate native content
items, including follow-up callbacks. A content-delivery failure fixture must pass
owner schema validation and inject failure at the content adapter, rather than supplying a
malformed URL that correctly fails earlier admission. No timeout increase or
validation bypass is used to conceal that distinction.

The native reference replay also exposes a transport-boundary defect: delivery
repackaging applies the browser batch evidence schema to native reference data,
which intentionally has no browser action IDs. Reuse the existing canonical
model-delivery failure constructor and the invocation-pinned model contract at
the provider content boundary. Retire the separate transport failure code rather
than accepting both shapes. Validate the retained native value with its own
contract, preserve execution settlement, and prove actual provider content and
successful continuation. No synthetic action IDs or broader receipt union.

A sixth defect appears in the real interrupted batch replay: the failure branch
bypasses the normal owner result preparation, omitting the required batch summary,
and uses the pending action's not-started settlement for the whole execution.
Step: operation result handoff; inputs are the original submitted batch and observed
browser receipt; outputs are the canonical result plus its aggregate settlement.
Use one preparation path for both completed and interrupted receipts, preserve
child failure settlement, and validate the delivered prefix against acquired usage.
The internal batch summary participates in owner validation; public failure
projection still exposes only declared recovery evidence, not that internal summary.
The regression must prove one mutation completed, the other remains pending,
malformed retained data rejects, and recovery executes only the pending suffix.
No new schema alternative or replay fallback. Run focused batch/invocation/provider
regressions, bounded review and full-local after all current consumers pass.

The bounded re-review covers 36 App test files and the two previously changed
script test files. Retained cases still verify current behavior; obsolete inline
acknowledgement selectors, historical-input normalization and duplicate retired-plan
variants are removed. Native partial fixtures now carry consistent execution,
delivery and outer outcomes, with explicit rejection of contradictory states.
The 22-file consumer run passed 1,246 cases with one batch failure; its corrected
batch suite now passes all 24. The final operation/invocation/provider/recovery
regressions pass 526 cases (one existing skipped case). App/server/proof type checks,
scoped lint, naming and diff review pass. Full-local is the remaining closure gate;
no completion claim is based on those focused results alone.

Full-local `cc57edfd-8c38-487b-82da-9d70f1bcb91c` passes shared checks,
Runtime, all 803 frontend AI cases and 3,332 server cases (14 existing skips).
The later browser ownership suite reveals five stale native acknowledgement
assertions in `local-query-artifacts.test.ts`. Its query-to-fill and structural
ownership coverage remains necessary: preserve real owner calls, partial prefix
handling, lease disposal, retained receipt lookup and exact mutation counts.
The next consumer-only step retains the actual invocation envelope and checks
its separate outcome; raw domain receipts stay unchanged. No product schema or
compatibility change. All 15 cases pass; scoped lint, server type checking and
bounded diff review pass. Run full-local again on the corrected source.

Full-local `34a94b66-5341-4c69-8a46-6cd313a69904` passes every workspace
and FieldScope profiles. Control-plane finishes with 617 passes, 57 existing skips
and 11 failures, all caused by the removed `local-design-review.ts` still listed
in the current Design functional responsibility manifest/Inspector. Existing
source-existence and real Playwright-fixture tests detect this upstream defect.
Revised bounded step: reconcile `inspect-design` responsibility sources and its
exact executable case inventory against current inspection implementation and
`functional-failure-responsibilities.md`. Remove retired source/case references;
keep current observation freshness, mechanical validation and AI final verification.
Update only the functional manifest, its Inspector, generated workspace bundle and
this plan, plus directly necessary regression tests. No restored module, missing-file
skip, relaxed source validation or historical report rewrite. Preserve all 11
failure/recovery/attachment tests; they remain necessary. Run exact discovery and
Playwright evidence suites before another full-local run. This source mapping step
replaces assertion migration as the current failed boundary; no unrelated runtime
or tooling feature work is authorized.

Exact current Playwright discovery contains 530 cases while the stale manifest
contains 520: one retired mandatory-review case is removed, two renamed cases
retain their identities, and eleven additional cases are mapped to their actual
conversation, execution, inspection, navigation and render owners. Extend only
those existing responsibility boundaries to include their current producers,
including recording framing and GPU observation helpers as evidence producers,
not alternative product owners. Update the functional responsibility spec and
semantic mapping regression alongside the manifest/Inspector. This is current
coverage reconciliation, not restoration of the removed review protocol.

Functional mapping regressions pass: 75 tests, no failures, 44 existing opt-in
skips. Exact discovery and semantic responsibility checks pass after final review.
The 13 current browser cases first detect a stale live-service boundary: ports
3045/4145 belong to this worktree but have been running for three days; browser
Pixi is 8.20.1 while installed/locked and current prebundled files are 8.22.0.
Keep the version identity assertion. Validate using newly owned test services on
3057/4157/4257, without modifying persistent `.env` or stopping the retained session.
Use the same isolated service environment for the final full-local run. Service
identity and cleanup are test execution requirements, not product compatibility.

All 13 reconciled browser cases pass against newly owned current-version
services (1.2 minutes); the services are reaped and ports are released. The first
isolated attempt incorrectly set CI, which disables local server startup in the
existing config; rerunning in ordinary local mode fixes invocation only. No source,
assertion or version check was relaxed. Complete the previously unexecuted functional
E2E gate before another full-local run, to expose remaining current-consumer issues
without repeatedly traversing already validated expensive owners first.

Functional E2E reaches 234 passes and stops at the referenced partition recovery
case. Its scripted server reads removed inline Host metadata from unchanged owner
data, throws inside its own assertion and destroys the stream; App partial status
correctly reflects that interruption. Retain this real preparation, recovery,
collaboration, history and durable-reload case, but preserve `invokeLocalTool`'s
reply envelope and assert its separate outcome. Exact invocation/outcome search
in E2E finds only this file's two stale reads; host consumers do not read inline
acknowledgements. No product/timeout/assertion-strength change. Run the whole
construction E2E file, scoped lint/type checks, then resume the formal functional
gate before full-local. This is the same current result-consumer correction boundary.

The construction consumer correction preserves the invocation reply separately
and keeps all native outcome, partition, mutation-count, history and durable reload
assertions. One focused attempt overlapped test-file lint edits and lost its mounted
conversation panel; with source frozen the unchanged failing case passes in 28 seconds.
Keep source frozen throughout browser verification. Scoped lint and App types pass;
rerun all nine construction cases before continuing the full functional preflight.
No timeout increase, retry allowance or compatibility acceptance.

The frozen functional preflight passes 491 cases before the mechanical-repair
consumer demands an inline Host outcome in an object matcher. The earlier
property-read-only search missed this assertion form. Review complete invocation
consumers, including matchers, rather than relying on field-access searches.
Keep all five mechanical modes and their independent checks, recovery, history,
collaboration and durable reuse. Read invocation outcomes from the real reply and
owner values from its text; do not inject fields or accept either representation.
Owner-declared workflow/action/failure outcomes remain valid domain data and must
not be mechanically removed. Run all five modes and the functional gate before
the final frozen full-local run.

The remaining provider-prefix E2E preserves correct completed and rejected parts,
but expects an injected child acknowledgement absent from the current preparation
owner. Actual recorded output declares `available:false`, `settlement:not-started`,
`recovery:correct_input`, no completed steps and the retained draft. The deterministic
provider peer discards the separate final acknowledgement. Retain the test: capture
that exact provider content item, assert aggregate partial/partial and repaired
success/completed, and assert the rejected owner's explicit fields. Preserve
mutation counts, no-prefix-replay, undo/redo and durable reload. No inline-outcome
fallback or product/schema change is required.

Focused closure before the frozen full-local run: all five mechanical recovery
modes pass; the provider-prefix, repeated-detail and recording-framing file run
passes all five cases. The preceding tail run passed the other 27 cases, with two
existing skips, before exposing the corrected provider consumer. Construction
passes all nine cases; scoped lint, App types and naming pass. These focused runs
are diagnosis evidence, not a substitute for one full-local result on the final
source. Preserve all formal fail-fast and resource guards. Use isolated fresh App
services so retained user sessions cannot supply an older runtime.

Full-local run `08a0193d-77af-4c33-b46d-10cd4f553f25` verifies its source and
passes every workspace, profiles, control-plane tests and collaboration E2E. Board
E2E exposes one stale owner-count assertion: three injected scenarios correctly
fail the exact manifest case set, including the report case now owned by `settle`.
The Board therefore marks compose, apply, inspect and settle; the test hardcodes
three. Re-audit confirms the current settle Inspector owns bounded work/report
handoff and the executable report proof verifies it. Do not move the case back or
change product mapping. Revised bounded slice: this Board test and this plan;
assert the exact failed owner set derived from the manifest's expected cases,
including history/recovery, instead of a historical count. Existing full-local
failure is the red baseline. Run the focused Board case, its complete file, lint
and naming, then rerun full-local on frozen source. Review remains limited to this
mapping consumer and the prior frozen gates; no new repository-wide cleanup.

The Board correction passes its failing case and all 19 cases in the complete
localization file, with no skips. Current and historical observations must equal
the expected manifest owner set; cleared recovery still requires zero failed
observations. Scoped lint, naming and diff review pass. Freeze this source and
rerun full-local; earlier full results remain failed evidence, not combined success.

## Canonical result and contract continuity

November 11, 2026. Approved implementation in the existing
`codex/ai-conversation-improvements` worktree. Preserve the dirty predecessor;
no branch replacement, compatibility path, remote operation or wider closeout.
Status: complete with focused validation.

### Upstream findings and task contract

Runtime already inspects a value alongside an explicit outcome. App invocation
then merges host acknowledgement into object values, uses a separate channel for
non-objects, and downstream code reconstructs outcomes from those values. This
breaks exact owner values and loses execution state during projection/failure or
native delivery. Supported raw-schema vocabulary does not prove automatic
hidden-field projection preserves its semantics. Discovery pins a selected tool
contract while model egress can independently rebuild a generic wrapper contract.
Identity/text-only validation proof also lacks the producing invocation identity.

Evidence: `receipt-boundary-review-*.log` records 434 passing and 27 failing
focused cases; `upstream-result-contract-*.log` isolates Runtime's correct
inspection from App conversion and provider state loss. These are permanent
regressions, not 27 independent defects. Keep the previous 23-case regressions.

Scope: canonical App invocation, Host/registered execution, output declaration and
projection, provider delivery, direct Runtime/schema/sequence/result/media consumers,
formal tests, owning App spec/Inspector and direct API guidance. Preserve raw
input/output validation, partial execution, independent storage, resource ownership,
images, cancellation, retained results and no replay. Do not modify renderer,
geometry, live 101/report sessions, release tooling, dependencies or environment.
Only focused tests; no full-local gate. No prompt-only fix or new mandatory AI step.

### Ordered owner steps and handoffs

1. **Data and execution state - Inspector compose.** App invocation consumes the
   admitted owner definition, input and call identity; validate unmodified owner
   data with Runtime's explicit outcome. Keep the acknowledgement alongside every
   JSON value, never inject Host fields into business data. Existing domain-owned
   status fields remain domain data. Carry identity/contract/validation proof on
   this boundary and invalidate reuse for changed bytes, outcome or invocation.
   Library/sequence/cleanup consumers use that explicit state. Failure reporting
   preserves known settlement; provider state must be model-visible for every
   root shape. No old inline-vs-side-channel fallback.
2. **Raw and delivered contracts - Inspector compose.** Stop rewriting arbitrary
   owner schemas merely to accommodate Host acknowledgement. Original values use
   original constraints; changed model views use declared delivery contracts.
   Internal-field owners must declare their external shape when projection changes
   semantics; do not silently weaken const/enum, exclusivity, negation or uniqueness.
   Reuse the current delivery declaration and field selection owners rather than
   add a second registry. Migrate current declarations and tests together; no
   compatibility alias for superseded packaging or implicit projection assumptions.
3. **Invocation contract to provider - Inspector compose/apply consumers.** Resolve
   the selected tool/revision and owner/model contracts for the invocation, preserve
   that selection through library projection and final transport, and validate the
   actual status-specific model value. Execution state, delivery acknowledgement
   and saving status have different owners; incomplete delivery never reclassifies
   execution. The native protocol uses supported content fields to deliver value
   and acknowledgement, without inventing native RPC fields. Discovery and delivery
   consume the same contract selection. Proof is bound to its producing call and
   contract; independently authored tests assert actual payload/state semantics.

For each owner step, first verify failing formal cases, implement its upstream and
direct consumers, review invalid and legal partial cases, and run its focused
checks before advancing. Update superseded spec/Inspector clauses, not append
contradictory alternatives. Runtime remains composition/inspection owner; App owns
publication and delivery; lease/storage owners remain unchanged. Names are internal
owner-neutral contract names; no new persisted IDs or automatic migration. Reuse
existing validation evidence only for its exact immutable provenance; no new cache.
Prove one owner execution and existing resource-release counts on failure/recovery.

### In-scope handoff review and refinement

The implementation review distinguishes execution outcome from delivery outcome.
A selected registered invocation can execute successfully while its projected child
is partial, or deliver successfully while saving fails. Its model receipt therefore
carries `deliveryOutcome` beside `execution`; model-only branches validate the value
by that delivered state without rewriting the execution state. Raw branches remain
unchanged and cannot admit the model-only failure alternative as success data.
Generic invocation diagnostics keep their own outer fields; a tool projector owns
only its embedded execution result. Known execution evidence carries
`executionOutcome`, after validation and before resource transfer. Invalid or
undecodable evidence cannot establish completed execution.

The existing field-visibility annotation remains an explicit structural declaration.
The removed implicit behavior is semantic schema rewriting: counts, dependencies,
constants, enums, exclusive/negative alternatives and uniqueness must not be guessed
after dropping fields. Such declarations require an explicit `delivery` view and
fail publication when missing. Plain record-field visibility stays supported with
strict raw validation. A root JSON Pointer selects a declared whole-result view;
it does not change the original schema. Current declarations and older positive
tests migrate to explicit views rather than weaker schemas or compatibility rules.

The Host selects the model contract before effects, then attaches that authoritative
selection after invocation middleware. Middleware cannot substitute a schema.
Existing formal tests exposed both a copied failure's lost state and a forged model
contract; the regression cases remain permanent. Invalid sequence admission stays
with canonical admission; projection cannot replace its correctable-input recovery.
Provider tests inspect actual native content, including the separate acknowledgement.
A two-revision regression exposed one remaining name-only lookup: a successful
revision 1 result was projected with revision 2 fields. Forward the selected
revision through registered and sequence child projection, including recovery;
never substitute the latest registration. This is the same invocation-identity
boundary, not a compatibility route.
These refinements stay within the same three owners, exclusions and focused gates.

### Required proof and stop conditions

Run the 27 failures plus existing result/projection, Host/invocation/lease/library,
Runtime contract/recipe, selected provider and exact discovery, retained-result and
native image tests. Update old inline-result and automatic projection assumptions
without deleting invalid-input/output, partial-work or no-replay assertions. Test
model-visible state separately from Host progress. Scoped types, lint, format,
naming and Inspector checks also apply. A rule cannot expand this scope; unrelated
prerequisites stop for scope review. Do not claim live AI or full-app validation.

### Implementation and focused validation

All three owner steps are complete. Raw values now travel with an explicit
acknowledgement for every JSON root. Validation evidence binds the exact call,
owner, bytes and outcome. Selected model contracts are resolved before effects and
cannot be replaced by middleware. Registered receipts distinguish execution,
delivery and storage; child projections retain the selected revision and are not
selected twice. Original raw validation and final status-specific validation remain.

Removed the Host schema decorator, injected acknowledgement fields, old stage
arguments and implicit semantic hidden-field rewrites. Structural visibility remains
an explicit field declaration; semantic views require a declared delivery schema.
Updated direct consumers and former positive tests; no compatibility path, success
fallback, new mandatory model step or weakened validation was introduced.

The final self-review covered valid and invalid output, foreign validation proof,
partial execution, successful execution with failed saving, resource handoff and
cleanup failure, scalar/null/image delivery, middleware contract substitution and
two registered revisions. The two-revision case failed before the last correction
and passed afterward without executing the source twice. It is retained as a formal
regression, alongside the original 27 failures and the previous 23-case coverage.

Focused evidence is under `tmp/conversation-improvements/` in this worktree:

| Boundary                                                  | Passing cases | Evidence                                  |
| --------------------------------------------------------- | ------------: | ----------------------------------------- |
| Whole-result regression, Host and library controls        |           168 | `canonical-revision-after.log`            |
| Invocation, library, leases and selected-prefix recovery  |           115 | `canonical-lifetime-verified.log`         |
| Projection, retained handoff and delivered model boundary |            46 | `canonical-projection-verified-final.log` |
| Runtime contract and recipe checks                        |            79 | `canonical-runtime-final.log`             |
| Actual native provider result/state packets               |            21 | `canonical-provider-verified-final.log`   |
| Provider high-level usage and real owner execution        |             2 | `canonical-provider-preparation.log`      |
| Image delivery and evaluation input correction            |            46 | `canonical-image-evaluation-final.log`    |
| Opt-in native image interface                             |             3 | `canonical-native-image-final.log`        |
| Exact discovery audit and supported schema constraints    |            16 | `canonical-audit-recheck-final.log`       |
| Retained mapping after saving failure                     |             2 | `canonical-remaining-consumers-final.log` |
| Retained image and named-result execution proofs          |             2 | `canonical-consumer-review-final.log`     |
| Model delivery cost check                                 |             1 | `canonical-model-boundary-final.log`      |

The retained mapping and execution-proof logs include initial harness/selection
failures; their named final cases passed. The execution proof mock now preserves
unmocked Node exports and still substitutes spawn. The cost check shares its log
with three model-boundary cases already counted above. This table does not count
excluded tests or sum repeated runs.

Scoped TypeScript, ESLint, formatting, naming and Inspector checks complete the
bounded gate. ESLint has no errors; four existing console warnings remain in the
selected provider/proof files. No full-local, live 101, release, remote operation,
renderer change or report-session mutation was performed. This establishes the
mechanical handoff contract, not live model behavior or whole-App correctness.

## Complete result conversion and state handoff

November 11, 2026. Approved implementation on the existing
`codex/ai-conversation-improvements` worktree, preserving its dirty predecessor at
`036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82`. Status: complete with focused validation.

### Analysis and bounded task contract

The reviewed path is declaration/admission -> discovery -> owner execution ->
Host acknowledgement -> selected data/storage -> provider transport -> cleanup
and recovery. Evidence is retained under `tmp/conversation-improvements/` as
`receipt-flow-audit-*.log`; 376 focused cases passed and 23 failed. The failures
are five product boundaries, not 23 independent defects:

- Outer partial acknowledgement incorrectly selects the owner's partial payload
  schema even when execution succeeded and only storage/delivery is incomplete.
- Native error construction reparses malformed JSON and can bypass call cleanup.
- Accepted non-object result schemas cannot pass the object-only App packaging.
- Internal-field projection removes properties but leaves conflicting property
  counts and dependent requirements in the published schema.
- Transport success can contradict the validated acknowledgement after wrapping.

The obsolete projection test also expects unsupported pattern/conditional rules
to validate. Preserve its domain-key projection intent using admitted schemas,
and explicitly retain unsupported-rule rejection. Equality audits reuse production
schema generators; keep them for drift detection, not as independent correctness
oracles. Direct execution and provider tests must assert behavior independently.

Scope: App tool invocation/Host, registered result envelopes, result projection,
provider transport, their existing runtime consumers and formal tests, and owning
specification/Inspector/docs. Preserve strict raw input/output validation, legal
partial work, independent saving, original data shapes, resource lifetime, native
images, cancellation, selected fields, named reuse and no replay. No compatibility,
prompt change, new dependency/cache, geometry/rendering work, live model/101,
full-local test, release work or remote operation. Unrelated required changes stop
this task for scope review. Final review stays within this complete path.

### Ordered owner execution cards

1. **State handoff - App Inspector `compose`.** Owner: invocation envelope and
   Host transport. Validate payloads by their actual execution status; separately
   constrain outer acknowledgement and same-execution settlement. A successful
   payload remains a success payload when storage fails. Derive transport success
   from validated outcome rather than a copied flag. Preserve independently settled
   child recovery and strict invalid-result rejection. Prove the distinct partial
   shape and flag cases through discovery, internal calls and actual provider RPC.
2. **Result conversion - App Inspector `compose`.** Owner: raw invocation and
   canonical result schema/projection. Keep accepted arrays/scalars/null intact
   through direct and registered routes, with explicit outcome metadata at the
   Host boundary; do not infer product success before validating owner output.
   Transform internal-field constraints together with fields, retaining strict raw
   validation and public field constraints. Use the existing reference/context
   traversal and resource annotations. Preserve object results and declared views.
   Prove all admitted shapes, copied/identity replies, hidden field count/dependency
   cases, references, retained IDs and actual provider bytes. No version fallback.
3. **Failure settlement - App Inspector `compose`.** Owner: Host lifecycle.
   Decode once; retain successfully decoded evidence for error acknowledgement.
   Never parse failed bytes again to build an error. Close every opened scope even
   if result validation, resource transfer or failure construction fails. Keep
   original execution evidence, correct no-dispatch/uncertain distinctions,
   cancellation carriers, cleanup retry and one owner execution. Prove malformed
   JSON, resource transfer/cleanup faults, continuation and terminal disposal.
4. **Integrated independent proof - App `compose/apply` consumers.** Preserve
   existing success/partial/recovery, persistence, named reuse and image tests.
   Replace the obsolete unsupported positive oracle without relaxing admission.
   Add independent valid/invalid payload cases at real provider discovery and
   delivery, including crossed states and field projection. Exact schema equality
   is supplementary. All 23 baseline cases and affected normal paths must pass.

These steps use existing owner/consumer boundaries: Runtime handles composition
and result inspection; App owns schema semantics and transport; leases own resource
lifetime; storage owns saving. No model decision or diagnostic grants validity.
Reuse identity/text-bound validation only while its evidence is unchanged. Schema
conversion remains definition/invocation scoped; tests retain owner-call and cleanup
counts. Local names are owner-neutral internal helpers, with no new persisted ID.

Gates: the 23 failures; focused result, schema, Host, invocation, leases, library,
Runtime contract/recipe, conversation result and image suites; selected provider
RPC and exact discovery tests; three pinned offline native image cases; scoped
types/lint/format/naming and Inspector checks. Review each completed owner and its
handoffs before advancing. Do not claim whole-plan closeout or live-model coverage.

### Progress

- Baseline and design reviewed against current source, App spec and Inspector
  `compose` handoffs. The five defects are assigned to canonical owners above;
  existing invalid-result/no-replay tests remain required negative controls.

- State handoff reviewed: 16 targeted receipt cases and 57 existing library/Host/
  recovery controls pass. Selected real provider RPC cases pass (10), including
  distinct partial data, transport flags, non-object data and internal constraints.
- Result conversion reviewed: admitted JSON root shapes retain their values under
  identity and copied replies; explicit partial scalar outcomes and corrupted copy
  rejection pass. Counts/dependencies across inline, allOf and referenced contracts
  preserve valid output and reject missing/invalid public fields. The combined
  conversion run passes 93 cases; its sole remaining failure is the separately
  assigned malformed-JSON cleanup defect. Raw owner validation remains unchanged.
- Failure settlement begins after checking the existing compose lifecycle contract.
  Keep decoded evidence separate from undecodable bytes and release in finally.

### Implementation and review outcome

The original failures are retained as regression behavior:

| Boundary                                           | Baseline failures | Correction                                                                                        |
| -------------------------------------------------- | ----------------: | ------------------------------------------------------------------------------------------------- |
| Successful data with partial outer acknowledgement |                 2 | Select the payload by execution status; keep outer acknowledgement and storage separate.          |
| Malformed repackaged JSON                          |                 1 | Decode once, construct failure from decoded evidence only, release every opened scope in finally. |
| Non-object results                                 |                11 | Preserve raw JSON shape and carry the acknowledgement at the Host boundary.                       |
| Internal-field counts/dependencies                 |                 4 | Convert constraints with the fields, through composition and reference scopes.                    |
| Conflicting transport success flags                |                 4 | Derive the flag from the validated acknowledgement.                                               |
| Unsupported-schema positive test                   |                 1 | Replace with admitted variant/open-value schemas; explicitly reject unsupported constraints.      |

Review followed declarations through both registered and direct provider routes.
That exposed additional consequences of the non-object defect: direct progress
still expected inline object metadata, and a scalar delivery view lost its original
acknowledgement. Permanent regressions first reproduced both; their consumers now
use the same Host acknowledgement. The fake provider paging reader also assumed
JSON was never null; its parser now accepts null without changing product validation.
A nested reference with sibling property counts reproduced a missing projection
scope; the converter now resolves the original reference context. These are within
the same conversion/handoff scope, not separate tool capabilities or fallback paths.

Additional negative controls reject corrupted copied scalar data, changed outcome
metadata under identity/copy packaging, missing public dependent fields and invalid
public/hidden values. Published artifact cleanup is counted after malformed output;
resources release once and subsequent calls/disposal work. Successful mutations
with storage failure and independently settled partial children remain accepted.
No unsupported keyword is admitted and no owner constraint is bypassed to make a
model projection pass. Provider tests inspect published usage and actual RPC values,
not just equality between two calls to the same schema generator.

Final focused evidence is under `tmp/conversation-improvements/receipt-flow-*-final.log`:

| Focused suite                                                    | Passing cases |
| ---------------------------------------------------------------- | ------------: |
| Results, whole-result handoff, projection and conversation reuse |           123 |
| Host, invocation, leases, library, selected recovery and images  |           190 |
| Runtime tool contracts and recipe execution                      |            79 |
| Provider discovery, registered/direct RPC and delivered values   |            14 |
| Exact delivery audit and supported schema rules                  |            16 |
| Pinned offline native image transport                            |             3 |
| Total behavior cases                                             |           425 |

The three native image cases initially skipped by the ordinary image suite ran
separately with its existing explicit binary setting and passed. Other skipped
cases are intentional title selection, not failed checks. Inspector and naming
checks are separate from this total. Provider RPC uses the formal controlled backend
and real production App path; native images use the existing offline native harness.
This evidence does not claim live-model, 101, whole-app or full-local coverage.

Scoped TypeScript compilation, formatting/diff checks, the 15-case naming gate and
both Inspector contract cases pass. ESLint reports no errors; its three existing
console warnings are outside these changes. Final review covered the modified
conversion boundaries and their direct consumers, retaining strict rejection,
legal partial completion, saving independence and resource recovery. No commit,
push, compatibility route or additional mandatory model workflow was introduced.
This closes the bounded handoff task, not the wider plan.

## Host receipt validation and result branch consistency

November 11, 2026. Approved follow-up in the existing
`codex/ai-conversation-improvements` worktree, retaining its dirty predecessor at
`036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82`. Status: complete with focused validation.
This task does not close the wider plan.

### Evidence and bounded contract

The permanent whole-result review baseline had ten failures: four copied/mutated
invalid-status replies bypass native handoff validation, one of those paths can
acknowledge an already released request artifact, and five contradictory outer
outcomes pass published result contracts (three also pass host invocation).
The last two pass discovery but fail runtime selection. The recovery-only
correlation added previously does not protect success/partial branches.

Scope is native Host result validation/resource transfer and registered invocation
schema generation, their direct consumers/tests, this plan and the owning App
specification/Inspector. Preserve raw owner validation, valid partial prefixes,
successful execution with unsaved storage, cancellation, per-child recovery,
strict domain constraints and no replay. No compatibility, weaker validation,
prompt change, new cache, renderer change, live 101, full-local test or remote
operation. An unrelated required owner change stops this task for scope review.

### Ordered execution cards

1. **Host handoff - AI execution `compose`.** Input: owner-validated native
   reply, possibly reconstructed by execution instrumentation. Output: validated
   host envelope and transferred request resources, or `TOOL_HANDOFF_FAILED`.
   Reuse Runtime's existing result inspection to reject invalid outcomes before
   schema selection. Preserve identity/text-bound validation reuse; revalidate
   reconstructed envelopes under the projected host contract. Transfer resources
   only after valid output, release rejected resources once, never replay work.
   No new public identity or persistent state. Prove the five status/resource
   failures and valid artifact lifetime, raw output negatives, cancellation and
   stopped-successor controls before advancing.
2. **Invocation branches - AI execution `compose`.** Input: selected owner
   schemas; output: the same result alternatives for discovery and invocation.
   Discriminate success, partial and recovery branches by their actual outer
   status; correlate settlement across layers describing the same execution in
   every branch. Keep independent child recovery settlements and storage status
   independent. Reuse small schema conditions rather than duplicate owner payload
   schemas. Remove the recovery-only correlation path. Prove all five contradictory
   outcomes reject at discovery and invocation; retain valid partial/completed,
   declared recovery, unsaved storage and exact schema-audit controls.

The existing Inspector `compose` owner publishes and validates these contracts;
`apply` and provider delivery consume them without repairing receipts or executing
again. Runtime inspectors classify results; App validators own schema semantics.
Existing request leases own resource lifetime. Tests and model choices cannot
grant validity. Definition/invocation-scoped schema derivation and owner execution
counts remain unchanged; no new cache is authorized.

Gates: all ten permanent failures; focused Host/invocation/library/lease and
prefix-recovery cases; selected actual provider transport and exact usage audit;
flow-proof types, scoped lint/format/naming and affected Inspector contract checks.
Review each step's direct handoffs before advancing, then the bounded final diff.

### Progress

- Review baseline: `receipt-envelope-review-*.log` in the existing
  `tmp/conversation-improvements/` evidence directory. The previous blanket
  completion claim does not establish complete receipt validation; this task
  addresses its two reproduced gaps without undoing valid partial completion.
- Step 1 reviewed: canonical Runtime inspection validates reconstructed outcomes
  before selecting their host schema or retaining request resources. Unchanged
  identity/text-bound validation evidence still reuses completed validation. All
  five status/resource failures now pass, with 140 Host/invocation/lease/prefix
  controls passing. The five branch-consistency failures remain for step 2.
  Evidence: `receipt-handoff-fix-before.log`, `receipt-handoff-fix-step1.log` and
  `receipt-handoff-fix-step1-controls.log` in the same directory.
- Step 2 reviewed: every invocation result alternative now correlates settlement
  across the same execution. Partial output admits only a partial outer outcome;
  failed/unknown receipts use recovery validation. The old recovery-only condition
  is removed. The five contradictory combinations reject in both delivered usage
  and invocation. Successful-work/unsaved-storage, declared partial/recovery and
  aggregates with independently settled children remain valid.
- Final bounded verification: all ten original failures pass unchanged. The six
  result/Host/invocation/library/lease/prefix files pass 196 tests; composition and
  selected batch usage pass 78; actual provider transport passes five; exact usage
  and audit negatives pass six. The new provider cases use admitted data-plane
  fixtures and inspect the delivered contract and real native response, with one
  owner execution and no drawing dispatch. Flow-proof types, two Inspector checks
  and 15 naming checks pass. Scoped ESLint has no errors (one existing provider
  test console warning); formatting passes. No test was removed or weakened.
  Evidence: `receipt-handoff-fix-*.log` in the same directory. No product fallback,
  compatibility, prompt change, live-model test, full-local, commit or push.

## Failure receipt consistency and empty operation contracts

November 11, 2026. Approved bounded follow-up on the existing
`codex/ai-conversation-improvements` worktree and accepted dirty predecessor at
`036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82`. Status: complete with focused validation.
This is part of this plan, not whole-plan closeout.

### Evidence and scope

The review's permanent cases reject a contradictory completed receipt in delivered
usage, reject completed failed/unknown receipts at the real registered handoff,
and preserve a canonical inspection-only tool set. The existing provider input
correction case also fails because the operation generator publishes an empty
name enumeration. These are five failing cases, not five independent defects.

Scope: App invocation envelope generation, native owner/registry contract selection,
operation contract generation, their direct tests and provider consumer, and owning
specification/Inspector/docs. Preserve strict input/output validation, valid
completed results with unsaved storage, partial prefixes, cancellation, retention,
no replay and tool availability. No compatibility, weaker validation, prompt change,
new cache, renderer work, dependency change, live 101, full-local test or remote
operation. Review only these owners, direct consumers and the bounded regressions.

### Ordered execution cards

1. **Receipt consistency - AI execution `compose/apply`.** The App invocation
   owner publishes and validates the same selected owner result contracts. Keep
   Runtime's internal diagnostic envelopes distinct from the owner's declared
   recovery payload; do not feed a registry-added unrestricted failure alternative
   back into a selected public invocation. Represent common unacknowledged failures
   as complete invocation alternatives whose execution settlement agrees with the
   nested failure and cannot claim success/completion. Preserve acknowledged owner
   partial/recovery validation and successful owner data when storage is unsaved.
   Reuse existing host schema projection at discovery and invocation; no new wire
   identity, persistence format or retained state. Prove the three receipt failures,
   storage recovery without re-execution, invalid-prefix negatives and exact actual
   usage; review before advancing.
2. **Empty operation contracts - AI execution `compose`.** The operation owner
   must describe an empty batch capability with a valid rejecting schema, not an
   empty enumeration or fabricated operation. Other native tools and supported
   inspection remain available. Keep malformed/unsupported declaration rejection;
   arbitrary batch names and empty batches still reject before dispatch. Prove the
   two startup failures, actual provider correction in one turn, and ordinary
   nonempty batch usage. Review before final integration.

These cards select the existing App Inspector's registration/compose and canonical
apply boundaries. Inputs are registered owner contracts and invocation receipts;
outputs are executable discovery schemas and validated delivery. App owners alone
compose these envelopes; Runtime scheduling, model choices and tests do not supply
product validity. Failure ownership stays at admission/handoff with factual
settlement and no replay. Schema derivation remains invocation/definition scoped;
there is no new cache or payload scan, and owner execution counts remain unchanged.

Gates: the five review failures, whole-result and batch negatives, schema/host/
invocation/tool-library tests, selected provider protocol cases, exact schema audit,
scoped types/lint/naming and affected Inspector contracts. All five failures must
pass on the same source, with successful-work/unsaved-storage and unsupported-rule
controls retained. Final review covers the bounded diff and direct consumers only.

### Progress

- Review evidence: `tmp/conversation-improvements/recovery-support-review-*.log`.
  Four permanent review cases and one existing provider case fail before fixes.
  The preceding report's blanket recovery-safety conclusion is withdrawn; exact
  schema equality alone cannot prove valid outcome combinations.
- Step 1 reviewed: native discovery and invocation now use the same owner result
  projection. Common failure alternatives correlate outer/inner settlement and
  exclude successful execution; Runtime diagnostic additions no longer become
  selected owner recovery. The three original receipt failures and four additional
  completed-inner variants pass, with valid unsaved results and no-replay controls.
  Forty result/batch cases, 124 invocation/host/library cases and three exact actual
  usage routes passed. The first audit also passed 594 cases; its broad native
  selection took 132.73 seconds. Final envelope construction shares the large
  result schema and uses small correlation conditions; the affected exact routes
  were rechecked after that refinement. No throughput claim relies on timings.
- Step 2 review exposed a direct handoff prerequisite after registration succeeded:
  an instrumented/copied reply loses its object-identity validation receipt. The
  host then compared an acknowledged envelope against the raw owner schema,
  rejecting its own toolOutcome metadata. Reuse the same host contract projection
  for that validation path, while raw owner validation remains unchanged. The
  existing read-only regression detects it; additional valid/negative-count/extra-
  field direct-reply controls preserve strict validation and one owner execution.
- Step 2 reviewed: empty operation sets use a false name schema; independent native
  reads remain available. The real owner still rejects arbitrary names and empty
  batches before dispatch. The original provider correction case passes unchanged.
- Final bounded review: all five original failures pass on the final source.
  Twenty whole-result/review cases, 24 batch cases, 170 schema/host/invocation/library
  cases, 81 composition/prefix-recovery cases, five provider cases and 392 focused
  declaration/exact-audit cases pass. App flow-proof types, 15 naming checks, two
  Inspector contract checks and three maintained-test/type-membership checks pass.
  ESLint has no errors and the existing batch measurement console warning only.
  Raw owner validation, host acknowledgement validation and diagnostic recovery are
  distinct; none is bypassed. No compatibility, full-local, live-model run, commit
  or push. The selected task is complete; the wider plan remains active.
  See the [detailed follow-up report](../reports/contract-verification-and-current-pixi-2026-11-11.md#follow-up---failure-receipt-consistency-and-empty-operation-contracts).

## Complete result validation and handoff

November 11, 2026. Approved follow-up in the existing
`codex/ai-conversation-improvements` worktree at base
`036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82`, including the accepted dirty
predecessor and the review's permanent failing tests. This is a task within this
plan, not whole-plan closeout. Status: complete with focused validation.

### Evidence, scope and acceptance

The review reproduced three defects through current host usage and execution:
selected containers lose their original local-reference root; the App validator
silently accepts a published `dependentRequired` violation; the delivery audit
accepts an additional unconstrained union alternative. Whole-root forwarding,
negative numeric bounds, closed properties and successor stopping are controls.

Scope: Runtime registered-schema projection/admission, the App tool validator
and registration boundary, the exact delivery-audit oracle and canonical result
negative tests, their test/type entry points, and directly owning specs/Inspectors.
Read current owners, their callers and these regressions only. Preserve strict
inputs/outputs, typed binding proofs, runtime lifetimes, partial settlement,
no replay, independent retention/delivery and optional review. No compatibility,
prompt repair, renderer change, dependency addition, live 101, full-local test,
release work or remote operation. A necessary unrelated owner change stops this
task for scope review; a failure inside these boundaries requires iteration.

### Ordered owner steps and review gates

1. **Reference handoff - Runtime `admit/invoke`, App `compose`.** Preserve the
   original reference context when a registered result subtree becomes a new
   validation root, including siblings, nested/recursive references and runtime
   annotations. Reuse the existing schema traversal/embedding owner. Materialize
   only the reachable reference graph, without expanding recursive trees or
   importing unrelated result payloads. The selected whole-container regression
   must pass through published usage and actual host delivery. Keep whole-root,
   invalid-result, downstream binding and no-replay controls. Review discovery,
   retention and envelope embedding before advancing.
2. **Validator support - App `compose/apply`.** Enforce published supported
   constraints, including the reproduced dependent-field rule. Unsupported schema
   semantics must be rejected explicitly before publication/execution rather than
   ignored or turned into successful output. Keep schema annotations distinct from
   constraints; inspect schema locations, not literal examples or arbitrary JSON
   data. Validate the same supported contract at input and output boundaries.
   Add unsupported/nested/union cases before implementation and preserve existing
   built-in declarations, recovery and no-replay behavior. No new validator package.
3. **Exact audit - App `compose` verification.** Replace subset matching with an
   exact comparison at the correct owner/observed/model boundary. Normalize only
   semantically unordered sets and equivalent object defaults. Reject extra union
   alternatives and dropped constraints. Restore canonical invalid-result runs
   with well-formed fixtures; do not skip them or restore obsolete envelopes.
   Register the new review regressions in maintained test/type entry points.

Each step above is its execution card: the existing reusable-tool composition
`admit/invoke` and AI execution `compose/apply` contracts own inputs, results,
contributors and failure handling. Changes remain in their schema/validation/test
boundaries. Re-read these steps before advancing and update their contracts only
where this follow-up clarifies an actual responsibility. No new cache or lifecycle
is introduced; reference projection is one finite reachable graph per selected
schema and owner invocation counts must remain unchanged.

Gates: the three review regressions; relevant Runtime admission/flow/tool-contract
files; App schema, invocation, host, selected delivery/usage and API audit cases;
focused provider contract/repair cases; scoped type checks, lint, naming and
Inspector contract checks. Review each completed slice before the next. Final
closure requires all three original failures to pass on the same source, retained
negative controls, and a bounded review of the touched diff/direct consumers.

### Progress

- Step 1 reviewed: selected containers now carry a self-contained reachable
  reference graph. Removed the old consumer override of the projected root.
  Replaced the old expected standalone-reference failure with positive value
  validation and retained document/request/secret portability negatives.
  Runtime focused files: 142 passing; host reference/control cases and direct
  lease consumers pass; the current Runtime build supplies App consumer tests.
- Step 2 reviewed: supported dependent fields are enforced, unsupported/malformed
  declarations reject before publication, and value validation checks the same
  vocabulary. Root recursion and literal-data separation have permanent cases.
  Schema/host/invocation checks: 124 passing. Actual selected usage/publication:
  205 passing. The normalization fixture now starts from a valid declaration;
  duplicate type/required declarations have explicit rejection cases instead.
- Step 3 refinement from restored negative execution: registered invocation
  discovery omitted common leaf failure values nested under execution. Reuse the
  invocation failure owner, and limit the added public boundary alternative to
  unknown/not-started settlement; acknowledged prefixes must still satisfy the
  selected owner's strict partial/recovery schemas. The existing negative prefix
  tests detected a too-broad intermediate alternative and remain mandatory.
  Exact audit compares ordinary operations to registration, and action wrappers to
  their canonical model result plus the registered observation owner; these are
  distinct boundaries. Do not mistake capture-owner enrichment for a dropped
  constraint. Literal JSON and reference siblings must not be normalized away.

All three review counterexamples now pass. The final owner review preserves exact
success/partial/recovery boundaries and no replay; no compatibility path remains.
Final focused evidence: 142 Runtime cases, 194 App schema/host/invocation cases,
24 batch cases (also included in the 36-case final recovery slice), 390 exact
usage/action audit cases, five provider cases, 42 Inspector/test-membership cases,
15 naming cases, Runtime build and App flow-proof types. ESLint has no errors and
one pre-existing console warning in batch measurement output. No full-local,
new live-model/GPU run, commit or push. Detailed results are in the
[follow-up report](../reports/contract-verification-and-current-pixi-2026-11-11.md#follow-up---complete-result-validation-and-handoff).

## Current contract verification and SDK proofs

November 11, 2026. Approved follow-up to the expanded Pixi upgrade validation.
Base: `036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82`, current
`codex/ai-conversation-improvements` worktree with accepted uncommitted
predecessor changes. This is a child task of this plan; it does not close the
entire conversation plan. No remote operation is authorized.

### Evidence and frozen scope

The [SDK report](../reports/pixi-resource-lifetime-upgrade-2026-11-10.md) lists
the original failed suites. Old-SDK reproduction establishes attribution only,
not permission to ignore failures. The subsequent review found:

- Eighty API audit failures mix owner and Runtime-delivered schema boundaries
  or compare unordered `required` sets as ordered arrays. Browser action
  observation adds `toolOutcome`; owner fixtures must not impersonate it.
- Three current-version cases expose two real discovery defects: registered
  reference-plus-sibling constraints become unsupported dependency schemas, and
  projected registered results lose their reference root during portability
  analysis. Search fails before any canvas operation.
- Superseded tests still demand automatic mechanical review/approval, top-level
  reference receipts, old `plan` inputs, direct execution of host envelopes,
  old revision identities, old capture-ledger revision and a 15-minute ceiling.
  Search tests also assume plural forms cannot match and every descriptive
  query must remain a menu. Do not restore any of those old contracts.
- Five typing errors are in fixtures/cleanup/result narrowing. Type-check
  entries omit affected tests and still name removed files.
- Formal Pixi tests already import the installed SDK, not an old dependency.
  However, installed-version output directories do not prove browser-loaded
  identity. App handoff evidence needs the current dependency identity alongside
  source hashes; old-version evidence must never satisfy a current proof.

Mutation is bounded to these failed App AI tests and their direct production
owners, schema proof/projection in `ai-agent-runtime` when required, App test and
type-check entry points, current Pixi browser proof/handoff consumers, and their
specifications/Inspector contracts. Use the recorded failure inventory, current
source, exact call sites and focused regressions; no new repository-wide audit.
Keep admission constraints, resource lifetimes, failure settlement, no replay,
current host routing, independent retention/delivery, optional explicit review,
image fidelity, restore data and renderer semantics. No compatibility aliases,
prompt-only repair, dependency change, new live AI/101 run, full-local suite,
release gate or unrelated optimization.

### Ordered implementation and acceptance

1. **Audit the correct result boundary.** Under execution `compose/apply`,
   normalize only unordered schema sets and test owner, observed and model
   outputs separately. Add negative assertions for omitted required fields,
   altered types/enums and failed/partial outcomes. Do not remove constraints
   or accept an internal resource branch as a public success result.
2. **Repair schema handoff.** Under execution `compose` and reusable-tool
   `admit/invoke`, use the existing canonical schema/reference owners to preserve
   reference roots and sibling constraints through discovery, selected results,
   host routing, retention and downstream binding. The three existing red cases
   are the initial regression. Add actual successful/failed delivery and no-replay
   checks before advancing; no caught-error fallback or permissive schema.
3. **Remove superseded test responsibilities.** Under `compose/inspect/settle`,
   port current consumer tests to host invocation routes and `references[]`.
   Delete assertions/fixtures that certify removed automatic review; preserve
   explicit mechanical analysis, canonical mutation, repair, saved data, image
   delivery and reuse, cancellation, history and durable-prefix cases. Historical
   evidence stays immutable; current executable fixtures use the current input.
4. **Repair types and verification membership.** Correct the five fixture errors
   without weakening shared types or casting away invalid output. Remove stale
   type-check paths and include the affected maintained test families so old
   signatures cannot silently pass through transpilation. Keep scope limited to
   this App and current contract tests, not all workspace packages.
5. **Bind GPU proofs to the current SDK.** Under `render-material` and
   `project-render-hierarchy`, assert browser-loaded Pixi identity against the
   installed/locked version and carry it through source-verified App handoffs.
   Keep same-version control policies, current exact image/work/lifetime oracles
   and source freeze during browser proof. No old SDK installation/execution.
6. **Bounded closure review.** Run the affected suites and exact browser cases,
   scoped types/lint/naming, and current native GPU proofs. Recheck each owner and
   handoff after its slice. A test previously blocked by a stale assertion must
   complete its remaining assertions before being called verified. Record results
   and any remaining limitation in a detailed report; never infer App-wide green
   status from this scoped run.

Each numbered step is its execution card: the cited Inspector owner supplies
the unchanged inputs/outputs, conditions, allowed contributors and failure owner.
Step 1 starts with the current failed audit and negative-oracle cases. New
identifiers are test/proof-local; there is no new persisted or public identity.
Implementation review: Step 1 review rejected a repeated schema
compaction in the initial oracle change: re-compacting a resolved recursive
schema changes its proof representation. Compare each boundary after one
projection only, add observation metadata only to the primary browser receipt,
and sort required sets after normalization. Keep compact assertion output so
large schema failures remain diagnosable. Representative cases must pass before
the bounded audit group is repeated.

Step 2 review expanded the existing handoff proof through the advertised host
route. Registered output contracts with unsupported implication keywords were
rejected before execution even when the sequence merely returned the complete
result. Preserve the exact output schema for runtime validation and whole-result
forwarding; opaque fields still cannot supply typed bindings. Input admission
remains strict. Do not broaden general intersection implication to make this
pass. Query inability to prove a field is a typed reference issue, not a tool
execution failure; the complete published contract remains unchanged.

Completion: all six steps are complete for this bounded follow-up. The closing
[report](../reports/contract-verification-and-current-pixi-2026-11-11.md) records
real schema defects, removed executable expectations, type coverage, exact
focused results and current-SDK evidence. No compatibility path, prompt-only
repair, full-local run or remote operation was added. This closes the child task,
not the entire conversation plan.

## Local hierarchy work and projection

November 10, 2026. The agent supplied four exact saved root IDs in the
`assembly` step of run `taipei-101-fixed-1794244803070`. It did not request a
whole-document search. `api_hierarchy_groupElements` calls the App hierarchy
adapter, then Preset `groupElements`. Preset's previous read interface exposed
only `sceneTreeSaveData`; preparation serializes every element to obtain four
roots and their parent's order. Save validates the complete tree, and the
subsequent SceneTree move validates it again. Core already exposes metadata,
children and element reads. The excessive read belongs to the tool's framework
implementation, not an agent-selected query or provider requirement.

The four roots contain 25,539 drawable descendants. The recorded grouping call
took 155.726 ms; grouping plus two captures took 613.270 ms. Retained browser
phases show one new Group strategy, eight direct coordinate updates, no vector
strategy rebuild, UI flush 29 ms (including 17.7 ms hierarchy projection), and
one 34.7 ms synchronous render call. These nested measurements are not additive
or GPU elapsed time. Per-node counters were evicted; exact SDK visit counts are
not measured by that run. Pixi reparenting walks descendants until a render-group
boundary; the SDK batch partitions exclude Graphics, which represent design Groups.
UI flattening also falls outside the tail-addition optimization. Region bounds
are invalidated lazily; unchanged world bounds require proof before reuse.

### Render boundary acceptance revision

November 10, 2026 - approved follow-up to the small-group regression review.
The earlier production policy remains the measured candidate, not an accepted
universal optimization. This task is associated with Local hierarchy work and
projection and its existing project-render-hierarchy Inspector owner.

Objective: retain useful reparent savings without increasing ordinary rendering
cost for many small Groups. Preserve world geometry, painter order, element and
resource identity, queries, snapshots, failure recovery, history and shared replay.
Same-source comparisons hold all completed Core, Preset and UI corrections fixed.
The historical 155.726 ms provider call is context, not the rendering baseline.

1. **Same-source measurement.** Extend the permanent local benchmark to the
   retained 101 fixture, ordinary redraw, camera motion, actual parent translation
   and compensated reparenting. Keep previous/current Group strategies isolated
   in the test probe. Record CPU mutation/render, GPU timer/completion, work counts,
   source and fixture identity. Count decision overhead as well as saved work.
   Distinguish 25,539 visible leaves from 25,491 leaves under the four retained
   roots: 48 ornaments were moved out before the immutable fixture was saved.
2. **Bounded feasibility proof.** Before production edits, use permanent owner
   tests to verify whether existing public engine/SDK paths can retain native
   work for a logical-only reparent while preserving bounds, snapshot selection,
   coordinates, order and subsequent child/parent changes. Explicitly compare
   ordinary native reparent, isolated render domains, and retained native placement
   with changed logical ownership. Identity partition containers alone do not
   prove general transform separation. A failing candidate is evidence, not
   permission for a renderer rewrite or weakened oracle. Review the whole handoff
   before selecting a production design.
3. **Smallest proven owner change.** Only after step 2 passes, update the necessary
   Render/engine handoff and Group policy together. Preserve complete transaction
   changes and query-before-frame correctness. Do not infer that every container
   is invisible, or that equal matrices clear independent descendant dirty work.
   Update conflicting Preset/Render/Pixi specs, Inspector and tests together;
   remove superseded behavior rather than retaining compatibility routing.
4. **Focused integrated acceptance.** Re-run the affected native, shared-engine,
   region, hierarchy/history/replay and browser cases on the same source. Compare
   large-subtree and small-group CPU/GPU results in warmed reversed-order blocks,
   with deterministic work counts and image assertions. Include real parent
   translation, edits and reorder so savings are not shifted to another operation.

Scope: existing hierarchy/render owner families, their direct contracts and
permanent tests. The initial slice changes only this plan and local benchmark/
feasibility tests. No new group-size threshold, dependency, private SDK flag patch,
texture substitution, duplicate canonical scene, prompt change, full-local suite,
release gate or new AI drawing. No commit/push is included. Production changes
remain gated by feasibility; if the bounded candidates cannot meet the complete
handoff, record the exact failure and revise the design before production work.

Step 1 card: owner project-render-hierarchy; inputs retained fixture/current
strategies; outputs same-source measurements and validity checks; no production
semantics change. Reuse the local benchmark and test-only policy probe. New names
are test-local, non-persisted measurement identities. Gates: naming, scoped lint,
local benchmark and raw-sample/pixel review.
Step 2 card: same owner; test the canonical-to-native handoff, including negative
cases and cost. Native SDK imports stay inside render-engine-pixi. No candidate
is installed into the live app. Gate: focused permanent native feasibility tests
and an explicit design review; failure leaves steps 3 and 4 pending.
Steps 3 and 4 cards must select the proven design and exact contract before edits;
the current Inspector is not silently reinterpreted as permitting flattened
native ownership. Existing accepted correctness evidence remains required.

Status: step 1 complete. Step 2's bounded public-SDK candidates are rejected as
complete solutions: ordinary reparent and RenderLayer still visit descendants;
RenderGroup retains work but regresses many-small-group frames; retaining native
placement with an order-only layer loses Group transform/bounds ownership.
Production steps 3 and 4 are not admitted. See
[measurement and feasibility evidence](../reports/hierarchy-boundary-feasibility-2026-11-10.md).

Step review: the final seven-case browser matrix and two-case confirmation pass
measurement integrity. Real-scene reparent completion is 54.30 -> 10.00 ms and
56.90 -> 10.90 ms, while 1,000-vector-Group redraw CPU is 1.95 -> 2.60 ms and GPU
0.248 -> 0.592 ms in confirmation. Four new native characterization tests and
four existing partition tests pass; this reproduces the limitations, not product
feasibility. No production changes were made.

### Retained projection feasibility revision

November 10, 2026 - approved continuation of step 2. This is a bounded
experiment, not adoption of a new renderer. The existing independent Group
policy remains installed. The measured large-scene completion saving (46 ms)
and small-group steady CPU/GPU costs (0.65/0.344 ms, separate passes) must be
reported as distinct absolute costs, not a universal net regression.

Scope: this plan, its feasibility report, permanent hierarchy tests and
engine-owned test probes, and the local browser benchmark configuration.
No production or public API change is admitted before all four phases pass.
No size threshold, private SDK state mutation, dependency, texture substitute,
second canonical scene, AI drawing, full-local gate, commit or push. Preserve
existing dirty changes and live services. New identifiers are internal,
non-persisted test identities owned by their test package.

1. **Applied changes and read barriers.** Exercise official grouping in the real
   App and record applied versus committed events, parent/order and coordinate
   compensation, and reads before the next frame. Verify rollback, history and
   shared replay through the existing focused hierarchy case. Applied batches
   are not whole transactions: retain accepted changes until the next rendering
   or query barrier, without delaying canonical reads or inventing a transaction.
2. **Retained drawing and coordinates.** Use an engine-owned, test-only projection
   probe with explicit logical membership and stable drawable roots. Compare
   ordinary physical hierarchy, independent render domains and retained placement
   with public SDK operations. Consume admitted move and position changes together
   at a read/render barrier. Preserve painter order, resource identity and direct
   leaf edits. Count classification, native membership, descendant transforms and
   disposal, including changes to both old and new parents. Native retention alone
   is not admission; physical-parent lifetime must not leak into logical ownership.
3. **Logical queries and capture.** Test Group-local bounds and exact membership
   from the same projection revision. An experimental capture projection may
   share prepared Graphics contexts but cannot move live objects or crop unrelated
   screen content. Count its construction, traversal and cleanup, cold and repeated
   use, after edits. Include overlapping outside content and subsequent parent
   motion/deletion. Unsupported paint/resource types remain explicit limitations;
   do not claim complete feasibility from vector-only success.
4. **Whole-operation cost.** Compare baseline, installed policy and candidate on
   identical warmed fixtures in reversed order. Include ordinary rendering,
   compensated reparent, actual parent translation, immediate bounds and capture.
   Count query/capture work and total completion, not only the cheap mutation.
   Use small permanent probes first; promote to the retained 101 fixture only if
   the smaller proof passes the complete handoff. A correctness or deterministic
   work failure is sufficient to reject a candidate without a costly large run.

Execution cards: phase 1 observes the existing prepare-preset-group-operation,
normalize-preset-group-geometry and project-render-hierarchy handoff; phases 2-4
are isolated feasibility evidence for project-render-hierarchy, not replacement
production semantics. Inputs are accepted canonical changes and current paint
resources; outputs are exact logical geometry/order, evidence of native work and
capture completion. Bounds and capture consume the same accepted revision.
Failure belongs to the projection experiment; never repair canonical state or
serve stale output. Gates are scoped owner/browser tests, scoped lint/types,
naming and per-phase self-review. Review the existing Inspector before advancing.

Stop condition: a failed candidate does not authorize a renderer rewrite,
weakened oracle, new cache heuristic or production installation. Record which
handoff passed and which cost/correctness contract failed. Revise the bounded
experiment only where the evidence justifies it. Production admission requires
all phases plus representative paint types, history/replay and no shifted query
or capture cost; replace conflicting contracts together only after admission.

Phase 1 review: the real App emits three projection batches (Group addition,
hierarchy move, computed coordinates) before one committed projection batch.
Immediate frame barriers match the currently accepted state, including the
intermediate uncompensated pose. Final placement, rollback after a read,
undo/redo and native identity pass. The existing live edit/order/visibility and
remote-publication replay case also passes. Lifecycle/journal notifications are
not render-projection envelopes; camera transforms must be removed when comparing
workspace coordinates. The test probe was corrected at those boundaries, not by
changing product behavior or weakening the oracle.

Phase 2 review: the isolated native probe retains coordinates, root order,
independent leaf edits and old-parent deletion. Four-root reparent work is
4,004 memberships/4,000 descendant transforms for ordinary hierarchy, 4/0 for
installed independent domains, and 0/0 for retained placement. However, actual
parent translation revisits 4,000 descendants in the retained candidate versus
zero in the installed policy. This fails an acceptance obligation. Continue
phases 3-4 only to finish the bounded query/capture cost diagnosis, not to admit
production or silently accept the translation regression.

Phase 3 review: shared-context capture preserves Group-local bounds, live paint
identity, later geometry edits and cleanup in the vector probe. It nevertheless
constructs 4,004 temporary Graphics for each capture, including the second
unchanged capture. The existing policy needs no such materialization. This is
another rejection condition, not a request to hide cold work behind a cache.
Browser review must also account for SDK render/extract promoting its target to
an independent domain. Verify and restore the selected policy with public APIs,
including restoration cost. Compare direct rendering of retained roots into the
ordinary offscreen capture target as the bounded alternative to clone assembly;
record domain transitions and live-scene equivalence. This is normal capture,
not a texture replacement for editable live geometry. Replay source-stamped real
phase-1 observations into the isolated projection before timing synthetic scale.
Phase 4 is a bounded browser diagnosis on 4,000-leaf fixtures with reversed
policy order and capture cleanup inside timing. The recorded 101 promotion and
production admission remain blocked; GPU timer expansion and unsupported paint
families are unnecessary for rejecting an already-failed candidate.

Phase 4 final review: all 12 reversed-order browser blocks pass pixel, policy
and accepted-source replay assertions. The 1,728 samples expose the rejected
tradeoff: four-large-root capture completion is 1.80 ms with independent domains,
7.75 ms with shared-context assembly and 4.60 ms with direct root capture. Direct
capture restores policy but registers 8,000 leaf memberships. Neither route
satisfies the no-shifted-cost condition. Native tests pass 13/13; App browser
cases pass 2/2; the local engine browser proof passes 1/1. Scoped engine types,
lint and naming pass; focused App types remain blocked by 29 diagnostics in
untouched dependency files, with none in changed test/helper/config files.

Status: all four feasibility phases investigated and reviewed; candidate rejected.
This completes the bounded investigation, not production admission or whole-plan
closeout. Keep the installed policy. Recorded-101 promotion and production steps
3-4 remain unadmitted. See [complete handoff follow-up](../reports/hierarchy-boundary-feasibility-2026-11-10.md#complete-handoff-follow-up)
for producer evidence, candidate limitations, exact timings and reproduction.

### Pixi research revision

November 10, 2026 - external research and documentation only. See
[Pixi render boundaries - research](../reports/pixi-render-boundary-research-2026-11-10.md)
for official guidance, maintainer/issue applicability, pinned editor sources,
installed 8.20.1 implementation and measurement reconciliation.

Keep the installed independent Group domains. Their real-101 benefit is measured;
the flattened projection fails actual parent translation and capture. The next
candidate is reduced redundant render-state submission, with native membership
and capture retained. This is an evidence-backed experiment, not a proven fix.
Official RenderGroup guidance warns about many domains; RenderLayer and shared
Graphics contexts do not remove the missing coordinate/capture responsibilities.

Scope of this revision: this plan and the research report only. No code, tests,
dependency upgrades, production renderer selection, new measurements, commits or
pushes. The four phases below describe the next implementation/proof task; none
is executed by this documentation update. Existing Inspector behavior remains
unchanged until a complete candidate is admitted.

1. **Attribute the actual state cost.** In the existing permanent Pixi/browser
   probes, distinguish domain entries, instruction rebuilds, uploads by matrix
   role, equal consecutive values at the same program/location, and buffer/resource
   work. Hold version, domain policy and source constant. Isolate empty Graphics
   versus structural carriers without activating `PixiBatchPartitions`' existing
   128-child heuristic. The measured 2-to-2,000 matrix increase does not establish
   that all uploads are redundant. Output: an attributed cost and exact proposed
   SDK/engine owner, reviewed before selecting a change.
2. **Prove a supported minimal change.** Prioritize eliminating only demonstrated
   redundant submissions, keeping native domains and prepared geometry. Verify
   the actual supported insertion point before implementation; extension support
   in general is insufficient. Account for program/location state, different
   sibling transforms, nested domains, color, target changes, mutable matrices
   and context reset. Do not skip updates based only on object dirty flags. If
   no supported boundary exists, record the upstream requirement and stop that
   candidate. Same-version WebGPU uniform batching may be compared for attribution,
   never used to hide a WebGL regression or silently change the app backend.
3. **Verify accepted changes through capture.** Reuse the applied-batch producer
   evidence and focused history/replay cases. Reads must observe currently accepted
   state, including intermediate compensation; equal parent transforms cannot
   erase independent leaf dirtiness. Test real parent motion, ordering and exact
   selected-subtree bounds/capture with outside overlap, vector/text/image/effect
   content, cold/repeated extraction, restoration and the following live frame.
   Keep one canonical scene and its existing paint resources. Before changing
   production handoff semantics, reconcile the Inspector's committed-only wording
   with the measured applied-batch contract and update affected specs/tests together.
4. **Accept whole-operation improvement.** Compare original, installed and proven
   candidate on the same retained 101 and small-group fixtures in reversed-order
   blocks. Keep CPU, GPU and completion measurements distinct. Preserve the
   four-root reparent/translation savings and improve the identified steady cost
   beyond noise without extra query/capture, disposal or later-frame work. If
   evidence does not support this small change, retain the installed policy and
   report the absolute tradeoff. A custom display-list/batcher requires a separate
   reviewed design, not an automatic renderer rewrite.

Each future phase uses focused tests and self-review before advancing. No group
size threshold, raster substitute, private SDK flag patch, clone capture tree or
AI planning requirement. The upstream InstructionSet destruction fix merged after
8.20.1 is a relevant resource-lifetime finding, not a demonstrated cause of our
timings or authorization to upgrade the dependency.

Review: current `project-render-hierarchy` identity, order, independent-domain and
failure ownership stay intact. The research distinguishes measured results,
version-confirmed mechanisms and hypotheses. The no-cost-shifting condition covers
first capture as well as repeated capture and subsequent rendering. Earlier
rejected prototypes remain isolated evidence; they are not compatibility paths.
Status: research and plan revision complete; the next proof and production
admission remain pending. No additional benchmark or runtime validation was run.

Execution scope - approved continuation: first change only permanent browser/native
measurement probes, their focused tests and this plan/report. Production work is
conditional on the supported-boundary and whole-operation proof above. Preserve
all existing dirty changes; no dependency, backend, threshold or remote changes.
Step 1 card: project-render-hierarchy evidence, implemented by engine/App test
probes; input is existing native render commands, output is per-program uniform
attribution with actual GPU values. Observe and forward every submission, never
suppress calls. Instrumented runs are work evidence, not timings. Names are
test-local, non-persisted. Gates: observer regression tests, existing small-vector
and recorded-101 browser cases, naming, scoped lint and source/diff review.
Step 2 rechecks the SDK public boundary before choosing a candidate. A missing
supported hook is a bounded feasibility failure, not authorization to fork Pixi.

Step 1 review: observer control and both App cases pass. Small-group isolated
redraw has 2,000 identical matrix writes and 1,000 distinct native programs per
frame; the recorded scene has 14 identical and 31 changed writes. These are
program-local values, not evidence that a shared program can skip all writes.
`MeshMaterialBatcher` constructs a DefaultShader for every batcher, whereas the
SDK DefaultBatcher shares one. High-shader compilation creates a new GlProgram
with a unique debug define, producing distinct native programs. The engine's
analytic shader already uses the public GlProgram.from source cache.

Step 2 card: same projection evidence owner, engine-only test candidate. Reuse
the existing ordinary shader bits through GlProgram.from, changing program
ownership before first bind while keeping per-batcher resources, native domains,
draw order and capture. No GL suppression or private uniform flags. Compare
original/candidate native probes, exact images and work counts; test program
lifetime and texture-capacity separation. This takes priority over a new uniform
cache because it corrects the upstream program-creation owner. Only a passing
whole-operation proof admits the production shader factory change.

Step 2/3 review: the candidate keeps exact native-probe images, native domains,
zero capture clones and zero capture membership-leaf work. App hierarchy/history/
replay and mixed-material/overflow cases pass. Reversed App blocks reproduce the
small-group GPU improvement (about 0.59 to 0.28 ms); CPU submission remains about
2.6 ms. Recorded-101 reparent render CPU remains 0.3 ms. This admits the narrow
program-sharing change, not a claim that every small-domain overhead is removed.
One page-reload-interrupted run and one uninjected candidate were excluded.

Production card: `render-material`, owned by `@asyra/render-engine-pixi`, within
its existing shader/batcher implementation boundary. Inputs are ordinary shader
bits and effective texture capacity; outputs are independently owned Shader
bindings backed by Pixi's source-keyed immutable programs. SDK program caches own
source reuse, renderer shader systems own native context programs, and batcher
destruction releases its Shader without destroying shared programs. Capacity and
shader-source changes select different programs; scene/camera changes still
submit current uniforms. Analytic selection, start-batch rebinding, hierarchy,
queries and capture stay unchanged. The formal actual-batcher ownership assertion
fails before implementation (`sameProgram: false`). Gates: that regression, exact
native pixels/work, current-context recreation, focused App hierarchy/material
cases, small-group/recorded App measurements, scoped type/lint/naming and review.
Remove the browser response-injection candidate after admission; keep the old
independent-program behavior only as an isolated measurement reference.

Execution complete for this bounded shader-program slice. See
[state attribution and production proof](../reports/render-state-submission-proof-2026-11-10.md).
Step 3 review additionally covers text, raster content, nested alpha/effect targets,
selected capture and its following frame; the missing mixed-content coverage was
added before closure. Context restoration recreates native programs and permits
later Group edits. The program owner is admitted through the existing
`render-material` boundary; the `project-render-hierarchy` ownership/identity/order
contract is unchanged. The earlier applied-versus-committed handoff question was
not changed or claimed resolved by this shader-only slice.

Step 4 review: production App work counts confirm 1,000 to one ordinary program,
unchanged draws/matrices and zero steady buffer uploads. Final small-group redraw
GPU is 0.269 ms versus 0.587 before; CPU improvement is not stable across samples.
Recorded-101 four-root reparent remains about 10 ms versus 52.6 ms for the same-run
ordinary-domain control. Native bounds/capture retain zero clone/membership-leaf
work; all reference images match. Residual small-domain submission overhead is
reported, not hidden by a threshold. The carrier experiment was not extended:
attribution selected the concrete duplicated program owner without changing
carriers, queries or extraction. Only focused tests/build/types/lint/naming were
run; no full gate, dependency upgrade, commit or push. This closes the approved
program-reuse implementation, not unrelated work in the surrounding plan.

Follow-up review scope: trace only the shared-program diff, SDK binding/lifetime
consumers and existing hierarchy/material proofs. Strengthen permanent browser
tests for live surviving owners, multiple contexts and exact capture pixels;
record existing SDK lifetime limitations separately from regressions. Production
behavior, unrelated dirty files and performance policy remain outside this review
mutation scope. Run only the matching browser cases and focused type/lint/naming.

Review outcome: actual surviving-owner/multi-context rendering and exact capture
pixels pass, as do the seven existing App handoff/material cases. No new production
update regression was found. The review reproduced the existing Pixi 8.20.1
retired-instruction batcher retention: four deleted Groups leave four cached
Shader owners in both reference and production. This remains an open SDK lifecycle
issue, not a completed resource cleanup. See the report's follow-up review; no
dependency change, renderer fix, compatibility path or full test gate was added.

### Approved SDK lifetime implementation - 2026-11-10

Scope: repair retired instruction-owner retention through the official Pixi SDK
lifecycle. Upgrade 8.20.1 to 8.21.0 first, then verify the current stable 8.22.0
against the same focused checks before choosing the final dependency. This
explicitly authorizes the dependency change excluded by the earlier hierarchy
scope. Mutations are limited to the engine dependency/lockfile, direct adapter
consumers if required by the current SDK contract, permanent focused tests,
and these directly affected specifications and reports. No compatibility path,
SDK monkey patch, independent sweeper, repository-wide test gate or live AI run.

1. **Distinguish lifetime owners before upgrading.** Strengthen the permanent
   browser regression to require removal of retired instruction entries and
   destruction of their batchers. Prove it fails on 8.20.1. Separately prove
   normal RenderGroup pool reset/reuse keeps its usable instruction resources.
   The owner is `render-material`; SceneTree tombstones, history snapshots and
   live reparent handles must remain intact. No immediate heap/RSS assertion.
2. **Use the official SDK destruction handoff.** Install and verify 8.21.0,
   then 8.22.0, keeping both versioned evidence sets. RenderGroup destruction
   reaches InstructionSet destruction and the registered batch pipe; the
   existing material batcher releases its own Shader bindings without destroying
   shared programs. Update the dependency boundary assertion and docs together.
   Review each version's API and lifecycle changes; stop advancement on an
   unexplained correctness regression rather than add a fallback.
3. **Preserve restore and hierarchy semantics.** Verify real SceneTree
   tombstone identity across removal/undo/redo, rejected transaction restoration,
   and hierarchy replay. Exercise native render deletion/recreation through App
   undo/redo plus surviving children after ungroup. Keep reparent handles and
   model identities, world geometry and painter order. Restore data is not a
   retired GPU instruction cache and is not subject to this cleanup.
4. **Close live rendering and reuse boundaries.** Verify shared program peers,
   multiple contexts, context restoration, geometry/material edits, repeated
   target capture and the following frame. Measure the same focused large-root
   reparent and small-group scenarios; preserve work counts and image oracles.
   Report pool reuse separately from final destruction, and JS reachability
   separately from GPU allocation. No group-size threshold or cost shifted to
   querying/extraction.

Each step includes a bounded diff/direct-consumer review before advancement.
Existing `render-material` and `project-render-hierarchy` contracts remain
authoritative. The user subsequently broadened verification for this upgrade:
run the complete Asyra Design App suites and complete `render`, `render-engine`
`render-engine-pixi` and `preset` package suites, including applicable App browser and
large-scene rendering gates. This supersedes the earlier focused-only limit for
these five workspaces, not for other packages. No release validation, live model
benchmark, unrelated package-wide gate or compatibility work is authorized by
this verification expansion. Diagnose failures against the dependency change;
report unrelated existing failures without silently expanding production edits.

Steps 1-3: 8.20.1 fails the retired-owner oracle; both 8.21.0 and 8.22.0 pass
native lifetime, pooled reuse, program sharing, capture and context restoration.
8.22.0 is selected. App deletion/restore/ungroup and the existing hierarchy,
material, history and remote-replay cases pass against a fresh verified SDK
bundle. The previously running Vite served an old 8.20.1 bundle; its passing
consumer run is not upgrade evidence. Step 4 focused performance and image
checks pass. The complete rendering package suites, collaboration, render-delta,
7076 and status-notification browser gates pass. Broader App validation is
complete but not green: existing AI contract failures also reproduce with
8.20.1, and five unchanged AI test typing errors remain. Do not close the whole
App plan or claim all App tests pass. The SDK lifetime slice is verified; see
[the upgrade report](../reports/pixi-resource-lifetime-upgrade-2026-11-10.md)
for counts, baseline controls and residual small-group costs.

The expanded verification also repaired the App's existing test-entry inventory
(18 maintained suites omitted, three removed suites still referenced), and a
browser assertion that read a render snapshot before its scheduled frame.
Neither correction changes production AI behavior or removes failing cases.

### Contract and four owner steps

Objective: make local hierarchy work proportional to its actual dependency
scope while preserving canonical identity, world geometry, painter order,
history, remote replay, capture and hit testing. No AI planning rule, alternate
execution entry, compatibility path, dependency upgrade or release work.
Mutation is limited to Preset Group preparation/geometry, SceneTree hierarchy
admission, Render/Pixi hierarchy projection, UI/region projection, their direct
tests, fixtures, specifications and Inspector contract. Preserve unrelated dirty
files. No new live AI drawing is required by this task.

1. **Work-count regression and retained scenario.** Extract the recorded four
   root IDs, geometry and ordering into permanent test evidence. Establish local
   read, hierarchy validation, engine traversal, UI and region work counters at
   owner boundaries. Aggregate counters rather than emitting one event per leaf.
   Vary unrelated nodes independently of selected descendants. Verify successful
   group/ungroup/reparent, rejection, one undo, redo and shared replay. Existing
   identity-only tests do not prove bounded SDK work.
2. **Preset preparation and SceneTree admission.** Use existing Core local read
   APIs; keep invocation-local read reuse and invalidate it across mutation.
   Resolve all before-image ancestry before writes. Replace full-tree move
   validation with complete affected-parent/ancestry validation; full import/save
   validation stays authoritative. Local and replay moves share the same checks.
   Invalid membership, cycles, missing entities and stale replay reject before
   writes. Do not cache a global validity flag or silently repair corruption.
3. **Render hierarchy execution.** Keep render handles and immutable geometry;
   prove actual Pixi traversal/instruction scope before choosing a rendering
   boundary. Use the existing engine-neutral transform-group capability for
   semantic containers only if actual SDK tests preserve pixels/order and reduce
   work. Do not enable all Graphics partitions or alter visible shape semantics.
   Preserve request coalescing, capture, hit testing and resource disposal.
4. **UI and region projection.** Consume exact hierarchy deltas and retained
   parent/order projections instead of rediscovering the whole hierarchy. Count
   immutable output copying separately from tree traversal. Region geometry may
   only be reused when the actual transform/membership contract proves validity;
   otherwise retain correct invalidation and quantify that required work. Review
   upstream mutation evidence and downstream consumers together.

### Design review, gates and execution cards

Existing Group/hierarchy Inspector owners are prepare-preset-group-operation,
mutate-canonical-hierarchy, normalize-preset-group-geometry and render projection;
Preset data-channel owns UI projection and Render owns region queries. Inputs
are canonical IDs and exact changes, never provider text or Render-derived
canonical geometry. The same accepted contract applies to local, undo/redo and
accepted remote operations. Geometry normalization remains explicit; moving
children must not introduce observer-driven ancestor edits.

Each step first extends permanent focused tests, records the failing work-count
assertion, implements the owner correction, reviews direct consumers, then runs
the corresponding tests before advancing. Use Group operation, SceneTree move,
Core hierarchy transaction, Render hierarchy/region, native Pixi and Preset UI
projection tests. Real-scene verification must compare before/after world
geometry, order and rendering, plus history/shared replay; mocks alone cannot
close it. Scoped type/lint and naming checks accompany changed owners. No full
local suite. No completion claim while native pixels or replay evidence is
missing. If an assumed optimization changes semantics, revise this bounded
design before implementation rather than weakening its oracle.

Step 1 execution card: fixture/evidence and owner tests only; no production edit.
Step 2 execution card: Preset Group, Core read contracts and SceneTree moves;
outputs preserve exact hierarchy and coordinate updates, failures belong to
SceneTree admission, no whole-scene cache. Step 3 execution card: Render/Pixi
projection only, no canonical mutations, profile actual SDK and verify native
pixels. Step 4 execution card: Preset UI/Render region derived state only;
preserve identity/lifetime and account separately for unavoidable output copying.

Status: all four owner steps are implemented and functionally reviewed, but
render-policy performance acceptance is reopened after the small-group benchmark.
The 1,000-vector-Group case increases redraw CPU/GPU cost in two independent
ABBA runs, despite unchanged draw calls. No new production policy was introduced.
See [Small-group render benchmark](../reports/group-render-domain-benchmark-2026-11-10.md).
Focused Preset,
SceneTree, Core, Render, native Pixi and Inspector tests pass; the complete retained
25,539-element browser fixture passes geometry/order, undo/redo, production
publication-decoder replay and pixel checks. No live AI drawing was started.
See [Local hierarchy verification](../reports/local-hierarchy-work-2026-11-10.md)
for work counts, raster precision differences and remaining costs.

Review found one additional in-scope handoff: file load published UI projections
without seeding their reusable preparation. The owner now builds both from the
same loaded rows; the first edit after load is covered by the recorded-scene test.
Existing load tests expecting two element saves now require one.

The rendering proof separates policy adoption from reparenting. Under the new
policy, overview and three detail views are byte-identical before/after grouping;
remote replay also preserves the overview exactly. Switching the old/new render
domain changes float32 raster composition: 25/132/59/83 pixels differ in the four
544,000-pixel views, with unchanged source/world geometry. This is recorded, not
claimed as byte-identical old/new output. The policy comparison bounds changed
pixels below 0.05%, mean absolute channel error below 0.01/255, and maximum channel
delta at 64/255. Reparent comparisons retain exact equality. Foreground checks
prevent empty screenshots from passing. No geometry, image mask or product
fallback was added to satisfy the oracle.

Final review retains unavoidable full save/load validation, immutable flattened
ID copying, changed-order traversal and ordinary frame drawing. An additional
standalone E2E type probe finds existing errors in e2e/test-utils.ts; it reports no
error in the new scenario. Production owner type checks pass; no out-of-scope
helper cleanup, full-local suite, commit or push is part of this task.

Follow-up review: added native edited-child/parent-transform checks, retained
versus fresh region-index comparisons, and a small browser scenario verifying
child geometry/style/order/visibility after reparent. Each undo/redo and each of
four production-decoded remote publications is compared against the matching
pixels, region results and UI order. No new production defect was reproduced;
only tests and this verification record changed. See the report's follow-up
section for limitations and artifact locations.

Small-group measurement contract: verify the existing render-domain decision
without adding production optimization rules. Add only a permanent local browser
benchmark/config and its report. Hold 4,000 visible elements constant across
20/200/1,000 Groups, separately for rectangles and closed vector quads; compare disabled/enabled Group transform domains on the same
canonical scene in ABBA order. Warm each mode before measuring full-canvas redraw,
viewport pan and production hierarchy reparent. Count WebGL draw entry points in
separate instrumented samples; time uninstrumented CPU mutation/render submission
and submission-through-GPU-completion with gl.finish, identifying the actual GPU
backend. Retain raw samples, images, coordinate/order/identity checks and environment
metadata. GPU timer queries are sampled separately from CPU timings when
available; disjoint/unavailable results cannot be presented as GPU measurements.
The rectangle strategy is already unbatched, so a vector cohort using production
topology preparation is necessary to expose batching-boundary cost. Vector point,
segment and network IDs must be unique across the document. Test-only strategy
restoration runs before the isolated browser context is released.
No timing threshold becomes a product rule or CI gate. Use focused lint,
naming and this local benchmark only; preserve all existing sessions and artifacts.
Baseline preparation review: changing existing node flags alone is insufficient
because a later official Group strategy invocation restores the candidate flag.
The test uses a Vite-served, test-only public-registry probe selecting the exact
previous strategy body or current strategy, outside timed intervals, and verifies
all Group flags after every phase. Bare browser-evaluate package imports are not
resolvable; static package imports belong to that test module. A failed baseline
integrity check invalidates the sample instead of becoming performance evidence.
The existing project-render-hierarchy owner remains unchanged. Report a slowdown
as a finding, never conceal it with a new heuristic or change the drawing task.

The latest completed task is [Purpose and parameter discovery](#purpose-and-parameter-discovery).
The preceding completed task is [Canonical input rejection and same-turn recovery](#canonical-input-rejection-and-same-turn-recovery).
Its focused validation and live observation are recorded below. This completion
does not assert that the timed drawing met every visual requirement.
The target-bound result correction below remains a prior implementation record.

## Purpose and parameter discovery

November 10, 2026 - baseline `036f7f5dc`. Run
`taipei-101-fixed-1794238899355` used eight position-related lookups (76,302 text
bytes) among fifteen lookups (161,457 bytes). Actual delivered D3-D10 show
coordinate queries ranking pagination, hierarchy changes and vector-only edits.
The matcher merges authored purpose, incidental schema prose and names;
single/plural words and parameter shape affect ranking. Generic geometry wording
hides scaling-only scope. These are discovery defects, not execution failures.
The original-thread follow-up confirms that not paging D8 was an agent choice,
E3 performed coordinate arithmetic, and E6 omitted an already-known layer-order
dependency. Thirteen names were saved and five reused; unused saves are valid.

### Bounded contract and reviewed sequence

1. **Compose - purpose and parameter selection.** Replace undifferentiated
   descriptive matching with owner-authored discovery purpose/terms/boundaries
   and independently indexed admitted input fields. Optional `inputFields` in a
   descriptive query selects tools declaring those fields; an open record is not
   proof it accepts every requested field. Return applicability and matched field
   paths in candidates. Exact identities keep their existing authoritative route.
   Normalize ordinary plural words without changing exact identities. Tool names
   remain secondary evidence; never infer capability from another tool mentioned
   in guidance. Keep natural-language discovery for custom registrations with
   ordinary descriptions; no legacy scorer or duplicate execution entry.
2. **Compose/apply - coordinate handoff.** Use the recorded parent origin and
   child position to prove workspace-to-local conversion output can feed the
   existing position mutation in one execute_design request. Verify the actual
   provider-visible selected contracts, negative/nullable results, no successor
   write on missing conversion, and canonical geometry. Fix only a demonstrated
   handoff defect; do not invent an arithmetic tool or relax validation.
3. **Observe - one live run.** After focused tests, owner review, types, scoped
   lint/naming and affected flow checks pass, run the immutable prompt once with
   a thirty-minute drawing allowance. Retain fit-to-content recording, final and
   reload evidence, unlimited original-thread report and the live report session.
   No manual file changes during drawing or any AI report/follow-up. Analyze
   correct candidate selection, acquisition bytes/calls, field matching, bound
   execution and reasons for model handoffs; do not equate unused saves or visual
   iteration with failures. Correctable authored input may recover normally.

Allowed owners: App capability discovery/metadata and its basic/native producers,
coordinate action/result contracts if regression requires correction, directly
affected provider/host tests and recorded fixtures, current App API/spec/Inspector,
this plan and observation report. No Framework geometry redesign, dependencies,
embedding service, mandatory planning/review, compatibility path, full-local/CI,
release work or remote operation. Discovery is fixed to the recorded queries,
their production candidate set, coordinate consumers and contrasting purposes.

Review before implementation: metadata is owned by the declaring operation, not
a name-to-capability table in the search consumer. Parameter matching reads actual
schema fields, not output prose or example values, and does not replace runtime
validation. Candidate boundaries disclose vector-only, scaling-only and evidence-
dependent scope. Existing request-local metadata/corpus reuse retains its identity
and registry-revision lifetime; test unchanged reads and changed registration.
Opaque a/b/c identities, paging, exact ambiguity and compound artifact queries
remain acceptance cases. No precise model-time saving is promised.

Coordinate handoff review: the first draft tried the generic open property map,
which does not declare individual coordinate bindings. The revised proof uses the
existing typed per-element position setter. A separate current defect remains:
workspace conversion declares an untyped value, and Runtime sequence selectors
reject x/y through a nullable union before observing the conversion. Add the
owner's nullable point schema and permit only null-branch omission for sequence
field projection. Actual absent values must stop before the dependent mutation;
saved recipes still require every branch. This bounded change includes Runtime
recipe-schema projection and its direct admission tests, not general open-record
binding or arbitrary union inference. Discovery annotations must be removed only
at execution schema projection, not from candidate metadata. The failing App and
Runtime regressions are prerequisites to this correction.

Step execution card - Compose: input is current admitted descriptors plus query
and optional field requirements; output is ranked candidates with applicability,
field matches and exact usage routes, or explicit no-match recovery. The App
discovery owner never executes a candidate. Test the recorded searches first,
then production/native delivery and existing discovery contracts before advancing.

### Slice review and focused evidence

Compose now indexes declaring-owner purpose separately from incidental guidance,
returns applicability in query/category/recovery menus, and supports declared
input-field selection. Unique Basic API method names use the exact identity
route. The old query-selected summary helper was removed rather than retained as
an alternate scorer. Recorded queries, opaque identities, explicit vector scope,
reachable schema fields, existing compound searches and metadata reuse pass their
focused owner tests. Native provider protocol tests verify actual declarations,
all four recorded query replies and the nullable conversion contract.

Compose/apply execution card: the existing coordinate owner receives a workspace
point and parent ID; the typed position owner consumes the resulting x/y. Runtime
owns reference admission and presence checks, not geometry. The formal proof uses
the recorded negative local y, real Core/render conversion, production action
receipts, one Runtime request and request-scoped artifact ownership. It confirms
one host call completes both operations and actual null prevents position writes.
The nullable admission regression failed before the Runtime correction. Final
review retained strict saved-recipe admission and rejected other missing union
branches. The test harness was corrected to use one request lifecycle and the
existing receipt/cleanup bridge; no product fallback was added for harness errors.

Observe execution card: use the unchanged prompt fixture and existing recorder,
with `--minutes=30`, unlimited same-thread reporting, retained session and strict
stopping only for genuine tool/transport failures. Correctable authored inputs
continue. Freeze source/document edits until the original AI finishes answering.
Completed observation: one unchanged-prompt run completed naturally after 549,051 ms.
Eight discovery calls delivered 88,503 text bytes; eight execution calls delivered
13,756 bytes, with no input rejection or failed tool. Nine names were saved and
six reused through 25 named references; no pure saved-value forwarding call was
observed. The original thread completed its unlimited report and a follow-up, then
remained waiting. Sequence 812 is durable and reload/document-report parity passed.
All 24 frozen source/document hashes matched after reporting.

The live agent did not request position edits or use inputFields; those paths are
proven by the recorded/native regressions, not by this drawing. The follow-up
withdrew a proposed relative-move tool because that ability already exists and
D8 explicitly delivered it. Sample overbreadth was a missing ancestor choice;
repeated facade boundaries contained real offsets/new regions. No additional
product changes were made from unverified AI suggestions. The final independent
overview does not replace the AI's omitted post-fix overview.

Focused validation: 197 App owner tests, 88 Runtime admission tests, one actual
native-provider test and one selected-operation flow proof passed; naming,
scoped lint, App types and Runtime build passed. No full local suite or CI ran.
See [the complete observation and corrected recommendations](../reports/taipei-101-purpose-discovery-2026-11-10.md)
for metrics, original AI report, follow-up, recording and retained-session evidence.

## Canonical input rejection and same-turn recovery

### Thirty-minute follow-up observation

The user requested one additional unchanged-prompt run with a thirty-minute work
allowance. Scope: extend the Taipei benchmark CLI and existing evaluation-window
admission from eighteen to thirty minutes, update their direct regression tests
and active API/spec wording, then observe one run. Preserve the fifteen-minute
default, unlimited same-thread reporting, retained report session, strict genuine
failure stopping and correctable-input continuation. Other evaluators retain
their existing default budgets; the shared process watchdog and cleanup rules
are unchanged. No drawing/tool behavior, prompt or report questions change.

Observe owns the benchmark policy and its same-thread evidence; evaluation-window
admission remains at its current App boundary. Tests first demonstrated rejection
of the requested thirty-minute input in both the runner and production parser.
The focused gates are these two test files, adjacent deadline/report-policy tests,
scoped lint and diff review. Freeze manual changes from live launch until the
original AI finishes reporting.

Completed observation: `taipei-101-fixed-1794238899355` admitted 1,800,000 ms
without changing the fixed prompt. Drawing completed naturally after 669,778 ms;
the original thread completed its unlimited report in 367,118 ms and remains
waiting. Ten outer execution calls succeeded, with no tool/action failures or
input rejections. Reporting left the document unchanged; durable sequence 739
matches the document sequence and reload content is unchanged. All 31 frozen
file hashes matched after reporting. The two updated admission tests failed
before the correction; focused runner/watchdog tests (19), evaluation-window and
control tests (52), scoped lint and diff checks pass. Other evaluator defaults
and the process watchdog remain unchanged. See the
[thirty-minute allowance report](../reports/taipei-101-thirty-minute-allowance-2026-11-09.md).

### Contract, evidence and bounded design

November 9, 2026 - run `taipei-101-fixed-1794226962133`, E6, payload 320
passed a newly grouped element to `core.updateElementProperties` with
`values.name`. The actual selected usage (payload 191) declared an open values
object. Canonical group property resolution rejects that key before applying
properties, but the recorded failure (344-346) retained only AI_EXECUTION_FAILED.
The evaluation controller interrupted at the child completion before the outer
sequence recovery was delivered. The original same-thread follow-up confirmed
that the AI received interruption, not an actionable rejection or the new group ID.

Each owner admits its own input and returns only its own result and processing
status. SceneTree owns registered property target validity, Core exposes that
contract, the App action adapter translates a recognized input rejection into the
provider-neutral Runtime failure contract, Runtime owns write settlement, and the
App maps a safely settled rejection to existing correct_input. Generic exceptions,
invalid owner relations, missing data, output failures and unknown settlement must
not become authored-input errors. No string matching, duplicate property registry,
automatic field rerouting, silent skip, automatic retry or compatibility branch.

1. **Apply - canonical rejection.** First add a failing formal test using the
   recorded name input plus custom registered properties and broken-owner negative
   cases. Give unsupported property targets a typed, detached owner error before
   writes. Export it through Core. Keep normal unknown/internal errors distinct.
   The adapter translates only this recognized owner failure; no model policy or
   rename API knowledge belongs in SceneTree. Verify no partial property apply.
2. **Apply/compose - preserve the handoff.** Runtime carries the typed input
   diagnostic independently of transaction settlement. App maps it to correct_input
   only with known no-write settlement, preserving successful-prefix receipts and
   IDs. Remove the unconditional generic recovery for this recognized route; do not
   introduce a second executor. Existing failed action results remain failures.
3. **Compose/provider - delivery before recovery.** Prove strict evaluation keeps
   the original turn alive for the actual canonical rejection and delivers the
   outer recovery. Then the AI can submit the corrected suffix through ordinary
   admission. Genuine failures still stop writes and drawing; final failed receipt
   delivery must settle before an evaluation interrupt when a tool call is active.
   Deadlines/cancellation remain immediate. Selected usage explains element data
   versus registered properties from its owner declaration, not an App prompt rule.
4. **Observe - integrated proof and one live run.** Preserve exact recorded rename
   and capture arguments in a permanent fixture. Exercise group -> rejected rename
   -> corrected rename -> captures through canonical Core, transaction, Runtime,
   host and the native provider boundary with strict evaluation enabled. Assert
   successful prefixes execute once, no name write on rejection, valid corrected
   name, delivered group ID and two image results. Run one unchanged-prompt
   fifteen-minute 101 drawing only after focused tests, types, scoped lint/naming
   and the affected current flow contract pass. Input correction stays in the same
   drawing turn. The original AI writes an unlimited report in the same native
   thread and the session remains open. Freeze all manual file edits while drawing
   and reporting. Report evidence and any live adoption limitations separately.

Allowed changes: SceneTree property resolution/error/export and direct tests; Core
facade exports; Runtime action error, receipt/serialization and focused tests; App
basic API adapter/declaration, batch receipt, local operation recovery, provider
stop/delivery, direct tests/recorded fixtures; their current package/App specs,
Inspector, this plan and final report. Preserve all unrelated dirty changes.
Discovery is bounded to the traced failure path, its direct consumers and negative
cases. No broad property-validation redesign, new tools/cache, mandatory workflow,
full-local/CI/release checks, commit or push. No persisted data migration.

Naming: SceneTree owns ElementPropertyInputError with elementId/propertyKey;
Runtime owns AiActionInputError with provider-neutral issue data. These are current
in-memory/public failure contracts, not persisted identities or legacy aliases.
Use the existing App correct_input recovery identity. Work-count proof covers
canonical applications/grouping/captures and successful-prefix reuse; no cache is
introduced. The existing compose/apply/observe Inspector steps own this work.

Review: the complete path preserves strict input admission, transaction safety,
canonical ownership and failed-result truthfulness. New groups are validated when
their step runs; no preflight lookup of a not-yet-created ID is required. A failed
sequence stops successors and returns control to the AI rather than guessing how
to continue. Each step must pass its focused regression and negative cases before
the next step advances. Implementation and live observation are complete.

### Implementation review and focused evidence

Apply review: the registered property resolver now emits ElementPropertyInputError
only for unsupported authored keys. Invalid owner relations remain generic faults.
The App translates the typed owner result without routing metadata updates.
Runtime preserves AI_ACTION_INPUT_INVALID and inputIssue separately from settlement.
The original failing test and custom-registration/broken-relation cases pass (12).
Runtime rolled-back/committed/unknown diagnostic cases and adjacent multi-batch
behavior pass (26). Core/SceneTree builds and Runtime production-entry types pass.
The broad Runtime build also checks an existing unrelated test typing error in
recipe-admission.test.ts:1736; it remains unresolved, not reported as a clean build.

Compose/provider review: both browser-error packaging routes consume the same
recovery classifier. It requires a typed input diagnostic, known no-write
settlement and fresh context. Generic recoverable flags cannot bypass stopping.
Terminal tool failures close new native/canvas work admission, let active host
receipts settle and reach native transport, then interrupt. Cleanup remains allowed;
deadlines/cancellation still interrupt immediately and preserve the first failure.
No automatic repair, retry, field reroute or compatibility branch was introduced.

The permanent fixture preserves payload 320's exact rename, captures and selected
result fields. The real Core/transaction/Runtime/host/native-provider test uses a
small existing drawing, groups once, rejects the recorded rename, obtains groupId
from the selected delivered assembly receipt, corrects only the unfinished name
and captures, and receives two distinct images in the same strict native turn.
The mocked pixel source tests delivery, not rendered geometry. Native reporting,
retained session, deadline and cancellation cases pass (28 selected tests).
Adapter/transaction tests pass (51); handoff/evaluation/exchange tests pass (99);
three selected execution-flow proofs, two Inspector contract checks and naming
(15) pass. Server types and scoped lint pass with three existing console warnings.
The old property revision expectations were updated. A stale measurementIssues
failure expectation was removed: retired mandatory measurement evidence is not a
current operation failure; inspectionIssues remains covered. No full-local suite,
release checks, commit or push ran.

### Live observation and closure

Run `taipei-101-fixed-1794235733611` used the unchanged fixed prompt (SHA-256
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`). Drawing
stopped at its fifteen-minute deadline, not an input-error stop. One nonplanar
needle input returned correct_input before writes; the original drawing turn
repaired the retained draft and continued without replaying earlier construction.
The live run did not exercise the canonical name rejection; that route is proved
by the recorded-parameter Core-to-native-provider regression above.

The original native thread completed its unlimited report in about 7m30s and
remains waiting for questions. Its document was unchanged while reporting.
All 25 frozen implementation/test/document hashes remained unchanged through
report completion. Final evidence has no collection errors; durable sequence
1015 equals the document sequence, and the reloaded document is unchanged.

Nine outer execute_design calls returned eight successes and one corrected
rejection, with eight delivered image blocks. Seventeen contract queries returned
166,280 text bytes; execution responses returned 21,034 text bytes, excluding
image bytes. Ten names were acknowledged as saved and seven names were referenced
in later work; unused precautionary saves are not failures. Remaining search and
image-redisplay observations are follow-up candidates, not extra changes in this
task. The drawing still had an unsubmitted ornament refinement at the deadline.

See the [implementation and live report](../reports/taipei-101-canonical-input-recovery-2026-11-09.md)
for the failure/recovery evidence, owner boundaries, limitations and the original
AI's complete report. No compatibility route, full-local test, commit or push
was added during closure.

## Independent retention and delivery

### Contract and bounded implementation

Run `taipei-101-fixed-1794215656743` E3 repaired the crown, captured the workspace
overview and retained crown IDs, but delivered no image because retain implicitly
selected status-only delivery. The original AI confirmed the omission in follow-up
`01a1bfd6-68e8-7902-a170-2d255a18212d`. Preserve both exact requests as evidence;
do not amend immutable observations or the drawing prompt.

Retention and model delivery have independent responsibilities. Retain selects
portable input/result snapshots and names; it never changes returned work data or
images. Omitted delivery returns the ordinary final public result (final stage
application for stages; the existing ready-batch receipt for an anonymous ready
batch). Explicit status returns no work values/images. Explicit fields return
only those selected values/images. A successful save adds its compact saved-name,
source and shape receipt, not a second copy of the saved value. Apply the same
rule to direct drawing, ordinary sequences, ready batches and staged execution.
No legacy mode, alias, automatic image replay or required extra query is allowed.

1. **Compose - regression and default delivery.** Record the real failed crown
   draft, its retained source and exact E3 repair/capture input in a permanent
   fixture. Demonstrate failure before implementation. Correct the existing host
   result-selection owner, invocation schemas, model projection and image
   provenance together. Keep normal output ownership; appending a save receipt
   must not suppress or weaken final-result validation. Verify omitted/status/
   selected delivery with and without retain, including a three-step all-selected
   result, storage failure and execution failure without replay.
2. **Compose/provider - entry consistency and contract removal.** Exercise direct
   drawing and stages, remove their implicit status defaults, and update the
   public declaration/examples, usage, active API/spec/Inspector and contradictory
   tests. Inspect the actual provider packet and dispatched response, including
   image blocks, not merely owner schemas. Existing explicit status calls remain
   status-only. Retained values remain browser conversation snapshots; request
   handle lifetimes, failure recovery and permission admission remain unchanged.
3. **Observe - one live run.** After self-review, focused tests, server types,
   scoped lint/naming and the affected current-source flow gate, run one unchanged
   prompt fifteen-minute Taipei 101 drawing. Same native thread, unlimited report,
   retained session. Freeze manual edits from launch through completed reporting.
   Report actual adoption separately from formal coverage and keep all evidence.

Allowed mutation scope: local-tool-host, local-result-delivery, local-design-
sequence, direct drawing/provider/discovery consumers only as required by this
contract, focused tests/fixtures, active API/spec/Inspector/plan and final report.
Fixed discovery: retain/delivery branches, default/status wording and their direct
tests within those owners and current App documents. No crop/bounds changes,
geometry changes, mandatory reuse/Knowledge, new cache or tool, unrelated old-test
cleanup, compatibility, full-local/CI/release tests, commit or push. Preserve the
160 pre-existing dirty entries. No public identifier rename or persisted format
migration is needed; changed invocation behavior receives a current revision.

Step execution card: compose receives retain and delivery separately, dispatches
existing owners once, saves requested portable values in the existing conversation
owner and emits the selected final data/images plus save metadata. The provider
encodes only selected image bytes; capture does not repeat for delivery or saving.
Storage failure remains observable with acknowledged execution preserved. The
formal proof must count applications, captures and saves, and compare delivery
with retention toggled. Review each owner slice before advancing.

### Implementation review and focused validation

The host now preserves normal final delivery while appending save metadata.
Removed the retain/stage implicit status branch. Default sequence leaves still
pass their registered owner projection and validation; the outer execution
receipt does not validate a compact public structural receipt as raw execution
arrays. Ready batches also retain their registered public projection. Explicit
status and fields remain explicit selections. Default failures keep the original
execution recovery once, while selected delivery keeps its failure envelope.
No compatibility route or extra model call was added.

The exact E3 regression failed before implementation (zero images only when
retain was present) and passes afterward. Validation includes 154 cases across
the host, context delivery and recorded integration suites, followed by the
24-case final delivery/failure matrix and three selected-result/ready-batch
cases. Three native-provider tests verify the actual declaration and dispatched
image blocks. Cases overlap; counts are not additive. Applications, captures
and saves are counted; storage failure preserves the captured image and settled
writes without replay. Contradictory tests now explicitly request status when
asserting no returned work values. Two stale API/spec default-status descriptions
were removed. Server types, naming (15), Inspector contract tests and scoped lint
passed (one existing console warning). Current-source execution-owner baseline
passed in candidate `2465a8a3-1c04-4d02-bfd8-a1446ff48005`. The ordinary verifier
uses a historical accepted architecture; the current-source candidate proves
the changed architecture without restoring that old contract or running negative
scenario sweeps.

Live observation is complete, but the drawing did not complete: run
`taipei-101-fixed-1794226962133` stopped at 547.363 seconds on a later property
update failure. The unlimited original-thread report completed in 297.310 seconds
and remains open for follow-up. E2 exercised retain with omitted delivery and
successfully delivered its image; E5 delivered both selected images. Durable
sequence 794 and reload equality passed. See the
[independent retention/delivery report](../reports/taipei-101-independent-retention-delivery-2026-11-09.md)
for the complete original report, validation and separate new failure. This task
does not claim a successful complete 101 drawing or authorize unrelated fixes.

Original prompt SHA-256:
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
Manual file edits were frozen through drawing and the same-thread unlimited report.

## Previous target status

November 9 follow-up - the target-bound execution correction and its requested
live observation are complete, with the validation limitations below retained.
The original report session remains open. See the
[target-bound results report](../reports/taipei-101-target-bound-results-2026-11-09.md).
Earlier targets below remain implementation records.

## Target-bound execution results

### Bounded correction and reviewed design

The preceding run's E6 submitted details, a step-time region group and two
dependent captures. Its published groupId path was rejected before execution
because the sequence compiler replaced the registered action with the opaque
private batch. This section supersedes that route, not the canonical group API,
target resolver or Runtime dependency validation.

1. **Compose - preserve the execution owner.** Add a permanent fixture from
   `taipei-101-fixed-1794209667880` E6 and its acknowledged saved input sources.
   First reproduce the rejection through the production host with actual Core
   construction/grouping, the registered region reader and capture consumer.
   A named/dependent target-bound operation must retain its registered action
   identity and complete execution/model result schemas. Its existing wrapper
   admits either ordinary canonical arguments or target-supplied arguments, then
   uses the existing target resolver and canonical admission before dispatch.
   Anonymous independent operations retain batching. Remove the downstream
   single-batch model-owner substitution once the compiler retains the owner.
2. **Compose/inspect - prove the complete handoff.** Keep live selection after
   earlier writes, exact expected-count admission, one region resolution per
   distinct query, canonical action validation, conditional output and failed
   prefix/no-replay behavior. Test the real geometry and region parameters through
   create -> select -> group -> both captures in one host call. Include invalid
   target input, no-match/wrong-count, missing/failed grouping output and existing
   artifact fan-out consumers. Inspect actual provider declarations/usage and
   native dispatch, not only raw owner schemas. Update contradictory old tests.
3. **Observation.** After focused tests, type/lint/naming and current-source flow
   proof, run one unchanged-prompt fifteen-minute drawing. Preserve same-thread
   unlimited reporting and the retained session. Freeze edits throughout drawing
   and reporting. Review actual adoption separately from formal coverage.

Allowed changes: App sequence compiler, registered operation wrappers/dispatcher,
direct host consumers, their focused tests/recorded fixtures, current API/spec/
Inspector/plan documents and the final report. No framework admission relaxation,
new public tool, compatibility route, prompt forcing, new cache, full-local test,
release checks, commit or push. Preserve unrelated dirty changes. No persistence
identity changes are needed; wrapper revisions change with their contract.
Current request registration owns derived schemas; target membership remains
dispatch-local and is never cached across writes. Existing canonical owners
retain all geometry, selection and mutation semantics.

Step execution card: compose consumes the admitted operation and canonical target
schema, emits the same typed action contract to Runtime and model delivery, and
dispatches through the current secured action exchange. Inspect consumes its
actual groupId. Failure remains at input/target/result admission with real
settlement; no substitute ID or blind continuation is allowed. The first formal
regression must fail before production edits. Review the changed owner and its
direct handoffs before advancing; no unrelated discovery or cleanup is included.

### Direct-consumer review refinement

Typed target-bearing wrappers add an input alternative. The existing shallow
usage navigation must expose each wrapper branch's direct fields and argument
union choices, without recursively expanding all owner schemas or requiring an
extra discovery call. Ordinary argument validation remains complete; target
arguments undergo the existing complete bind/admission before mutation. Update
old exact wrapper paths and dependency revisions, not the current semantics.
A broader composition test-file run also reached unrelated superseded mandatory
mechanical-review expectations; those are outside this contract correction and
are not evidence to restore automatic checks. The three directly affected
composition/prefix tests are selected separately and use current revisions.

Current target-bound correction validation: the recorded create/region/group/two-
capture regression now passes, including wrong-count, empty-region, failed-owner
and missing-ID boundaries. Focused suites passed 139 integration/host/delivery
cases, 159 operation-contract cases, five native-provider cases and three directly
affected composition cases. Server type checking and naming passed; scoped lint
has no errors and one pre-existing test console warning. The broader composition
file still has 24 unrelated retired automatic-review expectations; it is not
reported as passing. Same-context acquisition still uses two calls; the complete
native contract now totals 33,793 bytes versus the historical 27,762-byte baseline
(compact action route: 23,703 bytes). This correction proves handoff correctness,
not a reduction in contract bytes. Live adoption is recorded below.

The final negative flow proof exposed a stale verification manifest: removing all
native tools also breaks the existing evaluation-report case, which now obtains
and calls execute_design. Both observed failures are explicitly declared for
that mutation; positive assertions and production behavior remain unchanged.
This bounded verification correction includes the App flow manifest.

Current-source positive flow evidence passed at accepted revision 30 (attempt
e0803658-d042-4d8e-a14b-53ec50f58ee1). The corrected omit-registered-tools negative
case produced exactly its two expected failures. The broader negative proof did
not finish: the unrelated dispatch-rejected-history mutation failed to collect
cases (attempt 17284c0d-667d-4c2f-ac4d-049d990c2d32). This is an explicit validation
limitation; no history-operation implementation or unrelated tests were changed.

### Live observation

Run `taipei-101-fixed-1794215656743` used the unchanged prompt and a 900,000 ms
drawing deadline. Drawing ended voluntarily after 442.382 seconds; the original
native thread completed its unlimited report in 436.238 seconds and remains
available for follow-up. No manual files were edited during either phase.

Two live sequences bound groupId to captures successfully. They used saved and
previous-step IDs for grouping, not a region-to-group selector; exact coverage
of the preceding failure therefore remains the recorded regression, not an
unexercised live-route claim. One nonplanar author face was rejected and repaired
without stopping or replaying successful work. Seven contract queries returned
73,963 text bytes; seven execution calls returned 8,933 text bytes and six images.
Three acknowledged ID names were reused without a separate value read.

Remaining observations: retain without explicit image delivery caused one
snapshot recovery, a manually selected crop required correction, and known
geometry parameters were copied instead of bound. These are recorded for review;
no new mandatory workflow or automatic image delivery was introduced. The AI
qualified its initial completion claim, yielding partial App settlement. Runner
evidence separately confirms durable sequence 681 and identical reload content.
The complete original report, screenshots, recording and validation limitations
are linked from the report above. No commit or push was performed.

## Provider-visible handoff contracts

### Evidence and bounded task

Run `taipei-101-fixed-1794165655396`, provider request
`69f37a9d-385b-4723-8116-b7e3c57f290c`, and same-thread follow-up
`01a1bf0d-64fa-75f2-b93f-cc0b8993b3d5` supersede the previous attribution:

- The same-submission input example exists at the owner but is removed by the
  provider schema projection. Ordinary usage picks the first valid example, while
  the new example was second. The previous raw-owner test proves execution only.
- Four identical projections are 70 bytes each; a named reference is 56 bytes.
  Non-use did not add a forwarding call or cause drift. Do not force alias use.
- The unused context lookup provided actual region/filter syntax. Host target
  schema was empty while internal admission had the complete owner schema. It is
  not proven that the entire lookup was unnecessary.
- Outer inspection lacks scope/default semantics in the delivered declaration.
  Deletion usage lacks narrow count/status selectors, so selecting actionResults
  also delivers its automatic image. Capture and delivery are separate controls.

Authorized scope: compose/provider contract projection, sequence declarations,
existing operation target/result owners, direct focused regressions and their
API/spec/Inspector/plan documentation. Preserve all unrelated dirty changes and
existing execution, storage, optional-path validation, capture defaults, staged
execution, recovery and report-session behavior. No compatibility routes, new
execution tools, compulsory reuse/Knowledge/planning, full-local/release/CI,
dependencies, commits or push. Do not modify the drawing prompt. Do not edit any
files while the live App AI draws or reports.

### Reviewed steps and execution cards

1. **Compose/provider - executable examples.** Canonical owners are
   design-workflow-discovery, local-ai-provider, local-operation-tools and
   local-design-sequence. Select one valid primary owner example through one
   shared selector. Deliver it in the native schema and in usage without
   duplicating all examples; make input reuse the host's primary example.
   Regression must inspect the actual thread/start dynamicTools packet and send
   its example through the native tool-call dispatcher. Preserve schema
   compaction and ordinary usage's separate invocation field. Replace the old
   raw-owner-only publication claim; keep its execution coverage.
2. **Compose - target contract handoff.** Source the public host target schema
   from the existing canonical batch target declaration, already derived from
   the admitted region resolver. Reuse it for ordinary steps, stage operations,
   apply steps and iteration checks/repairs without an independently maintained
   filter schema. Inspect provider output and execute the recorded region/suffix
   deletion through the host without a context-contract lookup or model ID read.
   Invalid selectors still fail before writes. Missing resolver capability does
   not advertise region selection. No cache or new query owner is needed.
3. **Compose/inspect - explicit capture and narrow results.** Publish outer
   inspection scope/default behavior at its schema owner, including that explicit
   capture still runs. Publish deletion count/status paths from its result owner
   using the existing typed conditional result-navigation mechanism. Derive a
   submitted sequence from provider-visible contracts: delete, build and capture;
   retain the original recorded selectors and use defer plus narrow delivery.
   Verify actual capture counts, one selected final image, deletion count/status,
   settled writes, and preservation of optional-path failures and automatic mode.

Each step first demonstrates a formal failure, then implements, reviews the
provider packet and direct consumer, and runs only relevant focused tests. Public
projection happens in the existing request-owned declaration construction; result
selection and target schemas retain their existing owners and lifetimes. Count
actual dispatches/reads/applies/captures instead of treating metadata as execution
proof. Current-source flow evidence covers the completed compose owner boundary.

After all three steps: unchanged-prompt 15-minute drawing, unlimited report in the
same native thread, retained session, recorder persistence/reload evidence and
visual inspection. Report adoption separately from capability availability;
unused saves and different artwork duration are not regressions.

### Step 3 regression refinement

The recorded E5 regression rejects the advertised deletion count before execution:
region targeting compiles to the private batch, whose result declaration only
navigates retained identities. A second conflict exports model-selected fields as
Runtime output bindings even though compact model values and execution receipts
are different contracts. The existing observer already captures projected step
results. Keep model field selection there; portable model-only fields do not
become Runtime output bindings. Preserve execution-field exports needed for
resource lifetimes. Resolve a selected single-operation batch through its admitted action's model
result contract, keep execution receipts unchanged, and retain conditional-path admission
and missing-field failure semantics. This bounded correction includes the direct
consumer local-tool-host; it adds no execution route or compatibility behavior.
Prove the actual recorded region operation, narrow scalar delivery and explicit
image count before live evaluation.

The direct-consumer regressions additionally exposed batch lease declarations
that covered structural receipt aliases but omitted query snapshot/lease fields.
Build resource navigation from admitted output lifetime metadata, including query
snapshots, rather than only structural receipt ownership. Preserve selected
artifact output and subsequent snapshot reuse. This is a current-contract owner
correction, not a compatibility path or a requirement for the AI to export data.

### Progress

All three provider-boundary regressions failed on the previous behavior and now
pass. The recorded E5 executes ten deletions plus construction and one selected
final image; defer captures once and immediate captures twice. Direct-consumer
review caught and corrected selected-resource lifetime loss, with subsequent
snapshot reuse now covered. Final focused verification: 134 handoff/host/result
tests plus seven native-provider tests passed; naming and server typecheck passed;
scoped lint has zero errors (three existing console warnings). Current-source
flow attempt f446f53a-3ce0-43ef-926a-9fb90aa4d75b passed all 89 cases; reviewed
contract 5f6cc91942eee486ea9d6b720bf002d74feccdb6b5762013a4e4e5ac9b289545
was accepted. No full-local, release or CI run.

The single live observation `taipei-101-fixed-1794209667880` completed drawing in
13m 14.038s and an unlimited original-thread report in 8m 57.018s. The immutable
prompt was unchanged; no files were edited while the AI drew or reported. The
session remains waiting. Durability reached 564/564, reload matched, and reporting
did not modify the document. See the
[provider handoff report](../reports/taipei-101-provider-handoffs-2026-11-09.md)
for native contracts, all discovery/execution calls and the original report path.

Live verification exposed an unresolved dependency route: target-bound grouping
compiles into the private batch, whose execution output does not carry the
advertised groupId for subsequent capture bindings. Model delivery now resolves
the actual action owner, but Runtime dependency admission still sees the batch
contract. The AI attempted the correct combined sequence and was forced to split
it after rejection. This is not an AI path error and is not fixed by the current
changes. Direct-ID grouping coverage and model-selection coverage missed this
region-targeted dependency combination. The next bounded correction must retain
the real action execution contract through target resolution and regress actual
E6 create/select/group/capture parameters, including failed or missing results.
No follow-up implementation was made after observation; do not mark the whole
handoff flow closed.

The run exercised eleven acknowledged saves and six reused names, with no full
saved-value retrieval. Current bounds were legitimately read through context;
decided ordering and final captures were combined. Same-submission input aliases
and deletion selectors were not used live and remain formally verified rather
than live-adoption claims. Ten contract replies totaled 101,837 recorded bytes;
nine execution replies totaled 13,282 bytes and delivered seven App images.
Different artwork complexity does not establish a speed improvement.

## Executable contracts and decided handoffs

### Evidence, scope and reviewed design

Run `taipei-101-fixed-1794161375677` and native follow-up
`01a1bc79-09bc-7443-899c-5b0ec97893fd` establish two distinct errors. E1 guessed
`/preparationInput/draft` although that output is only preparation-source metadata.
The host already resolves same-submission authored-input aliases, but the agent
could not establish that timing from delivered usage and split known work. E3
omitted the capture wrapper envelope: discovery mixed ordinary action parameters
with a different callable route, supplied no executable example, and the host
example builder did not apply argumentField. These are not missing drawing tools.

Twelve saves and nineteen successful bindings across nine names prove useful
continuity without full-value readback. Unused saves remain valid. E7 reads new
bounds, not redundant data. E6 exposes avoidable receipt/image delivery; later
visual decisions remain legitimate. The shorter `group elements` query ranks a
movement recommendation above grouping; the longer prior regression does not
cover it. No timing comparison between different artwork establishes causality.

1. **Compose - executable route consistency.** Deliver the registered host
   wrapper's actual input/output schemas for routed actions, across usage, full
   and field selection. Derive examples from owner examples in that same schema;
   remove the mixed ordinary-schema/host-envelope contract. Keep native-only and
   canvas batch routes distinct; no alternate input admission or compatibility.
   Replay the actual failed capture parameters and execute acquired examples
   through the production host, including failure before writes.
2. **Compose - same-submission input reuse.** Publish and execute a generic
   host example that retains authored input and consumes it later in the same
   submission. Use the existing alias resolver, with no extra read/store or
   mandatory persistence step. Replay E1's real geometry with correct input
   aliasing; preserve cyclic/missing-source rejection and existing cross-turn
   context isolation. Do not broaden preparationInput into an echoed draft.
3. **Compose - result-to-consumer handoff.** Use owner-declared result paths
   to expose exact named-step binding/selection locations and their types and
   optionality. Regress grouping to a narrow geometry read and selected delivery
   in one host call. Existing schema selection and Runtime optional binding own
   validation; no new result store, guessed array search or always-return-bounds.
4. **Compose/inspect - purpose and selected images.** Correct incidental
   recommendation metadata so the real short grouping query and opaque-name
   variant identify grouping before movement. Preserve compound-search coverage
   without query-specific ranking. Regress outer inspection defer plus explicit
   multi-image selection and narrow group ID delivery; prove capture counts and
   fresh images without adding automatic inspection suppression or a new gate.

The canonical owners are local-operation-tools, local-design-sequence,
local-result-delivery, existing API/inspection schema declarations and their
focused tests. Mutation scope includes their current API/spec/Inspector contract,
this plan, permanent recorded fixtures and final live-report evidence. Preserve
all unrelated dirty work. No framework execution redesign, extra dependencies,
Asyra skill, subagents, full-local/release/CI checks, compatibility paths, forced
planning/Knowledge/reuse, drawing-prompt changes, commits or remote Git actions.

Review each owner's current Inspector inputs/outputs, error owner, direct consumers
and existing accepted cases before edits and advancement. Add failing behavioral
regressions before fixes; review the resulting diff, directly affected tests and
contract together. Existing alias resolution already owns source reuse, existing
registered schema selection owns result paths, and inspection owns pixel work.
No cache or new materialized state is needed. Tests must count browser exchanges,
actual applies, saved reads and captures where those are the intended improvement.

After four steps, run focused owner/provider/contract checks and one unchanged
prompt fifteen-minute drawing. The original native session writes an unlimited
report and remains open. Freeze manual edits while the model draws or answers.
Report contract errors, actual bindings, separate forwarding calls and reasons
for returning to the model, including non-adoption without assuming a defect.

### Progress

Steps 1 and 2 passed acquired-example and recorded E1 regressions: actual host
wrappers agree across views; same-submission authored input executes three real
preparations with zero stored-value reads. The 157-test discovery owner suite passed.

Step 3's first real consumer exposed another mismatch: context input IDs added a
256-character bound absent from the canonical document-reference result type.
Static composition correctly rejected that incompatible producer/consumer pair.
Remove the consumer-only ID restriction and use the canonical reference schema
in context IDs and parent/ancestor selectors. This is the same handoff boundary,
not a Runtime relaxation or a group-specific exception. Preserve unrelated name
filters. The permanent group-to-recorded-bounds regression must prove one grouping
and one read through the host before advancing.

All four implementation slices now pass their focused regressions. Grouping binds
the declared conditional ID into the recorded geometry query in one submission.
Short and long purpose queries pass with real and opaque identities (164 discovery
and search cases). Selected capture proves exactly two captures and two delivered
media paths with outer defer and only a selected group ID. The integration file's
65 other cases passed; after correcting the new media assertion to the actual
`media` envelope, the capture case and acquired-envelope case passed as well.
The narrow capture fixture preserves recorded views/selection but uses the fixture's
current target rather than the recorded tower's region; live evidence verifies
actual canvas pixels. No capture behavior was changed to accommodate the fixture.

Self-review caught and corrected a projection regression: full result-schema
requests must not additionally materialize the compact result-path structures.
The existing scoped-result proof and selected-contract proof both pass. Typecheck,
scoped lint (zero errors; one pre-existing console warning), naming, and diff checks
pass. No runtime alias resolver, optional binding validator, saved-data store,
automatic suppression policy or compatibility parser was added. Final candidate
flow proof and the unchanged-prompt live observation were completed below.

Completion evidence: all 89 current-source flow cases passed in candidate
`4203d765-1dcc-47cf-bd11-1fc05487cf9f`; contract review
`d46986e9a00d7822bf4c53694040841d6cab8dd4e4addd1976314391fac23134` was accepted.
Run `taipei-101-fixed-1794165655396` used the unchanged prompt and 15-minute ceiling;
drawing completed natively in 300,983.84 ms and the same thread wrote its unlimited
report in 300,210.30 ms. Session remains waiting. Four discovery calls returned
45,406 text bytes; five executions returned 8,025 bytes and four images. Seven
successful saves, one direct named binding, zero saved-value readbacks and zero
pure-forwarding calls were observed. A non-coplanar authored face was repaired from
retained source in the same drawing turn without replay; no blocking error.

The corrected capture envelope was received and used correctly. Same-submission
input reuse and group-to-bounds chaining were formally verified but not used by
this model run. An unused context lookup and an automatic intermediate capture
remain model choices; existing outer defer controls the latter. Preserve these
limits rather than claiming adoption from availability. Report/reload document
equality passed, durable sequence is 355, and evidence collection has no errors.
See [the implementation and live report](../reports/taipei-101-executable-handoffs-2026-11-09.md)
for full evidence and the unchanged original AI report. These four slices are
complete; no further implementation, commit or push is implied.

## Discoverable handoffs without mandatory reuse

### Evidence and objective

The observation `taipei-101-fixed-1794155277890` and its two same-session
follow-ups establish different findings: E4 selected only its last capture;
D3 could not discover an existing-image recovery operation; D2 returned two
descriptions for one capture capability; D4 ranked an incidental preservation
description above grouping. Provider instructions restricted step names to
binding even though delivery and retention also use them. Two preparation
descriptions still advertised removed criteria. These are contract and handoff
defects, not evidence that unused saved values are waste.

Saving for a possible later phase is successful even when no consumer follows.
Keep full values in App conversation context and return a small index describing
the saved name, producing operation, input/result selection and available shape.
The AI may bind a known saved field directly later. No required reuse, plan
registration, extra acknowledgement, automatic value return or quality gate.
The objective is fewer model acquisition/forwarding turns, not less tool work
or a shorter drawing at a different level of detail.

### Ordered implementation and review

1. **Compose - remove conflicting contracts first.** Test actual provider
   declarations and preparation guidance; remove obsolete criteria wording and
   the binding-only step-name rule. Audit the same current prompt, discovery,
   spec and test owners for superseded review requirements. Historical reports
   remain evidence. Review this cleanup before proceeding.
2. **Compose - discovery and execution identity.** Return one callable usage
   route for a canonical action/wrapper pair, including captures; retain explicit
   qualified lookup and genuinely different namespaces. Correct canonical capability metadata where an operation is described only by
   implementation details or a recommendation for another operation. Preserve
   generic metadata ranking and verify relevant purpose coverage. Regress the real grouping query,
   opaque names, compound queries and reference acquisition together.
3. **Request/compose - useful storage receipts.** Have the existing App store
   produce a bounded description when saving, carry operation/source provenance,
   and return the same index in the execution receipt and next-turn context.
   Preserve direct bindings, document/conversation isolation and existing
   capacity limits. Replace superseded wire shapes and their tests together.
4. **Inspect - recover captured pixels.** Expose retrieval of request-owned
   captures by identity or target/view without capturing again. Deliver through
   the existing image channel with capture identity and snapshot semantics.
   Editing the document must not turn an old image into current verification.
   Prove capture work counts, selection, unknown handles and request lifetime.
5. **Whole handoff observation.** Run focused affected-owner tests and scoped
   type/lint/contract checks. Run one unchanged-prompt fifteen-minute Taipei 101
   observation, followed by the original AI's unlimited same-session report;
   retain the session. Ask about receipt usefulness, discovery, multi-image
   selection/recovery and why decided operations were separated. Do not edit
   any files while it answers. Compare handoffs, not unequal artwork durations.

Scope is the existing plan's implementation owners and their direct tests,
current API/spec/Inspector contracts and live reporting questions. No new
compatibility paths, dependencies, release work, full-local tests, remote Git
operations or drawing-prompt changes. Test each defect before its owner fix;
review each slice against actual producer and consumer contracts before advancing.
Unneeded saves, fresh visual decisions and normal model waits are not failures.

### Progress

Live admission follow-up: `taipei-101-fixed-1794160792861` failed before provider
creation because the report question fixture contained 8,634 characters and the
browser parser imposed an unjustified 8,000-character ceiling. No drawing or
model report occurred. Restore the exact recorded questions, remove only that
ceiling from the canonical parser and current spec, and replace the old rejection
oracle with lossless long-instruction admission. Preserve nonblank/type checks,
independent drawing deadlines and unlimited reporting. The actual fixture and
8,001/16,000-character regressions fail before the fix. Do not shorten questions
or modify the drawing prompt to accommodate an obsolete limit.

Cleanup: the actual-provider regression failed on obsolete criteria wording,
then passed after both preparation descriptions and the step-name restriction
were corrected. Scoped review of current prompts, discovery, Knowledge, execution
spec, API and Inspector found no remaining positive retired-review requirement.
Removed an unused criteria test helper and replaced an unrelated search fixture's
obsolete prose. Historical reports and explicit absence assertions remain intact.
Search review: changing global ranking to privilege a first sentence, or globally
normalizing plurals, regressed existing compound and metadata searches. Those
changes are rejected. The first incorrect owner is the grouping description:
it describes geometry preservation without the existing-elements/position task
terms, while movement descriptions lead with group-related guidance. Correct
these actual capability descriptions and retain the tested generic ranking; do
not add query-specific routing or infer semantic synonyms from every identifier.
Discovery owner review passed 162 focused tests, including the recorded query
with canonical and opaque identities, compound queries, native namespaces and
canonical capture usage. The duplicate route is removed only when the canonical
action already supplies its executable wrapper route.
Storage review: real staged inputs, selected-prefix recovery, direct bindings,
reference delivery and App snapshot tests pass after replacing string-only save
acknowledgements. Empty JSON Pointers are explicitly admitted through the Runtime
output schema. Descriptors are produced on save and reused in later context.
Capture recovery review passed the actual omitted-overview host replay and
request/currency tests. Historical redisplay uses original bytes; current-image
checks still reject stale evidence. Provider and browser checks also exposed
stale description assertions and an outdated partial-field expectation: no
successfully delivered definition is failed/completed, followed by exact narrow
recovery. Updated those tests without changing recovery behavior. Browser tests
run in jsdom. Current Flow Inspector proof passed all 89 cases, including saved
provenance and capture recovery. Focused lint/type/naming and recorder checks are
part of final validation. No full-local or release checks were run.
Final handoff review found an existing capture lifetime omission: inspectionId
was a plain string, and retention admission checked only top-level result paths.
The recovery owner must not inherit that contradiction. Mark the canonical
capture identity and its recovery metadata request-owned, select nested lifetime
through the existing Runtime schema resolver before execution, and preserve
portable sibling fields. Regression tests distinguish rejection before capture
from a later unavailable-image error. No new approval or reuse obligation.
Final current-source proof: `6888b1cb-6313-44f0-8a0d-a566d068db57`, all 89
cases passed. Source digest: `9ed265c71cd3569afe8c7e7bcb1ad90011b3642d86f7fb6815399a2ef1b323df`.
Focused owner, browser handoff, provider, retention recovery and recorder tests
passed; server typecheck and focused lint passed (existing console warnings only).
Naming passed 15 checks. The unchanged prompt SHA-256 remains
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
The subsequent report-instruction ceiling correction passed 28 parser tests and
12 recorder contract tests, with focused ESLint and diff checks. The exact
8,634-character recorded questions were restored; long questions pass unchanged.
The 89-case proof above predates this narrow parser correction and is not relabeled
as a proof of the later source.

Live observation `taipei-101-fixed-1794161375677` then completed drawing naturally
in 703,084 ms and unlimited same-thread reporting in 306,778 ms. Both correctable
admission errors recovered without stopping or replaying successful writes.
The run saved 12 names and successfully consumed 9 through 19 named bindings,
without a separate full-value retrieval. Multiple images were selected together.
Persistence sequence 619 is durable; reload and report document checks match.
No recorder/evidence errors occurred. The full report and qualifications are in
[Taipei 101 - Discoverable handoffs](../reports/taipei-101-discoverable-handoffs-2026-11-09.md).

The original session remains waiting on port 3047, with collaboration 4147 and
persistence 4247. No manual file edits occurred during drawing/reporting. No
commit or push was requested. Remaining observations are not silently closed:
the shorter live query `group elements` ranked grouping second, the first capture
submission missed its documented wrapper envelope, and a grouping capture
coexisted with an explicit overview. Historical-pixel recovery was not needed in
this run. Do not turn these observations into mandatory workflows or infer that
unused saved data is a problem.
The previous original session remains retained and idle.

## Previous target status

November 8, 2026 - implementation is authorized in the existing worktree,
under [Editable Design Agent](ai-design-agent-plan.md). The user approved removing
mandatory data-evidence review and completion gates, retaining tool input/output
validation and the primary AI's final verification, and examining other tools
for the same unnecessary procedural coupling. Review and iterate each owner slice
with focused tests only. After implementation, run one unchanged-prompt Taipei 101
observation with a fifteen-minute drawing limit, followed by an unlimited report
in the original native session. Retain that session afterward. No edits while
the App AI produces its report or a follow-up answer.

The active target is [Predictable tools without mandatory review ceremonies](#predictable-tools-without-mandatory-review-ceremonies).
It replaces the earlier direction of refining mandatory evidence acquisition,
signed judgments and an App-owned approval ledger. Previous implementation and
observation sections below are historical records, not additional active work
instructions or acceptance obligations. The replacement is implemented and its
focused verification and one authorized live observation are complete. See
[the November 9 implementation and observation report](../reports/taipei-101-direct-observations-2026-11-09.md).
No compatibility route, optional legacy review mode or renamed equivalent gate
is part of the replacement.

The preceding observation is `taipei-101-fixed-1794134061041`; its original native
thread `01a1bab9-4972-7623-9949-8359a8f7522b` remains retained for questions.
Preserve its report, follow-up `01a1bae2-ee24-7a71-b6c3-8d6f96bcd600`, provider
payloads and prior worktree edits. Do not edit files during an App AI report or
follow-up answer. Historical completion claims do not establish this target's
readiness or completion. The new observation is `taipei-101-fixed-1794155277890`;
its original native thread `01a1bbfd-0f51-7a61-851c-0a67a5de7c35` is also retained
in `waiting` status. Drawing ended voluntarily in 727.684 seconds; the unlimited
same-thread report completed in 355.042 seconds. No App tool failed. The AI's
retrospective qualifies the artwork as partial against the full visual request;
this does not represent a restored App approval gate. Persistence and reload
verification passed. No edits occurred during the report.

## Predictable tools without mandatory review ceremonies

### Objective and scope

The AI understands fixed tool contracts before calling them, plans and delegates
decided operations, reuses staged data, and performs final verification against
the user's request. Tools do not infer the next consumer or invent missing
parameters. A declared result missing at runtime is a tool defect; a correctly
declared result insufficient for a reasonable task is a capability-design finding.
Record the input, delivered contract, actual result and missing consumer need to
distinguish these cases. Do not solve either with a Taipei 101-specific branch.

The App owns execution, dependencies, result storage, identity/lifetime checks
and honest operation settlement. It does not require the AI to register and
maintain a second formal approval state for its own design judgments. Success
is predictable handoff with less unnecessary acquisition and data forwarding,
not shorter drawing time, compulsory reuse, more detail or mandatory Knowledge.

This review examines App tool declarations and prompts, discovery, sequence
admission/delivery, reference/media owners, review/fact/calculation owners,
post-write checking, provider settlement and their direct consumers/tests.
Discovery uses current definitions and call sites, retained provider inputs and
outputs, scoped source searches and the existing spec/Inspector. It does not
audit unrelated framework features or use removed code as behavior authority.
Mutation scope is the implementation owners and direct consumers/tests/contracts
listed below, including current Inspector data and report questions. Preserve the
drawing prompt and unrelated worktree changes. No full-local tests, release work,
dependency changes or remote operations.

### Confirmed findings and disposition

Paths below are repository-relative; line numbers in historical reports are
locators, not frozen behavior contracts.

| Current owner and evidence                                                                                                                                                                                                                                                        | Target disposition                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/design-data-evidence.ts` and `server/local-operation-tools.ts`: data queries call the canonical reader, save values under evidence IDs and reread them for judgment/completion. `server/local-design-review.ts` requires a declared data criterion and `dataEvidenceIds`. | Remove the model-facing data-evidence protocol and its completion dependency. Retain canonical data reads, complete/truncated result semantics and actual operation validation. Do not replace it with a hidden automatic approval ledger.                                                                                                                                                                            |
| `server/local-design-review.ts`: capture checks require a plan; verdicts require request/requirement/check signatures; regional judgments require declared units and whole-view obligations. The App prompt requires this formal review flow.                                     | Remove mandatory criteria registration, bind/record verdict operations, signatures, unit quotas and whole-view certification gates. Preserve actual capture, target/region meaning and AI inspection of relevant results, including the final result. A screenshot is an observation, not an App-issued design approval.                                                                                              |
| `server/local-operation-tools.ts` `settleOutcome` rewrites completed outcomes for quality/measurement state; `server/local-ai-provider.ts` calls completion revalidation.                                                                                                         | Remove approval-ledger and pending-review prerequisites from final settlement. Preserve real tool failures, cancellation, unknown writes, delivery failures and durability acknowledgements. AI-described incomplete work must remain incomplete.                                                                                                                                                                     |
| `server/local-reference-decisions.ts` and `select_design_references`: reference use depends on criteria, requirement revisions, declared units and signed use receipts; consumers treat omitted uses as reference-free.                                                           | Remove the formal reference-use approval chain and its capture/fact prerequisites. Use existing attachment/reference identity, selected source/region and ordinary authored purpose/limitations. Preserve access, decoding, coordinate bounds, provenance and source-local failure handling. No mandatory re-import or suitability certification.                                                                     |
| `server/local-design-facts.ts` and the facts/calculations tools: derived notes require retained valid source facts; criterion/element bindings feed review invalidation.                                                                                                          | Remove mandatory source-fact registration and criterion bindings for saving notes or continuing work. Reuse existing conversation retention for actual operation inputs/results; retain direct optional note storage for standalone authored values. Preserve source attribution and actual calculation capabilities. Do not require `record_design_facts` then `record_design_calculations` merely to store a value. |
| `server/local-operation-tools.ts` `finishInspection`: changed targets trigger measurement even when capture is deferred; missing/pending mechanical checks can suppress automatic images and block completion.                                                                    | Remove unconditional post-write quality-measurement work and approval gating. Keep checks needed to admit/execute the operation itself. Explicitly requested mechanical analysis remains composable and reports its result without registering new global completion obligations. A valid requested diagnostic capture need not wait for unrelated quality checks.                                                    |
| Discovery's advertised unique-complete-match rule and Inspector complete-first rule conflict with score-first selection and its new tests. The same import-purpose query previously returned executable usage but now returns a candidate menu.                                   | Replace conflicting rules together. Test normal-purpose acquisition and incidental-output interference jointly against the real catalog; a green synthetic ranking case does not prove both. Do not prescribe a scoring shortcut as the product requirement.                                                                                                                                                          |
| Host registration, discovery, `output` and `delivery.fields` use different schema projections. Discovery catches proof failures as conditional fields; host catches selector errors as `correct_input`.                                                                           | Keep this generic defect in scope even after retiring `/dataEvidence`. Distinguish actual optional fields, invalid authored selectors and unsupported/broken owner schemas. Prove retained tools' declared results through real binding and delivery routes; never loosen validation to make paths pass.                                                                                                              |

`server/` above means `apps/asyra-design/server/`. These are observed behaviors,
not measured latency claims. The data-evidence mechanism checks source currency,
not whether an AI-authored pass correctly interprets the data. Normal data
acquisition already returns a signed next invocation; it does not always require
a separate bind call. Internal repeated reads are not extra model exchanges.

The bounded pass also checked Knowledge, reusable-tool registration/saving,
construction preparation and context/target selection. Keep direct known-ID
Knowledge reads and optional discovery; no compulsory Knowledge lookup exists
in that contract. Keep dependency/type admission and save-only retry for reusable
tools; inline work needs no registration ceremony. Keep compiler validity,
resource bounds, target identity, transaction/Undo behavior and no-replay recovery.
Do not classify these as unnecessary just because they reject unsafe execution.
Template values remain distinct from SceneTree shared elements/properties.

### Target flow and handoffs

1. **Understand and plan - AI, compose.** The request and optional reference
   assets inform the AI's plan. Discovery supplies fixed inputs, outputs,
   conditional branches, units/coordinate spaces, effects and recovery. No
   prerequisite criteria, fact or approval registration. The AI can revise its
   plan without weakening or replacing the user's actual requirements.
2. **Delegate and execute - App host, prepare/apply.** The AI submits known work
   through `execute_design`. Existing bindings connect producer results to
   consumers; existing stages and declared mechanical iterations remain usable.
   Validate known dependency paths/types before effects and actual optional
   values when they become available. Stop an invalid successor without replaying
   a completed prefix. Tools never fabricate an absent result or choose design
   parameters on the AI's behalf.
3. **Retain and observe - App context and data/image owners.** Explicit retention
   preserves useful parameters and results even without a known later consumer.
   Forward results internally when decided; deliver status or selected values
   and images when requested. Captures and data reads work without criterion IDs,
   verdict signatures or a quality-ledger pass. Describe snapshots, identities,
   resource lifetime and freshness precisely; persistence does not make old
   geometry current. Repeated layouts use existing templates, overrides and
   computation tools rather than expanded model-authored item lists.
4. **Decide and verify - AI.** New visual/semantic decisions return to the AI with
   the requested observations. The AI verifies the final result against the
   original request and states unresolved limitations. This is a responsibility,
   not another tool attestation, fixed screenshot count or required verdict call.
   A declared mechanical comparison may run in the host when its inputs and
   conditions are already known; a successful capture is never an automatic pass.
5. **Settle - provider and conversation.** Report actual execution, persistence
   and the AI's task conclusion without an App-owned artistic approval state.
   Quality-review absence does not turn a completed operation into failure.
   Actual failures/unknown settlement remain visible and cannot be promoted to
   success. Existing report-session retention and untimed follow-ups are preserved.

Conditional dependencies and durable storage intentionally have different
lifetime requirements. One canonical meaning does not mean identical owner,
Runtime and model schemas. Remove discovery-only annotations at the appropriate
boundary without stripping validation or request/document identity semantics.
No blanket `runtimeOperationSchema(..., true)` substitution is specified.

### Implementation order and removal boundaries

The user has authorized this reviewed target. Before production changes,
reconcile the exact current
[execution specification](../specs/ai-execution-flow.md),
[API surfaces](../API_SURFACES.md) and
[Inspector flow](../../../../../tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs)
with this target. Their current mandatory-review clauses describe unmodified
runtime behavior, not obligations to preserve in the replacement. Replace clauses
at their owners; do not append exceptions while leaving contradictory requirements.

1. **Review-free observations - inspect and compose owners.** Prove and connect
   the existing canonical data-read and capture routes, with stable documented
   results and direct reference/media access. Remove criteria prerequisites from
   these observation consumers and preserve grouping, capture selection and
   result/media delivery. Do not delete the shared criteria producer while the
   reference/context consumers in slice 2 still require it. Use existing
   observation tools rather than adding a parallel replacement endpoint.
2. **Reference and context continuity - compose/inspect owners.** Replace
   criterion-bound reference uses with existing reference identity/region inputs;
   update construction, capture, fact and selection consumers in the same slice.
   Remove fact/calculation registration requirements used only for review. Keep
   sources/limitations as data, not prerequisites for approval. Existing `retain`
   saves a real step's input/output; it is not an arbitrary standalone note writer.
   Preserve direct optional note recording at the existing owner without requiring
   prior source-fact registration, and expose its values for ordinary named reuse.
   Do not invent dummy drawing/computation to save a note or claim a nonexistent
   generic save route. Remove the unused receipt schemas, stores and
   lifetime restrictions belonging only to the retired approval protocol.
   Asset access/ownership and other live resource restrictions remain.
3. **Retire approval and settle honestly - inspect/apply/settle owners.** After
   slices 1-2 have removed the consumer dependencies, delete
   `define_design_criteria`, review bind/record/data-evidence protocols and their
   exports, the formal-review `plan`/`reviewChecks` parameters of
   `prepare_and_apply_design`, signed `next` judgment templates and the approval
   ledger. AI planning and executable `operations`/`stages` remain. Remove automatic
   quality-measurement scheduling, review-state
   invalidation and completion-only rereads. Retain operation-local validation
   and explicit diagnostic/mechanical checks. Remove ledger-driven outcome
   rewriting in provider, final actions and UI consumers; keep partial receipts,
   unknown writes, failed publication and cancellation. Do not substitute an
   automatic pass or convert actual faults into warnings. Final response
   transport does not become a second write route. Update affected declarations
   and consumers with each removal; no legacy alias, hidden rebinding or optional
   compatibility review mode remains. Slices 1-3 form one replacement, not
   separately completed product contracts.
4. **Fixed contracts and acquisition - compose owner.** Remove retired tools and
   parameters from catalog, native declarations, examples and recovery hints.
   Resolve remaining result-schema projection/error-classification defects using
   supported, non-retired tools. Test real-purpose lookup and incidental matches
   together; preserve exact identities, real ambiguity and known-tool execution
   without mandatory rediscovery. Delete superseded policy tests, not useful
   negative cases or immutable evidence.
5. **Whole-flow verification and documentation.** Update current App prompt,
   spec/API clauses, Inspector steps/routes and their formal proof mapping with
   the affected implementation slices, then review the integrated contract.
   Update self-report questions, recorder/evaluation assertions and report
   interpretation that assume signed review or App approval. Keep the drawing
   prompt unchanged, the original reporting session, unlimited report duration
   and the no-file-edits interval. Missing retired review steps must not become
   evaluation failures; real tool and evidence-collection failures remain visible.
   Existing owners are `compose`, `prepare`,
   `apply`, `inspect` and `settle`; `observe` remains diagnostic. Inspect's output
   becomes observations/check results, not approval authority over settlement.
   Review each slice and its consumers before advancing. Only focused tests and
   affected source/type checks; no full-local or release gates. A live model run
   is now authorized once, after the focused implementation gates pass.

Primary implementation files are the audited owners above plus
`local-design-workflow.ts`, `local-tool-host.ts`, `local-operation-batch.ts`,
`local-tool-invocation.ts`, `local-design-sequence.ts`, `design-check-results.ts`,
the App prompt, constants, direct conversation/result consumers and the existing
drawing-test report/evaluation consumers. Shared Runtime
changes are limited to generic schema/admission defects demonstrated independently
of the removed review protocol. Do not move App approval policy into Runtime.

### Focused acceptance and evidence

November 9 final review: the four affected browser cases passed after aligning the
E2E backend with the App backend; the first mismatch was test environment setup,
not a product persistence failure. Independent pixels, edits, Undo/Redo, peer edits
and durable reload remain covered without verdict recording. The emitted material
reload screenshot was inspected. Runtime admission passes 87 cases; recorder
contracts pass 13; server type checking passes. Retention/schema consumers pass,
including the inherited-lifetime regression. Native provider tests use current
scoped acquisition and follow bounded delivery rather than assuming one response.
The current flow candidate passed (`43138412-63a4-4c66-9c84-7cc2057026d0`)
and its explicit contract retirement was accepted. The final scoped lint has no
errors (one existing console warning); naming and server type checking pass.
The flow gate exposed one obsolete wording assertion, now aligned with the
current optional-input contract. No removed runtime behavior was restored.
Exactly one live fifteen-minute observation completed on separately configured
ports, preserving the preceding retained session. The fixed drawing
prompt SHA-256 remains
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.

Step execution card - complete observation handoff, `inspect` and `settle`:
existing `inspect_drawing` remains a canonical read and is admitted as a composable
operation so decided construction and capture can run in one sequence. Preserve
its image validation, crop limits, canonical stamp and cancellation. The previous
control-only classification failed both real created-target chain regressions;
the current route passes without reintroducing the retired review wrapper.

Step execution card - schema projection, shared Runtime:
selecting a nested union result must validate that selected value, not the original
action envelope. The permanent admission regression failed with missing original
envelope fields; it now passes with projected union validation schemas. The 87-case
admission file passes. Optional selected values remain checked at execution; absent
values stop the dependent step without replaying prior effects. Unsupported owner
schemas remain owner failures, not correctable AI selectors.

The final schema review also reproduced inherited request-lifetime loss when
materializing a selected union field. The permanent regression failed because the
projected string omitted `x-runtime-value: request`. Schema materialization now
preserves inherited lifetime as well as the selected validation shape. This keeps
request handles out of conversation retention; it adds no approval requirement.

Step execution card - direct consumer retirement, `compose` / `inspect` / `settle`:
remove retired protocol fixtures and assertion cases. Preserve canonical image
currency, grouping, history, peer edits, persistence, media delivery and explicit
mechanical checks through their existing owners. Current Knowledge and selected
usage must not publish criteria registration or bind/record instructions. Historical
recordings remain immutable evidence, not current contracts or compatibility paths.

Review evidence so far: 185 construction/discovery consumers and 112 flow,
Knowledge and evaluation cases pass. Real provider-purpose discovery and opaque
names jointly use purpose/input term coverage before weighted relevance; incidental
output matches cannot outrank stronger intent matches. Source/input error ownership,
requested captures, no unrequested post-write reads, and actual unknown writes have
separate regression assertions. Remaining gates are provider integration, current
Inspector mapping, affected browser cases, type/lint checks and the authorized live
run. This is not a completion declaration.

Step execution card - observation consumer, `inspect` / `apply-to-inspect`:
the acknowledged target and explicit capture choice enter the existing image
owner; output is its receipt or capture error. No quality measurement is a
prerequisite. Unknown writes and cancellation bypass capture. The boundary is
`local-operation-tools.finishInspection`, its workflow callers and the permanent
`review-free-operations.integration` cases. Existing input/output, transaction
and reference ownership stay authoritative. Before implementation the new cases
fail twice: immediate and deferred observation both dispatch `review_design`.
The unknown-settlement negative passes. No cache or new public tool is introduced.

Step execution card - fixed acquisition, `compose` / `compose-to-execute`:
registered native wrappers own their declared invocation envelope, while ordinary
actions own their unwrapped parameters. Do not advertise a native wrapper through
an action-alias route that expects a different input. The real context-owner
navigation regression originally failed before dispatch with a nested `arguments`
error. Use the existing registered-tool invocation route for canonical batch
wrappers; preserve exact namespaces, revisions and ordinary action execution.
Discovery-only schema annotations must not become Runtime constraints, but actual
resource lifetime annotations remain. Publicly expose the existing Runtime
`RecipeReferenceError` type so consumers distinguish missing/conditional selectors
from unsupported owner schemas; do not classify arbitrary schema errors as AI
input correction. No saved identity or compatibility alias is introduced.

Initial focused evidence: observation/workflow tests passed 93 cases; standalone
context, host handoff and pixel/source race tests passed. Native capture output
validation reproduced and removed the stale required approval revision. Remaining
consumer, discovery, Inspector and report checks are pending. Retired approval-only
tests are replaced by direct data/image/context cases; historical fixtures remain
unchanged. No completion or live quality claim is made yet.

- A simple style edit, a repeated-component layout and a reference-backed graphic
  execute and expose final observations without criteria registration, data
  evidence IDs, signed judgments or a pending-quality completion gate.
- A multi-stage operation binds producer output directly, optionally retains
  useful context and reuses it in a later turn. No value-only read is needed just
  to forward saved data. Standalone numeric/source notes can be stored without
  inventing prerequisite facts or a canvas operation. A new visual decision still
  returns to the AI.
- Known declaration mismatches reject before effects; a missing optional value
  rejects only its dependent step at execution. Acknowledged prior writes remain
  visible and are not repeated. Tool-schema defects are not labeled AI input errors.
- Real image identity, invalid crop, unavailable media, malformed output, stale
  mutation targets, foreign request handles, cancellation and unknown settlement
  retain meaningful errors. Saving authored values does not extend a resource lease.
- Requested capture works without unrelated measurement approval. Explicit
  numeric/layout checks still return findings, but no check is silently scheduled
  merely to satisfy a removed completion ledger. Assert owner call/read counts,
  not just successful outputs; concurrent-change-sensitive operation checks stay.
- AI final verification remains in the prompt and observable final explanation;
  tooling does not demand a new checkbox or proof token. Actual failed/incomplete
  work and publication uncertainty remain distinguishable from quality opinions.
- The recorded import-purpose query and opaque-name/incidental-output cases pass
  against the real catalog and actual provider declarations. Retained generic
  result contracts agree across discovery, step bindings, selected/full delivery
  and named reuse. No retired tool or parameter remains advertised or auto-inserted.

Extend the existing `data-review.integration`, `review-free-operations.integration`,
`criteria-reference-handoff`, `image-delivery.integration`, `result-delivery-handoff`,
`phase-continuity.integration`, `local-tool-host`, `discovery-delivery.integration`,
`local-ai-provider` and execution-flow tests. Replace former approval requirements
with independent observation/settlement cases. Preserve valid target, input/output,
media and recovery negatives. End-to-end proofs must not use
`withReviewBindingActor` or another test adapter to invent missing AI calls.
Existing raw 101 fixtures are regression inputs, never special execution branches.

Open proof obligations: exact removal reachability, generic replacement schema
behavior, absence of hidden review calls and preserved failure handling require
implementation-time regressions. No claim of latency reduction, model adoption,
Inspector admission or implementation completion is made by this plan review.

Documentation review: source tracing distinguishes operation validation from
approval policy; current Inspector conflicts are identified for replacement,
not treated as preservation requirements. Consumer-first removal avoids a
criteria/reference dependency gap. Standalone note storage is not incorrectly
equated with step-bound retention. Existing files retain their prior historical
body; local links and target anchors were checked. Implementation, focused regressions and current Inspector reconciliation are in progress. No live observation has occurred in this task.

## Historical implementation and observation records

The remaining sections preserve earlier task decisions and evidence. Their
imperative wording, completed checks and live-run allowances are historical;
they neither reactivate mandatory review nor authorize another implementation
or drawing run. Use only the active target above for the next task's scope.

## Correctable sequence input and bounded live iteration

November 8, 2026 - the user approved immediate correction after the read-only
trace, followed by at most fifteen new fixed-prompt drawing attempts. This
supersedes the earlier single-attempt/no-retry boundary for this task only.
The preceding run is historical evidence and does not consume this allowance.

Objective: malformed authored parameters must reach the original agent as
correctable input without terminating its drawing turn. Genuine App failures,
missing required data, failed delivery, unknown settlement and the fifteen-minute
drawing deadline retain their stop behavior. Ordinary visual correction is allowed.
Keep completed writes; never auto-correct geometry or replay successful prefixes.

Scope: Runtime recipe admission issue classification, App host translation,
invocation/provider/evaluation handoffs, direct permanent regression tests and
these current contracts. The frozen discovery set is the prior run's second
input/output, those direct owners, their error schemas, existing negative cases
and failures found in this task's live attempts. No prompt coaching, model change,
new planner/validator/cache, full local tests, release work or remote operation.
Use the existing worktree and preserve prior edits. Existing source/value and
saved-context ownership remains unchanged.

1. At compose admission, distinguish canonical authored-value rejection from
   dependency, schema or unclassified binding defects. Runtime owns the typed
   issue code; App maps complete, known value issues to existing correct_input.
   Preserve mixed/omitted issues as blocking. No error-message matching.
2. Prove the recorded projection.kind failure before effects, direct/sequence and
   selected/status parity, then corrected suffix execution without replaying the
   previous tower. Verify provider evaluation leaves the same drawing turn active
   for correct_input, while genuine failure and deadline still interrupt it.
3. Remove the stale spec wording that failed visual checks or ordinary corrective
   rework stop the task. Update spec, Inspector and Runtime contract together.
   Focused checks: Runtime admission; App host, evaluation and recovery; actual
   created-target integration; mapped source proof; scoped type/lint/naming and
   runtime builds. Review each owner and negative cases before advancing.
4. Run the original prompt, fifteen-minute ceiling, until a complete tool-flow
   observation succeeds or fifteen starts are used. Record each start, exact
   failure, root cause, correction and the next verification in the existing
   task report. Genuine tool defects stop that attempt; let the original AI finish
   its unlimited report before editing, then fix/test/review before restarting.
   A parameter correction within a live turn is not a new attempt. Preserve
   fit-to-content video, unchanged drawing/report canvas, persistence evidence and
   original native-thread identity. Retain the final report session for questions;
   explicitly close superseded sessions before the next implementation/run.

Naming: add the Runtime-owned value issue category to AiRecipeIssue. It denotes
canonical authored-value validation, not a tool identity, stored recipe format,
or automatic retry command. No compatibility alias or persisted-data rewrite.
The existing App recovery identifier remains correct_input.

### Attempt 1 revision - reference selection admission

Run `taipei-101-fixed-1794112907923` exposed a second authored-input category:
the agent selected `/preparationInput/draft/...` from a construction result.
The delivered contract includes preparationInput metadata, but its canonical
schema has no draft. Existing same-call retained input bindings can carry that
draft instead. This is not lost App data or an unsupported composition capability.

Compose execution card: Runtime source-path resolution owns typed reference
selection failures; admission preserves that type; App host translates only a
complete known set before execution. A source selector that cannot be established is correctable; this does not
make it valid or widen schema projection. Keep schema parsing failures, incompatible
types (including opaque selected values), missing dependencies, omitted issues and unknown settlement blocking.
Do not infer categories from message text or alter the provider's stop policy.
The implementation allowlist is recipe-schema, recipe-admission, recipe-types,
local-tool-host and their direct tests/contracts. The permanent regression uses
the recorded base and two-tier request, proving zero writes on bad selection and
same-call retained-input repair without repeating the base. Review mixed failures and
opaque-value assignment failures as well as provider continuation before attempt 2. Reports must
finish before any edit. Attempt 1's original untimed report has completed.

### Attempt 2 revision - source-local reference recovery

Run `taipei-101-fixed-1794114048516` corrected an unknown selected step within
its original turn, then stopped on one 404 among two reference imports. The owner
explicitly describes source-local recovery, but did not publish settlement/recovery;
Runtime therefore reported unknown settlement and evaluation interrupted the turn.
This is not confirmed loss of required App data. Preserve the successful reference
and let the agent select another source; do not automatically repeat acquisition.

Compose execution card: add the reference acquisition owner and evaluation recovery
to this iteration's allowlist, with their direct regressions and schemas. Publish
select_reference only before attachment admission; failures during App admission
remain unknown and blocking. Aggregates must preserve all child outcomes and native
images. Test partial success, all-source failure, unknown attachment admission,
independent delivery failure and same-turn provider continuation. Review source,
Runtime and model receipts together. No download/security/resource guard change,
no new search strategy, no prompt edit. Attempt 2's original report has completed.

Bounded iteration status: complete after three of fifteen permitted starts.
Attempt 3 completed work and the original untimed report, retained the session,
and proved durable reload equality. Exact rejected-input/source fixtures and
negative cases passed focused validation. See the
[complete iteration report](../reports/correctable-input-iterations-2026-11-08.md).
This status applies only to the stopping/recovery correction above, not the
remaining context, delivery or cache candidates in this broader plan.

## Reference receipt and discovery follow-through

November 8, 2026 - implement the follow-up review of
`taipei-101-fixed-1794130103950` and its two original-thread follow-ups.
This section supersedes claims that reference-free capture proved reference-use
chaining, or that referenceDecisions was safely portable. The existing positive
storage test endorses the wrong lifetime and must change.

Bounded task: reference selection/result ownership, host admission and direct
capture consumers, capability discovery ranking/menu delivery and selected
contract presentation, their permanent focused tests and existing API/spec/flow
documents. Preserve the dirty worktree. No new dependencies, model/prompt change,
mandatory planning, mandatory Knowledge, forced batch size, renderer redesign,
release/full-local tests, commits or remote operations. One final original-prompt
15-minute observation; unlimited original-thread report, retained afterward.
No agent file modifications during reporting or follow-ups.

Evidence: discovery returned 138,424 text bytes across 11 calls. Initial vector
and plan selections were unused; unused tools and later-unused data review were
model choices. D8 returned partial lexical candidates including unrelated uses
of material; material revision requires an existing world field and is not a
local-gradient conversion. H2 selected only the criteria revision, causing H6
to repeat identical reference decisions. Independently, the producer's opaque
referenceDecisions array advertised conversation retention while consumer receipts
are request-owned. The prior capture regression removes referenceUses.

Ordered slices and execution cards:

1. **Canonical reference result and lifetime.** Compose/reference owners share
   typed snapshot/use/receipt schemas. Publish actual nested output paths and
   request lifetime through selection, discovery, admission and runtime storage;
   portable authored decisions remain storable. Replace the false positive
   retention oracle. Prove rejection before effects for request-bearing snapshots,
   while selected delivery and portable input storage remain valid. Keep pending,
   restricted, rejected, unchanged and stale-use semantics. Do not weaken the
   consumer or make request handles durable.
2. **Reference-backed chain.** Use this run's actual criteria, decisions and
   captures. Create current receipts through the real reference owner; bind them
   and construction outputs into capture in one host call. Never strip
   referenceUses or replay old request receipts. Cover stale/foreign/changed uses,
   preservation of completed writes and valid same-request reuse. General ID
   binding is insufficient proof. Existing owner state remains authoritative;
   do not add a second receipt store.
3. **Purpose discovery.** Replay D8 and retained purpose/name-independent cases.
   Separate strong purpose relevance from incidental schema vocabulary. Keep
   exact routes, partial-match honesty and explicit existing-field preconditions.
   Reduce candidate presentation to the information needed to choose an owner;
   do not eagerly repeat every branch's executable guidance. Full/selected
   contracts and complete inventory remain available. Measure outgoing bytes and
   verify usable selection paths, not only a byte ceiling or tool names.
4. **Selected contract delivery.** Replay D1-D11 with the actual scopes, then
   legitimate narrower scopes. Remove redundant common packaging at its assembly
   owner where equivalent execution/lifetime/recovery meaning remains available;
   preserve canonical parameter constraints, examples when useful, result paths,
   bounded pagination, cache invalidation and honest delivery. Model-selected
   unused fields are not grounds for silently omitting requested schemas. Keep
   concrete authoring and visual decision boundaries; no new planning ritual.
5. **Observation.** After slice review and relevant focused tests, run once with
   the fixed prompt and 15-minute work deadline. Ask the original AI for the
   unrestricted report on discovery, reference receipts, named reuse and reasons
   for returning control. Verify actual provider delivery, document invariance,
   persistence and retained-session status. An unfinished artwork is not a tool
   failure or a passing visual acceptance. Record unexercised routes separately.

Readiness: the existing reference decision owner already creates current receipts
and validates request/revision/purpose; host portability derives from schema.
Repair that producer rather than adding downstream exceptions. Search owns the
existing indexed metadata/corpus and retained discovery replies; do not introduce
a new cache. Whole-flow proof must include current reference uses and native media
selection, not just successful geometry application. Each slice must show its
failing oracle, focused green checks and bounded self-review before advancing.

### Follow-through implementation review

The producer now shares typed decision/use/receipt snapshots with correction
output. Request indexes and receipts are nonportable; source-input decisions
remain storable. Host registration preserves result navigation into discovery.
The original four retention cases failed before the change. Self-review found
and closed the correction-result escape using the same schema, with a failing
regression first. Real current receipt binding, recorded base construction and
whole-view capture now execute in one host submission. The older crown test is
explicitly reference-free and no longer represents reference-chain proof.

Purpose ranking no longer prioritizes all-term coverage over stronger purpose
metadata. Self-review also found automatic acquisition could still select the
sole complete but lower-ranked match; it now requires that match to be ranked
first. Permanent opaque-name cases prove both boundaries. Candidate scopes omit
repeated representation prose; exact navigation retains it. The recorded material
query returns 11,288 bytes in the bounded fixture and still exposes the existing
field prerequisite. It does not turn material revision into gradient conversion.

Selected-contract review found canonical schema factoring and narrow selection
already available. The same recorded broad draft selection remains complete:
32,615 bytes in two responses. A caller-selected narrower scope accepts the actual
base arguments with the same retention/results/recovery: 20,997 bytes in one
response. No additional blanket schema omission or invented limit is warranted.
The selected-representation regression now requests optional author fields that
its fixture actually uses; the previous test incorrectly assumed they were
implicitly selected. An older candidate-menu test now follows the explicit exact
route before expecting complete representation instructions.

Focused validation: 114 discovery/reference cases passed, followed by five
selected discovery rechecks including the new automatic-selection regression;
two construction/capture cases and two execution-flow cases passed. The recorder's
12 contract cases passed. Server type checking, scoped lint and naming gates are
required before observation. No full-local, release or publication checks run.
One final 15-minute drawing will use the unchanged prompt; the report includes
receipt handoffs, unused query selections and actual stage transfer causes.
Freeze source files through drawing and unlimited reporting, then preserve the
original report session for user questions.

## Third-run delivery review and four-slice correction

November 8, 2026 - the user authorized four ordered corrections, focused
regressions using attempt 3, and one final fixed-prompt fifteen-minute observation.
The user then required another complete handoff review before implementation.
This section records that preimplementation review and supersedes the delivery
work order below; completed recovery work remains complete. Implementation authorized. The compose slice first demonstrated the two obsolete
controls being silently accepted in the recorded E5 request; selected/status
retention controls passed. The original report session was
checked and remains waiting, not generating a report.

Evidence: `taipei-101-fixed-1794114896420`, request
`8022bce0-16d3-4e31-b0a6-62732377cbff`, native thread
`01a1b994-db52-7753-858c-220e818babbb`. Payload numbers below identify that request's
immutable provider records. Preserve the report and original requests. Some
recorded instruction prose is redacted; compare retained structured contracts
and current generators without claiming the redacted text was model-visible.

### Findings that change the implementation design

| Finding                                                                  | Evidence and consequence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retention is not the only reason E2 omitted images                       | Payload 71 imports images first, then records facts and calculations, with `response:full` and `retain`. Payload 84 contains only status. The sequence planner also defaults its output to the last step, so removing retention alone would still not select the earlier images. Intermediate-step delivery must be explicit and survive composition; do not automatically echo every intermediate result.                                                                                                                                                       |
| E5 requested both storage and output                                     | Payload 131 explicitly selects the reference-decision step with `output` and saves `/referenceDecisions`; payload 140 returns only `saved` and `toolOutcome`. Host selection computes the recipe output but replaces the external reply with `resultDelivery.finish`. Publish one external delivery decision and independent storage semantics, rather than another precedence exception. Runtime recipe output remains a separate internal computation contract.                                                                                                |
| Narrowing only the native invocation schema would miss earlier admission | `local-tool-host.register` publishes static owner schemas into Runtime; `prepare` calls `library.admitInline` before native invocation. Selected model paths are checked again against the registered model schema. The importer currently publishes a singular/plural union. Prefer one canonical reference-result envelope across input forms, success and source-local recovery; do not implement a leaf-only schema fix or relax all optional-path validation. Verify every consumer before replacing that result contract.                                  |
| Acquisition incorrectly advances delivery state                          | `local-reference-tools.projectDelivery` adds an attachment to `deliveredImages` before host selection, media encoding and provider protocol write. E2 returned no images; E4 reused cached bytes and delivered two images. Storage, metadata selection, failed encoding and cancelled writes must not count as image delivery. Transport submission still does not prove the model inspected or retained an image.                                                                                                                                               |
| Completion telemetry precedes transport submission                       | `local-ai-provider` records `tool_completed.imageCount` when content items are constructed, before its continuation checks stop state and calls `writeProtocol`. That count alone is not proof of submission. A successful stream write is also not proof of model perception. Compare constructed content, transport submission and available native echoes separately; do not move the same ambiguous flag one function later and call the lifecycle fixed.                                                                                                    |
| Current media provenance does not cover every result route               | Selected live fields carry a `LocalToolImage` side channel. `readNamedFields` returns plain JSON without it; ordinary `output` projection has a separate path. `localToolImages` intentionally scans canonical receipts, not arbitrary `fields` or authored objects. Confirm saved/selected media behavior with a failing regression before changing it; never fix this by recursively treating arbitrary image-shaped data as trusted media. This was not the cause of E9, which read metadata and shape, not pixels.                                           |
| Persistent names and request image handles have different lifetimes      | Browser conversation results survive request boundaries, but imported attachments live in request-owned image tools. `attachmentIndex` is currently a plain count in the import schema, and `retainReference` writes diagnostic assets, not App conversation attachments. A stable content identity or saved number is not a live image capability in the next request. Preserve portable source metadata; establish explicit availability/lifetime for media before allowing stored results to imply redisplay. Do not create an unrelated durable image cache. |
| Mapping navigation needs structure, not the complete value               | E9 (266/267) reads 2,338 bytes of reference decisions and approximately 395 bytes of two mapping shapes. Selected construction usage advertises `/createdTargets` but omits its nested `keyToId` structure. The complete owner schema has it. Publish the minimum canonical structure, including multiple compositions, rather than assuming `/0` always identifies every part or treating shape discovery as misuse.                                                                                                                                            |
| Capture uses subtree membership before regional cropping                 | E10 (271) selects the correct IDs for `base-y`, `bamboo-3-south` and `crown-taper-y`; their window elements are siblings. Render extracts only the selected object subtree. E12 (331) selects the owning groups and regions. Preserve that behavior. Selected capture usage must retain target membership and target-local coordinate semantics, not only image-size limits. No automatic regrouping, target promotion or visual approval.                                                                                                                       |
| Existing tests stop short of the failed handoffs                         | Reference tests call the import owner and media encoder directly; one test calls the importer twice before encoding either result, yet expects the second result to omit images. Host image tests cover direct/selected/full/status routes, but not this importer state transition or later saved-result reads. Add a connected oracle; do not preserve an incorrect call-count-as-delivery expectation.                                                                                                                                                         |

The source-confirmed path gaps above do not all constitute observed failures in
attempt 3. In particular, saved-image redisplay, successor-request handle reuse,
transport failure after selection and multi-composition navigation require formal
boundary cases. Do not report them as events that occurred in this drawing.
Unused saved values, legitimate shape queries and new visual decisions remain
valid behavior. The run used six saved names through 32 named bindings; storage
adoption did not fail generally.

### Ordered implementation and review

Frozen scope: App composition/admission, result storage and delivery, reference
acquisition/media egress, selected construction/capture contracts, their direct
provider consumers, focused permanent tests, API/spec/Inspector documentation.
Inspect Runtime admission as a consumer; do not add a second dynamic schema
system when a canonical owner result can satisfy the existing registry. Preserve
prior worktree changes. No model or drawing-prompt changes, dependencies,
release work, remote operations, mandatory saved-value consumption, new visual
planner, image resizing, automatic repair or expanded persistence product.

1. **Unify external result delivery independently of storage.** Execution card:
   compose owns `local-design-sequence`, `local-tool-host` and their direct
   tests. Public `output`/`response` are removed without compatibility aliases;
   `delivery` and `retain` keep their existing names and lifetimes. Gate: recorded
   E5 obsolete controls reject before dispatch; selected/status saves preserve
   the same decisions; existing stage and failure-prefix tests pass. Compose owns the
   model-facing decision; Runtime owns internal recipe outputs; canvas batching
   owns compact/full mutation receipts. Resolve public `output`, `delivery` and
   `response` overlap across native wrapper, ready batch, dependency sequence and
   staged paths together. Remove misleading public controls rather than adding
   silent translation precedence. Explicit selected outputs must not disappear
   when retention is added. Status-only requests must stay small. Earlier-step
   selection must work without changing execution order. Retain successful
   prefixes, settlement and diagnostics on partial failure; do not replay them.
   First reproduce E5 and E2 with their original controls, then test the current
   corrected contract, including rejected superseded combinations before effects.
   Review all direct consumers and focused tests before advancing.
2. **Align reference results and native media delivery end to end.** Execution
   card: reference acquisition owns the normalized envelope and request lifetime;
   host selection and native content/provider submission own media delivery.
   Keep `references`/`actionResults` identities, remove importer `refresh` and its
   invocation-count display state. Verify actual E2 status then display, E3
   metadata selection, singular parity, request-handle save rejection, existing
   partial-source recovery, media provenance and actual native submission.
   Reference
   acquisition owns bytes, source outcomes and stable content identities. The
   outer delivery boundary owns image selection and transport submission state.
   Prefer removing acquisition-owned "already shown" suppression: an explicit
   image selection should deliver cached pixels, while status/metadata selection
   should not. Keep within-reply pixel deduplication and acquisition reuse.
   Do not add a model-visibility registry or equate cache hits with prior display;
   retire `refresh` if its only remaining purpose duplicates explicit delivery.
   Replace the singular/plural result ambiguity at the owner and update discovery,
   static Runtime registration, selectors, projection, recovery and provider
   consumers together. Text metadata must not stand in for image content. Replay
   E2-E4 through actual host and native content construction, including an image
   step followed by nonimage steps. Verify status/metadata first, later display,
   explicit redisplay, partial source failure, encoding failure and cancellation;
   assert download/admission counts and successful-prefix preservation. Cover
   trusted media provenance through aliases and any supported named read. Keep
   authored data inert. Verify the request lifetime of saved image selectors;
   missing/stale availability must be explicit without silently changing assets
   or reexecuting mutations. Do not enlarge storage or add a cross-request image
   cache to make a test pass. Review before advancing.
3. **Publish the minimum reusable target structure.** Execution card: compose owns workflow discovery and canonical output projection; storage owns selector evaluation. Gate: recorded construction query exposes a validating minimal schema, with escaped-key and successor-request consumers. Construction owns
   `createdTargets`; selected discovery must derive its usable structure from that
   owner rather than maintaining a second handwritten output contract. Preserve
   source keys, multiple composition entries and current-document validation.
   Replay E9 and subsequent named bindings: known paths flow into consumers with
   no model value-fetch call; unknown structure still supports bounded shape
   discovery. Test multiple parts and escaped keys, missing/deleted targets and
   document change. Do not echo full mappings or require unused saves to be read.
   Review before advancing.
4. **Preserve capture semantics through discovery and execution.** Execution card: inspection owns target membership and coordinate semantics; review usage derives its description. No renderer semantics change. Gate: recorded selected query plus actual App pixel membership and unchanged document digest. The inspection
   owner defines target subtree and local-region coordinates; selected review
   usage and direct inspection must expose the same meaning. Use E10/E12 target
   keys and hierarchy in permanent regressions. Prove leaf capture excludes
   siblings and group-region capture includes the intended descendants, while
   valid single-element detail stays supported. Preserve native pixel limits,
   workspace overview rules, evidence dependencies, existing visual decision
   boundaries and no document mutation. A changed target must use its own local
   coordinates, not inherit the previous leaf's region blindly. Review actual
   selected provider contract and returned coverage, then the bounded integrated
   chain from construction to named target to capture to delivery.
   Existing review integration tests substitute the pixel renderer; add a focused
   actual-renderer membership oracle rather than treating those mocks as proof
   that sibling windows appear in the captured image.

For each slice, first demonstrate the relevant failure or contract mismatch in
formal focused tests; update the matching current specification and Inspector
owner/handoff, review the implementation and regressions, and iterate before the
next slice. Existing accepted status-only, source-recovery, failure-image,
no-replay and request-isolation cases remain required. No full local suite.
Measure exact outgoing content/media and work counts, not model comprehension or
elapsed drawing time as a substitute for correctness.

### Current focused evidence

Slice 1: the two recorded obsolete-control tests failed before implementation;
selected/status saves already worked and remain protected. The 48 host tests,
four recorded delivery tests, four selected stage tests and nine prefix/phase
cases passed. The iteration test now uses final `delivery.fields`, preserving
its actual repair/decision outcomes instead of the removed output control.
Naming and scoped lint passed.

Slice 2: three connected regressions first failed (cached image hidden, static
`/references` rejected, singular result mismatch). All seven recorded delivery
cases now pass, along with 26 reference-owner cases. Existing source-local and
unknown-admission outcomes are preserved. Two native provider cases first lacked
submission evidence and now distinguish the failed content response from the
corrected image response. Reference tests no longer equate a previous owner call
with image delivery. Scope review preserves within-reply deduplication and raw
source bytes; no cross-request image cache or new display-state registry exists.

Slice 3: recorded selected usage now publishes the minimal canonical mapping
schema, including its local type references. Positive and negative schema values,
multiple composition entries, escaped keys and five storage cases passed. Three
recorded successor-host cases passed, including construction followed by capture
and saved body geometry without model readback. The crown test's obsolete public
response control was removed; its cross-request target assertion remains intact.

Slice 4: selected capture usage first failed the missing membership contract.
It now shares the inspection owner's description. One real App E2E checks all
three recorded leaf-key roles against sibling window pixels: leaf captures are
red, owning-group local crops contain blue windows. The document digest remains
unchanged; the App screenshot was inspected. This proves membership, not the
quality of a generated building. The initial E2E used the wrong image envelope
path; correcting the test to canonical image.dataUrl made the pixel oracle pass.
The renderer required no production change.

Media follow-through: eight connected delivery cases, 27 reference cases and 21
media cases passed (three opt-in native-model cases skipped); the focused formal
reference recovery proof passed with the canonical envelope. Cancelled delivery
and invalid media encoding leave cached source images redisplayable without new
download/admission. The retired refresh control rejects before source effects.
Provider submission cases passed; server typecheck, naming and scoped lint passed
with existing console warnings. The final observation is recorded below.

### Final observation

Completed one authorized observation: `taipei-101-fixed-1794130103950`.
All four correction slices and focused gates are complete. The work deadline,
not a tool failure, stopped drawing; final artwork acceptance remained incomplete.
The original thread completed its unlimited report in approximately 6m47s and
remains waiting for questions. Persistence and reload equality passed. No agent
files were edited while the report was generated. See the
[observation and handoff assessment](../reports/delivery-handoff-observation-2026-11-08.md)
for exact calls, retained values, limitations and the complete original report.
No broader plan closeout or further product changes are implied.

After the four slices pass, run the unchanged canonical prompt once with a
fifteen-minute drawing ceiling. This is one new authorized start, not a renewal
of an earlier multi-attempt allowance. Use existing fit-to-content recording,
durable reload evidence and source identity capture. Correctable authored inputs
may be repaired within the same drawing turn; genuine App/data/delivery failures
retain the reviewed stop policy. The original native thread writes an unlimited
report, then remains available for questions. No file modifications while it
generates the report or follow-ups.

The report must distinguish successful acquisition from actual image delivery,
explain any redisplay, identify each saved-value read versus direct named binding,
and explain capture target/region choices and necessary model decisions. Preserve
the original report verbatim and compare its claims with provider evidence. A
successful live run alone cannot prove routes the agent did not exercise; focused
regressions remain the oracle for those boundaries.

## Evidence and confidence

Baseline: `taipei-101-fixed-1794062501433`, native thread
`01a1b675-627b-7e80-9092-3c5d73cf89be`.
The original fifteen-minute drawing window ended at its deadline. The original
thread completed its unlimited report; artwork acceptance remained incomplete.
See the [five-run report](../reports/discovery-stage-continuity-2026-11-07.md)
and [unaltered original AI report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794062501433/self-report.txt).
Provider evidence lives in that run's `provider-records/` under request
`ae612868-df3f-49ee-93b1-04cf59648be6`; numbered payloads below refer to its
`.payloads/` directory. Preserve those records rather than rewriting conclusions
into original AI output.

| Finding                                                                 | Evidence and classification                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The original agent cannot be questioned after cleanup                   | Confirmed lifecycle gap. `local-ai-provider.ts` starts an ephemeral thread and kills its child in cleanup; the live runner closes browser/services. Original work/report used the same thread, but the completed thread is no longer available. A new agent reading logs is not its continuation.                                                              |
| Selected contracts still require substantial reading                    | Confirmed delivery cost, not a proven latency cause. Payloads 53/56 deliver 23,709 content bytes of construction usage; 62/65 deliver 32,838 bytes for six record/review capabilities. Construction parameters alone occupy 17,523 bytes with 28 shared definitions. Pages split JSON structures.                                                              |
| Some acquisition was broader than execution                             | Confirmed agent choice. Initial vector scope, later vector-pattern, standalone fact recording and checks reading were not executed. Later editing/review contracts were partly unused when the deadline arrived; non-use does not prove they were pointless.                                                                                                   |
| Preparation was not manual enumeration of thousands of windows          | Confirmed. Payloads 135, 192 and 290 contain four drafts totaling 28,060 bytes, expanded into 15,910 elements. They use surface grids, patterns and motif overrides. Face coordinates, proportions, materials and ornament representation still require authoring decisions.                                                                                   |
| Reference information has limits                                        | Confirmed asset limits: a 520 by 710 dusk whole-tower image and a 959 by 497 ornament close-up. The agent restricted their uses and estimated missing dimensions. Images cannot supply exact unseen geometry; no evidence establishes that image payload volume caused the delay.                                                                              |
| The long preparation gap has no measured single cause                   | Unresolved. Between reference delivery near 113 seconds and the next App call near 519 seconds, native research events occur around 424-447 seconds. The AI describes contract reading, reference interpretation and geometry authoring. Neither the trace nor its report separates inference, scheduling, authoring and network costs.                        |
| Ten saves do not imply ten missed reuse opportunities                   | Confirmed adoption distinction. Four drafts were saved for future editing, which never executed. Criteria revision, two reference-use receipts and base/crown IDs were manually supplied later rather than consumed through named bindings. No attempted named binding was rejected.                                                                           |
| Import required avoidable delivery recovery                             | Confirmed sequence: E1 selects conditional `/references` and rejects before execution; E2 removes delivery, adds `response:full`, and retains criteria, returning status without images; E3 refreshes cached assets and returns the whole import result with two images. Payloads 76/77, 81/94 and 98/107 preserve this sequence.                              |
| Output controls expose different layers as if they were interchangeable | Confirmed contract friction. Host `response` controls grouped canvas receipts, not native-result/media delivery. Retention activates selected/status delivery. Import describes directly accompanying images, but batch import places image actions beside `/references`, under `/actionResults`. Allowing `/references` alone would not deliver those pixels. |
| Knowledge is already cached within a request                            | Confirmed. `local-knowledge.ts` lazily loads 11 package and 11 App Markdown files once into memory, currently 87,949 bytes. Even discovery initializes the whole catalog; only selected data reaches the model. A fresh request reloads when Knowledge is first used. Fifth-run Knowledge calls were zero, so this loader cannot explain that run's delay.     |
| Repeated backend work and repeated model delivery differ                | Confirmed. Discovery retains results by query/registry revision and reuses metadata/index work. Knowledge retains resolved responses, but ordinary repeated reads return text again. `reuseFrom`, `fromResult` and named values already exist. A cache hit alone does not remove an AI call or its response tokens.                                            |
| The report may lack native successful-prefix evidence                   | Confirmed evidence gap from the preceding third/fourth runs: the supplement selects canvas `actionResults`, omitting some native preparation/import results. Raw provider evidence retains them. Separately, native web bodies are `upstream-not-exposed`; this does not independently prove the AI received blank results.                                    |

The initial App-owned instruction blocks total about 23.1 KB; eager declarations
add about 16.3 KB. The entire registered catalog is not necessarily model-visible.
The 56.5 KB selected content is included in the final 138.6 KB discovery reply
measurement; do not add it twice. Bytes, tokens, cached provider input and total
task usage are distinct measurements. Report actual model-token counts only when
available; do not convert serialized JSON bytes into claimed measured tokens.

## Existing contracts and replacement boundaries

The current authorities remain
[AI execution flow](../specs/ai-execution-flow.md),
[API surfaces](../API_SURFACES.md),
[Runtime Knowledge contract](../../../framework/packages/ai-agent-runtime.md),
and the [execution Inspector](../../../../../tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs).
Before production implementation, update their affected owner steps, executable
cases and bounded DoD together. This plan is not an admission or passing result.

| Current contract                                                                                                    | Planned treatment                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordinary requests receive fresh provider/Knowledge context; Inspector request step forbids native-thread continuity | Preserve ordinary requests. Add explicit evaluation-owned report/question lifecycle at the compose/provider boundary; do not turn the request adapter into a global session or credential cache.                                                                                                               |
| Fixed evaluation uses one App request, two native turns, terminal report receipt and automatic cleanup              | Replace the evaluation-only assumption that the first report ends the session. Seal drawing/report evidence, publish a waiting session, accept additional report-only turns, and close on explicit user completion. Update collector and shutdown consumers together.                                          |
| Full/selected usage preserves complete constraints; information delivery splits byte-contiguous JSON                | Keep canonical validation and complete selected constraints. Change acquisition to meaningful tool/branch units with required reference definitions. Do not label a truncated or unresolved contract executable. Review generic large-result paging separately from contract paging.                           |
| `retain`, `output`, `delivery` and batch `response` have overlapping visible controls                               | Define one model-facing delivery decision with explicit values/media/status behavior. Keep storage selection independent. Retire unsupported or misleading combinations and update schema, examples, admission, dispatch and egress together; do not retain a silently ignored legacy option.                  |
| Import success schema combines singular and plural results, with media in a sibling envelope                        | Replace with a canonical owner result shared by input forms, static Runtime admission, selected delivery and source-local recovery. Invocation-only narrowing is insufficient. Publish media semantics independently of accidental JSON nesting; preserve failed-source outcomes and optional-path validation. |
| Knowledge reader promises metadata-only discovery; App loader first reads all bodies                                | Distinguish model-visible discovery from backend initialization in docs. Profile startup/read/parse work before choosing shared immutable catalog reuse or metadata-first loading. Runtime access/session delivery state remains its current owner.                                                            |
| Request query caches and Knowledge delivery keys expire with their owners                                           | Preserve expiry and explicit recovery. Reusing immutable definitions across requests must not share permission decisions, request handles or model-context acknowledgements. Cache keys need authoritative source/registry validity, not only a label or TTL.                                                  |
| Authored templates, creation maps and conversation values already exist                                             | Reuse them. Do not equate source keys with current element identity, saved drafts with SceneTree shared instances, or saved names with proof of model consumption.                                                                                                                                             |

## Ordered implementation slices

The following five slices describe the preceding implementation checkpoint.
Current delivery corrections follow **Third-run delivery review and four-slice
correction** above; these historical slice numbers do not add another work order.

Approved revision - November 8, 2026. Associate this work with this section and
existing `staged-design-execution-plan.md`; the current worktree source and its
uncommitted predecessor work are the implementation baseline. No rebase, cleanup
of unrelated edits, push, release checks or full local test is part of this task.

The executable phase plan is the existing `execute_design.operations` or `stages`
input, not a second prose plan store. Review `plan` continues to own requirements
and acceptance. Conversation results own portable saved inputs/results. Host
execution owns dependency order and mechanical iteration; the agent owns new
visual decisions. No create/approve/run-plan API, mandatory planning round,
automatic next-action inference or forced consumption of saved values is added.

### 1. Preserve recoverable outcomes and canonical images through delivery

Owner/flow: compose (`local-tool-host.ts`, `local-tool-media.ts`) and inspect
(`local-design-review.ts`); their direct invocation/provider consumers.
Input evidence: E10's actual repeated check declarations and E8's successful
prefix recovery from `taipei-101-fixed-1794072813674`.

First prove failing permanent regressions. Runtime recovery registration and
model-stage projection must share the common invocation-failure alternative,
including nested sequence recovery. Preserve the original correct_input error,
settlement, completed prefix and no-replay boundary. Canonical images inside a
failure execution envelope must follow the same native media path as successful
receipts without traversing arbitrary authored data. Selected capture usage must
expose the existing same-check metadata consistency rule; rejection identifies
both conflicting inspections and fields before any capture.

DoD: direct and composed review rejection remain deliverable; status/selected
recovery retains successful prefixes; failure images are native content with no
Base64 text leak; ordinary success and malformed-output rejection remain intact.

### 2. Execute decided construction and acquisition as one dependency chain

Owner/flow: compose, with unchanged prepare/apply/inspect authorities.
Use E6 crown/ornaments and E7's actual targets/checks. Append capture to the same
host submission, binding the new crown ID from its producer and consuming existing
root/body identities. Exercise the formal host, selected owner contracts and
actual downstream arguments. Preserve the return to the agent after images.
Use operations for an ordinary chain; stages only when preparation, mechanical
iteration and progressive application are actually needed. Existing correct
execution paths need no new wrapper. Publish complete owner-valid composition
examples through existing usage rather than adding a duplicate instruction block.

DoD: one submission reaches construction then capture; dependency failure stops
unstarted work, successful writes are not replayed, and capture cannot record a
visual pass. Existing repair-to-sort and stage ordering continue to pass.

### 3. Consume saved author inputs across stages and turns

Owner/flow: compose; existing conversation result store, named resolution and
workflow inputs. Use E3 bodySource and E9 details. Replace only the identical
projection, two face boundaries, origin and axes with named selections. New
mullion/shadow geometry stays authored. Verify source/result equivalence and
actual App context reads without an intermediate model value-fetch call.

Cross-turn cases use the existing bounded saved-name/shape projection. Prove
known-path consumption, unknown-path navigation, isolation after document change,
and explicit missing/stale selection. Only repair a demonstrated navigation gap
at the current owner; do not echo full drafts, create another registry or promise
reload durability. Request-owned evidence cannot become portable authority.

DoD: same and successor requests consume saved fields correctly; only selected
values cross the App boundary; unchanged source fields are not re-authored;
saving without a later consumer remains valid. Existing live target validation
and snapshot semantics remain unchanged.

### 4. Deliver focused, consistent contracts for execution and reuse

Owner/flow: compose; registered selected-usage projection, construction schemas,
result/media controls and existing App instructions. Replay D1's actual scoped
construction query. Remove irrelevant selected branches only through canonical
owner scope, preserve the complete used constraints and valid examples, and
measure delivered bytes plus acquisition calls. Keep full lookup available.

Review host response/output/delivery semantics together with source/result
selection and image delivery. Correct misleading combinations or descriptions
at their owners instead of adding a new competing control. Binding examples must
show a real consumer, not only successful saving. Requirements, ordering, media
and recovery must agree across prompt, selected usage, schemas and execution.
No arbitrary KB cap, hidden simplification or second validator.

DoD: valid real inputs retain their behavior, invalid inputs still reject,
selected guides remain executable, and examples run through formal owners.
Knowledge/cache work stays deferred unless this bounded evidence demonstrates a
necessary defect; no Knowledge calls occurred in the observation.

### 5. Verify submitted dependencies, actual execution and agent return reasons

Owner/flow: compose and current formal/live evidence consumers. Reuse step IDs,
stage outcomes, saved acknowledgements and provider records; no parallel workflow
ledger. Distinguish not submitted, pending, failed and completed work. Prove A to B
when B needs only A's output, a genuine image decision boundary, and failed-prefix
recovery without a substituted action or replay.

After focused tests and bounded review pass, run the unchanged canonical prompt
once with a fifteen-minute drawing ceiling. The original native thread writes
an unlimited report explaining actual saved-value consumers, combined/split
operations, and each necessary return to the model. Separate host correctness
from model adoption. Keep the report session available afterward. Do not edit any
files while the App AI generates its report or follow-ups. No automatic retry.

DoD: source/contract-bound focused evidence plus complete drawing/report/evidence
outcomes, exact prompt verification, same-thread identity, unchanged reporting
canvas and retained waiting session. A failed or timed-out drawing stays a failed
or incomplete observation; a completed report does not approve the artwork.

## Design review and accepted behavior

The compose owner can bind native workflows and review operations already;
conversation storage already resolves deep named fields. The recorded E9 reuse succeeds through the existing owner. The new E6 capture
regression exposed an App-to-Runtime schema projection defect: discovery-only
operation annotations reached binding admission as opaque constraints. After
removing that discovery-only annotation, the same regression exposed a second
contract defect: the capture element target omitted the document-reference
annotation already present on the producer ID. Both owner corrections now allow
construction followed by capture in one submission. This specific missing
composition cannot be classified solely as an adoption choice. The reviewed
handoffs retain existing authority: prepared values feed application, actual
created IDs feed acquisition, rendered evidence returns to the agent, and
portable source snapshots feed later preparation. No dependency crosses an
unavailable visual decision or an expired request credential.

Existing permanent coverage includes request-review-recovery, selected-prefix-
recovery, created-targets integration, result-delivery and review-usage tests.
Extend these or add a focused recorded-continuity test with exact retained inputs.
For each slice: re-read its Inspector owner, demonstrate any defect first, implement
inside that boundary, review direct consumers and run the named focused gates.
Reuse existing identifiers; new internal helpers remain host/media/usage-owned,
with no persisted identity migration. Naming gates precede and follow code edits.

## Implementation checkpoint before the final observation

Slices 1-4 have focused regressions and owner corrections. The recorded
construction/capture chain completes two real applications and three captures
in one host submission; capture returns evidence without approving the drawing.
The recorded source-to-detail chain consumes five fields from one App exchange
across successor hosts; this reuse passed before changing production resolution.
Unknown-path navigation now has an optional bounded subtree shape read through
the existing result route. Known-path consumers remain direct.

The selected construction scope omits explicitly unselected layout, relations
and shared-fill groups while retaining canonical full input and valid examples.
Its measured parameter payload is 19,369 bytes versus 20,576 with these groups;
this is a modest schema reduction, not a latency claim. Existing receipt response,
sequence output and model delivery select different layers; their reviewed paths
remain valid. No new output mode or automatic image approval was introduced.

Confirmed failures were reproduced before corrections: model recovery projection,
native failure image delivery, located check conflicts, composed capture admission,
and ignored shape-only navigation. Focused tests also exposed an example excluded
by the narrower scope; the owner now publishes a valid positioned primitive example.
The contract requires identical check metadata within one capture call; it does
not invent supersession, reference authority or subsequent visual decisions.

The existing source proof covers request-only composition, named navigation,
review continuation and retained report ownership. Real recorded chain tests
exercise formal host and App owners separately. Scoped server/proof type checks,
changed-owner lint, naming and the fixed-runner contract are the preflight gates.
Large preexisting integration test files remain Vitest-covered; adding them to
the proof TypeScript include exposed older fixture typing gaps and was reverted,
without suppressing errors or expanding this task into unrelated fixture rewrites.

## Verification and remaining decisions

Implementation proceeds one owner slice at a time, with failing permanent
regressions for confirmed defects, focused tests and bounded self-review before
advancing. Update current spec/API/Inspector and direct consumer tests in the
same slice; remove superseded rules rather than adding contradictory advice.
Retain accepted geometry, validation, cancellation, partial-success and no-replay
behavior. No full local test or release gate belongs to this task.

Focused coverage belongs in the existing provider/evaluation/recorder tests,
discovery and information-delivery integrations, host/media/result-delivery tests,
`local-knowledge.test.ts`, Runtime `knowledge.test.ts`, created-target/context
integrations and the affected execution-flow proof cases. Select exact cases for
each changed owner; scoped type/lint/naming checks accompany implementation.

The user explicitly authorized one final fifteen-minute live run after the revised
slices pass, with the original prompt, unlimited same-thread report and retained
session. The earlier baseline is complete; do not repeat it or inherit a retry
allowance. Preserve final/reload images, editable source, durable receipt and
fit-to-content recording. Test failure does not authorize coaching or a rerun.

Compare contract acquisition, valid first submissions, selected text/media,
value-only forwarding, backend work counts, saves/actual consumers and reasons
for returning to the model. Do not compare differently detailed drawings by
elapsed duration or infer latency from bytes. Existing failed runs remain evidence.

Open verification questions: which exact contract passages impeded the agent;
whether source text was available to it; supported native restart/resume behavior;
whether cross-request catalog work is material; and the measured call/byte tradeoff
of semantic contract delivery. These are explicit design/measurement gates, not
established defects or excuses to add more prompt instructions.

## Research context

Public examples support demand-driven acquisition, not a universal prompt budget:

- <a href="https://github.com/cloudflare/mcp/blob/main/README.md" target="_blank" rel="noopener noreferrer">Cloudflare MCP</a>
  reports about 1,100 tokens for three entry tools, not total task context.
- <a href="https://www.anthropic.com/research/advanced-tool-use" target="_blank" rel="noopener noreferrer">Anthropic advanced tool use</a>
  illustrates about 500 initial search-tool tokens and about 3,000 tokens for
  selected tools. Its example is not a general App system-prompt measurement.
- <a href="https://cursor.com/blog/dynamic-context-discovery" target="_blank" rel="noopener noreferrer">Cursor dynamic context discovery</a>
  reports a 46.9% reduction in total agent tokens for MCP-using runs, not a fixed
  prompt size.
- <a href="https://tldraw.dev/starter-kits/agent" target="_blank" rel="noopener noreferrer">tldraw Agent Starter Kit</a>
  uses viewport shape detail, outside-view clusters and mode-specific context.
  Its documentation does not establish a universal token budget.
- <a href="https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools" target="_blank" rel="noopener noreferrer">Vercel's SQL agent case</a>
  reports roughly 102K to 61K average task tokens over five queries, not initial
  prompt size. <a href="https://www.figma.com/blog/agent-custom-tools-context-skills/" target="_blank" rel="noopener noreferrer">The reviewed Figma article</a>
  does not disclose internal prompt size. Do not invent a comparable KB figure.

## Documentation review

The design distinguishes observed defects, agent choices, existing capabilities
and unresolved hypotheses. Evaluation retention does not change ordinary request
authority; shared source caching does not share model-delivery state; saving is
not a consumption obligation; media delivery is not inferred from metadata.
Current behavior documents remain authoritative until their implementation slice
updates them. Source, formal tests and Inspector admission are not claimed complete
by this documentation review.
Review corrected a dependency gap: asking the new original agent only after all
context changes could not inform those changes. The early observation above
addresses that gap without pretending the old ephemeral session can be resumed.
It also separates same-request reference receipts from cross-request portable
drafts and IDs, preventing session retention from becoming a lifetime bypass.

### Slice 1 execution boundary - 2026-11-08

Session handoff implemented and observed. Compose owns native report continuity; the service owns retained
sessions and local controls. The provider still releases drawing resources at
initial settlement. Changes are limited to evaluation parsing, provider/service
handoff, recorder/session commands, focused regressions and their direct contracts.
Naming preflight passed. Regression first: the initial request must return without
killing the original process, then support multiple public report turns, explicit
close, loss and denial of late tools. No discovery, storage or cache changes enter
this slice. The live observation follows focused protocol, route, collector and
source checks. Source edits stop during drawing, reports and follow-up answers.

Session handoff implementation and self-review: initial request settlement now
releases drawing resources while the service retains the original native process.
Local status/ask/close routes serialize questions and preserve public replies in
separate follow-up files, including partial output on cancellation. Loss is explicit;
closed identities release their provider closures. The fixed recorder seals video
and document evidence without stopping retained services. No restart recovery is
claimed, and Vite source changes must not destroy a session still needed for questions.

Focused validation before the observation: 49 selected session/provider/HTTP/parser
cases, 12 collector cases, two source-flow cases, server type checking and naming
passed. App and required local service builds succeeded. Scoped lint has no errors
(existing console warnings remain). An overbroad test-name selection also ran 179
provider-related cases: three unrelated tool-declaration expectations failed
(recipe/example schemas and unconditional deferred registration). Those declaration
contracts were not changed by this slice; this is not an all-provider-tests-pass
claim. Do not expand this session slice to rewrite them.

The upcoming single 15-minute observation uses the immutable drawing fixture.
Ask the maintained context follow-up only after the original untimed report ends.
Keep the original session available afterward. Contract-load, native receipt
supplement, storage/image and cache changes remain pending until the new answers
are compared with actual delivered records; no inference from old-session memories.

### Observation result and ordered next corrections

The single live attempt `taipei-101-fixed-1794072813674` stopped at 677.359 seconds
on a review-result delivery failure. Initial report and two subsequent questions
finished on the same original native thread; the first question exceeded five
minutes. The service remains waiting. Original provider evidence and persisted
content hashes remained unchanged across questions. Persistence reached 600/600.
This is a passed session-continuity observation and an incomplete artwork review.

Before changing contract presentation, the next bounded egress slice must preserve
E10's common `PREPARATION_REJECTED/not-started/correct_input` through model recovery
projection and route E8's nested failure-prefix image through native media instead
of text. Use the recorded exact inputs, preserve successful prefixes and test the
source/Runtime/model/retained paths together. The E10 input conflict remains invalid;
fixing its error delivery must not silently accept inconsistent check metadata.

Then test D1's narrower complete contract presentation, E9's identical saved-field
bindings and E6's already-decided appended capture. The agent confirmed those last
two are available abilities it did not use, not blocked operations. Keep reference
image acquisition/viewing before use selection, strict geometric validation and
optional Knowledge. Cache work still needs measurement; no Knowledge loader ran.
The remaining native receipt supplement and other slices are not marked complete.

Observation bootstrap correction: `taipei-101-fixed-1794133924121` stopped before
any provider session (107 ms, zero canvas writes). The added report questions
made the maintained report fixture exceed the production parser's 8,000-character
limit. The original drawing prompt was unchanged. A permanent production-parser
fixture test failed first, then the added report question was condensed. No
production input limit or drawing requirement was relaxed. This failed bootstrap
has no original-AI report and is retained as evidence; the intended drawing
observation must still run after the focused parser test passes.

### Follow-through observation result

Completed the intended drawing run `taipei-101-fixed-1794134061041`: 11m 09.592s,
followed by an unlimited 7m 20.215s original-thread report. Session remains waiting.
The complete report and checked evidence are indexed in
[Reference receipt and discovery](../reports/reference-receipt-and-discovery-2026-11-08.md).
Drawing/report source freeze was preserved. No additional implementation followed
the observation. Durable sequence 483 and reload match; reporting did not mutate
the drawing. The retrospective qualified the earlier visual acceptance, yielding
partial App settlement despite native drawing completion; this is not a save or
execution failure.

The observation had one correctable conditional-result selector rejection, then
continued successfully. It saved eleven names and consumed two target mappings
through three leaves. It did not use formal reference selection, so receipt-chain
adoption remains unobserved despite passing real-parameter composition proof.
Thirteen contract calls delivered 154,026 text bytes; do not claim a global reading
reduction. The implementation portion is complete, with these live limitations
explicitly retained for discussion. No full-local tests, commit or push occurred.
