import { setTimeout as delay } from 'node:timers/promises'
import {
  createLiveTestDeadline,
  processIdentity
} from '../ai-drawing/live-test-deadline.mjs'
import { boundedCapture } from './capture-lifecycle.mjs'

/** Local control avoids duplicating document frames into a remote RPC socket. */
export async function launchCaptureBrowser({
  chromium,
  evidencePath,
  record = () => undefined
}) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  let pid, identity
  const observe = (event, details = {}) =>
    record({ at: Date.now(), event, pid, ...details })
  try {
    const session = await browser.newBrowserCDPSession()
    try {
      const info = await session.send('SystemInfo.getProcessInfo')
      pid = info.processInfo.find((entry) => entry.type === 'browser')?.id
      if (!Number.isSafeInteger(pid) || pid < 2) {
        throw new Error('Native browser PID unavailable')
      }
      identity = processIdentity(pid)
      if (!identity) {
        throw new Error('Native browser process identity unavailable')
      }
    } finally {
      await session.detach()
    }
  } catch (error) {
    await browser.close()
    throw error
  }
  observe('browser-started', { identity })
  browser.on('disconnected', () =>
    observe('browser-disconnected', {
      processPresent: processIdentity(pid) === identity
    })
  )
  const forceStop = async () => {
    const current = processIdentity(pid)
    if (!current) {
      return
    }
    if (current !== identity) {
      throw new Error('Native browser process identity changed')
    }
    observe('browser-force-stop-requested')
    const deadline = createLiveTestDeadline({
      deadlineAt: Date.now(),
      processes: [pid],
      evidencePath
    })
    const receipt = await boundedCapture(
      'browser force cleanup',
      () => deadline.result,
      10000
    )
    observe('browser-force-stop-completed', { receipt })
    if (receipt.status !== 'failed' || receipt.errors.length) {
      throw new Error('Native browser force cleanup failed')
    }
    await boundedCapture(
      'browser process exit',
      async (signal) => {
        while (processIdentity(pid) === identity) {
          signal.throwIfAborted()
          await delay(20)
        }
      },
      5000
    )
  }
  return {
    browser,
    pid,
    newContext: async (options) => {
      const context = await browser.newContext(options)
      observe('context-created')
      context.on('close', () => observe('context-closed'))
      context.on('page', (page) => {
        page.on('crash', () => observe('page-crashed'))
        page.on('close', () => observe('page-closed'))
      })
      return context
    },
    close: async () => {
      observe('browser-cleanup-requested')
      try {
        await boundedCapture('browser close', () => browser.close(), 5000)
      } finally {
        await forceStop()
        observe('browser-process-settled', {
          processPresent: processIdentity(pid) === identity
        })
      }
    }
  }
}
