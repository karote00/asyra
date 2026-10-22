import sharp from 'sharp'
import { expect, test, type Page } from '@playwright/test'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  getUndoHistoryDepth,
  undo,
  redo
} from './test-utils'

const editor = (page: Page) =>
  page.getByRole('textbox', { name: 'Canvas text editor', exact: true })
const editorBounds = async (page: Page) => {
  const bounds = await editor(page).boundingBox()
  if (!bounds) throw new Error('Missing visible text editor')
  return bounds
}
const readTexts = (page: Page) =>
  page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const document = await core.save()
    return Object.values(document.sceneTree.elements)
      .filter((entry) => entry.type === 'text')
      .map((entry) => ({
        id: entry.id,
        ...core.getElementComputedData(entry.id)
      }))
  })
const startText = async (page: Page, drag = false) => {
  await page.getByRole('button', { name: 'Text', exact: true }).click()
  await page.mouse.move(500, 300)
  if (drag) {
    await page.mouse.down()
    await page.mouse.move(760, 420, { steps: 4 })
    await page.mouse.up()
  } else await page.mouse.click(500, 300)
  await expect(editor(page)).toBeFocused()
}

test.beforeEach(async ({ page }) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
})
test('Canvas text input keeps the underlying scene visible', async ({
  page
}, testInfo) => {
  await startText(page)
  await editor(page).fill('Transparent editor')
  await expect(page.locator('#canvas-text-help')).toHaveCount(0)
  await expect(
    page.getByText(
      'Enter: new line - Cmd/Ctrl+Enter: finish - Escape: cancel',
      { exact: true }
    )
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Close editor', exact: true })
  ).toHaveCount(0)
  await expect(editor(page)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(editor(page)).toHaveCSS('background-image', 'none')
  await page.screenshot({ path: testInfo.outputPath('transparent-editor.png') })
  await editor(page).press('Escape')
})
test('Click creation stays provisional and commits one reversible Unicode text object', async ({
  page
}) => {
  const before = await getUndoHistoryDepth(page)
  await startText(page)
  await expect.poll(() => readTexts(page)).toEqual([])
  await editor(page).fill('Hello 台灣 🌱\n<b>literal</b>')
  await editor(page).press('Control+Enter')
  await expect(editor(page)).toHaveCount(0)
  await expect
    .poll(async () => (await readTexts(page))[0]?.text)
    .toBe('Hello 台灣 🌱\n<b>literal</b>')
  expect(await getUndoHistoryDepth(page)).toBe(before + 1)
  await undo(page)
  await expect.poll(() => readTexts(page)).toEqual([])
  await redo(page)
  await expect
    .poll(async () => (await readTexts(page))[0]?.text)
    .toBe('Hello 台灣 🌱\n<b>literal</b>')
})
test('Cancel and empty new sessions leave no object or Undo entry', async ({
  page
}) => {
  const before = await getUndoHistoryDepth(page)
  await startText(page)
  await editor(page).fill('Discard')
  await editor(page).press('Escape')
  await startText(page)
  await editor(page).press('Control+Enter')
  expect(await readTexts(page)).toEqual([])
  expect(await getUndoHistoryDepth(page)).toBe(before)
})
test('Dragged text can be edited from the panel, cancelled, cleared and undone', async ({
  page
}) => {
  await startText(page, true)
  await editor(page).fill('Original')
  await editor(page).press('Control+Enter')
  const first = (await readTexts(page))[0]
  await page.getByRole('button', { name: 'Edit text on Canvas' }).click()
  await editor(page).fill('Discarded')
  await editor(page).press('Escape')
  expect((await readTexts(page))[0].text).toBe('Original')
  await page.getByRole('button', { name: 'Edit text on Canvas' }).click()
  await editor(page).fill('')
  await editor(page).press('Control+Enter')
  const empty = (await readTexts(page))[0]
  expect(empty.id).toBe(first.id)
  expect(empty.text).toBe('')
  expect(empty.width).toBe(first.width)
  expect(empty.fills).toEqual(first.fills)
  await undo(page)
  await expect
    .poll(async () => (await readTexts(page))[0]?.text)
    .toBe('Original')
})
test('IME confirmation and text shortcuts do not finish the session or switch tools', async ({
  page
}) => {
  await startText(page)
  await editor(page).dispatchEvent('compositionstart')
  await editor(page).fill('台灣')
  await editor(page).press('Control+Enter')
  await expect(editor(page)).toBeFocused()
  expect(await readTexts(page)).toEqual([])
  await editor(page).dispatchEvent('compositionend', { data: '台灣' })
  await editor(page).press('End')
  await editor(page).press('t')
  await editor(page).press('v')
  await expect(editor(page)).toHaveValue('台灣tv')
  await expect(page.getByTestId('tool-text')).toHaveAttribute(
    'data-active',
    'true'
  )
  await editor(page).press('Control+Enter')
  await expect.poll(async () => (await readTexts(page))[0]?.text).toBe('台灣tv')
})

test('Double click edits text and outside clicks commit before switching tools', async ({
  page
}) => {
  await startText(page)
  await editor(page).fill('Double click')
  await editor(page).press('Control+Enter')
  await page.mouse.dblclick(520, 310)
  await expect(editor(page)).toBeFocused()
  await editor(page).fill('Changed outside')
  await page.getByTestId('tool-rectangle').click()
  await expect(editor(page)).toHaveCount(0)
  await expect
    .poll(async () => (await readTexts(page))[0]?.text)
    .toBe('Changed outside')
  await expect(page.getByTestId('tool-rectangle')).toHaveAttribute(
    'data-active',
    'true'
  )
})

test('Text shortcut arms Canvas and Escape returns to Select', async ({
  page
}) => {
  await page.mouse.click(500, 250)
  await page.keyboard.press('t')
  await expect(
    page.getByRole('button', { name: 'Text', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('tool-select')).toHaveAttribute(
    'data-active',
    'true'
  )
})

test('Canvas edit survives durable save and reload', async ({ page }) => {
  const identity = createTestDocumentIdentity()
  await page.goto(identity.url)
  await waitForAppReady(page)
  await startText(page)
  await editor(page).fill('Durable text')
  await editor(page).press('Control+Enter')
  const before = await readTexts(page)
  const { getCoreDocumentDigest, getPersistedDocumentDigest } =
    await import('./test-utils')
  const digest = await getCoreDocumentDigest(page)
  await expect
    .poll(() => getPersistedDocumentDigest(identity.fileId), { timeout: 20000 })
    .toEqual(digest)
  await page.reload()
  await waitForAppReady(page)
  await expect.poll(() => readTexts(page)).toEqual(before)
  await page.getByRole('button', { name: 'Select (V)', exact: true }).click()
  await page.mouse.click(510, 310)
  await page.getByRole('button', { name: 'Edit text on Canvas' }).click()
  await editor(page).fill('A much longer durable text line')
  expect((await editorBounds(page)).width).toBeGreaterThan(
    Number(before[0].width)
  )
  await editor(page).press('Control+Enter')
})

test('Rotated text editor follows Canvas projection and preserves geometry', async ({
  page
}, testInfo) => {
  await startText(page)
  await editor(page).fill('Canvas editing\n台灣 text')
  await editor(page).press('Control+Enter')
  const id = (await readTexts(page))[0].id
  await page.evaluate(async (id) => {
    const { elementApis } = await import('../src/common-apis/element')
    const { viewportApis } = await import('../src/common-apis/viewport')
    elementApis.updateElementProperties([id], {
      rotation: 0.3,
      fontSize: 26,
      lineHeight: 32
    })
    viewportApis.zoomToCenter(1.5, 640, 360)
    viewportApis.panTo(200, 0)
  }, id)
  const before = (await readTexts(page))[0]
  await page.getByRole('button', { name: 'Edit text on Canvas' }).click()
  await expect(editor(page)).toBeFocused()
  const alignment = await page.evaluate(async (id) => {
    const { core } = await import('../src/testing/runtime-access')
    const node = document.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Canvas text editor"]'
    )
    if (!node) throw new Error('Missing Canvas text editor')
    const matrix = new DOMMatrix(getComputedStyle(node).transform)
    const project = (x: number, y: number) => {
      const point = core.elementLocalToWorkspace(id, { x, y })
      if (!point) throw new Error('Missing text projection')
      return core.workspaceToCanvas(point)
    }
    return {
      actual: [matrix.e, matrix.f, matrix.a, matrix.b, matrix.c, matrix.d],
      origin: project(0, 0),
      horizontal: project(1, 0),
      vertical: project(0, 1)
    }
  }, id)
  expect(Math.abs(alignment.actual[3])).toBeGreaterThan(0.1)
  const expected = [
    alignment.origin.x,
    alignment.origin.y,
    alignment.horizontal.x - alignment.origin.x,
    alignment.horizontal.y - alignment.origin.y,
    alignment.vertical.x - alignment.origin.x,
    alignment.vertical.y - alignment.origin.y
  ]
  alignment.actual.forEach((value, index) =>
    expect(value).toBeCloseTo(expected[index], 3)
  )
  await page.screenshot({ path: testInfo.outputPath('text-canvas-editor.png') })
  await editor(page).fill('Edited on Canvas\n台灣 text')
  await page.screenshot({ path: testInfo.outputPath('text-canvas-draft.png') })
  const editedSize = await editor(page).evaluate((node) => ({
    width: parseFloat(node.style.width),
    height: parseFloat(node.style.height)
  }))
  await editor(page).press('Control+Enter')
  const after = (await readTexts(page))[0]
  expect(after.width).toBe(editedSize.width)
  expect(after.height).toBe(editedSize.height)
  expect(after.rotation).toBe(before.rotation)
  await page.screenshot({
    path: testInfo.outputPath('text-canvas-committed.png')
  })
})

test('A stale text draft cannot overwrite an external content change', async ({
  page
}) => {
  await startText(page)
  await editor(page).fill('Original')
  await editor(page).press('Control+Enter')
  const id = (await readTexts(page))[0].id
  await page.getByRole('button', { name: 'Edit text on Canvas' }).click()
  await editor(page).fill('Local draft')
  await page.evaluate(async (id) => {
    const { elementApis } = await import('../src/common-apis/element')
    elementApis.updateElementProperties([id], { text: 'External change' })
  }, id)
  await expect(editor(page)).toHaveAttribute('aria-description', /changed/)
  await expect(editor(page)).toHaveAttribute('aria-invalid', 'true')
  await editor(page).press('Control+Enter')
  expect((await readTexts(page))[0].text).toBe('External change')
  await expect(editor(page)).toHaveValue('Local draft')
  await editor(page).press('Escape')
  await expect(editor(page)).toHaveCount(0)
})

test('Native text Undo and select-all do not consume document history or delete the object', async ({
  page
}) => {
  await startText(page)
  await editor(page).fill('Original')
  await editor(page).press('Control+Enter')
  const before = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Edit text on Canvas' }).click()
  await page.keyboard.insertText('Draft')
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  await editor(page).press(`${modifier}+z`)
  await expect(editor(page)).toHaveValue('Original')
  expect(await getUndoHistoryDepth(page)).toBe(before)
  await editor(page).press(`${modifier}+a`)
  await editor(page).press('Backspace')
  await expect(editor(page)).toHaveValue('')
  expect((await readTexts(page))[0].text).toBe('Original')
  await editor(page).press('Escape')
  expect(await getUndoHistoryDepth(page)).toBe(before)
})

test('Point text grows and shrinks with content and keeps its committed dimensions', async ({
  page
}, testInfo) => {
  await startText(page)
  const initial = await editorBounds(page)
  expect(initial?.width).toBeLessThan(10)
  expect(initial?.height).toBe(20)
  await editor(page).fill(
    'A line of text that is wider than the former default text box '.repeat(2)
  )
  const wide = await editorBounds(page)
  expect(wide.width).toBeGreaterThan(240)
  expect(wide.height).toBe(20)
  await editor(page).fill('Hello\n台灣')
  const multiline = await editorBounds(page)
  expect(multiline.width).toBeLessThan(wide.width)
  expect(multiline.height).toBe(40)
  await page.screenshot({ path: testInfo.outputPath('point-text-sizing.png') })
  await editor(page).press('Control+Enter')
  const committed = (await readTexts(page))[0]
  expect(committed.width).toBeCloseTo(multiline.width, 0)
  expect(committed.height).toBe(multiline.height)
  await page.getByRole('button', { name: 'Edit text on Canvas' }).click()
  await editor(page).fill('Hi')
  const small = await editorBounds(page)
  expect(small.width).toBeLessThan(multiline.width)
  expect(small.height).toBe(20)
  await editor(page).press('Control+Enter')
  expect((await readTexts(page))[0].width).toBeCloseTo(small.width, 0)
  await undo(page)
  expect((await readTexts(page))[0].width).toBe(committed.width)
  await redo(page)
  expect((await readTexts(page))[0].width).toBeCloseTo(small.width, 0)
})

test('Dragged text keeps its width and fits its height during and after editing', async ({
  page
}, testInfo) => {
  await startText(page, true)
  expect((await editorBounds(page)).width).toBe(260)
  await editor(page).fill('Wrapped text '.repeat(50))
  const tall = await editorBounds(page)
  expect(tall.width).toBe(260)
  expect(tall.height).toBeGreaterThan(120)
  expect(
    await editor(page).evaluate(
      (node) => node.scrollHeight <= node.clientHeight
    )
  ).toBe(true)
  await editor(page).fill('Short text')
  const short = await editorBounds(page)
  expect(short.width).toBe(260)
  expect(short.height).toBe(20)
  await page.screenshot({
    path: testInfo.outputPath('dragged-text-sizing.png')
  })
  await editor(page).press('Control+Enter')
  const committed = (await readTexts(page))[0]
  expect(committed.width).toBe(260)
  expect(committed.height).toBe(short.height)
  await page.getByRole('button', { name: 'Edit text on Canvas' }).click()
  await editor(page).fill('Wrapped again '.repeat(20))
  const reopened = await editorBounds(page)
  expect(reopened.width).toBe(260)
  expect(reopened.height).toBeGreaterThan(20)
  await editor(page).press('Control+Enter')
  expect((await readTexts(page))[0].height).toBe(reopened.height)
})

for (const entry of ['armed', 'click', 'drag']) {
  test(`Leaving empty text cancels without an object or history - ${entry}`, async ({
    page
  }) => {
    const depth = await getUndoHistoryDepth(page)
    await page.keyboard.press('t')
    if (entry !== 'armed') {
      await startText(page, entry === 'drag')
      await editor(page).press('Tab')
    } else {
      await page
        .getByRole('button', { name: 'Select (V)', exact: true })
        .click()
    }
    await expect(editor(page)).toHaveCount(0)
    expect(await readTexts(page)).toEqual([])
    expect(await getUndoHistoryDepth(page)).toBe(depth)
  })
}

test('Typography edits resize point text and Undo restores content dimensions together', async ({
  page
}) => {
  await startText(page)
  await editor(page).fill('Auto typography')
  await editor(page).press('Control+Enter')
  const before = (await readTexts(page))[0]
  const size = page.getByLabel('Font size', { exact: true })
  await size.fill('32')
  await size.press('Enter')
  const after = (await readTexts(page))[0]
  expect(Number(after.width)).toBeGreaterThan(Number(before.width))
  await undo(page)
  expect((await readTexts(page))[0].width).toBe(before.width)
  await redo(page)
  expect((await readTexts(page))[0].width).toBe(after.width)
  await page.getByRole('button', { name: 'Edit text on Canvas' }).click()
  const bounds = await editorBounds(page)
  expect(bounds.width).toBeCloseTo(Number(after.width), 0)
  expect(
    await editor(page).evaluate(
      (node) => node.scrollHeight <= node.clientHeight
    )
  ).toBe(true)
  await editor(page).press('Escape')
})

test('Editing replaces the old glyph projection and cancellation restores it without changing data', async ({
  page
}, testInfo) => {
  await startText(page)
  await editor(page).fill('Original red text')
  await editor(page).press('Control+Enter')
  const id = (await readTexts(page))[0].id
  await page.evaluate(async (id) => {
    const { fillApis } = await import('../src/common-apis/fills')
    fillApis.updatePrimaryFillColor(id, '#ff0000')
  }, id)
  const countRed = async () => {
    const { data, info } = await sharp(
      await page.screenshot({
        clip: { x: 480, y: 280, width: 400, height: 200 }
      })
    )
      .raw()
      .toBuffer({ resolveWithObject: true })
    let count = 0
    for (let i = 0; i < data.length; i += info.channels)
      if (data[i] > 180 && data[i + 1] < 80 && data[i + 2] < 80) count++
    return count
  }
  await expect.poll(countRed).toBeGreaterThan(0)
  const depth = await getUndoHistoryDepth(page)
  await page.getByRole('button', { name: 'Edit text on Canvas' }).click()
  await editor(page).fill('Draft')
  await expect.poll(countRed).toBe(0)
  expect((await readTexts(page))[0].text).toBe('Original red text')
  await page.screenshot({
    path: testInfo.outputPath('editing-without-old-glyphs.png')
  })
  await editor(page).press('Escape')
  await expect.poll(countRed).toBeGreaterThan(0)
  expect(await getUndoHistoryDepth(page)).toBe(depth)
})
