---
{
  "description": "Declare representative material checks, capture appropriate evidence and preserve independent passes.",
  "contexts": [
    "architectural-illustration"
  ],
  "provenance": [
    "Asyra Design advisory mapping reviewed against current public tool descriptions and schemas."
  ],
  "references": [
    "design.architectural-illustration",
    "design.architectural-illustration.contracts",
    "illustration.architecture.materials"
  ]
}
---

### Representative acceptance before repeating a material decision

Declare sample material/join adequacy separately from complete-drawing coverage.
The following declaration is an executable example, not an additional obligation
for every request. Use stable unit IDs for the actual representative scope. Declare
these choices with the initial criteria; do not rewrite existing judged obligations.
For an existing combined criterion, retain it and make the scoped material finding
explicit without pretending it completed the combined requirement.

```json representative-review
{
  "tool": "define_design_criteria",
  "arguments": {
    "method": "Confirm the chosen material on a representative surface and join before repeating that assumption; evaluate the full drawing separately.",
    "references": [],
    "criteria": {
      "material": {
        "requirement": "The chosen material and intended continuity are visible on the representative surface and join.",
        "description": "Inspect actual glass, overlays and a join at the chosen projection; do not judge material from an empty frame or roof-only crop.",
        "verification": "visual",
        "requiredUnits": ["sample-join"]
      },
      "overall": {
        "requirement": "The complete requested subject and its visible details agree with the requested composition.",
        "description": "Evaluate the entire final drawing independently of the local material sample.",
        "verification": "visual",
        "requiredUnits": []
      }
    },
    "structureCriteria": [],
    "detailRequired": true
  }
}
```

Resolve the created sample's real element ID and target-local visible bounds from
its acknowledged apply receipt/current context. In this executable syntax example,
replace `actual-sample` and `region` with those actual values; do not send a draft
key as a document element ID. The region must show the material and relevant join,
within the current capture limits. Reference pixels, canvas world coordinates and
target-local coordinates are different spaces. For a conclusion needing multiple scales, bind all necessary images, including
an overview and crop of the same target. Every cited image is a dependency; broad
evidence carries broad invalidation. Local-only conclusions cite only their own
necessary images. Preserve the separate whole-result criterion. A valid binding
is not proof that the view covers the requested material or relationship; acquire
additional views when necessary rather than dropping evidence to obtain a pass.

```json representative-capture
{
  "tool": "review_drawing",
  "arguments": {
    "phase": "visual",
    "final": false,
    "inspections": [
      {
        "elementId": "actual-sample",
        "view": "detail",
        "region": { "x": 0, "y": 0, "width": 80, "height": 40 },
        "checks": [{ "criterionId": "material", "unitId": "sample-join" }]
      }
    ]
  }
}
```

Both examples use `design_operations` native tools. Use the exact qualified names
for discovery, `view: usage` for routing, and exact `schemaPaths` only for missing
fields; schema fragments are not whole recipe contracts. Known complete definitions
can be used directly. For genuinely lost definitions use the returned refresh
arguments and actual recovery reason. A `previously-returned` reference alone does
not mean the needed schema is in the current response. Do not look up the catalog
again for each repeated surface, or guess a batch alias for review tools.

Inspect the delivered image yourself as the primary agent. Capture/bind returns
`next.arguments`: fill status/evidence in its checks and submit those exact
bindings to the same tool. Keep criterion, unit and supersession identities.
Capture/bind defaults the returned submission to `final: false`, even if the
capture request used `final: true`. Keep it false for local observations; set
`next.arguments.final: true` on the actual record submission when the complete
candidate is ready. Completion intent is not a bound check identity.
Tools validate mechanics and evidence freshness; they do not decide appearance.

| Actual receipt/state | Next action for this chosen method |
| --- | --- |
| Capture/bind with no `recordedChecks` | No judgment is recorded. Inspect the delivered pixels, then submit the returned binding. Never treat successful capture as material approval. |
| Record succeeded with `unverified` | The choice remains unresolved. If the crop shows the roof rather than the join, obtain the right view and the current check revision, then explicitly supersede the wrong-view result. Do not begin repeating that unresolved choice. |
| Record succeeded with `fail` | Correct the specific material/scope through existing edit tools. Preserve unrelated geometry and passes. Recapture affected evidence and submit its current binding; a detail failure never supplies a missing material verdict. |
| Exact local criterion/unit is current `pass`, while `accepted: false` | Reuse that verdict for the unchanged choice; dependent repetition may proceed. Read `coverage.pending` for unfinished whole-result obligations, not as a reason to re-review the sample. Do not claim the entire request passed. |
| `stale`, rejected binding, unavailable image or cancelled exchange | Recover the failed boundary. Rebind good retained images when possible; otherwise capture affected regions. Read exact check IDs/current revisions after uncertain delivery. Never assume a pass or replay drawing writes to recover evidence. |
| Complete candidate ready | Judge `overall` with actual images and set `final: true` on the record submission, not merely on capture. If already recorded non-final, bind retained whole images again and submit completion without recapture. Retained current local passes accumulate; this attempt cannot silently discard another obligation. |

Match every `recordedChecks` entry by criterion/unit/status/revision; transport
success alone proves none of these. `countsScope: request-checks` combines retained
checks, while `selected-checks` describes only the selected checks. Neither count
nor a mechanical pass proves appearance. A changed dependency reopens only its
affected units; independent passes remain. New independent parts may proceed at
any point. User-directed exceptions or valid alternative methods remain explicit
design choices, not blocked actions. This guidance never creates an approval token,
Knowledge prerequisite, fixed review quota or additional model reviewer.

Recover at the failed boundary. A missing template is a preparation input error:
when a `draftId` was retained, use it with `repair.replacements`, then use the new
successful `artifactId`. Replacements require an existing JSON Pointer: for a missing template
key, replace the existing `/fillTemplates` object while preserving its other entries,
or replace an existing assignment with a valid reference. Do not target a missing
property as though replacements were insertions. If the entire `fillTemplates`
property is absent, replace an existing child assignment with an inline Fill,
or submit the corrected source draft containing the map. The same absent-pointer
rule applies to `/fillTemplates` itself; do not keep retrying that replacement.
Retained rejected drafts and successful artifacts are different handles. Keep
prior valid artifacts; do not overwrite one by guessing an ID. If a rejected
`draftId` is unavailable, resend its corrected source for preparation. If targeting
an already drawn part loses its prepared artifact, query the current document for
that part and use current element IDs/retained targets. Do not prepare and apply a
new copy to recover old target keys. First resolve the actual mutation settlement:
unknown outcomes are not evidence that nothing was drawn. A valid but visually
unsuitable material is a scoped design edit using current target identities; a
failed evidence capture requires new evidence, not drawing the part again. Partial/unknown execution outcomes must be resolved from their receipts
before another write. If the representation is unsupported, retain the working
result and state the capability limit rather than substituting a different effect.

### Relevant capability handoffs

| Intent/data already available                   | Existing consumer                                                                                                                         | Required handoff and limit                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mechanical check/repair                         | review_design -> actual mechanicalSelection -> verify_design_checks; repair_design_checks only for supported prescribed-position overflow | No extra model. The repair tool is not an automatic architectural designer, color chooser or general geometry fixer. Unsupported findings return to the primary agent.                                                                                                                                                                                                                                                                                    |
| Visual decision and accumulated results         | review_drawing and read_design_checks                                                                                                     | Whole-view criterion and local units use separate appropriate evidence. Carry returned bindings/next fields; submit new decisions only for affected units. Capturing images is not recording a pass. Unchanged valid passes remain stored; real shared dependencies may invalidate multiple units. Default check reads give counts/firstPendingId; use exact ids or revision-bound detail pages for evidence, retaining the page revision until complete. |
