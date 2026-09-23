# Starter App agent guide

This project is a small App-owned Item example. Read `docs/ONBOARDING.md`
before changing Item behavior. `docs/PRIORITY_AGENT_PROMPT.md` is a ready-to-use
extension request, and `docs/PRIORITY_EXERCISE.md` records the included opt-in
exercise.

- Keep `src/domain/item-domain.ts` responsible for Item values, schema and saved
  data admission. A missing legacy field and an invalid present field need
  different outcomes.
- Route intended edits through the registered Feature in
  `src/runtime/starter-runtime.ts`. Its App API owns one transaction per action
  and calls the Core facade. Do not write Core state directly from React.
- Treat `src/runtime/projection-store.ts` and `src/ui/StarterApp.tsx` as readers.
  The UI may hold unfinished input text, but it must not own another editable
  Item document.
- Keep explicit Save/Reload in `src/runtime/storage.ts` and the runtime load
  path. Validate App data before `core.preflightLoad()` and `core.load()`.
- Add permanent tests in `src/**/__tests__/*.test.ts` or `*.test.tsx` before
  implementation. Cover one action/one Undo, Redo, projection, saved data,
  legacy missing fields, invalid present fields and existing title/status.

Run `yarn test`, `yarn typecheck`, `yarn lint`, and `yarn react:build` before
handing off changes. The default App remains title/status-only; the priority
example is opt-in.
