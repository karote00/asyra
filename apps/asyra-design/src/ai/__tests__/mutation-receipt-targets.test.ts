import { expect, it, vi } from 'vitest'
import { createBasicApiActions } from '../basic-api-actions'
import { basicApiContracts } from '../basic-api-catalog'
import { defineBasicApi } from '../basic-api-contracts'
import { createRetainedDesignContext } from '../../common-apis/retained-design-context'
import core from '../../contexts'

// Independent owner semantics: source rows and point IDs are not mutated elements.
const scalarMethods = [
  'element.setElementLock',
  'element.toggleElementLock',
  'element.toggleElementVisible',
  'element.resetElementSize',
  'element.changeElementGeometry',
  'fill.updateGradientHandleAtClientPosition',
  'stroke.addStroke',
  'stroke.removeStroke',
  'element.updateVectorAnchorPointPosition',
  'element.updateVectorAnchorPointType',
  'element.setVectorAnchorPointHandleMode',
  'element.updateVectorAnchorPointHandlePosition',
  'element.updateVectorAnchorPointHandles',
  'element.appendVectorAnchorPoint',
  'element.connectVectorAnchorEndpoints',
  'element.connectVectorAnchorPoints',
  'element.removeLastSinglePointSubpath',
  'element.removeVectorAnchorPoint',
  'element.splitVectorSegmentAtWorkspacePos',
  'element.setVectorClosed',
  'element.scaleVectorElementAroundCenter'
]
const requests: {
  operation: string
  input: Record<string, unknown>
  ids: string[]
}[] = [
  ...scalarMethods.map((operation) => ({
    operation,
    input: { elementId: 'a' },
    ids: ['a']
  })),
  ...[
    'fill.addFills',
    'fill.updateFillsAtIndex',
    'fill.detachFillsAtIndex'
  ].map((operation) => ({
    operation,
    input: { elementIds: ['a', 'b'] },
    ids: ['a', 'b']
  })),
  {
    operation: 'fill.shareFillAtIndex',
    input: { sourceElementId: 'source', elementIds: ['source', 'a', 'b'] },
    ids: ['a', 'b']
  },
  {
    operation: 'element.setElementPositions',
    input: { positionsById: { a: { x: 0, y: 0 }, b: { x: 2, y: 3 } } },
    ids: ['a', 'b']
  },
  {
    operation: 'fill.removeFills',
    input: {
      targets: [
        { elementId: 'a', fillId: 'f1' },
        { elementId: 'a', fillId: 'f2' },
        { elementId: 'b', fillId: 'f3' }
      ]
    },
    ids: ['a', 'b']
  },
  ...[
    'fill.updateFillFieldsBatch',
    'stroke.updateStrokeFieldsBatch',
    'element.setVectorElementPositions'
  ].map((operation) => ({
    operation,
    input: {
      updates: [{ elementId: 'a' }, { elementId: 'a' }, { elementId: 'b' }]
    },
    ids: ['a', 'b']
  }))
]

it('covers every registered receipt identity owner including generated vector identities', () => {
  expect(
    basicApiContracts
      .filter((c) => c.result.kind === 'mutation-receipt')
      .map((c) => c.operation)
      .sort()
  ).toEqual(
    [
      ...requests.map((c) => c.operation),
      'element.createVectorElementFromSinglePoint'
    ].sort()
  )
})

for (const { operation, input, ids } of requests) {
  it(`validates ${operation} targets before retention or projection`, async () => {
    const contract = basicApiContracts.find((c) => c.operation === operation)

    if (!contract) {
      throw new Error('Missing declared operation')
    }

    const owner = vi.fn()
    const queries = createRetainedDesignContext(core, () => () => undefined)

    queries.retainReceipt = vi.fn<typeof queries.retainReceipt>(() => ({
      snapshotId: crypto.randomUUID(),
      leaseId: 'lease',
      total: ids.length
    }))
    const action = createBasicApiActions(
      () => ({
        core: {},
        element: {},
        fill: {},
        stroke: {},
        hierarchy: {},
        viewport: {},
        selection: {},
        [contract.owner]: { [contract.method]: owner }
      }),
      {
        observe: () => () => undefined,

        resolve: () => 'live'
      },
      queries
    ).find((a) => a.name === contract.name)

    if (!action) {
      throw new Error('Missing action')
    }

    const context = {
      signal: new AbortController().signal,

      runMutation: async <T>(write: () => T, settled?: (value: T) => void) => {
        const value = write()

        settled?.(value)

        return value
      }
    }

    for (const receipt of [
      {
        value: null,
        acceptedIds: ['foreign'],
        unavailableIds: [],
        changed: true
      },
      {
        value: null,
        acceptedIds: ids,
        unavailableIds: [ids[0]],
        changed: true
      },
      {
        value: null,
        acceptedIds: ids.slice(1),
        unavailableIds: [],
        changed: false
      },
      {
        value: null,
        acceptedIds: [...ids, ids[0]],
        unavailableIds: [],
        changed: true
      }
    ]) {
      owner.mockReturnValueOnce(receipt)
      const result = await action.execute(input, context)

      expect(result).toMatchObject({
        status: 'failed',
        code: 'OWNER_RESULT_INVALID',
        settlement: 'completed',
        value: receipt
      })
      expect(queries.retainReceipt).not.toHaveBeenCalled()
    }

    for (const changed of [false, true]) {
      owner.mockReturnValueOnce({
        value: null,
        acceptedIds: ids,
        unavailableIds: [],
        changed
      })
      expect(await action.execute(input, context)).toMatchObject({
        status: changed ? 'complete' : 'no-change',
        acceptedIds: ids,
        modelResult: {
          status: changed ? 'complete' : 'no-change',
          acceptedCount: ids.length,
          unavailableCount: 0
        }
      })
    }

    owner.mockReturnValueOnce({
      value: null,
      acceptedIds: ids.slice(1),
      unavailableIds: [ids[0]],
      changed: ids.length > 1
    })
    expect(await action.execute(input, context)).toMatchObject({
      status: ids.length > 1 ? 'partial' : 'failed',
      acceptedIds: ids.slice(1),
      unavailableIds: [ids[0]]
    })
    expect(owner).toHaveBeenCalledTimes(7)
    queries.dispose()
  })
}

it('validates generated vector identities without confusing the authored point with its new element', async () => {
  const owner = vi.fn()
  const action = createBasicApiActions(() => ({
    core: {},
    element: { createVectorElementFromSinglePoint: owner },
    fill: {},
    stroke: {},
    hierarchy: {},
    viewport: {},
    selection: {}
  })).find((a) => a.name === 'api_element_createVectorElementFromSinglePoint')

  if (!action) {
    throw new Error('Missing creation action')
  }

  const input = { pointId: 'point', position: { x: 0, y: 0 } }
  const context = { signal: new AbortController().signal }

  for (const receipt of [
    { value: null, acceptedIds: ['point'], unavailableIds: [], changed: false },
    {
      value: 'created',
      acceptedIds: ['foreign'],
      unavailableIds: [],
      changed: true
    },
    {
      value: 'created',
      acceptedIds: ['created'],
      unavailableIds: [],
      changed: false
    },
    {
      value: null,
      acceptedIds: [],
      unavailableIds: ['foreign'],
      changed: false
    }
  ]) {
    owner.mockReturnValueOnce(receipt)
    expect(await action.execute(input, context)).toMatchObject({
      status: 'failed',
      code: 'OWNER_RESULT_INVALID'
    })
  }

  owner.mockReturnValueOnce({
    value: 'created',
    acceptedIds: ['created'],
    unavailableIds: [],
    changed: true
  })
  expect(await action.execute(input, context)).toMatchObject({
    status: 'complete',
    value: 'created',
    acceptedIds: ['created']
  })
  owner.mockReturnValueOnce({
    value: null,
    acceptedIds: [],
    unavailableIds: ['point'],
    changed: false
  })
  expect(await action.execute(input, context)).toMatchObject({
    status: 'failed',
    value: null,
    unavailableIds: ['point']
  })
})

it.each([
  { operation: 'fill.addFills', input: { elementIds: [] } },
  {
    operation: 'fill.shareFillAtIndex',
    input: { sourceElementId: 'source', elementIds: ['source'] }
  },
  { operation: 'element.setElementPositions', input: { positionsById: {} } },
  { operation: 'fill.updateFillFieldsBatch', input: { updates: [] } }
])(
  'preserves empty accepted membership for $operation',
  async ({ operation, input }) => {
    const contract = basicApiContracts.find((c) => c.operation === operation)

    if (!contract) {
      throw Error('Missing receipt owner')
    }

    const owner = vi.fn(() => ({
      value: null,
      acceptedIds: [],
      unavailableIds: [],
      changed: false
    }))
    const action = createBasicApiActions(() => ({
      core: {},
      element: {},
      fill: {},
      stroke: {},
      hierarchy: {},
      viewport: {},
      selection: {},
      [contract.owner]: { [contract.method]: owner }
    })).find((a) => a.name === contract.name)

    if (!action) {
      throw Error('Missing action')
    }

    expect(
      await action.execute(input, { signal: new AbortController().signal })
    ).toMatchObject({
      status: 'no-change',
      acceptedIds: [],
      unavailableIds: [],
      changed: false
    })
  }
)

it('rejects receipt declarations without an owned target input', () => {
  for (const resultTargets of [
    undefined,
    { kind: 'id' as const, parameter: 'missing' }
  ]) {
    expect(() =>
      defineBasicApi({
        owner: 'element',
        method: 'setElementLock',
        effect: 'write',
        resultKind: 'mutation-receipt',
        parameters: [{ name: 'elementId', schema: { type: 'string' } }],
        resultTargets
      })
    ).toThrow('canonical target input')
  }
})
