import {
  toolResultBoolean,
  toolDocumentReference,
  toolResultCount,
  toolResultIds,
  toolResultObject,
  actionToolSemantics
} from './tool-contract'
import type { InspectionEvidenceStamp } from './inspection-evidence'
import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import { reviewDesign } from '../common-apis/design-review'
import { AiActionNames } from '../constants'
type ReviewResult = Awaited<ReturnType<typeof reviewDesign>>
type ReviewHandler = (...args: Parameters<typeof reviewDesign>) => Promise<
  Omit<ReviewResult, 'observation'> &
    Partial<Pick<ReviewResult, 'observation'>> & {
      evidence?: InspectionEvidenceStamp
    }
>
export const createDesignReviewAction = (
  review: ReviewHandler = reviewDesign,
  isCurrent?: (stamp: InspectionEvidenceStamp) => boolean
): AiActionDefinition<{ elementId: string }> => ({
  ...actionToolSemantics(
    AiActionNames.REVIEW_DESIGN,
    toolResultObject(
      {
        verification: toolResultObject({
          status: {
            type: 'string',
            enum: ['pass', 'repairable', 'decision-required']
          },
          progress: { type: 'string', minLength: 64, maxLength: 64 }
        }),
        complete: toolResultBoolean,
        truncated: toolResultBoolean,
        checkedElements: toolResultCount,
        measuredTextCount: toolResultCount,
        measuredTextIds: toolResultIds,
        findings: { type: 'array', items: { type: 'object' } },
        observation: toolResultObject(
          Object.fromEntries(
            [
              'aggregatedNodes',
              'evaluatedNodes',
              'reusedNodes',
              'metadataReads',
              'computedReads',
              'textMeasurements'
            ].map((key) => [key, toolResultCount])
          )
        )
      },
      [
        'verification',
        'complete',
        'truncated',
        'checkedElements',
        'measuredTextCount',
        'measuredTextIds',
        'findings'
      ]
    )
  ),
  revision: 5,
  composition: 'allowed',
  verification: {
    statusPath: '/verification/status',
    progressPath: '/verification/progress'
  },
  name: AiActionNames.REVIEW_DESIGN,
  description:
    'Read-only deterministic review of the complete target subtree in cooperative chunks: measure real text content against its layout box and check unrotated child bounds. No screenshot. Fix concrete findings using current IDs, then explicitly review the corrected target. Capturing an image is independent. Complete means supported checks ran. The verification verdict covers only mechanical findings and supports explicit bounded repair recipes; it never certifies appearance or brief compliance. Truncation and unavailable checks must not be reported as full verification.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['elementId'],
    properties: { elementId: { ...toolDocumentReference, maxLength: 256 } }
  },
  execute: async ({ elementId }, { signal }) => {
    if (signal.aborted) throw new Error('Design review cancelled.')
    const measure = async () => {
      const measurement = await review(elementId, signal)
      let status: 'pass' | 'repairable' | 'decision-required' =
        'decision-required'
      if (measurement.complete && !measurement.truncated) {
        if (!measurement.findings.length) status = 'pass'
        else if (
          measurement.findings.every((finding) =>
            ['text-overflow', 'container-overflow'].includes(finding.kind)
          )
        )
          status = 'repairable'
      }
      const pending = measurement.findings
        .map((finding) =>
          Object.fromEntries(
            Object.entries(finding).sort(([a], [b]) => a.localeCompare(b))
          )
        )
        .map((finding) => JSON.stringify(finding))
        .sort()
      const digest = await globalThis.crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(
          JSON.stringify({
            elementId,
            complete: measurement.complete,
            truncated: measurement.truncated,
            pending
          })
        )
      )
      signal.throwIfAborted()
      if (measurement.evidence && !isCurrent?.(measurement.evidence))
        return {
          ...measurement,
          available: false,
          complete: false,
          evidence: undefined,
          verification: {
            status: 'decision-required',
            progress: Array.from(new Uint8Array(digest), (byte) =>
              byte.toString(16).padStart(2, '0')
            ).join('')
          }
        }
      return {
        ...measurement,
        verification: {
          status,
          progress: Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, '0')
          ).join('')
        }
      }
    }
    return measure()
  }
})
