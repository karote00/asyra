# Asyra Office - Group 4A - Basic Furniture

Status: **The user approved committing drawings/documents for five items; models have not been verified.** Group 4 decoration contains many items and is split into small batches as agreed. This is its first batch.

## Five items

| One unit | Source location | Width × depth × height (m) | Multiview sheet |
| --- | --- | --- | --- |
| Wooden writing desk | Laptop desk on the central office's left | 1.20 × 0.60 × 0.65 | [Desk](review/01-desk-v1.png) |
| Work chair | Partly hidden behind the laptop worker | 0.42 × 0.46 × 0.70 | [Chair](review/02-work-chair-v1.png) |
| Two-seat sofa | Green sofa in the lower-right office | 1.35 × 0.65 × 0.70 | [Sofa](review/03-sofa-v1.png) |
| Lounge armchair | Orange chair beside the green sofa | 0.62 × 0.61 × 0.69 | [Armchair](review/04-armchair-v1.png) |
| Round coffee table | Wooden table in front of the green sofa | 0.62 × 0.62 × 0.32 | [Table](review/05-coffee-table-v1.png) |

Each has front, right, back, top, and oblique views. Legs and structural seat/back cushions belong to the furniture unit. Yellow throw pillows, laptops, mugs, rugs, and plants remain separate.

## Sources and modeling inputs

- [Original approved image](../architecture/review/approved-office-reference.jpg): central office first.
- [Geometry](GEOMETRY-SUPPLEMENT.md): parts, bevels, surfaces, joins, undersides, and backs.
- [Machine-readable dimensions](furniture-model-spec.json): part sizes, coordinates, materials, and seat heights.
- [Surface recipes](SURFACE-RECIPES.md): wood grain, solid fabric colours, and no baked lighting.
- [Sheet index](review/README.md) and [actual prompts](review/PROMPTS.md).

Hidden leg counts, support structure, backs, and all metric dimensions are explicit completions, not single-image measurements. The work chair is most obscured; review its four-leg, armless design. The table is defined as circular with three legs; source perspective does not precisely resolve circle/ellipse or underside structure.

Sheets guide appearance and numeric documents define reproducible construction. Generated views are not calibrated projections. Image shading/dimension text does not override numeric specifications; future models still need multiview comparison.

## Later Group 4 batches (not produced here)

- Pantry: refrigerator, water dispenser, sink cabinet, coffee equipment, snack cabinet.
- Storage and walls: bookcases, wall shelves, clocks, hangings, wall accessories, ambient lights, and modular wallpaper.
- Other furniture and flooring decoration: round tables, other desks/chairs, L-shaped and curved sofas, rectangular/round rugs, separate throw pillows.
- Work and everyday objects: laptops, mugs, and similar items.

This batch contains images/documents only, with no Blender, GLB, rigging, animation, or app features. The app owns counts, placement, lighting, seat usage, and interaction. Animals and Group 5 small plants are excluded.
