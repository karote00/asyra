import { describe, expect, it, vi } from 'vitest'
import { createLocalImageTools } from '../local-image-tools'
import { AiImageToolIds } from '../ai-domain-prompt'
import * as analysis from '../local-vector-component-analysis'

describe('local provider image tools', () => {
  const attachment = {
    dataUrl: 'data:image/png;base64,YQ==',
    mediaType: 'image/png',
    size: 1
  }
  it('vectorizes only the referenced submitted image through the existing converter', async () => {
    const convert = vi.fn(
      async () =>
        '<svg width="1" height="1"><path d="M0,0L1,0L1,1Z" fill="#000000"/></svg>'
    )
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [attachment] } },
      convert
    )
    expect(tools.definitions).toHaveLength(2)
    const signal = new AbortController().signal
    expect(
      await tools.call('vtracer', { attachmentIndex: 0 }, signal)
    ).toContain('imageArtifactId')
    expect(convert).toHaveBeenCalledOnce()
    expect(convert.mock.calls[0]).toEqual([
      {
        bytes: Buffer.from('a'),
        contentType: 'image/png',
        profile: 'photo-faithful',
        signal
      }
    ])
  })
  it.each([
    ['shell', { attachmentIndex: 0 }],
    ['vtracer', { attachmentIndex: 1 }],
    ['vtracer', { attachmentIndex: 0, path: '/private/file.png' }]
  ])(
    'rejects unregistered capability or attachment input',
    async (name, args) => {
      const convert = vi.fn()
      const tools = createLocalImageTools(
        { metadata: { imageAttachments: [attachment] } },
        convert
      )
      await expect(
        tools.call(name as string, args, new AbortController().signal)
      ).rejects.toThrow()
      expect(convert).not.toHaveBeenCalled()
    }
  )
  it('does not advertise image generation or vectorization without a compatible attachment', () => {
    expect(createLocalImageTools({}).definitions).toEqual([])
    expect(
      createLocalImageTools({
        metadata: {
          imageAttachments: [{ ...attachment, mediaType: 'image/webp' }]
        }
      }).definitions
    ).toEqual([])
  })

  it('requires same-request analysis for mappings and reuses evidence during preparation', async () => {
    const source =
      '<svg width="100" height="100"><path d="M10,10L90,10L90,90L10,90Z" fill="#008800"/></svg>'
    const convert = vi.fn(async () => source)
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [attachment] } },
      convert
    )
    const signal = new AbortController().signal
    const summary = JSON.parse(
      await tools.call(AiImageToolIds.VTRACER, { attachmentIndex: 0 }, signal)
    )
    const args = {
      imageArtifactId: summary.imageArtifactId,
      bounds: { x: 0, y: 0, width: 240, height: 240 },
      compositionRole: 'Shape',
      excludePathIds: [],
      componentMappings: [{ pathId: 'path-1', componentType: 'rect' }]
    }
    const batch = (reference: object) => ({
      batchId: 'selection',
      actions: [
        {
          id: 'insert',
          name: 'insert_vector_composition',
          arguments: reference
        }
      ]
    })
    expect(() => tools.resolveBatch(batch(args))).toThrow(/analysis/i)
    const measure = vi.spyOn(analysis, 'analyzeVectorComponents')
    try {
      const report = JSON.parse(
        await tools.call(
          AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
          { imageArtifactId: summary.imageArtifactId, pathIds: ['path-1'] },
          signal
        )
      )
      expect(report.paths[0].candidates).toContainEqual(
        expect.objectContaining({ componentType: 'rect', eligible: true })
      )
      for (const size of [120, 240]) {
        const prepared = tools.resolveBatch(
          batch({
            ...args,
            analysisIds: [report.analysisId],
            bounds: { x: 0, y: 0, width: size, height: size }
          })
        )
        expect(prepared.actions[0].arguments).toMatchObject({
          slices: [
            {
              descriptors: [
                expect.objectContaining({ type: 'rect', width: size })
              ]
            }
          ]
        })
      }
      expect(measure).toHaveBeenCalledOnce()
      expect(convert).toHaveBeenCalledOnce()
      expect(() =>
        tools.resolveBatch(
          batch({
            ...args,
            analysisIds: [report.analysisId],
            componentMappings: [{ pathId: 'path-1', componentType: 'oval' }]
          })
        )
      ).toThrow(/analysis/i)
      const other = createLocalImageTools(
        { metadata: { imageAttachments: [attachment] } },
        convert
      )
      const otherSummary = JSON.parse(
        await other.call(AiImageToolIds.VTRACER, { attachmentIndex: 0 }, signal)
      )
      expect(() =>
        other.resolveBatch(
          batch({
            ...args,
            imageArtifactId: otherSummary.imageArtifactId,
            analysisIds: [report.analysisId]
          })
        )
      ).toThrow(/analysis/i)
    } finally {
      measure.mockRestore()
    }
  })
  it('bounds analysis calls and rejects forged receipts, stale sources and cancellation', async () => {
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [attachment, attachment] } },
      async () =>
        '<svg width="10" height="10"><path d="M0,0L10,0L10,10L0,10Z" fill="#000000"/></svg>'
    )
    const signal = new AbortController().signal
    const source = JSON.parse(
      await tools.call(AiImageToolIds.VTRACER, { attachmentIndex: 0 }, signal)
    )
    const other = JSON.parse(
      await tools.call(AiImageToolIds.VTRACER, { attachmentIndex: 1 }, signal)
    )
    const selection = {
      imageArtifactId: source.imageArtifactId,
      pathIds: ['path-1']
    }
    const evidence = JSON.parse(
      await tools.call(
        AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
        selection,
        signal
      )
    )
    const reference = {
      imageArtifactId: other.imageArtifactId,
      analysisIds: [evidence.analysisId],
      bounds: { x: 0, y: 0, width: 10, height: 10 },
      excludePathIds: [],
      compositionRole: 'Shape',
      componentMappings: [{ pathId: 'path-1', componentType: 'rect' }]
    }
    const batch = (args: object) => ({
      batchId: 'test',
      actions: [
        { id: 'draw', name: 'insert_vector_composition', arguments: args }
      ]
    })
    expect(() => tools.resolveBatch(batch(reference))).toThrow(/analysis/i)
    expect(() =>
      tools.resolveBatch(
        batch({
          ...reference,
          imageArtifactId: source.imageArtifactId,
          analysisIds: ['forged']
        })
      )
    ).toThrow(/analysis/i)
    const controller = new AbortController()
    controller.abort()
    await expect(
      tools.call(
        AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
        selection,
        controller.signal
      )
    ).rejects.toThrow(/cancel/i)
    for (let index = 1; index < 128; index++)
      await tools.call(
        AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
        selection,
        signal
      )
    expect(
      JSON.parse(
        await tools.call(
          AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
          selection,
          signal
        )
      )
    ).toMatchObject({ available: false })
    // Exhausting analysis must not discard the original vector drawing.
    const {
      analysisIds: _receipt,
      componentMappings: _mappings,
      ...vector
    } = reference
    expect(
      tools.resolveBatch(batch(vector)).actions[0].arguments
    ).toMatchObject({ elementCount: 1 })
  })
  it('reserves a shared candidate budget before parallel jobs start and cancels queued work', async () => {
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [attachment] } },
      async () =>
        `<svg width="100" height="100">${Array.from({ length: 16 }, (_, i) => `<path d="M${i},0L${i + 1},0L${i + 1},10L${i},10Z" fill="#000000"/>`).join('')}</svg>`
    )
    const controller = new AbortController()
    const source = JSON.parse(
      await tools.call(
        AiImageToolIds.VTRACER,
        { attachmentIndex: 0 },
        controller.signal
      )
    )
    const selection = {
      imageArtifactId: source.imageArtifactId,
      pathIds: Array.from({ length: 16 }, (_, i) => `path-${i + 1}`)
    }
    const measure = vi.spyOn(analysis, 'analyzeVectorComponents')
    try {
      const jobs = Array.from({ length: 8 }, () =>
        tools.call(
          AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
          selection,
          controller.signal
        )
      )
      const settled = Promise.allSettled(jobs)
      expect(measure).not.toHaveBeenCalled()
      expect(
        JSON.parse(
          await tools.call(
            AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
            selection,
            controller.signal
          )
        )
      ).toMatchObject({ available: false })
      controller.abort()
      expect(
        (await settled).every((result) => result.status === 'rejected')
      ).toBe(true)
      expect(measure).not.toHaveBeenCalled()
    } finally {
      measure.mockRestore()
    }
  })
  it('dispatches one 100-candidate package in bounded backend jobs and returns one complete receipt', async () => {
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [attachment] } },
      async () =>
        `<svg width="100" height="100">${Array.from({ length: 100 }, (_, i) => `<path d="M${i},0L${i + 1},0L${i + 1},10L${i},10Z" fill="#000000"/>`).join('')}</svg>`
    )
    const signal = new AbortController().signal
    const source = JSON.parse(
      await tools.call(AiImageToolIds.VTRACER, { attachmentIndex: 0 }, signal)
    )
    const measure = vi.spyOn(analysis, 'analyzeVectorComponents')
    try {
      const result = JSON.parse(
        await tools.call(
          AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
          {
            imageArtifactId: source.imageArtifactId,
            pathIds: Array.from({ length: 100 }, (_, i) => `path-${i + 1}`)
          },
          signal
        )
      )
      expect(result.paths).toHaveLength(100)
      expect(
        new Set(result.paths.map((path: { pathId: string }) => path.pathId))
          .size
      ).toBe(100)
      expect(measure.mock.calls.map((call) => call[1].length)).toEqual([
        16, 16, 16, 16, 16, 16, 4
      ])
      expect(
        result.paths.every((path: { candidates: { eligible: boolean }[] }) =>
          path.candidates.some((candidate) => candidate.eligible)
        )
      ).toBe(true)
    } finally {
      measure.mockRestore()
    }
  })
  it('combines independent analysis receipts for one prepared drawing', async () => {
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [attachment] } },
      async () =>
        '<svg width="100" height="100"><path d="M0,0L20,0L20,20L0,20Z" fill="#000000"/><path d="M30,0L50,0L50,20L30,20Z" fill="#000000"/></svg>'
    )
    const signal = new AbortController().signal
    const source = JSON.parse(
      await tools.call(AiImageToolIds.VTRACER, { attachmentIndex: 0 }, signal)
    )
    const reports = await Promise.all(
      ['path-1', 'path-2'].map(async (pathId) =>
        JSON.parse(
          await tools.call(
            AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
            { imageArtifactId: source.imageArtifactId, pathIds: [pathId] },
            signal
          )
        )
      )
    )
    const batch = tools.resolveBatch({
      batchId: 'combined',
      actions: [
        {
          id: 'draw',
          name: 'insert_vector_composition',
          arguments: {
            imageArtifactId: source.imageArtifactId,
            analysisIds: reports.map((report) => report.analysisId),
            bounds: { x: 0, y: 0, width: 50, height: 20 },
            excludePathIds: [],
            compositionRole: 'Shapes',
            componentMappings: ['path-1', 'path-2'].map((pathId) => ({
              pathId,
              componentType: 'rect'
            }))
          }
        }
      ]
    })
    expect(batch.actions[0].arguments).toMatchObject({
      slices: [
        {
          descriptors: [
            expect.objectContaining({ type: 'rect' }),
            expect.objectContaining({ type: 'rect' })
          ]
        }
      ]
    })
  })
})
