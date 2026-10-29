export interface SpatialLighting {
  readonly hemisphere: readonly [number, number, number]
  readonly keyPosition: readonly [number, number, number]
  readonly fillPosition: readonly [number, number, number]
  shadowExtent: number
  shadowFar: number
  keyColor?: number
  keyIntensity?: number
  fillColor?: number
  fillIntensity?: number
  castShadows?: boolean
}
export interface SpatialBloom {
  readonly strength: number
  /** Gaussian support radius in CSS pixels, independent of device pixel ratio. */
  readonly radius: number
}
export interface SpatialPresentationOptions {
  readonly bloom?: SpatialBloom
  readonly lighting?: SpatialLighting
  readonly softwareShadowFallback?: boolean
}
export const DEFAULT_SPATIAL_LIGHTING: SpatialLighting = {
  hemisphere: [0xffffff, 0x777777, 1],
  keyPosition: [3, 6, 4],
  fillPosition: [-3, 3, -4],
  shadowExtent: 10,
  shadowFar: 50
}

const record = (input: unknown): Record<string, unknown> => {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    throw new Error('Invalid spatial presentation settings')
  return { ...input }
}
const color = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 0xffffff
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const vector = (input: unknown): readonly [number, number, number] => {
  if (!Array.isArray(input) || input.length !== 3)
    throw new Error('Invalid spatial lighting vector')
  const values = [...input]
  if (!values.every(finite)) throw new Error('Invalid spatial lighting vector')
  return Object.freeze(values) as readonly [number, number, number]
}
const lightingKeys = new Set([
  'hemisphere',
  'keyPosition',
  'fillPosition',
  'shadowExtent',
  'shadowFar',
  'keyColor',
  'keyIntensity',
  'fillColor',
  'fillIntensity',
  'castShadows'
])
/** Capture neutral presentation settings without evaluating a concrete SDK. */
export function readSpatialLighting(input: unknown): Readonly<SpatialLighting> {
  const value = record(input)
  if (Object.keys(value).some((key) => !lightingKeys.has(key)))
    throw new Error('Invalid spatial lighting field')
  const hemisphere = vector(value.hemisphere)
  const keyPosition = vector(value.keyPosition)
  const fillPosition = vector(value.fillPosition)
  if (
    !color(hemisphere[0]) ||
    !color(hemisphere[1]) ||
    hemisphere[2] < 0 ||
    !finite(value.shadowExtent) ||
    value.shadowExtent <= 0 ||
    !finite(value.shadowFar) ||
    value.shadowFar <= 0.1 ||
    [value.keyColor, value.fillColor].some(
      (n) => n !== undefined && !color(n)
    ) ||
    [value.keyIntensity, value.fillIntensity].some(
      (n) => n !== undefined && (!finite(n) || n < 0)
    ) ||
    (value.castShadows !== undefined && typeof value.castShadows !== 'boolean')
  )
    throw new Error('Invalid spatial lighting')
  return Object.freeze({
    ...value,
    hemisphere,
    keyPosition,
    fillPosition
  }) as Readonly<SpatialLighting>
}
export function readSpatialPresentationOptions(
  input: unknown
): Readonly<SpatialPresentationOptions> {
  const value = record(input)
  if (
    Object.keys(value).some(
      (key) =>
        key !== 'lighting' &&
        key !== 'softwareShadowFallback' &&
        key !== 'bloom'
    ) ||
    (value.softwareShadowFallback !== undefined &&
      typeof value.softwareShadowFallback !== 'boolean')
  )
    throw new Error('Invalid spatial presentation field')
  return Object.freeze({
    ...(value.bloom === undefined
      ? {}
      : { bloom: readSpatialBloom(value.bloom) }),
    ...(value.lighting === undefined
      ? {}
      : { lighting: readSpatialLighting(value.lighting) }),
    ...(value.softwareShadowFallback === undefined
      ? {}
      : { softwareShadowFallback: value.softwareShadowFallback as boolean })
  })
}

export function readSpatialBloom(input: unknown): Readonly<SpatialBloom> {
  const value = record(input)
  if (
    Object.keys(value).some((key) => key !== 'strength' && key !== 'radius') ||
    !finite(value.strength) ||
    value.strength < 0 ||
    value.strength > 2 ||
    !finite(value.radius) ||
    value.radius <= 0 ||
    value.radius > 64
  )
    throw new Error('Invalid spatial bloom settings')
  return Object.freeze({ strength: value.strength, radius: value.radius })
}
