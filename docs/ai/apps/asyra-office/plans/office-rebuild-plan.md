# Asyra Office - Product and Experience Plan

Status: product plan approved; implementation authorized on 2026-10-25.
The owner clarified on 2026-10-25 that implementation must deliver the complete
approved reference composition and UI together. This supersedes the one-wall
stop and sequential subgroup checkpoints for this visual implementation. Numeric
asset specifications are construction inputs subordinate to the approved visual
reference and later explicit owner corrections. No new dependencies are authorized.
Product slug: `asyra-office`; display name: `Asyra Office`.


## Merge checkpoint - 2026-10-29

This is a partial progress checkpoint for PR #361, **not formal plan closeout**.
The owner confirmed the building structure, upper-left discussion room,
lower-left work room and pantry as the scope to consolidate for merge. Their
current implemented visual revisions may close at this checkpoint. This does
not certify every reference object, all future behavior or photographic identity.

| Scope | Checkpoint disposition | Current authority |
| --- | --- | --- |
| Building structure | Accepted current shell; close this revision | `scene/reference/office-structure.json`; four-room expansion in the technical proposal. All rooms share one floor; each gains 0.50 m depth, rear shell moves 1.00 m and rear streetscape 2.00 m. |
| Upper-left discussion room | Close current implemented furnishings revision | Technical proposal: discussion-room furnishings and tableware. Branch-first conifers, open side table/basket, clear poster/calendar, console plants/perfume, iced coffee, open sugar jar/leaning lid/loose cubes/silver spoon and handleless cup. |
| Lower-left work room | Close current implemented furnishings revision | Technical proposal: lower-left work room and five reference botanical planters. Thin 20 mm green-wall cap, clear poster, books/rear surface, square floor planter and five owner-selected shelf plants with retained colors/anchors. |
| Pantry | Close current implemented layout and assets revision | `scene/reference/pantry-layout.json`; pantry and pantry-smallware specifications. Small upper freezer, 70%-capacity jug, rotated fridge, single-door preparation cabinet, full-size sink, shortened shelf and corrected contents. Both night lights and stored small basin/large jar/tiny bottle remain reusable. |
| Lower-right lounge and exterior | Remain open for later visual refinement | Preserve current content and temporary rear-neighborhood relocation. No new acceptance is inferred. |
| Deferred complex assets | Remain open | Reviewed Blender chairs, upholstered seating, people, animals, rigs and animation; rejected stand-ins stay absent. |
| Product/game systems | Remain open | Live multi-provider agents, durable tasks/logs, economy, individual/global achievements, autonomous life, editable/expandable rooms, clothing and persistence. Current UI data is synthetic. |
| Performance and full asset LoD | Remain open | Existing focused reuse/budget tests are evidence for their contracts only; large-viewport navigation, device budgets and whole-catalog LoD still require validation. |
| Historical references | Deferred required review | Revisit the historical reference folders after all parts have been confirmed; do not delete or treat historical drawings as current instructions. |

Current documentation entrypoints are the app README, technical proposal and
asset catalog. The catalog's original drawing totals are a dated design inventory,
not the current runtime asset count. Owner corrections and later active recipe
sections supersede earlier dated reconstructions; retained source images are
never silently rewritten to imply they were correct.

Bounded consolidation task: audit this PR's changed Office implementation and
its direct specifications/reference indexes; repair stale status, missing links
and conflicting current summaries; validate and publish the existing work.
Correct validation assumptions invalidated by the pending plant changes, without
weakening assertions or timeouts. Do not redesign rooms, alter runtime behavior,
complete deferred assets, move the
plan to completed, invoke formal closeout or merge the PR. Reuse existing
construct-asset and compose-office contracts; no Inspector semantics change.
Validation covers the current Office tests, lint/build, affected visual checks,
reference/JSON links, repository document/naming/Inspector checks and committed
head admission. Stop after the validated source is pushed and remote status is
reported. The owner retains whole-product acceptance and merge authority.


## Rebuild planning task

Historical initial scope; superseded by the later implementation authorization.

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
  the full image still controls the scene's identity and composition. A later
  explicit owner correction supersedes the affected reference detail, such as
  the refrigerator's smaller upper freezer. Numeric specifications describe
  construction; when their visible result conflicts with the approved reference,
  correct the dimensions from the image and update the specifications together.
  Do not use stale numbers to justify a different visible result. Hidden or
  unreadable details must be identified as unresolved reconstruction, not
  presented as verified source detail.
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
the approved part. Do not simplify, substitute, omit visible details or change geometry, materials,
proportions or placement for optimization. An existing resource budget is not
permission to degrade the reference. If both fidelity and an applicable budget
cannot be met, report the conflict; do not silently weaken either acceptance
condition. This applies to the entire app and every future task, not just the
currently discussed room. Code generation and Blender are construction methods,
not different fidelity standards. Unit tests and successful builds are necessary
engineering evidence, never visual acceptance. Before claiming completion,
compare each affected item at the source angle and close range, including
silhouette, component details, appearance, proportions, relative position and
contacts. A concrete remaining difference means the item is unfinished.

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

### Tables and chairs - composition execution card

Owner: compose-office (step 11), construct-asset-to-compose-office route.
Sources: approved building snapshot; full office image; writing-desk, work-chair,
round-tea-table, tea-chair, round-coffee-table and widened lounge-armchair specs.
Inputs: existing catalog geometry, requested instance extents/appearance and an
explicit room-relative seating layout. Output: seven named table/chair instances
in the normal scene. The structural checkpoint remains available for inspection.
No bypass, renderer-local placement, image projection at runtime or new cache.
Only the app scene owner contributes; providers and React must not own geometry.
Boundary: scene layout/composition, its UI caption, direct tests and review docs.
Failure owner: compose-office. Existing asset factories remain authoritative.

Cases: default scene admits three tables and four chairs; explicit structure
stage admits none. Both stages have identical structural and exterior geometry.
Every foot reaches the shared floor; furniture clears the actual wall body and
cap bounds. The work chair faces the desk; two differently coloured tea chairs
face the round table; the orange lounge chair faces the coffee table. No indoor
actors, sofa, decorations, pantry equipment or outdoor modifications are admitted.

Placement uses room-relative relationships from the full image, constrained by
accepted physical room bounds. Historical source-camera box fits are invalid for
this accepted construction: they put the desk across the west wall and the tea
chairs beyond the rear wall. Do not move walls to accommodate these old fits.
Record the measured relationships and normalized construction in the layout doc;
retain uncertainty rather than claiming exact recovered metric dimensions.

Gates: formal admission and contact/clearance tests first, unchanged-geometry
comparison, app unit suite, naming, lint/typecheck/build, selected real-app room
and asset multi-view browser cases. Inspect both overview and enlarged joints.
Stop on collision, unsupported geometry or visible broken topology. Reopen the
asset owner with a separate card if asset correction is required. No furniture
push is authorized by this slice.

### Upholstered-seat microscope correction

Owner: construct-asset (step 1), before completing composition admission.
Inputs: approved tea-chair five-view sheet and widened armchair reference/spec.
Output: closed component meshes with a broad tea-chair crown and smooth armchair
side-panel surfaces. The tea-chair source exponent 1.6 produces a pointed front
crown, unlike the broad crown in the approved sheet; reconcile that single curve
parameter against the reference. Preserve the intentionally documented 2 mm
source-space cushion clearance, every leg contact and replaceable region.

Boundary: these two asset factories, their direct geometry tests, production
mesh preparation script and the referenced tea-chair recipe. Blender may run in
background mode to remesh the armchair side panels, exporting app-owned geometry;
no Blender process may remain after generation. No scene or renderer patch.
Allowed contributor: app asset owner; forbidden: renderer reconstruction or
camera-dependent mesh changes. Failure owner: construct-asset; no bypass/cache.
Gates: crown-height regression, closed-mesh/extent/triangle checks, five-view live
asset screenshots and magnified side-panel inspection. Preserve numerical recipe
contracts except the documented crown correction. Stop on changed feet, new
underside layers, silhouette loss or broken topology.

The first Blender remesh inherited folded offset rims from the old analytic
panel tessellation; triangle decimation also made rim shading uneven. A second
quadrilateral remesh reported invalid manifold input and was rejected before
export. Revised bounded method: rebuild the closed extrusion directly from the
approved cubic outline, establish manifold winding, round the closed extrusion
on a 3 mm voxel grid with 25 relaxation passes (factor 0.8), then simplify before
applying the approved inward taper. Do not keep iterating
on the damaged triangle soup or change renderer normals to conceal it.

Local seating checkpoint: 179 unit tests pass; app lint, TypeScript/build, naming,
Inspector checks and declared update guidance pass. The interior browser suite
passes ten cases; its opt-in hardware case separately passes on Apple M3 Max
Metal. The live route is `http://127.0.0.1:5194/`, at 1440 x 960 for browser
evidence. Commands: `yarn workspace @asyra/asyra-office test:e2e
e2e/interior.spec.ts e2e/structure-hardware.spec.ts
--output=test-results/seating-final` and `OFFICE_HARDWARE_REVIEW=1 yarn workspace
@asyra/asyra-office test:e2e e2e/structure-hardware.spec.ts
--output=test-results/seating-hardware-final`.

Inspected work/discussion/lounge captures, oblique lounge, the live hardware
close view, and enlarged chair views. Current tables/chairs clear walls, contact
the floor and preserve the approved structural/exterior meshes. The facade
partially occludes the desk and the unchanged street lamp occludes the lounge
chair from the default viewpoint; room/oblique views provide inspection. Do not
move the accepted building or exterior to conceal these occlusions. Upholstery
seams/roundovers and final materials are not certified as identical to the source
image. Lighting banding and the existing large-bundle warning remain unresolved.
The new furniture is local and awaits owner review; only the earlier structural
stage and its portable snapshot correction were pushed. Blender has exited.

### Seating placement correction - reference measurement

The owner rejected the seven-instance placement and sizing. The previous
containment-only oracle cannot establish reference fidelity. Its authored room
positions and uniform scales are superseded by this correction. Work remains
in compose-office (step 11 / construct-asset-to-compose-office), with the accepted
structure, exterior, geometry factories, lighting and camera frozen. Inputs are
approved asset geometry, the full source image, actual accepted camera and floor.
Output is seven measured instance transforms. No renderer correction, per-view
geometry, asset redesign, new furniture or publication is authorized.

Measure visible furniture bounds and identifiable tabletop/ground features in
the original image. Use the actual camera position/target, not historical fit
angles that no longer describe the live camera. Preserve occlusion uncertainty;
do not identify actors or furniture shadows as geometry. First record baseline
pixel residuals and strengthen formal composition tests to fail on them. Solve
translation and whole-unit sizing offline, record trace provenance and residuals,
then consume the resulting transforms at composition. No image fitting per frame.

Allowed edits: seating composition/data, directly affected focus targets, formal
geometry tests, offline measurement/review scripts and existing task docs. The
failure owner is compose-office; no bypass and no retained runtime cache. Reuse
the existing local construction map. Gates: source-space projection residuals,
floor/wall contact and unchanged-building checks, focused unit tests, app lint /
build, naming and real-app calibrated captures with enlarged room comparisons.
Stop if a measured feature cannot fit the accepted building; report the residual
rather than moving a wall or silently replacing evidence with a guessed layout.
Self-review: scope and downstream tests match the existing composition contract;
this replaces the prior placement approach rather than altering asset geometry.

Measurement checkpoint (no production placement changes): the calibrated live
canvas is 845 x 756 at `http://127.0.0.1:5194/`. The formal measured-reference
browser case passes, but its screenshots expose rejected placement. The added
offline audit reads actual composed furniture and the accepted camera, and
projects complete mesh bounds without changing runtime data. The comparison
uses the source image's historical visible envelopes; substantial work-chair
occlusion makes its envelope unsuitable for reconstructing full dimensions.

| Instance        | Projected centre delta X/Y, px | Projected width ratio |
| --------------- | ------------------------------ | --------------------- |
| Desk            | -31.5 / +38.4                  | 0.999                 |
| Work chair      | -1.9 / +33.6                   | 1.095                 |
| Tea table       | +36.4 / +57.8                  | 0.827                 |
| Left tea chair  | +58.1 / +43.0                  | 0.799                 |
| Right tea chair | +41.7 / +59.6                  | 1.025                 |
| Coffee table    | -119.5 / +7.1                  | 0.865                 |
| Lounge armchair | -113.3 / +10.8                 | 1.047                 |

These are image-space differences, not isolated world-space translation or
physical-size corrections. The accepted building correction also changes room
projections. An unconstrained uniform-scale fit to the historical envelopes
puts tea furniture beyond west/rear wall bounds; this demonstrates that this
particular fitting method is invalid, not a proof that all reconstruction
methods are impossible. A room-relative correction can instead reuse the
accepted lounge reconstruction's source projection, and independently measured
west-room anchors. The owner's choice between preserving this accepted structure
and reopening global structural alignment remains pending. Do not apply a
replacement layout before resolving that choice.

Reproduce the read-only evidence with
`node_modules/.bin/tsx apps/asyra-office/scripts/measure-seating-placement.ts`,
the existing measured-reference E2E case, and
`python3 apps/asyra-office/scripts/review-seating-placement.py <canvas.png>`.
The review scripts pass lint / execution checks. Their annotated bounds are
diagnostic only and never enter the production scene. No furniture placement,
asset geometry, camera, building or exterior changed in this checkpoint.

### Seating placement correction - approved room-relative execution

The owner selected preservation of the accepted structure and correction of
room-relative furniture placement/proportions. This resolves the pending choice
above. Continue compose-office, step 11, through construct-asset-to-compose-office.
Consume approved geometry and an offline measured layout; output seven whole-unit
transforms on the existing floor. Structure, camera, exterior, asset topology and
lighting remain unchanged. No runtime pixel fitting or view-dependent geometry.

Use the previously accepted lounge source projection for lounge measurements;
use west-room crown correspondences for the two west rooms. These are local
measurement frames, not replacement render cameras. Trace visible table/seat
features; retain uncertainty for the occluded work chair and keep its dimensions
proportional to its desk's reference-derived width/height. Whole-unit XYZ sizing
is allowed by the approved asset contract. Do not fit actor pixels as chair bounds.

Before production edits, add failing reference-feature projection assertions to
the formal seating tests, alongside floor, wall and unchanged-structure checks.
A local frame is only a measurement tool: the resulting world geometry must also
pass actual-app overview, three room views, near detail and oblique inspection.
Allowed contributors and failure owner remain the app composition owner. No
bypass or retained cache. Files are seating data/composer, its direct tests,
offline measurement tools, focus targets and existing docs. Stop on penetrating
geometry or unexplained feature residuals; do not move accepted walls to hide them.
Self-review: this is the approved room-relative alternative, with explicit
uncertainty rather than the rejected global absolute-pixel fit.

Room-relative correction evidence: all six source-feature cases failed against
the previous layout before the canonical transforms changed. A later actual-app
review rejected the flattened lounge chair despite passing envelope checks.
The cause was its inherited -65 degree heading: an underconstrained box fit
absorbed the wrong orientation into height. The bounded correction adds a
visible support-baseline direction constraint (source contacts 1010/976 and
1135/1038 in the approved lounge enlargement; 6 degree picking tolerance).
Its formal assertion failed by 18.08 degrees on the prior layout. Refit the
same composition owner with that constraint; do not change asset topology,
structural geometry, lighting or camera. This is a source-measurement correction,
not an exception for the renderer. Desk detail review also requires an elevated
orbit because the unchanged front wall occludes the normal focused view.

Validation of the corrected layout: 185 app unit tests passed, including the
six room-relative feature cases, actual floor/wall clearance, seated clearance
and exact retained-structure/exterior equality. App lint/typecheck/build,
15 naming checks, measurement-script lint and update-guidance coverage passed.
The build retains its existing large-chunk warning. No deployment or push.

Actual-app review at http://127.0.0.1:5194 used the work/discussion/lounge cases,
the 845 x 756 overview and the hardware review (Apple M3 Max Metal). Inspected
the elevated work view to expose the table footprint behind the facade, the two
tea-chair/table arrangement, and the lounge oblique view after heading repair.
Screenshot directories are test-results/seating-relative, seating-direction and
seating-final under the app. The first directory's lounge image predates the
heading repair; use seating-direction for the final lounge close view and
seating-final for the final work/hardware views. Automated browser passes prove
runtime health, not visual equality. The scope is ready for owner review of
relative placement; it does not certify 100% original-image fidelity. Existing
lighting banding and the original source's occluded work-chair geometry remain
explicit limitations. No accepted wall, exterior, render camera or asset topology
was changed by this placement correction.

### Lower-room depth correction - owner-requested structural revision

Owner request reopens the work/lounge room extents. Compose-office (step 11,
construct-asset-to-compose-office) owns the correction. Inputs are the original
complete reference, the new lounge crop, existing wall topology and floor.
Output remains one canonical structural specification plus seven seating poses.
Preserve shell frontage/width, entrance, exterior, camera, wall heights/thickness,
stepped topology, asset meshes and appearance. Enlarge lower rooms inward by
moving their rear partitions; their shared boundaries necessarily reduce the
rear rooms' unused foreground area. Extend contiguous left lounge segments and
adjust the flush pantry floor band. No raised floor or extra facade.

Use the original visible east floor run to estimate the lower-room share of
building depth. The rear/partition/front contacts are partly occluded and are
picked as 1000/401, 860/503, 724/573 in the 1280 x 800 source. Projection along
that run gives the target ratio, with 10 px contact uncertainty. Preserve the
existing work/lounge rear offset so both lower rooms gain the same depth.
This is an explicit reference-guided structural interpretation, not an exact
metric recovery. Do not introduce another camera fit or alter the exterior.

Allowed files: composition-owned structural/seating data, their tests and source
measurement records, direct structural/room docs and the compose-office condition.
Failure owner remains compose-office; renderer-owned writes and compensating mesh
patches are forbidden. Test the floor-depth ratio before production edits, retain
old acceptance checks for unchanged geometry, then verify all wall joins, floor
coverage, contacts, seven seating instances, and exterior snapshot. Inspect both
lower rooms at overview and elevated detail in the actual app. Stop on an
unresolved wall intersection or required exterior change. No commit or push in
this review slice. Existing plan closeout stays with this chat.

Implemented depth revision: common inward boundary shift 0.877807; clear work
and lounge depths 2.520770 and 2.321343. Default render camera, building perimeter,
foundation, entrance, floor height, wall crown heights/thickness and exterior are
unchanged. Updated adjoining wall runs, pantry floor-band extent and the work
seating translation. The canonical data records the revision as pending owner
visual acceptance; the historical approved snapshot is not overwritten.

Review correction: old source-camera ray visibility is superseded by this
owner-authorized wall relocation. A wall may legitimately occlude a former
source-camera floor sample. Keep the independent source-floor containment tests;
replace that visibility assertion with vertical clearance of all four current
room centres at both mesh detail levels. The west joint test now includes both
contiguous west-wall segments, since the partition attaches to the upper segment.
The lounge end-plane offset stays at its original thickness instead of scaling
with the extended wall run. These changes preserve physical checks without
inventing a renderer visibility exception or shrinking a wall to pass a ray test.

Inspected actual-app overview, work elevated detail, lounge oblique and discussion
views in test-results/room-depth; also inspected the Metal hardware overview in
test-results/room-depth-hardware. The work floor now has clear foreground space;
the lounge retains its rectangular floor and has additional rear seating space.
No new furniture, filters, asset meshes, camera presets or exterior changes.
The source floor contacts remain approximate because plants and furnishings
occlude their junctions; this revision does not claim exact metric reconstruction.

Final bounded gates: 186 app tests pass, four interior browser cases and one
hardware browser case pass, app lint/typecheck/build pass, 15 naming checks pass,
update-guidance coverage and diff whitespace checks pass. Build retains the
existing large-chunk warning. Current in-app tab reports Demo scene ready at
http://127.0.0.1:5194/. Changes remain local for visual review; no commit or push.

### Seating pose correction in accepted deeper rooms

The owner accepted the increased room depth and requested table/chair positions
and headings next. Compose-office step 11 consumes the accepted structural JSON,
seven current meshes/scales and source-relative seating evidence. Output is seven
updated static XY/yaw poses. Preserve the whole structure, camera, exterior,
asset topology, colours, scales, floor height and existing instance identities.
Map each table's original clear-room depth fraction into the accepted room and
translate its seating group rigidly; do not stretch chair spacing or reclamp the
work chair against the rear wall. The two tea chairs face their common table;
desk, work chair and lounge chair retain their source-backed heading. Round
surfaces do not need arbitrary yaw changes.

Boundary: seating measurement/canonical layout JSON, offline layout generator,
direct composition tests and existing docs. Failure owner compose-office; no
renderer-side fitting or extra furnishings. First prove original-anchor fraction
and facing regressions fail, then retain source projection tolerances after
undoing only the room translation, wall/floor clearance and unchanged-structure
checks. Inspect all three occupied rooms in actual-app detail plus overview.
Stop on intersecting solids or a requirement to change accepted structure/scales.
No push or commit in this visual review slice; plan closeout remains here.

Pose correction validation: the new regression suite failed on all three old
group anchors and both old tea-chair headings before the canonical pose update.
All 192 app unit tests now pass, including six pose regressions and unchanged
source-projection tolerances. App lint, TypeScript/build, naming and declared
documentation impact checks pass. The accepted structure SHA-256 remains
`0e7da49b9bc6dcb89cc6f49fa4a69f7c9bb38500fd1fb38b4d44e746e5e156f7`.

Actual-app review used `http://127.0.0.1:5194/`, a 1440 by 960 viewport, normal
room navigation and orbit controls, with no selection overlays. The four
`e2e/interior.spec.ts` cases passed; the final discussion view and hardware
case also passed with `OFFICE_HARDWARE_REVIEW=1` and the grep scope
`interior reference review - discussion|structural review records` over
`e2e/interior.spec.ts e2e/structure-hardware.spec.ts`. Artifacts are under the
app's `test-results/seating-pose` and `test-results/seating-pose-final` folders.
The hardware record identifies Apple M3 Max through ANGLE Metal. Agent review
inspected elevated work/discussion views, the oblique lounge view and hardware
overview: current chairs face their tables and the groups remain inside their
rooms. This is pose acceptance for the seven existing objects, not a claim of
complete reference-image fidelity. Asset shapes, deferred shadow banding and
the missing furnishings remain outside this slice.

### Seating shape correction and rejected upholstery removal

Compose-office step 11 owns this correction. Inputs are the approved furniture
review sheets/specifications, existing source-relative positions and accepted
structure. Output is the writing desk, work chair, round tea table and round
coffee table with their specified component proportions preserved. Retain each
existing X scale as the source-width anchor and apply it uniformly to XYZ; the
previous independent silhouette fit stretched the desk depth and compressed
heights. The 1.20 by 0.60 desk must remain 2:1, including round rather than
elliptical chair/table legs. Keep positions, headings, architecture, exterior,
materials, camera and lighting unchanged. The two wraparound tea chairs and
lounge armchair are visually rejected and must be absent pending reviewed
Blender assets. No substitutes, hidden placeholders or new furniture.

Boundary: scene seating layout/evidence/generator, direct tests and docs, plus
the existing compose-office admission condition and its generated workspace
bundle. Contributor is the app composition owner; renderer corrections and
asset-geometry rewrites are forbidden in this slice. Failure owner is
compose-office. First add failing mesh-proportion and rejected-asset admission
regressions; retain structural equality, grounding, wall and desk-chair clearance
checks. Then run app unit/lint/build, naming, docs-impact, Inspector contract
checks and live work/discussion/lounge visual reviews with enlarged detail.
Source pixel envelopes from the rejected independent-axis fit are historical
measurements, not an oracle that may deform the approved asset shapes.
Stop if preserving proportions requires moving approved structure or constructing
complex upholstery. This is a partial furniture stage, not full-scene fidelity.
No commit or push is requested.

Validation for this correction: all five new admission/proportion regressions
failed before implementation. After correction, 192 app tests in 38 files pass,
including source-width anchors on actual meshes, geometric proportions, room
placement, wall/ground clearance and unchanged structural SHA-256. Build and
TypeScript, app lint, naming, docs-impact and 25 Inspector contract tests pass.
Build retains the existing large-bundle warning.

Live review used APP_URL `http://127.0.0.1:5194/`, viewport 1440 by 960, normal
place selection/orbit and three zoom-in actions for detail. Command:
`OFFICE_HARDWARE_REVIEW=1 yarn workspace @asyra/asyra-office test:e2e e2e/interior.spec.ts e2e/structure-hardware.spec.ts --grep 'interior reference review - (work|discussion|lounge)|structural review records' --output=test-results/seating-shape-final`.
All four cases pass. Agent inspection covered work/discussion/lounge oblique
and enlarged screenshots, plus the hardware overview and close view. Evidence
is in the app's `test-results/seating-shape-final/`; renderer metadata identifies
the actual backend. No selection overlays or replacement meshes were used.
The source-width anchors and approved component proportions now agree; this does
not certify material appearance, upholstery or full-scene similarity. The three
rejected upholstered chairs remain absent. Structure, exterior and poses remain
unchanged. No commit or push was performed.

### Work-room chair identity correction

Compose-office step 11: the owner rejects the lower-left chair. The full office
reference and supplied enlarged work-room crop show a dark chair behind the
actor; the approved standalone green four-legged work-chair sheet does not
establish that it is the same object. Its hidden support/base geometry cannot
be recovered from this crop. Remove the desk-chair instance without substituting
or recolouring another asset. Preserve the three tables and every other scene
object, pose, scale, appearance, structure and camera. Keep the standalone asset
and its approved construction specification; explicitly mark it as unsuitable
for automatic admission at this reference-scene position. Replacement remains
pending reference-specific asset review, not a claim that removing it completes
the room.

Boundary: existing seating layout/measurement data, direct admission tests,
app/reference documentation, compose-office admission condition and generated
Inspector bundle. Only app composition contributes; renderer-side hiding and
replacement geometry are forbidden. Failure owner is compose-office. First
prove a full-scene regression rejects the current desk-chair, then remove it
from the canonical layout/generator inputs. Run affected scene tests, app
lint/typecheck, Inspector contract checks, docs-impact and one live work-room
visual review with enlarged screenshot. No identifiers are introduced or renamed.
Stop if repair requires new geometry or modification of accepted tables/structure.
No commit or push is requested.

Validation: the new full-scene identity regression failed before removal. All
24 affected tests across six scene files now pass, as do app lint/typecheck,
25 Inspector contract checks and docs-impact validation. The accepted structure
SHA-256 is unchanged. The numeric work-chair specification's misleading source
claim has been corrected without changing its components or dimensions.
Live visual scope: `e2e/interior.spec.ts --grep 'interior reference review - work'`
at APP_URL `http://127.0.0.1:5194/`, 1440 by 960, normal orbit and three zoom-in
actions. One E2E passed; the agent inspected `work-detail.png` under the app's
`test-results/work-chair-removal/` and confirmed the incorrect chair is absent
while the desk remains. This completes removal, not replacement-chair modeling.
No commit or push.

### Procedural room furnishing - 2026-10-27

Owner request: continue non-Blender furnishings room by room against the original
1280 x 800 approved office reference. Order: work, discussion, pantry, lounge.
Keep the accepted shell, room depths, entrance, camera and exterior unchanged.
Use the existing catalog for regular assets and measured reference-relative
placement. Keep rejected chairs, sofa, people and animals absent for later
Blender review; do not substitute primitive placeholders. No lighting/filter work.

Step execution: `compose-office`; input is the approved building, catalog and
original reference, output is the ordinary spatial scene. Office owns authored
placement and room composition under `src/scene/`; no renderer writes, provider
tokens, alternate renderer, reference-image backdrop or independent React model.
No bypass. `compose-office` owns failures. Existing catalog constructors are
consumed without changing the asset-authoring contract. Meshes are constructed
once per scene composition and camera movement consumes the completed scene.
Names are app-local assembly identities, not persisted schema changes.

Cases: floor items rest on the common floor; desktop items rest on the actual
tabletop; shelves and art attach to inside wall faces; regular pantry appliances
face into the room; striped wallpaper stops before the right framed print.
Validate actual mesh bounds, nonintersection with walls, stable structure and
exterior, and omission of rejected assets. Run focused tests, full app tests,
typecheck/lint/build, naming and Inspector contracts, plus live overview and
enlarged room captures at APP_URL. Inspect every room against the source before
closure; passing tests is not visual acceptance. Stop for an actual unsupported
capability or an unresolved source identity, and preserve the missing item.

The low stool requires a bounded `construct-asset` segment before composition:
consume the approved accent-furniture numeric parts, emit five named material
regions forming one closed exterior, preserve all support planes, and include a
bounded distant representation. No new rendering path or dependency. Check
welded edge incidence, underside openings, exact bounds and triangle budgets;
then resume `compose-office`. The stool is regular rounded-box/prism geometry,
not a substitute for any rejected curved chair. Construction is app-owned under
`src/assets/`; unsupported topology remains a failure of `construct-asset`.

The source-priority fridge correction is bounded to its door split and handle
heights; a failing catalog-mesh test first demonstrated the inverted proportions.
The existing wall-sconce constructor is extracted for reuse without inventing
another lamp head. Composition owns its source-relative placement. Table support
planes are returned by the existing construction call, with no duplicate table
factory invocation or persistent cache. Printed lounge art uses the existing
small-surface artwork path only.

Validation and visual iteration: 202 app tests passed across 41 files; final
focused reruns also covered explicit missing-input guards and the new counter
join regression. Lint, typecheck/build, naming and 100 Inspector contract tests
passed. The first full interior browser batch passed eight cases but hit a pantry
screenshot deadline and the 150-second suite guard. The two incomplete cases
passed in a bounded two-case run with unchanged timeout guards. Visual review
caught a sink cup inside the basin, an unsupported print above a low return, and
coplanar overlap between the coffee and sink countertops. Each geometry issue
received a failing mesh oracle before correction. The final coffee worktop is
0.75 m wide, ends at X=1.7700 and has a 7.5 mm joint before the sink at X=1.7775.

Reviewed live overview, room views and enlarged details from the production app.
Printed photo detail remains limited by the small source image; lighting banding
and complex upholstered seating remain deferred. This is a regular-furnishing
review milestone, not owner acceptance or complete reference parity. No commit
or push for this slice.

### Pantry left-to-right correction - 2026-10-27

Bounded task: compare the enlarged original pantry crop, then correct the dispenser,
fridge-top objects, shelf vessels, preparation counter and sink accessories in
that order. Preserve the accepted shell, all other rooms, exterior and camera.
The crop is visual authority; incompatible numeric proportions must be corrected
at their asset owner. Do not add occupants or Blender-dependent substitutes.

Step execution: `construct-asset` owns the dispenser recipe and regular smallware;
`compose-office` owns pantry placement and named appearance regions. Inputs are
the original crop, approved support planes and existing closed catalog geometry.
Outputs are complete reusable meshes and the production pantry composition.
Neither step may change renderer state, lighting, accepted walls or unrelated
assets. No bypass or new dependency. The failing step owns any failure.

Before edits, add failing actual-mesh/source-identity regressions for the bottle
ratio, six shelf vessels, fridge-top jar, unsupported coffee machine and wood
sink worktop. Then validate support, overlap and preserved-room cases, app tests,
lint/typecheck/build, naming and focused live pantry captures including enlarged
left/right details. Inspect images after tests; screenshots alone do not establish
numeric correctness. Stop at a reviewable pantry correction without push.

Bounded visual iteration: the first shrub layout exposed an open ring of radial
petioles instead of the source's compact crown. Retain the same closed blade
owner, move leaf origins inward and fill the crown with smaller overlapping
blades. Use an 8 by 4 blade grid with 32 radial pot segments and 6 petiole segments for this small-leaf form and cap the assembled
shrub below 22,000 triangles. Default stemmed and rosette forms stay unchanged.
A new accessory-envelope regression also caught an incorrect cylinder argument
before delivery; the pump neck now uses an explicit 7 mm top radius.

Validation outcome: 211 app tests across 42 files pass, including the revised
tray/ring dimensions and unchanged scene draw-group budget (fewer than 160).
App lint/typecheck/build, naming (15 cases), and Inspector contracts (51 cases)
pass. Inspector discovery initially lacked the existing ai-agent-runtime build;
building that declared workspace resolved it without source changes. The accepted
structure SHA-256 remains
`0e7da49b9bc6dcb89cc6f49fa4a69f7c9bb38500fd1fb38b4d44e746e5e156f7`.

Visual scope: `OFFICE_HARDWARE_REVIEW=1 yarn workspace @asyra/asyra-office test:e2e
e2e/pantry.spec.ts --output=test-results/pantry-reviewed`, using the project
APP_URL `http://127.0.0.1:5194`, 1800 x 1200 viewport, production room-furnishings
scene. One E2E passed. Inspected source-angle, appliance-front and high worktop
captures under the app's `test-results/pantry-reviewed/`; then verified the same
scene in the user's existing IAB tab and selected Tea point. Live server PID
16927 remains available. Review confirmed shelf/counter support, distinct vessel
sizes, dense shrub silhouette, closed tray/pump parts and clear sink opening.
Lighting banding, source typography nuances and Blender-dependent occupants
remain outside this correction; this is not a claim of pixel-identical source
rendering. No commit or push.

### Inverted transparent water jug - 2026-10-27

Task contract: replace only the pantry dispenser jug with the owner's new bottle
photo silhouette: narrow neck, sloping rounded shoulder, straight barrel, four
wide ribs and rounded base. Install neck down, retain the current 0.48 m jug
height and dispenser footprint, omit labels and expose translucent blue plastic.
The photo owns visible shape; hidden thickness and exact alpha are reconstruction
defaults. Preserve all other pantry objects, rooms, architecture and lighting.

Step card: `construct-asset` consumes the revised numeric radial profile and
material alpha, emitting the complete bottle/cap and reusable appearance regions.
`compose-office` must propagate alpha to the existing public spatial descriptor
and keep translucent parts sortable separately from opaque batches. The existing
`render-spatial` alpha contract already enables transparency and disables depth
writes. No framework renderer change, new dependency or new render path.
Failing silhouette/alpha tests precede implementation. Validate profile stations,
attachment, batch separation, focused and full app tests, lint/typecheck/build,
naming, relevant Inspector contract and hardware pantry screenshots. Inspect the
bottle enlarged in the live app; do not equate a passing screenshot test with
visual fidelity. No commit/push.

Owner extension: add static water occupying 70% of the jug cavity volume, with
a level surface and visible air above. Derive the cavity from the same radial
profile with a 2 mm radial clearance and inset bottom, rather than guessing the
water height as 70% of overall height. Construction remains in `construct-asset`;
there is no animation, simulation, frame callback or renderer extension. Verify
closed-mesh volume, a horizontal top and containment before app visual review.
The enlarged review also identified false ledges caused by independently easing
each shoulder interval to a zero slope. Replace that interpolation with monotone
cubic tangents shared at each station; retain the numeric source stations and
ring relief dimensions. A regression records the incorrectly flattened slope.

Validation: the original silhouette/alpha tests failed before the change; a
second regression measured the false shoulder ledge at slope 0.607 before the
shared-tangent correction. Static fill initially failed because no water region
existed. The final mesh-volume test verifies a 0.70000 capacity fraction and a
horizontal cap with visible air space. All 216 app tests in 44 files pass;
app lint, typecheck/build, naming (15 cases) and the focused Office Inspector
architecture contract (1 case) pass. The pre-existing large-bundle warning
remains. Structure SHA-256 is unchanged from the preceding pantry review.

Visual review uses APP_URL `http://127.0.0.1:5194/` and the production asset and
room-furnishings scene. Commands:

- `yarn workspace @asyra/asyra-office test:e2e e2e/asset-catalog.spec.ts --grep water-dispenser --output=test-results/bottle-water-detail`
- `OFFICE_HARDWARE_REVIEW=1 yarn workspace @asyra/asyra-office test:e2e e2e/pantry.spec.ts --output=test-results/bottle-water-pantry`

Both E2E cases pass. Inspected the front and three-quarter asset captures at
1200 x 1000 viewport and the 1800 x 1200 hardware pantry capture; then inspected
the same updated scene in the user's IAB at Tea point. Artifacts are under the
app's two test-results directories above. The neck/shoulder transition is now
continuous, four ribs remain distinct, the sticker is absent, and the liquid
has a visible horizontal boundary below the empty top. This is alpha-based
translucency rather than refraction. The static water adds no animation or
frame simulation. Deferred lighting banding is unchanged. No commit or push.

### Pantry remaining vessel detail - 2026-10-27

Continue the owner's left-to-right pantry review, using the original enlarged
crop as visible-shape authority. The approved 70%-full dispenser, shell,
appliance bounds, counter join, plants, other rooms, exterior and lighting stay
unchanged. Current failure: every shelf/fridge/floor vessel uses the same straight
canister profile, hiding the source's jar shoulders, lid knobs, narrow bottle,
open utensil crock and rounded blue-white floor jar. Correct these regular
revolved objects and their supported placement; do not add Blender occupants or
invent unreadable source text.

Step card - `construct-asset`: consume source-relative vessel profiles from the
existing pantry-smallware specification, emit independently recolorable closed
regions and hollow openings under `src/assets/`. Retain the approved default
canister for its existing consumers; source variants are different objects, not
legacy compatibility. A jar/crock is regular lathe geometry. Use the existing
material opacity and spatial path. Then `compose-office` consumes those parts
in `src/scene/pantry-furnishings.ts`, preserving support surfaces and the six
shelf positions. `preview-asset` may expose these same factories for microscope
review; it must not construct different review-only geometry. No framework changes.

Discovery is limited to the original pantry crop, current pantry factories,
smallware/appliance specifications, placement tests and current production
captures. Validate failing source-shape/contents oracles first, support bounds,
closed region topology, budget, retained dispenser and structure, full app tests,
lint/typecheck/build, naming and focused Office Inspector contract. Capture the
live production pantry and enlarged new vessels; iterate on concrete mismatches.
No commit/push. Shapes hidden in the source use documented reconstruction
assumptions, not a claim of uniquely measured geometry.

Completion of this bounded vessel slice: eight source variants replace the
repeated straight canister in the pantry; a ninth placed object reuses the
narrow bottle at the counter's source-relative scale/colour. Fridge/dispenser
orientation, sink/faucet/drawers, plants and worktop joins were checked against
the source and their existing support tests, without changing the accepted
bounds. The tiny porcelain painted motif remains represented by blue-white
material regions; no claim of exact painted-detail reproduction is made.

Visual iteration found two concrete issues. First, near-identical new colours
produced 170 draw groups, failing the existing <160 budget. Reusing the pantry
palette fixed that failure without relaxing the budget or changing the batching
owner. Second, the rounded porcelain body crossed its foot-band geometry;
a failing clearance regression preceded re-fitting the band 0.25-0.40 mm outside
the actual source section. The final microscope image has no intersection dots.

Final gates: 228 app tests across 45 files pass; lint, typecheck/build, naming
(15 cases), and the focused Office Inspector architecture contract (1 case) pass.
The pre-existing bundle-size advisory remains. `git diff --check` passes. The
accepted building hash remains
`0e7da49b9bc6dcb89cc6f49fa4a69f7c9bb38500fd1fb38b4d44e746e5e156f7`.
The original smallware modules are semantically unchanged; only `sourceVariants`
was added to that specification. No commit/push.

Visual scope uses APP_URL `http://127.0.0.1:5194/`:

- `yarn workspace @asyra/asyra-office test:e2e e2e/pantry-vessels.spec.ts --output=test-results/pantry-vessels-complete`: eight cases pass, 1200 x 1000 viewport, production factories at front/top/three-quarter.
- `OFFICE_HARDWARE_REVIEW=1 yarn workspace @asyra/asyra-office test:e2e e2e/pantry.spec.ts --output=test-results/pantry-finish-final`: one case passes, 1800 x 1200 viewport, source-angle/appliance/worktop views of the production room.

Inspected all eight vessel three-quarter captures, open-crock top, the revised
porcelain foot band, and the full hardware pantry. Verified the latest live IAB
scene and returned the camera to the pantry. E2E capture success is separate
from this agent image inspection. Lighting banding and Blender-dependent
occupants remain outside this slice, as previously directed by the owner.

### Refrigerator door split correction - 2026-10-27

The owner explicitly overrides the original drawing: exchange the door heights
to give a 0.428 m upper freezer and 0.640 m lower refrigerator. Scope is the
existing pantry catalog specification, its direct geometry test and this
documentation. Preserve appliance bounds, placement, materials, door gap,
other pantry items and building structure. Both handle assemblies move up
0.212 m with the split. This updates numeric input to the existing construct-asset
step; no flow ownership, rendering path or API change. The existing fridge test
encoded the superseded image; its new exact-height oracle failed before the
specification change. Validate fridge geometry and room consumers, app types/lint,
and the production pantry hardware captures. No commit or push requested.

Validation: the corrected fridge oracle and 18 room-furnishing tests pass
(19 total), app typecheck/lint and diff whitespace checks pass. The hardware
pantry E2E passes at APP_URL http://127.0.0.1:5194/. Inspected the production
appliance-front capture in `apps/asyra-office/test-results/fridge-split/`: the
upper freezer is smaller, the lower refrigerator is taller, and both handles
remain on their respective doors. The image split is intentionally superseded.

### Pantry remaining visual corrections - 2026-10-27

Owner request: correct all remaining pantry differences enumerated in review.
Scope: source-derived vessel shoulders/lids, supported counter composition,
pantry foliage, sink/front proportions, porcelain decoration, and the striped
shadow artefact. Preserve the newly approved small-upper freezer, 70% static
water, building geometry, other room/exterior geometry and deferred Blender
occupants. Shared shadow correction may change lighting on other surfaces; do
not alter their geometry or apply a pantry-only rendering workaround.

Discovery is limited to existing pantry recipes/factories, their direct scene
consumers, shared spatial shadow setup and formal tests. Acceptance uses failing
geometry/appearance/shadow regression oracles first, followed by app and affected
preset tests, naming, lint/typecheck, budget and hardware pantry/microscope
captures from APP_URL. Compare each enumerated item, retaining geometry already
consistent with the source rather than inventing changes. No commit/push.

Step card - render-spatial: the existing Inspector owner is @asyra/preset,
implementation boundary packages/preset/src/spatial/. Consume the admitted
lighting/frustum and completed meshes; emit a shaded scene with stable contact
shadows and without self-shadow stripes. Correct shadow sampling bias in the
provider, never canonical geometry, application-specific exceptions or disabled
shadows. Failure stays with render-spatial. Formal regression covers the shadow
map footprint and finite configured light, then hardware image inspection.

Following cards - construct-asset and compose-office retain the existing
Inspector contracts: numeric approved recipes and replaceable appearance produce
closed bounded assets; the pantry composer attaches them to existing supports.
Only these owners may change their output, not the renderer. Preview consumes
the same factories. Each segment runs its focused oracle before advancing;
unknown geometry is explicitly documented construction, not measured certainty.

Bounded microscope replan: two shrub arrangement attempts still expose stacked
radial petioles at side views. The root cause is the construct-asset blade basis:
a radial horizontal strip cannot cover an ellipsoidal crown's front surface.
Replace only the shrub blade basis with the ellipsoid meridian/tangent basis;
leaf skins offset along the local outward normal, and short connected petioles
terminate at that surface. Retain small unequal leaves, seeded azimuth/roll,
closed topology, pot, total envelope and <22k triangles. Other leaf forms retain
their established basis. Review front/top/oblique, not just the room overview.
This supersedes the radial-core oracle, whose premise did not prove visible
surface coverage. New oracles verify outward skin normals and all-view crown
coverage; no new scope or rendering exception is introduced.

Final pantry validation - 2026-10-27: 239 app tests in 45 files, 44 affected
Preset spatial/light tests, app lint and typecheck/build, Preset build, 15 naming
checks and the Office Inspector contract pass. The existing bundle-size advisory
remains. Source geometry for the accepted building and other rooms is unchanged.
No commit or push was requested.

Shrub review rejected the first two images despite capture success: front-facing
leaf coverage initially failed, then top view exposed a hollow crown. The final
recipe uses 184-192 leaves, a 75 mm radial crown, 132-299 mm root height range,
46-63 mm scaffold widths and a 4 by 4 grid under the existing 22k triangle cap.
Front/side/oblique and top coverage exceed 90% over the specified central region.
The skin-normal oracle includes the vertical component at the crown poles;
ignoring it incorrectly rejects correctly outward-facing top leaves. The final
front/top/oblique images were inspected, not accepted solely from test results.

Visual evidence: APP_URL http://127.0.0.1:5194/; command
`OFFICE_HARDWARE_REVIEW=1 yarn workspace @asyra/asyra-office test:e2e e2e/pantry.spec.ts e2e/pantry-vessels.spec.ts --output=test-results/pantry-complete`.
All 12 cases pass. Artifact directory is
`apps/asyra-office/test-results/pantry-complete/`. Eleven production asset previews
use 1200 x 1000 viewports at front/top/three-quarter; the production pantry uses
1800 x 1200 hardware rendering at source/appliance/worktop angles. The visible
IAB at the same URL was also inspected and left at Tea point. Captures retain
normal app overlays, without selection/debug geometry.

Agent image review: full-width cream cap and differentiated vessel heights,
supported separate smallware, left-shifted sink assembly, outward leafy crowns,
narrow arching sink/preparation leaves, continuous blue porcelain motif and
removed diagonal shadow acne are visible. Real cast shadows remain. The accepted
small upper freezer and large lower fridge, transparent jug and static 70% water
remain covered by their existing regressions. The porcelain motif is an authored
interpretation of indistinct source artwork, not a recovered exact painting;
Blender-dependent occupants remain deferred. No claim of complete pixel identity
with the original illustration is made.

### Pantry leafy plant and wall contact correction - 2026-10-27

The owner rejected the dense spherical foliage despite the previous coverage
oracle passing. This bounded revision belongs to construct-asset (small-plants
recipe/factory and direct tests) and compose-office (pantry shelf, two distinct
cabinet assemblies and their supported contents). Keep building geometry,
appliances, static water, other rooms, exterior and shared rendering unchanged.
Wall direction is awaiting clarification; foliage work is independent. No push.

The previous oracle optimized a filled ellipsoid instead of the source's visible
individual leaves. Replace it with bounded small-blade dimensions, unequal
branch reach/pitch, multiple radial layers, supported pot and a lower triangle
budget. Branches terminate at leaf roots inside a loose crown volume; blades
must not tile an ellipsoid surface. Preserve deterministic growth and closed
thin leaves, and review front/top/oblique plus the actual pantry. Exact leaf
positions hidden in the source remain authored rather than measurable.

The matching Inspector steps and handoffs remain unchanged: construct-asset
produces the completed geometry, compose-office places it, preview-asset uses
the same factory, render-spatial performs no canonical changes. Test the new
source-derived bounds before geometry changes. After wall clarification, test
actual contact planes and separate cabinets before placement changes. Gates:
focused plants/room tests, app tests/lint/typecheck/build, naming and Inspector
contract, then hardware pantry and production microscope captures at APP_URL.
Completion requires agent image inspection, not test success alone.

Foliage microscope refinement: reducing the leaf size exposed the second cause:
every petiole still connected to one central stem. Replace that spoke layout
with nine seeded sprigs carrying leaves at staggered positions along each sprig.
The leaf factory stays shared; the shrub growth owner provides branch paths and
leaf origins. Prove connected leaf origins, branch count and short petioles before
reviewing the source-like loose leafy silhouette. Do not add a filled core.

Foliage checkpoint: the final nine-sprig construction passes 238 app tests in
45 files, app lint/typecheck/build, 15 naming checks and the Office Inspector
contract. The first full run detected 160 draw groups at the <160 budget;
reusing the existing stem/leaf greens repaired it without increasing the limit.
The rerun passes. Existing bundle-size advice remains. No commit/push.

Visual scope is the production shrub preview (front/top/three-quarter) plus the
hardware pantry, APP_URL http://127.0.0.1:5194/:
`OFFICE_HARDWARE_REVIEW=1 yarn workspace @asyra/asyra-office test:e2e e2e/pantry.spec.ts e2e/pantry-vessels.spec.ts --grep 'plant-shrub|pantry source' --output=test-results/pantry-leafy-budget`.
Two cases pass. Images under `apps/asyra-office/test-results/pantry-leafy-budget/`
show separate unequal leaves, real sprigs, irregular outline and retained pot.
Agent inspected the close-ups and live IAB Tea point; capture success alone was
not used as acceptance. Source artwork is not claimed to be pixel-identical.

Shelf and counter placement remains pending the owner's clarification of
"the other wall": the white divider at the left or the wallpaper wall behind
the units. Existing countertop and shelf backs already lie at/near the rear
wall. No shelf/cabinet coordinates were changed while this direction is pending.

### Pantry left-wall contact - 2026-10-27

The owner's close crop resolves the placement: the shelf and preparation
worktop extend to the white divider behind the refrigerator. Scope is the
compose-office pantry shelf/work cabinet and direct geometry tests/docs; retain
the separate sink cabinet, supported contents, appliances, plants, accepted
structure, other rooms and exterior. Derive the left contact from the accepted
wall inside face, not new wall geometry. Derive worktop depth from the stationary
fridge rear extent plus clearance so extending left does not intersect it.

Step card: compose-office consumes approved structure and completed pantry
assets and emits supported, non-intersecting assemblies. Owner and implementation
boundary remain apps/asyra-office/src/scene/. No render or construct-asset repair
is needed. First prove missing wall contact in formal room tests; then extend
the existing complete shelf/cabinet construction, preserving the distinct sink
worktop and its 7.5 mm join. Check contact, fridge clearance, supported smallware,
scene budgets, lint/type/build, naming and Inspector contract; inspect production
pantry source and higher-angle captures. No commit or push requested.

The new regression first failed with a 0.5223 m shelf gap at the white wall.
After extending the units, review identified clustered shelf contents; a second
regression failed with a 0.5377 m corner-to-pot gap. Both now pass. Contents
use fractions of the extended shelf span, with the plant nearest the corner.
The preparation top is 1.5923067793 m wide and 0.5510995177 m deep; cabinet
fronts and plinth follow those dimensions. The separate sink join remains
7.5 mm. Geometry supplement and implementation notes reflect the actual layout.

Validation: 240 app tests across 45 files, 21 focused room tests included,
app lint, TypeScript/Vite build, 15 naming checks and the Office Inspector
contract pass. Vite retains its existing chunk-size advisory. Hardware visual
command: `OFFICE_HARDWARE_REVIEW=1 yarn workspace @asyra/asyra-office test:e2e e2e/pantry.spec.ts --output=test-results/pantry-wall-contact`
passes one case against http://127.0.0.1:5194/, viewport 1800 x 1200.
Production Tea point and higher worktop images under
`apps/asyra-office/test-results/pantry-wall-contact/` were inspected for both
wall contacts, refrigerator clearance and the independent sink joint. The live
IAB was returned to Tea point on the same source. Automated checks and visual
inspection are separate evidence; no whole-illustration parity claim is made.
No commit or push.

### Pantry source-item reconstruction - 2026-10-27

The owner rejected the previous generic vessel/tray appearances and the unequal
worktop depths. Reference-visible silhouettes, bands, caps, contents, sizes and
ordering are required; no substitution for visual convenience or optimization.
The previous plan failed because wall contact was treated independently from
front alignment, and existing generic accessory shapes were accepted without
checking enlarged source details. Replace that approach with two owner slices:

1. construct-asset: reconstruct the visible pantry vessel regions and the gray
   tray with its upright central piece (the source does not show two plates).
   Use current lathe/tube/box constructors and editable material regions. Exact
   hidden surfaces and unreadable writing cannot be inferred from the source.
2. compose-office: equal 0.625 m worktop depths and front/back alignment, retaining
   separate cabinets; move the whole refrigerator assembly forward by the needed
   clearance, including its attached notes and supported objects. Reposition and
   size every shelf/preparation-counter object against the enlarged source.

Scope: pantry asset recipes/constructors, pantry composition, direct formal tests,
current pantry docs and live pantry review. Exclude shell, other rooms, exterior,
renderer, unrelated asset families, commit and push. Existing Inspector owners
and handoffs remain valid. Before each implementation slice, prove the reported
mismatch with failing geometry/appearance regressions. Verify closed profiles,
support/contact/collision, unmodified other scene geometry, app tests, lint,
build, naming, Inspector and hardware pantry captures. Review source-angle and
close-up shelf/worktop images against the original, not just green tests.

The owner reiterated that reference fidelity is a whole-project requirement, not
one-room feedback. The opening numeric-authority sentence and Source authority
section contradicted that later instruction; both are corrected. App-local
AGENTS.md, README and technical proposal now carry the persistent contract.
This does not authorize an unbounded rewrite of unaffected assets.

Current pantry correction: aligned 0.625 m worktops, refrigerator and attachments
moved forward 73.9004823 mm for clearance, larger source-shaped shelf vessels,
separate collars/caps/bands, thick varied crock contents, larger preparation mug
and dark-pot plant, and the source-visible tray upright replacing invented plates.
The gray caps use the reference's metal appearance, not the old plain finish.
Magnified hardware inspection exposed coplanar label-band faces; a failing formal
clearance regression now requires 0.2 mm inner-face separation and the recipe is
corrected. No visual detail or test budget was removed to meet a performance gate.

Engineering evidence: full app run passed 245 tests / 45 files before the final
band-clearance regression; all 15 vessel tests then pass on the final profile.
App lint, TypeScript/Vite build, naming (15) and Inspector (1) pass. The initial
full run detected 160 draw groups against the <160 gate; correcting the gray
cap material also removed its separate plain-material batch, and the next full
run passed unchanged budgets. A removed lathe import broke the intermediate
build/browser startup; it was restored and both were rerun. These failures are
not visual acceptance evidence.

Visual evidence uses production APP_URL http://127.0.0.1:5194/, viewport
1800 x 1200 with deviceScaleFactor 2, and the pantry E2E command above under
`test-results/pantry-source-items`. Review captures include source angle, an
appliance-front angle and a higher worktop angle; enlarged shelf and preparation
crops are inspected separately. This does not claim whole-reference acceptance.
Unreadable source markings and exact obscured profiles remain unresolved; no
invented legible labels or claim of exact source reconstruction is permitted.
No commit/push or whole-plan completion.

The first band-spacing correction was insufficient in hardware review: a distant
24-interval band could still cross a near 64-interval body. Formal tests now
require full-detail construction for every region of the six shelf vessels,
selected by their source recipe. Their unverified distant variants are withheld;
no renderer patches, camera tricks or inflated body geometry were introduced.

Final engineering rerun: 247 tests across 45 files, lint, build and 15 naming
checks pass; hardware pantry capture passes. Enlarged final shelf capture confirms
that the unintended segmented label stripes are gone. Live IAB is at Tea point.
This records the bounded corrections and persistent contract update, not owner
visual approval or a claim that the entire app reproduces the reference exactly.

### Shelf-only source reconstruction - 2026-10-27

The newly supplied enlarged shelf crop rejects the last reconstruction. The visible
objects are not a family of identical ring-labeled canisters. Read left to right:
a low ochre pot with a tapered leafy crown; a small open brown vessel; a tall pale
canister with localized pale/yellow front labels and a shallow lid; a shorter pale
canister with a large green front label; a brown jar with dark neck/lid and a thin
light rim; a tall shaped wooden/ochre mill-like object; a blue-gray open crock
with green rim and differently shaped utensil heads. These are visual inferences,
not claims of product identity or readable text.

Scope is shelf recipes, their pantry asset constructors and scene instances,
direct tests/docs and production shelf review. Preserve shelf board, worktops,
appliances, room/exterior, other plants and counter bottle. construct-asset owns
closed geometry/appearance, compose-office owns scale/placement. These existing
Inspector steps and handoffs remain unchanged. No renderer change, dependencies,
Blender, commit or push. Replace full ring labels with local curved rectangular
labels, distinguish individual lid/shoulder profiles and utensil heads, reconstruct
the shelf plant separately from accepted fridge foliage. Fail formal regressions
first; run focused geometry/support tests then app gates and hardware close views.
Compare each of seven objects with this crop, not just overall shelf presence.

Shelf correction evidence: the supplied enlarged crop is preserved as
`assets/asyra-office/models/pantry-smallware/review/shelf-enlarged-reference.png`.
The actual production source-angle capture and shelf close-up are under
`apps/asyra-office/test-results/shelf-detail-final/`. Enlarged inspection found
collar/lid side overlap on sage and brown jars; the new formal regression failed
before their collar endpoints were corrected. Elliptical utensil poles now use
exact zero radii, removing degenerate triangles without changing the silhouette.
The cream upper label was shortened and changed from dark brown to ochre.

Focused asset/composition tests: 42 pass. Full app suite: 249 pass, one fails
because the scene now has 161 draw groups against the existing <160 gate.
Lint, build, 15 naming checks, Inspector contract and hardware pantry capture pass.
Do not lower visual detail or relax the gate to hide this failure. Shared renderer
batching is outside this shelf-only scope. No commit/push; no full-scene or owner
visual approval claim. The visible label blocks, distinct vessel proportions and
three utensil silhouettes have been inspected at 1070 x 580 shelf-crop resolution;
the source's blurred label artwork and hidden profiles are still inferred.

### Shelf flower correction - 2026-10-27

Owner clarification: the leftmost shelf object is a flowering plant, not a
foliage-only shrub. Within construct-asset, retain the existing pot/support and
other shelf objects; add source-relative pale-yellow/gold blooms and connected
stems to the shelf-only recipe. Individual petal shape/species cannot be resolved
from the source. Formal scene/mesh regression precedes implementation; validate
focused plant/composition tests, lint/typecheck/naming and production pantry
screenshots with enlarged flower review. The existing draw-group gate failure
remains visible; no renderer changes or lowered fidelity are authorized here.

The owner additionally identified the second item as a small leafy plant and
rejected the yellow lower label on the third cream jar. This extends the same
bounded shelf correction to those two existing instances; no other vessels move.
Regressions failed for absent flowers, absent second-pot foliage and the unwanted
cream label before implementation. Hardware close review then reduced exposed
flower stem heights from 380 mm maximum to 290 mm, keeping blooms among leaves.

Validation: 44 focused tests pass, including production second-pot composition,
flower geometry and removal of the rejected label. Lint, typecheck and 15 naming
checks pass. Hardware pantry capture passes and the 590 x 570 crop has been
inspected. The unchanged whole-scene budget gate still fails: 163 draw groups,
required <160. No appearance was removed to satisfy it and no commit/push occurs.

### Framework-owned office shortcuts - 2026-10-27

Scope: migrate every implemented office keyboard shortcut (WASD, arrows, Shift
speed) to Core.registerInputKeyCombinations. No object, camera speed, renderer,
mouse/touch gesture, dependency or publication changes. Existing API discovery
found exact-set chord matching only, no reliable held-key release/cancel output.
Introduce opt-in keyboardMode: held at InputSystem, with normalized down/up/cancel
metadata in RawInputEvent. The registered keys are the tracked alternatives;
normal chord mappings keep their existing semantics. Held state has no repeat
expiry; release bookkeeping survives stopped propagation; blur, focus changes,
composition and hidden document cancel it. App owns editable-target/modifier
admission and elapsed-time movement, not raw keyboard listeners.

Segment 1 - input normalization owner: packages/input-system and the utils raw
input type, public input docs and formal tests. Inputs: browser keyboard/lifecycle
events and explicit Core registrations. Output: one normalized held snapshot per
matching registration; no camera or app-specific policy. Prove aliases, multiple
held keys, keyup capture, modifiers, cancellation, detach/reset and ordinary chord
preservation. Public names are additive runtime contracts, not persisted IDs.

Segment 2 - compose-office camera intent: current Inspector compose-office owns
manual camera intent and frame-clock integration. Consume the normalized output
through the existing Core registration facade; scene runtime owns registration
and cleanup, UI only invokes public scene APIs. Preserve smooth start/release,
diagonal normalization, repeat independence, text/IME/browser shortcuts and
no idle frames. Regression tests must fail before replacing the direct window
keyboard binding. Gates: input package tests/build, office input/lifecycle tests,
app lint/typecheck, naming, Inspector contract and real browser keyboard checks.
Existing unrelated shelf draw-budget failure is excluded from this input fix.

Validation: 41 InputSystem tests, 10 office keyboard/runtime tests, three live
browser camera cases, 15 naming checks and the Inspector contract pass. Utils
and InputSystem builds, office typecheck/build and office lint pass. Scoped
framework lint reports no errors and retains one existing console warning.
Browser moving/release/text-focus captures were inspected; the current user tab
returns to Demo scene ready after module updates. A failing cancellation-cleanup
regression preceded the reset correction; reset now completes cleanup before
reporting a consumer cancellation error. No commit or push was performed.

### Refrigerator night-light correction - 2026-10-27

Owner correction: the object right of the refrigerator plant is a night-light,
not a storage jar. First owner `construct-asset` consumes the supplied crop and
numeric smallware recipe; `compose-office` replaces only that refrigerator item.
Keep the plant, refrigerator, shelf, room geometry and controls unchanged.
Reuse existing lathe/tube/part constructors and public Spatial material alpha;
no renderer changes, dependencies, commit or push. Construct a dark rounded base,
transparent cylindrical enclosure, pale cap and top loop, with a warm central
diffuser. The crop resolves these silhouettes but not exact manufacturing detail.
Dimensions are reference-derived defaults, with replaceable colors. Existing
Spatial materials do not expose emission; this slice supplies the warm diffuser
appearance, not real light casting or bloom. Do not simulate glow with overlays.

Test the production assembly for the named lamp regions, base/enclosure/diffuser
bounds and absence of contents, label and jar lid before changing production.
Then validate topology/appearance, scene placement, naming, lint/typecheck and
hardware pantry screenshots at APP_URL, including a magnified refrigerator crop.
Stop at this bounded correction; unrelated draw-budget failure remains excluded.

Validation: the new production-assembly test failed against the jar before the
replacement. All 45 focused smallware/light/composition tests now pass; app lint,
typecheck and 15 naming checks pass. Hardware pantry review passes at
http://127.0.0.1:5194/ (1800 x 1200 viewport, device scale 2, Tea point camera).
The production source-angle image and 554 x 480 refrigerator crop were inspected
for the clear enclosure, separate warm diffuser, rounded base, cap and attached
loop. Screenshots remain under app test-results/night-light. The unimplemented
emission/light-casting capability remains explicit above. No commit/push.

### Night-light emission - 2026-10-27

The owner requests an actually luminous light core. This supersedes the prior
appearance-only limitation. Freeze scope to optional engine-neutral emissive
color/intensity, Preset admission and material application, Office asset/frame
transport and the existing night-light recipe. Preserve geometry, placement,
lighting setup, all unrelated materials and prior keyboard changes. No bloom,
point lights, glTF import expansion, dependencies, commits or pushes.

Step 1 - `render-spatial`: Office Inspector inputs preview/scene descriptors,
output visible scene; shared admission/resource lifetime remains authoritative.
The render-engine SpatialDescriptor owns neutral public types; Preset owns
validation and Three material mapping. `emissive` is a 24-bit sRGB color and
`emissiveIntensity` a finite nonnegative multiplier, both defaulting to zero.
This is an additive material property, with no asset-name checks, provider
objects in app geometry, renderer-owned canonical writes or new cache. Spec:
Office Foundation and Preset material contract. Failure owner: render-spatial.
Formal gates: reject malformed emission; preserve admitted values; actual Three
material emission on creation/update/reset and distant instances; retain geometry
and material identity on appearance-only updates. Run naming before/after,
focused engine/admission tests, builds and lint. Stop if a provider bypass is needed.

Step 2 - `construct-asset` then `compose-office`: carry replaceable emission from
the night-light diffuser recipe through AssetPart and material batching into the
public descriptor. Every unrelated part retains zero emission. Material batching
must distinguish emissive/non-emissive regions even with identical albedo.
Formal production-mesh tests precede edits. Verify the unchanged lamp envelope,
light-only emission, batch separation, app lint/types and real hardware pantry
close captures. Completion requires a visibly luminous warm core inside the
existing transparent enclosure; emission does not imply lighting other surfaces.

Validation: 11 shared emission regressions failed before implementation; all 77
focused spatial admission/engine/layer/registration/resource/lighting tests now
pass. Three Office failures preceded asset/frame transport; all 31 focused
asset/material/composition cases pass. Naming (15), scoped framework lint, app
lint/typecheck/build, render-engine/Preset builds and Inspector validation pass.
Hardware pantry capture passes on APP_URL at 1800 x 1200, device scale 2; the
554 x 480 refrigerator close crop was inspected. Final emission color is #FFB35C
at intensity 2.5 to retain warm light behind the transparent enclosure. Emission
is verified on actual Three materials and retained distant instances, with no
bloom or lighting of other surfaces. Geometry and placement remain unchanged.

### Soft visible night-light glow - revised approach - 2026-10-27

The owner rejected the emission-only image: brighter albedo/core alone does not
produce the requested gentle light halo. The missing owner is `render-spatial`
presentation, not lamp geometry. Keep the approved geometry/material emission
and add an opt-in, engine-owned emissive bloom operation. Render normal
appearance unchanged, then an HDR emission-only mask with ordinary geometry retained as black
occluders and transparent enclosure alpha retained. Apply a small separable
Gaussian blur, tone/color-convert only that glow and add it over the unchanged
normal render. This avoids changing background or non-emissive tone mapping.
This keeps bright non-emissive walls, plants and UI from becoming bloom sources.
No app-specific mesh names, overlay sprites, patch geometry or global lighting
changes. No new dependency: use the installed Three renderer/fullscreen primitive.

Step 1 - render-spatial, per Office Inspector/Foundation: input is optional
neutral bloom settings (strength and CSS-pixel radius) plus admitted scene;
output is the visible scene with emission-derived halo. Preset owns admission,
render targets, mask material reuse and disposal. Defaults omit the effect;
invalid settings and unsupported driver methods reject instead of silently
ignoring bloom. Targets follow viewport/DPR and are disposed with the renderer.
Mask material copies are retained by source material identity, updated on each
render, and released with their source or engine. Original scene/material/renderer
state is restored even on failure. Existing flush owns rendering; no new frame
loop or scene construction. Scope: Preset spatial presentation and direct tests,
Office options, current lamp spec/docs and Inspector. Gates: admission red/green,
mask/occlusion/restoration/resource/work-count tests, adjacent engine tests,
app lint/build, naming, Inspector and live hardware close image. Stop on changes
to geometry, external scene, dependencies or canonical state requirements.

Step 2 - compose-office: opt into the small emissive glow through applyPreset
options; keep source intensity/color and all scene geometry fixed. Review the
real pantry crop for a visible soft warm edge around the core, no harsh outline,
and unchanged other objects. The prior emission-only completion claim is
superseded; material property tests alone cannot close this visual request.


Validation: the missing bloom admission and Office opt-in were reproduced before
implementation. Final focused Preset cases: 88 passed; Office asset, composition
and runtime cases: 33 passed. Naming (15), scoped lint, Preset build, Office
build and Inspector contract passed. Hardware pantry review passed on APP_URL
at 1800 x 1200 and DPR 2. Its 554 x 480 native close crop and rotated appliance
view show a soft warm halo around the core while the shade/base remain readable;
the current desktop tab was refreshed and inspected at Tea point as well.
Final presentation settings: strength 0.45, radius 8 CSS pixels. Shader/runtime
console errors are checked; the existing automatic favicon 404 is excluded from
this scene-only gate. Evidence is under
`apps/asyra-office/test-results/night-light-glow/`.


Owner brightness adjustment: reduce the night-light emission multiplier from
2.5 to 1.75 and bloom strength from 0.45 to 0.315 (70% of each previous
setting). Preserve warm color, 8 CSS-pixel halo radius, geometry and scene
lighting. This is a parameter adjustment within the existing night-light scope,
not a new renderer behavior.


### Add framed night-light while retaining the original - 2026-10-27

Owner request: retain the original pantryNightLight asset and its specification,
add a distinct frameNightLight from the supplied photographs, and select the new
asset at the existing refrigerator anchor. Construct-asset owns the reference,
source dimensions, regions and mesh factory. Compose-office changes only that
assembly's asset selection. Reuse existing lathe/profile extrusion, replaceable
appearance, public emission/alpha and Preset bloom. Do not alter framework,
lighting, other furnishings, or the original asset. Freeze tabletop height at
300 mm and derive other ratios from the photograph, documenting that it has no
physical scale. Acceptance: two independent retained factories, four uprights
joined by two perpendicular rounded arch straps crossing at the top, clear tall cylinder with light confined to
its bottom, grooved bronze base, no old cap/loop, and unchanged fridge anchor.
Gates: named-region/bounds/transparency/emission tests, old-asset regression,
room placement tests, naming/lint/build and hardware close/multiple-angle review.
No commit or push in this task.


The second owner photograph corrected the initial parallel-frame interpretation
before completion. Two perpendicular arches now cross with tops at 294/300 mm.
The original night-light recipe and factory are unchanged. Both factories have
independent public review routes. The selected fridge assembly uses the new
model at the existing anchor. The dedicated FRAME-NIGHT-LIGHT.md, source JSON,
two source photos and five-view single-part reference are retained together.
Validation: 31 asset/composition cases, 4 preview cases, 15 naming cases, scoped
lint and App build passed. Two hardware visual cases captured both assets and
the pantry; the reference-sheet-only rerun also passed after removing UI corner
pixels from the capture bounds. Close and three-quarter views were inspected
against both photos. Owner visual approval remains pending; no commit or push.


### Framed night-light metal finish - 2026-10-27

The owner reports a matte-looking metal frame/base. The App currently replaces
all non-instanced metal finishes with metalness 0.35 and all instanced finishes
with zero; AssetPart cannot preserve a recipe-specific value. Reuse the existing
public Spatial metalness contract. Construct-asset carries the source finish;
compose-office preserves it in descriptors and material batching. Scope: optional
AssetPart metalness, new lamp recipe/factory, direct descriptor tests, reference
sheet and related specifications. Keep old defaults, other assets, geometry,
light core, bloom and scene lights unchanged. Test finish transport and batch
separation before implementation, then inspect the real app and regenerate the
same reference sheet. No new dependency, environment renderer or commit/push.


Visual checkpoint: explicit metalness passed the transport tests but made the
metal darker, not glossy. The actual image rejects parameter-only completion.
The existing provider has no environment map. Revised render-spatial slice:
add neutral per-mesh environmentIntensity (zero by default), with one lazy
provider-owned studio PMREM resource shared for that engine lifetime. Reuse the
installed Three RoomEnvironment and PMREM APIs; no download or dependency.
Only the new lamp's metal regions opt in; the scene's environment, lights and
all other assets remain unchanged. Target specular highlights must vary with
view direction rather than being painted into color or emissive geometry.
Test default-off and admission failures, resource creation counts, sharing,
updates, disable/re-enable, failure restoration and disposal. Preserve source
geometry, existing material defaults, emission and bloom; rebuild API/provider
and inspect actual app/preview images before completion. This supersedes the
initial no-environment-renderer restriction based on the visual failure.

Validation of the revised finish slice: 54 focused Preset tests, 14 Office
material/asset/preview tests, the Inspector contract, naming and scoped lint
passed. Preset and Office builds passed; Office retains its existing bundle-size
warning. Both hardware browser reviews passed. Inspected the actual pantry
close-up, the five-view asset sheet and the user's live Tea point view: the base
now shows reflective bands and the straps retain bronze shading across angles.
The five-view asset reference is updated from those captures. Original asset
preservation and unchanged light-core intensity remain covered by focused tests.
This validates the metal finish change, not complete photographic equivalence.

### Shelf condiment interpretation - 2026-10-27

Owner correction: the five objects after the two plants are condiment/spice
containers. Bounded work repairs their recipes and labels at construct-asset,
then updates their direct scene references at compose-office. Reuse pantryVessel
and existing lathe/label geometry; no new framework capability is required.
Preserve plants, shelf support/placement, first three jar silhouettes, rejected
yellow lower label, all other pantry objects, lights and building geometry.
Replace the inferred hourglass object and utensil crock with narrow amber and
dark herb jars. Supersede their unpersisted preview IDs, without compatibility
aliases. Do not invent readable ingredient names from the low-resolution crop.

Step execution: construction consumes sourceVariants.vessels and owner crop,
outputs closed named AssetParts; composition consumes them at the same shelf
anchors. No renderer-owned geometry or invalid-input bypass is allowed.
Regression first: capped jar topology, broad amber waist, absence of utensils,
source envelopes and five-item order. Finish with focused vessel/room tests,
naming, lint, build and maintained hardware pantry screenshots with close review.
Stop at this correction; do not commit or push in this task.

Validation: 49 focused asset/composition/preview tests pass, including the
unchanged structural and exterior meshes. Naming, scoped lint, Inspector contract
and app build pass (existing bundle-size warning remains). The hardware pantry
E2E passes; its source-angle shelf crop was inspected against the owner crop.
Five distinct capped containers are visible, without utensils or a narrow mill
waist. Source-relative placement and the two plants are retained. Tiny markings
and hidden cap construction remain inferred, not exact recovered image detail.

### Transparent condiment jars - revised task iteration - 2026-10-28

The owner invalidated the previous opaque-jar interpretation: all five jars
are clear containers, and their colors belong to the contents. The previous
checks proved caps and order but omitted container/contents separation. This
revision supersedes that material interpretation at construct-asset. Inputs
are the same owner crop plus this explicit clarification; outputs are hollow
neutral transparent bodies, separate opaque caps and independently colored
interior fills with visible headspace. Ingredient identities remain inferred:
sugar, dried herbs, brown spice powder, ochre spice powder and peppercorns.

Bounded scope: vessel JSON/factory/labels, its direct tests, replaceable ingredient
surfaces and tests, pantry specification/implementation docs, and existing pantry
visual review. Existing public opacity/environment/surface APIs suffice. No
framework change, jar envelope or placement change, unrelated room work, push
or commit. Tests must first reject opaque walls and missing independent fills,
then prove clearance/headspace/recolor isolation and valid repeatable surfaces.
DoD: focused tests, scoped lint/naming, app build and inspected actual pantry
close-up at the existing live URL. Inspector construct-asset and compose-office
contracts remain unchanged; no downstream overlay substitutes for jar geometry.
Self-review: scope corrects the first wrong material/geometry interpretation;
uncertain ingredient names are not promoted to recovered facts.

Revised validation: 51 focused tests pass; opaque-shell and out-of-range UV
regressions were demonstrated before their respective corrections. App build,
scoped lint and Inspector contract pass. Hardware pantry review passes, and
the final actual shelf crop was inspected: neutral transparent headspace,
separate colored fills and irregular grain patterns replace opaque painted
jars and stretched radial/grid patterns. Ingredient identity remains an explicit
inference; this is not a claim to recover labels or hidden details exactly.

### Owner-specific jar necks and paper labels - 2026-10-28

This bounded revision replaces the overgeneralized no-label and generic-cap
assumptions. Construct-asset consumes the latest owner clarification: ivory
contents/yellow paper on jar one, ochre contents/green paper on jar two, inset
neck and broad flat cork on jar three, and a long narrow chili-bottle neck on
jar four. The fifth closure needs source/owner confirmation. Preserve transparent
shells and separate fills, outer placement/height envelopes, unrelated pantry
objects and scene structure. Reuse pantryVessel, lathe, vesselLabel and public
surface/opacity contracts. No framework work or commit/push.

Test first: paper-shell clearance, independent food/paper colors, inset neck
ratio, flat cork and narrow-neck length; retain closure/UV/fill clearance and
scene preservation tests. Synchronize JSON/spec text, then run focused tests,
scoped lint/naming/build and inspect source-angle pantry close-ups. The existing
construct-asset to compose-office flow remains unchanged. Exact food identity
is still unknown; latest owner descriptions override earlier ingredient guesses.
Self-review: earlier engineering checks failed to encode the source-specific
neck/cap and paper distinctions. This revision adds those actual constraints
rather than using a shared generic jar shape or changing the renderer.

Owner clarified the fifth object during execution: it is an opaque blue pot
with brown edging, succulent leaves and a dark possible flower bud. Supersede
the fifth glass-jar interpretation entirely. Extend only the existing shelf-plant
factory/source recipe and its direct preview/scene consumers; retain four clear
containers. Scene tests must reject a lid/food and require soil, distinct leaves
and the bud at the fifth support anchor. This is confirmed scope, not a new
plant category invented by the implementation.

The owner supplied a real cork-jar photograph during this revision. It replaces
the narrow-neck/broad-disc interpretation for jar three: a wide opening, gently
inset shoulder, visible glass lip and a tapered cork inserted into the mouth.
Keep its existing 161 x 161 x 215 mm scene envelope and brown contents. Test
the mouth/body ratio, inserted depth, cork-to-mouth fit and continuous cork
profile before rebuilding; compare the actual app close-up with the photograph.
The supplied photo is reference-cork-jar.png in the pantry-smallware directory.

Validation: 59 focused asset/scene/surface/preview tests pass, including the
wide-mouth cork, planar cork UVs, independent paper colors, four fill clearances
and fifth succulent topology. Naming, app lint/build and Inspector contract pass.
The maintained hardware pantry and two asset microscope cases pass (3 E2E cases).
The final actual shelf crop and cork microscope were inspected; the cork now
sits inside the glass lip and no longer has a narrow stalk or radial top streaks.
The source does not identify the food species or hidden plant details; those
remain documented interpretations, not exact recovered product data.

### Fourth shelf bottle proportional correction - 2026-10-28

Owner request: fourth bottle total height is 70% of the third jar. Scope is the
existing shelf-amber-jar source profile, dependent dimensional tests and specs.
Reuse construct-asset and the existing pantryVessel constructor; scale all profile
radii/Z values and dimension metadata uniformly by (215 * 0.7) / 255, keeping
the bottom anchor, appearance and all other assets unchanged. No new renderer,
placement correction, dependency, commit or push. Prove the height/aspect contract
red first, then run vessel/scene tests, app checks and the maintained pantry
visual review; inspect the rendered shelf before completion.

Validation: the new 70% height regression failed at the original 255 mm height
and passes at 150.5 mm. All 48 focused vessel/room tests, app lint/build,
Inspector contract and the maintained hardware pantry E2E pass. The final
actual shelf close-up was inspected for proportional shrink and unchanged
support contact. No unrelated asset dimensions or placement were changed.

### Rendering workload investigation - 2026-10-28

Task association: Complete reference scene implementation, compose-office output
and render-spatial consumer; whole-plan acceptance remains with the owner.
The owner authorizes measuring the existing furnished scene and evaluating only
appearance-preserving batching before any proposed budget change. Preserve the
current <160 descriptor gate until a reviewed decision; do not alter materials,
geometry, transparency sorting, independent visibility/LoD, or interaction.

Step execution card: inspect `compose-office` output (`artifact:spatial-scene`)
and its official `render-spatial` consumer using the current approved scene,
real navigation input and the existing hardware browser route. App tests own
measurement, not runtime state or rendering. Allowed files: focused Office E2E
measurement helpers/specs, direct scene regression tests and this task's docs;
a production batching correction requires evidence and equivalence tests first.
No cache, provider change, debug product route, scene substitution or alternative
renderer is admitted. Failure remains with composition or the measured render
owner, not a fixture fallback. Initial stop conditions: measurable appearance
change, cross-object visibility/LoD coupling, or needing to relax the threshold.

The existing `scene.test.ts` gate counts `buildSpatialMeshes(scene, {})` results,
not actual WebGL submissions. The count excludes separately generated text/art
and additional shadow/bloom passes. Related task notes repeat the limit but do
not identify a hardware baseline. Measure real frame intervals, WebGL calls and
submitted triangles (including all passes), buffer allocation, live resource
counts and browser JS heap. Distinguish measured JS heap/buffer storage from
unknown total GPU memory; timing is host evidence, not a portable unit assertion.
Use hardware Chrome at 1440 x 960 CSS pixels, DPR 1 and 2, overview idle/orbit/
keyboard pan/zoom, with unchanged app geometry and effects. Save route, browser,
GPU, workload, instrumentation scope and screenshots. Existing fidelity, input,
resource-lifetime and budget tests remain authoritative and unchanged.


The verified inventory is 2,997 parts and 187 descriptors: 160 opaque material
batches, 18 instanced entries and nine transparent entries. Existing public
SpatialShape.colors and Preset's vertex-color material support permit preserving
individual sRGB colors as linear vertex albedo with a white uniform tint. The
first formal color-batching regression fails on the existing two-descriptor
output. The bounded compose-office correction may use this existing API for
static, non-selectable opaque entries only. Preserve positions, indices, UVs,
all non-color descriptor state and surface identity; bypass instance/LoD,
transparent and hidden entries. Do not quantize colors or alter asset geometry.
Compare the unchanged hardware navigation/capture route before and after; retain
the existing <160 gate. No framework API or renderer implementation change.


Hardware evidence (Apple M3 Max, Chrome, 1440 x 960 CSS viewport, 2026-10-28):

| Metric | Before | After |
| --- | ---: | ---: |
| Composition descriptors without separately prepared surfaces/art | 187 | 62 |
| Instanced entries / transparent entries | 18 / 9 | 18 / 9 |
| DPR 1 nonempty navigation frame calls, median | 624 | 274 |
| DPR 2 nonempty navigation frame calls, median | 588 | 238 |
| DPR 2 continuous keyboard-pan drawing frames per second | 58.9 | 58.9 |
| Initial live WebGL buffer storage, bytes | 45,475,204 | 54,879,136 |
| Idle draw calls in the two-second sample | 0 | 0 |

The source contains 2,997 parts throughout. Vertex color storage costs about
9.4 MB; it is not free memory optimization. These are instrumented submission
counts, not GPU execution time or total VRAM. Mouse-driven orbit/zoom redraw
frequency is limited by the test's input rate and must not be presented as FPS
capacity. Pan reverses every 250 ms to keep the furnished scene in view.
Short M3 Max samples do not certify mobile hardware or large agent populations.

Artifacts: `apps/asyra-office/test-results/render-workload-verified/` is the
unchanged baseline; `render-workload-batched/` contains the candidate JSON and
screenshots. The same DPR 2 overview differs in 205 of 3,478,112 pixels; this is
not pixel-identical output (the earlier two baseline captures were identical).
No shape, placement or material discrepancy was identified in the inspected
actual overview, shelf close-up and refrigerator-light close-up. Do not equate
this preservation review with approval of unfinished assets against the source
concept. The existing descriptor limit passes unchanged. Focused topology,
color-space, UV, finish, alpha and LoD tests pass; wider pre-push validation
remains separate and must complete before the pending push.


Final review found a test-route defect: OFFICE_HARDWARE_REVIEW=1 was honored by
individual hardware specs but ignored by the shared Playwright configuration.
Camera/interior specs still forced SwiftShader, and the combined 26-case run
exceeded its unchanged 150-second suite guard (the first camera case also
exceeded 30 seconds). A configuration regression test demonstrates the ignored
flag. Correct the shared Office test configuration to honor the existing flag,
preserve default software CI and all timeout/worker/retry guards, and document
this route. Run bounded review groups rather than increasing the suite limit.
This is test infrastructure within the current render-review task, not a
production rendering or camera behavior change. Revalidate Office and shared
checks; other validated source inputs are unchanged.

### Pantry countertop reference correction - 2026-10-28

Task association: Complete reference scene implementation, current checkpoint
72e5851f9. Scope is the two countertop groups only; preserve shelf contents,
appliances, cabinets, structure, renderer and exterior. The owner identifies the
left group as a plant beside the refrigerator, a small white insulated tumbler
behind that plant, and a white handled water pitcher on its right. The former
mug interpretation is superseded. Source-visible tray, rear bottle and sink-side
cup/plant require enlarged comparison. Do not infer hidden product branding.

Step card - construct-asset: approved source plus the owner's clarification and
countertop specification produce named, grounded geometry through existing
Office lathe/tube/plant primitives and the public spatial contract. Boundary:
Office assets and their direct specs/tests. No renderer patch, provider data,
new dependency or cache. Cases: hollow pitcher with lip and handle, insulated
cup with fitted lid, broad thin tray, labeled rear bottle and single brush.
Prove regression failures before asset edits; run asset tests before composition.

Step card - compose-office (after construct-asset checks): consume these assets
and the approved existing worktops; produce spatial-scene with a rear tumbler,
front plant, pitcher to its right and a broad foreground tray. The sink-side
white cup sits immediately left/front of its plant, not at the front edge.
Remove the unsupported soap dispenser from this scene. Failure owner remains
compose-office, boundary src/scene; render-spatial remains unchanged. Cases:
source-relative proportions/order, support, clearances and unchanged surrounding
assemblies. Gates: focused geometry/composition tests, naming, lint/typecheck,
Office build, hardware pantry E2E with native-resolution countertop crops.
Stop for an unresolved identity or a required out-of-scope structural change.
Image inspection is separate from automated correctness; owner visual acceptance
and whole-plan closure remain open. No push is requested for this correction.


Countertop correction evidence: the existing tray test was strengthened and
failed on its 0.24 m width; the new composition case failed on the missing
rear tumbler before scene edits. The completed slice passes all 282 Office
unit tests, naming (15 checks), Office lint and typechecked production build.
After the final preparation-crown adjustment, all 35 directly affected tests
pass again. Hardware pantry capture passes on the actual 5194 production scene.
Native preparation/sink crops were inspected; the broad upright was narrowed
and the preparation crown reduced to avoid reaching into the pitcher lip.
Evidence: `tmp/pantry-counter-review/` logs and
`apps/asyra-office/test-results/pantry-counter-final/` screenshots. Existing
structure, cabinets, appliances, shelf and exterior are unchanged. The unresolved
dark sink-side vessel is not reinterpreted by the preparation-group clarification.
Owner visual acceptance and whole-plan completion remain open; no push occurred.


### Countertop correction revision - enlarged reference, 2026-10-28

The previous engineering checks did not validate the reference interpretation.
The new enlarged crop shows a recessed silver basin with a narrow right-side
fitting, not a flat tray with a divider. The owner requests correction, especially
placement. Replace that interpretation at construct-asset, then compose-office;
keep the same active plan and scope. The plant must sit immediately behind the
refrigerator, with the tumbler behind it and the pitcher to its right. Use source
relationships and support/collision constraints rather than arbitrary evenly
spaced X positions. The pitcher needs near-vertical walls and a squarer handle;
its dark gray top region is represented as a plain recessed insert, without
invented branding or mechanisms.

Construct-asset card: inputs are the enlarged owner crop and the clarified
identities; outputs are the revised pitcher/pot and a recessed basin with a
right-side fitting. Office asset primitives (box, tube, lathe, subtractSolid)
already own the needed construction; Preset rendering is unchanged. Scope:
pantry-counterware, pantry-accessories, new preparation-sink, their direct tests
and pantry specs. Cases prove below-worktop cavity, raised rim, right-side tube,
near-cylindrical pitcher and direct support. No generic replacement renderer.

Compose-office card: revise only preparation-group placement and the necessary
matching aperture in the existing counter body/top. Preserve the cabinet's
external envelope, fronts, shelf, appliances, main sink and other rooms. Cases:
plant-to-fridge gap at most 0.12 m, pitcher-to-pot gap at most 0.10 m, rear
tumbler, true opening through the wooden worktop and narrow fitting at the
basin right. The prior tests remain green despite the source mismatch; add
failing relationship/cavity regressions first. Gates: affected unit tests,
naming, app lint/build and hardware pantry E2E with inspected native crops.
Scope stops at these surfaces; unreadable markings stay absent. Self-review:
the necessary aperture belongs to this correction, not structural refitting;
the prior numeric spacing is superseded, and no acceptance follows from tests
alone. No commit/push or whole-plan completion is requested.


Revision validation: the two new source-relationship/composition tests and the
pitcher geometry test failed before implementation. After construction and
placement changes, the full Office run passed 284/285 cases; the remaining
case asserted the superseded X-separated row. It was replaced with explicit
right/rear ordering plus positive Y clearance, consistent with the enlarged
source. The final affected four files pass 38/38 cases; other full-run tests
are unchanged. App lint, naming (15 cases), typechecked build and hardware
pantry E2E pass. Do not describe the earlier all-green engineering run as
visual acceptance of the rejected tray/spacing.

Visual scope: `e2e/pantry.spec.ts`, APP_URL `http://127.0.0.1:5194/`, Tea point,
1800 x 1200 CSS viewport at DPR 2, unchanged production camera and renderer.
Command: `OFFICE_HARDWARE_REVIEW=1 yarn workspace @asyra/asyra-office test:e2e
e2e/pantry.spec.ts --output=test-results/pantry-counter-position-final`.
The native preparation crop was inspected after each position revision. The
plant/fridge gap, rear tumbler, tight pitcher grouping and right-rear bottle now
follow the enlarged source relationships. The former tray/divider is absent;
the basin has a real below-top cavity and matching aperture. The source does
not resolve fine pitcher-top markings or hidden plumbing, so these are not
claimed as recovered details. Final screenshot:
`apps/asyra-office/test-results/pantry-counter-position-final/pantry-pantry-source-revie-df746--and-sink-at-readable-scale/preparation-counter-close.png`.
Logs are under `tmp/pantry-counter-review/revision-*`. Owner visual review remains
pending; no commit or push was requested or performed for this correction.


### Owner-directed corner layout - 2026-10-28

This instruction supersedes the reference's placement for three preparation
objects only. Scope: compose-office placement, its direct JSON/docs and formal
placement tests; no asset shape/material, cabinet, other object or renderer
changes. Put the complete plant envelope 0.10 m from each inside corner wall,
including foliage. Place the pitcher to its right with 0.10 m edge clearance,
and the insulated tumbler to the pitcher's right with 0.20 m edge clearance.
Keep pitcher/tumbler back envelopes 0.10 m from the wallpaper face. These are
scene-metre starting clearances for the requested visual spacing; inspect the
actual camera rather than treating a pixel gap as physical distance.

Compose-office card: inputs are current constructed parts, current inner wall
faces and explicit gap defaults; output is the same spatial scene with this
three-object row. Reuse the existing meshBounds helper and each constructed
parts array once during scene creation; no per-frame work, second construction,
new cache or framework behavior. Remove superseded literal anchors for these
three objects. Formal cases replace the prior fridge-adjacent/staggered layout
and must first fail, then prove complete-envelope wall and inter-object gaps,
worktop support and unchanged structure. Gates: focused placement tests, naming,
lint/typecheck, hardware pantry capture and inspection. No commit/push requested.

Validation: the new clearance case first failed on the former placement
(0.509268 m left clearance instead of 0.10 m). After the placement change,
all 29 room-furnishing tests pass, including unchanged structure and exterior.
Naming, scoped ESLint, app typecheck and diff whitespace checks pass. Hardware
pantry E2E passes 1/1 using the existing production scene at APP_URL
`http://127.0.0.1:5194/`, 1800 x 1200 CSS pixels and DPR 2. Inspected both
`preparation-counter-close.png` and `pantry-worktops.png` under
`apps/asyra-office/test-results/pantry-corner-layout/pantry-pantry-source-revie-df746--and-sink-at-readable-scale/`.
The elevated view confirms plant, pitcher, tumbler ordering and clear wall
separation. The refrigerator partly occludes the plant from the source angle;
the requested corner position is retained rather than moved for visibility.
Rechecked compose-office ownership: only these three placement anchors changed,
with no structural or renderer changes. Owner visual review remains pending.

### Pantry top-view layout proposal - 2026-10-28

Planning only, associated with this rebuild plan. Scope is a dimensioned top-view
proposal and its source data, using the current approved structure and actual
asset envelopes. Do not change runtime geometry, current placement specifications,
the Inspector contract or the live app. No commit or push is requested. Closure
requires reviewing the drawing, numerical fit, retained shelf objects and explicit
unapproved consequences; production collision/animation validation comes later.

Review drawing: [Pantry top view](../../../../../assets/asyra-office/models/pantry/review/pantry-top-layout-proposal.png).
Editable SVG and metre-based JSON are beside it with the same basename. These are
proposed authoring dimensions, not measurements recovered from the reference image.
The user authorized a rotated/recessed refrigerator concept, a shorter shelf,
storing the largest white jar and the tiny bottle second from the right, and moving
the dispenser to the outer end of the side wall. Storing means omitting instances,
not deleting their reusable assets.

The refrigerator retains the current 1.35 scale: 0.702 wide and 0.75195 deep
including its front projection. Proposed rear/left gaps are 0.05; these are virtual
layout allowances, not manufacturer ventilation requirements. Its front faces the
same aisle as the cabinets. A proposed right hinge and 90-degree opening use a
conservative 0.752-radius swept sector, including a 0.05 allowance. The dispenser
retains its 0.95 scale, rotates with its existing wall-facing arrangement unchanged,
and moves to Y maximum 1.12 with a 0.012 wall-plane gap. Its footprint straddles the
existing wall endpoint rather than sitting entirely alongside the wall. The
nearest corner remains 0.05243 outside that swept sector. This is a 2D planning
check, not proof of drawer extraction or simultaneous 3D door operation. A wider
fridge opening would require recalculation.

The latest owner correction preserves the complete main sink geometry, scale and
appearance, placing the group at the far right. Measured catalog bounds at the
existing 1.25 scale give a countertop width of 1.125 and depth of 0.625; full
assembly depth including projections is 0.651875. The basin envelope is 0.65
wide and 0.4125 deep, offset within its counter. These measured values replace
the earlier proposal's assumed 0.625-wide basin and narrowed cabinet. Translate
the entire sink group and its supported accessories together, without rescaling.
The proposed right edge is 2.94, giving countertop left X=1.815.

The preparation counter starts 0.04 after the refrigerator and ends 0.0075
before the main sink. Available width is 0.83781, with the existing 0.625 depth.
The owner permits a single-door cabinet and explicitly removes the small
preparation sink from this layout. Retain its reusable geometry, specification,
reference and tests. Later implementation should construct an uncut preparation
worktop and body, not fill the former opening with patch geometry. Keep the
separate preparationSink and cutPreparationOpening authoring utilities available
for future configurations. The currently running app is unchanged by this plan.

The owner also permits repositioning the countertop objects. The former straight
row and its 10/20 cm gap constraint no longer control this proposal. Preserve all
three asset sizes: plant at left rear, pitcher at right rear, tumbler at right
front. Use complete geometry envelopes, including foliage and pitcher handle.
Relative to preparation left X and rear wallpaper-side Y datum:

- Plant envelope left offset 0.03; rear offset 0.03.
- Pitcher envelope left is 0.10 beyond the plant right; rear offset 0.08.
- Tumbler envelope left offset 0.71; front Y is 0.51 forward of rear datum.

The plant is beside the fridge rather than in the former two-wall corner. All
three measured XY envelopes fit the counter and do not intersect each other.
The JSON drawing source records these candidate positions. They are a layout
proposal, not a claim of completed production placement or 3D collision review.

The shelf stays 1.05 wide and 0.24 deep, starting above the preparation counter
and extending over the left part of the main sink zone. Retain the flower pot,
small plant, ochre-content jar, cork jar and succulent in that order. Measured
mesh-envelope widths total 0.86337, allowing four 0.03 gaps and approximately
0.03331 at each end without rescaling. Store pantry-canister-1 and
pantry-canister-4; preserve their reusable assets. Shelf icons convey order,
not geometry. Fridge-top plant and light remain retained with new anchors to be
checked during implementation. Other rooms and exterior remain out of scope.

Review checks: actual asset bounds were read from the existing catalog/factories;
full-size sink dimensions, single-door counter width, complete countertop object
envelopes, pairwise XY separation and shelf capacity were numerically checked.
The revised drawing is visually inspected before delivery. No app implementation,
commit or push is part of this planning revision.

### Approved pantry layout implementation - 2026-10-28

Owner approved the revised top-view proposal and requested implementation.
Compose-office Step Execution Card: inputs are the approved pantry layout,
existing catalog assets and current shell; output is the same spatial scene
with a recessed, rotated fridge, outer-end dispenser, single-door preparation
cabinet, unchanged full-size sink translated right, shortened shelf and staggered
smallware. The preparation sink and two stored shelf vessels remain available
as assets but absent from the scene. Source: the preceding proposal section and
its SVG/JSON; Inspector: compose-office, lines 316-355, same App owner, no bypass,
no cache, renderer-owned writes and independent document copies forbidden.
Scope: scene composition, direct tests, pantry documents and hardware pantry
review. Preserve approved architecture, exterior, other rooms, all retained
asset geometry/materials and lighting. No animated opening feature is added;
door envelopes prove the bounded 90-degree planning clearance only.

Promote approved placement values to scene/reference/pantry-layout.json; runtime
must not import the review diagram or diagnostics. Existing meshBounds, block,
catalogAsset and placeParts own construction/placement; no Framework capability
is missing. Construct each retained asset once per scene and reuse its parts for
envelope placement; no per-frame work or new cache. Existing asset identities are
preserved. New single cabinet door identifiers are App-local, not persisted keys.
Add failing formal layout cases before implementation, then reconcile superseded
room-placement tests. Gates: naming, focused geometry/composition tests, app
typecheck/lint/build, hardware pantry E2E and enlarged image inspection. Stop on
an unapproved geometry change or unresolved collision. No commit/push requested.

Implementation validation: six new layout regressions failed on the previous
composition before implementation. A separate bottle/pitcher overlap regression
failed before relocating the green bottle to the preparation counter front left.
The completed Office suite passed 290 tests in 55 files; the final six layout
cases also passed after strengthening solid-top triangle coverage and fridge-top
wall-clearance assertions. Naming, app typecheck/build, app lint and diff
whitespace checks passed. The production build retains its existing chunk-size
warning. No retained asset was resized to make the arrangement fit.

Hardware Chrome pantry review passed at APP_URL http://127.0.0.1:5194/, with
a 1800 x 1200 CSS viewport and device pixel ratio 2. Evidence is in
apps/asyra-office/test-results/pantry-approved-layout-final/. The source-angle,
elevated worktops and appliance-front views were inspected, followed by enlarged
preparation-counter, sink-counter, shelf and fridge-top light crops. Review
confirmed the single full countertop, five separated shelf items, staggered
smallware and unchanged main sink assembly at the right edge. Door clearance is
a conservative geometric envelope check, not an animated opening demonstration.
The compose-office owner contract was rechecked at closure; architecture,
exterior and other rooms remain outside this revision. No commit or push made.

### Four-room depth expansion - 2026-10-28

Owner requests a 1.00 m rearward building extension, allocated as 0.50 m
additional depth to each of the four rooms. The entrance/frontage, X bounds,
wall heights/thicknesses, common floor elevation and asset shapes remain fixed.
Move internal front/rear room partitions by +0.50 Y and rear walls by +1.00 Y;
extend their continuous returns, floor band, floor and foundation. Move rear
pantry furniture and dispenser by +1.00 Y, retaining relative clearance; move
central table groups by the existing source-relative room-depth mapping. Rugs
move +0.25 Y in the lower rooms; neither asset shape nor scale changes.
Wall-mounted objects follow their supporting wall. Owner separately authorizes
rear street, shops and their associated rear scenery to move +2.00 Y as a group
for later review. Front and side street objects remain fixed.

Step Execution Card: compose-office (Inspector lines 316-355), App-owned
approved construction/layout and catalog inputs to artifact:spatial-scene.
No bypass, renderer-owned writes, new canonical state or cache. Allowed files:
scene composition/reference inputs, direct tests/E2E, this plan, implementation
docs and the matching Inspector condition. Existing block/placeParts/wall
construction APIs already implement the required geometry; no new Framework
capability or dependency. Preserve existing naming/asset identities.
Formal cases: four exact +0.50 m room depths, fixed frontage/heights/widths,
connected wall runs and extended ground support, unchanged asset dimensions,
retained pantry clearance, +2.00 rear scenery with fixed front/side scenery.
Gates: naming; focused geometry then Office suite; app build/lint; hardware
whole-building and pantry visual tests followed by enlarged screenshot review.
Stop on unresolved collisions or unapproved asset changes. No commit or push.

Validation outcome: all 56 Office test files / 294 tests passed, including the
four expansion cases first demonstrated failing before implementation. Office
lint, naming, typecheck/build and the focused Inspector contract passed. Eight
hardware-browser visual cases passed against the live app at port 5194.
Reviewed the enlarged pantry, building close-up, overhead and rear views and
work/discussion/lounge oblique views: connected walls, shared floor, supported
attachments and dispenser placement remain intact. Rear road clearance from
the extended slab is 1.51790 m. Existing deferred furniture and shadow artifacts
are outside this revision; this does not certify full reference-image parity.
Evidence: apps/asyra-office/test-results/four-room-expansion/ and
apps/asyra-office/test-results/four-room-expansion-rooms/. Local changes remain
uncommitted and unpushed for owner review.

### Discussion room reference correction - 2026-10-28

Bounded task: repair the upper-left room's regular furnishings against the
approved 1280 x 800 image, crop [438, 66, 770, 330]. Preserve the expanded shell,
seating transforms, all other rooms and exterior. Correct the undersized left
print, omitted tall foliage, low rear console, generic tabletop foliage and
missing right low cabinet. Source silhouettes and relative support/order govern;
occluded backs are construction assumptions, not measured image facts. Rejected
upholstery and occupants stay absent pending Blender review.

Step Execution Card: compose-office, Inspector lines 316-355, current procedural
room-furnishings contract in implementation.md. Inputs are existing catalog
geometry, approved structure/layout and source image; output is spatial-scene.
App scene composition is the sole contributor and failure owner. No renderer
writes, cached derivatives, diagnostic output or bypass. Reuse existing leaf,
planter, mug, rounded geometry, print and public spatial composition APIs.
Scope: discussion scene composition/helpers, permanent direct regression/E2E
cases, current implementation/plan and release source declarations. No shared
asset defaults, other rooms, shell, light/filter or dependency edits. Formal
cases: print/wall proportion, tabletop foliage identity/support, rear console
above tabletop, left/right storage and plant support/clearance. Test these on
old source first, then repair. Gates: focused cases, Office suite, lint/naming,
build and hardware discussion overview/oblique/detail screenshots. Stop for
unresolved source ambiguity that would change accepted structure or assets.

Validation checkpoint: 57 Office test files / 298 tests, Office lint, naming
and typecheck/build passed. Both hardware discussion visual cases passed on
the live app at port 5194. Inspected source-angle, overhead and enlarged
storage captures at 2520 x 2284 source resolution. Formal bounds verify plant
clearance and tabletop, console and cabinet support. The enlarged images
still show overly regular tall foliage; full reference appearance is not
accepted at this checkpoint. Upholstered chairs and occupants remain deferred
to Blender. New room changes remain local and uncommitted for review.
Evidence: apps/asyra-office/test-results/discussion-reference-review/ and
apps/asyra-office/test-results/discussion-microscope/.

### Left discussion tree and cabinet correction - 2026-10-28

The owner's enlarged reference supersedes the three-row climbing-plant
interpretation. The first wrong owner is compose-office: the plant recipe is
planar and the low cabinet is on the wrong side of the tree. Replace only the
left plant with connected, irregular, overlapping foliage clusters tapering to
a narrow crown; retain distinct closed leaves and full depth. Move the existing
small low cabinet beside it under the print, not in front of it. Keep the rear
plant, other furnishings, shell, camera, materials infrastructure and exterior
unchanged. Hidden branches are construction assumptions, not recovered detail.

Step Execution Card: same compose-office inputs, output, contributor boundary,
failure owner and no-bypass condition as the discussion slice above. Change
discussion-details.ts, discussion-furnishings.ts, their formal tests, existing
discussion E2E and these current docs only. Reuse existing leaf/tube/lathe and
placement APIs. New source-space cases must first reject the current planar
crown and wrong cabinet order: lower/middle crown wider than apex, substantial
depth in both ground axes, no wall contact, cabinet beside tree and below print.
Run focused geometry, Office tests/lint/build/naming and live hardware discussion
screenshots. Inspect enlarged leaf silhouette and cabinet relation before
acceptance. No push, shared asset rewrite or new dependency. This revised
approach replaces the failed three parallel stems for the left plant only.

Validation outcome: the new formal case first failed on 0.135 m crown depth;
the first volumetric iteration then failed the upper-crown span check at
0.176 m and showed separated bead-shaped lobes in the live screenshot. The
final overlapping-lobe recipe passes all five discussion cases and the full
57-file / 299-test Office suite. Naming, Office lint and typecheck/build pass.
Hardware discussion E2E passes against http://127.0.0.1:5194/ using the Meeting
corner preset and normal orbit/zoom, with 2520 x 2284 canvas captures. Inspected
the source-angle and overhead/detail captures: continuous tapered foliage,
full crown depth, wall clearance and low cabinet beside the tree are present.
Evidence: apps/asyra-office/test-results/discussion-tree-final/. Fine botanical
details hidden by the low-resolution source are not claimed as exact recovery.
Other room furnishings and the separate rear-console plant are unchanged.
Changes remain local for owner visual review; no commit or push in this slice.

### Left side table contents - 2026-10-28

Owner accepts the enlarged-source interpretation: an open wooden side table,
one empty gray vessel on top, and one upright ivory rectangular storage basket
underneath. Replace the two cylindrical baskets and closed side/back boards;
retain the existing table position, footprint and tabletop height. This is an
approved interpretation of ambiguous pixels, not recovered object identity.
Step Execution Card: compose-office owns the same artifact inputs and spatial
scene output, with no bypass or renderer-owned writes. Scope is the open branch
of discussionStorage, direct regression/E2E and current docs. Preserve the
closed right cabinet, tree, shell, other rooms and camera presets. Reuse existing
box/lathe/placement APIs; no new dependency. First prove the old construction
fails the single rectangular basket, open four-leg table and supported hollow
vessel checks. Then run focused tests, Office lint/build/naming and live hardware
discussion screenshots with enlarged table inspection. No commit or push.

Validation: the new case first failed because the old recipe emitted two
baskets. All 35 focused discussion/room-furnishings tests now pass, as do naming,
Office lint and typecheck/build. Hardware discussion E2E passed at the existing
port 5194. Inspected source-angle and enlarged overhead screenshots: the gray
vessel is visibly hollow, the four-leg table is open and the single ivory basket
stands below its top. Front partitions still partly occlude the basket in the
source-angle view; its dimensions/support are also checked in source geometry.
Evidence: apps/asyra-office/test-results/discussion-side-table/. Current changes
are local, uncommitted and unpushed.

### Crisp discussion poster - 2026-10-28

Owner rejects photographic blur on the large print above the side table.
compose-office must select newly authored crisp artwork with the same four
lines (Better / Agents / Happier / People), cream paper and small ochre smile.
Preserve frame, placement, proportions and all other scene objects. Existing
artwork preparation/label composition and the public Asyra spatial surface
contract remain the rendering path. Add an explicit per-artwork sample size
within the existing 512 limit; other artwork retains its existing resolution.
Scope: authored SVG, discussion source selection, artwork metadata/surface
sampling, direct regression/E2E and current docs. No global sharpening, font
dependency, original-reference edit or lighting change. First prove the existing
64-pixel output fails a 512-pixel request, then inspect the real app enlarged.
Gates: focused artwork/surface/discussion tests, lint/naming/build and hardware
discussion visual review. No commit or push.

Validation: the surface-path regression first failed (64 instead of 512).
All 45 focused tests pass after authored SVG selection and explicit resolution
propagation; Office lint, naming, typecheck and build pass. Hardware discussion
E2E passed at port 5194 and generated an unscaled native-browser poster crop.
Inspected that crop and the room overview: all four lines and the ochre smile
are readable, with the frame/placement retained. Evidence:
apps/asyra-office/test-results/discussion-poster-final/. The host's handwritten
font affects glyph style; exact original letterforms are not claimed. No
commit or push in this slice.

### Crisp rear discussion note - 2026-10-28

Owner requests the small rear-wall board to be crisp as well. Original tiny
lettering is unreadable; retain the existing scene copy Small steps / Every day
as an explicit reconstruction assumption. compose-office selects a new authored
SVG using the existing per-artwork 512 resolution. Preserve its frame, dimensions,
position, large poster and all other scene geometry. Scope: small-note SVG,
discussion source selection, direct tests/E2E crop and current docs. Existing
Asyra spatial surfaces and artwork preparation suffice; no new renderer behavior,
dependency or original-reference mutation. First demonstrate the old crop fails
the explicit-resolution check; then run focused artwork/discussion tests,
lint/naming/build and hardware room review with a readable rear-note crop.
No commit or push.

Rear-note validation: old source failed the explicit 512 resolution case;
all 46 focused artwork/surface/discussion/room tests now pass. Naming, Office
lint and typecheck/build pass. Hardware discussion review uses the live app at
port 5194 and normal orbit/zoom to expose the rear note. Its native-browser crop
shows readable copy and unchanged framing. Evidence:
apps/asyra-office/test-results/discussion-note-final/. Exact original words
remain unknown; the retained scene copy is documented as an assumption.
Changes remain local, uncommitted and unpushed.

### Rear console object correction - 2026-10-28

Owner identifies three tabletop objects, left to right: small plant, perfume
bottle, large plant. The note frame and console share a left edge. Bounded
compose-office slice: discussion furnishing composition, its local geometry,
direct tests, visual review and these current specifications. Preserve the
console, shell, other room contents and exterior. Reuse existing lathe, part,
placement and closed-leaf APIs; no new dependency or rendering path. First
prove regressions for edge alignment, bottle identity, support and volumetric
rear foliage. Then implement, run focused tests/naming/lint/build, inspect
hardware room overview and enlarged console. No commit or push.

Validation: before implementation, alignment failed by 0.28 m and the old
rear crown depth/width was 0.261. All 48 focused discussion, furnishing,
surface and artwork tests now pass. Naming, Office lint and typecheck/build
pass. Hardware E2E passed at the existing port 5194; inspected both the native
room screenshot and enlarged console crop. The crop exposes the small plant,
capped white perfume bottle and full-depth larger plant, grounded separately
on the tabletop. Frame and console left X both equal -1.23. Perspective and
the wall-to-table depth offset affect their apparent screen alignment. The
source-angle view still occludes the rear console behind the accepted pantry
divider; the normal elevated orbit exposes it without changing the structure.
Evidence: apps/asyra-office/test-results/discussion-console-final/. This slice
does not claim completion of the other furnishings or exact recovery of the
low-resolution image's hidden perfume details. No commit or push.

### Layered discussion trees - 2026-10-28

The owner rejects both crowns: scattered round leaves do not reproduce the
enlarged reference. Previous depth/taper tests pass but cannot detect this
shape error. Revised compose-office approach replaces spherical leaf sampling
with connected radial branch tiers and overlapping, curved, downward-pointing
elliptic leaves. Both trees share this construction at their current scales.
Scope: discussion tree helper, its source-space regressions, existing hardware
review crops and current specifications. Preserve pots, positions, perfume,
boards, all other plants and the shell. Existing mesh/part/placement contracts
suffice; no new dependency, lighting or renderer change. Test visible tier
scalloping and full-depth tapered crown before implementation; then inspect
both trees in overview and native-resolution detail. Run focused tests, naming,
Office lint/build and hardware E2E. The reviewed plan addresses the first wrong
owner (crown construction), not downstream material camouflage. Exact hidden
branch topology remains an explicit reconstruction, not recoverable evidence.
No commit or push.

Visual iteration: two native close-ups rejected the first tier recipe. It
created umbrella rings and exposed central stem; the radius-at-three-heights
oracle could pass while gaps remained elsewhere. Replace that oracle with
a continuous crown-envelope lower bound and explicit drooping-leaf geometry.
Keep the same compose-office scope. Use closer tiers toward the apex, deeper
leaf curvature, and staggered attachment heights; remove the flat bridge rings.
Review both full crowns, not just the overhead console view. This revised
construction supersedes the sparse tier/bridge specification above.

Final bounded validation: 41 discussion/furnishing tests pass, including the
continuous crown envelope and both central stems ending inside apex foliage.
The new coverage oracle failed on an empty band at local Z=1.60 m before
correction; the tip oracle also failed before shortening the exposed stem.
Naming, Office lint and typecheck/build pass. Hardware E2E passed on port
5194. Inspected both final native crops in
apps/asyra-office/test-results/discussion-trees-reviewed/: the tall tree has
layered downward-curving broad leaves and covered tier gaps, and the console
uses the same scaled crown with wall clearance. This is a reconstruction of
the reference silhouette, not a claim to recover every low-resolution leaf.
Owner appearance approval remains separate from formal gate results.
Other plants, furnishings, structure and exterior are preserved. No commit
or push.

### Photo-directed conifer replacement - 2026-10-28

The owner supplies a new clear conifer reference, superseding the broad-leaf
interpretation for both discussion trees. Bounded compose-office work replaces
only their shared crown/pot construction, necessary placement/sizing after the
owner's pending choice, direct tests, native visual crops and current docs.
Use fine closed needle geometry on connected twig sprays and upward-reaching
branches; preserve all other plants, furniture and structure. New source image
shows charcoal tapered pots and a crown approximately two thirds of total
height in width. Existing lathe/tube/mesh composition APIs own the geometry;
no existing conifer recipe was found in the app. No dependency, renderer or
lighting changes. First fail source-space checks for fine foliage, pot identity
and the new proportions. Then inspect both live sizes, run focused tests,
naming/lint/build and hardware review. The older broad-leaf predicates are
superseded only where this new reference changes the contract. No commit/push.


The first clear-photo implementation failed visual review: flat repeated sprays
left large ladder-shaped gaps. A permanent front-projection foliage oracle
failed at 61.6% inner-envelope coverage before the bounded correction. The
revised owner uses irregular branch heights/azimuths, independently rolled
sprays, broader fine needles and continuous core coverage. The old broad-leaf
recipe is fully replaced for these two plants only.

The public spatial admission regression also caught excessive expanded geometry.
The owner now uses existing Asyra geometry instances for all leaf/twig sprays;
no framework limit or batching workaround was introduced. The existing asset
preview registry is a direct consumer added solely to inspect this same room
factory from unobstructed views. This bounded review addition does not alter
rendering, camera ownership or any other asset.

Historical sizing assumption, superseded by the branch-first section below:
pending the owner's sizing preference, the initial implementation kept
the clear photo's proportions and fits the existing spaces: nominal floor-tree
height 1.04 m and console-tree height 0.42 m, at unchanged anchors. Current
construction and defaults are documented in implementation.md. Actual visual
review includes the two room instances plus front, right, three-quarter and
close-up captures at the same live app URL. No commit or push is authorized
by this task.

Validation: 62 focused scene/furnishing/discussion/preview tests pass, including
final public spatial admission and the new foliage-coverage regression. Naming,
Office lint and typecheck/production build pass. The build retains its existing
large-chunk warning. Two hardware E2E cases pass at http://127.0.0.1:5194/;
artifacts are in apps/asyra-office/test-results/discussion-conifer-dense/.
Inspected the native room crops and the production asset's front, right and
close-up captures: dense fine foliage, irregular taper and charcoal pot are
present; no broad-leaf tiers or wall intersections remain. Exact botanical
branch identity is not claimed. Owner appearance review and optional sizing
preference remained separate at that checkpoint. The subsequent owner reply
resolves the sizing approach below. No commit/push was performed.

### Branch-first discussion conifer sizing - 2026-10-28

The owner's answer supersedes the uniform-shrink assumption: determine branch
lengths from available space, then attach foliage to those branches. Preserve
the pre-shrink floor/console heights (2.26/0.8588 m) and anchors. The bounded
compose-office correction is the discussion tree generator, its room/preview
consumers, formal geometry and live visual tests, and this construction spec.
Existing lathe/tube and Asyra instance APIs remain the owners of mesh generation
and submission. Build once per scene lifetime. Furniture, walls, other plants,
lighting and exterior are excluded; no commit/push.

Execution: first fail room-height oracles while retaining wall/support clearance
checks. Generate branch endpoints from independent height and crown radius,
reserve space for attached sprays, and place uniformly shaped leaves on the
resulting twigs. Pot dimensions are independent of crown height. No final tree
squashing, clipping or leaf-position patches. Verify connected foliage, unchanged
needle shape, independent branch reach, unchanged adjacent furnishings, public
spatial admission, naming/lint/build and the existing two hardware review cases.

Outcome: restored both room heights and separated crown reach from pot sizing.
The initial height correction failed the formal inner-silhouette coverage oracle
at 65.2% for both room profiles. Branch/core density now follows vertical span
relative to spray size; leaves attach to the actual branch tube stations with
uniform instance scale and an orthonormal basis. The formal regression suite
also verifies unchanged needle prototypes, independent pot sizing and final
wall/support clearances.

Validation: 53 focused discussion/furnishing/preview tests and two hardware
E2E cases pass. Naming, Office lint and production build pass; the existing
large-chunk warning remains. Live review artifacts are in
`apps/asyra-office/test-results/discussion-branch-growth-final/`. Room crops and
single-asset close-ups were inspected for branch-connected fine foliage and
contact errors. Geometry checks do not establish photo-identical proportions:
the tall narrow room profiles intentionally adapt branch reach, and owner
appearance review is still separate. Current dimensions, generation formulas,
material regions and rendered triangle counts are recorded in implementation.md.
No commit or push was performed.

### Discussion wall calendar correction - 2026-10-28

Owner identifies the small board above the rear console as a calendar. Bounded
compose-office work replaces its authored SVG content and label, updates the
calendar regression and current documentation. Retain frame identity, dimensions,
wall attachment, console-left alignment and all other furnishings. Existing
authored-artwork preparation and 512-pixel surface remain the owners; no new
rendering or date subsystem. October 2026 is an explicit static reconstruction
choice, not a claim about the unreadable reference month.

The old test incorrectly required motivational text. Its replacement fails
before implementation and checks calendar identity plus all 31 dates in correct
Monday-first cells. Gates: focused discussion tests, existing room visual review,
Office lint/typecheck, naming and scoped diff review. No commit/push.

Validation: 20 discussion regression tests pass, including date-cell placement
and retained console alignment. Office lint/typecheck and naming pass. The
hardware room E2E case passes at http://127.0.0.1:5194/; its native elevated
calendar crop was inspected and shows the month, weekdays and numbered grid
on the existing frame. Artifacts: apps/asyra-office/test-results/discussion-calendar/.
No geometry, other artwork or furniture was changed in this correction.

### Discussion tableware identity correction - 2026-10-28

Bounded compose-office correction replaces the incorrect pitcher/handled mug
with owner-identified Americano glass, white sugar jar and handleless wide cup.
Scope: direct tableware recipes/composition, formal regression, existing room
visual review and current docs. Table geometry, notebook, plant, room structure
and other rooms are excluded. Reuse existing lathe/part/opacity contracts.
The new identity/contents/position regression fails before implementation on the
missing Americano. Gates: discussion and room furnishing tests, Office lint and
typecheck, naming, live hardware room screenshots and focused diff review.
No commit/push.

Validation: 50 discussion/room tests pass. After reducing the glass shell alpha
from 0.22 to 0.08 to avoid a milky appearance, the focused contents/position
regression passes again. Office lint/typecheck and naming pass. The hardware
room case passes at http://127.0.0.1:5194/; native close-up crop shows coffee
below the transparent empty rim, a separate closed sugar jar, and an open cup
without a handle. Source and elevated views retain the notebook/plant layout.
Artifacts: apps/asyra-office/test-results/discussion-tableware-final/.
Spec records dimensions, placements, replaceable colors and the alpha-glass
limitation. No commit or push was performed.

### Open sugar jar with a leaning removable lid - 2026-10-28

Owner approves option B and requires the lid to lean on both jar and table.
Bounded compose-office work completes the ongoing glass/sugar correction:
existing tableware asset, direct formal/E2E checks, reference preservation and
specification. No changes to room layout or other objects; future opening,
scooping and closing actions are documented only. Stable existing part IDs
remain authoritative; the local closed/leaning pose parameter adds no persisted
identity or compatibility path. Existing lathe, rigid mesh transform and solid
subtraction helpers own construction; there is no new framework renderer.

Test-first: the tabletop-support oracle fails on the seated lid before changes.
The lid is rigidly tilted and its supporting placement derived from geometry.
Sugar cubes are separately identifiable and physically stacked. Required gates:
discussion/furnishing regression tests, Office lint/typecheck, naming and native
room close-up review. Stop after static appearance and specification are checked;
no commit/push or character-animation implementation.

Validation: 53 discussion/room regression tests pass, including lid/table
contact, lid/jar proximity below 2 mm, visible cube height, retained closed
construction and public scene admission. Office lint/typecheck and naming pass.
The hardware room case passes at http://127.0.0.1:5194/; native table crop and
closer view were inspected for the open mouth, leaning lid, spoon and transparent
coffee vessel. Artifacts: apps/asyra-office/test-results/discussion-leaning-lid-final/.
The specification and saved choice image distinguish static geometry from the
future character-action contract. No commit/push or animation was performed.

### Discussion tabletop placement and loose sugar - 2026-10-28

Bounded compose-office correction: turn the notebook 90 degrees, place the
Americano immediately before it, deepen the coffee appearance, and loosen the
individual sugar cube orientations. Preserve the leaning lid, teaspoon, table,
room, plants and other furnishings. Reuse the existing part/mesh placement and
material contracts; no animation, framework changes, commit or push.

Three new/strengthened regression cases failed on the previous color, notebook
orientation and uniform cube orientations before production changes. The new
cube layout preserves 16 separate identities with deterministic yaw/offsets.
Formal checks verify non-overlapping conservative envelopes, support beneath
upper cubes, inner-wall clearance, seated-lid clearance and spoon-bowl space.
The notebook footprint is 150 x 220 mm; the glass has a 22 mm gap before it.
Coffee is #160C07 at opacity 0.96; glass-wall opacity is 0.04 to avoid a grey
veil over the dark contents while preserving the separate clear lip and base.

Validation: 55 discussion/room tests, Office lint/typecheck and naming pass.
The hardware discussion E2E passes against http://127.0.0.1:5194/. Inspected the
native table crop and elevated view for placement, dark coffee and separate
rotated cubes. Final artifacts: apps/asyra-office/test-results/discussion-table-layout-final/.
The normal angle still occludes some cubes behind the leaning lid; the elevated
view exposes their differing orientations. No refraction or animated physics
is claimed.

### Silver teaspoon and initial-camera coffee placement - 2026-10-29

Owner correction within compose-office: the coffee belongs above-right of the
sugar jar in the initial camera. Move it to table +[0.02,-0.06] and the notebook
to +[-0.03,0.11], preserving its orientation and the 22 mm front gap. Sugar,
lid, spoon geometry and other furnishings remain fixed. The teaspoon uses
opaque silver #C5C9CA, metalness 1, roughness 0.16 and environment intensity 1
through the existing Asyra material descriptor; it is not emissive.

The initial-camera projection and actual rendered metalness regressions failed
before the fix. All 60 discussion, room and material cases now pass, as do
Office lint/typecheck and naming. Hardware discussion E2E passes; initial
overview, native table crop and elevated close-up were inspected. Evidence:
apps/asyra-office/test-results/discussion-silver-position/. No commit or push.

### Tableware review correction - 2026-10-29

The owner rejected the notebook's screen direction and the near-black vessel
appearance. Previous checks proved world-axis ordering and material values,
not the requested screen relationship or readable clear-glass construction.
Replace that closure approach within compose-office: preserve the coffee's
approved position above-right of sugar, put the notebook above-left of coffee
in the initial camera, and review the transparent shell, lip, base and liquid
together. Keep dark Americano contents distinct from the colorless vessel.
Scope: discussion tableware/placement, their formal tests, existing hardware
review and specification only. Reuse current Asyra alpha/material/mesh support;
no renderer changes, painted highlights, extra overlay geometry or refraction
claims. Tests must fail first for screen ordering and near-opaque liquid; then
verify clear regions, tabletop clearance, retained spoon/lid, native initial
and close camera evidence. Completion requires visual inspection, not only
passing alpha assertions. This replaces the prior 22 mm world-Y placement
constraint. Self-review confirms no room, plant, sugar or camera mutation.

Result: notebook +[-0.16,0.06] passes the actual initial-camera left/above
projection while coffee stays +[0.02,-0.06]. The glass keeps its existing
geometry and separate clear regions. Dark-brown coffee uses a translucent
side/base and a separately shaded real liquid surface without overlapping
caps. Formal regressions were red first; 60 scoped tests, Office lint/typecheck
and naming now pass. The hardware room case passes. Native close-up inspection
confirms the notebook direction, clear upper vessel and visible liquid level;
the material remains alpha-based rather than physically refractive glass.
Evidence: apps/asyra-office/test-results/discussion-clear-glass-final/.
No commit, push, room changes or camera changes.

### Owner-selected tapered coffee tumbler - 2026-10-29

Compose-office asset-only replacement: use the owner's new clear tumbler photo
for the Americano vessel. Infer a 90 mm mouth, 105 mm height, 64 mm lower body
and 14 mm thick rounded glass base; these are construction defaults, not
measured product dimensions. Retain dark Americano and the approved table
position, notebook, sugar and silver spoon. Reuse existing lathe and alpha
material contracts. Scope: tableware geometry, tests, reference image and
current specifications; no room, camera or renderer changes. Validate the
taper, thick base, lip continuity, liquid containment and actual app view.

Validation: the new dimension oracle failed against the previous 76 mm rim
before implementation. All 61 focused tests, app lint/typecheck, naming checks
and the hardware discussion review now pass. Inspected the native tabletop
crop and closer scene capture: the taper, clear headspace and thick base are
visible, and the notebook/coffee/sugar placement is preserved. This closes the
shape replacement, not photographic glass/refraction equivalence. Evidence:
`apps/asyra-office/test-results/discussion-tapered-glass/`. No commit or push.

### Iced Americano contents - 2026-10-29

Step: compose-office, existing discussion tableware construction. Replace only
the drink contents from the owner's iced-coffee photo: warm brown translucent
liquid at 96 mm, five irregular floating ice cubes and two submerged cubes.
Keep the approved 90 x 105 mm tumbler, table pose and every other furnishing.
Reuse existing lathe, rounded box, solid subtraction and alpha/environment
material contracts. Separate actual liquid and ice boundaries; no photo texture,
painted highlights, emission or renderer changes. Photo refraction/absorption
is not claimed. Mutation scope: recipe, direct regression tests, reference,
spec and this plan. Gates: geometry/liquid containment and placement tests, app
lint/typecheck, naming and live hardware discussion capture with inspection.
Stop when those checks and bounded visual review are complete; no push.

Validation: the new fill-height oracle failed on the prior 75 mm fill, and the
ice opacity oracle rejected the first overly white iteration (0.62). Final
ice opacity is 0.24. All 62 focused tests, app lint/typecheck, naming and live
hardware discussion review pass. Inspected the native tabletop crop and
overhead capture from APP_URL=http://127.0.0.1:5194/. Ice, fill height and unchanged
table placement are visible. The side liquid still lacks photographic optical
absorption and refraction; do not report full reference appearance parity.
Evidence: apps/asyra-office/test-results/discussion-iced-coffee-final/.
No commit or push.

### Coffee transparency correction - 2026-10-29

Revised bounded plan after rejected optical appearance. Owner: compose-office
asset construction and its existing preview, using the same public spatial
material contract. Preserve cup shape, ice poses, table pose and other assets.
First incorrect boundary: every CSG cut surface inherited the outer coffee
alpha, including interfaces with ice. Wall alpha also accumulates through four
glass surfaces; duplicating liquid vertices destroyed smooth surface normals.
Retain CSG face provenance, assign an explicit index-matched liquid/ice interface
with zero alpha, retain indexed vertices within each material region, and set
exterior alpha from complete-path transparency bounds rather than one surface.
This is still alpha-based approximation, not physical refraction/absorption.
Scope: tableware, solid-subtraction triangle provenance, production-factory
preview, direct unit/E2E tests, current spec/release note. No framework/shader,
room, placement, light, other-asset or dependency changes. Gates: failing
provenance/accumulated-alpha/shared-vertex tests first; focused scene/CSG/preview
tests, app lint/typecheck/naming, live full-scene and single-cup front/side/top
microscope captures. Do not claim full photo parity if optical differences remain.

#### Optical-material owner revision

The rejected microscope proves alpha-only blending cannot meet the requested
coffee appearance. The owner's instruction to adjust after the proposed
material-capability repair authorizes this necessary render-spatial segment.
Replace the earlier no-framework implementation assumption with an opt-in
neutral optics descriptor (transmission, ior, thickness, attenuation colour and
distance). Input: admitted spatial mesh. Output: physical transmissive material
through the existing provider. Owner/contributor: Preset; public descriptor:
render-engine. No renderer canonical writes, app-specific shader or custom
render loop. Validate immutable numeric admission, material updates and default
behaviour before the compose-office consumer adopts it. Same shape/pose, alpha
materials elsewhere unchanged. Tests: admission, engine lifecycle/material
reuse, app batching isolation, same-source microscope and scene captures.
Screen-space transmission remains an approximation, especially nested media.

#### Nested-media visual review revision

The live microscope rejected fully transmissive nested shells: the outer glass
samples the opaque background instead of the inner coffee, and DoubleSide
transmission repeatedly applies the liquid absorption on back faces. The next
bounded render-spatial correction uses front faces for opted-in closed optical
volumes, with regression coverage for returning to the ordinary double-sided
path when optics is removed. The compose-office consumer retains low-alpha
reflective glass/ice and uses physical absorption only for liquid. This is an
explicit hybrid realtime material, not physically complete nested refraction.
No new scene objects, lights, camera offsets or photograph textures are allowed.
Keep existing shape and placement oracles; change material oracles to assert
complete glass-path visibility, separate liquid attenuation, and independent
unbatched optical surfaces. Run admission/material lifecycle, source geometry,
preview and live microscope checks. If the visual still differs, report that
remaining limit rather than claiming reference parity. This replaces the prior
assumption that every nested region can use screen-space transmission.


Optical coverage revision: alpha coverage may coexist with optics; admission
retains its existing 0..1 validation independently of transmission. Added a
failing admission case before removing the erroneous opacity-one restriction.
The final hybrid candidate preserves the glass and visible ice, but microscope
review still rejects the cloudy coffee and incomplete refractive cues. Keep
visual acceptance open; numerical tests and screenshots do not override this
finding. Live server was restarted with project ownership verified; successor
PID 57266 serves the same APP_URL. No commit or push in this task.


Validation checkpoint: 60 shared rendering/admission/resource tests and 42
focused Office source/preview/batching tests pass. App lint/typecheck, naming,
render-engine/Preset builds and two hardware-browser screenshot scenarios pass.
Inspected full-scene tabletop plus native 2884 x 1680 cup captures. These gates
verify geometry, forwarding and runtime safety only; visual acceptance remains
FAILED for cloudy liquid and incomplete ice refraction. Final candidate evidence:
apps/asyra-office/test-results/discussion-hybrid-optics/. No photographic
appearance completion claim is permitted from these passing mechanical gates.

### Layered transmission correction - 2026-10-29

Supersedes the failed hybrid candidate above. The approved research follow-up
keeps the tumbler geometry and table placement, and repairs the first incorrect
render-spatial boundary: screen-space capture omitted nested transparent contents.
Reuse Three.js PhysicalMaterial and its transmission shader chunks; Preset owns
optional ordered capture layers, with no dependency, app-specific shader, extra
animation loop or baked photograph. This is ordered screen-space approximation,
not recursive multi-medium path tracing.

Step execution card - render-spatial (Inspector step 12; implementation Foundation):
inputs remain admitted preview/spatial meshes. Optional optics.captureLayer is a
nonnegative integer; increasing layers represent enclosing media. Each layer
captures ordinary scene objects and completed lower optical layers, excluding
its own layer. Higher enclosing layers contribute back faces sampled through the
native opaque background, without reading unfinished custom targets. Same-layer
peers do not refract each other. Outputs remain visible
Office through the same Core provider. Preset alone owns capture targets, shader
binding and teardown; render-engine owns the neutral descriptor. Non-opted-in
materials retain native behavior. No canonical writes, new clock, app identities,
scene recoloring or camera workaround. Scope: these spatial owner files and their
direct tests, current public/spec/Inspector documentation. Tests prove admission,
ordered visibility, one capture per distinct active layer per flush, target reuse
and resize, current uniforms, state restoration on error, removal and disposal.
No retained scene-result cache: every requested flush recaptures current content.

Then compose-office consumes the proven descriptor for clear glass, coffee and
ice at full coverage. Existing shape, layout, liquid/ice contacts and non-coffee
assets remain fixed. Formal geometry/material tests precede the consumer change.
Final gates: naming, shared focused tests/builds, app focused tests/typecheck/lint,
and live hardware microscope plus actual tabletop captures. Inspect empty glass,
liquid and ice separately and together. Remaining visual mismatch blocks visual
completion, even with passing tests. No push or dependency installation.

Design review: the layer order removes the capture feedback cycle; capture textures
are linear and tone mapping occurs only on final output. Reuse native absorption
and refraction math, not a new optical model. The cost is proportional to active
layers, not the number of ice pieces. Missing capture-capable driver fails explicitly.

Step execution card - compose-office: consumes the existing tableware factory
and admitted optics from render-spatial; produces the same scene parts at the
approved placement. Scope: discussion-tableware, direct geometry/material tests,
production-factory preview controls, discussion E2E and current specs. No room,
plant, sugar, notebook, camera, lighting or dependency mutation. The shared
57-case focused gate passes. Five strengthened consumer regressions fail on the
old alpha candidate before this change. Require full-coverage optical glass,
liquid and ice, preserved physical contacts and live multi-angle visual review.

Visual iteration - enclosing media: the first live capture exposed white ice
because its background omitted the surrounding liquid. Reopen only render-spatial
capture composition: include higher-layer back faces using native sampling;
restore material sides and sampler selection even on failure. Retain one capture
per layer and the existing asset geometry. Strengthen the visibility and failure
oracles before implementation, then repeat the same microscope and room views.

Capture depth correction: enclosing back faces must render outermost first with
depth writes disabled, before completed inner contents. Otherwise a near inner
glass wall occludes those contents. Preserve and restore original material depth
writes and mesh order, including failure paths. The new depth/order regression
fails on the prior candidate before the owner correction.

Review checkpoint - not visually accepted: live room capture confirms tabletop
visibility through the glass base/wall. The five-view production-factory capture
still shows excessive dark absorption around submerged ice and does not match
the owner reference. The visibility and depth/order tests now detect the two
capture defects corrected above; they do not prove physically correct nested
transport. Stop parameter-only patching. The next optical iteration must address
medium-path absorption ownership before changing colors, geometry or approving
this asset. No visual completion or remote push is authorized by test success.

Final checkpoint: targeted shared tests (58), app tableware/preview tests (35),
and the additional upward-winding regression pass. Naming, scoped ESLint, app
typecheck, Preset build and app production build pass. The live five-view review
also exposes an incorrect pale top surface; upward source winding passes, so
do not reverse faces or mask this with another cap. Empty/liquid-only isolation
and physically consistent nested absorption remain unfinished. No commit or push.

Bounded visual replan - surface glare: GPU draw inspection confirms the actual
liquid-surface shader receives transmission 1, thickness 0.075 m and the intended
attenuation; the source upward-winding test also passes. The next compose-office
slice isolates the excessive studio reflection contribution on the planar top.
Add an actual top-view centre-pixel brown-versus-white regression before reducing
the asset's environment reflection intensity. Keep Core/Preset, geometry, camera,
lighting and body absorption fixed. This does not resolve nested path absorption
and cannot authorize overall visual acceptance. The GPU probe is read-only and
retained as a formal E2E diagnostic, not an alternate rendered product.

#### Surface glare result - incomplete visual acceptance

The actual GPU probe confirmed native optical uniforms and upward surface
winding. The top-view regression failed on the previous surface reflection
intensity (red 230 versus blue 221), then passed after reducing only surface
environment intensity from 0.60 to 0.08. All five production-asset views were
captured and inspected. The pale disc is corrected, but submerged ice still
produces dark blocks and exposed ice looks brown rather than clear. This is
not a visually accepted asset and no commit or push closes this work.

Evidence: `apps/asyra-office/test-results/discussion-top-glare-correction/`.
The permanent read-only WebGL probe records optical uniforms and the top-view
centre pixel in E2E artifacts. This narrow colour regression does not establish
shape or full material fidelity. A further bounded rendering design is needed
to account for medium path lengths without counting enclosing coffee absorption
twice; repeated opacity, colour or geometry adjustments are not a solution.

### Owner correction - floating ice and dark Americano

Task contract: correct all seven ice solids to straddle the liquid plane and
replace the red-orange default absorption with dark coffee brown. Preserve the
approved tumbler, fill level, table placement, glass optics and other furnishings.
Owner: `construct-asset`, using the existing asset factory, mesh transforms and
optical material descriptor; `compose-office` continues consuming the same asset.
No shared renderer edits, new dependencies, commits or pushes in this slice.

Step execution card: inputs are the owner's latest screenshot and explicit
correction; output is the existing named asset regions with corrected ice poses
and default liquid attenuation. Preconditions: source bounds prove every ice
solid crosses Z=96 mm and remains within the glass; paired convex solids must
not overlap. Regression gates cover floating placement and dark neutral-brown
absorption before production edits, then focused source tests, app type/lint and
the maintained live-browser coffee/tabletop review. Inspect all five coffee views
plus the actual tabletop. Nested-media artifacts remain separately unapproved;
this bounded correction must not claim to solve them by darkening the drink.

The source regressions caught both buried cubes and the red-orange absorption.
The first floating layout failed convex separation for ice 0/6; moving the
outer cube 2 mm outwards preserves glass clearance and makes all pairs disjoint.
The darker coffee exposed excessive grey studio reflection on the liquid top:
the existing live top-colour regression failed (R=108, B=98). Reduce only the
liquid-surface environment contribution to 0.005; glass and ice reflection
settings remain unchanged. Retain the same regression and inspect the result.

Validation: 38 focused source tests, two live-browser review cases, app
typecheck, scoped ESLint and the 15-case naming gate pass. Five production
coffee views and the actual room tabletop were inspected at full screenshot
resolution. The lower floating-ice placement error and red-orange default are
corrected. Ice still has excessive dark optical regions immediately below the
surface; overall coffee visual approval remains open. Runtime review uses
http://127.0.0.1:5194/ and the same `americanoGlass` factory for room and asset
views. Screenshots: `apps/asyra-office/test-results/discussion-floating-final/`.

### Sugar ceramic surface continuity - 2026-10-29

Bounded correction: remove triangulation-induced shading on the sugar vessel,
leaning lid and knob. Preserve the profile, spoon opening, lid contact, sugar,
materials, transforms and unrelated assets. No lighting or coffee changes.
Current CSG introduces polygon-centre vertices; recomputed normals make those
centres flat while boundary vertices are smooth, producing star-shaped facets.

Step card - render-spatial (12): admit optional finite unit vertex normals on
neutral triangle shapes, detach/freeze/compare them, and upload them unchanged.
Meshes without authored normals keep ordinary geometry-normal computation.
Scope: render-engine spatial type, Preset spatial admission/geometry and tests.
Step card - construct-asset: smooth lathe normals follow profile tangents; CSG
interpolates source normals and preserves sharp cutter faces. Transform normals
with inverse scale and rotation. Scope: Office geometry, subtraction, tableware.
Step card - compose-office/preview-asset: preserve normals through existing
batching and preview the same sugar factory. No alternate review geometry.
Gates: first failing admission/renderer and source-continuity regression tests,
focused tests, naming, scoped lint/typecheck and hardware live-app closeups of
body, rim, knob, lid and spoon notch. Update implementation contracts. Stop when
these bounded defects pass; do not expand to other rendering defects or push.

Validation: the original code failed authored-normal admission/upload and all
three source-continuity regressions. The correction passes 60 focused Preset
checks and 48 Office checks, renderer/Preset builds, Office typecheck, scoped
ESLint and naming (15 checks). Two hardware E2E cases passed on
http://127.0.0.1:5194/ (owned Vite PID 75049): room context and the production
sugar factory at Front, Right, Top, Three-quarter and Cap detail. Evidence is in
`apps/asyra-office/test-results/sugar-surface-review/`. Inspected the five asset
views plus the room tabletop screenshot: the reported ceramic starbursts and
triangular shading are gone; the sharp spoon opening and leaning lid remain.
The existing piecewise profile silhouette is unchanged. This review does not
approve unrelated coffee optics or the entire Office scene. No commit or push.

### Full-scene keyboard navigation latency - 2026-10-29

Bounded task: diagnose and correct held-key camera lag in the full furnished
scene, preserving geometry, materials, transparency, resolution and placement.
Association: office-rebuild-plan; compose-office camera handoff to render-spatial
(step 12) remains authoritative. Discovery is limited to keyboard/camera submit,
spatial flush, optical capture, shadow and bloom passes, and their direct tests.
First collect live hardware frame intervals, draw/triangle counts and CPU samples
using the same full-scene route. Add a permanent failing owner work-count test
before changing implementation. Any retained work must identify dependencies,
invalidation and disposal. Scope permits those rendering owners, direct tests,
review instrumentation and corresponding contract/docs; no unrelated asset,
input behavior, package/dependency or scene-content changes. Stop after focused
correctness/work-count tests and a same-scenario before/after measurement with
visual preservation; do not claim portable FPS or push.

Step execution card - render-spatial (12): consume the admitted preview/office
scene after projection and instance-detail updates. Share completed Three shadow
maps between optical captures and the final scene only while the camera, scene,
visible caster identities and caster material sides are unchanged. Geometry,
transforms, lights and instance partitions are frozen for this synchronous flush;
no state survives into the next flush. Optical capture changes visibility and
material sides, so these are checked before each pass, including descendants.
A changed caster configuration must render its own shadows. Explicit dirty
requests, disabled shadows and manual shadow scheduling retain Three semantics.
Allowed contributor/boundary: Preset spatial renderer and capture orchestration;
forbid app-specific shading, lower resolution/detail, or extra animation loops.
Spec: implementation.md Foundation / Ordered optical capture. Failure owner:
render-spatial. Gates: failing engine work-count regression, shadow signature
changes and error restoration tests, focused capture/bloom/engine tests, naming,
lint/build, and hardware navigation/visual comparison. Stop at this bounded owner
correction before considering any further measured bottleneck.

Step execution card - render-spatial / stable optical materials: same inputs,
outputs, boundary and exclusions as above. The first shadow correction reduced
GPU submissions from 1111 to 916 and triangles from 107.6M to 83.6M per frame,
but median/p95 intervals remain 33.3/50ms on this hardware. CPU profiling also
shows repeated material-program preparation. Retain one enclosing back-face
material per active source physical material, synchronize values from the source,
share the same optical uniforms, and invalidate its program only on source
program changes. Preserve source side/depth-write and all capture ordering.
Release on source removal, capture removal or teardown. First prove the current
source material version churn with a formal test, then verify value updates,
identity reuse, disposal and hardware visual parity.

Bounded iteration replan - render-spatial: stable material variants also leave
median/p95 at 33.4/50ms, with about 83.4M submitted triangles. These corrections
do not resolve the primary whole-scene redraw cost. Reuse the opaque scene's
linear color and depth within one flush: render it once at unchanged resolution
and MSAA, then replay its color/depth through a full-screen render pass for
ordered captures, native transmission backgrounds and final scene rendering.
Continue drawing real transparent/transmissive meshes with native material math.
The opaque pass contains all shadow casters; if a translucent object casts
shadows, use the existing individual passes because their shadow inputs differ.
No replacement asset geometry or lower-quality LoD is permitted. The replay
quad is a renderer-owned framebuffer operation, not scene/model content.
Retained allocation: resize-aware color/depth target plus replay material; output
valid only within this flush/camera. Restore source materials, background, target,
auto-clear, tone mapping and shadow flags on error; dispose at engine teardown.
Formal regression: each ordinary opaque mesh reaches scene drawing once per
flush instead of every optical pass. Gates include source material/geometry
preservation, mixed parent/child visibility, shadow eligibility, state restoration,
resize/disposal, and fixed-camera hardware screenshot comparison before/after.

Validation - full-scene navigation: the new source-work oracle failed with four
opaque scene submissions per flush before the shared framebuffer, then passed
with one. Focused renderer/capture/bloom/state/lifecycle tests: 50 passed. Naming,
scoped ESLint, Preset build and Office typecheck passed. Hardware E2E scope:
`e2e/navigation-performance.spec.ts` plus the discussion reference review case
in `e2e/discussion.spec.ts`, using APP_URL http://127.0.0.1:5194/. Both passed.
The live owned Vite listener is PID 80564. No commit or push.

Apple M3 Max / Chrome, 1800x1200 viewport, DPR 2, same full-scene zoom and held-D
scenario (35 sampled moving intervals): baseline median/p95 33.3/50ms; final
16.7/33.4ms. Indexed GPU submissions median 1111 to 367; submitted triangles
107553453 to 27618127. These are local measurements, not portable FPS gates.
Slow frames remain; this does not claim zero dropped frames. Permanent diagnostic
coverage records timing and work without a hardware-independent time threshold.
Evidence: `apps/asyra-office/test-results/navigation-baseline/`,
`navigation-optical-before/`, and `navigation-opaque-candidate/`.

Inspected matched initial overview and tabletop closeup screenshots, including
coffee/glass, occlusion, plant shapes and cast shadows. No obvious appearance or
placement regression was found. Whole-image mean channel differences are below
0.41/255 (overview) and 0.13/255 (tabletop); HDR framebuffer quantization and
edge sampling are not bit-identical. These checks preserve the existing scene;
they do not newly approve unrelated asset fidelity or existing coffee optics.

### Navigation regression recovery - 2026-10-29

The owner reports worse navigation at both overview and close range. The prior
35-interval, single-scale measurement does not establish sustained responsiveness;
discard its performance acceptance claim. Keep its raw evidence for comparison.
This iteration stays in render-spatial (12), its direct camera caller, formal
navigation/capture/engine tests and these contracts. Preserve all asset geometry,
resolution, appearance, keyboard semantics and approved placement; no commit or
push. Do not change unrelated dirty files or reduce scene quality.

Step execution card: consume the same admitted scene/camera, produce the same
visible Office. First record sustained overview and close-range round trips,
including all animation intervals rather than only intervals with draw calls.
Remove the new opaque full-screen replay stage: ordinary native transmission
must not incur a second engine-owned color/depth render. Prove this with a failing
engine regression before changing production code. Keep independent shadow and
stable-material corrections only if same-source measurements support them.
Inspect optical capture visibility as a direct consumer: captures for entirely
offscreen recipients must not force scene redraws. Any further correction needs
its own failing work/correctness oracle and explicit input lifetime.

Allowed files: Preset spatial renderer/capture helpers and their tests, Office
navigation E2E, existing implementation/package docs and render-spatial contract.
Failure owner: render-spatial. No asset mutation, framebuffer quality reduction,
app-specific optical workaround or extra production animation loop. Gates:
focused tests, naming/lint, Preset build, Office typecheck, sustained far/near
hardware runs and matched live scene review. Stop at bounded recovery and report
remaining stalls honestly; FPS/count reductions alone do not prove user acceptance.

Step execution card - render-spatial / optical capture admission: the formal
regressions fail because moving all three recipients outside the camera still
submits three captures, and excluded camera layers still submit one. Before
capturing, update world matrices and use the native camera frustum, material
visibility, camera layers and frustum-culling opt-out to select recipient ranks.
Retain allocated targets while their ranks remain in the scene, avoiding churn
when panning away and back. Recompute admission each flush; never reuse captured
pixels across camera movement. Parent transforms and camera return must refresh
correct captures. No opaque replay, quality reduction or asset change. Existing
ordered contents, back faces, shader bindings and failure cleanup remain intact.
Gates add offscreen/return, parent motion, camera layers, material visibility and
culling opt-out to the focused tests. The native-transmission regression failed
with three engine draws instead of two, then passed after removing opaque replay.

Recovery evidence: 45 focused renderer tests and four hardware navigation/visual
E2E cases pass. Scoped ESLint, Office typecheck, Preset build and the Inspector
contract pass. Final evidence lives in
`apps/asyra-office/test-results/navigation-recovery-final/`.

On Apple M3 Max / Chrome at 1800x1200 and DPR 2, four 1.25-second directional
segments produce mean/p95 intervals of 35.21/50.1ms (overview), 21.69/33.4ms
(room) and 16.67/16.7ms (close). All sampled intervals are retained. The close
case is zoom 12; zoom 6 still includes several rooms and must not be described
as a tabletop closeup. This is a diagnostic measurement, not user acceptance.

Opaque replay removal alone did not improve overview performance: the preceding
replay-enabled overview measured 23.57ms mean. Do not claim the rollback is a
complete performance fix or that its removal proves the reported root cause.
The proven correction is camera admission: offscreen recipients no longer cause
three unnecessary scene captures; parent movement, layers, visibility and return
are covered by regression tests. Full-scene stalls remain unresolved.

Matched tabletop screenshots were inspected against the pre-replay evidence:
no visible placement, geometry or material change was found. Live IAB screenshot
verification could not finish because the browser connector failed to bind the
existing tab. The existing app URL still serves from owned Vite PID 96061; the
server remains running. No commit or push.

### Sustained navigation replan - 2026-10-29

User rejects the recovery: all viewing distances still feel unsmooth. The
previous rollback is not performance acceptance. Scope remains render-spatial
(12), its camera/instance-detail callers, permanent tests and direct documents.
Preserve scene geometry, resolution, material appearance and movement semantics.
No commit or push. Fixed discovery: sample sustained navigation CPU stacks and
GPU submissions; trace only the dominant renderer/update owners and their native
Three implementation. First isolate repeated work, then add a failing work-count
and correctness regression before changing the canonical owner. Validate the
same overview/room/close routes and matched optical screenshots; preserve the
live server. Do not substitute pass counts or 60Hz-limited sampling for proof of
user smoothness.

Step 12 execution card: input admitted scene/camera, output equivalent visible
Office; Preset owns render stages and derived geometry, Core owns input updates.
No app-specific optical output, extra animation loop or quality reduction.
Existing native optical ordering, camera admission and resource lifetime remain
required. Profiling is opt-in in the existing navigation test so it does not
contaminate unprofiled comparisons. Gates: focused red/green regressions, naming,
lint/typecheck/build, sustained hardware navigation and optical visual review.
Self-review: the former rollback alone regressed overview timings, so this
iteration must establish a causal work reduction before making a speed claim.

Step 12 refinement after profiling: CPU samples spend most elapsed time idle;
repeated opaque scene submissions dominate the remaining GPU workload. The
source inspection confirms native transmission redraws opaque content inside
each ordered capture. Use a lazy same-flush opaque color/depth prepass only for
multiple admitted capture layers. Ordinary transmission and scenes with optical
shadow casters stay native because their shadow inputs differ. Preserve full
resolution, MSAA, linear HDR and exact depth, then apply output conversion in
the consumer pass. Prepass shadows remain valid only while non-opaque objects
do not cast shadows. Restore all source materials, renderer flags and targets
on failure; remove the replay mesh before bloom/overlays. No cross-frame pixel
reuse. This replaces the blanket rollback approach; native-only scenes must
still incur no additional target. Formal tests must prove opaque work once,
native bypass, correct lifecycle/resize and error restoration before production
edits. The plan and render-spatial contract allow this bounded renderer repair;
visual equivalence and sustained frame measurements decide acceptance.

Measured outcome of the bounded same-flush repair: on the current live panel's
468 x 675 CSS viewport at DPR 2, sustained overview navigation changed from
19.61 ms mean / 33.4 ms p95 to 16.78 ms mean / 16.8 ms p95. Room navigation
changed from 20.33 / 33.4 ms to 16.78 / 16.7 ms. Close navigation remains
approximately 16.67 ms. Overview median indexed triangles submitted across all
passes fell from 87.37 million to 27.00 million; these are cumulative submissions,
not unique scene geometry. Measurements are refresh-rate limited and are not
proof of smoothness on every display.

At 1800 x 1200 CSS pixels, overview improved from 35.21 ms mean / 50.1 ms p95
to 25.95 / 33.4 ms. This is still above a 60 Hz frame budget and remains an open
performance limitation. Do not mark all-view navigation performance complete.
Evidence: `navigation-panel-baseline`, `navigation-opaque-panel`, and
`navigation-opaque-wide` under the app's ignored `test-results` directory.
The four focused renderer suites pass 49 tests; naming, scoped lint, Preset
build, Office typecheck and the Inspector check pass. Seven browser cases pass
across the two new runs, including the tabletop visual review. Matched tabletop
images and the actual live overview were inspected without an observed geometry
or material change. The IAB connector was recovered, the existing app reloaded,
and held-key movement exercised there before restoring Overview. Vite PID 96061
remains serving port 5194 for user inspection. No commit or push.

### Owner-requested push checkpoint - 2026-10-29

Scope: publish the accumulated discussion-room assets, authored surface normals,
ordered optical rendering and measured same-flush work reduction, with their
tests, references and public guidance. Original source is `f2d78c5a7`; fetched
main remains included, so no rebase is necessary. This checkpoint does not close
whole-scene visual acceptance or large-viewport navigation performance.

Local validation: Office's full run passed 333 tests and exposed two stale test
assumptions. Limit the street canopy assertion to the six street-tree assemblies
so newly admitted indoor conifers are not counted as street leaves. Keep the
tabletop construction-count test on the real scene composition but stub unrelated
expensive optical solids, whose geometry and rendering have independent tests.
The original 10-second timeout stays unchanged. Both corrected files pass all
8 tests; unchanged Office files retain their full-run results. Preset passes
408 tests, Render Engine passes 11 tests and its type contract, and the four
discussion hardware browser cases pass. Preset/Render Engine/Office builds,
scoped ESLint, naming, Inspector and document checks pass. Refresh generated
public indexes and the Inspector workspace bundle; include the pending optical
and authored-normal adoption guidance and package Changeset. The app server
remains running. Commit-dependent checks and remote status follow publication.

### Work room reference correction - 2026-10-29

Bounded task: review the lower-left room against the owner-provided crop,
correct its thin green-divider cap and regular furnishings, and update the
room contract. Preserve the approved envelope, other rooms, exterior, camera,
render settings and deferred Blender occupants/upholstery. No push. Discovery
is limited to this room, its direct asset factories, specs and formal tests.

Step card - construct-asset (Inspector step 1): approved dimensions and
appearance enter the wall factory; named body/cap geometry leaves it. Add an
explicit physical cap-height option with full-height body/cap continuity and
matching near/distant geometry. Only Office assets contribute; no renderer
writes, patch overlays or caches. Boundary: assets/wall.ts and its test.
Failure owner: construct-asset; spec: implementation.md, Asset construction
boundary. Gate: fail-first cap-height/continuity tests, existing wall tests,
naming and type checks. Stop if another asset's default would change.

Next segment - compose-office (Inspector step 11): consume completed assets
and owner-approved room layout. Only room furnishings, green-wall cap input,
room reference data and tests may change. Preserve unrelated assembly output.
Cases: white confined to a thin top, two upper/three middle shelf plants, varied
book spines, desk/side-table reference relationships, grounded pots and stool.
Gates: focused geometry/furnishing tests, lint/build, hardware work-room E2E,
and inspection of overall and detail screenshots. Tests alone do not establish
visual acceptance. Stop at the bounded room review; report deferred assets.

Validation outcome: the initial cap and shelf inventory/poster assertions failed
on the original implementation. Wall construction now passes 11 tests and
approved structure passes 18. The room suite passes 33 after a microscope
review found middle-shelf foliage crossing the upper shelf: a failing clearance
oracle was added first, then the room selected shorter plants and moved pot
centres outward within the shelf footprint. The scene budget/preservation suite
passed 13 tests; naming passed 15. Work-room hardware E2E passed and its
1800 x 1200, DPR 2 canvas/close-up outputs were inspected. The green cap has a
continuous seam; the five shelf plants clear the wall and upper shelf. This
does not claim full reference equivalence: actor, cat and desk chair remain
deferred, and the low-resolution source leaves hidden geometry uncertain.

### Work-room square floor planter - 2026-10-29

Bounded correction: only the west-wall floor plant, its reusable asset recipe,
room assembly and direct tests/docs. The owner's enlarged crop supersedes the
round generic pot: square tapered terracotta vessel, open soil surface, broad
long leaves with upright inner growth and outward-arching outer growth.
Preserve its location, all other plants, furnishings, structures and rendering.
The obscured pot bottom and exact leaf count are reconstruction assumptions.
No push. Stop after focused geometry, scene-budget, lint/build and actual-app
close-up inspection; do not claim approval on the owner's behalf.

Step card - construct-asset: Inspector step 1 consumes the plant specification,
seed and appearance; emits named pot/soil/stem/leaves through the existing Office
plant geometry owner. Reuse the closed-leaf builder and vessel topology, add a
rounded-square vessel section and a distinct growth recipe. No renderer writes,
external dependencies or new per-frame work. First prove the current scene's
pot fails a square-corner/dimension oracle; then validate cavity and leaf form.
Step card - compose-office: Inspector step 11 selects this recipe only for
work-floor-plant at its existing floor position. Validate wall clearance and
preserve other assembly output. Specs and visual evidence accompany this slice.

Validation: the original 0.182 m round vessel failed the new 0.32 m square-pot
oracle. The corrected plant passes the square-corner, cavity, broad-blade tier,
wall-clearance and nondegenerate-triangle checks. Plant and furnishing suites
passed all 48 assertions; the combined 61-test run also passed its assertions
but reported a Vitest worker RPC timeout, so it is not recorded as a clean full
run. A bounded rerun of the three affected geometry/composition/budget cases
passed without worker errors. Build, lint and naming passed; the build retains
its existing large-chunk warning. Hardware E2E on APP_URL port 5194 passed;
its overhead, oblique and native-resolution plant crop were inspected. The
square vessel and tall/arching foliage are visible in production lighting.
This is a review candidate, not a claim of pixel-identical source reconstruction.

### Five work-shelf plants - 2026-10-29

Bounded task: preserve all five accepted shelf anchors and shelf geometry;
correct only their vessels and foliage against the owner's enlarged crop.
Three ivory vessels (upper left, middle left/right) and two identically colored
terracotta vessels (upper right, middle centre) must have smooth straight
cylindrical walls, rounded lips/bases and real open cavities. Upper-left broad
upright foliage, taller arching upper-right foliage, low middle-left rosette,
and small upright middle-centre/right growth are distinct recipes. Exact hidden
leaf counts and metric dimensions are reconstruction assumptions.

Step card - construct-asset: Inspector step 1 consumes the plant recipe and
appearance, emits named closed meshes. Extend the existing plant recipe owner
and reuse the closed blade and rounded hollow-vessel builders. No renderer,
lighting, performance-policy or unrelated asset changes. First prove a formal
cylinder-wall oracle fails on current tapered pots; then test smooth contours,
cavity, distinct foliage and valid geometry. Boundary: plant asset/spec/tests.
Step card - compose-office: Inspector step 11 selects those recipes at the
accepted five anchors; preserve all other room/exterior assemblies. Gates:
focused plant/room tests, scene mesh budget, naming, lint/type/build, live
work-shelf E2E and magnified image inspection. No push; stop at this review
candidate and report uncertainty rather than claiming identical hidden geometry.

Validation outcome: the original upper-left pot failed the sidewall oracle
with a 7.76 mm radius difference between quarter and three-quarter height.
All five replacement pots now pass that oracle, exact color grouping and anchor
preservation. All 50 plant/room tests pass, including real cavities, broad-leaf
tiers, nondegenerate geometry, wall and upper-shelf clearance. The focused scene
mesh-budget case passes below its unchanged 160-mesh ceiling. Build, typecheck,
lint and naming pass; build retains its existing large-chunk warning. Hardware
E2E on APP_URL port 5194 passed; normal-camera detail and lower-angle views were
inspected so the lower foliage is not judged only through shelf occlusion.
Reference and numeric defaults are retained in the small-plants spec. No push.

### Reference shelf plant redesign - 2026-10-29

The owner replaces the previous cylindrical-vessel contract with three complete
plant-and-pot designs from work-shelf-botanical-reference.png: upper-left
white-veined fittonia in a rounded embossed vessel; upper-right yellow-edged
snake plant in a fluted rounded vessel; all three lower positions use fleshy
rosette succulents in cat-face vessels. Preserve all five positions, uniform
assembly scales and the accepted three ivory/two terracotta colors. The new
reference overrides the previous shelf reference only. Exact hidden surfaces
and metric construction values remain authored reconstruction defaults.

Step card - construct-asset (Inspector step 1): consume the new botanical
specification, scale, seed and existing pot color; output named hollow vessels,
soil, leaves and details. Reuse existing Office mesh/profile helpers and Preset
surface contract. Geometry and botanical surface recipes live under assets/;
no renderer writes, additional dependencies, per-frame generation or changes to
other plant recipes. Formal cases cover cavity, flutes, embossed profile, paired
cat ears/feet/face, thick succulent leaves, patterned leaves and finite meshes.
Step card - compose-office (Inspector step 11, after asset validation): select
these assets at the accepted five anchors; register their completed surfaces in
the existing surface table. Keep shelves, structures, exterior and lighting
unchanged. Formal anchor/color and clearance cases precede implementation.
Gates: focused asset/room/surface tests, naming, lint/type/build, unchanged scene
mesh ceiling, same-live-app shelf E2E and enlarged screenshot review. No push.
Stop at the review candidate without claiming owner acceptance.

Validation: the original shelf composition failed the new botanical-material
oracle before replacement. Final asset and room suites pass 41 tests; surface
suite passes seven, and the existing scene mesh ceiling passes unchanged.
Build, lint, typecheck and 15 naming checks pass (existing large bundle warning
remains). Hardware E2E passes on APP_URL port 5194; full shelf context and the
native-resolution close-up were inspected. Review corrected faceted belly
contours and overly conical cat ears before the final capture. Color/anchor,
cavity, support-foot, shelf/wall clearance and closed-leaf checks pass. Botanical
identity, selected pot forms and pigment details are implemented; exact hidden
geometry remains reconstructed rather than claimed as photographically measured.
This is the owner review candidate. No commit or push was performed.


### CI scene-fixture correction - 2026-10-29

Bounded follow-up to the merge checkpoint on `5f3c3f3a8`: repair the Office
geometry test setup, its direct fixture helpers and validation notes; preserve
all production geometry, placement, materials, renderer settings and deadlines.
No Inspector step semantics change or new product acceptance is involved.

CI run `40891578094`, Office job `123510130431`, reproduced eight failed files:
five complete-scene setup hooks exceeded 10 seconds, and three tests exceeded
the same per-test limit. The remaining 257 assertions passed; 91 were skipped
by failed hooks. Local scene assertions pass, but that does not establish CI
setup suitability. Whole-scene setup took about 11.6-17.2 seconds in CI.

The affected file-scoped fixtures now prepare the real coffee and sugar solids
in separate bounded hooks, then assemble the complete real scene with those
outputs. Temporary spies accept only the actual default calls and are restored
in `finally`; no empty/reduced asset or cross-file cache is used. The fixture
getter retains only the current file's read-only scene. Asset factories remain
unchanged and direct asset/appearance assertions continue to call them normally.
Discussion geometry expands instances lazily for the assembly being inspected,
instead of expanding every street tree during setup. Full-scene descriptor
admission still examines every descriptor. Existing 10-second test/hook guards,
serial file execution and all assertions remain in force. The existing failing
CI cases are the regression evidence for this test-fixture repair.

Validation: run both initially affected scene suites, the complete Office suite,
Office lint/typecheck, naming, scoped repository/document checks and committed-
head admission. Push only after those pass; report exact-head CI separately.
The owner retains merge and whole-plan closeout authority.
