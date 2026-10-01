import { test } from '@playwright/test'
import { runResponsiveLayout } from './locale-layout-test-helper'

test('en layout at 1440px covers panels and expanded references', async ({
  page
}, testInfo) => runResponsiveLayout(page, testInfo, 1440, 'en'))
