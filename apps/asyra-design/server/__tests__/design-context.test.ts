import { expect, it, vi } from 'vitest'
import {
  createLocalDesignContext,
  designContextDefinitions
} from '../local-design-context'
import {
  nativeToolInputSchema,
  operationInputIssue
} from '../operation-input-schema'
import { AiDesignToolIds } from '../../src/constants/ai-design'

const signal = () => new AbortController().signal
const facts = AiDesignToolIds.RECORD_DESIGN_FACTS
const calculations = AiDesignToolIds.RECORD_DESIGN_CALCULATIONS
const references = AiDesignToolIds.SELECT_DESIGN_REFERENCES

it('stores and replaces standalone numeric context without prior facts or drawing', async () => {
  const owner = createLocalDesignContext({})
  await owner.call(
    calculations,
    { calculations: [{ id: 'pitch', value: 8, unit: 'px' }] },
    signal()
  )
  const updated = await owner.call(
    calculations,
    { calculations: [{ id: 'pitch', value: 12, unit: 'px' }] },
    signal()
  )
  expect(updated).toEqual({
    calculations: [{ id: 'pitch', value: 12, unit: 'px' }]
  })
  expect(await owner.call(calculations, {}, signal())).toEqual(updated)
})

it('stores source assertions as authored data with optional attribution', async () => {
  const resolveSources = vi.fn((sources: string[]) =>
    sources.map((source) =>
      source === 'attachment:0' ? 'reference:known' : source
    )
  )
  const owner = createLocalDesignContext({ resolveSources })
  const input = {
    facts: [
      {
        id: 'view',
        statement: 'The left surface is visible.',
        sources: ['attachment:0']
      }
    ]
  }
  const result = await owner.call(facts, input, signal())
  expect(result).toEqual({
    facts: [{ ...input.facts[0], sources: ['reference:known'] }]
  })
  expect(input.facts[0].sources).toEqual(['attachment:0'])
  expect(resolveSources).toHaveBeenCalledTimes(1)
  expect(await owner.call(facts, {}, signal())).toEqual(result)
  expect(resolveSources).toHaveBeenCalledTimes(1)
})

it('rejects invalid note updates atomically and returns detached values', async () => {
  const owner = createLocalDesignContext({})
  await owner.call(
    facts,
    { facts: [{ id: 'first', statement: 'Original' }] },
    signal()
  )
  await expect(
    owner.call(
      facts,
      { facts: [{ id: 'first', statement: 'Changed' }, { id: 'broken' }] },
      signal()
    )
  ).rejects.toThrow()
  await expect(
    owner.call(
      facts,
      {
        facts: [
          { id: 'first', statement: 'A' },
          { id: 'first', statement: 'B' }
        ]
      },
      signal()
    )
  ).rejects.toThrow('unique')
  const value = (await owner.call(facts, {}, signal())) as {
    facts: { statement: string }[]
  }
  value.facts[0].statement = 'Foreign change'
  expect(await owner.call(facts, {}, signal())).toEqual({
    facts: [{ id: 'first', statement: 'Original' }]
  })
})

it('does not publish a prefix when source identity resolution fails', async () => {
  const owner = createLocalDesignContext({
    resolveSources: (sources) => {
      if (sources.includes('attachment:missing'))
        throw new Error('Unknown attachment')
      return sources
    }
  })
  await expect(
    owner.call(
      facts,
      {
        facts: [
          { id: 'good', statement: 'One' },
          { id: 'bad', statement: 'Two', sources: ['attachment:missing'] }
        ]
      },
      signal()
    )
  ).rejects.toThrow('Unknown attachment')
  expect(await owner.call(facts, {}, signal())).toEqual({ facts: [] })
})

it('reuses decoded reference bounds and never requires a suitability receipt', async () => {
  let decoded = false
  const prepareReferences = vi.fn(async () => {
    decoded = true
    return '{}'
  })
  const owner = createLocalDesignContext({
    validateReferences: (indexes) =>
      indexes.map((attachmentIndex) => ({
        attachmentIndex,
        referenceId: 'reference:known',
        ...(decoded ? { validation: { width: 100, height: 80 } } : {})
      })),
    prepareReferences
  })
  expect(
    await owner.call(references, { referenceImageIndexes: [0] }, signal())
  ).toEqual({
    referenceImageIndexes: [0],
    references: [{ referenceId: 'reference:known' }]
  })
  expect(prepareReferences).not.toHaveBeenCalled()
  const input = {
    referenceImageIndexes: [0],
    references: [
      {
        referenceId: 'reference:known',
        purpose: 'Surface shape',
        region: { x: 10, y: 20, width: 30, height: 40 },
        limitations: ['Coarse detail']
      }
    ]
  }
  expect(await owner.call(references, input, signal())).toEqual(input)
  expect(await owner.call(references, input, signal())).toEqual(input)
  expect(prepareReferences).toHaveBeenCalledTimes(1)
})

it('rejects unknown sources and out-of-bounds crops without replacing prior notes', async () => {
  const owner = createLocalDesignContext({
    validateReferences: () => [
      {
        attachmentIndex: 0,
        referenceId: 'reference:known',
        validation: { width: 100, height: 80 }
      }
    ]
  })
  await owner.call(
    references,
    {
      referenceImageIndexes: [0],
      references: [{ referenceId: 'reference:known', purpose: 'Original' }]
    },
    signal()
  )
  for (const note of [
    { referenceId: 'foreign', purpose: 'Wrong source' },
    {
      referenceId: 'reference:known',
      region: { x: 90, y: 0, width: 20, height: 10 }
    }
  ])
    await expect(
      owner.call(
        references,
        { referenceImageIndexes: [0], references: [note] },
        signal()
      )
    ).rejects.toThrow()
  expect(
    await owner.call(references, { referenceImageIndexes: [0] }, signal())
  ).toMatchObject({ references: [{ purpose: 'Original' }] })
})

it('does not retain source notes when decoding is cancelled', async () => {
  const controller = new AbortController()
  const owner = createLocalDesignContext({
    validateReferences: () => [
      { attachmentIndex: 0, referenceId: 'reference:known' }
    ],
    prepareReferences: async () => {
      controller.abort(new Error('Cancelled'))
      return '{}'
    }
  })
  await expect(
    owner.call(
      references,
      {
        referenceImageIndexes: [0],
        references: [
          {
            referenceId: 'reference:known',
            purpose: 'Uncommitted',
            region: { x: 0, y: 0, width: 2, height: 2 }
          }
        ]
      },
      controller.signal
    )
  ).rejects.toThrow('Cancelled')
  expect(
    await owner.call(references, { referenceImageIndexes: [0] }, signal())
  ).toMatchObject({ references: [{ referenceId: 'reference:known' }] })
  expect(
    JSON.stringify(
      await owner.call(references, { referenceImageIndexes: [0] }, signal())
    )
  ).not.toContain('Uncommitted')
})

it('publishes the same strict note contracts to native invocation', async () => {
  const owner = createLocalDesignContext({ validateReferences: () => [] })
  const inputs = new Map<string, unknown>([
    [facts, { facts: [{ id: 'a', statement: 'A' }] }],
    [calculations, { calculations: [{ id: 'v', value: 1, unit: 'px' }] }],
    [references, { referenceImageIndexes: [] }]
  ])
  for (const definition of designContextDefinitions) {
    const input = inputs.get(definition.name)
    expect(operationInputIssue(input, definition.inputSchema)).toBeUndefined()
    expect(
      operationInputIssue(input, nativeToolInputSchema(definition.inputSchema))
    ).toBeUndefined()
    const result = await owner.call(definition.name, input, signal())
    expect(operationInputIssue(result, definition.outputSchema)).toBeUndefined()
    expect(
      operationInputIssue(
        { ...(input as object), requirementRevision: 1 },
        definition.inputSchema
      )
    ).toBeTruthy()
  }
})


it('rejects a reference identity changed during pixel comparison without publishing a pass', async () => {
  const { default: sharp } = await import('sharp')
  const { createLocalImageCheck } = await import('../local-image-check')
  const { createDesignCheckResults } = await import('../design-check-results')
  const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'white' } }).png().toBuffer()
  const dataUrl = 'data:image/png;base64,' + bytes.toString('base64')
  const results = createDesignCheckResults()
  let currentReference = 'original'
  let validations = 0
  const owner = createLocalImageCheck({ results,
    inspection: () => ({ target: 'part', dataUrl, imageScope: 'region', background: '#ffffff', region: { x: 0, y: 0, width: 2, height: 2 } }),
    validate: async () => { if (++validations === 2) currentReference = 'changed'; return true },
    reference: () => ({ referenceId: currentReference, dataUrl })
  })
  await expect(owner.call({ checkId: 'color', inspectionId: 'capture', referenceImageIndex: 0,
    referenceRegion: { x: 0, y: 0, width: 2, height: 2 }, channelTolerance: 0, maxDifferentFraction: 0
  }, signal())).rejects.toThrow(/changed/)
  expect(results.read({ includePassed: true }).items).toEqual([])
})

it('keeps source-owner failures distinct from correctable authored context inputs', async () => {
  const { createLocalOperationTools } = await import('../local-operation-tools')
  const { invokeLocalTool } = await import('../local-tool-invocation')
  const owner = createLocalOperationTools([], { modelActions: (v) => v, resolveBatch: (v) => v }, vi.fn(), {
    resolveSources: () => { throw Error('Source owner unavailable') }
  })
  const definition = owner.definitions.find((tool) => tool.name === facts)!
  const invalid = await invokeLocalTool(owner, definition, { facts: [{ id: 'a' }] }, signal())
  expect(JSON.parse(invalid.text).recovery).toBe('correct_input')
  const failed = await invokeLocalTool(owner, definition, { facts: [{ id: 'a', statement: 'Assertion', sources: ['source'] }] }, signal())
  expect(failed.success).toBe(false)
  expect(JSON.parse(failed.text).recovery).not.toBe('correct_input')
  expect(await owner.call(facts, {}, signal())).toContain('"facts":[]')
})
