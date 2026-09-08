# M3: Official Collision and Clearance Methods

## Closeout - 2026-09-08

M3 is complete within the frozen local runtime and numerical profile. All six
owner exit criteria are accepted with no remaining in-scope blocker. The bounded
review retained existing sufficient implementations, added independent temporal
oracles, and corrected the formal result view's missing finding distinction and
witness-time presentation. This is not an independent numerical certification,
reference-hardware qualification, or R0 release approval.

Baseline: PR #169 merged at `a70c0bdece5734eac938fa1cc3387a13829526cb`, also
`origin/main` after the requested fetch. Branch:
`codex/asyra-sim-m3-formal-analysis`; worktree:
`/Users/asa/Desktop/workspace/asra/.worktrees/asyra-sim-m3-formal-analysis`.
The original checkout's untracked `docs/reports/` and all other worktrees were
preserved. Implementation commits are `c98ccd7e2` (method oracle) and `80bf40eb4`
(formal finding presentation and ordinary browser cases).

## Bounded contract and owner conclusions

Discovery compared the current robot-workcell, original-part, numerical-method,
runtime-profile and Core integration contracts with the dedicated R0 Inspector,
current implementation and permanent owner tests. Authorized scope was M3
method evidence and the confirmed formal result presentation omission, with
one Inspector owner completed at a time. No new product semantics, cache,
solver rewrite, geometry substitution, budget/precision change, historical
migration, Framework change or dependency addition was needed. The existing
method identity remains `original-part-clearance-v1@1.0.1`.

| M3 owner | Discovery classification and current evidence |
| --- | --- |
| Static method | Implemented with sufficient owner evidence: `convex-query.test.ts` covers all six unordered native shape pairs, analytical distances, common rigid transforms, symmetry, strict overlap, touching and scale/coordinate limits. `original-mesh.test.ts` and `workpiece-contact.test.ts` cover complete original triangles, holes, containment, traversal parity and penetration despite warning witnesses. No production change. |
| Continuous trajectory | Implemented; existing crossing/rotation/partition/budget tests are retained. Added independent binary-fraction sphere oracles in `continuous-query.test.ts`, checking every leaf's distance bounds, contiguous time coverage and the strict penetration witness window at zero and near the upper time envelope. Both added tests pass unchanged production code. They are analytical checks, not dense-sampling clearance claims. |
| Clearance | Implemented with sufficient owner evidence: native analytical distance bounds, threshold equality/contact uncertainty, original-mesh uncertainty and penetration precedence pass. Distance tolerance remains a target; actual interval bounds and unknowns remain authoritative. No production change. |
| Runner | Implemented; current runner/resource/Feature tests pass startup-inclusive deadlines, the fixed 250 ms grace, cancellation, crashes, malformed/late/contradictory output, global limits and cleanup. Production-browser uncooperative Worker and ordinary timeout/cancellation gates also pass on this worktree's 3020 service. |
| Result validator / rule evaluator | Implemented with sufficient owner evidence: current result and acceptance suites prove independent execution/coverage/evidence/verdict, partial-result preservation, unknown truth tables, forged-history rejection and once-per-pair admission. No production change. |
| Result view / replay | Actual presentation gap: both penetration and insufficient clearance appeared only as `finding`, without an explicit witness time. A permanent UI regression failed first. The view now projects the retained state/penetration flag into distinct labels and shows exact interval/witness times, without recomputing geometry or changing replay inputs. Unit proof preserves the same snapshot/time/body identities and immutable result. Ordinary browser acceptance, overview/detail screenshot inspection and frozen replay pass. |

The first three roadmap owners share Inspector `method`; runner and validator
share `run`; formal presentation/replay uses `ui`. Cards were checked against
the actual input/output routes before each segment and again at completion:

- `method`: detached snapshot/domain inputs and abort/budget produce method
  evidence. Only `analysis/methods/__tests__/continuous-query.test.ts` changed.
  Pure independent binary-fraction sphere oracles check all leaf bounds,
  contiguous coverage and the strict analytical penetration time window at
  time origins 0 and 3599 seconds. Expected values do not call production pose
  or distance helpers. Existing source-mesh, rotational and resource tests
  remain. All 71 method tests pass without a solver change.
- `run`: snapshot, method evidence and Feature abort produce validated result
  and progress. All 61 analysis/Feature tests pass unchanged, including result
  work counts and unknown verdicts; 13 browser Worker/numerical cases prove
  actual runtime arithmetic, dispatch, budget behavior and forced termination.
  No canonical transaction spans execution and no fallback method is added.
- `ui`: accepted result/snapshot feed ordinary controls; replay forwards the
  exact frozen snapshot, witness time and body IDs. Eight baseline view tests
  passed while omitting the defect; the new mixed collision/clearance/unknown
  regression failed before the fix, then all nine passed. The view reads
  retained `penetration` and `state`, not geometry or thresholds to recalculate
  findings. It shows original interval/witness values and explicitly says a
  witness is not first contact or an enumeration of all contacts. Input and
  saved formats remain unchanged. Formal UI/E2E and screenshot gates pass.

Final bounded review found no owner-boundary violation, current-diff regression,
new retained computation, fixture-specific product path or unproved solver
change. Permanent existing mesh preparation, admitted-result, live reuse and
canonical projection work-count/invalidation tests ran in the full App suite.

## Verification

- 650 App tests across 117 files pass (647 existing plus two analytical cases
  and one mixed-evidence presentation regression).
- App build/typecheck and lint pass; 11 naming, 100 Inspector contracts and two
  test-placement checks pass. The existing Vite large-chunk advisory remains.
- 27 distinct browser cases pass, with one worker, no retries and the unchanged
  180-second global guard, in the bounded batches below. Repeated visual runs
  are not counted twice.
- Agent screenshot review passed separately from automated assertions:
  collision/clearance/clear/unknown pair details, original-part collision report
  and replay, camera-only closeup, timeout/cancelled results, historical reopening,
  and a 600-pixel dark-mode finding view. Source-space tests remain geometry
  authority; screenshots do not prove the solver's numerical guarantees.

Environment: macOS 26.6.2, Node 24.13.0, Yarn 4.3.1, installed Chrome
152.0.7977.82, SwiftShader, DPR 1. Ordinary review is 1440 x 960 with default
camera or explicit Fit all. Navigation also covers 960 x 960; the finding view
covers 600 x 960 dark mode. The original collision closeup uses camera-only
wheel deltaY -700 from its default replay view and preserves evidence/history.
No native-GPU or reference-Mac-mini performance claim is made.

Commands from the worktree root:

```sh
yarn workspace @asyra/asyra-sim test:local
yarn workspace @asyra/asyra-sim build
yarn workspace @asyra/asyra-sim lint
yarn lint:naming
yarn workspace @asyra/flow-inspector test:contracts
node --test scripts/__tests__/test-file-placement.test.mjs
APP_URL=http://127.0.0.1:3020 yarn workspace @asyra/asyra-sim test:e2e e2e/__tests__/formal-outcomes.spec.ts e2e/__tests__/starter-experiments.spec.ts --grep 'ordinary original|focused interval' --output=.artifacts/m3-visual-final
APP_URL=http://127.0.0.1:3020 yarn workspace @asyra/asyra-sim test:e2e src/analysis/__tests__/runner.browser.spec.ts src/analysis/__tests__/budget-baseline.browser.spec.ts src/analysis/methods/__tests__/runtime.browser.spec.ts src/domain/__tests__/runtime.browser.spec.ts --output=.artifacts/m3-worker
APP_URL=http://127.0.0.1:3020 yarn workspace @asyra/asyra-sim test:e2e e2e/__tests__/experiments.spec.ts e2e/__tests__/resources.spec.ts e2e/__tests__/retained-runs.spec.ts --output=.artifacts/m3-integration
APP_URL=http://127.0.0.1:3020 yarn workspace @asyra/asyra-sim test:e2e e2e/__tests__/viewport-navigation.spec.ts --grep 'Fit all share' --output=.artifacts/m3-navigation
```

Root logs are `.artifacts/m3-{full,method,run,ui-baseline,ui-red,ui-green,build,lint-final,naming-final,inspector,placement}.log`.
Browser logs are `.artifacts/m3-{visual-final,worker,integration,navigation}.log`;
images and test state attachments are under
`apps/asyra-sim/.artifacts/m3-{outcomes,visual-final,worker,integration,navigation}/`.
These are local generated evidence, not a distribution. Permanent tests and
oracles are committed; existing historical reports and method versions are not
rewritten.

## Operational acceptance

Use the normal App at `http://127.0.0.1:3020`. After explicit user approval,
M2 PID 13928 was stopped. The long-lived M3 Vite process is PID 46794 with cwd
`/Users/asa/Desktop/workspace/asra/.worktrees/asyra-sim-m3-formal-analysis/apps/asyra-sim`.
A short-lived Playwright-owned M3 service ran the first outcome batch; the final
batches use PID 46794. Check the actual PID/cwd before any later takeover.

### Complete original-part collision and local replay

1. Select the initial `A - Baseline workcell` candidate and open **Experiments**.
2. Select **Tool and table collision** (initial option suffix ` - r1`). Set
   **Start time (s)** to `3.8` and **End time (s)** to `4.2`; finish each field
   with Enter/blur. Keep all 11 parts, the 46-pair scope, method, threshold,
   source geometry and default numerical budgets.
3. Run preflight, then **Run formal analysis**. Expect **Issue found**,
   execution `completed`, coverage `complete`, `46/46` pairs with evidence,
   and `2 / 0` finding/unresolved pairs.
4. In **Pair evidence and replay**, click **Next pairs** twice. Expand
   **gripper - fixture table**. Its intervals identify **Collision - established
   penetration**, including witness time `3.8 s`. **Replay pair** shows
   **Historical run replay - 3.8000 s** and highlights the two frozen bodies.
   Expand workpiece/table to inspect its own separate retained finding.
5. Zoom with the wheel or use **Fit all**; history and the formal result remain
   unchanged. Change minimum clearance to `30 mm`: the old result becomes
   historical; it remains replayable with its original frozen inputs.

### Four independent static outcomes through ordinary fields

Create **New workcell**, then use **Add fixture** twice. For each body, commit
**Object name**, **Body role**, **Mount position (m) X** and **Shape 1 type**.
Use native sphere parts, radius `0.1 m`, other position components zero:

- `Primary sphere`: role `tool`, X `0`.
- `Obstacle sphere`: role `fixture`, X as below.

Open **Experiments**, name the study **Formal sphere study**, select
`original-part-clearance-v1@1.0.1`, and set **Minimum clearance (mm)**.
Under **Analysis scope**, set Primary sphere to `primary`, Obstacle sphere to
`influencing`, and enable **Primary-to-influencing collision**. Create the
experiment and run formal analysis. No trajectory text is needed for this
static workcell. These are authored primitives, not surrogates for imported
parts.

| Obstacle X (m) | Threshold (mm) | Expected retained result |
| --- | --- | --- |
| 0.15 | 20 | Collision - established penetration; completed/complete; does not meet |
| 0.21 | 20 | Clearance violation; approximately 10 mm bounds; completed/complete; does not meet |
| 1 | 20 | No issue within interval; approximately 800 mm bounds; completed/complete; meets |
| 0.2 | 0 | Exact contact uncertainty; Unresolved; completed/partial; cannot determine |

Expand the pair to see the distinct label, retained bounds and witness `0 s`.
**Replay witness** uses **Historical run replay - 0.0000 s**. Fit all and
light/dark or panel-size changes do not alter evidence/history. Reuse the same
study for manual variants by completing the object/threshold edit and starting
a new run; old results retain their original settings.

### Timeout and cancellation

1. Return to the initial baseline candidate's default **Synthetic clearance study**
   study. Set **Wall-time budget (ms)** to `100` and finish the edit.
2. Run formal analysis. Expect `timed-out`, `partial`, no `meets` verdict,
   and automatic **Retained in this project**. Received pair counts can vary;
   omitted pairs remain explicitly without evidence. This is an intentionally
   low user budget within the frozen profile, not a changed solver limit.
3. Restore `30000 ms`, finish the edit, run again, then click **Cancel analysis**
   while running. Expect `cancelled`, `partial`, no `meets` verdict and retained
   terminal evidence. The new run must remain available after the prior timeout.
4. **Runs & compare** permits reading retained results. Reopening portable
   history and replay are covered by the existing retained-runs browser gate;
   this does not accept M4's broader comparison/extension milestone.

## Next boundary

M1 and M2 stay closed. The 3020 coordination blocker is resolved and no M3
functional/evidence blocker remains in this bounded acceptance set. Continue
only with a separately authorized M4 contract/evidence review, starting with its
first unproven owner rather than assuming existing comparison/extensions are
accepted. M5 packaging, representative/reference-hardware resources, independent
numerical review, M6 pilots, maintenance policy and public release remain open.
No Changeset, version bump, push, PR, merge, tag, publish or deploy was performed.
