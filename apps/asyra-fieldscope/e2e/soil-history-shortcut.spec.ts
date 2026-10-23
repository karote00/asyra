import { expect, test } from '@playwright/test'

test('a committed soil edit uses the platform history shortcut from a settled numeric field', async ({
  page
}) => {
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
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
})
