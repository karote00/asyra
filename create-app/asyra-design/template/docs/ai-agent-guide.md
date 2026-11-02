# AI Agent Workflow

Use this sequence for every coding request in this project.

1. Restate one observable objective.
2. Name the owner paths you may change and the behavior that must stay fixed.
3. Read only the relevant local guide and linked upstream Framework contract.
4. For a bug, run the existing formal test first; if it misses the failure, add
   a failing regression test before production code.
5. Implement at the first incorrect owner boundary in a small slice.
6. Run the focused test, typecheck/build as applicable, then the documented App
   gates.
7. Review only the final diff, direct consumers, and the fixed checks. Report
   unrelated findings without silently expanding the task.

Before editing, answer these questions:

- Is this Framework mechanics, Preset defaults, App domain behavior, or service
  policy?
- Which Feature accepts the intent?
- Which common API owns the mutation or query?
- What is the intended transaction and undo boundary?
- Which schema validates runtime writes and loaded data?
- Which projection observes the canonical result?
- What formal test would fail if this behavior regressed?

Do not ask an agent to "improve the whole architecture". Give it one product
behavior, its owner guide, explicit exclusions, and the required checks.

## Embedded design conversation

The in-app Agent supports editable drawing, registered style/structure edits and
read-only design advice. Ordinary follow-ups retain the conversation brief and
user reference images; latest explicit revisions override earlier requirements.
Short clarification answers retain the exact question and offered choices.
Navigation keeps each unsent draft and its pending image reads separate. Sending
a draft retires its unfinished reads; add a still-needed image again to a new draft.
Closing the panel retires its unfinished presentation drafts.

History is bounded to 128 prior turns, 128 KiB of serialized text context and
8 MiB of serialized source attachments. An over-limit conversation explains how
to start again with the needed brief and references before making changes. Old
request-owned tool/evidence handles are never revived by conversation history.
The Agent still uses supported native editable operations; it does not insert
raster generations. Successful execution alone does not establish visual fidelity.
