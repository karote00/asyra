import {
  toolResultBoolean,
  toolDocumentReference,
  toolResultObject,
  toolResultString,
  actionToolSemantics
} from './tool-contract'
import { inspectionEvidenceSchema } from './inspection-evidence'
import { inspectionInputSchema } from './inspection-schema'
import type {
  createInspectionEvidence,
  InspectionScopeQuery
} from '../common-apis/inspection-evidence'
import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import { inspectionApis } from '../common-apis'
import { AiActionNames } from '../constants'

export const createAiInspectionAction = (
  inspect: (
    elementId: string,
    region?: { x: number; y: number; width: number; height: number },
    view?: 'overview' | 'detail'
  ) => unknown = inspectionApis.inspect,
  evidence?: ReturnType<typeof createInspectionEvidence>
): AiActionDefinition<{
  elementId: string
  region?: { x: number; y: number; width: number; height: number }
  view?: 'overview' | 'detail'
}> => ({
  ...actionToolSemantics(
    AiActionNames.INSPECT_DRAWING,
    toolResultObject({
      available: { const: true },
      image: toolResultObject({ dataUrl: toolResultString })
    })
  ),
  name: AiActionNames.INSPECT_DRAWING,
  description:
    'Inspect an existing drawing or composition using its actual rendered image and current evidence. Fetch needed object data separately through read_design_context. Default overview renders the entire subtree into a bounded composition preview without changing source images, vectors or dimensions. Use view=detail for native-resolution close-ups, or region in target-local coordinates at most 1024 per side. A region is always native detail, never an overview. Read-only; does not change the document. Use the returned image to compare the complete result with the original request/reference, then make supported corrections and inspect again.',
  inputSchema: inspectionInputSchema,
  execute: async (args, { signal }) => {
    if (signal.aborted) throw new Error('Drawing inspection cancelled')
    const capture = () => {
      if (args.view) return inspect(args.elementId, args.region, args.view)
      return args.region
        ? inspect(args.elementId, args.region)
        : inspect(args.elementId)
    }
    const result = evidence
      ? await evidence.capture(capture, args)
      : await capture()
    signal.throwIfAborted()
    return result
  }
})

export const createInspectionValidationAction = (
  evidence: ReturnType<typeof createInspectionEvidence>
): AiActionDefinition<{
  evidence: { sessionId: string; revision: number; receiptId?: string }
  scope?: InspectionScopeQuery
}> => ({
  ...actionToolSemantics(
    AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
    toolResultObject({
      current: toolResultBoolean,
      validatedAt: inspectionEvidenceSchema
    })
  ),
  revision: 3,
  name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
  description:
    'Check whether an App-issued stamp still has current canonical dependencies. Scoped visual receipts may survive unrelated document edits; unscoped stamps require the original document revision. Read-only validity check; optional requiredIds and overviewIds check canonical containment without rendering or visual judgment. Unchanged stamp checks take constant work; pending regions recheck spatial membership. Missing, retired or changed evidence is not current.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['evidence'],
    properties: {
      scope: {
        type: 'object',
        additionalProperties: false,
        required: ['requiredIds', 'overviewIds'],
        properties: {
          requiredIds: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: { type: 'string', minLength: 1 }
          },
          overviewIds: {
            type: 'array',
            uniqueItems: true,
            items: { type: 'string', minLength: 1 }
          }
        }
      },
      evidence: inspectionEvidenceSchema
    }
  },
  execute: async (args, { signal }) => {
    signal.throwIfAborted()
    return evidence.validate(args.evidence, args.scope)
  }
})

export const createDesignAttachmentAction = (
  evidence: ReturnType<typeof createInspectionEvidence>
): AiActionDefinition<{ parentId?: string }> => ({
  ...actionToolSemantics(
    AiActionNames.READ_DESIGN_ATTACHMENT,
    toolResultObject({
      available: { const: true },
      workspaceId: toolDocumentReference,
      parentId: toolDocumentReference,
      evidence: inspectionEvidenceSchema,
      basis: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['x', 'y'],
          properties: { x: { type: 'number' }, y: { type: 'number' } }
        }
      }
    })
  ),
  name: AiActionNames.READ_DESIGN_ATTACHMENT,
  description:
    'Read the actual editable attachment parent, its local bounds and local-to-workspace basis under a canonical scene stamp. Omit parentId for the current workspace. Reads only the ancestor chain, never all children. Use for attachment-dependent preparation; this is geometry evidence, not visual approval.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { parentId: toolDocumentReference }
  },
  execute: async ({ parentId }, { signal }) => {
    signal.throwIfAborted()
    const result = await evidence.attachment(parentId)
    signal.throwIfAborted()
    return result
  }
})
