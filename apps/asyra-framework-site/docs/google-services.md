# Google Search Console and GA4

The site loads Google Analytics only when Vercel identifies the deployment as
Production and a valid GA4 measurement ID is configured. Local development and
Preview deployments do not emit Google tags or the Search Console verification
meta tag. Empty configuration leaves the services disabled; invalid configured
Production identifiers fail the build.

## Production configuration

Set these build-time variables on the existing Vercel site project:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://asyra-framework.vercel.app` |
| `NEXT_PUBLIC_SITE_INDEXING` | `true` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | The website stream's `G-...` measurement ID |
| `GOOGLE_SITE_VERIFICATION` | The HTML meta tag's content value, not the full tag |

Vercel supplies `VERCEL_ENV`. The site-specific Turbo task forwards these
variables to Next.js. Rebuild after configuration changes because metadata,
scripts, and response headers are emitted at build time.

Creating a GA4 stream or a Search Console property does not configure Vercel.
Check that both identifier variables actually exist in the site's Production
environment before deploying. A Ready deployment with empty configuration
intentionally omits the Google tags and cannot collect visits or verify GSC.

The identifiers become public in the site's HTML. Never place a Google password,
OAuth token, service-account key, or Analytics API secret in these variables.

## Search Console

Use the URL-prefix property `https://asyra-framework.vercel.app/`.
The project does not own DNS for `vercel.app`, so use HTML-tag verification.
Copy the token into the Production environment variable, merge the reviewed PR and let the existing Git integration deploy main, check that the anonymous homepage head contains the token, then press
Verify in Search Console. Keep the token configured after verification.

Submit `https://asyra-framework.vercel.app/sitemap.xml` and inspect the homepage
and a representative document URL. Verification and sitemap submission do not
guarantee indexing or ranking.

## GA4 stream

Use the Asyra account and Asyra Framework Website resource, with Taiwan reporting
time and TWD. The website stream should use the official site URL.

Enable enhanced measurement for page loads and page changes based on browser
history. This is the sole owner of virtual page views: the site initializes
`gtag` once in its root layout and does not separately send manual page views.
Enable outbound clicks to measure GitHub and Demo links. Do not add a second GTM
container or manual navigation tracker for the same measurement ID.

Google signals and ad personalization are disabled by the site's bootstrap.
The CSP permits only the Google Analytics and tag-loading hosts required for
this setup, without adding advertising hosts or production `unsafe-eval`.

Before declaring live collection complete, use Realtime/DebugView to verify one
initial `page_view`, one event per actual internal navigation, and a GitHub or
Demo outbound click. Check the page location and referrer across navigation.
Then link the verified GSC property to the same GA4 website stream if desired.

## Site interaction events

The configured root layout owns one interaction collector across every route,
including client-side navigation. These app-owned event names are stable wire
identities in `lib/site-interaction-analytics.mjs`.

| Event | Meaning | Parameters beyond `page_path` |
| --- | --- | --- |
| `site_cta_click` | Annotated primary CTA: compose, create app, explore Atlas, product case, demo, source | `cta_id`, `link_area` |
| `site_navigation` | Internal link to a known public route, including section links | `target_path`, `link_area`, `navigation_type` |
| `site_search` | Nonempty documentation query settles for 500 ms, Enter is pressed, or a result is selected | `result_count`, `query_length` |
| `site_search_select` | A displayed documentation search result is selected | `target_path`, `result_position` |
| `site_ui_interaction` | Navigation/docs/search dialog opens or closes; error retry is pressed | `control_id`, `action` |
| `site_atlas_interaction` | Case selection or run/pause/step/replay/reset intent | `case_id`, `action` |
| `site_code_copy` | A nonempty selection within one code block is copied | None |

This measures meaningful controls rather than blank-area clicks. CTA and search
result clicks each produce their own custom event instead of an additional
`site_navigation`. An external CTA can also produce Google's enhanced-measurement
outbound `click`: the two events describe distinct questions and must not be
summed as unique clicks. Middle-button and keyboard activation are supported;
disabled controls and already-selected Atlas cases are ignored.

Keep enhanced measurement enabled for page/history changes, outbound links,
90% scroll and file downloads; GA owns those events and engagement. This collector
does not duplicate them. The current site has no signup, checkout, lead form or
video conversion flow, so it does not invent those recommended events. Search
Console reports search visibility and indexing, not on-site button interactions.

Custom payloads use known public route paths, fixed control/action identifiers
and approved Atlas case IDs. They exclude query strings, URL fragments, raw
search queries, link labels, copied code and runtime payloads. Unknown current
paths become `(other)` and unknown destination paths are ignored. Search length
is bucketed as `1_3`, `4_8` or `9_plus`; result count is the **displayed** count
(0–12), and result position is one-based. Identical queries are deduplicated
within the open dialog; closing, changing routes and unmounting cancel pending
work. IME composition does not emit interim searches. These restrictions apply
to custom events; Google's automatic page-location collection remains governed
by the stream's settings.

The collector has no polling or persistent storage. It builds route/case lookup
sets once per mount and reuses the search UI's rendered count rather than running
the search again. Collection is best effort: actions before `gtag` is available,
blocked scripts or transport failures may not reach GA and never prevent the UI
action. Atlas events prove intent, not successful execution; code-copy events
prove a copy action, not downstream use.

After the reviewed change reaches Production, verify these events in Realtime
or DebugView. For reporting in Explorations, register event-scoped custom
dimensions for `cta_id`, `link_area`, `target_path`, `page_path`,
`navigation_type`, `query_length`, `control_id`, `action` and `case_id` as needed;
register `result_count` and `result_position` as custom metrics when numeric
analysis is needed. Do not mark every click as a key event. A selected CTA may
measure a product-interest goal, but it must not be labeled an installation,
signup or purchase. Dashboard definitions and key-event choices are account
configuration, not automatic effects of this code change.

## Formal checks

Run the existing site unit tests, build, route smoke, and these E2E tests:

- `mobile-image-delivery.spec.ts`: fresh Retina contexts, selected image widths,
  transfer budgets, and screenshots.
- `google-services.spec.ts`: disabled configuration by default; for a server
  built with Google services, set `GOOGLE_SERVICES_TEST_ENABLED=1` plus the
  matching measurement ID and verification token in the test process.
- `site-interaction-analytics.spec.ts`: the same enabled/disabled gate, covering
  CTA, SPA navigation, search privacy, mobile dialogs, Atlas intent, code copy
  and absence of collection when disabled.
- `site-interaction-analytics.test.mjs`: payload allowlists, cancellation,
  deduplication, IME, transport failure and listener/computation lifetime.

The Google E2E test intercepts the external library, so it checks site integration
and navigation stability without sending test data to Google. It does not prove
that GA4 received real events; the account-side live check remains necessary.

For the configured official deployment, run the explicit enabled-services gate
with the identifiers copied from its GA4 stream and GSC HTML-tag panel:

```bash
SITE_URL=https://asyra-framework.vercel.app \
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YOURMEASUREMENTID \
GOOGLE_SITE_VERIFICATION=your-html-meta-content \
yarn workspace @asyra/asyra-framework-site test:google-services
```

This command requires both identifiers and checks the deployed verification
meta tag, Google library request, initialization, internal navigation and custom
interaction events. Do
not use the default disabled-services test as evidence that Production collects
data. Run this gate after the deployment is Ready, then finish GSC ownership
verification and submit `/sitemap.xml`. Report processing is a separate step;
waiting for reports cannot repair missing deployment configuration.

For isolated worktrees, supply `SITE_URL` explicitly and use a free port.
Screenshots belong under Playwright's app-owned output directory.

## References

- <a href="https://support.google.com/analytics/answer/9216061?hl=en" target="_blank" rel="noopener noreferrer">Google: enhanced measurement events</a>
- <a href="https://developers.google.com/analytics/devguides/collection/ga4/reference/events" target="_blank" rel="noopener noreferrer">Google: recommended events</a>
- <a href="https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications" target="_blank" rel="noopener noreferrer">Google: measure single-page applications</a>
- <a href="https://developers.google.com/tag-platform/security/guides/csp" target="_blank" rel="noopener noreferrer">Google: Content Security Policy requirements</a>
- <a href="https://support.google.com/webmasters/answer/9008080" target="_blank" rel="noopener noreferrer">Google: verify site ownership</a>
