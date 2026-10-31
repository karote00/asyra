import { isDeepStrictEqual } from 'node:util'
import { randomUUID } from 'node:crypto'
import { operationInputIssue } from './operation-input-schema'
import { imageRegionSchema } from './local-image-tools'

export interface ReferenceIdentity {
  attachmentIndex: number
  referenceId: string
  validation?: { width: number; height: number }
}
export type ReferencePurpose =
  'visual' | 'fact' | 'preparation' | 'pixel-comparison'
export interface ReferenceUseReceipt {
  requestId: string
  referenceId: string
  useId: string
  revision: number
  requirementRevision: number
}
interface ReferenceUse {
  id: string
  criterionId: string
  unitId?: string
  purpose: ReferencePurpose
  region: 'whole' | { x: number; y: number; width: number; height: number }
  limitations: string[]
}
interface ReferenceDecision {
  referenceId: string
  status: 'pending' | 'accepted' | 'restricted' | 'rejected'
  reason: string
  uses: ReferenceUse[]
}
export interface RetainedReferenceDecision extends Omit<
  ReferenceDecision,
  'uses'
> {
  author: 'model'
  requirementRevision: number
  uses: (ReferenceUse & {
    receipt: ReferenceUseReceipt
    pixels: { width: number; height: number }
  })[]
}
const decisionText = { type: 'string', minLength: 1, maxLength: 1000 }
export const referenceUseReceiptSchema = {
  'x-runtime-value': 'request',
  type: 'object',
  additionalProperties: false,
  required: [
    'requestId',
    'referenceId',
    'useId',
    'revision',
    'requirementRevision'
  ],
  properties: {
    requestId: decisionText,
    referenceId: decisionText,
    useId: decisionText,
    revision: { type: 'integer', minimum: 1 },
    requirementRevision: { type: 'integer', minimum: 1 }
  }
}
export const referenceUsesSchema = {
  type: 'array',
  uniqueItems: true,
  items: referenceUseReceiptSchema,
  description:
    'Exact current use receipts from select_design_references. Omit only for reference-free work; each receipt must match the consumer purpose and criterion/unit.'
}
export const referenceUseDependency = (receipt: ReferenceUseReceipt) =>
  `reference-use:${JSON.stringify([receipt.referenceId, receipt.useId])}`
export const referenceDecisionProperties = {
  requirementRevision: {
    type: 'integer',
    minimum: 1,
    description:
      'Current saved requirementRevision. Required when recording decisions.'
  },
  referenceDecisions: {
    type: 'array',
    maxItems: 24,
    description:
      'Primary-agent assessments, not tool judgments. Accepted/restricted sources require explicit uses. Each use declares exact criterion/unit, purpose, original-pixel region (or whole) and limitations. Decoding alone is not suitability. Retain returned use receipts for consumers.',
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['referenceId', 'status', 'reason', 'uses'],
      properties: {
        referenceId: decisionText,
        status: {
          type: 'string',
          enum: ['pending', 'accepted', 'restricted', 'rejected']
        },
        reason: decisionText,
        uses: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'criterionId', 'purpose', 'region', 'limitations'],
            properties: {
              id: decisionText,
              criterionId: decisionText,
              unitId: decisionText,
              purpose: {
                type: 'string',
                enum: ['visual', 'fact', 'preparation', 'pixel-comparison']
              },
              region: { anyOf: [{ const: 'whole' }, imageRegionSchema] },
              limitations: { type: 'array', maxItems: 24, items: decisionText }
            }
          }
        }
      }
    }
  }
}
const decisionInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: referenceDecisionProperties
}

/** Semantic scope is authored by the primary agent; bytes belong to the image owner. */
export const createReferenceDecisions = () => {
  const requestId = randomUUID()
  let requirements: unknown
  let requirementRevision = 0
  let useRevision = 0
  let decisions = new Map<string, RetainedReferenceDecision>()
  const identities = new Map<number, ReferenceIdentity>()
  const resolve = (
    receipt: ReferenceUseReceipt,
    purpose: ReferencePurpose,
    scope?: { criterionId: string; unitId?: string }
  ) => {
    const issue = operationInputIssue(receipt, referenceUseReceiptSchema)
    if (issue) {
      throw new Error(issue)
    }
    const decision = decisions.get(receipt.referenceId)
    const use = decision?.uses.find((item) => item.id === receipt.useId)
    if (
      !decision ||
      !use ||
      !['accepted', 'restricted'].includes(decision.status) ||
      receipt.requestId !== requestId ||
      receipt.requirementRevision !== requirementRevision ||
      !isDeepStrictEqual(receipt, use.receipt) ||
      use.purpose !== purpose ||
      (scope &&
        (scope.criterionId !== use.criterionId || scope.unitId !== use.unitId))
    ) {
      throw new Error(
        'Reference use is missing, foreign, stale or outside its declared purpose/criterion/unit. Select an explicit current use.'
      )
    }
    return structuredClone(use)
  }
  return {
    setRequirements(value: unknown) {
      if (!isDeepStrictEqual(requirements, value)) {
        requirements = structuredClone(value)
        requirementRevision++
      }
    },
    revision: () => requirementRevision,
    resolve,
    update(
      resolveIdentities: (referenceIds: string[]) => ReferenceIdentity[],
      input: unknown
    ) {
      const issue = operationInputIssue(input, decisionInputSchema)
      if (issue) {
        throw new Error(issue)
      }
      const value = input as {
        requirementRevision?: number
        referenceDecisions?: ReferenceDecision[]
      }
      const additions = value.referenceDecisions ?? []
      if (
        value.referenceDecisions !== undefined &&
        value.requirementRevision !== requirementRevision
      ) {
        throw new Error(
          `Reference decisions require current requirementRevision ${requirementRevision}.`
        )
      }
      const known = resolveIdentities(
        additions.map((decision) => decision.referenceId)
      )
      const nextIdentities = new Map(identities)
      known.forEach((item) => nextIdentities.set(item.attachmentIndex, item))
      if (
        new Set(additions.map((item) => item.referenceId)).size !==
        additions.length
      ) {
        throw new Error('Reference decisions require unique identities.')
      }
      const criteria = (requirements ?? {}) as Record<
        string,
        { requiredUnits?: string[] }
      >
      const next = new Map(decisions)
      let nextRevision = useRevision
      const changedIds: string[] = []
      const changedDependencies = new Set<string>()
      for (const decision of additions) {
        const identity = [...nextIdentities.values()].find(
          (item) => item.referenceId === decision.referenceId
        )
        if (!identity) {
          throw new Error(
            'Reference decision needs an existing retained image identity.'
          )
        }
        const eligible = ['accepted', 'restricted'].includes(decision.status)
        if (
          !decision.reason.trim() ||
          eligible !== decision.uses.length > 0 ||
          new Set(decision.uses.map((use) => use.id)).size !==
            decision.uses.length
        ) {
          throw new Error(
            'Eligible reference decisions require explicit unique uses; pending/rejected decisions have no uses.'
          )
        }
        const prior = decisions.get(decision.referenceId)
        const uses = decision.uses.map((use) => {
          const criterion = criteria[use.criterionId]
          if (
            !criterion ||
            (use.unitId !== undefined &&
              !criterion.requiredUnits?.includes(use.unitId)) ||
            (use.unitId === undefined &&
              (criterion.requiredUnits?.length ?? 0) > 0) ||
            !use.id.trim() ||
            use.limitations.some((item) => !item.trim()) ||
            (decision.status === 'restricted' && !use.limitations.length)
          ) {
            throw new Error(
              'Reference uses require exact known criteria/units and explicit restricted limitations.'
            )
          }
          const dimensions = identity.validation
          if (
            !dimensions ||
            (use.region !== 'whole' &&
              (use.region.x + use.region.width > dimensions.width ||
                use.region.y + use.region.height > dimensions.height))
          ) {
            throw new Error(
              'Validate the original image and declare a region within its oriented pixel bounds.'
            )
          }
          const old = prior?.uses.find((item) => item.id === use.id)
          const unchanged =
            old &&
            prior?.status === decision.status &&
            prior.requirementRevision === requirementRevision &&
            isDeepStrictEqual(
              { ...old, receipt: undefined, pixels: undefined },
              { ...use, receipt: undefined, pixels: undefined }
            )
          const receipt = unchanged
            ? old.receipt
            : {
                requestId,
                referenceId: decision.referenceId,
                useId: use.id,
                revision: ++nextRevision,
                requirementRevision
              }
          if (!unchanged) {
            changedDependencies.add(referenceUseDependency(receipt))
          }
          return {
            ...structuredClone(use),
            receipt,
            pixels:
              use.region === 'whole'
                ? { width: dimensions.width, height: dimensions.height }
                : { width: use.region.width, height: use.region.height }
          }
        })
        for (const old of prior?.uses ?? []) {
          if (!uses.some((use) => use.id === old.id)) {
            changedDependencies.add(referenceUseDependency(old.receipt))
          }
        }
        const retained: RetainedReferenceDecision = {
          ...structuredClone(decision),
          uses,
          author: 'model',
          requirementRevision
        }
        if (!isDeepStrictEqual(prior, retained)) {
          next.set(decision.referenceId, retained)
          changedIds.push(decision.referenceId)
        }
      }
      decisions = next
      useRevision = nextRevision
      known.forEach((item) =>
        identities.set(item.attachmentIndex, structuredClone(item))
      )
      return { changedIds, changedDependencies: [...changedDependencies] }
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
                uses: [],
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
