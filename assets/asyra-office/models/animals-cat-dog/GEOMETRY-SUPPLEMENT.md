# Cat and Corgi - Geometry Supplement

## Authority, axes and poses

Use metres, +Z up, -Y front and +X right. Front looks along +Y, right along -X, back along -Y, top along -Z and bottom along +Z. Side-view page orientation may be rotated for readability; world axes in the numeric specification control construction.

The source establishes chibi proportions, rounded masses and coat families. Drawings resolve proposed appearance; numerical recipes fix hidden geometry. These are separate static poses, not a rigged neutral-pose delivery. Do not straighten the cat or pose the corgi mid-stride. Images are uncalibrated and do not establish 100% reconstruction.

## Raw-coordinate primitives

Read every ellipsoid as [name, centre XYZ, radii XYZ, base material]. An ellipsoid surface satisfies sum(((p-centre)/radii)^2)=1. For deterministic blending, use the implicit field f=(length((p-centre)/radii)-1)*min(radii). This is a construction field rather than an exact Euclidean distance.

Ear rows are [centreX, centreY, Z, radiusX, radiusY]. Between successive rows interpolate all values linearly by Z. At that Z, the solid section is an ellipse. Close both end ellipses. The tiny final section forms the rounded-looking tip without an infinitely sharp vertex. Build its mesh with 32 angular samples per ring, convert to signed Euclidean distance to that closed mesh for union. Both outer ears use orange.

Tail points are centre coordinates with one radius each. Use a uniform Catmull-Rom spline through centres, duplicating the first and last control point at the ends. On a span from P1 to P2, evaluate:
P(t)=0.5*((2P1)+(-P0+P2)t+(2P0-5P1+4P2-P3)t^2+(-P0+3P1-3P2+P3)t^3).
Sample t at 32 equal intervals per span, remove duplicate sample centres at joins, and linearly interpolate radius from the two span radii. The tail solid is the union of the sampled spheres, including spherical end caps. Preserve the cat's tail on anatomical +X; the front image therefore shows it on the right.

## Body union and normalization

Union primitives in numeric-list order: ellipsoids, left ear, right ear, tail sample spheres. Use polynomial smooth minimum:
h=max(k-abs(a-b),0)/k; smin(a,b)=min(a,b)-h*h*k/4, with k=0.004.
Extract the zero isosurface on a 0.001 m grid aligned to raw coordinate multiples, padding analytic primitive bounds by 0.02 m on each side. Interpolate edge intersections linearly. Use outward normals derived from the field gradient. Do not add post-extraction smoothing, subdivision or fur.

Add the corgi's nose ellipsoid after the body union as a separate intersecting dark component. The cat's nose is a surface graphic. No internal anatomy is needed. Paws remain four distinct visible lobes even where their roots blend into the body.

After construction, compute bounds over the complete animal including the corgi nose. Let raw minimum/maximum be lo/hi. Normalize each coordinate using:
X'=(X-(loX+hiX)/2)*targetX/(hiX-loX);
Y'=(Y-(loY+hiY)/2)*targetY/(hiY-loY);
Z'=(Z-loZ)*targetZ/(hiZ-loZ).
Use the target sizes in JSON. This final normalization is part of the recipe, not permission to alter silhouette locally. Apply the same transform to all landmarks, masks and nose geometry. Keep raw coordinates available for evaluating material masks.

## Faces

Project graphic landmarks onto the front hemisphere of the head ellipsoid. For a landmark (x,z), its raw Y is cy-ry*sqrt(max(0,1-((x-cx)/rx)^2-((z-cz)/rz)^2)). Reproject along Y to the final union surface if blending displaced it. Graphics are flush intrinsic color, not raised wires or holes.

Cat eyes and mouth are quadratic Bezier curves through the listed XZ control triples, sampled at 32 intervals. Paint points whose projected XZ distance from a curve is within its lineRadius. The pink cat nose uses the given XZ ellipse. Corgi eyes use the listed XZ ellipses. All eyes are dark, with no glints, whites or lashes.

## Required hidden geometry

Both animals have exactly four paws. The cat's hind paws are tucked beneath the rear body; the tail is continuous behind the visible tip. The corgi's belly, chest and paws are cream. Ear backs are orange; inner pink patches face toward -Y. No claws, whisker strands, tongue, teeth, collar or genital detail is specified.

No skeleton, fur cards, deformation topology or animations are included. This implicit-surface recipe defines static appearance only. Animation-ready retopology requires a later authorized modeling stage.

## Future acceptance

When modeling is authorized, compare front, side, back, top, underside and oblique views against the sheets and source. Verify normalized bounds within 0.001 m, four paws, two ears, one continuous tail, closed geometry and correct color regions. The image-generation stage does not verify any of those model properties. Differences must be resolved through review rather than claiming the recipe automatically reproduces every image pixel.
