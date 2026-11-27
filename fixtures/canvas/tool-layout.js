import { createDesign } from '@asyra/design'
import { positionRow } from '@asyra/design/inspector-rows'

const { document, localStorage } = globalThis

const field = (id) => document.getElementById(id)

const profile = field('profile')
const placement = field('placement')
const toolbar = field('toolbar')
const grip = field('grip')

const preferenceKey = () => 'host-toolbar:' + profile.value

function readPreference() {
  const saved = JSON.parse(localStorage.getItem(preferenceKey()) ?? 'null')

  return (
    saved ?? {
      hosted: true,
      x: 12,
      y: document.querySelector('main').offsetTop + 12
    }
  )
}

let preference = readPreference()

function position({ x, y }) {
  toolbar.style.setProperty('--x', x + 'px')
  toolbar.style.setProperty('--y', y + 'px')
}

function save() {
  localStorage.setItem(preferenceKey(), JSON.stringify(preference))
}

// The host moves its container. The same SDK target stays mounted throughout.
grip.onpointerdown = (event) => {
  if (!event.isPrimary || event.button !== 0) {
    return
  }

  const bounds = toolbar.getBoundingClientRect()
  const offsetX = event.clientX - bounds.left
  const offsetY = event.clientY - bounds.top
  const pointerId = event.pointerId

  grip.setPointerCapture(pointerId)
  const lifetime = new globalThis.AbortController()
  const options = { signal: lifetime.signal }

  const point = (e) => ({ x: e.clientX - offsetX, y: e.clientY - offsetY })

  grip.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerId === pointerId) {
        position(point(e))
      }
    },
    options
  )
  grip.addEventListener(
    'pointerup',
    (e) => {
      if (e.pointerId !== pointerId) {
        return
      }

      Object.assign(preference, point(e))
      position(preference)
      save()
    },
    options
  )
  grip.addEventListener(
    'lostpointercapture',
    (e) => {
      if (e.pointerId !== pointerId) {
        return
      }

      lifetime.abort()
      position(preference)
    },
    options
  )
}

globalThis.ready = (async () => {
  const targets = () =>
    preference.hosted ? { [positionRow.id]: 'external' } : {}

  const editor = await createDesign(document.querySelector('main'), {
    ui: [positionRow],
    uiTargets: targets()
  })

  globalThis.editor = editor

  function reflect() {
    toolbar.hidden = !preference.hosted
    placement.value = preference.hosted ? 'manual' : 'properties.top'
    position(preference)
  }

  reflect()
  profile.onchange = () => {
    preference = readPreference()
    editor.toolGroups.setTargets(targets())
    reflect()
  }

  placement.onchange = () => {
    preference.hosted = placement.value === 'manual'
    editor.toolGroups.setTargets(targets())
    reflect()
    save()
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
