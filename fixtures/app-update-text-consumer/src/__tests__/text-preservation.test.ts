import initialCore from '@asyra/core'
import { createDefaultFill, getElementGeometryLocalBounds } from '@asyra/utils'
import { TEXT_PROPERTY_SCHEMA, TEXT_RENDER_STRATEGY } from '@asyra/preset'
import { afterEach, describe, expect, it, vi } from 'vitest'
import original from '../../test-data/current.json'
import multiplier from '../../test-data/multiplier.json'
import { createDocumentRuntime, type DocumentRuntime } from '../runtime.js'
import { mountPanel } from '../panel.js'
import {
  STORAGE_SLOT,
  CHART_TYPE,
  CHART_UI,
  METADATA_UI,
  TYPOGRAPHY_UI
} from '../definitions.js'

let runtime: DocumentRuntime | undefined
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
async function open(input: unknown = original) {
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

describe('Text consumer preservation', () => {
  it('installs the official renderer once and uses official field contracts', async () => {
    const register = vi.spyOn(initialCore, 'registerRenderStrategy')
    const app = await open()
    const textRegistrations = register.mock.calls.filter(
      ([type]) => type === 'text'
    )
    expect(textRegistrations).toHaveLength(1)
    expect(textRegistrations[0][1]).toBe(TEXT_RENDER_STRATEGY)
    const graphic = {
      clear: vi.fn(),
      text: vi.fn(),
      x: 0,
      y: 0,
      hitArea: { contains: (_x: number, _y: number) => false }
    }
    const draw = textRegistrations[0][1]
    draw(
      graphic as unknown as Parameters<typeof draw>[0],
      app.core.getElementComputedData('text-1') as unknown as Parameters<
        typeof draw
      >[1]
    )
    expect(graphic.text).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        text: 'Quarterly report',
        lineHeight: 24,
        letterSpacing: 1.5,
        width: 200,
        height: 80
      })
    )
    expect(graphic).toMatchObject({ x: 10, y: 20 })
    expect(
      getElementGeometryLocalBounds(
        graphic as unknown as Parameters<
          typeof getElementGeometryLocalBounds
        >[0]
      )
    ).toEqual({ x: 0, y: 0, width: 200, height: 80 })
    expect(graphic.hitArea.contains(100, 40)).toBe(true)
    expect(graphic.hitArea.contains(201, 40)).toBe(false)
    register.mockRestore()
    for (const official of TEXT_PROPERTY_SCHEMA.fields) {
      expect(
        app.definition?.fields.find((field) => field.key === official.key)
      ).toMatchObject(
        official.key === 'textColor'
          ? { ...official, defaultValue: createDefaultFill().color }
          : official
      )
    }
  })

  it('creates untouched Text with official typography and retained metadata defaults', async () => {
    const app = await open()
    const element = app.core.createElement({
      id: 'new-text',
      x: 0,
      y: 0,
      type: 'text',
      name: 'New Text'
    })
    expect(element).not.toBeNull()
    expect(app.core.getElementComputedData('new-text')).toMatchObject({
      lineHeight: 20,
      letterSpacing: 0,
      approvalStatus: 'draft',
      sourceRecordId: '',
      labelCategory: 'general'
    })
  })

  it('uses the shared fill color only for new Text and preserves saved colors', async () => {
    const app = await open()
    app.core.createElement({
      id: 'gray-text',
      type: 'text',
      name: 'New',
      x: 0,
      y: 0
    })
    expect(app.core.getElementComputedData('gray-text')?.textColor).toBe(
      createDefaultFill().color
    )
    expect(app.core.getElementComputedData('text-1')?.textColor).toBe(
      original.core.props['text-typography'].textColor
    )
    const saved = await app.save()
    expect(saved.core.props['text-typography']).toEqual(
      original.core.props['text-typography']
    )
    app.load(saved)
    expect(app.core.getElementComputedData('gray-text')?.textColor).toBe(
      createDefaultFill().color
    )
    expect(app.core.getElementComputedData('text-1')?.textColor).toBe(
      original.core.props['text-typography'].textColor
    )
  })

  it('disables approval for chart and empty selection and restores it for Text', async () => {
    const app = await open()
    const host = document.createElement('section')
    const dispose = mountPanel(app, host)
    const button = host.querySelector('button')
    if (!button) throw new Error('Missing approval button')
    expect(button.disabled).toBe(false)
    app.feature.select('chart-1')
    await settle()
    expect(button.disabled).toBe(true)
    const before = await app.save()
    const depth = app.core.getUndoHistoryDepth()
    button.click()
    expect(await app.save()).toEqual(before)
    expect(app.core.getUndoHistoryDepth()).toBe(depth)
    app.core.selectElements([])
    await settle()
    expect(button.disabled).toBe(true)
    app.feature.select('text-1')
    await settle()
    expect(button.disabled).toBe(false)
    const beforeApproval = app.core.getUndoHistoryDepth()
    button.click()
    await settle()
    expect(app.core.getUIProperty(METADATA_UI)).toMatchObject({
      approvalStatus: 'approved'
    })
    expect(app.core.getUndoHistoryDepth()).toBe(beforeApproval + 1)
    dispose()
    app.feature.select('chart-1')
    await settle()
    expect(button.disabled).toBe(false)
    expect(host.childElementCount).toBe(0)
  })

  it('retains shared gray and original properties through memory save, fresh load and Undo/Redo', async () => {
    const app = await open()
    app.core.createElement({
      id: 'memory-text',
      type: 'text',
      name: 'Memory Text',
      x: 0,
      y: 120
    })
    app.feature.editTypography('memory-text', { text: 'Before edit' })
    app.feature.editTypography('memory-text', { text: 'After edit' })
    await app.undo()
    expect(app.core.getElementComputedData('memory-text')).toMatchObject({
      text: 'Before edit',
      textColor: createDefaultFill().color
    })
    await app.redo()
    const snapshot = JSON.stringify({
      documentVersion: 2,
      core: await app.core.save()
    })
    await app.dispose()
    runtime = undefined
    const reloaded = await open(JSON.parse(snapshot))
    expect(reloaded.core.getElementComputedData('memory-text')).toMatchObject({
      text: 'After edit',
      textColor: createDefaultFill().color
    })
    reloaded.feature.editTypography('memory-text', { text: 'After reload' })
    await reloaded.undo()
    expect(reloaded.core.getElementComputedData('memory-text')).toMatchObject({
      text: 'After edit',
      textColor: createDefaultFill().color
    })
    await reloaded.redo()
    expect(reloaded.core.getElementComputedData('memory-text')).toMatchObject({
      text: 'After reload',
      textColor: createDefaultFill().color
    })
    const saved = await reloaded.core.save()
    for (const [key, property] of Object.entries(original.core.props)) {
      expect(saved.props[key]).toEqual(property)
    }
  })

  it('enforces official typography boundaries without changing rejected values', async () => {
    const app = await open()
    for (const [key, values] of Object.entries({
      lineHeight: [0, -1, 8193, NaN, Infinity],
      letterSpacing: [-101, 101, NaN, Infinity]
    })) {
      for (const value of values) {
        const before = await app.save()
        expect(() =>
          app.feature.editTypography('text-1', { [key]: value })
        ).toThrow(`Invalid ${key}`)
        expect(await app.save()).toEqual(before)
      }
    }
    app.feature.editTypography('text-1', {
      lineHeight: 8192,
      letterSpacing: -100
    })
    expect(app.core.getElementComputedData('text-1')).toMatchObject({
      lineHeight: 8192,
      letterSpacing: -100
    })
    app.feature.editTypography('text-1', {
      lineHeight: Number.MIN_VALUE,
      letterSpacing: 100
    })
    expect(app.core.getElementComputedData('text-1')).toMatchObject({
      lineHeight: Number.MIN_VALUE,
      letterSpacing: 100
    })
  })

  it('rejects overflowing multiplier conversion before apply and round-trips converted units once', async () => {
    const app = await open(multiplier)
    const saved = await app.save()
    expect(saved.core.props['text-typography']).toMatchObject({
      lineHeight: 24
    })
    app.load(saved)
    expect(app.core.getElementComputedData('text-1')).toMatchObject({
      lineHeight: 24
    })
    const invalid = structuredClone(multiplier)
    invalid.core.props['text-typography'].lineHeight = 8192
    const originalInput = JSON.stringify(invalid)
    expect(() => app.load(invalid)).toThrow('Invalid lineHeight')
    expect(await app.save()).toEqual(saved)
    expect(JSON.stringify(invalid)).toBe(originalInput)
  })

  it('retains twelve unique fields, aliases and the shared chart relation', async () => {
    const app = await open()
    const fields = app.definition?.fields ?? []
    expect(fields).toHaveLength(12)
    expect(new Set(fields.map((field) => field.key)).size).toBe(12)
    for (const key of ['approvalStatus', 'sourceRecordId', 'labelCategory']) {
      expect(fields.find((field) => field.key === key)).toMatchObject({
        persist: true,
        project: true,
        unit: false
      })
      expect(
        app.core
          .getComponentPropertyRelations('text')
          .find((relation) => relation.propertyName === 'typography')?.property
          .alias
      ).toContain(key)
      expect(
        app.core
          .getComponentPropertyRelations(CHART_TYPE)
          .find((relation) => relation.propertyName === 'typography')?.property
          .alias
      ).toContain(key)
    }
    expect(app.core.getElementComputedData('text-1')).toMatchObject({
      lineHeight: 24,
      letterSpacing: 1.5,
      approvalStatus: 'draft',
      sourceRecordId: 'record-17',
      labelCategory: 'warning'
    })
  })

  it('edits custom metadata through the Feature, projects it, and preserves it across save and a fresh runtime', async () => {
    const app = await open()
    app.feature.editMetadata('text-1', {
      approvalStatus: 'approved',
      sourceRecordId: 'record-18',
      labelCategory: 'general'
    })
    await settle()
    const expected = {
      approvalStatus: 'approved',
      sourceRecordId: 'record-18',
      labelCategory: 'general'
    }
    expect(app.core.getElementComputedData('text-1')).toMatchObject(expected)
    expect(app.core.getUIProperty(METADATA_UI)).toMatchObject(expected)
    app.feature.select('chart-1')
    await settle()
    expect(app.core.getUIProperty(CHART_UI)).toMatchObject({
      ...expected,
      sourceTextId: 'text-1',
      text: 'Revenue'
    })
    await app.save()
    const serialized = window.localStorage.getItem(STORAGE_SLOT)
    if (!serialized) throw new Error('Missing saved document')
    const saved = JSON.parse(serialized)
    expect(saved.documentVersion).toBe(2)
    expect(saved.core.sceneTree).toEqual(original.core.sceneTree)
    expect(saved.core.props['text-typography']).toMatchObject({
      ...expected,
      lineHeight: 24,
      letterSpacing: 1.5
    })
    expect(saved.core.props['chart-reference']).toEqual(
      original.core.props['chart-reference']
    )
    await app.dispose()
    runtime = undefined
    const reloaded = await open(saved)
    expect(reloaded.core.getElementComputedData('text-1')).toMatchObject({
      ...expected,
      lineHeight: 24,
      letterSpacing: 1.5
    })
    expect(reloaded.core.getUIProperty(METADATA_UI)).toMatchObject(expected)
    expect(reloaded.core.getUIProperty(TYPOGRAPHY_UI)).toMatchObject({
      lineHeight: 24,
      letterSpacing: 1.5
    })
    const afterReload = await reloaded.save()
    expect(afterReload.core.sceneTree).toEqual(saved.core.sceneTree)
    expect(afterReload.core.props).toEqual(saved.core.props)
    reloaded.feature.select('chart-1')
    await settle()
    expect(reloaded.core.getUIProperty(CHART_UI)).toMatchObject({
      ...expected,
      sourceTextId: 'text-1',
      text: 'Revenue'
    })
    reloaded.feature.select('text-1')
    reloaded.feature.editMetadata('text-1', { approvalStatus: 'draft' })
    await settle()
    const host = document.createElement('section')
    const disposePanel = mountPanel(reloaded, host)
    const button = host.querySelector('button')
    if (!button) throw new Error('Missing approval button after reload')
    expect(button.disabled).toBe(false)
    const depth = reloaded.core.getUndoHistoryDepth()
    button.click()
    await settle()
    expect(reloaded.core.getUndoHistoryDepth()).toBe(depth + 1)
    expect(reloaded.core.getUIProperty(METADATA_UI)).toMatchObject(expected)
    await reloaded.undo()
    await settle()
    expect(reloaded.core.getUIProperty(METADATA_UI)).toMatchObject({
      ...expected,
      approvalStatus: 'draft'
    })
    await reloaded.redo()
    await settle()
    expect(reloaded.core.getElementComputedData('text-1')).toMatchObject(
      expected
    )
    expect(reloaded.core.getUIProperty(METADATA_UI)).toMatchObject(expected)
    expect((await reloaded.save()).core).toEqual(afterReload.core)
    disposePanel()
    reloaded.feature.editMetadata('text-1', { labelCategory: 'warning' })
    reloaded.feature.select('chart-1')
    await settle()
    expect(reloaded.core.getUIProperty(CHART_UI)).toMatchObject({
      ...expected,
      sourceTextId: 'text-1',
      text: 'Revenue',
      labelCategory: 'warning'
    })
    const edited = await reloaded.save()
    expect(edited.core.sceneTree).toEqual(saved.core.sceneTree)
    expect(edited.core.props).toEqual({
      ...saved.core.props,
      'text-typography': {
        ...saved.core.props['text-typography'],
        labelCategory: 'warning'
      }
    })
  })

  it('creates one history entry per typography or approval action and preserves Undo/Redo', async () => {
    const app = await open()
    const update = vi.spyOn(app.core, 'updateElementProperties')
    const before = app.core.getUndoHistoryDepth()
    app.feature.editTypography('text-1', { lineHeight: 30, letterSpacing: 2 })
    await settle()
    expect(update).toHaveBeenCalledTimes(1)
    expect(app.core.getUndoHistoryDepth()).toBe(before + 1)
    expect(app.core.getUIProperty(TYPOGRAPHY_UI)).toMatchObject({
      lineHeight: 30,
      letterSpacing: 2
    })
    await app.undo()
    await settle()
    expect(app.core.getUIProperty(TYPOGRAPHY_UI)).toMatchObject({
      lineHeight: 24,
      letterSpacing: 1.5
    })
    await app.redo()
    await settle()
    expect(app.core.getUIProperty(TYPOGRAPHY_UI)).toMatchObject({
      lineHeight: 30,
      letterSpacing: 2
    })
    const host = document.createElement('section')
    const disposePanel = mountPanel(app, host)
    host.querySelector('button')?.click()
    await settle()
    expect(update).toHaveBeenCalledTimes(2)
    expect(app.core.getUndoHistoryDepth()).toBe(before + 2)
    expect(
      host.querySelector(`[data-projection="${METADATA_UI}"]`)?.textContent
    ).toContain('approved')
    disposePanel()
  })

  it('rejects invalid custom writes without changing canonical, projected or saved values', async () => {
    const app = await open()
    const before = await app.save()
    expect(() =>
      app.feature.editMetadata('text-1', { approvalStatus: 'archived' })
    ).toThrow('Invalid approvalStatus')
    await settle()
    expect(app.core.getElementComputedData('text-1')).toMatchObject({
      approvalStatus: 'draft'
    })
    expect(app.core.getUIProperty(METADATA_UI)).toMatchObject({
      approvalStatus: 'draft'
    })
    expect(await app.save()).toEqual(before)
  })

  it('keeps non-Text chart controls and rejects typography edits on the chart', async () => {
    const app = await open()
    app.feature.select('chart-1')
    await settle()
    expect(app.core.getUIProperty(METADATA_UI)).toBeNull()
    expect(app.core.getUIProperty(TYPOGRAPHY_UI)).toBeNull()
    expect(app.core.getUIProperty(CHART_UI)).toMatchObject({
      text: 'Revenue',
      sourceRecordId: 'record-17',
      labelCategory: 'warning'
    })
    expect(() =>
      app.feature.editTypography('chart-1', { lineHeight: 100 })
    ).toThrow('Text action requires Text')
    app.feature.renameChart('chart-1', 'Forecast')
    await settle()
    expect(app.core.getUIProperty(CHART_UI)).toMatchObject({ text: 'Forecast' })
    expect(app.core.getElementComputedData('text-1')).toMatchObject({
      text: 'Quarterly report',
      lineHeight: 24
    })
  })

  it('retains the declared multiplier conversion without mutating the source document', async () => {
    const untouched = JSON.stringify(multiplier)
    const app = await open(multiplier)
    expect(app.core.getElementComputedData('text-1')).toMatchObject({
      fontSize: 16,
      lineHeight: 24,
      approvalStatus: 'draft'
    })
    expect((await app.save()).documentVersion).toBe(2)
    expect(JSON.stringify(multiplier)).toBe(untouched)
  })

  it.each(['unknown-version', 'invalid-metadata', 'invalid-multiplier'])(
    'rejects %s before canonical apply and retains original data',
    async (kind) => {
      const app = await open()
      const before = await app.save()
      const invalid = structuredClone(original)
      if (kind === 'unknown-version') invalid.documentVersion = 99
      if (kind === 'invalid-metadata')
        invalid.core.props['text-typography'].approvalStatus = 'archived'
      if (kind === 'invalid-multiplier') {
        invalid.documentVersion = 1
        invalid.core.props['text-typography'].lineHeight = -1
      }
      const bytes = JSON.stringify(invalid)
      expect(() => app.load(invalid)).toThrow()
      expect(await app.save()).toEqual(before)
      expect(JSON.stringify(invalid)).toBe(bytes)
    }
  )
})
