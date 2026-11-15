import completeResultCost from './fixtures/recorded-101/complete-model-result-cost-20261029.json'
import { appendFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'vitest'

/** Optional test evidence: account for complete acquisition, never change delivery. */
export const recordAcquisitionCost = (
  input: unknown,
  text: string,
  pages: number[]
) => {
  if (process.env.TOOL_DELIVERY_COST_REPORT !== '1') {
    return
  }

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
          ? {
              guide: sections(entry.usageGuide as Record<string, unknown>),
              resultSchema: (entry.usageGuide as Record<string, unknown>)
                .results,
              parameters: (entry.usageGuide as Record<string, unknown>)
                .parameters
            }
          : {})
      }
    }
  )

  if (!entries.length) {
    return
  }

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
  call: (input: unknown, tool: string) => Promise<string>,
  input: unknown,
  tool: string
): Promise<string> => {
  let raw = await call(input, tool)
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

    expect(typeof page.next?.tool).toBe('string')
    raw = await call(page.next.arguments, page.next.tool)
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

/** Leaf-owner tests unwrap the delivered host envelope; host integration proves actual routing. */
export function ownerInvocation<
  T extends { namespace?: string; tool: string; arguments: unknown }
>(invocation: T | undefined): T {
  if (!invocation) {
    throw Error('Missing delivered invocation')
  }

  if (invocation.tool !== 'execute_design') {
    return invocation
  }

  const args = invocation.arguments as {
    operations: { name: string; arguments: unknown }[]
  }

  if (args.operations.length !== 1) {
    throw Error('Expected one owner operation')
  }

  const operation = args.operations[0]
  const [namespace, tool] = operation.name.split('.')

  if (!namespace || !tool) {
    throw Error('Expected qualified owner operation')
  }

  return { ...invocation, namespace, tool, arguments: operation.arguments }
}
