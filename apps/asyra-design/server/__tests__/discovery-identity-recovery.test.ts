import { createLocalReferenceTools } from '../local-reference-tools'
import recorded from '../../test-data/ai-drawing/fixtures/discovery-identity-stop-20261107.json'
import { expect, it, vi } from 'vitest'
vi.mock('../../src/contexts', () => ({ default: {} }))
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createLocalOperationTools } from '../local-operation-tools'
import { invokeLocalTool } from '../local-tool-invocation'

import { toolSemantics } from '../../src/ai/tool-contract'

const setup = () => {
  const dispatch = vi.fn()
  const owner = createLocalOperationTools(
    createBasicApiActions().map(createAiToolContract),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    dispatch,
    {
      getNativeTools: () =>
        ['first', 'second'].map((namespace) => ({
          name: 'ambiguous',
          namespace,
          description: 'A read capability.',
          inputSchema: { type: 'object' },
          ...toolSemantics({ type: 'object' }, 'read', [])
        }))
    }
  )
  const definition = owner.definitions.find(
    (entry) => entry.name === 'read_design_resources'
  )

  if (!definition) {
    throw new Error('Missing discovery definition')
  }

  const call = async (input: unknown) => {
    const reply = await invokeLocalTool(
      owner,
      definition,
      input,
      new AbortController().signal
    )

    return { reply, value: JSON.parse(reply.text) }
  }

  return { call, dispatch }
}

it('delivers recorded mixed identity failure and accepts a corrected selection', async () => {
  const { call, dispatch } = setup()
  const { value, reply } = await call({
    names: recorded.input.operations,
    view: recorded.input.view
  })

  expect(reply.outcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(value.missingNames).toEqual(['fill.updateFills'])
  expect(value.apis.map((entry: { name: string }) => entry.name)).toEqual(
    recorded.output.apis.map((entry) => entry.name)
  )
  expect(value).toMatchObject({
    status: 'partial',
    settlement: 'completed',
    code: 'IDENTITY_UNRESOLVED'
  })

  expect(
    value.apis.every(
      (entry: { definition: { availableInResponse: boolean } }) =>
        entry.definition.availableInResponse
    )
  ).toBe(true)
  expect(dispatch).not.toHaveBeenCalled()
  const corrected = await call({
    names: ['fill.updateFillsAtIndex'],
    view: 'usage'
  })

  expect(corrected.value.missingNames).toEqual([])
  expect(corrected.reply.outcome?.status).toBe('success')
})

it.each([
  { names: ['fill.updateFills'], view: 'usage' },
  { names: ['missing-native'], view: 'usage' },
  { names: ['ambiguous'], view: 'usage' },
  { names: ['hierarchy.groupElements', 'ambiguous'], view: 'usage' }
])(
  'keeps identity selection recoverable without substituting a route: %j',
  async (input) => {
    const { call, dispatch } = setup()
    const { value, reply } = await call(input)

    expect(value).toMatchObject({
      settlement: 'completed',
      code: 'IDENTITY_UNRESOLVED'
    })

    expect(reply.outcome.status).toBe(value.status)
    expect(dispatch).not.toHaveBeenCalled()
  }
)

it('preserves identity recovery through complete content paging and retained refresh', async () => {
  const { call } = setup()
  const input = {
    names: [
      ...basicApiContracts.map((entry) => entry.operation),
      'missing.operation'
    ],
    view: 'full'
  }
  let response = await call(input)
  const pages: string[] = []

  while (response.value.contentDelivery) {
    pages.push(response.value.contentDelivery.text)
    if (!response.value.contentDelivery.next) {
      break
    }

    response = await call(response.value.contentDelivery.next.arguments)
  }

  expect(pages.length).toBeGreaterThan(1)
  const full = JSON.parse(pages.join(''))

  expect(full.missingNames).toEqual(['missing.operation'])
  const retained = await call({
    fromResult: full.resultKey,
    names: ['hierarchy.groupElements', 'missing.operation']
  })

  expect(retained.value.missingNames).toEqual(['missing.operation'])
  expect(retained.reply.outcome.status).toBe('partial')
  const refreshed = await call({
    names: recorded.input.operations,
    view: recorded.input.view,
    refresh: true
  })

  expect(refreshed.reply.outcome.status).toBe('partial')
})

it('allows correction of unresolved identities and invalid authored schema paths', async () => {
  const { call } = setup()
  const { value, reply } = await call({
    names: ['hierarchy.groupElements', 'missing-native'],
    scopes: Object.fromEntries(
      ['hierarchy.groupElements', 'missing-native'].map((name) => [
        name,
        { schemaPaths: ['/notAnExistingSchemaField'] }
      ])
    )
  })

  expect(reply.outcome).toMatchObject({
    status: 'failed',
    settlement: 'completed'
  })
  expect(value.code).toBe('TOOL_INPUT_INVALID')
  expect(value).not.toHaveProperty('recovery')
})

it.each(
  ['import_reference_image', 'a', 'b', 'c'].flatMap((name) =>
    [
      'import reference image url',
      'import reference image from url',
      'import an image from a reference url'
    ].map((query) => ({ name, query }))
  )
)(
  'delivers the recorded complete import purpose through the host for %s',
  async ({ name, query }) => {
    const dispatch = vi.fn()
    const owner = createLocalOperationTools(
      createBasicApiActions().map(createAiToolContract),
      {
        modelActions: (a) => a,

        resolveBatch: (v) => v
      },
      dispatch,
      {
        getNativeTools: () => [
          {
            ...createLocalReferenceTools(vi.fn(), vi.fn()).definitions[0],
            name,
            namespace: 'sources'
          }
        ]
      }
    )
    const definition = owner.definitions.find(
      (d) => d.name === 'search_design_tools'
    )

    if (!definition) {
      throw Error('Missing discovery')
    }

    const reply = await invokeLocalTool(
      owner,
      definition,
      { query },
      new AbortController().signal
    )
    const value = JSON.parse(reply.text)

    expect(reply.success, reply.text).toBe(true)
    expect(value.tools[0].rank).toBe(1)
    expect(value.tools[0].match.unmatchedTerms).toEqual([])
    expect(value.tools[0].usageGuide).toBeUndefined()
    expect(value.tools[0].operationParameters).toEqual(
      createLocalReferenceTools(vi.fn(), vi.fn()).definitions[0].inputSchema
    )
    const read = owner.definitions.find(
      (d) => d.name === 'read_design_resources'
    )

    if (!read) {
      throw new Error('Missing contract read owner')
    }

    const acquired = await invokeLocalTool(
      owner,
      read,
      value.tools[0].usage.arguments,
      new AbortController().signal
    )

    expect(acquired.success, acquired.text).toBe(true)
    expect(
      JSON.parse(acquired.text).tools[0].usageGuide.parameters
    ).toBeDefined()
    expect(value.tools[0].execution).toEqual({
      kind: 'host-operation',
      tool: 'execute_design',
      operation: 'sources.' + name
    })
    expect(dispatch).not.toHaveBeenCalled()
  }
)
