import { readFile } from 'node:fs/promises'
import * as childProcess from 'node:child_process'
import { afterEach, expect, it, vi } from 'vitest'
import { requestLocalAiActionBatch } from '../local-ai-provider'
import type { AiProviderInput } from '../../src/ai/action-batch-protocol'
import { PREPARED_DRAWING_INPUT_SCHEMA } from '../../src/ai/prepared-drawing-schema'

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof childProcess>()
  return { ...actual, spawn: vi.fn(actual.spawn) }
})
afterEach(() => vi.restoreAllMocks())
it.skipIf(process.env.E2E_LOCAL_AI !== 'true')(
  'runs the real subscription VTracer protocol without environment tools',
  async () => {
    const { spawn } =
      await vi.importActual<typeof childProcess>('node:child_process')
    const events: unknown[] = []
    vi.mocked(childProcess.spawn).mockImplementation(((
      ...args: Parameters<typeof spawn>
    ) => {
      const child = spawn(...args)
      let buffer = ''
      child.stdout?.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        let index: number
        while ((index = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, index)
          buffer = buffer.slice(index + 1)
          try {
            const packet = JSON.parse(line)
            if (
              packet.method === 'item/tool/call' ||
              packet.method === 'item/completed' ||
              packet.method === 'turn/completed' ||
              packet.error
            ) {
              events.push({
                method: packet.method,
                itemType: packet.params?.item?.type,
                tool: packet.params?.tool ?? packet.params?.item?.tool,
                namespace: packet.params?.namespace,
                argumentKeys: Object.keys(packet.params?.arguments ?? {}),
                itemKeys: Object.keys(packet.params?.item ?? {}),
                status: packet.params?.turn?.status,
                errorCode: packet.error?.code
              })
            }
          } catch {
            /* Never record raw protocol text. */
          }
        }
      })
      return child
    }) as typeof spawn)
    const bytes = await readFile(
      new URL('../../e2e/fixtures/local-vector-reference.png', import.meta.url)
    )
    const replayInput: AiProviderInput | undefined = process.env
      .LOCAL_AI_TEST_INPUT
      ? JSON.parse(await readFile(process.env.LOCAL_AI_TEST_INPUT, 'utf8'))
      : undefined
    let result: unknown
    try {
      result = await requestLocalAiActionBatch(
        replayInput ?? {
          intent:
            'Use vtracer on attachment 0 and insert the exact resulting vector image at original size. Preserve all returned polygon paths.',
          context: {
            workspaceId: 'workspace',
            elementCount: 0,
            selectedElements: []
          },
          actions: [
            {
              name: 'insert_vector_composition',
              description: 'Insert prepared editable vector descriptors',
              inputSchema: PREPARED_DRAWING_INPUT_SCHEMA
            }
          ],
          attempt: 1,
          metadata: {
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
          executable: process.env.AI_PROVIDER_EXECUTABLE || 'codex',
          model: process.env.AI_PROVIDER_MODEL || ''
        }
      )
    } catch (error) {
      throw new Error(`Local protocol failed: ${JSON.stringify(events)}`, {
        cause: error
      })
    }
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: 'item/tool/call', tool: 'vtracer' })
      ])
    )
    expect(result).toMatchObject({ actions: expect.any(Array) })
  },
  180_000
)
