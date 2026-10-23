import { expect, type Page } from '@playwright/test'
import { usesCpuSoftwareRenderer } from './renderer-environment'

export async function openPanelWorkspace(page: Page) {
  // Verify panel state and final geometry without repeated software-rendered resizes.
  if (usesCpuSoftwareRenderer)
    await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  // Panel checks do not need crop meshes; keep the same presentation setup.
  if (
    await page
      .getByRole('button', { name: '展開圖層面板', exact: true })
      .isVisible()
  )
    await page
      .getByRole('button', { name: '展開圖層面板', exact: true })
      .click()
  await page.getByLabel('1914 小胡瓜', { exact: true }).uncheck()
  await page.getByLabel('玉女小蕃茄', { exact: true }).uncheck()
}

export async function waitForPanelMotion(page: Page) {
  await page.locator('.scene-workspace').evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished)
    )
  })
}

export async function checkPanelToolbar(page: Page) {
  const toolbar = await page.getByTestId('viewport-toolbar').boundingBox()
  const viewport = await page.getByTestId('scene').boundingBox()
  if (!toolbar || !viewport) throw new Error('Missing camera toolbar')
  expect(toolbar.y + toolbar.height).toBeLessThanOrEqual(viewport.y)
  // Check every field together, instead of one browser round trip per field.
  await expect
    .poll(() =>
      page.locator('.measurement-field input').evaluateAll((fields) => ({
        present: fields.length > 0,
        invalid: fields
          .filter(
            (field) => field.getAttribute('aria-description') !== '單位：公尺'
          )
          .map((field) => ({
            name: field.getAttribute('aria-label'),
            unit: field.getAttribute('aria-description')
          }))
      }))
    )
    .toEqual({ present: true, invalid: [] })
}
