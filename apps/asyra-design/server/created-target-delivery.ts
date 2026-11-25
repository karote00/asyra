import { AiDesignToolIds } from '../src/constants/ai-design'

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const workflow = 'design_workflow.' + AiDesignToolIds.PREPARE_AND_APPLY_DESIGN

function summary(value: unknown) {
  if (
    record(value) &&
    typeof value.createdTargetsName === 'string' &&
    typeof value.createdElementCount === 'number' &&
    Array.isArray(value.compositionIds) &&
    value.compositionIds.every((id) => typeof id === 'string')
  ) {
    return {
      createdElementCount: value.createdElementCount,
      compositionIds: value.compositionIds,
      createdTargetsName: value.createdTargetsName
    }
  }
}

// Preserve the exact recovery evidence and handles for each acknowledged part.
function omitSavedMapping(value: unknown): unknown {
  if (!record(value)) {
    return value
  }

  const { createdTargets: _mapping, ...receipt } = value

  if (Array.isArray(receipt.parts)) {
    receipt.parts = receipt.parts.map(omitSavedMapping)
  }

  return receipt
}

export type ProjectCreationText = (receipt: Record<string, unknown>) => unknown

/** Select from a validated Host receipt. Project text only after media extraction. */
export function defaultCreationProjection(
  name: string,
  value: unknown,
  completed: boolean,
  finalStep: () => string
): ProjectCreationText | undefined {
  if (name === workflow) {
    const selected = completed ? summary(value) : undefined

    return selected ? () => selected : undefined
  }

  if (
    name !== 'design_operations.' + AiDesignToolIds.EXECUTE_DESIGN ||
    !record(value) ||
    !record(value.execution)
  ) {
    return
  }

  const execution = value.execution
  const step = finalStep()
  const selected =
    completed &&
    execution.status === 'success' &&
    Array.isArray(execution.calls) &&
    execution.calls.findLast((call) => call.stepId === step)?.name === workflow
      ? summary(execution.value)
      : undefined
  const saved = new Set(
    Array.isArray(execution.recovery)
      ? execution.recovery
          .filter(
            (entry) =>
              entry.name === workflow &&
              entry.status === 'success' &&
              entry.settlement === 'completed' &&
              summary(entry.value)
          )
          .map((entry) => entry.callId)
      : []
  )

  if (!selected && !saved.size) {
    return
  }

  return (receipt) => {
    const body = receipt.execution

    if (!record(body)) {
      return receipt
    }

    return {
      ...receipt,
      execution: {
        ...body,
        ...(selected ? { value: selected } : {}),
        ...(saved.size && Array.isArray(body.recovery)
          ? {
              recovery: body.recovery.map((entry) =>
                saved.has(entry.callId)
                  ? { ...entry, value: omitSavedMapping(entry.value) }
                  : entry
              )
            }
          : {})
      }
    }
  }
}
