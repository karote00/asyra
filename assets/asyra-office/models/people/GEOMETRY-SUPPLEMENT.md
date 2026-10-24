# Female Character - Retained Baseline Recipe

This document and the inline `office-woman` entry in
[people-model-spec.json](people-model-spec.json) retain the female baseline for
its later individual review. These values no longer apply to `office-man`.
For the current male puppet, use [PUPPET-SPEC.md](PUPPET-SPEC.md) and
[man-puppet-model-spec.json](man-puppet-model-spec.json). The male recipe includes
complete under-clothing anatomy and replaceable parts; this older female recipe
does not establish compatibility with that new body profile.

All lengths are in metres. Existing baseline angles explicitly identified as
such use radians. No models have been built or verified from this recipe.

## 1. Coordinates, origin, and components

+Z is up, -Y front, +X the character's right. The origin is on the ground between the soles. Total height is 1.20 with no base. The following simplified body applies to the retained female baseline only.

Fixed standing pose: feet apart and pointing -Y, arms slightly outward and downward. Hands are rounded mittens without separate fingers and hold nothing. Add no accessories absent from the sheet. sharedAnatomy and sharedClothing define shared geometry; materialBindings resolves trousers, shoes, hair, and collar aliases.

Retain head, neck, ear-left/right, hand-left/right, shirt-body, sleeve-left/right, trouser-left/right, shoe-left/right, collar, cuff, waistband, hair, and facial-graphics parts. Left/right mean local negative/positive X respectively, regardless of the viewer's left/right.

All parts are closed with backs and outward exposed normals. A complete unclothed body beneath clothing is unnecessary. Skin must extend 0.01 into clothing at neck and cuffs to prevent holes. Intersecting upper trouser legs may be merged with the same material; leave no z-fighting surfaces. Joint locations are positioning references, not proof of rigging or animation readiness.

## 2. Basic surface algorithms

### Ellipsoid

JSON centre=C and radii=(rx,ry,rz). For θ∈[0,π], φ∈[0,2π):

P = C + (rx sinθ sinφ, -ry sinθ cosφ, rz cosθ).

Use 32 longitude and 20 latitude intervals, merge each pole into one point, and smooth normals. Add no undefined subdivision. No ear canals, nostrils, or shoelaces.

### Elliptical loft

Each rings row is [z,cx,cy,rx,ry], ordered by increasing z. Interpolate all five components between adjacent rows using smoothstep s=3t²−2t³ with 4 subdivisions per interval. Each row has 32 points: P=(cx+rx sinφ, cy−ry cosφ, z). Connect corresponding indices and cap both ends with planes; do not smooth the bottom cap into a sphere. Bevel end-ring corners inward with radius 0.003 and 2 segments, limited to 1/4 of adjacent-row spacing, without changing overall height. Soles remain on Z=0 and do not extend below it.

Use this for torso clothing, sleeves, trousers, and shoes. Do not turn generated fabric crease lines into extra geometry. Shirt hem Z=0.35, collar region Z=0.645, shoe top Z=0.08. Trousers intentionally overlap inside shoes and shirt; intersection edges must not remain exposed.

## 3. Head, face, and surface placement

Skin head centre (0,0,0.91), radii (0.25,0.205,0.245). Head width 0.50; outer hair width approximately 0.52–0.54. Ear centres/radii follow JSON; partial embedding is intentional. This preset has intrinsic cheek-colour circles.

For a front position defined by x,z, project onto the front skin surface:

yFace(x,z) = -0.205 × sqrt(max(0, 1−(x/0.25)²−((z−0.91)/0.245)²)).

- Eyes and cheeks: create filled elliptical thin surfaces from centreXZ/radiiXZ, projecting each vertex along Y to yFace−0.001. Use a 32-segment outer ring and centre fan. No white eye highlights.
- Eyebrows and mouth: four XZ points define one cubic Bézier, sampled in 32 intervals, projected pointwise to yFace−0.001. Sweep the specified circular radius along it and close ends with hemispheres. Use surface-recipe materials.
- Nose: XZ centre follows JSON, Y centre=yFace. Use the noseRadii ellipsoid with its rear half embedded; no extra protruding base.
- Expression is a small fixed smile. No open mouth interior, teeth, tongue, eyelashes, or variable expressions.

## 4. Hair

This preset has a short rounded black bob and three broad fringe locks. Rear shapes are completions based on front styling, not views proven by the original image.

### Scalp shell

Use hair.scalpCentre/scalpRadii and the ellipsoid formula. φ=0 front, π/2 right, π back, 3π/2 left. Set a=acos(cosφ); interpolate the θ boundary with smoothstep from front→side for a=0→π/2 and side→back for a=π/2→π. Each meridian runs θ=0 to θLimit(φ), with 20 intervals and 64 circumferential intervals.

Offset the inner layer 0.008 inward along outer ellipsoid normals and close the boundary. This is a hair shell, not a solid sphere covering the face. Add no black lower-edge lines or transparent cards.

### Locks

Each locks.points=[P0,P1,P2,P3] defines cubic Bézier B(t)=(1−t)³P0+3(1−t)²tP1+3(1−t)t²P2+t³P3, t∈[0,1]. width and depth are maximum cross-section diameters, not radii.

Use 24 length intervals and 12 cross-section intervals. T=normalize(B'(t)). Depth direction D is the normalized B(t)−scalpCentre vector after removing its T component. If its length is below 10⁻⁶, use +Y with its T component removed; if still degenerate, use +X. W=normalize(T×D). Section radii are 0.5×width×f(t) and 0.5×depth×f(t), where f(t) smoothstep-interpolates (0,0.35), (0.2,1), (0.65,0.9), (0.9,0.5), (1,0). Merge the tip into one point and close the root. Smooth the surface without adding fine hair strands.

Partly embed locks into the shell for continuous coverage without baked AO at overlaps. This preset has 3 front and 5 side/rear locks. JSON contains every curve coordinate. These large locks define the silhouette; do not randomly duplicate more.

After building hair, measure its top H and apply once to all hair, excluding face/ears: z'=0.70+(z−0.70)×(1.20−0.70)/(H−0.70). This fixes the highest point at 1.20 without X/Y scaling. It removes thickness-dependent top variation; do not arbitrarily scale the whole character or alter head/body proportions.

## 5. Collar, cuffs, and clothing details

The front left collar uses the four collar.leftVertices in order, triangulated along diagonal 0→2. Mirror X and reverse winding for the right piece. Add thickness 0.003 along normals and bevel 0.002 with 2 segments. Front pieces wrap the neck; no tie.

The rear collar is an elliptical band centred at the XY origin with JSON radii, using only φ∈[π/2,3π/2] (rear half), Z range from backBand, and outward thickness. Its front-collar join must not pass through neck skin. This preset uses the grey collar material.

Cuffs are bands extracted from sleeve sections Z=0.365–0.391, offset outward 0.002 and capped at both ends. Do not duplicate entire sleeves. This preset uses grey cuffs. The waistband is an elliptical band at Z=0.35–0.377, radii (0.149,0.087), thickness 0.002, using trouser colour with no belt buckle.

The front centre seam and rear yoke seam follow shirtDetails. Project them onto the loft's front/rear surface, offset 0.001, and draw seam-material surface lines of radius 0.0008. No trouser pockets, zippers, or extra seams. Undefined sheet outlines are contour aids, not black-line textures.

## 6. Accessories

The female baseline has no spectacles. The male eyewear specification is owned
by [the modular puppet contract](PUPPET-SPEC.md).

## 7. Delivery and future acceptance

This delivery contains drawings/documents only; no modeling program was created or run. Once modeling is authorized, use one root per character, unchanged origins/local coordinates, and no lights or scene. Component names, material bindings, and landmarks can support tool conversion but are not an existing app integration contract.

Future checks: height 1.20±0.002, soles Z=0, head centre, facial positions, lock counts, three front locks, clothing coverage, empty hands, closed rear head/soles, and no props/base. Compare front -Y, right +X, back +Y, top +Z, and oblique (1,-1,0.8) against the original and current sheets.

The generated TOP view is a slightly tilted appearance illustration, not a precision orthographic projection. Dimension text indicates chosen proportions only. Numbers eliminate arbitrary dimensional choices, but matching hair and shape still requires actual model review; do not skip it.
