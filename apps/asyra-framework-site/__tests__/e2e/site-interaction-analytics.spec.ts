import { expect, test, type Page } from '@playwright/test'
import {
  SITE_ACTIONS,
  SITE_EVENTS
} from '../../lib/site-interaction-analytics.mjs'

type RecordedEvent = [string, string, Record<string, unknown>]
const configured = process.env.GOOGLE_SERVICES_TEST_ENABLED === '1'

async function capture(page: Page) {
  const events: RecordedEvent[] = []
  await page.exposeFunction('recordSiteAnalytics', (entry: RecordedEvent) => {
    if (entry[0] === 'event') events.push(entry)
  })
  await page.addInitScript(() => {
    const target = window as typeof window & {
      dataLayer: unknown[]
      recordSiteAnalytics: (entry: unknown[]) => Promise<void>
    }
    const queue: unknown[] = []
    const push = queue.push.bind(queue)
    queue.push = (...items: unknown[]) => {
      for (const item of items) {
        const entry = Array.from(item as ArrayLike<unknown>)
        void target.recordSiteAnalytics(entry)
      }
      return push(...items)
    }
    target.dataLayer = queue
  })
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  )
  await page.route('https://*.google-analytics.com/**', (route) =>
    route.abort()
  )
  await page.route('https://*.analytics.google.com/**', (route) =>
    route.abort()
  )
  return events
}

test('enabled analytics records CTA and SPA navigation once without query strings or custom page views', async ({
  page
}) => {
  test.skip(!configured, 'Production-configured build required')
  const events = await capture(page)
  await page.goto('/?email=private@example.com')
  await expect(page.locator('#asyra-ga-init')).toBeAttached()
  await page
    .locator('.hero a[data-site-cta][href="/docs/start/custom-composition"]')
    .click()
  await expect(page).toHaveURL(/\/docs\/start\/custom-composition$/)
  await expect
    .poll(() => events.filter(([, name]) => name === SITE_EVENTS.cta).length)
    .toBe(1)
  expect(events.find(([, name]) => name === SITE_EVENTS.cta)?.[2]).toEqual({
    page_path: '/',
    cta_id: 'compose',
    link_area: 'hero'
  })
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Runtime Atlas' })
    .click()
  await expect(page).toHaveURL(/\/atlas$/)
  await expect
    .poll(
      () => events.filter(([, name]) => name === SITE_EVENTS.navigation).length
    )
    .toBe(1)
  expect(events.some(([, name]) => name === 'page_view')).toBe(false)
  expect(JSON.stringify(events)).not.toMatch(/email|private@example/)
})

test('documentation search records displayed results and selection without sending user input', async ({
  page
}) => {
  test.skip(!configured, 'Production-configured build required')
  const events = await capture(page)
  await page.goto('/docs')
  await expect(page.locator('#asyra-ga-init')).toBeAttached()
  await page.locator('.docs-search-trigger').click()
  const input = page.getByRole('searchbox')
  await input.fill('private@example.com')
  await expect
    .poll(() => events.filter(([, name]) => name === SITE_EVENTS.search).length)
    .toBe(1)
  expect(
    events.find(([, name]) => name === SITE_EVENTS.search)?.[2].result_count
  ).toBe(0)
  await input.fill('transaction')
  await expect(page.locator('.search-results a').first()).toBeVisible()
  await input.press('Enter')
  await expect
    .poll(() => events.filter(([, name]) => name === SITE_EVENTS.search).length)
    .toBe(2)
  await page.locator('.search-results a').first().click()
  await expect
    .poll(
      () =>
        events.filter(([, name]) => name === SITE_EVENTS.searchSelect).length
    )
    .toBe(1)
  expect(
    events.find(([, name]) => name === SITE_EVENTS.searchSelect)?.[2]
      .result_position
  ).toBe(1)
  expect(JSON.stringify(events)).not.toMatch(/private@example|search_term/)
})

test('mobile menu and Atlas emit their own intent events without interfering with controls', async ({
  page
}) => {
  test.skip(!configured, 'Production-configured build required')
  const events = await capture(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('#asyra-ga-init')).toBeAttached()
  await page
    .getByRole('button', { name: 'Open navigation', exact: true })
    .click()
  await expect(page.locator('.navigation-dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.navigation-dialog')).not.toBeVisible()
  await expect
    .poll(() => events.filter(([, name]) => name === SITE_EVENTS.ui).length)
    .toBe(2)
  expect(
    events
      .filter(([, name]) => name === SITE_EVENTS.ui)
      .map((entry) => entry[2].action)
  ).toEqual(['open', 'close'])

  await page.goto('/atlas')
  const step = page.locator(
    '[data-site-action="' + SITE_ACTIONS.atlasStep.id + '"]'
  )
  await expect(step).toBeEnabled()
  await step.click()
  await page
    .locator('[data-site-action="' + SITE_ACTIONS.atlasReset.id + '"]')
    .click()
  await page
    .locator('[data-site-action="' + SITE_ACTIONS.atlasSelect.id + '"]')
    .nth(1)
    .click()
  await expect
    .poll(() => events.filter(([, name]) => name === SITE_EVENTS.atlas).length)
    .toBe(3)
  expect(
    events
      .filter(([, name]) => name === SITE_EVENTS.atlas)
      .map((entry) => entry[2].action)
  ).toEqual(['step', 'reset', 'select_case'])
})

test('copy actions contain no snippet text, and returning through SPA navigation does not duplicate handlers', async ({
  page
}) => {
  test.skip(!configured, 'Production-configured build required')
  const events = await capture(page)
  await page.goto('/docs/start/custom-composition')
  const code = page.locator('pre code').first()
  await code.scrollIntoViewIfNeeded()
  await code.evaluate((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  })
  await page.keyboard.press('ControlOrMeta+c')
  await expect
    .poll(
      () => events.filter(([, name]) => name === SITE_EVENTS.codeCopy).length
    )
    .toBe(1)
  expect(events.find(([, name]) => name === SITE_EVENTS.codeCopy)?.[2]).toEqual(
    { page_path: '/docs/start/custom-composition' }
  )
  const navigation = page.getByRole('navigation', {
    name: 'Primary navigation'
  })
  await navigation.getByRole('link', { name: 'Runtime Atlas' }).click()
  await expect(page).toHaveURL(/\/atlas$/)
  await navigation.getByRole('link', { name: 'Docs', exact: true }).click()
  await expect(page).toHaveURL(/\/docs$/)
  await expect
    .poll(
      () => events.filter(([, name]) => name === SITE_EVENTS.navigation).length
    )
    .toBe(2)
})

test('unconfigured deployments have no interaction collector', async ({
  page
}) => {
  test.skip(configured, 'Disabled build required')
  const events = await capture(page)
  await page.goto('/docs')
  await page.locator('.docs-search-trigger').click()
  await page.getByRole('searchbox').fill('transaction')
  await page.getByRole('searchbox').press('Enter')
  await page.locator('.search-dialog .dialog-close-button').click()
  await expect(page.locator('.search-dialog')).not.toBeVisible()
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Runtime Atlas' })
    .click()
  await expect(page).toHaveURL(/\/atlas$/)
  await expect(page.locator('#asyra-ga-init')).toHaveCount(0)
  expect(events).toEqual([])
})
