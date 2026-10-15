# Flow Inspector Failure Localization Roadmap

## Status and Authority

Product direction revised on 2026-10-11 at the user's request. This roadmap
supersedes the previous plan-management and protected-delivery roadmap for
future work. Historical Phase 3-6 requirements are not the current completion
criteria. Removing unimplemented requirements from the mainline does not mean
they were implemented or that the original full phases were completed.

The consolidated roadmap supersedes the earlier small delivery slices. The user
subsequently activated the complete Stage A from merged main; its frozen inventory,
implementation and validation are recorded in the existing result-source support
plan. Stage A merged as PR #333. The user activated the complete Stage B from
that merged main; optional Stage C remains inactive.

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

## Consolidated Delivery Stages - 2026-10-15

This section supersedes the earlier per-case/per-owner delivery sequence and
historical "next-stage" notes in the supporting plan. Owner steps remain internal
implementation and review checkpoints, not separate user-facing stages or PRs.
The original consolidation was planning-only. Stage A was subsequently activated
as one complete implementation and merged. Stage B was separately activated
from that main; Stage C remains inactive.
Association: this roadmap's Delivery Sequence, now consolidated here; the Flow
Inspector follow-up owner retains whole-plan closeout responsibility.

### Current completed capabilities and remaining gaps

Earlier completed coverage is recorded through PR #331. The Stage A implementation
merged as PR #333. Stage B extends it as described below; local validation is distinct from PR
review, CI completion and merge.

- Core ordinary Vitest ingestion, exact case-to-node mapping, original failure
  context, Board/API/CLI access, per-case recovery and immutable history are
  implemented. Unknown, ambiguous, stale and execution failures remain explicit.
- Existing mappings cover Design Undo/Redo shortcuts, Factory transaction and
  all 14 Factory History cases, Design execution (23 cases), Render viewport
  (six), reusable-tool composition (four), Pixi adapter (27), Preset vector
  material (11) and compound coverage (16). These are selected test contracts,
  not complete package coverage, GPU output or live-provider verification.
- Design original Playwright/functional CI report ingestion is implemented.
  Stage A covers all 412 frozen Chromium identities, preserving the
  six existing deletion mappings and adding 32 functional responsibility nodes.
  Original expected failures remain failed and skipped cases remain unverified;
  coverage does not mean all underlying product behavior passes.
- Stage B adds separately admitted collaboration result support (17 exact cases,
  including three guarded opt-ins) and completes all 87 cases selected by seven
  shared Framework configurations. Its validation record is in the support plan;
  mapping a case does not turn skipped or failing behavior into a pass.
- Node command buttons and comments remain optional. Automatic diagnosis, repair,
  ADE, task orchestration and merge enforcement are outside this roadmap.

### Stage A - Complete Design functional failure localization

Status: merged as PR #333. See the Stage A activation and acceptance record
in the result-source support plan.

Outcome: within the selected Design functional suite, a failed existing test
leads directly to its responsible architecture node and original investigation
context, across features rather than only deletion examples.

Scope: at activation, freeze the complete case inventory selected by the existing
Design functional Playwright command/config at that source revision. Review all
its feature owners together, including deletion siblings, selection, history and
other features actually present in that inventory. Record exact files, projects,
case identities and justified exclusions in the existing support plan before
implementation. Collaboration belongs to Stage B. New product features, unrelated
runtime repairs and tests added after the frozen revision are not silently added.
Missing ownership inside the selected scope must be resolved, not excluded merely
to make the stage pass. This inventory/design work is internal to the stage.

Full acceptance:

1. Every product case in the frozen inventory has reviewed exact ownership and
   relevant implementation/specification references. Any intentional unsupported
   case is named with a reason; no omitted file or package-wide guessed mapping.
2. Original local and existing functional CI reports use the same retained path.
   All received failures remain readable; foreign, renamed, ambiguous and stale
   identities stay explicitly unresolved. No extra diagnostic run is required.
3. Permanent baseline/fault/recovery cases exercise each distinct owner and
   materially different route, including multiple simultaneous feature failures.
   Faults fail unchanged product assertions and identify declared responsibility;
   unrelated nodes remain independent. Mapping identity checks cover all cases.
4. Board/API/CLI expose identical source, node, implementation, original error,
   artifacts and rerun context. Partial recovery preserves other failures and
   historical records; setup errors, retries and incomplete reports cannot pass.
5. Complete the applicable integration, regression and browser gates once the
   stage is assembled; inspect desktop/narrow evidence. Deliver one cohesive PR,
   a supported-scope summary and a reproducible existing-command example.

### Stage B - Complete collaboration and shared Framework localization

Status: locally complete from merged PR #333; pending PR review and remote CI.
The frozen 17 collaboration / 87 Framework inventory and evidence live in the
result-source support plan. The complete stage is delivered as one PR after scoped validation.

Outcome: collaboration and shared Framework failures within a frozen integration
scope are as directly actionable as local Design failures, without marking every
consumer broken merely because they share a package.

Scope: freeze the complete existing Design collaboration command's case inventory
and all cases selected by the existing Framework flow manifests/configs used by
Stages A/B at activation. Reuse completed mappings; identify actual missing cases
and consumer edges in one pass. Include Factory/History, Render/Pixi and Preset
contracts already onboarded where they participate in these flows. Do not expand
to every package or hypothetical dependent. Admit collaboration's actual report,
source and participant identity contract before implementation; do not assume the
functional producer covers it. Resolve exact owners and handoffs in this stage's
existing support-plan section before production edits.

Full acceptance:

1. Every in-scope case is precisely mapped or explicitly listed as intentionally
   unsupported with a reviewed reason; all received failures retain original
   evidence. Participant/project/run identities prevent cross-session attribution.
2. Existing local and CI collaboration invocations feed the same localization
   store and Board/API/CLI context without a second execution or mapping registry.
3. Real shared-owner fault/recovery tests show each observed failing consumer at
   its declared node, with original evidence. Passing consumers remain passing;
   unexecuted consumers remain unverified. Potential impact is never a confirmed
   failure. Include concurrent local/remote failures and partial recovery.
4. Missing participant output, interrupted runs, stale source and unavailable
   artifacts remain explicit. Historical records and Stage A behavior survive.
5. Run the assembled stage's applicable producer, mapping, integration, Board and
   regression gates; deliver one cohesive PR and a reproducible App/shared-owner
   demonstration. Report the finite supported inventory and remaining exclusions.

After A/B, close the agreed localization scope; do not invent another mandatory
stage for each unmapped repository test. Further coverage needs a new explicit
scope decision. Universal runner and repository coverage is not claimed.

### Stage C - Optional node interactions

Not activated and not required to close A/B. If requested, deliver command
buttons and comment blocks as one coherent node-interaction stage, using the
existing interaction plan's safety and persistence contracts.

Full acceptance: selected rerun/open-evidence actions use the existing action
owner with correct source/test selection, permission denial without effects,
stale/duplicate handling and visible results; comments persist with attribution
and node/run context, remain distinct from original evidence, and handle changed
or missing references and storage errors. Define edit/delete behavior before
implementation. Both surfaces pass relevant API/Board tests and remain optional:
localization works without them. No arbitrary shell, automatic repair or task
creation is included.

### Delivery and validation budget

Default to one PR per complete stage, with local owner-step checkpoints inside
it. Split delivery only for a concrete dependency or review-size problem, explain
why, and retain one stage acceptance boundary. Do not rename each file as a stage.
Run focused checks after affected slices; run required broad gates at the assembled
stage and before push. Repeat checks only for changed source, a failure or a new
concrete finding. Finish with one bounded final review; do not recursively review
unchanged passing work. Existing mandatory gates and safety guards remain intact.

Stage A uses its explicitly frozen inventory and acceptance contract in the
supporting plan. Future inventories remain unenumerated until activation; the
roadmap alone does not activate optional work or authorize remote operations.

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
are no longer the remaining-work budget. Estimate a complete consolidated stage from its frozen inventory, missing
capabilities and validation costs. Internal slices are not separate delivery
estimates. Optional interactions are estimated only if activated.
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
