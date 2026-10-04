# Wireless Mouse - Geometry Supplement

## Coordinates

Use metres, +Z up, -Y front and +X right. Origin is the bottom footprint centre. Apply identity rotation and unit scale. Front looks along +Y, right along -X, back along -Y, top along -Z and bottom along +Z.

The shape is symmetric about both X and Y. Numerical surfaces define geometry; drawings are uncalibrated appearance references. The three-quarter sketch is illustrative and must not flatten the specified dome.

## Upper shell

Use the upper half of an ellipsoid centred at (0,0,0.004), with radii (0.030,0.050,0.026). Parameterization:

- X=0.030*cos(t)*cos(a)
- Y=0.050*cos(t)*sin(a)
- Z=0.004+0.026*sin(t)

Sample azimuth a=2*pi*k/64 for k=0..63. Sample t=j*pi/24 for j=0..11, then use one pole vertex at (0,0,0.030) for t=pi/2. Join adjacent rings with quads and the final ring to the pole with triangles.

There is no flat top plateau, seam, button split, wheel, logo or printed mark.

## Base and hidden bottom

Continue the shell's equator ring vertically to Z=0 using the same ellipse coordinates and 64 vertices. Close the bottom ellipse with a centre triangle fan. The base is a 0.004-high elliptical cylinder. Its side and bottom are gray.

The shell and base share the equator ring. Build one closed exterior, with no duplicate internal disk at Z=0.004. Smooth curved surface normals, keep the bottom flat and keep the lower edge crisp. No bevel or subdivision.

Overall bounds: X=-0.030..0.030, Y=-0.050..0.050, Z=0..0.030. The underside is intentionally plain: no sensor opening, switch, feet, fastener, charging port or battery lid. These are explicit simplifications, not recovered product details.

## Placement and future acceptance

Place the origin at the supporting surface elevation. The app owns position, orientation, interaction and animation.

After modeling authorization, verify bounds within 0.0002 m, the ellipsoid profile, base height, closed bottom, material boundary and lack of unintended parts. No reconstruction, export or runtime verification has occurred. No alternate LOD mesh or click animation is included.
