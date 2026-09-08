Never record completed plans here.

# Flow Inspector Plans

This file tracks active and future work for the Flow Inspector tool family.
The product direction was revised on 2026-09-07: materialize a Plan as concrete
implementation steps and executable flow contracts to manage human and AI
development risk. Open-source usefulness, reproducibility, and controlled
delegation are the success criteria.

## Deferred Follow-up

1. [Contract Verification and CI Plan](plans/flow-inspector-control-plane-evidence-and-ci-plan.md)
   - GitHub mandatory CI protection is deferred by the user on 2026-09-08 to
     avoid disrupting concurrent projects and merges. Resume on a separate request.
   - Remaining: independently protected verifier, issuer-bound required aggregate,
     trusted remote transport and real GitHub refusal/recovery demonstrations.
   - [Enforcement gap](../../../../tools/flow-inspector/control-plane/README.md#github-enforcement-gap)
     retains the necessary setup and acceptance evidence. Local test success
     does not establish repository-wide or mandatory delivery protection.

## Pending Provider Acceptance and Future Integration

The bounded Sol local integration is recorded in the
[completed local integration record](plans/completed/flow-inspector-phase-5-sol-local-integration-closeout.md).
Its real-provider trial does not complete the full Phase 5/6 plan.

2. [Agent Execution and Integrations Plan](plans/flow-inspector-control-plane-actions-and-integrations-plan.md)
   - Remaining Phase 5: independently verifiable remote reconciliation and any
     additional provider/resource capabilities beyond the accepted macOS Sol trial.
     Full original protection and delivery requirements remain open.
   - Phase 6: small-team operations, selected ticket/PR integrations, hardening,
     and reproducible open-source adoption remain unactivated.

Both existing plan filenames remain stable. No schema, runtime, package,
dependency, license, or publication change is implied by the planning revision.

## Roadmap and Baseline References

- [Phase 3 completed record](plans/completed/flow-inspector-phase-3-core-proof-closeout.md)
  retains merged proof evidence; the living `CORE_PROOF.md` has not moved.
- [Phase 4 local implementation record](plans/completed/flow-inspector-phase-4-local-implementation-closeout.md)
  records the accepted local/UX boundary and the explicitly deferred CI criteria.

- [Workflow Control Plane Roadmap](plans/flow-inspector-workflow-control-plane-roadmap.md)
  owns cross-phase direction, boundaries, activation decisions, and provisional
  effort ranges. The phase plans own their delivery cases and DoD.
- [Static Workspace 0.2.0 record](plans/completed/flow-inspector-static-workspace-0.2.0-closure-plan.md)
  records the completed Phase 0-2 baseline; its static-only contract remains
  unchanged.
