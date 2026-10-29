import { test } from '@playwright/test'

test('reviews the same live foliage at overview and close range', async ({
  page
}, info) => {
  await page.goto('/')
  // Use the bounded case budget for readiness, not a separate startup-speed gate.
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  const painted = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
  await painted()
  await page.screenshot({ path: info.outputPath('foliage-overview.png') })
  await page
    .getByRole('button', { name: 'Lounge Room to slow down', exact: true })
    .click()
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await painted()
  await page.screenshot({ path: info.outputPath('potted-leaves-near.png') })
  await page
    .getByRole('button', {
      name: 'Riverside Fresh air, new views',
      exact: false
    })
    .click()
  await painted()
  await page.screenshot({ path: info.outputPath('foliage-riverside.png') })
  await info.attach('foliage-review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      views: ['overview', 'lounge - three zoom steps', 'riverside'],
      source: 'actual Office scene',
      manualAcceptance: 'pending'
    }),
    contentType: 'application/json'
  })
})
