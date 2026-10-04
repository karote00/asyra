# Empty Pots - Geometry Supplement

## Coordinates and deterministic construction

Use metres, +Z up, -Y front and +X right. Origin is the revolution axis at Z=0, the bottom contact plane. Each JSON profile is an ordered polygon in (radius,Z). Close its last vertex to its first, then revolve around Z with 96 equally spaced angular segments beginning at +X. Connect consecutive profile rings with quads and wrap the final angular column. If triangles are required, use the same lower-index-to-upper-opposite diagonal for every quad.

All radii are positive. The closing profile edge creates the cylindrical drainage-hole wall, not a solid centre. Do not cap across the central hole or the open pot mouth. This construction yields a closed material shell surrounding an open cavity and a through-hole, without requiring a solidify modifier or a Boolean approximation. Use outward-facing normals, smooth around the circumference and hard normals at profile corners. Do not add extra bevels; the specified chamfer segments already define edge treatment.

## Terracotta pot

Outer contact radius is 0.090 at Z=0. The lower chamfer reaches radius 0.093 at Z=0.003. The main outer wall tapers linearly outward to radius 0.126 at Z=0.205. The projecting collar spans Z=0.205..0.240, reaching radius 0.140. Its upper and lower outer chamfers are 0.004.

The top opening radius is 0.120, followed by an inner lip chamfer to radius 0.116 at Z=0.236. The inner wall stays at that radius to Z=0.218, then tapers to radius 0.080 at Z=0.014. The flat inner floor runs from radius 0.080 to 0.006. The radius-0.006 drain wall connects the floor directly to the underside, giving one through-hole of diameter 0.012 and floor thickness 0.014.

Do not add a separate collar object, hidden ridge, foot ring, recess, logo or saucer. The collar and body form one continuous terracotta shell.

## Ivory ceramic pot

Outer contact radius is 0.075 at Z=0, transitioning to radius 0.078 at Z=0.003. The main exterior reaches radius 0.097 at Z=0.166. The narrow upper lip reaches radius 0.100 between Z=0.169 and 0.177, returning to radius 0.097 at top Z=0.180.

Opening radius is 0.092; the inner lip chamfer reaches radius 0.089 at Z=0.177. After Z=0.170 the inner wall tapers to radius 0.069 at floor Z=0.010. The floor extends inward to radius 0.005, then the cylindrical hole wall descends to Z=0. One drain diameter is 0.010. No foot ring or separate bottom insert.

## Views and hidden surfaces

Front, right and back have the same rotational silhouette. Exact horizontal orthographic elevations do not reveal the inner floor; slight elevated drawing views are illustrative. Top views show concentric rim, interior and a central through-hole. The oblique view may occlude the drain behind the front wall; do not move the drain to make it visible. Bottom view is an annular flat surface with one central hole, using the same material as the body.

The drawings' internal contour circles describe construction rather than painted rings. No internal shading should become a colour gradient or dark cavity material.

## Future acceptance

After separate modeling authorization: bounds and profile vertices within 0.0005 m; one open mouth, one genuine through-hole, correct collar/lip shape, continuous manifold material shell with no filled cavity, duplicate faces or unintended caps. Inspect all five views and the underside. No model has been made or verified in this batch.
