/* global URL, document, location, history, console, window */
/** Explicitly authorized live diagnostic only; importing never invokes a model. */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { architectureScenario } from './architecture-protocol.mjs'
import { chromium } from 'playwright'
import { loadEnvironment, resolveEnvironment } from '../../app-environment.mjs'
import { launchCaptureBrowser } from './capture-browser.mjs'
import { createLiveTestDeadline } from '../ai-drawing/live-test-deadline.mjs'
import {
  boundedCapture,
  waitForCaptureReady,
  readEvaluationReport,
  captureReportImage
} from './capture-lifecycle.mjs'
import {
  captureSources,
  captureRequestIdentity,
  verifyEvaluationService
} from './capture-source.mjs'

export const consultationPrompts = [
  '我要設計一張玻璃與金屬構成的建築插畫。請先提出構圖、立面與材質方向，這一步先不要繪製。',
  '沿用剛才的方向，進一步說明玻璃與金屬的反射、明暗層次，以及如何檢查材質是否一致，先不要繪製。'
]

const require = createRequire(import.meta.url)
const { installRecordingObserver } = require('./observer-101.cjs')
const { createRecordingBoundsFit } = require('./fit-101.cjs')

export function consultationScenario(args) {
  if (!args.length)
    return { id: 'consultation', prompts: consultationPrompts, attachments: [] }
  if (args.length !== 1 || args[0] !== '--scenario=architecture-101')
    throw new Error('Unknown continuity scenario')
  const specification = JSON.parse(
    fs.readFileSync(new URL('./architecture-101.json', import.meta.url))
  )
  return {
    id: 'taipei-101-continuity',
    attachments: specification.attachments,
    prompts: [
      architectureScenario(specification).prompt +
        '\n\nFor this first turn, deliver an initial editable pass of the full tower, then finish your response describing what you actually completed and what remains. We will refine the existing drawing in a follow-up. Both turns together have at most two minutes of work; do not wait for a perfect final illustration before handing back the initial pass.',
      'Continue from the drawing and direction you just established. Keep the existing geometry, object identities, viewpoint and composition. Refine only the existing glass and metal material contrast so their reflections and light/dark hierarchy are easier to distinguish. Do not rebuild the tower or add another copy. Describe the changes you actually made and any remaining limitations.'
    ]
  }
}

// Keep one absolute work clock across both ordinary App requests, including
// ordinary predecessor capture. Only the final request enters reporting.
export async function runConsultationPhases({
  now,
  workDeadlineAt,
  reportTimeoutMs = 60000,
  runTurn,
  prompts = consultationPrompts
}) {
  const turns = []
  for (const [index, prompt] of prompts.entries()) {
    if (now() >= workDeadlineAt) return { turns, stopped: 'work-deadline' }
    const evaluationWindow =
      index === prompts.length - 1
        ? { workDeadlineAt, reportTimeoutMs }
        : undefined
    const turn = await runTurn({
      index,
      prompt,
      workDeadlineAt,
      evaluationWindow
    })
    turns.push(turn)
    if (!turn.settled || !turn.resultSaved)
      return { turns, stopped: 'incomplete-turn' }
    if (!['success', 'no-change', 'partial'].includes(turn.outcome))
      return { turns, stopped: 'non-successful-turn' }
    if (turn.outcome === 'partial') {
      const hasFollowUp = index < prompts.length - 1
      if (
        !turn.documentPath ||
        (hasFollowUp &&
          (!turn.inputIdle ||
            !turn.sourceRequestIds?.length ||
            !turn.answer?.turnId ||
            !turn.answer.text?.trim() ||
            turn.answer.attribution !== 'ordinary-assistant-answer'))
      )
        return { turns, stopped: 'incomplete-turn' }
    }
  }
  return { turns, stopped: 'completed' }
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const app = path.resolve(here, '../..'),
    root = path.resolve(app, '../..')
  const scenario = consultationScenario(process.argv.slice(2))
  const environment = resolveEnvironment(loadEnvironment())
  const services = JSON.parse(
    fs.readFileSync(path.join(root, 'tmp/knowledge-services.json'))
  )
  const vite = services.find((s) => s.name === 'vite')
  const producer = verifyEvaluationService(vite, app)
  const id = `knowledge-${scenario.id}-${Date.now()}`
  const directory = path.join(root, 'tmp/knowledge-evaluation', id)
  fs.mkdirSync(directory, { recursive: true })
  const meta = {
    id,
    prompts: scenario.prompts,
    caseId: scenario.id,
    artifactBudget: {
      productionExpandedNodes: 10000,
      effectiveExpandedNodes: 10000
    },
    producer,
    startedAt: new Date().toISOString(),
    workBudgetMs: 120000,
    reportTimeoutMs: 60000,
    video: { status: 'disabled' },
    expectedModel: { model: 'gpt-6-astra', effort: 'medium' },
    recordingDirectory: path.resolve(
      app,
      process.env.AI_EXECUTION_RECORD_DIR || 'tmp/ai-executions'
    ),
    sourceRequestIds: [],
    turns: [],
    errors: [],
    statuses: [],
    browserLifecycle: [],
    limitation:
      'Two App messages are not necessarily one native thread or Knowledge session. The predecessor remains an ordinary answer; only the final request reports. No overlapping reads means reuse is unobserved.'
  }
  const save = () =>
    fs.writeFileSync(
      path.join(directory, 'run.json'),
      JSON.stringify(meta, null, 2)
    )
  meta.sourceManifest = captureSources(
    root,
    path.join(directory, 'source-snapshot.json.gz')
  )
  save()
  console.log(JSON.stringify({ directory }))
  let owned,
    context,
    page,
    deadline,
    settled = false
  const state = () =>
    page.evaluate(async () => {
      const { core } = await import('/src/testing/runtime-access.ts')
      return {
        document: await core.save(),
        ids: [...core.deps.sceneTree.getAllElements().keys()]
      }
    })
  try {
    owned = await launchCaptureBrowser({
      chromium,
      evidencePath: path.join(directory, 'cleanup-stop.json'),
      record: (e) => {
        meta.browserLifecycle.push(e)
        save()
      }
    })
    context = await owned.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    })
    page = await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('pageerror', (error) => {
      meta.errors.push(error.message)
      save()
    })
    page.on('request', (request) => {
      if (!meta.sentAt) return
      try {
        const requestId = captureRequestIdentity(request, environment.appURL)
        if (requestId) {
          meta.sourceRequestIds.push(requestId)
          save()
        }
      } catch (error) {
        meta.requestIdentityFailure = error.message
        save()
      }
    })
    await page.goto(`${environment.appURL}/?fileId=${id}`, { timeout: 60000 })
    await boundedCapture(
      'initial readiness',
      (signal) => waitForCaptureReady(page, signal),
      60000
    )
    fs.writeFileSync(
      path.join(directory, 'before.json'),
      JSON.stringify(await state())
    )
    await page.getByTestId('ai-agent-toolbar-button').click()
    await page
      .getByText('Local AI connected', { exact: true })
      .waitFor({ timeout: 60000 })
    if (scenario.attachments.length) {
      await page.getByLabel('Choose images').setInputFiles(
        scenario.attachments.map((attachment) => {
          const filename = path.resolve(here, attachment.path)
          if (
            createHash('sha256')
              .update(fs.readFileSync(filename))
              .digest('hex') !== attachment.sha256
          )
            throw new Error('Reference hash mismatch')
          return filename
        })
      )
      await page.waitForFunction(
        (count) =>
          document.querySelectorAll('[aria-label="Attached images"] img')
            .length === count,
        scenario.attachments.length
      )
      meta.attachments = scenario.attachments
    }
    await page.evaluate(async (source) => {
      const { core } = await import('/src/testing/runtime-access.ts')
      window.__qualityObserver = (0, eval)('(' + source + ')')(core)
    }, installRecordingObserver.toString())
    const fit = createRecordingBoundsFit(async () =>
      page.keyboard.press('Meta+1')
    )
    await page.screenshot({ path: path.join(directory, 'before.png') })
    if (captureSources(root).digest !== meta.sourceManifest.digest)
      throw new Error('Source changed before Send')
    verifyEvaluationService(vite, app)
    const started = Date.now()
    meta.sentAt = new Date(started).toISOString()
    meta.workDeadlineAt = started + meta.workBudgetMs
    const outerDeadlineAt = meta.workDeadlineAt + meta.reportTimeoutMs
    deadline = createLiveTestDeadline({
      deadlineAt: meta.workDeadlineAt,
      groups: [vite.pid],
      processes: [owned.pid],
      evidencePath: path.join(directory, 'deadline.json')
    })
    await deadline.ready
    save()
    const result = await runConsultationPhases({
      now: Date.now,
      prompts: scenario.prompts,
      workDeadlineAt: meta.workDeadlineAt,
      reportTimeoutMs: meta.reportTimeoutMs,
      runTurn: async ({ index, prompt, workDeadlineAt, evaluationWindow }) => {
        if (evaluationWindow) {
          meta.predecessorDeadline = await deadline.finish()
          if (meta.predecessorDeadline.status !== 'finished')
            throw new Error('Predecessor exceeded the shared work deadline')
          deadline = createLiveTestDeadline({
            deadlineAt: outerDeadlineAt + 30000,
            groups: [vite.pid],
            processes: [owned.pid],
            evidencePath: path.join(directory, 'deadline.json')
          })
          await deadline.ready
        }
        const turn = {
          index,
          prompt,
          startedAt: Date.now(),
          mode: evaluationWindow ? 'final-report' : 'ordinary-answer',
          settled: false,
          resultSaved: false
        }
        meta.turns.push(turn)
        save()
        const requestOffset = meta.sourceRequestIds.length
        const messagesBefore = await page
          .getByTestId('ai-agent-message')
          .count()
        await page.evaluate((evaluationWindow) => {
          const url = new URL(location.href)
          if (evaluationWindow) {
            url.searchParams.set(
              'aiEvaluationWindow',
              JSON.stringify(evaluationWindow)
            )
          } else {
            url.searchParams.delete('aiEvaluationWindow')
          }
          history.replaceState(null, '', url)
        }, evaluationWindow ?? null)
        await page.getByLabel('Message Agent').fill(prompt)
        if (Date.now() >= workDeadlineAt)
          throw new Error('Work deadline before Send')
        await page.getByRole('button', { name: 'Send', exact: true }).click()
        let previous
        while (Date.now() < outerDeadlineAt) {
          const observed = await boundedCapture(
            'turn observation',
            () =>
              page.evaluate(() => ({
                observation: window.__qualityObserver.snapshot(),
                outcomes: [
                  ...document.querySelectorAll(
                    '[data-testid="ai-agent-message"]'
                  )
                ].map((el) => el.getAttribute('data-outcome')),
                activity: document.querySelector(
                  '[aria-label="Current activity"]'
                )?.textContent
              })),
            Math.max(1, Math.min(5000, outerDeadlineAt - Date.now()))
          )
          meta.observation = observed.observation
          if (observed.observation.errors.length)
            throw new Error(JSON.stringify(observed.observation.errors))
          await fit(observed.observation.bounds)
          if (
            meta.firstContentMs === undefined &&
            observed.observation.bounds
          ) {
            meta.firstContentMs = Date.now() - started
            save()
            await page.screenshot({ path: path.join(directory, 'first.png') })
          }
          if (observed.activity !== previous) {
            previous = observed.activity
            meta.statuses.push({ index, at: Date.now(), text: previous })
            save()
          }
          if (meta.requestIdentityFailure)
            throw new Error(meta.requestIdentityFailure)
          if (observed.outcomes.length > messagesBefore) {
            const outcome = observed.outcomes.at(-1)
            if (
              [
                'success',
                'no-change',
                'failed',
                'partial',
                'cancelled'
              ].includes(outcome)
            ) {
              turn.settled = true
              turn.outcome = outcome
              break
            }
          }
          await page.waitForTimeout(200)
        }
        turn.finishedAt = Date.now()
        const documentPath = `turn-${index + 1}-document.json`
        fs.writeFileSync(
          path.join(directory, documentPath),
          JSON.stringify(await state())
        )
        turn.documentPath = documentPath
        turn.sourceRequestIds = meta.sourceRequestIds.slice(requestOffset)
        if (!turn.settled)
          throw new Error('Turn/report exceeded shared deadline')
        fs.writeFileSync(
          path.join(directory, `turn-${index + 1}-messages.json`),
          JSON.stringify(
            await page.getByTestId('ai-agent-message').allTextContents(),
            null,
            2
          )
        )
        await page.screenshot({
          path: path.join(directory, `turn-${index + 1}.png`)
        })
        try {
          if (!evaluationWindow) {
            const message = page.getByTestId('ai-agent-message').last()
            const text = await message
              .getByTestId('ai-agent-result')
              .textContent()
            const turnId = await message.getAttribute('data-turn-id')
            if (!text?.trim() || !turnId || !turn.sourceRequestIds.length)
              throw new Error('Ordinary predecessor answer unavailable')
            if (await message.getAttribute('data-evaluation-report'))
              throw new Error('Evaluation report replaced ordinary predecessor')
            fs.writeFileSync(
              path.join(directory, `turn-${index + 1}-answer.txt`),
              text
            )
            turn.answer = {
              text,
              turnId,
              attribution: 'ordinary-assistant-answer'
            }
            turn.inputIdle =
              (await page.getByLabel('Choose images').isEnabled()) &&
              (await page
                .getByRole('button', { name: 'Cancel request', exact: true })
                .count()) === 0
            turn.resultSaved = true
            save()
            return turn
          }
          const report = await readEvaluationReport(page, turn.sourceRequestIds)
          fs.writeFileSync(
            path.join(directory, `turn-${index + 1}-report.txt`),
            report.text
          )
          await captureReportImage(
            page,
            report,
            path.join(directory, `turn-${index + 1}-report.png`)
          )
          turn.report = report
          turn.resultSaved = true
        } catch (error) {
          turn.reportError = error.message
        }
        save()
        return turn
      }
    })
    meta.stopped = result.stopped
    meta.elapsedMs = Date.now() - started
    meta.deadline = await deadline.finish()
    settled = meta.deadline.status === 'finished'
    fs.writeFileSync(
      path.join(directory, 'after.json'),
      JSON.stringify(await boundedCapture('final state', state))
    )
    await page.screenshot({ path: path.join(directory, 'final.png') })
    meta.sourceUnchanged =
      captureSources(root).digest === meta.sourceManifest.digest
    if (!meta.sourceUnchanged)
      throw new Error('Source changed during observation')
  } catch (error) {
    meta.errors.push(String(error.stack ?? error))
    if (deadline && !settled)
      meta.deadline = await deadline.stop('collector-failure')
    process.exitCode = 1
  } finally {
    if (context) await context.close().catch((e) => meta.errors.push(String(e)))
    if (owned) await owned.close().catch((e) => meta.errors.push(String(e)))
    meta.finishedAt = new Date().toISOString()
    save()
    console.log(
      JSON.stringify({
        directory,
        stopped: meta.stopped,
        turns: meta.turns.length,
        errors: meta.errors.length
      })
    )
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main()
