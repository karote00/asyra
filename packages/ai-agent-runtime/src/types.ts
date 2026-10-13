import type { AiToolContractInput, AiToolContract } from './tool-contract.js'
export type AiJsonPrimitive = boolean | null | number | string

export type AiJsonValue =
  | AiJsonPrimitive
  | readonly AiJsonValue[]
  | {
      readonly [key: string]: AiJsonValue
    }

/** Host-owned finite mutation boundary; asynchronous preparation stays outside. */
/** Publish canonical mutation settlement synchronously before yielding to another caller. */
export type AiMutationExecutor = <T>(
  mutate: () => T,
  settled?: (value: T) => void
) => Promise<T>

export interface AiExecutionContext {
  signal: AbortSignal
  readonly observe?: <T>(
    stage: string,
    purpose: string,
    work: () => Promise<T>
  ) => Promise<T>
  readonly reportProgress?: (update: {
    phase: 'settlement'
    summary: string
  }) => void
  readonly runMutation?: AiMutationExecutor
}

export type AiActionResult = unknown

export interface AiActionDefinition<
  TArgs = unknown,
  TResult = AiActionResult
> extends AiToolContractInput {
  execute(args: TArgs, context: AiExecutionContext): Promise<TResult>
}

export interface AiActionDescription {
  readonly name: string
  readonly description: string
  readonly inputSchema: AiJsonValue
}

export interface AiActionLookup {
  readonly requestId?: string
  readonly revision?: number
}

export type AiActionAvailability =
  'candidate' | 'eligible' | 'suspended' | 'retired'
export interface AiActionRegistrationOptions {
  readonly kind?: 'primitive' | 'composition'
  readonly requestId?: string
  readonly expectedRevision?: number
}
export type AiRegisteredActionDefinition = AiToolContract & {
  readonly execute: AiActionDefinition['execute']
}

export interface AiActionRegistration {
  readonly definition: AiRegisteredActionDefinition
  readonly kind: 'primitive' | 'composition'
  readonly availability: AiActionAvailability
  readonly requestId?: string
}
export interface AiVersionedActionRegistry extends AiActionRegistry {
  get(
    name: string,
    lookup?: AiActionLookup
  ): AiRegisteredActionDefinition | undefined
  remove(name: string, revision: number): void
  register(
    action: AiActionDefinition,
    options?: AiActionRegistrationOptions
  ): void
  registration(
    name: string,
    lookup?: AiActionLookup
  ): AiActionRegistration | undefined
  availability(name: string, revision: number): AiActionAvailability | undefined
  setAvailability(
    name: string,
    revision: number,
    availability: AiActionAvailability
  ): void
}

export interface AiActionRegistry {
  register(action: AiActionDefinition): void
  get(name: string, lookup?: AiActionLookup): AiActionDefinition | undefined
  list(lookup?: AiActionLookup): readonly AiActionDescription[]
  dispose(): void
}

export type AiActionRegistryErrorCode =
  | 'AI_ACTION_REVISION_CONFLICT'
  | 'AI_ACTION_INVALID_VISIBILITY'
  | 'AI_ACTION_DUPLICATE'
  | 'AI_ACTION_INVALID_DESCRIPTION'
  | 'AI_ACTION_INVALID_EXECUTOR'
  | 'AI_ACTION_INVALID_INPUT_SCHEMA'
  | 'AI_ACTION_INVALID_NAME'
  | 'AI_ACTION_REGISTRY_DISPOSED'
  | 'AI_ACTION_REGISTRY_EMPTY'
