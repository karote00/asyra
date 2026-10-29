import { createServer } from 'node:http'
import { waitForObservedAppReady as waitForAppReady } from './collaboration-observation'
import { createBatchExchange } from '../server/batch-exchange'
import { createLocalOperationTools } from '../server/local-operation-tools'
import { createLocalDesignWorkflow } from '../server/local-design-workflow'
import { invokeLocalTool } from '../server/local-tool-invocation'
import { readFileSync } from 'node:fs'
const recoveryFixture = JSON.parse(
  readFileSync(
    new URL(
      '../server/__tests__/fixtures/recorded-101/pattern-budget-recovery-20261023.json',
      import.meta.url
    ),
    'utf8'
  )
)
const faceBoundaryFixture = JSON.parse(
  readFileSync(
    new URL(
      '../server/__tests__/fixtures/recorded-101/face-boundary-20261025.json',
      import.meta.url
    ),
    'utf8'
  )
)
const referencedFaceInput = structuredClone(faceBoundaryFixture.inputs[0])
for (const [path, face] of faceBoundaryFixture.pairs[0]) {
  let owner = referencedFaceInput.draft
  for (const key of path.slice(0, -1)) owner = owner[key]
  owner[path[path.length - 1]] = { face }
}
referencedFaceInput.inspection = 'defer'
const sharedMotifsFixture = JSON.parse(
  readFileSync(
    new URL(
      '../server/__tests__/fixtures/recorded-101/shared-motifs-20261023.json',
      import.meta.url
    ),
    'utf8'
  )
)
const layeredFixture = JSON.parse(
  readFileSync(
    new URL(
      '../server/__tests__/fixtures/recorded-101/layered-pattern-20261023.json',
      import.meta.url
    ),
    'utf8'
  )
)
import {
  captureBrowserErrors,
  getCapturedBrowserErrors,
  getPersistedDocumentCheckpoint,
  getPersistedDocumentDigest
} from './test-utils'
import { expect, test } from '@playwright/test'
import {
  createDesignPreparationSession,
  prepareDesignAsync
} from '../server/design-preparation'
import { createLocalDesignTools } from '../server/local-design-tools'
import { AiActionNames } from '../src/constants/ai-actions'
import type { PreparedDesign } from '../src/ai/prepared-design'
import {
  createTestDocumentIdentity,
  getCoreDocumentDigest,
  getUndoHistoryDepth,
  undo,
  redo
} from './test-utils'

const captureConstructionCollaboration = (
  page: import('@playwright/test').Page,
  reset = false
) =>
  page.evaluate(async (resetOutcomes) => {
    const { RuntimeDiagnosticEvents } =
      await import('../src/constants/runtime-diagnostics')
    const operations = resetOutcomes
      ? ['collaboration:reset-outcomes']
      : ['collaboration:get-status', 'collaboration:read-outcomes']
    return operations.map((operation) => {
      const detail: { operation: string; response?: unknown; error?: string } =
        {
          operation
        }
      document.dispatchEvent(
        new CustomEvent(RuntimeDiagnosticEvents.REQUEST, { detail })
      )
      if (detail.error) throw new Error(detail.error)
      if (!Object.hasOwn(detail, 'response'))
        throw new Error(`Missing diagnostic response: ${operation}`)
      return { operation, at: Date.now(), response: detail.response }
    })
  }, reset)

const editorial = {
  type: 'frame',
  name: 'Open Field',
  width: 720,
  height: 520,
  fill: '#F5F2E9',
  brief: {
    intent: 'Editorial landing page',
    viewpoint: 'Flat',
    sources: ['Test brief'],
    assumptions: ['Use warm paper and forest green'],
    checks: [{ key: 'cta', property: 'x', expected: 260, tolerance: 0.001 }]
  },
  children: [
    {
      key: 'brand',
      name: 'Brand',
      type: 'text',
      x: 40,
      y: 28,
      width: 300,
      height: 24,
      text: 'OPEN FIELD',
      fontSize: 16,
      lineHeight: 24,
      fontWeight: 'bold',
      fill: '#264637'
    },
    {
      key: 'heading',
      name: 'Heading',
      type: 'text',
      x: 40,
      y: 88,
      width: 640,
      height: 66,
      text: 'Space for better ideas.',
      fontSize: 46,
      lineHeight: 58,
      fontWeight: 'bold',
      fill: '#264637'
    },
    {
      key: 'body',
      name: 'Introduction',
      type: 'text',
      x: 40,
      y: 163,
      width: 640,
      height: 56,
      text: 'A quiet place to collect, connect and create.\nStart with a thought. Make something meaningful.',
      fontSize: 18,
      lineHeight: 26,
      fill: '#53685B'
    },
    ...['Collect', 'Connect', 'Create'].map((text, index) => ({
      key: `card${index}`,
      name: `${text} card`,
      type: 'frame',
      width: 200,
      height: 132,
      y: 250,
      fill: '#E0E7D8',
      children: [
        {
          key: `number${index}`,
          name: 'Number',
          type: 'text',
          x: 20,
          y: 20,
          width: 160,
          height: 24,
          text: `0${index + 1}`,
          fontSize: 14,
          lineHeight: 20,
          fill: '#65755C'
        },
        {
          key: `title${index}`,
          name: `${text} title`,
          type: 'text',
          x: 20,
          y: 64,
          width: 160,
          height: 40,
          text,
          fontSize: 25,
          lineHeight: 32,
          fontWeight: 'bold',
          fill: '#264637'
        }
      ]
    })),
    {
      key: 'cta',
      name: 'Primary action',
      type: 'frame',
      width: 200,
      height: 48,
      y: 424,
      fill: '#264637',
      children: [
        {
          key: 'ctaText',
          name: 'Action label',
          type: 'text',
          x: 10,
          y: 12,
          width: 180,
          height: 24,
          text: 'Start exploring',
          fontSize: 16,
          lineHeight: 24,
          textAlign: 'center',
          fill: '#FFFFFF'
        }
      ]
    }
  ],
  relations: [
    {
      target: 'card0',
      property: 'x',
      source: '$parent',
      sourceProperty: 'x',
      offset: 40
    },
    {
      target: 'card1',
      property: 'x',
      source: 'card0',
      sourceProperty: 'right',
      offset: 20
    },
    {
      target: 'card2',
      property: 'x',
      source: 'card1',
      sourceProperty: 'right',
      offset: 20
    },
    {
      target: 'cta',
      property: 'x',
      source: '$parent',
      sourceProperty: 'centerX',
      targetAnchor: 0.5
    }
  ]
}
const point = (x: number, y: number, z: number) => ({ x, y, z })
const face = (
  key: string,
  fill: string,
  vertices: ReturnType<typeof point>[]
) => ({ key, name: key, type: 'projected-face', fill, vertices })
const pavilion = {
  key: 'pavilion',
  type: 'frame',
  name: 'Projected pavilion',
  width: 480,
  height: 500,
  fill: '#EDF2EF',
  brief: {
    intent: 'Editable orthographic pavilion',
    viewpoint: '30 degree azimuth and elevation',
    sources: ['Explicit fixture geometry'],
    assumptions: ['Illustration, not a surveyed building'],
    checks: [
      { key: 'pavilion', property: 'width', expected: 480, tolerance: 0 }
    ]
  },
  projection: {
    azimuth: 30,
    elevation: 30,
    scale: 1.5,
    originX: 210,
    originY: 320
  },
  children: [
    face('Ground', '#CAD6CF', [
      point(-25, -25, 0),
      point(125, -25, 0),
      point(125, 105, 0),
      point(-25, 105, 0)
    ]),
    face('Side wall', '#498B86', [
      point(100, 0, 0),
      point(100, 80, 0),
      point(100, 80, 130),
      point(100, 0, 130)
    ]),
    face('Front wall', '#75B6AC', [
      point(0, 80, 0),
      point(100, 80, 0),
      point(100, 80, 130),
      point(0, 80, 130)
    ]),
    face('Roof', '#B0D3C8', [
      point(0, 0, 130),
      point(100, 0, 130),
      point(100, 80, 130),
      point(0, 80, 130)
    ]),
    ...[0, 1, 2, 3].map((i) =>
      face(`Window ${i + 1}`, '#D5EAE4', [
        point(12 + i * 22, 80, 35),
        point(25 + i * 22, 80, 35),
        point(25 + i * 22, 80, 110),
        point(12 + i * 22, 80, 110)
      ])
    ),
    face('Door', '#264F50', [
      point(42, 80, 0),
      point(60, 80, 0),
      point(60, 80, 26),
      point(42, 80, 26)
    ])
  ]
}
const patterned = {
  ...pavilion,
  name: 'Patterned pavilion',
  children: [
    ...pavilion.children.slice(0, 4),
    {
      type: 'pattern',
      key: 'windows',
      name: 'Window grid',
      origin: { x: 0, y: 0, z: 0 },
      axes: [
        { count: 4, step: { x: 22, y: 0, z: 0 } },
        { count: 3, step: { x: 0, y: 0, z: 26 } }
      ],
      faces: [
        {
          key: 'pane',
          name: 'Glass',
          fill: '#D5EAE4',
          vertices: [
            point(12, 80, 35),
            point(25, 80, 35),
            point(25, 80, 55),
            point(12, 80, 55)
          ]
        }
      ]
    }
  ]
}
const ovals = {
  type: 'group',
  name: 'Projected medallions',
  projection: {
    azimuth: 30,
    elevation: 35,
    scale: 2,
    originX: 120,
    originY: 200
  },
  linearFields: {
    light: {
      frame: 'world',
      start: { x: 0, y: 0, z: 0 },
      end: { x: 0, y: 0, z: 90 },
      gradientStops: [
        { position: 0, color: '#075985', opacity: 1 },
        { position: 1, color: '#7DD3FC', opacity: 1 }
      ]
    }
  },
  children: [
    {
      type: 'pattern',
      key: 'medallions',
      name: 'Medallions',
      origin: { x: 0, y: 0, z: 0 },
      axes: [{ count: 3, step: { x: 105, y: 0, z: 0 } }],
      members: [
        {
          type: 'projected-face',
          key: 'rim',
          name: 'Gold rim',
          fill: '#F59E0B',
          ellipse: {
            center: { x: 35, y: 0, z: 45 },
            u: { x: 35, y: 0, z: 0 },
            v: { x: 8, y: 0, z: 42 }
          }
        },
        {
          type: 'projected-face',
          key: 'inset',
          name: 'Blue inset',
          materialField: 'light',
          ellipse: {
            center: { x: 35, y: 0, z: 45 },
            u: { x: 27, y: 0, z: 0 },
            v: { x: 6, y: 0, z: 34 }
          }
        }
      ]
    }
  ]
}
for (const [name, draft] of Object.entries({
  editorial,
  pavilion,
  patterned,
  ovals
})) {
  test(`structured ${name} preparation renders editable geometry with one Undo`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    const tools = createLocalDesignTools([
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'Apply',
        inputSchema: {}
      }
    ])
    const receipt = JSON.parse(
      await tools.call(
        'prepare_design',
        { draft },
        new AbortController().signal
      )
    )
    expect(receipt.applicable, JSON.stringify(receipt)).toBe(true)
    const batch = tools.resolveBatch({
      batchId: name,
      actions: [
        {
          id: 'draw',
          name: AiActionNames.APPLY_PREPARED_DESIGN,
          arguments: { artifactId: receipt.artifactId },
          summary: 'Create the design'
        }
      ]
    })
    const design = (batch.actions[0].arguments as { design: PreparedDesign })
      .design
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.route('**/api/ai/action-batch', (route) =>
      route.fulfill({ json: batch })
    )
    const identity = createTestDocumentIdentity()
    await page.goto(identity.url)
    await waitForAppReady(page)
    const before = await getCoreDocumentDigest(page),
      depth = await getUndoHistoryDepth(page)
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await page.getByLabel('Message Agent').fill(`Draw the ${name} design`)
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
      'data-outcome',
      'success'
    )
    expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
    const actual = await page.evaluate(
      async (ids) => {
        const { core } = await import('../src/testing/runtime-access')
        const { reviewDesign } =
          await import('../src/common-apis/design-review')
        return {
          nodes: ids.map((id) => ({
            type: core.getElementData(id)?.type,
            renderedRotation: core.deps.render.getElementById(id)?.rotation,
            values: core.getElementComputedData(id, [
              'x',
              'y',
              'width',
              'height',
              'rotation',
              'fills',
              'text'
            ])
          })),
          sceneBounds: core.getAllElementsBounds(),
          review: await reviewDesign(ids[0])
        }
      },
      design.entries.map((e) => e.descriptor.id)
    )
    for (const [i, entry] of design.entries.entries()) {
      expect(actual.nodes[i].type).toBe(entry.descriptor.type)
      if (entry.descriptor.type === 'oval') {
        expect(actual.nodes[i].values?.rotation).toBe(entry.descriptor.rotation)
        expect(actual.nodes[i].renderedRotation).toBeCloseTo(
          Number(entry.descriptor.rotation),
          10
        )
      }
      for (const property of ['width', 'height'] as const)
        expect(Number(actual.nodes[i].values?.[property])).toBeCloseTo(
          Number(entry.descriptor[property]),
          5
        )
    }
    if (name === 'ovals') {
      const root = design.entries[0].descriptor
      expect(actual.sceneBounds?.minX).toBeCloseTo(Number(root.x), 8)
      expect(actual.sceneBounds?.minY).toBeCloseTo(Number(root.y), 8)
      expect(actual.sceneBounds?.maxX).toBeCloseTo(
        Number(root.x) + Number(root.width),
        8
      )
      expect(actual.sceneBounds?.maxY).toBeCloseTo(
        Number(root.y) + Number(root.height),
        8
      )
    }
    expect(actual.review.complete).toBe(true)
    expect(actual.review.findings).toEqual([])
    const after = await getCoreDocumentDigest(page)
    await page.getByRole('button', { name: 'Close Agent panel' }).click()
    await undo(page)
    expect(await getCoreDocumentDigest(page)).toEqual(before)
    await redo(page)
    expect(await getCoreDocumentDigest(page)).toEqual(after)
    await page.evaluate(async () => {
      ;(
        await import('../src/common-apis/selection')
      ).selectionApis.clearSelection()
      ;(await import('../src/common-apis/viewport')).viewportApis.zoomFit()
    })
    if (name === 'ovals') {
      const insetIds = design.entries
        .filter((e) => e.key.endsWith('-inset'))
        .map((e) => e.descriptor.id)
      await expect
        .poll(() =>
          page.evaluate(async (ids) => {
            const { elementApis } =
              await import('../src/testing/runtime-access')
            return ids.map((id) => {
              const bounds = elementApis.getElementClientBounds(id)
              if (!bounds) throw new Error('Missing oval client bounds')
              return elementApis.getRenderElementIdAtClientPos({
                x: bounds.x + bounds.width / 2,
                y: bounds.y + bounds.height / 2
              })
            })
          }, insetIds)
        )
        .toEqual(insetIds)
    }
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) })
    if (name === 'ovals') {
      await expect
        .poll(() => getPersistedDocumentDigest(identity.fileId), {
          timeout: 30000
        })
        .toEqual(after)
      await page.reload()
      await waitForAppReady(page)
      expect(await getCoreDocumentDigest(page)).toEqual(after)
      await page.evaluate(async () => {
        ;(await import('../src/common-apis/viewport')).viewportApis.zoomFit()
      })
      await page.screenshot({ path: testInfo.outputPath('ovals-reloaded.png') })
    }
    await testInfo.attach('construction-evidence', {
      body: JSON.stringify({
        receipt,
        actual,
        viewport: { width: 1440, height: 1000 },
        appURL: process.env.APP_URL,
        selected: false
      }),
      contentType: 'application/json'
    })
  })
}

test('artifact-targeted mixed batch uses normal actions and one Undo/Redo boundary', async ({
  page
}, testInfo) => {
  const { createLocalOperationTools } =
    await import('../server/local-operation-tools')
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const available = await page.evaluate(
    async (names) => {
      const { createAiActions } = await import('../src/ai/actions')
      const { createDesignEditAction } =
        await import('../src/ai/design-edit-action')
      const { createPreparedDesignAction } =
        await import('../src/ai/design-actions')
      return [
        ...createAiActions(),
        createDesignEditAction(),
        createPreparedDesignAction()
      ]
        .filter((action) => names.includes(action.name))
        .map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema
        }))
    },
    [
      AiActionNames.APPLY_PREPARED_DESIGN,
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.SET_ELEMENT_VISIBILITY
    ]
  )
  const tools = createLocalDesignTools(available)
  const signal = new AbortController().signal
  const prepared = JSON.parse(
    await tools.call(
      'prepare_design',
      {
        draft: {
          type: 'frame',
          name: 'Batch proof',
          width: 240,
          height: 120,
          children: [
            {
              type: 'rect',
              key: 'a',
              name: 'A',
              x: 0,
              y: 0,
              width: 40,
              height: 40
            },
            {
              type: 'rect',
              key: 'b',
              name: 'B',
              x: 60,
              y: 0,
              width: 40,
              height: 40
            }
          ]
        }
      },
      signal
    )
  )
  let batch: import('../src/ai/action-batch-protocol').AiActionBatch | undefined
  const operations = createLocalOperationTools(
    available,
    tools,
    async (value) => {
      batch = value
      return { context: {}, actionResults: [] }
    }
  )
  await operations.call(
    'execute_design_batch',
    {
      operations: [
        {
          name: AiActionNames.APPLY_PREPARED_DESIGN,
          arguments: { artifactId: prepared.artifactId, response: 'compact' }
        },
        {
          name: AiActionNames.UPDATE_DESIGN_ELEMENT,
          arguments: { name: 'Renamed', properties: { x: 15 } },
          target: {
            artifactId: prepared.artifactId,
            keys: ['a'],
            field: 'elementId'
          }
        },
        {
          name: AiActionNames.SET_ELEMENT_VISIBILITY,
          arguments: { visible: false },
          target: {
            artifactId: prepared.artifactId,
            keys: ['b'],
            field: 'elementId'
          }
        }
      ]
    },
    signal
  )
  expect(batch?.actions).toHaveLength(3)
  const ids = tools.resolveTargets({
    artifactId: prepared.artifactId,
    keys: ['a', 'b']
  })
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({ json: batch })
  )
  const before = await getCoreDocumentDigest(page),
    depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.getByLabel('Message Agent').fill('Create and edit the batch proof')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'success'
  )
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  const data = await page.evaluate(async (ids) => {
    const { core } = await import('../src/testing/runtime-access')
    return {
      a: core.getElementData(ids[0]),
      bounds: core.getElementComputedData(ids[0], ['x']),
      b: core.getElementData(ids[1])
    }
  }, ids)
  expect(data.a?.name).toBe('Renamed')
  expect(data.bounds?.x).toBe(15)
  expect(data.b?.visible).toBe(false)
  const after = await getCoreDocumentDigest(page)
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
  await page.screenshot({
    path: testInfo.outputPath('artifact-targeted-batch.png')
  })
})

for (const scenario of [
  {
    title:
      'face boundaries preserve partition recovery, collaboration, Undo and durable reload',
    input: referencedFaceInput,
    artifacts: 2,
    members: 2310,
    boundaryReferences: true
  },
  {
    title:
      'shared motifs preserve independent surfaces through application, Undo and durable reload',
    input: { draft: sharedMotifsFixture.compact.draft, inspection: 'defer' },
    artifacts: 1,
    members: 2668
  },
  {
    title:
      'budget partitions preserve one root through canonical normalization, Undo and durable reload',
    input: recoveryFixture.input,
    artifacts: 2,
    members: 13094
  },
  {
    title:
      'layered patterns preserve references through application, Undo and durable reload',
    input: { draft: layeredFixture.compact.draft, inspection: 'defer' },
    artifacts: 1,
    members: 1442
  }
])
  test(scenario.title, async ({ page, browser }) => {
    test.setTimeout(180000)
    const designs: PreparedDesign[] = []
    const exchange = createBatchExchange()
    const controller = new AbortController()
    let workflowResult: ReturnType<typeof JSON.parse>
    let serverError: unknown
    const referenced = 'boundaryReferences' in scenario
    let attempts = 0
    let peerContext: Awaited<ReturnType<typeof browser.newContext>> | undefined
    let peer: import('@playwright/test').Page | undefined
    const server = createServer(async (request, response) => {
      response.setHeader(
        'Access-Control-Allow-Origin',
        request.headers.origin ?? '*'
      )
      response.setHeader(
        'Access-Control-Allow-Headers',
        'content-type,x-ai-batch-receipt'
      )
      if (request.method === 'OPTIONS') {
        response.end()
        return
      }
      try {
        const chunks: Buffer[] = []
        for await (const chunk of request) chunks.push(Buffer.from(chunk))
        const input = JSON.parse(Buffer.concat(chunks).toString())
        const token = request.headers['x-ai-batch-receipt']
        if (typeof token === 'string') {
          const accepted = exchange.accept(token, input)
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ accepted }))
          return
        }
        response.setHeader('Content-Type', 'application/x-ndjson')
        const tools = createLocalDesignTools(
          input.actions,
          referenced
            ? createDesignPreparationSession(
                undefined,
                async (...args) => {
                  if (++attempts === 2)
                    throw new Error('Injected preparation interruption')
                  return prepareDesignAsync(...args)
                },
                undefined,
                2000
              )
            : undefined
        )
        const operations = createLocalOperationTools(
          input.actions,
          tools,
          async (batch) => {
            for (const action of batch.actions)
              if (action.name === AiActionNames.APPLY_PREPARED_DESIGN)
                designs.push(
                  (action.arguments as { design: PreparedDesign }).design
                )
            return exchange.execute(batch, controller.signal, (frame) =>
              response.write(JSON.stringify(frame) + '\n')
            )
          }
        )
        const main = createLocalDesignWorkflow(tools, operations)
        const result = await invokeLocalTool(
          main,
          main.definitions[0],
          scenario.input,
          controller.signal
        )
        workflowResult = JSON.parse(result.text)
        if (referenced) {
          expect(workflowResult.toolOutcome.status).toBe('partial')
          const recovery = workflowResult.recoveryInvocation
          expect(recovery.arguments.parts).toHaveLength(1)
          expect(JSON.stringify(recovery.arguments)).not.toContain('vertices')
          workflowResult = JSON.parse(
            (
              await invokeLocalTool(
                main,
                main.definitions[0],
                recovery.arguments,
                controller.signal
              )
            ).text
          )
          expect(attempts).toBe(3)
        }
        response.end(
          JSON.stringify({
            type: 'result',
            batch: {
              batchId: 'construction-complete',
              actions: [
                {
                  id: 'report',
                  name: 'report_outcome',
                  arguments: {
                    outcome: 'completed',
                    message: 'Construction applied.'
                  },
                  summary: 'Report completion'
                }
              ]
            }
          }) + '\n'
        )
      } catch (error) {
        serverError = error
        response.destroy(error instanceof Error ? error : undefined)
      }
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string')
      throw new Error('Missing test endpoint')
    try {
      await page.route('**/api/ai/status', (route) =>
        route.fulfill({ json: { state: 'ready' } })
      )
      await page.route('**/api/ai/action-batch', (route) =>
        route.continue({ url: `http://127.0.0.1:${address.port}/action-batch` })
      )
      const document = createTestDocumentIdentity(
        referenced ? 'aiPerformance=profile' : ''
      )
      await page.goto(document.url)
      await waitForAppReady(page)
      const fileId = new URL(page.url()).searchParams.get('fileId')
      if (!fileId) throw new Error('Missing document identity')
      if (referenced) {
        peerContext = await browser.newContext()
        peer = await peerContext.newPage()
        await peer.goto(page.url())
        await waitForAppReady(peer)
        for (const actor of [page, peer])
          await expect
            .poll(() =>
              actor.evaluate(async () =>
                (await import('../src/testing/runtime-access'))
                  .getActiveCollaborationHandle()
                  ?.getStatus()
              )
            )
            .toBe('connected')
        for (const actor of [page, peer]) {
          captureBrowserErrors(actor)
          await captureConstructionCollaboration(actor, true)
        }
      }
      const before = await getCoreDocumentDigest(page)
      const beforeCount = await page.evaluate(async () =>
        (
          await import('../src/testing/runtime-access')
        ).core.getCanonicalElementCount()
      )
      const depth = await getUndoHistoryDepth(page)
      await page.getByRole('button', { name: 'Open Agent' }).click()
      await page
        .getByLabel('Message Agent')
        .fill('Apply the construction fixture')
      await page.getByRole('button', { name: 'Send', exact: true }).click()
      await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
        'data-outcome',
        'success',
        { timeout: 90000 }
      )
      expect(serverError).toBeUndefined()
      expect(workflowResult.toolOutcome).toMatchObject({
        status: 'success',
        settlement: 'completed'
      })
      if (scenario.artifacts > 1)
        expect(workflowResult.parts).toHaveLength(
          referenced ? 1 : scenario.artifacts
        )
      else expect(workflowResult.parts).toBeUndefined()
      expect(designs).toHaveLength(scenario.artifacts)
      expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
      const root = designs[0].entries[0].descriptor
      const members = designs.flatMap((design) => design.entries.slice(1))
      const actual = await page.evaluate(
        async (ids) => {
          const { core } = await import('../src/testing/runtime-access')
          return ids.map((id) => ({
            parentId: core.getElementMetadata(id)?.parentId,
            world: core.elementLocalToWorkspace(id, { x: 0, y: 0 }),
            values: core.getElementComputedData(id, ['width', 'height'])
          }))
        },
        members.map((entry) => entry.descriptor.id)
      )
      expect(actual).toHaveLength(scenario.members)
      // One assertion retains the complete oracle without recording 65,000 test steps.
      const differences: string[] = []
      for (const [i, entry] of members.entries()) {
        if (actual[i].parentId !== root.id) differences.push(`parent:${i}`)
        for (const [field, observed, expected] of [
          ['x', actual[i].world.x, Number(root.x) + Number(entry.descriptor.x)],
          ['y', actual[i].world.y, Number(root.y) + Number(entry.descriptor.y)],
          ['width', actual[i].values?.width, entry.descriptor.width],
          ['height', actual[i].values?.height, entry.descriptor.height]
        ]) {
          const delta = Math.abs(Number(observed) - Number(expected))
          if (!Number.isFinite(delta) || delta >= 0.000005)
            differences.push(`${i}:${field}:${delta}`)
        }
      }
      expect(differences).toEqual([])
      const order = await page.evaluate(async (id) => {
        const { core } = await import('../src/testing/runtime-access')
        return core.getElementData(id)?.children
      }, root.id)
      expect(order).toEqual(members.map((entry) => entry.descriptor.id))
      let digestTransport: unknown
      const digestPage = new Proxy(page, {
        get(target, property, receiver) {
          if (property !== 'evaluate')
            return Reflect.get(target, property, receiver)
          return async (...args: Parameters<typeof page.evaluate>) => {
            const result = await page.evaluate(...args)
            digestTransport = result
            return result
          }
        }
      })
      const after = await getCoreDocumentDigest(digestPage)
      expect(Object.keys(digestTransport as object)).toEqual(Object.keys(after))
      expect(digestTransport).toEqual(after)
      await page.evaluate(async () => {
        const { core, testRuntimeState } =
          await import('../src/testing/runtime-access')
        let saveCount = 0
        testRuntimeState.set('construction-digest-save-count', saveCount)
        core.registerSaveHook((data) => {
          testRuntimeState.set('construction-digest-save-count', ++saveCount)
          return data
        })
      })
      expect(await getCoreDocumentDigest(page, beforeCount)).toBeNull()
      expect(
        await page.evaluate(async () =>
          (await import('../src/testing/runtime-access')).testRuntimeState.get(
            'construction-digest-save-count'
          )
        )
      ).toBe(0)
      const afterCount = await page.evaluate(async () =>
        (
          await import('../src/testing/runtime-access')
        ).core.getCanonicalElementCount()
      )
      expect(await getCoreDocumentDigest(page, afterCount)).toEqual(after)
      expect(
        await page.evaluate(async () =>
          (await import('../src/testing/runtime-access')).testRuntimeState.get(
            'construction-digest-save-count'
          )
        )
      ).toBe(1)
      if (peer)
        await expect
          .poll(() =>
            getCoreDocumentDigest(
              peer as import('@playwright/test').Page,
              afterCount
            )
          )
          .toEqual(after)
      await page.getByRole('button', { name: 'Close Agent panel' }).click()
      if (peer)
        await peer.evaluate(async () => {
          const { getActiveAiDrawingPerformanceProfile } =
            await import('../src/testing/runtime-access')
          getActiveAiDrawingPerformanceProfile()?.reset()
        })
      await page.evaluate(async () => {
        const { historyApis } = await import('../src/common-apis/history')
        await historyApis.undo()
      })
      expect(await getCoreDocumentDigest(page)).toEqual(before)
      if (peer) {
        try {
          await expect
            .poll(() =>
              getCoreDocumentDigest(
                peer as import('@playwright/test').Page,
                beforeCount
              )
            )
            .toEqual(before)
          expect(
            (await captureConstructionCollaboration(peer))[1].response
          ).toMatchObject({ failed: 0 })
        } catch (error) {
          try {
            const diagnostics = await Promise.allSettled([
              captureConstructionCollaboration(page),
              captureConstructionCollaboration(peer),
              getPersistedDocumentCheckpoint(fileId)
            ])
            await test.info().attach('construction-peer-undo-diagnostics', {
              contentType: 'application/json',
              body: JSON.stringify({
                expected: before,
                actorErrors: getCapturedBrowserErrors(page),
                peerErrors: getCapturedBrowserErrors(peer),
                diagnostics: diagnostics.map((result) =>
                  result.status === 'fulfilled'
                    ? result
                    : { status: result.status, reason: String(result.reason) }
                )
              })
            })
          } catch (diagnosticError) {
            test.info().annotations.push({
              type: 'diagnostic-capture-failed',
              description: String(diagnosticError)
            })
          }
          throw error
        } finally {
          try {
            const evidence = await peer.evaluate(async () => {
              const { getActiveAiDrawingPerformanceProfile } =
                await import('../src/testing/runtime-access')
              const profile = getActiveAiDrawingPerformanceProfile()
              if (!profile) throw new Error('Missing peer Undo profile')
              return {
                visibility: document.visibilityState,
                sample: profile.snapshot(),
                runtime: profile.getRuntimeEvidence()
              }
            })
            await test.info().attach('construction-peer-undo-profile', {
              contentType: 'application/json',
              body: JSON.stringify(evidence)
            })
          } catch (diagnosticError) {
            test.info().annotations.push({
              type: 'diagnostic-capture-failed',
              description: String(diagnosticError)
            })
          }
        }
      }
      await page.evaluate(async () => {
        const { historyApis } = await import('../src/common-apis/history')
        await historyApis.redo()
      })
      expect(await getCoreDocumentDigest(page)).toEqual(after)
      if (peer)
        await expect
          .poll(() =>
            getCoreDocumentDigest(
              peer as import('@playwright/test').Page,
              afterCount
            )
          )
          .toEqual(after)
      await expect
        .poll(() => getPersistedDocumentDigest(fileId), { timeout: 30000 })
        .toEqual(after)
      await page.reload()
      await waitForAppReady(page)
      try {
        expect(await getCoreDocumentDigest(page)).toEqual(after)
      } catch (error) {
        try {
          const checkpoint = await getPersistedDocumentCheckpoint(fileId)
          const reloaded = await page.evaluate(async () =>
            (await import('../src/testing/runtime-access')).core.save()
          )
          await test.info().attach('construction-reload-documents', {
            contentType: 'application/json',
            body: JSON.stringify({ expected: after, checkpoint, reloaded })
          })
        } catch (diagnosticError) {
          test.info().annotations.push({
            type: 'diagnostic-capture-failed',
            description: String(diagnosticError)
          })
        }
        throw error
      }
    } finally {
      await peerContext?.close()
      controller.abort()
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      )
    }
  })
