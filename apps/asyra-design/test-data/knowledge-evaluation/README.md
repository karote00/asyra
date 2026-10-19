# Manual Domain Knowledge evaluation

> Current scope: offline Knowledge-to-capability corrections using saved 101 I/O. The commands and general cases below describe
> historical experiments and are not instructions to run them again. No model
> execution is currently authorized. Read the current checkpoint in
> `docs/ai/knowledge/plans/composable-domain-knowledge-v1-plan.md` and
> `docs/ai/knowledge/evaluations/2026-10-18-101-knowledge-design.md`. Any later
> authorized 101 run has a 600000 ms hard deadline from Send, not 15 minutes.

This runner uses a real local subscription and actual Design UI/tools. It is not
an automated model-quality test and is never run by ordinary tests or CI. The
analysis tests are deterministic and included in Design's `test:local` command.

## Current evidence-only verification

Run the permanent, deterministic suite without sending a model request:

```sh
yarn workspace @asyra/asyra-design test:knowledge-evidence
```

This runs actual Chromium recording/interruption and process watchdog fixtures,
plus controlled read-only session/checkpoint adapters, the actual browser
provider transport, and actual backend HTTP receipt admission. Provider streams
are deterministic fixtures; no model inference or Design AI session is started. Pure capture/protocol cases also run in `test:local`; the real-browser
capture suite has an explicit script. Historical model runners are not ordinary
tests and are not current execution instructions.

## Read-only verification of an existing saved drawing

Start the existing document, collaboration and App services in that order using
this worktree's `.env`. From `apps/asyra-design`, run:

```sh
node test-data/knowledge-evaluation/replay-saved-document.mjs \
  ../../tmp/knowledge-evaluation/<existing-run>/run.json \
  ../../tmp/knowledge-evaluation/<new-replay-directory>
```

The output directory must be new and project-local. This command shares the live
runner's `captureReload` and `captureSessionOnPage`; it does not invoke the model,
rebuild the drawing or rewrite the original evidence. Browser AI POST requests
are blocked and counted. Readiness awaits the actual runtime import and requires
both a connected session and a loaded current workspace. The enclosing deadline
owns cancellation and closes the isolated context. Never use an async function
as the truthy predicate of `waitForFunction` for this readiness check.

The replay checks root order and the saved durable receipt, captures a screenshot,
and records separate cleanup/failure outcomes. It does not compare every property,
prove Knowledge effectiveness or upgrade the original failed run to success.
Inspect the screenshot and clean up only the services started for the replay.

## Preparation for a later authorized 101 run

Use this isolated worktree, a new document and a fresh empty evaluation tool
library. Build framework/document/collaboration dependencies through existing
workspace commands. Preserve `.env`. Start document backend, collaboration, then
Vite on distinct project-owned ports; record PID/cwd/port and launch configuration.
`tmp/knowledge-services.json` contains these service records; the Vite entry has
name `vite` and this worktree's exact `apps/asyra-design` cwd. The runner checks the
live process cwd/command before Send and arms a process-identity guarded watchdog.
Do not use a shared user session. Do not include credentials in artifacts.

`architecture-101.json` fixes 600000 ms from Send. This overrides the shared
watchdog's default for other callers. The watchdog stops owned generation/browser
processes independently of blocked driver/browser RPC. Early collector failure
also stops generation. Successful terminal product completion disarms this cutoff;
failed, partial, cancelled or missing outcomes force-stop remaining owned work
and retain the actual stop reason. A terminal UI label alone does not prove that
the producer has exited. Native exit and signal status determine process cleanup.
post-generation capture and cleanup have separate deadlines. No automatic retry
or repeated drawing occurs after capture failure.

## Evidence and limits

`run.json` separates product outcome from each evidence/cleanup stage. Session
capture resolves one handle and checks identity/connection across asynchronous
boundaries; unavailable/replaced handles are explicit failures. Recovery uses a
fresh read-only page and preserves the original failure. Reload timeout closes
the owned context, including late context creation, and prevents subsequent
capture or comparison from being accepted. Reload comparison covers
root order and persistence generation/sequence, not every canonical property.
Checkpoint export uses the original receipt, exclusive creation and an abortable
stream deadline. Late responses cannot create evidence after timeout.

Video export is attempted independently of persistence success. Forced termination
retains available raw spool files, which may be truncated/unplayable. Provider
input/output files remain in their original recording directory; no completeness
is inferred from a directory existing. Expected model/library configuration is
labelled as declared, not verified effective provider configuration. Before any
future authorized run, verify service launch settings and isolated library state;
actual model/effort and payload completeness must also be checked against execution
records. No new model outcome or effective provider configuration was verified by
the evidence-only tests.

The runner records each canonical same-origin action-batch request's
`sourceRequestId`, including repeated attempts, and the configured recording
directory. Analysis requires an exact matching top-level drawing record for each
attempt. Nested provider calls follow source-request links and remain visible;
nearby unrelated calls never join the report. The public Runtime record parser
checks completion and sequence integrity. Missing stages, request identities,
records, model/effort mismatches or corrupted payloads block a complete report.
Successful UI completion must agree with completed top-level drawing provider
outcomes. Execution receipts on the same endpoint are identified by the canonical
receipt header and never counted as new model requests.
Absent payload references remain explicitly unavailable. Historical raw evidence
without these identities is not upgraded by guessing from timestamps.

The source snapshot includes tracked changes, untracked owner files and current
package build bytes; `.env`, secrets and mutable evidence/output directories are
excluded. Source drift before Send blocks execution; drift during evaluation fails
the source evidence stage. The snapshot and original failure evidence are never
overwritten. Source identity does not itself prove loaded-code or visual equality.

For later analysis use actual provider call IDs and payload references. Keep
material correctness, local preservation and query lifetimes separate from capture
success. `firstContentMs` is the first observed drawing bounds, not a GPU paint
measurement. Saved historical runs are diagnostic references, not a randomized
Knowledge/no-Knowledge causal control. Never run general cases or a control arm
under the current authorization.

The initial evaluation is documented in
`docs/ai/knowledge/evaluations/2026-10-18-design.md`. Its compact evidence and
unaltered comparison screenshots live in this directory's `evidence/` folder.

The scoped Flow Inspector project is `flow/`. Open it through the existing
Flow Inspector API or CLI; it is App-owned evaluation data, not a modification
to the Inspector implementation.


## Offline representation observations

`representation.mjs` is called by the saved-recording analyzer. It separates actual
Knowledge text deliveries from authored construction inputs, reports inline,
template and shared material usage and per-cell payload bytes, and retains call
status. Reference-only receipts do not count as a new text delivery. Missing
payloads remain unknown. None of these observations proves visual quality, agent
adoption or causal efficacy. No provider is invoked by this analysis.

The exact retained source excerpts under `evidence/architecture-2026-10-18/` are
historical input/output evidence, not the current Knowledge instructions. Formal
regressions replay discovery selectors and compile original versus template-based
paints through the current owners. Whole compiled output equality is the oracle;
object counts alone are not evidence of a quality or performance improvement.
