import { expect, test } from '@playwright/test'

test('focused canvas moves with W/S and right-drag looks around without changing optical zoom', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('Spatial model ready')).toBeVisible()
  await page.getByRole('button', { name: 'Clip close-up', exact: true }).click()
  const scene = page.getByTestId('scene')
  const canvas = page.locator('canvas')
  await scene.focus()
  const before = await canvas.screenshot()
  await page.keyboard.press('w')
  await expect(page.getByTestId('zoom-percent')).toHaveText('100%')
  expect((await canvas.screenshot()).equals(before)).toBe(false)
  await page.keyboard.press('s')
  const bounds = await scene.boundingBox()
  if (!bounds) throw new Error('Missing scene')
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2
  )
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 60,
    bounds.y + bounds.height / 2 + 20,
    { steps: 5 }
  )
  await page.mouse.up({ button: 'right' })
  await expect(page.getByTestId('zoom-percent')).toHaveText('100%')
  const looked = await canvas.screenshot()
  expect(looked.equals(before)).toBe(false)
  await page.screenshot({
    path: testInfo.outputPath('flight-look.png'),
    fullPage: true
  })
  await page.getByLabel('Greenhouse depth', { exact: true }).focus()
  const editing = await canvas.screenshot()
  await page.keyboard.press('w')
  expect((await canvas.screenshot()).equals(editing)).toBe(true)
  await expect(
    page.getByRole('button', { name: 'Undo ⌘Z', exact: true })
  ).toBeDisabled()
})

test('wheel travels in world space and right-wheel changes speed without moving the camera', async ({
  page
}) => {
  await page.goto('/')
  await expect(page.getByText('Spatial model ready')).toBeVisible()
  const scene = page.getByTestId('scene')
  const canvas = page.locator('canvas')
  await canvas.hover()
  const initial = await canvas.screenshot()
  await page.mouse.wheel(0, -600)
  await expect(page.getByTestId('zoom-percent')).toHaveText('182%')
  expect((await canvas.screenshot()).equals(initial)).toBe(false)
  await scene.focus()
  await page.keyboard.press('Shift')
  // Speed controls overlay the canvas and intentionally change during tuning.
  const cameraImage = () =>
    canvas.screenshot({
      mask: [
        page.getByRole('slider', { name: 'Camera movement speed' }),
        page.getByTestId('movement-speed')
      ]
    })
  const traveled = await cameraImage()
  await page.mouse.down({ button: 'right' })
  await page.mouse.wheel(0, -400)
  await expect(page.getByTestId('movement-speed')).toHaveText('13.35 m/s')
  await page.mouse.up({ button: 'right' })
  await page.keyboard.press('Shift')
  await expect(page.getByTestId('movement-speed')).toHaveText('13.35 m/s')
  expect((await cameraImage()).equals(traveled)).toBe(true)
  await page.getByTitle('Restore 100% (⌘0)').click()
  await canvas.hover()
  await page.keyboard.down('Alt')
  await page.mouse.wheel(0, -Math.log(15.21) * 1000)
  await page.keyboard.up('Alt')
  await expect(page.getByTestId('zoom-percent')).toHaveText('1521%')
  await expect(page.getByTestId('movement-speed')).toHaveText('13.35 m/s')
  await page.getByTitle('Restore 100% (⌘0)').click()
  await expect(page.getByTestId('movement-speed')).toHaveText('13.35 m/s')
})
