import assert from 'node:assert/strict'
import { expect } from '@playwright/test'
import { drag, frame, screenPoint } from './pointer.mjs'

async function dragMirroredHandle(page, key) {
  const id = await page.evaluate(() => {
    const e = globalThis.editor

    const from = (x, y) => e.common.element.getMousePosInWorkspace({ x, y })

    const id = e.createPath([from(350, 250), from(440, 250), from(520, 320)])
    const b = e.getPath(id).anchors[1].id

    e.setAnchorType(id, b, 'smooth')
    e.setHandleMode(id, b, 'mirror-angle-length')
    e.moveHandle(id, b, 'outHandle', from(469, 229))
    e.setTool('select')
    e.editPath(id)
    e.selectPathPoint(id, b)

    return id
  })
  const pointId = await page.evaluate(
    (id) => globalThis.editor.getPath(id).anchors[1].id,
    id
  )

  const read = () =>
    page.evaluate(
      ([id, p]) =>
        globalThis.editor.common.element.getVectorAnchorPointById(id, p).point,
      [id, pointId]
    )

  const anchor = await read()
  const handle = await screenPoint(page, anchor[key])
  const target = { x: handle.x + 12, y: handle.y + 17 }

  await page.mouse.click(handle.x, handle.y)
  await expect
    .poll(() =>
      page.evaluate(() =>
        globalThis.editor.common.systemContext.getSelectedVectorPoint()
      )
    )
    .toMatchObject({ elementId: id, pointId, target: key })
  await drag(page, handle, target)
  const moved = await screenPoint(page, (await read())[key])
  const settled = await read()

  assert.ok(
    Math.hypot(settled.x - anchor.x, settled.y - anchor.y) < 0.01,
    key +
      ' drag displaced the selected anchor: ' +
      JSON.stringify({
        from: [anchor.x, anchor.y],
        to: [settled.x, settled.y]
      })
  )
  assert.ok(
    Math.hypot(moved.x - target.x, moved.y - target.y) < 3,
    key + ' endpoint missed the pointer: ' + JSON.stringify({ target, moved })
  )
}

export async function mirroredOutgoingHandle(page) {
  await dragMirroredHandle(page, 'outHandle')
}

export async function mirroredIncomingHandle(page) {
  await dragMirroredHandle(page, 'inHandle')
}

export async function nativePenHandle(page) {
  const host = frame(page)
  const origin = await page.locator('main iframe').boundingBox()

  const pos = (x, y) => ({ x: x + origin.x, y: y + origin.y })

  await host.getByTestId('tool-pen').click()
  await page.mouse.click(origin.x + 340, origin.y + 240)
  await drag(page, pos(425, 310), pos(478, 270))
  await page.keyboard.press('v')

  const path = () =>
    page.evaluate(() => {
      const e = globalThis.editor,
        id = e.common.systemContext.getPathEditingVectorId()
      const ref = e.common.systemContext.getSelectedVectorPoint()
      const point = e.common.element.getVectorAnchorPointById(
        id,
        ref.pointId
      ).point

      return { ref, point }
    })

  const before = await path()
  const start = pos(478, 270)

  await page.mouse.click(start.x, start.y)
  await expect.poll(async () => (await path()).ref.target).toBe('outHandle')
  await drag(page, start, { x: start.x + 25, y: start.y - 19 })
  const after = await path()

  assert.equal(after.ref.pointId, before.ref.pointId)
  assert.equal(after.ref.target, 'outHandle')
  assert.ok(
    Math.hypot(after.point.x - before.point.x, after.point.y - before.point.y) <
      0.01,
    'anchor remains in place'
  )
  const p = await screenPoint(page, after.point.outHandle)

  assert.ok(
    Math.hypot(p.x - start.x - 25, p.y - start.y + 19) < 2,
    'handle follows pointer'
  )
}

export async function penSegmentAndInspector(page) {
  const host = frame(page)
  const origin = await page.locator('main iframe').boundingBox()

  const click = (x, y) => page.mouse.click(origin.x + x, origin.y + y)

  await host.getByTestId('tool-pen').click()
  await click(330, 230)
  await click(470, 300)
  const id = await page.evaluate(() =>
    globalThis.editor.common.systemContext.getPathEditingVectorId()
  )

  const path = () => page.evaluate((id) => globalThis.editor.getPath(id), id)

  const original = (await path()).anchors.map((p) => p.id)

  assert.equal(original.length, 2)
  await page.keyboard.press('Escape')
  await click(400, 265)
  await expect.poll(async () => (await path()).anchors.length).toBe(3)
  const pointId = (await path()).anchors.find(
    (p) => !original.includes(p.id)
  ).id

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          globalThis.editor.common.systemContext.getSelectedVectorPoint()
            ?.pointId
      )
    )
    .toBe(pointId)

  const point = async () => (await path()).anchors.find((p) => p.id === pointId)

  for (const [testId, field, value] of [
    ['prop-point-type-smooth', 'type', 'smooth'],
    ['prop-handle-mode-mirror-angle', 'handleMode', 'mirror-angle'],
    ['prop-point-type-sharp', 'type', 'sharp']
  ]) {
    await host.getByTestId(testId).click()
    await expect.poll(async () => (await point())[field]).toBe(value)
  }

  await click(400, 265)
  await page.keyboard.press('Delete')
  await expect.poll(async () => (await path()).anchors.length).toBe(2)
}
