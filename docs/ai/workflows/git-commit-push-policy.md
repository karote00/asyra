# Git Commit and Push Policy

This is the project-wide policy for AI-assisted local commits and remote Git
operations. It applies to framework, app, documentation, plan, and workflow
tasks.

## Project and GitHub Language

Follow the project language rule in `AGENTS.md`: write commit messages and all
GitHub content in English, including PR titles, descriptions, issues, reviews,
and comments. A Traditional Chinese conversation does not authorize Traditional
Chinese project or GitHub prose. The only Traditional Chinese exceptions are
required i18n parameters/resources and test data that genuinely needs it to
verify behavior; explanatory prose remains English.

Before submitting or updating GitHub content, review its language as well as
its technical accuracy.

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
- Push or PR authorization includes the fetch, rebase and conflict resolution
  needed to integrate the intended current target branch. It also includes an
  exact `--force-with-lease=<source-ref>:<expected-remote-commit>` update of that
  task's source branch when the rebase rewrites its published commits. This is
  standing authorization; do not ask for separate approval for these steps.
- Before rewriting, fetch and inspect both target and source. Preserve unexpected
  remote commits; a rejected lease requires re-inspection, never a blind retry or
  unconditional force. A no-push instruction still prohibits remote updates.
- Publishing releases and merging pull requests require their own explicit user
  authorization.
- Registry publication may run from either `main` or a non-main feature branch.
  The branch name is not a readiness signal: publication requires a clean exact
  source commit, completed scoped gates, a reviewed artifact manifest and
  checksums, valid registry identity/scope access, and explicit publication
  authorization. Publishing from a feature branch does not authorize merging
  that branch or skipping its unfinished PR work.
- When push is not authorized, finish with local commits only and state clearly
  that nothing was pushed.

## Source Synchronization

Fetch the intended PR target and source branches before pushing. If the target
contains commits not included in the source, rebase onto the fetched target.
Recheck target freshness immediately before pushing. Necessary source-branch
history updates follow Push Authority; use the inspected remote commit as the
exact lease.

After pushing, inspect CI for the exact head. Pending, skipped required, or
failed checks are not completed validation. Passing checks do not grant merge,
publication or deployment permission, or replace a requested review.

## History Safety

- Necessary task-branch rebases and exact lease-protected updates follow the
  standing Push Authority above. Other history rewrites, destructive resets or
  pruning require explicit authorization; never rewrite the protected main branch.
- Prefer a new corrective commit for ordinary fixes; rebase when integrating the
  intended current target branch.
- Main-branch integration remains a human-owned pull-request action unless the
  user explicitly requests an allowed remote operation.

## Workflow Handoff

At task handoff, report:

- local commit hashes created during completed stages;
- uncommitted files or unfinished stages, if any;
- validation status for each committed stage;
- confirmation that no push occurred unless one was explicitly requested.
