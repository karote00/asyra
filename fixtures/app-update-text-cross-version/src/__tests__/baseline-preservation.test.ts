import { expect, it } from 'vitest'
import current from '../../test-data/current.json'
import multiplier from '../../test-data/multiplier.json'
import extended from '../../test-data/locally-extended.json'
import { CHART_UI, METADATA_UI } from '../definitions.js'
import { mountPanel } from '../panel.js'
import { open, reload, settle } from './helpers.js'

it.each([
  ['legacy', multiplier],
  ['direct', current],
  ['partial', extended]
])(
  'retains %s data and intervening fields through two fresh reloads',
  async (_, input) => {
    const original = structuredClone(input)
    let app = await open(input)
    for (let i = 0; i < 3; i++) {
      expect(app.core.getElementComputedData('text-1')).toMatchObject({
        text: input.core.props['text-typography'].text,
        lineHeight: 24,
        letterSpacing: 1.5,
        approvalStatus: input.core.props['text-typography'].approvalStatus,
        sourceRecordId: input.core.props['text-typography'].sourceRecordId,
        labelCategory: input.core.props['text-typography'].labelCategory,
        reviewNote: 'Keep the customer exception'
      })
      expect(app.core.getUIProperty(METADATA_UI)).toMatchObject({
        reviewNote: 'Keep the customer exception'
      })
      const saved = await app.save()
      expect(saved.core.sceneTree).toEqual(input.core.sceneTree)
      expect(saved.core.props['chart-reference']).toEqual(
        input.core.props['chart-reference']
      )
      if (i < 2) app = await reload(app)
    }
    expect(input).toEqual(original)
  }
)

it('retains custom annotation, approval, chart projection and session history after reload', async () => {
  let app = await open(extended)
  app.feature.editMetadata('text-1', {
    sourceRecordId: 'record-after-note',
    labelCategory: 'warning'
  })
  const before = app.core.getUndoHistoryDepth()
  app.feature.annotate('text-1', 'New review note')
  await settle()
  expect(app.core.getUndoHistoryDepth()).toBe(before + 1)
  expect(app.core.getUIProperty(METADATA_UI)).toMatchObject({
    reviewNote: 'New review note'
  })
  await app.undo()
  expect(app.core.getElementComputedData('text-1')?.reviewNote).toBe(
    'Keep the customer exception'
  )
  await app.redo()
  app = await reload(app)
  const host = document.createElement('div')
  const unmount = mountPanel(app, host)
  try {
    expect(host.textContent).toContain('New review note')
    const approve = host.querySelector('button')
    if (!approve) throw new Error('Approval button missing')
    const history = app.core.getUndoHistoryDepth()
    approve.click()
    expect(app.core.getUndoHistoryDepth()).toBe(history + 1)
    await settle()
    expect(app.core.getElementComputedData('text-1')?.approvalStatus).toBe(
      'approved'
    )
    app.feature.reject('text-1')
    app.feature.renameChart('chart-1', 'Retained chart')
    app.feature.select('chart-1')
    await settle()
    expect(app.core.getUIProperty(CHART_UI)).toMatchObject({
      text: 'Retained chart',
      reviewNote: 'New review note',
      approvalStatus: 'rejected',
      sourceTextId: 'text-1'
    })
  } finally {
    unmount()
  }
  app = await reload(app)
  expect(app.core.getElementComputedData('text-1')).toMatchObject({
    reviewNote: 'New review note',
    sourceRecordId: 'record-after-note',
    labelCategory: 'warning',
    approvalStatus: 'rejected'
  })
  expect(app.core.getElementComputedData('chart-1')).toMatchObject({
    text: 'Retained chart',
    sourceTextId: 'text-1'
  })
  const saved = await app.save()
  expect(() => app.feature.annotate('text-1', 'x'.repeat(257))).toThrow()
  expect(await app.save()).toEqual(saved)
})
