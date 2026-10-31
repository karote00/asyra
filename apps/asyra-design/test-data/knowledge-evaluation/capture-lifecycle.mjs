/* global AbortController, setTimeout, clearTimeout, requestAnimationFrame */
/** Evaluation-only bounds. Late reads cannot become successful evidence. */
export async function boundedCapture(label, task, timeoutMs = 30000) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Invalid capture deadline')
  }
  const controller = new AbortController()
  let timer
  try {
    return await Promise.race([
      Promise.resolve().then(() => task(controller.signal)),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error(`${label} capture deadline exceeded`)
          controller.abort(error)
          reject(error)
        }, timeoutMs)
      })
    ])
  } finally {
    clearTimeout(timer)
  }
}

/** Resolve once and reject a changed handle across either asynchronous boundary. */
export async function captureSession({
  getHandle,
  readRoots,
  timeoutMs = 30000
}) {
  return boundedCapture(
    'session',
    async (signal) => {
      const handle = getHandle()
      const assertCurrent = () => {
        signal.throwIfAborted()
        if (
          !handle ||
          getHandle() !== handle ||
          handle.getStatus() !== 'connected'
        ) {
          throw new Error(
            'Capture session unavailable, disconnected or replaced'
          )
        }
      }
      assertCurrent()
      await handle.whenIdle()
      assertCurrent()
      const receipt = await handle.confirmPersistence(signal)
      assertCurrent()
      const roots = readRoots()
      assertCurrent()
      if (receipt.sequence !== receipt.durableSequence) {
        throw new Error('Capture persistence is not settled')
      }
      return { roots, receipt }
    },
    timeoutMs
  )
}

/** Independent failure records: recovery never overwrites the original outcome. */
export async function collectEvidenceStage(meta, name, task, save) {
  const startedAt = Date.now()
  meta.evidence ??= {}
  try {
    const value = await task()
    meta.evidence[name] = {
      status: 'complete',
      startedAt,
      finishedAt: Date.now(),
      value
    }
    return value
  } catch (error) {
    meta.evidence[name] = {
      status: 'failed',
      startedAt,
      finishedAt: Date.now(),
      error: String(error?.message ?? error)
    }
    return undefined
  } finally {
    save()
  }
}

/** Read the bounded projection of the existing settled result, never the network body. */
export async function readEvaluationReport(page, sourceRequestIds) {
  const entries = await page
    .getByTestId('ai-agent-message')
    .evaluateAll((messages) =>
      messages.flatMap((message, messageIndex) => {
        const value = message.getAttribute('data-evaluation-report')
        return value
          ? [
              {
                value,
                messageIndex,
                turnId: message.getAttribute('data-turn-id'),
                outcome: message.getAttribute('data-outcome'),
                text: message.querySelector('[data-testid="ai-agent-result"]')
                  ?.textContent
              }
            ]
          : []
      })
    )
  const matches = []
  for (const entry of entries) {
    const report = JSON.parse(entry.value)
    if (
      !report ||
      report.attribution !== 'model-self-report' ||
      typeof report.sourceRequestId !== 'string' ||
      !report.sourceRequestId.trim() ||
      typeof report.turnId !== 'string' ||
      !report.turnId.trim() ||
      typeof report.text !== 'string' ||
      !report.text.trim() ||
      report.text.length > 1000
    ) {
      throw new Error('Malformed evaluation self-report')
    }
    if (!sourceRequestIds.includes(report.sourceRequestId)) {
      continue
    }
    if (
      entry.turnId !== report.turnId ||
      !['partial', 'success', 'no-change'].includes(entry.outcome) ||
      !entry.text?.includes(report.text)
    ) {
      throw new Error('Evaluation report identity or rendered text mismatch')
    }
    matches.push({
      ...report,
      messageIndex: entry.messageIndex,
      receivedAt: new Date().toISOString()
    })
  }
  if (matches.length !== 1) {
    throw new Error('Expected exactly one matching settled evaluation report')
  }
  return matches[0]
}

/** Verify the same settled message before and after saving its entire rendered image. */
export async function captureReportImage(page, report, path) {
  const target = page.getByTestId('ai-agent-message').nth(report.messageIndex)
  await target.waitFor({ state: 'visible', timeout: 5000 })
  await target.scrollIntoViewIfNeeded()
  const rendered = target.getByTestId('ai-agent-result')
  const verify = async () => {
    const current = JSON.parse(
      (await target.getAttribute('data-evaluation-report')) ?? 'null'
    )
    if (
      !current ||
      current.sourceRequestId !== report.sourceRequestId ||
      current.turnId !== report.turnId ||
      current.text !== report.text ||
      (await target.getAttribute('data-turn-id')) !== report.turnId
    ) {
      throw new Error('Evaluation report identity changed before capture')
    }
    if (!(await rendered.textContent())?.includes(report.text)) {
      throw new Error(
        'The rendered report does not match the retained model output'
      )
    }
  }
  await verify()
  await rendered.screenshot({ path })
  await verify()
}

/** Keep text even if its screenshot fails; missing evidence cannot become success. */
export function captureEvaluationReport({
  meta,
  report,
  writeText,
  captureImage,
  save,
  timeoutMs = 30000
}) {
  return collectEvidenceStage(
    meta,
    'self-report',
    () =>
      boundedCapture(
        'self-report',
        async (signal) => {
          if (!report) {
            throw new Error('No host-admitted evaluation self-report received')
          }
          meta.selfReport = { ...report, textSaved: false, imageSaved: false }
          await writeText(report.text)
          signal.throwIfAborted()
          meta.selfReport.textSaved = true
          await captureImage()
          signal.throwIfAborted()
          meta.selfReport.imageSaved = true
          return meta.selfReport
        },
        timeoutMs
      ),
    save
  )
}

/** Await the RPC result itself; a Promise is not a readiness predicate. */
export async function waitForCaptureReady(page, signal) {
  for (;;) {
    signal.throwIfAborted()
    const ready = await page.evaluate(async () => {
      const { core, getActiveCollaborationHandle } =
        await import('/src/testing/runtime-access.ts')
      const workspaceId = core.getCurrentWorkspaceId()
      return Boolean(
        getActiveCollaborationHandle()?.getStatus() === 'connected' &&
        workspaceId &&
        core.getElementData(workspaceId)
      )
    })
    signal.throwIfAborted()
    if (ready) {
      return
    }
    await page.waitForTimeout(100)
  }
}

/** Actual public-session capture shared by live evaluation and offline replay. */
export const captureSessionOnPage = (page) =>
  boundedCapture(
    'browser session RPC',
    () =>
      page.evaluate(async () => {
        const { core, getActiveCollaborationHandle } =
          await import('/src/testing/runtime-access.ts')
        const { captureSession } =
          await import('/test-data/knowledge-evaluation/capture-lifecycle.mjs')
        return captureSession({
          getHandle: getActiveCollaborationHandle,
          readRoots: () =>
            core.getElementData(core.getCurrentWorkspaceId())?.children ?? [],
          timeoutMs: 30000
        })
      }),
    35000
  )

/** Existing read-only reload capture, shared by the runner and protocol tests. */
export async function captureReload({
  browser,
  viewport,
  url,
  captured,
  capturePage,
  screenshotPath,
  recordCleanup,
  timeoutMs = 75000
}) {
  return boundedCapture(
    'reload capture',
    async (signal) => {
      const reloadContext = await browser.newContext({
        viewport: viewport
      })
      let closing
      const close = () =>
        (closing ??= recordCleanup(() =>
          boundedCapture(
            'reload context close',
            () => reloadContext.close(),
            5000
          )
        ))
      const abort = () => {
        // The same promise is awaited in finally; observing it here prevents
        // an unhandled rejection while the interrupted RPC unwinds.
        void close().catch(() => undefined)
      }
      signal.addEventListener('abort', abort, { once: true })
      try {
        signal.throwIfAborted()
        const reloaded = await reloadContext.newPage()
        signal.throwIfAborted()
        await reloaded.goto(url, { timeout: 30000 })
        signal.throwIfAborted()
        await waitForCaptureReady(reloaded, signal)
        signal.throwIfAborted()
        const result = await capturePage(reloaded)
        signal.throwIfAborted()
        if (
          captured &&
          (JSON.stringify(result.roots) !== JSON.stringify(captured.roots) ||
            result.receipt.durableSequence !==
              captured.receipt.durableSequence ||
            result.receipt.documentGeneration !==
              captured.receipt.documentGeneration)
        ) {
          throw new Error('Reload root/order or durable receipt mismatch')
        }
        await reloaded.keyboard.press('Meta+1')
        signal.throwIfAborted()
        await reloaded.evaluate(
          () =>
            new Promise((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(resolve))
            })
        )
        signal.throwIfAborted()
        await reloaded.screenshot({
          path: screenshotPath
        })
        signal.throwIfAborted()
        return {
          ...result,
          comparison: captured
            ? 'roots-order-and-durable-receipt'
            : 'recovery-only-no-original-comparison'
        }
      } finally {
        signal.removeEventListener('abort', abort)
        await close()
      }
    },
    timeoutMs
  )
}
