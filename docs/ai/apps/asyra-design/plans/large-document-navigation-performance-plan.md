# Large Document Navigation Performance

## Status and authorization

Implementation authorized on 2026-10-06 in the isolated performance worktree.
The user accepted the candidate's navigation speed on 2026-10-06 after testing
the corrected review URL. Resume complete applicable local CI; push is explicitly
authorized only after all required local checks pass. Merge is not authorized.
Requested 2026-10-06 after the full Taipei 101 drawing completed successfully.
AI Panel execution improvements remain deferred until navigation performance
is accepted. The earlier review mismatch has been resolved and candidate speed
is now accepted; final validation and delivery remain pending.

Planning base: `b715eced2` on `codex/design-large-document-performance`.
The preserved live session ran `9a0d8742e38929ae3cd9e164c5622c7c19a9af1c`
in the separate `ai-tool-definition-delivery` worktree.

### Bounded task contract

The current task may capture the editable document, profile an isolated replay,
and implement the scoped owner corrections and permanent tests below. It may
not restart or reset the user's app or change its document. The latest user
authorization permits pushing the validated feature branch.

The approved implementation scope is the existing
2D navigation/render path: camera transforms, retained geometry/materials,
render submissions, interaction queries, and their direct invalidation and
lifecycle owners. Framework changes must stay engine-neutral above the Pixi
adapter. Formal tests and current contracts for those owners are in scope.

Preserve canonical geometry, IDs, shared properties, hierarchy, painter order,
fill/stroke semantics, resolution, editability, Undo/Redo and collaboration.
Exclude AI orchestration, model settings, reference retrieval, lower-resolution
interaction modes, visible-detail omission, flattened document replacement,
and unrelated package cleanup. New dependencies still require approval.

The user explicitly welcomes discussing a necessary data-format change.
The current proposal preserves persisted and wire formats: render resource
sharing is derived state and does not by itself require canonical format
changes. If profiling or semantic proofs establish that those formats prevent
the required improvement, present the concrete limitation, before/after data
example, existing-document migration, shared-reference behavior, Undo/Redo and
CRDT compatibility, plus the alternative that retains the format. Discuss and
obtain direction before including a format migration in implementation scope.

Discovery covers those owner paths, actual saved data, existing tests and
installed Pixi code. After approval, narrow profiling may resolve the listed
candidates; it does not authorize an open-ended repository audit.

## Preserved reproduction

Backup directory: `backups/taipei-101-full-2026-10-06/` in the main repository.
The original `my-design` document remains on the existing local site.

- `Taipei-101-full-document.zip`: 20,802,406 bytes; includes native
  `document.json`, exact bootstrap response, durable backend record, manifest,
  offline reference checks, and recovery instructions.
- ZIP SHA-256:
  `e71192d9f90762ade11e359ad8ab5d2d16e42c58e61ed61873520b9786333805`.
- Bootstrap SHA-256:
  `e70e403ccf7c1509e31efe052106526e7ceec199e8d24d4418fbee28e491cdb7`.
- Two bootstrap reads agreed; backend checkpoint matched at durable sequence
  586, generation 0. ZIP CRC and reopened document equality passed.
- Checked element/property/geometry references have no dangling targets;
  no external or embedded image assets were found. Conversation history and
  camera/selection are not claimed as document backup contents.

| Actual document                       |           Count |
| ------------------------------------- | --------------: |
| Elements excluding workspace          |          18,287 |
| Vector elements                       |          18,278 |
| Groups / Frames                       |           8 / 1 |
| Property records                      |         381,294 |
| Vector points / segments              | 85,056 / 85,056 |
| Largest direct-child container        |           8,264 |
| Fill records                          |          10,089 |
| Gradient fill records                 |           4,013 |
| Vectors referencing a gradient fill   |           8,107 |
| Distinct gradient values excluding ID |              30 |

Use this immutable drawing for comparisons; do not regenerate it through AI.
Replay only into an isolated document and independent service storage through
the canonical bootstrap/load route. Never point test Reset or an import at
`my-design`, or replace its backend record. Verify identity and reference
counts after replay. Before implementation tests, establish a permanent,
ZIP and a loader under the applicable repository fixture policy. The duplicate
compressed replay file is local-only and recreated from the ZIP; CI must not
depend on a developer's absolute backup path.

## Evidence and limits

These are source/document findings, not a live flamegraph or measured GPU
residency. No FPS improvement or bottleneck percentage has been established.

| Owner and current behavior                                                              | Meaning for this task                                                                                                                                    |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `render.ts` already coalesces dirty work and renders on demand                          | Do not add a competing render loop or assume idle redraw is the problem.                                                                                 |
| Contents Panel already virtualizes rows and uses fine-grained subscriptions             | 18,287 objects do not imply 18,287 mounted DOM rows. Check actual update work before changing UI.                                                        |
| Pan/zoom updates system camera properties through Core; it does not edit scene geometry | Keep camera changes off canonical document/Undo/CRDT paths. Measure geometry work rather than assuming it repeats.                                       |
| Vector strategy sets `batched=false`; engine maps it to `no-batch`                      | Thousands of independent graphics submissions are plausible. Blindly enabling batching can reintroduce repeated vertex packing/uploads.                  |
| Viewport is a nested container without a separate render group                          | Installed Pixi transform traversal can visit descendants when that container changes. A camera transform domain is a strong candidate.                   |
| Engine initializes default Pixi events; rendered targets are interactive                | Global move collection and wheel hit tests may duplicate work already owned by framework input. Consumer coverage must decide which work can be removed. |
| No current offscreen spatial selection was found in the inspected render path           | Detail zoom may still submit offscreen work. Culling alone cannot solve a full-building view where everything is visible.                                |

### Gradient resource finding

In `packages/preset/src/components/vector.ts`, the gradient branch uses
`core.createEvenOddFillStyle` and retains a raster fill per graphic. The raster
includes both the shape coverage and its color. Shared fill data therefore
does not automatically share the resulting shape-specific texture.

Applying the existing raster dimension formula in
`packages/render/src/fills/even-odd-fill.ts` to the saved dimensions of all
8,107 gradient vectors gives **1,025,384,465 pixels**, or **4,101,537,860 RGBA
bytes** (about 4.10 GB). This assumes each vector materializes that resource;
it is not a measurement of resident browser/GPU memory, texture upload bytes,
or peak allocation. Measure creation, residency proxies, release and uploads
separately before attributing lag to it. All saved gradient records are linear;
4,012 have three stops and one has four.

The repository already has `createRenderGradientFillStyle`, an engine-neutral
`gradient` resource, and Pixi `FillGradient` in `pixi-resources.ts`. The vector
gradient branch takes the raster route instead. Reuse those semantic owners;
do not add a Design-specific fill API or expose Pixi through Core.

Thirty distinct gradient descriptions suggest material reuse, **not** proof
that 8,107 complete raster textures can be replaced by 30 identical textures.
Coverage, bounds and local gradient mapping differ between shapes.

## Proposed architecture

1. DOM input enters the existing feature and system camera APIs.
2. Render updates the camera transform and camera-dependent overlays once per
   demanded frame. Ordered input deltas remain intact; event coalescing must
   not drop movement or change zoom anchoring.
3. Retained geometry and material resources survive camera-only changes.
   The engine applies a viewport transform without repacking every vertex.
4. Visible candidate selection operates on workspace-space bounds. The engine
   draws the required candidates in canonical painter order.
5. Pointer queries narrow candidates before exact shape hit testing, then
   return the same normalized target/handle to the existing feature boundary.
6. Document changes invalidate only affected derived resources and bounds.
   Load, shared-property edits, Undo/Redo and CRDT use the same invalidation
   rules. Render never becomes the authoritative document owner.

### A. Separate material from shape coverage

Preferred direction: retain correct vector coverage and apply native material
resources, rather than baking a large transparent rectangle for every vector.
Start with the existing linear-gradient descriptor and `FillGradient` adapter.
Use current path/fill topology utilities; do not replace hole handling with a
naive polygon or triangulation shortcut.

Prove parity for even-odd/nonzero rules, holes, nested contours,
self-intersections, curves, overlapping translucent fills, duplicate/close
color stops, opacity, local coordinates, transformed bounds and strokes.
Pixi's native gradient uses an internal texture: a default texture size is
not proof of color precision. Validate color interpolation and sharp stop
transitions at source-space scale. If it cannot represent the contract,
evaluate exact material evaluation behind the existing engine abstraction;
do not hide the mismatch with a lower-quality preview or fixture exception.

Resource reuse belongs to the render/engine resource lifetime. Keys must
include the actual color/alpha/stops, interpolation and coordinate semantics;
per-object transforms remain separate where the engine permits. Do not hash
the full scene per frame. Release after the final user of a resource, preserve
other users on deletion, and prevent accidental mutation of shared resources.
Canonical fill IDs and user editing behavior stay unchanged.

### B. Camera transform domain and stable render submissions

Represent the viewport's transform domain through the abstract engine contract;
map it to Pixi Render Groups inside `@asyra/render-engine-pixi`. Keep screen
overlays outside that domain. Do not move the entire application stage or
make each authored Group a renderer group.

Then compare current independent graphics against compatible retained batches.
Keep painter order, transparency and clip boundaries. Share `GraphicsContext`
only when geometry **and** style semantics match; equal fill colors alone are
insufficient. Separate public element identity/hit targets from GPU submission
grouping. Avoid a single giant graphics object that must rebuild on any edit.

Gate batching on vertex packing/upload counts during both camera movement
and incremental document edits. Repeated full-scene packing is a regression,
even if a single static screenshot looks fast. Camera isolation and material
reuse must be assessed together with batching, not shipped as unrelated flags.

### C. Input queries and offscreen work

First establish consumers of Pixi wheel/global-move events versus the framework
input system. Disable only redundant engine event work after pointer routing,
hover transitions, capture, cancellation and custom interaction registrations
are covered. Preserve existing public hit-test behavior.

Use conservative workspace-space bounds for spatial candidates where measured
traversal justifies an index. Index ownership follows the render/engine boundary:
framework eligibility and IDs stay in Render; concrete Pixi hit implementation
stays in the adapter. Culling and broad-phase queries should reuse the same
valid bounds where possible. Geometry/stroke/parent changes update affected
entries; camera changes query the index without rebuilding it. Include stroke,
antialias extent and clips so objects do not disappear at viewport edges.

Never use the document's eight large Groups as the only spatial partitions.
Nearby queries should scale with candidates; full-fit and overlapping scenes
can legitimately have many candidates. No visible detail may be discarded.

### D. Overlay and UI work, only where measured

Selection overlay signatures currently inspect selected geometry; some bounds
and world transforms are recomputed on access. Profile selection modes and
reuse topology/bounds at their actual invalidation owner if repeated work is
confirmed. Do not claim every selected Group traverses all children: graphics
and container bounds implementations differ.

Keep existing Contents virtualization and fine-grained subscriptions. Measure
publications and mounted-row updates during camera-only navigation. Inspect
actual system snapshot payloads before optimizing cloning; canonical property
record count is not the system snapshot size. No `React.memo` workaround or
second app-level derived document cache.

## Implementation sequence

### Active step - baseline proof

Owner route: Render `handoff-engine-commands`; product sections: preserved
reproduction, evidence limits, and integrated acceptance in this plan. Inputs:
the immutable native document and camera intents through the public Core APIs.
Outputs: ordinary engine frames plus diagnostic work/timing evidence. Existing
dirty-frame bypass and command order remain unchanged. Contributors: formal
E2E harness, canonical bootstrap, Render diagnostic facade and browser profiler.
Forbidden: live-user state mutation, fallback geometry, runtime branching on
fixture identity, and instrumentation as product state. Boundary:
`apps/asyra-design/e2e/large-document-navigation.spec.ts` and its immutable
fixture; Render delta Inspector test-boundary admission only. Failure belongs
to the test or the existing handoff owner, according to the actual failure.
Gates: fixture digest, isolated document identity, baseline work counts, input
completion and screenshots. No production edit until measured evidence and
reviewed target contracts identify the owner correction.

### 1. Reproduce and freeze the measured baseline

Load the preserved drawing into an isolated, headless test session. Reuse
existing diagnostic counters, browser tracing and `render-profile.mjs`.
Identify GPU backend, viewport, DPR, machine, browser and warm/cold state.
Do not mix test-runner/Codex CPU with app work.

Record full-fit, detail zoom and mostly offscreen views; idle, pan and anchored
zoom; pointer over empty canvas versus artwork; no selection, Group selection,
multi-selection and vector edit mode. Include rapid direction reversal and
release. Keep AI Panel visible as in the user's reproduction, then isolate
its contribution without changing the saved drawing.

Measure input-to-present latency and frame p50/p95/max; CPU call stacks;
geometry builds, vertex packs/uploads, render submissions, transform visits,
gradient/raster resource counts and bytes, hit candidates/exact tests,
overlay work, UI publications and renders. Record texture size estimates
separately from measurable allocations; unavailable GPU timings are explicit.

Produce formal failing work-count/behavior cases before production fixes.
Current small viewport tests and single dense-vector tests do not establish
navigation behavior for 18,278 separate vectors. Use this baseline to choose
the confirmed paths in A-D; do not execute speculative refactors merely
because they appear in the plan.

### 2. Admit the exact owner contracts, then implement the combined design

#### Camera contract and current execution card

Baseline isolated replay passed with 18,287 elements, no document changes or
publications. The sampled navigation profile includes explicit before/after
save calls; their serialization cost is excluded from navigation attribution.
GPU submission calls dominate navigation samples (uniform matrix, VAO binding
and draw calls); descendant transform work is also present.

Owner: `orchestrate-render-adapter`. Render marks only its viewport container
as an independent transform domain using the optional, engine-neutral
`transformGroup` object property. This is a non-persisted optimization hint;
an engine may ignore it without changing output. It does not change authored
Group semantics, parent order, coordinates or overlay registration. The Pixi
owner translates the hint to its Render Group mechanism. Normal containers
remain ungrouped. No new geometry cache belongs to this step.

Inputs/outputs/contributors remain the engine-boundary Inspector contract.
Files: Render viewport layer, RenderNode property projection and their formal
tests; the subsequent engine step owns Pixi mapping and its own tests.
Cases/gates: viewport hint survives attachment, camera commands contain no
geometry work, overlays remain outside the camera domain, custom engines can
ignore the hint, and ordinary coordinate queries remain equivalent. Stop on
any changed document, interaction target or screen-space overlay behavior.

Update the thin product contract and exact Inspector routes for confirmed
changes before their implementation slices. Existing authorities:

- `tools/flow-inspector/inspectors/render-engine-boundary-flow-inspector.data.cjs`:
  `orchestrate-render-adapter`, `define-render-engine-contract`,
  `execute-render-engine`, `bridge-render-interaction`, and cleanup.
- `tools/flow-inspector/inspectors/render-delta-update-flow-inspector.data.cjs`:
  `execute-render-strategy` and `handoff-engine-commands`.

The current delta contract explicitly admits no new geometry cache and uses
existing engine commands. This proposal does **not** silently override it.
Any measured need for new reuse/commands requires a scoped contract amendment,
including key, lifetime, invalidation, failure owner and custom-engine behavior.
Scene Tree reads inside strategy execution remain forbidden. Canonical delta
projection and ordered delivery remain intact.

Implement material/coverage ownership and the camera/submission path as one
coherent target design, with focused proofs between owner steps. Add event and
spatial changes only for confirmed residual work. Avoid repeated full app/AI
runs after each local edit. If a semantic mismatch prevents the proposed
native route, revise the bounded design before layering on patches.

### 3. Integrated acceptance

#### Engine mapping execution card

Predecessor: camera projection tests passed (23 tests); naming gate passed.
Owner `execute-render-engine` consumes the ordinary object property command
and maps the transform-domain hint, preserving all other object behavior.
Boundary: `packages/render-engine-pixi/src/**` and its package documentation.
Inputs, output handles, contributors, bypasses and failure owner are unchanged
from the reviewed engine-boundary Inspector. The engine may retain its native
instruction data for the live container, released by normal object destruction.
Focused proof: false by default, true only on requested container, reversible
update, retained child identity/order, and the existing engine contract suite.
Whole-document work and image parity remain integration gates, not mock claims.

- Same exact drawing, camera sequences and environment before/after; report
  work counts plus latency distributions, not a hardware-independent FPS
  promise. Camera-only changes must not rebuild fill geometry/materials,
  create document commits, or emit canonical collaboration updates.
- Inspect full-frame output and source-space crops at window edges, projecting
  tiers, small ornaments, gradients and transparency boundaries. Include the
  general fill/stroke oracles absent from this particular building.
- Exercise selection/hit ordering, pan/zoom anchoring, moving/resizing/rotating
  an element and a multi-selection, shared fill edits, reorder, delete,
  Undo/Redo, and incoming collaboration changes while navigating.
- Repeated load/unload and edit/delete cycles must release owned resources;
  no unbounded material/context/index growth or stale targets. Replay verifies
  canonical document equality; viewport movement preserves the baseline hash.
- Run applicable owner tests, boundary/custom-engine contracts, Design E2E,
  lint/build and scoped local validation. Run the existing 7,076-element
  publication/performance gate once at the integrated milestone to catch
  regressions in incremental drawing; preserve its formal guards.
- User reviews the original full-document interaction and visual result before
  general performance is accepted and AI workflow work resumes.

## Self-review and stop conditions

The first candidate list emphasized events and batching. Actual document
analysis exposed the much larger gradient raster footprint, so material and
coverage ownership is now central. Existing native gradient and shared-context
facilities make this a feasible architectural direction without replacing the
framework or flattening the drawing.

Rejected shortcuts: indiscriminately enabling batching; per-element render
groups; whole-canvas bitmap caching; lower-resolution drag previews; only
culling; and rebuilding already virtualized UI. The deferred
`vector-gradient-move-120fps-plan.md` proposes reduced drag raster quality and
does not govern this task; it remains inactive.

Confidence is high enough to review this plan's direction, not to promise a
single implementation attempt or a specific speedup. Live cost attribution and
complex gradient parity remain explicit first gates. If the baseline points
outside the stated owners, or faithful output cannot be preserved inside this
design, stop and revise the plan within authorized scope before coding more.

Current handoff: implementation authorized and completed in the isolated
`codex/design-large-document-performance` worktree. Local CI and final bounded
review are required before user inspection. No remote push is authorized.

## Primary research

Reviewed 2026-10-06 against installed Pixi 8.20.1 source as well as official
documentation. These are capability references, not measured Asyra results.

- <a href="https://pixijs.com/8.x/guides/components/scene-objects/graphics/graphics-fill" target="_blank" rel="noopener noreferrer">Graphics Fill</a> - native solid and gradient fill semantics.
- <a href="https://pixijs.com/8.x/guides/components/scene-objects/graphics" target="_blank" rel="noopener noreferrer">Graphics and GraphicsContext</a> - reusable geometry/style commands; shared lifetime and hole limitations.
- <a href="https://pixijs.com/8.x/guides/concepts/render-groups" target="_blank" rel="noopener noreferrer">Render Groups</a> - isolate stable world transforms; avoid excessive grouping.
- <a href="https://pixijs.com/8.x/guides/components/events" target="_blank" rel="noopener noreferrer">Events</a> - interaction modes and event traversal.
- <a href="https://pixijs.com/8.x/guides/concepts/scene-graph" target="_blank" rel="noopener noreferrer">Scene Graph</a> - transforms and explicit culling behavior.

## Native material execution card

Owner: `execute-render-strategy`, Preset registered vector strategy. Inputs
remain complete RenderElementData; output is equivalent engine-neutral fill
commands. The initial admitted native domain is one closed convex linear path
with opaque linear gradient stops, distinct well-separated stops and nonzero
handle extent. A polygon must have consistent turns and total winding of one;
star/self-crossing paths are excluded. Coverage is the original polygon, and
local gradient coordinates use the same complete bounds. Other gradients and
compound/curved coverage continue through their existing canonical raster
implementation; no lower-quality output or approximate geometry is introduced.

The restriction prevents changing undefined/degenerate, translucent-stop,
sharp-transition, hole and self-intersection semantics while using existing
native gradient support for the proven domain. This slice introduces no
geometry cache or document schema. Formal tests cover eligible work elimination,
star/concave/curved/compound exclusions, source immutability and fresh rerender
on material edits. Browser source-space color and silhouette parity is required
before closure. Engine resource sharing is a subsequent owner slice.

## Material resource lifetime execution card

Predecessor: native material strategy and existing vector/fill focused suites
passed (36 tests). Owner `execute-render-engine` receives immutable semantic
resource descriptors and returns distinct opaque resource handles. Identical
supported gradient descriptor values share the concrete gradient within one
engine lifetime. Key includes every material/coordinate input; unsupported
color objects are not interned. A handle leases the resource; final release
removes the entry and destroys it. Raster patterns and textures are not interned.
No scene or canonical property identity enters the key. Profiling/fixture proof:
8,107 shape-specific raster users but 30 gradient values; native material reuse
reduces texture/state switching without sharing shape coverage.

Boundary: Pixi resource adapter/engine and formal tests/package docs. Gates:
equal descriptors build once, edits isolate, early deletion retains other
users, final deletion frees, engine replacement isolates and destroy releases.
Stop if a descriptor field cannot be included without semantic ambiguity.

## Retained submission execution card

The browser regression proves plain auto-batching under an isolated camera
uploads zero vertex bytes during camera movement, but editing one of 1,024
rectangles uploads the entire 110,592-byte batch. This invalidates shipping
only the batching flag. Owner `execute-render-engine` must bound retained
submissions by small ordered native partitions, independent of authored Groups.
Only large ordinary containers need partitions; small parents and Graphics/Mesh
children keep their current hierarchy. Partition transforms are identity; order,
world/local coordinates, hit handles and resource ownership remain unchanged.
Each partition contains at most 128 logical children. Insertion/reorder may
split a partition; deleting a child does not shift every later partition.
Normal object destruction releases internal partitions without destroying
other owned logical children. The camera domain surrounds these partitions.

Inputs remain ordered engine hierarchy commands; outputs remain the same
opaque objects and surface. Internal partition state belongs to each live
engine/parent, never the canonical document. The exact bounds are an internal
work policy, not a document format or public Group meaning. Tests cover order,
reparent, range errors, transforms, cleanup and actual WebGL upload counts.
After engine proof, the strategy owner requests ordinary auto-batching for
vectors; Pixi keeps incompatible/complex graphics unbatched. The full document,
progressive draws and the existing 7076 gate are required integration checks.

Engine slice review: 31 formal unit/contract tests passed. The actual browser
regression now passes all camera and local-edit upload bounds; before the
partition implementation it failed with a complete 110,592-byte re-upload.
The following strategy-only slice enables native auto-batching for vector
commands. It uses the same strategy inputs and preserves its geometry, source
bounds, paints, strokes and direct transform invalidation. Formal strategy
regression first failed on the forced `batched=false` flag. Integration must
still prove the unchanged document and actual surface; no timing claim follows
from the flag or mock mapping alone.

## Integrated verification - 2026-10-06

The exact saved 18,287-element document reopens on the isolated App at
`http://127.0.0.1:3300`. The original user site on port 3000 and original backup
remain untouched. `final-visual` contains full-fit images and source-scale
100% detail images at three building heights; inspected window contours,
material transitions, roof and tier edges retain the source appearance.
Actual browser wheel zoom also passes. Automated canonical before/after
serialization equality covers all document IDs and source properties.

In 25 controlled dirty frames, the intermediate native-material-only replay
issued 456,950 GPU draws and 457,000 transform-uniform calls. The integrated
camera, resource and batch implementation issues 1,800 draws and 50 transform
uniforms, with zero vertex upload bytes during navigation. This is measured
work reduction, not a promise of the same FPS on every computer. The sampled
settling duration deliberately includes two animation frames and must not be
reported as single-frame render time. Explicit save operations inside the CPU
capture are excluded from navigation CPU attribution.

The separate 1,024-element browser case bounds single-object edit vertex
uploads below half of initial upload volume and verifies zero camera uploads.
`retained-work.json` records exact counts. The native 300x150 material oracle
checks interior color channels within two levels of the analytical gradient,
opaque alpha and the untouched outside contour. Sharp/alpha/complex cases
continue through the canonical evaluator; no lower-resolution navigation mode
is introduced.

Owner proofs reuse permanent regression tests through
`packages/{render,preset,render-engine-pixi}/navigation-flow-contracts.json`.
Render dispatch and Preset vector evaluation are now separate explicit owners
in the delta Inspector. Source-bound proof preparation exposed this ownership
ambiguity; it is recorded as a preparation correction, not claimed to have been
admitted before the first implementation slice. Source candidate checks,
negative scenarios, browser integration and the local validation runner are
distinct evidence. No rendering, source or tests are changed to manufacture an
Inspector pass.

The complete affected local CI and existing 7076 milestone passed in the final
verification below. The remaining acceptance gate is the user's interaction review. No input event or Content
Panel redesign was needed: this navigation workload produces no document
publications or mirror reseeding. No speculative spatial cache or document
format migration is included.

## Custom-engine capability handoff - integration correction

Full local validation exposed Office's strict screen-object property rejection.
The first incorrect owner is Render's command dispatch: an optional retained
transform hint was sent to every engine. The abstract capability registry owns
`TRANSFORM_GROUPS`; Render negotiates that hint on creation and updates, and
engines without it continue receiving their ordinary transforms. No Office
exception, permissive unknown-property handling or alternate product output is
authorized. Inspector steps `define-render-engine-contract` and then
`orchestrate-render-adapter` govern these separate slices.

Inputs: existing engine capability set and RenderNode properties. Output: the
same object command with an optimization hint only when supported. An update
containing only an unsupported hint emits no command. Required capabilities
still fail normally. Tests first use a strict engine to reject leaked hints and
verify unchanged pan/zoom and enabled-engine delivery; full Office validation
then verifies the actual direct consumer. The capability is runtime-only, with
no persisted identity or document migration.

## Final local verification - 2026-10-06

- `tmp/local-validation/a4b5dd22-f8fd-410e-94e5-0b83e8d876e9/result.json`:
  all 19 checks across 12 affected workspaces passed; `sourceVerified=true`.
  This includes lint, builds, unit suites and selected owned E2E. Design
  collaboration: 14 expected results / 3 conditional skips; functional:
  385 expected results (including 5 declared expected failures) / 20 conditional
  skips; render contracts: 3 passed. No flaky or unexpected failures.
- Office regression: the strict-engine test first rejected `transformGroup`;
  capability-aware dispatch then passed 24 Render tests and Office's 14 tests.
  Full local CI subsequently verified both supported and custom engines.
- `tmp/navigation-performance/large-milestone.log`: exact full-document test
  passed; all 18,287 elements remain byte-equivalent after navigation, with zero
  publications and zero mirror reseeds. Across 25 dirty frames: 1,800 draws,
  50 transform-uniform calls and zero uploaded vertex bytes. Two-frame settling
  median 33.25 ms / max 34.6 ms; original replay median 62.2 ms / max 129.2 ms.
  These are local observations, not FPS or hardware-independent thresholds.
- `tmp/navigation-performance/final-milestone/`: overview and three native-scale
  detail images inspected, including roof edges, window frames and materials.
- `tmp/navigation-performance/7076-milestone.log`: existing complete 7,076-object
  replay/edit/hit test passed. Original timeout and failure guards preserved.
- Render, Preset and Pixi source-bound owner assessments are eligible; all three
  positive/negative/recovery proofs passed. Current assessment IDs are in
  `owner-assessments-final.json` and `preset-assessment-final.json` under the same
  evidence directory. No obligations were retired.

Only these plan/status evidence notes were updated after local CI. All other
changed runtime, tests, dependencies, generated files and contracts retain their
validated hashes (`validated-source-hashes.json`). Final metadata checks cover
these documentation-only updates. The original three live services and native
backup hash remain unchanged. No push or AI workflow modification was made.

## Revised iteration - sustained local navigation

User review reports under 60 FPS and possibly under 40 FPS. The previous
measurement waited two animation frames after each direct API call; its 33 ms
settling time is not an interactive FPS measurement. Existing work-count proofs
remain valid but cannot close this responsiveness issue.

Next step: add a permanent, separately invoked local E2E that replays the exact
preserved document and sends native browser wheel input continuously across a
specified pan distance and zoom range. Measure idle baseline, animation-frame
intervals, frames with actual WebGL submissions, delivered input, resulting
camera change, long tasks, and optional interaction-only CPU profiles. Record
viewport, DPR, browser and GPU information. Browser callbacks and WebGL submission
are not proof of physical display presentation; report that limitation.

The measurement has its own Playwright configuration, is excluded from ordinary
E2E discovery, and refuses CI execution. FPS and timing are observations on the
local machine, never CI pass/fail thresholds. CI retains deterministic correctness,
work-count, resource invalidation and disposal regressions. Idle calibration and
unprofiled timings are separated from profiler runs to expose instrumentation
cost. The original user's document and review-site document remain untouched.

Step execution card: the immediate owner is the App's permanent E2E input probe,
with the unchanged surface-interaction-to-feature and execute-render-engine
contracts as observed boundaries. Allowed edits are the local measurement config,
fixture loader, sustained-navigation spec/helper and plan. No production changes
in this slice. First prove continuous input reaches the actual pan/zoom features,
produces camera motion and preserves document identity. Then attribute the measured
cost to the first incorrect existing owner, add its failing deterministic regression,
and revise that owner's implementation slice before editing production code.

Self-review: the revised method fixes the prior direct-API/two-frame blind spot,
does not replace geometry or reduce resolution, does not infer GPU presentation
from rAF, and cannot enter ordinary CI. It stays within the approved input,
camera, material and render submission paths. Repeat full local CI only after
the resulting complete owner correction and focused gates, not after each probe.

### Frame scheduling owner correction

Continuous native input baseline: DPR 1 pan 30.04 / zoom 29.83 submitted
frames/s; DPR 2 pan 30.01 / zoom 29.85. All runs had approximately 60 rAF
callbacks/s and approximately 60 camera changes/s, zero vertex uploads and
zero long tasks. Evidence: `tmp/navigation-performance/continuous-baseline/`.

The first incorrect owner is `execute-render-engine` requestFrame: standalone
Pixi Ticker start sets lastTime to performance.now(); its update skips callbacks
when the browser's frame timestamp precedes that value. This occurs for wheel
input dispatched immediately before animation-frame callbacks. It also passes
its previous lastTime to listeners, so our callback timestamp was stale.

Step execution card: replace the adapter's standalone ticker with one owned
requestAnimationFrame slot. Clear ownership before callback invocation, reject
stale callbacks by identity, cancel on replacement/teardown, and preserve a new
request made inside a callback. No App input, geometry or render-dirty policy
changes. Allowed implementation: pixi-render-engine.ts; deterministic regression
frame-scheduling.test.ts and existing adapter contract test; direct owner docs,
Inspector and proof manifests/config. Existing native browser contract and local
continuous test are consumers, not owners of scheduling policy.

Test-first evidence: frame-scheduling.test.ts uses the real Pixi Ticker and a
controlled browser clock. Three of four cases fail before correction, including
six requested frames losing the first callback and returning stale timestamps.
This is a deterministic CI-safe regression, not a performance threshold.
Self-review confirms one scheduler, engine-only browser interaction, no frame
throttling, no idle loop, no quality loss and no App-specific workaround.

### Continuous-input correction evidence

Local headless Chrome, 1728 x 1000 CSS viewport, full preserved document, native
wheel input offered at 60 events/s for five seconds per phase. No profiler or
video. These are WebGL-submitting frames per second, not physical display FPS.

| Device scale | Phase | Before | After |
| ------------ | ----- | -----: | ----: |
| 1            | Pan   |  30.04 | 59.61 |
| 1            | Zoom  |  29.83 | 59.69 |
| 2            | Pan   |  30.01 | 59.64 |
| 2            | Zoom  |  29.85 | 58.21 |

After-correction callback p95 intervals: 17.5, 17.8, 17.9, 18.2 ms respectively.
DPR 2 zoom delivered 295 of 300 offered inputs and had two intervals above 25 ms;
this does not establish a strict minimum of 60 presented FPS. All phases had zero
vertex uploads and zero long tasks. Idle rendered zero frames. Baseline artifacts:
`tmp/navigation-performance/continuous-baseline/`; candidate artifacts:
`tmp/navigation-performance/continuous-candidate/`. No timing thresholds enter CI.

The local configuration exclusion/rejection test passed. Pixi's 36 formal tests
passed; the real-Ticker red regression failed before the fix. Source assessment
`d766a0bd-8642-4f46-9df1-74f6759cf6d4` is eligible for candidate
`9c1767d0-44e6-4154-8fa6-bf7cfdb15c4e`; positive/negative/recovery owner proof
passed 27 obligations. Full applicable local validation and visual milestone
revalidation are required before another user review handoff.

### Validation pause and remaining performance diagnosis

At the user's request, cancelled local validation
`3a9d22de-d38a-4346-b31b-0b4af2fb4390` through its owned runner's termination
handler. Its temporary listeners were cleaned up; the original document site and
the isolated review site remain running. Cancellation is not a passing gate.
The earlier Fieldscope screenshot mismatch remains recorded in
`d13d2aae-5c74-4c04-9ea7-18a469c10834`; unchanged focused repeats and its complete
E2E group passed, but its original cause is not established.

The remaining scoped diagnostic separates browser input delivery from renderer
work: the DPR 2 zoom sample contains a 99.3 ms gap in delivered wheel events,
including four regular animation-frame intervals with no new camera value and
no draw. That part is not evidence of slow drawing. Other longer callback
intervals still require attribution. Collect an interaction-only CPU profile
with the existing local probe; do not compare profiled rates against unprofiled
rates, change rendering without a demonstrated owner defect, or add timing
thresholds to CI.

### Wheel event ownership correction

Interaction-only DPR 2 profiles identify approximately 977 ms self time in
Pixi hitTestRecursive and 282-293 ms in worldTransform across each 7-second
capture. Render stacks account for 80-102 ms inclusive. These are sampled CPU
costs, not GPU presentation timing. EventSystem.onWheel -> createWheelEvent
performs scene hit testing for every wheel even though the public engine
interaction contract only publishes pointer events. InputSystem already owns
native wheel delivery and modifier handling independently.

Step execution card - execute-render-engine, package spec Ownership and
State-to-render surface, Inspector conditions and interaction handoff: consume
the unchanged engine initialize options and native pointer events, publish the
same opaque pointer targets and explicit hit-test query results. Configure Pixi
wheel federation off inside this adapter; keep native DOM wheel propagation
and every supported pointer event unchanged. Custom engine bypass remains.
Allowed contributor is Pixi; no App feature, camera or input-system changes.
Implementation boundary is pixi-render-engine.ts, retained-navigation.spec.ts,
direct package docs, Inspector and owner proof manifest. Failure owner remains
execute-render-engine. A real-engine browser regression must first show unused
wheel hit-test work, then prove zero wheel hit tests while native wheel delivery,
pointer target and explicit hit-test still work. Follow with the existing
continuous full-document probe, geometry/pixel checks and adapter unit tests.
Stop if an actual supported consumer requires federated wheel targeting.

Self-review: this removes an unused duplicated path, not hit testing for selection;
it follows the public interaction union and InputSystem's existing native
listener. No data, visual or format changes and no new cache are required.

The real-engine regression failed before correction with two unused wheel hit
tests. After correction it records zero, while both native wheel events, one
pointer target and the explicit hit-test query still succeed. All three retained
navigation browser cases passed, including native material pixels and local-edit
upload bounds. Evidence: `tmp/navigation-performance/wheel-red.log` and
`wheel-green.log`.

The unprofiled full-document replay after both corrections records DPR 1 pan
59.22 / zoom 59.63 submitted frames/s, DPR 2 pan 60.02 / zoom 59.41. Callback
p95 is 17.9 / 18.1 / 17.3 / 17.1 ms respectively. Occasional longer intervals
remain (maximum 50.9 ms), so no strict minimum presentation FPS is claimed.
All phases retain zero vertex uploads, zero long tasks and zero document
publications; idle makes no draw calls. Evidence:
`tmp/navigation-performance/continuous-wheel-candidate/`.

Separate interaction CPU profiles confirm hitTestRecursive self time falls
from approximately 977 ms per phase to zero; sampled native wheel-handler
inclusive time falls from 1,067.8 / 1,093.1 ms to 5.8 / 6.0 ms (zoom / pan).
These are sampled CPU totals over each capture, not task wall-time savings.
The profiling runs are diagnostic and excluded from the unprofiled rate table.
Artifacts: `tmp/navigation-performance/continuous-profile/` and
`tmp/navigation-performance/continuous-wheel-profile/`. Full local CI remains
paused as requested; it is not being reported as passing for this new source.

Bounded owner review after this correction: 36 engine tests and 20 existing
viewport/selection browser tests passed; focused lint, build and naming passed.
Native pixel/retained-batch cases passed with the wheel regression. Public docs
and the Inspector workspace projection were regenerated. No input listener,
camera transform, canonical data, material or geometry implementation changed
in the wheel correction. A final full-validation handoff is still pending.

### Review environment reconciliation

The user reported progressively worse navigation and then confirmed testing
`http://localhost:3000/?fileId=my-design`. That service still serves the original
worktree and its Pixi Ticker scheduler. The performance candidate is at
`http://127.0.0.1:3300/?fileId=taipei-101-performance-review`. Read-only headless
inspection confirmed the saved drawing's layer is present and the actual loaded
engine module contains the native frame request and disabled wheel federation,
with no old frameTicker. The live user's original site was not changed.

This feedback establishes continued dissatisfaction with the original site,
not a measured regression between candidate revisions. Stop additional
production changes until review evidence and the served candidate are aligned.
The existing local measurements do not establish Figma-equivalent responsiveness
or physical display FPS. Full local CI remains paused and no changes are pushed.

### Personal acceptance material boundary - 2026-10-06

The user requested removal of personal recording automation from the upload and
explicitly retained the original full Taipei 101 ZIP for upload. Preserve the ZIP
byte-for-byte; keep its duplicate expanded test data and the personal recorder
locally, outside Git. Generic navigation probes and product regression tests stay
maintained. This task does not change accepted renderer behavior or AI execution.

Bounded execution card: test-discovery and acceptance-material ownership, with
AI execution Inspector observe reviewed only to remove personal camera/recording
procedures from the product trace contract. Input is the existing recorder and
preserved ZIP; output is ordinary product-only discovery, an ignored local recorder,
and the unchanged committed ZIP. Test/config files, directly affected spec and
Inspector wording, and this plan are the allowed changes. Production runtime,
server event recording, product cancellation, Undo and reload semantics are excluded.
First prove ordinary discovery currently includes the personal scenarios, then
extract them intact and verify discovery, retained product cases and local-only
recovery. Stop if extraction requires a product runtime change.

The discovery regression failed before extraction with 14 personal recording
scenarios. The recorder and all 14 scenarios now live in ignored App tmp storage;
ordinary discovery retains the product Fill, visibility, continuation and cancellation
cases. The uploaded document is the original 20,802,406-byte ZIP at
`apps/asyra-design/e2e/fixtures/large-document/Taipei-101-full-document.zip`, with
SHA-256 `e71192d9f90762ade11e359ad8ab5d2d16e42c58e61ed61873520b9786333805`.
The duplicate gzip is ignored and can be recreated from that archive using the
fixture guide. Original live documents and both review services remain untouched.

The final navigation source passed all 16 dependency/shared/workspace gates in
`tmp/local-validation/f1b25daf-9918-47ce-8d5e-397f599563e1/`. Its Design browser
run was invalidated by accidental reuse of the old localhost:3000 service, not
accepted as candidate evidence. All three browser gates were rerun through the
same formal runner on isolated ports 3340/4141/4241 and passed with unchanged
source: `tmp/navigation-performance/isolated-final-e2e/` (14 collaboration,
386 functional including five expected failures, three render contracts; zero
flaky cases). Recording extraction changes only test/acceptance material and
contract wording; rerun its direct product E2E, shared and affected App/Inspector
checks, and retain the unchanged renderer evidence.
