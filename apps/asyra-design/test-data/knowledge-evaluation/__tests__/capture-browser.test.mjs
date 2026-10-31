/* global Response, fetch, window */
import { setTimeout } from 'node:timers'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { chromium } from 'playwright'
import { captureRequestIdentity } from '../capture-source.mjs'
import {
  ACTION_BATCH_ENDPOINT,
  AI_BATCH_RECEIPT_HEADER
} from '../../../src/ai/action-batch-endpoint.ts'
import { captureCheckpoint } from '../checkpoint.mjs'
import { boundedCapture, collectEvidenceStage } from '../capture-lifecycle.mjs'
import { saveRemoteRecording } from '../../ai-drawing/remote-recording.mjs'

const root = fileURLToPath(new URL('../../../../../', import.meta.url))
await fs.mkdir(path.join(root, 'tmp'), { recursive: true })
test(
  'browser capture preserves recording through lost session, navigation and read-only recovery without model calls',
  { timeout: 30000 },
  async () => {
    const folder = await fs.mkdtemp(path.join(root, 'tmp/capture-browser-'))
    let server, browser, context
    const meta = {},
      save = () => undefined
    let unexpectedRequests = 0
    try {
      server = await chromium.launchServer({
        channel: 'chrome',
        headless: true,
        artifactsDir: path.join(folder, 'artifacts')
      })
      browser = await chromium.connect(server.wsEndpoint())
      context = await browser.newContext({
        recordVideo: { dir: path.join(folder, 'video') }
      })
      const module = await fs.readFile(
        new URL('../capture-lifecycle.mjs', import.meta.url),
        'utf8'
      )
      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url())
        if (url.origin !== 'http://capture.test') {
          unexpectedRequests++
          return route.abort()
        }
        await route.fulfill(
          url.pathname === '/capture.mjs'
            ? { contentType: 'text/javascript', body: module }
            : {
                contentType: 'text/html',
                body: '<body style="background:navy">Capture fixture</body>'
              }
        )
      })
      const page = await context.newPage()
      const identities = []
      page.on('request', (request) => {
        const id = captureRequestIdentity(request, 'http://capture.test')
        if (id) {
          identities.push(id)
        }
      })
      await page.goto('http://capture.test/')
      await page.evaluate(
        (endpoint) =>
          fetch(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              metadata: { sourceRequestId: 'browser-fixture-source' }
            })
          }),
        ACTION_BATCH_ENDPOINT
      )
      await page.evaluate(
        ({ endpoint, receiptHeader }) =>
          fetch(endpoint, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              [receiptHeader]: 'exchange-token'
            },
            body: JSON.stringify({ status: 'complete', actionResults: [] })
          }),
        {
          endpoint: ACTION_BATCH_ENDPOINT,
          receiptHeader: AI_BATCH_RECEIPT_HEADER
        }
      )
      assert.deepEqual(identities, ['browser-fixture-source'])
      const capture = (mode) =>
        boundedCapture(
          'browser RPC',
          () =>
            page.evaluate(async (mode) => {
              const { captureSession } = await import('/capture.mjs')
              let handle = {
                getStatus: () => 'connected',
                whenIdle: async () => undefined,
                confirmPersistence: async () => ({
                  sequence: 4,
                  durableSequence: 4,
                  documentGeneration: 1
                })
              }
              if (mode === 'missing') {
                handle = undefined
              }
              if (mode === 'replaced') {
                handle.whenIdle = async () => {
                  handle = undefined
                }
              }
              if (mode === 'hung') {
                handle.whenIdle = () => new Promise(() => undefined)
              }
              return captureSession({
                getHandle: () => handle,
                readRoots: () => ['root'],
                timeoutMs: mode === 'hung' ? 10000 : 1000
              })
            }, mode),
          2000
        )
      await collectEvidenceStage(
        meta,
        'original',
        () => capture('missing'),
        save
      )
      await collectEvidenceStage(
        meta,
        'replacement',
        () => capture('replaced'),
        save
      )
      const interrupted = collectEvidenceStage(
        meta,
        'navigation',
        () => capture('hung'),
        save
      )
      await page.waitForTimeout(100)
      await page.goto('http://capture.test/reloaded')
      await interrupted
      const recovery = await collectEvidenceStage(
        meta,
        'recovery',
        () => capture('ready'),
        save
      )
      assert.deepEqual(recovery.roots, ['root'])
      assert.equal(meta.evidence.original.status, 'failed')
      assert.equal(meta.evidence.replacement.status, 'failed')
      assert.equal(meta.evidence.navigation.status, 'failed')
      const checkpoint = await captureCheckpoint({
        url: 'http://fixture/checkpoint',
        filename: path.join(folder, 'checkpoint.json'),
        receipt: recovery.receipt,
        request: async () =>
          new Response(
            JSON.stringify({
              documentGeneration: 1,
              durableSequence: 4,
              checkpoint: { version: '1', sceneTree: {}, props: {} }
            })
          )
      })
      assert.equal(checkpoint.durableSequence, 4)
      await page.waitForTimeout(200)
      const video = await boundedCapture(
        'video',
        () =>
          saveRemoteRecording(context, page, path.join(folder, 'saved.webm')),
        5000
      )
      assert.ok(video.bytes > 0)
      assert.equal(unexpectedRequests, 0)
    } finally {
      const closed = await Promise.allSettled(
        [context, browser, server]
          .filter(Boolean)
          .map((resource) =>
            boundedCapture('fixture cleanup', () => resource.close(), 5000)
          )
      )
      assert.ok(closed.every((result) => result.status === 'fulfilled'))
      await fs.rm(folder, { recursive: true, force: true })
    }
  }
)

test(
  'independent deadline terminates blocked browser RPC and retains existing evidence without inference',
  { timeout: 15000 },
  async () => {
    const { createLiveTestDeadline } =
      await import('../../ai-drawing/live-test-deadline.mjs')
    const folder = await fs.mkdtemp(
      path.join(root, 'tmp/capture-browser-deadline-')
    )
    let server, browser, timer
    try {
      server = await chromium.launchServer({
        channel: 'chrome',
        headless: true,
        artifactsDir: path.join(folder, 'artifacts')
      })
      browser = await chromium.connect(server.wsEndpoint())
      const context = await browser.newContext({
        recordVideo: { dir: path.join(folder, 'video') }
      })
      const page = await context.newPage()
      await page.setContent(
        '<body style="background:navy">Before blocked RPC</body>'
      )
      const original = JSON.stringify({
        status: 'started',
        inputs: { noModel: true }
      })
      await fs.writeFile(path.join(folder, 'original.json'), original, {
        flag: 'wx'
      })
      await page.screenshot({ path: path.join(folder, 'before.png') })
      const meta = {}
      // Start a real unresponsive renderer; the separate watchdog must close the RPC.
      const blocked = collectEvidenceStage(
        meta,
        'rpc',
        () =>
          page.evaluate(() => {
            for (;;) {
              /* Deliberate unresponsive renderer fixture. */
            }
          }),
        () => undefined
      )
      timer = createLiveTestDeadline({
        deadlineAt: Date.now() + 300,
        processes: [server.process().pid],
        evidencePath: path.join(folder, 'deadline.json')
      })
      const receipt = await boundedCapture(
        'watchdog receipt',
        () => timer.result,
        6000
      )
      await boundedCapture('terminated RPC', () => blocked, 3000)
      assert.equal(receipt.status, 'failed')
      assert.equal(meta.evidence.rpc.status, 'failed')
      assert.equal(
        await fs.readFile(path.join(folder, 'original.json'), 'utf8'),
        original
      )
      assert.ok((await fs.stat(path.join(folder, 'before.png'))).size > 0)
      assert.equal(
        JSON.parse(await fs.readFile(path.join(folder, 'deadline.json')))
          .reason,
        'execution-deadline'
      )
    } finally {
      if (timer) {
        await timer.stop()
      }
      const settled = await Promise.allSettled([
        boundedCapture('browser cleanup', () => browser?.close(), 5000),
        boundedCapture('server cleanup', () => server?.close(), 5000)
      ])
      assert.ok(settled.every((result) => result.status === 'fulfilled'))
      await fs.rm(folder, { recursive: true, force: true })
    }
  }
)

test(
  'runner reload owner closes timed-out real contexts and preserves failed comparison before recovery',
  { timeout: 15000 },
  async () => {
    const { captureReload } = await import('../capture-lifecycle.mjs')
    const folder = await fs.mkdtemp(
      path.join(root, 'tmp/capture-reload-owner-')
    )
    const browser = await chromium.launch({ channel: 'chrome', headless: true })
    const meta = {}
    let captures = 0
    const receipt = { sequence: 5, durableSequence: 5, documentGeneration: 1 }
    const run = async (mode) =>
      captureReload({
        browser: {
          newContext: async (options) => {
            const context = await browser.newContext(options)
            await context.route('**/*', async (route) => {
              if (mode === 'timeout') {
                return new Promise(() => undefined)
              }
              const module = route
                .request()
                .url()
                .endsWith('/runtime-access.ts')
              await route.fulfill({
                contentType: module ? 'text/javascript' : 'text/html',
                body: module
                  ? "export const getActiveCollaborationHandle = () => ({ getStatus: () => 'connected' }); export const core = { getCurrentWorkspaceId: () => 'workspace', getElementData: () => ({ children: ['root'] }) }"
                  : '<body>Read-only capture</body>'
              })
            })
            return context
          }
        },
        viewport: { width: 640, height: 480 },
        url: 'http://reload.test',
        captured:
          mode === 'mismatch' ? { roots: ['other-root'], receipt } : undefined,
        capturePage: async () => {
          captures++
          return { roots: ['root'], receipt }
        },
        screenshotPath: path.join(folder, mode + '.png'),
        timeoutMs: mode === 'timeout' ? 200 : 3000,
        recordCleanup: (task) =>
          collectEvidenceStage(meta, mode + '-cleanup', task, () => undefined)
      })
    try {
      await collectEvidenceStage(
        meta,
        'timeout',
        () => run('timeout'),
        () => undefined
      )
      // Closing the context settles asynchronously after the deadline rejects.
      for (let i = 0; i < 50 && browser.contexts().length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
      assert.equal(browser.contexts().length, 0)
      assert.equal(captures, 0)
      await collectEvidenceStage(
        meta,
        'mismatch',
        () => run('mismatch'),
        () => undefined
      )
      await collectEvidenceStage(
        meta,
        'recovery',
        () => run('recovery'),
        () => undefined
      )
      assert.equal(meta.evidence.timeout.status, 'failed')
      assert.match(meta.evidence.mismatch.error, /mismatch/)
      assert.equal(meta.evidence.recovery.status, 'complete')
      assert.equal(
        meta.evidence.recovery.value.comparison,
        'recovery-only-no-original-comparison'
      )
      assert.equal(browser.contexts().length, 0)
      assert.equal(captures, 2)
      await assert.rejects(fs.access(path.join(folder, 'timeout.png')))
      await assert.rejects(fs.access(path.join(folder, 'mismatch.png')))
      assert.ok((await fs.stat(path.join(folder, 'recovery.png'))).size > 0)
    } finally {
      await browser.close()
      await fs.rm(folder, { recursive: true, force: true })
    }
  }
)

test(
  'reload awaits delayed session and workspace before real capture and preserves timeout and recovery outcomes',
  { timeout: 20000 },
  async () => {
    const { captureReload, captureSessionOnPage } =
      await import('../capture-lifecycle.mjs')
    const folder = await fs.mkdtemp(path.join(root, 'tmp/capture-delayed-'))
    const browser = await chromium.launch({ channel: 'chrome', headless: true })
    const source = await fs.readFile(
      new URL('../capture-lifecycle.mjs', import.meta.url),
      'utf8'
    )
    const receipt = {
      sequence: 829,
      durableSequence: 829,
      documentGeneration: 0
    }
    const meta = {}
    const observed = []
    let modelRequests = 0
    const run = (mode) =>
      captureReload({
        browser: {
          newContext: async (options) => {
            const context = await browser.newContext(options)
            await context.route('**/*', async (route) => {
              const url = new URL(route.request().url())
              if (url.pathname.startsWith('/api/ai/')) {
                modelRequests++
                return route.abort()
              }
              if (url.pathname.endsWith('/capture-lifecycle.mjs')) {
                return route.fulfill({
                  contentType: 'text/javascript',
                  body: source
                })
              }
              if (url.pathname.endsWith('/runtime-access.ts')) {
                if (mode === 'module-timeout') {
                  return new Promise(() => undefined)
                }
                await new Promise((resolve) => setTimeout(resolve, 150))
                return route.fulfill({
                  contentType: 'text/javascript',
                  body: `
                const began = Date.now();
                let connected = true;
                const elapsed = () => Date.now() - began;
                const workspaceReady = () => elapsed() >= 500;
                const handle = {
                  getStatus: () => connected && ${JSON.stringify(mode)} !== 'session-timeout' ? 'connected' : 'connecting',
                  whenIdle: async () => {
                    if (${JSON.stringify(mode)} === 'disconnect') connected = false;
                    if (${JSON.stringify(mode)} === 'navigation') await new Promise(() => setTimeout(() => location.replace('/navigated'), 0));
                  },
                  confirmPersistence: async () => (${JSON.stringify(receipt)})
                };
                export const getActiveCollaborationHandle = () => elapsed() >= 200 ? handle : undefined;
                export const core = {
                  getCurrentWorkspaceId: () => workspaceReady() ? 'workspace' : undefined,
                  getElementData: (id) => workspaceReady() && id === 'workspace' ? { children: ['saved-root'] } : undefined
                };
              `
                })
              }
              return route.fulfill({
                contentType: 'text/html',
                body: '<body>Delayed saved document</body>'
              })
            })
            return context
          }
        },
        viewport: { width: 640, height: 480 },
        url: 'http://delayed.test',
        captured: { roots: ['saved-root'], receipt },
        capturePage: async (page) => {
          const ready = await page.evaluate(async () => {
            const { core, getActiveCollaborationHandle } =
              await import('/src/testing/runtime-access.ts')
            return {
              connected:
                getActiveCollaborationHandle()?.getStatus() === 'connected',
              workspace: Boolean(
                core.getElementData(core.getCurrentWorkspaceId())
              )
            }
          })
          observed.push({ mode, ...ready })
          assert.equal(
            ready.connected,
            true,
            'Capture must await the real session'
          )
          assert.equal(
            ready.workspace,
            true,
            'Connection alone does not prove document readiness'
          )
          return captureSessionOnPage(page)
        },
        screenshotPath: path.join(folder, mode + '.png'),
        timeoutMs:
          { 'module-timeout': 350, 'session-timeout': 1000 }[mode] ?? 4000,
        recordCleanup: (task) =>
          collectEvidenceStage(meta, mode + '-cleanup', task, () => undefined)
      })
    try {
      const first = await run('delayed')
      assert.deepEqual(first.roots, ['saved-root'])
      for (const mode of [
        'module-timeout',
        'session-timeout',
        'disconnect',
        'navigation'
      ]) {
        await collectEvidenceStage(
          meta,
          mode,
          () => run(mode),
          () => undefined
        )
        assert.equal(meta.evidence[mode].status, 'failed', mode)
        if (mode.endsWith('timeout')) {
          assert.match(meta.evidence[mode].error, /deadline/)
        }
        if (mode === 'disconnect') {
          assert.match(meta.evidence[mode].error, /disconnected or replaced/)
        }
        if (mode === 'navigation') {
          assert.match(
            meta.evidence[mode].error,
            /Execution context was destroyed/
          )
        }
        await assert.rejects(fs.access(path.join(folder, mode + '.png')))
        for (let i = 0; i < 100 && browser.contexts().length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 10))
        }
        assert.equal(browser.contexts().length, 0, mode + ' leaked a context')
      }
      const recovery = await collectEvidenceStage(
        meta,
        'recovery',
        () => run('recovery'),
        () => undefined
      )
      assert.deepEqual(recovery.receipt, receipt)
      assert.equal(recovery.comparison, 'roots-order-and-durable-receipt')
      assert.equal(meta.evidence['session-timeout'].status, 'failed')
      assert.equal(meta.evidence.disconnect.status, 'failed')
      assert.ok(observed.every((x) => x.connected && x.workspace))
      assert.ok(observed.every((x) => !x.mode.endsWith('timeout')))
      assert.equal(modelRequests, 0)
      assert.equal(browser.contexts().length, 0)
    } finally {
      await browser.close()
      await fs.rm(folder, { recursive: true, force: true })
    }
  }
)

test(
  'recording export and fresh reload preserve a document frame above the remote control limit',
  { timeout: 60000 },
  async () => {
    const { createServer } = await import('node:http')
    const { WebSocketServer } = await import('ws')
    const { captureReload } = await import('../capture-lifecycle.mjs')
    const folder = await fs.mkdtemp(path.join(root, 'tmp/capture-large-frame-'))
    const length = 257 * 1024 * 1024
    const receipt = { documentGeneration: 2, sequence: 9, durableSequence: 9 }
    let received = 0
    const server = createServer((request, response) => {
      if (request.url === '/src/testing/runtime-access.ts') {
        response.setHeader('content-type', 'text/javascript')
        response.end(
          "export const getActiveCollaborationHandle=()=>({getStatus:()=> 'connected'});export const core={getCurrentWorkspaceId:()=> 'workspace',getElementData:()=>window.received ? {children:['saved-root']} : undefined};"
        )
        return
      }
      response.setHeader('content-type', 'text/html')
      response.end(
        `<body>Saved document fixture<script>if(location.pathname==='/reload'){const socket=new WebSocket('ws://'+location.host);socket.onmessage=e=>{window.received=e.data.length;window.valid=e.data[0]==='x'&&e.data[e.data.length-1]==='x';};}</script>`
      )
    })
    const sockets = new WebSocketServer({ server })
    sockets.on('connection', (socket) => {
      received++
      socket.send('x'.repeat(length))
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const url = `http://127.0.0.1:${server.address().port}`
    let owned, browser
    try {
      const { launchCaptureBrowser } = await import('../capture-browser.mjs')
      owned = await launchCaptureBrowser({
        chromium,
        evidencePath: path.join(folder, 'stop.json')
      })
      browser = owned.browser
      const context = await owned.newContext({
        recordVideo: { dir: path.join(folder, 'video') }
      })
      const page = await context.newPage()
      await page.goto(url)
      await page.waitForTimeout(200)
      const video = await saveRemoteRecording(
        context,
        page,
        path.join(folder, 'recording.webm')
      )
      assert.ok(video.bytes > 0)
      assert.equal(browser.isConnected(), true)
      const captured = { roots: ['saved-root'], receipt }
      const result = await captureReload({
        browser: owned,
        viewport: { width: 640, height: 480 },
        url: url + '/reload',
        captured,
        capturePage: async (page) => {
          assert.deepEqual(
            await page.evaluate(() => ({
              length: window.received,
              valid: window.valid
            })),
            { length, valid: true }
          )
          return captured
        },
        screenshotPath: path.join(folder, 'reload.png'),
        recordCleanup: (task) => task(),
        timeoutMs: 40000
      })
      assert.deepEqual(result.receipt, receipt)
      assert.equal(received, 1, 'Reload must not retry the document')
      assert.equal(browser.isConnected(), true)
      assert.ok((await fs.stat(path.join(folder, 'reload.png'))).size > 0)
    } finally {
      await owned?.close()
      for (const socket of sockets.clients) {
        socket.terminate()
      }
      await new Promise((resolve) => sockets.close(resolve))
      await new Promise((resolve) => server.close(resolve))
      await fs.rm(folder, { recursive: true, force: true })
    }
  }
)

test(
  'local capture keeps native process ownership and independent blocked-RPC termination',
  { timeout: 15000 },
  async () => {
    const { launchCaptureBrowser } = await import('../capture-browser.mjs')
    const { createLiveTestDeadline, processIdentity } =
      await import('../../ai-drawing/live-test-deadline.mjs')
    const folder = await fs.mkdtemp(path.join(root, 'tmp/capture-local-stop-'))
    const events = []
    const owned = await launchCaptureBrowser({
      chromium,
      evidencePath: path.join(folder, 'cleanup.json'),
      record: (event) => events.push(event)
    })
    const disconnected = new Promise((resolve) =>
      owned.browser.once('disconnected', resolve)
    )
    let deadline
    try {
      assert.ok(processIdentity(owned.pid))
      const context = await owned.newContext()
      const page = await context.newPage()
      const meta = {}
      const blocked = collectEvidenceStage(
        meta,
        'capture',
        () =>
          page.evaluate(() => {
            for (;;) {
              /* Deliberately blocked renderer. */
            }
          }),
        () => undefined
      )
      deadline = createLiveTestDeadline({
        deadlineAt: Date.now() + 300,
        processes: [owned.pid],
        evidencePath: path.join(folder, 'deadline.json')
      })
      const receipt = await boundedCapture(
        'native stop',
        () => deadline.result,
        6000
      )
      await boundedCapture('capture failure', () => blocked, 3000)
      assert.equal(receipt.status, 'failed')
      assert.deepEqual(receipt.errors, [])
      assert.ok(receipt.stopped.some((entry) => entry.pid === owned.pid))
      assert.equal(meta.evidence.capture.status, 'failed')
      await boundedCapture('disconnect notification', () => disconnected, 3000)
      assert.ok(events.some((event) => event.event === 'browser-disconnected'))
      assert.equal(events[0].event, 'browser-started')
    } finally {
      if (deadline) {
        await deadline.stop()
      }
      await owned.close()
      assert.equal(events.at(-1).event, 'browser-process-settled')
      assert.equal(events.at(-1).processPresent, false)
      assert.equal(
        events.filter((event) => event.event === 'browser-force-stop-requested')
          .length,
        0,
        'Already terminated browser must not be killed again'
      )
      await fs.rm(folder, { recursive: true, force: true })
    }
  }
)

test(
  'reload screenshot includes the post-fit presentation instead of the prior frame',
  { timeout: 10000 },
  async () => {
    const { captureReload } = await import('../capture-lifecycle.mjs')
    const { default: sharp } = await import('sharp')
    const folder = await fs.mkdtemp(path.join(root, 'tmp/reload-presentation-'))
    const browser = await chromium.launch({ channel: 'chrome', headless: true })
    try {
      await captureReload({
        browser: {
          newContext: async (options) => {
            const context = await browser.newContext(options)
            await context.route('**/*', (route) =>
              route.fulfill(
                route.request().url().endsWith('/runtime-access.ts')
                  ? {
                      contentType: 'text/javascript',
                      body: "export const getActiveCollaborationHandle=()=>({getStatus:()=> 'connected'});export const core={getCurrentWorkspaceId:()=> 'workspace',getElementData:()=>({children:[]})};"
                    }
                  : {
                      contentType: 'text/html',
                      body: '<body style="margin:0;background:white"><script>document.addEventListener("keydown",()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{document.body.style.background="rgb(0,0,255)"})));</script>'
                    }
              )
            )
            return context
          }
        },
        viewport: { width: 100, height: 100 },
        url: 'http://fixture/',
        capturePage: async () => ({
          roots: [],
          receipt: { sequence: 0, durableSequence: 0, documentGeneration: 0 }
        }),
        screenshotPath: path.join(folder, 'reload.png'),
        recordCleanup: (task) => task()
      })
      const pixel = await sharp(path.join(folder, 'reload.png'))
        .extract({ left: 50, top: 50, width: 1, height: 1 })
        .raw()
        .toBuffer()
      assert.deepEqual(
        [...pixel],
        [0, 0, 255],
        'Capture must show the fitted presentation'
      )
    } finally {
      await browser.close()
      await fs.rm(folder, { recursive: true, force: true })
    }
  }
)

test(
  'stalled local browser cleanup uses the existing force-stop owner and preserves failure',
  { timeout: 15000 },
  async () => {
    const { launchCaptureBrowser } = await import('../capture-browser.mjs')
    const { processIdentity } =
      await import('../../ai-drawing/live-test-deadline.mjs')
    const folder = await fs.mkdtemp(path.join(root, 'tmp/capture-close-stop-'))
    const events = []
    const owned = await launchCaptureBrowser({
      chromium,
      evidencePath: path.join(folder, 'stop.json'),
      record: (event) => events.push(event)
    })
    const close = owned.browser.close.bind(owned.browser)
    try {
      owned.browser.close = () => new Promise(() => undefined)
      await assert.rejects(
        owned.close(),
        /browser close capture deadline exceeded/
      )
      assert.equal(processIdentity(owned.pid), undefined)
      const forced = events.find(
        (event) => event.event === 'browser-force-stop-completed'
      )
      assert.deepEqual(forced.receipt.errors, [])
      assert.ok(forced.receipt.stopped.some((entry) => entry.pid === owned.pid))
    } finally {
      owned.browser.close = close
      await owned.close()
      await fs.rm(folder, { recursive: true, force: true })
    }
  }
)
