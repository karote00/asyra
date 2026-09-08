import { expect, test } from '@playwright/test'

test('focused canvas moves with W/S and right-drag looks around without changing optical zoom', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await page.getByRole('button', { name: '夾具近看', exact: true }).click()
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
  await page.getByLabel('溫室縱向深度', { exact: true }).focus()
  const editing = await canvas.screenshot()
  await page.keyboard.press('w')
  expect((await canvas.screenshot()).equals(editing)).toBe(true)
  await expect(
    page.getByRole('button', { name: '復原 ⌘Z', exact: true })
  ).toBeDisabled()
})
