import { recipeFormatKeys } from './recipe-format.js'
import { detachAiJsonValue } from './json-value.js'
import { createAiToolContract, type AiToolContract } from './tool-contract.js'
import type { AiJsonValue } from './types.js'
import type {
  AiRecipe,
  AiRecipeAdmission,
  AiRecipeAdmissionOptions,
  AiRecipeIssue
} from './recipe-types.js'
import {
  readRecipeSchema,
  recipeAssignable,
  recipeCapturesValue,
  recipeRecord,
  recipeOwn,
  recipeSchemaAt,
  type RecipeSchema
} from './recipe-schema.js'

const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length &&
  keys.every((key) => recipeOwn(value, key))
const reason = (error: unknown) =>
  error instanceof Error ? error.message : 'Validation failed'

/** Admission is inert. Dependencies are descriptors, never invoked implementations. */
export const admitAiRecipe = (
  input: unknown,
  options: AiRecipeAdmissionOptions
): AiRecipeAdmission => {
  if (
    !options.limits ||
    !exactKeys(options.limits as unknown as Record<string, unknown>, [
      'bytes',
      'steps',
      'bindingDepth',
      'bindings',
      'issues'
    ])
  )
    throw new TypeError('All recipe limits must be explicitly configured')
  for (const value of Object.values(options.limits))
    if (!Number.isSafeInteger(value) || value < 1)
      throw new TypeError('Recipe limits must be positive safe integers')
  const issues: AiRecipeIssue[] = []
  let omittedIssues = 0
  const issue = (
    code: AiRecipeIssue['code'],
    path: string,
    expected: string,
    actual: string,
    step?: string
  ) => {
    if (issues.length >= options.limits.issues) {
      omittedIssues++
      return
    }
    issues.push(
      Object.freeze({
        code,
        path,
        ...(step ? { step } : {}),
        expected,
        actual: actual.slice(0, 300),
        recovery:
          'Retrieve the exact dependency contract, correct this path, and resubmit the complete proposal.'
      })
    )
  }
  const failure = (): AiRecipeAdmission =>
    Object.freeze({ ok: false, issues: Object.freeze(issues), omittedIssues })
  let detached: AiJsonValue
  try {
    detached = detachAiJsonValue(input)
  } catch (error) {
    issue('format', '', 'JSON-only proposal', reason(error))
    return failure()
  }
  if (
    new TextEncoder().encode(JSON.stringify(detached)).byteLength >
    options.limits.bytes
  ) {
    issue(
      'limit',
      '',
      'Proposal within configured byte limit',
      'Byte limit exceeded'
    )
    return failure()
  }
  if (
    !recipeRecord(detached) ||
    !exactKeys(detached, recipeFormatKeys.proposal) ||
    detached.format !== 1 ||
    !nonempty(detached.name) ||
    !nonempty(detached.description) ||
    !Number.isSafeInteger(detached.revision) ||
    (detached.revision as number) < 1 ||
    !Array.isArray(detached.steps) ||
    detached.steps.length === 0
  ) {
    issue(
      'format',
      '',
      'Version 1 recipe with identity, schemas, ordered steps and output',
      'Invalid recipe shape'
    )
    return failure()
  }
  if (detached.steps.length > options.limits.steps) {
    issue('limit', '/steps', 'Finite step budget', 'Step limit exceeded')
    return failure()
  }
  let inputSchema: RecipeSchema
  let outputSchema: RecipeSchema
  try {
    inputSchema = readRecipeSchema(detached.inputSchema)
    outputSchema = readRecipeSchema(detached.outputSchema)
  } catch (error) {
    issue(
      'schema',
      '',
      'Supported public input and output schemas',
      reason(error)
    )
    return failure()
  }
  const outputs = new Map<string, RecipeSchema>()
  const ids = new Set<string>()
  const dependencies = new Map<string, AiToolContract>()
  let bindings = 0
  const checkBinding = (
    binding: unknown,
    target: RecipeSchema,
    path: string,
    step?: string,
    depth = 0
  ): void => {
    bindings++
    if (
      bindings > options.limits.bindings ||
      depth > options.limits.bindingDepth
    ) {
      issue(
        'limit',
        path,
        'Finite binding budget',
        'Binding limit exceeded',
        step
      )
      return
    }
    if (!recipeRecord(binding)) {
      issue('binding', path, 'Typed binding', 'Invalid binding', step)
      return
    }
    const reject = (actual: string, code: AiRecipeIssue['code'] = 'binding') =>
      issue(code, path, target.type, actual, step)
    try {
      if (
        binding.kind === 'literal' &&
        exactKeys(binding, recipeFormatKeys.bindings.literal)
      ) {
        if (recipeCapturesValue(binding.value, target)) {
          reject(
            'Runtime values must come from current input or prior output',
            'captured-value'
          )
          return
        }
        const validation = options.validate(
          binding.value,
          target as unknown as AiJsonValue
        )
        if (validation !== undefined) reject(validation)
        return
      }
      if (
        (binding.kind === 'input' &&
          exactKeys(binding, recipeFormatKeys.bindings.input)) ||
        (binding.kind === 'step' &&
          exactKeys(binding, recipeFormatKeys.bindings.step))
      ) {
        if (typeof binding.path !== 'string') {
          reject('Expected JSON Pointer')
          return
        }
        let source = binding.kind === 'input' ? inputSchema : undefined
        if (binding.kind === 'step' && typeof binding.step === 'string')
          source = outputs.get(binding.step)
        if (!source) {
          reject('Output must belong to a valid earlier step')
          return
        }
        if (!recipeAssignable(recipeSchemaAt(source, binding.path), target))
          reject('Source schema does not guarantee the destination contract')
        return
      }
      if (target['x-runtime-value']) {
        reject(
          'Runtime values cannot be constructed in a saved recipe',
          'captured-value'
        )
        return
      }
      if (
        binding.kind === 'object' &&
        exactKeys(binding, recipeFormatKeys.bindings.object) &&
        target.type === 'object' &&
        recipeRecord(binding.fields)
      ) {
        const fields = binding.fields
        for (const key of target.required)
          if (!recipeOwn(fields, key)) reject(`Missing required field ${key}`)
        for (const [key, child] of Object.entries(fields)) {
          if (!recipeOwn(target.properties, key)) {
            reject(`Unknown destination field ${key}`)
            continue
          }
          checkBinding(
            child,
            target.properties[key],
            `${path}/fields/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`,
            step,
            depth + 1
          )
        }
        return
      }
      if (
        binding.kind === 'array' &&
        exactKeys(binding, recipeFormatKeys.bindings.array) &&
        target.type === 'array' &&
        Array.isArray(binding.items)
      ) {
        if (
          binding.items.length < (target.minItems ?? 0) ||
          binding.items.length > (target.maxItems ?? Infinity)
        )
          reject('Array length violates the destination contract')
        binding.items.forEach((child, index) =>
          checkBinding(
            child,
            target.items,
            `${path}/items/${index}`,
            step,
            depth + 1
          )
        )
        return
      }
      reject('Unsupported binding shape or destination type')
    } catch (error) {
      reject(reason(error))
    }
  }
  detached.steps.forEach((step: unknown, index: number) => {
    const path = `/steps/${index}`
    if (
      !recipeRecord(step) ||
      !exactKeys(step, recipeFormatKeys.step) ||
      !nonempty(step.id) ||
      !nonempty(step.tool) ||
      !Number.isSafeInteger(step.revision)
    ) {
      issue(
        'step',
        path,
        'Named step with exact tool revision and input binding',
        'Invalid step'
      )
      return
    }
    if (ids.has(step.id))
      issue(
        'step',
        `${path}/id`,
        'Unique step identity',
        'Duplicate step',
        step.id
      )
    ids.add(step.id)
    let contract: AiToolContract | undefined
    try {
      contract = options.resolve(step.tool)
    } catch (error) {
      issue(
        'dependency',
        path,
        'Available registered dependency',
        reason(error),
        step.id
      )
      return
    }
    if (
      step.tool === detached.name ||
      !contract ||
      contract.name !== step.tool ||
      contract.revision !== step.revision ||
      contract.composition !== 'allowed'
    ) {
      issue(
        'dependency',
        path,
        'Exact registered composition-eligible dependency',
        'Missing, self-referential, changed or ineligible dependency',
        step.id
      )
      return
    }
    try {
      const input = readRecipeSchema(contract.inputSchema)
      const output = readRecipeSchema(contract.outputSchema)
      const canonical = createAiToolContract(contract)
      const previous = dependencies.get(contract.name)
      if (
        previous &&
        previous !== canonical &&
        JSON.stringify(previous) !== JSON.stringify(canonical)
      ) {
        issue(
          'dependency',
          path,
          'Stable dependency contract during admission',
          'Dependency changed during admission',
          step.id
        )
        return
      }
      dependencies.set(contract.name, canonical)
      checkBinding(step.input, input, `${path}/input`, step.id)
      outputs.set(step.id, output)
    } catch (error) {
      issue(
        'schema',
        path,
        'Supported dependency input/output schemas',
        reason(error),
        step.id
      )
    }
  })
  checkBinding(detached.output, outputSchema, '/output')
  if (issues.length) return failure()
  const contracts = [...dependencies.values()]
  const effectOrder = ['read', 'prepare', 'mutation', 'external'] as const
  const effect =
    effectOrder[
      Math.max(
        ...contracts.map((contract) => effectOrder.indexOf(contract.effect))
      )
    ]
  const outputOrder = [
    'value',
    'request-artifact',
    'document-artifact'
  ] as const
  const output =
    outputOrder[
      Math.max(
        ...contracts.map((contract) =>
          outputOrder.indexOf(contract.lifecycle.output)
        )
      )
    ]
  const contract = createAiToolContract({
    name: detached.name,
    description: detached.description,
    revision: detached.revision as number,
    inputSchema: detached.inputSchema,
    outputSchema: detached.outputSchema,
    effect,
    resources: [
      ...new Set(contracts.flatMap((contract) => [...contract.resources]))
    ].sort(),
    composition: 'allowed',
    lifecycle: {
      cancellation: contracts.every(
        (contract) => contract.lifecycle.cancellation === 'cooperative'
      )
        ? 'cooperative'
        : 'before-dispatch',
      retry:
        effect === 'read' &&
        contracts.every((contract) => contract.lifecycle.retry === 'read-only')
          ? 'read-only'
          : 'never',
      output
    }
  })
  return Object.freeze({
    ok: true,
    value: Object.freeze({
      recipe: detached as unknown as AiRecipe,
      contract,
      dependencies: Object.freeze(contracts)
    })
  })
}
