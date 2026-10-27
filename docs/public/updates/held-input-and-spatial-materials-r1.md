# Adopt held keyboard input and spatial material effects

## Scope and source boundary

Change `office-input-and-spatial-materials`, revision 1, 2026-10-28. This guide
covers the local candidate on `codex/office-src-reset` relative to source commit
`32ee264899f72a67d0f3585f99fcf8cb2c054090`. The candidate commit is recorded in
PR #361 after validation. It is pending source work, not a published release or
an independently verified registry-to-registry upgrade. Use the candidate's
matching Input System, Utils, Render Engine and Preset sources and declarations;
no dependency or document schema upgrade is required by this guide.

## Contracts and adoption

For continuous keyboard controls, register through Core's
`registerInputKeyCombinations`, with `keyboardMode: 'held'`. The key list observes
alternatives rather than an exact simultaneous chord. Read `RawInputEvent.keys`,
`modifiers`, and `keyboard` metadata. Phases are `down`, `up`, and `cancel`;
modifier changes notify while a tracked key is held. Apply the app's editable
input, modifier and composition policies in the callback; returning `false`
rejects semantic dispatch and preserves the native keydown default. Blur, focus
changes, composition start, hidden documents and host detach cancel held state.
Retain the unregister callback and cancel app-owned animation work on disposal.
Ordinary chord and pointer registrations preserve their previous behavior.
Remove duplicate native keyboard handlers only for controls adopting this route.

Spatial mesh descriptors gain `emissive` (24-bit sRGB), `emissiveIntensity`
(finite nonnegative multiplier), and `environmentIntensity` (finite nonnegative
multiplier), all defaulting to zero. Use public descriptors rather than Three
materials. Emission is self-radiance, not a light illuminating nearby surfaces.
Positive environment intensity opts into a studio reflection map generated once
per engine and released on teardown, not a live scene capture. Metalness and
roughness still control the material response. Appearance updates and distant
instances retain these settings; malformed values are rejected at admission.
Restricted GLB import still rejects emissive materials. Directional shadow
receiver bias now follows the configured world-space shadow footprint to reduce
self-shadow banding; review contact shadows in existing spatial scenes.

Optionally set `spatial.bloom: { strength: 0.45, radius: 8 }` when applying the
3D preset. It is disabled by default. Strength is finite in [0, 2]; radius is
finite in (0, 64] CSS pixels. The provider adds an emission-only screen-space
halo, with opaque occlusion and transparency attenuation, before overlays.
This adds no animation loop and no neighboring-surface illumination. Injected
render drivers must support the documented render-target operations; unsupported
drivers fail explicitly. Preset owns resource resizing, reuse and cleanup.

## Preservation and verification

Keep app-owned key maps, modifiers, editing rules, camera timing, appearance
parameters, custom fields and persistence semantics. These APIs do not migrate
stored documents. If an app persists descriptors, its existing schema must
explicitly admit any newly saved fields and verify save/reload preservation.
Unadopted controls and materials retain their defaults. Consumers may defer
bloom or reflections while adopting held input independently.

Required checks are the Input System held-keyboard and runtime-reset suites,
Preset spatial admission, lighting, engine, emissive-bloom and reflection suites,
and each adopting app's input and visual tests. Verify press/release, editor
focus, composition, disposal and existing chords; verify material updates,
zero/default behavior, occlusion, resize and teardown. The Office integration
also has hardware-rendered pantry/night-light review tests. Passing evidence is
recorded by the candidate's local validation and CI; this guide does not itself
claim those checks passed or that package publication occurred.

For the next update, retain an adoption note naming the exact installed source,
retained extensions and overrides, deferred effects, and test/artifact results.
Review intervening app changes before applying a later guide.

## Canonical sources

- [Input System contract](../../ai/framework/packages/input-system.md)
- [Preset contract](../../ai/framework/packages/preset.md)
- [Spatial foundation specification](../../ai/framework/specs/preset-3d-foundation.md)
- [Public Input System API](../reference/packages/input-system.md)
- [Public Preset material API](../reference/packages/preset.md)
