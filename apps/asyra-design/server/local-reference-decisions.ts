import { isDeepStrictEqual } from 'node:util'
import { operationInputIssue } from './operation-input-schema'
import { imageRegionSchema } from './local-image-tools'

export interface ReferenceIdentity {
  attachmentIndex: number
  referenceId: string
  validation?: { width: number; height: number }
}
interface ReferenceDecision {
  referenceId: string
  status: 'pending' | 'accepted' | 'restricted' | 'rejected'
  reason: string
  criterionIds: string[]
  limitations: string[]
  sourceRegion?: { x: number; y: number; width: number; height: number }
}
export interface RetainedReferenceDecision extends ReferenceDecision {
  author: 'model'
  requirementRevision: number
}
const decisionText = { type: 'string', minLength: 1, maxLength: 1000 }
export const referenceDecisionProperties = {
  requirementRevision: {
    type: 'integer',
    minimum: 1,
    description:
      'Current requirementRevision returned by criteria or reference selection. Required when recording decisions.'
  },
  referenceDecisions: {
    type: 'array',
    maxItems: 24,
    description:
      'Batched model assessments of retained candidate images. Use immutable referenceId from import/validation, not a URL or invented ID. Accepted/restricted decisions specify exact criterionIds. Restricted decisions state limitations. Rejected images remain stored but are excluded from comparison.',
    items: {
      type: 'object',
      additionalProperties: false,
      required: [
        'referenceId',
        'status',
        'reason',
        'criterionIds',
        'limitations'
      ],
      properties: {
        referenceId: decisionText,
        status: {
          type: 'string',
          enum: ['pending', 'accepted', 'restricted', 'rejected']
        },
        reason: decisionText,
        criterionIds: {
          type: 'array',
          maxItems: 24,
          uniqueItems: true,
          items: decisionText
        },
        limitations: { type: 'array', maxItems: 24, items: decisionText },
        sourceRegion: imageRegionSchema
      }
    }
  }
}
const decisionInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: referenceDecisionProperties
}

/** Semantic applicability only; the image owner retains bytes and decode evidence. */
export const createReferenceDecisions = () => {
  let requirements: unknown
  let requirementRevision = 0
  let decisions = new Map<string, RetainedReferenceDecision>()
  const identities = new Map<number, ReferenceIdentity>()
  const applicable = (id: string, criterionId: string) => {
    const decision = decisions.get(id)
    return (
      !!decision &&
      decision.requirementRevision === requirementRevision &&
      ['accepted', 'restricted'].includes(decision.status) &&
      decision.criterionIds.includes(criterionId)
    )
  }
  return {
    setRequirements(value: unknown) {
      if (!isDeepStrictEqual(requirements, value)) {
        requirements = structuredClone(value)
        requirementRevision++
      }
    },
    revision: () => requirementRevision,
    applicable,
    update(
      resolve: (referenceIds: string[]) => ReferenceIdentity[],
      input: unknown
    ) {
      const issue = operationInputIssue(input, decisionInputSchema)
      if (issue) throw new Error(issue)
      const value = input as {
        requirementRevision?: number
        referenceDecisions?: ReferenceDecision[]
      }
      const additions = value.referenceDecisions ?? []
      if (
        value.referenceDecisions !== undefined &&
        value.requirementRevision !== requirementRevision
      )
        throw new Error(
          `Reference decisions require current requirementRevision ${requirementRevision}.`
        )
      const known = resolve(additions.map((decision) => decision.referenceId))
      const nextIdentities = new Map(identities)
      known.forEach((item) => nextIdentities.set(item.attachmentIndex, item))
      if (
        new Set(additions.map((item) => item.referenceId)).size !==
        additions.length
      )
        throw new Error('Reference decisions require unique identities.')
      const criteria = Object.keys(
        (requirements as Record<string, unknown>) ?? {}
      )
      const next = new Map(decisions)
      const changedIds: string[] = []
      for (const decision of additions) {
        const identity = [...nextIdentities.values()].find(
          (item) => item.referenceId === decision.referenceId
        )
        if (!identity)
          throw new Error(
            'Reference decision needs an existing retained image identity.'
          )
        if (
          !decision.reason.trim() ||
          decision.limitations.some((item) => !item.trim()) ||
          decision.criterionIds.some((id) => !criteria.includes(id)) ||
          (['accepted', 'restricted'].includes(decision.status) &&
            !decision.criterionIds.length) ||
          (decision.status === 'restricted' && !decision.limitations.length)
        )
          throw new Error(
            'Reference decisions require known criteria, a reason and explicit restricted limitations.'
          )
        if (decision.sourceRegion) {
          const { x, y, width, height } = decision.sourceRegion
          if (
            !identity.validation ||
            x + width > identity.validation.width ||
            y + height > identity.validation.height
          )
            throw new Error(
              'Validate the original image before selecting a sourceRegion within its oriented pixel bounds.'
            )
        }
        const retained: RetainedReferenceDecision = {
          ...structuredClone(decision),
          author: 'model',
          requirementRevision
        }
        if (!isDeepStrictEqual(next.get(decision.referenceId), retained)) {
          next.set(decision.referenceId, retained)
          changedIds.push(decision.referenceId)
        }
      }
      const affectedCriterionIds = [
        ...new Set(
          changedIds.flatMap((id) => [
            ...(decisions.get(id)?.criterionIds ?? []),
            ...(next.get(id)?.criterionIds ?? [])
          ])
        )
      ]
      decisions = next
      known.forEach((item) =>
        identities.set(item.attachmentIndex, structuredClone(item))
      )
      return { changedIds, affectedCriterionIds }
    },
    snapshot() {
      return [...identities.values()].map((identity) => {
        const decision = decisions.get(identity.referenceId)
        return {
          attachmentIndex: identity.attachmentIndex,
          ...(decision
            ? structuredClone(decision)
            : {
                referenceId: identity.referenceId,
                status: 'pending' as const,
                reason: 'No model applicability decision recorded.',
                criterionIds: [],
                limitations: [],
                author: 'unassigned' as const,
                requirementRevision
              }),
          freshness:
            !decision || decision.requirementRevision === requirementRevision
              ? ('current' as const)
              : ('stale' as const)
        }
      })
    }
  }
}
