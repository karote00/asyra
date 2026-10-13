import { detachAiJsonValue } from './json-value.js'
import { createAiToolContract, type AiToolContract } from './tool-contract.js'
import {
  getRecipeExecutionEvidence,
  type AiRecipeExecutionResult
} from './recipe-execution.js'
import { recipeRecord } from './recipe-schema.js'
import { recipeContentKey, type createAiToolLibrary } from './tool-library.js'
import type { AdmittedAiRecipe } from './recipe-types.js'
import type {
  AiJsonValue,
  AiVersionedActionRegistry,
  AiActionAvailability
} from './types.js'

export interface AiToolStoreEntry {
  readonly key: string
  readonly version: string
  readonly record: AiJsonValue
}
export interface AiToolStore {
  read(key: string): Promise<AiToolStoreEntry | undefined>
  /** Return at most limit entries; no implicit execution or registry changes. */
  list(limit: number): Promise<readonly AiToolStoreEntry[]>
  /** Atomically compare the storage version and acknowledge these exact durable bytes. */
  write(input: {
    key: string
    expectedVersion?: string
    record: AiJsonValue
  }): Promise<AiToolStoreEntry>
}
interface StoredRecipe {
  readonly format: 1
  readonly contract: AiToolContract
  readonly body: {
    readonly steps: AdmittedAiRecipe['recipe']['steps']
    readonly output: AdmittedAiRecipe['recipe']['output']
    readonly iteration?: AdmittedAiRecipe['recipe']['iteration']
  }
  readonly dependencies: readonly {
    readonly name: string
    readonly revision: number
    readonly fingerprint: string
  }[]
  readonly availability: AiActionAvailability
  readonly evidence: { readonly callId: string; readonly scope: string } | null
}
export type AiToolSaveResult =
  | {
      readonly status: 'saved'
      readonly availability: AiActionAvailability
      readonly version: string
    }
  | { readonly status: 'unsaved'; readonly issue: string }
export interface AiToolPersistenceOptions {
  readonly registry: AiVersionedActionRegistry
  readonly library: ReturnType<typeof createAiToolLibrary>
  readonly store: AiToolStore
  readonly capacity: number
  readonly check: (
    recipe: AdmittedAiRecipe,
    receipt: AiRecipeExecutionResult
  ) => Promise<{ ok: true; scope: string } | { ok: false; issue: string }>
}
const keyFor = (name: string, revision: number) =>
  JSON.stringify([name, revision])
const message = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).slice(0, 400)
const fingerprintValue = async (value: unknown) => {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(recipeContentKey(detachAiJsonValue(value)))
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
const same = (left: unknown, right: unknown) =>
  recipeContentKey(detachAiJsonValue(left)) ===
  recipeContentKey(detachAiJsonValue(right))
const recipeBody = (
  recipe: AdmittedAiRecipe['recipe']
): StoredRecipe['body'] => ({
  steps: recipe.steps,
  output: recipe.output,
  ...(recipe.iteration === undefined ? {} : { iteration: recipe.iteration })
})
const readStored = (entry: AiToolStoreEntry): StoredRecipe => {
  const value = detachAiJsonValue(entry.record)
  if (
    !entry.version?.trim() ||
    !recipeRecord(value) ||
    value.format !== 1 ||
    Object.keys(value).sort().join(',') !==
      'availability,body,contract,dependencies,evidence,format' ||
    !recipeRecord(value.contract) ||
    !recipeRecord(value.body) ||
    Object.keys(value.body).sort().join(',') !==
      (Object.prototype.hasOwnProperty.call(value.body, 'iteration')
        ? 'iteration,output,steps'
        : 'output,steps') ||
    !Array.isArray(value.body.steps) ||
    !Array.isArray(value.dependencies) ||
    !['candidate', 'eligible', 'suspended', 'retired'].includes(
      value.availability as string
    )
  )
    throw new Error('Unknown or invalid saved recipe format')
  const contract = createAiToolContract(
    value.contract as unknown as AiToolContract
  )
  if (
    keyFor(contract.name, contract.revision) !== entry.key ||
    !same(contract, value.contract)
  )
    throw new Error('Saved identity or descriptor does not match')
  for (const dep of value.dependencies) {
    if (
      !recipeRecord(dep) ||
      Object.keys(dep).sort().join(',') !== 'fingerprint,name,revision' ||
      typeof dep.name !== 'string' ||
      !Number.isSafeInteger(dep.revision) ||
      (dep.revision as number) < 1 ||
      typeof dep.fingerprint !== 'string' ||
      !/^[a-f0-9]{64}$/u.test(dep.fingerprint)
    )
      throw new Error('Invalid saved dependency evidence')
  }
  if (
    value.evidence !== null &&
    (!recipeRecord(value.evidence) ||
      Object.keys(value.evidence).sort().join(',') !== 'callId,scope' ||
      typeof value.evidence.callId !== 'string' ||
      !value.evidence.callId.trim() ||
      typeof value.evidence.scope !== 'string' ||
      !value.evidence.scope.trim())
  )
    throw new Error('Invalid saved execution evidence')
  if (value.availability === 'eligible' && value.evidence === null)
    throw new Error('Eligible tool lacks execution evidence')
  return value as unknown as StoredRecipe
}

export interface AiStoredToolSummary {
  readonly name: string
  readonly revision: number
  readonly description: string
  readonly availability: AiActionAvailability
  readonly version: string
}

const commitStored = async (
  store: AiToolStore,
  key: string,
  record: StoredRecipe,
  prior?: AiToolStoreEntry
): Promise<AiToolStoreEntry> => {
  const bytes = detachAiJsonValue(record)
  if (prior && same(prior.record, bytes)) return prior
  const ack = await store.write({
    key,
    expectedVersion: prior?.version,
    record: bytes
  })
  if (ack.key !== key || !ack.version?.trim() || !same(ack.record, bytes))
    throw new Error('Store did not acknowledge the exact saved record')
  return ack
}

const storedToolSummary = (entry: AiToolStoreEntry): AiStoredToolSummary => {
  const record = readStored(entry)
  return {
    name: record.contract.name,
    revision: record.contract.revision,
    description: record.contract.description,
    availability: record.availability,
    version: entry.version
  }
}

/** State-only host management; listing never admits, registers or executes tools. */
export const createAiToolStoreManagement = (options: {
  readonly store: AiToolStore
  readonly capacity: number
}) => {
  if (!Number.isSafeInteger(options.capacity) || options.capacity < 1)
    throw new TypeError('Management requires a finite capacity')
  return {
    async read(
      name: string,
      revision: number
    ): Promise<AiStoredToolSummary | undefined> {
      const entry = await options.store.read(keyFor(name, revision))
      return entry ? storedToolSummary(entry) : undefined
    },
    async list(): Promise<{
      entries: AiStoredToolSummary[]
      unavailable: { key: string; reason: string }[]
      truncated: boolean
    }> {
      const listed = await options.store.list(options.capacity + 1)
      const entries: AiStoredToolSummary[] = []
      const unavailable: { key: string; reason: string }[] = []
      for (const entry of listed.slice(0, options.capacity)) {
        try {
          entries.push(storedToolSummary(entry))
        } catch (error) {
          unavailable.push({ key: entry.key, reason: message(error) })
        }
      }
      return {
        entries,
        unavailable,
        truncated: listed.length > options.capacity
      }
    },
    async setState(input: {
      name: string
      revision: number
      expectedVersion: string
      availability: 'suspended' | 'retired'
    }): Promise<AiToolSaveResult> {
      try {
        if (
          !input.expectedVersion?.trim() ||
          !['suspended', 'retired'].includes(input.availability)
        )
          throw new Error(
            'An observed version and suspend or retire state are required'
          )
        const key = keyFor(input.name, input.revision)
        const prior = await options.store.read(key)
        if (!prior) throw new Error('Saved revision is unavailable')
        if (prior.version !== input.expectedVersion)
          throw new Error('Saved revision changed; refresh before updating')
        const record = readStored(prior)
        if (
          record.availability === 'retired' &&
          input.availability !== 'retired'
        )
          throw new Error('Retired revisions cannot be revived')
        const ack = await commitStored(
          options.store,
          key,
          { ...record, availability: input.availability },
          prior
        )
        return {
          status: 'saved',
          availability: input.availability,
          version: ack.version
        }
      } catch (error) {
        return { status: 'unsaved', issue: message(error) }
      }
    }
  }
}

/** Generic persistence coordinates host IO only; it never calls a product tool. */
export const createAiToolPersistence = (options: AiToolPersistenceOptions) => {
  if (!Number.isSafeInteger(options.capacity) || options.capacity < 1)
    throw new TypeError('Persistence requires a finite capacity')
  const queues = new Map<string, Promise<unknown>>()
  const serial = async <T>(key: string, work: () => Promise<T>): Promise<T> => {
    const previous = queues.get(key) ?? Promise.resolve()
    const current = previous.catch(() => undefined).then(work)
    queues.set(key, current)
    try {
      return await current
    } finally {
      if (queues.get(key) === current) queues.delete(key)
    }
  }
  const commit = (
    key: string,
    record: StoredRecipe,
    prior?: AiToolStoreEntry
  ) => commitStored(options.store, key, record, prior)
  const management = createAiToolStoreManagement(options)
  const dependenciesCurrent = async (
    record: StoredRecipe
  ): Promise<boolean> => {
    for (const dependency of record.dependencies) {
      const current = options.registry.get(dependency.name)
      if (
        !current ||
        current.revision !== dependency.revision ||
        (await fingerprintValue(createAiToolContract(current))) !==
          dependency.fingerprint
      )
        return false
    }
    return true
  }
  const restore = async (
    entry: AiToolStoreEntry,
    record: StoredRecipe,
    requestId: string
  ) => {
    const { name, description, revision, inputSchema, outputSchema } =
      record.contract
    const current = options.registry.get(name, { requestId, revision })
    if (current) {
      const recipe = options.library.recipe(name, revision)
      if (
        !recipe ||
        !same(recipe.contract, record.contract) ||
        !same(recipeBody(recipe.recipe), record.body)
      )
        throw new Error(
          'Current registry entry conflicts with saved definition'
        )
      return { ok: true as const, name, revision, requestId }
    }
    const latest = options.registry.get(name, { requestId })
    return options.library.submit(
      {
        requestId,
        submissionId: `${entry.key}:${entry.version}:${await fingerprintValue(record)}`,
        expectedRevision: latest?.revision,
        proposal: {
          format: 1,
          name,
          description,
          revision,
          inputSchema,
          outputSchema,
          ...record.body
        }
      },
      { contract: record.contract, dependencies: record.dependencies }
    )
  }
  return {
    async save(input: {
      name: string
      revision: number
      requestId: string
      receipt?: AiRecipeExecutionResult
    }): Promise<AiToolSaveResult> {
      return serial(keyFor(input.name, input.revision), async () => {
        try {
          const registered = options.registry.registration(input.name, {
            requestId: input.requestId,
            revision: input.revision
          })
          const admitted = options.library.recipe(input.name, input.revision)
          if (!registered || registered.kind !== 'composition' || !admitted)
            throw new Error('Current admitted candidate is unavailable')
          let evidence: StoredRecipe['evidence'] = null
          if (input.receipt) {
            const proof = getRecipeExecutionEvidence(input.receipt)
            if (
              !proof ||
              proof.recipe !== admitted ||
              proof.requestId !== input.requestId ||
              input.receipt.status !== 'success' ||
              input.receipt.settlement !== 'completed' ||
              input.receipt.issues.length
            )
              throw new Error(
                'A complete genuine receipt for this exact recipe and request is required'
              )
            const checked = await options.check(admitted, input.receipt)
            if (!checked.ok) throw new Error(checked.issue)
            if (!checked.scope.trim() || checked.scope.length > 2000)
              throw new Error(
                'Applicability evidence needs a bounded nonempty scope'
              )
            evidence = { callId: proof.callId, scope: checked.scope }
          }
          const dependencies = await Promise.all(
            admitted.dependencies.map(async (contract) => ({
              name: contract.name,
              revision: contract.revision,
              fingerprint: await fingerprintValue(contract)
            }))
          )
          const record: StoredRecipe = {
            format: 1,
            contract: admitted.contract,
            body: recipeBody(admitted.recipe),
            dependencies,
            availability: evidence ? 'eligible' : 'candidate',
            evidence
          }
          if (evidence && !(await dependenciesCurrent(record)))
            throw new Error(
              'A dependency is changed, private or not durably eligible'
            )
          const key = keyFor(input.name, input.revision)
          const prior = await options.store.read(key)
          if (prior) {
            const stored = readStored(prior)
            if (
              !same(stored.contract, record.contract) ||
              !same(stored.body, record.body) ||
              !same(stored.dependencies, record.dependencies)
            )
              throw new Error(
                'An immutable saved revision conflicts with this definition'
              )
            if (
              stored.availability === 'retired' ||
              stored.availability === 'suspended'
            )
              throw new Error(
                'Unavailable saved revisions cannot be republished by save'
              )
            if (stored.availability === 'eligible') {
              options.registry.setAvailability(
                input.name,
                input.revision,
                'eligible'
              )
              return {
                status: 'saved',
                availability: 'eligible',
                version: prior.version
              }
            }
          }
          const ack = await commit(key, record, prior)
          if (
            record.availability === 'eligible' &&
            options.registry.registration(input.name, {
              requestId: input.requestId,
              revision: input.revision
            })
          )
            options.registry.setAvailability(
              input.name,
              input.revision,
              'eligible'
            )
          return {
            status: 'saved',
            availability: record.availability,
            version: ack.version
          }
        } catch (error) {
          return { status: 'unsaved', issue: message(error) }
        }
      })
    },
    async resume(input: { name: string; revision: number; requestId: string }) {
      return serial(keyFor(input.name, input.revision), async () => {
        try {
          const entry = await options.store.read(
            keyFor(input.name, input.revision)
          )
          if (!entry) throw new Error('Saved candidate is unavailable')
          const record = readStored(entry)
          if (record.availability !== 'candidate')
            throw new Error('Only saved candidates can be explicitly resumed')
          if (!(await dependenciesCurrent(record)))
            throw new Error('Candidate dependencies require correction')
          return await restore(entry, record, input.requestId)
        } catch (error) {
          return {
            ok: false as const,
            code: 'admission' as const,
            message: message(error)
          }
        }
      })
    },
    async setState(
      name: string,
      revision: number,
      availability: 'suspended' | 'retired'
    ): Promise<AiToolSaveResult> {
      return serial(keyFor(name, revision), async () => {
        try {
          const key = keyFor(name, revision)
          const prior = await options.store.read(key)
          if (!prior) throw new Error('Saved revision is unavailable')
          const result = await management.setState({
            name,
            revision,
            availability,
            expectedVersion: prior.version
          })
          if (result.status !== 'saved') return result
          const localState = options.registry.availability(name, revision)
          if (localState !== undefined && localState !== availability)
            options.registry.setAvailability(name, revision, availability)
          return result
        } catch (error) {
          return { status: 'unsaved', issue: message(error) }
        }
      })
    },
    async load(requestId: string): Promise<{
      loaded: string[]
      unavailable: { key: string; reason: string }[]
      truncated: boolean
    }> {
      const loaded: string[] = []
      const unavailable: { key: string; reason: string }[] = []
      const listed = await options.store.list(options.capacity + 1)
      if (listed.length > options.capacity)
        return {
          loaded,
          unavailable: [
            { key: '', reason: 'Incomplete inventory; no revisions published' }
          ],
          truncated: true
        }
      const blockedNames = new Set<string>()
      const entries: { entry: AiToolStoreEntry; record: StoredRecipe }[] = []
      for (const entry of listed.slice(0, options.capacity)) {
        try {
          entries.push({ entry, record: readStored(entry) })
        } catch (error) {
          unavailable.push({ key: entry.key, reason: message(error) })
          try {
            const identity: unknown = JSON.parse(entry.key)
            if (
              Array.isArray(identity) &&
              identity.length === 2 &&
              typeof identity[0] === 'string'
            )
              blockedNames.add(identity[0])
          } catch {
            /* A corrupt key cannot identify another tool family. */
          }
        }
      }
      const published = new Map<string, number>()
      for (const { record } of entries)
        if (record.availability !== 'candidate')
          published.set(
            record.contract.name,
            Math.max(
              published.get(record.contract.name) ?? 0,
              record.contract.revision
            )
          )
      let pending = entries.filter(({ entry, record }) => {
        let reason: string | undefined
        if (blockedNames.has(record.contract.name))
          reason = 'Corrupt saved revision in this tool family'
        else if (record.availability !== 'eligible')
          reason = record.availability
        else if (
          record.contract.revision !== published.get(record.contract.name)
        )
          reason = 'superseded'

        if (reason) {
          unavailable.push({ key: entry.key, reason })
          return false
        }
        return true
      })
      while (pending.length) {
        const remaining: typeof pending = []
        let progress = false
        for (const item of pending) {
          const { entry, record } = item
          await serial(entry.key, async () => {
            try {
              const fresh = await options.store.read(entry.key)
              if (
                !fresh ||
                fresh.version !== entry.version ||
                !same(fresh.record, entry.record)
              )
                throw new Error(
                  'Saved revision changed during reload; reload the current version'
                )
              if (!(await dependenciesCurrent(record))) {
                remaining.push(item)
                return
              }
              const result = await restore(entry, record, requestId)
              if (!result.ok) throw new Error(result.message)
              options.registry.setAvailability(
                record.contract.name,
                record.contract.revision,
                'eligible'
              )
              loaded.push(record.contract.name)
              progress = true
            } catch (error) {
              unavailable.push({ key: entry.key, reason: message(error) })
            }
          })
        }
        if (!progress) {
          remaining.forEach(({ entry }) =>
            unavailable.push({
              key: entry.key,
              reason: 'dependency-changed-or-unavailable'
            })
          )
          break
        }
        pending = remaining
      }
      return {
        loaded,
        unavailable,
        truncated: listed.length > options.capacity
      }
    }
  }
}
