# @asyra/design

Place the editor directly in your page. Install `@asyra/design` and its
`@asyra/canvas` peer.

### React

```tsx
import { AsyraDesign } from '@asyra/design/react'

export default function App() {
  return <AsyraDesign />
}
```

### JavaScript

```js
import '@asyra/design/element'
```

```html
<asyra-design></asyra-design>
```

The web component and React entry mount the workspace from
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
on disposal.

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

Each extension receives the same workspace tools. Duplicate action IDs fail
at startup.

### Place and move extension UI

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
  toolLayout: JSON.parse(localStorage.getItem(userLayoutKey) ?? '{}'),
  onToolLayoutChange: layout => localStorage.setItem(userLayoutKey, JSON.stringify(layout))
})
```

An extension can declare a unique feature ID. Pass that ID in `disabledFeatures` to disable all of its actions and unmount its tool groups. Enabling it mounts each group at its saved position. The same option works at creation and during a session. For example, a host can apply a subscription change with `await editor.setDisabledFeatures(paid ? [] : ['navigationTools'])`. This replaces the entire disabled list. Include any other features the host wants to keep disabled. In React, update the option on the existing component:

```jsx
<AsyraDesign options={{ extensions: [extension], disabledFeatures: paid ? [] : ['navigationTools'] }} />
```

Built-in outlets are `properties.top`, `toolbar.top` and `selectionMenu`
(visible with a selection). During a drag, dashed outlines mark the available docking areas. The whole Properties panel and editor toolbar accept a drop. A solid outline marks the current target. Drag the grip to a free position on the canvas or host page, to another outlet, or drop it before
another group to reorder. For keyboard controls or product-owned menus call
`editor.toolGroups.move('navigation', 'toolbar.top', 0)`. To place a group in a
host element, use `const unmount = editor.toolGroups.mount('navigation', element)`
and release the mount with `unmount()`. Configure `placement: 'manual'` to wait
for a host element. Manual mounts also work with `hideUI: true`.

Call `editor.toolGroups.float(id, { x, y })` to place a group in host viewport coordinates (CSS pixels from the top left). Floating groups stay within the visible viewport. The layout maps outlet names to ordered group IDs and stores free positions in `layout.floating`, keyed by group ID. The host chooses the
preference storage and user key. Restore a profile with `setLayout(layout)` or
restore extension defaults with `setLayout({})`. Moving groups preserves the
document and editing session. A hidden outlet has no visible controls.

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
for a current value and subsequent updates. Examples include
`elementDataMap`, `flattenedElementIds`, `elementSelection`, `primaryTool`,
`hoveredElementId`, `viewportPosition`, `zoom`, `fills`, `strokes` and `collaboration`.
Observations survive reset, and unsubscribe or destroy releases them.

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

For a local document, pass a previously saved snapshot as `{ document }`.
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
  disabledFeatures: ['pen', 'text'],
  hideUI: true
})
```

Omit both options for the complete default workspace. The custom element accepts
the same object through its `options` property before connection. Each editor
owns its live runtime policy. Call `await editor.setDisabledFeatures(ids)` to replace it. The same document, collaboration connection and editor stay mounted. Subscribe with `editor.observe('disabledFeatures', listener)` to update custom controls. All instances use the same package
and bundle. Disabled tools disappear from the controls, ignore their gestures
and shortcuts, and reject explicit SDK requests. Existing document content
still loads, renders and saves. A custom action receives the same guarded tools.

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
