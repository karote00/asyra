import { expect, test } from '@playwright/test'

test.use({
  launchOptions: { args: [] },
  viewport: { width: 1200, height: 1000 },
  deviceScaleFactor: 1
})

test('retains both lights and exports five views of the framed light from one geometry', async ({
  page
}, info) => {
  test.skip(
    process.env.OFFICE_HARDWARE_REVIEW !== '1',
    'Requires hardware WebGL.'
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const images: { title: string; data: string }[] = []
  for (const asset of ['pantry-night-light', 'frame-night-light']) {
    await page.goto(`/?review=${asset}`)
    await page
      .getByRole('status')
      .filter({ hasText: '3D preview ready' })
      .waitFor()
    const viewport = page.getByLabel('Asset 3D viewport')
    const views =
      asset === 'frame-night-light'
        ? ['Front', 'Right', 'Back', 'Top', 'Three-quarter']
        : ['Three-quarter']
    for (const view of views) {
      await page.getByRole('button', { name: view, exact: true }).click()
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      )
      const bounds = await viewport.boundingBox()
      if (!bounds) {
        throw new Error('Missing asset viewport')
      }
      // Omit the surrounding UI's rounded corners; retain the camera's 40 px asset margin.
      const bytes = await page.screenshot({
        clip: {
          x: bounds.x + 16,
          y: bounds.y + 16,
          width: bounds.width - 32,
          height: bounds.height - 32
        },
        path: info.outputPath(`${asset}-${view.toLowerCase()}.png`)
      })
      if (asset === 'frame-night-light') {
        images.push({ title: view, data: bytes.toString('base64') })
      }
    }
    await expect(page.getByRole('alert')).toHaveCount(0)
  }
  // A contact sheet of actual app views, not separately generated designs.
  await page.setViewportSize({ width: 2200, height: 850 })
  await page.setContent(`<!doctype html><html lang="en"><head><style>
    *{box-sizing:border-box}body{margin:0;padding:32px;background:#f4f1e9;color:#242a2b;font-family:Arial,sans-serif}
    h1{font-size:32px;margin:0 0 12px}p{font-size:19px;margin:8px 0}
    main{display:flex;gap:12px;margin:28px 0}figure{width:20%;margin:0;text-align:center}
    img{width:100%;height:550px;object-fit:contain}figcaption{font-size:21px;font-weight:bold;margin-top:12px}
  </style></head><body><h1>FRAME NIGHT-LIGHT - ONE COMPLETE UNIT</h1>
  <p>Default: 148 mm diameter x 300 mm height - two arch straps / four uprights - clear cylinder - bottom light source</p>
  <main>${images.map(({ title, data }) => `<figure><img src="data:image/png;base64,${data}"><figcaption>${title.toUpperCase()}</figcaption></figure>`).join('')}</main>
  <p>One shared geometry - views fitted independently for readability; use the specification for dimensions.</p>
  <p>Colors and materials are replaceable. Original photo governs appearance. This sheet documents the current geometry; visual approval is separate.</p>
  </body></html>`)
  await page
    .locator('img')
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode()))
    )
  await page.screenshot({
    path: info.outputPath('frame-night-light-reference.png')
  })
  expect(errors).toEqual([])
})
