# Feature: Switch Primary Tool

## Sources

- `src/features/switch-primary-tool/index.ts`
- `src/config/key-combinations.ts`
- `src/toolbar/tool-button.tsx`
- `src/controllers/app.ts`

## Trigger

- event: `input.shortcut.switchPrimaryTool`
- mode: execution
- priority: default
- exclusive: default

## Behavior

- Tool shortcuts use the Input System's held-key metadata to admit only a fresh
  matching keydown before Feature session cancellation. Repeats, keyup, cancel,
  IME composition and unrelated held-key/modifier changes do not switch tools.
  Editable controls retain keyboard ownership. A fresh press still invokes the
  feature even when that tool is already selected; Pen continuation behavior and
  explicit toolbar/tool changes keep their existing semantics.

1. Reads `snapshot.detail.primaryTool`.
2. Updates `primaryTool` through `systemContextApis.switchPrimaryTool`.
3. If path editing mode is active and target tool is `select`, keeps path editing mode and disconnects preview segment (`pathEditingStartNewSubpath = true`).
4. If target tool is `pen`, keeps path editing mode unchanged.
5. If target tool is neither `pen` nor `select`, exits path editing mode; the
   canonical exit contract makes `select` the final active tool.

## UI Contract

- Toolbar active state must reflect `primaryTool`.
- The Text toolbar entry selects `text` through this same controller/Feature.
  Its T SVG is shared with Text rows in Layers. The T shortcut selects the same
  tool; Canvas creation and editing follow [Editable Text](../specs/editable-text.md).
- Keyboard shortcuts and toolbar click should produce the same final state.
- Every path-editing exit leaves Select active.

## Notes

- Tool switching is the canonical place where cross-tool path-editing handling is enforced.
