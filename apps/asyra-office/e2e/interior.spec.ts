import { test, expect } from '@playwright/test'

for (const [name, button, view] of [
  ['overview', 'Office Home base', 'Overview'],
  ['work', 'Work room Desk, shelves, ideas', 'Work room'],
  ['discussion', 'Meeting corner Small room, big ideas', 'Meeting corner'],
  ['pantry', 'Tea point Coffee, chats, ideas', 'Tea point'],
  ['lounge', 'Lounge Room to slow down', 'Lounge']
] as const) {
  test(`interior reference review - ${name}`, async ({ page }, info) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    // Reuse the existing foliage-suite readiness contract and bounded case budget.
    await page
      .getByRole('status', { name: 'Scene status' })
      .filter({ hasText: /^Demo scene ready$/ })
      .waitFor()
    await expect(page.getByLabel('Composition stage')).toHaveText(
      'Tables and chairs review'
    )
    await page.getByRole('button', { name: button, exact: true }).click()
    await expect(page.getByLabel('Current view')).toHaveText(view)
    await page.evaluate(
      () =>
        new Promise<void>((done) =>
          requestAnimationFrame(() => requestAnimationFrame(() => done()))
        )
    )
    await page.screenshot({
      path: info.outputPath(`${name}.png`),
      fullPage: true,
      animations: 'disabled'
    })
    if (name === 'discussion' || name === 'pantry') {
      // Keep the rear crown in frame for joint review through normal camera UI.
      await page.getByRole('button', { name: 'Zoom out', exact: true }).click()
      await page.evaluate(
        () =>
          new Promise<void>((done) =>
            requestAnimationFrame(() => requestAnimationFrame(() => done()))
          )
      )
      await page.screenshot({
        path: info.outputPath(`${name}-joints.png`),
        animations: 'disabled'
      })
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
    }
    if (
      name === 'work' ||
      name === 'discussion' ||
      name === 'lounge' ||
      name === 'pantry'
    ) {
      // Orbit through the normal UI to inspect furniture behind the unchanged streetlamp.
      const canvas = await page
        .getByLabel('Office 3D scene')
        .locator('canvas')
        .boundingBox()
      if (!canvas) throw new Error('Missing live scene bounds')
      const x = canvas.x + canvas.width / 2,
        y = canvas.y + canvas.height / 2
      await page.mouse.move(x, y)
      await page.mouse.down()
      let rise = -35
      if (name === 'work') rise = 150
      if (name === 'discussion') rise = 90
      await page.mouse.move(x + 110, y + rise, {
        steps: 8
      })
      await page.mouse.up()
      await page.evaluate(
        () =>
          new Promise<void>((done) =>
            requestAnimationFrame(() => requestAnimationFrame(() => done()))
          )
      )
      await page.screenshot({
        path: info.outputPath(`${name}-oblique.png`),
        animations: 'disabled'
      })
      if (name !== 'pantry') {
        // Inspect table edges/supports at a readable size through normal controls.
        if (name === 'work') {
          await page.mouse.move(x, y)
          await page.mouse.down()
          await page.mouse.move(x, y - 65, { steps: 8 })
          await page.mouse.up()
        }
        for (let i = 0; i < 3; i++)
          await page
            .getByRole('button', { name: 'Zoom in', exact: true })
            .click()
        await page.evaluate(
          () =>
            new Promise<void>((done) =>
              requestAnimationFrame(() => requestAnimationFrame(() => done()))
            )
        )
        await page.screenshot({
          path: info.outputPath(`${name}-detail.png`),
          animations: 'disabled'
        })
      }
    }
    await info.attach('review-state', {
      body: JSON.stringify({
        url: page.url(),
        viewport: page.viewportSize(),
        initialView: view,
        currentView: await page.getByLabel('Current view').innerText(),
        scope:
          'approved single-storey structure with three admitted tables; source-mismatched chairs omitted',
        geometry: 'production scene',
        reference: 'approved-office-reference.jpg',
        acceptance: 'requires image inspection'
      }),
      contentType: 'application/json'
    })
    expect(errors).toEqual([])
    expect(
      await page
        .getByLabel('Office 3D scene')
        .locator('canvas')
        .evaluate((c) => {
          const gl = (c as HTMLCanvasElement).getContext('webgl2')
          return Boolean(gl && !gl.isContextLost())
        })
    ).toBe(true)
  })
}

for (const name of ['Mina', 'Leo', 'Sage']) {
  test(`interior rear-follow - ${name}`, async ({ page }, info) => {
    await page.goto('/')
    await page
      .getByRole('status', { name: 'Scene status' })
      .filter({ hasText: /^Demo scene ready$/ })
      .waitFor()
    await page.getByRole('tab', { name: 'Agents', exact: true }).click()
    await page
      .getByRole('button', { name: `Follow ${name}`, exact: false })
      .click()
    await expect(page.getByLabel('Current view')).toHaveText(
      `Following ${name}`
    )
    await page.evaluate(
      () =>
        new Promise<void>((done) =>
          requestAnimationFrame(() => requestAnimationFrame(() => done()))
        )
    )
    await page.screenshot({
      path: info.outputPath(`following-${name.toLowerCase()}.png`),
      animations: 'disabled'
    })
  })
}

test('interior measured reference alignment', async ({ page }, info) => {
  // Match the source image's 845 x 756 scene viewport, independent of panel chrome.
  await page.setViewportSize({ width: 1321, height: 814 })
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  await page
    .getByRole('button', { name: 'Office Home base', exact: true })
    .click()
  const canvas = page.getByLabel('Office 3D scene').locator('canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Missing production scene canvas')
  await page.setViewportSize({
    width: 1321 + 845 - Math.round(box.width),
    height: 814 + 756 - Math.round(box.height)
  })
  await expect
    .poll(async () => {
      const bounds = await canvas.boundingBox()
      if (!bounds) throw new Error('Missing canvas')
      return Math.round(bounds.width)
    })
    .toBe(845)
  await expect
    .poll(async () => {
      const bounds = await canvas.boundingBox()
      if (!bounds) throw new Error('Missing canvas')
      return Math.round(bounds.height)
    })
    .toBe(756)
  await page
    .getByRole('button', { name: 'Office Home base', exact: true })
    .click()
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done()))
      )
  )
  await canvas.screenshot({
    path: info.outputPath('reference-aligned-canvas.png')
  })
  await page.screenshot({ path: info.outputPath('reference-aligned-app.png') })
  await info.attach('reference-alignment', {
    body: JSON.stringify({
      url: page.url(),
      canvas: await canvas.boundingBox(),
      referenceCrop: [220, 44, 845, 756],
      reference: 'approved-office-reference.jpg',
      view: await page.getByLabel('Current view').innerText()
    }),
    contentType: 'application/json'
  })
})

test('interior whole structure from above and rear', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  await expect(page.getByLabel('Composition stage')).toHaveText(
    'Tables and chairs review'
  )
  await page
    .getByRole('button', { name: 'Office Home base', exact: true })
    .click()
  const canvas = page.getByLabel('Office 3D scene').locator('canvas')
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Missing production canvas')
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  // Use the normal orbit UI; do not inject a replacement review camera.
  for (const [name, dx, dy] of [
    ['above', 0, 190],
    ['rear', 330, -90]
  ] as const) {
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + dx, y + dy, { steps: 12 })
    await page.mouse.up()
    await expect(page.getByLabel('Current view')).toHaveText('Free view')
    await page.evaluate(
      () =>
        new Promise<void>((done) =>
          requestAnimationFrame(() => requestAnimationFrame(() => done()))
        )
    )
    await page.screenshot({
      path: info.outputPath(`structure-${name}.png`),
      animations: 'disabled'
    })
  }
  expect(errors).toEqual([])
  await info.attach('structure-review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      stage: 'structure',
      controls: 'normal orbit',
      acceptance:
        'requires image inspection; no silhouette pass is inferred from capture'
    }),
    contentType: 'application/json'
  })
})
