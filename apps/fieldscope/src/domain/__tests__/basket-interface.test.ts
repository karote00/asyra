import { describe, expect, it } from 'vitest'
import {
  createSyntheticBasketPlatform,
  createSyntheticBasketInput,
  readBasketMountInput
} from '../basket-interface'

describe('basket input and adjustable support admission - synthetic geometry only', () => {
  it.each([
    [1, 0.6, 0.2],
    [0.3, 0.2, 0.1],
    [0.6, 0.4, 0.15]
  ])(
    'accepts independent basket length %s width %s height %s',
    (length, width, height) => {
      const platform = createSyntheticBasketPlatform()
      const raw = createSyntheticBasketInput([width, height, length])
      const result = readBasketMountInput(platform, raw)
      expect(result.basket.externalSize).toEqual([width, height, length])
      expect(result.basket.internalSize[0]).toBeLessThan(width)
      expect(result.basket.usableVolumeM3).toBeLessThan(width * height * length)
      expect(result.basket.evidence.kind).toBe('synthetic')
      expect(result.retention.evidence.kind).toBe('synthetic')
      expect(result).not.toHaveProperty('safe')
      expect(result).not.toHaveProperty('capacityKg')
      expect(Object.isFrozen(result.basket.bottom.contacts)).toBe(true)
    }
  )

  it('treats 25kg as an input and never as assessed support capability', () => {
    const raw = structuredClone(createSyntheticBasketInput([0.4, 0.15, 0.6]))
    raw.basket.payloadKg = 25
    raw.basket.payloadCoM = [0.02, 0.1, -0.03]
    expect(
      readBasketMountInput(createSyntheticBasketPlatform(), raw).basket
        .payloadKg
    ).toBe(25)
    expect(raw.basket.payloadKg).toBe(25)
    expect(Object.isFrozen(raw)).toBe(false)
  })

  it('admits caller-configured geometric ranges beyond the synthetic example', () => {
    const platform = structuredClone(createSyntheticBasketPlatform())
    platform.adjustment.width[1] = 0.9
    platform.maxOverhang[0] = 0.4
    const raw = createSyntheticBasketInput([0.85, 0.15, 0.6])
    expect(readBasketMountInput(platform, raw).basket.externalSize[0]).toBe(
      0.85
    )
  })

  it('rejects out-of-range stops, unsupported bottoms, absent retention and excess overhang', () => {
    const platform = createSyntheticBasketPlatform()
    const inputs = [
      () => {
        const raw = structuredClone(
          createSyntheticBasketInput([0.4, 0.15, 0.6])
        )
        raw.stopSpan[0] = 0.8
        return raw
      },
      () => {
        const raw = structuredClone(
          createSyntheticBasketInput([0.4, 0.15, 0.6])
        )
        raw.basket.bottom.contacts = []
        return raw
      },
      () => {
        const raw = structuredClone(
          createSyntheticBasketInput([0.4, 0.15, 0.6])
        )
        raw.supports[0][0] = 0.5
        return raw
      },
      () => {
        const raw = structuredClone(
          createSyntheticBasketInput([0.4, 0.15, 0.6])
        )
        raw.retention.latched = false
        return raw
      },
      () => {
        const raw = structuredClone(
          createSyntheticBasketInput([0.4, 0.15, 0.6])
        )
        raw.retention.evidence = {
          kind: 'synthetic',
          id: '',
          label: 'Synthetic missing retention'
        }
        return raw
      },
      () => {
        const raw = structuredClone(
          createSyntheticBasketInput([0.4, 0.15, 0.6])
        )
        raw.supports = [
          [-0.06, -0.05],
          [0.06, -0.05],
          [-0.06, 0.05],
          [0.06, 0.05]
        ]
        return raw
      }
    ]
    for (const input of inputs)
      expect(() => readBasketMountInput(platform, input())).toThrow()
  })

  it('rejects impossible interiors, invalid loads and unrecognized bottom shapes', () => {
    for (const mutate of [
      (raw: ReturnType<typeof createSyntheticBasketInput>) => {
        raw.basket.internalSize[0] = 2
      },
      (raw: ReturnType<typeof createSyntheticBasketInput>) => {
        raw.basket.payloadKg = -1
      },
      (raw: ReturnType<typeof createSyntheticBasketInput>) => {
        raw.basket.tareKg = 0
      },
      (raw: ReturnType<typeof createSyntheticBasketInput>) => {
        raw.basket.payloadCoM[0] = NaN
      },
      (raw: ReturnType<typeof createSyntheticBasketInput>) => {
        raw.basket.usableVolumeM3 = 999
      },
      (raw: ReturnType<typeof createSyntheticBasketInput>) => {
        Object.assign(raw.basket.bottom, { kind: 'curved' })
      }
    ]) {
      const raw = createSyntheticBasketInput([0.4, 0.15, 0.6])
      mutate(raw)
      expect(() =>
        readBasketMountInput(createSyntheticBasketPlatform(), raw)
      ).toThrow()
    }
  })

  it('preserves old admitted inputs when a new basket changes dimensions', () => {
    const platform = createSyntheticBasketPlatform()
    const before = readBasketMountInput(
      platform,
      createSyntheticBasketInput([0.6, 0.2, 1])
    )
    const after = readBasketMountInput(
      platform,
      createSyntheticBasketInput([0.2, 0.1, 0.3])
    )
    expect(before.basket.externalSize).toEqual([0.6, 0.2, 1])
    expect(after.basket.externalSize).toEqual([0.2, 0.1, 0.3])
    expect(before).not.toBe(after)
    expect(platform).toEqual(createSyntheticBasketPlatform())
  })
})
