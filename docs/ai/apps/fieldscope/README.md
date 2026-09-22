# FieldScope

FieldScope is a field modeling, offline simulation, and robot monitoring
workstation for harvest robotics. Its scope covers cultivation environments,
harvest actions, and operational evidence; it is not tied to one crop or one
robot model. The name is a product proposal and does not claim trademark
availability.

## Current Stage Contract

`apps/fieldscope` builds a four-bay greenhouse with an Asyra CUSTOM provider and
Three.js. Completion criteria are proportional geometry, usable overview and
clip close-up camera views, layer display, a dimensioned cross-section, and
formal tests. Existing apps, framework APIs, unrelated Inspectors, and existing
active plans remain unchanged.

This stage does not run harvest simulation, produce robot safety decisions, or
connect to live hardware. Plastic film defaults to a milky translucent material
at 60% opacity, covers the four roofs and outer walls, and keeps end openings
clear. No internal membrane is added between connected bays. Layers and opacity
controls can reveal the interior.

There is no fabricated live telemetry, harvest count, plant damage score, or
stability score. The staged roadmap below is implementation guidance, not a
claim that those features already exist or start automatically.

## Dimensions And Assumptions

Scene units are metres. X crosses bays, Y points up, Z runs along bay depth, and
the origin is the left-front ground point. Defaults are four bays, each 7m wide,
50m long, and 5m high, for a total footprint of 28m x 50m = 1,400m². Component
counts and positions are derived from the current settings.

The confirmed per-bay strip width is 6.3m, not 6.6m:

`0.35 margin + 0.9 soil + 0.3 drain + 1.8 soil + 0.3 drain + 1.8 soil + 0.3 drain + 0.9 soil + 0.35 margin = 7m`

- 16 soil beds total 1,080m², 12 drains total 180m², and all boundary margins
  total 140m².
- Internal adjacent margins merge into three 0.7m passages. There are no black
  partitions or side-wall braces crossing those passages.
- Black rigid waterproof barriers exist only at the outer X=0 and X=28 edges.
- Shared posts sit on passage centerlines at X=7, 14, and 21. The 0.7m value is
  gross width between soil beds, not continuous robot clearance after posts.
  Robot passage has not been verified because robot dimensions are not known.
- Drains use a semicircular main channel with small rounded lips. Default width
  is 0.3m and the bottom is 0.15m below the bed surface. The model does not
  assume standing water, slope, outlets, turnarounds, or terrain settlement.

Unsurveyed modeling assumptions: eave height 3m, arches every 1m, posts every
5m, arch tube diameter 48mm, post diameter 76mm, post embed depth 0.4m, drain
depth equal to half the width, barriers 0.35m high and 20mm thick, and front and
rear openings of up to 2m wide and 2.5m high per bay. Openings are gaps in the
film and door frame; door panels are not modeled.

The circular arch uses half span `a=3.5m`, rise `h=2m`, and radius
`R=(a²+h²)/(2h)=4.0625m`. Center height is `5-R=0.9375m`; arch tubes and film
sections use the same arc formula. Each bay has 51 arches, for 204 total; five
shared post lines each have 11 posts, for 55 total. The structure includes arch
tubes, shoulder and ridge purlins, horizontal tie beams, roof braces, outer-wall
X braces, end frames, and connected-bay U gutters. Except for crop support cross
spring clips, bolts, tube wall thickness, foundations, and other fasteners are
not modeled. This is a parametric model based on structural principles, not an
approved construction drawing or wind calculation.

Crop support pipes follow the user-specified layout: each drain side has support
pipes 15cm into the soil, measured to pipe center. The pipe diameter is 20mm,
embed depth is 15cm, above-ground height is 3.15m, and total pipe length is
3.30m. Along Z, pipes run from 0.25m to 49.45m at 0.6m spacing, for 83 pipes per
row and 1,992 pipes across 24 rows. The front inset is 0.25m, rear inset is
0.55m, and full 0.6m spacing is preserved.

Because 5m beams do not align with vertical pipes, the model adds 24 Ø20mm
longitudinal connector pipes across the full 50m. Connectors offset 20mm toward
the soil side, have center height 2.966m, touch the underside of Ø48mm beams,
and touch the side of vertical pipes. The 1,992 vertical-pipe joints and 264
beam joints create 2,256 cross spring clips. Clip shape references user photos
and a cross-joint product image: two long arms pass behind the first pipe, while
the U bend and two free-end hooks grip the second pipe on both sides of the
crossing. Wire diameter 2.5mm and bend proportions are visual modeling
assumptions for 20x20mm and 20x48mm tube junctions; they do not claim factory
dimensions or verified holding force. The clip close-up targets the first real
interior joint and can hide crop support pipes to expose the wire shape.

The climbing net runs along 24 pipe rows from Z=0.25m to 49.45m. Net bottom is
Y=0.45m, net top is Y=3m, matching beam height, and vertical pipes extend 15cm
above the net. Mesh size is temporarily 15x15cm with 2mm cord diameter. The net
plane sits on the drain-facing side of the pipe. One tie is placed at net-top
height on each pipe, for 1,992 ties; each tie has a flat band, lock head, and
short tail. These are appearance and position models only; net sag and plant
loads are not simulated. Net and ties have independent layers and are produced
by the same support assembly output, with no regeneration during navigation.

References:

- <a href="https://www.an-ja.com.tw/product-detail-335582.html" target="_blank" rel="noopener noreferrer">An-Ja cross spring clip product page</a>:
  reference for the transverse and longitudinal arcs gripping crossed steel
  pipes. The product page dimensions are not asserted as this model's 20mm joint
  compatibility.
- <a href="https://www.moa.gov.tw/ws.php?id=13673" target="_blank" rel="noopener noreferrer">Taiwan Ministry of Agriculture greenhouse standard drawing overview</a>:
  background on module structures made from posts, beams, roof members, and
  braces, including round roofs and plastic-film greenhouses. This model uses
  that construction classification but does not inherit the old notice's legal,
  wind, or dimensional certification.
- <a href="https://book.tndais.gov.tw/Brochure/tech171.pdf" target="_blank" rel="noopener noreferrer">Tainan District Agricultural Research and Extension Station technical bulletin 108-1 (No.171)</a>:
  search metadata references steel-pipe plastic-film greenhouse drawings,
  single-bay and connected-bay drawings, and longitudinal purlin positions. The
  source PDF failed to load during the original work, so no detailed drawing
  parity is claimed.
- <a href="https://www.agriharvest.tw/archives/18812/" target="_blank" rel="noopener noreferrer">AgriHarvest greenhouse durability article</a>:
  background on facility scale, connected-bay drainage, and simple versus
  reinforced structures.

`domain/drain-profile.ts` owns the drain profile used by both 3D geometry and
the cross-section. For channel width `w`, lip radius is `r=min(0.01m,w/10)`,
main semicircle radius is `R=w/2-r`, center is `(w/2,-r)`, and channel bottom
depth is `w/2`. Quarter-round lips are tangent to both the bed surface and main
channel side. Lips stay inside the declared drain width and do not intrude into
soil or support-pipe placement. Each row extrudes the profile along the full bay
depth; end caps fill only below the profile curve, leaving the channel mouth
open. Foundation depth follows the deepest drain. A default 0.3m drain has main
radius 0.14m, lip radius 0.01m, and total depth 0.15m.

## Ownership And Update Boundaries

`domain/farm-configuration.ts` owns settings shape, defaults, and value
validation. `domain/greenhouse.ts` owns circular arch and frame formulas.
`domain/mesh.ts` produces engine-neutral triangle meshes.
`render-app/site-projection.ts` builds the scene once on startup, applied
setting changes, and history changes that alter settings, then freezes output
as admitted descriptors. Applying unchanged settings, empty history operations,
and camera operations do not rebuild geometry.

Scene settings use Core SceneTree's `farm-configuration` component and Props as
data owners. The app follows Asyra Design's Feature / `runTransaction` /
`undoWithRenderPolicy` / `redoWithRenderPolicy` pattern. The form is draft UI,
not a separate history stack. One Apply settings action validates and prepares
geometry first, then writes all settings in one transaction. Invalid input does
not write data, add history, or replace the scene. Undo and redo reproject from
canonical Props. Settings, view, and zoom each subscribe independently; typing
only updates the form draft.

Editable fields include length, width, height,
`strips: [{ kind: 'soil' | 'drain', width: number }]`, support-pipe distance
from drains, front and rear insets, pipe extension above beam, and net top and
bottom heights. The strip array supports add, delete, and reorder. Support pipes
are only placed on soil sides adjacent to drains; layouts may start with soil,
start with drain, or contain only soil. All heights are measured from the soil
surface. Distance from drains is measured to pipe center. Bay width minus total
strip width is split equally into side margins. Bay count is fixed at four.
Beam/eave height is 60% of total height, with the remaining 40% as arch rise;
rise must not exceed half-span width. Arches repeat every 1m, posts and beams
every 5m, and non-integer lengths fill the tail station. End opening half-width
is `min(1m, bay width/4)` and height is `min(2.5m, eave*5/6)`. Support-pipe
spacing is fixed at 0.6m with 0.15m embed depth; front inset starts the first
station, and rear inset is a minimum. Net top and bottom are separated by at
least 5cm, and net top cannot exceed the pipe top. Supported ranges are depth
2-200m, width 2-20m, height 2-10m, and 1-32 strip items, with at least 2cm side
margins and at most 20,000 support pipes per scene. These are editing and
rendering limits, not structural load or construction feasibility guarantees.

Buttons and Command-Z / Shift-Command-Z (Ctrl also supported) undo and redo
applied settings. Native text and number input shortcuts remain available;
camera and layer operations are not recorded in settings history. Apply, undo,
and redo reframe with the current camera direction. Save and load are not
implemented yet, so reloads return to defaults.

`runtime/bootstrap.ts` registers view and camera Features, managed runtime
properties, the CUSTOM provider, `core.registerRenderLayer`, and size
observers. Layer toggles flow through
`Feature -> latest view state -> Core system property -> SpatialLayer`. Opacity
and simultaneous layer updates read the latest state inside the Feature queue.
Camera state is transient presentation data; the camera Feature submits camera
projection only and does not mutate geometry or documents. These view operations
do not write document history.

Three.js exists only in app-owned `engine/`. `@asyra/render` and the custom
engine meet through the public `@asyra/render-engine` contract and do not import
one another. The custom provider command implementation, spatial descriptor, and
contract tests adapt the existing Asyra Sim Three.js adapter patterns without
copying its product data model, analysis pipeline, or workstation architecture.
No cross-app runtime import is added. If future users need a shared engine, that
can be evaluated as a separate package extraction.

The scene layer has `zIndex=0`. Core's demand-driven scheduler merges render
requests; there is no permanent animation loop. Camera operations do not notify
the control panel, reread the canonical document, or rebuild triangle geometry.
Layer and material updates reuse admitted shapes. Disposal cancels frames,
unsubscribes observables, clears ResizeObserver, unregisters the layer, releases
GPU resources, and resets Core runtime.

Camera behavior:

- Shift + left drag pans by the distance-to-pixel ratio at 100% for the current
  view. Equal drags keep equal scene displacement and do not slow down at higher
  zoom. Camera and target move together without rotation.
- Orbit uses the target at the viewport center after panning, preserving that
  position instead of resetting to scene origin.
- Every view can zoom to 10000% by narrowing the view angle rather than moving
  the camera forward, avoiding entry into pipe interiors near the clip view.
  Magnification combines camera distance and field-of-view projection.
- Command-1 (Ctrl+1 also supported) centers the full scene bounding box with at
  least 24 CSS px margins on every side. The fit includes base and hidden layers
  and does not rescan geometry per visibility toggle.
- Command-0 (Ctrl+0 also supported) restores the current view's baseline
  distance while preserving pan and rotation. 100% means the preset distance and
  field of view, not 1px=1m. Text editing does not intercept these shortcuts.
- Zoom numbers have an independent subscription and update only when percentage
  changes. Pan and orbit do not notify the layer panel. The bounding box is
  computed once on runtime build and setting changes; fit only projects its
  eight corners.

Layout behavior:

- The workspace has a layer panel on the left and settings editor on the right.
  Two icon buttons above the canvas toggle them independently.
- Panels collapse toward the outer edges. On desktop, column width changes free
  canvas space and ResizeObserver updates projection.
- Below 1100px, panels are overlay drawers, default collapsed, and opening one
  side closes the other. Panel content scrolls independently.
- Closed panels are hidden and inert, cannot receive keyboard focus, and respect
  reduced-motion settings.
- Collapsing panels does not unmount the editor or canvas, so drafts, scene, and
  history are retained. Panel open state is transient UI and is not recorded in
  Undo.
- Controls subscribe at point of use with `useSyncExternalStore`; there is no
  React.memo.

The baseline camera is determined only by current scene settings and view mode,
and is reused during camera motion.

After the canvas is focused, W/S moves forward/back along view direction, A/D
moves left/right in screen space, and E/Q moves up/down. Camera and target move
together, preserving view direction. Free flight has no avatar, gravity, or
collision. Movement speed is independent of optical zoom, target distance, and
preset view, starts at 6m/s, and Shift accelerates by 4x. The logarithmic speed
slider supports 0.01-60m/s; right mouse plus wheel also changes speed. Speed is
transient camera runtime state with an independent subscription and does not
rebuild geometry or write document/Undo state. Key input provides 1.5 direction
units per second; camera logic multiplies by `movementSpeed / 1.5` to convert to
metres. One key press uses 1/30 second movement, held keys use frame delta, and
multi-axis direction is normalized. Animation frames are scheduled only while
keys are held and stop on keyup, blur, window blur, page hide, and unload.

Ordinary wheel uses Dolly: target and FOV stay fixed, the camera moves by
`exp(deltaPixels * 0.001)`, and magnification is calculated live from distance
and FOV. Magnification is limited to 1-10000%, and distance cannot cross the
near plane. Shift multiplies wheel delta by 4; line/page deltas are converted to
pixels. WASD/Q/E keep camera and target moving together at metre speed,
independent of Dolly or optical zoom. Right mouse plus wheel changes only speed
with `speed * exp(-deltaPixels * 0.002)`. Alt + wheel and +/- preserve optical
zoom to 10000% and do not affect movement speed. Right drag looks from a fixed
camera position using world-up to avoid roll; left drag orbits target, Shift
left drag pans, arrow keys orbit, and Command-1/Command-0 plus settings
Undo/Redo remain. Text inputs do not intercept movement keys, and modifier
shortcuts do not start movement.

## Follow-Up Implementation Order

### 1. Editable Field And Replaceable Cultivation

Size, strip, net editing, and Undo/Redo are currently complete. The next
deliverable upgrades settings into a savable, versioned FarmDocument with plant
rows, supports, and travel preferences. Core SceneTree owns identity and
hierarchy, while Props owns validated domain data. All additions, adjustments,
and replacements go through Feature and app APIs so one user action maps to one
undo commit. Save/load uses app-owned version migration; geometry remains
derived output.

PlantingSystem should register trellis net, bamboo stake, bent metal frame, and
similar strategies. Inputs are soil beds, row spacing, supports, and plant
anchors; outputs are cultivation components and collision geometry. Plant
identity must survive support replacement. Plant position and travel strategy
must be separated instead of hardcoding soil, drain, or margin material as
walkable or blocked.

The 1914 cucumber and Jade cherry tomato profiles should start as independent
crop profiles with plant habit, support needs, spacing, mature fruit positions,
allowed harvest actions, and measured or pending mechanical parameters. Data
must include sources and uncertainty; generic vine values must not masquerade as
cultivar measurements. Acceptance: replace three support types, adjust planting
side, Undo/Redo, reject invalid dimensions, save/load round trip, rebuild only
affected bays/rows, and display the narrowest valid passage section.

### 2. Robot Motion And Offline Harvest Flow

Define RobotDefinition first: chassis shape, wheelbase, wheel diameter, mass,
center of gravity, arm joint axes and limits, gripper, cutter, and harvest bin.
GLB is appearance only; collision shells, mass, and joints are not inferred from
appearance. All poses use explicit coordinate transforms:
field -> chassis -> arm -> tool, with model version retained.

A path planner produces candidate routes, a kinematics solver produces arm
poses, and collision/clearance checks validate them. Choosing a passage or drain
checks width, height difference, turn space, and posts, not just centerlines.
The harvest sequence is approach, observe, localize, extend arm, grip/cut,
retract, place into container, and leave. Each step has inputs, exit conditions,
failure reasons, and replayable events.

A worker owns fixed-step simulation time and compute. UI consumes only the
latest display frame. Static scene geometry and spatial indexes are built once
per geometry revision; pose changes update only dynamic collision bounds.
Cancellation and document replacement retire old results. Acceptance: run a
complete offline pass without hardware, stop/replay, reject joint-limit
violations, reject post collisions and narrow drains, and reproduce motion
results with the same seed/version. This stage claims only motion and geometric
contact results.

### 3. Plant Damage, Soil, And Harvest Bin Dynamics

After the motion model passes, evaluate whether a physics engine is needed; new
dependencies require separate user approval. First model stems, branches, and
petioles as nodes with elastic connections, measure bending stiffness, friction,
and break thresholds, then evaluate soft-body or finite-element needs. Check
contact and pulling across continuous motion, not just endpoint poses.

Ground profiles include slope, water content, friction, and wheel sinkage.
Chassis dynamics compute support region, center-of-gravity projection,
acceleration, and rollover. Harvest-bin modeling includes fixture method,
container edges, payload, and fruit/bin interaction during motion; static center
of gravity cannot claim that a loaded turn will not tip.

Acceptance is experiment-calibrated: branch break tests, gripping damage,
different soil tracks and sinkage, payload turning, and emergency stops.
Uncalibrated results must be clearly marked as risk estimates; missing
parameters return indeterminate.

### 4. Live Robot Monitoring And Simulation Comparison

An app adapter receives robot ID, schema version, timestamp, coordinate frame,
sequence number, and quality flags, then converts ROS 2 or device WebSocket
messages into neutral telemetry. The concrete protocol waits for hardware
selection. Live observations and offline predictions remain separate, using the
same scene and pose projection without overwriting one another. Stale,
out-of-order, disconnected, time-unsynced, and untrusted positioning states are
explicit.

Start with read-only monitoring, event timeline, fault location, and replay.
Device command authorization, interlocks, and confirmation are designed
separately. Browser simulation cannot replace hardware emergency stops. Alerts
come from measured thresholds and traceable source events. Acceptance:
disconnect/reconnect, stale frames, out-of-order data, version mismatch, replay
alignment, and simulated/measured deviation.

## Verification And Startup

Run from the worktree root:

```bash
yarn workspace @asyra/fieldscope dev
yarn workspace @asyra/fieldscope test:local
yarn workspace @asyra/fieldscope typecheck
yarn workspace @asyra/fieldscope build
yarn workspace @asyra/fieldscope lint
yarn workspace @asyra/fieldscope test:e2e
yarn lint:naming
yarn gen:turbo:check
```

Install lockfile dependencies and build Framework packages through the existing
monorepo flow first. On first startup, copy `.env.example` to the app-local
`.env`; `APP_URL` is the only shared Vite and Playwright origin setting, with
`http://127.0.0.1:5178` as the example. Do not auto-select a different port.
E2E uses installed Chrome and does not download browsers. Tests run with one
worker and a 180-second global timeout. Playwright owns the test server
lifecycle; if a service already exists, verify it belongs to this worktree.

Formal tests cover dimension closure, arch peaks and endpoints, component
counts, recessed drain depth, outer barrier extents, CUSTOM engine contract,
geometry admission, camera operations not notifying UI under normal runtime,
single build per settings revision, consecutive edits not overwriting each
other, invalid value rejection, and disposal. E2E uses the real app path and
also covers parameterized endpoints, typed strips, single-transaction history,
rebuild counts, saved edited settings, perspective/front/top/inside/narrow
viewport screenshots, and source-space numeric correctness.
