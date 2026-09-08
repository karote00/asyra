import { expect, test } from '@playwright/test'

test('side panels collapse outward without remounting the canvas or discarding drafts', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const scene = page.getByTestId('scene')
  const canvas = await page.locator('canvas').elementHandle()
  const original = await scene.boundingBox()
  const left = await page.locator('#layer-panel').boundingBox()
  const right = await page.locator('#configuration-panel').boundingBox()
  if (!original || !left || !right || !canvas)
    throw new Error('Missing workspace layout')
  expect(left.x + left.width).toBeLessThanOrEqual(original.x + 1)
  expect(right.x).toBeGreaterThanOrEqual(original.x + original.width - 1)
  await page.getByLabel('溫室縱向深度', { exact: true }).fill('42')
  await page.getByRole('button', { name: '收合編輯面板', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '展開編輯面板', exact: true })
  ).toHaveAttribute('aria-expanded', 'false')
  await expect(
    page.getByLabel('溫室縱向深度', { exact: true })
  ).not.toBeVisible()
  await page.getByRole('button', { name: '收合圖層面板', exact: true }).click()
  await expect
    .poll(async () => (await scene.boundingBox())?.width ?? 0)
    .toBeGreaterThan(original.width + 550)
  await page.screenshot({
    path: testInfo.outputPath('panels-collapsed.png'),
    fullPage: true
  })
  await page.getByRole('button', { name: '展開編輯面板', exact: true }).click()
  await expect(page.getByLabel('溫室縱向深度', { exact: true })).toHaveValue(
    '42'
  )
  await expect(
    page.getByRole('button', { name: '復原 ⌘Z', exact: true })
  ).toBeDisabled()
  await page.getByRole('button', { name: '展開圖層面板', exact: true }).click()
  await page.getByRole('button', { name: '適合畫面 ⌘1', exact: true }).click()
  await page.screenshot({
    path: testInfo.outputPath('panels-expanded.png'),
    fullPage: true
  })
  expect(await canvas.evaluate((node) => node.isConnected)).toBe(true)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(
    page.getByRole('button', { name: '展開編輯面板', exact: true })
  ).toBeVisible()
  await page.getByRole('button', { name: '展開圖層面板', exact: true }).click()
  await expect(page.getByLabel('完整鋼架', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '展開編輯面板', exact: true }).click()
  await expect(page.getByLabel('完整鋼架', { exact: true })).not.toBeVisible()
  await expect(page.getByLabel('溫室縱向深度', { exact: true })).toHaveValue(
    '42'
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('mobile-editor.png'),
    fullPage: true
  })
})
