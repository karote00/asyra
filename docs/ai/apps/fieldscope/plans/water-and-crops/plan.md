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

### Leaf integration performance correction

The current Linux redo-branch case fails at 19 seconds against its unchanged 15-second guard. A fresh runtime CPU profile attributes 623ms to geometry equality, 531ms to triangle validation and 537ms to scene bounds across the three local cases. R remains the sole owner of this slice: replace callback-based numeric scans with direct scans, read each bounds coordinate once, and reduce transformed box intervals without allocating eight corners per instance. Preserve all values, admission/isolation, per-configuration build counts, texture/mesh ownership and existing time limits. Strengthen the bounds read-count oracle before editing; compare arbitrary-yaw bounds against explicit corners and retain mutation rejection. No caches, domain changes, framework changes or detail reductions. Gates: focused admission/engine/bounds/runtime tests, full app tests/build/lint/naming and app E2E before current-head CI.

### Vertical maturity distribution

C owns this bounded correction: all forty variants must place older fruit lower on the climbing plant and younger fruit higher. Preserve cucumber stages, retained overgrown fruit and within-truss tomato progression; make tomato truss age decrease with node height and drive geometry size and existing nonuniform skin shading from that same ripeness. Limit edits to crop-models, its formal tests, crop E2E viewpoints and this app specification/plan. No new dependencies, renderer changes, placement changes or time-limit changes. Prove the existing failure with lower/upper fruit bands at multiple net heights before implementation. Run crop source tests, all app tests, build/lint/naming and the four crop close-up browser cases. Refresh the built app served by the existing public tunnel after validation.

### Farm-wide delayed-harvest cap

C owns variant eligibility and population assignment. Restrict the three delayed-harvest stages together to at most ten actual cucumber fruits across all bays/rows/instances, not ten reusable models. Sample one eligible plant per 500 cucumber plants, capped at ten (five in the default farm), deterministically without replacement; rotate the five eligible variants to retain all twenty shapes in the default scene. Normal variants carry zero overgrown fruit and eligible variants exactly one. The shared domain policy drives both geometry eligibility and assignment, with no renderer-side suppression or additional model generation. Freeze scope to crop-layout, crop-models, their formal tests, and this app spec/plan. Prove the actual instantiated fruit sum fails before implementation; cover small/default/enlarged/empty layouts, repeatability, positions and all three stages. Gates: focused crop tests, full app tests, naming/lint/build, four crop browser cases on the shared built app. Refresh the existing tunnel build, update PR #174 and retain CI monitoring. No dependency, framework, camera or unrelated UI changes.

### Workbench UX refinement

Bounded UI scope: configuration-editor, workbench, styles, shared app-local UI icons, their tests and workbench E2E, plus the configuration spec. Reuse Asyra Design concepts for suffix fields and grouped properties, while retaining FieldScope runtime subscriptions and APIs. Group fields, align units, standardize 24px/16px icons with 32px or larger targets, provide a sticky form footer, and place camera controls above the canvas with responsive wrapping. Keep draft/Apply/Undo/Redo, camera geometry, planting, dependencies and framework owners unchanged. Test missing unit associations before implementation; verify target geometry, no toolbar/canvas overlap, mobile overflow, keyboard focus and existing history/panel tests. Run full app unit/build/lint/naming and browser suite, inspect desktop/mobile images, then refresh the existing public build.

Validation: the unit suffix assertion failed before implementation. All 137 app unit tests and all 15 browser tests passed; the panel case passed again after adding settled-layout, keyboard-focus and sticky-footer checks. App build, app lint and naming gates passed. Desktop 1440px and mobile 390px screenshots were inspected against the built app at `APP_URL=http://127.0.0.1:4178`. The existing sharing server serves that same build.

### Compact immediate property editing

User correction supersedes the draft/Apply UI. Scope: editor and workbench UI, direct tests and configuration documentation. Step R configuration-entry route accepts completed numeric input on Enter/blur and discrete strip changes directly into the existing validated runtime transaction. Inputs are current canonical configuration plus one field edit; output is one accepted history action, or a visible validation error without scene mutation. Unfinished text bypasses configuration replacement. UI and existing runtime APIs are allowed contributors; geometry, persistence, framework and new dependencies are excluded. No runtime/API change is required. Compact label/value rows replace repeated headings and tall fields; reference material moves to a discoverable header dialog. Gates: red regression first, sequential edits, invalid/empty input, history and panel lifetime, reference access, 137+ unit tests, browser suite, build/lint/naming and desktop/mobile screenshot inspection. Stop if existing validation/history cannot support this route without expanding ownership.

Validation: the strengthened strip test failed on the previous draft-only editor. All 137 unit tests passed; the focused editor test also proves queued edits preserve current dimensions and strips. All 15 browser cases passed after correcting dialog Escape handling, plus a focused panel/reference screenshot run. Build, lint and naming passed. Desktop 1440px and mobile 390px views, the immediate editor and reference dialog were inspected from the real built app at `APP_URL=http://127.0.0.1:4178`. The shared HTTPS entry serves the matching built index.

### Continuous tube sections

Bounded correction: the shared TriangleBuilder tube sweep is the first incorrect owner; independently selected ring axes reverse on real spring-clip bends. Preserve wire paths, diameters, placement, vertex budgets and renderer APIs. Transport each ring frame continuously along its tangent path. Formal tests cover the reference-axis threshold and all installed clip orientations; shared geometry consumers require app unit/build/lint/naming and close-up browser checks. No clip-only patch geometry or camera workaround.

Validation: the real clip regression failed with adjacent section alignment of -1 (a 180-degree reversal). Parallel transport passes both tube tests, all 139 app unit tests and all 15 browser tests. A dedicated 300% full-width close-up of both clip arms/hooks also passed and was inspected, alongside the standard joint and 1000% views. Build, app lint and naming passed. Review used the built app at `APP_URL=http://127.0.0.1:4178`; source topology and dimensions remain unchanged.

### Editable crossbeam and side clearance

Scope: configuration domain, existing compact editor, their direct tests and specs. Optional app-owned `eaveHeight` is the authored crossbeam elevation; omitted values retain the previous 60%-of-height behavior, including prior history records. It is validated before geometry construction and affects existing site consumers through configurationSite. The symmetric margin field authors width as strip total plus twice the margin; strips remain unchanged and direct width/strip edits continue deriving equal margins. Each edit uses the existing runtime transaction and history path. No renderer, new persistence format, dependency or external service changes. Gates: red crossbeam oracle, invalid elevation and minimum margin, independent field history, real geometry, unit/build/lint/naming and browser layout checks.

Validation: six new crossbeam assertions failed before implementation. All 146 unit tests and 16 browser tests passed, plus a focused crossbeam/clearance history run with both editor positions captured and inspected. Build, app lint and naming passed. Geometry tests prove authored eave height moves the arch spring and support tops without moving the roof apex; browser tests prove independent undo/redo, derived widths/margins, invalid-value rejection and absence of the old applied-value footer. The live built app and shared HTTPS index match.
