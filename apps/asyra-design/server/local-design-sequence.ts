import {
  localToolSchemaIsPortable,
  localToolResultFieldLifetimes
} from './local-tool-leases'
import {
  runtimeOperationSchema,
  operationInspectionSchema
} from './local-operation-batch'
import { modelToolResultSchemas } from '../src/ai/tool-contract'
import {
  embedAiToolSchema,
  registeredRecipeOutputAt,
  type AiJsonValue,
  type AiRecipeBinding,
  type AiToolContract
} from '@asyra/ai-agent-runtime'
import { resultNamePattern, resultAt } from '../src/ai/conversation-results'
import { getBasicApiContract } from '../src/ai/basic-api-catalog'
import { toolResultString } from '../src/ai/tool-contract'
import {
  LocalToolInputError,
  type LocalToolDefinition
} from './local-tool-invocation'
import { operationInputIssue } from './operation-input-schema'
import { registeredToolInvocationSchemas } from './local-tool-library-tools'
import { AiDesignToolIds } from '../src/constants/ai-design'

export const operationGroupName =
  'host_operations.' + AiDesignToolIds.EXECUTE_DESIGN

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const object = (properties: Record<string, unknown>, required: string[]) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false
})

const expression = (value: unknown) =>
  record(value) &&
  (((value.kind === 'step' || value.kind === 'state') &&
    typeof value.path === 'string') ||
    (value.kind === 'literal' &&
      Object.hasOwn(value, 'value') &&
      Object.keys(value).length === 2))

export const containsExpression = (value: unknown): boolean =>
  expression(value) ||
  (Array.isArray(value)
    ? value.some(containsExpression)
    : record(value) && Object.values(value).some(containsExpression))

const binding = (value: unknown): AiRecipeBinding => {
  if (expression(value)) {
    return value as AiRecipeBinding
  }

  if (!containsExpression(value)) {
    return { kind: 'literal', value: value as AiJsonValue }
  }

  if (Array.isArray(value)) {
    return { kind: 'array', items: value.map(binding) }
  }

  return {
    kind: 'object',
    fields: Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        binding(v)
      ])
    )
  }
}

const selector = object(
  {
    step: toolResultString,
    source: { const: 'input' },
    path: { type: 'string' }
  },
  ['path']
)
const selection = {
  type: 'object',
  minProperties: 1,
  propertyNames: { pattern: resultNamePattern },
  additionalProperties: selector
}
export const directResultDeliveryProperties = {
  retain: {
    description:
      'Save portable values in App conversation context without changing delivery. Returns save metadata, not another copy of the saved value.',
    'x-host-delivery': true,
    ...selection,
    additionalProperties: {
      ...selector,
      properties: { source: { const: 'input' }, path: { type: 'string' } }
    }
  },
  delivery: {
    description:
      'Independently select model-visible results. Omitted: final public result and images. Status: no work values or images. Fields: only selected values and images.',
    'x-host-delivery': true,
    anyOf: [
      { const: 'status' },
      object(
        {
          fields: {
            ...selection,
            additionalProperties: {
              ...selector,
              properties: {
                source: { const: 'input' },
                path: { type: 'string' }
              }
            }
          }
        },
        ['fields']
      )
    ]
  }
}

const storedFields = {
  ...selection,
  additionalProperties: object(
    {
      name: { type: 'string', pattern: resultNamePattern },
      path: { type: 'string' },
      view: {
        const: 'shape',
        description:
          'Return bounded names, types, array lengths and absolute field paths below this saved path, without values. Omit to read the value. Known paths bind directly without a read.'
      }
    },
    ['name', 'path']
  )
}
export const resultReceiptSchema = object(
  {
    saved: {
      type: 'array',
      items: object(
        {
          name: toolResultString,
          type: toolResultString,
          origin: object(
            {
              operation: toolResultString,
              step: toolResultString,
              source: { enum: ['input', 'result'] },
              path: { type: 'string', minLength: 0 }
            },
            ['operation', 'source', 'path']
          ),
          paths: {
            type: 'array',
            items: object(
              {
                path: { type: 'string', minLength: 0 },
                type: toolResultString,
                length: { type: 'integer' }
              },
              ['path', 'type']
            )
          }
        },
        ['name', 'type', 'paths', 'origin']
      )
    },
    stages: {
      type: 'array',
      items: object(
        {
          id: toolResultString,
          status: { enum: ['pending', 'prepared', 'applied', 'failed'] }
        },
        ['id', 'status']
      )
    },
    fields: { type: 'object' },
    failure: { type: 'object' },
    completed: { type: 'array', items: toolResultString },
    stopped: { type: 'array', items: toolResultString },
    issues: { type: 'array', items: toolResultString },
    toolOutcome: object(
      {
        status: { enum: ['success', 'partial', 'failed', 'unknown'] },
        settlement: {
          enum: ['not-started', 'completed', 'partial', 'unknown']
        },
        issues: { type: 'array', items: { type: 'object' } }
      },
      ['status', 'settlement', 'issues']
    )
  },
  ['saved', 'toolOutcome']
)

const batchOperationProperties = (batch?: LocalToolDefinition) => {
  const schema = batch?.inputSchema as
    | {
        properties?: {
          operations?: {
            items?: {
              properties?: { name?: { enum?: string[] }; target?: unknown }
            }
          }
        }
      }
    | undefined

  return schema?.properties?.operations?.items?.properties
}

export const sequenceDefinition = (batch?: LocalToolDefinition) => {
  const stepSchema = object(
    {
      name: toolResultString,
      id: toolResultString,
      arguments: {},
      target: batchOperationProperties(batch)?.target ?? false,
      selectAt: { const: 'step' },
      revision: { type: 'integer', minimum: 1 }
    },
    ['name', 'arguments']
  )
  const iterationSchema = object(
    {
      id: toolResultString,
      stateSchema: { type: 'object' },
      state: {},
      next: {},
      check: stepSchema,
      repairs: { type: 'array', minItems: 1, items: stepSchema },
      maxIterations: { type: 'integer', minimum: 1 }
    },
    ['id', 'stateSchema', 'state', 'next', 'check', 'repairs', 'maxIterations']
  )

  const stageSchema = object(
    {
      id: toolResultString,
      operations: { type: 'array', minItems: 1, items: stepSchema },
      iteration: iterationSchema,
      apply: { type: 'array', minItems: 1, items: stepSchema }
    },
    ['id', 'operations', 'apply']
  )

  const execution = registeredToolInvocationSchemas({})

  const either = (a: unknown, b: unknown) => ({
    anyOf: [a, b, resultReceiptSchema]
      .filter((v) => v !== undefined)
      .map((v, i) => embedAiToolSchema(v as AiJsonValue, '#/anyOf/' + i))
  })

  return {
    name: AiDesignToolIds.EXECUTE_DESIGN,
    revision: 12,
    description:
      'Execute decided work in one host call. For staged work use stages:[{id,operations,iteration?,apply}]: each stage prepares, checks/repairs when declared, and immediately applies before continuing. All operation IDs are globally unique; later stages bind earlier results. Independent preparation can overlap pending application only when the host proves safe access and resolved inputs. Use top-level retain to preserve useful stage context even without a known later consumer. Alternatively execute an ordered list of operations in one host call. Use the returned action name or an exact registered tool name and its ordinary arguments. Known operations share a canvas exchange. Name a step with id and put {kind:"step",step:"id",path:"/field"} in a later argument to bind its result. Request sequences check a declared optional result path at execution: if absent or empty, stop before its dependent operation without replaying completed work. Unknown paths and incompatible types reject before dispatch. Pass known IDs in arguments. A previous output and an artifact selector may fill separate argument slots of one action. Omit a target-bound argument and use target={field,artifactId,keys|keyPrefix} or {field,query:{scope:"region",bounds,filter}}. Set selectAt:"step" to resolve a region after earlier writes. An optional iteration declares stateSchema, initial state, check, repairs, next and maxIterations; {kind:"state",path:""} reads current state. Return to the agent for visual decisions. Bind decided steps directly. To save portable values in App conversation context send retain:{alias:{step:"id",path:"/field"}}; saving only adds saved names, producing operations, selected input/result paths and bounded shapes; it never changes delivery. Use that index to bind later fields directly; unused saves are valid. To retain selected authored parameters after a successful step, add source:"input" to its selector (paths address the operation ordinary arguments for every tool, without an /arguments wrapper). Request handles cannot be saved with retain; bind them within the current request. Whole-result retention requires wholeResultAllowed; guaranteedResultFields are safe named result selections. No dummy computation is needed. Use {kind:"named",name:"alias",path:""} in later arguments, including future turns. Within the same submission, an input alias resolves the declared authored parameters before execution; an output alias becomes a step dependency. Neither requires a model read or a prior call. Delivery alone selects model-visible results, independently of retention. Select an earlier step explicitly when its result or images are needed; omitted delivery returns the final public result and its images for ordinary sequences and stages, whether or not retain is present. For decisions use delivery:{fields:{label:{step:"id",path:"/field"}}}; omit step for the final result (ready batch: batch receipt). For a saved result read just a field with {delivery:{fields:{label:{name:"alias",path:"/field"}}}} and no operations; add view:"shape" to that field selector only when you need to discover a saved subtree path without retrieving its values. Use delivery:"status" if no values are needed. Never replay acknowledged work.',
    inputSchema: {
      examples: [
        {
          operations: [
            {
              id: 'first',
              name: 'design_workflow.prepare_and_apply_design',
              arguments: {
                inspection: 'defer',
                draft: {
                  type: 'group',
                  name: 'Panel',
                  children: [
                    {
                      type: 'rect',
                      name: 'Face',
                      key: 'face',
                      width: 100,
                      height: 80,
                      fill: '#287dc4'
                    }
                  ]
                }
              }
            },
            {
              id: 'second',
              name: 'design_workflow.prepare_and_apply_design',
              arguments: {
                inspection: 'defer',
                draft: {
                  type: 'group',
                  name: 'Second panel',
                  children: [
                    {
                      type: 'rect',
                      name: 'Face',
                      key: 'face',
                      x: 120,
                      width: {
                        kind: 'named',
                        name: 'panelInput',
                        path: '/children/0/width'
                      },
                      height: {
                        kind: 'named',
                        name: 'panelInput',
                        path: '/children/0/height'
                      },
                      fill: {
                        kind: 'named',
                        name: 'panelInput',
                        path: '/children/0/fill'
                      }
                    }
                  ]
                }
              }
            }
          ],
          retain: {
            panelInput: { step: 'first', source: 'input', path: '/draft' }
          },
          delivery: 'status'
        },
        {
          inspection: 'defer',
          stages: [
            {
              id: 'panel',
              operations: [
                {
                  id: 'source',
                  name: 'prepare_design',
                  arguments: {
                    draft: {
                      type: 'group',
                      name: 'Panel',
                      children: [
                        {
                          type: 'rect',
                          name: 'Face',
                          key: 'face',
                          width: 100,
                          height: 80,
                          fill: '#287dc4'
                        }
                      ]
                    }
                  }
                }
              ],
              apply: [
                {
                  name: 'apply_prepared_design',
                  arguments: {
                    artifactId: {
                      kind: 'step',
                      step: 'source',
                      path: '/artifactId'
                    }
                  }
                }
              ]
            }
          ],
          retain: {
            panelSource: { step: 'source', source: 'input', path: '/draft' }
          }
        }
      ],
      oneOf: [
        {
          ...object(
            {
              operations: { type: 'array', minItems: 1, items: stepSchema },
              stages: { type: 'array', minItems: 1, items: stageSchema },
              retain: selection,
              delivery: {
                anyOf: [
                  { const: 'status' },
                  object({ fields: selection }, ['fields'])
                ]
              },
              iteration: iterationSchema,
              inspection: operationInspectionSchema,
              message: { type: 'string', minLength: 1, maxLength: 1000 }
            },
            []
          ),
          oneOf: [
            { required: ['operations'], not: { required: ['stages'] } },
            {
              required: ['stages'],
              not: {
                anyOf: [
                  { required: ['operations'] },
                  { required: ['iteration'] }
                ]
              }
            }
          ]
        },
        object({ delivery: object({ fields: storedFields }, ['fields']) }, [
          'delivery'
        ])
      ]
    },
    outputSchema: either(batch?.outputSchema, execution.outputSchema),
    partialOutputSchema: either(
      batch?.partialOutputSchema,
      execution.partialOutputSchema
    ),
    lifecycle: {
      cancellation: 'cooperative' as const,
      retry: 'never' as const,
      output: 'request-artifact' as const
    },
    effect: 'mutation' as const,
    resources: ['document', 'request-artifacts'],
    composition: 'control-plane' as const
  }
}

export function createDesignSequencePlanner(
  batch: LocalToolDefinition | undefined,
  resolve: (name: string) => AiToolContract | undefined,
  batchContract: () => AiToolContract | undefined,
  validateGroup?: (operations: unknown) => void,
  bindArtifact?: (
    name: string,
    args: Record<string, unknown>,
    target: unknown,
    index: number
  ) => Record<string, unknown>
) {
  const item = batchOperationProperties(batch)
  const known = new Set(item?.name?.enum ?? [])

  const actionNames = new Map<string, string>()

  for (const name of known) {
    actionNames.set('design_operations.' + name, name)
    const semantic = getBasicApiContract(name)?.operation

    if (semantic) {
      actionNames.set(semantic, name)
    }
  }

  const canonical = (s: Record<string, unknown>) => {
    const name = actionNames.get(String(s.name))

    return name ? { ...s, name } : s
  }

  const plan = (input: Record<string, unknown>) => {
    const stages = input.stages as
      | {
          id: string
          operations: Record<string, unknown>[]
          iteration?: Record<string, unknown>
          apply: Record<string, unknown>[]
        }[]
      | undefined

    if (
      stages &&
      new Set(stages.map((stage) => stage.id)).size !== stages.length
    ) {
      throw new LocalToolInputError('Stage IDs must be unique')
    }

    const checkpoints: { after: string; iteration: Record<string, unknown> }[] =
      []
    const operations: Record<string, unknown>[] = stages
      ? stages.flatMap((stage) => {
          const prepare = stage.operations.map((s, i) => ({
            ...canonical(s),
            id: s.id ?? stage.id + '-prepare-' + (i + 1)
          }))

          if (stage.iteration) {
            const last = prepare.at(-1)

            if (!last) {
              throw new LocalToolInputError(
                'A stage requires preparation operations'
              )
            }

            checkpoints.push({
              after: String(last.id),
              iteration: stage.iteration
            })
          }

          return [
            ...prepare,
            ...stage.apply.map((s, i) => ({
              ...canonical(s),
              id: s.id ?? stage.id + '-apply-' + (i + 1)
            }))
          ]
        })
      : (input.operations as Record<string, unknown>[]).map(canonical)

    const isPlain = (s: Record<string, unknown>) =>
      known.has(String(s.name)) &&
      s.selectAt === undefined &&
      s.revision === undefined &&
      !containsExpression(s.arguments)

    const raw = (s: Record<string, unknown>) => ({
      name: s.name,
      arguments: s.arguments,
      ...(s.target === undefined ? {} : { target: s.target })
    })

    const ids = operations.map((s, i) => s.id ?? 'step-' + (i + 1))

    if (new Set(ids).size !== ids.length) {
      throw new LocalToolInputError('Operation IDs must be unique')
    }

    const selectedSteps = new Set<string>()

    for (const selectors of [
      input.retain,
      record(input.delivery) ? input.delivery.fields : undefined
    ]) {
      if (!record(selectors)) {
        continue
      }

      for (const selector of Object.values(selectors)) {
        if (!record(selector) || !Object.hasOwn(selector, 'step')) {
          continue
        }

        if (typeof selector.step !== 'string' || !ids.includes(selector.step)) {
          throw new LocalToolInputError(
            'Unknown selected step',
            'PREPARATION_REJECTED',
            'correct_input'
          )
        }

        if (selector.source === 'input') {
          const operation = operations[ids.indexOf(selector.step)]

          if (!containsExpression(operation.arguments)) {
            try {
              resultAt(operation.arguments, selector.path)
            } catch (error) {
              throw new LocalToolInputError(
                'Invalid authored input selection for ' +
                  selector.step +
                  ': ' +
                  (error instanceof Error
                    ? error.message
                    : 'Unavailable field'),
                'PREPARATION_REJECTED',
                'correct_input'
              )
            }
          }
        }

        selectedSteps.add(selector.step)
      }
    }

    for (const [alias, selector] of Object.entries(
      (input.retain ?? {}) as Record<
        string,
        { step?: string; source?: string; path: string }
      >
    )) {
      if (selector.step && selector.source !== 'input') {
        const operation = operations[ids.indexOf(selector.step)]
        const owner = operation && resolve(String(operation.name))

        if (
          owner &&
          (localToolResultFieldLifetimes(
            modelToolResultSchemas(owner).outputSchema
          ).requestScopedFields.includes(selector.path) ||
            !localToolSchemaIsPortable(
              registeredRecipeOutputAt(
                runtimeOperationSchema(
                  modelToolResultSchemas(owner).outputSchema
                ),
                selector.path,
                true
              )
            ))
        ) {
          throw new LocalToolInputError(
            'Nonportable result selection: ' +
              alias +
              ' (step ' +
              selector.step +
              ', path ' +
              selector.path +
              ')' +
              '. Select portable output fields or authored source input; request handles cannot be saved across turns.',
            'PREPARATION_REJECTED',
            'correct_input'
          )
        }
      }
    }

    if (
      !stages &&
      !selectedSteps.size &&
      !input.iteration &&
      operations.every(isPlain)
    ) {
      const { delivery: _delivery, retain: _retain, ...args } = input

      return { batch: { ...args, operations: operations.map(raw) } }
    }

    const lookup = (name: string, revision: unknown) => {
      const dep = resolve(name)

      if (dep?.composition === 'control-plane') {
        throw new LocalToolInputError(
          'Operation ' +
            dep.name +
            ' is a native control. Call its registered native tool directly with the same ordinary arguments; do not compose it or replay completed work.',
          'PREPARATION_REJECTED',
          'correct_input'
        )
      }

      if (
        !dep ||
        !['allowed', 'request'].includes(dep.composition ?? '') ||
        (revision !== undefined && dep.revision !== revision)
      ) {
        throw new LocalToolInputError(
          'Missing, ambiguous or ineligible operation: ' + name
        )
      }

      return dep
    }

    const grouped = (group: Record<string, unknown>[], id: string) => {
      const dep = batchContract()

      if (!dep || !batch) {
        throw new LocalToolInputError('Canvas operations unavailable')
      }

      const members = group.map(raw)

      for (const s of members) {
        if (
          s.target !== undefined &&
          operationInputIssue(s.target, item?.target)
        ) {
          throw new LocalToolInputError(
            'Invalid target selector',
            'PREPARATION_REJECTED',
            'correct_input'
          )
        }
      }

      // Validate all destinations before any effect. Actual membership belongs to the dispatch stage.
      validateGroup?.(members)

      return {
        id,
        tool: dep.name,
        revision: dep.revision,
        input: binding({
          operations: members,
          ...(input.inspection ? { inspection: input.inspection } : {})
        })
      }
    }

    const compile = (s: Record<string, unknown>, id: string, index = 0) => {
      s = canonical(s)
      const name = String(s.name)

      if (
        s.selectAt !== undefined &&
        !(record(s.target) && record(s.target.query))
      ) {
        throw new LocalToolInputError(
          'Step-time selection requires a region target'
        )
      }

      if (s.target !== undefined || s.selectAt !== undefined) {
        if (s.revision !== undefined) {
          lookup(name, s.revision)
        }

        if (!known.has(name)) {
          throw new LocalToolInputError(
            'Target selection requires a known operation with ready arguments'
          )
        }

        if (!containsExpression(s.arguments)) {
          const dep = lookup(name, s.revision)

          if (operationInputIssue(s.target, item?.target)) {
            throw new LocalToolInputError(
              'Invalid target selector',
              'PREPARATION_REJECTED',
              'correct_input'
            )
          }

          validateGroup?.([raw(s)])

          return {
            id,
            tool: dep.name,
            revision: dep.revision,
            input: binding({
              arguments: s.arguments,
              ...(s.target === undefined ? {} : { target: s.target }),
              ...(input.inspection ? { inspection: input.inspection } : {})
            })
          }
        }

        const targets = Array.isArray(s.target) ? s.target : [s.target]

        if (
          !bindArtifact ||
          !record(s.arguments) ||
          !targets.every(
            (t) => record(t) && typeof t.artifactId === 'string'
          ) ||
          operationInputIssue(s.target, item?.target)
        ) {
          throw new LocalToolInputError(
            'Dependent arguments require registered artifact target selectors'
          )
        }

        s = {
          ...s,
          arguments: bindArtifact(name, s.arguments, s.target, index)
        }
      }

      const dep = lookup(name, s.revision)
      const args = known.has(name)
        ? {
            arguments: s.arguments,
            ...(input.inspection ? { inspection: input.inspection } : {})
          }
        : s.arguments

      return {
        id,
        tool: dep.name,
        revision: dep.revision,
        input: binding(args)
      }
    }

    // A named result needs the individual registered action's output contract.
    // Consecutive anonymous ready operations keep one browser exchange.
    const referenced = new Set<string>(selectedSteps)

    const references = (v: unknown): void => {
      if (record(v) && v.kind === 'literal') {
        return
      }

      if (record(v) && v.kind === 'step' && typeof v.step === 'string') {
        referenced.add(v.step)

        return
      }

      if (Array.isArray(v)) {
        v.forEach(references)
      } else if (record(v)) {
        Object.values(v).forEach(references)
      }
    }

    references(input)
    const steps: ReturnType<typeof compile>[] = []
    let pending: Record<string, unknown>[] = []
    let lastId = ''

    const flush = () => {
      if (pending.length) {
        steps.push(grouped(pending, lastId))
        pending = []
      }
    }

    for (const [i, s] of operations.entries()) {
      const id = String(ids[i])

      if (!s.id && !referenced.has(id) && isPlain(s)) {
        pending.push(s)
        lastId = id
      } else {
        flush()
        steps.push(compile(s, id, i))
      }
    }

    flush()
    const loop = input.iteration as Record<string, unknown> | undefined

    const compileIteration = (loop: Record<string, unknown>) => ({
      ...loop,
      state: binding(loop.state),
      next: binding(loop.next),
      check: compile(
        loop.check as Record<string, unknown>,
        String(
          (loop.check as Record<string, unknown>).id ??
            String(loop.id) + '-check'
        )
      ),
      repairs: (loop.repairs as Record<string, unknown>[]).map((s, i) =>
        compile(s, String(s.id ?? String(loop.id) + '-repair-' + (i + 1)))
      )
    })

    const iteration = loop ? compileIteration(loop) : undefined
    const compiledCheckpoints = checkpoints.map((checkpoint) => ({
      after: checkpoint.after,
      iteration: compileIteration(checkpoint.iteration)
    }))
    const output = {
      kind: 'step',
      step: iteration ? loop?.id : steps.at(-1)?.id,
      path: iteration ? '/result' : ''
    }

    return {
      proposal: {
        name: 'design-sequence',
        format: 1,
        revision: 1,
        description: 'Execute the current design request.',
        inputSchema: { type: 'null' },
        outputSchema: { type: 'null' },
        steps,
        ...(iteration ? { iteration } : {}),
        ...(compiledCheckpoints.length
          ? { checkpoints: compiledCheckpoints }
          : {}),
        output
      }
    }
  }

  const wrapsInput = (name: string) =>
    known.has(String(canonical({ name }).name))

  return Object.assign(plan, {
    publicInputSchemaPath(name: string, step?: string) {
      if (step && name === operationGroupName) {
        return '/operations/0/arguments'
      }

      return wrapsInput(name) ? '/arguments' : ''
    },

    publicInput(name: string, input: unknown, step?: string) {
      if (
        step &&
        name === operationGroupName &&
        record(input) &&
        Array.isArray(input.operations) &&
        input.operations.length === 1 &&
        record(input.operations[0])
      ) {
        return input.operations[0].arguments
      }

      return wrapsInput(name) && record(input) ? input.arguments : input
    },

    authoredInput(operation: Record<string, unknown>) {
      const step = canonical(operation)

      return step.arguments
    }
  })
}

export function designStageOutcomes(
  input: Record<string, unknown>,
  calls: readonly { stepId?: string; status: string }[]
) {
  if (!Array.isArray(input.stages)) {
    return undefined
  }

  const outcomes = new Map(
    calls
      .filter((call) => call.stepId)
      .map((call) => [call.stepId, call.status])
  )

  return input.stages.map(
    (stage: {
      id: string
      operations: { id?: string }[]
      apply: { id?: string }[]
      iteration?: {
        id: string
        check: { id?: string }
        repairs: { id?: string }[]
      }
    }) => {
      const preparation = stage.operations.map(
        (step, i) => step.id ?? stage.id + '-prepare-' + (i + 1)
      )
      const application = stage.apply.map(
        (step, i) => step.id ?? stage.id + '-apply-' + (i + 1)
      )
      const loop = stage.iteration
      const checks = loop
        ? [
            loop.check.id ?? loop.id + '-check',
            ...loop.repairs.map(
              (step, i) => step.id ?? loop.id + '-repair-' + (i + 1)
            )
          ]
        : []
      let status = 'pending'

      if (preparation.every((id) => outcomes.get(id) === 'success')) {
        status = 'prepared'
      }

      if (
        [...preparation, ...application, ...checks].some(
          (id) => outcomes.has(id) && outcomes.get(id) !== 'success'
        )
      ) {
        status = 'failed'
      }

      if (application.every((id) => outcomes.get(id) === 'success')) {
        status = 'applied'
      }

      return { id: stage.id, status }
    }
  )
}
