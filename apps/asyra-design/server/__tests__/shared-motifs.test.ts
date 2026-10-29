import {
  completeUsageBudget,
  recordAcquisitionCost
} from './tool-contract-assertions'
import { expect, it, vi } from 'vitest'
import { AiActionNames } from '../../src/constants/ai-actions'
import fixture from './fixtures/recorded-101/shared-motifs-20261023.json'
import { constructDesign, constructDesignAsync } from '../design-construction'
import {
  prepareDesign,
  createDesignPreparationSession
} from '../design-preparation'
import {
  measureDesignBudget,
  partitionDesignBudget,
  selectDesignSource
} from '../design-budget'
import { createLocalDesignTools } from '../local-design-tools'
import { operationInputIssue } from '../operation-input-schema'

const generic = (order = 'cell-major') => {
  const motifs = [
    {
      key: 'marker',
      name: 'Triangle',
      fill: '#123456',
      fills: ['#123456', '#abcdef'],
      offset: { x: 0, y: 0.2, z: 0 },
      vertices: [
        { u: 0.1, v: 0.1 },
        { u: 0.9, v: 0.1 },
        { u: 0.5, v: 0.8 }
      ]
    },
    {
      key: 'chevron',
      name: 'Chevron',
      fill: '#735129',
      vertices: [
        { u: 0.2, v: 0.2 },
        { u: 0.8, v: 0.5 },
        { u: 0.2, v: 0.8 }
      ]
    }
  ]
  const grid = {
    type: 'surface-grid',
    key: 'a',
    name: 'Markers',
    boundary: [
      { x: 0, y: 0, z: 0 },
      { x: 12, y: 0, z: 0 },
      { x: 10, y: 0, z: 20 },
      { x: 2, y: 0, z: 20 }
    ],
    rows: 2,
    columns: 3,
    order,
    motifs: { template: 'markers' }
  }
  return {
    type: 'group',
    name: 'Signs',
    key: 'root',
    projection: {
      azimuth: 30,
      elevation: 25,
      scale: 1,
      originX: 0,
      originY: 20
    },
    motifTemplates: { markers: motifs },
    children: [
      grid,
      {
        ...grid,
        key: 'b',
        rows: 3,
        columns: 2,
        boundary: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 18, z: 0 },
          { x: 0, y: 16, z: 9 },
          { x: 0, y: 2, z: 9 }
        ]
      }
    ]
  }
}
const inline = (input: ReturnType<typeof generic>) => {
  const { motifTemplates, ...draft } = input
  return {
    ...draft,
    children: input.children.map((grid) => ({
      ...grid,
      motifs: motifTemplates.markers
    }))
  }
}

it('preserves every recorded object while reducing the entire invocation by fifteen percent', () => {
  expect(
    Buffer.byteLength(JSON.stringify(fixture.compact))
  ).toBeLessThanOrEqual(fixture.baseline.inputBytes * 0.85)
  const actual = prepareDesign(fixture.compact.draft, 'same')
  expect(actual).toEqual(prepareDesign(fixture.input.draft, 'same'))
  expect(actual.entries).toHaveLength(2669)
  expect(
    measureDesignBudget(fixture.compact.draft).observed.expandedNodes
  ).toBe(2669)
})
it.each(['cell-major', 'motif-major'])(
  'preserves independent boundaries, palettes, offsets and %s order',
  async (order) => {
    const input = generic(order)
    expect(prepareDesign(input, 'same')).toEqual(
      prepareDesign(inline(input), 'same')
    )
    expect(
      (await constructDesignAsync(input, 'root', new AbortController().signal))
        .draft
    ).toEqual(constructDesign(inline(input)).draft)
    const p = {
      type: 'pattern',
      key: 'p',
      name: 'Signs',
      origin: { x: 0, y: 0, z: 0 },
      axes: [{ count: 3, step: { x: 25, y: 0, z: 0 } }],
      members: input.children
    }
    const expected = { ...p, members: inline(input).children }
    expect(prepareDesign({ ...input, children: [p] }, 'same')).toEqual(
      prepareDesign({ ...inline(input), children: [expected] }, 'same')
    )
  }
)
it('validates a shared definition once while each surface owns its projection', () => {
  const input = generic()
  const vertices = input.motifTemplates.markers[0].vertices
  const read = vi.fn(() => vertices)
  Object.defineProperty(input.motifTemplates.markers[0], 'vertices', {
    get: read,
    enumerable: true
  })
  const result = constructDesign(input)
  expect(read).toHaveBeenCalledTimes(1)
  expect(result.sourceWork.pathCommands).toBe(14)
  expect(result.sourceWork.projectionCalls).toBe(10)
  expect(result.draft).toEqual(constructDesign(inline(input)).draft)
})
it('counts reference output and retains definitions in source-selected parts', () => {
  const input = generic()
  expect(measureDesignBudget(input).observed).toMatchObject({
    expandedNodes: 25,
    expandedPathCommands: 72,
    sourcePathCommands: 14
  })
  expect(measureDesignBudget(input, 10).exceeded).toContain('expandedNodes')
  expect(
    measureDesignBudget({
      ...input,
      motifTemplates: {
        ...input.motifTemplates,
        unused: input.motifTemplates.markers
      }
    }).observed
  ).toMatchObject({ sourcePathCommands: 20, expandedNodes: 25 })
  // Small deterministic partition exercises reference retention, not a live capacity experiment.
  const partitions = partitionDesignBudget(input, 15).partitions
  if (!partitions) throw new Error('Missing partitions')
  expect(partitions).toHaveLength(2)
  for (const part of partitions) {
    const selected = selectDesignSource(input, part.selections)
    expect(prepareDesign(selected, 'same').entries).toHaveLength(13)
  }
})
it.each([
  [
    'missing reference',
    (d: ReturnType<typeof generic>) => {
      d.children[0].motifs.template = 'missing'
    }
  ],
  [
    'conflicting reference',
    (d: ReturnType<typeof generic>) => {
      Object.assign(d.children[0].motifs, { vertices: [] })
    }
  ],
  [
    'empty definition',
    (d: ReturnType<typeof generic>) => {
      d.motifTemplates.markers = []
    }
  ],
  [
    'invalid unused definition',
    (d: ReturnType<typeof generic>) => {
      Object.assign(d.motifTemplates, { unused: [{ key: 'bad' }] })
    }
  ],
  [
    'duplicate key',
    (d: ReturnType<typeof generic>) => {
      d.motifTemplates.markers.push(d.motifTemplates.markers[0])
    }
  ],
  [
    'out of range',
    (d: ReturnType<typeof generic>) => {
      d.motifTemplates.markers[0].vertices[0].u = 2
    }
  ]
])('rejects %s before publishing an artifact', (_name, change) => {
  const d = generic()
  change(d)
  expect(() => prepareDesign(d, 'invalid')).toThrow()
})
it('admits both public forms and rejects reference overrides in the same dispatcher schema', () => {
  const owner = createLocalDesignTools([
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ])
  const definition = owner.definitions.find((d) => d.name === 'prepare_design')
  if (!definition) throw new Error('Missing preparation definition')
  expect(
    operationInputIssue({ draft: generic() }, definition.inputSchema)
  ).toBeUndefined()
  expect(
    operationInputIssue({ draft: inline(generic()) }, definition.inputSchema)
  ).toBeUndefined()
  const bad = generic()
  Object.assign(bad.children[0].motifs, { fill: '#ffffff' })
  expect(
    operationInputIssue({ draft: bad }, definition.inputSchema)
  ).toBeDefined()
})
it('isolates retained source, rejects cancellation and releases artifacts without rereading', async () => {
  const session = createDesignPreparationSession()
  const input = generic()
  const original = structuredClone(input)
  const receipt = await session.prepareAsync(
    input,
    new AbortController().signal
  )
  input.motifTemplates.markers[0].vertices[0].u = 0.2
  const artifact = session.resolve(receipt.artifactId)
  expect(artifact).toEqual(prepareDesign(original, receipt.artifactId))
  expect(session.recipe(receipt.artifactId).recipe).toEqual(original)
  expect(session.resolve(receipt.artifactId)).toBe(artifact)
  const next = session.prepare(input)
  expect(session.resolve(next.artifactId).entries).toEqual(
    prepareDesign(input, next.artifactId).entries
  )
  expect(session.resolve(next.artifactId).entries).not.toEqual(
    prepareDesign(original, next.artifactId).entries
  )
  await expect(
    session.prepareAsync(input, AbortSignal.abort())
  ).rejects.toThrow()
  session.release([receipt.artifactId])
  expect(() => session.resolve(receipt.artifactId)).toThrow()
  expect(session.resolve(next.artifactId)).toBeDefined()
})

it('reduces complete selected delivery and saved invocation without another page or lookup', async () => {
  const { createLocalOperationTools } = await import('../local-operation-tools')
  const { createLocalDesignWorkflow } = await import('../local-design-workflow')
  const actions = [
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    },
    {
      name: AiActionNames.INSPECT_DRAWING,
      description: 'Inspect',
      inputSchema: {}
    }
  ]
  const designs = createLocalDesignTools(actions)
  const operations = createLocalOperationTools(
    actions,
    designs,
    async () => ({ context: {}, actionResults: [] }),
    {
      getNativeTools: () =>
        main.definitions.map((d) => ({ ...d, namespace: 'design' }))
    }
  )
  const main = createLocalDesignWorkflow(designs, operations)
  const pageBytes: number[] = []
  let args: unknown = fixture.query
  let bytes = 0,
    pages = 0,
    text = ''
  while (args) {
    const raw = await operations.call(
      'describe_design_apis',
      args,
      new AbortController().signal
    )
    pageBytes.push(Buffer.byteLength(raw))
    bytes += Buffer.byteLength(raw)
    pages++
    expect(pages).toBeLessThanOrEqual(fixture.baseline.guideReplies)
    const reply = JSON.parse(raw)
    if (!reply.contentDelivery) {
      text += raw
      break
    }
    text += reply.contentDelivery.text
    args = reply.contentDelivery.next?.arguments
  }
  expect(
    JSON.parse(text).tools[0].invocationExample.invocation.arguments.draft
      .motifTemplates
  ).toBeDefined()
  recordAcquisitionCost(fixture.query, text, pageBytes)
  const { resultKey, ...contract } = JSON.parse(text)
  expect(resultKey).toEqual(expect.any(String))
  // Keep the original contract-only budget; the total below still includes the handle.
  const { deliverInformation } = await import('../local-information-delivery')
  let budgetQuery: Record<string, unknown> = fixture.query
  let contractBytes = 0
  for (;;) {
    const pageText = deliverInformation(
      JSON.stringify(contract),
      'describe_design_apis',
      budgetQuery,
      'contract-budget'
    )
    contractBytes += Buffer.byteLength(pageText)
    const page = JSON.parse(pageText).contentDelivery
    if (!page || page.lastPage) break
    budgetQuery = page.next.arguments
  }
  expect(contractBytes).toBeLessThanOrEqual(
    completeUsageBudget(fixture.baseline.guideWireBytes, 'draft', true)
  )
  expect(
    bytes + Buffer.byteLength(JSON.stringify(fixture.compact))
  ).toBeLessThan(
    completeUsageBudget(fixture.baseline.guideWireBytes, 'draft', true) +
      fixture.baseline.inputBytes
  )
})

it('keeps inline exceptions independent alongside shared definitions', () => {
  const source = generic()
  const exception = {
    ...inline(source).children[0],
    key: 'exception',
    motifs: structuredClone(source.motifTemplates.markers)
  }
  exception.motifs[0].vertices[0].u = 0.3
  const actual = prepareDesign(
    {
      ...source,
      children: [source.children[0], exception, source.children[1]]
    },
    'same'
  )
  expect(actual).toEqual(
    prepareDesign(
      {
        ...inline(source),
        children: [
          inline(source).children[0],
          exception,
          inline(source).children[1]
        ]
      },
      'same'
    )
  )
})
