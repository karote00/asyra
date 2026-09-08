import { expect, test, type Page } from '@playwright/test'
import { MethodIds, MethodVersions } from '../../src/constants'

async function createSphereStudy(
  page: Page,
  distance: string,
  threshold: string
) {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  await page.getByRole('button', { name: 'New workcell', exact: true }).click()
  for (const [name, x, role] of [
    ['Primary sphere', '0', 'tool'],
    ['Obstacle sphere', distance, 'fixture']
  ]) {
    await page.getByRole('button', { name: 'Add fixture', exact: true }).click()
    await page.getByLabel('Object name').fill(name)
    await page.getByLabel('Object name').press('Enter')
    await page.getByLabel('Body role').selectOption(role)
    await page.getByLabel('Mount position (m) X', { exact: true }).fill(x)
    await page
      .getByLabel('Mount position (m) X', { exact: true })
      .press('Enter')
    await page.getByLabel('Shape 1 type').selectOption('sphere')
    await expect(page.getByLabel('Shape 1 radius (m)')).toHaveValue('0.1')
  }
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.getByLabel('Experiment name').fill('Formal sphere study')
  await page
    .getByLabel('Analysis method')
    .selectOption(
      `${MethodIds.ORIGINAL_PART_CLEARANCE}@${MethodVersions.ORIGINAL_PART_CLEARANCE}`
    )
  await page.getByLabel('Minimum clearance (mm)').fill(threshold)
  await page.keyboard.press('Tab')
  await page.locator('summary').filter({ hasText: 'Analysis scope' }).click()
  await page.getByLabel('Primary sphere analysis role').selectOption('primary')
  await page
    .getByLabel('Obstacle sphere analysis role')
    .selectOption('influencing')
  await page.getByLabel('Primary-to-influencing collision').check()
  await page.locator('summary').filter({ hasText: 'Analysis scope' }).click()
  await page
    .getByRole('button', { name: 'Create experiment', exact: true })
    .click()
}

for (const [outcome, distance, threshold, coverage, label, verdict] of [
  [
    'collision',
    '0.15',
    '20',
    'complete',
    'Collision - established penetration',
    'does not meet'
  ],
  [
    'clearance',
    '0.21',
    '20',
    'complete',
    'Clearance violation',
    'does not meet'
  ],
  ['clear', '1', '20', 'complete', 'No issue within interval', 'meets'],
  ['unresolved', '0.2', '0', 'partial', 'Unresolved', 'cannot determine']
]) {
  test(`ordinary original method exposes ${outcome} and replays the same retained evidence`, async ({
    page
  }, info) => {
    await createSphereStudy(page, distance, threshold)
    await page
      .getByRole('button', { name: 'Run formal analysis', exact: true })
      .click()
    const result = page.getByTestId('analysis-result')
    await expect(result.getByLabel('User verdict')).toHaveText(verdict)
    await expect(
      result
        .locator('.result-grid > div')
        .filter({ has: page.getByText('Execution', { exact: true }) })
        .locator('dd')
    ).toHaveText('completed')
    await expect(
      result
        .locator('.result-grid > div')
        .filter({ has: page.getByText('Coverage', { exact: true }) })
        .locator('dd')
    ).toHaveText(coverage)
    await expect(page.locator('.retention-actions')).toContainText(
      'Retained in this project'
    )
    const pair = result.locator('.evidence-pair')
    await pair.locator('summary').click()
    await expect(pair).toContainText(label)
    await expect(pair).toContainText('Witness time: 0 s')
    const retainedText = await result.innerText()
    const history = await page.getByTestId('history-depth').innerText()
    await pair
      .getByRole('button', { name: 'Replay witness', exact: true })
      .click()
    await expect(page.locator('.viewport-summary')).toContainText(
      'Historical run replay - 0.0000 s'
    )
    await page.getByRole('button', { name: 'Fit all', exact: true }).click()
    await pair.scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath(`${outcome}-overview.png`) })
    await pair.screenshot({ path: info.outputPath(`${outcome}-detail.png`) })
    if (outcome === 'clearance') {
      await page
        .getByRole('button', { name: 'Switch to dark mode', exact: true })
        .click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      await page.setViewportSize({ width: 600, height: 960 })
      await pair.scrollIntoViewIfNeeded()
      await expect(
        pair.getByRole('button', { name: 'Replay witness', exact: true })
      ).toBeVisible()
      await page.screenshot({
        path: info.outputPath('clearance-dark-narrow.png')
      })
      await pair.screenshot({
        path: info.outputPath('clearance-dark-narrow-detail.png')
      })
    }
    expect(await result.innerText()).toBe(retainedText)
    await expect(page.getByTestId('history-depth')).toHaveText(history)
    await info.attach('review-state.json', {
      contentType: 'application/json',
      body: JSON.stringify({
        url: page.url(),
        viewport: page.viewportSize(),
        dpr: 1,
        camera: 'Fit all',
        outcome,
        sphereRadiusM: 0.1,
        centerDistanceM: Number(distance),
        thresholdMm: Number(threshold),
        independentGapM: Math.max(0, Number(distance) - 0.2),
        result: retainedText,
        replayTime: 0,
        screenshots: [`${outcome}-overview.png`, `${outcome}-detail.png`],
        additionalReview:
          outcome === 'clearance'
            ? '600x960 dark mode: clearance-dark-narrow.png and clearance-dark-narrow-detail.png'
            : null,
        pipeline:
          'ordinary Core Features / production original-part Worker / frozen result replay / CUSTOM'
      })
    })
  })
}

test('ordinary original-part timeout is retained without success and permits another run', async ({
  page
}, info) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.getByLabel('Wall-time budget (ms)').fill('100')
  await page.keyboard.press('Tab')
  await page
    .getByRole('button', { name: 'Run formal analysis', exact: true })
    .click()
  const result = page.getByTestId('analysis-result')
  await expect(result).toContainText('timed-out')
  await expect(result).toContainText('partial')
  await expect(result.getByLabel('User verdict')).not.toHaveText('meets')
  await expect(page.locator('.retention-actions')).toContainText(
    'Retained in this project'
  )
  await expect(
    page.getByRole('button', { name: 'Cancel analysis', exact: true })
  ).toHaveCount(0)
  await result.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('timeout.png') })
  await page.getByLabel('Wall-time budget (ms)').fill('30000')
  await page.keyboard.press('Tab')
  await expect(result).toContainText('Historical inputs differ')
  await page
    .getByRole('button', { name: 'Run formal analysis', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Cancel analysis', exact: true })
    .click()
  await expect(result).toContainText('cancelled')
  await expect(result).toContainText('partial')
  await expect(result.getByLabel('User verdict')).not.toHaveText('meets')
  await expect(page.locator('.retention-actions')).toContainText(
    'Retained in this project'
  )
  await result.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('cancelled.png') })
})
