# Independent Project Runtime

Stage 2 owner: `@asyra/flow-inspector`. This extends the Flow Document Contract;
its admission, current writer, completion policy and canvas remain authoritative.
Publication is excluded. Node.js 24, macOS/Linux and node_modules installation are
the supported runtime. Built-in adapters target the existing Vitest 3.2.x and
Playwright 1.62.x contracts; no new runtime dependency is required.

## Project admission

`flow-inspector.config.json` has `schemaVersion: 1`, `projectId` and a relative
`flows` directory. The directory containing this file is the project root. An
explicit `--project` selects a directory or config file; otherwise search cwd and
its ancestors. Never discover Asyra defaults, Git metadata or global runners.
Reject unknown configuration fields, invalid identities, escaping paths,
symlinked project data and package installation paths as writable data targets.
Initialization creates a complete selected example only in unoccupied paths;
existing config, sources, tests and flow files are not overwritten.

Installed assets are resolved relative to this package, never consumer cwd.
Project-owned runner packages resolve within the selected project boundary,
including nested node_modules workspaces, and must match the supported major/minor.
Missing runners are actionable failures, not permission to install or use a global
or ancestor-repository dependency. The CLI and headless reads need neither runner.

## Portable producers

A portable criterion selector declares `producer: vitest|playwright` and an
`identity` JSON object with `file`, `title`, `project`, `config` and `cwd`.
Paths are project-relative; the title is the complete test title and project is
explicit (empty for an unnamed project). Exact identity includes runner and config.
Duplicate identities are ambiguous and cannot publish a guessed location.

A producer captures project identity, document revisions, criterion bindings and
explicit input fingerprints before execution. It publishes only completed matching
cases through the existing revision-checked writer. Empty, partial, ambiguous,
interrupted, changed-source or malformed results remain warnings; assertion
failures stay failed. A later complete matching selection replaces known warnings.
Unknown failures are retained at flow integration; unrelated success cannot clear
them. Native watch creates a fresh capture for each execution and publishes only
executed identities. Reads never watch source files or schedule tests.

The installed `run` command is an explicit action: resolve the configured local
runner, select exact file/title/project/config, discover the exact case without executing test bodies, then run structured argv
with bounded process ownership and publish current results. Discovery must resolve
one case; ambiguous file/title/project matches cannot start execution. Playwright
project dependencies are excluded from a selected action. Wildcard project names
are rejected because runner CLI project filters cannot represent them exactly. It does not change tests, mappings
or manual acceptance. The source-level Asyra producer remains its explicit
architecture projection adapter; both paths share the current writer and evaluator.
Reporters and receipt-based report ingestion provide test-once CI and native watch.
Receipts are current invocation handoffs, not mandatory archives or state authority.
A generic producer can use the public update API without a built-in runner.

## Headless and transfer boundary

`validate` checks structure; `evaluate` and `ci` evaluate the same current snapshot
used by the UI. Structured outcomes are `satisfied` (exit 0), `unsatisfied` (1),
`invalid` (2) and `awaiting-manual` (3). An explicit nonblocking manual gate returns
exit 0 while retaining `awaiting-manual`; it never changes a flow verdict. Any
failed, stale, blocked or missing automated prerequisite remains blocking.
No evaluation/export operation starts a runner, HTTP server or browser.

Current bundles contain version, project identity, full flow documents and only
referenced tool-owned attachment bytes/digests. No absolute source paths or histories
are required. Validate size, digest, identities and references before mutation.
Existing definitions and declared source revisions must agree; lower revisions
or same-revision differences conflict. Identical imports are idempotent. Import
is explicit trusted project data adoption, not authenticated remote approval.
Readers reject an in-progress external writer lock. A supported import preflights
all documents, writes under that lock and restores prior files on ordinary errors;
a process crash leaves the lock for operator inspection rather than exposing a
partially imported project as current. Project-owned attachments stay external
references and are never copied, read or removed by bundle transfer.

## Delivery acceptance

One actual tarball must pass isolated npm consumer scenarios with no source links,
private scripts or ancestor dependency resolution: manual, mixed, custom, Vitest
and Playwright; no Git, nested cwd/workspace, named projects, duplicate/regex titles
and spaces. Include offline fault publication, live startup, compact AI context,
real selected repair/rerun, restart, notes/manual acceptance, malformed data,
warning correction, source conflicts, cancellation and test-once headless CI.
Count runner invocations to prove read/evaluate/export do not execute tests.
Inspect the installed consumer UI and record source/tarball integrity. Keep the
existing Asyra projection and exact selection gates at the assembled checkpoint.
No registry writes, dependency upgrades, hosted team service or product feature
changes belong to this stage.

## Review corrections within Stage 2

Installed-consumer review verified that the CLI inherits the dashboard action's
execution identity and revision/binding, rather than publishing an unrelated run.
The formal action test first reproduced a permanently blocked panel and now
exercises actual preview/confirmation. Transfer race tests first reproduced newer
revision overwrite and mixed snapshot reads; import rechecks the full prior graph
under its lock and snapshot admission rejects changes during reads. Human summaries
strip terminal formatting and omit stacks while full diagnostics remain intact.

The assembled verification iteration keeps the same ten acceptance conditions.
Its remaining boundary is installed human-action settlement and restart: await
the rerun response and the persisted note editor, not a matching unsaved draft,
before stopping the server. The implementation owner remains
`present-flow-document`; the direct acceptance owner is
`flow-files/__tests__/installed.test.cjs`. Review confirms this tests persisted
current state without changing product semantics or adding a second completion
policy. Resume the installed gate after this oracle correction, then review only
the stage diff, direct consumers and remaining frozen gates. Already-passing
unaffected gates are retained.
