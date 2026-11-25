import { createDesign } from '@asyra/design'
import { positionRow } from '@example/position-row'

const { document, localStorage } = globalThis

const field = (id) => document.getElementById(id)

const profile = field('profile')
const placement = field('placement')
const external = field('external')

const preferenceKey = () => 'tool-layout:' + profile.value

const read = () => JSON.parse(localStorage.getItem(preferenceKey()) ?? '{}')

globalThis.ready = (async () => {
  const editor = await createDesign(document.querySelector('main'), {
    extensions: [positionRow()],
    toolLayout: read(),

    onToolLayoutChange(layout) {
      localStorage.setItem(preferenceKey(), JSON.stringify(layout))
      reflect(layout)
    }
  })

  globalThis.editor = editor

  function reflect(layout) {
    placement.value = layout.floating?.positionRow
      ? 'floating'
      : Object.keys(layout).find(
          (slot) =>
            Array.isArray(layout[slot]) && layout[slot].includes('positionRow')
        )
  }

  function restore() {
    editor.toolGroups.setLayout(read())
    reflect(editor.toolGroups.getLayout())
    if (placement.value === 'manual') {
      editor.toolGroups.mount('positionRow', external)
    }
  }

  restore()
  profile.onchange = restore
  placement.onchange = () => {
    if (placement.value === 'floating') {
      editor.toolGroups.float('positionRow', {
        x: globalThis.innerWidth / 3,
        y: globalThis.innerHeight / 3
      })

      return
    }

    if (placement.value === 'manual') {
      editor.toolGroups.mount('positionRow', external)
    } else {
      editor.toolGroups.move('positionRow', placement.value)
    }
  }

  function applyAvailability() {
    const disabled = []

    if (field('limited').checked) {
      disabled.push('geometry')
    }

    if (!field('entitled').checked) {
      disabled.push('positionRow')
    }

    return editor.setDisabledFeatures(disabled)
  }

  field('limited').onchange = applyAvailability
  field('entitled').onchange = applyAvailability

  field('sample').onclick = () => {
    const a = editor.drawRectangle({ x: 24, y: 30, width: 70, height: 40 })
    const b = editor.drawRectangle({ x: 150, y: 105, width: 50, height: 30 })

    editor.select([a, b])
  }
})()
