import {
  parseLocalVectorArtifact,
  prepareLocalVectorArtifact
} from '../server/local-vector-artifact'
import { writeFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import {
  getCoreDocumentDigest,
  getUndoHistoryDepth,
  undo,
  redo,
  createTestDocumentIdentity,
  waitForAppReady
} from './test-utils'

const captureProviderFrames = async (page: Page, outputPath: string) => {
  const frames: string[] = []
  await page.exposeFunction('recordReviewFrame', async (line: string) => {
    frames.push(line)
    await writeFile(outputPath, frames.join(''))
  })
  await page.addInitScript(() => {
    const original = window.fetch
    window.fetch = async (...args) => {
      const response = await original(...args)
      if (
        response.headers.get('content-type')?.includes('application/x-ndjson')
      ) {
        const body = response.clone().body
        if (!body) throw new Error('Missing response stream')
        const reader = body.getReader()
        void (async () => {
          const decoder = new TextDecoder()
          try {
            while (true) {
              const chunk = await reader.read()
              if (chunk.done) break
              await (
                window as unknown as {
                  recordReviewFrame: (line: string) => Promise<void>
                }
              ).recordReviewFrame(decoder.decode(chunk.value, { stream: true }))
            }
          } catch {
            /* The test records partial frames when runtime cancels delivery. */
          }
        })()
      }
      return response
    }
  })
  return frames
}

for (const source of ['text', 'image'] as const) {
  test(`local subscription creates an editable ${source} drawing through the real Agent panel`, async ({
    page
  }, testInfo) => {
    test.skip(
      process.env.E2E_LOCAL_AI !== 'true',
      'Requires an explicitly enabled local subscription'
    )
    test.setTimeout(180_000)
    const frames = await captureProviderFrames(
      page,
      testInfo.outputPath('action-batch.ndjson')
    )
    const identity = createTestDocumentIdentity()
    await page.goto(identity.url)
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await expect(page.getByText('Local AI connected')).toBeVisible({
      timeout: 15_000
    })
    const responsePromise = page.waitForResponse(
      (response) => response.url().endsWith('/api/ai/action-batch'),
      { timeout: 150_000 }
    )
    if (source === 'image')
      await page
        .getByLabel('Choose images')
        .setInputFiles('e2e/fixtures/local-vector-reference.png')
    await page
      .getByLabel('Message Agent')
      .fill(
        source === 'text'
          ? '請畫一個 100×100 的藍色圓形。'
          : 'Use the registered VTracer tool to vectorize the entire attached 64x64 image exactly, preserving its blue square and white background, and insert the resulting editable vectors at original size. Do not redraw or approximate the reference.'
      )
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    const response = await responsePromise
    await writeFile(
      testInfo.outputPath('provider-input.json'),
      response.request().postData() ?? '{}'
    )
    expect(response.status()).toBe(200)
    const message = page.getByTestId('ai-agent-message')
    await expect(message).toHaveAttribute(
      'data-outcome',
      /success|failed|failure/,
      { timeout: 150_000 }
    )
    await writeFile(testInfo.outputPath('action-batch.ndjson'), frames.join(''))
    await expect(message).toHaveAttribute('data-outcome', 'success')
    const elements = await page.evaluate(async () => {
      const core = (await import('../src/testing/runtime-access')).core
      if (!core) throw new Error('App runtime unavailable')
      return [...core.deps.sceneTree.getAllElements().values()]
        .filter(
          (element) =>
            !['workspace', 'group'].includes(String(element.get('type')))
        )
        .map((element) => ({
          type: element.get('type'),
          computed: element.getAllComputedData()
        }))
    })
    expect(elements.length).toBeGreaterThan(0)
    const blue = elements.find((element) =>
      (element.computed as { fills?: { color: string }[] }).fills?.some(
        (fill) => fill.color.toUpperCase() === '#0000FF'
      )
    )
    expect(blue).toBeTruthy()
    if (source === 'text') {
      expect(blue).toMatchObject({
        type: 'oval',
        computed: { width: 100, height: 100 }
      })
    } else {
      expect(blue?.type).toBe('rect')
      expect(
        elements.every((element) =>
          ['vector', 'rect', 'oval'].includes(element.type as string)
        )
      ).toBe(true)
    }
    await testInfo.attach('canonical-elements.json', {
      body: JSON.stringify(elements),
      contentType: 'application/json'
    })
    await page.screenshot({ path: testInfo.outputPath('local-ai-drawing.png') })
  })
}

test('local subscription continues a text-only drawing after a detail choice', async ({
  page
}) => {
  test.skip(
    process.env.E2E_LOCAL_AI !== 'true',
    'Requires an explicitly enabled local subscription'
  )
  test.setTimeout(180_000)
  await page.route(
    '**/api/ai/action-batch',
    (route) =>
      route.fulfill({
        json: {
          batchId: 'detail-question',
          actions: [
            {
              id: 'question',
              name: 'request_drawing_detail_choice',
              arguments: {},
              summary: 'Choose detail'
            }
          ]
        }
      }),
    { times: 1 }
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Draw one blue circle, 100 pixels wide and 100 pixels tall.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await page.getByRole('button', { name: 'Choose Balanced detail' }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'success',
    { timeout: 150_000 }
  )
  const circles = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('App unavailable')
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter((element) => element.get('type') === 'oval')
      .map((element) => element.getAllComputedData())
  })
  expect(circles).toEqual([
    expect.objectContaining({
      width: 100,
      height: 100,
      fills: expect.arrayContaining([
        expect.objectContaining({ color: '#0000FF' })
      ])
    })
  ])
})

test('local subscription traces the reference logo at 240px without its separate mark', async ({
  page
}, testInfo) => {
  test.skip(
    process.env.E2E_LOCAL_AI !== 'true',
    'Requires an explicitly enabled local subscription'
  )
  test.setTimeout(330_000)
  const identity = createTestDocumentIdentity()
  await page.goto(identity.url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await expect(page.getByText('Local AI connected')).toBeVisible({
    timeout: 15_000
  })
  await page
    .getByLabel('Choose images')
    .setInputFiles('e2e/fixtures/reference-logo.png')
  await page
    .getByLabel('Message Agent')
    .fill('畫這個 Logo，尺寸 240*240 px，不要右下角 TM 的字')
  const started = Date.now()
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  const messages = page.getByTestId('ai-agent-message')
  await expect(messages.last()).toHaveAttribute(
    'data-outcome',
    /success|failed|failure/,
    { timeout: 305_000 }
  )
  const balanced = page.getByRole('button', { name: /Balanced detail/ })
  if (await balanced.isVisible()) {
    await balanced.click()
    await expect(messages.last()).toHaveAttribute(
      'data-outcome',
      /success|failed|failure/,
      { timeout: 305_000 }
    )
  }
  await expect(messages.last()).toHaveAttribute('data-outcome', 'success')
  const elements = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('App runtime unavailable')
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter((element) => element.get('type') !== 'workspace')
      .map((element) => ({
        id: element.id,
        type: element.get('type'),
        name: element.get('name'),
        computed: element.getAllComputedData()
      }))
  })
  const shapes = elements.filter(({ type }) => type !== 'group')
  expect(shapes).toHaveLength(37)
  expect(shapes.map(({ name }) => name).sort()).toEqual(
    Array.from({ length: 38 }, (_, index) => `path-${index + 1}`)
      .filter((name) => name !== 'path-22')
      .sort()
  )
  expect(shapes.find(({ name }) => name === 'path-1')).toMatchObject({
    type: 'oval',
    computed: { width: 240, height: 240 }
  })
  expect(elements.find(({ type }) => type === 'group')).toMatchObject({
    computed: { width: 240, height: 240 }
  })
  await writeFile(
    testInfo.outputPath('reference-state.json'),
    JSON.stringify({
      url: page.url(),
      elapsedMs: Date.now() - started,
      elements
    })
  )
  await page.screenshot({ path: testInfo.outputPath('reference-logo.png') })
  await page.screenshot({
    path: testInfo.outputPath('reference-detail.png'),
    clip: { x: 240, y: 40, width: 400, height: 360 }
  })
})

test('local subscription uses acknowledged drawing IDs for a dependent edit in one undo', async ({
  page
}, testInfo) => {
  test.skip(
    process.env.E2E_LOCAL_AI !== 'true',
    'Requires a local subscription'
  )
  test.setTimeout(330_000)
  const { getUndoHistoryDepth, undo, redo, getCoreDocumentDigest } =
    await import('./test-utils')
  const receipts: Promise<string>[] = []
  page.on('response', (response) => {
    if (
      response.url().endsWith('/api/ai/action-batch') &&
      response.headers()['content-type']?.includes('application/x-ndjson')
    )
      receipts.push(response.text())
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await expect(page.getByText('Local AI connected')).toBeVisible({
    timeout: 15_000
  })
  await page
    .getByLabel('Choose images')
    .setInputFiles('e2e/fixtures/reference-logo.png')
  await page
    .getByLabel('Message Agent')
    .fill(
      'Trace this image at 240 by 240 pixels with VTracer. First insert all paths, including TM, using the backend operation. After the app reports the actual created element IDs, use the registered visibility operation to hide only the separate TM mark at the lower right. Do not exclude the mark before insertion. Finish by explaining the result.'
    )
  const started = Date.now()
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'success',
    { timeout: 305_000 }
  )
  const frames = (await Promise.all(receipts)).flatMap((body) =>
    body
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
  )
  const batches = frames.filter((frame) => frame.type === 'batch')
  expect(batches.length).toBeGreaterThanOrEqual(2)
  expect(
    batches.flatMap((frame) =>
      frame.batch.actions.map((action: { name: string }) => action.name)
    )
  ).toContain('set_element_visibility')
  const visibility = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter((element) =>
        ['oval', 'vector'].includes(String(element.get('type')))
      )
      .map((element) => ({
        name: element.get('name'),
        visible: element.get('visible')
      }))
  })
  expect(visibility).toHaveLength(38)
  expect(visibility.filter((element) => element.visible === false)).toEqual([
    { name: 'path-22', visible: false }
  ])
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  const after = await getCoreDocumentDigest(page)
  const elapsedMs = Date.now() - started
  await writeFile(
    testInfo.outputPath('operation-evidence.json'),
    JSON.stringify({
      elapsedMs,
      batchCount: batches.length,
      actionNames: batches.flatMap((frame) =>
        frame.batch.actions.map((action: { name: string }) => action.name)
      ),
      undoEntries: 1
    })
  )
  await page.screenshot({ path: testInfo.outputPath('dependent-edit.png') })
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
})

test('backend-selected circles become native Ovals through the ordinary Agent action', async ({
  page
}, testInfo) => {
  const artifact = parseLocalVectorArtifact(
    '<svg width="100" height="100"><path d="M50,0L85,15L100,50L85,85L50,100L15,85L0,50L15,15Z" fill="#008800"/></svg>'
  )
  const drawing = prepareLocalVectorArtifact(artifact, {
    imageArtifactId: artifact.imageArtifactId,
    compositionRole: 'Native circle',
    bounds: { x: 50, y: 50, width: 240, height: 240 },
    excludePathIds: [],
    ovalPathIds: ['path-1']
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({
      json: {
        batchId: 'native-oval',
        actions: [
          {
            id: 'draw',
            name: 'insert_vector_composition',
            arguments: drawing,
            summary: 'Draw the circle'
          }
        ]
      }
    })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Draw a 240 by 240 green circle using Oval.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  const elements = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('App runtime unavailable')
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter(
        (element) =>
          !['workspace', 'group'].includes(String(element.get('type')))
      )
      .map((element) => ({
        type: element.get('type'),
        computed: element.getAllComputedData()
      }))
  })
  expect(elements).toHaveLength(1)
  expect(elements[0]).toMatchObject({
    type: 'oval',
    computed: { width: 240, height: 240 }
  })
  expect(drawing.pointCount).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('native-oval.png') })
})

test('rendered inspection is fresh after repeated edits and remains one Undo', async ({
  page
}, testInfo) => {
  const artifact = parseLocalVectorArtifact(
    '<svg width="100" height="100"><path d="M50,0L100,50L50,100L0,50Z" fill="#FF0000"/></svg>'
  )
  const drawing = prepareLocalVectorArtifact(artifact, {
    imageArtifactId: artifact.imageArtifactId,
    compositionRole: 'Review drawing',
    bounds: { x: 50, y: 50, width: 100, height: 100 },
    excludePathIds: [],
    ovalPathIds: ['path-1']
  })
  const id = drawing.slices[0].descriptors[0].id
  const receipts: {
    actionResults: {
      actionName: string
      result: {
        available: boolean
        image: { dataUrl: string; width: number }
        elements: { id: string }[]
      }
    }[]
  }[] = []
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', async (route) => {
    if (route.request().headers()['x-ai-batch-receipt']) {
      receipts.push(route.request().postDataJSON())
      return route.fulfill({ json: { accepted: true } })
    }
    const actions = [
      { name: 'insert_vector_composition', arguments: drawing },
      {
        name: 'inspect_drawing',
        arguments: { elementId: drawing.groupDescriptor.id }
      },
      {
        name: 'update_composition_elements',
        arguments: {
          updates: [{ elementId: id, style: { fillColor: '#0000FF' } }]
        }
      },
      {
        name: 'inspect_drawing',
        arguments: { elementId: drawing.groupDescriptor.id }
      },
      {
        name: 'update_composition_elements',
        arguments: {
          updates: [{ elementId: id, style: { fillColor: '#00FF00' } }]
        }
      },
      {
        name: 'inspect_drawing',
        arguments: { elementId: drawing.groupDescriptor.id }
      }
    ]
    const frames: unknown[] = actions.map((action, index) => ({
      type: 'batch',
      receiptToken: `${String(index + 1).repeat(8)}-1111-1111-1111-111111111111`,
      batch: {
        batchId: `review-${index}`,
        actions: [
          {
            ...action,
            id: `action-${index}`,
            summary: 'Review and refine drawing'
          }
        ]
      }
    }))
    frames.push({
      type: 'result',
      batch: {
        batchId: 'done',
        actions: [
          {
            id: 'report',
            name: 'report_outcome',
            arguments: {
              outcome: 'completed',
              message: 'The drawing has been reviewed.'
            },
            summary: 'Done'
          }
        ]
      }
    })
    return route.fulfill({
      contentType: 'application/x-ndjson',
      body: frames.map((frame) => JSON.stringify(frame)).join('\n')
    })
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Draw, inspect, and refine the circle twice.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  const inspections = receipts
    .flatMap((receipt) => receipt.actionResults)
    .filter((result) => result.actionName === 'inspect_drawing')
    .map((result) => result.result)
  expect(inspections).toHaveLength(3)
  expect(inspections.every((result) => result.available)).toBe(true)
  expect(new Set(inspections.map((result) => result.image.dataUrl)).size).toBe(
    3
  )
  const pixels = await page.evaluate(
    async (images) =>
      Promise.all(
        images.map(async (dataUrl) => {
          const image = new Image()
          image.src = dataUrl
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas context unavailable')
          ctx.drawImage(image, 0, 0)
          return [
            ...ctx.getImageData(
              Math.floor(image.width / 2),
              Math.floor(image.height / 2),
              1,
              1
            ).data
          ]
        })
      ),
    inspections.map((result) => result.image.dataUrl)
  )
  expect(pixels).toEqual([
    [255, 0, 0, 255],
    [0, 0, 255, 255],
    [0, 255, 0, 255]
  ])
  for (const [index, inspection] of inspections.entries()) {
    expect(inspection.image.width).toBeLessThanOrEqual(1024)
    expect(
      inspection.elements.map((element: { id: string }) => element.id)
    ).toContain(id)
    await writeFile(
      testInfo.outputPath(`inspection-${index}.png`),
      Buffer.from(inspection.image.dataUrl.split(',')[1], 'base64')
    )
  }
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  const after = await getCoreDocumentDigest(page)
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
})

test('local subscription receives fresh images during repeated refinement', async ({
  page
}, testInfo) => {
  test.skip(
    process.env.E2E_LOCAL_AI !== 'true',
    'Requires an explicitly enabled local subscription'
  )
  test.setTimeout(300_000)
  const images: string[] = []
  const frames = await captureProviderFrames(
    page,
    testInfo.outputPath('action-batch.ndjson')
  )
  page.on('request', (request) => {
    if (!request.headers()['x-ai-batch-receipt']) return
    const receipt = request.postDataJSON()
    for (const entry of receipt.actionResults ?? []) {
      if (entry.actionName === 'inspect_drawing' && entry.result.available)
        images.push(entry.result.image.dataUrl)
    }
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await expect(page.getByText('Local AI connected')).toBeVisible({
    timeout: 15_000
  })
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/ai/action-batch') &&
      !response.request().headers()['x-ai-batch-receipt'],
    { timeout: 270_000 }
  )
  await page
    .getByLabel('Message Agent')
    .fill(
      'Create one native Oval, a red (#FF0000) circle 100 by 100 pixels. Inspect the actual image returned. Then change that same circle to blue (#0000FF), inspect the updated image, and finally change it to green (#00FF00) and inspect again. Use separate operations so each intermediate color is rendered. In your final message, say which three colors you actually saw in the returned images. Do not ask clarification.'
    )
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  const response = await responsePromise
  expect(response.status()).toBe(200)
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    /success|failure|failed|partial/,
    { timeout: 270_000 }
  )
  await writeFile(testInfo.outputPath('action-batch.ndjson'), frames.join(''))
  await writeFile(
    testInfo.outputPath('review-count.json'),
    JSON.stringify({ images: images.length })
  )
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  expect(new Set(images).size).toBeGreaterThanOrEqual(3)
  for (const [index, dataUrl] of images.entries())
    await writeFile(
      testInfo.outputPath(`review-${index}.png`),
      Buffer.from(dataUrl.split(',')[1], 'base64')
    )
  const circles = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('App runtime unavailable')
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter((element) => element.get('type') === 'oval')
      .map((element) => element.getAllComputedData())
  })
  expect(circles).toHaveLength(1)
  expect(circles[0]).toMatchObject({
    width: 100,
    height: 100,
    fills: expect.arrayContaining([
      expect.objectContaining({ color: '#00FF00' })
    ])
  })
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  await page.screenshot({ path: testInfo.outputPath('review-complete.png') })
  const after = await getCoreDocumentDigest(page)
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
})

test('backend component mappings render native Rectangle and Oval with remaining Vector', async ({
  page
}, testInfo) => {
  const artifact = parseLocalVectorArtifact(
    '<svg width="100" height="100"><path d="M0,0L40,0L40,40L0,40Z" fill="#FF0000"/><path d="M70,0L90,20L70,40L50,20Z" fill="#0000FF"/><path d="M0,60L40,100L0,100Z" fill="#00FF00"/></svg>'
  )
  const drawing = prepareLocalVectorArtifact(artifact, {
    imageArtifactId: artifact.imageArtifactId,
    compositionRole: 'Component review',
    bounds: { x: 50, y: 50, width: 180, height: 200 },
    excludePathIds: [],
    componentMappings: [
      { pathId: 'path-1', componentType: 'rect' },
      { pathId: 'path-2', componentType: 'oval' }
    ]
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({
      json: {
        batchId: 'components',
        actions: [
          {
            id: 'draw',
            name: 'insert_vector_composition',
            arguments: drawing,
            summary: 'Draw reviewed components'
          }
        ]
      }
    })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByLabel('Message Agent')
    .fill('Use the appropriate native components for this drawing.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  const types = await page.evaluate(async () => {
    const core = (await import('../src/testing/runtime-access')).core
    if (!core) throw new Error('App unavailable')
    return [...core.deps.sceneTree.getAllElements().values()]
      .filter(
        (element) =>
          !['group', 'workspace'].includes(String(element.get('type')))
      )
      .map((element) => element.get('type'))
      .sort()
  })
  expect(types).toEqual(['oval', 'rect', 'vector'])
  await page.screenshot({ path: testInfo.outputPath('component-mapping.png') })
})
