---
{
  "description": "Optional advice for new-material representation and lighting-domain decisions, including supported continuous fields and their limits, without a parameter walkthrough. Select parameters only for unresolved coordinate conversion or a needed worked example.",
  "contexts": [
    "architectural-illustration"
  ],
  "provenance": [
    "Asyra Design advisory mapping reviewed against current public tool descriptions and schemas."
  ],
  "references": [
    "design.architectural-illustration",
    "design.architectural-illustration.contracts",
    "illustration.architecture.materials.method"
  ],
  "children": [
    "design.architectural-illustration.materials.method.parameters"
  ]
}
---

### Decide representation before choosing a review method

Use the material roles and intended lighting domain already available. Do not infer a role
from object names or hierarchy. A material family, continuous lighting scope and
intentionally linked shared fill are distinct choices. Record unresolved choices
concisely in existing assumptions only when needed; this is not another schema.

For a known representation, use the current tool contract directly. If local
coordinate conversion is the unresolved question, select method.parameters; its
worked example does not require adopting a sampling workflow.

### Optional method for an uncertain repeated material

A ready portion with adjacent surfaces can reveal an uncertain material or join
before that choice is repeated. This adds capture and judgment time; use it when
that cost is justified by likely rework. Known methods and independent parts need
not wait. Keep the intended projection and material domain, apply the ready part
with `prepare_and_apply_design`, then use materials.review for scoped evidence if
needed. No disposable sample, extra preparation call or fixed drawing order is
required. Review must not add acceptance obligations beyond the user's request.

### Choose an equivalent material representation

Use the decided roles and lighting domains to choose what varies:

Choose an existing representation by the intended effect:

- Normal gradients cover a surface; keep structure separate. Projected/pattern
  faces can use `linearFields` with `materialField`; do not combine a field with
  an explicit face fill/palette. Unsupported fields reject before apply.
- `fillTemplates` preserve independent fills; `sharedFills` means intentional
  linked future edits. A repeated palette is appropriate only for intended cycling.
- `map_retained_fills` changes color/opacity, not per-cell gradient endpoints or
  an arbitrary 2D lighting field. Irregular gradients need explicit supported
  values. Never invent formula parameters or callbacks, simplify the requested
  effect silently, or claim unsupported equivalence.

When compacting repeated paint, merge definitions into one template only when
gradient kind, handles, ordered stops, opacity and all other values match. Named
role templates are also useful without repetition. Preserve paint-list order,
geometry, projection and independently editable identities. A template is not a
continuous field and is not linked `sharedFills`. A shorter motif palette is valid
only when its row-major cycle reproduces every intended cell; repeated geometry
alone does not prove that. Distinct paints outside the supported world-linear field still require explicit
values with current capabilities. Do not quantize them merely to reduce bytes.

For retained color mapping, use the actual parent-local position basis and current
query/lease. It changes color/opacity only, not gradient handles or fill kind.
Select method.parameters for the exact domain/ownership walkthrough if needed.

Unsupported effects remain explicit limits, not silently substituted appearance
or invented callbacks. Exact invocation and recovery belong to current tool
contracts; the contracts dependency supplies the shared no-replay boundary.

Use `prepare_and_apply_design` for ordinary ready parts; the optional standalone
example does not require an extra preparation step. Mechanics do not judge
appearance. Retain valid artifacts, partial receipts and independent passes;
inspect only affected evidence plus the appropriate final overview. Keep decisions
in existing brief/criteria/fact/check artifacts, not another store or mandatory essay.

For a parameter conversion walkthrough and its executable adjacent-surface example,
select `design.architectural-illustration.materials.method.parameters` only when
needed. Naming a material is not assigning it: apply the chosen Fill to the actual
surface, keep structural paint separate, and transform continuous-domain controls
to each actual basis. Equal local handles on differently oriented faces do not
establish common lighting. Keep missing geometry/detail as a separate criterion.
A shared Fill has one value; it cannot encode different per-owner coordinates.

For normalized local handles, part dimensions must be nonzero; handles may lie
outside unit bounds. Axis-aligned conversion is not a rule for rotated/projected
faces. Retained color mapping samples parent-local x/y positions, not centers,
world positions or gradient endpoints; partition different parent bases.
