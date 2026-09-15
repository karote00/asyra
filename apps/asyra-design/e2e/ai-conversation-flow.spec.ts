import { expect, test } from '@playwright/test'
import { createPreparedDrawingArtifact } from './action-batch-interceptor'
import {
  createTestDocumentIdentity,
  getCoreDocumentDigest,
  getUndoHistoryDepth,
  undo,
  waitForAppReady
} from './test-utils'

const drawing = (seed: string) =>
  createPreparedDrawingArtifact(
    [
      {
        bounds: { x: 300, y: 100, width: 100, height: 100 },
        primitive: 'vector',
        role: 'reference-shape',
        paths: [
          {
            closed: true,
            points: [
              { x: 300, y: 100 },
              { x: 400, y: 100 },
              { x: 400, y: 200 },
              { x: 300, y: 200 }
            ]
          }
        ],
        style: { fillColor: '#0000FF' }
      }
    ],
    { batchId: seed, fileId: seed, compositionRole: 'reference' }
  )

for (const width of [360, 1280]) {
  test(`reference revision retains context after timeout and replaces in one undo at ${width}px`, async ({
    page
  }, testInfo) => {
    const initial = drawing('original')
    const replacement = drawing('replacement')
    const requests: {
      intent: string
      metadata: {
        imageAttachments?: unknown[]
        aiTargets: { compositionId: string }
      }
    }[] = []
    let release!: () => void
    const failedRequest = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.route('**/api/ai/action-batch', async (route) => {
      requests.push(route.request().postDataJSON())
      if (requests.length === 2) {
        await failedRequest
        await route.fulfill({
          status: 502,
          headers: { 'x-ai-error-code': 'ACTION_BATCH_MODEL_TIMEOUT' },
          json: { code: 'ACTION_BATCH_MODEL_TIMEOUT' }
        })
        return
      }
      const replacing = requests.length > 2
      await route.fulfill({
        json: {
          batchId: `revision-${requests.length}`,
          actions: [
            {
              id: 'draw',
              name: replacing
                ? 'replace_vector_composition'
                : 'insert_vector_composition',
              arguments: replacing
                ? {
                    compositionId:
                      requests[requests.length - 1].metadata.aiTargets
                        .compositionId,
                    drawing: replacement
                  }
                : initial,
              summary: { affectedCount: 1 }
            }
          ]
        }
      })
    })
    await page.setViewportSize({ width: 1280, height: 850 })
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await page.setViewportSize({ width, height: 850 })
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await expect(page.getByText('Local AI connected')).toBeVisible()
    await page.getByLabel('Message Agent').fill('Draw a blue reference shape')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
      'data-outcome',
      'success'
    )
    const before = await getCoreDocumentDigest(page)
    const depth = await getUndoHistoryDepth(page)
    await page
      .getByLabel('Choose images')
      .setInputFiles('e2e/fixtures/local-vector-reference.png')
    const intent =
      'Use VTracer on this reference and replace the previous drawing'
    await page.getByLabel('Message Agent').fill(intent)
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    const message = page.getByTestId('ai-agent-message').last()
    await expect(message).toHaveAttribute('data-outcome', 'active')
    await expect(message.getByLabel('Your message')).toContainText(intent)
    await expect(message.getByLabel('Agent response')).not.toContainText(intent)
    const bounds = await message.getByLabel('Your message').boundingBox()
    const panelBounds = await page.getByTestId('ai-agent-panel').boundingBox()
    if (!bounds || !panelBounds)
      throw new Error('Visible message and panel bounds are required')
    expect(bounds.x + bounds.width).toBeGreaterThan(
      panelBounds.x + panelBounds.width - 25
    )
    await page
      .getByTestId('ai-agent-panel')
      .screenshot({ path: testInfo.outputPath('active.png') })
    await page.getByRole('button', { name: 'Close Agent panel' }).click()
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await expect(message).toHaveAttribute('data-outcome', 'active')
    release()
    await expect(message).toHaveAttribute('data-outcome', 'failed')
    await expect(message).toContainText('timed out')
    expect(await getCoreDocumentDigest(page)).toEqual(before)
    await expect(page.getByLabel('Current AI history action')).toHaveCount(0)
    await page
      .getByTestId('ai-agent-panel')
      .screenshot({ path: testInfo.outputPath('timeout.png') })
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByLabel('AI action confirmation')).toBeVisible()
    expect(requests).toHaveLength(3)
    expect(requests[2].intent).toBe(intent)
    expect(requests[2].metadata.imageAttachments).toEqual(
      requests[1].metadata.imageAttachments
    )
    expect(requests[2].metadata.aiTargets.compositionId).toBe(
      initial.groupDescriptor.id
    )
    await page
      .getByTestId('ai-agent-panel')
      .screenshot({ path: testInfo.outputPath('approval.png') })
    await page.getByRole('button', { name: 'Approve', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
      'data-outcome',
      'success'
    )
    expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
    const ids = await page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')
      if (!core) throw new Error('App runtime is required')
      return [...core.deps.sceneTree.getAllElements().keys()]
    })
    expect(ids).toContain(replacement.groupDescriptor.id)
    expect(ids).not.toContain(initial.groupDescriptor.id)
    await page
      .getByTestId('ai-agent-panel')
      .screenshot({ path: testInfo.outputPath('success.png') })
    await undo(page)
    expect(await getCoreDocumentDigest(page)).toEqual(before)
  })
}

test('a free-text clarification continues the original drawing and cancellation leaves the canvas unchanged', async ({
  page
}, testInfo) => {
  let requests = 0
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', async (route) => {
    requests++
    if (requests === 1)
      return route.fulfill({
        json: {
          batchId: 'question',
          actions: [
            {
              id: 'ask',
              name: 'request_clarification',
              arguments: { question: 'Which drawing should I replace?' },
              summary: 'Choose a drawing'
            }
          ]
        }
      })
    expect(route.request().postDataJSON().metadata.replyTo.intent).toBe(
      'Replace a drawing'
    )
    await gate
    await route
      .fulfill({ status: 502, json: { code: 'ACTION_BATCH_MODEL_FAILED' } })
      .catch(() => undefined)
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.getByLabel('Message Agent').fill('Replace a drawing')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByText('Waiting for your answer')).toBeVisible()
  await page
    .getByTestId('ai-agent-panel')
    .screenshot({ path: testInfo.outputPath('question.png') })
  const before = await getCoreDocumentDigest(page)
  await page.getByLabel('Message Agent').fill('The blue drawing')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect.poll(() => requests).toBe(2)
  await page.getByRole('button', { name: 'Cancel request' }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'cancelled'
  )
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await page
    .getByTestId('ai-agent-panel')
    .screenshot({ path: testInfo.outputPath('stopped.png') })
  release()
})

test('incomplete replacement rolls back inserted content and partial output never offers blind retry', async ({
  page
}, testInfo) => {
  const initial = drawing('rollback-original')
  const incomplete = {
    ...drawing('incomplete'),
    skipped: [{ reason: 'duplicate-role', role: 'omitted-detail' }]
  }
  let requests = 0
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) => {
    requests++
    const replacing = requests === 2
    const content =
      requests === 1
        ? initial
        : { ...drawing('partial-result'), skipped: incomplete.skipped }
    return route.fulfill({
      json: {
        batchId: `rollback-${requests}`,
        actions: [
          {
            id: 'draw',
            name: replacing
              ? 'replace_vector_composition'
              : 'insert_vector_composition',
            arguments: replacing
              ? {
                  compositionId: initial.groupDescriptor.id,
                  drawing: incomplete
                }
              : content,
            summary: { affectedCount: 1 }
          }
        ]
      }
    })
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  const send = async (text: string) => {
    await page.getByLabel('Message Agent').fill(text)
    await page.getByRole('button', { name: 'Send', exact: true }).click()
  }
  await send('Draw the original')
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'success'
  )
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  await send('Replace the original')
  await page.getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'failed'
  )
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  expect(await getUndoHistoryDepth(page)).toBe(depth)
  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)
  await send('Add a separate drawing')
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'partial'
  )
  await expect(
    page
      .getByTestId('ai-agent-panel')
      .getByText('Partially updated the drawing: 1 applied, 1 skipped.')
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)
  await expect(page.getByLabel('Message Agent')).toBeInViewport()
  await expect(
    page.getByRole('button', { name: 'Send', exact: true })
  ).toBeInViewport()
  await page
    .getByTestId('ai-agent-panel')
    .screenshot({ path: testInfo.outputPath('partial.png') })
})
