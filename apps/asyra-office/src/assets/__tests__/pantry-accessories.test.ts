import { requiredSpecValue } from '../specification'
import pantry from '../../../../../assets/asyra-office/models/pantry/pantry-model-spec.json'
import { expect, it } from 'vitest'
import { soapPump, utensilPair } from '../pantry-accessories'
import { meshBounds } from '../../scene/room-furnishing-helpers'

it('keeps the pump and utensils inside their source-sized support envelopes', () => {
  for (const [parts, width, depth, height] of [
    [soapPump(), 0.058, 0.065, 0.12],
    [utensilPair(), 0.055, 0.04, 0.211]
  ] as const) {
    const b = meshBounds(parts)
    expect(b[0][1] - b[0][0]).toBeLessThanOrEqual(width + 1e-6)
    expect(b[1][1] - b[1][0]).toBeLessThanOrEqual(depth + 1e-6)
    expect(b[2][1]).toBeLessThanOrEqual(height + 1e-6)
    expect(b[2][0]).toBeGreaterThanOrEqual(-1e-6)
  }
})

it('aligns the sink basin and its cabinet clearance left of the drawer column', () => {
  const components = requiredSpecValue(
    pantry.modules.find((m) => m.moduleId === 'sink-cabinet'),
    'sink'
  ).components
  for (const id of ['basin-outer', 'drain', 'faucet-base']) {
    const component = requiredSpecValue(
      components.find((c) => c.partId === id),
      id
    )
    expect(requiredSpecValue(component.centre, 'centre')[0]).toBeCloseTo(
      -0.06,
      6
    )
  }
  for (const id of ['cabinet', 'countertop']) {
    const component = requiredSpecValue(
      components.find((c) => c.partId === id),
      id
    )
    if (!('subtract' in component) || !component.subtract)
      throw new Error('Missing sink clearance')
    expect(component.subtract[0].centre[0]).toBeCloseTo(-0.06, 6)
  }
})
