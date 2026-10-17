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
  readRegisteredRecipeSchema,
  recipeValidationSchema,
  recipeResolve,
  recipeSelectVariant,
  recipeLiteralShape,
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
    !exactKeys(detached, [
      ...recipeFormatKeys.proposal,
      ...(recipeOwn(detached, 'iteration') ? ['iteration'] : [])
    ]) ||
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
  let stateSchema: RecipeSchema | undefined
  let bindings = 0
  const bindingShape = (binding: unknown, depth = 0): RecipeSchema => {
    if (depth > options.limits.bindingDepth || !recipeRecord(binding))
      return { type: 'opaque' }
    if (binding.kind === 'literal') return recipeLiteralShape(binding.value)
    if (
      binding.kind === 'state' &&
      stateSchema &&
      typeof binding.path === 'string'
    )
      return recipeSchemaAt(stateSchema, binding.path)
    if (binding.kind === 'input' && typeof binding.path === 'string')
      return recipeSchemaAt(inputSchema, binding.path)
    if (
      binding.kind === 'step' &&
      typeof binding.step === 'string' &&
      typeof binding.path === 'string'
    ) {
      const source = outputs.get(binding.step)
      return source ? recipeSchemaAt(source, binding.path) : { type: 'opaque' }
    }
    if (binding.kind === 'object' && recipeRecord(binding.fields))
      return {
        type: 'object',
        additionalProperties: false,
        required: Object.keys(binding.fields),
        properties: Object.fromEntries(
          Object.entries(binding.fields).map(([key, child]) => [
            key,
            bindingShape(child, depth + 1)
          ])
        )
      }
    if (binding.kind === 'array')
      return { type: 'array', items: { type: 'opaque' } }
    return { type: 'opaque' }
  }
  const checkBinding = (
    binding: unknown,
    target: RecipeSchema,
    path: string,
    step?: string,
    depth = 0
  ): void => {
    target = recipeResolve(target)
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
      if (target.type === 'never') {
        reject('The registered contract forbids this value')
        return
      }
      if (target.type === 'opaque') {
        reject('Opaque destination requires an explicit supported contract')
        return
      }
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
          recipeValidationSchema(target)
        )
        if (validation !== undefined) reject(validation)
        return
      }
      if (
        (binding.kind === 'state' &&
          exactKeys(binding, recipeFormatKeys.bindings.state)) ||
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
        if (binding.kind === 'state') source = stateSchema
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
      if (target.type === 'union') {
        const variant = recipeSelectVariant(bindingShape(binding), target)
        if (!variant) {
          reject(
            'A destination union requires an unambiguous declared discriminator'
          )
          return
        }
        checkBinding(binding, variant, path, step, depth + 1)
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
        if (target.uniqueItems && binding.items.length > 1) {
          const literalValues = binding.items.map((child) =>
            recipeRecord(child) &&
            child.kind === 'literal' &&
            (child.value === null ||
              ['string', 'number', 'boolean'].includes(typeof child.value))
              ? JSON.stringify(child.value)
              : undefined
          )
          if (
            literalValues.includes(undefined) ||
            new Set(literalValues).size !== literalValues.length
          )
            reject(
              'Array uniqueness is not proven by distinct primitive literals'
            )
        }
        binding.items.forEach((child, index) =>
          checkBinding(
            child,
            target.prefixItems?.[index] ?? target.items,
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
  const checkStep = (
    step: unknown,
    path: string
  ): AiToolContract | undefined => {
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
      const input = readRegisteredRecipeSchema(contract.inputSchema)
      const output = readRegisteredRecipeSchema(contract.outputSchema)
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
      return canonical
    } catch (error) {
      issue(
        'schema',
        path,
        'Supported dependency input/output schemas',
        reason(error),
        step.id
      )
    }
  }
  detached.steps.forEach((step, index) => checkStep(step, `/steps/${index}`))
  if (recipeOwn(detached, 'iteration')) {
    const iteration = detached.iteration
    if (
      !recipeRecord(iteration) ||
      !exactKeys(iteration, recipeFormatKeys.iteration) ||
      !nonempty(iteration.id) ||
      ids.has(iteration.id) ||
      !Array.isArray(iteration.repairs) ||
      !iteration.repairs.length ||
      !Number.isSafeInteger(iteration.maxIterations) ||
      (iteration.maxIterations as number) < 1
    ) {
      issue(
        'format',
        '/iteration',
        'Unique bounded typed iteration with repairs',
        'Invalid iteration'
      )
      return failure()
    }
    const rounds = iteration.maxIterations as number
    const expanded =
      detached.steps.length + 1 + rounds * (iteration.repairs.length + 1)
    if (!Number.isSafeInteger(expanded) || expanded > options.limits.steps) {
      issue(
        'limit',
        '/iteration/maxIterations',
        'Worst-case step budget',
        'Expanded iteration exceeds step limit'
      )
      return failure()
    }
    ids.add(iteration.id)
    const outerOutputs = new Map(outputs)
    try {
      const state = readRecipeSchema(iteration.stateSchema)
      checkBinding(iteration.state, state, '/iteration/state')
      stateSchema = state
      const checker = checkStep(iteration.check, '/iteration/check')
      if (!checker?.verification) {
        issue(
          'dependency',
          '/iteration/check',
          'Domain-owned verification capability',
          'Checker lacks verification metadata'
        )
      } else {
        const schema = readRegisteredRecipeSchema(checker.outputSchema)
        const status = recipeSchemaAt(schema, checker.verification.statusPath)
        const progress = recipeSchemaAt(
          schema,
          checker.verification.progressPath
        )
        const statusContract = readRecipeSchema({
          type: 'string',
          enum: ['pass', 'repairable', 'decision-required']
        })
        const progressContract = readRecipeSchema({
          type: 'string',
          minLength: 1
        })
        if (
          !recipeAssignable(status, statusContract) ||
          !recipeAssignable(progress, progressContract)
        )
          issue(
            'schema',
            '/iteration/check',
            'Required typed verification status and nonempty progress',
            'Verification output is not guaranteed'
          )
      }
      iteration.repairs.forEach((step, index) =>
        checkStep(step, `/iteration/repairs/${index}`)
      )
      checkBinding(iteration.next, state, '/iteration/next')
      stateSchema = undefined
      outputs.clear()
      for (const [id, schema] of outerOutputs) outputs.set(id, schema)
      if (checker)
        outputs.set(iteration.id, {
          type: 'object',
          additionalProperties: false,
          required: ['state', 'result', 'iterations'],
          properties: {
            state,
            result: readRegisteredRecipeSchema(checker.outputSchema),
            iterations: { type: 'integer', minimum: 0, maximum: rounds }
          }
        })
    } catch (error) {
      issue(
        'schema',
        '/iteration',
        'Closed typed iteration state and check',
        reason(error)
      )
    }
  }
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
