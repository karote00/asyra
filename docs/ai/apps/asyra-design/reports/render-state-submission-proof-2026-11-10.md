# Render-state submission - attribution and supported program reuse

November 10, 2026. Associated task:
[Pixi research revision](../plans/agent-context-and-report-continuity-plan.md#pixi-research-revision).

## Outcome

The measured upstream duplication is ordinary shader **program creation**, not
unnecessary scene traversal. The engine created one `DefaultShader` per material
batcher. Pixi 8.20.1's ordinary high-shader compiler constructs a new `GlProgram`,
whose processed source contains a unique shader-name define. Equivalent ordinary
shaders therefore become distinct native GPU programs. Pixi's own DefaultBatcher
avoids this by sharing its default Shader; our custom batcher did not.

The supported minimal proof passed and the production engine now creates separate
Shader bindings backed by `GlProgram.from`'s source cache, matching the existing
analytic shader's ownership pattern. Ordinary shader bits, texture capacity,
WebGPU program construction, material transitions and all matrix submissions
remain unchanged. No group threshold, private SDK flag, GL-call suppression,
alternate capture tree or dependency upgrade was introduced.

This removes demonstrated program duplication and substantially reduces the
small-group GPU cost. It does **not** eliminate every cost of independent render
domains, reduce draw calls, or establish a stable CPU-frame improvement.

## Actual state attribution

The observer reads the currently bound GPU program and its uniform value before
forwarding every real matrix submission. It does not infer equality from object
identity or dirty flags. Its control test covers changed values, mutation of the
same array, different programs, returning to an earlier program, and cleanup after
an exception. Timed measurements run separately without these observer wrappers.

Counts below are per steady frame; raw `submission` records cover two frames and
are divided by two except the distinct-program set size.

| Recorded work | Installed before | Production after |
| --- | ---: | ---: |
| 1,000 small Groups - native programs | 1,000 | 1 |
| 1,000 small Groups - real program switches | 1,000 | 0 |
| 1,000 small Groups - draw calls | 1,000 | 1,000 |
| 1,000 small Groups - matrix writes | 2,000 | 2,000 |
| 1,000 small Groups - identical matrix writes | 2,000 | 1,000 |
| Recorded 101 - native programs | 7 | 3 |
| Recorded 101 - real program switches | 48 | 45 |
| Recorded 101 - draw calls | 53 | 53 |
| Recorded 101 - matrix writes | 45 | 45 |
| Recorded 101 - identical matrix writes | 14 | 9 |

The apparent reduction in identical writes is expected: before sharing, every
program retained its own unchanged Group matrix. After sharing, the next sibling
uses the same program with a different matrix, so that matrix must be submitted.
For small Groups, projection repeats 1,000 times but all 1,000 world matrices now
change. The 101 scene retains changing local mesh matrices and necessary material
program transitions. No observed matrix role/value was unknown; steady frames
had zero buffer uploads in both versions.

Skipping all formerly identical writes would have broken sibling placement.
Further projection-upload optimization is not admitted by this work: it would
need a separate supported state owner, with target/program/context restoration.

## Same-version App measurements

Pixi 8.20.1, Chrome 157.0.8103.40, WebGL2 through ANGLE Metal on Apple M3 Max,
DPR 1, 1280 by 720. The retained 101 fixture has 25,539 visible leaves; the four
moved roots cover 25,491. The small fixture has 1,000 Groups with four vector
children each. Both use the installed independent Group domains.

Each run alternates ordinary/independent/independent/ordinary domain blocks.
Each phase has eight warmups and 30 CPU/completion samples per block. GPU time
uses ten separate timer-query samples per block, with disjoint/timeout checks.
The table pools the two independent-domain blocks and reports medians in ms.

| Fixture and operation | Before CPU render | After CPU render | Before GPU | After GPU | Before completion | After completion |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Small Groups - redraw | 2.60 | 2.00 | 0.587 | 0.269 | 2.65 | 2.05 |
| Small Groups - translate four parents | 2.70 | 2.10 | 0.583 | 0.263 | 3.20 | 2.70 |
| Small Groups - reparent four roots | 2.70 | 2.10 | 0.580 | 0.239 | 24.45 | 22.00 |
| Recorded 101 - redraw | 0.55 | 0.70 | 0.692 | 0.416 | 0.55 | 0.70 |
| Recorded 101 - translate four parents | 0.60 | 0.50 | 0.629 | 0.617 | 2.70 | 2.10 |
| Recorded 101 - reparent four roots | 0.30 | 0.30 | 0.611 | 0.604 | 9.65 | 10.30 |

CPU render covers the explicit flush; completion includes mutation, flush and a
`gl.finish()` barrier. GPU timers are separate samples, not numbers to add to CPU.
Completion is not the entire AI/provider tool call or historical 155.7 ms sample.

The isolated candidate also reproduced small-group GPU medians of 0.262 and
0.284 ms before production admission. Its CPU median varied around 2.65 ms,
while the final production run measured 2.00 ms. Therefore the stable conclusion
is fewer programs/switches and lower GPU cost, not a guaranteed CPU speedup.
Recorded-101 GPU/CPU redraw samples vary; do not claim a general redraw gain.

The final same-run ordinary-domain control measured 52.60 ms for recorded-101
reparent and 14.90 ms for actual parent translation, versus 10.30 and 2.10 ms
with independent domains. The retained large-subtree benefit remains. Small-group
ordinary-domain redraw was 1.70 ms CPU / 0.239 ms GPU, versus 2.00 / 0.269 with
independent domains: residual domain overhead remains, without a size heuristic.

## Query, extraction, restoration and lifetime

The isolated native proof keeps domains in both variants and substitutes only the
ordinary program owner. Eight reversed-order blocks cover four large roots and
1,000 small roots. Every variant checks eight exact images: initial, reparented,
capture, following live frame, direct capture, its following frame, edited capture
and restored scene. All 64 outputs match their reference state. All 16 App
benchmark PNGs also match their pre-change counterparts byte for byte.
An additional mixed-content regression compares eight outputs across the old
reference and production: nested Groups, vector geometry, a raster Sprite, text,
alpha and a BlurFilter, including selected capture, following frame and subsequent
transform/tint changes. Outside overlapping content stays outside the selection.

Native query/capture proof, four roots with 4,000 leaves total:

| Completed operation | Independent programs | Shared programs |
| --- | ---: | ---: |
| Reparent plus bounds query and frame | 0.30 ms | 0.30 ms |
| Reparent plus capture and following frame | 1.70 ms | 1.80 ms |
| Reparent plus direct capture and following frame | 1.75 ms | 1.70 ms |
| Capture clones | 0 | 0 |
| Capture membership-leaf additions | 0 | 0 |

Sub-millisecond native redraw/translation samples can round to zero; this does
not mean zero work. The native 1,000-root stress case has much larger baseline
completion times (30.75 ms redraw, 62.25 ms capture) than the App. It verifies the
program-switch mechanism and no shifted work, but is not an App speedup estimate.

The formal actual-batcher regression failed before production implementation:
two equal-capacity batchers returned different program objects. After the change,
equal capacities share a program, different capacities remain separate, Shader
objects stay distinct and destroying one owner preserves another's program.
The browser regression forces context loss through Pixi's supported context API;
restoration creates a new native program, restores identical pixels, and still
updates a subsequently moved Group without GL errors.

Seven focused App cases pass: state-observer control, live child geometry/style/
ordering/visibility/history/replay, immediate accepted-batch reads and capture,
mixed materials/camera changes, hard stops/alpha/degenerate materials, explicit
batching changes, and texture overflow/ordinary-material transitions. Replay
uses the existing public publication path; this is not a new multi-peer network
benchmark. Query, hierarchy, capture and canonical transaction code are unchanged
by this production slice. WebGPU performance was not measured.

## Review corrections and evidence limits

- The first injected candidate matched only TypeScript URLs; the real App serves
  built JavaScript. Its unchanged work counts exposed the miss. That run is
  excluded. The corrected proof recorded the served module; production tests
  require the new factory call in that module and record its URL/hash.
- One initial baseline overlapped another browser run and is excluded from the
  final timing table. A later recorded baseline was interrupted by development
  page reload while a test helper changed. Its incomplete 101 blocks are excluded;
  the complete small-group case is retained. The recorded case was rerun alone
  with file edits frozen. Final production timing was also run alone.
- The first context-restore test requested restoration during the loss-event
  microtask and timed out. The test now uses Pixi's public `forceContextLoss`,
  which schedules restoration after the event. No product workaround was added.
- Temporary response injection and its source helper were removed after admission.
  The independent-program baseline remains exclusively in the permanent native
  measurement fixture; it is not a product compatibility route.
- A source read is not a runtime proof. The engine was built before the final App
  checks, and both final fixtures received the same built batch-module hash.

## Reproducible evidence

All paths below are relative to the worktree. Existing evidence is retained.

- Work before: `apps/asyra-design/test-results/render-state-attribution-confirmation/`.
- Work after: `apps/asyra-design/test-results/shared-program-production-attribution/`.
- Timing before: `apps/asyra-design/test-results/shared-program-baseline-confirmation/`
  (complete small case only) and `shared-program-baseline-recorded-confirmation/`
  under the same parent (complete recorded case).
- Candidate repeats: `apps/asyra-design/test-results/shared-program-candidate-timing/`
  and `shared-program-candidate-confirmation/` under the same parent.
- Final timing: `apps/asyra-design/test-results/shared-program-production-timing/`.
- Final native proof: `tmp/conversation-improvements/shared-programs/measurement.json`
  and its PNGs; source hashes, browser, listener port and process ID are recorded.
- Product handoffs: `apps/asyra-design/test-results/shared-program-production-handoff/`.
- Red regression: `tmp/conversation-improvements/shared-program-production-red.log`.
- Final native run, including mixed content: `tmp/conversation-improvements/shared-program-final-mixed.log`.
- Focused types/build/lint/naming: `tmp/conversation-improvements/shared-program-focused-types.log`,
  `shared-program-build.log`, `shared-program-final-lint.log` and
  `shared-program-final-naming.log` under the same parent.

Only focused tests were run; no full local, CI, release, new AI drawing, commit or
push was performed. The original app/backend/collaboration services remain open.

## Follow-up deep review - binding and resource lifetime

The review found no shared-program update regression in the exercised WebGL path.
It did confirm an existing SDK resource-retention issue and two weaknesses in
the earlier evidence. This review changes permanent tests and documentation only;
production shader/batcher code is unchanged.

### P2 - retired Group batchers remain retained by Pixi 8.20.1

In an otherwise live renderer, create, draw and destroy four independent Groups.
After each removal, draw the remaining scene. The SDK's instruction-set cache
still holds all four retired batchers and their Shader bindings:

| Observation | Independent-program reference | Shared production programs |
| --- | ---: | ---: |
| Retired Groups | 4 | 4 |
| Retained retired instruction owners | 4 | 4 |
| Retained material-batcher Shader bindings | 4 | 4 |
| Retired batcher destructor calls after deletion | 0 | 0 |
| Retired batcher destructor calls after renderer destruction | 0 | 0 |
| Native context lost when renderer is destroyed | Yes | Yes |

Installed `BatcherPipe.buildStart` stores batchers by InstructionSet UID;
`RenderGroup.destroy` drops its instruction reference without removing that cache
entry. `BatcherPipe.destroy` visits only `_activeBatches`, not all cached retired
instruction owners. The engine's correct `MeshMaterialBatcher.destroy` cannot
release an owner when this caller never invokes it.

This is the lifecycle gap already identified in the external research, now
reproduced in the same fixture before and after program sharing. Repeated creation
and deletion within a live editor can accumulate retained batcher/geometry/binding
objects. This measurement is an object/owner count, not a GPU-memory byte estimate.
The native context is lost on renderer destruction, so it does not establish
permanent native GPU allocation after closing the renderer.

The issue remains unfixed. The repair owner is the instruction-set/batcher
lifecycle, not a new shader refcount or a group-size rule. This review did not
upgrade Pixi, patch installed SDK files, or add a product workaround. The permanent
probe records this condition and only checks that program sharing does not add
retention; it does not encode retained objects as required product behavior.

### Strengthened evidence

The old `survivorUsable` check only inspected remaining shader source. It did not
prove rendering after release. The new live test creates two renderers and two
batcher owners sharing source, verifies distinct native programs per context,
releases one batcher and renderer, then uses the survivor to bind and render.
The remaining scene is identical. It next changes a Group's position, tint and
alpha, extracts that Group, destroys the second explicit owner, creates a later
owner and renders another edit. Exact source-space pixel checks establish:

- the old position is white, not stale geometry;
- the moved Group is 50%-alpha green over white;
- the unchanged sibling remains blue, not the preceding Group's tint/alpha;
- selected capture is 8 by 8 and has the same composited green;
- capture leaves the following main frame unchanged;
- the later opaque edit is solid green; no GL errors occur.

The mixed vector/text/raster/effect capture now also asserts the local background
pixel directly. An overlapping outside green object must not appear there; the
expected pixel is `[221, 221, 238, 255]`. This supplements image equality with a
specific target-membership oracle.

### Why program reuse does not omit the reviewed updates

| Boundary | Verified implementation responsibility |
| --- | --- |
| Group/camera matrices and alpha | `GlobalUniformSystem.bind` updates each acquired uniform group; WebGL `pop` dirties the restored parent. `GlBatchAdaptor.start` updates global uniforms even when its once-only Shader resource sync is skipped. |
| Material and sampler state | The engine still forces start-batch rebinding for ordinary/material transitions. Texture resources bind for every batch. Same-capacity ordinary shaders use identical sampler-slot mappings; analytic programs have distinct sources. |
| Program versus bindings | `GlShaderSystem._setProgram` skips redundant `useProgram`, not required global-uniform updates. Each Shader retains its own binding objects. |
| Context/capture restoration | Program caches and active-program state reset per native context. The context-loss regression, mixed-target capture, following live frames and exact pixels pass. |
| Explicit release | `Shader.destroy()` does not destroy shared programs by default. Actual surviving-owner rendering now verifies that behavior, including a second live renderer. |

The bounded SDK source/program cache is intentional; it contains immutable shader
source variants and does not retain scene geometry. It is different from the
unreleased retired-batcher cache above. WebGPU end-to-end drawing was not tested;
this review does not extend the WebGL evidence to that backend.

Validation: the expanded native browser test passed, including the existing
eight reversed blocks and mixed-content comparisons. All seven related App cases
passed again, covering ordinary/analytic transitions, material updates/overflow,
camera changes, hierarchy, child edits, history, replay and capture. Review
artifacts are in `tmp/conversation-improvements/shared-programs-review/`, including
`lifetime-review.json` and `retired-owner-review.json`; the previous measurement
directory is preserved. Logs are `shared-program-deep-review-final.log` and
`shared-program-deep-review-app.log` under `tmp/conversation-improvements/`.
Only focused tests were run. The earlier performance conclusions are unchanged;
this review does not claim that all resource-lifetime concerns are resolved.
