import { recordActionFailure } from './action-failure'
import { createBasicApiActions } from './basic-api-actions'
import type {
  AiActionDefinition,
  AiProvider,
  AiRuntimeOptions,
  AiRuntimeOwnedResource,
  AiTransactionRunner,
  CreateAiAgentRuntimeInput
} from '@asyra/ai-agent-runtime'
import { createDesignReviewAction } from './review-action'
import { createArrangementAction } from './arrangement-action'
import { createOrganizationAction } from './organization-action'
import { createDesignEditAction } from './design-edit-action'
import { createDocumentContextAction } from './context-action'
import {
  createAiInspectionAction,
  createInspectionValidationAction
} from './inspection'
import { createInspectionEvidence } from '../common-apis/inspection-evidence'
import { createAiActions } from './actions'
import { createPreparedDesignAction } from './design-actions'
import {
  createAiConfirmationHandler,
  type AiConfirmationRequest
} from './confirmation'
import { createAiContextProvider } from './context'
import { createAiPermissionPolicy, type AiPermissionRules } from './permission'
import { createAiTransactionRunner } from './transaction'

export interface CreateAiRuntimeInputOptions {
  readonly provider: AiProvider
  readonly permissionRules: AiPermissionRules
  readonly requestConfirmation?: AiConfirmationRequest
  readonly runtimeOptions?: AiRuntimeOptions
  readonly ownedResources?: readonly AiRuntimeOwnedResource[]
  readonly transactionRunner?: AiTransactionRunner
}

/** Handler elapsed time is observed in the browser, not inferred from transport. */
export const observeAiAction = (
  definition: AiActionDefinition,
  now: () => number = () => performance.now()
): AiActionDefinition => ({
  ...definition,
  execute: async (input, context) => {
    const started = now()
    let result
    try {
      result = await definition.execute(input, context)
    } catch (error) {
      recordActionFailure(error, definition.name, Math.max(0, now() - started))
      throw error
    }
    if (!result || typeof result !== 'object' || Array.isArray(result))
      return result
    return {
      ...result,
      actionObservation: {
        handlerMs: Math.max(0, now() - started),
        executor: 'app-browser'
      }
    }
  }
})

export const createAiRuntimeInput = (
  options: CreateAiRuntimeInputOptions
): CreateAiAgentRuntimeInput => {
  const evidence = createInspectionEvidence()
  return {
    actionDefinitions: [
      ...createBasicApiActions(),
      ...createAiActions(),
      createPreparedDesignAction(),
      createDocumentContextAction(),
      createDesignEditAction(),
      createOrganizationAction(),
      createArrangementAction(),
      createDesignReviewAction(undefined, evidence),
      createAiInspectionAction(undefined, evidence),
      createInspectionValidationAction(evidence)
    ].map((definition) => observeAiAction(definition)),
    confirmationHandler: createAiConfirmationHandler(
      options.requestConfirmation
    ),
    contextProvider: createAiContextProvider(),
    options: { ...options.runtimeOptions, failurePolicy: 'preserve-progress' },
    ownedResources: [...(options.ownedResources ?? []), evidence],
    permissionPolicy: createAiPermissionPolicy(options.permissionRules),
    provider: options.provider,
    transactionRunner: options.transactionRunner ?? createAiTransactionRunner()
  }
}
