---
{
  "description": "Correct an existing material while preserving mapping, local overrides and shared-source intent.",
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
route in the materials.review child. Reuse unrelated passes, preserve the whole-result obligation, and
set final on the actual final judgment. A completed mutation is distinct from a
durable save acknowledgment. Reloaded native fills preserve their stored mapping,
not lost source-world provenance or request-bound review credentials.

### Relevant capability handoffs

| Intent/data already available                   | Existing consumer                                                                                                                         | Required handoff and limit                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Correct existing local objects                  | execute_design_batch with a known contract and scoped target.query, or retained targets; discover only missing fields/routes              | Bounds plus relevant semantic/ancestor filters identify affected content. Query-bound argument slots are omitted, even empty placeholders. Respect expectedCount failures; do not increase expectedCount blindly. Prefer edits over reconstruction.                                                                                                                                                                                                       |

### Local correction after material selection

For a local material correction, resolve explicit current targets and inspect
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
