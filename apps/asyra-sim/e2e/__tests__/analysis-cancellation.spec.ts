import { showSetup, viewResults } from '../workflow'
import { expect, test } from '@playwright/test'

test('ordinary analysis keeps progress out of history and retains terminal cancellation once', async ({
  page
}, info) => {
  test.setTimeout(60_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await showSetup(page, true)
  await page
    .locator('summary')
    .filter({ hasText: 'Numerical settings' })
    .click()
  await page.getByLabel('Wall-time budget (ms)').fill('120000')
  await page.getByLabel('Global interval budget').fill('20000')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Run analysis', exact: true })
  ).toBeEnabled()
  const depth = await page.getByTestId('history-depth').textContent()
  await page.getByRole('button', { name: 'Run analysis', exact: true }).click()
  const progress = page.getByTestId('analysis-progress')
  await expect(progress).toContainText('pair records received')
  await expect(progress).toContainText('not a clearance conclusion')
  await expect(progress).toHaveAttribute('data-run-id', /.+/)
  await expect(progress).toContainText('Wall-time budget: 120 s')
  await expect(page.getByTestId('history-depth')).toHaveText(depth ?? '')
  const state = {
    baseURL: info.project.use.baseURL,
    viewport: page.viewportSize(),
    dpr: 1,
    scope: 'files:e2e/__tests__/analysis-cancellation.spec.ts',
    snapshotId: await progress.getAttribute('data-snapshot-id'),
    runId: await progress.getAttribute('data-run-id'),
    progressText: await progress.textContent(),
    camera: 'default',
    screenshot: 'analysis-progress.png',
    pipeline:
      'ordinary experiment Feature, production worker, validated bounded progress, CUSTOM renderer'
  }
  await progress.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('analysis-progress.png') })
  await page
    .getByRole('button', { name: 'Cancel analysis', exact: true })
    .click()
  await expect(progress).toHaveCount(0)
  await viewResults(page)
  await expect(page.getByTestId('analysis-result')).toContainText('cancelled')
  await expect(page.getByTestId('analysis-result')).toContainText('partial')
  await expect(page.getByTestId('history-depth')).toHaveText(
    `Undo steps: ${Number(depth?.match(/\d+/)?.[0]) + 1}`
  )
  await info.attach('review-state.json', {
    contentType: 'application/json',
    body: JSON.stringify(state)
  })
  expect(errors).toEqual([])
})
