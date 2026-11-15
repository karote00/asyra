import { expect, it, vi } from 'vitest'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createLocalOperationTools } from '../local-operation-tools'
import { invokeLocalTool } from '../local-tool-invocation'
import { operationInputIssue } from '../operation-input-schema'
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
