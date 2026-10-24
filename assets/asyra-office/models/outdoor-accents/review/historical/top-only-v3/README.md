# Group 4J - Outdoor Accent Review

Status: revised bench TOP and specifications await user approval. The separate
entry chalkboard retains its earlier approval. No model acceptance is implied.

1. [Current bench sheet](01-park-bench-v3.png) - [original reference](01-park-bench-v1.png).
2. [Entry chalkboard](02-entry-chalkboard-v1.png) - unchanged.

## Current method

Copy FRONT, RIGHT, BACK and THREE-QUARTER from original v1 at uniform 1.7x.
Remove only the old oblique label in its white margin. TOP is replaced with a
shared-coordinate projection of the current specification. Seat, arms, rear
posts and back boards share a single transform and depth buffer. Sample wood
from original seat faces; preserve the dark metal style and add no lighting.

```sh
python3 compose-bench-reference.py
```

The source calls `bench-top-projection.py`, then reopens the saved 3072 x 2048
PNG. Four original-crop rectangles must match their expected resampling exactly.
The [report](bench-reference-layout.json) records hashes, crop coordinates,
TOP transform, visible groups, source width ratios, rear inset, outer-post wood
clearance, six back/post witnesses, sixteen seat/frame witnesses, arm metal
attachments and fourteen whole-arm/wood exclusion bounds. TOP must contain visible surfaces of four seat boards, three back
boards and metal, with no clipped geometry.

The source illustrations are not calibrated orthographic measurements. TOP
now follows numeric construction; the four preserved pictures remain appearance
references. Do not equate copied pixels with five-view geometric consistency
or future production mesh acceptance.

## Revision findings and acceptance boundary

The previous TOP failed because added back strips missed the rear posts and
the retained arms did not show the specified rear inset. The previous numeric
checks did not detect these visual contradictions. That acceptance is withdrawn.
The revised source removes independent TOP placement entirely.

- Restore the committed 730 mm height; withdraw the unsupported 700 mm change.
- Use a 15-degree authored lean, guided by the approximately 14.77-degree RIGHT
  post slope. Source landmarks and equations are in the geometry supplement.
- TOP back-board ends must extend 27.5 mm outside each rear post, while
  preserving contact. Rear inset is 92.5 mm per side. Supports/crossrails share
  those axes; arms return behind the boards to the rear side of the posts.
- Both entire arms must clear all seven wooden boards by at least 2 mm while
  remaining connected to the front and rear metal frame.
- Four copied object views must preserve original appearance exactly after resizing.
- User approval remains required before commit; no Blender or app output is included.

Rejected numeric v2 remains under `historical/rejected-bench-v2/` for the final
historical-file audit only. It is not a current reference or runnable generator.

## Lighting

Earlier lighting-only revisions remain in v1; see the shared
[lighting review](../../SHADOW-FREE-REVIEW.md). Source shading is illustrative;
never bake it, sheet backgrounds or labels into production textures. The TOP
renderer adds no lighting. Materials and colours remain replaceable.

## Bounded revision plan - arm route and exclusion clearance

The previous pass claim is withdrawn: rear spacing was corrected, but the arm
centreline crossed the lower back board. Freeze the accepted board dimensions,
rear axes, supports, crossrails, default appearance and four original views.
Scope is the arm construction, its TOP projection and direct bench documents.

Replace the single inward cubic with tangent-continuous segments: rise from
the front leg, run outside the back-board end, round behind the lower back
board, then connect to the rear side of the existing rear post. The endpoint
must contact metal without entering wood. Do not notch the wood, hide collisions
with draw order, move the posts, or add an isolated connecting patch.

Review both complete arm paths against every wooden board. Use a conservative
clearance bound for the whole sampled tube, including joints and endpoints,
not just the centreline at one point. Verify front/rear metal contact, tangent
directions, bounds, the existing source ratios and enlarged TOP joints. Stop
after one reviewed sheet and synchronized documents; no commit or model work.

Plan self-review: moving the terminal attachment to the rear post's back side
is necessary because the former centreline endpoint itself put the arm radius
inside the board. The new route preserves the original side-profile intent
while resolving the previously unspecified hidden connection in plan view.

## Completed review - continuous arm return

Inspected the complete saved sheet, rear return at 2.5x and front rise/seat
corner at 2x. The arm now runs outside the board end and turns behind the wood;
the previous diagonal cut through the lowest board is removed. Rear posts,
board widths, support/crossrail construction and the four source crops remain
unchanged from the preceding placement correction.

All 14 mirrored arm/board pairs pass the complete-capsule exclusion bound.
The minimum is 7.648545 mm against the lowest back board, above the 2 mm rule.
The bound includes the entire 22.5 mm radius, all sampled segments and end
spheres, with the maximum 0.5 mm witness spacing accounted for conservatively.
Both rear metal contacts have 11.874816 mm interior margins in each solid;
front endpoints coincide with front-leg tops. Cubic tangent directions agree.

The former penetrating path was supplied to the same current drawing checker
in memory and was rejected by the arm/wood assertion. The present path passes.
The generator also verifies the unchanged overall bounds, original BACK width
ratios, wood margin, all seven visible wood groups and existing 22 contact
witnesses. Four saved source crops match exactly after their documented resize.
Saved image/spec hashes agree; original source, separate sign and default
materials match HEAD. Direct document links and scoped whitespace checks pass.

This closes the reported arm/wood penetration and connection review for the
reference construction. It is not a claim that uncalibrated source cameras or
a future production mesh have been verified. User visual approval is pending.
No Blender model, app change, commit or push was made.

## Bounded revision - common five-view construction

Association: ongoing Office asset reference/specification review, park bench
only. This replaces the TOP-only correction plan above; it does not implement
or prove an Office runtime/Inspector step.

Keep v1 immutable and preserve the outgoing v3 files as historical evidence.
Generate every candidate view from one current component list and one geometry
builder. Keep default dimensions, source grain, material regions and the sign
unchanged. No independent per-view geometry, copied candidate views, nonuniform
image stretching, model export, Blender, app work, commit or push.

Freeze checks before edits: all five views consume the same geometry digest;
projection bases are orthonormal; the saved dimensions and source BACK ratios
hold; all intended metal/wood joins and all fourteen forbidden arm/wood pairs
are checked; the previous penetrating arm is rejected. Inspect each saved view
and enlarged arm/post, cap and seat/support joints. Compare source and candidate
in all views using uniform scale only, and report camera/source discrepancies
rather than scoring copied source pixels as geometric success.

The final annotated sheet must retain five named views, original colour family
and explicit default dimensions. Original source and final candidate are the
only two user-facing sheets. Supporting comparison and close-up evidence stays
in the review directory. Stop after this bounded review and report any unmet
source-equivalence condition explicitly; user approval remains pending.
