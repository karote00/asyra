# Large document load performance

Status: implemented and locally verified - user accepted; PR delivery authorized.
Base: `4d62f02dc2597eeb558e98c05c401cf711d889fa`.
Closeout owner: this task. The user authorized PR creation on 2026-10-07;
the required feature-branch push is authorized. Merge is not authorized.

The sections below retain the bounded design and its test-driven revisions.
The authorized unified material architecture supersedes the initial native-route
eligibility experiment. Current results and remaining limits are at the end.

## Objective and scope

Load the preserved full Taipei 101 document faster through ordinary socket
bootstrap and canonical Core load, with every element, property, material,
shared reference and editable value preserved. Use the committed original ZIP
and its digest, 18,287 elements and 381,294 property components. Use isolated
services and a fresh file identity; never reset or replace the user's site.

Mutation scope: the measured load/material owners in Core, Props Manager,
Scene Tree, Preset and Render, their direct tests, current contracts and the
local Design replay harness. Investigation follows the saved document, retained
CPU profile and the current caller chains. No AI workflow, protocol/schema
migration, pan/zoom scheduling, new dependency, lowered resolution or timing
threshold in CI. Preserve validation, one-shot apply isolation and all normal
edit/Undo/Redo behavior. A new product decision or non-equivalent shortcut
stops the affected implementation segment.

## Evidence and design review

The retained research run in the predecessor worktree reported 17,558.9 ms
through projection and a 126,637,871-byte inbound bootstrap frame. CPU samples
place most active time in even-odd gradient rasterization, followed by detached
property and scene snapshots. These are historical samples, not this branch's
baseline. Establish a fresh baseline before implementation.

Read-only inspection found 8,107 gradient vectors. Of these, 858 have stored
width/height differing from coordinate-derived bounds by at most 9.1e-13.
The native-material eligibility caller requires exact numeric equality, which
can send equivalent geometry to a full per-pixel raster. Confirm the actual
caller work before changing this predicate. Existing native-gradient precision,
convexity, opacity, coverage and fallback obligations remain in force.

Detached load snapshots protect untrusted input and one-shot owner artifacts.
Do not remove these copies based only on allocation cost. The normal Core
preflight consumes detached property evidence. Any proposed change must retain
input/result mutation isolation and exact property-relation validation.

## Execution sequence

1. Retain a local-only complete-document load E2E. Measure navigation start,
   worker bootstrap, canonical/projected readiness, long tasks and raster work;
   preserve the exact original source and inspect full-fit/native detail output.
2. Confirm the first excessive owner operation and review its producer/consumer
   mapping. Register the reviewed Preset material contract through the existing
   render-delta Inspector and product-proof manifest before production edits.
   Add permanent failing work-count/equivalence cases first.
3. Correct only the confirmed owner, preserving material precision and actual
   geometry. Re-run the same full document with matching browser settings.
   Do not broaden to other optimizations unless the baseline proves a necessary
   in-scope correction; update this reviewed design before that segment.
4. Run affected package lint/build/tests, Inspector proof, local-only large
   document load and preservation checks, and applicable local validation.
   Review the bounded diff. Report timings as local observations, together with
   deterministic work counts and unoptimized necessary work. Do not push.

## Flow and acceptance

Existing socket session supplies one checkpoint and exact tail -> Core runs
migration and all owner validation before apply -> canonical properties/elements
produce computed data -> Render supplies complete vector strategy input ->
Preset `evaluate-vector-material` produces coverage/material commands -> the
selected engine creates resources and draws -> Core/App readiness and UI.

Authorities: socket-authoritative-document-session spec; Framework load
validation rule; Preset material contract; render-delta Inspector
`evaluate-vector-material`. No alternate load source or rendering authority.

Acceptance: exact fixture digest/counts, no page errors, successful complete
projection, same source-space shape/material output, canonical save retained,
material edits and existing fallback cases preserved. CI assertions measure
correctness and work counts only. Timing/profile output stays local and is not
a machine-independent speed guarantee.

## Reviewed material owner segment

Fresh full-document baseline: 18,437.6 ms, bootstrap callback at 5,184.7 ms,
910 CPU raster allocations totaling 142,851,583 pixels, longest task 12,234 ms.
The timed run uses normal isolated backend/socket bootstrap; serialization and
screenshots are outside the timed interval. Artifact: `tmp/document-load/baseline`.

Execution card: `evaluate-vector-material` in the existing render-delta
Inspector. Input is the complete registered vector strategy request; output is
unchanged contours and an eligible native gradient or the existing raster
material. Contributors are Core paint APIs and engine-neutral graphics only.
Boundary: Preset vector strategy/eligibility, their permanent tests and current
Preset contract. No document mutation, Pixi access, geometry replacement,
material cache or new persisted identity. Failure remains this owner.

The correction treats relative differences within 64 machine epsilons as
arithmetic roundoff for strictly positive finite dimensions. It uses no absolute
world-coordinate tolerance: zero/tiny dimensions cannot admit arbitrary
clipping changes. With the existing minimum gradient-handle length and color
slope guard, the material-coordinate perturbation is far below one channel unit
and the existing native ramp precision bound. Actual different bounds retain
the canonical raster path. The same finite, relative test applies to both axes.

Review: producer already supplies both dimensions, consumer uses existing local
coordinates, all other eligibility conditions remain unchanged. Formal tests
cover translated fractional coordinates, each axis, genuine size differences,
tiny dimensions, ineligible paint/topology, untouched input and material edits.
Existing native-material browser parity tests plus exact full-document canonical
hash comparison and local visual crops prove the complete caller handoff.
Detached load snapshots and wire transport stay unchanged in this segment:
current evidence does not justify weakening their isolation or changing format.

DoD: failing extra-raster regression becomes green; existing owner suite and
Inspector cases pass; full Taipei 101 load has fewer raster pixels and preserves
canonical digest/counts; native-detail output is inspected; scoped local gates
pass. Stop if the eligibility change cannot preserve coverage/material semantics.

## Authorized extension - topology and shared fill material

The user approved replacing topology-dependent gradient routing with one
coverage/material architecture. The authorized owner scope now also includes
RenderEngine's neutral mesh paint contract, the Pixi engine implementation,
Core facade exports and their direct tests/specs. No persisted data change or
new dependency is planned. The earlier roundoff correction remains an isolated
measurement, not the final architecture or a second permanent gradient policy.

Target flow: complete vector geometry and fill rule -> Preset produces
non-overlapping filled faces and matching hit coverage -> Render triangulates
through its existing mesh projection -> a neutral material descriptor supplies
solid or linear/radial/angular/diamond paint -> the concrete engine evaluates
paint in the same object-local coordinates for all triangles. One material
coordinate domain covers all faces, including disconnected regions. Holes have
no fill triangles. Neither App nor Preset imports Pixi.

Reuse decisions:

- Extend the existing compound-fill preparation to both nonzero and evenodd;
  do not create a second contour parser or triangulator.
- Reuse Render's mesh projection and its separate updatePaint lifecycle.
  Geometry preparation depends on points, segments, networks and fill rule;
  material preparation depends on fills and the material-coordinate domain.
  Transform/camera-only changes do not rebuild either. Dispose both with the
  projected element/document. Prove these work boundaries before integration.
- Reuse current material resource ownership and reference counting. All modes
  need one explicit definition for stop order, duplicate stops, alpha,
  degenerate handles and coordinate mapping before removing old evaluators.
- The installed Pixi Mesh implementation disables batching when a custom shader
  is attached. A shader per object is therefore not an accepted final design.
  The engine proof must preserve painter order and demonstrate batching with
  mixed solid/gradient/stroke elements before migrating the full document.
  Render-to-texture at a reduced resolution is not an alternative.

Implementation sequence and review gates:

1. Coverage: add source-space area, hole, crossing and hit-parity cases for both
   rules to the existing compound-fill tests; prove missing evenodd support,
   then extend the same owner. Preserve cubic subdivision and source data.
2. Material/batching feasibility: resolve existing evaluator discrepancies
   against product contracts; prove all four modes, hard stops, transparency,
   multiple fills and shared object coordinates in a real engine. Test batch
   work counts and cleanup, not only a visually plausible screenshot. Keep this
   proof isolated from the ordinary application until it passes.
3. Projection integration: connect the accepted geometry and material handoff,
   preserve fill/stroke order and hit semantics, remove the superseded vector
   native/raster selection. Prove edits, Undo/Redo, resource invalidation and
   source preservation through actual callers. Retain public CPU APIs only as
   required by their explicit consumers, never as a hidden production fallback.
4. Full-document validation: identical saved Taipei 101, canonical save digest,
   native-scale visual crops and complete load measurements. Re-run local
   continuous pan/zoom measurements to exclude a load/navigation tradeoff.
   Machine-specific timings stay local; deterministic work and visual contracts
   are formal tests. Then run applicable local CI once the owner work is sound.

Self-review: topology and paint have separate lifetimes; no bounding-rectangle
coverage substitution, fixture-specific admission, alpha approximation, missing
fill mode or lowered resolution is accepted. The engine proof is a prerequisite,
not permission to ship a slower unbatched shader. Stop the affected segment if
coverage/material equivalence or the engine's supported extension boundary
cannot be established. No push is authorized.

### Coverage segment execution card

Owner: `evaluate-vector-material`; spec: Preset vector fill coverage; Inspector:
render-delta vector evaluator. Input: declared line/cubic contours and explicit
fill rule. Output: disjoint filled faces and the matching point-in-fill query.
Nonzero remains the default for existing callers. Empty/degenerate contours
produce empty coverage. Contributors: existing Preset contour preparation and
Utils cubic subdivision. Forbidden: paint-dependent topology, Pixi, canonical
writes and alternate document stores. Failure owner: vector material evaluator.
Files: `vector-compound-fill.ts`, its existing tests, Preset spec and the matching
Inspector boundary. Product cases: same/reverse winding holes, nesting, crossing,
self-crossing, curve/empty cases and unchanged input. DoD: failing evenodd
regressions pass, previous nonzero cases pass, naming/type/format gates pass.
No cache is introduced by this slice; retained caller integration belongs to
stage 3 and must prove invalidation and work counts before use.

### Material decisions and engine segment

The user approved correcting the old nonlinear discrepancies rather than
preserving route-dependent incorrect colors. The unified definition uses
object-normalized coordinates: linear projection along the primary handle;
radial distance and diamond L1 distance in the primary/secondary handle basis;
angular phase measured from the primary handle with phase zero at its direction.
The primary endpoint is distance one. Absent secondary handles use the
perpendicular primary axis. Degenerate bases yield the first stop. Stops clamp
outside their range, equal-position stops have a right-continuous transition,
and unpremultiplied stop colors/alpha interpolate before source-over layering.
All faces use one shared material domain; source geometry is not rescaled to
match stored dimensions. Saved data is unchanged. Existing nonlinear images
may change where the old evaluators disagreed; the full 101 is linear.

Engine feasibility design: use Pixi's exported Batcher/BatchableMesh extension
boundary, a shared analytic fragment program, and per-material stop/parameter
buffers encoded as IEEE-754 bytes in nearest-sampled RGBA8 data textures.
Byte decoding preserves float32 parameters without requiring optional filterable
float-texture extensions on WebGPU. These textures contain
parameters, not a rasterized picture; their size scales with stops, not object
pixels. Batch vertices retain object-local UVs. Meshes with different materials
can use the same batcher up to the renderer texture limit. Solid mesh paint uses
the same batch route. Preserve painter order, blend boundaries and existing
retained render groups; do not merge unrelated scene objects or change camera
scheduling. Both WebGL and WebGPU shaders implement the same definition.

Execution card: `execute-render-engine` in the render-engine-boundary Inspector.
Inputs: engine-neutral mesh geometry and numeric paint descriptors, opaque
object lifecycle commands. Outputs: owned GPU geometry/material resources and
rendered pixels. Contributors: RenderEngine contracts and Pixi exported
extension APIs. Forbidden: Core/Render imports, scene state, App decisions,
per-object shader draws, image-resolution material baking. Boundary:
`packages/render-engine-pixi/src/**`, direct engine tests and engine spec;
neutral descriptor types at the preceding RenderEngine contract owner. Material
resources are keyed by complete descriptor values within one live engine, use
reference-counted lifetimes and release on replacement/destroy. Geometry does
not depend on material type. Gates: parameter-size work tests, shader pixel
oracles for each mode, cross-face continuity, alpha layering, mixed-material
batch counts, disposal, existing engine contract suite. This segment remains a
capability proof until the browser and work-count gates pass.

Coverage proof: 27 focused tests pass after the same contour preparer gained
explicit parity. The new parity cases failed three assertions before the fix.
The captured coverage source proof passes (`8f7d5eb2-c0d2-4abc-a6e8-455acfb20dc5`).
No production gradient caller has moved yet. A proof manifest must reference its
own complete test file; the first combined-file capture did not include imported
test files, so coverage uses a separate supported manifest instead of changing
Inspector machinery or weakening its missing-case checks.

Neutral descriptor segment: the RenderEngine contract owns transient numeric
mesh material types; no document schema or property IDs change. The engine
consumes all required stop/control values, and Render/Preset supply admitted
numbers through the existing Core mesh projection boundary. The authorized
nonlinear corrections are part of the user-approved material semantics above.

### Engine proof outcome and projection segment

Real WebGL tests now pass all four modes, cross-face continuity, hard-stop
transitions, alpha layers, empty/degenerate materials and retained camera batches.
The 100-mesh mixed solid/gradient case issues one batch and performs zero batch
repacking for ten camera updates. The proof exposed two concrete adapter issues:
GLSL must request ES 3.00 for parameter decoding; data textures must declare
already-premultiplied output semantics, because the shader performs that step.
Using no-premultiply metadata incorrectly split the mixed sequence into 100 draws.
Both issues were corrected at the engine owner and the unchanged oracles pass.
The generated WGSL programs are also checked when WebGPU is available.

Projection execution card: `orchestrate-render-adapter` extends the existing
mesh projection paint union with a complete neutral material descriptor. Geometry
updates remain separate from paint updates; returning to solid paint explicitly
clears the previous descriptor. No new authoritative state is introduced.
Boundary: Render mesh projection, its tests/spec, existing Core facade exports.
Failure owner: the mesh projection adapter. Proof: same geometry identity after
paint edits, exact descriptor delivery, no stale material on solid replacement,
and normal disposal. Preset supplies coverage through the following owner slice.

Preset integration card: `evaluate-vector-material` retains coverage by immutable
points/segments/networks identities plus fill rule. The same coverage supplies
triangles and hits. Fill changes update material only; geometry changes rebuild
coverage and UVs. All fills use one object-local coordinate domain. A retained
neutral graphics child draws the existing stroke after the fill mesh, preserving
painter order. Core re-exports the existing engine-neutral RenderGraphics class
for this composition; it does not expose Pixi. Empty/removed geometry hides the
projection, and element destruction owns child cleanup. This replaces the earlier
eligibility/raster routing rather than leaving it as a second production policy.

### Integration review revision - mixed ordinary graphics

The mesh-only batch proof was insufficient for the actual base-stroke consumer.
The strengthened permanent test inserts ordinary Graphics strokes in the same
100-element sequence and fails at 50 batches (expected one). Pause projection
closure until this engine boundary is corrected. The revised engine step uses
Pixi's exported BatcherPipe extension and its public addToBatch method to route
ordinary default batch elements and analytic meshes through one engine-owned
batcher. A vertex flag distinguishes numeric material data from ordinary image
textures; ordinary texture sampling, painter order, blend and texture limits stay
intact. Other custom batchers retain their own routes. No private Pixi cache is
patched, no state is moved out of the engine, and no default-shader replacement
is used for unbatchable graphics. Extend the GPU proof to mixed image/graphics/
mesh data and retain camera work counts before returning to the full document.
This replaces the mesh-only feasibility assumption inside the approved engine
scope. Self-review: the actual stroke consumer is now in the test, resource flags
are weakly held by texture source, ordinary textures cannot be mistaken for
parameter buffers, and unsupported required material capability fails explicitly.

The installed Pixi named-extension registry keeps its first entry. The initial
add-only registration was ignored. Use its public remove/add lifecycle before
renderer construction; verify the same mixed sequence, not a different oracle.

### Load integration correction

Full document input/canonical counts reach 18,287, but projection stops at the
first mesh. The existing adapter assigns neutral `batched` directly to Pixi's
read-only Mesh getter; the small engine probe had omitted this actual Render
property. The complete-property browser regression reproduces the TypeError.
At `execute-render-engine`, map the hint to geometry.batchMode and invalidate
the mesh; explicit no-batch separates submission at the public batch boundary.
At `orchestrate-render-adapter`, retained mesh projections opt into batching.
The local load gate now aborts on renderer errors instead of waiting its entire
readiness deadline. No load data, validation or reset policy changes.

### Constant paint review

The full document now loads in 10.223 s with zero CPU color rasters and an
identical canonical digest. Native-scale crops retain the facade and remove
raster stair steps. Sustained DPR-2 zoom observes 47-48 camera updates/s despite
about 60 callbacks/s; recorded wheel events arrive two per callback in 56-60
intervals. CPU profiling is mostly idle, with no geometry uploads. Do not call
this a proven renderer stall or dismiss it as equivalent navigation yet.

The integration sends even one solid color through parameter-texture decoding,
although the existing neutral solid MeshProjectionPaint can represent it exactly.
At evaluate-vector-material, select the existing solid paint for one admitted
solid layer; multi-layer/gradient materials keep the same analytic route and
coverage. This removes unnecessary material resources and fragment reads without
changing the gradient definition or using sampled images. Test this exact work
boundary, retain fill-hit behavior, then repeat the same local navigation probe.
No input scheduling or renderer timing policy changes are authorized by this
finding. If input grouping persists, report it and compare a current same-machine
baseline before claiming a navigation regression or improvement.

### Navigation measurement review

The same-machine 60-Hz native-input comparison reports DPR-2 zoom at 59.40
baseline versus 47.21 candidate submissions/s. Raw events show 2 versus 62
intervals containing two inputs; neither version misses a camera update in an
interval that receives input. This does not establish why delivery is grouped,
and callback frequency is not a rendering-throughput verdict.

Keep the original 60-Hz evidence and add a supported local-only 120-Hz input
cadence with the same five-second duration and total delta. Run both owners
through the same test source by selecting the service App directory; no copy of
the test or mutation of the baseline implementation is necessary. The existing
isolated ports, fresh document identity, process lifecycle and CI exclusion stay
in force. This is a measurement revision, not an input/render scheduling change.
Review the resulting work counts, input delivery and submissions together; do
not turn a timing result into a CI threshold or discard the earlier observation.

## Current result and local validation

User acceptance on 2026-10-07: independent refresh testing on the same computer
observed approximately 18 seconds before and 8 seconds after. The user confirmed
the change and requested a PR. This observation is separate from the instrumented
18.44-to-10.34-second run below; neither is a machine-independent timing gate.

All production owner changes are complete. Vector fill coverage and hit testing
share the same topology; paint uses numeric GPU material parameters and shared
batch submission. A single solid fill uses the existing neutral solid paint.
The CPU vector color-raster route is removed. Public raster helpers for explicit
other consumers remain available. Saved data, validation, detached load snapshots,
AI workflow and camera scheduling are unchanged.

| Same-machine full-document observation |    Baseline |     Current |
| -------------------------------------- | ----------: | ----------: |
| Complete projection/readiness          | 18,437.6 ms | 10,340.5 ms |
| CPU color raster allocations           |         910 |           0 |
| CPU raster pixels                      | 142,851,583 |           0 |
| Longest load main-thread task          |   12,234 ms |    5,086 ms |

The observed total load reduction is 43.9%; this is not a CI time guarantee.
The remaining 5.1-second task and approximately 10.3-second complete load are
real limitations. Do not describe this as instantaneous or fully nonblocking.
The scoped change does not remove data admission or canonical restoration costs.

The original ZIP SHA-256 remains
`e71192d9f90762ade11e359ad8ab5d2d16e42c58e61ed61873520b9786333805`.
The uncompressed fixture digest remains the manifest's
`2339ba31dfc70324f866a2049db69eaff41593a71a9072ec4f0e241eb77aa480`.
Baseline and candidate canonical saves both hash to
`0b5773e3d2127cb50870376dd754deb82441bd15294935403e41c09bc861877e`:
18,287 elements and 381,294 properties. Full-fit and native 1:1 details at
0.15, 0.50 and 0.85 height were inspected. No page errors or source loss occurred.
Evidence: `tmp/document-load/baseline` and `tmp/document-load/load-final`.

| Continuous native input at 120 Hz, same distance/duration | Baseline submissions/s | Current submissions/s |
| --------------------------------------------------------- | ---------------------: | --------------------: |
| DPR 1 pan                                                 |                  60.00 |                 60.02 |
| DPR 1 zoom                                                |                  59.20 |                 59.39 |
| DPR 2 pan                                                 |                  59.81 |                 60.04 |
| DPR 2 zoom                                                |                  59.41 |                 59.60 |

Both versions had zero interaction long tasks and zero geometry upload bytes.
Candidate submissions use 9 draw calls instead of 72. Idle performs no draws.
The 60-Hz input run still records the DPR-2 zoom 47.21/s result discussed above;
the denser-input comparison does not erase it or explain browser event scheduling.
It establishes sustained near-60 submissions when input is available, not a
guarantee of 60 physical display presentations or an absence of all frame spikes.
The local harness retains both input cadences. Evidence:
`navigation-baseline-current`, `navigation-comparison-current`,
`navigation-baseline-120-fixed` and `navigation-candidate-120` under local
document-load artifacts. The first alternate-service run loaded no fixture
because its backend used a different directory; it is failed harness evidence,
not a product timing. Only the frontend working directory now switches, keeping
the ordinary isolated test backend and fresh document identity together.

Applicable local gates passed using the unchanged-source results from
`tmp/local-validation/284b0c25-7a9a-4ddd-b3be-eb51b686e763` plus
`tmp/document-load/local-continuation2`. The only repair between those runs was
regenerating the Inspector workspace catalog; file hashes verify the reused
runtime inputs. Covered dependencies, declarations, shared checks, complete
selected App/package lint/build/tests, FieldScope profiles, collaboration
(14 passed, 3 conditional skips), functional E2E (382 passed, 18 conditional
skips), and render contracts (3 passed). No flaky retries were used. The final
local-only measurement and release/document edits receive separate focused
validation; product runtime and proof files remain byte-identical.

Navigation and coverage Inspector source proofs are eligible with complete
product cases. Assessments: `92a1e667-1b2a-4789-9099-443593831b8e` and
`18db4ffb-1daa-4edd-afb0-1c7a059495de`. Both use runtime source digest
`650e76ad14d57cf0aa4dd4518f7d365b0d0c2e71cd5d3ee3470c674c4d5988dd`.
Real-engine tests cover all four gradient modes, alpha, hard stops, holes,
retained edits, batch toggling, mixed ordinary Graphics and material meshes,
and camera work counts. Pixel oracles run in WebGL; WGSL compilation is checked
only when a WebGPU adapter is available, not claimed as WebGPU visual parity.

### Decisions and alternatives

- Chose unified topology plus analytic GPU paint over expanding floating-point
  eligibility exceptions or keeping a per-pixel fallback. This eliminates the
  area-dependent CPU work without lowering resolution.
- Preserved load snapshots and data format. Removing isolation copies or
  migrating storage would need a separate evidenced owner change.
- Applied the user-approved angular/diamond control-point semantics. Old
  nonlinear fills can change where prior routes disagreed; the full 101 is linear.
- Corrected actual engine extension registration, alpha batching and the
  read-only Pixi Mesh batching-property handoff after permanent real-engine
  regressions exposed them. Did not accept mesh-only batching proof as sufficient
  for the actual interleaved stroke consumer.
- Kept machine-specific load and navigation measurements local-only. Correctness,
  exact source preservation, invalidation and work counts remain formal tests.
- Kept test process ownership and cleanup. Original user files and site data
  were not reset. No dependency, environment upgrade or remote operation occurred.
