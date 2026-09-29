import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { expect, test } from '@playwright/test'
import { prepareDesign } from '../server/design-preparation'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  getCoreDocumentDigest,
  getUndoHistoryDepth
} from './test-utils'

test('large composition overview covers every corner while native regions preserve detail', async ({
  page
}, testInfo) => {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff']
  const design = prepareDesign({
    type: 'frame',
    name: 'Large inspection composition',
    width: 20000,
    height: 10000,
    fill: '#ffffff',
    children: colors.map((fill, index) => ({
      key: 'corner-' + index,
      type: 'rect',
      name: 'Corner ' + index,
      x: index % 2 ? 19000 : 0,
      y: index >= 2 ? 9000 : 0,
      width: 1000,
      height: 1000,
      fill
    }))
  })
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({ json: { state: 'ready' } })
  )
  await page.route('**/api/ai/action-batch', (route) =>
    route.fulfill({
      json: {
        batchId: 'large-inspection',
        actions: [
          {
            id: 'apply',
            name: 'apply_prepared_design',
            arguments: { design },
            summary: 'Create inspection drawing'
          }
        ]
      }
    })
  )
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page.getByLabel('Message Agent').fill('Create the inspection drawing.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
    'data-outcome',
    'success'
  )
  const before = await getCoreDocumentDigest(page)
  const depth = await getUndoHistoryDepth(page)
  const captures = await page.evaluate(async (id) => {
    const { inspectionApis } = await import('../src/common-apis/inspection')
    return {
      overview: inspectionApis.inspect(id),
      detail: inspectionApis.inspect(id, {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000
      }),
      oversized: inspectionApis.inspect(id, undefined, 'detail')
    }
  }, design.entries[0].descriptor.id)
  expect(captures.overview).toMatchObject({
    available: true,
    partial: false,
    imageScope: 'overview'
  })
  expect(captures.detail).toMatchObject({
    available: true,
    partial: true,
    imageScope: 'region'
  })
  expect(captures.oversized.available).toBe(false)
  if (!captures.overview.image || !captures.detail.image)
    throw new Error('Missing capture')
  expect(captures.overview.image.width).toBe(1024)
  expect(captures.overview.image.height).toBe(512)
  expect(captures.detail.image.width).toBe(1000)
  expect(captures.detail.image.height).toBe(1000)
  const png = Buffer.from(
    captures.overview.image.dataUrl.split(',')[1],
    'base64'
  )
  const { data, info } = await sharp(png)
    .raw()
    .toBuffer({ resolveWithObject: true })
  const expected = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 0, 255]
  ]
  for (let index = 0; index < 4; index++) {
    const x = index % 2 ? 1000 : 24
    const y = index >= 2 ? 488 : 24
    const offset = (y * info.width + x) * info.channels
    expect([...data.subarray(offset, offset + 3)]).toEqual(expected[index])
  }
  await writeFile(testInfo.outputPath('large-overview.png'), png)
  await writeFile(
    testInfo.outputPath('native-region.png'),
    Buffer.from(captures.detail.image.dataUrl.split(',')[1], 'base64')
  )
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  expect(await getUndoHistoryDepth(page)).toBe(depth)
})
