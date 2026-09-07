# Hosted Development Workbench

Asyra Sim has a separate Vercel project named `asyra-sim`. Its permanent product
domain is `asyra-sim.vercel.app`; do not append milestone, release, version,
robot, or MVP suffixes. A generated deployment or branch URL identifies a
review build, not a new product name.

Hosting the development workbench does not complete R0 Public Alpha. The
[first-release gates](FIRST_RELEASE.md) and [offline candidate gates](LOCAL_CANDIDATE.md)
remain separate. This deployment does not authorize real equipment operation.

## Project Configuration

- Git repository: `karote00/asyra`.
- Vercel team: `karote00s-projects`; project ID:
  `prj_6BMRMmYpGwroBa4v5k9i0chTtN44`.
- Project root: `apps/asyra-sim`.
- Include files outside the root directory so Yarn can resolve the monorepo.
- Framework: Vite; Node.js: `24.x`; Yarn: the repository's declared `4.3.1`.
- Install, build, static output and HTTP policy are owned by
  `apps/asyra-sim/vercel.json`, not the repository-root Design configuration.
- Build only Sim and its declared Framework dependency graph, with two
  concurrent build tasks. Serve `apps/asyra-sim/dist`, never repository source.
- Enable Git deployments for PR previews and ongoing updates. The long-term
  production branch is `main`; PR review and merge remain human decisions.
- No required runtime environment variable, Vercel Function, database service,
  account system, analytics, or cloud solver is added.
- Keep the Vercel Toolbar disabled for both environments: the app intentionally
  allows only same-origin scripts. Project model-improvement data sharing is off.

The first deployment on 2026-09-07 serves PR checkpoint
`78694410b1c8f0372f42349c12196f90a50071ef` at the production alias, without merging
the PR. Production branch tracking remains `main`; future merges update that
same domain. Subsequent feature-branch pushes produce previews, not automatic
production promotion. Deployment IDs and source commits, rather than the mutable
alias alone, identify the build under review.

## Data and Browser Boundaries

Vercel delivers the static application and receives ordinary hosting requests.
Geometry decoding and analysis execute in same-origin browser module Workers.
Project saves, assets and retained runs use the browser's local IndexedDB;
this deployment adds no upload or synchronization API.

Localhost, PR preview URLs and the permanent domain are different browser
origins. Their saved projects are separate. Export a portable project from the
old origin, then import it at the intended origin; neither changing URLs nor
deployment promotion migrates browser data. Keep portable backups.

The hosted build requires network access to obtain application assets. It is
not the self-contained offline distribution and does not establish an offline
startup guarantee. The app's declared browser, WebGL and method limits remain
unchanged.

## Verification

`APP_URL` remains the only app/browser-test URL. The browser runner accepts an
explicit HTTPS origin and does not start Vite for it. Development and local
preview servers still reject non-loopback origins. Do not put credentials,
tokens, paths or query strings in `APP_URL`.

From the repository root, run the maintained normal-app collision journey
against the exact deployment being reviewed:

```sh
APP_URL=https://asyra-sim.vercel.app yarn workspace @asyra/asyra-sim test:e2e e2e/__tests__/mixed-pair-feedback.spec.ts
```

For a PR deployment, substitute its verified HTTPS origin. Access protection
must be respected; a login screen is not a passing application smoke test.
Record the source commit and deployment URL separately from the permanent
alias. Inspect the generated screenshots after the test passes. Check HTML,
script, stylesheet and Worker responses, same-origin security headers, and
real Worker results. Missing assets must return errors, not a rewritten HTML
document. Repository CI and the `Vercel - asyra-sim` check must pass for the
current PR head before handoff.
