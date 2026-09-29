import { readFile } from 'node:fs/promises'
import * as childProcess from 'node:child_process'
import { expect, it, vi } from 'vitest'
import { requestLocalAiActionBatch } from '../../apps/asyra-design/server/local-ai-provider'
import { createAiActions } from '../../apps/asyra-design/src/ai/actions'

// Only action descriptions are used: this probe never executes document mutations.
vi.mock('../../apps/asyra-design/src/common-apis', () => ({}))
vi.mock(
  '../../apps/asyra-design/src/constants',
  () => import('../../apps/asyra-design/src/constants/ai-actions')
)
vi.mock('@asyra/core', () => ({
  waitForCooperativePaint: vi.fn(),
  yieldToCooperativeHost: vi.fn()
}))

vi.mock('node:child_process', async (original) => {
  const actual = await original<typeof childProcess>()
  return { ...actual, spawn: vi.fn(actual.spawn) }
})

it.skipIf(process.env.E2E_LOCAL_AI !== 'true')(
  'measures a reference-image subscription request without logging private payloads',
  async () => {
    const imagePath = process.env.LOCAL_AI_REFERENCE_IMAGE
    const executable = process.env.AI_PROVIDER_EXECUTABLE
    const model = process.env.AI_PROVIDER_MODEL
    if (!imagePath || !executable || !model) {
      throw new Error(
        'Set LOCAL_AI_REFERENCE_IMAGE, AI_PROVIDER_EXECUTABLE and AI_PROVIDER_MODEL for the live probe.'
      )
    }
    const started = performance.now()
    const record = (event: string, details: Record<string, unknown> = {}) =>
      console.info(
        JSON.stringify({
          elapsedMs: Math.round(performance.now() - started),
          event,
          ...details
        })
      )
    const actual =
      await vi.importActual<typeof childProcess>('node:child_process')
    let deltaBytes = 0
    let deltas = 0
    let firstDelta = false
    vi.mocked(childProcess.spawn).mockImplementation(((
      ...args: Parameters<typeof actual.spawn>
    ) => {
      const child = actual.spawn(...args)
      record('provider-process', { pid: child.pid })
      let buffer = ''
      child.stdout?.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        let index: number
        while ((index = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, index)
          buffer = buffer.slice(index + 1)
          try {
            const packet = JSON.parse(line)
            const method = packet.method
            if (method === 'item/agentMessage/delta') {
              deltas++
              deltaBytes += Buffer.byteLength(packet.params?.delta ?? '')
              if (!firstDelta) {
                firstDelta = true
                record('first-message-delta')
              }
            } else if (
              [
                'item/tool/call',
                'item/started',
                'item/completed',
                'turn/started',
                'turn/completed'
              ].includes(method)
            ) {
              record(method, {
                type: packet.params?.item?.type,
                phase: packet.params?.item?.phase,
                status: packet.params?.turn?.status
              })
            }
          } catch {
            /* Do not retain protocol payloads. */
          }
        }
      })
      child.on('close', () => record('provider-closed', { deltas, deltaBytes }))
      return child
    }) as typeof actual.spawn)
    const heartbeat = setInterval(
      () => record('progress', { deltas, deltaBytes }),
      30_000
    )
    try {
      const bytes = await readFile(imagePath)
      record('request-start', { imageBytes: bytes.length })
      const result = await requestLocalAiActionBatch(
        {
          intent: 'Balanced detail',
          context: {
            workspaceId: 'workspace',
            elementCount: 0,
            selectedElements: []
          },
          actions: createAiActions().map(
            ({ name, description, inputSchema }) => ({
              name,
              description,
              inputSchema
            })
          ),
          attempt: 1,
          metadata: {
            replyTo: {
              turnId: 'reference-request',
              intent: '畫這個 Logo，尺寸 240*240 px，不要右下角 TM 的字'
            },
            imageAttachments: [
              {
                mediaType: 'image/png',
                size: bytes.length,
                dataUrl: `data:image/png;base64,${bytes.toString('base64')}`
              }
            ]
          }
        },
        {
          executable,
          model,
          onProgress: (event) => record('tool-progress', { ...event })
        }
      )
      record('request-completed', {
        resultBytes: Buffer.byteLength(JSON.stringify(result))
      })
      expect(result).toMatchObject({ actions: expect.any(Array) })
    } catch (error) {
      record('request-failed', {
        code: (error as { code?: string }).code,
        deltas,
        deltaBytes
      })
      throw error
    } finally {
      clearInterval(heartbeat)
      vi.restoreAllMocks()
    }
  },
  330_000
)
