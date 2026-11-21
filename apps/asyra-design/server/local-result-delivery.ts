import { AiToolInputError } from '@asyra/ai-agent-runtime'
import {
  resultDelivery,
  resolveNamedResultInputs,
  type DeliveryRequest,
  type AiToolImage,
  type ExchangeConversationResults
} from '@asyra/ai-agent-runtime'
import { localToolImages } from './local-tool-media'
import { containsExpression } from './local-design-sequence'

/** Design alone translates stage/apply identities before generic named lookup. */
export async function resolveConversationInputs(
  input: Record<string, unknown>,
  exchange?: ExchangeConversationResults,
  authoredInput?: (operation: Record<string, unknown>) => unknown
) {
  const ops = input.operations ?? input.stages

  if (!Array.isArray(ops)) {
    return input
  }

  const producers = new Map(
    Object.entries((input as DeliveryRequest).retain ?? {})
  )
  const normalized = await resolveNamedResultInputs(
    {
      operations: ops,
      ...(input.iteration ? { iteration: input.iteration } : {})
    },
    producers,
    exchange,
    authoredInput
      ? (selector) => {
          const operations = input.stages
            ? (
                input.stages as {
                  id: string
                  operations: Record<string, unknown>[]
                  apply: Record<string, unknown>[]
                }[]
              ).flatMap((stage) => [
                ...stage.operations.map((s, i) => ({
                  ...s,
                  id: s.id ?? stage.id + '-prepare-' + (i + 1)
                })),
                ...stage.apply.map((s, i) => ({
                  ...s,
                  id: s.id ?? stage.id + '-apply-' + (i + 1)
                }))
              ])
            : (ops as Record<string, unknown>[])
          const source = operations.find(
            (operation, i) =>
              (operation.id ?? 'step-' + (i + 1)) === selector.step
          )

          if (!source) {
            throw new AiToolInputError(
              'Unavailable authored input: ' + selector.step
            )
          }

          return authoredInput(source)
        }
      : undefined,
    containsExpression
  )

  if (
    !normalized ||
    typeof normalized !== 'object' ||
    !('operations' in normalized)
  ) {
    throw new AiToolInputError('Invalid normalized named inputs')
  }

  return {
    ...input,
    [input.stages ? 'stages' : 'operations']: normalized.operations,
    ...('iteration' in normalized ? { iteration: normalized.iteration } : {})
  }
}

/** Design declares image-producing receipts; shared delivery never guesses action names. */
export const createDesignResultDelivery = (
  request: DeliveryRequest,
  exchange?: ExchangeConversationResults,
  deliverImages?: (images: AiToolImage[], name: string) => void
) =>
  resultDelivery(
    request,
    exchange,
    deliverImages,
    localToolImages,
    'execute_design'
  )
