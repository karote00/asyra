import { createDesign } from '@asyra/design'

const { document } = globalThis

const field = (id) => document.getElementById(id)

const host = field('host')
const controls = document.querySelector('main')
const flags = field('flags')
const features = [
  'text',
  'pen',
  'fills',
  'strokes',
  'rename',
  'moveLayerHierarchy',
  'lock',
  'visibility',
  'rectangle',
  'oval',
  'select',
  'moveElements',
  'hoverElement',
  'geometry',
  'group',
  'ungroup',
  'deleteSelectedElement',
  'undo',
  'redo',
  'pan',
  'zoom',
  'zoomFit',
  'reset'
]

for (const feature of features) {
  const label = document.createElement('label')
  const checkbox = document.createElement('input')

  checkbox.type = 'checkbox'
  checkbox.value = feature
  label.append(checkbox, feature)
  flags.append(label)
}

let editor
let disabled = new Set()
let target = ''
let anchorId = ''
let properties = {}
let layer
let path
let inputState = new Map()

function options(select, entries, value, placeholder) {
  const items = entries.length ? entries : [['', placeholder]]

  if (JSON.stringify(items) !== select.dataset.items) {
    select.replaceChildren(
      ...items.map(([id, name]) => new globalThis.Option(name, id))
    )
    select.dataset.items = JSON.stringify(items)
  }

  select.value = value
}

// Keep in-progress host form edits until the inspected document value changes.
function reflect(id, value) {
  if (inputState.get(id) !== value) {
    field(id).value = value
    inputState.set(id, value)
  }
}

function inspect(id, selectOnCanvas = false) {
  if (target !== id) {
    target = id
    anchorId = ''
    inputState.clear()
  }

  if (selectOnCanvas && target && !disabled.has('select')) {
    editor.select([target])
  }
}

function refresh() {
  const layers = editor.getLayers()

  if (!layers.ids.includes(target)) {
    inspect('')
  }

  layer = layers.elements[target]
  properties = target
    ? (editor.getElementProperties(target, ['text', 'fills', 'strokes']) ?? {})
    : {}
  path = layer?.type === 'vector' ? editor.getPath(target) : null
  options(
    field('layers'),
    [
      ['', 'Choose a layer'],
      ...layers.ids.map((id) => {
        const item = layers.elements[id]

        return [
          id,
          [
            item.name || item.type,
            item.lock && 'locked',
            item.visible === false && 'hidden'
          ]
            .filter(Boolean)
            .join(' - ')
        ]
      })
    ],
    target
  )
  document.querySelector('output').textContent =
    editor.getSelection().join(', ') || 'None'
  reflect('name', layer?.name ?? '')
  if (layer?.type === 'text') {
    reflect('text', properties.text)
  }

  const anchors = path?.anchors ?? []
  const point = anchors.find((item) => item.id === anchorId) ?? anchors[0]

  anchorId = point?.id ?? ''
  options(
    field('anchors'),
    anchors.map((item, i) => [item.id, 'Anchor ' + (i + 1)]),
    anchorId,
    'Choose a vector'
  )
  if (point) {
    reflect('x', Number(point.x.toFixed(3)))
    reflect('y', Number(point.y.toFixed(3)))
  }

  const gradient = properties.fills?.[0]?.gradient
  const stroke = properties.strokes?.[0]

  reflect('gradient', gradient?.gradientType ?? 'linear')
  reflect('start', gradient?.gradientStops.at(0)?.color ?? '#405bd5')
  reflect('end', gradient?.gradientStops.at(-1)?.color ?? '#fc9974')
  reflect('width', stroke?.width ?? 4)
  reflect('ink', stroke?.fill.color ?? '#253248')
  reflect('style', stroke?.style ?? 'solid')
  const closed = Object.values(path?.networks ?? {}).some(
    (network) => network.closed
  )
  const labels = {
    lock: layer?.lock ? 'Unlock' : 'Lock',
    visible: layer?.visible === false ? 'Show' : 'Hide',
    close: closed ? 'Open path' : 'Close path'
  }

  for (const button of controls.querySelectorAll('button[data-command]')) {
    const key = button.dataset.command
    const { feature, available } = commands[key]

    button.disabled =
      disabled.has(feature) || Boolean(available && !available())
    if (labels[key]) {
      button.textContent = labels[key]
    }
  }
}

function refreshFromCanvas() {
  if (!controls.inert) {
    refresh()
  }
}

async function mount() {
  editor = await createDesign(host, { hideUI: true })
  globalThis.editor = editor
  editor.observe('elementDataMap', refreshFromCanvas)
  editor.observe('flattenedElementIds', refreshFromCanvas)
  editor.observe('elementSelection', (ids) => {
    const selected = Array.from(ids)

    if (selected.length) {
      inspect(selected[0])
    }

    refreshFromCanvas()
  })
  editor.observe('disabledFeatures', (ids) => {
    disabled = new Set(ids)
    for (const input of flags.querySelectorAll('input')) {
      input.checked = disabled.has(input.value)
    }

    field('config').textContent = 'disabledFeatures: ' + JSON.stringify(ids)
    refreshFromCanvas()
  })
}

async function applyFeatures() {
  const next = Array.from(
    flags.querySelectorAll(':checked'),
    (input) => input.value
  )

  if (next.length === disabled.size && next.every((id) => disabled.has(id))) {
    return
  }

  try {
    await editor.setDisabledFeatures(next)
  } catch (error) {
    for (const input of flags.querySelectorAll('input')) {
      input.checked = disabled.has(input.value)
    }

    throw error
  }
}

function pointFromInputs() {
  const point = { x: field('x').valueAsNumber, y: field('y').valueAsNumber }

  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error('Enter both anchor coordinates.')
  }

  return point
}

function placement() {
  const offset = (editor.getLayers().ids.length % 8) * 20

  return { x: 35 + offset, y: 40 + offset, width: 150, height: 80 }
}

function applyGradient() {
  const fill = properties.fills[0]?.id ?? editor.addFill(target)

  editor.updateFill(target, fill, {
    kind: 'gradient',
    gradient: {
      gradientType: field('gradient').value,
      gradientHandles: [
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ],
      gradientStops: [
        { position: 0, color: field('start').value, opacity: 1 },
        { position: 1, color: field('end').value, opacity: 1 }
      ]
    }
  })
}

function applyStroke() {
  const width = field('width').valueAsNumber

  if (!Number.isFinite(width) || width < 1) {
    throw new Error('Enter a positive stroke width of at least 1.')
  }

  const existing = properties.strokes[0]
  const id = existing?.id ?? editor.addStroke(target)
  const stroke =
    existing ??
    editor
      .getElementProperties(target, ['strokes'])
      .strokes.find((item) => item.id === id)

  editor.updateStroke(target, id, {
    width,
    style: field('style').value,
    dash: 8,
    gap: 4,
    fill: { ...stroke.fill, color: field('ink').value }
  })
}

const editable = () => layer && !layer.lock

const vector = () => editable() && path

const commands = {
  rectangle: {
    feature: 'rectangle',

    run: () => inspect(editor.drawRectangle(placement()), true)
  },
  label: {
    feature: 'text',

    run: () =>
      inspect(editor.createText(field('text').value, placement()), true)
  },
  line: {
    feature: 'pen',

    run() {
      const { x, y } = placement()

      inspect(
        editor.createPath([
          { x: x + 80, y },
          { x: x + 160, y: y + 70 }
        ]),
        true
      )
    }
  },
  fit: {
    feature: 'zoomFit',

    run: () => editor.zoomFit()
  },
  undo: {
    feature: 'undo',

    run: () => editor.undo()
  },
  redo: {
    feature: 'redo',

    run: () => editor.redo()
  },
  rename: {
    feature: 'rename',
    available: editable,

    run: () =>
      editor.updateElement({ elementId: target, name: field('name').value })
  },
  first: {
    feature: 'moveLayerHierarchy',
    available: editable,

    run: () =>
      editor.moveLayers({
        elementIds: [target],
        targetParentId: layer.parentId,
        targetIndex: 0
      })
  },
  lock: {
    feature: 'lock',

    available: () => layer,

    run: () => editor.setLayerLocked(target, !layer.lock)
  },
  visible: {
    feature: 'visibility',

    available: () => layer,

    run: () => editor.setLayerVisible(target, layer.visible === false)
  },
  updateText: {
    feature: 'text',

    available: () => editable() && layer.type === 'text',

    run: () =>
      editor.updateElement({
        elementId: target,
        properties: { text: field('text').value }
      })
  },
  append: {
    feature: 'pen',
    available: vector,

    run: () => {
      anchorId = editor.appendAnchor(target, pointFromInputs())
    }
  },
  move: {
    feature: 'pen',
    available: vector,

    run: () => editor.moveAnchor(target, anchorId, pointFromInputs())
  },
  remove: {
    feature: 'pen',

    available: () => vector() && path.anchors.length > 2,

    run: () => editor.removeAnchor(target, anchorId)
  },
  close: {
    feature: 'pen',
    available: vector,

    run: () =>
      editor.setPathClosed(
        target,
        !Object.values(path.networks).some((network) => network.closed)
      )
  },
  fill: {
    feature: 'fills',

    available: () => editable() && Array.isArray(properties.fills),

    run: applyGradient
  },
  removeFill: {
    feature: 'fills',

    available: () => editable() && properties.fills?.[0]?.kind === 'gradient',

    run: () => editor.removeFill(target, properties.fills[0].id)
  },
  stroke: {
    feature: 'strokes',

    available: () => editable() && Array.isArray(properties.strokes),

    run: applyStroke
  },
  removeStroke: {
    feature: 'strokes',

    available: () => editable() && properties.strokes?.length,

    run: () => editor.removeStroke(target, properties.strokes[0].id)
  },
  configure: { run: applyFeatures }
}

field('layers').onchange = () => {
  inspect(field('layers').value, true)
  refresh()
}

field('anchors').onchange = () => {
  anchorId = field('anchors').value
  inputState.delete('x')
  inputState.delete('y')
  refresh()
}

controls.onclick = async (event) => {
  const button = event.target.closest('button[data-command]')

  if (!button || controls.inert || button.disabled) {
    return
  }

  const label = button.textContent

  controls.inert = true
  try {
    await commands[button.dataset.command].run()
    refresh()
    field('status').textContent = label + ' completed.'
  } catch (error) {
    field('status').textContent = error.message
  } finally {
    controls.inert = false
  }
}

Object.assign(globalThis, { host, createDesign })
controls.inert = true
globalThis.ready = mount()
  .then(() => {
    refresh()
    controls.inert = false
    field('status').textContent =
      'Insert a rectangle, label or line to start editing.'
  })
  .catch((error) => {
    field('status').textContent = error.message
    throw error
  })
