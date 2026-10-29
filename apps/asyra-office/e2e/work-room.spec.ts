import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 2 })

test('work room reference review exposes shelf inventory and the thin divider cap', async ({
  page
}, info) => {
  test.skip(
    process.env.OFFICE_HARDWARE_REVIEW !== '1',
    'Requires hardware WebGL.'
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  await page
    .getByRole('button', {
      name: 'Work room Desk, shelves, ideas',
      exact: true
    })
    .click()
  const canvas = page.getByLabel('Office 3D scene').locator('canvas')
  const settle = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
  await settle()
  await canvas.screenshot({ path: info.outputPath('work-room.png') })
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Missing work-room canvas')
  await page.screenshot({
    path: info.outputPath('work-shelves.png'),
    clip: {
      x: bounds.x + bounds.width * 0.34,
      y: bounds.y + bounds.height * 0.07,
      width: bounds.width * 0.31,
      height: bounds.height * 0.33
    }
  })
  // Use normal held-key navigation, never a test-only camera or scene mutation.
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(600)
  await page.keyboard.up('ArrowRight')
  await page.waitForTimeout(300)
  for (let i = 0; i < 2; i++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await settle()
  await canvas.screenshot({ path: info.outputPath('work-divider-detail.png') })
  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      deviceScaleFactor: 2,
      initialView: 'Work room',
      detailView:
        'ArrowRight held for 600 ms, released for 300 ms, two zoom-in clicks',
      reference: 'owner work-room crop - 2026-10-29',
      geometry: 'production scene',
      acceptance:
        'geometry tests plus manual inspection; screenshots alone do not assert visual equivalence'
    }),
    contentType: 'application/json'
  })
  expect(errors).toEqual([])
})

test('work floor plant exposes square cavity and upright and arching broad leaves', async ({
  page
}, info) => {
  test.skip(
    process.env.OFFICE_HARDWARE_REVIEW !== '1',
    'Requires hardware WebGL.'
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  await page
    .getByRole('button', {
      name: 'Work room Desk, shelves, ideas',
      exact: true
    })
    .click()
  const canvas = page.getByLabel('Office 3D scene').locator('canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Missing live scene bounds')
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - 80, y + 150, { steps: 8 })
  await page.mouse.up()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await canvas.screenshot({ path: info.outputPath('floor-plant-context.png') })
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y - 65, { steps: 8 })
  await page.mouse.up()
  await page.keyboard.down('ArrowLeft')
  await page.waitForTimeout(200)
  await page.keyboard.up('ArrowLeft')
  await page.waitForTimeout(300)
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await canvas.screenshot({ path: info.outputPath('floor-plant-detail.png') })
  await page.screenshot({
    path: info.outputPath('floor-plant-closeup.png'),
    clip: {
      x: bounds.x + bounds.width * 0.46,
      y: bounds.y + bounds.height * 0.23,
      width: bounds.width * 0.2,
      height: bounds.height * 0.27
    }
  })

  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      deviceScaleFactor: 2,
      assembly: 'work-floor-plant',
      camera:
        'Work room: orbit -80/+150, then 0/-65, left 200 ms, settle 300 ms, zoom in three clicks',
      reference: 'owner square floor planter crop - 2026-10-29',
      evidence: 'production geometry; manual screenshot inspection required'
    }),
    contentType: 'application/json'
  })
  expect(errors).toEqual([])
})

test('five shelf plants show the selected botanical designs and preserved colors', async ({
  page
}, info) => {
  test.skip(
    process.env.OFFICE_HARDWARE_REVIEW !== '1',
    'Requires hardware WebGL.'
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  await page
    .getByRole('button', {
      name: 'Work room Desk, shelves, ideas',
      exact: true
    })
    .click()
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  const canvas = page.getByLabel('Office 3D scene').locator('canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Missing live canvas')
  await canvas.screenshot({ path: info.outputPath('shelf-context.png') })
  await page.screenshot({
    path: info.outputPath('five-shelf-plants.png'),
    clip: {
      x: bounds.x + bounds.width * 0.34,
      y: bounds.y,
      width: bounds.width * 0.32,
      height: bounds.height * 0.46
    }
  })
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(850)
  await page.keyboard.up('ArrowUp')
  await page.waitForTimeout(300)
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await canvas.screenshot({ path: info.outputPath('shelf-detail.png') })
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y - 40, { steps: 8 })
  await page.mouse.up()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await canvas.screenshot({ path: info.outputPath('shelf-lower-angle.png') })
  await page.screenshot({
    path: info.outputPath('five-shelf-plants-detail.png'),
    clip: {
      x: bounds.x + bounds.width * 0.38,
      y: bounds.y,
      width: bounds.width * 0.28,
      height: bounds.height * 0.4
    }
  })

  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      deviceScaleFactor: 2,
      camera:
        'Work room, one zoom-out; detail: ArrowUp 850 ms, release 300 ms, three zoom-in clicks; lower angle uses a 0/-40 pixel orbit',
      scope: 'five work-shelf plants',
      reference: 'work-shelf-plants-owner-reference.png',
      geometry: 'production scene; image inspection required'
    }),
    contentType: 'application/json'
  })
  expect(errors).toEqual([])
})
