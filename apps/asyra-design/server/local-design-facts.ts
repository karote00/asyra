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
    verification: factText,
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
    dependencyChanges: { type: 'array', maxItems: 24, items: factChangeSchema }
  }
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
export const createDesignFacts = () => {
  let facts = new Map<string, RetainedFact>()
  let versions = new Map<string, string>()
  const snapshot = () => structuredClone([...facts.values()])
  return {
    snapshot,
    hasInvalidated: () =>
      [...facts.values()].some((fact) => fact.status === 'invalidated'),
    record(
      input: unknown,
      validate?: (facts: readonly RetainedFact[]) => void
    ) {
      const issue = operationInputIssue(input, designFactsSchema)
      if (issue) throw new Error(issue)
      const value = input as {
        facts?: SourceFact[]
        dependencyChanges?: FactChange[]
      }
      const additions = value.facts ?? []
      const changes = value.dependencyChanges ?? []
      const nonempty = (value: string) => value.trim().length > 0
      if (
        new Set(additions.map((fact) => fact.id)).size !== additions.length ||
        new Set(changes.map((change) => change.key)).size !== changes.length
      )
        throw new Error('Fact IDs and changed dependency keys must be unique.')
      const nextFacts = new Map(facts)
      const nextVersions = new Map(versions)
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
      validate?.([...nextFacts.values()])
      facts = nextFacts
      versions = nextVersions
      return { phase: 'facts', facts: snapshot() }
    }
  }
}
