# @asyra/design

Install @asyra/canvas and @asyra/design. Attach design tools to a binding on
a fresh canvas in your page.

```js
import { createCanvas } from '@asyra/canvas'
import { attachDesignTools } from '@asyra/design'

const surface = createCanvas(document.querySelector('canvas'))
const design = await attachDesignTools(surface)
// Drag to draw a rectangle. Bind your product's buttons to these commands.
design.setTool('select')
await design.undo()
await design.redo()
```

The design session owns shape input, selection, history and serialization.
Pass a saved document from design.save() as the document option to
attachDesignTools. Use a focusable canvas for keyboard shortcuts, and await
surface.destroy() when retiring the session.
