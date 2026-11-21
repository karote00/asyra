const { AbortController } = globalThis

import process from 'node:process'
import { expect, it, vi } from 'vitest'
import {
  createNativeAiProvider,
  createNativeConversations
} from '@asyra/ai-agent-runtime/node'
import {
  nativeSessionFixture,
  nativeMessage,
  nativeThreadInput
} from './fixtures/native-session.mjs'
const test = it.skipIf(!process.env.NATIVE_DELIVERY_CODEX)
const batch = { batchId: 'done', actions: [] }
const request = {
  intent: 'First',
  context: {},
  actions: [],
  attempt: 1,
  metadata: { conversationId: 'one' }
}

const setup = (fixture, conversations) => {
  const bindings = []
  let revision = 1
  const provider = createNativeAiProvider({
    ...fixture.nativeOptions,
    conversations,

    async prepare(input, context) {
      const binding = {
        signal: context.signal,
        closed: false,
        resumed: undefined
      }

      bindings.push(binding)

      return {
        thread: {
          ...nativeThreadInput,
          baseInstructions: 'Inventory revision ' + revision
        },
        turn: { environments: [] },

        input(resumed) {
          binding.resumed = resumed

          return [{ type: 'text', text: input.intent, text_elements: [] }]
        },

        invoke() {
          throw Error('Unexpected tool')
        },

        decode(result) {
          return JSON.parse(result.messages.at(-1).text)
        },

        dispose() {
          binding.closed = true
        }
      }
    }
  })

  return {
    provider,
    bindings,

    changeContract() {
      revision++
    }
  }
}

test('native provider cancels one request then resumes with fresh resources and no replay', async () => {
  const fixture = await nativeSessionFixture([
    'wait',
    nativeMessage(JSON.stringify(batch))
  ])
  const { provider, bindings } = setup(fixture)
  const abort = new AbortController()

  try {
    const first = provider.requestActionBatch(request, { signal: abort.signal })
    const rejected = expect(first).rejects.toMatchObject({
      code: 'AI_PROVIDER_ABORTED'
    })

    await vi.waitFor(() => expect(fixture.requests).toHaveLength(1))
    abort.abort()
    await rejected
    expect(bindings[0].closed).toBe(true)
    await expect(
      provider.requestActionBatch(
        { ...request, intent: 'Continue' },
        { signal: new AbortController().signal }
      )
    ).resolves.toEqual(batch)
    expect(bindings.map((b) => b.resumed)).toEqual([false, true])
    expect(bindings[0].signal).not.toBe(bindings[1].signal)
    expect(bindings.every((b) => b.closed)).toBe(true)
    expect(fixture.requests).toHaveLength(2)
  } finally {
    await provider.dispose()
    await fixture.dispose()
  }
}, 45000)

test('native provider rejects changed tools before model work and preserves borrowed conversation storage', async () => {
  const fixture = await nativeSessionFixture([
    nativeMessage(JSON.stringify(batch))
  ])
  const records = new Map()
  const conversations = createNativeConversations({
    read: (key) => records.get(key),

    write: (key, value) => records.set(key, value)
  })
  const { provider, changeContract, bindings } = setup(fixture, conversations)

  try {
    await provider.requestActionBatch(request, {
      signal: new AbortController().signal
    })
    const original = records.get('one')

    changeContract()
    await expect(
      provider.requestActionBatch(request, {
        signal: new AbortController().signal
      })
    ).rejects.toThrow('contract changed')
    expect(fixture.requests).toHaveLength(1)
    expect(records.get('one')).toBe(original)
    expect(bindings.every((b) => b.closed)).toBe(true)
    await provider.dispose()
    expect(records.get('one')).toBe(original)
  } finally {
    await provider.dispose()
    conversations.dispose()
    await fixture.dispose()
  }
}, 45000)
