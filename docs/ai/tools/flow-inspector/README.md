# Flow Inspector Tool Context

This folder owns documentation for the project-owned Flow Inspector tool
family.

## Role in Plan-Driven Development

Flow Inspector supports developing a plan through an explicit flow contract:
design and review the complete flow before production implementation, then
verify each work item, its handoffs, the integrated result and preservation of
accepted behavior. The static viewer, execution service and evidence assessment
are different parts of that workflow.

The development sequence is:

1. **Plan to flow.** Translate the intended outcomes into owners, steps,
   inputs/outputs, routes, prerequisites, failure behavior and acceptance cases.
   Keep product semantics in the authoritative specification and architecture
   in the Inspector contract.
2. **Review before implementation.** Check each step against actual code and
   constraints, check producer/consumer compatibility, and review whole-flow
   feasibility. Establish the accepted behavior and regression obligations that
   must remain intact. Resolve blocking design findings and material uncertainty
   before handing off production work.
3. **Prepare bounded work.** Use the supported contract, target and work admission
   paths described in [Core Proof](CORE_PROOF.md#flow-targets-and-work-decomposition).
   Preserve the reviewed revision, accepted baseline, complete obligations,
   prerequisites and selected owner boundary in the handoff.
4. **Implement and verify.** Implement the reviewed owner segments and retain
   current source-bound evidence. Assess the selected work, its prerequisites,
   whole-target integration and accepted-behavior preservation separately on the
   same source. Passing one work item cannot stand for a passing whole flow.
5. **Review necessary design changes.** When implementation evidence invalidates
   an assumption, stop the affected segment and review the revised contract,
   connected steps, integration and preservation obligations before resuming.
   Synchronize the affected specification, Inspector, cases and proof mapping.
6. **Complete the target.** Require all target obligations and handoffs to pass,
   with accepted behavior preserved. Baseline acceptance remains a separate,
   explicit action under the existing service contract.

The collaboration entry, worker handoff and PR responsibilities are defined in
[Task Context and Plan Closeout](../../workflows/task-context.md#plan-to-flow-development-and-review-before-implementation).
Design review establishes justified implementation readiness; structural
admission alone cannot establish runtime correctness. Formal evidence must
prove the resulting behavior. The scope below identifies the tool's implemented
coverage: this development sequence does not imply automatic review of arbitrary
plans, automatic dispatch, or verification of unregistered flows.

## Read Order

1. The development sequence and implemented scope in this README.
2. `FLOW_INSPECTOR.md` for the static architecture representation.
3. `CORE_PROOF.md` for supported admission, work decomposition, verification,
   whole-target assessment and baseline acceptance.
4. `AGENT_EXECUTION.md` when using authorized local execution, and `PR_REVIEW.md`
   when using the supported PR delivery/review path.
5. `PLANS.md` and relevant files under `plans/` for unfinished capability work.

## Scope

Flow Inspector includes a static, read-only architecture viewer and a React
workspace at `tools/flow-inspector/workspace/`. The workspace provides one
sidebar-driven surface for all current-project Inspectors while retaining
direct-open standalone HTML compatibility. The bounded local
[Core Proof](CORE_PROOF.md) at `tools/flow-inspector/control-plane/` adds real
Factory flow verification, snapshot-bound evidence, explicit mapping review, and
controlled actions on the existing canvas cards. The completed local Phase 4 extension adds
contract evolution, CI evidence admission, and shared baseline snapshots; its
mandatory protected CI delivery gate remains deferred.
[Local Agent Execution](AGENT_EXECUTION.md) adds bounded Phase 5 demonstration
execution, isolated candidate verification and human handoff. The
[bounded Sol integration](plans/completed/flow-inspector-phase-5-sol-local-integration-closeout.md)
adds actual subscription-model acceptance; full Phase 5, remote reconciliation
and full Phase 6 remain unfinished.
[Bounded GitHub PR Review](PR_REVIEW.md) adds the separately activated local
candidate preview, explicit confirmation and review observation boundary. The static Inspector's schema version 2 contract is unchanged.
[Flow targets and work decomposition](CORE_PROOF.md#flow-targets-and-work-decomposition)
adds local audited goals and bounded work commitments through Board/API/CLI;
the same local surfaces now expose source-bound whole-target assessment and a
separate explicit integrated-target baseline acceptance action. Broader runtime
coverage, cross-repository coordination and external delivery remain deferred.

The tool may inspect Framework and App contracts, but neither Framework nor an
App may depend on the tool at runtime. Tool publication and versioning remain independent from Framework publication.
The public `@asyra/flow-inspector` package now records scoped Changesets under
its own identity, outside the Framework bulk-release allowlist. Its archive
contains static assets and source; dynamic execution still requires the Asyra
checkout. See the package README for the supported distribution boundary.

All Inspector data, standalone HTML, and Inspector contract tests are owned by
`tools/flow-inspector/inspectors/`. Framework and App documentation remains the
semantic authority referenced by those artifacts; their `plans/` directories
do not store Inspector implementation artifacts.

## Documentation Structure

- `FLOW_INSPECTOR.md` - current static Inspector contract.
- `PLANS.md` - active and future Flow Inspector planning index.
- `CORE_PROOF.md` - living Phase 3 proof and active Phase 4 contract, cases, and bounded DoD.
- `PR_REVIEW.md` - bounded GitHub candidate review, trust boundaries and cases.
- `AGENT_EXECUTION.md` - local Phase 5 contract, supported limits and remaining boundaries.
- `plans/` - detailed roadmap and active phase plans.
- `plans/completed/` - completed plan records.
- `decisions/releases/` - append-only tool release decision history.
- Future active implementation may add tool-owned `ARCHITECTURE.md`,
  `WORKFLOW.md`, `API_SURFACES.md`, and `rules/` following the established
  Framework/App context pattern.

## Inherited Rules

Flow Inspector work inherits project-wide hard rules under
`docs/ai/framework/rules/*`.
