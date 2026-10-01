# Workflow

Use a feature worktree based on current `origin/main`. Freeze the task boundary and read the relevant specification before editing. Plans with an Inspector flow execute one owner step at a time.

## Local validation

From the repository root:

```sh
yarn lint:naming
yarn workspace @asyra/fieldscope test:local
yarn workspace @asyra/fieldscope typecheck
yarn workspace @asyra/fieldscope lint
yarn turbo run react:build --filter=@asyra/fieldscope --concurrency=2
yarn workspace @asyra/fieldscope test:e2e
```

CI runs `yarn test:e2e:fieldscope`. Its six purpose-based Playwright groups run
sequentially in separate browser processes. A permanent contract test verifies
that the groups assign every browser spec exactly once. Each test retains its
existing individual timeout and the full suite keeps its 15-minute budget; failed group
reports and Playwright diagnostics remain available to CI. Desktop panel toggles,
responsive canvas/state retention and reference-dialog accessibility are separate
cases with 60-second guards; their complete assertions do not share one timer. Software-rendered
runs omit artifact-only page screenshots while retaining interaction checks
and screenshot comparisons that prove canvas behavior.

The desktop-to-mobile readiness assertion shares its existing case deadline.
Playwright's default five-second assertion wait is not a separate product
responsiveness SLA; the entire case remains bounded by 60 seconds.

Build workspace dependencies before app checks when working in a fresh checkout. E2E must use the current worktree's development server and the configured `APP_URL`, not another checkout on the same port. Retain formal test files and inspect synchronized screenshots for visual changes. Preserve test timeouts and resource guards.

Private changes still need an empty changeset. Review the staged diff, create an English PR, and verify all checks on its current head. Do not infer CI success from a previous head.

## Vercel

Follow the Asyra Design deployment pattern: select `apps/fieldscope` as Root Directory and include files outside the root so workspace packages are available. The committed `vercel.json` owns the exact commands: immutable Yarn 4.3.1 installation from the repository root, filtered Turbo build of `@asyra/fieldscope`, output `dist/frontend`. Production build does not require `APP_URL`; development server startup does. Node is 24.x. Automatic deployment is enabled for `main` only. Configuration support is not evidence of an existing deployed Vercel project.

The macOS browser suite uses ANGLE Metal to match the desktop GPU. `WEBGL_RENDERER=swiftshader` explicitly selects CPU software rendering; Linux defaults to SwiftShader. Software-rendered cases keep the 1440 × 1100 CSS layout and use a 0.25 device scale factor; the renderer selects level of detail from physical pixels. Software results are not a desktop responsiveness claim. The robot panel-closure case requests reduced motion in software-rendered runs and still asserts the final expanded scene geometry. Test timeout/resource guards remain unchanged.

For optional Blender inspection, run `node apps/fieldscope/scripts/export-crop-review.mjs`; it exports the exact current domain meshes and vertex colors to the app-owned `.artifacts/crop-models.json`, without adding runtime assets or dependencies.
