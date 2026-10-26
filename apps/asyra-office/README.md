# Asyra Office

A procedural office and neighborhood preview following the approved Office image
and the [product plan](../../docs/ai/apps/asyra-office/plans/office-rebuild-plan.md).
The complete product plan remains open. No Blender or new dependency is used by
this implementation.

## Run

Use the repository's declared Node 24 and Yarn 4.3.1:

```sh
yarn install --immutable
yarn turbo run build:preset --filter @asyra/preset
yarn start:asyra-office
```

The workbench uses the URL in `.env` (default port 5194). Preserve an existing
`.env`; use `.env.example` only when one is absent.

The default route assembles the accepted single-floor structure, complete
entrance, planted sidewalks, street, outdoor seating, canal and neighboring
facades. The tables-and-chairs stage adds a writing desk, a tea
table and a lounge coffee table, using uniform scales that preserve their
approved proportions. The two wraparound tea chairs and lounge armchair are
omitted pending reviewed Blender assets. The standalone green work chair also
remains absent because it is not the dark chair in the original office image. Other indoor
furnishings and occupants remain deferred. The explicit structure composition
retains the accepted unfurnished checkpoint. These are real meshes through Core and the official
Preset 3D profile, not a reference image projected over the scene.

Places focus the camera. Agents and assigned tasks select a rear-follow view;
selecting a task opens no details. Tasks support status filtering, and search
locates named places, agents and tasks. Drag to orbit, use the camera controls to
zoom or restore Overview. WASD or arrow keys translate the camera on the ground
plane relative to its current heading. Hold to move continuously with a short
acceleration and release easing; Shift selects three times the speed. Diagonal
movement stays at the same speed. Losing focus stops movement immediately, and
no animation loop runs while idle. Search,
text editing, IME and browser modifier shortcuts retain their normal behavior.
The Street trees place opens a close inspection view. Narrow layouts expose both
panels through drawers.
All displayed people, tasks, logs and laptop activity are explicitly synthetic.
There are no live provider adapters, task execution, rewards, editable layouts,
wardrobe persistence, animation or saved document mutations yet.

## Construction and review limits

`src/assets/` owns numeric geometry, named parts, local Z-up coordinates and
independently specified appearance. `src/scene/` owns placement and conversion to
renderer Y-up. A scene session constructs geometry once; camera navigation and
React panel filters do not rebuild it. Scene placements apply explicit scales.
The scene uses the calibrated 3,264-leaf recipe per tree with uniform
whole-tree scaling. Primary subtrees grow radially around the trunk; added primary/secondary counts,
attachment positions and lengths vary by seed (35..55 branches total). Leaf
groups cover branch interiors and ends rather than one tuft per spoke. Secondary
branches retain their actual parents. Six stable seeds produce different relative
branch shapes, with uniform sizes 0.68, 1.12, 0.82, 1.28, 0.95 and 0.73. These
variants are constructed once and share the same leaf prototype pair: 256 near
triangles and 32 distant triangles. Near curves use eight samples per authored cubic arc; the
half-millimetre outline regression checks the analytic shape. The public
renderer selects detail per instance using a declared 10 mm local error and
0.75 pixel threshold; instance scaling participates in the projected error.
This is not an all-assets LoD completion claim or a measured frame-rate guarantee.

The current preview is not an accepted production asset library. Complex garment
joins, hair/skin intersections, continuous wood unions, hidden furniture joinery,
full catalog surface recipes and final five-view asset fidelity remain unverified.
Character sitting is a static construction pose, not a rig or animation system.
Rejected cat/corgi meshes and their generator have been removed. Approved source
images and specifications remain for later Blender modeling, rigging and animation.
Permanent regression tests prohibit reintroducing the rejected placeholders. Potted plants use the approved broad
folded leaves; street-leaf rim normals are isolated from both skins. Complete
planting composition remains under review. The pot now follows the 96-segment
profile, bounded 0.8 mm rim rounding and clipped soil cavity.
Background shops are contextual procedural architecture. Basic lighting remains
separate from materials; no baked shadows, AO or cinematic filter stack is added.
The owner limited current comparison to implemented objects; optional full-scene
color grading is not an acceptance gate. Numeric and browser tests do not grant
visual acceptance or establish a 100% reconstruction of the reference.

`/?review=wall` retains the independently tested wall harness: five views, cap
magnification, replaceable appearance and a 64/32-triangle detail switch. Its
narrow perspective lens approximates orthographic views. `createWall` accepts
whole-unit local XYZ sizes and group/per-region appearance overrides.

Independent live reviews are available at `/?review=leaf`, `/?review=cluster`,
`/?review=bare-tree`, `/?review=tree` and `/?review=plant`. They consume the same
asset factories through Core, retain geometry across camera changes, and expose
front/back/side/top/three-quarter and close views. Foliage revision 4 distributes a fixed leaf budget over core and generated branch
locations, retaining filled subgroups, mixed sizes and camera-independent
orientations. Coverage regressions check crown interiors and individual clusters
from three axes. The owner accepted the pot and blade construction, then requested individual plant arrangements. Each plant now has 6..9 staggered leaves with seeded reach, width, rise, azimuth, roll and lateral curvature. Stable layout IDs select seeds; camera changes and reloads preserve each plant. Pot, soil, stem and materials remain unchanged.
Wood junctions still use separate sweeps rather than the required fused surface.
Full tree asset approval remains separate from this canopy-density correction.
Reference images remain intact.

## Validation

```sh
yarn workspace @asyra/asyra-office test:local
yarn workspace @asyra/asyra-office lint
yarn workspace @asyra/asyra-office build
yarn workspace @asyra/asyra-office test:e2e
yarn lint:naming
```

The E2E suite uses Chromium and the same `.env` URL as the live app. Set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` only for an existing approved installation.
Screenshots under `test-results/` cover the overview, pantry/lounge close-ups,
mobile composition and wall views. Browser metadata records viewport and actual
WebGL context. Source-space tests cover wall topology, selected component bounds,
entrance joins, seating, eye surface projection, texture orientation, leaf detail,
rejected animal absence, keyboard input ownership and ground-plane movement,
construction work counts and session cleanup. The browser's existing software
renderer shadow policy may differ from hardware rendering; inspect the live tab
as well before claiming visual correctness. The production bundle currently
retains Vite's chunk-size warning; it has not been hidden or waived.
