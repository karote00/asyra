# Agent coordination guards

This project-owned development guard adds deterministic checks to the existing
worktree, Inspector, test-first, review and PR workflow. It is not an operating
system sandbox, an authenticated agent identity provider, or a replacement for
product reasoning. Framework and app behavior are outside its mutation scope.

## Task boundary

The coordinator registers one versioned task before enabling its writes. The
record binds its worktree, branch, baseline, allowed files, expected file bytes,
contract-change exceptions, semantic owners, dependencies and completion gates.
State lives in `tmp/agent-coordination/state.json`; it is local execution data,
not a source-of-truth product contract or a file to commit.

Use `node scripts/agent-coordination/guard.cjs register` with a single JSON
request on stdin and the observed `expectedRevision`. Concurrent registration
uses a short metadata lock and revision comparison. A stale request is rejected;
it must be reread and reconsidered, not automatically retried with a new number.
The lock does not serialize independent implementation or test work.

Use `kind: "local"` for administration or research that has no PR relationship.
A paused or blocked coordinator on the repository root may still add/update an
in-scope `tmp/agent-coordination/requests/<safe-name>.json` request using a
preimage-checked patch, then invoke exactly
`node scripts/agent-coordination/guard.cjs register < tmp/agent-coordination/requests/<safe-name>.json`.
Register a reusable request path with an `absent` expected digest before its
first write. This recovery route does not enable ordinary paused-task writes.

Only one active writer owns a worktree. Distinct worktrees may proceed in
parallel when their declared semantic owners do not conflict. Shared ownership
requires an explicit dependency and completion of the predecessor. To change
an immutable task scope, retire the old task and register its replacement after
coordinator review; do not silently widen a worker's task.

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

`.codex/hooks.json` invokes `scripts/agent-hook-adapter.mjs`. Hook commands resolve
the common repository directory so linked worktrees use the same reviewed
guard. The adapter maps native hook output to supported denial/continuation
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
those paths through registry compare-and-swap. A post-tool warning cannot undo
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
