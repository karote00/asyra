import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { expect, it, vi } from 'vitest'
import {
  createAiToolContract,
  type AiToolStoreEntry
} from '@asyra/ai-agent-runtime'
import { toolSemantics } from '../../src/ai/tool-contract'
import { createToolLibraryManagementMiddleware } from '../local-tool-management'
import { ToolLibraryManagement } from '../../src/ai/tool-library-management'

const request = (body: unknown, extra = {}) =>
  Object.assign(Readable.from([JSON.stringify(body)]), {
    url: ToolLibraryManagement.endpoint,
    method: 'POST',
    headers: {
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
      'content-type': 'application/json'
    },
    socket: { remoteAddress: '127.0.0.1' },
    ...extra
  }) as unknown as IncomingMessage
const response = () => ({ setHeader: vi.fn(), end: vi.fn(), statusCode: 200 })
const store = () => ({
  read: vi.fn(),
  list: vi.fn(async () => []),
  write: vi.fn(),
  close: vi.fn(async () => undefined)
})

it.each(['GET', 'foreign', 'remote', 'invalid', 'oversized'])(
  'rejects %s before opening storage',
  async (kind) => {
    const open = vi.fn(async () => store())
    let body: unknown = { operation: 'list' }
    const extra: Record<string, unknown> = {}
    if (kind === 'invalid') body = { operation: 'execute' }
    if (kind === 'oversized')
      body = {
        operation: 'list',
        padding: 'a'.repeat(ToolLibraryManagement.requestBytes)
      }
    if (kind === 'GET') extra.method = 'GET'
    if (kind === 'foreign')
      extra.headers = {
        origin: 'https://example.test',
        host: 'localhost:3000',
        'content-type': 'application/json'
      }
    if (kind === 'remote') extra.socket = { remoteAddress: '192.168.1.2' }
    const req = request(body, extra)
    const res = response()
    await createToolLibraryManagementMiddleware({ open })(
      req,
      res as unknown as ServerResponse,
      vi.fn()
    )
    expect(res.statusCode).toBeGreaterThanOrEqual(400)
    expect(open).not.toHaveBeenCalled()
  }
)

it('lists through canonical management and closes the connection', async () => {
  const owned = store()
  const res = response()
  await createToolLibraryManagementMiddleware({ open: async () => owned })(
    request({ operation: 'list' }),
    res as unknown as ServerResponse,
    vi.fn()
  )
  expect(JSON.parse(res.end.mock.calls[0][0])).toEqual({
    entries: [],
    unavailable: [],
    truncated: false
  })
  expect(owned.close).toHaveBeenCalledTimes(1)
  expect(owned.write).not.toHaveBeenCalled()
})

it('reports storage failure and preserves the response when cleanup also fails', async () => {
  const owned = store()
  owned.list = vi.fn(async () => {
    throw new Error('Database unavailable')
  })
  owned.close = vi.fn(async () => {
    throw new Error('Close failed')
  })
  const diagnostic = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined)
  try {
    const res = response()
    await createToolLibraryManagementMiddleware({ open: async () => owned })(
      request({ operation: 'list' }),
      res as unknown as ServerResponse,
      vi.fn()
    )
    expect(res.statusCode).toBe(503)
    expect(res.end).toHaveBeenCalledTimes(1)
    expect(diagnostic).toHaveBeenCalled()
  } finally {
    diagnostic.mockRestore()
  }
})

it('leaves unrelated routes untouched', async () => {
  const open = vi.fn(async () => store())
  const next = vi.fn()
  await createToolLibraryManagementMiddleware({ open })(
    request({}, { url: '/other' }),
    response() as unknown as ServerResponse,
    next
  )
  expect(next).toHaveBeenCalledOnce()
  expect(open).not.toHaveBeenCalled()
})

it('maps state changes through Runtime and rejects a stale version without another write', async () => {
  const contract = createAiToolContract({
    name: 'saved',
    description: 'A saved tool.',
    inputSchema: { type: 'number' },
    ...toolSemantics({ type: 'number' }, 'mutation', ['document']),
    revision: 1
  })
  let entry: AiToolStoreEntry = {
    key: JSON.stringify(['saved', 1]),
    version: 'observed',
    record: {
      format: 1,
      contract: JSON.parse(JSON.stringify(contract)),
      body: { steps: [], output: { kind: 'input', path: '' } },
      dependencies: [],
      availability: 'candidate',
      evidence: null
    }
  }
  const owned = {
    ...store(),
    read: async () => entry,
    write: vi.fn(
      async (input: {
        key: string
        expectedVersion?: string
        record: AiToolStoreEntry['record']
      }) => {
        expect(input.expectedVersion).toBe(entry.version)
        entry = { key: input.key, record: input.record, version: 'changed' }
        return entry
      }
    )
  }
  const handler = createToolLibraryManagementMiddleware({
    open: async () => owned
  })
  const input = {
    operation: 'remove',
    name: 'saved',
    revision: 1,
    expectedVersion: 'observed'
  }
  const first = response()
  await handler(request(input), first as unknown as ServerResponse, vi.fn())
  expect(first.statusCode).toBe(200)
  expect(JSON.parse(first.end.mock.calls[0][0])).toMatchObject({
    status: 'saved',
    availability: 'retired',
    version: 'changed'
  })
  const stale = response()
  await handler(request(input), stale as unknown as ServerResponse, vi.fn())
  expect(stale.statusCode).toBe(409)
  expect(owned.write).toHaveBeenCalledOnce()
  expect(owned.close).toHaveBeenCalledTimes(2)
})
