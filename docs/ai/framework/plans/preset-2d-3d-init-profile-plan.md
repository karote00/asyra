# 3D and Hybrid Preset Profile Activation Plan

## Status

3D activated; HYBRID deferred and prerequisite-gated.

The approved [Preset 3D Foundation and App Migration](preset-3d-foundation-plan.md)
owns the active foundation/migration work and its Task 8 supplies the evidence
for the 3D gate below. Its Tasks 1-8 provide reviewed implementation, lifecycle and all three App
real-WebGL preservation evidence. Official `3D` is available with explicit empty
or INPUT-only defaults and optional generic lighting settings. This document retains the
activation criteria rather than duplicating that work plan. `HYBRID` remains
deferred and outside the new plan.

The public profile vocabulary is owned by the active Preset Profile and
Selectable Defaults plan:

- `2D`: available, preset-owned Pixi provider;
- `CUSTOM`: available, no preset-owned provider;
- `3D`: available, preset-owned lazy spatial provider;
- `HYBRID`: known but unavailable.

This plan no longer decides identifiers or associates defaults with profiles.
Its 3D activation gate is satisfied; it retains the prerequisites for the future
HYBRID transition. The foundation plan's Task 10 closeout remains separately gated.

## Non-Negotiable Separation

Profile selection controls only preset-owned render-engine provider policy.
The independent `defaults` option controls official preset module installation.
Activating a profile must not implicitly add, remove, or filter defaults.

Catalog metadata for unavailable profiles must not import, dynamically load,
bundle, instantiate, or simulate an engine.

The reviewed [3D composition contract](../specs/preset-3d-foundation.md#composition)
keeps the existing default catalog and resolution unchanged. Spatial definitions
are opt-in public exports composed through Core. The official 3D provider admits
empty defaults or explicit `INPUT`; incompatible selections (including omitted
defaults resolving to all eight) reject before mutation, never silently filter.

## 3D Activation Prerequisites

- a supported production 3D engine or supported external adapter implementing
  `@asyra/render-engine`;
- canonical camera, viewport, geometry, material, surface, hit-test,
  interaction, selection, and input contracts;
- load, undo/redo, persistence, local shared-channel, failure, cleanup, and
  instance-isolation cases;
- explicit capability failure behavior with no Pixi or placeholder fallback;
- app-level evidence demonstrating a complete production use case.

A fake contract-test engine does not qualify as the official provider.

## Hybrid Activation Prerequisites

- every participating engine satisfies the abstract engine contract;
- one explicit single- or multi-engine composition model;
- surface/render-order and resource-lifecycle ownership;
- camera, viewport, and coordinate conversion ownership;
- hit-test, selection, interaction, and input-routing ownership;
- deterministic failure cleanup across participating runtimes;
- convergence rules for state projected into more than one engine;
- formal product cases proving the full coordinated route.

Hybrid is not implemented by concatenating 2D and 3D defaults or providers.

## Activation Work

For one profile at a time:

1. Write the product contract and matching Inspector owner flow.
2. Bind the supported concrete provider through the abstract boundary without
   changing preset defaults selection.
3. Change only that profile catalog entry from `available: false` to
   `available: true` and set its preset-owned diagnostic engine id.
4. Add integration, failure, cleanup, instance-isolation, and real app cases.
5. Update package/app docs and run package, root, dependency, live, and visual
   gates.

## Product Cases

- unavailable `3D`/`HYBRID` fails before defaults or provider mutation;
- activation changes availability and provider policy only;
- omitted, empty, and explicit defaults resolve identically before and after a
  profile availability change;
- unsupported engine capabilities fail explicitly with no fallback surface;
- app customizations remain app-owned and run before Core startup;
- separate Core instances share no provider or engine resources.

## Definition of Done Per Activation

- every prerequisite has formal implementation evidence;
- the provider is production-capable, not a placeholder;
- profile/default independence remains formally tested;
- current `2D` and `CUSTOM` behavior remains compatible;
- affected package/app/Inspector, root, build, lint, dependency, live, and
  synchronized visual gates pass.
