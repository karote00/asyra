import { expect, it, vi } from 'vitest'
import {
  createAiRecipeRecoverySchema,
  createAiToolContract
} from '@asyra/ai-agent-runtime'
import { operationInputIssue } from '../operation-input-schema'
import {
  createLocalToolLeases,
  localToolReferences
} from '../local-tool-leases'

const reference = { type: 'string', 'x-runtime-value': 'request' } as const
const value = { type: 'number' } as const

it('keeps dependency-local schema references resolvable in a typed recovery envelope', () => {
  const schema = createAiRecipeRecoverySchema([
    createAiToolContract({
      name: 'prepare',
      description: 'Prepare a retained result.',
      revision: 1,
      inputSchema: {},
      outputSchema: { type: 'number' },
      recoveryOutputSchema: {
        type: 'object',
        required: ['handle'],
        $defs: { handle: reference },
        properties: { handle: { $ref: '#/$defs/handle' } }
      },
      effect: 'prepare',
      resources: ['request-artifacts'],
      lifecycle: {
        cancellation: 'cooperative',
        retry: 'never',
        output: 'request-artifact'
      }
    })
  ])
  const result = [
    {
      callId: 'call',
      name: 'prepare',
      revision: 1,
      status: 'failed',
      settlement: 'not-started',
      value: { handle: 'retained' }
    }
  ]
  expect(operationInputIssue(result, schema)).toBeUndefined()
  expect(localToolReferences(result, schema)).toEqual(['retained'])
})
const setup = (capacity = 8) =>
  createLocalToolLeases({ requestId: 'r', capacity })
const open = (
  host: ReturnType<typeof setup>,
  callId: string,
  parentCallId?: string,
  input: unknown = 1,
  inputSchema: unknown = value
) =>
  host.open({
    requestId: 'r',
    callId,
    parentCallId,
    input,
    inputSchema: inputSchema as never
  })
const retain = (
  host: ReturnType<typeof setup>,
  fromCallId: string,
  handle: string,
  toCallId?: string
) =>
  host.retain({
    requestId: 'r',
    fromCallId,
    toCallId,
    value: handle,
    outputSchema: reference
  })

it('borrows cached ancestor products but refuses private siblings and pins active users', async () => {
  const host = setup(),
    release = vi.fn()
  await open(host, 'parent')
  host.publish({ handle: 'source', callId: 'parent', release })
  await open(host, 'child', 'parent')
  host.borrow('source', 'child')
  await open(host, 'sibling')
  expect(() => host.borrow('source', 'sibling')).toThrow(/outside caller/)
  expect(() => host.assertRelease('source', 'parent')).toThrow(/borrowed/)
  await retain(host, 'child', 'source', 'parent')
  await host.release({ requestId: 'r', callId: 'child' })
  expect(release).not.toHaveBeenCalled()
  await host.release({ requestId: 'r', callId: 'sibling' })
  await host.release({ requestId: 'r', callId: 'parent' })
  expect(release).toHaveBeenCalledOnce()
  expect(() => host.borrow('source', 'child')).toThrow()
  await host.dispose()
})

it('transfers a child artifact through its parent to the request before cleanup', async () => {
  const host = setup(),
    release = vi.fn()
  await open(host, 'outer')
  await open(host, 'child', 'outer')
  host.publish({ handle: 'fresh', callId: 'child', release })
  await retain(host, 'child', 'fresh', 'outer')
  await host.release({ requestId: 'r', callId: 'child' })
  await open(host, 'consumer', 'outer', 'fresh', reference)
  await host.release({ requestId: 'r', callId: 'consumer' })
  expect(release).not.toHaveBeenCalled()
  await retain(host, 'outer', 'fresh')
  await host.release({ requestId: 'r', callId: 'outer' })
  expect(release).not.toHaveBeenCalled()
  await open(host, 'next', undefined, 'fresh', reference)
  await host.release({ requestId: 'r', callId: 'next' })
  await host.dispose()
  expect(release).toHaveBeenCalledOnce()
})

it('cleans unreturned local work without deleting borrowed or sibling artifacts', async () => {
  const host = setup(),
    borrowed = vi.fn(),
    own = vi.fn(),
    sibling = vi.fn()
  host.publish({ handle: 'borrowed', release: borrowed })
  await open(host, 'a', undefined, 'borrowed', reference)
  await open(host, 'b')
  host.publish({ handle: 'own', callId: 'a', release: own })
  host.publish({ handle: 'sibling', callId: 'b', release: sibling })
  await expect(
    open(host, 'foreign', 'a', 'sibling', reference)
  ).rejects.toThrow('ownership')
  await host.release({ requestId: 'r', callId: 'a' })
  expect(own).toHaveBeenCalledOnce()
  expect(borrowed).not.toHaveBeenCalled()
  expect(sibling).not.toHaveBeenCalled()
  await host.release({ requestId: 'r', callId: 'b' })
  expect(sibling).toHaveBeenCalledOnce()
  await host.dispose()
  expect(borrowed).toHaveBeenCalledOnce()
})

it('validates every export before transferring any ownership', async () => {
  const host = setup(),
    release = vi.fn()
  await open(host, 'a')
  host.publish({ handle: 'local', callId: 'a', release })
  await expect(
    host.retain({
      requestId: 'r',
      fromCallId: 'a',
      value: ['local', 'missing'],
      outputSchema: { type: 'array', items: reference }
    })
  ).rejects.toThrow('unavailable')
  await host.release({ requestId: 'r', callId: 'a' })
  expect(release).toHaveBeenCalledOnce()
})

it('rejects foreign requests and capacity without evicting live dependencies', async () => {
  const host = setup(1),
    release = vi.fn()
  host.publish({ handle: 'one', release })
  expect(() => host.publish({ handle: 'two', release: vi.fn() })).toThrow(
    'capacity'
  )
  await expect(
    host.open({
      requestId: 'other',
      callId: 'a',
      input: 'one',
      inputSchema: reference
    })
  ).rejects.toThrow('request')
  await open(host, 'a', undefined, 'one', reference)
  await host.release({ requestId: 'r', callId: 'a' })
  expect(release).not.toHaveBeenCalled()
  await host.dispose()
  expect(release).toHaveBeenCalledOnce()
})

it('keeps failed cleanup retryable and rejects use while cleanup is incomplete', async () => {
  const host = setup(),
    release = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary IO'))
      .mockResolvedValue(undefined)
  await open(host, 'a')
  host.publish({ handle: 'local', callId: 'a', release })
  await expect(host.release({ requestId: 'r', callId: 'a' })).rejects.toThrow(
    'temporary IO'
  )
  await expect(open(host, 'b', undefined, 'local', reference)).rejects.toThrow(
    'unavailable'
  )
  await host.release({ requestId: 'r', callId: 'a' })
  await host.release({ requestId: 'r', callId: 'a' })
  expect(release).toHaveBeenCalledTimes(2)
  await host.dispose()
})

it('retention never overrides canonical freshness and parent cannot close over an active child', async () => {
  const host = setup(),
    release = vi.fn(),
    validate = vi.fn()
  await open(host, 'parent')
  host.publish({ handle: 'value', callId: 'parent', release, validate })
  await open(host, 'child', 'parent', 'value', reference)
  await expect(
    host.release({ requestId: 'r', callId: 'parent' })
  ).rejects.toThrow('child')
  validate.mockImplementation(() => {
    throw new Error('stale revision')
  })
  await expect(retain(host, 'child', 'value', 'parent')).rejects.toThrow(
    'stale revision'
  )
  await host.release({ requestId: 'r', callId: 'child' })
  await host.release({ requestId: 'r', callId: 'parent' })
  expect(release).toHaveBeenCalledOnce()
})

it('uses schema annotations, references, unions and positional receipts instead of field names', () => {
  const schema = {
    type: 'object',
    $defs: { handle: reference },
    properties: {
      unusual: { $ref: '#/$defs/handle' },
      artifactId: { type: 'string' },
      receipt: {
        type: 'array',
        prefixItems: [reference],
        items: { type: 'number' }
      },
      variant: { anyOf: [{ type: 'number' }, reference] },
      document: { type: 'string', 'x-runtime-value': 'document' }
    }
  }
  expect(
    localToolReferences(
      {
        unusual: 'one',
        artifactId: 'not-a-reference',
        receipt: ['two', 3],
        variant: 'three',
        document: 'object'
      },
      schema
    )
  ).toEqual(['one', 'two', 'three'])
  expect(() =>
    localToolReferences('value', { $ref: '#/$defs/missing' })
  ).toThrow('schema')
})

it('waits for the same asynchronous cleanup on concurrent releases', async () => {
  const host = setup()
  let finish!: () => void
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  const release = vi.fn(() => pending)
  await open(host, 'a')
  host.publish({ handle: 'owned', callId: 'a', release })
  const first = host.release({ requestId: 'r', callId: 'a' })
  let settled = false
  const second = host.release({ requestId: 'r', callId: 'a' }).then(() => {
    settled = true
  })
  await Promise.resolve()
  await Promise.resolve()
  expect(settled).toBe(false)
  finish()
  await Promise.all([first, second])
  expect(release).toHaveBeenCalledOnce()
})

it('does not export resources into an unrelated sibling scope', async () => {
  const host = setup(),
    release = vi.fn()
  await open(host, 'a')
  await open(host, 'b')
  host.publish({ handle: 'owned', callId: 'a', release })
  await expect(retain(host, 'a', 'owned', 'b')).rejects.toThrow('parent')
  await host.release({ requestId: 'r', callId: 'a' })
  expect(release).toHaveBeenCalledOnce()
  await host.release({ requestId: 'r', callId: 'b' })
})

it('finds references in schema-declared dictionaries without scanning opaque values', () => {
  expect(
    localToolReferences(
      {
        refs: { first: 'one', second: 'two' },
        opaque: { artifactId: 'not-reference' }
      },
      {
        type: 'object',
        properties: {
          refs: { type: 'object', additionalProperties: reference },
          opaque: { type: 'object' }
        }
      }
    )
  ).toEqual(['one', 'two'])
})

it('pins aliases through the actual owner and blocks explicit release while another call borrows', async () => {
  const host = setup(),
    release = vi.fn()
  host.publish({ handle: 'artifact', release })
  host.alias('target-set', 'artifact')
  await open(host, 'consumer', undefined, 'target-set', reference)
  expect(() => host.assertRelease('artifact')).toThrow('borrowed')
  await host.release({ requestId: 'r', callId: 'consumer' })
  host.assertRelease('artifact')
  host.retire('artifact')
  await expect(
    open(host, 'later', undefined, 'target-set', reference)
  ).rejects.toThrow('unavailable')
  await host.dispose()
  expect(release).not.toHaveBeenCalled()
})

it('admits all artifact aliases before publishing any of them', async () => {
  const host = setup(2)
  host.publish({ handle: 'root', release: vi.fn() })
  expect(() =>
    host.publishAliases([
      { handle: 'first', ownerHandle: 'root' },
      { handle: 'second', ownerHandle: 'root' }
    ])
  ).toThrow('capacity')
  await expect(
    open(host, 'missing', undefined, 'first', reference)
  ).rejects.toThrow('unavailable')
  host.publishAliases([{ handle: 'first', ownerHandle: 'root' }])
  await open(host, 'ok', undefined, 'first', reference)
  await host.release({ requestId: 'r', callId: 'ok' })
  await host.dispose()
})
