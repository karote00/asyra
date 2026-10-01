import { test } from '@playwright/test'
import { runRobotWorkspace } from './robot-cases'

test('robot workspace zh-TW at 1440px', async ({ page }, testInfo) => {
  test.setTimeout(45000)
  await runRobotWorkspace(page, testInfo, 1440, 'zh-TW')
})
