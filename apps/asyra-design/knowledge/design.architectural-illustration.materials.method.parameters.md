---
{
  "description": "Select only when local-coordinate conversion remains unresolved or a worked example is needed after choosing a material method. A known supported representation does not require this walkthrough. Direct selection includes method constraints; no parent read is required.",
  "contexts": [
    "architectural-illustration"
  ],
  "provenance": [
    "Asyra Design advisory mapping reviewed against current public tool descriptions and schemas."
  ],
  "references": [
    "design.architectural-illustration.materials.method"
  ]
}
---

# Material parameter walkthrough

### Connect the chosen domain to actual parameters

The method is not implemented merely by naming a material in the brief. Make the
following choices in the existing draft and criteria; these are advisory decision
points, not additional required calls or new schema fields.

| Choice | Concrete existing handoff | Independent evidence question |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Material role | Assign the selected `fillTemplates` key or explicit Fill to the actual base surface or motif; keep structural paint distinct when the request requires it. | Does the rendered base plus overlaid structure express the chosen material? |
| Continuous domain versus repeated local effect | A gradient uses normalized local `gradientHandles` and ordered `gradientStops`. Copying identical handles to every cell restarts the field in every cell. Put a continuous field on a covering surface with separate structural geometry when that expresses the request, or use `linearFields` with `materialField` on projected/pattern faces so preparation maps the world domain to each native fill. For other supported shapes, explicitly transform the domain to local coordinates. | Is the intended field continuous across the relevant join, with intentional discontinuities preserved? |
| Different orientations or projections | Transform to the actual local basis or choose another supported representation; the same local numbers on differently oriented faces are not one common physical lighting field. | Are the visible orientations consistent with the chosen light/material interpretation? |
| Incomplete architecture or ornament | Keep a separate criterion/unit for the requested geometry/detail, using its actual scope. | What requested content remains missing, independently of whether existing material is correct? |

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

The rendered material review described in the materials.review child checks the chosen domain and join as
well as role contrast. A wrong common premise is corrected before its dependent
expansion; missing detail and failed capture remain separate findings. Preserve
existing criterion meanings and require current explicit replacement receipts when
changing a review scope.

This executable preparation example implements the axis-aligned domain conversion in the method guidance on two adjacent parts. Both paint domains reach parent y=0..80, meet at the
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


### Existing-target color mapping

For `map_retained_fills`, discover its full input contract through `operations`
when needed. Prefer an explicit `query` when there is no other query consumer;
use a caller-owned `snapshotId` plus `leaseId` when intentionally reusing one.
The mapping samples each element's parent-local `x` or `y` position, not its
center, world position or gradient endpoint. Choose the domain in that same basis;
partition different parent bases explicitly. This is color/optional-opacity
interpolation, not gradient interpolation or a gradient-to-solid conversion.
For a requested fill-kind change, use the exact Fill update contract explicitly.
Never send formula or gradient-handle fields to the retained color mapper.


### Representation selection details

| Chosen material method | Existing representation and boundary |
| --- | --- |
| One continuous gradient on one surface | A normal gradient fill on that surface; separate structural lines when needed. A surface gradient is not automatically a separate gradient inside each pane. |
| One world-linear field across projected/pattern faces | Declare `draft.linearFields` with world start/end and ordered stops, then select `materialField` on each face. Preparation preserves phase across origin/axis translations and emits independent native fills. Discover the executable preparation example and exact schema. Do not combine a field with an explicit face fill/palette; unsupported or unrepresentable fields reject before apply. |
| Equal independent material values | `draft.fillTemplates` and `fill: {template: key}`. Template reuse preserves independent fills; use `sharedFills` only for intentional linked edits. |
| Intentional repeated palette | `surface-grid` motif `fills` cycles by row-major cell index. Do not use cycling for a nonperiodic reflection field. |
| Single-axis color variation on existing targets | `map_retained_fills` inside `execute_design_batch`, with query or caller-owned snapshot/lease, parent-local x/y domain, fill index and ordered color stops. Backend reads columns and prepares color/opacity patches only; existing gradient/kind fields remain unchanged. Selected-owner patches create local overrides on shared fills; use explicit source updates for linked changes, and detach only for independent ownership. |
| Irregular per-cell gradients or a continuous field beyond current mapping | Existing `fills` can enumerate actual variations; reuse equal definitions with templates. Single-axis mapping changes color/opacity, not per-cell gradient endpoints or an arbitrary 2D lighting field. Do not claim equivalence, invent a formula parameter, silently simplify requested appearance or send arbitrary callbacks. |
