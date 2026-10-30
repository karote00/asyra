import {
  AiToolContractError,
  runAiMutation,
  type AiActionDefinition
} from '@asyra/ai-agent-runtime'
import core from '../contexts'
import { prepareDesignElementEdit } from '../common-apis/design-edit'
import type { createInspectionEvidence } from '../common-apis/inspection-evidence'
import type { createDesignReviewer } from '../common-apis/design-review'
import {
  actionToolSemantics,
  toolResultObject,
  toolResultIds,
  toolResultStatus
} from './tool-contract'
import {
  prescribedPositionInputSchema,
  type PrescribedPositionInput
} from './prescribed-position-contract'
import { AiActionNames } from '../constants'

/** Preflight and execute one prescribed edit set inside the existing mutation owner. */
export const createPrescribedPositionAction = (
  reviewer: Pick<ReturnType<typeof createDesignReviewer>, 'isCurrent'>,
  evidence: Pick<
    ReturnType<typeof createInspectionEvidence>,
    'isAttachmentCurrent'
  >,
  apis = {
    read: (id: string) => core.getElementData(id),
    prepare: prepareDesignElementEdit,
    workspace: () => core.getCurrentWorkspaceId()
  }
): AiActionDefinition<PrescribedPositionInput> => ({
  ...actionToolSemantics(
    AiActionNames.APPLY_PRESCRIBED_POSITIONS,
    toolResultObject({
      status: toolResultStatus,
      appliedElementIds: toolResultIds
    })
  ),
  name: AiActionNames.APPLY_PRESCRIBED_POSITIONS,
  description:
    'Apply an explicitly prescribed parent-local position set after all canonical checks and attachment bases remain current. Preflight the entire set before writing. Does not infer repairs or certify visual quality.',
  inputSchema: prescribedPositionInputSchema,
  execute: async (input, context) => {
    context.signal.throwIfAborted()
    return runAiMutation(context, () => {
      context.signal.throwIfAborted()
      const prepared = (() => {
        try {
          if (
            !input.evidence.length ||
            !input.evidence.every((stamp) => reviewer.isCurrent(stamp))
          ) {
            throw new Error(
              'Mechanical check evidence expired before application.'
            )
          }
          if (
            !input.positions.length ||
            new Set(input.positions.map((item) => item.elementId)).size !==
              input.positions.length
          ) {
            throw new Error('Prescribed positions require unique targets.')
          }
          return input.positions.map((position) => {
            const { elementId, x, y, attachmentEvidence: attachment } = position
            const target = apis.read(elementId)
            if (
              !target ||
              target.parentId !== attachment.parentId ||
              apis.workspace() !== attachment.workspaceId
            ) {
              throw new Error('Prescribed parent changed before application.')
            }
            if (
              !evidence.isAttachmentCurrent(
                attachment.evidence,
                attachment.parentId
              )
            ) {
              throw new Error(
                'Prescribed attachment evidence expired before application.'
              )
            }
            if (
              ![x, y].every(
                (value) =>
                  Number.isFinite(value) && value >= 0 && value <= 100000
              )
            ) {
              throw new Error(
                'Prescribed local position is outside the supported range.'
              )
            }
            return apis.prepare({ elementId, properties: { x, y } })
          })
        } catch (error) {
          // Every check and edit preparation above is read-only; writers run below.
          throw new AiToolContractError(
            'input',
            error instanceof Error ? error.message : String(error)
          )
        }
      })()
      const appliedElementIds = prepared.flatMap(
        (apply) => apply().appliedElementIds
      )
      return {
        status: appliedElementIds.length ? 'complete' : 'no-change',
        appliedElementIds
      }
    })
  }
})
