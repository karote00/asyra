# Complete Text authoring in Asyra Design

Status: PLANNED - documentation only; implementation has not started.
Requested: 2026-09-24. Do not activate implementation or a goal from this record.

## Objective and scope

Make the existing native Text component a complete, discoverable manual authoring
feature: documentation, Property Panel, toolbar, shortcuts and Canvas editing.
AI-created and manually created text must be the same editable document objects.
A user must be able to create, edit, format, transform, save and recover text
without opening the AI panel or modifying raw data.

This planning task changes only this plan and the App plans index. It does not
change source, tests, schemas, generated templates, dependencies or running services.
Future implementation requires a separate user request. Preserve unrelated work.

## Verified starting point

Commit `700d9fa2cbc1489d995ae0160b7a3a01ce9b4ba8` introduced the foundation:

- `packages/preset/src/components/text.ts`: canonical `text` component, position,
  dimension and `typography` properties, neutral text rendering strategy.
- `packages/preset/src/props/components/text-component.ts`: validated plain text,
  font family/size, normal/bold weight, normal/italic style, alignment, line height,
  letter spacing and solid text color.
- `apps/asyra-design/src/init/capabilities/init-text.ts`: explicit App registration;
  preset defaults are not globally changed.
- `apps/asyra-design/src/properties/text.tsx`: existing single-selection Typography
  controls, mounted in the element properties panel. Extend and verify these
  controls rather than building a competing panel.
- `apps/asyra-design/src/toolbar/tool-button.tsx`: Select, Rectangle, Oval and Pen;
  no Text tool entry.
- AI prepared designs use admitted descriptors and ordinary Core creation. Pixi
  materializes neutral text operations with native Text, not outlined vectors.

Current authority: [Editable text foundation](../specs/editable-text.md).
Related scope: [AI design preparation](../specs/design-preparation.md).
The foundation document does not establish that full manual text authoring exists.

## Target product behavior

### Toolbar and keyboard routing

- Add a Text tool with an English label, accessible name, active state and `T`
  shortcut shown in its tooltip. Follow existing tool switching conventions.
- Use the App icon geometry: 24 x 24 outer box, 16 x 16 drawing area. Do not change
  conversation icons or the specially sized completion bell.
- `T` activates Text only when Canvas owns keyboard focus. Typing in AI chat,
  Property Panel fields or other editable controls must never switch tools.
- `V` returns to Select outside text entry. While entering text, T/V are characters.
- Escape from an armed tool returns to Select; after finishing a new text object,
  return to Select with that object selected. Do not leave an invisible tool active.
- Expose a visible help entry for these shortcuts; do not rely only on key bindings.

### Creating and editing on Canvas

- Text tool + click: create a provisional insertion point and enter plain-text
  editing. Use auto-width sizing, with explicit newlines contributing to height.
- Text tool + drag: choose a text-box width, then edit with wrapping and auto-height.
  A click-sized gesture must follow the click route, not create a degenerate box.
- Double-click existing text enters editing at the hit location. A single click
  selects it. Selecting text in Layers and using an explicit Edit text command
  provides an accessible alternative to double-click.
- Display caret, selection and focus. Support drag selection, word selection,
  keyboard navigation, multiline entry, deletion, select all and plain-text paste.
- Enter inserts a newline; Cmd+Enter on macOS / Ctrl+Enter elsewhere commits and
  exits. Clicking outside commits and follows the clicked control's normal action.
- Escape cancels the current uncommitted editing session and restores its starting
  value; it must not undo earlier completed sessions. An empty new session creates
  no persistent object and no Undo entry. Clearing an existing object's content
  keeps that object; it is not an implicit object-delete command.
- During IME composition, Enter confirms the composition, not the edit session.
  Do not switch tools, commit, delete objects or open shortcuts from composition
  key events. Test Traditional Chinese input alongside English, emoji and newlines.
- Copy/Cut/Paste and Undo/Redo go to the text editor while editing; outside it,
  existing object/document shortcuts retain ownership. Property fields and AI chat
  keep their own clipboard and keyboard behavior.
- Pan and zoom must preserve the caret/selection and editor alignment, including
  high DPI, nested transformed parents and rotated text. Do not misplace an HTML
  editor over an untransformed screen rectangle.
- Locked or hidden objects cannot start editing. Tool switch, panel focus, document
  switch, deletion and unmount must end or cancel the session explicitly, release
  pointer capture, and leave no invisible keyboard handler or orphan overlay.

### Property Panel

Reuse the existing panel and public mutation APIs. Required controls:

| Area | Controls and behavior |
| --- | --- |
| Content | Multiline plain-text content, editable without entering the Canvas editor |
| Typography | Font family, supported weight/style, font size, line height and letter spacing |
| Alignment | Left, center and right; selection and rendering use the same values |
| Color | Existing solid text color, with validated input and visible current value |
| Geometry | Existing X/Y, width/height and rotation controls; clear sizing-mode interaction |
| Sizing | Auto width, Auto height and Fixed size, with explicit active mode |
| Selection | Shared values or a Mixed state for multiple Text objects; preserve per-object content |

- A font-family control must not imply an unavailable font has been installed.
  Report unavailable requested fonts/fallbacks consistently with actual rendering.
  Do not silently download fonts or introduce a paid font service.
- Retain supported normal/bold and normal/italic values initially. Additional font
  weights require an explicit schema/render contract, not unsupported UI choices.
- Validate finite values and units using canonical schemas. Keep invalid drafts
  local, show a concise English error, and preserve the last valid document value.
- Mixed selection allows deliberate shared typography edits. Do not overwrite all
  text contents from one selected object's value. Hide/disable inapplicable fields
  for mixed Text/non-Text selections with an understandable state.
- Panel and Canvas editing share one session policy: moving focus to a panel first
  commits the Canvas edit, then the panel change becomes a distinct user action.
- Rich text runs, per-character styling, font upload, text on paths, vertical
  writing and outline conversion are outside this plain-text completion plan.
  Do not present controls for these unsupported features.

### Sizing, selection and transforms

- Auto width: actual text measurement determines width and multiline height.
- Auto height: the user controls width; actual wrapping determines height.
- Fixed size: the user controls both dimensions. Overflow is visible in the editing
  UI and review result; never silently truncate content, shrink fonts or claim fit.
- Resizing a text box changes layout bounds, not font size. Existing explicit
  scaling behavior must be specified separately if it affects typography.
- Moving, rotating, selecting, grouping, reparenting, locking, hiding, duplicating
  and deleting use existing canonical element commands and hit-testing owners.
- Define a persisted, validated sizing policy before implementation. Old text
  documents with explicit width/height load as Fixed size and keep their geometry.
  Do not infer a new mode from content or store sizing policy in loose metadata.
- Font changes/loading, content, width and typography changes invalidate only the
  relevant measurements. Measurement ownership and reuse must be proven; no second
  App-only layout engine or heuristic geometry that disagrees with the renderer.

## Architecture and data-flow boundaries

Before implementation, extend the product spec and establish the matching Text
Inspector routes under project rules. This plan is not an executable Inspector
or an authorization to extend an unrelated AI performance route.

| Step | Owner and handoff |
| --- | --- |
| Tool/shortcut intent | App input routing selects a Text creation/editing session; respects editable focus and IME |
| Editing session | App session owns provisional content, caret, selection and cancellation; never creates a parallel document model |
| Validated commit | App public mutation APIs hand supported properties/creation to canonical Core owners |
| Layout/measurement | Preset/component and registered measurement owners produce authoritative sizing inputs; adapters supply actual glyph metrics |
| Render/hit | Existing neutral rendering and engine adapters render the committed text and registered editing overlays |
| History/persistence | Existing transaction, document and collaboration owners retain ordinary object identities and props |

A temporary input surface may be used for native text input only after its
ownership, transforms, accessibility and teardown are specified. It must not
replace canonical rendering, persist DOM/HTML, or implement a second font-layout
algorithm. Plain text that looks like HTML remains literal text.

Failure ownership: invalid input belongs to the editing surface/schema; unavailable
metrics/fonts belong to the text layout/measurement owner; invalid targets and
session cancellation belong to App session routing. Retain the last valid document
on failure and provide a visible, actionable state. Do not draw fallback vectors.

### Transactions, persistence and collaboration

- One completed creation/editing session equals one intended Undo commit. Local
  character-level undo during editing must not consume document history entries.
- A panel commit is one action; a continuous supported scrub/drag is one action.
  Focus changes and measurement-only updates must not create duplicate commits.
- Save/reload, duplicate, Undo/Redo and existing export surfaces preserve text,
  typography, dimensions, sizing mode and object identity according to their
  contracts. A transient input overlay is never document/export data.
- Existing AI-created text is editable through every manual entry point; manual
  text remains editable through registered AI actions and ordinary review.
- Remote changes/deletion/locking must not be overwritten by a stale local draft.
  Detect a changed target/version and end the stale session with an explicit
  recovery state that preserves the user's draft for copying/reapplying. Specify
  this against the existing collaboration owner before implementing conflict UI.

## Documentation deliverables

Before claiming full Text authoring, update in the same implementation work:

1. `specs/editable-text.md`: creation/editing state transitions, sizing, keyboard,
   IME, focus, validation, failure, history and collaboration semantics.
2. Relevant App feature/module docs, `API_SURFACES.md`, `REQUEST_ROUTING.md`,
   `CONSTRAINTS.md` and BDD cases: public entry points, supported values and gaps.
3. Framework/Preset and render adapter docs only where their public contracts
   change, especially sizing/measurement ownership and persisted compatibility.
4. User-facing Text guide and shortcut reference: create, edit, format, resize,
   finish/cancel, missing-font/overflow handling and Undo behavior. UI examples are
   English. Link from the existing user documentation index.
5. App portable docs and generated create-app template via the official generator;
   record Text as an explicit capability rather than an AI-only hidden prerequisite.

## Implementation sequence and gates

1. **Contract readiness:** reconcile the existing foundation with this plan; write
   exact Inspector owner steps/routes and permanent acceptance cases. Check naming,
   persisted compatibility and keyboard conflicts before introducing identifiers.
2. **Text sizing and canonical edits:** implement only necessary shared contracts;
   prove unchanged old-document geometry, valid/invalid writes and measurement
   invalidation/work counts. Stop for a missing shared owner; do not patch the App.
3. **Manual creation and session:** toolbar, T routing, click/drag creation,
   Canvas editing, selection, caret, IME, commit/cancel and transaction boundaries.
4. **Complete Property Panel:** all supported fields, sizing modes, mixed selection,
   validation, focus transfer and unavailable-font/overflow states.
5. **Integration and documentation:** persistence, collaboration, AI/manual round
   trips, relevant export behavior, template parity and user guide.

Each slice starts with formal cases. For an existing bug, first prove a failing
regression before changing production code. Run focused gates per owner, then
integration/visual gates after the feature is assembled. No new dependency or
runtime upgrade is authorized by this plan.

### Acceptance cases / definition of done

- From an empty document and with AI closed: T -> click -> type -> commit produces
  one native Text object; select it and edit all supported panel values.
- Drag a box, type multiline text, resize width and switch sizing modes; actual
  glyph wrapping, measured bounds and selection geometry agree.
- Existing AI-created text can be edited in Canvas and panel, saved/reopened,
  duplicated, undone/redone and subsequently revised by AI through the same APIs.
- Chinese IME confirmation, emoji, newline, text selection, clipboard, local undo,
  cancellation and focus handoff work without triggering Canvas/AI shortcuts.
- Empty creation, unchanged edits and cancelled edits produce no unintended object
  or history entry. Two committed editing sessions produce two independent undos.
- Multi-selection, locked/hidden objects, nested/rotated text, large zoom range and
  viewport pan/zoom retain correct interaction and no stale overlay/focus.
- Remote mutation/deletion during editing follows the documented recovery policy;
  old documents retain their prior appearance and editable strings.
- Formal unit/integration cases cover each owner; browser tests cover the real
  toolbar, panel, Canvas, history and persistence. Inspect actual screenshots at
  useful text/caret scales and include a real macOS IME/clipboard smoke test.
- Applicable typecheck, lint, build, naming, Inspector and template gates pass.
  No completion claim from mocked typing, one overview screenshot or AI creation
  alone. Report any uncovered browser/IME/font limitation explicitly.

Current delivery: plan written only. No manual Text feature implementation claimed.
