import { createDefaultFill } from '@asyra/utils'
import { afterEach, describe, expect, it } from 'vitest'
import original from '../../test-data/current.json'
import multiplier from '../../test-data/multiplier.json'
import extended from '../../test-data/locally-extended.json'
import { createDocumentRuntime, type DocumentRuntime } from '../runtime.js'
import {
  CHART_TYPE,
  CHART_UI,
  METADATA_UI,
  TYPOGRAPHY_UI,
  STORAGE_SLOT
} from '../definitions.js'

let runtime: DocumentRuntime | undefined
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
function readStored() {
  const saved = window.localStorage.getItem(STORAGE_SLOT)
  if (!saved) throw new Error('Missing saved document')
  return JSON.parse(saved)
}
async function open(input: unknown) {
  runtime = createDocumentRuntime(structuredClone(input))
  await runtime.start()
  runtime.feature.select('text-1')
  await settle()
  return runtime
}
afterEach(async () => {
  await runtime?.dispose()
  runtime = undefined
})

describe('Intervening consumer changes', () => {
  it.each([
    ['pre-adoption multiplier', multiplier],
    ['first-adoption absolute units', original],
    ['intervening rejected approval', extended]
  ])(
    'preserves %s documents through two fresh runtime round trips',
    async (_, input) => {
      const untouched = structuredClone(input)
      let app = await open(input)
      const expected = {
        ...input.core.props['text-typography'],
        lineHeight: 24
      }
      for (let pass = 0; pass < 2; pass++) {
        expect(app.core.getElementComputedData('text-1')).toMatchObject(
          Object.fromEntries(
            Object.entries(expected).filter(
              ([key]) => key !== 'id' && key !== 'type'
            )
          )
        )
        expect(app.core.getUIProperty(METADATA_UI)).toMatchObject({
          approvalStatus: expected.approvalStatus,
          sourceRecordId: expected.sourceRecordId,
          labelCategory: expected.labelCategory
        })
        const saved = await app.save()
        expect(saved.documentVersion).toBe(2)
        expect(saved.core.sceneTree).toEqual(input.core.sceneTree)
        expect(saved.core.props['text-typography']).toEqual(expected)
        expect(saved.core.props['chart-reference']).toEqual(
          input.core.props['chart-reference']
        )
        await app.dispose()
        runtime = undefined
        app = await open(readStored())
        expect((await app.save()).core).toEqual(saved.core)
      }
      expect(input).toEqual(untouched)
    }
  )

  it('retains reject, all metadata paths, chart references and history after reload', async () => {
    let app = await open(extended)
    app.feature.editMetadata('text-1', {
      approvalStatus: 'draft',
      sourceRecordId: 'record-next',
      labelCategory: 'warning'
    })
    const beforeReject = app.core.getUndoHistoryDepth()
    app.feature.reject('text-1')
    await settle()
    expect(app.core.getUndoHistoryDepth()).toBe(beforeReject + 1)
    const expected = {
      approvalStatus: 'rejected',
      sourceRecordId: 'record-next',
      labelCategory: 'warning'
    }
    expect(app.core.getElementComputedData('text-1')).toMatchObject(expected)
    expect(app.core.getUIProperty(METADATA_UI)).toMatchObject(expected)
    await app.undo()
    expect(app.core.getElementComputedData('text-1')?.approvalStatus).toBe(
      'draft'
    )
    await app.redo()
    const saved = await app.save()
    await app.dispose()
    runtime = undefined
    app = await open(readStored())
    expect((await app.save()).core).toEqual(saved.core)
    expect(app.core.getUIProperty(METADATA_UI)).toMatchObject(expected)
    const depth = app.core.getUndoHistoryDepth()
    app.feature.approve('text-1')
    expect(app.core.getUndoHistoryDepth()).toBe(depth + 1)
    await app.undo()
    expect(app.core.getElementComputedData('text-1')).toMatchObject(expected)
    await app.redo()
    expect(app.core.getElementComputedData('text-1')?.approvalStatus).toBe(
      'approved'
    )
    app.feature.reject('text-1')
    app.feature.select('chart-1')
    await settle()
    expect(app.core.getUIProperty(CHART_UI)).toMatchObject({
      ...expected,
      text: 'Revenue',
      sourceTextId: 'text-1'
    })
    const beforeInvalid = await app.save()
    expect(() => app.feature.reject('chart-1')).toThrow(
      'Text action requires Text'
    )
    expect(() =>
      app.feature.editMetadata('text-1', { approvalStatus: 'unknown' })
    ).toThrow('Invalid approvalStatus')
    expect(await app.save()).toEqual(beforeInvalid)
    const finalSave = await app.save()
    expect(finalSave.core.props['text-typography']).toMatchObject({
      ...expected,
      letterSpacing: 1.5,
      lineHeight: 24
    })
    expect(finalSave.core.sceneTree).toEqual(extended.core.sceneTree)
  })
})

describe('Subsequent spacing adoption', () => {
  it('uses the selected default for new Text and chart and preserves it on reload', async () => {
    let app = await open(extended)
    for (const type of ['text', CHART_TYPE]) {
      const id = `new-${type}`
      app.core.createElement({ id, type, name: 'New typography', x: 0, y: 0 })
      expect(app.core.getElementComputedData(id)).toMatchObject({
        letterSpacing: 0.5,
        textColor: createDefaultFill().color
      })
    }
    await app.save()
    await app.dispose()
    runtime = undefined
    app = await open(readStored())
    for (const type of ['text', CHART_TYPE]) {
      expect(app.core.getElementComputedData(`new-${type}`)).toMatchObject({
        letterSpacing: 0.5,
        textColor: createDefaultFill().color
      })
    }
    app.feature.select('chart-1')
    await settle()
    expect(app.core.getUIProperty(METADATA_UI)).toBeNull()
    expect(app.core.getUIProperty(TYPOGRAPHY_UI)).toBeNull()
  })

  it('retains explicit zero on Text and chart through two storage reloads', async () => {
    const input = structuredClone(extended)
    for (const property of Object.values(input.core.props)) {
      if ('letterSpacing' in property) property.letterSpacing = 0
    }
    const untouched = structuredClone(input)
    let app = await open(input)
    for (let pass = 0; pass < 2; pass++) {
      for (const id of ['text-1', 'chart-1']) {
        expect(app.core.getElementComputedData(id)?.letterSpacing).toBe(0)
      }
      const saved = await app.save()
      expect(saved.core).toEqual(input.core)
      await app.dispose()
      runtime = undefined
      app = await open(readStored())
      expect((await app.save()).core).toEqual(input.core)
    }
    expect(input).toEqual(untouched)
  })

  it.each([
    'letterSpacing',
    'approvalStatus',
    'sourceRecordId',
    'labelCategory'
  ])('rejects missing %s without defaulting or changing state', async (key) => {
    const app = await open(extended)
    const before = await app.save()
    const input = structuredClone(extended)
    Reflect.deleteProperty(input.core.props['text-typography'], key)
    const untouched = structuredClone(input)
    expect(() => app.load(input)).toThrow(`Invalid ${key}`)
    expect(await app.save()).toEqual(before)
    expect(input).toEqual(untouched)
  })

  it('edits each metadata field after reload and retains projections and storage', async () => {
    let app = await open(extended)
    await app.save()
    await app.dispose()
    runtime = undefined
    app = await open(readStored())
    const expected = {
      approvalStatus: 'draft',
      sourceRecordId: 'record-after-reload',
      labelCategory: 'warning'
    }
    for (const [key, value] of Object.entries(expected)) {
      const depth = app.core.getUndoHistoryDepth()
      app.feature.editMetadata('text-1', { [key]: value })
      expect(app.core.getUndoHistoryDepth()).toBe(depth + 1)
      expect(app.core.getElementComputedData('text-1')).toMatchObject({
        [key]: value
      })
      app.feature.select('text-1')
      await settle()
      expect(app.core.getUIProperty(METADATA_UI)).toMatchObject({
        [key]: value
      })
      app.feature.select('chart-1')
      await settle()
      expect(app.core.getUIProperty(CHART_UI)).toMatchObject({
        [key]: value,
        sourceTextId: 'text-1'
      })
    }
    const saved = await app.save()
    await app.dispose()
    runtime = undefined
    app = await open(readStored())
    expect(app.core.getElementComputedData('text-1')).toMatchObject(expected)
    expect((await app.save()).core).toEqual(saved.core)
  })
})
