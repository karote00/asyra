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
  await editor(page).press('Control+Enter')
  const after = (await readTexts(page))[0]
  expect(after.width).toBe(before.width)
  expect(after.height).toBe(before.height)
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
  await expect(page.getByRole('alert')).toContainText('changed')
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
