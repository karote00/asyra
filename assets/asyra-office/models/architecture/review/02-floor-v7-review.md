# Floor Plank - Natural Grain Revision

Status: self-review complete; drawing and independent PNG approved for commit
by the user on 2026-10-06. Reference shadows are not required for this component.

## Scope

The user requested restoring the original natural wood grain while retaining
the dimension-driven drawing. They also authorized an independent PNG so the
app can change floor materials without changing geometry.

- [Current sheet](02-floor-v7.png), [editable sheet](02-floor-v7.svg), and
  [projection data](02-floor-v7.json).
- [Standalone material](../materials/floor-natural-oak-v1.png) and
  [mapping contract](../materials/README.md).
- [Original grain crop](02-floor-original-grain-reference.png), extracted from
  floor v2 at x=68, y=663, width=865, height=105; it retains the rejected knot
  as source evidence only.
- [Generated texture source](02-floor-natural-oak-albedo-v1.png), 2170 x 725.
- [Grain inspection](02-floor-v7-grain-detail.png), unretouched 3x crop.
- [Short-end inspection](02-floor-v7-side-detail.png), unretouched 6x crop.

## Review

Compared projection metadata directly with v6: physical dimensions, scale,
orthographic corners, ratios, oblique camera and bevel representation are
unchanged. Only material sampling changed. The script still reads the same
canonical floor dimensions, 1.2 x 0.18 x 0.025 m.

Inspected the full texture, whole sheet and enlarged grain/end crops. The grain
has irregular spacing and natural longitudinal flow. The original distinctive
oval knot is absent from the selected patch; short ends are uniform. This is a
reference-guided texture revision, not a pixel-identical copy of the old grain.
No lighting or shadows were added. The 1 mm bevel remains a numeric annotation
on an outer-envelope drawing, not a rendered bevel validation.

The old regular-stripe formula in SURFACE-RECIPES.md was replaced with the PNG
mapping contract. Floor v6 remains historical evidence and is not approved
material authority. After user approval, the canonical reviewDrawing pointer
was advanced to floor v7. No Blender model approval is implied.

## Texture edit prompt

Use case: precise-object-edit.
This input is a cropped material swatch from the user's selected wooden floor plank. Edit ONLY its wood grain. Preserve the pale honey oak color, natural irregular longitudinal flow, fine fibrous details and variation in line spacing and contrast.
Remove the enclosed oval knot/eye on the right side completely, replacing it with continuous gently flowing open lengthwise grain that matches the surrounding wood. Remove all knots, enclosed eyes, concentric rings, knots indicated by dark centers. Keep natural NONUNIFORM grain: many fine irregular flowing lines with variable spacing, thickness and gentle curvature. Do not replace it with evenly spaced straight stripes, a repetitive sine pattern, or a flat solid color.
Deliver one full-bleed rectangular albedo texture swatch, horizontal grain running left to right, preferably retaining the input's very wide strip aspect. No board edges, no thickness, no white background, no text or labels, no borders. Uniform diffuse material color only, no lighting gradients, highlights, cast shadows, contact shadows, ambient occlusion, bump effects or darkened edges. It will be mapped onto an existing dimension-driven drawing; do not draw a board or multiple views.
