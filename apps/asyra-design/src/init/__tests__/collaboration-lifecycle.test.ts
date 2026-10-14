import * as documentPreparation from '../../collaboration/document-publication'
import { prepareDocumentPublication } from '../../collaboration/document-publication'
import 'fake-indexeddb/auto'
import { Buffer } from 'node:buffer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as collaborationModule from '@asyra/collaboration'
import { ProviderFailure } from '@asyra/collaboration'
import factory, {
  Factory,
  LocalSharedDataChannel,
  type SharedPublication
} from '@asyra/factory'
import { EventTypes, TransactionEventTypes } from '@asyra/reactive-events'
import {
  IDTypes,
  PROPS_ACTIONS,
  SharedDataChannelNames,
  idCounter
} from '@asyra/utils'
import * as collaborationOperations from '../../collaboration/publication-processor'
import { createFormalInitialDocument } from '../../collaboration/initial-document'
import {
  DocumentPublicationOutbox,
  IndexedDbPublicationOutboxStorage
} from '../../collaboration/publication-outbox'
import { CollaborationWebSocketProvider } from '../../collaboration/websocket-provider'
import {
  CollaborationMessageTypes,
  encodePublicationMessageFrames
} from '../../collaboration/protocol'
import {
  INITIAL_COLLABORATION_CONNECTION_STATE,
  createRemotePublicationHandler,
  createCollaborationDocumentSession,
  disposeCollaboration,
  getActiveCollaborationHandle,
  prepareCollaborationDocumentSession,
  resetCollaborationDocument,
  resolveCollaborationConnectionTransition,
  startCollaboration
} from '../../collaboration/lifecycle'
import core from '../../contexts'

const collaborationModuleState = vi.hoisted(() => ({
  actualCreateCollaboration:
    undefined as unknown as typeof collaborationModule.createCollaboration,
  createCollaboration:
    undefined as unknown as typeof collaborationModule.createCollaboration
}))

vi.mock('@asyra/collaboration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@asyra/collaboration')>()
  collaborationModuleState.actualCreateCollaboration =
    actual.createCollaboration
  collaborationModuleState.createCollaboration = actual.createCollaboration
  return {
    ...actual,
    createCollaboration: (
      ...args: Parameters<typeof actual.createCollaboration>
    ) => collaborationModuleState.createCollaboration(...args)
  }
})

const EMPTY_DOCUMENT = {
  version: '1.0.0',
  sceneTree: {
    workspace: '',
    workspaceList: [],
    elements: {}
  },
  props: {}
} as const

const createDeferred = <Value>() => {
  let resolve!: (value: Value | PromiseLike<Value>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<Value>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, reject, resolve }
}

const freezePublication = (
  publication: SharedPublication
): SharedPublication => {
  const freezeValue = (value: unknown): void => {
    if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
      return
    }
    Object.values(value).forEach(freezeValue)
    Object.freeze(value)
  }
  freezeValue(publication)
  return publication
}

const factoryPublication = (publicationId: string): SharedPublication => {
  const artifactId = `artifact-${publicationId}`
  const batchId = `batch-${publicationId}`
  const deliveryId = `delivery-${publicationId}`
  const payload = {
    action: PROPS_ACTIONS.UPDATE_PROPERTY,
    eventName: EventTypes.UPDATE_PROPERTY,
    id: `position-${publicationId}`,
    key: 'x',
    before: 0,
    after: 10
  }
  const delivery = {
    deliveryId,
    eventName: EventTypes.UPDATE_PROPERTY,
    orderedIds: [`position-${publicationId}`],
    payload
  }
  return freezePublication({
    publicationId,
    artifactId,
    transactionId: 1,
    origin: 'action',
    mode: 'atomic',
    slices: [
      {
        sliceId: batchId,
        orderedIds: [deliveryId],
        batches: [
          {
            batchId,
            channel: SharedDataChannelNames.PROPS,
            deliveries: [delivery]
          }
        ]
      }
    ]
  })
}

const remotePublication = (publicationId: string): SharedPublication =>
  prepareDocumentPublication(factoryPublication(publicationId))

const bootstrapTailItem = (
  sequence: number,
  publication: SharedPublication,
  fromActorId: string
) => ({
  sequence,
  publicationId: publication.publicationId,
  encodedPublicationFrames: encodePublicationMessageFrames({
    type: CollaborationMessageTypes.PUBLICATION,
    publication,
    fromActorId,
    sequence
  }).map((frame) => Buffer.from(frame).toString('base64')),
  fromActorId
})

const harness = {
  collaboration: {
    identity: {
      documentId: 'file-lifecycle',
      roomId: 'file-lifecycle',
      actorId: 'actor-lifecycle'
    },
    provider: {
      getStatus: vi.fn(() => 'idle'),
      onStatusChange: vi.fn(
        (_subscriber: (status: collaborationModule.ProviderStatus) => void) =>
          vi.fn()
      )
    },
    updateAwareness: vi.fn(),
    observePublicationOutcomes: vi.fn(
      (
        _subscriber: (
          outcome: collaborationModule.CollaborationPublicationOutcome
        ) => void
      ) => vi.fn()
    ),
    start: vi.fn(async () => undefined),
    disconnect: vi.fn(async () => undefined),
    reconnect: vi.fn(async () => undefined),
    whenIdle: vi.fn(async () => undefined),
    dispose: vi.fn(async () => undefined)
  }
}

beforeEach(async () => {
  await disposeCollaboration()
  vi.restoreAllMocks()
  collaborationModuleState.createCollaboration =
    collaborationModuleState.actualCreateCollaboration
  idCounter.clear()
  vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'openDocumentSession'
  ).mockResolvedValue({
    checkpoint: EMPTY_DOCUMENT,
    durableSequence: 0,
    headSequence: 0,
    pendingTail: []
  })
  vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'completeDocumentBootstrap'
  ).mockResolvedValue(undefined)
  vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'resetDocument'
  ).mockResolvedValue(undefined)
  harness.collaboration.updateAwareness.mockReset()
  harness.collaboration.observePublicationOutcomes
    .mockReset()
    .mockReturnValue(vi.fn())
  harness.collaboration.provider.onStatusChange
    .mockReset()
    .mockReturnValue(vi.fn())
  harness.collaboration.start.mockReset().mockResolvedValue(undefined)
  harness.collaboration.dispose.mockReset().mockResolvedValue(undefined)
})

afterEach(async () => {
  await disposeCollaboration()
  vi.useRealTimers()
  idCounter.clear()
  vi.restoreAllMocks()
})

it('starts at none and suppresses only the none-to-connected transition', () => {
  expect(INITIAL_COLLABORATION_CONNECTION_STATE).toBe('none')
  expect(resolveCollaborationConnectionTransition('none', 'connected')).toEqual(
    {
      changed: true,
      connection: 'connected',
      notificationType: undefined
    }
  )
  expect(
    resolveCollaborationConnectionTransition('none', 'disconnected')
  ).toEqual({
    changed: true,
    connection: 'disconnected',
    notificationType: 'disconnected'
  })
  expect(
    resolveCollaborationConnectionTransition('connected', 'disconnected')
  ).toEqual({
    changed: true,
    connection: 'disconnected',
    notificationType: 'disconnected'
  })
  expect(
    resolveCollaborationConnectionTransition('disconnected', 'connected')
  ).toEqual({
    changed: true,
    connection: 'connected',
    notificationType: 'reconnected'
  })
  expect(
    resolveCollaborationConnectionTransition('connected', 'connected')
  ).toEqual({
    changed: false,
    connection: 'connected',
    notificationType: undefined
  })
  expect(() =>
    resolveCollaborationConnectionTransition('connected', 'none' as never)
  ).toThrow('Collaboration connection state cannot return to none')
})

it('does not publish a new session state when the connection state is unchanged', async () => {
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-connection-state-deduplication',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  const publishedStates: unknown[] = []
  const unsubscribe = handle.onSessionStateChange((state) => {
    publishedStates.push(state)
  })

  await handle.disconnect()
  expect(publishedStates).toHaveLength(1)

  await handle.disconnect()
  expect(publishedStates).toHaveLength(1)

  unsubscribe()
})

it('runs the server Reset barrier before disposing the active file session and clearing recovery', async () => {
  const clear = vi
    .spyOn(DocumentPublicationOutbox.prototype, 'clear')
    .mockResolvedValue(undefined)
  const resetDocument = vi.mocked(
    CollaborationWebSocketProvider.prototype.resetDocument
  )
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-reset-recovery',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  await prepared.activate()

  await resetCollaborationDocument('file-reset-recovery')

  expect(resetDocument).toHaveBeenCalledOnce()
  expect(clear).toHaveBeenCalledOnce()
  expect(getActiveCollaborationHandle()).toBeUndefined()
})

it('clears reset-invalidated recovery before it can enter the new document generation', async () => {
  const fileId = 'file-reset-generation-recovery'
  const legacyOutbox = new DocumentPublicationOutbox({ fileId })
  await legacyOutbox.initialize()
  await legacyOutbox.bindDocumentGeneration(0)
  await legacyOutbox.append(remotePublication('publication-before-reset'))
  vi.mocked(
    CollaborationWebSocketProvider.prototype.openDocumentSession
  ).mockResolvedValue({
    checkpoint: EMPTY_DOCUMENT,
    documentGeneration: 1,
    durableSequence: 0,
    headSequence: 0,
    pendingTail: []
  })
  const sendPublication = vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'sendPublicationWithAcceptance'
  )
  const applyCanonicalChanges = vi.spyOn(core, 'applyCanonicalChanges')

  const prepared = await prepareCollaborationDocumentSession({
    fileId,
    actorId: 'actor-after-reset',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  await handle.whenIdle()

  expect(sendPublication).not.toHaveBeenCalled()
  expect(applyCanonicalChanges).not.toHaveBeenCalled()
  expect(handle.getSessionState()).toEqual({
    connection: 'connected',
    sync: 'synced',
    pendingCount: 0,
    disconnectedEpoch: 0
  })
})

it('rejects the consumer promise for a policy-rejected publication outcome', async () => {
  const processRemotePublication = createRemotePublicationHandler(() => false)

  await expect(
    processRemotePublication(remotePublication('policy-rejected'))
  ).rejects.toThrow(
    '[collaboration] remote publication policy-rejected was rejected'
  )
})

it('settles each remote publication projection before releasing the handler', async () => {
  const remoteApplication = createDeferred<undefined>()
  const projectionSettlement = createDeferred<undefined>()
  const order: string[] = []
  const processRemotePublication = (
    createRemotePublicationHandler as unknown as (
      applyRemotePublication: (
        publication: SharedPublication
      ) => boolean | Promise<boolean>,
      settleProjection: () => Promise<void>
    ) => (publication: SharedPublication) => Promise<void>
  )(
    async () => {
      order.push('canonical-apply-start')
      await remoteApplication.promise
      order.push('canonical-apply-complete')
      return true
    },
    async () => {
      order.push('projection-start')
      await projectionSettlement.promise
      order.push('projection-settled')
    }
  )

  let handlerSettled = false
  const handling = processRemotePublication(
    remotePublication('projection-settlement')
  ).then(() => {
    handlerSettled = true
  })
  await Promise.resolve()

  expect(order).toEqual(['canonical-apply-start'])
  expect(handlerSettled).toBe(false)

  remoteApplication.resolve(undefined)
  await Promise.resolve()
  await Promise.resolve()

  expect(order).toEqual([
    'canonical-apply-start',
    'canonical-apply-complete',
    'projection-start'
  ])
  expect(handlerSettled).toBe(false)

  projectionSettlement.resolve(undefined)
  await handling

  expect(order).toEqual([
    'canonical-apply-start',
    'canonical-apply-complete',
    'projection-start',
    'projection-settled'
  ])
  expect(handlerSettled).toBe(true)
})

it('opens the socket bootstrap before activation and applies its tail before live delivery starts', async () => {
  const order: string[] = []
  const publication = remotePublication('bootstrap-tail')
  vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'openDocumentSession'
  ).mockImplementation(async () => {
    order.push('open-session')
    return {
      checkpoint: EMPTY_DOCUMENT,
      durableSequence: 0,
      headSequence: 1,
      pendingTail: [bootstrapTailItem(1, publication, 'actor-peer')]
    }
  })
  vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'completeDocumentBootstrap'
  ).mockImplementation(async () => {
    order.push('bootstrap-consumed')
  })
  vi.spyOn(core, 'applyCanonicalChanges').mockImplementation(() => {
    order.push('core-apply')
  })
  vi.spyOn(factory, 'runRemoteTransaction').mockImplementation((mutate) => {
    order.push('remote-transaction')
    return mutate()
  })

  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-lifecycle',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })

  expect(prepared.bootstrap.checkpoint).toEqual(EMPTY_DOCUMENT)
  expect(order).toEqual(['open-session'])
  expect(getActiveCollaborationHandle()).toBeUndefined()

  await prepared.activate()

  expect(order).toEqual([
    'open-session',
    'remote-transaction',
    'core-apply',
    'open-session',
    'bootstrap-consumed'
  ])
  expect(getActiveCollaborationHandle()).toBeDefined()
})

it('reopens the socket bootstrap and hydrates checkpoint plus tail before reconnect becomes live', async () => {
  const order: string[] = []
  const reconnectDocument = {
    ...EMPTY_DOCUMENT,
    sceneTree: {
      ...EMPTY_DOCUMENT.sceneTree,
      workspace: 'workspace-reconnect',
      workspaceList: ['workspace-reconnect']
    }
  }
  vi.mocked(CollaborationWebSocketProvider.prototype.openDocumentSession)
    .mockResolvedValueOnce({
      checkpoint: EMPTY_DOCUMENT,
      durableSequence: 0,
      headSequence: 0,
      pendingTail: []
    })
    .mockImplementationOnce(async () => {
      order.push('reconnect-open')
      return {
        checkpoint: reconnectDocument,
        durableSequence: 0,
        headSequence: 1,
        pendingTail: [
          bootstrapTailItem(
            1,
            remotePublication('reconnect-tail'),
            'actor-peer'
          )
        ]
      }
    })
    .mockImplementationOnce(async () => {
      order.push('reconnect-open')
      return {
        checkpoint: reconnectDocument,
        durableSequence: 0,
        headSequence: 1,
        pendingTail: [
          bootstrapTailItem(
            1,
            remotePublication('reconnect-tail'),
            'actor-peer'
          )
        ]
      }
    })
  vi.mocked(
    CollaborationWebSocketProvider.prototype.completeDocumentBootstrap
  ).mockImplementation(async () => {
    order.push('bootstrap-consumed')
  })
  vi.spyOn(core, 'load').mockImplementation((document) => {
    expect(document).toEqual(reconnectDocument)
    order.push('core-load')
  })
  vi.spyOn(core, 'applyCanonicalChanges').mockImplementation(() => {
    order.push('core-apply')
  })
  vi.spyOn(factory, 'runRemoteTransaction').mockImplementation((mutate) => {
    order.push('remote-transaction')
    return mutate()
  })

  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-lifecycle',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  order.length = 0

  await handle.reconnect()

  expect(order).toEqual([
    'reconnect-open',
    'core-load',
    'remote-transaction',
    'core-apply',
    'bootstrap-consumed'
  ])
  expect(handle.getSessionState()).toEqual(
    expect.objectContaining({
      connection: 'connected',
      sync: 'synced'
    })
  )
})

it('keeps a provisional local session active and retries an unavailable socket at one non-overlapping 30-second cadence', async () => {
  const consoleError = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined)
  const retry =
    createDeferred<
      Awaited<ReturnType<CollaborationWebSocketProvider['openDocumentSession']>>
    >()
  vi.mocked(CollaborationWebSocketProvider.prototype.openDocumentSession)
    .mockRejectedValueOnce(
      new ProviderFailure('connection-failed', 'socket server unavailable')
    )
    .mockImplementationOnce(() => retry.promise)
  const load = vi.spyOn(core, 'load').mockImplementation(() => undefined)

  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-offline-retry',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  vi.useFakeTimers()
  const handle = await prepared.activate()

  expect(prepared.bootstrap).toEqual({
    checkpoint: createFormalInitialDocument(),
    documentGeneration: 0,
    durableSequence: 0,
    headSequence: 0,
    pendingTail: []
  })
  expect(handle.getSessionState()).toEqual(
    expect.objectContaining({
      connection: 'disconnected',
      pendingCount: 0,
      sync: 'synced',
      notification: expect.objectContaining({
        type: 'disconnected'
      })
    })
  )
  expect(
    CollaborationWebSocketProvider.prototype.openDocumentSession
  ).toHaveBeenCalledTimes(1)

  vi.advanceTimersByTime(29_999)
  expect(
    CollaborationWebSocketProvider.prototype.openDocumentSession
  ).toHaveBeenCalledTimes(1)

  await vi.advanceTimersByTimeAsync(1)
  expect(
    CollaborationWebSocketProvider.prototype.openDocumentSession
  ).toHaveBeenCalledTimes(2)

  vi.advanceTimersByTime(60_000)
  expect(
    CollaborationWebSocketProvider.prototype.openDocumentSession
  ).toHaveBeenCalledTimes(2)

  vi.useRealTimers()
  retry.resolve({
    checkpoint: EMPTY_DOCUMENT,
    durableSequence: 0,
    headSequence: 0,
    pendingTail: []
  })
  await Promise.race([
    handle.whenIdle(),
    new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `idle stalled at ${JSON.stringify(handle.getSessionState())}`
            )
          ),
        1_000
      )
    })
  ])

  expect(load).toHaveBeenCalledWith(EMPTY_DOCUMENT)
  expect(handle.getSessionState()).toEqual(
    expect.objectContaining({
      connection: 'connected',
      pendingCount: 0,
      sync: 'synced',
      notification: expect.objectContaining({
        type: 'reconnected'
      })
    })
  )
  expect(consoleError).toHaveBeenCalledWith(
    '[collaboration] initial document session failed:',
    expect.objectContaining({ code: 'connection-failed' })
  )
})

it('retains disconnected Factory publications and removes them after reconnect source acceptance', async () => {
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  const sendPublication = vi
    .spyOn(
      CollaborationWebSocketProvider.prototype,
      'sendPublicationWithAcceptance'
    )
    .mockImplementation(async (publication, consumeAcceptedSource) => {
      await consumeAcceptedSource(publication)
      return {
        publicationId: publication.publicationId,
        sequence: 1
      }
    })
  vi.spyOn(core, 'applyCanonicalChanges').mockImplementation(() => undefined)
  vi.spyOn(factory, 'runRemoteTransaction').mockImplementation((mutate) =>
    mutate()
  )
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-offline-publication',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  await handle.disconnect()

  publish?.(factoryPublication('offline-local'))
  await handle.whenIdle()

  expect(sendPublication).not.toHaveBeenCalled()
  expect(handle.getSessionState()).toEqual(
    expect.objectContaining({
      connection: 'disconnected',
      pendingCount: 1,
      sync: 'pending'
    })
  )

  await Promise.race([
    handle.reconnect(),
    new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `reconnect stalled at ${JSON.stringify(handle.getSessionState())}`
            )
          ),
        1_000
      )
    })
  ])
  await handle.whenIdle()

  expect(sendPublication).toHaveBeenCalledWith(
    expect.objectContaining({ publicationId: 'offline-local' }),
    expect.any(Function)
  )
  expect(core.applyCanonicalChanges).toHaveBeenCalledOnce()
  expect(handle.getSessionState()).toEqual(
    expect.objectContaining({
      connection: 'connected',
      pendingCount: 0,
      sync: 'synced'
    })
  )
})

it('includes a queued local publication in the reconnect recovery cutoff before replacing Core state', async () => {
  const reconnectBootstrap =
    createDeferred<
      Awaited<ReturnType<CollaborationWebSocketProvider['openDocumentSession']>>
    >()
  vi.mocked(CollaborationWebSocketProvider.prototype.openDocumentSession)
    .mockResolvedValueOnce({
      checkpoint: EMPTY_DOCUMENT,
      durableSequence: 0,
      headSequence: 0,
      pendingTail: []
    })
    .mockResolvedValueOnce({
      checkpoint: EMPTY_DOCUMENT,
      durableSequence: 0,
      headSequence: 0,
      pendingTail: []
    })
    .mockImplementationOnce(() => reconnectBootstrap.promise)
    .mockResolvedValue({
      checkpoint: EMPTY_DOCUMENT,
      durableSequence: 0,
      headSequence: 0,
      pendingTail: []
    })
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'sendPublicationWithAcceptance'
  ).mockImplementation(async (publication, consumeAcceptedSource) => {
    await consumeAcceptedSource(publication)
    return {
      publicationId: publication.publicationId,
      sequence: 1
    }
  })
  const applyCanonicalChanges = vi
    .spyOn(core, 'applyCanonicalChanges')
    .mockImplementation(() => undefined)
  vi.spyOn(factory, 'runRemoteTransaction').mockImplementation((mutate) =>
    mutate()
  )
  vi.spyOn(core, 'load').mockImplementation(() => undefined)

  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-reconnect-cutoff',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  await handle.disconnect()

  const reconnecting = handle.reconnect()
  publish?.(factoryPublication('queued-before-reconnect'))
  reconnectBootstrap.resolve({
    checkpoint: EMPTY_DOCUMENT,
    durableSequence: 0,
    headSequence: 0,
    pendingTail: []
  })
  await reconnecting
  await handle.whenIdle()

  expect(applyCanonicalChanges).toHaveBeenCalledOnce()
  expect(handle.getSessionState()).toEqual(
    expect.objectContaining({
      connection: 'connected',
      pendingCount: 0,
      sync: 'synced'
    })
  )
})

it('disposes the previous composition before a reconnect replacement becomes live', async () => {
  const order: string[] = []
  const firstComposition = {
    ...harness.collaboration,
    start: vi.fn(async () => {
      order.push('first-start')
    }),
    disconnect: vi.fn(async () => {
      order.push('first-disconnect')
    }),
    dispose: vi.fn(async () => {
      order.push('first-dispose')
    })
  }
  const secondComposition = {
    ...harness.collaboration,
    start: vi.fn(async () => {
      order.push('second-start')
    }),
    disconnect: vi.fn(async () => undefined),
    dispose: vi.fn(async () => undefined)
  }
  collaborationModuleState.createCollaboration = vi
    .fn()
    .mockReturnValueOnce(firstComposition as never)
    .mockReturnValueOnce(secondComposition as never)

  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-reconnect-disposal',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  await handle.disconnect()
  await handle.reconnect()

  expect(order).toEqual([
    'first-start',
    'first-disconnect',
    'first-dispose',
    'second-start'
  ])
})

it('retains an acknowledgement-rejected publication as an explicit conflict', async () => {
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'sendPublicationWithAcceptance'
  ).mockRejectedValue(
    new ProviderFailure(
      'acknowledgement-failed',
      '[collaboration] parent element no longer exists',
      undefined,
      'conflicted-local'
    )
  )
  const consoleError = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined)
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-conflicted-publication',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()

  publish?.(factoryPublication('conflicted-local'))
  await handle.whenIdle()

  expect(handle.getSessionState()).toEqual(
    expect.objectContaining({
      connection: 'disconnected',
      recoveryAvailable: true,
      pendingCount: 1,
      sync: 'conflicted'
    })
  )
  expect(handle.getSessionState().notification).toEqual(
    expect.objectContaining({ type: 'conflicted' })
  )
  expect(consoleError).toHaveBeenCalledWith(
    '[collaboration] publication conflicted-local was rejected:',
    expect.objectContaining({ code: 'acknowledgement-failed' })
  )
})

it('starts the real app collaboration composition without an Awareness preview route', async () => {
  const createCollaboration = vi
    .fn()
    .mockReturnValue(harness.collaboration as never)
  collaborationModuleState.createCollaboration = createCollaboration

  await startCollaboration({
    fileId: 'file-lifecycle',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })

  expect(createCollaboration).toHaveBeenCalledOnce()
  const composition = createCollaboration.mock.calls[0][0]
  expect(composition.provider).toBeInstanceOf(CollaborationWebSocketProvider)
  expect(composition.provider?.identity).toEqual({
    documentId: 'file-lifecycle',
    roomId: 'file-lifecycle',
    actorId: 'actor-lifecycle',
    connectionMetadata: { fileId: 'file-lifecycle' }
  })
  expect(composition.processRemotePublication).toEqual(expect.any(Function))
  expect('operationDefinitions' in composition).toBe(false)
  expect('permissionPolicy' in composition).toBe(false)
  expect('conflictPolicies' in composition).toBe(false)
  expect(idCounter.current(IDTypes.ELEMENT)).toBe('el-actor-lifecycle-0')
  expect(harness.collaboration.updateAwareness).not.toHaveBeenCalled()
  expect(getActiveCollaborationHandle()).toBeDefined()
})

it('binds source-sliced remote canonical requests to one Factory coordinator', async () => {
  const createPublicationProcessor = vi.spyOn(
    collaborationOperations,
    'createPublicationProcessor'
  )
  collaborationModuleState.createCollaboration = vi.fn(
    () => harness.collaboration as never
  )

  await startCollaboration({
    fileId: 'file-lifecycle',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })

  expect(createPublicationProcessor).toHaveBeenCalledOnce()
  const options = createPublicationProcessor.mock.calls[0]?.[0]
  expect(options).toEqual({
    decideRemotePublication: expect.any(Function),
    applyRemoteCanonicalChangeSlices: expect.any(Function)
  })
  expect(options).not.toHaveProperty('applyRemoteEvent')
  expect(options).not.toHaveProperty('owners')
})

it('exposes remote publication outcomes through the local collaboration handle', async () => {
  collaborationModuleState.createCollaboration = vi.fn(
    () => harness.collaboration as never
  )
  const handle = await startCollaboration({
    fileId: 'file-lifecycle',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const subscriber = vi.fn()

  const unsubscribe = (
    handle as typeof handle & {
      observePublicationOutcomes(callback: typeof subscriber): () => void
    }
  ).observePublicationOutcomes(subscriber)

  expect(harness.collaboration.observePublicationOutcomes).toHaveBeenCalledWith(
    expect.any(Function)
  )
  const forwardOutcome =
    harness.collaboration.observePublicationOutcomes.mock.calls[0]?.[0]
  forwardOutcome?.({
    direction: 'remote',
    status: 'processed',
    publicationId: 'forwarded-outcome'
  })
  expect(subscriber).toHaveBeenCalledWith({
    direction: 'remote',
    status: 'processed',
    publicationId: 'forwarded-outcome'
  })
  expect(unsubscribe).toEqual(expect.any(Function))
})

it('exposes provider status through the local collaboration handle', async () => {
  const onStatusChange = vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'onStatusChange'
  )
  collaborationModuleState.createCollaboration = vi.fn(
    () => harness.collaboration as never
  )
  const handle = await startCollaboration({
    fileId: 'file-lifecycle',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const subscriber = vi.fn()

  const unsubscribe = handle.onStatusChange(subscriber)

  expect(onStatusChange).toHaveBeenCalledWith(expect.any(Function))
  const forwardStatus = onStatusChange.mock.calls[0]?.[0]
  forwardStatus?.('failed')
  expect(subscriber).toHaveBeenCalledWith('disconnected')
  expect(unsubscribe).toEqual(expect.any(Function))
})

it('settles after remote apply without saving the receiving document', async () => {
  const order: string[] = []
  vi.spyOn(core, 'applyCanonicalChanges').mockImplementation(() => {
    order.push('core-apply')
  })
  vi.spyOn(factory, 'runRemoteTransaction').mockImplementation((mutate) => {
    order.push('remote-transaction')
    return mutate()
  })
  const createCollaboration = vi
    .fn()
    .mockReturnValue(harness.collaboration as never)
  collaborationModuleState.createCollaboration = createCollaboration

  await startCollaboration({
    fileId: 'file-lifecycle',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const composition = createCollaboration.mock.calls[0]?.[0]
  if (!composition) throw new Error('Expected collaboration composition')

  await composition.processRemotePublication(
    remotePublication('remote-success')
  )
  expect(order).toEqual(['remote-transaction', 'core-apply'])
  expect(createRemotePublicationHandler).toHaveLength(1)

  vi.mocked(factory.runRemoteTransaction).mockImplementationOnce(() => {
    throw new Error('remote apply failed')
  })
  await expect(
    composition.processRemotePublication(remotePublication('remote-failure'))
  ).rejects.toThrow('remote apply failed')
  expect(order).toEqual(['remote-transaction', 'core-apply'])
})

it('confirms persistence after earlier publications without blocking later publications', async () => {
  const capture = vi.spyOn(core, 'getCanonicalOwnerSnapshot')
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  const send = vi
    .spyOn(
      CollaborationWebSocketProvider.prototype,
      'sendPublicationWithAcceptance'
    )
    .mockImplementation(async (publication) => ({
      publicationId: publication.publicationId,
      sequence: 1
    }))
  const receipt = createDeferred<{
    documentId: string
    documentGeneration: number
    sequence: number
    durableSequence: number
  }>()
  const confirm = vi
    .spyOn(CollaborationWebSocketProvider.prototype, 'confirmPersistence')
    .mockReturnValue(receipt.promise)
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-persistence-boundary',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  publish?.(factoryPublication('before-confirmation'))
  const confirmation = handle.confirmPersistence()
  await vi.waitFor(() => expect(confirm).toHaveBeenCalledOnce())
  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({ publicationId: 'before-confirmation' }),
    expect.any(Function)
  )
  publish?.(factoryPublication('after-confirmation'))
  await handle.whenIdle()
  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({ publicationId: 'after-confirmation' }),
    expect.any(Function)
  )
  receipt.resolve({
    documentId: 'file-persistence-boundary',
    documentGeneration: 0,
    sequence: 1,
    durableSequence: 1
  })
  await expect(confirmation).resolves.toEqual(
    expect.objectContaining({ sequence: 1 })
  )
  expect(capture).not.toHaveBeenCalled()
})

it('cancels a queued persistence confirmation without waiting for a pending publication', async () => {
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  const accepted = createDeferred<{ publicationId: string; sequence: number }>()
  const send = vi
    .spyOn(
      CollaborationWebSocketProvider.prototype,
      'sendPublicationWithAcceptance'
    )
    .mockReturnValue(accepted.promise)
  const confirm = vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'confirmPersistence'
  )
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-persistence-cancel',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  publish?.(factoryPublication('pending-publication'))
  await vi.waitFor(() => expect(send).toHaveBeenCalledOnce())
  const controller = new AbortController()
  let failure: unknown
  const confirmation = handle
    .confirmPersistence(controller.signal)
    .catch((error: unknown) => {
      failure = error
    })
  controller.abort(new Error('Cancelled confirmation'))
  try {
    await vi.waitFor(() =>
      expect(failure).toEqual(new Error('Cancelled confirmation'))
    )
  } finally {
    accepted.resolve({ publicationId: 'pending-publication', sequence: 1 })
    await confirmation
    await handle.whenIdle()
  }
  expect(confirm).not.toHaveBeenCalled()
})

it('retains a producer conversion failure instead of reporting an unsaved local publication as synced', async () => {
  const producer = new Factory()
  producer.registerSharedDataChannel(
    SharedDataChannelNames.SCENE_TREE,
    new LocalSharedDataChannel()
  )
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    producer.subscribeToSharedPublication.bind(producer)
  )
  const sourcePublications: SharedPublication[] = []
  producer.subscribeToSharedPublication((publication) =>
    sourcePublications.push(publication)
  )
  const send = vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'sendPublicationWithAcceptance'
  )
  const confirm = vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'confirmPersistence'
  )
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'file-producer-conversion-failure',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  producer.startTransaction()
  producer.updateTransaction({
    type: TransactionEventTypes.UPDATE_TRANSACTION,
    eventName: EventTypes.UPDATE_PROPERTY,
    payload: { id: 'position-a', before: 0, after: 1 },
    options: { shared: SharedDataChannelNames.SCENE_TREE }
  })
  // The real Factory isolates observer failures from local settlement.
  expect(() => producer.endTransaction()).not.toThrow()
  expect(sourcePublications).toHaveLength(1)
  await expect(handle.confirmPersistence()).rejects.toThrow(
    'pending, conflicted or unavailable'
  )
  expect(confirm).not.toHaveBeenCalled()
  await handle.whenIdle()
  expect(send).not.toHaveBeenCalled()
  expect(handle.getSessionState()).toMatchObject({
    pendingCount: 1,
    sync: 'conflicted'
  })
  const retained = new DocumentPublicationOutbox({
    fileId: 'file-producer-conversion-failure'
  })
  await retained.initialize()
  expect(retained.getConflicts()).toHaveLength(1)
  expect(retained.getRecoverablePublications()).toHaveLength(0)
  expect(retained.getConflicts()[0]?.publication).toEqual(sourcePublications[0])
  expect(retained.getConflicts()[0]?.failureReason).toBeTruthy()
  producer.registerSharedDataChannel(
    SharedDataChannelNames.PROPS,
    new LocalSharedDataChannel()
  )
  producer.startTransaction()
  producer.updateTransaction({
    type: TransactionEventTypes.UPDATE_TRANSACTION,
    eventName: EventTypes.UPDATE_PROPERTY,
    payload: {
      action: PROPS_ACTIONS.UPDATE_PROPERTY,
      eventName: EventTypes.UPDATE_PROPERTY,
      id: 'later-position',
      key: 'x',
      before: 0,
      after: 2
    },
    options: { shared: SharedDataChannelNames.PROPS }
  })
  producer.endTransaction()
  await handle.whenIdle()
  expect(handle.getSessionState()).toMatchObject({
    pendingCount: 2,
    sync: 'conflicted'
  })
  expect(send).not.toHaveBeenCalled()
  await disposeCollaboration()
  const reopened = await prepareCollaborationDocumentSession({
    fileId: 'file-producer-conversion-failure',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const reopenedHandle = await reopened.activate()
  await reopenedHandle.whenIdle()
  expect(reopenedHandle.getSessionState()).toMatchObject({
    pendingCount: 2,
    sync: 'conflicted'
  })
  await expect(reopenedHandle.confirmPersistence()).rejects.toThrow(
    'pending, conflicted or unavailable'
  )
  expect(send).not.toHaveBeenCalled()
  expect(confirm).not.toHaveBeenCalled()
})

it('blocks confirmation and transport after failed preparation retention even through reconnect and later edits', async () => {
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  const send = vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'sendPublicationWithAcceptance'
  )
  const confirm = vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'confirmPersistence'
  )
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'preparation-storage-failure',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  vi.spyOn(
    IndexedDbPublicationOutboxStorage.prototype,
    'put'
  ).mockRejectedValueOnce(new Error('disk full'))
  const valid = factoryPublication('invalid-for-storage')
  const invalid = freezePublication({
    ...valid,
    slices: valid.slices.map((slice) => ({
      ...slice,
      batches: slice.batches.map((batch) => ({
        ...batch,
        deliveries: batch.deliveries.map((delivery) => ({
          ...delivery,
          eventName: EventTypes.UPDATE_COMPUTED_DATA
        }))
      }))
    }))
  })
  publish?.(invalid)
  await expect(handle.confirmPersistence()).rejects.toThrow(
    'pending, conflicted or unavailable'
  )
  expect(handle.getSessionState()).toMatchObject({
    pendingCount: 1,
    sync: 'storage-failed'
  })
  await handle.disconnect()
  await handle.reconnect()
  publish?.(factoryPublication('later-storage-success'))
  await handle.whenIdle()
  expect(handle.getSessionState()).toMatchObject({
    pendingCount: 2,
    sync: 'storage-failed'
  })
  await expect(handle.confirmPersistence()).rejects.toThrow(
    'pending, conflicted or unavailable'
  )
  expect(send).not.toHaveBeenCalled()
  expect(confirm).not.toHaveBeenCalled()
})

it('retains action replay and compensation behind a rejected predecessor without sending them', async () => {
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  const send = vi
    .spyOn(
      CollaborationWebSocketProvider.prototype,
      'sendPublicationWithAcceptance'
    )
    .mockRejectedValue(
      new ProviderFailure(
        'acknowledgement-failed',
        'rejected source',
        undefined,
        'rejected-predecessor'
      )
    )
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'rejected-replay-prefix',
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  publish?.(factoryPublication('rejected-predecessor'))
  for (const origin of [
    'action',
    'undo',
    'redo',
    'rollback-compensation'
  ] as const) {
    publish?.(
      freezePublication({
        ...factoryPublication(`later-${origin}`),
        origin,
        ...(origin === 'rollback-compensation'
          ? { compensatesPublicationId: 'rejected-predecessor' }
          : {})
      })
    )
  }
  await handle.whenIdle()
  expect(send).toHaveBeenCalledOnce()
  expect(handle.getSessionState()).toMatchObject({
    pendingCount: 5,
    sync: 'conflicted'
  })
  const reloaded = new DocumentPublicationOutbox({
    fileId: 'rejected-replay-prefix'
  })
  await reloaded.initialize()
  expect(reloaded.getState()).toEqual({ pendingCount: 5, status: 'conflicted' })
  expect(reloaded.getRecoverablePublications()).toEqual([])
})

it('preserves the local recovery document across reconnect and reopen, then resumes canonical saving after preparation is repaired', async () => {
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  vi.spyOn(core, 'isTransactionBoundaryIdle').mockReturnValue(true)
  const draft = {
    ...EMPTY_DOCUMENT,
    props: { savedWork: { id: 'savedWork', type: 'test', value: 17 } }
  }
  vi.spyOn(core, 'getCanonicalOwnerSnapshot').mockReturnValue(draft as never)
  const load = vi.spyOn(core, 'load').mockImplementation(() => undefined)
  vi.spyOn(core, 'applyRemoteCanonicalChangeSlices').mockResolvedValue(
    undefined
  )
  const prepare = vi.spyOn(documentPreparation, 'prepareDocumentPublication')
  prepare.mockImplementationOnce(() => {
    throw new Error('temporary converter failure')
  })
  const send = vi
    .spyOn(
      CollaborationWebSocketProvider.prototype,
      'sendPublicationWithAcceptance'
    )
    .mockImplementation(async (publication, consume) => {
      await consume?.(publication)
      return { publicationId: publication.publicationId, sequence: 1 }
    })
  const receipt = { documentId: 'recovery-complete', durableSequence: 1 }
  vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'confirmPersistence'
  ).mockResolvedValue(receipt as never)
  const mode = {
    fileId: 'recovery-complete',
    actorId: 'recovery-actor',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  }
  const initial = await prepareCollaborationDocumentSession(mode)
  const handle = await initial.activate()
  publish?.(factoryPublication('recoverable-source'))
  await handle.whenIdle()
  expect(handle.getRecoveryDocument()).toMatchObject(draft)
  await handle.reconnect()
  expect(load).not.toHaveBeenCalled()
  expect(send).not.toHaveBeenCalled()
  await disposeCollaboration()
  const reopened = await prepareCollaborationDocumentSession(mode)
  expect(reopened.bootstrap.checkpoint).toMatchObject(draft)
  const reopenedHandle = await reopened.activate()
  await reopenedHandle.prepareRecovery()
  await disposeCollaboration()
  const resumed = await prepareCollaborationDocumentSession(mode)
  expect(resumed.bootstrap.checkpoint).toEqual(EMPTY_DOCUMENT)
  const resumedHandle = await resumed.activate()
  await resumedHandle.whenIdle()
  expect(send).toHaveBeenCalledTimes(1)
  expect(resumedHandle.getSessionState()).toMatchObject({
    sync: 'synced',
    pendingCount: 0
  })
  await expect(resumedHandle.confirmPersistence()).resolves.toEqual(receipt)
})

it('retains the failed source even when capturing its recovery document also fails', async () => {
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(core, 'getCanonicalOwnerSnapshot').mockImplementation(() => {
    throw new Error('snapshot unavailable')
  })
  vi.spyOn(
    documentPreparation,
    'prepareDocumentPublication'
  ).mockImplementationOnce(() => {
    throw new Error('converter unavailable')
  })
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'snapshot-failed',
    actorId: 'actor',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  expect(() => publish?.(factoryPublication('must-retain'))).not.toThrow()
  await handle.whenIdle()
  expect(handle.getSessionState()).toMatchObject({
    sync: 'conflicted',
    pendingCount: 1,
    recoveryAvailable: true
  })
  const retained = new DocumentPublicationOutbox({ fileId: 'snapshot-failed' })
  await retained.initialize()
  expect(retained.getConflicts()[0]?.publicationId).toBe('must-retain')
  expect(handle.hasUnpersistedChanges()).toBe(false)
})

it('isolates a rejected source even when persisting the conflict fails', async () => {
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const load = vi.spyOn(core, 'load').mockImplementation(() => undefined)
  vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'sendPublicationWithAcceptance'
  ).mockImplementation(async () => {
    vi.spyOn(
      IndexedDbPublicationOutboxStorage.prototype,
      'put'
    ).mockRejectedValue(new Error('disk unavailable'))
    throw new ProviderFailure('acknowledgement-failed', 'rejected')
  })
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'conflict-retention-failed',
    actorId: 'actor',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  publish?.(factoryPublication('rejected-source'))
  await handle.whenIdle()
  expect(handle.getSessionState()).toMatchObject({
    sync: 'storage-failed',
    recoveryAvailable: true
  })
  await handle.reconnect()
  expect(load).not.toHaveBeenCalled()
})

it('keeps reopened recovery available after failed Reset and clears it only after authoritative Reset succeeds', async () => {
  const fileId = 'reopened-recovery-reset'
  const outbox = new DocumentPublicationOutbox({ fileId })
  await outbox.initialize()
  await outbox.bindDocumentGeneration(0)
  await outbox.appendPreparationFailure(
    factoryPublication('reset-retained'),
    'invalid source',
    EMPTY_DOCUMENT
  )
  const prepared = await prepareCollaborationDocumentSession({
    fileId,
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  expect(handle.getSessionState().recoveryAvailable).toBe(true)
  const reset = vi.mocked(
    CollaborationWebSocketProvider.prototype.resetDocument
  )
  const completeBootstrap = vi.mocked(
    CollaborationWebSocketProvider.prototype.completeDocumentBootstrap
  )
  completeBootstrap.mockClear()
  reset.mockImplementationOnce(async () => {
    expect(completeBootstrap).toHaveBeenCalledOnce()
    throw new Error('Reset unavailable')
  })
  await expect(resetCollaborationDocument(fileId)).rejects.toThrow(
    'Reset unavailable'
  )
  expect(getActiveCollaborationHandle()).toBe(handle)
  const retained = new DocumentPublicationOutbox({ fileId })
  await retained.initialize()
  expect(retained.getState().pendingCount).toBe(1)
  await resetCollaborationDocument(fileId)
  expect(reset).toHaveBeenCalledTimes(2)
  expect(getActiveCollaborationHandle()).toBeUndefined()
  const cleared = new DocumentPublicationOutbox({ fileId })
  await cleared.initialize()
  expect(cleared.getState().pendingCount).toBe(0)
})

it('keeps preparation retry available after reopening evidence whose optional draft capture failed', async () => {
  const fileId = 'recovery-without-captured-draft'
  const outbox = new DocumentPublicationOutbox({ fileId })
  await outbox.initialize()
  await outbox.bindDocumentGeneration(0)
  await outbox.appendPreparationFailure(
    factoryPublication('source-without-draft'),
    'converter unavailable'
  )
  const prepared = await prepareCollaborationDocumentSession({
    fileId,
    actorId: 'actor-lifecycle',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  expect(handle.getSessionState()).toMatchObject({
    recoveryAvailable: true,
    sync: 'conflicted'
  })
  expect(handle.getRecoveryDocument()).toBeUndefined()
  vi.spyOn(core, 'isTransactionBoundaryIdle').mockReturnValue(true)
  await handle.prepareRecovery()
  const retained = new DocumentPublicationOutbox({ fileId })
  await retained.initialize()
  expect(retained.getRecoverablePublications()).toHaveLength(1)
})

it('exposes recovery after accepted-source cleanup fails and preserves the exact source for retry', async () => {
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  const draft = {
    ...EMPTY_DOCUMENT,
    props: { retained: { id: 'retained', value: 5 } }
  }
  vi.spyOn(core, 'getCanonicalOwnerSnapshot').mockReturnValue(draft as never)
  vi.spyOn(core, 'isTransactionBoundaryIdle').mockReturnValue(true)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(
    CollaborationWebSocketProvider.prototype,
    'sendPublicationWithAcceptance'
  ).mockImplementation(async (publication) => ({
    publicationId: publication.publicationId,
    sequence: 1
  }))
  const remove = vi
    .spyOn(IndexedDbPublicationOutboxStorage.prototype, 'delete')
    .mockRejectedValueOnce(new Error('delete failed'))
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'accepted-cleanup-failed',
    actorId: 'actor',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  publish?.(factoryPublication('accepted-source'))
  await handle.whenIdle()
  expect(handle.getSessionState()).toMatchObject({
    recoveryAvailable: true,
    connection: 'disconnected',
    sync: 'storage-failed',
    pendingCount: 1
  })
  expect(handle.getRecoveryDocument()).toMatchObject(draft)
  await handle.prepareRecovery()
  const outbox = new DocumentPublicationOutbox({
    fileId: 'accepted-cleanup-failed'
  })
  await outbox.initialize()
  expect(
    outbox.getRecoverablePublications().map((record) => record.publicationId)
  ).toEqual(['accepted-source'])
  expect(remove).toHaveBeenCalledOnce()
})

it('abandons an in-flight reconnect when a source failure establishes a recovery draft', async () => {
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  const draft = {
    ...EMPTY_DOCUMENT,
    props: { retained: { id: 'retained', value: 7 } }
  }
  vi.spyOn(core, 'getCanonicalOwnerSnapshot').mockReturnValue(draft as never)
  const load = vi.spyOn(core, 'load').mockImplementation(() => undefined)
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'reconnect-racing-recovery',
    actorId: 'actor',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  await handle.disconnect()
  const opened = createDeferred<undefined>()
  const pending =
    createDeferred<
      Awaited<ReturnType<CollaborationWebSocketProvider['openDocumentSession']>>
    >()
  vi.mocked(
    CollaborationWebSocketProvider.prototype.openDocumentSession
  ).mockImplementationOnce(() => {
    opened.resolve(undefined)
    return pending.promise
  })
  const reconnecting = handle.reconnect()
  await opened.promise
  vi.spyOn(
    documentPreparation,
    'prepareDocumentPublication'
  ).mockImplementationOnce(() => {
    throw new Error('prepare failed during reconnect')
  })
  publish?.(factoryPublication('racing-failure'))
  pending.resolve({
    checkpoint: EMPTY_DOCUMENT,
    durableSequence: 0,
    headSequence: 0,
    pendingTail: []
  })
  await reconnecting
  await handle.whenIdle()
  expect(load).not.toHaveBeenCalled()
  expect(handle.getRecoveryDocument()).toMatchObject(draft)
  expect(handle.getSessionState()).toMatchObject({
    recoveryAvailable: true,
    sync: 'conflicted',
    connection: 'disconnected'
  })
})

it('does not reload Core or erase history when a live edit is rejected after successful recovery replay', async () => {
  const fileId = 'live-rejection-after-replay'
  const outbox = new DocumentPublicationOutbox({ fileId })
  await outbox.initialize()
  await outbox.bindDocumentGeneration(0)
  await outbox.append(
    prepareDocumentPublication(factoryPublication('old-replay'))
  )
  let publish: ((publication: SharedPublication) => void) | undefined
  vi.spyOn(factory, 'subscribeToSharedPublication').mockImplementation(
    (subscriber) => {
      publish = subscriber
      return () => {
        publish = undefined
      }
    }
  )
  vi.spyOn(core, 'applyRemoteCanonicalChangeSlices').mockResolvedValue(
    undefined
  )
  vi.spyOn(core, 'getCanonicalOwnerSnapshot').mockReturnValue(
    EMPTY_DOCUMENT as never
  )
  const load = vi.spyOn(core, 'load').mockImplementation(() => undefined)
  const send = vi
    .spyOn(
      CollaborationWebSocketProvider.prototype,
      'sendPublicationWithAcceptance'
    )
    .mockImplementation(async (publication, consume) => {
      await consume(publication)
      return { publicationId: publication.publicationId, sequence: 1 }
    })
  const prepared = await prepareCollaborationDocumentSession({
    fileId,
    actorId: 'actor',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  expect(handle.getSessionState().sync).toBe('synced')
  load.mockClear()
  send.mockRejectedValueOnce(
    new ProviderFailure('acknowledgement-failed', 'live rejection')
  )
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  publish?.(factoryPublication('new-live-edit'))
  await handle.whenIdle()
  expect(load).not.toHaveBeenCalled()
  expect(handle.getSessionState()).toMatchObject({
    recoveryAvailable: true,
    pendingCount: 1,
    sync: 'conflicted'
  })
})

it('does not permit recovery reload while a new transaction remains open after retention settled', async () => {
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'active-edit-recovery-reload',
    actorId: 'actor',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  vi.spyOn(core, 'isTransactionBoundaryIdle').mockReturnValue(false)
  await handle.whenIdle()
  expect(handle.hasUnpersistedChanges()).toBe(true)
})

it('keeps startup recovery actionable when binding retained records to the document generation fails', async () => {
  const fileId = 'generation-bind-storage-failure'
  const outbox = new DocumentPublicationOutbox({ fileId })
  await outbox.initialize()
  await outbox.append(
    prepareDocumentPublication(factoryPublication('unbound-source'))
  )
  const put = vi
    .spyOn(IndexedDbPublicationOutboxStorage.prototype, 'put')
    .mockRejectedValueOnce(new Error('binding storage failed'))
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(core, 'isTransactionBoundaryIdle').mockReturnValue(true)
  const prepared = await prepareCollaborationDocumentSession({
    fileId,
    actorId: 'actor',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const handle = await prepared.activate()
  expect(handle.getSessionState()).toMatchObject({
    recoveryAvailable: true,
    sync: 'storage-failed'
  })
  await handle.prepareRecovery()
  const retained = new DocumentPublicationOutbox({ fileId })
  await retained.initialize()
  expect(retained.getRecoverablePublications()[0]?.documentGeneration).toBe(0)
  expect(put).toHaveBeenCalledTimes(2)
})

it('cannot revive an activation after its document session is disposed', async () => {
  const pending = createDeferred<undefined>()
  const starting = createDeferred<undefined>()
  const prepared = await prepareCollaborationDocumentSession({
    fileId: 'disposed-during-activation',
    actorId: 'actor',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  vi.mocked(
    CollaborationWebSocketProvider.prototype.completeDocumentBootstrap
  ).mockImplementationOnce(async () => {
    starting.resolve(undefined)
    await pending.promise
  })
  const activation = prepared.activate()
  const rejected = expect(activation).rejects.toThrow('disposed')
  await starting.promise
  await disposeCollaboration()
  pending.resolve(undefined)
  await rejected
  expect(getActiveCollaborationHandle()).toBeUndefined()
})

it.each(['resolved', 'rejected'] as const)(
  'retires a Core session disposed during %s preparation without disturbing its successor',
  async (settlement) => {
    const pending =
      createDeferred<
        Awaited<
          ReturnType<CollaborationWebSocketProvider['openDocumentSession']>
        >
      >()
    const opening = createDeferred<undefined>()
    vi.mocked(
      CollaborationWebSocketProvider.prototype.openDocumentSession
    ).mockImplementationOnce(() => {
      opening.resolve(undefined)
      return pending.promise
    })
    const unsubscribe = vi.fn()
    const session = createCollaborationDocumentSession({
      fileId: `disposed-preparation-${settlement}`,
      actorId: 'old-actor',
      endpoint: 'ws://127.0.0.1:4101/collaboration'
    })
    const preparation = Promise.resolve(
      session.prepare({
        load: vi.fn(),
        applyRemoteCanonicalChangeSlices: vi.fn(async () => undefined),
        subscribeToSharedPublication: () => unsubscribe
      })
    )
    const rejected = expect(preparation).rejects.toThrow(
      settlement === 'resolved' ? 'disposed' : 'Bootstrap failed'
    )
    await opening.promise
    const disposal = session.dispose()
    const successor = await prepareCollaborationDocumentSession({
      fileId: `successor-${settlement}`,
      actorId: 'new-actor',
      endpoint: 'ws://127.0.0.1:4101/collaboration'
    })
    const active = await successor.activate()
    if (settlement === 'resolved')
      pending.resolve({
        checkpoint: EMPTY_DOCUMENT,
        durableSequence: 0,
        headSequence: 0,
        pendingTail: []
      })
    else pending.reject(new Error('Bootstrap failed'))
    await rejected
    await disposal
    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(getActiveCollaborationHandle()).toBe(active)
    expect(window.__Collaboration__).toBe(active)
    await expect(session.activate()).rejects.toThrow()
  }
)

it('retires a prepared checkpoint load source when its Core session is disposed', async () => {
  const session = createCollaborationDocumentSession({
    fileId: 'disposed-checkpoint-source',
    actorId: 'actor',
    endpoint: 'ws://127.0.0.1:4101/collaboration'
  })
  const preparation = await session.prepare({
    load: vi.fn(),
    applyRemoteCanonicalChangeSlices: vi.fn(async () => undefined),
    subscribeToSharedPublication: () => vi.fn()
  })
  expect(await preparation?.loadSource?.load()).toEqual(EMPTY_DOCUMENT)
  await session.dispose()
  await expect(preparation?.loadSource?.load()).rejects.toThrow('disposed')
})
