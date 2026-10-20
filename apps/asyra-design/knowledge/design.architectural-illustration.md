---
{
  "description": "Apply architectural illustration methods through existing Design preparation, scoped editing and evidence tools",
  "contexts": [
    "architectural-illustration"
  ],
  "references": [
    "illustration.architecture"
  ],
  "provenance": [
    "Asyra Design advisory mapping reviewed against current public tool descriptions and schemas."
  ]
}
---

# Architectural illustration in Design

## What

Apply relevant architectural methods through existing registered capabilities.

## Why

Design decisions belong to the primary agent; deterministic projection, expansion,
queries and supported checks belong to tools. Avoid re-deriving their results.

## How

This section is Asyra-specific advisory application guidance, not a duplicate API
schema or permission source. The current discovered contract always owns exact
arguments, output identities and recovery. Shared modules contain no Asyra tool
names. Select the representation from the data already available, rather than
reconstructing geometry or retrieving the entire catalog.

| Intent/data already available                   | Existing consumer                                                                                                                         | Required handoff and limit                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use a reference for massing or a local ornament | validate_reference_images -> select_design_references -> record_design_facts                                                              | Validation confirms usable asset evidence, not aesthetic suitability. Primary agent declares exact use/region/limitations and carries returned referenceUses. Derived numbers go to record_design_calculations; neither fact storage nor calculation approves drawing quality.                                                                                                                                                                            |
| Draw a ready part from chosen world faces       | prepare_and_apply_design with projection + projected-face                                                                                 | Choose the camera and geometry once; tool projects supplied geometry and applies canonical parent attachment. No automatic perspective, hidden-face removal or depth ordering. Already projected 2D outlines remain vectors.                                                                                                                                                                                                                              |
| Expand regular facade detail                    | Same main tool with surface-grid boundary, normalized motifs, rows/columns and order                                                      | Backend owns expansion. Respect the actual four-corner surface contract and cell-major/motif-major semantics. Do not send a list of every projected window corner.                                                                                                                                                                                                                                                                                        |
| Repeat a compatible motif                       | `pattern.faces` + `origin`/`axes`, or `vector-pattern.template` + placements                                                              | Read exact selected schemas. These are not arbitrary 3D instancing or arbitrary function execution. Confirm supported transformations and split genuinely different motifs.                                                                                                                                                                                                                                                                               |
| Correct existing local objects                  | execute_design_batch with a known contract and scoped target.query, or retained targets; discover only missing fields/routes              | Bounds plus relevant semantic/ancestor filters identify affected content. Query-bound argument slots are omitted, even empty placeholders. Respect expectedCount failures; do not increase expectedCount blindly. Prefer edits over reconstruction.                                                                                                                                                                                                       |
| Correct occlusion                               | Existing hierarchy.moveElementsRelative operation through batch                                                                           | Use actual returned element/anchor IDs, preserve geometry, and check intended overlapping region. Save returned outcome before deciding whether a retry may write again.                                                                                                                                                                                                                                                                                  |
| Mechanical check/repair                         | review_design -> actual mechanicalSelection -> verify_design_checks; repair_design_checks only for supported prescribed-position overflow | No extra model. The repair tool is not an automatic architectural designer, color chooser or general geometry fixer. Unsupported findings return to the primary agent.                                                                                                                                                                                                                                                                                    |
| Visual decision and accumulated results         | review_drawing and read_design_checks                                                                                                     | Whole-view criterion and local units use separate appropriate evidence. Carry returned bindings/next fields; submit new decisions only for affected units. Capturing images is not recording a pass. Unchanged valid passes remain stored; real shared dependencies may invalidate multiple units. Default check reads give counts/firstPendingId; use exact ids or revision-bound detail pages for evidence, retaining the page revision until complete. |
| Missing reusable orchestration                  | Discover existing tools/library first; describe exact contracts; submit_tool -> invoke_tool -> save_tool if needed                        | Author finite typed recipes only when existing main tools do not cover the work and the steps are genuinely reusable. No JS callbacks, captured request IDs or invented loops. Partial/unknown outcomes stop dependent writes; retry storage alone after successful execution. Do not create a recipe to satisfy an evaluation quota.                                                                                                                     |

### Turn relevant methods into execution choices

For open architectural decisions, use applicable shared advice as the default
planning reference. The user controls style and values; advice never overrides
permissions or the discovered tool contract. Do not look up advice for every
known-value edit or block work when relevant advice is unavailable.

When repeated surfaces have open material choices, use the applicable material
method below. Keep user-requested
quality in criteria; optional polish or a Knowledge recommendation is not a new
completion demand. Do not add a call just to acknowledge reading advice.

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

### Chosen-method route: ready surface, evidence, then dependent repetition

1. Use the user's choices and supported reference regions to assign the visible
   parts to material roles. Record the role-to-part relation, continuous lighting
   scope, intentional boundaries and uncertain choices concisely in existing
   `draft.brief.assumptions`; `viewpoint` carries the viewing interpretation.
   Existing criteria `method` may carry the same method when criteria are already
   needed. These are descriptive decisions, not executable selectors or a second
   validation schema. Do not infer a role from object names or hierarchy.
2. Assign role-specific `fillTemplates` to the actual draft children/motifs. Equal
   independent fills remain independent. A material family, a continuous lighting
   scope and intentionally linked `sharedFills` are different decisions. Use the already known complete contract directly. Acquire only missing route or
   draft fields through the discovery paths below; retain those contracts and do
   not reacquire the full catalog per material.
3. Choose a ready portion that contains the relevant role contrast and, when
   needed, adjacent portions spanning a join. Keep its intended projection,
   material domain and layering. Use `prepare_and_apply_design` for a ready part;
   do not require a separate prepare/review call or a disposable sample object.
   `prepare_design` is available for a needed non-mutating input check. A successful
   preparation validates declared input, not material appearance or continuity.
4. Follow the representative declaration/capture below for an unresolved shared
   material choice. Then choose the next action from the returned verdict table.
   Continue independent ready work while that choice is unresolved. This is one
   route for the selected method, not one review per object or another AI model.
5. For a local material correction, resolve explicit current targets and inspect
   their Fill relationships. Selected-owner updates apply local overrides:
   `fill.updateFillsAtIndex` changes only the selected owners, including when
   they inherit a shared Fill. Do not detach before a local update. For an
   intentional change to the shared source, use `core.updateSharedPropertySources`
   with the actual source target. Use `core.resetElementPropertyOverrides` only
   to restore inheritance, and `fill.detachFillsAtIndex` only when independent
   ownership is explicitly intended. A resolved artifact key is an identity
   mapping, not proof that the element or Fill row still exists in the document.
   Apply the requested assignment and inspect any affected join.
   A changed shared lighting assumption may affect more than one part, but
   geometry repetition alone is not an invalidation dependency.
   Reuse valid decisions; judge new/affected results in their final context.

### Correcting an existing material without replacing its mapping

Choose the correction from actual current data, not object names:

- **Native palette-only edit:** resolve explicit current targets through the context query, then
  use `core.getElementComputedData` with `fields: ["fills"]` for each known ID.
  Consume the actual action result `value.fills`. Context-query fills are a
  summary without complete gradients/property IDs, not a replacement payload.
  Inspect each complete row's property identity and gradient. Preserve
  gradient type, handles, stop positions and all unspecified stop attributes;
  replace only the requested colors/opacity. Send a complete `gradient` value
  per target. Omit unrelated Fill fields to retain them. `gradient` is replaced
  as one value: `{gradientStops: ...}` alone is invalid.
- **Known world field correction:** use `prepare_material_revision` with the retained
  original `artifactId`, existing `field` key and complete replacement `definition`
  (`frame`, `start`, `end`, `gradientStops`). The tool recomputes native values from
  the original projection and geometry, including constant-phase faces. It returns
  an unapplied `materialRevisionId`; pass that handle to `apply_prepared_material`.
  The consumer checks original member geometry and Fill bindings before any write,
  then applies owner-local overrides without recreating geometry. A changed or
  unavailable source requires an explicit current-source decision; do not retry
  the old handle or broadcast one face's normalized gradient. The application
  receipt distinguishes committed material changes from unavailable future reuse
  provenance. Recover provenance without replaying a committed write.
  For later geometry, pass the accepted revision as `materialSourceId` to
  `prepare_design` or `prepare_and_apply_design` and omit inline `linearFields`.
  The new draft still declares its geometry, projection and `materialField` keys.
  Reuse only after the primary agent accepts the affected representative result;
  preparation and application never certify visual quality. Request-local source
  handles expire with their request; saved native fills remain ordinary document data.
- **Direction/domain change:** supply intentionally new per-target complete native
  gradients in the chosen local basis. This changes the mapping; evaluate its new
  joins instead of claiming the original world field was preserved.

The following executable syntax example edits two independent native gradients.
Replace the example IDs and gradients with current document values; the two
handle sets deliberately differ. For a palette-only edit, construct each complete
value from its own current gradient, never broadcast the first target's handles.
The `patch` array aligns exactly with `elementIds`; use separate operations for
rows at different indexes. Leave `kind` and other fields unchanged unless the
request explicitly changes them.

```json native-palette-correction
{
  "tool": "execute_design_batch",
  "arguments": {
    "inspection": "defer",
    "operations": [
      {
        "name": "api_fill_updateFillsAtIndex",
        "arguments": {
          "elementIds": [
            "actual-lower",
            "actual-upper"
          ],
          "index": 0,
          "patch": [
            {
              "gradient": {
                "gradientType": "linear",
                "gradientHandles": [
                  {
                    "x": 0,
                    "y": 0
                  },
                  {
                    "x": 1,
                    "y": 0.2
                  }
                ],
                "gradientStops": [
                  {
                    "position": 0,
                    "color": "#183b40",
                    "opacity": 1
                  },
                  {
                    "position": 1,
                    "color": "#6e9796",
                    "opacity": 0.8
                  }
                ]
              }
            },
            {
              "gradient": {
                "gradientType": "linear",
                "gradientHandles": [
                  {
                    "x": -0.2,
                    "y": 0.3
                  },
                  {
                    "x": 0.8,
                    "y": 1.1
                  }
                ],
                "gradientStops": [
                  {
                    "position": 0,
                    "color": "#183b40",
                    "opacity": 1
                  },
                  {
                    "position": 1,
                    "color": "#6e9796",
                    "opacity": 0.8
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  }
}
```

Equal gradients do not imply shared Fill identity. Selected-owner fill and stroke
edits create local overrides when a component inherits a shared source; other
owners retain their effective values. Use `core.readElementPropertyTargets` for
logical child slots, effective bindings and independent source identity. Use
`core.updateSharedPropertySources` only for an intentional source-wide change;
masked fields remain local. `core.resetElementPropertyOverrides` removes selected
masks so those fields follow the current source again. Detach only when the owner
must become independent: it materializes the current effective values. Reset or
detach remaining overrides before explicitly sharing another independent source.
A local correction does not require detachment, and different owners may override
the same source with different values.

Re-query stale/missing targets and current rows after recovery; do not reuse an old
patch over an intervening edit. Invalid input is not a write, but a partial/unknown
batch requires reading acknowledged state before retrying only unfinished work.
No automatic retry of a completed reset, detach or edit.

After correction, use current affected-image bindings through the representative
route below. Reuse unrelated passes, preserve the whole-result obligation, and
set final on the actual final judgment. A completed mutation is distinct from a
durable save acknowledgment. Reloaded native fills preserve their stored mapping,
not lost source-world provenance or request-bound review credentials.

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

### Connect the chosen domain to actual parameters

The method is not implemented merely by naming a material in the brief. Make the
following choices in the existing draft and criteria; these are advisory decision
points, not additional required calls or new schema fields.

| Choice                                         | Concrete existing handoff                                                                                                                                                                                                                                                                                                                              | Independent evidence question                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Material role                                  | Assign the selected `fillTemplates` key or explicit Fill to the actual base surface or motif; keep structural paint distinct when the request requires it.                                                                                                                                                                                             | Does the rendered base plus overlaid structure express the chosen material?                            |
| Continuous domain versus repeated local effect | A gradient uses normalized local `gradientHandles` and ordered `gradientStops`. Copying identical handles to every cell restarts the field in every cell. Put a continuous field on a covering surface with separate structural geometry when that expresses the request, or use `linearFields` with `materialField` on projected/pattern faces so preparation maps the world domain to each native fill. For other supported shapes, explicitly transform the domain to local coordinates. | Is the intended field continuous across the relevant join, with intentional discontinuities preserved? |
| Different orientations or projections          | Transform to the actual local basis or choose another supported representation; the same local numbers on differently oriented faces are not one common physical lighting field.                                                                                                                                                                       | Are the visible orientations consistent with the chosen light/material interpretation?                 |
| Incomplete architecture or ornament            | Keep a separate criterion/unit for the requested geometry/detail, using its actual scope.                                                                                                                                                                                                                                                              | What requested content remains missing, independently of whether existing material is correct?         |

For axis-aligned adjacent parts in the same 2D parent basis, a parent-space gradient
point maps to a part's normalized local handle as `(point - partOrigin) / partSize`
on each axis. Nonzero size is required. Handles may lie outside that part's unit
bounds. For example, two equal stacked parts sharing one vertical field need
local vertical ranges `0..2` and `-1..1`, not `0..1` in both. This is a coordinate
relationship, not a building-specific recipe or a rule for rotated/projected faces.
The current tool schema and canonical transform own all actual parameters. A
shared Fill object is inappropriate when the required local handles differ.
Single-axis `map_retained_fills` updates color/opacity only; it cannot perform this
per-part gradient-handle transformation. Never invent such a parameter.

The rendered material review described above checks the chosen domain and join as
well as role contrast. A wrong common premise is corrected before its dependent
expansion; missing detail and failed capture remain separate findings. Preserve
existing criterion meanings and require current explicit replacement receipts when
changing a review scope.

### Choose an equivalent material representation

Use the decided roles and lighting domains above to choose what varies:

| Chosen material method                                                    | Existing representation and boundary                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One continuous gradient on one surface                                    | A normal gradient fill on that surface; separate structural lines when needed. A surface gradient is not automatically a separate gradient inside each pane.                                                                                                                                                                                                                        |
| One world-linear field across projected/pattern faces | Declare `draft.linearFields` with world start/end and ordered stops, then select `materialField` on each face. Preparation preserves phase across origin/axis translations and emits independent native fills. Discover the executable preparation example and exact schema. Do not combine a field with an explicit face fill/palette; unsupported or unrepresentable fields reject before apply. |
| Equal independent material values                                         | `draft.fillTemplates` and `fill: {template: key}`. Template reuse preserves independent fills; use `sharedFills` only for intentional linked edits.                                                                                                                                                                                                                                 |
| Intentional repeated palette                                              | `surface-grid` motif `fills` cycles by row-major cell index. Do not use cycling for a nonperiodic reflection field.                                                                                                                                                                                                                                                                 |
| Single-axis color variation on existing targets                           | `map_retained_fills` inside `execute_design_batch`, with query or caller-owned snapshot/lease, parent-local x/y domain, fill index and ordered color stops. Backend reads columns and prepares color/opacity patches only; existing gradient/kind fields remain unchanged. Selected-owner patches create local overrides on shared fills; use explicit source updates for linked changes, and detach only for independent ownership. |
| Irregular per-cell gradients or a continuous field beyond current mapping | Existing `fills` can enumerate actual variations; reuse equal definitions with templates. Single-axis mapping changes color/opacity, not per-cell gradient endpoints or an arbitrary 2D lighting field. Do not claim equivalence, invent a formula parameter, silently simplify requested appearance or send arbitrary callbacks.                                                   |

When compacting repeated paint, merge definitions into one template only when
gradient kind, handles, ordered stops, opacity and all other values match. Named
role templates are also useful without repetition. Preserve paint-list order,
geometry, projection and independently editable identities. A template is not a
continuous field and is not linked `sharedFills`. A shorter motif palette is valid
only when its row-major cycle reproduces every intended cell; repeated geometry
alone does not prove that. Distinct paints outside the supported world-linear field still require explicit
values with current capabilities. Do not quantize them merely to reduce bytes.

For `map_retained_fills`, discover its full input contract through `operations`
when needed. Prefer an explicit `query` when there is no other query consumer;
use a caller-owned `snapshotId` plus `leaseId` when intentionally reusing one.
The mapping samples each element's parent-local `x` or `y` position, not its
center, world position or gradient endpoint. Choose the domain in that same basis;
partition different parent bases explicitly. This is color/optional-opacity
interpolation, not gradient interpolation or a gradient-to-solid conversion.
For a requested fill-kind change, use the exact Fill update contract explicitly.
Never send formula or gradient-handle fields to the retained color mapper.

If a retained input is stale, refresh the affected query before a new write.
If a write completed but retaining its output failed, retain that settlement and
refresh only needed evidence/targets; do not rerun the write. Unknown/partial
settlement uses the existing receipt recovery. If the chosen visual method needs
an unsupported field, keep the current result, state the missing expression and
use explicit supported values when feasible. Do not silently replace the effect,
create a callback or claim a new tool can synthesize it. A new capability requires
a separate confirmed requirement; Knowledge does not invent one.

### Retrieve the contract for the chosen method

Use compact category/query menus when the capability is unknown. For known
operations use `operations`; for known native tools use `names`. `view: usage`
returns purpose, the actual invocation route, a validated illustrative owner example
when available, and canonical nested field/definition paths. Examples do not replace
executable validation schemas or supply live credentials.
A canonical action's `recipeDependency` identifies its qualified composition
route; foreign tools with similar names are separate choices. Select that route
before obtaining the full recipe contract. The semantic `operations` selector
(such as `fill.updateFillsAtIndex`) is for discovery; batch `operations[].name`
uses the returned registered action `name`. Follow its `execution.tool` and
argument envelope. Do not invent an action name by copying the search term. Use the following ordinary selectors,
not a second registry. Choose the smallest missing information for the next action:

| Current state                                                       | Retrieval/action                                                          | Keep for the next handoff                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Capability is unknown                                               | Compact category/query menu; follow its pagination if needed              | Returned operation, exact selector and execution route                                               |
| Route is chosen; a few argument fields are unknown                  | Exact `operations` or qualified `names` with `schemaPaths`                | Field fragments plus included local references; other required inputs still apply                    |
| Current complete contract is already available                      | Invoke directly with the required values                                  | Result identities, settlement and scoped dependencies                                                |
| A finite recipe needs a dependency contract                         | Exact full definition for the returned `recipeDependency` or native route | Complete input/output, partial outcome, effects and lifecycle; a usage menu/fragment is insufficient |
| A definition is marked `previously-returned` but content is missing | Returned scoped recovery or explicit full refresh when necessary          | Current recovered content/revision; do not retry the drawing write                                   |

For names shared by a basic action and a native wrapper, their argument envelopes
can differ. Select the returned qualified native selector or the exact basic
operation; do not combine their fields. Do not assume every new material role needs
a new schema lookup. A changed target value does not change an unchanged tool
contract. Conversely, a first-time tool lookup is necessary acquisition, not waste.
The server having produced a response does not prove that you retained it; genuine
lost-context/delivery recovery remains valid.

Examples use current public selectors:

```json
{
  "tool": "describe_design_apis",
  "arguments": { "operations": ["fill.updateFillsAtIndex"], "view": "usage" }
}
```

```json
{
  "tool": "describe_design_apis",
  "arguments": {
    "names": ["design_workflow.prepare_and_apply_design"],
    "schemaPaths": ["/properties/draft"]
  }
}
```

Retain the returned exact fields. A fragment includes needed local references but
is not a complete validation schema; composing tools needs full input/output,
partial/recovery and lifecycle contracts. On an unknown path follow the actual
`schemaResolution` correction; restore missing context through the returned
scoped recovery. Full retrieval remains available. Never retry a settled drawing
write because its description or delivery was lost.

### Preserve exclusive target inputs and current review receipts

A direct edit supplies known current IDs. A retained target supplies that argument
slot instead; omit the slot entirely, including empty arrays and null. These two
examples are alternatives, not consecutive operations. Replace the illustrative
IDs with the actual current document or preparation receipt; never reuse saved
run IDs. Use a ready known edit without a Knowledge-read prerequisite.

```json
{
  "tool": "execute_design_batch",
  "arguments": {
    "operations": [
      {
        "name": "api_element_deleteElements",
        "arguments": { "elementIds": ["current-selected-element"] }
      }
    ],
    "inspection": "defer"
  }
}
```

```json
{
  "tool": "execute_design_batch",
  "arguments": {
    "operations": [
      {
        "name": "api_element_deleteElements",
        "arguments": {},
        "target": {
          "field": "elementIds",
          "artifactId": "current-prepared-part",
          "keys": ["chosen"]
        }
      }
    ],
    "inspection": "defer"
  }
}
```

For a current-region target use the supported `target.query` instead of a
preparation reference. `name.equals` matches the entire generated name;
`name.suffix` matches an explicitly chosen ending (for example a repeated motif's
role after its generated prefix). A zero-match receipt is zero edits, not permission
to broaden the region or predicate. Inspect the naming rule/available metadata and
choose corrected criteria; the tool must not infer the intended target for you.

Review revisions belong to returned checks, not the capture counter or document
sequence. Before explicitly superseding a visual unit, use `read_design_checks`
with its exact ID and `view: details`, then carry that unit's current revision.
Use the representative capture/bind/record route above, including its explicit
final-record instruction. Reuse good images through `bindChecks`.
Do not copy a revision from an earlier decision. A concurrent edit can still make
that read stale: re-read/rebind only the affected unit, preserving unrelated passes.
Keep successful images if another capture or binding failed; do not repeat a
settled edit to recover a review receipt. Never attach a new revision to an old
judgment. The final `report_outcome` action belongs to the final response actions,
not native invocation or an edit batch; its proposal does not acknowledge saving.

This executable preparation example implements the axis-aligned domain conversion
above on two adjacent parts. Both paint domains reach parent y=0..80, meet at the
same gradient parameter at y=40, and remain independently editable. The structural
paint is separate. Values illustrate the contract, not an architectural answer:

```json
{
  "tool": "prepare_design",
  "arguments": {
    "draft": {
      "type": "group",
      "name": "Continuous material join",
      "brief": {
        "intent": "Two editable adjacent glazed parts sharing one vertical lighting domain",
        "viewpoint": "Front view",
        "sources": [],
        "assumptions": [
          "The common parent-local vertical domain is y=0..80; pane handles are transformed into each part, while structural metal stays separate."
        ],
        "checks": []
      },
      "fillTemplates": {
        "glass-upper": {
          "gradientType": "linear",
          "gradientHandles": [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 2
            }
          ],
          "gradientStops": [
            {
              "position": 0,
              "color": "#527b86",
              "opacity": 1
            },
            {
              "position": 1,
              "color": "#a4c4cc",
              "opacity": 1
            }
          ]
        },
        "glass-lower": {
          "gradientType": "linear",
          "gradientHandles": [
            {
              "x": 0,
              "y": -1
            },
            {
              "x": 0,
              "y": 1
            }
          ],
          "gradientStops": [
            {
              "position": 0,
              "color": "#527b86",
              "opacity": 1
            },
            {
              "position": 1,
              "color": "#a4c4cc",
              "opacity": 1
            }
          ]
        },
        "metal": "#b0b8bb"
      },
      "children": [
        {
          "type": "rect",
          "key": "pane-a",
          "name": "Pane A",
          "x": 0,
          "y": 0,
          "width": 20,
          "height": 40,
          "fill": {
            "template": "glass-upper"
          }
        },
        {
          "type": "rect",
          "key": "pane-b",
          "name": "Pane B",
          "x": 0,
          "y": 40,
          "width": 20,
          "height": 40,
          "fill": {
            "template": "glass-lower"
          }
        },
        {
          "type": "rect",
          "key": "mullion",
          "name": "Mullion",
          "x": 20,
          "y": 0,
          "width": 4,
          "height": 80,
          "fill": {
            "template": "metal"
          }
        }
      ]
    }
  }
}
```

In ordinary drawing, put the ready draft into `prepare_and_apply_design` directly;
this standalone preparation example proves syntax, not a required extra step.
Mechanical checks validate geometry and declared relationships. The primary agent
checks actual rendered material/lighting and records only observed judgments.
Preserve successful preparation and settled partial write receipts after failure;
fix failed inputs or missing evidence rather than rebuilding unrelated content.

Keep a compact working decision record in existing brief/criteria/fact/check
artifacts: view, units, reference scope, mass relationships, repeated motifs and
remaining defects. This is not a new store or mandatory verbose essay. Use exact
current outputs instead of retransmitting solved geometry. Preserve unaffected
objects and passed decisions. After mutation, inspect affected evidence and an
appropriate final overview; do not reapprove every unrelated part.

## Provenance

App-authored mapping of current Design preparation, construction, review,
operation and tool-library contracts. Exact discovered schemas and returned
receipts own invocation syntax, authority, lifecycle and recovery.

## Evaluation Guidance

Inspect actual intent-to-tool handoffs, rejection reasons, partial recovery,
retained valid judgments and preservation of unrelated content. Check rendered
quality separately; a tool success is not visual acceptance. Do not require a
new composed tool when an existing main tool already covers the task. No
particular building, test result or fixed drawing sequence is prescribed.

## Represent a repeated multi-face component once

After selecting the component shape and material method, separate unique contours,
material roles, repeat axes and genuine exceptions. For translated world-space
copies, use one `pattern.faces` list containing every face of the component in
painter order, then `origin` and `axes`. The backend projects each prototype and
expands all copies. The last axis varies fastest; output order is instance first,
then face. This does not depth-sort: if the intended painter order differs, split
into appropriate explicit families instead of changing the artwork to fit a pattern.

Use the executable multi-face example in the discovered `prepare_design` definition
for exact syntax:
its glass and rim are separate contours, its glass uses the chosen world field,
and its irregular accent stays outside the pattern. Use local fills for intended
per-piece material restarts; select a common `linearFields` domain only when the
material should continue across copies. Preserve source contour detail. Identical
2D curves use `vector-pattern`; arbitrary nontranslated 3D shapes remain explicit.
Knowledge is optional; these are representation choices, not invocation eligibility.

Confirm representative material evidence separately from overall detail completion
using the scoped review flow above. Ready parts still use `prepare_and_apply_design`.
Use current returned IDs or `retain_design_targets` with the artifact and exact
instance prefix for a later local edit; generated keys are not canonical IDs or
cross-artifact aliases. Reuse unaffected passes after that edit. Release/cancellation
requires current authority, not replay of successful writes. `instanceRanges` can
restore known missing complete instances; if a write stopped within an instance,
use its actual partial receipt and current state before deciding what remains.
A save failure retries saving, not preparation/application. Reload restores editable
native shapes and fills, not the original request artifact or a live pattern link.
