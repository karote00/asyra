import { expect, test } from '@playwright/test'
import { createLocalDesignTools } from '../server/local-design-tools'
import { AiActionNames } from '../src/constants/ai-actions'
import type { PreparedDesign } from '../src/ai/prepared-design'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  getCoreDocumentDigest,
  getUndoHistoryDepth,
  undo,
  redo
} from './test-utils'

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
      textColor: '#264637'
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
      textColor: '#264637'
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
      textColor: '#53685B'
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
          textColor: '#65755C'
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
          textColor: '#264637'
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
          textColor: '#FFFFFF'
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
    checks: [{ key: '$root', property: 'width', expected: 480, tolerance: 0 }]
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
for (const [name, draft] of Object.entries({
  editorial,
  pavilion,
  patterned
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
    expect(receipt.applicable).toBe(true)
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
    await page.goto(createTestDocumentIdentity().url)
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
            values: core.getElementComputedData(id, [
              'x',
              'y',
              'width',
              'height',
              'text'
            ])
          })),
          review: await reviewDesign(ids[0])
        }
      },
      design.entries.map((e) => e.descriptor.id)
    )
    for (const [i, entry] of design.entries.entries()) {
      expect(actual.nodes[i].type).toBe(entry.descriptor.type)
      for (const property of ['width', 'height'] as const)
        expect(Number(actual.nodes[i].values?.[property])).toBeCloseTo(
          Number(entry.descriptor[property]),
          5
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
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) })
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

test('local subscription constructs and reviews an editable layout from a brief', async ({
  page
}, testInfo) => {
  test.skip(
    process.env.E2E_LOCAL_AI !== 'true',
    'Requires the local subscription provider'
  )
  test.setTimeout(330_000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await expect(page.getByText('Local AI connected')).toBeVisible({
    timeout: 20_000
  })
  await page
    .getByLabel('Message Agent')
    .fill(
      'Design a polished 720 by 520 px editorial landing page for a nature journal named Open Field. Warm paper background, forest green typography, a clear headline, short introduction, three equal feature cards, and a centered call to action. Use editable text and native shapes. Keep all text inside its boxes. No web research or images are needed; choose the copy and style yourself.'
    )
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  try {
    const result = page.getByTestId('ai-agent-message').last()
    await expect(result).toHaveAttribute(
      'data-outcome',
      /success|partial|failed|no-change|cancelled/,
      { timeout: 300_000 }
    )
    await expect(result).toHaveAttribute('data-outcome', 'success')
    expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
    const evidence = await page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')
      const { hierarchyApis } = await import('../src/common-apis/hierarchy')
      const { reviewDesign } = await import('../src/common-apis/design-review')
      const workspace = hierarchyApis.getWorkspaceId()
      const roots = workspace
        ? (core.getElementData(workspace)?.children ?? [])
        : []
      return Promise.all(
        roots.map(async (id) => {
          const pending = [id],
            overlaps: string[][] = []
          for (let index = 0; index < pending.length && index < 200; index++) {
            const children = core.getElementData(pending[index])?.children ?? []
            pending.push(...children)
            const text = children.filter(
              (child) => core.getElementData(child)?.type === 'text'
            )
            for (let i = 0; i < text.length; i++)
              for (let j = i + 1; j < text.length; j++) {
                const a = core.getElementComputedData(text[i], [
                  'x',
                  'y',
                  'width',
                  'height'
                ])
                const b = core.getElementComputedData(text[j], [
                  'x',
                  'y',
                  'width',
                  'height'
                ])
                if (!a || !b) throw new Error('Missing text geometry')
                if (
                  Math.min(
                    Number(a.x) + Number(a.width),
                    Number(b.x) + Number(b.width)
                  ) > Math.max(Number(a.x), Number(b.x)) &&
                  Math.min(
                    Number(a.y) + Number(a.height),
                    Number(b.y) + Number(b.height)
                  ) > Math.max(Number(a.y), Number(b.y))
                )
                  overlaps.push([text[i], text[j]])
              }
          }
          return {
            id,
            bounds: core.getElementComputedData(id, ['width', 'height']),
            review: await reviewDesign(id),
            overlaps
          }
        })
      )
    })
    expect(
      evidence.some((e) => e.bounds?.width === 720 && e.bounds?.height === 520)
    ).toBe(true)
    for (const entry of evidence) {
      expect(entry.review.complete).toBe(true)
      expect(entry.review.findings).toEqual([])
      expect(entry.overlaps).toEqual([])
    }
    await testInfo.attach('live-review', {
      body: JSON.stringify(evidence),
      contentType: 'application/json'
    })
    await page.getByRole('button', { name: 'Close Agent panel' }).click()
    await page.evaluate(async () => {
      ;(
        await import('../src/common-apis/selection')
      ).selectionApis.clearSelection()
      ;(await import('../src/common-apis/viewport')).viewportApis.zoomFit()
    })
    await page.screenshot({ path: testInfo.outputPath('live-layout.png') })
  } finally {
    if (testInfo.status !== testInfo.expectedStatus)
      await page.screenshot({ path: testInfo.outputPath('live-failure.png') })
    const stop = page.getByRole('button', { name: 'Stop', exact: true })
    if (await stop.isVisible()) await stop.click()
  }
})

test('artifact-targeted mixed batch uses normal actions and one Undo/Redo boundary', async ({
  page
}, testInfo) => {
  const { createLocalOperationTools } =
    await import('../server/local-operation-tools')
  const available = [
    AiActionNames.APPLY_PREPARED_DESIGN,
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    AiActionNames.SET_ELEMENT_VISIBILITY
  ].map((name) => ({ name, description: name, inputSchema: {} }))
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
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({ json: batch })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
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
