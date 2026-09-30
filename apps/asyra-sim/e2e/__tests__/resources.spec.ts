import { expect, test } from '@playwright/test'

test('a rejected trajectory selection invalidates the old preview without changing the project', async ({
  page
}, info) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  const depth = await page.getByTestId('history-depth').textContent()
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.locator('.trajectory-import > summary').click()
  await page
    .getByRole('button', { name: 'Preview trajectory', exact: true })
    .click()
  await expect(page.getByLabel('Trajectory conversion preview')).toBeVisible()
  await page.getByLabel('Load trajectory CSV').setInputFiles({
    name: 'oversized.csv',
    mimeType: 'text/csv',
    buffer: Buffer.alloc(8 * 1024 * 1024 + 1)
  })
  const panel = page.locator('.trajectory-import')
  await expect(panel).toContainText('CSV exceeds the 8 MiB import limit')
  await expect(page.getByLabel('Trajectory conversion preview')).toHaveCount(0)
  await expect(page.getByTestId('history-depth')).toHaveText(depth ?? '')
  await panel.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('trajectory-admission.png') })
  await info.attach('review-state.json', {
    contentType: 'application/json',
    body: JSON.stringify({
      baseURL: info.project.use.baseURL,
      viewport: page.viewportSize(),
      dpr: 1,
      scope: 'files:e2e/__tests__/resources.spec.ts',
      camera: 'default',
      screenshot: 'trajectory-admission.png',
      sourceBytes: 8 * 1024 * 1024 + 1,
      historyDepth: depth,
      acceptedPreviewCount: 0
    })
  })
})

test('an oversized GLB is rejected visibly without changing the canonical workcell', async ({
  page
}, info) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Local runtime ready')
  const depth = await page.getByTestId('history-depth').textContent()
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'GLB original part' }).click()
  await page.getByLabel('Choose original part GLB').setInputFiles({
    name: 'oversized.glb',
    mimeType: 'model/gltf-binary',
    buffer: Buffer.alloc(16 * 1024 * 1024 + 1)
  })
  const preview = page.locator('.glb-preview')
  await expect(preview).toContainText('no larger than 16 MiB')
  await expect(page.getByLabel('Choose original part GLB')).toBeEnabled()
  await expect(page.getByRole('treeitem')).toHaveCount(11)
  await expect(page.getByTestId('history-depth')).toHaveText(depth ?? '')
  await preview.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('oversized-visual.png') })
  await info.attach('review-state.json', {
    contentType: 'application/json',
    body: JSON.stringify({
      baseURL: info.project.use.baseURL,
      viewport: page.viewportSize(),
      dpr: 1,
      scope: 'files:e2e/__tests__/resources.spec.ts',
      camera: 'default',
      selectedCandidate: await page
        .getByLabel('Candidate', { exact: true })
        .inputValue(),
      screenshot: 'oversized-visual.png',
      sourceBytes: 16 * 1024 * 1024 + 1
    })
  })
})
