import { expect, test } from '@playwright/test'
import { prepareDesign } from '../server/design-preparation'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  getCoreDocumentDigest,
  getUndoHistoryDepth,
  getPersistedDocumentDigest,
  undo,
  redo
} from './test-utils'

for (const rootType of ['group', 'frame'] as const) {
  test(`${rootType} root preserves mixed containers, disclosure and durable Undo`, async ({
    page
  }, testInfo) => {
    const identity = createTestDocumentIdentity()
    const design = prepareDesign({
      type: rootType,
      name: 'Mixed container design',
      x: 40,
      y: 40,
      ...(rootType === 'frame'
        ? { width: 420, height: 320, fill: '#eeeeee' }
        : {}),
      children: [
        {
          key: 'region',
          type: 'frame',
          name: 'Independent region',
          x: 30,
          y: 40,
          width: 300,
          height: 200,
          fill: '#cce0dd',
          children: [
            {
              key: 'parts',
              type: 'group',
              name: 'Artwork parts',
              x: 20,
              y: 20,
              children: [
                {
                  key: 'shape',
                  type: 'rect',
                  name: 'Rectangle',
                  x: 10,
                  y: 15,
                  width: 60,
                  height: 70,
                  fill: '#245640'
                },
                {
                  key: 'oval',
                  type: 'oval',
                  name: 'Oval',
                  x: 90,
                  y: 15,
                  width: 70,
                  height: 70,
                  fill: '#8866aa'
                }
              ]
            }
          ]
        }
      ]
    })
    await page.route('**/api/ai/status', (route) =>
      route.fulfill({ json: { state: 'ready' } })
    )
    await page.route('**/api/ai/action-batch', (route) =>
      route.fulfill({
        json: {
          batchId: 'mixed-containers',
          actions: [
            {
              id: 'apply',
              name: 'apply_prepared_design',
              arguments: { design },
              summary: 'Create the design'
            }
          ]
        }
      })
    )
    await page.goto(identity.url)
    await waitForAppReady(page)
    const before = await getCoreDocumentDigest(page)
    const depth = await getUndoHistoryDepth(page)
    await page.getByRole('button', { name: 'Open Agent' }).click()
    await page
      .getByLabel('Message Agent')
      .fill('Create a design region containing grouped artwork.')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('ai-agent-message')).toHaveAttribute(
      'data-outcome',
      'success'
    )
    expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
    const verify = async () => {
      const actual = await page.evaluate(
        async (ids) => {
          const { core } = await import('../src/testing/runtime-access')
          return ids.map((id) => {
            const d = core.getElementData(id)
            const computed = core.getElementComputedData(id, [
              'x',
              'y',
              'width',
              'height'
            ])
            return { id, type: d?.type, ...computed }
          })
        },
        design.entries.map((e) => e.descriptor.id)
      )
      expect(actual).toEqual(
        design.entries.map(({ descriptor: d }) => ({
          id: d.id,
          type: d.type,
          x: d.x,
          y: d.y,
          width: d.width,
          height: d.height
        }))
      )
    }
    await verify()
    const toggle = page.getByTestId(
      `layers-group-toggle-${design.keyToId.parts}`
    )
    await toggle.click()
    await expect(
      page.getByTestId(`element-item-${design.keyToId.shape}`)
    ).toHaveCount(0)
    await toggle.click()
    await expect(
      page.getByTestId(`element-item-${design.keyToId.shape}`)
    ).toBeVisible()
    await page.getByRole('button', { name: 'Close Agent panel' }).click()
    const after = await getCoreDocumentDigest(page)
    await undo(page)
    expect(await getCoreDocumentDigest(page)).toEqual(before)
    await redo(page)
    expect(await getCoreDocumentDigest(page)).toEqual(after)
    await expect
      .poll(() => getPersistedDocumentDigest(identity.fileId), {
        timeout: 15000
      })
      .toEqual(after)
    await page.reload()
    await waitForAppReady(page)
    await verify()
    await page.evaluate(async () =>
      (await import('../src/common-apis/viewport')).viewportApis.zoomFit()
    )
    await page.screenshot({
      path: testInfo.outputPath(`${rootType}-mixed-containers.png`),
      fullPage: true
    })
  })
}
