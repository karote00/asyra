export const frame = (page) => page.frameLocator('main iframe')

export async function drag(page, start, end) {
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(end.x, end.y, { steps: 12 })
  await page.mouse.up()
}

export async function screenPoint(page, world) {
  const origin = await page.locator('main iframe').boundingBox()
  const p = await page.evaluate(
    (p) => globalThis.editor.common.viewport.getCanvasPositionFromWorkspace(p),
    world
  )

  return { x: p.x + origin.x, y: p.y + origin.y }
}
