import { randomUUID } from 'node:crypto'
import { DesignPreparationLimits as limits } from '../src/ai/prepared-design'

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Rejected input only. Immutable references never identify executable artifacts. */
export const createDesignDraftRepairStore = () => {
  const drafts = new Map<string, { source: string; bytes: number }>()
  let retainedBytes = 0
  const remove = (id: string) => {
    const draft = drafts.get(id)
    if (draft) retainedBytes -= draft.bytes
    return drafts.delete(id)
  }
  return {
    retain(input: unknown): string | undefined {
      const source = JSON.stringify(input)
      if (source === undefined) return
      const bytes = Buffer.byteLength(source, 'utf8')
      if (bytes > limits.retainedDraftBytes) return
      while (
        drafts.size >= limits.retainedDrafts ||
        retainedBytes + bytes > limits.retainedDraftBytes
      ) {
        const oldest = drafts.keys().next().value
        if (oldest === undefined)
          throw new Error('Retained draft byte accounting is inconsistent')
        remove(oldest)
      }
      const id = randomUUID()
      drafts.set(id, { source, bytes })
      retainedBytes += bytes
      return id
    },
    repair(value: unknown): unknown {
      if (
        !record(value) ||
        Object.keys(value).some(
          (key) => !['draftId', 'replacements'].includes(key)
        ) ||
        typeof value.draftId !== 'string' ||
        !Array.isArray(value.replacements) ||
        !value.replacements.length
      )
        throw new Error('Provide repair.draftId and nonempty replacements.')
      const draft = drafts.get(value.draftId)
      if (!draft)
        throw new Error(
          'Rejected draft is unavailable in this request; resend the source draft.'
        )
      const result = JSON.parse(draft.source)
      const paths = new Set<string>()
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
        )
          throw new Error(
            'Each replacement requires one unique JSON Pointer path and a value.'
          )
        paths.add(replacement.path)
        const parts = replacement.path
          .slice(1)
          .split('/')
          .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
        let parent = result
        for (const part of parts.slice(0, -1)) {
          if (
            !parent ||
            typeof parent !== 'object' ||
            !Object.hasOwn(parent, part)
          )
            throw new Error(`Repair path does not exist: ${replacement.path}`)
          parent = parent[part]
        }
        const key = parts[parts.length - 1]
        if (
          !parent ||
          typeof parent !== 'object' ||
          !Object.hasOwn(parent, key) ||
          (Array.isArray(parent) && !/^(0|[1-9]\d*)$/.test(key))
        )
          throw new Error(`Repair path does not exist: ${replacement.path}`)
        Object.defineProperty(parent, key, {
          value: structuredClone(replacement.value),
          enumerable: true,
          writable: true,
          configurable: true
        })
      }
      return result
    },
    release: remove
  }
}
