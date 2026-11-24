# @asyra/canvas

Pass an HTML canvas from your page to the browser SDK. Your application owns the
DOM element, toolbar and layout. Give the canvas a CSS size for responsive layouts.

```html
<canvas id="diagram" width="800" height="480" tabindex="0" style="touch-action:none"></canvas>
```

```js
import { createCanvas } from '@asyra/canvas'

const editor = await createCanvas(document.querySelector('#diagram'))
```

Drag to draw a rectangle. Bind your own controls to editor.setTool('select'),
editor.setTool('rectangle'), editor.undo() and editor.redo(). A focusable
canvas supports Escape and Cmd/Ctrl+Z or Cmd/Ctrl+Shift+Z.

Use a fresh canvas with no pre-existing drawing context. One live editor owns
each target. Multiple canvases have independent documents and histories.
Save with await editor.save(), store the returned data in your application,
and pass it as the document option on initialization. Await editor.destroy()
before removing the canvas from your application.
