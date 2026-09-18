import { expect, test } from '@playwright/test'
import { createTestDocumentIdentity, waitForAppReady } from './test-utils'

for (const width of [360, 1280]) {
  for (const state of ['ready', 'local-unavailable']) {
    test(`Agent composer ${state} at ${width}px`, async ({
      page
    }, testInfo) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.route('**/api/ai/status', (route) =>
        route.fulfill({ json: { state } })
      )
      await page.goto(createTestDocumentIdentity().url)
      await waitForAppReady(page)
      await page.setViewportSize({ width, height: 800 })
      await page.getByRole('button', { name: 'Open Agent' }).click()
      const form = page.getByRole('form', { name: 'Agent message form' })
      const status = form.getByRole('status')
      await expect(status).toContainText(
        state === 'ready' ? 'Local AI connected' : 'Local AI unavailable'
      )
      await expect(
        page.getByRole('button', { name: 'Check AI connection' })
      ).toHaveCount(state === 'ready' ? 0 : 1)
      const input = page.getByLabel('Message Agent')
      await input.fill('Draw a blue circle')
      const add = page.getByRole('button', { name: 'Add image' })
      const send = page.getByRole('button', { name: 'Send', exact: true })
      const [formBox, inputBox, addBox, sendBox] = await Promise.all([
        form.boundingBox(),
        input.boundingBox(),
        add.boundingBox(),
        send.boundingBox()
      ])
      if (!formBox || !inputBox || !addBox || !sendBox)
        throw new Error('Composer bounds unavailable')
      expect(Math.abs(addBox.y - sendBox.y)).toBeLessThanOrEqual(1)
      expect(Math.abs(addBox.height - sendBox.height)).toBeLessThanOrEqual(1)
      expect(sendBox.x + sendBox.width).toBeLessThanOrEqual(
        formBox.x + formBox.width
      )
      expect(inputBox.x).toBeGreaterThanOrEqual(formBox.x)
      expect(
        await form.evaluate((node) => node.scrollWidth <= node.clientWidth)
      ).toBe(true)
      await form.screenshot({ path: testInfo.outputPath('composer.png') })
    })
  }
}

for (const width of [360, 1280]) {
  test(`text-only choice continues the original request at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    const requests: {
      intent: string
      metadata: { replyTo?: { intent: string } }
    }[] = []
    await page.route('**/api/ai/action-batch', async (route) => {
      requests.push(route.request().postDataJSON())
      await route.fulfill({
        json: {
          batchId: `layout-${requests.length}`,
          actions: [
            {
              id: `action-${requests.length}`,
              name:
                requests.length === 1
                  ? 'request_drawing_detail_choice'
                  : 'select_elements',
              arguments: requests.length === 1 ? {} : { elementIds: [] },
              summary: 'Choose drawing detail'
            }
          ]
        }
      })
    })
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await page.setViewportSize({ width, height: 800 })
    await page.getByRole('button', { name: 'Open Agent' }).click()
    const intent = 'Draw a 240x240 blue circle'
    await page.getByLabel('Message Agent').fill(intent)
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByText('Waiting for your answer')).toBeVisible()
    await expect(page.getByText('Completed', { exact: true })).toHaveCount(0)
    await expect(page.getByText(/7,111|27,471|295,794/)).toHaveCount(0)
    const choice = page.getByRole('button', { name: 'Choose Balanced detail' })
    await expect(choice).toBeEnabled()
    await page
      .getByRole('complementary', { name: 'Agent conversation' })
      .screenshot({ path: testInfo.outputPath('choices.png') })
    await choice.click()
    await expect.poll(() => requests.length).toBe(2)
    expect(requests[1].metadata.replyTo?.intent).toBe(intent)
    expect(requests[1].intent).toContain('balanced detail')
    await expect(page.getByText('Selected: Balanced detail')).toBeVisible()
    await expect(choice).toHaveCount(0)
  })
}
