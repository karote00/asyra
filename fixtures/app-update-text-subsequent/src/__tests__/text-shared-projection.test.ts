import { expect, it } from 'vitest'
import original from '../../test-data/current.json'
import { createDocumentRuntime } from '../runtime.js'
import { CHART_UI } from '../definitions.js'
import { mountPanel } from '../panel.js'

it('updates a selected chart panel when its referenced Text metadata changes', async () => {
  const runtime = createDocumentRuntime(structuredClone(original))
  const host = document.createElement('section')
  let disposePanel: (() => void) | undefined
  try {
    await runtime.start()
    disposePanel = mountPanel(runtime, host)
    runtime.feature.select('chart-1')
    await new Promise((resolve) => setTimeout(resolve, 0))
    runtime.feature.editMetadata('text-1', {
      sourceRecordId: 'record-18',
      labelCategory: 'general'
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(runtime.core.getSelectedElementIds()).toEqual(['chart-1'])
    expect(runtime.core.getUIProperty(CHART_UI)).toMatchObject({
      text: 'Revenue',
      sourceTextId: 'text-1',
      sourceRecordId: 'record-18',
      labelCategory: 'general'
    })
    const output = host.querySelector(`[data-projection="${CHART_UI}"]`)
    expect(output?.textContent).toContain('record-18')
    expect(output?.textContent).toContain('general')
  } finally {
    disposePanel?.()
    await runtime.dispose()
  }
})
