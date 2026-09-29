import { createBasicApiActions } from './basic-api-actions'
import type {
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
import { createAiInspectionAction } from './inspection'
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

export const createAiRuntimeInput = (
  options: CreateAiRuntimeInputOptions
): CreateAiAgentRuntimeInput => ({
  actionDefinitions: [
    ...createBasicApiActions(),
    ...createAiActions(),
    createPreparedDesignAction(),
    createDocumentContextAction(),
    createDesignEditAction(),
    createOrganizationAction(),
    createArrangementAction(),
    createDesignReviewAction(),
    createAiInspectionAction()
  ],
  confirmationHandler: createAiConfirmationHandler(options.requestConfirmation),
  contextProvider: createAiContextProvider(),
  options: { ...options.runtimeOptions, failurePolicy: 'preserve-progress' },
  ownedResources: options.ownedResources,
  permissionPolicy: createAiPermissionPolicy(options.permissionRules),
  provider: options.provider,
  transactionRunner: options.transactionRunner ?? createAiTransactionRunner()
})
