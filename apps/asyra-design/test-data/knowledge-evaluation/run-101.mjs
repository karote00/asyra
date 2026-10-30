/* global window */
/* global document, console, URL, location, history */
/** Manual real-provider evaluation. Never imported by ordinary test/CI runners. */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { launchCaptureBrowser } from './capture-browser.mjs'
import { loadEnvironment, resolveEnvironment } from '../../app-environment.mjs'
import { createLiveTestDeadline } from '../ai-drawing/live-test-deadline.mjs'

import { captureCheckpoint } from './checkpoint.mjs'
import { captureNativeBoundaries } from './native-boundaries.mjs'
import {
  boundedCapture,
  collectEvidenceStage,
  readEvaluationReport,
  captureEvaluationReport,
  captureReportImage,
  captureReload,
  captureSessionOnPage,
  waitForCaptureReady
} from './capture-lifecycle.mjs'
import {
  captureSources,
  verifyEvaluationService,
  captureRequestIdentity
} from './capture-source.mjs'
import {
  architectureScenario,
  observationDeadline,
  evaluationArtifactBudget
} from './architecture-protocol.mjs'

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { installRecordingObserver } = require('./observer-101.cjs')
const { createRecordingBoundsFit } = require('./fit-101.cjs')

const here = path.dirname(fileURLToPath(import.meta.url))
const app = path.resolve(here, '../..')
const root = path.resolve(app, '../..')
const [arm, ...deadlineArguments] = process.argv.slice(2)
if (arm !== 'quality-knowledge') throw new Error('Unknown 101 arm')
const caseId = 'taipei-101'
const specification = JSON.parse(
  fs.readFileSync(path.join(here, 'architecture-101.json'))
)
const scenario = architectureScenario(specification)
const expandedNodeLimit = evaluationArtifactBudget(deadlineArguments)
const limitMs = observationDeadline(
  specification,
  deadlineArguments.filter(
    (value) => !value.startsWith('--expanded-node-limit')
  )
)
const environment = resolveEnvironment(loadEnvironment())
const services = JSON.parse(
  fs.readFileSync(path.join(root, 'tmp/knowledge-services.json'))
)
const vite = services.find((value) => value.name === 'vite')
const producer = verifyEvaluationService(vite, app)
const id = `knowledge-${arm}-${caseId}-${Date.now()}`
const directory = path.join(root, 'tmp/knowledge-evaluation', id)
fs.mkdirSync(directory, { recursive: true })
const meta = {
  id,
  arm,
  caseId,
  prompt: scenario.prompt,
  url: environment.appURL + '/?fileId=' + id,
  head: execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8'
  }).trim(),
  startedAt: new Date().toISOString(),
  viewport: { width: 1920, height: 1080 },
  deadlineMs: limitMs,
  reportTimeoutMs: 60000,
  artifactBudget: {
    productionExpandedNodes: 10000,
    effectiveExpandedNodes: expandedNodeLimit ?? 10000,
    scope: expandedNodeLimit ? 'evaluation-request' : 'production-default'
  },
  video: {
    status: 'disabled',
    reason: 'User requested diagnostics without video'
  },
  declaredToolLibraryDirectory: process.env.AI_TOOL_LIBRARY_DIR,
  configurationEvidence:
    'Expected configuration only; actual provider configuration requires execution-record verification',
  expectedModel: {
    model: process.env.AI_PROVIDER_MODEL?.trim() || 'gpt-6-astra',
    effort: 'medium'
  },
  producer,
  recordingDirectory: path.resolve(
    app,
    process.env.AI_EXECUTION_RECORD_DIR?.trim() || 'tmp/ai-executions'
  ),
  sourceRequestIds: [],
  errors: [],
  statuses: []
}
meta.sourceManifest = captureSources(
  root,
  path.join(directory, 'source-snapshot.json.gz')
)
meta.sources = Object.fromEntries(
  Object.entries(meta.sourceManifest.files).map(([name, value]) => [
    name,
    value.sha256 ?? null
  ])
)
const save = () =>
  fs.writeFileSync(
    path.join(directory, 'run.json'),
    JSON.stringify(meta, null, 2)
  )
const snapshot = async (page) =>
  page.evaluate(async () => {
    const { core, getActiveCollaborationHandle } =
      await import('/src/testing/runtime-access.ts')
    const elements = Object.fromEntries(
      [...core.deps.sceneTree.getAllElements()].map(([id]) => [
        id,
        core.getElementData(id)
      ])
    )
    return {
      elements,
      document: await core.save(),
      session: getActiveCollaborationHandle()?.getSessionState()
    }
  })
const stage = (name, task) => collectEvidenceStage(meta, name, task, save)
let ownedBrowser,
  context,
  deadline,
  page,
  generationSettled = false,
  report

try {
  ownedBrowser = await launchCaptureBrowser({
    chromium,
    evidencePath: path.join(directory, 'cleanup-stop.json'),
    record: (event) => {
      ;(meta.browserLifecycle ??= []).push(event)
      save()
    }
  })
  context = await ownedBrowser.newContext({
    viewport: meta.viewport,
    deviceScaleFactor: 1
  })
  page = await context.newPage()
  page.on('request', (request) => {
    if (!meta.sentAt) return
    try {
      const id = captureRequestIdentity(request, environment.appURL)
      if (id) {
        meta.sourceRequestIds.push(id)
        save()
      }
    } catch (error) {
      meta.requestIdentityFailure = error.message
      save()
    }
  })
  page.setDefaultTimeout(30000)
  page.setDefaultNavigationTimeout(30000)
  let unexpectedNavigation
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame() && meta.sentAt)
      unexpectedNavigation = frame.url()
  })
  page.on('pageerror', (error) => {
    meta.errors.push(error.message)
    save()
  })
  await page.goto(meta.url)
  await page.waitForLoadState('networkidle')
  await boundedCapture(
    'initial session readiness',
    (signal) => waitForCaptureReady(page, signal),
    60000
  )
  if (scenario.seed)
    meta.seed = await page.evaluate(async () => {
      const { core } = await import('/src/testing/runtime-access.ts')
      const { transactionApis } = await import('/src/common-apis')
      return transactionApis.runTransaction(() =>
        core.createElementsInParent(
          ['Keep Left', 'Target', 'Keep Right'].map((name, i) => ({
            type: 'rect',
            name,
            x: 120 + i * 160,
            y: 180,
            width: 80,
            height: 60
          })),
          core.getCurrentWorkspaceId()
        )
      )
    })
  fs.writeFileSync(
    path.join(directory, 'before.json'),
    JSON.stringify(
      await boundedCapture('initial snapshot', () => snapshot(page))
    )
  )
  await page.keyboard.press('Meta+1')
  await page.getByTestId('ai-agent-toolbar-button').click()
  await page
    .getByText('Local AI connected', { exact: true })
    .waitFor({ timeout: 60000 })
  await page.getByLabel('Choose images').setInputFiles(
    specification.attachments.map((a) => {
      const filename = path.resolve(here, a.path)
      if (
        createHash('sha256').update(fs.readFileSync(filename)).digest('hex') !==
        a.sha256
      )
        throw new Error('Reference hash mismatch')
      return filename
    })
  )
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[aria-label="Attached images"] img').length ===
      2
  )
  meta.attachments = specification.attachments
  await page.evaluate(async (source) => {
    const { core } = await import('/src/testing/runtime-access.ts')
    window.__qualityObserver = (0, eval)('(' + source + ')')(core)
  }, installRecordingObserver.toString())
  const fit = createRecordingBoundsFit(async (event) => {
    await page.keyboard.press('Meta+1')
    meta.fits ??= []
    meta.fits.push({ at: Date.now(), ...event })
  })
  await page.getByLabel('Message Agent').fill(scenario.prompt)
  if (captureSources(root).digest !== meta.sourceManifest.digest)
    throw new Error('Source changed before Send')
  verifyEvaluationService(vite, app)
  const sentAt = new Date().toISOString()
  meta.evaluationWindow = {
    workDeadlineAt: Date.parse(sentAt) + limitMs,
    reportTimeoutMs: meta.reportTimeoutMs,
    ...(expandedNodeLimit === undefined ? {} : { expandedNodeLimit })
  }
  await page.evaluate((evaluationWindow) => {
    const url = new URL(location.href)
    url.searchParams.set('aiEvaluationWindow', JSON.stringify(evaluationWindow))
    history.replaceState(null, '', url)
  }, meta.evaluationWindow)
  meta.sentAt = sentAt
  save()
  deadline = createLiveTestDeadline({
    deadlineAt:
      meta.evaluationWindow.workDeadlineAt + meta.reportTimeoutMs + 30000,
    groups: [vite.pid],
    processes: [ownedBrowser.pid],
    evidencePath: path.join(directory, 'deadline.json')
  })
  await deadline.ready
  const duringGeneration = (task) =>
    boundedCapture(
      'generation operation',
      task,
      Math.max(
        1,
        meta.evaluationWindow.workDeadlineAt +
          meta.reportTimeoutMs +
          2000 -
          Date.now()
      )
    )
  await duringGeneration(() =>
    page.getByRole('button', { name: 'Send', exact: true }).click()
  )
  let previous,
    first = false
  while (
    Date.now() <
    meta.evaluationWindow.workDeadlineAt + meta.reportTimeoutMs + 2000
  ) {
    if (meta.requestIdentityFailure)
      throw new Error(meta.requestIdentityFailure)
    if (unexpectedNavigation)
      throw new Error(
        'Unexpected navigation during evaluation: ' + unexpectedNavigation
      )
    const state = await duringGeneration(() =>
      page.evaluate(async () => {
        const { core } = await import('/src/testing/runtime-access.ts')
        return {
          outcome: [
            ...document.querySelectorAll('[data-testid="ai-agent-message"]')
          ]
            .at(-1)
            ?.getAttribute('data-outcome'),
          observation: window.__qualityObserver.snapshot(),
          status: document.querySelector('[aria-label="Current activity"]')
            ?.textContent,
          count:
            core.getElementData(core.getCurrentWorkspaceId())?.children
              ?.length ?? 0
        }
      })
    )
    if (state.observation.errors.length)
      throw new Error(JSON.stringify(state.observation.errors))
    await duringGeneration(() => fit(state.observation.bounds))
    if (!first && state.observation.bounds) {
      first = true
      meta.firstContentMs = Date.now() - Date.parse(meta.sentAt)
      await duringGeneration(() =>
        page.screenshot({ path: path.join(directory, 'first.png') })
      )
    }
    if (state.status !== previous) {
      previous = state.status
      meta.statuses.push({ at: new Date().toISOString(), text: state.status })
    }
    if (
      ['success', 'failed', 'partial', 'cancelled', 'no-change'].includes(
        state.outcome
      )
    ) {
      meta.outcome = state.outcome
      meta.outcomeObservedAt = new Date().toISOString()
      break
    }
    save()
    await page.waitForTimeout(1000)
  }
  // The work cutoff is enforced by provider cancellation and browser mutation admission.
  // The external watchdog remains armed while collecting the independent report.
  try {
    report = await boundedCapture(
      'settled report',
      () => readEvaluationReport(page, meta.sourceRequestIds),
      5000
    )
  } catch (error) {
    meta.reportDeliveryFailure = error.message
    save()
  }
  await captureEvaluationReport({
    meta,
    report,
    writeText: (text) =>
      fs.writeFileSync(path.join(directory, 'self-report.txt'), text),
    captureImage: () =>
      captureReportImage(page, report, path.join(directory, 'self-report.png')),
    save
  })
  if (!meta.outcome)
    throw new Error('Evaluation report did not settle before its deadline')
  meta.deadline = await deadline.finish()
  generationSettled = meta.deadline.status === 'finished'
  if (!generationSettled) throw new Error('Evaluation outer watchdog expired')
  if (!meta.sourceRequestIds.length || meta.requestIdentityFailure)
    throw new Error(
      meta.requestIdentityFailure ?? 'Missing observed provider request'
    )
  meta.elapsedMs = Date.now() - Date.parse(meta.sentAt)
  meta.generation = {
    status: meta.outcome,
    elapsedMs: meta.elapsedMs,
    limitation:
      'UI settlement includes reporting; use provider work-turn events for drawing outcome'
  }
  meta.work = {
    deadlineAt: meta.evaluationWindow.workDeadlineAt,
    budgetMs: limitMs
  }
  meta.reporting = {
    timeoutMs: meta.reportTimeoutMs,
    captured: Boolean(meta.selfReport?.imageSaved)
  }
  save()
  const conversation = await stage('final-view', () =>
    boundedCapture('final view', async () => {
      await page.keyboard.press('Meta+1')
      await page.screenshot({ path: path.join(directory, 'final.png') })
      return page.getByTestId('ai-agent-message').allTextContents()
    })
  )
  if (conversation) meta.conversation = conversation
  const captured = await stage('persistence', () => captureSessionOnPage(page))
  if (captured) {
    meta.persistence = captured.receipt
    meta.finalRoots = captured.roots
    const backend = services.find(
      (service) => service.name === 'document-backend'
    )
    meta.checkpoint = await stage('checkpoint', () =>
      captureCheckpoint({
        url: `http://127.0.0.1:${backend.port}/api/documents/${encodeURIComponent(id)}/bootstrap-checkpoint`,
        filename: path.join(directory, 'checkpoint.json'),
        receipt: meta.persistence
      })
    )
  }
  const workContextClosed = await stage('close-work-context', () =>
    boundedCapture(
      'close work context',
      async () => {
        await context.close()
        return true
      },
      5000
    )
  )
  if (workContextClosed) context = undefined
  await stage(captured ? 'reload' : 'read-only-recovery', () => {
    if (!workContextClosed)
      throw new Error('Work context closure was not confirmed before reload')
    return captureReload({
      browser: ownedBrowser,
      viewport: meta.viewport,
      url: meta.url,
      captured,
      capturePage: captureSessionOnPage,
      screenshotPath: path.join(
        directory,
        captured ? 'reload.png' : 'recovery.png'
      ),
      recordCleanup: (task) => stage('cleanup-reload-context', task)
    })
  })
  await stage('source-verification', async () => {
    const actual = captureSources(root)
    if (actual.digest !== meta.sourceManifest.digest)
      throw new Error('Source changed during evaluation')
    return { digest: actual.digest }
  })
  if (Object.values(meta.evidence).some((value) => value.status === 'failed'))
    process.exitCode = 1
  save()
  console.log(
    JSON.stringify({
      directory,
      outcome: meta.outcome,
      elapsedMs: meta.elapsedMs,
      errors: meta.errors
    })
  )
} catch (error) {
  if (deadline && !generationSettled) {
    try {
      meta.deadline = await boundedCapture(
        'generation stop',
        () => deadline.stop('collector-failure'),
        10000
      )
    } catch (stopError) {
      meta.stopFailure = stopError.message
    }
  }
  meta.elapsedMs ??= meta.sentAt
    ? Date.now() - Date.parse(meta.sentAt)
    : undefined
  meta.failure = error.message
  save()
  console.error(JSON.stringify({ directory, failure: error.message }))
  process.exitCode = 1
} finally {
  if (deadline && !generationSettled) {
    try {
      meta.deadline = await boundedCapture(
        'generation settlement',
        () => deadline.stop('collector-failure'),
        10000
      )
    } catch (error) {
      meta.stopFailure ??= error.message
    }
  }
  for (const [name, resource] of [
    ['context', context],
    ['browser', ownedBrowser]
  ]) {
    if (!resource) continue
    await stage(`cleanup-${name}`, () =>
      name === 'browser'
        ? resource.close()
        : boundedCapture(name, () => resource.close(), 5000)
    )
  }
  await stage('native-diagnostic-boundaries', async () => {
    meta.nativeBoundaryEvidence = captureNativeBoundaries(meta, directory)
    return meta.nativeBoundaryEvidence
  })
  if (
    Object.values(meta.evidence ?? {}).some(
      (value) => value.status === 'failed'
    ) ||
    meta.stopFailure
  )
    process.exitCode = 1
  save()
}
