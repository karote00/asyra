import { expect, test } from '@playwright/test'
import {
  createTestDocumentIdentity,
  getCoreDocumentDigest,
  getUndoHistoryDepth,
  undo,
  redo,
  waitForAppReady
} from './test-utils'

for (const width of [360, 1440]) {
  test(`conversation navigation retains drafts without canvas writes at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    let requests = 0

    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.route('**/api/ai/action-batch', (route) => {
      requests++

      return route.fulfill({
        json: {
          batchId: `advice-${requests}`,
          actions: [
            {
              id: 'advice',
              name: 'report_outcome',
              arguments: {
                outcome: 'completed',
                message: 'Use a clear hierarchy and consistent spacing.'
              },
              summary: 'Design feedback'
            }
          ]
        }
      })
    })
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await page.setViewportSize({ width, height: 900 })
    const before = await getCoreDocumentDigest(page)

    await page.getByRole('button', { name: 'Open Agent' }).click()
    await expect(
      page.getByRole('note', { name: 'Your AI subscription' })
    ).toBeVisible()
    await expect(page.getByLabel('Design context')).toHaveCount(0)
    await page
      .getByLabel('Message Agent')
      .fill('Give me design advice without drawing.')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
      'data-outcome',
      'no-change'
    )
    const toggleHistory = page.getByRole('button', {
      name: 'Toggle conversation history'
    })
    const history = page.getByRole('region', { name: 'Conversation history' })

    const openConversation = async (name: string) => {
      await toggleHistory.click()
      await expect(history).toBeVisible()
      await history.getByRole('button', { name, exact: true }).click()
      await expect(history).toHaveCount(0)
    }

    await page.getByLabel('Message Agent').fill('Unsent first draft')
    await page.getByRole('button', { name: 'New conversation' }).click()
    await expect(page.getByLabel('Message Agent')).toHaveValue('')
    await expect(page.getByTestId('ai-agent-message')).toHaveCount(0)
    await page.getByLabel('Message Agent').fill('Unsent second draft')
    await openConversation('Give me design advice without drawing.')
    await expect(page.getByLabel('Message Agent')).toHaveValue(
      'Unsent first draft'
    )
    await expect(page.getByTestId('ai-agent-message')).toHaveCount(1)
    await openConversation('New conversation')
    await expect(page.getByLabel('Message Agent')).toHaveValue(
      'Unsent second draft'
    )
    await openConversation('Give me design advice without drawing.')
    expect(requests).toBe(1)
    expect(await getCoreDocumentDigest(page)).toEqual(before)
    for (const control of [
      toggleHistory,
      page.getByRole('button', { name: 'New conversation' }),
      page.getByRole('button', { name: 'Send', exact: true }),
      page.getByLabel('Message Agent')
    ]) {
      await expect(control).toBeInViewport()
      const box = await control.boundingBox()

      expect(box?.x).toBeGreaterThanOrEqual(0)
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width)
    }

    await page.screenshot({
      path: testInfo.outputPath(`conversation-${width}.png`),
      fullPage: false
    })
  })
}

test('delayed attachments return to their originating draft and only that submission', async ({
  page
}, testInfo) => {
  const requests: {
    intent: string
    metadata: { imageAttachments?: unknown[] }
  }[] = []

  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) => {
    requests.push(route.request().postDataJSON())

    return route.fulfill({
      json: {
        batchId: `advice-${requests.length}`,
        actions: [
          {
            id: 'advice',
            name: 'report_outcome',
            arguments: { outcome: 'completed', message: 'Advice only.' },
            summary: 'Design advice'
          }
        ]
      }
    })
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getCoreDocumentDigest(page)

  await page.getByRole('button', { name: 'Open Agent' }).click()
  const composer = page.getByLabel('Message Agent')
  const send = page.getByRole('button', { name: 'Send', exact: true })

  await composer.fill('First conversation')
  await send.click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'no-change'
  )
  await page.evaluate(() => {
    const read = FileReader.prototype.readAsDataURL
    const pending: (() => void)[] = []

    FileReader.prototype.readAsDataURL = function (file) {
      pending.push(() => read.call(this, file))
    }

    Object.assign(window, {
      releaseDraftImageReads: () => {
        FileReader.prototype.readAsDataURL = read
        pending.splice(0).forEach((complete) => complete())
      }
    })
  })
  await page
    .getByLabel('Choose images')
    .setInputFiles('e2e/fixtures/local-vector-reference.png')
  await page.getByRole('button', { name: 'New conversation' }).click()
  await page.evaluate(() =>
    (
      window as unknown as { releaseDraftImageReads: () => void }
    ).releaseDraftImageReads()
  )
  await composer.fill('Second conversation')
  await send.click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'no-change'
  )
  expect(requests[1].metadata.imageAttachments).toBeUndefined()
  await page
    .getByRole('button', { name: 'Toggle conversation history' })
    .click()
  await page
    .getByRole('region', { name: 'Conversation history' })
    .getByRole('button', { name: 'First conversation', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Remove local-vector-reference.png' })
  ).toBeVisible()
  await composer.fill('Use this reference for advice')
  await send.click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'no-change'
  )
  expect(requests[2].metadata.imageAttachments).toHaveLength(1)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await page.screenshot({
    path: testInfo.outputPath('draft-reference-isolation.png')
  })
})

test('ordinary selected-object and multi-object style revisions preserve history and unrelated content', async ({
  page
}, testInfo) => {
  const requests: {
    intent: string
    context: { selectedElements: { id: string }[] }
    metadata: { conversationContext?: { turns: { intent: string }[] } }
  }[] = []
  let ids: string[] = []

  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) => {
    const request = route.request().postDataJSON()

    requests.push(request)
    const targets = requests.length === 1 ? ids.slice(0, 1) : ids.slice(0, 2)

    return route.fulfill({
      json: {
        batchId: `style-${requests.length}`,
        actions: targets.map((elementId, index) => ({
          id: `edit-${index}`,
          name: 'update_design_element',
          arguments: {
            elementId,
            fillColor: requests.length === 1 ? '#ff0000' : '#0000ff'
          },
          summary: 'Revise the requested fill'
        }))
      }
    })
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  ids = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { transactionApis } = await import('../src/common-apis')
    const ids = transactionApis.runTransaction(() =>
      [0, 1, 2].map((index) =>
        core.createElementInParent(
          {
            type: 'rect',
            name: `Card ${index + 1}`,
            x: 100 + index * 150,
            y: 100,
            width: 100,
            height: 100
          },
          core.getCurrentWorkspaceId()
        )
      )
    )

    core.selectElements([ids[0]], { undoable: false })

    return ids
  })

  const read = () =>
    page.evaluate(async (ids) => {
      const { core } = await import('../src/testing/runtime-access')

      return ids.map((id) => ({
        raw: core.getElementData(id),
        fill: (
          core.getElementComputedData(id) as { fills: { color: string }[] }
        ).fills[0].color,
        rendered: (
          core.deps.render.getElementById(id)?.__renderDataSnapshot as {
            fills: { color: string }[]
          }
        ).fills[0].color
      }))
    }, ids)

  const initial = await read()
  const depth = await getUndoHistoryDepth(page)

  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.getByLabel('Message Agent').fill('Make the selected card red.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'success'
  )
  expect(requests[0].context.selectedElements.map(({ id }) => id)).toEqual([
    ids[0]
  ])
  const first = await read()

  expect(first[0]).toMatchObject({ fill: '#ff0000', rendered: '#ff0000' })
  expect(first.slice(1)).toEqual(initial.slice(1))
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  await page.evaluate(
    async (ids) =>
      (await import('../src/testing/runtime-access')).core.selectElements(ids, {
        undoable: false
      }),
    ids.slice(0, 2)
  )
  await page
    .getByLabel('Message Agent')
    .fill('Change both selected cards to blue instead.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
    'data-outcome',
    'success'
  )
  expect(
    requests[1].metadata.conversationContext?.turns.map(({ intent }) => intent)
  ).toEqual(['Make the selected card red.'])
  expect(
    requests[1].context.selectedElements.map(({ id }) => id).sort()
  ).toEqual(ids.slice(0, 2).sort())
  const second = await read()

  expect(
    second.slice(0, 2).map(({ fill, rendered }) => ({ fill, rendered }))
  ).toEqual([
    { fill: '#0000ff', rendered: '#0000ff' },
    { fill: '#0000ff', rendered: '#0000ff' }
  ])
  expect(second[2]).toEqual(initial[2])
  expect(await getUndoHistoryDepth(page)).toBe(depth + 2)
  await page.getByRole('button', { name: 'Close Agent panel' }).click()
  await undo(page)
  await expect.poll(read).toEqual(first)
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  await redo(page)
  await expect.poll(read).toEqual(second)
  expect(await getUndoHistoryDepth(page)).toBe(depth + 2)
  await page.keyboard.press('Meta+1')
  await page.screenshot({
    path: testInfo.outputPath('selected-style-revisions.png')
  })
})
