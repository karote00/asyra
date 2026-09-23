import { expect, test } from '@playwright/test'

test('supports canonical item editing and responsive layout', async ({
  page
}, testInfo) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Starter App' })).toBeVisible()
  await expect(page.getByText('Ready')).toBeVisible()
  await expect(page.locator('#starter-render-host canvas')).toBeVisible()

  await page.getByRole('button', { name: 'Add' }).click()
  const titleField = page.getByRole('textbox').first()
  await expect(titleField).toHaveValue('Item 1')

  await titleField.fill('Inspectable starter item')
  await titleField.press('Enter')
  await expect(page.getByText('Updated title')).toBeVisible()

  await page.getByRole('button', { name: 'Doing' }).click()
  await expect(page.getByText('Updated status')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Doing' })).toHaveClass(
    /active/
  )

  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(/^Saved at /)).toBeVisible()

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('button', { name: 'Todo' })).toHaveClass(/active/)

  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(page.getByRole('button', { name: 'Doing' })).toHaveClass(
    /active/
  )

  await page.getByRole('button', { name: 'Reload' }).click()
  await expect(page.getByText(/^Reloaded /)).toBeVisible()
  await expect(titleField).toHaveValue('Inspectable starter item')
  await expect(page.getByRole('button', { name: 'Doing' })).toHaveClass(
    /active/
  )

  await page.screenshot({
    path: testInfo.outputPath(`starter-${testInfo.project.name}.png`),
    fullPage: true
  })
})
