# Coding agent prompt - Item priority

Work in this Starter project. Read `AGENTS.md` and `docs/ONBOARDING.md`, then
make Item priority editable in the default App. The included
`src/examples/priority/priority-item-field.ts` and its formal test show an
opt-in exercise; use them as reference, and keep this project's implementation
small. Do not add a second document model, App, template generator, AI panel or
provider.

Priority must be exactly `low`, `normal`, or `high`, defaulting to `normal`.
Wire the App-owned field through the Item schema and existing Feature -> App
command API -> one transaction -> Core property update. The UI should issue a
Feature command and display the read-only projection. One change must make
one Undo entry; Undo and Redo must restore priority, title, status and the
projection.

Save and Reload must retain priority. A legal older V1 Item with no priority
must load as `normal`; a present invalid priority must be rejected before Core
load without changing the current document, history or projection. Keep the
existing title/status behavior and wrapper version. Write formal tests first
that fail on the current default App, then implement the change. Include the
normal edit, Undo/Redo, Save/Reload, legacy missing field and invalid present
field cases, plus a UI test for the control.

Run `yarn test`, `yarn typecheck`, `yarn lint`, and `yarn react:build`. Report the
changed owner files, the failing-before/passing-after test evidence, and any
limits. Do not claim a separate agent conversation was verified unless you
actually ran one.
