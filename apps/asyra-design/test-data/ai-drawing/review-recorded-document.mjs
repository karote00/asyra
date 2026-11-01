/* global fetch, AbortSignal, console */
/** Reopen retained evidence without starting another AI request. */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { setTimeout } from 'node:timers'
import { gzipSync, gunzipSync } from 'node:zlib'
import { isDeepStrictEqual } from 'node:util'
import { chromium } from 'playwright'
import { loadEnvironment, resolveEnvironment } from '../../app-environment.mjs'
import { waitForRecordedDocument } from './taipei-101-live-contract.mjs'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const root = path.resolve(app, '../..')
const runDirectory = fs.realpathSync(process.argv[2])
if (!runDirectory.startsWith(path.join(root, 'tmp') + path.sep))
  throw new Error('Select a retained run inside this project tmp.')
const run = JSON.parse(
  fs.readFileSync(path.join(runDirectory, 'run.json'), 'utf8')
)
const source = JSON.parse(
  gunzipSync(
    fs.readFileSync(path.join(runDirectory, 'source-snapshot.json.gz'))
  )
)
const expectedCount = Object.values(source.counts).reduce(
  (sum, value) => sum + value,
  0
)
const directory = path.join(runDirectory, `reload-review-${Date.now()}`)
fs.mkdirSync(directory)
const env = loadEnvironment({ ...process.env })
const configured = resolveEnvironment(env)
const services = []
const evidence = { runId: run.id, expectedCount, services, aiRequests: 0 }
const save = () =>
  fs.writeFileSync(
    path.join(directory, 'review.json'),
    JSON.stringify(evidence, null, 2)
  )
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const start = (name, command, args) => {
  const fd = fs.openSync(path.join(directory, `${name}.log`), 'a')
  const child = spawn(command, args, {
    cwd: app,
    env: {
      ...env,
      E2E_OWN_SERVERS: '1',
      DOCUMENT_BACKEND_DATA_DIR: path.join(runDirectory, 'documents'),
      AI_EXECUTION_RECORD_DIR: path.join(directory, 'unexpected-ai-records')
    },
    detached: true,
    stdio: ['ignore', fd, fd]
  })
  fs.closeSync(fd)
  if (!child.pid) throw new Error(`Cannot start ${name}`)
  services.push({ name, pid: child.pid })
  save()
}
const ready = async (url) => {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return
    } catch {
      /* startup */
    }
    await sleep(250)
  }
  throw new Error(`Service unavailable: ${url}`)
}
let browser
try {
  for (const url of [
    configured.appURL,
    configured.collaborationHealthURL,
    env.DOCUMENT_PERSISTENCE_BACKEND_URL
  ]) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(500) })
      throw new Error('Occupied service port: ' + url)
    } catch (error) {
      if (error.message.startsWith('Occupied')) throw error
    }
  }
  start('document-backend', process.execPath, [
    'dist/document-backend/document-backend.js'
  ])
  await ready(env.DOCUMENT_PERSISTENCE_BACKEND_URL + '/health')
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
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  })
  await page.route('**/api/ai/**', (route) => {
    evidence.aiRequests++
    return route.abort()
  })
  const started = Date.now()
  await page.goto(run.url)
  evidence.ready = await waitForRecordedDocument(page, expectedCount)
  evidence.loadMs = Date.now() - started
  const loaded = await page.evaluate(async () =>
    (await import('/src/testing/runtime-access.ts')).core.save()
  )
  evidence.documentMatches = isDeepStrictEqual(loaded, source.document)
  fs.writeFileSync(
    path.join(directory, 'document.json.gz'),
    gzipSync(JSON.stringify(loaded))
  )
  await page.evaluate(async () =>
    (await import('/src/common-apis/viewport.ts')).viewportApis.zoomFit()
  )
  await page.screenshot({ path: path.join(directory, 'reloaded.png') })
  if (!evidence.documentMatches || evidence.aiRequests)
    throw new Error('Retained document verification failed.')
} catch (error) {
  evidence.failure = error.message
  process.exitCode = 1
} finally {
  await browser?.close()
  for (const { pid } of services) {
    try {
      process.kill(-pid, 'SIGTERM')
    } catch (error) {
      if (error.code !== 'ESRCH') evidence.cleanupFailure = error.message
    }
  }
  save()
  console.log(JSON.stringify({ directory, ...evidence }))
}
