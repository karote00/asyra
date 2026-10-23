import initial from '../test-data/current.json'
import { createDocumentRuntime } from './runtime.js'
import { mountPanel } from './panel.js'
const host = document.querySelector<HTMLElement>('#app')
if (!host) throw new Error('Missing App host')
const canvas = document.createElement('div')
host.append(canvas)
const runtime = createDocumentRuntime(initial)
await runtime.start(canvas)
for (const id of ['text-1', 'chart-1']) {
  const button = document.createElement('button')
  button.textContent = `Select ${id}`
  button.onclick = () => runtime.feature.select(id)
  host.append(button)
}
mountPanel(runtime, host)
runtime.feature.select('text-1')
