import { expect, test } from '@playwright/test'
import { Vector3 } from 'three'
import { cameraPreset, fitCamera } from '../src/render-app/site-projection'
import { cameraDistance } from '../src/render-app/camera-navigation'

for (const [species, rootX, height, stage] of [
  ['cucumber', 1.05, 0.8, 'harvestable'],
  ['cucumber', 1.05, 2.25, 'flowering'],
  ['tomato', 15.05, 0.8, 'ripening'],
  ['tomato', 15.05, 2.0, 'young']
] as const) {
  test(`${species} ${stage} foliage and fruit are visible in the real planted greenhouse`, async ({
    page
  }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await expect(page.getByText('空間模型已就緒')).toBeVisible()
    await page
      .getByRole('button', { name: '收合編輯面板', exact: true })
      .click()
    await page.getByLabel('塑膠覆膜', { exact: true }).uncheck()
    const layer = page.getByLabel(
      species === 'cucumber' ? '1914 小胡瓜' : '玉女小蕃茄',
      { exact: true }
    )
    await expect(layer).toBeChecked()
    const canvas = page.locator('canvas')
    const visible = await canvas.screenshot()
    await layer.uncheck()
    expect((await canvas.screenshot()).equals(visible)).toBe(false)
    await layer.check()
    await page
      .getByRole('button', { name: '收合圖層面板', exact: true })
      .click()
    await expect
      .poll(
        async () => (await page.getByTestId('scene').boundingBox())?.width ?? 0
      )
      .toBeGreaterThan(1300)
    await page.getByRole('button', { name: '走道內部', exact: true }).click()
    const bounds = await page.getByTestId('scene').boundingBox()
    if (!bounds) throw new Error('Missing viewport')
    const camera = cameraPreset('inside')
    const back = new Vector3(...camera.position)
      .sub(new Vector3(...camera.target))
      .normalize()
    const right = new Vector3(0, 1, 0).cross(back).normalize(),
      up = back.clone().cross(right)
    const offset = new Vector3(rootX, height, 40).sub(
      new Vector3(...camera.target)
    )
    const scale =
      (2 *
        cameraDistance(camera) *
        Math.tan(
          (fitCamera(camera, bounds.width / bounds.height).fov * Math.PI) / 360
        )) /
      bounds.height
    const x = bounds.x + bounds.width / 2,
      y = bounds.y + bounds.height / 2
    await page.mouse.move(x, y)
    await page.keyboard.down('Shift')
    await page.mouse.down()
    await page.mouse.move(
      x - offset.dot(right) / scale,
      y + offset.dot(up) / scale,
      { steps: 5 }
    )
    await page.mouse.up()
    await page.keyboard.up('Shift')
    await page.mouse.move(x, y)
    await page.mouse.wheel(0, -Math.log(20) * 1000)
    await expect(page.getByTestId('zoom-percent')).toHaveText('2000%')
    await page.screenshot({
      path: testInfo.outputPath(`${species}-foliage.png`),
      fullPage: true
    })
    await page.mouse.wheel(0, -Math.log(5) * 1000)
    await expect(page.getByTestId('zoom-percent')).toHaveText('10000%')
    await page.screenshot({
      path: testInfo.outputPath(`${species}-detail.png`),
      fullPage: true
    })
    expect(errors).toEqual([])
  })
}
