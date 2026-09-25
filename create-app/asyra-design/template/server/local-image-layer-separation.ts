import { Buffer } from 'node:buffer'
import { setImmediate as yieldToEventLoop } from 'node:timers/promises'
import sharp from 'sharp'

export interface NativeImageBackground {
  componentType: 'oval' | 'rect'
  bounds: { x: number; y: number; width: number; height: number }
  fill: string
}
export const IMAGE_LAYER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'attachmentIndex',
    'background',
    'colorTolerance',
    'clipToBackground'
  ],
  properties: {
    attachmentIndex: { type: 'integer', minimum: 0 },
    background: {
      type: 'object',
      additionalProperties: false,
      required: ['componentType', 'bounds', 'fill'],
      properties: {
        componentType: { type: 'string', enum: ['oval', 'rect'] },
        bounds: {
          type: 'object',
          additionalProperties: false,
          required: ['x', 'y', 'width', 'height'],
          properties: {
            x: { type: 'number', minimum: 0 },
            y: { type: 'number', minimum: 0 },
            width: { type: 'number', exclusiveMinimum: 0 },
            height: { type: 'number', exclusiveMinimum: 0 }
          }
        },
        fill: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
      }
    },
    colorTolerance: { type: 'integer', minimum: 0, maximum: 32 },
    clipToBackground: { type: 'boolean' },
    foregroundColors: {
      type: 'array',
      minItems: 1,
      maxItems: 16,
      uniqueItems: true,
      items: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
      description:
        'Optional intentional flat foreground palette. Within the region, quantize to the nearest background or foreground color instead of using colorTolerance. Omit for shading, gradients or uncertain colors.'
    }
  }
} as const
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const invalid = (): never => {
  throw new Error('Invalid image layer separation')
}

/** The model selects semantics. This owner only applies the explicit base region. */
export const separateImageBackground = async (
  bytes: Uint8Array,
  contentType: string,
  value: unknown,
  signal: AbortSignal
) => {
  signal.throwIfAborted()
  if (
    !record(value) ||
    Object.keys(value).some(
      (key) =>
        ![
          'attachmentIndex',
          'background',
          'colorTolerance',
          'clipToBackground',
          'foregroundColors'
        ].includes(key)
    ) ||
    !Number.isSafeInteger(value.attachmentIndex) ||
    Number(value.attachmentIndex) < 0 ||
    typeof value.clipToBackground !== 'boolean' ||
    !Number.isInteger(value.colorTolerance) ||
    Number(value.colorTolerance) < 0 ||
    Number(value.colorTolerance) > 32 ||
    !record(value.background)
  )
    return invalid()
  if (
    value.foregroundColors !== undefined &&
    (!Array.isArray(value.foregroundColors) ||
      !value.foregroundColors.length ||
      value.foregroundColors.length > 16 ||
      value.foregroundColors.some(
        (color) => typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)
      ))
  )
    return invalid()
  const background = value.background
  if (
    Object.keys(background).length !== 3 ||
    !['oval', 'rect'].includes(String(background.componentType)) ||
    typeof background.fill !== 'string' ||
    !/^#[0-9a-f]{6}$/i.test(background.fill) ||
    !record(background.bounds)
  )
    return invalid()
  const bounds = background.bounds
  if (
    Object.keys(bounds).length !== 4 ||
    !['x', 'y', 'width', 'height'].every(
      (key) => typeof bounds[key] === 'number' && Number.isFinite(bounds[key])
    ) ||
    Number(bounds.x) < 0 ||
    Number(bounds.y) < 0 ||
    Number(bounds.width) <= 0 ||
    Number(bounds.height) <= 0
  )
    return invalid()
  // Admit actual PNG/JPEG/WebP signatures before handing untrusted bytes to a decoder.
  const source = Buffer.from(bytes)
  const png = source
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const jpeg = source[0] === 255 && source[1] === 216 && source[2] === 255
  const webp =
    source.subarray(0, 4).toString('ascii') === 'RIFF' &&
    source.subarray(8, 12).toString('ascii') === 'WEBP'
  if (
    source.length > 16 * 1024 * 1024 ||
    !['image/png', 'image/jpeg', 'image/webp'].includes(contentType) ||
    !(png || jpeg || webp)
  )
    return invalid()
  const decoder = sharp(source, {
    limitInputPixels: 4_000_000,
    failOn: 'warning'
  }).timeout({ seconds: 10 })
  const metadata = await decoder.metadata()
  if (
    !['png', 'jpeg', 'webp'].includes(metadata.format ?? '') ||
    (metadata.pages ?? 1) !== 1
  )
    return invalid()
  signal.throwIfAborted()
  // Match the orientation the model sees, rather than raw JPEG sensor coordinates.
  const { data, info } = await decoder
    .autoOrient()
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  signal.throwIfAborted()
  const native = background as unknown as NativeImageBackground
  const b = native.bounds
  if (
    b.x + b.width > info.width ||
    b.y + b.height > info.height ||
    info.channels !== 4
  )
    return invalid()
  const color = [1, 3, 5].map((offset) =>
    parseInt(native.fill.slice(offset, offset + 2), 16)
  )
  const paletteColors = (value.foregroundColors ?? []) as string[]
  const paletteNames = [native.fill, ...paletteColors].map((entry) =>
    entry.toUpperCase()
  )
  if (new Set(paletteNames).size !== paletteNames.length) return invalid()
  const palette = paletteColors.length
    ? [
        color,
        ...paletteColors.map((entry) =>
          [1, 3, 5].map((offset) =>
            parseInt(entry.slice(offset, offset + 2), 16)
          )
        )
      ]
    : []
  // VTracer treats every nonzero-alpha sample as a solid color. Classify the
  // visible sample over the explicitly selected base, not hidden matte RGB.
  const distance = (offset: number, candidate: number[]) => {
    const coverage = data[offset + 3] / 255
    return color.reduce((sum, channel, index) => {
      const visible = data[offset + index] * coverage + channel * (1 - coverage)
      return sum + (visible - candidate[index]) ** 2
    }, 0)
  }
  let removedPixelCount = 0
  let foregroundPixelCount = 0
  let clippedPixelCount = 0
  for (let y = 0; y < info.height; y++) {
    if (y % 32 === 0) {
      await yieldToEventLoop()
      signal.throwIfAborted()
    }
    for (let x = 0; x < info.width; x++) {
      const offset = (y * info.width + x) * 4
      if (data[offset + 3] === 0) continue
      const nx = (x + 0.5 - b.x) / b.width
      const ny = (y + 0.5 - b.y) / b.height
      let inside = nx >= 0 && nx < 1 && ny >= 0 && ny < 1
      if (native.componentType === 'oval')
        inside = inside && (nx * 2 - 1) ** 2 + (ny * 2 - 1) ** 2 <= 1
      if (!inside && value.clipToBackground) {
        data[offset + 3] = 0
        clippedPixelCount++
        continue
      }
      let matches =
        inside &&
        color.every(
          (channel, index) =>
            Math.abs(data[offset + index] - channel) <=
            Number(value.colorTolerance)
        )
      if (inside && palette.length) {
        let nearest = 0
        let bestDistance = distance(offset, palette[0])
        for (let index = 1; index < palette.length; index++) {
          const candidateDistance = distance(offset, palette[index])
          if (candidateDistance < bestDistance) {
            nearest = index
            bestDistance = candidateDistance
          }
        }
        matches = nearest === 0
        if (!matches) {
          data.set(palette[nearest], offset)
          data[offset + 3] = 255
        }
      }
      if (matches) {
        data[offset + 3] = 0
        removedPixelCount++
      } else foregroundPixelCount++
    }
  }
  if (!removedPixelCount)
    throw new Error(
      'No pixels match the selected background region. Revise the separation parameters or keep the original vectors.'
    )
  const foreground = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .png()
    .timeout({ seconds: 10 })
    .toBuffer()
  signal.throwIfAborted()
  return {
    foreground,
    width: info.width,
    height: info.height,
    background: {
      componentType: native.componentType,
      bounds: { ...b },
      fill: native.fill.toUpperCase()
    },
    sourceBounds: value.clipToBackground
      ? { ...b }
      : { x: 0, y: 0, width: info.width, height: info.height },
    separation: {
      removedPixelCount,
      foregroundPixelCount,
      clippedPixelCount,
      ...(paletteColors.length
        ? { foregroundColors: paletteNames.slice(1) }
        : {})
    }
  }
}
