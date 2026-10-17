import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { expect, test, type Page } from '@playwright/test'
import { createTestDocumentIdentity, waitForAppReady } from './test-utils'
import { createLocalDesignReview } from '../server/local-design-review'

const canonicalDigest = async (page: Page) =>
  page.evaluate(async () => {
    const document = await (
      await import('../src/testing/runtime-access')
    ).core.save()
    const serialized = JSON.stringify(
      {
        version: document.version,
        sceneTree: document.sceneTree,
        props: document.props
      },
      (_, value) =>
        value && typeof value === 'object' && !Array.isArray(value)
          ? Object.fromEntries(
              Object.keys(value)
                .sort()
                .map((key) => [key, value[key]])
            )
          : value
    )
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(serialized)
    )
    return [...new Uint8Array(hash)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  })

for (const recoverInitialFailure of [false, true]) {
  test(`reloads the recorded Taipei101 through the authoritative document session${recoverInitialFailure ? ' after an initial connection failure' : ''}`, async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      process.env.E2E_LARGE_DOCUMENT !== 'true',
      'Explicit large saved-document gate'
    )
    test.setTimeout(180000)
    if (!baseURL || !process.env.E2E_DOCUMENT_BACKEND_URL)
      throw new Error('Isolated test endpoints are required')
    expect(new URL(baseURL).port).not.toBe('3000')
    expect(new URL(process.env.E2E_DOCUMENT_BACKEND_URL).port).not.toBe('4201')
    const root = resolve('e2e/fixtures/recorded-101')
    const manifest = JSON.parse(
      await readFile(resolve(root, 'manifest.json'), 'utf8')
    )
    const bytes = gunzipSync(
      await readFile(resolve(root, 'document.fixture.gz'))
    )
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      manifest.sha256
    )
    const document = JSON.parse(bytes.toString())
    const identity = createTestDocumentIdentity()
    const storage = resolve('test-results/document-backend')
    await mkdir(storage, { recursive: true })
    const storedPath = resolve(
      storage,
      `${Buffer.from(identity.fileId).toString('base64url')}.json`
    )
    const storedRecord = JSON.stringify({
      protocolVersion: 1,
      documentId: identity.fileId,
      record: {
        document,
        documentGeneration: 0,
        durableSequence: 0,
        publicationSequences: {},
        batches: {}
      }
    })
    // A truncated backend read fails the real handshake; restoring the exact
    // checkpoint must let the same App session recover through its socket owner.
    await writeFile(storedPath, recoverInitialFailure ? '{' : storedRecord)
    let beforeReloadTimings: unknown
    const initialErrors: string[] = []
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(() => {
      const timings: unknown[] = []
      Object.assign(window, { recordedBootstrapTimings: timings })
      const NativeWorker = window.Worker
      window.Worker = class extends NativeWorker {
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options)
          this.addEventListener('message', ({ data }) => {
            if (
              data?.type === 'bootstrap-progress' ||
              data?.type === 'timing' ||
              data?.type === 'failure'
            ) {
              timings.push({ ...data, atMs: performance.now() })
            }
          })
        }
      }
    })
    const started = Date.now()
    try {
      await page.goto(identity.url)
      await waitForAppReady(page)
      if (recoverInitialFailure) {
        await expect
          .poll(() =>
            page.evaluate(async () =>
              (await import('../src/testing/runtime-access'))
                .getActiveCollaborationHandle()
                ?.getStatus()
            )
          )
          .toBe('disconnected')
        expect(await canonicalDigest(page)).not.toBe(manifest.canonicalSha256)
        expect(
          errors.some((error) =>
            error.includes('initial document session failed')
          )
        ).toBe(true)
        expect(
          errors.every(
            (error) =>
              error.includes(
                '[collaboration] initial document session failed:'
              ) || error.includes('[collaboration] reconnect attempt failed:')
          )
        ).toBe(true)
        initialErrors.push(...errors)
        errors.length = 0
        await writeFile(storedPath, storedRecord)
        await page.evaluate(async () => {
          const session = (
            await import('../src/testing/runtime-access')
          ).getActiveCollaborationHandle()
          if (!session) throw new Error('Missing failed document session')
          await session.reconnect()
        })
      }
      await expect
        .poll(
          () =>
            page.evaluate(async () => {
              const { core, getActiveCollaborationHandle } =
                await import('../src/testing/runtime-access')
              return {
                count: core.deps.sceneTree.getAllElements().size,
                status: getActiveCollaborationHandle()?.getStatus()
              }
            }),
          { timeout: 30000 }
        )
        .toEqual({ count: manifest.elements, status: 'connected' })
      expect(await canonicalDigest(page)).toBe(manifest.canonicalSha256)
      const review = JSON.parse(
        await readFile(
          resolve('server/__tests__/fixtures/recorded-101/review-handoff.json'),
          'utf8'
        )
      )
      const result = await page.evaluate(async (inspections) => {
        const { core, getActiveCollaborationHandle } =
          await import('../src/testing/runtime-access')
        const { fillApis, historyApis, viewportApis } =
          await import('../src/common-apis')
        const { createInspectionEvidence } =
          await import('../src/common-apis/inspection-evidence')
        const { createAiInspectionAction } =
          await import('../src/ai/inspection')
        const owner = createInspectionEvidence()
        const action = createAiInspectionAction(undefined, owner)
        const signal = new AbortController().signal
        const capture = async (index: number) => {
          const result = (await action.execute(inspections[index], {
            signal
          } as never)) as { available: boolean; evidence?: unknown }
          if (!result.available || !result.evidence)
            throw new Error('Recorded scope capture unavailable')
          return result.evidence
        }
        try {
          const captured = []
          for (let index = 0; index < inspections.length; index++)
            captured.push(await capture(index))
          const [whole, crown, , , base] = captured
          const crownId = inspections[1].elementId
          const child = core.getElementData(crownId)?.children?.[0]
          if (!child) throw new Error('Recorded crown child is missing')
          fillApis.updatePrimaryFillColor(child, '#ee3355')
          const afterCrown = {
            whole: owner.isCurrent(whole),
            crown: owner.isCurrent(crown),
            base: owner.isCurrent(base)
          }
          viewportApis.panTo(900, 900)
          viewportApis.zoomToCenter(0.25, 0, 0)
          const afterViewport = owner.isCurrent(base)
          await historyApis.undo()
          const afterUndo = owner.isCurrent(base)
          await historyApis.redo()
          const afterRedo = owner.isCurrent(base)
          const session = getActiveCollaborationHandle()
          if (!session) throw new Error('Missing document session')
          const receipt = await session.confirmPersistence(
            AbortSignal.timeout(15000)
          )
          return {
            afterCrown,
            afterViewport,
            afterUndo,
            afterRedo,
            receipt,
            captured,
            current: captured.map((stamp) => owner.isCurrent(stamp)),
            correctedCrown: await capture(1)
          }
        } finally {
          owner.dispose()
        }
      }, review.capture.inspections)
      expect(result.afterCrown).toEqual({
        whole: false,
        crown: false,
        base: true
      })
      expect(result.afterViewport).toBe(true)
      expect(result.afterUndo).toBe(true)
      expect(result.afterRedo).toBe(true)
      expect(result.receipt.durableSequence).toBeGreaterThanOrEqual(
        result.receipt.sequence
      )
      // Feed actual browser receipts into the production review-result owner.
      // Visual verdicts here are caller fixtures, not automated visual certification.
      const retained = createLocalDesignReview()
      retained.record(review.plan)
      const publish = (index: number, stamp: unknown) => {
        const input = review.capture.inspections[index]
        const image = retained.inspect(
          input.elementId,
          true,
          input.view === 'overview',
          input.region,
          input.view === 'detail',
          stamp as Parameters<typeof retained.inspect>[5]
        )
        if (!image) throw new Error('Missing delivered evidence')
        return image.inspectionId
      }
      const ids = result.captured.map((stamp, index) => publish(index, stamp))
      const originalIds = review.judgment.inspectionIds as string[]
      const checks = review.judgment.checks.map(
        (check: { unitId?: string; inspectionIds: string[] }) => ({
          ...check,
          inspectionIds: check.inspectionIds
            .filter((id) => check.unitId !== 'base' || id !== originalIds[0])
            .map((id) => ids[originalIds.indexOf(id)])
        })
      )
      retained.record({ ...review.judgment, inspectionIds: ids, checks })
      const passedBase = retained
        .readChecks({ includePassed: true })
        .items.find((item) => item.unitId === 'base')
      expect(passedBase?.status).toBe('pass')
      expect(result.current).toEqual([false, false, true, true, true])
      retained.invalidateInspections(
        ids.filter((_, index) => !result.current[index]),
        'Actual saved-document crown edit'
      )
      const correctedCrown = publish(1, result.correctedCrown)
      const correction = retained.record({
        phase: 'visual',
        final: true,
        inspectionIds: [correctedCrown],
        checks: [
          {
            criterionId: 'detail',
            unitId: 'crown',
            status: 'pass',
            inspectionIds: [correctedCrown],
            evidence: 'Caller fixture accepts the corrected crown.'
          }
        ]
      })
      expect(correction.accepted).toBe(false)
      const accumulated = retained.readChecks({ includePassed: true }).items
      expect(accumulated.find((item) => item.unitId === 'base')).toEqual(
        passedBase
      )
      expect(accumulated.find((item) => item.unitId === 'crown')?.status).toBe(
        'pass'
      )
      expect(
        accumulated.find((item) => item.criterionId === 'whole')?.status
      ).toBe('stale')
      const changed = await canonicalDigest(page)
      expect(changed).not.toBe(manifest.canonicalSha256)
      beforeReloadTimings = await page.evaluate(() =>
        Reflect.get(window, 'recordedBootstrapTimings')
      )
      await page.reload()
      await waitForAppReady(page)
      await expect
        .poll(
          () =>
            page.evaluate(async () =>
              (await import('../src/testing/runtime-access'))
                .getActiveCollaborationHandle()
                ?.getStatus()
            ),
          { timeout: 30000 }
        )
        .toBe('connected')
      expect(await canonicalDigest(page)).toBe(changed)
      expect(errors).toEqual([])
      await testInfo.attach('dependency-and-durability', {
        body: JSON.stringify(result),
        contentType: 'application/json'
      })
    } finally {
      const diagnosticsPath = testInfo.outputPath('recorded-reload.json')
      await writeFile(
        diagnosticsPath,
        JSON.stringify({
          elapsedMs: Date.now() - started,
          initialErrors,
          errors,
          beforeReloadTimings,
          timings: await page.evaluate(() =>
            Reflect.get(window, 'recordedBootstrapTimings')
          )
        })
      )
      await testInfo.attach('recorded-reload', {
        path: diagnosticsPath,
        contentType: 'application/json'
      })
    }
  })
}

test('profiles the recorded checkpoint at the real transport worker boundary', async ({
  page
}, testInfo) => {
  test.skip(
    process.env.E2E_LARGE_DOCUMENT !== 'true',
    'Explicit large saved-document gate'
  )
  test.setTimeout(120000)
  const root = resolve('e2e/fixtures/recorded-101')
  const manifest = JSON.parse(
    await readFile(resolve(root, 'manifest.json'), 'utf8')
  )
  const bytes = gunzipSync(await readFile(resolve(root, 'document.fixture.gz')))
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.sha256)
  const document = JSON.parse(bytes.toString())
  const identity = createTestDocumentIdentity()
  const storage = resolve('test-results/document-backend')
  await mkdir(storage, { recursive: true })
  await writeFile(
    resolve(
      storage,
      `${Buffer.from(identity.fileId).toString('base64url')}.json`
    ),
    JSON.stringify({
      protocolVersion: 1,
      documentId: identity.fileId,
      record: {
        document,
        documentGeneration: 0,
        durableSequence: 0,
        publicationSequences: {},
        batches: {}
      }
    })
  )

  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const evidence = await page.evaluate(
    async ({ fileId, endpoint }) => {
      const started = performance.now()
      const worker = new Worker(
        '/src/collaboration/collaboration-transport-worker.ts',
        { type: 'module' }
      )
      const timings: unknown[] = []
      try {
        return await new Promise<{
          elapsedMs: number
          timings: unknown[]
          elements: number
        }>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error('Bootstrap transport did not settle')),
            30000
          )
          worker.onerror = (error) => {
            clearTimeout(timeout)
            reject(new Error(error.message))
          }
          worker.onmessage = (event) => {
            const message = event.data
            if (
              message.type === 'timing' ||
              message.type === 'diagnostic-counter' ||
              message.type === 'bootstrap-progress'
            )
              timings.push({ ...message, atMs: performance.now() - started })
            if (message.type === 'failure') {
              clearTimeout(timeout)
              reject(new Error(message.message))
            }
            if (message.type === 'connected') {
              clearTimeout(timeout)
              resolve({
                elapsedMs: performance.now() - started,
                timings,
                elements: Object.keys(
                  message.bootstrap.checkpoint.sceneTree.elements
                ).length
              })
            }
          }
          worker.postMessage({
            type: 'connect',
            generation: 1,
            endpoint,
            identity: {
              documentId: 'profile-document',
              roomId: 'profile-room',
              actorId: 'profile-actor',
              connectionMetadata: { fileId }
            }
          })
        })
      } finally {
        worker.terminate()
      }
    },
    {
      fileId: identity.fileId,
      endpoint: process.env.VITE_COLLABORATION_WS_URL ?? ''
    }
  )
  expect(evidence.elements).toBe(manifest.elements)
  console.info(JSON.stringify(evidence))
  await testInfo.attach('transport-timings', {
    body: JSON.stringify(evidence),
    contentType: 'application/json'
  })
})
