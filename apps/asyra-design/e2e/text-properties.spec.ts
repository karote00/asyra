import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { expect, test, type Page } from '@playwright/test'
import {
  createTestDocumentIdentity,
  waitForAppReady,
  undo,
  redo,
  getUndoHistoryDepth
} from './test-utils'

const elementId = 'typography-sample'

const createTextFixture = async (page: Page) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await page.evaluate(async (id) => {
    const { elementApis, hierarchyApis } =
      await import('../src/testing/runtime-access')
    const { transactionApis } = await import('../src/common-apis/transaction')
    const { selectionApis } = await import('../src/common-apis/selection')
    const { viewportApis } = await import('../src/common-apis/viewport')
    const parent = hierarchyApis.getWorkspaceId()
    if (!parent) throw new Error('Missing workspace')
    transactionApis.runTransaction(() =>
      elementApis.createElementsInParent(
        [
          {
            id,
            name: 'Typography sample',
            type: 'text',
            x: 80,
            y: 80,
            width: 420,
            height: 180,
            visible: true,
            lock: false,
            props: {
              position: `${id}-position`,
              dimension: `${id}-dimension`,
              typography: `${id}-typography`
            },
            text: 'Design with words\nType',
            fontFamily: 'sans-serif',
            fontSize: 32,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            lineHeight: 40,
            letterSpacing: 0,
            textColor: '#ffffff'
          }
        ],
        parent,
        { undoable: true }
      )
    )
    selectionApis.selectElements([id])
    viewportApis.zoomFit()
  }, elementId)
  await expect(
    page.getByRole('region', { name: 'Typography', exact: true })
  ).toBeVisible()
}

const readTypography = (page: Page) =>
  page.evaluate(async (id) => {
    const { core } = await import('../src/testing/runtime-access')
    return core.getElementComputedData(id) as unknown as Record<
      string,
      string | number
    >
  }, elementId)

const captureText = async (page: Page) => {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  const [left, right, toolbar] = await Promise.all([
    page.getByTestId('contents-panel').boundingBox(),
    page.getByTestId('properties-panel').boundingBox(),
    page.getByTestId('toolbar').boundingBox()
  ])
  const viewport = page.viewportSize()
  if (!left || !right || !toolbar || !viewport)
    throw new Error('Missing canvas viewport bounds')
  const x = left.x + left.width
  const y = toolbar.y + toolbar.height
  // Canvas spans the window behind the DOM panels; sample only its visible area.
  const pixels = await page.screenshot({
    clip: { x, y, width: right.x - x, height: viewport.height - y }
  })
  const { data, info } = await sharp(pixels)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let minX = info.width
  let maxX = -1
  let minY = info.height
  let maxY = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const offset = (y * info.width + x) * 4
      // The fixture's white glyphs exclude the blue selection outline and dark canvas.
      if (
        data[offset] > 240 &&
        data[offset + 1] > 240 &&
        data[offset + 2] > 240
      ) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }
  return {
    pixels,
    hash: createHash('sha256').update(data).digest('hex'),
    ink: { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  }
}

const cases = [
  {
    key: 'text',
    label: 'Content',
    value: 'Updated typography\nSecond line',
    control: 'input'
  },
  { key: 'fontFamily', label: 'Font family', value: 'serif', control: 'input' },
  { key: 'fontSize', label: 'Font size', value: 40, control: 'input' },
  { key: 'fontWeight', label: 'Font style', value: 'bold', control: 'select' },
  { key: 'fontStyle', label: 'Font style', value: 'italic', control: 'select' },
  {
    key: 'textAlign',
    label: 'Align center',
    value: 'center',
    control: 'button'
  },
  { key: 'textAlign', label: 'Align right', value: 'right', control: 'button' },
  { key: 'lineHeight', label: 'Line height', value: 56, control: 'input' },
  { key: 'letterSpacing', label: 'Letter spacing', value: 3, control: 'input' },
  { key: 'textColor', label: 'Text color', value: '#43cba5', control: 'input' }
] as const

for (const entry of cases) {
  test(`Typography ${entry.key} ${String(entry.value).replaceAll('\n', ' - ')} changes rendered text and has one undo step`, async ({
    page
  }, testInfo) => {
    await createTextFixture(page)
    const beforeData = await readTypography(page)
    const before = await captureText(page)
    const depth = await getUndoHistoryDepth(page)
    if (entry.control === 'button') {
      await page.getByRole('button', { name: entry.label, exact: true }).click()
    } else if (entry.control === 'select') {
      await page
        .getByRole('combobox', { name: entry.label, exact: true })
        .selectOption(entry.value)
    } else {
      const input = page.getByRole(
        typeof entry.value === 'number' ? 'spinbutton' : 'textbox',
        { name: entry.label, exact: true }
      )
      await input.fill(String(entry.value))
      await input.press('Tab')
    }
    await expect
      .poll(async () => (await readTypography(page))[entry.key])
      .toBe(entry.value)
    await expect.poll(() => getUndoHistoryDepth(page)).toBe(depth + 1)
    const after = await captureText(page)
    await testInfo.attach('before', {
      body: before.pixels,
      contentType: 'image/png'
    })
    await testInfo.attach('after', {
      body: after.pixels,
      contentType: 'image/png'
    })
    expect(after.hash).not.toBe(before.hash)
    if (entry.key !== 'textColor') expect(after.ink.width).toBeGreaterThan(0)
    if (entry.key === 'fontSize' || entry.key === 'letterSpacing') {
      expect(after.ink.width).toBeGreaterThan(before.ink.width)
    }
    if (entry.key === 'lineHeight') {
      expect(after.ink.height).toBeGreaterThan(before.ink.height)
    }
    if (entry.key === 'textAlign') {
      expect(after.ink.x).toBeGreaterThan(before.ink.x + 50)
      const alignedData = await readTypography(page)
      expect(alignedData.width).toBe(beforeData.width)
      expect(alignedData.fontSize).toBe(beforeData.fontSize)
    }
    await undo(page)
    await expect
      .poll(async () => (await readTypography(page))[entry.key])
      .toBe(beforeData[entry.key])
    expect((await captureText(page)).hash).toBe(before.hash)
    await redo(page)
    await expect
      .poll(async () => (await readTypography(page))[entry.key])
      .toBe(entry.value)
    expect((await captureText(page)).hash).toBe(after.hash)
    await testInfo.attach('review-state', {
      body: JSON.stringify({
        url: page.url(),
        viewport: page.viewportSize(),
        elementId,
        data: await readTypography(page)
      }),
      contentType: 'application/json'
    })
    await page.screenshot({
      path: testInfo.outputPath(`${entry.key}.png`),
      fullPage: true
    })
  })
}

test('Text toolbar and layer share their SVG and typography drafts preserve canonical values', async ({
  page
}, testInfo) => {
  await createTextFixture(page)
  const tool = page.getByRole('button', { name: 'Text', exact: true })
  const layer = page.locator(`[data-layer-element-id="${elementId}"]`)
  const toolPath = await tool.locator('svg path').getAttribute('d')
  expect(toolPath).toBeTruthy()
  expect(await layer.locator('svg path').first().getAttribute('d')).toBe(
    toolPath
  )
  await tool.click()
  await expect(tool).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('tool-select').click()
  await expect(tool).toHaveAttribute('aria-pressed', 'false')
  await layer.click()

  const size = page.getByLabel('Font size', { exact: true })
  const depth = await getUndoHistoryDepth(page)
  await size.fill('-4')
  await size.press('Tab')
  await expect(size).toHaveAttribute('aria-invalid', 'true')
  expect((await readTypography(page)).fontSize).toBe(32)
  expect(await getUndoHistoryDepth(page)).toBe(depth)
  await size.press('Escape')
  await expect(size).toHaveValue('32')

  const content = page.getByRole('textbox', { name: 'Content', exact: true })
  await content.fill('Discard this draft')
  await content.press('Escape')
  await expect(content).toHaveValue('Design with words\nType')
  expect(await getUndoHistoryDepth(page)).toBe(depth)
  await page.screenshot({
    path: testInfo.outputPath('text-ui.png'),
    fullPage: true
  })
})

test('Typography controls match the compact geometry rows', async ({
  page
}, testInfo) => {
  await createTextFixture(page)
  const geometry = await page.getByTestId('prop-x').boundingBox()
  const size = await page.getByLabel('Font size', { exact: true }).boundingBox()
  const spacing = await page
    .getByLabel('Letter spacing', { exact: true })
    .boundingBox()
  const height = await page
    .getByLabel('Line height', { exact: true })
    .boundingBox()
  expect(geometry).not.toBeNull()
  expect(size).not.toBeNull()
  expect(spacing).not.toBeNull()
  expect(height).not.toBeNull()
  if (!geometry || !size || !spacing || !height)
    throw new Error('Missing property controls')
  expect(size.height).toBe(geometry.height)
  expect(Math.abs(spacing.y - height.y)).toBeLessThan(1)
  const style = await page
    .getByRole('combobox', { name: 'Font style', exact: true })
    .boundingBox()
  if (!style) throw new Error('Missing font style selector')
  expect(Math.abs(style.y - size.y)).toBeLessThan(1)
  expect(spacing.y).toBeGreaterThan(size.y + size.height)
  const typography = page.getByRole('region', {
    name: 'Typography',
    exact: true
  })
  await expect(
    typography.getByText('Line height', { exact: true })
  ).toBeVisible()
  await expect(
    typography.getByText('Letter spacing', { exact: true })
  ).toBeVisible()
  await expect(
    typography.getByLabel('Text color', { exact: true })
  ).toHaveCount(0)
  await expect(
    page
      .getByRole('region', { name: 'Fill', exact: true })
      .getByLabel('Text color', { exact: true })
  ).toBeVisible()
  await expect(
    page
      .getByRole('region', { name: 'Content', exact: true })
      .getByRole('textbox')
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('compact-typography.png'),
    fullPage: true
  })
})

test('Shared text color picker commits a color with one undo step', async ({
  page
}) => {
  await createTextFixture(page)
  const before = await captureText(page)
  const depth = await getUndoHistoryDepth(page)
  await page.getByTestId('prop-text-color-picker-trigger').click()
  await expect(page.getByTestId('prop-text-color-picker-alpha')).toHaveCount(0)
  const hex = page.getByTestId('prop-text-color-picker-hex')
  await hex.fill('43CBA5')
  await hex.press('Tab')
  await expect
    .poll(async () =>
      String((await readTypography(page)).textColor).toLowerCase()
    )
    .toBe('#43cba5')
  await page.getByTestId('prop-text-color-picker-trigger').click()
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  expect((await captureText(page)).hash).not.toBe(before.hash)
  await undo(page)
  expect((await captureText(page)).hash).toBe(before.hash)
})

test('Combined font style changes both properties in one reversible action', async ({
  page
}) => {
  await createTextFixture(page)
  const before = await captureText(page)
  const depth = await getUndoHistoryDepth(page)
  const style = page.getByRole('combobox', { name: 'Font style', exact: true })
  await style.selectOption('bold-italic')
  await expect
    .poll(async () => {
      const data = await readTypography(page)
      return [data.fontWeight, data.fontStyle]
    })
    .toEqual(['bold', 'italic'])
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  const after = await captureText(page)
  expect(after.hash).not.toBe(before.hash)
  await undo(page)
  await expect(style).toHaveValue('regular')
  expect((await captureText(page)).hash).toBe(before.hash)
  await redo(page)
  await expect(style).toHaveValue('bold-italic')
  expect((await captureText(page)).hash).toBe(after.hash)
  await style.selectOption('bold-italic')
  expect(await getUndoHistoryDepth(page)).toBe(depth + 1)
  await style.selectOption('regular')
  await expect
    .poll(async () => {
      const data = await readTypography(page)
      return [data.fontWeight, data.fontStyle]
    })
    .toEqual(['normal', 'normal'])
  expect(await getUndoHistoryDepth(page)).toBe(depth + 2)
  expect((await captureText(page)).hash).toBe(before.hash)
  await undo(page)
  await expect(style).toHaveValue('bold-italic')
  expect((await captureText(page)).hash).toBe(after.hash)
})
