# Group 4AC - Garden Parasol and Base

Status: user approved the parasol procedural-generation specification and defaults for commit on 2026-10-10. Original drawings remain unchanged. The user approved the base construction and resized-fit notes for commit on 2026-10-10. No generator or model has been implemented.

Two independent units: one open garden parasol, including canopy/pole/ribs, and one separate socket base. Neither includes furniture, people, ground, or the other unit.

These are supplementary authored designs using the warm office palette, not clearly identifiable source-image objects. The parasol has one fixed open state; folding geometry and mechanisms are not included.

## Handoff

- [Review gallery](review/README.md)
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md)
- [Surface recipes](SURFACE-RECIPES.md)
- [Numeric specification](outdoor-shade-model-spec.json)
- [Actual prompts](review/PROMPTS.md)

Numbers define dimensions and concealed surfaces. Images communicate appearance rather than calibrated projections. No models, Blender work, app placement, animation or physical stability validation. Approved for this reference handoff; model verification remains a future stage.

## Parasol production route

Generate three groups directly in code: a main pole, eight equal-length ribs
spaced every 45 degrees, and triangular canopy panels sharing their root and
adjacent endpoints. Expose pole length, branch length and downward branch angle;
derive canopy dimensions and joins from these inputs. Canopy, pole and ribs
accept independent colour/material overrides. Blender is unnecessary for this
specified construction. The geometry supplement defines thickness, tip trimming,
clearances, valid parameter combinations and interaction with overall XYZ sizing.

Default 1.80 m refers to opposite canopy vertices. With the TOP-matching
22.5-degree orientation, the X/Y bounds are 1.662983158520316 m, not 1.80 m.
Keep the original reference; further visual acceptance concerns generated
geometry, not repeated illustrative redraws. The separate base remains an independent unit.

## Base construction and fit notes - 2026-10-10

Generate the base as one connected stepped solid with a blind bore. Remove the
internal disk/socket interface while preserving the open passage and 15 mm
closed floor. Default dimensions remain 420 x 420 x 240 mm, socket diameter
70 mm and bore diameter 37 mm. Numeric dimensions take precedence over the
larger relative opening illustrated in the retained source sheet.

The 1 mm radial gap applies only to the default pairing. Independent XYZ
resizing requires a new fit check; do not silently resize either component.
See the geometry supplement for aligned-axis formulas, polygonal clearance
and assembly conditions. This revision does not implement a generator or
placement behavior and does not certify a rendered model.
