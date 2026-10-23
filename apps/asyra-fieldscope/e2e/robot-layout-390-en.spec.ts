import { test } from '@playwright/test'
import { runRobotWorkspace } from './robot-cases'

test('robot workspace en at 390px', async ({ page }, testInfo) => {
  test.setTimeout(45000)
  await runRobotWorkspace(page, testInfo, 390, 'en')
})
