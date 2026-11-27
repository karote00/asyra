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
