/* global URL, fetch, navigator */

import assert from 'node:assert/strict'
import test from 'node:test'
import { spawn } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { serveArtifact } from '../production-artifact-server.mjs'

const require = createRequire(
  new URL('../../apps/asyra-design/package.json', import.meta.url)
)
const { chromium, expect } = require('@playwright/test')
const root = path.resolve(import.meta.dirname, '../..')
const temporary = path.join(root, 'tmp/production-artifacts')
await mkdir(temporary, { recursive: true })
process.env.TMPDIR = temporary
process.env.TMP = temporary
process.env.TEMP = temporary

async function browserPage(t, url, closeServer) {
  let browser
  t.after(async () => {
    try {
      await browser?.close()
    } finally {
      await closeServer()
    }
  })
  browser = await chromium.launch({
    ...(process.env.CI ? {} : { channel: 'chrome' }),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 }
  })
  const errors = []
  const sourceRequests = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (/\/(?:@vite|src)\//.test(new URL(request.url()).pathname))
      sourceRequests.push(request.url())
  })
  t.after(() => {
    assert.deepEqual(errors, [])
    assert.deepEqual(sourceRequests, [])
  })
  await page.goto(url)
  return page
}

test(
  'Sim production artifact loads Workers, completes an analysis and retains its project',
  { timeout: 180_000 },
  async (t) => {
    const config = JSON.parse(
      await readFile(path.join(root, 'apps/asyra-sim/vercel.json'), 'utf8')
    )
    const headers = Object.fromEntries(
      config.headers[0].headers.map(({ key, value }) => [key, value])
    )
    const server = await serveArtifact(
      path.join(root, 'apps/asyra-sim/dist'),
      headers
    )
    const page = await browserPage(t, server.url, server.close)
    await expect(page.getByRole('status')).toHaveText('Local runtime ready')
    await expect(
      page.getByTestId('workcell-canvas').locator('canvas')
    ).toBeVisible()
    await page.getByRole('button', { name: 'Projects', exact: true }).click()
    await page
      .getByLabel('Project name', { exact: true })
      .fill('Production artifact project')
    await page.getByLabel('Project name', { exact: true }).press('Enter')
    await expect(page.getByTestId('persistence-status')).toHaveText(
      'Saved locally - Production artifact project'
    )
    await page
      .getByRole('button', { name: 'Close projects', exact: true })
      .click()
    await page.getByRole('button', { name: 'Experiments', exact: true }).click()
    await page
      .getByLabel('Experiment', { exact: true })
      .selectOption({ label: 'Tool and table collision - r1' })
    await page.getByLabel('Start time (s)').fill('3.8')
    await page.getByLabel('Start time (s)').press('Enter')
    await page.getByLabel('End time (s)').fill('4.2')
    await page.getByLabel('End time (s)').press('Enter')
    await page
      .getByRole('button', { name: 'Run analysis', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'View results', exact: true })
      .click({ timeout: 90_000 })
    await expect(page.getByTestId('analysis-result')).toContainText(
      'Issue found'
    )
    await page.reload()
    await expect(page.getByTestId('persistence-status')).toHaveText(
      'Saved locally - Production artifact project'
    )
    assert.equal((await fetch(`${server.url}/missing-worker.js`)).status, 404)
  }
)

test(
  'Design production artifact supports local editing and history without dev middleware',
  { timeout: 90_000 },
  async (t) => {
    const server = await serveArtifact(
      path.join(root, 'apps/asyra-design/dist/frontend')
    )
    const page = await browserPage(
      t,
      `${server.url}/?fileId=production-artifact`,
      server.close
    )
    await expect(page.getByTestId('toolbar')).toBeVisible()
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
    const items = page
      .getByTestId('contents-panel')
      .locator('[data-testid^="element-item-"]')
    await expect(items).toHaveCount(0)
    await page.getByTestId('tool-rectangle').click()
    await expect(page.getByTestId('tool-rectangle')).toHaveAttribute(
      'data-active',
      'true'
    )
    const box = await canvas.boundingBox()
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3)
    await expect(items).toHaveCount(1)
    const modifier = await page.evaluate(() =>
      /mac/i.test(navigator.platform) ? 'Meta' : 'Control'
    )
    await page.keyboard.press(`${modifier}+z`)
    await expect(items).toHaveCount(0)
    await page.keyboard.press(`${modifier}+Shift+z`)
    await expect(items).toHaveCount(1)
    assert.equal((await fetch(`${server.url}/api/ai/action-batch`)).status, 404)
  }
)

test(
  'Website production server supports deep routes and client search',
  { timeout: 120_000 },
  async (t) => {
    const cwd = path.join(root, 'apps/asyra-framework-site')
    const siteRequire = createRequire(path.join(cwd, 'package.json'))
    const child = spawn(
      process.execPath,
      [
        siteRequire.resolve('next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        '3038'
      ],
      {
        cwd,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      }
    )
    let output = ''
    for (const stream of [child.stdout, child.stderr])
      stream.on('data', (chunk) => {
        output = (output + chunk).slice(-4000)
      })
    t.diagnostic(`Owned Next production server PID ${child.pid}`)
    const closeServer = async () => {
      if (child.exitCode !== null) return
      const stopped = new Promise((resolve) => child.once('exit', resolve))
      process.kill(-child.pid, 'SIGTERM')
      const timer = setTimeout(() => {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {
          /* already stopped */
        }
      }, 5000)
      await stopped
      clearTimeout(timer)
    }
    let browserOwnsCleanup = false
    t.after(async () => {
      if (!browserOwnsCleanup) await closeServer()
    })
    const url = 'http://127.0.0.1:3038'
    for (let attempt = 0; attempt < 60; attempt++) {
      assert.equal(child.exitCode, null, output)
      try {
        if (output.includes('Ready in') && (await fetch(url)).ok) break
      } catch {
        /* wait for owned server */
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    browserOwnsCleanup = true
    const page = await browserPage(t, `${url}/docs`, closeServer)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Asyra Framework' })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Search 41 guides' }).click()
    await page.getByRole('searchbox', { name: 'Search' }).fill('transaction')
    await expect(page.locator('.search-results a')).not.toHaveCount(0)
    const response = await page.goto(`${url}/atlas`)
    assert.equal(response.status(), 200)
    assert.ok(response.headers()['content-security-policy'])
    await expect(page.locator('h1')).toBeVisible()
    assert.equal((await fetch(`${url}/missing-release-route`)).status, 404)
  }
)
