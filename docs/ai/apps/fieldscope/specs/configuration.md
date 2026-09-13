# Configuration and history

The editor exposes length, bay width, total height, crossbeam elevation, symmetric side clearance, an ordered array of typed soil/drain strips, pole distance from water, front and rear insets, pole extension above the crossbeam, and absolute net top/bottom heights above soil. A strip explicitly carries `kind: soil | drain`; neither first-item kind nor alternation is assumed.

Width left after strip allocation is split equally between the two bay margins. Editing side clearance preserves strip widths and sets bay width to the strip sum plus twice the clearance. Direct bay-width or strip edits continue deriving equal margins. Optional `eaveHeight` stores an independently authored crossbeam elevation; omission preserves the original 60%-of-height behavior for earlier configurations and history. An authored elevation remains fixed when total height changes. Invalid elevations are rejected before geometry construction. Roof shape, steel stations, passages, supports, and netting are derived from the accepted dimensions. Adjacent drain strips do not create planting rows without adjacent soil.

Numeric fields follow Asyra Design: unfinished text remains local; Enter or blur immediately validates and commits the completed value through the runtime. Empty input or Escape restores the current value without history. Invalid values show an error and restore the accepted value without changing the scene or history. Each completed field edit or discrete strip action is one Undo; Redo restores it. A new accepted edit after Undo clears the redo branch. In a focused numeric field, Command/Ctrl+Z and Shift+Command/Ctrl+Z replay app history when no text edit is pending. A pending text edit retains native text Undo/Redo until Enter, blur or Escape settles it, even if native Undo temporarily restores the canonical number. Keyboard history uses the same ordered editor action queue as buttons. There are no Save, Update, Apply, discard or raw-data controls. Queued field patches read the latest canonical configuration when executed, so sequential edits cannot overwrite each other. Reload uses defaults.

The right panel contains the editor; the left contains presentation controls. Icon buttons above the canvas collapse each panel toward its screen edge. Collapsed controls are inert. Narrow layouts overlay panels rather than destroying the canvas. Panel toggles, layer changes, camera navigation and unfinished text create no history entries and do not rebuild geometry.

Each strip row ends with an up triangle, down triangle, and red X. Controls occupy one row and use 24×24 SVG viewports with drawing contained in the central 16×16 area. Reordering/removal commit immediately; first/last reordering and removal of the final strip are disabled.

## Canonical strip identity

Every configured strip has a nonempty, unique, app-owned `id` in addition to kind
and width. Defaults and Add create identities before canonical admission. Width
or kind edits, reordering and removal of other strips preserve the same strip ID;
Undo/Redo restores exactly the IDs recorded by the action. Newly added strips do
not reuse a removed strip's identity. Missing or duplicate IDs reject the whole
edit before state/history mutation. Validation never repairs IDs or infers them
from the current array position.

The ordered position remains geometry input, not identity. Robot missions bind to
strip ID within the chosen bay; consumers resolve that ID against the completed
canonical configuration before supplying a positional index to layout assessment.
Removing the selected strip makes the route invalid. Removing a preceding strip
or reordering the selected strip follows its same ID, not another occupant of the
old index. Reload still starts from defaults; there is no disk-format migration or
legacy positional mission fallback in this correction.

## Workbench usability

The editor uses compact 28px fields, with labels on the left and numeric values plus metre suffixes on the right. Group headings provide context (greenhouse, poles, net); field labels do not repeat that context. Strip actions retain 24px icons with central 16px drawing while providing 32px targets. Camera presets, fit/zoom and speed form a responsive toolbar above the viewport. Technical references and optional modeling assumptions are accessible from the header Reference Library dialog, with keyboard dismissal and focus return. External sources open in a new tab.

## Language preference

The header offers exactly Traditional Chinese (zh-TW, default regardless of browser language) and English (en). A deliberate selection is remembered in origin-local browser storage using `greenhouse-workspace.locale`; unsupported stored values use Traditional Chinese and blocked storage does not prevent switching. The HTML language and page title follow the selection. UI copy includes view controls, tooltips, accessibility labels, strip actions, reference descriptions, diagram legends and validation feedback. Proper names, original reference documents and SI unit symbols keep their meaning; reference links remain unchanged.

Locale is UI presentation state, outside canonical farm settings and Undo/Redo. Switching preserves the same canvas/runtime, camera, layer visibility, current configuration and history. Validation emits language-neutral codes and numeric parameters; the UI formats the current error using the current locale, including when an error is already visible. The two catalogs have matching keys and interpolation parameters. Responsive review covers both languages at 360, 390, 768 and 1440px, including panel scrolling, strip rows and expanded references.
