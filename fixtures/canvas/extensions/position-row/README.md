# Position row

Install the example tarball alongside the Design SDK. The X and Y controls
subscribe to the editor's selected property values. Editing one axis updates
all selected elements in a single undoable operation. Disabling geometry
editing makes the controls read-only. Disabling the extension removes the row.

```js
import { createDesign } from '@asyra/design'
import { positionRow } from '@example/position-row'

const editor = await createDesign(container, {
  hideUI: true,
  extensions: [positionRow({ placement: 'manual' })]
})
const unmount = editor.toolGroups.mount('positionRow', toolbarElement)
```

Call `unmount()` when removing the host toolbar. Use `positionRow()` for the
default properties slot. Run `npm pack` in this directory after building the
SDK to create the independently installable package.
