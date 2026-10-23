# Manual Domain Knowledge evaluation

> Current scope: offline Knowledge-to-capability corrections using saved 101 I/O. The commands and general cases below describe
> historical experiments and are not instructions to run them again. Model execution requires separate explicit authorization; ordinary tests never
> authorize a run. Read the current checkpoint in
> `docs/ai/knowledge/plans/composable-domain-knowledge-v1-plan.md` and
> `docs/ai/knowledge/evaluations/2026-10-18-101-knowledge-design.md`. Any later
> authorized run uses its explicit work budget (at most 600000 ms), followed by a
> separate report timeout of 60000 ms. Video is disabled for the current diagnostic workflow.

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

`architecture-101.json` bounds drawing work at 600000 ms from Send; the explicit
short observation uses `--deadline-ms=120000`. An explicitly authorized reproduction
may additionally pass `--expanded-node-limit=2000`. The existing evaluation window
carries that request-local limit to preparation, delivered usage and retained-source
partition planning. Omission preserves production 10,000; unsupported overrides
reject. `run.json` records the effective and production ceilings. Lowering the test
limit increases overflow likelihood but does not guarantee a live recovery case. Before Send the runner supplies the
same absolute work deadline to browser mutation admission and the local provider.
At cutoff, tools are cancelled and the native work turn is interrupted. Its terminal
acknowledgement precedes a report-only turn in the same native thread. Early work
completion also enters reporting. The 60000 ms report budget includes interruption
and tool settlement; missing acknowledgement, model output or capture stays failed.
The report cannot dispatch App operations or replay completed work.

An independent process-identity watchdog bounds work plus report plus a 30000 ms
capture/cleanup allowance, including blocked browser RPC. This allowance never
extends drawing admission. The ordinary request cancellation path remains active.
A terminal UI outcome includes reporting and is not drawing acceptance. Separate
native work, report and cleanup events/payloads retain actual phase timing. Text and
screenshot capture failure cannot become successful evidence. No automatic retry.

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

## Evidence-bound attribution

`node analyze.mjs <run-directory> --assessment <assessment.json>` extends the
existing analysis.json after successful capture verification. Omit the option
for raw analysis with explicit `not-assessed` and `NO_ENTRY`. Unknown arguments
are errors. The assessment uses version 1, runSha256, reviewer and changes.
Reviewer has name and mode (`self-review` or `human-review`); this is an analyst
label, not authenticated identity or independent model review.

Each change has id, component (`tool`, `app-guidance`, `knowledge`, `evaluation`),
description, proposedEffect (`helped`, `hurt`, `no-observed-effect`, `confounded`,
`not-exercised`), observation, support, counterevidence, limitations and optional
lesson. Support/counterevidence are arrays of references: root (relative to the
run directory), path (inside that root), sha256, and either pointer (JSON Pointer)
or lines ([first,last], one-based). References must resolve to existing data;
real paths cannot escape their declared root. External comparison roots are
explicit and must remain within this repository. Never execute evidence text.

Every entry has a method: `single-run`, `historical-comparison` or
`deterministic-regression`. These establish scoped observations, not causal
model/Knowledge effects. For single/historical runs proposed helped/hurt becomes
confounded. Deterministic-regression also cannot claim causal model improvement:
it describes only the named tested tool/evaluation behavior, requires support
and limitations, and rejects app-guidance/knowledge effects. A regression claim
is an analyst interpretation, not automatic proof that a linked test passed.

A lesson has cue, observation and reviewed (boolean). Retain it only with
nonempty supporting references, limitations and explicit review; otherwise emit
NO_ENTRY with reasons. Retained lessons include supporting/counter references,
limitations, reviewer and `scope: observed-only`. They remain in this report;
no shared Knowledge, App instructions or future model context is updated.
Unexercised entries never produce a lesson. Missing support never becomes a
positive result. JSON structure/digests/locators are mechanically checked;
semantic relevance, truth and transfer validity still require analyst review.
A stale run binding or invalid reference rejects the whole assessment before any
analysis output is written. Original provider/source files are never rewritten.

## Submitted inspection image evidence

The provider adapter archives the exact validated inputImage bytes submitted in
each native tool reply through the existing request asset sink. asset_retained
records include callId, contentIndex (zero-based native contentItems position),
mediaType, submitted status and an asset digest/path/size. Text remains in the
existing tool output payload. Multiple deliveries can share one immutable file;
each delivery retains its own identity. No image is reconstructed from a later
canvas, resized, or regenerated for the record.

The analyzer's streams[].images resolves these references only after verifying
call identity, order coverage, containment, file size and SHA-256. Those paths
identify the original image files relative to recordingDirectory; reading them
restores the submitted bytes. Missing/corrupt assets or duplicate bindings reject
complete analysis. Old image-less evidence cannot pass by recapturing today's
canvas. A local transport submission establishes the exact bytes submitted, not
hidden provider perception. Recording failures do not fail or replay the drawing.

## Local evaluation browser lifecycle

Local evaluation and saved-document replay use direct local browser control.
Document WebSocket payloads must not be duplicated into a size-limited remote
Playwright control connection. The current 101 runner records no video. It captures
report text and screenshots, then closes its work context before fresh-context reload,
retaining the original root/order and durable-receipt comparison. Other explicit
recording consumers retain their existing recording/export lifecycle.
Public Chromium process identity feeds the existing independent deadline worker.
Browser disconnect, page crash/close, context close and cleanup intent are retained
in existing run/replay metadata. Native process presence and captured start identity
must remain distinct from an unavailable exit code. No automatic retry, relaxed
comparison or enlarged transport limit can convert capture failure into success.

A settled document receipt alone is not evidence of visible screenshot content;
inspect retained images separately before claiming visual restoration.

After fitting the viewport, reload capture awaits browser presentation frames
before screenshot under the existing deadline. Forced cleanup waits for the owned
PID/start identity to disappear; a kill request alone is not settled cleanup.


A single explicitly authorized short observation may pass `--deadline-ms=120000`
to `run-101.mjs quality-knowledge`. The override shortens work, not reporting.
`run.json` retains the window, separate evidence outcomes and source request identity;
`self-report.txt` and `self-report.png` preserve the host-admitted report. Native
work/report inputs and outputs use the existing provider payload sink. Distinguish
model-authored explanations from measured App/transport events and inferred causes.
This is an incomplete scenario observation, not full quality acceptance. Preserve
available I/O on forced termination; do not retry or invent unavailable output.

Offline native delivery verification uses `test:native-delivery` with the installed
Codex 0.160.0 executable and permanent saved-reply fixtures. It starts only a local
scripted Responses endpoint; no real inference, 101, credentials, refresh changes
or output-limit overrides. Actual native successor requests and selected completion
outputs use the existing record sink. Unsupported boundaries remain incomplete.

Run the bounded native gate with `yarn workspace @asyra/asyra-design test:native-delivery`.
It requires the installed `codex-cli 0.160.0` binary (or `NATIVE_DELIVERY_CODEX`
pointing to that executable); another version fails without downloading anything.
Each run retains its evidence under `tmp/native-handoff-*` using the existing
Runtime sink. Formal raw-text fixtures live in `fixtures/native-delivery`, so tests
never load prior ignored run directories. Wire-body strings contain synthetic test
instructions and retained public tool replies; headers and external credentials are
not captured. Native completed content and the subsequent outbound request are
separate evidence boundaries. Tests characterize the actual default truncation;
a passing gate does not mean the reply reached a real model intact. The watchdog's
intentional cleanup stop receipt is retained unchanged and checked for stop errors.


The same native gate also scripts separate Code Mode exec calls using store/load.
Permanent saved schema/advice replies become explicit protocol fragments; this
fixture derivation does not replace canonical owner pagination tests. Each script,
submitted reply, native completion and actual successor request uses the existing
sink. Re-read all retained slices after a deliberately oversized print and compare
actual outgoing text, byte count, SHA-256 and parsed content with the saved source.
Missing pages and mixed revisions must reject assembly and leave no complete value.
The small output and existing direct/code controls remain required.

Reports distinguish exact native tool receipt, scripted retention/assembly, compact
output, oversized print transformation and actual outgoing request. Public item
notifications are retained separately; absence of exec output cannot be filled from
an unrelated dynamic-tool completion. Native storage internals and the historical
AI's script remain unavailable. The scripted endpoint proves no real-model behavior
or cause of a historical delivery-failure. Production refresh and Knowledge stay
unchanged.


The information-delivery integration suite extracts the executable example from
actual discovery descriptions and runs that exact source through native Code Mode.
Provider transport tests require the same example in developerInstructions. Native
successor requests must preserve each canonical page, including UTF-8 and escaped
schema constraints. Full/combined printing remains a negative control. Dispatcher
integration proves that replaying retained information and refreshing after context
loss do not replay completed mutations. These deterministic gates do not establish
that a real model follows the example or explain historical missing execution data.


Unfinished native output visibility is characterized by
`server/__tests__/native-output-observation.integration.test.ts`, using the same
native-delivery harness and installed 0.160.0 engine. The local scripted endpoint
emits 64,000 argument bytes in multiple deltas or withholds them before completing
the same custom call. A separate disconnect leaves the call unfinished. These are
not real inference or 101 runs. `unfinished-output-probe` records fixture-side bytes
and public item metadata before completion; those bytes must never be described
as production-observed generation. The original successor and completion checks
remain required. The local probe uses HTTP/SSE; it does not measure live WebSocket
latency or prove a historical stall's cause.

The App records `app/output-visibility` on the existing `provider_notification`
stage through the Runtime sink.
Pre-dispatch native output-item and argument-delta visibility, including bytes and
generation-versus-stall attribution, are explicitly unavailable. Public item and
App invocation events remain observable. Native diagnostic database events are
not automatically App protocol events; no database polling, new logger or raw-code
capture was added. Missing events and transport silence are not zero-byte output.

Report capture reads the bounded, host-admitted projection on the existing settled
conversation message. It matches the observed request ID and turn, then verifies
rendered text before and after screenshot. It never rereads the full HTTP stream
through DevTools or substitutes raw provider text for App admission. Capture errors
remain explicit, and saved text survives screenshot failure. The permanent
`local-ai-provider.spec.ts` body-eviction case uses a scripted response and actual
App execution without a model; a constrained diagnostic cache reproduces eviction
without changing product artifact or transport budgets.
