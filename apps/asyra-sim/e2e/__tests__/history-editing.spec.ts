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
})

test('invalid source does not commit and empty replay never claims an applied action', async ({
  page
}) => {
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
  await source.fill(initial.replace(/,0$/, ',100'))
  await source.press('Tab')
  await expect(page.locator('.trajectory-import')).toContainText(
    'out-of-limit joint'
  )
  expect(await readHistoryDepth(page)).toBe(0)
  for (const action of ['Undo', 'Redo']) {
    await page.getByRole('button', { name: action, exact: true }).click()
    await expect(
      page.getByText(`Nothing to ${action.toLowerCase()}`, { exact: true })
    ).toBeVisible()
    expect(await readHistoryDepth(page)).toBe(0)
  }
  await page.screenshot({ path: test.info().outputPath('empty-history.png') })
  const clearance = page.getByLabel('Minimum clearance (mm)', { exact: true })
  const before = await clearance.inputValue()
  await clearance.fill('25')
  await clearance.press('Tab')
  expect(await readHistoryDepth(page)).toBe(1)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(clearance).toHaveValue(before)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(clearance).toHaveValue('25')
})
