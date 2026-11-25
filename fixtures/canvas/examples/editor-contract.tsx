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
