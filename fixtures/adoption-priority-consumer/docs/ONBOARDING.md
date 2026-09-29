# Extend the Starter Item

The default screen starts with an empty document. Add an Item, select it on the
2D canvas or in the Item list, and edit its `title` and `status` in the
inspector. Drag a canvas Item to move it. It uses React as a
shell and a supported 2D provider, while Core and its registered owners hold
the document. Start with `src/domain/item-domain.ts` for Item values, schema,
and saved-data admission. Trace `src/runtime/starter-runtime.ts` before editing
the UI.

## Canonical edit path

`src/ui/StarterApp.tsx` calls `runtime.feature.addItem`, `editItem`, or
`moveItem`. The registered Feature delegates to the App command API. The API
validates input,
wraps one intended action in `runTransaction`, and calls
`core.createElementsInParentFromCanonicalData` or
`core.updateElementProperties`. Core/Props owns the persisted values and the
Undo journal. The Feature registration keeps its existing priority and
exclusive behavior; the Item's `priority` data field is unrelated to that
Feature scheduling priority.

`src/runtime/projection-store.ts` derives read-only Item rows from Core. It
handles shared publications for add/edit/Undo/Redo and refreshes from Core on
accepted Reload. React subscribes to those rows; it must not become a second
editable Item source. A text input may temporarily hold incomplete text until
its Feature command commits. The App-owned overlay layer paints cards from
the same projection, while selection remains transient UI state and does not
create a transaction.
Dragging previews the card position without writing Core. Releasing the pointer
commits the Item's numeric `offsetX` and `offsetY` Props in one transaction, so
one drag creates one Undo entry. Both the Core overlay and React card use the
same position projection. Missing offsets in a legacy saved Item mean zero;
present invalid offsets are rejected before load.

`src/runtime/storage.ts` writes an explicit versioned Core snapshot. Reload
parses the wrapper, validates App Item fields, then uses Core preflight and
load. The App handles compatibility for its own fields. Missing legacy data
must be distinguished from a present invalid value before Core applies the
document.

## Priority exercise

`src/examples/priority/priority-item-field.ts` defines an optional Item field:
`low`, `normal`, or `high`, with default `normal`. Passing
`itemField: priorityItemField` to `createStarterRuntime` activates it for that
runtime. Commands use `fields: { priority: ... }`; the authoritative Props
record saves `priority` directly, while the read-only Item projection exposes
it under `fields.priority`. The default screen does not pass this option and
keeps its original title/status behavior.

The App admits an older valid V1 saved Item with no priority as `normal`. A
present value outside the three legal values is rejected before Core load, so
the current document, history and projection remain intact. Save/Reload and
Undo/Redo use the same canonical owners as title/status.

Use the package manager declared in `package.json` and run the tests,
typecheck, lint and build commands in `AGENTS.md`. The formal exercise is
`src/examples/priority/__tests__/priority-example.test.ts`;
the baseline domain, runtime and UI tests are under their respective
`src/**/__tests__/` folders. See `docs/PRIORITY_EXERCISE.md` for the recorded
exercise and `docs/PRIORITY_AGENT_PROMPT.md` for a prompt you can hand to a
coding agent in a generated project.
