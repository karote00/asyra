import { expect, it } from 'vitest'
import { inventoryJourney } from './fixtures/inventory-journey.mjs'

// Independent domain expectations. No projector/schema generator produces these answers.
const verify = (
  { evidence, outcomes, state, scriptError },
  retained = true
) => {
  expect(scriptError).toBeUndefined()
  expect(outcomes.map((value) => value.status)).toEqual(
    retained ? ['executed', 'executed'] : ['executed']
  )
  expect(state).toEqual([['reservation-one', { sku: 'nuts', quantity: 2 }]])
  expect(evidence.writes).toBe(1)
  expect(evidence.corrected).toBe(true)
  expect(
    evidence.candidates.find((entry) => entry.name === 'b').fields.quantity
  ).toEqual(['quantity'])
  expect(evidence.permissions).toBeGreaterThan(0)
  expect(evidence.canonical.map((call) => call.name)).toEqual(
    retained ? ['a', 'b', 'c', 'e', 'd', 'e'] : ['a', 'b', 'c', 'e']
  )
  expect(evidence.canonical[2].input).toEqual({
    id: 'reservation-one',
    unitCost: 3
  })
  expect(evidence.contracts[0][1].revision).toBe(1)
  expect(evidence.loaderReads).toBe(1)
  expect(evidence.knowledge.documents[0].text).toBe('Reserve two units.')
  expect(evidence.knowledgeRedisplay.documents[0].text).toBe(
    'Reserve two units.'
  )
  expect(evidence.settles).not.toContain('rolled-back')
  expect(evidence.completed).toEqual(
    retained ? ['reserve', 'reuse'] : ['reserve']
  )
  if (retained) {
    expect(evidence.images).toHaveLength(2)
    expect(evidence.images.map((item) => item.image.dataUrl)).toEqual([
      'data:image/png;base64,AQID',
      'data:image/png;base64,BAUG'
    ])
    expect(evidence.requests[1].metadata.conversationResultNames).toEqual([
      'reservation',
      'receiptImages'
    ])
    expect(evidence.replies[0].fields).toBeUndefined()
    expect(evidence.replies[0].saved.map((item) => item.name)).toEqual([
      'reservation',
      'receiptImages'
    ])
    expect(evidence.saves).toBe(2)
    expect(evidence.reads).toBe(2)
  }
}

it('completes the public non-Design provider, host, Knowledge and cross-turn reuse journey', async () => {
  verify(await inventoryJourney())
})

it('keeps unnamed complete internal results available with status-only delivery and equivalent field bindings', async () => {
  verify(await inventoryJourney({ retain: false }), false)
  verify(await inventoryJourney({ retain: false, fieldwise: true }), false)
})

it.each(['missing-id', 'invalid-result', 'missing-image', 'omitted-case'])(
  'the complete handoff oracle rejects deliberate corruption: %s',
  async (fault) => {
    const observed = await inventoryJourney({ fault })

    expect(() => verify(observed)).toThrow()
  }
)

it.each([undefined, 'preserve-progress'])(
  'preserves actual App transaction settlement on later failure: %s',
  async (failurePolicy) => {
    const result = await inventoryJourney({ fatal: true, failurePolicy })

    expect(result.scriptError).toBeInstanceOf(Error)
    expect(result.evidence.writes).toBe(1)
    expect(result.state).toEqual(
      failurePolicy ? [['reservation-one', { sku: 'nuts', quantity: 2 }]] : []
    )
    expect(result.evidence.canonical.map((call) => call.name)).toEqual([
      'a',
      'b',
      'c'
    ])
    expect(result.evidence.settles).toContain(
      failurePolicy ? 'completed' : 'rolled-back'
    )
  }
)

it('delivers both selected images independently of saving and later reuses them without another producer', async () => {
  const { evidence, outcomes, scriptError } = await inventoryJourney({
    delivery: 'selected'
  })

  expect(scriptError).toBeUndefined()
  expect(outcomes.map((item) => item.status)).toEqual(['executed', 'executed'])
  expect(evidence.images).toHaveLength(4)
  expect(evidence.replies[0].fields.pictures).toHaveLength(2)
  expect(evidence.canonical.filter((call) => call.name === 'c')).toHaveLength(1)
  expect(evidence.writes).toBe(1)
})

it('uses App-owned result storage and leaves borrowed storage alive after provider disposal', async () => {
  const {
    createExchangeAiProvider,
    createConversationResults,
    AiProviderError
  } = await import('@asyra/ai-agent-runtime')
  const results = createConversationResults(() => 'app-owned')

  results.open('one').exchange({ save: { reservation: { id: 'one' } } })
  const seen = []
  const options = {
    endpoint: 'https://inventory.test/ai',
    results,
    receiptHeader: 'x-receipt',
    executionHeader: 'x-execute',
    errorHeader: 'x-error',
    maximumReceiptBytes: 10000,
    maximumFrameBytes: 10000,
    contextInputFailureCode: 'INPUT_INVALID',
    contextExecutionFailureCode: 'EXECUTION_FAILED',

    backendFailure: () =>
      new AiProviderError({
        code: 'AI_PROVIDER_TRANSPORT_FAILED',
        message: 'Failed'
      }),

    describeBatchFailure: () => {
      throw Error('No batch expected')
    },

    fetch: async (_url, input) => {
      seen.push(JSON.parse(input.body))

      return {
        ok: true,
        status: 200,

        json: async () => ({
          batchId: 'summary',
          actions: [
            { id: 'one', name: 'summary', arguments: {}, summary: 'Read' }
          ]
        })
      }
    }
  }
  const provider = createExchangeAiProvider(options)

  await provider.requestActionBatch(
    {
      intent: 'Read',
      context: {},
      actions: [],
      attempt: 1,
      metadata: { conversationId: 'one' }
    },
    { signal: new globalThis.AbortController().signal }
  )
  provider.dispose()
  expect(seen[0].metadata.conversationResultNames).toEqual(['reservation'])
  expect(results.open('one').names()).toEqual(['reservation'])
  let releases = 0
  const owning = createExchangeAiProvider({
    ...options,

    releaseResults: () => {
      releases++
      results.clear()
    }
  })

  owning.dispose()
  owning.dispose()
  expect(releases).toBe(1)
  expect(results.open('one').names()).toEqual([])
})
