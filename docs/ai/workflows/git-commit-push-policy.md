# Git Commit and Push Policy

This is the project-wide policy for AI-assisted local commits and remote Git
operations. It applies to framework, app, documentation, plan, and workflow
tasks.

## Branch Safety

- Never modify or commit on `main`.
- Start work from a feature branch based on the intended current base.
- Verify the current branch before staging or committing.
- Preserve unrelated user changes in a dirty worktree.

## Worktree Location

- Create new linked worktrees at `<main-repository>/.worktrees/<task-name>`.
  Do not place working files under `.git/`, including `.git/agent-worktrees/`:
  development servers such as Vite intentionally block Git-internal paths.
- Git manages linked-worktree metadata under `.git/worktrees/` itself. That
  metadata directory is distinct from the working files and must not be moved
  or edited manually.
- Inspect registered worktrees, branch names, destination paths and uncommitted
  changes before creating one. If a name or path is occupied, choose a fresh
  name; never overwrite, reset or delete existing work.
- Reuse a task's existing suitable worktree after verifying its branch and
  state. This rule does not authorize relocating other tasks' worktrees.
- When an existing task's relocation is authorized, use `git worktree move`
  and verify the branch, changes and registration afterward. Preserve server
  ownership and stop only processes belonging to that task before relocation.

## Commit Authority

An agent may create local commits without requesting separate approval for each
commit when all of the following are true:

- the work is on a non-main feature branch;
- the commit closes one bounded implementation step, Inspector owner step,
  stage, or independently reviewable documentation stage;
- the scoped validation required by that step or stage has passed;
- the staged diff has been reviewed and contains only files belonging to that
  step or stage;
- the commit message identifies the completed behavior or contract.

Do not commit arbitrary work-in-progress, a known failing state, unrelated user
changes, transient diagnostics, secrets, or local test artifacts. A checkpoint
commit is allowed only when the task plan explicitly defines that checkpoint as
a coherent, reviewable stage with its own validation and stop condition.

Before every commit:

1. verify the current branch is not `main`;
2. inspect `git status --short`;
3. stage only the intended files;
4. inspect the staged file list and bounded staged diff;
5. confirm the step/stage gates and `git diff --check` pass;
6. create one cohesive commit;
7. report the commit hash and remaining worktree state.

## Push Authority

- A local commit never implies permission to push.
- Never push a branch, tag, or commit unless the user explicitly requests a
  remote action such as push, publish, or pull-request creation.
- A request to create a pull request authorizes only the minimum source-branch
  push required for that pull request, unless the user says not to push.
- Never force-push, rewrite remote history, publish a release, or merge a pull
  request without explicit user authorization for that operation.
- Registry publication may run from either `main` or a non-main feature branch.
  The branch name is not a readiness signal: publication requires a clean exact
  source commit, completed scoped gates, a reviewed artifact manifest and
  checksums, valid registry identity/scope access, and explicit publication
  authorization. Publishing from a feature branch does not authorize merging
  that branch or skipping its unfinished PR work.
- When push is not authorized, finish with local commits only and state clearly
  that nothing was pushed.

## Validation Before Every Push

Push authorization and validation are separate requirements. Before **every
push**, validate the version about to be pushed locally. This includes the
first branch push, PR creation, review fixes, and later updates to an already
green PR. Earlier CI success does not validate a changed head. CI is integration
verification, not the first place to discover locally detectable failures.

1. Inspect the intended PR base, current head, worktree state and scoped diff.
   Resolve applicable checks from the task contract, package scripts, generators
   and CI workflows; do not invent command names or assume App tests cover
   repository integration.
2. Run the required local checks after the last relevant edit. Cover focused
   behavior tests, applicable lint/typecheck/build, generated-file checks and
   directly affected repository contracts. For a new workspace, include
   changeset admission, workspace/Turbo generation, test-file placement and
   naming checks. CLI/template work also requires its declared clean-consumer
   gates; visual changes require the declared browser and screenshot review.
3. Review the final diff and run `git diff --check`. After committing, run
   commit-dependent checks against the actual head and intended PR base, such
   as `changeset:pr:check` with its base/head environment variables. Confirm
   local uncommitted files did not supply behavior missing from the commit.
4. Report the source revision, commands and outcomes in the existing handoff or
   PR description. Distinguish passed, failed, not applicable and unavailable
   checks. Then push only if authorized and all required local checks passed.

An edit invalidates evidence for the checks it affects. Repeat those checks and
the final pre-push review; do not reuse a green result from before the repair.
Unchanged inputs may retain valid evidence when that validity is established,
not merely because the command was run earlier. Preserve resource guards and
run applicable expensive gates at the completed slice/milestone, not after each
small edit. This policy does not require unrelated repository-wide tests for
every push. Documentation-only tasks use their applicable document/contract
checks and the repository's documentation-only changeset policy; they do not
need unrelated App builds or browser tests.

A failed or unavailable required local check blocks pushing. Fix in-scope
failures first. If a required check cannot run locally, report the exact gate,
reason and unverified scope and wait for explicit user direction; do not mark
it passed, weaken it, or push just to let CI diagnose it. A supported direct
entrypoint may replace a command wrapper only when it runs the same check;
partial substitutes must not be presented as equivalent.

After pushing, inspect CI for the exact head. Pending, skipped required, or
failed checks are not completed validation. Passing checks do not grant merge,
publication or deployment permission, or replace a requested review.

## History Safety

- Do not amend, squash, rebase, reset, prune, or otherwise rewrite commits that
  may already be shared unless the user explicitly authorizes the history
  operation.
- Prefer a new corrective commit over rewriting an existing commit.
- Main-branch integration remains a human-owned pull-request action unless the
  user explicitly requests an allowed remote operation.

## Workflow Handoff

At task handoff, report:

- local commit hashes created during completed stages;
- uncommitted files or unfinished stages, if any;
- validation status for each committed stage;
- confirmation that no push occurred unless one was explicitly requested.
