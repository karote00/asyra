# Sloped Handrail - Vertical End Cut Review

Date: 2026-10-06. Status: v3 geometry approved by the user; commit authorized.
Scope: handrail diagram, numeric geometry interpretation and directly related
documents. No model generation or app work.

## Finding and correction

The user identified that v1's oblique view reads like a rotated rectangular
beam, inconsistent with the intended vertical end cuts of the side profile.
An imagegen v2 attempted to clarify this, but retained ambiguous beam-like
appearance and added an unverified screen-horizontal world datum. It was not
accepted. The old cameras are uncalibrated; no exact old 3D error is inferred
from their pixel angles.

The revised approach creates a new technical diagram directly from the numeric
profile. It does not repaint the old raster or use a generated mesh.
The rebuild source is [draw-handrail-projections.py](draw-handrail-projections.py).
It uses the existing Pillow installation and reads the numeric JSON.

The oblique projection has screen-right basis (2,-1,0)/sqrt(5), screen-up basis
(1,2,5)/sqrt(30), scale 1800 pixels per metre and screen origin (1100,1065).
These are orthogonal unit vectors: the projection does not introduce shear.
The shape's shear comes from the profile itself. Front/back scale is
1400 pixels per metre. World Z is vertical on the image.

The construction triangle separates the projected horizontal 0.30 m run from
the vertical 0.15 m rise. The projected world-horizontal line is intentionally
not screen-horizontal. It and the end-cut leaders are annotations only.

## Numeric and document checks

- XZ vertices remain (0,0), (0.30,0.15), (0.30,0.19), (0,0.04).
- Extrusion remains Y=-0.02..0.02; both end cuts lie in constant-X planes.
- Cut faces remain vertical 0.04 x 0.04 m rectangles.
- Side-face angles are 63.4349488229 and 116.5650511771 degrees.
- Vertical thickness is 0.04 m; perpendicular thickness is approximately
  0.0357770876 m. These two measurements must not be confused.
- Longitudinal edge length is approximately 0.3354101966 m; the horizontal
  run remains 0.30 m.
- RIGHT depicts the full 0.19 m silhouette, not just the 0.04 m end face.
- The numeric JSON geometry and placement are unchanged. Its status now
  reflects an active review instead of implying approval of every sheet.
- The surface document now states that its material is a replaceable default.
- The geometry supplement explicitly prohibits creating a rotated box with
  cuts perpendicular to the longitudinal direction.

## Visual review

Inspected the 1800 x 1200 full sheet and native-resolution oblique detail.
The front and back are mirrored parallelograms; the oblique side has parallel
sloped longitudinal edges and vertical end edges, derived from the same solid.
The low cut, top and side are separate visible faces. The high cut is mostly
occluded from this camera; its visible edge and numerical plane define it.
No claim is made that an occluded face is fully visible.

The labels and construction triangle explain the end/body relationship.
Face tones are diagram defaults, not baked lighting or a material requirement.
This review verifies the drawing construction and documents, not a Blender
model, exported mesh or user approval.
