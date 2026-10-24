# Cloudflare App Delivery

Follow [Release Update Guidance](../framework/rules/release-update-guidance.md)
for pending impact notes, necessary integration guides and preservation checks.
The existing publication jobs enforce artifact-bound summary and guide checks.
See that rule for candidate files, coverage gaps and per-owner recovery.

Task context: standalone continuation of Cloudflare static delivery. This contract
covers App hosting, deployment verification and the later website entry update.
It does not change App runtime, backend, AI or Inspector behavior.

## Public frontend demos

| App              | Public origin                                                                                                    | Static output                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Asyra Design     | <a href="https://asyra-design.pages.dev/?fileId=demo" target="_blank" rel="noopener noreferrer">Open Design</a>  | `apps/asyra-design/dist/frontend`     |
| Asyra FieldScope | <a href="https://asyra-fieldscope.pages.dev" target="_blank" rel="noopener noreferrer">Open Asyra FieldScope</a> | `apps/asyra-fieldscope/dist/frontend` |
| Asyra Sim        | <a href="https://asyra-sim.pages.dev" target="_blank" rel="noopener noreferrer">Open Sim</a>                     | `apps/asyra-sim/dist`                 |

These deployments contain frontend assets only. Editing, local history, browser
storage and local Workers remain available. They do not host API routes, AI
providers, collaboration servers or durable backend storage. Design explicitly
builds with an empty `VITE_COLLABORATION_WS_URL`. For full service integration,
clone the repository and follow each App's README and local `.env.example`.
Browser data belongs to its origin; data saved at a previous origin is not copied
to a Pages origin.

## Native response configuration

Each App owns `public/_headers` in native Cloudflare Pages syntax. Preparation
validates and copies that file unchanged; public verification and the Sim
browser proof read the same policy. The current App contract permits literal
global `/*` rules only. Unsupported patterns, placeholders and duplicate headers
fail before publication rather than silently escaping verification. Apps without
custom headers keep an explicit comment-only file. Sim retains its same-origin
CSP and security headers. The website separately generates `_headers` from its
existing `site-security-headers.mjs` owner during `build:static`.

## Manual publication

`.github/workflows/app-cloudflare.yml` runs only through
**Actions > Apps - Cloudflare Pages > Run workflow** with `main` selected.
Pushes, merges, schedules and completed CI runs never deploy. A manual run builds
and deploys all three frontend demos; the website has its own separate manual
workflow.

The run audits dependencies, builds all three Apps in one Turbo graph, prepares
isolated artifacts, and runs real production browser tests before upload. Only
its own successful build job permits publication. Forks and non-main runs cannot
publish. Repository `CI` runs independently and does not start a deployment.

If this workflow is disabled, first merge the manual-only configuration, then
choose **Enable workflow**. Enabling alone does not deploy; start a separate
manual run when publication is wanted.

Only publication jobs use the existing `website-production` environment:
`CLOUDFLARE_API_TOKEN` (Pages Write) and `CLOUDFLARE_ACCOUNT_ID`. Its branch
policy must remain main-only. Credentials never enter the build or artifacts.
No additional token or permission is required. The retained environment name
also serves the primary website workflow.

The helper admits only the three registry identities and rejects changed identity,
branch, subdomain or Git integration. Its project-creation path now requires
matching release guidance before POST; an unestablished first release is an
explicit coverage gap, not an automatic empty baseline. An API error does not trigger creation.
Wrangler 4.149.0 runs in an isolated npm directory, then uploads only the
verified static directory from the same workflow run. Obsolete main revisions
are skipped before publication. Per-App jobs report failures independently. Guidance preparation reads the current
provider deployment ID and confirms the public SHA, then admission rechecks the
same source, downloaded bytes and online baseline immediately before upload.
Before upload, the workflow saves an immutable
`release-guidance-<app>-<source>` candidate checkpoint. It restores that checkpoint
on retries, including new runners and later dispatches of the same source.
Results use separate `-result-<run-attempt>` artifacts. A retained checkpoint is
not overwritten within the same run; another dispatch saves the identical
candidate in its own run. Both remain outside the uploaded static files. The
website workflow follows the same protocol with owner `asyra-framework`.

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
VITE_COLLABORATION_WS_URL='' yarn turbo run @asyra/asyra-design#react:build @asyra/asyra-fieldscope#react:build @asyra/asyra-sim#react:build --concurrency=2
yarn workspace @asyra/asyra-design typecheck
SOURCE_SHA=$(git rev-parse HEAD) node scripts/app-cloudflare.mjs prepare
APP_ARTIFACT_ROOT=tmp/cloudflare-apps node --test --test-concurrency=1 '--test-name-pattern=^(Design|Sim|Asyra FieldScope) production ' scripts/__tests__/production-artifacts.browser.test.mjs
APP_PUBLIC_TEST=1 node --test --test-concurrency=1 '--test-name-pattern=^(Design|Sim|Asyra FieldScope) production ' scripts/__tests__/production-artifacts.browser.test.mjs
```

Check GitHub Actions **Apps - Cloudflare Pages**, each publication job's summary,
and Cloudflare **Workers & Pages** for the corresponding project. A failed build
leaves existing deployments intact. A failed public check is not a successful
release; inspect the project and source marker before retrying. For an operational
failure, rerun the failed publication job or dispatch the same current `main`:
`restore` retrieves the original candidate/result, `prepare` preserves its
baseline and summary, and `check` verifies its bytes and recorded deployment ID.
A later failed upload retains the last known published deployment receipt without
claiming that the latest attempt succeeded. No automatic rollback or mutation
retry is performed.

A newer source cannot silently use an uploaded but unverified predecessor. Verify
and record that predecessor against its original candidate before proceeding;
source fixes still require the normal PR and release process. Missing or expired
candidate/results stop publication with a coverage gap, including if an upload
succeeded without leaving a deployment receipt. Recover retained original evidence
and verify the deployment; do not regenerate a target-to-target empty summary.
The workflows retain these operational artifacts for seven days. They are not
permanent public release history (Task 3); a release after that retention window
requires recovered verified evidence. Production sources predating the guidance
protocol retain their existing provider/marker baseline checks.
Bounded readiness reads
allow initial DNS/edge propagation, including transient 522 responses; they never
accept an old revision or a different App.

Guidance baseline authority: <a href="https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/" target="_blank" rel="noopener noreferrer">Cloudflare project canonical deployment</a>.

API authority: <a href="https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/create/" target="_blank" rel="noopener noreferrer">Cloudflare Pages project creation</a> and <a href="https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/" target="_blank" rel="noopener noreferrer">project lookup</a>.

Recovery transport: <a href="https://docs.github.com/en/rest/actions/artifacts" target="_blank" rel="noopener noreferrer">GitHub Actions artifacts</a> and <a href="https://cli.github.com/manual/gh_run_download" target="_blank" rel="noopener noreferrer">GitHub CLI artifact download</a>.
