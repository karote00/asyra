import { expect, test } from '@playwright/test'

test('automatically persists committed edits and Undo across reload with one project identity', async ({
  page
}, info) => {
  await page.goto('/')
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  const projectURL = page.url()
  expect(new URL(projectURL).searchParams.get('projectId')).toBeTruthy()
  await expect(
    page.getByRole('button', { name: 'Save', exact: true })
  ).toHaveCount(0)
  await page
    .getByRole('treeitem', { name: '◇ fixture post', exact: true })
    .click()
  await page.getByLabel('Object name').fill('Automatically retained fixture')
  await page.getByLabel('Object name').press('Enter')
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(
    page.getByRole('treeitem', { name: '◇ fixture post', exact: true })
  ).toBeVisible()
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(
    page.getByRole('treeitem', {
      name: '◇ Automatically retained fixture',
      exact: true
    })
  ).toBeVisible()
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.reload()
  await expect(
    page.getByRole('treeitem', {
      name: '◇ Automatically retained fixture',
      exact: true
    })
  ).toBeVisible()
  expect(page.url()).toBe(projectURL)
  await expect(page.getByTestId('history-depth')).toHaveText('Undo steps: 0')
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page
    .getByLabel('Project name', { exact: true })
    .fill('Automatic project')
  await page.getByLabel('Project name', { exact: true }).press('Enter')
  await expect(page.getByTestId('persistence-status')).toHaveText(
    'Saved locally - Automatic project'
  )
  await expect(
    page.getByRole('button', { name: 'Save project', exact: true })
  ).toHaveCount(0)
  await page.screenshot({ path: info.outputPath('automatic-project.png') })
  await page
    .getByRole('button', { name: 'Close projects', exact: true })
    .click()
  await page.reload()
  await expect(page.getByTestId('persistence-status')).toHaveText(
    'Saved locally - Automatic project'
  )
  expect(page.url()).toBe(projectURL)
})

test('automatically retains completed evidence and reloads it without Retain or Save', async ({
  page
}) => {
  await page.goto('/')
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page
    .getByRole('button', { name: 'Run formal analysis', exact: true })
    .click()
  await expect(page.getByTestId('analysis-result')).toBeVisible({
    timeout: 20000
  })
  await expect(page.locator('.retention-actions')).toContainText(
    'Retained in this project'
  )
  await expect(
    page.getByRole('button', { name: 'Retain result', exact: true })
  ).toHaveCount(0)
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.reload()
  await expect(page.getByTestId('persistence-status')).toContainText(
    'Saved locally'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await expect(page.getByTestId('analysis-result')).toBeVisible()
  await expect(page.locator('.retention-actions')).toContainText(
    'Retained in this project'
  )
})

test('a missing reload target remains retryable without replacing its identity with the startup example', async ({
  page
}) => {
  await page.goto('/?projectId=missing-project')
  await expect(page.getByTestId('persistence-status')).toContainText('error')
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page
    .getByRole('button', { name: 'Retry persistence', exact: true })
    .click()
  await expect(page.getByTestId('persistence-status')).toContainText('error')
  expect(new URL(page.url()).searchParams.get('projectId')).toBe(
    'missing-project'
  )
})
