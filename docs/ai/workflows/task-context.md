# Task Context and Plan Closeout

## Ownership

The plan owns outcomes, task boundaries, prerequisites and acceptance criteria.
This workflow owns the association carried through a handoff and PR. The named
closeout owner coordinates whole-plan completion; finishing a child task does
not close the whole plan.

At task entry, read the supplied handoff and relevant conversation context.
Identify an existing plan before editing. Missing metadata is unresolved, not
proof that the task is standalone. Do not search or rewrite all repository plans
to establish the association for one task. Ask the assigning owner when the
available context is insufficient.

## Shared Context

Use one `task-context` fenced JSON block in both the handoff and PR body:

```task-context
{
  "version": 1,
  "mode": "plan-task",
  "objective": "Implement the selected task contract",
  "base": {
    "ref": "origin/main",
    "sha": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
  "prerequisites": [],
  "plan": {
    "path": "docs/ai/framework/plans/example.md",
    "section": "## Task 1",
    "closeoutOwner": "the named coordinating owner"
  }
}
```

Replace the example SHA, path, section and owner with actual values. `base.sha`
is the exact selected base commit. List required predecessor commit SHAs in
`prerequisites`; an empty array explicitly means none.

| Mode            | Meaning                                  | Closeout responsibility                      |
| --------------- | ---------------------------------------- | -------------------------------------------- |
| `standalone`    | Explicitly independent work; omit `plan` | None                                         |
| `plan-task`     | One selected task in an active plan      | Retained by `plan.closeoutOwner`             |
| `plan-closeout` | Whole-plan completion                    | Named owner confirms completion after review |

`plan.section` is the exact, unique Markdown heading selecting the task. Read
the full task contract and its referenced acceptance criteria. A matching
heading alone does not prove readiness or completion. If the existing plan has
no unambiguous task heading, resolve the contract with its owner first.

## Handoff and Worker Entry

Keep temporary input JSON inside the project, for example under ignored `tmp/`.
The prompt and PR body carry the durable association; no global task registry
or per-edit registration is required.

```bash
node scripts/task-context.mjs check tmp/task-context.json
node scripts/task-context.mjs handoff tmp/task-context.json
node scripts/task-context.mjs child tmp/parent-context.json tmp/child-selection.json
```

The child selection contains `objective`, `section`, and optionally a newer
`base` and additional `prerequisites`. The helper inherits the plan path,
closeout owner and existing prerequisites. A child of a closeout task is a
`plan-task`; it does not inherit permission to close the whole plan. Changing
the plan association requires explicit reassignment by the owner.

The helper prints a prompt. It does not dispatch agents, create worktrees,
change rules, authorize pushes, or schedule retries. Existing authorization
requirements remain at their current owners.

Before editing, the worker runs `check` in its own checkout and reads the
selected contract. Preflight requires a feature branch, the selected base in
HEAD, prerequisites integrated in that base, and the plan/task in both the base
and checkout. Do not copy an unmerged plan into another branch to satisfy the
check. The assigning owner must first resolve the intended base.

## Closeout Verification Contract

Partial plan tasks keep the active plan. A final task selects `plan-closeout`
only after the owner confirms all required plan work and acceptance criteria
are complete. Review applies to an exact source commit before closeout. A SHA
written in a PR body is not review evidence.

After review, changes are limited to the following derived owner paths:

1. Move the active plan under the same owner's `plans/completed/`.
2. Preserve the reviewed plan and append its outcome in the completed record.
3. Remove stale active-path references from the owner's `PLANS.md`.
4. Append a dated entry linking the completed plan to the owner's
   `decisions/releases/unreleased.md`, preserving existing entries.

Append this concise section to the completed plan, using actual evidence:

```text
## Closeout

Completed: YYYY-MM-DD
Reviewed source: <full reviewed commit SHA>
Outcome: <observed result and evidence references>
Decision: <accepted result and agreed limitations>
Exit criteria: <how required criteria were satisfied>
```

Implementation, test, acceptance contract, or other file changes after review
require another review before closeout. Closeout does not create Changesets,
versions, tags or releases. Push requires existing user authorization; merge
requires successful checks on the resulting head.

`scripts/plan-closeout.mjs` consumes immutable snapshots and a reviewed SHA
supplied by a trusted review adapter. It rejects a missing review, unrelated
post-review changes, missing moves, stale index links and rewritten decision
history. Standalone and partial plan tasks do not need closeout; neither may
hide a moved plan. Corrections to existing completed records may be standalone.

Structural checks do not prove arbitrary natural-language acceptance criteria.
The named owner and review retain that judgment. The helper cannot discover an
undisclosed parent or intercept every native agent tool; preserving context in
supported handoffs remains part of the collaboration contract.

## CI Rollout Boundary

Formal workflow tests run independently of workspace CI routing. PR admission
still needs the selected authoritative review signal and event wiring before
`plan-closeout` can become a required merge check. Do not describe the unit-test
workflow as active merge enforcement.

Rollout order: implement the selected review adapter, validate events and
exact-head behavior, merge the workflow, then add its published check to the
repository ruleset. Never require a check before its workflow exists on the
default branch. Existing PRs need explicit task context when admission is
enabled; missing context must not silently pass.
