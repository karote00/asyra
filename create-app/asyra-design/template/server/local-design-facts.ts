import { isDeepStrictEqual } from 'node:util'
import { operationInputIssue } from './operation-input-schema'

const factText = { type: 'string', minLength: 1, maxLength: 1000 }
const factDependencySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'version'],
  properties: { key: factText, version: factText }
}
const factChangeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'version', 'reason', 'evidence'],
  properties: {
    key: factText,
    version: factText,
    evidence: factText,
    reason: {
      type: 'string',
      enum: ['source_changed', 'user_request', 'contradicting_evidence']
    }
  }
}
const sourceFactSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'statement',
    'scope',
    'sources',
    'verification',
    'dependencies'
  ],
  properties: {
    id: {
      ...factText,
      description:
        'Stable fact identifier. Bind it with factBindings.factId; the review owner attaches the bound IDs to check results.'
    },
    statement: factText,
    scope: {
      ...factText,
      description: 'Where this fact applies, and what it does not establish.'
    },
    verification: {
      ...factText,
      description:
        'Your source-attributed verification notes. Stored as a model assertion, not independent mechanical proof. Fact status describes dependency freshness only.'
    },
    sources: {
      type: 'array',
      minItems: 1,
      maxItems: 24,
      items: factText,
      description: 'Reference identifiers or source URLs supporting this fact.'
    },
    dependencies: {
      type: 'array',
      minItems: 1,
      maxItems: 24,
      items: factDependencySchema
    }
  }
}
export const designFactsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['phase'],
  properties: {
    phase: { type: 'string', const: 'facts' },
    facts: { type: 'array', maxItems: 24, items: sourceFactSchema },
    sourceCorrections: {
      type: 'array',
      maxItems: 24,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['factId', 'sources', 'verification', 'reason'],
        properties: {
          factId: factText,
          sources: sourceFactSchema.properties.sources,
          verification: factText,
          reason: factText
        }
      }
    },
    dependencyChanges: { type: 'array', maxItems: 24, items: factChangeSchema }
  }
}
export const designCalculationsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    calculations: {
      type: 'array',
      maxItems: 24,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'value', 'unit', 'sourceFactIds', 'verification'],
        properties: {
          id: factText,
          value: { type: 'number' },
          unit: factText,
          sourceFactIds: {
            type: 'array',
            minItems: 1,
            maxItems: 24,
            uniqueItems: true,
            items: factText
          },
          verification: factText
        }
      }
    }
  }
}
interface DesignCalculation {
  id: string
  value: number
  unit: string
  sourceFactIds: string[]
  verification: string
}

interface FactDependency {
  key: string
  version: string
}
interface FactChange extends FactDependency {
  reason: 'source_changed' | 'user_request' | 'contradicting_evidence'
  evidence: string
}
interface SourceFact {
  id: string
  statement: string
  scope: string
  sources: string[]
  verification: string
  dependencies: FactDependency[]
}
interface RetainedFact extends SourceFact {
  status: 'valid' | 'invalidated'
  invalidatedBy?: FactChange[]
}

/** Request-owned assertions with provenance, never canonical state or visual approval. */
export const createDesignFacts = (
  resolveSources: (sources: string[]) => string[] = (sources) => sources
) => {
  let facts = new Map<string, RetainedFact>()
  let versions = new Map<string, string>()
  const calculations = new Map<
    string,
    {
      value: DesignCalculation
      sourceFacts: readonly RetainedFact[]
    }
  >()
  const snapshot = () => structuredClone([...facts.values()])
  return {
    snapshot,
    recordCalculations(input: unknown) {
      const issue = operationInputIssue(input, designCalculationsSchema)
      if (issue) throw new Error(issue)
      const additions =
        (input as { calculations?: DesignCalculation[] }).calculations ?? []
      if (new Set(additions.map((item) => item.id)).size !== additions.length)
        throw new Error('Calculation IDs must be unique.')
      const admitted = additions.map((value) => {
        if (
          ![
            value.id,
            value.unit,
            value.verification,
            ...value.sourceFactIds
          ].every((text) => text.trim())
        )
          throw new Error(
            'Calculation identities and evidence must be nonempty.'
          )
        const sourceFacts = value.sourceFactIds.map((id) => {
          const fact = facts.get(id)
          if (!fact || fact.status !== 'valid')
            throw new Error(
              'Calculations require a retained valid source fact.'
            )
          return fact
        })
        return { value: structuredClone(value), sourceFacts }
      })
      for (const item of admitted) calculations.set(item.value.id, item)
      return {
        diagnosticOnly: true,
        calculations: [...calculations.values()].map(
          ({ value, sourceFacts }) => ({
            ...structuredClone(value),
            status: sourceFacts.every(
              (fact) => facts.get(fact.id) === fact && fact.status === 'valid'
            )
              ? 'valid'
              : 'invalidated'
          })
        )
      }
    },
    hasInvalidated: () =>
      [...facts.values()].some((fact) => fact.status === 'invalidated'),
    record(
      input: unknown,
      validate?: (
        facts: readonly RetainedFact[],
        changes: {
          changedIds: readonly string[]
          changedExistingIds: readonly string[]
        }
      ) => void
    ) {
      const issue = operationInputIssue(input, designFactsSchema)
      if (issue) throw new Error(issue)
      const value = input as {
        facts?: SourceFact[]
        sourceCorrections?: {
          factId: string
          sources: string[]
          verification: string
          reason: string
        }[]
        dependencyChanges?: FactChange[]
      }
      const additions = (value.facts ?? []).map((fact) => ({
        ...fact,
        sources: resolveSources(fact.sources)
      }))
      const changes = value.dependencyChanges ?? []
      const nonempty = (value: string) => value.trim().length > 0
      if (
        new Set(additions.map((fact) => fact.id)).size !== additions.length ||
        new Set(changes.map((change) => change.key)).size !== changes.length
      )
        throw new Error('Fact IDs and changed dependency keys must be unique.')
      const nextFacts = new Map(facts)
      const nextVersions = new Map(versions)
      const corrections = value.sourceCorrections ?? []
      if (
        new Set(corrections.map((c) => c.factId)).size !== corrections.length ||
        corrections.some((c) => additions.some((f) => f.id === c.factId))
      )
        throw new Error(
          'Source corrections require unique facts separate from fact additions.'
        )
      for (const correction of corrections) {
        const previous = nextFacts.get(correction.factId)
        if (
          !previous ||
          previous.status !== 'valid' ||
          !correction.reason.trim() ||
          !correction.verification.trim()
        )
          throw new Error(
            'Source correction requires a valid existing fact and explicit evidence and reason.'
          )
        const sources = resolveSources(correction.sources)
        if (
          isDeepStrictEqual(previous.sources, sources) &&
          previous.verification === correction.verification
        )
          continue
        nextFacts.set(correction.factId, {
          ...previous,
          sources,
          verification: correction.verification
        })
      }
      for (const change of changes) {
        if (
          !versions.has(change.key) ||
          !nonempty(change.evidence) ||
          !nonempty(change.version) ||
          versions.get(change.key) === change.version
        )
          throw new Error(
            'A known dependency needs a changed version and concrete evidence.'
          )
        nextVersions.set(change.key, change.version)
      }
      for (const [id, fact] of nextFacts) {
        const invalidatedBy = changes.filter((change) =>
          fact.dependencies.some((dep) => dep.key === change.key)
        )
        if (invalidatedBy.length)
          nextFacts.set(id, {
            ...fact,
            status: 'invalidated',
            invalidatedBy: [
              ...(fact.invalidatedBy ?? []),
              ...structuredClone(invalidatedBy)
            ]
          })
      }
      for (const fact of additions) {
        if (
          ![
            fact.id,
            fact.statement,
            fact.scope,
            fact.verification,
            ...fact.sources
          ].every(nonempty) ||
          new Set(fact.dependencies.map((dep) => dep.key)).size !==
            fact.dependencies.length
        )
          throw new Error(
            'Facts require nonempty evidence and unique dependencies.'
          )
        for (const dep of fact.dependencies) {
          if (
            !nonempty(dep.key) ||
            !nonempty(dep.version) ||
            (nextVersions.has(dep.key) &&
              nextVersions.get(dep.key) !== dep.version)
          )
            throw new Error(
              'Fact dependency version must match the recorded current version.'
            )
          nextVersions.set(dep.key, dep.version)
        }
        const previous = nextFacts.get(fact.id)
        if (previous?.status === 'valid') {
          const { status: _status, ...old } = previous
          if (!isDeepStrictEqual(old, fact))
            throw new Error(
              'Cannot overwrite a valid fact without an evidenced dependency change.'
            )
          continue
        }
        nextFacts.set(fact.id, { ...structuredClone(fact), status: 'valid' })
      }
      const changedIds = [...nextFacts.keys()].filter(
        (id) => nextFacts.get(id) !== facts.get(id)
      )
      validate?.([...nextFacts.values()], {
        changedIds,
        changedExistingIds: changedIds.filter((id) => facts.has(id))
      })
      facts = nextFacts
      versions = nextVersions
      return { phase: 'facts', facts: snapshot() }
    }
  }
}
