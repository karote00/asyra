import { expect, it, vi } from 'vitest'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createLocalOperationTools } from '../local-operation-tools'
import { invokeLocalTool } from '../local-tool-invocation'
import { operationInputIssue } from '@asyra/ai-agent-runtime/schema'
vi.mock('../../src/contexts', () => ({ default: {} }))

const fixture = () => {
  const dispatch = vi.fn()
  const owner = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (value) => value,

      resolveBatch: (value) => value
    },
    dispatch
  )

  const call = async (name: string, args: unknown) => {
    const definition = owner.definitions.find((entry) => entry.name === name)

    if (!definition) {
      throw new Error('Missing discovery owner: ' + name)
    }

    return invokeLocalTool(
      owner,
      definition,
      args,
      new AbortController().signal
    )
  }

  return { owner, dispatch, call }
}

it('separates purpose search from exact scoped reads without a retired entry', async () => {
  const { owner, call, dispatch } = fixture()

  expect(
    owner.definitions.some((tool) => tool.name === 'describe_design_apis')
  ).toBe(false)
  const search = await call('search_design_tools', { query: 'group elements' })

  expect(search.success, search.text).toBe(true)
  expect(JSON.parse(search.text).apis.length).toBeGreaterThan(0)
  const read = await call('read_design_contracts', {
    names: ['hierarchy.moveElementsRelative', 'fill.updateFillsAtIndex'],
    scopes: {
      'hierarchy.moveElementsRelative': {
        schemaPaths: ['/properties/request']
      },
      'fill.updateFillsAtIndex': { schemaPaths: ['/properties/patch'] }
    }
  })

  expect(read.success, read.text).toBe(true)
  const result = JSON.parse(read.text)

  expect(result.apis).toHaveLength(2)
  expect(result.apis[0].definition.coverage).toBe('partial')
  expect(result.apis[1].definition.coverage).toBe('partial')
  expect(dispatch).not.toHaveBeenCalled()
})
it('hands off the complete grouping input by identity and keeps partial-only searches navigable', async () => {
  const { call, dispatch } = fixture()
  const grouping = basicApiContracts.find(
    (action) => action.operation === 'hierarchy.groupElements'
  )

  if (!grouping) {
    throw Error('Missing grouping owner')
  }

  const search = async (query: string) => {
    const reply = await call('search_design_tools', { query })

    expect(reply.success, reply.text).toBe(true)

    return JSON.parse(reply.text)
  }

  const exact = await search(grouping.operation)
  const candidate = exact.apis.find(
    (item: { name: string }) => item.name === grouping.name
  )

  expect(candidate.operationParameters).toEqual(grouping.inputSchema)
  expect(candidate.execution).toMatchObject({
    kind: 'batch-action',
    tool: 'execute_design'
  })
  expect(
    operationInputIssue(
      { elementIds: ['a', 'b'] },
      candidate.operationParameters
    )
  ).toBeUndefined()
  expect(
    operationInputIssue({ elementIds: 42 }, candidate.operationParameters)
  ).toBeTruthy()
  const partial = await search('group elements unregisteredword')

  expect(partial.undeclaredPurposeTerms).toContain('unregisteredword')
  expect(partial.apis.length).toBeGreaterThan(0)
  for (const item of [...partial.apis, ...partial.tools]) {
    expect(item.operationParameters).toBeUndefined()
    expect(item.usage.tool).toBe('read_design_contracts')
  }

  expect(dispatch).not.toHaveBeenCalled()
})

it('measures a candidate input once per admitted schema while preserving repeat search results', async () => {
  const { call } = fixture()
  const grouping = basicApiContracts.find(
    (action) => action.operation === 'hierarchy.groupElements'
  )

  if (!grouping) {
    throw Error('Missing grouping owner')
  }

  const serialize = vi.spyOn(JSON, 'stringify')

  const search = () => call('search_design_tools', { query: 'group elements' })

  const measurements = () =>
    serialize.mock.calls.filter(([value]) => value === grouping.inputSchema)
      .length

  try {
    const first = await search()

    expect(first.success, first.text).toBe(true)
    expect(measurements()).toBe(1)
    const again = await search()

    expect(again.text).toEqual(first.text)
    expect(measurements()).toBe(1)
  } finally {
    serialize.mockRestore()
  }
})

it('publishes distinct input and request-composition contracts', () => {
  const { owner } = fixture()

  for (const name of ['search_design_tools', 'read_design_contracts']) {
    const definition = owner.definitions.find((tool) => tool.name === name)

    if (!definition) {
      throw new Error('Missing discovery owner: ' + name)
    }

    expect(definition.composition).toBe('request')
    expect(
      operationInputIssue(
        { names: ['hierarchy.moveElementsRelative'], query: 'group elements' },
        definition.inputSchema
      )
    ).toBeTruthy()
  }
})
it('publishes retained reads as a distinct selection without changing saved coverage', () => {
  const { owner } = fixture()
  const definition = owner.definitions.find(
    (tool) => tool.name === 'read_design_contracts'
  )

  if (!definition) {
    throw new Error('Missing contract read owner')
  }

  const schema = definition.inputSchema

  expect(
    operationInputIssue(
      { names: ['group_elements'], fromResult: 'saved' },
      schema
    )
  ).toBeUndefined()
  expect(
    operationInputIssue(
      { names: ['group_elements'], fromResult: 'saved', view: 'full' },
      schema
    )
  ).toBeTruthy()
  expect(
    operationInputIssue(
      {
        names: ['group_elements'],
        fromResult: 'saved',
        scopes: { group_elements: { schemaPaths: ['/properties/request'] } }
      },
      schema
    )
  ).toBeTruthy()
})

it('preserves owner recovery candidates when a separately scoped identity is unresolved', async () => {
  const { call } = fixture()
  const result = await call('read_design_contracts', {
    names: ['hierarchy.moveElementsRelative', 'hierarchy.groupElement'],
    scopes: {
      'hierarchy.moveElementsRelative': { schemaPaths: ['/properties/request'] }
    }
  })
  const value = JSON.parse(result.text)

  expect(value.missingNames).toEqual(['hierarchy.groupElement'])
  expect(value.apis).toHaveLength(1)
  expect(value.candidates).toContainEqual(
    expect.objectContaining({ name: 'api_hierarchy_groupElements' })
  )
  expect(value.message).toEqual(expect.any(String))
})

it('keeps the primary action independent of an unrelated native tool with the same short name', async () => {
  const action = basicApiContracts.find(
    (entry) => entry.operation === 'hierarchy.groupElements'
  )

  if (!action) {
    throw new Error('Missing grouping action')
  }

  const owner = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (v) => v,

      resolveBatch: (v) => v
    },
    vi.fn(),
    {
      getNativeTools: () => [
        {
          name: action.name,
          namespace: 'custom',
          description: 'Unrelated operation',
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
          effect: 'read',
          resources: []
        }
      ]
    }
  )
  const definition = owner.definitions.find(
    (tool) => tool.name === 'read_design_contracts'
  )

  if (!definition) {
    throw new Error('Missing contract owner')
  }

  const reply = await invokeLocalTool(
    owner,
    definition,
    { names: [action.name] },
    new AbortController().signal
  )
  const result = JSON.parse(reply.text)

  expect(result.apis).toHaveLength(1)
  expect(result.apis[0].name).toBe(action.name)
  expect(result.apis[0].recipeDependency).toBeUndefined()
  expect(result.tools).toEqual([])
  const qualified = await invokeLocalTool(
    owner,
    definition,
    { names: ['custom.' + action.name] },
    new AbortController().signal
  )

  expect(JSON.parse(qualified.text).tools[0].namespace).toBe('custom')
})
