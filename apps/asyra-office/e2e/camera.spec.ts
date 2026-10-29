import { expect, test } from '@playwright/test'

// Exercise the same live scene at a supported laptop viewport.
test.use({ viewport: { width: 1024, height: 768 } })

// Frame counts observe presentation progress, not a machine-dependent FPS budget.
async function frames(page: import('@playwright/test').Page, count: number) {
  await page.evaluate(
    (remaining) =>
      new Promise<void>((resolve) => {
        function next() {
          if (--remaining <= 0) resolve()
          else requestAnimationFrame(next)
        }
        requestAnimationFrame(next)
      }),
    count
  )
}

test('held camera input progresses without repeat', async ({ page }, info) => {
  await page.goto('/')
  // Readiness uses the existing whole-case budget, not a separate startup-speed gate.
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  const canvas = page.locator('canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Scene viewport missing')
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2
  )
  await page.mouse.down()
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 80,
    bounds.y + bounds.height / 2,
    { steps: 3 }
  )
  await page.mouse.up()
  await page.keyboard.down('w')
  await frames(page, 3)
  // The viewport is already visible and fixed. Capture its known rectangle
  // without locator scroll/stability work while the camera is continuously moving.
  const first = await page.screenshot({
    clip: bounds,
    path: info.outputPath('moving-first.png')
  })
  await frames(page, 3)
  const second = await page.screenshot({
    clip: bounds,
    path: info.outputPath('moving-later.png')
  })
  expect(second.equals(first)).toBe(false)
  await page.keyboard.up('w')
  await page.getByRole('searchbox').focus()
})

test('release settles without continued movement', async ({ page }, info) => {
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  const canvas = page.locator('canvas')
  await canvas.click()
  await page.keyboard.down('d')
  await frames(page, 3)
  await page.keyboard.up('d')
  // Wait on elapsed presentation time for the documented release tail to settle.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const start = performance.now()
        function next(now: number) {
          if (now - start >= 800) resolve()
          else requestAnimationFrame(next)
        }
        requestAnimationFrame(next)
      })
  )
  const released = await canvas.screenshot({
    path: info.outputPath('released.png')
  })
  await frames(page, 3)
  expect((await canvas.screenshot()).equals(released)).toBe(true)
})

test('text focus immediately cancels held camera movement', async ({
  page
}, info) => {
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  const canvas = page.locator('canvas')
  await canvas.click()
  await page.keyboard.down('w')
  await frames(page, 3)
  const search = page.getByRole('searchbox')
  await search.focus()
  const stopped = await canvas.screenshot({
    path: info.outputPath('text-focus.png')
  })
  await search.fill('wasd')
  await frames(page, 3)
  // Restore the same overlay state before comparing the rendered scene.
  await search.fill('')
  expect((await canvas.screenshot()).equals(stopped)).toBe(true)
  await page.keyboard.up('w')

  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      scenario: 'held W, text focus cancellation, held D and release',
      animation: 'real app camera, no repeat events injected'
    }),
    contentType: 'application/json'
  })
})
