import {
  AiToolAccess,
  readNamedFields,
  resultNamePattern,
  type AiToolImage,
  type ExchangeConversationResults
} from '@asyra/ai-agent-runtime'
import {
  operationInputIssue,
  modelToolResultSchemas
} from '@asyra/ai-agent-runtime/schema'
import { AiDesignToolIds } from '../src/constants/ai-design'
import { toolSemantics } from '../src/ai/tool-contract'
import { AI_CONVERSATION_HISTORY_INSTRUCTIONS } from './ai-domain-prompt'
import type { LocalToolGroup } from './local-tool-host'

const savedInput = {
  type: 'object',
  additionalProperties: false,
  required: ['savedFields'],
  properties: {
    savedFields: {
      type: 'object',
      minProperties: 1,
      propertyNames: { pattern: resultNamePattern },
      additionalProperties: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'path'],
        properties: {
          name: { type: 'string', pattern: resultNamePattern },
          path: { type: 'string' },
          view: { const: 'shape' }
        }
      }
    }
  }
}
const savedOutput = {
  type: 'object',
  additionalProperties: false,
  required: ['fields', 'saved', 'toolOutcome'],
  properties: {
    fields: { type: 'object' },
    saved: { type: 'array', maxItems: 0 },
    toolOutcome: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'settlement', 'issues'],
      properties: {
        status: { const: 'success' },
        settlement: { const: 'completed' },
        issues: { type: 'array', maxItems: 0 }
      }
    }
  }
}
const resource = AiDesignToolIds.READ_DESIGN_RESOURCES

const has = <K extends string>(
  value: unknown,
  key: K
): value is Record<K, unknown> =>
  typeof value === 'object' && value !== null && Object.hasOwn(value, key)

const historyInput = {
  type: 'object',
  additionalProperties: false,
  required: ['history'],
  properties: {
    history: {
      type: 'object',
      additionalProperties: false,
      description: 'Read count prior turns starting at one-based start.',
      required: ['start', 'count'],
      properties: {
        start: { type: 'integer', minimum: 1 },
        count: { type: 'integer', minimum: 1 }
      }
    }
  }
}
const historyOutput = {
  type: 'object',
  additionalProperties: false,
  required: ['turns', 'total', 'guidance'],
  properties: {
    turns: { type: 'array', items: { type: 'object' } },
    total: { type: 'integer', minimum: 0 },
    guidance: { type: 'string' }
  }
}

export function withConversationResourceReads(
  owner: LocalToolGroup['owner'],
  exchange: ExchangeConversationResults | undefined,
  images: (images: AiToolImage[], name: string) => void,
  history?: readonly unknown[]
): LocalToolGroup['owner'] {
  if (!exchange && !history) {
    return owner
  }

  const contract = owner.definitions.find(
    (definition) => definition.name === resource
  )
  const inputs = [
    ...(contract ? [contract.inputSchema] : []),
    ...(exchange ? [savedInput] : []),
    ...(history ? [historyInput] : [])
  ]
  const outputs = [
    ...(contract ? [contract.outputSchema] : []),
    ...(exchange ? [savedOutput] : []),
    ...(history ? [historyOutput] : [])
  ]
  const description = [
    contract?.description,
    exchange && 'Read named fields with savedFields:{label:{name,path,view?}}.',
    history &&
      'Read previous turns with history:{start,count}, numbered from 1.'
  ]
    .filter(Boolean)
    .join(' ')
  const definition = {
    ...(contract ?? {
      name: resource,
      ...toolSemantics({ anyOf: outputs }, 'read', []),
      revision: 1,
      composition: 'request' as const,
      executionAccess: AiToolAccess.INDEPENDENT
    }),
    description,
    inputSchema: { oneOf: inputs },
    outputSchema: { anyOf: outputs }
  }

  const historyRead = (range: unknown, signal: AbortSignal) => {
    signal.throwIfAborted()
    if (
      !history ||
      !has(range, 'start') ||
      !has(range, 'count') ||
      typeof range.start !== 'number' ||
      typeof range.count !== 'number'
    ) {
      throw Error('Invalid conversation history range')
    }

    const start = range.start - 1

    return JSON.stringify({
      turns: history.slice(start, start + range.count),
      total: history.length,
      guidance: AI_CONVERSATION_HISTORY_INSTRUCTIONS.trim()
    })
  }

  const read = async (fields: unknown, signal: AbortSignal) => {
    signal.throwIfAborted()

    if (!exchange) {
      throw Error('Saved values are unavailable')
    }

    return JSON.stringify(
      await readNamedFields({ delivery: { fields } }, exchange, images)
    )
  }

  return {
    ...owner,
    definitions: contract
      ? owner.definitions.map((d) => (d === contract ? definition : d))
      : [...owner.definitions, definition],

    invocationSchemas(name, args, stage) {
      if (history && name === resource && has(args, 'history')) {
        return { inputSchema: historyInput, outputSchema: historyOutput }
      }

      if (exchange && name === resource && has(args, 'savedFields')) {
        return { inputSchema: savedInput, outputSchema: savedOutput }
      }

      return (
        owner.invocationSchemas?.(name, args, stage) ??
        (name === resource && contract
          ? {
              ...contract,
              ...(stage === 'model' ? modelToolResultSchemas(contract) : {})
            }
          : undefined)
      )
    },

    call(name, args, signal) {
      if (history && name === resource && has(args, 'history')) {
        return Promise.resolve(historyRead(args.history, signal))
      }

      return exchange && name === resource && has(args, 'savedFields')
        ? read(args.savedFields, signal)
        : owner.call(name, args, signal)
    },

    callInternal(name, args, signal) {
      if (history && name === resource && has(args, 'history')) {
        return Promise.resolve(historyRead(args.history, signal))
      }

      return exchange && name === resource && has(args, 'savedFields')
        ? read(args.savedFields, signal)
        : (owner.callInternal ?? owner.call).call(owner, name, args, signal)
    },

    projectModelResult(name, args, value) {
      if (
        name === resource &&
        (has(args, 'savedFields') || has(args, 'history'))
      ) {
        return value
      }

      return owner.projectModelResult
        ? owner.projectModelResult(name, args, value)
        : value
    },

    resultIssue(name, value) {
      if (history && name === resource && has(value, 'turns')) {
        return operationInputIssue(value, historyOutput)
      }

      if (name === resource && has(value, 'fields') && has(value, 'saved')) {
        return operationInputIssue(value, savedOutput)
      }

      return owner.resultIssue?.(name, value)
    }
  }
}
