import { expect, test } from '@playwright/test'

test('applies one configuration transaction and supports button and keyboard undo/redo', async ({
  page
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByText('Spatial model ready')).toBeVisible()
  const length = page.getByLabel('Greenhouse depth', { exact: true })
  const width = page.getByLabel('Single bay width', { exact: true })
  await length.fill('12.7')
  await width.fill('8')
  await page.getByLabel('Greenhouse height', { exact: true }).fill('4.5')
  await page.getByLabel('Net top height', { exact: true }).fill('2.6')
  await page
    .getByRole('button', { name: 'move item 2 left', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Apply settings', exact: true })
    .click()
  await expect(
    page.getByText('Applied: beam 2.70m, side margins 0.85m')
  ).toBeVisible()
  await expect(page.getByLabel('item 1 type')).toHaveValue('drain')
  await page.screenshot({
    path: testInfo.outputPath('edited-configuration.png'),
    fullPage: true
  })
  await page.getByRole('button', { name: 'Undo ⌘Z', exact: true }).click()
  await expect(length).toHaveValue('50')
  await expect(width).toHaveValue('7')
  await expect(page.getByLabel('item 1 type')).toHaveValue('soil')
  await page.getByTestId('scene').focus()
  await page.keyboard.press('Meta+Shift+z')
  await expect(length).toHaveValue('12.7')
  await expect(width).toHaveValue('8')
  await page.keyboard.press('Meta+z')
  await expect(length).toHaveValue('50')
  await page.getByRole('button', { name: 'Redo ⇧⌘Z', exact: true }).click()
  await expect(length).toHaveValue('12.7')
  await page.getByLabel('Net bottom height', { exact: true }).fill('4')
  await page
    .getByRole('button', { name: 'Apply settings', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('net bottom height')
  await page.getByRole('button', { name: 'Undo ⌘Z', exact: true }).click()
  await expect(length).toHaveValue('50')
  expect(errors).toEqual([])
})
