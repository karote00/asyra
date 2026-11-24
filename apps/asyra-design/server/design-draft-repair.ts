import type { DraftRepairTarget } from './design-source-recovery'
import { DesignInputError } from './design-input-error'
import {
  partitionDesignBudget,
  selectDesignSource,
  type DesignPartitionPlan
} from './design-budget'
import { randomUUID } from 'node:crypto'
import { DesignPreparationLimits as limits } from '../src/ai/prepared-design'

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isReservedDraftRepairKey = (key: string) =>
  ['__proto__', 'prototype', 'constructor'].includes(key)

/** Retained source for capacity continuation or repair; never an executable artifact. */
export const createDesignDraftRepairStore = (
  expandedNodeLimit: number = limits.expandedNodes
) => {
  const drafts = new Map<
    string,
    {
      source: string
      bytes: number
      plan: DesignPartitionPlan
      targets?: readonly DraftRepairTarget[]
    }
  >()
  let retainedBytes = 0

  const remove = (id: string) => {
    const draft = drafts.get(id)

    if (draft) {
      retainedBytes -= draft.bytes
    }

    return drafts.delete(id)
  }

  return {
    retain(input: unknown): string | undefined {
      const source = JSON.stringify(input)

      if (source === undefined) {
        return
      }

      const plan = partitionDesignBudget(input, expandedNodeLimit)
      const bytes =
        Buffer.byteLength(source, 'utf8') +
        Buffer.byteLength(JSON.stringify(plan), 'utf8')

      if (bytes > limits.retainedDraftBytes) {
        return
      }

      if (
        drafts.size >= limits.retainedDrafts ||
        retainedBytes + bytes > limits.retainedDraftBytes
      ) {
        return
      }

      const id = randomUUID()

      drafts.set(id, { source, bytes, plan })
      retainedBytes += bytes

      return id
    },

    attachTargets(id: string, targets: readonly DraftRepairTarget[]) {
      const draft = drafts.get(id)
      const bytes = Buffer.byteLength(JSON.stringify(targets))

      if (
        !draft ||
        draft.targets ||
        retainedBytes + bytes > limits.retainedDraftBytes
      ) {
        return false
      }

      draft.targets = structuredClone(targets)
      draft.bytes += bytes
      retainedBytes += bytes

      return true
    },

    readTargets(id: string, offset: number, limit: number) {
      const targets = drafts.get(id)?.targets

      if (
        !targets ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100 ||
        !Number.isSafeInteger(offset) ||
        offset < 0 ||
        offset >= targets.length
      ) {
        throw new DesignInputError(
          'Repair diagnostics are unavailable for this draft revision or offset.'
        )
      }

      const end = Math.min(offset + limit, targets.length)

      return {
        draftId: id,
        total: targets.length,
        items: structuredClone(targets.slice(offset, end)),
        ...(end < targets.length ? { nextOffset: end } : {})
      }
    },

    describe(draftId: string) {
      const draft = drafts.get(draftId)

      return draft
        ? {
            draftId,
            revision: draftId,
            sourceBytes: Buffer.byteLength(draft.source),
            ...(draft.plan.partitions
              ? { partitions: structuredClone(draft.plan.partitions) }
              : {}),
            ...(draft.plan.limitation
              ? { partitionLimitation: { ...draft.plan.limitation } }
              : {})
          }
        : undefined
    },

    repair(
      value: unknown,
      admitMissing?: (candidate: unknown) => boolean
    ): unknown {
      const hasValidRepairEnvelope =
        record(value) &&
        !Object.keys(value).some(
          (key) =>
            ![
              'draftId',
              'replacements',
              'partition',
              'continueFromArtifact'
            ].includes(key)
        )

      if (!hasValidRepairEnvelope || typeof value.draftId !== 'string') {
        throw new DesignInputError(
          'Provide repair.draftId and exactly one partition or replacements array.'
        )
      }

      const hasExactlyOneRepairSource =
        'partition' in value !== 'replacements' in value

      if (!hasExactlyOneRepairSource) {
        throw new DesignInputError(
          'Provide repair.draftId and exactly one partition or replacements array.'
        )
      }

      const draft = drafts.get(value.draftId)

      if (!draft) {
        throw new DesignInputError(
          'Rejected draft is unavailable in this request; resend the source draft.'
        )
      }

      const result = JSON.parse(draft.source)

      if ('partition' in value) {
        if (
          !Number.isSafeInteger(value.partition) ||
          Number(value.partition) < 0 ||
          (value.continueFromArtifact !== undefined &&
            (typeof value.continueFromArtifact !== 'string' ||
              !value.continueFromArtifact))
        ) {
          throw new DesignInputError('Invalid retained partition reference.')
        }

        const partition = draft.plan.partitions?.[Number(value.partition)]

        if (!partition) {
          throw new DesignInputError('Retained partition is unavailable.')
        }

        return selectDesignSource(result, partition.selections)
      }

      if (
        value.continueFromArtifact !== undefined ||
        !Array.isArray(value.replacements)
      ) {
        throw new DesignInputError('Provide a replacements array.')
      }

      if (!value.replacements.length && !admitMissing?.(result)) {
        throw new DesignInputError(
          'Unchanged retained source requires complete owner admission.'
        )
      }

      const paths = new Set<string>()
      let addedField = false

      for (const replacement of value.replacements) {
        if (
          !record(replacement) ||
          Object.keys(replacement).some(
            (key) => !['path', 'value'].includes(key)
          ) ||
          typeof replacement.path !== 'string' ||
          !replacement.path.startsWith('/') ||
          /~(?![01])/u.test(replacement.path) ||
          !Object.hasOwn(replacement, 'value') ||
          paths.has(replacement.path)
        ) {
          throw new DesignInputError(
            'Each replacement requires one unique JSON Pointer path and a value.'
          )
        }

        paths.add(replacement.path)
        const pointer = replacement.path
        const parts = pointer
          .slice(1)
          .split('/')
          .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))

        if (parts.some(isReservedDraftRepairKey)) {
          throw new DesignInputError(
            `Reserved repair path: ${replacement.path}`
          )
        }

        let parent = result

        const unresolved = (index: number) => {
          const prefix =
            pointer
              .split('/')
              .slice(0, index + 1)
              .join('/') || '/'
          const owner =
            record(parent) &&
            typeof parent.type === 'string' &&
            typeof parent.key === 'string'
              ? ` (${parent.type} ${parent.key})`
              : ''

          return new DesignInputError(
            `Repair path does not exist: ${replacement.path}. Resolved ${prefix}${owner}; unresolved segment ${parts[index]}.`
          )
        }

        for (const [index, part] of parts.slice(0, -1).entries()) {
          if (
            !parent ||
            typeof parent !== 'object' ||
            !Object.hasOwn(parent, part)
          ) {
            throw unresolved(index)
          }

          parent = parent[part]
        }

        const key = parts[parts.length - 1]

        const hasWritableParent = parent && typeof parent === 'object'
        const isMissingFieldDisallowed =
          hasWritableParent &&
          !Object.hasOwn(parent, key) &&
          (!admitMissing || Array.isArray(parent))
        const hasInvalidArrayIndex =
          hasWritableParent &&
          !isMissingFieldDisallowed &&
          Array.isArray(parent) &&
          !/^(0|[1-9]\d*)$/.test(key)

        if (
          !hasWritableParent ||
          isMissingFieldDisallowed ||
          hasInvalidArrayIndex
        ) {
          throw unresolved(parts.length - 1)
        }

        if (!Object.hasOwn(parent, key)) {
          addedField = true
        }

        Object.defineProperty(parent, key, {
          value: structuredClone(replacement.value),
          enumerable: true,
          writable: true,
          configurable: true
        })
      }

      if (addedField && !admitMissing?.(result)) {
        throw new DesignInputError(
          'Missing-field repair does not satisfy the complete owner input contract.'
        )
      }

      return result
    },

    release: remove
  }
}
