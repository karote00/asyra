# Floor Plank - Shape Correction Review

Status: self-review failed; not approved. Numeric specification remains unchanged.

## Scope and reference

Correct the existing floor plank sheet against `../architecture-model-spec.json`:
1200 x 180 x 25 mm, 1 mm inward bevel, longitudinal grain on top and long
sides, plain oak short ends, no knots. No reference shadows at this stage.
The current approved source remains `02-floor-v2.png` until user review.

## Result

Candidate: `02-floor-v5.png`. Generated with the built-in image generation tool.
Three attempts improved thinness and removed the short-end grain, but did not
fully satisfy the requested proportions and knot-free surface.

Visual inspection found an eye-shaped grain formation remaining on TOP.
`02-floor-v5-grain-detail.png` is an unretouched inspection crop at x=560,
y=610, width=290, height=180, enlarged three times with sips.

Colored-interior pixel bounds (not calibrated physical measurements):

| View | Interior size (px) | Interior ratio | Required geometric ratio |
| --- | --- | --- | --- |
| FRONT | 872 x 17 | 51.294 | 48 |
| SIDE | 121 x 18 | 6.722 | 7.2 |
| TOP | 872 x 126 | 6.921 | 6.6667 |

The raster outline and antialiasing affect these interior measurements,
especially on the thin edges. They do not establish exact geometric acceptance.
SIDE remains narrower than the width shown in TOP at the shared scale.
No specification values were changed to accommodate the generated image.

## Proposed next method

Stop repeated prompt-only correction. Use dimension-driven 2D orthographic
drawings and an oblique projection from the same box dimensions, with controlled
lengthwise surface strokes. This method has not been executed; obtain user
agreement to the drawing-method change first. Do not model in Blender or
add shadows during this shape-review step.

## Final generation prompt

Redraw this architectural floor plank multiview reference from scratch using the image only for the warm pale oak color and clean sheet style. DO NOT COPY ITS WOOD TEXTURE. Its oval wood knot is an error that must be removed.

Create one coherent thin solid wood plank, 1200 mm long, 180 mm wide, 25 mm thick. Edges only 1 mm radius. Four views on white:
FRONT: long very thin rectangle exactly 48:1 aspect ratio, zero top face visible.
SIDE: short thin rectangle exactly 7.2:1 aspect ratio, zero top face visible.
TOP: long rectangle exactly 6.6667:1 aspect ratio, zero side faces visible.
THREE-QUARTER: slender solid plank corresponding to those same dimensions.

Orthographic front and top lengths both 960 pixels, front height20 pixels, side144 by20 pixels, top960 by144 pixels. Use a clean 2x2 sheet arrangement that fits these views without overlaps; side view must not be enlarged. Fine outline strokes only.
Title "FLOOR - ONE PLANK". Four labels "FRONT", "SIDE", "TOP", "THREE-QUARTER".

Entire NEW material treatment: pale honey oak with ONLY extremely subtle straight parallel lengthwise hairlines in top and long sides. No wavy looping grain. NO KNOTS, NO EYES, NO OVALS, NO CONCENTRIC FORMS whatsoever. Uniform plain pale oak on the short end faces. Do not reuse the reference texture. No strong contrasting lines, no engraved channels, no layers, no protrusions.
No shadow, no ambient occlusion, no highlight or lighting gradients, no ground, no dimension arrows. This is the same design with numerically corrected proportions and freshly simplified grain, not a new furniture design.
