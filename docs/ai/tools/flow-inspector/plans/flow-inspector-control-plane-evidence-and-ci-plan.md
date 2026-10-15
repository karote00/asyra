# Flow Inspector Test Result Source Support Plan

## Status and Objective

Re-scoped on 2026-10-11. This is supporting work for the
[failure-localization plan](flow-inspector-verification-coverage-expansion-plan.md),
not a prerequisite protected-delivery phase. The stable filename preserves links.

The original Phase 3 proof and Phase 4 local evidence/UX were accepted in their
[core proof record](completed/flow-inspector-phase-3-core-proof-closeout.md) and
[local implementation record](completed/flow-inspector-phase-4-local-implementation-closeout.md).
Their evidence is preserved. Unimplemented mandatory CI protection, independent
verifier/issuer and remote refusal/recovery demonstrations are removed from this
plan's current scope; they are not marked complete.

## Consolidated remaining work - 2026-10-15

The roadmap's [consolidated delivery stages](flow-inspector-workflow-control-plane-roadmap.md#consolidated-delivery-stages---2026-10-15)
own remaining stage scope and complete acceptance: Stage A covers the frozen
Design functional inventory; Stage B covers collaboration and the selected
shared Framework inventory. Extend this plan with exact inventories and owner
contracts at activation, not a new PR-sized phase for each case or test file.
The Bounded Result-Source Slice below is an internal producer/owner checklist.
Completed selected slices and their evidence remain valid; their dated
"next-stage" notes are historical and superseded by the consolidated sequence.
No implementation or tests are activated by this planning update.

## Relationship to the Core Milestone

The core plan owns the initial existing Vitest result-to-node path, including
source identity and evidence integrity. Do not duplicate that work here.
Activate this supporting plan only for an additional named producer or test set,
such as the existing bounded Design Playwright/CI results. No new implementation
is activated by this planning revision.

Receiving a CI test report is an observation. Configuring required checks,
blocking merges, authorizing delivery or accepting a baseline is a separate
policy operation and is not needed to locate its failures.

## Bounded Result-Source Slice

Before activation, select one producer, its exact existing command/report format,
test inventory, source identity, owning mapping and implementation boundaries.
Inspect current collectors and reuse the existing evidence and localization
owners. Avoid rerunning tests just to produce a second localization report.

The slice must:

- receive the original case outcomes and failure artifacts with source, run,
  attempt and applicable runner/project identities;
- preserve every received failure, resolving known cases to their responsibility
  nodes and retaining unknown or ambiguous cases explicitly;
- distinguish assertion failure, setup failure, skipped/not-run cases, malformed
  reports and missing output without converting any into unsupported success;
- retain the original evidence and its trust level: matching digests establish
  integrity, not independent authenticity or accepted conformance;
- show the same failure and source identity in the Board and machine interface,
  without a second mapping authority or a CI-only dashboard.

## Selected History replay coverage - 2026-10-14

Activated after PR #322 merged, based on `aac6e78dc`. Association remains the
existing Bounded Result-Source Slice. The selected producer is the existing
opt-in Vitest reporter. Extend mappings to two unchanged cases in
`packages/factory/src/__tests__/factory-journal-history.test.ts`: whole-action
ordered replay and staged gesture first-before/latest-after replay. The remaining
cases in that file stay explicitly unmapped, not implicitly verified.

Plan review: shortcut tests mock History, while these cases execute the real
Factory/DataTransact replay and capture owner-delivered events. They establish
Factory event order, values and stack depth, not complete App state/render replay.
Use a distinct `history-replay` target and `replay-history-action` owner step,
referencing the existing Factory contract. Do not attach them to the App shortcut
node or claim a proven underlying defect. No product runtime change is intended.

Flow and handoffs: the existing test invocation supplies original Vitest outcomes;
contract admission supplies exact file/name mappings; localization retains source
and error evidence; existing read API/CLI and Board consume that same observation.
The new manifest uses the current version-2 contract, the new architecture uses
static schema 2, and observations remain format 1. Existing identities and
historical records are unchanged. The supported isolated config executes the
whole existing test file with source aliases and bounded workers. Fault scenarios
use the same unchanged tests. This partial mapping is for observations, not an
accepted-proof target.

Feasibility review found that strict proof admission reports the twelve unregistered
siblings (including skipped ones) as unexpected tests. Preserve that fail-closed
behavior. The selected mapping supplies observation context only; do not widen
mappings or relax proof evaluation to turn this slice into accepted conformance.
Permanent acceptance must exercise the complete fourteen-test file and count both
mapped and unmapped failures, using unchanged assertions in isolated source copies.

Execution cards:

1. `admit-proof-contract`: add the History manifest, architecture, isolated test
   config and contract coverage. Inputs: Factory specification and exact existing
   tests. Output: admitted two-case mapping with precise Factory/DataTransact
   paths. Conditions: no invented cases, no mutation of product assertions, no
   parallel mapping registry. Negative scenarios alter replay order or inverse
   values only in isolated execution. Review structural admission and baseline/
   fault observation evidence before wiring defaults. Stop if the unchanged tests
   cannot detect the declared fault or the owner does not match the contract.
2. `localize-test-results`: register the manifest in the existing default list;
   extend its existing fixture/runtime tests. Inputs: admitted mapping and real
   invocation; output: original failures at the History owner. Preserve source
   invalidation, duplicates, incomplete runs, other target failures and immutable
   history. Prove baseline, both faults and recovery; show unmapped failures
   alongside mapped ones, plus partial reruns and API/CLI equality. No new schema,
   reporter, cache, dispatch or source-authenticity claim.
3. `render-proof-board`: regenerate the catalog and extend the existing Board
   regression with real History evidence, node selection, original differences,
   historical selection and recovery. Reuse current renderer and read service;
   no UI behavior change is planned. Inspect desktop/narrow screenshots.

Bounded review covers these mappings, direct admission/read/UI consumers and the
existing formal edge-case suite. Required gates: new admission/runtime/browser
cases; full control-plane and Board suites; package tests; generated catalog;
original proof and History fault/recovery scenarios; naming, test placement/CI
scope, scoped lint/format, typecheck/build, diff check and exact-head Changeset
admission.
Preserve existing App/Factory localization and proof behavior on the same source.
Do not expand to all History cases, Playwright ingestion, CI import, command
buttons, comments, task orchestration, causal diagnosis or Framework fixes.
Any unrelated runtime defect is reported separately; only regressions introduced
by this slice are repaired here. Push and PR follow successful local closure;
remote checks remain a separately reported exact-head result.

Local completion: the mapping regression failed with zero mapped cases before
registration, then passed with two. Unchanged fourteen-case baseline, replay-order
fault (eight failures, two mapped), inverse-value fault (nine failures, one mapped),
filtered recovery, full recovery and cross-target history preservation passed.
The documented command retained fourteen observations with two mapped and twelve
unmapped, no ingestion issues. Full control-plane: 500 passed, two conditional
skips. Full Board: 19 passed, two retained-live-evidence skips. Desktop and narrow
screenshots were inspected. Package React tests and 100 contracts, 68 CI scope/
placement tests, 15 naming tests, lint, formatting, typecheck and the 21-task
App/tool build passed. Original three-flow/five-negative/nine-obligation proof
and candidate proof passed. Bounded final review found no further actionable
in-scope defect; whole-file strict proof remains intentionally unavailable for
this partial mapping. Remote CI and merge are separate from local completion.

## Selected Design execution coverage - 2026-10-14

Activated after PR #323 merged, based on `8a3edb7f4`. This bounded slice
registers the existing 23 execution-owner cases at their seven existing nodes:
request, compose, prepare, apply, inspect, settle and observe. It retains the
existing Vitest reporter, manifest, architecture and read/UI owners. No model
invocation or App/Framework product behavior change is authorized.

Plan review found that the existing proof config can resolve mutable workspace
dist output instead of captured source and cannot start in a clean checkout.
The selected config must explicitly resolve the public entries and transitive
workspace dependencies used by this test closure, reject undeclared workspace
imports, and run the
unchanged file with one worker. Source aliases are test execution configuration,
not another mapping or ownership registry. Baseline and the existing registered-
tool, access-classification and canonical-evidence fault scenarios must pass
their expected oracles
before this source is registered by default. Stop if existing assertions cannot
detect the selected faults; do not rewrite product tests to manufacture evidence.

Revised feasibility review: direct-entry aliases alone are insufficient because
basic API contracts import Core and its transitive package exports. The isolated
config must cover that full source closure, including render-engine exports,
and reject any later undeclared dependency. The existing capture authority still
owns which runtime bytes are admitted; the config only resolves test imports.
No production runtime edit is needed or authorized for this correction.

Execution cards and handoffs:

1. `admit-proof-contract`: refine the existing manifest with exact case source
   locations inside existing architecture boundaries; retain all identities and
   handoffs. Inputs are the current specification, cases and public package
   exports. Outputs are admitted locations and a source-only execution config.
   Allowed edits are this manifest/config, admission tests and their direct
   contract documentation. No runtime changes, guessed causes or new case IDs.
   Prove all 23 unchanged baseline cases and all three declared fault scenarios.
2. `localize-test-results`: add the manifest to the default list and extend the
   existing permanent fixture/runtime tests. Inputs are original Vitest results
   and admitted contracts; output is retained per-case evidence at the proper
   node. Prove separate and combined faults, original errors, seven-node passing
   inventory, recovery, immutable historical failures and read API/CLI equality.
   Preserve existing unknown, duplicate, stale, missing and partial-run rules.
   No schema, reporter, cache or command-dispatch redesign is authorized.
3. `render-proof-board`: reuse the existing target page and renderer with real
   multi-node observations; extend permanent browser regression for node/source
   selection, simultaneous failures and historical recovery. Inspect screenshots.
   Regenerate the existing catalog when architecture ownership boundaries change.

Before each segment, reread its exact core Inspector contract and the selected
execution architecture/spec. The core admission boundary includes this product
manifest/config; localization and Board use their existing implementation files.
Failure owners remain admission, localization and rendering respectively; a test
failure identifies a responsibility boundary, not a proven root cause.

Frozen review scope is the selected manifest/config, default registration,
existing localization fixture/tests, Board test, direct docs/catalog consumers
and resulting regressions. Required gates are the focused scenarios, full
control-plane and Board suites, package tests, original core proof/candidate,
naming, CI scope/test placement, scoped lint/format, typecheck/build, diff review
and exact-head Changeset admission. Broader App runtime repairs, new producers,
Playwright/CI ingestion, model execution, task dispatch, comments and command
buttons are excluded. Do not close the whole supporting plan for this slice.

Local completion: all 23 unchanged cases passed; three independent negative
scenarios failed exactly compose, apply and inspect, then recovered on the same
captured source. Ordinary reporter tests also preserved accumulated failures,
CLI/API equality and immutable history. The source-entry regression fails with
the original config (incorrect passing execution), and passes with source-only
resolution and explicit setup-error evidence. Admission initially failed without
precise locations; default localization initially left these cases unmapped.
Review corrected definition-delivery and source-provenance paths to the actual
called owners and added the workflow entry for ordered composition.

Full control-plane: 502 passed, two conditional skips. After final mapping and
regression additions, the affected admission/localization suites passed all 56
cases. Final full Board: 20 passed, two retained-live-evidence skips; desktop and
narrow screenshots inspected. An initial catalog-frame load timeout overlapped
a build; the isolated layout recheck and complete post-build Board run passed
without changing UI assertions or timeouts. Package React tests and 100 contracts,
68 scope/placement tests, 15 naming tests, scoped lint/format, App/tool typechecks
and the 21-task build passed. Original core proof and candidate proof passed.
The documented ordinary command retained 23 mapped results without issues.
Bounded self-review found no remaining actionable issue. This closes the selected
coverage slice only; remote CI and merge remain separate from local completion.

## Selected Render viewport coverage - 2026-10-15

Activated after PR #324 merged, based on `2e0164c51`, under the Bounded
Result-Source Slice. Register the existing six ViewportLayer cases from
`packages/render/navigation-flow-contracts.json` at the existing
`render-engine-boundary` / `orchestrate-render-adapter` node. Preserve all case,
target and observation identities. Exact locations name ViewportLayer and its
RenderLayer or RenderObjectRuntime collaborators, not concrete engine internals.

Design review: the unchanged tests already detect the declared `omit-retention`
fault. Their configuration currently requires proof environment variables and
does not resolve public workspace imports from source. Make that configuration
usable in an ordinary checkout and captured source with explicit root/subpath
aliases and one worker; reject undeclared workspace imports. The recording engine
is a contract test adapter. These cases prove viewport orchestration, not actual
Pixi output, complete rendering correctness or a diagnosed root cause.

The existing invocation produces original Vitest results; admission supplies exact
case locations; localization stores the observation; API, CLI and Board consume
the same retained record. No second runner, mapping registry or schema is needed.

Execution cards (core proof Inspector and CORE_PROOF.md remain authoritative):

1. `admit-proof-contract` / Admission: consume the current Render specification,
   exact existing test identities and render-engine-boundary architecture; emit
   admitted precise paths and source-only configuration. Extend this step's
   boundary to the selected manifest/config, retaining its admission tests.
   No missing contract may bypass admission. Contributors are existing manifest
   and architecture only; runtime guessing and UI semantics are forbidden.
   Gate: admission regression, unchanged six-case baseline and declared negative
   proof. Stop on unmatched cases or an undetectable mutation.
2. `localize-test-results` / Ordinary Test Failure Localization: consume admitted
   mapping and original reporter output; emit immutable observations. Register
   the selected manifest and extend the existing runtime fixture/tests within
   this step's allowlist. Incomplete execution has no completed passing authority;
   no guessed nodes, accepted-baseline changes or dispatch. Prove baseline, fault,
   recovery, source-entry setup failure, CLI equality and historical retention.
   Existing shared tests retain unmapped/ambiguous/stale/partial-run obligations.
3. `render-proof-board` / Board: consume service-owned observations through the
   existing target route; extend the existing browser test only. Verify node and
   implementation selection, original error, API equality, recovery and historical
   selection; inspect desktop/narrow screenshots. No missing evidence is green,
   no client-side mapping or command execution. Regenerate the existing catalog
   after the admission boundary changes. Failure owners remain each named step.

Frozen discovery and repair scope is this manifest/config, default registration,
direct admission/localization/Board tests and fixtures, core Inspector boundary,
generated catalog and current documentation. Required gates: focused tests,
full control-plane and Board suites, package tests, selected Render proof and
original core proof/candidate, naming, CI scope/test placement, scoped lint/format,
tool typecheck and App/tool build, diff review and exact-head Changeset admission.
Recheck the matching Inspector before advancing each segment. No runtime edits,
other package test sets, new producers, rendering optimizations, Playwright/CI
ingestion, commands, comments or orchestration. An unrelated defect is deferred;
an in-scope regression is corrected and rechecked. Stop for an ownership conflict
or required out-of-scope change. This slice does not close the supporting plan.

Local completion: admission and ordinary-startup regressions failed before the
manifest/config correction; runtime localization initially retained zero mapped
viewport cases before registration. All six unchanged cases now pass and map;
the camera fault fails exactly its declared case, source-entry failure retains
execution evidence without a guessed node, and recovery preserves immutable
history. The documented ordinary command retained six mapped cases with no issues.

Final scoped suite: 60 passed. Full control-plane: 507 passed, two environment-
conditional skips. Full Board: 21 passed, two retained-live-evidence skips.
Desktop/narrow screenshots were inspected. Package tests (12 React, 100 contracts),
68 scope/placement tests, 15 naming tests, scoped lint/authored formatting,
generator equality, tool typecheck and 21-task App/tool build passed. The original
three-flow/five-negative/nine-obligation proof and candidate passed; Render's
six-case baseline, exact negative and recovery proof passed. Initial App tests
started before clean-worktree build outputs existed; the complete post-build
focused and full suites passed without weakening assertions. Bounded final review
found no remaining actionable issue. This closes only the selected Render slice;
remote CI and merge remain separate from local completion.

Stage review correction: the viewport manifest previously paired the Render
package document with architecture section references owned by the completed
Render-Engine Boundary plan. Align its specification path with the selected
Inspector authority. A test-first regression proves the previous mismatch and
checks that every selected step reference resolves to a heading in that document.
Runtime and Board regressions assert the same retained specification path and
section. Preserve existing historical records and case identities; new observations
carry the corrected contract digest. The shared runtime fixture includes the
selected authoritative document so observation fingerprints remain available.

## Selected reusable-tool composition coverage - 2026-10-15

Activated after PR #325 merged, based on `1aa089e12`, under the Bounded
Result-Source Slice. Select the existing four cases in
`packages/ai-agent-runtime/src/__tests__/recipe-flow.test.ts` and its existing
manifest, config and `reusable-tool-composition` architecture. Keep the original
assertions and identities. The cases locate admission, registration, invocation
and persistence responsibilities; they use host-injected in-memory adapters, not
a live provider, actual disk durability or complete host security integration.

Readiness review: existing baseline/admission-fault/recovery proof passes. The
config requires proof environment variables despite importing this package's
source directly. Enable an ordinary baseline invocation with one worker and reject
undeclared workspace dependencies; no source aliases are needed for the existing
relative-only import closure. Manifest specification and all four section anchors
must match the existing architecture authority. Exact case locations stay inside
their respective owner boundaries. The existing source capture admits this package;
do not add another runtime capture or mapping registry.

Complete handoff: unchanged Vitest cases produce original outcomes; admission
supplies exact file/name/node/path mappings; localization stores every result and
original error; API, CLI and Board consume the same observation. Preserve source,
project, attempt and historical identities, explicit unresolved results and all
existing targets. No test rerun is needed merely to produce a localization report.

Execution cards, governed by the existing core proof Inspector and CORE_PROOF.md:

1. `admit-proof-contract` / Admission: inputs are the selected specification,
   unchanged case file and architecture; outputs are admitted precise locations
   and ordinary/captured execution config. Add this manifest/config to the core
   admission boundary. Its existing admission tests prove locations and reference
   integrity. Retain the admission negative and add isolated runtime mutations
   for retry-receipt identity, invocation call inventory and reload inventory;
   each must fail only its named existing case. No contract bypass, assertion
   rewrite, runtime-result guessing or production runtime edits. Stop if an
   unchanged case cannot detect its declared fault.
2. `localize-test-results` / Ordinary Test Failure Localization: consume admitted
   mapping and original Vitest evidence; register the manifest in the existing
   defaults and extend its permanent runtime fixture/tests. Emit retained results
   for four nodes, including combined faults, source-load failure without a guessed
   node, recovery and CLI equality. Incomplete execution grants no passing result;
   preserve shared stale/duplicate/unmapped/partial-run behavior and other targets.
   Allowed contributors are the existing reporter, product contracts and read
   service; no model inference, accepted-baseline mutation, cache or dispatch.
3. `render-proof-board` / Board: consume service-owned observations at the existing
   target route. Extend its permanent browser regression for four failed cards,
   exact implementation/spec references, original errors, API equality, recovery
   and historical selection. Inspect desktop/narrow screenshots. No client-side
   ownership decisions, new controls or missing-evidence success. Regenerate the
   existing catalog for the changed admission boundary. Failure ownership remains
   the corresponding admission, localization or Board step.

Frozen review and mutation scope: selected manifest/config, core admission boundary,
default registration, existing admission/runtime/Board tests and fixture, generated
catalog, current localization docs and this plan. Reread the matching Inspector
before advancing each segment. Required gates: test-first startup/location
regressions, four independent faults and combined recovery, source-load failure,
full control-plane and Board suites, package tests, original core proof/candidate,
selected composition proof, naming, CI scope/test placement, scoped lint/format,
tool typecheck, App/tool build, diff and exact-head Changeset checks. Unknown
ownership or a required out-of-scope runtime change stops this slice. No other test
sets, new producers, live model calls, runtime fixes, task orchestration, commands
or comments are authorized. This slice does not close the supporting plan.

Completed validation: startup and missing-location regressions failed before the
corresponding fixes. The four independent faults each reach only their declared
case/node; combined faults, source-load execution errors, recovery and retained
CLI/API/Board history pass without changing original product assertions or runtime
code. The documented ordinary invocation records four mapped passes. Composition
proof passes one flow, four negatives and four obligations; the original core
proof passes three flows, five negatives and nine obligations, with candidate
verification passing separately.

Focused admission/localization/runtime tests: 64 passed. Full control-plane:
511 passed, two environment-conditional skips (unconfigured installed app-server
probe and the inapplicable unsupported-containment branch). Full Board: 22 passed,
two retained-live-evidence skips. Desktop/narrow screenshots were inspected.
Package tests (12 React, 100 contracts), 68 scope/placement tests, 15 naming tests,
scoped ESLint/authored formatting, tool typecheck, generator equality and the final
21-task App/tool build passed. Bounded final review covered the diff, original
owner boundaries, authoritative spec sections and direct consumers, with no
remaining actionable in-scope issue. This completes only this selected slice;
remote CI and user review remain separate from local validation.

## Selected Pixi engine coverage - 2026-10-15

Activated after PR #326 merged at `1407655dc`, under the Bounded Result-Source
Slice. Select the 27 existing cases in `packages/render-engine-pixi/src/__tests__/pixi-render-engine.test.ts`
and its existing navigation manifest. Preserve original assertions, identities,
routes and the transform-group negative. These mocked Pixi adapter tests establish
command/resource/lifecycle behavior, not actual GPU output or complete rendering.

Readiness review: map all cases to the existing `execute-render-engine` owner on
`render-engine-boundary`; pair its section references with the architecture's
completed Render-Engine Boundary specification. Exact implementation locations
begin at `pixi-render-engine.ts` inside that owner's declared source boundary.
The ordinary config must resolve the public render-engine and testing entries to
source, reject undeclared workspace imports and run with one worker. Existing
source capture owns dependency admission; do not create another capture registry.

The complete flow reuses unchanged Vitest outcomes, admitted case ownership,
retained original evidence and existing CLI/API/Board projections. The selected
manifest shares target, flow and camera case labels with the Render adapter
manifest, but exact test-file/name/project identities must keep them distinct.
Prove both failures together, then rerun only Pixi: its recovery must not clear
the unrun Render failure. Historical runs remain readable. Source-load failure
must retain execution evidence without inventing a product node.

Execution cards under CORE_PROOF.md and the existing core proof Inspector:

1. `admit-proof-contract` / Admission consumes the selected product manifest,
   architecture and existing cases. Add only the selected Pixi manifest/config
   to its boundary. Permanent admission tests first expose the wrong specification
   reference, missing exact paths and proof-only startup. Align the current
   specification, add precise paths and public source aliases. Preserve admission
   conditions, all handoffs and runtime authority. Inputs may not be inferred;
   missing or conflicting contracts stop execution. No runtime or assertion edits.
2. `localize-test-results` / Ordinary Test Failure Localization consumes admitted
   contracts and original reports. Add the selected manifest to existing defaults;
   extend the existing runtime fixture and tests for single-engine failure,
   simultaneous adapter/engine failures, partial recovery, retained CLI history
   and source-load errors. Existing unknown, stale, duplicate and incomplete
   semantics remain unchanged. No inferred diagnosis, dispatch or acceptance.
3. `render-proof-board` / Board consumes the same service-owned records on the
   existing target. Its permanent browser test selects both failed owners, checks
   paths/spec/original errors and API equality, then proves partial recovery and
   historical selection on desktop and narrow layouts. No new controls, mapping
   authority or UI-owned verdicts. Regenerate the catalog for the admission boundary.

For each card the failure owner is that same core step; existing contributors,
conditions and bypasses apply. Reread its full Inspector contract before advancing.
Allowed mutation scope: selected manifest/config, core admission boundary, default
registration, existing admission/localization fixture/runtime/Board tests,
generated catalog, localization docs, Changeset and this plan. Review methods are
bounded source/contract comparison, current diff/direct-consumer inspection and
formal positive/negative/recovery gates. No other producer, product runtime,
GPU behavior, scheduling, command buttons or comments are included. Stop for a
required out-of-scope runtime correction or unresolved owner contract.

Required gates: focused admission/localization/runtime tests, full control-plane
and Board suites, original core proof/candidate, selected Pixi proof, package
checks, typecheck, scoped lint/format, naming, scope/test-placement, deterministic
generation, App/tool build and exact-head Changeset check. This slice closes only
its selected test coverage, not the supporting plan.

Completed validation: existing captured baseline/negative/recovery proof passed
before implementation. Test-first regressions reproduced the wrong specification,
proof-only startup and absent ordinary mapping. All 27 unchanged cases now map to
the declared engine entry. Independent engine failure, shared-Inspector dual
failure, partial recovery, source-load errors and retained CLI/API/Board history
pass. Original runtime, assertions, handoffs, case identities, workspace authority
and negative scenario remain unchanged.

Focused admission/localization/runtime tests: 68 passed. Full control-plane:
515 passed, two environment-conditional skips (unconfigured installed app-server
probe and the inapplicable unsupported-containment branch). Full Board: 23 passed,
two retained-live-evidence skips. Desktop/narrow screenshots were inspected.
Package checks passed (12 React, 100 contracts), along with 68 scope/placement
checks, 15 naming tests, scoped ESLint/authored formatting, typecheck, deterministic
catalog generation and the final 21-task App/tool build. Core proof/candidate
passed (three flows, five negatives, nine obligations); selected Pixi proof passed
(one flow, one negative, 27 obligations). The documented ordinary invocation
retained 27 mapped passes with no issues. Final bounded review found no remaining
actionable issue. This closes only this selected slice; remote CI and user review
remain separate from local validation.

## Selected Preset vector material coverage - 2026-10-15

Activated after PR #327 merged at `141758c75`, under the Bounded Result-Source
Slice. Select the 11 existing cases in `packages/preset/src/__tests__/vector-native-fill.test.ts`
and its navigation manifest/config. Preserve all assertions, case identities,
handoffs, workspace authority and the existing coverage-hit negative scenario.
These source-level tests cover engine-neutral material/coverage projections and
canonical-data preservation, not GPU pixels or all vector geometry behavior.

Readiness review: the existing `evaluate-vector-material` step explicitly cites
`docs/ai/framework/packages/preset.md`; retain that package specification rather
than substituting the architecture's historical plan. Exact case locations are
`components/vector.ts`, `components/fills.ts` and `components/vector-compound-fill.ts`
within the existing owner boundary. Ordinary execution needs the same public Core,
Render and Utils source closure already admitted by captured proof. Inspect that
closure and use exact public root aliases; reject undeclared workspace imports.
Run the unchanged file in jsdom with one worker. Source capture retains dependency
admission ownership; no alternate runtime registry or product implementation.

Complete handoff: original Vitest results -> admitted exact case/node/paths ->
immutable localized observations -> existing API/CLI/Board. The existing hit
predicate fault must fail only `navigation.native`. A filtered run of a passing
same-node sibling must leave that failure visible; full recovery updates only
executed cases and preserves historical failure context. Public Core source-load
failure stays execution evidence without a guessed node.

Execution cards under CORE_PROOF.md and the core proof Inspector:

1. `admit-proof-contract` / Admission: consume the selected manifest, architecture
   and unchanged cases. Add only this manifest/config to the admission boundary.
   Test-first missing precise locations and proof-only startup; output admitted
   location/reference integrity and ordinary/captured source config. Keep explicit
   route inputs and contributor boundaries. No runtime result guessing or test
   assertion rewrites; unresolved contract ownership stops implementation.
2. `localize-test-results` / Ordinary Test Failure Localization: consume admitted
   mapping and original runner evidence. Register this source in existing defaults
   and extend the permanent runtime fixture/tests for the exact hit failure,
   filtered sibling rerun, full recovery, source-load errors and CLI equality.
   Preserve unknown/stale/duplicate/incomplete behavior and other targets. No
   inferred diagnosis, dispatch, accepted-baseline mutation or new cache owner.
3. `render-proof-board` / Board: project service-owned evidence on the existing
   render-delta-update canvas. Extend its permanent browser test for owner
   selection, exact paths/spec/original error, API equality, filtered-run failure
   retention and historical recovery. Inspect desktop/narrow screenshots and
   regenerate the catalog. No client-side mapping or conformance decisions.

Each card retains its existing conditions, bypasses, contributors and same-step
failure owner; reread the matching complete Inspector before advancing. Frozen
mutation scope: selected manifest/config, core admission boundary, default sources,
existing admission/runtime/Board tests and fixture, generated catalog, localization
docs, Changeset and this plan. Discovery is limited to current source/contract
comparison, the diff/direct consumers and formal selected positive/negative cases.
No geometry, material, render output, product runtime, other test producer, command
buttons or comments are authorized. Stop for an out-of-scope product correction.

Gates: test-first admission/localization, focused and full control-plane/Board
suites, original core proof/candidate, selected Preset proof, package tests,
scoped lint/format, naming, typecheck, scope/test-placement, generator equality,
App/tool build and exact-head Changeset check. This closes only this selected
coverage slice, not the supporting plan.

Completion evidence: admission tests first failed for absent exact paths and
proof-only startup; ordinary localization tests first failed before default
registration. After the bounded correction, all 11 unchanged cases pass and map.
The original coverage-hit negative fails only `navigation.native`, a passing
same-node filtered rerun retains that failure, and full recovery preserves its
immutable historical record. Core public-source failure remains unresolved
execution evidence. CLI/API equality and desktop/narrow Board selection, original
assertion fields, filtered rerun and historical recovery passed. Browser tests
explicitly reopen the existing narrow-screen details panel after node framing.

Focused admission/localization/runtime: 72 passed. Full control-plane: 519 passed,
two environment-conditional cases skipped. Full Board: 24 passed, two retained
live-provider/GitHub cases skipped. Package: 12 React and 100 contract tests passed;
scope/test-placement: 68 passed; naming: 15 passed. Scoped ESLint, formatting,
typecheck, generated catalog equality and App/tool build (21 tasks) passed.
Original core proof/candidate passed (three flows, five negatives, nine obligations);
selected Preset proof passed (one flow, one negative, 11 obligations). The documented
ordinary reporter command passed 11 cases with 11 mapped results and zero issues.
Evidence is retained under `tmp/flow-inspector/vector/` and the emitted permanent
fixture artifact paths. Final bounded review preserved case identities, assertions,
route/handoff/source authority, package spec references and product runtime. No
remaining in-scope findings; this coverage slice is complete, not the whole plan.

## Selected Preset compound coverage - 2026-10-15

Activated after PR #328 merged at `f1cdb4a4b`, under Bounded Result-Source Slice.
The main objective is to localize all 16 unchanged cases in
`packages/preset/src/__tests__/vector-compound-fill.test.ts`, using its existing
coverage manifest/config and the `evaluate-vector-material` node on
`render-delta-update`. Retain the Preset package specification, case IDs, handoffs,
workspace authority and the existing `omit-evenodd` negative. Eight direct coverage
cases name `vector-compound-fill.ts`; eight strategy integration cases also name
`vector.ts` and `fills.ts`. These are investigation entries, not root-cause claims.

Readiness review: the test invokes the neutral coverage owner directly and through
the existing vector strategy. Its public Core/Render/Utils source closure is the
same 14-package closure as the material config. Ordinary execution must default
to the local source and baseline, resolve exact public roots and reject undeclared
workspace imports. Captured proof retains its admitted source authority. No new
runner, runtime registry, dependency, geometry change or assertion rewrite.

Original Vitest results -> admitted exact identity/path mapping -> immutable
observations -> existing API/CLI/Board is the complete flow. The parity fault must
fail exactly the three existing evenodd cases. A filtered passing nonzero case
must not clear these failures. With a retained material hit fault at the same
node, coverage recovery must clear only coverage failures; material recovery then
clears the last failure. Historical results remain immutable and public-source
load errors remain execution failures without an invented node.

Owner execution cards retain the complete conditions, bypasses, contributors,
references and failure owners of the core proof Inspector and CORE_PROOF.md:

1. `admit-proof-contract` / Admission consumes the existing coverage manifest,
   architecture and cases, and outputs admitted exact paths and source config.
   Add only coverage manifest/config to this owner boundary. Test-first absent
   paths and proof-only startup. Preserve route/source authority; no guessed
   ownership or weakening of accepted proof. Stop on an owner/spec mismatch.
2. `localize-test-results` / Ordinary Test Failure Localization consumes admitted
   mappings and original runner results. Add this source to existing defaults and
   extend the permanent fixture/runtime tests for baseline, parity fault, filtered
   rerun, material/coverage isolation, full recovery, source-load failure and CLI
   equality. No new cache, inferred diagnosis, accepted baseline or dispatch.
3. `render-proof-board` / Board consumes service-owned observations and existing
   canvas identity. Extend the permanent Board test for three coverage failures
   and one material failure on one node, API equality, exact paths/spec/assertion,
   coverage-only recovery, final recovery and historical selection. Inspect desktop
   and narrow screenshots. Reuse the existing renderer; no client-side mapping.

Freeze mutations to coverage manifest/config, core admission boundary, default
registry, existing admission/runtime/Board tests and fixture, generated catalog,
localization docs, Changeset and this plan. Review methods are current contract/
source comparison, diff/direct consumers and permanent positive/negative tests.
Exclude other producers, product runtime, geometry changes, commands and comments.
Any necessary out-of-scope correction stops implementation.

Gates: admission/localization red-green, focused and full control-plane/Board
suites, selected coverage proof, core proof/candidate, package tests, naming,
scoped lint/format, typecheck, scope/test-placement, generated equality, App/tool
build and exact-head Changeset admission. This closes only the selected slice.

Completion evidence: admission regressions first failed for missing exact paths
and proof-only startup; runtime regressions first failed before registration.
All 16 unchanged cases now pass and map. The original parity fault fails exactly
three registered cases, while filtered nonzero execution preserves them. Retained
material and coverage failures share one node without clearing each other during
partial recovery. Full recovery preserves immutable historical records; public
Core source-load errors retain original execution evidence without a guessed node.
Board/API/CLI parity and desktop/narrow screenshots passed.

Focused admission/localization/runtime: 76 passed. Full control-plane: 523 passed,
two environment-conditional skips. Full Board: 25 passed, two retained-live-evidence
skips. Package: 12 React and 100 contract tests; scope/test-placement: 68; naming: 15. Scoped ESLint, formatting, typecheck, generated equality and App/tool build
(21 tasks) passed. Core proof/candidate passed (three flows, five negatives, nine
obligations); coverage proof passed (one flow, one negative, 16 obligations).
The documented reporter invocation passed 16 cases with 16 mappings and no issues.
Logs are under `tmp/flow-inspector/coverage/`, with emitted permanent-fixture
artifacts. Final diff/direct-consumer review found no remaining in-scope issue.
Original runtime, assertions, case identities, handoffs and workspace authority
remain unchanged. This completes the selected slice only.

PR #329 review correction: the curved-contour oracle calls the compound-fill
owner directly, so its exact location must exclude vector strategy and paint
helpers. The original seven/nine split was incorrect; the current inventory is
eight direct coverage cases and eight strategy integration cases. The strengthened
admission assertion failed on the overly broad location before the mapping fix.
This correction retains the original case identity, responsibility node, product
assertions and runtime. Review stays within admission and its direct consumers.
Post-correction validation passed: 523 control-plane cases (two conditional skips),
25 Board cases (two retained-live skips), 12 React and 100 package contracts,
15 naming cases, 68 scope/placement cases, typecheck, scoped ESLint, formatting,
generated equality and 21 build tasks. Coverage proof retained all 16 obligations
and its negative; core proof/candidate also passed. The final bounded review found
no additional in-scope issue. Logs: `tmp/flow-inspector/coverage/review-329-*.log`.

Next-stage objective: review a bounded existing Design Playwright/CI result source
for original-report ingestion and exact node localization. Choose its actual
report format, cases and owner before implementation; protected delivery, command
buttons and comments remain deferred.

## Definition of Done

For the selected producer, permanent tests cover passing and failing reports,
multiple failures at one node, unmapped cases, duplicate delivery, stale attempts,
identity mismatch, report loss, cancellation and incomplete runs. An actual
supported failing run reaches the expected node with its original reason; a
corrected rerun refreshes only the matching scope and retains history.

The producer's tests, shared ingestion/localization tests and affected Board
cases pass. Existing local localization remains usable when this producer is
unavailable. A new result adapter does not require GitHub protection, agent
execution, PR delivery or team accounts to close.

## Exclusions and Stop Conditions

Required-check configuration, merge blocking, protected verifier/issuer services,
remote delivery authorization, agent dispatch, ticket synchronization, hosting
and universal runner support are outside this plan. Reopening those objectives
requires a separate decision rather than treating them as unfinished core work.

Stop a slice if case identities cannot be resolved reliably, the result lacks
needed provenance, failures are dropped, or observation would have to be
misrepresented as trusted acceptance. Unsupported evidence stays unresolved;
do not infer a responsible node or causal diagnosis to fill the gap.

## Historical Activation Record

The following dated entry is retained verbatim. Its reference to deferred
protection requirements reflects the earlier roadmap; those requirements are
withdrawn from the current mainline above, not fulfilled by this revision.

## Phase 5 Local Activation - 2026-09-08

The user separately activated [local isolated agent execution](../AGENT_EXECUTION.md)
while retaining all deferred Phase 4 enforcement requirements. Earlier statements
that Phase 4 closeout did not activate Phase 5 remain historical facts. This new
decision grants no merge, publication, protection or Phase 6 authority.

## Selected Design Playwright results - 2026-10-15

Activated from merged PR #329, base `efbd96ab0999940851d8bb5ebd254a4ad9309b2d`.
The producer is the existing functional Design invocation in `scripts/run-e2e.sh`
and its original Playwright JSON report (`FLOW_CI_REPORT`). Preserve that run;
do not execute a second suite to obtain localization data. The initial exact
mapping is Chromium's `Delete Selected Element Delete key removes the single
selected element` in `apps/asyra-design/e2e/delete-element.spec.ts`. Other cases
remain visible and unmapped. The deletion feature is an investigation entry,
not a claim that an E2E failure proves a defect in that feature.

Plan review: the existing workflow-results collector is a bounded CI aggregate,
not a lossless test report. Preserve its behavior and consume the original JSON
separately at the existing localization owner. Capture mapping and source before
execution; retain report, runner/project/retry/repeat identities and CI repository,
base/head/integration/run/attempt. Finalize even when the test command fails.
Keep failed retry attempts visible until a later clean invocation. Missing output,
setup errors, interrupted, skipped and malformed cases cannot establish recovery.
A report from another source or changed mapped input cannot claim a current node.
Retain original attachment references and archive the original test-results with
CI observations; unavailable bytes must be explicit, never fabricated.

The mapping is observation-only and cannot be executed by the Vitest proof
runner. Reuse manifest admission and exact architecture responsibility, with an
explicit runner contract. No new accepted baseline, source authenticity claim,
remote dispatcher, automatic downloader, diagnostic inference or product change.
Read API/CLI and Board consume the same retained record and source identity.

Execution cards (reread each matching Inspector step before its segment):

1. `admit-proof-contract`: inputs are the existing deletion behavior, unchanged
   Playwright case and source boundary; output is an observation-only manifest
   and deletion responsibility architecture. Extend contract admission and proof
   runner refusal, their tests, catalog and direct docs. No product runtime edits.
   Verify exact identity, paths, admission and refusal before ingestion work.
2. `localize-test-results`: inputs are the pre-execution source/mapping context
   and original JSON; output is immutable ordinary observation evidence. Extend
   localization, a Design Playwright adapter, existing CI/script wiring and tests.
   Normalize once per completed invocation; existing reader owns cached admission.
   Test failures/retries, unknown/duplicate cases, malformed/missing reports,
   setup/interruption, source change, partial/full recovery and immutable history.
   Preserve original report and error fields. Do not infer omitted values or nodes.
3. `render-proof-board`: show producer/run identity and retained attempt context
   alongside current original errors; use existing API, CLI and canvas. Extend
   formal Board tests with received Playwright evidence and inspect desktop/narrow
   screenshots. No commands, comments, new dashboard or client-side mapping.

Frozen mutation scope is these tool owners, their tests, Design observation
manifest, CI/script wiring and direct contracts/docs/catalog/Changeset. Discovery
is limited to the selected producer, admission, source capture, direct readers,
renderer and their regression suites. Stop for unresolved source identity or
ownership, dropped failures, required out-of-scope product fixes, or unavailable
required gates. Preserve Vitest and existing CI aggregate behavior on the same
source. Gates: adapter and real Playwright report generation; original selected
Design baseline/failure/recovery; full control-plane/Board suites, package tests,
core proof/candidate, naming, scope/placement, lint/format/typecheck/build,
generated catalog, diff review and exact-head Changeset admission.

Next-stage objective: expand exact mappings within the retained Design report
only after this producer's failure-to-node path is proven; then evaluate the
separate collaboration producer. Commands and comments remain deferred.

Fixture feasibility revision: the isolated browser proof must copy the App's
CSS configuration as well as source, server and test inputs. Initial attempts
stopped at an over-anchored Playwright grep and a missing Tailwind config before
reaching the product assertion. Keep the unchanged ordinary config/case, bounded
PID-owned Vite/document/collaboration services and explicit ports. Resolve the
actual startup input closure before retrying; do not patch App startup or test
assertions. This refines test setup inside the same selected producer scope.

Local completion: the unchanged Chromium Delete case passed, failed under an
isolated deletion fault at the declared node, then passed after restoration.
Original report/error representations, retry identities and copied attachment
bytes survive recovery; API and CLI return the Board's same record. Permanent
negative tests cover missing/malformed output, foreign configuration/source,
ambiguous identities, CI identity mismatch and unavailable artifacts. Review
fixed stale passing records retiring failures, omitted primary error stacks,
malformed-identity failure loss and incomplete CI rerun context. The existing
Vitest presentation and CI aggregate remain unchanged.

Full control-plane: 537 passed, two conditional skips. Full Board: 26 passed,
two retained-live-evidence skips. Desktop, narrow and expanded-attempt screenshots
were inspected. Package tests (12 React and 100 contracts), naming (15), CI scope/
placement (68), lint, formatting, typecheck, generated catalog and the 21-task
build passed. Original core proof/candidate retained three flows, five negative
scenarios and nine obligations. Final focused producer/workflow checks cover the
last CI context correction. Required exact-head Changeset admission and remote
publication are recorded with the PR; remote CI remains separate from local
completion. The broader support plan is still open for its next bounded slice.

PR #330 stage review found two incomplete-evidence paths at
`localize-test-results`: structural report loss could leave an earlier clean
case with passing authority, and failed attachment retention did not invalidate
passing cases. Permanent regressions reproduced both before correction. The
adapter now withholds recovery when traversal or attachment retention is
incomplete, preserves original failures and reports, and still permits a later
complete clean invocation to retire the failure without rewriting history.
The selected mapping and next-stage scope remain unchanged.

## Selected Design deletion case mappings - 2026-10-15

Activated from merged PR #330 at `5fe936e745087966674914cd29b31ea4aea006e9`.
This bounded expansion maps six existing Chromium cases in
`apps/asyra-design/e2e/delete-element.spec.ts` to the existing
`design-deletion` / `delete-selected-element` responsibility. Preserve the
original `design.delete` identity and add exact identities for Backspace,
no selection, path-editing mode, mode enabled without an editing vector, and
mode disabled with an editing vector. The mapping is an investigation entry,
not a root-cause verdict or complete dependency attribution.

Design review: the current feature owns all selected eligibility decisions and
routes both keyboard deletion shortcuts through the same element API. Its
existing Inspector already declares those inputs, execution condition, bypasses
and source boundary. No new runtime step or collector is needed. The original
report normalizer retains full test titles/projects; admission and localization
already support multiple exact cases on one node. Readers reuse immutable
records, and the Board consumes those records without remapping. Preserve old
observations and mapping digests; do not retroactively resolve unknown history.

Do not map the other tests merely because they share a file. Group deletion,
undo/redo, validation rollback, hover behavior and vector-point splitting need
separately reviewed responsibility boundaries. No product code, test assertions,
CI policy, result adapter, commands, comments or collaboration ingestion changes
are authorized by this slice. Exact filename, full title and project remain
mandatory. Unknown, renamed, duplicate and foreign-project results retain their
existing explicit unresolved semantics.

Execution cards:

1. `admit-proof-contract`: consume the unchanged six product cases, deletion
   feature/spec and existing Inspector. Extend only the observation manifest,
   admission tests and direct documentation. The existing no-scenario runner
   refusal and implementation-boundary checks remain mandatory. Admission must
   retain six unique exact identities without widening to the entire file.
2. `localize-test-results`: consume original reports captured before execution;
   extend the permanent isolated Playwright fixture and its tests, not the
   production adapter. Run all six unchanged cases, inject bounded deletion and
   path-mode faults into the copied canonical feature, prove original failed
   assertions resolve to the existing node, then prove per-case partial and full
   recovery while preserving original reports and history. Keep runner fail-fast,
   process ownership, timeout and output guards; do not disable them to get a
   complete report. Use separate original invocations when failures stop a run.
   Verify exact identity rejection and unmapped siblings using received reports.
3. `render-proof-board`: extend the existing browser proof to cover the new
   Backspace mapping as well as Delete, using the same retained API/CLI records.
   Inspect desktop/narrow screenshots and test historical recovery. No UI-side
   mapping, new controls or renderer changes.

Mutation scope is the selected manifest, those existing test/fixture owners,
direct docs and a tool Changeset. Discovery is limited to the selected cases,
canonical deletion owner, admission/localization and read consumers. Existing
source capture, runner and caching contracts remain unchanged. Stop for a new
product defect, missing ownership, unavailable required gate or mapping that
requires a different producer contract. Gates: naming before/after identifiers;
manifest admission, exact identity negatives, real baseline/fault/partial/full
recovery, full control-plane and Board, package tests, lint/format/typecheck,
Design/service builds, CI scope/placement, original core proof/candidate,
generated catalog consistency, task-context and exact-head Changeset admission.

Next-stage objective: select additional Design feature owners and their exact
case sets before expanding across test files; evaluate collaboration as a
separate producer afterward. Buttons and comments remain deferred.

Local completion: all six unchanged Chromium cases passed. Isolated Delete,
Backspace and path-mode faults produced original failed assertions at the
existing responsibility node. A Backspace-only recovery retained the Delete
failure; a later full recovery preserved all historical records. Exact-identity
negative tests and the old-unmapped/new-mapped history case passed. Both Delete
and Backspace Board tests matched API/CLI records; desktop and narrow Backspace
screenshots were inspected. No product or production adapter repair was needed.

Full control-plane: 542 passed, two conditional skips. Full Board: 27 passed,
two retained external-evidence skips. Package tests (12 React and 100 contracts),
naming (15), scope/placement (68), lint, formatting, typecheck, the 21-task build,
both Design service builds and unchanged generated catalog passed. Original
core proof/candidate retained three flows, five negatives and nine obligations.
Exact-head Changeset admission and remote CI are reported separately with the PR.
This closes only the selected six-case slice, not all Design mapping coverage.

## Stage A - Complete Design functional localization - 2026-10-15

Status: locally complete and ready for review; remote CI and merge remain
separate. Base: `09e9efd6d64b56dd81ee451c6d8b89e5e463a4e7`. This is one complete roadmap Stage A,
not another per-file delivery slice. One final PR owns the entire stage.

Frozen discovery: the ordinary `playwright.config.ts` Chromium inventory with
`E2E_SKIP_PERFORMANCE=true` and the separate `playwright.status-toast.config.ts`
invocation called by `scripts/run-e2e.sh`. Formal Playwright discovery found 411
cases in 39 files, plus one status-toast case: 412 total. The failed first
list-only attempt lacked clean-worktree workspace build output; after the
unchanged 21-task build, discovery completed without errors. Discovery does not
execute product tests and is not passing behavior evidence.

| Test file under `apps/asyra-design/e2e/` | Cases |
| ---------------------------------------- | ----: |
| `ai-composer-layout.spec.ts`             |     6 |
| `ai-conversation-flow.spec.ts`           |    24 |
| `ai-conversation-navigation.spec.ts`     |     2 |
| `ai-drawing-performance.spec.ts`         |     1 |
| `ai-inspection-evidence.spec.ts`         |     7 |
| `app.spec.ts`                            |    10 |
| `basic-api-actions.spec.ts`              |   155 |
| `context-menu.spec.ts`                   |     4 |
| `conversational-ai.spec.ts`              |     1 |
| `delete-element.spec.ts`                 |    12 |
| `design-construction.spec.ts`            |     5 |
| `design-containers.spec.ts`              |     2 |
| `design-organization.spec.ts`            |     1 |
| `drawing-inspection.spec.ts`             |     1 |
| `editable-design-variants.spec.ts`       |     6 |
| `editable-design.spec.ts`                |     1 |
| `element-creation.spec.ts`               |     7 |
| `fill-patch.spec.ts`                     |    13 |
| `gradient-fill-handles.spec.ts`          |     4 |
| `gradient-fill-render.spec.ts`           |     6 |
| `group-hierarchy.spec.ts`                |     4 |
| `group-interaction.spec.ts`              |     6 |
| `indexed-design-query.spec.ts`           |     5 |
| `large-document-navigation.spec.ts`      |     1 |
| `layer-tree-reparent-reorder.spec.ts`    |     1 |
| `local-ai-provider.spec.ts`              |    21 |
| `mesh-material.spec.ts`                  |    10 |
| `native-text.spec.ts`                    |     1 |
| `oval.spec.ts`                           |     7 |
| `pen-tool.spec.ts`                       |    25 |
| `properties.spec.ts`                     |    20 |
| `retained-navigation.spec.ts`            |     3 |
| `selection.spec.ts`                      |    11 |
| `tool-switching.spec.ts`                 |     4 |
| `transaction-history-groups.spec.ts`     |     1 |
| `undo-redo.spec.ts`                      |    10 |
| `vector-gradient-fill.spec.ts`           |     1 |
| `vector-render-invariants.spec.ts`       |     3 |
| `viewport-navigation.spec.ts`            |     9 |
| `status-toast-visual.spec.ts`            |     1 |

All listed identities remain accounted for, including opt-in cases. Existing
performance/provider/replay guards are preserved. Cases requiring external replay
inputs retain explicit unavailable evidence until supplied; skipped cases never
count as tested. Collaboration-suite files, CRDT 7076, endpoint performance,
render-delta performance and `*.local.spec.ts` are not selected by this functional
command and belong outside this frozen stage. A collaboration interaction already
inside a listed functional case is not removed merely because of its topic.

Authorized changes: product-owned exact observation mappings and their architecture
contracts/spec references; the existing original-report adapter and invocation
wiring needed to cover both functional configurations; admission/localization
fixtures and permanent tests; Board consumer proofs; generated catalog and direct
documentation; tool Changeset. Product assertions, runtime behavior, collaboration
producer and optional node actions remain unchanged. Discovery is fixed to these
cases, their semantic owners, current mapping/admission/ingestion and direct
Board/API/CLI/CI consumers. Necessary product defects stop the affected work for
scope resolution instead of silently becoming runtime repair projects.

Acceptance is the roadmap's complete Stage A contract: exact inventory accounting,
reviewed responsibility and implementation references, original local/CI ingestion,
real baseline/fault/recovery per distinct owner/route, simultaneous independent
failures, partial recovery, unchanged historical evidence and Board/API/CLI parity.
Unknown/foreign/stale cases and incomplete executions must stay explicit. No
additional diagnostic run is required to locate an original failure.

Internal execution order: (1) review the complete case-to-owner architecture and
admission contract, preserving the six existing deletion identities; (2) extend
the existing ingestion source selection and functional/status-toast invocation
handoffs; (3) prove whole-stage failure, recovery and consumer parity. Each owner
segment gets its execution card here before edits. Gates are focused admission,
identity/source/report regressions, permanent original-runtime fault/recovery,
full frozen functional baseline, Board browser parity, existing control-plane and
package regression, naming, scope/placement, scoped lint/format/typecheck, affected
builds, generated catalog equality, original core proof/candidate, task preflight
and exact-head Changeset admission. Reuse unchanged build evidence; broad gates
run at the assembled stage, not after every mapping. Repeat only affected gates
following a real change or failure. Final review covers this diff and its direct
consumers. No push or PR before the complete stage satisfies these conditions.

Admission execution card: `admit-proof-contract` consumes the frozen discovery,
current App/Framework specifications and exact owner source. It emits reviewed
observation-only mappings and architecture references. Conditions: exact
file/full-title/project identity, concrete implementation entries inside the
selected owner boundary, no proof scenarios, no inferred root cause. Bypasses:
none for invalid ownership; unsupported execution stays explicitly unverified.
Allowed contributors are product-owned manifests and current semantic contracts;
UI guesses and runtime-result-derived ownership are forbidden. The implementation
boundary adds the functional/status observation manifests, their responsibility
Inspector/specification and permanent admission tests. A case-level test-file
selector extends existing admission rather than creating one manifest and copied
architecture per file; omitted selectors retain the existing manifest test file.
Source fingerprints must include every selected test file. Existing deletion
case identities and target remain unchanged. Gate: exact discovery accounting,
unique identities, valid paths/spec references, invalid selector rejection and
no observation runner execution. Stop for unresolved owner semantics before
production admission/collector edits. Cache dimensions remain empty.

Localization execution card: `localize-test-results` consumes admitted exact
case-file selectors and the original runner report, and produces immutable
localized observations. Select functional or status configuration before execution;
a report cannot choose a different source contract after execution. Functional
uses the existing deletion manifest plus the complete functional manifest; status
uses its dedicated manifest. Capture each unique source/test input once per
fingerprint and resolve each observation once at ingestion. Readers reuse retained
records without remapping. Extend the existing adapter, localization and original
runtime fixtures/tests plus `scripts/run-e2e.sh` and its existing CI invocation.
Unknown source selection, missing output, mismatched configuration and changed
source retain explicit errors and cannot clear failures. No arbitrary configuration,
new result registry, accepted-proof authority or product mutation is introduced.
Focused gates prove per-case file attribution/fingerprints, configuration isolation,
original report retention, partial recovery and source-selection rejection. Failure
owner is `localize-test-results`; no retained computation cache is added.

Whole-stage evidence review: the unchanged functional command completed with exit
zero and all 412 discovered cases accounted for, including the separate status
configuration. Five gradient cases are explicitly `test.fail` in the original
suite. Their actual failed assertions must remain failed observations even though
Playwright regards them as expected; they are not passing localization evidence.
The full-command proof's initial all-passed assumption is therefore invalid.
Correct that proof against original expected/actual attempt outcomes and replay
its retained report for verification rather than repeat the full command. Preserve
all five original errors; unrelated rendering fixes remain outside Stage A.

The initial owner proof also selected a title/root-only startup assertion that
cannot detect a RenderApp fault. Use the existing ready-layout assertion for that
route, and include the HTML bootstrap in the title/root case's declared boundary.
Review Layers disclosure separately from canvas targeting and tool-switch cases
separately from Pen geometry. These are corrections within the frozen inventory,
not additional product cases. Complete the remaining owner proofs before the
whole-stage Board and final gates. This review changes neither product assertions
nor runner failure guards, and does not authorize unrelated runtime repairs.

Isolation harness correction: preserve the original E2E import/data closure,
including `test-data` and the action batch sample explicitly read by the Agent
interceptor. Missing sample setup is an execution failure, never owner evidence.
The inspection invalidation case exercises `createInspectionEvidence.capture`,
not `inspectionApis.inspect`; target that operation and retain a separate rendered
inspection route proof. The status configuration keeps its original owned server,
Yarn command and reuse guard; copy installed Yarn metadata and link existing
installed dependencies inside the fixture, without adding or installing tools.

Board execution card: `render-proof-board` consumes the immutable observations
from multiple independent original Design cases. Reuse the existing Board/API/CLI
surfaces and render the exact mapped source, step, paths, errors, attempts and
artifacts. Verify two active feature failures, partial recovery, full recovery and
immutable history at desktop and narrow widths. No client-side remapping, root
cause inference or command execution is permitted. Only the existing browser
proof file and generated catalog change; production rendering changes require a
specific failing consumer assertion. The gate is original runtime failures plus
Board/API/CLI equality and inspected screenshots. Failure owner remains
`render-proof-board`; no new cache or product runtime dependency is introduced.

The first Agent fault selector waited for its original 30-second timeout; macOS
then rejected the runner's descendant cleanup with `kill EPERM`. That attempt is
not passing proof and the cleanup guard remains unchanged. Use the existing
partial-refinement case for the same `registerAiAgentFeature.api.execute` fault:
its unchanged partial-outcome assertion detects the disabled operation within the
ordinary assertion timeout. This bounds the localization proof without altering
product expectations, raising timeouts or accepting failed process cleanup.

### Original functional baseline and explicit unverified cases

The original command completed successfully: 387 passed, 19 skipped and five
expected failures in the functional report; the isolated status case passed.
All 412 observations resolved exactly. Expected failures remain failed in the
Inspector. This is localization evidence, not a claim that these existing
gradient defects were repaired or that skipped cases ran. The retained-report
proof verifies exact original outcomes without rerunning the 17-minute command.

The following original conditional cases remain mapped but execution-unverified
in this baseline; no case was dropped from admission:

| File                                | Exact full title                                                                                      | Original skip reason                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `ai-conversation-flow.spec.ts`      | profiles canonical prepared vector application with 16 items                                          | explicit owner profiling                                                       |
| `ai-conversation-flow.spec.ts`      | profiles canonical prepared vector application with 320 items                                         | explicit owner profiling                                                       |
| `ai-conversation-flow.spec.ts`      | profiles canonical prepared vector application with 1280 items                                        | explicit owner profiling                                                       |
| `ai-drawing-performance.spec.ts`    | Conversational AI drawing performance profile separates a 16-item product span from harness wall time | explicit performance profiling only                                            |
| `ai-inspection-evidence.spec.ts`    | recorded action stream preserves drawable targets during incremental construction                     | Provide a project-local recorded action replay manifest.                       |
| `ai-inspection-evidence.spec.ts`    | saved drawing keeps a complete snapshot after public regrouping                                       | Provide a retained project-local document for deterministic inspection replay. |
| `app.spec.ts`                       | Asyra Design Tool should refresh a storage-free demo to the empty App                                 | requires the storage-free demo App configuration                               |
| `app.spec.ts`                       | Asyra Design local-only startup keeps local editing available without server communication            | requires the endpoint-free App build                                           |
| `design-construction.spec.ts`       | local subscription constructs and reviews an editable layout from a brief                             | Requires the local subscription provider                                       |
| `indexed-design-query.spec.ts`      | indexes the preserved full Taipei 101 without repeated document scans                                 | Explicit large-document milestone                                              |
| `large-document-navigation.spec.ts` | preserves the full document while profiling navigation work                                           | Explicit large-document milestone                                              |
| `local-ai-provider.spec.ts`         | local subscription creates an editable text drawing through the real Agent panel                      | Requires an explicitly enabled local subscription                              |
| `local-ai-provider.spec.ts`         | local subscription creates an editable image drawing through the real Agent panel                     | Requires an explicitly enabled local subscription                              |
| `local-ai-provider.spec.ts`         | local subscription continues a text-only drawing after a detail choice                                | Requires an explicitly enabled local subscription                              |
| `local-ai-provider.spec.ts`         | local subscription traces the reference logo at 240px without its separate mark                       | Requires an explicitly enabled local subscription                              |
| `local-ai-provider.spec.ts`         | local subscription uses acknowledged drawing IDs for a dependent edit in one undo                     | Requires a local subscription                                                  |
| `local-ai-provider.spec.ts`         | local subscription receives fresh images during repeated refinement                                   | Requires an explicitly enabled local subscription                              |
| `local-ai-provider.spec.ts`         | local subscription reproduces a named logo through reference tools without an attachment              | Requires an explicitly enabled local subscription                              |
| `local-ai-provider.spec.ts`         | local subscription discovers APIs to reflect and center an existing vector                            | Requires local subscription                                                    |

### Stage A local acceptance and next stage

Primary goal: remove repeated discovery after an original Design functional test
fails by retaining its exact responsibility node, implementation entry and
original evidence. This is localization, not automated diagnosis or repair.

- All 412 frozen identities are admitted: six unchanged deletion cases and 406
  cases on 32 independent functional responsibility nodes. The normal and status
  configurations remain isolated; unknown, stale and ambiguous identities cannot
  borrow a mapping.
- Thirty-eight original baseline/fault/recovery routes passed in isolated copies,
  covering every declared functional owner and additional bootstrap, Layers
  selection, direct Fill/vector API, rendered inspection and redo entries.
  Original assertions were unchanged. Only affected failed proofs were repeated.
- The original full functional command completed once. Its exact retained report
  and status report passed the corrected outcome verification. Product source,
  original tests and configurations were not changed; later mapping corrections
  were verified by exact discovery/owner tests rather than another full run.
- The complete control-plane regression passed 553 tests with 42 explicit skips;
  38 skipped owner proofs were exercised separately above. Full-command and
  retained-report gates were also exercised explicitly; unrelated opt-in retained
  external-evidence checks remain unclaimed.
- Board localization, recovery and history tests passed, including two distinct
  feature failures and partial recovery with API/CLI equality. The broader Board
  suite passed using installed Chrome after isolating the catalog-link test from
  ambient observations. Two unrelated retained external-provider/GitHub checks
  remain skipped. Desktop and narrow failure evidence was inspected.
- Package tests (12 React and 100 contracts), naming (15), scope/placement (68), scoped lint/format,
  typecheck/build, generated catalog and task preflight passed. The original
  core proof passed three flows, five negative scenarios and nine obligations;
  the original candidate passed. Signal cleanup has permanent red/green coverage.

The final review was bounded to admission, captured source/configuration,
original command cleanup, mappings, direct Board/API/CLI consumers and the frozen
gates. No App/Framework production behavior, original test assertion, dependency,
collaboration producer or optional action was changed. Commit-dependent Changeset
admission and remote CI remain separate delivery checks, not inferred from these
local results.

Next goal: Stage B freezes the complete collaboration command and selected shared
Framework integration inventory, then admits original participant/run results and
proves observed consumer failures remain independent. It is not started here.
Stage C command buttons/comments remain optional and unactivated.

### PR 333 bounded Stage A review

Review baseline: `4487105b89205834a1cea351fcef70191f3591e5`. The review
covers the frozen 412-case inventory, declared operation owners, admission,
original functional/status invocation handoffs and direct Board/API/CLI consumers.
Discovery uses the PR diff, current assertions, mapped owners and existing formal
evidence. Runtime repairs, new suites, Stage B and optional actions remain excluded.
Reuse unchanged full-suite and consumer evidence; rerun only affected gates.

Admission correction card - `admit-proof-contract`: Stage A acceptance item 1
and `#start-editor`, `#switch-tool`, `#navigate-viewport` require concrete entries
for the asserted toolbar/reset/display operations. Current assertions and their
canonical toolbar implementations are allowed inputs; reviewed case entries and
matching Inspector boundaries/spec references are the output. No inferred root
cause or runtime change is permitted. Correct only the functional manifest,
responsibility Inspector/spec and their permanent admission/owner tests; regenerate
the catalog. Invalid or missing entry ownership blocks completion. Tests first
assert toolbar/reset/zoom entries, then exercise the affected original routes
through the existing isolated fault/recovery harness. Failure owner remains the
case's declared operation. No cache or new product behavior is introduced.

Localization handoff correction card - `localize-test-results`: the original
report path is invocation input, not a workspace-relative reinterpretation.
Resolve the supplied relative path at the root shell owner before handing the
same absolute path to capture, the App runner, status runner and completion.
The existing adapter's safe-path admission remains authoritative. Missing reports
remain unavailable; original failure exits and PID cleanup remain unchanged.
Allowed edits are `scripts/run-e2e.sh` and its existing workflow-result regressions.
A hermetic shell regression covers relative/absolute destinations and functional/
status handoffs without launching product services. No runtime mutation, extra
report registry or fallback output is allowed. Failure owner is
`localize-test-results`; completion requires red/green handoff evidence and the
existing cleanup regression.

Review outcome: two in-scope defects were reproduced and corrected. Toolbar, Reset
and zoom-display cases now include their concrete operation entries in both
case mappings and architecture boundaries. Relative `FLOW_CI_REPORT` destinations
now remain identical across root capture/completion and App-workspace reporters,
including the isolated status report. Absolute destinations are unchanged.

Validation: the entry regression failed before correction; the relative-path
handoff regression independently failed before correction. Admission/catalog
checks passed 57 tests, including unchanged 412-case discovery. Three additional
original baseline/fault/recovery routes passed (Reset, toolbar selection, zoom
display), bringing the retained distinct route total to 41. Initial fault probes
were corrected to target the exact Reset call and the percentage marker actually
asserted by the original test; original product assertions were not edited.
Focused producer/configuration/cleanup checks passed five tests; opt-in gates were
not counted as passing in that run. Scoped lint, naming, catalog generation and
shell syntax checks passed. Unchanged full functional, Board/API/CLI, core-proof,
package runtime and typecheck evidence above is retained, not rerun or represented
as fresh evidence. The generated catalog receives its affected package build.

Final bounded review covers exact file/title/project identity, original failure
retention, source/configuration rejection, declared investigation entries,
functional/status lifecycle and unchanged direct consumers. No remaining concrete
finding was identified in that scope. This does not establish root cause, verify
the 19 skipped product cases, or expand Stage A into collaboration work.

## Stage B - Collaboration and shared Framework localization - 2026-10-15

Activated from merged Stage A at `6ff0eaae6248c6f28279f1791d27c51c7633233b`.
One complete stage and one PR. Main goal: original collaboration and selected
shared Framework failures identify declared investigation entries and original
evidence, without propagating failure to unobserved consumers.

Frozen collaboration inventory: the original `test:e2e:collaboration` command
and `playwright.collaboration.config.ts` select 17 Chromium cases:

- `collaboration-ai-agent-video.spec.ts` - proves the high-detail progressive CRDT correctness flow without generating media
- `collaboration-ai-agent-video.spec.ts` - keeps two connected Actors converged through one complete high-detail cat Undo and Redo
- `collaboration-ai-agent-video.spec.ts` - records two live CRDT clients while Agent creates the same cat
- `collaboration.spec.ts` - keeps only the initial none-to-connected transition silent
- `collaboration.spec.ts` - does not replay a prior-generation removal after document Reset
- `collaboration.spec.ts` - keeps the room live when a retained source publication cannot apply during recovery
- `collaboration.spec.ts` - 16-item server response publishes each finite member with one Undo and Redo entry
- `collaboration.spec.ts` - 16-item AI response converges through the ordinary two-actor publication path
- `collaboration.spec.ts` - 320-item AI response converges through the ordinary cooperative two-actor path
- `collaboration.spec.ts` - 1,280-item cat prefix measures ordinary cooperative two-actor creation
- `collaboration.spec.ts` - two real Asyra Design windows converge while connected and catch up through reconnect bootstrap
- `collaboration.spec.ts` - remote undo restores an exact nested Group with and without local tombstones
- `collaboration.spec.ts` - remote Group redo preserves exact hierarchy and world geometry
- `collaboration.spec.ts` - vector creation and anchor movement converge through the canonical collaboration pipeline
- `collaboration.spec.ts` - mouse-down create and drag frames reach peer canonical state before pointer-up
- `collaboration.spec.ts` - pen drag-to-add publishes real topology and curve frames before pointer-up
- `collaboration.spec.ts` - partial Fill updates preserve computed and UI fields on both peers through Undo and Redo

The three video-file cases retain their original high-detail/media opt-in guards.
Ordinary execution covers all 14 collaboration cases; guarded cases remain
explicitly skipped unless their original environment is supplied. Mapping a
guarded case does not claim its runtime correctness. No new media recording or
external-provider task is activated.

Frozen Framework scope: all cases selected by the existing Factory publication
(9), Factory History (14), Render viewport (6), Pixi navigation (27), Preset native
fill (11), Preset coverage (16) and Agent recipe (4) manifests/configurations: 87.
Preserve their existing exact identities and owners. Original configuration
discovery/results must agree with this inventory; discrepancies block closure.
Stage A's 412 identities are preservation obligations, not another full E2E run.

Authorized changes: observation-only manifests/Inspector/specification, original
Playwright adapter, test-only participant evidence, collaboration command/CI
wiring, affected permanent tests/fixtures, generated catalog and tool docs.
No App or Framework runtime semantics, original product assertions, budgets,
resource guards, package dependencies, accepted baselines or optional actions
change. Fixed discovery is current commands/configs, selected manifests, selected
assertions, their canonical owners and direct Board/API/CLI consumers.

Architecture/design review: reuse `admit-proof-contract` and
`localize-test-results`. Exact file/title/project identifies the case; actual
participant identities are retained evidence, never guessed failure owners.
Record each identity during the existing readiness helper before contexts close,
with observation UUID, test ID, project and retry. The original report carries
these attachments; collection validates them once and stores the immutable
projection. Missing/foreign identity evidence cannot establish a clean pass or
retire a prior failure. Readers continue consuming stored records without
remapping; no new registry, dependency-impact propagation or cache is introduced.
The test helper is an explicit observation input fingerprint, separate from the
product architecture boundary.

The existing local package command and CI both enter one PID-owned shell wrapper
that captures source before invoking the unchanged Playwright configuration and
finalizes on exit. Original errors, attempts and attachments remain intact.
Functional/status source behavior remains unchanged. Vitest already records the
selected Framework manifests; reuse it and prove actual mixed-consumer outcomes.

Complete acceptance: exact 17/87 inventories; original local/CI capture; participant
identity isolation and missing-output handling; unchanged original collaboration
baseline plus bounded owner fault/recovery; shared-owner failures with passing
and unexecuted consumers, concurrent local/remote failures, partial recovery and
immutable history; Board/API/CLI parity; stale/source/config/retry rejection;
assembled tool regressions, scoped lint/typecheck/build, naming, catalog, CI scope
and task/Changeset admission. Run focused gates after meaningful slices and broad
gates once assembled; rerun only invalidated evidence. Product bugs outside
localization stop the affected acceptance rather than silently expand scope.

Admission execution card: `admit-proof-contract` consumes this frozen inventory
and current collaboration/session/Factory contracts. Add one exact collaboration
observation manifest and architecture with independent operation outcomes. Inputs
are existing cases and canonical owner source; output is admitted mappings with
required participant counts and explicit observation-only source files. Validate
invalid participant declarations/input paths, exact inventory, owner boundaries
and executable-proof rejection. Boundaries are existing admission, manifests,
Inspector/spec and contract tests. No runtime-derived or UI-guessed ownership;
missing/contradictory entries block advancement. Failure owner remains admission.

Next stage: after A/B acceptance, close the agreed localization scope. Optional
Stage C command buttons/comments require separate activation; no further mandatory
coverage stage is created.

Localization execution card: `localize-test-results` consumes the admitted
collaboration manifest, original JSON report, source fingerprint and test-only
participant attachments. Produce one immutable localized record per invocation;
validate each attempt's capture/test/project/retry identity and distinct actual
participants before allowing a pass. Preserve failed attempts even when identity
is unavailable. The helper wraps existing readiness without changing assertions
or runtime; only its declared observation input extends source capture. The
existing functional/status paths and Vitest reporter remain authoritative.
Allowed files are the adapter/localization, collaboration shell/package command,
CI handoff, observation helper/imports, and their permanent tests/fixtures named
by the Inspector. Empty, foreign, stale and interrupted inputs cannot fabricate
success. Focused gates cover source isolation, participant replay, incomplete
attempts, original failures and shell exit handling. Stop for incompatible
product semantics; no retained cache or cross-consumer failure propagation.

Framework inventory correction: original configuration discovery found 14 History
cases, of which only two had existing mappings. The other six configurations
match their declared counts. The complete selected Framework inventory is 87;
75 was the pre-discovery mapped count, not complete coverage. This is inside the
frozen config scope. Admission card: preserve both existing replay identities;
map the 12 missing cases to canonical History staging, rollback, staged-delivery
or replay ownership according to their actual assertions. Extend the existing
History Inspector/manifest and direct regression expectations, not the original
runtime or assertions. Run original baseline/negative scenarios to retain exact
scenario outcomes and complete coverage. Reject missing owners instead of
narrowing the configuration or counting unmapped failures as localized.

Collector capacity correction: the complete original collaboration command passed
14 cases and skipped the three original guarded cases, but its 14,481,480-byte
JSON exceeded the functional producer's 4 MiB limit. The retained original report
proves the producer-specific prerequisite. Raise only admitted collaboration
reports to a bounded 32 MiB limit; functional/status remain 4 MiB, attachment and
process guards remain unchanged. A permanent above-4-MiB/above-32-MiB regression
must fail before correction. Replay the retained original report/context for
acceptance rather than rerun successful product cases; keep the first unavailable
observation immutable and distinguish it from corrected ingestion evidence.

Localization boundary review: the report budget does not override the existing
32 MiB stored-record budget. The permanent oversized-envelope case proves that
normalization can exceed that bound through retained runner details. Before
saving, the localization owner must replace an over-budget result with an
explicit unavailable observation (no cases or recovery authority), preserving
the original producer file. This is incomplete evidence, not a product fallback.
The same-owner integration test exercises one Factory fault through the original
Framework configuration and collaboration case, then independent recovery and
Board/API/CLI history. Its isolated repository must copy every declared mapped
input, including specification inputs; an incomplete fixture cannot grant source
precision. No product semantics or budgets change.

Bounded fixture replan after two setup failures: shared-consumer source capture
must reuse the localization owner's expanded fingerprint input list, rather than
copy a partial manifest list or reinterpret glob boundaries. Copy those exact
files before introducing the single Factory fault. Review confirms this includes
specification, configuration and runtime inputs and preserves the original tests;
then rerun only this unfinished shared-consumer acceptance. No production change
is needed for these setup failures.

CI handoff review found the new wrapper missing from the existing suite-selection
registry. A wrapper-only diff failed the formal selection regression. Under the
localization command/CI handoff card, register this support input only for the
collaboration suite and its existing repository-check owner. The registry remains
the sole selection authority; no new CI policy or product scope is introduced.

### Stage B validation and bounded review outcome

The complete implementation is locally validated; PR review and remote CI remain
separate. This stage's main objective is original collaboration/shared Framework
failure-to-node localization, with actual participant evidence and independent
consumer outcomes. No App or Framework runtime behavior changed.

- Original complete collaboration invocation: 14 passed, 3 original opt-in cases
  skipped, 0 unexpected failures, 159.9 seconds. The original 14,481,480-byte
  report is retained under `tmp/flow-inspector/collaboration-full-kdYXy7/`.
  Its first collection was unavailable because of the former report cap. The
  corrected collector replays its captured mapping, source and original report
  into 17 mapped outcomes; the resulting record also passes the durable reader.
  This is historical ingestion evidence, not a claim that later formatting and
  clarified Inspector text were present in that product run. Current admission,
  source-input invalidation, capacity and reader tests validate those later edits.
- All seven selected Framework configurations: 87 original cases passed and
  mapped. History expands from two to all 14 exact cases, preserving original IDs;
  original replay-order/inverse faults retain all eight/nine failures.
- All five collaboration operation owners passed original baseline/fault/recovery
  proofs, with original assertions unchanged. Same-source Factory fault proof:
  three Framework failures plus one collaboration failure, six Framework passes,
  and no failure invented for unexecuted consumers. Independent recovery retains
  the other consumer's failure and both immutable original records.
- Concurrent local session/remote peer faults and partial recovery passed.
  Missing/foreign participants, retry identity, stale observation-helper inputs,
  report/envelope limits and shell failure/termination exits have permanent tests.
- Shared-consumer Board/API/CLI parity passed. Desktop (1800 x 1200) and narrow
  (850 x 1100) screenshots were inspected: mapped selection and original evidence
  are readable. Artifacts: `tmp/flow-inspector/playwright-runtime-AHMNTP/`.
  History Board integration also passed with all newly mapped failures.
- Assembled control-plane run: 617 tests, 562 passed, 54 intentionally skipped;
  its sole failure was the superseded assertion that collaboration was an unknown
  producer. That assertion was corrected and its focused rerun passed. Final
  admission/localization/collaboration tests: 76 passed, 10 opt-in skips (those
  original producer proofs were run separately as listed above).
- Tool React tests: 12 passed; final catalog/viewer/package contracts: 100 passed;
  CI relationship/workspace automation/local validation contracts: 122 passed;
  task/placement/CI initial contracts: 75 passed; naming: 15 passed.
  Scoped ESLint, shell syntax, tool typecheck/build and baseline workspace build
  passed. Core `prove` passed 3 flows, 5 negative scenarios and 9 obligations;
  `candidate` completed. No accepted baseline was changed.
- Bounded review covered declared owners, original runner handoffs, immutable
  ingestion/read consumers, selected CI wiring and Stage A preservation. It fixed
  report capacity, durable envelope capacity (including formatted bytes), and
  wrapper-only CI selection. No remaining in-scope finding is known. Historical
  full-run evidence is not rewritten or promoted to current-source conformance.

Next goal: after Stage B review/CI/merge, close the agreed A/B localization scope.
Stage C command buttons/comments remains optional and needs separate activation.
Universal repository coverage, root-cause inference, debugging/repair automation,
ADE and task dispatch remain outside this stage. The three guarded collaboration
cases are mapped but their high-detail/media behavior was not executed here.

### PR #334 whole-stage review

Review baseline: `adffbf503`; association remains Stage B in the consolidated
roadmap. Discovery is bounded to the full PR diff, the 17/87 frozen inventories,
original producer/configuration/CI handoffs, localization and Board/API/CLI direct
consumers, and existing evidence. No runtime behavior, new coverage domain or
Stage C capability is authorized. Existing successful product runs remain valid
where inputs are unchanged; focused regression tests cover review corrections.

Execution card - `localize-test-results`: preserve original outcomes, participant
identity and immutable history; distinguish clean guarded skips from runner
failure and settle the original producer's owned descendants on interruption.
Inputs are the same original report and invocation; outputs are completed or
explicitly incomplete observations, with no fabricated recovery. Existing shell,
adapter and collaboration regression files are the implementation boundary.
Failure owner is localization, not a product node. The two new formal tests fail
on the review baseline: clean pass/skip reports claim runner failure, and a live
TERM-resistant child survives wrapper termination. Fix those owners, then run
normalization/localization, shell exit/descendant, retained-report and admission
checks, scoped lint and shell syntax. Preserve passing/failed case distinctions,
resource guards and original nonzero exits. Stop for out-of-scope product defects.

Review correction results: both reproduced defects are fixed. Clean skipped
cases remain skipped/unverified while a clean mixed pass/skip invocation no
longer gains a spurious runner error; skipped attempts containing original errors
still prevent successful completion. The collaboration wrapper creates an owned
job group and settles descendants with bounded TERM/KILL before finalization,
retaining the original exit status. The permanent regression includes a child
that ignores TERM and confirms it cannot remain live after cancellation.

Affected admission/localization/Playwright/collaboration checks: 99 passed,
52 opt-in skips, zero failures, including historical complete-report ingestion
and existing Design partial-recovery proofs. Catalog contracts: eight passed.
Scoped ESLint, shell syntax and diff checks passed. No full collaboration or
seven-configuration product suite was repeated. Final review found no further
concrete defect within the frozen Stage B scope.

The initial PR head's remote Board job failed during dependency installation
before test execution (`Yarn 4.3.1: onCancel handler attached after promise
settled`). This infrastructure failure is not evidence that Board behavior
failed; no dependency/runtime upgrade or unrelated workaround is introduced.
Remote checks for the corrected head must be assessed separately.

### PR #334 repeat review - 2026-10-16

Baseline `7b2469490`; same frozen Stage B scope and discovery methods. Execution
card: `localize-test-results`, original producer lifetime and finalization. The
existing regression covered external cancellation but not a successfully exited
leader with surviving descendants. Extend the permanent test to success,
nonzero failure and signal exits; preserve the original exit code and settle only
the owned runner group before finalizing. The new success case fails on the
baseline; failure and signal cases already pass. Keep the group identity through
EXIT cleanup instead of discarding it after a successful wait. No runtime,
identity mapping, reader, dependency or product test changes are required.
Focused gates are all shell exit/descendant tests, scoped lint, shell syntax and
catalog contracts after synchronizing the existing ownership statement.

Repeat-review outcome: five focused shell/completion tests and eight catalog
contracts passed, along with naming (15), scoped ESLint, shell syntax, task
context and diff checks. The success, nonzero and signal branches preserve their
original exit codes and leave no live owned descendant. No product E2E or full
Framework run was repeated because neither product assertions nor ingestion,
mapping or reader behavior changed. Final bounded review found no further
concrete issue. Current and next stage goals remain unchanged: complete A/B
failure localization acceptance, then separately decide whether to activate
optional Stage C interactions. Remote CI is pending, not locally certified.
