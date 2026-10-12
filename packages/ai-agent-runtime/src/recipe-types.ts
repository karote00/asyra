import type { AiJsonValue } from './types.js'
import type { AiToolContract } from './tool-contract.js'

export type AiRecipeBinding =
  | { readonly kind: 'literal'; readonly value: AiJsonValue }
  | { readonly kind: 'input'; readonly path: string }
  | { readonly kind: 'step'; readonly step: string; readonly path: string }
  | {
      readonly kind: 'object'
      readonly fields: Readonly<Record<string, AiRecipeBinding>>
    }
  | { readonly kind: 'array'; readonly items: readonly AiRecipeBinding[] }

export interface AiRecipe {
  readonly format: 1
  readonly name: string
  readonly description: string
  readonly revision: number
  readonly inputSchema: AiJsonValue
  readonly outputSchema: AiJsonValue
  readonly steps: readonly {
    readonly id: string
    readonly tool: string
    readonly revision: number
    readonly input: AiRecipeBinding
  }[]
  readonly output: AiRecipeBinding
}

export interface AiRecipeLimits {
  readonly bytes: number
  readonly steps: number
  readonly bindingDepth: number
  readonly bindings: number
  readonly issues: number
}

export interface AiRecipeIssue {
  readonly code:
    | 'format'
    | 'limit'
    | 'schema'
    | 'dependency'
    | 'step'
    | 'binding'
    | 'captured-value'
  readonly path: string
  readonly step?: string
  readonly expected: string
  readonly actual: string
  readonly recovery: string
}

export interface AdmittedAiRecipe {
  readonly recipe: AiRecipe
  readonly contract: AiToolContract
  readonly dependencies: readonly AiToolContract[]
}

export type AiRecipeAdmission =
  | { readonly ok: true; readonly value: AdmittedAiRecipe }
  | {
      readonly ok: false
      readonly issues: readonly AiRecipeIssue[]
      readonly omittedIssues: number
    }

export interface AiRecipeAdmissionOptions {
  readonly resolve: (name: string) => AiToolContract | undefined
  readonly validate: (value: unknown, schema: AiJsonValue) => string | undefined
  readonly limits: AiRecipeLimits
}
