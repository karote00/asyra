import { expect, it, vi } from 'vitest'
import recorded from './fixtures/recorded-101/input-rejection-20261112.json'
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalKnowledgeTools } from '../local-knowledge'

import { invokeLocalTool } from '../local-tool-invocation'

vi.mock('../../src/contexts', () => ({ default: {} }))

it('returns a correctable recorded lookup rejection without a recovery permission flag', async () => {
  const dispatch = vi.fn()
  const owner = createLocalOperationTools(
    createBasicApiActions(),
    {
      modelActions: (value) => value,

      resolveBatch: (value) => value
    },
    dispatch
  )
  const definition = owner.definitions.find(
    (entry) => entry.name === 'read_design_resources'
  )

  if (!definition) {
    throw new Error('Missing registered test tool')
  }

  const signal = new AbortController().signal
  const reply = await invokeLocalTool(
    owner,
    definition,
    recorded.lookup,
    signal
  )
  const value = JSON.parse(reply.text)

  expect(value.code).toBe('TOOL_INPUT_INVALID')
  expect(value).not.toHaveProperty('recoverable')
  expect(value).not.toHaveProperty('recovery')
  expect(reply.outcome).toMatchObject({
    status: 'failed',
    settlement: 'not-started'
  })

  const corrected = await invokeLocalTool(
    owner,
    definition,
    {
      names: recorded.lookup.operations,
      view: 'usage'
    },
    signal
  )

  expect(corrected.success, corrected.text).toBe(true)
  expect(dispatch).not.toHaveBeenCalled()
})

it('allows a Knowledge semantic input correction through the same invocation boundary', async () => {
  const owner = createLocalKnowledgeTools(
    'knowledge-input-repair',
    async () => [
      {
        id: 'design',
        revision: 1,
        markdown:
          '---\n{"description":"Design advice","provenance":["Test authored advice"]}\n---\nUse current tools.'
      }
    ]
  )
  const definition = owner.definitions.find(
    (entry) => entry.name === 'read_knowledge'
  )

  if (!definition) {
    throw new Error('Missing registered test tool')
  }

  const signal = new AbortController().signal
  const reply = await invokeLocalTool(
    owner,
    definition,
    {
      ids: ['design'],
      rehydrate: true,
      contentPage: { revision: 'a'.repeat(64), offset: 0 }
    },
    signal
  )

  expect(JSON.parse(reply.text)).toMatchObject({
    code: 'TOOL_INPUT_INVALID',
    settlement: 'not-started'
  })

  expect(
    (await invokeLocalTool(owner, definition, { ids: ['design'] }, signal))
      .success
  ).toBe(true)
  owner.dispose()
})

it('preserves missing Knowledge selection as input while preserving unavailable source failures', async () => {
  const signal = new AbortController().signal
  const owner = createLocalKnowledgeTools(
    'knowledge-selection-repair',
    async () => [
      {
        id: 'design',
        revision: 1,
        markdown:
          '---\n{"description":"Design advice","provenance":["Test authored advice"]}\n---\nUse current tools.'
      }
    ]
  )
  const definition = owner.definitions.find(
    (entry) => entry.name === 'read_knowledge'
  )

  if (!definition) {
    throw new Error('Missing registered test tool')
  }

  try {
    const missing = await invokeLocalTool(
      owner,
      definition,
      { ids: ['missing'] },
      signal
    )

    expect(JSON.parse(missing.text)).toMatchObject({
      code: 'TOOL_INPUT_INVALID',
      settlement: 'not-started',
      message: expect.stringContaining('KNOWLEDGE_NOT_FOUND')
    })

    expect(
      (await invokeLocalTool(owner, definition, { ids: ['design'] }, signal))
        .success
    ).toBe(true)
  } finally {
    owner.dispose()
  }

  const unavailable = createLocalKnowledgeTools(
    'knowledge-source-failure',
    async () => {
      throw new Error('Catalog source unavailable')
    }
  )

  try {
    const unavailableDefinition = unavailable.definitions.find(
      (entry) => entry.name === 'read_knowledge'
    )

    if (!unavailableDefinition) {
      throw new Error('Missing registered Knowledge reader')
    }

    const failed = await invokeLocalTool(
      unavailable,
      unavailableDefinition,
      { ids: ['design'] },
      signal
    )

    expect(failed.outcome).toMatchObject({
      status: 'failed',
      settlement: 'unknown'
    })
    expect(failed.text).toContain('TOOL_EXECUTION_FAILED')
  } finally {
    unavailable.dispose()
  }
})
