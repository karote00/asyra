import {
  toolResultObject,
  toolResultString,
  toolResultCount,
  toolResultIds
} from '../src/ai/tool-contract'

export const designCheckResultsSchema = toolResultObject({
  counts: toolResultObject({
    pass: toolResultCount,
    fail: toolResultCount,
    unverified: toolResultCount,
    stale: toolResultCount
  }),
  items: {
    type: 'array',
    items: toolResultObject(
      {
        id: toolResultString,
        criterionId: toolResultString,
        unitId: toolResultString,
        supersedes: toolResultObject({
          revision: { type: 'integer', minimum: 1 },
          reason: toolResultString
        }),
        deferredDecision: { enum: ['omit', 'restored', 'pending'] },
        origin: { enum: ['tool', 'main-agent'] },
        status: { enum: ['pass', 'fail', 'unverified', 'stale'] },
        evidence: toolResultString,
        dependencies: {
          type: 'object',
          additionalProperties: toolResultString
        },
        scope: toolResultIds,
        reason: toolResultString,
        revision: { type: 'integer', minimum: 1 }
      },
      ['id', 'origin', 'status', 'evidence', 'dependencies', 'revision']
    )
  },
  visitedResults: toolResultCount
})

export interface DesignCheckResult {
  id: string
  criterionId?: string
  unitId?: string
  supersedes?: { revision: number; reason: string }
  deferredDecision?: 'omit' | 'restored' | 'pending'
  origin: 'tool' | 'main-agent'
  status: 'pass' | 'fail' | 'unverified' | 'stale'
  evidence: string
  dependencies: Record<string, string>
  scope?: string[]
  reason?: string
  revision: number
}

export const designCheckSummarySchema = toolResultObject(
  {
    counts: designCheckResultsSchema.properties.counts,
    visitedResults: toolResultCount,
    firstPendingId: toolResultString
  },
  ['counts', 'visitedResults']
)

export interface DesignCheckSelection {
  checkId: string
  revision: number
}

/** Canonical producer metadata; diagnostic prose is never executable provenance. */
export type DesignCheckRecheck =
  | { kind: 'measurement'; elementId: string; findings: readonly unknown[] }
  | { kind: 'prepared'; artifactId: string; recipeRevision: string }

export const designCheckSelectionSchema = {
  type: 'array',
  minItems: 1,
  uniqueItems: true,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['checkId', 'revision'],
    properties: {
      checkId: { ...toolResultString, 'x-runtime-value': 'request' },
      revision: { type: 'integer', minimum: 1, 'x-runtime-value': 'request' }
    }
  }
}

export const designCheckInputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['requestId', 'checks'],
  properties: {
    requestId: { ...toolResultString, 'x-runtime-value': 'request' },
    checks: designCheckSelectionSchema
  }
}

/** Request-owned evidence, not document state or an authority to replay writes. */
export const createDesignCheckResults = () => {
  const results = new Map<
    string,
    DesignCheckResult & { recheck?: DesignCheckRecheck }
  >()
  const retiredRevisions = new Map<
    string,
    { revision: number; reason: string; origin: DesignCheckResult['origin'] }
  >()
  const preparedLineages = new Map<string, string>()
  const latestPrepared = new Map<string, string>()
  const counts = { pass: 0, fail: 0, unverified: 0, stale: 0 }
  const pendingIds = new Set<string>()
  const dependents = new Map<string, Set<string>>()
  const invalidate = (keys: string[] | undefined, reason: string) => {
    if (!keys) {
      for (const [id, result] of results) {
        if (result.status !== 'stale') {
          counts[result.status]--
          counts.stale++
        }
        result.status = 'stale'
        result.reason = reason
        pendingIds.add(id)
      }
      return
    }
    const pending = [...keys]
    const visited = new Set<string>()
    for (const key of pending) {
      if (visited.has(key)) continue
      visited.add(key)
      for (const id of dependents.get(key) ?? []) {
        const result = results.get(id)
        if (!result) continue
        if (result.status !== 'stale') {
          counts[result.status]--
          counts.stale++
        }
        pendingIds.add(id)
        result.status = 'stale'
        result.reason = reason
        pending.push(`check:${id}`)
      }
    }
  }
  const remove = (result: DesignCheckResult, reason: string) => {
    const id = result.id
    invalidate([`check:${id}`], reason)
    retiredRevisions.set(id, {
      revision: result.revision,
      reason,
      origin: result.origin
    })
    counts[result.status]--
    pendingIds.delete(id)
    results.delete(id)
    for (const key of Object.keys(result.dependencies)) {
      const ids = dependents.get(key)
      ids?.delete(id)
      if (!ids?.size) dependents.delete(key)
    }
  }
  const owner = {
    invalidate,
    selection(ids: readonly string[]): DesignCheckSelection[] {
      return ids.map((checkId) => {
        const record = results.get(checkId) ?? retiredRevisions.get(checkId)
        if (!record || record.origin !== 'tool')
          throw new Error('Unknown mechanical check.')
        return { checkId, revision: record.revision }
      })
    },
    select(selection: readonly DesignCheckSelection[]) {
      if (!selection.length)
        throw new Error('Mechanical selection must be nonempty.')
      if (
        new Set(selection.map((item) => item.checkId)).size !== selection.length
      )
        throw new Error('Mechanical selection must contain unique check IDs.')
      return selection.map(({ checkId, revision }) => {
        const result = results.get(checkId)
        const retired = retiredRevisions.get(checkId)
        const record = result ?? retired
        if (!record || record.origin !== 'tool')
          throw new Error('Unknown mechanical check.')
        if (!Number.isSafeInteger(revision) || record.revision !== revision)
          throw new Error(
            'Mechanical check revision changed; retrieve the current selection.'
          )
        if (result) {
          const { recheck, ...publicResult } = result
          return {
            checkId,
            revision,
            retired: false as const,
            result: structuredClone(publicResult),
            recheck: structuredClone(recheck)
          }
        }
        if (!retired) throw new Error('Mechanical check disappeared.')
        return {
          checkId,
          revision,
          retired: true as const,
          reason: retired.reason
        }
      })
    },
    dependencyKeys(prefix: string): string[] {
      return [...dependents.keys()].filter((key) => key.startsWith(prefix))
    },
    summary(ids: Iterable<string>) {
      const selectedCounts = { pass: 0, fail: 0, unverified: 0, stale: 0 }
      let firstPendingId: string | undefined
      let visitedResults = 0
      for (const id of ids) {
        visitedResults++
        const result = results.get(id)
        if (!result) continue
        selectedCounts[result.status]++
        if (result.status !== 'pass') firstPendingId ??= id
      }
      return {
        counts: selectedCounts,
        visitedResults,
        ...(firstPendingId ? { firstPendingId } : {})
      }
    },
    dependencyIds(ids: readonly string[]): string[] {
      const selected = new Set(ids)
      for (const id of selected)
        for (const dependency of Object.keys(
          results.get(id)?.dependencies ?? {}
        ))
          if (dependency.startsWith('check:')) selected.add(dependency.slice(6))
      return [...selected]
    },
    /** Only the pre-drawing plan owner may replace unjudged declarations. */
    discardDeclarations(ids: readonly string[]): void {
      const selected = [...new Set(ids)].flatMap((id) => {
        const result = results.get(id)
        if (!result) return []
        if (
          result.origin !== 'main-agent' ||
          !['unverified', 'stale'].includes(result.status) ||
          result.scope !== undefined ||
          result.supersedes !== undefined ||
          Object.keys(result.dependencies).some(
            (key) =>
              key !== 'scene' &&
              key !== 'coverage:whole-view' &&
              !key.startsWith('criterion:')
          )
        )
          throw new Error(
            'Only untouched declaration placeholders can be discarded.'
          )
        return [result]
      })
      for (const result of selected)
        remove(result, 'The unjudged declaration was replaced.')
    },
    /** Canonical target removal retires tool work, never a visual obligation. */
    retire(id: string, reason: string) {
      const result = results.get(id)
      if (!result) return
      if (result.origin !== 'tool')
        throw new Error('Only tool results can be retired.')
      remove(result, reason)
    },
    recordPreparedSource(input: {
      artifactId: string
      recipeRevision: string
      findings: readonly unknown[]
      previousArtifactId?: string
    }): string {
      const { artifactId, recipeRevision, previousArtifactId } = input
      const previous = previousArtifactId
        ? preparedLineages.get(previousArtifactId)
        : undefined
      if (previousArtifactId && !previous)
        throw new Error('Prepared predecessor has no retained source check.')
      const current = preparedLineages.get(artifactId)
      const lineage = previous ?? current ?? artifactId
      if (current && current !== artifactId && current !== lineage)
        throw new Error(
          'Prepared correction already belongs to another lineage.'
        )
      if (current && latestPrepared.get(current) !== artifactId)
        throw new Error('Prepared source has been superseded.')
      if (
        previousArtifactId &&
        latestPrepared.get(lineage) !== previousArtifactId &&
        latestPrepared.get(lineage) !== artifactId
      )
        throw new Error('Prepared predecessor has been superseded.')
      const id = `prepared:${lineage}:data`
      const dependency = `recipe:${lineage}`
      const prior = results.get(id)
      if (prior && prior.dependencies[dependency] !== recipeRevision)
        invalidate([dependency], 'Prepared source changed.')
      const failures = input.findings.filter(
        (finding) =>
          !finding ||
          typeof finding !== 'object' ||
          !('kind' in finding) ||
          finding.kind !== 'text-metrics-required'
      )
      owner.record(
        {
          id,
          origin: 'tool',
          status: failures.length ? 'fail' : 'pass',
          evidence: failures.length
            ? JSON.stringify(failures)
            : 'Compiler geometry, keys, references and explicit numeric constraints passed.',
          scope: [artifactId],
          dependencies: { [dependency]: recipeRevision }
        },
        { kind: 'prepared', artifactId, recipeRevision }
      )
      if (current && current !== lineage) {
        const duplicateId = `prepared:${current}:data`
        const duplicate = results.get(duplicateId)
        if (duplicate) {
          invalidate(
            [`check:${duplicateId}`],
            'Prepared source continued an explicit predecessor obligation.'
          )
          counts[duplicate.status]--
          pendingIds.delete(duplicateId)
          results.delete(duplicateId)
          for (const key of Object.keys(duplicate.dependencies)) {
            const ids = dependents.get(key)
            ids?.delete(duplicateId)
            if (!ids?.size) dependents.delete(key)
          }
        }
        latestPrepared.delete(current)
      }
      preparedLineages.set(artifactId, lineage)
      latestPrepared.set(lineage, artifactId)
      return lineage
    },
    record(
      value: Omit<DesignCheckResult, 'revision' | 'reason'>,
      recheck?: DesignCheckRecheck
    ) {
      if (recheck && value.origin !== 'tool')
        throw new Error('Only mechanical checks have recheck provenance.')
      const previous = results.get(value.id)
      if (previous && previous.origin !== value.origin)
        throw new Error('A result cannot change its origin.')
      const chain = Object.keys(value.dependencies)
      const visited = new Set<string>()
      for (const key of chain) {
        if (visited.has(key) || !key.startsWith('check:')) continue
        visited.add(key)
        if (key === `check:${value.id}`)
          throw new Error('Check dependency cycle.')
        chain.push(
          ...Object.keys(results.get(key.slice(6))?.dependencies ?? {})
        )
      }
      for (const [dependency, version] of Object.entries(value.dependencies)) {
        if (!dependency.startsWith('check:')) continue
        const upstream = results.get(dependency.slice(6))
        if (
          !upstream ||
          upstream.id === value.id ||
          upstream.status !== 'pass' ||
          String(upstream.revision) !== version
        )
          throw new Error(
            'A check dependency must reference a current passed result.'
          )
      }
      if (
        previous &&
        previous.status === value.status &&
        previous.evidence === value.evidence &&
        JSON.stringify(previous.recheck) === JSON.stringify(recheck) &&
        previous.deferredDecision === value.deferredDecision &&
        JSON.stringify(previous.supersedes) ===
          JSON.stringify(value.supersedes) &&
        JSON.stringify(previous.dependencies) ===
          JSON.stringify(value.dependencies) &&
        JSON.stringify(previous.scope) === JSON.stringify(value.scope)
      )
        return previous.revision
      invalidate([`check:${value.id}`], 'An upstream check changed.')
      for (const key of Object.keys(previous?.dependencies ?? {})) {
        const ids = dependents.get(key)
        ids?.delete(value.id)
        if (!ids?.size) dependents.delete(key)
      }
      if (previous) counts[previous.status]--
      counts[value.status]++
      if (value.status === 'pass') pendingIds.delete(value.id)
      else pendingIds.add(value.id)
      const revision =
        (previous?.revision ?? retiredRevisions.get(value.id)?.revision ?? 0) +
        1
      retiredRevisions.delete(value.id)
      results.set(value.id, {
        ...structuredClone(value),
        revision,
        ...(recheck ? { recheck: structuredClone(recheck) } : {})
      })
      for (const key of Object.keys(value.dependencies)) {
        const ids = dependents.get(key) ?? new Set<string>()
        ids.add(value.id)
        dependents.set(key, ids)
      }
      return revision
    },
    read(options: { includePassed?: boolean; ids?: string[] } = {}) {
      const selectedCounts = { pass: 0, fail: 0, unverified: 0, stale: 0 }
      const items: DesignCheckResult[] = []
      const ids =
        options.ids ?? (options.includePassed ? results.keys() : pendingIds)
      let visitedResults = 0
      for (const id of ids) {
        const result = results.get(id)
        visitedResults++
        if (!result) continue
        selectedCounts[result.status]++
        if (options.includePassed || result.status !== 'pass') {
          const { recheck: _recheck, ...publicResult } = result
          items.push(structuredClone(publicResult))
        }
      }
      return {
        counts: { ...(options.ids ? selectedCounts : counts) },
        items,
        visitedResults
      }
    }
  }
  return owner
}
