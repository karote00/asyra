# App Workflow

This is the default workflow for implementation work inside `apps/asyra-design`.

## Phase 0: Load Context

Read in order:

1. `docs/ai/apps/asyra-design/APP_ESSENTIALS.md`
2. `docs/ai/apps/asyra-design/CODING_STANDARDS.md`
3. `docs/ai/apps/asyra-design/ARCHITECTURE.md`
4. `docs/ai/apps/asyra-design/API_SURFACES.md`
5. `docs/ai/apps/asyra-design/REQUEST_ROUTING.md`
6. relevant `rules/*`, `modules/*`, and `features/*`

Optional retrieval accelerator:
- `npx context-rag ai "<request summary>" --top-k 8`
- Treat retrieval as lookup support; app docs remain source-of-truth.
- Follow global retrieval/search policy: `docs/ai/workflows/README.md` -> "Shared Retrieval and Search Policy (Global)".

## Phase 1: Scope

Classify task as one of:
- feature behavior change
- UI/provider change
- common-apis/controller change
- integration/bootstrap change

Define touched files and ownership before coding.

Checklist:
- [ ] feature boundary is clear
- [ ] mutation API boundary is clear
- [ ] expected undo unit is defined

## Phase 2: Design

Before coding:
- define trigger/event path
- define state reads/writes
- define cancellation/tool-switch behavior if session-based
- define panel/provider impact
- define E2E/manual verification path
- for canvas/vector/rendering/geometry work, define the `app-visual-review-sync` path before final completion claims
- identify stale pre-release app or preset branches and remove them instead of keeping compatibility fallbacks; follow `docs/ai/framework/rules/pre-release-legacy-removal.md`

Checklist:
- [ ] deterministic behavior order is defined
- [ ] no direct deep package mutation in feature handlers
- [ ] any new property is registered intentionally
- [ ] no unreleased legacy path remains reachable from product behavior

## Phase 3: Implement

For a bug or specification mismatch, first establish a formal regression that
fails on the current behavior, following the project bugfix test-first rule.
Then implement one owner boundary and its direct handoffs, rerun that regression
and the related existing behavior tests, and review the slice before advancing.
Tests are not an optional last implementation step. Common APIs/controllers,
features and provider/UI wiring retain their respective ownership.

Stop and ask if behavior conflicts with existing contracts.

## Phase 4: Verify

Run what matches scope:

- `yarn workspace @asyra/asyra-design react:build`
- `yarn workspace @asyra/asyra-design test:e2e` for UI/interaction behavior changes
- focused manual checks for interactions not fully covered by E2E
- for canvas/vector/rendering/geometry visual-correctness claims, use `docs/ai/skills/app-visual-review-sync/SKILL.md`
  - use the app-owned `APP_URL`; Vite and Playwright resolve it
    through `apps/asyra-design/app-environment.mjs`
  - assert runtime computed data before screenshots when the review is tied to supplied computed data
  - inspect the final live-app screenshots before saying `manual app visual review passed`
  - keep `E2E passed` separate from `manual app visual review passed`

Quality gates:
- [ ] app builds
- [ ] changed interaction path behaves as expected
- [ ] no regression in tool switching/selection/property panel for touched area
- [ ] visual completion claims include synchronized live-app review evidence when applicable

### AI conversation verification

Every verification method and completion claim follows the
[AI conversation verification contract](specs/ai-conversation-verification.md).
It owns independent spec coverage, actual producer/consumer evidence, fault
sensitivity and verifier conformance. The existing command and conformance corrections are implemented in the
[uniform verification plan](plans/completed/agent-context-and-report-continuity-plan.md#uniform-verification-contract).
Passing results alone cannot establish compliance with that standard; the separate
semantic review and source-specific evidence remain required.

Run `yarn workspace @asyra/asyra-design verify:conversation --list` to inspect the
maintained owner test selection and separately authored required handoff selectors.
Run the same command without `--list` at the completed feature checkpoint. It cleans
and builds the generated App dependency closure, records loaded-source/export
identity, then runs App server/UI, Runtime, Knowledge/shared verification and real
browser tests with structured reports. It does not run a live model or 101.

The [active plan](plans/completed/agent-context-and-report-continuity-plan.md#uniform-verification-contract)
and current product specs own semantic requirements. The standard Flow-file at
`test-data/conversation-verification/flow/conversation.flow.json` records required
handoff criteria independently of file selection. Complete admission must use the
shared Flow Inspector producers; the plan records a currently missing diagnostic
in the App runner's path. The command cannot accept the separate spec-coverage
review, infer complete semantics from test counts, or excuse missing evidence.

Evidence is retained under `tmp/conversation-proof-*`. Exit 1 means execution failed
or evidence was incomplete; exit 2 means executed checks passed but whole-feature
acceptance remains unproved; exit 0 requires both execution and current Flow-file
acceptance. Failed, skipped, duplicated, interrupted or mismatched-source evidence
cannot pass. Inspect individual reports and the independent coverage review before
claiming whole-conversation correctness.

The former verifier and saved-reply dispatcher remain deleted. There is no fallback,
forwarding wrapper or old command. Review current specifications using the
[verification procedure](modules/ai-development-and-debugging.md#conversation-contract-review).
A focused run establishes only its observed boundary.

## Phase 5: Docs Sync

Update app docs when contracts change:
- feature behavior -> `features/*`
- boundaries/rules -> `rules/*`
- startup/module ownership -> `modules/*` or `ARCHITECTURE.md`
- source-module mapping update -> `modules/source-coverage.md`
- state ownership or key usage changes -> `modules/state-contracts.md`
- behavior-level acceptance -> `bdd-features/*`
- requirement-level intent -> `prd/*`
- capability scope -> `epics/*`
- implementation execution slices -> `task-breakdowns/*`
- future work -> `PLANS.md`
- app-level rationale history -> `decisions/releases/unreleased.md`
- cross-cutting rationale (if framework+app impact) -> `docs/ai/decisions/releases/unreleased.md`

## Phase 6: Handoff

Report:
1. what changed
2. behavior impact
3. validation run
4. open risks/follow-ups
