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
        `${name}必須介於 ${Number(min.toFixed(3))} 與 ${Number(max.toFixed(3))} 公尺`
      )
  }
  range('縱向深度', value.length, 2, 200)
  range('單棟寬度', value.width, 2, 20)
  range('總高度', value.height, 2, 10)
  if (
    !Array.isArray(value.strips) ||
    !value.strips.length ||
    value.strips.length > 32
  )
    throw new Error('畦溝配置需要 1 至 32 個項目')
  value.strips.forEach((strip) => {
    if (strip.kind !== 'soil' && strip.kind !== 'drain')
      throw new Error('畦溝種類必須是土壤或水道')
    range('畦溝寬度', strip.width, 0.05, 20)
  })
  const site = configurationSite(value)
  if (site.margin < 0.02)
    throw new Error('畦溝總寬必須小於單棟寬度，左右至少各留 2cm')
  if (value.height - site.eave > site.width / 2)
    throw new Error('拱頂起拱高度不可超過半跨寬；請增加寬度或降低高度')
  range('鋼管距水道', value.soilInset, 0.01, 5)
  range('前端留白', value.startInset, 0, value.length)
  range('尾端留白', value.endInset, 0, value.length)
  if (value.startInset + value.endInset > value.length - 0.6)
    throw new Error('前後留白之間至少需保留 60cm')
  range('鋼管超出橫樑', value.topExtension, 0, 2)
  if (site.eave + value.topExtension >= site.height)
    throw new Error('栽培鋼管頂端必須低於拱頂')
  range('網底高度', value.netBottom, 0, site.eave + value.topExtension)
  range(
    '網頂高度',
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
      throw new Error('水道旁土壤寬度不足以容納鋼管與指定距離')
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
      '目前單次場景最多支援 20,000 根栽培鋼管，請縮短深度或減少水道'
    )
  return Object.freeze({
    ...value,
    strips: Object.freeze(
      value.strips.map((strip) => Object.freeze({ ...strip }))
    )
  }) as unknown as FarmConfiguration
}
