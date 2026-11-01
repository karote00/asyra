# Inspector Step Execution

## Scope

Use this workflow for changes to an Inspector-owned step or handoff. Select the
applicable owner through the current task contract and
[task context](../../workflows/task-context.md).

## Execution

1. Read the current product specification and matching flow contract.
2. Identify the owner, inputs, expected outputs and affected test cases in the
   existing task plan.
3. For a bug fix, demonstrate the failure with a formal regression test.
4. Implement the owner change and run its focused tests.
5. Review the changed handoffs and update the contract when behavior changes.
6. Run the applicable integration checks at the completed owner boundary.

Tests publish their results to the current contract. Flow Inspector determines
completion from all required current criteria passing. Advance to the next owner
when the current slice meets its stated behavior and tests.
