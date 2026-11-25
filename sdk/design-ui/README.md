# @asyra/design-ui

Installable UI groups for the Design workspace. The Position row displays X
and Y for the current selection and applies each edit in one undoable action.

```js
import { createDesign } from '@asyra/design'
import { positionRow } from '@asyra/design-ui'

const editor = await createDesign(container, {
  hideUI: true,
  ui: [positionRow],
  uiTargets: { [positionRow.id]: 'my-toolbar' }
})
```

Mount the toolbar element in the document before creating the editor. Omit
`uiTargets` to use each group's default slot. Position defaults to
`properties.top` in the workspace UI. For a toolbar created later,
`editor.toolGroups.mount(positionRow.id, element)` returns a cleanup function.
