---
{
  "description": "Architectural illustration: spatial relationships, consistent projection, repeated facade detail and coherent material lighting",
  "contexts": [
    "architectural-illustration"
  ],
  "provenance": [
    "Project-authored advisory synthesis; informed by retained architectural drawing failures, not a building-specific recipe or empirical efficacy claim."
  ]
}
---

# Architectural illustration

## What

Reusable methods for editable architectural illustrations and invented buildings
when the user requests spatial depth, facade detail or material lighting.

## Why

Spatial and material decisions should remain coherent as details accumulate.
Choosing a suitable representation can reduce repeated derivation and avoidable
reconstruction without prescribing a particular building, camera or style.

## How

Use only the parts relevant to the request. These methods do not apply as a
mandatory pipeline to a flat poster, diagram, icon or deliberately distorted
illustration. User intent and supported tool contracts remain authoritative.
References guide only what they actually show; uncertainty is not measured fact.

### 1. Establish spatial relationships before dense detail

**What:** Choose one consistent spatial model for the requested view. Distinguish
facts supported by references from estimated dimensions and hidden geometry.

**Why:** A detailed facade cannot repair an incorrect attachment, footprint or
front-to-back relationship. Late corrections can invalidate many repeated parts.

**How:** Separate the requested subject from its setting before assigning visible
masses. An attached low volume may belong to the subject; a road, distant building
or surrounding paving may not. State an uncertain attachment instead of adding
all nearby shapes or silently treating every low surface as the same plinth.

For each important pair of masses, choose the supported relationship: relative
placement, extension beyond either side, contact or separation, and front-to-back
overlap. Describe which visible edges or roof surfaces support that choice.
Approximate dimensions may preserve these relationships; uncertain measurements
do not justify replacing an observed offset with a centered footprint. Hidden
geometry remains an estimate, not a reference fact.

Use one unit system and view convention for connected parts. Resolve silhouette,
attachments and overlap before expanding dense details in the affected region.
A ready, coherent part may be drawn immediately; this is not a whole-building
pre-draw approval gate. Do not add hidden faces just to complete a volume.

**Evaluation:** Compare the relationship using a view containing both masses,
their join and enough surrounding extent to see the offset or overlap. A crop of
one entrance can establish entrance detail but cannot establish the position of
the entire lower mass. Ask separately whether the placement matches the available
reference and whether the local detail is complete. Preserve uncertainty when a
source cannot answer the first question. Count later relationship repairs separately
from deliberately deferred decoration; preserve unrelated correct relationships.

### 2. Preserve a consistent projection and explicit visibility order

**What:** Keep world geometry, projected canvas positions and parent-local
coordinates distinct. Keep one camera for connected geometry unless the user
requests a deliberate change.

**Why:** Changing coordinate basis or painter order can produce seams, floating
parts or rear edges appearing through nearer surfaces even with correct vertices.

**How:** Choose a projection appropriate to the requested view; orthographic and
perspective views are different choices. Reuse the chosen projection for connected
surfaces. Signed world coordinates are legitimate; use the consumer's documented
conversion instead of clamping negative values or translating every child
independently. Determine far-to-near order for actual overlapping surfaces.
A single global height sort is not a visibility solution. Split intersecting
surfaces only when their actual visible portions require it. Do not assume the
renderer removes hidden faces or establishes architectural depth automatically.

**Evaluation:** Inspect podium/tower joins, near/far crown edges and top surfaces
at fixed views. Distinguish a geometry error from a layer-order error before
repairing. Do not rebuild geometry when a scoped order correction is sufficient.

### 3. Describe repeated detail as rules when the representation fits

**What:** Represent genuinely repeated geometry with a template and placements;
keep unique or irregular details explicit.

**Why:** Re-deriving and transmitting every repeated vertex increases output and
opportunities for inconsistency without adding design decisions.

**How:** Separate the decisions that vary from those that repeat. Choose one motif,
its dimensions, placement rule, material and visibility order. For a tapered planar
facade, describe a surface and a normalized window/frame motif. For repeated curves,
retain the curve template rather than replacing it with many independently
sampled polygons. Reuse only transformations the selected representation actually
supports; different orientations or topologies may require different templates.
A shared material means intentional linked edits; independent equal colors must
remain independently editable when that is the intent. Do not force an irregular
ornament into a grid or reduce requested detail merely to reduce payload size.

**Evaluation:** Compare required silhouette/detail, editable geometry and paint
order before crediting reduced payload. Track transmitted input bytes and later
repair effort, not generated object count.

### 4. Plan material and lighting relationships across the building

**What:** Treat glass, metal, opaque structure, recesses and cast shadows as
related material decisions under one chosen lighting interpretation.

**Why:** A window grid is not a reflection model. Applying the same bright motif
to every cell or restarting a gradient on every tier can create decorative bands
or checker patterns instead of a coherent facade.

**How:** Establish the large-scale light/dark relationships first. Keep reflections
coherent across a continuous planar facade; change them where orientation,
material or the chosen reflected environment justifies a change. Let mullions,
recesses and structural members remain distinguishable without covering the glass.
Use small highlights only where their scale and material support them. A reference
may support form without supporting lighting; state that uncertainty and choose a
consistent interpretation rather than claiming a physically verified simulation.
Do not create extra scenery/background to justify a reflection.

**Evaluation:** Inspect adjoining tiers and the crown at both overview and detail
scales. Record unintended repetitive bright patterns, abrupt unsupported lighting
resets, and structural elements that obscure required surfaces. Richer color or
more marks alone is not better realism.

### 5. Choose a material method before repeating a surface

**Applicability:** Use this reasoning when repeated details form a larger visible
surface and material or lighting choices are still open. A known-value local edit,
a deliberately flat graphic, or irregular ornament does not require this process.
The requested style takes precedence over a realistic-material interpretation.

**Decisions:** Separate material role from geometric repetition. Identify glass,
metal, opaque structure and recesses by their intended appearance and reference
support, not merely by their position in a hierarchy. Choose the light direction,
the surface region over which tonal variation is continuous, and where orientation
or material changes justify a discontinuity. Distinguish an explicit design choice
from a measured fact or an uncertain interpretation.

**Representation:** Reuse one material definition for equal values while preserving
independent editability when intended. For continuous variation, describe its
coordinate domain and control values before deriving individual samples. Do not
restart a surface-wide light pattern in each repeated detail. A varying field and
a repeated palette are different methods: use the palette only when the repetition
is intentional. Keep genuinely irregular exceptions explicit; concise representation
must not replace required detail with a simpler but different appearance.

**Representative surface:** Evaluate the composite appearance, not just the most
recently drawn layer. A set of frames without the underlying glass can show grid
alignment but cannot show glass/frame contrast or how much glass the frames hide.
Choose a small portion containing the base surface, bordering structure and their
actual overlap. When
continuity matters, include two adjacent portions or a join; one isolated swatch
cannot reveal a tonal restart. Different orientations may require different
representatives. Keep the same chosen lighting interpretation while evaluating
those differences. This is part of making a ready portion, not a requirement to
finish the whole composition or obtain separate approval before drawing.

**Early check:** Distinguish three decisions: material family describes appearance;
the continuous domain describes where a lighting interpretation applies; edit
coupling describes whether future changes should affect other objects. Sharing a
family does not prove the same orientation or domain, and equal appearances do
not imply linked future edits. Record which visible parts use each chosen role,
which boundaries are intentional, and which choices are estimates. Do not infer
material from a part's name, height or geometric repetition alone.

Check that the intended definitions are complete and assigned to the chosen
parts. Such consistency checks cannot decide whether glass looks like glass or
metal looks like metal. Judge that on the actual representative result, using the
requested style and only the reference regions that support material appearance.
If an image supports shape alone, keep the lighting choice an explicit assumption.
Do not add a background, new object or arbitrary realism requirement for this check.

Keep three questions separate at the first useful visual assessment:

- Is the visible geometry aligned and attached as intended?
- Do the existing surface, structure and lighting relationships match the chosen
  material interpretation at overview and a readable local scale?
- Which requested repeated details are still missing?

An answer of "more sections remain to be drawn" answers only the third question.
It neither approves nor rejects the material already visible. Conversely, a material
pass on a representative region does not assert that all requested detail is done.
Use the same useful inspection to answer the relevant questions; do not add one
review per object or a mandatory review before every drawing action. If the selected
view excludes a necessary layer or join, obtain the appropriate view rather than
changing paint to compensate for missing evidence. More gradient stops or stronger
contrast alone cannot satisfy a material judgment.

**Revision:** Once a representative relationship is satisfactory, repeat the
chosen geometry with its intended material roles. Reuse decisions, not a visual
approval for all future placements: occlusion, joints and overall appearance still
need inspection in the finished context. Retain decisions whose evidence and
assumptions remain valid. A local role correction affects the parts assigned that
role; a shared light-direction change affects the surfaces depending on that
interpretation, not every unrelated part. Recheck a boundary pair if either side
changed. Do not keep a previously accepted relationship when its premise changed.

**Recovery:** Distinguish incomplete definitions, inconsistent assignments and
unsatisfactory appearance. Resolve missing information or references before
expanding the affected portion; preserve independent ready portions. Correct a
valid but unsuitable appearance as a design decision, not a geometry failure.
If evidence is unavailable, leave that judgment unverified until evidence can be
obtained; lack of an image does not mean the existing drawing must be rebuilt.
A consistent description alone is not proof of a visually convincing result.

## Provenance

Project-authored synthesis of architectural illustration and editable-vector
workflow principles. No external source is quoted. Recorded drawing failures
motivated the topics, but this module contains no case-specific dimensions,
coordinates, object identities, reference answers or required building form.
Effectiveness remains subject to real-agent evaluation.

## Evaluation Guidance

Judge reference-supported spatial relationships, consistent projection, required
editable detail and coherent materials separately. Compare actual correction
scope and transmitted repeated data without using object count as quality.
Retain uncertainty for occluded or underspecified geometry. Fewer operations
are useful only if the requested result and unrelated content are preserved.
