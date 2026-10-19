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
| Repeat a compatible motif                       | pattern template + axes, or vector-pattern template + placements                                                                          | Read exact selected schemas. These are not arbitrary 3D instancing or arbitrary function execution. Confirm supported transformations and split genuinely different motifs.                                                                                                                                                                                                                                                                               |
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

### Material roles to a ready surface

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
4. At the first useful rendered review, choose a composition/region containing the
   base paint plus overlaid structure. A frame-only prepared artifact can establish
   frame alignment; it cannot establish glass appearance. Use the current containing
   composition or actual related targets, including a necessary join/orientation.
   Drawing coordinates and image-source crop coordinates are different contracts.
   Keep material adequacy separate from unfinished repeated detail in existing
   criteria/units. One `review_drawing` capture can supply multiple explicitly
   declared checks with distinct judgments. "Other sections remain missing" is a
   detail-completion finding, not a material verdict. Use returned bindings, not an
   authored pass inferred from successful preparation. This adds neither an extra
   review model nor one inspection per repeated object.
   If a prior check used the wrong region, use its current `supersedes` revision
   and reason to bind the corrected evidence; do not overwrite its meaning silently.
   Preserve unverified judgments when no image is available. A material pass in one
   region is not automatic approval of every orientation or all future details.
   Expand decided roles using the existing grid/pattern capabilities; a local
   gradient does not automatically span adjacent grids. Sample geometry, artifact
   IDs and visual receipts cannot substitute for final ones.
5. For a local material correction, resolve explicit current targets and inspect
   their Fill relationships. `fill.updateFillsAtIndex` edits the referenced Fill
   property; a shared Fill can affect owners outside the selected targets. When
   only these targets should change, use `fill.detachFillsAtIndex` on the intended
   row before updating it. Preserve intentional linked edits when that is the
   request; do not detach by default. A resolved artifact key is an identity
   mapping, not proof that the element or Fill row still exists in the document.
   Apply the requested assignment and inspect any affected join.
   A changed shared lighting assumption may affect more than one part, but
   geometry repetition alone is not an invalidation dependency.
   Reuse valid decisions; judge new/affected results in their final context.

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
| Continuous domain versus repeated local effect | A gradient uses normalized local `gradientHandles` and ordered `gradientStops`. Copying identical handles to every cell restarts the field in every cell. Put a continuous field on a covering surface with separate structural geometry when that expresses the request, or transform the chosen domain into each part's supported local coordinates. | Is the intended field continuous across the relevant join, with intentional discontinuities preserved? |
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
| Equal independent material values                                         | `draft.fillTemplates` and `fill: {template: key}`. Template reuse preserves independent fills; use `sharedFills` only for intentional linked edits.                                                                                                                                                                                                                                 |
| Intentional repeated palette                                              | `surface-grid` motif `fills` cycles by row-major cell index. Do not use cycling for a nonperiodic reflection field.                                                                                                                                                                                                                                                                 |
| Single-axis color variation on existing targets                           | `map_retained_fills` inside `execute_design_batch`, with query or caller-owned snapshot/lease, parent-local x/y domain, fill index and ordered color stops. Backend reads columns and prepares color/opacity patches only; existing gradient/kind fields remain unchanged. Conflicting updates of shared fills reject; detach and requery only when independent edits are intended. |
| Irregular per-cell gradients or a continuous field beyond current mapping | Existing `fills` can enumerate actual variations; reuse equal definitions with templates. Single-axis mapping changes color/opacity, not per-cell gradient endpoints or an arbitrary 2D lighting field. Do not claim equivalence, invent a formula parameter, silently simplify requested appearance or send arbitrary callbacks.                                                   |

When compacting repeated paint, merge definitions into one template only when
gradient kind, handles, ordered stops, opacity and all other values match. Named
role templates are also useful without repetition. Preserve paint-list order,
geometry, projection and independently editable identities. A template is not a
continuous field and is not linked `sharedFills`. A shorter motif palette is valid
only when its row-major cycle reproduces every intended cell; repeated geometry
alone does not prove that. Distinct nonperiodic paints still require explicit
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
returns purpose, route and root input paths without executable validation schemas.
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
Use `review_drawing` with explicit capture checks, or `bindChecks` for already
usable images; fill only observed status/evidence in the returned `next.arguments`.
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
