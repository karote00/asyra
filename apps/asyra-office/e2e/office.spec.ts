import { expect, test } from '@playwright/test'
test('room, agent, pet, task, waypoint, proposal and persistence path', async ({
  page
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Start synthetic task' })
  ).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Start synthetic task' }).click()
  await expect(
    page.getByRole('button', { name: 'Follow Ari', exact: true }).first()
  ).toContainText('Working')
  await page.getByRole('tab', { name: 'Sources' }).click()
  await page.getByRole('button', { name: 'Completed', exact: true }).click()
  await page.getByRole('button', { name: 'Park break' }).click()
  await page
    .getByRole('button', { name: 'Follow Ari', exact: true })
    .last()
    .click()
  await page.getByRole('tab', { name: 'Layout' }).click()
  await page.getByRole('button', { name: 'Preview suggestion' }).click()
  await page.getByRole('button', { name: 'Right →' }).click()
  await page.getByRole('button', { name: 'Apply proposal' }).click()
  await expect(page.getByRole('alert')).toContainText('changed since preview')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Dismiss' }).click()
  await page.getByRole('button', { name: 'Sage walls' }).click()
  await page.getByRole('button', { name: 'Save layout' }).click()
  await expect(page.getByRole('status')).toContainText('Saved locally')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await page.getByRole('button', { name: 'Load saved' }).click()
  await expect(page.getByRole('status')).toContainText('Saved locally')
  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  await page.screenshot({
    path: 'test-results/office-desktop.png',
    fullPage: true
  })
  await page.reload()
  await page.getByRole('tab', { name: 'Logs' }).click()
  await expect(
    page.getByText('2 retained events. Showing the latest 80.')
  ).toBeVisible()
  expect(errors).toEqual([])
})
test('narrow layout keeps controls reachable without horizontal overflow', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Start synthetic task' })
  ).toBeVisible()
  await page.getByRole('tab', { name: 'Layout' }).click()
  await page.getByRole('button', { name: 'Preview suggestion' }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await page.screenshot({
    path: 'test-results/office-narrow.png',
    fullPage: true
  })
})
