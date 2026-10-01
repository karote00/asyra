import { expect, test } from '@playwright/test'
import { usesCpuSoftwareRenderer } from './renderer-environment'
import {
  openPanelWorkspace,
  checkPanelToolbar,
  waitForPanelMotion
} from './panel-test-helper'

test('desktop panel collapse and reopen preserve immediate edits and the canvas', async ({
  page
}, testInfo) => {
  test.setTimeout(60_000)
  await openPanelWorkspace(page)
  const scene = page.getByTestId('scene')
  await checkPanelToolbar(page)
  const canvas = await page.locator('canvas').elementHandle()
  const original = await scene.boundingBox()
  const left = await page.locator('#layer-panel').boundingBox()
  const right = await page.locator('#configuration-panel').boundingBox()
  if (!original || !left || !right || !canvas)
    throw new Error('Missing workspace layout')
  expect(left.x + left.width).toBeLessThanOrEqual(original.x + 1)
  expect(right.x).toBeGreaterThanOrEqual(original.x + original.width - 1)
  await page.getByLabel('溫室縱向深度', { exact: true }).fill('42')
  await page.getByLabel('溫室縱向深度', { exact: true }).press('Enter')
  await page.getByRole('button', { name: '收合編輯面板', exact: true }).click()
  await waitForPanelMotion(page)
  await expect(
    page.getByRole('button', { name: '展開編輯面板', exact: true })
  ).toHaveAttribute('aria-expanded', 'false')
  await expect(
    page.getByLabel('溫室縱向深度', { exact: true })
  ).not.toBeVisible()
  await page.getByRole('button', { name: '收合圖層面板', exact: true }).click()
  await waitForPanelMotion(page)
  const expandedScene = await scene.boundingBox()
  if (!expandedScene) throw new Error('Missing expanded scene bounds')
  expect(expandedScene.width).toBeGreaterThan(original.width + 550)
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('panels-collapsed.png'),
      fullPage: true
    })
  await page.getByRole('button', { name: '展開編輯面板', exact: true }).click()
  await waitForPanelMotion(page)
  await expect(page.getByLabel('溫室縱向深度', { exact: true })).toHaveValue(
    '42'
  )
  await expect(
    page.getByRole('button', { name: '復原 ⌘Z', exact: true })
  ).toBeEnabled()
  await page.getByRole('button', { name: '展開圖層面板', exact: true }).click()
  await waitForPanelMotion(page)
  const restoredScene = await scene.boundingBox()
  if (!restoredScene) throw new Error('Missing restored scene bounds')
  expect(restoredScene.width).toBeCloseTo(original.width, 0)
  await page.getByRole('button', { name: '整體畫面 ⌘1', exact: true }).click()
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('panels-expanded.png'),
      fullPage: true
    })
  expect(await canvas.evaluate((node) => node.isConnected)).toBe(true)
})
