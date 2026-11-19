/* global fetch, AbortSignal, requestAnimationFrame, console */
/** Read-only evidence recovery after a completed drawing/report loses its browser. */
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { gunzipSync, gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { loadEnvironment, resolveEnvironment } from '../../app-environment.mjs'
import { launchCaptureBrowser } from '../knowledge-evaluation/capture-browser.mjs'
import { captureSessionOnPage } from '../knowledge-evaluation/capture-lifecycle.mjs'
import { waitForRecordedDocument } from './taipei-101-live-contract.mjs'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const root = path.resolve(app, '../..')
const source = fs.realpathSync(path.resolve(process.argv[2]))

assert.ok(source.startsWith(root + path.sep), 'Source must be project-local')
const runBytes = fs.readFileSync(path.join(source, 'run.json'))
const run = JSON.parse(runBytes)
const workBytes = fs.readFileSync(path.join(source, 'work-snapshot.json.gz'))
const work = JSON.parse(gunzipSync(workBytes))
const checkpoint = JSON.parse(
  fs.readFileSync(path.join(source, 'checkpoint.json'))
)

assert.equal(run.selfReport?.workStatus, 'completed')
assert.equal(run.selfReport?.status, 'collected')
const directory = path.join(source, 'recovery')

fs.mkdirSync(directory)
const env = loadEnvironment({ ...process.env })
const configured = resolveEnvironment(env)
const backendURL = env.DOCUMENT_PERSISTENCE_BACKEND_URL
const meta = {
  source,
  mode: 'read-only-saved-document',
  originalRunSha256: createHash('sha256').update(runBytes).digest('hex'),
  workSnapshotSha256: createHash('sha256').update(workBytes).digest('hex'),
  startedAt: new Date().toISOString(),
  services: [],
  modelRequestAttempts: 0,
  pageErrors: []
}

const save = () =>
  fs.writeFileSync(
    path.join(directory, 'recovery.json'),
    JSON.stringify(meta, null, 2)
  )

const ready = async (url) => {
  const until = Date.now() + 60000

  while (Date.now() < until) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1500) })).ok) {
        return
      }
    } catch {
      /* bounded service startup */
    }

    await delay(250)
  }

  throw Error('Service readiness failed: ' + url)
}

const start = (name, command, args) => {
  const fd = fs.openSync(path.join(directory, name + '.log'), 'a')
  const child = spawn(command, args, {
    cwd: app,
    env: {
      ...env,
      E2E_OWN_SERVERS: '1',
      E2E_DOCUMENT_BACKEND_URL: backendURL,
      DOCUMENT_BACKEND_DATA_DIR: path.join(source, 'documents')
    },
    detached: true,
    stdio: ['ignore', fd, fd]
  })

  fs.closeSync(fd)
  assert.ok(child.pid)
  meta.services.push({ name, pid: child.pid })
  save()
}

let browser, context

try {
  for (const url of [
    configured.appURL,
    backendURL,
    configured.collaborationHealthURL
  ]) {
    let occupied = false

    try {
      await fetch(url, { signal: AbortSignal.timeout(500) })
      occupied = true
    } catch {
      /* not listening */
    }

    assert.equal(
      occupied,
      false,
      'Recovery requires unoccupied owned service ports'
    )
  }

  start('document-backend', process.execPath, [
    'dist/document-backend/document-backend.js'
  ])
  await ready(backendURL + '/health')
  start('collaboration', process.execPath, [
    'dist/collaboration-server/collaboration-server.js'
  ])
  await ready(configured.collaborationHealthURL)
  start('vite', 'yarn', [
    'start',
    '--host',
    configured.viteHost,
    '--port',
    String(configured.vitePort),
    '--strictPort'
  ])
  await ready(configured.appURL)
  browser = await launchCaptureBrowser({
    chromium,
    evidencePath: path.join(directory, 'cleanup-stop.json')
  })
  context = await browser.newContext({
    viewport: run.viewport,
    serviceWorkers: 'block'
  })
  await context.route('**/api/ai/**', (route) => {
    if (route.request().method() === 'POST') {
      meta.modelRequestAttempts++

      return route.abort()
    }

    return route.continue()
  })
  const page = await context.newPage()

  page.on('pageerror', (error) => meta.pageErrors.push(error.message))
  await page.goto(configured.appURL + '/?fileId=' + encodeURIComponent(run.id))
  await waitForRecordedDocument(
    page,
    Object.values(work.counts).reduce((a, b) => a + b, 0)
  )
  meta.persistence = await captureSessionOnPage(page)
  assert.equal(
    meta.persistence.receipt.durableSequence,
    checkpoint.durableSequence
  )
  assert.equal(
    meta.persistence.receipt.documentGeneration,
    checkpoint.documentGeneration
  )
  const document = await page.evaluate(async () => {
    const { core } = await import('/src/testing/runtime-access.ts')

    return core.save()
  })

  fs.writeFileSync(
    path.join(directory, 'reloaded.json.gz'),
    gzipSync(JSON.stringify(document))
  )
  assert.ok(
    isDeepStrictEqual(document, work.document),
    'Saved canonical document differs from work completion'
  )
  meta.workDocumentEqual = true
  await page.keyboard.press('Meta+1')
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  )
  await page.screenshot({ path: path.join(directory, 'final.png') })
  meta.screenshot = 'final.png'
  assert.equal(meta.modelRequestAttempts, 0)
  assert.deepEqual(meta.pageErrors, [])
  meta.status = 'complete'
} catch (error) {
  meta.status = 'failed'
  meta.error = error.message
  process.exitCode = 1
} finally {
  await context?.close().catch((error) => {
    meta.contextCleanupError = error.message
  })
  await browser?.close().catch((error) => {
    meta.browserCleanupError = error.message
  })
  for (const service of [...meta.services].reverse()) {
    try {
      process.kill(-service.pid, 'SIGTERM')
    } catch (error) {
      if (error.code !== 'ESRCH') {
        meta.serviceCleanupError = error.message
      }
    }
  }

  meta.originalRunUnchanged = fs
    .readFileSync(path.join(source, 'run.json'))
    .equals(runBytes)
  if (
    !meta.originalRunUnchanged ||
    meta.contextCleanupError ||
    meta.browserCleanupError ||
    meta.serviceCleanupError
  ) {
    meta.status = 'failed'
    process.exitCode = 1
  }

  meta.finishedAt = new Date().toISOString()
  save()
  console.log(
    JSON.stringify({ directory, status: meta.status, error: meta.error })
  )
}
