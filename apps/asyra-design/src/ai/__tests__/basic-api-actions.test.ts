import { expect, it, vi } from 'vitest'
import { describeBasicApiResult } from '../basic-api-results'
import { createBasicApiActions } from '../basic-api-actions'
import {
  basicApiContracts,
  basicApiPermissionRules
} from '../basic-api-catalog'

it('delegates every contract in parameter order without copying inputs or injecting history flags', async () => {
  for (const contract of basicApiContracts) {
    let inMutation = false
    const mutating =
      contract.effect !== 'read' && contract.effect !== 'viewport'
    const method = vi.fn(function (this: object, ...args: unknown[]) {
      expect(inMutation).toBe(mutating)
      return { receiver: this, args }
    })
    const owner = { [contract.method]: method }
    const owners = {
      core: {},
      element: {},
      selection: {},
      hierarchy: {},
      viewport: {},
      fill: {},
      stroke: {},
      [contract.owner]: owner
    }
    const action = createBasicApiActions(() => owners).find(
      (a) => a.name === contract.name
    )
    if (!action) throw new Error('Missing action')
    const args = Object.fromEntries(
      contract.parameters.map((p) => [p, { input: p }])
    )
    await action.execute(args, {
      signal: new AbortController().signal,
      runMutation: async (mutate) => {
        inMutation = true
        try {
          return mutate()
        } finally {
          inMutation = false
        }
      }
    })
    expect(method).toHaveBeenCalledExactlyOnceWith(
      ...contract.parameters.map((p) => args[p])
    )
    for (let i = 0; i < contract.parameters.length; i++)
      expect(method.mock.calls[0][i]).toBe(args[contract.parameters[i]])
    expect(basicApiPermissionRules[contract.name]).toBe('allow')
  }
})

it('cancels before dispatch and preserves null/false and owner failures', async () => {
  const method = vi
    .fn()
    .mockReturnValueOnce(null)
    .mockReturnValueOnce(false)
    .mockImplementationOnce(() => {
      throw new Error('owner failure')
    })
  const action = createBasicApiActions(() => ({
    core: {},
    element: { setVectorClosed: method },
    selection: {},
    hierarchy: {},
    viewport: {},
    fill: {},
    stroke: {}
  })).find((a) => a.name === 'api_element_setVectorClosed')
  if (!action) throw new Error('Missing action')
  await expect(
    action.execute({}, { signal: AbortSignal.abort() })
  ).rejects.toThrow()
  expect(method).not.toHaveBeenCalled()
  const context = { signal: new AbortController().signal }
  expect(
    await action.execute({ elementId: 'v', closed: true }, context)
  ).toMatchObject({ value: null })
  expect(
    await action.execute({ elementId: 'v', closed: true }, context)
  ).toMatchObject({ value: false })
  await expect(
    action.execute({ elementId: 'v', closed: true }, context)
  ).rejects.toThrow('owner failure')
})

it('reports completed basic writes and no-change reads or rejected writes', async () => {
  const method = vi.fn()
  const actions = createBasicApiActions(() => ({
    core: { getElementData: method },
    element: { setVectorClosed: method },
    selection: {},
    hierarchy: {},
    viewport: {},
    fill: {},
    stroke: {}
  }))
  const context = { signal: new AbortController().signal }
  const write = actions.find((a) => a.name === 'api_element_setVectorClosed')
  const read = actions.find((a) => a.name === 'api_core_getElementData')
  if (!write || !read) throw new Error('Missing API actions')
  expect(await write.execute({}, context)).toMatchObject({ status: 'complete' })
  method.mockReturnValueOnce(false)
  expect(await write.execute({}, context)).toMatchObject({
    status: 'no-change'
  })
  method.mockReturnValueOnce(null)
  expect(await write.execute({}, context)).toMatchObject({
    status: 'no-change'
  })
  method.mockReturnValueOnce({ id: 'v' })
  expect(await read.execute({}, context)).toMatchObject({
    status: 'no-change',
    execution: 'complete',
    application: 'read-only'
  })
})

it('reports mixed creation outcomes in order instead of claiming complete', async () => {
  const method = vi
    .fn()
    .mockReturnValueOnce(['a', null, 'c'])
    .mockReturnValueOnce([])
    .mockReturnValueOnce([null])
  const action = createBasicApiActions(() => ({
    core: {},
    element: { createElements: method },
    selection: {},
    hierarchy: {},
    viewport: {},
    fill: {},
    stroke: {}
  })).find((a) => a.name === 'api_element_createElements')
  if (!action) throw new Error('Missing batch creation')
  const context = { signal: new AbortController().signal }
  expect(
    await action.execute({ createOptions: [{}, {}, {}] }, context)
  ).toMatchObject({
    status: 'partial',
    value: ['a', null, 'c'],
    appliedElementIds: ['a', 'c'],
    items: [
      { index: 0, status: 'complete', value: 'a' },
      { index: 1, status: 'failed', value: null },
      { index: 2, status: 'complete', value: 'c' }
    ]
  })
  expect(await action.execute({ createOptions: [] }, context)).toMatchObject({
    status: 'no-change',
    items: []
  })
  expect(await action.execute({ createOptions: [{}] }, context)).toMatchObject({
    status: 'failed'
  })
})

it('does not report selection or viewport operations as document changes', () => {
  for (const contract of basicApiContracts.filter(
    (item) => item.effect === 'selection' || item.effect === 'viewport'
  )) {
    expect(describeBasicApiResult(contract, undefined)).toMatchObject({
      status: 'no-change',
      execution: 'complete'
    })
  }
})

it.each([
  {
    ids: ['a', 'b', 'missing'],
    values: ['changed', 'unchanged', 'unavailable'],
    status: 'partial',
    reviewIds: ['a', 'b']
  },
  {
    ids: ['a', 'b'],
    values: ['changed', 'changed'],
    status: 'complete',
    reviewIds: ['a', 'b']
  },
  { ids: ['a'], values: ['unchanged'], status: 'no-change', reviewIds: ['a'] },
  {
    ids: ['missing'],
    values: ['unavailable'],
    status: 'failed',
    reviewIds: []
  },
  { ids: [], values: [], status: 'no-change', reviewIds: [] },
  {
    ids: ['a', 'a'],
    values: ['changed', 'unchanged'],
    status: 'complete',
    reviewIds: ['a']
  }
])(
  'keeps confirmed visibility identities and ordered $status outcomes',
  async ({ ids, values, status, reviewIds }) => {
    const method = vi.fn(() => values)
    const action = createBasicApiActions(() => ({
      core: {},
      element: { setElementsVisible: method },
      selection: {},
      hierarchy: {},
      viewport: {},
      fill: {},
      stroke: {}
    })).find((entry) => entry.name === 'api_element_setElementsVisible')
    if (!action) throw new Error('Missing visibility action')
    const result = await action.execute(
      { elementIds: ids, visible: false },
      {
        signal: new AbortController().signal
      }
    )
    expect(result).toMatchObject({
      status,
      value: values,
      reviewElementIds: reviewIds
    })
    expect(method).toHaveBeenCalledExactlyOnceWith(ids, false)
  }
)

it.each([
  { ids: ['a', 'b'], values: ['changed'] },
  { ids: ['a'], values: ['changed', 'changed'] },
  { ids: ['a'], values: ['invalid'] },
  { ids: ['a'], values: null },
  { ids: undefined, values: ['changed'] },
  { ids: [''], values: ['changed'] }
])(
  'rejects malformed visibility receipt alignment without certifying target identities',
  async ({ ids, values }) => {
    const action = createBasicApiActions(() => ({
      core: {},
      element: { setElementsVisible: () => values },
      selection: {},
      hierarchy: {},
      viewport: {},
      fill: {},
      stroke: {}
    })).find((entry) => entry.name === 'api_element_setElementsVisible')
    if (!action) throw new Error('Missing visibility action')
    const result = await action.execute(
      { elementIds: ids, visible: false },
      {
        signal: new AbortController().signal
      }
    )
    expect(result).toMatchObject({ status: 'failed' })
    expect(result).not.toHaveProperty('reviewElementIds')
  }
)

it('advertises unique Fill row mutation targets without changing sharing identity semantics', () => {
  for (const method of [
    'updateFillsAtIndex',
    'shareFillAtIndex',
    'detachFillsAtIndex'
  ]) {
    expect(
      basicApiContracts.find((api) => api.method === method)?.inputSchema
    ).toMatchObject({
      properties: { elementIds: { uniqueItems: true } }
    })
  }
})
