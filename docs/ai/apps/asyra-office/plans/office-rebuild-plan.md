# Asyra Office - Product and Experience Plan

Status: product plan approved; implementation authorized on 2026-10-25.
Stage 1 begins with one wall asset and a minimal renderer harness. Later asset
subgroups retain user visual acceptance checkpoints; no new dependencies are authorized. Product slug: `asyra-office`; display name: `Asyra Office`.

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
Animals are still required for the complete visual target. Submit one small,
coherent subgroup at a time; do not start the next unapproved subgroup merely
because its files can be generated quickly.

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
