import { expect, test, type Page } from '@playwright/test'
import type { ExperimentDefinition } from '../../src/analysis/contracts'
import { readHistoryDepth } from '../history-depth'

async function openImport(page: Page) {
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  const details = page.locator('.trajectory-import')
  if (!(await details.evaluate((node) => (node as HTMLDetailsElement).open)))
    await details.locator('summary').click()
  return details
}

async function preview(page: Page) {
  await page
    .getByRole('button', { name: 'Preview trajectory', exact: true })
    .click()
}

async function saveProject(page: Page, name: string) {
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByLabel('Project name', { exact: true }).fill(name)
  await page.getByRole('button', { name: 'Save project', exact: true }).click()
  await expect(page.getByTestId('persistence-status')).toHaveText(
    `Saved locally - ${name}`
  )
  await page
    .getByRole('button', { name: 'Close projects', exact: true })
    .click()
}

async function savedDefinition(
  page: Page,
  experimentId: string
): Promise<ExperimentDefinition> {
  return page.evaluate(async (id) => {
    const repositoryPath = '/src/storage/indexed-db.ts'
    const migrationPath = '/src/storage/load-migration.ts'
    const formatPath = '/src/storage/project-format.ts'
    const { IndexedProjectRepository } = await import(repositoryPath)
    const { EXISTING_APP_DATABASE } = await import(migrationPath)
    const { decodeProject } = await import(formatPath)
    const repository = new IndexedProjectRepository(
      indexedDB,
      EXISTING_APP_DATABASE
    )
    try {
      const { projects } = await repository.list()
      const stored = await repository.read(projects[0].id)
      const snapshot = decodeProject(stored.payload)
      const propertyId =
        snapshot.document.sceneTree.elements[id].props.experiment
      return snapshot.document.props[propertyId].experimentDefinition
    } finally {
      repository.close()
    }
  }, experimentId)
}

test('external CSV declaration, conversion review, acceptance, Undo/Redo and reopening preserve source units', async ({
  page
}, info) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  await openImport(page)
  const experimentId = await page
    .getByLabel('Experiment', { exact: true })
    .inputValue()
  const initial = await page.getByLabel('Trajectory source data').inputValue()
  const [header] = initial.split('\n')
  const csv = `${header}\n0,1,0,0,0,0,0\n2000,2,0,0,0,0,0`
  const depth = await readHistoryDepth(page)
  await page.getByLabel('Load trajectory CSV').setInputFiles({
    name: 'external.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv)
  })
  await preview(page)
  await expect(page.locator('.diagnostic-list')).toContainText(
    'explicit supported time unit'
  )
  await expect(
    page.getByRole('button', { name: 'Accept into draft', exact: true })
  ).toHaveCount(0)
  await page
    .getByRole('combobox', { name: 'Time unit', exact: true })
    .selectOption('ms')
  await preview(page)
  await expect(
    page.getByRole('button', { name: 'Accept into draft', exact: true })
  ).toHaveCount(0)
  const units = page.locator('select[aria-label$=" CSV unit"]')
  await expect(units).toHaveCount(6)
  for (const unit of await units.all()) await unit.selectOption('deg')
  await preview(page)
  const review = page.getByLabel('Trajectory conversion preview')
  await expect(review).toContainText('2000 ms → 2 s')
  await expect(review).toContainText('1 deg → 0.01745329252 rad')
  await page
    .getByRole('button', { name: 'Accept into draft', exact: true })
    .click({ trial: true })
  await page.locator('.accepted-preview').screenshot({
    path: info.outputPath('csv-conversion-first.png'),
    animations: 'disabled'
  })
  await review.evaluate((node) => {
    node.scrollTop = node.scrollHeight
  })
  await page.locator('.accepted-preview').screenshot({
    path: info.outputPath('csv-conversion-last.png'),
    animations: 'disabled'
  })

  await expect(page.getByTestId('history-depth')).toHaveText(
    `Undo steps: ${depth}`
  )
  await page
    .getByRole('button', { name: 'Accept into draft', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Save experiment', exact: true })
  ).toBeEnabled()
  await expect(page.getByTestId('history-depth')).toHaveText(
    `Undo steps: ${depth}`
  )
  await page
    .getByRole('button', { name: 'Save experiment', exact: true })
    .click()
  await expect(page.getByTestId('history-depth')).toHaveText(
    `Undo steps: ${depth + 1}`
  )
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await openImport(page)
  await expect(page.getByLabel('Trajectory source data')).toHaveValue(initial)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await openImport(page)
  const canonical = await page.getByLabel('Trajectory source data').inputValue()
  expect(canonical).not.toBe(initial)
  await page.getByRole('button', { name: 'Run preflight', exact: true }).click()
  await expect(page.getByTestId('preflight-report')).toContainText(
    'Ready for formal local analysis'
  )
  await saveProject(page, 'Declared source units')
  const definition = await savedDefinition(page, experimentId)
  expect(definition.sourceUnits.time).toBe('ms')
  expect(Object.values(definition.sourceUnits.joints)).toEqual(
    Array(6).fill('deg')
  )
  expect(definition.trajectory.keyframes[1].time).toBe(2)
  expect(
    Object.values(definition.trajectory.keyframes[0].joints)[0]
  ).toBeCloseTo(Math.PI / 180, 14)
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('button', { name: 'Open Declared source units', exact: true })
    .click()
  await openImport(page)
  await expect(page.getByLabel('Trajectory source data')).toHaveValue(canonical)
  await expect(page.getByTestId('history-depth')).toHaveText('Undo steps: 0')
  // Unchanged App-generated text is canonical even though persisted provenance is ms/deg.
  await preview(page)
  await expect(page.getByLabel('Trajectory conversion preview')).toContainText(
    '2 s → 2 s'
  )
  await saveProject(page, 'Declared source units')
  expect(await savedDefinition(page, experimentId)).toEqual(definition)
  await info.attach('accepted-source.json', {
    contentType: 'application/json',
    body: JSON.stringify({ csv, definition })
  })
})

for (const [width, theme] of [
  [1440, 'light'],
  [960, 'dark'],
  [600, 'light']
] as const) {
  test(`strict JSON conversion review remains usable at ${width}px in ${theme} mode`, async ({
    page
  }, info) => {
    await page.setViewportSize({ width, height: 960 })
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/')
    await expect(page.getByRole('status')).toHaveText('Local runtime ready')
    await openImport(page)
    const initial = await page.getByLabel('Trajectory source data').inputValue()
    const ids = initial.split('\n')[0].split(',').slice(1)
    const jointUnits = Object.fromEntries(ids.map((id) => [id, 'deg']))
    const joints = Object.fromEntries(ids.map((id) => [id, 0]))
    const source = {
      version: 1,
      timeUnit: 'ms',
      jointUnits,
      keyframes: [{ time: 2500, joints }]
    }
    const depth = await readHistoryDepth(page)
    await page.getByLabel('Load trajectory JSON').setInputFiles({
      name: 'declared.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({ format: 'sim-trajectory', version: 1, source })
      )
    })
    await preview(page)
    const review = page.getByLabel('Trajectory conversion preview')
    await expect(review).toContainText('2500 ms → 2.5 s')
    await expect(review).toContainText('0 deg → 0 rad')
    await expect(
      page.getByRole('button', { name: 'Accept into draft', exact: true })
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Accept into draft', exact: true })
      .click({ trial: true })
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await page.screenshot({
      path: info.outputPath('conversion-overview.png'),
      animations: 'disabled'
    })
    await page.locator('.accepted-preview').screenshot({
      path: info.outputPath('conversion-detail.png'),
      animations: 'disabled'
    })
    await review.evaluate((node) => {
      node.scrollTop = node.scrollHeight
    })
    await page.locator('.accepted-preview').screenshot({
      path: info.outputPath('conversion-last-joints.png'),
      animations: 'disabled'
    })
    expect(
      await review.evaluate((node) => node.scrollWidth <= node.clientWidth)
    ).toBe(true)
    await page
      .getByRole('button', { name: 'Discard preview', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Accept into draft', exact: true })
    ).toHaveCount(0)
    await expect(page.getByTestId('history-depth')).toHaveText(
      `Undo steps: ${depth}`
    )
    await expect(
      page.getByRole('button', { name: 'Save experiment', exact: true })
    ).toBeDisabled()
    await info.attach('review-state.json', {
      contentType: 'application/json',
      body: JSON.stringify({
        baseURL: info.project.use.baseURL,
        scope: 'trajectory-import.spec.ts',
        viewport: page.viewportSize(),
        dpr: 1,
        zoom: 1,
        camera: 'default',
        theme,
        source,
        pipeline: 'normal App import and storage conversion preview',
        screenshots: [
          'conversion-overview.png',
          'conversion-detail.png',
          'conversion-last-joints.png'
        ]
      })
    })
  })
}
