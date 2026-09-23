import { expect, test, type Locator, type Page } from '@playwright/test'

interface StarterCanvasMetrics {
  readonly totalInk: number
  readonly rowInk: readonly number[]
  readonly gapInk: readonly number[]
}

const measureStarterCanvas = async (
  page: Page,
  canvas: Locator
): Promise<StarterCanvasMetrics> => {
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  const screenshot = await page.screenshot()
  return page.evaluate(
    async ({ imageDataUrl, box }) => {
      const image = new Image()
      image.src = imageDataUrl
      await image.decode()
      const surface = document.createElement('canvas')
      surface.width = image.naturalWidth
      surface.height = image.naturalHeight
      const context = surface.getContext('2d')
      if (!context || !box) {
        return {
          totalInk: 0,
          rowInk: [0, 0, 0],
          gapInk: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]
        }
      }
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, surface.width, surface.height)
      const scaleX = surface.width / window.innerWidth
      const scaleY = surface.height / window.innerHeight
      const rowInk = [0, 0, 0]
      const gapInk = [0, 0]
      let totalInk = 0
      const isBackground = (red: number, green: number, blue: number) =>
        Math.abs(red - 243) <= 3 &&
        Math.abs(green - 246) <= 3 &&
        Math.abs(blue - 242) <= 3
      for (
        let y = Math.floor(box.y * scaleY);
        y < Math.ceil((box.y + box.height) * scaleY);
        y += 1
      ) {
        for (
          let x = Math.floor(box.x * scaleX);
          x < Math.ceil((box.x + Math.min(box.width, 210)) * scaleX);
          x += 1
        ) {
          const offset = (y * surface.width + x) * 4
          const red = pixels.data[offset] ?? 0
          const green = pixels.data[offset + 1] ?? 0
          const blue = pixels.data[offset + 2] ?? 0
          const alpha = pixels.data[offset + 3] ?? 0
          if (alpha === 0 || isBackground(red, green, blue)) {
            continue
          }
          const xCss = x / scaleX - box.x
          const yCss = y / scaleY - box.y
          if (xCss < 20 || xCss > 190) {
            continue
          }
          totalInk += 1
          ;[
            [20, 100],
            [108, 188],
            [196, 276]
          ].forEach(([start, end], row) => {
            if (yCss >= start && yCss <= end) {
              rowInk[row] += 1
            }
          })
          ;[
            [100, 108],
            [188, 196]
          ].forEach(([start, end], gap) => {
            if (yCss >= start && yCss <= end) {
              gapInk[gap] += 1
            }
          })
        }
      }
      return { totalInk, rowInk, gapInk }
    },
    {
      imageDataUrl: `data:image/png;base64,${screenshot.toString('base64')}`,
      box
    }
  )
}

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
  await expect
    .poll(async () => (await measureStarterCanvas(page, canvas)).totalInk)
    .toBeGreaterThan(500)
  await expect
    .poll(async () =>
      (await measureStarterCanvas(page, canvas)).rowInk.every(
        (count) => count > 300
      )
    )
    .toBe(true)
  await expect
    .poll(async () =>
      (await measureStarterCanvas(page, canvas)).gapInk.every(
        (count) => count < 25
      )
    )
    .toBe(true)

  await page.screenshot({
    path: testInfo.outputPath(`starter-${testInfo.project.name}.png`),
    fullPage: true
  })
})
