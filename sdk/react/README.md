# @asyra/react

Install the package in a React 19 application and render the editor wherever
you need a drawing surface.

```jsx
import { AsyraCanvas } from '@asyra/react'

export default function Diagram() {
  return <AsyraCanvas />
}
```

Drag across the canvas to draw a rectangle. Choose Select and click a rectangle
to select it, or click empty space to clear selection. Use the Undo and Redo
buttons or focus the editor and press Cmd/Ctrl+Z or Cmd/Ctrl+Shift+Z.

Each component owns an independent browser frame, document, and history.
The editor is 480 pixels tall by default and fills the available width.
Set `style`, `className`, or the accessible frame `title` on the component.
The browser must support the 2D Preset's Pixi renderer and allow scripts and
styles inside a same-origin srcdoc frame.

By default edits last for the mounted session. Pass a stable, non-empty
`documentId` to enable the Save button and reload the last saved document
from this origin's local storage. Give independently saved canvases distinct IDs.
Changing the document ID starts a fresh session.

Supply optional toolbar actions at mount time. Their editor argument targets
only the mounted canvas and routes rectangle creation through its transaction
and history. Coordinates are in workspace units.

```jsx
<AsyraCanvas actions={[{
  label: 'Add block',
  execute: editor => editor.drawRectangle({ x: 20, y: 20, width: 80, height: 40 })
}]} />
```

From the repository root, build with `yarn turbo run build:react`.
To try an unpublished build, pack the built workspace with npm pack, then
install the resulting tarball in a React application.
