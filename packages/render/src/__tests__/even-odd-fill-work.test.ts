import { createHash } from 'node:crypto'
import { afterEach, expect, it, vi } from 'vitest'
import { createDefaultFill, FillKinds, type FillAttrs } from '@asyra/utils'
import {
  createEvenOddFillStyle,
  type EvenOddShape
} from '../fills/even-odd-fill.js'

class PixelCanvas {
  static latest: PixelCanvas
  pixels = new Uint8ClampedArray()
  constructor(
    readonly width: number,
    readonly height: number
  ) {
    PixelCanvas.latest = this
  }
  getContext() {
    return {
      createImageData: (width: number, height: number) => ({
        data: new Uint8ClampedArray(width * height * 4)
      }),
      putImageData: (image: { data: Uint8ClampedArray }) => {
        this.pixels = image.data
      }
    }
  }
}
afterEach(() => vi.unstubAllGlobals())
const rectangle = (
  x: number,
  y: number,
  width: number,
  height: number
): EvenOddShape['paths'][number] => ({
  segments: [
    { type: 'line', points: [x, y, x + width, y] },
    { type: 'line', points: [x + width, y, x + width, y + height] },
    { type: 'line', points: [x + width, y + height, x, y + height] },
    { type: 'line', points: [x, y + height, x, y] }
  ]
})
const gradient = (
  type: 'linear' | 'radial' | 'angular' | 'diamond',
  opacity = 1
) =>
  createDefaultFill({
    kind: FillKinds.GRADIENT,
    opacity,
    gradient: {
      gradientType: type,
      gradientHandles: [
        { x: 0, y: 0 },
        { x: 1, y: 0.7 },
        { x: 0.2, y: 0.9 }
      ],
      gradientStops: [
        { position: 0, color: '#316b70', opacity: 0.5 },
        { position: 0.55, color: '#5f9993', opacity: 1 },
        { position: 1, color: '#254f5a', opacity: 0.75 }
      ]
    }
  })
const raster = (fills: FillAttrs[], width = 8, height = 8, hole = true) => {
  vi.stubGlobal('OffscreenCanvas', PixelCanvas)
  const result = createEvenOddFillStyle({
    width,
    height,
    shape: {
      paths: [
        rectangle(0, 0, width, height),
        ...(hole
          ? [rectangle(width / 4, height / 4, width / 2, height / 2)]
          : [])
      ]
    },
    fills
  })
  expect(result).not.toBeNull()
  const canvas = PixelCanvas.latest
  result?.dispose()
  return canvas
}

it.each(['linear', 'radial', 'angular', 'diamond'] as const)(
  'preserves exact %s pixels, transparent stacking and hole boundaries',
  (type) => {
    const first = raster([gradient(type)])
    const stacked = raster([
      createDefaultFill({ color: '#b02030', opacity: 0.4 }),
      gradient(type, 0.7)
    ])
    const changed = gradient(type)
    if (!changed.gradient) throw new Error('Missing gradient')
    changed.gradient.gradientHandles[1] = { x: 0.7, y: 1 }
    const updated = raster([changed])
    for (const canvas of [first, stacked, updated]) {
      expect([canvas.width, canvas.height]).toEqual([16, 16])
      // Inner hole remains empty, including under multiple translucent fills.
      expect(
        Array.from(canvas.pixels.slice((8 * 16 + 8) * 4, (8 * 16 + 8) * 4 + 4))
      ).toEqual([0, 0, 0, 0])
    }
    expect(
      [first, stacked, updated].map((canvas) =>
        createHash('sha256').update(canvas.pixels).digest('hex')
      )
    ).toMatchSnapshot()
  }
)

it('prepares invariant gradient inputs once per fill instead of once per pixel', () => {
  const fill = gradient('linear')
  if (!fill.gradient) throw new Error('Missing gradient')
  let typeReads = 0
  Object.defineProperty(fill.gradient, 'gradientType', {
    get() {
      typeReads++
      return 'linear'
    }
  })
  const started = performance.now()
  const count = 24
  let pixels = 0
  for (let i = 0; i < count; i++) {
    const canvas = raster([fill], 320, 300, false)
    pixels += canvas.width * canvas.height
  }
  // Explicit diagnostic output from the retained performance fixture, no timing gate.
  // eslint-disable-next-line no-console
  console.info(
    JSON.stringify({
      owner: 'even-odd-fill',
      fills: count,
      pixels,
      typeReads,
      durationMs: performance.now() - started
    })
  )
  expect(pixels).toBe(9_216_000)
  expect(typeReads).toBeLessThanOrEqual(count)
  // Keep the full raster workload; this is a hang guard, not a speed assertion.
}, 30_000)

it.each(['linear', 'radial', 'angular', 'diamond'] as const)(
  'prepares %s handle coordinates once per raster',
  (type) => {
    const fill = gradient(type)
    if (!fill.gradient) throw new Error('Missing gradient')
    let reads = 0
    fill.gradient.gradientHandles = fill.gradient.gradientHandles.map(
      ({ x, y }) => ({
        get x() {
          reads++
          return x
        },
        get y() {
          reads++
          return y
        }
      })
    )
    raster([fill])
    expect(reads).toBeLessThanOrEqual(6)
  }
)
