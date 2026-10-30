import { expect, test } from '@playwright/test'
import {
  createTestDocumentIdentity,
  getUndoHistoryDepth,
  waitForAppReady
} from './test-utils'
import { ToolLibraryManagement } from '../src/ai/tool-library-management'

test('manages saved metadata in the conversation panel without a drawing request', async ({
  page
}, testInfo) => {
  let availability = 'eligible'
  let version = 'observed'
  const commands: unknown[] = []
  let drawingRequests = 0
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) => {
    drawingRequests++
    return route.abort()
  })
  // Deterministic transport fixture; canonical durable state is tested by the host suite.
  await page.route(`**${ToolLibraryManagement.endpoint}`, async (route) => {
    const input = route.request().postDataJSON()
    commands.push(input)
    if (input.operation !== 'list') {
      expect(input).toEqual({
        operation: 'remove',
        name: 'facade.editable-window-grid',
        revision: 2,
        expectedVersion: 'observed'
      })
      availability = 'retired'
      version = 'changed'
      await route.fulfill({ json: { status: 'saved', availability, version } })
    } else {
      await route.fulfill({
        json: {
          entries: [
            {
              name: 'facade.editable-window-grid',
              revision: 2,
              description:
                'Create a reusable editable window grid with fresh dimensions and materials.',
              availability,
              version
            }
          ],
          unavailable: [],
          truncated: false
        }
      })
    }
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const before = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.getByRole('button', { name: 'Saved tools', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Saved tools', exact: true })
  await expect(
    panel.getByText('facade.editable-window-grid', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByPlaceholder('Describe a drawing or refinement…')
  ).toBeVisible()
  const bounds = await panel.boundingBox()
  const viewport = page.viewportSize()
  if (!bounds || !viewport) {
    throw new Error('Expected visible saved tools panel')
  }
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width)
  await page.screenshot({ path: testInfo.outputPath('saved-tools.png') })
  await panel
    .getByRole('button', { name: 'Remove facade.editable-window-grid' })
    .click()
  await expect(panel.getByText('retired', { exact: true })).toBeVisible()
  await expect(
    panel.getByRole('button', { name: 'Remove facade.editable-window-grid' })
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Close saved tools' }).click()
  await expect(panel).not.toBeVisible()
  expect(await getUndoHistoryDepth(page)).toBe(before)
  expect(drawingRequests).toBe(0)
  expect(commands).toHaveLength(3)
})
