import { expect, it, vi } from 'vitest'
import { operationInputIssue } from '@asyra/ai-agent-runtime/schema'
import { describeBasicApiResult } from '../basic-api-results'
import { createBasicApiActions } from '../basic-api-actions'
import {
  basicApiContracts,
  basicApiPermissionRules
} from '../basic-api-catalog'

it('delegates every contract in parameter order without copying inputs or injecting history flags', async () => {
  for (const contract of basicApiContracts) {
    let inMutation = false
    const mutating = !['read', 'viewport', 'prepare'].includes(contract.effect)
    const method = vi.fn(function (this: object, ...args: unknown[]) {
      expect(inMutation).toBe(mutating)

      return contract.result.kind === 'allocated-ids'
        ? ['el-reserved']
        : { receiver: this, args }
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

    if (!action) {
      throw new Error('Missing action')
    }

    const args = Object.fromEntries(
      contract.parameters.map((p) => {
        if (p === 'types') {
          return [p, ['el']]
        }

        if (p === 'elementIds') {
          return [p, ['first', 'second']]
        }

        return [p, { input: p }]
      })
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
    for (let i = 0; i < contract.parameters.length; i++) {
      expect(method.mock.calls[0][i]).toBe(args[contract.parameters[i]])
    }

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

  if (!action) {
    throw new Error('Missing action')
  }

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

it('rejects invalid declared owner results while preserving completed settlement', async () => {
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

  if (!write || !read) {
    throw new Error('Missing API actions')
  }

  expect(await write.execute({}, context)).toMatchObject({
    status: 'failed',
    code: 'OWNER_RESULT_INVALID',
    settlement: 'completed'
  })
  method.mockReturnValueOnce(false)
  expect(await write.execute({}, context)).toMatchObject({
    status: 'failed',
    code: 'OWNER_RESULT_INVALID',
    settlement: 'completed'
  })
  method.mockReturnValueOnce(null)
  expect(await write.execute({}, context)).toMatchObject({
    status: 'failed',
    code: 'OWNER_RESULT_INVALID',
    settlement: 'completed'
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

  if (!action) {
    throw new Error('Missing batch creation')
  }

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
  'keeps confirmed visibility identities and ordered $status outcomes - case %#',
  async ({ ids, values, status }) => {
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

    if (!action) {
      throw new Error('Missing visibility action')
    }

    const result = await action.execute(
      { elementIds: ids, visible: false },
      {
        signal: new AbortController().signal
      }
    )

    expect(result).toMatchObject({
      status,
      value: values
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
  'rejects malformed visibility receipt alignment without certifying target identities - case %#',
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

    if (!action) {
      throw new Error('Missing visibility action')
    }

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
      properties: {
        elementIds: {
          anyOf: expect.arrayContaining([
            { type: 'array', items: expect.any(Object), uniqueItems: true }
          ])
        }
      }
    })
  }
})

it('captures only admitted execution through settlement and releases the scope observer', async () => {
  let changed: ((change?: { elementIds: string[] }) => void) | undefined
  const stop = vi.fn(() => {
    changed = undefined
  })
  const read = vi.fn((id: string) => (id === 'removed' ? 'removed' : 'live'))
  const method = vi.fn(() => {
    changed?.({ elementIds: ['inside'] })
  })
  const action = createBasicApiActions(
    () => ({
      core: { updateElementProperties: method },
      element: {},
      selection: {},
      hierarchy: {},
      viewport: {},
      fill: {},
      stroke: {}
    }),
    {
      observe: (listener) => {
        changed = listener

        return stop
      },

      resolve: read
    }
  ).find((action) => action.name === 'api_core_updateElementProperties')

  if (!action) {
    throw new Error('Missing action')
  }

  const result = await action.execute(
    { updates: [] },
    {
      signal: new AbortController().signal,

      runMutation: async (work) => {
        changed?.({ elementIds: ['unrelated-wait'] })
        const value = work()

        changed?.({ elementIds: ['after-commit', 'removed', 'inside'] })

        return value
      }
    }
  )

  expect(result).toMatchObject({
    mutationScope: {
      complete: true,
      elementIds: ['inside', 'after-commit'],
      removedElementIds: ['removed']
    }
  })
  expect(read.mock.calls.flat()).toEqual(['inside', 'after-commit', 'removed'])
  expect(stop).toHaveBeenCalledTimes(1)
  method.mockImplementationOnce(() => {
    throw new Error('mutation failed')
  })
  await expect(
    action.execute({ updates: [] }, { signal: new AbortController().signal })
  ).rejects.toThrow('mutation failed')
  expect(stop).toHaveBeenCalledTimes(2)
})

it('does not certify unknown publication or unavailable scope resolution as empty success', async () => {
  let changed: ((change?: { elementIds: string[] }) => void) | undefined
  const method = vi.fn(() => {
    changed?.()
  })
  const action = createBasicApiActions(
    () => ({
      core: { updateElementProperties: method },
      element: {},
      selection: {},
      hierarchy: {},
      viewport: {},
      fill: {},
      stroke: {}
    }),
    {
      observe: (listener) => {
        changed = listener

        return () => {
          changed = undefined
        }
      },

      resolve: () => {
        throw new Error('unavailable metadata')
      }
    }
  ).find((action) => action.name === 'api_core_updateElementProperties')

  if (!action) {
    throw new Error('Missing action')
  }

  const context = { signal: new AbortController().signal }

  expect(await action.execute({ updates: [] }, context)).toMatchObject({
    mutationScope: { complete: false }
  })
  method.mockImplementationOnce(() => {
    changed?.({ elementIds: ['unknown'] })
  })
  expect(await action.execute({ updates: [] }, context)).toMatchObject({
    mutationScope: { complete: false }
  })
})

it('exposes distinct owner-local and shared-source operations with exact target schemas', () => {
  const target = {
    elementId: 'window',
    propertyName: 'fills',
    path: [{ key: 'fills', childId: 'slot' }],
    expectedPropertyId: 'binding'
  }
  const requests = {
    readElementPropertyTargets: { targets: [target] },
    updateElementPropertyTargets: {
      updates: [{ target, values: { opacity: 0.4 } }]
    },
    updateSharedPropertySources: {
      updates: [{ propertyId: 'source', values: { color: '#123456' } }]
    },
    resetElementPropertyOverrides: { updates: [{ target, keys: ['opacity'] }] },
    detachElementPropertyTargets: { targets: [target] },
    shareElementPropertyTargets: { updates: [{ target, sourceId: 'source' }] }
  }

  for (const [method, input] of Object.entries(requests)) {
    const contract = basicApiContracts.find(
      (item) => item.owner === 'core' && item.method === method
    )

    expect(contract, method).toBeDefined()
    if (!contract) {
      throw new Error(`Missing ${method}`)
    }

    expect(operationInputIssue(input, contract.inputSchema)).toBeUndefined()
    expect(
      operationInputIssue(
        { ...input, options: { undoable: false } },
        contract.inputSchema
      )
    ).toBeDefined()
    expect(contract.effect).toBe(
      method === 'readElementPropertyTargets' ? 'read' : 'write'
    )
    if (method !== 'updateSharedPropertySources') {
      const invalid = JSON.parse(
        JSON.stringify(input).replace('"childId":"slot"', '"index":0')
      )

      expect(operationInputIssue(invalid, contract.inputSchema)).toBeDefined()
    }
  }
})

it('versions selected-owner property semantics separately from read and structural contracts', () => {
  const actions = createBasicApiActions()

  for (const name of [
    'api_element_setElementsVisible',
    'api_core_updateElementProperties',
    'api_core_patchElementProperties',
    'api_fill_updateFillsAtIndex',
    'api_fill_updateFillFieldsBatch',
    'api_fill_shareFillAtIndex',
    'api_stroke_updateStrokeFieldsBatch'
  ]) {
    let revision = 11

    if (name.startsWith('api_core_')) {
      revision = 9
    }

    if (name === 'api_element_setElementsVisible') {
      revision = 7
    }

    expect(actions.find((action) => action.name === name)?.revision, name).toBe(
      revision
    )
  }

  expect(
    actions.find((action) => action.name === 'api_core_getElementComputedData')
      ?.revision
  ).toBe(3)
})

it('rejects misaligned creation receipts while preserving acknowledged IDs', async () => {
  const createElements = vi.fn(() => ['created-prefix'])
  const action = createBasicApiActions(
    () => ({
      core: {},
      element: { createElements },
      fill: {},
      stroke: {},
      hierarchy: {},
      selection: {},
      viewport: {}
    }),
    {
      observe: () => () => undefined,

      resolve: () => 'live'
    }
  ).find((entry) => entry.name === 'api_element_createElements')

  if (!action) {
    throw new Error('Missing creation action')
  }

  const result = await action.execute(
    { createOptions: [{}, {}] },
    { signal: new AbortController().signal }
  )

  expect(result).toMatchObject({
    status: 'failed',
    code: 'OWNER_RESULT_INVALID',
    settlement: 'completed',
    appliedElementIds: ['created-prefix']
  })
  expect(createElements).toHaveBeenCalledOnce()
})

it.each([
  { values: ['unavailable'], status: 'failed', settlement: 'not-started' },
  {
    values: ['unchanged', 'unavailable'],
    status: 'partial',
    settlement: 'not-started'
  },
  {
    values: ['changed', 'unavailable'],
    status: 'partial',
    settlement: 'partial'
  },
  { values: ['unchanged'], status: 'no-change', settlement: 'completed' }
])(
  'preserves known status-item settlement for $values',
  ({ values, status, settlement }) => {
    const contract = basicApiContracts.find(
      (item) => item.name === 'api_element_setElementsVisible'
    )

    if (!contract) {
      throw new Error('Missing visibility contract')
    }

    expect(
      describeBasicApiResult(
        contract,
        values,
        values.map((_, index) => `target-${index}`)
      )
    ).toMatchObject({ status, settlement })
  }
)

it('requires an explicit result contract for every registered Core mutation', () => {
  const writers = basicApiContracts.filter(
    (contract) =>
      contract.owner === 'core' && ['write', 'delete'].includes(contract.effect)
  )

  expect(writers).toHaveLength(11)
  expect(
    writers.filter((contract) => String(contract.result.kind) === 'owner')
  ).toEqual([])
})

it.each([
  ['updateElementProperties', [{ elementId: 'a', values: {} }]],
  ['patchElementProperties', [{ elementId: 'a', records: [] }]],
  ['updatePropertyComponents', [{ propertyId: 'a', values: {} }]],
  [
    'updateElementPropertyTargets',
    [{ target: { elementId: 'a' }, values: {} }]
  ],
  ['resetElementPropertyOverrides', [{ target: { elementId: 'a' }, keys: [] }]],
  ['detachElementPropertyTargets', [{ elementId: 'a' }]],
  [
    'shareElementPropertyTargets',
    [{ target: { elementId: 'a' }, sourceId: 'source' }]
  ],
  ['updateSharedPropertySources', [{ propertyId: 'a', values: {} }]]
])(
  'interprets canonical receipt evidence for Core %s without unknown application',
  (method, inputs) => {
    const contract = basicApiContracts.find(
      (item) => item.owner === 'core' && item.method === method
    )

    if (!contract) {
      throw new Error('Missing Core mutation')
    }

    for (const changed of [false, true]) {
      expect(
        describeBasicApiResult(
          contract,
          { acceptedIds: ['a'], changed },
          inputs
        )
      ).toMatchObject({ status: changed ? 'complete' : 'no-change' })
    }

    expect(
      describeBasicApiResult(contract, { acceptedIds: [], changed: false }, [])
    ).toMatchObject({ status: 'no-change' })
    for (const value of [
      undefined,
      false,
      [],
      { acceptedIds: ['other'], changed: true },
      { acceptedIds: ['a'], changed: 'yes' }
    ]) {
      expect(describeBasicApiResult(contract, value, inputs)).toMatchObject({
        status: 'failed',
        code: 'OWNER_RESULT_INVALID',
        value: value ?? null
      })
    }
  }
)

it('treats only the declared canonical changed flag as a valid boolean no-op', () => {
  const contract = basicApiContracts.find(
    (item) => item.name === 'api_core_updateElementData'
  )

  if (!contract) {
    throw new Error('Missing element data mutation')
  }

  expect(describeBasicApiResult(contract, false, 'a')).toMatchObject({
    status: 'no-change',
    value: false
  })
  expect(describeBasicApiResult(contract, true, 'a')).toMatchObject({
    status: 'complete',
    value: true
  })
  expect(describeBasicApiResult(contract, undefined, 'a')).toMatchObject({
    status: 'failed',
    code: 'OWNER_RESULT_INVALID'
  })
})

it('rejects misaligned Core creation output while retaining the acknowledged prefix', () => {
  const contract = basicApiContracts.find(
    (item) => item.name === 'api_core_createElementsInParent'
  )

  if (!contract) {
    throw new Error('Missing Core creation contract')
  }

  expect(describeBasicApiResult(contract, ['created'], [{}, {}])).toMatchObject(
    {
      status: 'failed',
      code: 'OWNER_RESULT_INVALID',
      appliedElementIds: ['created']
    }
  )
})

it.each(['api_core_createElementsInParent', 'api_core_moveElements'])(
  'fails missing %s owner output with its original value retained',
  (name) => {
    const contract = basicApiContracts.find((item) => item.name === name)

    if (!contract) {
      throw new Error('Missing Core contract')
    }

    expect(describeBasicApiResult(contract, undefined, [])).toMatchObject({
      status: 'failed',
      code: 'OWNER_RESULT_INVALID',
      value: null
    })
  }
)

it('describes registered system context without requiring absent preset properties', () => {
  const contract = basicApiContracts.find(
    (item) => item.method === 'getSystemContextSnapshot'
  )

  if (!contract) {
    throw Error('Missing system context contract')
  }

  for (const value of [
    {},
    { selectedElementIds: ['a'] },
    {
      selectedElementIds: ['a'],
      hoveredElementId: null,
      mousePosition: { x: 2, y: 3 },
      customMode: 'editing'
    }
  ]) {
    const result = describeBasicApiResult(contract, value)

    expect(result.value).toEqual(value)
    expect(
      operationInputIssue(result.value, contract.result.valueSchema)
    ).toBeUndefined()
  }

  for (const value of [
    { selectedElementIds: [7] },
    { hoveredElementId: false },
    { mousePosition: { x: 2 } },
    { mousePosition: { x: 2, y: '3' } }
  ]) {
    expect(
      operationInputIssue(value, contract.result.valueSchema)
    ).toBeDefined()
  }
})

it('projects inherited rectangle coordinates without fabricating missing fields', () => {
  const contract = basicApiContracts.find(
    (item) => item.owner === 'core' && item.method === 'getCanvasBounds'
  )

  if (!contract) {
    throw Error('Missing rectangle contract')
  }

  const rect = new DOMRect(3, 4, 50, 60)

  expect(describeBasicApiResult(contract, rect).value).toEqual({
    x: 3,
    y: 4,
    width: 50,
    height: 60,
    left: 3,
    right: 53,
    top: 4,
    bottom: 64
  })
  const malformed = describeBasicApiResult(contract, { x: 3, y: 4 })

  expect(
    operationInputIssue(malformed.value, contract.result.valueSchema)
  ).toBeDefined()
  expect(describeBasicApiResult(contract, null).value).toBeNull()
})

it('converts absent optional read properties to JSON omission without hiding invalid required values', () => {
  const contract = basicApiContracts.find(
    (item) => item.method === 'getVectorAnchorPointAtWorkspacePos'
  )

  if (!contract) {
    throw Error('Missing point contract')
  }

  const point = {
    id: 'point',
    x: 1,
    y: 2,
    type: 'sharp',
    inHandle: null,
    outHandle: null,
    isMove: undefined
  }
  const result = describeBasicApiResult(contract, { point, index: 0 })

  expect(result.value).toEqual({
    point: {
      id: 'point',
      x: 1,
      y: 2,
      type: 'sharp',
      inHandle: null,
      outHandle: null
    },
    index: 0
  })
  expect(
    operationInputIssue(result.value, contract.result.valueSchema)
  ).toBeUndefined()
  expect(Object.hasOwn(point, 'isMove')).toBe(true)
  for (const wrong of [
    { ...point, x: undefined },
    { ...point, isMove: 'true' }
  ]) {
    expect(
      operationInputIssue(
        describeBasicApiResult(contract, { point: wrong, index: 0 }).value,
        contract.result.valueSchema
      )
    ).toBeDefined()
  }
})
