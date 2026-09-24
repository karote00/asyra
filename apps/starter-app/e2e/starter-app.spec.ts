import { expect, test, type Locator, type Page } from '@playwright/test'

interface StarterCanvasMetrics {
  readonly totalInk: number
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
        return { totalInk: 0 }
      }
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, surface.width, surface.height)
      const scaleX = surface.width / window.innerWidth
      const scaleY = surface.height / window.innerHeight
      let totalInk = 0
      const isBackground = (red: number, green: number, blue: number) =>
        (Math.abs(red - 251) <= 3 &&
          Math.abs(green - 252) <= 3 &&
          Math.abs(blue - 249) <= 3) ||
        (Math.abs(red - 238) <= 3 &&
          Math.abs(green - 242) <= 3 &&
          Math.abs(blue - 237) <= 3)
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
          if (xCss < 20 || xCss > 190) {
            continue
          }
          totalInk += 1
        }
      }
      return { totalInk }
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

  await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible()
  await expect(page.getByText('Ready')).toBeVisible()
  const canvas = page.locator('#starter-render-host canvas')
  await expect(canvas).toBeVisible()

  await page.getByRole('button', { name: 'Add item' }).click()
  const titleField = page.getByRole('textbox', { name: 'Title' })
  const firstStatus = page.getByRole('group', { name: 'Status' })
  await expect(titleField).toHaveValue('Item 1')
  await page.getByRole('button', { name: 'Add item' }).click()
  await page.getByRole('button', { name: 'Add item' }).click()
  await expect(
    page.getByRole('button', { name: 'Select Item 3' })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Item 1', exact: true }).click()

  await titleField.fill('Inspectable starter item')
  await titleField.press('Enter')
  await expect(page.getByText(/^Updated title/)).toBeVisible()

  await firstStatus.getByRole('button', { name: 'Doing' }).click()
  await expect(page.getByText(/^Updated status/)).toBeVisible()
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

  await page.screenshot({
    path: testInfo.outputPath(`starter-${testInfo.project.name}.png`),
    fullPage: true
  })
})

test('selects a canvas Item and edits through one inspector', async ({
  page
}) => {
  await page.goto('/')
  await expect(page.getByText('Select an Item to edit')).toBeVisible()
  await page.getByRole('button', { name: 'Add item' }).click()
  await page.getByRole('button', { name: 'Add item' }).click()
  await page.getByRole('button', { name: 'Item 1', exact: true }).click()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('button', { name: 'Select Item 2' })).toHaveCount(
    0
  )
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(
    page.getByRole('button', { name: 'Select Item 2' })
  ).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
    'Item 1'
  )
  await page.getByRole('textbox', { name: 'Title' }).fill('Selected on canvas')
  await page.getByRole('textbox', { name: 'Title' }).press('Enter')
  await expect(
    page.getByRole('button', { name: 'Selected on canvas', exact: true })
  ).toBeVisible()
  await page
    .getByRole('group', { name: 'Status' })
    .getByRole('button', { name: 'Doing' })
    .click()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(
    page
      .getByRole('group', { name: 'Status' })
      .getByRole('button', { name: 'Todo' })
  ).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(
    page
      .getByRole('group', { name: 'Status' })
      .getByRole('button', { name: 'Doing' })
  ).toHaveAttribute('aria-pressed', 'true')
})

test('drags an Item as one action and restores its position', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('Ready')).toBeVisible()
  await page.getByRole('button', { name: 'Add item' }).click()
  const item = page.getByRole('button', { name: 'Item 1', exact: true })
  const original = await item.boundingBox()
  expect(original).not.toBeNull()
  await item.dragTo(page.locator('.render-stage'), {
    targetPosition: { x: 140, y: 280 }
  })
  await expect(page.getByText(/^Moved item/)).toBeVisible()
  const moved = await item.boundingBox()
  expect(moved).not.toBeNull()
  expect(Math.abs((moved?.x ?? 0) - (original?.x ?? 0))).toBeGreaterThan(10)
  expect(Math.abs((moved?.y ?? 0) - (original?.y ?? 0))).toBeGreaterThan(10)
  await page.screenshot({
    path: testInfo.outputPath(`starter-drag-${testInfo.project.name}.png`),
    fullPage: true
  })

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect
    .poll(async () => (await item.boundingBox())?.x)
    .toBeCloseTo(original?.x ?? 0, 0)
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect
    .poll(async () => (await item.boundingBox())?.x)
    .toBeCloseTo(moved?.x ?? 0, 0)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(/^Saved at /)).toBeVisible()
  await item.dragTo(page.locator('.render-stage'), {
    targetPosition: { x: 70, y: 280 }
  })
  await page.getByRole('button', { name: 'Reload' }).click()
  await expect
    .poll(async () => (await item.boundingBox())?.x)
    .toBeCloseTo(moved?.x ?? 0, 0)
})
