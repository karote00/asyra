import { afterEach, expect, it } from 'vitest'
import { createDefaultFill } from '@asyra/utils'
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
async function open(input: unknown = extended) {
  runtime = createDocumentRuntime(structuredClone(input))
  await runtime.start()
  return runtime
}
async function reload(app: DocumentRuntime) {
  await app.save()
  const bytes = window.localStorage.getItem(STORAGE_SLOT)
  if (!bytes) throw new Error('Missing stored document')
  await app.dispose()
  runtime = undefined
  return open(JSON.parse(bytes))
}
afterEach(async () => {
  await runtime?.dispose()
  runtime = undefined
})

it.each(['text', CHART_TYPE])(
  'creates %s with selected spacing and shared gray across reload',
  async (type) => {
    let app = await open()
    app.core.createElement({
      id: 'fresh',
      type,
      name: 'Fresh typography',
      x: 0,
      y: 0
    })
    const expected = {
      letterSpacing: 0.5,
      textColor: createDefaultFill().color
    }
    expect(app.core.getElementComputedData('fresh')).toMatchObject(expected)
    app = await reload(app)
    expect(app.core.getElementComputedData('fresh')).toMatchObject(expected)
    app.feature.select('chart-1')
    await settle()
    expect(app.core.getUIProperty(METADATA_UI)).toBeNull()
    expect(app.core.getUIProperty(TYPOGRAPHY_UI)).toBeNull()
  }
)

it.each([
  ['multiplier', multiplier],
  ['absolute', original],
  ['rejected', extended]
])(
  'preserves the complete %s document across two fresh storage reloads',
  async (_, input) => {
    const untouched = structuredClone(input)
    const expected = structuredClone(input.core)
    if (input.documentVersion === 1) {
      for (const property of Object.values(expected.props)) {
        if ('lineHeight' in property && 'fontSize' in property) {
          property.lineHeight *= property.fontSize
        }
      }
    }
    let app = await open(input)
    for (let pass = 0; pass < 2; pass++) {
      expect(await app.save()).toEqual({ documentVersion: 2, core: expected })
      app = await reload(app)
      expect((await app.save()).core).toEqual(expected)
      expect(app.core.getElementComputedData('text-1')?.lineHeight).toBe(24)
    }
    expect(input).toEqual(untouched)
  }
)

it.each([0, 1.5])(
  'retains explicit spacing %s and colors for both Text and chart',
  async (spacing) => {
    const input = structuredClone(extended)
    for (const property of Object.values(input.core.props)) {
      if ('letterSpacing' in property) property.letterSpacing = spacing
    }
    let app = await open(input)
    for (let pass = 0; pass < 2; pass++) {
      app = await reload(app)
      for (const id of ['text-1', 'chart-1']) {
        expect(app.core.getElementComputedData(id)?.letterSpacing).toBe(spacing)
      }
      expect((await app.save()).core).toEqual(input.core)
    }
  }
)

it.each(['letterSpacing', 'approvalStatus', 'sourceRecordId', 'labelCategory'])(
  'rejects missing %s before apply without mutation',
  async (key) => {
    const app = await open()
    const before = await app.save()
    const invalid = structuredClone(extended)
    Reflect.deleteProperty(invalid.core.props['text-typography'], key)
    const untouched = structuredClone(invalid)
    expect(() => app.load(invalid)).toThrow(`Invalid ${key}`)
    expect(await app.save()).toEqual(before)
    expect(invalid).toEqual(untouched)
  }
)

it('retains each metadata path and one-entry approval actions after fresh reload', async () => {
  let app = await open()
  app = await reload(app)
  const expected = {
    approvalStatus: 'draft',
    sourceRecordId: 'record-r2',
    labelCategory: 'warning'
  }
  for (const [key, value] of Object.entries(expected)) {
    app.feature.editMetadata('text-1', { [key]: value })
    expect(app.core.getElementComputedData('text-1')).toMatchObject({
      [key]: value
    })
    app.feature.select('text-1')
    await settle()
    expect(app.core.getUIProperty(METADATA_UI)).toMatchObject({ [key]: value })
    app.feature.select('chart-1')
    await settle()
    expect(app.core.getUIProperty(CHART_UI)).toMatchObject({
      [key]: value,
      sourceTextId: 'text-1'
    })
  }
  for (const action of ['reject', 'approve'] as const) {
    const before = await app.save()
    const depth = app.core.getUndoHistoryDepth()
    app.feature[action]('text-1')
    expect(app.core.getUndoHistoryDepth()).toBe(depth + 1)
    const approvalStatus = action === 'reject' ? 'rejected' : 'approved'
    const after = await app.save()
    expect(app.core.getElementComputedData('text-1')).toMatchObject({
      ...expected,
      approvalStatus
    })
    await app.undo()
    expect(await app.save()).toEqual(before)
    await app.redo()
    expect(await app.save()).toEqual(after)
    await settle()
    expect(app.core.getUIProperty(CHART_UI)).toMatchObject({
      ...expected,
      approvalStatus
    })
  }
  const saved = await app.save()
  app = await reload(app)
  expect(await app.save()).toEqual(saved)
})
