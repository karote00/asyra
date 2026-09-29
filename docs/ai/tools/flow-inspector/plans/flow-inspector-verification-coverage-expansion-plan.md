# Flow Inspector Verification Coverage Expansion

## Status and scope

Proposed follow-up, recorded on 2026-09-29 after fault-injection validation of
integration baseline `d6ae16d6c` in the existing `flow-integration-goal` worktree.
The user requested this plan after agreeing that the bounded implementation could
be merged and improved incrementally. This document does not record a merge,
activate implementation, or reopen the completed multi-PR delivery plan.

The objective is to make verification coverage visible and extend trustworthy
failure detection to more Asyra Design features and Framework consumers.
Existing source-bound evidence, architecture ownership, task permissions and
explicit baseline acceptance remain authoritative.

## Evidence motivating the follow-up

The permanent regression case is
`source fault injection distinguishes an unmapped Design feature from cross-flow Factory failures`
in [evidence.test.cjs](../../../../../tools/flow-inspector/control-plane/__tests__/evidence.test.cjs).
It changes isolated source copies, preserves the product assertions, and runs
baseline, fault and recovery checks. The test addition was validated locally;
it is not part of the baseline commit above.

- Reversing the Design Undo/Redo shortcut direction failed both existing App
  feature tests. The registered Factory proof still passed all six obligations,
  and its captured source digest did not change. The App feature is outside
  that proof's captured source and case mapping; Factory success is not App
  verification.
- Corrupting numeric values in Factory's `value-clone.ts` failed both registered
  flows. `deferred.snapshot` and `cancel.snapshot` mapped to
  `record-reversible-journal`; `cancel.outcome` mapped to
  `finalize-transaction-state`; `cancel.delivery` mapped to
  `settle-local-shared-projection`. Two unaffected obligations remained passing.
  These are observed obligation owners, not a claim that every failing node is
  an independent root cause.
- Restoring the source recovered both App tests and all six Factory obligations.
  The 76 evidence/runner/target-assessment checks and the existing Board
  failure/recovery check also passed. The Board check exercised its registered
  negative scenario, not a visual replay of the newly injected App mutation.

These results support the implemented mechanism within its admitted scope.
They do not establish repository-wide coverage, automatic dependency discovery,
or complete downstream impact detection for arbitrary source changes.

## Priority 1 - Make coverage explicit

On the existing canvas and detail panel, distinguish a step with no admitted
behavioral verification from one whose admitted obligations have not been run,
have stale evidence, have failed, or have passed for the selected source.
Explain which contract and obligations a result covers. An aggregate must not
present uncovered steps as successful or imply that one passing flow proves the
whole App or repository.

Before implementation, define this presentation in the living Control Plane
contract and its exact Inspector owner. Keep runtime coverage and execution
state outside static schema version 2. Reuse existing evidence states where
possible; decide any new representation through the owning contract.

Acceptance:

- A reader can identify uncovered and unverified steps without opening raw logs.
- Switching flow, source or historical attempt cannot transfer successful badges
  to uncovered steps or hide a known failure.
- Board/API/CLI agree on the coverage boundary and selected evidence identity.
- Formal tests prove these distinctions; the Board gate checks their visible
  presentation on desktop and narrow layouts.

## Priority 2 - Admit one complete Design feature

Use Undo/Redo as the first candidate because its fault and existing behavioral
oracle are reproducible. Confirm the product specification, App-owned shortcut
boundary, Framework replay boundary, and exact Inspector step before admission.
Resolve App source capture and public dependency execution as an explicit owner
slice: the current package-oriented capture mechanism must not silently claim
support for App source or fall back to unrelated installed runtime output.

Map the feature's existing behavioral tests to admitted obligations and retain
source, contract and configuration identity. Keep shortcut direction tests
separate from integration tests that prove actual History replay; a mocked
history API proves routing only.

Acceptance:

- Correct behavior passes; reversing the shortcut direction fails the admitted
  feature obligations and identifies their declared owner on the Board.
- The changed App bytes change the applicable source identity; historical green
  evidence cannot pass for the changed source.
- Unrelated Factory obligations remain independently judged.
- Restoration passes the same unchanged assertions, and an actual replay
  integration case verifies the App-to-Framework handoff.

## Priority 3 - Extend Framework consumer coverage

Expand one shared capability and its declared consumers at a time, starting
with the Factory transaction/journal boundary used by the fault-injection case.
Choose subsequent consumers from real product routes and formal tests, not
shared package membership alone.

Distinguish potentially affected consumers, confirmed failing obligations,
blocked work, and consumers without verification. A Framework change should
trigger assessment of all declared affected consumers; it must not automatically
mark every flow failed or claim that undeclared consumers were checked.

Acceptance:

- Permanent cases include a local fault, a fault shared by multiple flows, an
  unaffected consumer, a conditional bypass, and an uncovered consumer.
- Each fault has an expected failure set and owner mapping defined before the
  mutation; infrastructure errors cannot substitute for behavioral failures.
- Same-source accepted preservation and target integration remain required;
  results from different revisions cannot be combined into a pass.
- Baseline, fault and recovery pass their expected outcomes without weakening
  assertions or introducing fixture-specific production behavior.

## Priority 4 - Make bounded Board tasks easier to use

Build on the existing step selection, task objective, delegation, cancellation,
candidate inspection and verification controls. After coverage is available,
make the selected failure and its evidence easy to carry into a short task
objective with a reviewable file boundary and verification obligations.

Acceptance:

- A user can select a failed step, inspect its evidence, prepare a bounded task,
  review the proposed scope, execute with an authorized adapter, inspect the
  candidate, and re-verify through the existing Board.
- Missing coverage, stale evidence, blocked prerequisites or unavailable provider
  authorization have explicit reasons and cannot launch a misleading repair.
- A successful candidate remains distinct from baseline acceptance, PR delivery,
  merge and deployment; a natural-language objective grants no extra authority.

## Delivery and exclusions

Implement each priority as a separately bounded slice after activation. Before
editing runtime behavior, update only the relevant product contract and exact
Inspector owner, define permanent cases, and apply the existing test-first and
source-admission rules. Run focused owner gates, the relevant Board cases, and
baseline/fault/recovery checks before closing each slice. Naming, formatting
and affected build checks follow the normal project rules.

This plan does not add dependencies, redesign the canvas, replace static schema
version 2, promise arbitrary shell execution, or authorize remote operations.
It does not activate mandatory GitHub protection, provider reconciliation,
team/multi-repository operation or hosting. Those remain in the existing
[CI plan](flow-inspector-control-plane-evidence-and-ci-plan.md) and
[execution/integration plan](flow-inspector-control-plane-actions-and-integrations-plan.md).

The [roadmap](flow-inspector-workflow-control-plane-roadmap.md),
[living Control Plane contract](../CORE_PROOF.md), and
[static Inspector contract](../FLOW_INSPECTOR.md) retain their respective
semantic authority. This follow-up becomes complete only for its explicitly
admitted feature/consumer set; future coverage additions remain new bounded work.
