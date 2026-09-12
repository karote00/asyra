import { expect, test } from '@playwright/test'

test('keeps the selected strip identity through deletion and history', async ({
  page
}) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const robot = page.getByRole('tab', { name: '機器人', exact: true })
  const farm = page.getByRole('tab', { name: '溫室', exact: true })
  await robot.click()
  const lane = page.getByRole('combobox', { name: '巡邏路線', exact: true })
  const selected = lane.locator('option:checked')
  const identity = await lane.inputValue()
  await expect(selected).toHaveText('第 1 棟 - 土壤 3')
  await lane.selectOption({ label: '第 1 棟 - 土壤 5' })
  await expect(selected).toHaveText('第 1 棟 - 土壤 5')
  await lane.selectOption({ label: '第 1 棟 - 土壤 3' })
  await expect(lane).toHaveValue(identity)
  await farm.click()
  await page.getByRole('button', { name: '刪除第 1 項', exact: true }).click()
  await robot.click()
  await expect(lane).toHaveValue(identity)
  await expect(selected).toHaveText('第 1 棟 - 土壤 2')
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(selected).toHaveText('第 1 棟 - 土壤 3')
  await farm.click()
  await page.getByRole('button', { name: '刪除第 3 項', exact: true }).click()
  await robot.click()
  await expect(lane).toHaveValue(identity)
  await expect(selected).toHaveText('路線已不符合溫室配置')
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(selected).toHaveText('第 1 棟 - 土壤 3')
  await page.getByRole('button', { name: '重做 ⇧⌘Z', exact: true }).click()
  await expect(selected).toHaveText('路線已不符合溫室配置')
})

for (const width of [390, 1440])
  for (const locale of ['zh-TW', 'en'] as const) {
    test(`robot workspace ${locale} at ${width}px`, async ({
      page
    }, testInfo) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 })
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto('/')
      await expect(page.getByText('空間模型已就緒')).toBeVisible()
      if (locale === 'en')
        await page
          .getByRole('combobox', { name: '語言', exact: true })
          .selectOption('en')
      const en = locale === 'en'
      if (width < 1100)
        await page
          .getByRole('button', {
            name: en ? 'Open editor panel' : '展開編輯面板',
            exact: true
          })
          .click()
      await page
        .getByRole('tab', { name: en ? 'Robot' : '機器人', exact: true })
        .click()
      await page
        .getByRole('button', {
          name: en ? 'Inspect robot' : '近看機器人',
          exact: true
        })
        .click()
      const input = page.getByRole('spinbutton', {
        name: en ? 'Width' : '寬度',
        exact: true
      })
      await input.fill('.6')
      await input.press('Enter')
      await expect(input).toHaveValue('0.6')
      await page
        .getByRole('button', { name: en ? 'Undo ⌘Z' : '復原 ⌘Z', exact: true })
        .click()
      await expect(input).toHaveValue('0.55')
      await page
        .getByRole('button', {
          name: en ? 'Redo ⇧⌘Z' : '重做 ⇧⌘Z',
          exact: true
        })
        .click()
      await expect(input).toHaveValue('0.6')
      await expect(
        page.getByText(en ? 'Route unverified' : '路線待確認', { exact: true })
      ).toBeVisible()
      await page.screenshot({
        path: testInfo.outputPath('robot-editor.png'),
        fullPage: false
      })
      const panel = page.locator(
        '#configuration-panel .workspace-panel-content'
      )
      await panel.evaluate((node) => {
        node.scrollTop = node.scrollHeight
      })
      await expect(
        page.getByRole('combobox', {
          name: en ? 'Ground condition' : '地面狀態',
          exact: true
        })
      ).toBeVisible()
      const overflow = await page.evaluate(() => {
        const issues: string[] = []
        for (const node of document.querySelectorAll<HTMLElement>(
          '#configuration-panel input, #configuration-panel select, #configuration-panel button'
        )) {
          if (!node.checkVisibility()) continue
          const r = node.getBoundingClientRect()
          if (r.left < 0 || r.right > innerWidth + 1)
            issues.push(
              node.getAttribute('aria-label') || node.textContent || 'control'
            )
          if (node.clientWidth && node.scrollWidth > node.clientWidth + 2)
            issues.push('clipped control')
        }
        return issues
      })
      expect(overflow).toEqual([])
      await page.screenshot({
        path: testInfo.outputPath('robot-survey.png'),
        fullPage: false
      })
      await page
        .getByRole('button', {
          name: en ? 'Close editor panel' : '收合編輯面板',
          exact: true
        })
        .click()
      if (width >= 1100)
        await page
          .getByRole('button', {
            name: en ? 'Close layers panel' : '收合圖層面板',
            exact: true
          })
          .click()
      await page.locator('#configuration-panel').evaluate(async (node) => {
        await Promise.all(
          node
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished)
        )
      })
      await expect
        .poll(
          async () =>
            (await page.getByTestId('scene').boundingBox())?.width ?? 0
        )
        .toBeGreaterThan(width - 80)
      await page.screenshot({
        path: testInfo.outputPath('robot-closeup.png'),
        fullPage: false
      })
      expect(errors).toEqual([])
    })
  }
