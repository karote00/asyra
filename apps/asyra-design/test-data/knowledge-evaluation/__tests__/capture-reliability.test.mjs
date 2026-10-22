import { setTimeout, clearTimeout } from 'node:timers'
import { Buffer } from 'node:buffer'
/* global Response, ReadableStream, TextEncoder, structuredClone */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { captureCheckpoint } from '../checkpoint.mjs'

const root = fileURLToPath(new URL('../../../../../', import.meta.url))
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true })
test('checkpoint deadline covers streaming and preserves partial evidence', async () => {
  const folder = fs.mkdtempSync(path.join(root, 'tmp/checkpoint-timeout-'))
  let end
  try {
    const filename = path.join(folder, 'checkpoint.json')
    const body = {
      documentGeneration: 0,
      durableSequence: 1,
      checkpoint: { version: '1', sceneTree: {}, props: {} }
    }
    await assert.rejects(
      captureCheckpoint({
        url: 'http://fixture/checkpoint',
        filename,
        receipt: { sequence: 1, durableSequence: 1, documentGeneration: 0 },
        timeoutMs: 20,
        request: async () =>
          new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(
                  new TextEncoder().encode(JSON.stringify(body))
                )
                end = setTimeout(() => controller.close(), 150)
              },
              cancel() {
                clearTimeout(end)
              }
            })
          )
      }),
      /timeout|abort|deadline/i
    )
    assert.ok(fs.existsSync(filename))
  } finally {
    clearTimeout(end)
    fs.rmSync(folder, { recursive: true, force: true })
  }
})

import {
  boundedCapture,
  captureSession,
  collectEvidenceStage
} from '../capture-lifecycle.mjs'
import { captureSources } from '../capture-source.mjs'
import { execFileSync } from 'node:child_process'
import { gunzipSync } from 'node:zlib'

test('session capture rejects missing/replaced handles and bounds idle and confirmation', async () => {
  const receipt = { sequence: 2, durableSequence: 2, documentGeneration: 0 }
  const handle = {
    getStatus: () => 'connected',
    whenIdle: async () => undefined,
    confirmPersistence: async () => receipt
  }
  let current = handle,
    rootsRead = 0
  const read = (timeoutMs = 100) =>
    captureSession({
      getHandle: () => current,
      readRoots: () => {
        rootsRead++
        return ['root']
      },
      timeoutMs
    })
  assert.deepEqual(await read(), { roots: ['root'], receipt })
  current = undefined
  await assert.rejects(read(), /unavailable/)
  current = {
    ...handle,
    whenIdle: async () => {
      current = handle
    }
  }
  await assert.rejects(read(), /replaced/)
  current = {
    ...handle,
    confirmPersistence: async () => {
      current = handle
      return receipt
    }
  }
  await assert.rejects(read(), /replaced/)
  current = { ...handle, whenIdle: () => new Promise(() => undefined) }
  await assert.rejects(read(20), /deadline/)
  let observedSignal
  current = {
    ...handle,
    confirmPersistence: (signal) => {
      observedSignal = signal
      return new Promise(() => undefined)
    }
  }
  await assert.rejects(read(20), /deadline/)
  assert.equal(observedSignal.aborted, true)
  assert.equal(rootsRead, 1)
  current = handle
  assert.deepEqual(await read(), { roots: ['root'], receipt })
})

test('failed original capture and bounded read-only recovery retain independent outcomes', async () => {
  const meta = {},
    saved = []
  const save = () => saved.push(structuredClone(meta))
  const original = await collectEvidenceStage(
    meta,
    'original',
    () => boundedCapture('RPC', () => new Promise(() => undefined), 10),
    save
  )
  assert.equal(original, undefined)
  await collectEvidenceStage(
    meta,
    'recovery',
    async () => ({ receipt: 'read-only' }),
    save
  )
  assert.equal(meta.evidence.original.status, 'failed')
  assert.equal(meta.evidence.recovery.status, 'complete')
  assert.equal(saved.length, 2)
})

test('source freeze includes dirty/untracked execution owners and builds but excludes secrets and output', () => {
  const folder = fs.mkdtempSync(path.join(root, 'tmp/source-freeze-'))
  const write = (name, value) => {
    fs.mkdirSync(path.dirname(path.join(folder, name)), { recursive: true })
    fs.writeFileSync(path.join(folder, name), value)
  }
  try {
    execFileSync('git', ['init', '-q', folder])
    write('apps/asyra-design/src/owner.ts', 'original')
    execFileSync('git', ['add', '.'], { cwd: folder })
    write('apps/asyra-design/src/owner.ts', 'dirty')
    write('apps/asyra-design/server/new.ts', 'untracked')
    write('apps/asyra-design/.env', 'SECRET=private')
    write('apps/asyra-design/tmp/output.json', 'changing')
    write('packages/runtime/dist/index.js', 'executing-build')
    write('domain-knowledge/example.md', 'advisory')
    const archive = path.join(folder, 'source.gz')
    const first = captureSources(folder, archive)
    const stored = JSON.parse(gunzipSync(fs.readFileSync(archive)))
    assert.equal(
      Buffer.from(
        stored['apps/asyra-design/src/owner.ts'],
        'base64'
      ).toString(),
      'dirty'
    )
    assert.ok(first.files['apps/asyra-design/server/new.ts'])
    assert.ok(first.files['packages/runtime/dist/index.js'])
    assert.equal(first.files['apps/asyra-design/.env'], undefined)
    write('apps/asyra-design/tmp/output.json', 'different')
    assert.equal(captureSources(folder).digest, first.digest)
    write('apps/asyra-design/server/new.ts', 'changed')
    assert.notEqual(captureSources(folder).digest, first.digest)
    assert.throws(() => captureSources(folder, archive), /EEXIST/)
  } finally {
    fs.rmSync(folder, { recursive: true, force: true })
  }
})

test('late capture completion cannot replace the stored failure', async () => {
  let resolveRead
  const meta = {}
  const delayed = new Promise((resolve) => {
    resolveRead = resolve
  })
  const value = await collectEvidenceStage(
    meta,
    'read',
    () => boundedCapture('read', () => delayed, 10),
    () => undefined
  )
  assert.equal(value, undefined)
  const failure = structuredClone(meta)
  resolveRead({ receipt: 'too late' })
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.deepEqual(meta, failure)
})

test('cleanup failure does not hide the original capture failure or prevent another cleanup', async () => {
  const meta = {},
    saves = []
  const save = () => saves.push(structuredClone(meta))
  await collectEvidenceStage(
    meta,
    'capture',
    async () => {
      try {
        throw new Error('Original navigation interruption')
      } finally {
        await collectEvidenceStage(
          meta,
          'cleanup-context',
          async () => {
            throw new Error('Context unavailable')
          },
          save
        )
      }
    },
    save
  )
  await collectEvidenceStage(
    meta,
    'cleanup-browser',
    async () => 'closed',
    save
  )
  assert.equal(meta.evidence.capture.error, 'Original navigation interruption')
  assert.equal(meta.evidence['cleanup-context'].error, 'Context unavailable')
  assert.equal(meta.evidence['cleanup-browser'].status, 'complete')
  assert.equal(saves.length, 3)
})

test('a late checkpoint response cannot create evidence after capture timed out', async () => {
  const folder = fs.mkdtempSync(path.join(root, 'tmp/checkpoint-late-'))
  const filename = path.join(folder, 'checkpoint.json')
  let completeRequest
  try {
    const response = new Promise((resolve) => {
      completeRequest = resolve
    })
    await assert.rejects(
      captureCheckpoint({
        url: 'http://fixture/checkpoint',
        filename,
        receipt: { sequence: 0, durableSequence: 0, documentGeneration: 0 },
        request: () => response,
        timeoutMs: 10
      }),
      /deadline/
    )
    completeRequest(new Response('{}'))
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(fs.existsSync(filename), false)
  } finally {
    fs.rmSync(folder, { recursive: true, force: true })
  }
})

test('request attribution uses the canonical same-origin endpoint and rejects missing source identity', async () => {
  const { captureRequestIdentity } = await import('../capture-source.mjs')
  const { ACTION_BATCH_ENDPOINT, AI_BATCH_RECEIPT_HEADER } =
    await import('../../../src/ai/action-batch-endpoint.ts')
  let reads = 0
  const request = {
    url: () => 'http://fixture' + ACTION_BATCH_ENDPOINT,
    method: () => 'POST',
    headers: () => ({}),
    postDataJSON: () => {
      reads++
      return { metadata: { sourceRequestId: 'request-1' } }
    }
  }
  assert.equal(captureRequestIdentity(request, 'http://fixture'), 'request-1')
  assert.equal(
    captureRequestIdentity(
      { ...request, url: () => 'http://unrelated' + ACTION_BATCH_ENDPOINT },
      'http://fixture'
    ),
    undefined
  )
  assert.equal(
    captureRequestIdentity(
      { ...request, url: () => 'http://fixture/health' },
      'http://fixture'
    ),
    undefined
  )
  assert.equal(reads, 1)
  assert.equal(
    captureRequestIdentity(
      {
        ...request,
        headers: () => ({
          [AI_BATCH_RECEIPT_HEADER]: 'existing-exchange-token'
        }),
        postDataJSON: () => {
          throw new Error('Receipt is not a model request')
        }
      },
      'http://fixture'
    ),
    undefined
  )
  assert.throws(
    () =>
      captureRequestIdentity(
        { ...request, postDataJSON: () => ({}) },
        'http://fixture'
      ),
    /source identity/
  )
})

test('failed partial cancelled and missing outcomes stop generation instead of disarming its watchdog', async () => {
  const { settleGeneration } = await import('../capture-lifecycle.mjs')
  const events = []
  const deadline = {
    finish: async () => {
      events.push('finish')
      return { status: 'finished' }
    },
    stop: async (reason) => {
      events.push(reason)
      return { status: 'failed', reason }
    }
  }
  for (const outcome of ['failed', 'partial', 'cancelled', undefined]) {
    const receipt = await settleGeneration(deadline, outcome)
    assert.equal(receipt.status, 'failed')
    assert.equal(
      receipt.reason,
      outcome ? 'product-' + outcome : 'execution-deadline'
    )
  }
  assert.equal(events.includes('finish'), false)
  for (const outcome of ['success', 'no-change'])
    assert.equal((await settleGeneration(deadline, outcome)).status, 'finished')
  assert.equal(events.filter((event) => event === 'finish').length, 2)
})

test('partial UI outcome stops a real owned producer before the generation deadline', async () => {
  const { spawn } = await import('node:child_process')
  const { once } = await import('node:events')
  const { default: process } = await import('node:process')
  const { createLiveTestDeadline } =
    await import('../../ai-drawing/live-test-deadline.mjs')
  const { settleGeneration } = await import('../capture-lifecycle.mjs')
  const folder = fs.mkdtempSync(path.join(root, 'tmp/knowledge-partial-stop-'))
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore'
  })
  let timer
  try {
    await once(child, 'spawn')
    const exited = once(child, 'exit')
    timer = createLiveTestDeadline({
      deadlineAt: Date.now() + 3000,
      processes: [child.pid],
      evidencePath: path.join(folder, 'stop.json')
    })
    await timer.ready
    const receipt = await settleGeneration(timer, 'partial')
    await boundedCapture('owned producer exit', () => exited, 1000)
    assert.equal(receipt.reason, 'product-partial')
    assert.equal(child.signalCode, 'SIGKILL')
    assert.ok(receipt.finishedAt < receipt.deadlineAt)
  } finally {
    if (timer) await timer.stop()
    child.kill('SIGKILL')
    fs.rmSync(folder, { recursive: true, force: true })
  }
})

test('timed-out reload stops late navigation and closes a late-created context without publishing evidence', async () => {
  const { captureReload } = await import('../capture-lifecycle.mjs')
  for (const lateStep of ['context', 'navigation']) {
    let release
    const pending = new Promise((resolve) => {
      release = resolve
    })
    let captures = 0,
      screenshots = 0,
      pages = 0,
      closed = 0
    const page = {
      goto: async () => {
        if (lateStep === 'navigation') await pending
      },
      evaluate: async () =>
        assert.fail('Timed-out reload must not begin readiness'),
      waitForTimeout: async () => assert.fail('Timed-out reload must not poll'),
      keyboard: { press: async () => undefined },
      screenshot: async () => {
        screenshots++
      }
    }
    const context = {
      newPage: async () => {
        pages++
        return page
      },
      close: async () => {
        closed++
      }
    }
    await assert.rejects(
      captureReload({
        browser: {
          newContext: async () => {
            if (lateStep === 'context') await pending
            return context
          }
        },
        viewport: {},
        url: 'http://fixture',
        screenshotPath: 'not-written',
        capturePage: async () => {
          captures++
          return { roots: [], receipt: {} }
        },
        recordCleanup: (task) => task(),
        timeoutMs: 15
      }),
      /deadline/
    )
    release()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(
      captures,
      0,
      lateStep + ' must not confirm persistence after timeout'
    )
    assert.equal(screenshots, 0)
    assert.equal(pages, lateStep === 'context' ? 0 : 1)
    assert.equal(closed, 1)
  }
})
