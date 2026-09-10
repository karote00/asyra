import { expect, test, type Page } from '@playwright/test'

async function checkLayout(page: Page) {
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

test('language changes preserve the canvas, camera, layers, configuration and history', async ({
  page
}) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const selector = page.getByRole('combobox', { name: '語言', exact: true })
  await expect(selector).toHaveValue('zh-TW')
  await expect(selector.locator('option')).toHaveCount(2)
  await page.getByLabel('第 1 項寬度', { exact: true }).fill('1.1')
  await page.getByLabel('第 1 項寬度', { exact: true }).press('Enter')
  await page.getByLabel('塑膠覆膜', { exact: true }).uncheck()
  await page.locator('canvas').hover()
  await page.mouse.wheel(0, -Math.log(2) * 1000)
  await expect(page.getByTestId('zoom-percent')).toHaveText('200%')
  const canvas = await page.locator('canvas').elementHandle()
  await selector.selectOption('en')
  await expect(page.getByText('Scene ready', { exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveTitle('FieldScope - Greenhouse workspace')
  expect(
    await canvas?.evaluate((node) => node === document.querySelector('canvas'))
  ).toBe(true)
  await expect(page.getByTestId('zoom-percent')).toHaveText('200%')
  await expect(
    page.getByLabel('Plastic film', { exact: true })
  ).not.toBeChecked()
  await expect(page.getByLabel('Strip 1 width', { exact: true })).toHaveValue(
    '1.1'
  )
  await page.getByRole('button', { name: 'Undo ⌘Z', exact: true }).click()
  await expect(page.getByLabel('Strip 1 width', { exact: true })).toHaveValue(
    '0.9'
  )
  await page.getByRole('button', { name: 'Redo ⇧⌘Z', exact: true }).click()
  await expect(page.getByLabel('Strip 1 width', { exact: true })).toHaveValue(
    '1.1'
  )
  const bottom = page.getByLabel('Net bottom height', { exact: true })
  await bottom.fill('4')
  await bottom.press('Enter')
  await expect(page.getByRole('alert')).toContainText(
    'Bottom height must be between'
  )
  await page
    .getByRole('combobox', { name: 'Language', exact: true })
    .selectOption('zh-TW')
  await expect(page.getByRole('alert')).toContainText('底部高度必須介於')
  await page
    .getByRole('combobox', { name: '語言', exact: true })
    .selectOption('en')
  await page.reload()
  await expect(
    page.getByRole('combobox', { name: 'Language', exact: true })
  ).toHaveValue('en')
  await expect(page.getByText('Scene ready', { exact: true })).toBeVisible()
})

for (const width of [360, 390, 768, 1440]) {
  for (const locale of ['zh-TW', 'en'] as const) {
    test(`${locale} layout at ${width}px covers panels and expanded references`, async ({
      page
    }, testInfo) => {
      await page.setViewportSize({ width, height: width < 800 ? 844 : 1100 })
      await page.goto('/')
      await expect(page.getByText('空間模型已就緒')).toBeVisible()
      if (locale === 'en')
        await page
          .getByRole('combobox', { name: '語言', exact: true })
          .selectOption('en')
      const english = locale === 'en'
      await checkLayout(page)
      await page.screenshot({
        path: testInfo.outputPath('overview.png'),
        fullPage: true
      })
      if (width < 1100)
        await page
          .getByRole('button', {
            name: english ? 'Open editor panel' : '展開編輯面板',
            exact: true
          })
          .click()
      const right = page.locator(
        '#configuration-panel .workspace-panel-content'
      )
      await expect(
        page.getByRole('heading', {
          name: english ? 'Scene settings' : '場景設定',
          exact: true
        })
      ).toBeVisible()
      await checkLayout(page)
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
      await page.screenshot({
        path: testInfo.outputPath('references.png'),
        fullPage: true
      })
      await dialog.locator('p').last().scrollIntoViewIfNeeded()
      await expect(dialog.locator('p').last()).toBeInViewport()
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
          clone
            .querySelectorAll('option, script')
            .forEach((item) => item.remove())
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
    })
  }
}
