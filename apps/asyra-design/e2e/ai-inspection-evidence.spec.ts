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

test('manual edits, Undo, Redo and document load invalidate canonical inspection evidence', async ({
  page
}) => {
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await waitForCollaboration(page)
  expect(await captureEvidence(page)).toBe(true)

  await createRectangle(page)
  await expect.poll(() => evidenceIsCurrent(page)).toBe(false)
  expect(await captureEvidence(page)).toBe(true)

  // Selection and viewport changes do not mutate the inspected document.
  await page.keyboard.press('Escape')
  await page.keyboard.press('Meta+1')
  expect(await evidenceIsCurrent(page)).toBe(true)

  await undo(page)
  await expect.poll(() => evidenceIsCurrent(page)).toBe(false)
  expect(await captureEvidence(page)).toBe(true)
  await redo(page)
  await expect.poll(() => evidenceIsCurrent(page)).toBe(false)
  expect(await captureEvidence(page)).toBe(true)

  await page.evaluate(async () => {
    const { core } = await import('../src/testing/runtime-access')
    const saved = await core.save()
    core.load(saved)
  })
  await expect.poll(() => evidenceIsCurrent(page)).toBe(false)
  expect(await captureEvidence(page)).toBe(true)
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
