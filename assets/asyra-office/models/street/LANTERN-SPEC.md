# Street Lantern - Geometry and Replaceable Appearance

Recalculated 2026-10-08. One placeable lantern, centred on X=Y=0, with the foot
base at Z=0 and +Z up. Numeric authority is the `streetlight-vintage-lantern`
module in [street-model-spec.json](street-model-spec.json). This guide fixes the
interpretation of those values. No model, runtime API or lighting system is
implemented here. The [existing drawing](review/07-street-lantern-v2.png) is unchanged.

## Proportion source and revised dimensions

Retain the previously authored total height of 2.74 m. Use the FRONT silhouette
in the 1536 x 1024 reference for proportions: top row 180, bottom row 850,
height 670 pixels. The approximate scale is 2.74/670 m per pixel. Coordinates
are zero-based and image Y increases downward. An approximate feature height is
`Z=(850-imageY)*2.74/670`. Ink width and illustrated perspective limit measurement
accuracy; numeric values below are rounded authoring decisions, not exact scans.

| Feature | FRONT measurement | Proportional estimate | Adopted geometry |
| --- | --- | --- | --- |
| Eave width | 129 px at row 256 | 0.52755 m | 0.530 m |
| Foot maximum diameter | 106 px at row 828 | 0.43349 m | 0.440 m |
| Straight shaft diameter | 36 px at row 600 | 0.14722 m | 0.150 m at upper end; 0.160 m at lower end |
| Frame top | Around row 263 | Z=2.400 m | Z=2.400 m |
| Frame bottom | Around row 376 | Z=1.938 m | Z=1.940 m |
| Shaft top | Around row 420 | Z=1.759 m | Visible pole ends around Z=1.760 m |
| Lower accent collar | Around rows 772..790 | Z=0.245..0.319 m | Z=0.245..0.320 m |

The FRONT, SIDE and THREE-QUARTER drawings are independently laid out, not
calibrated equal-scale projections. FRONT owns these proportions. SIDE confirms
the same lamp construction; TOP confirms a square roof and a centred round
finial. The oval line of the illustrated base is perspective, not a pointed or
elliptical physical base. No shape decision is inferred from painted shading.

| Part | Z interval (m) | Width/diameter and connection |
| --- | --- | --- |
| Foot | 0..0.265 | Maximum diameter 0.440; flat underside |
| Lower accent collar | 0.245..0.320 | Maximum diameter 0.246; conceals foot/pole junction |
| Shaft | 0.300..1.780 | Diameter decreases linearly from 0.160 to 0.150; ends embedded in collars |
| Upper collar | 1.760..1.840 | Maximum diameter 0.202; dark structural default |
| Neck | 1.820..1.940 | Upper support diameter 0.260; meets bottom tray |
| Frame | 1.940..2.400 | Square outer side 0.300 at bottom, 0.440 at top |
| Eave band | 2.400..2.445 | Square side 0.530 |
| Hip roof | 2.445..2.575 | Square side tapers from 0.530 to 0.180 |
| Finial | 2.575..2.740 | Base diameter 0.180; rounded bead and spherical top |

The total axis-aligned envelope is X/Y=-0.265..0.265, Z=0..2.740 m. This replaces
the old 0.38 x 0.38 x 2.74 m envelope and its overly narrow foot/pole. Rotating
the complete square head in the scene can enlarge its world-axis bounding box;
that does not change the local component dimensions.

## Revolved profiles and normals

Foot, collars, neck and the lower finial use the ordered JSON [Z,radius] stations.
Revolve around +Z with 64 angular sectors, angle zero on +X. No additional
unspecified bevel is applied to these profiles. The shaft is a linear tapered
surface using its endpoint radii, with the same 64 sectors.

For each profile interval let h_i=z_(i+1)-z_i and d_i=(r_(i+1)-r_i)/h_i.
Set the first and last derivative to zero, except the finial's last derivative
specified below. For an internal station, if d_(i-1)*d_i<=0 set m_i=0. Otherwise:

```text
w1 = 2*h_i+h_(i-1)
w2 = h_i+2*h_(i-1)
m_i = (w1+w2)/(w1/d_(i-1)+w2/d_i)
```

Use cubic Hermite interpolation with u=(z-z_i)/h_i:

```text
r(z) = (2*u^3-3*u^2+1)*r_i + (u^3-2*u^2+u)*h_i*m_i
     + (-2*u^3+3*u^2)*r_(i+1) + (u^3-u^2)*h_i*m_(i+1)
```

This fixes the rounded profile without radius overshoot at collars or foot rims.
Sample at least eight intervals between profile stations; refine until profile
chord error is at most 0.25 mm. Use analytic profile normals, smoothed around
the axis. Keep the flat foot-bottom rim sharp. Do not weld different material
slots by discarding their ownership; remove buried faces at structural joins.

The finial's last profile station is Z=2.680, radius
`sqrt(0.048^2-0.012^2)=0.0464758002 m`. Its final derivative dr/dz is
`0.012/sqrt(0.048^2-0.012^2)`. Continue with the exact sphere
`r(z)=sqrt(0.048^2-(z-2.692)^2)` from Z=2.680 to 2.740. Use at least 24 equal
angular intervals on this cap, refine to the same chord tolerance and weld its
top to one pole vertex. The join has continuous position and tangent. Do not
cap the lower profile at Z=2.680 or add an entire overlapping sphere there.

## Square frame, support tray and openings

The head is a square truncated cage. At height z in [1.940,2.400], its outer
half-width is `a(z)=0.150+k*(z-1.940)`, with `k=0.070/0.460`.
Construct the square shell between `max(abs(x),abs(y))=a(z)` and
`max(abs(x),abs(y))=a(z)-0.024`. Thickness here is a horizontal XY inset,
not a face-normal thickness. Retain the following portions:

- Full perimeter bottom ring: Z=1.940..1.985, height 45 mm.
- Full perimeter top ring: Z=2.375..2.400, height 25 mm.
- Between the rings: four corner regions satisfying both
  `abs(x)>=a(z)-0.032` and `abs(y)>=a(z)-0.032` inside the shell.
  These are L-section posts, 32 mm wide on each exterior face and 24 mm deep.
- Add a solid square bottom tray Z=1.940..1.948 using the same outer a(z).
  It closes the cavity below the panes and provides real support above the neck.

Union these volumes. This explicitly defines corner mitres and continuous rings;
do not add four overlapping square rods or fill the window openings with metal.
Round exposed convex metal edges inward by 3 mm with three arc segments,
preserving the long face planes and outer size. Exclude buried edges, attachment
planes and pane seating surfaces. This edge treatment is part of metal geometry,
not a black line drawn onto the material.

## Four separate panes and seating

The front pane has outer face `y=-a(z)+0.008`, a horizontal setback of 8 mm
from the front frame plane. Its lower and upper heights include a 4 mm embed
beneath each rail:

```text
z0 = 1.940+0.045-0.004 = 1.981
z1 = 2.400-0.025+0.004 = 2.379
b(z) = a(z)-0.032+0.004
front vertices = (-b(z0),-a(z0)+0.008,z0), (+b(z0),-a(z0)+0.008,z0),
                 (+b(z1),-a(z1)+0.008,z1), (-b(z1),-a(z1)+0.008,z1)
```

The panel widths are approximately 0.2564782609 m at the bottom and
0.3776086957 m at the top. These describe the glass panel, not the frame's
outer width. Visible opening height is 0.390 m, from Z=1.985 to 2.375.
Side-edge embed is measured along local face width; rail embed is measured in Z.

The outer normal of this front plane is `(0,-1,-k)/sqrt(1+k^2)`. Translate the
back by 3 mm along the inward normal, namely
`(0,+0.003,+0.003*k)/sqrt(1+k^2)`, and connect the four edges to close the pane.
The thickness is therefore 3 mm normal to the sloped glass, not 3 mm along Y.
Do not scale the back face or independently move its upper vertices.

Rotate this pane 90, 180 and 270 degrees about +Z to obtain right, back and left
panes. Keep all four panes distinct for appearance overrides. Their corners are
concealed by the metal posts; they do not meet in exposed glass mitres. Cut their
exact occupied volumes from the concealed metal seating regions so solid parts
have no interpenetration. Preserve the visible opening boundaries. Do not bevel
pane seats into a visible gap or make pane faces coplanar with metal faces.

## Closed roof shell and finial support

The eave is a 0.530 m square band from Z=2.400 to 2.445. Above it, the outer
half-width is `A(z)=0.265-q*(z-2.445)`, where `q=0.175/0.130`, ending at
half-width 0.090 at Z=2.575. Four planar hip faces meet at diagonal creases.
The flat peak square supports the finial's 0.180 m diameter base.

Define the enclosed roof cavity only for Z=2.412..2.563, with half-width
`c(z)=min(0.265-0.012, A(z)-0.012*sqrt(1+q^2))`, extrapolating the same A(z)
below Z=2.445 for this calculation. Subtract this square cavity from the outer
closed roof solid. This creates 12 mm nominal face-normal side/hip walls, a
12 mm bottom lid and a 12 mm peak cap. The cavity remains enclosed; it is not
an open hole through the roof or an extra exterior layer.

Round only the four exterior vertical eave corners and the upper/lower eave
perimeters inward by 3 mm, three arc segments. Hip creases and the flat finial
attachment plane stay sharp. The nominal 12 mm thickness applies before this
rounding; the conservative remaining thickness near rounded edges is at least
9 mm. No bevel may expand the 0.530 m exterior width.

The eave overhang beyond the frame top is (0.530-0.440)/2=45 mm on each side.
The roof underside meets the frame exactly at Z=2.400. Remove coincident hidden
contact faces. The finial joins the peak at Z=2.575 without a floating gap,
extra disc, hidden spacer or enlarged top square.

## Structural assembly and part ownership

Union the foot, shaft, two collars, neck and frame/tray. Their specified internal
overlaps ensure connection and are not multiple visible coincident surfaces.
Remove buried caps and interior overlap faces. Exterior face ownership priority
is lower collar, upper collar, frame, neck, shaft, foot, in that order. Preserve
those face groups even when sharing one watertight structural mesh.

Roof and finial meet the structure at their specified attachment planes. Remove
hidden contact faces when preparing a connected shell. Keep the enclosed roof
cavity and separate pane solids. Pane seats are fitted to the closed pane solids.
No hinges, screws, bulb, cable, side arm, baked light or terrain are included.
No part moves automatically; future placement and illumination belong to the app.

## Default appearance and independent replacement

Colours are intrinsic sRGB pigment, never samples of reference shadows.

| Material default | sRGB | Roughness | Metallic | Default parts |
| --- | --- | --- | --- | --- |
| lamp-metal | #373733 | 0.58 | 0.55 | Foot, shaft, upper collar, neck, frame, roof, finial |
| collar-metal | #60594B | 0.62 | 0.50 | Lower accent collar |
| amber-glass | #C7A15B | 0.48 | 0 | All four panes |

The upper collar now uses the structural dark default visible in FRONT rather
than copying the lower collar's accent material. TOP's different finial tone is
illustrative appearance, not a different geometry or mandatory accent override.
Defaults for all panes are opaque, transmission 0, alpha 1 and emission 0.
Colour/material changes may alter optical properties when explicitly supplied;
they must not introduce light objects or change the authored mesh.

Future creation parameters must support independent per-part colours and complete
materials for foot, shaft, each collar, neck, frame, roof, finial and each of the
four panes. Convenience groups are structure, accent and panes, as listed in
JSON. This defines parameter semantics, not an implemented public API.

1. Select per-part material, otherwise group material, otherwise default material.
2. Apply per-part colour if supplied, otherwise group colour if supplied.
3. Without a colour override, keep the selected material's colour; do not overwrite
   a custom material with the default tint.
4. A colour-only override changes tint and retains the selected shader's other
   properties. Full material replacement discards the previous shader/textures.
5. Preserve dimensions, frame/pane fit, origin, normals and part ownership. Do not
   displace vertices or change another instance's material through shared mutation.

The optional default metal colour-grain recipe retains seed 707 and applies only
to lamp-metal and collar-metal. Amber panes use uniform intrinsic pigment. A
material replacement removes that grain; a colour override retains the selected
material's intrinsic detail. No shadows, AO, drawn contours, directional highlights
or glow are baked. The app may later provide lighting independently.

## Review boundary

Numeric review must check profile radii, the retained 2.740 m total height,
frame openings, plane-normal glass thickness, seats, roof cavity and part contacts.
Future model review must use the same model in all four views, plus magnified
frame/glass corners, foot/collar junctions, roof hips and finial. Review geometry
separately from replaceable appearance. Document checks do not establish visual
model acceptance, mesh quality, runtime LoD or performance.
