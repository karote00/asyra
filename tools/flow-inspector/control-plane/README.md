# Flow Inspector Core Proof

The existing Flow Inspector canvas verifies two real Factory flows: deferred publication and
cancellation after immediate publication. Six formal obligations map to three
concrete architecture steps shared by both flows. The living Phase 3/4 contract
is defined in [CORE_PROOF.md](../../../docs/ai/tools/flow-inspector/CORE_PROOF.md).

## Run Locally

Use the repository's declared Node.js 24 and Yarn 4.3.1 environment on macOS or
Linux. From the repository or this PR's worktree root, install the existing locked
dependencies if needed:

```bash
yarn install --immutable
FLOW_PROOF_URL=http://127.0.0.1:4318 node tools/flow-inspector/control-plane/cli.cjs serve
```

Open <a href="http://127.0.0.1:4318" target="_blank" rel="noopener noreferrer">the local catalog</a>.
Open <a href="http://127.0.0.1:4318/transaction-atomicity" target="_blank" rel="noopener noreferrer">Transaction Atomicity</a> to see its catalog,
seven architecture cards, connections, zoom, filters, and detail panel intact.

Short routes such as `/transaction-atomicity` and `/ai-drawing-performance` support
direct opening and reload. Old workspace hash links convert to their corresponding
short route; static files opened directly retain hash navigation. The Control Plane remains loopback-only. A future deployment can retain these
root-mounted routes by supplying the documented workspace base/path-routing
marker and route handling; uploading the static files alone does not enable
path routing. Public hosting and access control are outside this local proof.

1. Expand **Flow verification** in the existing detail panel. Select
   **Current source** and click **Run all flows**. Expect both flows and
   all six checks to pass.
2. Select **Inverse regression demo** and run again. Expect the commit flow to
   pass while cancellation fails `cancel.outcome` and `cancel.delivery`.
   Choose **Cancel an already visible change** under **Evidence on canvas** to
   see the two failed owner cards on the same graph.
3. Inspect a failed card and its contract, then select **Current source** and
   run again. All checks should recover. Earlier attempts remain selectable.
4. Right-click a mapped card (or use `Shift+F10`) and choose a linked flow to run
   its three obligations. The detail panel also provides **Verify linked flow**.
   Select the other flow to confirm it remains unverified for that attempt.
5. Expand **Captured source and recent attempts** to inspect source identity and
   select retained results. Mapping/architecture/configuration versions and the
   runner environment identify each attempt. Report and source-manifest links
   open the exact retained artifacts in another tab. Targets without a verification
   contract stay read-only.
6. Expand **Mapping review** and choose **Prepare mapping diff**. An unchanged
   checkout reports no changes. For a real test rename, update its `testName` in
   `packages/factory/flow-contracts.json` and the corresponding formal test title,
   then prepare again. Inspect the old/new binding, enter a reason, and accept or
   reject it. Verification refuses an unaccepted mapping. Acceptance starts a new
   mapping revision and requires fresh evidence; rejection keeps the previous
   accepted revision. Revert the proposed source edits before running that old
   revision again. Reviews and reasons remain available after reload.

All registered negative demonstrations run against the same six assertions:

| Scenario                | Deliberate violation        | Expected failed obligations         |
| ----------------------- | --------------------------- | ----------------------------------- |
| `inverse-regression`    | Corrupt inverse handoff     | `cancel.outcome`, `cancel.delivery` |
| `omitted-replay`        | Omit rollback replay        | `cancel.outcome`                    |
| `premature-publication` | Publish deferred data early | `deferred.delivery`                 |
| `forbidden-commit`      | Commit after cancellation   | `cancel.outcome`, `cancel.delivery` |
| `omitted-compensation`  | Omit shared compensation    | `cancel.delivery`                   |

Each negative demonstration transforms the isolated copy of the real Factory
implementation; it never edits your working source or weakens the assertions.
Each attempt has its own scenario, source digest, Git HEAD, audit, and raw report.
The digest includes uncommitted source and identifies a captured snapshot, not a
continuously watched checkout or deployed environment.

Use **Cancel run** to stop active verification and `Ctrl+C` to stop the server.
To use the CLI while the board is open, prefix a command with
`--url http://127.0.0.1:4318`. Both clients then use that server's action service
and store. Without `--url`, the CLI requires exclusive local store ownership.
Choose a free port for this tool; do not terminate another application's server.

## CLI and CI Proof

Periodic formal verification does not require a model or AI credentials.
An external CI agent may orchestrate supported commands, but GitHub agent setup
alone does not make the current macOS subscription adapter portable to CI.
Unattended AI repair, machine authentication and protected remote verification
remain separate integrations owned by the operator.

If a provider task stops with **Provider follow-up required**, save its audit
and candidate diff using the Board links. Check the provider's account usage
and service status; contact provider support for unexplained activity using
timestamps and task/attempt IDs, without credentials. Local IDs are not remote
request receipts. **Hand off to human** preserves manual review, not model
resumption. A recorded app-server interruption confirmation does not prove cloud
execution or billing settlement. Missing confirmation stays unknown. This
adapter has no remote receipt query after disconnect; preserve the unresolved
record and do not delete it or create a new store to bypass the dispatch block.

```bash
# Pass only when all six supported obligations pass.
node tools/flow-inspector/control-plane/cli.cjs verify

# Run the three obligations belonging to one supported flow.
node tools/flow-inspector/control-plane/cli.cjs verify deferred-publication

# Deliberately fail cancellation. An exit code of 1 is expected here.
node tools/flow-inspector/control-plane/cli.cjs negative

# Run a particular registered demonstration (expected exit code: 1).
node tools/flow-inspector/control-plane/cli.cjs scenario premature-publication

# Require baseline, all five precise negative failures, and baseline recovery.
# This command exits 0 only when the entire negative proof succeeds.
node tools/flow-inspector/control-plane/cli.cjs prove

# Attach to a running board without opening a second store.
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 status
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 verify

# The same prefix also works for these commands; replace ids with returned UUIDs.
node tools/flow-inspector/control-plane/cli.cjs show <attempt-id>
node tools/flow-inspector/control-plane/cli.cjs cancel <attempt-id>
node tools/flow-inspector/control-plane/cli.cjs mapping-diff
node tools/flow-inspector/control-plane/cli.cjs mapping-accept <review-id> "Reviewed test rename"
node tools/flow-inspector/control-plane/cli.cjs mapping-reject <review-id> "Keep current mapping"
```

The command exits nonzero for missing or malformed evidence, unknown mappings,
skipped obligations, runner errors, cancellation, and timeout. `prove` does not
accept an arbitrary failure as proof. CLI and board share the same action service.
Completed attempt records and copied inputs remain under `tmp/flow-inspector/runs/`.
They are local artifacts and are not committed or published.

## Formal Tests

```bash
node --test --test-concurrency=1 tools/flow-inspector/control-plane/__tests__/{contracts,snapshot,runner,evidence,store,service,server,mapping,cli,evolution,ci-context,ci-evidence,operations}.test.cjs
FLOW_PROOF_URL=http://127.0.0.1:4318 node --test tools/flow-inspector/control-plane/__tests__/board.test.cjs
```

The browser test uses the repository's existing Playwright harness and installed
Chromium. To use an already installed Chrome locally, add
`FLOW_PROOF_BROWSER_CHANNEL=chrome` to that command. No browser or dependency is
downloaded by the test. Use a free `FLOW_PROOF_URL` port for tests; they never
stop an existing listener. For example, use port 4319 while a board runs on 4318.
The test starts the actual server, runs real Factory checks, exercises the page,
and records desktop/mobile screenshots plus source identities under
`tmp/flow-inspector/visual-review/`.

CI runs the focused tests and `prove` directly in `validate`, without a wrapper
that masks failing assertions. The E2E job also runs the permanent browser test.
Required-check enforcement itself remains a repository setting.

## Boundaries

This is a trusted local development tool, with one bounded runner process group,
loopback access, per-start mutation capability, explicit cancellation, and durable
attempt identity. It does not sandbox hostile code. It supports these two flows;
arbitrary flow onboarding, autonomous execution/token controls, unconfigured external
mutations and shared team hosting remain outside this trial. The separately
activated bounded GitHub review is documented below. The Phase 4 CI
admission adapter is implemented; mandatory protected remote execution remains
blocked as described below.

The first local store trusts the checked-in mapping. Later test-name changes
require explicit review against the accepted revision. This policy cannot add,
remove, or weaken obligations, alter flow semantics, or accept a changed target
architecture. Such evolution uses the separate candidate/version review actions below. Format-1
historical attempts remain readable but do not gain format-2 provenance guarantees.

The static viewer and React workspace remain owned by
`tools/flow-inspector/workspace/`. Framework and App runtimes do not depend on this
tool, and this checkpoint does not change their package versions. The local
server composes its adapter into the existing target document; static and
standalone files do not load the adapter or require a server. No separate board
or replacement canvas is introduced.


## Phase 4 Operational Trial

Support is exactly the two Factory flows and six obligations above. Every command
also accepts the same `--url` prefix to share the running board's state. The server
selects `FLOW_CI_BASE` (default `origin/main`); HTTP callers cannot override it.
Run `git fetch origin main` before selecting a base. Local dirty snapshots remain
visible evidence and cannot become a protected integration result.

```bash
# A behavioral trial can pass while delivery stays blocked.
node tools/flow-inspector/control-plane/cli.cjs ci-trial
# Real inverse-regression demonstration: expected exit 1 and exact cancel failures.
node tools/flow-inspector/control-plane/cli.cjs ci-demo
# Recover all six obligations on the same captured source: expected exit 0.
node tools/flow-inspector/control-plane/cli.cjs ci-trial
# Strict delivery command: expected exit 1 until external protection is proven.
node tools/flow-inspector/control-plane/cli.cjs ci
node tools/flow-inspector/control-plane/cli.cjs shared
```

On **Transaction Atomicity**, expand **Flow verification**, then **Contract
versions and CI**. **Demonstrate CI rejection** uses the selected negative
scenario (inverse regression when Current source is selected). **Run CI aggregate**
recovers baseline evidence. Inspect the CI blockers and envelope link; **Retry
selected run** preserves mode/scenario and creates a new attempt. Request identity
replay through the API still returns the original attempt. The existing canvas,
connections, zoom, navigation and detail panel are retained.

**Shared baseline view** reports goals, remaining obligations and implementation
work, confirmed failures, potential impact, source baseline and observation time.
**Report work** is an explicit author report; even complete work cannot set tests
or delivery green. **Open shared snapshot** exposes the same immutable projection
at `GET /api/shared`. Save that JSON to share an observation; it is a trusted local
snapshot with a fingerprint, not a signed hosted team service. Polling does not
recapture source or recompute evidence.

### Version and retirement review

1. Change the contract/test source in the feature checkout, then run `candidate`.
   Candidate evidence is never current accepted conformance.
2. Run `contract-diff <attempt-id> [relations.json]`, or **Review candidate**
   in the panel. Rename/move retain stable obligation ids; content changes need
   review and fresh proof. Missing selectors and unknown evidence block acceptance.
3. Split/merge use explicit relations, for example
   `[{"kind":"split","before":["old.case"],"after":["new.a","new.b"]}]`.
   The board has the same relation type and predecessor/successor controls.
4. Review the exact base and candidate and run `contract-accept <review-id>
   "reason" [retirement.json]` or `contract-reject <review-id> "reason"`.
   Retirement JSON is the exact array of removed ids, e.g. `["old.case"]`.
   The separate `retire-contract` capability is required for removal. Local trusted
   operators hold it; future untrusted callers must not be granted it implicitly.
5. Every accepted version and decision survives restart, with previous obligations
   readable in history. Removal is never inferred from absent tests. Accepted
   changes invalidate local and imported CI success, including unchanged contract
   digests with a new accepted revision. Re-run proof after acceptance.

### CI evidence admission

`ci-trial` in the existing `validate` workflow executes real all-flow cases at the
checked-out integration revision. `FLOW_CI_EMIT_EVIDENCE=1` emits a gzip/base64
`FLOW_CI_ENVELOPE=` log record containing the exact raw report and source manifest.
This transport adds no provider success authority. A green `validate` is not a
protected `flow-contract-aggregate` check.

The bounded adapter admits one independently registered delivery context per
server start. Supply `FLOW_CI_ADMISSION` as a repository-local JSON path containing
`{ "expected": ..., "accepted": ... }`. `accepted` is the admitted contract from
the trusted Git base (including its definitions); `expected` is independently
verified repository/base/head/integration, runId/attempt, source/configuration/
lockfile/policy digests and optional live protection observation. The permanent
`operations.test.cjs` demonstrates the exact schema and ingestion/replay behavior.
Do not build this trusted file by copying the candidate envelope's claims.

Run `ci-ingest <envelope.json>` or POST `{ "envelope": ... }` to `/api/ci/ingest`
with the server's capability. The configured run identity, raw assertions,
complete accepted inventory and artifact fingerprints must agree. Exact replay
returns the original record; conflicts and old attempts are refused. Result and
audit persist atomically. `GET /api/ci/<id>/artifacts/report` and `/envelope` verify
the retained artifact fingerprint. A changed accepted version invalidates the
imported result. Without independently configured admission, ingestion refuses;
without proven protection, admitted evidence still has delivery **blocked**.

This release implements neither GitHub webhook registration nor remote workflow
dispatch from a card. Card CI actions execute the same local aggregate trial.
Remote automatic transport and a protected issuer must be connected and verified
before the Phase 4 mandatory-CI acceptance criterion can close.

### GitHub Enforcement Gap

Observed on 2026-09-07 for `karote00/asyra` main: classic branch protection returned
404; effective ruleset `11441653` (`protect-main`) is active and contains deletion,
non-fast-forward and pull-request rules, with no required status checks. This
personal public repository therefore does not currently enforce the proposed
aggregate. Recheck the live state with:

```bash
gh api repos/karote00/asyra/rules/branches/main
gh api repos/karote00/asyra/rulesets/11441653
gh api repos/karote00/asyra/branches/main/protection
```

Necessary external work, requiring separately authorized repository/provider
administration:

- Select an independently protected verifier source: an available organization
  required workflow pinned to a reviewed source, or a dedicated trusted GitHub
  App check issuer. Confirm product/account availability before selection.
  A candidate-editable Actions workflow with the same check name is insufficient.
- Register `flow-contract-aggregate` as required, bind its expected issuer, require
  up-to-date integration, and protect verifier/assertion/policy changes with
  independent review. Bootstrap the accepted verifier revision explicitly; this
  PR changes gate files and cannot approve its own policy update.
- Connect trusted remote execution/ingestion without exposing issuer credentials
  to candidate code. Independently bind base, PR head, actual merge/integration
  revision, raw case artifacts, verifier version and live protection observations.
- Exercise a real PR that removes an obligation, weakens the workflow, spoofs a
  green provider result, uses stale integration evidence, and contains the actual
  runtime regression. Each must block merge. Restore the correct source and prove
  all supported flows pass at the exact integration revision.

Relevant authorities: <a href="https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks" target="_blank" rel="noopener noreferrer">GitHub required-check behavior</a>
and <a href="https://docs.github.com/en/enterprise-cloud%40latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets" target="_blank" rel="noopener noreferrer">available ruleset protections</a>.

On 2026-09-08 the user accepted closeout of the local implementation and UX,
while explicitly deferring the GitHub enforcement work above to avoid disrupting
concurrent projects and merges. The
[completed local record](../../../docs/ai/tools/flow-inspector/plans/completed/flow-inspector-phase-4-local-implementation-closeout.md)
records that boundary. The combined plan retains the unfulfilled mandatory-CI
criteria as deferred follow-up. Delivery remains unproven/blocked; this decision
does not weaken evidence admission or enable Phase 5/6. No GitHub protection,
workflow enforcement, version, tag or release is changed by closeout.

## Phase 5 Local Agent Trial

### Optional real-provider integration - bounded Sol acceptance

The board now distinguishes deterministic demonstration from an explicitly
authorized provider. An existing login alone never enables the provider option.
Offline adapter tests and no-model app-server preflight are reproducible without
consuming subscription quota. The user-authorized `gpt-5.6-sol` trial is recorded
in the [bounded completed record](../../../docs/ai/tools/flow-inspector/plans/completed/flow-inspector-phase-5-sol-local-integration-closeout.md).
Future provider execution still requires an explicit model, credential source
and usage allowance.

After that decision, create a non-secret authorization JSON inside the checkout:

```json
{
  "id": "<fresh UUID>",
  "actor": "local-developer",
  "adapter": "codex-app-server",
  "model": "<explicitly selected model>",
  "billing": "chatgpt-subscription",
  "maxRequests": 12,
  "expiresAt": "<explicit authorization expiry in ISO 8601>"
}
```

Start the local service with `FLOW_AGENT_AUTHORIZATION` pointing to that
repository-relative file, `FLOW_AGENT_EXECUTABLE` pointing to the approved
installed app-server binary, and `FLOW_AGENT_CREDENTIAL_FILE` pointing to the
existing credential file. Never put credential values in the authorization,
command line, task objective or source. The server creates an isolated transport
home and a read-only reference; OS containment prevents changing the original
credential. Keyring-only authentication and failed refresh under read-only
credentials are unsupported and must fail closed, without switching billing mode.
No additional package or CLI installation occurs. The inspected local interface
was Codex 0.153.4; PATH's older 0.40.0 CLI has no app-server support.

Choose **Authorized real provider** on the original supported step and delegate
the task. CLI/API requests use `adapter: "provider"`, `scenario: "task"`, and
`providerAuthorizationId` matching the service authorization. Resume keeps the
same task and uses scenario `task`; the adapter receives the previous verification
findings. The model emits only broker JSON, never direct source or shell effects.

The task panel and task JSON show each reserved adapter turn, owning attempt, terminal
observation and provider-reported tokens separately from unknown actual token
usage and cost. Reservations are consumed even on errors, missing usage or
interruptions. The adapter-turn ceiling (`maxRequests`) applies across tasks sharing that authorization in
the store, not merely one attempt. Internal HTTP/SSE requests and retries are
not independently counted or hard-limited: this installed app-server rejects
overrides of its built-in OpenAI provider. In-flight cancellation awaits local process
settlement, but does not promise remote computation or billing stopped. This
ephemeral interface has no independently queryable receipt: unresolved remote
requests or missing usage block further provider dispatch, including new tasks;
human handoff preserves the same evidence and candidate. No manual reconciliation
override claims settlement. Credential files, provider runtime directories and
temporary references are excluded from snapshots and package archives.

Run reproducible offline tests with:

```bash
node --test --test-concurrency=1 tools/flow-inspector/control-plane/__tests__/{agent-contract,agent-provider,agent-transport,agent-task,agent-verifier}.test.cjs
```

The real app-server preflight test sends only initialization, account status and
empty thread setup, with no credentials and no model turn. It is not real agent
acceptance. Keep live evidence, including a meaningful source change, failing
retained verification and correction, separate from these deterministic tests.

Activated independently on 2026-09-08 under
[Local Agent Execution](../../../docs/ai/tools/flow-inspector/AGENT_EXECUTION.md).
The earlier Phase 4 closeout did not activate agents; this later user decision
permits the bounded local trial while keeping all GitHub enforcement gaps open.

The executable adapter in this trial is a **deterministic demonstration**, not a
language model. It makes actual isolated source edits and runs real Factory
assertions. No provider, credentials, paid usage or external agent CLI is invoked.
Real provider selection and actual backend acceptance remain unfinished.

Start the server with `FLOW_PROOF_URL` as above. On **Transaction Atomicity**:

1. Select **Finalize transaction state**, expand **Flow verification**, then
   **Delegate selected step - local agent**. Enter the objective and exact allowed
   runtime files. The trial defaults to `packages/factory/src/data-transact.ts`.
2. Choose **Conforming change or correction** and **Delegate selected step**.
   The demo adds a reviewable comment to the isolated source. Expect execution
   `completed`, verification `passed`, work `needs-review`, delivery `not-delivered`.
   The accepted-source badges remain unchanged.
3. Choose **Inverse regression** and **Resume selected task**. The same generic
   replacement broker changes the actual inverse expression; `cancel.outcome`
   and `cancel.delivery` must fail. Choose correction and resume again. All six
   obligations recover, using the same cumulative three-attempt budget.
4. Start a separate **Scope refusal** demonstration. Its shell request is denied
   before execution. **Hand off to human** retains the contract, source, budgets,
   failures and audit. A new task is a new explicit human assignment; agents have
   no task-creation capability and cannot reset budgets by creating tasks.
5. Start **Tool limit** with two calls: the third read is refused. Start **Stall**
   and use **Cancel task**, or set a short elapsed limit to observe timeout.
   Stop, revoke, reload and select retained tasks. Resume preserves consumption;
   exhausted or revoked tasks cannot restart. Closing the service preserves
   partial work without applying it to your checkout.
6. **Review exact source changes** opens digest-checked before/after text.
   **Open task evidence and audit** includes task/attempt identities, source
   manifests, actual case results, report fingerprint and local artifact paths.
   Human review and any subsequent source application remain separate actions.

### Shared task API and CLI

All mutations use the existing loopback capability and local human actor.
`GET /api/tasks/<uuid>` reads the retained task, `/changes` reads exact candidate
changes, `POST /api/tasks` creates one assignment and
`POST /api/tasks/<uuid>/control` takes `{ "action": "cancel" }`, `stop`, `handoff`,
`revoke`, or `{ "action": "resume", "scenario": "repair" }`.
`GET /api/state` includes recent task summaries without recapturing source.
Only trusted service composition can register adapters or execution boundaries;
HTTP requests cannot select executable paths or grant capabilities.

Save a request JSON inside the repository. Obtain `contractDigest` and `revision`
from `/api/state`'s `contract.digest` and `mapping.revision`, respectively:

```json
{
  "requestId": "00000000-0000-4000-8000-000000000005",
  "stepId": "finalize-transaction-state",
  "objective": "Review inverse restoration against retained obligations",
  "allowedFiles": ["packages/factory/src/data-transact.ts"],
  "adapter": "demonstration",
  "scenario": "repair",
  "contractDigest": "<current accepted contract digest>",
  "revision": 1,
  "budgets": { "elapsedMs": 60000, "toolCalls": 20, "attempts": 3 }
}
```

Use a fresh UUID for a new human assignment; exact request replay returns the
existing task. These commands attach to the running board:

```bash
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 task-start tmp/task-request.json
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 task-show <task-id>
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 task-wait <task-id>
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 task-resume <task-id> regression
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 task-changes <task-id>
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 task-cancel <task-id>
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 task-handoff <task-id>
```

Direct CLI task-start/resume waits for settlement before releasing store ownership.
`task-wait` exits nonzero unless verification passed; a successful cancellation or
handoff command only acknowledges that action. Task records and isolated source
remain under `tmp/flow-inspector/runs/tasks/<uuid>/`.

### Measured guarantees and remaining boundaries

Supported source execution is macOS with the already installed `sandbox-exec`,
Node 24 and locked Vitest. Linux/Windows refuse task launch; Linux CI
runs portable contract/runtime tests and explicitly skips macOS OS integration.
Local macOS tests are required for containment acceptance, separately from PR CI.
Final candidate evidence identifies `macos-sandbox-no-fork`; earlier local trial
artifacts labeled `macos-sandbox` retain their original values and do not prove
the final no-fork boundary.
No package, environment tool, browser or provider is installed by these actions.

The broker permits only bounded reads/replacements/finish. Verification denies
network, shell and all child-process creation, including detached Node successors.
Vitest runs in one sandboxed Node process with one worker thread and native Node
24 TypeScript transformation; source/assertions are OS read-only. Only attempt scratch and
report output are writable. Runtime directory metadata/listings, ancestor package
metadata, required system libraries and localhost resolver files are readable;
this is not a promise to hide all host metadata. Ambient secrets are not inherited.
Elapsed time, tool calls, attempts and service concurrency are enforced. CPU,
peak memory, token and cost hard limits are unsupported; token/cost values are
unknown and admission rejects requests requiring them.

This is **not an independently protected verifier**. Tests and candidate runtime
execute in a local test process; these cases do not prove tamper-proof evidence
against arbitrary hostile JavaScript or the OS account owner. A passing candidate
requires human review and never grants accepted-baseline, merge or publication
authority. Stronger verifier/issuer guarantees remain in the deferred Phase 4
requirements and cannot be inferred from this sandbox trial.

Run the permanent portable and OS cases, then the original board suite:

```bash
node --test --test-concurrency=1 tools/flow-inspector/control-plane/__tests__/{agent-contract,agent-task,agent-verifier}.test.cjs
FLOW_PROOF_URL=http://127.0.0.1:4319 FLOW_PROOF_BROWSER_CHANNEL=chrome node --test tools/flow-inspector/control-plane/__tests__/board.test.cjs
```

Browser artifacts include exact task state, regression/recovery details and narrow
handoff screenshots under `tmp/flow-inspector/visual-review/`. There is no claim
of saved supervision time or reduced cost without a measured comparison period.


### Replay retained real-provider acceptance without model usage

After the authorized task has completed its failure/correction and cancellation
checkpoints, the formal browser replay reads retained server evidence only:

```bash
FLOW_PROOF_URL=http://127.0.0.1:64225 \
FLOW_PROOF_BROWSER_CHANNEL=chrome \
FLOW_LIVE_PROVIDER_TASK_ID=4ef0b75b-ac23-43a0-8de7-4d4900daa007 \
FLOW_LIVE_PROVIDER_CANCEL_ID=34586650-4fc6-4fb9-9368-f2a3e41b74ca \
node --test --test-name-pattern='retained live provider evidence' tools/flow-inspector/control-plane/__tests__/board.test.cjs
```

This requires the original retained task store and a running local server; fresh
clones do not contain live records or credentials. The test validates the two
attempts, all six obligations, review-only candidate source, unknown cancelled
usage, Board/API/CLI identity and unchanged request counts, then saves screenshots
and `review.json` beneath `tmp/flow-inspector/visual-review/provider-live-*`.
It does not dispatch, retry, reconcile or cancel provider requests. Ordinary CI
skips this explicitly selected live-record replay and runs offline contracts.

### Verification panel readability

All verification disclosures share one responsive presentation: separated
section headers, full-width labeled controls, wrapping action groups and
readable source/status blocks. This presentation does not alter operation
permissions, evidence, task state or baseline acceptance. The formal Board
readability case checks desktop and narrow panels and visits every catalog
entry; it never dispatches a model request.

Disclosure titles remain unfilled on pointer hover. Keyboard focus retains a
visible outline; current-page, selected-card and failure indicators continue to
communicate their existing states. Standalone entries embed the same viewer style.

## Bounded GitHub candidate review

The [PR Review contract](../../../docs/ai/tools/flow-inspector/PR_REVIEW.md)
selects one local human and one GitHub repository. Use installed authenticated
`gh`; no provider authorization or model request is needed. The service selects
the destination, never the candidate or HTTP request:

```bash
FLOW_PROOF_URL=http://127.0.0.1:4318 \
FLOW_REVIEW_REPOSITORY=karote00/asyra FLOW_REVIEW_BASE=main \
node tools/flow-inspector/control-plane/cli.cjs serve
```

Use a free port and preserve every other worktree/server. Create a deterministic
candidate using the existing demonstration controls, or select a retained task
whose captured inputs still match the base. A demonstration is not model evidence.
Do not delete an unresolved provider record or create a new store to unblock it.
GitHub review configuration grants no provider dispatch authority.

1. Select **Finalize transaction state**, open **Flow verification**, and choose
   the existing candidate under **Retained step tasks**.
2. Open **Candidate GitHub PR review** and **Prepare PR preview**. The broker
   validates source, all retained local obligations, accepted revision, a clean
   checkout and the remote base's captured inputs. Preparation creates no remote
   objects. A differing source closure or dirty checkout refuses delivery.
3. Review the exact repository, base SHA, branch, all delivery files, title and body.
   The trusted owner prepares an `@asyra/factory` patch Changeset separately
   from candidate source evidence. Its package ownership, reason, exact content
   and metadata validation appear in **Trusted owner Changeset**. Only existing
   Factory runtime candidates are supported; requests cannot select arbitrary
   packages, release types, summaries or paths. Metadata changes invalidate confirmation.
   Open the frozen source diff and local evidence links. Check the explicit
   confirmation only when this exact preview is approved, then select
   **Create confirmed PR**. Branch and PR creation stay in the trusted
   adapter. No source is applied to the checkout.
4. **Refresh GitHub review** reads the current PR and HEAD-bound checks.
   `submitted-for-review`, local verification and GitHub checks are separate;
   closed, merged and changed HEAD observations never accept a baseline.
5. An uncertain timeout stays uncertain. Refresh queries the deterministic branch
   and PR identity; a missing result cannot prove failure and cannot authorize
   another create. Definite no-effect authentication/permission/rate-limit errors
   allow an explicit confirmation retry after the operator resolves the cause.

The same capability and durable record serve Board, API and CLI:

```bash
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 pr-prepare <task-id>
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 pr-show <task-id>
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 pr-confirm <task-id> <preview-digest> confirm
node tools/flow-inspector/control-plane/cli.cjs --url http://127.0.0.1:4318 pr-refresh <task-id>
```

`GET /api/tasks/<uuid>/review` returns the retained record without GitHub I/O.
`POST` at the same path accepts `{action:"prepare"}`, `{action:"refresh"}` or
`{action:"confirm",previewDigest:"...",confirm:true}`. Unknown fields reject.
No repository, base, command, credential or candidate path can be supplied there.
Records and audit live in the existing store's `reviews/` directory. Ordinary
reads reuse admitted records; explicit refresh does bounded GitHub reads. Large
truncated tree/check inventories fail visibly rather than pretending completeness.

Run `pr-review.test.cjs`, `github-delivery.test.cjs`, `operations.test.cjs` and
`board.test.cjs` under the existing formal harness. Offline GitHub transports
are fixtures; they do not establish live GitHub acceptance. The live acceptance
case requires a separate exact preview and user confirmation. Required-check
protection, independent verifier/issuer, model reconciliation, ticket/team work,
hosting and standalone dynamic installation remain deferred. The package records
a patch Changeset outside the Framework bulk-release allowlist.
