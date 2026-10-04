# Starter App agent guide

This project is a small App-owned Item example. Read `docs/ONBOARDING.md`
and `docs/ARCHITECTURE.md` before changing Item behavior or App structure. `docs/PRIORITY_AGENT_PROMPT.md` is a ready-to-use
extension request, and `docs/PRIORITY_EXERCISE.md` records the included opt-in
exercise.

- Keep `src/domain/item-domain.ts` responsible for Item values, schema and saved
  data admission. A missing legacy field and an invalid present field need
  different outcomes.
- Route intended edits through the registered Feature in
  `src/features/items/index.ts` and `src/common-apis/items.ts`. Its App API owns one transaction per action
  and calls the Core facade. Do not write Core state directly from React.
- Treat `src/derived-state/item-projection.ts` and the React views as readers.
  The UI may hold unfinished input text, but it must not own another editable
  Item document. Preserve rejected drafts and gate product actions through the
  controller's draft admission. Never use blur ordering or status text as an
  admission result. Explicit cancellation discards a draft without history.
- Keep explicit Save/Reload in `src/persistence/storage.ts` and `src/common-apis/storage.ts`. Validate App data before `core.preflightLoad()` and `core.load()`.
- Keep the entire App standard: initialization/lifetime, controller, registered
  Feature, common API, canonical projection, semantic providers and composed UI.
  Register fixed UI properties before startup; observe dynamic Items through the
  projection's keyed subscriptions. Avoid whole-App subscriptions and React.memo.
- Never mirror undo/redo stacks in UI or parse status text to control behavior.
  Use structured feedback and single-step history APIs scoped to the App lifetime.
- Add permanent tests in `src/**/__tests__/*.test.ts` or `*.test.tsx` before
  implementation. Cover one action/one Undo, Redo, projection, saved data,
  legacy missing fields, invalid present fields and existing title/status.

Use the package manager declared in `package.json` for validation before
handing off changes:

| Check | Yarn project       | npm project           |
| ----- | ------------------ | --------------------- |
| Tests | `yarn test`        | `npm run test`        |
| Types | `yarn typecheck`   | `npm run typecheck`   |
| Lint  | `yarn lint`        | `npm run lint`        |
| Build | `yarn react:build` | `npm run react:build` |

The default App owns title, status and position offsets; the priority example is
opt-in.
