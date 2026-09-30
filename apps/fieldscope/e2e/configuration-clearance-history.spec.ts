import { expect, test } from '@playwright/test'
import { usesCpuSoftwareRenderer } from './renderer-environment'

test('edits crossbeam height and symmetric clearance with independent history', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const beam = page.getByLabel('橫樑高度', { exact: true })
  const margin = page.getByLabel('兩側各留', { exact: true })
  const width = page.getByLabel('單棟寬度', { exact: true })
  const height = page.getByLabel('溫室總高度', { exact: true })
  await expect(beam).toHaveValue('3')
  await expect(margin).toHaveValue('0.35')
  await beam.fill('3.4')
  await beam.press('Enter')
  await expect(height).toHaveValue('5')
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(beam).toHaveValue('3')
  await page.getByRole('button', { name: '重做 ⇧⌘Z', exact: true }).click()
  await expect(beam).toHaveValue('3.4')
  await margin.fill('0.5')
  await margin.press('Enter')
  await expect
    .poll(async () => Number(await width.inputValue()))
    .toBeCloseTo(7.3)
  await expect(page.getByLabel('第 1 項寬度')).toHaveValue('0.9')
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(margin).toHaveValue('0.35')
  await expect(beam).toHaveValue('3.4')
  await width.fill('8')
  await width.press('Enter')
  await expect(margin).toHaveValue('0.85')
  await height.fill('5.5')
  await height.press('Enter')
  await expect(beam).toHaveValue('3.4')
  await beam.fill('6')
  await beam.press('Enter')
  await expect(page.getByRole('alert')).toContainText('橫樑高度')
  await expect(beam).toHaveValue('3.4')
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(height).toHaveValue('5')
  await expect(page.getByText(/已套用：/)).toHaveCount(0)
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('editable-structure-dimensions.png'),
      fullPage: true
    })
  await page.getByLabel('第 7 項寬度').scrollIntoViewIfNeeded()
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('editable-side-clearance.png'),
      fullPage: true
    })
})
