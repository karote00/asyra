import { expectAnalysisBlocked } from '../workflow'
import { expect, test } from '@playwright/test'
import { readHistoryDepth } from '../history-depth'

test('direct toolbar replay updates completed trajectory and experiment fields', async ({
  page
}) => {
  await page.goto('/')
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  const source = page.getByLabel('Trajectory source data')
  await page.locator('.trajectory-import > summary').click()
  const initial = await source.inputValue()
  const changed = initial.replace('\n8,', '\n9,')
  await source.fill(changed)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  // Keep the same panel open; do not remount it as part of the assertion.
  await expect(source).toHaveValue(initial)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(source).toHaveValue(changed)
  const clearance = page.getByLabel('Minimum clearance (mm)', { exact: true })
  const before = await clearance.inputValue()
  await clearance.fill('25')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(clearance).toHaveValue(before)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(clearance).toHaveValue('25')
  await page
    .getByRole('treeitem', { name: '◇ fixture post', exact: true })
    .click()
  const name = page.getByLabel('Object name', { exact: true })
  await name.fill('History check')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(name).toHaveValue('fixture post')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(name).toHaveValue('History check')
  const mount = page.getByRole('spinbutton', { name: /^Mount position.* X$/ })
  const position = await mount.inputValue()
  await mount.fill('')
  const error = mount.locator('..').getByRole('alert')
  await expect(error).toContainText('finite number')
  expect(
    Number.parseFloat(
      await error.evaluate((node) => getComputedStyle(node).fontSize)
    )
  ).toBeGreaterThanOrEqual(10)
  await page.screenshot({
    path: test.info().outputPath('object-field-diagnostic.png')
  })
  await name.fill('Independent name')
  await name.press('Enter')
  await expect(name).toHaveValue('Independent name')
  await expect(mount).toHaveValue('')
  await mount.focus()
  await mount.press('Escape')
  await expect(mount).toHaveValue(position)
})

test('erroneous authored inputs persist independently, replay and reload, with immediate diagnostics and no stale execution', async ({
  page
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.reload()
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  expect(await readHistoryDepth(page)).toBe(0)
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.locator('.trajectory-import > summary').click()
  const source = page.getByLabel('Trajectory source data')
  const initial = await source.inputValue()
  const invalid = initial.replace(/,0$/, ',100')
  await source.fill(invalid)
  await expect(page.locator('.trajectory-import')).toContainText(
    'out-of-limit joint'
  )
  expect(await readHistoryDepth(page)).toBe(0)
  const preflight = page.getByRole('button', {
    name: 'Run analysis',
    exact: true
  })
  await expectAnalysisBlocked(page)
  await expectAnalysisBlocked(page)
  await source.press('Tab')
  await expect.poll(() => readHistoryDepth(page)).toBe(1)
  await expect(source).toHaveValue(invalid)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(source).toBeVisible()
  await expect(source).toHaveValue(initial)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(source).toHaveValue(invalid)
  const clearance = page.getByLabel('Minimum clearance (mm)', { exact: true })
  const before = await clearance.inputValue()
  await clearance.fill('25')
  await clearance.press('Enter')
  await expect.poll(() => readHistoryDepth(page)).toBe(2)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(clearance).toHaveValue(before)
  await expect(source).toHaveValue(invalid)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(clearance).toHaveValue('25')
  await page.locator('summary').filter({ hasText: 'Analysis scope' }).click()
  const exclusions = page.getByLabel('Excluded pairs', { exact: true })
  await exclusions.fill('unfinished exclusion')
  await expect(exclusions).toHaveAttribute('aria-invalid', 'true')
  await expect(exclusions.locator('..').getByRole('alert')).toContainText(
    'line 1'
  )
  await exclusions.press('Tab')
  await expect.poll(() => readHistoryDepth(page)).toBe(3)
  await clearance.fill('35')
  await clearance.press('Enter')
  await expect.poll(() => readHistoryDepth(page)).toBe(4)
  await source.scrollIntoViewIfNeeded()
  await page.screenshot({
    path: test.info().outputPath('authored-input-errors.png')
  })
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.reload()
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.locator('.trajectory-import > summary').click()
  await page.locator('summary').filter({ hasText: 'Analysis scope' }).click()
  await expect(source).toHaveValue(invalid)
  await expect(exclusions).toHaveValue('unfinished exclusion')
  await expect(clearance).toHaveValue('35')
  await expectAnalysisBlocked(page)
  await source.fill(initial)
  await source.press('Tab')
  await expectAnalysisBlocked(page)
  await exclusions.fill('')
  await exclusions.press('Tab')
  await expect(preflight).toBeEnabled()
  await preflight.click()
  await expect(
    page.getByRole('button', { name: /Apply trajectory|Save experiment/ })
  ).toHaveCount(0)
  await source.scrollIntoViewIfNeeded()
  await page
    .getByRole('button', { name: 'Preview trajectory', exact: true })
    .click()
  await expect(page.getByLabel('Trajectory conversion preview')).toBeVisible()
  await page.screenshot({
    path: test.info().outputPath('authored-input-repaired.png')
  })
  expect(errors).toEqual([])
})

test('undeclared units are undoable authored data and survive reopening without inferred defaults', async ({
  page
}) => {
  await page.goto('/')
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.locator('.trajectory-import > summary').click()
  const unit = page.getByLabel('Time unit', { exact: true })
  const source = page.getByLabel('Trajectory source data')
  const text = await source.inputValue()
  await unit.selectOption('')
  await expect(source).toHaveAttribute('aria-invalid', 'true')
  await unit.press('Tab')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(unit).toHaveValue('s')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(unit).toHaveValue('')
  await expect(source).toHaveValue(text)
  await page.reload()
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.locator('.trajectory-import > summary').click()
  await expect(unit).toHaveValue('')
  await expect(source).toHaveValue(text)
  await expectAnalysisBlocked(page)
  await page.getByRole('button', { name: 'Review input', exact: true }).click()
  await expect(unit).toBeFocused()
  await unit.selectOption('s')
  await unit.press('Enter')
  await unit.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Run analysis', exact: true })
  ).toBeEnabled()
})

test('finite interval edits persist independently while timing errors are immediately visible', async ({
  page
}) => {
  await page.goto('/')
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  const start = page.getByLabel('Start time (s)', { exact: true })
  const end = page.getByLabel('End time (s)', { exact: true })
  const depth = await readHistoryDepth(page)
  await start.fill('9')
  await expect(start.locator('..').getByRole('alert')).toContainText(
    'Start time'
  )
  await start.press('Enter')
  await expect.poll(() => readHistoryDepth(page)).toBe(depth + 1)
  await expectAnalysisBlocked(page)
  const clearance = page.getByLabel('Minimum clearance (mm)', { exact: true })
  await clearance.fill('25')
  await clearance.press('Enter')
  await expect.poll(() => readHistoryDepth(page)).toBe(depth + 2)
  await end.fill('10')
  await expect(end.locator('..').getByRole('alert')).toContainText(
    'does not cover'
  )
  await end.press('Enter')
  await expect.poll(() => readHistoryDepth(page)).toBe(depth + 3)
  await page.screenshot({
    path: test.info().outputPath('interval-diagnostics.png')
  })
  await page.locator('.trajectory-import > summary').click()
  const source = page.getByLabel('Trajectory source data')
  const original = await source.inputValue()
  await source.fill(original.replace('\n8,', '\n11,'))
  await source.press('Tab')
  await expect(start).toHaveValue('9')
  await expect(end).toHaveValue('10')
  await expect(
    page.getByRole('button', { name: 'Run analysis', exact: true })
  ).toBeEnabled()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(source).toHaveValue(original)
  await expectAnalysisBlocked(page)

  await page.reload()
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await expect(start).toHaveValue('9')
  await expect(end).toHaveValue('10')
  await expect(clearance).toHaveValue('25')
  await start.fill('0')
  await start.press('Enter')
  await end.fill('8')
  await end.press('Enter')
  await expect(
    page.getByRole('button', { name: 'Run analysis', exact: true })
  ).toBeEnabled()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(end).toHaveValue('10')
  await expectAnalysisBlocked(page)
})
