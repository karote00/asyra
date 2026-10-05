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
  name: AiActionNames.INSPECT_DRAWING,
  description:
    'Inspect an existing drawing or composition using its actual rendered image and current evidence. Fetch needed object data separately through read_design_context. Default overview renders the entire subtree into a bounded composition preview without changing source images, vectors or dimensions. Use view=detail for native-resolution close-ups, or region in target-local coordinates at most 1024 per side. A region is always native detail, never an overview. Read-only; does not change the document. Use the returned image to compare the complete result with the original request/reference, then make supported corrections and inspect again.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['elementId'],
    properties: {
      elementId: { type: 'string', minLength: 1 },
      view: { type: 'string', enum: ['overview', 'detail'] },
      region: {
        type: 'object',
        additionalProperties: false,
        required: ['x', 'y', 'width', 'height'],
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number', exclusiveMinimum: 0, maximum: 1024 },
          height: { type: 'number', exclusiveMinimum: 0, maximum: 1024 }
        }
      }
    }
  },
  execute: async (args, { signal }) => {
    if (signal.aborted) throw new Error('Drawing inspection cancelled')
    const capture = () => {
      if (args.view) return inspect(args.elementId, args.region, args.view)
      return args.region
        ? inspect(args.elementId, args.region)
        : inspect(args.elementId)
    }
    const result = evidence ? await evidence.capture(capture) : await capture()
    signal.throwIfAborted()
    return result
  }
})

export const createInspectionValidationAction = (
  evidence: ReturnType<typeof createInspectionEvidence>
): AiActionDefinition<{
  evidence: { sessionId: string; revision: number }
  scope?: InspectionScopeQuery
}> => ({
  name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
  description:
    'Check whether an App-issued inspection stamp still matches the canonical document. Read-only validity check; optional requiredIds and overviewIds check canonical containment without rendering or visual judgment. Stamp-only checks take constant work. Missing, retired or changed evidence is not current.',
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
      evidence: {
        type: 'object',
        additionalProperties: false,
        required: ['sessionId', 'revision'],
        properties: {
          sessionId: { type: 'string', minLength: 1 },
          revision: { type: 'integer', minimum: 0 }
        }
      }
    }
  },
  execute: async (args, { signal }) => {
    signal.throwIfAborted()
    return evidence.validate(args.evidence, args.scope)
  }
})
