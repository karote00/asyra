import { expect, test } from '@playwright/test'
import { createDefaultFill } from '@asyra/utils'
import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import {
  createTestDocumentURL,
  waitForAppReady,
  captureBrowserErrors,
  getCapturedBrowserErrors,
  getCanvasPosition
} from './test-utils'

// The diagonal three-stop palette comes from the retained first-output drawing.
// Exercise the real vector strategy, including holes and fill updates, without AI.
test('renders vector gradient holes and preserves pixels through fill undo and redo', async ({
  page
}, testInfo) => {
  captureBrowserErrors(page)
  await page.goto(createTestDocumentURL())
  await waitForAppReady(page)
  const fills = (['linear', 'radial', 'angular', 'diamond'] as const).map(
    (gradientType) =>
      createDefaultFill({
        id: randomUUID(),
        kind: 'gradient',
        gradient: {
          gradientType,
          gradientHandles: [
            { x: 0, y: 0 },
            { x: 1, y: 0.7 },
            { x: 0.2, y: 0.9 }
          ],
          gradientStops: [
            { position: 0, color: '#316b70', opacity: 1 },
            { position: 0.55, color: '#5f9993', opacity: 1 },
            { position: 1, color: '#254f5a', opacity: 1 }
          ]
        }
      })
  )
  const ids = await page.evaluate(async (fills) => {
    const { core, elementApis } = await import('../src/testing/runtime-access')
    const ids = fills.map((_, index) => {
      const prefix = crypto.randomUUID()
      const x = 100 + (index % 2) * 240
      const y = 100 + Math.floor(index / 2) * 240
      const rings = [
        [0, 0, 200, 200],
        [70, 70, 60, 60]
      ]
      const points = Object.fromEntries(
        rings.flatMap(([left, top, width, height], ring) =>
          [
            [left, top],
            [left + width, top],
            [left + width, top + height],
            [left, top + height]
          ].map(([px, py], point) => {
            const id = `${prefix}-p${ring}-${point}`
            return [
              id,
              { id, kind: 'anchor', anchorType: 'sharp', x: px + x, y: py + y }
            ]
          })
        )
      )
      const segments = Object.fromEntries(
        rings.flatMap((_, ring) =>
          Array.from({ length: 4 }, (_, point) => {
            const id = `${prefix}-s${ring}-${point}`
            return [
              id,
              {
                id,
                startId: `${prefix}-p${ring}-${point}`,
                endId: `${prefix}-p${ring}-${(point + 1) % 4}`,
                outControlId: null,
                inControlId: null
              }
            ]
          })
        )
      )
      const networks = Object.fromEntries(
        rings.map((_, ring) => [
          `${prefix}-n${ring}`,
          {
            id: `${prefix}-n${ring}`,
            pointIds: Array.from(
              { length: 4 },
              (_, i) => `${prefix}-p${ring}-${i}`
            ),
            segmentIds: Array.from(
              { length: 4 },
              (_, i) => `${prefix}-s${ring}-${i}`
            ),
            closed: true
          }
        ])
      )
      const id = elementApis.createElement(
        {
          type: 'vector',
          points,
          segments,
          networks,
          closed: true,
          fills: [fills[index]]
        },
        { undoable: false }
      )
      if (!id) throw new Error('Vector creation failed')
      return id
    })
    core.selectElements([], { undoable: false })
    return ids
  }, fills)
  const focus = await getCanvasPosition(page, 0.02, 0.02)
  await page.mouse.click(focus.x, focus.y)
  await page.keyboard.press('Meta+1')
  const snapshot = async () =>
    page.evaluate(async (ids) => {
      const { core } = await import('../src/testing/runtime-access')
      return {
        zoom: core.getSystemProperty('zoom'),
        viewport: core.getSystemProperty('viewportPosition'),
        elements: ids.map((id) => {
          const element = core.deps.sceneTree.getElementById(id)
          if (!element) throw new Error('Missing gradient vector')
          return { id, ...element.getAllComputedData() }
        })
      }
    }, ids)
  await expect
    .poll(async () =>
      (await snapshot()).elements.map(
        (element) => element.fills?.[0]?.gradient?.gradientType
      )
    )
    .toEqual(['linear', 'radial', 'angular', 'diamond'])
  await page.waitForTimeout(150)
  const before = await page
    .locator('canvas')
    .first()
    .screenshot({ path: testInfo.outputPath('vector-gradients.png') })
  await writeFile(
    testInfo.outputPath('runtime.json'),
    JSON.stringify(
      {
        url: page.url(),
        viewport: page.viewportSize(),
        state: await snapshot(),
        selected: false
      },
      null,
      2
    )
  )
  await page.evaluate(async (ids) => {
    const { fillApis } = await import('../src/common-apis/fills')
    fillApis.updateFillsAtIndex(ids, 0, { opacity: 0.3 })
  }, ids)
  await expect
    .poll(async () =>
      (await snapshot()).elements.map((element) => element.fills?.[0]?.opacity)
    )
    .toEqual([0.3, 0.3, 0.3, 0.3])
  await page.waitForTimeout(150)
  const changed = await page.locator('canvas').first().screenshot()
  expect(changed.equals(before)).toBe(false)
  await page.keyboard.press('Meta+z')
  await expect
    .poll(async () =>
      (await snapshot()).elements.map((element) => element.fills?.[0]?.opacity)
    )
    .toEqual([1, 1, 1, 1])
  await expect
    .poll(async () =>
      (await page.locator('canvas').first().screenshot()).equals(before)
    )
    .toBe(true)
  await page.keyboard.press('Meta+Shift+z')
  await expect
    .poll(async () =>
      (await snapshot()).elements.map((element) => element.fills?.[0]?.opacity)
    )
    .toEqual([0.3, 0.3, 0.3, 0.3])
  await expect
    .poll(async () =>
      (await page.locator('canvas').first().screenshot()).equals(changed)
    )
    .toBe(true)
  expect(getCapturedBrowserErrors(page)).toEqual([])
})
