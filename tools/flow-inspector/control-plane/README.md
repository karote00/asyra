# Flow Inspector Core Proof

The existing Flow Inspector canvas verifies two real Factory flows: deferred publication and
cancellation after immediate publication. Six formal obligations map to three
concrete architecture steps shared by both flows. The bounded Phase 3 contract
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
node --test --test-concurrency=1 tools/flow-inspector/control-plane/__tests__/{contracts,snapshot,runner,evidence,store,service,server,mapping,cli}.test.cjs
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
arbitrary flow onboarding, protected accepted-base CI comparison, remote CI ingestion, agent
execution/token controls, Jira/GitHub actions, and shared team hosting remain in
the later plans.

The first local store trusts the checked-in mapping. Later test-name changes
require explicit review against the accepted revision. This policy cannot add,
remove, or weaken obligations, alter flow semantics, or accept a changed target
architecture. Such evolution needs the separately scoped Phase 4 policy. Format-1
historical attempts remain readable but do not gain format-2 provenance guarantees.

The static viewer and React workspace remain owned by
`tools/flow-inspector/workspace/`. Framework and App runtimes do not depend on this
tool, and this checkpoint does not change their package versions. The local
server composes its adapter into the existing target document; static and
standalone files do not load the adapter or require a server. No separate board
or replacement canvas is introduced.
