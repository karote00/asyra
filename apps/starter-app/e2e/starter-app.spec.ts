import { expect, test, type Locator } from '@playwright/test'

const countNonBackgroundPixels = async (canvas: Locator) =>
  canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement
    const gl =
      element.getContext('webgl2', { preserveDrawingBuffer: true }) ??
      element.getContext('webgl', { preserveDrawingBuffer: true })
    if (!gl) {
      return 0
    }
    const width = element.width
    const height = element.height
    const pixels = new Uint8Array(width * height * 4)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    let count = 0
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index] ?? 0
      const green = pixels[index + 1] ?? 0
      const blue = pixels[index + 2] ?? 0
      const alpha = pixels[index + 3] ?? 0
      const isBackground =
        Math.abs(red - 243) <= 3 &&
        Math.abs(green - 246) <= 3 &&
        Math.abs(blue - 242) <= 3
      if (alpha > 0 && !isBackground) {
        count += 1
      }
    }
    return count
  })

const countInkByStarterRow = async (canvas: Locator) =>
  canvas.evaluate((node) => {
    const element = node as HTMLCanvasElement
    const gl =
      element.getContext('webgl2', { preserveDrawingBuffer: true }) ??
      element.getContext('webgl', { preserveDrawingBuffer: true })
    if (!gl) {
      return [0, 0, 0]
    }
    const width = element.width
    const height = element.height
    const pixels = new Uint8Array(width * height * 4)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    const counts = [0, 0, 0]
    for (let index = 0; index < pixels.length; index += 4) {
      const pixel = index / 4
      const yFromBottom = Math.floor(pixel / width)
      const yFromTop = height - 1 - yFromBottom
      const red = pixels[index] ?? 0
      const green = pixels[index + 1] ?? 0
      const blue = pixels[index + 2] ?? 0
      const alpha = pixels[index + 3] ?? 0
      const isBackground =
        Math.abs(red - 243) <= 3 &&
        Math.abs(green - 246) <= 3 &&
        Math.abs(blue - 242) <= 3
      if (alpha === 0 || isBackground) {
        continue
      }
      ;[
        [20, 100],
        [108, 188],
        [196, 276]
      ].forEach(([start, end], row) => {
        if (yFromTop >= start && yFromTop <= end) {
          counts[row] += 1
        }
      })
    }
    return counts
  })

test('supports canonical item editing and responsive layout', async ({
  page
}, testInfo) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Starter App' })).toBeVisible()
  await expect(page.getByText('Ready')).toBeVisible()
  const canvas = page.locator('#starter-render-host canvas')
  await expect(canvas).toBeVisible()

  await page.getByRole('button', { name: 'Add' }).click()
  const titleField = page.getByRole('textbox').first()
  const firstStatus = page.getByLabel(/^Status for /).first()
  await expect(titleField).toHaveValue('Item 1')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByRole('textbox')).toHaveCount(3)

  await titleField.fill('Inspectable starter item')
  await titleField.press('Enter')
  await expect(page.getByText('Updated title')).toBeVisible()

  await firstStatus.getByRole('button', { name: 'Doing' }).click()
  await expect(page.getByText('Updated status')).toBeVisible()
  await expect(firstStatus.getByRole('button', { name: 'Doing' })).toHaveClass(
    /active/
  )

  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(/^Saved at /)).toBeVisible()

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(firstStatus.getByRole('button', { name: 'Todo' })).toHaveClass(
    /active/
  )

  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(firstStatus.getByRole('button', { name: 'Doing' })).toHaveClass(
    /active/
  )

  await page.getByRole('button', { name: 'Reload' }).click()
  await expect(page.getByText(/^Reloaded /)).toBeVisible()
  await expect(titleField).toHaveValue('Inspectable starter item')
  await expect(firstStatus.getByRole('button', { name: 'Doing' })).toHaveClass(
    /active/
  )
  await expect.poll(() => countNonBackgroundPixels(canvas)).toBeGreaterThan(500)
  await expect
    .poll(async () =>
      (await countInkByStarterRow(canvas)).every((count) => count > 300)
    )
    .toBe(true)

  await page.screenshot({
    path: testInfo.outputPath(`starter-${testInfo.project.name}.png`),
    fullPage: true
  })
})
