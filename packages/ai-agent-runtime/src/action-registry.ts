import { createAiToolContract, describeAiTool } from './tool-contract.js'
import { detachAiJsonValue } from './json-value.js'
import type {
  AiActionDefinition,
  AiActionDescription,
  AiActionRegistry,
  AiActionRegistryErrorCode,
  AiActionResult,
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

class DefaultAiActionRegistry implements AiActionRegistry {
  private readonly actions = new Map<
    string,
    AiActionDefinition<unknown, AiActionResult>
  >()
  private readonly descriptions = new Map<string, AiActionDescription>()
  private disposed = false

  register(action: AiActionDefinition): void {
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

    if (this.actions.has(action.name)) {
      return registryError(
        'AI_ACTION_DUPLICATE',
        `Action "${action.name}" is already registered.`
      )
    }

    const inputSchema = detachJsonValue(action.inputSchema)
    const contract = createAiToolContract({ ...action, inputSchema })
    const registeredAction: AiActionDefinition<unknown, AiActionResult> =
      Object.freeze({ ...contract, execute: action.execute })
    const description = describeAiTool(contract)

    this.actions.set(action.name, registeredAction)
    this.descriptions.set(action.name, description)
  }

  get(name: string): AiActionDefinition | undefined {
    this.assertActive()

    return this.actions.get(name)
  }

  list(): readonly AiActionDescription[] {
    this.assertActive()

    if (this.descriptions.size === 0) {
      return registryError(
        'AI_ACTION_REGISTRY_EMPTY',
        'At least one action must be registered before a provider request.'
      )
    }

    return Object.freeze([...this.descriptions.values()])
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.actions.clear()
    this.descriptions.clear()
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

export const createAiActionRegistry = (): AiActionRegistry =>
  new DefaultAiActionRegistry()
