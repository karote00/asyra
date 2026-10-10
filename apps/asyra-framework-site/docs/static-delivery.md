# Independent static website delivery

The website supports two independent deployment targets: the existing Vercel
Next.js application and a Cloudflare Pages static export. Neither target
redirects to or requires the other. Each build uses its own explicit
`NEXT_PUBLIC_SITE_URL` for canonical metadata, social images, robots and sitemap.
The second production origin is `https://asyra-framework.pages.dev`.

The static target preserves all 46 public pages, native document navigation,
Runtime Atlas, the six-chapter homepage, product sliders, reduced-motion and
mobile behavior. It has no Pages Functions or Worker. A generated `404.html`
keeps missing paths, including the retired `/story`, as genuine 404 responses.
Security headers share the same owner as the Vercel configuration. Only hashed
Next.js assets receive immutable one-year caching; other files retain the
platform's default revalidation behavior.

## Media

Original artwork lives in `assets/`, outside the public deployment. Run
`yarn workspace @asyra/asyra-framework-site media:encode` from the repository
root to regenerate committed delivery assets from those originals. The existing
Next.js dependency provides Sharp; no additional dependency is required.

The social image uses JPEG at quality 85. Story artwork uses WebP at quality 78
with lossless alpha. Encoding preserves dimensions and aspect ratios. Formal
tests cap the social image at 400,000 bytes and the two referenced story images
at 500,000 bytes combined, compare dimensions and alpha, and bound color error.
Product screenshots retain their original dimensions and content.

## Build and inspect

Install the declared dependencies with `yarn install --immutable`. Preserve the
app's local `.env`; use `.env.example` only when it does not exist. Set the target
HTTPS origin, `SITE_ENV=production`, and the existing GA4 measurement ID there.
Google verification is optional and independent of GA. Vercel's environment
always wins over `SITE_ENV`, so a Vercel preview cannot accidentally enable
production indexing or analytics through the static setting.

From the repository root:

```sh
yarn workspace @asyra/asyra-framework-site build:static
STATIC_EXPORT_TEST_ENABLED=1 node --env-file-if-exists=apps/asyra-framework-site/.env --test apps/asyra-framework-site/__tests__/static-delivery.test.mjs
SITE_URL=http://127.0.0.1:3039 node --env-file-if-exists=apps/asyra-framework-site/.env apps/asyra-framework-site/scripts/preview-static.mjs
```

`build:static` builds required framework packages through the existing Turbo task,
exports to `apps/asyra-framework-site/out`, generates `_headers`, and checks
that the artifact fits dashboard upload limits. The local preview is a test
server, not a production service or a complete Cloudflare emulator. Record its
PID and stop it after testing.

Use a preview build for broad E2E verification without analytics collection:

```sh
SITE_ENV=preview yarn workspace @asyra/asyra-framework-site build:static
SITE_URL=http://127.0.0.1:3039 yarn workspace @asyra/asyra-framework-site test:routes
SITE_URL=http://127.0.0.1:3039 yarn workspace @asyra/asyra-framework-site test:e2e
```

Then rebuild production and run the GA suites with
`GOOGLE_SERVICES_TEST_ENABLED=1` and `NEXT_PUBLIC_GA_MEASUREMENT_ID` matching the
build. Those suites intercept Google requests. The transfer spec records fresh
browser-context navigation plus all homepage image loads at 390 and 1440 pixels.
It retains per-resource encoded-body and transfer bytes as JSON attachments;
preloaded images count as images regardless of their initiator type. Compare
first-party transfer separately from the externally hosted analytics library.

The ordinary Vercel build remains:

```sh
yarn turbo run build:asyra-framework-site --filter=@asyra/asyra-framework-site
```

It retains Next.js server output in `dist` and native response headers.

## Publish and verify

Upload only the contents of `out` to the `asyra-framework` Pages Direct Upload
project. A zip must contain `index.html`, `_headers` and the other exported files
at its root. Never upload the repository, `.env`, source artwork, or test output.
The dashboard currently permits 1,000 files and 25 MiB per file; the preparation
script checks both. Direct Upload can be updated manually or through an
explicitly authorized CLI/CI deployment. It cannot be converted in-place to a
Git-integrated Pages project.

After deployment, run the production smoke and social preview test against the
anonymous HTTPS URL. Inspect home, documents and Atlas, check real 404 status,
verify the emitted security/cache headers, and verify GA requests use the new
page location. Dashboard deployment success alone is not acceptance. Keep the
Vercel project unchanged; future custom-domain adoption is a separate decision.

References:

- <a href="https://developers.cloudflare.com/pages/get-started/direct-upload/" target="_blank" rel="noopener noreferrer">Cloudflare Direct Upload</a>
- <a href="https://developers.cloudflare.com/pages/configuration/headers/" target="_blank" rel="noopener noreferrer">Cloudflare response headers</a>
- <a href="https://developers.cloudflare.com/pages/configuration/serving-pages/" target="_blank" rel="noopener noreferrer">Cloudflare static routing and caching</a>

## Local acceptance - 2026-10-10

The retained baseline at `0dd9e2c0e` measured 1,666,065 first-party transfer
bytes on both 390px and 1440px viewports. The optimized static preview measured
1,433,426 bytes with the same complete-homepage image loading procedure (14.0%
less). Image bodies decreased from 1,371,195 to 1,136,945 bytes. These figures
exclude the externally served GA library and do not predict CDN compression.
The social image is separate from ordinary homepage image loading: its body
fell from 2,457,204 to 213,636 bytes (91.3%).

Both Vercel and static production builds passed. Local verification passed
25 Inspector contracts, 103 unit tests, 46-page route smoke, two static artifact
checks, naming, scoped lint and typecheck. Browser verification passed 97 cases
in the full preview run plus both corrected transfer cases on rerun; five
conditional cases were skipped. The configured production analytics suite
passed its five applicable cases. The transfer correction excludes normal
browser-aborted speculative document requests from network failure assertions;
it still requires successful navigation and decoded images and retains all
resource timing entries. Desktop, mobile, intermediate story, product evidence,
resource handoff and footer screenshots were inspected. Public deployment and
anonymous HTTPS acceptance remain a separate final gate.
