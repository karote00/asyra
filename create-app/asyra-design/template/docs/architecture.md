# Architecture

Asyra Design is an App-level composition over Asyra Framework. Its canonical
intent path is:

```text
UI / input / automation / accepted AI intent
-> src/features
-> src/common-apis
-> public Asyra API inside one intended transaction
-> canonical Framework state owner
-> UI / render / serialization / service projection
```

Loading, undo/redo, and accepted collaboration changes use the Framework's
validation-and-apply path. They must not re-enter product intent as new UI or
Feature decisions.

## Ownership boundaries

- Framework owns deterministic execution, registration, transactions,
  validation, canonical state mechanics, and replaceable output boundaries.
- Preset owns optional official defaults and the `2D` profile baseline.
- This App owns design schemas, tools, interaction policy, permissions, UI,
  AI action definitions, and collaboration domain policy.
- Services own transport and durable storage policy. The browser never becomes
  an alternate durable-document owner.

## Startup

`src/startup.ts` coordinates App startup. `src/init/init-app.ts` applies Preset
and App registrations before Core composition closes. `src/contexts/core.ts`
is the App's public Framework composition boundary. Add registrations before
startup; do not mutate composition after `core.start()`.

## Transactions

One intended user action maps to one intended undo commit. Long-lived gestures
may start, update, and end one transaction; finite commands should use the
bounded transaction helper. Validation and inverse behavior belong with the
canonical owner, not only in UI handlers.

## Collaboration and persistence

The App uses one required, non-empty `fileId` as document/session identity. It
remains locally editable in the declared disconnected state, but local recovery
is not durable backend persistence. The socket service accepts and orders live
publications; the document backend owns materialized durability. Production
authentication, authorization, backup, and retention are intentionally left to
the product owner.

## AI conversation lifecycle

User messages remain on the right from submission through settlement. The document
conversation controller owns continuation, target context and safe retry. Closing
the panel hides it without cancelling the request or pending approval; Stop cancels
explicitly. Tool activity is streamed on the same action-batch request, separately
from the final prepared batch. Failures keep intent and attachments for recovery.
Reference replacement uses one registered action and one ordinary transaction: insert
complete replacement, then remove only the referenced Group or Frame. Ordinary failure retains applied progress; explicit cancellation rolls back. Each modifying request appends one independent Undo entry.
App UI text is English; user and model-authored content preserve their language.

## Structured AI construction

For fixed-view 2D output, the server-owned App prompt asks AI to plan visible
content and occlusion before generating detail. Fully hidden geometry without an
editing purpose should be omitted, without simplifying requested visible detail.
Partially covered whole shapes and useful overlaps remain valid; do not fragment
every overlap. Preserve hidden content requested by the user or needed for editing.
Transparency, blending, shadows and reflections can make otherwise covered content
contribute to the result. This is a planning policy, not automatic backend culling
or permission to delete existing covered objects.

The server-owned prepare_design tool accepts native layout drafts, optional briefs
and measurable requirements, same-parent geometric relations and explicit planar
faces projected through one orthographic camera. AI chooses content, representation,
source evidence, visible faces and ordering; the server performs bounded geometry
and layout calculations. Unmet requirements and overflow block application and
return actionable findings. Bounded sibling text-box intersections are advisory
preparation warnings; actual glyph fit still requires browser review. Brief evidence stays in request-local tool receipts;
only the existing native descriptor payload reaches ordinary actions. Relations
are construction instructions, not persisted live constraints. Projection does
not infer depth, reconstruct photos or remove hidden surfaces. Numeric checks and
post-render visual review are separate; neither is a guarantee of arbitrary design
quality. No added provider, dependency, renderer or transaction path is required.

AI requests have no App-imposed total duration or cumulative operation, review,
preparation, reference research/import, analysis or refinement count limit. Users
can Stop. Per-call data/geometry validation, original-source displacement checks,
128 in-flight provider calls and serialized bounded analysis CPU jobs remain.
Service readiness and individual decoding/network watchdogs are separate from
request lifetime. Existing cancellation/Undo behavior is unchanged.

## Group and Frame selection

Both containers remain registered. Group organizes children and derives its bounds
from their geometry; Frame owns independent dimensions and optional background.
Either can nest either. The AI preparation draft requires an explicit root type;
Group omits dimensions/fill/layout while Frame requires dimensions. Server-side
Group normalization reuses `@asyra/preset/group-bounds` without importing the
Preset runtime, preserves world geometry and emits ordinary canonical descriptors.
Current row/column/grid preparation is one-time placement, not live Auto Layout.
Clipping, Constraints, Frame borders and corner radii are not exposed by this tool.
Existing persisted Frames are neither converted nor removed.

### Compact construction and review

Planar repeated motifs can use the server `pattern` construction (faces, origin,
one or two count/step axes) instead of listing every vertex. The server expands
ordinary editable vectors under the same complete-draft limits; no new canonical
component or renderer is involved. Use existing prepared artifact IDs and targeted
operations to retain unaffected work. Structure review evaluates planned viewpoint,
proportion and layering criteria before detail; it never approves completion.
Final visual review still needs current evidence for all requested criteria and
reports regressions against the preceding review. It does not automatically judge
beauty, roll back work, or weaken the user's requested finish.


## AI tool orchestration

The installed local Codex code-mode runtime may compute draft data and compose
registered App tools. It does not gain workspace, shell or plugin access.
prepare_and_apply_design joins existing preparation and application, preserving
validation, measurement, inspection, permissions and the invocation transaction.
Its compact receipt omits duplicated context and ID lists; code may request full
receipts to select specific IDs without printing the full result to the model.
Concurrent writes queue; only adjacent read-only contour analyses overlap.
Fatal failure/cancellation prevents queued work from starting. Native script
outputs are diagnostics only and cannot become canonical action batches.
