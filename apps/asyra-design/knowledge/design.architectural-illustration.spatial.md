---
{
  "description": "Resolve floating joins, coordinate-basis confusion or incorrect overlap: distinguish geometry from painter order, group-level from child-level occlusion, and reference evidence before choosing a correction.",
  "contexts": [
    "architectural-illustration"
  ],
  "provenance": [
    "Asyra Design advisory mapping reviewed against current public tool descriptions and schemas."
  ],
  "references": [
    "design.architectural-illustration",
    "design.architectural-illustration.contracts",
    "illustration.architecture.spatial"
  ]
}
---

### Spatial relationships to evidence

For connected geometry, keep one chosen projection and a common world basis.
Use supplied world faces through preparation instead of calculating projected
vertices by hand. A contact requires coincident geometry in that basis; changing
painter order cannot close a physical gap. For valid overlapping geometry with
wrong visibility, adjust order using current identities instead of rebuilding.
Tools project declared geometry; they do not infer unknown attachments or remove
hidden faces. Reference detail does not establish unseen dimensions.

For additions to an existing part, `prepare_and_apply_design.parentId` accepts
parent-local coordinates. Returned compositionId identifies the new part; use
`parentPart` to attach a later entry to an earlier entry in the same parts request.
If geometry is already expressed in world coordinates, account for the parent's
transform before choosing direct attachment. Merely changing parentId changes the
coordinate basis. Existing `hierarchy.moveElementsRelative` places elements before
or after an anchor through geometry-preserving moves; it can avoid rebuilding
geometry when grouping or order is the only issue.

A group capture includes that group's content, not nearby siblings. To judge an
overlap across branches, select their common concrete ancestor and a target-local
region, or inspect the relevant images together. Workspace overview is available,
but workspace detail/region is not. Keep the capture scope tied to the decision;
there is no need to regroup the drawing just to inspect it.

For an occluded detail, identify both the covered element and the occluder in the
current hierarchy before choosing the move. Moving a whole group changes its
order against sibling groups; it does not change paint order among its children.
If both elements are inside one group, move the intended child or child set
relative to the actual occluder. If the occluder belongs to another group, compare
their containing branches and choose the smallest move that gives the intended
overlap without disturbing unrelated details. Both cases can coexist: after a
partly successful repair, identify the remaining occluder instead of repeating
the same group move. Inspect the affected region; reuse unrelated current evidence.
This diagnosis is optional advice for ordering uncertainty, not a required drawing
stage, extra detail target or instruction to retrieve Knowledge on every edit.

When references leave a spatial choice uncertain, distinguish visible evidence
from assumed geometry. Optional draft.brief.assumptions can retain the chosen
placement, contact/separation and overlap. Image identities and source-local crop
coordinates belong to image access; authored purpose/limitations are notes.
No reference-use approval or criterion registration is needed. An ornament close-up
does not establish unseen tower geometry. Inspect the affected relationship and
the final result against the user's request; use another view only when necessary.
