# Street Lantern - Recalculation and Document Review

Date: 2026-10-08. Scope: the lantern module, its geometry/appearance contract and
direct document references. The user requested a complete dimension recalculation
and explicit replaceable appearance. The existing PNG remains unchanged.
No model, render, runtime test, commit or push is part of this review.

## Corrections

The old 0.38 m eave, 0.28 m foot and 0.074 m shaft were too slender relative to
the FRONT drawing. Retaining the authored total height of 2.74 m, the new eave
is 0.53 m, foot maximum diameter 0.44 m and shaft diameter 0.16..0.15 m. These
are rounded decisions from approximate image proportions, not recovered CAD.
[LANTERN-SPEC.md](../LANTERN-SPEC.md) records pixel landmarks and the conversion.

All component height ranges were reconsidered together. The head frame now spans
Z=1.940..2.400, the roof reaches 2.575, and the finial ends at 2.740 m.
Frame openings, L-section posts, the support tray, concealed glass seats and
roof inner planes are explicitly defined. Curved profiles use a fixed Hermite
rule; the finial continues tangentially into a spherical top.

The upper collar uses the structural dark default, matching FRONT; only the
lower collar uses the accent default. All twelve parts/panes support independent
colour and complete material replacement. Three disjoint convenience groups
cover structure, accent and panes. Replacement never changes geometry or another
instance. No illumination is baked into default materials.

## Numeric self-review

An inline read-only calculation evaluated the authored formulas against the JSON:

- Each lathe interval was sampled at 101 positions: all radii are positive and
  remain between interval endpoint radii, including the finial's overridden
  final derivative. Maximum foot diameter is exactly 0.440 m.
- The finial profile and sphere agree in position and derivative at Z=2.680.
  Sphere centre 2.692 plus radius 0.048 gives total height exactly 2.740 m.
- Frame and pane widths agree. Pane bottom/top widths are
  0.2564782609/0.3776086957 m, with four independent solids.
- The front pane's back translation has Y=0.002965856512 m and
  Z=0.000451325991 m. Vector length is exactly 0.003 m; its direction is the
  inward face normal. The panel remains inside the available seating depth.
- Glass embeds 4 mm under the rails and behind the corner posts. The back-face
  Z shift stays below the frame top and above the solid tray. Adjacent pane
  solids remain separated by the corner posts.
- The roof cavity stays positive and inside the outer roof. Its half-width
  is 0.253 m at the lower cavity plane and 0.0860305575 m at its upper plane.
  The 12 mm side/hip offsets and 12 mm top/bottom closures are explicit.
- The roof meets the frame at Z=2.400, the neck meets the bottom tray at
  Z=1.940, and the finial meets the roof peak at Z=2.575. Finial base diameter
  matches the peak-square side. Roof overhang is 45 mm on each side.
- All twelve appearance defaults resolve to existing material definitions;
  each part occurs in exactly one convenience group. Existing shared palette
  values and every non-lantern module remain unchanged.

JSON parsing, local document links, English content and scoped whitespace/diff
review accompany this numerical review. These calculations evaluate specifications,
not an extracted mesh. Future modeling must still check actual closed surfaces,
bevels, contact faces, materials, silhouette and close-up appearance against the
unchanged reference. No visual-model or runtime-performance approval is implied.
