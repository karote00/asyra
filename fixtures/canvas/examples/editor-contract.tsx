import { createDesign } from '@asyra/design'
import { Board } from './DesignBoard'

const canvas = document.createElement('canvas')

// @ts-expect-error Extensions require a workspace container.
await createDesign(canvas, { extensions: [] })
const host: HTMLElement = canvas
const editor = await createDesign(host)

if ('common' in editor) {
  for (const key of editor.observeKeys) {
    editor.observe(key, () => undefined)()
  }

  const snapshot = editor.common.systemContext.getSnapshot()
  const primaryTool: string = snapshot.primaryTool

  void primaryTool
}

// @ts-expect-error A general element may be a borrowed canvas.
editor.drawOval({ x: 0, y: 0, width: 10, height: 10 })
// @ts-expect-error The default React editor has no feature with this ID.
const invalid = <Board options={{ disabledFeatures: ['rectangel'] }} />

export { invalid }

const marker = {
  id: 'marker',
  node: { name: 'Marker', fields: { abc: 0, title: 'Marker' } }
} as const
const configured = (
  <Board
    options={{ extensions: [marker] }}
    onMount={(editor) => {
      editor.setDisabledFeatures(['marker'])
      editor.createNode(
        marker,
        { x: 0, y: 0, width: 10, height: 10 },
        { abc: 5 }
      )
      // @ts-expect-error A string field cannot receive a number.
      editor.updateSelectedNodes(marker, { title: 17 })
      // @ts-expect-error Only installed feature IDs are accepted.
      editor.setDisabledFeatures(['markre'])
    }}
  />
)
// @ts-expect-error The built-in group ID is positionRow.
const invalidTarget = <Board uiTargets={{ positonRow: 'tools' }} />
const plain = (
  <Board
    onMount={(editor) => {
      // @ts-expect-error The ready callback retains the built-in command catalog.
      editor.runAction('undoo')
    }}
  />
)

export { configured, invalidTarget, plain }
