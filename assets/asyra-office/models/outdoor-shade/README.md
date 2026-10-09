# Group 4AC - Garden Parasol and Base

Status: user approved the parasol procedural-generation specification and defaults for commit on 2026-10-10. Original drawings and separate base remain unchanged. No generator or model has been implemented.

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
geometry, not repeated illustrative redraws. The separate base is the next unit.
