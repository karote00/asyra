import { expect, it } from 'vitest'
import { bigIntBitLength } from '../bigint-bit-length'

it('measures exact signed BigInt widths at digit and resource boundaries', () => {
  const values = [
    0n,
    ...Array.from({ length: 15 }, (_, value) => {
      const magnitude = BigInt(value + 1)
      return [magnitude, -magnitude]
    }).flat(),
    ...[1, 2, 3, 52, 53, 1074, 21594, 23998, 23999, 24000].flatMap(
      (exponent) => {
        const power = 1n << BigInt(exponent)
        return [power - 1n, power, power + 1n, -power]
      }
    )
  ]
  for (const value of values) {
    const magnitude = value < 0n ? -value : value
    expect(bigIntBitLength(value)).toBe(magnitude.toString(2).length)
  }
})
