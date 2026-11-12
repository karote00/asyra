import { readFileSync, statSync, watchFile, unwatchFile } from 'node:fs'
import { join } from 'node:path'
import {
  localExecutionReceiptSchema,
  localToolOutcome
} from './local-tool-invocation'
import { operationContractIssue } from './operation-input-schema'

export interface EvaluationStopReason {
  kind: 'tool-failure' | 'work-deadline'
  message: string
  callId?: string
  tool?: string
}

const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/** Only owner-declared recoveries permit continuing; never infer them from prose. */
const correctableInput = (
  value: unknown,
  acknowledgement?: Record<string, unknown>
): boolean => {
  if (!record(value) || value.error) {
    return false
  }

  const outcome =
    acknowledgement ?? (record(value.toolOutcome) ? value.toolOutcome : value)

  if (
    acknowledgement &&
    ((value.settlement !== undefined &&
      value.settlement !== acknowledgement.settlement) ||
      (record(value.toolOutcome) &&
        (value.toolOutcome.status !== acknowledgement.status ||
          value.toolOutcome.settlement !== acknowledgement.settlement)))
  ) {
    return false
  }

  if (outcome.settlement === 'unknown' || outcome.status === 'unknown') {
    return false
  }

  // Discovery has completed a read, not rejected a pending mutation. Keep its
  // incomplete identity coverage without treating a selectable name as lost data.
  if (record(value.recovery) && value.recovery.kind === 'select_identity') {
    return (
      value.code === 'IDENTITY_UNRESOLVED' &&
      value.settlement === 'completed' &&
      outcome.settlement === 'completed' &&
      value.status === outcome.status &&
      ['partial', 'failed'].includes(String(outcome.status)) &&
      [value.issues, outcome.issues].every(
        (issues) =>
          issues === undefined ||
          (Array.isArray(issues) &&
            issues.every(
              (issue) => record(issue) && issue.code === 'IDENTITY_UNRESOLVED'
            ))
      )
    )
  }

  if (value.available === false && value.recovery === 'correct_input') {
    return (
      value.settlement === 'not-started' && outcome.settlement === 'not-started'
    )
  }

  if (record(value.recovery) && value.recovery.kind === 'select_reference') {
    return (
      value.available === false &&
      value.settlement === 'not-started' &&
      value.recovery.settlement === 'not-started' &&
      outcome.settlement === 'not-started' &&
      (outcome.status === undefined || outcome.status === 'failed') &&
      typeof value.code === 'string' &&
      [value.issues, outcome.issues].every(
        (issues) =>
          issues === undefined ||
          (Array.isArray(issues) &&
            issues.every((issue) => record(issue) && issue.code === value.code))
      )
    )
  }

  if (Array.isArray(value.references) && Array.isArray(value.actionResults)) {
    const references = value.references
    const failures = references.filter(
      (entry) => record(entry) && entry.available === false
    )
    const codes = new Set(
      failures.map((entry) => (entry as Record<string, unknown>).code)
    )

    codes.add('RESULT_PARTIAL')
    codes.add('RESULT_UNAVAILABLE')

    return (
      failures.length > 0 &&
      failures.every((entry) => correctableInput(entry)) &&
      references.every(
        (entry) =>
          record(entry) &&
          (correctableInput(entry) ||
            (entry.available === true &&
              typeof entry.referenceId === 'string' &&
              Number.isSafeInteger(entry.attachmentIndex)))
      ) &&
      value.actionResults.every(
        (entry) =>
          record(entry) &&
          record(entry.result) &&
          !evaluationToolStop(entry.result)
      ) &&
      [value.issues, outcome.issues].every(
        (issues) =>
          issues === undefined ||
          (Array.isArray(issues) &&
            issues.every((issue) => record(issue) && codes.has(issue.code)))
      )
    )
  }

  if (Array.isArray(value.saved) && record(value.failure)) {
    return (
      (!Array.isArray(outcome.issues) || outcome.issues.length === 0) &&
      correctableInput(value.failure)
    )
  }

  if (record(value.execution)) {
    return correctableInput(value.execution)
  }

  if (Array.isArray(value.parts)) {
    const parts = value.parts.filter(record)

    return (
      parts.length === value.parts.length &&
      parts.some((part) => correctableInput(part)) &&
      parts.every((part) => {
        if (correctableInput(part)) {
          return true
        }

        if (
          !Array.isArray(part.actionResults) ||
          !part.actionResults.length ||
          operationContractIssue(part, localExecutionReceiptSchema, {
            stage: 'output'
          })
        ) {
          return false
        }

        try {
          const completed = localToolOutcome(part)

          return (
            completed.status === 'success' &&
            completed.settlement === 'completed'
          )
        } catch {
          return false
        }
      })
    )
  }

  if (Array.isArray(value.calls) && Array.isArray(value.issues)) {
    if (!value.calls.length && record(value.value)) {
      return correctableInput(value.value)
    }

    const allCalls = value.calls.filter(record)
    const root = allCalls.at(-1)
    // Runtime appends the inline root after its step receipts. It summarizes
    // those children and has no separate owner recovery value.
    const calls =
      allCalls.length > 1 &&
      root &&
      !('stepId' in root) &&
      root.status === value.status &&
      root.settlement === value.settlement &&
      allCalls.slice(0, -1).every((call) => typeof call.stepId === 'string')
        ? allCalls.slice(0, -1)
        : allCalls
    const recovery = Array.isArray(value.recovery)
      ? value.recovery.filter(record)
      : []

    return (
      allCalls.length === value.calls.length &&
      calls.some((call) => call.status !== 'success') &&
      calls.every((call) =>
        call.status === 'success'
          ? call.settlement === 'completed'
          : call.status !== 'unknown' &&
            ['not-started', 'partial'].includes(String(call.settlement)) &&
            recovery.some((entry) => {
              if (!record(entry.value)) {
                return false
              }

              return (
                entry.callId === call.callId &&
                entry.status === call.status &&
                entry.settlement === call.settlement &&
                correctableInput(entry.value, entry)
              )
            })
      )
    )
  }

  return false
}

/** Read the first public failure once; never search arbitrary user data. */
export const evaluationToolStop = (
  value: unknown
): EvaluationStopReason | undefined => {
  if (!record(value)) {
    return undefined
  }

  if (typeof value.text === 'string') {
    try {
      const parsed: unknown = JSON.parse(value.text)
      const failure = evaluationToolStop(parsed)

      if (
        correctableInput(
          parsed,
          record(value.outcome) ? value.outcome : undefined
        )
      ) {
        return undefined
      }

      if (failure) {
        return failure
      }
    } catch {
      /* Non-JSON native text has no typed outcome. */
    }
  }

  if (correctableInput(value)) {
    return undefined
  }

  // Preserve a concrete child cause before an aggregate partial receipt masks it.
  if (Array.isArray(value.actionResults)) {
    for (const item of value.actionResults) {
      const failure = record(item) ? evaluationToolStop(item.result) : undefined

      if (failure) {
        return failure
      }
    }
  }

  const outcome = record(value.toolOutcome) ? value.toolOutcome : undefined
  const failed =
    value.success === false ||
    ['failed', 'partial', 'unknown'].includes(String(value.status)) ||
    ['failed', 'partial', 'unknown'].includes(String(outcome?.status)) ||
    Boolean(value.error)

  if (failed) {
    const issues = [outcome?.issues, value.issues].flatMap((items) =>
      Array.isArray(items)
        ? items.map((item) => (record(item) ? item.message : item))
        : []
    )
    const errorMessage = record(value.error) ? value.error.message : value.error
    const message = [value.message, errorMessage, ...issues].find(
      (item) => typeof item === 'string' && item.trim()
    )

    return {
      kind: 'tool-failure',
      message: (typeof message === 'string'
        ? message
        : `Tool outcome ${String(value.status ?? outcome?.status ?? 'failed')}`
      ).slice(0, 2000)
    }
  }

  // A successful diagnostic can report design findings that the AI can repair.
  // Only execution failures stop the evaluation; findings remain diagnostic data.
  return undefined
}

/** Evaluation-only, recorder-owned control; a different work window cannot stop this request. */
export const createEvaluationControl = (
  directory: string | undefined,
  workDeadlineAt: number,
  stop: (reason: EvaluationStopReason) => void
) => {
  if (!directory) {
    return undefined
  }

  const file = join(directory, 'evaluation-control.json')

  const read = () => {
    try {
      if (statSync(file).size > 8192) {
        return undefined
      }

      const value: unknown = JSON.parse(readFileSync(file, 'utf8'))

      return record(value) &&
        value.workDeadlineAt === workDeadlineAt &&
        value.stopOnFailure === true
        ? value
        : undefined
    } catch {
      return undefined
    }
  }

  if (!read()) {
    return undefined
  }

  let latched = false

  const finish = (reason: EvaluationStopReason) => {
    if (latched) {
      return
    }

    latched = true
    unwatchFile(file, changed)
    stop(reason)
  }

  const changed = () => {
    const reason = read()?.stop

    if (
      !record(reason) ||
      reason.kind !== 'tool-failure' ||
      typeof reason.message !== 'string' ||
      !reason.message.trim() ||
      reason.message.length > 2000
    ) {
      return
    }

    finish({
      kind: reason.kind as EvaluationStopReason['kind'],
      message: reason.message,
      ...(typeof reason.callId === 'string'
        ? { callId: reason.callId.slice(0, 256) }
        : {})
    })
  }

  watchFile(file, { interval: 100, persistent: false }, changed)

  return {
    stop: finish,

    dispose: () => {
      latched = true
      unwatchFile(file, changed)
    }
  }
}
