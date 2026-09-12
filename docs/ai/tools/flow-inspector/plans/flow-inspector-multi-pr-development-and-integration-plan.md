# Flow Development Across Multiple PRs and Integration Acceptance

## Status and decision

Date: 2026-09-10. Direction approved. The first bounded target/work slice is
implemented on 2026-09-12; this does not complete the broader architecture or
Phase 5/6 work. Its initial scope is one local owner,
one repository and one evolving flow split into several tasks and PRs.
Parallel agent scheduling, multiple repositories and team accounts are excluded.

A flow is a persistent product behavior contract. A task is a bounded piece of
work against that contract; a PR is a delivery of work. A flow can therefore
require multiple tasks and PRs. Task/attempt delivery identity and deduplication
remain intact. The current one-candidate delivery contract must not be interpreted
as requiring one PR to contain an entire feature or flow.

Both developing targets and accepted behavior enter verification from the start.
Feature completion determines eligibility for explicit baseline acceptance; it
does not determine when CI begins observing and assessing the work.

## Current delivery branch

The original target/work admission PR 193 was merged into main at `bb32a7209`
after its eight required checks passed. Its prior failed artifact run remains
historical evidence; the successful rerun used the same source. Subsequent work
continues on `codex/flow-integration-goal`, created from that updated main with
the reviewed source-assessment contract and producer commits retained. This goal
branch and its final PR must not merge into main without a new explicit user
instruction. Authorized sub-PR integration may continue into the goal branch.

## First bounded slice - target and work decomposition

[The living target contract](../CORE_PROOF.md#flow-targets-and-work-decomposition)
and `manage-flow-target` implement local goals, complete assigned-or-pending
coverage, immutable work commitments, explicit dependency handoffs, audited
revisions, exact existing-task links and source-bound admission before execution.
Board/API/CLI expose the same state and
multiple task/attempt/PR observations, with restart and stale-write protection.
Permanent owner, API/CLI and desktop/tablet/narrow browser cases cover this scope.
The [bounded closeout](completed/flow-inspector-target-work-admission-closeout.md)
records first-slice completion without closing this plan.

The strict candidate verifier remains unchanged. Dependencies stay unconfirmed,
dependent work stays blocked and complete targets stay pending. Bounded
assessments use existing strict all-flow task verdicts; broader scoped verification,
source-bound prerequisite verification, full cross-PR integration assessment and
explicit target-baseline acceptance below remain unimplemented. This slice covers
target/work admission and its usable projections only; it does not close the
full required product cases or DoD of this plan.

## Active next owner slice - source-bound assessment

The [target source assessment contract](../CORE_PROOF.md#target-source-assessment)
and `assess-target-source` separate accepted preservation, bounded
work/prerequisite results and target integration eligibility. The pure assessor,
real captured-source producer chain, runtime/verification descriptors, combined
service admission, ordinary retained-byte composition and read-only byte checks
have passed their owner gates. Version preparation now retains exact verifier
references; the service validates reviewed pairs against their original history
base and supplies immutable target pins with explicit creation/load/replay
availability semantics.

The next service consumer registers authoritative target assessment requests,
selects the accepted version by its exact immutable history revision and the
target by its exact reviewed pin, and composes both producers on one selected
runtime. Scoped verification, execution/admission consumers, Board/API/CLI
projections and explicit target-baseline acceptance remain subsequent slices.
Existing target execution and pending behavior stay in effect until those
consumers are implemented and verified. Ordinary composition does not cover
undeclared generated wrappers; the fixed four-package capture scope also does
not close the original Factory/collaboration/UI cross-PR product cases.

Historical full snapshot digests and missing verification authority are never
relabeled or reconstructed from a mutable checkout. Formal readiness uses real
captured bytes through the registered runner and evidence owners, not hand-built
trusted passing records. All original product cases, software DoD and deferred
external boundaries below remain in force.

## Product outcome

A user defines a target flow revision, divides its obligations into bounded
work items, and sees each item's dependencies, exact source and PR observations.
Each item declares its promised obligations before execution. CI assesses that
promise and preservation of affected accepted behavior. Unimplemented target
obligations remain visible as pending work, never as verified success.

When an exact integrated source contains all required contributions, the full
target flow is verified there. Only complete, current, passing evidence makes
that revision eligible for an explicit authorized acceptance decision. Neither
PR merge nor CI success alone writes accepted baseline history.

## CI responsibilities and acceptance boundaries

| Assessment                     | Required evidence                                                                                               | Failure and incomplete handling                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accepted behavior preservation | Existing required obligations for affected accepted flows, evaluated against the proposed source                | Regression, missing or stale required evidence prevents a passing assessment. Accepted behavior cannot be moved into development to avoid failure. |
| Work item completion           | The item's frozen obligations and required prerequisite handoffs at the exact proposed integration source       | Failed, unknown or missing promised evidence prevents item completion. Other explicitly unassigned target obligations remain pending, not passed.  |
| Target flow integration        | All target obligations and cross-step handoffs on one identified integrated source and target contract revision | Missing contributions, contradictory identities or any required failure prevent full-flow completion and acceptance eligibility.                   |

These are separate results in Board, API and CLI. A passing work-item assessment
must be labeled with its bounded scope and cannot appear as a globally passing
flow. Failure and evidence unavailability remain distinguishable. Existing
required CI checks are not weakened or skipped to accommodate partial work.
Actual GitHub merge enforcement remains a separate protection configuration;
this plan does not activate or claim required-check protection.

The accepted behavior assessment uses the established impact policy. If the
impact boundary is unknown, require the conservative registered verification
scope or report a blocker; do not infer that no accepted flow is affected.
Incomplete work can proceed independently only when its declared prerequisite
behavior is present and existing commitments still hold. This is not permission
to ship a broken intermediate product or automatically activate unfinished UI.

## Decomposition and evidence rules

- Freeze target revision, work-item scope, prerequisites and required accepted
  behavior before execution. The user must see what this PR promises and what
  remains for later work.
- Every required target obligation is assigned to work or explicitly retained as
  pending. Unassigned work never disappears from the target completion result.
- A completed prerequisite means usable behavior in the assessed source, not
  just a linked or merged PR. Missing dependencies and dependency cycles block
  the affected work. Overlapping ownership requires explicit resolution.
- Source evidence binds the exact repository, source/integration identity,
  contract revision, obligations and verification inputs. Test producers for one
  assessment must agree on that identity; wait for required producers to settle
  and never turn skipped/missing producers into success.
- Do not combine green results from different PR heads to certify an integrated
  flow. A changed base, contribution, dependency resolution or target revision
  requires reassessment of the affected completion claim. Historical evidence
  stays visible with its original identity and cannot become current by relabeling.
- A scope revision requires an explicit, auditable decision. A failed obligation
  cannot be removed after the result and silently counted as a completed promise.
  Retirement of accepted obligations keeps its existing separate authorization.
- PR closure without merge does not complete work. Reopened, superseded, manually
  edited or reverted PRs affect observations and source readiness, not authority.
  Restart and repeated events preserve task/attempt ownership and audit.
- Candidates cannot edit authoritative tests, gates, mappings, accepted history
  or their own admitted scope. Trusted delivery metadata, source verification and
  complete-flow acceptance remain distinct responsibilities.

## Existing architecture and implementation entry

The living [Core Proof Inspector](../../../../../tools/flow-inspector/inspectors/flow-inspector-core-proof-flow-inspector.data.cjs)
and [PR Review](../PR_REVIEW.md) describe current behavior. They are not changed
by this planning record. In particular, candidate source eligibility and one
pinned delivery per task/attempt continue to apply until a tested, explicitly
specified replacement is implemented.

Before implementation, re-read current contracts and integrated upstream work.
Do not assume changes on another unmerged branch exist on main. Extend the thin
product contract and exact Inspector owners/routes first. Name any new persisted
identities and migration rules before writing records. No implementation slice
is ready solely because this plan exists.

Work proceeds in bounded owner slices:

1. **Target and work admission.** Define the target/work/prerequisite contracts,
   complete obligation coverage and explicit scope revision rules. Start from
   `admit-proof-contract` and `admit-agent-task`; decide the exact owner for
   cross-task target state before adding implementation. Keep `prepare-pr-review`
   and `deliver-github-review` responsible for each candidate's delivery.
2. **Scoped verification and integration assessment.** Extend the relevant
   `verify-agent-candidate`, `capture-proof-source`, `ingest-ci-evidence` and
   `assess-proof-evidence` boundaries, or introduce a distinct exact owner where
   target-wide assessment requires it. Specify accepted-source eligibility for
   partial contributions; never bypass the current baseline guard ad hoc.
3. **Board/API/CLI projection.** Extend `serve-proof-actions` and
   `render-proof-board` to expose target progress, work scopes, dependencies,
   multiple PRs and the three assessments without duplicating their computation.
4. **Explicit acceptance.** Extend `review-contract-evolution` only with a
   specified complete integration evidence prerequisite. Preserve exact-base
   decisions, immutable accepted history and explicit retirement authority.

Each slice first defines formal cases, follows test-first correction where
needed, and passes its owner gates before the next slice. This plan supplies
product direction; the revised living contract and Inspector must supply exact
inputs, outputs, bypasses, contributors, failure ownership and file boundaries.

## Required product cases

- A flow is split into Factory, collaboration and UI tasks with distinct PRs.
  The first two can satisfy their bounded promises while the target remains
  incomplete. CI is active throughout; no blanket in-development exemption exists.
- A partial PR regresses accepted behavior: its assessment fails even when its
  own newly introduced tests pass. It cannot be reclassified to escape protection.
- A promised task obligation fails or has no evidence: item completion is denied.
  An explicitly pending future obligation remains pending and does not falsely
  turn a valid independent work item into failure or the whole flow into success.
- Missing prerequisites, cyclic dependencies, overlapping ownership and unknown
  impact are visible blockers. No automatic scope enlargement or omission occurs.
- Individually green PRs fail after integration: full-flow completion is denied.
  Results from different HEADs or target revisions cannot be combined to pass.
- All contributions and obligations pass on one integrated source: the target
  becomes eligible for acceptance, but baseline changes only on exact authorized
  decision. Base advancement before that decision invalidates eligibility.
- PR close/reopen, manual HEAD edit, supersession and revert never rewrite
  authoritative scope or accepted history. Duplicate events and process restart
  preserve delivery identity, progress and the corresponding audit.
- Board, API and CLI agree on scoped success, pending target work, failure,
  unknown/stale evidence and accepted revision. Desktop, tablet and narrow views
  retain the canvas, readable detail, keyboard focus and stable pan/zoom return.

## Bounded implementation DoD

Prove the cases above in permanent tests, preserve the original two Factory
flows and six obligations, and run the affected control-plane, static, package
and browser gates. Demonstrate multi-PR work with both a complete success and an
integration regression, binding results to exact source and contract identities.
Separate reproducible offline fixtures from authorized real GitHub acceptance.
Do not issue new model requests or create external test PRs merely from this plan.

Completion requires actual scoped/integration behavior, synchronized docs and
verified browser results, not additional links between cards and PRs. Record
unrun external cases and unavailable checks explicitly. Do not close this plan
or claim the new architecture implemented when only planning is complete.

## Unchanged and deferred boundaries

Independent protected verifier/issuer, required-check enforcement, protected
remote execution/evidence transport, independent provider reconciliation, hard
provider cost limits, ticket/team/tenant/hosting work and checkout-independent
dynamic execution remain deferred. Existing unresolved provider records keep
blocking provider dispatch; no fresh store or user acknowledgement bypass is
introduced. Publishing, tags, GitHub PR merge and deployment changes are not
authorized here. Normal Changeset recording remains ordinary development work.

This record does not resume PR-status monitoring or Vercel retries. Runtime,
CI configuration, schema, accepted history and existing completed records are
unchanged by this documentation-only decision.
