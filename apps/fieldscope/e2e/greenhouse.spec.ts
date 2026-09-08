import { expect, test } from '@playwright/test'

test('real greenhouse route exposes the structure, section, inner aisle and responsive controls', async ({
  page
}, testInfo) => {
  await testInfo.attach('review-context', {
    body: JSON.stringify({
      origin: testInfo.project.use.baseURL,
      desktop: [1440, 1100],
      mobile: [390, 844],
      deviceScaleFactor: 1,
      scenario: 'fixed-four-bay-greenhouse',
      dimensions: [28, 50, 5],
      margin: 0.35,
      cropGeometry: 'not configured',
      views: ['overview', 'front', 'top', 'inside']
    }),
    contentType: 'application/json'
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(1)
  await expect(
    page.getByRole('heading', { name: '每棟橫向配置' })
  ).toBeVisible()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.screenshot({
    path: testInfo.outputPath('overview.png'),
    fullPage: true,
    animations: 'disabled'
  })
  await page.getByLabel('塑膠覆膜', { exact: true }).uncheck()
  await expect(page.getByLabel('塑膠覆膜', { exact: true })).not.toBeChecked()
  await page.getByRole('button', { name: '端面', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '端面', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.screenshot({
    path: testInfo.outputPath('front-structure.png'),
    fullPage: true,
    animations: 'disabled'
  })
  await page.getByRole('button', { name: '俯視', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '俯視', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.screenshot({
    path: testInfo.outputPath('top-layout.png'),
    fullPage: true,
    animations: 'disabled'
  })
  await page.getByRole('button', { name: '走道內部', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '走道內部', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.screenshot({
    path: testInfo.outputPath('inside-structure.png'),
    fullPage: true,
    animations: 'disabled'
  })
  const scene = page.getByTestId('scene')
  await scene.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('+')
  await page.getByRole('button', { name: '透視', exact: true }).click()
  await page.getByLabel('塑膠覆膜', { exact: true }).check()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByLabel('完整鋼架', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.screenshot({
    path: testInfo.outputPath('mobile.png'),
    fullPage: true,
    animations: 'disabled'
  })
  expect(errors).toEqual([])
})
