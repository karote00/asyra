import {
  parseLocalVectorArtifact,
  prepareLocalVectorArtifact
} from '../server/local-vector-artifact'
import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { createTestDocumentIdentity, waitForAppReady } from './test-utils'

for (const source of ['text', 'image'] as const) {
  test(`local subscription creates an editable ${source} drawing through the real Agent panel`, async ({
    page
  }, testInfo) => {
    test.skip(
      process.env.E2E_LOCAL_AI !== 'true',
      'Requires an explicitly enabled local subscription'
    )
    test.setTimeout(180_000)
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
    await testInfo.attach('action-batch.json', {
      body: await response.body(),
      contentType: 'application/json'
    })
    await writeFile(
      testInfo.outputPath('action-batch.json'),
      await response.body()
    )
    expect(response.status()).toBe(200)
    const message = page.getByTestId('ai-agent-message')
    await expect(message).toHaveAttribute(
      'data-outcome',
      /success|failed|failure/,
      { timeout: 15_000 }
    )
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
      expect(elements.every((element) => element.type === 'vector')).toBe(true)
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
  const vectors = elements.filter(({ type }) => type === 'vector')
  expect(vectors).toHaveLength(36)
  expect(elements.filter(({ type }) => type === 'oval')).toEqual([
    expect.objectContaining({
      name: 'path-1',
      computed: expect.objectContaining({ width: 240, height: 240 })
    })
  ])
  expect(vectors.map(({ name }) => name)).not.toContain('path-22')
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
