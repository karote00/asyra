# Cloudflare App Delivery

Task context: standalone continuation of Cloudflare static delivery. This contract
covers App hosting, deployment verification and the later website entry update.
It does not change App runtime, backend, AI or Inspector behavior.

## Public frontend demos

| App | Public origin | Static output |
| --- | --- | --- |
| Asyra Design | <a href="https://asyra-design.pages.dev/?fileId=demo" target="_blank" rel="noopener noreferrer">Open Design</a> | `apps/asyra-design/dist/frontend` |
| FieldScope | <a href="https://asyra-fieldscope.pages.dev" target="_blank" rel="noopener noreferrer">Open FieldScope</a> | `apps/fieldscope/dist/frontend` |
| Asyra Sim | <a href="https://asyra-sim.pages.dev" target="_blank" rel="noopener noreferrer">Open Sim</a> | `apps/asyra-sim/dist` |

These deployments contain frontend assets only. Editing, local history, browser
storage and local Workers remain available. They do not host API routes, AI
providers, collaboration servers or durable backend storage. Design explicitly
builds with an empty `VITE_COLLABORATION_WS_URL`. For full service integration,
clone the repository and follow each App's README and local `.env.example`.
Browser data belongs to its origin; data saved at a Vercel origin is not copied
to a Pages origin.

## Automatic publication

`.github/workflows/app-cloudflare.yml` runs on every push to `main`, independently
of repository `CI`. It audits dependencies, builds all three Apps in one Turbo
graph, prepares isolated artifacts, and runs real production browser tests before
upload. Only its own successful build job permits publication; unrelated Skill
packaging failures cannot block delivery. This gate does not claim full repository
CI success. Manual dispatch on `main` uses the same verification. PR, fork and
non-main runs cannot publish.

Only publication jobs use the existing `website-production` environment:
`CLOUDFLARE_API_TOKEN` (Pages Write) and `CLOUDFLARE_ACCOUNT_ID`. Its branch
policy must remain main-only. Credentials never enter the build or artifacts.
No additional token or permission is required. The retained environment name
also serves the primary website workflow.

The helper admits only the three registry identities, creates a missing Direct
Upload project with production branch `main`, and rejects changed identity,
branch, subdomain or Git integration. An API error does not trigger creation.
Wrangler 4.149.0 runs in an isolated npm directory, then uploads only the
verified static directory from the same workflow run. Obsolete main revisions
are skipped before publication. Per-App jobs report failures independently.

`deployment-version.json` records the exact source SHA. Public verification
waits for it with at most 30 read attempts (two seconds apart, ten-second request
timeout), then checks JavaScript/CSS delivery, preserved response headers and
real 404s for
missing APIs and Workers. A real `404.html` disables Pages' implicit SPA fallback;
these Apps navigate at their root with query parameters.

First deployment must pass for all three Apps before publishing the website
entry changes. Review and merge use the repository Git policy; deployment
configuration does not itself grant an agent permission to merge.

## Verification and recovery

```bash
VITE_COLLABORATION_WS_URL='' yarn turbo run @asyra/asyra-design#react:build @asyra/fieldscope#react:build @asyra/asyra-sim#react:build --concurrency=2
yarn workspace @asyra/asyra-design typecheck
SOURCE_SHA=$(git rev-parse HEAD) node scripts/app-cloudflare.mjs prepare
APP_ARTIFACT_ROOT=tmp/cloudflare-apps node --test --test-concurrency=1 '--test-name-pattern=^(Design|Sim|FieldScope) production ' scripts/__tests__/production-artifacts.browser.test.mjs
APP_PUBLIC_TEST=1 node --test --test-concurrency=1 '--test-name-pattern=^(Design|Sim|FieldScope) production ' scripts/__tests__/production-artifacts.browser.test.mjs
```

Check GitHub Actions **Apps - Cloudflare Pages**, each publication job's summary,
and Cloudflare **Workers & Pages** for the corresponding project. A failed build
leaves existing deployments intact. A failed public check is not a successful
release; inspect the project and source marker before retrying. Correct the
source through a PR, or dispatch a verified current `main` after an operational
failure is resolved. No automatic rollback or mutation retry is performed.
Bounded readiness reads
allow initial DNS/edge propagation, including transient 522 responses; they never
accept an old revision or a different App.

API authority: <a href="https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/create/" target="_blank" rel="noopener noreferrer">Cloudflare Pages project creation</a> and <a href="https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/" target="_blank" rel="noopener noreferrer">project lookup</a>.
