import { describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { createLocalImageTools } from '../local-image-tools'
import { separateImageBackground } from '../local-image-layer-separation'

const signal = () => new AbortController().signal
const options = {
  attachmentIndex: 0,
  background: {
    componentType: 'rect',
    bounds: { x: 2, y: 2, width: 8, height: 8 },
    fill: '#008800'
  },
  colorTolerance: 0,
  clipToBackground: false
}
const fixture = async () => {
  const pixels = Buffer.alloc(12 * 12 * 4)
  const set = (x: number, y: number, color: number[]) =>
    pixels.set(color, (y * 12 + x) * 4)
  for (let y = 2; y < 10; y++)
    for (let x = 2; x < 10; x++) set(x, y, [0, 136, 0, 255])
  // White foreground, green interior detail, and same-color exterior mark.
  for (let y = 4; y < 8; y++)
    for (let x = 4; x < 8; x++) set(x, y, [255, 255, 255, 255])
  set(5, 5, [0, 136, 0, 255])
  set(0, 0, [0, 136, 0, 255])
  const bytes = await sharp(pixels, {
    raw: { width: 12, height: 12, channels: 4 }
  })
    .png()
    .toBuffer()
  return {
    dataUrl: `data:image/png;base64,${bytes.toString('base64')}`,
    mediaType: 'image/png',
    size: bytes.length
  }
}
const batch = (imageArtifactId: string) => ({
  actions: [
    {
      name: 'insert_vector_composition',
      arguments: {
        imageArtifactId,
        compositionRole: 'Layered drawing',
        bounds: { x: 20, y: 20, width: 120, height: 120 },
        excludePathIds: []
      }
    }
  ]
})

describe('pre-trace image layer separation', () => {
  it('rejects whole-image tracing without an explicit representation decision before conversion', async () => {
    const convert = vi.fn(
      async () =>
        '<svg width="12" height="12"><path d="M0,0L12,0L12,12Z" fill="#008800"/></svg>'
    )
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [await fixture()] } },
      convert
    )
    await expect(
      tools.call('vtracer', { attachmentIndex: 0 }, signal())
    ).rejects.toThrow(/plan/i)
    expect(convert).not.toHaveBeenCalled()
  })

  it.each([
    null,
    {},
    { strategy: 'preserve-vectors', reason: ' ' },
    { strategy: 'unknown', reason: 'No base' },
    {
      strategy: 'preserve-vectors',
      reason: 'No base',
      background: options.background
    },
    {
      strategy: 'separate-background',
      reason: 'Native base',
      ...options,
      colorTolerance: -1
    }
  ])(
    'rejects invalid representation plans without conversion: %j',
    async (plan) => {
      const convert = vi.fn()
      const tools = createLocalImageTools(
        { metadata: { imageAttachments: [await fixture()] } },
        convert
      )
      await expect(
        tools.call('vtracer', { attachmentIndex: 0, plan }, signal())
      ).rejects.toThrow()
      expect(convert).not.toHaveBeenCalled()
    }
  )

  it('executes a native background decision through separation and returns its plan for review', async () => {
    const tools = createLocalImageTools({
      metadata: { imageAttachments: [await fixture()] }
    })
    const { attachmentIndex, ...layers } = options
    const plan = {
      strategy: 'separate-background',
      reason:
        'The flat rectangular base is a native component; preserve the white foreground.',
      ...layers
    }
    const result = JSON.parse(
      await tools.call('vtracer', { attachmentIndex, plan }, signal())
    )
    expect(result.representationPlan).toEqual(plan)
    expect(result.separation.removedPixelCount).toBe(49)
    const descriptors = tools
      .resolveBatch(batch(result.imageArtifactId))
      .actions[0].arguments.slices.flatMap(
        (s: { descriptors: { type: string }[] }) => s.descriptors
      )
    expect(descriptors[0].type).toBe('rect')
    expect(
      descriptors.slice(1).every((d: { type: string }) => d.type === 'vector')
    ).toBe(true)
  })

  it('separates only the selected region and preserves interior appearance over a native base', async () => {
    const convert = vi.fn(async ({ bytes }: { bytes: Uint8Array }) => {
      const { data } = await sharp(bytes)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      const pixel = (x: number, y: number) => [
        ...data.subarray((y * 12 + x) * 4, (y * 12 + x) * 4 + 4)
      ]
      expect(pixel(3, 3)[3]).toBe(0)
      expect(pixel(5, 5)[3]).toBe(0) // Underlay supplies this green interior.
      expect(pixel(4, 4)).toEqual([255, 255, 255, 255])
      expect(pixel(0, 0)).toEqual([0, 136, 0, 255]) // Not global color deletion.
      return '<svg width="12" height="12"><path d="M4,4L8,4L8,8L4,8Z" fill="#FFFFFF"/></svg>'
    })
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [await fixture()] } },
      convert
    )
    const result = JSON.parse(
      await tools.call('vectorize_image_layers', options, signal())
    )
    expect(result.background).toEqual(options.background)
    expect(result.separation.removedPixelCount).toBe(49)
    const drawing = tools.resolveBatch(batch(result.imageArtifactId)).actions[0]
      .arguments
    const descriptors = drawing.slices.flatMap(
      (slice: { descriptors: { type: string }[] }) => slice.descriptors
    )
    expect(descriptors.map((d: { type: string }) => d.type)).toEqual([
      'rect',
      'vector'
    ])
    expect(descriptors[0]).toMatchObject({
      x: 20,
      y: 20,
      width: 80,
      height: 80
    })
    expect(descriptors[1]).toMatchObject({
      x: 40,
      y: 40,
      width: 40,
      height: 40
    })
    expect(convert).toHaveBeenCalledOnce()
  })

  it('runs the real tracer on the residual and retains a separately editable native background', async () => {
    const tools = createLocalImageTools({
      metadata: { imageAttachments: [await fixture()] }
    })
    const result = JSON.parse(
      await tools.call(
        'vectorize_image_layers',
        { ...options, clipToBackground: true },
        signal()
      )
    )
    const drawing = tools.resolveBatch(batch(result.imageArtifactId)).actions[0]
      .arguments
    const descriptors = drawing.slices.flatMap(
      (slice: { descriptors: { type: string }[] }) => slice.descriptors
    )
    expect(descriptors[0]).toMatchObject({
      type: 'rect',
      x: 0,
      y: 0,
      width: 120,
      height: 120
    })
    expect(descriptors.slice(1).length).toBeGreaterThan(0)
    expect(
      descriptors.slice(1).every((d: { type: string }) => d.type === 'vector')
    ).toBe(true)
    expect(
      result.paths.every((p: { fill: string }) => p.fill !== '#008800')
    ).toBe(true)
  })

  it.each([
    { ...options, colorTolerance: 33 },
    { ...options, foregroundColors: [] },
    { ...options, foregroundColors: ['#FFFFFF', '#ffffff'] },
    { ...options, foregroundColors: ['#008800'] },
    { ...options, foregroundColors: ['red'] },
    { ...options, clipToBackground: 'yes' },
    {
      ...options,
      background: { ...options.background, componentType: 'text' }
    },
    {
      ...options,
      background: {
        ...options.background,
        bounds: { x: 0, y: 0, width: 0, height: 5 }
      }
    },
    {
      ...options,
      background: {
        ...options.background,
        bounds: { x: 0, y: 0, width: 99, height: 5 }
      }
    },
    { ...options, background: { ...options.background, fill: '#FF0000' } },
    { ...options, file: '/private/image.png' }
  ])('rejects invalid or ineffective decomposition %#', async (args) => {
    const convert = vi.fn()
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [await fixture()] } },
      convert
    )
    await expect(
      tools.call('vectorize_image_layers', args, signal())
    ).rejects.toThrow()
    expect(convert).not.toHaveBeenCalled()
  })
})

it('keeps an oval native-only result and never invokes the tracer for an empty foreground', async () => {
  const bytes = await sharp({
    create: { width: 16, height: 16, channels: 4, background: '#008800' }
  })
    .png()
    .toBuffer()
  const convert = vi.fn()
  const tools = createLocalImageTools(
    {
      metadata: {
        imageAttachments: [
          {
            mediaType: 'image/png',
            size: bytes.length,
            dataUrl: `data:image/png;base64,${bytes.toString('base64')}`
          }
        ]
      }
    },
    convert
  )
  const args = {
    ...options,
    background: {
      ...options.background,
      componentType: 'oval',
      bounds: { x: 0, y: 0, width: 16, height: 16 }
    },
    clipToBackground: true
  }
  const result = JSON.parse(
    await tools.call('vectorize_image_layers', args, signal())
  )
  expect(result.paths).toEqual([])
  expect(result.separation.clippedPixelCount).toBeGreaterThan(0)
  expect(convert).not.toHaveBeenCalled()
  const drawing = tools.resolveBatch(batch(result.imageArtifactId)).actions[0]
    .arguments
  expect(drawing.elementCount).toBe(1)
  expect(drawing.slices[0].descriptors[0]).toMatchObject({
    type: 'oval',
    width: 120,
    height: 120
  })
  const other = createLocalImageTools(
    { metadata: { imageAttachments: [await fixture()] } },
    convert
  )
  expect(() => other.resolveBatch(batch(result.imageArtifactId))).toThrow(
    'Unknown image reference'
  )
})

it('observes cancellation before and during pixel work without converting or publishing', async () => {
  for (const cancelBefore of [true, false]) {
    const controller = new AbortController()
    const convert = vi.fn()
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [await fixture()] } },
      convert
    )
    if (cancelBefore) controller.abort()
    const pending = tools.call(
      'vectorize_image_layers',
      options,
      controller.signal
    )
    if (!cancelBefore) controller.abort()
    await expect(pending).rejects.toThrow()
    expect(convert).not.toHaveBeenCalled()
  }
})

it('rejects forged media and oversized decoded dimensions before tracing', async () => {
  for (const bytes of [
    Buffer.from('<svg/>'),
    await sharp({
      create: { width: 2001, height: 2000, channels: 3, background: '#008800' }
    })
      .png()
      .toBuffer()
  ]) {
    const convert = vi.fn()
    const tools = createLocalImageTools(
      {
        metadata: {
          imageAttachments: [
            {
              mediaType: 'image/png',
              size: bytes.length,
              dataUrl: `data:image/png;base64,${bytes.toString('base64')}`
            }
          ]
        }
      },
      convert
    )
    await expect(
      tools.call('vectorize_image_layers', options, signal())
    ).rejects.toThrow()
    expect(convert).not.toHaveBeenCalled()
  }
})

it('bounds repeated decomposition and reuses a completed artifact during multiple preparations', async () => {
  const convert = vi.fn(
    async () =>
      '<svg width="12" height="12"><path d="M4,4L8,4L8,8L4,8Z" fill="#FFFFFF"/></svg>'
  )
  const tools = createLocalImageTools(
    { metadata: { imageAttachments: [await fixture()] } },
    convert
  )
  for (let colorTolerance = 0; colorTolerance < 4; colorTolerance++) {
    const result = JSON.parse(
      await tools.call(
        'vectorize_image_layers',
        { ...options, colorTolerance },
        signal()
      )
    )
    tools.resolveBatch(batch(result.imageArtifactId))
    tools.resolveBatch(batch(result.imageArtifactId))
  }
  await expect(
    tools.call('vectorize_image_layers', options, signal())
  ).rejects.toThrow(/limit/)
  expect(convert).toHaveBeenCalledTimes(4)
})

it('uses an explicitly selected flat foreground palette to separate antialiased background edges', async () => {
  const pixels = Buffer.from([
    77, 146, 119, 206, 0, 100, 60, 255, 230, 240, 236, 255, 255, 255, 255, 255
  ])
  const bytes = await sharp(pixels, {
    raw: { width: 2, height: 2, channels: 4 }
  })
    .png()
    .toBuffer()
  const convert = vi.fn(
    async ({ bytes: foreground }: { bytes: Uint8Array }) => {
      const data = await sharp(foreground).ensureAlpha().raw().toBuffer()
      expect(data[3]).toBe(0)
      expect(data[7]).toBe(0)
      expect([...data.subarray(8, 11)]).toEqual([255, 255, 255])
      return '<svg width="2" height="2"><path d="M0,1L2,1L2,2L0,2Z" fill="#FFFFFF"/></svg>'
    }
  )
  const tools = createLocalImageTools(
    {
      metadata: {
        imageAttachments: [
          {
            dataUrl: `data:image/png;base64,${bytes.toString('base64')}`,
            mediaType: 'image/png',
            size: bytes.length
          }
        ]
      }
    },
    convert
  )
  const summary = JSON.parse(
    await tools.call(
      'vectorize_image_layers',
      {
        ...options,
        background: {
          componentType: 'rect',
          bounds: { x: 0, y: 0, width: 2, height: 2 },
          fill: '#00643C'
        },
        foregroundColors: ['#FFFFFF']
      },
      signal()
    )
  )
  expect(summary.separation.removedPixelCount).toBe(2)
  expect(summary.separation.foregroundPixelCount).toBe(2)
  expect(convert).toHaveBeenCalledOnce()
})

it('uses displayed JPEG orientation for native and foreground coordinates', async () => {
  const bytes = await sharp({
    create: { width: 8, height: 4, channels: 3, background: '#008800' }
  })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer()
  const convert = vi.fn()
  const tools = createLocalImageTools(
    {
      metadata: {
        imageAttachments: [
          {
            dataUrl: `data:image/jpeg;base64,${bytes.toString('base64')}`,
            mediaType: 'image/jpeg',
            size: bytes.length
          }
        ]
      }
    },
    convert
  )
  const result = JSON.parse(
    await tools.call(
      'vectorize_image_layers',
      {
        ...options,
        background: {
          ...options.background,
          bounds: { x: 0, y: 0, width: 4, height: 8 }
        },
        foregroundColors: ['#FFFFFF'],
        clipToBackground: true
      },
      signal()
    )
  )
  expect(result).toMatchObject({ width: 4, height: 8, paths: [] })
  expect(convert).not.toHaveBeenCalled()
})

it.each(['image/png', 'image/webp'])(
  'accepts real WebP bytes advertised as %s without trusting the extension',
  async (mediaType) => {
    const bytes = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#008800' }
    })
      .webp({ lossless: true })
      .toBuffer()
    const tools = createLocalImageTools({
      metadata: {
        imageAttachments: [
          {
            dataUrl: `data:${mediaType};base64,${bytes.toString('base64')}`,
            mediaType,
            size: bytes.length
          }
        ]
      }
    })
    expect(
      tools.definitions.some((tool) => tool.name === 'vectorize_image_layers')
    ).toBe(true)
    const result = JSON.parse(
      await tools.call(
        'vectorize_image_layers',
        {
          ...options,
          background: {
            ...options.background,
            bounds: { x: 0, y: 0, width: 8, height: 8 }
          },
          foregroundColors: ['#FFFFFF'],
          clipToBackground: true
        },
        signal()
      )
    )
    expect(result.paths).toEqual([])
  }
)

it('classifies flat-palette coverage without turning transparent matte fringes into foreground', async () => {
  const pixels = Buffer.from([
    0, 100, 60, 255, 160, 200, 185, 20, 255, 255, 255, 210, 255, 255, 255, 255
  ])
  const bytes = await sharp(pixels, {
    raw: { width: 4, height: 1, channels: 4 }
  })
    .png()
    .toBuffer()
  const result = await separateImageBackground(
    bytes,
    'image/png',
    {
      ...options,
      background: {
        componentType: 'rect',
        bounds: { x: 0, y: 0, width: 4, height: 1 },
        fill: '#00643C'
      },
      foregroundColors: ['#FFFFFF']
    },
    signal()
  )
  const output = await sharp(result.foreground).raw().toBuffer()
  // The visible color of a barely covered matte pixel belongs to the base.
  expect(output[7]).toBe(0)
  // Emit a binary flat-color mask: the converter treats nonzero alpha as solid.
  // Classification must happen once here, using visible coverage.
  expect([...output.subarray(8, 12)]).toEqual([255, 255, 255, 255])
  expect(result.separation.foregroundPixelCount).toBe(2)
})

it('real tracing keeps an admitted foreground contact and emits no faint fringe islands', async () => {
  const pixels = Buffer.alloc(12 * 12 * 4)
  for (let i = 0; i < pixels.length; i += 4) pixels.set([0, 100, 60, 255], i)
  for (let y = 4; y < 8; y++)
    for (let x = 0; x < 6; x++)
      pixels.set([255, 255, 255, x === 0 ? 210 : 255], (y * 12 + x) * 4)
  for (let y = 0; y < 3; y++)
    for (let x = 10; x < 12; x++)
      pixels.set([160, 200, 185, 20], (y * 12 + x) * 4)
  const bytes = await sharp(pixels, {
    raw: { width: 12, height: 12, channels: 4 }
  })
    .png()
    .toBuffer()
  const tools = createLocalImageTools({
    metadata: {
      imageAttachments: [
        {
          dataUrl: `data:image/png;base64,${bytes.toString('base64')}`,
          mediaType: 'image/png',
          size: bytes.length
        }
      ]
    }
  })
  const result = JSON.parse(
    await tools.call(
      'vectorize_image_layers',
      {
        ...options,
        background: {
          componentType: 'rect',
          bounds: { x: 0, y: 0, width: 12, height: 12 },
          fill: '#00643C'
        },
        foregroundColors: ['#FFFFFF'],
        clipToBackground: true
      },
      signal()
    )
  )
  expect(result.paths).toHaveLength(1)
  expect(result.paths[0]).toMatchObject({
    fill: '#FFFFFF',
    bounds: { x: 0, y: 4, width: 6, height: 4 }
  })
})
