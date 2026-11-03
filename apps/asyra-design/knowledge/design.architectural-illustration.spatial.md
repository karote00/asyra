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
region, or bind the relevant images together. Workspace overview is available,
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

When reference-supported spatial choices are open, distinguish the requested
subject from its surroundings and uncertain attachments. Put the chosen placement,
extension, contact/separation and overlap in existing `draft.brief.assumptions`.
For a relationship important to the request, give existing criteria a distinct
requirement from local detail completion. Do not turn every piece of advice into
a new required check or replace already valid criteria during a drawing.

After selecting a source through `select_design_references`, carry the returned
visual-use receipt in `referenceUses` on the applicable `review_drawing` inspection
check or binding. Match its criterion, optional unit and purpose. A use selected
for ornament detail cannot authorize a massing comparison. If that comparison is
needed, select a matching use explicitly and obtain its current receipt. Read
actual image-region coordinates from the source contract; they are not drawing
world or parent-local coordinates. Keep limits of a coarse reference explicit.

Choose an actual composition/region containing both related masses and their
contact/overlap, not only a doorway. Submit the primary agent's relationship
judgment separately from the detail judgment using returned `next` bindings.
An entrance-detail pass does not complete a separately declared massing criterion.
Omitting reference uses means reference-free evidence, not an implicit comparison
to all selected images. Reference-free user requests remain supported.

If a crop fails, keep existing drawing and unrelated passes; retry the capture
with the correct current target/scope. If a source use changes, fetch its new
receipt and rebind only affected checks. A changed check scope needs the current
`supersedes` revision/reason. Never reuse a stale binding or replay a drawing write
to recover missing evidence. Tools validate these declared relationships; they do
not decide whether the building looks correct or whether Knowledge was followed.

### Relevant capability handoffs

| Intent/data already available                   | Existing consumer                                                                                                                         | Required handoff and limit                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use a reference for massing or a local ornament | validate_reference_images -> select_design_references -> record_design_facts                                                              | Validation confirms usable asset evidence, not aesthetic suitability. Primary agent declares exact use/region/limitations and carries returned referenceUses. Derived numbers go to record_design_calculations; neither fact storage nor calculation approves drawing quality.                                                                                                                                                                            |
| Correct occlusion                               | Existing hierarchy.moveElementsRelative operation through batch                                                                           | Use actual returned element/anchor IDs, preserve geometry, and check intended overlapping region. Save returned outcome before deciding whether a retry may write again.                                                                                                                                                                                                                                                                                  |
