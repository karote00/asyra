import { expect, test, type Page } from '@playwright/test'
import {
  createTestDocumentURL,
  waitForAppReady,
  resetCanvas,
  createRectangle,
  getCanvasPosition,
  getSelectedElementRect,
  getElementRectClientCenter,
  getElementCount,
  getUndoHistoryDepth,
  undo,
  redo
} from './test-utils'

const expectActiveTool = async (page: Page, tool: string) => {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { core } = await import('../src/testing/runtime-access')

        return core.getSystemProperty('primaryTool')
      })
    )
    .toBe(tool)
  await expect(
    page.getByTestId(`tool-${tool === 'rect' ? 'rectangle' : tool}`)
  ).toHaveAttribute('data-active', 'true')
}

const holdToolKey = async (page: Page, key: string, tool: string) => {
  await page.keyboard.down(key)
  await expectActiveTool(page, tool)
  // Exercise the reported hold duration, not an application-readiness delay.
  await page.waitForTimeout(150)
}

const canvasPoint = async (page: Page, x: number, y: number) => {
  const point = await getCanvasPosition(page, x, y)

  return { x: Math.round(point.x), y: Math.round(point.y) }
}

const viewportScale = (page: Page) =>
  page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')

    return core.getViewportScale()
  })

test.describe('Tool shortcut gesture handoff', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(createTestDocumentURL())
    await waitForAppReady(page)
    await resetCanvas(page)
  })

  test('held O repeats preserve ellipse resizing and one reversible creation', async ({
    page
  }) => {
    const start = await canvasPoint(page, 0.25, 0.25)
    const end = await canvasPoint(page, 0.65, 0.65)
    const scale = await viewportScale(page)
    const history = await getUndoHistoryDepth(page)

    await holdToolKey(page, 'o', 'oval')
    try {
      await page.mouse.move(start.x, start.y)
      await page.mouse.down()
      await expect.poll(() => getSelectedElementRect(page)).not.toBeNull()
      await page.keyboard.down('o')
      await page.mouse.move(end.x, end.y, { steps: 8 })
      await expect
        .poll(() => getSelectedElementRect(page))
        .toMatchObject({
          width: (end.x - start.x) / scale,
          height: (end.y - start.y) / scale
        })
    } finally {
      await page.mouse.up()
      await page.keyboard.up('o')
    }

    const completed = await getSelectedElementRect(page)

    expect(completed).not.toBeNull()
    await expect(page.getByTestId('prop-width')).toBeVisible()
    await expect.poll(() => getUndoHistoryDepth(page)).toBe(history + 1)
    await undo(page)
    await expect.poll(() => getElementCount(page)).toBe(0)
    await redo(page)
    await expect.poll(() => getSelectedElementRect(page)).toEqual(completed)
  })

  test('held V repeats preserve the entire selected-element move', async ({
    page
  }) => {
    await createRectangle(page, 0.3, 0.3)
    const original = await getSelectedElementRect(page)

    if (!original) {
      throw new Error('Missing selected rectangle')
    }

    const center = await getElementRectClientCenter(page, original)
    const start = { x: Math.round(center.x), y: Math.round(center.y) }
    const scale = await viewportScale(page)
    const history = await getUndoHistoryDepth(page)
    const expected = {
      ...original,
      x: original.x + 120 / scale,
      y: original.y + 80 / scale
    }

    await holdToolKey(page, 'v', 'select')
    try {
      await page.mouse.move(start.x, start.y)
      await page.mouse.down()
      await page.mouse.move(start.x + 30, start.y + 20, { steps: 4 })
      await expect
        .poll(() => getSelectedElementRect(page))
        .toMatchObject({
          x: original.x + 30 / scale,
          y: original.y + 20 / scale
        })
      await page.keyboard.down('v')
      await page.mouse.move(start.x + 120, start.y + 80, { steps: 8 })
      await expect.poll(() => getSelectedElementRect(page)).toEqual(expected)
    } finally {
      await page.mouse.up()
      await page.keyboard.up('v')
    }

    await expect.poll(() => getSelectedElementRect(page)).toEqual(expected)
    await expect.poll(() => getUndoHistoryDepth(page)).toBe(history + 1)
    await undo(page)
    await expect.poll(() => getSelectedElementRect(page)).toEqual(original)
    await redo(page)
    await expect.poll(() => getSelectedElementRect(page)).toEqual(expected)
  })

  test('held P repeats preserve connected handle dragging while fresh P still disconnects continuation', async ({
    page
  }) => {
    const first = await canvasPoint(page, 0.25, 0.3)
    const second = await canvasPoint(page, 0.5, 0.5)
    const scale = await viewportScale(page)

    const readPath = () =>
      page.evaluate(async () => {
        const { systemContextApis, readPenVector } =
          await import('../src/testing/pen-observation')
        const vector = readPenVector(systemContextApis.getPathEditingVectorId())
        const selected = systemContextApis.getSelectedVectorPoint()
        const anchor = selected && vector.points[selected.pointId]
        const out = selected && vector.points[`${selected.pointId}:out`]

        return {
          anchors: Object.values(vector.points).filter(
            (point) => point.kind === 'anchor'
          ).length,
          segments: Object.keys(vector.segments).length,
          outDelta:
            anchor && out ? { x: out.x - anchor.x, y: out.y - anchor.y } : null,
          disconnected: systemContextApis.getPathEditingStartNewSubpath()
        }
      })

    await holdToolKey(page, 'p', 'pen')
    try {
      await page.mouse.click(first.x, first.y)
      await expect.poll(() => getElementCount(page)).toBe(1)
      await page.mouse.move(second.x, second.y)
      await page.mouse.down()
      await expect
        .poll(readPath)
        .toMatchObject({ anchors: 2, segments: 1, disconnected: false })
      await page.keyboard.down('p')
      await page.mouse.move(second.x + 80, second.y - 40, { steps: 8 })
      await expect.poll(readPath).toMatchObject({
        anchors: 2,
        segments: 1,
        outDelta: { x: 80 / scale, y: -40 / scale },
        disconnected: false
      })
    } finally {
      await page.mouse.up()
      await page.keyboard.up('p')
    }

    const completed = await readPath()

    await page.keyboard.press('p')
    await expect.poll(readPath).toEqual({ ...completed, disconnected: true })
    await expectActiveTool(page, 'pen')
    await page.keyboard.press('v')
    await expectActiveTool(page, 'select')
    await expect.poll(readPath).toEqual({ ...completed, disconnected: true })
  })

  test('held T repeats preserve dragged text width and the editable commit', async ({
    page
  }) => {
    const start = await canvasPoint(page, 0.25, 0.25)
    const end = await canvasPoint(page, 0.65, 0.65)
    const scale = await viewportScale(page)
    const history = await getUndoHistoryDepth(page)
    const editor = page.getByRole('textbox', {
      name: 'Canvas text editor',
      exact: true
    })

    await holdToolKey(page, 't', 'text')
    try {
      await page.mouse.move(start.x, start.y)
      await page.mouse.down()
      await page.mouse.move(start.x + 30, start.y + 20, { steps: 4 })
      await page.keyboard.down('t')
      await page.mouse.move(end.x, end.y, { steps: 8 })
    } finally {
      await page.mouse.up()
      await page.keyboard.up('t')
    }

    await expect(editor).toBeFocused()
    await expect.poll(() => getElementCount(page)).toBe(0)
    await editor.fill('Held shortcut text')
    await editor.press('Control+Enter')
    await expect(editor).toHaveCount(0)
    await expect
      .poll(() => getSelectedElementRect(page))
      .toMatchObject({ width: (end.x - start.x) / scale })
    const completed = await getSelectedElementRect(page)
    const content = await page.evaluate(async () => {
      const { core } = await import('../src/testing/runtime-access')

      return core.getElementComputedData(core.getSelectedElementIds()[0])?.text
    })

    expect(content).toBe('Held shortcut text')
    await expect.poll(() => getUndoHistoryDepth(page)).toBe(history + 1)
    await undo(page)
    await expect.poll(() => getElementCount(page)).toBe(0)
    await redo(page)
    await expect.poll(() => getSelectedElementRect(page)).toEqual(completed)
  })

  for (const [key, tool] of [
    ['o', 'oval'],
    ['p', 'pen'],
    ['v', 'select'],
    ['t', 'text']
  ]) {
    test(`fresh ${key.toUpperCase()} still switches tools and finalizes the active rectangle`, async ({
      page
    }) => {
      const start = await canvasPoint(page, 0.25, 0.25)
      const end = await canvasPoint(page, 0.6, 0.6)
      const scale = await viewportScale(page)

      await page.keyboard.press('r')
      await expectActiveTool(page, 'rect')
      await page.mouse.move(start.x, start.y)
      await page.mouse.down()
      try {
        await page.mouse.move(end.x, end.y, { steps: 8 })
        await expect
          .poll(() => getSelectedElementRect(page))
          .toMatchObject({
            width: (end.x - start.x) / scale,
            height: (end.y - start.y) / scale
          })
        const before = await getSelectedElementRect(page)

        expect(before).not.toBeNull()
        await page.keyboard.press(key)
        await expectActiveTool(page, tool)
        await page.mouse.move(start.x, start.y, { steps: 4 })
        await expect.poll(() => getSelectedElementRect(page)).toEqual(before)
      } finally {
        await page.mouse.up()
      }

      await undo(page)
      await expect.poll(() => getElementCount(page)).toBe(0)
    })
  }
})
