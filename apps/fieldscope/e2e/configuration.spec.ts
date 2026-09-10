import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('commits each completed field immediately with independent undo and redo', async ({
  page
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const row = page.getByLabel('第 1 項種類')
  const rowBounds = await row.boundingBox()
  if (!rowBounds) throw new Error('Missing strip row')
  for (const label of ['上移第 1 項', '下移第 1 項', '刪除第 1 項']) {
    const button = page.getByRole('button', { name: label, exact: true })
    const bounds = await button.boundingBox()
    if (!bounds) throw new Error('Missing strip action')
    expect(bounds.width).toBe(32)
    expect(bounds.height).toBe(32)
    expect(bounds.y + bounds.height / 2).toBeCloseTo(
      rowBounds.y + rowBounds.height / 2
    )
    const drawing = await button.locator('svg path').evaluate((node) => {
      const box = (node as SVGGraphicsElement).getBBox()
      const style = getComputedStyle(node)
      const stroke =
        style.stroke === 'none' ? 0 : Number.parseFloat(style.strokeWidth)
      return { width: box.width + stroke, height: box.height + stroke }
    })
    expect(drawing.width).toBe(16)
    expect(drawing.height).toBe(16)
  }

  await expect(
    page.getByRole('button', { name: '套用設定', exact: true })
  ).toHaveCount(0)
  await expect(page.getByText('查看陣列資料')).toHaveCount(0)
  const length = page.getByLabel('溫室縱向深度', { exact: true })
  const width = page.getByLabel('單棟寬度', { exact: true })
  const initial = await length.boundingBox()
  expect(initial?.height).toBeLessThanOrEqual(28)
  expect(initial?.width).toBeLessThanOrEqual(96)
  await length.fill('12.7')
  await length.press('Enter')
  await expect(
    page.getByRole('button', { name: '復原 ⌘Z', exact: true })
  ).toBeEnabled()
  await width.fill('8')
  await width.press('Tab')
  await expect(width).toHaveValue('8')
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(width).toHaveValue('7')
  await expect(length).toHaveValue('12.7')
  await page.getByTestId('scene').focus()
  await page.keyboard.press('Meta+Shift+z')
  await expect(width).toHaveValue('8')
  await page.keyboard.press('Meta+z')
  await expect(width).toHaveValue('7')
  await page.getByRole('button', { name: '重做 ⇧⌘Z', exact: true }).click()
  await expect(width).toHaveValue('8')
  await page.getByRole('button', { name: '上移第 2 項', exact: true }).click()
  await expect(page.getByLabel('第 1 項種類')).toHaveValue('drain')
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(page.getByLabel('第 1 項種類')).toHaveValue('soil')
  const bottom = page.getByLabel('拉網最低位置', { exact: true })
  await bottom.fill('4')
  await bottom.press('Enter')
  await expect(page.getByRole('alert')).toContainText('底部高度')
  await expect(bottom).toHaveValue('0.45')
  await bottom.fill('')
  await bottom.press('Tab')
  await expect(bottom).toHaveValue('0.45')
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(width).toHaveValue('7')
  await page.screenshot({
    path: testInfo.outputPath('immediate-configuration.png'),
    fullPage: true
  })
  expect(errors).toEqual([])
})

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
  await page.screenshot({
    path: testInfo.outputPath('editable-structure-dimensions.png'),
    fullPage: true
  })
  await page.getByLabel('第 7 項寬度').scrollIntoViewIfNeeded()
  await page.screenshot({
    path: testInfo.outputPath('editable-side-clearance.png'),
    fullPage: true
  })
})

test('soil-width edits stay responsive in the fully planted scene', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const input = page.getByLabel('第 1 項寬度', { exact: true })
  const timings: number[] = []
  for (const value of ['1.0', '1.1', '0.9']) {
    await input.fill(value)
    timings.push(
      await input.evaluate(async (element) => {
        const start = performance.now()
        element.blur()
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
        return performance.now() - start
      })
    )
    await expect(input).toHaveValue(String(Number(value)))
  }
  await writeFile(
    testInfo.outputPath('soil-edit-response.json'),
    JSON.stringify({ timingsMs: timings, viewport: [1440, 1100], plants: 5952 })
  )
  await testInfo.attach('soil-edit-response', {
    body: JSON.stringify({
      timingsMs: timings,
      viewport: [1440, 1100],
      plants: 5952
    }),
    contentType: 'application/json'
  })
  expect(Math.max(...timings)).toBeLessThan(250)
  await page.screenshot({
    path: testInfo.outputPath('soil-edit-response.png'),
    fullPage: true
  })
})

test('soil edit history restores the rendered canvas as well as field values', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const input = page.getByLabel('第 1 項寬度', { exact: true })
  const canvas = page.getByTestId('scene').locator('canvas')
  // GPU edge rasterization can differ after object replacement; permit only
  // 0.1% materially different pixels. Runtime tests compare transforms exactly.
  const difference = (a: Buffer, b: Buffer) =>
    page.evaluate(
      async ([a, b]) => {
        const pixels = async (data: string) => {
          const image = await createImageBitmap(
            await (await fetch(data)).blob()
          )
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const context = canvas.getContext('2d')
          if (!context) throw new Error('Missing screenshot comparison context')
          context.drawImage(image, 0, 0)
          const result = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          ).data
          image.close()
          return result
        }
        const [first, second] = await Promise.all([pixels(a), pixels(b)])
        if (first.length !== second.length) return 1
        let changed = 0
        for (let i = 0; i < first.length; i += 4)
          if (
            [0, 1, 2].some(
              (offset) => Math.abs(first[i + offset] - second[i + offset]) > 8
            )
          )
            changed++
        return changed / (first.length / 4)
      },
      [a, b].map(
        (buffer) => `data:image/png;base64,${buffer.toString('base64')}`
      )
    )
  const original = await canvas.screenshot({
    path: testInfo.outputPath('original.png')
  })
  await input.fill('1.1')
  await input.press('Enter')
  await expect(input).toHaveValue('1.1')
  const changed = await canvas.screenshot({
    path: testInfo.outputPath('changed.png')
  })
  expect(changed.equals(original)).toBe(false)
  await page.getByRole('button', { name: '復原 ⌘Z', exact: true }).click()
  await expect(input).toHaveValue('0.9')
  await canvas.screenshot({ path: testInfo.outputPath('undo.png') })
  expect(await difference(await canvas.screenshot(), original)).toBeLessThan(
    0.001
  )
  await page.getByRole('button', { name: '重做 ⇧⌘Z', exact: true }).click()
  await expect(input).toHaveValue('1.1')
  expect(await difference(await canvas.screenshot(), changed)).toBeLessThan(
    0.001
  )
})

for (const modifier of ['Meta', 'Control'])
  test(`committed soil edits use ${modifier} history while a numeric field has focus`, async ({
    page
  }) => {
    await page.goto('/')
    await expect(page.getByText('空間模型已就緒')).toBeVisible()
    const input = page.getByLabel('第 1 項寬度', { exact: true })
    await input.fill('1.1')
    await input.press('Enter')
    await input.focus()
    await input.press(`${modifier}+z`)
    await expect(
      page.getByRole('button', { name: '復原 ⌘Z', exact: true })
    ).toBeDisabled()
    await expect(input).toHaveValue('0.9')
    await input.press(`${modifier}+Shift+z`)
    await expect(input).toHaveValue('1.1')
    await input.fill('1.2')
    await input.press(`${modifier}+z`)
    await expect(
      page.getByRole('button', { name: '復原 ⌘Z', exact: true })
    ).toBeEnabled()
    await expect(page.getByLabel('兩側各留', { exact: true })).toHaveValue(
      '0.25'
    )
    if (modifier === 'Meta') {
      await expect(input).toHaveValue('1.1')
      await input.press('Meta+Shift+z')
      await expect(input).toHaveValue('1.2')
    }
    await input.press('Escape')
    await expect(input).toHaveValue('1.1')
  })
