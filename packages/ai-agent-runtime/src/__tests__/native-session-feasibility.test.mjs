import process from 'node:process'
import { expect, it, vi } from 'vitest'
import {
  nativeSessionFixture,
  nativeMessage,
  nativeCall,
  nativeThreadInput,
  nativeTurnInput
} from './fixtures/native-session.mjs'
const test = it.skipIf(!process.env.NATIVE_DELIVERY_CODEX)

test('pinned native history resumes across processes with tools, correction intact', async () => {
  const fixture = await nativeSessionFixture([
    nativeCall('invalid', { quantity: 0 }),
    nativeCall('corrected', { quantity: 2 }),
    nativeMessage('reserved'),
    nativeMessage('continued')
  ])

  try {
    const first = await fixture.connect()
    const started = await first.transport.request(
      'thread/start',
      nativeThreadInput
    )
    const id = started.thread.id

    first.listen((packet) => {
      if (packet.method === 'item/tool/call') {
        const valid = packet.params.arguments.quantity === 2

        first.transport.write(
          JSON.stringify({
            id: packet.id,
            result: {
              success: valid,
              contentItems: [
                {
                  type: 'inputText',
                  text: valid
                    ? 'reservation-id: original'
                    : 'quantity must be at least 1'
                }
              ]
            }
          }) + '\n'
        )
      }
    })
    const turn = await first.transport.request(
      'turn/start',
      nativeTurnInput(id, 'Reserve and remember reference-original')
    )

    await first.waitFor(
      (p) => p.method === 'turn/completed' && p.params.turn.id === turn.turn.id
    )
    expect(fixture.requests).toHaveLength(3)
    await first.dispose()
    const second = await fixture.connect()
    const resumed = await second.transport.request('thread/resume', {
      threadId: id,
      model: 'gpt-6-astra',
      modelProvider: 'offline',
      excludeTurns: true
    })

    expect(resumed.thread.id).toBe(id)
    const follow = await second.transport.request(
      'turn/start',
      nativeTurnInput(id, 'Continue')
    )

    await second.waitFor(
      (p) =>
        p.method === 'turn/completed' && p.params.turn.id === follow.turn.id
    )
    expect(JSON.stringify(fixture.requests[3].input)).toContain(
      'reference-original'
    )
    expect(JSON.stringify(fixture.requests[3].input)).toContain(
      'reservation-id: original'
    )
    expect(JSON.stringify(fixture.requests[3].tools)).toContain('reserve')
  } finally {
    await fixture.dispose()
  }
}, 45000)

test('pinned native interruption retains a resumable conversation without repeating its turn', async () => {
  const fixture = await nativeSessionFixture([
    'wait',
    nativeMessage('after-cancel')
  ])

  try {
    const first = await fixture.connect()
    const { thread } = await first.transport.request(
      'thread/start',
      nativeThreadInput
    )
    const { turn } = await first.transport.request(
      'turn/start',
      nativeTurnInput(thread.id, 'Cancel this task')
    )

    await vi.waitFor(() => expect(fixture.requests).toHaveLength(1))
    await first.transport.request('turn/interrupt', {
      threadId: thread.id,
      turnId: turn.id
    })
    const stopped = await first.waitFor(
      (p) => p.method === 'turn/completed' && p.params.turn.id === turn.id
    )

    expect(stopped.params.turn.status).toBe('interrupted')
    await first.dispose()
    const second = await fixture.connect()

    await second.transport.request('thread/resume', {
      threadId: thread.id,
      modelProvider: 'offline',
      excludeTurns: true
    })
    const resumed = await second.transport.request(
      'turn/start',
      nativeTurnInput(thread.id, 'New task')
    )
    const final = await second.waitFor(
      (p) =>
        p.method === 'turn/completed' && p.params.turn.id === resumed.turn.id
    )

    expect(final.params.turn.status).toBe('completed')
    expect(fixture.requests).toHaveLength(2)
  } finally {
    await fixture.dispose()
  }
}, 45000)

test('pinned resume does not replace persisted dynamic declarations through an unsupported field', async () => {
  const fixture = await nativeSessionFixture([
    nativeMessage('first'),
    nativeMessage('second')
  ])

  try {
    const first = await fixture.connect()
    const { thread } = await first.transport.request(
      'thread/start',
      nativeThreadInput
    )
    const { turn } = await first.transport.request(
      'turn/start',
      nativeTurnInput(thread.id, 'Start')
    )

    await first.waitFor(
      (p) => p.method === 'turn/completed' && p.params.turn.id === turn.id
    )
    await first.dispose()
    const second = await fixture.connect()

    await second.transport.request('thread/resume', {
      threadId: thread.id,
      modelProvider: 'offline',
      dynamicTools: [],
      excludeTurns: true
    })
    const next = await second.transport.request(
      'turn/start',
      nativeTurnInput(thread.id, 'Continue')
    )

    await second.waitFor(
      (p) => p.method === 'turn/completed' && p.params.turn.id === next.turn.id
    )
    expect(JSON.stringify(fixture.requests[1].tools)).toContain('reserve')
  } finally {
    await fixture.dispose()
  }
}, 45000)
