# Asyra Release Notes

## Pending - Held input consumer fixture

```update-note
{
  "change": "office-held-input-consumer-fixture",
  "owner": "Asyra Design test infrastructure",
  "summary": "Complete the fake browser Window document lifecycle in the existing history-direction test for Input System visibility cancellation.",
  "sources": [
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Test-only browser-host fixture correction; history direction assertions and product behavior are unchanged."
}
```

## Pending - Office furnished pantry review

```update-note
{
  "change": "office-furnished-pantry-review",
  "owner": "Asyra Office development",
  "summary": "Add reference-based room furnishings, transparent pantry vessels, two night-light variants, the approved recessed-fridge/single-door pantry layout, four-room depth expansion, rear-neighborhood relocation and held-key camera controls; retain reviewed geometry and formal asset/visual checks.",
  "sources": [
    "apps/asyra-office/src/scene/__tests__/building-expansion.test.ts",
    "apps/asyra-office/src/scene/__tests__/fixtures/building-before-expansion.json",
    "apps/asyra-office/src/scene/__tests__/pantry-layout.test.ts",
    "apps/asyra-office/src/scene/reference/pantry-layout.json",
    "assets/asyra-office/models/pantry-smallware/reference-preparation-counter.png",
    "assets/asyra-office/models/pantry/review/pantry-top-layout-proposal-layout.json",
    "assets/asyra-office/models/pantry/review/pantry-top-layout-proposal.png",
    "assets/asyra-office/models/pantry/review/pantry-top-layout-proposal.svg",
    "apps/asyra-office/e2e/interior.spec.ts",
    "apps/asyra-office/playwright.config.ts",
    "apps/asyra-office/src/__tests__/browser-configuration.test.ts",
    "apps/asyra-office/e2e/night-lights.spec.ts",
    "apps/asyra-office/e2e/pantry-vessels.spec.ts",
    "apps/asyra-office/e2e/pantry.spec.ts",
    "apps/asyra-office/e2e/render-workload.spec.ts",
    "apps/asyra-office/e2e/helpers/render-workload.ts",
    "apps/asyra-office/e2e/structure-hardware.spec.ts",
    "apps/asyra-office/src/assets/__tests__/architecture-detail.test.ts",
    "apps/asyra-office/src/assets/__tests__/frame-night-light.test.ts",
    "apps/asyra-office/src/assets/__tests__/fridge-front.test.ts",
    "apps/asyra-office/src/assets/__tests__/low-stool.test.ts",
    "apps/asyra-office/src/assets/__tests__/pantry-accessories.test.ts",
    "apps/asyra-office/src/assets/__tests__/pantry-night-light.test.ts",
    "apps/asyra-office/src/assets/__tests__/pantry-shelf-plant.test.ts",
    "apps/asyra-office/src/assets/__tests__/pantry-vessels.test.ts",
    "apps/asyra-office/src/assets/__tests__/plants.test.ts",
    "apps/asyra-office/src/assets/__tests__/water-bottle.test.ts",
    "apps/asyra-office/src/assets/catalog.ts",
    "apps/asyra-office/src/assets/frame-night-light.ts",
    "apps/asyra-office/src/assets/low-stool.ts",
    "apps/asyra-office/src/assets/pantry-accessories.ts",
    "apps/asyra-office/src/assets/pantry-counterware.ts",
    "apps/asyra-office/src/assets/preparation-sink.ts",
    "apps/asyra-office/src/assets/__tests__/preparation-sink.test.ts",
    "apps/asyra-office/src/assets/__tests__/pantry-counterware.test.ts",
    "apps/asyra-office/src/assets/pantry-details.ts",
    "apps/asyra-office/src/assets/pantry-night-light.ts",
    "apps/asyra-office/src/assets/pantry-shelf-plant.ts",
    "apps/asyra-office/src/assets/pantry-smallware.ts",
    "apps/asyra-office/src/assets/pantry-vessels.ts",
    "apps/asyra-office/src/assets/plant-growth.ts",
    "apps/asyra-office/src/assets/plants.ts",
    "apps/asyra-office/src/assets/vessel-label.ts",
    "apps/asyra-office/src/assets/wall-sconce.ts",
    "apps/asyra-office/src/preview/__tests__/vegetation-controller.test.ts",
    "apps/asyra-office/src/preview/vegetation-controller.ts",
    "apps/asyra-office/src/scene/__tests__/emissive-material.test.ts",
    "apps/asyra-office/src/scene/__tests__/color-batching.test.ts",
    "apps/asyra-office/src/scene/color-batching.ts",
    "apps/asyra-office/src/scene/__tests__/metal-material.test.ts",
    "apps/asyra-office/src/scene/__tests__/office-seating.test.ts",
    "apps/asyra-office/src/scene/__tests__/room-furnishings.test.ts",
    "apps/asyra-office/src/scene/__tests__/runtime.test.ts",
    "apps/asyra-office/src/scene/__tests__/seating-construction.test.ts",
    "apps/asyra-office/src/scene/__tests__/structure-stage.test.ts",
    "apps/asyra-office/src/scene/__tests__/surfaces.test.ts",
    "apps/asyra-office/src/scene/__tests__/transparent-assets.test.ts",
    "apps/asyra-office/src/scene/discussion-furnishings.ts",
    "apps/asyra-office/src/scene/ingredient-surface.ts",
    "apps/asyra-office/src/scene/lounge-furnishings.ts",
    "apps/asyra-office/src/scene/office-details.ts",
    "apps/asyra-office/src/scene/office-interior.ts",
    "apps/asyra-office/src/scene/office-seating.ts",
    "apps/asyra-office/src/scene/pantry-furnishings.ts",
    "apps/asyra-office/src/scene/porcelain-surface.ts",
    "apps/asyra-office/src/scene/reference-scene.ts",
    "apps/asyra-office/src/scene/room-furnishing-helpers.ts",
    "apps/asyra-office/src/scene/room-furnishings.ts",
    "apps/asyra-office/src/scene/runtime.ts",
    "apps/asyra-office/src/scene/surfaces.ts",
    "apps/asyra-office/src/ui/OfficeScene.tsx",
    "apps/asyra-office/src/ui/__tests__/camera-keyboard.test.ts",
    "apps/asyra-office/src/ui/camera-keyboard.ts",
    "assets/asyra-office/models/pantry-smallware/frame-night-light-reference.png",
    "assets/asyra-office/models/pantry-smallware/pantry-smallware-model-spec.json",
    "assets/asyra-office/models/pantry-smallware/reference-cork-jar.png",
    "assets/asyra-office/models/pantry-smallware/reference-frame-night-light-second-angle.png",
    "assets/asyra-office/models/pantry-smallware/reference-frame-night-light.png",
    "assets/asyra-office/models/pantry-smallware/reference-fridge-night-light.png",
    "assets/asyra-office/models/pantry-smallware/reference-shelf-condiments.png",
    "assets/asyra-office/models/pantry-smallware/review/shelf-enlarged-reference.png",
    "assets/asyra-office/models/pantry/pantry-model-spec.json",
    "assets/asyra-office/models/pantry/review/dispenser-jug-photo-reference.png",
    "assets/asyra-office/models/small-plants/small-plants-model-spec.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Private preview or internal documentation tooling; no consumer API or stored-data migration."
}
```

```update-note
{
  "change": "office-review-flow-and-guidance",
  "owner": "Internal documentation tooling",
  "summary": "Synchronize the Office review contract and register the shared input/material adoption guide.",
  "sources": [
    "apps/asyra-framework-site/public/llms.txt",
    "docs/public/content-manifest.json",
    "docs/public/generated/api-index.json",
    "docs/public/generated/content-index.json",
    "docs/public/generated/package-reference.json",
    "docs/public/generated/source-map.json",
    "docs/public/llms.txt",
    "tools/flow-inspector/inspectors/asyra-office-flow-inspector.data.cjs",
    "tools/flow-inspector/workspace/workspace-bundle.data.js"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Private preview or internal documentation tooling; no consumer API or stored-data migration."
}
```

This file tracks releases for Asyra. Previous releases under Asyra (v0.1.0,
etc.) are not included here.

## Pending - Approved office structure

```update-note
{
  "change": "office-approved-structure",
  "owner": "Asyra Office development",
  "summary": "Apply owner-approved shared-floor and stepped-wall construction, complete entrance and white pantry floor finish; retain independent numeric and hardware visual evidence. Retire rejected room-layout fixtures while retaining reusable asset recipes.",
  "sources": [
    "apps/asyra-office/.env.example",
    "assets/asyra-office/models/pantry/pantry-model-spec.json",
    "apps/asyra-office/e2e/structure-hardware.spec.ts",
    "apps/asyra-office/src/assets/__tests__/clock.test.ts",
    "apps/asyra-office/src/assets/pantry-smallware.ts",
    "apps/asyra-office/src/scene/__tests__/approved-structure.test.ts",
    "apps/asyra-office/src/scene/__tests__/artwork.test.ts",
    "apps/asyra-office/src/scene/__tests__/entrance-structure.test.ts",
    "apps/asyra-office/src/scene/__tests__/structure-circulation.test.ts",
    "apps/asyra-office/src/scene/__tests__/structure-stage.test.ts",
    "apps/asyra-office/src/scene/__tests__/wall-joins.test.ts",
    "apps/asyra-office/src/scene/artwork.ts",
    "apps/asyra-office/src/scene/entry-frame.ts",
    "apps/asyra-office/src/scene/interior-plants.ts",
    "apps/asyra-office/src/scene/lettering.ts",
    "apps/asyra-office/src/scene/reference/office-structure.json",
    "apps/asyra-office/src/scene/wall-joins.ts",
    "assets/asyra-office/models/architecture/review/draw_office_structure_proposal.py",
    "assets/asyra-office/models/architecture/review/live-approved-structure-close.png",
    "assets/asyra-office/models/architecture/review/live-approved-structure-overview.png",
    "assets/asyra-office/models/architecture/review/live-approved-structure-record.json",
    "assets/asyra-office/models/architecture/review/lounge-proportion-measurements.json",
    "assets/asyra-office/models/architecture/review/lounge-proportion-source.png",
    "assets/asyra-office/models/architecture/review/lounge-wall-proportions-review.png",
    "assets/asyra-office/models/architecture/review/lounge_proportion_geometry.py",
    "assets/asyra-office/models/architecture/review/office-single-floor-structure-proposal-v1.json",
    "assets/asyra-office/models/architecture/review/office-single-floor-structure-proposal-v1.png",
    "assets/asyra-office/models/architecture/review/test_office_structure_proposal.py",
    "tools/flow-inspector/workspace/workspace-bundle.data.js"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Private app review milestone. No public API, hosted deployment or consumer migration. Furniture admission follows separately."
}
```

## Pending - Asyra Office reference scene preview

```update-note
{
  "change": "office-reference-scene-preview",
  "owner": "Asyra Office development",
  "summary": "Render the owner-approved single-floor office structure and complete fixed-left/operable-right entrance through the official spatial provider. Preserve outdoor scenery, varied vegetation and smooth camera controls. Remove the rejected furnished-layout branch so factory defaults match the live stage; admit new furniture separately. Keep standalone asset review and reusable appearance/size recipes. Lighting banding, furnishings and full product behavior remain pending.",
  "sources": [
    "tools/flow-inspector/inspectors/asyra-office-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/office-rebuild/rebuild.flow.json",
    "apps/asyra-office/src/assets/__tests__/construction.test.ts",
    "apps/asyra-office/src/assets/__tests__/companions.test.ts",
    "apps/asyra-office/src/assets/__tests__/plants.test.ts",
    "apps/asyra-office/src/assets/plants.ts",
    "apps/asyra-office/src/assets/plant-growth.ts",
    "assets/asyra-office/models/small-plants/small-plants-model-spec.json",
    "assets/asyra-office/models/small-plants/GEOMETRY-SUPPLEMENT.md",
    "assets/asyra-office/models/small-plants/README.md",
    "apps/asyra-office/src/assets/plant-vessels.ts",
    "apps/asyra-office/src/assets/__tests__/vegetation-contract.test.ts",
    "apps/asyra-office/src/assets/__tests__/canopy.test.ts",
    "apps/asyra-office/src/assets/tree-growth.ts",
    "apps/asyra-office/src/assets/tree-branching.ts",
    "apps/asyra-office/src/assets/__tests__/tree-branching.test.ts",
    "apps/asyra-office/src/assets/__tests__/tree-growth.test.ts",
    "assets/asyra-office/models/street/BARE-TREE.md",
    "assets/asyra-office/models/street/TREE-CONSTRUCTION.md",
    "assets/asyra-office/models/street/tree-construction-spec.json",
    "assets/asyra-office/models/street/review/06-street-tree-review.md",
    "apps/asyra-office/src/preview/vegetation-controller.ts",
    "apps/asyra-office/src/preview/__tests__/vegetation-controller.test.ts",
    "apps/asyra-office/e2e/vegetation.spec.ts",
    "apps/asyra-office/e2e/foliage.spec.ts",
    "apps/asyra-office/e2e/tree.spec.ts",
    "apps/asyra-office/e2e/camera.spec.ts",
    "apps/asyra-office/src/ui/camera-keyboard.ts",
    "apps/asyra-office/src/ui/__tests__/camera-keyboard.test.ts",
    "apps/asyra-office/src/assets/__tests__/vegetation.test.ts",
    "apps/asyra-office/src/assets/__tests__/wall.test.ts",
    "apps/asyra-office/src/assets/catalog.ts",
    "apps/asyra-office/src/assets/furnishings.ts",
    "apps/asyra-office/src/assets/desk-items.ts",
    "apps/asyra-office/src/assets/__tests__/desk-items.test.ts",
    "apps/asyra-office/src/assets/geometry.ts",
    "apps/asyra-office/src/assets/instances.ts",
    "apps/asyra-office/src/assets/lantern.ts",
    "apps/asyra-office/src/assets/puppets.ts",
    "apps/asyra-office/src/assets/specification.ts",
    "apps/asyra-office/src/assets/upholstered-panel.ts",
    "assets/asyra-office/models/furniture/furniture-model-spec.json",
    "apps/asyra-office/e2e/asset-catalog.spec.ts",
    "apps/asyra-office/src/assets/__tests__/architecture-detail.test.ts",
    "apps/asyra-office/src/assets/__tests__/awning.test.ts",
    "apps/asyra-office/src/assets/__tests__/furniture-reference.test.ts",
    "apps/asyra-office/src/assets/__tests__/pillow.test.ts",
    "apps/asyra-office/src/assets/__tests__/placement-lod.test.ts",
    "apps/asyra-office/src/assets/__tests__/street-detail.test.ts",
    "apps/asyra-office/src/assets/awning.ts",
    "apps/asyra-office/src/assets/bench.ts",
    "apps/asyra-office/src/assets/chalkboard.ts",
    "apps/asyra-office/src/assets/clock.ts",
    "apps/asyra-office/src/assets/manhole.ts",
    "apps/asyra-office/src/assets/pantry-details.ts",
    "apps/asyra-office/src/assets/pillow.ts",
    "apps/asyra-office/src/assets/profile-extrusion.ts",
    "apps/asyra-office/src/assets/puppet-garments.ts",
    "apps/asyra-office/src/assets/radial-solid.ts",
    "apps/asyra-office/src/assets/recessed-panel.ts",
    "apps/asyra-office/src/assets/road-opening.ts",
    "apps/asyra-office/src/assets/rounded-turning.ts",
    "apps/asyra-office/src/assets/solid-subtraction.ts",
    "apps/asyra-office/src/assets/tea-chair.ts",
    "apps/asyra-office/src/assets/vegetation.ts",
    "apps/asyra-office/src/assets/wall.ts",
    "apps/asyra-office/src/scene/__tests__/runtime.test.ts",
    "apps/asyra-office/src/scene/__tests__/scene.test.ts",
    "apps/asyra-office/src/scene/__tests__/surfaces.test.ts",
    "apps/asyra-office/src/scene/controller.ts",
    "apps/asyra-office/src/scene/reference-scene.ts",
    "apps/asyra-office/src/scene/runtime.ts",
    "apps/asyra-office/src/scene/surfaces.ts",
    "apps/asyra-office/src/ui/Icons.tsx",
    "apps/asyra-office/src/ui/OfficeScene.tsx",
    "apps/asyra-office/src/ui/office.css",
    "apps/asyra-office/src/main.tsx",
    "apps/asyra-office/e2e/scene.spec.ts",
    "apps/asyra-office/e2e/office.spec.ts",
    "apps/asyra-office/README.md",
    "apps/asyra-office/src/scene/office-layout.ts",
    "apps/asyra-office/src/scene/office-interior.ts",
    "apps/asyra-office/src/scene/office-details.ts",
    "apps/asyra-office/src/scene/__tests__/office-interior.test.ts",
    "apps/asyra-office/src/scene/__tests__/__snapshots__/office-interior.test.ts.snap",
    "apps/asyra-office/e2e/interior.spec.ts",
    "apps/asyra-office/playwright.config.ts",
    "apps/asyra-office/src/__tests__/browser-configuration.test.ts",
    "apps/asyra-office/scripts/fit-interior.py",
    "apps/asyra-office/scripts/export-interior-meshes.ts",
    "apps/asyra-office/scripts/compare-interior.py",
    "apps/asyra-office/src/scene/reference/interior-landmarks.json",
    "apps/asyra-office/src/scene/reference/interior-fit.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Private local rebuild preview only, without live provider work or a deployment. Asset fidelity and manual visual acceptance remain open; app README documents current limitations."
}
```

## Pending - Asyra Office first wall review

```update-note
{
  "change": "office-first-wall-review",
  "owner": "Asyra Office development",
  "summary": "Add the first procedural wall and an official Preset 3D review harness with five views, detail inspection, replaceable appearance and bounded LoD.",
  "sources": [
    "tools/flow-inspector/inspectors/office-rebuild/rebuild.flow.json",
    "apps/asyra-office/src/assets/__tests__/wall.test.ts",
    "apps/asyra-office/src/assets/wall.ts",
    "apps/asyra-office/src/main.tsx",
    "apps/asyra-office/src/preview/AssetPreview.tsx",
    "apps/asyra-office/src/preview/__tests__/controller.test.ts",
    "apps/asyra-office/src/preview/__tests__/runtime.test.ts",
    "apps/asyra-office/src/preview/controller.ts",
    "apps/asyra-office/src/preview/runtime.ts",
    "apps/asyra-office/src/styles.css",
    "apps/asyra-office/e2e/office.spec.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Private rebuild checkpoint only, pending user visual acceptance. No public package contract or hosted deployment is changed; see apps/asyra-office/README.md for local review."
}
```

## Pending - Asyra Office rebuild architecture

```update-note
{
  "change": "office-rebuild-architecture",
  "owner": "Asyra Office development",
  "summary": "Replace the retired Office flow with the reviewed rebuild ownership map and first asset review criteria.",
  "sources": [
    "tools/flow-inspector/inspectors/asyra-office-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/office-rebuild/rebuild.flow.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Internal architecture and review contract only; no package API or hosted app release is introduced."
}
```

## Pending - Asyra Office source reset

This internal development checkpoint deliberately removes the previous Office
implementation and its colocated tests. The app cannot run, build or pass its
existing source checks until the rebuild supplies a new implementation. Approved
asset references and specifications remain available. The replacement product
and implementation plans are documentation only; this checkpoint is not a
deployable update and must not replace an existing deployment.

```update-note
{
  "change": "office-source-reset-for-rebuild",
  "owner": "Asyra Office private app development",
  "summary": "Remove the previous app source and colocated tests for an explicitly requested rebuild, preserving approved asset references and documenting the replacement plan.",
  "sources": [
    "apps/asyra-office/src/domain/__tests__/layout.test.ts",
    "apps/asyra-office/src/domain/layout.ts",
    "apps/asyra-office/src/main.tsx",
    "apps/asyra-office/src/runtime/__tests__/app-environment.test.ts",
    "apps/asyra-office/src/runtime/__tests__/office-runtime.test.ts",
    "apps/asyra-office/src/runtime/__tests__/profile-bundle.test.ts",
    "apps/asyra-office/src/runtime/layout-controller.ts",
    "apps/asyra-office/src/runtime/office-runtime.ts",
    "apps/asyra-office/src/scene/__tests__/office-scene.test.ts",
    "apps/asyra-office/src/scene/office-scene.ts",
    "apps/asyra-office/src/ui/OfficeApp.tsx",
    "apps/asyra-office/src/ui/__tests__/OfficeApp.test.tsx",
    "apps/asyra-office/src/ui/styles.css"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Internal, non-deployable development checkpoint only. No public package or hosted app update is being delivered, so existing consumers have no integration action. Developers must not run or deploy this empty source checkpoint as an app; runtime validation remains blocked until the separately authorized rebuild."
}
```

## Pending - FieldScope profile CI

```update-note
{
  "change": "fieldscope-profile-ci-budget",
  "owner": "Repository CI and Asyra FieldScope test tooling",
  "summary": "Keep profile process deadlines independent from job setup and run costly midpoint proofs in separate bounded CI jobs.",
  "sources": [
    ".github/workflows/fieldscope-profile.yml",
    "apps/asyra-fieldscope/scripts/__tests__/run-profile-groups.test.mjs",
    "apps/asyra-fieldscope/scripts/run-profile-groups.py",
    "apps/asyra-fieldscope/src/domain/__tests__/walking-constrained-kinematics-midpoint-profile-one.profile.test.ts",
    "apps/asyra-fieldscope/src/domain/__tests__/walking-constrained-kinematics-midpoint-profile-two-phase-one.profile.test.ts",
    "apps/asyra-fieldscope/src/domain/__tests__/walking-constrained-kinematics-midpoint-profile-two-phase-zero.profile.test.ts",
    "apps/asyra-fieldscope/src/domain/__tests__/walking-constrained-kinematics-midpoint-test-fixtures.ts",
    "apps/asyra-fieldscope/src/domain/__tests__/walking-constrained-kinematics.profile.test.ts",
    "scripts/__tests__/ci-scope.test.mjs",
    "scripts/__tests__/workspace-automation.test.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Internal test scheduling and evidence only; product behavior, original assertions and supervisor process limits are unchanged. No consumer integration is required."
}
```

## Pending - Asyra Office reference assets and CI

These entries describe unreleased development inputs. They do not announce model
acceptance or authorize a package release or App deployment.

```update-note
{
  "change": "office-reviewed-asset-construction",
  "owner": "Asyra Office reference assets",
  "summary": "Review existing asset geometry specifications, preserve source drawings and add numeric reconstruction checks.",
  "sources": [
    "assets/asyra-office/models/accent-furniture/accent-furniture-model-spec.json",
    "assets/asyra-office/models/accent-furniture/review/__tests__/test_pedestal_side_table_spec.py",
    "assets/asyra-office/models/accent-furniture/review/__tests__/test_square_low_stool_spec.py",
    "assets/asyra-office/models/animals-cat-dog/animals-model-spec.json",
    "assets/asyra-office/models/animals-cat-dog/review/__tests__/test_sleeping_cat_spec.py",
    "assets/asyra-office/models/animals-cat-dog/review/__tests__/test_standing_corgi_spec.py",
    "assets/asyra-office/models/animals-cat-dog/review/document-only/01-sleeping-cat-v1.png",
    "assets/asyra-office/models/animals-cat-dog/review/document-only/02-standing-corgi-v1.png",
    "assets/asyra-office/models/animals-sparrow-parrot/birds-model-spec.json",
    "assets/asyra-office/models/animals-sparrow-parrot/review/__tests__/test_cockatiel_spec.py",
    "assets/asyra-office/models/animals-sparrow-parrot/review/__tests__/test_tree_sparrow_spec.py",
    "assets/asyra-office/models/architecture/architecture-model-spec.json",
    "assets/asyra-office/models/architecture/materials/floor-natural-oak-v1.png",
    "assets/asyra-office/models/architecture/review/01-wall-v2.png",
    "assets/asyra-office/models/architecture/review/01-wall-v5-end-detail.png",
    "assets/asyra-office/models/architecture/review/01-wall-v5.png",
    "assets/asyra-office/models/architecture/review/02-floor-natural-oak-albedo-v1.png",
    "assets/asyra-office/models/architecture/review/02-floor-original-grain-reference.png",
    "assets/asyra-office/models/architecture/review/02-floor-v2.png",
    "assets/asyra-office/models/architecture/review/02-floor-v6.json",
    "assets/asyra-office/models/architecture/review/02-floor-v6.svg",
    "assets/asyra-office/models/architecture/review/02-floor-v7-grain-detail.png",
    "assets/asyra-office/models/architecture/review/02-floor-v7-side-detail.png",
    "assets/asyra-office/models/architecture/review/02-floor-v7.json",
    "assets/asyra-office/models/architecture/review/02-floor-v7.png",
    "assets/asyra-office/models/architecture/review/02-floor-v7.svg",
    "assets/asyra-office/models/architecture/review/03-partition-v2.png",
    "assets/asyra-office/models/architecture/review/03-partition-v5-side-detail.png",
    "assets/asyra-office/models/architecture/review/03-partition-v5-side.json",
    "assets/asyra-office/models/architecture/review/03-partition-v5.png",
    "assets/asyra-office/models/architecture/review/06-window-joint-lower-right-detail.png",
    "assets/asyra-office/models/architecture/review/06-window-joint-upper-left-detail.png",
    "assets/asyra-office/models/architecture/review/06-window-joint-upper-right-detail.png",
    "assets/asyra-office/models/architecture/review/06-window-quarter-authority-detail.png",
    "assets/asyra-office/models/architecture/review/06-window-v2.png",
    "assets/asyra-office/models/architecture/review/06-window-v6-front-junction-detail.png",
    "assets/asyra-office/models/architecture/review/06-window-v6-top-detail.png",
    "assets/asyra-office/models/architecture/review/06-window-v6.png",
    "assets/asyra-office/models/architecture/review/draw_floor_sheet.py",
    "assets/asyra-office/models/architecture/review/draw_partition_side.py",
    "assets/asyra-office/models/clay-paving/clay-paving-model-spec.json",
    "assets/asyra-office/models/desk-items/desk-items-model-spec.json",
    "assets/asyra-office/models/furniture/furniture-model-spec.json",
    "assets/asyra-office/models/furniture/review/02-work-chair-post-review-crop.png",
    "assets/asyra-office/models/furniture/review/04-armchair-v1.png",
    "assets/asyra-office/models/furniture/review/__tests__/test_coffee_table_spec.py",
    "assets/asyra-office/models/furniture/review/__tests__/test_two_seat_sofa_spec.py",
    "assets/asyra-office/models/furniture/review/__tests__/test_work_chair_spec.py",
    "assets/asyra-office/models/furniture/review/__tests__/test_writing_desk_spec.py",
    "assets/asyra-office/models/furniture/source/side-source-reset/five-views-v3-wider.png",
    "assets/asyra-office/models/garden-masonry/garden-masonry-model-spec.json",
    "assets/asyra-office/models/meeting-furniture/meeting-furniture-model-spec.json",
    "assets/asyra-office/models/meeting-furniture/review/02-blank-whiteboard-side-v2.svg",
    "assets/asyra-office/models/meeting-furniture/review/02-blank-whiteboard-v2.png",
    "assets/asyra-office/models/meeting-furniture/review/__tests__/test_meeting_table_spec.py",
    "assets/asyra-office/models/meeting-furniture/review/__tests__/test_whiteboard_spec.py",
    "assets/asyra-office/models/meeting-furniture/review/draw_whiteboard_side.py",
    "assets/asyra-office/models/meeting-furniture/review/whiteboard-side-record.json",
    "assets/asyra-office/models/meeting-stationery/meeting-stationery-model-spec.json",
    "assets/asyra-office/models/outdoor-accents/outdoor-accents-model-spec.json",
    "assets/asyra-office/models/outdoor-accents/review/01-park-bench-v4.png",
    "assets/asyra-office/models/outdoor-accents/review/02-entry-chalkboard-annotated-v1.png",
    "assets/asyra-office/models/outdoor-accents/review/02-entry-chalkboard-annotation-layer.png",
    "assets/asyra-office/models/outdoor-accents/review/annotate-entry-chalkboard.py",
    "assets/asyra-office/models/outdoor-accents/review/bench-reference-layout.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/01-park-bench-v4.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/back.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/bench-reference-layout.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/bench_geometry.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/bench_projection.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/compose-bench-reference.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/front.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/outdoor-accents-model-spec.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/right.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/three-quarter.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/1a78a5b98d3a93b6/top.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/01-park-bench-v4.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/back.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/bench-reference-layout.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/bench_geometry.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/bench_projection.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/compose-bench-reference.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/front.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/outdoor-accents-model-spec.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/right.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/three-quarter.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/43e3a9c5fa4d3704/top.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/01-park-bench-v4.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/back.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/bench-reference-layout.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/bench_geometry.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/bench_projection.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/compose-bench-reference.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/front.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/outdoor-accents-model-spec.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/right.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/three-quarter.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/a64146dc813f48c9/top.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/01-park-bench-v4.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/back.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/bench-reference-layout.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/bench_geometry.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/bench_projection.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/compose-bench-reference.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/front.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/outdoor-accents-model-spec.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/right.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/three-quarter.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/bbe209cebb231784/top.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/01-park-bench-v4.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/back.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/bench-reference-layout.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/bench_geometry.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/bench_projection.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/compose-bench-reference.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/front.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/outdoor-accents-model-spec.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/right.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/three-quarter.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-review-runs/cd37977d065a6123/top.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/back-caps-detail.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/back-comparison.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/back-overlay.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/back.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/comparison-run.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/comparison.json",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/front-comparison.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/front-overlay.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/front.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/oblique-seat-frame-detail.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/right-arm-post-detail.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/right-comparison.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/right-overlay.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/right.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/three-quarter-comparison.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/three-quarter-overlay.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/three-quarter.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/top-comparison.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/top-overlay.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/top-rear-return-detail.png",
    "assets/asyra-office/models/outdoor-accents/review/bench-v4-evidence/top.png",
    "assets/asyra-office/models/outdoor-accents/review/bench_geometry.py",
    "assets/asyra-office/models/outdoor-accents/review/bench_projection.py",
    "assets/asyra-office/models/outdoor-accents/review/chalkboard-annotation-record.json",
    "assets/asyra-office/models/outdoor-accents/review/compare_bench_reference.py",
    "assets/asyra-office/models/outdoor-accents/review/compose-bench-reference.py",
    "assets/asyra-office/models/outdoor-accents/review/historical/common-projection-before-arm-profile/01-park-bench-v4.png",
    "assets/asyra-office/models/outdoor-accents/review/historical/common-projection-before-arm-profile/bench-reference-layout.json",
    "assets/asyra-office/models/outdoor-accents/review/historical/common-projection-before-arm-profile/outdoor-accents-model-spec.json",
    "assets/asyra-office/models/outdoor-accents/review/historical/rejected-bench-v2/01-park-bench-v2.png",
    "assets/asyra-office/models/outdoor-accents/review/historical/rejected-bench-v2/bench-projection-measurements.json",
    "assets/asyra-office/models/outdoor-accents/review/historical/rejected-bench-v2/draw-bench-projections.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/historical/top-only-v3/01-park-bench-v3.png",
    "assets/asyra-office/models/outdoor-accents/review/historical/top-only-v3/bench-reference-layout.json",
    "assets/asyra-office/models/outdoor-accents/review/historical/top-only-v3/bench-top-projection.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/historical/top-only-v3/compose-bench-reference.py.txt",
    "assets/asyra-office/models/outdoor-accents/review/test_bench_reference.py",
    "assets/asyra-office/models/outdoor-shade/outdoor-shade-model-spec.json",
    "assets/asyra-office/models/pantry/pantry-model-spec.json",
    "assets/asyra-office/models/park-railing/park-railing-model-spec.json",
    "assets/asyra-office/models/park-railing/review/01-railing-post-v3.png",
    "assets/asyra-office/models/park-railing/review/02-railing-panel-v2.png",
    "assets/asyra-office/models/park-railing/review/draw-railing-panel-projections.py",
    "assets/asyra-office/models/park-railing/review/draw-railing-post-projections.py",
    "assets/asyra-office/models/park-railing/review/panel-projection-measurements.json",
    "assets/asyra-office/models/park-railing/review/post-projection-measurements.json",
    "assets/asyra-office/models/people/man-puppet-model-spec.json",
    "assets/asyra-office/models/people/man-reference-measurements.json",
    "assets/asyra-office/models/people/people-model-spec.json",
    "assets/asyra-office/models/people/review/__tests__/test_woman_puppet_spec.py",
    "assets/asyra-office/models/people/review/test_puppet_spec.py",
    "assets/asyra-office/models/people/woman-puppet-model-spec.json",
    "assets/asyra-office/models/people/woman-reference-measurements.json",
    "assets/asyra-office/models/planters/planters-model-spec.json",
    "assets/asyra-office/models/portable-lamps/portable-lamps-model-spec.json",
    "assets/asyra-office/models/railing-corner/review/01-level-handrail-corner-v1.png",
    "assets/asyra-office/models/railing-corner/review/01-level-handrail-corner-v2.png",
    "assets/asyra-office/models/railing-transitions/review/01-upper-transition-post-v1.png",
    "assets/asyra-office/models/railing-transitions/review/01-upper-transition-post-v2.png",
    "assets/asyra-office/models/railing-transitions/review/02-lower-transition-post-v14-top-inspection.png",
    "assets/asyra-office/models/railing-transitions/review/02-lower-transition-post-v14.png",
    "assets/asyra-office/models/railing-transitions/review/02-lower-transition-post-v2.png",
    "assets/asyra-office/models/rest-furniture/rest-furniture-model-spec.json",
    "assets/asyra-office/models/rest-furniture/review/__tests__/test_daybed_spec.py",
    "assets/asyra-office/models/rest-furniture/review/__tests__/test_sleeping_pillow_spec.py",
    "assets/asyra-office/models/serving-smallware/serving-smallware-model-spec.json",
    "assets/asyra-office/models/shared/review/__tests__/test_remaining_specs.py",
    "assets/asyra-office/models/shop-awning/review/01-striped-shop-awning-annotated-v1.png",
    "assets/asyra-office/models/shop-awning/review/01-striped-shop-awning-annotation-layer.png",
    "assets/asyra-office/models/shop-awning/review/annotate-shop-awning.py",
    "assets/asyra-office/models/shop-awning/review/awning-annotation-record.json",
    "assets/asyra-office/models/shop-awning/shop-awning-model-spec.json",
    "assets/asyra-office/models/small-plants/small-plants-model-spec.json",
    "assets/asyra-office/models/sofa-variants/review/__tests__/test_curved_sofa_spec.py",
    "assets/asyra-office/models/sofa-variants/review/__tests__/test_l_shaped_sofa_spec.py",
    "assets/asyra-office/models/sofa-variants/sofa-variants-model-spec.json",
    "assets/asyra-office/models/stair-railing/review/01-stair-baluster-v2.png",
    "assets/asyra-office/models/stair-railing/review/01-stair-baluster-v4-top-detail.png",
    "assets/asyra-office/models/stair-railing/review/01-stair-baluster-v4.png",
    "assets/asyra-office/models/stair-railing/review/02-sloped-handrail-v1.png",
    "assets/asyra-office/models/stair-railing/review/02-sloped-handrail-v3-detail.png",
    "assets/asyra-office/models/stair-railing/review/02-sloped-handrail-v3.png",
    "assets/asyra-office/models/stair-railing/review/draw-handrail-projections.py",
    "assets/asyra-office/models/storage/review/__tests__/test_bookcase_spec.py",
    "assets/asyra-office/models/storage/review/__tests__/test_snack_cabinet_spec.py",
    "assets/asyra-office/models/storage/storage-model-spec.json",
    "assets/asyra-office/models/street-details/review/01-street-sign-v2.png",
    "assets/asyra-office/models/street-details/review/01-street-sign-v3.png",
    "assets/asyra-office/models/street-details/review/01-street-sign-v4.png",
    "assets/asyra-office/models/street-details/review/01-street-sign-v5.png",
    "assets/asyra-office/models/street-details/review/01-street-sign-v6.png",
    "assets/asyra-office/models/street-details/review/02-roadside-bollard-v2.png",
    "assets/asyra-office/models/street-details/review/02-roadside-bollard-v3.png",
    "assets/asyra-office/models/street-details/review/bollard-projection-measurements.json",
    "assets/asyra-office/models/street-details/review/draw-bollard-projections.py",
    "assets/asyra-office/models/street-details/review/draw-street-sign-projections.py",
    "assets/asyra-office/models/street-details/review/street-sign-lettering-detail-review.png",
    "assets/asyra-office/models/street-details/review/street-sign-projection-measurements.json",
    "assets/asyra-office/models/street-details/street-details-model-spec.json",
    "assets/asyra-office/models/street/review/02-road-markings-v2.png",
    "assets/asyra-office/models/street/review/03-zebra-crossing-v2.png",
    "assets/asyra-office/models/street/review/04-curb-shared-section-v1.png",
    "assets/asyra-office/models/street/review/04-curb-straight-single-v1.png",
    "assets/asyra-office/models/street/review/04-pavement-curb-v2.png",
    "assets/asyra-office/models/street/review/04-pavement-layout-v3.png",
    "assets/asyra-office/models/street/review/04-paving-stone-single-v1.png",
    "assets/asyra-office/models/street/review/05-manhole-annotated-v1.png",
    "assets/asyra-office/models/street/review/05-manhole-dimensioned-v2.png",
    "assets/asyra-office/models/street/review/05-manhole-inspection-front.png",
    "assets/asyra-office/models/street/review/05-manhole-inspection-quarter.png",
    "assets/asyra-office/models/street/review/05-manhole-inspection-top.png",
    "assets/asyra-office/models/street/review/06-bare-tree-draft-v1.png",
    "assets/asyra-office/models/street/review/06-bare-tree-selected-v1.png",
    "assets/asyra-office/models/street/review/06-bare-tree-two-level-v2.png",
    "assets/asyra-office/models/street/review/06-leaf-cluster-v1.png",
    "assets/asyra-office/models/street/review/06-leaf-cluster-v2.png",
    "assets/asyra-office/models/street/review/06-single-leaf-v1.png",
    "assets/asyra-office/models/street/review/07-street-lantern-annotation-layer-v2.svg",
    "assets/asyra-office/models/street/review/07-street-lantern-dimensioned-v2.png",
    "assets/asyra-office/models/street/review/draw-lantern-annotations.py",
    "assets/asyra-office/models/street/street-model-spec.json",
    "assets/asyra-office/models/street/tree-construction-spec.json",
    "assets/asyra-office/models/tea-furniture/review/__tests__/test_round_tea_table_spec.py",
    "assets/asyra-office/models/tea-furniture/review/__tests__/test_tea_chair_spec.py",
    "assets/asyra-office/models/tea-furniture/tea-furniture-model-spec.json",
    "assets/asyra-office/models/textiles/review/__tests__/test_rectangular_rug_spec.py",
    "assets/asyra-office/models/textiles/review/__tests__/test_round_rug_spec.py",
    "assets/asyra-office/models/textiles/review/__tests__/test_throw_pillow_spec.py",
    "assets/asyra-office/models/textiles/textiles-model-spec.json",
    "assets/asyra-office/models/wall-decor/wall-decor-model-spec.json",
    "assets/asyra-office/models/washroom-fixtures/washroom-fixtures-model-spec.json",
    "assets/asyra-office/models/washroom-utilities/washroom-utilities-model-spec.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "These are development reference inputs and review helpers, not shipped model assets or App runtime code. No published API, saved user data, installed package or deployed App changes. Removed reference revisions are represented by the current catalog and retained historical evidence."
}
```

```update-note
{
  "change": "model-reference-ci-classification",
  "owner": "Repository CI",
  "summary": "Recognize model measurements, review drawings and Python review helpers without selecting unrelated runtime validation.",
  "sources": [
    "scripts/__tests__/ci-scope.test.mjs",
    "scripts/ci-relationships.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Only CI input classification and its regression coverage change. Runtime code and unrelated files remain outside the reference exemption; package consumers and deployed Apps need no integration or migration."
}
```

## Framework pre-publication candidate

The fixed 19-package Framework allowlist and current package manifests define
the candidate versions. Changesets materialization, not release documentation,
owns those values. The release decision remains `PENDING` until a clean exact
source commit reproduces the accepted artifacts, the publication checkpoint is
authorized, and the public-registry consumer passes. This candidate record does
not authorize merge, tagging, registry publication, deployment, or a formal
release.

The private root workspace `asyra`, private `@asyra/asyra-design`, and
`create-asyra-design-app` are excluded from this Framework release. The
committed create-app template is not regenerated or validated by this plan.

## Framework 0.2.5 pre-publication release readiness result: READY

Framework Release Gate 5 produced a reproducible pre-publication `READY` result
for the already-versioned `0.2.5` candidate. All 19 public packages can be
packed, installed, typechecked, built, and exercised by clean consumers and by
the generated Asyra Design template from project-local artifacts. Public
registry availability is not proven. This result does not authorize merge,
tagging, registry publication, deployment, or a formal release.

The candidate supports:

- Core and Preset 2D initialization through public ESM entrypoints;
- transaction, rollback, undo/redo, save, and app-owned load migration;
- Group group/ungroup through canonical public APIs;
- explicitly composed Collaboration and convergent remote apply;
- explicitly composed AI action plans through registered app actions;
- side-effect-free operation when Collaboration or AI is not enabled.

The supported runtime is Node.js 24.x with Yarn 4.3.1. Declarations are
validated with TypeScript 5.8.3, and the React surface targets React 19. The
formal browser evidence uses the current Chromium supplied by Playwright 1.57.

Production 3D and HYBRID profiles, auto-layout, and unit-aware aggregation are
not included. See
[`docs/ai/framework/RELEASE_SUPPORT.md`](docs/ai/framework/RELEASE_SUPPORT.md)
for the exact package set, support matrix, migration/deprecation table,
security boundaries, and reproducible readiness commands.

## Pending update guidance

These development notes are not published release summaries.

```update-note
{
  "change": "release-guidance-authoring",
  "owner": "Repository development tooling",
  "summary": "Require pending impact notes and guide references through normal development entries and PR document checks.",
  "sources": [
    "scripts/docs/release-update-guidance.mjs",
    "scripts/docs/__tests__/release-update-guidance.test.mjs",
    "package.json",
    ".github/workflows/main.yml",
    "scripts/ci-relationships.json",
    "scripts/__tests__/ci-scope.test.mjs",
    "docs/public/generated/source-map.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Repository authoring checks only; App runtime, consumer data, package versions and publishers are unchanged."
}
```

```update-note
{
  "change": "release-guidance-integrity-fixes",
  "owner": "Repository development tooling",
  "summary": "Validate retained note identities and guide references; check source existence without loading source payloads.",
  "sources": [
    "scripts/docs/release-update-guidance.mjs",
    "scripts/docs/__tests__/release-update-guidance.test.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Development document validation only; preserve Markdown exemptions and leave consumer runtime, data and publishers unchanged."
}
```

```update-note
{
  "change": "cloudflare-release-guidance-routing",
  "owner": "Repository development tooling",
  "summary": "Route hosted release guidance to the current Cloudflare Pages App and website workflows.",
  "sources": [
    "scripts/docs/__tests__/release-update-guidance.test.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Correct project workflow routing only; publication, providers, runtime and consumer data remain unchanged."
}
```

```update-note
{
  "change": "release-guidance-admission",
  "owner": "Repository release tooling",
  "summary": "Require artifact-bound update summaries and valid integration guides in the existing npm and Cloudflare Pages release flows.",
  "sources": [
    ".github/__tests__/app-cloudflare.test.mjs",
    ".github/__tests__/site-cloudflare.test.mjs",
    ".github/workflows/app-cloudflare.yml",
    ".github/workflows/site-cloudflare.yml",
    "docs/public/generated/source-map.json",
    "package.json",
    "scripts/__tests__/app-cloudflare.test.mjs",
    "scripts/__tests__/fixtures/release-guidance.mjs",
    "scripts/__tests__/framework-release-publisher.test.mjs",
    "scripts/__tests__/release-automation.test.mjs",
    "scripts/__tests__/release-guidance.test.mjs",
    "scripts/app-cloudflare.mjs",
    "scripts/ci-relationships.json",
    "scripts/cloudflare-release-guidance.mjs",
    "scripts/create-app-release-artifacts.mjs",
    "scripts/docs/__tests__/release-update-guidance.test.mjs",
    "scripts/docs/release-update-guidance.mjs",
    "scripts/framework-release-artifacts.js",
    "scripts/publish-create-app.js",
    "scripts/publish-framework-release.js",
    "scripts/release-create-app.js",
    "scripts/release-framework.js",
    "scripts/release-guidance.mjs",
    "tools/flow-inspector/inspectors/__tests__/framework-package-release-flow-inspector.contract.test.cjs",
    "tools/flow-inspector/inspectors/create-asyra-design-app-release-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/framework-package-release-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/framework-release-readiness-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/release-update-guidance.flow.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Repository release tooling only; consumer runtime, App customizations and stored data remain unchanged. Maintainers use the existing release entries and the documented guidance/recovery checks."
}
```

```update-note
{
  "change": "release-guidance-retry-baselines",
  "owner": "Repository release tooling",
  "summary": "Restore frozen Cloudflare candidates across runners and distinguish unchanged npm members from partial publication retries.",
  "sources": [
    ".github/__tests__/app-cloudflare.test.mjs",
    ".github/__tests__/site-cloudflare.test.mjs",
    ".github/workflows/app-cloudflare.yml",
    ".github/workflows/site-cloudflare.yml",
    "scripts/__tests__/release-guidance.test.mjs",
    "scripts/cloudflare-release-guidance.mjs",
    "scripts/release-guidance.mjs",
    "tools/flow-inspector/inspectors/release-update-guidance.flow.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Release admission and recovery only; preserve consumer runtime, custom features and saved data, package versions, authorization and Markdown-only exemptions."
}
```

```update-note
{
  "change": "cloudflare-verified-deployment-retention",
  "owner": "Repository release tooling",
  "summary": "Preserve verified deployment outcomes when a later upload attempt fails, while recording that attempt separately.",
  "sources": [
    "scripts/cloudflare-release-guidance.mjs",
    "scripts/__tests__/release-guidance.test.mjs",
    "tools/flow-inspector/inspectors/release-update-guidance.flow.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Release result bookkeeping only; consumer runtime, custom behavior, saved data, versioning and Markdown-only exemptions are unchanged."
}
```

```update-note
{
  "change": "public-release-history-discovery",
  "owner": "Public release documentation",
  "summary": "Expose durable per-owner release summaries and cross-version guidance through the existing public document inventory, website and AI discovery entries.",
  "sources": [
    "apps/asyra-framework-site/__tests__/content.test.mjs",
    "apps/asyra-framework-site/__tests__/docs.test.mjs",
    "apps/asyra-framework-site/__tests__/e2e/supporting-routes.spec.ts",
    "apps/asyra-framework-site/__tests__/e2e/update-guides.spec.ts",
    "apps/asyra-framework-site/__tests__/static-delivery.test.mjs",
    "apps/asyra-framework-site/lib/content.mjs",
    "apps/asyra-framework-site/public/llms.txt",
    "docs/public/content-manifest.json",
    "docs/public/generated/content-index.json",
    "docs/public/generated/source-map.json",
    "docs/public/llms.txt",
    "docs/public/schema/content-manifest.schema.json",
    "scripts/docs/__tests__/public-content-contract.test.mjs",
    "scripts/docs/__tests__/public-documentation.test.mjs",
    "scripts/docs/__tests__/public-documentation-validation.test.mjs",
    "scripts/docs/__tests__/release-update-guidance.test.mjs",
    "scripts/docs/public-content-contract.mjs",
    "scripts/docs/public-documentation.mjs",
    "scripts/docs/release-update-guidance.mjs",
    "tools/flow-inspector/inspectors/__tests__/asyra-public-package-documentation-flow-inspector.contract.test.cjs",
    "tools/flow-inspector/inspectors/asyra-public-package-documentation-flow-inspector.data.cjs",
    "scripts/docs/release-history.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Documentation discovery and validation only; consumer runtime, custom features and stored data are unchanged. No historical release availability is inferred."
}
```

```update-note
{
  "change": "release-history-adoption-fixes",
  "owner": "Public release documentation",
  "summary": "Retain adopted guide revisions and include prerequisite cross-version guidance with explicit baseline gaps.",
  "sources": [
    "scripts/docs/release-history.mjs",
    "scripts/docs/__tests__/public-documentation.test.mjs",
    "docs/public/generated/content-index.json",
    "docs/public/generated/source-map.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Documentation discovery and regression checks only; no runtime, consumer data, package versions or publication changes."
}
```

```update-note
{
  "change": "release-history-test-inventory",
  "owner": "Public release documentation tests",
  "summary": "Verify existing release records survive fixture additions and resolve discovery links from declared paths.",
  "sources": [
    "scripts/docs/__tests__/public-documentation.test.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Test-only corrections; release discovery implementation, consumer behavior, stored data and publication are unchanged."
}
```

```update-note
{
  "change": "cross-version-consumer-acceptance",
  "owner": "Public release documentation and modeled consumer tests",
  "summary": "Complete independent cross-version and partial-adoption Text integration, preserve original evidence, and clarify public digest algorithms and composition-time definition reads.",
  "sources": [
    "apps/asyra-framework-site/public/llms.txt",
    "docs/public/content-manifest.json",
    "docs/public/generated/content-index.json",
    "docs/public/generated/source-map.json",
    "docs/public/llms.txt",
    "fixtures/app-update-text-cross-version/.gitattributes",
    "fixtures/app-update-text-cross-version/.gitignore",
    "fixtures/app-update-text-cross-version/.prettierrc",
    "fixtures/app-update-text-cross-version/.yarnrc.yml",
    "fixtures/app-update-text-cross-version/artifacts.json",
    "fixtures/app-update-text-cross-version/delivery/input-v1.tar.gz",
    "fixtures/app-update-text-cross-version/delivery/input-v1.tar.gz.sha256",
    "fixtures/app-update-text-cross-version/eslint.config.js",
    "fixtures/app-update-text-cross-version/evidence/baseline-build.log",
    "fixtures/app-update-text-cross-version/evidence/baseline-format.log",
    "fixtures/app-update-text-cross-version/evidence/baseline-install.log",
    "fixtures/app-update-text-cross-version/evidence/baseline-lint.log",
    "fixtures/app-update-text-cross-version/evidence/baseline-test.log",
    "fixtures/app-update-text-cross-version/evidence/baseline-typecheck.log",
    "fixtures/app-update-text-cross-version/evidence/independent-v1.tar.gz",
    "fixtures/app-update-text-cross-version/evidence/independent-v1.tar.gz.sha256",
    "fixtures/app-update-text-cross-version/evidence/original-evidence-sha256.json",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/before-guide-correction.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/before-integration.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/build.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/evidence-after-replay.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/gate.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/install.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/lint.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/status.json",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/test.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/typecheck.log",
    "fixtures/app-update-text-cross-version/evidence/preparation-status.json",
    "fixtures/app-update-text-cross-version/evidence/target-before-integration.log",
    "fixtures/app-update-text-cross-version/index.html",
    "fixtures/app-update-text-cross-version/package.json",
    "fixtures/app-update-text-cross-version/sources/1-text-component.ts.txt",
    "fixtures/app-update-text-cross-version/sources/2-text.ts.txt",
    "fixtures/app-update-text-cross-version/sources/3-core.ts.txt",
    "fixtures/app-update-text-cross-version/sources/4-fills.ts.txt",
    "fixtures/app-update-text-cross-version/src/__tests__/baseline-preservation.test.ts",
    "fixtures/app-update-text-cross-version/src/__tests__/cross-version-acceptance.test.ts",
    "fixtures/app-update-text-cross-version/src/__tests__/helpers.ts",
    "fixtures/app-update-text-cross-version/src/__tests__/migration-boundaries.test.ts",
    "fixtures/app-update-text-cross-version/src/__tests__/setup-canvas.ts",
    "fixtures/app-update-text-cross-version/src/definitions.ts",
    "fixtures/app-update-text-cross-version/src/documents.ts",
    "fixtures/app-update-text-cross-version/src/main.ts",
    "fixtures/app-update-text-cross-version/src/panel.ts",
    "fixtures/app-update-text-cross-version/src/runtime.ts",
    "fixtures/app-update-text-cross-version/test-data/ambiguous-units.json",
    "fixtures/app-update-text-cross-version/test-data/current.json",
    "fixtures/app-update-text-cross-version/test-data/locally-extended.json",
    "fixtures/app-update-text-cross-version/test-data/multiplier.json",
    "fixtures/app-update-text-cross-version/tools/package-delivery.py",
    "fixtures/app-update-text-cross-version/tools/test-delivery.py",
    "fixtures/app-update-text-cross-version/tsconfig.json",
    "fixtures/app-update-text-cross-version/vite.config.ts",
    "fixtures/app-update-text-cross-version/vitest.config.ts",
    "fixtures/app-update-text-cross-version/yarn.lock",
    "scripts/__tests__/app-update-fixtures.test.mjs",
    "scripts/ci-relationships.json",
    "scripts/docs/__tests__/public-documentation-validation.test.mjs",
    "scripts/docs/public-documentation-validation.mjs",
    "tools/flow-inspector/inspectors/asyra-public-package-documentation-flow-inspector.data.cjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Modeled local candidate fixture and public documentation only; production runtime, published package versions and original acceptance evidence remain unchanged. Independent results and maintainer replay are recorded separately."
}
```

```update-note
{
  "change": "release-guidance-closeout-integration",
  "owner": "Release guidance verification",
  "summary": "Retain exact cross-version evidence in CI, execute registered Cloudflare workflow tests, keep sitemap and Pixi case-count assertions aligned with their current inventories, register existing Text browser responsibilities and the spatial-query and text-mask cases with the Pixi owner, and synchronize persistent rule references and Inspector snapshots before archival.",
  "sources": [
    "apps/asyra-design/playwright-functional-flow-contracts.json",
    "tools/flow-inspector/inspectors/design-functional-flow-inspector.data.cjs",
    "tools/flow-inspector/control-plane/__tests__/contracts.test.cjs",
    "packages/render-engine-pixi/navigation-flow-contracts.json",
    "tools/flow-inspector/control-plane/__tests__/localization-runtime.test.cjs",
    "apps/asyra-framework-site/__tests__/e2e/site-links.spec.ts",
    "docs/public/generated/source-map.json",
    "scripts/__tests__/ci-scope.test.mjs",
    "scripts/__tests__/fixtures/retained-app-update-evidence.json",
    "scripts/__tests__/workspace-automation.test.mjs",
    "scripts/docs/__tests__/release-update-guidance.test.mjs",
    "tools/flow-inspector/control-plane/ci-script-selection.cjs",
    "tools/flow-inspector/inspectors/asyra-public-package-documentation-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/release-update-guidance.flow.json",
    "tools/flow-inspector/workspace/workspace-bundle.data.js"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Verification references and exact-byte evidence retention only; no consumer runtime, versions or publication changes."
}
```

```update-note
{
  "change": "app-update-guidance-prerequisite",
  "owner": "App update documentation",
  "summary": "Provide public Text update guide entries and retain the original local-candidate integration fixtures and acceptance artifacts from the prerequisite App update guidance work.",
  "sources": [
    "apps/asyra-framework-site/__tests__/editorial-landing.test.mjs",
    "apps/asyra-framework-site/components/docs-page.tsx",
    "apps/asyra-framework-site/components/search-dialog.tsx",
    "fixtures/app-update-text-consumer/.gitignore",
    "fixtures/app-update-text-consumer/.prettierrc",
    "fixtures/app-update-text-consumer/.yarnrc.yml",
    "fixtures/app-update-text-consumer/e2e/text-review.html",
    "fixtures/app-update-text-consumer/e2e/text-review.ts",
    "fixtures/app-update-text-consumer/eslint.config.js",
    "fixtures/app-update-text-consumer/evidence/baseline-files.json",
    "fixtures/app-update-text-consumer/evidence/baseline-tests.txt",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/fixed-chart-approved.png",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/fixed-console.json",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/fixed-new-text.png",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-build.txt",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-final-state.txt",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-history.png",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-lint.txt",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-reloaded.png",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-test.txt",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-typecheck.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-before.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-build.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-lint.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-naming.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-test.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-typecheck.txt",
    "fixtures/app-update-text-consumer/evidence/independent-adoption-before.txt",
    "fixtures/app-update-text-consumer/evidence/independent-build.txt",
    "fixtures/app-update-text-consumer/evidence/independent-lint.txt",
    "fixtures/app-update-text-consumer/evidence/independent-test.txt",
    "fixtures/app-update-text-consumer/evidence/independent-typecheck.txt",
    "fixtures/app-update-text-consumer/evidence/integration.patch",
    "fixtures/app-update-text-consumer/evidence/maintainer-follow-up.patch",
    "fixtures/app-update-text-consumer/evidence/retained-tests.txt",
    "fixtures/app-update-text-consumer/index.html",
    "fixtures/app-update-text-consumer/package.json",
    "fixtures/app-update-text-consumer/src/__tests__/setup-canvas.ts",
    "fixtures/app-update-text-consumer/src/__tests__/target-availability.test.ts",
    "fixtures/app-update-text-consumer/src/__tests__/text-preservation.test.ts",
    "fixtures/app-update-text-consumer/src/__tests__/text-shared-projection.test.ts",
    "fixtures/app-update-text-consumer/src/definitions.ts",
    "fixtures/app-update-text-consumer/src/documents.ts",
    "fixtures/app-update-text-consumer/src/main.ts",
    "fixtures/app-update-text-consumer/src/panel.ts",
    "fixtures/app-update-text-consumer/src/runtime.ts",
    "fixtures/app-update-text-consumer/test-data/current.json",
    "fixtures/app-update-text-consumer/test-data/multiplier.json",
    "fixtures/app-update-text-consumer/tsconfig.json",
    "fixtures/app-update-text-consumer/updates/target-artifacts.json",
    "fixtures/app-update-text-consumer/vite.config.ts",
    "fixtures/app-update-text-consumer/vitest.config.ts",
    "fixtures/app-update-text-consumer/yarn.lock",
    "fixtures/app-update-text-subsequent/.gitignore",
    "fixtures/app-update-text-subsequent/.prettierrc",
    "fixtures/app-update-text-subsequent/.yarnrc.yml",
    "fixtures/app-update-text-subsequent/delivery/revision-2/text-spacing-r2-independent.tar.gz",
    "fixtures/app-update-text-subsequent/delivery/revision-2/text-spacing-r2-independent.tar.gz.sha256",
    "fixtures/app-update-text-subsequent/eslint.config.js",
    "fixtures/app-update-text-subsequent/evidence/.gitignore",
    "fixtures/app-update-text-subsequent/evidence/artifact-contract.txt",
    "fixtures/app-update-text-subsequent/evidence/artifact-rebuild.txt",
    "fixtures/app-update-text-subsequent/evidence/baseline-build.txt",
    "fixtures/app-update-text-subsequent/evidence/baseline-lint.txt",
    "fixtures/app-update-text-subsequent/evidence/baseline-test.txt",
    "fixtures/app-update-text-subsequent/evidence/baseline-typecheck.txt",
    "fixtures/app-update-text-subsequent/evidence/documentation-tests.txt",
    "fixtures/app-update-text-subsequent/evidence/independent-artifact-verification.log",
    "fixtures/app-update-text-subsequent/evidence/independent-baseline.log",
    "fixtures/app-update-text-subsequent/evidence/independent-build.log",
    "fixtures/app-update-text-subsequent/evidence/independent-format.log",
    "fixtures/app-update-text-subsequent/evidence/independent-install.log",
    "fixtures/app-update-text-subsequent/evidence/independent-lint-first.log",
    "fixtures/app-update-text-subsequent/evidence/independent-lint.log",
    "fixtures/app-update-text-subsequent/evidence/independent-old-candidate-regression.log",
    "fixtures/app-update-text-subsequent/evidence/independent-session.json",
    "fixtures/app-update-text-subsequent/evidence/independent-test.log",
    "fixtures/app-update-text-subsequent/evidence/independent-typecheck.log",
    "fixtures/app-update-text-subsequent/evidence/input-files.json",
    "fixtures/app-update-text-subsequent/evidence/integration.patch",
    "fixtures/app-update-text-subsequent/evidence/previous-fixture-files.json",
    "fixtures/app-update-text-subsequent/evidence/replay-and-history.txt",
    "fixtures/app-update-text-subsequent/evidence/retained-build.txt",
    "fixtures/app-update-text-subsequent/evidence/retained-lint.txt",
    "fixtures/app-update-text-subsequent/evidence/retained-test.txt",
    "fixtures/app-update-text-subsequent/evidence/retained-typecheck.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/artifact-check.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/baseline-install.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/baseline-install.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/baseline.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/baseline.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/build.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/build.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/final-integrity.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/format.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/integrity.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/lint.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/lint.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/lockfile.diff",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/old-candidate.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/old-candidate.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/target-install.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/target-install.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/test.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/test.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/typecheck.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/typecheck.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/delivery-replay.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/documentation-follow-up/docs-r2-build.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/documentation-follow-up/docs-r2-lint.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/documentation-follow-up/docs-r2-test.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/documentation-follow-up/docs-r2-typecheck.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/documentation-tests.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/handoff-check.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/history-check.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/log-retention-before.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/naming.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/packaging-verification.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/prepare.py",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/protected-files.json",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/validation/build.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/validation/install.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/validation/lint.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/validation/test.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/validation/typecheck.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/verify-package.py",
    "fixtures/app-update-text-subsequent/evidence/revision-2/previous-evidence-files.json",
    "fixtures/app-update-text-subsequent/evidence/revision-2/retained-build.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/retained-lint.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/retained-records.patch",
    "fixtures/app-update-text-subsequent/evidence/revision-2/retained-test.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/retained-typecheck.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/website-entry.txt",
    "fixtures/app-update-text-subsequent/evidence/website-entry.txt",
    "fixtures/app-update-text-subsequent/index.html",
    "fixtures/app-update-text-subsequent/package.json",
    "fixtures/app-update-text-subsequent/src/__tests__/revision-two-adoption.test.ts",
    "fixtures/app-update-text-subsequent/src/__tests__/setup-canvas.ts",
    "fixtures/app-update-text-subsequent/src/__tests__/subsequent-preservation.test.ts",
    "fixtures/app-update-text-subsequent/src/__tests__/target-availability.test.ts",
    "fixtures/app-update-text-subsequent/src/__tests__/text-preservation.test.ts",
    "fixtures/app-update-text-subsequent/src/__tests__/text-shared-projection.test.ts",
    "fixtures/app-update-text-subsequent/src/definitions.ts",
    "fixtures/app-update-text-subsequent/src/documents.ts",
    "fixtures/app-update-text-subsequent/src/main.ts",
    "fixtures/app-update-text-subsequent/src/panel.ts",
    "fixtures/app-update-text-subsequent/src/runtime.ts",
    "fixtures/app-update-text-subsequent/test-data/current.json",
    "fixtures/app-update-text-subsequent/test-data/locally-extended.json",
    "fixtures/app-update-text-subsequent/test-data/multiplier.json",
    "fixtures/app-update-text-subsequent/tools/prepare-artifacts.py",
    "fixtures/app-update-text-subsequent/tools/test-artifacts.py",
    "fixtures/app-update-text-subsequent/tools/test-handoff.py",
    "fixtures/app-update-text-subsequent/tsconfig.json",
    "fixtures/app-update-text-subsequent/updates/base-artifacts.json",
    "fixtures/app-update-text-subsequent/updates/model-artifact.json",
    "fixtures/app-update-text-subsequent/updates/sources/1-text-component.ts.txt",
    "fixtures/app-update-text-subsequent/updates/sources/2-text.ts.txt",
    "fixtures/app-update-text-subsequent/updates/sources/3-core.ts.txt",
    "fixtures/app-update-text-subsequent/updates/sources/4-fills.ts.txt",
    "fixtures/app-update-text-subsequent/vite.config.ts",
    "fixtures/app-update-text-subsequent/vitest.config.ts",
    "fixtures/app-update-text-subsequent/yarn.lock",
    "plugins/asyra-skill/skills/asyra-skill/bundle.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Documentation discovery and retained consumer test assets only; no consumer runtime API or saved-data format changes. Original independent acceptance, contextual reruns and permanent fixture evidence remain distinct."
}
```

## Office tables and chairs review

```update-note
{
  "change": "office-tables-and-chairs-review",
  "owner": "asyra-office",
  "summary": "Add the owner-requested deeper lower rooms and three proportion-preserving tables; omit the source-mismatched green work chair and rejected complex upholstery pending reference-specific asset review.",
  "reason": "Preserve approved furniture proportions instead of deforming them to fit image envelopes; keep the accepted building and exterior unchanged.",
  "impact": "no-action",
  "sources": [
    "assets/asyra-office/models/furniture/WORK-CHAIR-SPEC.md",
    "assets/asyra-office/models/furniture/furniture-model-spec.json",
    "apps/asyra-office/src/scene/__tests__/seating-shape.test.ts",
    "apps/asyra-office/src/scene/__tests__/seating-pose.test.ts",
    "apps/asyra-office/src/scene/reference/office-structure.json",
    "apps/asyra-office/src/scene/reference/lower-room-measurements.json",
    "apps/asyra-office/src/scene/__tests__/lower-room-depth.test.ts",
    "apps/asyra-office/src/scene/__tests__/approved-structure.test.ts",
    "apps/asyra-office/src/scene/__tests__/wall-joins.test.ts",
    "apps/asyra-office/scripts/export-seating-measurement-input.ts",
    "apps/asyra-office/scripts/fit-room-seating.py",
    "apps/asyra-office/scripts/measure-seating-placement.ts",
    "apps/asyra-office/scripts/review-seating-placement.py",
    "apps/asyra-office/src/scene/__tests__/seating-reference.test.ts",
    "apps/asyra-office/src/scene/reference/office-seating.json",
    "apps/asyra-office/src/scene/reference/seating-measurements.json",
    "apps/asyra-office/e2e/interior.spec.ts",
    "apps/asyra-office/playwright.config.ts",
    "apps/asyra-office/src/__tests__/browser-configuration.test.ts",
    "apps/asyra-office/e2e/structure-hardware.spec.ts",
    "apps/asyra-office/scripts/export-armchair-panels.ts",
    "apps/asyra-office/scripts/refine-armchair-panels.py",
    "apps/asyra-office/src/assets/__tests__/seating-microscope.test.ts",
    "apps/asyra-office/src/assets/catalog.ts",
    "apps/asyra-office/src/assets/generated/armchair-panels.json",
    "apps/asyra-office/src/assets/tea-chair.ts",
    "apps/asyra-office/src/scene/__tests__/office-seating.test.ts",
    "apps/asyra-office/src/scene/__tests__/seating-construction.test.ts",
    "apps/asyra-office/src/scene/__tests__/structure-stage.test.ts",
    "apps/asyra-office/src/scene/office-interior.ts",
    "apps/asyra-office/src/scene/office-seating.ts",
    "apps/asyra-office/src/scene/reference-scene.ts",
    "apps/asyra-office/src/ui/OfficeScene.tsx",
    "assets/asyra-office/models/tea-furniture/tea-furniture-model-spec.json",
    "tools/flow-inspector/inspectors/asyra-office-flow-inspector.data.cjs",
    "tools/flow-inspector/workspace/workspace-bundle.data.js"
  ],
  "guides": []
}
```
