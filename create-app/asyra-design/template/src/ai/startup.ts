import {
  createAiAgentRuntime,
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
  let runtime: AiAgentRuntime | undefined
  try {
    const provider = factories.createProvider()
    runtime = createAiAgentRuntime(
      createAiRuntimeInput({
        permissionRules: {
          [AiActionNames.APPLY_PREPARED_DESIGN]: 'allow',
          [AiActionNames.ORGANIZE_DESIGN]: 'allow',
          [AiActionNames.ARRANGE_DESIGN]: 'allow',
          [AiActionNames.REVIEW_DESIGN]: 'allow',
          [AiActionNames.UPDATE_DESIGN_ELEMENT]: 'allow',
          [AiActionNames.READ_DESIGN_CONTEXT]: 'allow',
          [AiActionNames.INSPECT_DRAWING]: 'allow',
          [AiActionNames.REPORT_OUTCOME]: 'allow',
          [AiActionNames.REPLACE_VECTOR_COMPOSITION]: 'confirm',
          [AiActionNames.REQUEST_CLARIFICATION]: 'allow',
          [AiActionNames.INSERT_VECTOR_COMPOSITION]: 'allow',
          [AiActionNames.REMOVE_AI_COMPOSITION]: 'confirm',
          [AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE]: 'allow',
          [AiActionNames.SELECT_ELEMENTS]: 'allow',
          [AiActionNames.SET_ELEMENT_VISIBILITY]: 'allow',
          [AiActionNames.UPDATE_COMPOSITION_ELEMENTS]: 'allow'
        },
        provider,
        requestConfirmation: confirmation.requestConfirmation,
        transactionRunner: createAiTransactionRunner({ history })
      })
    )

    return Object.freeze({
      confirmation,
      history,
      runtime
    })
  } catch (error) {
    history.dispose()
    void Promise.allSettled([
      confirmation.dispose(),
      ...(runtime ? [runtime.dispose()] : [])
    ])
    throw error
  }
}
