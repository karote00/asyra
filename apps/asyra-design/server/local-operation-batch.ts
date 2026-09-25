import { randomUUID } from 'node:crypto'
import type {
  AiActionBatch,
  AiProviderInput
} from '../src/ai/action-batch-protocol'
import { operationInputIssue } from './operation-input-schema'

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

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
        !['elementId', 'elementIds'].includes(String(target.field)) ||
        Object.hasOwn(operation.arguments, String(target.field))
      )
        throw new Error('Invalid or conflicting target reference.')
      const { field, ...reference } = target
      if (!resolveTargets)
        throw new Error('Artifact references are unavailable.')
      const ids = resolveTargets(reference)
      if (field === 'elementIds') inputs = [{ ...input, elementIds: ids }]
      else inputs = ids.map((elementId) => ({ ...input, elementId }))
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
