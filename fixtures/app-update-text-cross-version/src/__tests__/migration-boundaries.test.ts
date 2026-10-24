import { expect, it } from 'vitest'
import { TEXT_PROPERTY_SCHEMA } from '@asyra/preset'
import current from '../../test-data/current.json'
import multiplier from '../../test-data/multiplier.json'
import extended from '../../test-data/locally-extended.json'
import {
  CHART_UI,
  METADATA_UI,
  STORAGE_SLOT,
  TYPOGRAPHY_UI
} from '../definitions.js'
import { prepareDocument } from '../documents.js'
import { mountPanel } from '../panel.js'
import { open, reload, settle } from './helpers.js'

function versionThree() {
  const core = structuredClone(current.core)
  for (const property of Object.values(core.props)) {
    const values = property as Record<string, unknown>
    if (values.type !== 'typography') continue
    values.tracking = { unit: 'layout', value: values.letterSpacing }
    delete values.letterSpacing
  }
  return { documentVersion: 3, core }
}

it('accepts existing version 3 and keeps wire tracking outside canonical state and projections', async () => {
  const input = versionThree()
  const original = structuredClone(input)
  const app = await open(input)
  for (const id of ['text-1', 'chart-1']) {
    expect(app.core.getElementComputedData(id)).toMatchObject({
      lineHeight: 24,
      letterSpacing: 1.5
    })
    expect(app.core.getElementComputedData(id)).not.toHaveProperty('tracking')
  }
  expect(app.core.getUIProperty(TYPOGRAPHY_UI)).toMatchObject({
    letterSpacing: 1.5
  })
  expect(app.core.getUIProperty(TYPOGRAPHY_UI)).not.toHaveProperty('tracking')
  expect(await app.save()).toEqual(input)
  expect(input).toEqual(original)
  const raw = await app.core.save()
  expect(raw.props['chart-typography']).not.toHaveProperty('tracking')
})

it.each([multiplier, current, extended])(
  'preserves every typography field and explicit chart zero through repeated migrations',
  async (input) => {
    const original = structuredClone(input)
    const source = structuredClone(input)
    source.core.props['chart-typography'].letterSpacing = 0
    let app = await open(source)
    for (let pass = 0; pass < 3; pass++) {
      const saved = await app.save()
      expect(saved.documentVersion).toBe(3)
      expect(saved.core.sceneTree).toEqual(source.core.sceneTree)
      for (const [id, property] of Object.entries(source.core.props)) {
        const expected: Record<string, unknown> = { ...property }
        if (expected.type === 'typography') {
          expected.lineHeight = 24
          expected.tracking = { unit: 'layout', value: expected.letterSpacing }
          delete expected.letterSpacing
        }
        expect(saved.core.props[id]).toEqual(expected)
      }
      expect(
        JSON.parse(window.localStorage.getItem(STORAGE_SLOT) ?? 'null')
      ).toEqual(saved)
      if (pass < 2) app = await reload(app)
    }
    expect(input).toEqual(original)
  }
)

const invalidCases: [string, () => unknown][] = [
  [
    'unsupported version',
    () => ({ ...structuredClone(current), documentVersion: 4 })
  ],
  [
    'missing spacing',
    () => {
      const value = structuredClone(current)
      delete (value.core.props['chart-typography'] as Record<string, unknown>)
        .letterSpacing
      return value
    }
  ],
  [
    'conflicting legacy representation',
    () => {
      const value = structuredClone(current)
      Object.assign(value.core.props['chart-typography'], {
        tracking: { unit: 'layout', value: 1.5 }
      })
      return value
    }
  ],
  [
    'conflicting version 3 representation',
    () => {
      const value = versionThree()
      Object.assign(value.core.props['chart-typography'], {
        letterSpacing: 1.5
      })
      return value
    }
  ],
  ...[
    null,
    { unit: 'em', value: 1.5 },
    { unit: 'layout', value: '1.5' },
    { unit: 'layout', value: 101 },
    { unit: 'layout', value: NaN },
    { unit: 'layout', value: Infinity }
  ].map((tracking): [string, () => unknown] => [
    `invalid tracking ${String(tracking?.value)} ${String(tracking?.unit)}`,
    () => {
      const value = versionThree()
      Object.assign(value.core.props['chart-typography'], { tracking })
      return value
    }
  ]),
  ...[
    ['approvalStatus', 'archived'],
    ['sourceRecordId', 'x'.repeat(129)],
    ['labelCategory', 'unknown'],
    ['reviewNote', 'x'.repeat(257)]
  ].map(([key, invalid]): [string, () => unknown] => [
    `invalid ${key}`,
    () => {
      const value = versionThree()
      Object.assign(value.core.props['chart-typography'], { [key]: invalid })
      return value
    }
  ]),
  [
    'invalid multiplier after conversion',
    () => {
      const value = structuredClone(multiplier)
      value.core.props['chart-typography'].lineHeight = 8192
      return value
    }
  ],
  [
    'invalid negative multiplier and font size',
    () => {
      const value = structuredClone(multiplier)
      value.core.props['chart-typography'].lineHeight = -1.5
      value.core.props['chart-typography'].fontSize = -16
      return value
    }
  ]
]

it.each(invalidCases)(
  'rejects %s before changing canonical state or storage',
  async (_, makeInput) => {
    const app = await open(current)
    await app.save()
    const raw = await app.core.save()
    const stored = window.localStorage.getItem(STORAGE_SLOT)
    const projected = app.core.getUIProperty(METADATA_UI)
    const input = makeInput()
    const original = structuredClone(input)
    expect(() => app.load(input)).toThrow()
    expect(await app.core.save()).toEqual(raw)
    expect(window.localStorage.getItem(STORAGE_SLOT)).toBe(stored)
    expect(app.core.getUIProperty(METADATA_UI)).toEqual(projected)
    expect(input).toEqual(original)
  }
)

it('validates version 3 metadata rather than rejecting its envelope', () => {
  const input = versionThree()
  input.core.props['text-typography'].approvalStatus = 'archived'
  expect(() => prepareDocument(input)).toThrow('Invalid approvalStatus')
})

it('preserves official flags and all four unique extension fields', async () => {
  const app = await open(current)
  const fields = app.definition?.fields ?? []
  expect(fields).toHaveLength(TEXT_PROPERTY_SCHEMA.fields.length + 4)
  expect(new Set(fields.map((field) => field.key)).size).toBe(fields.length)
  for (const key of [
    'lineHeight',
    'letterSpacing',
    'approvalStatus',
    'sourceRecordId',
    'labelCategory',
    'reviewNote'
  ]) {
    expect(fields.find((field) => field.key === key)).toMatchObject({
      persist: true,
      project: true,
      unit: false
    })
  }
})

it('keeps each action atomic after reload and isolates chart controls', async () => {
  const app = await reload(await open(extended))
  const actions = [
    () =>
      app.feature.editTypography('text-1', {
        lineHeight: 32,
        letterSpacing: 0
      }),
    () =>
      app.feature.editMetadata('text-1', {
        sourceRecordId: 'record-18',
        labelCategory: 'warning'
      }),
    () => app.feature.annotate('text-1', 'Reviewed'),
    () => app.feature.approve('text-1'),
    () => app.feature.reject('text-1'),
    () => app.feature.renameChart('chart-1', 'Renamed')
  ]
  for (const action of actions) {
    const before = await app.core.save()
    const depth = app.core.getUndoHistoryDepth()
    action()
    await settle()
    const after = await app.core.save()
    expect(after).not.toEqual(before)
    expect(app.core.getUndoHistoryDepth()).toBe(depth + 1)
    await app.undo()
    expect(await app.core.save()).toEqual(before)
    await app.redo()
    expect(await app.core.save()).toEqual(after)
  }
  const host = document.createElement('div')
  const unmount = mountPanel(app, host)
  try {
    expect(host.textContent).toContain('record-18')
    app.feature.select('chart-1')
    await settle()
    expect(app.core.getUIProperty(TYPOGRAPHY_UI)).toBeNull()
    expect(app.core.getUIProperty(METADATA_UI)).toBeNull()
    expect(app.core.getUIProperty(CHART_UI)).toMatchObject({
      text: 'Renamed',
      sourceTextId: 'text-1',
      reviewNote: 'Reviewed',
      approvalStatus: 'rejected',
      sourceRecordId: 'record-18',
      labelCategory: 'warning'
    })
    expect(host.querySelector('button')?.disabled).toBe(true)
    expect(() =>
      app.feature.editTypography('chart-1', { lineHeight: 30 })
    ).toThrow()
    app.core.selectElements([])
    await settle()
    expect(host.querySelector('button')?.disabled).toBe(true)
  } finally {
    unmount()
  }
  const before = await app.save()
  expect(() =>
    app.feature.editMetadata('text-1', { approvalStatus: 'archived' })
  ).toThrow()
  expect(await app.save()).toEqual(before)
})
