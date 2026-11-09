import recorded from './fixtures/recorded-101/staged-retention-20261106.json'
import { expect, it } from 'vitest'
import { resultDelivery } from '../local-result-delivery'
import { createConversationResults } from '../../src/ai/conversation-results'

it('identifies the rejected alias and exact request references without losing a valid selection', async () => {
  const context = createConversationResults(() => 1).open('stage-context')
  const delivery = resultDelivery(
    {
      retain: {
        ...recorded.input.retain,
        assemblyGroup: { path: '/actionResults/0/result/value/groupId' }
      }
    },
    async (request) => context.exchange(request)
  )
  const view = recorded.output.fields.groupReceipt
  const retained = view.actionResults[0].result.retained

  await delivery.capture(
    undefined,
    view,
    new Set([retained.snapshotId, retained.leaseId])
  )

  const receipt = delivery.finish(
    { status: 'success', settlement: 'completed', issues: [] },
    ['group'],
    []
  )

  expect(receipt.saved.map(({ name }: { name: string }) => name)).toEqual([
    'assemblyGroup'
  ])
  expect(receipt.toolOutcome.settlement).toBe('completed')
  expect(receipt.issues?.join(' ')).toContain('taipei101Assembly')
  expect(receipt.issues?.join(' ')).toContain(
    '/actionResults/0/result/retained/snapshotId'
  )
  expect(receipt.issues?.join(' ')).toContain(
    '/actionResults/0/result/retained/leaseId'
  )
  expect(
    context.exchange({ read: { group: { name: 'assemblyGroup', path: '' } } })
  ).toEqual({ group: view.actionResults[0].result.value.groupId })
})

it('retains only public authored input fields after successful execution', async () => {
  const context = createConversationResults(() => 1).open('authored')
  const delivery = resultDelivery(
    {
      retain: {
        source: { step: 'prepare', source: 'input', path: '' },
        dimensions: { step: 'prepare', source: 'input', path: '/dimensions' }
      }
    },
    async (request) => context.exchange(request)
  )

  await delivery.capture(
    'prepare',
    { toolOutcome: { status: 'success' } },
    new Set(),
    {
      value: {
        artifactId: 'request-only',
        dimensions: { width: 30, height: 40 }
      },
      blocked: new Set(['request-only'])
    }
  )
  const receipt = delivery.finish(
    { status: 'success', settlement: 'completed', issues: [] },
    ['prepare'],
    []
  )

  expect(receipt.saved.map(({ name }: { name: string }) => name)).toEqual([
    'dimensions'
  ])
  expect(receipt.issues).toEqual([
    'source: Request-scoped references cannot be saved across turns: /artifactId'
  ])
  expect(
    context.exchange({ read: { next: { name: 'dimensions', path: '' } } })
  ).toEqual({ next: { width: 30, height: 40 } })
})

it('acknowledges saved operation results with reusable provenance and shape without returning values', async () => {
  const app = createConversationResults(() => 'document')
  const context = app.open('staged')
  const delivery = resultDelivery(
    {
      retain: { paneTargets: { step: 'panes', path: '/compositionIds' } },
      delivery: 'status'
    },
    async (request) => context.exchange(request)
  )

  await delivery.capture(
    'panes',
    { compositionIds: ['private-pane-id'] },
    new Set(),
    undefined,
    'design_operations.prepare_and_apply_design'
  )
  const receipt = delivery.finish(
    { status: 'success', settlement: 'completed', issues: [] },
    ['panes'],
    []
  )

  expect(receipt.saved).toEqual([
    expect.objectContaining({
      name: 'paneTargets',
      type: 'array',
      origin: {
        operation: 'design_operations.prepare_and_apply_design',
        step: 'panes',
        source: 'result',
        path: '/compositionIds'
      },
      paths: expect.arrayContaining([{ path: '', type: 'array', length: 1 }])
    })
  ])
  expect(JSON.stringify(receipt)).not.toContain('private-pane-id')
  expect(app.open('staged').describe()).toEqual(receipt.saved)
  expect(
    context.exchange({ read: { ids: { name: 'paneTargets', path: '' } } })
  ).toEqual({ ids: ['private-pane-id'] })
})
