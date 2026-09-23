# Priority extension exercise result

This task's agent implemented the opt-in priority field in this Starter source.
The default App remains title/status-only. The reusable example definition is
`src/examples/priority/priority-item-field.ts`; its permanent integration test
is `src/examples/priority/__tests__/priority-example.test.ts`.

In the canonical project worktree, the focused
`yarn test src/examples/priority/__tests__/priority-example.test.ts` was run
before implementation. This records the task's worktree command. In a
generated project, use the package manager declared in `package.json` and the
matching commands in `AGENTS.md`. Both initial cases failed because the
projection and saved Props record had no priority. After the App-owned schema,
Feature command path, load admission and projection were extended, the focused
test passed. The permanent cases check the schema predicate, one edit/one Undo
entry, Undo/Redo, scoped projection refresh, Save/Reload, a missing legacy
value and rejection of invalid runtime and saved values. The default Item
tests remain part of `yarn test`.

This is a local implementation exercise and formal test result. It is not an
independent verification in a new coding-agent conversation.
