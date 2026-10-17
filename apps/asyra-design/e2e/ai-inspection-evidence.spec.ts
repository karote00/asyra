import recordedScope from '../server/__tests__/fixtures/recorded-101/scope-handoff-20261017.json' with { type: 'json' }
import { expect, test, type Page } from '@playwright/test'
import type { FillAttrs } from '@asyra/utils'
import type { AiActionBatch, AiProvider } from '@asyra/ai-agent-runtime'
import type { FillPatch } from '../src/common-apis/fills'
import {
  createRectangle,
  createTestDocumentIdentity,
  getElementCount,
  getCoreDocumentDigest,
  getPersistedDocumentDigest,
  redo,
  undo,
  waitForAppReady
} from './test-utils'

// Ordinary local runs do not retry. Retain the first failure's navigation and
// transport evidence instead of waiting for a retry that will never run.
test.use({ trace: 'retain-on-failure' })

// These tests prove validity notifications in the real App. Actual image
// freshness is covered by local-ai-provider.spec.ts's rendered-inspection case.
const captureEvidence = (page: Page) =>
  page.evaluate(async () => {
    const { createInspectionEvidence } =
      await import('../src/common-apis/inspection-evidence')
    const { testRuntimeState } = await import('../src/testing/runtime-access')
    let owner = testRuntimeState.get<
      ReturnType<typeof createInspectionEvidence>
    >('inspection-evidence-owner')
    if (!owner) {
      owner = createInspectionEvidence()
      testRuntimeState.set('inspection-evidence-owner', owner)
    }
    const result = await owner.capture(() => ({ available: true }))
    testRuntimeState.set('inspection-evidence-stamp', result.evidence)
    return owner.isCurrent(result.evidence)
  })

const evidenceIsCurrent = (page: Page) =>
  page.evaluate(async () => {
    const { testRuntimeState } = await import('../src/testing/runtime-access')
    const owner = testRuntimeState.get<{
      isCurrent: (value: unknown) => boolean
    }>('inspection-evidence-owner')
    if (!owner) throw new Error('Inspection evidence owner is unavailable')
    return owner.isCurrent(testRuntimeState.get('inspection-evidence-stamp'))
  })

const waitForCollaboration = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(async () => {
        const { getActiveCollaborationHandle } =
          await import('../src/testing/runtime-access')
        return getActiveCollaborationHandle()?.getStatus()
      })
    )
    .toBe('connected')

test('manual edits, Undo, Redo and isolated Core load invalidate canonical inspection evidence', async ({
  page,
  browser
}, testInfo) => {
  const remote = await browser.newPage({
    baseURL: String(testInfo.project.use.baseURL)
  })
  try {
    await page.goto(createTestDocumentIdentity().url)
    await waitForAppReady(page)
    await waitForCollaboration(page)
    await remote.goto(page.url())
    await waitForAppReady(remote)
    await waitForCollaboration(remote)
    await page.evaluate(async () => {
      const { startDocumentPublicationCapture, startSharedPublicationCapture } =
        await import('../src/testing/runtime-access')
      startDocumentPublicationCapture('inspection-lifecycle-publications')
      startSharedPublicationCapture('inspection-lifecycle-raw')
    })
    expect(await captureEvidence(page)).toBe(true)

    await createRectangle(page)
    await expect.poll(() => getElementCount(remote)).toBe(1)
    await expect.poll(() => evidenceIsCurrent(page)).toBe(false)
    expect(await captureEvidence(page)).toBe(true)

    // Selection and viewport changes do not mutate the inspected document.
    await page.keyboard.press('Escape')
    await page.keyboard.press('Meta+1')
    expect(await evidenceIsCurrent(page)).toBe(true)

    await undo(page)
    await expect.poll(() => getElementCount(remote)).toBe(0)
    await expect.poll(() => getElementCount(page)).toBe(0)
    await expect.poll(() => evidenceIsCurrent(page)).toBe(false)
    expect(await captureEvidence(page)).toBe(true)
    await redo(page)
    await expect.poll(() => getElementCount(remote)).toBe(1)
    await expect.poll(() => getElementCount(page)).toBe(1)
    await expect.poll(() => evidenceIsCurrent(page)).toBe(false)
    expect(await captureEvidence(page)).toBe(true)

    const publications = await page.evaluate(async () => {
      const { readTestCapture } = await import('../src/testing/runtime-access')
      return JSON.stringify({
        document: readTestCapture('inspection-lifecycle-publications'),
        raw: readTestCapture('inspection-lifecycle-raw')
      })
    })
    const { writeFile } = await import('node:fs/promises')
    const publicationsPath = test
      .info()
      .outputPath('inspection-lifecycle-publications.json')
    await writeFile(publicationsPath, publications)
    await test.info().attach('inspection-lifecycle-publications', {
      path: publicationsPath,
      contentType: 'application/json'
    })
    const expectedDocument = await getCoreDocumentDigest(page)
    await expect
      .poll(() => getCoreDocumentDigest(remote))
      .toEqual(expectedDocument)
    const loaded = await page.evaluate(async () => {
      const { core, getActiveCollaborationHandle } =
        await import('../src/testing/runtime-access')
      const handle = getActiveCollaborationHandle()
      if (!handle) throw new Error('Missing connected document owner')
      const persisted = await handle.confirmPersistence(
        new AbortController().signal
      )
      const saved = await core.save()
      // Isolate Core load from document publication; session replacement has its own tests.
      await handle.dispose()
      core.load(saved)
      return { persisted, documentId: handle.identity.documentId }
    })
    await test.info().attach('isolated-load-document', {
      body: JSON.stringify(loaded),
      contentType: 'application/json'
    })
    await expect.poll(() => evidenceIsCurrent(page)).toBe(false)
    expect(await captureEvidence(page)).toBe(true)
    expect(await getPersistedDocumentDigest(loaded.documentId)).toEqual(
      expectedDocument
    )
    await page.reload()
    await waitForAppReady(page)
    await waitForCollaboration(page)
    await expect.poll(() => getElementCount(page)).toBe(1)
    expect(await getCoreDocumentDigest(page)).toEqual(expectedDocument)
  } finally {
    await remote.close()
  }
})

test('recorded action stream preserves drawable targets during incremental construction', async ({
  page
}, testInfo) => {
  const manifestPath = process.env.E2E_INSPECTION_REPLAY
  test.skip(
    !manifestPath,
    'Provide a project-local recorded action replay manifest.'
  )
  if (!manifestPath) return
  test.setTimeout(300_000)
  const { readFile, appendFile, writeFile } = await import('node:fs/promises')
  const { resolve, relative } = await import('node:path')
  const projectRoot = resolve(process.cwd(), '../..')
  const localPath = (path: string) => {
    const resolved = resolve(path)
    if (relative(projectRoot, resolved).startsWith('..'))
      throw new Error('Replay inputs must be inside this project')
    return resolved
  }
  const manifest: {
    actionsPath: string
    groupResults: Record<string, string>
    traceHierarchy?: boolean
  } = JSON.parse(await readFile(localPath(manifestPath), 'utf8'))
  const batches: AiActionBatch[] = (
    await readFile(localPath(manifest.actionsPath), 'utf8')
  )
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
    .filter((frame) => frame.type === 'batch')
    .map((frame) => frame.batch)
  expect(batches.length).toBeGreaterThan(0)
  const eventsPath = testInfo.outputPath('replay-events.ndjson')
  await writeFile(eventsPath, '')
  await page.exposeFunction('recordActionReplayEvent', (event: unknown) =>
    appendFile(eventsPath, `${JSON.stringify(event)}\n`)
  )
  page.on('pageerror', (error) => {
    void appendFile(eventsPath, `${JSON.stringify({ error: error.stack })}\n`)
  })
  page.on('console', async (message) => {
    if (message.type() !== 'error') return
    const argumentsWithErrors = await Promise.all(
      message.args().map((argument) =>
        argument
          .evaluate((value) => {
            if (value instanceof Error) return value.stack
            if (value && typeof value === 'object' && 'error' in value) {
              const error = value.error
              return {
                ...value,
                error: error instanceof Error ? error.stack : error
              }
            }
            return value
          })
          .catch(() => 'Console argument unavailable')
      )
    )
    await appendFile(
      eventsPath,
      `${JSON.stringify({ consoleError: message.text(), argumentsWithErrors })}\n`
    )
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const result = await page.evaluate(
    async ({ batches, groupResults, traceHierarchy }) => {
      const { createAiStartup } = await import('../src/ai/startup')
      const { createAiConfirmationBroker } =
        await import('../src/ai/confirmation')
      const { createAiHistoryProjection } =
        await import('../src/common-apis/history')
      const { core } = await import('../src/testing/runtime-access')
      const { viewportApis, hierarchyApis } = await import('../src/common-apis')
      const { getActiveCanvasPipelineDebugger } =
        await import('../src/init/diagnostics/init-canvas-pipeline-debugger')
      const pipelineDebugger = traceHierarchy
        ? getActiveCanvasPipelineDebugger()
        : undefined
      if (traceHierarchy && !pipelineDebugger)
        throw new Error('Requested Canvas Pipeline Debugger is unavailable')
      const aliases = new Map<string, string>()
      const started = performance.now()
      let currentBatchId = ''
      const record = (event: Record<string, unknown>) =>
        (
          window as unknown as {
            recordActionReplayEvent: (event: unknown) => Promise<void>
          }
        ).recordActionReplayEvent({
          elapsedMs: performance.now() - started,
          batchId: currentBatchId,
          ...event
        })
      const stopPublicationProfile = core.subscribeToSharedPublication(
        (publication) => {
          const serializedBytes = new TextEncoder().encode(
            JSON.stringify(publication)
          ).byteLength
          if (serializedBytes < 1_000_000) return
          const deliveries = publication.slices.flatMap((slice) =>
            slice.batches.flatMap((batch) => batch.deliveries)
          )
          const largest = deliveries
            .map((delivery) => ({
              event: delivery.eventName,
              bytes: new TextEncoder().encode(JSON.stringify(delivery.payload))
                .byteLength,
              fields: Object.entries(
                delivery.payload as Record<string, unknown>
              ).map(([key, value]) => ({
                key,
                count: Array.isArray(value) ? value.length : undefined,
                bytes: new TextEncoder().encode(JSON.stringify(value) ?? '')
                  .byteLength
              }))
            }))
            .sort((a, b) => b.bytes - a.bytes)
            .slice(0, 3)
          void record({
            phase: 'publication-profile',
            publicationId: publication.publicationId,
            mode: publication.mode,
            serializedBytes,
            deliveryCount: deliveries.length,
            largest
          })
        }
      )
      const remap = (value: unknown): unknown => {
        if (typeof value === 'string') return aliases.get(value) ?? value
        if (Array.isArray(value)) return value.map(remap)
        if (value && typeof value === 'object')
          return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [key, remap(entry)])
          )
        return value
      }
      const captureErrors: {
        batchId: string
        elementId: string
        error: string
      }[] = []
      const originalCapture = core.captureElementSnapshot
      const originalMove = hierarchyApis.moveElements
      hierarchyApis.moveElements = (...args) => {
        try {
          return originalMove(...args)
        } catch (error) {
          void record({
            phase: 'hierarchy-rejected',
            error: error instanceof Error ? error.message : String(error)
          })
          throw error
        }
      }
      core.captureElementSnapshot = (
        ...args: Parameters<typeof originalCapture>
      ) => {
        try {
          return originalCapture.apply(core, args)
        } catch (error) {
          const failure = {
            batchId: currentBatchId,
            elementId: args[0],
            error:
              error instanceof Error
                ? (error.stack ?? error.message)
                : String(error)
          }
          captureErrors.push(failure)
          void record({ phase: 'capture-failed', ...failure })
          throw error
        }
      }
      const provider: AiProvider = {
        requestActionBatch: async (_input, { executeBatch }) => {
          if (!executeBatch)
            throw new Error('Runtime batch executor is unavailable')
          for (const batch of batches) {
            currentBatchId = batch.batchId
            const debuggerHandle =
              traceHierarchy &&
              batch.actions.some(
                (action) =>
                  action.name === 'organize_design' ||
                  action.name === 'api_hierarchy_moveElements'
              )
                ? pipelineDebugger
                : undefined
            if (debuggerHandle) {
              debuggerHandle.setOverlayVisible(false)
              debuggerHandle.enable()
              debuggerHandle.clearTrace()
            }
            await record({
              phase: 'start',
              actions: batch.actions.length,
              names: [...new Set(batch.actions.map((action) => action.name))]
            })
            const receipt = await executeBatch(remap(batch) as AiActionBatch)
            for (const entry of receipt.actionResults) {
              const originalId = groupResults[entry.actionId]
              if (!originalId) continue
              const result = entry.result as { groupId?: string }
              if (!result.groupId)
                throw new Error(
                  `Recorded group result missing: ${entry.actionId}`
                )
              aliases.set(originalId, result.groupId)
            }
            viewportApis.zoomFit()
            if (
              batch.actions.some((action) => action.name === 'organize_design')
            ) {
              const workspace = hierarchyApis.getWorkspaceId()
              const roots = workspace
                ? (core.getElementData(workspace)?.children ?? [])
                : []
              await record({
                phase: 'hierarchy-projection',
                roots: roots.map((id) => ({
                  id,
                  children: core.getElementData(id)?.children ?? [],
                  native: core.measureElementContentBounds([id])
                }))
              })
            }
            if (debuggerHandle) {
              await record({
                phase: 'render-projection-trace',
                actions: remap(batch.actions),
                trace: debuggerHandle.getTrace(),
                snapshot: debuggerHandle.getSnapshot()
              })
              debuggerHandle.disable()
            }
            await record({
              phase: 'complete',
              captureErrors: captureErrors.length
            })
          }
          return {
            batchId: 'replay-finished',
            actions: [
              {
                id: 'replay-finished',
                name: 'report_outcome',
                arguments: {
                  outcome: 'completed',
                  message:
                    'Recorded action execution finished; this is a diagnostic replay.'
                },
                summary: 'Finish replay'
              }
            ]
          }
        }
      }
      const startup = createAiStartup({
        createProvider: () => provider,
        createConfirmation: createAiConfirmationBroker,
        createHistory: createAiHistoryProjection
      })
      const { runtime } = startup
      // Replay only the recorded operations in this isolated test document.
      // A broker without a turn rejects confirmations before reaching the API.
      startup.confirmation.beginTurn('recorded-replay')
      const unsubscribeConfirmation = startup.confirmation.subscribe(
        ({ pending }) => {
          if (pending) startup.confirmation.resolve(true)
        }
      )
      try {
        const outcome = await runtime.run({
          intent: 'Replay the recorded drawing operations.',
          signal: new AbortController().signal
        })
        const workspace = hierarchyApis.getWorkspaceId()
        const roots = workspace
          ? (core.getElementData(workspace)?.children ?? [])
          : []
        const captures = roots.map((id) => {
          try {
            return {
              elementId: id,
              image: core.captureElementSnapshot(id, 1024)
            }
          } catch {
            return { elementId: id, image: null }
          }
        })
        const targetIds = roots.flatMap((id) => [
          id,
          ...(core.getElementData(id)?.children ?? [])
        ])
        const targetState = targetIds.map((id) => ({
          id,
          data: core.getElementData(id),
          computed: core.getElementComputedData(id, [
            'x',
            'y',
            'width',
            'height',
            'rotation',
            'visible'
          ]),
          native: core.measureElementContentBounds([id])
        }))
        await record({
          phase: 'settled',
          status: outcome.status,
          captureErrors
        })
        return {
          status: outcome.status,
          failure: outcome.status === 'failed' ? outcome.message : null,
          captureErrors,
          captures,
          targetState
        }
      } finally {
        stopPublicationProfile()
        unsubscribeConfirmation()
        pipelineDebugger?.disable()
        core.captureElementSnapshot = originalCapture
        hierarchyApis.moveElements = originalMove
        await runtime.dispose()
        await startup.confirmation.dispose()
        startup.history.dispose()
      }
    },
    {
      batches,
      groupResults: manifest.groupResults,
      traceHierarchy: manifest.traceHierarchy
    }
  )
  await writeFile(
    testInfo.outputPath('replay-result.json'),
    JSON.stringify(result, null, 2)
  )
  await page.screenshot({ path: testInfo.outputPath('replayed-app.png') })
  for (const [index, capture] of result.captures.entries()) {
    if (capture.image)
      await testInfo.attach(`replayed-root-${index}`, {
        body: Buffer.from(capture.image.dataUrl.split(',')[1], 'base64'),
        contentType: 'image/png'
      })
  }
  expect(result.status, result.failure ?? 'Recorded batches must execute').toBe(
    'executed'
  )
  const fileId = new URL(page.url()).searchParams.get('fileId')
  if (!fileId) throw new Error('The test document has no file ID')
  const canonicalDigest = await getCoreDocumentDigest(page)
  await expect
    .poll(() => getPersistedDocumentDigest(fileId), {
      timeout: 30_000,
      intervals: [1_000]
    })
    .toEqual(canonicalDigest)
  await writeFile(
    testInfo.outputPath('durable-replay.json'),
    JSON.stringify({ fileId, canonicalDigest })
  )
  expect(result.captures.length).toBeGreaterThan(0)
  // A recorded run can recover from an invalid native-detail request. The
  // regression is loss of the final drawable target, not every rejected query.
  expect(result.captures.every((capture) => capture.image !== null)).toBe(true)
})

test('an edit from another collaboration client invalidates canonical inspection evidence', async ({
  page,
  browser
}, testInfo) => {
  const document = createTestDocumentIdentity()
  const remote = await browser.newPage({
    baseURL: String(testInfo.project.use.baseURL)
  })
  try {
    await page.goto(document.url)
    await waitForAppReady(page)
    await waitForCollaboration(page)
    await remote.goto(document.url)
    await waitForAppReady(remote)
    await waitForCollaboration(remote)
    const before = await getElementCount(page)
    expect(await captureEvidence(page)).toBe(true)

    await createRectangle(remote)
    await expect.poll(() => getElementCount(page)).toBe(before + 1)
    await expect.poll(() => evidenceIsCurrent(page)).toBe(false)
    expect(await captureEvidence(page)).toBe(true)
  } finally {
    await remote.close()
  }
})

test('canonical coverage follows ungrouped details into their current drawing', async ({
  page
}) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await createRectangle(page, 0.25, 0.3)
  await createRectangle(page, 0.45, 0.3)
  const results = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { hierarchyApis } = await import('../src/common-apis/hierarchy')
    const { createInspectionEvidence } =
      await import('../src/common-apis/inspection-evidence')
    const workspace = hierarchyApis.getWorkspaceId()
    if (!workspace) throw new Error('Missing workspace')
    const ids = core.getElementData(workspace)?.children ?? []
    if (ids.length !== 2) throw new Error('Expected the two test rectangles')
    const tower = hierarchyApis.groupElements([ids[0]])
    const collar = hierarchyApis.groupElements([ids[1]])
    const owner = createInspectionEvidence()
    try {
      const before = await owner.capture(() => ({ available: true }))
      const members = hierarchyApis.ungroupElement(collar.groupId).elementIds
      hierarchyApis.moveElements({
        elementIds: members,
        targetParentId: tower.groupId,
        targetIndex: 1
      })
      const after = await owner.capture(() => ({ available: true }))
      const scope = {
        requiredIds: [tower.groupId, ...members],
        overviewIds: [tower.groupId]
      }
      return {
        retired: owner.validate(before.evidence, scope),
        covered: owner.validate(after.evidence, scope),
        deleted: owner.validate(after.evidence, {
          requiredIds: [collar.groupId],
          overviewIds: [tower.groupId]
        }),
        detailOnly: owner.validate(after.evidence, {
          requiredIds: [tower.groupId],
          overviewIds: members
        })
      }
    } finally {
      owner.dispose()
    }
  })
  expect(results.retired).toMatchObject({
    current: false,
    coverage: { complete: false }
  })
  expect(results.covered).toMatchObject({
    current: true,
    coverage: { complete: true }
  })
  expect(results.deleted).toMatchObject({ coverage: { complete: false } })
  expect(results.detailOnly).toMatchObject({ coverage: { complete: false } })
})

test('inspection sees hierarchy edits before a long-running AI request settles', async ({
  page
}) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await createRectangle(page, 0.25, 0.25)
  await createRectangle(page, 0.45, 0.45)
  const result = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { hierarchyApis } = await import('../src/common-apis/hierarchy')
    const { createAiTransactionRunner } = await import('../src/ai/transaction')
    const runner = createAiTransactionRunner()
    const delivery = { undoable: true, sharedDelivery: 'immediate' } as const
    const workspace = hierarchyApis.getWorkspaceId()
    if (!workspace) throw new Error('Missing workspace')
    const ids = [...(core.getElementData(workspace)?.children ?? [])]
    if (ids.length !== 2) throw new Error('Expected two rectangles')
    return runner
      .run('Inspect a running drawing', async (mutate) => {
        if (!mutate) throw new Error('Expected grouped mutation executor')
        const drawing = await mutate(() => {
          const body = hierarchyApis.groupElements([ids[0]], delivery)
          const detail = hierarchyApis.groupElements([ids[1]], delivery)
          // This is the delivery policy used by the registered basic API action.
          hierarchyApis.moveElements({
            elementIds: [detail.groupId],
            targetParentId: body.groupId,
            targetIndex: 1
          })
          const members = hierarchyApis.ungroupElement(body.groupId, delivery)
          return hierarchyApis.groupElements(members.elementIds, delivery)
        })
        const bounds = core.getElementComputedData(drawing.groupId, [
          'width',
          'height'
        ])
        const image = core.captureElementSnapshot(drawing.groupId, 1024)
        return { bounds, image }
      })
      .catch((error: unknown) => {
        // Browser serialization omits custom Error fields; surface the canonical
        // cause so this permanent regression reports the failing owner.
        if (error instanceof Error && 'cause' in error) throw error.cause
        throw error
      })
  })
  expect(result.bounds?.width).toBeGreaterThan(0)
  expect(result.bounds?.height).toBeGreaterThan(0)
  expect(result.image.width).toBeGreaterThan(0)
  expect(result.image.height).toBeGreaterThan(0)
})

test('rendered inspection survives moving a detail group and regrouping the whole drawing', async ({
  page
}) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await createRectangle(page, 0.25, 0.25)
  await createRectangle(page, 0.45, 0.45)
  await createRectangle(page, 0.35, 0.65)
  const result = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { hierarchyApis } = await import('../src/common-apis/hierarchy')
    const { createAiTransactionRunner } = await import('../src/ai/transaction')
    const runner = createAiTransactionRunner()
    const apply = <T>(operation: () => T) =>
      runner.run('Inspection replay', async (mutate) => {
        if (!mutate) throw new Error('Expected grouped mutation executor')
        return mutate(operation)
      })
    const delivery = { undoable: true, sharedDelivery: 'immediate' } as const
    const workspace = hierarchyApis.getWorkspaceId()
    if (!workspace) throw new Error('Missing workspace')
    const ids = [...(core.getElementData(workspace)?.children ?? [])]
    if (ids.length !== 3) throw new Error('Expected three rectangles')
    const body = await apply(() =>
      hierarchyApis.groupElements([ids[0]], delivery)
    )
    const glazing = await apply(() =>
      hierarchyApis.groupElements([ids[1]], delivery)
    )
    const tower = await apply(() =>
      hierarchyApis.groupElements([body.groupId, glazing.groupId], delivery)
    )
    const detail = await apply(() =>
      hierarchyApis.groupElements([ids[2]], delivery)
    )
    await apply(() =>
      // Basic API actions use the public API's default delivery policy.
      hierarchyApis.moveElements({
        elementIds: [detail.groupId],
        targetParentId: tower.groupId,
        targetIndex: 2
      })
    )
    const before = core.captureElementSnapshot(tower.groupId, 1024)
    core.captureElementSnapshot(body.groupId, 1024)
    core.captureElementSnapshot(glazing.groupId, 1024)
    core.captureElementSnapshot(detail.groupId, 1024)
    await apply(() => hierarchyApis.ungroupElement(body.groupId, delivery))
    const afterInnerUngroup = core.captureElementSnapshot(tower.groupId, 1024)
    const children = (
      await apply(() => hierarchyApis.ungroupElement(tower.groupId, delivery))
    ).elementIds
    const regrouped = await apply(() => {
      const result = hierarchyApis.groupElements(children, delivery)
      core.updateElementData(
        result.groupId,
        { name: 'Regrouped drawing' },
        delivery
      )
      return result
    })
    const after = core.captureElementSnapshot(regrouped.groupId, 1024)
    return { before, afterInnerUngroup, after }
  })
  expect(result.after.width).toBe(result.before.width)
  expect(result.after.height).toBe(result.before.height)
  expect(result.after.dataUrl).toBe(result.before.dataUrl)
  expect(result.afterInnerUngroup.dataUrl).toBe(result.before.dataUrl)
})

test('saved drawing keeps a complete snapshot after public regrouping', async ({
  page
}, testInfo) => {
  // Bounded opt-in replay of retained large documents; the ordinary small case stays at its default guard.
  test.setTimeout(process.env.E2E_INSPECTION_ACTIONS ? 180_000 : 90_000)
  await page.exposeFunction('recordInspectionReplayStage', (stage: string) => {
    testInfo.annotations.push({ type: 'replay-stage', description: stage })
  })
  const documentPath = process.env.E2E_INSPECTION_DOCUMENT
  test.skip(
    !documentPath,
    'Provide a retained project-local document for deterministic inspection replay.'
  )
  if (!documentPath) return
  const { readFile } = await import('node:fs/promises')
  const { resolve, relative } = await import('node:path')
  const projectRoot = resolve(process.cwd(), '../..')
  const filePath = resolve(documentPath)
  if (relative(projectRoot, filePath).startsWith('..'))
    throw new Error('Replay document must be inside this project')
  const document = JSON.parse(await readFile(filePath, 'utf8'))
  const actionPath = process.env.E2E_INSPECTION_ACTIONS
  const fillChanges: {
    elementId: string
    fillId: string
    currentFill: FillAttrs
    patch: FillPatch
  }[] = []
  if (actionPath) {
    const resolved = resolve(actionPath)
    if (relative(projectRoot, resolved).startsWith('..'))
      throw new Error('Replay actions must be inside this project')
    const frames = (await readFile(resolved, 'utf8')).trim().split('\n')
    for (const frame of frames) {
      const parsed = JSON.parse(frame)
      if (parsed.type !== 'batch') continue
      for (const action of parsed.batch.actions) {
        if (action.name === 'api_fill_updateFillFields')
          fillChanges.push(action.arguments)
      }
    }
    expect(
      fillChanges.length,
      'Retained action stream must contain fill edits'
    ).toBeGreaterThan(0)
  }
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const result = await page.evaluate(
    async ({ document, fillChanges }) => {
      const stage = (name: string) =>
        (
          window as unknown as {
            recordInspectionReplayStage: (name: string) => Promise<void>
          }
        ).recordInspectionReplayStage(name)
      const { core } = await import('../src/testing/runtime-access')
      const { hierarchyApis } = await import('../src/common-apis/hierarchy')
      const { fillApis, transactionApis, viewportApis } =
        await import('../src/common-apis')
      const { createAiTransactionRunner } =
        await import('../src/ai/transaction')
      const runner = createAiTransactionRunner()
      const apply = <T>(operation: () => T) =>
        runner.run('Inspection replay', async (mutate) => {
          if (!mutate) throw new Error('Expected grouped mutation executor')
          return mutate(operation)
        })
      const delivery = { undoable: true, sharedDelivery: 'immediate' } as const
      core.load(document)
      await stage('document loaded')
      viewportApis.zoomFit()
      const workspace = hierarchyApis.getWorkspaceId()
      if (!workspace) throw new Error('Missing workspace')
      const roots = core.getElementData(workspace)?.children ?? []
      if (roots.length !== 1)
        throw new Error('Replay requires one whole-drawing root')
      const before = core.captureElementSnapshot(roots[0], 1024)
      await stage('baseline captured')
      if (fillChanges.length) {
        transactionApis.runTransaction(() => {
          for (const change of fillChanges) {
            fillApis.updateFillFields(change.elementId, change.fillId, {
              gradient: change.currentFill.gradient
            })
          }
        })
        await stage('original fills restored')
        core.captureElementSnapshot(roots[0], 1024)
        await stage('original fills captured')
        transactionApis.runTransaction(() => {
          for (const change of fillChanges) {
            fillApis.updateFillFields(
              change.elementId,
              change.fillId,
              change.patch
            )
          }
        })
        await stage('fill batch reapplied')
      }
      const recolored = core.captureElementSnapshot(roots[0], 1024)
      await stage('updated fills captured')
      const nextFrame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      // Reproduce native-detail extraction before hierarchy edits, rather than
      // proving only a fresh document's first overview.
      const regionSize = Math.min(
        512,
        before.bounds.width,
        before.bounds.height
      )
      const region = {
        x: before.bounds.x + (before.bounds.width - regionSize) / 2,
        y: before.bounds.y + (before.bounds.height - regionSize) / 2,
        width: regionSize,
        height: regionSize
      }
      core.captureElementSnapshot(roots[0], 1024, {
        nativeResolution: true,
        region
      })
      await nextFrame()
      const extracted = core.captureElementSnapshot(roots[0], 1024)
      const members = [
        ...(await apply(() => hierarchyApis.ungroupElement(roots[0], delivery)))
          .elementIds
      ]
      if (members.length < 2)
        throw new Error('Replay requires a drawing and a separate detail group')
      const detail = members.pop()
      if (!detail) throw new Error('Replay detail group is missing')
      const drawing = await apply(() =>
        hierarchyApis.groupElements(members, delivery)
      )
      await nextFrame()
      await apply(() =>
        hierarchyApis.moveElements(
          {
            elementIds: [detail],
            targetParentId: drawing.groupId,
            targetIndex: members.length
          },
          delivery
        )
      )
      await nextFrame()
      const moved = core.captureElementSnapshot(drawing.groupId, 1024)
      // Each subtree was also inspected in the live run before its parent was
      // removed. Exercise that engine state independently of saved geometry.
      for (const member of [...members, detail]) {
        core.captureElementSnapshot(member, 1024)
      }
      const allMembers = (
        await apply(() =>
          hierarchyApis.ungroupElement(drawing.groupId, delivery)
        )
      ).elementIds
      await nextFrame()
      const regrouped = await apply(() => {
        const result = hierarchyApis.groupElements(allMembers, delivery)
        core.updateElementData(
          result.groupId,
          { name: 'Regrouped drawing' },
          delivery
        )
        return result
      })
      await nextFrame()
      const after = core.captureElementSnapshot(regrouped.groupId, 1024)
      await stage('regrouped drawing captured')
      return { before, recolored, extracted, moved, after }
    },
    { document, fillChanges }
  )
  for (const [name, capture] of Object.entries(result)) {
    await testInfo.attach(`replayed-${name}`, {
      body: Buffer.from(capture.dataUrl.split(',')[1], 'base64'),
      contentType: 'image/png'
    })
  }
  expect(result.after.width).toBe(result.before.width)
  expect(result.after.height).toBe(result.before.height)
  // Reparenting changes floating-point transform accumulation. Permit sparse
  // edge-antialias differences, while rejecting disappearing bodies or fills.
  for (const [name, capture] of Object.entries(result)) {
    const difference = await page.evaluate(
      async ({ before, after }) => {
        const decode = async (dataUrl: string) => {
          const image = new Image()
          image.src = dataUrl
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const context = canvas.getContext('2d')
          if (!context) throw new Error('Pixel comparison requires Canvas 2D')
          context.drawImage(image, 0, 0)
          return context.getImageData(0, 0, image.width, image.height).data
        }
        const [left, right] = await Promise.all([decode(before), decode(after)])
        if (left.length !== right.length)
          throw new Error('Snapshot dimensions changed')
        let changedPixels = 0
        let maximumChannelDelta = 0
        for (let offset = 0; offset < left.length; offset += 4) {
          let changed = false
          for (let channel = 0; channel < 4; channel += 1) {
            const delta = Math.abs(
              left[offset + channel] - right[offset + channel]
            )
            maximumChannelDelta = Math.max(maximumChannelDelta, delta)
            changed ||= delta > 0
          }
          if (changed) changedPixels += 1
        }
        return {
          changedFraction: changedPixels / (left.length / 4),
          maximumChannelDelta
        }
      },
      { before: result.before.dataUrl, after: capture.dataUrl }
    )
    expect(difference.changedFraction, name).toBeLessThanOrEqual(0.001)
    expect(difference.maximumChannelDelta, name).toBeLessThanOrEqual(32)
  }
})

test('scoped inspection preserves other tiers and regions through canonical edits and Undo', async ({
  page
}) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  const result = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { transactionApis, historyApis, viewportApis, fillApis } =
      await import('../src/common-apis')
    const { createInspectionEvidence } =
      await import('../src/common-apis/inspection-evidence')
    const { createAiInspectionAction } = await import('../src/ai/inspection')
    const tower = transactionApis.runTransaction(() =>
      core.createElementInParent(
        { type: 'frame', x: 0, y: 0, width: 800, height: 800 },
        core.getCurrentWorkspaceId()
      )
    )
    const tiers = transactionApis.runTransaction(() =>
      core.createElementsInParent(
        Array.from({ length: 8 }, (_, i) => ({
          type: 'group',
          x: 20,
          y: 20 + i * 90,
          width: 50,
          height: 50
        })),
        tower
      )
    )
    const windows = transactionApis.runTransaction(() =>
      tiers.map((tier) =>
        core.createElementInParent(
          { type: 'rect', x: 0, y: 0, width: 50, height: 50 },
          tier
        )
      )
    )
    const owner = createInspectionEvidence()
    const action = createAiInspectionAction(undefined, owner)
    const signal = new AbortController().signal
    const capture = async (
      elementId: string,
      region?: { x: number; y: number; width: number; height: number }
    ) => {
      const value = (await action.execute({ elementId, region }, {
        signal
      } as never)) as { available: boolean; evidence?: unknown }
      if (!value.available || !value.evidence)
        throw new Error('Actual rendered capture failed')
      return value.evidence
    }
    try {
      const stamps = await Promise.all(tiers.map((id) => capture(id)))
      const whole = await capture(tower)
      const firstRegion = await capture(tower, {
        x: 10,
        y: 10,
        width: 80,
        height: 70
      })
      transactionApis.runTransaction(() =>
        core.updateElementProperties([
          { elementId: windows[2], values: { width: 60 } }
        ])
      )
      const afterThird = stamps.map((stamp) => owner.isCurrent(stamp))
      const wholeAfterThird = owner.isCurrent(whole)
      const regionAfterThird = owner.isCurrent(firstRegion)
      // Enter an existing crop from outside, without naming any old crop member.
      transactionApis.runTransaction(() =>
        core.updateElementProperties([
          { elementId: tiers[2], values: { y: 30 } }
        ])
      )
      const afterEntry = owner.isCurrent(firstRegion)
      const entered = await capture(tower, {
        x: 10,
        y: 10,
        width: 80,
        height: 70
      })
      await historyApis.undo()
      const afterUndo = owner.isCurrent(entered)
      const afterUndoStamp = await capture(tiers[0])
      fillApis.updatePrimaryFillColor(windows[0], '#ff0000')
      const afterFill = owner.isCurrent(afterUndoStamp)
      const otherAfterFill = owner.isCurrent(stamps[7])
      const freshFirst = await capture(tiers[0])
      viewportApis.panTo(900, 900)
      viewportApis.zoomToCenter(0.25, 0, 0)
      const afterViewport = owner.isCurrent(freshFirst)
      const deletedTier = await capture(tiers[2])
      transactionApis.runTransaction(() => core.removeSubtrees([tiers[2]]))
      const afterDelete = owner.isCurrent(deletedTier)
      const otherAfterDelete = owner.isCurrent(freshFirst)
      const saved = await core.save()
      core.load(saved)
      const afterLoad = owner.isCurrent(freshFirst)
      return {
        afterFill,
        otherAfterFill,
        afterThird,
        wholeAfterThird,
        regionAfterThird,
        afterEntry,
        afterUndo,
        afterViewport,
        afterDelete,
        otherAfterDelete,
        afterLoad
      }
    } finally {
      owner.dispose()
    }
  })
  expect(result).toEqual({
    afterFill: false,
    otherAfterFill: true,
    afterThird: [true, true, false, true, true, true, true, true],
    wholeAfterThird: false,
    regionAfterThird: true,
    afterEntry: false,
    afterUndo: false,
    afterViewport: true,
    afterDelete: false,
    otherAfterDelete: true,
    afterLoad: false
  })
})

// The scripted primary agent crosses the real server host and browser runtime.
// Only the external model and an explicit transport failure are substituted.
test('public review handoffs retain independent evidence and recover before runtime completion', async ({
  page
}, testInfo) => {
  test.setTimeout(90000)
  const { default: sharp } = await import('sharp')
  const { createLocalImageTools } = await import('../server/local-image-tools')
  const { createLocalDesignTools } =
    await import('../server/local-design-tools')
  const { createDesignPreparationSession } =
    await import('../server/design-preparation')
  const source = await sharp({
    create: { width: 24, height: 24, channels: 3, background: '#7799aa' }
  })
    .png()
    .toBuffer()
  const { createLocalOperationTools } =
    await import('../server/local-operation-tools')
  const { createLocalToolHost } = await import('../server/local-tool-host')
  const { createDesignCheckResults } =
    await import('../server/design-check-results')
  const { AiActionNames } = await import('../src/constants/ai-actions')
  const { AiDesignToolIds } = await import('../src/constants/ai-design')
  type ProviderInput = import('../src/ai/action-batch-protocol').AiProviderInput
  type Receipt = import('../src/ai/action-batch-protocol').AiBatchReceipt
  type StoredCheck = import('../server/design-check-results').DesignCheckResult
  type Entry = import('@asyra/ai-agent-runtime').AiToolStoreEntry
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await waitForCollaboration(page)
  const ids = await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const { transactionApis } = await import('../src/common-apis')
    return transactionApis.runTransaction(() =>
      core.createElementsInParent(
        [
          { type: 'rect', x: 20, y: 20, width: 100, height: 80 },
          { type: 'rect', x: 220, y: 20, width: 100, height: 80 }
        ],
        core.getCurrentWorkspaceId()
      )
    )
  })
  const [left, right] = ids
  expect(left).toEqual(expect.any(String))
  expect(right).toEqual(expect.any(String))
  let before = await getCoreDocumentDigest(page)
  let exportedDocument: unknown
  let exportMetadata: { bytes: number; sha256: string } | undefined
  const downloadPromise = page.waitForEvent('download', { timeout: 90000 })
  void downloadPromise.catch(() => undefined)
  const attachmentReceipts: unknown[] = []
  let providerCalls = 0
  let bridgeFailure: unknown
  const dispatched: string[] = []
  await page.exposeFunction(
    'driveReviewHandoff',
    async (input: ProviderInput) => {
      providerCalls++
      const checks = createDesignCheckResults()
      const entries = new Map<string, Entry>()
      const controller = new AbortController()
      let rejectValidation = false
      let cancelAfterValidation: AbortController | undefined
      let operations!: ReturnType<typeof createLocalOperationTools>
      const host = createLocalToolHost({
        requestId: 'review-handoff',
        signal: controller.signal,
        capacity: 32,
        receiptCapacity: 32,
        artifactCapacity: 32,
        limits: {
          bytes: 24000,
          steps: 10,
          bindings: 100,
          bindingDepth: 32,
          issues: 10
        },
        store: {
          read: async (key) => entries.get(key),
          list: async () => [...entries.values()],
          write: async (value) => {
            if (entries.get(value.key)?.version !== value.expectedVersion)
              throw new Error('Conflict')
            const entry = {
              key: value.key,
              record: value.record,
              version: crypto.randomUUID()
            }
            entries.set(value.key, entry)
            return entry
          }
        },
        createGroups: (ownership) => {
          const images = createLocalImageTools(
            {
              metadata: {
                imageAttachments: [
                  {
                    dataUrl: `data:image/png;base64,${source.toString('base64')}`
                  }
                ]
              }
            },
            undefined,
            ownership
          )
          const designs = createLocalDesignTools(
            input.actions,
            createDesignPreparationSession(undefined, undefined, ownership)
          )
          operations = createLocalOperationTools(
            input.actions,
            {
              modelActions: designs.modelActions,
              resolveBatch: designs.resolveBatch,
              resolveRecipe: designs.resolveRecipe,
              resolveTargets: designs.resolveTargets,
              checkResults: checks
            },
            async (batch) => {
              if (
                rejectValidation &&
                batch.actions.some(
                  (action) =>
                    action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
                )
              ) {
                rejectValidation = false
                throw new Error(
                  'Test transport disconnected before read dispatch'
                )
              }
              dispatched.push(...batch.actions.map((action) => action.name))
              const serializedReceipt = await page.evaluate(
                async (serialized) => {
                  const { testRuntimeState } =
                    await import('../src/testing/runtime-access')
                  const execute = testRuntimeState.get<
                    (batch: AiActionBatch) => Promise<Receipt>
                  >('review-handoff-execute')
                  if (!execute) throw new Error('Missing real runtime executor')
                  return JSON.stringify(
                    await execute(JSON.parse(serialized) as AiActionBatch)
                  )
                },
                JSON.stringify(batch)
              )
              const receipt = JSON.parse(serializedReceipt) as Receipt
              for (const entry of receipt.actionResults)
                if (entry.actionName === AiActionNames.READ_DESIGN_ATTACHMENT)
                  attachmentReceipts.push(entry.result)
              if (
                cancelAfterValidation &&
                batch.actions.some(
                  (action) =>
                    action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
                )
              ) {
                cancelAfterValidation.abort()
                cancelAfterValidation = undefined
              }
              return receipt
            },
            {
              ownership,
              resolveSources: images.resolveSources,
              referenceImages: images.referenceImages,
              validateReferences: images.validateReferences,
              requestSignal: controller.signal,
              getNativeTools: () => host.definitions(),
              getNativeToolsRevision: () => host.revision
            }
          )
          return [
            { name: 'images', description: 'Images', owner: images },
            { name: 'design', description: 'Prepared design', owner: designs },
            {
              name: 'design_operations',
              description: 'Design operations',
              owner: operations
            }
          ]
        }
      })
      let callId = 0
      const invoke = async (
        name: string,
        input: unknown,
        signal?: AbortSignal
      ) => {
        const reply = await host.invoke({
          name: name.includes('.') ? name : `design_operations.${name}`,
          input,
          signal,
          callId: `call-${++callId}`
        })
        return JSON.parse(reply.text)
      }
      const capture = async (elementId: string | null) => {
        const receipt = await invoke(AiActionNames.INSPECT_DRAWING, {
          arguments: { elementId, view: 'overview' }
        })
        const image = receipt.actionResults?.find(
          (entry: { result: { inspectionId?: string } }) =>
            entry.result.inspectionId
        )?.result
        if (!image) throw new Error(JSON.stringify({ elementId, receipt }))
        expect(image).toMatchObject({
          inspectionId: expect.any(String),
          available: true
        })
        expect(image.image.dataUrl).toMatch(/^data:image\/png;base64,/)
        return image.inspectionId as string
      }
      let visualUse: unknown
      const judgment = (
        criterionId: string,
        inspectionId: string,
        status = 'pass'
      ) => ({
        criterionId,
        ...(criterionId === 'Left' && visualUse
          ? { referenceUses: [visualUse] }
          : {}),
        inspectionIds: [inspectionId],
        status,
        evidence: `${criterionId} ${status} from the delivered target image`
      })
      const bindReview = async (
        phase: string,
        judgments: ReturnType<typeof judgment>[]
      ) => {
        const bound = await invoke(AiDesignToolIds.REVIEW_DRAWING, {
          phase,
          bindChecks: judgments.map(
            ({ status: _status, evidence: _evidence, ...selection }) =>
              selection
          )
        })
        if (!bound.next?.arguments?.checks) return { unavailable: bound }
        return {
          input: {
            ...bound.next.arguments,
            ...(phase === 'visual' ? { final: true } : {}),
            checks: bound.next.arguments.checks.map(
              (check: Record<string, unknown>, index: number) => ({
                ...check,
                status: judgments[index].status,
                evidence: judgments[index].evidence
              })
            )
          }
        }
      }
      const review = async (
        phase: string,
        judgments: ReturnType<typeof judgment>[]
      ) => {
        const bound = await bindReview(phase, judgments)
        return bound.input
          ? invoke(AiDesignToolIds.REVIEW_DRAWING, bound.input)
          : bound.unavailable
      }
      const read = async () =>
        (
          await invoke(AiDesignToolIds.READ_DESIGN_CHECKS, {
            includePassed: true
          })
        ).items as StoredCheck[]
      const completed: AiActionBatch = {
        batchId: 'completed',
        actions: [
          {
            id: 'done',
            name: AiActionNames.REPORT_OUTCOME,
            arguments: {
              outcome: 'completed',
              message: 'Independent checks recovered and completed.'
            },
            summary: 'Finish review'
          }
        ]
      }
      const settled = async () => {
        await operations.validateCompletion(controller.signal)
        return operations.settleOutcome(completed)
      }
      try {
        const beforeAdmission = dispatched.length
        const rejected = await invoke(
          AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
          recordedScope.plan
        )
        expect(rejected).not.toMatchObject({ recorded: true })
        expect(JSON.stringify(rejected)).toContain('requiredUnits')
        expect(dispatched).toHaveLength(beforeAdmission)
        expect(checks.read({ includePassed: true }).items).toEqual([])
        expect(
          await invoke(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
            phase: 'plan',
            method: 'Inspect each independent editable part',
            references: [],
            criteria: {
              Left: {
                requirement: 'Verify the left part',
                description: 'Check the left rectangle',
                verification: 'visual',
                requiredUnits: []
              },
              Prepared: {
                requirement: 'Verify the prepared source panel',
                description: 'Inspect the newly applied editable panel',
                verification: 'visual',
                requiredUnits: []
              },
              Right: {
                requirement: 'Verify the right part',
                description: 'Check the right rectangle',
                verification: 'visual',
                requiredUnits: []
              }
            },
            structureCriteria: ['Left'],
            detailRequired: false
          })
        ).toMatchObject({ recorded: true })
        const validated = await invoke('images.validate_reference_images', {
          attachmentIndexes: [0]
        })
        expect(JSON.stringify(validated)).toContain('reference:')
        const selected = await invoke(
          AiDesignToolIds.SELECT_DESIGN_REFERENCES,
          {
            referenceImageIndexes: [0],
            requirementRevision: 1,
            referenceDecisions: [
              {
                referenceId: validated.references[0].referenceId,
                status: 'accepted',
                reason:
                  'Controlled primary-agent choice for the left surface only',
                uses: ['preparation', 'visual'].map((purpose) => ({
                  id: purpose,
                  criterionId: 'Left',
                  purpose,
                  region: 'whole',
                  limitations: []
                }))
              }
            ]
          }
        )
        const uses = selected.referenceDecisions[0].uses
        visualUse = uses.find(
          (use: { purpose: string }) => use.purpose === 'visual'
        ).receipt
        const prepared = await invoke('design.prepare_design', {
          draft: {
            type: 'frame',
            name: 'Prepared source panel',
            width: 40,
            height: 40,
            children: [
              {
                type: 'rect',
                key: 'surface',
                name: 'Surface',
                width: 30,
                height: 30,
                fill: '#223344'
              }
            ]
          }
        })
        expect(prepared, JSON.stringify(prepared)).toMatchObject({
          available: true
        })
        const preparation = {
          artifactId: prepared.artifactId,
          criterionIds: ['Left'],
          referenceUses: [
            uses.find(
              (use: { purpose: string }) => use.purpose === 'preparation'
            ).receipt
          ]
        }
        const firstPreparation = await invoke(
          AiDesignToolIds.REVIEW_PREPARED_DESIGN,
          preparation
        )
        expect(firstPreparation).toMatchObject({
          status: 'pass',
          appearance: 'unverified',
          reused: false
        })
        const repeatedPreparation = await invoke(
          AiDesignToolIds.REVIEW_PREPARED_DESIGN,
          preparation
        )
        expect(
          repeatedPreparation,
          JSON.stringify({
            firstPreparation,
            repeatedPreparation,
            attachmentReceipts
          })
        ).toMatchObject({ status: 'pass', reused: true })
        const applied = await invoke(AiActionNames.APPLY_PREPARED_DESIGN, {
          arguments: { artifactId: prepared.artifactId },
          inspection: 'defer'
        })
        expect(applied).toMatchObject({
          toolOutcome: { status: 'success' },
          inspectionDeferred: true,
          measurementDeferred: false
        })
        expect(JSON.stringify(applied).length).toBeLessThan(8192)
        before = await getCoreDocumentDigest(page)
        const appliedRoot = applied.actionResults.find(
          (entry: { result: { compositionId?: string } }) =>
            entry.result.compositionId
        )?.result.compositionId
        expect(appliedRoot).toEqual(expect.any(String))
        const preparedImage = await capture(appliedRoot)
        expect(
          await review('visual', [judgment('Prepared', preparedImage)])
        ).toMatchObject({ accepted: false })
        let a = await capture(left)
        const b = await capture(right)
        const beforeJudgments = checks.read({ includePassed: true })
        const missingScope = await invoke(AiDesignToolIds.REVIEW_DRAWING, {
          phase: 'visual',
          inspectionIds: [a, b],
          checks: [
            {
              criterionId: 'Left',
              status: 'pass',
              evidence: 'Missing explicit image dependency'
            }
          ]
        })
        expect(JSON.stringify(missingScope)).toContain('inspectionIds')
        expect(checks.read({ includePassed: true })).toEqual(beforeJudgments)

        // Existing-content judgments must govern settlement without a synthetic edit.
        expect(
          await review('visual', [
            judgment('Left', a, 'fail'),
            judgment('Right', b, 'fail')
          ])
        ).toMatchObject({ accepted: false })
        expect((await settled()).actions[0].arguments).toMatchObject({
          outcome: 'unsupported'
        })
        const partial = await review('visual', [judgment('Left', a)])
        expect(partial).toMatchObject({ accepted: false })
        expect(JSON.stringify(partial)).toContain(
          'Right fail from the delivered target image'
        )
        const completedReview = await review('visual', [judgment('Right', b)])
        expect(completedReview, JSON.stringify(completedReview)).toMatchObject({
          accepted: true
        })
        expect(await settled()).toEqual(completed)
        const passed = await read()
        const rightPass = passed.find((check) => check.criterionId === 'Right')
        expect(rightPass).toMatchObject({
          origin: 'main-agent',
          status: 'pass'
        })
        expect(
          await review('structure', [judgment('Left', a, 'fail')])
        ).toMatchObject({ accepted: false })
        expect((await settled()).actions[0].arguments).toMatchObject({
          outcome: 'unsupported'
        })
        expect(
          (await read()).find((check) => check.id === rightPass?.id)
        ).toEqual(rightPass)
        expect(await review('structure', [judgment('Left', a)])).toMatchObject({
          accepted: false
        })
        expect((await settled()).actions[0].arguments).toMatchObject({
          outcome: 'unsupported'
        })
        expect(await review('visual', [judgment('Left', a)])).toMatchObject({
          accepted: true
        })
        // Reject at the external read boundary, preserving the retained store.
        const retained = checks.read({ includePassed: true })
        rejectValidation = true
        const interrupted = await review('visual', [
          judgment('Left', a, 'fail')
        ])
        expect(
          interrupted,
          'Disconnected validation must not publish a judgment'
        ).not.toMatchObject({ accepted: true })
        expect(checks.read({ includePassed: true })).toEqual(retained)
        expect(await review('visual', [judgment('Left', a)])).toMatchObject({
          accepted: true
        })
        const count = dispatched.length
        const cancelled = new AbortController()
        cancelled.abort()
        await expect(
          invoke(
            AiActionNames.INSPECT_DRAWING,
            { arguments: { elementId: left } },
            cancelled.signal
          )
        ).rejects.toThrow()
        expect(dispatched).toHaveLength(count)
        expect(checks.read({ includePassed: true })).toEqual(retained)
        const lateCancel = new AbortController()
        const lateSubmission = await bindReview('visual', [
          judgment('Left', a, 'fail')
        ])
        cancelAfterValidation = lateCancel
        await expect(
          invoke(
            AiDesignToolIds.REVIEW_DRAWING,
            lateSubmission.input,
            lateCancel.signal
          )
        ).rejects.toThrow()
        expect(checks.read({ includePassed: true })).toEqual(retained)
        const unavailable = await invoke(AiDesignToolIds.REVIEW_DRAWING, {
          phase: 'visual',
          inspections: [
            {
              elementId: 'missing-review-target',
              view: 'overview',
              checks: [{ criterionId: 'Left' }]
            }
          ]
        })
        expect(unavailable).toMatchObject({
          accepted: false,
          status: 'partial'
        })
        expect((await settled()).actions[0].arguments).toMatchObject({
          outcome: 'unsupported'
        })
        a = await capture(left)
        expect(await review('visual', [judgment('Left', a)])).toMatchObject({
          accepted: true
        })
        await page.evaluate(async () => {
          const { viewportApis } = await import('../src/common-apis')
          viewportApis.panTo(900, 900)
          viewportApis.zoomToCenter(0.25, 0, 0)
        })
        expect(await settled()).toEqual(completed)
        expect(
          (await read()).find((check) => check.id === rightPass?.id)
        ).toEqual(rightPass)
        // A real browser edit changes only the left dependency, not the right pass.
        const beforeMutationDispatch = dispatched.length
        const mutation = await invoke('api_core_updateElementProperties', {
          arguments: { updates: [{ elementId: left, values: { width: 120 } }] },
          inspection: 'defer'
        })
        expect(mutation, JSON.stringify(mutation)).toMatchObject({
          toolOutcome: { status: 'success' }
        })
        expect(mutation).toMatchObject({
          inspectionDeferred: true,
          measurementDeferred: false
        })
        expect(dispatched.slice(beforeMutationDispatch)).toContain(
          AiActionNames.REVIEW_DESIGN
        )
        expect(dispatched.slice(beforeMutationDispatch)).not.toContain(
          AiActionNames.INSPECT_DRAWING
        )
        expect(
          await review('visual', [judgment('Left', a)]),
          'Changed browser dependency must reject old evidence'
        ).not.toMatchObject({ accepted: true })
        const changed = await read()
        expect(changed.find((check) => check.id === rightPass?.id)).toEqual(
          rightPass
        )
        expect(
          changed.find((check) => check.criterionId === 'Left')?.status
        ).not.toBe('pass')
        expect((await settled()).actions[0].arguments).toMatchObject({
          outcome: 'unsupported'
        })
        await invoke('api_core_updateElementProperties', {
          arguments: { updates: [{ elementId: left, values: { width: 100 } }] },
          inspection: 'defer'
        })
        const retiredLeft = a
        a = await capture(left)
        const recovery = await bindReview('visual', [judgment('Left', a)])
        expect(
          await invoke(AiDesignToolIds.REVIEW_DRAWING, {
            ...recovery.input,
            inspectionIds: [retiredLeft, a, b]
          }),
          'An available-list entry not cited by any judgment cannot reject local recovery'
        ).toMatchObject({ accepted: true })
        const recovered = checks.read({ includePassed: true })
        expect(
          await review('visual', [judgment('Left', retiredLeft)]),
          'Explicitly citing retired evidence must still be rejected'
        ).not.toMatchObject({ accepted: true })
        expect(checks.read({ includePassed: true })).toEqual(recovered)
        expect(await review('visual', [judgment('Left', a)])).toMatchObject({
          accepted: true
        })
        expect(
          (await read()).find((check) => check.id === rightPass?.id)
        ).toEqual(rightPass)
        expect(
          dispatched.filter(
            (name) => name === 'api_core_updateElementProperties'
          )
        ).toHaveLength(2)
        exportedDocument = await page.evaluate(async () =>
          (await import('../src/testing/runtime-access')).core.save()
        )
        const exported = await invoke(AiActionNames.EXPORT_DOCUMENT, {
          arguments: {}
        })
        const artifact = exported.actionResults[0].result.artifact
        exportMetadata = artifact
        expect(JSON.stringify(exported).length).toBeLessThan(4096)
        expect(
          await invoke(AiActionNames.DOWNLOAD_DOCUMENT_EXPORT, {
            arguments: { artifactId: artifact.artifactId }
          })
        ).toMatchObject({ toolOutcome: { status: 'success' } })
        return await settled()
      } catch (error) {
        bridgeFailure = error
        throw error
      } finally {
        await host.dispose()
      }
    }
  )
  const result = await page.evaluate(async () => {
    const { createAiStartup } = await import('../src/ai/startup')
    const { createAiConfirmationBroker } =
      await import('../src/ai/confirmation')
    const { createAiHistoryProjection } =
      await import('../src/common-apis/history')
    const { testRuntimeState } = await import('../src/testing/runtime-access')
    let providerError: string | undefined
    const provider: AiProvider = {
      requestActionBatch: async (input, { executeBatch }) => {
        try {
          if (!executeBatch) throw new Error('Missing runtime executor')
          testRuntimeState.set('review-handoff-execute', executeBatch)
          return await (
            window as unknown as {
              driveReviewHandoff(input: unknown): Promise<AiActionBatch>
            }
          ).driveReviewHandoff(JSON.parse(JSON.stringify(input)))
        } catch (error) {
          providerError = String(error)
          throw error
        }
      }
    }
    const startup = createAiStartup({
      createProvider: () => provider,
      createConfirmation: createAiConfirmationBroker,
      createHistory: createAiHistoryProjection
    })
    const { runtime } = startup
    try {
      const outcome = await runtime.run({
        intent: 'Review and correct the two existing parts.',
        signal: new AbortController().signal
      })
      return {
        status: outcome.status,
        transaction: 'transaction' in outcome ? outcome.transaction : undefined,
        final: outcome.audit.actions.at(-1)?.result,
        providerError
      }
    } finally {
      testRuntimeState.delete('review-handoff-execute')
      await runtime.dispose()
      startup.history.dispose()
      startup.confirmation.dispose()
    }
  })
  if (bridgeFailure) throw bridgeFailure
  expect(result.providerError).toBeUndefined()
  expect(result).toMatchObject({
    status: 'executed',
    transaction: { status: 'committed' }
  })
  expect(result.final).toMatchObject({
    action: 'report_outcome',
    outcome: 'completed',
    persistence: { status: 'durable' }
  })
  expect(providerCalls).toBe(1)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
  const downloaded = await downloadPromise
  const path = testInfo.outputPath('handoff-export.json')
  await downloaded.saveAs(path)
  const { readFile } = await import('node:fs/promises')
  const { createHash } = await import('node:crypto')
  const bytes = await readFile(path)
  expect(JSON.parse(bytes.toString())).toEqual(exportedDocument)
  expect(bytes.byteLength).toBe(exportMetadata?.bytes)
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(
    exportMetadata?.sha256
  )
  await page.reload()
  await waitForAppReady(page)
  await waitForCollaboration(page)
  expect(await getCoreDocumentDigest(page)).toEqual(before)
})

// The external model is scripted; registry, finite iteration, browser actions,
// canonical checks, Factory, collaboration and document persistence remain real.
for (const mode of [
  'complete',
  'basis-changed',
  'no-progress',
  'cancel-after-write',
  'interrupted-after-write'
] as const)
  test(`aggregate mechanical repair preserves independent passes through history and durable reload - ${mode}`, async ({
    page,
    browser
  }, testInfo) => {
    const { createLocalOperationTools } =
      await import('../server/local-operation-tools')
    const { BrowserBatchExecutionError, requireBatchSuccess } =
      await import('../server/batch-exchange')
    const { createLocalToolHost } = await import('../server/local-tool-host')
    const { createDesignCheckResults, designCheckInputSchema } =
      await import('../server/design-check-results')
    const { prescribedPositionsSchema } =
      await import('../src/ai/prescribed-position-contract')
    type ProviderInput =
      import('../src/ai/action-batch-protocol').AiProviderInput
    type Receipt = import('../src/ai/action-batch-protocol').AiBatchReceipt
    const { createLocalToolStore } = await import('../server/local-tool-store')
    const openStore = () =>
      createLocalToolStore({
        directory: testInfo.outputPath('tool-library'),
        capacity: 32,
        recordBytes: 262144,
        totalBytes: 1048576
      })
    let database = await openStore()
    let failEligibility = false
    const store: import('@asyra/ai-agent-runtime').AiToolStore = {
      read: (key) => database.read(key),
      list: (limit) => database.list(limit),
      write: (value) => {
        if (
          failEligibility &&
          (value.record as { availability?: string }).availability ===
            'eligible'
        )
          throw new Error('Injected library acknowledgement failure')
        return database.write(value)
      }
    }
    const document = createTestDocumentIdentity()
    const peer = await browser.newPage({
      baseURL: String(testInfo.project.use.baseURL)
    })
    let bridgeFailure: unknown
    let recoveryBefore:
      Awaited<ReturnType<typeof getCoreDocumentDigest>> | undefined
    let basisChanged = false
    const dispatched: string[] = []
    const measured: string[] = []
    let primaryCalls = 0
    try {
      await page.goto(document.url)
      await waitForAppReady(page)
      await waitForCollaboration(page)
      const ids = await page.evaluate(async () => {
        const { core } = await import('../src/testing/runtime-access')
        const { transactionApis } = await import('../src/common-apis')
        return transactionApis.runTransaction(() => {
          const roots = core.createElementsInParent(
            Array.from({ length: 8 }, (_, i) => ({
              type: 'frame',
              x: i * 140,
              y: 20,
              width: 100,
              height: 100
            })),
            core.getCurrentWorkspaceId()
          )
          const children = roots.map((parentId, i) =>
            core.createElementInParent(
              {
                type: 'rect',
                x: i === 2 ? 90 : 10,
                y: 10,
                width: 30,
                height: 20
              },
              parentId
            )
          )
          return { roots, children }
        })
      })
      const before = await getCoreDocumentDigest(page)
      await expect
        .poll(() => getPersistedDocumentDigest(document.fileId))
        .toEqual(before)
      await peer.goto(document.url)
      await waitForAppReady(peer)
      await waitForCollaboration(peer)
      await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(before)
      await page.exposeFunction(
        'driveMechanicalRepair',
        async (input: ProviderInput) => {
          primaryCalls++
          const controller = new AbortController()
          let checks = createDesignCheckResults()
          const events: {
            phase: string
            callId: string
            parentCallId?: string
            name: string
          }[] = []
          const createHost = (requestId: string) =>
            createLocalToolHost({
              requestId,
              signal: controller.signal,
              observe: (event) => {
                events.push({
                  phase: event.phase,
                  callId: event.call.callId,
                  parentCallId: event.call.parentCallId,
                  name: event.call.name
                })
              },
              capacity: 32,
              receiptCapacity: 64,
              artifactCapacity: 32,
              limits: {
                bytes: 48000,
                steps: 20,
                bindings: 200,
                bindingDepth: 32,
                issues: 10
              },
              store,
              createGroups: (ownership) => [
                {
                  name: 'design_operations',
                  description: 'Actual mechanical operations',
                  owner: createLocalOperationTools(
                    input.actions,
                    {
                      modelActions: (value) => value,
                      resolveBatch: (value) => value,
                      checkResults: checks
                    },
                    async (batch) => {
                      dispatched.push(
                        ...batch.actions.map((action) => action.name)
                      )
                      for (const action of batch.actions)
                        if (action.name === 'review_design')
                          measured.push(String(action.arguments.elementId))
                      if (
                        mode === 'basis-changed' &&
                        !basisChanged &&
                        batch.actions.some(
                          (action) =>
                            action.name === 'apply_prescribed_positions'
                        )
                      ) {
                        basisChanged = true
                        await page.evaluate(async (parentId) => {
                          const { core } =
                            await import('../src/testing/runtime-access')
                          const { transactionApis } =
                            await import('../src/common-apis')
                          transactionApis.runTransaction(() =>
                            core.updateElementProperties([
                              { elementId: parentId, values: { x: 350 } }
                            ])
                          )
                        }, ids.roots[2])
                        recoveryBefore = await getCoreDocumentDigest(page)
                        expect(recoveryBefore).not.toEqual(before)
                      }
                      const receipt = await page.evaluate(
                        async (serialized) => {
                          const { testRuntimeState } =
                            await import('../src/testing/runtime-access')
                          const execute = testRuntimeState.get<
                            (batch: AiActionBatch) => Promise<Receipt>
                          >('mechanical-integration-execute')
                          if (!execute)
                            throw new Error('Missing actual runtime executor')
                          return JSON.parse(
                            JSON.stringify(
                              await execute(JSON.parse(serialized))
                            )
                          )
                        },
                        JSON.stringify(batch)
                      )
                      if (
                        batch.actions.some(
                          (action) =>
                            action.name === 'apply_prescribed_positions'
                        )
                      ) {
                        if (mode === 'cancel-after-write') controller.abort()
                        if (mode === 'interrupted-after-write')
                          throw new BrowserBatchExecutionError(
                            {
                              batchId: batch.batchId,
                              code: 'BROWSER_BATCH_EXECUTION_FAILED',
                              message:
                                'Injected delivery interruption after acknowledged write',
                              executionMs: 0,
                              handlerMs: 0
                            },
                            {
                              ...receipt,
                              failure: {
                                code: 'INJECTED_DELIVERY_FAILURE',
                                message:
                                  'Injected delivery interruption after acknowledged write',
                                stage: 'execution',
                                settlement: 'completed',
                                contextFresh: true
                              }
                            }
                          )
                      }
                      return requireBatchSuccess(batch, receipt, 0)
                    },
                    { ownership, requestSignal: controller.signal }
                  )
                }
              ]
            })
          let host = createHost('mechanical-integration')
          const invoke = async (name: string, input: unknown) =>
            JSON.parse((await host.invoke({ name, input })).text)
          try {
            const selection = []
            for (const root of ids.roots) {
              const receipt = await invoke('design_operations.review_design', {
                arguments: { elementId: root }
              })
              expect(receipt, JSON.stringify(receipt)).toMatchObject({
                toolOutcome: { status: 'success' },
                mechanicalSelection: { requestId: 'mechanical-integration' }
              })
              selection.push(...receipt.mechanicalSelection.checks)
            }
            const independent = checks
              .read({ includePassed: true })
              .items.filter((item) => item.status === 'pass')
            expect(independent).toHaveLength(7)
            const attachment = await invoke(
              'design_operations.read_design_attachment',
              { arguments: { parentId: ids.roots[2] } }
            )
            const basis = attachment.actionResults[0].result
            const policy = {
              capability: 'set-prescribed-child-position',
              positions: [
                {
                  elementId: ids.children[2],
                  x: mode === 'no-progress' ? 90 : 50,
                  y: 10,
                  attachmentEvidence: {
                    parentId: basis.parentId,
                    workspaceId: basis.workspaceId,
                    evidence: basis.evidence
                  }
                }
              ]
            }
            const state = {
              requestId: 'mechanical-integration',
              checks: selection
            }
            const foreign = await invoke(
              'design_operations.verify_design_checks',
              { ...state, requestId: 'another-request' }
            )
            expect(foreign).toMatchObject({
              toolOutcome: { status: 'failed', settlement: 'not-started' }
            })
            const invalid = await invoke(
              'design_operations.repair_design_checks',
              {
                ...state,
                policy: {
                  ...policy,
                  positions: [
                    ...policy.positions,
                    { ...policy.positions[0], elementId: ids.children[0] }
                  ]
                }
              }
            )
            expect(invalid, JSON.stringify(invalid)).toMatchObject({
              toolOutcome: { status: 'failed', settlement: 'not-started' }
            })
            expect(dispatched).not.toContain('apply_prescribed_positions')
            const definition = (name: string) => {
              const result = host
                .definitions()
                .find((item) => item.name === name)
              if (!result) throw new Error(`Missing ${name}`)
              return result
            }
            const verifier = definition('verify_design_checks'),
              repair = definition('repair_design_checks')
            const fields = (step: string) => ({
              kind: 'object',
              fields: {
                requestId: { kind: 'step', step, path: '/requestId' },
                checks: { kind: 'step', step, path: '/checks' }
              }
            })
            const policySchema = {
              type: 'object',
              additionalProperties: false,
              required: ['capability', 'positions'],
              properties: {
                capability: {
                  type: 'string',
                  enum: ['set-prescribed-child-position']
                },
                positions: prescribedPositionsSchema
              }
            }
            const recipe = {
              format: 1,
              name: 'correct-selected-container',
              revision: 1,
              description:
                'Verify selected canonical checks and apply only prescribed local positions.',
              inputSchema: {
                type: 'object',
                additionalProperties: false,
                required: ['selection', 'policy'],
                properties: {
                  selection: designCheckInputSchema,
                  policy: policySchema
                }
              },
              outputSchema: { type: 'string' },
              steps: [
                {
                  id: 'admitted',
                  tool: verifier.registeredName,
                  revision: verifier.revision,
                  input: { kind: 'input', path: '/selection' }
                }
              ],
              iteration: {
                id: 'closed',
                stateSchema: designCheckInputSchema,
                state: fields('admitted'),
                check: {
                  id: 'check',
                  tool: verifier.registeredName,
                  revision: verifier.revision,
                  input: { kind: 'state', path: '' }
                },
                repairs: [
                  {
                    id: 'repair',
                    tool: repair.registeredName,
                    revision: repair.revision,
                    input: {
                      kind: 'object',
                      fields: {
                        ...fields('check').fields,
                        policy: { kind: 'input', path: '/policy' }
                      }
                    }
                  }
                ],
                next: fields('repair'),
                maxIterations: 2
              },
              output: {
                kind: 'step',
                step: 'closed',
                path: '/result/verification/status'
              }
            }
            const submitted = await invoke('tool_library.submit_tool', {
              submissionId: 'correct-selected-container',
              proposal: recipe
            })
            expect(submitted, JSON.stringify(submitted)).toMatchObject({
              ok: true
            })
            if (mode === 'complete') failEligibility = true
            if (mode === 'cancel-after-write') {
              await expect(
                invoke('tool_library.invoke_tool', {
                  name: recipe.name,
                  revision: 1,
                  input: { selection: state, policy }
                })
              ).rejects.toMatchObject({ name: 'AbortError' })
            } else {
              const result = await invoke('tool_library.invoke_tool', {
                name: recipe.name,
                revision: 1,
                input: { selection: state, policy }
              })
              if (mode === 'complete') {
                expect(result, JSON.stringify(result)).toMatchObject({
                  execution: { status: 'success', value: 'pass' },
                  storage: { status: 'unsaved' },
                  receiptId: expect.any(String)
                })
                const beforeSave = await getCoreDocumentDigest(page)
                const beforeChecks = checks.read({ includePassed: true })
                const beforeCalls = [...dispatched]
                failEligibility = false
                expect(
                  await invoke('tool_library.save_tool', {
                    name: recipe.name,
                    revision: 1,
                    receiptId: result.receiptId
                  })
                ).toMatchObject({ status: 'saved', availability: 'eligible' })
                expect(await getCoreDocumentDigest(page)).toEqual(beforeSave)
                expect(checks.read({ includePassed: true })).toEqual(
                  beforeChecks
                )
                expect(dispatched).toEqual(beforeCalls)
                await expect
                  .poll(() => getPersistedDocumentDigest(document.fileId))
                  .toEqual(beforeSave)
              } else {
                expect(
                  result.execution.status,
                  JSON.stringify(result)
                ).not.toBe('success')
                expect(result.storage).toBeUndefined()
                if (mode === 'basis-changed') {
                  expect(
                    result.execution.recovery,
                    JSON.stringify(result.execution.recovery)
                  ).toEqual(
                    expect.arrayContaining([
                      expect.objectContaining({
                        name: 'design_operations.repair_design_checks',
                        settlement: 'not-started'
                      })
                    ])
                  )
                  const recovered = await invoke(
                    'design_operations.verify_design_checks',
                    {
                      requestId: state.requestId,
                      checks: checks.selection(
                        selection.map((item) => item.checkId)
                      )
                    }
                  )
                  expect(recovered, JSON.stringify(recovered)).toMatchObject({
                    toolOutcome: { status: 'success' },
                    verification: { status: 'repairable' }
                  })
                  const attachment = await invoke(
                    'design_operations.read_design_attachment',
                    { arguments: { parentId: ids.roots[2] } }
                  )
                  const fresh = attachment.actionResults[0].result
                  const retry = await invoke('tool_library.invoke_tool', {
                    name: recipe.name,
                    revision: 1,
                    input: {
                      selection: {
                        requestId: recovered.requestId,
                        checks: recovered.checks
                      },
                      policy: {
                        ...policy,
                        positions: [
                          {
                            ...policy.positions[0],
                            attachmentEvidence: {
                              parentId: fresh.parentId,
                              workspaceId: fresh.workspaceId,
                              evidence: fresh.evidence
                            }
                          }
                        ]
                      }
                    }
                  })
                  expect(retry, JSON.stringify(retry)).toMatchObject({
                    execution: { status: 'success', value: 'pass' }
                  })
                } else if (mode === 'no-progress')
                  expect(result.execution.issues).toContain(
                    'Repeated verification progress'
                  )
                else {
                  expect(JSON.stringify(result.execution.recovery)).toContain(
                    ids.children[2]
                  )
                  const recovered = await invoke(
                    'design_operations.verify_design_checks',
                    {
                      requestId: state.requestId,
                      checks: checks.selection(
                        selection.map((item) => item.checkId)
                      )
                    }
                  )
                  expect(recovered, JSON.stringify(recovered)).toMatchObject({
                    toolOutcome: { status: 'success' },
                    verification: { status: 'pass' }
                  })
                }
              }
            }
            if (mode === 'complete') {
              // Keep the real host alive while another actor invalidates one pass.
              const repaired = await getCoreDocumentDigest(page)
              await expect
                .poll(() => getCoreDocumentDigest(peer))
                .toEqual(repaired)
              const currentSelection = () => ({
                requestId: state.requestId,
                checks: checks.selection(selection.map((item) => item.checkId))
              })
              const settled = await invoke(
                'design_operations.verify_design_checks',
                currentSelection()
              )
              expect(settled.verification.status).toBe('pass')
              const firstRead = measured.length
              await peer.evaluate(async (elementId) => {
                const { core } = await import('../src/testing/runtime-access')
                const { transactionApis } = await import('../src/common-apis')
                transactionApis.runTransaction(() =>
                  core.updateElementProperties([
                    { elementId, values: { x: 90 } }
                  ])
                )
              }, ids.children[2])
              const changed = await getCoreDocumentDigest(peer)
              expect(changed).not.toEqual(repaired)
              await expect
                .poll(() => getCoreDocumentDigest(page))
                .toEqual(changed)
              const reopened = await invoke(
                'design_operations.verify_design_checks',
                currentSelection()
              )
              expect(reopened.verification.status).toBe('repairable')
              expect(reopened.unresolved).toHaveLength(1)
              expect(reopened.unresolved[0].checkId).toBe(selection[2].checkId)
              expect(measured.slice(firstRead)).toEqual([ids.roots[2]])
              await undo(peer)
              await expect
                .poll(() => getCoreDocumentDigest(page))
                .toEqual(repaired)
              await expect
                .poll(() => getPersistedDocumentDigest(document.fileId))
                .toEqual(repaired)
              const restored = await invoke(
                'design_operations.verify_design_checks',
                currentSelection()
              )
              expect(restored.verification.status).toBe('pass')
              expect(restored.unresolved).toEqual([])
              expect(measured.slice(firstRead)).toEqual([
                ids.roots[2],
                ids.roots[2]
              ])
              expect(restored.checks[2].revision).toBeGreaterThan(
                settled.checks[2].revision
              )
            }
            expect(
              checks
                .read({ includePassed: true })
                .items.filter((item) =>
                  independent.some((prior) => prior.id === item.id)
                )
            ).toEqual(independent)
            if (mode === 'complete') {
              const beforeReuse = await getCoreDocumentDigest(page)
              await host.dispose()
              database.close()
              database = await openStore()
              checks = createDesignCheckResults()
              host = createHost('mechanical-fresh-request')
              expect(await host.load()).toMatchObject({
                loaded: [recipe.name],
                unavailable: []
              })
              expect(
                await invoke('tool_library.save_tool', {
                  name: recipe.name,
                  revision: 1,
                  receiptId: 'expired-receipt'
                })
              ).toMatchObject({ status: 'unsaved' })
              const old = await invoke(
                'design_operations.verify_design_checks',
                state
              )
              expect(old).toMatchObject({
                available: false,
                toolOutcome: { status: 'failed', settlement: 'not-started' }
              })
              const fresh = await invoke('design_operations.review_design', {
                arguments: { elementId: ids.roots[2] }
              })
              const attachment = await invoke(
                'design_operations.read_design_attachment',
                { arguments: { parentId: ids.roots[2] } }
              )
              const basis = attachment.actionResults[0].result
              const reused = await invoke('tool_library.invoke_tool', {
                name: recipe.name,
                revision: 1,
                input: {
                  selection: fresh.mechanicalSelection,
                  policy: {
                    ...policy,
                    positions: [
                      {
                        ...policy.positions[0],
                        x: 17,
                        attachmentEvidence: {
                          parentId: basis.parentId,
                          workspaceId: basis.workspaceId,
                          evidence: basis.evidence
                        }
                      }
                    ]
                  }
                }
              })
              expect(reused).toMatchObject({
                execution: { status: 'success', value: 'pass' },
                storage: { status: 'saved' }
              })
              expect(await getCoreDocumentDigest(page)).toEqual(beforeReuse)
            }
            expect(
              dispatched.filter((name) => name === 'apply_prescribed_positions')
            ).toHaveLength(mode === 'basis-changed' ? 2 : 1)
            for (const started of events.filter(
              (event) => event.phase === 'started'
            )) {
              expect(
                events.filter(
                  (event) =>
                    event.callId === started.callId && event.phase !== 'started'
                )
              ).toHaveLength(1)
            }
            const nestedRepair = events.find(
              (event) =>
                event.name === 'design_operations.repair_design_checks' &&
                event.parentCallId &&
                event.phase === 'started'
            )
            expect(nestedRepair).toBeDefined()
            return {
              batchId: 'mechanical-finished',
              actions: [
                {
                  id: 'done',
                  name: 'report_outcome',
                  arguments: {
                    outcome: 'unsupported',
                    message:
                      'Mechanical checks passed. Primary visual judgment remains separate.'
                  },
                  summary: 'Report mechanical completion'
                }
              ]
            }
          } catch (error) {
            bridgeFailure = error
            throw error
          } finally {
            await host.dispose()
          }
        }
      )
      const result = await page.evaluate(async () => {
        const { createAiStartup } = await import('../src/ai/startup')
        const { createAiConfirmationBroker } =
          await import('../src/ai/confirmation')
        const { createAiHistoryProjection } =
          await import('../src/common-apis/history')
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')
        let providerError: string | undefined
        const provider: AiProvider = {
          requestActionBatch: async (input, { executeBatch }) => {
            if (!executeBatch) throw new Error('Missing runtime executor')
            testRuntimeState.set('mechanical-integration-execute', executeBatch)
            try {
              return await (
                window as unknown as {
                  driveMechanicalRepair(input: unknown): Promise<AiActionBatch>
                }
              ).driveMechanicalRepair(JSON.parse(JSON.stringify(input)))
            } catch (error) {
              providerError = String(error)
              throw error
            }
          }
        }
        const startup = createAiStartup({
          createProvider: () => provider,
          createConfirmation: createAiConfirmationBroker,
          createHistory: createAiHistoryProjection
        })
        try {
          const outcome = await startup.runtime.run({
            intent:
              'Correct the prescribed child position and verify only mechanical checks.',
            signal: new AbortController().signal
          })
          return { status: outcome.status, providerError }
        } finally {
          testRuntimeState.delete('mechanical-integration-execute')
          await startup.runtime.dispose()
          startup.history.dispose()
          startup.confirmation.dispose()
        }
      })
      if (bridgeFailure) throw bridgeFailure
      expect(result, JSON.stringify(result)).toMatchObject({
        status: 'executed'
      })
      expect(result.providerError).toBeUndefined()
      expect(primaryCalls).toBe(1)
      const after = await getCoreDocumentDigest(page)
      if (mode === 'no-progress') {
        expect(after).toEqual(before)
        await page.reload()
        await waitForAppReady(page)
        await waitForCollaboration(page)
        expect(await getCoreDocumentDigest(page)).toEqual(before)
        return
      }
      expect(after).not.toEqual(before)
      await expect
        .poll(() => getPersistedDocumentDigest(document.fileId))
        .toEqual(after)
      await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(after)
      await undo(page)
      await expect
        .poll(() => getCoreDocumentDigest(page))
        .toEqual(recoveryBefore ?? before)
      await expect
        .poll(() => getCoreDocumentDigest(peer))
        .toEqual(recoveryBefore ?? before)
      await expect
        .poll(() => getPersistedDocumentDigest(document.fileId))
        .toEqual(recoveryBefore ?? before)
      await redo(page)
      await expect.poll(() => getCoreDocumentDigest(page)).toEqual(after)
      await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(after)
      await expect
        .poll(() => getPersistedDocumentDigest(document.fileId))
        .toEqual(after)
      await page.reload()
      await waitForAppReady(page)
      await waitForCollaboration(page)
      expect(await getCoreDocumentDigest(page)).toEqual(after)
    } finally {
      database.close()
      await peer.close()
    }
  })
