import { expect, test } from '@playwright/test'

test('applies one configuration transaction and supports button and keyboard undo/redo', async ({
  page
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const row = page.getByLabel('第 1 項種類')
  const rowBounds = await row.boundingBox()
  if (!rowBounds) throw new Error('Missing strip row')
  for (const label of [
    'Move strip 1 up',
    'Move strip 1 down',
    'Remove strip 1'
  ]) {
    const button = page.getByRole('button', { name: label, exact: true })
    const bounds = await button.boundingBox()
    if (!bounds) throw new Error('Missing strip action')
    expect(bounds.width).toBe(24)
    expect(bounds.height).toBe(24)
    expect(bounds.y + bounds.height / 2).toBeCloseTo(
      rowBounds.y + rowBounds.height / 2
    )
    const drawing = await button.locator('svg path').evaluate((node) => {
      const box = (node as SVGGraphicsElement).getBBox()
      const style = getComputedStyle(node)
      const stroke =
        style.stroke === 'none' ? 0 : Number.parseFloat(style.strokeWidth)
      return { width: box.width + stroke, height: box.height + stroke }
    })
    expect(drawing.width).toBe(16)
    expect(drawing.height).toBe(16)
  }
  const length = page.getByLabel('溫室縱向深度', { exact: true })
  const width = page.getByLabel('單棟寬度', { exact: true })
  await length.fill('12.7')
  await width.fill('8')
  await page.getByLabel('溫室總高度', { exact: true }).fill('4.5')
  await page.getByLabel('拉網最高位置', { exact: true }).fill('2.6')
  await page
    .getByRole('button', { name: 'Move strip 2 up', exact: true })
    .click()
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
