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
  expect(vectors).toHaveLength(37)
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
