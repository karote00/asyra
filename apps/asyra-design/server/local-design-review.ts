import { randomUUID } from 'node:crypto'
import { AiDesignToolIds } from '../src/constants/ai-design'

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 1000
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= 24 && value.every(text)

export const designReviewDefinition = {
  type: 'function',
  name: AiDesignToolIds.RECORD_DESIGN_REVIEW,
  description:
    'Record the drawing plan before mutation, then assess every criterion against current inspection IDs after drawing. This records model judgment, not automatic visual certification. Use optional structureCriteria from the plan with phase=structure and an overview to check viewpoint, silhouette and layering before dense detail; this never approves completion. Add compact deferredDetails for likely occluded parts without computing their geometry, during plan or subsequent reviews. Final visual deferredChecks must resolve each retained ID using current evidence; pending or missing decisions block completion. No extra planning call per part is needed. Visual reviews report criteria regressed from the preceding visual assessment. New mutations invalidate current inspection IDs and approval. Failed checks require refinement or an honest partial outcome.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['phase'],
    properties: {
      phase: { type: 'string', enum: ['plan', 'structure', 'visual'] },
      method: { type: 'string', maxLength: 1000 },
      references: {
        type: 'array',
        maxItems: 24,
        items: { type: 'string', maxLength: 1000 }
      },
      criteria: {
        type: 'array',
        minItems: 1,
        maxItems: 24,
        items: { type: 'string', minLength: 1, maxLength: 1000 }
      },
      structureCriteria: {
        type: 'array',
        maxItems: 24,
        items: { type: 'string', minLength: 1, maxLength: 1000 }
      },
      deferredDetails: {
        type: 'array',
        maxItems: 24,
        description:
          'Compact deferred-part descriptions, not geometry. Add on plan, structure or visual review; retained for this request. Use the same id for the same part. Final visual review must resolve all retained parts.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'description', 'reason'],
          properties: {
            id: { type: 'string', minLength: 1, maxLength: 1000 },
            description: { type: 'string', minLength: 1, maxLength: 1000 },
            reason: { type: 'string', minLength: 1, maxLength: 1000 }
          }
        }
      },
      deferredChecks: {
        type: 'array',
        description:
          'Visual phase only: assess retained deferred parts against current inspectionIds. omit means the final view does not need this detail; restored means it was drawn and checked; pending means more work. Decisions expire after mutation.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'status', 'evidence'],
          properties: {
            id: { type: 'string', minLength: 1, maxLength: 1000 },
            status: { type: 'string', enum: ['omit', 'restored', 'pending'] },
            evidence: { type: 'string', minLength: 1, maxLength: 1000 }
          }
        }
      },
      detailRequired: { type: 'boolean' },
      inspectionIds: {
        type: 'array',
        minItems: 1,
        maxItems: 24,
        items: { type: 'string' }
      },
      checks: {
        type: 'array',
        minItems: 1,
        maxItems: 24,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['requirement', 'status', 'evidence'],
          properties: {
            requirement: { type: 'string' },
            status: { type: 'string', enum: ['pass', 'fail', 'unverified'] },
            evidence: { type: 'string', minLength: 1, maxLength: 1000 }
          }
        }
      }
    }
  }
}

/** Evidence lifetime is one local invocation and one mutation revision. */
export const createLocalDesignReview = () => {
  let revision = 0
  let plan:
    | {
        criteria: string[]
        structureCriteria: string[]
        detailRequired: boolean
      }
    | undefined
  let previousChecks: {
    requirement: string
    status: string
    evidence: string
  }[] = []
  let deferredDetails = new Map<
    string,
    { id: string; description: string; reason: string }
  >()
  let structureAccepted = false
  let accepted = false
  let issue = 'The drawing has not been checked against the requested result.'
  const inspections = new Map<
    string,
    { target: string; scope: string; overview: boolean; detail: boolean }
  >()
  return {
    mutate(): void {
      revision++
      accepted = false
      inspections.clear()
      issue =
        'The latest changes have not yet been checked against the requested result.'
    },
    inspect(
      elementId: string,
      available: boolean,
      overview: boolean,
      region?: unknown,
      detail = !overview
    ): { inspectionId: string; revision: number } | undefined {
      if (!available) return undefined
      const scope = record(region)
        ? JSON.stringify([region.x, region.y, region.width, region.height])
        : 'whole'
      const scopedView = `${detail ? 'detail' : 'overview'}:${scope}`
      // Repeated captures are fresh images of the same revision and scope.
      // Their receipt stays valid; only a mutation retires prior evidence.
      for (const [inspectionId, evidence] of inspections) {
        if (evidence.target === elementId && evidence.scope === scopedView) {
          evidence.overview ||= overview && !region
          return { inspectionId, revision }
        }
      }
      const inspectionId = randomUUID()
      inspections.set(inspectionId, {
        target: elementId,
        scope: scopedView,
        overview: overview && !region,
        detail
      })
      return { inspectionId, revision }
    },
    record(value: unknown): Record<string, unknown> {
      if (!record(value)) throw new Error('Review arguments must be an object.')
      const additions = value.deferredDetails ?? []
      if (
        !Array.isArray(additions) ||
        additions.length > 24 ||
        !additions.every(
          (item) =>
            record(item) &&
            text(item.id) &&
            text(item.description) &&
            text(item.reason) &&
            Object.keys(item).every((key) =>
              ['id', 'description', 'reason'].includes(key)
            )
        ) ||
        new Set(additions.map((item) => item.id)).size !== additions.length
      )
        throw new Error(
          'Provide unique deferredDetails with id, description and reason; do not send geometry.'
        )
      if (value.deferredChecks !== undefined && value.phase !== 'visual')
        throw new Error('Deferred decisions require a current visual review.')
      const nextDeferred = new Map(deferredDetails)
      for (const item of additions)
        nextDeferred.set(item.id, {
          id: item.id,
          description: item.description,
          reason: item.reason
        })
      if (value.phase === 'plan') {
        if (revision > 0)
          throw new Error(
            'Review criteria must be recorded before drawing. Report the current result as unverified; do not invent a retrospective acceptance plan.'
          )
        if (
          !text(value.method) ||
          !strings(value.references) ||
          !strings(value.criteria) ||
          !value.criteria.length ||
          new Set(value.criteria).size !== value.criteria.length ||
          typeof value.detailRequired !== 'boolean'
        )
          throw new Error(
            'Provide method, references, unique criteria and detailRequired for the plan.'
          )
        const structureCriteria = value.structureCriteria ?? []
        if (
          !strings(structureCriteria) ||
          new Set(structureCriteria).size !== structureCriteria.length ||
          structureCriteria.some(
            (c) => !(value.criteria as string[]).includes(c)
          )
        )
          throw new Error(
            'Structure criteria must be a unique subset of planned criteria.'
          )
        plan = {
          structureCriteria,
          criteria: value.criteria,
          detailRequired: value.detailRequired
        }
        deferredDetails = nextDeferred
        return {
          phase: 'plan',
          deferredDetails: [...deferredDetails.values()],
          structureCriteria: plan.structureCriteria,
          criteria: plan.criteria,
          method: value.method,
          references: value.references,
          detailRequired: plan.detailRequired
        }
      }
      if (
        !['visual', 'structure'].includes(String(value.phase)) ||
        !plan ||
        !strings(value.inspectionIds) ||
        !value.inspectionIds.length ||
        value.inspectionIds.some((id) => !inspections.has(id))
      )
        throw new Error(
          'Use current inspection IDs and an existing pre-mutation plan.'
        )
      const structure = value.phase === 'structure'
      if (structure && !plan.structureCriteria.length)
        throw new Error(
          'Declare structureCriteria in the plan before using structure review.'
        )
      const criteria = structure ? plan.structureCriteria : plan.criteria
      const evidence = value.inspectionIds.map((id) => inspections.get(id))
      const hasOverview = evidence.some((entry) => entry?.overview)
      const hasDetail = evidence.some((entry) => entry?.detail)
      if (!hasOverview || (!structure && plan.detailRequired && !hasDetail))
        throw new Error(
          'Inspect the full drawing and, for detailed work, a separate detail element or region before reviewing.'
        )
      if (
        !Array.isArray(value.checks) ||
        value.checks.length !== criteria.length
      )
        throw new Error('Assess every planned criterion exactly once.')
      const checks = value.checks
      if (
        !checks.every(
          (check) =>
            record(check) &&
            criteria.includes(String(check.requirement)) &&
            ['pass', 'fail', 'unverified'].includes(String(check.status)) &&
            text(check.evidence)
        ) ||
        new Set(checks.map((check) => check.requirement)).size !==
          criteria.length
      )
        throw new Error(
          'Each planned criterion needs one pass, fail or unverified status and concrete visual evidence.'
        )
      if (structure) {
        if (additions.length) {
          accepted = false
          issue = 'Deferred details require a current final visual review.'
        }
        deferredDetails = nextDeferred
        structureAccepted = checks.every((check) => check.status === 'pass')
        return {
          phase: 'structure',
          deferredDetails: [...deferredDetails.values()],
          revision,
          accepted: false,
          readyForDetail: structureAccepted,
          checks,
          inspectionIds: value.inspectionIds
        }
      }
      const deferredChecks = value.deferredChecks ?? []
      if (
        !Array.isArray(deferredChecks) ||
        !deferredChecks.every(
          (item) =>
            record(item) &&
            text(item.id) &&
            nextDeferred.has(item.id) &&
            ['omit', 'restored', 'pending'].includes(String(item.status)) &&
            text(item.evidence) &&
            Object.keys(item).every((key) =>
              ['id', 'status', 'evidence'].includes(key)
            )
        ) ||
        new Set(deferredChecks.map((item) => item.id)).size !==
          deferredChecks.length
      )
        throw new Error(
          'Assess known deferred IDs once with omit, restored or pending and current visual evidence.'
        )
      const resolved = new Set(
        deferredChecks
          .filter((item) => item.status !== 'pending')
          .map((item) => item.id)
      )
      const pendingDetails = [...nextDeferred.keys()].filter(
        (id) => !resolved.has(id)
      )
      deferredDetails = nextDeferred
      const regressions = checks
        .filter(
          (check) =>
            check.status !== 'pass' &&
            previousChecks.some(
              (old) =>
                old.requirement === check.requirement && old.status === 'pass'
            )
        )
        .map((check) => ({
          requirement: check.requirement,
          previousEvidence: previousChecks.find(
            (old) => old.requirement === check.requirement
          )?.evidence,
          currentEvidence: check.evidence
        }))
      previousChecks = checks.map((check) => ({
        requirement: String(check.requirement),
        status: String(check.status),
        evidence: String(check.evidence)
      }))
      accepted =
        checks.every((check) => check.status === 'pass') &&
        pendingDetails.length === 0
      const unmet = checks
        .filter((check) => check.status !== 'pass')
        .map((check) => `${check.requirement}: ${check.evidence}`)
      unmet.push(
        ...pendingDetails.map(
          (id) => `Deferred detail ${id} needs a current omit/restored decision`
        )
      )
      issue = unmet.length
        ? `The drawing still needs adjustment: ${unmet
            .slice(0, 3)
            .map((item) => item.slice(0, 240))
            .join(
              '; '
            )}${unmet.length > 3 ? '; additional criteria remain unmet.' : ''}`
        : issue
      return {
        phase: 'visual',
        deferredDetails: [...deferredDetails.values()],
        deferredChecks,
        pendingDetails,
        regressions,
        revision,
        accepted,
        checks,
        inspectionIds: value.inspectionIds
      }
    },
    getStructureIssue(): string | undefined {
      if (plan?.structureCriteria.length && !structureAccepted)
        return 'Inspect the current structural drawing and pass every structureCriterion with phase=structure before preparing repeated detail. Correct viewpoint, silhouette and layering first; do not remove or weaken the criteria.'
    },
    getIssue(): string | undefined {
      if (revision === 0 || accepted) return undefined
      return plan
        ? issue
        : 'The drawing was created, but its requested quality was not verified against a pre-drawing plan.'
    }
  }
}
