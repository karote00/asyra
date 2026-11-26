# @asyra/design

## Draw your first board in React

In an existing React 19 project, install the Design SDK:

```sh
npm install @asyra/design
```

Paste this component into your app:

```tsx
import { AsyraDesign } from '@asyra/design/react'

export default function App() {
  return <AsyraDesign storageKey="my-board" />
}
```

Choose Rectangle, drag on the board, then refresh. Your drawing reopens.
Use a distinct key for each board. For a temporary board, use
`<AsyraDesign />`. The editor fills its parent or the viewport and loads its
own styles. Canvas is installed as a dependency of Design.

### Access the editor

Use `onMount` when another control needs the editor. It receives the ready
instance once per board. Changing the board key delivers the next editor.

```tsx
import { useState } from 'react'
import { AsyraDesign } from '@asyra/design/react'
import type { DesignEditor } from '@asyra/design'

export function Board() {
  const [editor, setEditor] = useState<DesignEditor>()
  return <>
    <button disabled={!editor} onClick={() => editor?.zoomFit()}>Fit drawing</button>
    <AsyraDesign onMount={setEditor} />
  </>
}
```

### Local autosave

The same option works with `createDesign(container, { storageKey: 'my-board' })`.
Committed edits, Undo and Redo are saved automatically. Reset clears the saved
board. Existing localStorage snapshots under the same key migrate on first open. The SDK validates the snapshot and waits for a successful IndexedDB import before removing the old value. New edits write only to IndexedDB. Use separate keys for independent boards. For a shared board, use the
collaboration service, which owns persistence for all participants.

### Choose an integration

| Product requirement | Starting point | Host responsibility |
| --- | --- | --- |
| Embed the Design app's vector, text, layer and appearance tools | React 19 component or the web component below | Size the container and choose a storage key for local autosave |
| Build branded controls for the full workspace | Pass a container to `createDesign(container, { hideUI: true })` | Call `editor.common` and subscribe to the keys in `editor.observeKeys` |
| Ship a separately installed tool and its controls | Supply an extension with actions and UI groups | Choose placement and apply each customer's feature availability |
| Add drawing to an existing HTML canvas | Pass that canvas to `createDesign(canvas)` | Use the lightweight rectangle, selection and history API |
| Add a persistent domain node with rectangle or oval geometry | Register a node extension | Give the type and fields stable IDs across document versions |
| Implement custom pointer gestures or a new renderer | Compose the underlying framework directly | Own input handling and rendering |
| Collaborate on a shared document | Configure `collaboration` with a file ID and endpoint | Operate the collaboration and persistence services, authorize access and measure the intended load |

### JavaScript

```js
import { createDesign } from '@asyra/design'

const editor = await createDesign(document.getElementById('board'), {
  storageKey: 'my-board'
})
```

Use a container such as `<main id="board"></main>` for the full workspace.
A host using custom elements can import `@asyra/design/element` and place
`<asyra-design></asyra-design>` in its HTML. Both entries mount the workspace from
`apps/asyra-design`. It includes Select, Rectangle, Oval, Pen and Text,
path and text editing, the layer tree, grouping and hierarchy changes,
the property inspector, fills and strokes, gradient handles, pan, zoom,
keyboard shortcuts and Undo/Redo. Each editor owns its input, canvas,
menus and styles. The embedded workspace omits the conversation panel,
its shortcut and its agent runtime.

A host can put existing app commands in its own toolbar order. The buttons,
`runAction` and direct editor methods use the app's selection, history and viewport.

```js
import { createDesign } from '@asyra/design'

const editor = await createDesign(container, {
  toolbar: [
    'rectangle',
    'group',
    'ungroup',
    'deleteSelectedElement',
    'zoomFit',
    'undo'
  ]
})
await editor.runAction('zoomFit')
```

### Angular

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import '@asyra/design/element'

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '<asyra-design></asyra-design>'
})
export class App {}
```

The browser element starts a Design editor at its position and releases the
session on removal. Each instance has its own document and history.
To move a live editor between containers with its selection and undo history,
use the browser's `parent.moveBefore(editorElement, null)`. Ordinary DOM
reparenting recreates the embedded browsing context and reopens the document.

Inside a sized panel the editor fills its content area and follows resizes
automatically. Without a definite parent height it uses the visible
viewport height. As the sole content of a page it fills the viewport by
default. Application-defined margins and padding are respected. The toolbar
and drawing surface share the available space.

Choose a drawing tool in the toolbar, then draw on the canvas.

Pass the initial `options` property to customize the actions and toolbar.
In React 19 pass the object as `options={options}`. A JavaScript host can assign the same object to the element’s `options` property.
The native element emits `design-ready` with the editor in `event.detail`
and exposes the mounted instance through its `editor` property.

## Mount on an existing container or canvas

```js
import { createDesign } from '@asyra/design'

const editor = await createDesign(container)
```

Set the container height to choose the size. Call `await editor.destroy()` to
release it. A container gets the full workspace. Passing an existing HTMLCanvasElement
selects the lightweight Rectangle/Select API and preserves the borrowed canvas
on disposal. In TypeScript, a known container such as an `HTMLDivElement`
exposes the workspace methods. With a general `HTMLElement`, narrow the
returned editor with `'toolGroups' in editor` before calling workspace methods.

If the host moves during initialization, retry mounting after the move settles.
If a resource fails to load during a reset, retry `await editor.reset()` on the
same editor. Feature changes issued during a reset apply to the reopened session.

## Customize the tools

Pass an ordered toolbar list to choose the built-in controls and add your own
named actions. A callback receives the same Design tools as the host. For
example, inserting a card below creates one undoable rectangle.

```js
const options = {
  actions: {
    card: {
      label: 'Add card',
      run(tools) {
        tools.drawRectangle({ x: 40, y: 40, width: 160, height: 80 })
      }
    }
  },
  toolbar: ['select', 'card', 'undo', 'redo']
}
```

Call `await editor.runAction('card')` to run that action from your application.
The default toolbar includes actions from action-only extensions in declaration order. Extensions with UI groups render their own controls.
An extension can export an object with its own `actions` and be shared across
products. Install one or more in a single call:

```js
const editor = await createDesign(container, {
  extensions: [cardTools, reviewTools]
})
```

Each extension receives the same workspace tools. Built-in feature IDs are
reserved. Use a unique action ID such as `insertBadge` and include that ID in
the toolbar. Reusing a built-in ID (including `group` or `fills`), or another
action's ID, fails at startup.

### Add UI to a workspace

Move a built-in row by naming its host element. Position moves into the
toolbar below. Dimension stays in its usual place.

```tsx
import { AsyraDesign } from '@asyra/design/react'

export function Board() {
  return <>
    <aside id="my-toolbar" />
    <AsyraDesign uiTargets={{ positionRow: 'my-toolbar' }} />
  </>
}
```

For explicit group ordering or installation alongside your own UI, install
`@asyra/design-ui` and pass the group descriptors:

```tsx
import { positionRow, dimensionRow } from '@asyra/design-ui'

<AsyraDesign
  options={{ ui: [positionRow, dimensionRow] }}
  uiTargets={{ [positionRow.id]: 'my-toolbar' }}
/>
```

React accepts `hideUI`, `disabledFeatures`, `uiTargets`, `toolbar`,
`panels` and `storageKey` directly. A direct prop overrides the same key in
`options`. Change presentation or feature props to update the current board.
Changing `storageKey` opens the corresponding board instead. In plain JS,
`editor.setPresentation({ panels: { layers: false } })` replaces the current
presentation settings; omitted keys return to their defaults.

Each row has one set of controls and follows the current selection.
Changing `uiTargets` moves the rows on the mounted React board. Remove an
entry to return that row to the inspector. In JavaScript use the same
initial options and call `editor.toolGroups.setTargets(targets)` for later
changes. Each target must already exist in the host document. An unknown
group or missing element reports its ID. With `hideUI: true`, external
controls stay available and default inspector slots are hidden.

Use `disabledFeatures: ['geometry']` to block geometry edits. When you install
a row through `ui`, its ID also appears in `editor.features`, so you can hide
that row independently with `disabledFeatures`. The editor owns Undo and Redo
for edits from either location.

### Insert a control between X and Y

Call `editor.getUI('positionRow')` on a container editor, including the editor
received by React's `onMount`. Its `items` exposes X and Y; Dimension exposes
width and height. Both rows work in their default position without installing
the optional UI package.

Bind a numeric field to a registered node and insert it between X and Y.
The SDK reads the selected node, applies edits and follows Undo and Redo.

```js
import { createDesign, numberField } from '@asyra/design'

const marker = { id: 'marker', node: { name: 'Marker', fields: { abc: 0 } } }
const editor = await createDesign(container, { extensions: [marker] })
const position = editor.getUI('positionRow')
const z = numberField(marker, 'abc', { label: 'Z' })
const removeZ = position.insertAt(1, z)

const id = editor.createNode(marker, { x: 10, y: 20, width: 50, height: 40 })
if (id) editor.select([id])
```

Indices start at zero. Use the row length to append, `removeAt(index)` to
remove the current item at a position, or `removeZ()` to remove only your
own insertion. The field displays one selected marker's value and becomes
read-only when its feature is disabled. `editor.updateSelectedNodes(marker,
{ abc: 12 })` edits the selection in a single command when every selected
element is a marker. Document snapshots include the field value.

For example, a host that already has a numeric control descriptor can choose
the complete order or insert just its contribution:

```js
const position = editor.getUI('positionRow')
position.setItems([position.items.x, myCustomZ, position.items.y])
```

Independent extensions can use the smaller operation:

```js
const removeZ = position.insertAfter(position.items.x, myCustomZ)
// On extension teardown:
removeZ()
```

The template owns the grid, spacing, label and number input. Moving Position
with `uiTargets` moves all its current controls together. For a different
layout or a custom DOM component, use a [host-mounted UI group](#mount-extension-ui).

A numeric descriptor connects the control to your model. For a board with
a registered `marker` node and numeric `abc` field, this example edits one
selected marker. It refreshes on selection and committed changes, including Undo:

```js
function selectedValue() {
  const ids = editor.getSelection()
  if (ids.length !== 1) return null
  const value = editor.getElementProperties(ids[0], ['abc'])?.abc
  return typeof value === 'number' ? value : null
}

const myCustomZ = {
  kind: 'number',
  id: 'markerDepth',
  label: 'Z',
  getValue: selectedValue,
  subscribe(notify) {
    const offSelection = editor.observe('elementSelection', notify)
    const offEdit = editor.common.transaction.subscribeToTransactionStatus(event => {
      if (event.status === 'committed' && event.changeCount) notify()
    })
    return () => { offSelection(); offEdit() }
  },
  setValue(abc) {
    if (selectedValue() !== null) {
      editor.common.element.updateElementProperties(editor.getSelection(), { abc })
    }
  }
}
```

Returning `null` displays an unavailable input. The descriptor's subscription
is active while its control is mounted. Its write callback owns the edit.
Row composition is local to each editor and survives `reset()`. Saving a board
stores the resulting document values. The host supplies the UI composition
when it opens another editor.

Each item ID must be unique within its row. Relative insertion places the item
immediately after its anchor. The returned removal function is idempotent.
`setItems` replaces the whole order and retires earlier removal functions.
An invalid item, missing anchor, or duplicate ID leaves the row intact.

### Store a domain node

Supply a node definition alongside its actions. Here each approval has its
own persisted type and status. Drawing, selection, geometry and history use
the workspace's existing commands.

```js
const approval = {
  id: 'approval',
  node: {
    name: 'Approval',
    shape: 'oval',
    fillColor: '#e24989',
    fields: { status: 'pending', reviewed: false }
  },
  actions: {
    insertApproval: {
      label: 'Add approval',
      run(editor) {
        editor.common.element.createElement({
          type: 'approval',
          workspacePosition: { x: 140, y: 100 },
          width: 100,
          height: 60,
          fields: { reviewed: true }
        })
      }
    }
  }
}

const editor = await createDesign(container, {
  storageKey: 'reviews',
  extensions: [approval]
})
await editor.runAction('insertApproval')
```

Choose a unique alphanumeric node ID starting with a letter. Field names may
also use underscores after the first letter. Supply string, finite number or
boolean defaults. The current built-in geometries are `rectangle` (default)
and `oval`. Use `editor.common.element.updateElementProperties([id], {
status: 'approved' })` to edit a node. Read its fields with
`editor.getElementProperties(id, ['status'])`.

Install the same definition whenever opening the document. Disable its tools
with `await editor.setDisabledFeatures(['approval'])`. Existing approvals
retain their geometry, selection and readable fields. Creation, extension
actions and writes to approval-specific fields are blocked until re-enabled.

### Mount extension UI

An extension can supply actions and one or more UI groups. Give each group a
stable ID, a placement and a synchronous mount function that releases its
listeners and DOM on cleanup. Create DOM in the supplied container's document.
Use the editor passed to that mount for commands and narrow subscriptions.

```js
const extension = {
  id: 'navigationTools',
  actions: { fit: { label: 'Fit drawing', run: editor => editor.zoomFit() } },
  ui: [{
    id: 'navigation',
    label: 'Navigation',
    placement: 'properties.top',
    mount({ container, editor }) {
      const button = container.ownerDocument.createElement('button')
      button.textContent = 'Fit drawing'
      button.onclick = () => editor.runAction('fit')
      container.append(button)
      const stop = editor.observe('disabledFeatures', () => {
        button.disabled = !editor.isFeatureEnabled('fit') || !editor.isFeatureEnabled('zoomFit')
      })
      return () => { stop(); button.remove() }
    }
  }]
}
const editor = await createDesign(host, {
  extensions: [extension],
  uiTargets: { navigation: 'my-toolbar' }
})
```

An extension can declare a unique feature ID. Pass that ID in `disabledFeatures` to disable all of its actions and unmount its tool groups. Enabling it mounts each group in its configured target. The same option works at creation and during a session. For example, a host can apply a subscription change with `await editor.setDisabledFeatures(paid ? [] : ['navigationTools'])`. If a tool group fails to mount during activation, the promise rejects and the previous feature policy remains active. Fix the mount and retry the same list. This replaces the entire disabled list. Include any other features the host wants to keep disabled. In React, update the option on the existing component:

```jsx
<AsyraDesign options={{ extensions: [extension], disabledFeatures: paid ? [] : ['navigationTools'] }} />
```

Built-in outlets are `properties.top`, `toolbar.top` and `selectionMenu`
(visible with a selection). Create the target element in the host document
before opening the board. To change it later, call
`editor.toolGroups.setTargets({ navigation: 'other-toolbar' })`. Passing
`{}` restores each group's declared placement. To bind a DOM element directly,
use `const release = editor.toolGroups.mount('navigation', element)` and call
`release()` when finished. A group with `placement: 'manual'` waits for a
host target. External mounts also work with `hideUI: true`.

For a draggable toolbar, move the host container using the application's own
pointer handlers and CSS. Its mounted controls follow it automatically. The
host can store the container position as a user preference.

### Build the controls in your own UI

Mount the full workspace on a container and set `hideUI`. The following
example connects a host button and a selection label using ordinary DOM APIs.

```js
import { createDesign } from '@asyra/design'

const editor = await createDesign(document.querySelector('main'), {
  hideUI: true
})
document.querySelector('#insert-label').onclick = () =>
  editor.createText('Label', { x: 32, y: 40, width: 160, height: 40 })

const stop = editor.observe('elementSelection', (ids) => {
  document.querySelector('output').textContent = Array.from(ids).join(', ')
})
// When the host unmounts:
const close = async () => {
  stop()
  await editor.destroy()
}
```

`getLayers()` returns the workspace ID, ordered layer IDs and per-layer data.
`getElementProperties(id, fields?)` reads computed properties, including
fill and stroke records with the IDs used for editing. Use `observe(key, fn)`
for a current value and subsequent updates. Read `editor.observeKeys` for the
complete read-only list accepted by this workspace. It is built at startup from
registered sources and refreshed when the session is replaced. Disabling an
editing command keeps its readable document properties available. Examples include
`elementDataMap`, `flattenedElementIds`, `elementSelection`, `primaryTool`,
`hoveredElementId`, `viewportPosition`, `zoom`, `fills`, `strokes` and `collaboration`.
Observations survive reset, and unsubscribe or destroy releases them.
For a one-time read of the current interaction state, call
`editor.common.systemContext.getSnapshot()` on the workspace editor.

Text creation, marquee bounds and path anchors use workspace coordinates.
`moveElements` takes absolute element positions in their parent.
`zoomTo(scale, center)` and gradient handle commands take pixel coordinates
relative to the embedded viewport. A gradient stored through `updateFill`
uses normalized gradient handles and stops. `moveLayers` takes ordered
element IDs, a target parent ID and a target insertion index.
The [feature map](./FEATURES.md) lists each editing command and availability flag.

Applications that already manage their own `createCanvas(target)` binding
can call `await attachDesignTools(binding)` from this package. That entry
provides the tools directly. The caller owns the UI and calls
`await binding.destroy()` to release the session.

## Document and collaboration settings

Choose one persistence owner: `storageKey` for browser autosave, `document` for a host-managed snapshot, or `collaboration` for a server-owned document. Omitting all three opens a temporary board. Browser storage errors surface through the browser error handler.
On the React or web component, a new `options.document` reference opens a
fresh editor, as does a change to the storage key or collaboration endpoint, file ID or actor
ID. Save pending edits before switching. Keep the snapshot reference stable
during unrelated renders. Wait for `design-ready` or read the current
element's `editor` after readiness before sending commands. A feature-only
update keeps the live editor. For two empty boards with no snapshot or room
identity, give the React component a different `key={boardId}`.

For a shared document, supply its service and identity at startup:

```js
const editor = await createDesign(container, {
  collaboration: {
    endpoint: 'wss://design.example.com/collaboration',
    fileId: 'board-7'
  }
})
```

Use the Design app's collaboration server and document persistence backend.
Configure the server to allow the host application's origin. The server owns
the shared document and recovery. Each editor generates its own actor ID by
default.

To hide a panel, pass `panels: { layers: false }` or
`panels: { properties: false }`. Set `toolbar: false` to hide the toolbar.
Workspace actions can use `setTool`, `drawRectangle`, `drawOval`, `select`,
`getSelection`, `updateElement`, `group`, `ungroup`, `undo`, `redo` and
`save`. The app owns validation and document history.

### Disable editing features or hide the built-in UI

```js
import { createDesign } from '@asyra/design'

const editor = await createDesign(container, {
  disabledFeatures: ['text'],
  hideUI: true
})
```

Omit both options for the complete default workspace. The custom element accepts
the same object through its `options` property before connection.

A disabled feature stays registered and its code stays in the bundle.
For example, disabling `fills` blocks fill edits in the built-in Inspector
and through SDK commands called by custom controls.
Existing fills still render, load and save. A custom Inspector can keep reading
them through `editor.observe('fills', listener)`.

| Question | Workspace API |
| --- | --- |
| Which feature IDs does this editor accept, including disabled IDs and registered extensions? | `editor.features` |
| Can the user choose the pen tool now? | `editor.isFeatureEnabled('pen')` |
| Is the pen the active tool? | `editor.getTool() === 'pen'` |

`setDisabledFeatures(ids)` replaces the **entire** disabled list on the mounted
editor. Keep every restriction that still applies in the next array:

```js
// Text editing stays disabled while fill editing is switched off and back on.
await editor.setDisabledFeatures(['text', 'fills'])
await editor.setDisabledFeatures(['text'])

// Enable all registered features.
await editor.setDisabledFeatures([])
```

The document and collaboration connection stay open during these changes.
Custom controls can subscribe with `editor.observe('disabledFeatures', listener)`.
TypeScript users can import `WorkspaceFeature` for built-in workspace IDs.

The full workspace accepts these feature IDs:

- Primary tools: `select`, `rectangle`, `oval`, `pen`, `text`. Pen includes
  path editing. Text includes the inline editor and typography fields.
- Commands: `undo`, `redo`, `group`, `ungroup`, `deleteSelectedElement`, `reset`.
- Gestures: `hoverElement` (element hover feedback), `moveElements` (canvas drag), `moveLayerHierarchy` (Layers drag),
  `pan`, `zoom` (wheel zoom), `zoomFit`.
- Property edits: `geometry` (numeric position, dimensions and rotation),
  `fills` (including gradient controls), `strokes`, `lock`, `visibility`, `rename`.
- IDs of actions registered by the host or its extensions.

A borrowed canvas supports `select`, `rectangle`, `undo`, `redo` and its
registered action IDs. The editor reports a null tool when no tool is active.
Selection produced by an enabled editing command, such as grouping, belongs
to that command. General geometry and appearance controls can still operate
on objects originally created by a disabled tool.

`hideUI: true` hides the toolbar, panels, context menu and session notices.
Active tools retain their canvas feedback and inline text input. Keyboard
commands and the SDK continue to work. Hosts can observe `collaboration` and show their own recovery controls when
`recoveryAvailable` is true. Await `retrySaving()` to persist and reopen the
session, or call `downloadRecoveryFile()` to export its recovery document.

See the [feature map](./FEATURES.md) for each editing entry, shortcut and document flow.
