# Pencil Eraser - Geometry Supplement

## Coordinates

Use metres, +Z up, -Y front and +X right. Origin is the bottom footprint centre. Apply identity rotation and unit scale. Front looks along +Y, back along -Y, right along -X, top along -Z and bottom along +Z. Left matches right geometrically.

The drawings communicate appearance. Numerical dimensions and construction define hidden geometry; do not measure raster pixels.

## Closed chamfered solid

Overall size: 0.050 x 0.020 x 0.012. Bounds: X=-0.025..0.025, Y=-0.010..0.010, Z=0..0.012. Each of the twelve original box edges has a straight 45-degree chamfer, with 0.001 offset on each adjacent face. No rounded fillet or subdivision.

For exact construction, let a=0.025, b=0.010, c=0.006, d=0.001. At each sign triple (sx,sy,sz), form three vertices:

- (sx*a, sy*(b-d), sz*(c-d))
- (sx*(a-d), sy*b, sz*(c-d))
- (sx*(a-d), sy*(b-d), sz*c)

Add (0,0,0.006) to every vertex, then build the convex hull. This defines twenty-four vertices, six rectangular main faces, twelve quad bevel strips and eight triangular corner patches. Triangulation produces forty-four triangles. Use outward winding and flat face normals.

Top and bottom main flats are 0.048 x 0.018. Front and back main flats are 0.048 x 0.010. Side main flats are 0.018 x 0.010. Every surface is closed and uses the same ivory material.

No hidden recess, logo, wrapper, separate cap, hollowing, felt pad or handle. The chamfer does not change the overall bounding dimensions.

## Placement and future acceptance

The bottom plane is Z=0. Placing the origin at a desktop's surface elevation makes the eraser rest on its flat bottom. Counts, rotation, placement and interactions belong to the app.

When models are authorized, verify bounds within 0.0001 m, chamfer construction, closed faces and single-unit boundary. No reconstruction or export validation has occurred. Wear, deformation, crumbs, erasing animation and alternate LOD meshes are outside this handoff.

## Resizing, appearance and LoD - construction review

Apply the [shared overall-size and appearance contract](../README.md#overall-size-and-appearance---2026-10-09): finite positive whole-unit XYZ extents, one transform about the authored origin, then appearance mapping. Preserve selected material colour when no tint is supplied. Named part/region overrides take priority over the applicable group and preset. Existing surface recipes are explicit defaults, not immutable material restrictions. Identity artwork follows inverse-scaled default coordinates; repeating texture recipes use final local metres.

### Chamfer topology

Default extent is 50 x 20 x 12 mm. The 1 mm chamfer leaves main top/bottom flats 48 x 18 mm, front/back 48 x 10 mm and ends 18 x 10 mm. The defined convex hull has 24 vertices, 26 polygon faces and 44 triangles; no alternate shape is needed for LoD. These analytic counts exclude renderer vertex splits for flat normals. Positive nonuniform scaling stretches chamfers with the rest of the unit and does not re-create a fixed 45-degree bevel. Ivory rubber is a replaceable default over the whole exterior.

LoD rules here are construction constraints, not measured triangle counts or runtime performance claims. Keep the same origin and intended bounds across tiers; any reduced tessellation must preserve attachment interfaces and empty volumes. Production meshes, topology, screen-space transitions and visual fidelity still require separate implementation and review. These documents introduce no Blender export or app behavior.
