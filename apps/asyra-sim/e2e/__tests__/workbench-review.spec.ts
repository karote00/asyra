import { expect, test } from '@playwright/test'

for (const width of [1440, 960, 600]) {
  test(`panel bounds stay fixed across inspector content and playback at ${width}px`, async ({
    page
  }, info) => {
    await page.goto('/')
    await expect(page.getByRole('status')).toHaveText('Local runtime ready')
    await page.getByRole('treeitem', { name: '◇ fixture post' }).click()
    await page.setViewportSize({ width, height: 960 })
    const bounds = () =>
      page.evaluate(() =>
        [
          '.hierarchy-panel',
          '.viewport-panel',
          '.properties-panel',
          'canvas'
        ].map((selector) => {
          const node = document.querySelector(selector)
          if (!node) throw new Error(`Missing layout surface: ${selector}`)
          const { x, y, width, height } = node.getBoundingClientRect()
          return { selector, x, y, width, height }
        })
      )
    await expect(page.getByLabel('Object name')).toHaveValue('fixture post')
    const baseline = await bounds()
    await page.screenshot({ path: info.outputPath('object-panel.png') })

    await page.getByRole('button', { name: 'Experiments', exact: true }).click()
    await expect.poll(bounds).toEqual(baseline)
    await page.locator('.trajectory-import > summary').click()
    await expect.poll(bounds).toEqual(baseline)
    await page.screenshot({ path: info.outputPath('experiment-panel.png') })
    await page.getByRole('tab', { name: 'Preview', exact: true }).click()
    await page
      .getByRole('button', { name: 'Play trajectory', exact: true })
      .click()
    await expect
      .poll(async () =>
        Number(
          await page.getByLabel('Sampled trajectory preview time').inputValue()
        )
      )
      .toBeGreaterThan(0.1)
    await expect.poll(bounds).toEqual(baseline)
    await page
      .getByRole('button', { name: 'Pause trajectory', exact: true })
      .click()
    await page.getByRole('button', { name: 'Object', exact: true }).click()
    await expect.poll(bounds).toEqual(baseline)
    await expect(page.getByLabel('Object name')).toHaveValue('fixture post')
    await info.attach('panel-layout-review', {
      contentType: 'application/json',
      body: JSON.stringify({
        url: page.url(),
        viewport: page.viewportSize(),
        dpr: 1,
        rendering:
          'normal Core/Render/CUSTOM; installed Chrome with SwiftShader',
        selection: 'example:fixture-post',
        camera: 'default',
        screenshots: ['object-panel.png', 'experiment-panel.png'],
        bounds: baseline
      })
    })
  })
}

test('workbench controls fit desktop and narrow review panes without clipped text', async ({
  page
}, info) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  for (const width of [1440, 960, 600]) {
    await page.setViewportSize({ width, height: 960 })
    await page.getByRole('button', { name: 'Experiments', exact: true }).click()
    await page.getByRole('tab', { name: 'Preview', exact: true }).click()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const panels = [
            ...document.querySelectorAll<HTMLElement>(
              '.topbar, .commandbar, .properties-panel'
            )
          ]
          return panels.every((panel) => {
            const rect = panel.getBoundingClientRect()
            return (
              rect.left >= 0 &&
              rect.right <= innerWidth &&
              panel.scrollWidth <= panel.clientWidth + 1
            )
          })
        })
      )
      .toBe(true)
    const controls = page.locator('.commands button')
    for (const control of await controls.all()) {
      if (!(await control.isVisible())) continue
      const text = await control.innerText()
      expect(text).not.toMatch(/[↶↷+]/)
      expect(
        await control.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
    }
    await expect(page.locator('.trajectory-import')).not.toHaveAttribute(
      'open',
      ''
    )
    await page.screenshot({ path: info.outputPath(`workbench-${width}.png`) })
  }
})

test('trajectory playback advances, pauses, restarts and stops when leaving experiments without an Undo action', async ({
  page
}) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  const history = await page.getByTestId('history-depth').textContent()
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.getByRole('tab', { name: 'Preview', exact: true }).click()
  await page
    .getByRole('button', { name: 'Play trajectory', exact: true })
    .click()
  const time = page.getByLabel('Sampled trajectory preview time')
  await expect
    .poll(async () => Number(await time.inputValue()))
    .toBeGreaterThan(0.1)
  await page
    .getByRole('button', { name: 'Pause trajectory', exact: true })
    .click()
  const paused = await time.inputValue()
  await page.waitForTimeout(150)
  await expect(time).toHaveValue(paused)
  await page
    .getByRole('button', { name: 'Restart trajectory', exact: true })
    .click()
  await expect(time).toHaveValue('0')
  await page
    .getByRole('button', { name: 'Play trajectory', exact: true })
    .click()
  await page.getByRole('button', { name: 'Object', exact: true }).click()
  await expect(page.locator('.viewport-summary')).not.toContainText(
    'Sampled preview'
  )
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.getByRole('tab', { name: 'Preview', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Play trajectory', exact: true })
  ).toBeVisible()
  await expect(page.getByTestId('history-depth')).toHaveText(history ?? '')
  await expect(page.getByTestId('analysis-result')).toHaveCount(0)
})

for (const viewport of [
  { width: 576, height: 690 },
  { width: 1440, height: 960 }
]) {
  test(`experiment panel scrolls context and actions with its content at ${viewport.width}x${viewport.height}`, async ({
    page
  }, info) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.getByRole('status')).toHaveText('Local runtime ready')
    await page.getByRole('button', { name: 'Experiments', exact: true }).click()
    const history = await page.getByTestId('history-depth').textContent()
    const scene = await page.locator('.viewport-panel').boundingBox()
    const panel = page.locator('.experiment-panel')
    const run = page.getByRole('button', { name: 'Run analysis', exact: true })
    const heading = panel.locator('.panel-heading')
    await page.locator('.trajectory-import > summary').click()
    await panel.evaluate((node) => {
      node.scrollTop = 0
    })
    const before = {
      run: await run.boundingBox(),
      heading: await heading.boundingBox()
    }
    await expect
      .poll(() => panel.evaluate((node) => getComputedStyle(node).overflowY))
      .toMatch(/auto|scroll/)
    await panel.evaluate((node) => {
      node.scrollTop = 160
    })
    await expect.poll(() => panel.evaluate((node) => node.scrollTop)).toBe(160)
    const after = {
      run: await run.boundingBox(),
      heading: await heading.boundingBox()
    }
    if (!before.run || !before.heading || !after.run || !after.heading)
      throw new Error(
        'Experiment context and Run must remain mounted while scrolling'
      )
    expect(after.run.y).toBeCloseTo(before.run.y - 160, 0)
    expect(after.heading.y).toBeCloseTo(before.heading.y - 160, 0)
    await page.locator('.trajectory-import textarea').scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath('setup-scrolled.png') })
    for (const name of ['Preview', 'Results', 'Setup']) {
      await page.getByRole('tab', { name, exact: true }).click()
      await expect(page.getByRole('tabpanel')).toBeVisible()
    }
    expect(await page.locator('.viewport-panel').boundingBox()).toEqual(scene)
    await expect(page.getByTestId('history-depth')).toHaveText(history ?? '')
    await panel.evaluate((node) => {
      node.scrollTop = 0
    })
    await page.screenshot({ path: info.outputPath('panel-top.png') })
  })
}
