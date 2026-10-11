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
