import { runTransaction } from '@asyra/core'
import { createDefaultFill } from '@asyra/utils'
import original from '../test-data/current.json'
import { createDocumentRuntime } from '../src/runtime.js'
import { mountPanel } from '../src/panel.js'

const canvas = document.querySelector<HTMLDivElement>('#canvas')
const controls = document.querySelector<HTMLElement>('#controls')
const colors = document.querySelector<HTMLOutputElement>('#colors')
if (!canvas || !controls || !colors) throw new Error('Missing review hosts')
let app = createDocumentRuntime(structuredClone(original))
await app.start(canvas)

// Create through the public API without supplying a textColor override.
runTransaction(
  () =>
    app.core.createElementInParent(
      {
        id: 'review-text',
        type: 'text',
        name: 'New gray Text',
        x: 10,
        y: 120,
        width: 300,
        height: 80
      },
      'workspace-1'
    ),
  { failureKind: 'handler-error' }
)
app.feature.editTypography('review-text', { text: 'New Text - shared gray' })
let snapshot: string | undefined
let generation = 1
function refreshEvidence(action: string) {
  if (!colors) throw new Error('Missing color output')
  const current = app.core.getElementComputedData('review-text')
  const oldText = app.core.getElementComputedData('text-1')
  const chart = app.core.getElementComputedData('chart-1')
  if (current?.textColor !== createDefaultFill().color)
    throw new Error('New Text color changed')
  if (
    oldText?.textColor !== original.core.props['text-typography'].textColor ||
    chart?.textColor !== original.core.props['chart-typography'].textColor
  )
    throw new Error('Original document color changed')
  colors.textContent = JSON.stringify({
    action,
    generation,
    expected: createDefaultFill().color,
    created: current.textColor,
    saved: oldText.textColor,
    chart: chart.textColor,
    text: current.text,
    undoDepth: app.core.getUndoHistoryDepth(),
    memorySnapshot: snapshot !== undefined
  })
}
refreshEvidence('Initial')
for (const [label, id] of [
  ['Select new Text', 'review-text'],
  ['Select saved Text', 'text-1'],
  ['Select chart', 'chart-1']
]) {
  const button = document.createElement('button')
  button.textContent = label
  button.onclick = () => app.feature.select(id)
  controls.append(button)
}
const clear = document.createElement('button')
clear.textContent = 'Clear selection'
clear.onclick = () => app.core.selectElements([])
controls.append(clear)
const panel = document.createElement('section')
controls.append(panel)
let disposePanel = mountPanel(app, panel)
app.feature.select('review-text')

const historyControls = document.createElement('section')
controls.before(historyControls)
const status = document.createElement('output')
historyControls.after(status)
for (const [label, action] of [
  [
    'Edit new Text',
    async () => {
      app.feature.editTypography('review-text', {
        text:
          app.core.getElementComputedData('review-text')?.text ===
          'Edited gray Text'
            ? 'New Text - shared gray'
            : 'Edited gray Text'
      })
    }
  ],
  [
    'Undo',
    async () => {
      await app.undo()
    }
  ],
  [
    'Redo',
    async () => {
      await app.redo()
    }
  ],
  [
    'Save to memory',
    async () => {
      // Use canonical serialization only. Do not call app.save(), which writes localStorage.
      const core = await app.core.save()
      for (const key of Object.keys(original.core.props)) {
        const originalProperty =
          original.core.props[key as keyof typeof original.core.props]
        if (
          JSON.stringify(
            Object.entries(core.props[key]).sort(([a], [b]) =>
              a.localeCompare(b)
            )
          ) !==
          JSON.stringify(
            Object.entries(originalProperty).sort(([a], [b]) =>
              a.localeCompare(b)
            )
          )
        )
          throw new Error(`Original property changed: ${key}`)
      }
      snapshot = JSON.stringify({ documentVersion: 2, core })
    }
  ],
  [
    'Reload memory in fresh runtime',
    async () => {
      if (!snapshot) throw new Error('Save to memory first')
      disposePanel()
      await app.dispose()
      if (!canvas || !controls) throw new Error('Missing review hosts')
      canvas.replaceChildren()
      app = createDocumentRuntime(JSON.parse(snapshot))
      await app.start(canvas)
      disposePanel = mountPanel(app, panel)
      app.feature.select('review-text')
      generation += 1
    }
  ]
] as const) {
  const button = document.createElement('button')
  button.textContent = label
  button.onclick = async () => {
    try {
      await action()
      refreshEvidence(label)
      status.textContent = `PASS: ${label}`
    } catch (error) {
      status.textContent = `FAIL: ${String(error)}`
      throw error
    }
  }
  historyControls.append(button)
}
