import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { usesCpuSoftwareRenderer } from './renderer-environment'

test('soil-width edits stay responsive in the fully planted scene', async ({
  page
}, testInfo) => {
  test.skip(
    usesCpuSoftwareRenderer,
    'The 250ms render-response budget is measured on the desktop GPU path; SwiftShader runs the functional interaction suite.'
  )
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  const input = page.getByLabel('第 1 項寬度', { exact: true })
  const timings: number[] = []
  for (const value of ['1.0', '1.1', '0.9']) {
    await input.fill(value)
    timings.push(
      await input.evaluate(async (element) => {
        const start = performance.now()
        element.blur()
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
        return performance.now() - start
      })
    )
    await expect(input).toHaveValue(String(Number(value)))
  }
  await writeFile(
    testInfo.outputPath('soil-edit-response.json'),
    JSON.stringify({ timingsMs: timings, viewport: [1440, 1100], plants: 5952 })
  )
  await testInfo.attach('soil-edit-response', {
    body: JSON.stringify({
      timingsMs: timings,
      viewport: [1440, 1100],
      plants: 5952
    }),
    contentType: 'application/json'
  })
  expect(Math.max(...timings)).toBeLessThan(250)
  await page.screenshot({
    path: testInfo.outputPath('soil-edit-response.png'),
    fullPage: true
  })
})
