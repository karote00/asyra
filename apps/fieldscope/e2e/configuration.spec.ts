import { expect, test } from '@playwright/test'

test('applies one configuration transaction and supports button and keyboard undo/redo', async ({
  page
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const length = page.getByLabel('溫室縱向深度', { exact: true })
  const width = page.getByLabel('單棟寬度', { exact: true })
  await length.fill('12.7')
  await width.fill('8')
  await page.getByLabel('溫室總高度', { exact: true }).fill('4.5')
  await page.getByLabel('拉網最高位置', { exact: true }).fill('2.6')
  await page.getByRole('button', { name: '第 2 項向左', exact: true }).click()
  await page.getByRole('button', { name: '套用設定', exact: true }).click()
  await expect(
    page.getByText('已套用：橫樑 2.70m、兩側各留 0.85m')
  ).toBeVisible()
  await expect(page.getByLabel('第 1 項種類')).toHaveValue('drain')
  await page.screenshot({
    path: testInfo.outputPath('edited-configuration.png'),
    fullPage: true
  })
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(length).toHaveValue('50')
  await expect(width).toHaveValue('7')
  await expect(page.getByLabel('第 1 項種類')).toHaveValue('soil')
  await page.getByTestId('scene').focus()
  await page.keyboard.press('Meta+Shift+z')
  await expect(length).toHaveValue('12.7')
  await expect(width).toHaveValue('8')
  await page.keyboard.press('Meta+z')
  await expect(length).toHaveValue('50')
  await page.getByRole('button', { name: '重做 ⇧⌘Z', exact: true }).click()
  await expect(length).toHaveValue('12.7')
  await page.getByLabel('拉網最低位置', { exact: true }).fill('4')
  await page.getByRole('button', { name: '套用設定', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('網底高度')
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(length).toHaveValue('50')
  expect(errors).toEqual([])
})
