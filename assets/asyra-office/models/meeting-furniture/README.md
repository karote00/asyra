# Group 4X - Meeting Table and Whiteboard

Status: original reference sheets approved; meeting table document revision approved by the user for commit; whiteboard document revision approved by the user for commit. No model verification.

Two independent assemblies: one wooden meeting table and one blank wall-mounted whiteboard with its marker tray. No chairs, writing, markers, eraser, laptop, wall or surrounding room.

The table follows the broad rectangular silhouette in the approved office image's Meeting room thumbnail and the central office's warm wood palette. The thumbnail cannot establish precise dimensions or hidden joints; these are authored completions. The whiteboard is a supplementary authored design, not a clearly identifiable source object.

## Handoff

- [Review gallery](review/README.md)
- [Geometry supplement](GEOMETRY-SUPPLEMENT.md)
- [Surface recipes](SURFACE-RECIPES.md)
- [Numeric specification](meeting-furniture-model-spec.json)
- [Actual prompts](review/PROMPTS.md)

Numbers resolve dimensions and hidden geometry. The whiteboard v2 RIGHT inset is numerically projected; other drawing views
are appearance references rather than calibrated projections. No models, Blender work, interaction, animation, or app implementation. The table revision is committed; whiteboard v2 and its revised documents are approved by the user
for commit. Model verification remains a future stage.

## Current meeting table document review

The [meeting table construction contract](MEETING-TABLE-SPEC.md) preserves the
original part dimensions, palette and drawing. It completes exact flush joints,
corner sampling, nine replaceable regions, whole-unit sizing and analytic LOD
budgets. The whiteboard remains outside this revision. Run the permanent checks
listed in that contract; an actual model and its appearance are not verified.

## Current whiteboard document revision

The [whiteboard construction contract](WHITEBOARD-SPEC.md) preserves
original bounds and defaults, adds four exact mitered frame profiles, and defines
seven regions, thirteen contacts and shared geometry for all LOD tiers. The v2
sheet corrects the RIGHT inset from numeric bounds while preserving all other
view pixels. Original v1 is source history only. Revised documents and image are approved by the user for commit;
no actual model is verified. The approved table contract is unchanged.
