# Flow Inspector Failure Localization Roadmap

## Status and Authority

Product direction revised on 2026-10-11 at the user's request. This roadmap
supersedes the previous plan-management and protected-delivery roadmap for
future work. Historical Phase 3-6 requirements are not the current completion
criteria. Removing unimplemented requirements from the mainline does not mean
they were implemented or that the original full phases were completed.

This documentation-only revision updates the roadmap, three unfinished plans,
the plan index and the documentation entry point. Runtime contracts, architecture
steps, existing controls, repository development rules and completed records
remain unchanged. No implementation or remote operation is activated.

## Product Objective

Reduce unnecessary discovery after an existing test fails. Humans and AI should
receive the recorded responsibility node, relevant implementation location and
original failure evidence directly, then begin investigating from that location.

```text
Test fails -> resolve its recorded node -> inspect location and failure evidence
           -> human or AI fixes the behavior -> rerun -> refresh the result
```

Flow Inspector owns localization and retained context. It does not need to infer
root causes, debug, generate repairs, split work, dispatch agents or manage
delivery. A failed assertion identifies an observed violation and its declared
investigation entry point; it does not establish the underlying causal defect.

## Product and Architecture Boundaries

- Product specifications and architecture Inspectors own behavior, responsibility,
  handoffs, implementation boundaries and failure owners.
- Existing behavioral tests remain the oracle. Reuse the admitted case-to-step
  mapping; do not introduce a competing ownership registry.
- The tool receives and retains results, resolves mappings and exposes consistent
  failure context through the existing Board and machine-readable surfaces.
- Source, mapping and run identities prevent misattribution and stale evidence.
  Unknown, unmapped, ambiguous and incomplete results remain explicit.
- Static schema version 2 stays architecture-only. Product runtimes do not depend
  on the tool. Building an Asyra product does not require adopting Flow Inspector.
- Existing task, permission, execution and baseline-acceptance controls retain
  their current contracts when used. Their expansion is not a localization gate.

## Delivery Sequence

1. **Core failure localization:** execute the
   [localization plan](flow-inspector-verification-coverage-expansion-plan.md).
   Connect supported existing test results to recorded nodes; expose implementation,
   failure and rerun context to humans and AI; prove real App and Framework
   failure/recovery. Begin with its bounded Vitest inputs, not every repository
   test or every supported runner at once.
2. **Additional result sources and coverage:** use the
   [result-source support plan](flow-inspector-control-plane-evidence-and-ci-plan.md)
   only when adding an explicitly selected producer or test/owner set. Local
   results do not need a CI service. CI results do not need merge enforcement.
   This extends the same core path rather than creating another dashboard.
3. **Optional node interactions:** after the core acceptance cases pass, separately
   scope command buttons and comment blocks under the
   [interaction plan](flow-inspector-control-plane-actions-and-integrations-plan.md).
   Neither is a prerequisite for useful localization.

The roadmap sequences these plans; it is not an additional implementation plan
whose estimates or gates should be counted twice. General repository onboarding
is incremental, not a hidden condition that every test must be mapped before
the first bounded release can be useful.

## Definition of Done

For the explicitly admitted test/runner scope:

- An existing failed run yields a visible record without another diagnostic run
  merely to locate its owner. Every received failure is mapped or explicitly
  unresolved; nothing silently disappears.
- A human can select the failure and reach the node, implementation path or
  symbol, behavior reference, original assertion/error and relevant rerun command.
  AI-accessible output exposes the same identities and evidence.
- Multiple failures, duplicate display names, stale mappings, setup failures and
  missing reports cannot overwrite evidence or invent a product diagnosis.
- A matching rerun updates only its own tested scope and retains historical
  failures. Unrun or unmapped scopes never become implicitly green.
- Formal result/mapping cases, real App and Framework fault/recovery tests and
  Board localization tests pass. Screenshots support presentation review rather
  than substituting for behavioral evidence.

The full runnable cases and owner boundaries are specified by the localization
plan and reconciled with the living contracts before implementation. Requiring a
new task, PR, provider or account merely to locate a failure violates this goal.

## Removed from the Mainline

The following unfinished ambitions are withdrawn from the current roadmap,
not queued as mandatory later phases:

- task decomposition, assignment, scheduling and agent dispatch;
- new agent backends, remote execution reconciliation and budget orchestration;
- PR/ticket synchronization, delivery management and required-merge policy;
- independently protected verifier/issuer infrastructure for enforcing delivery;
- manager/team work tracking, hosted tenancy and cross-repository coordination.

Reintroducing any item requires a separate product decision and bounded plan.
No remaining full Phase 5/6 gate blocks completion of failure localization.
Existing implementations are retained, not removed or advertised as broader
capabilities. Reproducible examples for the supported localization path remain
useful; universal hosting, packaging and publication are separate work.

## Effort and Activation

Previous multi-phase person-week estimates described the superseded product and
are no longer the remaining-work budget. Estimate a selected localization slice
from its actual inputs, mappings and validation costs. Optional interactions and
additional producers are estimated separately after their scope is selected.
No model-speed estimate or calendar promise is a product acceptance criterion.

Implementation must first review the exact relevant owner steps and contracts,
then follow the repository's formal test and bounded-scope rules. This roadmap
does not rewrite those rules or grant additional execution permissions.

## Historical Decisions and Accepted Evidence

The dated entries below retain their original wording as historical decisions.
References to pending full phases or future direction describe their date, not
today's backlog or activation authority. Current direction is defined above.
Completed records and the living runtime contracts retain their own authority.

- [Static workspace](completed/flow-inspector-static-workspace-0.2.0-closure-plan.md)
- [Core proof](completed/flow-inspector-phase-3-core-proof-closeout.md)
- [Local evidence and UX](completed/flow-inspector-phase-4-local-implementation-closeout.md)
- [Multi-PR integration](completed/flow-inspector-multi-pr-development-and-integration-plan.md)

## Phase 5 Local Activation - 2026-09-08

The user separately activated [local isolated agent execution](../AGENT_EXECUTION.md)
while retaining all deferred Phase 4 enforcement requirements. Earlier statements
that Phase 4 closeout did not activate Phase 5 remain historical facts. This new
decision grants no merge, publication, protection or Phase 6 authority.

## Phase 5 Local Bounded Completion - 2026-09-08

The [completed local execution record](completed/flow-inspector-phase-5-local-execution-closeout.md)
closes deterministic adapter admission, isolated candidate execution, retained
verification and shared controls only. Real AI backend acceptance and the full
Phase 5 DoD remain pending. All earlier protected CI requirements remain deferred;
Phase 6 remains unactivated. No release or merge is implied.

## Public Package Preparation - 2026-09-08

The user activated public-package preparation for future open-source distribution.
Flow Inspector now owns scoped Changeset records, MIT metadata and a tested source
and static-asset archive. It remains outside Framework release allowlists.
Repository-independent control-plane execution and registry publication are not
completed by this preparation; the original provider/protection gaps remain.

## Real Provider Local Continuation - 2026-09-08

After PR #167 merged, the user activated implementation of a real-provider
adapter behind the existing operation broker, in a new worktree. Provider,
model, authentication and usage authorization remain explicit pending choices;
offline protocol, containment and browser evidence cannot close live acceptance.
The continuation preserves candidate sandboxing, accepted baselines and all six
obligations. Remote reconciliation unsupported by an ephemeral provider remains
visible and blocks further dispatch. No Phase 6 or deferred protection work is
activated, and no full Phase 5 completion is claimed.

## Sol Local Acceptance - 2026-09-08

The user subsequently authorized Sol (`gpt-5.6-sol`) using the existing ChatGPT
subscription. The [bounded completed record](completed/flow-inspector-phase-5-sol-local-integration-closeout.md)
supersedes the provider-selection-pending status for this local trial only.
Actual model-produced candidate regression and correction preserve both flows
and all six obligations. Cancellation retains an unresolved remote turn; restart
and handoff cannot reset reservations or claim settlement. Full Phase 5,
independent verifier/issuer, GitHub enforcement, protected remote execution,
Phase 6 and repository-independent dynamic execution remain unclosed.

The 2026-09-09 follow-up retains local subscription operation and adds bounded
app-server interruption confirmation plus Board investigation guidance.
Confirmation is separate from remote settlement, so unresolved dispatch remains
blocked. CI-driven autonomous repair and machine authentication are operator
integrations, not implied by publishing the current package.

## Bounded GitHub review activation - 2026-09-09

[PR Review](../PR_REVIEW.md) activates only the existing local owner, one GitHub
repository and one selected candidate ready-for-review PR workflow. Preview and explicit
confirmation precede external effects. GitHub observations never accept the local
baseline or reconcile unresolved provider requests. Full Phase 5/6, ticket/team
work, protected verification and publication remain unfinished.

The [bounded completed record](completed/flow-inspector-phase-6-github-review-closeout.md)
records implemented preview/confirmation/observations and real PR #179 acceptance.
Its source-only candidate CI fails the Changeset requirement; this is visible
review evidence, not accepted delivery. Broader Phase 6 remains unactivated.

## Trusted candidate Changeset acceptance - 2026-09-11

The [bounded closeout](completed/flow-inspector-trusted-changeset-closeout.md)
records trusted Factory patch metadata, complete confirmation and real test
PR #189's five successful latest-HEAD checks, followed by closure without merge.
The fixed delivery owner prepares metadata; the candidate retains runtime-only
access. This closes the source-only candidate Changeset gap for the supported
case. Historical failures and unresolved provider evidence remain intact.
Full Phase 5/6, protected verification, required-check protection, provider
reconciliation, ticket/team/hosting and standalone dynamic service remain deferred.

## Multi-PR flow development direction - 2026-09-10

The user approved recording [multi-PR development and integration acceptance](completed/flow-inspector-multi-pr-development-and-integration-plan.md)
as a separate planned architecture change. A flow is a lasting product contract,
while tasks and PRs divide its implementation. Both accepted behavior and
in-development promises participate in CI; their assessments and full-flow
completion remain distinct. Green results from unrelated PR heads cannot certify
an integrated revision. Explicit baseline acceptance requires complete evidence
on the same integrated source. This supersedes any interpretation of the bounded
single-candidate trial as a permanent one-flow/one-PR product constraint, not its
implemented per-attempt delivery identity. The first local target/work slice and
its Board/API/CLI projections are implemented under the
[living contract](../CORE_PROOF.md#flow-targets-and-work-decomposition). Full source-bound
integration assessment, explicit target acceptance and captured full-runtime
product evidence are complete for one local owner and repository. Existing
strict verification and completed records remain unchanged; multi-repository,
team and protected external enforcement stay deferred.
