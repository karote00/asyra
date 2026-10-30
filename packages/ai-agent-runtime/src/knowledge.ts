import type {
  AiKnowledgeIdentity,
  AiKnowledgeMetadata,
  AiKnowledgeOperation,
  AiKnowledgeOptions,
  AiKnowledgeQuery,
  AiKnowledgeResult,
  AiKnowledgeSession,
  AiKnowledgeSource
} from './knowledge-types.js'

export class AiKnowledgeError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'AiKnowledgeError'
  }
}

const fail = (code: string): never => {
  throw new AiKnowledgeError(code)
}
const validId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 128 &&
  /^[a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9][a-zA-Z0-9-]*)*$/.test(value)
const boundedText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max
const list = (value: readonly string[] | undefined): readonly string[] => {
  if (value === undefined) return Object.freeze([])
  if (
    !Array.isArray(value) ||
    value.length > 32 ||
    value.some((id) => !validId(id)) ||
    new Set(value).size !== value.length
  )
    return fail('KNOWLEDGE_INVALID_METADATA')
  return Object.freeze([...value].sort())
}
const admit = (value: AiKnowledgeMetadata): AiKnowledgeMetadata => {
  if (
    !value ||
    !validId(value.id) ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1 ||
    !boundedText(value.description, 2048) ||
    !Array.isArray(value.provenance) ||
    !value.provenance.length ||
    value.provenance.length > 16 ||
    value.provenance.some((item) => !boundedText(item, 2048))
  )
    return fail('KNOWLEDGE_INVALID_METADATA')
  const overrides = value.overrides ?? []
  if (
    !Array.isArray(overrides) ||
    overrides.length > 32 ||
    overrides.some(
      (item) =>
        !item || !validId(item.target) || !Number.isSafeInteger(item.priority)
    ) ||
    new Set(overrides.map((item) => item.target)).size !== overrides.length
  )
    return fail('KNOWLEDGE_INVALID_METADATA')
  return Object.freeze({
    id: value.id,
    revision: value.revision,
    description: value.description,
    provenance: Object.freeze([...value.provenance]),
    contexts: list(value.contexts),
    children: list(value.children),
    references: list(value.references),
    extends: list(value.extends),
    overrides: Object.freeze(
      overrides.map((item) =>
        Object.freeze({ target: item.target, priority: item.priority })
      )
    )
  })
}
const source = (metadata: AiKnowledgeMetadata): AiKnowledgeSource =>
  Object.freeze({
    id: metadata.id,
    revision: metadata.revision,
    provenance: metadata.provenance
  })

/** Trusted host controller. Only the returned session is exposed to read tools. */
export const createAiKnowledgeAccess = (options: AiKnowledgeOptions) => {
  if (
    !boundedText(options.tenantId, 256) ||
    !boundedText(options.scopeId, 256) ||
    typeof options.authorize !== 'function' ||
    typeof options.read !== 'function'
  )
    return fail('KNOWLEDGE_INVALID_CONFIGURATION')
  const tenantId = options.tenantId
  const scopeId = options.scopeId
  const authorize = options.authorize
  const provider = options.read
  const entries = new Map<string, AiKnowledgeMetadata>()
  const sessions = new Set<AiKnowledgeSession>()
  const revisions = new Map<string, number>()
  let generation = 0
  let disposed = false
  const active = () => {
    if (disposed) fail('KNOWLEDGE_DISPOSED')
  }
  const identity = (principal: unknown, taskId?: string): AiKnowledgeIdentity =>
    Object.freeze({
      tenantId,
      scopeId,
      principal,
      ...(taskId ? { taskId } : {})
    })
  const permitted = (
    operation: AiKnowledgeOperation,
    who: AiKnowledgeIdentity,
    metadata?: AiKnowledgeMetadata
  ) => {
    active()
    try {
      return authorize(operation, who, metadata) === true
    } catch {
      return false
    }
  }
  const requirePermission = (
    operation: AiKnowledgeOperation,
    who: AiKnowledgeIdentity,
    metadata?: AiKnowledgeMetadata
  ) => {
    if (!permitted(operation, who, metadata)) fail('KNOWLEDGE_UNAUTHORIZED')
  }
  const changed = () => {
    generation += 1
  }
  return Object.freeze({
    register(value: AiKnowledgeMetadata, principal: unknown) {
      active()
      const metadata = admit(value)
      requirePermission('register', identity(principal), metadata)
      if (entries.has(metadata.id)) fail('KNOWLEDGE_DUPLICATE')
      if (revisions.size >= 128 && !revisions.has(metadata.id))
        fail('KNOWLEDGE_LIMIT')
      if (metadata.revision <= (revisions.get(metadata.id) ?? 0))
        fail('KNOWLEDGE_REVISION_CONFLICT')
      entries.set(metadata.id, metadata)
      revisions.set(metadata.id, metadata.revision)
      changed()
    },
    update(
      value: AiKnowledgeMetadata,
      expectedRevision: number,
      principal: unknown
    ) {
      active()
      const metadata = admit(value)
      const who = identity(principal)
      const previous = entries.get(metadata.id)
      requirePermission('update', who, previous)
      requirePermission('update', who, metadata)
      if (
        !previous ||
        !Number.isSafeInteger(expectedRevision) ||
        expectedRevision < 1 ||
        previous.revision !== expectedRevision ||
        metadata.revision <= expectedRevision
      )
        fail('KNOWLEDGE_REVISION_CONFLICT')
      entries.set(metadata.id, metadata)
      revisions.set(metadata.id, metadata.revision)
      changed()
    },
    unregister(id: string, expectedRevision: number, principal: unknown) {
      active()
      const metadata = entries.get(id)
      requirePermission('unregister', identity(principal), metadata)
      if (!metadata || metadata.revision !== expectedRevision)
        fail('KNOWLEDGE_REVISION_CONFLICT')
      entries.delete(id)
      changed()
    },
    openSession(
      principal: unknown,
      taskId: string,
      delivery: { retainResults?: boolean } = {}
    ): AiKnowledgeSession {
      active()
      if (!boundedText(taskId, 256)) return fail('KNOWLEDGE_INVALID_IDENTITY')
      if (sessions.size >= 32) return fail('KNOWLEDGE_LIMIT')
      const retainResults = delivery.retainResults === true
      const who = identity(principal, taskId)
      const delivered = new Map<
        string,
        {
          contextKey: string
          contexts: readonly string[]
          full?: AiKnowledgeResult
          response?: AiKnowledgeResult
        }
      >()
      let contextEpoch = 0
      let deliveryGeneration = generation
      let closed = false
      let pendingReads = 0
      const assertSession = () => {
        active()
        if (closed) fail('KNOWLEDGE_DISPOSED')
        if (deliveryGeneration !== generation) {
          delivered.clear()
          deliveryGeneration = generation
        }
      }
      const relevant = (
        metadata: AiKnowledgeMetadata,
        contexts: readonly string[]
      ) =>
        !metadata.contexts?.length ||
        metadata.contexts.some((context) => contexts.includes(context))
      const session: AiKnowledgeSession = Object.freeze({
        discover(contexts: readonly string[] = [], ids?: readonly string[]) {
          assertSession()
          const labels = list(contexts)
          const roots = ids === undefined ? entries.keys() : list(ids)
          if (ids !== undefined && !ids.length)
            fail('KNOWLEDGE_INVALID_METADATA')
          requirePermission('discover', who)
          const choices = new Map<string, AiKnowledgeMetadata>()
          const visited = new Set<string>()
          const visiting = new Set<string>()
          const visit = (id: string, depth: number) => {
            if (visiting.has(id)) fail('KNOWLEDGE_CYCLE')
            if (visited.has(id)) return
            visited.add(id)
            const metadata = entries.get(id)
            if (
              !metadata ||
              !relevant(metadata, labels) ||
              !permitted('discover', who, metadata)
            )
              return
            if (depth > 16) fail('KNOWLEDGE_LIMIT')
            choices.set(id, metadata)
            visiting.add(id)
            for (const child of metadata.children ?? []) visit(child, depth + 1)
            visiting.delete(id)
          }
          for (const id of roots) visit(id, 0)
          return Object.freeze(
            [...choices.values()]
              .sort((a, b) => (a.id < b.id ? -1 : 1))
              .map((metadata) =>
                Object.freeze({
                  ...metadata,
                  children: Object.freeze(
                    (metadata.children ?? []).filter((id) => choices.has(id))
                  )
                })
              )
          )
        },
        async retrieve(
          query: AiKnowledgeQuery,
          signal: AbortSignal
        ): Promise<AiKnowledgeResult> {
          assertSession()
          if (pendingReads >= 8) fail('KNOWLEDGE_LIMIT')
          pendingReads += 1
          try {
            signal.throwIfAborted()
            if (!query || !Array.isArray(query.ids) || !query.ids.length)
              return fail('KNOWLEDGE_INVALID_QUERY')
            const ids = list(query.ids)
            const contexts = list(query.contexts)
            if (query.fromResult !== undefined) {
              if (
                !boundedText(query.fromResult, 128) ||
                query.rehydrate !== undefined ||
                query.reuseFrom !== undefined
              )
                return fail('KNOWLEDGE_INVALID_QUERY')
              const original = [...delivered.values()].find(
                (value) => value.contextKey === query.fromResult
              )
              if (!retainResults || !original?.full)
                return fail('KNOWLEDGE_REUSE_UNAVAILABLE')
              if (
                query.contexts !== undefined &&
                JSON.stringify(contexts) !== JSON.stringify(original.contexts)
              )
                return fail('KNOWLEDGE_INVALID_QUERY')
              const full = original.full
              const epoch = contextEpoch
              const byTarget = new Map(
                full.documents.map((doc) => [doc.target, doc])
              )
              const selected = new Set<string>()
              const expandedOverrides = new Set<string>()
              const visitRetained = (id: string, includeOverrides = true) => {
                if (
                  selected.has(id) &&
                  (!includeOverrides || expandedOverrides.has(id))
                )
                  return
                const document = byTarget.get(id)
                const metadata = entries.get(id)
                if (!document || !metadata)
                  return fail('KNOWLEDGE_REUSE_UNAVAILABLE')
                requirePermission('read', who, metadata)
                if (!relevant(metadata, original.contexts))
                  return fail('KNOWLEDGE_NOT_APPLICABLE')
                selected.add(id)
                if (includeOverrides) expandedOverrides.add(id)
                for (const dependency of [
                  ...(metadata.references ?? []),
                  ...(metadata.extends ?? [])
                ])
                  visitRetained(dependency)
                if (includeOverrides)
                  for (const override of metadata.overrides ?? [])
                    visitRetained(override.target)
                if (document.source.id !== id)
                  visitRetained(document.source.id, false)
              }
              for (const id of ids) visitRetained(id)
              assertSession()
              signal.throwIfAborted()
              if (generation !== full.generation)
                return fail('KNOWLEDGE_STALE_REVISION')
              if (contextEpoch !== epoch) return fail('KNOWLEDGE_STALE_CONTEXT')
              const key = JSON.stringify(['fromResult', query.fromResult, ids])
              const previous = delivered.get(key)?.response
              if (previous) return previous
              const documents = Object.freeze(
                full.documents.filter((doc) => selected.has(doc.target))
              )
              const sourceIds = new Set(
                documents.flatMap((doc) => [
                  doc.source.id,
                  ...(doc.replacedSource ? [doc.replacedSource.id] : [])
                ])
              )
              const result: AiKnowledgeResult = Object.freeze({
                ...full,
                contextKey: globalThis.crypto.randomUUID(),
                alreadyDelivered: false,
                documents,
                sources: Object.freeze(
                  full.sources.filter((value) => sourceIds.has(value.id))
                )
              })
              if (delivered.size >= 64)
                for (const [entryKey, entry] of delivered) {
                  if (entry === original) continue
                  delivered.delete(entryKey)
                  break
                }
              delivered.set(key, {
                contextKey: result.contextKey,
                contexts: original.contexts,
                full: result,
                response: result
              })
              return result
            }
            if (
              query.rehydrate !== undefined &&
              typeof query.rehydrate !== 'boolean'
            )
              return fail('KNOWLEDGE_INVALID_QUERY')
            if (
              query.reuseFrom !== undefined &&
              (!Array.isArray(query.reuseFrom) ||
                query.reuseFrom.length > 32 ||
                query.reuseFrom.some((key) => !boundedText(key, 128)) ||
                new Set(query.reuseFrom).size !== query.reuseFrom.length)
            )
              return fail('KNOWLEDGE_INVALID_QUERY')
            const reuseFrom = query.rehydrate
              ? []
              : [...(query.reuseFrom ?? [])].sort()
            if (query.rehydrate) session.invalidateContext()
            const epoch = contextEpoch
            const version = generation
            const ordered: AiKnowledgeMetadata[] = []
            const visiting = new Set<string>()
            const visited = new Set<string>()
            const visit = (id: string, depth: number) => {
              if (visiting.has(id)) fail('KNOWLEDGE_CYCLE')
              if (visited.has(id)) return
              if (depth > 16 || visited.size + visiting.size >= 64)
                fail('KNOWLEDGE_LIMIT')
              const metadata = entries.get(id)
              if (!metadata) return fail('KNOWLEDGE_NOT_FOUND')
              requirePermission('read', who, metadata)
              if (!relevant(metadata, contexts))
                fail('KNOWLEDGE_NOT_APPLICABLE')
              visiting.add(id)
              const dependencies = new Set([
                ...(metadata.references ?? []),
                ...(metadata.extends ?? []),
                ...(metadata.overrides ?? []).map((item) => item.target)
              ])
              for (const dependency of [...dependencies].sort())
                visit(dependency, depth + 1)
              visiting.delete(id)
              visited.add(id)
              ordered.push(metadata)
            }
            for (const id of ids) visit(id, 0)
            const overrides = new Map<
              string,
              { metadata: AiKnowledgeMetadata; priority: number }
            >()
            const overridePriorities = new Set<string>()
            for (const metadata of ordered)
              for (const override of metadata.overrides ?? []) {
                const priorityKey = JSON.stringify([
                  override.target,
                  override.priority
                ])
                if (overridePriorities.has(priorityKey))
                  fail('KNOWLEDGE_OVERRIDE_CONFLICT')
                overridePriorities.add(priorityKey)
                const previous = overrides.get(override.target)
                if (previous && previous.priority === override.priority)
                  fail('KNOWLEDGE_OVERRIDE_CONFLICT')
                if (!previous || previous.priority < override.priority)
                  overrides.set(override.target, {
                    metadata,
                    priority: override.priority
                  })
              }
            const key = JSON.stringify([
              ids,
              contexts,
              version,
              epoch,
              reuseFrom
            ])
            const recheck = () => {
              assertSession()
              signal.throwIfAborted()
              if (generation !== version) fail('KNOWLEDGE_STALE_REVISION')
              if (contextEpoch !== epoch) fail('KNOWLEDGE_STALE_CONTEXT')
              for (const metadata of ordered)
                requirePermission('read', who, metadata)
            }
            recheck()
            const sources = Object.freeze(ordered.map(source))
            const retained = delivered.get(key)
            if (retained?.response) return retained.response
            if (retained)
              return Object.freeze({
                trust: 'untrusted-advice',
                generation: version,
                contextKey: retained.contextKey,
                alreadyDelivered: true,
                documents: Object.freeze([]),
                sources
              })
            const held = reuseFrom.map((contextKey) => {
              const previous = [...delivered.values()].find(
                (value) => value.contextKey === contextKey
              )
              if (!retainResults || !previous?.full)
                return fail('KNOWLEDGE_REUSE_UNAVAILABLE')
              return previous.full
            })
            let bytes = 0
            const texts = new Map<string, string>()
            const replacementTexts = new Map<string, Map<string, string>>()
            for (const metadata of ordered) {
              const value = await provider(metadata, who, signal)
              recheck()
              if (!value || value.revision !== metadata.revision)
                fail('KNOWLEDGE_STALE_REVISION')
              if (!boundedText(value.text, 65536))
                fail('KNOWLEDGE_INVALID_CONTENT')
              const contributions = value.overrides ?? []
              const targets = new Set(
                (metadata.overrides ?? []).map((item) => item.target)
              )
              if (
                !Array.isArray(contributions) ||
                contributions.length !== targets.size ||
                contributions.some(
                  (item) =>
                    !item ||
                    !targets.has(item.target) ||
                    !boundedText(item.text, 65536)
                ) ||
                new Set(contributions.map((item) => item.target)).size !==
                  targets.size
              )
                fail('KNOWLEDGE_INVALID_CONTENT')
              replacementTexts.set(
                metadata.id,
                new Map(contributions.map((item) => [item.target, item.text]))
              )
              bytes += new TextEncoder().encode(value.text).byteLength
              for (const item of contributions)
                bytes += new TextEncoder().encode(item.text).byteLength
              if (bytes > 262144) fail('KNOWLEDGE_LIMIT')
              texts.set(metadata.id, value.text)
            }
            const documents = ordered.map((metadata) => {
              const replacement = overrides.get(metadata.id)?.metadata
              const text = replacement
                ? replacementTexts.get(replacement.id)?.get(metadata.id)
                : texts.get(metadata.id)
              return Object.freeze({
                target: metadata.id,
                source: source(replacement ?? metadata),
                ...(replacement ? { replacedSource: source(metadata) } : {}),
                text: text ?? fail('KNOWLEDGE_INVALID_CONTENT')
              })
            })
            if (
              documents.reduce(
                (total, document) =>
                  total + new TextEncoder().encode(document.text).byteLength,
                0
              ) > 262144
            )
              fail('KNOWLEDGE_LIMIT')
            recheck()
            // Concurrent completions share the already published immutable identity.
            const completed = delivered.get(key)?.response
            if (completed) return completed
            if (delivered.size >= 64) delivered.clear()
            const result: AiKnowledgeResult = Object.freeze({
              trust: 'untrusted-advice',
              generation: version,
              contextKey: globalThis.crypto.randomUUID(),
              alreadyDelivered: false,
              documents: Object.freeze(documents),
              sources
            })
            const response: AiKnowledgeResult = held.length
              ? Object.freeze({
                  ...result,
                  documents: Object.freeze(
                    result.documents.map((document) => {
                      const previous = held.find((value) =>
                        value.documents.some(
                          (prior) =>
                            prior.target === document.target &&
                            prior.text === document.text &&
                            prior.source.id === document.source.id &&
                            prior.source.revision ===
                              document.source.revision &&
                            prior.replacedSource?.id ===
                              document.replacedSource?.id &&
                            prior.replacedSource?.revision ===
                              document.replacedSource?.revision
                        )
                      )
                      if (!previous) return document
                      const { text: _text, ...identity } = document
                      return Object.freeze({
                        ...identity,
                        retainedFrom: previous.contextKey
                      })
                    })
                  )
                })
              : result
            delivered.set(key, {
              contextKey: result.contextKey,
              contexts,
              ...(retainResults ? { full: result, response } : {})
            })
            return response
          } finally {
            pendingReads -= 1
          }
        },
        invalidateContext() {
          assertSession()
          contextEpoch += 1
          delivered.clear()
        },
        dispose() {
          closed = true
          delivered.clear()
          sessions.delete(session)
        }
      })
      sessions.add(session)
      return session
    },
    dispose() {
      disposed = true
      for (const session of sessions) session.dispose()
      entries.clear()
      revisions.clear()
    }
  })
}
