import { expect, test } from '@playwright/test'
import { usesCpuSoftwareRenderer } from './renderer-environment'
import { openPanelWorkspace } from './panel-test-helper'

test('mobile reference dialog preserves external links and restores keyboard focus', async ({
  page
}, testInfo) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await openPanelWorkspace(page)
  await page.getByRole('button', { name: '參考資料', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '參考資料' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: '南改場溫網室技術專刊 ↗' })
  ).toHaveAttribute('target', '_blank')
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('reference-library.png'),
      fullPage: true
    })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: '參考資料', exact: true })
  ).toBeFocused()
})
