# Water and crop population plan

Status: implementation complete; PR validation is the remaining integration gate.

The user additionally requested Blender-assisted review and natural, near-realistic plants. Review the exact domain meshes in Blender and refine leaf curvature, shoot tips, fruit attachment and materials before app visual closure. The optional `apps/fieldscope/scripts/export-crop-review.mjs` exports the current models inside the app artifacts directory for this purpose.

## Bounded task

Correct the water/soil cross-section, populate the existing four bays with researched cultivar models, and backfill PR #170 documentation. Authorized files are FieldScope domain, rendering, engine, runtime/UI consumers and formal tests; `docs/ai/apps/fieldscope`; and the PR changeset. Framework code, other apps, dependencies, release version, deployment credentials, robot simulation and unrelated translation are excluded.

Discovery is limited to the current FieldScope owners/tests, Asyra Design documentation structure, PR #170 baseline and primary cultivar references. Review after edits is limited to the diff, direct consumers and named gates. New out-of-scope findings do not authorize additional edits.

## Sequence

1. Document the baseline and freeze the [product specification](../../specs/water-and-crops.md) and [Inspector flow](inspector-flow.md).
2. Water owner: prove the old curved-water behavior fails the flat-water/soil tests; correct the shared profile and both consumers.
3. Crop domain owner: implement and prove reusable variants, deterministic row placement and invalid-layout handling.
4. Rendering owner: admit and render instance transforms, include transformed bounds, and prove reuse/disposal. Compose crop layers from completed domain products.
5. Integration: validate configuration/history lifetimes and inspect the real app at overview and crop/water close-up scales.
6. Run app unit, typecheck, lint, E2E, naming and filtered production build. Review the scoped diff, create an English PR and wait for all current-head CI checks before requesting review.

## Revised rendering slice

Two software-rendered browser attempts exceeded the existing 30-second case limit. Source measurement found 219,530 triangles across the 40 unique models, multiplied over 5,952 plants. Keep the existing timeouts. Build a bounded distant representation from the same variant inputs, select it by projected error, and cull off-screen instances. Validate full/distant geometric agreement and actual rendered triangle counts before repeating browser tests. The user's additional occlusion request adds real leaf-screened and net-backside fruit to the same domain models.

No cache is proposed. Variant geometry is a completed scene product constructed once per applied configuration, reused by instance transforms and retired with that configuration. Tests must count construction through the normal runtime path as well as asserting output.

Stop for a contract conflict, required dependency approval, an out-of-scope owner change, or three failed focused repair attempts. Do not hide failures with geometry fallbacks or relaxed test guards.

### Cucumber appearance follow-up

Extend crop owner C with eight unharvested development stages, including two delayed-harvest sizes before the user-defined 30 × 8 cm endpoint. Add irregular skin relief, surface-attached stem/leaf bristles, yellow flowering ovaries and diminishing dry corollas. Preserve twenty reusable variants, planting, tomato appearance, camera behavior and configuration-lifetime computation. Verify source relief, hair attachment, stage dimensions and distant error before close-up app review and current-head PR gates.

### Runtime performance iteration

The Linux history gate still exceeds 15 seconds after the bounded crop geometry reduction. Replace mesh-density tuning with a CPU profile of the unchanged formal bootstrap history case. Inspect only the C/R path from completed geometry through admission, scene measurement and engine update. Preserve the eight development stages, minimum bristle coverage, immutable admission, configuration invalidation and existing time limits. Correct only the first measured repeated or excessive owner operation; prove its work count and invalidation in the matching formal test before implementation, then rerun app gates and current-head CI. C and R already own these files and their direct tests; no framework, dependency or unrelated UI edits are authorized by this iteration.

The bootstrap CPU profile identifies typed buffer constructors (~3.4 seconds self time across three local cases), admission and GC as the dominant costs. The next R slice copies admitted frozen numeric arrays by index directly into final GPU-owned typed buffers, removing generic iterable conversion and the expanded temporary index array. Formal cases preserve detached positions/colors and 16/32-bit indices; existing resource-reuse tests and the unchanged Linux 15-second history gate remain the completion oracle. No cache or geometry changes belong to this slice.

Flat triangle admission also snapshots each field once and copies its numeric arrays directly before validation and freezing. The existing adversarial accessor/isolation cases remain mandatory, with a formal zero-general-clone work assertion. Primitive shape admission retains its existing route. No caller-owned array is admitted or frozen, and no cross-configuration cache is introduced.

### Leaf surface correction

C owns original 256px albedo/normal maps: palmate primary veins, reticulate minor veins and puckering for cucumber; pinnate midrib/secondary veins and finer relief for tomato. Shared immutable maps do not depend on view/configuration. Leaf UVs follow the blade in full/distant geometry; existing cucumber stem/petiole bristles remain physical geometry. R admits/detaches surface pixels and UVs, shares GPU maps across live materials and releases them with the last owner. Test surface contrast/normal variation, cultivar distinction, UV completeness, admission, sharing/disposal, and live close-ups. Preserve crop stages, planting, vertex budget and runtime time limits; no dependencies or framework changes.
