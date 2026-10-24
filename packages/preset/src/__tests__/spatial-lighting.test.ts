import { describe, expect, it, vi } from 'vitest'
import { readSpatialPresentationOptions } from '../spatial/lighting.js'
import { resolvePresetRequest } from '../composition/resolve.js'
import { PresetProfiles } from '../constants.js'

const lighting = () => ({
  hemisphere: [0xffffff, 0x777777, 1],
  keyPosition: [3, 6, 4],
  fillPosition: [-3, 3, -4],
  shadowExtent: 10,
  shadowFar: 50,
  castShadows: false
})

describe('Neutral spatial presentation admission', () => {
  it.each([
    null,
    [],
    { unknown: true },
    { softwareShadowFallback: 1 },
    { lighting: null },
    { lighting: { ...lighting(), unknown: 1 } },
    ...[
      { hemisphere: [0, -1, 1] },
      { hemisphere: [0, 0, -1] },
      { keyPosition: [0, 0] },
      { fillPosition: [0, Infinity, 0] },
      { shadowExtent: 0 },
      { shadowFar: 0.1 },
      { keyColor: 0x1000000 },
      { fillColor: 1.5 },
      { keyIntensity: NaN },
      { fillIntensity: -1 },
      { castShadows: 'yes' }
    ].map((patch) => ({ lighting: { ...lighting(), ...patch } }))
  ])('rejects malformed presentation %j', (input) => {
    expect(() => readSpatialPresentationOptions(input)).toThrow(/spatial/)
  })

  it('captures each field once and detaches caller arrays before deferred startup', () => {
    const source = lighting()
    const read = vi.fn(() => source.hemisphere)
    Object.defineProperty(source, 'hemisphere', { enumerable: true, get: read })
    // Retain the source array separately so the getter does not recurse.
    const original = [0xffffff, 0x777777, 1]
    read.mockImplementation(() => original)
    const result = readSpatialPresentationOptions({
      lighting: source,
      softwareShadowFallback: false
    })
    expect(read).toHaveBeenCalledOnce()
    original[2] = 99
    source.keyPosition[0] = 99
    source.castShadows = true
    expect(result.lighting?.hemisphere).toEqual([0xffffff, 0x777777, 1])
    expect(result.lighting?.keyPosition).toEqual([3, 6, 4])
    expect(result.lighting?.castShadows).toBe(false)
    expect(result.softwareShadowFallback).toBe(false)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.lighting)).toBe(true)
    expect(Object.isFrozen(result.lighting?.hemisphere)).toBe(true)
  })

  it('resolves lighting without changing selected or applied defaults', () => {
    const source = lighting()
    const result = resolvePresetRequest(
      {
        isCompositionOpen: () => true,
        hasRenderEngineProvider: () => false
      },
      {
        profile: PresetProfiles['3D'],
        defaults: [],
        spatial: { lighting: source }
      } as never
    )
    source.shadowFar = 500
    expect(result.spatial?.lighting?.shadowFar).toBe(50)
    expect(result.selectedDefaults).toEqual([])
    expect(result.appliedDefaults).toEqual([])
    expect(readSpatialPresentationOptions({})).toEqual({})
  })
})
