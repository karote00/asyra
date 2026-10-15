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

test(
  'structured assertion evidence stays distinct and inert in the Board',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    fixture.addAssertionFailures()
    const fault = await fixture.run('app')
    assert.equal(fault.result.code, 1, fault.result.output)
    const machine = await (
      await fetch(server.origin + '/api/test-results/' + fault.record.id)
    ).json()
    const failures = machine.cases.filter((item) => item.status === 'failed')
    assert.equal(failures.length, 2)
    await page.goto(server.origin + '/history-shortcut')
    const frame = page.frameLocator('iframe')
    const buttons = frame.locator('#test-result-failures button')
    await expect(buttons).toHaveCount(2)
    for (const [index, item] of failures.entries()) {
      await buttons.nth(index).click()
      const errors = frame.locator('#test-result-detail .test-result-assertion')
      await expect(errors).toHaveCount(4)
      for (const [errorIndex, error] of item.failureDetails.entries()) {
        for (const key of ['message', 'stack', 'expected', 'actual', 'diff']) {
          if (!Object.hasOwn(error, key) || key === 'diff') continue
          // Compare textContent exactly; assertion whitespace is evidence.
          assert.equal(
            await errors
              .nth(errorIndex)
              .locator('[data-failure-field="' + key + '"]')
              .textContent(),
            error[key]
          )
        }
      }
      const renderedDiff = await errors
        .first()
        .locator('[data-failure-field="diff"]')
        .textContent()
      assert.equal(renderedDiff.includes('\u001b'), false)
      assert.ok(renderedDiff.includes('-   ' + [9999, 8888][index]))
      assert.ok(renderedDiff.includes('+   57'))
      await expect(errors.first()).toContainText(String([9999, 8888][index]))
      await expect(errors.nth(3)).toContainText('Actual - empty string')
      await expect(errors.locator('img')).toHaveCount(0)
    }
    await page.setViewportSize({ width: 850, height: 1100 })
    await page.getByRole('button', { name: 'Close Inspector catalog' }).click()
    await frame
      .locator('.test-result-assertion [data-failure-field="diff"]')
      .first()
      .scrollIntoViewIfNeeded()
    await expect(frame.locator('.test-result-assertion').first()).toBeVisible()
    await page.screenshot({
      path: path.join(fixture.directory, 'assertion-details-narrow.png'),
      fullPage: true
    })
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    await buttons.first().click()
    await expect(frame.locator('.test-result-assertion').first()).toContainText(
      '9999'
    )
    t.diagnostic('Structured evidence: ' + fixture.directory)
  }
)

test(
  'suite assertion differences remain run evidence without a product-node diagnosis',
  { timeout: 60000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    fixture.addHookAssertionFailure()
    const fault = await fixture.run('app')
    assert.equal(fault.result.code, 1, fault.result.output)
    assert.equal(fault.record.executionFailureDetails.length, 1)
    await page.goto(server.origin + '/history-shortcut')
    const frame = page.frameLocator('iframe')
    const execution = frame.locator('#test-result-execution-details')
    await expect(execution).toContainText(fault.record.id)
    await expect(
      execution.locator('[data-failure-field="expected"]')
    ).toContainText('9999')
    assert.equal(
      await execution.locator('[data-failure-field="actual"]').textContent(),
      fault.record.executionFailureDetails[0].actual
    )
    await expect(frame.locator('#test-result-failures button')).toHaveCount(0)
    await expect(frame.locator('.observation-failed')).toHaveCount(0)
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    await expect(
      execution.locator('[data-failure-field="diff"]')
    ).toContainText('9999')
  }
)

test(
  'real History replay failure reaches its Factory node with machine evidence and recovery',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    fixture.mutateReplay('replay-order')
    const fault = await fixture.run('history')
    assert.equal(fault.result.code, 1, fault.result.output)
    const failures = fault.record.cases.filter(
      (item) => item.status === 'failed'
    )
    assert.equal(failures.length, 8)
    assert.equal(
      failures.filter((item) => item.resolution === 'mapped').length,
      2
    )
    await page.goto(server.origin + '/history-replay')
    const frame = page.frameLocator('iframe')
    const buttons = frame.locator('#test-result-failures button')
    await expect(buttons).toHaveCount(8)
    await buttons.first().click()
    await expect(
      frame.locator('[data-step-id="replay-history-action"].is-selected')
    ).toHaveCount(1)
    await expect(frame.locator('.observation-failed')).toHaveCount(1)
    const details = frame.locator('#test-result-detail')
    await expect(details).toContainText('packages/factory/src/data-transact.ts')
    const machine = await (
      await fetch(server.origin + '/api/test-results/' + fault.record.id)
    ).json()
    assert.deepEqual(machine, fault.record)
    assert.equal(
      await details.locator('[data-failure-field="expected"]').textContent(),
      failures[0].failureDetails[0].expected
    )
    assert.equal(
      await details.locator('[data-failure-field="actual"]').textContent(),
      failures[0].failureDetails[0].actual
    )
    await page.screenshot({
      path: path.join(fixture.directory, 'history-replay-desktop.png'),
      fullPage: true
    })
    await page.setViewportSize({ width: 850, height: 1100 })
    await page.getByRole('button', { name: 'Close Inspector catalog' }).click()
    await details
      .locator('[data-failure-field="diff"]')
      .scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(fixture.directory, 'history-replay-narrow.png'),
      fullPage: true
    })
    fixture.restore()
    const recovery = await fixture.run('history')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    await expect(buttons).toHaveCount(0)
    await expect(frame.locator('.observation-failed')).toHaveCount(0)
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    await expect(buttons).toHaveCount(8)
    await buttons.first().click()
    await expect(details).toContainText(failures[0].failures[0])
    t.diagnostic('History Board evidence: ' + fixture.directory)
  }
)

test(
  'Design execution Board selects three failed owners and retains the original history',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    for (const scenario of [
      'omit-registered-tools',
      'misclassify-combined-tool',
      'ignore-canonical-evidence'
    ])
      fixture.mutateExecution(scenario)
    const fault = await fixture.run('execution')
    assert.equal(fault.result.code, 1, fault.result.output)
    const failures = fault.record.cases.filter(
      (item) => item.status === 'failed'
    )
    assert.equal(failures.length, 3)
    await page.goto(server.origin + '/ai-execution-flow')
    const frame = page.frameLocator('iframe')
    const buttons = frame.locator('#test-result-failures button')
    await expect(buttons).toHaveCount(3)
    await expect(frame.locator('.observation-failed')).toHaveCount(3)
    const details = frame.locator('#test-result-detail')
    for (const [index, item] of failures.entries()) {
      await buttons.nth(index).click()
      await expect(
        frame.locator(
          '[data-step-id="' + item.locations[0].stepId + '"].is-selected'
        )
      ).toHaveCount(1)
      for (const file of item.locations[0].implementationPaths)
        await expect(details).toContainText(file)
      await expect(details).toContainText(item.failures[0])
    }
    const machine = await (
      await fetch(server.origin + '/api/test-results/' + fault.record.id)
    ).json()
    assert.deepEqual(machine, fault.record)
    await page.screenshot({
      path: path.join(fixture.directory, 'execution-desktop.png'),
      fullPage: true
    })
    await page.setViewportSize({ width: 850, height: 1100 })
    await page.getByRole('button', { name: 'Close Inspector catalog' }).click()
    await details.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(fixture.directory, 'execution-narrow.png'),
      fullPage: true
    })
    fixture.restore()
    const recovery = await fixture.run('execution')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    await expect(buttons).toHaveCount(0)
    await expect(frame.locator('.observation-failed')).toHaveCount(0)
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    await expect(buttons).toHaveCount(3)
    await buttons.first().click()
    await expect(details).toContainText(failures[0].failures[0])
    t.diagnostic('Execution Board evidence: ' + fixture.directory)
  }
)

test(
  'Render viewport Board selects the failed adapter with matching evidence and historical recovery',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    fixture.mutateViewport()
    const fault = await fixture.run('viewport')
    assert.equal(fault.result.code, 1, fault.result.output)
    const failures = fault.record.cases.filter(
      (item) => item.status === 'failed'
    )
    assert.equal(failures.length, 1)
    await page.goto(server.origin + '/render-engine-boundary')
    const frame = page.frameLocator('iframe')
    const buttons = frame.locator('#test-result-failures button')
    await expect(buttons).toHaveCount(1)
    await buttons.first().click()
    await expect(
      frame.locator('[data-step-id="orchestrate-render-adapter"].is-selected')
    ).toHaveCount(1)
    await expect(frame.locator('.observation-failed')).toHaveCount(1)
    const details = frame.locator('#test-result-detail')
    for (const file of failures[0].locations[0].implementationPaths)
      await expect(details).toContainText(file)
    await expect(details).toContainText(failures[0].failures[0])
    await expect(details).toContainText(
      'Contract: docs/ai/framework/plans/completed/render-engine-boundary-plan.md'
    )
    await expect(details).toContainText('#state-to-render-surface')
    const machine = await (
      await fetch(server.origin + '/api/test-results/' + fault.record.id)
    ).json()
    assert.deepEqual(machine, fault.record)
    for (const field of ['expected', 'actual']) {
      assert.equal(
        await details
          .locator('[data-failure-field="' + field + '"]')
          .textContent(),
        failures[0].failureDetails[0][field]
      )
    }
    await page.screenshot({
      path: path.join(fixture.directory, 'viewport-desktop.png'),
      fullPage: true
    })
    await page.setViewportSize({ width: 850, height: 1100 })
    await page.getByRole('button', { name: 'Close Inspector catalog' }).click()
    await details.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(fixture.directory, 'viewport-narrow.png'),
      fullPage: true
    })
    fixture.restore()
    const recovery = await fixture.run('viewport')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    await expect(buttons).toHaveCount(0)
    await expect(frame.locator('.observation-failed')).toHaveCount(0)
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    await expect(buttons).toHaveCount(1)
    await buttons.first().click()
    await expect(details).toContainText(failures[0].failures[0])
    t.diagnostic('Viewport Board evidence: ' + fixture.directory)
  }
)

test(
  'Reusable composition Board selects four failed owners and retains the original history',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    for (const scenario of [
      'allow-control-plane',
      'copy-registration-receipt',
      'omit-invocation-calls',
      'omit-reload-name'
    ])
      fixture.mutateRecipe(scenario)
    const fault = await fixture.run('recipe')
    assert.equal(fault.result.code, 1, fault.result.output)
    const failures = fault.record.cases.filter(
      (item) => item.status === 'failed'
    )
    assert.equal(failures.length, 4)
    await page.goto(server.origin + '/reusable-tool-composition')
    const frame = page.frameLocator('iframe')
    const buttons = frame.locator('#test-result-failures button')
    await expect(buttons).toHaveCount(4)
    await expect(frame.locator('.observation-failed')).toHaveCount(4)
    const details = frame.locator('#test-result-detail')
    for (const [index, item] of failures.entries()) {
      await buttons.nth(index).click()
      await expect(
        frame.locator(
          '[data-step-id="' + item.locations[0].stepId + '"].is-selected'
        )
      ).toHaveCount(1)
      for (const file of item.locations[0].implementationPaths)
        await expect(details).toContainText(file)
      await expect(details).toContainText(item.failures[0])
      await expect(details).toContainText(item.locations[0].specPath)
      for (const ref of item.locations[0].specRefs)
        await expect(details).toContainText(ref)
    }
    const machine = await (
      await fetch(server.origin + '/api/test-results/' + fault.record.id)
    ).json()
    assert.deepEqual(machine, fault.record)
    await page.screenshot({
      path: path.join(fixture.directory, 'recipe-desktop.png'),
      fullPage: true
    })
    await page.setViewportSize({ width: 850, height: 1100 })
    await page.getByRole('button', { name: 'Close Inspector catalog' }).click()
    await details.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(fixture.directory, 'recipe-narrow.png'),
      fullPage: true
    })
    fixture.restore()
    const recovery = await fixture.run('recipe')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    await expect(buttons).toHaveCount(0)
    await expect(frame.locator('.observation-failed')).toHaveCount(0)
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    await expect(buttons).toHaveCount(4)
    await buttons.first().click()
    await expect(details).toContainText(failures[0].failures[0])
    t.diagnostic('Recipe Board evidence: ' + fixture.directory)
  }
)

test(
  'Pixi and adapter failures select distinct owners on the shared Board and recover only their rerun scope',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    fixture.mutatePixi()
    fixture.mutateViewport()
    const engine = await fixture.run('pixi')
    const adapter = await fixture.run('viewport')
    for (const fault of [engine, adapter])
      assert.equal(fault.result.code, 1, fault.result.output)
    await page.goto(server.origin + '/render-engine-boundary')
    const frame = page.frameLocator('iframe')
    const buttons = frame.locator('#test-result-failures button')
    const details = frame.locator('#test-result-detail')
    await expect(buttons).toHaveCount(2)
    await expect(frame.locator('.observation-failed')).toHaveCount(2)
    for (const fault of [engine, adapter]) {
      const failed = fault.record.cases.filter(
        (item) => item.status === 'failed'
      )
      assert.equal(failed.length, 1)
      const item = failed[0]
      await buttons.filter({ hasText: item.testName }).click()
      await expect(
        frame.locator(
          '[data-step-id="' + item.locations[0].stepId + '"].is-selected'
        )
      ).toHaveCount(1)
      for (const file of item.locations[0].implementationPaths)
        await expect(details).toContainText(file)
      await expect(details).toContainText(item.locations[0].specPath)
      for (const ref of item.locations[0].specRefs)
        await expect(details).toContainText(ref)
      await expect(details).toContainText(item.failures[0])
      const machine = await (
        await fetch(server.origin + '/api/test-results/' + fault.record.id)
      ).json()
      assert.deepEqual(machine, fault.record)
    }
    await buttons
      .filter({
        hasText: engine.record.cases.find((item) => item.status === 'failed')
          .testName
      })
      .click()
    await page.screenshot({
      path: path.join(fixture.directory, 'pixi-desktop.png'),
      fullPage: true
    })
    await page.setViewportSize({ width: 850, height: 1100 })
    await page.getByRole('button', { name: 'Close Inspector catalog' }).click()
    await details.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(fixture.directory, 'pixi-narrow.png'),
      fullPage: true
    })
    fixture.restorePixi()
    const partial = await fixture.run('pixi')
    assert.equal(partial.result.code, 0, partial.result.output)
    await expect(buttons).toHaveCount(1)
    await expect(
      frame.locator('[data-step-id="execute-render-engine"].observation-failed')
    ).toHaveCount(0)
    await expect(
      frame.locator(
        '[data-step-id="orchestrate-render-adapter"].observation-failed'
      )
    ).toHaveCount(1)
    fixture.restore()
    const recovery = await fixture.run('viewport')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    await expect(buttons).toHaveCount(0)
    await expect(frame.locator('.observation-failed')).toHaveCount(0)
    await frame.locator('#test-result-history').selectOption(engine.record.id)
    await expect(buttons).toHaveCount(1)
    await buttons.first().click()
    await expect(
      frame.locator('[data-step-id="execute-render-engine"].is-selected')
    ).toHaveCount(1)
    await expect(details).toContainText(
      engine.record.cases.find((item) => item.status === 'failed').failures[0]
    )
    t.diagnostic('Pixi Board evidence: ' + fixture.directory)
  }
)

test(
  'Preset vector Board retains the failed evaluator through sibling reruns and historical recovery',
  { timeout: 90000 },
  async (t) => {
    const fixture = localizationFixture()
    const { page, server } = await openBoard(t, fixture)
    fixture.mutateVector()
    const fault = await fixture.run('vector')
    assert.equal(fault.result.code, 1, fault.result.output)
    const failures = fault.record.cases.filter(
      (item) => item.status === 'failed'
    )
    assert.equal(failures.length, 1)
    await page.goto(server.origin + '/render-delta-update')
    const frame = page.frameLocator('iframe')
    const buttons = frame.locator('#test-result-failures button')
    await expect(buttons).toHaveCount(1)
    await buttons.first().click()
    await expect(
      frame.locator('[data-step-id="evaluate-vector-material"].is-selected')
    ).toHaveCount(1)
    await expect(frame.locator('.observation-failed')).toHaveCount(1)
    const details = frame.locator('#test-result-detail')
    for (const file of failures[0].locations[0].implementationPaths)
      await expect(details).toContainText(file)
    await expect(details).toContainText(failures[0].failures[0])
    await expect(details).toContainText(
      'Contract: docs/ai/framework/packages/preset.md'
    )
    const machine = await (
      await fetch(server.origin + '/api/test-results/' + fault.record.id)
    ).json()
    assert.deepEqual(machine, fault.record)
    for (const field of ['expected', 'actual']) {
      assert.equal(
        await details
          .locator('[data-failure-field="' + field + '"]')
          .textContent(),
        failures[0].failureDetails[0][field]
      )
    }
    await page.screenshot({
      path: path.join(fixture.directory, 'vector-desktop.png'),
      fullPage: true
    })
    await page.setViewportSize({ width: 850, height: 1100 })
    await page.getByRole('button', { name: 'Close Inspector catalog' }).click()
    await details.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(fixture.directory, 'vector-narrow.png'),
      fullPage: true
    })
    const sibling = await fixture.run('vector', [
      '--testNamePattern',
      'keeps radial gradients'
    ])
    assert.equal(sibling.result.code, 0, sibling.result.output)
    await expect(buttons).toHaveCount(1)
    await expect(frame.locator('.observation-failed')).toHaveCount(1)
    await buttons.first().click()
    await expect(details).toContainText(failures[0].failures[0])
    fixture.restore()
    const recovery = await fixture.run('vector')
    assert.equal(recovery.result.code, 0, recovery.result.output)
    await expect(buttons).toHaveCount(0)
    await expect(frame.locator('.observation-failed')).toHaveCount(0)
    await frame
      .getByRole('button', { name: 'Details panel', exact: true })
      .click()
    await frame.locator('#test-result-history').selectOption(fault.record.id)
    await expect(buttons).toHaveCount(1)
    await buttons.first().click()
    await expect(details).toContainText(failures[0].failures[0])
    t.diagnostic('Vector Board evidence: ' + fixture.directory)
  }
)
