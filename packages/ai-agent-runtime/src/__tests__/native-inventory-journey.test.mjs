import process from 'node:process'
import { expect, it } from 'vitest'
import { nativeInventoryJourney } from './fixtures/native-inventory-journey.mjs'
const test = it.skipIf(!process.env.NATIVE_DELIVERY_CODEX)

const verify = (result) => {
  expect(result.serviceError).toBeUndefined()
  expect(result.outcomes.map((r) => r.status)).toEqual(['executed', 'executed'])
  expect(result.evidence.writes).toBe(1)
  expect(result.evidence.afterFirst).toEqual([['reservation-one', 2]])
  expect(result.evidence.captures).toBe(1)
  expect(result.evidence.reads).toBe(1)
  expect(result.evidence.knowledge).toBe(1)
  expect(result.evidence.arguments).toEqual([
    { id: 'reservation-one', unitCost: 3 }
  ])
  expect(result.evidence.decoded[0].threadId).toBe(
    result.evidence.decoded[1].threadId
  )
  expect(result.evidence.bindings).toEqual([1, 2])
  expect(result.requests).toHaveLength(7)
  const input = JSON.stringify(result.requests[6].input)

  expect(input).toContain('Reserve two units.')
  expect(input).toContain('not-started')
  expect(input).toContain('quantity')
  expect(input).toContain('reservation')
  expect(input).toContain('\\"quantity\\":5')
  expect(input).toContain('\\"revision\\":1')
  expect(input).not.toContain('\\"revision\\":9')
  const outputs = result.requests[4].input.filter(
    (i) => i.type === 'function_call_output'
  )
  const images = outputs
    .flatMap((i) => (Array.isArray(i.output) ? i.output : []))
    .filter((i) => i.type === 'input_image')

  expect(images).toHaveLength(2)
}

test('native inventory completes real runtime exchange, host, Knowledge, correction, images and cross-turn reuse', async () => {
  verify(await nativeInventoryJourney())
}, 45000)
test.each(['missing-image', 'wrong-revision', 'wrong-settlement'])(
  'native inventory oracle rejects actual provider handoff corruption: %s',
  async (fault) => {
    const result = await nativeInventoryJourney(fault)

    expect(() => verify(result)).toThrow()
  },
  45000
)
