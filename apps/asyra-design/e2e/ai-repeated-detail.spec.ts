import sharp from 'sharp'
import { resolve } from 'node:path'
import { requestLocalAiActionBatch } from '../server/local-ai-provider'
import { localToolOutcome } from '../server/local-tool-invocation'
import { expect, test, type Page } from '@playwright/test'
import type { AiActionBatch } from '@asyra/ai-agent-runtime'
import { recordedOrnaments } from '../server/__tests__/recorded-ornaments'
import { designPreparationExamples } from '../server/design-preparation-examples'
import { createLocalDesignTools } from '../server/local-design-tools'
import { createLocalOperationTools } from '../server/local-operation-tools'
import { createLocalDesignWorkflow } from '../server/local-design-workflow'
import {
  createTestDocumentIdentity,
  getCoreDocumentDigest,
  getPersistedDocumentDigest,
  waitForAppReady,
  undo,
  redo
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

async function runtime(page: Page) {
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

    testRuntimeState.set('repeat-runtime', input)

    return JSON.parse(JSON.stringify(input.actionDefinitions))
  })

  const execute = async (batch: AiActionBatch) =>
    (await page.evaluate(async (batch) => {
      const { testRuntimeState } = await import('../src/testing/runtime-access')

      type Input = ReturnType<
        typeof import('../src/ai/runtime-input').createAiRuntimeInput
      >
      const input = testRuntimeState.get<Input>('repeat-runtime')

      if (!input?.transactionRunner) {
        throw new Error('Missing transaction owner')
      }

      return input.transactionRunner.run(
        'Repeated detail',
        async (runMutation) => {
          const actionResults = []

          for (const item of batch.actions) {
            const action = input.actionDefinitions.find(
              (a) => a.name === item.name
            )

            if (!action) {
              throw new Error('Unknown action')
            }

            actionResults.push({
              actionId: item.id,
              actionName: item.name,
              result: await action.execute(item.arguments, {
                signal: new AbortController().signal,
                runMutation
              })
            })
          }

          return { context: {}, actionResults }
        }
      )
    }, batch)) as never

  const signal = new AbortController().signal
  const designs = createLocalDesignTools(actions)
  const operations = createLocalOperationTools(actions, designs, execute)
  const workflow = createLocalDesignWorkflow(designs, operations)

  const invoke = async (name: string, args: unknown) =>
    JSON.parse(await operations.call(name, args, signal))

  return { actions, designs, operations, workflow, execute, signal, invoke }
}

test('saved multi-face detail uses current targets and preserves independent image currency through edit, history, peer and durable reload', async ({
  page,
  context
}) => {
  test.setTimeout(180000)
  const document = createTestDocumentIdentity()

  await page.goto(document.url)
  await waitForAppReady(page)
  await connected(page)
  const { compact, correspondence } = recordedOrnaments()
  const { designs, signal, invoke, execute, operations } = await runtime(page)
  const prepared = JSON.parse(
    await designs.call('prepare_design', { draft: compact }, signal)
  )

  expect(prepared).toMatchObject({
    available: true,
    applicable: true,
    elementCount: 353
  })
  const batch = designs.resolveBatch({
    batchId: 'repeat',
    actions: [
      {
        id: 'apply',
        name: 'apply_prepared_design',
        arguments: { artifactId: prepared.artifactId },
        summary: 'Create saved details'
      }
    ]
  })

  await execute(batch)
  const ids = designs.resolveTargets({
    artifactId: prepared.artifactId,
    keys: correspondence.map((c) => c.compact)
  })

  expect(ids).toHaveLength(352)
  const targetReceipt = JSON.parse(
    await designs.call(
      'retain_design_targets',
      {
        targets: [
          { artifactId: prepared.artifactId, keyPrefix: 'ornaments-2-' }
        ]
      },
      signal
    )
  )
  const target = {
    artifactId: targetReceipt.targets[0].artifactId,
    targetSetId: targetReceipt.targets[0].targetSetId
  }
  const localIds = designs.resolveTargets(target)

  expect(localIds).toEqual(ids.slice(88, 132))
  const peer = await context.newPage()

  try {
    const capture = async (id: string) => {
      const response = await invoke('inspect_drawing', {
        arguments: { elementId: id, view: 'detail' }
      })
      const image = response.actionResults.find(
        (entry: { result: { inspectionId?: string } }) =>
          entry.result.inspectionId
      )?.result

      expect(image).toMatchObject({ available: true })

      return image.evidence
    }

    const stamps = [await capture(localIds[0]), await capture(ids[0])]

    const currency = async () =>
      Promise.all(
        stamps.map(async (evidence) => {
          const receipt = await execute({
            batchId: 'currency',
            actions: [
              {
                id: 'validate',
                name: 'validate_inspection_evidence',
                arguments: { evidence },
                summary: 'Validate source currency'
              }
            ]
          })

          return receipt.actionResults[0].result.current
        })
      )

    expect(await currency()).toEqual([true, true])
    const created = await getCoreDocumentDigest(page)

    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(created)
    await peer.goto(document.url)
    await waitForAppReady(peer)
    await connected(peer)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(created)

    const fills = () =>
      page.evaluate(async (ids) => {
        const { core } = await import('../src/testing/runtime-access')

        return ids.map(
          (id) => core.getElementComputedData(id, ['fills'])?.fills
        )
      }, ids)

    const beforeFills = await fills()

    const edit = () =>
      invoke('execute_design', {
        inspection: 'defer',
        operations: [
          {
            name: 'api_fill_updateFillsAtIndex',
            target: { ...target, field: 'elementIds' },
            arguments: { index: 0, patch: { opacity: 0.5 } }
          }
        ]
      })

    expect(localToolOutcome(await edit()).status).toBe('success')
    const afterFills = await fills()

    ids.forEach((id, i) => {
      if (localIds.includes(id)) {
        expect(afterFills[i]).not.toEqual(beforeFills[i])
      } else {
        expect(afterFills[i]).toEqual(beforeFills[i])
      }
    })
    expect(await currency()).toEqual([false, true])
    let edited = await getCoreDocumentDigest(page)

    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(edited)
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(edited)
    await undo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(created)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(created)
    await redo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(edited)
    expect(await currency()).toEqual([false, true])
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(edited)
    stamps[0] = await capture(localIds[0])
    expect(await currency()).toEqual([true, true])
    await peer.evaluate(async (id) => {
      const { fillApis, transactionApis } = await import('../src/common-apis')

      transactionApis.runTransaction(() =>
        fillApis.updateFillsAtIndex([id], 0, { opacity: 0.65 })
      )
    }, localIds[0])
    const remoteEdit = await getCoreDocumentDigest(peer)

    expect(remoteEdit).not.toEqual(edited)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(remoteEdit)
    expect(await currency()).toEqual([false, true])
    const rootId = (batch.actions[0].arguments.design as { rootId: string })
      .rootId
    const wholeCapture = await invoke('inspect_drawing', {
      arguments: { elementId: rootId, view: 'overview' }
    })
    const whole = wholeCapture.actionResults.find(
      (r: { result: { inspectionId?: string } }) => r.result.inspectionId
    )?.result

    expect(whole).toMatchObject({ available: true })
    edited = remoteEdit
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(edited)
    await page.reload()
    await waitForAppReady(page)
    await connected(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(edited)
    // A fresh request uses persisted identities; old request credentials expire.
    await designs.call(
      'release_design_artifacts',
      { artifactIds: [prepared.artifactId] },
      signal
    )
    await expect(edit()).rejects.toThrow()
    expect(await getCoreDocumentDigest(page)).toEqual(edited)
    await page.evaluate(async (id) => {
      const { fillApis, transactionApis } = await import('../src/common-apis')

      transactionApis.runTransaction(() =>
        fillApis.updateFillsAtIndex([id], 0, { opacity: 0.8 })
      )
    }, ids[0])
    const subsequent = await getCoreDocumentDigest(page)

    expect(subsequent).not.toEqual(edited)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(subsequent)
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(subsequent)
    await page.reload()
    await waitForAppReady(page)
    await connected(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(subsequent)
  } finally {
    await peer.close()
  }
})

test('ordered multi-face preparation preserves an acknowledged prefix and retries only the corrected part', async ({
  page
}, testInfo) => {
  const document = createTestDocumentIdentity()

  await page.goto(document.url)
  await waitForAppReady(page)
  await connected(page)
  const { workflow, signal, designs } = await runtime(page)

  await page.evaluate(async () => {
    const runtime = await import('../src/testing/runtime-access')

    runtime.testRuntimeState.set(
      'ordered-prefix-initial',
      await runtime.core.save()
    )
    runtime.startSharedPublicationCapture('ordered-prefix-publications')
  })
  const example = designPreparationExamples.find(
    (e) => e.draft.name === 'Repeated visible detail'
  )

  if (
    !example ||
    !('linearFields' in example.draft) ||
    !('reflection' in example.draft.linearFields)
  ) {
    throw new Error('Missing multi-face example')
  }

  const invalid = structuredClone(example.draft)

  invalid.linearFields.reflection.end = {
    ...invalid.linearFields.reflection.start
  }

  const call = async (parts: unknown[]) =>
    JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        { parts, inspection: 'defer' },
        signal
      )
    )

  const result = await call([
    { key: 'first', draft: example.draft },
    { key: 'second', draft: invalid }
  ])

  expect(result.status).toBe('partial')
  expect(result.parts[0]).toMatchObject({ available: true, applicable: true })
  expect(result.parts[1].failedStep).toBe('prepare_design')
  const firstIds = designs.resolveTargets({
    artifactId: result.parts[0].artifactId,
    keyPrefix: 'panes-'
  })
  const prefix = await getCoreDocumentDigest(page)

  await expect
    .poll(() => getPersistedDocumentDigest(document.fileId))
    .toEqual(prefix)
  const cancelled = new AbortController()

  cancelled.abort()
  await expect(
    workflow.call(
      'prepare_and_apply_design',
      { draft: example.draft, inspection: 'defer' },
      cancelled.signal
    )
  ).rejects.toThrow()
  expect(
    designs.resolveTargets({
      artifactId: result.parts[0].artifactId,
      keyPrefix: 'panes-'
    })
  ).toEqual(firstIds)
  expect(await getCoreDocumentDigest(page)).toEqual(prefix)
  const retry = await call([{ key: 'second', draft: example.draft }])

  expect(retry.status).toBe('complete')
  expect(retry.parts).toHaveLength(1)
  const secondIds = designs.resolveTargets({
    artifactId: retry.parts[0].artifactId,
    keyPrefix: 'panes-'
  })

  expect(secondIds.some((id) => firstIds.includes(id))).toBe(false)
  expect(
    designs.resolveTargets({
      artifactId: result.parts[0].artifactId,
      keyPrefix: 'panes-'
    })
  ).toEqual(firstIds)
  const complete = await getCoreDocumentDigest(page)

  expect(complete).not.toEqual(prefix)
  await undo(page)
  await expect.poll(() => getCoreDocumentDigest(page)).toEqual(prefix)
  await redo(page)
  await expect.poll(() => getCoreDocumentDigest(page)).toEqual(complete)
  await testInfo.attach('ordered-prefix-publication-replay', {
    contentType: 'application/json',
    body: JSON.stringify(
      await page.evaluate(async () => {
        const runtime = await import('../src/testing/runtime-access')

        return {
          initial: runtime.testRuntimeState.get('ordered-prefix-initial'),
          publications: runtime.readTestCapture('ordered-prefix-publications'),
          final: await runtime.core.save()
        }
      })
    )
  })
  await expect
    .poll(() => getPersistedDocumentDigest(document.fileId))
    .toEqual(complete)
  await page.reload()
  await waitForAppReady(page)
  await connected(page)
  await expect.poll(() => getCoreDocumentDigest(page)).toEqual(complete)
})

test('actual provider receipt ownership preserves a recorded prefix through repair, history and durable reload', async ({
  page
}, testInfo) => {
  test.setTimeout(120000)
  const document = createTestDocumentIdentity()

  await page.goto(document.url)
  await waitForAppReady(page)
  await connected(page)
  const { actions, execute } = await runtime(page)
  let prefix: Awaited<ReturnType<typeof getCoreDocumentDigest>> | undefined
  let mutations = 0
  const result = await requestLocalAiActionBatch(
    {
      actions,
      attempt: 1,
      context: {},
      intent: 'Exercise recorded preparation recovery without a model.'
    },
    {
      model: 'fixture-model',
      executable: resolve('e2e/fixtures/receipt-provider.mjs'),
      recordDirectory: testInfo.outputPath('provider-records'),
      toolLibraryDirectory: testInfo.outputPath('tool-library'),

      executeBatch: async (batch) => {
        const receipt = await execute(batch)

        if (batch.actions.some((a) => a.name === 'apply_prepared_design')) {
          mutations++
          if (mutations === 2) {
            prefix = await getCoreDocumentDigest(page)
          }
        }

        return receipt
      }
    }
  )
  const report = JSON.parse(
    (result.actions[0].arguments as { message: string }).message
  )

  expect(report.failure.success).toBe(false)
  expect(report.failure.value).toMatchObject({
    status: 'partial',
    settlement: 'partial'
  })
  expect(report.failure.value.parts[1]).toMatchObject({
    recovery: 'correct_input',
    toolOutcome: { status: 'failed', settlement: 'not-started' },
    draftId: expect.any(String)
  })
  expect(report.failure.value.parts[1].message).toContain('nonplanar face')
  expect(report.repaired.success).toBe(true)
  expect(mutations).toBe(3) // Anchor, successful prefix, repaired part. No prefix replay.
  const crown = report.failure.value.parts[0].actionResults.find(
    (r: { actionName: string }) => r.actionName === 'apply_prepared_design'
  ).result.compositionId

  const entries = (reply: { value: { items: { id: string }[] } }) =>
    reply.value.items

  const original = entries(report.before).find(
    (c) => c.id === `measurement:${crown}`
  )

  expect(original).toMatchObject({ status: 'pass' })
  expect(
    entries(report.after).find((c) => c.id === `measurement:${crown}`)
  ).toEqual(original)
  const complete = await getCoreDocumentDigest(page)

  expect(complete).not.toEqual(prefix)
  await undo(page)
  await expect.poll(() => getCoreDocumentDigest(page)).toEqual(prefix)
  await redo(page)
  await expect.poll(() => getCoreDocumentDigest(page)).toEqual(complete)
  await expect
    .poll(() => getPersistedDocumentDigest(document.fileId))
    .toEqual(complete)
  await page.reload()
  await waitForAppReady(page)
  await connected(page)
  await expect.poll(() => getCoreDocumentDigest(page)).toEqual(complete)
  await page.evaluate(async (id) => {
    const { fillApis, transactionApis } = await import('../src/common-apis')
    const core = (await import('../src/contexts')).default
    const children = core.getElementChildren(id, 0, 1).elementIds

    if (!children[0]) {
      throw new Error('Missing crown child after reload')
    }

    transactionApis.runTransaction(() =>
      fillApis.updateFillsAtIndex([children[0]], 0, { opacity: 0.75 })
    )
  }, crown)
  const next = await getCoreDocumentDigest(page)

  expect(next).not.toEqual(complete)
  await expect
    .poll(() => getPersistedDocumentDigest(document.fileId))
    .toEqual(next)
  await page.reload()
  await waitForAppReady(page)
  await expect.poll(() => getCoreDocumentDigest(page)).toEqual(next)
})

test('recorded leaf and group capture targets preserve subtree membership and local region pixels', async ({
  page
}) => {
  test.setTimeout(90000)
  const document = createTestDocumentIdentity()

  await page.goto(document.url)
  await waitForAppReady(page)
  await connected(page)
  const { designs, execute, invoke, signal } = await runtime(page)
  const keys = ['base-y', 'bamboo-3-south', 'crown-taper-y']

  const square = (
    key: string,
    x: number,
    y: number,
    size: number,
    fill: string
  ) => ({
    type: 'vector',
    key,
    name: key,
    fill,
    rings: [
      [
        { x, y },
        { x: x + size, y },
        { x: x + size, y: y + size },
        { x, y: y + size }
      ]
    ]
  })

  const prepared = JSON.parse(
    await designs.call(
      'prepare_design',
      {
        draft: {
          type: 'group',
          name: 'Capture membership',
          children: keys.map((key, i) => ({
            type: 'group',
            key: `${key}-group`,
            name: `${key} - Group`,
            children: [
              square(key, 200 + i * 140, 300, 100, '#ff0000'),
              square(`${key}-windows`, 240 + i * 140, 340, 20, '#0000ff')
            ]
          }))
        }
      },
      signal
    )
  )

  expect(prepared.applicable).toBe(true)
  await execute(
    designs.resolveBatch({
      batchId: 'capture-membership',
      actions: [
        {
          id: 'apply',
          name: 'apply_prepared_design',
          arguments: { artifactId: prepared.artifactId },
          summary: 'Create capture membership fixture'
        }
      ]
    })
  )
  const before = await getCoreDocumentDigest(page)

  for (const key of keys) {
    const [leaf, group] = designs.resolveTargets({
      artifactId: prepared.artifactId,
      keys: [key, `${key}-group`]
    })
    const images = []

    for (const [name, args] of [
      ['leaf', { elementId: leaf, view: 'detail' }],
      [
        'group',
        {
          elementId: group,
          view: 'detail',
          region: { x: 20, y: 20, width: 60, height: 60 }
        }
      ]
    ] as const) {
      const result = await invoke('inspect_drawing', { arguments: args })
      const captured = result.actionResults[0].result

      expect(captured.available, JSON.stringify(captured)).toBe(true)
      const bytes = Buffer.from(captured.image.dataUrl.split(',')[1], 'base64')

      await test
        .info()
        .attach(`${key}-${name}.png`, { body: bytes, contentType: 'image/png' })
      const { data, info } = await sharp(bytes)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      const offset =
        (Math.floor(info.height / 2) * info.width +
          Math.floor(info.width / 2)) *
        info.channels

      images.push(Array.from(data.subarray(offset, offset + 4)))
    }

    expect(images).toEqual([
      [255, 0, 0, 255],
      [0, 0, 255, 255]
    ])
  }

  expect(await getCoreDocumentDigest(page)).toEqual(before)
  await page.screenshot({
    path: test.info().outputPath('capture-membership-app.png')
  })
})
