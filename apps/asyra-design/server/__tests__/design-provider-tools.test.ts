import { expect, it, vi } from 'vitest'
import { createDesignProviderTools } from '../design-provider-tools'

vi.mock('@asyra/ai-agent-runtime/node', async (original) => ({
  ...(await original<typeof import('@asyra/ai-agent-runtime/node')>()),

  createSqliteToolStore: async () => ({
    read: async () => undefined,

    list: async () => [],

    write: async () => {
      throw Error('No test storage')
    },

    close: async () => undefined
  })
}))

it('composes one tool host with unchanged instructions and fresh resumed-turn context', async () => {
  const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
  const input = {
    actions: [],
    attempt: 1,
    intent: 'Inspect the document',
    context: { generation: 2 },
    metadata: {
      conversationId: 'one',
      conversationContext: { turns: [{ role: 'user', text: 'prior' }] }
    }
  }
  const tools = await createDesignProviderTools(input, { executeBatch })

  try {
    expect(
      tools.nativeDefinitions.some((group) => group.name === 'design_knowledge')
    ).toBe(true)
    expect(
      tools.nativeDefinitions
        .flatMap((group) => group.tools)
        .find((tool) => tool.name === 'execute_design')?.deferLoading
    ).toBe(false)
    expect(
      tools
        .instructions()
        .map((item) => item.text)
        .join('')
    ).toContain('Return one final JSON object')
    const first = tools.inputForTurn(false)[0]
    const resumed = tools.inputForTurn(true)[0]

    expect(
      JSON.parse(String(first.text)).input.metadata.conversationContext.turns
    ).toHaveLength(1)
    expect(
      JSON.parse(String(resumed.text)).input.metadata.conversationContext.turns
    ).toEqual([])
    expect(JSON.parse(String(resumed.text)).input.context).toEqual({
      generation: 2
    })
    expect(input.metadata.conversationContext.turns).toHaveLength(1)
    const reply = await tools.invoke({
      namespace: 'design_knowledge',
      name: 'discover_knowledge',
      callId: 'knowledge',
      arguments: { query: 'button' }
    })

    expect(
      reply.contentItems.some(
        (item) => item.type === 'inputText' && item.text.includes('toolOutcome')
      )
    ).toBe(true)
    expect(executeBatch).not.toHaveBeenCalled()
  } finally {
    await tools.dispose()
  }
})

it('reports cancellation before owner invocation as not started rather than unknown settlement', async () => {
  const controller = new AbortController()
  const progress: unknown[] = []
  const tools = await createDesignProviderTools(
    { actions: [], attempt: 1, intent: 'Read advice', context: {} },
    {
      signal: controller.signal,

      onProgress: (event) => progress.push(event)
    }
  )

  try {
    controller.abort()
    await expect(
      tools.invoke({
        namespace: 'design_knowledge',
        name: 'read_knowledge',
        callId: 'cancel-before-owner',
        arguments: { ids: ['colors'] }
      })
    ).rejects.toBeDefined()
    expect(progress).toContainEqual(
      expect.objectContaining({
        status: 'completed',
        activity: expect.objectContaining({
          callId: 'cancel-before-owner',
          outcome: { status: 'failed', settlement: 'not-started' }
        })
      })
    )
  } finally {
    await tools.dispose()
  }
})

it('keeps retained sources addressable and sends only current attachment pixels to Responses', async () => {
  const { default: sharp } = await import('sharp')
  const images = await Promise.all(
    ['#eebb00', '#0044dd'].map(async (background) => {
      const bytes = await sharp({
        create: { width: 2, height: 2, channels: 3, background }
      })
        .png()
        .toBuffer()

      return {
        mediaType: 'image/png',
        size: bytes.length,
        dataUrl: 'data:image/png;base64,' + bytes.toString('base64')
      }
    })
  )
  const tools = await createDesignProviderTools(
    {
      intent: 'Use this source',
      context: {},
      actions: [],
      attempt: 1,
      metadata: {
        conversationId: 'refs',
        imageAttachments: images,
        conversationContext: { turns: [], attachmentIndexes: [1] }
      }
    },
    { modelSource: 'openai-responses' }
  )

  try {
    const [turn, ...pixels] = tools.inputForTurn()

    expect(pixels).toEqual([{ type: 'image', url: images[1].dataUrl }])
    const projected = JSON.parse(String(turn.text)).input.metadata

    expect(projected.attachmentIndexes).toEqual([1])
    expect(
      projected.imageAttachments.map(
        (a: { referenceId: string }) => a.referenceId
      )
    ).toEqual([expect.any(String), expect.any(String)])
    expect(String(turn.text)).not.toContain('base64')
  } finally {
    await tools.dispose()
  }
})
