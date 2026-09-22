import { expect, test } from '@playwright/test'
import {
  createTestDocumentIdentity,
  getCoreDocumentDigest,
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
    await expect(page.getByLabel('Design context')).toHaveText('Canvas')
    await page
      .getByLabel('Message Agent')
      .fill('Give me design advice without drawing.')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message').last()).toHaveAttribute(
      'data-outcome',
      'no-change'
    )
    const history = page.getByRole('combobox', { name: 'Conversation history' })
    const firstId = await history.inputValue()
    await page.getByLabel('Message Agent').fill('Unsent first draft')
    await page.getByRole('button', { name: 'New conversation' }).click()
    await expect(page.getByLabel('Message Agent')).toHaveValue('')
    await expect(page.getByTestId('ai-agent-message')).toHaveCount(0)
    const secondId = await history.inputValue()
    await page.getByLabel('Message Agent').fill('Unsent second draft')
    await history.selectOption(firstId)
    await expect(page.getByLabel('Message Agent')).toHaveValue(
      'Unsent first draft'
    )
    await expect(page.getByTestId('ai-agent-message')).toHaveCount(1)
    await history.selectOption(secondId)
    await expect(page.getByLabel('Message Agent')).toHaveValue(
      'Unsent second draft'
    )
    await history.selectOption(firstId)
    expect(requests).toBe(1)
    expect(await getCoreDocumentDigest(page)).toEqual(before)
    for (const control of [
      history,
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
