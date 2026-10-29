import completeResultCost from './fixtures/recorded-101/complete-result-cost-20261029.json'
import { appendFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, expect } from 'vitest'
import {
  createAiToolContract,
  inspectAiToolResult
} from '@asyra/ai-agent-runtime'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { AiImageToolIds, AiReferenceToolIds } from '../ai-domain-prompt'
import {
  operationContractIssue,
  operationInputIssue
} from '../operation-input-schema'
import {
  invokeLocalTool,
  localToolOutcome,
  type LocalToolOwner,
  type LocalToolDefinition
} from '../local-tool-invocation'

const nativeNames = new Set<string>([
  ...Object.values(AiDesignToolIds),
  ...Object.values(AiImageToolIds),
  ...Object.values(AiReferenceToolIds)
])
const advertised = new Set<string>()
const exercised = new Set<string>()

// Each owner suite must execute every native contract it advertises. The tests
// retain their domain-specific assertions; this only detects omitted tools.
afterAll(() => {
  expect([...advertised].filter((name) => !exercised.has(name))).toEqual([])
})

/** Exercise owner fixtures through the exact public admission/result boundary. */
export const withToolContractAssertions = <
  T extends LocalToolOwner & { definitions: LocalToolDefinition[] }
>(
  owner: T
): T => {
  for (const definition of owner.definitions)
    if (nativeNames.has(definition.name)) advertised.add(definition.name)
  const call = (owner.callInternal ?? owner.call).bind(owner)
  const checked = new Set<string>()
  owner.call = async (name, input, signal) => {
    const definition = owner.definitions.find((tool) => tool.name === name)
    const admitted =
      definition && !operationInputIssue(input, definition.inputSchema)
    // Internal and deliberate guard probes still exercise the owner directly.
    if (!definition || !admitted || signal.aborted) {
      const text = await call(name, input, signal)
      const value = JSON.parse(text)
      const outcome =
        owner.resultOutcome?.(name, value) ?? localToolOutcome(value)
      if (definition && ['success', 'partial'].includes(outcome.status)) {
        expect(
          operationInputIssue(input, definition.inputSchema),
          `${name} direct input`
        ).toBeUndefined()
        const inspected = inspectAiToolResult(
          createAiToolContract(definition),
          value,
          { outcome, validate: operationContractIssue }
        )
        expect(
          inspected.status === 'invalid' ? inspected.issue : undefined,
          `${name} direct output`
        ).toBeUndefined()
      }
      return text
    }
    let calls = 0
    let original: string | undefined
    let originalError: unknown
    let ownerFailed = false
    const boundaryOwner: LocalToolOwner = {
      ...owner,
      callInternal: undefined,
      call: async (...args) => {
        calls++
        try {
          original = await call(...args)
          return original
        } catch (error) {
          ownerFailed = true
          originalError = error
          throw error
        }
      }
    }
    if (!checked.has(name)) {
      const rejected = await invokeLocalTool(
        boundaryOwner,
        definition,
        null,
        signal
      )
      expect(rejected.success, `${name} malformed input`).toBe(false)
      expect(JSON.parse(rejected.text).settlement).toBe('not-started')
      await expect(
        invokeLocalTool(boundaryOwner, definition, input, AbortSignal.abort())
      ).rejects.toThrow()
      expect(calls, `${name} rejected/cancelled owner calls`).toBe(0)
      for (const failure of ['exception', 'invalid-output'] as const) {
        let failedCalls = 0
        const failed = await invokeLocalTool(
          {
            ...boundaryOwner,
            call: async () => {
              failedCalls++
              if (failure === 'exception')
                throw new Error('Owner failed before returning a receipt')
              return 'null'
            }
          },
          definition,
          input,
          signal
        )
        expect(failed.success, `${name} ${failure} cannot report success`).toBe(
          false
        )
        expect(failedCalls, `${name} ${failure} cannot replay`).toBe(1)
        expect(JSON.parse(failed.text).toolOutcome.status).not.toBe('success')
      }
      checked.add(name)
    }
    const reply = await invokeLocalTool(
      boundaryOwner,
      definition,
      input,
      signal
    )
    expect(calls, `${name} canonical dispatch count`).toBe(1)
    // Preserve direct-owner error semantics for existing domain guard assertions.
    if (ownerFailed) {
      expect(reply.success, `${name} rejected public result`).toBe(false)
      expect(
        JSON.parse(reply.text).recoverable,
        `${name} recovery receipt`
      ).toBe(true)
      throw originalError
    }
    expect(original, `${name} owner response`).toBeDefined()
    if (original === undefined) throw new Error(`${name} omitted its response`)
    const value = JSON.parse(original)
    const outcome =
      owner.resultOutcome?.(name, value) ?? localToolOutcome(value)
    if (outcome.status === 'success' || outcome.status === 'partial') {
      const contract = createAiToolContract(definition)
      const inspected = inspectAiToolResult(contract, value, {
        outcome,
        validate: operationContractIssue
      })
      expect(
        inspected.status === 'invalid' ? inspected.issue : undefined,
        `${name} output`
      ).toBeUndefined()
      expect(
        JSON.parse(reply.text).toolOutcome.status,
        `${name} public result`
      ).toBe(outcome.status)
      if (outcome.status === 'success') exercised.add(name)
    }
    if (!owner.projectModelResult) return original
    const beforeProjection = JSON.stringify(value)
    const projected = owner.projectModelResult(name, input, value)
    expect(
      JSON.stringify(value),
      `${name} projection preserves owner receipt`
    ).toBe(beforeProjection)
    const deliveredOutcome =
      owner.resultOutcome?.(name, projected) ?? localToolOutcome(projected)
    expect(
      deliveredOutcome.settlement,
      `${name} delivery preserves mutation settlement`
    ).toBe(outcome.settlement)
    if (outcome.status !== 'success')
      expect(
        deliveredOutcome.status,
        `${name} delivery cannot promote incomplete owner work`
      ).not.toBe('success')
    return JSON.stringify(projected)
  }
  return owner
}

/** Optional test evidence: account for complete acquisition, never change delivery. */
export const recordAcquisitionCost = (
  input: unknown,
  text: string,
  pages: number[]
) => {
  if (process.env.TOOL_DELIVERY_COST_REPORT !== '1') return
  const value = JSON.parse(text) as {
    apis?: Record<string, unknown>[]
    tools?: Record<string, unknown>[]
  }
  const entries = [...(value.apis ?? []), ...(value.tools ?? [])].map(
    (entry) => {
      const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value))
      const sections = (value: Record<string, unknown>) =>
        Object.fromEntries(
          Object.entries(value).map(([key, child]) => [key, bytes(child)])
        )
      return {
        name: entry.registeredName ?? entry.name,
        bytes: bytes(entry),
        sections: sections(entry),
        ...(entry.usageGuide
          ? { guide: sections(entry.usageGuide as Record<string, unknown>) }
          : {})
      }
    }
  )
  if (!entries.length) return
  const directory = resolve('tmp')
  mkdirSync(directory, { recursive: true })
  appendFileSync(
    resolve(directory, 'tool-delivery-cost-attribution.jsonl'),
    JSON.stringify({
      test: expect.getState().currentTestName,
      input,
      bodyBytes: Buffer.byteLength(text),
      wireBytes: pages.length ? pages.reduce((a, b) => a + b, 0) : null,
      pages,
      entries
    }) + '\n'
  )
}

/** A consumer follows published continuations before using the complete contract. */
export const readCompleteInformation = async (
  call: (input: unknown) => Promise<string>,
  input: unknown
): Promise<string> => {
  let raw = await call(input)
  const pages: number[] = []
  let text = ''
  let offset = 0
  let revision: string | undefined
  for (let count = 0; count < 256; count++) {
    pages.push(Buffer.byteLength(raw))
    const page = JSON.parse(raw).contentDelivery
    if (!page) {
      expect(offset).toBe(0)
      recordAcquisitionCost(input, raw, pages)
      return raw
    }
    expect(Buffer.byteLength(raw)).toBeLessThanOrEqual(24000)
    expect(page.startByte).toBe(offset)
    revision ??= page.revision
    expect(page.revision).toBe(revision)
    text += page.text
    offset += Buffer.byteLength(page.text)
    expect(page.endByte).toBe(offset)
    if (page.lastPage) {
      expect(offset).toBe(page.totalBytes)
      expect(page.next).toBeNull()
      JSON.parse(text)
      recordAcquisitionCost(input, text, pages)
      return text
    }
    raw = await call(page.next.arguments)
  }
  throw new Error('Information continuation did not terminate')
}

/** Frozen result-contract delta; candidate growth cannot enlarge its own budget. */
export const completeUsageBudget = (
  historicalBytes: number,
  reference: keyof typeof completeResultCost.entries,
  fragmented = false
) =>
  historicalBytes +
  completeResultCost.entries[reference].cost[
    fragmented ? 'fragmented' : 'plain'
  ]
