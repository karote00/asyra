Never record completed plans here.

# Flow Inspector Plans

This file tracks active and future work for the Flow Inspector tool family.
The product direction was revised on 2026-09-07: materialize a Plan as concrete
implementation steps and executable flow contracts to manage human and AI
development risk. Open-source usefulness, reproducibility, and controlled
delegation are the success criteria.

## Active Implementation

1. [Contract Verification and CI Plan](plans/flow-inspector-control-plane-evidence-and-ci-plan.md)
   - Phase 4 is active: version review/retirement, common local operations, raw CI
     ingestion, aggregate trial, and baseline snapshots are implemented for the
     two-flow boundary. Protected mandatory CI remains a delivery blocker.
   - [Operational trial and enforcement gap](../../../../tools/flow-inspector/control-plane/README.md#phase-4-operational-trial)
     defines reproduction, trust inputs, and required external setup.
   - Extend the [Core Proof contract](CORE_PROOF.md) without treating its local
     two-flow coverage or test-name mapping policy as general project protection.

## Dependent Implementation Candidate

2. [Agent Execution and Integrations Plan](plans/flow-inspector-control-plane-actions-and-integrations-plan.md)
   - Phase 5: enforceable agent task scope, capabilities, resource limits,
     progress checks, stopping, recovery, and handoff.
   - Phase 6: small-team operations, selected ticket/PR integrations, hardening,
     and reproducible open-source adoption.
   - Entry depends on the preceding conformance/action/CI foundation, not on
     agent controls or integrations that this plan has yet to implement.

Both existing plan filenames remain stable. No schema, runtime, package,
dependency, license, or publication change is implied by the planning revision.

## Roadmap and Baseline References

- [Phase 3 completed record](plans/completed/flow-inspector-phase-3-core-proof-closeout.md)
  retains merged proof evidence. The combined plan above tracks only remaining
  Phase 4 work; the living `CORE_PROOF.md` has not moved.

- [Workflow Control Plane Roadmap](plans/flow-inspector-workflow-control-plane-roadmap.md)
  owns cross-phase direction, boundaries, activation decisions, and provisional
  effort ranges. The phase plans own their delivery cases and DoD.
- [Static Workspace 0.2.0 record](plans/completed/flow-inspector-static-workspace-0.2.0-closure-plan.md)
  records the completed Phase 0-2 baseline; its static-only contract remains
  unchanged.
