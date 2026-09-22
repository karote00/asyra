import { SITE, BED_STRIPS, type Site, type Strip } from './greenhouse'
export interface FarmConfiguration {
  length: number
  width: number
  height: number
  strips: { kind: Strip['kind']; width: number }[]
  soilInset: number
  startInset: number
  endInset: number
  topExtension: number
  netTop: number
  netBottom: number
}
export const DEFAULT_CONFIGURATION: FarmConfiguration = {
  length: 50,
  width: 7,
  height: 5,
  strips: BED_STRIPS.map((strip) => ({ ...strip })),
  soilInset: 0.15,
  startInset: 0.25,
  endInset: 0.25,
  topExtension: 0.15,
  netTop: 3,
  netBottom: 0.45
}
export function configurationSite(config: FarmConfiguration): Site {
  return {
    ...SITE,
    length: config.length,
    width: config.width,
    height: config.height,
    eave: config.height * 0.6,
    margin:
      (config.width -
        config.strips.reduce((sum, strip) => sum + strip.width, 0)) /
      2
  }
}
export function validateConfiguration(
  value: FarmConfiguration
): FarmConfiguration {
  const range = (name: string, n: number, min: number, max: number) => {
    if (!Number.isFinite(n) || n < min || n > max)
      throw new Error(
        `${name} must be between ${Number(min.toFixed(3))} and ${Number(max.toFixed(3))} metres`
      )
  }
  range('depth', value.length, 2, 200)
  range('single bay width', value.width, 2, 20)
  range('total height', value.height, 2, 10)
  if (
    !Array.isArray(value.strips) ||
    !value.strips.length ||
    value.strips.length > 32
  )
    throw new Error('strip layout requires 1 to 32 items')
  value.strips.forEach((strip) => {
    if (strip.kind !== 'soil' && strip.kind !== 'drain')
      throw new Error('strip type must be soil or drain')
    range('strip width', strip.width, 0.05, 20)
  })
  const site = configurationSite(value)
  if (site.margin < 0.02)
    throw new Error(
      'total strip width must be less than single bay width, with at least 2cm on each side'
    )
  if (value.height - site.eave > site.width / 2)
    throw new Error(
      'arch rise cannot exceed the half span; increase width or lower height'
    )
  range('pipe distance from drain', value.soilInset, 0.01, 5)
  range('front inset', value.startInset, 0, value.length)
  range('rear inset', value.endInset, 0, value.length)
  if (value.startInset + value.endInset > value.length - 0.6)
    throw new Error('front and rear insets must leave at least 60cm')
  range('pipe extension above beam', value.topExtension, 0, 2)
  if (site.eave + value.topExtension >= site.height)
    throw new Error('crop support pipe top must be below the arch peak')
  range('net bottom height', value.netBottom, 0, site.eave + value.topExtension)
  range(
    'net top height',
    value.netTop,
    value.netBottom + 0.05,
    site.eave + value.topExtension
  )
  value.strips.forEach((strip, i) => {
    if (
      strip.kind === 'soil' &&
      (value.strips[i - 1]?.kind === 'drain' ||
        value.strips[i + 1]?.kind === 'drain') &&
      strip.width < value.soilInset + 0.01
    )
      throw new Error(
        'soil beside the drain is too narrow for the support pipe and requested distance'
      )
  })
  const sides = value.strips.reduce(
    (sum, strip, i) =>
      sum +
      (strip.kind === 'soil'
        ? Number(value.strips[i - 1]?.kind === 'drain') +
          Number(value.strips[i + 1]?.kind === 'drain')
        : 0),
    0
  )
  if (
    4 *
      sides *
      (Math.floor((value.length - value.startInset - value.endInset) / 0.6) +
        1) >
    20000
  )
    throw new Error(
      'the current scene supports at most 20,000 crop support pipes; reduce depth or drain count'
    )
  return Object.freeze({
    ...value,
    strips: Object.freeze(
      value.strips.map((strip) => Object.freeze({ ...strip }))
    )
  }) as unknown as FarmConfiguration
}
