import type { AiRecipeLeaseAdapter } from '@asyra/ai-agent-runtime'
import { operationInputIssue } from './operation-input-schema'

export interface LocalToolOwnership {
  readonly requestId: string
  publish(
    handle: string,
    release: () => void | Promise<void>,
    validate: () => void,
    lifetime?: 'request'
  ): void
  publishAliases(
    entries: readonly { handle: string; ownerHandle: string }[]
  ): void
  assertOwned(handle: string): void
  borrow(handle: string): void
  assertRelease(handle: string): void
  retire(handle: string): void
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** Inspect only declared reference fields, never opaque product payloads or names. */
export const localToolReferences = (
  value: unknown,
  schema: unknown
): string[] => {
  const result = new Set<string>()
  const visit = (item: unknown, shape: unknown, depth: number) => {
    if (depth > 48)
      throw new Error('Artifact reference schema exceeds its depth budget')
    if (!record(shape)) return
    if (typeof shape.$ref === 'string') {
      if (!shape.$ref.startsWith('#/'))
        throw new Error('Artifact reference schema must be local')
      let target: unknown = schema
      for (const key of shape.$ref
        .slice(2)
        .split('/')
        .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))) {
        if (
          (!record(target) && !Array.isArray(target)) ||
          !Object.hasOwn(target, key)
        )
          throw new Error('Missing artifact reference schema')
        target = (target as Record<string, unknown>)[key]
      }
      visit(item, target, depth + 1)
    }
    if (shape['x-runtime-value'] === 'request-artifact') {
      if (typeof item === 'string') {
        result.add(item)
        return
      }
      if (
        Array.isArray(item) &&
        item.every((entry) => typeof entry === 'string')
      ) {
        item.forEach((entry) => result.add(entry))
        return
      }
      throw new Error('Host artifact references require opaque string handles')
    }
    for (const mode of ['allOf', 'anyOf', 'oneOf']) {
      const branches = shape[mode]
      if (!Array.isArray(branches)) continue
      for (const branch of branches) {
        if (mode === 'allOf' || !operationInputIssue(item, branch, schema))
          visit(item, branch, depth + 1)
      }
    }
    if (record(item) && record(shape.properties)) {
      for (const [key, child] of Object.entries(shape.properties)) {
        if (Object.hasOwn(item, key)) visit(item[key], child, depth + 1)
      }
    }
    if (record(item) && record(shape.additionalProperties)) {
      for (const [key, child] of Object.entries(item)) {
        if (!record(shape.properties) || !Object.hasOwn(shape.properties, key))
          visit(child, shape.additionalProperties, depth + 1)
      }
    }
    if (Array.isArray(item)) {
      item.forEach((child, index) =>
        visit(
          child,
          Array.isArray(shape.prefixItems) && index < shape.prefixItems.length
            ? shape.prefixItems[index]
            : shape.items,
          depth + 1
        )
      )
    }
  }
  visit(value, schema, 0)
  return [...result]
}

interface LocalArtifact {
  owners: Set<string | symbol>
  aliases: Set<string>
  state: 'live' | 'releasing' | 'failed'
  release: () => void | Promise<void>
  validate?: () => void
}
interface LocalArtifactCall {
  parentCallId?: string
  references: Set<string>
  closing: boolean
}

/** Host stores own the values; this adapter owns only exact call/request pins. */
export const createLocalToolLeases = (options: {
  requestId: string
  capacity: number
}) => {
  if (
    !options.requestId.trim() ||
    !Number.isSafeInteger(options.capacity) ||
    options.capacity < 1
  )
    throw new TypeError(
      'Artifact ownership requires a request and positive capacity'
    )
  const requestOwner = Symbol('request')
  const artifacts = new Map<string, LocalArtifact>()
  const calls = new Map<string, LocalArtifactCall>()
  const aliases = new Map<string, string>()
  const canonical = (handle: string) => aliases.get(handle) ?? handle
  const forget = (handle: string) => {
    const item = artifacts.get(handle)
    for (const alias of item?.aliases ?? []) aliases.delete(alias)
    artifacts.delete(handle)
  }
  let closing = false
  const releasing = new Map<string, Promise<void>>()
  let disposal: Promise<void> | undefined
  const checkRequest = (requestId: string) => {
    if (requestId !== options.requestId)
      throw new Error('Foreign artifact request')
  }
  const active = () => {
    if (closing) throw new Error('Artifact request is closing')
  }
  const scope = (callId: string) => {
    const call = calls.get(callId)
    if (!call || call.closing)
      throw new Error('Artifact call ownership is unavailable')
    return call
  }
  const artifact = (handle: string) => {
    const item = artifacts.get(canonical(handle))
    if (!item || item.state !== 'live')
      throw new Error('Artifact is unavailable for this request')
    item.validate?.()
    return item
  }
  const cleanup = async (handles: Iterable<string>) => {
    const errors: unknown[] = []
    for (const handle of handles) {
      const item = artifacts.get(handle)
      if (!item || item.owners.size || item.state === 'releasing') continue
      item.state = 'releasing'
      try {
        await item.release()
        forget(handle)
      } catch (error) {
        item.state = 'failed'
        errors.push(error)
      }
    }
    if (errors.length)
      throw new Error(
        errors
          .map((error) =>
            error instanceof Error ? error.message : String(error)
          )
          .join('; ')
      )
  }
  const leases: AiRecipeLeaseAdapter = {
    async open(input) {
      checkRequest(input.requestId)
      active()
      if (!input.callId.trim() || calls.has(input.callId))
        throw new Error('Artifact call identity is already owned')
      const ancestors = new Set<string | symbol>([requestOwner])
      let parent = input.parentCallId
      while (parent !== undefined) {
        const caller = scope(parent)
        ancestors.add(parent)
        parent = caller.parentCallId
      }
      const references = [
        ...new Set(
          localToolReferences(input.input, input.inputSchema).map(canonical)
        )
      ]
      const selected = references.map((handle) => {
        const item = artifact(handle)
        if (![...item.owners].some((owner) => ancestors.has(owner)))
          throw new Error('Artifact is outside caller ownership')
        return item
      })
      calls.set(input.callId, {
        parentCallId: input.parentCallId,
        references: new Set(references),
        closing: false
      })
      selected.forEach((item) => item.owners.add(input.callId))
    },
    async retain(input) {
      checkRequest(input.requestId)
      active()
      const source = scope(input.fromCallId)
      if (source.parentCallId !== input.toCallId)
        throw new Error('Artifact export requires its actual parent')
      const target =
        input.toCallId === undefined ? undefined : scope(input.toCallId)
      const references = [
        ...new Set(
          localToolReferences(input.value, input.outputSchema).map(canonical)
        )
      ]
      const selected = references.map((handle) => {
        const item = artifact(handle)
        if (!item.owners.has(input.fromCallId))
          throw new Error('Cannot export an artifact outside local ownership')
        return item
      })
      selected.forEach((item, index) => {
        item.owners.add(input.toCallId ?? requestOwner)
        target?.references.add(references[index])
      })
    },
    release(input) {
      checkRequest(input.requestId)
      const existing = releasing.get(input.callId)
      if (existing) return existing
      const work = Promise.resolve().then(async () => {
        const call = calls.get(input.callId)
        if (!call) return
        if (
          [...calls.values()].some(
            (child) => child.parentCallId === input.callId
          )
        )
          throw new Error('Artifact call still has an active child')
        call.closing = true
        for (const handle of call.references)
          artifacts.get(handle)?.owners.delete(input.callId)
        await cleanup(call.references)
        calls.delete(input.callId)
      })
      releasing.set(input.callId, work)
      void work
        .finally(() => releasing.delete(input.callId))
        .catch(() => undefined)
      return work
    }
  }
  const assertRelease = (handle: string, callId?: string) => {
    active()
    if (callId !== undefined) scope(callId)
    const item = artifacts.get(canonical(handle))
    if (!item) return
    if (item.state !== 'live')
      throw new Error('Artifact release is already pending')
    if (
      [...item.owners].some(
        (owner) => owner !== requestOwner && owner !== callId
      )
    )
      throw new Error('Artifact is still borrowed by another call')
  }
  const publishAliases = (
    entries: readonly { handle: string; ownerHandle: string }[]
  ) => {
    active()
    if (artifacts.size + aliases.size + entries.length > options.capacity)
      throw new Error('Artifact ownership capacity reached')
    const seen = new Set<string>()
    const selected = entries.map((entry) => {
      if (
        !entry.handle.trim() ||
        seen.has(entry.handle) ||
        artifacts.has(entry.handle) ||
        aliases.has(entry.handle)
      )
        throw new Error('Artifact identity is already published')
      seen.add(entry.handle)
      const root = canonical(entry.ownerHandle)
      return { ...entry, root, artifact: artifact(root) }
    })
    for (const entry of selected) {
      aliases.set(entry.handle, entry.root)
      entry.artifact.aliases.add(entry.handle)
    }
  }
  return {
    ...leases,
    assertRelease,
    retire(handle: string, callId?: string) {
      assertRelease(handle, callId)
      forget(canonical(handle))
    },
    assertOwned(handle: string, callId?: string) {
      active()
      const item = artifact(handle)
      if (
        !item.owners.has(callId ?? requestOwner) &&
        !item.owners.has(requestOwner)
      )
        throw new Error('Artifact is outside caller ownership')
    },
    borrow(handle: string, callId?: string) {
      active()
      if (callId === undefined)
        throw new Error('Artifact borrowing requires a call')
      const caller = scope(callId)
      const root = canonical(handle)
      const item = artifact(root)
      let allowed = item.owners.has(requestOwner) || item.owners.has(callId)
      let parent = caller.parentCallId
      while (!allowed && parent !== undefined) {
        allowed = item.owners.has(parent)
        parent = scope(parent).parentCallId
      }
      if (!allowed) throw new Error('Artifact is outside caller ownership')
      item.owners.add(callId)
      caller.references.add(root)
    },
    publishAliases,
    alias(handle: string, ownerHandle: string) {
      publishAliases([{ handle, ownerHandle }])
    },
    publish(input: {
      handle: string
      callId?: string
      release: () => void | Promise<void>
      validate?: () => void
    }) {
      active()
      const caller =
        input.callId === undefined ? undefined : scope(input.callId)
      if (
        !input.handle.trim() ||
        artifacts.has(input.handle) ||
        aliases.has(input.handle)
      )
        throw new Error('Artifact identity is already published')
      if (artifacts.size + aliases.size >= options.capacity)
        throw new Error('Artifact ownership capacity reached')
      artifacts.set(input.handle, {
        owners: new Set([input.callId ?? requestOwner]),
        aliases: new Set(),
        state: 'live',
        release: input.release,
        validate: input.validate
      })
      caller?.references.add(input.handle)
    },
    dispose() {
      if (disposal) return disposal
      disposal = Promise.resolve().then(async () => {
        if ([...calls.values()].some((call) => !call.closing))
          throw new Error('Artifact request still has active calls')
        closing = true
        for (const [callId] of calls)
          await leases.release({ requestId: options.requestId, callId })
        for (const item of artifacts.values()) item.owners.delete(requestOwner)
        await cleanup(artifacts.keys())
      })
      void disposal.catch(() => {
        disposal = undefined
      })
      return disposal
    }
  }
}
