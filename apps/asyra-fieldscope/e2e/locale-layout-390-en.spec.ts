import { test } from '@playwright/test'
import { runResponsiveLayout } from './locale-layout-test-helper'

test('en layout at 390px covers panels and expanded references', async ({
  page
}, testInfo) => runResponsiveLayout(page, testInfo, 390, 'en'))
