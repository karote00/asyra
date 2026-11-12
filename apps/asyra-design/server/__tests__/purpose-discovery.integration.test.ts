// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createAiRuntimeInput } from '../../src/ai/runtime-input'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { invokeLocalTool } from '../local-tool-invocation'
import {
  nativeToolInputSchema,
  operationInputIssue
} from '../operation-input-schema'
import recorded from '../../test-data/ai-drawing/fixtures/position-discovery-20261109.json'

interface Candidate {
  name: string
  operation: string
  rank: number
  capability: { purpose: string; boundaries: string[]; inputFields: string[] }
  match: { inputFields: Record<string, string[]> }
}
const cleanup: (() => unknown)[] = []

afterEach(async () => {
  for (const release of cleanup.splice(0)) {
    await release()
  }
})

const setup = () => {
  const runtime = createAiRuntimeInput({
    permissionRules: {},
    provider: { requestActionBatch: vi.fn() }
  })

  cleanup.push(() =>
    Promise.all(
      (runtime.ownedResources ?? []).map((resource) => resource.dispose())
    )
  )
  const actions = runtime.actionDefinitions.map(createAiToolContract)
  const designs = createLocalDesignTools(actions)
  const operations = createLocalOperationTools(actions, designs, vi.fn(), {
    getNativeTools: () =>
      owners.flatMap((owner, index) =>
        owner.definitions.map((tool) => ({
          ...tool,
          registeredName:
            owner === operations ? `design_operations.${tool.name}` : undefined,
          namespace: ['design_tools', 'design_operations', 'design_workflow'][
            index
          ]
        }))
      )
  })
  const workflow = createLocalDesignWorkflow(designs, operations)
  const owners = [designs, operations, workflow]
  const definition = operations.definitions.find(
    (tool) => tool.name === 'describe_design_apis'
  )

  if (!definition) {
    throw Error('Missing discovery owner')
  }

  const query = async (input: Record<string, unknown>) => {
    expect(
      operationInputIssue(input, nativeToolInputSchema(definition.inputSchema))
    ).toBeUndefined()
    const response = await invokeLocalTool(
      operations,
      definition,
      input,
      new AbortController().signal
    )

    const page = JSON.parse(response.text) as {
      apis: Candidate[]
      tools: Candidate[]
      recovery?: unknown
    }

    expect(page.apis, JSON.stringify(page)).toBeDefined()

    return page
  }

  return { query, actions }
}

describe('purpose and parameter discovery', () => {
  it.each(recorded.queries)(
    'finds the coordinate owner for recorded query %s',
    async (query) => {
      const run = setup()
      const page = await run.query({ query, view: 'usage' })
      const candidates = [...page.apis, ...page.tools].sort(
        (a, b) => a.rank - b.rank
      )

      expect(
        candidates[0].operation,
        JSON.stringify(candidates.slice(0, 2))
      ).toBe('element.setElementPositions')
      expect(candidates[0].capability.boundaries).toContain(
        'Absolute parent-local x/y coordinates; compute a new position before applying a delta.'
      )
      expect(candidates[0].capability.inputFields).toContain('positionsById')
    }
  )

  it('matches declared input fields without treating output prose or an open record as acceptance', async () => {
    const run = setup()
    const found = await run.query({
      query: 'set element position',
      inputFields: ['x', 'y']
    })

    expect(
      found.apis.some((api) => api.operation === 'element.setElementPositions')
    ).toBe(true)
    expect(
      found.apis.some((api) => api.operation === 'core.getElementChildren')
    ).toBe(false)
    expect(
      found.apis.every((api) => Object.keys(api.match.inputFields).length === 2)
    ).toBe(true)
    const missing = await run.query({
      query: 'update properties',
      inputFields: ['inventedField']
    })

    expect(missing.apis).toEqual([])
    expect(missing.tools).toEqual([])
    expect(missing.recovery).toBeDefined()
  })

  it('keeps vector-only scope distinct and publishes applicability in category menus', async () => {
    const run = setup()
    const page = await run.query({
      query: 'set vector element positions',
      inputFields: ['x', 'y']
    })
    const candidates = [...page.apis, ...page.tools].sort(
      (a, b) => a.rank - b.rank
    )

    expect(candidates[0].operation).toBe('element.setVectorElementPositions')
    const menu = await run.query({ category: 'element' })

    expect(
      menu.apis.every((api) => typeof api.capability.purpose === 'string')
    ).toBe(true)
  })

  it('finds opaque identities from purpose and fields with explicit applicability', async () => {
    const actions = setup()
      .actions.filter((entry) =>
        [
          'api_element_setElementPositions',
          'api_core_getElementChildren',
          'api_element_setVectorElementPositions'
        ].includes(entry.name)
      )
      .map((entry, index) => ({ ...entry, name: ['a', 'b', 'c'][index] }))
    const target = actions.find(
      (entry) =>
        'positionsById' in
        (entry.inputSchema as { properties: Record<string, unknown> })
          .properties
    )

    if (!target) {
      throw Error('Missing position contract')
    }

    const owner = createLocalOperationTools(
      [],
      {
        modelActions: (a) => a,

        resolveBatch: (v) => v
      },
      vi.fn(),
      {
        getNativeTools: () =>
          actions.map((action) => ({ ...action, namespace: 'opaque' }))
      }
    )
    const page = JSON.parse(
      await owner.call(
        'describe_design_apis',
        {
          query: 'translate elements offset',
          inputFields: ['x', 'y']
        },
        new AbortController().signal
      )
    )

    expect(page.tools[0].name).toBe(target.name)
    expect(page.tools[0].match.nameTerms).toEqual([])
  })
})
