/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { chromium } = require('@playwright/test')
const { startServer } = require('../../control-plane/server.cjs')

test(
  'the served workspace renders and operates architecture directly with React',
  { timeout: 30000 },
  async (t) => {
    const root = path.resolve(__dirname, '../../../..')
    const environmentFile = path.join(root, 'tools/flow-inspector/.env')
    const configured =
      process.env.FLOW_PROOF_URL ||
      fs
        .readFileSync(environmentFile, 'utf8')
        .split('\n')
        .find((line) => line.startsWith('FLOW_PROOF_URL='))
        ?.slice('FLOW_PROOF_URL='.length)
        .trim()
    assert.ok(configured, 'FLOW_PROOF_URL must identify the live review origin')
    const output = path.join(root, 'tmp/readability/react-browser')
    fs.mkdirSync(output, { recursive: true })
    const server = await startServer(root, { url: configured })
    t.after(() => server.close())
    const browser = await chromium.launch({
      headless: true,
      channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || 'chrome',
      env: { ...process.env, TMPDIR: output }
    })
    t.after(() => browser.close())
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 }
    })
    page.setDefaultTimeout(5000)
    const errors = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
      fs.writeFileSync(
        path.join(output, 'control-errors.json'),
        JSON.stringify(errors)
      )
    })
    await page.goto(server.origin + '/core-proof')
    await page.screenshot({ path: path.join(output, 'workspace-initial.png') })
    fs.writeFileSync(
      path.join(output, 'initial-errors.json'),
      JSON.stringify(errors)
    )
    await page.locator('[data-step-id]').first().waitFor()
    await page.locator('#test-result-controls').waitFor()

    assert.equal(await page.locator('iframe').count(), 0)
    assert.equal(
      await page.evaluate(() => typeof globalThis.FLOW_INSPECTOR_VIEW),
      'undefined'
    )
    assert.ok((await page.locator('[data-route-id]').count()) > 0)
    await page.getByRole('button', { name: 'Fit all', exact: true }).click()
    const viewport = page.getByRole('region', { name: 'Inspector flow' })
    assert.ok(Number(await viewport.getAttribute('data-zoom-scale')) > 0)
    await page.locator('[data-step-id]').nth(1).click()
    const selected = await page
      .locator('[data-step-id][aria-pressed="true"]')
      .getAttribute('data-step-id')
    await page.getByRole('searchbox').fill('core')
    assert.equal(
      await page
        .locator('[data-step-id][aria-pressed="true"]')
        .getAttribute('data-step-id'),
      selected
    )
    await page.screenshot({ path: path.join(output, 'workspace-wide.png') })
    await page.setViewportSize({ width: 800, height: 900 })
    const close = page.getByRole('button', { name: 'Close Inspector catalog' })

    if (await close.isVisible()) {
      await close.click()
    }

    await page.getByRole('button', { name: 'Hide details' }).click()
    await page.getByRole('button', { name: 'Fit all', exact: true }).click()
    await page.screenshot({ path: path.join(output, 'workspace-narrow.png') })
    await page.goto(server.origin + '/transaction-atomicity')
    await page.locator('[data-step-id="finalize-transaction-state"]').click()
    await page
      .locator('#proof-controls')
      .waitFor()
      .catch(async (error) => {
        fs.writeFileSync(
          path.join(output, 'control-errors.json'),
          JSON.stringify(errors)
        )
        await page.screenshot({
          path: path.join(output, 'control-failure.png')
        })
        throw error
      })
    await page.locator('#proof-controls > summary').click()
    await page.locator('#run-linked').waitFor()
    await page.goto(server.origin + '/extendable-preset')
    await page.getByRole('article', { name: 'Contract document' }).waitFor()
    assert.equal(await page.locator('iframe').count(), 0)
    assert.ok(
      await page
        .getByRole('heading', { name: 'productCases', exact: true })
        .isVisible()
    )
    assert.deepEqual(errors, [])
    fs.writeFileSync(
      path.join(output, 'review.json'),
      JSON.stringify(
        {
          origin: server.origin,
          route: '/core-proof',
          selected,
          pid: process.pid,
          screenshots: ['workspace-wide.png', 'workspace-narrow.png']
        },
        null,
        2
      ) + '\n'
    )
  }
)
