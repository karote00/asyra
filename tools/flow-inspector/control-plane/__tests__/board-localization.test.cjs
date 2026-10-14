/* global fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { chromium, expect } = require('@playwright/test')
const { localizationFixture } = require('./localization-runtime-fixture.cjs')
const { startServer } = require('../server.cjs')

function assertAppFailures(fault) {
  assert.equal(fault.result.code, 1, fault.result.output)
  assert.equal(fault.record.cases.length, 2, fault.result.output)
  for (const item of fault.record.cases) {
    assert.equal(item.status, 'failed', fault.result.output)
    assert.equal(item.resolution, 'mapped', JSON.stringify(fault.record.issues))
    assert.ok(item.failures.length > 0)
    assert.equal(item.locations[0].stepId, 'select-history-replay')
  }
}

async function openBoard(t, fixture) {
  const temporary = path.join(fixture.directory, 'browser')
  fs.mkdirSync(temporary)
  const previous = process.env.TMPDIR
  process.env.TMPDIR = process.env.RUNNER_TEMP || temporary
  let browser, server
  t.after(async () => {
    await browser?.close()
    await server?.close()
    fixture.restore()
    if (previous === undefined) delete process.env.TMPDIR
    else process.env.TMPDIR = previous
  })
  server = await startServer(fixture.repository, {
    url: process.env.FLOW_PROOF_URL,
    serviceOptions: {
      directory: path.join(fixture.repository, 'tmp/proof-runs')
    }
  })
  if (process.platform === 'linux')
    assert.ok(
      Buffer.byteLength(
        path.join(
          process.env.TMPDIR,
          'com.google.Chrome.XXXXXX/SingletonSocket'
        )
      ) < 108,
      'Chrome socket path exceeds the Linux limit'
    )
  // The proof store stays within its owning repository.
  browser = await chromium.launch({
    channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || 'chrome',
    downloadsPath: temporary
  })
  const page = await browser.newPage({
    viewport: { width: 1800, height: 1200 }
  })
  return { page, server }
}

test(
  'real failed test selects the App owner and exposes matching machine evidence, history and recovery',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    fixture.mutate('app')
    const fault = await fixture.run('app')
    assertAppFailures(fault)
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(server.origin + '/history-shortcut')
    const frame = page.frameLocator('iframe')
    await expect(frame.locator('#test-result-failures button')).toHaveCount(2)
    await frame.locator('#test-result-failures button').first().click()
    await expect(
      frame.locator('[data-step-id="select-history-replay"].is-selected')
    ).toHaveCount(1)
    await expect(frame.locator('#test-result-detail')).toContainText(
      'apps/asyra-design/src/features/undo-redo/index.ts'
    )
    const machine = await (
      await fetch(server.origin + '/api/test-results/' + fault.record.id)
    ).json()
    await expect(frame.locator('#test-result-detail')).toContainText(
      machine.cases[0].failures[0]
    )
    await expect(frame.locator('.observation-failed')).toHaveCount(1)
    await page.screenshot({
      path: path.join(fixture.directory, 'failure-desktop.png'),
      fullPage: true
    })
    await page.setViewportSize({ width: 850, height: 1100 })
    await page.getByRole('button', { name: 'Close Inspector catalog' }).click()
    await frame.locator('#test-result-controls').scrollIntoViewIfNeeded()
    await expect(frame.locator('#test-result-controls')).toBeVisible()
    await expect(frame.locator('#test-result-detail')).toContainText(
      'Original failure:'
    )
    await page.screenshot({
      path: path.join(fixture.directory, 'failure-narrow.png'),
      fullPage: true
    })
    fixture.restore()
    const recovered = await fixture.run('app')
    assert.equal(recovered.result.code, 0)
    await expect(frame.locator('#test-result-failures button')).toHaveCount(0, {
      timeout: 10000
    })
    await expect(frame.locator('.observation-failed')).toHaveCount(0)
    await expect(frame.locator('#test-result-detail')).toBeEmpty()
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    await expect(frame.locator('#test-result-failures button')).toHaveCount(2)
    assert.deepEqual(errors, [])
    t.diagnostic('Visual evidence: ' + fixture.directory)
  }
)

test(
  'a delayed history response cannot replace the latest selection',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    fixture.mutate('app')
    const fault = await fixture.run('app')
    assertAppFailures(fault)
    fixture.restore()
    const recovered = await fixture.run('app')
    assert.equal(recovered.result.code, 0, recovered.result.output)
    let delayed
    const received = new Promise((resolve) => {
      delayed = resolve
    })
    let release
    const held = new Promise((resolve) => {
      release = resolve
    })
    await page.route(
      '**/api/test-results/' + fault.record.id,
      async (route) => {
        delayed()
        await held
        await route.continue()
      }
    )
    t.after(() => release())
    await page.goto(server.origin + '/history-shortcut')
    const frame = page.frameLocator('iframe')
    await expect(frame.locator('#test-result-history option')).toHaveCount(3)
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    await received
    await frame.locator('#test-result-history').selectOption('')
    const response = page.waitForResponse((r) =>
      r.url().endsWith('/api/test-results/' + fault.record.id)
    )
    release()
    await response
    await expect(frame.locator('#test-result-history')).toHaveValue('')
    // Wait for the body and UI completion, not merely the response headers.
    await page.waitForTimeout(200)
    await expect(frame.locator('#test-result-failures button')).toHaveCount(0)
    await expect(frame.locator('.observation-failed')).toHaveCount(0)
    await page.unroute('**/api/test-results/' + fault.record.id)
    await page.reload()
    await expect(frame.locator('#test-result-history option')).toHaveCount(3)
    let requests = 0
    await page.route('**/api/test-results/' + fault.record.id, (route) => {
      if (++requests === 1)
        return route.fulfill({ status: 503, body: 'temporary outage' })
      return route.continue()
    })
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    await expect(frame.locator('#test-result-failures button')).toHaveCount(2, {
      timeout: 10000
    })
    assert.ok(requests >= 2)
  }
)

test(
  'historical failure links select their retained scope and retry a transient read',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    fixture.mutate('app')
    const fault = await fixture.run('app')
    assertAppFailures(fault)
    fixture.restore()
    const recovered = await fixture.run('app')
    assert.equal(recovered.result.code, 0, recovered.result.output)
    await page.goto(server.origin + '/transaction-atomicity')
    const frame = page.frameLocator('iframe')
    await expect(frame.locator('#test-result-history option')).toHaveCount(3)
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    const crossTarget = frame
      .locator('#test-result-failures a')
      .filter({ hasText: 'Open Select and await history replay' })
      .first()
    await expect(crossTarget).toBeVisible()
    const href = await crossTarget.getAttribute('href')
    let reads = 0
    await page.route(
      '**/api/test-results/' + fault.record.id,
      async (route) => {
        reads++
        if (reads === 1)
          return route.fulfill({ status: 503, body: 'temporary outage' })
        return route.continue()
      }
    )
    await page.goto(server.origin + href)
    await expect(frame.locator('#test-result-detail')).toContainText(
      fault.record.cases[0].testName,
      { timeout: 10000 }
    )
    await expect(frame.locator('#test-result-history')).toHaveValue(
      fault.record.id
    )
    await expect(frame.locator('#test-result-failures button')).toHaveCount(2)
    await expect(frame.locator('.observation-failed')).toHaveCount(1)
    assert.ok(reads >= 2)
    await frame.locator('#test-result-history').selectOption('')
    await expect(frame.locator('#test-result-detail')).toBeEmpty()
    await expect(frame.locator('#test-result-failures button')).toHaveCount(0)
  }
)
