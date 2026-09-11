import { expect, test } from '@playwright/test'
import { expectAnalysisBlocked, showSetup, viewResults } from '../workflow'

test('single admission, actionable inputs, keyboard tabs, editing completion and focus-safe results', async ({
  page
}, info) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Run preflight', exact: true })
  ).toHaveCount(0)
  const source = page.getByLabel('Trajectory source data')
  await page.locator('.trajectory-import > summary').click()
  const original = await source.inputValue()
  await source.fill(original.replace(/,0$/, ',100'))
  await source.press('Tab')
  await expectAnalysisBlocked(page)
  await page.getByRole('button', { name: 'Review input', exact: true }).click()
  await expect(source).toBeFocused()
  await page.screenshot({ path: info.outputPath('input-error.png') })
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(source).toHaveValue(original)
  const depth = await page.getByTestId('history-depth').innerText()
  const setup = page.getByRole('tab', { name: 'Setup', exact: true })
  await setup.focus()
  await setup.press('ArrowRight')
  await expect(
    page.getByRole('tab', { name: 'Preview', exact: true })
  ).toBeFocused()
  await page.getByRole('tab', { name: 'Preview', exact: true }).press('End')
  await expect(
    page.getByRole('tab', { name: 'Results', exact: true })
  ).toBeFocused()
  await expect(page.getByTestId('history-depth')).toHaveText(depth)
  await showSetup(page)
  await page
    .getByLabel('Experiment', { exact: true })
    .selectOption({ label: 'Tool and table collision - r1' })
  await page.getByLabel('Start time (s)').fill('3.8')
  await page.getByLabel('Start time (s)').press('Enter')
  await page.getByLabel('End time (s)').fill('4.2')
  await page.getByLabel('End time (s)').press('Enter')
  await page.getByRole('button', { name: 'Run analysis', exact: true }).click()
  const clearance = page.getByLabel('Minimum clearance (mm)')
  await clearance.focus()
  await expect(
    page.getByRole('button', { name: 'View results', exact: true })
  ).toBeVisible({ timeout: 30000 })
  await expect(setup).toHaveAttribute('aria-selected', 'true')
  await expect(clearance).toBeFocused()
  await viewResults(page)
  const result = page.getByTestId('analysis-result')
  await expect(result).toContainText('Issue found')
  await expect(result).toContainText('complete')
  const pair = result.locator('.evidence-pair').first()
  await pair.locator('summary').click()
  await pair.getByRole('button', { name: 'Replay pair', exact: true }).click()
  await expect(
    page.getByRole('tab', { name: 'Results', exact: true })
  ).toHaveAttribute('aria-selected', 'true')
  await expect(pair).toHaveAttribute('open', '')
  await expect(page.locator('.viewport-summary')).toContainText(
    'Historical run replay'
  )
  await page.screenshot({ path: info.outputPath('results-replay.png') })
  await page
    .getByRole('button', { name: 'Return to current preview', exact: true })
    .click()
  await expect(
    page.getByRole('tab', { name: 'Preview', exact: true })
  ).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.viewport-summary')).not.toContainText(
    'Historical run replay'
  )
  await showSetup(page)
  await clearance.fill('30')
  await page.getByRole('tab', { name: 'Results', exact: true }).click()
  await expect(result).toContainText('Historical inputs differ')
  await expect(
    page.getByRole('button', { name: 'Rerun analysis with current inputs' })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(result).not.toContainText('Historical inputs differ')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(result).toContainText('Historical inputs differ')
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  const experimentId = await page
    .getByLabel('Experiment', { exact: true })
    .inputValue()
  await page.reload()
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page
    .getByLabel('Experiment', { exact: true })
    .selectOption(experimentId)
  await expect(clearance).toHaveValue('30')
  await page.setViewportSize({ width: 600, height: 960 })
  await page.screenshot({ path: info.outputPath('setup-narrow.png') })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth
  )
  expect(overflow).toBe(false)
  await viewResults(page)
  await page.screenshot({ path: info.outputPath('results-narrow.png') })
})

test('Worker delivery failure remains an explicit retained failure with no successful verdict', async ({
  page
}, info) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  let intercepted = 0
  await page.route(
    /\/analysis\.worker(?:\.ts|-[\w-]+\.js)(?:\?.*)?$/,
    (route) => {
      intercepted++
      return route.abort('failed')
    }
  )
  await page.getByRole('button', { name: 'Run analysis', exact: true }).click()
  await viewResults(page)
  const result = page.getByTestId('analysis-result')
  await expect(result).toContainText('failed')
  expect(intercepted).toBe(1)
  await expect(result).toContainText('partial')
  await expect(result.getByLabel('User verdict')).not.toHaveText('meets')
  await expect(page.locator('.retention-actions')).toContainText(
    'Saved to this project'
  )
  await page.screenshot({ path: info.outputPath('worker-failure.png') })
})

test('a failed durable append keeps evidence and retries through the original storage owner', async ({
  page
}, info) => {
  await page.goto('/')
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name === 'publications') {
        IDBObjectStore.prototype.add = original
        throw new DOMException('Injected quota failure', 'QuotaExceededError')
      }
      return original.apply(this, args)
    }
  })
  await page.getByRole('button', { name: 'Run analysis', exact: true }).click()
  await viewResults(page)
  await expect(page.locator('.retention-actions')).toContainText(
    'Saving failed'
  )
  const result = await page.getByTestId('analysis-result').innerText()
  await page.screenshot({ path: info.outputPath('saving-failure.png') })
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click()
  await expect(page.locator('.retention-actions')).toContainText(
    'Saved to this project'
  )
  expect(await page.getByTestId('analysis-result').innerText()).toBe(result)
  await page.reload()
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await viewResults(page)
  expect(await page.getByTestId('analysis-result').innerText()).toBe(result)
})
