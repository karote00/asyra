/* global document */
/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { chromium } = require('@playwright/test')
const { document: flowDocument, directory } = require('./fixtures.cjs')
const { startFlowServer } = require('../server.cjs')
test(
  'human panel shows primary actions, folds technical detail and updates file state live',
  { timeout: 30000 },
  async (t) => {
    const root = directory(t),
      file = path.join(root, 'checkout.flow.json'),
      doc = flowDocument()
    fs.writeFileSync(file, JSON.stringify(doc))
    const server = await startFlowServer(root, {
      directory: root,
      url: 'http://127.0.0.1:0'
    })
    t.after(() => server.close())
    const browserRoot = path.resolve(
      __dirname,
      '../../../../tmp/flow-stage-one/browser'
    )
    fs.mkdirSync(browserRoot, { recursive: true })
    const browser = await chromium.launch({
      headless: true,
      channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || 'chrome',
      env: { ...process.env, TMPDIR: browserRoot }
    })
    t.after(() => browser.close())
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 }
    })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text())
      }
    })
    await page.goto(server.origin)
    await page
      .getByRole('button', { name: 'Accept - Order accepted', exact: true })
      .waitFor()
    await page
      .getByLabel('Acceptance reason or note')
      .fill('Reviewed the order manually')
    await page
      .getByRole('button', { name: 'Accept - Order accepted', exact: true })
      .click()
    await page.waitForFunction(
      () =>
        document.querySelector('#feature-status')?.textContent ===
        'Feature - done'
    )
    assert.equal(
      await page
        .getByRole('button', { name: 'Reopen - Order accepted', exact: true })
        .isEnabled(),
      true
    )
    assert.equal(
      await page
        .getByRole('heading', { name: 'Review order', exact: true })
        .count(),
      1
    )
    assert.equal(
      await page.locator('.task-summary details').getAttribute('open'),
      null
    )
    await page.screenshot({
      path: path.join(browserRoot, 'desktop.png'),
      fullPage: true
    })
    fs.writeFileSync(file, '{')
    await page.waitForFunction(() => document.body.dataset.invalid === 'true')
    assert.equal(
      await page
        .getByRole('button', { name: 'Accept - Order accepted', exact: true })
        .isDisabled(),
      true
    )
    doc.revision = 4
    fs.writeFileSync(file, JSON.stringify(doc))
    await page.waitForFunction(
      () =>
        document.body.dataset.invalid === 'false' &&
        document.querySelector('#feature-status')?.textContent !==
          'Feature - done'
    )
    await page.setViewportSize({ width: 600, height: 900 })
    await page.screenshot({
      path: path.join(browserRoot, 'narrow.png'),
      fullPage: true
    })
    assert.deepEqual(
      errors.filter(
        (message) =>
          !message.includes('409 (Conflict)') &&
          !message.includes('404 (Not Found)')
      ),
      []
    )
    console.log('Visual evidence: ' + browserRoot + '; URL: ' + server.origin)
  }
)

test(
  'failed mixed node exposes rerun at the top and recovers through real current publication',
  { timeout: 30000 },
  async (t) => {
    const { openProject } = require('../store.cjs')
    const root = path.resolve(__dirname, '../../../..'),
      dir = directory(t),
      doc = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../examples/mixed.flow.json'),
          'utf8'
        )
      )
    fs.writeFileSync(path.join(dir, 'mixed.flow.json'), JSON.stringify(doc))
    const store = openProject(dir),
      binding = store.snapshot().evaluation.flows[0].nodes[0].binding
    store.update('mixed', {
      expectedRevision: 0,
      kind: 'observation',
      value: {
        nodeId: 'review',
        criterionId: 'check',
        kind: 'automated',
        status: 'failed',
        binding,
        actor: 'custom-check',
        executionId: 'initial',
        caseId: 'order-valid',
        summary: 'Order verification failed',
        at: new Date().toISOString()
      }
    })
    const server = await startFlowServer(root, {
      directory: dir,
      url: 'http://127.0.0.1:0'
    })
    t.after(() => server.close())
    const artifacts = path.join(root, 'tmp/flow-stage-one/browser')
    fs.mkdirSync(artifacts, { recursive: true })
    const browser = await chromium.launch({
      headless: true,
      channel: process.env.FLOW_PROOF_BROWSER_CHANNEL || 'chrome',
      env: { ...process.env, TMPDIR: artifacts }
    })
    t.after(() => browser.close())
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 }
    })
    await page.goto(server.origin)
    const rerun = page.getByRole('button', { name: 'Rerun', exact: true })
    await rerun.waitFor()
    assert.ok((await rerun.boundingBox()).y < 450)
    assert.equal(
      await page
        .locator('.task-summary')
        .getByText('Order verification failed', { exact: true })
        .count(),
      1
    )
    await page.screenshot({
      path: path.join(artifacts, 'failed-node.png'),
      fullPage: true
    })
    await rerun.click()
    await page
      .getByRole('button', { name: 'Confirm rerun', exact: true })
      .click()
    await page.waitForFunction(() =>
      document
        .querySelector('.task-summary')
        ?.textContent.includes('1/2 criteria accepted')
    )
    await page
      .getByLabel('Acceptance reason or note')
      .fill('Verified repaired order')
    await page
      .getByRole('button', { name: 'Accept - Order accepted', exact: true })
      .click()
    await page.waitForFunction(
      () =>
        document.querySelector('#feature-status')?.textContent ===
        'Feature - done'
    )
    assert.equal(
      store
        .snapshot()
        .documents[0].current.observations.find(
          (o) => o.criterionId === 'check'
        ).status,
      'passed'
    )
    await page.screenshot({
      path: path.join(artifacts, 'recovered-node.png'),
      fullPage: true
    })
  }
)
