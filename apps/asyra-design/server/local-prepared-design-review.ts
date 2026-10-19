import {
  referenceUsesSchema,
  referenceUseDependency,
  type ReferenceUseReceipt
} from './local-reference-decisions'
import {
  createDesignCheckResults,
  designCheckDeliverySchema
} from './design-check-results'
import {
  toolResultBoolean,
  toolResultIds,
  toolDocumentReference,
  toolResultObject,
  toolResultString,
  toolSemantics
} from '../src/ai/tool-contract'
import { createHash } from 'node:crypto'
import type { InspectionEvidenceStamp } from '../src/ai/inspection-evidence'
import { AiDesignToolIds } from '../src/constants/ai-design'
import { LocalToolAccess } from './local-tool-scheduler'
import { operationInputIssue } from './operation-input-schema'
import {
  type DesignCheckAssessment,
  type DesignCheckContext
} from './design-check-contract'

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const identity = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')

export interface PreparedRecipeContext extends DesignCheckContext {
  sourceAssertions?: unknown[]
}
export interface PreparedAttachment {
  workspaceId: string
  parentId: string
  evidence: InspectionEvidenceStamp
  basis: { x: number; y: number }[]
  bounds?: unknown
}
export interface PreparedRecipePacket extends PreparedRecipeContext {
  attachment: PreparedAttachment
  recipe: unknown
  coverage: {
    keys: string[]
    wholeRecipe: boolean
    criterionIds: string[]
    pendingCriterionIds: string[]
  }
  previousReview?: {
    artifactId: string
    recipeRevision: string
    sourceChanged: boolean
    evidenceCurrent: boolean
    coverage: PreparedRecipePacket['coverage']
    assessment: DesignCheckAssessment
  }
  deterministicFindings: unknown[]
  elementCount: number
}
export const preparedReviewDefinition = {
  type: 'function',
  ...toolSemantics(
    toolResultObject({
      available: { const: true },
      artifactId: toolResultString,
      recipeRevision: toolResultString,
      evidenceRevision: toolResultString,
      status: { enum: ['pass', 'fail', 'unverified'] },
      appearance: { const: 'unverified' },
      evidenceCurrent: toolResultBoolean,
      reused: toolResultBoolean,
      finalCanvasReviewRequired: { const: true },
      coverage: toolResultObject({
        keys: toolResultIds,
        wholeRecipe: toolResultBoolean,
        criterionIds: toolResultIds,
        pendingCriterionIds: toolResultIds
      }),
      assessment: toolResultObject({ checks: { type: 'array' } }),
      results: designCheckDeliverySchema
    }),
    'prepare',
    ['request-artifacts']
  ),
  revision: 3,
  name: AiDesignToolIds.REVIEW_PREPARED_DESIGN,
  executionAccess: LocalToolAccess.EXCLUSIVE,
  description:
    'Check canonical attachment and explicit source coverage using program checks only. Preparation already retains compiler findings; this call is not needed merely to record them. No model is invoked. Pass covers data checks only; appearance and request interpretation remain for the primary agent using rendered output. Supply artifactId and intended parentId. Partial keys or criteria cannot hide a compiler failure. Correct failures and recheck. Exact dependencies reuse results; final canvas review remains required.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['artifactId'],
    properties: {
      referenceUses: referenceUsesSchema,
      artifactId: { type: 'string', minLength: 1 },
      criterionIds: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        items: { type: 'string', minLength: 1 },
        description:
          'Saved criterion IDs relevant to this ready stage. Omit to review all. Other criteria stay pending for final canvas review.'
      },
      previousArtifactId: {
        type: 'string',
        minLength: 1,
        description:
          'Actual retained reviewed predecessor when correcting a recipe. Its findings become revision questions, never approval of this source.'
      },
      parentId: {
        ...toolDocumentReference,
        description:
          'Actual existing attachment parent; omit for current workspace. Apply to this same parent.'
      },
      keys: {
        type: 'array',
        minItems: 1,
        maxItems: 24,
        uniqueItems: true,
        items: { type: 'string', minLength: 1 }
      }
    }
  }
}

export const createPreparedDesignReview = (options: {
  resolveRecipe: (artifactId: string) => {
    recipe: unknown
    findings: readonly unknown[]
    elementCount: number
  }
  resolveAttachment: (
    parentId: string | undefined,
    signal: AbortSignal
  ) => Promise<PreparedAttachment>
  attachmentCurrent: (
    attachment: PreparedAttachment,
    signal: AbortSignal
  ) => Promise<boolean>
  context: (receipts?: ReferenceUseReceipt[]) => PreparedRecipeContext
  results?: ReturnType<typeof createDesignCheckResults>
}) => {
  const results = options.results ?? createDesignCheckResults()
  const latestArtifacts = new Map<string, string>()
  const cache = new Map<string, DesignCheckAssessment>()
  const artifactReviews = new Map<
    string,
    {
      referenceUses: ReferenceUseReceipt[]
      recipeIdentity: string
      evidenceIdentity: string
      contextIdentity: string
      attachment: PreparedAttachment
      evidenceCurrent: boolean
      status: string
      coverage: PreparedRecipePacket['coverage']
      assessment: DesignCheckAssessment
      conflict?: {
        coverage: PreparedRecipePacket['coverage']
        assessment: DesignCheckAssessment
        deterministicFindings: unknown[]
      }
    }
  >()
  const sourceReviews = new Map<
    string,
    NonNullable<ReturnType<typeof artifactReviews.get>>
  >()
  const evidence = (receipts: ReferenceUseReceipt[] = []) =>
    options.context(receipts)
  return {
    read: results.read,
    async refresh(signal: AbortSignal, dependencyKeys?: ReadonlySet<string>) {
      if (!latestArtifacts.size) return
      const validations = new Map<string, boolean>()
      for (const [lineage, artifactId] of latestArtifacts) {
        if (dependencyKeys && !dependencyKeys.has(`attachment:${lineage}`))
          continue
        signal.throwIfAborted()
        const reviewed = artifactReviews.get(artifactId)
        if (!reviewed) continue
        const key = identity(reviewed.attachment.evidence)
        try {
          if (!validations.has(key))
            validations.set(
              key,
              await options.attachmentCurrent(reviewed.attachment, signal)
            )
          signal.throwIfAborted()
          if (!validations.get(key))
            results.invalidate(
              [`attachment:${lineage}`],
              'Canonical attachment dependencies changed.'
            )
        } catch {
          results.invalidate(
            [`attachment:${lineage}`],
            'Canonical attachment currency could not be established.'
          )
          signal.throwIfAborted()
        }
      }
    },
    assertApplicable(artifactId: string, parentId?: string) {
      const reviewed = artifactReviews.get(artifactId)
      if (!reviewed) {
        const findings = options
          .resolveRecipe(artifactId)
          .findings.filter(
            (finding) =>
              !record(finding) || finding.kind !== 'text-metrics-required'
          )
        if (findings.length)
          throw new Error(
            'Prepared recipe needs correction before application.'
          )
        return
      }
      if (!reviewed.evidenceCurrent)
        throw new Error(
          'Prepared attachment or source evidence changed during review; review current dependencies.'
        )
      if (
        reviewed.recipeIdentity !==
        identity(options.resolveRecipe(artifactId).recipe)
      )
        throw new Error(
          'Prepared recipe changed after review; review its current source.'
        )
      if (
        reviewed.contextIdentity !== identity(evidence(reviewed.referenceUses))
      )
        throw new Error(
          'Prepared review evidence changed; review current dependencies.'
        )
      if (
        (parentId ?? reviewed.attachment.workspaceId) !==
        reviewed.attachment.parentId
      )
        throw new Error(
          'Prepared review parent changed; review the actual attachment parent.'
        )
      const currentSourceReview = sourceReviews.get(
        identity([reviewed.recipeIdentity, reviewed.evidenceIdentity])
      )
      if (reviewed.status === 'fail' || currentSourceReview?.status === 'fail')
        throw new Error(
          'Prepared recipe needs correction or verification before application.'
        )
      return reviewed.attachment
    },
    async review(input: unknown, signal: AbortSignal) {
      const issue = operationInputIssue(
        input,
        preparedReviewDefinition.inputSchema
      )
      if (issue) throw new Error(issue)
      signal.throwIfAborted()
      const {
        artifactId,
        parentId,
        criterionIds: requestedCriteria,
        previousArtifactId,
        referenceUses = [],
        keys = []
      } = input as {
        artifactId: string
        parentId?: string
        criterionIds?: string[]
        previousArtifactId?: string
        referenceUses?: ReferenceUseReceipt[]
        keys?: string[]
      }
      const source = options.resolveRecipe(artifactId)
      const recipe = source.recipe
      if (keys.length) {
        const selected = new Map<string, unknown>()
        const visit = (value: unknown) => {
          if (Array.isArray(value)) {
            value.forEach(visit)
            return
          }
          if (!record(value)) return
          if (typeof value.key === 'string' && keys.includes(value.key)) {
            if (selected.has(value.key))
              throw new Error(
                'Source key is ambiguous; select a unique recipe part.'
              )
            selected.set(value.key, value)
          }
          Object.values(value).forEach(visit)
        }
        visit(recipe)
        if (keys.some((key) => !selected.has(key)))
          throw new Error(
            'Requested source key is unavailable; use original recipe keys.'
          )
        // Selection narrows coverage; the retained source supplies coordinate and reference context.
      }
      const attachment = await options.resolveAttachment(parentId, signal)
      signal.throwIfAborted()
      const context = evidence(referenceUses)
      if (!Object.keys(context.criteria).length)
        throw new Error(
          'Define request-linked criteria before prepared review.'
        )
      if (requestedCriteria?.some((id) => !Object.hasOwn(context.criteria, id)))
        throw new Error(
          'Requested criterion is unavailable; use saved criterion IDs.'
        )
      const criterionIds = Object.keys(context.criteria).filter(
        (id) => !requestedCriteria || requestedCriteria.includes(id)
      )
      if (
        context.referenceUses?.some(
          (use) => !criterionIds.includes(use.criterionId)
        )
      )
        throw new Error(
          'Preparation reference uses must match the requested criterion coverage.'
        )
      const coverage = {
        keys: [...keys].sort(),
        wholeRecipe: keys.length === 0,
        criterionIds,
        pendingCriterionIds: Object.keys(context.criteria).filter(
          (id) => !criterionIds.includes(id)
        )
      }
      const recipeIdentity = identity(source.recipe)
      const contextIdentity = identity(context)
      // Currency receipts are renewed independently of attachment geometry.
      // The fresh receipt is still checked below and retained for apply admission.
      const { evidence: attachmentEvidence, ...attachmentContent } = attachment
      const semanticAttachment = {
        ...attachmentContent,
        sessionId: attachmentEvidence.sessionId
      }
      const evidenceIdentity = identity({
        context,
        attachment: semanticAttachment
      })
      let previousReview: PreparedRecipePacket['previousReview']
      if (previousArtifactId) {
        const previousSource = options.resolveRecipe(previousArtifactId)
        const stored = artifactReviews.get(previousArtifactId)
        if (!stored)
          throw new Error('Previous artifact has no retained review.')
        const previous =
          sourceReviews.get(
            identity([stored.recipeIdentity, stored.evidenceIdentity])
          ) ?? stored
        if (identity(previousSource.recipe) !== previous.recipeIdentity)
          throw new Error('Previous source changed after its retained review.')
        previousReview = {
          artifactId: previousArtifactId,
          recipeRevision: previous.recipeIdentity,
          sourceChanged: previous.recipeIdentity !== recipeIdentity,
          evidenceCurrent:
            previous.evidenceCurrent &&
            previous.evidenceIdentity === evidenceIdentity,
          coverage: previous.conflict?.coverage ?? previous.coverage,
          assessment: previous.conflict?.assessment ?? previous.assessment
        }
      }
      const deterministicFindings = source.findings.filter(
        (finding) =>
          !record(finding) || finding.kind !== 'text-metrics-required'
      )
      const packet = {
        ...context,
        criteria: Object.fromEntries(
          criterionIds.map((id) => [id, context.criteria[id]])
        ),
        attachment,
        recipe,
        coverage,
        deterministicFindings,
        elementCount: source.elementCount,
        ...(previousReview ? { previousReview } : {})
      }
      // Handle spelling is provenance, not a semantic assessment dependency.
      const cacheKey = identity({
        packet: {
          ...packet,
          attachment: semanticAttachment,
          ...(previousReview
            ? { previousReview: { ...previousReview, artifactId: undefined } }
            : {})
        },
        contextIdentity
      })
      const sourceKey = identity([recipeIdentity, evidenceIdentity])
      const prior = sourceReviews.get(sourceKey)
      const coversPriorConflict =
        keys.length === 0 &&
        (!prior?.conflict ||
          prior.conflict.coverage.criterionIds.every((id) =>
            criterionIds.includes(id)
          ))
      let assessment = cache.get(cacheKey)
      if (
        prior?.status === 'fail' &&
        coversPriorConflict &&
        assessment?.overall.status === 'pass' &&
        assessment.checks.every((check) => check.status === 'pass')
      )
        assessment = undefined
      const reused = !!assessment
      if (!assessment) {
        assessment = {
          overall: {
            status: deterministicFindings.length ? 'fail' : 'pass',
            evidence: deterministicFindings.length
              ? 'Compiler checks found actionable data errors.'
              : 'Compiler admission and current attachment checks passed; appearance is not certified.'
          },
          checks: criterionIds.map((criterionId) => ({
            criterionId,
            status: 'unverified' as const,
            evidence:
              'The primary agent must judge this requirement using actual rendered evidence; no model is called by this tool.'
          }))
        }
        signal.throwIfAborted()
      }
      const evidenceCurrent =
        contextIdentity === identity(evidence(referenceUses)) &&
        (await options.attachmentCurrent(attachment, signal)) &&
        recipeIdentity === identity(options.resolveRecipe(artifactId).recipe)
      if (evidenceCurrent && !reused)
        cache.set(cacheKey, structuredClone(assessment))
      let status = deterministicFindings.length ? 'fail' : 'pass'
      const unresolvedPriorConflict =
        (!coversPriorConflict || status !== 'pass') &&
        prior?.status === 'fail' &&
        prior.recipeIdentity === recipeIdentity &&
        prior.evidenceIdentity === evidenceIdentity
      if (unresolvedPriorConflict) status = 'fail'
      if (!evidenceCurrent) status = 'unverified'
      let conflict =
        status === 'fail'
          ? structuredClone({ coverage, assessment, deterministicFindings })
          : undefined
      if (unresolvedPriorConflict) conflict = prior.conflict
      const reviewed = {
        referenceUses: structuredClone(referenceUses),
        recipeIdentity,
        evidenceIdentity,
        contextIdentity,
        attachment,
        evidenceCurrent,
        status,
        conflict,
        coverage,
        assessment: structuredClone(assessment)
      }
      const lineage = results.recordPreparedSource({
        artifactId,
        recipeRevision: recipeIdentity,
        findings: source.findings,
        previousArtifactId
      })
      latestArtifacts.set(lineage, artifactId)
      results.record({
        id: `prepared:${lineage}:attachment`,
        origin: 'tool',
        status: evidenceCurrent ? 'pass' : 'stale',
        evidence: evidenceCurrent
          ? 'Canonical parent and coordinate basis are current.'
          : 'Canonical attachment changed during checking.',
        scope: [artifactId],
        dependencies: {
          ...Object.fromEntries(
            referenceUses.map((receipt) => [
              referenceUseDependency(receipt),
              String(receipt.revision)
            ])
          ),
          [`attachment:${lineage}`]: identity(attachment.evidence),
          [`recipe:${lineage}`]: recipeIdentity
        }
      })
      artifactReviews.set(artifactId, reviewed)
      // Unknown stale observations cannot replace current same-source conflict evidence.
      if (evidenceCurrent) sourceReviews.set(sourceKey, reviewed)
      return {
        available: true,
        artifactId,
        recipeRevision: recipeIdentity,
        evidenceRevision: evidenceIdentity,
        status,
        evidenceCurrent,
        unresolvedPriorConflict,
        ...(unresolvedPriorConflict ? { unresolvedReview: conflict } : {}),
        reused,
        coverage,
        ...(previousReview
          ? {
              previousReview: {
                artifactId: previousReview.artifactId,
                recipeRevision: previousReview.recipeRevision,
                sourceChanged: previousReview.sourceChanged,
                evidenceCurrent: previousReview.evidenceCurrent
              }
            }
          : {}),
        appearance: 'unverified',
        deterministicFindings,
        assessment,
        finalCanvasReviewRequired: true,
        results: results.deliver()
      }
    }
  }
}
