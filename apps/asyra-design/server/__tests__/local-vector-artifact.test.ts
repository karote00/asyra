import { describe, expect, it, vi } from 'vitest'
import { Bezier } from 'bezier-js'
import { createLocalImageTools } from '../local-image-tools'
import { readFile } from 'node:fs/promises'
import { convertVTracerBuffer } from '../../vtracer-tool-server.mjs'
import {
  parseLocalVectorArtifact,
  prepareLocalVectorArtifact,
  vectorArtifactSummary
} from '../local-vector-artifact'

const svg =
  '<svg width="100" height="100"><path d="M0,0L80,0L80,80L0,80Z M20,20L20,40L40,40L40,20Z" fill="#008800"/><path d="M85,85L95,85L95,95L85,95Z" fill="#008800"/></svg>'
const input = {
  metadata: {
    imageAttachments: [
      { dataUrl: 'data:image/png;base64,YQ==', mediaType: 'image/png', size: 1 }
    ]
  }
}
const signal = () => new AbortController().signal

describe('native cubic reference geometry', () => {
  // Two cubic halves have extrema at y=5 and y=95, although controls lie
  // outside the image. Endpoints alone would report a zero-height shape.
  const curved =
    '<svg width="100" height="100"><path d="M10,50C10,-10,90,-10,90,50C90,110,10,110,10,50Z M40,40L40,60L60,60L60,40Z" fill="#008800"/></svg>'
  it('measures each admitted curve once and reuses its bounds across preparations', () => {
    const bbox = vi.spyOn(Bezier.prototype, 'bbox')
    try {
      const artifact = parseLocalVectorArtifact(curved)
      expect(bbox).toHaveBeenCalledTimes(2)
      for (const size of [120, 240, 480]) {
        const drawing = prepareLocalVectorArtifact(artifact, {
          imageArtifactId: artifact.imageArtifactId,
          compositionRole: 'Curved reference',
          bounds: { x: 0, y: 0, width: size, height: size },
          excludePathIds: []
        })
        expect(drawing.slices[0].descriptors[0]).toMatchObject({
          width: size,
          height: size
        })
      }
      expect(bbox).toHaveBeenCalledTimes(2)
      parseLocalVectorArtifact(curved)
      expect(bbox).toHaveBeenCalledTimes(4)
    } finally {
      bbox.mockRestore()
    }
  })
  it('preserves cubic controls, closing endpoints, holes and exact curve bounds under nonuniform scaling', () => {
    const artifact = parseLocalVectorArtifact(curved)
    expect(artifact.paths[0]).toMatchObject({
      bounds: { x: 10, y: 5, width: 80, height: 90 },
      pointCount: 10
    })
    const drawing = prepareLocalVectorArtifact(artifact, {
      imageArtifactId: artifact.imageArtifactId,
      compositionRole: 'Curved reference',
      bounds: { x: 20, y: 30, width: 160, height: 90 },
      excludePathIds: []
    })
    const descriptor = drawing.slices[0].descriptors[0]
    expect(descriptor).toMatchObject({
      x: 0,
      y: 0,
      width: 160,
      height: 90,
      fillRule: 'nonzero'
    })
    const points = Object.values(descriptor.points) as {
      id: string
      kind: string
      x: number
      y: number
      controlForId?: string
      controlRole?: string
    }[]
    expect(points.filter((point) => point.kind === 'control')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x: 20, y: 15, controlRole: 'out' }),
        expect.objectContaining({ x: 180, y: 15, controlRole: 'in' }),
        expect.objectContaining({ x: 180, y: 135, controlRole: 'out' }),
        expect.objectContaining({ x: 20, y: 135, controlRole: 'in' })
      ])
    )
    const networks = Object.values(descriptor.networks) as {
      pointIds: string[]
      segmentIds: string[]
      closed: boolean
    }[]
    expect(networks.map((n) => n.pointIds.length)).toEqual([2, 4])
    expect(networks.every((n) => n.closed)).toBe(true)
    const segments = Object.values(descriptor.segments) as {
      startId: string
      endId: string
      outControlId: string | null
      inControlId: string | null
    }[]
    expect(segments[1].endId).toBe(segments[0].startId)
    for (const segment of segments.slice(0, 2)) {
      expect(points.find((p) => p.id === segment.outControlId)).toMatchObject({
        kind: 'control',
        controlForId: segment.startId,
        controlRole: 'out'
      })
      expect(points.find((p) => p.id === segment.inControlId)).toMatchObject({
        kind: 'control',
        controlForId: segment.endId,
        controlRole: 'in'
      })
    }
    expect(drawing.pointCount).toBe(points.length)
    expect(artifact.paths[0].bounds).toEqual({
      x: 10,
      y: 5,
      width: 80,
      height: 90
    })
  })
  it('keeps a single-anchor closed cubic and mixed line/curve contours', () => {
    for (const d of [
      'M50,50C0,0,100,0,50,50Z',
      'M10,50L10,10C10,0,90,0,90,10L90,50Z'
    ]) {
      const artifact = parseLocalVectorArtifact(
        `<svg width="100" height="100"><path d="${d}" fill="#000000"/></svg>`
      )
      expect(artifact.paths).toHaveLength(1)
      expect(artifact.paths[0].bounds.height).toBeGreaterThan(0)
    }
  })
  it.each([
    'M0,0C1,2,3,4Z',
    'M0,0C1,2,3,4,5,6',
    'M0,0C1,2,3,4,5,6ZZ',
    'M0,0C1,2,3,4,1e999,6Z',
    'M0,0C1,2,3,4,999999,6Z',
    'M0,0Q1,2,3,4Z',
    'M0,0L80,0M10,10L20,10L20,20Z'
  ])('rejects malformed or unsupported geometry: %s', (d) => {
    expect(() =>
      parseLocalVectorArtifact(
        `<svg width="100" height="100"><path d="${d}" fill="#000000"/></svg>`
      )
    ).toThrow('Invalid vector artifact')
  })
})

describe('request-owned vector artifacts', () => {
  it('omits nonpainting degenerate SVG subpaths without dropping valid neighboring geometry', () => {
    const artifact = parseLocalVectorArtifact(
      svg.replace(
        '<path d="M0,0',
        '<path d="M1,1L2,2Z" fill="#000000"/><path d="M0,0'
      )
    )
    expect(artifact.paths).toHaveLength(2)
    expect(artifact.paths[0].pointCount).toBe(8)
  })
  it('preserves small foreground features in the supplied reference before descriptor preparation', async () => {
    const bytes = await readFile(
      new URL('../../e2e/fixtures/reference-logo.png', import.meta.url)
    )
    const artifact = parseLocalVectorArtifact(
      await convertVTracerBuffer({
        bytes,
        contentType: 'image/png',
        profile: 'photo-faithful',
        signal: signal()
      })
    )
    // Source-space oracle: the mouth occupies this small isolated foreground region.
    const mouth = artifact.paths.find(
      ({ bounds }) =>
        bounds.x >= 112 &&
        bounds.y >= 113 &&
        bounds.x + bounds.width <= 138 &&
        bounds.y + bounds.height <= 125
    )
    expect(mouth).toBeDefined()
    expect(mouth?.bounds.width).toBeGreaterThan(10)
    const drawing = prepareLocalVectorArtifact(artifact, {
      imageArtifactId: artifact.imageArtifactId,
      compositionRole: 'Reference',
      bounds: { x: 0, y: 0, width: 240, height: 240 },
      excludePathIds: []
    })
    const controls = drawing.slices
      .flatMap((slice) => slice.descriptors)
      .flatMap((descriptor) => Object.values(descriptor.points ?? {}))
      .filter(
        (point) =>
          typeof point === 'object' &&
          point !== null &&
          'kind' in point &&
          point.kind === 'control'
      )
    expect(controls.length).toBeGreaterThan(100)
  })
  it('returns compact summaries and expands selected geometry without model-authored coordinates', async () => {
    const convert = vi.fn(async () => svg)
    const tools = createLocalImageTools(input, convert)
    const summary = JSON.parse(
      await tools.call(
        'vtracer',
        {
          attachmentIndex: 0,
          plan: {
            strategy: 'preserve-vectors',
            reason: 'Preserve irregular reference contours.'
          }
        },
        signal()
      )
    )
    expect(summary.paths).toHaveLength(2)
    expect(summary.paths[0]).toMatchObject({
      bounds: { x: 0, y: 0, width: 80, height: 80 },
      pointCount: 8
    })
    expect(JSON.stringify(summary)).not.toMatch(/<svg|"points"|"segments"/)
    expect(
      await tools.call(
        'vtracer',
        {
          attachmentIndex: 0,
          plan: {
            strategy: 'preserve-vectors',
            reason: 'Preserve irregular reference contours.'
          }
        },
        signal()
      )
    ).toBe(JSON.stringify(summary))
    expect(convert).toHaveBeenCalledOnce()
    const batch = tools.resolveBatch({
      batchId: 'test',
      actions: [
        {
          id: 'draw',
          name: 'insert_vector_composition',
          summary: 'Draw reference',
          arguments: {
            imageArtifactId: summary.imageArtifactId,
            bounds: { x: 10, y: 20, width: 240, height: 240 },
            compositionRole: 'Reference',
            excludePathIds: [summary.paths[1].id]
          }
        }
      ]
    })
    const drawing = batch.actions[0].arguments
    expect(drawing.groupBounds).toEqual({
      x: 10,
      y: 20,
      width: 240,
      height: 240
    })
    expect(drawing.elementCount).toBe(1)
    expect(drawing.pointCount).toBe(8)
    const vector = drawing.slices[0].descriptors[0]
    expect(Object.values(vector.points)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x: 10, y: 20 }),
        expect.objectContaining({ x: 250, y: 260 })
      ])
    )
    expect(Object.keys(vector.networks)).toHaveLength(2)
    expect(vector.fillRule).toBe('nonzero')
    expect(vector.fills[0].color).toBe('#008800')
    expect(new Set(Object.values(vector.props)).size).toBe(
      Object.keys(vector.props).length
    )
  })

  it('rejects foreign references, unknown exclusions, empty geometry and invalid bounds', async () => {
    const tools = createLocalImageTools(input, async () => svg)
    const summary = JSON.parse(
      await tools.call(
        'vtracer',
        {
          attachmentIndex: 0,
          plan: {
            strategy: 'preserve-vectors',
            reason: 'Preserve irregular reference contours.'
          }
        },
        signal()
      )
    )
    const args = {
      imageArtifactId: summary.imageArtifactId,
      bounds: { x: 0, y: 0, width: 240, height: 240 },
      compositionRole: 'Reference',
      excludePathIds: []
    }
    const batch = (arguments_: unknown) => ({
      batchId: 'test',
      actions: [
        {
          id: 'draw',
          name: 'insert_vector_composition',
          summary: 'Draw',
          arguments: arguments_
        }
      ]
    })
    for (const invalid of [
      { ...args, imageArtifactId: 'foreign' },
      { ...args, excludePathIds: ['unknown'] },
      {
        ...args,
        excludePathIds: summary.paths.map((path: { id: string }) => path.id)
      },
      { ...args, bounds: { ...args.bounds, width: -1 } }
    ]) {
      expect(() => tools.resolveBatch(batch(invalid))).toThrow()
    }
    expect(() =>
      createLocalImageTools(input, async () => svg).resolveBatch(batch(args))
    ).toThrow()
  })

  it('rejects aborted conversion and malformed or unsupported SVG', async () => {
    for (const source of [
      '<svg/>',
      '<svg width="100" height="100"><script>bad</script></svg>',
      svg.replace('M0,0L80,0', 'M0,0C80,0')
    ]) {
      await expect(
        createLocalImageTools(input, async () => source).call(
          'vtracer',
          {
            attachmentIndex: 0,
            plan: {
              strategy: 'preserve-vectors',
              reason: 'Preserve irregular reference contours.'
            }
          },
          signal()
        )
      ).rejects.toThrow()
    }
    const controller = new AbortController()
    controller.abort()
    const convert = vi.fn(async () => svg)
    await expect(
      createLocalImageTools(input, convert).call(
        'vtracer',
        {
          attachmentIndex: 0,
          plan: {
            strategy: 'preserve-vectors',
            reason: 'Preserve irregular reference contours.'
          }
        },
        controller.signal
      )
    ).rejects.toThrow()
    expect(convert).not.toHaveBeenCalled()
  })
})

describe('explicit native oval preparation', () => {
  const source =
    '<svg width="100" height="100"><path d="M40,0L68,12L80,40L68,68L40,80L12,68L0,40L12,12Z" fill="#008800"/><path d="M85,85L95,85L95,95L85,95Z" fill="#FFFFFF"/></svg>'
  const artifact = parseLocalVectorArtifact(source)
  const args = {
    imageArtifactId: artifact.imageArtifactId,
    compositionRole: 'Drawing',
    bounds: { x: 10, y: 20, width: 190, height: 190 },
    excludePathIds: []
  }
  it('uses one native oval instead of polygon segments and preserves neighboring geometry', () => {
    const original = prepareLocalVectorArtifact(artifact, args)
    const result = prepareLocalVectorArtifact(artifact, {
      ...args,
      ovalPathIds: ['path-1']
    })
    const descriptors = result.slices.flatMap((slice) => slice.descriptors)
    expect(descriptors[0]).toMatchObject({
      type: 'oval',
      x: 0,
      y: 0,
      width: 160,
      height: 160,
      fills: [{ color: '#008800' }]
    })
    expect(descriptors[0]).not.toHaveProperty('points')
    expect(descriptors[0]).not.toHaveProperty('segments')
    expect(descriptors[1]).toMatchObject({
      type: 'vector',
      x: 170,
      y: 170,
      width: 20,
      height: 20
    })
    expect(result.roleToElementIds['path-1']).toEqual([descriptors[0].id])
    expect(result.pointCount).toBe(
      original.pointCount - artifact.paths[0].pointCount
    )
    expect(
      result.slices.reduce((sum, slice) => sum + slice.pointCount, 0)
    ).toBe(result.pointCount)
    expect(artifact.paths[0].pointCount).toBe(8)
    expect(vectorArtifactSummary(artifact).paths[0]).toMatchObject({
      subpathCount: 1
    })
    expect(original.slices[0].descriptors[0].type).toBe('vector')
  })
  it('rejects invalid or compound selections before producing descriptors', () => {
    for (const ovalPathIds of [
      ['missing'],
      ['path-1', 'path-1'],
      [1],
      null,
      'path-1'
    ]) {
      expect(() =>
        prepareLocalVectorArtifact(artifact, { ...args, ovalPathIds })
      ).toThrow()
    }
    expect(() =>
      prepareLocalVectorArtifact(artifact, {
        ...args,
        ovalPathIds: ['path-1'],
        excludePathIds: ['path-1']
      })
    ).toThrow()
    const compound = parseLocalVectorArtifact(svg)
    expect(() =>
      prepareLocalVectorArtifact(compound, {
        ...args,
        imageArtifactId: compound.imageArtifactId,
        ovalPathIds: ['path-1']
      })
    ).toThrow()
  })
})

describe('App component mapping before drawing', () => {
  const artifact = parseLocalVectorArtifact(
    '<svg width="100" height="100"><path d="M0,0L40,0L40,40L0,40Z" fill="#FF0000"/><path d="M70,0L90,20L70,40L50,20Z" fill="#0000FF"/><path d="M0,60L40,100L0,100Z" fill="#00FF00"/></svg>'
  )
  const args = {
    imageArtifactId: artifact.imageArtifactId,
    compositionRole: 'Mixed drawing',
    bounds: { x: 10, y: 20, width: 180, height: 200 },
    excludePathIds: []
  }
  it('maps each supported component explicitly while keeping other geometry as vectors', () => {
    expect(vectorArtifactSummary(artifact)).toMatchObject({
      componentTargets: {
        rect: expect.any(String),
        oval: expect.any(String)
      }
    })
    const result = prepareLocalVectorArtifact(artifact, {
      ...args,
      componentMappings: [
        { pathId: 'path-1', componentType: 'rect' },
        { pathId: 'path-2', componentType: 'oval' }
      ]
    })
    const descriptors = result.slices.flatMap((slice) => slice.descriptors)
    expect(descriptors.map((item) => item.type)).toEqual([
      'rect',
      'oval',
      'vector'
    ])
    expect(descriptors[0]).toMatchObject({
      x: 0,
      y: 0,
      width: 80,
      height: 80,
      fills: [{ color: '#FF0000' }]
    })
    expect(descriptors[1]).toMatchObject({
      x: 100,
      y: 0,
      width: 80,
      height: 80,
      fills: [{ color: '#0000FF' }]
    })
    expect(descriptors[0]).not.toHaveProperty('points')
    expect(descriptors[1]).not.toHaveProperty('points')
    expect(descriptors[2]).toHaveProperty('points')
    expect(result.pointCount).toBe(3)
    expect(artifact.paths.map((path) => path.pointCount)).toEqual([4, 4, 3])
  })
  it('rejects unsupported, conflicting, excluded or compound component mappings', () => {
    for (const componentMappings of [
      null,
      [{ pathId: 'missing', componentType: 'rect' }],
      [{ pathId: 'path-1', componentType: 'text' }],
      [
        { pathId: 'path-1', componentType: 'rect' },
        { pathId: 'path-1', componentType: 'oval' }
      ],
      [{ pathId: 'path-1', componentType: 'rect', extra: true }]
    ])
      expect(() =>
        prepareLocalVectorArtifact(artifact, { ...args, componentMappings })
      ).toThrow()
    const mapping = [{ pathId: 'path-1', componentType: 'rect' }]
    expect(() =>
      prepareLocalVectorArtifact(artifact, {
        ...args,
        componentMappings: mapping,
        ovalPathIds: ['path-1']
      })
    ).toThrow()
    expect(() =>
      prepareLocalVectorArtifact(artifact, {
        ...args,
        componentMappings: mapping,
        excludePathIds: ['path-1']
      })
    ).toThrow()
    const compound = parseLocalVectorArtifact(svg)
    expect(() =>
      prepareLocalVectorArtifact(compound, {
        ...args,
        imageArtifactId: compound.imageArtifactId,
        componentMappings: mapping
      })
    ).toThrow()
  })
})
