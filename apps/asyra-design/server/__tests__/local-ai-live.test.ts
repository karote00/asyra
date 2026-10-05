import sharp from 'sharp'
import { AiActionNames } from '../../src/constants/ai-actions'
import { mkdir, writeFile } from 'node:fs/promises'
import * as referenceTools from '../local-reference-tools'
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
                phase: packet.params?.item?.phase,
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
      new URL(
        process.env.LOCAL_AI_LOGO_REPLAY === 'true'
          ? './fixtures/logo-thumbnail.png'
          : '../../e2e/fixtures/local-vector-reference.png',
        import.meta.url
      )
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
            process.env.LOCAL_AI_LOGO_REPLAY === 'true'
              ? '這樣就好。保留目前細節，用 vtracer 轉成可編輯向量，依原要求繪製。'
              : 'Use vtracer on attachment 0 and insert the exact resulting vector image at original size. Preserve all returned polygon paths.',
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
            ...(process.env.LOCAL_AI_LOGO_REPLAY === 'true'
              ? {
                  replyTo: {
                    turnId: 'reference-request',
                    intent:
                      '幫我畫這張，240*240 px，只要 logo。已接受目前細節，不需要更高解析度。'
                  }
                }
              : {}),
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

it.skipIf(process.env.E2E_LOCAL_AI !== 'true').each([
  {
    mode: 'image',
    title:
      'delivers one reference image visibly to the real subscription without reacquisition'
  },
  {
    mode: 'recovery',
    title:
      'corrects rejected reference input and receives the visible image in the same native turn'
  },
  {
    mode: 'catalog',
    title:
      'exposes complete native reference and preparation parameter declarations'
  }
])(
  '$title',
  async ({ mode }) => {
    const environment = process.env
    const folder = new URL(
      `../../tmp/reference-owner-live-probe/${Date.now()}/`,
      import.meta.url
    )
    await mkdir(folder, { recursive: true })
    // Record only executable tool calls/results, never private reasoning.
    const protocol: unknown[] = []
    const methods = new Set<string>()
    const spawn = vi.mocked(childProcess.spawn).getMockImplementation()
    if (!spawn) throw new Error('Real provider spawn is required')
    vi.mocked(childProcess.spawn).mockImplementation(((
      ...args: Parameters<typeof spawn>
    ) => {
      const child = spawn(
        ...args
      ) as childProcess.ChildProcessWithoutNullStreams
      const write = child.stdin.write.bind(child.stdin)
      child.stdin.write = ((chunk: string, ...rest: unknown[]) => {
        let outgoing = chunk
        try {
          const packet = JSON.parse(String(chunk))
          if (packet.method === 'thread/start') {
            packet.params.experimentalRawEvents = true
            outgoing = JSON.stringify(packet) + '\n'
          }
        } catch {
          /* Pass through non-JSON chunks. */
        }
        return (write as (...args: unknown[]) => boolean)(outgoing, ...rest)
      }) as typeof child.stdin.write
      let pending = ''
      child.stdout.on('data', (chunk: Buffer) => {
        pending += chunk.toString()
        let end: number
        while ((end = pending.indexOf('\n')) !== -1) {
          const line = pending.slice(0, end)
          pending = pending.slice(end + 1)
          try {
            const packet = JSON.parse(line)
            if (packet.method) methods.add(packet.method)
            const item =
              packet.params?.item ??
              packet.params?.msg?.item ??
              packet.params?.event?.item
            if (
              [
                'function_call',
                'function_call_output',
                'custom_tool_call',
                'custom_tool_call_output'
              ].includes(item?.type)
            ) {
              protocol.push(
                JSON.parse(
                  JSON.stringify(item, (key, value) =>
                    typeof value === 'string'
                      ? value.replace(
                          /data:image\/[^;\s]+;base64,[A-Za-z0-9+/=]+/g,
                          '[image bytes omitted]'
                        )
                      : value
                  )
                )
              )
            }
          } catch {
            /* Ignore non-protocol output. */
          }
        }
      })
      return child
    }) as typeof spawn)
    const expectedCode = '731904'
    const bytes = await sharp(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><rect width="1200" height="600" fill="white"/><text x="600" y="360" font-family="sans-serif" font-size="180" text-anchor="middle" fill="black">${expectedCode}</text></svg>`
      )
    )
      .png()
      .toBuffer()
    await writeFile(new URL('reference.png', folder), bytes)
    const download = vi.fn(
      async () =>
        new Response(bytes, { headers: { 'content-type': 'image/png' } })
    )
    const original = referenceTools.createLocalReferenceTools
    const calls: unknown[] = []
    vi.spyOn(referenceTools, 'createLocalReferenceTools').mockImplementation(
      (add, _download, observation) => {
        const owner = original(add, download, observation)
        return {
          ...owner,
          call: async (name, args, signal) => {
            calls.push(args)
            return owner.call(name, args, signal)
          }
        }
      }
    )
    let result: unknown
    try {
      result = await requestLocalAiActionBatch(
        {
          intent:
            mode === 'catalog'
              ? 'Read-only tool catalog check. Use ALL_TOOLS discovery to print the complete descriptions and callable TypeScript declarations for import_reference_image and prepare_design. Do not invoke these tools or draw. End with a short completion message; do not repeat declarations in the final message.'
              : (mode === 'recovery'
                  ? 'Protocol recovery test: first call import_reference_image with references: [] to exercise validation, display and read its failure receipt, then correct that input in this same turn. Also look up prepare_design with describe_design_apis names, retain and use its full schema to prepare a group containing one red rectangle (10 by 10). Do not apply it to the canvas. '
                  : '') +
                'Read-only image-delivery check: use import_reference_image to view https://reference.example/visual.png from https://reference.example/page. Read the six digits actually visible in the image and report them. Do not draw. The code is not present in the URL or text receipt.',
          context: {
            workspaceId: 'workspace',
            elementCount: 0,
            selectedElements: []
          },
          actions: [
            ...(mode !== 'image'
              ? [
                  {
                    name: AiActionNames.APPLY_PREPARED_DESIGN,
                    description: 'Apply a prepared design',
                    inputSchema: {}
                  }
                ]
              : []),
            {
              name: 'report_outcome',
              description: 'Report the visible code in message.',
              inputSchema: {
                type: 'object',
                properties: {
                  outcome: {
                    type: 'string',
                    enum: ['completed', 'unsupported']
                  },
                  message: { type: 'string' }
                },
                required: ['outcome', 'message'],
                additionalProperties: false
              }
            }
          ],
          attempt: 1
        },
        {
          model: environment.AI_PROVIDER_MODEL ?? '',
          executable: environment.AI_PROVIDER_EXECUTABLE || 'codex',
          signal: AbortSignal.timeout(180_000),
          recordDirectory: new URL('records/', folder).pathname,
          executeBatch: async () => {
            throw new Error('This read-only probe has no canvas operations')
          }
        }
      )
      if (mode !== 'catalog') {
        expect(JSON.stringify(result)).toContain(expectedCode)
        expect(calls).toHaveLength(1)
        expect(download).toHaveBeenCalledOnce()
        if (mode === 'recovery') {
          expect(JSON.stringify(protocol)).toContain('PREPARATION_REJECTED')
          const receipts = (value: unknown): unknown[] => {
            if (typeof value === 'string') {
              try {
                return receipts(JSON.parse(value))
              } catch {
                return []
              }
            }
            if (!value || typeof value !== 'object') return []
            return [value, ...Object.values(value).flatMap(receipts)]
          }
          expect(protocol.flatMap(receipts)).toContainEqual(
            expect.objectContaining({
              available: true,
              applicable: true,
              artifactId: expect.any(String),
              elementCount: 2
            })
          )
        }
      } else {
        const declarationLines = (value: unknown): string[] => {
          if (typeof value === 'string') {
            try {
              return declarationLines(JSON.parse(value))
            } catch {
              return value
                .split('\n')
                .filter((line) => line.startsWith('declare const tools:'))
            }
          }
          if (value && typeof value === 'object')
            return Object.values(value).flatMap(declarationLines)
          return []
        }
        const declarations = protocol.flatMap(declarationLines).join('\n')
        expect(declarations).toMatch(
          /import_reference_image\(args:[^\n]*sourceUrl[?:]/
        )
        expect(declarations).toContain('draft')
        expect(declarations).toMatch(/prepare_design\(args:[^\n]*children[?:]/)
        expect(declarations).toContain('sharedFills')
        expect(download).not.toHaveBeenCalled()
      }
    } finally {
      await writeFile(
        new URL('result.json', folder),
        JSON.stringify(
          {
            expectedCode,
            protocol,
            methods: [...methods],
            calls,
            downloads: download.mock.calls.length,
            result
          },
          null,
          2
        )
      )
    }
  },
  190_000
)
