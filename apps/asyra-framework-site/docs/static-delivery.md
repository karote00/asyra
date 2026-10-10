# Independent static website delivery

The website supports two independent deployment targets: the existing Vercel
Next.js application and a Cloudflare Pages static export. Neither target
redirects to or requires the other. Each build uses its own explicit
`NEXT_PUBLIC_SITE_URL` for canonical metadata, social images, robots and sitemap.
The primary production origin is `https://asyra-framework.pages.dev`.
Vercel remains an independently managed secondary deployment.

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

## Manual production delivery

`.github/workflows/site-cloudflare.yml` runs only when an operator chooses
**Actions > Website - Cloudflare Pages > Run workflow**, selects `main`, and
starts the run. Pushes, merges, schedules and completed CI runs never deploy.

The manual run checks out its exact source SHA, installs locked dependencies,
audits high-severity dependency findings, runs website lint/unit checks, builds
the static export, and checks generated types, metadata, discovery files, headers
and browser behavior. Only a successful build job passes its same-run artifact
to the separate publication job. Forks and non-main branches cannot publish.
Repository `CI` runs independently and does not start a deployment.

The publication job uses the `website-production` GitHub Environment. Only
this job receives the Cloudflare token. It checks the current main SHA before
uploading; obsolete candidates are skipped. Publication is serialized and does
not cancel an in-progress deployment. Wrangler runs in a separate temporary
folder so its installation files cannot enter the public artifact. After
upload, the production smoke checks all 46 pages and the workflow checks the
public `deployment-version.json` against the candidate SHA. A failed public
check marks the run failed; it does not automatically retry publication or
roll back production. Inspect the actual Cloudflare deployment before recovery.

To activate the workflow after review:

1. Create the `website-production` GitHub Environment, allowing only the branch
   `main`, with the existing environment approval policy.
2. Create a Cloudflare API token restricted to this account, with
   `Account - Cloudflare Pages - Edit`. This permission applies to Pages projects
   in the selected account; it is not a project-only token. Store it only as the
   environment secret `CLOUDFLARE_API_TOKEN`, not in source, logs or workflow inputs.
3. Set environment variable `CLOUDFLARE_ACCOUNT_ID` to the existing account ID.
   Optional `GOOGLE_SITE_VERIFICATION` is a repository variable because the build
   job deliberately has no production environment credentials. The public GA ID
   and primary site origin are explicit workflow build inputs.
4. Approve the pinned Cloudflare Wrangler Action and Wrangler `4.149.0` as the
   deployment tooling, then merge the reviewed source changes through the
   repository's normal PR flow. No additional project dependency is required.
5. Start a manual run in GitHub Actions under
   **Website - Cloudflare Pages**, confirm the public source revision, and inspect
   its matching Cloudflare deployment. A local workflow file alone is not a
   verified deployment. Confirm the manual run completes successfully.

Every publication requires a separate **Run workflow** action, including after
a reviewed merge or an out-of-Git configuration change. Existing manual App
release entries remain Vercel-specific and do not update the primary website.
Cloudflare's deployment list and the GitHub job summary retain deployment IDs.

If the workflow was disabled to stop automatic delivery, merge the manual-only
workflow first, then choose **Enable workflow** in Actions. Enabling does not
publish anything; a separate manual run is required. Never re-enable a revision
that still declares `push`, `workflow_run` or scheduled deployment triggers.

Reference:
<a href="https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/" target="_blank" rel="noopener noreferrer">Cloudflare Direct Upload with continuous integration</a>.

## Search discovery setup - 2026-10-10

The existing Search Console property reports nine Vercel documentation URLs as
discovered but not indexed in its October 4 report. All nine corresponding
Cloudflare URLs return HTTP 200, allow indexing, use the Cloudflare canonical
origin, and appear in the new sitemap. This is not evidence of nine ownership
verification failures, nor does the report establish that the later Vercel
suspension caused the exclusions.

The GA stream retains measurement ID `G-LGCR34S33S` and now names the Cloudflare
origin. A separate URL-prefix Search Console property is awaiting ownership
verification. Its public HTML verification value is configured in the local
environment and the GitHub repository variable `GOOGLE_SITE_VERIFICATION`.
After publication, verify that property and submit `/sitemap.xml`. Google
controls crawl scheduling and indexing; passing website checks does not
guarantee inclusion or a particular completion date.

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
resource handoff and footer screenshots were inspected.

## Public acceptance - 2026-10-10

The independent production website is available at
<a href="https://asyra-framework.pages.dev" target="_blank" rel="noopener noreferrer">asyra-framework.pages.dev</a>.
Cloudflare deployment `3ab4fe7e-6780-40fa-8d70-6010292d5b09` contains the
static production build from local commit `e17bcbaff`. The uploaded archive
contains 318 files and has SHA-256
`a7b257ba7dc7565024c8df67166655694fec5f9e46812e446cb8623801d2191f`.
The Vercel project was not changed; no repository push was performed.

Anonymous HTTPS verification passed all 46 public pages, real 404 behavior,
robots and sitemap origin checks, six security headers, three social-preview
cases, three desktop/mobile visual cases, and both homepage transfer cases.
The deployed story images match the local artifact byte-for-byte, and hashed
JavaScript responses use a one-year immutable cache policy. Screenshots at
390px and 1440px were inspected.

All five configured analytics cases passed, including a focused rerun that
counts actual library execution across client navigation. Cloudflare Early
Hints may preload the Google library again; the regression assertion checks
that the library executes once and bootstrap configuration remains unique.
Google requests are intercepted by these tests, so this verifies integration
behavior rather than receipt of events in the GA reporting service.

Public homepage encoded resource bodies measured 1,394,774 bytes at 390px and
1,394,790 bytes at 1440px. Resource Timing transfer totals can omit Early Hints
preload bodies; use the controlled local comparison above for the reduction
percentage instead of comparing those public transfer totals with the baseline.
