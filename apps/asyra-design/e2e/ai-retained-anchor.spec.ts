import { admitPreparedDesignDelivery } from '../src/ai/prepared-design-admission'
import { expect, test, type Page } from '@playwright/test'
import type { AiActionBatch } from '@asyra/ai-agent-runtime'
import { createLocalDesignTools } from '../server/local-design-tools'
import { createLocalOperationTools } from '../server/local-operation-tools'
import {
  createTestDocumentIdentity,
  getCoreDocumentDigest,
  getPersistedDocumentDigest,
  waitForAppReady,
  undo,
  redo
} from './test-utils'

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
const anchorHarness = async (page: Page) => {
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
    testRuntimeState.set('anchor-runtime', input)
    testRuntimeState.set('anchor-request', new AbortController())
    return JSON.parse(JSON.stringify(input.actionDefinitions))
  })
  const execute = async (batch: AiActionBatch) =>
    (await page.evaluate(async (batch) => {
      const { testRuntimeState } = await import('../src/testing/runtime-access')
      type Input = ReturnType<
        typeof import('../src/ai/runtime-input').createAiRuntimeInput
      >
      const input = testRuntimeState.get<Input>('anchor-runtime')
      const request = testRuntimeState.get<AbortController>('anchor-request')
      if (!input?.transactionRunner || !request) {
        throw new Error('Missing runtime transaction owner')
      }
      return input.transactionRunner.run(
        'Retained anchor scenario',
        async (runMutation) => {
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
        }
      )
    }, batch)) as never
  return { actions, execute }
}

test('retained anchor reaches real hierarchy, rejects ambiguity, and preserves peer order, history and reload', async ({
  page,
  context
}) => {
  const document = createTestDocumentIdentity()
  await page.goto(document.url)
  await waitForAppReady(page)
  await connected(page)
  const { actions, execute } = await anchorHarness(page)
  const tools = createLocalDesignTools(actions)
  const ops = createLocalOperationTools(actions, tools, execute)
  const signal = new AbortController().signal
  const prepared = JSON.parse(
    await tools.call(
      'prepare_design',
      {
        draft: {
          type: 'group',
          name: 'Sibling order',
          children: ['anchor', 'a', 'b', 'unrelated'].map((key, index) => ({
            key,
            name: key,
            type: 'rect',
            x: index * 40,
            y: 0,
            width: 30,
            height: 40,
            fill: '#336688'
          }))
        }
      },
      signal
    )
  )
  const packet = tools.resolveBatch({
    batchId: 'create',
    actions: [
      {
        id: 'create',
        name: 'apply_prepared_design',
        arguments: { artifactId: prepared.artifactId },
        summary: 'Create siblings'
      }
    ]
  })
  const design = admitPreparedDesignDelivery(packet.actions[0].arguments.design)
  await execute(packet)
  const readOrder = (client: Page) =>
    client.evaluate(async (rootId) => {
      const result = (
        await import('../src/testing/runtime-access')
      ).core.getElementChildren(rootId)
      if (!result.available || result.nextOffset !== null) {
        throw new Error('Incomplete known sibling read')
      }
      return result.elementIds
    }, design.rootId)
  const originalOrder = await readOrder(page)
  expect(originalOrder).toEqual(
    ['anchor', 'a', 'b', 'unrelated'].map((key) => design.keyToId[key])
  )
  const initial = await getCoreDocumentDigest(page)
  const peer = await context.newPage()
  try {
    await peer.goto(document.url)
    await waitForAppReady(peer)
    await connected(peer)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(initial)
    const operation = {
      name: 'api_hierarchy_moveElementsRelative',
      arguments: { request: { placement: 'before' } },
      target: [
        {
          field: 'elementIds',
          artifactId: prepared.artifactId,
          keys: ['a', 'b']
        },
        {
          field: 'anchorId',
          path: ['request', 'anchorId'],
          artifactId: prepared.artifactId,
          keys: ['anchor']
        }
      ]
    }
    const invalid = structuredClone(operation)
    invalid.target[1].keys = ['anchor', 'unrelated']
    await expect(
      ops.call(
        'execute_design_batch',
        { inspection: 'defer', operations: [invalid] },
        signal
      )
    ).rejects.toThrow(/exactly one/)
    expect(await getCoreDocumentDigest(page)).toEqual(initial)
    const aborted = new AbortController()
    aborted.abort()
    await expect(
      ops.call(
        'execute_design_batch',
        { inspection: 'defer', operations: [operation] },
        aborted.signal
      )
    ).rejects.toThrow()
    expect(await getCoreDocumentDigest(page)).toEqual(initial)
    const receipt = JSON.parse(
      await ops.call(
        'execute_design_batch',
        { inspection: 'defer', operations: [operation] },
        signal
      )
    )
    expect(receipt.status).not.toBe('failed')
    const expectedOrder = ['a', 'b', 'anchor', 'unrelated'].map(
      (key) => design.keyToId[key]
    )
    expect(await readOrder(page)).toEqual(expectedOrder)
    const moved = await getCoreDocumentDigest(page)
    await expect.poll(() => getCoreDocumentDigest(peer)).toEqual(moved)
    await expect.poll(() => readOrder(peer)).toEqual(expectedOrder)
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(moved)
    await undo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(initial)
    await redo(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(moved)
    await expect
      .poll(() => getPersistedDocumentDigest(document.fileId))
      .toEqual(moved)
    await page.reload()
    await waitForAppReady(page)
    await connected(page)
    await expect.poll(() => getCoreDocumentDigest(page)).toEqual(moved)
    expect(await readOrder(page)).toEqual(expectedOrder)
  } finally {
    await peer.close()
  }
})
