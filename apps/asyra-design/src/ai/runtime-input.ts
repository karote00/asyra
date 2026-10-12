import {
  createAiToolContract,
  createAiToolMiddleware,
  createAiInvoker
} from '@asyra/ai-agent-runtime'
import { operationInputIssue } from './tool-schema'
import { designActionOutcome } from './tool-contract'
import core from '../contexts'
import { createRetainedDesignContext } from '../common-apis/retained-design-context'
import { observeDesignChanges } from '../common-apis/design-review'
import { createRetainedFillAction } from './retained-fill-action'
import { getActiveCollaborationHandle } from '../collaboration/lifecycle'
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
  readonly createRecordingSink?: CreateAiAgentRuntimeInput['createRecordingSink']
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
): AiActionDefinition => {
  const contract = createAiToolContract(definition)
  const middleware = createAiToolMiddleware({
    resolve: (name) => (name === contract.name ? contract : undefined),
    validate: operationInputIssue,
    classify: designActionOutcome
  })
  return {
    ...contract,
    execute: async (input, context) => {
      const started = now()
      let result
      try {
        result = await createAiInvoker({
          execute: () => definition.execute(input, context),
          middleware: [middleware]
        }).invoke({ name: contract.name, input, signal: context.signal })
      } catch (error) {
        recordActionFailure(
          error,
          definition.name,
          Math.max(0, now() - started)
        )
        throw error
      }
      if (!result || typeof result !== 'object' || Array.isArray(result))
        return result
      return {
        ...result,
        toolOutcome: designActionOutcome(result),
        actionObservation: {
          handlerMs: Math.max(0, now() - started),
          executor: 'app-browser'
        }
      }
    }
  }
}

export const createAiRuntimeInput = (
  options: CreateAiRuntimeInputOptions
): CreateAiAgentRuntimeInput => {
  const evidence = createInspectionEvidence()
  const queries = createRetainedDesignContext(core, observeDesignChanges)
  const transactionRunner =
    options.transactionRunner ?? createAiTransactionRunner()
  return {
    createRecordingSink: options.createRecordingSink,
    actionDefinitions: [
      ...createBasicApiActions(),
      ...createAiActions(undefined, {
        confirmPersistence: async (signal) => {
          const session = getActiveCollaborationHandle()
          if (!session) return { status: 'local-only' }
          return {
            status: 'durable',
            ...(await session.confirmPersistence(signal))
          }
        }
      }),
      createPreparedDesignAction(),
      createDocumentContextAction(queries.read),
      createRetainedFillAction(queries),
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
    ownedResources: [...(options.ownedResources ?? []), evidence, queries],
    permissionPolicy: createAiPermissionPolicy(options.permissionRules),
    provider: options.provider,
    transactionRunner: {
      run: async (label, execute, request) => {
        try {
          return await transactionRunner.run(label, execute, request)
        } finally {
          if (request?.signal) queries.releaseFor(request.signal)
        }
      }
    }
  }
}
