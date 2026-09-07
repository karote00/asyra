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
    page.getByTestId('live-observations').locator('summary')
  ).toHaveText(observations ?? '')
  await expect(page.getByTestId('analysis-result')).toHaveCount(0)

  await slider.fill('3.856')
  await expect(feedback).toContainText('Checked 3.8560 s')
  await expect(pair('workpiece - fixture table')).toHaveAttribute(
    'data-pair-kind',
    'collision'
  )
  await expect(
    page.getByTestId('live-observations').locator('summary')
  ).toHaveText(observations ?? '')

  await page.getByRole('button', { name: 'Return to editing pose' }).click()
  await page.getByLabel('Minimum clearance (mm)').fill('200')
  await page
    .getByRole('button', { name: 'Save experiment', exact: true })
    .click()
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
