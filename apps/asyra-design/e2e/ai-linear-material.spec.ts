import { admitPreparedDesignDelivery } from '../src/ai/prepared-design-admission'
import { expect, test, type Page } from '@playwright/test'
import correction from '../server/__tests__/fixtures/recorded-101/material-correction-20261019.json' with { type: 'json' }
import recorded from '../server/__tests__/fixtures/recorded-101/material-field-20261019.json' with { type: 'json' }
import { createLocalDesignTools } from '../server/local-design-tools'
import { createLocalOperationTools } from '../server/local-operation-tools'
import type { AiActionBatch } from '@asyra/ai-agent-runtime'
import {
  createTestDocumentIdentity,
  getCoreDocumentDigest,
  getPersistedDocumentDigest,
  undo,
  redo,
  waitForAppReady
} from './test-utils'

test.use({ trace: 'retain-on-failure' })
const connected = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(async () =>
        (await import('../src/testing/runtime-access'))
          .getActiveCollaborationHandle()
          ?.getStatus()
      )
    )
    .toBe('connected')

const materialHarness = async (page: Page) => {
  const actions = await page.evaluate(async () => {
    const { testRuntimeState } = await import('../src/testing/runtime-access')
    const { createAiRuntimeInput } = await import('../src/ai/runtime-input')
    const input = createAiRuntimeInput({
      permissionRules: {},
      provider: {
        requestActionBatch: async () => {
          throw new Error('Model execution is forbidden')
        }
      }
    })
    testRuntimeState.set('material-runtime', input)
    testRuntimeState.set('material-request', new AbortController())
    return JSON.parse(JSON.stringify(input.actionDefinitions))
  })
  const execute = async (batch: AiActionBatch) =>
    (await page.evaluate(async (batch) => {
      const { testRuntimeState } = await import('../src/testing/runtime-access')
      type Input = ReturnType<
        typeof import('../src/ai/runtime-input').createAiRuntimeInput
      >
      const input = testRuntimeState.get<Input>('material-runtime')
      const request = testRuntimeState.get<AbortController>('material-request')
      if (!input?.transactionRunner || !request) {
        throw new Error('Missing runtime transaction owner')
      }
      return input.transactionRunner
        .run('Material scenario', async (runMutation) => {
          const actionResults = []
          for (const a of batch.actions) {
            const action = input.actionDefinitions.find(
              (d) => d.name === a.name
            )
            if (!action) {
              throw new Error('Unknown action')
            }
            actionResults.push({
              actionId: a.id,
              actionName: a.name,
              result: await action.execute(a.arguments, {
                signal: request.signal,
                runMutation
              })
            })
          }
          return { context: {}, actionResults }
        })
        .catch((error: unknown) => {
          let cause = error
          while (cause instanceof Error && cause.cause) {
            cause = cause.cause
          }
          throw cause
        })
    }, batch)) as never
  return { actions, execute }
}

test('recorded world material reaches real tools, local checks, history, peer and durable reload without inference', async ({
  page,
  context
}, testInfo) => {
  const document = createTestDocumentIdentity()
  await page.goto(document.url)
  await waitForAppReady(page)
  await connected(page)
  const { actions, execute } = await materialHarness(page)
  const tools = createLocalDesignTools(actions)
  const ops = createLocalOperationTools(actions, tools, execute)
  const signal = new AbortController().signal
  const invoke = async (name: string, args: unknown = {}) =>
    JSON.parse(await ops.call(name, args, signal))
  const source = {
    ...structuredClone(recorded.draft),
    projection: {
      ...recorded.draft.projection,
      scale: 0.025,
      originX: 0,
      originY: 0
    },
    linearFields: {
      glass: {
        frame: 'world',
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: 0, z: 50800 },
        gradientStops: recorded.draft.fillTemplates.glassL.gradientStops
      }
    },
    children: recorded.draft.children.map(({ fill: _fill, ...face }) => ({
      ...face,
      materialField: 'glass'
    }))
  }
  const peer = await context.newPage()
  try {
    const before = await getCoreDocumentDigest(page)
    const invalid = structuredClone(source)
    invalid.linearFields.glass.end = { ...invalid.linearFields.glass.start }
    const rejected = JSON.parse(
      await tools.call('prepare_design', { draft: invalid }, signal)
    )
    expect(rejected.available).toBe(false)
    expect(await getCoreDocumentDigest(page)).toEqual(before)
    const receipt = JSON.parse(
      await tools.call('prepare_design', { draft: source }, signal)
    )
    expect(receipt).toMatchObject({ available: true, applicable: true })
    const batch = tools.resolveBatch({
      batchId: 'material',
      actions: [
        {
          id: 'apply',
          name: 'apply_prepared_design',
          arguments: { artifactId: receipt.artifactId },
          summary: 'Create continuous material'
        }
      ]
    })
    const prepared = admitPreparedDesignDelivery(
      batch.actions[0].arguments.design
    )
    const applied = (await execute(batch)) as {
      actionResults: { result: unknown }[]
    }
    expect(applied.actionResults).toHaveLength(1)
    const ids = recorded.draft.children.map((c) => prepared.keyToId[c.key])
    expect(ids.every(Boolean)).toBe(true)
    for (const id of ids) {
      const reviewed = await invoke('review_design', {
        arguments: { elementId: id }
      })
      expect(reviewed).toBeDefined()
    }
    const firstChecks = await invoke('read_design_checks')
    expect(firstChecks.counts).toMatchObject({
      pass: 3,
      fail: 0,
      stale: 0,
      unverified: 0
    })
    for (const id of ids) {
      const retained = await invoke('read_design_checks', {
        ids: [`measurement:${id}`]
      })
      expect(retained.counts).toMatchObject({ pass: 1, fail: 0, stale: 0 })
    }
    expect(
      await invoke('define_design_criteria', {
        phase: 'plan',
        method:
          'Review independent material surfaces and the whole composition separately.',
        references: [],
        detailRequired: false,
        criteria: {
          material: {
            requirement:
              'Each surface retains its intended independently editable material.',
            description:
              'Evaluate each current surface without accepting its sibling implicitly.',
            verification: 'visual',
            requiredUnits: ['lower', 'upper']
          },
          overall: {
            requirement:
              'Both projected surfaces remain in the intended composition.',
            description: 'Evaluate the complete final pair separately.',
            verification: 'visual',
            requiredUnits: []
          }
        }
      })
    ).toMatchObject({ recorded: true })
    const bindSurface = async (index: number) => {
      const capture = await invoke('inspect_drawing', {
        arguments: { elementId: ids[index], view: 'detail' }
      })
      const image = capture.actionResults.find(
        (entry: { result: { inspectionId?: string } }) =>
          entry.result.inspectionId
      )?.result
      expect(image).toMatchObject({
        available: true,
        inspectionId: expect.any(String)
      })
      const binding = await invoke('review_drawing', {
        phase: 'visual',
        bindChecks: [
          {
            criterionId: 'material',
            unitId: ['lower', 'upper'][index],
            inspectionIds: [image.inspectionId]
          }
        ]
      })
      expect(binding.acceptanceContext).toEqual({
        method:
          'Review independent material surfaces and the whole composition separately.',
        requirementRevision:
          binding.next.arguments.checks[0].binding.requirementRevision,
        checks: [
          {
            criterionId: 'material',
            unitId: ['lower', 'upper'][index],
            requirement:
              'Each surface retains its intended independently editable material.',
            description:
              'Evaluate each current surface without accepting its sibling implicitly.'
          }
        ]
      })
      expect(binding.next.arguments.checks).toHaveLength(1)
      return binding.next.arguments
    }
    // Controlled verdicts test the actual protocol, not model judgment quality.
    const recordPass = (binding: { checks: object[] }) =>
      invoke('review_drawing', {
        ...binding,
        final: false,
        checks: binding.checks.map((check) => ({
          ...check,
          status: 'pass',
          evidence: 'Controlled observation of the current material surface.'
        }))
      })
    const lowerBinding = await bindSurface(0)
    const lowerPass = await recordPass(lowerBinding)
    const upperPass = await recordPass(await bindSurface(1))
    expect(upperPass).toMatchObject({
      accepted: false,
      coverage: { passed: 2, required: 3 }
    })
    const checkIds = [
      lowerPass.recordedChecks[0].id,
      upperPass.recordedChecks[0].id
    ]
    const visualChecks = async () =>
      (
        await invoke('read_design_checks', {
          ids: checkIds,
          includePassed: true
        })
      ).items
    const retainedUpper = (await visualChecks()).find(
      (item: { id: string }) => item.id === checkIds[1]
    )
    const rendered = await page.evaluate(async (ids) => {
      const { core, testRuntimeState } =
        await import('../src/testing/runtime-access')
      const { createInspectionEvidence } =
        await import('../src/common-apis/inspection-evidence')
      const { createAiInspectionAction } = await import('../src/ai/inspection')
      const owner = createInspectionEvidence()
      testRuntimeState.set('material-evidence', owner)
      const action = createAiInspectionAction(undefined, owner),
        stamps = [],
        colors = [],
        images = []
      for (const id of ids) {
        const capture = (await action.execute({ elementId: id }, {
          signal: new AbortController().signal
        } as never)) as {
          available: boolean
          evidence: unknown
          image: { dataUrl: string; width: number; height: number }
        }
        if (!capture.available) {
          throw new Error('Rendered capture unavailable')
        }
        stamps.push(capture.evidence)
        const image = capture.image
        images.push(image.dataUrl)
        const bitmap = await createImageBitmap(
          await (await fetch(image.dataUrl)).blob()
        )
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Missing image sampling context')
        }
        ctx.drawImage(bitmap, 0, 0)
        colors.push(
          Array.from(
            ctx.getImageData(
              Math.floor(bitmap.width / 2),
              Math.floor(bitmap.height / 2),
              1,
              1
            ).data
          )
        )
      }
      testRuntimeState.set('material-stamps', stamps)
      return {
        colors,
        images,
        fills: ids.map(
          (id) => core.getElementComputedData(id, ['fills'])?.fills
        )
      }
    }, ids)
    for (let i = 0; i < rendered.images.length; i++) {
      await testInfo.attach(`material-face-${i}`, {
        body: Buffer.from(rendered.images[i].split(',')[1], 'base64'),
        contentType: 'image/png'
      })
    }
    const stops = recorded.draft.fillTemplates.glassL.gradientStops
    recorded.draft.children.forEach((face, i) => {
      const phase =
        face.vertices.reduce((s, p) => s + p.z, 0) /
        face.vertices.length /
        50800
      const high = stops.findIndex((s) => s.position > phase),
        low = high - 1
      const t =
        (phase - stops[low].position) /
        (stops[high].position - stops[low].position)
      for (let c = 0; c < 3; c++) {
        const a = parseInt(stops[low].color.slice(1 + 2 * c, 3 + 2 * c), 16),
          b = parseInt(stops[high].color.slice(1 + 2 * c, 3 + 2 * c), 16)
        expect(
          Math.abs(rendered.colors[i][c] - (a + (b - a) * t))
        ).toBeLessThanOrEqual(3)
      }
      expect(rendered.colors[i][3]).toBe(255)
    })
    const created = await getCoreDocumentDigest(page)
    const createdDocument = await page.evaluate(async () =>
      (await import('../src/testing/runtime-access')).core.save()
    )
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(created)
    await peer.goto(document.url)
    await waitForAppReady(peer)
    await connected(peer)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(created)
    // Read actual complete values through the registered public tool. The
    // compact context view is intentionally not a writable gradient payload.
    const readFills = async (elementId: string) => {
      const result = await invoke('execute_design_batch', {
        inspection: 'defer',
        operations: [
          {
            name: 'api_core_getElementComputedData',
            arguments: { elementId, fields: ['fills'] }
          }
        ]
      })
      return result.actionResults[0].result.value.fills
    }
    const beforeFills = await Promise.all(ids.map(readFills))
    expect(beforeFills[0][0].id).not.toBe(beforeFills[1][0].id)
    const gradient = structuredClone(beforeFills[0][0].gradient)
    const recordedReplacement = correction.operation.arguments.patch.gradient
    expect(gradient.gradientHandles).not.toEqual(
      recordedReplacement.gradientHandles
    )
    // Keep actual stop positions/opacity, rather than claiming the recorded
    // replacement domain is a palette-only operation.
    gradient.gradientStops = gradient.gradientStops.map(
      (stop: { color: string }) => ({
        ...stop,
        color: recordedReplacement.gradientStops[0].color
      })
    )
    const { readFileSync } = await import('node:fs')
    const method = readFileSync(
      new URL(
        '../knowledge/design.architectural-illustration.materials.correction.md',
        import.meta.url
      ),
      'utf8'
    )
    const match = method.match(
      /```json native-palette-correction\n([\s\S]*?)\n```/
    )
    if (!match) {
      throw new Error('Missing published material correction')
    }
    const edit = JSON.parse(match[1]).arguments
    edit.operations[0].arguments = {
      elementIds: [ids[0]],
      index: 0,
      patch: [{ gradient }]
    }
    const incompleteGradient = structuredClone(edit)
    incompleteGradient.operations[0].arguments.patch[0].gradient = {
      gradientStops: gradient.gradientStops
    }
    await expect(
      invoke('execute_design_batch', incompleteGradient)
    ).rejects.toThrow()
    const missingTarget = structuredClone(edit)
    missingTarget.operations[0].arguments.elementIds.push(
      'missing-material-target'
    )
    missingTarget.operations[0].arguments.patch.push({ gradient })
    // This page bridge cannot transfer the thrown transaction error's class.
    // Exercise the honest unknown-delivery route in an independent request;
    // never relabel it not-started or unblock that request by retrying.
    const lostReceiptOwner = createLocalOperationTools(
      actions,
      createLocalDesignTools(actions),
      execute
    )
    const missingReceipt = JSON.parse(
      await lostReceiptOwner.call('execute_design_batch', missingTarget, signal)
    )
    expect(missingReceipt).toMatchObject({
      code: 'MUTATION_SCOPE_UNAVAILABLE',
      settlement: 'unknown',
      recoverable: false
    })
    expect(await getCoreDocumentDigest(page)).toEqual(created)
    const refusedRetry = JSON.parse(
      await lostReceiptOwner.call('execute_design_batch', edit, signal)
    )
    expect(refusedRetry).toMatchObject({
      stage: 'admission',
      settlement: 'not-started'
    })
    expect(await getCoreDocumentDigest(page)).toEqual(created)
    // The independent original request must read actual state before proceeding.
    expect(await readFills(ids[0])).toEqual(beforeFills[0])
    const cancelled = new AbortController()
    cancelled.abort()
    await expect(
      ops.call('execute_design_batch', edit, cancelled.signal)
    ).rejects.toThrow()
    expect(await getCoreDocumentDigest(page)).toEqual(created)
    await invoke('execute_design_batch', edit)
    const afterFills = await Promise.all(ids.map(readFills))
    expect(afterFills[0][0]).toEqual({ ...beforeFills[0][0], gradient })
    expect(afterFills[1]).toEqual(beforeFills[1])
    const currency = await page.evaluate(async () => {
      const { testRuntimeState } = await import('../src/testing/runtime-access')
      type Owner = ReturnType<
        typeof import('../src/common-apis/inspection-evidence').createInspectionEvidence
      >
      const owner = testRuntimeState.get<Owner>('material-evidence')
      const stamps = testRuntimeState.get<unknown[]>('material-stamps')
      if (!owner || !stamps) {
        throw new Error('Missing visual evidence')
      }
      return stamps.map((s) => owner.isCurrent(s))
    })
    expect(currency).toEqual([false, true])
    expect(
      (
        await invoke('read_design_checks', {
          ids: ids.map((id) => `measurement:${id}`)
        })
      ).counts
    ).toMatchObject({ pass: 2, fail: 0, stale: 0 })
    const afterEdit = await visualChecks()
    expect(
      afterEdit.find((item: { id: string }) => item.id === checkIds[0]).status
    ).toBe('stale')
    expect(
      afterEdit.find((item: { id: string }) => item.id === checkIds[1])
    ).toEqual(retainedUpper)
    const late = await recordPass(lowerBinding)
    expect(late.accepted).not.toBe(true)
    expect(
      (await visualChecks()).find(
        (item: { id: string }) => item.id === checkIds[0]
      ).status
    ).toBe('stale')
    expect(await recordPass(await bindSurface(0))).toMatchObject({
      accepted: false,
      coverage: { passed: 2, required: 3 }
    })
    expect(
      (await visualChecks()).find(
        (item: { id: string }) => item.id === checkIds[1]
      )
    ).toEqual(retainedUpper)
    const edited = await getCoreDocumentDigest(page)
    expect(edited).not.toEqual(created)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(edited)
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(edited)
    await undo(page)
    await testInfo.attach('undo-document-comparison', {
      contentType: 'application/json',
      body: Buffer.from(
        JSON.stringify({
          before: createdDocument,
          after: await page.evaluate(async () =>
            (await import('../src/testing/runtime-access')).core.save()
          )
        })
      )
    })
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(created)
    expect(
      (await visualChecks()).find(
        (item: { id: string }) => item.id === checkIds[0]
      ).status
    ).toBe('stale')
    expect(
      (await visualChecks()).find(
        (item: { id: string }) => item.id === checkIds[1]
      )
    ).toEqual(retainedUpper)
    await redo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(edited)
    expect(await recordPass(await bindSurface(0))).toMatchObject({
      accepted: false,
      coverage: { passed: 2, required: 3 }
    })
    expect(
      (await visualChecks()).find(
        (item: { id: string }) => item.id === checkIds[1]
      )
    ).toEqual(retainedUpper)
    const wholeCapture = await invoke('inspect_drawing', {
      arguments: { elementId: prepared.rootId, view: 'overview' }
    })
    const whole = wholeCapture.actionResults.find(
      (entry: { result: { inspectionId?: string } }) =>
        entry.result.inspectionId
    )?.result
    expect(whole).toMatchObject({ available: true })
    const wholeBinding = await invoke('review_drawing', {
      phase: 'visual',
      bindChecks: [
        { criterionId: 'overall', inspectionIds: [whole.inspectionId] }
      ]
    })
    expect(
      await invoke('review_drawing', {
        ...wholeBinding.next.arguments,
        final: true,
        checks: wholeBinding.next.arguments.checks.map((check: object) => ({
          ...check,
          status: 'pass',
          evidence: 'Controlled whole-pair observation after the local edit.'
        }))
      })
    ).toMatchObject({ accepted: true, coverage: { passed: 3, required: 3 } })
    await ops.validateCompletion(signal)
    expect(
      ops.settleOutcome({
        batchId: 'verified',
        actions: [
          {
            id: 'done',
            name: 'report_outcome',
            arguments: { outcome: 'completed', message: 'Verified pair' },
            summary: 'Finish'
          }
        ]
      }).actions[0].arguments.outcome
    ).toBe('completed')
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(edited)
    await page.evaluate(async () => {
      const { testRuntimeState } = await import('../src/testing/runtime-access')
      type Input = ReturnType<
        typeof import('../src/ai/runtime-input').createAiRuntimeInput
      >
      for (const owner of testRuntimeState.get<Input>('material-runtime')
        ?.ownedResources ?? []) {
        await owner.dispose()
      }
      testRuntimeState.get<{ dispose(): void }>('material-evidence')?.dispose()
    })
    await page.reload()
    await waitForAppReady(page)
    await connected(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(edited)
    await page.evaluate(async (id) => {
      const { fillApis, transactionApis } = await import('../src/common-apis')
      transactionApis.runTransaction(() =>
        fillApis.updateFillsAtIndex([id], 0, { opacity: 0.8 })
      )
    }, ids[1])
    const subsequent = await getCoreDocumentDigest(page)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(subsequent)
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(subsequent)
    await page.reload()
    await waitForAppReady(page)
    await connected(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(subsequent)
    await page.evaluate(async () => {
      ;(
        await import('../src/testing/runtime-access')
      ).startDocumentPublicationCapture('material-share')
    })
    // Explicitly shared and independent are different canonical relationships.
    // A recipient edit creates a local override; source, history/save/peer retain its relation.
    await page.evaluate(async (ids) => {
      const { fillApis, transactionApis } = await import('../src/common-apis')
      transactionApis.runTransaction(() =>
        fillApis.shareFillAtIndex(ids[0], [ids[1]], 0)
      )
    }, ids)
    const shared = await getCoreDocumentDigest(page)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(shared)
    const localOwnership = await page.evaluate(async (ids) => {
      const { core } = await import('../src/testing/runtime-access')
      const { fillApis, transactionApis } = await import('../src/common-apis')
      const bindings = () =>
        ids.map((elementId) => {
          const [root] = core.readElementPropertyTargets([
            { elementId, propertyName: 'fills', path: [] }
          ])
          const child = root.children[0]
          return core.readElementPropertyTargets([
            {
              elementId,
              propertyName: 'fills',
              path: [{ key: child.key, childId: child.childId }]
            }
          ])[0]
        })
      const before = ids.map(
        (id) => core.getElementComputedData(id, ['fills'])?.fills
      )
      const beforeBindings = bindings()
      transactionApis.runTransaction(() => {
        const fill = core.getElementComputedData(ids[1], ['fills'])?.fills[0]
        fillApis.updateFillsAtIndex([ids[1]], 0, {
          gradient: {
            ...fill.gradient,
            gradientStops: fill.gradient.gradientStops.map((stop) => ({
              ...stop,
              color: '#112233'
            }))
          }
        })
      })
      return {
        before,
        beforeBindings,
        afterBindings: bindings(),
        after: ids.map(
          (id) => core.getElementComputedData(id, ['fills'])?.fills
        )
      }
    }, ids)
    expect(localOwnership.beforeBindings[1]).toMatchObject({
      mode: 'source-backed',
      sourceId: localOwnership.beforeBindings[0].propertyId
    })
    expect(localOwnership.afterBindings[1]).toMatchObject({
      mode: 'source-backed',
      sourceId: localOwnership.beforeBindings[0].propertyId
    })
    expect(localOwnership.after[0]).toEqual(localOwnership.before[0])
    expect(localOwnership.after[1]).not.toEqual(localOwnership.before[1])
    const overridden = await getCoreDocumentDigest(page)
    try {
      await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(overridden)
    } finally {
      for (const [name, client] of [
        ['author', page],
        ['peer', peer]
      ] as const) {
        await testInfo.attach(`material-ownership-${name}`, {
          body: JSON.stringify(
            await client.evaluate(async () => {
              const runtime = await import('../src/testing/runtime-access')
              return {
                document: await runtime.core.save(),
                status: runtime.getActiveCollaborationHandle()?.getStatus(),
                publications: runtime.readTestCapture('material-share')
              }
            })
          ),
          contentType: 'application/json'
        })
      }
    }
    await undo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(shared)
    await redo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(overridden)
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(overridden)
    await page.reload()
    await waitForAppReady(page)
    await connected(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(overridden)
    await tools.call(
      'release_design_artifacts',
      { artifactIds: [receipt.artifactId] },
      signal
    )
    expect(() =>
      tools.resolveBatch({
        batchId: 'stale',
        actions: [
          {
            id: 'apply',
            name: 'apply_prepared_design',
            arguments: { artifactId: receipt.artifactId },
            summary: 'Do not replay'
          }
        ]
      })
    ).toThrow()
    expect(await getCoreDocumentDigest(page)).toEqual(overridden)
    await page.keyboard.press('Meta+1')
    await page.screenshot({
      path: testInfo.outputPath('material-reloaded.png')
    })
  } finally {
    {
      for (const [name, client] of [
        ['author', page],
        ['peer', peer]
      ] as const) {
        if (client.url() === 'about:blank' || client.isClosed()) {
          continue
        }
        await testInfo.attach(`material-failure-${name}`, {
          body: JSON.stringify(
            await client.evaluate(async () => {
              const runtime = await import('../src/testing/runtime-access')
              return {
                document: await runtime.core.save(),
                status: runtime.getActiveCollaborationHandle()?.getStatus(),
                publications: runtime.readTestCapture('material-share')
              }
            })
          ),
          contentType: 'application/json'
        })
      }
    }
    await peer.close()
  }
})

test('native field sampling stays continuous across the rendered join of translated independent panels', async ({
  page
}, testInfo) => {
  const { prepareDesign } = await import('../server/design-preparation')
  const prepared = prepareDesign({
    type: 'group',
    name: 'Continuous panels',
    projection: { azimuth: 0, elevation: 30, scale: 4, originX: 0, originY: 0 },
    linearFields: {
      paint: {
        frame: 'world',
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: 0, z: 20 },
        gradientStops: [
          { position: 0, color: '#000000', opacity: 1 },
          { position: 1, color: '#ffffff', opacity: 1 }
        ]
      }
    },
    children: [
      {
        type: 'pattern',
        key: 'p',
        name: 'Panels',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 2, step: { x: 0, y: 0, z: 10 } }],
        faces: [
          {
            key: 'face',
            name: 'Panel',
            materialField: 'paint',
            vertices: [
              { x: 0, y: 0, z: 0 },
              { x: 40, y: 0, z: 0 },
              { x: 40, y: 0, z: 10 },
              { x: 0, y: 0, z: 10 }
            ]
          }
        ]
      }
    ]
  })
  await page.goto(createTestDocumentIdentity().url)
  await waitForAppReady(page)
  await connected(page)
  const result = await page.evaluate(async (prepared) => {
    const { deliverPreparedDesign } = await import('../src/ai/prepared-design')
    const { core } = await import('../src/testing/runtime-access')
    const { createAiRuntimeInput } = await import('../src/ai/runtime-input')
    const input = createAiRuntimeInput({
      permissionRules: {},
      provider: {
        requestActionBatch: async () => {
          throw new Error('Model execution is forbidden')
        }
      }
    })
    try {
      const action = input.actionDefinitions.find(
        (a) => a.name === 'apply_prepared_design'
      )
      if (!action || !input.transactionRunner) {
        throw new Error('Missing actual apply owner')
      }
      await input.transactionRunner.run(
        'Continuous panels',
        async (runMutation) =>
          action.execute(
            { design: deliverPreparedDesign(prepared) },
            { signal: new AbortController().signal, runMutation }
          )
      )
      const capture = core.captureElementSnapshot(prepared.rootId, 1024)
      if (!capture) {
        throw new Error('Missing actual rendered result')
      }
      const bitmap = await createImageBitmap(
        await (await fetch(capture.dataUrl)).blob()
      )
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Missing sampling context')
      }
      ctx.drawImage(bitmap, 0, 0)
      const rows = [
        Math.floor(bitmap.height / 2) - 2,
        Math.floor(bitmap.height / 2) - 1,
        Math.floor(bitmap.height / 2),
        Math.floor(bitmap.height / 2) + 1
      ]
      return {
        image: capture.dataUrl,
        height: bitmap.height,
        samples: rows.map((y) => ({
          y,
          rgba: Array.from(
            ctx.getImageData(Math.floor(bitmap.width / 2), y, 1, 1).data
          )
        }))
      }
    } finally {
      for (const owner of input.ownedResources ?? []) {
        await owner.dispose()
      }
    }
  }, prepared)
  for (const sample of result.samples) {
    const expected = 255 * (1 - (sample.y + 0.5) / result.height)
    for (const channel of sample.rgba.slice(0, 3)) {
      expect(Math.abs(channel - expected)).toBeLessThanOrEqual(3)
    }
    expect(sample.rgba[3]).toBe(255)
  }
  await testInfo.attach('continuous-native-join', {
    body: Buffer.from(result.image.split(',')[1], 'base64'),
    contentType: 'image/png'
  })
})

test('source material revisions update original faces, extend coherently and survive history, peer and reload', async ({
  page,
  context
}) => {
  const document = createTestDocumentIdentity()
  await page.goto(document.url)
  await waitForAppReady(page)
  await connected(page)
  const { actions, execute } = await materialHarness(page)
  const tools = createLocalDesignTools(actions)
  const signal = new AbortController().signal
  const source = {
    ...structuredClone(recorded.draft),
    projection: {
      ...recorded.draft.projection,
      scale: 0.025,
      originX: 0,
      originY: 0
    },
    linearFields: {
      glass: {
        frame: 'world',
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: 0, z: 50800 },
        gradientStops: recorded.draft.fillTemplates.glassL.gradientStops
      }
    },
    children: recorded.draft.children.map(({ fill: _fill, ...face }) => ({
      ...face,
      materialField: 'glass'
    }))
  }
  const prepared = JSON.parse(
    await tools.call('prepare_design', { draft: source }, signal)
  )
  const creation = tools.resolveBatch({
    batchId: 'source',
    actions: [
      {
        id: 'create',
        name: 'apply_prepared_design',
        arguments: { artifactId: prepared.artifactId },
        summary: 'Create source'
      }
    ]
  })
  const design = admitPreparedDesignDelivery(
    creation.actions[0].arguments.design
  )
  const createdReceipt = (await execute(creation)) as {
    actionResults: { result: unknown }[]
  }
  expect(createdReceipt.actionResults[0].result).toMatchObject({
    materialProvenance: { status: 'available' }
  })
  const ids = source.children.map((child) => design.keyToId[child.key])
  const read = () =>
    page.evaluate(async (ids) => {
      const { default: core } = await import('../src/contexts')
      return ids.map((id) =>
        core.getElementComputedData(id, ['fills', 'width', 'height', 'points'])
      )
    }, ids)
  const before = await read()
  const created = await getCoreDocumentDigest(page)
  const peer = await context.newPage()
  try {
    await peer.goto(document.url)
    await waitForAppReady(peer)
    await connected(peer)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(created)
    const definition = {
      ...source.linearFields.glass,
      gradientStops: source.linearFields.glass.gradientStops.map(
        (stop, index) => ({ ...stop, color: index ? '#8cb8e0' : '#163e61' })
      )
    }
    // A view-only change must not expire the source material's document provenance.
    await page.evaluate(async () => {
      const { viewportApis } = await import('../src/common-apis/viewport')
      viewportApis.zoomToCenter(0.137, 800, 500)
    })
    expect(await getCoreDocumentDigest(page)).toEqual(created)
    const revision = JSON.parse(
      await tools.call(
        'prepare_material_revision',
        { artifactId: prepared.artifactId, field: 'glass', definition },
        signal
      )
    )
    expect(revision).toMatchObject({
      available: true,
      applied: false,
      elementCount: ids.length
    })
    expect(await getCoreDocumentDigest(page)).toEqual(created)
    const packet = tools.resolveBatch({
      batchId: 'revise',
      actions: [
        {
          id: 'material',
          name: 'apply_prepared_material',
          arguments: { materialRevisionId: revision.materialRevisionId },
          summary: 'Correct source material'
        }
      ]
    })
    const receipt = (await execute(packet)) as {
      actionResults: { result: unknown }[]
    }
    expect(receipt.actionResults[0].result).toMatchObject({
      status: 'complete',
      appliedCount: ids.length,
      materialProvenance: { status: 'available' }
    })
    const after = await read()
    for (let index = 0; index < ids.length; index++) {
      expect(after[index]).toMatchObject({
        width: before[index]?.width,
        height: before[index]?.height,
        points: before[index]?.points
      })
      const updates = packet.actions[0].arguments.updates as {
        gradient: unknown
        color: string
      }[]
      expect(after[index]?.fills[0]).toMatchObject({
        gradient: updates[index].gradient,
        color: updates[index].color
      })
      expect(after[index]?.fills).not.toEqual(before[index]?.fills)
    }
    const revised = await getCoreDocumentDigest(page)
    await page.evaluate(async () => {
      const { viewportApis } = await import('../src/common-apis/viewport')
      viewportApis.panTo(613.25, 47.125)
    })
    await execute(packet)
    expect(await getCoreDocumentDigest(page)).toEqual(revised)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(revised)
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(revised)
    await undo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(created)
    await redo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(revised)
    // Reuse the field by reference, without returning/reconstructing native gradients.
    const { linearFields: _fields, ...extension } = source
    extension.children = extension.children.map((child) => ({
      ...child,
      key: `extension-${child.key}`
    }))
    const extended = JSON.parse(
      await tools.call(
        'prepare_design',
        { draft: extension, materialSourceId: revision.materialRevisionId },
        signal
      )
    )
    const extensionPacket = tools.resolveBatch({
      batchId: 'extend',
      actions: [
        {
          id: 'extend',
          name: 'apply_prepared_design',
          arguments: { artifactId: extended.artifactId },
          summary: 'Extend accepted material'
        }
      ]
    })
    const entries = (
      extensionPacket.actions[0].arguments.design as {
        entries: { key: string; descriptor: { fills?: unknown[] } }[]
      }
    ).entries
    const updates = packet.actions[0].arguments.updates as {
      gradient: unknown
      color: string
    }[]
    source.children.forEach((child, index) =>
      expect(
        entries.find((entry) => entry.key === `extension-${child.key}`)
          ?.descriptor.fills?.[0]
      ).toMatchObject({ gradient: updates[index].gradient })
    )
    await execute(extensionPacket)
    const final = await getCoreDocumentDigest(page)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(final)
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(final)
    await page.reload()
    await waitForAppReady(page)
    await connected(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(final)
    expect(await read()).toEqual(after)
  } finally {
    await peer.close()
    if (new URL(page.url()).protocol !== 'chrome-error:') {
      await page.evaluate(async () => {
        const { testRuntimeState } =
          await import('../src/testing/runtime-access')
        type Input = ReturnType<
          typeof import('../src/ai/runtime-input').createAiRuntimeInput
        >
        for (const owner of testRuntimeState.get<Input>('material-runtime')
          ?.ownedResources ?? []) {
          await owner.dispose()
        }
      })
    }
  }
})
