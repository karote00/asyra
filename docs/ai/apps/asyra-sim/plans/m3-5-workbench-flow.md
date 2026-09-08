# M3.5: Understandable Experiment Workflow

Status: planned on 2026-09-09; implementation has not started.
M3 is accepted and closed. This bounded usability milestone precedes M4.

## User outcome and scope

A user can configure an experiment, start one analysis, distinguish preview from
formal evidence, understand the result, and replay its witnesses without losing
context. The observed problem is the crowded right panel and unclear transitions
between preflight, playback, retained results and replay, not a solver defect.

This plan records the requested direction, not an already implemented contract.
Before code edits, update the thin behavior contract in
[robot-workcell-v0.md](../specs/robot-workcell-v0.md) and the matching `ui` route in
the [R0 Inspector](../../../../../tools/flow-inspector/inspectors/asyra-sim-r0-flow-inspector.html).
Read each full affected owner contract and produce a Step Execution Card before
its tests or implementation. Preserve `snapshot`, `run`, storage and rendering
ownership; change their contracts only if a concrete necessary handoff requires
an independently bounded owner step.

## Planned interaction

- Provide three right-panel tabs: **Setup**, **Preview**, and **Results**.
  Keep the selected candidate and experiment visible above them. Object editing
  remains contextual and must not discard pending completed edits.
- Setup contains experiment inputs, scope, trajectory and clearance requirements.
  Put method details, numerical tolerances and resource budgets in an advanced
  section without changing values or hiding blocking diagnostics.
- Use one primary **Run analysis** action. Invoke existing preflight admission
  automatically, then start only a valid current snapshot. A separate preflight
  action is not required in the ordinary journey. Keep workload/resource
  information accessible; warnings and required acknowledgements still apply.
- For invalid input, show persistent actionable errors, expose the owning Setup
  section and focus the relevant field. Do not rely on a transient toast, allocate
  a Worker for invalid data, or fall back to the last valid input.
- Keep run/cancel controls and progress in a stable location. Completion offers
  **View results** without unexpectedly switching tabs or stealing editing focus.
  Timeout, cancellation and Worker failure remain distinct terminal outcomes.
- Preview contains live playback and time controls, with a clear explanation that
  playback does not establish complete continuous-time clearance.
- Results leads with verdict, execution and coverage, then finding pairs and
  unresolved pairs. Keep all pairs, scope, bounds and method/source declarations
  accessible through progressive disclosure. Preserve exact pair identities and
  complete records while changing presentation order only.
- Replay changes the central scene to the selected run's frozen snapshot/time;
  keep Results and the selected evidence visible. Identify historical replay
  explicitly and provide an obvious return to current editing/preview.
- Present automatic retention as secondary **Saved to this project** status.
  Distinguish saving, acknowledged retention and retryable failure. Expose run
  history from Results without making comparison part of this milestone.
- After input edits, label old results as belonging to earlier inputs and offer
  rerun. Keep their snapshot, method/version, sources and findings immutable.

## Owner sequence and boundaries

1. Contract readiness: reconcile the interaction above with the current product
   spec and complete `ui` Inspector inputs, outputs, conditions, bypasses,
   contributors, implementation boundary and failure owner. This is the first
   implementation task, not a claim that a planning document proves readiness.
2. UI admission: connect the single Run action to current preflight/Feature
   orchestration and persistent field errors. Prove current-input execution,
   duplicate-click prevention and warning acknowledgement behavior.
3. UI navigation: introduce tabs and stable controls with fine-grained registered
   projections, keyboard/focus behavior and narrow-screen layout. Preserve
   completed field commits through tab switches, Undo/Redo and refresh.
4. Result presentation/replay: reorganize the same canonical result, surface
   findings and unresolved pairs first, clarify retention/freshness, and preserve
   snapshot-based replay and access to every pair.

Complete tests, corrections and bounded review for one owner slice before
advancing. Production edits are limited to the App workbench UI and necessary
existing App orchestration handoffs, their permanent tests and current contracts.
No parallel canonical state, history, geometry or conclusion computation is
allowed. Preserve Feature/Core transactions, direct persistence publications,
registerUIContextProperty and fine-grained subscriptions. Do not use React.memo,
extra debounce, per-Feature saving, ordinary Save/Apply controls or repeated
parsing/conversion of still-valid input. Any reuse claim requires permanent
work-count, correctness and invalidation tests.

## Permanent acceptance cases and gates

For bugs or contract mismatches, first check existing formal tests. Strengthen
missing regressions and demonstrate failure before changing production code.

- One Run action accepts valid current inputs and starts exactly one run; invalid
  trajectory, mapping, units, interval or empty scope starts none and shows the
  responsible field. Correcting an error restores eligibility without blocking
  unrelated fields. Resource warnings retain their original policy.
- Setup/Preview/Results navigation preserves inputs, editing completion,
  selection and execution state. Undo/Redo and reload restore source text,
  mappings and units. Tab navigation alone does not create canonical commits.
- Demonstrate collision, insufficient clearance, complete no-issue, numerical
  uncertainty, timeout, cancellation and Worker failure through ordinary UI.
  Execution, coverage and verdict remain separate; partial/unknown cannot pass.
- Result ordering retains every pair exactly once, including mixed collision,
  clearance and unresolved evidence. A distance witness never hides penetration.
  Replay uses the same findings and frozen inputs after edits and history reopen;
  no second solver or conclusion runs for presentation.
- Retention success/failure/retry and input freshness remain visible and truthful;
  completion during editing does not steal focus or discard an edit.
- Run focused owner unit/integration tests, affected normal App E2E, full App
  tests, build/typecheck/lint, naming, Inspector contracts and test placement.
  Inspect synchronized desktop/narrow-screen screenshots, keyboard operation,
  relevant detail views and all terminal states using port 3020. Verify the
  service PID/cwd/version and respect ownership before starting or taking over.

Done means these journeys pass permanent gates and inspected live-app views, with
an updated operation guide and user review. Tabs merely rendering is not closure.

## Exclusions and stop conditions

Do not reopen accepted M3 numerical work without a new formal defect. No solver
rewrite, precision/budget relaxation, source-geometry reduction, precise contact
region invention, dependency/tool changes, Framework/Preset extraction, M4
comparison/extensions, M5 packaging or M6 pilots/release work is included.

Stop for an out-of-scope prerequisite, conflicting owner contract or a necessary
product decision not covered here. Do not expand from new review discoveries.
M4 starts only after this separately tracked usability work is accepted; M4-M6
and independent release gates remain open. Planning/closeout does not authorize
merge, tag, publish or deploy.
