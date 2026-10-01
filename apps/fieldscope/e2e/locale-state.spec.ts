import { expect, test } from '@playwright/test'

test('language changes preserve the canvas, camera, layers, configuration and history', async ({
  page
}) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const selector = page.getByRole('combobox', { name: '語言', exact: true })
  await expect(selector).toHaveValue('zh-TW')
  await expect(selector.locator('option')).toHaveCount(2)
  await page.getByLabel('第 1 項寬度', { exact: true }).fill('1.1')
  await page.getByLabel('第 1 項寬度', { exact: true }).press('Enter')
  await page.getByLabel('塑膠覆膜', { exact: true }).uncheck()
  await page.getByRole('button', { name: '恢復 100% 縮放' }).click()
  await expect(page.getByTestId('zoom-percent')).toHaveText('100%')
  await page.getByTestId('scene').focus()
  await page.keyboard.press('=')
  await expect(page.getByTestId('zoom-percent')).toHaveText('111%')
  const canvas = await page.locator('canvas').elementHandle()
  await selector.selectOption('en')
  await expect(page.getByText('Scene ready', { exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveTitle('FieldScope - Greenhouse workspace')
  expect(
    await canvas?.evaluate((node) => node === document.querySelector('canvas'))
  ).toBe(true)
  await expect(page.getByTestId('zoom-percent')).toHaveText('111%')
  await expect(
    page.getByLabel('Plastic film', { exact: true })
  ).not.toBeChecked()
  await expect(page.getByLabel('Strip 1 width', { exact: true })).toHaveValue(
    '1.1'
  )
  await page.getByRole('button', { name: 'Undo ⌘Z', exact: true }).click()
  await expect(page.getByLabel('Strip 1 width', { exact: true })).toHaveValue(
    '0.9'
  )
  await page.getByRole('button', { name: 'Redo ⇧⌘Z', exact: true }).click()
  await expect(page.getByLabel('Strip 1 width', { exact: true })).toHaveValue(
    '1.1'
  )
  const bottom = page.getByLabel('Net bottom height', { exact: true })
  await bottom.fill('4')
  await bottom.press('Enter')
  await expect(page.getByRole('alert')).toContainText(
    'Bottom height must be between'
  )
  await page
    .getByRole('combobox', { name: 'Language', exact: true })
    .selectOption('zh-TW')
  await expect(page.getByRole('alert')).toContainText('底部高度必須介於')
  await page
    .getByRole('combobox', { name: '語言', exact: true })
    .selectOption('en')
  await page.reload()
  await expect(
    page.getByRole('combobox', { name: 'Language', exact: true })
  ).toHaveValue('en')
  await expect(page.getByText('Scene ready', { exact: true })).toBeVisible()
})
