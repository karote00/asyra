import { SITE, BED_STRIPS, type Site, type Strip } from './greenhouse'
export interface FarmConfiguration {
  length: number
  width: number
  height: number
  eaveHeight?: number
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
    eave:
      config.eaveHeight === undefined ? config.height * 0.6 : config.eaveHeight,
    margin:
      (config.width -
        config.strips.reduce((sum, strip) => sum + strip.width, 0)) /
      2
  }
}
export type ConfigurationField =
  Exclude<keyof FarmConfiguration, 'strips'> | 'stripWidth'
export type ConfigurationErrorCode =
  | 'range'
  | 'stripCount'
  | 'stripKind'
  | 'clearance'
  | 'arch'
  | 'inset'
  | 'poleTop'
  | 'roots'
  | 'capacity'
export class ConfigurationError extends Error {
  constructor(
    readonly code: ConfigurationErrorCode,
    readonly field?: ConfigurationField,
    readonly min?: number,
    readonly max?: number
  ) {
    super(`Invalid farm configuration: ${code}${field ? ` (${field})` : ''}`)
    this.name = 'ConfigurationError'
  }
}
export function validateConfiguration(
  value: FarmConfiguration
): FarmConfiguration {
  const range = (
    name: ConfigurationField,
    n: number,
    min: number,
    max: number
  ) => {
    if (!Number.isFinite(n) || n < min || n > max)
      throw new ConfigurationError(
        'range',
        name,
        Number(min.toFixed(3)),
        Number(max.toFixed(3))
      )
  }
  range('length', value.length, 2, 200)
  range('width', value.width, 2, 20)
  range('height', value.height, 2, 10)
  if (
    !Array.isArray(value.strips) ||
    !value.strips.length ||
    value.strips.length > 32
  )
    throw new ConfigurationError('stripCount')
  value.strips.forEach((strip) => {
    if (strip.kind !== 'soil' && strip.kind !== 'drain')
      throw new ConfigurationError('stripKind')
    range('stripWidth', strip.width, 0.05, 20)
  })
  const site = configurationSite(value)
  range('eaveHeight', site.eave, 0.1, value.height - 0.05)
  if (
    value.width <
    value.strips.reduce((sum, strip) => sum + strip.width, 0) + 0.04
  )
    throw new ConfigurationError('clearance')
  if (value.height - site.eave > site.width / 2)
    throw new ConfigurationError('arch')
  range('soilInset', value.soilInset, 0.01, 5)
  range('startInset', value.startInset, 0, value.length)
  range('endInset', value.endInset, 0, value.length)
  if (value.startInset + value.endInset > value.length - 0.6)
    throw new ConfigurationError('inset')
  range('topExtension', value.topExtension, 0, 2)
  if (site.eave + value.topExtension >= site.height)
    throw new ConfigurationError('poleTop')
  range('netBottom', value.netBottom, 0, site.eave + value.topExtension)
  range(
    'netTop',
    value.netTop,
    value.netBottom + 0.05,
    site.eave + value.topExtension
  )
  value.strips.forEach((strip, i) => {
    if (
      strip.kind === 'soil' &&
      (value.strips[i - 1]?.kind === 'drain' ||
        value.strips[i + 1]?.kind === 'drain') &&
      strip.width < value.soilInset + 0.05
    )
      throw new ConfigurationError('roots')
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
    throw new ConfigurationError('capacity')
  return Object.freeze({
    ...value,
    strips: Object.freeze(
      value.strips.map((strip) => Object.freeze({ ...strip }))
    )
  }) as unknown as FarmConfiguration
}
