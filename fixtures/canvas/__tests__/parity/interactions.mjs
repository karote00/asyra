import assert from 'node:assert/strict'
import { expect } from '@playwright/test'
import { drag, frame } from './pointer.mjs'

export async function layerAndMenuGestures(page) {
  const host = frame(page)
  const [a, b] = await page.evaluate(() =>
    [350, 455].map((x) => {
      const e = globalThis.editor
      const pos = e.common.element.getMousePosInWorkspace({ x, y: 220 })

      return e.drawRectangle({ ...pos, width: 45, height: 50 })
    })
  )

  const row = (id) => host.getByTestId('element-item-' + id)

  await row(a).click()
  await row(b).click({ modifiers: ['Shift'] })
  assert.deepEqual(
    (await page.evaluate(() => globalThis.editor.getSelection())).sort(),
    [a, b].sort()
  )
  const box = await page.locator('main iframe').boundingBox()

  await page.mouse.click(box.x + 370, box.y + 240, { button: 'right' })
  const menu = host.getByRole('menu', { name: 'Canvas commands' })

  await expect(menu).toBeVisible()
  const group = menu.getByRole('menuitem', { name: 'Group', exact: true })

  await group.focus()
  await page.keyboard.press('Enter')
  await expect(menu).toHaveCount(0)
  const parent = await page.evaluate(
    (id) => globalThis.editor.getLayers().elements[id].parentId,
    a
  )

  assert.equal(
    await page.evaluate(
      (id) => globalThis.editor.getLayers().elements[id].type,
      parent
    ),
    'group'
  )
  const disclosure = host.getByTestId('layers-group-toggle-' + parent)

  if (!(await row(a).isVisible())) {
    await disclosure.click()
  }

  await disclosure.click()
  await expect(row(a)).toHaveCount(0)
  await disclosure.click()
  await row(a).hover()
  for (const [suffix, property, value] of [
    ['lock', 'lock', true],
    ['visible', 'visible', false]
  ]) {
    await host.getByTestId('content-element-' + suffix + '-' + a).click()
    await expect
      .poll(() =>
        page.evaluate(
          ([id, key]) => globalThis.editor.getLayers().elements[id][key],
          [a, property]
        )
      )
      .toBe(value)
  }
}

export async function canvasInput(page) {
  const host = frame(page)

  await host.getByTestId('tool-select').click()
  const box = await page.locator('main iframe').boundingBox()

  const at = (x, y) => ({ x: box.x + x, y: box.y + y })

  await page.mouse.click(box.x + 400, box.y + 300)
  for (const [key, tool] of [
    ['r', 'rectangle'],
    ['o', 'oval'],
    ['t', 'text'],
    ['p', 'pen'],
    ['v', 'select']
  ]) {
    await page.keyboard.press(key)
    await expect
      .poll(() => page.evaluate(() => globalThis.editor.getTool()))
      .toBe(tool)
  }

  const ids = await page.evaluate(() =>
    [370, 440].map((x) => {
      const e = globalThis.editor
      const p = e.common.element.getMousePosInWorkspace({ x, y: 230 })

      return e.drawRectangle({ ...p, width: 30, height: 30 })
    })
  )

  await drag(page, at(340, 200), at(495, 290))
  assert.deepEqual(
    (await page.evaluate(() => globalThis.editor.getSelection())).sort(),
    ids.sort()
  )
  const before = await page.evaluate(() => globalThis.editor.getViewport())

  await page.mouse.wheel(0, 45)
  await expect
    .poll(() => page.evaluate(() => globalThis.editor.getViewport().position.y))
    .not.toBe(before.position.y)
  await page.keyboard.down('Control')
  try {
    await page.mouse.wheel(0, -65)
  } finally {
    await page.keyboard.up('Control')
  }

  await expect
    .poll(() => page.evaluate(() => globalThis.editor.getViewport().scale))
    .not.toBe(before.scale)
}

export async function inlineTextAndComposition(page) {
  const host = frame(page)
  const origin = await page.locator('main iframe').boundingBox()

  await host.getByTestId('tool-text').click()
  await drag(
    page,
    { x: origin.x + 370, y: origin.y + 240 },
    { x: origin.x + 495, y: origin.y + 292 }
  )
  const input = host.locator('textarea')

  await input.dispatchEvent('compositionstart')
  await input.fill('台灣')
  await input.press('Control+Enter')
  await expect(input).toBeFocused()
  assert.deepEqual(
    await page.evaluate(() => globalThis.editor.getLayers().ids),
    []
  )
  await input.dispatchEvent('compositionend', { data: '台灣' })
  await input.press('End')
  await input.press('Enter')
  await input.press('x')
  await input.press('Control+Enter')

  const read = () =>
    page.evaluate(() => {
      const e = globalThis.editor

      return e.getElementProperties(e.getLayers().ids[0], [
        'text',
        'textSizing'
      ])
    })

  await expect.poll(async () => (await read()).text).toBe('台灣\nx')
  assert.equal((await read()).textSizing, 'auto-height')
  await page.evaluate(() =>
    globalThis.editor.select(globalThis.editor.getLayers().ids)
  )
  await host.getByRole('button', { name: 'Edit text on Canvas' }).click()
  await input.fill('discard')
  await input.press('Escape')
  assert.equal((await read()).text, '台灣\nx')
}

export async function layerDraggingAndChildSelection(page) {
  const host = frame(page)
  const scene = await page.evaluate(() => {
    const e = globalThis.editor
    const ids = [350, 420, 495].map((x) =>
      e.drawRectangle({
        ...e.common.element.getMousePosInWorkspace({ x, y: 240 }),
        width: 28,
        height: 30
      })
    )

    e.select(ids.slice(0, 2))

    return { ids, parent: e.group() }
  })
  const [child, , third] = scene.ids

  const row = (id) => host.getByTestId('element-item-' + id)

  const target = await row(scene.parent).boundingBox()
  const source = await row(third).boundingBox()
  const start = {
    x: source.x + source.width / 2,
    y: source.y + source.height / 2
  }
  const end = {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2
  }

  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(end.x, end.y, { steps: 10 })
  await expect(row(scene.parent)).toHaveAttribute(
    'data-layer-drop-state',
    'inside'
  )
  await page.keyboard.press('Escape')
  await page.mouse.up()
  assert.notEqual(
    await page.evaluate(
      (id) => globalThis.editor.getLayers().elements[id].parentId,
      third
    ),
    scene.parent
  )
  await drag(page, start, end)
  await expect
    .poll(() =>
      page.evaluate(
        (id) => globalThis.editor.getLayers().elements[id].parentId,
        third
      )
    )
    .toBe(scene.parent)
  await row(scene.parent).click()
  const point = await page.locator('main iframe').boundingBox()

  await page.mouse.dblclick(point.x + 359, point.y + 250)
  await expect
    .poll(() => page.evaluate(() => globalThis.editor.getSelection()))
    .toEqual([child])
  const bounds = await page.evaluate(
    (id) => globalThis.editor.common.element.getElementPosition(id),
    child
  )

  await drag(
    page,
    { x: point.x + 359, y: point.y + 250 },
    { x: point.x + 382, y: point.y + 266 }
  )
  const after = await page.evaluate(
    (id) => globalThis.editor.common.element.getElementPosition(id),
    child
  )

  assert.ok(Math.hypot(after.x - bounds.x, after.y - bounds.y) > 10)
}

export async function hoverSelectionAndGroupShortcuts(page) {
  const host = frame(page)
  const box = await page.locator('main iframe').boundingBox()
  const [a, b] = await page.evaluate(() => {
    const e = globalThis.editor

    e.observe('hoveredElementId', (id) => {
      globalThis.hovered = id
    })

    return [330, 460].map((x) => {
      const p = e.common.element.getMousePosInWorkspace({ x, y: 230 })

      return e.drawRectangle({ ...p, width: 50, height: 55 })
    })
  })

  await host.getByTestId('tool-select').click()

  const xy = (x) => [box.x + x, box.y + 251]

  await page.mouse.move(...xy(350))
  await expect.poll(() => page.evaluate(() => globalThis.hovered)).toBe(a)
  await page.mouse.move(...xy(422))
  await expect.poll(() => page.evaluate(() => globalThis.hovered)).toBeNull()
  await page.mouse.click(...xy(350))
  await page.keyboard.down('Shift')
  try {
    await page.mouse.click(...xy(480))
  } finally {
    await page.keyboard.up('Shift')
  }

  const selection = () =>
    page.evaluate(() => globalThis.editor.getSelection().sort())

  await expect.poll(selection).toEqual([a, b].sort())
  const mod = await page.evaluate(() =>
    /mac/i.test(globalThis.navigator.platform) ? 'Meta' : 'Control'
  )

  await page.keyboard.press(mod + '+g')

  const parent = () =>
    page.evaluate(
      (id) => globalThis.editor.getLayers().elements[id].parentId,
      a
    )

  const group = (await selection())[0]

  await expect.poll(parent).toBe(group)
  await page.keyboard.press(mod + '+Shift+g')
  await expect.poll(parent).not.toBe(group)

  const viewport = () => page.evaluate(() => globalThis.editor.getViewport())

  const initial = await viewport()

  await page.mouse.wheel(0, 160)
  await expect.poll(viewport).not.toEqual(initial)
  const before = await viewport()

  await page.keyboard.press(mod + '+1')
  await expect.poll(viewport).not.toEqual(before)
}
