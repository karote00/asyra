# Manual App Release

## Operator flow

1. Merge reviewed changes through the protected PR flow. Merging does not deploy.
2. Open Actions, select **Manual App Release**, choose **main**, and run it.
   The dispatch commit is frozen for every job; a later main push cannot change
   the candidate. Arbitrary branches, fork repositories and older SHA inputs
   are deliberately unsupported. Trigger a new run to choose a newer candidate.
3. Read the plan job summary and its changed-input list. Each App compares its
   own last successful online SHA with the candidate, including accumulated
   commits and the union of old/new transitive workspace dependencies.
4. The existing CI, packed clean-consumer readiness, ordinary/collaboration E2E
   and production-artifact tests run against that exact dispatch commit. The
   release enables the existing balanced AI correctness gate. No production
   credential is passed to these jobs.
5. If any verifier fails, do not approve or deploy. If nothing is affected, the
   workflow ends without requesting a deployment.
6. Review and approve the **app-production** environment only after the plan
   and all verifiers are successful. Its approved reviewer is the repository
   owner; self-approval is allowed for this single-maintainer repository.
7. The privileged job re-reads the online records, checks live Vercel project
   identity/configuration, enforces the budget, then releases Apps sequentially.
   It creates one staged Production deployment per affected App, verifies the
   exact built SHA and HTTP/script delivery, promotes it, and checks the stable
   production domain. No automatic mutation retry or automatic rollback occurs.

For a deployment setting or environment-variable change outside Git, choose
the specific `force_app` and provide a single-line reason of 8-200 characters.
This intentionally bypasses deployment deduplication and consumes quota.
Ordinary retries must inspect previous results before starting another run.

## Setup and cutover

The default branch must contain the reviewed workflows before the manual entry
can run. Do not dispatch the publication workflow merely to test this PR.

- Keep the Vercel GitHub App authorization for this public repository, but
  disconnect the Git repository inside **each** hosted Vercel project.
  Deployment creation uses the API Git source with both ref and SHA fixed to
  the candidate; `skipGitConnectDuringLink` prevents intentional reconnection.
- In each project's Production environment, disable **Auto-assign Custom
  Production Domains**. The release refuses to proceed if this is enabled,
  if a Git connection remains, or if the project root is unexpected.
- In GitHub Environment **app-production**, allow only the branch `main`,
  require owner approval, set `VERCEL_TEAM_ID`, and store a team-scoped
  `VERCEL_TOKEN` secret. Do not store it as an unrestricted repository secret.
  Keep token expiry/rotation under the account owner's control. Never paste it
  into PRs, logs, source, workflow inputs or chat.
- Require the five PR checks listed in `package-release-validation.md`.
  Preserve existing PR, force-push and deletion protection. Do not require
  obsolete Vercel Preview status contexts.
- Keep Vercel Authentication enabled. For each protected project, the owner
  creates a Protection Bypass for Automation secret in Vercel and stores it in
  the same GitHub Environment as `VERCEL_BYPASS_SIM`, `VERCEL_BYPASS_DESIGN`
  or `VERCEL_BYPASS_FRAMEWORK`. The controller checks for a missing secret
  before creating deployments. It sends the secret only in an HTTP header to
  the exact staged origin, refuses redirects and never sends it to external
  assets or the stable production smoke. It never places secrets in URLs.

## App ownership and online versions

`scripts/app-release-plan.mjs` owns the three public project identities and
their roots. It reads committed manifests, traversing runtime, development,
peer and optional workspace dependencies. Old dependency edges are included
so deleting a dependency cannot hide an affected deployment.

App/owned dependency source and assets trigger release. Public documentation
also triggers the website. Tests, internal AI documents and unrelated
workspaces do not. Unknown root inputs, including lockfiles and shared build
scripts, conservatively affect all Apps. The graph and diff are constructed
once per distinct commit per planning invocation, with no cross-run cache.

The canonical deployment records are GitHub Deployments named
`app-production - <project>`. Each record links the candidate SHA, Vercel ID,
previous production ID and Actions run. Only a successful final smoke receives
a success status. Initial setup reads the existing Vercel-created Production
environment's successful record; its legacy environment name is retained as
an immutable external compatibility identity. Before any publication, the live
Vercel production target must match that baseline. Missing records, failed
post-promotion checks, manual rollbacks or other drift require reconciliation;
the workflow does not silently choose a new baseline.

For reconciliation, inspect the live Vercel production target, its source SHA,
stable domain and smoke results. An owner may then create a corrected GitHub
Deployment record with that actual SHA, deployment ID, a success status and a
reason linking the recovery evidence. Never mark a failed candidate successful
to unblock the next run. Package versions are not website version identities.

## Evidence and limits

`yarn build:production-artifacts` executes the App builds and the website's
explicit `build:asyra-framework-site` task in one Turbo graph. Root
`react:build` alone does not include that website task.
`yarn test:production-artifacts` then consumes those production builds. It never rebuilds or starts Vite middleware. It verifies Sim analysis
and local persistence, Design local editing/history, and Next production
routes/client search. It checks browser exceptions and rejects dev-source
requests. Next runs as an explicitly owned child process and is cleaned up.
The suite supplements, rather than replaces, the larger diagnostic E2E suites.

Vercel still builds the exact source separately. This is source-identity
verification, not a claim that the CI and Vercel output bytes are identical.
Production HTTP smoke checks HTML and delivered scripts, not every browser
interaction, backend API or external dependency. Design's local editing proof
does not claim hosted AI or collaboration backends exist. Their formal service
E2E remains separate. Do not add dev middleware to make production tests pass.

Hobby's deployment rate limit is owner-wide, including all projects. Before a
batch, the workflow counts retained deployments from the last 24 hours and
requires room for the batch plus six repair deployments under the 100 limit.
It also caps this workflow's deployments at twelve per 24 hours. Failed and
canceled entries count conservatively. Deleted deployments and in-flight
external requests may be absent, so this is a safety budget, not an exact
provider rate-limit meter. Provider 429/error responses stop the workflow;
never delete entries to reclaim budget or repeatedly retry a limited request.
Build CPU/time, transfer, Functions and storage remain separate usage measures.

## Failure and recovery

- Before promotion: leave the current domain untouched. Inspect the recorded
  deployment ID. A timeout may have completed remotely; never blindly retry.
- After promotion: the run fails and records the previous deployment ID.
  Inspect the App and use Vercel Instant Rollback to its immediately previous
  eligible Production deployment when data/API compatibility permits it.
  Hobby does not promise arbitrary historical rollback. Verify the stable
  domain and reconcile the deployment record before the next release.
- A partially completed multi-App batch retains each App's actual state;
  there is no cross-project atomic switch. Do not continue a dependent App
  after a failure. Check compatible App/backend versions before approving.
- Storage migrations, worker/CSP changes, rendering performance, toolchain,
  production configuration and external services need their owner-specific
  gates and a data-compatible recovery plan before approval. HTTP smoke alone
  is insufficient for those changes.

## Security boundary

PR jobs use read-only tokens. Release triggers are manual and upstream-main
only, with a fixed dispatch SHA, global non-canceling concurrency and a
protected Environment. The privileged job installs no packages, builds no
App code and downloads no PR artifacts. First-party Actions are SHA-pinned;
checkout does not retain Git credentials. Inputs travel through environment
variables and are validated, never interpolated as shell programs. API clients
use fixed origins, reject redirects, bound timeouts and redact provider error
bodies. Production secrets are scoped to the single publication step.

The workflow, controller scripts and their dependency-free imports are trusted
release code and must be reviewed accordingly. Environment reviewers must
inspect their diff before approval; secret storage alone is not a security
boundary against a malicious change merged into trusted release code.

References:

- <a href="https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation" target="_blank" rel="noopener noreferrer">Automation bypass for protected deployments</a>

- <a href="https://vercel.com/docs/rest-api/deployments/create-a-new-deployment" target="_blank" rel="noopener noreferrer">Vercel deployment API</a>
- <a href="https://vercel.com/docs/deployments/promoting-a-deployment" target="_blank" rel="noopener noreferrer">Staged production promotion</a>
- <a href="https://vercel.com/docs/instant-rollback" target="_blank" rel="noopener noreferrer">Instant Rollback</a>
- <a href="https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments" target="_blank" rel="noopener noreferrer">GitHub deployment environments</a>
