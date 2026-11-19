# Hierarchy Boundary - Measurement and Feasibility

November 10, 2026. Plan: Agent Context and Report Continuity, Local hierarchy
work and projection, Render boundary acceptance revision.

## Status

Step 1 is complete. Step 2's bounded SDK candidates have been characterized and
rejected as complete solutions. No candidate has passed the full feasibility
contract. Steps 3 and 4 remain pending; no production renderer, Group policy,
engine contract or Inspector semantics were changed in this task. This is not a
completed performance fix. No group-size threshold, compatibility routing,
private SDK mutation, dependency change, commit or push was introduced.

## Same-source method

The permanent local browser benchmark now covers the retained real 101 document
and the six existing 4,000-element small-group cohorts. Four ABBA blocks select
previous/current Group strategies on identical production code in one browser
context. The registry probe and policy-integrity assertion prevent a later Group
strategy from silently changing the baseline. The candidate and baseline share
all current Core, hierarchy-admission, UI and region improvements.

The real fixture has 25,539 visible leaves. Four roots contain 25,491 leaves;
48 ornaments are already outside these roots in the immutable saved scene. This
is a replay of retained completed geometry, not a reconstruction of the original
pre-group document. The benchmark moves the four roots into an empty sibling
Group and back, preserving their canonical order. Translation moves all four
roots by two screen pixels and restores their original computed x values. Camera
pan is a separate phase. This measures real hierarchy/API paths, not only SDK
calls. Initial fixture loading and policy switching are outside timing.

Each mode/phase has 60 CPU timing samples, 20 independent GPU timer samples and
four separately instrumented work-count frames. The final seven-case matrix and
two-case confirmation contain 4,320 CPU and 1,440 valid GPU samples, without
GPU disjoint events or timeouts. Instrumentation counts WebGL draw calls, matrix
uploads and, in confirmation, bufferData/bufferSubData calls. Buffer counts include
all renderer buffers and do not identify byte volume or exclusively geometry.
CPU timings run without these hooks. GPU timer queries are separate samples.

Completion time spans mutation, render submission and gl.finish after draining
previous work. It is a controlled serial completion measurement, not operating
system presentation latency. Do not add CPU and GPU medians. All values below
are medians in milliseconds. Device: Apple M3 Max, ANGLE Metal, WebGL2, Chrome
157.0.8103.40, 1280-by-720 canvas, DPR 1. Raw metadata records the fixture digest,
benchmark digest, current Group source digest, HEAD and exact selected strategy
bodies. HEAD alone does not represent the existing dirty worktree.

## Real 101 results

Each cell is baseline to isolated-Group policy. Primary and independent
confirmation are both retained; small timing differences are not hidden.

| Run | Phase | Mutation CPU | Render CPU | Through GPU completion | GPU timer |
| --- | --- | ---: | ---: | ---: | ---: |
| Primary | redraw | 0.00 -> 0.00 | 0.40 -> 0.80 | 0.45 -> 0.80 | 0.669 -> 0.617 |
| Primary | pan | 0.10 -> 0.10 | 0.60 -> 0.70 | 0.70 -> 0.90 | 0.508 -> 0.635 |
| Primary | translate | 0.50 -> 1.80 | 14.70 -> 0.50 | 15.20 -> 2.40 | 0.620 -> 0.648 |
| Primary | reparent | 21.05 -> 9.70 | 33.00 -> 0.30 | 54.30 -> 10.00 | 0.617 -> 0.608 |
| Confirmation | redraw | 0.00 -> 0.00 | 0.20 -> 0.20 | 0.20 -> 0.20 | 0.611 -> 0.607 |
| Confirmation | pan | 0.10 -> 0.10 | 0.30 -> 0.50 | 0.40 -> 0.60 | 0.612 -> 0.617 |
| Confirmation | translate | 0.50 -> 1.10 | 14.30 -> 0.30 | 14.80 -> 1.40 | 0.615 -> 0.622 |
| Confirmation | reparent | 21.55 -> 10.60 | 35.70 -> 0.30 | 56.90 -> 10.90 | 0.605 -> 0.610 |

Reparent completion falls from 54.30 to 10.00 ms in the primary matrix and from
56.90 to 10.90 ms in confirmation. Parent translation falls from 15.20 to 2.40 ms
and from 14.80 to 1.40 ms. The benefit is real and mostly visible in CPU work;
GPU elapsed time remains around 0.6 ms for this view. Ordinary redraw CPU varies
between runs, so the real scene alone does not establish a steady-frame penalty.
The small-group cohort below does.

Confirmation counts for the real scene: steady redraw uses 52 versus 53 draws
and 33 versus 45 matrix uploads; no buffer uploads in either mode. Translation
uses one versus zero buffer uploads. Reparenting uses two in both modes: isolating
Groups does not mean the rest of the changed scene has no uploads. Draws average
52.5 versus 53 across the two reparent directions.

## Small-group confirmation

The 1,000-Group vector cohort has four leaves per Group. Its ordinary redraw is
still slower with isolated Groups, despite retaining the large-scene benefit.

| Phase | Baseline CPU render | Isolated CPU render | Baseline GPU | Isolated GPU | Baseline completion | Isolated completion |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| redraw | 1.95 | 2.60 | 0.248 | 0.592 | 2.00 | 2.60 |
| pan | 1.75 | 2.70 | 0.225 | 0.570 | 1.90 | 2.80 |
| translate | 1.40 | 2.60 | 0.240 | 0.588 | 2.95 | 3.05 |
| reparent | 3.20 | 2.70 | 0.217 | 0.581 | 23.80 | 24.95 |

Draw calls remain 1,000 in both modes. Matrix uploads are 2 versus 2,000 on each
frame. Steady-frame buffer uploads are zero in both modes, so skipping geometry
uploads alone does not remove the observed slowdown. Translation uses one versus
zero uploads and reparent uses two versus zero, but completion still does not
improve consistently for four tiny roots. Do not infer that native retention is
universally beneficial from the large-scene result.

## Bounded public-SDK feasibility experiment

Permanent owner test:
`packages/render-engine-pixi/src/__tests__/hierarchy-retention-feasibility.test.ts`.
Four roots with 4,000 native drawable descendants use actual public
reparentChildAt, RenderLayer and RenderGroup behavior. Counts are sampled before
verification queries. Native bounds/world positions are preserved by the first
three routes, and later leaf and root edits still update correctly.

| Candidate | Destination membership calls | Descendant local-transform calls | Decision |
| --- | ---: | ---: | --- |
| Ordinary public reparent | 4,004 | 4,000 | Correct output, does not retain descendant work |
| Public reparent plus RenderLayer | 4,004 | 4,000 | Adds explicit layer reattachment, no retention benefit |
| Independent RenderGroups | 4 | 0 | Retains work, but small-group browser regression remains |
| Retain native placement and use RenderLayer as the new logical parent | No native move requested | Not a valid logical-parent handoff | Local bounds are empty and layer translation does not move attached content |

The fourth test proves a necessary-contract failure, not a complete alternative
renderer. RenderLayer owns render order, while transform inheritance and native
bounds still follow physical parents. The current engine snapshot path obtains
local bounds from the target native object and rejects an empty target. Therefore
an order-only layer cannot replace the Group handle's full query semantics.
No browser snapshot success is claimed for this rejected candidate.

These failures do not prove that all possible logical/native separation is
impossible. They establish that the currently bounded SDK substitutions cannot
meet the complete contract. No native-child list, private dirty flag or cached
transform was overwritten to manufacture a passing result.

## Review and next design boundary

The original plan correctly gated production work. Its assumption that existing
identity partitions might directly support general logical/native separation is
not established. Existing partitions preserve identity transforms and own native
children; they do not supply a virtual Group's bounds, snapshot membership or
transform inheritance independently of that hierarchy.

Before step 2 can pass, one complete retained-projection design must explain:

1. How the canonical transaction supplies final parent/order/coordinate changes
   together, including query-before-next-frame and failure recovery.
2. Who retains the effective render-space mapping, how a logical-only move is
   classified without scanning every descendant, and how independent child edits
   remain dirty. New decision work must be measured rather than ignored.
3. How one opaque Group handle selects exactly its logical content for bounds,
   snapshot and hit queries when physical placement differs. Viewport cropping
   cannot substitute because it may include unrelated overlapping objects.
4. How painter-order changes update affected draw ranges without rebuilding all
   retained geometry, while real transforms and cross-domain moves still perform
   required updates. Existing partition policy must be reviewed at that owner,
   not replaced with a Group-size heuristic.

This is the next unresolved Render/engine handoff, not authorization for a new
renderer or a second canonical scene. Until the complete design and bounded proof
exist, the current project-render-hierarchy Inspector and production strategy
remain unchanged. A future accepted design must replace the old unconditional
Group-domain requirement in Preset docs, Inspector and tests together, not add
parallel compatibility behavior. No speedup number is promised for that design.

## Validation and limitations

- Seven matrix cases and two confirmation cases pass (plus an earlier standalone
  real-scene measurement). Policy, native handle identity, exact restored world
  matrices and source child order pass after every phase.
- Repeated same-policy screenshots are byte-identical. The six synthetic cohorts
  also compare baseline/candidate pixels exactly. Real-scene policy adoption has
  documented float32 edge differences from the earlier microscope test and is
  not relabeled bit-identical. New translated screenshots must differ, and their
  restored images must equal the corresponding baseline exactly.
- The real 101 confirmation overview was inspected and contains the complete
  tower and base. This is measurement evidence, not a new visual-closeout claim;
  earlier detail, history and production replay evidence remains applicable.
- Four new SDK characterization tests and four existing native partition tests
  pass. Passing these tests means the limitations were reproduced, not that the
  proposed product solution passed feasibility.
- Scoped ESLint, native test TypeScript and the 15-case naming gate pass. The
  standalone App type probe reports 16 existing test-utils errors and two existing
  declaration-resolution errors in ordinary Playwright configuration. No reported
  type error is in this task's new or modified benchmark/native test files.
- The initial recorded fixture trial incorrectly read x from raw element data
  instead of computed data; runtime validation rejected the non-finite input.
  The benchmark now reads the public computed x contract. That failed trial is
  excluded from accepted measurements. No runtime validation changed.
- Only tests and plan/report documents changed in this task. Existing dirty
  production changes and original AI report sessions/services were preserved.
  No full local suite, CI, release or live AI drawing was run.

## Reproduction and artifacts

Use existing project services at 3053/4253/4153:

```sh
APP_URL=http://127.0.0.1:3053 \
E2E_DOCUMENT_BACKEND_URL=http://127.0.0.1:4253 \
COLLABORATION_WS_PORT=4153 \
yarn workspace @asyra/asyra-design exec playwright test \
  --config playwright.grouping-local.config.ts \
  --output test-results/hierarchy-boundary-matrix --max-failures=1
```

Confirmation selects `--grep 'recorded|1000 Groups with 4 vector'` and the
`hierarchy-boundary-confirmation` output directory. The same local configuration
runs one worker and restores the official strategy before releasing each page.
Native verification runs only the new feasibility and existing partition files.

Raw samples and screenshots:
`apps/asyra-design/test-results/hierarchy-boundary-matrix/` and
`apps/asyra-design/test-results/hierarchy-boundary-confirmation/`.
The latter contains `summary.json` with medians, p95, counts and raw artifact paths.
Logs: `tmp/conversation-improvements/hierarchy-boundary-{matrix,confirmation,final-native}.log`.
The early standalone accepted run is retained in `hierarchy-boundary-recorded-2`;
the rejected input trial remains in `hierarchy-boundary-recorded`.

Source-stamped measurements precede a final guard-only lint correction replacing
non-null assertions with explicit missing-state errors. No benchmark workload or
production strategy changed in that correction. Local artifacts are untracked;
permanent tests and this report preserve the reproduction path and conclusions.


## Complete handoff follow-up

The approved four-phase experiment is complete as a feasibility investigation.
The retained-placement candidate is **rejected for production admission**.
Passing characterization tests proves the measured tradeoffs and limited
correctness cases; it does not mean the candidate meets the performance contract.
No production source, public contract, Inspector policy or installed Group
strategy changed in this follow-up. The earlier 46 ms real-scene saving remains
useful evidence; the additional 0.65 ms small-group CPU and 0.344 ms GPU costs
are separate absolute costs, not proof of a universal net slowdown.

### Phase 1 - Actual producer and read barriers

The new case in `hierarchy-projection-updates.spec.ts` uses the real App's
`hierarchyApis.groupElements`, not a synthetic transaction mock. It observes
three applied projection batches before one committed projection batch:

| Applied batch | First leaf local position | First leaf workspace position |
| --- | --- | --- |
| Group creation | (36, 64) | (36, 64) |
| Membership change | (36, 64) | (72, 128) |
| Coordinate compensation | (0, 0) | (36, 64) |

An immediate render/read barrier matches each accepted state. It must neither
wait for commit nor anticipate the later compensation. Final geometry, handles,
undo, redo and rollback after a read are preserved. The existing browser case
also passes child geometry/style edits, ordering, visibility and four remote
publications without echo. The saved trace includes fingerprints of the actual
Preset, subscription, Render store and event-bus producers. The isolated browser
probe checks these fingerprints and replays all four observed states (initial
plus three batches), verifying expected workspace coordinates.

This exposes a contract wording prerequisite for any future production design:
`project-render-hierarchy` describes committed hierarchy input, while the actual
accepted-batch subscription supports transaction-internal reads. Distinguish
accepted projection state from committed history/publication; do not introduce
a commit-only render queue. The existing installed policy is not reinterpreted
or changed by this experiment.

### Phase 2 - Retained placement and real parent changes

The engine-owned probe separates explicit two-parent logical membership from
native paint roots. Inputs include parent, local coordinates and membership order;
flush consumes currently accepted values. Stable drawable roots remain under a
render-owned parent in retained mode, so deleting the old logical parent cannot
destroy transferred content. This is a restricted, non-persisted test projection,
not a second editable SceneTree or a production implementation.

| Four roots, 4,000 leaves | Ordinary native hierarchy | Independent domains | Retained placement |
| --- | ---: | ---: | ---: |
| Destination membership calls on compensated move | 4,004 | 4 | 0 |
| Descendant local-transform calls on compensated move | 4,000 | 0 | 0 |
| Descendant local-transform calls on actual parent translation | 4,000 | 0 | 4,000 |

Classification touches four moved roots. Coordinate compensation, later leaf
edits, painter order, accepted inverse movement and old-parent deletion pass.
The native experiment's actual translation is decisive: retained placement loses
the installed independent-domain benefit. Reusing a Graphics context does not
retain the parent's transform domain or its prepared batch work.

### Phase 3 - Logical bounds and two capture candidates

Logical Group bounds use the same accepted membership and coordinate mapping.
Captures select only those roots; an overlapping magenta object outside the
logical Group remains in the live scene and is absent from the captured image.
Native handles and shared paint survive capture cleanup. Subsequent geometry
and fill edits appear in new captures. Byte comparisons cover both capture paths,
all three policies, and live-scene restoration.

1. **Shared-context assembly:** temporary Graphics borrow the existing prepared
   contexts and are released without destroying their live owners. This correctly
   captures the Group, but creates 4,004 temporary objects for every large-group
   capture, including a repeated unchanged capture. A cache would conceal neither
   the first materialization nor its invalidation/lifetime obligations.
2. **Direct root rendering:** render the existing roots with explicit Group-local
   transforms into a normal offscreen capture target. This creates no cloned
   Graphics, but the SDK's `AbstractRenderer.render` automatically calls
   `enableRenderGroup()` on each target. Restoring the ordinary retained policy
   afterwards registers 8,000 leaf memberships for the 4,000-leaf capture. Keeping
   those domains instead would silently change the measured steady policy.

The public extract path also promotes its target. The final benchmark records
and restores the chosen policy using public APIs and includes that restoration,
resource cleanup and the next live render in the measured operation. It asserts
policy identity in addition to pixel identity. No private SDK flags are patched.

The candidate therefore fails the requirement not to shift work to capture.
Text, masks, material meshes and arbitrary nested transforms are not certified;
there is no reason to expand the prototype into those families after these
necessary performance conditions have already failed.

### Phase 4 - Same-source browser cost

Two fixtures each contain 4,000 batchable rectangles: four large roots, or
1,000 roots with four leaves each. The operation transfers four roots. These are
small SDK feasibility fixtures, not the recorded 101 geometry and not its old
GPU draw-call baseline. Policy order is ordinary, independent, retained,
retained, independent, ordinary. Each block/phase has six warmups and 24 samples:
1,728 measured operations across 12 blocks and six phases.

Times below are median CPU-to-GPU-completion measurements in ms (`gl.finish`),
including query/capture construction, extraction, cleanup, policy restoration
and the next live render where applicable. They are not isolated GPU timer
measurements or display latency. Repeated capture timings exclude PNG encoding;
cold encoded samples are retained separately and are not used for conclusions.
Values recorded as zero are below timer resolution, not zero work.

| Four large roots | Ordinary | Independent domains | Retained placement |
| --- | ---: | ---: | ---: |
| Parent translation | 0.30 | <0.10 | 0.30 |
| Reparent | 0.70 | <0.10 | <0.10 |
| Reparent plus bounds | 1.00 | 0.20 | <0.10 |
| Reparent plus shared-context capture | 3.80 | 1.80 | 7.75 |
| Reparent plus direct-root capture | 3.60 | 1.70 | 4.60 |

For 1,000 tiny Groups, retained placement reduces ordinary redraw from 1.10 ms
for independent domains to below timer resolution in this simple fixture. Draws
are 1,001 versus 1 and matrix uploads 2,002 versus 2. However, only 16 leaves are
transferred/captured in this case: clone capture takes 1.10 ms and direct capture
3.00 ms, versus 3.50/3.40 ms for independent domains. This benefit does not cancel
the large-target capture regression or justify a size threshold.

The bounds result is useful: derived logical membership can make local queries
cheap without re-reading the entire scene. The failed conditions are preserving
transform work on actual motion and delivering arbitrary selected content to
Pixi without new capture work. There is no demonstrated public-SDK substitution
that satisfies both. Do not promote the candidate to the 25,491-leaf recorded
fixture or production while those conditions fail.

### Validation, review and retained evidence

- Thirteen focused native tests pass (five new handoff cases plus eight existing
  feasibility/partition cases). Their work-count assertions deliberately expose
  rejected candidate costs.
- Two real-App browser cases pass, including history, rollback and remote replay.
- One explicit local browser probe passes all 12 blocks, exact capture/live pixel
  checks, policy restoration, real producer replay and membership work assertions.
- Scoped ESLint, the new engine test modules' strict TypeScript probe and naming
  gate pass. The focused App type probe reports 29 diagnostics in six untouched
  dependency files, including `e2e/test-utils.ts` and ordinary Playwright config;
  none names the changed App test/helper/config. The ordinary App type command
  also reports unrelated AI/dependency diagnostics. Neither App type gate is
  represented as passing; no unrelated files were changed to clear it.
- Review corrected probe-only mistakes: Vite browser import/loading, selecting
  actual projection notifications rather than lifecycle/journal notifications,
  removing camera coordinates from the workspace oracle, explicit Bounds
  rectangle fields, and accounting for extraction's domain promotion. Early
  trial timings before policy restoration are superseded by the final run.
- The representative 4,000-leaf capture was inspected; formal image comparisons
  also cover the later red fill edit and excluded outside content. This is not
  visual acceptance of a new production renderer.
- No full-local suite, new AI drawing, dependency installation, commit or push.
  The probe's browser and temporary Vite listener are closed in `finally`.

Permanent tests and probes:

- `apps/asyra-design/e2e/hierarchy-projection-updates.spec.ts`
- `apps/asyra-design/e2e/hierarchy-handoff-probe.ts`
- `packages/render-engine-pixi/src/__tests__/retained-hierarchy-handoff.test.ts`
- `packages/render-engine-pixi/src/__tests__/retained-hierarchy-probe.ts`
- `packages/render-engine-pixi/src/__tests__/retained-hierarchy-browser.test.ts`
- `packages/render-engine-pixi/src/__tests__/retained-hierarchy-browser-probe.ts`

Local evidence: `tmp/conversation-improvements/retained-hierarchy/measurement.json`
contains source fingerprints, producer replay, samples, image digests and work
counts; `summary.json` aggregates medians. PNGs are beside it. The real App trace
is `apps/asyra-design/test-results/hierarchy-handoff/` under the immediate-read
case. Run that focused case before the browser probe; stale producer fingerprints
reject replay. The explicit browser command is
`HIERARCHY_PROBE_BROWSER=1 yarn workspace @asyra/render-engine-pixi exec vitest run src/__tests__/retained-hierarchy-browser.test.ts`.

Decision: retain the current production strategy. The four-phase investigation
is complete, but the proposed replacement is not feasible under the accepted
cost conditions. Any next design must resolve both transform-domain retention
and logical-subset extraction before production admission; do not add a cache,
threshold, permanent capture promotion or compatibility route to mask either.
