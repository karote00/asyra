import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1200, height: 1000 } })
for (const asset of [
  'entry-door-set',
  'window-four-pane',
  'awning',
  'pillow',
  'floor-plank',
  'stair-step',
  'writing-desk',
  'work-chair',
  'two-seat-sofa',
  'lounge-armchair',
  'round-coffee-table',
  'pantry-fridge',
  'water-dispenser',
  'sink-cabinet',
  'coffee-machine',
  'low-bookcase',
  'round-tea-table',
  'tea-chair',
  'park-bench',
  'laptop',
  'mug',
  'manhole',
  'clock',
  'chalkboard',
  'lantern',
  'man',
  'woman'
]) {
  test(`${asset} - exact production asset in five views`, async ({
    page
  }, info) => {
    await page.goto(`/?review=${asset}`)
    await page
      .getByRole('status')
      .filter({ hasText: '3D preview ready' })
      .waitFor()
    for (const view of ['Front', 'Right', 'Back', 'Top', 'Three-quarter']) {
      await page.getByRole('button', { name: view, exact: true }).click()
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      )
      await page.getByLabel('Asset 3D viewport').screenshot({
        path: info.outputPath(`${asset}-${view.toLowerCase()}.png`)
      })
    }
    await expect(page.getByRole('alert')).toHaveCount(0)
    await info.attach('review-state', {
      body: JSON.stringify({
        url: page.url(),
        asset,
        viewport: page.viewportSize(),
        source: 'Exact production factory, retained across cameras',
        acceptance: 'Requires image review'
      }),
      contentType: 'application/json'
    })
  })
}

test('coffee-machine - neutral surface microscope', async ({ page }, info) => {
  await page.goto('/?review=coffee-machine')
  await page
    .getByRole('status')
    .filter({ hasText: '3D preview ready' })
    .waitFor()
  await page.getByLabel('Neutral geometry').check()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page
    .getByLabel('Asset 3D viewport')
    .screenshot({ path: info.outputPath('coffee-neutral.png') })
})
