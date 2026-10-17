import {
  settleCooperativeRenderSlice,
  type CoreCollaborationBridge,
  type CoreCollaborationSession,
  type SharedPublication
} from '@asyra/core'
import {
  ProviderFailure,
  createCollaboration,
  type Collaboration,
  type CollaborationPublicationOutcome,
  type ProcessRemotePublication,
  type ProviderStatus
} from '@asyra/collaboration'
import { idCounter } from '@asyra/utils'
import core from '../contexts'
import type { CollaborationMode } from '../render-app/collaboration-mode'
import {
  createDocumentCollaborationPublicationSource,
  prepareCollaborationPublication
} from './factory-adapter'
import { createFormalInitialDocument } from './initial-document'
import { applyDocumentSessionBootstrapTail } from './operations'
import { createPublicationProcessor } from './publication-processor'
import {
  DocumentPublicationOutbox,
  PublicationOutboxStorageError,
  type PublicationOutboxState,
  type PublicationOutboxStorage
} from './publication-outbox'
import type {
  DocumentSessionBootstrap,
  DocumentPersistenceReceipt
} from './protocol'
import { CollaborationWebSocketProvider } from './websocket-provider'
import type { ApplyRemoteCanonicalChangeSlicesInput as AppRemoteCanonicalChangeSlicesInput } from './app-protocol-types'

const RECONNECT_INTERVAL_MS = 30_000

export type CollaborationConnectionState = 'none' | 'connected' | 'disconnected'

type SettledCollaborationConnectionState = Exclude<
  CollaborationConnectionState,
  'none'
>

export const INITIAL_COLLABORATION_CONNECTION_STATE = 'none' as const

export const resolveCollaborationConnectionTransition = (
  current: CollaborationConnectionState,
  next: SettledCollaborationConnectionState
): Readonly<{
  changed: boolean
  connection: SettledCollaborationConnectionState
  notificationType: 'disconnected' | 'reconnected' | undefined
}> => {
  if ((next as CollaborationConnectionState) === 'none') {
    throw new Error('Collaboration connection state cannot return to none')
  }

  if (current === next) {
    return Object.freeze({
      changed: false,
      connection: next,
      notificationType: undefined
    })
  }

  let notificationType: 'disconnected' | 'reconnected' | undefined
  if (
    (current === 'none' || current === 'connected') &&
    next === 'disconnected'
  ) {
    notificationType = 'disconnected'
  }
  if (current === 'disconnected' && next === 'connected') {
    notificationType = 'reconnected'
  }
  return Object.freeze({
    changed: true,
    connection: next,
    notificationType
  })
}

export type CollaborationSyncState =
  'synced' | 'pending' | 'reconciling' | 'conflicted' | 'storage-failed'

export interface CollaborationSessionNotification {
  readonly id: string
  readonly message: string
  readonly type:
    'disconnected' | 'reconnected' | 'storage-failed' | 'conflicted'
}

export interface CollaborationSessionState {
  readonly connection: CollaborationConnectionState
  readonly sync: CollaborationSyncState
  readonly pendingCount: number
  readonly disconnectedEpoch: number
  readonly recoveryAvailable?: boolean
  readonly notification?: CollaborationSessionNotification
}

export interface CollaborationDebugHandle {
  readonly identity: Readonly<{
    readonly documentId: string
    readonly roomId: string
    readonly actorId: string
  }>
  getStatus(): ProviderStatus
  onStatusChange(subscriber: (status: ProviderStatus) => void): () => void
  getSessionState(): CollaborationSessionState
  onSessionStateChange(
    subscriber: (state: CollaborationSessionState) => void
  ): () => void
  disconnect(): Promise<void>
  reconnect(): Promise<void>
  prepareRecovery(): Promise<void>
  getRecoveryDocument(): unknown
  hasUnpersistedChanges(): boolean
  whenIdle(): Promise<void>
  confirmPersistence(signal?: AbortSignal): Promise<DocumentPersistenceReceipt>
  observePublicationOutcomes(
    subscriber: (outcome: CollaborationPublicationOutcome) => void
  ): () => void
  dispose(): Promise<void>
}

export interface PreparedCollaborationDocumentSession {
  readonly bootstrap: DocumentSessionBootstrap
  activate(): Promise<CollaborationDebugHandle>
}

interface CollaborationSessionComposition {
  readonly collaboration: Collaboration
  readonly provider: CollaborationWebSocketProvider
}

interface PreparedSocketComposition {
  readonly bootstrap: DocumentSessionBootstrap
  readonly composition: CollaborationSessionComposition
}

const noOutboundPublicationSource = Object.freeze({
  subscribe: () => () => undefined
})

const createUnavailableStorage = (
  cause: unknown
): PublicationOutboxStorage => ({
  load: async () => {
    throw cause
  },
  put: async () => {
    throw cause
  },
  delete: async () => {
    throw cause
  }
})

const createPublicationOutbox = (fileId: string): DocumentPublicationOutbox => {
  try {
    return new DocumentPublicationOutbox({ fileId })
  } catch (error) {
    return new DocumentPublicationOutbox({
      fileId,
      storage: createUnavailableStorage(error)
    })
  }
}

const createInitialBootstrap = (): DocumentSessionBootstrap =>
  Object.freeze({
    checkpoint: createFormalInitialDocument(),
    documentGeneration: 0,
    durableSequence: 0,
    headSequence: 0,
    pendingTail: Object.freeze([])
  })

const providerStatusForConnection = (
  connection: CollaborationConnectionState,
  disposed: boolean
): ProviderStatus => {
  if (disposed) return 'disposed'
  if (connection === 'none') return 'idle'
  if (connection === 'connected') return 'connected'
  return 'disconnected'
}

export const createRemotePublicationHandler = (
  applyRemotePublication: (
    publication: SharedPublication
  ) => boolean | Promise<boolean>,
  settleProjection: () => Promise<void> = settleCooperativeRenderSlice
): ProcessRemotePublication => {
  return async (publication) => {
    const applied = await applyRemotePublication(publication)
    if (!applied) {
      throw new Error(
        `[collaboration] remote publication ${publication.publicationId} was rejected`
      )
    }
    await settleProjection()
  }
}

const createSessionComposition = (
  mode: CollaborationMode,
  processRemotePublication: ProcessRemotePublication
): CollaborationSessionComposition => {
  const provider = new CollaborationWebSocketProvider({
    endpoint: mode.endpoint,
    identity: {
      documentId: mode.fileId,
      roomId: mode.fileId,
      actorId: mode.actorId,
      connectionMetadata: { fileId: mode.fileId }
    }
  })
  const collaboration = createCollaboration({
    documentId: mode.fileId,
    roomId: mode.fileId,
    actorId: mode.actorId,
    publicationSource: noOutboundPublicationSource,
    provider,
    processRemotePublication,
    resourceOwnership: { provider: 'owned' }
  })
  return { collaboration, provider }
}

class CollaborationSessionController {
  readonly identity: CollaborationDebugHandle['identity']

  private readonly mode: CollaborationMode
  private readonly processRemotePublication: ProcessRemotePublication
  private readonly bridge: CoreCollaborationBridge
  private readonly outbox: DocumentPublicationOutbox
  private readonly statusSubscribers = new Set<
    (status: ProviderStatus) => void
  >()
  private readonly sessionStateSubscribers = new Set<
    (state: CollaborationSessionState) => void
  >()
  private readonly outcomeSubscribers = new Set<
    (outcome: CollaborationPublicationOutcome) => void
  >()
  private current: CollaborationSessionComposition | undefined
  private preparedSocket: PreparedSocketComposition | undefined
  private unsubscribeProviderStatus: (() => void) | undefined
  private unsubscribeOutcomes: (() => void) | undefined
  private unsubscribePublicationSource: (() => void) | undefined
  private unsubscribeOutbox: (() => void) | undefined
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private reconnectPromise: Promise<void> | undefined
  private operationQueue: Promise<void> = Promise.resolve()
  private activated = false
  private disposed = false
  private disconnectedEpoch = 0
  private reconciling = false
  private recoveryApplyCutoff = 0
  private readonly recoveryAppliedPublicationIds = new Set<string>()
  private recoveryMode = false
  private pendingRetention = 0
  private state: CollaborationSessionState = Object.freeze({
    connection: INITIAL_COLLABORATION_CONNECTION_STATE,
    sync: 'synced',
    pendingCount: 0,
    disconnectedEpoch: 0
  })

  constructor(
    mode: CollaborationMode,
    processRemotePublication: ProcessRemotePublication,
    bridge: CoreCollaborationBridge
  ) {
    this.mode = mode
    this.processRemotePublication = processRemotePublication
    this.bridge = bridge
    this.identity = Object.freeze({
      documentId: mode.fileId,
      roomId: mode.fileId,
      actorId: mode.actorId
    })
    this.outbox = createPublicationOutbox(mode.fileId)
  }

  async prepare(): Promise<DocumentSessionBootstrap> {
    this.unsubscribeOutbox = this.outbox.onStateChange((state) => {
      this.applyOutboxState(state)
    })
    try {
      await this.outbox.initialize()
    } catch (error) {
      this.recoveryMode = true
      console.error('[collaboration] publication outbox load failed:', error)
    }
    const documentPublicationSource =
      createDocumentCollaborationPublicationSource(
        this.bridge,
        (source, error) => {
          this.scheduleLocalPublication(source, error)
        }
      )
    this.unsubscribePublicationSource = documentPublicationSource.subscribe(
      (publication) => {
        this.scheduleLocalPublication(publication)
      }
    )

    try {
      const prepared = await this.openSocketComposition()
      try {
        await this.outbox.bindDocumentGeneration(
          prepared.bootstrap.documentGeneration ?? 0
        )
      } catch (error) {
        if (!(error instanceof PublicationOutboxStorageError)) {
          await prepared.composition.collaboration.dispose()
          throw error
        }
        this.recoveryMode = true
        console.error(
          '[collaboration] recovery generation binding failed:',
          error
        )
      }
      this.recoveryApplyCutoff = this.outbox.getLastAppendOrder()
      const recoveryDocument = this.outbox.getRecoveryDocument()
      const status = this.outbox.getState().status
      if (status === 'storage-failed' || status === 'conflicted') {
        this.recoveryMode = true
        await prepared.composition.collaboration.dispose()
        return {
          ...prepared.bootstrap,
          checkpoint: (recoveryDocument ??
            prepared.bootstrap
              .checkpoint) as DocumentSessionBootstrap['checkpoint'],
          pendingTail: []
        }
      }
      this.preparedSocket = prepared
      return prepared.bootstrap
    } catch (error) {
      if (!(error instanceof ProviderFailure)) {
        await this.dispose()
        throw error
      }
      console.error('[collaboration] initial document session failed:', error)
      this.enterDisconnectedEpoch()
      const recoveryDocument = this.outbox.getRecoveryDocument()
      if (recoveryDocument !== undefined) {
        this.recoveryMode = true
        return {
          ...createInitialBootstrap(),
          checkpoint: recoveryDocument as DocumentSessionBootstrap['checkpoint']
        }
      }
      return createInitialBootstrap()
    }
  }

  async activate(): Promise<CollaborationDebugHandle> {
    if (this.disposed) {
      throw new Error('[collaboration] collaboration session is disposed')
    }
    if (this.activated) return this.createHandle()
    this.activated = true

    const prepared = this.preparedSocket
    this.preparedSocket = undefined
    if (prepared) {
      try {
        if (await this.activateComposition(prepared)) {
          this.setConnected()
          await this.schedule(() => this.drainOutbox())
        } else {
          await prepared.composition.collaboration.dispose()
        }
      } catch (error) {
        await prepared.composition.collaboration
          .dispose()
          .catch(() => undefined)
        if (!(error instanceof ProviderFailure)) throw error
        console.error(
          '[collaboration] initial document-session activation failed:',
          error
        )
        this.enterDisconnectedEpoch()
        this.scheduleReconnect()
      }
    } else {
      this.enterDisconnectedEpoch()
      this.scheduleReconnect()
    }

    if (this.disposed) throw new Error('Document session is disposed')
    if (this.recoveryMode) this.applyOutboxState(this.outbox.getState())
    const handle = this.createHandle()
    activeHandle = handle
    window.__Collaboration__ = handle
    return handle
  }

  getStatus(): ProviderStatus {
    return providerStatusForConnection(this.state.connection, this.disposed)
  }

  onStatusChange(subscriber: (status: ProviderStatus) => void): () => void {
    this.statusSubscribers.add(subscriber)
    return () => this.statusSubscribers.delete(subscriber)
  }

  getSessionState(): CollaborationSessionState {
    return this.state
  }

  onSessionStateChange(
    subscriber: (state: CollaborationSessionState) => void
  ): () => void {
    this.sessionStateSubscribers.add(subscriber)
    return () => this.sessionStateSubscribers.delete(subscriber)
  }

  observePublicationOutcomes(
    subscriber: (outcome: CollaborationPublicationOutcome) => void
  ): () => void {
    this.outcomeSubscribers.add(subscriber)
    return () => this.outcomeSubscribers.delete(subscriber)
  }

  async disconnect(): Promise<void> {
    if (this.disposed) return
    this.clearReconnectTimer()
    await this.current?.collaboration.disconnect()
    this.enterDisconnectedEpoch()
    this.scheduleReconnect()
  }

  reconnect(): Promise<void> {
    if (this.disposed) return Promise.resolve()
    this.clearReconnectTimer()
    return this.attemptReconnect()
  }

  hasUnpersistedChanges(): boolean {
    return (
      !core.isTransactionBoundaryIdle() ||
      this.pendingRetention > 0 ||
      this.outbox.getState().status === 'storage-failed'
    )
  }

  getRecoveryDocument(): unknown {
    return this.outbox.getRecoveryDocument()
  }

  /** Prepare a durable, validated replay; the caller then reopens the session. */
  prepareRecovery(): Promise<void> {
    return this.schedule(async () => {
      if (this.disposed) throw new Error('Document session is disposed')
      if (!core.isTransactionBoundaryIdle())
        throw new Error('Finish the current edit before retrying saving')
      await this.outbox.retryStorage()
      await this.outbox.retryPreparation(prepareCollaborationPublication)
      if (!core.isTransactionBoundaryIdle())
        throw new Error('Finish the current edit before retrying saving')
      // A fresh authoritative bootstrap owns replay. Do not apply the draft to peers.
    })
  }

  private captureRecoveryDocument(): unknown {
    try {
      return { version: core.version, ...core.getCanonicalOwnerSnapshot() }
    } catch (error) {
      console.error('[collaboration] recovery document capture failed:', error)
      return this.outbox.getRecoveryDocument()
    }
  }

  private async isolateRecovery(): Promise<void> {
    this.recoveryMode = true
    this.clearReconnectTimer()
    try {
      await this.current?.collaboration.disconnect()
    } finally {
      this.applyOutboxState(this.outbox.getState())
    }
  }

  async confirmPersistence(
    signal?: AbortSignal
  ): Promise<DocumentPersistenceReceipt> {
    signal?.throwIfAborted()
    let confirmation: Promise<DocumentPersistenceReceipt> | undefined
    const boundary = this.schedule(async () => {
      signal?.throwIfAborted()
      if (
        this.recoveryMode ||
        this.state.sync === 'conflicted' ||
        this.state.sync === 'storage-failed'
      )
        throw new Error(
          'Local publications are pending, conflicted or unavailable'
        )
      if (
        this.disposed ||
        this.state.connection !== 'connected' ||
        !this.current
      )
        throw new Error('Document session is not connected')
      if (this.state.sync !== 'synced')
        throw new Error(
          'Local publications are pending, conflicted or unavailable'
        )
      confirmation = this.current.provider.confirmPersistence(signal)
      // Observe rejection immediately; awaiting the receipt happens outside the publication queue.
      void confirmation.catch(() => undefined)
    })
    const result = boundary.then(() => {
      if (!confirmation)
        throw new Error('Persistence confirmation was not started')
      return confirmation
    })
    if (!signal) return result
    return new Promise<DocumentPersistenceReceipt>((resolve, reject) => {
      const onAbort = () => reject(signal.reason)
      signal.addEventListener('abort', onAbort, { once: true })
      result.then(
        (receipt) => {
          signal.removeEventListener('abort', onAbort)
          resolve(receipt)
        },
        (error: unknown) => {
          signal.removeEventListener('abort', onAbort)
          reject(error)
        }
      )
      if (signal.aborted) onAbort()
    })
  }

  async whenIdle(): Promise<void> {
    let queued: Promise<void>
    let reconnecting: Promise<void> | undefined
    do {
      queued = this.operationQueue
      reconnecting = this.reconnectPromise
      await queued
      await reconnecting
      await this.outbox.whenIdle()
      await this.current?.collaboration.whenIdle()
    } while (
      queued !== this.operationQueue ||
      reconnecting !== this.reconnectPromise
    )
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    this.clearReconnectTimer()
    this.unsubscribePublicationSource?.()
    this.unsubscribePublicationSource = undefined
    this.unsubscribeOutbox?.()
    this.unsubscribeOutbox = undefined
    this.unbindCurrentObservers()
    const current = this.current
    const prepared = this.preparedSocket?.composition
    this.current = undefined
    this.preparedSocket = undefined
    await current?.collaboration.dispose().catch(() => undefined)
    if (prepared && prepared !== current) {
      await prepared.collaboration.dispose().catch(() => undefined)
    }
    await this.operationQueue
    await this.outbox.whenIdle()
    this.statusSubscribers.clear()
    this.sessionStateSubscribers.clear()
    this.outcomeSubscribers.clear()
  }

  async resetDocument(): Promise<void> {
    this.clearReconnectTimer()
    await this.operationQueue
    let composition = this.current
    let temporary: PreparedSocketComposition | undefined
    if (this.recoveryMode || !composition || this.getStatus() !== 'connected') {
      temporary = await this.openSocketComposition()
      composition = temporary.composition
    }
    try {
      if (temporary) await composition.provider.completeDocumentBootstrap()
      await composition.collaboration.whenIdle()
      await composition.provider.resetDocument()
      await this.dispose()
      await this.outbox.clear()
    } finally {
      await temporary?.composition.collaboration.dispose()
    }
  }

  private createHandle(): CollaborationDebugHandle {
    return {
      identity: this.identity,
      getStatus: () => this.getStatus(),
      onStatusChange: (subscriber) => this.onStatusChange(subscriber),
      getSessionState: () => this.getSessionState(),
      onSessionStateChange: (subscriber) =>
        this.onSessionStateChange(subscriber),
      disconnect: () => this.disconnect(),
      reconnect: () => this.reconnect(),
      prepareRecovery: () => this.prepareRecovery(),
      getRecoveryDocument: () => this.getRecoveryDocument(),
      hasUnpersistedChanges: () => this.hasUnpersistedChanges(),
      whenIdle: () => this.whenIdle(),
      confirmPersistence: (signal) => this.confirmPersistence(signal),
      observePublicationOutcomes: (subscriber) =>
        this.observePublicationOutcomes(subscriber),
      dispose: () => this.dispose()
    }
  }

  private async openSocketComposition(): Promise<PreparedSocketComposition> {
    const composition = createSessionComposition(
      this.mode,
      async (publication) => {
        if (this.recoveryMode)
          throw new Error(
            'Local recovery must complete before receiving peer changes'
          )
        await this.processRemotePublication(publication)
      }
    )
    try {
      const bootstrap = await composition.provider.openDocumentSession()
      return { bootstrap, composition }
    } catch (error) {
      await composition.collaboration.dispose().catch(() => undefined)
      throw error
    }
  }

  private async activateComposition(
    prepared: PreparedSocketComposition
  ): Promise<boolean> {
    if (this.disposed || this.recoveryMode) return false
    await applyDocumentSessionBootstrapTail({
      bootstrap: prepared.bootstrap,
      applyPublication: this.processRemotePublication
    })
    if (this.disposed || this.recoveryMode) return false
    await prepared.composition.collaboration.start()
    if (this.disposed || this.recoveryMode) return false
    this.bindCurrent(prepared.composition)
    return true
  }

  private bindCurrent(composition: CollaborationSessionComposition): void {
    this.unbindCurrentObservers()
    this.current = composition
    this.unsubscribeProviderStatus = composition.provider.onStatusChange(
      (status) => {
        if (status === 'disconnected' || status === 'failed') {
          this.enterDisconnectedEpoch()
          this.scheduleReconnect()
          return
        }
        if (status === 'connected' && this.activated && !this.reconciling) {
          this.setConnected()
        }
      }
    )
    this.unsubscribeOutcomes =
      composition.collaboration.observePublicationOutcomes((outcome) => {
        this.emitOutcome(outcome)
      })
  }

  private unbindCurrentObservers(): void {
    this.unsubscribeProviderStatus?.()
    this.unsubscribeOutcomes?.()
    this.unsubscribeProviderStatus = undefined
    this.unsubscribeOutcomes = undefined
  }

  private async releaseCurrentComposition(): Promise<void> {
    const current = this.current
    if (!current) return
    this.unbindCurrentObservers()
    this.current = undefined
    await current.collaboration.dispose().catch((error) => {
      console.error(
        '[collaboration] previous document session disposal failed:',
        error
      )
    })
  }

  private scheduleLocalPublication(
    publication: SharedPublication,
    preparationError?: Error
  ): void {
    this.pendingRetention += 1
    if (preparationError) this.recoveryMode = true
    const recoveryDocument = this.recoveryMode
      ? this.captureRecoveryDocument()
      : undefined
    void this.schedule(async () => {
      try {
        if (preparationError) {
          await this.outbox.appendPreparationFailure(
            publication,
            preparationError.message,
            recoveryDocument
          )
        } else {
          await this.outbox.appendFactoryPublication(
            publication,
            recoveryDocument
          )
        }
      } catch (error) {
        this.recoveryMode = true
        try {
          await this.outbox.retainRecoveryDocument(
            this.captureRecoveryDocument()
          )
        } catch {
          // The memory draft remains available for export when storage is unavailable.
        }
        console.error(
          `[collaboration] publication ${publication.publicationId} outbox append failed:`,
          error
        )
      }
      if (preparationError) {
        this.emitOutcome({
          direction: 'local',
          status: 'send-failed',
          publicationId: publication.publicationId,
          error: preparationError
        })
      }
      if (this.recoveryMode) await this.isolateRecovery()
      if (this.state.connection === 'connected') {
        await this.drainOutbox()
      }
    })
      .finally(() => {
        this.pendingRetention -= 1
      })
      .catch((error) => {
        console.error('[collaboration] local retention failed:', error)
      })
  }

  private schedule(operation: () => Promise<void>): Promise<void> {
    const result = this.operationQueue.then(operation)
    this.operationQueue = result.catch(() => undefined)
    return result
  }

  private async drainOutbox(): Promise<void> {
    const composition = this.current
    if (
      this.disposed ||
      this.recoveryMode ||
      this.state.connection !== 'connected' ||
      this.outbox.getState().status === 'storage-failed' ||
      !composition
    ) {
      return
    }

    for (const record of this.outbox.getRecoverablePublications()) {
      if (
        this.disposed ||
        this.state.connection !== 'connected' ||
        this.current !== composition
      ) {
        return
      }
      const needsRecoveryApply =
        record.appendOrder <= this.recoveryApplyCutoff &&
        !this.recoveryAppliedPublicationIds.has(record.publicationId)
      try {
        const acceptance =
          await composition.provider.sendPublicationWithAcceptance(
            record.publication,
            async (acceptedPublication) => {
              if (!needsRecoveryApply) return
              try {
                await this.processRemotePublication(acceptedPublication)
                this.recoveryAppliedPublicationIds.add(record.publicationId)
              } catch (error) {
                await this.retainPublicationConflict(
                  record.publicationId,
                  error,
                  true
                )
                throw error
              }
            }
          )
        if (acceptance.publicationId !== record.publicationId) {
          throw new ProviderFailure(
            'acknowledgement-failed',
            '[collaboration] source acceptance publication identity mismatch',
            undefined,
            record.publicationId
          )
        }
        await this.outbox.acknowledge(acceptance)
        this.emitOutcome({
          direction: 'local',
          status: 'sent',
          publicationId: record.publicationId
        })
      } catch (error) {
        if (
          error instanceof ProviderFailure &&
          error.code === 'acknowledgement-failed'
        ) {
          try {
            if (!this.recoveryMode)
              await this.retainPublicationConflict(
                record.publicationId,
                error,
                needsRecoveryApply
              )
          } catch (storageError) {
            console.error(
              `[collaboration] publication ${record.publicationId} conflict retention failed:`,
              storageError
            )
          }
          console.error(
            `[collaboration] publication ${record.publicationId} was rejected:`,
            error
          )
          this.emitOutcome({
            direction: 'local',
            status: 'send-failed',
            publicationId: record.publicationId,
            error
          })
          return
        }
        if (this.outbox.getState().status === 'storage-failed')
          await this.recoverFromStorageFailure(needsRecoveryApply)
        console.error(
          `[collaboration] publication ${record.publicationId} send failed:`,
          error
        )
        this.emitOutcome({
          direction: 'local',
          status: 'send-failed',
          publicationId: record.publicationId,
          error
        })
        if (
          error instanceof ProviderFailure &&
          (error.code === 'not-connected' ||
            error.code === 'connection-failed' ||
            error.code === 'transport-failed')
        ) {
          this.enterDisconnectedEpoch()
          this.scheduleReconnect()
        }
        return
      }
    }
  }

  private async recoverFromStorageFailure(
    restoringReplay = false
  ): Promise<void> {
    this.recoveryMode = true
    const document = restoringReplay
      ? (this.outbox.getRecoveryDocument() ?? this.captureRecoveryDocument())
      : this.captureRecoveryDocument()
    try {
      await this.outbox.retainRecoveryDocument(document)
    } catch (error) {
      console.error('[collaboration] recovery retention failed:', error)
    } finally {
      try {
        if (restoringReplay && document !== undefined)
          this.bridge.load(document)
      } finally {
        await this.isolateRecovery()
      }
    }
  }

  private async retainPublicationConflict(
    publicationId: string,
    error: unknown,
    restoringReplay: boolean
  ): Promise<void> {
    this.recoveryMode = true
    try {
      await this.outbox.retainConflict(
        publicationId,
        error instanceof Error ? error.message : String(error),
        restoringReplay
          ? (this.outbox.getRecoveryDocument() ??
              this.captureRecoveryDocument())
          : this.captureRecoveryDocument()
      )
    } finally {
      const recoveryDocument = this.outbox.getRecoveryDocument()
      try {
        if (restoringReplay && recoveryDocument !== undefined)
          this.bridge.load(recoveryDocument)
      } finally {
        await this.isolateRecovery()
      }
    }
  }

  private attemptReconnect(): Promise<void> {
    if (this.reconnectPromise) return this.reconnectPromise
    if (this.disposed || this.recoveryMode) return Promise.resolve()
    this.reconciling = true
    this.setState({
      sync: 'reconciling'
    })
    const reconnecting = (async () => {
      let next: PreparedSocketComposition | undefined
      try {
        await this.operationQueue
        if (this.disposed || this.recoveryMode) return
        await this.releaseCurrentComposition()
        if (this.disposed || this.recoveryMode) return
        next = await this.openSocketComposition()
        await this.operationQueue
        if (this.disposed || this.recoveryMode) return
        await this.outbox.bindDocumentGeneration(
          next.bootstrap.documentGeneration ?? 0
        )
        if (this.disposed || this.recoveryMode) return
        const recoveryCutoff = this.outbox.getLastAppendOrder()
        this.bridge.load(next.bootstrap.checkpoint)
        this.recoveryApplyCutoff = recoveryCutoff
        this.recoveryAppliedPublicationIds.clear()
        if (!(await this.activateComposition(next))) return
        next = undefined
        this.reconciling = false
        this.setConnected()
        await this.schedule(() => this.drainOutbox())
      } catch (error) {
        if (
          this.outbox.getState().status === 'storage-failed' &&
          !this.disposed
        )
          await this.recoverFromStorageFailure()
        console.error('[collaboration] reconnect attempt failed:', error)
        this.reconciling = false
        this.enterDisconnectedEpoch()
      } finally {
        await next?.composition.collaboration.dispose().catch(() => undefined)
        this.reconciling = false
        if (this.recoveryMode) this.applyOutboxState(this.outbox.getState())
        this.reconnectPromise = undefined
        if (!this.disposed && this.state.connection !== 'connected') {
          this.scheduleReconnect()
        }
      }
    })()
    this.reconnectPromise = reconnecting
    return reconnecting
  }

  private scheduleReconnect(): void {
    if (
      !this.activated ||
      this.disposed ||
      this.recoveryMode ||
      this.reconnectTimer ||
      this.reconnectPromise ||
      this.state.connection === 'connected'
    ) {
      return
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      void this.attemptReconnect()
    }, RECONNECT_INTERVAL_MS)
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) return
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = undefined
  }

  private enterDisconnectedEpoch(): void {
    this.transitionConnection('disconnected')
  }

  private setConnected(): void {
    this.clearReconnectTimer()
    this.transitionConnection('connected')
    this.applyOutboxState(this.outbox.getState())
  }

  private transitionConnection(
    nextConnection: SettledCollaborationConnectionState
  ): boolean {
    const transition = resolveCollaborationConnectionTransition(
      this.state.connection,
      nextConnection
    )

    if (!transition.changed) return false
    if (nextConnection === 'disconnected') {
      this.disconnectedEpoch += 1
    }
    let notification: CollaborationSessionNotification | undefined
    if (transition.notificationType === 'disconnected') {
      notification = Object.freeze({
        id: `collaboration-disconnected-${this.disconnectedEpoch}`,
        message:
          'The document session is offline. Local editing remains available and changes will sync after reconnection.',
        type: 'disconnected'
      })
    } else if (transition.notificationType === 'reconnected') {
      notification = Object.freeze({
        id: `collaboration-reconnected-${this.disconnectedEpoch}`,
        message: 'The document session is connected and changes are syncing.',
        type: 'reconnected'
      })
    }
    this.setState({
      connection: transition.connection,
      disconnectedEpoch: this.disconnectedEpoch,
      notification
    })
    return true
  }

  private applyOutboxState(outboxState: PublicationOutboxState): void {
    let sync: CollaborationSyncState = outboxState.status
    if (this.reconciling) sync = 'reconciling'
    let notification = this.state.notification
    if (
      outboxState.status === 'storage-failed' &&
      notification?.type !== 'storage-failed'
    ) {
      notification = Object.freeze({
        id: `collaboration-storage-failed-${this.disconnectedEpoch}`,
        message:
          'Local recovery storage is unavailable. Keep this tab open while changes remain pending.',
        type: 'storage-failed'
      })
    } else if (
      outboxState.status === 'conflicted' &&
      notification?.type !== 'conflicted'
    ) {
      notification = Object.freeze({
        id: `collaboration-conflicted-${this.disconnectedEpoch}`,
        message:
          'One or more offline changes need review and remain retained locally.',
        type: 'conflicted'
      })
    }
    this.setState({
      sync,
      pendingCount: outboxState.pendingCount,
      ...(this.recoveryMode ? { recoveryAvailable: true } : {}),
      ...(notification ? { notification } : {})
    })
  }

  private setState(update: Partial<CollaborationSessionState>): void {
    const previousStatus = this.getStatus()
    const next = Object.freeze({
      ...this.state,
      ...update
    })
    if (
      next.connection === this.state.connection &&
      next.sync === this.state.sync &&
      next.recoveryAvailable === this.state.recoveryAvailable &&
      next.pendingCount === this.state.pendingCount &&
      next.disconnectedEpoch === this.state.disconnectedEpoch &&
      next.notification === this.state.notification
    ) {
      return
    }
    this.state = next
    const nextStatus = this.getStatus()
    if (nextStatus !== previousStatus) {
      ;[...this.statusSubscribers].forEach((subscriber) => {
        try {
          subscriber(nextStatus)
        } catch {
          // Status observers cannot alter the session owner.
        }
      })
    }
    ;[...this.sessionStateSubscribers].forEach((subscriber) => {
      try {
        subscriber(next)
      } catch {
        // State observers cannot alter the session owner.
      }
    })
  }

  private emitOutcome(outcome: CollaborationPublicationOutcome): void {
    const immutable = Object.freeze({ ...outcome })
    ;[...this.outcomeSubscribers].forEach((subscriber) => {
      try {
        subscriber(immutable)
      } catch {
        // Outcome observers cannot alter publication settlement.
      }
    })
  }
}

let activeController: CollaborationSessionController | undefined
let activeHandle: CollaborationDebugHandle | undefined
let startPromise: Promise<CollaborationDebugHandle> | undefined

export const getActiveCollaborationHandle = ():
  CollaborationDebugHandle | undefined => activeHandle

const createCoreCollaborationBridge = (): CoreCollaborationBridge =>
  Object.freeze({
    applyRemoteCanonicalChangeSlices: (
      input: Parameters<
        CoreCollaborationBridge['applyRemoteCanonicalChangeSlices']
      >[0]
    ) => core.applyRemoteCanonicalChangeSlices(input),
    load: (data: unknown) => core.load(data),
    subscribeToSharedPublication: (
      subscriber: Parameters<
        CoreCollaborationBridge['subscribeToSharedPublication']
      >[0]
    ) => core.subscribeToSharedPublication(subscriber)
  })

const prepareCollaborationController = async (
  mode: CollaborationMode,
  bridge: CoreCollaborationBridge
): Promise<{
  readonly bootstrap: DocumentSessionBootstrap
  readonly controller: CollaborationSessionController
  activate(): Promise<CollaborationDebugHandle>
}> => {
  idCounter.setNamespace(mode.actorId)
  const applyRemotePublication = createPublicationProcessor({
    decideRemotePublication: (publication) => publication,
    applyRemoteCanonicalChangeSlices: (
      input: AppRemoteCanonicalChangeSlicesInput
    ) =>
      bridge.applyRemoteCanonicalChangeSlices({
        origin: input.origin,
        // The App wire decoder has already produced the closed canonical
        // union. This frontend adapter is the only wire-to-Core type boundary.
        slices: input.slices as Parameters<
          CoreCollaborationBridge['applyRemoteCanonicalChangeSlices']
        >[0]['slices']
      })
  })
  const processRemotePublication = createRemotePublicationHandler(
    applyRemotePublication
  )
  const controller = new CollaborationSessionController(
    mode,
    processRemotePublication,
    bridge
  )
  activeController = controller
  let activationPromise: Promise<CollaborationDebugHandle> | undefined

  try {
    const bootstrap = await controller.prepare()
    return {
      bootstrap,
      controller,
      activate: () => {
        activationPromise ??= controller.activate().catch(async (error) => {
          await controller.dispose().catch(() => undefined)
          if (activeController === controller) {
            activeController = undefined
            activeHandle = undefined
            delete window.__Collaboration__
          }
          throw error
        })
        return activationPromise
      }
    }
  } catch (error) {
    await controller.dispose().catch(() => undefined)
    if (activeController === controller) {
      activeController = undefined
      activeHandle = undefined
      delete window.__Collaboration__
    }
    throw error
  }
}

/**
 * @deprecated Register createCollaborationDocumentSession(mode) with Core so
 * Core owns prepare/load/activate/dispose ordering.
 */
export const prepareCollaborationDocumentSession = async (
  mode: CollaborationMode
): Promise<PreparedCollaborationDocumentSession> => {
  const prepared = await prepareCollaborationController(
    mode,
    createCoreCollaborationBridge()
  )
  return {
    bootstrap: prepared.bootstrap,
    activate: prepared.activate
  }
}

export const createCollaborationDocumentSession = (
  mode: CollaborationMode
): CoreCollaborationSession => {
  let prepared:
    Awaited<ReturnType<typeof prepareCollaborationController>> | undefined
  let preparation: ReturnType<typeof prepareCollaborationController> | undefined
  let disposed = false

  return Object.freeze({
    prepare: async (bridge: CoreCollaborationBridge) => {
      if (disposed) throw new Error('Document session is disposed')
      if (preparation) {
        throw new Error('[collaboration] document session is already prepared')
      }
      preparation = prepareCollaborationController(mode, bridge)
      const next = await preparation
      if (disposed) throw new Error('Document session is disposed')
      prepared = next
      const checkpoint = prepared.bootstrap.checkpoint
      return {
        loadSource: {
          name: 'SocketDocumentSession',
          load: async () => {
            if (disposed) throw new Error('Document session is disposed')
            return checkpoint
          }
        }
      }
    },
    activate: async () => {
      if (disposed) throw new Error('Document session is disposed')
      if (!prepared) {
        throw new Error(
          '[collaboration] document session must be prepared before activation'
        )
      }
      await prepared.activate()
    },
    dispose: async () => {
      disposed = true
      // Preparation retains its own rejection; disposal still settles its resources.
      const settled = prepared ?? (await preparation?.catch(() => undefined))
      const controller = settled?.controller
      prepared = undefined
      if (activeController === controller) {
        activeController = undefined
        activeHandle = undefined
        delete window.__Collaboration__
      }
      await controller?.dispose()
    }
  })
}

export const startCollaboration = (
  mode: CollaborationMode
): Promise<CollaborationDebugHandle> => {
  if (startPromise) return startPromise
  const pendingStart = prepareCollaborationDocumentSession(mode)
    .then((prepared) => prepared.activate())
    .catch((error) => {
      startPromise = undefined
      throw error
    })
  startPromise = pendingStart
  return pendingStart
}

export const disposeCollaboration = async (): Promise<void> => {
  const controller = activeController
  activeController = undefined
  activeHandle = undefined
  startPromise = undefined
  delete window.__Collaboration__
  await controller?.dispose()
}

export const resetCollaborationDocument = async (
  fileId: string
): Promise<void> => {
  const normalizedFileId = fileId.trim()
  if (!normalizedFileId) {
    throw new Error('[collaboration] document Reset fileId is required')
  }
  const controller = activeController
  if (controller) {
    if (controller.identity.documentId !== normalizedFileId) {
      throw new Error(
        '[collaboration] document Reset does not match the active session'
      )
    }
    await controller.resetDocument()
    if (activeController === controller) {
      activeController = undefined
      activeHandle = undefined
      startPromise = undefined
      delete window.__Collaboration__
    }
    return
  }

  const outbox = createPublicationOutbox(normalizedFileId)
  await outbox.initialize()
  await outbox.clear()
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => void disposeCollaboration())
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_COLLABORATION_WS_URL?: string
  }
}
