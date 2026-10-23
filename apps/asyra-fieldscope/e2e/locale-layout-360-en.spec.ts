import { test } from '@playwright/test'
import { runResponsiveLayout } from './locale-layout-test-helper'

test('en layout at 360px covers panels and expanded references', async ({
  page
}, testInfo) => runResponsiveLayout(page, testInfo, 360, 'en'))
