import { createServer, type ServerResponse } from 'node:http'
import { prepareDesign } from '../server/design-preparation'
import { expect, test } from '@playwright/test'
import { createPreparedDrawingArtifact } from './action-batch-interceptor'
import {
  createTestDocumentIdentity,
  getActiveTool,
  getCoreDocumentDigest,
  getUndoHistoryDepth,
  undo,
  redo,
  waitForAppReady
} from './test-utils'

test('retains drawing after a failed refinement with one undo and redo', async ({
  page
}, testInfo) => {
  const prepared = drawing('retained-progress')
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) => {
    if (route.request().headers()['x-ai-batch-receipt'])
      return route.fulfill({ json: { accepted: true } })
    return route.fulfill({
      contentType: 'application/x-ndjson',
      body: [
        {
          type: 'batch',
          receiptToken: '11111111-1111-1111-1111-111111111111',
          batch: {
            batchId: 'insert',
            actions: [
              {
                id: 'draw',
                name: 'insert_vector_composition',
                arguments: prepared,
                summary: 'Add drawing'
              }
            ]
          }
        },
        {
          type: 'result',
          batch: {
            batchId: 'refine',
            actions: [
              {
                id: 'refine',
                name: 'update_composition_elements',
                arguments: { updates: null },
                summary: 'Refine drawing'
              }
            ]
          }
        }
      ]
        .map((frame) => JSON.stringify(frame))
        .join('\n')
    })
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.getByLabel('Message Agent').fill('Draw and refine')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'partial'
  )
  await expect(page.getByTestId('ai-agent-message')).toContainText(
    'Refining the drawing could not be completed. Changes already applied have been kept.'
  )
  await expect(
    page.getByRole('button', { name: 'Try again', exact: true })
  ).toHaveCount(0)
  const after = await getCoreDocumentDigest(page)
  expect(after).not.toEqual(before)
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  await page.screenshot({ path: testInfo.outputPath('retained-drawing.png') })
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(after)
})

for (const width of [360, 1280]) {
  test(`opening the Agent immediately discloses personal subscription usage at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    let providerRequests = 0
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'unconfigured' } })
    )
    await page.route('**/api/ai/action-batch', (route) => {
      providerRequests++
      return route.abort()
    })
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await page.setViewportSize({ width, height: 720 })
    await page.getByRole('button', { name: 'Open Agent' }).click()
    const notice = page.getByRole('note', { name: 'Your AI subscription' })
    await expect(notice).toBeVisible()
    await expect(notice).toContainText(
      'Local AI uses your own subscription and counts toward its usage limits.'
    )
    await expect(page.getByLabel('Message Agent')).toBeEmpty()
    await expect(
      page.getByRole('button', { name: 'Send', exact: true })
    ).toBeInViewport()
    const bounds = await notice.boundingBox()
    if (!bounds) throw new Error('Subscription notice has no visible bounds')
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    await page.getByTestId('ai-agent-panel').screenshot({
      path: testInfo.outputPath('subscription-notice.png')
    })
    await page.getByRole('button', { name: 'Close Agent panel' }).click()
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await expect(notice).toBeVisible()
    expect(providerRequests).toBe(0)
  })
}

test('canvas click restores shortcuts while the Agent stays open and preserves composer editing', async ({
  page
}, testInfo) => {
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.keyboard.press('r')
  await page
    .getByTestId('canvas-render-container')
    .locator('canvas')
    .click({ position: { x: 500, y: 350 } })
  await page.keyboard.press('v')
  await page.keyboard.press('ControlOrMeta+i')
  const composer = page.getByLabel('Message Agent')
  await expect(composer).toBeFocused()
  await composer.fill('Keep this draft')
  const canvas = page.getByTestId('canvas-render-container').locator('canvas')
  await canvas.click({ position: { x: 500, y: 350 } })
  await expect(page.getByTestId('canvas-host')).toBeFocused()
  for (const [key, tool] of [
    ['r', 'rectangle'],
    ['o', 'oval'],
    ['v', 'select']
  ]) {
    await page.keyboard.press(key)
    await expect.poll(() => getActiveTool(page)).toBe(tool)
  }
  await expect(page.getByTestId('ai-agent-panel')).toBeVisible()
  await expect(composer).toHaveValue('Keep this draft')
  await composer.click()
  await page.keyboard.press('r')
  await expect(composer).toBeFocused()
  expect(await getActiveTool(page)).toBe('select')
  await canvas.click({ position: { x: 500, y: 350 } })
  await page.keyboard.press('o')
  await expect.poll(() => getActiveTool(page)).toBe('oval')
  await page.screenshot({
    path: testInfo.outputPath('canvas-focus-agent-open.png')
  })
})

test('text answers keep the original reference only on its message and typing never switches canvas tools', async ({
  page
}, testInfo) => {
  const requests: { metadata: { imageAttachments?: unknown[] } }[] = []
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) => {
    requests.push(route.request().postDataJSON())
    return route.fulfill({
      json: {
        batchId: `question-${requests.length}`,
        actions: [
          {
            id: 'ask',
            name: 'request_clarification',
            arguments: { question: 'Keep the original dimensions?' },
            summary: 'Confirm dimensions'
          }
        ]
      }
    })
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  const composer = page.getByLabel('Message Agent')
  await composer.click()
  for (const key of ['r', 'o', 'p', 'v', 'Backspace', 'Space']) {
    await page.keyboard.press(key)
    expect(await getActiveTool(page)).toBe('select')
    await expect(composer).toBeFocused()
  }
  await page
    .getByLabel('Choose images')
    .setInputFiles('e2e/fixtures/local-vector-reference.png')
  await composer.fill('Draw this reference at 240 by 240')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByText('Waiting for your answer')).toBeVisible()
  await expect(page.getByLabel('Completed at')).toHaveCount(0)
  await expect(page.getByLabel('Question')).toBeVisible()
  expect(
    await page.getByLabel('Operational progress').evaluate((list) => {
      const question = document.querySelector('[aria-label="Question"]')
      return Boolean(
        question &&
        list.compareDocumentPosition(question) &
          Node.DOCUMENT_POSITION_FOLLOWING
      )
    })
  ).toBe(true)
  const firstActivity = page
    .getByTestId('ai-agent-message')
    .first()
    .locator('details')
  await firstActivity.locator('summary').click()
  const priorActivity = await firstActivity
    .getByRole('listitem')
    .allTextContents()
  expect(priorActivity).toContain('Reviewing the drawing')
  await composer.fill('Yes, keep the dimensions')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveCount(2)
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'no-change'
  )
  await expect(
    page.getByLabel('Your message').first().getByRole('img')
  ).toHaveCount(1)
  await expect(
    page.getByLabel('Your message').last().getByRole('img')
  ).toHaveCount(0)
  await expect(firstActivity).toHaveAttribute('open', '')
  await expect(firstActivity.getByRole('listitem')).toHaveText(priorActivity)
  const nextActivity = page
    .getByTestId('ai-agent-message')
    .last()
    .locator('details')
  await nextActivity.locator('summary').click()
  await expect(nextActivity.getByRole('list')).toBeVisible()
  expect(requests[1].metadata.imageAttachments).toEqual(
    requests[0].metadata.imageAttachments
  )
  await page
    .getByTestId('ai-agent-panel')
    .screenshot({ path: testInfo.outputPath('text-answer.png') })
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await page.keyboard.press('r')
  await expect.poll(() => getActiveTool(page)).toBe('rectangle')
})

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
    await page.setViewportSize({ width, height: 900 })
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
    await page.getByLabel('Message Agent').fill('r')
    expect(await getActiveTool(page)).toBe('select')
    await page.getByLabel('Message Agent').fill('')
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
    await expect(message.getByLabel('Completed at')).toHaveAttribute(
      'datetime',
      /.+/
    )
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
    await expect(page.getByLabel('Completed at').last()).toHaveAttribute(
      'datetime',
      /.+/
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

test('incomplete replacement preserves the original and partial output never offers blind retry', async ({
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
    'partial'
  )
  const retained = await getCoreDocumentDigest(page)
  expect(retained).not.toEqual(before)
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await redo(page)
  expect(await getCoreDocumentDigest(page)).toEqual(retained)
  await page.getByRole('button', { name: 'Open Agent' }).click()
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

for (const width of [360, 1280]) {
  test(`dependent batches keep one undo and explain a capability remainder at ${width}px`, async ({
    page
  }, testInfo) => {
    const prepared = drawing('multi-step')
    const receipts: unknown[] = []
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.route('**/api/ai/action-batch', async (route) => {
      if (route.request().headers()['x-ai-batch-receipt']) {
        receipts.push(route.request().postDataJSON())
        await route.fulfill({ json: { accepted: true } })
        return
      }
      const first = {
        batchId: 'insert-first',
        actions: [
          {
            id: 'insert',
            name: 'insert_vector_composition',
            arguments: prepared,
            summary: 'Draw reference'
          }
        ]
      }
      const second = {
        batchId: 'refine-next',
        actions: [
          {
            id: 'select',
            name: 'select_elements',
            arguments: { elementIds: [prepared.groupDescriptor.id] },
            summary: 'Select the created drawing'
          }
        ]
      }
      const final = {
        batchId: 'end',
        actions: [
          {
            id: 'report',
            name: 'report_outcome',
            arguments: {
              outcome: 'unsupported',
              message:
                'The vector drawing is ready. This app cannot generate a raster texture for it yet.'
            },
            summary: 'Explain the remaining limitation'
          }
        ]
      }
      await route.fulfill({
        contentType: 'application/x-ndjson',
        body: [
          {
            type: 'activity',
            tool: 'insert_vector_composition',
            status: 'running',
            message:
              'I am adding the vector drawing, then checking the requested texture.'
          },
          {
            type: 'batch',
            receiptToken: '11111111-1111-1111-1111-111111111111',
            batch: first
          },
          {
            type: 'batch',
            receiptToken: '22222222-2222-2222-2222-222222222222',
            batch: second
          },
          { type: 'result', batch: final }
        ]
          .map((frame) => JSON.stringify(frame))
          .join('\n')
      })
    })
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await page.setViewportSize({ width, height: 900 })
    const before = await getCoreDocumentDigest(page)
    const depth = await getUndoHistoryDepth(page)
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await page
      .getByLabel('Message Agent')
      .fill(
        'Draw the reference, select it, and add a raster texture if supported.'
      )
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
      'data-outcome',
      'partial'
    )
    await expect(
      page
        .getByTestId('ai-agent-message')
        .getByText('Earlier changes are kept.', { exact: false })
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Edit request', exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Try again', exact: true })
    ).toHaveCount(0)
    expect(receipts).toHaveLength(2)
    await expect(page.getByLabel('Completed at').last()).toHaveAttribute(
      'datetime',
      /.+/
    )
    expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
    const after = await getCoreDocumentDigest(page)
    expect(after).not.toEqual(before)
    await page.screenshot({
      path: testInfo.outputPath('multi-step-capability.png')
    })
    await page.getByRole('button', { name: 'Close Agent panel' }).click()
    await undo(page)
    expect(await getCoreDocumentDigest(page)).toEqual(before)
    await redo(page)
    expect(await getCoreDocumentDigest(page)).toEqual(after)
  })
}

for (const width of [360, 1280]) {
  test(`current activity matches the streamed history at ${width}px`, async ({
    page
  }, testInfo) => {
    let response: ServerResponse | undefined
    let connected: (() => void) | undefined
    const connection = new Promise<void>((resolve) => {
      connected = resolve
    })
    const server = createServer((request, outgoing) => {
      request.resume()
      outgoing.writeHead(200, {
        'content-type': 'application/x-ndjson',
        'access-control-allow-origin': '*'
      })
      outgoing.flushHeaders()
      response = outgoing
      connected?.()
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string')
      throw new Error('Missing fixture address')
    try {
      await page.route('**/api/ai/status', (route) =>
        route.fulfill({ json: { state: 'ready' } })
      )
      await page.route('**/api/ai/action-batch', (route) =>
        route.continue({
          url: `http://127.0.0.1:${address.port}/api/ai/action-batch`
        })
      )
      await page.goto(createTestDocumentIdentity().url)
      await waitForAppReady(page)
      await page.setViewportSize({ width, height: 900 })
      await page.getByRole('button', { name: 'Open Agent' }).click()
      await page
        .getByLabel('Message Agent')
        .fill('Trace the reference, then change visibility')
      await page.getByRole('button', { name: 'Send', exact: true }).click()
      await connection
      if (!response) throw new Error('Missing stream')
      await page.getByLabel('Work history').click()
      const status = page.getByRole('status', { name: 'Current activity' })
      const current = page
        .getByLabel('Operational progress')
        .locator('[aria-current="step"]')
      await expect(
        page.getByLabel('Design context', { exact: true })
      ).toHaveCount(0)
      const events = [
        {
          tool: 'research_design_context',
          status: 'running',
          label: 'Researching design context'
        },
        {
          tool: 'research_design_context',
          status: 'completed',
          label: 'Researching design context'
        },
        {
          tool: 'search_reference_images',
          status: 'running',
          label: 'Researching design context'
        },
        {
          tool: 'search_reference_images',
          status: 'completed',
          label: 'Researching design context'
        },
        {
          tool: 'import_reference_image',
          status: 'running',
          label: 'Researching design context'
        },
        {
          tool: 'vtracer',
          status: 'running',
          label: 'Converting artwork to vectors'
        },
        {
          tool: 'vtracer',
          status: 'completed',
          label: 'Converting artwork to vectors'
        },
        {
          tool: 'analyze_vector',
          status: 'completed',
          label: 'Converting artwork to vectors'
        },
        {
          tool: 'prepare_design',
          status: 'running',
          label: 'Drawing and refining'
        },
        {
          tool: 'prepare_design',
          status: 'completed',
          label: 'Drawing and refining'
        },
        {
          tool: 'inspect_drawing',
          status: 'running',
          label: 'Drawing and refining'
        },
        {
          tool: 'update_design_element',
          status: 'running',
          label: 'Drawing and refining'
        },
        {
          tool: 'set_element_visibility',
          status: 'running',
          label: 'Adjusting element visibility',
          message: '正在隱藏右下角的標記。'
        }
      ]
      const firstRow = page
        .getByLabel('Operational progress')
        .locator('li')
        .first()
      const originalRow = await firstRow.elementHandle()
      const originalText = await firstRow.textContent()
      if (!originalRow || originalText === null)
        throw new Error('Missing original Activity row')
      const originalOffset = await firstRow.evaluate(
        (row) =>
          row.getBoundingClientRect().top -
          (row.closest('section')?.getBoundingClientRect().top ?? 0)
      )
      for (const event of events) {
        response.write(
          JSON.stringify({
            type: 'activity',
            tool: event.tool,
            status: event.status,
            message: event.message
          }) + '\n'
        )
        await expect(status).toHaveText(event.message ?? event.label)
        await expect(current).toHaveCount(1)
        await expect(current).toHaveText(event.message ?? event.label)
        expect(await originalRow.evaluate((row) => row.isConnected)).toBe(true)
        await expect(firstRow).toHaveText(originalText)
        expect(
          await firstRow.evaluate(
            (row) =>
              row.getBoundingClientRect().top -
              (row.closest('section')?.getBoundingClientRect().top ?? 0)
          )
        ).toBe(originalOffset)
        await expect(
          page.getByText('Running a tool', { exact: true })
        ).toHaveCount(0)
      }
      await expect(
        page
          .getByLabel('Operational progress')
          .getByText('Researching design context', { exact: true })
      ).toHaveCount(1)
      await expect(
        page
          .getByLabel('Operational progress')
          .getByText('Drawing and refining', { exact: true })
      ).toHaveCount(1)
      const rowGaps = await page
        .getByLabel('Operational progress')
        .locator('li')
        .evaluateAll((rows) =>
          rows
            .slice(1)
            .map(
              (row, i) =>
                row.getBoundingClientRect().top -
                rows[i].getBoundingClientRect().bottom
            )
        )
      expect(Math.max(...rowGaps) - Math.min(...rowGaps)).toBeLessThan(1)
      await expect(current).toContainText('正在隱藏右下角的標記。')
      await page
        .getByTestId('ai-agent-panel')
        .screenshot({ path: testInfo.outputPath('current-activity.png') })
      const feed = page.getByRole('region', { name: 'Conversation messages' })
      const jump = page.getByRole('button', { name: 'Jump to latest' })
      const remainingScroll = () =>
        feed.evaluate(
          (element) =>
            element.scrollHeight - element.scrollTop - element.clientHeight
        )
      const sendActivity = async (message: string) => {
        response?.write(
          JSON.stringify({
            type: 'activity',
            tool: 'vtracer',
            status: 'completed',
            message
          }) + '\n'
        )
        await expect(current).toContainText(message)
      }
      // A short feed starts following without an initial scroll gesture.
      await expect.poll(remainingScroll).toBeLessThanOrEqual(1)
      for (let index = 0; index < 20; index++) {
        await sendActivity(`Review pass ${index + 1}`)
        await expect.poll(remainingScroll).toBeLessThanOrEqual(1)
        await expect(jump).toHaveCount(0)
      }
      expect(
        await feed.evaluate((element) => element.scrollTop)
      ).toBeGreaterThan(0)
      await expect(current).toBeInViewport()
      // Even a small deliberate upward scroll pauses following.
      await feed.evaluate((element) => {
        element.scrollTop -= 20
      })
      await expect(jump).toBeVisible()
      const readingPosition = await feed.evaluate(
        (element) => element.scrollTop
      )
      await sendActivity('Continue while reading history')
      expect(await feed.evaluate((element) => element.scrollTop)).toBe(
        readingPosition
      )
      await expect(jump).toBeVisible()
      // Returning to the bottom restores following for the next update.
      await feed.evaluate((element) => {
        element.scrollTop = element.scrollHeight
      })
      await expect(jump).toHaveCount(0)
      await sendActivity('Continue at the bottom')
      await expect.poll(remainingScroll).toBeLessThanOrEqual(1)
      await expect(current).toBeInViewport()
      await page.getByTestId('ai-agent-panel').screenshot({
        path: testInfo.outputPath('activity-following.png')
      })
      // Real layout regression: collapsing a long history at scrollTop zero
      // must clear the jump affordance without relying on a scroll event.
      const rowsBeforeLoop = await page
        .getByLabel('Operational progress')
        .locator('li')
        .count()
      for (let index = 0; index < 24; index++) {
        response.write(
          JSON.stringify({
            type: 'activity',
            tool: 'vtracer',
            status: index % 2 === 0 ? 'running' : 'completed'
          }) + '\n'
        )
      }
      await expect(
        page.getByLabel('Operational progress').locator('li')
      ).toHaveCount(rowsBeforeLoop + 1)
      response.end(
        JSON.stringify({
          type: 'result',
          batch: {
            batchId: 'activity-result',
            actions: [
              {
                id: 'report',
                name: 'report_outcome',
                arguments: {
                  outcome: 'completed',
                  message: 'No canvas changes were needed.'
                },
                summary: 'Report result'
              }
            ]
          }
        }) + '\n'
      )
      await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
        'data-outcome',
        'no-change'
      )
      await expect(status).toHaveCount(0)
      const completionTime = page.getByLabel('Completed at')
      await expect(completionTime).toBeVisible()
      await expect(completionTime).toHaveText(/\d{1,2}:\d{2}/)
      await expect(completionTime.locator('svg')).toHaveCount(0)
      const fontSizes = await page
        .getByTestId('ai-agent-panel')
        .evaluate((panel) =>
          [...panel.querySelectorAll('*')]
            .filter(
              (element) =>
                [...element.childNodes].some(
                  (node) =>
                    node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
                ) && !element.closest('.sr-only')
            )
            .map((element) => getComputedStyle(element).fontSize)
        )
      expect([...new Set(fontSizes)]).toEqual(['12px'])

      await expect(page.getByLabel('Completed at')).toHaveAttribute(
        'datetime',
        /.+/
      )
      await expect(page.getByLabel('Completed at')).toBeInViewport()
      await expect(current).toHaveCount(0)
      await expect(page.getByText('Result', { exact: true })).toHaveCount(0)
      await expect(page.getByLabel('Operational progress')).toContainText(
        '正在隱藏右下角的標記。'
      )
      await page
        .getByTestId('ai-agent-panel')
        .screenshot({ path: testInfo.outputPath('activity-result.png') })
      await feed.evaluate((element) => {
        element.scrollTop = 0
      })
      await expect(
        page.getByRole('button', { name: 'Jump to latest' })
      ).toBeVisible()
      await page.getByLabel('Work history').click()
      await expect(
        page.getByRole('button', { name: 'Jump to latest' })
      ).toHaveCount(0)
      await page.getByTestId('ai-agent-panel').screenshot({
        path: testInfo.outputPath('activity-collapsed.png')
      })
      const resultText = page.getByText('No canvas changes were needed.', {
        exact: true
      })
      const textBounds = await resultText.boundingBox()
      if (!textBounds) throw new Error('Missing result text')
      await page.mouse.move(
        textBounds.x + 1,
        textBounds.y + textBounds.height / 2
      )
      await page.mouse.down()
      await page.mouse.move(
        textBounds.x + textBounds.width - 1,
        textBounds.y + textBounds.height / 2,
        { steps: 12 }
      )
      await page.mouse.up()
      expect(
        await page.evaluate(() => window.getSelection()?.toString())
      ).toContain('canvas changes')
      await page
        .getByTestId('ai-agent-panel')
        .screenshot({ path: testInfo.outputPath('selected-result-text.png') })
      await page.getByLabel('Work history').click()
      await expect(
        page.getByRole('button', { name: 'Jump to latest' })
      ).toBeVisible()
      await page.getByRole('button', { name: 'Jump to latest' }).click()
      await expect(
        page.getByRole('button', { name: 'Jump to latest' })
      ).toHaveCount(0)
    } finally {
      response?.end()
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })
}

for (const width of [360, 1280]) {
  test(`icon conversation navigation preserves drafts at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    let requests = 0
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.route('**/api/ai/action-batch', (route) => {
      requests++
      return route.fulfill({
        json: {
          batchId: 'navigation-result',
          actions: [
            {
              id: 'report',
              name: 'report_outcome',
              arguments: {
                outcome: 'completed',
                message: 'No canvas changes were needed.'
              },
              summary: 'Report result'
            }
          ]
        }
      })
    })
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await page.setViewportSize({ width, height: 720 })
    await page.getByRole('button', { name: 'Open Agent' }).click()
    const panel = page.getByTestId('ai-agent-panel')
    const header = panel.locator('header')
    const toggle = header.getByRole('button', {
      name: 'Toggle conversation history'
    })
    const create = header.getByRole('button', { name: 'New conversation' })
    const close = header.getByRole('button', { name: 'Close Agent panel' })
    await expect(header.locator('select')).toHaveCount(0)
    await expect(header).toHaveText('')
    const positions = []
    for (const button of [toggle, create, close]) {
      const bounds = await button.boundingBox()
      if (!bounds) throw new Error('Missing navigation icon')
      expect(bounds.width).toBe(24)
      expect(bounds.height).toBe(24)
      positions.push(bounds.x)
      await expect(button.locator('svg')).toHaveAttribute(
        'viewBox',
        '0 0 24 24'
      )
    }
    expect(positions[1] - positions[0]).toBe(32)
    expect(positions[2]).toBeGreaterThan(positions[1] + 24)
    const composer = page.getByLabel('Message Agent')
    await composer.fill('First design')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
      'data-outcome',
      'no-change'
    )
    await composer.fill('Unsent first draft')
    await create.click()
    await expect(composer).toBeEmpty()
    await composer.fill('Unsent second draft')
    await toggle.click()
    const history = page.getByRole('region', { name: 'Conversation history' })
    await expect(history).toBeVisible()
    await expect(
      history.getByRole('button', { name: 'First design', exact: true })
    ).toBeVisible()
    await panel.screenshot({
      path: testInfo.outputPath('conversation-history.png')
    })
    await history
      .getByRole('button', { name: 'First design', exact: true })
      .click()
    await expect(history).toHaveCount(0)
    await expect(composer).toHaveValue('Unsent first draft')
    await toggle.click()
    await history
      .getByRole('button', { name: 'New conversation', exact: true })
      .click()
    await expect(composer).toHaveValue('Unsent second draft')
    await toggle.click()
    await history.getByRole('button').first().focus()
    await page.keyboard.press('Escape')
    await expect(history).toHaveCount(0)
    await expect(toggle).toBeFocused()
    await panel.screenshot({
      path: testInfo.outputPath('conversation-header.png')
    })
    expect(requests).toBe(1)
    await close.click()
    await expect(panel).toHaveCount(0)
  })
}

test('panel text selection supports native copy after canvas focus', async ({
  page,
  context
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByTestId('canvas-render-container')
    .locator('canvas')
    .click({ position: { x: 300, y: 250 } })
  const title = page.getByText('Your AI subscription', { exact: true })
  const bounds = await title.boundingBox()
  if (!bounds) throw new Error('Missing panel text')
  await page.mouse.move(bounds.x + 1, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    bounds.x + bounds.width - 1,
    bounds.y + bounds.height / 2,
    { steps: 12 }
  )
  await page.mouse.up()
  const selected = await page.evaluate(() => window.getSelection()?.toString())
  expect(selected).toBe('Your AI subscription')
  await page.evaluate(() => navigator.clipboard.writeText('before-panel-copy'))
  await page.keyboard.press('ControlOrMeta+c')
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(selected)
  const composer = page.getByLabel('Message Agent')
  await composer.fill('Copy composer text')
  await composer.press('ControlOrMeta+a')
  await composer.press('ControlOrMeta+c')
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('Copy composer text')
  await page
    .getByRole('button', { name: 'Toggle conversation history' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Conversation history' })
  ).toHaveCount(0)
})

test('trackpad pinch zooms while ordinary wheel pans before and during AI work', async ({
  page
}) => {
  let finish: (() => void) | undefined
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', async (route) => {
    await pending
    await route.fulfill({
      json: {
        batchId: 'pinch-result',
        actions: [
          {
            id: 'report',
            name: 'report_outcome',
            arguments: {
              outcome: 'completed',
              message: 'No canvas changes were needed.'
            },
            summary: 'Report result'
          }
        ]
      }
    })
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const canvas = page.getByTestId('canvas-render-container').locator('canvas')
  await page.keyboard.press('r')
  await canvas.click({ position: { x: 500, y: 350 } })
  await page.keyboard.press('v')
  const zoom = page.getByTestId('zoom-level')
  const exercise = async () => {
    const before = Number(await zoom.getAttribute('data-value'))
    await canvas.dispatchEvent('wheel', {
      ctrlKey: true,
      deltaY: -10,
      clientX: 450,
      clientY: 300,
      bubbles: true,
      cancelable: true
    })
    await expect
      .poll(async () => Number(await zoom.getAttribute('data-value')))
      .toBeGreaterThan(before)
    const enlarged = await zoom.getAttribute('data-value')
    const positionBefore = await page.evaluate(async () =>
      (await import('../src/testing/runtime-access')).core.getSystemProperty(
        'viewportPosition'
      )
    )
    await canvas.dispatchEvent('wheel', {
      deltaY: 20,
      clientX: 450,
      clientY: 300,
      bubbles: true,
      cancelable: true
    })
    await expect(zoom).toHaveAttribute('data-value', enlarged ?? '')
    await expect
      .poll(() =>
        page.evaluate(async () =>
          (
            await import('../src/testing/runtime-access')
          ).core.getSystemProperty('viewportPosition')
        )
      )
      .not.toEqual(positionBefore)
    await canvas.dispatchEvent('wheel', {
      ctrlKey: true,
      deltaY: 10,
      clientX: 450,
      clientY: 300,
      bubbles: true,
      cancelable: true
    })
    await expect
      .poll(async () => Number(await zoom.getAttribute('data-value')))
      .toBeLessThan(Number(enlarged))
  }
  try {
    await exercise()
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await page.getByLabel('Message Agent').fill('Keep working')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
      'data-outcome',
      'active'
    )
    await exercise()
    await page.getByLabel('Message Agent').focus()
    await canvas.click({ position: { x: 300, y: 200 } })
    await expect(page.getByLabel('Message Agent')).not.toBeFocused()
    const beforeFit = await zoom.getAttribute('data-value')
    await page.keyboard.press('Meta+1')
    await expect(zoom).not.toHaveAttribute('data-value', beforeFit ?? '')
    const fitted = await zoom.getAttribute('data-value')
    await exercise()
    await page.keyboard.press('Control+1')
    await expect(zoom).toHaveAttribute('data-value', fitted ?? '')
  } finally {
    finish?.()
  }
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'no-change'
  )
})

for (const width of [360, 1280]) {
  test(`native Frame revisions keep independent Undo history and explain a rejected revision at ${width}px`, async ({
    page
  }, testInfo) => {
    const initial = prepareDesign(
      {
        type: 'frame',
        name: 'Original design',
        width: 240,
        height: 240,
        children: [
          {
            key: 'shape',
            type: 'oval',
            name: 'Original circle',
            width: 100,
            height: 100,
            fill: '#008060'
          }
        ]
      },
      'revision-frame'
    )
    const second = drawing('revision-two')
    const third = drawing('revision-three')
    let requests = 0
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.route('**/api/ai/action-batch', (route) => {
      requests++
      const request = route.request().postDataJSON()
      const previous = [
        null,
        initial.rootId,
        second.groupDescriptor.id,
        third.groupDescriptor.id
      ][requests - 1]
      if (requests > 1)
        expect(request.metadata.aiTargets.compositionId).toBe(previous)
      let action = {
        id: 'draw',
        name: 'apply_prepared_design',
        arguments: { design: initial } as unknown,
        summary: 'Create the design'
      }
      if (requests > 1)
        action = {
          id: 'revise',
          name: 'replace_vector_composition',
          arguments: {
            compositionId: requests === 4 ? 'missing-target' : previous,
            drawing: requests === 2 ? second : third
          },
          summary: 'Revise the drawing'
        }
      return route.fulfill({
        json: { batchId: `revision-${requests}`, actions: [action] }
      })
    })
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await page.setViewportSize({ width, height: 800 })
    const snapshots = [await getCoreDocumentDigest(page)]
    const depth = await getUndoHistoryDepth(page)
    await page.getByRole('button', { name: 'Open Agent' }).click()
    for (let i = 1; i <= 3; i++) {
      await page.getByLabel('Message Agent').fill(`Drawing revision ${i}`)
      await page.getByRole('button', { name: 'Send', exact: true }).click()
      if (i > 1) {
        await expect(
          page
            .getByText('Previous steps remain available through Undo.', {
              exact: false
            })
            .last()
        ).toBeVisible()
        await page.getByRole('button', { name: 'Approve', exact: true }).click()
      }
      await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
        'data-outcome',
        'success'
      )
      expect(await getUndoHistoryDepth(page)).toBe(depth + i)
      snapshots.push(await getCoreDocumentDigest(page))
    }
    await page
      .getByLabel('Message Agent')
      .fill('Revise a target that has gone away')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await page.getByRole('button', { name: 'Approve', exact: true }).click()
    const failed = page.getByTestId('ai-agent-message').last()
    await expect(failed).toHaveAttribute('data-outcome', 'partial')
    await expect(failed).toContainText(
      'The original drawing is missing or is not an editable composition. Select the drawing to revise and try again.'
    )
    const explanation = failed.getByText(
      /The original drawing is missing or is not an editable composition/
    )
    await expect(explanation).toBeInViewport()
    await failed.getByLabel('Work history').click()
    await expect(
      failed.getByRole('list', { name: 'Operational progress' })
    ).not.toContainText('Finished')
    await expect(failed.getByText('Result', { exact: true })).toHaveCount(0)
    await expect(
      page.getByRole('status', { name: 'Current activity' })
    ).toHaveCount(0)
    expect(await getCoreDocumentDigest(page)).toEqual(snapshots[3])
    expect(await getUndoHistoryDepth(page)).toBe(depth + 3)
    await page.getByRole('button', { name: 'Jump to latest' }).click()
    await expect(explanation).toBeInViewport({ ratio: 1 })
    await page
      .getByTestId('ai-agent-panel')
      .screenshot({ path: testInfo.outputPath('revision-failure.png') })
    await page.getByRole('button', { name: 'Close Agent panel' }).click()
    for (let i = 2; i >= 0; i--) {
      await undo(page)
      expect(await getCoreDocumentDigest(page)).toEqual(snapshots[i])
    }
    for (let i = 1; i <= 3; i++) {
      await redo(page)
      expect(await getCoreDocumentDigest(page)).toEqual(snapshots[i])
    }
    expect(requests).toBe(4)
  })
}
