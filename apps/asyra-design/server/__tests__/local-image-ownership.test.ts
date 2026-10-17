import { expect, it, vi } from 'vitest'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalImageTools } from '../local-image-tools'
import { AiImageToolIds } from '../ai-domain-prompt'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'
import { toolRequestReference } from '../../src/ai/tool-contract'

const source = {
  metadata: {
    imageAttachments: [
      { dataUrl: 'data:image/png;base64,YQ==', mediaType: 'image/png', size: 1 }
    ]
  }
}
const svg =
  '<svg width="100" height="100"><path fill="#008800" d="M10,10C30,10.2 70,10.2 90,10L90,90L10,90Z"/></svg>'
const fixture = (capacity = 20) => {
  let images!: ReturnType<typeof createLocalImageTools>
  const convert = vi.fn(async () => svg)
  const host = createLocalToolHost({
    requestId: 'images',
    signal: new AbortController().signal,
    artifactCapacity: capacity,
    capacity: 16,
    receiptCapacity: 4,
    limits: LocalToolLibraryLimits.recipe,
    store: {
      read: async () => undefined,
      list: async () => [],
      write: async () => undefined
    },
    createGroups: (ownership) => {
      images = createLocalImageTools(source, convert, ownership)
      return [{ name: 'images', description: 'Image products', owner: images }]
    }
  })
  const invoke = (name: string, input: unknown) =>
    host.invoke({ name: `images.${name}`, input })
  const vector = () =>
    invoke(AiImageToolIds.VTRACER, {
      attachmentIndex: 0,
      plan: {
        strategy: 'preserve-vectors',
        reason: 'Preserve the source contour'
      }
    })
  return { host, images, invoke, vector, convert }
}

it('retains actual vector and dependent review products until request disposal', async () => {
  const app = fixture()
  const created = await app.vector()
  expect(created.success).toBe(true)
  const vector = JSON.parse(created.text)
  const reviewed = await app.invoke(AiImageToolIds.REVIEW_VECTOR_CONTOURS, {
    imageArtifactId: vector.imageArtifactId,
    pathIds: ['path-1'],
    quality: { mode: 'cleanup', targetSize: { width: 100, height: 100 } }
  })
  expect(reviewed.success, reviewed.text).toBe(true)
  const review = JSON.parse(reviewed.text)
  expect(
    app.images.resultIssue(AiImageToolIds.REVIEW_VECTOR_CONTOURS, review)
  ).toBeUndefined()
  await app.host.dispose()
  expect(app.images.resultIssue(AiImageToolIds.VTRACER, vector)).toMatch(
    /retained/
  )
  expect(
    app.images.resultIssue(AiImageToolIds.REVIEW_VECTOR_CONTOURS, review)
  ).toMatch(/retained/)
})

it('refuses publication beyond host capacity instead of returning an unowned vector', async () => {
  const app = fixture(2)
  const created = await app.vector()
  expect(created.success, created.text).toBe(true)
  // The vector and its review alias consume the complete ownership capacity.
  const first = JSON.parse(created.text)
  const reviewed = await app.invoke(AiImageToolIds.REVIEW_VECTOR_CONTOURS, {
    imageArtifactId: first.imageArtifactId,
    pathIds: ['path-1'],
    quality: { mode: 'cleanup', targetSize: { width: 100, height: 100 } }
  })
  expect(reviewed.success, reviewed.text).toBe(true)
  const review = JSON.parse(reviewed.text)
  const derived = await app.invoke(AiImageToolIds.APPLY_CONTOUR_REFINEMENTS, {
    reviewId: review.reviewId,
    proposalIds: [review.proposals[0].id]
  })
  expect(derived.success).toBe(false)
  expect(app.images.resultIssue(AiImageToolIds.VTRACER, first)).toBeUndefined()
  await app.host.dispose()
})

it('borrows the cached vector for each native call without recomputing or losing ownership', async () => {
  const app = fixture()
  try {
    const first = await app.vector()
    const repeated = await app.vector()
    expect(first.success).toBe(true)
    expect(repeated.success, repeated.text).toBe(true)
    expect(JSON.parse(repeated.text).imageArtifactId).toBe(
      JSON.parse(first.text).imageArtifactId
    )
    expect(app.convert).toHaveBeenCalledOnce()
  } finally {
    await app.host.dispose()
  }
})

it('composes contour review and component analysis using a fresh retained input', async () => {
  const app = fixture()
  const vector = JSON.parse((await app.vector()).text)
  const literal = (value: unknown) => ({ kind: 'literal', value })
  const proposal = {
    format: 1,
    name: 'inspect-contours',
    revision: 1,
    description: 'Review contours and analyze native component candidates.',
    inputSchema: toolRequestReference,
    outputSchema: toolRequestReference,
    steps: [
      {
        id: 'review',
        tool: `images.${AiImageToolIds.REVIEW_VECTOR_CONTOURS}`,
        revision: 2,
        input: {
          kind: 'object',
          fields: {
            imageArtifactId: { kind: 'input', path: '' },
            pathIds: literal(['path-1']),
            quality: literal({
              mode: 'faithful',
              targetSize: { width: 100, height: 100 }
            })
          }
        }
      },
      {
        id: 'analyze',
        tool: `images.${AiImageToolIds.ANALYZE_VECTOR_COMPONENTS}`,
        revision: 2,
        input: {
          kind: 'object',
          fields: {
            imageArtifactId: {
              kind: 'step',
              step: 'review',
              path: '/imageArtifactId'
            },
            pathIds: literal(['path-1'])
          }
        }
      }
    ],
    output: { kind: 'step', step: 'analyze', path: '/analysisId' }
  }
  try {
    const submitted = JSON.parse(
      (
        await app.host.invoke({
          name: 'tool_library.submit_tool',
          input: { submissionId: 'inspect', proposal }
        })
      ).text
    )
    expect(submitted, JSON.stringify(submitted)).toMatchObject({ ok: true })
    const result = JSON.parse(
      (
        await app.host.invoke({
          name: 'tool_library.invoke_tool',
          input: {
            name: proposal.name,
            revision: 1,
            input: vector.imageArtifactId
          }
        })
      ).text
    )
    expect(result, JSON.stringify(result)).toMatchObject({
      execution: { status: 'success', value: expect.any(String) }
    })
    expect(
      app.images.resultIssue(AiImageToolIds.VTRACER, vector)
    ).toBeUndefined()
    const captured = structuredClone(proposal)
    captured.name = 'captured-contours'
    captured.steps[0].input.fields.imageArtifactId = literal(
      vector.imageArtifactId
    ) as never
    const refused = JSON.parse(
      (
        await app.host.invoke({
          name: 'tool_library.submit_tool',
          input: { submissionId: 'captured', proposal: captured }
        })
      ).text
    )
    expect(refused).toMatchObject({ ok: false })
  } finally {
    await app.host.dispose()
  }
})
