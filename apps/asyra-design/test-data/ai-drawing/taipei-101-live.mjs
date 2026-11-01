/* global document, window, requestAnimationFrame, AbortSignal, fetch, performance, console */
/** Explicit live benchmark only. No request interception, references or extra prompts. */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { Buffer } from 'node:buffer'
import { setTimeout } from 'node:timers'
import { spawn, execFileSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright'
import { loadEnvironment, resolveEnvironment } from '../../app-environment.mjs'
import { createLiveTestDeadline } from './live-test-deadline.mjs'
import { saveRemoteRecording } from './remote-recording.mjs'
import {
  readTaipei101Prompt,
  assertTaipei101Submission,
  TAIPEI_101_DEADLINE_MS
} from './taipei-101-live-contract.mjs'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const root = path.resolve(app, '../..')
const env = loadEnvironment({ ...process.env })
if (!env.APP_URL || env.AI_PROVIDER_BACKEND !== 'local-codex')
  throw new Error('Configure APP_URL and the local provider in the App .env.')
const configured = resolveEnvironment(env)
const backendURL = env.DOCUMENT_PERSISTENCE_BACKEND_URL
if (!backendURL) throw new Error('Missing document backend URL')
const { prompt, sha256 } = readTaipei101Prompt()
const id = `taipei-101-fixed-${Date.now()}`
const directory = path.join(root, 'tmp/conversation-improvements/live', id)
fs.mkdirSync(directory, { recursive: true })
const services = []
const meta = {
  id,
  prompt,
  promptFixtureSha256: sha256,
  head: execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8'
  }).trim(),
  startedAt: new Date().toISOString(),
  url: `${configured.appURL}/?fileId=${id}&aiPerformance=profile`,
  deadlineMs: TAIPEI_101_DEADLINE_MS,
  viewport: { width: 1920, height: 1080 },
  services,
  errors: [],
  statuses: []
}
const save = () =>
  fs.writeFileSync(
    path.join(directory, 'run.json'),
    JSON.stringify(meta, null, 2)
  )
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const start = (name, command, args) => {
  const log = fs.openSync(path.join(directory, `${name}.log`), 'a')
  const child = spawn(command, args, {
    cwd: app,
    env: {
      ...env,
      E2E_OWN_SERVERS: '1',
      E2E_DOCUMENT_BACKEND_URL: backendURL,
      AI_EXECUTION_RECORD_DIR: path.join(directory, 'provider-records'),
      DOCUMENT_BACKEND_DATA_DIR: path.join(directory, 'documents')
    },
    detached: true,
    stdio: ['ignore', log, log]
  })
  fs.closeSync(log)
  if (!child.pid) throw new Error(`Cannot start ${name}`)
  child.on('error', (error) => {
    meta.errors.push(`${name}: ${error.message}`)
    save()
  })
  services.push({ name, pid: child.pid, cwd: app })
  save()
  return child
}
const ready = async (url) => {
  const until = Date.now() + 60000
  while (Date.now() < until) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1500) })).ok) return
    } catch {
      /* bounded startup */
    }
    await sleep(250)
  }
  throw new Error(`Service did not become ready: ${url}`)
}
let browserServer, browser, context, page, deadline
const snapshot = async () =>
  page.evaluate(async () => {
    const { core, getActiveAiDrawingPerformanceProfile } =
      await import('/src/testing/runtime-access.ts')
    const counts = {}
    for (const [id] of core.deps.sceneTree.getAllElements()) {
      const type = core.getElementData(id)?.type ?? 'unknown'
      counts[type] = (counts[type] ?? 0) + 1
    }
    const profile = getActiveAiDrawingPerformanceProfile()
    return {
      document: await core.save(),
      counts,
      performance: profile?.snapshot(),
      runtime: profile?.getRuntimeEvidence(),
      conversation: profile?.readConversationSnapshot()
    }
  })
try {
  // Refuse occupied service ports; this recorder only terminates its own processes.
  for (const url of [
    configured.appURL,
    backendURL,
    configured.collaborationHealthURL
  ]) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(500) })
      throw new Error(`Service port is already occupied: ${url}`)
    } catch (error) {
      if (error.message.startsWith('Service port')) throw error
    }
  }
  start('document-backend', process.execPath, [
    'dist/document-backend/document-backend.js'
  ])
  await ready(`${backendURL}/health`)
  start('collaboration', process.execPath, [
    'dist/collaboration-server/collaboration-server.js'
  ])
  await ready(configured.collaborationHealthURL)
  const vite = start('vite', 'yarn', [
    'start',
    '--host',
    configured.viteHost,
    '--port',
    String(configured.vitePort),
    '--strictPort'
  ])
  await ready(configured.appURL)
  browserServer = await chromium.launchServer({
    channel: 'chrome',
    headless: true,
    artifactsDir: path.join(directory, 'browser-artifacts')
  })
  browser = await chromium.connect(browserServer.wsEndpoint())
  context = await browser.newContext({
    viewport: meta.viewport,
    recordVideo: { dir: path.join(directory, 'video'), size: meta.viewport },
    deviceScaleFactor: 1
  })
  page = await context.newPage()
  page.on('pageerror', (error) => {
    meta.errors.push(error.message)
    save()
  })
  page.on('request', (request) => {
    if (!new URL(request.url()).pathname.endsWith('/api/ai/action-batch'))
      return
    const body = request.postDataJSON()
    try {
      assertTaipei101Submission(body, prompt)
    } catch (error) {
      meta.errors.push(error.message)
    }
    meta.submissions ??= []
    meta.submissions.push({
      at: Date.now(),
      bytes: Buffer.byteLength(request.postData() ?? ''),
      intent: body.intent,
      metadata: body.metadata
    })
    save()
  })
  await page.goto(meta.url)
  await page.waitForFunction(
    async () => {
      const {
        core,
        getActiveCollaborationHandle,
        getActiveAiDrawingPerformanceProfile
      } = await import('/src/testing/runtime-access.ts')
      return (
        !!core.getCurrentWorkspaceId() &&
        getActiveCollaborationHandle()?.getStatus() === 'connected' &&
        !!getActiveAiDrawingPerformanceProfile()
      )
    },
    null,
    { timeout: 60000 }
  )
  await page.getByRole('button', { name: 'Open Agent' }).click()
  await page
    .getByText('Local AI connected', { exact: true })
    .waitFor({ timeout: 60000 })
  const before = await snapshot()
  fs.writeFileSync(
    path.join(directory, 'before.json.gz'),
    gzipSync(JSON.stringify(before))
  )
  await page.getByLabel('Message Agent').fill(prompt)
  if ((await page.getByLabel('Message Agent').inputValue()) !== prompt)
    throw new Error('Composer changed the fixed prompt')
  await page.screenshot({ path: path.join(directory, 'before.png') })
  await page.evaluate(async () => {
    const { core, getActiveAiDrawingPerformanceProfile } =
      await import('/src/testing/runtime-access.ts')
    const profile = getActiveAiDrawingPerformanceProfile()
    profile.reset()
    const baseline = profile.readRenderProjectionElementCount()
    const observation = {
      firstPaintOpportunityMs: null,
      started: performance.now()
    }
    const stop = core.subscribeToFrameComplete(() => {
      if (
        observation.firstPaintOpportunityMs === null &&
        profile.readRenderProjectionElementCount() > baseline
      ) {
        requestAnimationFrame(() => {
          observation.firstPaintOpportunityMs ??=
            performance.now() - observation.started
        })
      }
    })
    Object.assign(window, {
      fixedDrawingObservation: observation,
      stopFixedDrawingObservation: stop
    })
  })
  meta.sentAt = Date.now()
  deadline = createLiveTestDeadline({
    deadlineAt: meta.sentAt + TAIPEI_101_DEADLINE_MS,
    groups: [vite.pid],
    processes: [browserServer.process().pid],
    evidencePath: path.join(directory, 'deadline.json')
  })
  await deadline.ready
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  let lastStatus
  while (Date.now() - meta.sentAt < TAIPEI_101_DEADLINE_MS - 15000) {
    const state = await page.evaluate(async () => {
      const { getActiveAiDrawingPerformanceProfile } =
        await import('/src/testing/runtime-access.ts')
      const profile = getActiveAiDrawingPerformanceProfile()
      return {
        settlement: profile.readLatestTurnSettlement(),
        rendered: profile.readRenderProjectionElementCount(),
        first: window.fixedDrawingObservation.firstPaintOpportunityMs,
        status: document.querySelector('[aria-label="Current activity"]')
          ?.textContent
      }
    })
    if (state.status !== lastStatus) {
      lastStatus = state.status
      meta.statuses.push({
        elapsedMs: Date.now() - meta.sentAt,
        text: state.status
      })
    }
    if (state.first !== null && meta.firstPaintOpportunityMs === undefined) {
      meta.firstPaintOpportunityMs = state.first
      await page.keyboard.press('Meta+1')
      await page.screenshot({ path: path.join(directory, 'first.png') })
    }
    if (state.settlement) {
      meta.settlement = state.settlement
      break
    }
    save()
    await sleep(1000)
  }
  if (!meta.settlement) {
    meta.deadlineOutcome = 'stopped-before-hard-deadline'
    await page
      .getByRole('button', { name: 'Stop', exact: true })
      .click({ timeout: 2000 })
    await page.waitForFunction(
      async () =>
        (await import('/src/testing/runtime-access.ts'))
          .getActiveAiDrawingPerformanceProfile()
          ?.readLatestTurnSettlement(),
      null,
      { timeout: 8000 }
    )
  }
  meta.elapsedMs = Date.now() - meta.sentAt
  meta.deadline = await deadline.finish()
  await page.keyboard.press('Meta+1')
  await page.screenshot({ path: path.join(directory, 'final.png') })
  meta.detailViews = []
  for (const [name, fraction, nativeScale] of [
    ['spire', 0.08, false],
    ['tiers', 0.5, false],
    ['base', 0.92, false],
    ['native-detail', 0.5, true]
  ]) {
    const view = await page.evaluate(
      async ({ fraction, nativeScale }) => {
        const { core } = await import('/src/testing/runtime-access.ts')
        const { viewportApis } = await import('/src/common-apis/viewport.ts')
        viewportApis.zoomFit()
        const bounds = core.getAllElementsBounds()
        const viewport = document
          .getElementById('viewport-anchor')
          ?.getBoundingClientRect()
        if (!bounds || !viewport) return null
        const scale = nativeScale ? 1 : viewportApis.getScale() * 3
        const centerX = viewport.x + viewport.width / 2
        const centerY = viewport.y + viewport.height / 2
        const x = (bounds.minX + bounds.maxX) / 2
        const y = bounds.minY + (bounds.maxY - bounds.minY) * fraction
        viewportApis.zoomToCenter(scale, centerX, centerY)
        viewportApis.panTo(centerX - x * scale, centerY - y * scale)
        return { scale, x, y, bounds }
      },
      { fraction, nativeScale }
    )
    if (view) {
      await page.screenshot({ path: path.join(directory, `${name}.png`) })
      meta.detailViews.push({ name, ...view })
    }
  }
  await page.keyboard.press('Meta+1')
  const final = await snapshot()
  meta.counts = final.counts
  fs.writeFileSync(
    path.join(directory, 'source-snapshot.json.gz'),
    gzipSync(JSON.stringify(final))
  )
  meta.conversation = await page
    .getByTestId('ai-agent-message')
    .allTextContents()
  meta.requiresUserAnswer =
    (await page.getByText('Waiting for your answer', { exact: true }).count()) >
    0
  meta.persistence = await page.evaluate(async () => {
    const handle = (
      await import('/src/testing/runtime-access.ts')
    ).getActiveCollaborationHandle()
    await handle.whenIdle()
    return handle.confirmPersistence(AbortSignal.timeout(15000))
  })
  const checkpoint = await fetch(
    `${backendURL}/api/documents/${encodeURIComponent(id)}/bootstrap-checkpoint`
  )
  if (!checkpoint.ok)
    throw new Error(`Checkpoint unavailable: ${checkpoint.status}`)
  fs.writeFileSync(
    path.join(directory, 'checkpoint.json'),
    await checkpoint.text()
  )
  await page.evaluate(() => window.stopFixedDrawingObservation())
  await page.reload()
  await page.waitForFunction(
    async () =>
      (await import('/src/testing/runtime-access.ts'))
        .getActiveCollaborationHandle()
        ?.getStatus() === 'connected',
    null,
    { timeout: 30000 }
  )
  await page.keyboard.press('Meta+1')
  await page.screenshot({ path: path.join(directory, 'reload.png') })
  fs.writeFileSync(
    path.join(directory, 'reload-snapshot.json.gz'),
    gzipSync(JSON.stringify(await snapshot()))
  )
  meta.video = await saveRemoteRecording(
    context,
    page,
    path.join(directory, 'recording.webm')
  )
  context = undefined
} catch (error) {
  meta.failure = error.message
  process.exitCode = 1
  if (page && !page.isClosed()) {
    try {
      await page.screenshot({
        path: path.join(directory, 'failure.png'),
        timeout: 3000
      })
    } catch {
      /* retain original failure */
    }
  }
} finally {
  if (deadline) meta.deadline = await deadline.finish()
  if (context && page && !page.isClosed()) {
    try {
      meta.video = await saveRemoteRecording(
        context,
        page,
        path.join(directory, 'recording.webm')
      )
      context = undefined
    } catch {
      /* original failure remains */
    }
  }
  await context?.close().catch(() => undefined)
  await browser?.close().catch(() => undefined)
  await browserServer?.close().catch(() => undefined)
  for (const service of services.reverse()) {
    try {
      process.kill(-service.pid, 'SIGTERM')
    } catch (error) {
      if (error.code !== 'ESRCH') meta.errors.push(error.message)
    }
  }
  save()
  console.log(
    JSON.stringify({
      directory,
      outcome: meta.settlement?.outcome,
      failure: meta.failure,
      elapsedMs: meta.elapsedMs
    })
  )
}
