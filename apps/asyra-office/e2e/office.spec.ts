import { expect, test } from '@playwright/test'
test('room, agent, pet, task, waypoint, proposal and persistence path', async ({
  page
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: 'Start synthetic task' })
  ).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  const graphics = await page.locator('canvas').evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl2')
    if (!gl || gl.isContextLost())
      throw new Error('Missing live WebGL2 context')
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      version: gl.getParameter(gl.VERSION),
      renderer: info
        ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER),
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      deviceScaleFactor: devicePixelRatio
    }
  })
  expect(graphics.version).toContain('WebGL 2')
  expect(graphics.width).toBeGreaterThan(0)
  expect(graphics.height).toBeGreaterThan(0)
  await testInfo.attach('live-webgl-context', {
    body: JSON.stringify({
      ...graphics,
      url: page.url(),
      viewport: page.viewportSize()
    }),
    contentType: 'application/json'
  })
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
