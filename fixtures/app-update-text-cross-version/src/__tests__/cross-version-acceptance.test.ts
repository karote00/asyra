import { expect, it } from 'vitest'
import { createDefaultFill } from '@asyra/utils'
import { DEFAULT_TEXT_DATA } from '@asyra/preset'
import current from '../../test-data/current.json'
import multiplier from '../../test-data/multiplier.json'
import ambiguous from '../../test-data/ambiguous-units.json'
import { CHART_TYPE } from '../definitions.js'
import { open, reload } from './helpers.js'

it('uses official shared defaults without replacing explicit zero or custom gray', async () => {
  const input = structuredClone(current)
  input.core.props['text-typography'].letterSpacing = 0
  let app = await open(input)
  expect(app.core.getElementComputedData('text-1')?.letterSpacing).toBe(0)
  for (const type of ['text', CHART_TYPE]) {
    app.core.createElement({
      id: `new-${type}`,
      type,
      name: 'New typography',
      x: 0,
      y: 0
    })
    expect(app.core.getElementComputedData(`new-${type}`)).toMatchObject({
      letterSpacing: 0.5,
      textColor: createDefaultFill().color
    })
  }
  const definition = app.definition
  if (!definition) throw new Error('Typography definition missing')
  const fields = definition.fields
  for (const key of ['lineHeight', 'letterSpacing', 'reviewNote']) {
    expect(fields.filter((field) => field.key === key)).toHaveLength(1)
  }
  expect(
    fields.find((field) => field.key === 'letterSpacing')?.defaultValue
  ).toBe(DEFAULT_TEXT_DATA.letterSpacing)
  app = await reload(app)
  expect(app.core.getElementComputedData('text-1')?.letterSpacing).toBe(0)
  expect(app.core.getElementComputedData('new-text')?.letterSpacing).toBe(0.5)
})

it.each([
  ['direct legacy', multiplier],
  ['partial adoption', current]
])(
  'orders %s migrations and saves version 3 without double conversion',
  async (_, input) => {
    const untouched = structuredClone(input)
    let app = await open(input)
    let previous: unknown
    for (let pass = 0; pass < 3; pass++) {
      expect(app.core.getElementComputedData('text-1')).toMatchObject({
        lineHeight: 24,
        letterSpacing: 1.5,
        reviewNote: 'Keep the customer exception'
      })
      const saved = await app.save()
      expect(saved.documentVersion).toBe(3)
      const wire = saved.core.props['text-typography'] as unknown as Record<
        string,
        unknown
      >
      expect(wire.tracking).toEqual({ unit: 'layout', value: 1.5 })
      expect(wire).not.toHaveProperty('letterSpacing')
      expect(saved.core.sceneTree).toEqual(input.core.sceneTree)
      if (previous) expect(saved).toEqual(previous)
      previous = saved
      if (pass < 2) app = await reload(app)
    }
    expect(input).toEqual(untouched)
  }
)

it('rejects ambiguous same-name units and invalid migration before canonical mutation', async () => {
  const app = await open(current)
  const before = await app.save()
  const untouched = structuredClone(ambiguous)
  expect(() => app.load(ambiguous)).toThrow()
  expect(ambiguous).toEqual(untouched)
  expect(await app.save()).toEqual(before)
  const invalid = structuredClone(multiplier)
  invalid.core.props['text-typography'].lineHeight = -2
  expect(() => app.load(invalid)).toThrow()
  expect(await app.save()).toEqual(before)
})
