# @asyra/design-ui

Installable UI groups for the Design workspace. Position (X/Y) and Dimension (W/H) relocate the actual inspector controls. Each edit is undoable.

```js
import { createDesign } from '@asyra/design'
import { positionRow, dimensionRow } from '@asyra/design-ui'

const editor = await createDesign(container, {
  ui: [positionRow, dimensionRow],
  uiTargets: { [positionRow.id]: 'my-toolbar' }
})
```

For simple relocation, pass `uiTargets: { positionRow: "my-toolbar" }` directly to Design. Import these descriptors for explicit UI composition.

Mount the toolbar element in the document before creating the editor. Rows without an explicit target stay in their usual inspector positions.
Call `editor.toolGroups.setTargets({})` to return both rows to the inspector.
React hosts can update the `uiTargets` option on the mounted editor.
