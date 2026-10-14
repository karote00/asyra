/* global fetch */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { chromium, expect } = require('@playwright/test')
const { localizationFixture } = require('./localization-runtime-fixture.cjs')
const { startServer } = require('../server.cjs')

test(
  'real failed test selects the App owner and exposes matching machine evidence, history and recovery',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    const temporary = path.join(fixture.directory, 'browser')
    fs.mkdirSync(temporary)
    const previous = process.env.TMPDIR
    process.env.TMPDIR = temporary
    let browser, server
    t.after(async () => {
      await browser?.close()
      await server?.close()
      fixture.restore()
      if (previous === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previous
    })
    fixture.mutate('app')
    const fault = await fixture.run('app')
    assert.equal(fault.result.code, 1)
    server = await startServer(fixture.repository, {
      url: process.env.FLOW_PROOF_URL,
      serviceOptions: {
        directory: path.join(fixture.repository, 'tmp/proof-runs')
      }
    })
    // The proof store stays within its owning repository.
    browser = await chromium.launch({
      channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || 'chrome',
      downloadsPath: temporary
    })
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1200 }
    })
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
