import { describe, expect, it, vi } from 'vitest'
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
  })
  it('returns compact summaries and expands selected geometry without model-authored coordinates', async () => {
    const convert = vi.fn(async () => svg)
    const tools = createLocalImageTools(input, convert)
    const summary = JSON.parse(
      await tools.call('vtracer', { attachmentIndex: 0 }, signal())
    )
    expect(summary.paths).toHaveLength(2)
    expect(summary.paths[0]).toMatchObject({
      bounds: { x: 0, y: 0, width: 80, height: 80 },
      pointCount: 8
    })
    expect(JSON.stringify(summary)).not.toMatch(/<svg|"points"|"segments"/)
    expect(await tools.call('vtracer', { attachmentIndex: 0 }, signal())).toBe(
      JSON.stringify(summary)
    )
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
      await tools.call('vtracer', { attachmentIndex: 0 }, signal())
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
          { attachmentIndex: 0 },
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
        { attachmentIndex: 0 },
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
