import { expect, test } from '@playwright/test'
import specification from '../../../assets/asyra-office/models/pantry-smallware/pantry-smallware-model-spec.json' with { type: 'json' }

test.use({
  viewport: { width: 1200, height: 1000 },
  ...(process.env.OFFICE_HARDWARE_REVIEW === '1'
    ? { launchOptions: { args: [] } }
    : {})
})
for (const id of [
  ...Object.keys(specification.sourceVariants.vessels),
  'shelf-succulent',
  'plant-shrub',
  'plant-lanceolate',
  'sink-cabinet'
]) {
  test(`${id} - production vessel microscope`, async ({ page }, info) => {
    await page.goto(`/?review=${id}`)
    await page
      .getByRole('status')
      .filter({ hasText: '3D preview ready' })
      .waitFor()
    for (const view of ['Front', 'Top', 'Three-quarter']) {
      await page.getByRole('button', { name: view, exact: true }).click()
      await page.evaluate(
        () =>
          new Promise<void>((done) =>
            requestAnimationFrame(() => requestAnimationFrame(() => done()))
          )
      )
      await page.getByLabel('Asset 3D viewport').screenshot({
        path: info.outputPath(`${id}-${view.toLowerCase()}.png`)
      })
    }
    await expect(page.getByRole('alert')).toHaveCount(0)
    await info.attach('review-state', {
      body: JSON.stringify({
        url: page.url(),
        viewport: page.viewportSize(),
        asset: id,
        source: 'Production factory, retained across cameras',
        acceptance: 'Requires image inspection'
      }),
      contentType: 'application/json'
    })
  })
}
