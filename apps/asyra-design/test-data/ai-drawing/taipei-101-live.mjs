/* global document, window, requestAnimationFrame, AbortSignal, fetch, performance, console */
/** Fixed drawing benchmark followed by the user-authorized report-only turn. */
import { isDeepStrictEqual } from 'node:util'
import {
  collectEvidenceStages,
  createReportWindow,
  collectSameThreadReport,
  createWorkPhaseObserver
} from './taipei-101-self-report.mjs'
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
  waitForRecordedDocument,
  readTaipei101Deadline
} from './taipei-101-live-contract.mjs'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const root = path.resolve(app, '../..')
const env = loadEnvironment({ ...process.env })

if (!env.APP_URL || env.AI_PROVIDER_BACKEND !== 'local-codex') {
  throw new Error('Configure APP_URL and the local provider in the App .env.')
}

const configured = resolveEnvironment(env)
const backendURL = env.DOCUMENT_PERSISTENCE_BACKEND_URL

if (!backendURL) {
  throw new Error('Missing document backend URL')
}

const { prompt, sha256 } = readTaipei101Prompt()
const deadlineMs = readTaipei101Deadline(process.argv.slice(2))
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
  deadlineMs,
  viewport: { width: 1920, height: 1080 },
  services,
  errors: [],
  evidenceErrors: [],
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
  if (!child.pid) {
    throw new Error(`Cannot start ${name}`)
  }

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
      if ((await fetch(url, { signal: AbortSignal.timeout(1500) })).ok) {
        return
      }
    } catch {
      /* bounded startup */
    }

    await sleep(250)
  }

  throw new Error(`Service did not become ready: ${url}`)
}

let browserServer, browser, context, page, deadline, workSnapshot

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
      if (error.message.startsWith('Service port')) {
        throw error
      }
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
    if (!new URL(request.url()).pathname.endsWith('/api/ai/action-batch')) {
      return
    }

    const body = request.postDataJSON()

    try {
      const submitted = assertTaipei101Submission(
        body,
        prompt,
        request.headers()
      )

      if (!submitted) {
        meta.receiptPosts ??= []
        meta.receiptPosts.push({
          at: Date.now(),
          bytes: Buffer.byteLength(request.postData() ?? '')
        })
        save()

        return
      }
    } catch (error) {
      meta.errors.push(error.message)
    }

    meta.submissions ??= []
    meta.submissions.push({
      at: Date.now(),
      phase: 'drawing',
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
  if ((await page.getByLabel('Message Agent').inputValue()) !== prompt) {
    throw new Error('Composer changed the fixed prompt')
  }

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
  meta.evaluationWindow = createReportWindow(meta.sentAt, deadlineMs)
  await page.evaluate((evaluationWindow) => {
    const url = new URL(window.location.href)

    url.searchParams.set('aiEvaluationWindow', JSON.stringify(evaluationWindow))
    window.history.replaceState(null, '', url)
  }, meta.evaluationWindow)
  deadline = createLiveTestDeadline({
    deadlineAt: meta.sentAt + deadlineMs + 30000,
    groups: [vite.pid],
    processes: [browserServer.process().pid],
    evidencePath: path.join(directory, 'deadline.json')
  })
  await deadline.ready
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  let lastStatus
  const observeWork = createWorkPhaseObserver(
    path.join(directory, 'provider-records')
  )

  for (;;) {
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
      meta.evidenceErrors.push(
        ...(await collectEvidenceStages([
          [
            'first-frame',
            async () => {
              await page.keyboard.press('Meta+1')
              await page.screenshot({ path: path.join(directory, 'first.png') })
            }
          ]
        ]))
      )
    }

    if (!meta.reportObservedAt) {
      const reporting = observeWork.poll()

      if (reporting) {
        meta.reportObservedAt = Date.now()
        meta.deadline ??= await deadline.finish()
        save()
        meta.evidenceErrors.push(
          ...(await collectEvidenceStages([
            [
              'work-snapshot',
              async () => {
                workSnapshot = await snapshot()
                fs.writeFileSync(
                  path.join(directory, 'work-snapshot.json.gz'),
                  gzipSync(JSON.stringify(workSnapshot))
                )
              }
            ]
          ]))
        )
      }
    }

    if (state.settlement) {
      meta.settlement = state.settlement
      break
    }

    save()
    await sleep(1000)
  }

  meta.elapsedMs = Date.now() - meta.sentAt
  meta.deadline ??= await deadline.finish()
  save()
  let final

  const collect = async (stage, action) => {
    meta.evidenceErrors.push(
      ...(await collectEvidenceStages([[stage, action]]))
    )
    save()
  }

  await collect('report', async () => {
    const recordDirectory = path.join(directory, 'provider-records')
    const matches = fs
      .readdirSync(recordDirectory)
      .filter((name) => name.endsWith('.jsonl'))
      .map((name) =>
        fs
          .readFileSync(path.join(recordDirectory, name), 'utf8')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      )
      .filter(
        (records) =>
          records[0]?.provider === 'local-codex' &&
          records[0]?.turnId === meta.submissions?.[0]?.metadata?.turnId
      )

    if (matches.length !== 1 || meta.submissions?.length !== 1) {
      throw new Error('Expected one App request and one native provider record')
    }

    const records = matches[0]
    const report = collectSameThreadReport(records, (name) =>
      JSON.parse(fs.readFileSync(path.join(recordDirectory, name), 'utf8'))
    )
    const workEnd = records.find(
      (record) =>
        record.stage === 'host_observation' &&
        record.evidence?.callId === 'evaluation-work-settled'
    )
    const reportEnd = records.find(
      (record) =>
        record.stage === 'host_observation' &&
        record.evidence?.callId === 'evaluation-report' &&
        record.evidence?.phase === 'output'
    )

    meta.selfReport = {
      status: 'collected',
      nativeThreadId: report.nativeThreadId,
      nativeTurnId: report.nativeTurnId,
      workNativeTurnId: report.work.nativeTurnId,
      workStatus: report.work.status,
      stoppedAtDeadline: report.work.stoppedAtDeadline,
      workElapsedMs: workEnd?.elapsedMs,
      reportElapsedMs: reportEnd?.elapsedMs - workEnd?.elapsedMs
    }
    fs.writeFileSync(path.join(directory, 'self-report.txt'), report.text)
    fs.writeFileSync(
      path.join(directory, 'self-report-evidence.json'),
      JSON.stringify(report, null, 2)
    )
  })
  await collect('source', async () => {
    final = await snapshot()

    meta.counts = final.counts
    fs.writeFileSync(
      path.join(directory, 'source-snapshot.json.gz'),
      gzipSync(JSON.stringify(final))
    )
    meta.conversation = await page
      .getByTestId('ai-agent-message')
      .allTextContents()
    meta.requiresUserAnswer =
      (await page
        .getByText('Waiting for your answer', { exact: true })
        .count()) > 0
  })
  await collect('report-receipt', async () => {
    const summary = await page.evaluate(async () => {
      const { getActiveAiDrawingPerformanceProfile } =
        await import('/src/testing/runtime-access.ts')
      const { projectEvaluationReport } =
        await import('/src/ai/evaluation-window.ts')

      return projectEvaluationReport(
        getActiveAiDrawingPerformanceProfile()
          .readConversationSnapshot()
          .settledTurns.at(-1)
      )
    })

    if (
      !summary ||
      summary.turnId !== meta.submissions?.[0]?.metadata?.turnId
    ) {
      throw new Error('Missing or mismatched settled evaluation report receipt')
    }

    if (!final || !meta.selfReport) {
      throw new Error('Missing canonical content or retained report')
    }

    const turn = final.conversation.settledTurns.at(-1)

    fs.writeFileSync(
      path.join(directory, 'self-report-summary.txt'),
      summary.text
    )
    fs.writeFileSync(
      path.join(directory, 'self-report-turn.json'),
      JSON.stringify(turn, null, 2)
    )
    meta.selfReport.documentUnchanged =
      !!workSnapshot && isDeepStrictEqual(workSnapshot.document, final.document)
    if (!meta.selfReport.documentUnchanged) {
      throw new Error('Report-phase document equality unavailable or failed')
    }

    meta.selfReport.status = 'completed'
  })
  await collect('persistence', async () => {
    meta.persistence = await page.evaluate(async () => {
      const handle = (
        await import('/src/testing/runtime-access.ts')
      ).getActiveCollaborationHandle()

      await handle.whenIdle()

      return handle.confirmPersistence(AbortSignal.timeout(15000))
    })
  })
  await collect('checkpoint', async () => {
    const checkpoint = await fetch(
      `${backendURL}/api/documents/${encodeURIComponent(id)}/bootstrap-checkpoint`,
      { signal: AbortSignal.timeout(15000) }
    )

    if (!checkpoint.ok) {
      throw new Error(`Checkpoint unavailable: ${checkpoint.status}`)
    }

    fs.writeFileSync(
      path.join(directory, 'checkpoint.json'),
      await checkpoint.text()
    )
  })
  await collect('overview', async () => {
    await page.keyboard.press('Meta+1')
    await page.screenshot({ path: path.join(directory, 'final.png') })
  })
  meta.detailViews = []
  for (const [name, fraction, nativeScale] of [
    ['spire', 0.08, false],
    ['tiers', 0.5, false],
    ['base', 0.92, false],
    ['native-detail', 0.5, true]
  ]) {
    await collect(`detail-${name}`, async () => {
      const view = await page.evaluate(
        async ({ fraction, nativeScale }) => {
          const { core } = await import('/src/testing/runtime-access.ts')
          const { viewportApis } = await import('/src/common-apis/viewport.ts')

          viewportApis.zoomFit()
          const bounds = core.getAllElementsBounds()
          const viewport = document
            .getElementById('viewport-anchor')
            ?.getBoundingClientRect()

          if (!bounds || !viewport) {
            return null
          }

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
      } else {
        throw new Error('Missing drawing bounds for detail capture')
      }
    })
  }

  await collect('report-screenshot', async () => {
    await page.screenshot({ path: path.join(directory, 'self-report.png') })
  })
  await collect('reload', async () => {
    if (!final) {
      throw new Error('Missing source snapshot for reload comparison')
    }

    await page.reload()
    await waitForRecordedDocument(
      page,
      Object.values(final.counts).reduce((sum, count) => sum + count, 0)
    )
    await page.keyboard.press('Meta+1')
    await page.screenshot({ path: path.join(directory, 'reload.png') })
    const reloaded = await snapshot()

    fs.writeFileSync(
      path.join(directory, 'reload-snapshot.json.gz'),
      gzipSync(JSON.stringify(reloaded))
    )
    meta.reloadDocumentUnchanged = isDeepStrictEqual(
      final.document,
      reloaded.document
    )
    if (!meta.reloadDocumentUnchanged) {
      throw new Error('Reload canonical document changed')
    }
  })
  if (meta.evidenceErrors.length) {
    meta.failure = 'Evidence collection incomplete; see evidenceErrors'
    process.exitCode = 1
  }
} catch (error) {
  meta.failure = error.message
  process.exitCode = 1
  if (deadline) {
    meta.deadline ??= await deadline.finish()
  }

  save()
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
  if (deadline) {
    meta.deadline ??= await deadline.finish()
  }

  if (context && page) {
    try {
      meta.video = await saveRemoteRecording(
        context,
        page,
        path.join(directory, 'recording.webm')
      )
      context = undefined
    } catch (error) {
      meta.evidenceErrors.push({ stage: 'video', error: error.message })
      meta.failure ??= 'Video evidence collection failed'
      process.exitCode = 1
    }
  }

  await context?.close().catch(() => undefined)
  await browser?.close().catch(() => undefined)
  await browserServer?.close().catch(() => undefined)
  for (const service of services.reverse()) {
    try {
      process.kill(-service.pid, 'SIGTERM')
    } catch (error) {
      if (error.code !== 'ESRCH') {
        meta.errors.push(error.message)
      }
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
