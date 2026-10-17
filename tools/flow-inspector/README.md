# Flow Inspector

Flow Inspector reads project-owned JSON flow files, presents a human task board
and evaluates the same current contracts in headless CI. It does not require Asyra,
Git, a test runner, an AI provider or an always-running server. Tests, manual
acceptance, notes and explicit actions share one revision-checked current state.

## Install and start

The supported runtime is Node.js 24 on macOS/Linux with node_modules installation.
Install `@asyra/flow-inspector` in your project. For an unpublished candidate use
`npm install /path/to/candidate.tgz`. This source change does not publish a release.

```sh
npx flow-inspector init --template manual --id my-project
npx flow-inspector serve
```

Open the URL printed by `serve`. It binds loopback only. Use `--url
http://127.0.0.1:4320` to select another explicit port. An occupied port fails; it
does not take over another process. The selected card exposes human actions first
and folds technical evidence. Rerun previews the exact action and requires
confirmation. Commands execute locally with your account's permissions; inspect
project-authored actions before confirming them.

`flow-inspector.config.json` selects the project identity and data directory:

```json
{ "schemaVersion": 1, "projectId": "my-project", "flows": "flows" }
```

Commands discover this configuration from cwd upward, or accept `--project
/path/to/project`. Paths inside the config and flow files are relative to that
project. Nested workspace cwd does not change the project identity. Initialization
refuses to overwrite existing files or mix examples into an existing flows directory.
Use the public [authoring guide](flow-files/README.md) and
[JSON schema](flow-files/flow.schema.json) to write your own contracts. Humans or
agents author definitions; producers update current evidence. No test framework is
required. Tests never define feature completion by themselves.

## Templates and producers

`init --template manual|mixed|custom|vitest|playwright` creates a complete example.
Manual needs only this package. Custom and mixed include `flow-example/check.cjs`,
which publishes its own verdict through the public API. Run it from the project
root; it also works through the card's explicit action.

Built-in runners must be installed inside the selected project boundary: Vitest
3.2.x or Playwright Test 1.62.x. Inspector never installs runners or uses a global
or ancestor-repository fallback. The built-in examples use named project `example`.

```sh
npx flow-inspector run checkout review check
npx flow-inspector context checkout review
```

A portable automated selector contains `producer` and an `identity` JSON string:

```json
{"producer":"vitest","identity":"{\"file\":\"flow-example/feature.test.mjs\",\"title\":\"adds [two] + values\",\"project\":\"example\",\"config\":\"flow-example/vitest.config.mjs\",\"cwd\":\".\"}"}
```

Titles include the complete describe/test chain, joined by spaces. All five
identity fields are explicit; an unnamed project uses `""`. Inputs on the action
must include the implementation, test and configuration dependencies relevant to
that criterion. Inspector does not guess source ownership or expand an unrelated
file into a test suite. Exact selected runs pass structured argv, not shell text.

For an existing runner execution, add the installed reporter instead of scheduling
another run. Vitest configuration:

```js
import FlowReporter from '@asyra/flow-inspector/flow-files/reporters/vitest.cjs'
export default {
  test: {
    reporters: ['default', new FlowReporter({
      config: 'vitest.config.mjs', cwd: '.'
    })]
  }
}
```

Playwright configuration:

```js
export default {
  reporter: [['list'], ['@asyra/flow-inspector/flow-files/reporters/playwright.cjs', {
    config: 'playwright.config.mjs', cwd: '.'
  }]]
}
```

The config/cwd values must match the selectors. Vitest watch captures a fresh
execution before tests run and publishes only completed test identities. Successful
partial runs leave unexecuted sibling criteria and their warnings unchanged;
empty discovery and execution errors still retain scoped warnings. Duplicate
selector mappings are rejected even for an explicitly selected node. Playwright
retries retain any failed attempt; distinct repeated cases are not collapsed into
a guessed result. Runs containing only unmapped files leave mapped observations
unchanged; their failures are retained at integration under the declared runner
scope. Inspector itself
watches flow files, never source files. With the Inspector closed, reporters still
write current results; startup loads them and a running dashboard refreshes them.
Editing source alone never changes a failed verdict to passing.

Alternatively, capture a receipt before an existing test execution and ingest its
JSON report afterward:

```sh
npx flow-inspector begin checkout review check --output receipt.json
# Execute the existing runner once, writing its JSON report to result.json.
npx flow-inspector ingest --receipt receipt.json --report result.json \
  --runner vitest --config flow-example/vitest.config.mjs --runner-project example
```

Receipt paths are project-relative and output creation refuses overwrites. Receipts
are invocation handoffs, not archives. A stale receipt, conflicting mapping or
changed source cannot publish passing evidence. Empty or incomplete results retain
failure and warn; complete matching evidence replaces covered producer/discovery
warnings. Unmapped failures require an explicit contract correction and are not
silently erased by unrelated success.

## Headless CI and portable results

```sh
npx flow-inspector validate
npx flow-inspector ci
npx flow-inspector export --output flow-current.json
```

These commands read files only; they start no test runner, browser or HTTP server.
`validate` checks structure. `ci`/`evaluate` emit JSON with `status` and `exitCode`:

| Outcome | Exit |
| --- | --- |
| satisfied | 0 |
| unsatisfied | 1 |
| invalid | 2 |
| awaiting-manual | 3 |

`--manual nonblocking` changes awaiting-manual's exit to 0 while preserving its
verdict. Failed, stale, blocked and missing automated obligations still fail.
Manual-only CI installs no test runner.

For CI, run the existing product tests once with the reporter, then invoke `ci`
and export/upload current files even if tests fail. A generic shell sequence is:

```sh
set +e
npm test
product_status=$?
npx flow-inspector ci
contract_status=$?
npx flow-inspector export --output flow-current.json
export_status=$?
[ "$product_status" = 0 ] && [ "$contract_status" = 0 ] && [ "$export_status" = 0 ]
```

The package's [external CI example](flow-files/examples/external-ci.yml) shows
separate test, evaluation and artifact steps. CI does not need the dashboard.

`flow-inspector import flow-current.json` explicitly adopts a trusted current
bundle. The destination needs a config and flows directory. It can be empty, or
contain the same definitions and declared source revisions. Lower revisions,
same-revision divergence, wrong project identity, corrupt/missing/duplicate
attachments and unsafe paths fail before adoption. Identical imports are
idempotent. Superseded tool-owned attachments are removed only when the merged
current project no longer references them; a failed import restores prior files.
Tool-owned attachments travel with their digests; project-owned
attachment references remain external and are never copied or deleted.

A writer lock prevents readers from treating a partially imported project as
current. If a process crashes during import, inspect/restore the project files
before removing its `.writer-lock`; do not treat removal as repair. Bundles are
not authenticated remote approvals, and there is no hosted multi-user merge service.

## Public Node API

```js
const {
  resolveProject, openProject, admitProject, nodeBinding,
  criterionBinding, evaluateProject, gateSummary,
  capture, publish, normalize, exportCurrent, importCurrent
} = require('@asyra/flow-inspector')
const project = resolveProject()
const store = openProject(project.directory)
const current = store.snapshot()
console.log(gateSummary(current))
```

Use `store.update(flowId, request)` with `expectedRevision` and current criterion
binding. See the authoring guide for observation, manual acceptance, note, progress,
source and correction requests. External test systems can produce this public
contract without a built-in adapter. The evaluator is shared by UI, API and CI;
there is no separate human or Agent completion policy.

## Scope and retained source tools

This package is optional for Asyra products and independent of Asyra Skill.
Current-only flow documents do not require per-stage history. Hosted teams,
authentication, Agent dispatch, automatic root-cause diagnosis and registry
publication are not included in this stage.

The archive also retains static viewer assets, Asyra architecture examples and
legacy source control-plane modules. Those explicit Asyra adapters require their
own repository fixtures and dependencies; they are not the independent CLI's
runtime. The package uses the repository's MIT license.
