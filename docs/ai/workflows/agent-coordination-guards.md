# Agent coordination guards

This project-owned development guard adds deterministic checks to the existing
worktree, Inspector, test-first, review and PR workflow. It is not an operating
system sandbox, an authenticated agent identity provider, or a replacement for
product reasoning. Framework and app behavior are outside its mutation scope.

Multi-agent work is opt-in only. The repository's active Codex configuration
keeps multi-agent tools disabled, and the reusable role files are stored as
templates under `docs/ai/workflows/multi-agent-templates/` instead of the active
`.codex/agents/` loading path. AGENTS.md, this guard, hooks, role templates,
skills, and agent judgment cannot authorize spawning or delegating to another
agent. Use this coordination layer for multi-agent writes only when the user
explicitly asks for multi-agent work in the current task.

Single-agent protection remains active through project hooks and the core guard
checks where applicable. Keeping hooks active is not the same as enabling
multi-agent tools or starting subagents.

## Task boundary

Every write needs an explicit task mode and a task record bound to one worktree,
branch, baseline, allowed paths, exact expected file bytes, contract-change
exceptions and completion gates. A normal single-agent task in its own isolated
worktree uses task-local mode. It stores one validated snapshot at
`tmp/agent-coordination/task.json` inside that worktree. Admission, write
completion, lifecycle checks and pre-commit validation read only this snapshot;
they do not open, migrate or validate shared history.

With no selected mode, hooks allow only bounded read commands, a new JSON
request file under `tmp/agent-coordination/requests/`, and the exact guard
command that consumes that request. The bootstrap request declares the
operation as `mode: "init-task-local"`, plus the current absolute `repoRoot`
and complete `task` record. This operation name is distinct from the selected
state mode `task-local`. Add the request with
one `apply_patch`, then run
`node scripts/agent-coordination/guard.cjs init-task-local < tmp/agent-coordination/requests/<name>.json`.
The hook validates the request before allowing either operation; its post-tool
receipt checks the exact bytes written. The initializer verifies the current
worktree and branch, checks the baseline is an ancestor of `HEAD`, checks every
declared initial preimage against its current bytes or `absent`, and creates
`task.json` without replacing an existing file. Declare every file that may
change in `expectedFileDigests`; add-file targets use `absent`.

Missing task state denies product writes with this bounded initialization
route. Corrupt local state also denies writes. `recover-task-local` requires the
exact SHA-256 of the inspected damaged state bytes plus a reviewed task record
whose branch, baseline and file preimages still validate. It will not replace
valid state or a coordinated-mode selector. Put that request in the same fixed
request directory and run the exact `recover-task-local` command through the
hook.

Use shared coordination only when work needs cross-task information, such as a
sub-PR/goal relationship, dependencies, shared semantic ownership or multiple
contributors to one resource. Register the versioned record in the shared
`tmp/agent-coordination/state.json` in the shared repository root with `node
scripts/agent-coordination/guard.cjs register`, one JSON request on stdin and
the observed `expectedRevision`. Create a new request declaring
`mode: "select-coordinated"`, `repoRoot` and the registered `taskId`. This
operation name is distinct from selected state mode `coordinated`. Explicitly
select it in that worktree with
`node scripts/agent-coordination/guard.cjs select-coordinated < tmp/agent-coordination/requests/<name>.json`.
That selector lives in the worktree-local `task.json`;
only coordinated mode reads and validates the shared registry. If the shared
registry is missing, damaged or incompatible, coordinated work remains denied.
Do not repair it by resetting history or guessing fields for old tasks.

Shared registration uses a short metadata lock and revision comparison. A
stale request is rejected; reread and reconsider it rather than automatically
retrying with a new number. The lock does not serialize independent
implementation or test work.

Use `kind: "local"` for administration or research that has no PR relationship.
A paused or blocked coordinator on the repository root may still add/update an
in-scope `tmp/agent-coordination/requests/<safe-name>.json` request using a
preimage-checked patch, then invoke exactly
`node scripts/agent-coordination/guard.cjs register < tmp/agent-coordination/requests/<safe-name>.json`.
Register a reusable request path with an `absent` expected digest before its
first write. This recovery route does not enable ordinary paused-task writes.

Only one active writer owns a worktree. Distinct task-local worktrees use
separate snapshots. In coordinated mode, distinct worktrees may proceed in
parallel when their declared semantic owners do not conflict. Shared ownership
requires an explicit dependency and completion of the predecessor. A task-local
record's scope and file membership are immutable. `node
scripts/agent-coordination/guard.cjs context` reports its current `taskDigest`,
which `update-task-local` requires for lifecycle/evidence updates. Those updates
cannot change scope or file snapshots, and readiness evidence must match the
current Git head and staged tree. Predeclare
`tmp/agent-coordination/requests/task-lifecycle.json` as an allowed exact file
with an `absent` preimage. After other product writes are complete, read
`taskDigest` from `context` and write a JSON request there using this exact
schema:

```json
{
  "repoRoot": "/absolute/path/to/worktree",
  "expectedTaskDigest": "<taskDigest returned by context>",
  "update": {
    "state": "active"
  }
}
```

`expectedTaskDigest` is the request field name; `update` contains only the
lifecycle fields being changed (`state`, `evidence`, `review`, or
`continuations`). For `ready` or `complete`, include exact passing gate evidence
and review for the current head and staged tree.

The `taskDigest` intentionally ignores only the current digest value of this
fixed lifecycle request file, while retaining its path and all other task
fields and file digests. That lets the request carry the digest it read before
its own post-hook refresh. Changes to another declared file, task authority,
state or evidence still make the request stale. The pre-hook verifies the
request file's registered preimage and exact SHA-256, then admits only this
fixed command:

```text
node scripts/agent-coordination/guard.cjs update-task-local --request tmp/agent-coordination/requests/task-lifecycle.json --sha256 <sha256-of-exact-request-bytes>
```

There is no shell redirection or general command approval for this route. The
CLI rechecks the exact request bytes and `expectedTaskDigest` under task-local
compare-and-swap; the post-hook verifies the matching request and resulting
state. If the request is stale, reread `context`, review the changed task state,
and write a new request. Guard-owned `task.json`, `state.json`, receipt and
lock paths cannot be changed through ordinary task writes. Resolve existing
state before initializing a reviewed replacement; do not silently widen a
task.

## Bounded registry history

The version-one live registry remains readable until an explicit compaction.
Only an active coordinator rooted at the main repository may invoke
`compact` with the observed registry revision. Compaction writes a version-two
registry, so older guard binaries fail closed instead of dropping archive
metadata during a later update.

Compaction keeps every nonterminal task and the transitive task records it
currently references. Other complete or retired records move unchanged into
immutable, content-addressed files under
`tmp/agent-coordination/archive/`. Each archive file retains the complete
normalized task authority, review, evidence and relationship fields and remains
subject to the existing file-size bound. Archive files are durably linked before
the live registry is atomically replaced. A failed or stale live replacement may
leave an unreferenced archive file, but cannot publish a registry that points to
missing history.

Version-two loading verifies repository containment, regular-file ownership,
content hashes, unique IDs and historical relationships. Archived complete
records may satisfy a later task dependency; retired records cannot. Archived
IDs cannot be registered again, and a sub-PR integration always requires its
source and goal to remain in the live registry. Use the read-only `history`
operation to retrieve a verified archived snapshot. Installing the reviewed
guard version and compacting live state are separate coordinator operations.

Expected file digests preserve observed user and agent work. An unknown digest
is not permission to overwrite. An in-scope `Add File` requires a registered
`absent` preimage and a path that still does not exist; it cannot overwrite an
unknown file. Plan new output paths before granting the task write authority.
Existing tests, oracles, Inspector contracts and budgets require explicit
contract-change scope. New regression tests within the task's scope remain
normal implementation work. A protected-file check does not prove a changed
assertion is semantically strong enough; independent review still owns that.

## Executable boundaries

- `pre-tool` inspects a supported command or patch before execution. It rejects
  destructive repository operations, unauthorized writes, protected-contract
  changes, stale branch/preimage assumptions and writes by paused tasks.
- Opaque shell/interpreter commands need exact registered command approval.
  This approval grants the reviewed program's effects; it does not inspect every
  filesystem operation inside arbitrary Python, Node, shell or subprocess code.
  Never approve a general interactive shell as a scope-enforcement mechanism.
- `check` validates a successful patch's recorded preflight before proposing
  digest updates for exactly that operation's paths. It never adopts all dirty
  files or restores unexpected changes. Unknown native success formats leave
  expectations unchanged and require explicit review.
- Task-local preflight receipts bind task authority, lifecycle state, exact
  preimage paths and input. `complete-write` serializes the post-tool update in
  that worktree and refreshes only paths from its matching receipt. A missing,
  changed or replayed receipt fails closed. Independently completed paths keep
  separate snapshots; a same-path preimage conflict remains denied.
- `pre-commit` checks the staged scope and exact evidence. `integration` checks
  the registered sub-PR/goal relationship, source and target revisions, review,
  dependencies and required gate evidence. These commands do not execute Git
  commits or merges. Recognized direct Git commit commands also run the
  pre-commit check during pre-tool admission; evidence is required before Git
  can run. The coordinator invokes these checks at the corresponding boundary.
  `node scripts/merge-agent-subpr.mjs <source-task> <goal-task> <PR-number>` is
  the supplied merge entry point: it reads current remote PR/check/revision
  state, runs `integration`, and only then merges with an exact source-head
  match. Direct merge commands are denied by the pre-tool guard. This wrapper
  must itself be an explicitly approved command; approval does not waive its
  internal checks or grant permission to merge a goal to main.
  The current goal head must already be an ancestor of the tested source head.
  When another sub-PR advances the goal, integrate that new base into the source
  and renew its combined tests/review before trying again. Evidence against an
  earlier goal head cannot authorize integration into a newer one.
- `stop` distinguishes paused/blocked work from unfinished delivery. At most one
  automatic continuation is permitted for an incomplete handoff; unresolved
  work then produces a diagnostic rather than an unlimited model loop.

The current three goal PRs must never merge into `main`. Authorized sub-PR
integration remains possible after the integration check. A local Git hook or
script is not server-side branch protection, and a manual/API merge outside
this checked path is not covered by this guard.

## Native Codex adapter

`.codex/hooks.json` invokes `scripts/agent-hook-adapter.mjs` from the common
repository directory. The adapter resolves the actual worktree from the native
execution directory or exact patch targets, reads that worktree's explicit
`task.json` mode, and routes to its task-local state or selected shared
registry. It maps native hook output to supported denial/continuation
shapes and converts core failures into an explicit pre-tool denial. It never
uses unsupported `permissionDecision: "ask"` as an escalation mechanism.

Native shell task selection uses the explicit execution directory, or an exact
registered subagent identifier for `SubagentStop`. Shared parent `session_id`
is never treated as a subagent identity. Directory selection is a routing hint,
not authentication: an actor with the same filesystem permissions can request
another directory. Missing or ambiguous bindings cannot grant write scope.
Because native subagents can share the parent's session directory, patch
selection resolves all patch targets to one registered worktree. Mixed-worktree
patches are denied; relative targets are resolved against the original session
directory before core validation. This routing does not authenticate the writer.

Per-tool preflight receipts bind a tool-use ID and exact input to the task's
preimages. Only a matching, explicitly successful post-tool event may update
those paths. Coordinated mode keeps the shared registry's explicit revision
checks. Task-local mode updates only its worktree snapshot under a short local
lock; unrelated task records are not inspected. A post-tool warning cannot undo
an operation that already happened. Receipts contain no full conversation,
environment variables, authentication material or test logs.

No hook calls a model or launches a complete test suite. Read-only admission
does not recursively scan the repository. Run consolidated task gates once the
complete sub-PR is ready; repeat only affected checks after a correction.

## Activation and limitations

Codex requires trust of the exact non-managed hook definition. Merely creating
the JSON file does not establish that this desktop session loaded or ran it.
Changed hook definitions require another trust review. Do not disable hook
trust, rewrite global settings or upgrade the runtime as an activation shortcut.

The desktop binary can differ from `codex` on PATH. On the inspected host, the
desktop bundled binary supports hooks, while PATH points to an older CLI.
`scripts/inspect-agent-hooks.mjs` can read `hooks/list` through an existing daemon
control socket without starting a model turn. A host without that socket returns
an explicit unavailable result, not a successful activation claim.

On the inspected macOS host, start in the repository root and use the bundled
CLI for the user's trust review:

```sh
/Applications/ChatGPT.app/Contents/Resources/codex -C "$PWD"
```

Open `/hooks`, inspect and trust the four definitions from `.codex/hooks.json`,
then reload the desktop session before checking interception there. PATH's older
CLI is not the activation authority. This is a user trust action; project agents
must not rewrite trust records outside the repository or bypass the review.

Before resuming protected multi-agent writes, verify native interception using
a harmless probe in the actual session, including a nested tool call and a
subagent handoff where available. Unit tests of the adapter are not evidence
that the desktop hook ran. Keep pending activation separate from passing guard
tests in the delivery report.

This layer does not cover arbitrary out-of-band filesystem writes, all external
tool paths, interactive `write_stdin` input, authenticated coordinator authority,
or server-atomic merge approval. Same-user actors can modify local guard/state
files outside the checked path. Formal integration tests detect the invariants
they encode, not every possible semantic conflict. Stronger enforcement needs
separate filesystem/credential isolation or a controlled execution boundary.

## Permanent verification

The formal guard suites cover destructive restoration/deletion, scope crossing,
legitimate coordinated work, protected tests/contracts, integration evidence,
unexpected dirty changes, valid parallelism, stale state and bounded lifecycle
continuation. Semantic conflict examples must execute a failing invariant on
the combined source, rather than only asserting that a receipt says "failed".

Run the focused guard tests and the existing naming/lint/script gates. Do not
run app geometry, browser or release gates merely because this tooling protects
those workflows.

Official behavior reference:
<a href="https://learn.chatgpt.com/docs/hooks" target="_blank" rel="noopener noreferrer">Codex hooks</a>.
