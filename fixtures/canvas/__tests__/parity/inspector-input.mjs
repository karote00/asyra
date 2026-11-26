import assert from 'node:assert/strict'
import { expect } from '@playwright/test'
import { drag, frame } from './pointer.mjs'

export async function typographyInspector(page) {
  const host = frame(page)
  const id = await page.evaluate(() => {
    const e = globalThis.editor
    const id = e.createText(
      'Original',
      { x: 100, y: 60, width: 150, height: 50 },
      'fixed'
    )

    e.select([id])

    return id
  })

  for (const [label, key, value] of [
    ['Font size', 'fontSize', 32],
    ['Line height', 'lineHeight', 42],
    ['Letter spacing', 'letterSpacing', 3]
  ]) {
    const input = host
      .locator('[data-inspector-section="typography"]')
      .locator('[data-inspector-field="' + key + '"]')

    await expect(input).toHaveAccessibleName(label)

    await input.fill(String(value))
    await input.press('Tab')
    await expect
      .poll(() =>
        page.evaluate(
          ([id, key]) => globalThis.editor.getElementProperties(id, [key])[key],
          [id, key]
        )
      )
      .toBe(value)
  }

  await host.getByRole('combobox', { name: 'Font style' }).selectOption('bold')
  await host.locator('[data-text-alignment="right"]').click()
  const text = await page.evaluate(
    (id) =>
      globalThis.editor.getElementProperties(id, ['fontWeight', 'textAlign']),
    id
  )

  assert.equal(text.fontWeight, 'bold')
  assert.equal(text.textAlign, 'right')
}

export async function gradientGesture(page) {
  const id = await page.evaluate(() => {
    const e = globalThis.editor
    const origin = e.common.element.getMousePosInWorkspace({ x: 350, y: 220 })
    const id = e.drawRectangle({ ...origin, width: 140, height: 120 })
    const fill = e.addFill(id)

    e.updateFill(id, fill, {
      kind: 'gradient',
      gradient: {
        gradientType: 'linear',
        gradientStops: [
          { position: 0, color: '#112233', opacity: 1 },
          { position: 1, color: '#ddeeff', opacity: 1 }
        ],
        gradientHandles: [
          { x: 0.2, y: 0.2 },
          { x: 0.8, y: 0.8 }
        ]
      }
    })
    e.select([id])
    e.setActiveGradient(id, fill)

    return [id, fill]
  })

  const read = () =>
    page.evaluate(
      ([id, fill]) => globalThis.editor.getGradientHandles(id, fill),
      id
    )

  const box = await page.locator('main iframe').boundingBox()

  for (const index of [0, 1]) {
    const from = (await read())[index]
    const p = { x: from.x + box.x, y: from.y + box.y }

    await drag(page, p, { x: p.x + 15, y: p.y - 13 })
    await expect
      .poll(async () => Math.abs((await read())[index].x - from.x))
      .toBeGreaterThan(8)
  }
}

export async function propertyControls(page) {
  const host = frame(page)
  const id = await page.evaluate(() => {
    const e = globalThis.editor
    const id = e.drawRectangle({ x: 50, y: 40, width: 75, height: 80 })

    e.select([id])

    return id
  })

  for (const [key, value] of [
    ['x', 71],
    ['y', 82],
    ['height', 95],
    ['rotation', 30]
  ]) {
    const input = host.getByTestId('prop-' + key)

    await input.fill(String(value))
    await input.press('Enter')
    await expect
      .poll(() =>
        page.evaluate(
          ([id, key]) => globalThis.editor.getElementProperties(id, [key])[key],
          [id, key]
        )
      )
      .toBe(value)
  }

  await host.getByTestId('prop-stroke-add').click()
  // The app currently hides its advanced stroke controls. The public SDK can edit them.
  for (const key of ['position', 'cap', 'join', 'style', 'width']) {
    await expect(host.getByTestId('prop-stroke-' + key + '-0')).toBeHidden()
  }

  await page.evaluate((id) => {
    const e = globalThis.editor
    const stroke = e.getElementProperties(id, ['strokes']).strokes[0]

    e.updateStroke(id, stroke.id, {
      position: 'outside',
      capType: 'round',
      joinType: 'miter',
      miterAngle: 6,
      style: 'dashed',
      width: 6,
      dash: 8,
      gap: 3
    })
  }, id)
  const stroke = await page.evaluate(
    (id) => globalThis.editor.getElementProperties(id, ['strokes']).strokes[0],
    id
  )

  assert.equal(stroke.position, 'outside')
  assert.equal(stroke.capType, 'round')
  assert.equal(stroke.miterAngle, 6)
  assert.equal(stroke.width, 6)
  assert.equal(stroke.gap, 3)
  assert.equal(stroke.dash, 8)
  assert.equal(stroke.style, 'dashed')
  assert.equal(stroke.joinType, 'miter')
  await host.getByTestId('prop-stroke-visible-0').click()
  assert.equal(
    await page.evaluate(
      (id) =>
        globalThis.editor.getElementProperties(id, ['strokes']).strokes[0].fill
          .visible,
      id
    ),
    false
  )
  await host.getByTestId('prop-stroke-remove-0').click()
  assert.deepEqual(
    await page.evaluate(
      (id) => globalThis.editor.getElementProperties(id, ['strokes']).strokes,
      id
    ),
    []
  )
}

export async function gradientStopGesture(page) {
  const origin = await page.locator('main iframe').boundingBox()
  const data = await page.evaluate(() => {
    const e = globalThis.editor
    const xy = e.common.element.getMousePosInWorkspace({ x: 340, y: 230 })
    const id = e.drawRectangle({ ...xy, width: 180, height: 120 })
    const fill = e.addFill(id)

    e.updateFill(id, fill, {
      kind: 'gradient',
      gradient: {
        gradientType: 'linear',
        gradientStops: [0, 0.5, 1].map((position) => ({
          position,
          color: '#557799',
          opacity: 1
        })),
        gradientHandles: [
          { x: 0, y: 0.5 },
          { x: 1, y: 0.5 }
        ]
      }
    })
    e.select([id])
    e.setActiveGradient(id, fill)

    return { id, fill, handles: e.getGradientHandles(id, fill) }
  })
  const [a, b] = data.handles
  const start = { x: origin.x + (a.x + b.x) / 2, y: origin.y + a.y + 8 }

  await drag(page, start, { x: start.x + 28, y: start.y })
  await expect
    .poll(() =>
      page.evaluate(
        ({ id, fill }) =>
          globalThis.editor.common.fills.getFillById(id, fill).gradient
            .gradientStops[1].position,
        data
      )
    )
    .toBeGreaterThan(0.55)
}

export async function fillInspector(page) {
  const host = frame(page)
  const id = await page.evaluate(() => {
    const e = globalThis.editor
    const id = e.drawRectangle({ x: 100, y: 80, width: 110, height: 85 })

    e.select([id])

    return id
  })

  const fill = () =>
    page.evaluate(
      (id) => globalThis.editor.getElementProperties(id, ['fills']).fills[0],
      id
    )

  await host.getByTestId('prop-fill-color-picker-0-trigger').click()
  const color = host.getByTestId('prop-fill-color-picker-0-hex')

  await color.fill('ee2266')
  await color.press('Enter')
  await expect.poll(async () => (await fill()).color).toBe('#ee2266')
  await host.getByTestId('prop-fill-mode-gradient-0').click()
  const gradientType = host.getByTestId('prop-fill-gradient-type-0')

  for (const type of ['radial', 'angular', 'diamond', 'linear']) {
    await gradientType.selectOption(type)
    await expect
      .poll(async () => (await fill()).gradient.gradientType)
      .toBe(type)
  }

  await host
    .getByTestId('prop-fill-gradient-stop-color-picker-0-1-trigger')
    .click()
  const stop = host.getByTestId('prop-fill-gradient-stop-color-picker-0-1-hex')

  await stop.fill('00ee77')
  await stop.press('Enter')
  await expect
    .poll(async () => (await fill()).gradient.gradientStops[1].color)
    .toBe('#00ee77')
  const strip = host.getByTestId('prop-fill-gradient-strip-0')
  const bounds = await strip.boundingBox()

  await strip.click({ position: { x: Math.round(bounds.width * 0.4), y: 4 } })
  await expect
    .poll(async () => (await fill()).gradient.gradientStops.length)
    .toBe(3)

  const stops = async () => (await fill()).gradient.gradientStops

  const lastColor = (await stops()).at(-1).color

  await host.getByTestId('prop-fill-gradient-flip-0').click()
  await expect.poll(async () => (await stops())[0].color).toBe(lastColor)
  await host.getByTestId('prop-fill-gradient-stop-remove-0-1').click()
  await expect.poll(async () => (await stops()).length).toBe(2)
}
