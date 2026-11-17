import { createAiConversationDrafts } from '../conversation-drafts'
import { projectAiActivity } from '../presentation'
import { describe, expect, it, vi } from 'vitest'
import {
  AiConversationError,
  createAiConversationController,
  type AiConversationFeature
} from '../conversation'
import { createDeferred } from './deferred'

const executed = (
  result: Record<string, unknown>,
  actionName = 'insert_vector_composition'
) => ({
  actionResults: [
    {
      actionId: 'action-1',
      actionName,
      result
    }
  ],
  status: 'executed'
})

const createFeature = (
  execute: AiConversationFeature['execute']
): AiConversationFeature => ({
  cancel: vi.fn(() => true),
  execute: vi.fn(execute)
})

it('keeps inherited reference images out of text replies while retaining provider context across answers and retry', async () => {
  const attachment = {
    dataUrl: 'data:image/png;base64,YQ==',
    mediaType: 'image/png' as const,
    name: 'reference.png',
    size: 1
  }
  const question = executed(
    {
      action: 'request_drawing_detail_choice',
      clarification: {
        kind: 'drawing-detail',
        optionIds: ['balanced', 'maximum']
      },
      status: 'no-change'
    },
    'request_drawing_detail_choice'
  )
  const pending = createDeferred<unknown>()
  const feature = createFeature(
    vi
      .fn()
      .mockResolvedValueOnce(question)
      .mockImplementationOnce(() => pending.promise)
      .mockResolvedValueOnce({
        status: 'failed',
        stage: 'provider',
        code: 'AI_PROVIDER_TRANSPORT_FAILED'
      })
      .mockResolvedValue({ status: 'executed', actionResults: [] })
  )
  const controller = createAiConversationController({
    feature,
    getElementType: vi.fn()
  })
  await controller.submit({
    intent: 'Draw the reference at 240 by 240',
    attachments: [attachment]
  })
  const answer = controller.submit('That is fine')
  expect(controller.getSnapshot().activeTurn?.attachments).toEqual([])
  expect(controller.getSnapshot().activeTurn?.originalIntent).toBe(
    'Draw the reference at 240 by 240'
  )
  expect(feature.execute).toHaveBeenLastCalledWith(
    expect.objectContaining({
      metadata: expect.objectContaining({ imageAttachments: [attachment] })
    })
  )
  pending.resolve(question)
  expect((await answer).attachments).toEqual([])
  const failed = await controller.submit('Balanced, please')
  expect(failed.attachments).toEqual([])
  expect(feature.execute).toHaveBeenLastCalledWith(
    expect.objectContaining({
      metadata: expect.objectContaining({ imageAttachments: [attachment] })
    })
  )
  await controller.retry(failed.turnId)
  expect(feature.execute).toHaveBeenLastCalledWith(
    expect.objectContaining({
      metadata: expect.objectContaining({ imageAttachments: [attachment] })
    })
  )
  await controller.submit('Draw a new circle')
  expect(feature.execute).toHaveBeenLastCalledWith(
    expect.objectContaining({
      metadata: expect.not.objectContaining({
        imageAttachments: expect.anything()
      })
    })
  )
})

describe('Asyra Design AI conversation controller', () => {
  it('retains ordered safe progress with the settled turn and brackets history correlation', async () => {
    const history = {
      beginTurn: vi.fn(),
      endTurn: vi.fn()
    }
    const feature = createFeature(async (request) => {
      request.progressObserver({
        attempt: 1,
        phase: 'context',
        summary: 'Understanding the request'
      })
      request.progressObserver({
        actionCount: 1,
        attempt: 1,
        phase: 'execution',
        summary: 'Applying changes'
      })
      return executed({
        appliedElementIds: ['secret-canonical-id'],
        skipped: [],
        status: 'complete'
      })
    })
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-progress',
      feature,
      getElementType: vi.fn(),
      history
    })

    await expect(controller.submit('draw')).resolves.toMatchObject({
      progress: [
        {
          phase: 'context',
          summary: 'Understanding the request'
        },
        {
          phase: 'execution',
          summary: 'Applying changes'
        }
      ],
      turnId: 'conversation-progress:turn:1'
    })
    expect(history.beginTurn).toHaveBeenCalledWith(
      'conversation-progress:turn:1'
    )
    expect(history.endTurn).toHaveBeenCalledWith('conversation-progress:turn:1')
  })

  it('owns stable instance-local conversation and ordered turn records', async () => {
    const feature = createFeature(async () =>
      executed({
        appliedElementIds: ['face-1', 'eye-left-1', 'eye-right-1'],
        compositionId: 'group-1',
        roleToElementIds: {
          face: ['face-1'],
          'left-eye': ['eye-left-1'],
          'right-eye': ['eye-right-1']
        },
        skipped: [],
        status: 'complete'
      })
    )
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-a',
      feature,
      getElementType: vi.fn(() => 'oval')
    })

    await expect(
      controller.submit('  draw a cat face  ')
    ).resolves.toMatchObject({
      conversationId: 'conversation-a',
      intent: 'draw a cat face',
      outcome: 'success',
      turnId: 'conversation-a:turn:1'
    })
    await expect(
      controller.submit('make the eyes bigger')
    ).resolves.toMatchObject({
      conversationId: 'conversation-a',
      turnId: 'conversation-a:turn:2'
    })

    expect(controller.getSnapshot()).toMatchObject({
      activeTurn: null,
      conversationId: 'conversation-a',
      disposed: false,
      settledTurns: [
        {
          turnId: 'conversation-a:turn:1'
        },
        {
          turnId: 'conversation-a:turn:2'
        }
      ]
    })
    expect(Object.isFrozen(controller.getSnapshot())).toBe(true)
    expect(Object.isFrozen(controller.getSnapshot().settledTurns)).toBe(true)
  })

  it('carries immutable detached image attachments through the active turn, Feature metadata, and settlement', async () => {
    const pending = createDeferred<Record<string, unknown>>()
    const feature = createFeature(() => pending.promise)
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-attachment',
      feature,
      getElementType: vi.fn()
    })
    const sourceAttachment = {
      dataUrl: 'data:image/png;base64,dGFiYnk=',
      mediaType: 'image/png' as const,
      name: 'tabby.png',
      size: 5
    }
    const settlement = controller.submit({
      attachments: [sourceAttachment],
      intent: '  draw from this image  '
    })

    const active = controller.getSnapshot().activeTurn
    expect(active).toMatchObject({
      attachments: [
        {
          mediaType: 'image/png',
          name: 'tabby.png',
          size: 5
        }
      ],
      intent: 'draw from this image'
    })
    expect(Object.isFrozen(active?.attachments)).toBe(true)
    expect(Object.isFrozen(active?.attachments[0])).toBe(true)
    expect(feature.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'draw from this image',
        metadata: expect.objectContaining({
          imageAttachments: [
            {
              dataUrl: 'data:image/png;base64,dGFiYnk=',
              mediaType: 'image/png',
              name: 'tabby.png',
              size: 5
            }
          ]
        })
      })
    )

    sourceAttachment.name = 'changed-after-submit.png'
    pending.resolve(
      executed({
        appliedElementIds: [],
        skipped: [],
        status: 'no-change'
      })
    )
    await expect(settlement).resolves.toMatchObject({
      attachments: [
        {
          name: 'tabby.png'
        }
      ],
      intent: 'draw from this image'
    })
  })

  it('rejects missing text and invalid detached image descriptors before Feature execution', async () => {
    const feature = createFeature(async () => ({
      status: 'failed'
    }))
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-invalid-attachment',
      feature,
      getElementType: vi.fn()
    })

    await expect(
      controller.submit({
        attachments: [
          {
            dataUrl: 'data:image/png;base64,dGFiYnk=',
            mediaType: 'image/png',
            name: 'tabby.png',
            size: 5
          }
        ],
        intent: '   '
      })
    ).rejects.toMatchObject({
      code: 'AI_CONVERSATION_INVALID_INTENT'
    })
    await expect(
      controller.submit({
        attachments: [
          {
            dataUrl: 'data:text/plain;base64,bm90LWltYWdl',
            // @ts-expect-error Deliberately invalid wire input must be rejected at runtime.
            mediaType: 'text/plain',
            name: 'notes.txt',
            size: 9
          }
        ],
        intent: 'draw this'
      })
    ).rejects.toMatchObject({
      code: 'AI_CONVERSATION_INVALID_ATTACHMENT'
    })
    expect(feature.execute).not.toHaveBeenCalled()
  })

  it('records monotonic elapsed time from accepted submission through settlement', async () => {
    let now = 2_000
    const feature = createFeature(async () => {
      now = 3_250
      return executed({
        appliedElementIds: ['face-1'],
        skipped: [],
        status: 'complete'
      })
    })
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-duration',
      feature,
      getElementType: vi.fn(),
      now: () => now
    })

    await expect(controller.submit('draw')).resolves.toMatchObject({
      durationMs: 1_250,
      outcome: 'success'
    })
    expect(controller.getSnapshot().settledTurns).toMatchObject([
      {
        durationMs: 1_250,
        turnId: 'conversation-duration:turn:1'
      }
    ])
  })

  it('excludes approval waiting from execution duration', async () => {
    let time = 1000
    const feature = createFeature(async ({ progressObserver }) => {
      time = 1500
      progressObserver({
        attempt: 1,
        phase: 'confirmation',
        summary: 'Waiting for confirmation'
      })
      time = 11500
      progressObserver({
        attempt: 1,
        phase: 'execution',
        summary: 'Applying changes'
      })
      time = 12000
      return executed({ status: 'complete' })
    })
    const controller = createAiConversationController({
      feature,
      getElementType: vi.fn(),
      now: () => time
    })
    await expect(controller.submit('draw')).resolves.toMatchObject({
      durationMs: 1000,
      waitingDurationMs: 10000
    })
  })

  it('contains presentation observer failures without changing turn execution', async () => {
    const feature = createFeature(async () =>
      executed({
        appliedElementIds: [],
        skipped: [],
        status: 'no-change'
      })
    )
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-observer',
      feature,
      getElementType: vi.fn()
    })

    expect(() =>
      controller.subscribe(() => {
        throw new Error('presentation failed')
      })
    ).not.toThrow()
    await expect(controller.submit('request')).resolves.toMatchObject({
      outcome: 'no-change'
    })
    expect(feature.execute).toHaveBeenCalledOnce()
  })

  it('rejects whitespace and overlap without creating another task queue', async () => {
    const pending = createDeferred<Record<string, unknown>>()
    const feature = createFeature(() => pending.promise)
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-b',
      feature,
      getElementType: vi.fn()
    })

    await expect(controller.submit('   ')).rejects.toMatchObject({
      code: 'AI_CONVERSATION_INVALID_INTENT'
    })
    const first = controller.submit('draw a cat face')
    await expect(controller.submit('second turn')).rejects.toEqual(
      expect.objectContaining<Partial<AiConversationError>>({
        code: 'AI_CONVERSATION_TURN_ACTIVE'
      })
    )
    expect(feature.execute).toHaveBeenCalledOnce()

    pending.resolve({
      code: 'AI_PROVIDER_TRANSPORT_FAILED',
      stage: 'provider',
      status: 'failed'
    })
    await first
  })

  it('revalidates canonical target hints before every follow-up request', async () => {
    const targetTypes = new Map([
      ['group-1', 'group'],
      ['eye-left-1', 'oval'],
      ['eye-right-1', 'oval'],
      ['whisker-gone', 'vector']
    ])
    const getElementType = vi.fn((elementId: string) =>
      targetTypes.get(elementId)
    )
    const feature = createFeature(async (request) => {
      if (request.intent === 'draw a cat face') {
        return executed({
          appliedElementIds: [
            'face-1',
            'eye-left-1',
            'eye-right-1',
            'whisker-gone'
          ],
          compositionId: 'group-1',
          roleToElementIds: {
            'left-eye': ['eye-left-1'],
            'right-eye': ['eye-right-1'],
            whiskers: ['whisker-gone']
          },
          skipped: [],
          status: 'complete'
        })
      }
      return executed(
        {
          appliedElementIds: ['eye-left-1', 'eye-right-1'],
          skipped: [],
          status: 'complete'
        },
        'update_composition_elements'
      )
    })
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-c',
      feature,
      getElementType
    })

    await controller.submit('draw a cat face')
    targetTypes.delete('whisker-gone')
    await controller.submit('make the eyes bigger')

    expect(feature.execute).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        intent: 'make the eyes bigger',
        metadata: {
          aiTargets: {
            compositionId: 'group-1',
            roleToElementIds: {
              'left-eye': ['eye-left-1'],
              'right-eye': ['eye-right-1']
            }
          },
          conversationId: 'conversation-c',
          turnId: 'conversation-c:turn:2',
          conversationContext: expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({ text: 'draw a cat face' }),
              expect.objectContaining({ text: 'make the eyes bigger' })
            ])
          })
        }
      })
    )
    expect(getElementType).toHaveBeenCalledWith('whisker-gone')
  })

  it('maps partial and no-change execution without inventing a successful mutation', async () => {
    const feature = createFeature(async (request) => {
      if (request.intent === 'partial') {
        return executed({
          appliedElementIds: ['face-1'],
          skipped: [{ reason: 'duplicate-role', role: 'face' }],
          status: 'partial'
        })
      }
      return executed({
        appliedElementIds: [],
        skipped: [{ reason: 'missing-target' }],
        status: 'no-change'
      })
    })
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-d',
      feature,
      getElementType: vi.fn()
    })

    await expect(controller.submit('partial')).resolves.toMatchObject({
      outcome: 'partial'
    })
    await expect(controller.submit('no change')).resolves.toMatchObject({
      outcome: 'no-change'
    })
  })

  it.each([
    { statuses: ['failed'], outcome: 'failed' },
    { statuses: ['no-change', 'failed'], outcome: 'failed' },
    { statuses: ['complete', 'failed'], outcome: 'partial' }
  ])(
    'retains API receipt failures: $statuses',
    async ({ statuses, outcome }) => {
      const feature = createFeature(async () => ({
        status: 'executed',
        actionResults: statuses.map((status, index) => ({
          actionId: `action-${index}`,
          actionName: 'basic_element_createElements',
          result: {
            status,
            value: status === 'failed' ? [null] : ['element-1']
          }
        }))
      }))
      const controller = createAiConversationController({
        feature,
        getElementType: vi.fn()
      })
      await expect(
        controller.submit('Create the requested elements')
      ).resolves.toMatchObject({ outcome })
    }
  )

  it('clears target hints after successful composition deletion', async () => {
    const feature = createFeature(async (request) => {
      if (request.intent === 'create') {
        return executed({
          appliedElementIds: ['face-1'],
          compositionId: 'group-1',
          roleToElementIds: {
            face: ['face-1']
          },
          skipped: [],
          status: 'complete'
        })
      }
      return executed(
        {
          appliedElementIds: ['group-1', 'face-1'],
          skipped: [],
          status: 'complete'
        },
        'remove_ai_composition'
      )
    })
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-e',
      feature,
      getElementType: vi.fn((elementId) =>
        elementId === 'group-1' ? 'group' : 'oval'
      )
    })

    await controller.submit('create')
    await controller.submit('delete')

    expect(controller.getSnapshot().targetHints).toEqual({
      compositionId: null,
      roleToElementIds: {}
    })
  })

  it('routes cancellation through Feature System and contains late settlement after disposal', async () => {
    const pending = createDeferred<Record<string, unknown>>()
    const feature = createFeature(() => pending.promise)
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-f',
      feature,
      getElementType: vi.fn()
    })
    const settlement = controller.submit('draw a cat face')

    expect(controller.cancel('user-cancelled')).toBe(true)
    expect(feature.cancel).toHaveBeenCalledWith('user-cancelled')
    const disposal = controller.dispose()
    pending.resolve(
      executed({
        appliedElementIds: ['late-shape'],
        compositionId: 'late-group',
        roleToElementIds: {
          face: ['late-shape']
        },
        status: 'complete'
      })
    )

    await expect(settlement).resolves.toMatchObject({
      outcome: 'cancelled'
    })
    await disposal
    expect(controller.getSnapshot()).toMatchObject({
      activeTurn: null,
      disposed: true,
      settledTurns: []
    })
    expect(controller.getSnapshot().targetHints).toEqual({
      compositionId: null,
      roleToElementIds: {}
    })
  })

  it('correlates confirmation lifecycle to the active turn without owning its decision', async () => {
    const pending = createDeferred<Record<string, unknown>>()
    const feature = createFeature(() => pending.promise)
    const confirmation = {
      beginTurn: vi.fn(),
      cancel: vi.fn(() => true),
      endTurn: vi.fn()
    }
    const controller = createAiConversationController({
      confirmation,
      createConversationId: () => 'conversation-confirmation',
      feature,
      getElementType: vi.fn()
    })
    const settlement = controller.submit('delete')

    expect(confirmation.beginTurn).toHaveBeenCalledWith(
      'conversation-confirmation:turn:1'
    )
    expect(controller.cancel('panel-closed')).toBe(true)
    expect(confirmation.cancel).toHaveBeenCalledWith('panel-closed')
    pending.resolve({
      reason: 'aborted',
      status: 'cancelled'
    })

    await settlement
    expect(confirmation.endTurn).toHaveBeenCalledWith(
      'conversation-confirmation:turn:1'
    )
  })

  it.each([
    [{ reason: 'aborted', status: 'cancelled' }, 'cancelled'],
    [
      {
        code: 'AI_PROVIDER_TRANSPORT_FAILED',
        stage: 'provider',
        status: 'failed'
      },
      'failed'
    ]
  ] as const)('maps terminal result %j to %s', async (result, outcome) => {
    const controller = createAiConversationController({
      createConversationId: () => 'conversation-g',
      feature: createFeature(async () => result),
      getElementType: vi.fn()
    })

    await expect(controller.submit('request')).resolves.toMatchObject({
      outcome
    })
  })
})

it('rejects stale or unknown reply targets before provider work', async () => {
  const feature = createFeature(async () => executed({ status: 'no-change' }))
  const conversation = createAiConversationController({
    feature,
    getElementType: vi.fn()
  })
  const first = await conversation.submit('Draw a 240x240 logo')
  await conversation.submit('Another request')
  for (const replyToTurnId of [first.turnId, 'unknown']) {
    await expect(
      conversation.submit({ intent: 'Balanced', replyToTurnId })
    ).rejects.toMatchObject({ code: 'AI_CONVERSATION_INVALID_REPLY' })
  }
  expect(feature.execute).toHaveBeenCalledTimes(2)
})

describe('conversation recovery admission', () => {
  it('rejects replay of a partially applied result', async () => {
    const controller = createAiConversationController({
      feature: {
        cancel: () => false,
        execute: async () => ({
          status: 'executed',
          actionResults: [
            {
              actionName: 'insert_vector_composition',
              result: { status: 'partial' }
            }
          ]
        })
      },
      getElementType: () => undefined
    })
    const turn = await controller.submit('draw')
    await expect(controller.retry(turn.turnId)).rejects.toMatchObject({
      code: 'AI_CONVERSATION_UNSAFE_RETRY'
    })
  })
})

it('retains native design targets and revalidates each distinct object once per follow-up', async () => {
  const types = new Map([
    ['f', 'frame'],
    ['t', 'text'],
    ['r', 'rect'],
    ['w', 'workspace']
  ])
  const getElementType = vi.fn((id: string) => types.get(id))
  const feature = createFeature(async (request) =>
    request.intent === 'create'
      ? executed(
          {
            compositionId: 'f',
            roleToElementIds: {
              root: ['f'],
              heading: ['t'],
              card: ['r'],
              duplicate: ['t'],
              invalid: ['w']
            },
            appliedElementIds: ['f', 't', 'r'],
            status: 'complete'
          },
          'apply_prepared_design'
        )
      : executed({ status: 'no-change' })
  )
  const controller = createAiConversationController({ feature, getElementType })
  await controller.submit('create')
  getElementType.mockClear()
  await controller.submit('Revise the heading')
  expect(feature.execute).toHaveBeenLastCalledWith(
    expect.objectContaining({
      metadata: expect.objectContaining({
        aiTargets: {
          compositionId: 'f',
          roleToElementIds: {
            root: ['f'],
            heading: ['t'],
            card: ['r'],
            duplicate: ['t']
          }
        }
      })
    })
  )
  expect(getElementType).toHaveBeenCalledTimes(4)
  types.delete('t')
  await controller.submit('Organize the remaining design')
  expect(feature.execute).toHaveBeenLastCalledWith(
    expect.objectContaining({
      metadata: expect.objectContaining({
        aiTargets: {
          compositionId: 'f',
          roleToElementIds: { root: ['f'], card: ['r'] }
        }
      })
    })
  )
})

it('starts new conversations without losing prior messages or target context', async () => {
  let id = 0
  const feature = createFeature(async () =>
    executed(
      {
        compositionId: 'f',
        roleToElementIds: { heading: ['t'] },
        status: 'complete'
      },
      'apply_prepared_design'
    )
  )
  const controller = createAiConversationController({
    feature,
    getElementType: (id) => (id === 'f' ? 'frame' : 'text'),
    createConversationId: () => `chat-${++id}`
  })
  const title =
    'Create the first design with a detailed heading, a large reference illustration, and a readable description of the summer exhibition.'
  await controller.submit(title)
  expect(controller.getNavigationSnapshot().title).toBe(title)
  const first = controller.getSnapshot()
  controller.newConversation()
  expect(controller.getNavigationSnapshot().conversations).toContainEqual({
    id: first.conversationId,
    title
  })
  expect(controller.getSnapshot()).toMatchObject({
    conversationId: 'chat-2',
    settledTurns: [],
    targetHints: { compositionId: null, roleToElementIds: {} }
  })
  controller.newConversation()
  expect(controller.getSnapshot().conversationId).toBe('chat-2')
  controller.selectConversation(first.conversationId)
  expect(controller.getSnapshot().settledTurns).toEqual(first.settledTurns)
  expect(controller.getSnapshot().targetHints).toEqual(first.targetHints)
  await controller.submit('Revise the heading')
  expect(controller.getSnapshot().settledTurns[1].turnId).toBe('chat-1:turn:2')
  expect(() => controller.selectConversation('missing')).toThrow()
})
it('guards navigation during work and keeps navigation snapshots stable during progress', async () => {
  const pending = createDeferred<unknown>()
  let progress:
    | Parameters<AiConversationFeature['execute']>[0]['progressObserver']
    | undefined
  const feature = createFeature((request) => {
    progress = request.progressObserver
    return pending.promise
  })
  const controller = createAiConversationController({
    feature,
    getElementType: () => undefined
  })
  const listener = vi.fn()
  controller.subscribeNavigation(listener)
  const task = controller.submit('Draw a scene')
  const snapshot = controller.getNavigationSnapshot(),
    calls = listener.mock.calls.length
  progress?.({ phase: 'provider', attempt: 1, summary: 'Requesting actions' })
  expect(controller.getNavigationSnapshot()).toBe(snapshot)
  expect(listener).toHaveBeenCalledTimes(calls)
  expect(() => controller.newConversation()).toThrow()
  expect(() => controller.selectConversation(snapshot.conversationId)).toThrow()
  pending.resolve(executed({ status: 'no-change' }))
  await task
  expect(controller.getNavigationSnapshot().busy).toBe(false)
  await controller.dispose()
  expect(() => controller.newConversation()).toThrow()
})

it('uses the same lifecycle decisions for recorded progress and the visible turn', async () => {
  const feature = createFeature(async ({ progressObserver }) => {
    const work = {
      phase: 'provider' as const,
      attempt: 1,
      summary: 'Working',
      message: 'Adding windows',
      activity: {
        kind: 'work' as const,
        callId: 'windows',
        sequence: 1,
        phase: 'provider' as const
      }
    }
    expect(progressObserver(work)).toMatchObject({
      reason: 'scoped-owner-phase'
    })
    expect(
      progressObserver({
        phase: 'settlement',
        attempt: 1,
        summary: 'Saving the drawing'
      })
    ).toMatchObject({ reason: 'lifecycle-control' })
    expect(
      progressObserver({ ...work, activity: { ...work.activity, sequence: 2 } })
    ).toMatchObject({
      status: 'rejected',
      reason: 'illegal-lifecycle-transition'
    })
    const active = controller.getSnapshot().activeTurn
    if (!active) throw new Error('Expected an active turn before settlement')
    expect(projectAiActivity(active.progress).current.label).toBe(
      'Saving the drawing'
    )
    return executed({ status: 'complete' })
  })
  const controller = createAiConversationController({
    feature,
    getElementType: vi.fn()
  })
  await controller.submit('Draw windows')
  const turn = controller.getSnapshot().settledTurns[0]
  expect(
    projectAiActivity(turn.progress, { outcome: turn.outcome }).current.label
  ).toBe('Finished')
  await controller.dispose()
})

it('retains the original activity objective through a failed clarification and retry', async () => {
  const question = executed(
    {
      action: 'request_drawing_detail_choice',
      clarification: {
        kind: 'drawing-detail',
        optionIds: ['balanced', 'maximum']
      },
      status: 'no-change'
    },
    'request_drawing_detail_choice'
  )
  const activePurposes: string[] = []
  const continueRequest: AiConversationFeature['execute'] = async ({
    progressObserver
  }) => {
    const initial = controller.getSnapshot().activeTurn
    if (!initial) throw new Error('Missing active continuation')
    activePurposes.push(initial.originalIntent)
    progressObserver({
      attempt: 1,
      phase: 'provider',
      summary: 'Active',
      message: 'Build the roof',
      activity: { kind: 'work', callId: 'roof', sequence: 1, phase: 'applying' }
    })
    progressObserver({
      attempt: 1,
      phase: 'provider',
      summary: 'Completed',
      toolStatus: 'completed',
      activity: {
        kind: 'system',
        callId: 'roof',
        sequence: 2,
        phase: 'applying'
      }
    })
    const active = controller.getSnapshot().activeTurn
    if (!active) throw new Error('Missing active continuation')
    expect(
      projectAiActivity(active.progress, { purpose: active.originalIntent })
        .current
    ).toEqual({
      label: 'Processing your request'
    })
    return {
      status: 'failed',
      stage: 'provider',
      code: 'AI_PROVIDER_TRANSPORT_FAILED'
    }
  }
  const feature = createFeature(
    vi.fn().mockResolvedValueOnce(question).mockImplementation(continueRequest)
  )
  const controller = createAiConversationController({
    feature,
    getElementType: vi.fn()
  })
  await controller.submit('Draw a detailed tower')
  const failed = await controller.submit('Maximum detail, please')
  await controller.retry(failed.turnId)
  expect(activePurposes).toEqual([
    'Draw a detailed tower',
    'Draw a detailed tower'
  ])
})

it('reads current activity without replaying old progress and preserves point-in-time history', async () => {
  const pending = createDeferred<unknown>()
  let request: Parameters<AiConversationFeature['execute']>[0] | undefined
  const feature = createFeature((value) => {
    request = value
    return pending.promise
  })
  const controller = createAiConversationController({
    feature,
    getElementType: vi.fn()
  })
  const done = controller.submit('Draw the tower')
  let reads = 0
  const first = {
    attempt: 1,
    get phase() {
      reads++
      return 'execution' as const
    },
    message: 'Preparing windows'
  }
  request?.progressObserver(first)
  const snapshot = controller.getSnapshot()
  const id = snapshot.activeTurn?.turnId ?? ''
  reads = 0
  for (let i = 0; i < 300; i++) {
    request?.progressObserver({
      phase: 'execution',
      attempt: 1,
      message: `Preparing part ${i}`
    })
    const activity = controller.getActivity(id, { purpose: 'Draw the tower' })
    expect(activity.current.label).toBeTruthy()
    controller.getSnapshot()
  }
  expect(reads).toBe(0)
  expect(snapshot.activeTurn?.progress).toEqual([first])
  expect(controller.getSnapshot().activeTurn?.progress).toHaveLength(301)
  expect(controller.getActivity(id).entries.length).toBeGreaterThan(0)
  pending.resolve({ status: 'executed', actionResults: [] })
  await done
  expect(
    controller.getActivity(id, { outcome: 'success' }).current.label
  ).toBeTruthy()
  await controller.dispose()
})

describe('semantic settlement across action batches', () => {
  const questionResult = (status = 'no-change') => ({
    actionId: 'question',
    actionName: 'request_clarification',
    result: {
      status,
      clarification: { kind: 'question', question: 'Which color?' }
    }
  })
  it.each(['no-change', 'complete'])(
    'admits an answer after prior %s work without changing its disposition',
    async (status) => {
      const feature = createFeature(
        vi
          .fn()
          .mockResolvedValueOnce({
            status: 'executed',
            actionResults: [
              {
                actionId: 'prior',
                actionName: 'read_design_context',
                result: { status }
              },
              questionResult()
            ]
          })
          .mockResolvedValue({ status: 'executed', actionResults: [] })
      )
      const controller = createAiConversationController({
        feature,
        getElementType: vi.fn()
      })
      const question = await controller.submit('Draw a poster')
      await expect(
        controller.submit({ intent: 'Blue', replyToTurnId: question.turnId })
      ).resolves.toMatchObject({ replyToTurnId: question.turnId })
      expect(question.outcome).toBe(
        status === 'complete' ? 'success' : 'no-change'
      )
    }
  )
  it('rejects contradictory terminal receipts without rewriting execution truth', async () => {
    const feature = createFeature(async () => ({
      status: 'executed',
      actionResults: [questionResult(), questionResult()]
    }))
    const controller = createAiConversationController({
      feature,
      getElementType: vi.fn()
    })
    const settled = await controller.submit('Draw a poster')
    expect(settled).toMatchObject({
      outcome: 'no-change',
      protocolDiagnostic: expect.any(String)
    })
    await expect(
      controller.submit({ intent: 'Blue', replyToTurnId: settled.turnId })
    ).rejects.toThrow('no longer active')
  })
})

describe('authored request context', () => {
  const image = {
    dataUrl: 'data:image/png;base64,YQ==',
    mediaType: 'image/png' as const,
    name: 'reference.png',
    size: 1
  }
  it('serializes every question and answer in order without raw progress', async () => {
    const question = (text: string) =>
      executed(
        {
          status: 'no-change',
          clarification: { kind: 'question', question: text }
        },
        'request_clarification'
      )
    const feature = createFeature(
      vi
        .fn()
        .mockResolvedValueOnce(question('Which size?'))
        .mockResolvedValueOnce(question('Which color?'))
        .mockResolvedValue({ status: 'executed', actionResults: [] })
    )
    const controller = createAiConversationController({
      feature,
      getElementType: vi.fn()
    })
    await controller.submit('Draw a poster')
    await controller.submit('240 by 240')
    await controller.submit('Blue')
    const wire = JSON.parse(
      JSON.stringify(vi.mocked(feature.execute).mock.calls[2][0])
    )
    expect(
      wire.metadata.conversationContext.messages.map(
        (message: { text: string }) => message.text
      )
    ).toEqual([
      'Draw a poster',
      'Which size?',
      '240 by 240',
      'Which color?',
      'Blue'
    ])
    expect(wire.metadata.replyTo).toEqual({
      turnId: expect.stringMatching(/:turn:2$/)
    })
    expect(wire.metadata.replyTo).not.toHaveProperty('intent')
  })
  it('retries the exact request image set without posting it as a new attachment', async () => {
    const feature = createFeature(async () => ({
      status: 'failed',
      stage: 'provider'
    }))
    const controller = createAiConversationController({
      feature,
      getElementType: vi.fn()
    })
    const original = await controller.submit({
      intent: 'Draw this',
      attachments: [image]
    })
    const retry = await controller.retry(original.turnId)
    expect(retry.attachments).toEqual([])
    expect(retry.requestAttachments).toEqual([image])
    const first = vi.mocked(feature.execute).mock.calls[0][0].metadata
    expect(vi.mocked(feature.execute).mock.calls[1][0].metadata).toMatchObject({
      conversationContext: (first as Record<string, unknown>)
        .conversationContext,
      imageAttachments: [image]
    })
  })
})

describe('document-owned drafts and atomic admission', () => {
  it('consumes before notification and retains text written by an admission observer', async () => {
    const controller = createAiConversationController({
      feature: createFeature(async () => ({
        status: 'executed',
        actionResults: []
      })),
      getElementType: vi.fn()
    })
    const drafts = createAiConversationDrafts(controller)
    const id = controller.getSnapshot().conversationId
    drafts.setText(id, 'First')
    const captured = drafts.getSnapshot(id)
    let observed = false
    const unsubscribe = controller.subscribe((snapshot) => {
      if (snapshot.activeTurn && !observed) {
        observed = true
        expect(drafts.getSnapshot(id).text).toBe('')
        drafts.setText(id, 'Next')
      }
    })
    await drafts.submit(id, captured)
    expect(drafts.getSnapshot(id).text).toBe('Next')
    await expect(drafts.submit(id, captured)).rejects.toThrow('changed')
    expect(drafts.getSnapshot(id).text).toBe('Next')
    unsubscribe()
    drafts.dispose()
    await controller.dispose()
  })
  it('retains rejected input and isolates documents', async () => {
    const pending = createDeferred<unknown>()
    const controller = createAiConversationController({
      feature: createFeature(() => pending.promise),
      getElementType: vi.fn()
    })
    const drafts = createAiConversationDrafts(controller)
    const id = controller.getSnapshot().conversationId
    const running = controller.submit('Working')
    drafts.setText(id, 'Keep me')
    await expect(drafts.submit(id, drafts.getSnapshot(id))).rejects.toThrow(
      'active turn'
    )
    expect(drafts.getSnapshot(id).text).toBe('Keep me')
    pending.resolve({ status: 'executed', actionResults: [] })
    await running
    drafts.dispose()
    expect(createAiConversationDrafts(controller).getSnapshot(id).text).toBe('')
    await controller.dispose()
  })
})

it('orders concurrent draft reads and retires callbacks on cancellation and disposal', async () => {
  const readers: FileReader[] = []
  const spy = vi
    .spyOn(FileReader.prototype, 'readAsDataURL')
    .mockImplementation(function (this: FileReader) {
      readers.push(this)
    })
  const controller = createAiConversationController({
    feature: createFeature(async () => ({
      status: 'executed',
      actionResults: []
    })),
    getElementType: vi.fn()
  })
  const drafts = createAiConversationDrafts(controller)
  const id = controller.getSnapshot().conversationId
  const file = (name: string) => new File(['a'], name, { type: 'image/png' })
  const finish = (reader: FileReader) => {
    Object.defineProperty(reader, 'result', {
      value: 'data:image/png;base64,YQ=='
    })
    reader.onload?.call(
      reader,
      new ProgressEvent('load') as ProgressEvent<FileReader>
    )
  }
  try {
    const reading = drafts.addFiles(id, [file('first'), file('second')])
    drafts.setText(id, 'Text while reading')
    finish(readers[1])
    await Promise.resolve()
    finish(readers[0])
    await reading
    expect(
      drafts.getSnapshot(id).attachments.map((image) => image.name)
    ).toEqual(['first', 'second'])
    expect(drafts.getSnapshot(id).text).toBe('Text while reading')
    const cancelled = drafts.addFiles(id, [file('cancelled')])
    drafts.cancelReads(id)
    await cancelled
    expect(readers[2].onload).toBeNull()
    expect(drafts.getSnapshot(id).pendingReads).toBe(0)
    const disposed = drafts.addFiles(id, [file('disposed')])
    drafts.dispose()
    drafts.dispose()
    await disposed
    expect(readers[3].onload).toBeNull()
    expect(drafts.getSnapshot(id).attachments).toEqual([])
  } finally {
    spy.mockRestore()
    drafts.dispose()
    await controller.dispose()
  }
})

it.each([
  { status: 'cancelled' },
  {
    status: 'cancelled',
    reason: 'aborted',
    audit: { actions: [], outcome: 'cancelled' }
  },
  ...['committed', 'rolled-back', 'unknown'].map((status) => ({
    status: 'cancelled',
    reason: 'aborted',
    audit: { actions: [], outcome: 'cancelled', retryCount: 0 },
    transaction: { status }
  }))
])(
  'never replays cancellation with incomplete or post-execution evidence %j',
  async (result) => {
    const feature = createFeature(async () => result)
    const controller = createAiConversationController({
      feature,
      getElementType: vi.fn()
    })
    const turn = await controller.submit('Draw')
    await expect(controller.retry(turn.turnId)).rejects.toThrow(
      'Review the canvas'
    )
    expect(feature.execute).toHaveBeenCalledTimes(1)
  }
)

it('does not reopen a late question after cancellation and drains every disposal waiter', async () => {
  const pending = createDeferred<unknown>()
  const controller = createAiConversationController({
    feature: createFeature(() => pending.promise),
    getElementType: vi.fn()
  })
  const running = controller.submit('Draw')
  controller.cancel()
  pending.resolve(
    executed(
      {
        status: 'no-change',
        clarification: { kind: 'question', question: 'Late question?' }
      },
      'request_clarification'
    )
  )
  const turn = await running
  expect(turn.outcome).toBe('cancelled')
  expect(turn.question).toBeNull()
  await expect(
    controller.submit({ intent: 'Blue', replyToTurnId: turn.turnId })
  ).rejects.toThrow('no longer active')
  await controller.dispose()
})

it('waits for the same active task on repeated disposal', async () => {
  const pending = createDeferred<unknown>()
  const controller = createAiConversationController({
    feature: createFeature(() => pending.promise),
    getElementType: vi.fn()
  })
  const running = controller.submit('Draw')
  const first = controller.dispose()
  let finished = false
  const second = controller.dispose().then(() => {
    finished = true
  })
  await Promise.resolve()
  await Promise.resolve()
  expect(finished).toBe(false)
  pending.resolve({ status: 'cancelled', reason: 'aborted' })
  await Promise.all([first, second, running])
  expect(finished).toBe(true)
})

it('does not choose between contradictory authored terminal replies', async () => {
  const controller = createAiConversationController({
    feature: createFeature(async () => ({
      status: 'executed',
      actionResults: ['First claim', 'Conflicting claim'].map(
        (message, index) => ({
          actionId: `report-${index}`,
          actionName: 'report_outcome',
          result: { status: 'no-change', outcome: 'completed', message }
        })
      )
    })),
    getElementType: vi.fn()
  })
  const turn = await controller.submit('Give advice')
  expect(turn.outcome).toBe('no-change')
  expect(turn.protocolDiagnostic).toEqual(expect.any(String))
  expect(turn.authoredReply).toBeNull()
  expect(turn.question).toBeNull()
  await controller.dispose()
})

it('preserves request image replacement and excludes other conversation history', async () => {
  const question = executed(
    {
      status: 'no-change',
      clarification: { kind: 'question', question: 'Which image?' }
    },
    'request_clarification'
  )
  const feature = createFeature(
    vi
      .fn()
      .mockResolvedValueOnce(question)
      .mockResolvedValueOnce({ status: 'failed', stage: 'provider' })
      .mockResolvedValue({ status: 'executed', actionResults: [] })
  )
  const controller = createAiConversationController({
    feature,
    getElementType: vi.fn()
  })
  const image = (name: string) => ({
    name,
    dataUrl: 'data:image/png;base64,YQ==',
    mediaType: 'image/png' as const,
    size: 1
  })
  const a = image('A')
  const b = image('B')
  await controller.submit({ intent: 'Use A', attachments: [a] })
  const failed = await controller.submit({
    intent: 'Replace with B',
    attachments: [b]
  })
  const retried = await controller.retry(failed.turnId)
  expect(retried.requestAttachments).toEqual([b])
  expect(retried.attachments).toEqual([])
  const request = vi.mocked(feature.execute).mock.calls[2][0]
  expect(request.metadata).toMatchObject({
    imageAttachments: [b],
    conversationContext: {
      messages: [
        expect.objectContaining({
          attachments: [{ name: 'A', mediaType: 'image/png', available: false }]
        }),
        expect.any(Object),
        expect.objectContaining({
          attachments: [
            { name: 'B', mediaType: 'image/png', available: true, index: 0 }
          ]
        })
      ]
    }
  })
  controller.newConversation()
  await controller.submit('Independent request')
  const independent = vi.mocked(feature.execute).mock.calls[3][0].metadata
  expect(independent).toMatchObject({
    conversationContext: {
      messages: [expect.objectContaining({ text: 'Independent request' })]
    }
  })
  expect(independent).not.toHaveProperty('imageAttachments')
  await controller.dispose()
})

it('publishes pending image ownership before observers can submit the draft', async () => {
  const readers: FileReader[] = []
  const read = vi
    .spyOn(FileReader.prototype, 'readAsDataURL')
    .mockImplementation(function (this: FileReader) {
      readers.push(this)
    })
  const feature = createFeature(async () => ({
    status: 'executed',
    actionResults: []
  }))
  const conversation = createAiConversationController({
    feature,
    getElementType: vi.fn()
  })
  const drafts = createAiConversationDrafts(conversation)
  const id = conversation.getSnapshot().conversationId
  drafts.setText(id, 'Use this image')
  let attempted = false
  let submission: Promise<unknown> | undefined
  const detach = drafts.subscribe(id, () => {
    if (attempted) return
    attempted = true
    submission = drafts
      .submit(id, drafts.getSnapshot(id))
      .catch((error) => error)
  })
  try {
    const reading = drafts.addFiles(id, [
      new File(['a'], 'reference.png', { type: 'image/png' })
    ])
    expect(await submission).toBeInstanceOf(Error)
    expect(feature.execute).not.toHaveBeenCalled()
    expect(drafts.getSnapshot(id)).toMatchObject({
      text: 'Use this image',
      pendingReads: 1
    })
    drafts.cancelReads(id)
    await reading
    expect(readers[0].onload).toBeNull()
  } finally {
    detach()
    drafts.dispose()
    await conversation.dispose()
    read.mockRestore()
  }
})

it.each(['cancel', 'dispose'] as const)(
  'retires registered image operations when an observer requests %s',
  async (action) => {
    const read = vi.spyOn(FileReader.prototype, 'readAsDataURL')
    const conversation = createAiConversationController({
      feature: createFeature(async () => ({})),
      getElementType: vi.fn()
    })
    const drafts = createAiConversationDrafts(conversation)
    const id = conversation.getSnapshot().conversationId
    let observed = false
    const detach = drafts.subscribe(id, () => {
      if (observed) return
      observed = true
      if (action === 'cancel') drafts.cancelReads(id)
      else drafts.dispose()
    })
    try {
      await drafts.addFiles(id, [
        new File(['a'], 'reference.png', { type: 'image/png' })
      ])
      expect(read).not.toHaveBeenCalled()
      expect(drafts.getSnapshot(id)).toMatchObject({
        pendingReads: 0,
        attachments: []
      })
    } finally {
      detach()
      drafts.dispose()
      await conversation.dispose()
      read.mockRestore()
    }
  }
)

it.each(['admission', 'progress'] as const)(
  'drains the whole invocation when disposed from its first %s notification',
  async (phase) => {
    const events: string[] = []
    const pending = createDeferred<unknown>()
    const feature = createFeature((input) => {
      input.progressObserver?.({
        phase: 'provider',
        attempt: 1,
        summary: 'Requesting actions'
      })
      return pending.promise
    })
    const controller = createAiConversationController({
      feature,
      getElementType: vi.fn(),
      history: {
        beginTurn: () => events.push('begin'),
        endTurn: () => events.push('end')
      }
    })
    let disposal: Promise<void> | undefined
    controller.subscribe((snapshot) => {
      if (
        disposal ||
        !snapshot.activeTurn ||
        (phase === 'progress' && !snapshot.activeTurn.progress.length)
      )
        return
      disposal = controller.dispose().then(() => {
        events.push('disposed')
      })
    })
    const running = controller.submit('Draw')
    try {
      if (phase === 'progress') {
        await Promise.resolve()
        await Promise.resolve()
        expect(events).not.toContain('disposed')
      }
    } finally {
      pending.resolve({ status: 'cancelled', reason: 'aborted' })
      await Promise.all([running, disposal])
    }
    expect(events).toEqual(['begin', 'end', 'disposed'])
    if (phase === 'admission') expect(feature.execute).not.toHaveBeenCalled()
    expect(controller.getSnapshot()).toMatchObject({
      disposed: true,
      activeTurn: null,
      settledTurns: []
    })
  }
)

it('releases active projection state and attachments when the document is disposed', async () => {
  const pending = createDeferred<unknown>()
  const controller = createAiConversationController({
    feature: createFeature(() => pending.promise),
    getElementType: vi.fn()
  })
  const running = controller.submit({
    intent: 'Draw from this',
    attachments: [
      {
        name: 'reference.png',
        mediaType: 'image/png',
        size: 1,
        dataUrl: 'data:image/png;base64,YQ=='
      }
    ]
  })
  const active = controller.getSnapshot().activeTurn
  if (!active) throw new Error('Expected an admitted turn before disposal')
  const turnId = active.turnId
  const disposal = controller.dispose()
  try {
    expect(controller.presentation.getIds()).toEqual([])
    expect(controller.presentation.getTurn(turnId)).toBeUndefined()
    expect(controller.presentation.getControls().activeTurn).toBeNull()
  } finally {
    pending.resolve({ status: 'cancelled', reason: 'aborted' })
    await Promise.all([running, disposal])
  }
})
