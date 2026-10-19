/** Explicit offline replay. Reads an existing document; never sends a model request. */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createHash } from 'node:crypto'
import { fileURLToPath, URL } from 'node:url'
import { chromium } from 'playwright'
import { loadEnvironment, resolveEnvironment } from '../../app-environment.mjs'
import {
  boundedCapture,
  captureReload,
  captureSessionOnPage,
  collectEvidenceStage
} from './capture-lifecycle.mjs'

const root = path.resolve(
  fileURLToPath(new URL('../../../../', import.meta.url))
)
const [input, output] = process.argv.slice(2)
if (!input || !output)
  throw new Error(
    'Expected saved run.json and a new project-local output directory'
  )
const source = fs.realpathSync(path.resolve(input))
const directory = path.resolve(output)
const withinProject = (value) => value.startsWith(root + path.sep)
assert.ok(withinProject(source), 'Evidence must be project-local')
assert.ok(withinProject(directory), 'Output must be project-local')
assert.ok(
  withinProject(fs.realpathSync(path.dirname(directory))),
  'Output parent must be project-local'
)
const original = fs.readFileSync(source)
const run = JSON.parse(original)
const captured = run.evidence?.persistence?.value
assert.equal(run.evidence?.persistence?.status, 'complete')
assert.ok(captured?.receipt && Array.isArray(captured.roots))
assert.equal(captured.receipt.sequence, captured.receipt.durableSequence)
const environment = resolveEnvironment(loadEnvironment())
const url = new URL(environment.appURL)
url.searchParams.set('fileId', run.id)
assert.equal(captured.receipt.documentId, run.id)
fs.mkdirSync(directory)
const meta = {
  source,
  sourceSha256: createHash('sha256').update(original).digest('hex'),
  url: url.href,
  mode: 'read-only-saved-document',
  modelRequestAttempts: 0,
  pageErrors: [],
  startedAt: new Date().toISOString()
}
const save = () =>
  fs.writeFileSync(
    path.join(directory, 'replay.json'),
    JSON.stringify(meta, null, 2)
  )
let browser
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  await collectEvidenceStage(
    meta,
    'reload',
    () =>
      captureReload({
        browser: {
          newContext: async (options) => {
            const context = await browser.newContext({
              ...options,
              serviceWorkers: 'block'
            })
            await context.route('**/api/ai/**', (route) => {
              if (route.request().method() === 'POST') {
                meta.modelRequestAttempts++
                return route.abort()
              }
              return route.continue()
            })
            context.on('page', (page) =>
              page.on('pageerror', (error) =>
                meta.pageErrors.push(error.message)
              )
            )
            return context
          }
        },
        viewport: run.viewport,
        url: url.href,
        captured,
        capturePage: captureSessionOnPage,
        screenshotPath: path.join(directory, 'reload.png'),
        recordCleanup: (task) =>
          collectEvidenceStage(meta, 'context-cleanup', task, save)
      }),
    save
  )
} finally {
  await collectEvidenceStage(
    meta,
    'browser-cleanup',
    () => boundedCapture('browser close', () => browser?.close(), 5000),
    save
  )
  meta.sourceUnchanged = fs.readFileSync(source).equals(original)
  meta.finishedAt = new Date().toISOString()
  save()
}
assert.equal(
  meta.modelRequestAttempts,
  0,
  'Replay attempted an AI write request'
)
assert.equal(meta.sourceUnchanged, true, 'Original evidence was modified')
assert.deepEqual(meta.pageErrors, [])
for (const [stage, evidence] of Object.entries(meta.evidence))
  assert.equal(evidence.status, 'complete', `${stage}: ${evidence.error}`)
