import { expect, it, vi } from 'vitest'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import prior from './fixtures/recorded-101/complete-result-cost-20261029.json'
import * as contracts from '../../src/ai/tool-contract'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalOperationTools } from '../local-operation-tools'
import { AiActionNames } from '../../src/constants/ai-actions'
import { readCompleteInformation } from './tool-contract-assertions'

it('compares complete model result contracts against the same owner declarations with internal fields included', async () => {
  const original = contracts.modelToolResultSchemas
  const complete = JSON.parse(JSON.stringify(prior))
  complete.source =
    'Deterministic complete owner schemas before model field selection; internal fields included. No model execution.'
  for (const source of Object.keys(complete.sources))
    complete.sources[source] = createHash('sha256')
      .update(readFileSync(resolve(source)))
      .digest('hex')
  const cases = {
    ...prior.entries,
    vector: {
      ...prior.entries.draft,
      query: {
        ...prior.entries.draft.query,
        inputScope: { operation: 'draft', nodeTypes: ['vector'] }
      }
    }
  }
  for (const [key, entry] of Object.entries(cases)) {
    const sizes: number[] = []
    const acquisition: {
      body: number
      wire: number
      pages: number
      input: number
    }[] = []
    for (const baseline of [true, false]) {
      const project = vi.spyOn(contracts, 'modelToolResultSchemas')
      if (baseline)
        project.mockImplementation((contract, stage) =>
          original(
            JSON.parse(JSON.stringify(contract), (key, value) =>
              key === 'x-model-visibility' ? undefined : value
            ),
            stage
          )
        )
      try {
        const actions = [
          AiActionNames.APPLY_PREPARED_DESIGN,
          AiActionNames.INSPECT_DRAWING
        ].map((name) => ({ name, description: name, inputSchema: {} }))
        const designs = createLocalDesignTools(actions)
        const execute = vi.fn(async () => ({ context: {}, actionResults: [] }))
        const operations = createLocalOperationTools(
          actions,
          designs,
          execute,
          {
            getNativeTools: () =>
              [...workflow.definitions, ...operations.definitions].map(
                (definition) => ({ ...definition, namespace: 'design' })
              )
          }
        )
        const workflow = createLocalDesignWorkflow(designs, operations)
        let wire = 0
        let pages = 0
        let input = 0
        const text = await readCompleteInformation(async (args) => {
          input += Buffer.byteLength(JSON.stringify(args))
          const reply = await operations.call(
            'describe_design_apis',
            args,
            new AbortController().signal
          )
          wire += Buffer.byteLength(reply)
          pages++
          return reply
        }, entry.query)
        acquisition.push({ body: Buffer.byteLength(text), wire, pages, input })
        const body = JSON.parse(text)
        const selected = [...(body.tools ?? []), ...(body.apis ?? [])][0]
        expect(selected, text).toBeDefined()
        const resultSchema = selected.usageGuide.results
        const serialized = JSON.stringify(resultSchema)
        sizes.push(Buffer.byteLength(serialized))
        if (baseline)
          complete.entries[key] = {
            query: entry.query,
            resultSchema,
            cost: {
              plain: Buffer.byteLength(serialized),
              fragmented: Buffer.byteLength(JSON.stringify(serialized)) - 2
            }
          }
        expect(execute).not.toHaveBeenCalled()
        expect(serialized).toContain('settlement')
        expect(serialized).toContain('partial')
      } finally {
        project.mockRestore()
      }
    }
    expect(sizes[1], key).toBeLessThan(sizes[0])
    expect(acquisition[1].body, key).toBeLessThan(acquisition[0].body)
    expect(acquisition[1].wire + acquisition[1].input, key).toBeLessThan(
      acquisition[0].wire + acquisition[0].input
    )
    expect(acquisition[1].pages, key).toBeLessThanOrEqual(acquisition[0].pages)
    process.stdout.write(
      JSON.stringify({
        measurement: 'complete-model-delivery',
        key,
        baseline: acquisition[0],
        candidate: acquisition[1]
      }) + '\n'
    )
  }
  if (process.env.TOOL_DELIVERY_COST_REPORT === '1')
    writeFileSync(
      resolve('tmp/model-delivery-complete-baseline.json'),
      JSON.stringify(complete, null, 2) + '\n'
    )
})
