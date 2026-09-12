import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

async function download(page: Page, name: string) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name, exact: true }).click()
  const stream = await (await pending).createReadStream()
  if (!stream) throw new Error('Missing download stream')
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

async function importProject(page: Page, buffer: Buffer) {
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page
    .getByLabel('Portable project file', { exact: true })
    .setInputFiles({
      name: 'missing-method-project.json',
      mimeType: 'application/json',
      buffer
    })
  page.once('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('button', { name: 'Import and replace current project' })
    .click()
  await expect(
    page.getByRole('dialog', { name: 'Local projects' })
  ).toHaveCount(0)
  await expect(page.getByTestId('history-depth')).toHaveText('Undo steps: 0')
}

test('the shipped missing-method project preserves history and blocks rerun without coordinator repair', async ({
  page,
  context
}, info) => {
  test.setTimeout(60000)
  const fixture = readFileSync(
    new URL('../fixtures/missing-method-project.json', import.meta.url)
  )
  const external: string[] = []
  const origin = new URL(info.project.use.baseURL ?? '').origin
  await context.route('**/*', async (route) => {
    const url = route.request().url()
    if (new URL(url).origin === origin) await route.continue()
    else {
      external.push(url)
      await route.abort()
    }
  })
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  await importProject(page, fixture)
  await page.getByLabel('Candidate', { exact: true }).selectOption({
    label: 'New workcell'
  })
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  let analysisWorkers = 0
  page.on('worker', (worker) => {
    if (/\/analysis\.worker(?:\.ts|-[\w-]+\.js)(?:\?.*)?$/.test(worker.url()))
      analysisWorkers++
  })
  await page.getByRole('button', { name: 'Run analysis', exact: true }).click()
  await expect(page.getByTestId('preflight-report')).toContainText(
    'method-unavailable'
  )
  expect(analysisWorkers).toBe(0)
  await page
    .getByRole('button', { name: 'Runs & compare', exact: true })
    .click()
  const library = page.getByRole('dialog', { name: 'Runs and comparison' })
  const before = JSON.parse(
    (await download(page, 'Export JSON')).toString('utf8')
  )
  expect(before.run.snapshot.method.id).toBe('private-retired-spheres')
  expect(before.run.snapshot.methodDescriptor.manifest.origin).toBe('private')
  expect(before.run.result.execution).toBe('completed')
  expect(before.run.result.coverage).toBe('complete')
  await library
    .getByText('Retained method declaration', { exact: true })
    .click()
  await expect(library).toContainText('Origin: private')
  await page.screenshot({
    path: info.outputPath('missing-method-retained-history.png')
  })
  await library.getByRole('button', { name: 'Close runs', exact: true }).click()
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  const portable = await download(page, 'Export project')
  await page
    .getByRole('button', { name: 'Close projects', exact: true })
    .click()
  await importProject(page, portable)
  await page
    .getByRole('button', { name: 'Runs & compare', exact: true })
    .click()
  const after = JSON.parse(
    (await download(page, 'Export JSON')).toString('utf8')
  )
  expect(after.run).toEqual(before.run)
  expect(external).toEqual([])
})
