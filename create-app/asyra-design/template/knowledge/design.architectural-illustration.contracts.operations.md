---
{
  "description": "Exact discovery, exclusive-target invocation examples and review receipt recovery for a chosen operation.",
  "contexts": [
    "architectural-illustration"
  ],
  "provenance": [
    "Asyra Design advisory mapping reviewed against current public tool descriptions and schemas."
  ],
  "references": [
    "design.architectural-illustration.contracts"
  ]
}
---

# Tool contracts and recovery in Design

### Retrieve the contract for the chosen method

Use compact category/query menus when the capability is unknown. For known
operations use `operations`; for known native tools use `names`. `view: usage`
returns purpose, the actual invocation route, a validated illustrative owner example
when available, and canonical nested field/definition paths. Examples do not replace
executable validation schemas or supply live credentials.
A canonical action's `recipeDependency` identifies its qualified composition
route; foreign tools with similar names are separate choices. Select that route
before obtaining the full recipe contract. The semantic `operations` selector
(such as `fill.updateFillsAtIndex`) is for discovery; batch `operations[].name`
uses the returned registered action `name`. Follow its `execution.tool` and
argument envelope. Do not invent an action name by copying the search term. Use the following ordinary selectors,
not a second registry. Choose the smallest missing information for the next action:

| Current state | Retrieval/action | Keep for the next handoff |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Capability is unknown | Compact category/query menu; follow its pagination if needed | Returned operation, exact selector and execution route |
| Route is chosen; a few argument fields are unknown | Exact `operations` or qualified `names` with `schemaPaths` | Field fragments plus included local references; other required inputs still apply |
| Current complete contract is already available | Invoke directly with the required values | Result identities, settlement and scoped dependencies |
| A finite recipe needs a dependency contract | Exact full definition for the returned `recipeDependency` or native route | Complete input/output, partial outcome, effects and lifecycle; a usage menu/fragment is insufficient |
| Delivered content is absent from effective context | Returned scoped recovery or explicit full refresh when necessary | Current recovered content/revision; do not retry the drawing write |

For names shared by a basic action and a native wrapper, their argument envelopes
can differ. Select the returned qualified native selector or the exact basic
operation; do not combine their fields. Do not assume every new material role needs
a new schema lookup. A changed target value does not change an unchanged tool
contract. Conversely, a first-time tool lookup is necessary acquisition, not waste.
The server having produced a response does not prove that you retained it; genuine
lost-context/delivery recovery remains valid.

Examples use current public selectors:

```json
{
  "tool": "describe_design_apis",
  "arguments": { "operations": ["fill.updateFillsAtIndex"], "view": "usage" }
}
```

```json
{
  "tool": "describe_design_apis",
  "arguments": {
    "names": ["design_workflow.prepare_and_apply_design"],
    "schemaPaths": ["/properties/draft"]
  }
}
```

Retain the returned exact fields. A fragment includes needed local references but
is not a complete validation schema; composing tools needs full input/output,
partial/recovery and lifecycle contracts. On an unknown path follow the actual
`schemaResolution` correction; restore missing context through the returned
scoped recovery. Full retrieval remains available. Never retry a settled drawing
write because its description or delivery was lost.

### Preserve exclusive target inputs and current review receipts

A direct edit supplies known current IDs. A retained target supplies that argument
slot instead; omit the slot entirely, including empty arrays and null. These two
examples are alternatives, not consecutive operations. Replace the illustrative
IDs with the actual current document or preparation receipt; never reuse saved
run IDs. Use a ready known edit without a Knowledge-read prerequisite.

```json
{
  "tool": "execute_design_batch",
  "arguments": {
    "operations": [
      {
        "name": "api_element_deleteElements",
        "arguments": { "elementIds": ["current-selected-element"] }
      }
    ],
    "inspection": "defer"
  }
}
```

```json
{
  "tool": "execute_design_batch",
  "arguments": {
    "operations": [
      {
        "name": "api_element_deleteElements",
        "arguments": {},
        "target": {
          "field": "elementIds",
          "artifactId": "current-prepared-part",
          "keys": ["chosen"]
        }
      }
    ],
    "inspection": "defer"
  }
}
```

For a current-region target use the supported `target.query` instead of a
preparation reference. `name.equals` matches the entire generated name;
`name.suffix` matches an explicitly chosen ending (for example a repeated motif's
role after its generated prefix). A zero-match receipt is zero edits, not permission
to broaden the region or predicate. Inspect the naming rule/available metadata and
choose corrected criteria; the tool must not infer the intended target for you.

Review revisions belong to returned checks, not the capture counter or document
sequence. Before explicitly superseding a visual unit, use `read_design_checks`
with its exact ID and `view: details`, then carry that unit's current revision.
When recording visual decisions, select the materials.review child for the capture/bind/record example and its final-record instruction. Reuse good images through `bindChecks`.
Do not copy a revision from an earlier decision. A concurrent edit can still make
that read stale: re-read/rebind only the affected unit, preserving unrelated passes.
Keep successful images if another capture or binding failed; do not repeat a
settled edit to recover a review receipt. Never attach a new revision to an old
judgment. The final `report_outcome` action belongs to the final response actions,
not native invocation or an edit batch; its proposal does not acknowledge saving.

### Relevant capability handoffs

| Intent/data already available | Existing consumer | Required handoff and limit |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing reusable orchestration | Discover existing tools/library first; describe exact contracts; submit_tool -> invoke_tool -> save_tool if needed | Author finite typed recipes only when existing main tools do not cover the work and the steps are genuinely reusable. No JS callbacks, captured request IDs or invented loops. Partial/unknown outcomes stop dependent writes; retry storage alone after successful execution. Do not create a recipe to satisfy an evaluation quota. |
