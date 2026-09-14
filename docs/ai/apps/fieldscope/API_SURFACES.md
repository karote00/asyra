# API surfaces

- `FarmConfiguration`, `DEFAULT_CONFIGURATION`, `validateConfiguration`, and `configurationSite` own editable dimensional inputs and validation.
- `createLayout` and `createStructure` own bay strips, passages, and greenhouse steel members.
- `createDrainProfile` owns the cross-section used by both the 3D projection and the section diagram.
- `createSupportAssembly` and `createPlantingNet` own poles, crossing joints, rails, mesh strands, and cable ties.
- Crop domain APIs own reusable cultivar variants and deterministic planting positions; see the water/crop specification.
- `buildSiteMeshes` returns the configuration's complete engine-neutral scene. View projection only changes visibility and presentation.
- `spatialV0` and capability `farm.spatial.v0` are app-owned render contracts, not a public framework or persistence format. Mesh data must pass `readSpatialDescriptor` before rendering.
- Runtime configuration methods are the only UI write route into Core history. Camera and view operations do not add history entries.

Cross-package imports use public `@asyra/*` facades. Do not import another app's runtime or renderer.

## Robot design APIs

- `RobotConfiguration`, `DEFAULT_ROBOT`, `validateRobot` own the M2 design schema.
- `assessRobotDesign` combines A's necessary lane and energy screens. A missing
  lane is explicit `null`; no alternative lane is chosen. Its immutable `route`
  exposes B's completed positional A input for fresh synthetic survey admission.
  Missing identity or invalid interval makes both route and lane null; D does not
  resolve strip IDs again. The route is not motion clearance.
- `FarmRuntime.getRobot` / `subscribeRobot` expose the current stable read report.
- `patchRobot` dispatches the registered one-shot Feature and merges against the
  latest canonical settings inside the session queue. Failed admission does not
  mutate state or history. Existing `undo` / `redo` replay both document owners.
- `focusRobot` is a presentation-only camera action; it starts no simulation.
- `createRobotModel` and `RobotProjection` produce admitted concept geometry with
  a definition-scoped lifetime. `export-robot-review.mjs` exports the same model
  for optional Blender inspection; exported artifacts are not loaded by the app.

## Canonical scene source

- `CropModel` retains source triangle ownership for fruit body/detail, synthetic
  tomato distal pedicel and later surface hairs; near/distant representations
  preserve the same fruit ID and original geometry/materials.
- `SiteGeometry.prepareScene` composes immutable source metadata, installed plant
  and fruit identities, transforms and the complete pre-visibility scene. Existing
  cultivar and planting outputs are reused; empty populations create no cultivars.
- C source products carry immutable `SourceRegion` partitions of the original
  index buffer. `readSourceRegions` admits complete, ordered, unique ranges and
  detaches mutable callers. `sheet` has no enclosed material; `closed-solid`
  requires source closure evidence; `open-shell` preserves unresolved closure.
  Boxes declare closed regions, while original uncapped tubes, botanical poles,
  hairs/spines and unwelded cylinder seams remain open-shell. Original film,
  foliage and calyx faces are sheets. No triangles, caps or thickness are added.
  `SiteGeometry.primitive` retains shape and regions as one completed product;
  scene, cultivar near/distant, robot rig and installed dock retain that metadata.
  These declarations do not decide ray visibility, origin occupancy or contact.
- `FarmRuntime.getScene` reads that completed source without work;
  `isCurrentScene` rejects a retired source. Canonical farm changes replace the
  revision and disposal closes access. Camera, visibility and robot design changes
  do not rebuild the farm source. Robot definition evidence remains a separate
  owner input for later working-pose integration.
- These APIs are app-local transient geometry handoffs, not a sensor, clearance,
  persisted format or implemented harvesting session. D's adapters own observation
  and swept-motion admission against this source.

## Synthetic working-rig source

- `prepareRobotRig` binds the unchanged robot source to the approved five-joint
  synthetic chain, with rest pivots, tool axes, bounds and rate metadata. It
  rejects an unsupported full lift stroke without altering parked geometry.
- `evaluateRobotPose` returns immutable candidate rigid transforms and tool/chain
  frames. Joint limits are validated atomically; it does not plan reach, advance
  time or admit collision clearance. Source buffers are reused across poses.
- `FarmRuntime.getRobotSource` reads the completed definition product;
  `isCurrentRobotSource` tests its lifetime. `evaluateRobotPose(source, joints)`
  rejects retired handles or unavailable rigs. Definition changes and disposal
  retire source handles; dock, mission, camera and farm edits preserve them.
- D must consume this same source for later IK, approved rate checks, swept
  collision queries and retention. These read APIs start no harvesting motion.

## Installed dock source

- `FarmRuntime.getDockSource` returns the immutable `DockSource` revision and
  installed station meshes also used for rendering. `isCurrentDockSource` checks
  owner-issued handle identity. Dock relocation and disposal retire the handle;
  unchanged placement preserves it across robot definition and mission changes.
- Distinct platform, charger, contacts and exchange stand reuse their original
  admitted shapes. Reads and relocation do not regenerate geometry. Bounds and
  route annotations are not physical station meshes. These APIs admit no support,
  electrical contact or movement clearance.

## Dispatch admission source contracts

- Composition issues a `CanonicalMission` receipt for one completed B/farm/C
  update. `prepareMission` checks receipt/source currentness, detaches canonical
  data and issues an immutable prepared product. Copied prepared products are
  rejected even when they retain an authentic receipt.
- `admitDispatch` validates explicit synthetic evidence at simulation seconds,
  obtains fresh A screens using B's completed route, and requests the required
  dispatch/return movement coverage through an injected query owner. Source
  handles retain C's original identity; no geometry is generated here.
- Evidence validity is [from, until). Query intervals have positive duration,
  end before evidence expiry and preserve dispatch-before-return order. Inputs
  do not renew themselves. Missing/unknown/blocked results hold admission and
  retain reasons; changed currentness during a query rejects the result.
- The returned decision creates no run and is not a physical safety certificate.
  This contract has formal tests using real C products and explicit query doubles;
  the actual swept provider, session clock and normal UI wiring are subsequent
  owners. No default clear provider is installed.

## Session clock foundation

- `HarvestSession` receives a composition canonical receipt and privately prepares
  the mission. `start` accepts only generation-bound dispatch evidence and runs
  admission internally; accepted-result objects cannot start a run.
- Explicit `advance`, `pause`, `resume`, `cancel` and fault acknowledgement own
  transient domain state. Time is in seconds; paused time cannot accumulate as
  active progress. Crossed deadlines coalesce to one pending patrol. Clock changes
  never create physical motion or renew a movement query.
- Resume requires a distinct async provider bound to the current paused snapshot,
  run, pose, held offsets, remaining intent and run-bound evidence. Accepted results
  preserve these values; held/fault/stale results cannot unlock motion. Source
  retirement closes the same generation even after a clock change or provider
  rejection. Cancellation and replacement protect their successor generation.
- `replaceMission` and `dispose` are synchronous internal composition lifecycle
  notifications. Replacement validates before retiring a valid run; the same
  current receipt is a no-op. External queued intents require their generation.
- Reads return the same immutable snapshot, and transitions use immutable links
  rather than copying accumulated history per tick. This foundation has no Core
  transaction, timer, real movement provider or UI session controls. Action-driven
  poses, actual picking/charging and real provider composition remain next.

## Shared query geometry source

- `QueryGeometry.prepare` consumes a composition-issued `GeometryReceipt` binding
  current C scene, robot and dock handles from one update. Required owner predicates
  validate receipt identity and all handles before preparation and publication.
- Its immutable `GeometrySource` shares original near shape buffers, descriptors,
  fruit partitions/plant bindings and robot body ownership. Only farm dimensions
  are removed; robot source contains no route annotation. No source generators run.
- `read` and `placePoint` reject copied/retired products; `clear` retires the product.
  Unchanged current receipts reuse preparation. `placePoint` composes source
  instances before installed descriptor transforms for farm/dock geometry; robot
  parts remain chassis-local and require later session base/joint pose inputs.
- This source API makes no observation, contact-policy, quality or clearance claim.
- `GeometryMesh.prepared` is the immutable completed local shape/non-sheet-region
  bounds product. Shape bounds share original shape identity; region products
  additionally share original region-array identity. `GeometrySource.work` records
  cold source position/index visits. Same current receipt reuses the product;
  replacement, retired reads and clear end its owner-held lifetime. Dynamic ray
  and pose inputs consume it without source-bound preparation.

## Near-source ray evidence

- `RayQueries.query` consumes the issued current `GeometrySource` and a detached
  `RayBatch`: synthetic simulation time/validity, current base/joints, explicit
  leaf source-pose/all-fruit-attached state and bounded finite rays. It advances
  no clock and runs C FK once per batch without source generation.
- Results preserve nearest original mesh/instance/triangle and metre distance,
  within-range miss, or unknown. Region-local source semantics distinguish sheets,
  closed material and unresolved open shells; opacity does not grant passage.
- Hits additionally expose the selected/refined conservative `distanceBounds`;
  the existing `distance` remains its display midpoint. Shared `prepareQueryFrame`
  and `transformQueryDirection` consume admitted rigid inputs and reuse the same
  conservative coefficient inverse without a second camera transform algorithm.
- Geometric unknowns may include one ambiguous triangle or two overlapping
  nearest candidates as immutable representative witnesses, with original source
  identity and conservative distance intervals (or explicit unbounded distance).
  They explain uncertainty without implying exhaustive coverage or clearance.
- Arithmetic bounds cover normalization, inverse placement and predicates;
  finite point inputs alone may use bounded exact dyadic proofs, including exact
  rational nearest ordering. Non-point uncertainty is never replaced by a rounded
  centre. Work counts include source/region preparation and exact predicates;
  source-local bounds come from QueryGeometry's completed product. Ray results
  and world-vertex copies are not cached.
- This geometry evidence is not fruit detection, quality, optical calibration,
  a swept-motion result or an implemented harvesting action/UI workflow.

## Injected target observation admission

- `TargetObservations.admit` consumes a composition-issued `ObservationContext`
  tied to the real HarvestSession snapshot and its actual canonical mission plus
  current GeometrySource. Required context/mission predicates have no permissive
  defaults; composition must prove the run-to-mission relationship.
- `TargetReading` is explicitly `synthetic-injected`, with an assumption label,
  target/run/generation/source revisions and finite explicit validity. Admission
  clones once, validates that snapshot, preserves nulls and returns immutable
  target assumptions only after currentness is rechecked. Valid earlier readings
  can be admitted at the current snapshot without extending their expiry.
- Coverage is a declared visible/total sample count; zero total has no coverage.
  Pose, maturity, target-scoped pedicel/cutsite, corridor and independent
  spine/calyx/distal-pedicel/contact-damage fields remain assumptions. Source membership checks
  validate identity without filling them from hidden scene truth.
- This helper changes no session, clock, inventory or action state. It rejects
  support/cut/retention/placement confirmations and additional undeclared claims;
  later viewpoint and expected-action owners must provide their own evidence.

## Synthetic quality-evidence assessment

- `TargetObservations.assessQuality` admits one current target reading, then returns
  the admitted observation, per-dimension requirement interpretations and overall
  synthetic requirements status. Physical integrity remains unverified.
- `quality.pedicel` is required (`intact`, `lost` or null), independently of calyx,
  stem recognition and cutsite. This transient input extension requires callers to
  supply explicit null for unknown; missing fields reject, with no disk migration.
- Cucumber uses spines; tomato uses calyx and distal pedicel. Contact damage is
  separate. Unrelated dimensions are not applicable to requirements but remain in
  the reading. Unknown cultivar leaves overall unknown without consulting C truth.
  Known-crop failure is reported alongside any other unknown dimensions.
- No market grading, placement permission, action confirmation, post-pick retention
  proof, session mutation, query, source generation or additional ledger occurs.

## Synthetic viewpoint samples

- `TargetObservations.view` uses the same actual-run context and a
  `synthetic-viewpoint` request at the current snapshot time. Explicit candidate
  IDs, sample count and camera pose/slopes/range are assumptions, not detections
  or hardware calibration. The adapter selects evenly spaced original near
  triangle centroids with a 64-ray computation cap, preserving plant/instance and
  partition identities.
- Each output keeps the requested source sample and actual ray result separate.
  Visible means this computed camera ray hit some surface of the target, not that
  the intended triangle/pedicel is visible. Non-target occlusion requires hit
  upper distance strictly before sample lower distance; rear/overlapping hits and
  misses remain unknown. Requested-point distance encloses endpoint subtraction
  before the norm; frustum eligibility follows the actual computed floating ray.
  Owned result containers are frozen without freezing the composition context.
- Coverage counts only declared samples; no maturity, quality, anatomy or action
  readiness is inferred. Current session base/joints supply the robot pose in the
  existing world-aligned, empty-held/all-attached foundation. Missing leaf or fruit
  state remains unknown. Camera inverse prepares once, eligible rays share one
  batch/FK and completed bounds, and no source or session state is regenerated.

## Static source surface pairs

- `SurfaceQueries.query` consumes an issued `GeometrySource` and clone-once
  `SurfaceBatch`: source-bound mesh/instance/triangle ordinals, synthetic time and
  validity, explicit robot base/joints and leaf/fruit state. Original immutable
  mesh/region/triangle witnesses remain in each result. Sources must be current
  before work and before publication; invalid reference/schema rejects atomically.
- Results are `surface-separated`, `surface-intersection` or `unknown`, never
  body-free, occupied-volume-free, allowed-contact or movement-clear. Nested
  solids can have separated surfaces. No joint, tire, same-body or tool-target
  exemption exists; source geometry and harvest quality remain separate.
- `prepareQueryForwardFrame`, `prepareQueryInstanceFrame` and
  `transformQueryPoint` share the existing query owner's conservative original
  coefficient arithmetic. The selected vertices retain interval uncertainty;
  singleton exact dyadic predicates do not promote rounded world points to exact
  geometry. Original inverse/ray predicates are unchanged.
- Frames and one required FK are prepared per batch. `SurfaceWork` accounts for
  selected vertex visits, frames, axes and exact predicates; no shape/region
  bounds or C geometry is rebuilt, and no result/pose cache survives the batch.

## Continuous translation surface pairs

- `SurfaceQueries.sweep` consumes a clone-once `SurfaceSweepBatch`: original
  source-bound pairs, start pose, each surface's world displacement, and a shared
  closed `[from,until]` interval. Displacements are not velocities or changing FK
  poses. `validFrom <= from < until < validUntil` covers both movement endpoints.
- `source-pose-throughout` means the selected original local leaf shape remains
  fixed except for its declared rigid translation; it does not claim the leaf
  remains world-stationary. Additional unknown movement/deformation stays unknown.
  This synthetic pair assumption does not certify real or unselected leaf motion.
- `swept-separated` requires continuous common-time exclusion, not separated
  endpoints. `swept-intersection` requires a common guaranteed or exact contact;
  other cases stay `unknown`. Original witnesses and static shared preparation
  remain intact. No volume, rotation, full-body or contact allowance is implied.
- Readonly contact fraction/time bounds enclose one supported occurrence, not
  necessarily the earliest contact. Their midpoint is not a confirmed pose.
  Existing scalar arithmetic and complete static axes provide interval/exact
  time constraints; one required FK, zero bounds/source regeneration and no
  persistent cache remain the batch work contract.

## Whole-source translation surface coverage

- `SurfaceQueries.cover` consumes a clone-once `SurfaceCoverageBatch`, with fixed
  joints/base heading, one robot world displacement, explicit empty-held and
  throughout scene assumptions, and a nonnegative safe-integer predicate budget.
  Every robot part pairs with every physical environment instance; every distinct
  robot-part pair is included, even within one rigid body.
- Safe integer inventory precedes traversal. Original prepared local bounds feed
  conservative query-local swept placement bounds, computed once per placement.
  Strict bounds exclusion covers the corresponding complete triangle product.
  Surviving mesh pairs refine exclusion through complete original region spans;
  exact source-region identity selects existing prepared bounds, while unprepared
  regions retain the mesh bound. Query-local swept region bounds are reused per
  placement, never rebuilt as local source products. Remaining region pairs consume
  the unchanged continuous predicate within budget, in source region/triangle order.
- `coverage` accounts for excluded, queried and unvisited triangle pairs, with
  intersection/uncertain query counts. `complete` means no unvisited pairs,
  including exact-budget completion or zero-budget strict exclusion. At most one
  intersection and one unknown witness retain original source identities.
  An incomplete report may establish an intersection but never separation.
- These are surface relations, not movement permission, volume occupancy or
  intended-contact admission. Open-shell interiors, retained fruit, support and
  joint/tool contact obligations remain explicit; no spine/calyx quality follows.
  One FK, shared frame preparation, zero local bounds/source regeneration and
  bounded predicate work are reported without persistent caches. `regionPairs`
  counts broad-phase region comparisons; `regionPlacements` counts transformed
  prepared-region products, with their corners included in `boundsCorners`.

## Joint-segment candidate evidence

- `JointSegments.assess` consumes current issued query geometry and a labeled
  transient `JointSegmentInput` with start/end joint values and from/until times.
  Clone-once validation rejects malformed or nonpositive intervals.
- Scalar q(t) is linear over [0,1], without angle wrapping. Original rig limits
  and speeds determine per-axis checks; exact dyadic comparison preserves equality
  and rejects proven exceedance without rounded quotient admission. Per-joint
  `checks` separately report limits/speed as within/outside; `work` counts evaluated
  joints and exact comparisons. Future planners must submit generated intervals to
  this owner rather than treating a rounded duration estimate as admission.
- The immutable source-bound result is admissible/invalid candidate
  evidence only. QueryGeometry rejects unsupported rigs before source issuance;
  this helper accepts only its current issued source. No FK, source/query generation,
  session update, TCP reach, collision/contact clearance or motion permission is
  implied; no new acceleration limit or persisted schema is introduced.

## Canonical FK algebra

- `evaluateRobotDomains` consumes original rig metadata, clone-once numeric
  `JointDomains` and a pure `KinematicAlgebra`. Domains are exact-key finite ordered
  lower/upper pairs within rig limits, validated before callbacks.
- The original `evaluateRobotPose` and the generic entry share one C chain. Point
  bits, signed zero, original validation and source/reference ownership remain
  unchanged; no new source graph or geometry is constructed.
- Algebra range/literal/arithmetic/sin/cos operations own scalar interpretation.
  Generic C evaluation does not certify a numerical adapter, time correlation or
  articulated clearance. Result containers are immutable; foreign scalar objects
  and rig references are not recursively frozen. Existing consumers own currentness.

## Shared scalar arithmetic

`domain/scalar-arithmetic.ts` owns the existing scalar implementation; the supported
`simulation/query-arithmetic.ts` import path directly re-exports the same functions
and `Interval`/`Dyadic` types. Public functions remain `interval`, `add`, `subtract`,
`multiply`, `divide`, `squareRoot`, `dyadic` and `fractionInterval`. Both paths share
function identity and one private module state. This extraction changes neither
rounding/uncertainty nor exact conversion behavior, and supplies no new trig or
movement guarantees. C may depend on this domain owner without importing D.

## Bounded polynomial scalar evidence

- The shared domain scalar owner adds `roundFraction(numerator, denominator, mode)`
  with `nearest-even`, `down` and `up` rounding. It rejects invalid/oversized inputs;
  directed or nearest overflow follows binary64 rounding. The old query facade
  exports no new function and retains all original arithmetic behavior.
- `domain/kinematic-trigonometry.ts` adds `evaluatePolynomialTrig(kind, input)` and
  `boundPolynomialTrig(kind, interval)` for `sin`/`cos`, using fixed S19/C20 on
  finite |x| < 1. Results expose `value` or `bounds` plus immutable per-call work;
  interval input is cloned and validated once. Work records evaluations, terms and
  maximum temporary BigInt width, without a persistent ledger or result cache.
- Values are rounded exact polynomial approximants, with analytic error bounds
  separately proved. They are not current C point trig, hardware parameters or
  movement evidence. The 24000-bit and four fixed profile batch limits in the
  specification apply before integration with any C/D consumer.

`roundFraction` also accepts an optional synchronous read-only `onWidth(bits)`
observer for actual guarded BigInt widths. It retains its numeric result; the
polynomial owner accumulates only its own per-call work. Reject a non-function
observer before work; observer exceptions publish no result. Conversion state is
call-local, including during observer reentry, with no global counter or mutation
of caller-owned objects. The observer changes no rounding decision.

## Completed robot affine pose

`evaluateRobotAffinePose(rig, joints)` calls the original point evaluator once and
returns its `pose`, `parts` carrying the same source/body/transform references plus
an immutable `affine` frame, and `work` with `fk` and `matrices`. Each affine has a
row-major 3x3 `matrix` and the original transform `position` reference. Matrices
are computed once per actual unique transform reference and reused by matching
parts; no retained pose cache is introduced.

Coefficients follow installed Three Matrix4.compose's final raw quaternion/unit-
scale operations. They are affine coefficients, not a promise of exact rigid
orthonormality. The old point API and tool outputs remain unchanged; new matrix
coefficients need not reproduce old point multiplication bits. Runtime/render/D
adoption is not part of this preparation entry.

## Robot-body query affine adoption

Ray and surface queries obtain one `evaluateRobotAffinePose` result and consume
its completed body matrix coefficients and translation. `prepareQueryAffineFrame`
prepares forward singleton-coefficient frames; `prepareQueryAffineInverse` prepares
true cofactor inverse frames from the same coefficients;
matching C affine identities share preparation within a batch. `RayWork` and
`SurfaceWork` add `bodyMatrices`, forwarding C's actual conversion count, while
`fk` forwards its actual point-evaluation count. No persistent identity changes.

Base/camera/farm/instance frames and all existing numerical predicates remain
unchanged. This is robot-body CPU coefficient adoption only; it does not certify
GPU arithmetic, the entire world transform pipeline or articulated interval FK.

## Canonical point polynomial model

The implementation keeps point/affine signatures and return shapes. The C
number adapter consumes shared S19/C20 nearest-even results on actual rounded
half-angles, preserving other operation order and completed source identities.
No model-selection API or new work field is needed. Direct tests observe actual
shared trig calls/results: eight per point evaluation; an affine entry includes
one point evaluation and the existing actual unique-matrix work. Historical
Math-trig snapshots describe the preceding model, not current compatibility.
RobotProjection/bootstrap and D affine queries are real consumers of this change;
no renderer, base/camera schema or query predicate migration is included.

## Joint-domain interval pose

`evaluateRobotIntervalPose(rig, domains)` returns the original `rig`, an immutable
interval `pose` (including detached admitted domains, frames/tool/part transforms),
`parts` with original source/body references and shared completed affine intervals,
and call-local `work`. It encloses canonical point results for all admitted
binary64 tuples in the closed domain box; it does not encode a time trajectory.

`work.fk` counts the completed chain evaluation, `matrices` counts actual unique-
transform conversions, `scalarOperations` counts add/subtract/multiply/divide
invocations across chain and affine preparation, and `trigCalls` counts directed
polynomial queries. `polynomialEvaluations`, `terms` and `maxBigIntBits` forward
actual shared polynomial work. No numeric point re-evaluation or cross-call cache.
Invalid domains and scalar exceptions abort publication; unbounded intervals are
unresolved evidence, never finite clearance. Rig/source currentness belongs to
the eventual composition/query consumer. The existing point/affine APIs retain
their numeric bits and signatures through the shared generic affine formula.

## Joint segment point-time domains

`JointSegments.enclose(source, rawSegment, window)` internally calls the existing
segment assessment once and accepts only its admitted detached input. Window
fields are `queryFrom`, `queryUntil`, `validFrom`, `validUntil`; they are finite,
nonnegative, independently cloned once and validated against the closed segment
and half-open validity. The result preserves `source`/`segment` identity, frozen
`window`, endpoint `start`/`end` joints, closed `domains` and `work` containing
actual `pointEvaluations`, `conversions` and `maxBigIntBits`. A singleton window
reuses one endpoint tuple; declared segment endpoints need no rational conversion.

Interior point joints use exact dyadic barycentric interpolation followed by one
shared nearest-even conversion. Domain extrema enclose the rounded point model;
existing ideal-linear speed checks remain separate. No C/FK or surface work occurs.
The result is evidence, not an authorization token; invalid/stale inputs or
resource failure abort publication, and no cache or source clone is introduced.

## Robot source point-time bounds

`RobotMotionBounds` in `simulation/motion-bounds.ts` takes the existing QueryGeometry
owner. `enclose(source, rawSegment, window, assumptions)` internally admits the
segment/window through JointSegments.enclose once and evaluates one C interval
pose. MotionAssumptions requires source='synthetic', a nonempty assumption, an
explicit fixed-pose base RigidTransform, rigid-source-shapes-throughout and
empty-held-throughout. Inputs are detached before validation; fixed base admission
retains the existing collision finite-slot/norm policy without normalization.

The immutable result retains source/domain/pose and detached assumptions, plus
all robot mesh/part and original region references. Each envelope is bounded with
finite min/max or unresolved. Region provenance is region-bounds when its original
prepared region exists, otherwise mesh-envelope with the shared original mesh
bound result. No source geometry is scanned or copied. Original C interval affine
then existing base/query application order is preserved. Work includes the actual
nested motion/C work, parts, regions, envelopes, corners and baseFrames. Products
are shared only for the same affine/local-bounds identities within this request;
source is checked again before publication. The result does not cover environment
surfaces or authorize material, collision, contact or movement outcomes.

## Point-time surface domain exclusion

`SurfaceQueries.coverMotion(source, rawSegment, window, robot, environment)`
classifies the complete original robot/environment and distinct-part robot
triangle-pair domain for one closed joint-motion window. `environment` is a
clone-once `MotionEnvironment` with an explicit synthetic assumption, full-window
source-shape, source-pose, leaf and attached-fruit declarations, and nonnegative
safe-integer mesh/region comparison budgets. Any recognized unknown environment
state returns the whole domain as unvisited with `motion: null`; it does not admit
or validate the unused motion inputs.

Known environment state invokes `RobotMotionBounds.enclose` exactly once with the
original current source and raw motion inputs. Robot mesh/region envelopes are
reused from that completed result. Stationary environment placements use the
existing descriptor/instance frame order and prepared local bounds, with
unprepared regions retaining their whole-mesh envelope. The shared coverage
inventory and mesh-pair traversal are the same producer used by
`SurfaceQueries.cover`; no full pair array, triangle predicate, source-buffer scan,
or persistent cache is introduced.

The immutable result reports complete `inventory`, `motion` evidence or `null`,
and an exact partition of triangle pairs into `excluded`, `candidate`,
`unresolved` and `unvisited`. Only strict separation of finite whole-window bounds
excludes a domain. Finite survivors are candidates, nonfinite compared products
are unresolved, and budget remainders remain unvisited. `surface-separated` is
reported only when every pair is excluded; every other result is `unknown`.
Neither result is movement clearance, material occupancy, intended-contact,
support, or retained-quality evidence.

## Material source and intended-contact evidence

`SourceTriangleRange` is a triangle-aligned `[indexStart, indexCount]` span.
`SourcePatch` has one nonempty source-local id, one exact admitted `SourceRegion`
reference and one or more ordered in-region ranges. `readSourcePatches` detaches
mutable range input, rejects ranges outside the referenced region, duplicate ids
and forged region references, and returns immutable patches. Patches select
original triangles and do not change region occupancy.

Each robot and dock part carries immutable patches issued with its regions.
`RobotRig` adds immutable `bodies` and five `interfaces`. Every
`RobotBodyAssembly` owns one body id and all exact rig-part records for that body.
Every `RobotJointInterface` retains its joint id, parent/child assemblies, exact
parent/child patches, existing domain and joint frame, and a finite local envelope.
Crop models retain exact per-fruit main-skin patches separately from their existing
partitions and detail regions. RobotProjection, SiteGeometry and QueryGeometry
preserve these exact objects and reject missing, duplicated or retired metadata.

`MaterialContactQueries.evaluate(source, request)` owns the call-local D
classification. `request` contains the raw joint segment/window, a detached
synthetic declaration with a fixed-heading linear base path, full-window
rigid/source-pose/attached-fruit state, a positive finite subdivision budget, and
optional exact current support and fruit selections. Exact source, mesh, region,
patch and fruit references are
validated separately and never replaced by cloned lookalikes. The method internally
runs JointSegments/RobotMotionBounds once and never accepts caller proof output.

The query lifts completed C affine coefficients and original source vertices into
one dyadic frame chain before transforming points. Surface loci, closed-patch
attribution, supporting halfspaces, material SAT and sweep start geometry share
that exact representation. Outward interval products may reject only proven gaps;
rounded world-point AABBs do not supply positive or negative material evidence.

The immutable result retains the original source and admitted domain, the detached
request, categorized joint/support/tool witnesses and actual source/FK/triangle/
subdivision work. `admitted` means every requested synthetic geometric obligation
is conclusive. A proven outside-interface or ineligible contact/penetration is
`blocked`. Missing, stale, open-shell-interior, exhausted-work or unresolved exact
evidence is `unknown`. No state authorizes movement, force, retention, cutting,
quality, damage or hardware safety.

## Scene-demand preparation

FieldScope persists one `scene-demand-configuration` entity at version 1. Its
route is either unknown or a stable farm soil-strip id, bay and longitudinal
interval. Evidence is unknown, measured by a stable survey id, or visibly
synthetic with a stable id and label. Growth is unknown or an authored set of
world- or plant-anchored exclusion boxes with complete or discrete coverage.
Clearance margin is unknown or an explicit nonnegative metre value. Production
defaults keep all four inputs unknown; the current farm's rough 1.2 m reference
is neither a default nor an admission gate. Invalid versions, ids, intervals,
points, duplicate volumes and margins are rejected before a Core transaction.

`prepareSceneDemand` consumes one validated farm and its completed current
`PreparedScene`. It resolves a selected soil strip once, retains original fruit,
partition, channel, mesh, region, installed-instance and transform identities,
and reports actual left/right target bounds and low/high reach witnesses. Its
constructive free-passage product is the route prism minus exact authored growth
and channel exclusions plus margin-expanded conservative source envelopes.
Installed source envelopes use outward interval transforms. Their overlap means
`exact-source-query-required`; it never claims a physical collision or blocks the
whole demand. A selected drain route or authored growth volume covering the route
is blocked. Unknown evidence, growth, margin, missing anchor or incomplete growth
coverage remains unknown.

`bootstrap` exposes `getSceneDemandConfiguration`,
`setSceneDemandConfiguration`, `getSceneDemand`, `isCurrentSceneDemand` and
`subscribeSceneDemand`. One accepted scene-demand settings action creates one
Core transaction and one W1 revision without rebuilding farm or crop source.
Farm/source and relevant scene-demand changes retire the prior revision; undo and
redo refresh from canonical owners once. Getters and subscribers reuse the same
retained product. View, camera, locale, layer and robot changes bypass W1, and
runtime disposal retires the product and unregisters the owner.

## Versioned walking source and pure kinematics

`walking-robot-definition.ts` owns the explicit
`walking-robot-definition/1` format and `four-arm-six-leg` topology. Its loader
requires four independent left/right support/cutter arms, six independent
left/right front/middle/rear legs, a bounded vertical carriage, complete stowed
and left/right working joint states, and separate measured or visibly synthetic
geometry, joint and mass evidence. The schema fixes SI metres, kilograms and
radians in a `+Y` up, `+X` robot-right and `+Z` route-rear frame. It derives body,
chain, joint and axis identities rather than accepting them from persisted data.
`createSyntheticWalkingRobotDefinition` is the only baseline factory;
`classifyWalkingRobotDefinition` identifies unversioned legacy definitions
without converting or mutating them, rejects malformed unversioned/current-format
objects as unsupported, and `readWalkingRobotDefinition` admits only the current
exact-key format.

`WalkingRobotSourceOwner.prepare` creates one immutable definition-bound source
and rig revision and reuses it only for the same admitted definition object. The
rig contains unique bodies and joints for all four arms and six legs, original
closed box triangle regions, six distinct foot patches, two soft-textile support
patches, two cutter-edge patches and separate cutter guards. Joint interfaces
retain their exact generated joint frame, axis and range. Concept joints without
an authored mating surface report `materialInterface: 'unmodeled'` with empty
patch references; they do not grant contact or collision exemptions. One
definition-bound mass product retains every body mass and local centre of mass
plus its explicit evidence identity. Every contact patch reference carries its
body-local frame, and source materials carry a separate visibly synthetic
evidence identity; measured geometry evidence is never presented as material
evidence.

`evaluateWalkingRobotPose` accepts one finite base transform and one complete,
in-range carriage, four-arm and six-leg joint state. It purely returns every body
transform once, original source references, arm/tool/foot/contact/inspection
frames, fixed-length link segments and transformed per-body centres of mass.
There is no free tool position, source regeneration, pose cache, sweep, gait,
contact decision, clearance, moment or hardware-safety result. Farm, W1, crop,
terrain, route, view and locale are outside these APIs and cannot resize or
invalidate this owner.

Walking runtime, rendering, crop forces and UI presentation remain pending
W5-W6. W3 and W4 consume this source through the domain APIs below.

## Walking terrain and whole-body interval admission

`readWalkingMotionRequest` admits the exact `walking-motion-request/1` schema,
detaches and freezes input, and binds the admitted request to its W2 source
object. All 35 joint values and six stance leg identities are required. Paths
interpolate scalars linearly between strictly increasing knots; base rotation is
heading about Y, then local pitch about X, then local roll about Z. Stance phases
partition the complete evaluation interval at path knots. Changed path or stance
semantics require a new gait identity. No runtime persistence or UI route is added.

`WalkingMotionOwner` consumes current W1 and W2 products through injected getters.
Their revision numbers are independent. It prepares immutable interval envelopes
for every original body part, swing leg, arm/tool, carriage and declared load,
then compares those envelopes with completed W1 passage and terrain products.
`read` shares the result without work; replacement of either upstream product
retires its currentness. A changed admitted request recomputes W3 without
rebuilding W1 or W2. Missing or incompatible evidence is `unknown`.

The load contract separates an explicitly unknown or source-part-based attached
crate from absent or attached carried fruit. W2's empty tray does not establish
crate coverage. Crate walls retain their own triangles and open cavity. Unknown
fruit geometry remains an identified load with an unknown result, not fabricated
bounds. Explicit partial source coverage keeps crate or fruit admission unknown.
Only original parts within the same W2 body, or source parts within the same
explicit fixed crate assembly, bypass relative-motion checks. Crate and carried
loads against their holders, different attachment assemblies, and different W2
bodies or joints receive no blanket exemption.

`prepareWalkingMotionIntervals` owns directed interval FK and complete segment
coverage. Strictly separated envelopes establish clearance; overlapping source
envelopes remain unresolved. Positive hard-exclusion witnesses use outward point
enclosures wholly inside an exclusion or wholly outside the route. Boundary
straddles remain unknown. W1 source margins are not applied twice. Interval or
pair budget exhaustion retains unvisited counts and cannot establish clearance.
Raw debris bounds are prepared once within each evaluation and reused across
body and interval comparisons, with separate preparation and vertex-work counts.
`evaluateWalkingTerrainContact` requires exact foot-patch, soil, path, time and
load identities plus complete geometry, friction, bearing and sinkage evidence.
Height, slope, rut and debris coverage are declared separately; an empty debris
list is not evidence of a complete debris survey.
Authored channels cannot support a foot, and an all-swing schedule is unknown.
Synthetic provenance remains attached to all evidence. Results report
`clear`, `blocked` or `unknown`; a blocked turn reports `no-turn`. Every result
retains `quasiStatic: 'pending-W4'` and makes no stability or safety claim.

## Walking quasi-static configuration assessment

`readWalkingQuasiStaticRequest` admits `walking-quasi-static-request/1`, detaches
and freezes it, and binds it to the current W3 opaque identity. Its motion
descriptor matches revision, source, terrain, path, stance and load identities;
W4 owns its own request ID. Support contacts and external mass identities bind
bijectively to one selected stance phase. Time is within that phase and the W3
evaluation; transition sides are separate assessments. Explicit unknown plane,
contact position, reserve or external mass remains unknown.

`WalkingQuasiStaticOwner` consumes only an injected current W3 product. It uses
`walkingMotionPoseAt` and one `evaluateWalkingRobotPose` call. The completed W2
binary64 pose is the configuration authority; subsequent CoM transforms, sums,
projection and moments use directed intervals. This does not enclose ideal-real
trigonometry or continuous motion, which remains W3's responsibility. Every W2
body mass, crate mass and carried-item mass enters the assessment once. Root and
shoulder moment contributors follow W2 joint ancestry; base crate mass does not
enter arm moments. No source mass or CoM override is accepted.

`mechanicsHull` uses exact dyadic orientation. Declared plane local X/Z axes
define support coordinates; local +Y must have a provably upward world component
for screening. Gravity-parallel or inverted planes yield unknown, not an
absolute-value correction. The gravity line is projected onto that actual plane,
and reserve-adjusted edge distances and true 3D edge moments decide the result.
Only strictly positive lower bounds screen a configuration; complete nonpositive
upper bounds or a degenerate polygon block it; interval straddles remain unknown.
The sole applied acceleration is standard gravity, 9.80665 m/s². Unknown reserve
does not become zero, and independently known projection or arm values survive.

`WalkingQuasiStaticAssessment` retains current W3, completed pose, exact time and
phase, configuration, support and load evidence, per-quantity known/unknown
values, and work counts. Left/right high reach, carried return and bilateral
work are distinct complete configurations. `screened` is a gravity-only
quasi-static screen, not dynamic, soil, actuator, structural or hardware safety.
Arm bending magnitudes are N·m comparison values without invented capacity
limits. W4 never changes W3 collision status. The W3 `pending-W4` field still
means that the W3 product itself contains no mechanics conclusion.

Repeated `read` or `prepare` with the same admitted request and W3 object reuses
the completed result; changing either invalidates it. Shallow-frozen raw input
does not qualify for reuse. Malformed inputs throw before work; no global cache,
new runtime route or UI integration is introduced.
