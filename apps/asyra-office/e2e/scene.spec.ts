import { expect, test, type Page } from '@playwright/test'

const painted = async (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )

test('complete office composition and both navigation panels are the default', async ({
  page
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Agent Office', exact: true })
  ).toBeVisible()
  await expect(page.getByText('Reference scene - demo')).toBeVisible()
  await expect(page.getByRole('status', { name: 'Scene status' })).toHaveText(
    'Demo scene ready'
  )
  await expect(
    page.getByRole('tab', { name: 'Places', exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('tab', { name: 'Agents', exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('tab', { name: 'Logs', exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('tab', { name: 'Tasks', exact: true })
  ).toBeVisible()
  await painted(page)
  await page.screenshot({
    path: info.outputPath('office-overview.png'),
    fullPage: true,
    animations: 'disabled'
  })
  await page
    .getByRole('button', {
      name: 'Tea point Coffee, chats, ideas',
      exact: true
    })
    .click()
  await expect(page.getByLabel('Current view')).toHaveText('Tea point')
  await painted(page)
  await page.screenshot({
    path: info.outputPath('tea-point.png'),
    fullPage: true,
    animations: 'disabled'
  })
  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  await page.getByRole('tab', { name: 'Agents', exact: true }).click()
  await page.getByRole('button', { name: 'Follow Mina', exact: false }).click()
  await expect(page.getByLabel('Current view')).toHaveText('Following Mina')
  await painted(page)
  await page.screenshot({
    path: info.outputPath('following-mina.png'),
    fullPage: true
  })
  await page.getByRole('tab', { name: 'Tasks', exact: true }).click()
  await page.getByRole('button', { name: 'In progress 2', exact: true }).click()
  await expect(page.getByTestId('task-row')).toHaveCount(2)
  await page.getByTestId('task-row').first().click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByLabel('Current view')).toContainText('Following')
  await page.getByRole('tab', { name: 'Logs', exact: true }).click()
  await expect(page.getByText('prepared a fresh cup of coffee')).toBeVisible()
  await page.getByRole('searchbox').fill('Lounge')
  await page.getByRole('button', { name: 'Go to Lounge', exact: true }).click()
  await expect(page.getByLabel('Current view')).toHaveText('Lounge')
  await painted(page)
  await page.screenshot({
    path: info.outputPath('lounge.png'),
    fullPage: true,
    animations: 'disabled'
  })
  const graphics = await page
    .getByLabel('Office 3D scene')
    .locator('canvas')
    .evaluate((canvas) => {
      const gl = (canvas as HTMLCanvasElement).getContext('webgl2')
      if (!gl || gl.isContextLost())
        throw new Error('Missing live WebGL2 context')
      return {
        version: gl.getParameter(gl.VERSION),
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        pixelRatio: devicePixelRatio
      }
    })
  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      graphics,
      scope: ['overview', 'pantry', 'lounge', 'rear-follow'],
      source: 'real scene geometry',
      visualAcceptance: 'pending user review'
    }),
    contentType: 'application/json'
  })
  expect(errors).toEqual([])
})

test('mobile drawers retain navigation and demo identity without overflow', async ({
  page
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('status', { name: 'Scene status' })).toHaveText(
    'Demo scene ready'
  )
  await page
    .getByRole('button', { name: 'Places & Agents', exact: true })
    .click()
  await page.getByRole('tab', { name: 'Agents', exact: true }).click()
  await page
    .getByRole('button', { name: 'Follow Mina - Working', exact: true })
    .click()
  await expect(page.getByLabel('Current view')).toHaveText('Following Mina')
  await page.getByRole('button', { name: 'Logs & Tasks', exact: true }).click()
  await page.getByRole('button', { name: 'Blocked 1', exact: true }).click()
  await expect(page.getByTestId('task-row')).toHaveCount(1)
  await page.getByTestId('task-row').click()
  await expect(page.getByLabel('Current view')).toHaveText('Following Sage')
  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  await painted(page)
  await page.screenshot({
    path: info.outputPath('mobile-office.png'),
    fullPage: true
  })
  await page.reload()
  await expect(page.getByRole('status', { name: 'Scene status' })).toHaveText(
    'Demo scene ready'
  )
  await expect(
    page.getByLabel('Office 3D scene').locator('canvas')
  ).toHaveCount(1)
})
