import { expect, test } from '@playwright/test'
import { usesCpuSoftwareRenderer } from './renderer-environment'

test('soil edit history restores the rendered canvas as well as field values', async ({
  page
}, testInfo) => {
  test.skip(
    usesCpuSoftwareRenderer,
    'Canvas raster equivalence is verified with the desktop GPU renderer.'
  )
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
