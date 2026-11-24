# @asyra/design

Place the editor directly in your page. Install `@asyra/design` and its
`@asyra/canvas` peer.

### JavaScript

```js
import '@asyra/design/element'
```

```html
<asyra-design></asyra-design>
```

The element and framework components mount the workspace from
`apps/asyra-design`. It includes Select, Rectangle, Oval, Pen and Text,
path and text editing, the layer tree, grouping and hierarchy changes,
the property inspector, fills and strokes, gradient handles, pan, zoom,
keyboard shortcuts and Undo/Redo. Each editor owns its input, canvas,
menus and styles. The embedded workspace omits the conversation panel,
its shortcut and its agent runtime.

### React

```tsx
import { AsyraDesign } from '@asyra/design/react'

export default function App() {
  return <AsyraDesign />
}
```

### Vue

```vue
<script setup>
import AsyraDesign from '@asyra/design/vue'
</script>

<template>
  <AsyraDesign />
</template>
```

The Vue entry is a single-file component for projects with Vue SFC support.

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
React 19 and Vue can pass an object as `options={options}` and
`:options="options"`, respectively. In Angular use `[options]="options"`.
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
The default toolbar includes registered actions in declaration order.
An extension can export an object with its own `actions` and be shared across
products. Install one or more in a single call:

```js
const editor = await createDesign(container, { extensions: [cardTools, reviewTools] })
```

Each extension receives the same workspace tools. Duplicate action IDs fail
at startup.

For a fully host-owned UI, use `createDesign(canvas, { toolbar: false })`
and bind your own controls to `editor.setTool('select')`, `editor.undo()` and
`editor.redo()`. Load a previous `await editor.save()` result with the
`document` option.

Applications that already manage their own `createCanvas(target)` binding
can call `await attachDesignTools(binding)` from this package. That entry
provides the tools directly. The caller owns the UI and calls
`await binding.destroy()` to release the session.

## Document and collaboration settings

For a local document, pass a previously saved snapshot as `{ document }`.
For a shared document, supply its service and identity at startup:

```js
const editor = await createDesign(container, {
  collaboration: { endpoint: 'wss://design.example.com/collaboration', fileId: 'board-7' }
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
