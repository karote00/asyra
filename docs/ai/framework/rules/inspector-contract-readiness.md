# Rule: Inspector Contract Readiness

## Scope

Apply this rule when changing a flow's behavior or contract. Use the task scope
and [developer Agent scope](../../workflows/task-context.md#asyra-developer-agent-scope-exception)
to select applicable work.

## Contract

The product specification describes behavior. The current flow contract records
owners, inputs, outputs, handoffs and required criteria. Formal tests verify the
implementation and update the current results.

Before implementation, identify the affected owner, expected behavior and tests.
Describe enough of each handoff to implement and test it. Resolve conflicting
requirements with the specification owner within the task scope.

## Completion

Flow Inspector evaluates the current contract. Completion requires every required
criterion to pass with current results. Missing, failed, stale or unexecuted
results remain incomplete. The underlying tests own behavior, integration,
resource and visual assertions appropriate to their feature.

Update the contract and tests together as the app evolves. Review the changed
behavior and its direct consumers; retain the task's stated completion criteria.
