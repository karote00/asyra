import { createLocalToolHost } from '../server/local-tool-host'
import { createDesignPreparationSession } from '../server/design-preparation'
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
        'execute_design',
        { inspection: 'defer', operations: [invalid] },
        signal
      )
    ).rejects.toThrow(/exactly one/)
    expect(await getCoreDocumentDigest(page)).toEqual(initial)
    const aborted = new AbortController()

    aborted.abort()
    await expect(
      ops.call(
        'execute_design',
        { inspection: 'defer', operations: [operation] },
        aborted.signal
      )
    ).rejects.toThrow()
    expect(await getCoreDocumentDigest(page)).toEqual(initial)
    const receipt = JSON.parse(
      await ops.call(
        'execute_design',
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

test('staged host shows the first application while independent preparation continues', async ({
  page
}, testInfo) => {
  const document = createTestDocumentIdentity()

  await page.goto(document.url)
  await waitForAppReady(page)
  await connected(page)
  const { actions, execute } = await anchorHarness(page)
  const events: string[] = []
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let preparations = 0
  let applications = 0
  const host = createLocalToolHost({
    requestId: 'staged-visibility',
    signal: new AbortController().signal,
    capacity: 16,
    receiptCapacity: 8,
    artifactCapacity: 16,
    limits: {
      steps: 64,
      bindings: 240,
      bindingDepth: 32,
      bytes: 100000,
      issues: 8
    },
    store: {
      read: async () => undefined,

      list: async () => [],

      write: async () => {
        throw Error('No saved tool required')
      }
    },

    createGroups: (ownership) => {
      const designs = createLocalDesignTools(
        actions,
        createDesignPreparationSession(undefined, undefined, ownership)
      )
      const original = designs.call.bind(designs)

      designs.call = async (name, args, signal) => {
        const result = await original(name, args, signal)

        if (name === 'prepare_design') {
          events.push('prepared-' + ++preparations)
        }

        return result
      }

      const operations = createLocalOperationTools(
        actions,
        designs,
        async (batch) => {
          const result = await execute(batch)

          events.push('applied-' + ++applications)
          if (applications === 1) {
            await gate
          }

          return result
        }
      )

      return [
        { name: 'design_preparation', description: 'Prepare', owner: designs },
        { name: 'design_operations', description: 'Apply', owner: operations }
      ]
    }
  })
  const running = host.invoke({
    name: 'design_operations.execute_design',
    input: {
      inspection: 'defer',
      stages: ['a', 'b'].map((id, index) => ({
        id,
        operations: [
          {
            id: id + '-prepare',
            name: 'prepare_design',
            arguments: {
              draft: {
                type: 'group',
                name: 'Stage ' + id,
                children: [
                  {
                    type: 'rect',
                    name: 'Stage face ' + id,
                    key: 'face',
                    x: index * 140,
                    y: 0,
                    width: 100,
                    height: 100,
                    fill: index ? '#287dc4' : '#d75542'
                  }
                ]
              }
            }
          }
        ],
        apply: [
          {
            id: id + '-apply',
            name: 'apply_prepared_design',
            arguments: {
              artifactId: {
                kind: 'step',
                step: id + '-prepare',
                path: '/artifactId'
              }
            }
          }
        ]
      }))
    }
  })

  try {
    await expect
      .poll(() => events.includes('applied-1') && events.includes('prepared-2'))
      .toBe(true)
    expect(applications).toBe(1)

    const roots = () =>
      page.evaluate(async () => {
        const { core } = await import('../src/testing/runtime-access')

        return core.getElementChildren(core.getCurrentWorkspaceId(), 0, 20)
          .elementIds.length
      })

    expect(await roots()).toBe(1)
    await page.evaluate(async () => {
      const { viewportApis } = await import('../src/common-apis/viewport')

      viewportApis.zoomToCenter(1, 120, 50)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    })
    await page.screenshot({
      path: testInfo.outputPath('first-stage-visible.png')
    })
    release()
    const result = JSON.parse((await running).text)

    expect(result, JSON.stringify(result)).toMatchObject({
      toolOutcome: { status: 'success' },
      stages: [
        { id: 'a', status: 'applied' },
        { id: 'b', status: 'applied' }
      ]
    })
    expect(await roots()).toBe(2)
    await page.screenshot({
      path: testInfo.outputPath('both-stages-visible.png')
    })
    await undo(page)
    expect(await roots()).toBe(1)
    await redo(page)
    expect(await roots()).toBe(2)
  } finally {
    release()
    await running.catch(() => undefined)
    await host.dispose()
  }
})
