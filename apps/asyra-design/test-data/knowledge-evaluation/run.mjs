/* global document, AbortSignal, console */
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
import {
  createLiveTestDeadline,
  LIVE_TEST_LIMIT_MS
} from '../ai-drawing/live-test-deadline.mjs'

import { qualityScenario } from './quality.mjs'
import { saveRemoteRecording } from '../ai-drawing/remote-recording.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = path.resolve(here, '../..')
const root = path.resolve(app, '../..')
const [arm, caseId] = process.argv.slice(2)
if (
  ![
    'baseline',
    'candidate',
    'transfer',
    'diagnostic',
    'quality-control',
    'quality-knowledge'
  ].includes(arm)
) {
  throw new Error(
    'Expected baseline, candidate, transfer or diagnostic and a case ID'
  )
}
const cases = JSON.parse(fs.readFileSync(path.join(here, 'cases.json')))
const quality = arm.startsWith('quality-')
let selected = cases[arm === 'transfer' ? 'transfer' : 'development'].find(
  (value) => value.id === caseId
)
if (quality) {
  selected = qualityScenario(
    JSON.parse(fs.readFileSync(path.join(here, 'quality-cases.json'))),
    caseId
  )
}
if (!selected) {
  throw new Error('Unknown evaluation case')
}
const scenario = {
  ...selected,
  prompt:
    selected.prompt +
    (arm === 'diagnostic'
      ? ' Use available relevant Domain Knowledge to inform design decisions, treating it as advisory and preserving my requirements.'
      : '')
}
const limitMs = selected.deadlineMs ?? LIVE_TEST_LIMIT_MS
const environment = resolveEnvironment(loadEnvironment())
const services = JSON.parse(
  fs.readFileSync(path.join(root, 'tmp/knowledge-services.json'))
)
const vite = services.find((value) => value.name === 'vite')
if (
  !vite ||
  !execFileSync('lsof', ['-a', '-p', String(vite.pid), '-d', 'cwd', '-Fn'], {
    encoding: 'utf8'
  }).includes('n' + app + '\n')
) {
  throw new Error('Vite process ownership unavailable')
}
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
  viewport: { width: 1440, height: 900 },
  deadlineMs: limitMs,
  errors: [],
  statuses: []
}
meta.sources = Object.fromEntries(
  [
    'server/ai-domain-prompt.ts',
    'server/local-knowledge.ts',
    'knowledge/design.docs-page.md',
    'test-data/knowledge-evaluation/quality-cases.json',
    ...fs
      .readdirSync(path.join(root, 'domain-knowledge'))
      .filter((n) => n.endsWith('.md'))
      .map((n) => '../../domain-knowledge/' + n)
  ].map((name) => [
    name,
    createHash('sha256')
      .update(fs.readFileSync(path.resolve(app, name)))
      .digest('hex')
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
let ownedBrowser, context, deadline
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
    recordVideo: { dir: path.join(directory, 'video'), size: meta.viewport },
    deviceScaleFactor: 1
  })
  const page = await context.newPage()
  let unexpectedNavigation
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame() && meta.sentAt) {
      unexpectedNavigation = frame.url()
    }
  })
  page.on('pageerror', (error) => {
    meta.errors.push(error.message)
    save()
  })
  await page.goto(meta.url)
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(
    async () => {
      const { getActiveCollaborationHandle } =
        await import('/src/testing/runtime-access.ts')
      return getActiveCollaborationHandle()?.getStatus() === 'connected'
    },
    null,
    { timeout: 60000 }
  )
  await page.waitForFunction(
    async () => {
      const { core } = await import('/src/testing/runtime-access.ts')
      const id = core.getCurrentWorkspaceId()
      return Boolean(id && core.getElementData(id))
    },
    null,
    { timeout: 60000 }
  )
  if (scenario.seed) {
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
  }
  fs.writeFileSync(
    path.join(directory, 'before.json'),
    JSON.stringify(await snapshot(page))
  )
  await page.keyboard.press('Meta+1')
  await page.getByTestId('ai-agent-toolbar-button').click()
  await page
    .getByText('Local AI connected', { exact: true })
    .waitFor({ timeout: 60000 })
  await page.getByLabel('Message Agent').fill(scenario.prompt)
  meta.sentAt = new Date().toISOString()
  save()
  deadline = createLiveTestDeadline({
    deadlineAt: Date.parse(meta.sentAt) + limitMs,
    groups: [vite.pid],
    processes: [ownedBrowser.pid],
    evidencePath: path.join(directory, 'deadline.json')
  })
  await deadline.ready
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  let previous,
    first = false
  while (Date.now() - Date.parse(meta.sentAt) < limitMs) {
    if (unexpectedNavigation) {
      throw new Error(
        'Unexpected navigation during evaluation: ' + unexpectedNavigation
      )
    }
    const state = await page.evaluate(async () => {
      const { core } = await import('/src/testing/runtime-access.ts')
      return {
        outcome: [
          ...document.querySelectorAll('[data-testid="ai-agent-message"]')
        ]
          .at(-1)
          ?.getAttribute('data-outcome'),
        status: document.querySelector('[aria-label="Current activity"]')
          ?.textContent,
        count:
          core.getElementData(core.getCurrentWorkspaceId())?.children?.length ??
          0
      }
    })
    if (!first && state.count > (scenario.seed ? 3 : 0)) {
      first = true
      meta.firstContentMs = Date.now() - Date.parse(meta.sentAt)
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
      break
    }
    save()
    await page.waitForTimeout(1000)
  }
  const limit = await deadline.finish()
  meta.deadline = limit
  if (limit.status !== 'finished' || !meta.outcome) {
    throw new Error('Evaluation deadline exceeded')
  }
  meta.elapsedMs = Date.now() - Date.parse(meta.sentAt)
  await page.keyboard.press('Meta+1')
  await page.screenshot({ path: path.join(directory, 'final.png') })
  if (quality) {
    await page.evaluate(async () => {
      const { viewportApis } = await import('/src/common-apis/viewport.ts')
      const bounds = document
        .getElementById('viewport-anchor')
        .getBoundingClientRect()
      viewportApis.zoomToCenter(
        1,
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2
      )
    })
    await page.waitForTimeout(200)
    await page.screenshot({ path: path.join(directory, 'actual-size.png') })
    await page.keyboard.press('Meta+1')
  }
  meta.conversation = await page
    .getByTestId('ai-agent-message')
    .allTextContents()
  fs.writeFileSync(
    path.join(directory, 'after.json'),
    JSON.stringify(await snapshot(page))
  )
  meta.persistence = await page.evaluate(async () => {
    const { getActiveCollaborationHandle } =
      await import('/src/testing/runtime-access.ts')
    const handle = getActiveCollaborationHandle()
    await handle.whenIdle()
    return handle.confirmPersistence(AbortSignal.timeout(30000))
  })
  await page.waitForTimeout(10000)
  meta.video = await saveRemoteRecording(
    context,
    page,
    path.join(directory, 'recording.webm')
  )
  context = undefined
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
  if (meta.sentAt && !meta.outcome) {
    try {
      process.kill(-vite.pid, 'SIGTERM')
    } catch (stopError) {
      if (stopError.code !== 'ESRCH') {
        meta.stopFailure = stopError.message
      }
    }
  }
  meta.failure = error.message
  save()
  console.error(JSON.stringify({ directory, failure: error.message }))
  process.exitCode = 1
} finally {
  if (deadline) {
    await deadline.finish()
  }
  await context?.close()
  await ownedBrowser?.close()
  save()
}
