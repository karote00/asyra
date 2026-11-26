# Place and compose Design components

A container editor owns a catalog of live UI components. Inspect
`editor.uiKeys` or use completion inside `editor.getUI('…')`. A component
handle stays bound to that editor for its lifetime.

## Put a control in your own layout

In React, pass the handle to `DesignUI`. This component owns mounting and
cleanup when its position or editor changes.

```tsx
import { useState } from 'react'
import { AsyraDesign, DesignUI } from '@asyra/design/react'
import type { DesignEditor } from '@asyra/design'

export function Board() {
  const [editor, setEditor] = useState<DesignEditor | null>(null)
  return (
    <>
      <aside>{editor && <DesignUI component={editor.getUI('penToolIcon')} />}</aside>
      <AsyraDesign hideUI onMount={setEditor} />
    </>
  )
}
```

In plain JavaScript, supply the host element directly. The Pen control keeps
its native icon, active state, feature policy and command handler.

```js
import { createDesign } from '@asyra/design'

const editor = await createDesign(document.querySelector('main'))
const pen = editor.getUI('penToolIcon')
const release = pen.mount(document.querySelector('aside'))
// When the host removes its toolbar:
release()
```

Each component has one explicit destination per editor. A new mount takes over.
An older release callback cannot undo that newer placement. Releasing the active
mount returns the control to its configured home when visible. Destroying the
editor removes its mounted controls. With `hideUI: true`, an explicit mount
still works. A selection-specific inspector, an open gradient picker, a
recovery prompt or a virtualized layer depends on its live app state. A handle
for a repeated control places the currently rendered instances together.
Document element, fill and stroke IDs identify individual records.

## Discover and edit a section

```js
const tools = editor.getUI('drawingTools')
Object.keys(tools.items) // All native items in this group
tools.getOrder()        // Current template order, including custom items

const { selectToolIcon, penToolIcon } = tools.items
tools.setItems([selectToolIcon, penToolIcon])
tools.removeAt(1)
tools.insertAfter(selectToolIcon, penToolIcon)

const view = editor.getUI('view')
const restore = view.insertAt(0, editor.getUI('penToolIcon'))
restore()
```

A group has native item names and ordered composition methods. A leaf such
as `penToolIcon` has a mounting handle. Position and Dimension also support
their numeric field descriptors. A host-defined item supplies an ID and a
mount function. Its cleanup runs when it leaves the template.

```js
const heading = editor.getUI('fillHeading')
const remove = heading.insertAt(1, {
  id: 'brandLabel',
  mount(container) {
    const label = container.ownerDocument.createElement('small')
    label.textContent = 'Brand colors'
    container.append(label)
    return () => label.remove()
  }
})
```

| Start with | Examples of available items |
| --- | --- |
| `workspace` | `toolbar`, `layers`, `properties`, `canvasMenu`, `selectionMenu` |
| `commands` | `drawingTools`, `toolbarExtensions`, `toolbarActions` |
| `toolbarActions` | `action.undo`, `action.redo`, and actions installed on this editor |
| `layerRows` | `layerIdentity`, `layerActions` |
| `geometry` | `positionRow`, `dimensionRow`, `rotationRow` |
| `appearance` | `fills`, `strokes` |
| `textFields` | Font family, style, spacing and alignment rows |
| `vectorPoint` | `pointHeading`, `anchorSettings`, `pointCoordinates` |
| `gradient` | `gradientType`, `gradientStrip`, `gradientStops` |
| `colorControls` | `colorSaturation`, `colorSliders`, `colorChannels` |
| `canvasMenu` | `groupCommand`, `ungroupCommand` |
| `feedback` | `notifications`, `recovery` |

To inspect every group installed on a particular editor:

```js
console.table(editor.uiKeys.map(id => {
  const component = editor.getUI(id)
  return { id, items: 'items' in component ? Object.keys(component.items).join(', ') : '' }
}))
```

## Look up the control selected in DevTools

Select a native element in Elements and use the editor that owns it:
```js
const marker = $0.closest('[data-component], [data-inspector-row]')
const component = editor.getUI(marker.dataset.component ?? marker.dataset.inspectorRow)
```

For an externally mounted inspector row, select its marked host across the
open shadow boundary. Host-defined items use `data-template-item` and their
host-supplied ID. Canvas text input, selection handles and the drawing surface
follow canvas coordinates and the document editing session.

In the Elements panel, select the wrapper marked
`data-inspector-row="positionRow"`. The value is the exact ID to pass to the
editor that owns the row:

```js
const position = editor.getUI('positionRow')
Object.keys(position.items) // ['x', 'y']
```

| Row ID | Default fields in display order | Panel |
| --- | --- | --- |
| `positionRow` | `x`, `y` | Properties |
| `dimensionRow` | `width`, `height` | Properties |

Use completion inside `editor.getUI('…')` to see available templates and
`position.items.` for the native anchors. A custom input inserted into a row
gets its own `data-inspector-field`. For example, binding the numeric field
`abc` of a `marker` node produces `data-inspector-field="marker.abc"`.
The fields currently visible in the DOM reflect the order configured for that
editor. The native anchors remain available on `items`.

## Find the right document

Use the editor returned by `await createDesign(host)` or delivered to React's
`onMount`. Each editor has its own document and registry. In Elements, expand
the board's iframe and inspect its document. React's `<asyra-design>` host
also has an open shadow root around the iframe. For example, in the console
with one React board on the page:

```js
const board = document.querySelector('asyra-design')
const editor = board.editor // available after design-ready
const workspace = board.shadowRoot.querySelector('iframe').contentDocument
const rows = workspace.querySelectorAll('[data-inspector-row]')
console.table(Array.from(rows, row => ({ row: row.dataset.inspectorRow })))
```

With the plain JS container API, use `host.querySelector('iframe').contentDocument`.
Select an element on the canvas to see its properties. Closing a panel or
setting `hideUI` removes the built-in panel from that document.

## Debug a moved row

Given `uiTargets: { positionRow: 'my-toolbar' }`, `positionRow` identifies
the control and `my-toolbar` is the HTML ID of a host container. Inspect that
container in the host document:

```js
const target = document.getElementById('my-toolbar')
const row = target.querySelector('[data-inspector-row="positionRow"]')
const template = editor.getUI(row.dataset.inspectorRow)
```

Expand the open shadow root **inside the row** to inspect its styled inputs.
A document-level CSS query stops at a shadow boundary. In DevTools, selecting
an input and evaluating `$0.dataset.inspectorField` reveals its field ID.
Clear the target entry to return the row to its panel with the same ID.

### Updating existing selectors

| Previous selector | Current selector |
| --- | --- |
| `[data-tool-group="positionRow"]` | `[data-inspector-row="positionRow"]` |
| `[data-tool-group="dimensionRow"]` | `[data-inspector-row="dimensionRow"]` |
| `[data-tool-group="myCommands"]` for a custom group | `[data-extension-group="myCommands"]` |
| `[data-tool-slot="properties.top"]` | `[data-ui-slot="properties.top"]` |

## Workspace marker reference

Use the nearest `data-component` wrapper for the SDK lookup. The following
attributes identify individual controls, placement and document records. Repeated controls can be scoped to the
owning panel, fill, stroke or layer.

| UI | What to look for |
| --- | --- |
| Workspace and panels | `data-editor-workspace="design"` contains panels identified by `data-editor-panel`. Panel values are `toolbar`, `layers`, `properties` and `canvas`. |
| Toolbar | `data-toolbar-section="commands"` or `"view"`, `data-toolbar-action` with the tool or action ID, and `data-toolbar-readout="zoom"`. The borrowed-canvas toolbar also marks its panel and actions. |
| Extension mounts | `data-ui-slot` identifies a default outlet, e.g. `properties.top`. `data-extension-group` identifies a host-supplied group by its registered ID. The extension supplies its inner DOM. |
| Layers | `data-layer-list="tree"`, `data-layer-element-id` with the document element ID, and `data-layer-action` for group disclosure, lock or visibility. Virtualized rows appear while rendered. `data-layer-status` marks projection feedback. |
| Properties | `data-inspector-section` identifies geometry, typography, fills, strokes and vector-point controls. `data-inspector-field` identifies editable properties, including rotation and typography. `data-inspector-status` marks empty selection. |
| Typography and vectors | `data-text-action`, `data-text-alignment`, `data-vector-setting` and `data-vector-field`. Number steppers use `data-number-step`. |
| Fills and strokes | Scope a query with `[data-fill-id]` or `[data-stroke-id]`. Within it use `data-fill-field`, `data-stroke-field`, `data-fill-action` or `data-stroke-action`. List-level add buttons belong to the section; empty and mixed feedback use `data-fill-status` or `data-stroke-status`. |
| Color picker | `data-color-picker="root"` contains the trigger. The open `data-color-picker="popover"` is rendered in a portal. `data-color-control` identifies toggle, eyedropper, saturation, hue, alpha and format. `data-color-channel` is the zero-based channel index for the current format. |
| Gradients | `data-fill-mode` selects solid or gradient. The open `data-gradient-editor` carries the fill ID. `data-gradient-control`, `data-gradient-field`, `data-gradient-action` and `data-gradient-readout` identify its controls. `data-gradient-stop` and `data-gradient-handle` carry the current stop index. |
| Canvas interactions | `data-canvas-editor="text"`, `data-context-menu="canvas"` and `data-menu-command`. `data-ui-slot="selectionMenu"` is the selection outlet. |
| Notifications and recovery | `data-canvas-overlay` identifies notifications or recovery. Find an individual message by `data-toast-id` and controls by `data-notification-action` or `data-recovery-action`. |

The standalone Design app also marks its conversation panel and drawing
progress. Conversation uses `data-conversation-section`, `data-conversation-field`
and `data-conversation-action`. Saved tool entries use `data-library-tool` and
`data-library-action`. The packed editor contains the non-conversation workspace.
Canvas-drawn shapes, handles and guides are pixels on the drawing surface;
inspect document elements through the editor APIs.
