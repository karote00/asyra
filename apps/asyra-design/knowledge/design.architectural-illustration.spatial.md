---
{
  "description": "Select reference uses and inspect spatial relationships using correctly scoped evidence.",
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
