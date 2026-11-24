# @asyra/design

Install `@asyra/design` and its peer `@asyra/canvas`. Add a canvas to your page
and pass that element to the editor.

```html
<canvas id="drawing" width="800" height="500"></canvas>
```

```js
import { createDesign } from '@asyra/design'

const editor = await createDesign(document.querySelector('#drawing'))
```

Drag to draw a rectangle. The toolbar above the canvas provides Rectangle,
Select, Undo and Redo. Call `await editor.destroy()` when removing the editor.

## Customize the tools

Pass an ordered toolbar list to choose the built-in controls and add your own
named actions. A callback receives the same Design tools as the host. For
example, inserting a card below creates one undoable rectangle.

```js
const editor = await createDesign(canvas, {
  actions: {
    card: {
      label: 'Add card',
      run(tools) {
        tools.drawRectangle({ x: 40, y: 40, width: 160, height: 80 })
      }
    }
  },
  toolbar: ['select', 'card', 'undo', 'redo']
})
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
