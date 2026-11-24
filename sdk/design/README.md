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
session on removal. Each instance has its own document and history. The
default height is 480px and can be set with CSS. Drag to draw, or choose
Select, Undo or Redo from the toolbar.

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
release it. Passing an existing canvas draws on that exact element and
preserves it on disposal.

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

For a fully host-owned UI, use `createDesign(canvas, { toolbar: false })`
and bind your own controls to `editor.setTool('select')`, `editor.undo()` and
`editor.redo()`. Load a previous `await editor.save()` result with the
`document` option.

Applications that already manage their own `createCanvas(target)` binding
can call `await attachDesignTools(binding)` from this package. That entry
provides the tools directly. The caller owns the UI and calls
`await binding.destroy()` to release the session.
