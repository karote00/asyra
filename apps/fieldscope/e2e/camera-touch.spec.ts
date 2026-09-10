import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true
})

test('two-finger pinch changes camera distance and touch handoff stays continuous', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await expect(
    page.getByText('單指轉向 - 雙指平移 - 捏合前後移動')
  ).toBeVisible()
  const scene = page.getByTestId('scene')
  await scene.scrollIntoViewIfNeeded()
  const bounds = await scene.boundingBox()
  if (!bounds) throw new Error('Missing viewport')
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  const session = await page.context().newCDPSession(page)
  const touch = (
    type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel',
    points: number[][]
  ) =>
    session.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: points.map(([id, px, py]) => ({ id, x: px, y: py }))
    })
  await touch('touchStart', [
    [1, x - 40, y],
    [2, x + 40, y]
  ])
  await touch('touchMove', [
    [1, x - 80, y],
    [2, x + 80, y]
  ])
  await expect(page.getByTestId('zoom-percent')).toHaveText('200%')
  await touch('touchMove', [
    [1, x - 40, y],
    [2, x + 40, y]
  ])
  await expect(page.getByTestId('zoom-percent')).toHaveText('100%')
  const canvas = page.locator('canvas')
  const beforePan = await canvas.screenshot()
  await touch('touchMove', [
    [1, x - 20, y + 25],
    [2, x + 60, y + 25]
  ])
  expect((await canvas.screenshot()).equals(beforePan)).toBe(false)
  await expect(page.getByTestId('zoom-percent')).toHaveText('100%')
  const panned = await canvas.screenshot()
  await touch('touchStart', [
    [1, x - 20, y + 25],
    [2, x + 60, y + 25],
    [3, x, y - 60]
  ])
  await touch('touchMove', [
    [1, x - 30, y + 30],
    [2, x + 70, y + 30],
    [3, x + 10, y - 50]
  ])
  expect((await canvas.screenshot()).equals(panned)).toBe(true)
  await touch('touchEnd', [
    [2, x + 70, y + 30],
    [3, x + 10, y - 50]
  ])
  expect((await canvas.screenshot()).equals(panned)).toBe(true)
  await touch('touchMove', [[1, x - 10, y + 30]])
  expect((await canvas.screenshot()).equals(panned)).toBe(false)
  await touch('touchCancel', [])
  const canceled = await canvas.screenshot()
  await touch('touchStart', [[4, x, y]])
  expect((await canvas.screenshot()).equals(canceled)).toBe(true)
  await touch('touchEnd', [])
  await page.screenshot({
    path: testInfo.outputPath('mobile-camera.png'),
    fullPage: true
  })
  await session.detach()
})

test('two-finger translation matches desktop pan instead of stationary look', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await expect(
    page.getByText('單指轉向 - 雙指平移 - 捏合前後移動')
  ).toBeVisible()
  const scene = page.getByTestId('scene')
  await scene.scrollIntoViewIfNeeded()
  const bounds = await scene.boundingBox()
  if (!bounds) throw new Error('Missing viewport')
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  await page.mouse.move(x, y)
  await page.keyboard.down('Shift')
  await page.mouse.down()
  await page.mouse.move(x + 30, y + 20)
  await page.mouse.up()
  await page.keyboard.up('Shift')
  // Exclude the input-device hint and focus outline from camera equivalence.
  const clip = {
    x: bounds.x + 5,
    y: bounds.y + 65,
    width: bounds.width - 10,
    height: bounds.height - 140
  }
  const expected = await page.screenshot({
    clip,
    path: testInfo.outputPath('mouse-pan.png')
  })
  await page.reload()
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await scene.scrollIntoViewIfNeeded()
  const session = await page.context().newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { id: 1, x: x - 40, y },
      { id: 2, x: x + 40, y }
    ]
  })
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { id: 1, x: x - 10, y: y + 20 },
      { id: 2, x: x + 70, y: y + 20 }
    ]
  })
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  })
  expect(
    (
      await page.screenshot({
        clip,
        path: testInfo.outputPath('touch-pan.png')
      })
    ).equals(expected)
  ).toBe(true)
  await session.detach()
})
