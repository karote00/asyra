import { randomUUID } from 'node:crypto'
import type {
  AiActionBatch,
  AiProviderInput
} from '../src/ai/action-batch-protocol'
import { operationInputIssue } from './operation-input-schema'

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

// The operation registry owns argument locations. Do not guess from API names.
const targetPath = (schema: unknown, field: string): string[] => {
  const paths: string[][] = []
  const visit = (value: unknown, path: string[]) => {
    if (!record(value) || !record(value.properties)) return
    for (const [key, child] of Object.entries(value.properties)) {
      if (key === field) paths.push([...path, key])
      else visit(child, [...path, key])
    }
  }
  visit(schema, [])
  if (paths.length !== 1)
    throw new Error(
      'Target reference needs one unambiguous registered argument path. Supply explicit arguments for this operation.'
    )
  return paths[0]
}

const assignTarget = (
  input: Record<string, unknown>,
  path: string[],
  value: unknown
): Record<string, unknown> => {
  const [key, ...rest] = path
  if (!rest.length) {
    if (Object.hasOwn(input, key))
      throw new Error('Invalid or conflicting target reference.')
    return { ...input, [key]: value }
  }
  const child = Object.hasOwn(input, key) ? input[key] : {}
  if (!record(child))
    throw new Error('Target reference ancestor must be an object.')
  return { ...input, [key]: assignTarget(child, rest, value) }
}

/** Expand request-owned identity references; canonical actions still admit every write. */
export const prepareOperationBatch = (
  operations: unknown,
  registered: AiProviderInput['actions'],
  resolveTargets?: (reference: unknown) => string[]
): AiActionBatch['actions'] => {
  if (!Array.isArray(operations) || !operations.length)
    throw new Error('A nonempty operations array is required.')
  const actions: AiActionBatch['actions'][number][] = []
  for (const operation of operations) {
    if (
      !record(operation) ||
      Object.keys(operation).some(
        (k) => !['name', 'arguments', 'target'].includes(k)
      ) ||
      !record(operation.arguments)
    )
      throw new Error('Invalid batch operation.')
    const definition = registered.find(
      (action) => action.name === operation.name
    )
    if (!definition) throw new Error('Unregistered batch operation.')
    const input = operation.arguments
    let inputs = [input]
    if (operation.target !== undefined) {
      const target = operation.target
      if (
        !record(target) ||
        !['elementId', 'elementIds'].includes(String(target.field))
      )
        throw new Error('Invalid or conflicting target reference.')
      const { field, ...reference } = target
      const path = targetPath(definition.inputSchema, String(field))
      // Validate conflicts before resolving any request-owned identity reference.
      assignTarget(input, path, undefined)
      if (!resolveTargets)
        throw new Error('Artifact references are unavailable.')
      const ids = resolveTargets(reference)
      if (field === 'elementIds') inputs = [assignTarget(input, path, ids)]
      else inputs = ids.map((elementId) => assignTarget(input, path, elementId))
    }
    for (const args of inputs) {
      const issue = operationInputIssue(args, definition.inputSchema)
      if (issue) throw new Error(issue)
      actions.push({
        id: randomUUID(),
        name: definition.name,
        arguments: args,
        summary: 'Updating the requested objects'
      })
    }
  }
  return actions
}
