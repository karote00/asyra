import { createBrowserRecordOutbox } from './record-outbox'
import { AI_EXECUTION_RECORD_ENDPOINT } from './action-batch-endpoint'
import { basicApiPermissionRules } from './basic-api-catalog'
import {
  createAiAgentRuntime,
  createRecordDeliveryHost,
  type ExecutionRecord,
  type ExecutionRecordDeliveryIssue,
  type AiAgentRuntime,
  type AiProvider
} from '@asyra/ai-agent-runtime'
import { AiActionNames } from '../constants'
import {
  createAiHistoryProjection,
  type AiHistoryProjection
} from '../common-apis/history'
import { createAiRuntimeInput } from './runtime-input'
import {
  createAiConfirmationBroker,
  type AiConfirmationBroker
} from './confirmation'
import { createServerActionBatchProvider } from './server-action-batch-provider'
import { createAiTransactionRunner } from './transaction'

export interface AiStartup {
  readonly confirmation: AiConfirmationBroker
  readonly history: AiHistoryProjection
  readonly runtime: AiAgentRuntime
}

interface AiStartupFactories {
  readonly createConfirmation: () => AiConfirmationBroker
  readonly createHistory: () => AiHistoryProjection
  readonly createProvider: () => AiProvider
}

const defaultFactories: AiStartupFactories = {
  createConfirmation: createAiConfirmationBroker,
  createHistory: createAiHistoryProjection,
  createProvider: createServerActionBatchProvider
}

export const createAiStartup = (
  factories: AiStartupFactories = defaultFactories
): AiStartup => {
  const confirmation = factories.createConfirmation()
  const history = factories.createHistory()
  const outbox = createBrowserRecordOutbox()
  let deliveryClosed = false
  const deliveryOptions = {
    outbox,
    onIssue: (issue: ExecutionRecordDeliveryIssue) => {
      console.warn(
        JSON.stringify({ event: 'ai_record_delivery_incomplete', ...issue })
      )
    },
    send: async (records: readonly ExecutionRecord[]) => {
      const response = await fetch(AI_EXECUTION_RECORD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
        signal: AbortSignal.timeout(10_000)
      })
      if (!response.ok) {
        const failure = await response.json().catch(() => undefined)
        const code =
          typeof failure?.code === 'string' &&
          /^AI_RECORD_[A-Z_]+$/.test(failure.code)
            ? failure.code
            : 'AI_RECORD_DELIVERY_INCOMPLETE'
        throw new Error(`HTTP ${response.status} ${code}`)
      }
      const receipt = await response.json()
      if (
        typeof receipt?.complete !== 'boolean' ||
        typeof receipt?.requestId !== 'string' ||
        !Number.isSafeInteger(receipt?.acknowledgedSequence)
      )
        throw new Error('Invalid execution record receipt')
      return receipt
    }
  }
  const deliveryHost = createRecordDeliveryHost(deliveryOptions)
  let recovery = Promise.resolve()
  const reconnect = () => {
    if (deliveryClosed) return
    recovery = recovery.then(async () => {
      if (!deliveryClosed) await deliveryHost.recover()
    })
  }
  let runtime: AiAgentRuntime | undefined
  try {
    const provider = factories.createProvider()
    runtime = createAiAgentRuntime(
      createAiRuntimeInput({
        permissionRules: {
          ...basicApiPermissionRules,
          [AiActionNames.APPLY_PREPARED_DESIGN]: 'allow',
          [AiActionNames.ORGANIZE_DESIGN]: 'allow',
          [AiActionNames.ARRANGE_DESIGN]: 'allow',
          [AiActionNames.REVIEW_DESIGN]: 'allow',
          [AiActionNames.UPDATE_DESIGN_ELEMENT]: 'allow',
          [AiActionNames.READ_DESIGN_CONTEXT]: 'allow',
          [AiActionNames.RESOLVE_DESIGN_TARGETS]: 'allow',
          [AiActionNames.READ_DESIGN_ATTACHMENT]: 'allow',
          [AiActionNames.RELEASE_DESIGN_CONTEXT]: 'allow',
          [AiActionNames.MAP_RETAINED_FILLS]: 'allow',
          [AiActionNames.INSPECT_DRAWING]: 'allow',
          [AiActionNames.VALIDATE_INSPECTION_EVIDENCE]: 'allow',
          [AiActionNames.REPORT_OUTCOME]: 'allow',
          [AiActionNames.REPLACE_VECTOR_COMPOSITION]: 'allow',
          [AiActionNames.REQUEST_CLARIFICATION]: 'allow',
          [AiActionNames.INSERT_VECTOR_COMPOSITION]: 'allow',
          [AiActionNames.REMOVE_AI_COMPOSITION]: 'allow',
          [AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE]: 'allow',
          [AiActionNames.SELECT_ELEMENTS]: 'allow',
          [AiActionNames.SET_ELEMENT_VISIBILITY]: 'allow',
          [AiActionNames.UPDATE_COMPOSITION_ELEMENTS]: 'allow'
        },
        provider,
        createRecordingSink: () => deliveryHost.createSink(),
        ownedResources: [
          {
            dispose: async () => {
              deliveryClosed = true
              globalThis.removeEventListener?.('online', reconnect)
              await recovery
              await deliveryHost.dispose()
              await outbox.close()
            }
          }
        ],
        requestConfirmation: confirmation.requestConfirmation,
        transactionRunner: createAiTransactionRunner({ history })
      })
    )

    globalThis.addEventListener?.('online', reconnect)
    reconnect()
    return Object.freeze({
      confirmation,
      history,
      runtime
    })
  } catch (error) {
    deliveryClosed = true
    globalThis.removeEventListener?.('online', reconnect)
    void deliveryHost.dispose().finally(() => outbox.close())
    history.dispose()
    void Promise.allSettled([
      confirmation.dispose(),
      ...(runtime ? [runtime.dispose()] : [])
    ])
    throw error
  }
}
