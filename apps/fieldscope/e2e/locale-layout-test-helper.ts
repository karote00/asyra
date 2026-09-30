import { expect, type Page, type TestInfo } from '@playwright/test'
import { usesCpuSoftwareRenderer } from './renderer-environment'

async function checkLayout(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(
      document.documentElement
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished)
    )
  })
  const violations = () =>
    page.evaluate(() => {
      const issues: string[] = []
      if (document.documentElement.scrollWidth > innerWidth + 1)
        issues.push('Page overflows horizontally')
      for (const element of document.querySelectorAll<HTMLElement>(
        'button, input, select, h1, h2, h3, summary, .measurement-field, .workspace-panel-content'
      )) {
        if (!element.checkVisibility() || element.closest('[inert]')) continue
        const box = element.getBoundingClientRect()
        if (box.width && (box.left < -1 || box.right > innerWidth + 1))
          issues.push(
            `Outside page: ${element.textContent || element.getAttribute('aria-label')}`
          )
        if (
          element.clientWidth &&
          element.scrollWidth > element.clientWidth + 2
        )
          issues.push(
            `Clipped: ${element.textContent || element.getAttribute('aria-label')}`
          )
      }
      return issues
    })
  await expect.poll(violations).toEqual([])
}

export async function runResponsiveLayout(
  page: Page,
  testInfo: TestInfo,
  width: number,
  locale: 'zh-TW' | 'en'
) {
  await page.setViewportSize({ width, height: width < 800 ? 844 : 1100 })
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  if (locale === 'en')
    await page
      .getByRole('combobox', { name: '語言', exact: true })
      .selectOption('en')
  const english = locale === 'en'
  await checkLayout(page)
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('overview.png'),
      fullPage: true
    })
  if (width < 1100) {
    const editorToggle = page.locator(
      'button[aria-controls="configuration-panel"]'
    )
    if ((await editorToggle.getAttribute('aria-expanded')) !== 'true')
      await editorToggle.click()
    await expect(editorToggle).toHaveAttribute('aria-expanded', 'true')
  }
  const right = page.locator('#configuration-panel .workspace-panel-content')
  await expect(
    page.getByRole('heading', {
      name: english ? 'Scene settings' : '場景設定',
      exact: true
    })
  ).toBeVisible({ timeout: 15_000 })
  await checkLayout(page)
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('editor-top.png'),
      fullPage: true
    })
  await right.evaluate((node) => {
    node.scrollTop = node.scrollHeight
  })
  await page
    .getByLabel(english ? 'Strip 7 width' : '第 7 項寬度', { exact: true })
    .scrollIntoViewIfNeeded()
  await checkLayout(page)
  await expect(
    page.getByLabel(english ? 'Strip 7 width' : '第 7 項寬度', {
      exact: true
    })
  ).toBeInViewport()
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('editor-strips.png'),
      fullPage: true
    })
  if (width < 1100)
    await page
      .getByRole('button', {
        name: english ? 'Open layers panel' : '展開圖層面板',
        exact: true
      })
      .click()
  await expect(
    page.getByLabel(english ? 'Yu-Nu cherry tomato' : '玉女小蕃茄', {
      exact: true
    })
  ).toBeVisible()
  await checkLayout(page)
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('layers.png'),
      fullPage: true
    })
  await page
    .getByLabel(english ? 'Film opacity' : '覆膜不透明度', { exact: true })
    .scrollIntoViewIfNeeded()
  await expect(
    page.getByLabel(english ? 'Film opacity' : '覆膜不透明度', {
      exact: true
    })
  ).toBeInViewport()
  await checkLayout(page)
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('layers-bottom.png'),
      fullPage: true
    })
  await page
    .getByRole('button', {
      name: english ? 'References' : '參考資料',
      exact: true
    })
    .click()
  await page
    .getByText(english ? 'Planting layout' : '栽培配置', { exact: true })
    .click()
  await page
    .getByText(english ? 'Model dimensions and limits' : '模型尺寸與限制', {
      exact: true
    })
    .click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await checkLayout(page)
  await expect(dialog.locator('a')).toHaveAttribute('target', '_blank')
  await expect(dialog.locator('a')).toHaveAttribute(
    'rel',
    'noopener noreferrer'
  )
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('references.png'),
      fullPage: true
    })
  await dialog.locator('p').last().scrollIntoViewIfNeeded()
  await expect(dialog.locator('p').last()).toBeInViewport()
  if (!usesCpuSoftwareRenderer)
    await page.screenshot({
      path: testInfo.outputPath('references-bottom.png'),
      fullPage: true
    })
  if (english) {
    const attributes = await page
      .locator('[aria-label], [aria-description], [title]')
      .evaluateAll((nodes) =>
        nodes
          .flatMap((node) =>
            ['aria-label', 'aria-description', 'title'].map(
              (name) => node.getAttribute(name) || ''
            )
          )
          .join(' ')
      )
    expect(attributes).not.toMatch(/\p{Script=Han}/u)
    const copy = await page.locator('body').evaluate((node) => {
      const clone = node.cloneNode(true) as HTMLElement
      clone.querySelectorAll('option, script').forEach((item) => item.remove())
      return clone.textContent
    })
    expect(copy).not.toMatch(/\p{Script=Han}/u)
  }
  await page
    .getByRole('button', {
      name: english ? 'Close references' : '關閉參考資料',
      exact: true
    })
    .click()
  await expect(dialog).not.toBeVisible()
}
