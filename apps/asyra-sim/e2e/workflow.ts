import { expect, type Page } from '@playwright/test'

export async function showSetup(page: Page, advanced = false) {
  await page.getByRole('tab', { name: 'Setup', exact: true }).click()
  if (advanced) {
    const section = page.locator('details').filter({
      has: page
        .locator(':scope > summary')
        .filter({ hasText: 'Advanced settings' })
    })
    if (
      !(await section.evaluate(
        (element) => (element as HTMLDetailsElement).open
      ))
    )
      await section.locator(':scope > summary').click()
  }
}

export async function viewResults(page: Page) {
  await page
    .getByRole('button', { name: 'View results', exact: true })
    .click({ timeout: 30000 })
  await expect(
    page.getByRole('tab', { name: 'Results', exact: true })
  ).toHaveAttribute('aria-selected', 'true')
}

export async function runAnalysis(page: Page) {
  await page.getByRole('button', { name: 'Run analysis', exact: true }).click()
  await viewResults(page)
}

export async function expectAnalysisBlocked(page: Page) {
  const workers: string[] = []
  const observe = (worker: { url(): string }) => workers.push(worker.url())
  page.on('worker', observe)
  try {
    await page
      .getByRole('button', { name: 'Run analysis', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Review input', exact: true })
    ).toBeVisible()
    await expect(page.getByTestId('analysis-progress')).toHaveCount(0)
    expect(workers).toEqual([])
  } finally {
    page.off('worker', observe)
  }
}
