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
