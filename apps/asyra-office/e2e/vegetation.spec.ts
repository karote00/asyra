import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1200, height: 1000 } })
for (const asset of ['leaf', 'cluster', 'bare-tree', 'tree', 'plant']) {
  test(`${asset} - same authored geometry in multiple views`, async ({
    page
  }, info) => {
    await page.goto(`/?review=${asset}`)
    await page
      .getByRole('status')
      .filter({ hasText: '3D preview ready' })
      .waitFor()
    const viewport = page.getByLabel('Asset 3D viewport')
    for (const view of ['Three-quarter', 'Front', 'Right', 'Top']) {
      await page.getByRole('button', { name: view, exact: true }).click()
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      )
      await viewport.screenshot({
        path: info.outputPath(`${asset}-${view.toLowerCase()}.png`)
      })
    }
    await expect(page.getByRole('alert')).toHaveCount(0)
    await info.attach('review-state', {
      body: JSON.stringify({
        url: page.url(),
        viewport: page.viewportSize(),
        asset,
        source:
          'same asset factory as Office; master retained; no screenshot substitutes',
        manualAcceptance: 'pending'
      }),
      contentType: 'application/json'
    })
  })
}
