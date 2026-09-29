import { showSetup } from '../workflow'
import { expect, test } from '@playwright/test'

test('full-workcell manual preview changes clearance to collision at a penetrating pose and exposes every pair issue', async ({
  page
}, info) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page
    .getByLabel('Experiment', { exact: true })
    .selectOption({ label: 'Tool and table collision - r1' })
  await expect(
    page.getByText('9 primary - 2 influencing', { exact: true })
  ).toBeVisible()

  await page.getByRole('tab', { name: 'Preview', exact: true }).click()
  const slider = page.getByLabel('Sampled trajectory preview time')
  const feedback = page.getByTestId('playback-feedback')
  const pair = (name: string) =>
    feedback.locator('[data-pair-id]').filter({ hasText: name }).first()

  await slider.fill('3.84')
  await expect(feedback).toContainText('Checked 3.8400 s')
  await expect(feedback).toHaveAttribute('data-pose-matches', 'true')
  await expect(pair('gripper - fixture table')).toHaveAttribute(
    'data-pair-kind',
    'collision'
  )
  await expect(pair('workpiece - fixture table')).toHaveAttribute(
    'data-pair-kind',
    'clearance'
  )
  await page.screenshot({ path: info.outputPath('mixed-pairs-light.png') })
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await page.locator('canvas').hover()
  await page.mouse.wheel(0, -400)
  // Bring the known contact area to the viewport center using ordinary navigation.
  await page.keyboard.down('Shift')
  await page.mouse.move(672, 540)
  await page.mouse.down()
  await page.mouse.move(482, 430, { steps: 8 })
  await page.mouse.up()
  await page.keyboard.up('Shift')
  await page.mouse.wheel(0, -1400)
  await page.mouse.wheel(0, -1400)
  await page.mouse.wheel(0, -1400)
  await page.mouse.wheel(0, -1400)
  await page.mouse.wheel(0, -1400)
  await page.mouse.wheel(0, -1400)
  await page.mouse.wheel(0, -1400)
  await page.screenshot({
    path: info.outputPath('mixed-pairs-closeup-dark.png')
  })

  await slider.fill('3.856')
  await expect(feedback).toContainText('Checked 3.8560 s')
  await expect(feedback).toHaveAttribute('data-pose-matches', 'true')
  await expect(pair('workpiece - fixture table')).toHaveAttribute(
    'data-pair-kind',
    'collision'
  )
  await page.screenshot({
    path: info.outputPath('workpiece-penetration-dark.png')
  })

  await slider.fill('4')
  await expect(feedback).toContainText('Checked 4.0000 s')
  await expect(pair('workpiece - fixture table')).toHaveAttribute(
    'data-pair-kind',
    'collision'
  )
  await page.screenshot({ path: info.outputPath('both-parts-contact.png') })

  const observations = await page
    .getByTestId('live-observations')
    .locator('summary')
    .first()
    .textContent()

  await slider.fill('3.84')
  await expect(feedback).toContainText('Checked 3.8400 s')
  await expect(pair('gripper - fixture table')).toHaveAttribute(
    'data-pair-kind',
    'collision'
  )
  await expect(pair('workpiece - fixture table')).toHaveAttribute(
    'data-pair-kind',
    'clearance'
  )
  await expect(
    page.getByTestId('live-observations').locator('summary').first()
  ).toHaveText(observations ?? '')
  await expect(page.getByTestId('analysis-result')).toHaveCount(0)

  await slider.fill('3.856')
  await expect(feedback).toContainText('Checked 3.8560 s')
  await expect(pair('workpiece - fixture table')).toHaveAttribute(
    'data-pair-kind',
    'collision'
  )
  await expect(
    page.getByTestId('live-observations').locator('summary').first()
  ).toHaveText(observations ?? '')

  await page.getByRole('button', { name: 'Return to editing pose' }).click()
  await showSetup(page)
  await page.getByLabel('Minimum clearance (mm)').fill('200')
  await page.keyboard.press('Tab')
  await page.getByRole('tab', { name: 'Preview', exact: true }).click()
  await slider.fill('3.84')
  await expect(feedback).toContainText('Checked 3.8400 s')
  await feedback
    .locator('summary')
    .filter({ hasText: 'Show all' })
    .first()
    .click()

  const expanded = feedback.locator('details[open]').first()

  await expect(expanded.locator('[data-pair-id]').first()).toBeVisible()
  await expect(
    expanded.locator('[data-pair-kind="clearance"]').first()
  ).toBeVisible()
  expect(await expanded.locator('[data-pair-id]').count()).toBeGreaterThan(2)
  await page.screenshot({ path: info.outputPath('all-pair-issues.png') })
  await info.attach('mixed-pair-review', {
    contentType: 'application/json',
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      dpr: 1,
      times: [3.84, 3.856, 4],
      scope: 'all 11 modeled parts - 46 explicit pairs',
      geometry: 'unmodified original sample geometry',
      camera:
        'default, scroll -400, Shift-pan (-190, -110), seven scrolls -1400',
      selection: null,
      overlays: 'default grid and whole-part highlights',
      pipeline:
        'manual slider / original-part Worker / accepted feedback / Core CUSTOM renderer',
      screenshots: [
        'mixed-pairs-light.png',
        'mixed-pairs-closeup-dark.png',
        'workpiece-penetration-dark.png',
        'both-parts-contact.png',
        'all-pair-issues.png'
      ]
    })
  })
})

test('200 mm live playback resolves the first table collision with traceable samples', async ({
  page
}, info) => {
  test.setTimeout(60_000)
  const workers: string[] = []

  page.on('worker', (worker) => workers.push(worker.url()))

  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page
    .getByLabel('Experiment', { exact: true })
    .selectOption({ label: 'Tool and table collision - r1' })
  await showSetup(page)
  await page.getByLabel('Minimum clearance (mm)').fill('200')
  await page.keyboard.press('Tab')
  await page.getByRole('tab', { name: 'Preview', exact: true }).click()

  const slider = page.getByLabel('Sampled trajectory preview time')
  const feedback = page.getByTestId('playback-feedback')
  const samples: {
    time: number
    kind: string | null
    poseMatches: string | null
    text: string
  }[] = []
  for (const time of [3.904, 3.92, 4]) {
    await slider.fill(String(time))
    if (time === 4)
      await expect
        .poll(
          async () => ({
            kind: await feedback.getAttribute('data-kind'),
            poseMatches: await feedback.getAttribute('data-pose-matches')
          }),
          { timeout: 15_000 }
        )
        .toEqual({ kind: 'collision', poseMatches: 'true' })
    else
      await expect
        .poll(
          async () => {
            const kind = await feedback.getAttribute('data-kind')
            const poseMatches = await feedback.getAttribute('data-pose-matches')

            return poseMatches === 'true' || kind === 'error'
          },
          { timeout: 15_000 }
        )
        .toBe(true)
    samples.push({
      time,
      kind: await feedback.getAttribute('data-kind'),
      poseMatches: await feedback.getAttribute('data-pose-matches'),
      text: (await feedback.innerText()).replace(/\s+/g, ' ').trim()
    })
  }

  const liveWorkers = workers.filter((url) =>
    url.includes('/analysis/live/playback.worker.ts')
  )
  await info.attach('live-4s-collision-render', {
    contentType: 'image/png',
    body: await page.screenshot()
  })

  const observations = page.getByTestId('live-observations')
  const diagnosticPanel = observations.locator('details').last()
  let diagnosticText = ''

  if (await observations.count()) {
    const observationsOpen = await observations.evaluate(
      (element) => (element as HTMLDetailsElement).open
    )
    if (!observationsOpen) await observations.locator('summary').first().click()
  }

  if (await observations.locator('details').count()) {
    await diagnosticPanel.locator('summary').click()
    diagnosticText = await diagnosticPanel.locator('pre').innerText()
  }

  await info.attach('live-sample-trace', {
    contentType: 'application/json',
    body: JSON.stringify({ samples, diagnosticText, liveWorkers }, null, 2)
  })

  expect.soft(samples.at(-1)?.kind).toBe('collision')
  expect.soft(samples.at(-1)?.poseMatches).toBe('true')
  expect.soft(diagnosticText).toContain('"sampleTime": 4')
  const diagnostics = JSON.parse(diagnosticText) as {
    worker?: {
      sampleTime: number
      completedPairCount: number
      missingPairCount: number
      stopCause: string
    }
  }[]
  expect
    .soft(
      diagnostics.some(
        ({ worker }) =>
          worker?.sampleTime === 4 &&
          worker.stopCause === 'completed' &&
          worker.completedPairCount === 46 &&
          worker.missingPairCount === 0
      )
    )
    .toBe(true)
  expect.soft(liveWorkers).toHaveLength(1)
})

test('cold 200 mm live preview resolves a direct first seek to the table collision', async ({
  page
}) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page
    .getByLabel('Experiment', { exact: true })
    .selectOption({ label: 'Tool and table collision - r1' })
  await showSetup(page)
  await page.getByLabel('Minimum clearance (mm)').fill('200')
  await page.keyboard.press('Tab')
  await page.getByRole('tab', { name: 'Preview', exact: true }).click()

  const slider = page.getByLabel('Sampled trajectory preview time')
  const feedback = page.getByTestId('playback-feedback')
  await slider.fill('4')
  await expect
    .poll(
      async () => ({
        kind: await feedback.getAttribute('data-kind'),
        poseMatches: await feedback.getAttribute('data-pose-matches')
      }),
      { timeout: 30_000 }
    )
    .toEqual({ kind: 'collision', poseMatches: 'true' })
  await expect(feedback).toContainText('Checked 4.0000 s')
  await expect(
    feedback
      .locator('[data-pair-id*="workpiece"][data-pair-id*="fixture-table"]')
      .first()
  ).toHaveAttribute('data-pair-kind', 'collision')
})
