import { expect, it } from 'vitest'
import { createNativeConversations } from '@asyra/ai-agent-runtime/node'
import { requestConfiguredAiActionBatch } from '../ai-model-provider'
import {
  createNativeProviderFixture,
  nativeProviderExecutable
} from './native-provider-fixture'
import { isRecord } from '@asyra/utils'

it.skipIf(!nativeProviderExecutable)(
  'continues a normal App conversation without replaying projected history',
  async () => {
    const fixture = await createNativeProviderFixture([])
    const conversations = createNativeConversations()
    const options = {
      environment: fixture.environment,
      conversations,
      signal: AbortSignal.timeout(45000)
    }
    const input = {
      intent: 'Remember the first request token one.',
      context: { selection: 'old' },
      actions: [],
      attempt: 1,
      metadata: { conversationId: 'normal-conversation' }
    }

    try {
      await requestConfiguredAiActionBatch(input, options)
      await requestConfiguredAiActionBatch(
        {
          ...input,
          intent: 'Continue with current selection.',
          context: { selection: 'new' },
          metadata: {
            ...input.metadata,
            conversationContext: {
              turns: [
                {
                  turnId: 'first',
                  intent: input.intent,
                  message: 'Historical summary must not replay',
                  outcome: 'success',
                  attachmentIndexes: []
                }
              ],
              attachmentIndexes: []
            }
          }
        },
        options
      )
      const packets = fixture.appPackets()

      expect(packets.filter((p) => p.method === 'thread/start')).toHaveLength(1)
      expect(packets.filter((p) => p.method === 'thread/resume')).toHaveLength(
        1
      )
      const turns = packets.filter((p) => p.method === 'turn/start')

      expect(
        turns.map((p) =>
          isRecord(p.params) ? p.params.threadId : undefined
        )[0]
      ).toBe(
        turns.map((p) =>
          isRecord(p.params) ? p.params.threadId : undefined
        )[1]
      )
      expect(JSON.stringify(turns[1])).not.toContain(
        'Historical summary must not replay'
      )
      expect(JSON.stringify(fixture.requests[1].input)).toContain(input.intent)
      expect(JSON.stringify(turns[1])).toContain('new')
    } finally {
      conversations.dispose()
      await fixture.dispose()
    }
  },
  45000
)
