# Group Render Domain - Small-Group Benchmark

November 10, 2026. Scope: measure the existing Group render-domain change; no
production optimization rule or production implementation changed in this task.

## Decision

Performance acceptance is reopened. Independent render domains reduce work when
moving populated Groups, but applying them to every Group makes ordinary frames
more expensive in the many-small-group case. The 1,000-Group vector result was
reproduced independently. Unchanged draw-call counts do not establish unchanged
frame cost: measured matrix uploads increase from 2 to 2,000 per frame.

Earlier correctness and large-subtree work-count proofs remain valid. They do
not establish that the rendering policy is a general performance improvement.
The next design must preserve those correctness checks and demonstrate both
reparent benefits and steady-frame cost. This report does not introduce a group
size threshold, new batching rule, or compatibility path.

## Controlled comparison

- Both modes run on the current source with identical Core, Preset hierarchy,
  UI projection and region-query changes. Only the official Group render strategy
  and existing Group transform-domain flags differ. This isolates that rendering
  decision; it is not a checkout-to-checkout comparison of the entire change set.
- The baseline strategy clears Group graphics and assigns x/y. The candidate also
  sets `transformGroup = true`. A test-local public-registry probe selects the
  strategy outside timed intervals and restores the official strategy afterward.
  Every phase verifies the selected policy on all Group nodes.
- Each scene has 4,000 visible 6-by-6 shapes, on an 80-column grid with 8-pixel
  spacing. Compare 20 Groups of 200, 200 Groups of 20, and 1,000 Groups of 4.
  Rectangle and production-prepared closed-vector cohorts are separate.
- Modes run in ABBA order: baseline, candidate, candidate, baseline. Each block
  and phase has 8 warmup frames, 30 uninstrumented CPU samples, 2 separately
  instrumented work-count frames and 10 separate GPU-timer samples. Each table
  cell aggregates 60 CPU or 20 GPU samples per mode and phase.
- Redraw explicitly requests a complete canvas frame without editing geometry.
  Pan alternates a two-pixel camera offset. Reparent moves four existing Group
  roots through the production hierarchy API, then restores them and their order.
  The moved descendant counts are 800, 80 and 16 respectively. Compare A/B within
  each row; the reparent workloads differ between rows.
- CPU render time measures synchronous render preparation/submission. Mutation
  time measures the production move API separately. Completion time spans mutation
  through rendering and a `gl.finish()` completion barrier, after draining previous
  work. It is a controlled serial measurement, not interactive input latency.
- GPU time uses `EXT_disjoint_timer_query_webgl2` around render submission in
  separate samples. All 840 GPU samples across seven runs were available, positive
  and free of disjoint/timeout events. CPU and GPU medians must not be added.
- Draw counts wrap actual WebGL draw entry points. Matrix counts wrap
  `uniformMatrix3fv`. These hooks are absent during CPU and GPU timing samples.
- Environment: Apple M3 Max, ANGLE Metal hardware backend, Chrome 157.0.8103.40,
  WebGL2, viewport/canvas 1280 by 720, DPR 1. The visible viewport screenshot is
  800 by 680. This is not SwiftShader. The document is not cross-origin isolated;
  CPU resolution is approximately 0.1 ms, so small differences require caution.

## Ordinary full-canvas redraw

All times below are medians in milliseconds, baseline to candidate. p95 is shown
for redraw CPU to expose its distribution. Draw calls and matrix uploads are per
frame. Rectangle and vector strategies have different batching contracts.

| Primitive | Groups x children | Draw calls | Matrix uploads | CPU render | CPU p95 | GPU render |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| rect | 20 x 200 | 4000 -> 4000 | 4002 -> 4040 | 4.45 -> 4.70 | 6.20 -> 6.20 | 0.806 -> 0.995 |
| rect | 200 x 20 | 4000 -> 4000 | 4002 -> 4400 | 4.30 -> 5.05 | 5.90 -> 6.40 | 1.157 -> 0.861 |
| rect | 1000 x 4 | 4000 -> 4000 | 4002 -> 6000 | 4.40 -> 5.50 | 6.20 -> 7.50 | 0.795 -> 0.762 |
| vector | 20 x 200 | 20 -> 20 | 2 -> 40 | 0.30 -> 0.80 | 0.60 -> 1.00 | 0.177 -> 0.210 |
| vector | 200 x 20 | 200 -> 200 | 2 -> 400 | 0.60 -> 0.60 | 0.90 -> 1.00 | 0.174 -> 0.266 |
| vector | 1000 x 4 | 1000 -> 1000 | 2 -> 2000 | 1.80 -> 2.50 | 2.80 -> 2.80 | 0.187 -> 0.573 |

The 1,000-vector scene increases redraw CPU from 1.80 to 2.50 ms (39%) and GPU
from 0.187 to 0.573 ms (about 3.1 times). The 1,000-rectangle scene increases CPU
from 4.40 to 5.50 ms (25%), while GPU time does not increase in that sample.
GPU timings in the other rectangle cases vary in direction; this is not evidence
that every render domain always raises GPU time. The repeatable vector result
and exact state-change counts establish the small-group risk without that claim.

## Pan and reparent

| Primitive | Groups | Pan CPU render | Pan GPU | Move API | Reparent CPU render | Move through GPU completion | Reparent GPU |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| rect | 20 | 4.55 -> 5.15 | 0.806 -> 0.853 | 2.00 -> 2.00 | 4.40 -> 4.10 | 6.45 -> 6.10 | 0.791 -> 0.827 |
| rect | 200 | 5.60 -> 4.80 | 0.861 -> 0.837 | 10.20 -> 9.50 | 4.40 -> 4.10 | 14.70 -> 13.65 | 0.786 -> 0.784 |
| rect | 1000 | 4.85 -> 5.50 | 0.838 -> 0.767 | 19.45 -> 19.10 | 4.40 -> 5.10 | 23.85 -> 24.25 | 0.670 -> 0.666 |
| vector | 20 | 0.30 -> 0.70 | 0.162 -> 0.246 | 2.50 -> 2.40 | 2.60 -> 0.20 | 5.00 -> 2.60 | 0.157 -> 0.184 |
| vector | 200 | 0.60 -> 0.50 | 0.168 -> 0.283 | 9.90 -> 9.30 | 2.80 -> 0.50 | 12.70 -> 9.90 | 0.166 -> 0.266 |
| vector | 1000 | 1.85 -> 2.60 | 0.239 -> 0.592 | 20.55 -> 21.55 | 3.10 -> 2.70 | 23.60 -> 24.20 | 0.217 -> 0.556 |

The 20-Group vector case retains a meaningful reparent benefit: moving four
populated Groups reduces render preparation/submission from 2.60 to 0.20 ms and
completion from 5.00 to 2.60 ms. The 1,000-Group case has little descendant work
to save: its total completion changes from 23.60 to 24.20 ms. The larger move-API
cost in that fixture is shared by both policies and is not a new render-policy
regression diagnosis. It was measured separately instead of attributed to GPU
rendering. Differences of a few tenths of a millisecond in total move cost are
not a stable improvement claim.

## Independent confirmation - 1,000 vector Groups

A separate browser-test invocation repeats the same ABBA fixture and methods.

| Phase | CPU render | GPU render | Move through GPU completion |
| --- | ---: | ---: | ---: |
| redraw | 1.90 -> 2.70 | 0.223 -> 0.598 | 1.90 -> 2.70 |
| pan | 1.90 -> 2.70 | 0.206 -> 0.407 | 2.00 -> 2.80 |
| reparent | 3.25 -> 2.70 | 0.170 -> 0.407 | 24.85 -> 24.65 |

Draw calls remain 1,000 and matrix uploads remain 2 versus 2,000. Baseline redraw
CPU block medians are 1.60/1.90 ms; candidate block medians are 2.90/2.45 ms.
The steady-frame slowdown survives the independent repeat and reversed block
order. Total reparent completion is slightly lower in the repeat, unlike the
primary run; there is no stable total reparent win for these small Groups.

## Why unchanged draw calls can still be slower

The current Group strategy enables `graphic.transformGroup`; the Pixi adapter
maps it to native `isRenderGroup`. Native `RenderGroupPipe._executeDirect` pushes
the group's world matrix/color into global uniforms, executes its instruction
set and pops the state. `GlobalUniformSystem.bind` updates projection and world
matrices. More independent groups therefore introduce more state transitions.
The measured matrix calls track that ownership change exactly for vectors:
2 calls with the shared domain versus 2 calls per independent Group.

An unchanged transform does not imply that its GPU uniform can simply be skipped:
the previous group's draw may have installed another matrix. The measurements
identify recurring domain/state overhead; they do not authorize bypassing valid
state updates or introduce a new cache policy.

The baseline already has batching boundaries. Engine-neutral graphics default
to `batched = false`; empty Group graphics retain that setting. The adapter maps
it to `context.batchMode = 'no-batch'`. Pixi `GraphicsPipe.addRenderable` breaks
the batch for such graphics, even when the subsequent execute path returns
because the graphics have no GPU batches. Thus these baseline vector scenes
already produce one batch/draw per Group. Creating independent render domains
does not further increase draw counts in this fixture. Rectangles are themselves
unbatched here, explaining their 4,000 draws. Vectors explicitly enable batching.

Relevant current code:

- `packages/preset/src/components/group.ts` - official Group render policy.
- `packages/render-engine-pixi/src/pixi-render-engine.ts` - transform-domain and
  graphics batching adapters.
- `packages/render/src/types/render-object.ts` - graphics batching default.
- `packages/preset/src/components/vector.ts` and `rectangle.ts` - shape strategies.
- Installed Pixi `lib/scene/container/RenderGroupPipe.mjs`,
  `lib/rendering/renderers/shared/renderTarget/GlobalUniformSystem.mjs`, and
  `lib/scene/graphics/shared/GraphicsPipe.mjs` - actual native execution path.

## Correctness, gates and limits

Seven focused browser runs pass their measurement-integrity assertions: six
matrix cases and one independent confirmation. Every phase preserves all 4,000
native leaf handles, exact world matrices, Group policy and restored child order.
All four ABBA screenshots per scene are byte-identical. The vector screenshot
was also inspected and contains the complete visible grid. This is separate from
performance acceptance, which fails for ordinary many-small-group frames.

The earlier full recorded-scene, edited-child, ordering, undo/redo and production
remote-publication tests remain the correctness evidence for those behaviors;
this measurement task does not repeat or replace them. No production source was
edited, and no new AI drawing, full-local suite, release gate or dependency
installation was performed. Existing report sessions/services were preserved.

Scoped ESLint passes for the new benchmark, helper and local configuration; the
formal naming gate passes all 15 checks. Scoped diff/new-file whitespace review
also passes.

The standalone focused type probe reports only the same 16 existing errors in
`e2e/test-utils.ts`, with none in the new benchmark, helper or configuration.
They were not repaired as unrelated work. Baseline setup errors and an initial
vector fixture with reused reserved topology IDs were corrected before accepted
measurements; those rejected runs are not included in the tables. No production
validation was weakened.

These are warmed local browser measurements for solid geometry on one hardware
backend. They do not quantify DOM/compositor cost, idle power, every material or
mask, other GPUs, or production-build performance. Forced completion serializes
work and is not a frame-rate claim. The observed recurring slowdown is sufficient
to reopen acceptance; selecting a replacement policy requires a separate bounded
design rather than a guessed threshold.

## Reproduction and evidence

Permanent test: `apps/asyra-design/e2e/hierarchy-small-groups.local.spec.ts`.
Test-local policy/geometry helper: `e2e/group-render-policy-probe.ts`.
Local-only configuration: `playwright.grouping-local.config.ts`.

```sh
APP_URL=http://127.0.0.1:3053 \
E2E_DOCUMENT_BACKEND_URL=http://127.0.0.1:4253 \
COLLABORATION_WS_PORT=4153 \
yarn workspace @asyra/asyra-design exec playwright test \
  --config playwright.grouping-local.config.ts --max-failures=1
```

The confirmation adds `--grep 'measures 1000 Groups with 4 vector'` and
`--output test-results/hierarchy-small-groups-confirmation`. Existing services
were reused; the configuration is deliberately local-only and has no performance
pass threshold.

Raw CPU/GPU samples, exact strategy sources, environment and work counters are in
`apps/asyra-design/test-results/hierarchy-small-groups/*/measurement.json` and the
matching confirmation directory. Four `block-*.png` images accompany each file.
`hierarchy-small-groups/summary.json` contains median, p95, range and sample counts.
Logs are `tmp/conversation-improvements/grouping-small-groups-results.log` and
`grouping-small-groups-confirmation.log`. These local artifacts are not tracked;
the permanent test and this report preserve reproduction and measured conclusions.
