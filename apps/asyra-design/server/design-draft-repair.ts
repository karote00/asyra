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
    { source: string; bytes: number; plan: DesignPartitionPlan }
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
      if (
        !record(value) ||
        Object.keys(value).some(
          (key) =>
            ![
              'draftId',
              'replacements',
              'partition',
              'continueFromArtifact'
            ].includes(key)
        ) ||
        typeof value.draftId !== 'string' ||
        'partition' in value === 'replacements' in value
      ) {
        throw new Error(
          'Provide repair.draftId and exactly one partition or replacements array.'
        )
      }
      const draft = drafts.get(value.draftId)
      if (!draft) {
        throw new Error(
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
          throw new Error('Invalid retained partition reference.')
        }
        const partition = draft.plan.partitions?.[Number(value.partition)]
        if (!partition) {
          throw new Error('Retained partition is unavailable.')
        }
        return selectDesignSource(result, partition.selections)
      }
      if (
        value.continueFromArtifact !== undefined ||
        !Array.isArray(value.replacements)
      ) {
        throw new Error('Provide a replacements array.')
      }
      if (!value.replacements.length && !admitMissing?.(result)) {
        throw new Error(
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
          throw new Error(
            'Each replacement requires one unique JSON Pointer path and a value.'
          )
        }
        paths.add(replacement.path)
        const parts = replacement.path
          .slice(1)
          .split('/')
          .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
        if (parts.some(isReservedDraftRepairKey)) {
          throw new Error(`Reserved repair path: ${replacement.path}`)
        }
        let parent = result
        for (const part of parts.slice(0, -1)) {
          if (
            !parent ||
            typeof parent !== 'object' ||
            !Object.hasOwn(parent, part)
          ) {
            throw new Error(`Repair path does not exist: ${replacement.path}`)
          }
          parent = parent[part]
        }
        const key = parts[parts.length - 1]
        if (
          !parent ||
          typeof parent !== 'object' ||
          (!Object.hasOwn(parent, key) &&
            (!admitMissing || Array.isArray(parent))) ||
          (Array.isArray(parent) && !/^(0|[1-9]\d*)$/.test(key))
        ) {
          throw new Error(`Repair path does not exist: ${replacement.path}`)
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
        throw new Error(
          'Missing-field repair does not satisfy the complete owner input contract.'
        )
      }
      return result
    },
    release: remove
  }
}
