/* global document, window, Element, MutationObserver, WheelEvent, URL, fetch, getComputedStyle */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { chromium, expect } = require('@playwright/test')
const { startServer, parseLocalUrl } = require('../server.cjs')
const { loadContract, MANIFEST_PATH } = require('../contracts.cjs')
const { captureSource } = require('../snapshot.cjs')

test(
  'offline provider fixture renders request provenance and unresolved cancellation on the original board',
  { skip: process.platform !== 'darwin', timeout: 30000 },
  async () => {
    const { randomUUID } = require('node:crypto')
    const root = path.resolve(__dirname, '../../../..')
    const parent = path.join(root, 'tmp/flow-inspector/visual-review')
    fs.mkdirSync(parent, { recursive: true })
    const artifacts = fs.mkdtempSync(path.join(parent, 'provider-offline-'))
    const temporary = path.join(artifacts, 'browser-tmp')
    fs.mkdirSync(temporary)
    const previous = process.env.TMPDIR
    process.env.TMPDIR = temporary
    const authorization = {
      id: randomUUID(),
      actor: 'local-developer',
      adapter: 'codex-app-server',
      model: 'offline-fixture',
      billing: 'chatgpt-subscription',
      maxRequests: 3,
      expiresAt: '2099-01-01T00:00:00.000Z'
    }
    let calls = 0,
      browser
    const server = await startServer(root, {
      serviceOptions: {
        directory: path.join(artifacts, 'runs'),
        agentOptions: {
          available: () => true,
          providerAuthorization: authorization,
          providerComplete: async () => {
            calls++
            if (calls === 2) return new Promise(() => undefined)
            return {
              text: '{"tool":"shell"}',
              terminal: true,
              usage: { inputTokens: 2, outputTokens: 1, totalTokens: 3 }
            }
          }
        }
      }
    })
    try {
      browser = await chromium.launch({
        channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || undefined,
        downloadsPath: temporary
      })
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1100 }
      })
      await page.goto(server.origin + '/transaction-atomicity')
      const canvas = page.frameLocator('iframe')
      await canvas
        .locator('[data-step-id="finalize-transaction-state"]')
        .click()
      await canvas.locator('#proof-controls > summary').click()
      await canvas.locator('#agent-controls > summary').click()
      await canvas.locator('#agent-adapter').selectOption('provider')
      await expect(canvas.locator('#agent-result')).toContainText(
        'No task selected. Authorized provider selected; no model turn dispatched.'
      )
      await expect(canvas.locator('#agent-provider-info')).toContainText(
        'offline-fixture'
      )
      await canvas
        .locator('#agent-objective')
        .fill('Offline protocol fixture - not real provider acceptance')
      await canvas.locator('#agent-start').click()
      await expect(canvas.locator('#agent-result')).toContainText(
        'Execution: denied'
      )
      await expect(canvas.locator('#agent-result')).toContainText(
        'Provider-reported tokens: 3'
      )
      await expect(canvas.locator('#agent-result')).toContainText(
        'Delivery: not-delivered'
      )
      await canvas
        .locator('#agent-result')
        .screenshot({ path: path.join(artifacts, 'provider-denial.png') })
      await canvas.locator('#agent-start').click()
      await expect.poll(() => calls).toBe(2)
      await expect(canvas.locator('#agent-result')).toContainText(
        'Provider turn pending; reservation retained while awaiting a terminal response.'
      )
      await expect(canvas.locator('#agent-result')).not.toContainText(
        'Reconciliation required'
      )
      await canvas.locator('#agent-cancel').click()
      await expect(canvas.locator('#agent-result')).toContainText(
        'Reconciliation required'
      )
      await expect(canvas.locator('#agent-resume')).toBeDisabled()
      await expect(canvas.locator('#agent-recovery')).toBeVisible()
      await expect(canvas.locator('#agent-recovery')).toContainText(
        'Local task stopped'
      )
      await expect(canvas.locator('#agent-recovery')).toContainText(
        'Save the task audit and candidate diff'
      )
      await expect(canvas.locator('#agent-recovery')).toContainText(
        'Do not delete records or create a new store'
      )
      await canvas.locator('#agent-handoff').click()
      await expect(canvas.locator('#agent-result')).toContainText(
        'Execution: handed-off'
      )
      await expect(canvas.locator('#agent-recovery')).toBeVisible()
      await expect(canvas.locator('#agent-resume')).toBeDisabled()
      assert.equal(
        calls,
        2,
        'reading guidance and handing off never dispatch a model'
      )
      await expect(canvas.locator('.step-card')).toHaveCount(7)
      await expect(canvas.locator('[data-route-id]')).toHaveCount(10)
      await canvas
        .locator('#agent-controls')
        .screenshot({ path: path.join(artifacts, 'provider-unresolved.png') })
      fs.writeFileSync(
        path.join(artifacts, 'review.json'),
        JSON.stringify(
          {
            fidelity: 'offline fixture only',
            origin: server.origin,
            viewport: { width: 1600, height: 1100 },
            stepId: 'finalize-transaction-state',
            tasks: server.service.state().tasks
          },
          null,
          2
        )
      )
    } finally {
      await browser?.close()
      await server.close()
      if (previous === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previous
    }
  }
)

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
      await page.goto(server.origin + '/transaction-atomicity')
      await expect(page.locator('iframe[title]')).toHaveCount(1)
      const canvas = page.frameLocator('iframe')
      await expect(canvas.locator('.step-card')).toHaveCount(7)
      await expect(canvas.locator('[data-route-id]')).toHaveCount(10)
      await expect(canvas.locator('#proof-controls')).toBeVisible()
      await expect(canvas.locator('#scenario option')).toHaveCount(6)
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
      await canvas.locator('body').evaluate((body) => {
        const style = document.createElement('style')
        style.textContent = '::-webkit-scrollbar { width: 15px; height: 15px; }'
        body.append(style)
      })
      const fitViewport = canvas.locator('.flow-viewport')
      const frameworkGroup = page.getByTestId('group-Framework')
      const entriesBefore = await frameworkGroup
        .getByTestId('inspector-entry')
        .count()
      await frameworkGroup.getByText('Framework', { exact: true }).click()
      await expect(frameworkGroup.getByTestId('inspector-entry')).toHaveCount(
        entriesBefore
      )
      await page
        .getByRole('button', { name: 'Collapse Framework', exact: true })
        .click()
      await expect(frameworkGroup.getByTestId('inspector-entry')).toHaveCount(0)
      await page
        .getByRole('button', { name: 'Expand Framework', exact: true })
        .click()
      for (const focus of [
        page.getByRole('searchbox'),
        page.getByRole('button', { name: 'Collapse Framework', exact: true }),
        canvas.locator('#scenario')
      ]) {
        await focus.press('Meta+0')
        await expect(fitViewport).toHaveAttribute('data-zoom-scale', '1')
        await focus.press('Meta+1')
        await expect
          .poll(async () =>
            Number(await fitViewport.getAttribute('data-zoom-scale'))
          )
          .toBeLessThan(1)
      }
      await page
        .getByRole('button', { name: 'Collapse Framework', exact: true })
        .press('Shift+0')
      await expect(fitViewport).toHaveAttribute('data-zoom-scale', '1')
      await page
        .getByRole('button', { name: 'Collapse Framework', exact: true })
        .press('Shift+1')
      await expect
        .poll(async () =>
          Number(await fitViewport.getAttribute('data-zoom-scale'))
        )
        .toBeLessThan(1)
      await canvas.locator('[data-reset-zoom]').click()
      await expect(fitViewport).toHaveAttribute('data-zoom-scale', '1')
      await canvas.locator('[data-fit-all]').click()
      await expect
        .poll(async () =>
          Number(await fitViewport.getAttribute('data-zoom-scale'))
        )
        .toBeLessThan(1)
      await expect(canvas.locator('.full-contract > summary')).toHaveCSS(
        'display',
        'list-item'
      )

      for (const delta of [-500, 1000]) {
        await fitViewport.evaluate((node, delta) => {
          node.dispatchEvent(
            new WheelEvent('wheel', {
              deltaY: delta,
              ctrlKey: true,
              bubbles: true,
              cancelable: true
            })
          )
        }, delta)
        await fitViewport.press('Meta+1')
        const gaps = await canvas.locator('.step-card').evaluateAll((cards) => {
          const view = cards[0]
            .closest('.flow-viewport')
            .getBoundingClientRect()
          const bounds = cards.map((card) => card.getBoundingClientRect())
          return [
            Math.min(...bounds.map((r) => r.left)) - view.left,
            view.right - Math.max(...bounds.map((r) => r.right)),
            Math.min(...bounds.map((r) => r.top)) - view.top,
            view.bottom - Math.max(...bounds.map((r) => r.bottom))
          ]
        })
        assert.ok(
          gaps.every((gap) => gap >= 23.5),
          `all cards need 24 screen px of padding: ${gaps}`
        )
        assert.ok(
          Math.abs(Math.min(...gaps) - 24) < 0.5,
          `fit must use the available bounds: ${gaps}`
        )
      }
      await canvas
        .getByRole('button', { name: 'Boundary', exact: true })
        .click()
      await fitViewport.press('Meta+1')
      await expect(canvas.locator('.step-card')).toHaveCount(7)
      await canvas.locator('[data-reset-zoom]').click()
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
      await expect(canvas.locator('#mapping-version')).toHaveText(
        server.service.contract().mappingVersion
      )
      await expect(canvas.locator('#runner-environment')).toContainText(
        'Vitest'
      )
      await expect(canvas.locator('#report-link')).toHaveAttribute(
        'target',
        '_blank'
      )
      await expect(canvas.locator('#report-link')).toHaveAttribute(
        'rel',
        'noopener noreferrer'
      )
      await canvas.getByText('Mapping review', { exact: true }).click()
      await canvas.locator('#mapping-prepare').click()
      await expect(canvas.locator('#mapping-diff')).toContainText(
        'No mapping changes'
      )
      await expect(canvas.locator('#mapping-accept')).toBeDisabled()
      await canvas.getByText('Mapping review', { exact: true }).click()
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
      await page.setViewportSize({ width: 1600, height: 720 })
      const negative = await run('inverse-regression', 'failed')
      assert.ok(
        Number(await viewport.getAttribute('data-zoom-scale')) < 1,
        'short viewports zoom out to fit both failed cards'
      )
      await expect(canvas.locator('#proof-flow')).toHaveValue(
        'immediate-cancellation'
      )
      await expect(canvas.locator('#proof-run-failure')).toBeVisible()
      await expect(canvas.locator('#proof-run-failure')).toContainText(
        '2 failed obligations'
      )
      await expect(canvas.locator('.step-card.proof-failed')).toHaveCount(2)
      assert.equal(
        await canvas.locator('.step-card.proof-failed').evaluateAll((cards) =>
          cards.every((card) => {
            const bounds = card.getBoundingClientRect()
            const view = card.closest('.flow-viewport').getBoundingClientRect()
            return (
              bounds.left >= view.left &&
              bounds.right <= view.right &&
              bounds.top >= view.top &&
              bounds.bottom <= view.bottom
            )
          })
        ),
        true,
        'new failure automatically frames every failing card'
      )
      await capture('canvas-auto-fit')
      await viewport.evaluate((node) => {
        node.dispatchEvent(
          new WheelEvent('wheel', {
            deltaY: -30,
            ctrlKey: true,
            bubbles: true,
            cancelable: true
          })
        )
      })
      const manualView = await viewport.evaluate((node) => [
        node.dataset.zoomScale,
        node.scrollLeft,
        node.scrollTop
      ])
      await canvas.locator('#refresh').click()
      await expect(canvas.locator('#refresh')).toBeEnabled()
      assert.deepEqual(
        await viewport.evaluate((node) => [
          node.dataset.zoomScale,
          node.scrollLeft,
          node.scrollTop
        ]),
        manualView
      )

      await canvas.locator('#proof-flow').selectOption('deferred-publication')
      await expect(canvas.locator('#proof-run-failure')).toBeVisible()
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
      await expect(canvas.locator('#proof-run-failure')).toBeHidden()
      await expect(canvas.locator('.step-card.proof-failed')).toHaveCount(0)
      await expect(canvas.locator('#source-digest')).toHaveText(baselineDigest)
      await canvas
        .getByRole('button', { name: /Regression demo - failed/ })
        .click()
      await expect(canvas.locator('#attempt-id')).toHaveText(negative)
      await expect(
        canvas.locator('.proof-badge[data-status="failed"]')
      ).toHaveCount(2)
      await canvas.locator('[data-reset-zoom]').click()
      await canvas.locator('#proof-controls > summary').click()
      await expect(canvas.locator('#proof-run-failure')).toBeVisible()
      await canvas
        .getByRole('button', {
          name: 'Show Settle local shared projection',
          exact: true
        })
        .click()
      await expect(
        canvas.locator('[data-step-id="settle-local-shared-projection"]')
      ).toHaveClass(/is-selected/)
      await expect(canvas.locator('#proof-failures')).toContainText(
        'cancel.delivery - failed'
      )
      await canvas
        .getByRole('button', {
          name: 'Show Finalize transaction state',
          exact: true
        })
        .click()
      await expect(owner).toHaveClass(/is-selected/)
      assert.equal(
        await owner.evaluate((card) => {
          const rect = card.getBoundingClientRect()
          const view = card.closest('.flow-viewport').getBoundingClientRect()
          return (
            rect.left >= view.left &&
            rect.right <= view.right &&
            rect.top >= view.top &&
            rect.bottom <= view.bottom
          )
        }),
        true,
        'failure navigation brings the rebuilt owner card into the canvas viewport'
      )
      await expect(canvas.locator('#proof-failures')).toContainText(
        'cancel.outcome - failed'
      )
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
      await page.goto(server.origin + '/core-proof')
      await expect(canvas.locator('.step-card')).toHaveCount(14)
      await expect(
        canvas.locator('[data-step-id="aggregate-workflow-results"]')
      ).toContainText('Aggregate completed workflow results')
      for (const viewport of [
        { width: 1600, height: 1100 },
        { width: 820, height: 1180 },
        { width: 390, height: 844 }
      ]) {
        await page.setViewportSize(viewport)
        await page.goto(server.origin + '/core-proof')
        await canvas
          .locator('[data-step-id="aggregate-workflow-results"]')
          .click()
        await expect(canvas.locator('.detail-heading')).toContainText(
          'Aggregate completed workflow results'
        )
        await page.screenshot({
          path: path.join(
            artifacts,
            'workflow-owner-' + viewport.width + '.png'
          ),
          fullPage: true
        })
      }
      await page.setViewportSize({ width: 1600, height: 1100 })
      await expect(canvas.locator('.proof-badge')).toHaveCount(0)
      await expect(canvas.locator('#run-all')).toHaveCount(0)
      await expect(canvas.locator('#proof-unavailable')).toContainText(
        'No verification contract'
      )
      await page.goto(server.origin + '/transaction-atomicity')
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
      await canvas.getByRole('button', { name: 'Close step details' }).click()
      await canvas
        .getByRole('button', { name: 'Close Inspector header' })
        .click()
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
      await page.goto(server.origin + '/transaction-atomicity')
      const entries = await page.evaluate(() =>
        window.FLOW_INSPECTOR_WORKSPACE_BUNDLE.entries.map((entry) => ({
          id: entry.id,
          slug: entry.slug,
          kind: entry.kind,
          steps:
            entry.kind === 'flow-v2'
              ? entry.data.steps.map((step) => step.id)
              : []
        }))
      )
      // The public address is independent of the target iframe's stable id.
      const legacy =
        server.origin +
        '/tools/flow-inspector/workspace/workspace.html#inspector=asyra-design-ai-conversational-drawing-performance'
      await page.goto(legacy)
      await expect(page).toHaveURL(server.origin + '/ai-drawing-performance')
      await expect(page.frameLocator('iframe').locator('html')).toHaveAttribute(
        'data-target-state',
        'rendered'
      )
      const targetSource = await page.locator('iframe').getAttribute('src')
      assert.match(
        targetSource,
        /inspector=asyra-design-ai-conversational-drawing-performance/
      )
      await page.reload()
      await expect(page).toHaveURL(server.origin + '/ai-drawing-performance')
      await expect(page.locator('iframe')).toHaveAttribute('src', targetSource)
      await page.getByRole('button', { name: 'Overview', exact: true }).click()
      await expect(page).toHaveURL(server.origin + '/')
      await expect(page.locator('iframe')).toHaveCount(0)
      await page
        .getByTestId('inspector-entry')
        .filter({ hasText: 'Transaction Atomicity Inspector Flow' })
        .click()
      await expect(page).toHaveURL(server.origin + '/transaction-atomicity')
      await expect(
        page.frameLocator('iframe').locator('.step-card')
      ).toHaveCount(7)
      const historyLength = await page.evaluate(() => window.history.length)
      await page
        .getByTestId('inspector-entry')
        .filter({ hasText: 'Transaction Atomicity Inspector Flow' })
        .click()
      assert.equal(
        await page.evaluate(() => window.history.length),
        historyLength
      )
      await page.goBack()
      await expect(page).toHaveURL(server.origin + '/')
      await expect(page.locator('iframe')).toHaveCount(0)
      await page.goBack()
      await expect(page).toHaveURL(server.origin + '/ai-drawing-performance')
      await expect(page.locator('iframe')).toHaveAttribute('src', targetSource)
      await page.goForward()
      await expect(page).toHaveURL(server.origin + '/')
      await page.goForward()
      await expect(page).toHaveURL(server.origin + '/transaction-atomicity')
      await expect(
        page.frameLocator('iframe').locator('.step-card')
      ).toHaveCount(7)
      const links = new Set()
      const destinations = new Map()
      let selectedSteps = 0
      let fragmentClicked = false
      const screenshots = []
      for (const entry of entries) {
        const response = await page.goto(server.origin + '/' + entry.slug)
        assert.equal(response.status(), 200)
        await expect(page).toHaveURL(server.origin + '/' + entry.slug)
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
            for (const disclosure of await anchor
              .locator('xpath=ancestor::details')
              .all())
              if ((await disclosure.getAttribute('open')) === null)
                await disclosure.locator(':scope > summary').click()
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
                const linkedSlug = await popup
                  .frameLocator('iframe')
                  .locator('html')
                  .evaluate(() => window.FLOW_INSPECTOR_WORKSPACE_ENTRY.slug)
                assert.equal(new URL(popup.url()).pathname, '/' + linkedSlug)
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
      for (const pathname of [
        '/missing-inspector',
        '/asyra-executable-examples'
      ]) {
        const response = await page.goto(
          server.origin + pathname + '#inspector=transaction-atomicity'
        )
        assert.equal(response.status(), 404)
        await expect(page.locator('iframe')).toHaveCount(0)
        await expect(
          page.getByRole('heading', { name: /is not available/ })
        ).toBeVisible()
      }
      await page.goto(server.origin + '/transaction-atomicity')
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

test(
  'mapping review accepts and rejects exact candidates on the existing canvas with retained source evidence',
  { timeout: 45000 },
  async () => {
    const root = path.resolve(__dirname, '../../../..')
    const parent = path.join(root, 'tmp/flow-inspector/visual-review')
    fs.mkdirSync(parent, { recursive: true })
    const artifacts = fs.mkdtempSync(path.join(parent, 'mapping-'))
    const snapshot = captureSource(root, artifacts, loadContract(root))
    const repository = snapshot.sourceRoot
    const mappingPath = path.join(repository, MANIFEST_PATH)
    fs.chmodSync(mappingPath, 0o644)
    const temporary = path.join(artifacts, 'browser-tmp')
    fs.mkdirSync(temporary)
    const previousTemporary = process.env.TMPDIR
    process.env.TMPDIR = temporary
    const server = await startServer(repository, {
      serviceOptions: { directory: path.join(repository, 'runs') }
    })
    let browser
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
      await page.goto(server.origin + '/transaction-atomicity')
      const canvas = page.frameLocator('iframe')
      await canvas.locator('#proof-controls > summary').click()
      await canvas.locator('#run-all').click()
      await expect(canvas.locator('#overall')).toHaveAttribute(
        'data-status',
        'passed',
        { timeout: 15000 }
      )
      const geometry = await canvas.locator('.step-card').evaluateAll((nodes) =>
        nodes.map((node) => ({
          id: node.dataset.stepId,
          left: node.style.left,
          top: node.style.top,
          width: node.offsetWidth,
          height: node.offsetHeight
        }))
      )
      const manifest = JSON.parse(fs.readFileSync(mappingPath, 'utf8'))
      manifest.flows[0].cases[0].testName =
        'Factory flow proof deferred captured snapshot'
      fs.writeFileSync(mappingPath, JSON.stringify(manifest))
      await canvas.getByText('Mapping review', { exact: true }).click()
      await canvas.locator('#mapping-prepare').click()
      await expect(canvas.locator('#mapping-diff')).toContainText(
        'After: Factory flow proof deferred captured snapshot'
      )
      await expect(canvas.locator('#mapping-accept')).toBeDisabled()
      await canvas
        .locator('#mapping-reason')
        .fill(
          'Rename the existing snapshot assertion; preserve its obligation.'
        )
      const pending = path.join(artifacts, 'mapping-pending.png')
      await canvas.locator('#proof-controls').screenshot({ path: pending })
      await canvas.locator('#mapping-accept').click()
      await expect(canvas.locator('#mapping-baseline')).toContainText(
        'revision 2'
      )
      await expect(canvas.locator('#overall')).toHaveAttribute(
        'data-status',
        'unknown'
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
      const file = path.join(repository, manifest.testFile)
      fs.chmodSync(file, 0o644)
      fs.writeFileSync(
        file,
        fs
          .readFileSync(file, 'utf8')
          .replace("it('snapshot',", "it('captured snapshot',")
      )
      await canvas.locator('#run-all').click()
      await expect(canvas.locator('#overall')).toHaveAttribute(
        'data-status',
        'passed',
        { timeout: 15000 }
      )
      await canvas
        .getByText('Captured source and recent attempts', { exact: true })
        .click()
      await expect(canvas.locator('#mapping-version')).toHaveText(
        server.service.contract().mappingVersion
      )
      const [report] = await Promise.all([
        page.waitForEvent('popup'),
        canvas.locator('#report-link').click()
      ])
      await report.waitForLoadState()
      assert.match(report.url(), /\/artifacts\/report$/)
      await report.close()
      const accepted = path.join(artifacts, 'mapping-accepted.png')
      await canvas.locator('#proof-controls').screenshot({ path: accepted })
      manifest.flows[0].cases[0].testName += ' another change'
      fs.writeFileSync(mappingPath, JSON.stringify(manifest))
      await canvas.locator('#mapping-prepare').click()
      await expect(canvas.locator('#mapping-diff')).toContainText(
        'another change'
      )
      await canvas.locator('#mapping-reason').fill('Keep the verified mapping.')
      await canvas.locator('#mapping-reject').click()
      await expect(canvas.locator('#mapping-diff')).toContainText(
        'Review rejected'
      )
      await expect(canvas.locator('#mapping-baseline')).toContainText(
        'revision 2'
      )
      await page.reload()
      assert.equal(server.service.state().mapping.revision, 2)
      assert.equal(server.service.state().mapping.reviews[0].status, 'rejected')
      assert.deepEqual(errors, [])
      fs.writeFileSync(
        path.join(artifacts, 'metadata.json'),
        JSON.stringify(
          {
            url: server.origin,
            viewport: page.viewportSize(),
            scenario: 'mapping-review',
            revision: 2,
            screenshots: [pending, accepted],
            retainedRuns: server.service.state().runs
          },
          null,
          2
        )
      )
      console.log('Mapping review artifacts: ' + artifacts)
    } finally {
      await browser?.close()
      await server.close()
      if (previousTemporary === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previousTemporary
    }
  }
)

test(
  'Phase 4 actions preserve the original cards while exposing evolution, CI blockers and shared baseline',
  { timeout: 60000 },
  async () => {
    const root = path.resolve(__dirname, '../../../..'),
      parent = path.join(root, 'tmp/flow-inspector/visual-review')
    fs.mkdirSync(parent, { recursive: true })
    const artifacts = fs.mkdtempSync(path.join(parent, 'phase4-')),
      temporary = path.join(artifacts, 'browser-tmp')
    fs.mkdirSync(temporary)
    const prior = process.env.TMPDIR
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
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1100 }
      })
      await page.goto(server.origin + '/transaction-atomicity')
      const canvas = page.frameLocator('iframe')
      await expect(canvas.locator('.step-card')).toHaveCount(7)
      await canvas.locator('#proof-controls > summary').click()
      await canvas
        .getByText('Contract versions and CI', { exact: true })
        .click()
      const original = await canvas
        .locator('.step-card')
        .first()
        .elementHandle()
      const geometry = await canvas
        .locator('.step-card')
        .evaluateAll((nodes) =>
          nodes.map((n) => [
            n.dataset.stepId,
            n.style.left,
            n.style.top,
            n.offsetWidth,
            n.offsetHeight
          ])
        )
      await canvas.locator('#run-candidate').click()
      await expect(canvas.locator('#run-state')).toHaveText('Ready to verify', {
        timeout: 15000
      })
      await expect(canvas.locator('#result-context')).toContainText('Candidate')
      await expect(
        canvas.locator('.proof-badge[data-status="passed"]')
      ).toHaveCount(0)
      await canvas.locator('#contract-prepare').click()
      await expect(canvas.locator('#contract-diff')).toContainText('pending')
      await canvas.locator('#contract-reason').fill('Reviewed current baseline')
      await canvas.locator('#contract-accept').click()
      await expect(canvas.locator('#contract-baseline')).toContainText(
        'revision 2'
      )
      await canvas.locator('#run-ci-demo').click()
      await expect(canvas.locator('#run-state')).toHaveText('Ready to verify', {
        timeout: 15000
      })
      await expect(canvas.locator('#ci-result')).toContainText('failed')
      await expect(canvas.locator('#ci-result')).toContainText('blocked')
      await canvas.locator('#run-ci').click()
      await expect(canvas.locator('#ci-result')).toContainText('blocked', {
        timeout: 15000
      })
      await expect(canvas.locator('#ci-result')).toContainText('required-check')
      await expect(canvas.locator('#ci-envelope-link')).toHaveAttribute(
        'target',
        '_blank'
      )
      const id = server.service.state().runs[0].id
      await canvas.locator('#retry-run').click()
      await expect.poll(() => server.service.state().runs[0].id).not.toBe(id)
      await expect(canvas.locator('#run-state')).toHaveText('Ready to verify', {
        timeout: 15000
      })
      await canvas.getByText('Shared baseline view', { exact: true }).click()
      await expect(canvas.locator('#manager-view')).toContainText(
        'Delivery: blocked'
      )
      await expect(canvas.locator('#shared-link')).toHaveAttribute(
        'href',
        '/api/shared'
      )
      await canvas
        .locator('#work-step')
        .selectOption('finalize-transaction-state')
      await canvas.locator('#work-status').selectOption('in-progress')
      await canvas
        .locator('#work-reason')
        .fill('Remaining implementation reviewed')
      await canvas.locator('#work-save').click()
      await expect(canvas.locator('#manager-view')).toContainText(
        'Work: in-progress'
      )
      await expect(canvas.locator('#manager-view')).toContainText(
        'Delivery: blocked'
      )

      assert.deepEqual(
        await canvas
          .locator('.step-card')
          .evaluateAll((nodes) =>
            nodes.map((n) => [
              n.dataset.stepId,
              n.style.left,
              n.style.top,
              n.offsetWidth,
              n.offsetHeight
            ])
          ),
        geometry
      )
      assert.equal(
        await original.evaluate(
          (n) => n === document.querySelector('.step-card')
        ),
        true
      )
      await page.screenshot({
        path: path.join(artifacts, 'phase4-board.png'),
        fullPage: true
      })
      await canvas
        .locator('#phase4-controls')
        .screenshot({ path: path.join(artifacts, 'phase4-controls.png') })
      await canvas
        .locator('#manager-view')
        .evaluate((element) =>
          element.scrollIntoView({ behavior: 'instant', block: 'start' })
        )
      await page.screenshot({
        path: path.join(artifacts, 'phase4-shared.png'),
        fullPage: true
      })
      fs.writeFileSync(
        path.join(artifacts, 'metadata.json'),
        JSON.stringify(
          {
            url: page.url(),
            viewport: page.viewportSize(),
            snapshot: server.service.shared(),
            screenshots: [
              'phase4-board.png',
              'phase4-controls.png',
              'phase4-shared.png'
            ]
          },
          null,
          2
        )
      )
    } finally {
      await browser?.close()
      await server.close()
      if (prior === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = prior
    }
  }
)

test(
  'Phase 5 delegates the selected original card, proves a real candidate, rejects scope and recovers with retained budgets',
  { skip: process.platform !== 'darwin', timeout: 90000 },
  async () => {
    const root = path.resolve(__dirname, '../../../..')
    const parent = path.join(root, 'tmp/flow-inspector/visual-review')
    fs.mkdirSync(parent, { recursive: true })
    const artifacts = fs.mkdtempSync(path.join(parent, 'agent-review-'))
    const temporary = path.join(artifacts, 'browser-tmp')
    fs.mkdirSync(temporary)
    const previous = process.env.TMPDIR
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
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1100 }
      })
      await page.goto(server.origin + '/transaction-atomicity')
      const canvas = page.frameLocator('iframe')
      await expect(canvas.locator('.step-card')).toHaveCount(7)
      await canvas
        .locator('[data-step-id="finalize-transaction-state"]')
        .click()
      await canvas.locator('#proof-controls > summary').click()
      await canvas.locator('#agent-controls > summary').click()
      await expect(
        canvas.locator('#agent-adapter option[value="provider"]')
      ).toHaveJSProperty('disabled', true)
      await expect(canvas.locator('#agent-step')).toContainText(
        'finalize-transaction-state'
      )
      await canvas
        .locator('#agent-objective')
        .fill('Review inverse restoration under retained obligations')
      const geometry = await canvas.locator('.step-card').evaluateAll((cards) =>
        cards.map((card) => ({
          id: card.dataset.stepId,
          left: card.style.left,
          top: card.style.top
        }))
      )
      await canvas.locator('#agent-start').click()
      await expect(canvas.locator('#agent-result')).toContainText(
        'needs-review',
        { timeout: 20000 }
      )
      await expect(canvas.locator('#agent-result')).toContainText(
        'not-delivered'
      )
      await expect(canvas.locator('#agent-result')).toContainText(
        'Token usage: unknown'
      )
      await expect(
        canvas.locator('.proof-badge[data-status="passed"]')
      ).toHaveCount(0)
      await canvas.locator('#agent-scenario').selectOption('regression')
      await canvas.locator('#agent-resume').click()
      await expect(canvas.locator('#agent-result')).toContainText(
        'Verification: failed',
        { timeout: 20000 }
      )
      await expect(canvas.locator('#agent-result')).toContainText(
        'cancel.outcome'
      )
      await canvas.locator('#agent-result').scrollIntoViewIfNeeded()
      await page.screenshot({
        path: path.join(artifacts, 'agent-regression.png'),
        fullPage: true
      })
      await canvas.locator('#agent-result').screenshot({
        path: path.join(artifacts, 'agent-regression-detail.png')
      })
      await canvas.locator('#agent-scenario').selectOption('repair')
      await canvas.locator('#agent-resume').click()
      await expect(canvas.locator('#agent-result')).toContainText(
        'Verification: passed',
        { timeout: 20000 }
      )
      await expect(canvas.locator('#agent-result')).toContainText(
        'Attempts: 3 / 3'
      )
      await canvas.locator('#agent-result').scrollIntoViewIfNeeded()
      await page.screenshot({
        path: path.join(artifacts, 'agent-recovery.png'),
        fullPage: true
      })
      await canvas
        .locator('#agent-result')
        .screenshot({ path: path.join(artifacts, 'agent-recovery-detail.png') })
      await canvas.locator('[data-step-id="record-reversible-journal"]').click()
      await expect(canvas.locator('#agent-audit')).toBeHidden()
      await canvas
        .locator('[data-step-id="finalize-transaction-state"]')
        .click()
      await canvas.locator('#agent-scenario').selectOption('scope-violation')
      await canvas.locator('#agent-start').click()
      await expect(canvas.locator('#agent-result')).toContainText(
        'Execution: denied'
      )
      await canvas.locator('#agent-handoff').click()
      await expect(canvas.locator('#agent-result')).toContainText('handed-off')
      await canvas.locator('#agent-scenario').selectOption('stall')
      await canvas.locator('#agent-start').click()
      await expect(canvas.locator('#agent-cancel')).toBeEnabled()
      await canvas.locator('#agent-cancel').click()
      await expect(canvas.locator('#agent-result')).toContainText('cancelled')
      await page.reload()
      await canvas
        .locator('[data-step-id="finalize-transaction-state"]')
        .click()
      await canvas.locator('#proof-controls > summary').click()
      await canvas.locator('#agent-controls > summary').click()
      await expect(canvas.locator('#agent-result')).toContainText('cancelled')
      assert.deepEqual(
        await canvas.locator('.step-card').evaluateAll((cards) =>
          cards.map((card) => ({
            id: card.dataset.stepId,
            left: card.style.left,
            top: card.style.top
          }))
        ),
        geometry
      )
      await expect(canvas.locator('[data-route-id]')).toHaveCount(10)
      await canvas.locator('#agent-scenario').selectOption('tool-limit')
      await canvas.locator('#agent-calls').fill('2')
      await canvas.locator('#agent-start').click()
      await expect(canvas.locator('#agent-result')).toContainText(
        'Execution: limited'
      )
      await expect(canvas.locator('#agent-result')).toContainText(
        'Tool calls: 2 / 2'
      )
      await canvas.locator('#agent-handoff').click()
      await expect(canvas.locator('#agent-result')).toContainText('handed-off')
      await page.setViewportSize({ width: 560, height: 900 })
      await canvas.locator('#agent-result').scrollIntoViewIfNeeded()
      await canvas
        .locator('#agent-result')
        .screenshot({ path: path.join(artifacts, 'agent-handoff-detail.png') })
      await page.screenshot({
        path: path.join(artifacts, 'agent-handoff-narrow.png'),
        fullPage: true
      })
      fs.writeFileSync(
        path.join(artifacts, 'metadata.json'),
        JSON.stringify(
          {
            url: server.origin,
            target: 'transaction-atomicity',
            stepId: 'finalize-transaction-state',
            geometry,
            state: server.service.state().tasks
          },
          null,
          2
        )
      )
    } finally {
      await browser?.close()
      await server.close()
      if (previous === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previous
    }
  }
)

test(
  'retained live provider evidence agrees across Board, API and CLI without another model request',
  {
    skip:
      !process.env.FLOW_LIVE_PROVIDER_TASK_ID ||
      !process.env.FLOW_LIVE_PROVIDER_CANCEL_ID,
    timeout: 30000
  },
  async () => {
    const { spawnSync } = require('node:child_process')
    const { validId } = require('../store.cjs')
    const root = path.resolve(__dirname, '../../../..')
    const origin = parseLocalUrl(process.env.FLOW_PROOF_URL).origin
    const taskId = process.env.FLOW_LIVE_PROVIDER_TASK_ID
    const cancelId = process.env.FLOW_LIVE_PROVIDER_CANCEL_ID
    assert.ok(validId(taskId) && validId(cancelId))
    const read = async (route) => {
      const response = await fetch(origin + route)
      assert.equal(response.status, 200)
      return response.json()
    }
    const task = await read('/api/tasks/' + taskId)
    const cancelled = await read('/api/tasks/' + cancelId)
    const changes = await read('/api/tasks/' + taskId + '/changes')
    const state = await read('/api/state')
    assert.equal(task.task.adapter, 'provider')
    assert.equal(task.task.provider.model, 'gpt-5.6-sol')
    assert.equal(task.task.provider.billing, 'chatgpt-subscription')
    assert.equal(task.verificationStatus, 'passed')
    assert.equal(task.workStatus, 'needs-review')
    assert.equal(task.deliveryStatus, 'not-delivered')
    assert.equal(task.attempts.length, 2)
    assert.deepEqual(
      task.attempts[0].verdict.evidence.cases
        .filter((item) => item.status === 'failed')
        .map((item) => item.id)
        .sort(),
      ['cancel.delivery', 'cancel.outcome']
    )
    assert.equal(task.attempts[1].verdict.evidence.passedCount, 6)
    assert.equal(task.attempts[1].verdict.evidence.cases.length, 6)
    assert.ok(
      task.providerRequests.every(
        (item) => item.state === 'settled' && item.usage.totalTokens > 0
      )
    )
    assert.equal(task.usage.tokens, null)
    assert.equal(task.usage.cost, null)
    assert.equal(cancelled.task.provider.id, task.task.provider.id)
    assert.equal(cancelled.phase, 'handed-off')
    assert.equal(cancelled.runnerPid, null)
    assert.ok(
      cancelled.providerRequests.some(
        (item) => item.state === 'unresolved' && item.usage === null
      )
    )
    assert.ok(
      cancelled.audit.some((item) => JSON.stringify(item).includes('cancel'))
    )
    assert.ok(
      task.providerRequests.length + cancelled.providerRequests.length <=
        task.task.provider.maxRequests
    )
    assert.equal(state.mapping.revision, task.task.revision)
    assert.equal(changes.length, 1)
    assert.equal(changes[0].path, 'packages/factory/src/data-transact.ts')
    assert.equal(
      fs.readFileSync(path.join(root, changes[0].path), 'utf8'),
      changes[0].before
    )
    assert.match(
      changes[0].after,
      /const previousValue = \(payload as \{ before\?: unknown \}\).before/
    )
    assert.match(changes[0].after, /inversePayload.after = previousValue/)
    const parent = path.join(root, 'tmp/flow-inspector/visual-review')
    fs.mkdirSync(parent, { recursive: true })
    const artifacts = fs.mkdtempSync(path.join(parent, 'provider-live-'))
    const temporary = path.join(artifacts, 'browser-tmp')
    fs.mkdirSync(temporary)
    const previous = process.env.TMPDIR
    process.env.TMPDIR = temporary
    let browser
    try {
      browser = await chromium.launch({
        channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || undefined,
        downloadsPath: temporary
      })
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1100 }
      })
      await page.goto(origin + '/transaction-atomicity')
      const canvas = page.frameLocator('iframe')
      await canvas
        .locator('[data-step-id="finalize-transaction-state"]')
        .click()
      await canvas.locator('#proof-controls > summary').click()
      await canvas.locator('#agent-controls > summary').click()
      for (const record of [task, cancelled]) {
        const cli = spawnSync(
          process.execPath,
          [
            'tools/flow-inspector/control-plane/cli.cjs',
            '--url',
            origin,
            'task-show',
            record.id
          ],
          { cwd: root, encoding: 'utf8', timeout: 5000, maxBuffer: 8000000 }
        )
        assert.equal(cli.status, 0)
        assert.deepEqual(JSON.parse(cli.stdout), record)
        await canvas.locator('#agent-history').selectOption(record.id)
        await expect(canvas.locator('#agent-result')).toContainText(
          'Task: ' + record.id
        )
        await expect(canvas.locator('#agent-result')).toContainText(
          'Provider: codex-app-server - gpt-5.6-sol'
        )
        await expect(canvas.locator('#agent-result')).toContainText(
          'Delivery: not-delivered'
        )
        if (record.id === taskId) {
          await expect(canvas.locator('#agent-result')).toContainText(
            'Verification: passed'
          )
          await expect(canvas.locator('#agent-result')).toContainText(
            'Work: needs-review'
          )
        } else {
          await expect(canvas.locator('#agent-result')).toContainText(
            'Reconciliation required'
          )
          await expect(canvas.locator('#agent-resume')).toBeDisabled()
          await expect(canvas.locator('#agent-recovery')).toBeVisible()
          await expect(canvas.locator('#agent-recovery')).toContainText(
            'Local task stopped'
          )
          await canvas.locator('#agent-recovery').screenshot({
            path: path.join(artifacts, 'live-cancellation-guidance.png')
          })
        }
        await canvas.locator('#agent-result').screenshot({
          path: path.join(
            artifacts,
            record.id === taskId ? 'live-correction.png' : 'live-handoff.png'
          )
        })
      }
      await expect(canvas.locator('.step-card')).toHaveCount(7)
      await expect(canvas.locator('[data-route-id]')).toHaveCount(10)
      const after = await read('/api/tasks/' + taskId)
      const cancelAfter = await read('/api/tasks/' + cancelId)
      assert.deepEqual(after.providerRequests, task.providerRequests)
      assert.deepEqual(cancelAfter.providerRequests, cancelled.providerRequests)
      fs.writeFileSync(
        path.join(artifacts, 'review.json'),
        JSON.stringify(
          {
            fidelity:
              'actual authorized gpt-5.6-sol execution; read-only replay',
            origin,
            task,
            cancelled
          },
          null,
          2
        )
      )
      console.log('Live provider review artifacts: ' + artifacts)
    } finally {
      await browser?.close()
      if (previous === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previous
    }
  }
)

test(
  'all verification sections retain readable spacing and fit narrow detail panels',
  { timeout: 30000 },
  async () => {
    const root = path.resolve(__dirname, '../../../..')
    const artifacts = path.join(
      root,
      'tmp/flow-inspector/visual-review/readability'
    )
    fs.mkdirSync(artifacts, { recursive: true })
    const previous = process.env.TMPDIR
    process.env.TMPDIR = artifacts
    const server = await startServer(root, {
      serviceOptions: { directory: path.join(artifacts, 'runs') }
    })
    let browser
    try {
      browser = await chromium.launch({
        channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || undefined,
        downloadsPath: artifacts
      })
      const page = await browser.newPage()
      page.setDefaultTimeout(5000)
      for (const width of [1600, 960, 576]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto(server.origin + '/transaction-atomicity')
        const frame = page.frameLocator('iframe')
        await frame
          .locator('[data-step-id="finalize-transaction-state"]')
          .click()
        await frame.locator('#proof-controls > summary').click()
        await frame.locator('.proof-body > details').evaluateAll((nodes) =>
          nodes.forEach((node) => {
            node.open = true
          })
        )
        for (const summary of await frame
          .locator('#proof-controls summary')
          .all()) {
          await page.mouse.move(0, 0)
          const background = await summary.evaluate(
            (node) => getComputedStyle(node).backgroundColor
          )
          await summary.hover()
          assert.equal(
            await summary.evaluate(
              (node) => getComputedStyle(node).backgroundColor
            ),
            background,
            'pointer hover must not paint a disclosure highlight'
          )
        }
        const title = frame.locator('#proof-controls > summary')
        await title.focus()
        await page.keyboard.press('Tab')
        await page.keyboard.press('Shift+Tab')
        assert.equal(
          await title.evaluate((node) => node.matches(':focus-visible')),
          true
        )
        assert.equal(
          await title.evaluate((node) => getComputedStyle(node).outlineWidth),
          '2px'
        )
        if (width === 1600) {
          const group = page.locator('.group-toggle').first()
          await group.hover()
          assert.equal(
            await group.evaluate((node) => getComputedStyle(node).outlineStyle),
            'none',
            'pointer hover must not mimic keyboard focus'
          )
          await group.focus()
          await page.keyboard.press('Tab')
          await page.keyboard.press('Shift+Tab')
          assert.equal(
            await group.evaluate((node) => node.matches(':focus-visible')),
            true
          )
          assert.equal(
            await group.evaluate((node) => getComputedStyle(node).outlineWidth),
            '2px'
          )
        }
        const metrics = await frame
          .locator('#proof-controls')
          .evaluate((panel) => {
            const style = getComputedStyle(panel)
            return {
              font: parseFloat(style.fontSize),
              line: parseFloat(style.lineHeight),
              overflow: panel.scrollWidth - panel.clientWidth,
              sections: [
                ...panel.querySelectorAll('.proof-body > details')
              ].map((section) => ({
                top: parseFloat(getComputedStyle(section).marginTop),
                padding: parseFloat(
                  getComputedStyle(section.querySelector('summary')).paddingTop
                )
              }))
            }
          })
        assert.ok(metrics.font >= 13, 'verification text must remain readable')
        assert.ok(metrics.line >= 20, 'verification lines need breathing room')
        assert.ok(metrics.overflow <= 1, 'controls must fit the detail panel')
        assert.equal(metrics.sections.length, 6)
        for (const section of metrics.sections) {
          assert.ok(
            section.top >= 16,
            'each disclosure must be separated from its predecessor'
          )
          assert.ok(
            section.padding >= 10,
            'disclosure titles need an independent reading and click area'
          )
        }
        await page.screenshot({
          path: path.join(artifacts, `verification-${width}.png`)
        })
        for (let index = 0; index < metrics.sections.length; index++) {
          await frame
            .locator('.proof-body > details > summary')
            .nth(index)
            .evaluate((node) => node.scrollIntoView({ block: 'start' }))
          await page.screenshot({
            path: path.join(artifacts, `section-${index}-${width}.png`)
          })
        }
      }
      const snapshot = {}
      require('node:vm').runInNewContext(
        fs.readFileSync(
          path.join(
            root,
            'tools/flow-inspector/workspace/workspace-bundle.data.js'
          ),
          'utf8'
        ),
        snapshot
      )
      const inspected = []
      await page.setViewportSize({ width: 1280, height: 900 })
      for (const entry of snapshot.FLOW_INSPECTOR_WORKSPACE_BUNDLE.entries) {
        await page.goto(server.origin + '/' + entry.slug)
        const frame = page.frameLocator('iframe')
        await expect(frame.locator('h1:visible')).toBeVisible()
        if (entry.kind === 'flow-v2') {
          await frame.locator('.step-card').first().click()
          await expect(frame.locator('.detail-heading')).toBeVisible()
          const overflow = await frame
            .locator('#detail')
            .evaluate((node) => node.scrollWidth - node.clientWidth)
          assert.ok(
            overflow <= 1,
            entry.slug + ' detail must wrap long content'
          )
        }
        inspected.push({ slug: entry.slug, kind: entry.kind })
      }
      fs.writeFileSync(
        path.join(artifacts, 'catalog-review.json'),
        JSON.stringify(inspected, null, 2)
      )
    } finally {
      await browser?.close()
      await server.close()
      if (previous === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previous
    }
  }
)

test(
  'narrow workspace gives canvas and step reading separate stable scroll surfaces',
  { timeout: 30000 },
  async () => {
    const root = path.resolve(__dirname, '../../../..')
    const artifacts = path.join(
      root,
      'tmp/flow-inspector/visual-review/narrow-navigation'
    )
    fs.mkdirSync(artifacts, { recursive: true })
    const previous = process.env.TMPDIR
    process.env.TMPDIR = artifacts
    const server = await startServer(root, {
      serviceOptions: { directory: path.join(artifacts, 'runs') }
    })
    let browser
    try {
      browser = await chromium.launch({
        channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || undefined,
        downloadsPath: artifacts
      })
      const page = await browser.newPage({
        viewport: { width: 576, height: 720 }
      })
      await page.goto(server.origin + '/transaction-atomicity')
      const frame = page.frameLocator('iframe')
      await expect(page.locator('.sidebar')).toBeHidden()
      await expect(frame.locator('#detail')).toBeHidden()
      const viewport = frame.locator('.flow-viewport')
      await frame.locator('[data-step-id="finalize-transaction-state"]').click()
      const retainedView = await viewport.evaluate((node) => [
        node.scrollLeft,
        node.scrollTop,
        node.dataset.zoomScale
      ])
      await expect(frame.locator('#detail')).toBeVisible()
      await expect(viewport).toBeHidden()
      await frame.locator('#proof-controls > summary').click()
      await frame.locator('#agent-controls > summary').click()
      await frame.locator('#detail').hover()
      await page.mouse.wheel(0, 700)
      await expect
        .poll(() => frame.locator('#detail').evaluate((node) => node.scrollTop))
        .toBeGreaterThan(100)
      assert.equal(
        await page.evaluate(() => document.scrollingElement.scrollTop),
        0
      )
      assert.equal(
        await frame
          .locator('body')
          .evaluate((node) => node.ownerDocument.scrollingElement.scrollTop),
        0
      )
      await expect(
        frame.getByRole('button', { name: 'Close step details' })
      ).toBeInViewport()
      await page.screenshot({ path: path.join(artifacts, 'detail-scroll.png') })
      await frame.getByRole('button', { name: 'Close step details' }).click()
      await expect(viewport).toBeVisible()
      await expect(frame.locator('#detail')).toBeHidden()
      assert.deepEqual(
        await viewport.evaluate((node) => [
          node.scrollLeft,
          node.scrollTop,
          node.dataset.zoomScale
        ]),
        retainedView
      )
      await page.setViewportSize({ width: 820, height: 720 })
      await expect(viewport).toBeVisible()
      await frame.getByRole('button', { name: 'Catalog panel' }).click()
      await expect(page.locator('.sidebar')).toBeVisible()
      await expect(page.locator('.workspace-main')).toBeHidden()
      await page
        .getByRole('button', {
          name: /Transaction Atomicity Inspector Flow Architecture/
        })
        .click()
      await expect(page.locator('.sidebar')).toBeHidden()
      await expect(viewport).toBeVisible()
      await page.screenshot({ path: path.join(artifacts, 'flow-restored.png') })
      await frame.getByRole('button', { name: 'Catalog panel' }).click()
      await expect(page.locator('.sidebar')).toBeVisible()
      await page.getByRole('button', { name: 'Overview', exact: true }).click()
      await expect(
        page.getByRole('button', { name: 'Open Inspector catalog' })
      ).toBeVisible()
      await page.getByRole('button', { name: 'Open Inspector catalog' }).click()
      await expect(page.locator('.sidebar')).toBeVisible()
    } finally {
      await browser?.close()
      await server.close()
      if (previous === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previous
    }
  }
)

test(
  'bounded PR review preview confirmation and HEAD observations remain readable on desktop tablet and narrow board',
  { skip: process.platform !== 'darwin', timeout: 45000 },
  async () => {
    const { randomUUID } = require('node:crypto')
    const { LOCAL_ACTOR } = require('../service.cjs')
    const root = path.resolve(__dirname, '../../../..'),
      parent = path.join(root, 'tmp/flow-inspector/visual-review')
    fs.mkdirSync(parent, { recursive: true })
    const artifacts = fs.mkdtempSync(path.join(parent, 'pr-review-')),
      temporary = path.join(artifacts, 'browser-tmp')
    fs.mkdirSync(temporary)
    const previous = process.env.TMPDIR
    process.env.TMPDIR = temporary
    let effects = 0,
      browser
    const head = 'c'.repeat(40)
    const server = await startServer(root, {
      serviceOptions: {
        directory: path.join(artifacts, 'runs'),
        deliveryAdapter: {
          repository: 'owner/repo',
          base: 'main',
          inspect: async () => ({
            baseSha: 'a'.repeat(40),
            baseTree: 'b'.repeat(40)
          }),
          deliver: async (p, checkpoint) => {
            effects++
            await checkpoint('create-pr', { expectedHead: head })
            return {
              number: 1,
              url: 'https://github.com/owner/repo/pull/1',
              state: 'open',
              headSha: head,
              draft: true
            }
          },
          observe: async () => ({
            number: 1,
            url: 'https://github.com/owner/repo/pull/1',
            state: 'closed',
            headSha: 'd'.repeat(40),
            matchesCandidate: false,
            checks: { headSha: 'd'.repeat(40), status: 'pending' },
            stale: false
          })
        }
      }
    })
    try {
      const service = server.service,
        id = service.startTask(
          {
            requestId: randomUUID(),
            stepId: 'finalize-transaction-state',
            objective:
              'Offline GitHub transport fixture - real local candidate proof',
            allowedFiles: ['packages/factory/src/data-transact.ts'],
            adapter: 'demonstration',
            scenario: 'repair',
            contractDigest: service.contract().digest,
            revision: service.state().mapping.revision,
            budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3 }
          },
          LOCAL_ACTOR
        )
      assert.equal((await service.waitTask(id)).verificationStatus, 'passed')
      browser = await chromium.launch({
        channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || undefined,
        downloadsPath: temporary
      })
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1100 }
      })
      await page.goto(server.origin + '/transaction-atomicity')
      const canvas = page.frameLocator('iframe')
      await canvas
        .locator('[data-step-id="finalize-transaction-state"]')
        .click()
      await canvas.locator('#proof-controls > summary').click()
      await canvas.locator('#pr-controls > summary').click()
      await canvas.locator('#pr-prepare').click()
      await expect(canvas.locator('#pr-result')).toContainText(
        'Delivery: preview'
      )
      await expect(canvas.locator('#pr-preview')).toContainText(id)
      await expect(canvas.locator('#pr-preview')).toContainText(
        'PR type: ready for review'
      )
      await expect(canvas.locator('#pr-confirm')).toHaveText(
        'Create confirmed PR'
      )
      await expect(canvas.locator('#pr-confirm')).toBeDisabled()
      assert.equal(effects, 0)
      await expect(canvas.locator('#pr-metadata')).toContainText(
        '"@asyra/factory": patch'
      )
      await expect(canvas.locator('#pr-metadata')).toContainText(
        'Deterministic demonstration'
      )
      await expect(canvas.locator('#pr-metadata')).toContainText(
        'not source verification'
      )
      await expect(canvas.locator('#pr-preview')).toContainText(
        '.changeset/flow-review-'
      )
      for (const [name, width, height] of [
        ['desktop', 1600, 1100],
        ['tablet', 820, 1180],
        ['narrow', 390, 844]
      ]) {
        await page.setViewportSize({ width, height })
        if (width <= 900 && (await page.locator('.sidebar').isVisible()))
          await page
            .getByRole('button', { name: 'Close Inspector catalog' })
            .click()
        await canvas.locator('#pr-controls').scrollIntoViewIfNeeded()
        await expect(canvas.locator('#pr-prepare')).toBeVisible()
        assert.equal(
          await canvas
            .locator('#pr-controls')
            .evaluate((el) => el.scrollWidth <= el.clientWidth + 2),
          true
        )
        await canvas.locator('#pr-result').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: path.join(artifacts, name + '-preview-top.png')
        })
        await canvas.locator('#pr-metadata').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: path.join(artifacts, name + '-metadata.png')
        })
        assert.equal(
          await canvas
            .locator('#pr-metadata')
            .evaluate((el) => el.scrollWidth <= el.clientWidth + 2),
          true
        )
        await canvas.locator('#pr-confirm').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: path.join(artifacts, name + '-preview-confirm.png')
        })
        assert.equal(await canvas.locator('.step-card').count(), 7)
        for (const link of ['pr-source', 'pr-evidence']) {
          await expect(canvas.locator('#' + link)).toHaveAttribute(
            'target',
            '_blank'
          )
          await expect(canvas.locator('#' + link)).toHaveAttribute(
            'rel',
            'noopener noreferrer'
          )
        }
      }
      await canvas.locator('#pr-approve').check()
      await expect(canvas.locator('#pr-confirm')).toBeEnabled()
      await canvas.locator('#pr-confirm').click()
      await expect(canvas.locator('#pr-result')).toContainText(
        'submitted-for-review'
      )
      assert.equal(effects, 1)
      await expect(canvas.locator('#pr-github')).toHaveAttribute(
        'href',
        'https://github.com/owner/repo/pull/1'
      )
      await canvas.locator('#pr-refresh').click()
      await expect(canvas.locator('#pr-result')).toContainText('PR: closed')
      await expect(canvas.locator('#pr-result')).toContainText(
        'GitHub checks: pending'
      )
      await expect(canvas.locator('#pr-result')).toContainText(
        'Local verification: passed'
      )
      await expect(canvas.locator('#pr-result')).toContainText(
        'outside prepared candidate'
      )
      await canvas.locator('#pr-result').scrollIntoViewIfNeeded()
      await page.screenshot({
        path: path.join(artifacts, 'narrow-observation.png')
      })
      const api = await fetch(
        server.origin + '/api/tasks/' + id + '/review'
      ).then((r) => r.json())
      assert.equal(api.preview.taskId, id)
      assert.equal(api.preview.metadata.validation.status, 'passed')
      assert.equal(api.preview.deliveryFiles.length, 2)
      assert.equal(api.observation.state, 'closed')
      assert.equal(service.getTask(id).deliveryStatus, 'not-delivered')
      fs.writeFileSync(
        path.join(artifacts, 'review.json'),
        JSON.stringify(
          {
            origin: server.origin,
            taskId: id,
            offlineTransport: true,
            effects,
            record: api
          },
          null,
          2
        )
      )
    } finally {
      await browser?.close()
      await server.close()
      if (previous === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previous
    }
  }
)

test(
  'retained live GitHub review agrees across Board API and CLI without another external create',
  { skip: !process.env.FLOW_LIVE_REVIEW_TASK_ID, timeout: 30000 },
  async () => {
    const { main } = require('../cli.cjs')
    const root = path.resolve(__dirname, '../../../..'),
      origin = parseLocalUrl(process.env.FLOW_PROOF_URL).origin,
      id = process.env.FLOW_LIVE_REVIEW_TASK_ID
    assert.match(id, /^[a-f0-9-]{36}$/)
    const read = (route) =>
      fetch(origin + route).then(async (r) => {
        assert.equal(r.status, 200)
        return r.json()
      })
    const before = await read('/api/state'),
      task = await read('/api/tasks/' + id),
      review = await read('/api/tasks/' + id + '/review')
    assert.equal(review.state, 'submitted-for-review')
    assert.equal(review.preview.taskId, id)
    assert.equal(review.preview.attemptId, task.attempts.at(-1).id)
    assert.equal(review.preview.repository, process.env.FLOW_REVIEW_REPOSITORY)
    assert.ok(review.observation.number > 0)
    if (process.env.FLOW_LIVE_REVIEW_REQUIRE_PASSED === '1') {
      assert.equal(review.preview.metadata.validation.status, 'passed')
      assert.equal(review.preview.metadata.packageName, '@asyra/factory')
      assert.equal(review.observation.stale, false)
      assert.equal(review.observation.matchesCandidate, true)
      assert.equal(review.observation.checks.status, 'passed')
      assert.equal(
        review.observation.checks.headSha,
        review.observation.headSha
      )
      assert.ok(review.observation.checks.items.length > 0)
      assert.ok(
        review.observation.checks.items.every(
          (item) => item.status === 'completed' && item.conclusion === 'success'
        )
      )
      assert.equal(task.verificationStatus, 'passed')
      assert.equal(task.attempts.at(-1).verdict.evidence.cases.length, 6)
      assert.ok(
        task.attempts
          .at(-1)
          .verdict.evidence.cases.every((item) => item.status === 'passed')
      )
    }
    assert.match(review.observation.url, /^https:\/\/github.com\//)
    const lines = []
    assert.equal(
      await main(['--url', origin, 'pr-show', id], {
        repositoryRoot: root,
        write: (x) => lines.push(x)
      }),
      0
    )
    assert.deepEqual(JSON.parse(lines[0]), review)
    const artifacts = path.join(
      root,
      'tmp/flow-inspector/visual-review/github-live-' + id
    )
    fs.mkdirSync(artifacts, { recursive: true })
    const previous = process.env.TMPDIR
    process.env.TMPDIR = artifacts
    let browser
    try {
      browser = await chromium.launch({
        channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || undefined,
        downloadsPath: artifacts
      })
      const page = await browser.newPage({
        viewport: { width: 1600, height: 1100 }
      })
      await page.goto(origin + '/transaction-atomicity')
      const canvas = page.frameLocator('iframe')
      await canvas.locator('[data-step-id="' + task.task.stepId + '"]').click()
      await canvas.locator('#proof-controls > summary').click()
      await canvas.locator('#agent-controls > summary').click()
      await canvas.locator('#agent-history').selectOption(id)
      await canvas.locator('#pr-controls > summary').click()
      await expect(canvas.locator('#pr-result')).toContainText(
        'submitted-for-review'
      )
      await expect(canvas.locator('#pr-github')).toHaveAttribute(
        'href',
        review.observation.url
      )
      await expect(canvas.locator('#pr-preview')).toContainText(
        review.preview.attemptId
      )
      await canvas.locator('#pr-controls details > summary').click()
      await expect(canvas.locator('#pr-source-diff')).toContainText(
        review.preview.changes[0].path
      )
      for (const [name, width, height] of [
        ['desktop', 1600, 1100],
        ['tablet', 820, 1180],
        ['narrow', 390, 844]
      ]) {
        await page.setViewportSize({ width, height })
        if (width <= 900 && (await page.locator('.sidebar').isVisible()))
          await page
            .getByRole('button', { name: 'Close Inspector catalog' })
            .click()
        await canvas.locator('#pr-result').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: path.join(artifacts, name + '-status.png')
        })
        if (review.preview.metadata) {
          await expect(canvas.locator('#pr-metadata')).toContainText(
            review.preview.metadata.content.trim()
          )
          await canvas.locator('#pr-metadata').scrollIntoViewIfNeeded()
          await page.screenshot({
            path: path.join(artifacts, name + '-metadata.png')
          })
        }
        await canvas.locator('#pr-source-diff').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: path.join(artifacts, name + '-source.png')
        })
      }
      assert.deepEqual(await read('/api/tasks/' + id + '/review'), review)
      assert.deepEqual((await read('/api/state')).mapping, before.mapping)
      assert.deepEqual(
        (await read('/api/tasks/' + id)).providerRequests,
        task.providerRequests
      )
      fs.writeFileSync(
        path.join(artifacts, 'review.json'),
        JSON.stringify(
          {
            origin,
            liveGitHub: true,
            candidateAdapter: task.task.adapter,
            record: review
          },
          null,
          2
        )
      )
    } finally {
      await browser?.close()
      if (previous === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = previous
    }
  }
)
