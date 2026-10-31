import { describe, expect, it, vi } from 'vitest'
import { createAiActionRegistry } from '../action-registry.js'
import { createAiToolLibrary } from '../tool-library.js'

const scalar = { type: 'number' }
const proposal = () => ({
  format: 1,
  name: 'reusable',
  description: 'Apply a fresh value.',
  revision: 1,
  inputSchema: scalar,
  outputSchema: scalar,
  steps: [
    {
      id: 'apply',
      tool: 'set',
      revision: 1,
      input: { kind: 'input', path: '' }
    }
  ],
  output: { kind: 'step', step: 'apply', path: '' }
})
const setup = () => {
  const registry = createAiActionRegistry()
  registry.register({
    name: 'set',
    description: 'Set a current value.',
    revision: 1,
    inputSchema: scalar,
    outputSchema: scalar,
    effect: 'mutation',
    resources: ['value'],
    lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' },
    composition: 'allowed',
    execute: async (input) => input
  })
  const execute = vi.fn(async (input) => input)
  const createExecutor = vi.fn(() => execute)
  const library = createAiToolLibrary({
    registry,
    createExecutor,
    validate: () => undefined,
    limits: { steps: 8, bindingDepth: 8, bindings: 50, bytes: 8000, issues: 8 },
    capacity: 8
  })
  return { registry, library, execute, createExecutor }
}

describe('tool candidate registration', () => {
  it('makes identical submission replay inert and rejects changed content', () => {
    const { library, createExecutor, execute, registry } = setup()
    const request = {
      requestId: 'author',
      submissionId: 'one',
      proposal: proposal()
    }
    const first = library.submit(request)
    expect(first.ok).toBe(true)
    expect(library.submit(request)).toBe(first)
    expect(
      library.submit({
        ...request,
        proposal: { ...proposal(), description: 'Changed' }
      })
    ).toMatchObject({ ok: false, code: 'submission-conflict' })
    expect(createExecutor).toHaveBeenCalledOnce()
    expect(execute).not.toHaveBeenCalled()
    expect(registry.get('reusable')).toBeUndefined()
    expect(registry.get('reusable', { requestId: 'author' })).toBeDefined()
  })

  it('revalidates corrected proposals and keeps previously admitted revisions immutable', () => {
    const { library, registry } = setup()
    expect(
      library.submit({
        requestId: 'author',
        submissionId: 'bad',
        proposal: {
          ...proposal(),
          output: { kind: 'step', step: 'missing', path: '' }
        }
      }).ok
    ).toBe(false)
    expect(
      library.submit({
        requestId: 'author',
        submissionId: 'one',
        proposal: proposal()
      }).ok
    ).toBe(true)
    const first = registry.get('reusable', { requestId: 'author' })
    expect(
      library.submit({
        requestId: 'author',
        submissionId: 'two',
        proposal: { ...proposal(), revision: 2 },
        expectedRevision: 1
      }).ok
    ).toBe(true)
    expect(registry.get('reusable', { requestId: 'author', revision: 1 })).toBe(
      first
    )
    expect(
      library.submit({
        requestId: 'author',
        submissionId: 'stale',
        proposal: { ...proposal(), revision: 3 },
        expectedRevision: 1
      })
    ).toMatchObject({ ok: false, code: 'registration' })
  })

  it('bounds retained submissions without evicting a live candidate', () => {
    const { library, registry } = setup()
    for (let i = 0; i < 8; i++) {
      expect(
        library.submit({
          requestId: 'author',
          submissionId: String(i),
          proposal: { ...proposal(), name: `tool-${i}` }
        }).ok
      ).toBe(true)
    }
    expect(
      library.submit({
        requestId: 'author',
        submissionId: 'overflow',
        proposal: proposal()
      })
    ).toMatchObject({ ok: false, code: 'capacity' })
    expect(registry.get('tool-0', { requestId: 'author' })).toBeDefined()
    library.releaseRequest('author')
    expect(registry.get('tool-0', { requestId: 'author' })).toBeUndefined()
  })

  it('keeps invalid retries inert and reports no progress within the request budget', () => {
    const { library } = setup()
    const request = { requestId: 'author', submissionId: 'bad', proposal: {} }
    expect(library.submit(request)).toMatchObject({
      ok: false,
      code: 'admission'
    })
    expect(library.submit(request)).toMatchObject({
      ok: false,
      code: 'no-progress'
    })
  })
})

it('rejects nested expansion before registration and cannot compose an unknown coordinator', () => {
  const { library, registry } = setup()
  const base = proposal()
  const large = {
    ...base,
    steps: Array.from({ length: 8 }, (_, index) => ({
      ...base.steps[0],
      id: `s${index}`
    })),
    output: { kind: 'step', step: 's7', path: '' }
  }
  expect(
    library.submit({
      requestId: 'author',
      submissionId: 'large',
      proposal: large
    }).ok
  ).toBe(true)
  const nested = {
    ...base,
    name: 'nested',
    steps: [{ ...base.steps[0], tool: 'reusable' }]
  }
  expect(
    library.submit({
      requestId: 'author',
      submissionId: 'nested',
      proposal: nested
    })
  ).toMatchObject({ ok: false, code: 'admission' })
  expect(registry.get('nested', { requestId: 'author' })).toBeUndefined()
})

it('releases an explicitly removed composition without deleting a primitive', () => {
  const { library, registry } = setup()
  library.submit({
    requestId: 'author',
    submissionId: 'one',
    proposal: proposal()
  })
  expect(library.remove('set', 1)).toBe(false)
  expect(library.remove('reusable', 1)).toBe(true)
  expect(library.recipe('reusable', 1)).toBeUndefined()
  expect(registry.get('reusable', { requestId: 'author' })).toBeUndefined()
  expect(registry.get('set')).toBeDefined()
  expect(
    library.submit({
      requestId: 'author',
      submissionId: 'one',
      proposal: proposal()
    })
  ).toMatchObject({ ok: false })
})

it('counts nested repair dependencies before publishing a bounded candidate', () => {
  const host = setup()
  expect(
    host.library.submit({
      requestId: 'author',
      submissionId: 'nested',
      proposal: proposal()
    }).ok
  ).toBe(true)
  const primitive = host.registry.get('set')
  if (!primitive) {
    throw new Error('Missing scalar primitive')
  }
  host.registry.register({
    ...primitive,
    name: 'verify',
    effect: 'read',
    verification: { statusPath: '/status', progressPath: '/progress' },
    outputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'progress'],
      properties: {
        status: {
          type: 'string',
          enum: ['pass', 'repairable', 'decision-required']
        },
        progress: { type: 'string', minLength: 1 }
      }
    }
  })
  const input = {
    ...proposal(),
    name: 'bounded',
    iteration: {
      id: 'verified',
      stateSchema: scalar,
      state: { kind: 'step', step: 'apply', path: '' },
      check: {
        id: 'check',
        tool: 'verify',
        revision: 1,
        input: { kind: 'state', path: '' }
      },
      repairs: [
        {
          id: 'repair',
          tool: 'reusable',
          revision: 1,
          input: { kind: 'state', path: '' }
        }
      ],
      next: { kind: 'step', step: 'repair', path: '' },
      maxIterations: 3
    },
    output: { kind: 'step', step: 'verified', path: '/state' }
  }
  // Surface count is eight; actual expansion is eleven including nested leaves.
  expect(
    host.library.submit({
      requestId: 'author',
      submissionId: 'over',
      proposal: input
    }).ok
  ).toBe(false)
  expect(host.registry.get('bounded', { requestId: 'author' })).toBeUndefined()
  input.iteration.maxIterations = 2
  expect(
    host.library.submit({
      requestId: 'author',
      submissionId: 'within',
      proposal: input
    }).ok
  ).toBe(true)
  expect(host.execute).not.toHaveBeenCalled()
})
