import { test } from '@playwright/test'
import { runResponsiveLayout } from './locale-layout-test-helper'

test('zh-TW layout at 768px covers panels and expanded references', async ({
  page
}, testInfo) => runResponsiveLayout(page, testInfo, 768, 'zh-TW'))
