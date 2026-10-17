# Author a flow document

This public contract is shared by the installed CLI, Node API and dashboard.
See the [package guide](../README.md) for installation, templates, native reporters
and headless CI. npm publication requires separate approval.

A project owner, developer or instructed Agent writes `*.flow.json` files using
[flow.schema.json](flow.schema.json). One directory is one project. Use stable
project/flow/node/criterion identities; titles may change. `definition` describes
tasks, responsibilities, criteria, prerequisites and actions. `current` describes
only current evidence, progress and notes. `revision` protects supported writes
against concurrent or old results. No Git repository or testing system is required.

Start with [manual.flow.json](examples/manual.flow.json) or
[mixed.flow.json](examples/mixed.flow.json).
[feature.flow.json](examples/feature.flow.json) adds dependent delivery work and
whole-feature manual acceptance; it is covered by the formal policy tests. Keep authored files in your project,
not in the installed tool directory. Do not copy current acceptance from another
project. Initialize a config with the installed CLI, then validate and inspect:

```sh
npx flow-inspector validate
npx flow-inspector context checkout review
npx flow-inspector serve
```

The human dashboard shows task status, criterion progress and applicable actions
at the top of the panel. Manual decisions require an explanation. Notes can be
edited or deleted and do not change acceptance. Full technical context is folded.
The context command returns current error, declared failure owner, available
specification and implementation references and configured rerun scope in one call.

## Write current evidence

Custom tools may write a valid JSON document themselves, or call
`openProject(directory).update(flowId, request)` from `require('@asyra/flow-inspector')`. The command
`flow-inspector update <flow-id> <request.json>` uses the same boundary.
Start from the current `revision` and the selected criterion `binding` returned
by context. Manual criteria also bind to same-node automated observations.

An observation request has `expectedRevision`, `kind: "observation"` and `value`:
`nodeId`, `criterionId`, `kind`, `status`, `binding`, `actor`, `summary` and `at`.
Automated observations also identify `executionId` and `caseId`. Automated status
is `passed`, `failed` or `incomplete`; manual status is `accepted`, `rejected` or
`reopened`. Kinds must match the declared criterion. Use `kind: "observations"`
with `values` for an atomic batch. Reading never runs a test. A zero process exit
without published evidence cannot mark work done.

`note`, `note-delete`, `progress`, `source` and `warning` requests update only their
current field. Source changes invalidate associated acceptance. An old revision
conflicts; reload and reassess instead of blindly retrying an old result. Direct
writers must coordinate their own writes and publish complete files atomically.
The helper does not make externally overwritten file contents recoverable.

A command action supplies structured `argv`, project-relative `cwd`, and exact
`criterionIds`. The dashboard previews it and requires confirmation. The action
receives `FLOW_FILE_DIRECTORY`, `FLOW_ID`, `FLOW_NODE_ID`,
`FLOW_EXPECTED_REVISION`, `FLOW_BINDING` and `FLOW_EXECUTION_ID`.
[custom-check.cjs](examples/custom-check.cjs) is an executable generic-producer
example; the same contract can receive translated pytest, Jest or other results.
External actions provide instructions instead of executable argv. Report text
never becomes an executable command. This is a trusted local project tool, not
a sandbox for hostile commands or an authenticated team approval service.

## Completion and file changes

All required criteria and applicable dependencies must be satisfied before a task
is done. Feature completion also requires flow-level criteria, selected through
the reserved node ID `integration`. Required nodes are included automatically;
optional nodes can still be explicit prerequisites. Set `applicable` to `null`
when a branch has not been decided; unknown applicability blocks completion.

Unrelated nodes do not reset acceptance. Changing a responsibility, declared
source or prerequisite acceptance invalidates affected downstream decisions.
Manual-only work needs neither code references nor source fingerprints.

The dashboard observes files and refreshes without reload; it schedules no tests.
Results written while it is closed are loaded on startup. Broken, unsupported or
removed files make current state unavailable instead of retaining a green verdict.
Test watch belongs to the test producer, which publishes only executed results.
There are no per-stage/run history files. Keep only bounded current evidence;
external Git/CI retention is optional and not a runtime dependency.

## Transition an existing Asyra checkout

Create a request JSON with `projectId` and `manifestPaths`, naming existing proof
contracts. Run `cli.cjs migrate <empty-flow-directory> <request.json>` from the
project root. This explicit transition reads only the old valid current
projection, preserves the architecture, and leaves old archives untouched.
Projection rejects changed architecture or changed declared source evidence rather
than relabeling old outcomes as current; rerun the affected source before projecting.
Inspect the projected current results before switching your normal dashboard to
`cli.cjs serve <flow-directory>`. Ordinary flow reads never consult the archives.

Set `FLOW_FILE_DIRECTORY` to that directory for the existing Vitest/Playwright
producer invocation, including when Inspector is closed. The producer then
publishes current files instead of appending old observation records. Do not run
both result publication paths for the same invocation. Configured selected reruns
use that same directory automatically. Unknown warning scope remains visible;
only complete matching coverage can replace a known discovery warning.

An abandoned `.writer-lock` requires checking that no writer remains before
removal. This local lock is coordination, not a history store or team service.

## Supported producers and limits

Stage 1 reuses the repository's Vitest 3.2.7 and Playwright 1.62.1 owners for Asyra
mapping and exact selected execution. It does not auto-discover contracts in
foreign projects; use the installed portable reporters for those projects. Generic JSON writers
and manual-only documents already use the public format without these runners.

The directory allows at most 1,000 flow files, 4 MiB per file and 32 MiB total.
Schema limits also bound arrays and text. Observation and warning `details`
accept raw diagnostic strings up to 1 MiB each (including empty strings); the
4 MiB document limit still applies. Producers keep summaries short and retain
complete messages and structured failure diagnostics in these details. Current tool-owned attachments are
content-addressed in `.attachments/`, up to 64 MiB each and 256 MiB per producer
publication. Replaced references are removed only when no current observation
uses them; project-owned files are never removed. Cleanup errors explicitly report
that the current update was saved. Retain optional external CI archives separately.

Full `/api/evidence?flow=<id>&node=<id>` includes current observations, attachments,
notes and full errors. Compact context reports truncation and links to it. The
local service does not serve arbitrary project files; attachment paths are relative
to the selected flow directory for tool ownership or the project for project ownership.

Node.js 24 on macOS/Linux is the initial source runtime. Local actions are trusted
project commands, not a security sandbox. Local actor labels are not authenticated
team identities. Only explicit declared source updates invalidate acceptance;
merely editing source without publishing a new declared revision cannot be detected
by a flow-file-only reader. Unknown warning scope needs an explicit authored
correction; it cannot be automatically retired by an unrelated passing test.
