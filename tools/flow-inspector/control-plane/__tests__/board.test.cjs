/* global document, window, Element, MutationObserver, WheelEvent, URL */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { chromium, expect } = require('@playwright/test')
const { startServer } = require('../server.cjs')

test(
  'the original canvas retains geometry and controls while card verification fails, recovers, and restores history',
  { timeout: 90000 },
  async () => {
    const root = path.resolve(__dirname, '../../../..')
    const parent = path.join(root, 'tmp/flow-inspector/visual-review')
    fs.mkdirSync(parent, { recursive: true })
    const artifacts = fs.mkdtempSync(path.join(parent, 'review-'))
    const temporary = path.join(artifacts, 'browser-tmp')
    fs.mkdirSync(temporary)
    const previousTemporary = process.env.TMPDIR
    process.env.TMPDIR = temporary
    const server = await startServer(root, {
      serviceOptions: { directory: path.join(artifacts, 'runs') }
    })
    let browser
    const screenshots = []
    try {
      browser = await chromium.launch({
        channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || undefined,
        downloadsPath: temporary
      })
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1100 }
      })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.addInitScript(() => {
        window.cardReads = 0
        const original = Element.prototype.querySelectorAll
        Element.prototype.querySelectorAll = function (selector) {
          if (this.id === 'flow' && selector === '.step-card')
            window.cardReads++
          return original.call(this, selector)
        }
      })
      await page.goto(server.origin)
      await expect(page.locator('iframe[title]')).toHaveCount(1)
      const canvas = page.frameLocator('iframe')
      await expect(canvas.locator('.step-card')).toHaveCount(7)
      await expect(canvas.locator('[data-route-id]')).toHaveCount(10)
      await expect(canvas.locator('#proof-controls')).toBeVisible()
      await canvas
        .getByText('Flow verification', { exact: false })
        .first()
        .click()
      await canvas
        .getByText('Captured source and recent attempts', { exact: true })
        .click()
      await expect(canvas.locator('.proof-badge')).toHaveCount(3)
      await expect(
        canvas.locator('.proof-badge[data-status="unknown"]')
      ).toHaveCount(3)
      await expect(
        canvas.locator('.step-card [role="button"], .step-card button')
      ).toHaveCount(0)
      const owner = canvas.locator(
        '[data-step-id="finalize-transaction-state"]'
      )
      await owner.click()
      await expect(canvas.locator('.detail-heading h2')).toHaveText(
        'Finalize transaction state'
      )
      const originalCard = await owner.elementHandle()
      const geometry = await canvas.locator('.step-card').evaluateAll((nodes) =>
        nodes.map((node) => ({
          id: node.dataset.stepId,
          left: node.style.left,
          top: node.style.top,
          width: node.offsetWidth,
          height: node.offsetHeight
        }))
      )
      const viewport = canvas.locator('.flow-viewport')
      await viewport.evaluate((node) => {
        node.dispatchEvent(
          new WheelEvent('wheel', {
            deltaY: -100,
            ctrlKey: true,
            bubbles: true,
            cancelable: true
          })
        )
        node.scrollLeft = 65
        node.scrollTop = 45
        window.graphChanges = 0
        new MutationObserver((records) => {
          window.graphChanges += records.length
        }).observe(document.getElementById('flow'), { childList: true })
      })
      const view = await viewport.evaluate((node) => ({
        zoom: node.dataset.zoomScale,
        left: node.scrollLeft,
        top: node.scrollTop
      }))
      const reads = await viewport.evaluate(() => window.cardReads)
      const capture = async (name, locator) => {
        const file = path.join(artifacts, name + '.png')
        if (locator) await locator.screenshot({ path: file })
        else await page.screenshot({ path: file, fullPage: true })
        screenshots.push({
          file,
          url: page.url(),
          viewport: page.viewportSize(),
          attempt: await canvas.locator('#attempt-id').textContent(),
          digest: await canvas.locator('#source-digest').textContent()
        })
      }
      const run = async (
        scenario,
        status,
        button = canvas.locator('#run-all')
      ) => {
        const previous = await canvas.locator('#attempt-id').textContent()
        await canvas.locator('#scenario').selectOption(scenario)
        await button.click()
        await expect(canvas.locator('#attempt-id')).not.toHaveText(previous)
        await expect(canvas.locator('#run-state')).toHaveText(
          'Ready to verify',
          { timeout: 20000 }
        )
        await expect(canvas.locator('#overall')).toHaveAttribute(
          'data-status',
          status
        )
        return canvas.locator('#attempt-id').textContent()
      }
      const baseline = await run('baseline', 'passed')
      await expect(canvas.locator('#checks')).toHaveText('6 / 6')
      await expect(
        canvas.locator('.proof-badge[data-status="passed"]')
      ).toHaveCount(3)
      const baselineDigest = await canvas
        .locator('#source-digest')
        .textContent()
      assert.match(baselineDigest, /^[a-f0-9]{64}$/)
      assert.deepEqual(
        await viewport.evaluate((node) => ({
          zoom: node.dataset.zoomScale,
          left: node.scrollLeft,
          top: node.scrollTop
        })),
        view
      )
      const negative = await run('inverse-regression', 'failed')
      await expect(
        canvas.locator('.proof-badge[data-status="passed"]')
      ).toHaveCount(3)
      await canvas.locator('#proof-flow').selectOption('immediate-cancellation')
      await expect(
        canvas.locator('.proof-badge[data-status="failed"]')
      ).toHaveCount(2)
      await expect(canvas.locator('#result-context')).toContainText(
        'NEGATIVE DEMONSTRATION'
      )
      await expect(canvas.locator('#proof-failures')).toContainText(
        'cancel.outcome - failed'
      )
      await expect(canvas.locator('#proof-failures')).toContainText(
        'AssertionError'
      )
      assert.deepEqual(
        await canvas.locator('.step-card').evaluateAll((nodes) =>
          nodes.map((node) => ({
            id: node.dataset.stepId,
            left: node.style.left,
            top: node.style.top,
            width: node.offsetWidth,
            height: node.offsetHeight
          }))
        ),
        geometry
      )
      // The normal polling caller must neither rebuild nor re-index the graph.
      assert.equal(await viewport.evaluate(() => window.cardReads), reads)
      assert.equal(await viewport.evaluate(() => window.graphChanges), 0)
      assert.equal(
        await originalCard.evaluate(
          (node) =>
            node ===
            document.querySelector(
              '[data-step-id="finalize-transaction-state"]'
            )
        ),
        true
      )
      const recovery = await run('baseline', 'passed')
      await expect(canvas.locator('#source-digest')).toHaveText(baselineDigest)
      await canvas
        .getByRole('button', { name: /Regression demo - failed/ })
        .click()
      await expect(canvas.locator('#attempt-id')).toHaveText(negative)
      await expect(
        canvas.locator('.proof-badge[data-status="failed"]')
      ).toHaveCount(2)
      await canvas.locator('[data-reset-zoom]').click()
      await capture('canvas-negative')
      // Inspect the complete original graph at 100%, using a large viewport
      // rather than shrinking cards or capturing clipped offscreen content.
      await page.setViewportSize({ width: 2880, height: 1600 })
      await viewport.evaluate((node) => node.scrollTo(0, 0))
      await capture('canvas-negative-flow', canvas.locator('#flow'))
      await capture('failed-owner-card', owner)
      await capture('failed-owner-details', canvas.locator('#proof-failures'))
      await page.setViewportSize({ width: 1600, height: 1100 })
      await canvas
        .getByRole('button', { name: /Current source - passed/ })
        .first()
        .click()
      await expect(canvas.locator('#attempt-id')).toHaveText(recovery)
      await canvas.locator('#proof-flow').selectOption('deferred-publication')
      // Native card context menu launches a linked flow without a nested button.
      await owner.click({ button: 'right' })
      const menu = canvas.locator('#proof-menu')
      await expect(menu).toBeVisible()
      await run(
        'baseline',
        'passed',
        menu.getByRole('button', { name: 'Publish a committed change' })
      )
      await expect(canvas.locator('#checks')).toHaveText('3 / 3')
      await canvas.locator('#proof-flow').selectOption('immediate-cancellation')
      await expect(
        canvas.locator('.proof-badge[data-status="unknown"]')
      ).toHaveCount(3)
      await owner.focus()
      await owner.press('Shift+F10')
      await expect(menu).toBeVisible()
      await owner.press('Escape')
      await expect(menu).toBeHidden()
      const countBeforeRead = server.service.state().runs.length
      await canvas.locator('#refresh').click()
      await expect(canvas.locator('#run-state')).toHaveText('Ready to verify')
      assert.equal(server.service.state().runs.length, countBeforeRead)
      await canvas.locator('#run-all').click()
      await expect(canvas.locator('#cancel')).toBeEnabled()
      await canvas.locator('#cancel').click()
      await expect(canvas.locator('#run-state')).toHaveText('Ready to verify', {
        timeout: 20000
      })
      await expect(canvas.locator('#overall')).toHaveAttribute(
        'data-status',
        'unknown'
      )
      await run('baseline', 'passed')
      await capture('canvas-recovery')
      // Existing filtering/selection replaces graph DOM, so the adapter must bind
      // the new cards and immediately project the selected evidence.
      const previousReads = await viewport.evaluate(() => window.cardReads)
      await canvas
        .getByRole('button', { name: 'Boundary', exact: true })
        .click()
      await expect(
        canvas.locator('.proof-badge[data-status="passed"]')
      ).toHaveCount(0)
      assert.ok(
        (await viewport.evaluate(() => window.cardReads)) > previousReads
      )
      await canvas.getByRole('button', { name: 'All', exact: true }).click()
      await expect(
        canvas.locator('.proof-badge[data-status="passed"]')
      ).toHaveCount(3)
      const attempts = server.service.state().runs.length
      await page.reload()
      await expect(canvas.locator('#checks')).toHaveText('6 / 6')
      assert.equal(server.service.state().runs.length, attempts)
      // The loaded static canvas is its own immutable architecture snapshot.
      // A newer server contract cannot authorize old, differently authored cards.
      await page.route('**/api/state', async (route) => {
        const response = await route.fetch()
        const state = await response.json()
        state.contract.digest = 'changed-architecture'
        state.contract.flows[0].steps[0].title = 'Changed owner contract'
        await route.fulfill({ response, json: state })
      })
      await canvas.locator('#proof-controls > summary').click()
      await canvas.locator('#refresh').click()
      await expect(canvas.locator('#proof-error')).toContainText('canvas')
      await expect(canvas.locator('#run-all')).toBeDisabled()
      await expect(
        canvas.locator('.proof-badge[data-status="passed"]')
      ).toHaveCount(0)
      assert.equal(server.service.state().runs.length, attempts)
      await page.unroute('**/api/state')
      await page.reload()
      await expect(
        canvas.locator('.proof-badge[data-status="passed"]')
      ).toHaveCount(3)
      const workspaceUrl = new URL(page.url())
      workspaceUrl.hash = 'inspector=flow-inspector-core-proof'
      await page.goto(workspaceUrl.href)
      await expect(canvas.locator('.step-card')).toHaveCount(6)
      await expect(canvas.locator('.proof-badge')).toHaveCount(0)
      await expect(canvas.locator('#run-all')).toHaveCount(0)
      await expect(canvas.locator('#proof-unavailable')).toContainText(
        'No verification contract'
      )
      workspaceUrl.hash = 'inspector=transaction-atomicity'
      await page.goto(workspaceUrl.href)
      await expect(
        canvas.locator('.proof-badge[data-status="passed"]')
      ).toHaveCount(3)
      let idleReads = 0
      page.on('request', (request) => {
        if (request.url().endsWith('/api/state')) idleReads++
      })
      await page.waitForTimeout(1200)
      assert.equal(idleReads, 0)
      await page.setViewportSize({ width: 390, height: 844 })
      await page
        .getByRole('button', { name: 'Close Inspector catalog' })
        .click()
      await canvas
        .getByRole('button', { name: 'Close Inspector header' })
        .click()
      await canvas.getByRole('button', { name: 'Close step details' }).click()
      await expect(canvas.locator('.flow-viewport')).toBeVisible()
      await expect(
        canvas.locator('[data-panel-button="details"]')
      ).toBeVisible()
      await capture('narrow-canvas')
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        ),
        true
      )
      assert.deepEqual(errors, [])
      fs.writeFileSync(
        path.join(artifacts, 'review.json'),
        JSON.stringify(
          {
            url: server.origin,
            command:
              'FLOW_PROOF_URL=http://127.0.0.1:4318 node --test tools/flow-inspector/control-plane/__tests__/board.test.cjs',
            baseline,
            negative,
            recovery,
            screenshots
          },
          null,
          2
        ) + '\n'
      )
      process.stdout.write('Visual review artifacts: ' + artifacts + '\n')
    } finally {
      await browser?.close()
      await server.close()
      if (previousTemporary === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previousTemporary
    }
  }
)

test(
  'every catalog card link is valid and each destination opens without replacing its canvas',
  { timeout: 180000 },
  async () => {
    const root = path.resolve(__dirname, '../../../..')
    const parent = path.join(root, 'tmp/flow-inspector/visual-review')
    fs.mkdirSync(parent, { recursive: true })
    const artifacts = fs.mkdtempSync(path.join(parent, 'links-'))
    const temporary = path.join(artifacts, 'browser-tmp')
    fs.mkdirSync(temporary)
    const previousTemporary = process.env.TMPDIR
    process.env.TMPDIR = temporary
    const server = await startServer(root, {
      serviceOptions: { directory: path.join(artifacts, 'runs') }
    })
    let browser
    try {
      browser = await chromium.launch({
        channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || undefined,
        downloadsPath: temporary
      })
      const context = await browser.newContext({
        viewport: { width: 1600, height: 1100 }
      })
      const page = await context.newPage()
      const errors = []
      context.on('page', (tab) =>
        tab.on('pageerror', (error) => errors.push(error.message))
      )
      context.on('response', (response) => {
        if (response.status() >= 400)
          errors.push(response.status() + ' ' + response.url())
      })
      await page.goto(server.origin)
      const entries = await page.evaluate(() =>
        window.FLOW_INSPECTOR_WORKSPACE_BUNDLE.entries.map((entry) => ({
          id: entry.id,
          kind: entry.kind,
          steps:
            entry.kind === 'flow-v2'
              ? entry.data.steps.map((step) => step.id)
              : []
        }))
      )
      const links = new Set()
      const destinations = new Map()
      let selectedSteps = 0
      let fragmentClicked = false
      const screenshots = []
      for (const entry of entries) {
        await page.goto(
          server.origin +
            '/tools/flow-inspector/workspace/workspace.html#inspector=' +
            encodeURIComponent(entry.id)
        )
        const canvas = page.frameLocator('iframe')
        await expect(canvas.locator('html')).toHaveAttribute(
          'data-target-state',
          'rendered'
        )
        const collectAndClick = async () => {
          const anchors = canvas.locator('a[href]')
          const records = await anchors.evaluateAll((nodes) =>
            nodes.map((node, index) => ({
              href: node.href,
              target: node.target,
              rel: node.rel,
              index
            }))
          )
          for (const record of records) {
            links.add(record.href)
            assert.equal(record.target, '_blank', entry.id + ': ' + record.href)
            assert.ok(record.rel.split(/\s+/).includes('noopener'))
            assert.ok(record.rel.split(/\s+/).includes('noreferrer'))
            const url = new URL(record.href)
            assert.equal(url.origin, server.origin)
            const resource = url.origin + url.pathname + url.search
            if (destinations.has(resource) && (!url.hash || fragmentClicked))
              continue
            const anchor = anchors.nth(record.index)
            if (!(await anchor.isVisible()))
              await canvas.getByText('Full contract', { exact: true }).click()
            const graph = await canvas.locator('#flow').elementHandle()
            const viewport = canvas.locator('.flow-viewport')
            const before = await viewport.evaluate((node) => ({
              left: node.scrollLeft,
              top: node.scrollTop
            }))
            const selected = await canvas
              .locator('.detail-heading h2')
              .textContent()
            const popupPromise = context.waitForEvent('page')
            await anchor.click()
            const popup = await popupPromise
            try {
              await popup.waitForLoadState('domcontentloaded')
              await expect(popup).not.toHaveURL('about:blank')
              await expect(popup.locator('body')).not.toBeEmpty()
              assert.equal(await popup.evaluate(() => window.opener), null)
              if (url.pathname.endsWith('.html')) {
                await expect(
                  popup.frameLocator('iframe').locator('html')
                ).toHaveAttribute('data-target-state', 'rendered')
                const linkedId = await popup
                  .frameLocator('iframe')
                  .locator('html')
                  .evaluate(() => window.FLOW_INSPECTOR_WORKSPACE_ENTRY.id)
                assert.equal(
                  new URL(popup.url()).hash,
                  '#inspector=' + linkedId
                )
              } else assert.equal(popup.url(), record.href)
              assert.equal(
                await graph.evaluate((node) => node.isConnected),
                true
              )
              assert.deepEqual(
                await viewport.evaluate((node) => ({
                  left: node.scrollLeft,
                  top: node.scrollTop
                })),
                before
              )
              assert.equal(
                await canvas.locator('.detail-heading h2').textContent(),
                selected
              )
              destinations.set(resource, popup.url())
              if (url.hash) fragmentClicked = true
              if (
                screenshots.length === 0 ||
                (url.pathname.endsWith('.html') && screenshots.length === 1)
              ) {
                const screenshot = path.join(
                  artifacts,
                  'destination-' + screenshots.length + '.png'
                )
                await popup.screenshot({ path: screenshot })
                screenshots.push(screenshot)
              }
            } finally {
              await popup.close()
            }
          }
        }
        await collectAndClick()
        for (const step of entry.steps) {
          await canvas.locator(`[data-step-id="${step}"]`).click()
          selectedSteps++
          await collectAndClick()
        }
      }
      assert.equal(
        selectedSteps,
        entries.reduce((count, entry) => count + entry.steps.length, 0)
      )
      assert.ok(fragmentClicked)
      assert.ok(destinations.size > 0)
      assert.deepEqual(errors, [])
      await page.goto(server.origin)
      await expect(
        page.frameLocator('iframe').locator('.step-card')
      ).toHaveCount(7)
      const retainedCanvas = path.join(artifacts, 'retained-canvas.png')
      await page.screenshot({ path: retainedCanvas })
      screenshots.push(retainedCanvas)
      const report = {
        url: server.origin,
        entries: entries.length,
        selectedSteps,
        links: links.size,
        destinations: Object.fromEntries(destinations),
        screenshots
      }
      fs.writeFileSync(
        path.join(artifacts, 'review.json'),
        JSON.stringify(report, null, 2) + '\n'
      )
      process.stdout.write(
        `Link review: ${entries.length} entries, ${selectedSteps} cards, ${links.size} URLs, ${destinations.size} destinations. Artifacts: ${artifacts}\n`
      )
    } finally {
      await browser?.close()
      await server.close()
      if (previousTemporary === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previousTemporary
    }
  }
)
