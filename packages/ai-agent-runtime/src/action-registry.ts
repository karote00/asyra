import { createAiToolContract, describeAiTool } from './tool-contract.js'
import { detachAiJsonValue } from './json-value.js'
import type {
  AiActionDefinition,
  AiRegisteredActionDefinition,
  AiActionDescription,
  AiVersionedActionRegistry,
  AiActionLookup,
  AiActionRegistrationOptions,
  AiActionRegistration,
  AiActionAvailability,
  AiActionRegistryErrorCode,
  AiJsonValue
} from './types.js'

export class AiActionRegistryError extends Error {
  readonly code: AiActionRegistryErrorCode

  constructor(code: AiActionRegistryErrorCode, message: string) {
    super(message)
    this.name = 'AiActionRegistryError'
    this.code = code
  }
}

const registryError = (
  code: AiActionRegistryErrorCode,
  message: string
): never => {
  throw new AiActionRegistryError(code, message)
}

const detachJsonValue = (value: unknown): AiJsonValue => {
  try {
    return detachAiJsonValue(value)
  } catch (error) {
    return registryError(
      'AI_ACTION_INVALID_INPUT_SCHEMA',
      error instanceof Error ? error.message : 'Invalid action input schema'
    )
  }
}

interface RegistryEntry {
  readonly definition: AiRegisteredActionDefinition
  readonly description: AiActionDescription
  readonly kind: 'primitive' | 'composition'
  readonly requestId?: string
  availability: AiActionAvailability
}

class DefaultAiActionRegistry implements AiVersionedActionRegistry {
  private readonly actions = new Map<string, Map<number, RegistryEntry>>()
  private disposed = false

  register(
    action: AiActionDefinition,
    options: AiActionRegistrationOptions = {}
  ): void {
    this.assertActive()

    if (typeof action.name !== 'string' || action.name.trim().length === 0) {
      return registryError(
        'AI_ACTION_INVALID_NAME',
        'Action name must be a non-empty string.'
      )
    }

    if (
      typeof action.description !== 'string' ||
      action.description.trim().length === 0
    ) {
      return registryError(
        'AI_ACTION_INVALID_DESCRIPTION',
        'Action description must be a non-empty string.'
      )
    }

    if (typeof action.execute !== 'function') {
      return registryError(
        'AI_ACTION_INVALID_EXECUTOR',
        'Action executor must be a function.'
      )
    }

    const versions = this.actions.get(action.name)
    const previousEntries = versions ? [...versions.values()] : []
    const latest = previousEntries[previousEntries.length - 1]
    if (latest && options.expectedRevision === undefined) {
      return registryError(
        'AI_ACTION_DUPLICATE',
        `Action "${action.name}" is already registered.`
      )
    }
    if (
      (latest &&
        (options.expectedRevision !== latest.definition.revision ||
          action.revision !== latest.definition.revision + 1)) ||
      (!latest && options.expectedRevision !== undefined)
    ) {
      return registryError(
        'AI_ACTION_REVISION_CONFLICT',
        'The expected registry revision does not match.'
      )
    }
    if (
      (options.kind !== undefined &&
        !['primitive', 'composition'].includes(options.kind)) ||
      (options.requestId !== undefined && !options.requestId.trim()) ||
      (options.kind === 'composition' && !options.requestId) ||
      (latest?.availability === 'candidate' &&
        latest.requestId !== options.requestId) ||
      (latest && latest.kind !== (options.kind ?? 'primitive'))
    ) {
      return registryError(
        'AI_ACTION_INVALID_VISIBILITY',
        'Invalid registration kind or request ownership.'
      )
    }

    const inputSchema = detachJsonValue(action.inputSchema)
    const contract = createAiToolContract({ ...action, inputSchema })
    const registeredAction = Object.freeze({
      ...contract,
      execute: action.execute
    })
    const entry: RegistryEntry = {
      definition: registeredAction,
      description: describeAiTool(contract),
      kind: options.kind ?? 'primitive',
      ...(options.requestId === undefined
        ? {}
        : { requestId: options.requestId }),
      availability: options.requestId === undefined ? 'eligible' : 'candidate'
    }
    const target = versions ?? new Map<number, RegistryEntry>()
    target.set(contract.revision, entry)
    this.actions.set(contract.name, target)
  }

  registration(
    name: string,
    lookup: AiActionLookup = {}
  ): AiActionRegistration | undefined {
    this.assertActive()
    const versions = this.actions.get(name)
    if (!versions) return undefined
    const entries =
      lookup.revision === undefined
        ? [...versions.values()].reverse()
        : [versions.get(lookup.revision)]
    const entry = entries.find(
      (candidate) =>
        candidate &&
        (candidate.availability !== 'candidate' ||
          candidate.requestId === lookup.requestId)
    )
    if (
      !entry ||
      entry.availability === 'suspended' ||
      entry.availability === 'retired'
    )
      return undefined
    return Object.freeze({
      definition: entry.definition,
      kind: entry.kind,
      availability: entry.availability,
      ...(entry.requestId === undefined ? {} : { requestId: entry.requestId })
    })
  }

  get(
    name: string,
    lookup?: AiActionLookup
  ): AiRegisteredActionDefinition | undefined {
    return this.registration(name, lookup)?.definition
  }

  list(lookup?: AiActionLookup): readonly AiActionDescription[] {
    this.assertActive()
    const result: AiActionDescription[] = []
    for (const name of this.actions.keys()) {
      const action = this.get(name, lookup)
      const description =
        action && this.actions.get(name)?.get(action.revision)?.description
      if (description) result.push(description)
    }
    if (!result.length)
      return registryError(
        'AI_ACTION_REGISTRY_EMPTY',
        'At least one action must be registered before a provider request.'
      )
    return Object.freeze(result)
  }

  availability(
    name: string,
    revision: number
  ): AiActionAvailability | undefined {
    this.assertActive()
    return this.actions.get(name)?.get(revision)?.availability
  }

  setAvailability(
    name: string,
    revision: number,
    availability: AiActionAvailability
  ): void {
    this.assertActive()
    const entry = this.actions.get(name)?.get(revision)
    if (
      !entry ||
      !['candidate', 'eligible', 'suspended', 'retired'].includes(
        availability
      ) ||
      entry.availability === 'retired' ||
      (availability === 'candidate' && !entry.requestId)
    )
      return registryError(
        'AI_ACTION_INVALID_VISIBILITY',
        'Invalid availability transition.'
      )
    entry.availability = availability
  }

  remove(name: string, revision: number): void {
    this.assertActive()
    const versions = this.actions.get(name)
    versions?.delete(revision)
    if (versions?.size === 0) this.actions.delete(name)
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.actions.clear()
  }

  private assertActive(): void {
    if (this.disposed) {
      return registryError(
        'AI_ACTION_REGISTRY_DISPOSED',
        'The action registry has been disposed.'
      )
    }
  }
}

export const createAiActionRegistry = (): AiVersionedActionRegistry =>
  new DefaultAiActionRegistry()
