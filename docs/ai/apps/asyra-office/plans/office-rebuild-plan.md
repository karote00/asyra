# Asyra Office - Product and Experience Plan

Status: product plan approved; implementation authorized on 2026-10-25.
The owner clarified on 2026-10-25 that implementation must deliver the complete
approved reference composition and UI together. This supersedes the one-wall
stop and sequential subgroup checkpoints for this visual implementation. Numeric
asset specifications remain authoritative. No new dependencies are authorized.
Product slug: `asyra-office`; display name: `Asyra Office`.

## Rebuild planning task

This revision replaces the earlier concept-first delivery proposal. The owner
requested a fresh App after clearing `apps/asyra-office/src` in commit
`4cd49875a4ea9b9386c64ff9a350270490bd6b91` (PR #361). Its non-runnable reset
exception does not authorize later implementation or waive future validation.
The reviewed references/specifications from PR #354 remain construction inputs.
This task updates only this plan and [the technical proposal](../implementation.md).
The user owns product/design approval and whole-plan acceptance; the executing
agent owns the bounded planning update and must report missing proof.

Completion for this planning task means a coherent full-product proposal,
explicit source authority, asset-to-scene mapping, phased acceptance, ownership,
and unresolved feasibility boundaries. It does not mean implementation-ready
Inspector admission or a verified model. Check document links, requirement
coverage, contradictions, and the bounded diff; leave `src` empty and asset
inputs unchanged. This self-review retains changes locally; it does not authorize
commit, push, or implementation.

## Source authority

- [Approved complete office image](../../../../../assets/asyra-office/models/architecture/review/approved-office-reference.jpg)
  owns the intended overall composition and visual style. The central office is
  primary; neighboring shops are secondary. It is not merely a mood board.
- [Asset catalog and shared contracts](../../../../../assets/asyra-office/models/README.md)
  identify current per-part drawings, numeric specifications, assembly rules,
  defaults, and exceptions. Use those exact links, not the newest filename.
- [Asset types](../../../../../assets/asyra-office/models/ASSET-TYPES.md) distinguish
  geometry, material, decal, and procedural-path inputs.
- A later explicitly approved per-part revision controls that part's geometry;
  the full image still controls the scene's identity and composition. Numeric
  specifications control authored dimensions and hidden construction. If an
  approved sheet and numeric geometry conflict, isolate the conflict before
  modeling; do not silently distort a part to fit a screenshot.
- Keep existing Markdown/JSON specifications and generation rules. No OpenUSD
  conversion is planned. Export format is a delivery decision after geometry
  validation, not a substitute for construction specifications.

## Product direction

Build a warm, tactile, Q-style miniature neighborhood where a human can observe
and organize a team of agents. The central cutaway office, furnished rooms,
street, trees, outdoor seating, canal edge, and dark navy application frame form
one complete visual target. Agent work, ordinary life, customization, and growth
share this world. Agents do not have to stand in rows or remain at their desks.

The final quality target is the approved image. Do not replace its furniture,
characters, layered environment, or lighting with generic primitives and call
the result visually complete. Simple geometry is appropriate when it matches
the approved part. Performance reductions must preserve the silhouette and
composition visible at the actual review distance.

Functionality can arrive in stages. The complete visual direction and UI are
reviewed together before functional delivery; later stages activate behavior
without repeatedly redesigning the product. Review builds may label fixture
content clearly. Reference-scene preview characters are synthetic and must not
create real memberships, rewards or achievements. The live office may start with
no connected agents while retaining its furnished setting. A control is not
presented as working until its behavior exists.

## Complete scene and visual composition

Preserve these relationships in the default overview. This is a composition
plan, not a newly measured floor plan; derive placement from approved asset
extents and usable paths during the later assembly review. This approved default
layout is the visual acceptance fixture, not a permanent placement constraint:
users and authorized agents may subsequently rearrange and expand it. Growth
adds to the accepted initial environment; it must not strip the reference scene
to an empty room and defer its visible furniture or UI behind unlocks.

| Zone                             | Required composition and assets                                                                                            | Relevant source batches                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Central work area, image left    | Warm timber desk, own laptop, work chair, rug, shelving and plants; seated agent remains readable                          | architecture, furniture, desk-items, storage, textiles                               |
| Rear shared table                | Round table and chairs, large wall clock, framed/hanging decor, relaxed social space                                       | tea-furniture, furniture, wall-decor, decor-accessories                              |
| Rear-right pantry                | Green/cream striped finish, refrigerator, bottled water dispenser, sink/counter, coffee equipment, mugs and supplies       | wall-decor, pantry, pantry-smallware, storage, serving-smallware                     |
| Front-right lounge               | Green two-seat sofa, orange armchair, round coffee table, rug, pillows, wall light and small wall items                    | furniture, textiles, portable-lamps, wall-decor                                      |
| Entrance and facade              | Cream wall, complete orange-toned door set including the narrow side panel, steps, chalkboard, plants and office lettering | architecture, outdoor-accents, entry-plaque, garden-greenery                         |
| Street and sidewalk              | Asphalt/replaceable paving, independent markings, curb profile, paving units, manhole, trees, lanterns and street sign     | street, street-details, garden-masonry                                               |
| Outdoor rest area and canal edge | Bench, small table, coffee, railings, planted edge, water and background shop framing                                      | outdoor-accents, outdoor-shade, park-railing, garden-masonry, shop-awning            |
| Characters and companions        | Freely placed modular people, orange sleeping cat, corgi; smaller birds and scene variants follow the catalog              | people, animals-cat-dog, animals-sparrow-parrot and catalog-linked follow-ups        |
| Additional navigable places      | Meeting room, washroom, roof terrace and park, connected to the central office and exterior                                | architecture, meeting-furniture, washroom-fixtures, roof-modules and outdoor batches |

Batch names above identify existing catalog directories; use their linked
current inputs through the catalog, including their stated exceptions. The image
does not resolve every hidden room or rear facade. Author those
areas consistently with the approved parts and submit them as explicit design
completions. Do not claim that their dimensions were recovered from the image.

Use cream plaster, warm wood, muted green upholstery and restrained orange as
the default scene palette, with navy UI. Exact per-part default colors/materials
come from the existing surface documents; review-only recoloring is not a default.
All permitted appearance overrides remain available. Use actual scene lighting,
soft contact shadows and consistent exposure. Reference shading may explain
shape; do not bake shadows, AO, highlights or reflections into asset color maps.

The overview uses a high three-quarter/isometric-style camera matching the
reference composition. Calibrate projection, elevation, azimuth and framing
before comparing shape. Record the matched camera as an authored calibration,
not recovered original lens metadata. Do not change the model to compensate
for a mismatched camera. Walls/roofs hide or fade for visibility;
this is a presentation state, not deletion of the building geometry.

### Interior reconstruction - 2026-10-26

The owner rejected the previous authored room schedule. It is not an approved
layout or a dimensional authority. The complete reference image takes priority;
missing dimensions must be inferred from that image, not selected for convenience.

Revised bounded contract: `compose-office` owns the measured room layout and its
camera framing. Trace visible structural endpoints in the 1280 x 800 approved
image, solve one shared projection and connected wall geometry, then place
furniture and finishes against those surfaces. Retain an explicit pixel residual
for every measured endpoint; do not equate passing implementation tests with
100% image recovery. A single generated image does not uniquely determine hidden
geometry. Image-derived values must retain their source and calculation.

The first failed owner is room composition: previous tests repeated arbitrary
wall dimensions and did not compare reference landmarks. The next formal oracle
must compare projected wall endpoints to the independently traced source pixels
and fail on the old composition before production edits. Include the green
partition direction, lounge left return and floor transitions. The source image,
not an occlusion workaround, determines wall height.

Scope: app scene composition, its camera configuration, permanent measurement
script/data, focused tests, existing interior E2E, this plan and implementation
notes. Existing public camera/render APIs and asset factories remain owners;
no renderer-local corrections, new dependencies, Blender, filters or exterior
geometry changes. Exterior parts and labels retain their existing digest. Scene
construction remains once per runtime. No commit or push is requested.

Validate source-space connected walls and projected landmarks, asset support,
unchanged exterior, runtime reuse, app lint/typecheck/build, naming and update
notes. Capture real overview and room views and compare structural edges at the
reference camera. Record remaining mismatches explicitly, never as a fabricated
100% completion claim. The old authored wall schedule is superseded, not a target
to preserve. User instructions on reference priority supersede the earlier
numeric-scene proposal; per-asset construction contracts still own local detail.

### Interior correction - connected envelopes and local review

The owner rejected the endpoint-only review. The fixed discovery scope is the
reported foundation, lounge enclosure/sofa, work rug, continuous west wall,
pantry wallpaper, refrigerator orientation and dispenser bottle proportions.
The office foundation is now explicitly in scope; street, trees, lamps and park
remain unchanged. The preceding fixed rectangular slab is superseded.

Step execution card: `compose-office` consumes approved assets, source image
measurements, layout and presentation camera intent and produces the spatial
scene. Its existing scene/controller boundary owns placement, aggregate extents,
wall/floor connectivity and per-instance dimensions. It may not alter renderer
semantics, insert visual patches or retain independently authored UI copies.
`construct-asset` remains the local-profile owner; resizing a named bottle region
at composition preserves that profile and its replaceable appearance. No new
runtime cache or per-frame fitting is introduced. Failure returns to composition.

The new regression cases must fail first: equal west-wall cap heights; an oval
work rug; foundation outline against traced floor-edge pixels; an unobstructed
left sofa arm and no solid intersection; front-facing fridge doors on the east
side; wallpaper ending before the plain poster field; separately measured bottle
and dispenser image bounds. Keep the previous image endpoint cases as supporting
evidence, not a complete visual oracle. Measured corners may not be discarded
merely to obtain a green test.

Implement in scene layout/interior/reference measurements and the existing offline
fitter; update their tests, existing interior E2E, this plan and implementation
notes. The common single-storey foundation and wall boundaries must clear the sofa before furniture
is moved. Review actual room crops and source/actual pairs independently for each
reported defect, including a rotated lounge view for solid penetration. The
fitter must report any constrained residual rather than hide it by image warping.

Gates: focused red/green geometry tests, scene/runtime regressions, app lint,
typecheck/build, naming, live interior E2E and enlarged same-camera comparisons.
Stop advancement for an unresolved reported defect; whole-image visual acceptance
is not inferred from endpoint RMS or green tests. No commit or push requested.

### Goal continuation - finish measured interior parity

The owner explicitly requested a persistent goal and continued iteration rather
than stopping with known interior discrepancies. Continue the same rebuild plan;
the office interior is the fixed candidate set. Exterior assemblies, characters,
animals, global filters, provider behavior and framework packages remain excluded.
Discovery is limited to the approved full reference, approved component recipes,
their current interior consumers and same-camera production screenshots.

Authority clarification from the owner: when documented dimensions or geometry
produce a discrepancy against the approved reference, the reference wins. Update
the affected dimensional recipe, measured inputs and implementation together;
do not preserve an old number at the expense of the image. Retain which visible
edges/landmarks support each revised dimension, and distinguish recoverable ratios
from hidden construction decisions. This authorizes correction of the affected
interior component specifications as well as their consumers.

The next `compose-office` slice corrects actual measurement errors before changing
asset shapes: pantry poster and shelf bounds, lounge table/chair bounds, supported
tabletop props, the six small wall prints, and wall lettering that was incorrectly
turned into a framed poster. Record source pixel bounds and named surface regions;
fit them offline through the retained camera. Keep published component geometry
unless a separately inspected source profile proves its constructor wrong.
The lettering is real glyph geometry on the wall, not a paper-coloured rectangle
or a screenshot of the scene. Its generic construction belongs to the app's
existing label-surface owner and uses the public mesh descriptor; no renderer
alpha workaround or framework mutation is allowed.

Executable cases must fail on the old output: pantry poster projected bounds,
six independently placed prints, no lounge quote frame, cut-out glyph topology,
and lounge tabletop projected size/height. Support, clearance, lifetime and the
unchanged exterior digest remain required. Run focused red/green tests per owner,
then the existing interior browser suite and enlarged room comparisons. Continue
into the remaining source-visible furnishings and decorations after this slice;
do not close the goal while an identified in-scope mismatch remains. Geometry,
placement and image evidence must agree; test passes alone do not close a slice.

Self-review: fitting is startup-independent offline work; original asset profiles
remain reusable, requested size is applied once, and direct props follow their
support changes. The same composition-to-render route remains authoritative.

The first size-only chair fit exposed an unsupported foot. Bounding-box/yaw fitting
then chose a wrong-facing solution; three measured foot contacts exposed an 11 px
rear-envelope mismatch in the existing dimensional recipe. Re-checking the approved
SIDE image shows the rear feet substantially forward of the rearmost backrest,
unlike the current JSON. Return to `construct-asset` for this upstream failure.
Its inputs are the approved profile, requested extents/appearance and corrected
contact dimensions; its output remains the same named closed asset parts. Change
only the armchair foot coordinates, their recipe and focused asset oracle, then
re-export and refit composition against both contacts and outline. Preserve four
feet, existing profiles and sizing-once semantics. No foundation expansion, image
mask, new renderer behavior or tolerance relaxation is authorized. Test the rear
overhang and retained whole bounds before returning to `compose-office`.

Source audit correction: two foot tips are plant-occluded, so their former exact
pixel observations were invalid. Retain the visible front-left contact as a point
and the other contacts as bounded image regions. Orange-pixel inspection also
places the actual rear envelope at X=815, not the old background-inclusive X=818.
Keep the same solid-support requirements and do not invent hidden exact positions.

The print-detail slice stays at `compose-office`: construct six thin paper objects
with replaceable printed surfaces. The approved image may supply only the small
printed picture interiors and the three main framed paper designs, rectified from recorded corner coordinates. Never use
the room, furniture, shadows or an environment screenshot as geometry. Decode a
source image once per scene preparation, reuse its pixels for all paper prints, and
retain ordinary opaque surfaces through the existing public descriptor. Tests
cover the six-paper contract, image-region sampling and preparation work counts;
runtime camera updates must not decode or rebuild the surfaces.

The pantry shelf slice first uses `construct-asset` for the existing canister's
closed R/Z profiles (body and removable lid, replaceable appearance), then returns
to `compose-office`. Its inputs are four shelf corner measurements and three jar
bounds; outputs are one shelf and supported, differently sized canisters. Keep
shelf rear contact on the measured rear wall, fit its width/depth/top height, and
fit each canister's planar position, radial size and height on that surface.
The prior corner oracle fails by 26.28 source pixels. No equal-spacing recipe or
substitute mugs are allowed. Required checks cover projected corners, three closed
jars, support/clearance, original component bounds, and unchanged exterior.

The foliage slice returns to `construct-asset` for an explicit rosette growth
variant of the existing closed leaf/vessel recipe. The full reference shows leaves
originating close to the soil in the sink, lounge-floor and table plants; the old
stemmed form is not a valid substitute. Keep the stemmed default and all exterior
instances unchanged. Record the rosette's soil-rooted attachment/rise/width ranges
in the plant spec; these are authored hidden-growth decisions bounded by the
visible foliage envelope, not claimed photogrammetry. Reuse the existing blade
constructor and deterministic seed. Tests require roots near the pot rim, a short
central stem, thick closed blades, stable seed output and preserved old defaults.
Then compose explicitly selected indoor instances and fit pot/foliage image bounds.

The sink support review exposed another AABB ambiguity: the old whole-object
fit included the faucet and left the counter about 29 source pixels from its
observed corner. Fit the exposed counter corners as named local vertices, retain
the pantry floor datum, and enforce wall clearance. The right-hand vessel must
fit on the countertop's solid strip without covering the basin. Source image
bounds govern both pot and foliage; neither may be shrunk merely to conceal an
incorrect support. The source rectangles and fitted residuals are retained.

The cabinet-front slice corrects the first incorrect `construct-asset` recipe:
the source shows a left door, two stacked drawers and a narrow right end panel,
while the old sink specification had two equal doors. Keep the supported outer
cabinet/counter/basin geometry and replace only front subdivision and handles.
Read front spans from the enlarged source region X=885..983, Y=328..390; the
partially hidden lower extents retain the existing closed cabinet construction.
The existing door-recess oracle must continue on the retained left door; add a
regression for separate drawer fronts/handles and the end panel. Include those
named regions in the directly dependent under-counter cabinet composition.

The oblique counter review rejected the first top-corner-only solution: all three
landmarks were coplanar, allowing a visually incorrect low cabinet. Add the visible
lower-right corner of the left door at source `[930, 390]` as noncoplanar evidence.
Keep the same owner, floor/support constraints and corner oracles. Refit both sink
and dependent plants; do not accept top-plane agreement as body-height evidence.
The new regression must fail on the shallow cabinet before the fit changes.

## Complete UI and camera behavior

The desktop composition retains the reference's top bar, two side panels and
large central 3D view. Keep the center visually dominant and avoid a permanent
bottom toolbar obscuring the entrance/street. Building controls appear when
entering decoration mode. Search, settings, notifications, wardrobe, achievements
and office growth use the same design system and are included in the UI review.

| Surface           | Required behavior                                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Left - Places     | Exactly one of two navigation tabs. List rooms, floors and outdoor destinations. Clicking a place focuses its usable bounds; no long queue of camera transitions.                                                                    |
| Left - Agents     | Second navigation tab. Stable identity, status and current activity; clicking follows the selected agent from behind, at its current location.                                                                                       |
| Right - Logs      | Exactly one of two work-context tabs. Timestamp, agent and concise action; virtualized chronological display with follow-live control. Ambient actions and external work remain distinguishable.                                     |
| Right - Tasks     | Second work-context tab. Filters include not started, in progress, completed and blocked; failed/cancelled remain distinguishable when provided. A task click only focuses its assigned agent from behind; it opens no task details. |
| Agent workstation | Each agent owns a desk/work anchor and the approved Apple-style laptop. The screen shows the user's current-work context available through that agent's authorized activity feed, not invented desktop capture or private reasoning. |
| Wardrobe          | Preview clothing, hair, accessories and skin/hair colors on one character. Confirm applies the outfit; cancel preserves the previous outfit.                                                                                         |
| Decoration        | Select, place, move, rotate, resize and replace surfaces. Preview valid/invalid placement; apply or cancel, with Undo/Redo.                                                                                                          |
| Office growth     | Show rooms/floors, office funds, proposals and their costs. Expansion/repair uses the same placement and validation route.                                                                                                           |
| Achievements      | Separate human, per-agent and office-wide histories, with reasons and optional reflection hints. Toasts do not steal camera focus.                                                                                                   |

Unassigned tasks or agents with no scene representation produce a clear
unavailable-focus result, not a fabricated actor or a task detail panel. An
offline connection alone does not remove its actor or prevent camera focus;
show the offline status while following the existing actor. For multiple
assignees, use the task's explicit primary assignee; if none exists, offer an
assignee selector without opening task details. Manual orbit/pan cancels follow;
selecting an agent restores it. An overview action restores the reference view.
On narrow/mobile screens, preserve the same four tabs in collapsible drawers,
show one drawer at a time, and keep camera controls touch-accessible. Honor
reduced motion and keyboard navigation; status cannot depend on color alone.

Search targets named places, agents and tasks and reuses their selection rules.
Notifications summarize meaningful events without stealing focus. The reference
UI's English labels are visual evidence, not a language restriction: localize
product text, preserve user names/provider content, and retain the required
Traditional Chinese achievement title. Logs show local hours/minutes, with a
date when needed to distinguish days; retain full timestamps and source order.

## Asset production and configurable construction

The catalog's dated inventory is 56 reference batches, 121 drawing sheets and
56 numeric specification files. These are not 121 completed models. Approved
documents, generated meshes, accepted models, runtime imports and verified LoDs
must remain separate states.

Keep the original category order: architecture -> street -> people -> decoration
and furniture in small subgroups -> small plants/objects. People come first in
the creature work; the already specified animals remain a later subgroup after
those categories, consistent with their earlier deferral and later inclusion.
Animals are still required for the complete visual target. Implement the visible reference assemblies together under the clarified complete-scene
visual scope; retain per-asset geometry tests and report fidelity gaps honestly.

Before scaling production, prove a representative asset can pass through the
intended runtime renderer with matching dimensions, default appearance and LoD.
Repeat that proof when a new capability class first appears, such as textured
furniture or a skinned, clothed character. A minimal asset review harness may be
built in the separately authorized asset stage; it is not permission to develop
Office product features before models are accepted. Track geometry approval and
runtime-import acceptance separately when a capability remains unresolved.

- Use programmatic geometry for specified primitives, profiles and regular
  assemblies. Use Blender for sculpted upholstery, complex organic surfaces,
  topology and rigging when needed. Run Blender in background mode and close
  the process after the bounded job, as previously required.
- Read each selected sheet, geometry supplement, numeric specification and
  surface recipe together before construction. Keep a reproducible source.
- Preserve units, axes, pivot, parts, joins, recesses, bevels, openings and
  material regions. A door leaf plus its side panel is the complete door unit.
- All units support finite positive overall local X/Y/Z sizing per the shared
  contract, through the same `createXXX` capability concept. API spelling is not
  finalized here. Omitted extents retain defaults; reject zero/negative sizes.
  Scale attached parts, joins and gaps exactly once about the authored origin.
  Optional proportional locking must reject inconsistent requests, not silently
  distort them. Apply surface mapping using final dimensions, then placement;
  do not confuse rotated world bounds with size or silently swap asset axes.
- Zero-thickness decals stay planar. Road paint is independent of asphalt;
  crosswalks use one stripe per unit. Straight, curved and dashed road markings
  share their approved planar-path contract rather than separate solid road
  meshes. Shared curb sections follow their specified planar paths and retain
  the approved cross-section drawing. Pavement is assembled from independent
  stones; a pavement layout image is not the single-stone model. Roads extend
  through bounded connected patches; no literal infinite mesh is required.
- Whole-unit scaling does not silently change a construction rule. Separate
  procedural options retain their approved semantics: awning slope/length and
  vertical valance, partial terminal strips for a fractional width, alternating
  or single colors; parasol radial branches; two-level tree branching and varied
  instances of the same leaf geometry. Do not add terrain conformance.
- Color/material selection must not mutate another instance. Every configurable
  region keeps its explicit default. Resolve region material, otherwise group
  material, otherwise the preset; then apply region color, otherwise group color.
  A color override retains the selected material's other properties. Use specified
  physical texture repetition where required instead of stretching wood grain
  or wallpaper automatically. Keep geometry changes separate from appearance;
  single-wall strips are independently sized/placeable, not a whole-room-only
  wallpaper replacement.

### Modular people and animals

Use the existing male/female numeric profiles. Keep skin/head/face, ears, eyes,
nose, mouth, eyebrows, hair cap and leaves, glasses, neck/body, limbs, hands/feet,
clothing, trousers and shoes as the specified replaceable parts and sockets.
Use their authored dimensions, not generic humanoid proportions. Shared slot
names do not imply that a garment fits both profiles; cross-profile replacements
need explicit fit adapters. Overall resizing carries the complete outfit once.

Before animation acceptance, verify joint deformation, garment clearance/body
masking and attachment behavior in standing, seated, walking and arm-reaching
poses. Hair/accessory replacement must preserve stable agent identity and history.
Pets use their own approved geometry and later animation contracts; they are not
provider agents. Do not promise arbitrary third-party clothing compatibility.

### Known visual completion work

The catalog already identifies these six scene-specific gaps: black-and-white
sleeping cat variant, canal duck, lounge photos/cards, office facade emblem and
lettering, canal water, and the BOOKS shop sign. Plan their reference/specification
completion before claiming full-reference coverage; create none in this task.

The park bench is a procedural production case with rejected V4 geometry; use
its original v1 appearance and resolve its construction before acceptance. The
wireless mouse and flower drawings have documented projection discrepancies;
follow their chosen numeric/silhouette authority and verify a single real model
from matched cameras. The historical reference folder must be revisited at final
asset acceptance; preserve unresolved evidence until it is safely superseded.

## Agent work, life and integrations

Codex, Claude, Grok and other providers are connection targets, not interchangeable
execution APIs. Preserve distinct connection, agent, task and attempt identities.
Use the existing provider-neutral activity contract where it fits, while keeping
provider evidence and capability differences explicit. Dots is a separate
cooperative-integration candidate; availability and permitted telemetry must be
verified before advertising a connector. This plan makes no new live API claim.

Connections may be structured, local or cooperative; sample data is explicitly
synthetic. Logs contain concise permitted activity, not raw tokens or private
reasoning. Task direction corrections and accidental task claims require actual
feedback/assignment evidence, not guesses from language or animation. Laptop
content is a controlled projection of the permitted current work; unavailable
content remains unavailable.

Joining/dismissing an office member changes office membership and its world
representation; it does not cancel an external job, delete a provider account
or terminate its process. Disconnection is not dismissal. Preserve the stable
agent identity and earned history on removal/rejoin so personal firsts do not
reset. Each active member has a distinct claimed workstation; assignment and
seat occupancy are explicit, not inferred from who is closest to a desk.

An idle agent may rest, visit the washroom, nap, socialize, buy a virtual coffee
or sit in the park. Personality/mood can influence destination choice within
walkable space and user policy. An agent may choose an allowed destination or
activity through the same bounded action interface; local ambient behavior does
not require an LLM call per movement or frame. Occupied seats, blocked paths and room edits
must be handled explicitly. Agents may move freely within those rules, without
forced rows or identical schedules. When work arrives, update work status
immediately; return-to-work animation must not delay real execution. A visible
break must never imply that the external runtime has paused.

Separate external task status from simulated life activity. Simulation operates
at a bounded cadence; renderer interpolation is local. Layout changes invalidate
affected routes; camera frames do not recompute pathfinding. Indoor/outdoor and
multi-floor travel must use valid connections, with no silent teleport through
walls. A blocked route stops/replans the visual actor and reports that condition
without marking the provider task failed.

## Decoration, building growth and persistence

Users can place items freely, with optional snapping and explicit constraints
for supports, collision, openings, passages and floor ownership. Support room
expansion, partitions, floor/rug replacement, single-wall vertical/horizontal
wallpaper, furniture, fixtures, plants and independent accessories. Multi-room
and multi-floor construction belongs to the full product from the start, even
when its controls activate later. Roof/floor isolation is a camera/render option.
Collision checks respect authored contact/overlap allowances, supports and
attachment relationships; they must not reject a rug on a floor, wallpaper on a
wall or a specified joined assembly simply because bounding boxes intersect.

Human and agent edits use the same validation and canonical action route. Agent
proposals include attribution, expected layout revision, preview and cost where
applicable. Proposal-only is a recommended initial setting, not a permanent
restriction: the main agent can decide and apply expansion/repair within the
user's configured authority, while other agents can decorate or buy personal
treats within theirs. Out-of-policy actions remain proposals. Automatic
application requires an explicit user policy and budget. Reject stale,
inaccessible or unaffordable changes atomically. Undo/Redo must preserve layout/economy consistency.

Save building structure, placements, size/appearance overrides, agent/outfit
identity, work anchors, office funds, personal balances and earned achievements.
Keep provider records under their declared retention contract. Do not save
frame-by-frame transforms, camera interpolation or generated GPU resources as
canonical world state. Reopening restores authoritative progress and current
connections; it must not replay rewards or continue stale movement blindly.

Recommended first release: local single-user office, with versioned save/export
and recovery. Shared multi-user editing is a later explicit product decision,
not an implied consequence of multiple agents. Keep credentials outside world
exports. Storage failure leaves a visible unsaved state and recoverable pending
work; invalid input must not partially replace a valid office.

## Rewards and achievements

Achievement recording begins with the first eligible feature, not only when the
full achievements UI ships. First agent addition grants the human onboarding and
office first-hire achievements in that same accepted local action; a failed or
cancelled addition grants neither. Record eligible personal/life milestones from
their first supported occurrence with their original time and identity. The
later collection displays those records; it must not invent awards on UI mount.

Maintain an office fund for expansion/repair and separate per-agent balances for
virtual coffee, snacks and toys. Qualifying work uses a validated task-acceptance
signal. Where the connector cannot provide that signal, an explicit human
acceptance can supply attributable evidence; an ambient animation cannot.
Reward policy must reject duplicate/replayed completions and avoid
incentives based on token volume or artificial task splitting. Record the reason,
amount and recipient. These rewards have no real-money purchase path.

The main agent may propose or apply office spending within its configured
authority; personal spending follows the user's limits. Repair is optional flavor and never disables work visibility.
Eligible reversals of a local purchase or expansion compensate their cost
exactly once and remove the corresponding acquired object/structure atomically.
Consumed goods or changes with incompatible later dependents require an explicit
reversal policy; do not promise a refund while keeping the benefit. Ordinary
furniture movement Undo must neither refund a purchase nor re-award external
work completion points.

| Recipient         | Required examples and evidence                                                                                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Human             | The agreed localized title for “Start Agents Life”: grant once when the first agent is successfully added, without waiting for any completed task. Preserve the exact approved Traditional Chinese title in future i18n resources. |
| Each stable agent | First coffee, first toy, first arrival, first departure, first workday break; evaluate independently per identity.                                                                                                                 |
| Office/team       | First hire, first dismissal/departure, first configured milestone and aggregate progress; one agent's event does not award every other agent's personal first.                                                                     |
| Learning history  | N failed attempts, N consecutive failures, verified wrong-direction correction and accidental task misassignment. Keep these encouraging and non-punitive.                                                                         |

Proposed initial learning thresholds are 3 and 10 distinct failed attempts and
3 consecutive failures per agent. A successful distinct attempt resets the
consecutive counter; user cancellation and environment/tool outages do not count
as agent mistakes. Retain all failure causes in history and allow cause-specific
learning achievements without assigning blame. Team learning records aggregate
qualified outcomes with explicit per-agent attribution; they are not limited
to personal awards. Humans and agents can read an earned achievement's reason
and optional reflection hint, while agents cannot write their own awards.
Treat these values as proposed configurable defaults, not
previously approved asset specifications. Learning achievements give recognition
and a reflection prompt, not failure-farming currency or quality scores.
Definitions are versioned; grants are idempotent and earned history is retained.
The first-agent onboarding achievement has this required i18n parameter:
`{"locale":"zh-TW","title":"開始 Agents Life"}`. This title belongs to the human,
not the newly added agent.

## Performance and LoD from the first asset

Keep durable event admission, semantic simulation and rendering on separate
schedules. Persist accepted events before publishing their authoritative effects.
Coalesce redundant presentation values, not durable task transitions, rewards or
history. Bound queues and pause intake/replay where the source supports it.
For an unpausable source, retain only durably accepted events and explicitly
mark any unretained interval as a gap; resynchronize if supported. Do not promise
lossless source history without a replay guarantee. Gap-affected evidence cannot
prove exact consecutive streaks or justify speculative rewards. Expose unavailable
or lagging sources instead of silently dropping accepted events.

Subscribe by entity/field. A changed agent updates its actor and relevant visible
rows, not the scene root or every panel. Virtualize logs/tasks; avoid reparsing
history on each render. Camera frames do not trigger canonical reads, React
state broadcasts, geometry regeneration or laptop texture creation. Recompute
routes, bounds and projections only for actual semantic input changes; prove
both work counts and invalidation before introducing caches.

| Presentation tier      | Planned behavior                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Near/selected          | Approved silhouette, join details and readable permitted laptop activity; full relevant pose quality.                              |
| Mid-distance           | Simplified mesh/material workload, reduced secondary animation; preserve character and furniture identity.                         |
| Overview/distant       | Share/instance suitable geometry, omit subpixel detail and reduce animation cadence; preserve recognizable agents and composition. |
| Hidden/offscreen floor | Cull rendering and stop nonessential visual updates; canonical task/reward state continues. Restore current state on return.       |

Use projected size, visibility and selection with hysteresis for LoD transitions.
Do not replace nearby geometry with flat cards to pass the overview. Skinned
characters, transparent foliage, texture memory and shadow casters have separate
costs; triangle count alone is not a budget. Preserve the individual asset LoD
constraints and verify their real meshes. Never use a fixed 95,000-triangle
armchair as an unexamined default for repeated furniture.

Proposed profiling fixtures: 8, 32 and 64 connected agents; one/two/four occupied
floors; 100, 500 and 1,500 placed instances; 100 and 1,000 incoming semantic
events/second with a short 5,000/second burst. These are test scales, not supported
capacity claims, and run separately before combined stress. Proposed targets are
60 fps desktop navigation, a 30 fps reduced tier, and p95 visible status latency
under 250 ms for the agreed normal load. Confirm hardware, resolution, renderer,
and workload before accepting budgets. Keep deterministic work-count regressions
separate from hardware-dependent profiling; do not fail ordinary unit tests on
one machine's elapsed-time number.

## Delivery sequence and acceptance

These stages describe future work only. Approval of this plan is not permission
to implement. A later execution instruction authorizes its stated scope; honor
that authorization without repeatedly requesting permission for already covered
steps. Preserve the explicit small-subgroup visual review checkpoints.

Full-product design and dependency review precede production. Gate each actual
implementation slice on its exact Inspector owners and capabilities; do not
require live-provider credentials or a completed economy before reviewing a wall.

| Stage                                       | Deliverable and boundary                                                                                                                                                                                                                          | Acceptance before advancing                                                                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 - Product and feasibility review          | Approve this whole-product direction, complete UI layout, known asset gaps and technical owner proposal. Update/admit the replacement Inspector flow before production work.                                                                      | Identify whole-flow gaps and resolve the exact first-slice prerequisites; admit each production slice before execution. No retired implementation or synthetic evidence counts as delivery.     |
| 1 - Small asset subgroups                   | Architecture, street, people, decoration subgroups, plants/small objects, then the deferred animal subgroup. Verify geometry, replaceable regions, LoDs and runtime import through an authorized minimal asset harness.                           | Each subgroup passes dimensions, matched multiviews, close-ups and its supported runtime path; user accepts model quality. New asset capability classes require import proof before repetition. |
| 2 - Complete visual assembly                | Assemble the full central office and surrounding street/park/canal/storefront framing, agents/pets and complete responsive UI. A minimal viewer/App shell is allowed only after separate implementation approval.                                 | Same-state actual renderer views match approved composition; no missing visible component hidden by framing. Missing behavior is labeled; this is visual acceptance, not live integration.      |
| 3 - Work and life                           | Wire membership, Places/Agents/Logs/Tasks, rear-follow camera, work anchors, retained event admission, one verified live connector and bounded ambient movement. Grant onboarding/first-hire immediately and retain eligible life milestones.     | Fast retargeting, valid navigation, honest source evidence, reconnect/replay and load tests pass; previously accepted visuals remain intact.                                                    |
| 4 - Customization and growth                | Activate whole-unit sizing/appearance, wardrobe, placement, partitions, rooms/floors and persistent layouts.                                                                                                                                      | Fit/clearance, stale proposals, atomic rejection, Undo/Redo, save/load and storage failure pass.                                                                                                |
| 5 - Rewards and automation                  | Office/per-agent funds, complete achievement rules/collection, policy-controlled agent decorating and expansion/repair. Existing grants keep their original identity and time; a cafe visit becomes a purchase only when spending is implemented. | No duplicate grants, no failure farming, correct individual/aggregate attribution and atomic spend/apply/compensation.                                                                          |
| 6 - Provider breadth and release validation | Add separately verified provider adapters, complete target-device profiling, accessibility and combined-load evidence.                                                                                                                            | Full product cases and visual regressions pass on exact release source; no unsupported provider telemetry claims.                                                                               |

LoD, lifecycle cleanup, work-count checks and appearance overrides are required
within each relevant stage; stage 6 does not postpone those responsibilities.

## Visual review and definition of done

Keep the established reference-revision sequence when a reference needs repair:
show the current multiview sheet -> user reviews shape consistency -> add review
lighting only after shape approval when complex geometry needs it -> inspect and
correct the numeric specification, then self-review. Simple flat/box-like parts
need no added review shadows. Do not redraw approved inputs just to start this
rebuild. If an explicitly documented numeric correction supersedes an old image
caption, use that recorded correction; only unresolved conflicts reopen review.

For each model, use the approved per-part reference and numeric defaults first.
Render front, side, back, top and three-quarter views of the same object, with
matched projection and framing. Compare silhouette and component landmarks using
50 percent overlays; inspect enlarged joins, seams, armrests, legs, openings and
undersides. A silhouette or topology mismatch blocks acceptance even if color
looks convincing. Review neutral geometry separately from default appearance.
Record reference, render and crop pixel dimensions and camera settings. Supply
sufficient native render resolution to see the inspected detail; do not certify
it from a downscaled contact sheet. Acceptance requires each applicable numeric
constraint and specified join/part to match, with no unexplained silhouette
difference, extra support, missing part, wrong limb/leg placement or invented
seam. Any documented tolerance must be explicit before judging a deviation;
“close enough” is not a pass.

For the scene, compare the reference overview and actual App on the same viewport,
then inspect indoor close-ups, exterior paths, rear-agent view and floor isolation.
Retain a reproducible camera/lighting setup. Render local crops at their inspection
resolution rather than enlarging only an already tiny overview. Show the user
one final comparison sheet with all five views, reference on the left and actual
result on the right, preserving the established view layout. Keep overlays and
other inspection intermediates for internal evidence, not extra competing final
versions. Supply enlarged details on request. Include the original reference
when requested; do not repeatedly attach the full-office image when it is already
open. Retain rejected evidence and show it when the user asks about a failure,
clearly marked as rejected. Review changes yourself first.
Do not claim exact recovered geometry for occluded parts of a generated image.

Required product cases include empty office/first hire and its immediate grants;
dismissal versus disconnect, removal/rejoin without duplicate firsts; task click
with assigned, unassigned, multiple-assignee and offline-but-visible agents; work arriving during a break; provider disconnect,
duplicate/out-of-order events and burst recovery; garment swap and cancel;
invalid/stale layout change; a fractional awning; first/second floor travel;
failed save and recovery; eligible reversal versus consumed purchase; duplicate
rewards; source gaps preventing unsupported streaks; per-agent and office firsts; learning
achievements; reduced motion/mobile controls; and teardown/reopen without leaks.
Each implementation slice adds permanent formal cases for its actual behavior.

## Review decisions and unresolved proof

Confirmed: the approved full image is the visual target; existing specifications
remain; all sizes and appearances follow shared replacement rules; models come
before product features; the source reset is intentional; no OpenUSD migration.

Recommended product defaults for review: local single-user first release,
proposal-only main-agent building authority, virtual-only spending, and the
learning thresholds above. These proposals do not override user decisions.
The first live provider and target-device benchmark must be selected before their
stages. Use existing local/free tooling where feasible. Any newly proposed modeling or
image-to-3D tool must be checked against the user's exclusion of China-related
tools and the requirement that generated assets remain usable in this MIT
project without an incompatible licensing obligation. Verify actual ownership,
service/dependency involvement and output terms; do not infer compliance from a
package name or an open-source label. Paid services, new dependencies/tools and
third-party asset sourcing require their applicable explicit approval.

Technical obligations, owned by the implementing agent: resolve textured/rigged
asset transport; validate profile-specific clothing fit; complete missing scene
references; review/admit the replacement Inspector and its executable product
cases; prove event durability/backpressure and progression atomicity. These are
engineering proof gaps, not questions the user must solve. Planning ends here.

## Complete reference scene implementation

Authorized outcome: replace the wall-only landing view with the complete cutaway
office and neighborhood composition, using the existing catalog, navy application
frame, left Places/Agents and right Logs/Tasks tabs. Reuse the real official 3D
renderer; never use the reference image as the scene or a substitute screenshot.

The scene is a clearly labeled synthetic preview until real adapters exist. Place,
agent and assigned-task selection control the camera; task selection opens no
details. Filter tasks, search named targets, restore overview, and collapse side
panels on narrow screens. No fabricated provider connectivity, task execution,
economy, wardrobe persistence or layout transactions. Functional features beyond
these preview controls retain the full plan's later contracts.

Mutation scope: Office src, permanent app tests, its two plans and README, existing
Office Inspector/current flow, release impact notes. Approved asset inputs and
shared packages stay unchanged. No packages, pushes, deployment or new worktrees.
Use catalog-linked specs, existing public rendering APIs and the approved image
as the fixed discovery sources. Gates: geometry and ownership unit tests, naming,
lint/typecheck/build, real-browser interaction/mobile tests, overview and room/detail
screenshots. Stop for review only after the full scene is visible, or report a
concrete capability blocker. Do not claim exact model fidelity from an overview.

Current owner clarification: complete the code-generated scene work in this round
without Blender. Compare objects that actually exist in the implementation, rather
than requiring unfinished objects or a cinematic filter stack to pass. Optional
scene grading can be layered later and must not conceal geometry differences.
The current app remains a synthetic procedural preview, not acceptance of all
catalog assets. See the implementation contract and app README for construction,
LoD, lifecycle evidence and explicitly unverified model details. The full product
plan is still active.

Current owner correction (2026-10-25): remove rejected cat/corgi placeholders and
their procedural generator; keep approved animal inputs for a later Blender and
animation-capability stage. Prioritize tree canopy reconstruction and multiscale
visual review. Add camera-relative ground-plane WASD/arrow movement with Shift
acceleration and text-input isolation. This does not authorize filter work or
change the user-owned visual acceptance gate.

### Single-storey correction - owner clarification

The owner explicitly confirms that every office room is on the same first floor.
This supersedes the previous split-level interpretation, inferred stairs, raised
work/discussion platforms, and refrigerator-derived pantry elevation. The first
incorrect owner is `compose-office`: image fitting was permitted to trade floor
height for pixel alignment, and regression tests encoded that incorrect premise.

Bounded correction: freeze one shared finished-floor datum at the existing entry
level; remove room-height fit variables, indoor platforms and indoor stairs;
refit connected walls and supported furniture with that fixed plane. Preserve
exterior geometry and entry steps. Update the source landmarks, fit script,
generated layout, direct scene consumers, relevant regression tests and this
implementation contract. No renderer, asset recipe, filter or exterior edits.

Test first: all room floor surfaces and wall bases share the entry datum, every
floor-standing furnishing rests there, and no indoor riser/platform remains.
Retain source-projection residuals, support/penetration checks and exterior
snapshot; do not increase visual thresholds to conceal an incompatible fit.
Then inspect the actual app overview and room/oblique captures. A lower pixel
residual may never override the single-storey constraint. Review found no scope
or owner conflict; source-image dimensional authority remains subject to the
owner's explicit clarification of spatial topology.

### Structural review before room furnishing

The owner changes the execution order: establish storey count, foundation, floor,
walls, partitions, doors and openings before furnishing any room. This is an
explicit review checkpoint. Pause furniture/decor iteration; show the actual app
in an intentional structure-only composition stage, preserving exterior objects.
Keep the furnished authoring data for subsequent room-by-room work, but do not
render interior furniture, decoration or occupants in structural review.

The `compose-office` owner selects the stage; the renderer receives normal
geometry and does not substitute a diagnostic scene. Formal cases must prove one
shared floor, no indoor risers, the presence of walls/openings, absence of room
furnishings, and unchanged exterior geometry. Inspect overview plus room views
from the running app. Stop for owner review of the structure before starting the
next room; do not treat the larger reconstruction goal as complete.

### Rejected furnishings and entrance - structural checkpoint

The owner rejects the current door appearance, meeting/work furniture, laptop
scale, rug placement, omitted low stool, lounge seating and pantry appliance
proportions. None is accepted by the structural checkpoint. Keep all interior
furniture/decoration/occupants absent in the live structure stage. Withdraw the
rejected complete entrance door from that stage as well; retain the real wall
opening and header without a substitute slab or proxy door.

Deferred Blender work: the two-seat sofa, lounge armchair and upholstered curved
work/meeting chairs. Their approved references and component specifications stay
as modeling inputs; do not display the current procedural approximations as
placeholders. Regular door components, desks/tables, laptop, rugs, low stool,
refrigerator and rotational dispenser geometry remain suitable for procedural
construction, pending reference-based correction and individual review.

Bounded owner: `compose-office`. Edit the entrance stage admission, permanent
structural-stage regression, implementation status and this plan. No new Blender
job, new models, asset-spec rewrite, exterior change, commit or push. Test first
that the structure stage omits the rejected door while retaining a real opening;
then check the live app overview. Stop at structural review before room work.

Validation of this admission correction: the structure-stage test failed on the
retained entrance door, then passed after its live-stage removal (2 cases).
Two live-browser overview/measured-view cases pass at APP_URL; actual screenshots
and the user's open tab were inspected with an empty entry opening and no
interior furnishing proxies. App lint/typecheck and the static Inspector contract
pass. Evidence: `apps/asyra-office/test-results/office-rejected-assets/`.
This is withdrawal of rejected output, not acceptance of a rebuilt door or room.

### Rectangular lounge footprint - occlusion is not a boundary

The owner confirms that the lower-right room is rectangular. The prior foundation
fit mistakenly treated points on decorative/plant occlusions as exposed building
corners, producing a diagonal clipped apron. This interpretation is rejected.

Owner step: `compose-office`. Bound the correction to the existing offline
foundation construction, measured input classification, generated fit, direct
floor/support consumers, structural regression tests, and these existing docs.
Extend the existing front facade and right exterior wall planes to their square
intersection. Keep the shared first-floor height, wall placements, rejected-asset
omissions and exterior objects unchanged. Do not fill the missing corner using a
separate patch slab. The canonical foundation and plank clipping outline must
both be rectangular. Retain the earlier pixel marks as occlusion-only evidence,
not structural corners. Update furniture-support constraints to the same floor
boundary without starting any room furnishing work.

Test first: the source foundation has four square corners and full rectangular
top-face area; the finished floor covers the previously removed front-right
corner. Replace the obsolete test that demanded the incorrect diagonal edge.
Run focused structural/exterior regressions and live overview/lounge/measurement
captures; inspect the real floor corner and reference together before closeout.

Validation: the new regression first failed because the clipped slab top area
was 26.9331 instead of the enclosing rectangle's 29.7891 scene-area units. After
correcting the canonical outline, all 7 scoped structural, wall-projection and
exterior-preservation cases pass. The 3 live-app overview, lounge (including
oblique), and measured-reference cases pass; screenshots show a continuous
rectangular floor underneath the foreground planters. App lint and typecheck
pass. Evidence: `apps/asyra-office/test-results/office-rectangular-footprint/`.
This closes the clipped-corner defect only; structural acceptance and room
furnishing remain pending. No exterior objects were relocated.

### Rear wall corner joints - structural review continuation

Step Execution Card: owner/failure owner `compose-office`, Inspector order 11.
Inputs are the approved wall component geometry and existing reference-derived
wall centerlines; output is the composed spatial scene. The approved architecture
supplement assigns corner assembly to the app. Two equal-height rear corners
must close continuously without duplicated volume or a missing outside quadrant.
There is no bypass and no renderer-owned correction. Only this app's scene
composition, its permanent tests, live-review cases and existing plan/status docs
may change. Preserve the wall centerlines, heights, floor, free ends, asset
specification and all exterior objects. Room furnishing remains withheld.

Use complementary 45-degree end planes for body and cap at these equal-height
corners, including the distant representation. Internal identifiers belong to
scene assembly; no persisted or public identity changes. Do not introduce filler
blocks, renderer offsets or new dependencies. Cases: rear-left L joint and
rear-right pantry return, both body and cap, both detail representations. First
prove a missing quadrant or doubled coverage in composed geometry; then repair
the endpoint construction. Gates: focused joint and structural regressions,
approved wall tests, wall projection/exterior invariants, lint/typecheck/naming,
and actual-app overview/pantry/discussion/measured screenshots with enlarged
corner inspection. Stop this slice when those joints are verified; this does
not establish whole-building or furnished-scene acceptance.

Results: the two new corner cases failed before implementation (a missing rear-left
quadrant and doubled rear-right coverage). The corrected body/cap near/distant
geometry, existing structure and reusable wall cases pass (14 tests), as do the
4 bounded wall-projection, same-floor and exterior-preservation cases. App lint,
typecheck and naming pass; 4 live-browser cases pass. The projection oracle now
uses actual cap/center-plane intersections with its unchanged 12-pixel limit,
because a miter's AABB corner is not the traced centerline endpoint.

Evidence: `apps/asyra-office/test-results/office-wall-joins/`, including
`discussion-joints.png`, `pantry-joints.png`, and the measured-reference canvas.
The standard viewport is 1440 x 960; joint views use one normal Zoom out action
from the room view. The measured canvas is 845 x 756. Enlarged, unregistered
source/actual crops cover both rear junctions. These two joins are continuous;
material banding and remaining wall/door/reference alignment are not closed by
this result. A broader intermediate test filter also selected a deferred furnished
fixture and exposed its existing desk-chair/partition contact failure; that
fixture remains unaccepted and absent from the live structure stage. It was not
changed or declared passing in this slice. Whole-scene status remains incomplete.

### Partition abutments - preserve room boundaries without overlapping solids

Step Execution Card: `compose-office` remains owner/failure owner (Inspector 11).
Approved wall sections and measured layout are inputs; the output is the spatial
scene. Architectural component rules delegate corner assembly to the app. Review
shows perpendicular partitions still penetrate their host walls: work partition
into west wall, pantry divider into rear wall, and the unequal-height lounge L.
The taller lounge return must enclose the corner while the lower wall meets its
inside face. Existing free ends, centerlines, elevations and floor remain fixed.

Allow only scene endpoint construction/layout, regression tests, live-review
capture scope, and existing implementation/plan/evidence docs. Preserve exterior
geometry, approved reusable wall assets, furnishings exclusion and renderer
ownership. No filler blocks, appearance fixes or new dependencies. End offsets
come from the connected wall's half-thickness; the equal-height pantry cap meets
the rear cap's inside face, separately from the body joint. These are internal
assembly parameters, not persisted or public identities. No bypass applies.

Prove the overlap in composed body/cap geometry before implementation. Validate
unique plan coverage at low shared heights, complete lounge corner coverage,
unchanged free ends, near/distant parity, and prior rear miters. Required gates:
focused joint/structure/wall cases, existing wall-projection and exterior checks,
lint/typecheck/naming, and work/pantry/lounge/overview/measured actual-app images.
Inspect enlarged joints before closure. Stop this segment after these abutments;
entrance assembly and full structural acceptance remain separate.

Validation: the new regression reproduced doubled partition/host coverage before
implementation. After the face-derived endpoint cuts, 15 joint/structure/wall
cases and 4 existing same-floor/projection/exterior cases pass. The test also
protects all four affected free endpoints. App lint/typecheck/naming pass. Five
live-browser cases pass at APP_URL; work, pantry and lounge close views were
inspected together with the 845 x 756 same-camera reference comparison.
Evidence: `apps/asyra-office/test-results/office-wall-abutments/`.

These three contacts now meet without overlapping plan coverage; they do not
prove all wall contours match the illustration. The source lounge's stepped
right-hand wall still needs a closer depth/contour review, and the entrance
assembly remains a separate outstanding structural slice. Furnishings and
Blender-deferred assets remain absent from the live scene. Whole-scene status
is incomplete; exterior geometry was not changed.

### Lounge wall contour - two rises and one narrow intermediate section

Step Execution Card: `compose-office`, Inspector order 11, owns this source-image
geometry correction. Inputs are the approved full-office image, explicit traced
visible top-front corners, shared first-floor datum and existing wall asset;
output is the composed spatial scene. Enlarging source rectangle
`[730, 328, 832, 425]` shows two rises, not the single rise in the current model.
It does not establish a depth jog. Preserve a coplanar wall unless visible
reference evidence supports a depth change; do not invent one.

Bound edits to the lounge contour traces and offline fitting, generated fit,
scene wall layout, their direct tests/consumers and existing review docs. Replace
the former single transition with three consecutive full-height wall sections,
not overlays or filler strips. Heights and break locations must be solved from
source pixels; keep one floor and exterior assemblies unchanged. Other calibrated
wall endpoints remain required constraints. New names are internal scene/layout
parameters with no persisted compatibility obligation. Renderer writes and
unrelated room furnishing remain forbidden; no bypass is permitted.

Test first that the model contains both source rises and the intermediate cap,
with contiguous bodies and matching projected top-front corners. Refit with
explicit provenance, then run existing structural, joins, projection and exterior
gates plus lint/typecheck/naming. Inspect the actual lounge view, 50% same-camera
overlay and enlarged contour crop before closure. Remaining reference residuals
must stay visible; this slice does not establish full structural or room approval.

Fitting review: the first corrected contour leaves an 8.26-pixel right endpoint
residual and fails the new 6-pixel contour oracle. Do not relax that oracle. Both
green divider endpoints hit historical search-box lower limits (-2.5/-1.5),
which were optimizer guesses rather than source evidence. Replace those two
limits with the existing interior width (-3.02 to 3.02), preserving endpoint
ordering and all other source constraints. This is a correction to the same
offline owner fit; rerun every structural endpoint and exterior invariant.

#### Bounded iteration - correct edge identity before another fit

Two fitting attempts leave the right contour endpoint outside the fixed oracle.
Re-audit of the enlarged right-end crop `[875, 380, 925, 430]` shows why: the old
`[904,402]` mark describes the cap's rear/center region, while the new contour
case treats it as the front edge. The actual visible front corner is `[897,407]`.
Likewise the left cap contact is `[683,337]` on the front edge. These mixed edge
identities are the first unresolved input boundary; no added depth jog or wall
extension is justified. Replace the stale endpoint interpretation in the same
source input and independent oracle, retaining the original marks as superseded
provenance. The two step pairs remain `[767,365]`/`[767,359]` and
`[800,370]`/`[800,359]`. Re-run the same constrained fit and fixed gates.

The freer fit also exposes a redundant camera representation: shifting the
look-at point along its view ray changes distance/target values without changing
projection. Normalize that equivalent representation to the existing floor plane
so the orbit pivot does not drift outside the building as a fit side effect.
Preserve eye, field of view and viewing direction. Add a formal floor-pivot
assertion and retain all image projection checks. This is confined to the fitted
camera's direct consumer, not a new navigation design. Self-review: inputs now
identify the same physical edge; no renderer patch, arbitrary geometry target,
new candidate search or relaxed threshold is admitted. `compose-office` and the
same files/gates remain the bounded owner contract.

Current result: three coplanar wall sections and two rises are present. The
same-camera enlarged comparison is materially closer, but the 6-pixel contour
oracle still fails at the right high field (maximum contour error about 7.05 px).
The 26-point full fit is RMS 4.13 px; do not call this a completed contour or
structure. The user has been asked whether to preserve horizontal caps or allow
a slight source-derived slope. No answer is assumed, and the tilt is not built.
Other structural work may continue independently of that choice.

Validation: 16 joint/structure/reusable-wall cases and 2 camera/scale cases pass;
4 existing floor/projection/exterior cases pass. Typecheck, lint and naming pass.
Six live-browser camera and overview/lounge/measured cases pass. These prove
those bounded behaviors only, not the still-red contour case. Actual enlarged
source/scene crops and the app overview were inspected. Evidence:
`apps/asyra-office/test-results/office-lounge-contour/` and
`apps/asyra-office/test-results/interior-correction-details/lounge-step.png`.
Source-marker diagnostics record exactly which edge points entered the fit.
No room furnishing or exterior geometry change was admitted.

### Entrance structure - uninterrupted cap, closed corner and full support

Step Execution Card: owner/failure owner `compose-office`, Inspector order 11.
Inputs are the existing measured opening, approved wall body/cap profile and
shared floor. Output is the structural scene with an empty entrance. The current
plain header box loses the cap overhang/profile between its neighbours; the
low facade intersects the taller west wall. Foundation front uses an 0.08
half-thickness despite the existing facade's 0.18 body thickness.

Scope: scene wall/header construction, the shell dimensions already used by
scene/fitter (centralized without altering their values), foundation/plank bounds,
direct tests and existing review docs/evidence. Build the header by retaining the
approved wall above the opening, with the same cap as its neighbours, not an
extra trim overlay. Extend the taller west wall to the front facade outer face
and meet it at the west wall's inner face. Derive slab front from actual facade
half-thickness and floor coverage from that outline. Preserve the measured door
opening, all other walls, single-storey datum, rejected-door omission and exterior
steps/objects. The pending lounge-cap choice does not affect this work.

Test first for cap continuity, an empty measured opening, unique corner coverage,
and foundation support below the complete facade. New names are internal assembly
contracts, with no public/persisted compatibility. No renderer correction or
fallback is allowed. Gates: focused header/joint/structure/wall tests, opening/wall
projection and exterior invariants, lint/typecheck/naming, and actual overview,
work/entrance close views and measured reference capture. Do not clear the
independent failed lounge-contour case or claim whole-scene completion.

Entrance review correction within the same owner: the enlarged source crop
reveals that the old door landmarks described the surrounding wall, not the
opening. Re-trace the three visible opening corners on the facade front face;
the lower-left corner is occluded by the sign and must not constrain the fit.
Update the source landmarks and their plane semantics, then solve with unchanged
other measured landmarks and topology constraints. This supersedes preserving
the incorrectly measured opening values, while preserving the rectangular
single-floor shell, empty-door admission and exterior. Add a direct rendered
mesh projection regression before fitting; inspect the enlarged entrance again.

The corrected visible opening test fails by 25.18 px on the old scene. Re-solving
with a fixed front plane still leaves the visible threshold 7.49 px away. The
front plane was a historical seed, not an approved measurement. Revise the same
bounded fit to solve that shared plane from the visible threshold; propagate it
to the facade, west-wall end and full rectangular slab, keeping the floor datum
immutable. Search bounds constrain the front plane ahead of interior partitions;
no fitted bound may be treated as image evidence. Exterior steps stay unchanged.

The free-front-plane experiment did not improve any projection residual: it
introduced an unobservable scene/camera translation and shifted the normalized
front coordinate from -2.42 to -1.49. That experiment was removed. Keep the
existing coordinate datum; it is not evidence for a smaller floor. The corrected
opening top corners fit within 4 px, but the visible leaf-bottom/threshold region
still differs by about 7.49 px. Preserve that failing source-space case instead
of moving the floor, changing exterior geometry or claiming complete parity.

Entrance slice validation (2026-10-26): 18 focused structure/wall cases pass,
4 existing source/projection/exterior cases pass, and 2 camera cases pass.
Two stricter source cases remain failed: lounge top contour (7.37 px at the first
failing point versus 6 px) and entrance bottom-right (7.49 px versus 4 px).
The superseded door-mesh/wrong-landmark loop was replaced by the stricter actual
opening case; no tolerance was increased. Types, app lint and the 15-case naming
gate pass. The four selected browser cases pass on `http://127.0.0.1:5194/`:
overview, work room, lounge and the calibrated 845 x 756 canvas. Inspected their
actual app screenshots, the lounge oblique view, 50% overlay and enlarged
entrance/foundation comparisons. The existing user tab was reloaded and checked.
Evidence: `apps/asyra-office/test-results/office-entry-structure-final/` and
`apps/asyra-office/test-results/interior-correction-details/entrance.png`.
The rectangular floor/continuous entry cap are present. Overall visual acceptance
and technical scene closure remain failed/pending; do not furnish the rooms yet.
No commit or push was made.

### Lounge wall correction - two level sections, one height step

Owner/failure owner: `compose-office` (Inspector 11). The owner explicitly
corrected the interpretation: two different-height walls, each with a level top;
no sloping cap. This supersedes the pending slope question and the three-section
model. Enlarged source inspection shows `[767,359]` to `[897,407]` is one front
cap edge. `[800,370]` lies on that edge; `[800,359]` is on its rear/top-face edge,
not another front-face rise. Keep the single rise at x=767 (low y=365, high y=359).

Bounded scope: lounge topology in the existing scene owner, source point identity,
fitter, generated dimensions, direct projection/structure tests, current docs and
app evidence. Remove the fictitious middle wall and its parameters; preserve the
complete rectangle, shared first floor, exterior geometry and deferred furnishing
admission. No renderer changes, patches, slopes or tolerance relaxation.

Test-first: exactly two coplanar wall sections, one positive step, constant cap
height on each section in near/distant geometry, continuous contact and the four
correctly identified front-edge endpoint projections below 6 px. Run focused
wall/joint/structure, source projection, exterior and camera checks, lint/types/
naming, then the real app overview/lounge/calibrated views and enlarged overlay.
The entrance projection issue remains an independent open case. Completion of
this slice does not mean the whole office is accepted.

Two-section outcome: the old scene failed the new topology check because the
third wall was present. It is now removed from composition, fitter parameters
and active measurements. The topology/level-top test passes in both LoDs;
18 structure/wall/joint cases and 4 other projection/exterior cases also pass.
Two independent pixel cases remain failed: far right cap endpoint 6.74 px versus
6 px, and entrance bottom-right 6.93 px versus 4 px. No threshold was relaxed.
App types/lint and 15 naming cases pass. Three real-app browser cases pass
(overview, lounge including an oblique view, calibrated reference capture) at
`http://127.0.0.1:5194/`; screenshots, enlarged cap-step comparison and the
reloaded user tab were inspected. Evidence lives in
`apps/asyra-office/test-results/office-two-wall/` and
`apps/asyra-office/test-results/interior-correction-details/lounge-step.png`.
The two horizontal sections now follow the owner's clarification, but geometric
reconstruction is not fully accepted. No furnishing admission, commit or push.

### Lounge terminal plane - align the enclosure with the outer shell face

Step card: `compose-office`, Inspector 11, same structural admission and failure
owner. The remaining right endpoint delta is (-6.70,-0.78) px: lateral rather
than height error. The wall currently ends on the east wall centerline, whereas
the complete rectangular shell terminates at its outer body face. Resolve that
terminal endpoint from the existing shell east coordinate and half-thickness;
do not introduce a fitted endpoint offset or sloped cap. This is an assembly
boundary inference to verify against the same four source marks, not proof from
image pixels alone. Preserve the two horizontal sections, contact, floor and all
exterior geometry. Scope is scene layout/fitter/source provenance and their tests,
docs and evidence. First prove terminal body/cap coverage fails at both LoDs,
then re-fit and inspect the source overlay and oblique actual view. Do not accept
this inference if the original source endpoints or rectangle/contact regress.
No new tolerance, filler geometry, renderer adjustment or furnishing admission.

### Remove the occluded lounge-foot misidentification

Same owner and scope; independent entrance regression is already red. Enlarged
source grid (610,330)-(705,515) proves the supposed lounge-return foot at
`[636,486]` is the foreground terracotta pot bottom/floor region, not a visible
wall-foot corner. That false floor anchor competes with the visible entrance
threshold and must not constrain the camera. Remove it from active landmarks,
fitter geometry and its stale projection assertion; retain its exact rejected
identity under occlusion provenance. Do not replace it with a guessed hidden foot.
Keep the visible green divider base and three opening corners as floor evidence,
with the immutable common floor and exact rectangular coverage tests. Keep the
4-pixel visible-opening and 6-pixel lounge-front thresholds unchanged. No floor
height or exterior changes. Re-fit and inspect the same source crops and actual
app views before accepting any improvement.

### Whole-building structural reconstruction - active goal

The current goal supersedes furnishing work: reconstruct the complete foundation,
one first-floor plane, room spaces, wall graph and architectural openings from
the approved office image. Furniture, decoration, wallpaper and occupants remain
excluded. Preserve exterior geometry. Matching wall-top marks alone cannot close
this goal: the current fit has only two floor anchors and does not establish room
areas or the complete floor boundary. Its normalized 6.2-unit width is not a
physical building measurement. Audit visible base edges, room connectivity and
wall-plane identity before changing the whole layout; record occluded edges as
unknown rather than assigning them pixels from nearby plants or objects.

Next owner segment: `compose-office` (Inspector 11), reference composition under
`implementation.md` / office interaction. Inputs are the approved reference,
architectural specifications and existing fitted layout; output remains the
canonical spatial scene. Allowed contributor is this app's scene owner; no
renderer geometry, camera-specific patches or furnishing admission. Boundary:
`src/scene/office-layout.ts`, its direct structural tests, existing source
measurements, fitter, and structural documentation/evidence. Current-segment
cases are a reference-visible gap between the meeting rear wall and the pantry
rear corner, and a complete pantry L-joint at both LoDs. First prove the old
extra connector fills that gap, then remove that invented connector and form the
actual corner from the two incident walls. No threshold changes. Gates: focused
structural/joint/projection/exterior tests, naming, app types/lint, actual-app
calibrated and pantry views plus enlarged source/actual inspection. Stop this
segment if the visible gap or incident corner cannot be preserved together.

Source evidence: crop (480,60)-(1025,430) in the original 1280 x 800 image shows
the meeting rear wall ending at (758,132), with an exposed vertical end and
background beyond it. The pantry divider continues behind that end toward
(794,145). There is no horizontal wall across those two top endpoints. The old
`back-wall-transition` incorrectly filled this interval and made the rear wall
continuous. Its removal does not prove the entire floor plan or room dimensions;
those remain open under the active whole-building goal.

Rear-gap segment result: the old scene failed the new empty-interval and pantry
corner checks. Removing the connector and making the two pantry walls meet with
complementary 45-degree ends passes 12 structure/joint/opening checks, six
projection/exterior checks, app types/lint and naming. Two live-app cases pass;
the calibrated view confirms the gap is now open. This closes that bounded
correction, not the building reconstruction.

Next segment, same `compose-office` owner and boundaries: test clear floor
samples in the original image against the actual shared ground and room walls.
P1=(790,350) and P3=(910,389) lie on visible pantry planks; D1=(610,301) lies
on visible meeting-area planks. The inspected candidate P2=(805,360) is a wall
cap and is explicitly excluded. These samples establish containment, not exact
world coordinates or physical measurements. Use the existing source projection,
ray/floor intersection and canonical wall faces; first prove the current pantry
fails containment, then assess a joint wall/floor fit. Never solve containment by
raising floors or widening tolerances. If the shared-plane fit cannot satisfy
both visible edges and floor patches, retain the failed case and record the
specific incompatible evidence; do not publish an unverified candidate.

Joint floor-containment result: both original pantry samples failed the formal
room-bounds cases; a separate ray/triangle case also found a structural occluder.
The corrected fit solves shared-camera/wall geometry with hard room-containment
constraints and leaves every room on Z=0.38. It updates structural data only;
furnishing data is preserved without refitting. Sixteen structure/joint/opening
cases now pass, including both LoDs for unobstructed floor samples; six source
projection/exterior cases, types/lint and naming pass. Six browser cases pass in
`test-results/office-floor-containment/`; measured overlay and the current user
tab were inspected. RMS=2.706 px, maximum=4.233 px over 22 source endpoints.
This is not complete structural acceptance. Three clear patches do not establish
all room boundaries or areas, and the short return behind the lounge crown still
needs explicit plane/topology identification. Architectural frames remain pending.

The owner reported diagonal banding in the actual hardware-rendered view. Reading
the app/provider shows no stripe filter; likely shadow self-occlusion requires an
on/off isolation before a causal claim. The software browser checks disable
shadow maps through provider policy, so they cannot close this artifact. Preserve
this limitation rather than treating software screenshots as full visual parity.
No shadow/provider change, furnishing admission, commit or push in this segment.

### Structural entry frame - current owner segment

Owner/failure owner remains `compose-office` (Inspector 11). Input: measured
rough opening in the fitted facade and the approved `entry-door-set` construction
specification. Output: the canonical structural scene gains only the two jambs
and head, using the existing catalog parts. The current goal explicitly includes
architectural frames; the rejected leaf, fixed panel, hardware and decoration
remain excluded from this structural-only admission. This does not approve a
partial door as a completed door asset. The later complete door still requires
its fixed side panel and leaf together.

Boundary: scene-owned `entry-frame.ts`, `office-interior.ts`, direct entrance/
structure tests and current docs/Inspector condition. No catalog recipe, renderer,
external street object, source image or furniture change. Names are scene-local,
not persisted identities. Scale X/Z from the approved 1.66 x 2.17 rough opening;
frame thickness follows the same scale as its vertical construction profile,
not receiving-wall thickness. Align frame front with the facade front face and
bottom with the shared floor; no invented trim, threshold or frame-depth offset.
This front-face attachment is an explicit assembly assumption because the exact
recess is not independently visible in the source; do not claim it was measured.

Test-first: old structure must fail for missing frame. Verify exact three-part
membership, nominal-to-opening scale, retained installation clearances, jamb/head
contact, clear walk-through aperture, and no rejected door parts. Run these with
existing wall/floor/projection/exterior gates, types/lint/naming, then measured
live-app capture and enlarged entrance review. Stop if frame geometry intersects
the rough wall opening or reduces the aperture differently from the approved
specification. This segment does not close room proportions or wall topology.

Entry frame validation: the missing-frame case failed before implementation.
The scene now installs only approved jamb-left/jamb-right/head members, scaled
from the rough opening, with bottom contact and retained fitting gaps. Seventeen
structure/joint/opening cases and six source projection/exterior cases pass;
types/lint/naming pass. Three actual-app browser cases pass. The enlarged source/
actual entrance comparison confirms the retained opening and three members;
it does not approve the omitted door leaves or resolve full-building proportions.

Same owner, evidence-only continuation: add an opt-in hardware browser capture
of the existing structural app, using the ordinary URL and camera controls.
Record the actual WebGL renderer and reject software fallback in that case.
The default software CI suite remains available, but cannot substitute for this
hardware screenshot when reviewing the reported diagonal banding. No lighting,
provider, material, shadow-bias or postprocessing change is authorized by this
verification segment. Gate is the maintained hardware case plus app lint/types;
software-only availability must be reported as unavailable evidence, not passed.

Hardware evidence result: the opt-in case passes on ANGLE Metal / Apple M3 Max
at the same APP_URL; renderer metadata is saved beside the two screenshots in
`apps/asyra-office/test-results/office-structure-hardware/`. Enlarged hardware
walls visibly reproduce the diagonal banding. The software/hardware evidence
gap is now documented and reproducible, but shadow cause and repair remain open.
This case asserts backend/runtime validity, not visual acceptance. The underlying
production lighting remains unchanged. The structural goal remains active.

### Lounge rear T-return - current owner segment

Owner/failure owner: `compose-office` (Inspector 11), the same structural scene
contract. Source crop (740,320)-(870,405) distinguishes a separate short wall
extending behind the higher lounge section toward the pantry. At the current
shared crown plane, inverse projections of (800,359) and (817,367) lie near the
main wall's rear face, not its front face; (833,343) extends rearward. Thus this
quad does not establish a third collinear height step. Retain the two measured
front wall sections, and add the actual perpendicular T-return instead.

Inputs: three visible cap corners, one occluded-corner range, existing fitted
camera/main wall, approved wall profile. Output: a real near/distant wall member
on the shared floor, with its body and cap abutting the respective rear faces
of the main wall. Derive its X position, length and thickness from the image;
keep its crown at the joined main wall's crown. Do not alter the camera, main
wall levels, or room floors to fit this small member. The hidden end's range is
uncertainty evidence, not a fourth exact point.

Boundary: source landmark details, existing fitter, generated structural fields,
scene wall layout and direct tests/docs/captures. No renderer, furniture, exterior
or catalog change. First fail the missing-member/projection/contact cases. Gates:
three visible cap corners below 4 px, occluded corner inside its source range,
body/cap face contact with single coverage at both LoDs, shared floor, retained
floor-sample visibility, and rear passage at least as wide as the entrance clear
aperture. Then run existing structural/projection/exterior cases, types/lint/naming,
and actual-app pantry/lounge/calibrated captures with a fixed enlarged T-return
comparison. No extra patch solids or projection-specific geometry. Stop if these
constraints cannot coexist; preserve the rejected candidate rather than admitting
it with relaxed thresholds. Whole-floor boundaries and room areas remain a
separate unresolved part of the same full structural goal.

### Interior circulation - next structural segment

Owner remains `compose-office`. The T-return segment passes its focused gates;
the whole structural goal remains open. The user explicitly defers diagonal
banding and lighting to the next phase. Do not modify rendering or filters.

A floor-plan inspection finds only 0.215381 scene units between the pantry
left wall's front end and the lounge rear wall, versus 0.747272 for the measured
entrance clear aperture. A point can pass, but an entrance-width opening cannot.
This is a structural circulation discrepancy hidden by wall-top-only checks.
Check real wall footprints and preserve an indoor route from the entrance to
all four areas. Use the accepted entrance clear width as the relational passage
criterion; it is a functional constraint, not a measured hidden source edge.
Do not claim the occluded passage has an exact independently recovered width.

Boundary: existing structural fit/landmarks/layout, permanent actual-mesh tests,
linked dimensions notes, and actual-app comparisons. Establish the failing
pantry gap test first, then evaluate a constrained whole-structure candidate
without touching the live layout. Keep existing source corner tolerances,
shared floor, topology and exterior preservation. Refit the local T-return when
the global structural projection changes. Admit only if all constraints coexist;
otherwise retain the current structure and report the conflicting evidence.
Do not fit furniture, change cameras independently to hide errors, invent a
floor step, or reduce the existing projection/visibility checks.

Circulation replan after rejected candidates: the first fit reached 6.816 px
maximum and exceeded the 4 px entrance corner gate; adding hard projection
constraints did not converge. Neither candidate was applied. Do not repeat
optimizer tuning. Re-audit source landmark identity against actual cap faces
before another candidate. The existing endpoints are center-plane projections,
while the source contains visible front/rear cap corners. That correspondence
must be demonstrated, not assumed. Keep the current live structure and the
failing actual-mesh circulation regression while resolving this measurement
boundary. Review only the affected pantry/lounge/source camera inputs, not
furnishing or exterior placement. Any amended measurement must name its real
surface/corner and retain the superseded observation as rejected provenance.
The final gate remains physical same-floor circulation plus source projection,
not either one in isolation. No renderer mutation is authorized.

Re-audit correction: the failed candidate incorrectly treated the entire door
frame aperture as passage. The approved complete door contains a 0.60 m fixed
panel and a 0.90 m operable leaf. Use the leaf's nominal span, scaled from the
measured rough opening (currently 0.442463 scene units), as the circulation
criterion. The complete frame aperture (0.747272) is not traversable door width.
This replaces the prior passage assumption; it does not relax image projection
gates. The actual-mesh regression still fails before implementation (0.215381).
Use exact nearest-face clearance, including a corner-to-corner route if the walls
do not overlap in X; do not force their X planes to overlap. Keep the fixed panel
in the future full-door contract. Source cap identification remains a separate
review item, and no landmark is changed without image evidence.

Current circulation result: the accepted fit records RMS 3.012 px, maximum
4.774 px, with all three entrance corners below 4 px and all existing wall
projection gates retained. The pantry route grows from 0.215381 to 0.410428 scene
units, matching the measured door's 0.90 m leaf span after scene scaling. The
T-return is rederived from the new global camera. Nineteen structural cases,
two whole-floor near/distant connectivity cases and seven selected projection /
exterior preservation cases pass. Six actual-app overview/room/calibrated cases
pass; enlarged pantry and lounge images were inspected. This remains partial
structural evidence, not whole-building visual acceptance.

Next unresolved source structure: the east pantry edge has a real low wall and
cap, visible in source crop (885,335)-(1015,435), currently missing in the app.
Approximate visible rear cap corners are (988,370) and (999,374). A diagnostic
with the current high end-stub's front plane has errors 9.33/6.49 px; do not admit
that geometry. At the accepted camera, inverse intersection at current inner /
outer cap X planes puts the ends near Y 2.59/2.52, while the existing end-stub
front is Y 2.37. Re-audit whether that short high stub is an actual perpendicular
wall or the exposed end face of the rear wall before adding the parapet. Do not
add overlap solids, extend it through the rear wall, or move the exterior to
hide this discrepancy. `compare-interior.py` retains the fixed source/app crop
and a source-coordinate grid. This is the next `compose-office` structural
measurement segment; no furniture or shadow work is included.

### Pantry east parapet - source-plane correction

The previous turn made progress: T-return, source-constrained circulation and
actual-mesh near/distant paths changed authoritative structure and evidence.
Current owner remains Inspector `compose-office`, with structural geometry,
its existing fitter, tests and linked dimensions notes as the bounded scope.

Source review of the rear-right crop shows an exposed rectangular rear-wall
end, not an evidenced perpendicular high return. The current tiny `pantry-side`
creates a visible extra forward projection. Replace that unsupported return
with the closed flat end of the rear wall; retain the real left miter. The low
east parapet meets the rear wall's inner body face and the lounge wall's rear
body face, with a continuous horizontal crown and the shared floor datum.
Its body outer face remains on the existing foundation outer plane. Thickness
and elevation must be solved from reference evidence, not chosen to fill gaps.

The rear cap corners alone are insufficient: a local fixed-camera candidate
matches those within 4 px but misses the long visible edge by 15.28 px. Reject
it. Add the visible long-edge samples and an occluded-front-end range to the
joint structural fit. Re-solve camera and connected building geometry together;
never adjust the camera independently or skew a screenshot. Keep all existing
wall/opening tolerances, fixed shared floor, source floor visibility and door-leaf
circulation. Derive the T-return again after the joint solution. Test first for
missing parapet, long-edge alignment and the unsupported high return. Gates also
require exact low/high abutments, foundation support and exterior preservation.
A candidate that cannot meet these constraints stays out of the live model.
No furnishing, exterior, lighting or provider mutation is authorized.

Projection diagnosis after the rejected joint parapet candidate: known parallel
Y edges in the source have similar slopes at high and low elevations, whereas
the current finite-perspective result gives the low edge much stronger slope.
Before changing more structure, evaluate the orthographic limit offline with
the same geometry, source gates, floor and passage constraints. This is an
explicit diagnostic hypothesis, not an admission of a new rendering capability.
The existing preset camera contract exposes perspective only. Do not change the
provider or live camera, bypass tests or adopt an unsupported projection from
this diagnostic. Preserve its result separately, including failed constraints.

Revised parapet contract after projection diagnostics: both finite-perspective
and orthographic flat-cap hypotheses failed the retained source constraints.
Do not interpret numerical failure as proof that the source is impossible.
The unsupported assumption is equal endpoint elevation on this continuous low
cap. Derive both endpoint elevations from its corners and full edge while
retaining the rectangular footprint, shared floor and exact high-wall abutments.
This produces a source-inferred inclined cutaway profile, not a raised floor or
an imposed third lounge step. All 4 px parapet contour gates remain unchanged.
The regression now reads each actual cap-end elevation instead of using the
whole cap AABB maximum for both ends. Other walls keep their existing horizontal
crowns. Rejected flat-profile results remain in the diagnostic artifacts; remove
the failed projection branch from the live fitting path rather than retaining
an unsupported renderer option. The global solution is re-run only for the real
rear-wall end-face correction, then the local profile is source-derived.
This inference must be stated in dimensions notes and inspected from other views;
it is not a claim of uniquely recovered unseen geometry.

The sequential endpoint refit then local profile fit failed the unchanged rear
corner gate (8.38 px), so it was not applied. The corrected solver optimizes the
connected structure and profile together using the already accepted structural
state as a deterministic seed. All original wall, opening, floor, circulation
and parapet gates are simultaneous constraints; there is no independent camera
adjustment or downstream profile relaxation. Review the resulting physical
profile and oblique view before accepting it.

Numerical admission: the joint solver reached feasible geometry but stopped
without certifying objective stationarity. Preserve that termination in the
candidate metadata. Independently evaluate every original geometric inequality
without weakening its threshold; feasible geometry can proceed to formal mesh
and visual review, but must not be described as a converged global optimum.
The solver uses a stricter internal margin to avoid landing on pixel gates.

The unchanged-exterior gate detected a label ownership bug after increasing the
rear room depth: it classified interior labels as exterior using a fixed 2.5-unit
coordinate threshold. Record labels produced by the interior composer by object
identity, as assemblies already do, and use that ownership in the regression.
Do not update the stored exterior digest; it must remain byte-identical.

### West-room divider topology - owner correction

The owner identified that the cream and green dividers must occupy the same
partition line between the lower-left and upper-left rooms. Enlarging source
crop [370,180,635,395] confirms two adjacent lengths with a visible opening,
a taller cream member on the left and shorter green member on the right. The
previous independent `greenY` freedom and overlapping X ranges were wrong.

Step Execution Card: `compose-office`, Inspector 11, structural geometry and its
existing fitting/test/doc owners only. Test actual near/distant mesh center
planes, ordered X ranges, shared bases and distinct crown heights first. Remove
the independent green depth parameter; both members consume the same plane.
Keep the visible opening rather than inventing a solid connecting wall. Derive
lengths, heights and opening width from the existing source marks only after
these topology constraints are fixed. Existing floor, entrance, lounge, pantry,
exterior and contour gates remain. Do not trade this relation against lower
pixel residuals. Do not change furniture, exterior, lighting, or shadow banding.
If the old marks conflict with this owner topology, inspect point identity before
changing bounds or introducing new camera/geometry freedoms.

The old feasible seed was infeasible under the corrected same-plane topology.
Use unconstrained residual initialization within physical bounds, followed by
simultaneous constrained refinement; neither intermediate result is live.
Remove the old unexplained 0.15/0.30 seed-layout spacing penalties and retain
positive ordering plus the independently documented passage-width constraints.
Source projection limits and physical acceptance checks are unchanged.

Current west-divider checkpoint: the actual-mesh same-line regression is red,
confirming the owner's report. The constrained candidate and topology-aware
initialized candidate both failed retained source constraints; neither changed
the live fit. Stop numerical retries here. Re-audit source point identity and
structural relations before another solver run. Do not present the prior
21 structural / 8 projection passes as acceptance of the corrected topology.

Point-identity audit: perform one offline ablation of the disputed green-wall
foot [591,370], while retaining the owner same-line topology and every other
constraint. Report that excluded point's residual against the original mark;
never apply this diagnostic or relabel it a passing fit. The enlarged source
shows a floor/step junction near this foot, while the owner explicitly requires
one floor. This diagnosis distinguishes conflicting point interpretation from
an unconstrained green-depth escape. No acceptance threshold is changed.

The point-identity diagnosis completed. With the disputed foot excluded only
from the offline fit, the other 21 marks meet their existing limits, including
both green cap endpoints at approximately 0.36 px. The excluded foot projects
to [592.605,443.185] versus source [591,370], a 73.203 px discrepancy. The result
is in `test-results/west-divider-point-diagnosis.json`; the marked source crop is
`test-results/interior-correction-details/west-divider-floor-conflict.png`.
This is evidence of a failure in the current reconstruction, not a mathematical
proof that no projection or interpretation can solve the source. Do not delete
the source foot, relax its final regression, or admit this diagnostic as live.

The owner has been asked whether a separate geometrically consistent structural
correction drawing is permitted before further reconstruction. This would allow
visible proportions to change and therefore needs direction beyond the existing
exact-reference contract. Preserve the original reference and wait for that
answer before changing the visual target. The live west divider is still wrong;
the goal and structural acceptance remain incomplete. No commit or push.

### Authorized structural correction drawing

The owner permits a separate correction drawing while preserving a common floor
and collinear west-room dividers. This is a review proposal, not permission to
replace the reference or apply a new layout to the live app. Scope: one new
geometry-backed review sheet, its reproducible drawing source and numeric inputs
under the architecture review directory. No production scene, exterior, lighting,
furniture, commit or push changes.

The drawing prioritizes the corrected topology. Keep the current cream wall and
shell as the contextual baseline. Derive the green member length from the source
horizontal cap-span ratio (71/101) relative to the cream member, and its height
from the approved partition/wall height ratio (1.35/2.50). These are proposed
ratios, not a claim of exact metric recovery. The gap is the greater of the source
gap/span ratio (22/101) and the documented source-scaled main entrance leaf span,
so the proposal retains a traversable opening without inserting a floor step.
Both views must be projections of the same saved solids. Mark the proposal and
normalized dimensions clearly. Review same floor, same partition line, ordered
members, open gap, positive solids and preservation of the live inputs before
showing the one final sheet. Original-image pixel fidelity remains unaccepted.

The correction sheet and its numeric geometry are now saved as
`assets/asyra-office/models/architecture/review/office-single-floor-structure-proposal-v1.*`.
Self-review checked the final structure/top views, common floor, collinear
dividers, clear opening and continuous facade cap. The drawing preserves the
original-image and live-input hashes; the naming gate passed. The proposed green
height and wider opening await owner review. No runtime correction or full
structural acceptance is claimed.

### Structure drawing revision - four owner corrections

The owner rejected the preceding proposal. Supersede its module-derived divider
height ratio and its claimed completeness. Revise only the drawing source,
proposal PNG/JSON/note and permanent drawing checks in the architecture review
directory. The full reference and four owner-supplied crops govern this revision.
Do not change the app, furniture, exterior, runtime tests, commit or push.

The drawing must lower the cream divider and keep green only slightly lower;
retain their common plane and floor. Show the thin left frontage separately
from the thick entrance wall. Fit the complete entry-door-set with its fixed
0.60 m left panel and 0.90 m right leaf, using one scale for all door dimensions.
Show the lounge rear as high/low/high horizontal sections and its left boundary
as low/high sections. Remove the mistaken east pantry parapet and show that
region as white floor at the common datum. The previous inferred parapet slope
is rejected for this proposal.

Checks: permanent drawing-contract tests must reject the previous sheet data,
then pass the revised geometry; inspect the final full sheet and enlarged
entrance/divider/lounge details. Both views must still use the same solids.
Preserve reference/live hashes and keep approximate height inferences explicit;
do not describe these as recovered survey dimensions or full reference parity.
Stop at the one revised review sheet.

Owner clarification: future expansion must support the first version's original
appearance; it does not justify regularizing the source layout. The revised
sheet therefore uses the source-ratio divider gap without gameplay widening,
different front wall depths and discrete lounge height steps. The old module
height ratio is removed. New height ratios are explicitly visual estimates
awaiting review, not exact measurements. The entrance assembly uses all approved
component dimensions at one scale; its pier now meets the lounge side, with
the entire opening clear of that side wall.

The permanent proposal tests first rejected the old drawing data, then passed
all four corrected relationships. An added door-clearance assertion also caught
and resolved the inherited placement conflict before delivery. Final full-sheet
and native-resolution detail review completed; naming and scoped text checks
passed. Source/reference hashes remain unchanged. This is only a revised drawing
checkpoint; the live scene and full structural goal remain incomplete.

### Lounge wall proportions - source-corner reconstruction

The owner rejected the lounge proportions. The previous tests checked segment
counts but incorrectly enshrined high/low/high rear heights and did not compare
length ratios. Replace that oracle using the newly supplied lounge close-up.
Scope remains the proposal drawing, its measurements/source crop, reproducible
generator, semantic checks and note; no app or exterior/furniture changes.

Freeze discovery to those files and visible crown/step/foot corners in the
1828 x 1268 owner image. Recover a local weak-perspective axis basis from the
rear/side crown slopes; derive lengths and heights at the existing rear width
similarity scale. Screen-space vertical placement alone is not wall height.
Keep all bases level, all segment tops horizontal and the entrance untouched.
Derive left low/high lengths and three ascending rear heights from the corners,
not the previous 55%/10% assumptions. Hidden floor contacts and inconsistent
source slopes must remain explicit uncertainty, not invented exact evidence.

Run a failing source-ratio regression first, then regenerate the single proposal
and inspect a same-view local comparison. Record endpoint residuals rather than
claiming complete pixel fidelity. Retain the old proposal's unrelated geometry,
door assembly and source/live hashes. Stop at owner review of the drawing.

The source trace now contains twelve crown/step/foot/branch points. The two old
proportion assertions failed before correction. The revised six tests pass,
including checks derived from emitted wall records, not a separate display
model. The low/high left length ratio changes from 2.609021 to 1.348485; the
rear widths follow 393/157/445 source pixels. Maximum selected-corner residual
is 6.397 px against an 8 px picking tolerance. These are fitted points, not
independent validation. The partly obscured foot retains 20 px uncertainty.

The local depth revision moves the shared lounge/pantry partition and its floor
band connection while preserving the exterior slab and outer walls. The full
proposal camera uses the derived view direction; other room solids and the
entry assembly retain the preceding proposal. The focused side-by-side sheet
and regenerated full sheet were visually reviewed. Naming and scoped text/hash
checks passed. No live scene changes, commit, push or whole-goal completion.

### Owner acceptance - building structure

On 2026-10-26 the owner accepted the building structure after the lounge wall
proportion correction. The current approval and exact geometry snapshot are
recorded in
`assets/asyra-office/models/architecture/review/office-single-floor-structure-proposal-v1.md`.
This supersedes the preceding drawing-review waits, not the outstanding app
implementation and visual verification. Preserve the accepted geometry; do not
normalize its heights, thicknesses or asymmetric layout for future expansion.

Future view-dependent visibility must operate on independently identifiable
wall sections, floors and room components of a complete building. Zoom, view
direction and selected room may hide different obstructing parts without
deforming the accepted structure. Geometry LoD and cutaway visibility are
separate controls. Neither capability is implemented or accepted by this
drawing checkpoint. No furniture, live-scene edits, commit or push in this
approval-recording step.

### Apply approved structure to the live app

Owner step: `compose-office` (step 11). Inputs: admitted procedural assets and
owner-approved construction snapshot d86f7e7b55db77a90a75bf4ff7449581d8cd53c0aa58753722a89c93b239cd5d.
Output: the normal spatial scene with approved structural geometry, complete
uniformly scaled entrance and one continuous floor. No image fitting at runtime.
Promote construction parameters into an app-owned specification; review meshes,
source crops and diagnostics are test evidence, never runtime render inputs.

Boundary: scene construction/layout data, direct scene regression tests and
structural E2E captures; synchronize this plan, implementation contract and
compose-office Inspector clause. Allowed contributors: app scene owner and
existing catalog assets. Forbidden: renderer patches, furniture changes,
exterior geometry changes, lighting/filter changes, compatibility layout forks,
new packages, commit/push. No bypasses or new cache. Failure owner: compose-office.
Asset preparation occurs once per normal scene lifetime, not camera frames.

Cases/gates: composed mesh bounds and independent source corners agree with the
approved snapshot; coplanar dividers, discrete heights, complete doorway,
non-overlapping white floor finish, and unchanged exterior. Prove old output
fails before changes. Run focused structure tests, typecheck, app lint/build,
naming and real-app structural E2E at APP_URL, then inspect overview and close
screenshots. Existing original-image fitting oracles are superseded only where
the owner accepted a corrected construction; retain unrelated authoring checks.
Stop on a geometric mismatch or runtime failure, not merely green tests.

### Approved structure - live application result

Applied the frozen approved construction through normal scene/catalog owners.
The new independent snapshot oracle first failed 14 of 18 cases against the old
scene. Final validation passes 40 focused structure cases, two selected exterior
preservation/horizontal-crown cases, app typecheck/build, lint, and 15 naming cases.
One actual-hardware E2E case passed; its overview and close captures were inspected
and retained beside the approved geometry as `live-approved-structure-*.png`.
The user-facing app at port 5194 was reloaded and checked. Existing large bundle
warnings remain; no full furnished-scene acceptance is claimed.

The superseded projection, parapet and door-frame-only assertions were replaced
by frozen approved construction, contact and opening checks. The old mandatory
character-radius path assumption was removed in favor of preserving the accepted
physical gap. Furniture authoring tests retain their source camera and remain
outside this structural acceptance. No lighting, exterior geometry, furnishings,
commit or push changes are included.

### Publish accepted structure, then admit tables and chairs

User authorization: commit and push the accepted structural milestone, then
build tables and chairs against the approved full image and asset specifications.
Owners remain construct-asset and compose-office. The first publication slice
must close the default-composition discrepancy: the live UI selects structure,
but the factory still defaults to the rejected furnished authoring layout.
Retire that superseded layout path and its obsolete placement assertions; retain
asset specifications, factories and asset-level tests. Verify default admission,
all app tests, lint/build, real-app browser review, naming, Inspector, release
notes and PR checks before pushing. Do not alter the accepted building, exterior,
lighting or asset specifications to satisfy retired layout assertions.

Only after the push, admit reference tables/chairs individually, with unchanged
structure/exterior. Compare component geometry to accepted asset specifications
and positions to the full image. Complex upholstered seats require Blender
background construction when the procedural route cannot reproduce them; no
rejected substitutes. No new dependencies or furniture-stage push is authorized.
