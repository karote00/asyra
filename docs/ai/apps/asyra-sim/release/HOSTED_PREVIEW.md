# Hosted Development Workbench

The primary frontend workbench is
<a href="https://asyra-sim.pages.dev" target="_blank" rel="noopener noreferrer">asyra-sim.pages.dev</a>.
[Cloudflare App delivery](../../../workflows/app-cloudflare.md) owns manual
publication from main, isolated artifacts, production checks and public revision
verification. Sim remains a browser-local workbench without backend or AI services.

Hosting the development workbench does not complete R0 Public Alpha. The
[first-release gates](FIRST_RELEASE.md) and [offline candidate gates](LOCAL_CANDIDATE.md)
remain separate. This deployment does not authorize real equipment operation.

## Cloudflare configuration

The manual App workflow owns Node 24, locked Yarn installation, the Turbo build
and publication of `apps/asyra-sim/dist`. `public/_headers` owns the native Pages
HTTP policy, including same-origin scripts, Workers and connections. Missing
assets and API routes return real 404s. No backend or cloud solver is deployed.
The [previous hosting record](../../../decisions/hosting-before-cloudflare.md) is preserved
verbatim as historical evidence alongside completed plans and release decisions.
It does not configure the current host.

## Data and Browser Boundaries

The hosting provider delivers static files and receives ordinary hosting requests.
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
APP_URL=https://asyra-sim.pages.dev yarn workspace @asyra/asyra-sim test:e2e e2e/__tests__/mixed-pair-feedback.spec.ts
```

For a PR deployment, substitute its verified HTTPS origin. Access protection
must be respected; a login screen is not a passing application smoke test.
Record the source commit and deployment URL separately from the permanent
alias. Inspect the generated screenshots after the test passes. Check HTML,
script, stylesheet and Worker responses, same-origin security headers, and
real Worker results. Missing assets must return errors, not a rewritten HTML
document. Repository CI must pass for the current PR head before handoff. Cloudflare
publication must also pass its exact-source public verification.
