import { validateDesignContextQuery } from '../../common-apis/design-context'
import recordedQuery from '../../../server/__tests__/fixtures/recorded-101/context-query-20261019.json'
import { describe, expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
import {
  documentContextSchema,
  createDocumentContextAction,
  createRegionTargetsAction,
  createDocumentContextReleaseAction
} from '../context-action'
import {
  operationInputIssue,
  nativeToolInputSchema
} from '../../../server/operation-input-schema'

describe('document context action', () => {
  it('forwards a page to the read owner and returns its receipt', async () => {
    const receipt = { available: true, elements: [], nextOffset: null }
    const read = vi.fn(() => receipt)
    const action = createDocumentContextAction(read as never)
    const query = {
      scope: 'children' as const,
      limit: 10,
      delivery: 'page' as const
    }
    const signal = new AbortController().signal
    const result = await action.execute(query, { signal } as never)
    expect(result).toBe(receipt)
    expect(read).toHaveBeenCalledExactlyOnceWith(query, signal)
  })
  it('does not read after cancellation', async () => {
    const read = vi.fn()
    const controller = new AbortController()
    controller.abort()
    await expect(
      createDocumentContextAction(read).execute({ scope: 'selection' }, {
        signal: controller.signal
      } as never)
    ).rejects.toThrow('cancelled')
    expect(read).not.toHaveBeenCalled()
  })
})

it('advertises the same snapshot-only fields to native tools and action admission', () => {
  const schema = createDocumentContextAction().inputSchema
  const valid = {
    scope: 'snapshot',
    snapshotId: 'saved',
    offset: 20,
    limit: 10,
    delivery: 'columns',
    filter: { name: { prefix: 'tier-3-', suffix: '-window' } },
    expectedCount: 24
  }
  for (const definition of [schema, nativeToolInputSchema(schema)]) {
    expect(operationInputIssue(valid, definition)).toBeUndefined()
    expect(operationInputIssue({ scope: 'snapshot' }, definition)).toBeDefined()
    expect(
      operationInputIssue({ ...valid, fields: ['x'] }, definition)
    ).toBeDefined()
    expect(
      operationInputIssue(
        { scope: 'selection', snapshotId: 'saved' },
        definition
      )
    ).toBeDefined()
  }
})

it('defaults AI queries to retained references without transferring rows and preserves explicit pages', async () => {
  const read = vi.fn(() => ({ available: true }))
  const action = createDocumentContextAction(read)
  const signal = new AbortController().signal
  await action.execute({ scope: 'selection' }, { signal })
  expect(read).toHaveBeenLastCalledWith(
    { scope: 'selection', delivery: 'reference' },
    signal
  )
  await action.execute({ scope: 'selection', delivery: 'columns' }, { signal })
  expect(read).toHaveBeenLastCalledWith(
    { scope: 'selection', delivery: 'columns' },
    signal
  )
})

it('separates live query output from explicit release without weakening either input', async () => {
  const read = vi.fn(() => ({ released: true }))
  const query = createDocumentContextAction(read)
  const release = createDocumentContextReleaseAction(read)
  expect(
    operationInputIssue(
      { scope: 'snapshot', snapshotId: 'known', release: true },
      query.inputSchema
    )
  ).toBeDefined()
  expect(
    operationInputIssue({ snapshotId: 'known' }, release.inputSchema)
  ).toBeUndefined()
  expect(release.composition).toBe('control-plane')
  const signal = new AbortController().signal
  expect(await release.execute({ snapshotId: 'known' }, { signal })).toEqual({
    snapshotId: 'known',
    released: true
  })
  expect(read).toHaveBeenCalledExactlyOnceWith(
    { scope: 'snapshot', snapshotId: 'known', release: true },
    signal
  )
})

it('keeps transient and retained contracts disjoint through native conversion', () => {
  const action = createRegionTargetsAction(vi.fn())
  const query = {
    scope: 'region',
    bounds: { x: 0, y: 0, width: 1, height: 1 }
  }
  for (const schema of [
    action.inputSchema,
    nativeToolInputSchema(action.inputSchema)
  ]) {
    expect(operationInputIssue(query, schema)).toBeUndefined()
    for (const patch of [
      { allMatches: false },
      { result: 'elements' },
      { offset: 0 },
      { fields: ['x'] },
      { scope: 'snapshot', snapshotId: 'saved' }
    ])
      expect(operationInputIssue({ ...query, ...patch }, schema)).toBeDefined()
  }
  const result = {
    delivery: 'transient',
    available: true,
    coordinateSpace: 'parent-local',
    total: 1,
    elementIds: ['a'],
    missingIds: [],
    elements: [],
    nextOffset: null
  }
  expect(operationInputIssue(result, action.outputSchema)).toBeUndefined()
  expect(
    operationInputIssue(
      { ...result, snapshotId: 'fake', leaseId: 'fake' },
      action.outputSchema
    )
  ).toBeDefined()
  const { delivery: _delivery, ...withoutMode } = result
  expect(operationInputIssue(withoutMode, action.outputSchema)).toBeDefined()
})

it('advertises scope-correct selectors and complete result constraints in both contracts', () => {
  const valid = [
    { scope: 'selection' },
    { scope: 'children', parentId: 'p', delivery: 'page', fields: ['x'] },
    { scope: 'ids', elementIds: ['a'], result: 'ids', fields: [] },
    {
      scope: 'region',
      bounds: { x: -1, y: 0, width: 10, height: 10 },
      filter: { type: 'group' }
    },
    {
      scope: 'region',
      bounds: { x: 0, y: 0, width: 10, height: 10 },
      result: 'ids',
      allMatches: true
    },
    { scope: 'snapshot', snapshotId: 's', filter: { type: 'group' } }
  ]
  const invalid = [
    recordedQuery,
    { scope: 'ids' },
    { scope: 'region' },
    { scope: 'selection', elementIds: ['a'] },
    { scope: 'children', bounds: { x: 0, y: 0, width: 1, height: 1 } },
    { scope: 'selection', parentId: 'p' },
    { scope: 'selection', result: 'ids', fields: ['x'] },
    { ...valid[4], limit: 1 },
    { ...valid[4], result: 'elements' }
  ]
  const schema = createDocumentContextAction().inputSchema
  for (const definition of [schema, nativeToolInputSchema(schema)]) {
    for (const query of valid)
      expect(
        operationInputIssue(query, definition),
        JSON.stringify(query)
      ).toBeUndefined()
    for (const query of invalid)
      expect(
        operationInputIssue(query, definition),
        JSON.stringify(query)
      ).toBeDefined()
  }
})

it('preserves canonical scope, result and page admission through native schema conversion', () => {
  const native = nativeToolInputSchema(documentContextSchema)
  for (const selector of [
    { scope: 'selection' },
    { scope: 'children', parentId: 'parent' },
    { scope: 'ids', elementIds: ['part'] },
    { scope: 'region', bounds: { x: 0, y: 0, width: 10, height: 10 } }
  ]) {
    for (const result of [undefined, 'elements', 'ids'])
      for (const fields of [undefined, [], ['x']])
        for (const allMatches of [undefined, false, true])
          for (const page of [{}, { offset: 0, limit: 1 }, { offset: -1 }]) {
            const query = {
              ...selector,
              ...page,
              ...(result === undefined ? {} : { result }),
              ...(fields === undefined ? {} : { fields }),
              ...(allMatches === undefined ? {} : { allMatches })
            }
            let accepted = true
            try {
              validateDesignContextQuery(query as never)
            } catch {
              accepted = false
            }
            for (const schema of [documentContextSchema, native])
              expect(
                operationInputIssue(query, schema) === undefined,
                JSON.stringify(query)
              ).toBe(accepted)
          }
  }
})
