> Historical revision 1 numeric audit. Its 1,744-leaf counts, size range and sampled
> envelope are superseded by foliage revision 2 in TREE-CONSTRUCTION.md and
> tree-construction-spec.json. Reference images remain unchanged. This historical
> audit is not the current assembly recipe or a rendered-model approval.

# Street Tree - Document Review

Updated 2026-10-08. Scope: tree-only construction data, its mathematical guide,
branch inventory and direct documentation consumers. The user delegated the
remaining geometric decisions. The selected drawings remain unchanged.
This review covers numeric and document consistency; no Blender process, mesh
extraction, image generation, runtime test or visual model approval is included.

## Construction decisions now fixed

- One closed rounded leaf: four cubic boundary arcs, radial front/back surfaces,
  100 x 58 mm nominal size, 1 mm local-Z shell translation and 3 mm front bulge.
  The illustrated SIDE arch is not a calibrated section.
- Seven trunk stations with cubic Hermite centreline interpolation and linear
  radius interpolation; ground diameter 0.23 m and trunk height 2.55 m.
- Seven primary and thirteen secondary branches, explicit parents and attachment
  parameters, quadratic curves and tapered radii. B7 is attached to B11.
- One implicit wood surface with numeric local junction blending, capped ends,
  a flat ground base and adaptive extraction tolerances for small branches.
- Twenty-three foliage groups with fixed frames, centres, radii and counts;
  five offset subgroups, small/medium/large size rules, orientations and seeded
  palette groups. One shared prototype supplies all 1,744 instances.
- Material defaults and independent replacements, with no baked scene lighting.

The old six-plus-six branches, twelve foliage guides, 0.75..1.15 scale range and
undefined leaf contour/junction notes no longer govern construction. The complete
contract is [TREE-CONSTRUCTION.md](../TREE-CONSTRUCTION.md), backed by
[tree-construction-spec.json](../tree-construction-spec.json).
Prompt logs retain historical wording with a clear superseding notice.

## Numeric self-review performed

An inline read-only calculation evaluated the current JSON and documented
formulas. It did not write a generator or build/export a model.

| Check | Result |
| --- | --- |
| Unique branch IDs and hierarchy | 20 unique, 7 primary and 13 secondary, maximum depth 2 |
| Required B7 connection | Parent B11, attachment t=0.68, parent continues to t=1 |
| Radii | Every child root is thinner than its local parent; every tip is positive and smaller than its root |
| Leaf boundary | Closed CCW boundary; nominal X/Y extents 100 x 58 mm |
| Leaf shell bounds | Local Z=-1..3 mm; total height 4 mm, not 1 mm |
| Default leaf mesh arithmetic | 66 vertices before normal splits, 128 triangles, no zero-area triangle, each edge paired with opposite winding |
| Group totals | 7*96+13*64+3*80=1,744 instances across 23 groups |
| Instance frames | Finite orthonormal bases with outward-handed orientation |
| Deterministic scale extrema | 0.300056..1.199705, within the authored 0.30..1.20 range |
| Palette assignment counts | Olive 756, pale 546, deep 442; independent of lighting |
| Document links | Current relative links resolve; selected image files exist |
| Language | Updated construction documents contain English content |

Default prototype vertices transformed through all 1,744 instance transforms
have foliage bounds (-1.162371,-0.590449,1.027252) to
(1.103003,0.660429,3.087672) m. This is the default sampled leaf mesh, not a
measurement of a rendered canopy or an exact bound of an infinitely refined
surface. It fits the maximum assembly envelope of 3.00 x 1.90 x 3.55 m.

Each branch curve and radius was evaluated at 101 parameters. Sampled swept-ball
extrema, before junction blending and excluding the trunk, are
(-1.094000,-0.483578,0.945000) to (0.987000,0.521938,2.940914) m. These are
sample checks, not a proof of the extracted wood surface's bounding box.
The smallest terminal radius is about 0.914499 mm. The guide therefore requires
adaptive cells no larger than one third of the local fine-feature radius, rather
than using a coarse uniform grid that could erase a tip.

## Review boundary

The numeric contract can now be translated into tool inputs without inventing
leaf curves, branch parents, missing depth, taper, junction widths or leaf
placement rules. The authored hidden geometry is a design decision under the
user's delegation, not recovery of an unknown original source model.

Actual fused topology, model silhouette, visual cluster density, materials under
scene lighting and runtime LoD have not been evaluated. They require the future
model and its multiview/close-up review. All reference pictures stay available as
visual acceptance targets. Do not label document consistency as model acceptance.

The default master foliage contributes 223,232 triangles before wood. Shared
geometry reduces storage; it does not remove triangle cost per visible instance.
No runtime performance or export-size approval is claimed in this document task.
