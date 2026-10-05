# Birds - Geometry Supplement

## Coordinate and authority contract

Read the numeric specification with this document and the surface recipes. Metres, +Z up, -Y front, +X anatomical right. Front camera is on -Y, right on +X, back on +Y, top on +Z, bottom on -Z; oblique camera on (+X,-Y,+Z). Top and bottom drawings may rotate the animal on the page for readability; world coordinates control construction. Reflect X to obtain the opposite side. Static closed-beak, wings-folded standing poses only.

## Body

Ellipsoid rows are [name, centre XYZ, radii XYZ, material]. Define an ellipsoid field as f=(length((p-centre)/radii)-1)*min(radii). Combine body then head with polynomial smooth minimum at k=0.003: h=max(k-abs(a-b),0)/k, smin=min(a,b)-h*h*k/4. Extract the zero isosurface on a 0.0008 m grid aligned to world zero, padding primitive bounds by 0.01 m. Interpolate edge crossings linearly; orient normals toward increasing field. This is a static construction recipe, not animation-ready topology. No additional subdivision, fur, displacement or post-smoothing.

Wings are separate closed ellipsoids with the specified centres/radii, rotated about their own X axes. Use right-handed rotation X: y'=cos(a)y-sin(a)z, z'=sin(a)y+cos(a)z. They intersect the body at their roots. Preserve two wings; no open wings or individual feather meshes. Tessellate separate ellipsoids using 64 longitude and 32 latitude intervals with shared pole vertices.

## Tail and beak lofts

Tail rows are [Y, centreZ, radiusX, radiusZ]. At each Y create a 64-vertex XZ ellipse centered at X=0. Connect matching angular indices between adjacent rings by quads; cap both ends with centre fans. Tail is a separate closed part with its root inside the torso. No forked tail or loose feather strands.

Sparrow beak rows are [Y, centreZ, radiusX, radiusZ], using the same construction. Its small last ellipse makes a blunt tip. Parrot upper-beak rows are [Z, centreY, radiusX, radiusY], using XY ellipses at each Z. Connect in row order and cap both ends; orient all faces outward. The forward movement of the centreline followed by the tiny lower ring creates the hook. The lower mandible is the separately listed ellipsoid. Upper and lower beak remain closed and overlapping at their bases; no tongue, mouth cavity or nostrils.

## Cockatiel crest

Three independent overlapping feather lofts form the swept-back crest. Each row is [Z, centreX, centreY, radiusX, radiusY]. Use the same 64-sample capped XY-ellipse loft construction as the upper beak, with outward normals. Roots overlap the head; tips are closed and rounded by their small final ellipses. No extra feather strands. Include the crest in final bounds normalization.

## Legs and exact toe counts

Each leg is a vertical capsule at its X and Y, joining the two listed Z endpoints with the stated radius. A capsule is a cylinder with hemispherical caps. Foot polylines are relative to (legX, legY, 0). Each segment is a capsule with the toe radius. Union the leg and its four toes using the body field extraction resolution and smooth-min k=0.001. Keep left and right feet separate components.

The sparrow has THREE toes toward -Y and ONE toward +Y on each foot. The parrot has TWO toward -Y and TWO toward +Y on each foot. Each bird has eight toes total. Do not mirror toe direction across Y, merge adjacent toe tips, or use three-forward feet for the parrot. No separate talons, scales or toe rings. Small toe bumps in the drawings are not extra digits.

## Final bounds

Build all geometry in raw coordinates. Compute complete raw bounds lo/hi, including toes, beak and tail. Transform every part uniformly by the following per-axis normalization:

- X'=(X-(loX+hiX)/2)*targetX/(hiX-loX)
- Y'=(Y-(loY+hiY)/2)*targetY/(hiY-loY)
- Z'=(Z-loZ)*targetZ/(hiZ-loZ)

Target XYZ comes from finalSize. This deliberate nonuniform normalization is part of the authored design. Preserve raw positions for color-mask evaluation. No later local reshaping is implied by normalization.

## Hidden parts and future comparison

Both wings have complete inner surfaces even where concealed; tail roots, feet and beak bases are closed. Belly remains tan for the sparrow and gray for the cockatiel; no vent or internal anatomy. Eyes and cheek/feather marks are flush colors, not separate protruding spheres or grooves.

When modeling is authorized, compare six views and inspect component intersections, ground contact, eight distinct toe tips, folded-wing symmetry, beak hook, tail continuity and target bounds within 0.001 m. Current documentation checks do not constitute those model checks. Rigging, retopology, flight poses and app-controlled behavior belong to a later stage.
