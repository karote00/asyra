# Sleeping Orange Cat - Reviewed Construction Contract

Status: six-view shape and revised documentation approved by the user for
commit; rendered-model review remains pending. No model, Blender run, animation, rig or app implementation is delivered.

## Sources and scope

- [Approved six-view sheet](review/01-sleeping-orange-cat-v1.png), retained unchanged.
- [Numeric inputs](animals-model-spec.json), `animals[id=sleeping-orange-cat]`.
- [Common implicit construction](GEOMETRY-SUPPLEMENT.md).
- [Default palette and coat masks](SURFACE-RECIPES.md).
- [Shared XYZ sizing and appearance](../README.md).

This document refines the sleeping cat only. The corgi keeps its existing
numeric inputs and is a later review item. Cat-specific instructions here take
precedence over the common recipe's face-projection and normalization wording.
The image establishes appearance; authored hidden surfaces and numeric defaults
are construction decisions, not recovered photogrammetric measurements.

## One unit and default size

One unit is the complete curled sleeping cat, including four tucked paws,
two ears, one continuous tail and facial/paw colour regions. No floor, rug,
collar, accessories or detached copy of the tail is included.

Default final extents are **X=380, Y=500, Z=260 mm**. These are whole-animal
bounds after default normalization, not dimensions of individual primitives.
The unit origin is the midpoint of the final X/Y bounds on the lowest Z plane.
The asymmetrical tail means this origin need not coincide with the head centre.

Raw coordinates in JSON precede normalization. Do not interpret a raw radius
as a final visible measurement, or normalize each part separately. Construct
the full default surface, determine its bounds, then apply the documented
one-time default normalization. Only then generate lower LOD meshes.

For raw bounds lo/hi, raw origin O=((loX+hiX)/2,(loY+hiY)/2,loZ), and default
extent D, use pDefault=(pRaw-O)*D/(hi-lo), component by component. Reject empty
or nonpositive spans. Record O and the three scale factors with the authored
model so its geometry and masks can be reconstructed consistently.

Requested instance extents T apply pInstance=pDefault*T/D once about root.
Omitted axes retain D; reject nonfinite or nonpositive extents. All parts,
face marks and mask coordinates inherit this transform once. Each LOD inherits
the original normalization; never independently stretch a reduced mesh back
to the bounds. A size override does not change the sleeping pose or bend the
cat to a surface.

## Raw part dimensions and joins

The following values are **raw millimetres**, not final normalized measurements.
Ellipsoid dimensions below are diameters; JSON stores radii.

| Part              | Centre XYZ    | Full ellipsoid dimensions XYZ |
| ----------------- | ------------- | ----------------------------- |
| Torso             | (0,65,130)    | 310 x 340 x 250               |
| Head              | (0,-155,105)  | 280 x 200 x 190               |
| Front paw - left  | (-90,-205,25) | 88 x 98 x 50                  |
| Front paw - right | (90,-205,25)  | 88 x 98 x 50                  |
| Hind paw - left   | (-85,140,25)  | 90 x 100 x 50                 |
| Hind paw - right  | (85,140,25)   | 90 x 100 x 50                 |

Head overlaps torso. Front paws overlap head; hind paws overlap torso. Ear
roots overlap head. Preserve these connected anatomical lobes and their source
identities during the smooth union. There are no separate leg shafts or hidden
human-style limb chains in this static sleeping-pose contract. Rigging or other
poses require a separately reviewed anatomy/deformation specification.

Each ear has three elliptical sections. At Z=155/205/245 mm, its centre X is
+/-90/110/125 mm, Y=-150 mm, and X/Y radii are 43/28, 32/20 and 4/3 mm.
Interpolate section centre and radii linearly with Z; keep both end caps.
The final small ellipse is not a zero-radius spike. Mirror X only.

## Tail path and continuity

Use the retained Catmull-Rom recipe with duplicated endpoint controls, 32
intervals per span, linear radius interpolation and spherical caps.

| Control | Centre XYZ - raw mm | Radius - raw mm |
| ------- | ------------------- | --------------- |
| Root    | (60,180,60)         | 30              |
| 2       | (145,140,50)        | 35              |
| 3       | (175,50,43)         | 35              |
| 4       | (177,-60,42)        | 35              |
| Tip     | (145,-145,41)       | 32              |

Four spans yield 129 unique sample centres. The root centre is inside the
torso; consecutive sample spheres must overlap. Test the evaluated spline,
not just control points. Sphere radii and positions participate in the same
whole-animal union and normalization. Do not attach a disconnected cream tip.
The tail stays on anatomical +X: right in FRONT and TOP, left in BACK.

For tail paint bands, calculate cumulative length along the 129 sampled
centres, then divide by total length. Select the nearest centre, breaking ties
by the lowest index. The cream tip starts at fraction 0.78; the other cream
band occupies 0.35..0.47. These are replaceable intrinsic masks.

## Surface construction and projection

Use the common 4 mm smooth minimum and 1 mm raw extraction grid, preserving
numeric-list union order. Bounds must include all evaluated tail spheres and
ear sections, not only spline control centres. Check that the extraction
boundary lies outside the field; an intersected extraction boundary is a
failure, not permission to cap off a truncated animal. The extraction grid is
a source resolution, not a final triangle count or a proved error bound.

Face graphics are flush colour regions. For the head ellipsoid, compute
q=1-((x-cx)/rx)^2-((z-cz)/rz)^2. **Reject q<=0; never clamp q to zero.**
Evaluate the full eye/mouth stroke width and nose ellipse. Valid analytic
front projection is y=cy-ry*sqrt(q).

Reprojection onto the complete union follows +Y from outside the front bounds.
Take the frontmost hit and require head ownership under the documented
pre-blend field/tie rule. If a paw/tail occludes it, reject the placement; do
not skip the obstruction and paint a hidden head, or duplicate the mark on
rear surfaces. Keep marks within their X/Z domains and on the front-facing
head surface. The existing JSON eye, mouth and nose inputs remain unchanged.

## Appearance and paw pads

Defaults remain orange #C98B50, cream #F1E4CC, pink #B97972 and dark #38312C.
The numeric `appearance.regions` preserves independent orange/cream coat,
ear-interior, nose, paw-pad, eye and mouth selections. Matching default colours
do not collapse their identities. Retain mask data separately from the palette;
a flattened coloured atlas alone cannot support independent region overrides.

Follow the shared override precedence and instance isolation. Model colour,
material and whole XYZ size remain replaceable. Image outlines, shadows and
backgrounds are not texture inputs. Intrinsic coat markings follow anatomical
coordinates: undo the instance transform, then undo default normalization to
evaluate the raw-space masks. Do not world-project these masks or treat the
coat pattern as a repeating pavement texture.

On each paw, the central pad has X/Y radii 14/12 mm. Three toe disks of radius
4.5 mm use local XY centres (-12,-20), (0,-24), (12,-20) mm. Restrict pads to
paw-owned, downward-facing lower surfaces; never paint a body/tail surface just
because it overlaps a paw's XY coordinates. These four pads per paw are colour
regions with zero geometric relief. All dimensions in this paragraph are raw.

## Views, LOD and acceptance

Use orthographic review cameras with these look directions and screen-up axes:

| View   | Look direction | Screen up |
| ------ | -------------- | --------- |
| FRONT  | +Y             | +Z        |
| RIGHT  | -X             | +Z        |
| BACK   | -Y             | +Z        |
| TOP    | -Z             | +Y        |
| BOTTOM | +Z             | -Y        |

For three-quarter review, match the approved image orientation and elevation;
record the actual camera and framing. The illustrative sheet does not supply
a calibrated focal length. Do not rotate geometry to compensate for a camera
mismatch. Review all six views, then enlarge ears, face, paw/body joins,
underside pads and both tail ends.

| LOD  | Whole-animal triangle ceiling | Maximum surface error in default metres |
| ---- | ----------------------------- | --------------------------------------- |
| LOD0 | 12000                         | 0.001                                   |
| LOD1 | 6000                          | 0.002                                   |
| LOD2 | 2000                          | 0.004                                   |

These are authored budgets, not measured mesh results. Error is bidirectional
against the normalized complete default surface. Future validation must use
an adaptive surface comparison, not only vertex samples. Keep all four paw
lobes, two ears, tail continuity and facial placement. No LOD may close an
anatomical gap with a patch or erase a required part to meet its budget.
If accuracy and triangle count cannot both pass, reject the mesh for review.

The document checks cover source integrity, preserved corgi geometry baseline, dimensions,
primitive overlap, tail sampling, face projection, pad domains, explicit
appearance/LOD rules and links. They do not extract a surface or prove final
silhouette, field topology, material-mask ownership, budgets or animated fit.

```sh
python3 -B assets/asyra-office/models/animals-cat-dog/review/__tests__/test_sleeping_cat_spec.py
```

The next modeling gate must verify closed outward geometry, no detached parts,
default bounds within 1 mm, the six views and enlarged details, plus actual
LOD errors/counts. Do not interpret numeric-document checks as model approval.
