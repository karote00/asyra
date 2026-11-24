import { createDesign } from '@asyra/design'

const { document } = globalThis
const host = document.createElement('main')
const controls = document.createElement('nav')
const selection = document.createElement('output')

host.style.cssText = 'width:100%;height:600px'
document.body.replaceChildren(controls, selection, host)

globalThis.ready = createDesign(host, { hideUI: true }).then((editor) => {
  const actions = {
    'Insert label': () =>
      editor.createText('Custom UI', { x: 20, y: 30, width: 120, height: 50 }),

    'Draw line': () =>
      editor.createPath([
        { x: 180, y: 30 },
        { x: 240, y: 80 }
      ]),

    'Fit drawing': () => editor.zoomFit(),

    Undo: () => editor.undo()
  }

  for (const [label, run] of Object.entries(actions)) {
    const button = document.createElement('button')

    button.textContent = label
    button.onclick = async () => {
      controls.inert = true
      try {
        await run()
      } finally {
        controls.inert = false
      }
    }

    controls.append(button)
  }

  editor.observe('elementSelection', (ids) => {
    selection.textContent = Array.from(ids).join(', ')
  })
  Object.assign(globalThis, { editor, host, createDesign })
})
