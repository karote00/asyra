# Office structure - approved geometry baseline

Status: owner-approved structure on 2026-10-26; applied to the live app on 2026-10-26.
The owner accepted the building structure after the lounge proportion correction.
This is the geometry baseline for implementation. No furniture is included.
The original full-office reference remains the visual authority.

Approved geometry snapshot SHA-256:
`d86f7e7b55db77a90a75bf4ff7449581d8cd53c0aa58753722a89c93b239cd5d`
(`office-single-floor-structure-proposal-v1.json`). The existing PNGs, JSON and
generator are preserved as review-time evidence; their proposal/pending labels
predate this acceptance. This document records the current approval status.
Do not regenerate or reinterpret the accepted geometry during implementation
without a new owner-directed correction. Approval is design acceptance, not a
claim of surveyed dimensions or verified live-app parity.

## Authority and bounded purpose

The full-office reference, the four owner-supplied detail crops on 2026-10-26,
and the owner's interpretations govern this sheet. The first version must retain
the reference's uneven heights, different thicknesses and asymmetric layout.
Future expansion must support that design; it must not normalize it into a
regular modular grid. A common finished floor and collinear cream/green dividers
remain explicit owner constraints.

## The four corrections

1. Lower the cream divider; keep the green divider only slightly lower. The
   previous 1.35/2.50 reusable-module height ratio is rejected for this scene.
   The two members remain collinear, with an opening between them.
2. Split the frontage into a thin left section and a thicker sign/entrance
   section. Show the entire approved door assembly, including the fixed left
   panel, operable right leaf, frame and gaps. Align the entrance pier with the
   lounge side boundary so that the room wall does not obstruct the opening.
3. The lounge rear has three ascending horizontal height sections after
   accounting for the source view direction. Its
   left side has a low front section and taller rear return. Retain the short
   rearward branch beside the right height transition. Do not replace these
   steps with a sloped wall top.
4. The white connection along the pantry's right side is floor finish at the
   common floor datum. Remove the prior raised/sloping parapet interpretation.
   It has no wall body, railing or added interior floor level.

## Dimensions and uncertainty

Scene values below are normalized units, not surveyed metres. Values marked as
visual estimates are accepted design choices, not exact recovered dimensions.
The four crops resolve topology but do not independently determine every hidden
wall foot or absolute size. The common-floor correction still requires visual
height inference; no claim of 100% source parity is made.

| Quantity                        |                  Current value | Basis                                                                     |
| ------------------------------- | -----------------------------: | ------------------------------------------------------------------------- |
| Cream height above common floor |                       1.959505 | Visual estimate: 0.75 of rear wall height; lowers the rejected cream wall |
| Green height above common floor |                       1.763554 | Visual estimate: 0.90 of cream height, reflecting owner crop 1            |
| Cream clear length              |                       1.436197 | Existing cream extent                                                     |
| Green length                    |                       1.009604 | Source horizontal cap-span ratio 71/101                                   |
| Divider clear gap               |                       0.312835 | Source horizontal gap/span 22/101; no gameplay widening                   |
| Thin frontage depth             |                       0.090000 | Crop 2 estimate: half the 0.18 entrance-wall depth                        |
| Thin frontage length fraction   |                       0.218750 | Crop 2 horizontal spans 280/1280                                          |
| Lounge rear widths              | 1.143532 / 0.456831 / 1.294840 | Source crown horizontal spans 393 / 157 / 445 pixels                      |
| Lounge low/high left lengths    |            0.828869 / 0.614667 | Source crown horizontal spans 267 / 198 pixels                            |
| White floor-band thickness      |                       0.025000 | Drawing representation below common floor, not a raised step              |

The owner accepted the structure, including the retained shell extents, room
footprints and corrected wall proportions. Their inferred dimensions remain
design values rather than independently surveyed measurements.
The white band replaces the mistaken wall across its former edge region; its
hidden width is not asserted to be an exact measurement from the source.

## Complete entrance contract

The source is `../architecture-model-spec.json`, module `entry-door-set`, with
its approved `05-door-v2.png` drawing. Before scene scaling:

- Rough opening: 1660 x 2170 mm.
- Fixed left panel: 600 x 60 x 2064 mm.
- Right operable leaf: 900 x 60 x 2064 mm.
- Outer frame: 1640 x 2160 mm in elevation.
- Meeting gap: 12 mm; side gaps: 4 mm.
- Jambs, head and handle parts retain their documented sizes and positions.

One scale (0.496323367) applies to all door coordinates and dimensions,
derived from the current contextual opening height. The resulting entire rough
opening is 0.823897 x 1.077022 scene units.
The left fixed panel is never replaced with plaster or omitted. This schematic
shows structural occupancy with flat wood faces; decorative recessed panels,
wood grain and hinge animation are outside the structure-drawing checkpoint.

## Reproduction and self-review

- Final sheet: `office-single-floor-structure-proposal-v1.png`.
- Geometry and provenance: `office-single-floor-structure-proposal-v1.json`.
- Generator: `draw_office_structure_proposal.py` (existing Python/Pillow).
- Permanent semantic checks: `test_office_structure_proposal.py`.

Both main views use the same saved solids and vertices. The entrance elevation
uses those same door solids. No raster image generation or independent invented
view is involved. Neutral face shading explains depth; no baked shadow asset
is produced.

The original four regression cases rejected the preceding topology. The later
source-ratio revision rejected its rear-height order and overlong left low wall.
All six current drawing cases pass, including projection of emitted wall corners. A further door-clearance assertion
caught an inherited placement conflict during self-review; it now passes too.
Checks cover nearly equal divider heights, complete uniformly scaled door,
separate front thicknesses, stepped lounge walls and same-level white floor.
They do not substitute for comparison with the source or imply app acceptance.

The final full sheet and a native-resolution structure detail were visually
reviewed for those relationships. Original/live SHA-256 preservation is checked
by the generator. No production scene, exterior, lighting, commit or push changes.

## Lounge source-proportion revision

The owner rejected the earlier lounge proportions. The old high/low/high rear
ordering, 10% middle drop and 55% left-wall ratio are superseded. This revision
uses `lounge-proportion-source.png` (the untouched uploaded 1828 x 1268 crop) and
`lounge-proportion-measurements.json` as a bounded, inspectable source trace.
`lounge_proportion_geometry.py` derives the proposal geometry and a common local
view; `lounge-wall-proportions-review.png` shows source and geometry at identical
scale and framing. The full structure sheet is regenerated from the same solids.

The three rear crown runs have horizontal pixel spans 393, 157 and 445. Their
combined downward rise/span estimates one X-axis slope. The high left crown
provides the perpendicular Y-axis slope from its 198 x 94 pixel run. With the
retained rear width as a similarity datum, these determine a weak-perspective
basis. The 267 pixel low-left run is then 1.348485 times the high-left run,
replacing the previous 2.609021 ratio. The left-return foot (partly obscured)
provides the common height datum. Screen-space y alone never determines height.

| Derived quantity                              |         Normalized scene value |
| --------------------------------------------- | -----------------------------: |
| Visible rear wall width                       |                       2.895203 |
| Interior side depth                           |                       1.443536 |
| Left low wall height                          |                       0.751485 |
| Left high wall height                         |                       1.325174 |
| Rear left / middle / right heights            | 1.197161 / 1.329713 / 1.454128 |
| Rearward branch length from wall center plane |                       0.473266 |
| Review azimuth / elevation                    |  43.146459 / 26.422279 degrees |

The lounge rear partition moves to match the recovered room depth, anchored to
the existing entrance-side floor position. Consequently the adjoining pantry
floor region extends to that partition. Its outer walls and the building slab
are unchanged. The main drawing camera now uses the same derived orientation;
that is a view adjustment, not a change to the other rooms' geometry.

Twelve corner projections computed from the emitted wall records have a maximum
residual of 6.397 source pixels.
The declared pick tolerance is 8 pixels. These are fitted construction points,
not independent holdout validation. The partly obscured foot has 20 pixel
uncertainty; moving it changes absolute heights while preserving the traced
height differences. Hidden feet, exact camera intrinsics, the tiny frontage-end
notch and other rooms are not certified by this local fit. No 100% reference
claim is made. All tops remain horizontal and all bases remain on one floor.

Self-review includes the enlarged source crown and left-wall crops, the same-view
comparison and the full updated sheet. The six semantic tests and naming gate
are required alongside that visual review. The app and original full-office
reference remain unchanged. The owner has now approved this drawing checkpoint;
implementation and verification in the app remain outstanding.

## Live application verification

The app now constructs this approved geometry through its normal catalog and
scene composition. `scene/reference/office-structure.json` retains the snapshot
hash and numeric construction rules, without importing diagnostic solids.
Forty focused structure tests, two exterior/crown preservation cases, app lint,
typecheck/build and fifteen naming checks passed. The build retains its existing
large-chunk warning. A hardware browser test at `http://127.0.0.1:5194/` passed;
its overview and enlarged captures were inspected and retained as
`live-approved-structure-overview.png` and `live-approved-structure-close.png`.
`live-approved-structure-record.json` identifies viewport and Apple M3 Max renderer.
The current in-app browser was reloaded and independently inspected.

These checks cover the accepted structure, not deferred furnishings or complete
source-image fidelity. Lighting and visible shadow banding remain unchanged.
No commit or push was performed.
