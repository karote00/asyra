import { createHash } from 'node:crypto'
import {
  createDesignCheckResults,
  designCheckInputSchema,
  designCheckSelectionSchema,
  type DesignCheckSelection
} from './design-check-results'
import { LocalToolInputError } from './local-tool-invocation'
import { operationInputIssue } from './operation-input-schema'
import { toolResultObject, toolResultString } from '../src/ai/tool-contract'

export const mechanicalVerificationSchema = toolResultObject({
  requestId: designCheckInputSchema.properties.requestId,
  checks: designCheckSelectionSchema,
  verification: toolResultObject({
    status: {
      type: 'string',
      enum: ['pass', 'repairable', 'decision-required']
    },
    progress: { type: 'string', minLength: 1 }
  }),
  results: {
    type: 'array',
    items: toolResultObject({
      checkId: toolResultString,
      status: {
        type: 'string',
        enum: ['pass', 'fail', 'unverified', 'stale', 'retired']
      }
    })
  },
  unresolved: {
    type: 'array',
    items: toolResultObject(
      {
        checkId: toolResultString,
        revision: { type: 'integer', minimum: 1 },
        reason: toolResultString,
        findings: { type: 'array' },
        capability: { type: 'string' }
      },
      ['checkId', 'revision', 'reason', 'findings']
    )
  }
})

export interface MechanicalCheckInput {
  requestId: string
  checks: DesignCheckSelection[]
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
export const prescribedPositionFinding = (
  value: unknown
): value is {
  kind: 'container-overflow'
  elementId: string
  parentId: string
} =>
  object(value) &&
  value.kind === 'container-overflow' &&
  typeof value.elementId === 'string' &&
  !!value.elementId &&
  typeof value.parentId === 'string' &&
  !!value.parentId

/** Coordinate selected owner work; Runtime alone interprets finite recipes. */
export const createMechanicalChecks = (options: {
  requestId: string
  store: ReturnType<typeof createDesignCheckResults>
  validate: (
    ids: readonly string[],
    signal: AbortSignal
  ) => Promise<Set<string>>
  measure: (ids: readonly string[], signal: AbortSignal) => Promise<unknown>
  refreshPrepared: (
    signal: AbortSignal,
    dependencies: Set<string>
  ) => Promise<unknown>
}) => {
  const { store } = options
  const admit = (input: unknown) => {
    const issue = operationInputIssue(input, designCheckInputSchema)
    if (issue) {
      throw new LocalToolInputError(issue)
    }
    const value = input as MechanicalCheckInput
    if (value.requestId !== options.requestId) {
      throw new LocalToolInputError(
        'Mechanical checks belong to another request.'
      )
    }
    try {
      store.select(value.checks)
    } catch (error) {
      throw new LocalToolInputError((error as Error).message)
    }
    return value
  }
  const selected = (input: MechanicalCheckInput) =>
    store.select(store.selection(input.checks.map(({ checkId }) => checkId)))
  const targets = (input: MechanicalCheckInput) => [
    ...new Set(
      selected(input).flatMap((item) =>
        !item.retired && item.recheck?.kind === 'measurement'
          ? [item.recheck.elementId]
          : []
      )
    )
  ]
  const refreshPrepared = async (
    input: MechanicalCheckInput,
    signal: AbortSignal
  ) => {
    const dependencies = new Set(
      selected(input).flatMap((item) =>
        !item.retired && item.recheck?.kind === 'prepared'
          ? Object.keys(item.result.dependencies)
          : []
      )
    )
    if (dependencies.size) {
      await options.refreshPrepared(signal, dependencies)
    }
  }
  const snapshot = (
    input: MechanicalCheckInput,
    current: ReadonlySet<string>,
    error?: unknown
  ) => {
    const records = selected(input)
    const unresolved: {
      checkId: string
      revision: number
      reason: string
      findings: readonly unknown[]
      capability?: string
    }[] = []
    const progress: unknown[] = []
    let incomplete = error !== undefined
    for (const item of records) {
      if (item.retired) {
        continue
      }
      const { result, recheck } = item
      if (result.status === 'unverified' || result.status === 'stale') {
        incomplete = true
      }
      const evidenceCurrent =
        recheck?.kind !== 'measurement' || current.has(recheck.elementId)
      if (!evidenceCurrent) {
        incomplete = true
      }
      if (recheck && evidenceCurrent && result.status === 'pass') {
        continue
      }
      const findings = recheck?.kind === 'measurement' ? recheck.findings : []
      const repairable =
        evidenceCurrent &&
        result.status === 'fail' &&
        findings.length > 0 &&
        findings.every(prescribedPositionFinding)
      let reason =
        'The selected check requires current evidence or a primary-agent decision.'
      if (!recheck) {
        reason = 'This check has no supported recheck descriptor.'
      } else if (repairable) {
        reason =
          'Apply explicit positions using current parent attachment evidence.'
      }
      unresolved.push({
        checkId: item.checkId,
        revision: item.revision,
        findings,
        reason,
        ...(repairable ? { capability: 'set-prescribed-child-position' } : {})
      })
      progress.push({
        checkId: item.checkId,
        status: result.status,
        findings: findings
          .map((finding) =>
            object(finding)
              ? Object.fromEntries(
                  Object.entries(finding).sort(([a], [b]) => a.localeCompare(b))
                )
              : finding
          )
          .map((finding) => JSON.stringify(finding))
          .sort(),
        supported: !!recheck
      })
    }
    let status: 'pass' | 'repairable' | 'decision-required' = 'pass'
    if (unresolved.length) {
      status = 'repairable'
    }
    if (incomplete || unresolved.some((item) => !item.capability)) {
      status = 'decision-required'
    }
    return {
      requestId: options.requestId,
      checks: records.map(({ checkId, revision }) => ({ checkId, revision })),
      verification: {
        status,
        progress: createHash('sha256')
          .update(
            JSON.stringify(
              progress.sort((a, b) =>
                JSON.stringify(a).localeCompare(JSON.stringify(b))
              )
            )
          )
          .digest('hex')
      },
      results: records.map((item) => ({
        checkId: item.checkId,
        status: item.retired ? 'retired' : item.result.status
      })),
      unresolved,
      ...(incomplete
        ? {
            status: 'partial',
            settlement: 'completed',
            recovery:
              'Retry only verification with the returned current selection; do not replay writes.',
            ...(error
              ? {
                  message:
                    error instanceof Error
                      ? error.message
                      : 'Mechanical verification interrupted.'
                }
              : {})
          }
        : {})
    }
  }
  return {
    admit,
    async verify(raw: unknown, signal: AbortSignal) {
      const input = admit(raw)
      signal.throwIfAborted()
      let failure: unknown
      try {
        await refreshPrepared(input, signal)
        const ids = targets(input)
        const current = await options.validate(ids, signal)
        const missing = ids.filter((id) => !current.has(id))
        if (missing.length) {
          await options.measure(missing, signal)
        }
      } catch (error) {
        signal.throwIfAborted()
        failure = error
      }
      // Revalidate completed independent receipts even after a partial read.
      let current = new Set<string>()
      try {
        current = await options.validate(targets(input), signal)
      } catch (error) {
        failure ??= error
      }
      signal.throwIfAborted()
      return snapshot(input, current, failure)
    },
    async repairSelection(raw: unknown, signal: AbortSignal) {
      const input = admit(raw)
      signal.throwIfAborted()
      await refreshPrepared(input, signal)
      const ids = targets(input)
      const current = await options.validate(ids, signal)
      signal.throwIfAborted()
      if (ids.some((id) => !current.has(id))) {
        throw new LocalToolInputError(
          'Mechanical evidence is unavailable before repair.'
        )
      }
      // Never silently substitute newer revisions while admitting a write.
      admit(input)
      const records = store.select(input.checks)
      const pending = records.filter(
        (item) => !item.retired && item.result.status !== 'pass'
      )
      if (
        !pending.length ||
        records.some((item) => !item.retired && !item.recheck)
      ) {
        throw new LocalToolInputError(
          'No complete supported pending repair selection.'
        )
      }
      const findings = pending.flatMap((item) =>
        !item.retired &&
        item.result.status === 'fail' &&
        item.recheck?.kind === 'measurement' &&
        item.recheck.findings.length &&
        item.recheck.findings.every(prescribedPositionFinding)
          ? item.recheck.findings
          : []
      )
      if (
        pending.some(
          (item) =>
            item.retired ||
            item.result.status !== 'fail' ||
            item.recheck?.kind !== 'measurement' ||
            !item.recheck.findings.length ||
            !item.recheck.findings.every(prescribedPositionFinding)
        )
      ) {
        throw new LocalToolInputError(
          'The complete pending set is not supported by this repair.'
        )
      }
      return { input, findings, targets: targets(input) }
    }
  }
}
