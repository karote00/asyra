import { expect, test } from '@playwright/test'
import { Vector3 } from 'three'
import { cameraPreset, fitCamera } from '../src/render-app/site-projection'
import { cameraDistance } from '../src/render-app/camera-navigation'

test('rounded drain mouth is visible through the real front camera', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await page.getByRole('button', { name: '收合編輯面板', exact: true }).click()
  await page.getByLabel('塑膠覆膜', { exact: true }).uncheck()
  await page.getByRole('button', { name: '收合圖層面板', exact: true }).click()
  await expect
    .poll(
      async () => (await page.getByTestId('scene').boundingBox())?.width ?? 0
    )
    .toBeGreaterThan(1300)
  await page.getByRole('button', { name: '端面', exact: true }).click()
  const scene = page.getByTestId('scene')
  const bounds = await scene.boundingBox()
  if (!bounds) throw new Error('Missing viewport')
  const camera = cameraPreset('front')
  const back = new Vector3(...camera.position)
    .sub(new Vector3(...camera.target))
    .normalize()
  const right = new Vector3(0, 1, 0).cross(back).normalize()
  const up = back.clone().cross(right)
  const offset = new Vector3(15.4, -0.075, 0).sub(new Vector3(...camera.target))
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
  await page.keyboard.down('Alt')
  await page.mouse.wheel(0, -10000)
  await page.keyboard.up('Alt')
  await expect(page.getByTestId('zoom-percent')).toHaveText('10000%')
  await page.screenshot({
    path: testInfo.outputPath('rounded-drain-mouth.png'),
    fullPage: true
  })
  await expect(
    page.getByRole('img', { name: '土壤與半圓水道圓角的等比例剖面' })
  ).toBeVisible()
})
