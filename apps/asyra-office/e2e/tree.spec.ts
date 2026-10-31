import { test } from '@playwright/test'
const painted = async (page: import('@playwright/test').Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
test('tree inspection uses the live office from overview and side', async ({
  page
}, info) => {
  await page.goto('/')
  // Readiness uses the existing whole-case budget, not a separate startup-speed gate.
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  await page
    .getByRole('button', {
      name: 'Street trees Leaves and branches',
      exact: true
    })
    .click()
  await painted(page)
  await page.screenshot({ path: info.outputPath('tree-whole.png') })
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await painted(page)
  await page.screenshot({ path: info.outputPath('tree-near.png') })
  const bounds = await page
    .getByLabel('Office 3D scene', { exact: true })
    .boundingBox()
  if (!bounds) {
    throw new Error('Scene viewport missing')
  }
  await page.mouse.move(
    bounds.x + bounds.width * 0.55,
    bounds.y + bounds.height * 0.5
  )
  await page.mouse.down()
  await page.mouse.move(
    bounds.x + bounds.width * 0.55 + 260,
    bounds.y + bounds.height * 0.5,
    { steps: 12 }
  )
  await page.mouse.up()
  await painted(page)
  await page.screenshot({ path: info.outputPath('tree-side.png') })
  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  await painted(page)
  await page.screenshot({ path: info.outputPath('office-no-animals.png') })
  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      views: ['street trees - one zoom step', 'overview'],
      visualAcceptance: 'pending'
    }),
    contentType: 'application/json'
  })
})

test('wide overview exposes different tree sizes and crowns in the same live scene', async ({
  page
}, info) => {
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click()
  }
  await painted(page)
  await page.screenshot({
    path: info.outputPath('tree-variation-overview.png')
  })
  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      view: 'Overview - two zoom-out steps',
      source: 'same six trees as the live scene; no review-only model',
      manualAcceptance: 'pending'
    }),
    contentType: 'application/json'
  })
})
