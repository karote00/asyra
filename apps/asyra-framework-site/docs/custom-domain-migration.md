# Custom domain migration

## Independent task contract

Base: `86b363cfa9ac0a7cb3f9a549016d32a6fc9ff52a` (`origin/main`).
This is an independently authorized website configuration task, delivered in a
separate worktree and PR. Review, merge and deployment are separate milestones.

The accepted production origin is `https://asyra.dev`. The website's existing
origin resolver owns absolute metadata and discovery URLs; the Cloudflare
workflow supplies the production build input and public verification target.
Keep the existing Pages project, GA4 measurement ID `G-LGCR34S33S`, indexing
admission, routes, analytics behavior, and manual-only deployment policy.

Scope: the origin resolver, environment template, website deployment workflow,
their regression tests, the exact-owner public-domain naming admission, and
current deployment/Google setup documentation.
No framework APIs, visual layout, demo domains, email DNS, dependencies,
Inspector semantics, hosting resources, or historical acceptance evidence change.
Existing flow contracts continue to require the accepted stable origin; this
migration changes its configured value, not the owners or handoffs.

## Implementation and acceptance

1. Prove the existing deployment/default-origin tests accept the old hostname,
   then strengthen them and demonstrate failure before changing production code.
2. Update the production input and default origin, public smoke target and
   deployment summary. Keep preview indexing disabled and the GA identity stable.
3. Build the production static artifact and verify every sitemap route's
   canonical URL, robots sitemap URL, social metadata, GA tag and security headers.
4. Run naming, scoped lint, website contracts/unit tests, typecheck and the
   production Google browser integration suites. Review the bounded diff and
   create a PR from the validated source branch.

Stop if a required gate is unavailable or a fix requires changing an excluded
owner. Do not broaden this migration to unrelated website cleanup.

## Operational handoff

The `asyra.dev` Search Console domain property is DNS-verified and linked to the
existing GA4 website stream, whose URL is now `https://asyra.dev`. Keep the DNS
verification TXT record and the old URL-prefix property.

After PR review and merge, an authorized operator must manually run
**Website - Cloudflare Pages** on main. Confirm the deployed source revision,
canonical URLs, robots and sitemap on the public domain; confirm old-host 301
redirects preserve paths and queries. Then submit `https://asyra.dev/sitemap.xml`
in the new Search Console property and inspect representative URLs. Check GA
Realtime for visits using the new hostname. These live acceptance steps remain
pending until deployment and cannot be claimed from a local build.

## Deployment baseline follow-up

The first manual run after merging the migration passed build and browser
verification but stopped before upload: release guidance requested the old
project alias with redirects forbidden. The baseline reader now uses the
successful production deployment URL returned by Cloudflare, validates that it
belongs to the expected Pages project, and compares its marker against the
provider source SHA. Public custom-domain verification remains a separate
post-upload gate. Redirect rejection and credential isolation remain enforced.

The repair is limited to the release-guidance baseline reader, its permanent
regression tests and this operational handoff. Tests cover all four deployment
owners, invalid provider origins and mismatched source markers. After reviewing
and merging the repair, start a new manual workflow from current main; rerunning
the failed old revision does not include this correction.

The follow-up also updates homepage product links and the directly linked Design
case page to `design.asyra.dev`, `fieldscope.asyra.dev`, and `sim.asyra.dev`.
The Design demo retains `fileId=demo` and its existing `open_demo` analytics
identity. All three destinations returned HTTPS 200 during verification.
Historical/documentation links are outside this homepage correction.


## Production verification follow-up

The next upload succeeded, but its public verification still expected 46 pages
while the accepted content inventory now produces 62. The smoke gate now compares
the complete sitemap URL list with the unique current routes, preserving failure
on missing, duplicate, unexpected and wrong-origin entries. Its completion count
is derived from that same inventory. Permanent CLI tests exercise the current
manifest and malformed sitemaps.

The bounded recovery sequence is: validate this correction, merge after CI,
restore the prior verified deployment if the failed publication blocks baseline
admission, run the current manual workflow, and verify both its success receipt
and the exact public source revision. Do not bypass release admission or mark a
failed attempt as verified.
