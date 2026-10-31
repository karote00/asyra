import {
  aiRecipeInputSchema,
  embedAiToolSchema,
  type AiInvocation,
  type AiJsonValue,
  type AiToolOutcome
} from '@asyra/ai-agent-runtime'
import { AiDesignToolIds } from '../src/constants/ai-design'
import {
  toolResultObject,
  toolResultString,
  toolSemantics
} from '../src/ai/tool-contract'
import type { createLocalToolLibrary } from './local-tool-library'
import {
  LocalToolInputError,
  type LocalToolDefinition
} from './local-tool-invocation'
import { LocalToolAccess } from './local-tool-scheduler'
import { operationInputIssue } from './operation-input-schema'

const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties)
) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false
})
const identity = {
  name: toolResultString,
  revision: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER }
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const saved = {
  oneOf: [
    toolResultObject({
      status: { const: 'saved' },
      availability: { enum: ['candidate', 'eligible', 'suspended', 'retired'] },
      version: toolResultString
    }),
    toolResultObject({ status: { const: 'unsaved' }, issue: toolResultString })
  ]
}
const submitted = {
  oneOf: [
    toolResultObject(
      {
        ok: { const: true },
        ...identity,
        requestId: toolResultString,
        storage: saved
      },
      ['ok', 'name', 'revision', 'requestId']
    ),
    toolResultObject(
      {
        ok: { const: false },
        code: toolResultString,
        message: toolResultString,
        issues: { type: 'array' }
      },
      ['ok', 'code', 'message']
    )
  ]
}
const execution = toolResultObject(
  {
    status: { enum: ['success', 'partial', 'failed', 'unknown'] },
    settlement: { enum: ['not-started', 'completed', 'partial', 'unknown'] },
    calls: { type: 'array' },
    issues: { type: 'array', items: { type: 'string' } },
    recovery: { type: 'array' }
  },
  ['status', 'settlement', 'calls', 'issues']
)

export const registeredToolInvocationInstructions =
  'Invoke an exact available registered tool revision with fresh input. Primitive and reusable tools use the same secured leaf execution. The input must match its discovered contract. A composition stops on failed or partial prerequisites; inspect completed calls before any correction. Declared iteration stops on decision-required findings, unchanged progress, exhaustion or uncertain settlement. Execution success certifies only the declared mechanical work, not visual acceptance of the user request. Successful execution attempts saving independently. If storage is unsaved, use save_tool with receiptId, never repeat invocation to retry saving.'

/** The same invocation envelope serves native admission and selected discovery. */
export const registeredToolInvocationSchemas = (
  selected: {
    inputSchema?: unknown
    outputSchema?: unknown
    partialOutputSchema?: unknown
    recoveryOutputSchema?: unknown
  },
  pinned?: { name: string; revision: number },
  recovery?: unknown
) => {
  const output = (schema: unknown, requiredValue: boolean) =>
    toolResultObject(
      {
        execution: {
          ...execution,
          properties: {
            ...execution.properties,
            status: pinned
              ? {
                  enum: requiredValue
                    ? ['success']
                    : [
                        'failed',
                        'partial',
                        'unknown',
                        ...(schema === undefined ? [] : ['success'])
                      ]
                }
              : execution.properties.status,
            ...(schema === undefined
              ? { value: pinned ? false : true }
              : {
                  value: embedAiToolSchema(
                    schema as AiJsonValue,
                    '#/properties/execution/properties/value'
                  )
                }),
            ...(recovery === undefined
              ? {}
              : {
                  recovery: embedAiToolSchema(
                    recovery as AiJsonValue,
                    '#/properties/execution/properties/recovery'
                  )
                })
          },
          required: [
            ...execution.required,
            ...(requiredValue && schema !== undefined ? ['value'] : [])
          ],
          ...(pinned && !requiredValue && schema !== undefined
            ? {
                anyOf: [
                  { properties: { status: { not: { const: 'success' } } } },
                  { required: ['value'] }
                ]
              }
            : {})
        },
        ...(pinned
          ? {
              toolOutcome: toolResultObject({
                status: {
                  enum: requiredValue
                    ? ['success']
                    : ['partial', 'failed', 'unknown']
                },
                settlement: execution.properties.settlement
              })
            }
          : {}),
        storage: saved,
        receiptId: toolResultString
      },
      ['execution']
    )
  return {
    inputSchema: object(
      {
        name: pinned ? { const: pinned.name } : identity.name,
        revision: pinned ? { const: pinned.revision } : identity.revision,
        input: embedAiToolSchema(
          (selected.inputSchema ?? {}) as AiJsonValue,
          '#/properties/input'
        ),
        message: { type: 'string', minLength: 1, maxLength: 240 }
      },
      ['name', 'revision', 'input']
    ),
    outputSchema: output(selected.outputSchema, true),
    partialOutputSchema: output(
      selected.partialOutputSchema ?? selected.outputSchema,
      false
    ),
    recoveryOutputSchema: output(selected.recoveryOutputSchema, false)
  }
}

/** Native controls carry data only; Runtime owns admission, execution and saving. */
export const createLocalToolLibraryTools = (
  resolve: () => ReturnType<typeof createLocalToolLibrary>,
  context: () => Pick<
    AiInvocation,
    'parentCallId' | 'actor' | 'purpose' | 'purposeSource'
  > = () => ({}),
  project: (name: string, input: unknown, value: unknown) => unknown = (
    _name,
    _input,
    value
  ) => value
) => {
  // Keep canonical local references rooted at the native tool schema after nesting.
  const { $defs, ...proposal } = aiRecipeInputSchema as Record<
    string,
    AiJsonValue
  >
  const definition = (
    name: string,
    description: string,
    inputSchema: unknown,
    outputSchema: unknown
  ) => ({
    type: 'function' as const,
    name,
    description,
    inputSchema,
    ...toolSemantics(
      outputSchema,
      name === AiDesignToolIds.INVOKE_TOOL ? 'mutation' : 'prepare',
      name === AiDesignToolIds.INVOKE_TOOL
        ? ['tool-library', 'document']
        : ['tool-library']
    ),
    composition: 'control-plane' as const,
    executionAccess: LocalToolAccess.COORDINATOR
  })
  const definitions: (LocalToolDefinition & {
    type: 'function'
    executionAccess: LocalToolAccess
  })[] = [
    definition(
      AiDesignToolIds.SUBMIT_TOOL,
      'Submit a reusable finite recipe when existing tools do not provide the needed higher-level operation. Optional iteration declares typed state, one registered verification check, repair steps and a finite round budget; use only mechanically decidable repairs. First get exact dependency contracts through describe_design_apis and use each registeredName and revision as the recipe dependency identity; bind fresh inputs and earlier successful outputs. The proposal schema is the canonical Runtime format. Admission checks every field and dependency revision without executing. Repair returned issues with a new submissionId; never send JavaScript, callbacks, permissions or captured request IDs. Registration is private until a genuine successful invocation and durable save. Storage failure does not undo admission; retry save_tool without replay.',
      {
        ...object(
          {
            submissionId: toolResultString,
            proposal,
            expectedRevision: identity.revision
          },
          ['submissionId', 'proposal']
        ),
        $defs
      },
      submitted
    ),
    definition(
      AiDesignToolIds.INVOKE_TOOL,
      registeredToolInvocationInstructions,
      registeredToolInvocationSchemas({}).inputSchema,
      registeredToolInvocationSchemas({}).outputSchema
    ),
    definition(
      AiDesignToolIds.SAVE_TOOL,
      'Retry storage only, without executing product work. Supply a receiptId returned by invoke_tool to promote that exact successful revision. Without receiptId, save candidate metadata only; this does not prove usability. Invented, foreign or mismatched receipts are rejected.',
      object({ ...identity, receiptId: toolResultString }, [
        'name',
        'revision'
      ]),
      saved
    ),
    definition(
      AiDesignToolIds.MANAGE_TOOL,
      'Resume an explicitly named saved candidate through current admission, suspend an eligible revision, or permanently retire its immutable revision using remove. These operations never execute canvas actions. Suspended/retired tools cannot be invoked; remove does not undo prior drawings.',
      object({
        ...identity,
        operation: { enum: ['resume', 'suspend', 'remove'] }
      }),
      { anyOf: [submitted, saved] }
    )
  ]
  return {
    definitions,
    projectModelResult(name: string, input: unknown, value: unknown) {
      if (
        name !== AiDesignToolIds.INVOKE_TOOL ||
        !record(input) ||
        typeof input.name !== 'string' ||
        !record(value) ||
        !record(value.execution)
      ) {
        return value
      }
      const originalOutcome = record(value.toolOutcome)
        ? value.toolOutcome
        : {
            status: value.execution.status,
            settlement: value.execution.settlement
          }
      const projected = Object.hasOwn(value.execution, 'value')
        ? project(input.name, input.input, value.execution.value)
        : undefined
      return {
        ...value,
        execution: {
          ...value.execution,
          ...(Object.hasOwn(value.execution, 'value')
            ? { value: projected }
            : {}),
          ...(Array.isArray(value.execution.recovery)
            ? {
                recovery: value.execution.recovery.map((entry) =>
                  record(entry) &&
                  typeof entry.name === 'string' &&
                  Object.hasOwn(entry, 'value')
                    ? {
                        ...entry,
                        value: project(entry.name, undefined, entry.value)
                      }
                    : entry
                )
              }
            : {})
        },
        ...(record(projected) &&
        record(projected.toolOutcome) &&
        projected.toolOutcome.status !== 'success'
          ? {
              toolOutcome: {
                ...originalOutcome,
                status:
                  originalOutcome.status === 'success'
                    ? projected.toolOutcome.status
                    : originalOutcome.status,
                settlement: value.execution.settlement
              }
            }
          : {})
      }
    },
    invocationSchemas(name: string, input: unknown) {
      if (
        name !== AiDesignToolIds.INVOKE_TOOL ||
        !record(input) ||
        typeof input.name !== 'string' ||
        typeof input.revision !== 'number'
      ) {
        return
      }
      const selected = resolve().describe(input.name, input.revision)
      if (!selected) {
        return
      }
      return registeredToolInvocationSchemas(
        selected,
        { name: input.name, revision: input.revision },
        resolve().describeRecovery(input.name, input.revision)
      )
    },
    resultOutcome(
      _name: string,
      value: unknown
    ): AiToolOutcome & {
      issues: { code: string; message: string }[]
    } {
      if (!record(value)) {
        throw new Error('Library control returned no receipt')
      }
      if (record(value.execution)) {
        return {
          status: value.execution.status as AiToolOutcome['status'],
          settlement: value.execution.settlement as AiToolOutcome['settlement'],
          issues: []
        }
      }
      if (value.ok === false || value.status === 'unsaved') {
        return {
          status: 'failed',
          settlement: 'not-started',
          issues: [
            {
              code: String(value.code ?? 'TOOL_NOT_SAVED'),
              message: String(value.message ?? value.issue)
            }
          ]
        }
      }
      return { status: 'success', settlement: 'completed', issues: [] }
    },
    async call(
      name: string,
      input: unknown,
      signal: AbortSignal
    ): Promise<string> {
      signal.throwIfAborted()
      const selected = definitions.find((item) => item.name === name)
      if (!selected) {
        throw new LocalToolInputError('Unknown library control')
      }
      const issue = operationInputIssue(input, selected.inputSchema)
      if (issue || !record(input)) {
        throw new LocalToolInputError(
          issue ?? 'A control input object is required'
        )
      }
      const library = resolve()
      switch (name) {
        case AiDesignToolIds.SUBMIT_TOOL:
          return JSON.stringify(
            await library.submit({
              submissionId: input.submissionId as string,
              proposal: input.proposal,
              ...(input.expectedRevision === undefined
                ? {}
                : { expectedRevision: input.expectedRevision as number })
            })
          )
        case AiDesignToolIds.INVOKE_TOOL:
          return JSON.stringify(
            await library.invoke({
              ...context(),
              name: input.name as string,
              revision: input.revision as number,
              input: input.input,
              signal,
              ...(typeof input.message === 'string'
                ? { purpose: input.message, purposeSource: 'model-message' }
                : {})
            })
          )
        case AiDesignToolIds.SAVE_TOOL:
          return JSON.stringify(
            await library.save({
              name: input.name as string,
              revision: input.revision as number,
              ...(input.receiptId === undefined
                ? {}
                : { receiptId: input.receiptId as string })
            })
          )
        case AiDesignToolIds.MANAGE_TOOL:
          return JSON.stringify(
            input.operation === 'resume'
              ? await library.resume(
                  input.name as string,
                  input.revision as number
                )
              : await library.setState(
                  input.name as string,
                  input.revision as number,
                  input.operation === 'suspend' ? 'suspended' : 'retired'
                )
          )
        default:
          throw new LocalToolInputError('Unknown library control')
      }
    }
  }
}
