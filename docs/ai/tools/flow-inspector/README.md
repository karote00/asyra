# Flow Inspector Tool Context

This folder owns documentation for the project-owned Flow Inspector tool
family.

## Read Order

1. `FLOW_INSPECTOR.md`
2. `PLANS.md`
3. relevant files under `plans/`
4. future tool-specific architecture, workflow, rules, and decision history as
   those contracts are activated

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
full cross-PR integration assessment and target baseline acceptance remain deferred.

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
