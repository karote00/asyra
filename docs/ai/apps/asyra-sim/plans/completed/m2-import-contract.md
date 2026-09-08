# M2: Executable Experiments and Import Contract Completion

## Closeout - 2026-09-08

Decision: M2 is complete within the current local App profile, including the
subsequent user-requested editing and Core integration work. All five milestone
owners meet their exit criteria; no in-scope blocker remains. The final behavior
below supersedes the original explicit Save/Apply and transient-invalid-input
limitations recorded in the historical acceptance section.

Completed gestures publish through Core and enter Undo/Redo immediately; each
canonical publication persists without an additional debounce. Bounded invalid
source text and independent fields persist with immediate diagnostics, while
invalid current executable inputs block analysis and playback. Explicit new-file
import and attachment acceptance remain distinct user actions.

The final implementation is recorded at `cf04bff31`; previous integration and
editing commits are preserved in branch history. This documentation closeout
moves completed evidence without rerunning or changing historical gate counts.
Push and PR review are authorized separately by the user. No Changeset, version
bump, tag, merge, package publication or deployment is part of closeout.

Next: separately bound M3's existing static/continuous/clearance numerical
contract and evidence review before changing the first unproven owner. M4-M6,
independent numerical review, reference-hardware qualification and public release
retain their own gates. The full roadmap remains active at
`docs/ai/apps/asyra-sim/plans/asyra-sim-roadmap.md`.

## Final authored-input evidence

- **Editable input and immediate validation (completed, 2026-09-08).**
  - Scope: durable trajectory source/mapping/units and exclusion text; independent
    observation content; immediate field diagnostics, including finite interval
    endpoints whose temporary order/coverage errors must not block other settings. Completed gestures use the
    existing editing Features and Core history/publications. No manual Save.
  - Storage owns a bounded current document/edit pair (at most two source parses
    and two conversion results) per runtime, reused by editor
    validation, review and executable input resolution. Exact source text/kind,
    mapping and joint IDs/kinds/limits determine validity; metadata and geometry
    unrelated to joint validation do not repeat conversion.
  - Domain/schema guards bound authored text without claiming executable validity.
    Composition resolves authored input before snapshot/preflight; UI never plays
    the previous trajectory while current input is invalid. Legacy projects remain
    readable and historical snapshots stay immutable.
  - Owner sequence: domain/schema and edit, storage resolver, composition/snapshot,
    UI/observations. Gates: permanent red/green regressions, work counts/reuse,
    invalidation, canonical replay/reload/duplication, UI/E2E and screenshot review,
    App tests/build/typecheck/lint, naming and Inspector contracts.
  - Exclusions: solver changes, geometry simplification, storage transport,
    Framework/Preset refactors, dependencies, M3-M6 and remote/release operations.
    Stop if the bounded source model cannot isolate validity without a new owner
    or if a required schema migration cannot preserve prior evidence.
  - Verified: 647 App tests, 17 affected E2E cases at `http://127.0.0.1:3020`,
    App build/typecheck/lint, 11 naming checks, 97 Inspector checks and two test
    placement checks. Inspected live source/error, repaired conversion, interval,
    object numeric and incomplete observation screenshots. The pending observation
    creation race was reproduced permanently and fixed; later completed fields
    serialize against acknowledged identity/revision even when the editor closes.
  - No in-scope blocker remains. M1 stays closed; M2 acceptance remains complete.
    This follow-up does not complete M3-M4 or authorize M3-M6 implementation.
    Next milestone work starts with the separately bounded M3 review in the roadmap.

## Original milestone acceptance and subsequent corrections

### Acceptance - 2026-09-07

M2 meets all five milestone owner exit criteria under the current local App
profile. This acceptance closes the import-contract gaps; it does not equate
PR #156 with acceptance of M2-M4 or authorize subsequent milestones.

The 2026-09-08 authored-input follow-up preserves bounded trajectory text,
mapping/unit declarations, exclusion text and finite interval endpoints through
Core publications/history even when execution validation fails. Observation
content commits independently, including incomplete notes and fast consecutive
edits. Diagnostics are immediate; invalid current inputs block execution rather
than falling back to older normalized fields. Storage-owned parse/conversion
results are reused for preview, execution and result freshness. No historical
source, geometry, solver or release scope changed. Acceptance evidence: 647 App
tests, 17 affected E2E cases on port 3020, inspected live screenshots, App
build/typecheck/lint, naming, Inspector and test-placement gates. See the
[authored-input regression gate](../../validation/TEST_STRATEGY.md#authored-input-independence-regression-gate).
This supersedes the earlier transient-invalid-input limitation, not M3-M6 gates.

This task was based on `origin/main` at `d3b50e91d`, with changes limited to
trajectory import storage/UI and direct consumers, permanent tests, and current
App contracts. The separately requested M1 closeout and worktree-location rule
are complete. Solver algorithms, complete original geometry, Framework,
dependencies, packaging and publication were excluded.

External CSV files suggest columns with undeclared units; App-generated data
starts with s/rad/m. The 2026-09-08 user-requested correction retains existing
units during text edits without an extra notice or confirmation. Strict JSON
retains declared units. Storage produces bounded source-to-canonical review
values from the same admitted rows used for draft acceptance. Parsing is reused
across mappings; unchanged review/acceptance does not repeat normalization.
Source, mapping, units, workcell, discard and lifetime changes retire acceptance
and late reads. Saved/replayed source text initializes from the same canonical
definition as its revision, rather than an asynchronously resetting draft.
No existing project units, numbers, source geometry or historical evidence are
rewritten. Apply and save combines trajectory acceptance and the current draft
into one existing save Feature action, per the 2026-09-08 user workflow change.

The existing owner implementations were verified rather than rebuilt:

- **Trajectory:** `domain/__tests__/trajectory-source.test.ts`,
  `kinematics.test.ts` and workcell validation prove explicit units, limits,
  ordered timestamps, unwrapped intermediate rotation, shared kinematics and
  static/motion boundaries.
- **Import:** storage and UI trajectory tests prove unknown-unit rejection,
  equivalent ms/s, deg/rad and mm/m conversion, once-per-row conversion work,
  source parsing reuse, bounded first/middle/last review, malformed input,
  cancellation and stale-read rejection. `trajectory-import.spec.ts` and
  `visual-references.spec.ts` verify ordinary CSV/JSON and restricted GLB
  acceptance, complete sources, Undo/Redo and local/portable reopening.
- **Experiment:** existing editing and experiment-panel tests verify versioned
  definitions, scope, method, interval and thresholds. Browser acceptance adds
  no history before Save, Save adds one action, and replay/reopening preserve
  declared source units and full canonical precision.
- **Snapshot/preflight:** `preflight.test.ts`, original-part snapshot and
  snapshot-history tests verify detached inputs, missing geometry, empty pairs,
  background acknowledgements, explicit exclusions and distinct resource risks.
  Ordinary experiment and original-part-admission E2E verify visible blockers
  and the supported route.
- **Preview:** playback clock/control and kinematics tests plus ordinary
  workcell/experiment E2E verify sampled seeking without canonical writes and
  distinguish preview from formal evidence. Conversion screenshots were
  inspected at 1440/960/600 CSS px, DPR 1, light/dark themes, with scrollable
  review and reachable acceptance controls.

Original acceptance evidence: 593 App unit/integration tests; 22 distinct browser cases
(8 trajectory/GLB import, 7 workcell/experiment/admission, 7 projects);
App typecheck, lint and production build; 11 naming checks and 10 Inspector
catalog/test-placement checks. The old GLB browser test could observe transient
viewport text before Redo settled; it now waits for the existing History depth,
and the complete import/GLB group passes. No GLB production change was needed.
Commands and local artifact paths are in
[TEST_STRATEGY.md](../../validation/TEST_STRATEGY.md#m2-import-contract-acceptance).

No unresolved M2 blocker remains in this bounded evidence set. Next: freeze an
M3 task and review existing official static/continuous/clearance method evidence
against its numerical contract before changing the first unproven owner.
Do not redo implemented methods by default or skip to M4/M5. Independent
numerical review, reference-hardware/resource qualification, distribution,
pilots and public-release gates retain their separate requirements.

