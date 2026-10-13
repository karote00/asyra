import { recipeExecutionSteps } from './recipe-format.js'
import type { AiToolContract } from './tool-contract.js'
import { detachAiJsonValue } from './json-value.js'
import { admitAiRecipe } from './recipe-admission.js'
import type {
  AdmittedAiRecipe,
  AiRecipeAdmissionOptions,
  AiRecipeIssue
} from './recipe-types.js'
import type {
  AiActionDefinition,
  AiVersionedActionRegistry,
  AiJsonValue
} from './types.js'

export interface AiRecipeSubmission {
  readonly requestId: string
  readonly submissionId: string
  readonly proposal: unknown
  readonly expectedRevision?: number
}
export type AiRecipeSubmissionResult =
  | {
      readonly ok: true
      readonly name: string
      readonly revision: number
      readonly requestId: string
    }
  | {
      readonly ok: false
      readonly code:
        | 'submission-conflict'
        | 'no-progress'
        | 'admission'
        | 'registration'
        | 'capacity'
      readonly message: string
      readonly issues?: readonly AiRecipeIssue[]
      readonly omittedIssues?: number
    }

export interface AiToolLibraryOptions extends Omit<
  AiRecipeAdmissionOptions,
  'resolve'
> {
  readonly registry: AiVersionedActionRegistry
  readonly capacity: number
  /** Host construction is trusted code. A recipe can never supply a function. */
  readonly createExecutor: (
    recipe: AdmittedAiRecipe,
    requestId: string
  ) => AiActionDefinition['execute']
}

export const recipeContentKey = (value: AiJsonValue): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(recipeContentKey).join(',')}]`
  return `{${Object.entries(value)
    .sort(([a], [b]) => {
      if (a === b) return 0
      return a < b ? -1 : 1
    })
    .map(([key, item]) => `${JSON.stringify(key)}:${recipeContentKey(item)}`)
    .join(',')}}`
}
const failure = (
  code: Extract<AiRecipeSubmissionResult, { ok: false }>['code'],
  message: string
): AiRecipeSubmissionResult => Object.freeze({ ok: false, code, message })

/** Owns candidate submissions; definitions and discovery stay in the registry. */
export const createAiToolLibrary = (options: AiToolLibraryOptions) => {
  if (!Number.isSafeInteger(options.capacity) || options.capacity < 1)
    throw new TypeError('Library capacity must be a positive safe integer')
  const submissions = new Map<
    string,
    { content: string; result: AiRecipeSubmissionResult; requestId: string }
  >()
  const recipes = new Map<
    string,
    { admitted: AdmittedAiRecipe; requestId: string }
  >()
  const key = (name: string, revision: number) =>
    JSON.stringify([name, revision])
  return {
    submit(
      input: AiRecipeSubmission,
      expected?: {
        contract: AiToolContract
        dependencies: readonly { name: string; revision: number }[]
      }
    ): AiRecipeSubmissionResult {
      if (!input.requestId?.trim() || !input.submissionId?.trim())
        return failure(
          'admission',
          'Request and submission identities are required.'
        )
      let content: string
      try {
        content = recipeContentKey(
          detachAiJsonValue({
            proposal: input.proposal,
            expectedRevision: input.expectedRevision ?? null,
            expected: expected ?? null
          })
        )
      } catch {
        return failure(
          'admission',
          'The proposal must contain only JSON values.'
        )
      }
      if (new TextEncoder().encode(content).byteLength > options.limits.bytes)
        return failure(
          'admission',
          'Proposal exceeds the configured byte budget.'
        )
      const id = JSON.stringify([input.requestId, input.submissionId])
      const previous = submissions.get(id)
      if (previous) {
        if (content !== previous.content)
          return failure(
            'submission-conflict',
            'Use a new submission identity for changed content.'
          )
        if (!previous.result.ok)
          return failure(
            'no-progress',
            'The unchanged rejected proposal needs correction; no work was repeated.'
          )
        if (
          !options.registry.get(previous.result.name, {
            requestId: input.requestId,
            revision: previous.result.revision
          })
        )
          return failure(
            'registration',
            'The previously admitted revision is no longer available.'
          )
        return previous.result
      }
      if (
        submissions.size >= options.capacity ||
        recipes.size >= options.capacity
      )
        return failure(
          'capacity',
          'Library capacity is reached; release completed requests or remove an unused revision.'
        )
      const admitted = admitAiRecipe(input.proposal, {
        ...options,
        resolve: (name) =>
          options.registry.get(name, { requestId: input.requestId })
      })
      let result: AiRecipeSubmissionResult
      if (!admitted.ok) {
        result = Object.freeze({
          ok: false,
          code: 'admission',
          message: 'Correct the rejected paths and submit a new identity.',
          issues: admitted.issues,
          omittedIssues: admitted.omittedIssues
        })
      } else {
        try {
          if (expected) {
            const actual = admitted.value.dependencies.map(
              ({ name, revision }) => ({ name, revision })
            )
            const identities = (
              items: readonly { name: string; revision: number }[]
            ) =>
              items
                .map((item) => JSON.stringify([item.name, item.revision]))
                .sort()
            if (
              recipeContentKey(detachAiJsonValue(expected.contract)) !==
                recipeContentKey(detachAiJsonValue(admitted.value.contract)) ||
              JSON.stringify(identities(expected.dependencies)) !==
                JSON.stringify(identities(actual))
            ) {
              result = failure(
                'admission',
                'Saved contract or dependency inventory differs from current admission.'
              )
              submissions.set(id, {
                content,
                result,
                requestId: input.requestId
              })
              return result
            }
          }
          let expandedSteps = 0
          const inspectGraph = (
            current: AdmittedAiRecipe,
            ancestors: ReadonlySet<string>,
            multiplier = 1
          ) => {
            const identity = key(
              current.contract.name,
              current.contract.revision
            )
            if (ancestors.has(identity))
              throw new Error('Composition dependency cycle is not allowed.')
            const next = new Set([...ancestors, identity])
            for (const { step, weight } of recipeExecutionSteps(
              current.recipe
            )) {
              const count = multiplier * weight
              expandedSteps += count
              if (
                !Number.isSafeInteger(expandedSteps) ||
                expandedSteps > options.limits.steps
              )
                throw new Error('Expanded composition exceeds the step budget.')
              const dependency = options.registry.registration(step.tool, {
                requestId: input.requestId,
                revision: step.revision
              })
              if (!dependency)
                throw new Error('An exact dependency is no longer available.')
              if (dependency.kind === 'composition') {
                const nested = recipes.get(key(step.tool, step.revision))
                if (!nested)
                  throw new Error(
                    'Composition implementation is not admitted by this library.'
                  )
                inspectGraph(nested.admitted, next, count)
              }
            }
          }
          try {
            inspectGraph(admitted.value, new Set())
          } catch (error) {
            result = failure(
              'admission',
              error instanceof Error
                ? error.message
                : 'Dependency graph is invalid.'
            )
            submissions.set(id, { content, result, requestId: input.requestId })
            return result
          }
          options.registry.register(
            {
              ...admitted.value.contract,
              execute: options.createExecutor(admitted.value, input.requestId)
            },
            {
              kind: 'composition',
              requestId: input.requestId,
              ...(input.expectedRevision === undefined
                ? {}
                : { expectedRevision: input.expectedRevision })
            }
          )
          recipes.set(
            key(admitted.value.contract.name, admitted.value.contract.revision),
            { admitted: admitted.value, requestId: input.requestId }
          )
          result = Object.freeze({
            ok: true,
            name: admitted.value.contract.name,
            revision: admitted.value.contract.revision,
            requestId: input.requestId
          })
        } catch (error) {
          result = failure(
            'registration',
            error instanceof Error ? error.message : 'Registration failed.'
          )
        }
      }
      submissions.set(id, { content, result, requestId: input.requestId })
      return result
    },
    recipe(name: string, revision: number): AdmittedAiRecipe | undefined {
      return recipes.get(key(name, revision))?.admitted
    },
    remove(name: string, revision: number): boolean {
      if (!recipes.delete(key(name, revision))) return false
      options.registry.remove(name, revision)
      return true
    },
    releaseRequest(requestId: string): void {
      for (const [id, submission] of submissions)
        if (submission.requestId === requestId) submissions.delete(id)
      for (const [id, entry] of recipes) {
        if (entry.requestId !== requestId) continue
        const { name, revision } = entry.admitted.contract
        const registered = options.registry.registration(name, {
          requestId,
          revision
        })
        if (registered?.availability === 'candidate') {
          options.registry.remove(name, revision)
          recipes.delete(id)
        }
      }
    }
  }
}
