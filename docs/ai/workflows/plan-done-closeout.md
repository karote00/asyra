# /plan-done-closeout Workflow

## Intent

Finalize a DONE plan with deterministic closeout records.

Follow `task-context.md` for plan association, the named closeout owner and
review of the exact source commit before closeout. Partial plan tasks retain
their active plan. A final closeout preserves the reviewed plan in the
completed record and appends the outcome fields defined by that workflow.

## Required Inputs

1. plan path/name
2. scope (`framework` or app)
3. completion date (optional, defaults to current date)

## Reference Docs

- `docs/ai/framework/PLANS.md` or app plan index
- `docs/ai/framework/plans/completed/README.md`
- `docs/ai/framework/decisions/releases/unreleased.md` (or app counterpart)
- `docs/ai/workflows/README.md`
- `docs/ai/skills/plan-done-closeout/SKILL.md`

## Execution

1. Review the completed implementation and record its source revision.
2. Move the completed plan to the owner's `plans/completed/` directory.
3. Append its outcome and completed-plan link to the owner's
   `decisions/releases/unreleased.md`.
4. Update the active plan index and validate the resulting links.

For implementation already merged, perform closeout in a follow-up change using
its reviewed revision. Version preparation and publication run through their own
workflows. Closeout tooling validates this operation; CI runs the tooling's tests.

## Output

Use shared output contract in `docs/ai/workflows/README.md`.
