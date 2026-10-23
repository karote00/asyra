import { expect, test } from '@playwright/test'
import { usesCpuSoftwareRenderer } from './renderer-environment'
import {
  openPanelWorkspace,
  checkPanelToolbar,
  waitForPanelMotion
} from './panel-test-helper'

test('desktop to mobile transition retains edited dimensions, canvas and keyboard order', async ({
  page
}, testInfo) => {
  test.setTimeout(60_000)
  await openPanelWorkspace(page)
  const canvas = await page.locator('canvas').elementHandle()
  if (!canvas) throw new Error('Missing workspace canvas')
  await page.getByLabel('溫室縱向深度', { exact: true }).fill('42')
  await page.getByLabel('溫室縱向深度', { exact: true }).press('Enter')
  await page.setViewportSize({ width: 390, height: 844 })
  // Resize readiness shares the case deadline; a five-second assertion default
  // is not a portable responsiveness requirement for CPU-rendered browsers.
  await expect(
    page.getByRole('button', { name: '展開編輯面板', exact: true })
  ).toBeVisible({ timeout: testInfo.timeout })
  await page.getByRole('button', { name: '展開圖層面板', exact: true }).click()
  await expect(page.getByLabel('完整鋼架', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '展開編輯面板', exact: true }).click()
  await waitForPanelMotion(page)
  await expect(page.getByLabel('溫室縱向深度', { exact: true })).toHaveValue(
    '42'
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  await checkPanelToolbar(page)
  const input = page.getByLabel('溫室縱向深度', { exact: true })
  await input.focus()
  await expect(input).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('單棟寬度', { exact: true })).toBeFocused()
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('mobile-editor.png'),
      fullPage: true
    })
  expect(await canvas.evaluate((node) => node.isConnected)).toBe(true)
})
